// pages/api/latest.js

export default async function handler(req, res) {
  const token = process.env.MAILTM_TOKEN;

  if (!token) {
    return res.status(500).json({
      error: "MAILTM_TOKEN is not configured"
    });
  }

  try {
    const messagesRes = await fetch(
      "https://api.mail.tm/messages?page=1",
      {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: "application/json"
        }
      }
    );

    const data = await messagesRes.json();

    // Show the actual Mail.tm error
    if (!messagesRes.ok) {
      console.error("Mail.tm error:", messagesRes.status, data);

      return res.status(messagesRes.status).json({
        error: "Mail.tm API error",
        status: messagesRes.status,
        details: data
      });
    }

    const messages = data["hydra:member"] || [];

    // No emails
    if (messages.length === 0) {
      return res.status(200).json({
        empty: true
      });
    }

    // Find Skinape email if it exists,
    // otherwise use the newest email
    const latest =
      messages.find(
        (m) =>
          m.from &&
          m.from.address &&
          m.from.address.toLowerCase() ===
            "no-reply@skinape.com"
      ) || messages[0];

    // Get full message
    const msgRes = await fetch(
      `https://api.mail.tm/messages/${latest.id}`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: "application/json"
        }
      }
    );

    const msg = await msgRes.json();

    if (!msgRes.ok) {
      console.error("Mail.tm message error:", msgRes.status, msg);

      return res.status(msgRes.status).json({
        error: "Could not load message",
        status: msgRes.status,
        details: msg
      });
    }

    return res.status(200).json({
      empty: false,
      id: msg.id,
      subject: msg.subject || "(No subject)",
      from: msg.from?.address || "Unknown",
      date: msg.createdAt,
      html: Array.isArray(msg.html)
        ? msg.html[0]
        : "",
      text: msg.text || "",
      intro: latest.intro || ""
    });

  } catch (error) {
    console.error("Server error:", error);

    return res.status(500).json({
      error: "Internal server error",
      details: error.message
    });
  }
}
