export async function login(username: string, password: string): Promise<boolean> {
  const res = await fetch('/api/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username, password }),
    credentials: 'include',
  });
  return res.ok;
}

export async function logout(): Promise<void> {
  await fetch('/api/auth/logout', { method: 'POST', credentials: 'include' });
}

export async function getData<T>(): Promise<T | null> {
  const res = await fetch('/api/data', { credentials: 'include' });
  if (res.status === 204) return null;
  if (!res.ok) throw new Error(`Failed to fetch data: ${res.status}`);
  return await res.json();
}

export async function putData<T>(data: T): Promise<boolean> {
  const res = await fetch('/api/data', {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
    credentials: 'include',
  });
  return res.ok;
}

export async function getAuthConfig(): Promise<{ signupAllowed: boolean }> {
  const res = await fetch('/api/auth/config', { credentials: 'include' });
  if (!res.ok) throw new Error('Failed to fetch auth config');
  return res.json();
}

export async function signup(username: string, password: string): Promise<boolean> {
  const res = await fetch('/api/auth/signup', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username, password }),
    credentials: 'include',
  });
  return res.ok;
}
