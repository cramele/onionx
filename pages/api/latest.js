export default async function handler(req, res) {
  const token = process.env.MAILTM_TOKEN;

  if (!token) {
    return res.status(500).json({ error: "MAILTM_TOKEN missing in environment variables" });
  }

  try {
    const response = await fetch("https://api.mail.tm/messages?page=1", {
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: "application/json"
      }
    });

    // Protecție dacă Mail.tm trimite HTML (Cloudflare challenge) în loc de JSON
    const contentType = response.headers.get("content-type");
    if (!contentType || !contentType.includes("application/json")) {
      const text = await response.text();
      return res.status(500).json({
        error: "Mail.tm returned non-JSON response (likely Cloudflare block)",
        details: text.slice(0, 300)
      });
    }

    const data = await response.json();

    if (!response.ok) {
      return res.status(response.status).json({
        error: "Mail.tm API error",
        details: data
      });
    }

    const messages = data["hydra:member"] || [];

    if (messages.length === 0) {
      return res.status(200).json({ empty: true });
    }

    const latest = messages[0];

    const messageResponse = await fetch(`https://api.mail.tm/messages/${latest.id}`, {
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: "application/json"
      }
    });

    const message = await messageResponse.json();

    if (!messageResponse.ok) {
      return res.status(messageResponse.status).json({
        error: "Failed to fetch full message",
        details: message
      });
    }

    return res.status(200).json({
      empty: false,
      id: message.id,
      subject: message.subject || "(No subject)",
      from: message.from?.address || "(Unknown sender)",
      date: message.createdAt || message.updatedAt || null,
      html: Array.isArray(message.html) ? message.html[0] : message.html || "",
      text: message.text || "",
      intro: message.intro || message.text || ""
    });

  } catch (error) {
    console.error("API Route Error:", error);
    return res.status(500).json({ error: error.message });
  }
}
