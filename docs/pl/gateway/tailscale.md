---
read_when:
    - Udostępnianie interfejsu sterowania Gateway poza localhost
    - Automatyzacja dostępu do tailnetu lub publicznego panelu
summary: Zintegrowane Tailscale Serve/Funnel dla panelu Gateway
title: Tailscale
x-i18n:
    generated_at: "2026-05-10T19:38:56Z"
    model: gpt-5.5
    provider: openai
    source_hash: e3a90145b9884f31d43fabaddabe17e6ba017dabaec6e6e7d263dacefb33f1b6
    source_path: gateway/tailscale.md
    workflow: 16
---

OpenClaw może automatycznie skonfigurować Tailscale **Serve** (tailnet) lub **Funnel** (publicznie) dla panelu Gateway i portu WebSocket. Dzięki temu Gateway pozostaje przypisany do loopback, podczas gdy Tailscale zapewnia HTTPS, routing oraz (dla Serve) nagłówki tożsamości.

## Tryby

- `serve`: Serve tylko w tailnecie przez `tailscale serve`. Gateway pozostaje na `127.0.0.1`.
- `funnel`: Publiczny HTTPS przez `tailscale funnel`. OpenClaw wymaga współdzielonego hasła.
- `off`: Domyślnie (bez automatyzacji Tailscale).

Wyniki stanu i audytu używają określenia **ekspozycja Tailscale** dla tego trybu OpenClaw Serve/Funnel. `off` oznacza, że OpenClaw nie zarządza Serve ani Funnel; nie oznacza to, że lokalny demon Tailscale jest zatrzymany albo wylogowany.

## Uwierzytelnianie

Ustaw `gateway.auth.mode`, aby kontrolować handshake:

- `none` (tylko prywatny ingress)
- `token` (domyślnie, gdy ustawiono `OPENCLAW_GATEWAY_TOKEN`)
- `password` (współdzielony sekret przez `OPENCLAW_GATEWAY_PASSWORD` lub konfigurację)
- `trusted-proxy` (reverse proxy świadome tożsamości; zobacz [Uwierzytelnianie zaufanego proxy](/pl/gateway/trusted-proxy-auth))

Gdy `tailscale.mode = "serve"` i `gateway.auth.allowTailscale` ma wartość `true`, uwierzytelnianie Control UI/WebSocket może używać nagłówków tożsamości Tailscale (`tailscale-user-login`) bez podawania tokenu/hasła. OpenClaw weryfikuje tożsamość, rozwiązując adres `x-forwarded-for` przez lokalnego demona Tailscale (`tailscale whois`) i dopasowując go do nagłówka przed jego zaakceptowaniem. OpenClaw traktuje żądanie jako Serve tylko wtedy, gdy przychodzi ono z loopback z nagłówkami Tailscale `x-forwarded-for`, `x-forwarded-proto` i `x-forwarded-host`.
W przypadku sesji operatora Control UI, które obejmują tożsamość urządzenia przeglądarki, ta zweryfikowana ścieżka Serve pomija także rundę parowania urządzenia. Nie omija ona tożsamości urządzenia przeglądarki: klienci bez urządzenia nadal są odrzucani, a połączenia WebSocket z rolą node albo spoza Control UI nadal przechodzą standardowe kontrole parowania i uwierzytelniania.
Endpointy HTTP API (na przykład `/v1/*`, `/tools/invoke` i `/api/channels/*`) **nie** używają uwierzytelniania przez nagłówki tożsamości Tailscale. Nadal podlegają normalnemu trybowi uwierzytelniania HTTP Gateway: domyślnie uwierzytelnianiu przez współdzielony sekret albo celowo skonfigurowanej konfiguracji trusted-proxy / prywatnego ingressu `none`.
Ten przepływ bez tokenu zakłada, że host Gateway jest zaufany. Jeśli na tym samym hoście może działać niezaufany kod lokalny, wyłącz `gateway.auth.allowTailscale` i zamiast tego wymagaj uwierzytelniania tokenem/hasłem.
Aby wymagać jawnych poświadczeń współdzielonego sekretu, ustaw `gateway.auth.allowTailscale: false` i użyj `gateway.auth.mode: "token"` albo `"password"`.

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

Otwórz: `https://<magicdns>/` (albo skonfigurowaną wartość `gateway.controlUi.basePath`)

### Tylko tailnet (wiązanie z adresem IP tailnetu)

Użyj tego, gdy chcesz, aby Gateway nasłuchiwał bezpośrednio na adresie IP tailnetu (bez Serve/Funnel).

```json5
{
  gateway: {
    bind: "tailnet",
    auth: { mode: "token", token: "your-token" },
  },
}
```

Połącz się z innego urządzenia w tailnecie:

- Control UI: `http://<tailscale-ip>:18789/`
- WebSocket: `ws://<tailscale-ip>:18789`

<Note>
Loopback (`http://127.0.0.1:18789`) **nie** zadziała w tym trybie.
</Note>

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
- `tailscale.mode: "funnel"` odmawia uruchomienia, jeśli tryb uwierzytelniania nie jest ustawiony na `password`, aby uniknąć publicznej ekspozycji.
- Ustaw `gateway.tailscale.resetOnExit`, jeśli chcesz, aby OpenClaw cofnął konfigurację `tailscale serve` albo `tailscale funnel` przy zamykaniu.
- Ustaw `gateway.tailscale.preserveFunnel: true`, aby utrzymać zewnętrznie skonfigurowaną trasę `tailscale funnel` aktywną między restartami gateway. Gdy ta opcja jest włączona, a gateway działa w `mode: "serve"`, OpenClaw sprawdza `tailscale funnel status` przed ponownym zastosowaniem Serve i pomija je, gdy trasa Funnel już obejmuje port gateway. Polityka Funnel zarządzanego przez OpenClaw, ograniczona do hasła, pozostaje bez zmian.
- `gateway.bind: "tailnet"` to bezpośrednie wiązanie z tailnetem (bez HTTPS, bez Serve/Funnel).
- `gateway.bind: "auto"` preferuje loopback; użyj `tailnet`, jeśli chcesz wyłącznie tailnet.
- Serve/Funnel eksponują tylko **interfejs kontrolny Gateway + WS**. Nodes łączą się przez ten sam endpoint Gateway WS, więc Serve może działać dla dostępu do node.

## Sterowanie przeglądarką (zdalny Gateway + lokalna przeglądarka)

Jeśli uruchamiasz Gateway na jednej maszynie, ale chcesz sterować przeglądarką na innej maszynie, uruchom **host node** na maszynie z przeglądarką i utrzymuj obie w tym samym tailnecie.
Gateway będzie przekazywać działania przeglądarki do node; nie jest potrzebny osobny serwer kontrolny ani URL Serve.

Unikaj Funnel do sterowania przeglądarką; traktuj parowanie node jak dostęp operatora.

## Wymagania wstępne i ograniczenia Tailscale

- Serve wymaga włączonego HTTPS dla Twojego tailnetu; CLI wyświetli monit, jeśli go brakuje.
- Serve wstrzykuje nagłówki tożsamości Tailscale; Funnel tego nie robi.
- Funnel wymaga Tailscale v1.38.3+, MagicDNS, włączonego HTTPS i atrybutu node funnel.
- Funnel obsługuje tylko porty `443`, `8443` i `10000` przez TLS.
- Funnel w macOS wymaga wariantu aplikacji Tailscale typu open source.

## Dowiedz się więcej

- Omówienie Tailscale Serve: [https://tailscale.com/kb/1312/serve](https://tailscale.com/kb/1312/serve)
- Polecenie `tailscale serve`: [https://tailscale.com/kb/1242/tailscale-serve](https://tailscale.com/kb/1242/tailscale-serve)
- Omówienie Tailscale Funnel: [https://tailscale.com/kb/1223/tailscale-funnel](https://tailscale.com/kb/1223/tailscale-funnel)
- Polecenie `tailscale funnel`: [https://tailscale.com/kb/1311/tailscale-funnel](https://tailscale.com/kb/1311/tailscale-funnel)

## Powiązane

- [Zdalny dostęp](/pl/gateway/remote)
- [Discovery](/pl/gateway/discovery)
- [Uwierzytelnianie](/pl/gateway/authentication)
