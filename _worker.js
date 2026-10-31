export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    if (url.pathname === "/api/contact") {
      const json = (data, status = 200) =>
        new Response(JSON.stringify(data), {
          status,
          headers: {
            "Content-Type": "application/json; charset=utf-8",
            "Cache-Control": "no-store"
          }
        });

      if (request.method !== "POST") {
        return json({ error: "Použijte POST." }, 405);
      }

      if (!env.RESEND_API_KEY || !env.CONTACT_TO || !env.CONTACT_FROM) {
        return json({ error: "Formulář ještě není nakonfigurován." }, 503);
      }

      let data;
      try {
        data = await request.json();
      } catch {
        return json({ error: "Neplatná data formuláře." }, 400);
      }

      const fields = ["firma", "kontaktni-osoba", "email", "sluzba", "detail"];

      for (const field of fields) {
        if (typeof data[field] !== "string" || !data[field].trim()) {
          return json({ error: "Vyplňte prosím všechna povinná pole." }, 400);
        }
      }

      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email)) {
        return json({ error: "Zkontrolujte prosím e-mailovou adresu." }, 400);
      }

      if (data["souhlas-kontakt"] !== "ano") {
        return json({ error: "Pro odeslání je nutný souhlas s kontaktováním." }, 400);
      }

      const safe = (value, max = 4000) =>
        String(value || "").trim().slice(0, max);

      const text = [
        "Nová poptávka z webu JR Bridge",
        "",
        `Firma: ${safe(data.firma, 200)}`,
        `Kontaktní osoba: ${safe(data["kontaktni-osoba"], 200)}`,
        `E-mail: ${safe(data.email, 254)}`,
        `Telefon: ${safe(data.telefon, 100) || "Neuveden"}`,
        `Oblast spolupráce: ${safe(data.sluzba, 300)}`,
        "",
        "Popis poptávky:",
        safe(data.detail, 5000)
      ].join("\n");

      try {
        const response = await fetch("https://api.resend.com/emails", {
          method: "POST",
          headers: {
            "Authorization": `Bearer ${env.RESEND_API_KEY}`,
            "Content-Type": "application/json"
          },
          body: JSON.stringify({
            from: env.CONTACT_FROM,
            to: [env.CONTACT_TO],
            reply_to: safe(data.email, 254),
            subject: `Nová poptávka z webu – ${safe(data.firma, 120)}`,
            text
          })
        });

        if (!response.ok) {
          return json({ error: "Poptávku se nepodařilo odeslat." }, 502);
        }
      } catch {
        return json({ error: "Poptávku se nepodařilo odeslat." }, 502);
      }

      return json({ ok: true });
    }

    return env.ASSETS.fetch(request);
  }
};
