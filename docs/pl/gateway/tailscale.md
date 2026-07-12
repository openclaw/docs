---
read_when:
    - Udostępnianie interfejsu sterowania Gateway poza hostem lokalnym
    - Automatyzacja dostępu do panelu przez tailnet lub publicznie
summary: Zintegrowane Tailscale Serve/Funnel dla panelu Gateway
title: Tailscale
x-i18n:
    generated_at: "2026-07-12T15:12:23Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: e201a64ac427994401fae1b934d94e0c5afe976b4acd34d45b059978f5f1807e
    source_path: gateway/tailscale.md
    workflow: 16
---

OpenClaw może automatycznie skonfigurować funkcję Tailscale **Serve** (tailnet) lub **Funnel** (publiczną) dla panelu Gateway i portu WebSocket. Dzięki temu Gateway pozostaje powiązany z local loopback, a Tailscale zapewnia HTTPS, routing oraz — w przypadku Serve — nagłówki tożsamości.

## Tryby

`gateway.tailscale.mode`:

| Tryb            | Działanie                                                                                      |
| --------------- | ---------------------------------------------------------------------------------------------- |
| `serve`         | Serve dostępny tylko w tailnecie za pośrednictwem `tailscale serve`. Gateway pozostaje na `127.0.0.1`. |
| `funnel`        | Publiczny HTTPS za pośrednictwem `tailscale funnel`. Wymaga współdzielonego hasła.              |
| `off` (domyślny) | Brak automatyzacji Tailscale.                                                                  |

Dane wyjściowe stanu i audytu używają określenia **ekspozycja Tailscale** dla tego trybu Serve/Funnel w OpenClaw. `off` oznacza, że OpenClaw nie zarządza funkcjami Serve ani Funnel; nie oznacza, że lokalny demon Tailscale jest zatrzymany lub wylogowany.

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

Otwórz: `https://<magicdns>/` (lub skonfigurowaną ścieżkę `gateway.controlUi.basePath`)

Aby udostępnić interfejs sterowania za pośrednictwem nazwanej usługi Tailscale zamiast nazwy hosta urządzenia, ustaw `gateway.tailscale.serviceName` na nazwę usługi:

```json5
{
  gateway: {
    bind: "loopback",
    tailscale: { mode: "serve", serviceName: "svc:openclaw" },
  },
}
```

Podczas uruchamiania zostanie wówczas zgłoszony adres URL usługi `https://openclaw.<tailnet-name>.ts.net/` zamiast nazwy hosta urządzenia. Usługi Tailscale wymagają, aby host był zatwierdzonym, otagowanym węzłem w Twoim tailnecie — skonfiguruj tag i zatwierdź usługę w Tailscale przed włączeniem tej opcji; w przeciwnym razie `tailscale serve --service=...` zakończy się niepowodzeniem podczas uruchamiania Gateway.

### Tylko tailnet (powiązanie z adresem IP tailnetu)

Użyj tej konfiguracji, aby Gateway nasłuchiwał bezpośrednio pod adresem IP tailnetu, bez Serve/Funnel:

```json5
{
  gateway: {
    bind: "tailnet",
    auth: { mode: "token", token: "your-token" },
  },
}
```

Połącz się z innego urządzenia w tailnecie:

- Interfejs sterowania: `http://<tailscale-ip>:18789/`
- WebSocket: `ws://<tailscale-ip>:18789`

<Note>
Gdy dostępny jest adres IPv4 tailnetu, z którym można się powiązać, Gateway wymaga również `http://127.0.0.1:18789` dla uwierzytelnionych klientów na tym samym hoście. Jeśli podczas uruchamiania żaden adres tailnetu nie jest dostępny, następuje przełączenie wyłącznie na local loopback; uruchom ponownie po udostępnieniu Tailscale, aby dodać bezpośredni dostęp przez tailnet. Żadna z tych ścieżek nie zapewnia dostępu z sieci LAN ani publicznego Internetu.
</Note>

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

Zamiast zapisywać hasło na dysku, preferuj `OPENCLAW_GATEWAY_PASSWORD`.

## Przykłady użycia CLI

```bash
openclaw gateway --tailscale serve
openclaw gateway --tailscale funnel --auth password
```

## Uwierzytelnianie

`gateway.auth.mode` steruje uzgadnianiem połączenia:

| Tryb                                                   | Zastosowanie                                                                         |
| ------------------------------------------------------ | ------------------------------------------------------------------------------------ |
| `none`                                                 | Tylko prywatny ruch przychodzący                                                      |
| `token` (domyślny, gdy ustawiono `OPENCLAW_GATEWAY_TOKEN`) | Współdzielony token                                                              |
| `password`                                             | Współdzielony sekret za pośrednictwem `OPENCLAW_GATEWAY_PASSWORD` lub konfiguracji   |
| `trusted-proxy`                                        | Odwrotny serwer proxy obsługujący tożsamość; zobacz [Uwierzytelnianie przez zaufany serwer proxy](/pl/gateway/trusted-proxy-auth) |

### Nagłówki tożsamości Tailscale (tylko Serve)

Gdy `tailscale.mode: "serve"` i `gateway.auth.allowTailscale` ma wartość `true`, uwierzytelnianie interfejsu sterowania/WebSocket może używać nagłówków tożsamości Tailscale (`tailscale-user-login`) zamiast tokenu lub hasła. Przed zaakceptowaniem żądania OpenClaw weryfikuje nagłówek, rozpoznając adres `x-forwarded-for` żądania za pomocą lokalnego demona Tailscale (`tailscale whois`) i porównując go z nazwą logowania w nagłówku. Żądanie kwalifikuje się do użycia tej ścieżki tylko wtedy, gdy pochodzi z local loopback i zawiera nagłówki Tailscale `x-forwarded-for`, `x-forwarded-proto` oraz `x-forwarded-host`.

Ten przepływ bez tokenu zakłada, że host Gateway jest zaufany. Jeśli na tym samym hoście może działać niezaufany kod lokalny, ustaw `gateway.auth.allowTailscale: false` i zamiast tego wymagaj uwierzytelniania tokenem lub hasłem.

Zakres pominięcia uwierzytelniania:

- Dotyczy wyłącznie uwierzytelniania WebSocket interfejsu sterowania. Punkty końcowe HTTP API (`/v1/*`, `/tools/invoke`, `/api/channels/*` itd.) nigdy nie używają uwierzytelniania za pomocą nagłówków tożsamości Tailscale; zawsze korzystają ze standardowego trybu uwierzytelniania HTTP Gateway.
- W przypadku sesji operatora interfejsu sterowania, które zawierają już tożsamość urządzenia przeglądarki, zweryfikowana tożsamość Tailscale pozwala pominąć etap parowania za pomocą tokenu inicjalizacyjnego/kodu QR.
- Nie powoduje to pominięcia samej tożsamości urządzenia: klienci bez tożsamości urządzenia nadal są odrzucani, a połączenia w roli węzła nadal przechodzą standardowe kontrole parowania i uwierzytelniania.

## Uwagi

- Funkcje Tailscale Serve/Funnel wymagają zainstalowanego i zalogowanego CLI `tailscale`.
- `tailscale.mode: "funnel"` odmawia uruchomienia, jeśli trybem uwierzytelniania nie jest `password`, aby uniknąć publicznego udostępnienia.
- `gateway.tailscale.serviceName` ma zastosowanie wyłącznie do trybu Serve i jest przekazywane do `tailscale serve --service=<name>`. Wartość musi używać formatu Tailscale `svc:<dns-label>`, na przykład `svc:openclaw`. Tailscale wymaga, aby hosty usługi były otagowanymi węzłami, a przed opublikowaniem usługi przez Serve może być wymagane zatwierdzenie jej w konsoli administratora.
- `gateway.tailscale.resetOnExit` cofa konfigurację `tailscale serve`/`tailscale funnel` podczas zamykania.
- `gateway.tailscale.preserveFunnel: true` utrzymuje aktywną zewnętrznie skonfigurowaną trasę `tailscale funnel` po ponownym uruchomieniu Gateway. Przy `mode: "serve"` OpenClaw sprawdza `tailscale funnel status` przed ponownym zastosowaniem Serve i pomija je, gdy istniejąca trasa Funnel obejmuje już port Gateway. Zasada wymagania wyłącznie hasła dla Funnel zarządzanego przez OpenClaw pozostaje bez zmian.
- `gateway.bind: "tailnet"` używa bezpośredniego powiązania z tailnetem (bez HTTPS i Serve/Funnel) oraz wymaganego lokalnego adresu `127.0.0.1`, gdy dostępny jest adres IPv4 tailnetu; w przeciwnym razie następuje przełączenie wyłącznie na local loopback.
- `gateway.bind: "auto"` preferuje local loopback; użyj `tailnet`, aby ograniczyć ekspozycję sieciową do tailnetu, zachowując dostęp przez local loopback na tym samym hoście.
- Serve/Funnel udostępniają wyłącznie **interfejs sterowania Gateway i WS**. Węzły łączą się za pośrednictwem tego samego punktu końcowego WS Gateway, dlatego Serve działa również w przypadku dostępu węzłów.

### Wymagania wstępne i ograniczenia Tailscale

- Serve wymaga włączenia HTTPS dla Twojego tailnetu; CLI wyświetli monit, jeśli HTTPS nie jest włączony.
- Serve wstrzykuje nagłówki tożsamości Tailscale; Funnel tego nie robi.
- Funnel wymaga Tailscale w wersji 1.38.3 lub nowszej, MagicDNS, włączonego HTTPS oraz atrybutu węzła Funnel.
- Funnel obsługuje przez TLS wyłącznie porty `443`, `8443` i `10000`.
- Funnel w systemie macOS wymaga wariantu aplikacji Tailscale o otwartym kodzie źródłowym.

## Sterowanie przeglądarką (zdalny Gateway + lokalna przeglądarka)

Aby uruchomić Gateway na jednej maszynie, a sterować przeglądarką na innej, uruchom **host węzła** na maszynie z przeglądarką i pozostaw obie maszyny w tym samym tailnecie. Gateway pośredniczy w przekazywaniu działań przeglądarki do węzła; nie jest potrzebny osobny serwer sterowania ani adres URL Serve.

Unikaj Funnel do sterowania przeglądarką; traktuj parowanie węzłów tak samo jak dostęp operatora.

## Więcej informacji

- Omówienie Tailscale Serve: [https://tailscale.com/kb/1312/serve](https://tailscale.com/kb/1312/serve)
- Polecenie `tailscale serve`: [https://tailscale.com/kb/1242/tailscale-serve](https://tailscale.com/kb/1242/tailscale-serve)
- Omówienie Tailscale Funnel: [https://tailscale.com/kb/1223/tailscale-funnel](https://tailscale.com/kb/1223/tailscale-funnel)
- Polecenie `tailscale funnel`: [https://tailscale.com/kb/1311/tailscale-funnel](https://tailscale.com/kb/1311/tailscale-funnel)

## Powiązane

- [Dostęp zdalny](/pl/gateway/remote)
- [Wykrywanie](/pl/gateway/discovery)
- [Uwierzytelnianie](/pl/gateway/authentication)
