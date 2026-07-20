// =========================================================
// CATÁLOGO DE PRODUCTOS — Jeurisito Supply
// Los productos ya NO están escritos aquí en código. Ahora
// se cargan desde content/products.json — ese archivo lo
// puedes editar tú mismo desde el panel visual en /admin/
// (una vez esté conectado a Netlify + GitHub, ver instrucciones).
// =========================================================

let PRODUCTS_LIST = [];

// Íconos y colores de relleno para productos sin foto todavía
const FALLBACK_ICON = { clientes:"🧴", profesionales:"🔧" };
const FALLBACK_PALETTE = ["#16233D", "#A81F26", "#1F3F73", "#2C57A0"];
function fallbackColorFor(id){
  let hash = 0;
  for(let i=0; i<id.length; i++) hash = (hash * 31 + id.charCodeAt(i)) % FALLBACK_PALETTE.length;
  return FALLBACK_PALETTE[Math.abs(hash)];
}

const PRODUCTS_READY = fetch("content/products.json")
  .then(res => {
    if(!res.ok) throw new Error("No se pudo leer content/products.json");
    return res.json();
  })
  .then(data => {
    PRODUCTS_LIST = (data.products || []).map(p => ({
      ...p,
      icon: p.image ? null : (FALLBACK_ICON[p.tab] || "🧴"),
      color: p.image ? null : fallbackColorFor(p.id),
    }));
    return PRODUCTS_LIST;
  })
  .catch(err => {
    console.warn("Catálogo no disponible:", err);
    PRODUCTS_LIST = [];
    return PRODUCTS_LIST;
  });

function getProductById(id){
  return PRODUCTS_LIST.find(p => p.id === id);
}
function getProductsByTab(tab){
  return PRODUCTS_LIST.filter(p => p.tab === tab);
}
