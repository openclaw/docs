---
read_when:
    - Chcesz uzyskać dostęp do Gateway przez Tailscale
    - Chcesz przeglądarkowego Control UI i edycji konfiguracji
summary: 'Powierzchnie web Gateway: Control UI, tryby bind i bezpieczeństwo'
title: Web
x-i18n:
    generated_at: "2026-04-24T09:39:26Z"
    model: gpt-5.4
    provider: openai
    source_hash: 0336a6597cebf4a8a83d348abd3d59ff4b9bd7349a32c8a0a0093da0f656e97d
    source_path: web/index.md
    workflow: 15
---

Gateway serwuje małe przeglądarkowe **Control UI** (Vite + Lit) z tego samego portu co Gateway WebSocket:

- domyślnie: `http://<host>:18789/`
- opcjonalny prefiks: ustaw `gateway.controlUi.basePath` (np. `/openclaw`)

Możliwości opisano w [Control UI](/pl/web/control-ui).
Ta strona koncentruje się na trybach bind, bezpieczeństwie i powierzchniach web.

## Webhooki

Gdy `hooks.enabled=true`, Gateway wystawia także mały punkt końcowy webhooków na tym samym serwerze HTTP.
Zobacz [Konfiguracja Gateway](/pl/gateway/configuration) → `hooks`, aby poznać auth + ładunki.

## Config (domyślnie włączone)

Control UI jest **włączone domyślnie**, gdy obecne są zasoby (`dist/control-ui`).
Możesz sterować nim przez config:

```json5
{
  gateway: {
    controlUi: { enabled: true, basePath: "/openclaw" }, // basePath opcjonalne
  },
}
```

## Dostęp przez Tailscale

### Zintegrowane Serve (zalecane)

Pozostaw Gateway na loopback i pozwól, aby Tailscale Serve go proxy’ował:

```json5
{
  gateway: {
    bind: "loopback",
    tailscale: { mode: "serve" },
  },
}
```

Następnie uruchom gateway:

```bash
openclaw gateway
```

Otwórz:

- `https://<magicdns>/` (albo skonfigurowane `gateway.controlUi.basePath`)

### Bind tailnet + token

```json5
{
  gateway: {
    bind: "tailnet",
    controlUi: { enabled: true },
    auth: { mode: "token", token: "your-token" },
  },
}
```

Następnie uruchom gateway (ten przykład non-loopback używa auth tokenem
ze współdzielonym sekretem):

```bash
openclaw gateway
```

Otwórz:

- `http://<tailscale-ip>:18789/` (albo skonfigurowane `gateway.controlUi.basePath`)

### Publiczny internet (Funnel)

```json5
{
  gateway: {
    bind: "loopback",
    tailscale: { mode: "funnel" },
    auth: { mode: "password" }, // albo OPENCLAW_GATEWAY_PASSWORD
  },
}
```

## Uwagi dotyczące bezpieczeństwa

- Auth Gateway jest domyślnie wymagane (token, hasło, trusted-proxy albo nagłówki tożsamości Tailscale Serve, gdy są włączone).
- Bindy non-loopback nadal **wymagają** auth gateway. W praktyce oznacza to auth tokenem/hasłem albo proxy odwrotne świadome tożsamości z `gateway.auth.mode: "trusted-proxy"`.
- Kreator domyślnie tworzy auth ze współdzielonym sekretem i zwykle generuje
  token gateway (nawet na loopback).
- W trybie współdzielonego sekretu UI wysyła `connect.params.auth.token` albo
  `connect.params.auth.password`.
- W trybach niosących tożsamość, takich jak Tailscale Serve albo `trusted-proxy`, sprawdzenie auth WebSocket jest spełniane z nagłówków żądania.
- Dla wdrożeń Control UI non-loopback ustaw jawnie `gateway.controlUi.allowedOrigins`
  (pełne originy). Bez tego uruchomienie gateway jest domyślnie odrzucane.
- `gateway.controlUi.dangerouslyAllowHostHeaderOriginFallback=true` włącza
  tryb fallback origin oparty na nagłówku Host, ale jest to niebezpieczne obniżenie poziomu bezpieczeństwa.
- W przypadku Serve nagłówki tożsamości Tailscale mogą spełniać auth Control UI/WebSocket,
  gdy `gateway.auth.allowTailscale` ma wartość `true` (token/hasło nie jest wymagane).
  Punkty końcowe HTTP API nie używają tych nagłówków tożsamości Tailscale; zamiast tego stosują
  zwykły tryb HTTP auth gateway. Ustaw
  `gateway.auth.allowTailscale: false`, aby wymagać jawnych poświadczeń. Zobacz
  [Tailscale](/pl/gateway/tailscale) i [Bezpieczeństwo](/pl/gateway/security). Ten
  beztokenowy przepływ zakłada, że host gateway jest zaufany.
- `gateway.tailscale.mode: "funnel"` wymaga `gateway.auth.mode: "password"` (współdzielone hasło).

## Budowanie UI

Gateway serwuje pliki statyczne z `dist/control-ui`. Zbuduj je poleceniem:

```bash
pnpm ui:build
```
