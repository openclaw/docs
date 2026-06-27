---
read_when:
    - Udostępnianie interfejsu sterowania Gateway poza localhost
    - Automatyzacja dostępu do tailnetu lub publicznego panelu użytkownika
summary: Zintegrowane Tailscale Serve/Funnel dla panelu Gateway
title: Tailscale
x-i18n:
    generated_at: "2026-06-27T17:38:13Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 35944eba19cd82d373b25c602b66d1b76f35ad63aa90767bb1c7ef75549fe905
    source_path: gateway/tailscale.md
    workflow: 16
---

OpenClaw może automatycznie skonfigurować Tailscale **Serve** (tailnet) lub **Funnel** (publiczny) dla
panelu Gateway i portu WebSocket. Dzięki temu Gateway pozostaje powiązany z loopback, podczas gdy
Tailscale zapewnia HTTPS, routing oraz (dla Serve) nagłówki tożsamości.

## Tryby

- `serve`: Serve tylko w tailnet przez `tailscale serve`. Gateway pozostaje na `127.0.0.1`.
- `funnel`: Publiczny HTTPS przez `tailscale funnel`. OpenClaw wymaga wspólnego hasła.
- `off`: Domyślne (bez automatyzacji Tailscale).

Dane wyjściowe statusu i audytu używają **ekspozycji Tailscale** dla tego trybu
OpenClaw Serve/Funnel. `off` oznacza, że OpenClaw nie zarządza Serve ani Funnel; nie oznacza to, że
lokalny demon Tailscale jest zatrzymany albo wylogowany.

## Uwierzytelnianie

Ustaw `gateway.auth.mode`, aby kontrolować uzgadnianie:

- `none` (tylko prywatny ruch przychodzący)
- `token` (domyślne, gdy ustawiono `OPENCLAW_GATEWAY_TOKEN`)
- `password` (wspólny sekret przez `OPENCLAW_GATEWAY_PASSWORD` lub konfigurację)
- `trusted-proxy` (odwrotne proxy świadome tożsamości; zobacz [Uwierzytelnianie zaufanego proxy](/pl/gateway/trusted-proxy-auth))

Gdy `tailscale.mode = "serve"` i `gateway.auth.allowTailscale` ma wartość `true`,
uwierzytelnianie Control UI/WebSocket może używać nagłówków tożsamości Tailscale
(`tailscale-user-login`) bez podawania tokenu/hasła. OpenClaw weryfikuje
tożsamość, rozwiązuje adres `x-forwarded-for` przez lokalnego demona Tailscale
(`tailscale whois`) i dopasowuje go do nagłówka przed zaakceptowaniem.
OpenClaw traktuje żądanie jako Serve tylko wtedy, gdy pochodzi z loopback z nagłówkami
Tailscale `x-forwarded-for`, `x-forwarded-proto` i `x-forwarded-host`.
W przypadku sesji operatora Control UI, które obejmują tożsamość urządzenia przeglądarki, ta
zweryfikowana ścieżka Serve pomija też podróż w obie strony parowania urządzenia. Nie omija ona
tożsamości urządzenia przeglądarki: klienci bez urządzenia nadal są odrzucani, a połączenia WebSocket
z rolą węzła lub spoza Control UI nadal przechodzą przez zwykłe parowanie i
kontrole uwierzytelniania.
Punkty końcowe API HTTP (na przykład `/v1/*`, `/tools/invoke` i `/api/channels/*`)
**nie** używają uwierzytelniania nagłówkiem tożsamości Tailscale. Nadal stosują zwykły
tryb uwierzytelniania HTTP Gateway: domyślnie uwierzytelnianie wspólnym sekretem albo celowo
skonfigurowaną konfigurację zaufanego proxy / prywatnego ruchu przychodzącego `none`.
Ten przepływ bez tokenu zakłada, że host Gateway jest zaufany. Jeśli na tym samym hoście
może działać niezaufany kod lokalny, wyłącz `gateway.auth.allowTailscale` i zamiast tego wymagaj
uwierzytelniania tokenem/hasłem.
Aby wymagać jawnych poświadczeń wspólnego sekretu, ustaw `gateway.auth.allowTailscale: false`
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

Aby udostępnić Control UI przez nazwaną usługę Tailscale zamiast nazwy hosta
urządzenia, ustaw `gateway.tailscale.serviceName` na nazwę usługi:

```json5
{
  gateway: {
    bind: "loopback",
    tailscale: { mode: "serve", serviceName: "svc:openclaw" },
  },
}
```

W powyższym przykładzie podczas uruchamiania adres URL usługi jest zgłaszany jako
`https://openclaw.<tailnet-name>.ts.net/` zamiast nazwy hosta urządzenia.
Usługi Tailscale wymagają, aby host był zatwierdzonym oznaczonym węzłem w Twoim
tailnet. Skonfiguruj tag i zatwierdź usługę w Tailscale przed włączeniem
tej opcji, w przeciwnym razie `tailscale serve --service=...` zakończy się niepowodzeniem podczas uruchamiania
Gateway.

### Tylko tailnet (powiązanie z adresem IP tailnet)

Użyj tego, gdy chcesz, aby Gateway nasłuchiwał bezpośrednio na adresie IP tailnet (bez Serve/Funnel).

```json5
{
  gateway: {
    bind: "tailnet",
    auth: { mode: "token", token: "your-token" },
  },
}
```

Połącz z innego urządzenia w tailnet:

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

- Tailscale Serve/Funnel wymaga zainstalowanego CLI `tailscale` i zalogowania.
- `tailscale.mode: "funnel"` odmawia uruchomienia, chyba że tryb uwierzytelniania to `password`, aby uniknąć publicznego wystawienia.
- `gateway.tailscale.serviceName` dotyczy tylko trybu Serve i jest przekazywane do
  `tailscale serve --service=<name>`. Wartość musi używać formatu nazwy usługi
  Tailscale `svc:<dns-label>`, na przykład `svc:openclaw`.
  Tailscale wymaga, aby hosty usług były oznaczonymi węzłami, a usługa może wymagać
  zatwierdzenia w konsoli administratora, zanim Serve będzie mogło ją opublikować.
- Ustaw `gateway.tailscale.resetOnExit`, jeśli chcesz, aby OpenClaw cofnął konfigurację `tailscale serve`
  lub `tailscale funnel` przy zamykaniu.
- Ustaw `gateway.tailscale.preserveFunnel: true`, aby utrzymać zewnętrznie skonfigurowaną
  trasę `tailscale funnel` między restartami Gateway. Gdy opcja jest włączona, a
  Gateway działa w `mode: "serve"`, OpenClaw sprawdza `tailscale funnel status`
  przed ponownym zastosowaniem Serve i pomija je, gdy trasa Funnel już obejmuje
  port Gateway. Zarządzana przez OpenClaw polityka Funnel tylko z hasłem pozostaje bez zmian.
- `gateway.bind: "tailnet"` to bezpośrednie powiązanie z tailnet (bez HTTPS, bez Serve/Funnel).
- `gateway.bind: "auto"` preferuje loopback; użyj `tailnet`, jeśli chcesz tylko tailnet.
- Serve/Funnel udostępniają tylko **interfejs sterowania Gateway + WS**. Węzły łączą się przez
  ten sam punkt końcowy Gateway WS, więc Serve może działać na potrzeby dostępu węzłów.

## Sterowanie przeglądarką (zdalny Gateway + lokalna przeglądarka)

Jeśli uruchamiasz Gateway na jednej maszynie, ale chcesz sterować przeglądarką na innej maszynie,
uruchom **host węzła** na maszynie z przeglądarką i utrzymuj oba w tym samym tailnet.
Gateway będzie pośredniczyć w akcjach przeglądarki do węzła; nie jest potrzebny osobny serwer sterowania ani adres URL Serve.

Unikaj Funnel do sterowania przeglądarką; traktuj parowanie węzła jak dostęp operatora.

## Wymagania wstępne i limity Tailscale

- Serve wymaga włączonego HTTPS dla Twojego tailnet; CLI wyświetli monit, jeśli go brakuje.
- Serve wstrzykuje nagłówki tożsamości Tailscale; Funnel tego nie robi.
- Funnel wymaga Tailscale v1.38.3+, MagicDNS, włączonego HTTPS i atrybutu węzła funnel.
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
