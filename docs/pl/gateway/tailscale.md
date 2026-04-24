---
read_when:
    - Udostępnianie interfejsu Gateway Control UI poza localhostem
    - Automatyzacja dostępu do panelu przez tailnet lub publicznie
summary: Zintegrowane Tailscale Serve/Funnel dla panelu Gateway
title: Tailscale
x-i18n:
    generated_at: "2026-04-24T09:12:33Z"
    model: gpt-5.4
    provider: openai
    source_hash: 30bfe5fa2c9295dcf7164a1a89876d2e097f54d42bd261dfde973fddbd9185ce
    source_path: gateway/tailscale.md
    workflow: 15
---

# Tailscale (panel Gateway)

OpenClaw może automatycznie konfigurować Tailscale **Serve** (tailnet) lub **Funnel** (publicznie) dla
panelu Gateway i portu WebSocket. Dzięki temu Gateway pozostaje związany z loopback, podczas gdy
Tailscale zapewnia HTTPS, routing oraz (dla Serve) nagłówki tożsamości.

## Tryby

- `serve`: Serve tylko dla tailnet przez `tailscale serve`. Gateway pozostaje na `127.0.0.1`.
- `funnel`: Publiczny HTTPS przez `tailscale funnel`. OpenClaw wymaga współdzielonego hasła.
- `off`: Domyślnie (brak automatyzacji Tailscale).

## Uwierzytelnianie

Ustaw `gateway.auth.mode`, aby kontrolować handshake:

- `none` (tylko prywatny ingress)
- `token` (domyślnie, gdy ustawiono `OPENCLAW_GATEWAY_TOKEN`)
- `password` (wspólny sekret przez `OPENCLAW_GATEWAY_PASSWORD` lub konfigurację)
- `trusted-proxy` (odwrócone proxy rozpoznające tożsamość; zobacz [Trusted Proxy Auth](/pl/gateway/trusted-proxy-auth))

Gdy `tailscale.mode = "serve"` oraz `gateway.auth.allowTailscale` ma wartość `true`,
uwierzytelnianie Control UI/WebSocket może używać nagłówków tożsamości Tailscale
(`tailscale-user-login`) bez podawania tokenu/hasła. OpenClaw weryfikuje
tożsamość, rozwiązując adres `x-forwarded-for` przez lokalnego demona Tailscale
(`tailscale whois`) i dopasowując go do nagłówka przed jego zaakceptowaniem.
OpenClaw traktuje żądanie jako Serve tylko wtedy, gdy dociera ono z loopback z
nagłówkami Tailscale `x-forwarded-for`, `x-forwarded-proto` i `x-forwarded-host`.
Endpointy HTTP API (na przykład `/v1/*`, `/tools/invoke` i `/api/channels/*`)
**nie** używają uwierzytelniania nagłówkiem tożsamości Tailscale. Nadal podążają za
zwykłym trybem uwierzytelniania HTTP gateway: domyślnie uwierzytelnianie wspólnym sekretem albo celowo
skonfigurowane `trusted-proxy` / prywatny ingress `none`.
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

Użyj tego, gdy chcesz, aby Gateway nasłuchiwał bezpośrednio na adresie IP Tailnet (bez Serve/Funnel).

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

### Publiczny Internet (Funnel + współdzielone hasło)

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
- `tailscale.mode: "funnel"` odmawia uruchomienia, jeśli tryb uwierzytelniania nie jest ustawiony na `password`, aby uniknąć publicznej ekspozycji.
- Ustaw `gateway.tailscale.resetOnExit`, jeśli chcesz, aby OpenClaw cofał konfigurację `tailscale serve`
  lub `tailscale funnel` przy wyłączaniu.
- `gateway.bind: "tailnet"` to bezpośrednie powiązanie z Tailnet (bez HTTPS, bez Serve/Funnel).
- `gateway.bind: "auto"` preferuje loopback; użyj `tailnet`, jeśli chcesz wyłącznie Tailnet.
- Serve/Funnel udostępniają tylko **Control UI + WS Gateway**. Nodes łączą się przez
  ten sam endpoint Gateway WS, więc Serve może działać także dla dostępu do Node.

## Sterowanie przeglądarką (zdalny Gateway + lokalna przeglądarka)

Jeśli uruchamiasz Gateway na jednej maszynie, ale chcesz sterować przeglądarką na innej maszynie,
uruchom **host Node** na maszynie z przeglądarką i utrzymuj obie maszyny w tej samej tailnet.
Gateway będzie przekazywać akcje przeglądarki do Node; nie jest potrzebny osobny serwer sterowania ani URL Serve.

Unikaj Funnel przy sterowaniu przeglądarką; traktuj parowanie Node jak dostęp operatora.

## Wymagania wstępne i ograniczenia Tailscale

- Serve wymaga włączonego HTTPS dla Twojego tailnet; CLI wyświetli monit, jeśli go brakuje.
- Serve wstrzykuje nagłówki tożsamości Tailscale; Funnel tego nie robi.
- Funnel wymaga Tailscale v1.38.3+, MagicDNS, włączonego HTTPS i atrybutu węzła funnel.
- Funnel obsługuje przez TLS tylko porty `443`, `8443` i `10000`.
- Funnel na macOS wymaga wariantu aplikacji Tailscale typu open source.

## Dowiedz się więcej

- Przegląd Tailscale Serve: [https://tailscale.com/kb/1312/serve](https://tailscale.com/kb/1312/serve)
- Polecenie `tailscale serve`: [https://tailscale.com/kb/1242/tailscale-serve](https://tailscale.com/kb/1242/tailscale-serve)
- Przegląd Tailscale Funnel: [https://tailscale.com/kb/1223/tailscale-funnel](https://tailscale.com/kb/1223/tailscale-funnel)
- Polecenie `tailscale funnel`: [https://tailscale.com/kb/1311/tailscale-funnel](https://tailscale.com/kb/1311/tailscale-funnel)

## Powiązane

- [Remote access](/pl/gateway/remote)
- [Discovery](/pl/gateway/discovery)
- [Authentication](/pl/gateway/authentication)
