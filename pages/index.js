import useSWR from 'swr';

// Pune aici token-ul tău generat conform docs.mail.tm
const TOKEN = "eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzUxMiJ9.eyJpYXQiOjE3ODk5ODQyNDksInJvbGVzIjpbIlJPTEVfVVNFUiJdLCJhZGRyZXNzIjoic2tpbmFwZUB1YmVyaXAuY29tIiwiaWQiOiI2YWIwZmRlYjQ0MjE0M2I5YjQwYmRhZjAiLCJtZXJjdXJlIjp7InN1YnNjcmliZSI6WyIvYWNjb3VudHMvNmFiMGZkZWI0NDIxNDNiOWI0MGJkYWYwIl19fQ.CQxtHzHRSqPgUvZWsv_KJod7JER0Uy80xLwBAPxvkgyC-iyaUAMc8VE2sY8aoD5_jilVS7vWOCdTmPH7SqxWxw"; 

const fetcher = async (url) => {
  const headers = {
    Authorization: `Bearer ${TOKEN}`,
    Accept: "application/json",
  };

  // 1. Preluăm lista de mesaje
  const listRes = await fetch("https://api.mail.tm/messages?page=1", { headers });
  
  if (!listRes.ok) {
    throw new Error(`Eroare Mail.tm: ${listRes.status}`);
  }
  
  const listData = await listRes.json();
  const messages = listData["hydra:member"] || [];

  if (messages.length === 0) {
    return { empty: true };
  }

  // 2. Preluăm detaliile ultimului mesaj
  const latestId = messages[0].id;
  const msgRes = await fetch(`https://api.mail.tm/messages/${latestId}`, { headers });
  
  if (!msgRes.ok) {
    throw new Error("Nu s-a putut citi mesajul.");
  }

  const message = await msgRes.json();

  return {
    empty: false,
    subject: message.subject || "(No subject)",
    from: message.from?.address || "(Unknown sender)",
    date: message.createdAt || message.updatedAt || null,
    html: Array.isArray(message.html) ? message.html[0] : message.html || "",
    text: message.text || "",
    intro: message.intro || message.text || ""
  };
};

export default function Home() {
  const { data, error } = useSWR('mailtm-latest', fetcher, { refreshInterval: 5000 });

  if (error) {
    return (
      <div style={{ color: 'red', padding: '2rem', fontFamily: 'sans-serif' }}>
        <h3>Eroare:</h3>
        <p>{error.message}</p>
        <p style={{ fontSize: '0.9rem', color: '#555' }}>
          Dacă vezi eroare de tip CORS sau Cloudflare, asigură-te că rulezi pe <code>localhost</code> și că token-ul este valid.
        </p>
      </div>
    );
  }

  if (!data) return <p style={{ textAlign: 'center', marginTop: '2rem' }}>Se încarcă…</p>;
  if (data.empty) return <p style={{ textAlign: 'center', marginTop: '2rem' }}>Niciun email primit încă.</p>;

  return (
    <main style={{ maxWidth: 700, margin: '2rem auto', fontFamily: 'sans-serif', padding: '0 1rem' }}>
      <h1>{data.subject}</h1>
      <p style={{ color: '#666' }}>
        De la: <strong>{data.from}</strong> — {data.date ? new Date(data.date).toLocaleString() : ''}
      </p>
      <hr />
      <div dangerouslySetInnerHTML={{ __html: data.html || `<p>${data.intro}</p>` }} />
    </main>
  );
}
