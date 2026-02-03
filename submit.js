const DEFAULT_MODEL = process.env.WAVESPEED_MODEL || "bytedance/seedance-v1-lite-t2v-720p";

function pickTaskId(payload) {
  if (!payload || typeof payload !== "object") return null;
  if (payload.id) return payload.id;
  if (payload.data && payload.data.id) return payload.data.id;
  return null;
}

exports.handler = async (event) => {
  if (event.httpMethod !== "POST") {
    return { statusCode: 405, body: "Method Not Allowed" };
  }

  const apiKey = process.env.WAVESPEED_API_KEY;
  if (!apiKey) {
    return { statusCode: 500, body: "Missing WAVESPEED_API_KEY" };
  }

  let body;
  try {
    body = JSON.parse(event.body || "{}");
  } catch (err) {
    return { statusCode: 400, body: "Invalid JSON" };
  }

  const prompts = Array.isArray(body.prompts) ? body.prompts : [];
  if (prompts.length === 0) {
    return { statusCode: 400, body: "prompts[] required" };
  }
  if (prompts.length > 20) {
    return { statusCode: 400, body: "Max 20 prompts per batch" };
  }

  const settings = {
    aspect_ratio: body.aspect_ratio || "16:9",
    duration: Number(body.duration || 5),
    camera_fixed: Boolean(body.camera_fixed),
    seed: typeof body.seed === "number" ? body.seed : -1,
  };

  const taskIds = [];

  for (const prompt of prompts) {
    const payload = { prompt, ...settings };
    const resp = await fetch(
      `https://api.wavespeed.ai/api/v3/${encodeURIComponent(DEFAULT_MODEL)}`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify(payload),
      }
    );

    const data = await resp.json().catch(() => ({}));
    if (!resp.ok) {
      return {
        statusCode: resp.status,
        body: JSON.stringify({ error: "WaveSpeed create failed", details: data }),
      };
    }

    const taskId = pickTaskId(data);
    if (!taskId) {
      return {
        statusCode: 500,
        body: JSON.stringify({ error: "Missing task id", details: data }),
      };
    }

    taskIds.push(taskId);
  }

  return {
    statusCode: 200,
    body: JSON.stringify({ task_ids: taskIds }),
  };
};
