export async function onRequestPost({ request, env }) {
  const json = (data, status = 200) =>
    new Response(JSON.stringify(data), {
      status,
      headers: { "Content-Type": "application/json; charset=utf-8" }
    });

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

  if (typeof data.email !== "string" ||
      !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email) ||
      data.email.length > 254) {
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
    safe(data.detail, 5000),
    "",
    "Souhlas s kontaktováním: ano"
  ].join("\n");

  const resend = await fetch("https://api.resend.com/emails", {
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

  if (!resend.ok) {
    return json({ error: "Poptávku se nepodařilo odeslat. Zkuste to prosím později." }, 502);
  }

  return json({ ok: true });
}
