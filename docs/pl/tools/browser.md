---
read_when:
    - Dodawanie automatyzacji przeglądarki sterowanej przez agenta
    - Debugowanie, dlaczego openclaw zakłóca działanie Twojej własnej przeglądarki Chrome
    - Implementowanie ustawień przeglądarki i jej cyklu życia w aplikacji macOS
summary: Zintegrowana usługa sterowania przeglądarką + polecenia akcji
title: Przeglądarka (zarządzana przez OpenClaw)
x-i18n:
    generated_at: "2026-04-24T09:35:10Z"
    model: gpt-5.4
    provider: openai
    source_hash: 80805676213ef5195093163874a848955b3c25364b20045a8d759d03ac088e14
    source_path: tools/browser.md
    workflow: 15
---

OpenClaw może uruchamiać **dedykowany profil Chrome/Brave/Edge/Chromium**, którym steruje agent.
Jest on odizolowany od Twojej osobistej przeglądarki i zarządzany przez małą lokalną
usługę sterowania wewnątrz Gateway (tylko loopback).

Widok dla początkujących:

- Potraktuj to jako **oddzielną przeglądarkę tylko dla agenta**.
- Profil `openclaw` **nie** ingeruje w profil Twojej osobistej przeglądarki.
- Agent może **otwierać karty, odczytywać strony, klikać i pisać** w bezpiecznym obszarze.
- Wbudowany profil `user` dołącza do Twojej prawdziwej zalogowanej sesji Chrome przez Chrome MCP.

## Co otrzymujesz

- Osobny profil przeglądarki o nazwie **openclaw** (domyślnie z pomarańczowym akcentem).
- Deterministyczne sterowanie kartami (lista/otwieranie/ustawianie fokusu/zamykanie).
- Działania agenta (kliknięcie/pisanie/przeciąganie/zaznaczanie), snapshoty, zrzuty ekranu, PDF-y.
- Opcjonalną obsługę wielu profili (`openclaw`, `work`, `remote`, ...).

Ta przeglądarka **nie** jest Twoją codzienną przeglądarką. To bezpieczna, odizolowana powierzchnia do
automatyzacji i weryfikacji przez agenta.

## Szybki start

```bash
openclaw browser --browser-profile openclaw status
openclaw browser --browser-profile openclaw start
openclaw browser --browser-profile openclaw open https://example.com
openclaw browser --browser-profile openclaw snapshot
```

Jeśli pojawi się komunikat „Browser disabled”, włącz ją w konfiguracji (patrz niżej) i uruchom ponownie
Gateway.

Jeśli `openclaw browser` w ogóle nie jest dostępne albo agent mówi, że narzędzie przeglądarki
jest niedostępne, przejdź do [Brak polecenia lub narzędzia przeglądarki](/pl/tools/browser#missing-browser-command-or-tool).

## Sterowanie Pluginem

Domyślne narzędzie `browser` jest dołączonym Pluginem. Wyłącz je, aby zastąpić je innym Pluginem, który rejestruje tę samą nazwę narzędzia `browser`:

```json5
{
  plugins: {
    entries: {
      browser: {
        enabled: false,
      },
    },
  },
}
```

Wartości domyślne wymagają zarówno `plugins.entries.browser.enabled`, jak i `browser.enabled=true`. Wyłączenie tylko Pluginu usuwa jednocześnie CLI `openclaw browser`, metodę gateway `browser.request`, narzędzie agenta i usługę sterowania; konfiguracja `browser.*` pozostaje nienaruszona na potrzeby zamiennika.

Zmiany konfiguracji przeglądarki wymagają ponownego uruchomienia Gateway, aby Plugin mógł ponownie zarejestrować swoją usługę.

## Brak polecenia lub narzędzia przeglądarki

Jeśli po aktualizacji `openclaw browser` jest nieznane, brakuje `browser.request`, albo agent zgłasza, że narzędzie przeglądarki jest niedostępne, zwykle przyczyną jest lista `plugins.allow`, która pomija `browser`. Dodaj je:

```json5
{
  plugins: {
    allow: ["telegram", "browser"],
  },
}
```

`browser.enabled=true`, `plugins.entries.browser.enabled=true` i `tools.alsoAllow: ["browser"]` nie zastępują członkostwa na liście dozwolonych — lista dozwolonych steruje ładowaniem Pluginów, a polityka narzędzi działa dopiero po załadowaniu. Usunięcie całego `plugins.allow` również przywraca zachowanie domyślne.

## Profile: `openclaw` vs `user`

- `openclaw`: zarządzana, odizolowana przeglądarka (nie wymaga rozszerzenia).
- `user`: wbudowany profil dołączania Chrome MCP do Twojej **prawdziwej zalogowanej sesji Chrome**.

Dla wywołań narzędzia przeglądarki przez agenta:

- Domyślnie: używaj odizolowanej przeglądarki `openclaw`.
- Preferuj `profile="user"`, gdy istniejące zalogowane sesje mają znaczenie, a użytkownik
  jest przy komputerze, aby kliknąć/zatwierdzić ewentualny monit o dołączenie.
- `profile` jest jawnym nadpisaniem, gdy chcesz określony tryb przeglądarki.

Ustaw `browser.defaultProfile: "openclaw"`, jeśli chcesz, aby tryb zarządzany był domyślny.

## Konfiguracja

Ustawienia przeglądarki znajdują się w `~/.openclaw/openclaw.json`.

```json5
{
  browser: {
    enabled: true, // domyślnie: true
    ssrfPolicy: {
      // dangerouslyAllowPrivateNetwork: true, // włącz tylko dla zaufanego dostępu do sieci prywatnej
      // allowPrivateNetwork: true, // starszy alias
      // hostnameAllowlist: ["*.example.com", "example.com"],
      // allowedHostnames: ["localhost"],
    },
    // cdpUrl: "http://127.0.0.1:18792", // starsze nadpisanie pojedynczego profilu
    remoteCdpTimeoutMs: 1500, // limit czasu HTTP zdalnego CDP (ms)
    remoteCdpHandshakeTimeoutMs: 3000, // limit czasu handshake WebSocket zdalnego CDP (ms)
    defaultProfile: "openclaw",
    color: "#FF4500",
    headless: false,
    noSandbox: false,
    attachOnly: false,
    executablePath: "/Applications/Brave Browser.app/Contents/MacOS/Brave Browser",
    profiles: {
      openclaw: { cdpPort: 18800, color: "#FF4500" },
      work: { cdpPort: 18801, color: "#0066CC" },
      user: {
        driver: "existing-session",
        attachOnly: true,
        color: "#00AA00",
      },
      brave: {
        driver: "existing-session",
        attachOnly: true,
        userDataDir: "~/Library/Application Support/BraveSoftware/Brave-Browser",
        color: "#FB542B",
      },
      remote: { cdpUrl: "http://10.0.0.42:9222", color: "#00AA00" },
    },
  },
}
```

<AccordionGroup>

<Accordion title="Porty i osiągalność">

- Usługa sterowania wiąże się z loopback na porcie wyprowadzonym z `gateway.port` (domyślnie `18791` = gateway + 2). Nadpisanie `gateway.port` lub `OPENCLAW_GATEWAY_PORT` przesuwa wyprowadzone porty w tej samej rodzinie.
- Lokalne profile `openclaw` automatycznie przypisują `cdpPort`/`cdpUrl`; ustawiaj je tylko dla zdalnego CDP. `cdpUrl` domyślnie wskazuje zarządzany lokalny port CDP, jeśli nie jest ustawiony.
- `remoteCdpTimeoutMs` dotyczy zdalnych (nie-loopbackowych) kontroli osiągalności HTTP CDP; `remoteCdpHandshakeTimeoutMs` dotyczy handshake WebSocket zdalnego CDP.

</Accordion>

<Accordion title="Polityka SSRF">

- Nawigacja przeglądarki i otwieranie kart są chronione przed SSRF przed nawigacją oraz ponownie sprawdzane metodą best-effort na końcowym URL `http(s)` po nawigacji.
- W ścisłym trybie SSRF sprawdzane są również wykrywanie zdalnego endpointu CDP oraz sondy `/json/version` (`cdpUrl`).
- `browser.ssrfPolicy.dangerouslyAllowPrivateNetwork` jest domyślnie wyłączone; włączaj tylko wtedy, gdy dostęp przeglądarki do sieci prywatnej jest świadomie uznany za zaufany.
- `browser.ssrfPolicy.allowPrivateNetwork` pozostaje obsługiwane jako starszy alias.

</Accordion>

<Accordion title="Zachowanie profili">

- `attachOnly: true` oznacza, że lokalna przeglądarka nigdy nie zostanie uruchomiona; nastąpi tylko dołączenie, jeśli już działa.
- `color` (na poziomie głównym i dla każdego profilu) barwi interfejs przeglądarki, aby było widać, który profil jest aktywny.
- Domyślny profil to `openclaw` (zarządzany samodzielny). Użyj `defaultProfile: "user"`, aby przełączyć się domyślnie na zalogowaną przeglądarkę użytkownika.
- Kolejność automatycznego wykrywania: domyślna przeglądarka systemowa, jeśli jest oparta na Chromium; w przeciwnym razie Chrome → Brave → Edge → Chromium → Chrome Canary.
- `driver: "existing-session"` używa Chrome DevTools MCP zamiast surowego CDP. Nie ustawiaj `cdpUrl` dla tego sterownika.
- Ustaw `browser.profiles.<name>.userDataDir`, gdy profil existing-session ma dołączyć do niestandardowego profilu użytkownika Chromium (Brave, Edge itp.).

</Accordion>

</AccordionGroup>

## Używanie Brave (lub innej przeglądarki opartej na Chromium)

Jeśli Twoją **domyślną przeglądarką systemową** jest przeglądarka oparta na Chromium (Chrome/Brave/Edge itp.),
OpenClaw użyje jej automatycznie. Ustaw `browser.executablePath`, aby nadpisać
automatyczne wykrywanie:

```bash
openclaw config set browser.executablePath "/usr/bin/google-chrome"
```

Lub ustaw to w konfiguracji, dla każdej platformy:

<Tabs>
  <Tab title="macOS">
```json5
{
  browser: {
    executablePath: "/Applications/Brave Browser.app/Contents/MacOS/Brave Browser",
  },
}
```
  </Tab>
  <Tab title="Windows">
```json5
{
  browser: {
    executablePath: "C:\\Program Files\\BraveSoftware\\Brave-Browser\\Application\\brave.exe",
  },
}
```
  </Tab>
  <Tab title="Linux">
```json5
{
  browser: {
    executablePath: "/usr/bin/brave-browser",
  },
}
```
  </Tab>
</Tabs>

## Sterowanie lokalne vs zdalne

- **Sterowanie lokalne (domyślne):** Gateway uruchamia usługę sterowania loopback i może uruchomić lokalną przeglądarkę.
- **Sterowanie zdalne (host Node):** uruchom hosta Node na maszynie, która ma przeglądarkę; Gateway będzie przekazywać do niego działania przeglądarki.
- **Zdalny CDP:** ustaw `browser.profiles.<name>.cdpUrl` (lub `browser.cdpUrl`), aby
  dołączyć do zdalnej przeglądarki opartej na Chromium. W takim przypadku OpenClaw nie uruchomi lokalnej przeglądarki.

Zachowanie przy zatrzymywaniu różni się w zależności od trybu profilu:

- lokalne profile zarządzane: `openclaw browser stop` zatrzymuje proces przeglądarki, który
  uruchomił OpenClaw
- profile tylko dołączane i profile zdalnego CDP: `openclaw browser stop` zamyka aktywną
  sesję sterowania i zwalnia nadpisania emulacji Playwright/CDP (viewport,
  schemat kolorów, ustawienia regionalne, strefa czasowa, tryb offline i podobny stan), nawet
  jeśli OpenClaw nie uruchomił żadnego procesu przeglądarki

Zdalne URL-e CDP mogą zawierać uwierzytelnianie:

- Tokeny w query (np. `https://provider.example?token=<token>`)
- Uwierzytelnianie HTTP Basic (np. `https://user:pass@provider.example`)

OpenClaw zachowuje uwierzytelnianie przy wywołaniach endpointów `/json/*` oraz przy łączeniu
z WebSocket CDP. Preferuj zmienne środowiskowe lub menedżery sekretów dla
tokenów zamiast zapisywania ich w plikach konfiguracyjnych.

## Proxy przeglądarki Node (domyślnie zero konfiguracji)

Jeśli uruchamiasz **hosta Node** na maszynie, na której znajduje się Twoja przeglądarka, OpenClaw może
automatycznie routować wywołania narzędzia przeglądarki do tego Node bez dodatkowej konfiguracji przeglądarki.
Jest to domyślna ścieżka dla zdalnych gatewayów.

Uwagi:

- Host Node udostępnia swój lokalny serwer sterowania przeglądarką przez **polecenie proxy**.
- Profile pochodzą z własnej konfiguracji `browser.profiles` danego Node (tak samo jak lokalnie).
- `nodeHost.browserProxy.allowProfiles` jest opcjonalne. Pozostaw puste dla starszego/domyślnego zachowania: wszystkie skonfigurowane profile pozostają osiągalne przez proxy, w tym trasy tworzenia/usuwania profili.
- Jeśli ustawisz `nodeHost.browserProxy.allowProfiles`, OpenClaw potraktuje to jako granicę minimalnych uprawnień: tylko profile z listy dozwolonych mogą być celem, a trasy tworzenia/usuwania trwałych profili są blokowane na powierzchni proxy.
- Wyłącz, jeśli tego nie chcesz:
  - Na node: `nodeHost.browserProxy.enabled=false`
  - Na gateway: `gateway.nodes.browser.mode="off"`

## Browserless (hostowany zdalny CDP)

[Browserless](https://browserless.io) to hostowana usługa Chromium, która udostępnia
URL-e połączeń CDP przez HTTPS i WebSocket. OpenClaw może używać obu form, ale
dla zdalnego profilu przeglądarki najprostszą opcją jest bezpośredni URL WebSocket
z dokumentacji połączeń Browserless.

Przykład:

```json5
{
  browser: {
    enabled: true,
    defaultProfile: "browserless",
    remoteCdpTimeoutMs: 2000,
    remoteCdpHandshakeTimeoutMs: 4000,
    profiles: {
      browserless: {
        cdpUrl: "wss://production-sfo.browserless.io?token=<BROWSERLESS_API_KEY>",
        color: "#00AA00",
      },
    },
  },
}
```

Uwagi:

- Zastąp `<BROWSERLESS_API_KEY>` swoim prawdziwym tokenem Browserless.
- Wybierz regionalny endpoint odpowiadający Twojemu kontu Browserless (patrz ich dokumentacja).
- Jeśli Browserless podaje bazowy URL HTTPS, możesz albo przekształcić go na
  `wss://` dla bezpośredniego połączenia CDP, albo pozostawić URL HTTPS i pozwolić OpenClaw
  wykryć `/json/version`.

## Dostawcy bezpośredniego WebSocket CDP

Niektóre hostowane usługi przeglądarek udostępniają **bezpośredni** endpoint WebSocket zamiast
standardowego wykrywania CDP opartego na HTTP (`/json/version`). OpenClaw akceptuje trzy
kształty URL-i CDP i automatycznie wybiera właściwą strategię połączenia:

- **Wykrywanie HTTP(S)** — `http://host[:port]` lub `https://host[:port]`.
  OpenClaw wywołuje `/json/version`, aby wykryć URL debugera WebSocket, a następnie
  się łączy. Brak fallbacku WebSocket.
- **Bezpośrednie endpointy WebSocket** — `ws://host[:port]/devtools/<kind>/<id>` lub
  `wss://...` ze ścieżką `/devtools/browser|page|worker|shared_worker|service_worker/<id>`.
  OpenClaw łączy się bezpośrednio przez handshake WebSocket i całkowicie pomija
  `/json/version`.
- **Nagie korzenie WebSocket** — `ws://host[:port]` lub `wss://host[:port]` bez
  ścieżki `/devtools/...` (np. [Browserless](https://browserless.io),
  [Browserbase](https://www.browserbase.com)). OpenClaw najpierw próbuje wykrywania HTTP
  przez `/json/version` (normalizując schemat do `http`/`https`);
  jeśli wykrywanie zwróci `webSocketDebuggerUrl`, zostanie on użyty, w przeciwnym razie OpenClaw
  przejdzie do bezpośredniego handshake WebSocket na nagim korzeniu. Dzięki temu
  nagi `ws://` wskazujący na lokalny Chrome nadal może się połączyć, ponieważ Chrome akceptuje
  upgrade WebSocket tylko na konkretnej ścieżce per-target z
  `/json/version`.

### Browserbase

[Browserbase](https://www.browserbase.com) to platforma chmurowa do uruchamiania
przeglądarek headless z wbudowanym rozwiązywaniem CAPTCHA, trybem stealth i
proxy rezydencyjnymi.

```json5
{
  browser: {
    enabled: true,
    defaultProfile: "browserbase",
    remoteCdpTimeoutMs: 3000,
    remoteCdpHandshakeTimeoutMs: 5000,
    profiles: {
      browserbase: {
        cdpUrl: "wss://connect.browserbase.com?apiKey=<BROWSERBASE_API_KEY>",
        color: "#F97316",
      },
    },
  },
}
```

Uwagi:

- [Zarejestruj się](https://www.browserbase.com/sign-up) i skopiuj swój **klucz API**
  z [panelu Overview](https://www.browserbase.com/overview).
- Zastąp `<BROWSERBASE_API_KEY>` swoim prawdziwym kluczem API Browserbase.
- Browserbase automatycznie tworzy sesję przeglądarki po połączeniu WebSocket, więc
  ręczny krok tworzenia sesji nie jest potrzebny.
- Darmowy plan pozwala na jedną współbieżną sesję i jedną godzinę pracy przeglądarki miesięcznie.
  Limity płatnych planów znajdziesz w [cenniku](https://www.browserbase.com/pricing).
- Pełne informacje referencyjne API, przewodniki po SDK i przykłady integracji znajdziesz w [dokumentacji Browserbase](https://docs.browserbase.com).

## Bezpieczeństwo

Kluczowe założenia:

- Sterowanie przeglądarką jest dostępne tylko przez loopback; dostęp odbywa się przez uwierzytelnianie Gateway lub parowanie node.
- Samodzielne loopbackowe HTTP API przeglądarki używa **wyłącznie uwierzytelniania współdzielonym sekretem**:
  bearer tokenu gateway, `x-openclaw-password` lub uwierzytelniania HTTP Basic z
  skonfigurowanym hasłem gateway.
- Nagłówki tożsamości Tailscale Serve i `gateway.auth.mode: "trusted-proxy"` **nie**
  uwierzytelniają tego samodzielnego loopbackowego API przeglądarki.
- Jeśli sterowanie przeglądarką jest włączone i nie skonfigurowano uwierzytelniania współdzielonym sekretem, OpenClaw
  automatycznie generuje `gateway.auth.token` przy uruchomieniu i zapisuje go w konfiguracji.
- OpenClaw **nie** generuje tego tokenu automatycznie, gdy `gateway.auth.mode` ma już wartość
  `password`, `none` lub `trusted-proxy`.
- Trzymaj Gateway i wszelkie hosty node w sieci prywatnej (Tailscale); unikaj publicznej ekspozycji.
- Traktuj zdalne URL-e/tokeny CDP jako sekrety; preferuj zmienne środowiskowe lub menedżera sekretów.

Wskazówki dotyczące zdalnego CDP:

- Jeśli to możliwe, preferuj szyfrowane endpointy (HTTPS lub WSS) oraz tokeny krótkotrwałe.
- Unikaj osadzania długotrwałych tokenów bezpośrednio w plikach konfiguracyjnych.

## Profile (wiele przeglądarek)

OpenClaw obsługuje wiele nazwanych profili (konfiguracji routingu). Profile mogą być:

- **zarządzane przez openclaw**: dedykowana instancja przeglądarki opartej na Chromium z własnym katalogiem danych użytkownika + portem CDP
- **zdalne**: jawny URL CDP (przeglądarka oparta na Chromium uruchomiona gdzie indziej)
- **istniejąca sesja**: Twój istniejący profil Chrome przez automatyczne łączenie Chrome DevTools MCP

Wartości domyślne:

- Profil `openclaw` jest tworzony automatycznie, jeśli go brakuje.
- Profil `user` jest wbudowany do dołączania do istniejącej sesji Chrome MCP.
- Profile istniejącej sesji są opcjonalne poza `user`; twórz je przez `--driver existing-session`.
- Lokalne porty CDP są domyślnie przydzielane z zakresu **18800–18899**.
- Usunięcie profilu przenosi jego lokalny katalog danych do Kosza.

Wszystkie endpointy sterowania akceptują `?profile=<name>`; CLI używa `--browser-profile`.

## Istniejąca sesja przez Chrome DevTools MCP

OpenClaw może także dołączyć do działającego profilu przeglądarki opartej na Chromium przez
oficjalny serwer Chrome DevTools MCP. Pozwala to ponownie wykorzystać karty i stan logowania,
które są już otwarte w tym profilu przeglądarki.

Oficjalne informacje i odniesienia do konfiguracji w tle:

- [Chrome for Developers: Use Chrome DevTools MCP with your browser session](https://developer.chrome.com/blog/chrome-devtools-mcp-debug-your-browser-session)
- [Chrome DevTools MCP README](https://github.com/ChromeDevTools/chrome-devtools-mcp)

Wbudowany profil:

- `user`

Opcjonalnie: utwórz własny niestandardowy profil istniejącej sesji, jeśli chcesz
innej nazwy, koloru lub katalogu danych przeglądarki.

Zachowanie domyślne:

- Wbudowany profil `user` używa automatycznego łączenia Chrome MCP, które celuje w
  domyślny lokalny profil Google Chrome.

Użyj `userDataDir` dla Brave, Edge, Chromium lub niestandardowego profilu Chrome:

```json5
{
  browser: {
    profiles: {
      brave: {
        driver: "existing-session",
        attachOnly: true,
        userDataDir: "~/Library/Application Support/BraveSoftware/Brave-Browser",
        color: "#FB542B",
      },
    },
  },
}
```

Następnie w odpowiadającej przeglądarce:

1. Otwórz stronę inspekcji tej przeglądarki dla zdalnego debugowania.
2. Włącz zdalne debugowanie.
3. Pozostaw przeglądarkę uruchomioną i zatwierdź monit o połączenie, gdy OpenClaw będzie się dołączać.

Typowe strony inspekcji:

- Chrome: `chrome://inspect/#remote-debugging`
- Brave: `brave://inspect/#remote-debugging`
- Edge: `edge://inspect/#remote-debugging`

Test smoke dla aktywnego dołączania:

```bash
openclaw browser --browser-profile user start
openclaw browser --browser-profile user status
openclaw browser --browser-profile user tabs
openclaw browser --browser-profile user snapshot --format ai
```

Jak wygląda sukces:

- `status` pokazuje `driver: existing-session`
- `status` pokazuje `transport: chrome-mcp`
- `status` pokazuje `running: true`
- `tabs` wyświetla już otwarte karty przeglądarki
- `snapshot` zwraca referencje z wybranej aktywnej karty

Co sprawdzić, jeśli dołączenie nie działa:

- docelowa przeglądarka oparta na Chromium ma wersję `144+`
- zdalne debugowanie jest włączone na stronie inspekcji tej przeglądarki
- przeglądarka wyświetliła monit o zgodę na dołączenie i został on zatwierdzony
- `openclaw doctor` migruje starą konfigurację przeglądarki opartą na rozszerzeniach i sprawdza, czy
  Chrome jest zainstalowany lokalnie dla domyślnych profili automatycznego łączenia, ale nie może
  włączyć zdalnego debugowania po stronie przeglądarki za Ciebie

Użycie przez agenta:

- Użyj `profile="user"`, gdy potrzebujesz stanu zalogowanej przeglądarki użytkownika.
- Jeśli używasz niestandardowego profilu istniejącej sesji, przekaż jawnie jego nazwę.
- Wybieraj ten tryb tylko wtedy, gdy użytkownik jest przy komputerze, aby zatwierdzić monit
  o dołączenie.
- Gateway lub host node może uruchomić `npx chrome-devtools-mcp@latest --autoConnect`

Uwagi:

- Ta ścieżka jest bardziej ryzykowna niż odizolowany profil `openclaw`, ponieważ może
  działać wewnątrz Twojej zalogowanej sesji przeglądarki.
- OpenClaw nie uruchamia przeglądarki dla tego sterownika; tylko się do niej dołącza.
- OpenClaw używa tutaj oficjalnego przepływu Chrome DevTools MCP `--autoConnect`. Jeśli
  ustawiono `userDataDir`, jest ono przekazywane dalej, aby wskazać ten katalog danych użytkownika.
- Istniejąca sesja może dołączać na wybranym hoście lub przez podłączony
  node przeglądarki. Jeśli Chrome znajduje się gdzie indziej i nie jest podłączony żaden node przeglądarki, użyj
  zamiast tego zdalnego CDP albo hosta node.

<Accordion title="Ograniczenia funkcji istniejącej sesji">

W porównaniu z zarządzanym profilem `openclaw` sterowniki istniejącej sesji są bardziej ograniczone:

- **Zrzuty ekranu** — działają przechwytywanie stron i przechwytywanie elementów przez `--ref`; selektory CSS `--element` nie są obsługiwane. `--full-page` nie można łączyć z `--ref` ani `--element`. Playwright nie jest wymagany do zrzutów ekranu strony ani elementów opartych na ref.
- **Akcje** — `click`, `type`, `hover`, `scrollIntoView`, `drag` i `select` wymagają referencji snapshotu (bez selektorów CSS). `click` działa tylko dla lewego przycisku. `type` nie obsługuje `slowly=true`; użyj `fill` lub `press`. `press` nie obsługuje `delayMs`. `type`, `hover`, `scrollIntoView`, `drag`, `select`, `fill` i `evaluate` nie obsługują limitów czasu ustawianych per wywołanie. `select` przyjmuje pojedynczą wartość.
- **Oczekiwanie / wysyłanie plików / okna dialogowe** — `wait --url` obsługuje wzorce dokładne, częściowe i glob; `wait --load networkidle` nie jest obsługiwane. Hooki wysyłania plików wymagają `ref` lub `inputRef`, po jednym pliku naraz, bez CSS `element`. Hooki okien dialogowych nie obsługują nadpisywania limitów czasu.
- **Funkcje tylko dla trybu zarządzanego** — akcje wsadowe, eksport PDF, przechwytywanie pobrań i `responsebody` nadal wymagają ścieżki zarządzanej przeglądarki.

</Accordion>

## Gwarancje izolacji

- **Dedykowany katalog danych użytkownika**: nigdy nie dotyka Twojego osobistego profilu przeglądarki.
- **Dedykowane porty**: unika `9222`, aby zapobiegać kolizjom z przepływami pracy deweloperskiej.
- **Deterministyczne sterowanie kartami**: kierowanie na karty przez `targetId`, a nie „ostatnią kartę”.

## Wybór przeglądarki

Przy uruchamianiu lokalnym OpenClaw wybiera pierwszą dostępną:

1. Chrome
2. Brave
3. Edge
4. Chromium
5. Chrome Canary

Możesz to nadpisać przez `browser.executablePath`.

Platformy:

- macOS: sprawdza `/Applications` i `~/Applications`.
- Linux: szuka `google-chrome`, `brave`, `microsoft-edge`, `chromium` itd.
- Windows: sprawdza typowe lokalizacje instalacji.

## API sterowania (opcjonalne)

Do skryptowania i debugowania Gateway udostępnia małe **HTTP API sterowania dostępne tylko przez loopback**
oraz pasujące CLI `openclaw browser` (snapshoty, refy, rozszerzenia `wait`,
wyjście JSON, przepływy debugowania). Pełne informacje referencyjne znajdziesz w
[API sterowania przeglądarką](/pl/tools/browser-control).

## Rozwiązywanie problemów

W przypadku problemów specyficznych dla Linuxa (zwłaszcza snap Chromium) zobacz
[Rozwiązywanie problemów z przeglądarką](/pl/tools/browser-linux-troubleshooting).

W przypadku konfiguracji z rozdzielonym hostem WSL2 Gateway + Windows Chrome zobacz
[Rozwiązywanie problemów WSL2 + Windows + zdalny Chrome CDP](/pl/tools/browser-wsl2-windows-remote-cdp-troubleshooting).

### Błąd uruchamiania CDP vs blokada SSRF nawigacji

To różne klasy błędów i wskazują na różne ścieżki kodu.

- **Błąd uruchamiania CDP lub gotowości** oznacza, że OpenClaw nie może potwierdzić, że płaszczyzna sterowania przeglądarką jest zdrowa.
- **Blokada SSRF nawigacji** oznacza, że płaszczyzna sterowania przeglądarką jest zdrowa, ale cel nawigacji strony jest odrzucany przez politykę.

Typowe przykłady:

- Błąd uruchamiania CDP lub gotowości:
  - `Chrome CDP websocket for profile "openclaw" is not reachable after start`
  - `Remote CDP for profile "<name>" is not reachable at <cdpUrl>`
- Blokada SSRF nawigacji:
  - przepływy `open`, `navigate`, snapshot lub otwierania kart kończą się błędem polityki przeglądarki/sieci, podczas gdy `start` i `tabs` nadal działają

Użyj tej minimalnej sekwencji, aby rozdzielić te dwa przypadki:

```bash
openclaw browser --browser-profile openclaw start
openclaw browser --browser-profile openclaw tabs
openclaw browser --browser-profile openclaw open https://example.com
```

Jak odczytywać wyniki:

- Jeśli `start` kończy się błędem `not reachable after start`, najpierw diagnozuj gotowość CDP.
- Jeśli `start` się powiedzie, ale `tabs` zakończy się błędem, płaszczyzna sterowania nadal jest niezdrowa. Traktuj to jako problem osiągalności CDP, a nie problem nawigacji strony.
- Jeśli `start` i `tabs` się powiodą, ale `open` lub `navigate` kończy się błędem, płaszczyzna sterowania przeglądarką działa, a problem dotyczy polityki nawigacji albo strony docelowej.
- Jeśli `start`, `tabs` i `open` wszystkie się powiodą, podstawowa ścieżka sterowania zarządzaną przeglądarką jest zdrowa.

Ważne szczegóły zachowania:

- Konfiguracja przeglądarki domyślnie używa obiektu polityki SSRF fail-closed nawet wtedy, gdy nie skonfigurujesz `browser.ssrfPolicy`.
- Dla lokalnego zarządzanego profilu loopback `openclaw` kontrole zdrowia CDP celowo pomijają egzekwowanie osiągalności SSRF przeglądarki dla własnej lokalnej płaszczyzny sterowania OpenClaw.
- Ochrona nawigacji jest oddzielna. Pomyślny wynik `start` lub `tabs` nie oznacza, że późniejszy cel `open` lub `navigate` jest dozwolony.

Wskazówki dotyczące bezpieczeństwa:

- **Nie** rozluźniaj domyślnie polityki SSRF przeglądarki.
- Preferuj wąskie wyjątki dla hostów, takie jak `hostnameAllowlist` lub `allowedHostnames`, zamiast szerokiego dostępu do sieci prywatnej.
- Używaj `dangerouslyAllowPrivateNetwork: true` tylko w świadomie zaufanych środowiskach, gdzie dostęp przeglądarki do sieci prywatnej jest wymagany i sprawdzony.

## Narzędzia agenta + jak działa sterowanie

Agent otrzymuje **jedno narzędzie** do automatyzacji przeglądarki:

- `browser` — status/start/stop/tabs/open/focus/close/snapshot/screenshot/navigate/act

Jak to się mapuje:

- `browser snapshot` zwraca stabilne drzewo UI (AI lub ARIA).
- `browser act` używa identyfikatorów `ref` ze snapshotu do klikania/pisania/przeciągania/zaznaczania.
- `browser screenshot` przechwytuje piksele (cała strona lub element).
- `browser` akceptuje:
  - `profile`, aby wybrać nazwany profil przeglądarki (openclaw, chrome lub zdalny CDP).
  - `target` (`sandbox` | `host` | `node`) do wyboru miejsca, w którym znajduje się przeglądarka.
  - W sesjach sandbox `target: "host"` wymaga `agents.defaults.sandbox.browser.allowHostControl=true`.
  - Jeśli `target` zostanie pominięty: sesje sandbox domyślnie używają `sandbox`, sesje poza sandboxem domyślnie używają `host`.
  - Jeśli podłączony jest node z obsługą przeglądarki, narzędzie może automatycznie routować do niego, chyba że przypniesz `target="host"` albo `target="node"`.

To utrzymuje deterministyczne działanie agenta i pozwala uniknąć kruchych selektorów.

## Powiązane

- [Przegląd narzędzi](/pl/tools) — wszystkie dostępne narzędzia agenta
- [Piaskownice](/pl/gateway/sandboxing) — sterowanie przeglądarką w środowiskach sandbox
- [Bezpieczeństwo](/pl/gateway/security) — ryzyka związane ze sterowaniem przeglądarką i utwardzanie
