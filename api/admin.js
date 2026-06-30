const JSON_HEADERS = { "Content-Type": "application/json; charset=utf-8" };

function sendJson(res, status, payload) {
  res.statusCode = status;
  Object.entries(JSON_HEADERS).forEach(([key, value]) => res.setHeader(key, value));
  res.end(JSON.stringify(payload));
}

function getEnv() {
  const supabaseUrl = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL || "";
  const publishableKey =
    process.env.SUPABASE_PUBLISHABLE_KEY ||
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ||
    process.env.SUPABASE_ANON_KEY ||
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
    "";
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || "";
  return {
    supabaseUrl: supabaseUrl.replace(/\/$/, ""),
    publishableKey,
    serviceRoleKey
  };
}

async function readBody(req) {
  if (req.body && typeof req.body === "object") return req.body;
  const chunks = [];
  for await (const chunk of req) chunks.push(Buffer.from(chunk));
  const text = Buffer.concat(chunks).toString("utf8");
  return text ? JSON.parse(text) : {};
}

function getBearerToken(req) {
  const header = req.headers.authorization || req.headers.Authorization || "";
  const match = String(header).match(/^Bearer\s+(.+)$/i);
  return match ? match[1] : "";
}

function assertEnv(env) {
  if (!env.supabaseUrl || !env.publishableKey || !env.serviceRoleKey) {
    throw new Error("Missing SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY or SUPABASE_SERVICE_ROLE_KEY on the server.");
  }
}

async function supabaseFetch(env, path, options = {}) {
  const response = await fetch(`${env.supabaseUrl}${path}`, {
    ...options,
    headers: {
      apikey: env.serviceRoleKey,
      Authorization: `Bearer ${env.serviceRoleKey}`,
      "Content-Type": "application/json",
      ...(options.headers || {})
    }
  });
  const text = await response.text();
  const payload = text ? safeJsonParse(text) : null;
  if (!response.ok) {
    const message = payload?.msg || payload?.message || payload?.error_description || payload?.error || text || `Supabase request failed: ${response.status}`;
    const error = new Error(message);
    error.status = response.status;
    error.payload = payload || text;
    throw error;
  }
  return payload;
}

function safeJsonParse(text) {
  try {
    return JSON.parse(text);
  } catch (error) {
    return text;
  }
}

async function getCurrentUser(env, token) {
  const response = await fetch(`${env.supabaseUrl}/auth/v1/user`, {
    headers: {
      apikey: env.publishableKey,
      Authorization: `Bearer ${token}`
    }
  });
  const text = await response.text();
  if (!response.ok) throw new Error(text || "Invalid owner session.");
  return JSON.parse(text);
}

async function assertPlatformOwner(env, token) {
  if (!token) throw new Error("Missing Authorization bearer token.");
  const user = await getCurrentUser(env, token);
  const owners = await supabaseFetch(
    env,
    `/rest/v1/platform_owners?user_id=eq.${encodeURIComponent(user.id)}&active=eq.true&select=id,user_id,email,name&limit=1`
  );
  if (!Array.isArray(owners) || !owners.length) throw new Error("Only platform owners can use this API.");
  return { user, owner: owners[0] };
}

function validatePassword(password) {
  const value = String(password || "");
  if (value.length < 8) throw new Error("Temporary password must contain at least 8 characters.");
  return value;
}

function normalizeRole(role) {
  return ["team_admin", "coach", "viewer"].includes(role) ? role : "coach";
}

function normalizeAssignments(assignments) {
  return (Array.isArray(assignments) ? assignments : [])
    .map((assignment) => ({
      teamId: String(assignment.teamId || "").trim(),
      role: normalizeRole(assignment.role),
      active: assignment.active !== false
    }))
    .filter((assignment) => assignment.teamId);
}

async function createCoach(env, body) {
  const email = String(body.email || "").trim().toLowerCase();
  const name = String(body.name || "").trim() || email;
  const password = validatePassword(body.password);
  const assignments = normalizeAssignments(body.assignments);
  if (!email || !email.includes("@")) throw new Error("A valid coach email is required.");
  if (!assignments.length) throw new Error("At least one team assignment is required.");

  const authUser = await supabaseFetch(env, "/auth/v1/admin/users", {
    method: "POST",
    body: JSON.stringify({
      email,
      password,
      email_confirm: true,
      user_metadata: { name }
    })
  });

  const rows = assignments.map((assignment) => ({
    team_id: assignment.teamId,
    user_id: authUser.id,
    name,
    email,
    role: assignment.role,
    active: assignment.active
  }));

  await supabaseFetch(env, "/rest/v1/coaches?on_conflict=team_id,user_id", {
    method: "POST",
    headers: { Prefer: "resolution=merge-duplicates,return=representation" },
    body: JSON.stringify(rows)
  });

  return { user: { id: authUser.id, email }, assignments: rows.length };
}

async function resetCoachPassword(env, body) {
  const userId = String(body.userId || "").trim();
  const password = validatePassword(body.password);
  if (!userId) throw new Error("Missing coach user id.");
  const authUser = await supabaseFetch(env, `/auth/v1/admin/users/${encodeURIComponent(userId)}`, {
    method: "PUT",
    body: JSON.stringify({ password })
  });
  return { user: { id: authUser.id, email: authUser.email } };
}

async function handleAdminApiRequest(req, res) {
  if (req.method === "OPTIONS") {
    res.statusCode = 204;
    res.end();
    return;
  }
  if (req.method !== "POST") {
    sendJson(res, 405, { ok: false, error: "Method not allowed." });
    return;
  }

  try {
    const env = getEnv();
    assertEnv(env);
    const token = getBearerToken(req);
    await assertPlatformOwner(env, token);
    const body = await readBody(req);
    const action = String(body.action || "");
    if (action === "createCoach") {
      sendJson(res, 200, { ok: true, result: await createCoach(env, body) });
      return;
    }
    if (action === "resetCoachPassword") {
      sendJson(res, 200, { ok: true, result: await resetCoachPassword(env, body) });
      return;
    }
    sendJson(res, 400, { ok: false, error: "Unsupported admin action." });
  } catch (error) {
    console.error("[Owner Admin API]", error);
    sendJson(res, error.status && error.status >= 400 ? error.status : 400, {
      ok: false,
      error: error.message || "Admin API error."
    });
  }
}

export { handleAdminApiRequest };

export default async function handler(req, res) {
  await handleAdminApiRequest(req, res);
}
