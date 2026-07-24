document.getElementById("year").textContent = new Date().getFullYear();

let isSignup = true;

const authForm = document.getElementById("authForm");
const nameField = document.getElementById("nameField");
const formTitle = document.getElementById("formTitle");
const authSubmitBtn = document.getElementById("authSubmitBtn");
const toggleText = document.getElementById("toggleText");
const toggleLink = document.getElementById("toggleAuthMode");
const authError = document.getElementById("authError");
const authSuccess = document.getElementById("authSuccess");

function showError(msg){
  authError.textContent = msg;
  authError.style.display = "block";
  authSuccess.style.display = "none";
}
function showSuccess(msg){
  authSuccess.textContent = msg;
  authSuccess.style.display = "block";
  authError.style.display = "none";
}
function clearMsgs(){
  authError.style.display = "none";
  authSuccess.style.display = "none";
}

toggleLink.addEventListener("click", (e) => {
  e.preventDefault();
  isSignup = !isSignup;
  clearMsgs();
  if(isSignup){
    formTitle.textContent = "Crear cuenta";
    authSubmitBtn.textContent = "Crear cuenta";
    toggleText.textContent = "¿Ya tienes cuenta?";
    toggleLink.textContent = "Iniciar sesión";
    nameField.style.display = "block";
  } else {
    formTitle.textContent = "Iniciar sesión";
    authSubmitBtn.textContent = "Iniciar sesión";
    toggleText.textContent = "¿No tienes cuenta?";
    toggleLink.textContent = "Crear cuenta";
    nameField.style.display = "none";
  }
});

async function showLoggedIn(user){
  document.getElementById("loggedOutView").style.display = "none";
  document.getElementById("loggedInView").style.display = "block";
  document.getElementById("welcomeEmail").textContent = user.email;

  let displayName = user.email;
  try{
    const { data: profile } = await supabaseClient
      .from("profiles").select("full_name").eq("id", user.id).single();
    if(profile && profile.full_name) displayName = profile.full_name;
  } catch(e){}
  document.getElementById("welcomeName").textContent = displayName;

  loadMyOrders(user.id);
}

async function loadMyOrders(userId){
  const list = document.getElementById("myOrdersList");
  const { data: orders, error } = await supabaseClient
    .from("orders").select("*").eq("customer_id", userId).order("created_at", { ascending: false });

  if(error){
    list.innerHTML = `<p>No se pudieron cargar tus pedidos.</p>`;
    return;
  }
  if(!orders || orders.length === 0){
    list.innerHTML = `<p style="color:var(--bone-dim);">Todavía no has hecho ningún pedido.</p>`;
    return;
  }

  list.innerHTML = orders.map(o => {
    const fecha = new Date(o.created_at).toLocaleDateString("es-DO", { dateStyle: "medium" });
    return `
      <div class="my-order">
        <div class="my-order-top">
          <strong>${o.items}</strong>
          <span class="my-order-status">${o.payment_status}</span>
        </div>
        <div class="my-order-meta">${fecha} · RD$${Number(o.total_dop).toLocaleString("es-DO")}</div>
      </div>
    `;
  }).join("");
}

authSubmitBtn.addEventListener("click", async (e) => {
  e.preventDefault();
  clearMsgs();
  const email = document.getElementById("accEmail").value.trim();
  const password = document.getElementById("accPassword").value;

  if(!email || !password){
    showError("Completa correo y contraseña.");
    return;
  }

  authSubmitBtn.disabled = true;

  if(isSignup){
    const name = document.getElementById("accName").value.trim();
    if(!name){
      showError("Escribe tu nombre.");
      authSubmitBtn.disabled = false;
      return;
    }
    const { data, error } = await supabaseClient.auth.signUp({ email, password });
    if(error){
      showError(error.message);
      authSubmitBtn.disabled = false;
      return;
    }
    if(data.user){
      await supabaseClient.from("profiles").insert({
        id: data.user.id, full_name: name
      });
    }
    if(data.session){
      showLoggedIn(data.user);
    } else {
      showSuccess("¡Cuenta creada! Ya puedes iniciar sesión.");
    }
  } else {
    const { data, error } = await supabaseClient.auth.signInWithPassword({ email, password });
    if(error){
      showError("Correo o contraseña incorrectos.");
      authSubmitBtn.disabled = false;
      return;
    }
    showLoggedIn(data.user);
  }
  authSubmitBtn.disabled = false;
});

document.getElementById("logoutBtn").addEventListener("click", async () => {
  await supabaseClient.auth.signOut();
  document.getElementById("loggedOutView").style.display = "block";
  document.getElementById("loggedInView").style.display = "none";
});

// Si ya hay sesión activa, mostrar directamente el panel de "logueado"
(async () => {
  const { data } = await supabaseClient.auth.getSession();
  if(data.session){
    showLoggedIn(data.session.user);
  }
})();
