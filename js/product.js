const BUSINESS_WHATSAPP = "18292865680";

let cart = [];
try{
  const stored = localStorage.getItem("jeurisito_cart");
  cart = stored ? JSON.parse(stored) : [];
} catch(e){ cart = []; }

function saveCart(){
  try{ localStorage.setItem("jeurisito_cart", JSON.stringify(cart)); }
  catch(e){ /* no disponible */ }
  if(typeof cartSyncToServer === "function") cartSyncToServer(cart);
  renderCartUI();
}

if(typeof cartSyncOnLoad === "function"){
  cartSyncOnLoad((serverItems) => {
    cart = serverItems;
    renderCartUI();
  });
}
function addToCart(product, qty){
  const existing = cart.find(i => i.id === product.id);
  if(existing){ existing.qty += qty; }
  else{ cart.push({ id:product.id, name:product.name, price:product.price, icon:product.icon, qty }); }
  saveCart();
}
function removeFromCart(id){
  cart = cart.filter(i => i.id !== id);
  saveCart();
}
function renderCartUI(){
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
          <button class="remove" data-id="${i.id}" aria-label="Quitar">✕</button>
        </span>
      </li>
    `).join("");
    list.querySelectorAll(".remove").forEach(btn => {
      btn.addEventListener("click", () => removeFromCart(btn.dataset.id));
    });
  }
  totalEl.textContent = `RD$${total.toLocaleString("es-DO")}`;
  countEl.textContent = count;
}

const cartDrawer = document.getElementById("cartDrawer");
const cartOverlay = document.getElementById("cartOverlay");
function openCartDrawer(){ cartDrawer.classList.add("open"); cartOverlay.classList.add("open"); }
function closeCartDrawer(){ cartDrawer.classList.remove("open"); cartOverlay.classList.remove("open"); }
document.getElementById("cartBtn").addEventListener("click", openCartDrawer);
document.getElementById("cartClose").addEventListener("click", closeCartDrawer);
cartOverlay.addEventListener("click", closeCartDrawer);
document.getElementById("checkoutBtn").addEventListener("click", () => {
  if(cart.length === 0){ alert("Tu carrito está vacío."); return; }
  window.location.href = "checkout.html";
});

// ===== Cargar el producto según la URL (?id=nombre-producto) =====
const params = new URLSearchParams(window.location.search);
const productId = params.get("id");
const detailBox = document.getElementById("productDetail");

function gallerySlides(product){
  const slides = [];
  if(product.image) slides.push({ type:"image", src:product.image });
  (product.gallery || []).forEach(src => { if(src) slides.push({ type:"image", src }); });
  if(slides.length === 0) slides.push({ type:"fallback", icon:product.icon, color:product.color });
  return slides;
}
function slideThumbStyle(s){
  return s.type === "image" ? `background:url('${s.src}') center/cover no-repeat` : `background:${s.color}`;
}
function slideMainHTML(s){
  return s.type === "image"
    ? `<img src="${s.src}" alt="" class="gallery-main-img">`
    : `<span class="gallery-main-icon">${s.icon}</span>`;
}

PRODUCTS_READY.then(() => {
  const product = getProductById(productId);

  if(!product){
    detailBox.innerHTML = `
      <div class="product-not-found">
        <h2>No encontramos ese producto</h2>
        <p>Puede que el enlace esté mal o el producto ya no esté disponible.</p>
        <a href="index.html#tienda" class="btn btn-primary">Volver a la tienda</a>
      </div>`;
    return;
  }

  document.title = `${product.name} — Jeurisito Supply`;
  document.getElementById("pageTitle").textContent = `${product.name} — Jeurisito Supply`;
  document.getElementById("breadcrumbName").textContent = product.name;

  const gallery = gallerySlides(product);

  detailBox.innerHTML = `
    <div class="product-gallery">
      <div class="gallery-main" id="galleryMain" style="${gallery[0].type === "image" ? "" : slideThumbStyle(gallery[0])}">${slideMainHTML(gallery[0])}</div>
      <div class="gallery-thumbs" id="galleryThumbs">
        ${gallery.map((g,i) => `<button class="gallery-thumb ${i===0?"active":""}" data-index="${i}" style="${slideThumbStyle(g)}">${g.type==="fallback"?g.icon:""}</button>`).join("")}
      </div>
    </div>
    <div class="product-info">
      <div class="cat">${product.cat}</div>
      <h1>${product.name}</h1>
      <div class="product-price">RD$${product.price.toLocaleString("es-DO")}</div>
      <p class="product-long-desc">${product.longDesc}</p>

      <div class="qty-row">
        <label for="qtyInput">Cantidad</label>
        <div class="qty-control">
          <button type="button" id="qtyMinus" aria-label="Menos">−</button>
          <input type="number" id="qtyInput" value="1" min="1" max="20">
          <button type="button" id="qtyPlus" aria-label="Más">+</button>
        </div>
      </div>

      <div class="pdp-cta-row">
        <button class="btn btn-primary pdp-buy" id="pdpBuyNow">Comprar ahora</button>
        <button class="btn btn-ghost pdp-add" id="pdpAddCart">Añadir al carrito</button>
      </div>
      <a class="wa-link pdp-wa" target="_blank" rel="noopener"
         href="https://wa.me/${BUSINESS_WHATSAPP}?text=${encodeURIComponent(`Hola, me interesa comprar: ${product.name} (RD$${product.price})`)}">
        Preguntar por WhatsApp
      </a>
    </div>
  `;

  // Galería: cambiar imagen principal
  document.querySelectorAll(".gallery-thumb").forEach(btn => {
    btn.addEventListener("click", () => {
      const g = gallery[Number(btn.dataset.index)];
      const main = document.getElementById("galleryMain");
      main.style.cssText = g.type === "image" ? "" : slideThumbStyle(g);
      main.innerHTML = slideMainHTML(g);
      document.querySelectorAll(".gallery-thumb").forEach(b => b.classList.remove("active"));
      btn.classList.add("active");
    });
  });

  // Cantidad
  const qtyInput = document.getElementById("qtyInput");
  document.getElementById("qtyMinus").addEventListener("click", () => {
    qtyInput.value = Math.max(1, Number(qtyInput.value) - 1);
  });
  document.getElementById("qtyPlus").addEventListener("click", () => {
    qtyInput.value = Math.min(20, Number(qtyInput.value) + 1);
  });

  document.getElementById("pdpAddCart").addEventListener("click", () => {
    addToCart(product, Number(qtyInput.value));
    const btn = document.getElementById("pdpAddCart");
    btn.textContent = "Añadido ✓";
    setTimeout(() => { btn.textContent = "Añadir al carrito"; }, 1200);
  });
  document.getElementById("pdpBuyNow").addEventListener("click", () => {
    addToCart(product, Number(qtyInput.value));
    window.location.href = "checkout.html";
  });

  // Productos relacionados: otros del mismo tab
  const related = getProductsByTab(product.tab).filter(p => p.id !== product.id).slice(0,4);
  const relatedGrid = document.getElementById("relatedGrid");
  relatedGrid.innerHTML = related.map(p => `
    <div class="product-card reveal">
      <a href="product.html?id=${p.id}" class="product-thumb-link">
        ${p.image ? `<img src="${p.image}" alt="${p.name}" class="product-thumb product-thumb-img">` : `<div class="product-thumb" style="background:${p.color}">${p.icon}</div>`}
      </a>
      <div class="cat">${p.cat}</div>
      <a href="product.html?id=${p.id}" class="product-name-link"><h4>${p.name}</h4></a>
      <div class="price">RD$${p.price.toLocaleString("es-DO")}</div>
      <a href="product.html?id=${p.id}" class="btn btn-ghost btn-sm view-related-btn">Ver producto</a>
    </div>
  `).join("");

  observeReveals();
});

document.getElementById("year").textContent = new Date().getFullYear();
renderCartUI();

// Reveal on scroll (para relacionados)
function observeReveals(){
  const els = document.querySelectorAll(".reveal:not(.in)");
  const obs = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if(entry.isIntersecting){ entry.target.classList.add("in"); obs.unobserve(entry.target); }
    });
  }, { threshold:0.15 });
  els.forEach(el => obs.observe(el));
}
