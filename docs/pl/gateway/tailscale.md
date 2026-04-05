---
read_when:
    - Udostępnianie Control UI Gateway poza localhost
    - Automatyzowanie dostępu do panelu przez tailnet lub publicznie
summary: Zintegrowane Tailscale Serve/Funnel dla panelu Gateway
title: Tailscale
x-i18n:
    generated_at: "2026-04-05T13:54:49Z"
    model: gpt-5.4
    provider: openai
    source_hash: 4ca5316e804e089c31a78ae882b3082444e082fb2b36b73679ffede20590cb2e
    source_path: gateway/tailscale.md
    workflow: 15
---

# Tailscale (panel Gateway)

OpenClaw może automatycznie skonfigurować Tailscale **Serve** (tailnet) lub **Funnel** (publicznie) dla
panelu Gateway oraz portu WebSocket. Dzięki temu Gateway pozostaje powiązany z loopback, a
Tailscale zapewnia HTTPS, routing i (dla Serve) nagłówki tożsamości.

## Tryby

- `serve`: tylko Tailnet Serve przez `tailscale serve`. Gateway pozostaje na `127.0.0.1`.
- `funnel`: publiczny HTTPS przez `tailscale funnel`. OpenClaw wymaga współdzielonego hasła.
- `off`: domyślnie (bez automatyzacji Tailscale).

## Uwierzytelnianie

Ustaw `gateway.auth.mode`, aby sterować handshake:

- `none` (tylko dla prywatnego ingressu)
- `token` (domyślnie, gdy ustawiono `OPENCLAW_GATEWAY_TOKEN`)
- `password` (współdzielony sekret przez `OPENCLAW_GATEWAY_PASSWORD` lub konfigurację)
- `trusted-proxy` (reverse proxy świadome tożsamości; zobacz [Trusted Proxy Auth](/gateway/trusted-proxy-auth))

Gdy `tailscale.mode = "serve"` i `gateway.auth.allowTailscale` ma wartość `true`,
uwierzytelnianie Control UI/WebSocket może używać nagłówków tożsamości Tailscale
(`tailscale-user-login`) bez podawania tokenu/hasła. OpenClaw weryfikuje
tożsamość, rozwiązując adres `x-forwarded-for` przez lokalny demon Tailscale
(`tailscale whois`) i dopasowując go do nagłówka przed jego zaakceptowaniem.
OpenClaw traktuje żądanie jako pochodzące z Serve tylko wtedy, gdy przychodzi z loopback z
nagłówkami Tailscale `x-forwarded-for`, `x-forwarded-proto` i `x-forwarded-host`.
Endpointy HTTP API (na przykład `/v1/*`, `/tools/invoke` i `/api/channels/*`)
nie używają uwierzytelniania nagłówkami tożsamości Tailscale. Nadal stosują zwykły
tryb uwierzytelniania HTTP gateway: domyślnie uwierzytelnianie współdzielonym sekretem albo
celowo skonfigurowany trusted-proxy / prywatny ingress z `none`.
Ten przepływ bez tokenu zakłada, że host gateway jest zaufany. Jeśli na tym samym hoście
może działać niezaufany kod lokalny, wyłącz `gateway.auth.allowTailscale` i zamiast tego
wymagaj uwierzytelniania tokenem/hasłem.
Aby wymagać jawnych poświadczeń współdzielonego sekretu, ustaw `gateway.auth.allowTailscale: false`
i użyj `gateway.auth.mode: "token"` lub `"password"`.

## Przykłady konfiguracji

### Tylko tailnet (Serve)

```json5
{
  gateway: {
    bind: "loopback",
    tailscale: { mode: "serve" },
  },
}
```

Otwórz: `https://<magicdns>/` (lub skonfigurowane `gateway.controlUi.basePath`)

### Tylko tailnet (powiązanie z adresem IP Tailnet)

Użyj tego, jeśli chcesz, aby Gateway nasłuchiwał bezpośrednio na adresie IP Tailnet (bez Serve/Funnel).

```json5
{
  gateway: {
    bind: "tailnet",
    auth: { mode: "token", token: "your-token" },
  },
}
```

Połącz z innego urządzenia Tailnet:

- Control UI: `http://<tailscale-ip>:18789/`
- WebSocket: `ws://<tailscale-ip>:18789`

Uwaga: loopback (`http://127.0.0.1:18789`) **nie** będzie działać w tym trybie.

### Publiczny internet (Funnel + współdzielone hasło)

```json5
{
  gateway: {
    bind: "loopback",
    tailscale: { mode: "funnel" },
    auth: { mode: "password", password: "replace-me" },
  },
}
```

Preferuj `OPENCLAW_GATEWAY_PASSWORD` zamiast zapisywania hasła na dysku.

## Przykłady CLI

```bash
openclaw gateway --tailscale serve
openclaw gateway --tailscale funnel --auth password
```

## Uwagi

- Tailscale Serve/Funnel wymaga zainstalowanego i zalogowanego CLI `tailscale`.
- `tailscale.mode: "funnel"` odmawia uruchomienia, jeśli tryb uwierzytelniania nie jest `password`, aby uniknąć publicznej ekspozycji.
- Ustaw `gateway.tailscale.resetOnExit`, jeśli chcesz, aby OpenClaw cofnął konfigurację `tailscale serve`
  lub `tailscale funnel` przy zamykaniu.
- `gateway.bind: "tailnet"` to bezpośrednie powiązanie Tailnet (bez HTTPS, bez Serve/Funnel).
- `gateway.bind: "auto"` preferuje loopback; użyj `tailnet`, jeśli chcesz tylko Tailnet.
- Serve/Funnel udostępniają tylko **Gateway control UI + WS**. Węzły łączą się przez
  ten sam endpoint Gateway WS, więc Serve może działać również dla dostępu węzłów.

## Sterowanie przeglądarką (zdalny Gateway + lokalna przeglądarka)

Jeśli uruchamiasz Gateway na jednej maszynie, ale chcesz sterować przeglądarką na innej,
uruchom **node host** na maszynie z przeglądarką i utrzymuj obie maszyny w tym samym tailnet.
Gateway będzie proxyować działania przeglądarki do węzła; nie jest potrzebny osobny serwer sterowania ani URL Serve.

Unikaj Funnel do sterowania przeglądarką; traktuj parowanie węzłów jak dostęp operatora.

## Wymagania wstępne i ograniczenia Tailscale

- Serve wymaga włączonego HTTPS dla Twojego tailnet; CLI wyświetli monit, jeśli go brakuje.
- Serve wstrzykuje nagłówki tożsamości Tailscale; Funnel nie.
- Funnel wymaga Tailscale v1.38.3+, MagicDNS, włączonego HTTPS i atrybutu węzła funnel.
- Funnel obsługuje przez TLS tylko porty `443`, `8443` i `10000`.
- Funnel na macOS wymaga wariantu aplikacji Tailscale open source.

## Dowiedz się więcej

- Przegląd Tailscale Serve: [https://tailscale.com/kb/1312/serve](https://tailscale.com/kb/1312/serve)
- Polecenie `tailscale serve`: [https://tailscale.com/kb/1242/tailscale-serve](https://tailscale.com/kb/1242/tailscale-serve)
- Przegląd Tailscale Funnel: [https://tailscale.com/kb/1223/tailscale-funnel](https://tailscale.com/kb/1223/tailscale-funnel)
- Polecenie `tailscale funnel`: [https://tailscale.com/kb/1311/tailscale-funnel](https://tailscale.com/kb/1311/tailscale-funnel)
