// ===== Sincronización de carrito con Supabase (clientes registrados) =====
// Se usa desde script.js (index.html) y product.js (product.html)

async function cartSyncToServer(cartItems){
  try{
    if(typeof supabaseClient === "undefined") return;
    const { data } = await supabaseClient.auth.getSession();
    if(!data.session) return; // invitado: solo se queda en localStorage
    const userId = data.session.user.id;
    await supabaseClient.from("carts").upsert({
      customer_id: userId,
      items: cartItems,
      updated_at: new Date().toISOString()
    });
  } catch(e){
    console.warn("No se pudo sincronizar el carrito con el servidor:", e);
  }
}

// Devuelve el carrito guardado en el servidor para el usuario logueado, o null
async function cartLoadFromServer(){
  try{
    if(typeof supabaseClient === "undefined") return null;
    const { data } = await supabaseClient.auth.getSession();
    if(!data.session) return null;
    const userId = data.session.user.id;
    const { data: row, error } = await supabaseClient
      .from("carts").select("items").eq("customer_id", userId).single();
    if(error || !row) return null;
    return row.items || [];
  } catch(e){
    return null;
  }
}

// Al cargar cualquier página: si hay sesión activa, trae el carrito guardado
// del servidor y lo pone en localStorage ANTES de que la página dibuje el carrito.
// applyCartFn recibe el array de items y debe actualizar la variable `cart` + repintar.
async function cartSyncOnLoad(applyCartFn){
  const serverCart = await cartLoadFromServer();
  if(serverCart){
    localStorage.setItem("jeurisito_cart", JSON.stringify(serverCart));
    applyCartFn(serverCart);
  }

  // Si el cliente inicia sesión mientras navega (ej. en cuenta.html en otra pestaña
  // o justo ahora), refresca el carrito también
  if(typeof supabaseClient !== "undefined"){
    supabaseClient.auth.onAuthStateChange(async (event) => {
      if(event === "SIGNED_IN"){
        const updated = await cartLoadFromServer();
        if(updated && updated.length){
          localStorage.setItem("jeurisito_cart", JSON.stringify(updated));
          applyCartFn(updated);
        }
      }
    });
  }
}
