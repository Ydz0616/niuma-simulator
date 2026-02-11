# Frontend Integration Notes (Reference UI)

Reference UI path:
`/Users/yuandong/Documents/New project/corporate_asylum/frontend_ref/niuma_simulator_reference`

## Splash Button OAuth

In `components/SplashScreen.tsx`, replace mock `handleLogin` with:

1. Call backend: `GET http://localhost:8000/api/auth/secondme/start`
2. Read `authorize_url`
3. `window.location.href = authorize_url`

Example logic:

```ts
const handleLogin = async () => {
  setIsAuthenticating(true);
  try {
    const resp = await fetch('http://localhost:8000/api/auth/secondme/start');
    const data = await resp.json();
    window.location.href = data.authorize_url;
  } catch (e) {
    setIsAuthenticating(false);
    alert('OAuth init failed');
  }
};
```

## Callback handling

Backend callback redirects to:
- success: `http://localhost:5173/?auth=success&user_id=<uuid>`
- error: `http://localhost:5173/?auth=error&reason=...`

Frontend `App.tsx` can parse query param `user_id`, then request:
`GET /api/me/card?user_id=<uuid>`

## Security

- Never put `client_secret` in frontend.
- Keep token exchange in backend only.
- Keep `redirect_uri` exactly same in Dev Console and backend config.
