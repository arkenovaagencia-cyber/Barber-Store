const BUSINESS_WHATSAPP = "18292865680";
const BUSINESS_NAME = "Jeurisito Supply";

function notifyNetlify(formName, data){
  const body = new URLSearchParams({ "form-name": formName, ...data }).toString();
  fetch("/", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body
  }).catch(err => console.warn("No se pudo notificar por Netlify Forms:", err));
}

async function saveOrderToSupabase({ name, phone, address, summary, totalDop, totalUsd, paymentStatus }){
  try{
    if(typeof supabaseClient === "undefined") return;
    let customerId = null;
    let customerEmail = null;
    try{
      const { data } = await supabaseClient.auth.getSession();
      if(data.session){
        customerId = data.session.user.id;
        customerEmail = data.session.user.email;
      }
    } catch(e){}

    await supabaseClient.from("orders").insert({
      customer_id: customerId,
      customer_name: name,
      customer_email: customerEmail,
      customer_phone: phone,
      customer_address: address,
      items: summary,
      total_dop: totalDop,
      total_usd: totalUsd || null,
      payment_method: paymentStatus.includes("PayPal") ? "PayPal" : "Contra entrega",
      payment_status: paymentStatus
    });
  } catch(err){
    console.warn("No se pudo guardar el pedido en Supabase:", err);
  }
}

let cart = [];
try{
  const stored = localStorage.getItem("jeurisito_cart");
  cart = stored ? JSON.parse(stored) : [];
} catch(e){ cart = []; }

const total = cart.reduce((sum,i) => sum + i.price*i.qty, 0);

function renderSummary(){
  const list = document.getElementById("checkoutItems");
  if(cart.length === 0){
    list.innerHTML = `<li class="empty">Tu carrito está vacío. <a href="index.html#tienda">Vuelve a la tienda</a>.</li>`;
    document.getElementById("waPayBtn").disabled = true;
    return;
  }
  list.innerHTML = cart.map(i => `
    <li class="cart-item">
      <span>${i.icon} ${i.name} × ${i.qty}</span>
      <span>RD$${(i.price*i.qty).toLocaleString("es-DO")}</span>
    </li>
  `).join("");
  document.getElementById("checkoutTotal").textContent = `RD$${total.toLocaleString("es-DO")}`;

  const usd = (total / (typeof DOP_TO_USD_RATE !== "undefined" ? DOP_TO_USD_RATE : 59)).toFixed(2);
  document.getElementById("checkoutUsdNote").textContent = `≈ US$${usd} al pagar con PayPal`;
}
renderSummary();

document.getElementById("year").textContent = new Date().getFullYear();

// ===== WhatsApp fallback checkout =====
document.getElementById("waPayBtn").addEventListener("click", () => {
  const name = document.getElementById("buyerName").value.trim();
  const phone = document.getElementById("buyerPhone").value.trim();
  const address = document.getElementById("buyerAddress").value.trim();

  if(!name || !phone || !address){
    alert("Completa tus datos de entrega antes de continuar.");
    return;
  }
  const summary = cart.map(i => `${i.qty}x ${i.name}`).join(", ");
  const msg = `Hola, quiero completar mi pedido en ${BUSINESS_NAME}:\n` +
              `Productos: ${summary}\n` +
              `Total: RD$${total.toLocaleString("es-DO")}\n` +
              `Nombre: ${name}\nTeléfono: ${phone}\nDirección: ${address}`;
  window.open(`https://wa.me/${BUSINESS_WHATSAPP}?text=${encodeURIComponent(msg)}`, "_blank");

  notifyNetlify("pedidos", {
    name, phone, address, items: summary,
    total: `RD$${total.toLocaleString("es-DO")}`,
    metodo: "WhatsApp (efectivo/transferencia)"
  });

  saveOrderToSupabase({
    name, phone, address, summary,
    totalDop: total,
    paymentStatus: "Pago contra entrega"
  });
});

// ===== PayPal =====
function initPayPal(){
  const container = document.getElementById("paypal-button-container");
  const missingNote = document.getElementById("paypalMissing");

  if(typeof PAYPAL_CLIENT_ID === "undefined" || PAYPAL_CLIENT_ID === "PON_AQUI_TU_PAYPAL_CLIENT_ID" || cart.length === 0){
    missingNote.style.display = "block";
    return;
  }

  const usdAmount = (total / (typeof DOP_TO_USD_RATE !== "undefined" ? DOP_TO_USD_RATE : 59)).toFixed(2);
  const script = document.createElement("script");
  script.src = `https://www.paypal.com/sdk/js?client-id=${PAYPAL_CLIENT_ID}&currency=${typeof PAYPAL_CURRENCY !== "undefined" ? PAYPAL_CURRENCY : "USD"}`;
  script.onload = () => {
    if(typeof paypal === "undefined") { missingNote.style.display = "block"; return; }
    paypal.Buttons({
      style: { layout: "vertical", color: "blue", shape: "rect", label: "paypal" },
      createOrder: (data, actions) => {
        return actions.order.create({
          purchase_units: [{
            description: `Pedido ${BUSINESS_NAME}`,
            amount: { value: usdAmount }
          }]
        });
      },
      onApprove: (data, actions) => {
        return actions.order.capture().then(() => {
          const name = document.getElementById("buyerName").value.trim();
          const phone = document.getElementById("buyerPhone").value.trim();
          const address = document.getElementById("buyerAddress").value.trim();
          const summary = cart.map(i => `${i.qty}x ${i.name}`).join(", ");

          notifyNetlify("pedidos", {
            name, phone, address, items: summary,
            total: `US$${usdAmount} (RD$${total.toLocaleString("es-DO")})`,
            metodo: "PayPal — PAGADO ✔"
          });

          saveOrderToSupabase({
            name, phone, address, summary,
            totalDop: total,
            totalUsd: usdAmount,
            paymentStatus: "Pagado con PayPal"
          });

          localStorage.removeItem("jeurisito_cart");
          document.querySelector(".checkout-wrap").innerHTML = `
            <div class="checkout-success">
              <h2>¡Pago confirmado! 🎉</h2>
              <p>Gracias por tu compra en ${BUSINESS_NAME}. Te contactaremos para coordinar la entrega.</p>
              <a href="index.html" class="btn btn-primary">Volver al inicio</a>
            </div>`;
        });
      },
      onError: (err) => {
        console.error("Error de PayPal:", err);
        alert("Hubo un problema procesando el pago. Intenta de nuevo o usa la opción de WhatsApp.");
      }
    }).render("#paypal-button-container");
  };
  script.onerror = () => { missingNote.style.display = "block"; };
  document.head.appendChild(script);
}
initPayPal();
