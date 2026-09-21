import useSWR from 'swr';

const fetcher = async (url) => {
  const res = await fetch(url);
  const data = await res.json();

  if (!res.ok) {
    const error = new Error(data.error || 'Failed to fetch');
    error.info = data;
    error.status = res.status;
    throw error;
  }

  return data;
};

export default function Home() {
  const { data, error } = useSWR('/api/latest', fetcher, { refreshInterval: 5000 });

  if (error) {
    return (
      <div style={{ color: 'red', margin: '2rem auto', maxWidth: 700 }}>
        <h3>Error loading email</h3>
        <p>{error.info?.error || error.message}</p>
      </div>
    );
  }

  if (!data) return <p style={{ textAlign: 'center' }}>Loading…</p>;
  if (data.empty) return <p style={{ textAlign: 'center' }}>No emails found yet.</p>;

  const formattedDate = data.date ? new Date(data.date).toLocaleString() : 'N/A';

  return (
    <main style={{ maxWidth: 700, margin: '2rem auto', fontFamily: 'sans-serif' }}>
      <h1>{data.subject}</h1>
      <p style={{ color: '#666' }}>
        From: <strong>{data.from}</strong> — {formattedDate}
      </p>
      <hr />
      <div dangerouslySetInnerHTML={{ __html: data.html || `<p>${data.intro}</p>` }} />
    </main>
  );
}
