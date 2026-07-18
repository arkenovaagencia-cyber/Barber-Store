// =========================================================
// CONFIGURACIÓN DE PAYPAL — Jeurisito Supply
// =========================================================
// Esto conecta el botón de pago real en la página de checkout.
//
// PASOS (gratis, sin costo por tenerlo, PayPal cobra una
// comisión solo cuando entra una venta real):
// 1. Ve a https://developer.paypal.com y entra con tu cuenta
//    de PayPal (si no tienes, créala gratis en paypal.com primero,
//    tipo "Cuenta de empresa/negocio").
// 2. Una vez dentro de developer.paypal.com, ve a "Apps & Credentials".
// 3. Asegúrate de estar en modo "Live" (no "Sandbox") cuando
//    estés listo para cobrar de verdad. Mientras pruebas, puedes
//    quedarte en "Sandbox".
// 4. Clic en "Create App", ponle un nombre, ej: "jeurisito-style".
// 5. Te va a mostrar un "Client ID" — es un texto largo. Cópialo.
// 6. PÉGALO abajo, reemplazando el texto de ejemplo. Guarda el archivo.
//
// Mientras no pongas tu Client ID real, el botón de PayPal no
// aparecerá en el checkout, pero el botón de "Finalizar por
// WhatsApp" seguirá funcionando como respaldo.
// =========================================================

const PAYPAL_CLIENT_ID = "PON_AQUI_TU_PAYPAL_CLIENT_ID";
const PAYPAL_CURRENCY = "USD"; // La mayoría de cuentas PayPal en RD cobran en USD; revisa tu cuenta PayPal para confirmar tu moneda habilitada.
const DOP_TO_USD_RATE = 59; // Tasa aproximada RD$ por US$1 (julio 2026). Actualízala de vez en cuando en https://www.bancentral.gov.do
