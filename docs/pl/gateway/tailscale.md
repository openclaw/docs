---
read_when:
    - Udostępnianie interfejsu sterowania Gateway poza localhost
    - Automatyzacja dostępu do sieci Tailscale lub publicznego panelu
summary: Zintegrowana obsługa Tailscale Serve/Funnel w pulpicie nawigacyjnym Gateway
title: Tailscale
x-i18n:
    generated_at: "2026-05-06T17:56:24Z"
    model: gpt-5.5
    provider: openai
    source_hash: 89a2094dc5d9250b3af2dcc991e83099bdf6fc4039c86358ca57f7e58899196d
    source_path: gateway/tailscale.md
    workflow: 16
---

OpenClaw może automatycznie skonfigurować Tailscale **Serve** (tailnet) lub **Funnel** (publiczny) dla
panelu Gateway i portu WebSocket. Dzięki temu Gateway pozostaje powiązany z local loopback, a
Tailscale zapewnia HTTPS, routing oraz (dla Serve) nagłówki tożsamości.

## Tryby

- `serve`: Serve dostępny tylko w tailnet przez `tailscale serve`. Gateway pozostaje na `127.0.0.1`.
- `funnel`: Publiczny HTTPS przez `tailscale funnel`. OpenClaw wymaga wspólnego hasła.
- `off`: Domyślnie (brak automatyzacji Tailscale).

Dane stanu i audytu używają określenia **ekspozycja Tailscale** dla tego trybu OpenClaw Serve/Funnel.
`off` oznacza, że OpenClaw nie zarządza Serve ani Funnel; nie oznacza to, że
lokalny demon Tailscale jest zatrzymany albo wylogowany.

## Uwierzytelnianie

Ustaw `gateway.auth.mode`, aby kontrolować uzgadnianie połączenia:

- `none` (tylko prywatne wejście)
- `token` (domyślnie, gdy ustawiono `OPENCLAW_GATEWAY_TOKEN`)
- `password` (wspólny sekret przez `OPENCLAW_GATEWAY_PASSWORD` albo konfigurację)
- `trusted-proxy` (odwrotne proxy świadome tożsamości; zobacz [Uwierzytelnianie zaufanego proxy](/pl/gateway/trusted-proxy-auth))

Gdy `tailscale.mode = "serve"` i `gateway.auth.allowTailscale` ma wartość `true`,
uwierzytelnianie Control UI/WebSocket może używać nagłówków tożsamości Tailscale
(`tailscale-user-login`) bez podawania tokena/hasła. OpenClaw weryfikuje
tożsamość, rozwiązując adres `x-forwarded-for` przez lokalnego demona Tailscale
(`tailscale whois`) i dopasowując go do nagłówka przed zaakceptowaniem.
OpenClaw traktuje żądanie jako Serve tylko wtedy, gdy pochodzi z local loopback z
nagłówkami Tailscale `x-forwarded-for`, `x-forwarded-proto` i `x-forwarded-host`.
W przypadku sesji operatora Control UI, które obejmują tożsamość urządzenia przeglądarki, ta
zweryfikowana ścieżka Serve pomija również obieg parowania urządzenia. Nie omija
tożsamości urządzenia przeglądarki: klienci bez urządzenia nadal są odrzucani, a połączenia WebSocket
dla roli node albo poza Control UI nadal przechodzą standardowe parowanie i
kontrole uwierzytelniania.
Punkty końcowe HTTP API (na przykład `/v1/*`, `/tools/invoke` i `/api/channels/*`)
**nie** używają uwierzytelniania opartego na nagłówkach tożsamości Tailscale. Nadal stosują normalny
tryb uwierzytelniania HTTP Gateway: domyślnie uwierzytelnianie wspólnym sekretem albo celowo
skonfigurowany trusted-proxy / prywatne wejście `none`.
Ten przepływ bez tokena zakłada, że host Gateway jest zaufany. Jeśli niezaufany kod lokalny
może działać na tym samym hoście, wyłącz `gateway.auth.allowTailscale` i zamiast tego wymagaj
uwierzytelniania tokenem/hasłem.
Aby wymagać jawnych danych uwierzytelniających opartych na wspólnym sekrecie, ustaw `gateway.auth.allowTailscale: false`
i użyj `gateway.auth.mode: "token"` albo `"password"`.

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

Otwórz: `https://<magicdns>/` (albo skonfigurowany przez Ciebie `gateway.controlUi.basePath`)

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

<Note>
Loopback (`http://127.0.0.1:18789`) **nie** będzie działać w tym trybie.
</Note>

### Publiczny internet (Funnel + wspólne hasło)

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
- `tailscale.mode: "funnel"` odmawia uruchomienia, chyba że trybem uwierzytelniania jest `password`, aby uniknąć publicznej ekspozycji.
- Ustaw `gateway.tailscale.resetOnExit`, jeśli chcesz, aby OpenClaw cofnął konfigurację `tailscale serve`
  albo `tailscale funnel` przy zamykaniu.
- `gateway.bind: "tailnet"` to bezpośrednie powiązanie Tailnet (bez HTTPS, bez Serve/Funnel).
- `gateway.bind: "auto"` preferuje local loopback; użyj `tailnet`, jeśli chcesz dostęp tylko przez Tailnet.
- Serve/Funnel udostępniają tylko **interfejs sterowania Gateway + WS**. Węzły łączą się przez
  ten sam punkt końcowy Gateway WS, więc Serve może działać dla dostępu do węzłów.

## Sterowanie przeglądarką (zdalny Gateway + lokalna przeglądarka)

Jeśli uruchamiasz Gateway na jednej maszynie, ale chcesz sterować przeglądarką na innej maszynie,
uruchom **host węzła** na maszynie z przeglądarką i utrzymuj oba w tym samym tailnet.
Gateway będzie pośredniczyć w akcjach przeglądarki do węzła; osobny serwer sterowania ani URL Serve nie są potrzebne.

Unikaj Funnel do sterowania przeglądarką; traktuj parowanie węzła jak dostęp operatora.

## Wymagania wstępne i ograniczenia Tailscale

- Serve wymaga włączonego HTTPS dla Twojego tailnet; CLI wyświetli monit, jeśli go brakuje.
- Serve wstrzykuje nagłówki tożsamości Tailscale; Funnel tego nie robi.
- Funnel wymaga Tailscale v1.38.3+, MagicDNS, włączonego HTTPS oraz atrybutu węzła funnel.
- Funnel obsługuje tylko porty `443`, `8443` i `10000` przez TLS.
- Funnel na macOS wymaga wariantu aplikacji Tailscale o otwartym kodzie źródłowym.

## Dowiedz się więcej

- Omówienie Tailscale Serve: [https://tailscale.com/kb/1312/serve](https://tailscale.com/kb/1312/serve)
- Polecenie `tailscale serve`: [https://tailscale.com/kb/1242/tailscale-serve](https://tailscale.com/kb/1242/tailscale-serve)
- Omówienie Tailscale Funnel: [https://tailscale.com/kb/1223/tailscale-funnel](https://tailscale.com/kb/1223/tailscale-funnel)
- Polecenie `tailscale funnel`: [https://tailscale.com/kb/1311/tailscale-funnel](https://tailscale.com/kb/1311/tailscale-funnel)

## Powiązane

- [Dostęp zdalny](/pl/gateway/remote)
- [Wykrywanie](/pl/gateway/discovery)
- [Uwierzytelnianie](/pl/gateway/authentication)
