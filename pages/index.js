export default async function handler(req, res) {
  const token = process.env.MAILTM_TOKEN;

  if (!token) {
    return res.status(500).json({ error: "Token-ul MAILTM_TOKEN lipsește." });
  }

  try {
    const headers = {
      Authorization: `Bearer ${token}`,
      Accept: "application/json"
    };

    // 1. Preluăm lista de mesaje prin PROXY
    const listUrl = encodeURIComponent("https://api.mail.tm/messages?page=1");
    const response = await fetch(`https://corsproxy.io/?${listUrl}`, { headers });

    if (!response.ok) {
      return res.status(response.status).json({ error: "Eroare la preluarea listei de emailuri." });
    }

    const data = await response.json();
    const messages = data["hydra:member"] || [];

    if (messages.length === 0) {
      return res.status(200).json({ empty: true });
    }

    // 2. Preluăm ultimul mesaj prin PROXY
    const latest = messages[0];
    const messageUrl = encodeURIComponent(`https://api.mail.tm/messages/${latest.id}`);
    const messageResponse = await fetch(`https://corsproxy.io/?${messageUrl}`, { headers });

    if (!messageResponse.ok) {
      return res.status(messageResponse.status).json({ error: "Eroare la citirea mesajului complet." });
    }

    const message = await messageResponse.json();

    return res.status(200).json({
      empty: false,
      id: message.id,
      subject: message.subject || "(Fără subiect)",
      from: message.from?.address || "(Expeditor necunoscut)",
      date: message.createdAt || message.updatedAt || null,
      html: Array.isArray(message.html) ? message.html[0] : message.html || "",
      text: message.text || "",
      intro: message.intro || message.text || ""
    });

  } catch (error) {
    console.error("Eroare API:", error);
    return res.status(500).json({ error: error.message });
  }
}
