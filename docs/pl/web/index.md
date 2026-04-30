---
read_when:
    - Chcesz uzyskać dostęp do Gateway przez Tailscale
    - Chcesz mieć przeglądarkowy interfejs sterowania i edycję konfiguracji
summary: 'Powierzchnie webowe Gateway: interfejs sterowania, tryby wiązania i bezpieczeństwo'
title: Sieć
x-i18n:
    generated_at: "2026-04-30T10:26:26Z"
    model: gpt-5.5
    provider: openai
    source_hash: d1e357d1e9f4ad0286b9412cd0a684b6428180e0586eef76577ecb2909212fb2
    source_path: web/index.md
    workflow: 16
---

Gateway udostępnia mały **przeglądarkowy Control UI** (Vite + Lit) z tego samego portu co WebSocket Gateway:

- domyślnie: `http://<host>:18789/`
- z `gateway.tls.enabled: true`: `https://<host>:18789/`
- opcjonalny prefiks: ustaw `gateway.controlUi.basePath` (np. `/openclaw`)

Możliwości opisano w [Control UI](/pl/web/control-ui). Pozostała część tej strony skupia się na trybach wiązania, bezpieczeństwie i powierzchniach dostępnych z sieci.

## Webhooki

Gdy `hooks.enabled=true`, Gateway udostępnia także mały punkt końcowy webhooka na tym samym serwerze HTTP.
Zobacz [konfigurację Gateway](/pl/gateway/configuration) → `hooks`, aby poznać uwierzytelnianie i ładunki.

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

Pozostaw Gateway na loopback i pozwól Tailscale Serve pośredniczyć w dostępie:

```json5
{
  gateway: {
    bind: "loopback",
    tailscale: { mode: "serve" },
  },
}
```

Następnie uruchom Gateway:

```bash
openclaw gateway
```

Otwórz:

- `https://<magicdns>/` (lub skonfigurowany `gateway.controlUi.basePath`)

### Wiązanie tailnet + token

```json5
{
  gateway: {
    bind: "tailnet",
    controlUi: { enabled: true },
    auth: { mode: "token", token: "your-token" },
  },
}
```

Następnie uruchom Gateway (ten przykład bez loopback używa uwierzytelniania tokenem współdzielonego sekretu):

```bash
openclaw gateway
```

Otwórz:

- `http://<tailscale-ip>:18789/` (lub skonfigurowany `gateway.controlUi.basePath`)

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

- Uwierzytelnianie Gateway jest domyślnie wymagane (token, hasło, zaufany serwer proxy albo nagłówki tożsamości Tailscale Serve, gdy są włączone).
- Wiązania bez loopback nadal **wymagają** uwierzytelniania Gateway. W praktyce oznacza to uwierzytelnianie tokenem/hasłem albo świadomy tożsamości zwrotny serwer proxy z `gateway.auth.mode: "trusted-proxy"`.
- Kreator domyślnie tworzy uwierzytelnianie współdzielonym sekretem i zwykle generuje token Gateway (nawet na loopback).
- W trybie współdzielonego sekretu UI wysyła `connect.params.auth.token` albo `connect.params.auth.password`.
- Gdy `gateway.tls.enabled: true`, lokalny pulpit i pomocnicze narzędzia statusu renderują adresy URL pulpitu `https://` oraz adresy URL WebSocket `wss://`.
- W trybach przenoszących tożsamość, takich jak Tailscale Serve albo `trusted-proxy`, kontrola uwierzytelniania WebSocket jest spełniana zamiast tego z nagłówków żądania.
- W przypadku wdrożeń Control UI bez loopback ustaw jawnie `gateway.controlUi.allowedOrigins` (pełne źródła). Bez tego uruchomienie Gateway jest domyślnie odrzucane.
- `gateway.controlUi.dangerouslyAllowHostHeaderOriginFallback=true` włącza tryb awaryjnego pochodzenia na podstawie nagłówka Host, ale jest to niebezpieczne obniżenie poziomu bezpieczeństwa.
- Z Serve nagłówki tożsamości Tailscale mogą spełnić uwierzytelnianie Control UI/WebSocket, gdy `gateway.auth.allowTailscale` ma wartość `true` (token/hasło nie są wymagane). Punkty końcowe HTTP API nie używają tych nagłówków tożsamości Tailscale; zamiast tego stosują normalny tryb uwierzytelniania HTTP Gateway. Ustaw `gateway.auth.allowTailscale: false`, aby wymagać jawnych poświadczeń. Zobacz [Tailscale](/pl/gateway/tailscale) i [Bezpieczeństwo](/pl/gateway/security). Ten przepływ bez tokena zakłada, że host Gateway jest zaufany.
- `gateway.tailscale.mode: "funnel"` wymaga `gateway.auth.mode: "password"` (współdzielone hasło).

## Budowanie UI

Gateway udostępnia pliki statyczne z `dist/control-ui`. Zbuduj je poleceniem:

```bash
pnpm ui:build
```
