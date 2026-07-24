// =========================================================
// CONFIGURACIÓN DEL NEGOCIO — cambia esto por tus datos reales
// =========================================================
const BUSINESS_WHATSAPP = "18292865680"; // 1 (código de República Dominicana) + 8292865680
const BUSINESS_EMAIL = "contacto@jeurisitosupply.com"; // <-- CAMBIA esto por tu correo real
const BUSINESS_NAME = "Jeurisito Supply";

// ===== DATA =====
const STYLES = [
  { name:"Fade bajo", desc:"Degradado que arranca cerca de la nuca, deja largo arriba. Limpio y versátil.", icon:"⇩", color:"#16233D", tags:["Fade","Clásico"] },
  { name:"Fade alto", desc:"Degradado agresivo que sube rápido. Contraste marcado, look moderno.", icon:"⇧", color:"#A81F26", tags:["Fade","Urbano"] },
  { name:"Taper clásico", desc:"Cierre suave en las orillas sin perder volumen arriba. El de toda la vida.", icon:"≡", color:"#16233D", tags:["Taper","Clásico"] },
  { name:"Corte + diseño", desc:"Líneas y patrones afeitados a navaja sobre el fade. Firma personal.", icon:"✎", color:"#1F3F73", tags:["Diseño","Navaja"] },
  { name:"Barba perfilada", desc:"Contorno definido a navaja, jabón caliente y toalla. Termina con aceite.", icon:"◡", color:"#16233D", tags:["Barba","Navaja"] },
  { name:"Afeitado clásico", desc:"Navaja recta de principio a fin. La experiencia completa de barbería.", icon:"⟍", color:"#A81F26", tags:["Navaja","Clásico"] },
];

// Los productos ahora viven en js/products-data.js (PRODUCTS_LIST, getProductsByTab)

// ===== STATE =====
let cart = [];
let activeTab = "clientes";

// ===== LOADER =====
window.addEventListener("load", () => {
  const loader = document.getElementById("bladeLoader");
  setTimeout(() => loader.classList.add("done"), 400);
});

// ===== RENDER STYLES =====
function renderStyles(){
  const grid = document.getElementById("stylesGrid");
  grid.innerHTML = STYLES.map((s,i) => `
    <div class="style-card reveal" style="transition-delay:${i*70}ms">
      <div class="swatch" style="background:${s.color}">${s.icon}</div>
      <h3>${s.name}</h3>
      <p>${s.desc}</p>
      <div class="tags">${s.tags.map(t=>`<span>${t}</span>`).join("")}</div>
    </div>
  `).join("");
  observeReveals();
}

// ===== RENDER PRODUCTS =====
function productThumbHTML(p){
  if(p.image){
    return `<img src="${p.image}" alt="${p.name}" class="product-thumb product-thumb-img">`;
  }
  return `<div class="product-thumb" style="background:${p.color}">${p.icon}</div>`;
}

function renderProducts(){
  const grid = document.getElementById("productsGrid");
  const items = getProductsByTab(activeTab);
  grid.innerHTML = items.map((p, i) => `
    <div class="product-card reveal" style="transition-delay:${i*70}ms">
      <a href="product.html?id=${p.id}" class="product-thumb-link">
        ${productThumbHTML(p)}
      </a>
      <div class="cat">${p.cat}</div>
      <a href="product.html?id=${p.id}" class="product-name-link"><h4>${p.name}</h4></a>
      <div class="price">RD$${p.price.toLocaleString("es-DO")}</div>
      <div class="cta-row">
        <button class="btn-buy-now" data-id="${p.id}">Comprar ahora</button>
        <button class="add-btn" data-id="${p.id}" aria-label="Añadir al carrito">+ carrito</button>
      </div>
      <a href="product.html?id=${p.id}" class="view-link">Ver producto completo →</a>
      <a class="wa-link" target="_blank" rel="noopener"
         href="https://wa.me/${BUSINESS_WHATSAPP}?text=${encodeURIComponent(`Hola, me interesa comprar: ${p.name} (RD$${p.price})`)}">
        Preguntar por WhatsApp
      </a>
    </div>
  `).join("");
  observeReveals();

  grid.querySelectorAll(".add-btn").forEach(btn => {
    btn.addEventListener("click", () => {
      const product = getProductById(btn.dataset.id);
      addToCart(product);
      btn.textContent = "Añadido ✓";
      btn.classList.add("added");
      setTimeout(() => { btn.textContent = "+ carrito"; btn.classList.remove("added"); }, 1200);
    });
  });

  grid.querySelectorAll(".btn-buy-now").forEach(btn => {
    btn.addEventListener("click", () => {
      const product = getProductById(btn.dataset.id);
      addToCart(product);
      openCart();
    });
  });
}

// ===== TABS =====
document.querySelectorAll(".tab").forEach(tab => {
  tab.addEventListener("click", () => {
    document.querySelectorAll(".tab").forEach(t => { t.classList.remove("active"); t.setAttribute("aria-selected","false"); });
    tab.classList.add("active");
    tab.setAttribute("aria-selected","true");
    activeTab = tab.dataset.tab;
    renderProducts();
  });
});

// ===== CART =====
function addToCart(product){
  const existing = cart.find(i => i.name === product.name);
  if(existing){ existing.qty += 1; }
  else{ cart.push({ ...product, qty:1 }); }
  renderCart();
}
function removeFromCart(name){
  cart = cart.filter(i => i.name !== name);
  renderCart();
}
function renderCart(){
  const list = document.getElementById("cartItems");
  const totalEl = document.getElementById("cartTotal");
  const countEl = document.getElementById("cartCount");
  const total = cart.reduce((sum,i) => sum + i.price*i.qty, 0);
  const count = cart.reduce((sum,i) => sum + i.qty, 0);

  if(cart.length === 0){
    list.innerHTML = `<li class="empty">Tu carrito está vacío.</li>`;
  } else {
    list.innerHTML = cart.map(i => `
      <li class="cart-item">
        <span>${i.icon} ${i.name} × ${i.qty}</span>
        <span>
          RD$${(i.price*i.qty).toLocaleString("es-DO")}
          <button class="remove" data-name="${i.name}" aria-label="Quitar">✕</button>
        </span>
      </li>
    `).join("");
    list.querySelectorAll(".remove").forEach(btn => {
      btn.addEventListener("click", () => removeFromCart(btn.dataset.name));
    });
  }

  totalEl.textContent = `RD$${total.toLocaleString("es-DO")}`;
  countEl.textContent = count;

  try{ localStorage.setItem("jeurisito_cart", JSON.stringify(cart)); }
  catch(e){ /* almacenamiento no disponible */ }
  if(typeof cartSyncToServer === "function") cartSyncToServer(cart);

  // Sticky checkout bar
  const sticky = document.getElementById("stickyCta");
  document.getElementById("stickyCount").textContent = count;
  document.getElementById("stickyTotal").textContent = `RD$${total.toLocaleString("es-DO")}`;
  sticky.classList.toggle("show", count > 0);
}

const cartDrawer = document.getElementById("cartDrawer");
const cartOverlay = document.getElementById("cartOverlay");
function openCart(){
  cartDrawer.classList.add("open");
  cartOverlay.classList.add("open");
}
function closeCart(){
  cartDrawer.classList.remove("open");
  cartOverlay.classList.remove("open");
}
document.getElementById("cartBtn").addEventListener("click", openCart);
document.getElementById("cartClose").addEventListener("click", closeCart);
cartOverlay.addEventListener("click", closeCart);

function goToCheckout(){
  if(cart.length === 0){ alert("Tu carrito está vacío."); return; }
  window.location.href = "checkout.html";
}
document.getElementById("checkoutBtn").addEventListener("click", goToCheckout);
document.getElementById("stickyCheckout").addEventListener("click", goToCheckout);

// ===== MOBILE NAV =====
const navLinks = document.getElementById("navLinks");
document.getElementById("burger").addEventListener("click", () => {
  const isOpen = navLinks.style.display === "flex";
  navLinks.style.display = isOpen ? "none" : "flex";
  navLinks.style.flexDirection = "column";
  navLinks.style.position = "absolute";
  navLinks.style.top = "100%";
  navLinks.style.left = "0";
  navLinks.style.right = "0";
  navLinks.style.background = "#FAFAF8";
  navLinks.style.padding = "20px 24px";
  navLinks.style.gap = "18px";
  navLinks.style.borderBottom = "1px solid rgba(28,27,26,0.12)";
});
navLinks.querySelectorAll("a").forEach(a => {
  a.addEventListener("click", () => {
    if(window.innerWidth <= 860) navLinks.style.display = "none";
  });
});

// ===== SCROLL REVEAL =====
function observeReveals(){
  const els = document.querySelectorAll(".reveal:not(.in)");
  const obs = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if(entry.isIntersecting){
        entry.target.classList.add("in");
        obs.unobserve(entry.target);
      }
    });
  }, { threshold:0.15 });
  els.forEach(el => obs.observe(el));
}

// ===== INIT =====
document.getElementById("year").textContent = new Date().getFullYear();
try{
  const storedCart = localStorage.getItem("jeurisito_cart");
  if(storedCart) cart = JSON.parse(storedCart);
} catch(e){ /* ignorar */ }
renderStyles();
renderCart();
PRODUCTS_READY.then(() => renderProducts());

if(typeof cartSyncOnLoad === "function"){
  cartSyncOnLoad((serverItems) => {
    cart = serverItems;
    renderCart();
  });
}

// Contacto: correo y WhatsApp
document.querySelectorAll(".js-contact-email").forEach(el => {
  el.href = `mailto:${BUSINESS_EMAIL}`;
  const detail = el.querySelector(".contact-detail");
  if(detail) detail.textContent = BUSINESS_EMAIL;
});
document.querySelectorAll(".js-contact-whatsapp").forEach(el => {
  el.href = `https://wa.me/${BUSINESS_WHATSAPP}`;
});
