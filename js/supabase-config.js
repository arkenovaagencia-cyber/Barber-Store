// ===== Configuración de Supabase — Jeurisito Supply =====
const SUPABASE_URL = "https://vxujaxkkghgxxfckfiuz.supabase.co";
const SUPABASE_KEY = "sb_publishable_fkFvXxWY7eMLl3sTaQkgfA_njmXKOdn";

// Cliente global de Supabase (usa la librería cargada por CDN en cada página)
const supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY);
