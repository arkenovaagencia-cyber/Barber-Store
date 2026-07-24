const loginView = document.getElementById("loginView");
const dashboardView = document.getElementById("dashboardView");
const panelError = document.getElementById("panelError");

const CIRC = 326.7; // 2 * PI * 52

function showLoginError(msg){
  panelError.textContent = msg;
  panelError.style.display = "block";
}

async function checkIsAdmin(userId){
  const { data, error } = await supabaseClient
    .from("profiles").select("is_admin").eq("id", userId).single();
  if(error || !data) return false;
  return data.is_admin === true;
}

document.getElementById("panelLoginBtn").addEventListener("click", async () => {
  panelError.style.display = "none";
  const email = document.getElementById("panelEmail").value.trim();
  const password = document.getElementById("panelPassword").value;

  if(!email || !password){
    showLoginError("Completa correo y contraseña.");
    return;
  }

  const { data, error } = await supabaseClient.auth.signInWithPassword({ email, password });
  if(error){
    showLoginError("Correo o contraseña incorrectos.");
    return;
  }

  const isAdmin = await checkIsAdmin(data.user.id);
  if(!isAdmin){
    showLoginError("Esta cuenta no tiene permisos de administrador.");
    await supabaseClient.auth.signOut();
    return;
  }

  loadDashboard();
});

document.getElementById("logoutPanelBtn").addEventListener("click", async () => {
  await supabaseClient.auth.signOut();
  location.reload();
});

document.querySelectorAll(".tab").forEach(tab => {
  tab.addEventListener("click", () => {
    document.querySelectorAll(".tab").forEach(t => t.classList.remove("active"));
    tab.classList.add("active");
    const target = tab.dataset.tab;
    document.getElementById("tabPedidos").style.display = target === "pedidos" ? "block" : "none";
    document.getElementById("tabClientes").style.display = target === "clientes" ? "block" : "none";
  });
});

function animateRing(elId, value, max){
  const el = document.getElementById(elId);
  const ratio = max > 0 ? Math.min(value / max, 1) : 0;
  const offset = CIRC - (ratio * CIRC * 0.82); // deja un pequeño hueco visual
  requestAnimationFrame(() => { el.style.strokeDashoffset = offset; });
}

async function loadDashboard(){
  loginView.style.display = "none";
  dashboardView.style.display = "block";
  loadOrders();
  loadCustomers();
  loadStockRequestsCount();
}

async function loadOrders(){
  const { data: orders, error } = await supabaseClient
    .from("orders").select("*").order("created_at", { ascending: false });

  const list = document.getElementById("ordersList");

  if(error){
    list.innerHTML = `<p>Error cargando pedidos: ${error.message}</p>`;
    return;
  }

  document.getElementById("statOrders").textContent = orders.length;
  animateRing("fillOrders", orders.length, Math.max(orders.length, 10));

  if(orders.length === 0){
    list.innerHTML = `<p>Todavía no hay pedidos.</p>`;
    return;
  }

  list.innerHTML = orders.map((o, i) => {
    const fecha = new Date(o.created_at).toLocaleString("es-DO", { dateStyle: "medium", timeStyle: "short" });
    const isPaid = o.payment_status === "Pagado con PayPal";
    const num = String(orders.length - i).padStart(4, "0");
    return `
      <div class="order">
        <div>
          <div class="order-id">#${num}</div>
          <div class="order-name">${o.customer_name.toUpperCase()}</div>
          <div class="order-meta">${fecha} · RD$${Number(o.total_dop).toLocaleString("es-DO")}</div>
          <div class="order-meta" style="margin-top:6px;">
            ${o.items} — Tel: ${o.customer_phone} — ${o.customer_address}
          </div>
        </div>
        <div class="badge ${isPaid ? "paid" : ""}">${o.payment_status.toUpperCase()}</div>
      </div>
    `;
  }).join("");
}

async function loadCustomers(){
  const { data: customers, error } = await supabaseClient
    .from("profiles").select("full_name, phone, created_at").order("created_at", { ascending: false });

  const list = document.getElementById("customersList");

  if(error){
    list.innerHTML = `<p>Error cargando clientes: ${error.message}</p>`;
    return;
  }

  document.getElementById("statCustomers").textContent = customers.length;
  animateRing("fillCustomers", customers.length, Math.max(customers.length, 10));

  if(customers.length === 0){
    list.innerHTML = `<p>Todavía no hay clientes registrados.</p>`;
    return;
  }

  list.innerHTML = customers.map(c => {
    const fecha = new Date(c.created_at).toLocaleDateString("es-DO", { dateStyle: "medium" });
    return `
      <div class="customer-row">
        <span>${c.full_name || "Sin nombre"}</span>
        <span style="color:var(--text-dim);">${fecha}</span>
      </div>
    `;
  }).join("");
}

async function loadStockRequestsCount(){
  const { count, error } = await supabaseClient
    .from("stock_notifications").select("*", { count: "exact", head: true });
  if(!error){
    document.getElementById("statStockRequests").textContent = count || 0;
    animateRing("fillStock", count || 0, Math.max(count || 0, 10));
  }
}

// Si ya hay sesión de admin activa, entrar directo
(async () => {
  const { data } = await supabaseClient.auth.getSession();
  if(data.session){
    const isAdmin = await checkIsAdmin(data.session.user.id);
    if(isAdmin) loadDashboard();
  }
})();
