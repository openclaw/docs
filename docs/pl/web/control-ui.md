---
read_when:
    - Chcesz obsługiwać Gateway z poziomu przeglądarki
    - Chcesz dostępu przez tailnet bez tuneli SSH
summary: Przeglądarkowy Control UI dla Gateway (czat, nody, konfiguracja)
title: Control UI
x-i18n:
    generated_at: "2026-04-05T14:10:50Z"
    model: gpt-5.4
    provider: openai
    source_hash: 1568680a07907343352dbb3a2e6a1b896826404a7d8baba62512f03eac28e3d7
    source_path: web/control-ui.md
    workflow: 15
---

# Control UI (przeglądarka)

Control UI to niewielka aplikacja jednostronicowa **Vite + Lit** serwowana przez Gateway:

- domyślnie: `http://<host>:18789/`
- opcjonalny prefiks: ustaw `gateway.controlUi.basePath` (np. `/openclaw`)

Komunikuje się **bezpośrednio z WebSocketem Gateway** na tym samym porcie.

## Szybkie otwarcie (lokalnie)

Jeśli Gateway działa na tym samym komputerze, otwórz:

- [http://127.0.0.1:18789/](http://127.0.0.1:18789/) (albo [http://localhost:18789/](http://localhost:18789/))

Jeśli strona się nie ładuje, najpierw uruchom Gateway: `openclaw gateway`.

Auth jest dostarczane podczas handshake WebSocket przez:

- `connect.params.auth.token`
- `connect.params.auth.password`
- nagłówki tożsamości Tailscale Serve, gdy `gateway.auth.allowTailscale: true`
- nagłówki tożsamości trusted-proxy, gdy `gateway.auth.mode: "trusted-proxy"`

Panel ustawień dashboard przechowuje token dla bieżącej sesji karty przeglądarki
oraz wybrany URL gateway; hasła nie są utrwalane. Onboarding zwykle
generuje token gateway dla auth opartego na współdzielonym sekrecie przy pierwszym połączeniu, ale
auth hasłem również działa, gdy `gateway.auth.mode` ma wartość `"password"`.

## Parowanie urządzenia (pierwsze połączenie)

Gdy łączysz się z Control UI z nowej przeglądarki albo urządzenia, Gateway
wymaga **jednorazowego zatwierdzenia parowania** — nawet jeśli jesteś w tym samym tailnet
z `gateway.auth.allowTailscale: true`. To środek bezpieczeństwa zapobiegający
nieautoryzowanemu dostępowi.

**Co zobaczysz:** „disconnected (1008): pairing required”

**Aby zatwierdzić urządzenie:**

```bash
# List pending requests
openclaw devices list

# Approve by request ID
openclaw devices approve <requestId>
```

Jeśli przeglądarka ponowi próbę parowania ze zmienionymi szczegółami auth (rola/zakresy/klucz publiczny), poprzednie
oczekujące żądanie zostaje zastąpione i tworzony jest nowy `requestId`. Przed zatwierdzeniem
ponownie uruchom `openclaw devices list`.

Po zatwierdzeniu urządzenie jest zapamiętywane i nie będzie wymagało ponownego zatwierdzenia,
chyba że je odwołasz przez `openclaw devices revoke --device <id> --role <role>`. Zobacz
[Devices CLI](/cli/devices), aby poznać rotację tokenów i odwoływanie.

**Uwagi:**

- Bezpośrednie lokalne połączenia przeglądarki przez loopback (`127.0.0.1` / `localhost`) są
  zatwierdzane automatycznie.
- Połączenia przeglądarki przez tailnet i LAN nadal wymagają jawnego zatwierdzenia, nawet gdy
  pochodzą z tej samej maszyny.
- Każdy profil przeglądarki generuje unikalny identyfikator urządzenia, więc zmiana przeglądarki albo
  wyczyszczenie danych przeglądarki będzie wymagało ponownego parowania.

## Obsługa języków

Control UI może lokalizować się przy pierwszym wczytaniu na podstawie ustawień regionalnych przeglądarki, a później można to nadpisać z selektora języka na karcie Access.

- Obsługiwane locale: `en`, `zh-CN`, `zh-TW`, `pt-BR`, `de`, `es`
- Tłumaczenia inne niż angielskie są leniwie ładowane w przeglądarce.
- Wybrane locale jest zapisywane w pamięci przeglądarki i ponownie używane przy kolejnych wizytach.
- Brakujące klucze tłumaczeń wracają do angielskiego.

## Co potrafi (obecnie)

- Czat z modelem przez Gateway WS (`chat.history`, `chat.send`, `chat.abort`, `chat.inject`)
- Strumieniowanie wywołań narzędzi + karty z wyjściem narzędzi na żywo w czacie (zdarzenia agenta)
- Kanały: status wbudowanych oraz dołączonych/zewnętrznych kanałów wtyczek, logowanie QR i konfiguracja per kanał (`channels.status`, `web.login.*`, `config.patch`)
- Instancje: lista presence + odświeżanie (`system-presence`)
- Sesje: lista + nadpisania modelu/thinking/fast/verbose/reasoning per sesja (`sessions.list`, `sessions.patch`)
- Zadania cron: lista/dodawanie/edycja/uruchamianie/włączanie/wyłączanie + historia uruchomień (`cron.*`)
- Skills: status, włączanie/wyłączanie, instalacja, aktualizacje kluczy API (`skills.*`)
- Nody: lista + capabilities (`node.list`)
- Exec approvals: edycja allowlist gateway albo noda + polityka ask dla `exec host=gateway/node` (`exec.approvals.*`)
- Konfiguracja: podgląd/edycja `~/.openclaw/openclaw.json` (`config.get`, `config.set`)
- Konfiguracja: zastosowanie + restart z walidacją (`config.apply`) i wybudzenie ostatniej aktywnej sesji
- Zapisy konfiguracji zawierają ochronę base-hash, aby zapobiec nadpisaniu równoległych edycji
- Zapisy konfiguracji (`config.set`/`config.apply`/`config.patch`) wykonują też preflight rozwiązywania aktywnych SecretRef dla refów w przesłanym payloadzie konfiguracji; nierozwiązane aktywne przesłane refy są odrzucane przed zapisem
- Schemat konfiguracji + renderowanie formularzy (`config.schema` / `config.schema.lookup`,
  w tym pole `title` / `description`, dopasowane podpowiedzi UI, podsumowania bezpośrednich dzieci,
  metadane dokumentacji dla zagnieżdżonych obiektów/wildcardów/tablic/węzłów złożonych,
  a także schematy wtyczek i kanałów, gdy są dostępne); edytor Raw JSON jest
  dostępny tylko wtedy, gdy migawka ma bezpieczny raw round-trip
- Jeśli migawki nie da się bezpiecznie odtworzyć jako surowego tekstu, Control UI wymusza tryb formularza i wyłącza Raw mode dla tej migawki
- Ustrukturyzowane wartości obiektów SecretRef są renderowane jako tylko do odczytu w polach tekstowych formularza, aby zapobiec przypadkowemu uszkodzeniu obiektu przez konwersję do stringa
- Debugowanie: migawki status/health/models + log zdarzeń + ręczne wywołania RPC (`status`, `health`, `models.list`)
- Logi: live tail logów plikowych gateway z filtrowaniem/eksportem (`logs.tail`)
- Aktualizacja: uruchamianie aktualizacji pakietu/git + restart (`update.run`) z raportem restartu

Uwagi dotyczące panelu zadań cron:

- Dla zadań izolowanych domyślnym sposobem dostarczania jest ogłoszenie podsumowania. Możesz przełączyć na none, jeśli chcesz tylko uruchomienia wewnętrzne.
- Gdy wybrane jest announce, pojawiają się pola kanału/celu.
- Tryb webhook używa `delivery.mode = "webhook"` z `delivery.to` ustawionym na prawidłowy URL webhooka HTTP(S).
- Dla zadań głównej sesji dostępne są tryby dostarczania webhook i none.
- Zaawansowane opcje edycji obejmują delete-after-run, wyczyszczenie nadpisania agenta, opcje dokładnego/stagger cron,
  nadpisania modelu/thinking agenta oraz przełączniki best-effort delivery.
- Walidacja formularza jest inline z błędami na poziomie pól; nieprawidłowe wartości wyłączają przycisk zapisu, dopóki nie zostaną poprawione.
- Ustaw `cron.webhookToken`, aby wysyłać dedykowany bearer token; jeśli pole jest pominięte, webhook jest wysyłany bez nagłówka auth.
- Deprecated fallback: zapisane starsze zadania z `notify: true` nadal mogą używać `cron.webhook`, dopóki nie zostaną zmigrowane.

## Zachowanie czatu

- `chat.send` jest **nieblokujące**: natychmiast zwraca potwierdzenie `{ runId, status: "started" }`, a odpowiedź jest strumieniowana przez zdarzenia `chat`.
- Ponowne wysłanie z tym samym `idempotencyKey` zwraca `{ status: "in_flight" }` podczas działania oraz `{ status: "ok" }` po zakończeniu.
- Odpowiedzi `chat.history` mają ograniczony rozmiar dla bezpieczeństwa UI. Gdy wpisy transkryptu są zbyt duże, Gateway może obcinać długie pola tekstowe, pomijać ciężkie bloki metadanych i zastępować zbyt duże wiadomości placeholderem (`[chat.history omitted: message too large]`).
- `chat.history` usuwa też z widocznego tekstu asystenta tagi inline służące tylko do wyświetlania (na przykład `[[reply_to_*]]` i `[[audio_as_voice]]`), tekstowe payloady XML wywołań narzędzi (w tym `<tool_call>...</tool_call>`, `<function_call>...</function_call>`, `<tool_calls>...</tool_calls>`, `<function_calls>...</function_calls>` oraz obcięte bloki wywołań narzędzi), a także wyciekłe tokeny sterujące modelem w ASCII/pełnej szerokości, i pomija wpisy asystenta, których cały widoczny tekst to dokładnie cichy token `NO_REPLY` / `no_reply`.
- `chat.inject` dopisuje notatkę asystenta do transkryptu sesji i rozgłasza zdarzenie `chat` dla aktualizacji tylko po stronie UI (bez uruchomienia agenta, bez dostarczenia do kanału).
- Selektory modelu i thinking w nagłówku czatu natychmiast patchują aktywną sesję przez `sessions.patch`; są to trwałe nadpisania sesji, a nie opcje wysyłki tylko na jedną turę.
- Stop:
  - Kliknij **Stop** (wywołuje `chat.abort`)
  - Wpisz `/stop` (albo samodzielne frazy przerwania, takie jak `stop`, `stop action`, `stop run`, `stop openclaw`, `please stop`), aby przerwać poza pasmem
  - `chat.abort` obsługuje `{ sessionKey }` (bez `runId`) do przerywania wszystkich aktywnych uruchomień dla tej sesji
- Zachowanie częściowych danych po przerwaniu:
  - Gdy uruchomienie zostanie przerwane, częściowy tekst asystenta może nadal być pokazany w UI
  - Gateway utrwala częściowy tekst asystenta po przerwaniu w historii transkryptu, gdy istnieje zbuforowane wyjście
  - Utrwalone wpisy zawierają metadane przerwania, dzięki czemu konsumenci transkryptu mogą odróżnić części po przerwaniu od normalnie zakończonego wyjścia

## Dostęp przez tailnet (zalecany)

### Zintegrowane Tailscale Serve (preferowane)

Pozostaw Gateway na loopback i pozwól Tailscale Serve proxywać go przez HTTPS:

```bash
openclaw gateway --tailscale serve
```

Otwórz:

- `https://<magicdns>/` (albo skonfigurowane `gateway.controlUi.basePath`)

Domyślnie żądania Serve dla Control UI/WebSocket mogą uwierzytelniać się przez nagłówki tożsamości Tailscale
(`tailscale-user-login`), gdy `gateway.auth.allowTailscale` ma wartość `true`. OpenClaw
weryfikuje tożsamość, rozwiązując adres `x-forwarded-for` przez
`tailscale whois` i dopasowując go do nagłówka, i akceptuje takie żądania tylko wtedy, gdy
trafiają na loopback z nagłówkami `x-forwarded-*` Tailscale. Ustaw
`gateway.auth.allowTailscale: false`, jeśli chcesz wymagać jawnych poświadczeń opartych na współdzielonym sekrecie
nawet dla ruchu Serve. Następnie użyj `gateway.auth.mode: "token"` albo
`"password"`.
Dla tej asynchronicznej ścieżki tożsamości Serve nieudane próby auth dla tego samego IP klienta
i tego samego zakresu auth są serializowane przed zapisem ograniczenia szybkości. Równoległe błędne próby
z tej samej przeglądarki mogą więc przy drugim żądaniu pokazać `retry later`
zamiast dwóch zwykłych niedopasowań ścigających się równolegle.
Auth Serve bez tokena zakłada, że host gateway jest zaufany. Jeśli na tym hoście
może działać niezaufany kod lokalny, wymagaj auth tokenem/hasłem.

### Bind do tailnet + token

```bash
openclaw gateway --bind tailnet --token "$(openssl rand -hex 32)"
```

Następnie otwórz:

- `http://<tailscale-ip>:18789/` (albo skonfigurowane `gateway.controlUi.basePath`)

Wklej pasujący współdzielony sekret do ustawień UI (wysyłany jako
`connect.params.auth.token` albo `connect.params.auth.password`).

## Niezabezpieczone HTTP

Jeśli otwierasz dashboard przez zwykłe HTTP (`http://<lan-ip>` albo `http://<tailscale-ip>`),
przeglądarka działa w **niebezpiecznym kontekście** i blokuje WebCrypto. Domyślnie
OpenClaw **blokuje** połączenia Control UI bez tożsamości urządzenia.

Udokumentowane wyjątki:

- zgodność localhost-only dla niezabezpieczonego HTTP z `gateway.controlUi.allowInsecureAuth=true`
- pomyślne auth operatora Control UI przez `gateway.auth.mode: "trusted-proxy"`
- awaryjne `gateway.controlUi.dangerouslyDisableDeviceAuth=true`

**Zalecana poprawka:** użyj HTTPS (Tailscale Serve) albo otwórz UI lokalnie:

- `https://<magicdns>/` (Serve)
- `http://127.0.0.1:18789/` (na hoście gateway)

**Zachowanie przełącznika insecure-auth:**

```json5
{
  gateway: {
    controlUi: { allowInsecureAuth: true },
    bind: "tailnet",
    auth: { mode: "token", token: "replace-me" },
  },
}
```

`allowInsecureAuth` to tylko lokalny przełącznik zgodności:

- Pozwala sesjom localhost Control UI kontynuować bez tożsamości urządzenia w
  niezabezpieczonych kontekstach HTTP.
- Nie omija kontroli parowania.
- Nie osłabia wymagań tożsamości urządzenia dla połączeń zdalnych (spoza localhost).

**Tylko awaryjnie:**

```json5
{
  gateway: {
    controlUi: { dangerouslyDisableDeviceAuth: true },
    bind: "tailnet",
    auth: { mode: "token", token: "replace-me" },
  },
}
```

`dangerouslyDisableDeviceAuth` wyłącza sprawdzanie tożsamości urządzenia w Control UI i jest
poważnym obniżeniem bezpieczeństwa. Po użyciu awaryjnym szybko cofnij tę zmianę.

Uwaga o trusted-proxy:

- pomyślne auth trusted-proxy może dopuścić sesje Control UI **operatora** bez
  tożsamości urządzenia
- to **nie** dotyczy sesji Control UI z rolą node
- reverse proxy na tym samym hoście przez loopback nadal nie spełniają wymagań auth trusted-proxy; zobacz
  [Trusted Proxy Auth](/gateway/trusted-proxy-auth)

Wskazówki konfiguracji HTTPS znajdziesz w [Tailscale](/gateway/tailscale).

## Budowanie UI

Gateway serwuje pliki statyczne z `dist/control-ui`. Zbuduj je przez:

```bash
pnpm ui:build # auto-installs UI deps on first run
```

Opcjonalna absolutna ścieżka bazowa (gdy chcesz stałych URL assetów):

```bash
OPENCLAW_CONTROL_UI_BASE_PATH=/openclaw/ pnpm ui:build
```

Do rozwoju lokalnego (osobny serwer deweloperski):

```bash
pnpm ui:dev # auto-installs UI deps on first run
```

Następnie skieruj UI na URL WebSocket Gateway (np. `ws://127.0.0.1:18789`).

## Debugowanie/testowanie: serwer dev + zdalny Gateway

Control UI to pliki statyczne; docelowy WebSocket jest konfigurowalny i może być
inny niż pochodzenie HTTP. Jest to przydatne, gdy chcesz mieć lokalny serwer Vite dev,
ale Gateway działa gdzie indziej.

1. Uruchom serwer dev UI: `pnpm ui:dev`
2. Otwórz URL w rodzaju:

```text
http://localhost:5173/?gatewayUrl=ws://<gateway-host>:18789
```

Opcjonalne jednorazowe auth (jeśli potrzebne):

```text
http://localhost:5173/?gatewayUrl=wss://<gateway-host>:18789#token=<gateway-token>
```

Uwagi:

- `gatewayUrl` jest po załadowaniu zapisywany w localStorage i usuwany z URL.
- `token` powinien być przekazywany przez fragment URL (`#token=...`), gdy tylko to możliwe. Fragmenty nie są wysyłane do serwera, co zapobiega wyciekom do logów żądań i Referer. Starsze parametry query `?token=` są nadal jednokrotnie importowane dla zgodności, ale tylko jako fallback, i są natychmiast usuwane po bootstrapie.
- `password` jest przechowywane tylko w pamięci.
- Gdy ustawiono `gatewayUrl`, UI nie wraca do poświadczeń z konfiguracji ani środowiska.
  Przekaż jawnie `token` (albo `password`). Brak jawnych poświadczeń to błąd.
- Używaj `wss://`, gdy Gateway znajduje się za TLS (Tailscale Serve, HTTPS proxy itd.).
- `gatewayUrl` jest akceptowany tylko w oknie najwyższego poziomu (nie osadzonym), aby zapobiec clickjackingowi.
- Wdrożenia Control UI poza loopback muszą jawnie ustawić `gateway.controlUi.allowedOrigins`
  (pełne originy). Obejmuje to również zdalne konfiguracje deweloperskie.
- Nie używaj `gateway.controlUi.allowedOrigins: ["*"]`, chyba że do ściśle kontrolowanych
  lokalnych testów. Oznacza to „zezwól na dowolny origin przeglądarki”, a nie „dopasuj dowolny host,
  którego używam”.
- `gateway.controlUi.dangerouslyAllowHostHeaderOriginFallback=true` włącza
  tryb fallbacku origin oparty na nagłówku Host, ale jest to niebezpieczny tryb bezpieczeństwa.

Przykład:

```json5
{
  gateway: {
    controlUi: {
      allowedOrigins: ["http://localhost:5173"],
    },
  },
}
```

Szczegóły konfiguracji dostępu zdalnego: [Remote access](/gateway/remote).

## Powiązane

- [Dashboard](/web/dashboard) — dashboard gateway
- [WebChat](/web/webchat) — interfejs czatu oparty na przeglądarce
- [TUI](/web/tui) — terminalowy interfejs użytkownika
- [Health Checks](/gateway/health) — monitorowanie stanu gateway
