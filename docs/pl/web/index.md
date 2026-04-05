---
read_when:
    - Chcesz uzyskać dostęp do Gateway przez Tailscale
    - Chcesz używać przeglądarkowego Control UI i edycji konfiguracji
summary: 'Powierzchnie web Gateway: Control UI, tryby bind i bezpieczeństwo'
title: Web
x-i18n:
    generated_at: "2026-04-05T14:10:25Z"
    model: gpt-5.4
    provider: openai
    source_hash: 15f5643283f7d37235d3d8104897f38db27ac5a9fdef6165156fb542d0e7048c
    source_path: web/index.md
    workflow: 15
---

# Web (Gateway)

Gateway udostępnia mały **przeglądarkowy Control UI** (Vite + Lit) z tego samego portu co Gateway WebSocket:

- domyślnie: `http://<host>:18789/`
- opcjonalny prefiks: ustaw `gateway.controlUi.basePath` (np. `/openclaw`)

Możliwości opisano w [Control UI](/web/control-ui).
Ta strona skupia się na trybach bind, bezpieczeństwie i powierzchniach webowych.

## Webhooki

Gdy `hooks.enabled=true`, Gateway udostępnia także mały endpoint webhooka na tym samym serwerze HTTP.
Zobacz [Konfigurację gateway](/gateway/configuration) → `hooks`, aby poznać auth + payloady.

## Konfiguracja (domyślnie włączone)

Control UI jest **domyślnie włączone**, gdy obecne są zasoby (`dist/control-ui`).
Możesz sterować tym przez konfigurację:

```json5
{
  gateway: {
    controlUi: { enabled: true, basePath: "/openclaw" }, // basePath opcjonalne
  },
}
```

## Dostęp przez Tailscale

### Zintegrowane Serve (zalecane)

Utrzymuj Gateway na loopback i pozwól Tailscale Serve go proxy’ować:

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

### Bind do tailnet + token

```json5
{
  gateway: {
    bind: "tailnet",
    controlUi: { enabled: true },
    auth: { mode: "token", token: "your-token" },
  },
}
```

Następnie uruchom gateway (ten przykład spoza loopback używa auth tokenem ze
współdzielonym sekretem):

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

- Auth gateway jest domyślnie wymagane (token, hasło, `trusted-proxy` albo nagłówki tożsamości Tailscale Serve, gdy są włączone).
- Bindy spoza loopback nadal **wymagają** auth gateway. W praktyce oznacza to auth tokenem/hasłem albo reverse proxy świadome tożsamości z `gateway.auth.mode: "trusted-proxy"`.
- Kreator domyślnie tworzy auth współdzielonym sekretem i zwykle generuje
  token gateway (nawet na loopback).
- W trybie współdzielonego sekretu UI wysyła `connect.params.auth.token` albo
  `connect.params.auth.password`.
- W trybach niosących tożsamość, takich jak Tailscale Serve albo `trusted-proxy`,
  kontrola auth WebSocket jest spełniana z nagłówków żądania.
- Dla wdrożeń Control UI spoza loopback jawnie ustaw
  `gateway.controlUi.allowedOrigins` (pełne originy). Bez tego start gateway jest domyślnie odrzucany.
- `gateway.controlUi.dangerouslyAllowHostHeaderOriginFallback=true` włącza
  tryb fallbacku origin na podstawie Host-header, ale jest to niebezpieczne obniżenie bezpieczeństwa.
- Przy Serve nagłówki tożsamości Tailscale mogą spełniać auth Control UI/WebSocket,
  gdy `gateway.auth.allowTailscale` ma wartość `true` (token/hasło nie są wymagane).
  Endpointy HTTP API nie używają tych nagłówków tożsamości Tailscale; zamiast tego
  podążają za normalnym trybem auth HTTP gateway. Ustaw
  `gateway.auth.allowTailscale: false`, aby wymagać jawnych poświadczeń. Zobacz
  [Tailscale](/gateway/tailscale) i [Bezpieczeństwo](/gateway/security). Ten
  przepływ bez tokena zakłada, że host gateway jest zaufany.
- `gateway.tailscale.mode: "funnel"` wymaga `gateway.auth.mode: "password"` (współdzielone hasło).

## Budowanie UI

Gateway serwuje pliki statyczne z `dist/control-ui`. Zbuduj je przez:

```bash
pnpm ui:build # automatycznie instaluje zależności UI przy pierwszym uruchomieniu
```
