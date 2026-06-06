async function test() {
  try {
    const res = await fetch("http://localhost:3000/api/interviews", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ domain: "dsa", difficulty: "medium", type: "chat" }),
    });
    console.log("Status:", res.status);
    const text = await res.text();
    console.log("Response:", text);
  } catch (e) {
    console.error("Fetch failed:", e);
  }
}
test();
