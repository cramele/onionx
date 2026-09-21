// pages/api/latest.js

export default async function handler(req, res) {
  const token = process.env.MAILTM_TOKEN;

  if (!token) {
    return res.status(500).json({
      error: "MAILTM_TOKEN missing"
    });
  }

  try {
    const response = await fetch(
      "https://api.mail.tm/messages?page=1",
      {
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: "application/json"
        }
      }
    );

    const data = await response.json();

    if (!response.ok) {
      return res.status(response.status).json({
        error: "Mail.tm error",
        details: data
      });
    }

    const messages = data["hydra:member"] || [];

    if (messages.length === 0) {
      return res.status(200).json({
        empty: true
      });
    }

    const latest = messages[0];

    const messageResponse = await fetch(
      `https://api.mail.tm/messages/${latest.id}`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: "application/json"
        }
      }
    );

    const message = await messageResponse.json();

    if (!messageResponse.ok) {
      return res.status(messageResponse.status).json({
        error: "Message error",
        details: message
      });
    }

    console.log("MAIL.TM MESSAGE:");
    console.log(JSON.stringify(message, null, 2));

    return res.status(200).json({
      empty: false,

      id: message.id,

      subject: message.subject || "(No subject)",

      from: message.from?.address || "(Unknown sender)",

      date:
        message.createdAt ||
        message.updatedAt ||
        null,

      html:
        Array.isArray(message.html)
          ? message.html[0]
          : message.html || "",

      text: message.text || "",

      intro:
        message.intro ||
        message.text ||
        ""
    });

  } catch (error) {
    console.error(error);

    return res.status(500).json({
      error: error.message
    });
  }
}
