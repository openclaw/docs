---
read_when:
    - Chcesz uzyskać dostęp do Gateway przez Tailscale
    - Chcesz korzystać z interfejsu Control UI w przeglądarce i edytować konfigurację
summary: 'Powierzchnie webowe Gateway: interfejs sterowania, tryby powiązania i bezpieczeństwo'
title: Sieć Web
x-i18n:
    generated_at: "2026-07-12T15:47:51Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 413fb029d95241f5c6043b28825727cdee52b2fa8cbe998fbbd6e3ff7b81467b
    source_path: web/index.md
    workflow: 16
---

Gateway udostępnia niewielki **przeglądarkowy interfejs sterowania** (Vite + Lit) na tym samym porcie co WebSocket Gatewaya:

- domyślnie: `http://<host>:18789/`
- z `gateway.tls.enabled: true`: `https://<host>:18789/`
- opcjonalny prefiks: ustaw `gateway.controlUi.basePath` (np. `/openclaw`)

Opis funkcji znajduje się na stronie [Interfejs sterowania](/pl/web/control-ui). Ta strona omawia tryby powiązania, zabezpieczenia i inne powierzchnie dostępne przez WWW.

## Konfiguracja (domyślnie włączona)

Interfejs sterowania jest **domyślnie włączony**, gdy zasoby są dostępne (`dist/control-ui`):

```json5
{
  gateway: {
    controlUi: { enabled: true, basePath: "/openclaw" }, // basePath opcjonalne
  },
}
```

## Webhooki

Gdy `hooks.enabled=true`, Gateway udostępnia również punkt końcowy Webhooka na tym samym serwerze HTTP. Informacje o uwierzytelnianiu i ładunkach zawiera sekcja `hooks` w [dokumentacji konfiguracji Gatewaya](/pl/gateway/configuration-reference#hooks).

## Administracyjne RPC przez HTTP

`POST /api/v1/admin/rpc` udostępnia wybrane metody płaszczyzny sterowania Gatewaya przez HTTP. Funkcja jest domyślnie wyłączona i rejestrowana tylko po włączeniu pluginu `admin-http-rpc`. Informacje o modelu uwierzytelniania, dozwolonych metodach i porównaniu z API WebSocket zawiera strona [Administracyjne RPC przez HTTP](/pl/plugins/admin-http-rpc).

## Dostęp przez Tailscale

<Tabs>
  <Tab title="Zintegrowane Serve (zalecane)">
    Pozostaw Gateway w local loopback i pozwól usłudze Tailscale Serve działać jako serwer proxy:

    ```json5
    {
      gateway: {
        bind: "loopback",
        tailscale: { mode: "serve" },
      },
    }
    ```

    Uruchom Gateway:

    ```bash
    openclaw gateway
    ```

    Otwórz `https://<magicdns>/` (lub skonfigurowaną ścieżkę `gateway.controlUi.basePath`).

  </Tab>
  <Tab title="Powiązanie z tailnetem + token">
    ```json5
    {
      gateway: {
        bind: "tailnet",
        controlUi: { enabled: true },
        auth: { mode: "token", token: "your-token" },
      },
    }
    ```

    Uruchom Gateway (ten przykład bez local loopback używa uwierzytelniania tokenem będącym współdzielonym sekretem):

    ```bash
    openclaw gateway
    ```

    Otwórz `http://<tailscale-ip>:18789/` (lub skonfigurowaną ścieżkę `gateway.controlUi.basePath`).

  </Tab>
  <Tab title="Publiczny internet (Funnel)">
    ```json5
    {
      gateway: {
        bind: "loopback",
        tailscale: { mode: "funnel" },
        auth: { mode: "password" }, // lub OPENCLAW_GATEWAY_PASSWORD
      },
    }
    ```

    `tailscale.mode: "funnel"` wymaga `gateway.auth.mode: "password"`; zarówno Serve, jak i Funnel wymagają `gateway.bind: "loopback"`.

  </Tab>
</Tabs>

## Uwagi dotyczące bezpieczeństwa

- Uwierzytelnianie Gatewaya jest domyślnie wymagane: token, hasło, zaufany serwer proxy lub — po włączeniu — nagłówki tożsamości Tailscale Serve.
- Powiązania inne niż local loopback nadal **wymagają** uwierzytelniania Gatewaya: tokenem/hasłem lub przez odwrotny serwer proxy rozpoznający tożsamość z ustawieniem `gateway.auth.mode: "trusted-proxy"`.
- Kreator wdrażania domyślnie tworzy uwierzytelnianie współdzielonym sekretem i zwykle generuje token Gatewaya, nawet w local loopback.
- W trybie współdzielonego sekretu interfejs wysyła `connect.params.auth.token` lub `connect.params.auth.password` podczas uzgadniania połączenia WebSocket.
- Przy `gateway.tls.enabled: true` lokalne narzędzia pulpitu i stanu generują adresy URL `https://` oraz adresy URL WebSocket `wss://`.
- W trybach przekazujących tożsamość (Tailscale Serve, `trusted-proxy`) kontrola uwierzytelniania WebSocket jest realizowana na podstawie nagłówków żądania zamiast współdzielonego sekretu.
- W przypadku publicznych wdrożeń interfejsu sterowania poza local loopback ustaw jawnie `gateway.controlUi.allowedOrigins` (pełne źródła). Prywatne żądania z tego samego źródła są akceptowane bez tego ustawienia dla local loopback, adresów RFC1918/link-local oraz hostów `.local`, `.ts.net` i Tailscale CGNAT.
- `gateway.controlUi.dangerouslyAllowHostHeaderOriginFallback: true` włącza awaryjne ustalanie źródła na podstawie nagłówka Host; jest to niebezpieczne osłabienie zabezpieczeń.
- W przypadku Serve nagłówki tożsamości Tailscale spełniają wymagania uwierzytelniania interfejsu sterowania/WebSocket, gdy `gateway.auth.allowTailscale: true` (token ani hasło nie są wymagane). Punkty końcowe API HTTP nie używają nagłówków tożsamości Tailscale; zawsze stosują zwykły tryb uwierzytelniania HTTP Gatewaya. Ustaw `gateway.auth.allowTailscale: false`, aby wymagać jawnych danych uwierzytelniających nawet przez Serve. Ten przepływ bez tokena zakłada, że sam host Gatewaya jest zaufany. Zobacz [Tailscale](/pl/gateway/tailscale) i [Bezpieczeństwo](/pl/gateway/security).

## Budowanie interfejsu

Gateway udostępnia pliki statyczne z `dist/control-ui`:

```bash
pnpm ui:build
```
