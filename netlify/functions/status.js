function extractOutputs(payload) {
  if (!payload || typeof payload !== "object") return [];
  if (Array.isArray(payload.outputs)) return payload.outputs;
  if (payload.data && Array.isArray(payload.data.outputs)) return payload.data.outputs;
  if (payload.prediction && Array.isArray(payload.prediction.outputs)) return payload.prediction.outputs;
  return [];
}

function extractStatus(payload) {
  if (!payload || typeof payload !== "object") return "unknown";
  return (
    payload.status ||
    (payload.data && payload.data.status) ||
    (payload.prediction && payload.prediction.status) ||
    "unknown"
  );
}

async function fetchResult(url, apiKey) {
  const resp = await fetch(url, {
    headers: {
      Authorization: `Bearer ${apiKey}`,
    },
  });

  const data = await resp.json().catch(() => ({}));
  return { ok: resp.ok, status: resp.status, data };
}

exports.handler = async (event) => {
  if (event.httpMethod !== "GET") {
    return { statusCode: 405, body: "Method Not Allowed" };
  }

  const apiKey = process.env.WAVESPEED_API_KEY;
  if (!apiKey) {
    return { statusCode: 500, body: "Missing WAVESPEED_API_KEY" };
  }

  const id = event.queryStringParameters && event.queryStringParameters.id;
  if (!id) {
    return { statusCode: 400, body: "Missing id" };
  }

  const resultUrl = `https://api.wavespeed.ai/api/v3/predictions/${encodeURIComponent(id)}/result`;
  let response = await fetchResult(resultUrl, apiKey);

  if (!response.ok) {
    const fallbackUrl = `https://api.wavespeed.ai/api/v3/predictions/${encodeURIComponent(id)}`;
    response = await fetchResult(fallbackUrl, apiKey);
  }

  if (!response.ok) {
    return {
      statusCode: response.status,
      body: JSON.stringify({ error: "WaveSpeed status failed", details: response.data }),
    };
  }

  const status = extractStatus(response.data);
  const outputs = extractOutputs(response.data);

  return {
    statusCode: 200,
    body: JSON.stringify({ status, outputs }),
  };
};
