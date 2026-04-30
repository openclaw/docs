---
read_when:
    - Udostępnianie interfejsu sterowania Gateway poza localhost
    - Automatyzacja dostępu do tailnetu lub publicznego panelu
summary: Zintegrowana obsługa Tailscale Serve/Funnel dla panelu Gateway
title: Tailscale
x-i18n:
    generated_at: "2026-04-30T09:56:49Z"
    model: gpt-5.5
    provider: openai
    source_hash: e5bc0a90ce8105017f5f52bad4a40609711f4bd4538437916c020680d3e9eda4
    source_path: gateway/tailscale.md
    workflow: 16
---

OpenClaw może automatycznie konfigurować Tailscale **Serve** (tailnet) lub **Funnel** (publiczny) dla
pulpitu Gateway i portu WebSocket. Dzięki temu Gateway pozostaje powiązany z loopback, a
Tailscale zapewnia HTTPS, routing oraz (dla Serve) nagłówki tożsamości.

## Tryby

- `serve`: Serve tylko w Tailnet przez `tailscale serve`. Gateway pozostaje na `127.0.0.1`.
- `funnel`: Publiczny HTTPS przez `tailscale funnel`. OpenClaw wymaga współdzielonego hasła.
- `off`: Domyślnie (bez automatyzacji Tailscale).

Dane wyjściowe statusu i audytu używają określenia **ekspozycja Tailscale** dla tego trybu
Serve/Funnel w OpenClaw. `off` oznacza, że OpenClaw nie zarządza Serve ani Funnel; nie oznacza to, że
lokalny demon Tailscale jest zatrzymany lub wylogowany.

## Uwierzytelnianie

Ustaw `gateway.auth.mode`, aby kontrolować uzgadnianie:

- `none` (tylko prywatne wejście)
- `token` (domyślnie, gdy ustawiono `OPENCLAW_GATEWAY_TOKEN`)
- `password` (współdzielony sekret przez `OPENCLAW_GATEWAY_PASSWORD` lub konfigurację)
- `trusted-proxy` (odwrotny proxy świadomy tożsamości; zobacz [Uwierzytelnianie przez zaufany proxy](/pl/gateway/trusted-proxy-auth))

Gdy `tailscale.mode = "serve"` i `gateway.auth.allowTailscale` ma wartość `true`,
uwierzytelnianie interfejsu sterowania/WebSocket może używać nagłówków tożsamości Tailscale
(`tailscale-user-login`) bez podawania tokenu/hasła. OpenClaw weryfikuje
tożsamość, rozpoznając adres `x-forwarded-for` przez lokalnego demona Tailscale
(`tailscale whois`) i dopasowując go do nagłówka przed jego zaakceptowaniem.
OpenClaw traktuje żądanie jako Serve tylko wtedy, gdy przychodzi z loopback z nagłówkami
Tailscale `x-forwarded-for`, `x-forwarded-proto` i `x-forwarded-host`.
W przypadku sesji operatora interfejsu sterowania, które obejmują tożsamość urządzenia przeglądarki, ta
zweryfikowana ścieżka Serve pomija także rundę parowania urządzenia. Nie omija
tożsamości urządzenia przeglądarki: klienci bez urządzenia są nadal odrzucani, a połączenia WebSocket
z rolą węzła lub spoza interfejsu sterowania nadal przechodzą standardowe parowanie i
kontrole uwierzytelniania.
Punkty końcowe API HTTP (na przykład `/v1/*`, `/tools/invoke` i `/api/channels/*`)
**nie** używają uwierzytelniania przez nagłówki tożsamości Tailscale. Nadal stosują zwykły
tryb uwierzytelniania HTTP Gateway: domyślnie uwierzytelnianie współdzielonym sekretem albo celowo
skonfigurowaną konfigurację zaufanego proxy / prywatnego wejścia `none`.
Ten przepływ bez tokenu zakłada, że host Gateway jest zaufany. Jeśli niezaufany kod lokalny
może działać na tym samym hoście, wyłącz `gateway.auth.allowTailscale` i zamiast tego wymagaj
uwierzytelniania tokenem/hasłem.
Aby wymagać jawnych poświadczeń współdzielonego sekretu, ustaw `gateway.auth.allowTailscale: false`
i użyj `gateway.auth.mode: "token"` lub `"password"`.

## Przykłady konfiguracji

### Tylko Tailnet (Serve)

```json5
{
  gateway: {
    bind: "loopback",
    tailscale: { mode: "serve" },
  },
}
```

Otwórz: `https://<magicdns>/` (lub skonfigurowaną wartość `gateway.controlUi.basePath`)

### Tylko Tailnet (powiązanie z adresem IP Tailnet)

Użyj tego, gdy chcesz, aby Gateway nasłuchiwał bezpośrednio na adresie IP Tailnet (bez Serve/Funnel).

```json5
{
  gateway: {
    bind: "tailnet",
    auth: { mode: "token", token: "your-token" },
  },
}
```

Połącz się z innego urządzenia Tailnet:

- Interfejs sterowania: `http://<tailscale-ip>:18789/`
- WebSocket: `ws://<tailscale-ip>:18789`

<Note>
Loopback (`http://127.0.0.1:18789`) **nie** będzie działać w tym trybie.
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
- `tailscale.mode: "funnel"` odmawia uruchomienia, chyba że tryb uwierzytelniania to `password`, aby uniknąć publicznej ekspozycji.
- Ustaw `gateway.tailscale.resetOnExit`, jeśli chcesz, aby OpenClaw cofnął konfigurację `tailscale serve`
  lub `tailscale funnel` przy zamykaniu.
- `gateway.bind: "tailnet"` to bezpośrednie powiązanie Tailnet (bez HTTPS, bez Serve/Funnel).
- `gateway.bind: "auto"` preferuje loopback; użyj `tailnet`, jeśli chcesz tylko Tailnet.
- Serve/Funnel udostępniają tylko **interfejs sterowania Gateway + WS**. Węzły łączą się przez
  ten sam punkt końcowy WS Gateway, więc Serve może działać dla dostępu węzłów.

## Sterowanie przeglądarką (zdalny Gateway + lokalna przeglądarka)

Jeśli uruchamiasz Gateway na jednym komputerze, ale chcesz sterować przeglądarką na innym komputerze,
uruchom **host węzła** na komputerze z przeglądarką i trzymaj oba w tym samym tailnet.
Gateway będzie przekazywać akcje przeglądarki do węzła; nie jest potrzebny osobny serwer sterowania ani adres URL Serve.

Unikaj Funnel do sterowania przeglądarką; traktuj parowanie węzłów jak dostęp operatora.

## Wymagania wstępne i ograniczenia Tailscale

- Serve wymaga włączonego HTTPS dla Twojego tailnet; CLI wyświetli monit, jeśli go brakuje.
- Serve wstrzykuje nagłówki tożsamości Tailscale; Funnel nie.
- Funnel wymaga Tailscale v1.38.3+, MagicDNS, włączonego HTTPS oraz atrybutu węzła funnel.
- Funnel obsługuje tylko porty `443`, `8443` i `10000` przez TLS.
- Funnel na macOS wymaga wariantu aplikacji Tailscale o otwartym kodzie źródłowym.

## Dowiedz się więcej

- Omówienie Tailscale Serve: [https://tailscale.com/kb/1312/serve](https://tailscale.com/kb/1312/serve)
- Polecenie `tailscale serve`: [https://tailscale.com/kb/1242/tailscale-serve](https://tailscale.com/kb/1242/tailscale-serve)
- Omówienie Tailscale Funnel: [https://tailscale.com/kb/1223/tailscale-funnel](https://tailscale.com/kb/1223/tailscale-funnel)
- Polecenie `tailscale funnel`: [https://tailscale.com/kb/1311/tailscale-funnel](https://tailscale.com/kb/1311/tailscale-funnel)

## Powiązane

- [Zdalny dostęp](/pl/gateway/remote)
- [Wykrywanie](/pl/gateway/discovery)
- [Uwierzytelnianie](/pl/gateway/authentication)
