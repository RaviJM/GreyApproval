import { useState } from "react";

function App() {
  const [message, setMessage] = useState("");

  async function checkBackend() {
    const response = await fetch("http://localhost:3000/api/health");

    const data = await response.json();
    setMessage(data.message);
  }

  return (
    <div>
      <h1>QR Code Project</h1>

      <button onClick={checkBackend}>Test Backend</button>

      <p>{message}</p>
    </div>
  );
}

export default App;
