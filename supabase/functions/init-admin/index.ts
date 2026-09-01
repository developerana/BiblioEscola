import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const ADMIN_EMAIL = "anahelouise.ss@gmail.com";
const DEFAULT_PASSWORD = "Biblioteca@2024";

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

    let body: { reset?: boolean } = {};
    try {
      body = await req.json();
    } catch (_) {
      body = {};
    }

    // Check if admin already exists
    const { data: existingProfiles } = await supabaseAdmin
      .from("profiles")
      .select("*")
      .eq("email", ADMIN_EMAIL);

    const url = new URL(req.url);
    const wantsReset = body.reset === true || url.searchParams.get("reset") === "1";
    console.log("init-admin invoked", { wantsReset, hasProfile: !!(existingProfiles && existingProfiles.length) });

    if (existingProfiles && existingProfiles.length > 0) {
      if (wantsReset) {
        const { data: list } = await supabaseAdmin.auth.admin.listUsers();
        const adminUser = list?.users?.find((u) => u.email === ADMIN_EMAIL);
        if (!adminUser) throw new Error("Conta master não encontrada no Auth");

        const { error: updErr } = await supabaseAdmin.auth.admin.updateUserById(adminUser.id, {
          password: DEFAULT_PASSWORD,
          email_confirm: true,
        });
        if (updErr) throw updErr;

        await supabaseAdmin
          .from("profiles")
          .update({ must_change_password: true, is_active: true })
          .eq("user_id", adminUser.id);

        return new Response(
          JSON.stringify({ success: true, message: "Senha master redefinida", email: ADMIN_EMAIL, password: DEFAULT_PASSWORD }),
          { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      return new Response(
        JSON.stringify({ message: "Admin já configurado" }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }


    // Create admin user
    const { data: newUser, error: createError } = await supabaseAdmin.auth.admin.createUser({
      email: ADMIN_EMAIL,
      password: DEFAULT_PASSWORD,
      email_confirm: true,
    });

    if (createError) {
      // User might already exist but not in profiles
      if (createError.message.includes("already registered")) {
        return new Response(
          JSON.stringify({ message: "Admin já existe, faça login" }),
          { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      throw createError;
    }

    // Create profile
    await supabaseAdmin
      .from("profiles")
      .insert({
        user_id: newUser.user.id,
        email: ADMIN_EMAIL,
        name: "Administrador",
      });

    // Assign admin role
    await supabaseAdmin
      .from("user_roles")
      .insert({
        user_id: newUser.user.id,
        role: "admin",
      });

    console.log("Admin user created successfully");

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: "Administrador criado com sucesso",
        email: ADMIN_EMAIL,
        password: DEFAULT_PASSWORD
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error: unknown) {
    console.error("Error in init-admin function:", error);
    const message = error instanceof Error ? error.message : "Erro interno";
    return new Response(
      JSON.stringify({ error: message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
