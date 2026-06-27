---
read_when:
    - Chcesz uzyskać dostęp do Gateway przez Tailscale
    - Chcesz korzystać z przeglądarkowego interfejsu Control UI i edycji konfiguracji
summary: 'Powierzchnie internetowe Gateway: Control UI, tryby wiązania i zabezpieczenia'
title: Sieć
x-i18n:
    generated_at: "2026-06-27T18:33:36Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 1c6b0c9f4ff53af295eb4eef7290d5d6b70c52543f57a9e83c7f8a635a2b35cd
    source_path: web/index.md
    workflow: 16
---

Gateway udostępnia niewielki **przeglądarkowy Control UI** (Vite + Lit) z tego samego portu co WebSocket Gateway:

- domyślnie: `http://<host>:18789/`
- z `gateway.tls.enabled: true`: `https://<host>:18789/`
- opcjonalny prefiks: ustaw `gateway.controlUi.basePath` (np. `/openclaw`)

Możliwości opisano w [Control UI](/pl/web/control-ui). Reszta tej strony skupia się na trybach bindowania, bezpieczeństwie i powierzchniach wystawianych do sieci.

## Webhooki

Gdy `hooks.enabled=true`, Gateway udostępnia również niewielki punkt końcowy webhooka na tym samym serwerze HTTP.
Zobacz [konfigurację Gateway](/pl/gateway/configuration) → `hooks`, aby poznać uwierzytelnianie i payloady.

## Administracyjne HTTP RPC

Administracyjne HTTP RPC udostępnia wybrane metody płaszczyzny sterowania Gateway pod adresem `POST /api/v1/admin/rpc`.
Domyślnie jest wyłączone i jest rejestrowane tylko wtedy, gdy włączony jest Plugin `admin-http-rpc`.
Zobacz [Administracyjne HTTP RPC](/pl/plugins/admin-http-rpc), aby poznać model uwierzytelniania, dozwolone metody i porównanie z WebSocket.

## Konfiguracja (domyślnie włączona)

Control UI jest **domyślnie włączony**, gdy zasoby są obecne (`dist/control-ui`).
Możesz sterować nim przez konfigurację:

```json5
{
  gateway: {
    controlUi: { enabled: true, basePath: "/openclaw" }, // basePath optional
  },
}
```

## Dostęp przez Tailscale

### Zintegrowane Serve (zalecane)

Pozostaw Gateway na loopback i pozwól Tailscale Serve pośredniczyć do niego:

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

- `https://<magicdns>/` (albo skonfigurowany `gateway.controlUi.basePath`)

### Bindowanie Tailnet + token

```json5
{
  gateway: {
    bind: "tailnet",
    controlUi: { enabled: true },
    auth: { mode: "token", token: "your-token" },
  },
}
```

Następnie uruchom gateway (ten przykład bez loopback używa uwierzytelniania tokenem współdzielonego sekretu):

```bash
openclaw gateway
```

Otwórz:

- `http://<tailscale-ip>:18789/` (albo skonfigurowany `gateway.controlUi.basePath`)

### Publiczny internet (Funnel)

```json5
{
  gateway: {
    bind: "loopback",
    tailscale: { mode: "funnel" },
    auth: { mode: "password" }, // or OPENCLAW_GATEWAY_PASSWORD
  },
}
```

## Uwagi dotyczące bezpieczeństwa

- Uwierzytelnianie Gateway jest domyślnie wymagane (token, hasło, trusted-proxy albo nagłówki tożsamości Tailscale Serve, gdy są włączone).
- Bindowania bez loopback nadal **wymagają** uwierzytelniania gateway. W praktyce oznacza to uwierzytelnianie tokenem/hasłem albo reverse proxy świadome tożsamości z `gateway.auth.mode: "trusted-proxy"`.
- Kreator domyślnie tworzy uwierzytelnianie współdzielonym sekretem i zwykle generuje token gateway (nawet na loopback).
- W trybie współdzielonego sekretu UI wysyła `connect.params.auth.token` albo `connect.params.auth.password`.
- Gdy `gateway.tls.enabled: true`, lokalne dashboardy i pomocnicze widoki statusu renderują adresy URL dashboardu `https://` oraz adresy URL WebSocket `wss://`.
- W trybach przenoszących tożsamość, takich jak Tailscale Serve lub `trusted-proxy`, sprawdzenie uwierzytelniania WebSocket jest zamiast tego spełniane na podstawie nagłówków żądania.
- W publicznych wdrożeniach Control UI bez loopback ustaw jawnie `gateway.controlUi.allowedOrigins` (pełne originy). Prywatne ładowania LAN/Tailnet z tym samym originem są akceptowane dla loopback, RFC1918/link-local, `.local`, `.ts.net` i hostów Tailscale CGNAT.
- `gateway.controlUi.dangerouslyAllowHostHeaderOriginFallback=true` włącza tryb awaryjnego użycia originu z nagłówka Host, ale jest to niebezpieczne obniżenie poziomu bezpieczeństwa.
- Z Serve nagłówki tożsamości Tailscale mogą spełniać uwierzytelnianie Control UI/WebSocket, gdy `gateway.auth.allowTailscale` ma wartość `true` (bez wymaganego tokena/hasła). Punkty końcowe HTTP API nie używają tych nagłówków tożsamości Tailscale; zamiast tego stosują normalny tryb uwierzytelniania HTTP gateway. Ustaw `gateway.auth.allowTailscale: false`, aby wymagać jawnych poświadczeń. Zobacz [Tailscale](/pl/gateway/tailscale) i [Bezpieczeństwo](/pl/gateway/security). Ten przepływ bez tokena zakłada, że host gateway jest zaufany.
- `gateway.tailscale.mode: "funnel"` wymaga `gateway.auth.mode: "password"` (współdzielone hasło).

## Budowanie UI

Gateway udostępnia pliki statyczne z `dist/control-ui`. Zbuduj je poleceniem:

```bash
pnpm ui:build
```
