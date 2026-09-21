// pages/api/latest.js
export default async function handler(req, res) {
  const token = "eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzUxMiJ9.eyJpYXQiOjE3ODk5ODQyNDksInJvbGVzIjpbIlJPTEVfVVNFUiJdLCJhZGRyZXNzIjoic2tpbmFwZUB1YmVyaXAuY29tIiwiaWQiOiI2YWIwZmRlYjQ0MjE0M2I5YjQwYmRhZjAiLCJtZXJjdXJlIjp7InN1YnNjcmliZSI6WyIvYWNjb3VudHMvNmFiMGZkZWI0NDIxNDNiOWI0MGJkYWYwIl19fQ.CQxtHzHRSqPgUvZWsv_KJod7JER0Uy80xLwBAPxvkgyC-iyaUAMc8VE2sY8aoD5_jilVS7vWOCdTmPH7SqxWxw"; // your full token here

  const messagesRes = await fetch("https://api.mail.tm/messages?page=1&limit=5", {
    headers: { Authorization: `Bearer ${token}` }
  });
  const data = await messagesRes.json();
  const messages = data["hydra:member"];

  // Optionally filter by sender:
  const latest = messages.find(m => m.from.address === "no-reply@skinape.com") || messages[0];

  if (!latest) return res.status(200).json({ empty: true });

  const msgRes = await fetch(`https://api.mail.tm/messages/${latest.id}`, {
    headers: { Authorization: `Bearer ${token}` }
  });
  const msg = await msgRes.json();

  res.status(200).json({
    subject: msg.subject,
    from: msg.from.address,
    date: msg.createdAt,
    html: msg.html[0],
    intro: msg.intro
  });
}
