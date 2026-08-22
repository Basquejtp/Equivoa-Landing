export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    if (url.pathname === "/api/subscribe" && request.method === "POST") {
      return handleSubscribe(request, env);
    }

    // Everything else: serve the static site as normal
    return env.ASSETS.fetch(request);
  }
};

async function handleSubscribe(request, env) {
  const corsHeaders = {
    "Access-Control-Allow-Origin": "*",
    "Content-Type": "application/json"
  };

  try {
    const data = await request.json();
    const email = (data.email || "").trim();
    const role = (data.role || "rider").trim();
    const founding = data.founding === true;

    if (!email || !email.includes("@")) {
      return new Response(JSON.stringify({ error: "Valid email required" }), {
        status: 400,
        headers: corsHeaders
      });
    }

    const listIds = founding ? [3, 4] : [3];

    const brevoRes = await fetch("https://api.brevo.com/v3/contacts", {
      method: "POST",
      headers: {
        "api-key": env.BREVO_API_KEY,
        "Content-Type": "application/json",
        "Accept": "application/json"
      },
      body: JSON.stringify({
        email: email,
        attributes: { ROLE: role },
        listIds: listIds,
        updateEnabled: true
      })
    });

    if (!brevoRes.ok && brevoRes.status !== 204) {
      const errText = await brevoRes.text();
      return new Response(JSON.stringify({ error: "Brevo error", detail: errText }), {
        status: 502,
        headers: corsHeaders
      });
    }

    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: corsHeaders
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: "Server error", detail: String(err) }), {
      status: 500,
      headers: corsHeaders
    });
  }
}
