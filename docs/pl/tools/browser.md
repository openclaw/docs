---
read_when:
    - Dodawanie automatyzacji przeglądarki sterowanej przez agenta
    - Debugowanie, dlaczego openclaw ingeruje w Twoją własną przeglądarkę Chrome
    - Implementowanie ustawień przeglądarki i cyklu życia w aplikacji macOS
summary: Zintegrowana usługa sterowania przeglądarką + polecenia akcji
title: Browser (zarządzany przez OpenClaw)
x-i18n:
    generated_at: "2026-04-05T14:09:23Z"
    model: gpt-5.4
    provider: openai
    source_hash: a41162efd397ea918469e16aa67e554bcbb517b3112df1d3e7927539b6a0926a
    source_path: tools/browser.md
    workflow: 15
---

# Browser (zarządzany przez openclaw)

OpenClaw może uruchamiać **dedykowany profil Chrome/Brave/Edge/Chromium**, którym steruje agent.
Jest on odseparowany od Twojej osobistej przeglądarki i zarządzany przez małą lokalną
usługę sterowania wewnątrz Gateway (tylko loopback).

Perspektywa dla początkujących:

- Traktuj to jak **oddzielną przeglądarkę tylko dla agenta**.
- Profil `openclaw` **nie** dotyka Twojego osobistego profilu przeglądarki.
- Agent może **otwierać karty, czytać strony, klikać i wpisywać tekst** w bezpiecznym obszarze.
- Wbudowany profil `user` podłącza się do Twojej prawdziwej zalogowanej sesji Chrome przez Chrome MCP.

## Co otrzymujesz

- Oddzielny profil przeglądarki o nazwie **openclaw** (domyślnie z pomarańczowym akcentem).
- Deterministyczne sterowanie kartami (list/open/focus/close).
- Akcje agenta (click/type/drag/select), snapshoty, zrzuty ekranu, PDF-y.
- Opcjonalną obsługę wielu profili (`openclaw`, `work`, `remote`, ...).

Ta przeglądarka **nie** jest Twoją codzienną przeglądarką. To bezpieczna, izolowana powierzchnia do
automatyzacji i weryfikacji przez agenta.

## Szybki start

```bash
openclaw browser --browser-profile openclaw status
openclaw browser --browser-profile openclaw start
openclaw browser --browser-profile openclaw open https://example.com
openclaw browser --browser-profile openclaw snapshot
```

Jeśli pojawi się komunikat „Browser disabled”, włącz go w konfiguracji (patrz poniżej) i uruchom ponownie
Gateway.

Jeśli całkowicie brakuje `openclaw browser`, albo agent mówi, że narzędzie browser
jest niedostępne, przejdź do [Missing browser command or tool](/tools/browser#missing-browser-command-or-tool).

## Sterowanie pluginem

Domyślne narzędzie `browser` jest teraz dołączonym pluginem, który jest domyślnie
włączony. Oznacza to, że możesz go wyłączyć lub zastąpić bez usuwania reszty
systemu pluginów OpenClaw:

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

Wyłącz dołączony plugin przed zainstalowaniem innego pluginu, który udostępnia
to samo narzędzie `browser`. Domyślne działanie Browser wymaga obu warunków:

- `plugins.entries.browser.enabled` nie jest wyłączone
- `browser.enabled=true`

Jeśli wyłączysz tylko plugin, dołączone CLI Browser (`openclaw browser`),
metoda gateway (`browser.request`), narzędzie agenta i domyślna usługa sterowania
Browser znikną razem. Twoja konfiguracja `browser.*` pozostaje nienaruszona, aby
mogła zostać ponownie użyta przez plugin zastępczy.

Dołączony plugin Browser jest teraz także właścicielem implementacji runtime Browser.
Rdzeń zachowuje tylko współdzielone helpery Plugin SDK oraz re-eksporty zgodności dla
starszych wewnętrznych ścieżek importu. W praktyce usunięcie lub zastąpienie pakietu pluginu Browser
usuwa zestaw funkcji Browser zamiast pozostawiać drugi runtime należący do rdzenia.

Zmiany konfiguracji Browser nadal wymagają restartu Gateway, aby dołączony plugin
mógł ponownie zarejestrować swoją usługę Browser z nowymi ustawieniami.

## Brak polecenia browser lub narzędzia

Jeśli `openclaw browser` nagle staje się nieznanym poleceniem po aktualizacji albo
agent zgłasza brak narzędzia browser, najczęstszą przyczyną jest restrykcyjna
lista `plugins.allow`, która nie zawiera `browser`.

Przykład błędnej konfiguracji:

```json5
{
  plugins: {
    allow: ["telegram"],
  },
}
```

Napraw to, dodając `browser` do listy dozwolonych pluginów:

```json5
{
  plugins: {
    allow: ["telegram", "browser"],
  },
}
```

Ważne uwagi:

- `browser.enabled=true` samo w sobie nie wystarczy, gdy ustawiono `plugins.allow`.
- `plugins.entries.browser.enabled=true` także samo w sobie nie wystarczy, gdy ustawiono `plugins.allow`.
- `tools.alsoAllow: ["browser"]` **nie** ładuje dołączonego pluginu Browser. Zmienia jedynie politykę narzędzi po tym, jak plugin został już załadowany.
- Jeśli nie potrzebujesz restrykcyjnej listy dozwolonych pluginów, usunięcie `plugins.allow` także przywraca domyślne działanie dołączonego Browser.

Typowe objawy:

- `openclaw browser` jest nieznanym poleceniem.
- brakuje `browser.request`.
- agent zgłasza, że narzędzie browser jest niedostępne lub brakuje go.

## Profile: `openclaw` kontra `user`

- `openclaw`: zarządzana, izolowana przeglądarka (nie wymaga rozszerzenia).
- `user`: wbudowany profil podłączania Chrome MCP do Twojej **prawdziwej zalogowanej sesji Chrome**.

Dla wywołań narzędzia Browser przez agenta:

- Domyślnie: używaj izolowanej przeglądarki `openclaw`.
- Preferuj `profile="user"`, gdy znaczenie mają istniejące zalogowane sesje i użytkownik
  siedzi przy komputerze, aby kliknąć/zatwierdzić ewentualny prompt podłączenia.
- `profile` to jawne nadpisanie, gdy chcesz określony tryb przeglądarki.

Ustaw `browser.defaultProfile: "openclaw"`, jeśli domyślnie chcesz tryb zarządzany.

## Konfiguracja

Ustawienia Browser znajdują się w `~/.openclaw/openclaw.json`.

```json5
{
  browser: {
    enabled: true, // default: true
    ssrfPolicy: {
      dangerouslyAllowPrivateNetwork: true, // default trusted-network mode
      // allowPrivateNetwork: true, // legacy alias
      // hostnameAllowlist: ["*.example.com", "example.com"],
      // allowedHostnames: ["localhost"],
    },
    // cdpUrl: "http://127.0.0.1:18792", // legacy single-profile override
    remoteCdpTimeoutMs: 1500, // remote CDP HTTP timeout (ms)
    remoteCdpHandshakeTimeoutMs: 3000, // remote CDP WebSocket handshake timeout (ms)
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

Uwagi:

- Usługa sterowania Browser wiąże się z loopback na porcie wyprowadzonym z `gateway.port`
  (domyślnie: `18791`, czyli gateway + 2).
- Jeśli nadpiszesz port Gateway (`gateway.port` lub `OPENCLAW_GATEWAY_PORT`),
  wyprowadzone porty Browser przesuwają się, aby pozostać w tej samej „rodzinie”.
- `cdpUrl` domyślnie wskazuje zarządzany lokalny port CDP, jeśli nie jest ustawiony.
- `remoteCdpTimeoutMs` dotyczy kontroli osiągalności zdalnego (nie-loopback) CDP.
- `remoteCdpHandshakeTimeoutMs` dotyczy kontroli osiągalności handshake WebSocket zdalnego CDP.
- Nawigacja Browser/otwieranie kart jest chronione przed SSRF przed nawigacją i ponownie sprawdzane w trybie best-effort na końcowym URL `http(s)` po nawigacji.
- W ścisłym trybie SSRF sprawdzane są także wykrywanie/sondy zdalnych endpointów CDP (`cdpUrl`, w tym lookupi `/json/version`).
- `browser.ssrfPolicy.dangerouslyAllowPrivateNetwork` domyślnie ma wartość `true` (model zaufanej sieci). Ustaw `false`, aby wymusić ścisłe przeglądanie wyłącznie publiczne.
- `browser.ssrfPolicy.allowPrivateNetwork` pozostaje obsługiwane jako starszy alias zgodności.
- `attachOnly: true` oznacza „nigdy nie uruchamiaj lokalnej przeglądarki; tylko podłączaj się, jeśli już działa”.
- `color` i per-profil `color` zabarwiają UI Browser, aby było widać, który profil jest aktywny.
- Profil domyślny to `openclaw` (samodzielna przeglądarka zarządzana przez OpenClaw). Użyj `defaultProfile: "user"`, aby przejść do zalogowanej przeglądarki użytkownika.
- Kolejność automatycznego wykrywania: domyślna systemowa przeglądarka, jeśli jest oparta na Chromium; w przeciwnym razie Chrome → Brave → Edge → Chromium → Chrome Canary.
- Lokalne profile `openclaw` automatycznie przypisują `cdpPort`/`cdpUrl` — ustawiaj je tylko dla zdalnego CDP.
- `driver: "existing-session"` używa Chrome DevTools MCP zamiast surowego CDP. Nie
  ustawiaj `cdpUrl` dla tego sterownika.
- Ustaw `browser.profiles.<name>.userDataDir`, gdy profil existing-session
  ma podłączać się do niestandardowego profilu użytkownika Chromium, takiego jak Brave lub Edge.

## Używanie Brave (lub innej przeglądarki opartej na Chromium)

Jeśli Twoją **domyślną systemową** przeglądarką jest przeglądarka oparta na Chromium (Chrome/Brave/Edge itd.),
OpenClaw użyje jej automatycznie. Ustaw `browser.executablePath`, aby nadpisać
autowykrywanie:

Przykład CLI:

```bash
openclaw config set browser.executablePath "/usr/bin/google-chrome"
```

```json5
// macOS
{
  browser: {
    executablePath: "/Applications/Brave Browser.app/Contents/MacOS/Brave Browser"
  }
}

// Windows
{
  browser: {
    executablePath: "C:\\Program Files\\BraveSoftware\\Brave-Browser\\Application\\brave.exe"
  }
}

// Linux
{
  browser: {
    executablePath: "/usr/bin/brave-browser"
  }
}
```

## Sterowanie lokalne a zdalne

- **Sterowanie lokalne (domyślne):** Gateway uruchamia usługę sterowania loopback i może uruchomić lokalną przeglądarkę.
- **Sterowanie zdalne (host węzła):** uruchom hosta węzła na komputerze, który ma przeglądarkę; Gateway będzie proxy'ować do niego akcje Browser.
- **Zdalne CDP:** ustaw `browser.profiles.<name>.cdpUrl` (lub `browser.cdpUrl`), aby
  podłączyć się do zdalnej przeglądarki opartej na Chromium. W takim przypadku OpenClaw nie uruchomi lokalnej przeglądarki.

Zachowanie zatrzymywania różni się zależnie od trybu profilu:

- lokalne profile zarządzane: `openclaw browser stop` zatrzymuje proces przeglądarki, który
  uruchomił OpenClaw
- profile attach-only i zdalnego CDP: `openclaw browser stop` zamyka aktywną
  sesję sterowania i usuwa nadpisania emulacji Playwright/CDP (viewport,
  schemat kolorów, locale, timezone, tryb offline i podobny stan), mimo że
  OpenClaw nie uruchomił żadnego procesu Browser

Zdalne URL-e CDP mogą zawierać auth:

- tokeny query (np. `https://provider.example?token=<token>`)
- auth HTTP Basic (np. `https://user:pass@provider.example`)

OpenClaw zachowuje auth przy wywoływaniu endpointów `/json/*` i przy łączeniu
z WebSocket CDP. Preferuj zmienne środowiskowe lub menedżery sekretów dla
tokenów zamiast commitować je do plików konfiguracji.

## Proxy Browser dla węzłów (domyślnie zero konfiguracji)

Jeśli uruchamiasz **hosta węzła** na komputerze, który ma Browser, OpenClaw może
automatycznie kierować wywołania narzędzia Browser do tego węzła bez żadnej dodatkowej konfiguracji Browser.
To domyślna ścieżka dla zdalnych gateway.

Uwagi:

- Host węzła udostępnia swoją lokalną usługę sterowania Browser przez **polecenie proxy**.
- Profile pochodzą z własnej konfiguracji węzła `browser.profiles` (takiej samej jak lokalnie).
- `nodeHost.browserProxy.allowProfiles` jest opcjonalne. Pozostaw puste dla starszego/domyslnego zachowania: wszystkie skonfigurowane profile pozostają osiągalne przez proxy, w tym trasy tworzenia/usuwania profili.
- Jeśli ustawisz `nodeHost.browserProxy.allowProfiles`, OpenClaw potraktuje to jako granicę minimalnych uprawnień: można kierować tylko do profili z listy dozwolonych, a trwałe trasy tworzenia/usuwania profili są blokowane na powierzchni proxy.
- Wyłącz, jeśli tego nie chcesz:
  - Na węźle: `nodeHost.browserProxy.enabled=false`
  - Na gateway: `gateway.nodes.browser.mode="off"`

## Browserless (hostowany zdalny CDP)

[Browserless](https://browserless.io) to hostowana usługa Chromium, która udostępnia
URL-e połączeń CDP przez HTTPS i WebSocket. OpenClaw może używać obu form, ale
dla zdalnego profilu Browser najprostszą opcją jest bezpośredni URL WebSocket
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
- Wybierz endpoint regionu odpowiadający Twojemu kontu Browserless (zobacz ich dokumentację).
- Jeśli Browserless daje Ci bazowy URL HTTPS, możesz albo przekształcić go do
  `wss://` dla bezpośredniego połączenia CDP, albo pozostawić URL HTTPS i pozwolić OpenClaw
  wykryć `/json/version`.

## Dostawcy bezpośredniego WebSocket CDP

Niektóre hostowane usługi Browser udostępniają **bezpośredni endpoint WebSocket** zamiast
standardowego wykrywania CDP opartego na HTTP (`/json/version`). OpenClaw obsługuje oba warianty:

- **Endpointy HTTP(S)** — OpenClaw wywołuje `/json/version`, aby wykryć
  URL WebSocket debuggera, a następnie się łączy.
- **Endpointy WebSocket** (`ws://` / `wss://`) — OpenClaw łączy się bezpośrednio,
  pomijając `/json/version`. Użyj tego dla usług takich jak
  [Browserless](https://browserless.io),
  [Browserbase](https://www.browserbase.com) albo dowolnego dostawcy, który przekazuje Ci
  URL WebSocket.

### Browserbase

[Browserbase](https://www.browserbase.com) to chmurowa platforma do uruchamiania
bezgłowych przeglądarek z wbudowanym rozwiązywaniem CAPTCHA, trybem stealth i
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

- [Zarejestruj się](https://www.browserbase.com/sign-up) i skopiuj swój **API Key**
  z [dashboardu Overview](https://www.browserbase.com/overview).
- Zastąp `<BROWSERBASE_API_KEY>` swoim prawdziwym kluczem API Browserbase.
- Browserbase automatycznie tworzy sesję Browser przy połączeniu WebSocket, więc nie
  jest potrzebny ręczny krok tworzenia sesji.
- Darmowa warstwa pozwala na jedną sesję współbieżną i jedną godzinę Browser miesięcznie.
  Limity płatnych planów znajdziesz w [cenniku](https://www.browserbase.com/pricing).
- Pełne API reference, przewodniki SDK i przykłady integracji znajdziesz w [dokumentacji Browserbase](https://docs.browserbase.com).

## Bezpieczeństwo

Kluczowe założenia:

- Sterowanie Browser działa tylko na loopback; dostęp przechodzi przez auth Gateway lub parowanie węzłów.
- Samodzielne loopback HTTP API Browser używa **wyłącznie auth współdzielonym sekretem**:
  bearer auth tokenem gateway, `x-openclaw-password` albo HTTP Basic auth ze
  skonfigurowanym hasłem gateway.
- Nagłówki tożsamości Tailscale Serve i `gateway.auth.mode: "trusted-proxy"` **nie**
  uwierzytelniają tego samodzielnego loopback API Browser.
- Jeśli sterowanie Browser jest włączone i nie skonfigurowano auth współdzielonym sekretem, OpenClaw
  automatycznie generuje `gateway.auth.token` przy starcie i utrwala go w konfiguracji.
- OpenClaw **nie** generuje automatycznie tego tokena, gdy `gateway.auth.mode` ma już wartość
  `password`, `none` lub `trusted-proxy`.
- Utrzymuj Gateway i wszystkie hosty węzłów w prywatnej sieci (Tailscale); unikaj wystawiania publicznego.
- Traktuj zdalne URL-e/tokeny CDP jako sekrety; preferuj zmienne env albo menedżer sekretów.

Wskazówki dla zdalnego CDP:

- Jeśli to możliwe, preferuj szyfrowane endpointy (HTTPS lub WSS) i tokeny krótkotrwałe.
- Unikaj osadzania długowiecznych tokenów bezpośrednio w plikach konfiguracji.

## Profile (wiele przeglądarek)

OpenClaw obsługuje wiele nazwanych profili (konfiguracji routingu). Profile mogą być:

- **zarządzane przez openclaw**: dedykowana przeglądarka oparta na Chromium z własnym katalogiem danych użytkownika + portem CDP
- **zdalne**: jawny URL CDP (przeglądarka oparta na Chromium uruchomiona gdzie indziej)
- **istniejąca sesja**: Twój istniejący profil Chrome przez automatyczne połączenie Chrome DevTools MCP

Wartości domyślne:

- Profil `openclaw` jest tworzony automatycznie, jeśli go brakuje.
- Profil `user` jest wbudowany dla podłączania existing-session Chrome MCP.
- Profile existing-session poza `user` są opt-in; twórz je przy użyciu `--driver existing-session`.
- Lokalne porty CDP są domyślnie przydzielane z zakresu **18800–18899**.
- Usunięcie profilu przenosi jego lokalny katalog danych do Kosza.

Wszystkie endpointy sterowania akceptują `?profile=<name>`; CLI używa `--browser-profile`.

## Existing-session przez Chrome DevTools MCP

OpenClaw może także podłączyć się do uruchomionego profilu przeglądarki opartej na Chromium przez
oficjalny serwer Chrome DevTools MCP. Pozwala to ponownie używać kart i stanu logowania
już otwartych w tym profilu Browser.

Oficjalne tło i dokumentacja konfiguracji:

- [Chrome for Developers: Use Chrome DevTools MCP with your browser session](https://developer.chrome.com/blog/chrome-devtools-mcp-debug-your-browser-session)
- [Chrome DevTools MCP README](https://github.com/ChromeDevTools/chrome-devtools-mcp)

Wbudowany profil:

- `user`

Opcjonalnie: utwórz własny niestandardowy profil existing-session, jeśli chcesz inną
nazwę, kolor lub katalog danych Browser.

Domyślne zachowanie:

- Wbudowany profil `user` używa automatycznego połączenia Chrome MCP, które kieruje do
  domyślnego lokalnego profilu Google Chrome.

Używaj `userDataDir` dla Brave, Edge, Chromium lub niestandardowego profilu Chrome:

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

Następnie w odpowiedniej przeglądarce:

1. Otwórz stronę inspect tej przeglądarki dla zdalnego debugowania.
2. Włącz zdalne debugowanie.
3. Utrzymuj Browser uruchomioną i zatwierdź prompt połączenia, gdy OpenClaw się podłączy.

Typowe strony inspect:

- Chrome: `chrome://inspect/#remote-debugging`
- Brave: `brave://inspect/#remote-debugging`
- Edge: `edge://inspect/#remote-debugging`

Test smoke aktywnego podłączenia:

```bash
openclaw browser --browser-profile user start
openclaw browser --browser-profile user status
openclaw browser --browser-profile user tabs
openclaw browser --browser-profile user snapshot --format ai
```

Jak wygląda powodzenie:

- `status` pokazuje `driver: existing-session`
- `status` pokazuje `transport: chrome-mcp`
- `status` pokazuje `running: true`
- `tabs` wyświetla już otwarte karty Browser
- `snapshot` zwraca refs z wybranej aktywnej karty

Co sprawdzić, jeśli podłączenie nie działa:

- docelowa przeglądarka oparta na Chromium ma wersję `144+`
- zdalne debugowanie jest włączone na stronie inspect tej przeglądarki
- Browser wyświetliła prompt zgody na podłączenie i został on zaakceptowany
- `openclaw doctor` migruje stare konfiguracje Browser oparte na rozszerzeniach i sprawdza,
  czy Chrome jest lokalnie zainstalowane dla domyślnych profili auto-connect, ale nie może
  włączyć po Twojej stronie zdalnego debugowania w Browser

Użycie przez agenta:

- Używaj `profile="user"`, gdy potrzebujesz zalogowanego stanu Browser użytkownika.
- Jeśli używasz niestandardowego profilu existing-session, przekaż jego jawną nazwę.
- Wybieraj ten tryb tylko wtedy, gdy użytkownik siedzi przy komputerze, aby zatwierdzić prompt podłączenia.
- Gateway lub host węzła może uruchomić `npx chrome-devtools-mcp@latest --autoConnect`

Uwagi:

- Ta ścieżka jest bardziej ryzykowna niż izolowany profil `openclaw`, ponieważ może
  działać wewnątrz Twojej zalogowanej sesji Browser.
- OpenClaw nie uruchamia Browser dla tego sterownika; podłącza się tylko do
  istniejącej sesji.
- OpenClaw używa tu oficjalnego przepływu Chrome DevTools MCP `--autoConnect`. Jeśli
  ustawiono `userDataDir`, OpenClaw przekaże je dalej, aby wskazać ten jawny
  katalog danych użytkownika Chromium.
- Zrzuty ekranu existing-session obsługują przechwytywanie całych stron i przechwytywanie elementów `--ref` ze snapshotów, ale nie selektory CSS `--element`.
- Zrzuty ekranu stron existing-session działają bez Playwright przez Chrome MCP.
  Oparte na ref zrzuty ekranów elementów (`--ref`) także tam działają, ale `--full-page`
  nie może być łączone z `--ref` ani `--element`.
- Akcje existing-session są nadal bardziej ograniczone niż ścieżka
  zarządzanej Browser:
  - `click`, `type`, `hover`, `scrollIntoView`, `drag` i `select` wymagają
    refów snapshotu zamiast selektorów CSS
  - `click` obsługuje tylko lewy przycisk (bez nadpisywania przycisku i modyfikatorów)
  - `type` nie obsługuje `slowly=true`; używaj `fill` albo `press`
  - `press` nie obsługuje `delayMs`
  - `hover`, `scrollIntoView`, `drag`, `select`, `fill` i `evaluate` nie
    obsługują nadpisań timeout per wywołanie
  - `select` obecnie obsługuje tylko pojedynczą wartość
- Existing-session `wait --url` obsługuje wzorce exact, substring i glob
  tak jak inne sterowniki Browser. `wait --load networkidle` nie jest jeszcze obsługiwane.
- Hooki upload existing-session wymagają `ref` lub `inputRef`, obsługują jeden plik na raz
  i nie obsługują kierowania do `element` przez CSS.
- Hooki dialog existing-session nie obsługują nadpisań timeout.
- Niektóre funkcje nadal wymagają ścieżki zarządzanej Browser, w tym batch
  actions, eksport PDF, przechwytywanie pobrań i `responsebody`.
- Existing-session jest lokalne względem hosta. Jeśli Chrome znajduje się na innym komputerze lub
  w innej przestrzeni nazw sieci, użyj zdalnego CDP albo hosta węzła.

## Gwarancje izolacji

- **Dedykowany katalog danych użytkownika**: nigdy nie dotyka Twojego osobistego profilu Browser.
- **Dedykowane porty**: unika `9222`, aby zapobiec kolizjom z przepływami deweloperskimi.
- **Deterministyczne sterowanie kartami**: karty są wskazywane przez `targetId`, a nie „ostatnia karta”.

## Wybór Browser

Przy lokalnym uruchamianiu OpenClaw wybiera pierwszą dostępną:

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

Tylko dla integracji lokalnych Gateway udostępnia małe loopback HTTP API:

- Status/start/stop: `GET /`, `POST /start`, `POST /stop`
- Karty: `GET /tabs`, `POST /tabs/open`, `POST /tabs/focus`, `DELETE /tabs/:targetId`
- Snapshot/zrzut ekranu: `GET /snapshot`, `POST /screenshot`
- Akcje: `POST /navigate`, `POST /act`
- Hooki: `POST /hooks/file-chooser`, `POST /hooks/dialog`
- Pobrania: `POST /download`, `POST /wait/download`
- Debugowanie: `GET /console`, `POST /pdf`
- Debugowanie: `GET /errors`, `GET /requests`, `POST /trace/start`, `POST /trace/stop`, `POST /highlight`
- Sieć: `POST /response/body`
- Stan: `GET /cookies`, `POST /cookies/set`, `POST /cookies/clear`
- Stan: `GET /storage/:kind`, `POST /storage/:kind/set`, `POST /storage/:kind/clear`
- Ustawienia: `POST /set/offline`, `POST /set/headers`, `POST /set/credentials`, `POST /set/geolocation`, `POST /set/media`, `POST /set/timezone`, `POST /set/locale`, `POST /set/device`

Wszystkie endpointy akceptują `?profile=<name>`.

Jeśli skonfigurowano auth gateway współdzielonym sekretem, trasy HTTP Browser także wymagają auth:

- `Authorization: Bearer <gateway token>`
- `x-openclaw-password: <gateway password>` albo HTTP Basic auth z tym hasłem

Uwagi:

- To samodzielne loopback API Browser **nie** korzysta z trusted-proxy ani
  nagłówków tożsamości Tailscale Serve.
- Jeśli `gateway.auth.mode` ma wartość `none` albo `trusted-proxy`, te loopbackowe trasy Browser
  nie dziedziczą tych trybów opartych na tożsamości; utrzymuj je tylko na loopback.

### Wymaganie Playwright

Niektóre funkcje (navigate/act/AI snapshot/role snapshot, zrzuty ekranów elementów,
PDF) wymagają Playwright. Jeśli Playwright nie jest zainstalowany, te endpointy zwracają
czytelny błąd 501.

Co nadal działa bez Playwright:

- snapshoty ARIA
- zrzuty ekranów całych stron dla zarządzanej przeglądarki `openclaw`, gdy dostępny jest
  WebSocket CDP per karta
- zrzuty ekranów całych stron dla profili `existing-session` / Chrome MCP
- zrzuty ekranów `--ref` dla existing-session na podstawie wyjścia snapshotu

Co nadal wymaga Playwright:

- `navigate`
- `act`
- snapshoty AI / snapshoty ról
- zrzuty ekranów elementów przez selektory CSS (`--element`)
- pełny eksport PDF Browser

Zrzuty ekranów elementów odrzucają też `--full-page`; trasa zwraca `fullPage is
not supported for element screenshots`.

Jeśli widzisz `Playwright is not available in this gateway build`, zainstaluj pełny
pakiet Playwright (nie `playwright-core`) i uruchom ponownie gateway albo ponownie zainstaluj
OpenClaw z obsługą Browser.

#### Instalacja Playwright w Dockerze

Jeśli Twój Gateway działa w Dockerze, unikaj `npx playwright` (konflikty z nadpisaniami npm).
Użyj dołączonego CLI:

```bash
docker compose run --rm openclaw-cli \
  node /app/node_modules/playwright-core/cli.js install chromium
```

Aby utrwalać pobrania Browser, ustaw `PLAYWRIGHT_BROWSERS_PATH` (na przykład,
`/home/node/.cache/ms-playwright`) i upewnij się, że `/home/node` jest utrwalane przez
`OPENCLAW_HOME_VOLUME` albo bind mount. Zobacz [Docker](/install/docker).

## Jak to działa (wewnętrznie)

Przepływ na wysokim poziomie:

- Mały **serwer sterowania** akceptuje żądania HTTP.
- Łączy się z przeglądarkami opartymi na Chromium (Chrome/Brave/Edge/Chromium) przez **CDP**.
- Dla bardziej zaawansowanych akcji (click/type/snapshot/PDF) używa **Playwright** na warstwie
  CDP.
- Gdy brakuje Playwright, dostępne są tylko operacje niezależne od Playwright.

Ten projekt utrzymuje po stronie agenta stabilny, deterministyczny interfejs, a jednocześnie pozwala
przełączać lokalne/zdalne przeglądarki i profile.

## Krótka dokumentacja CLI

Wszystkie polecenia akceptują `--browser-profile <name>`, aby wskazać konkretny profil.
Wszystkie polecenia akceptują też `--json` dla maszynowo czytelnego wyjścia (stabilne ładunki).

Podstawy:

- `openclaw browser status`
- `openclaw browser start`
- `openclaw browser stop`
- `openclaw browser tabs`
- `openclaw browser tab`
- `openclaw browser tab new`
- `openclaw browser tab select 2`
- `openclaw browser tab close 2`
- `openclaw browser open https://example.com`
- `openclaw browser focus abcd1234`
- `openclaw browser close abcd1234`

Inspekcja:

- `openclaw browser screenshot`
- `openclaw browser screenshot --full-page`
- `openclaw browser screenshot --ref 12`
- `openclaw browser screenshot --ref e12`
- `openclaw browser snapshot`
- `openclaw browser snapshot --format aria --limit 200`
- `openclaw browser snapshot --interactive --compact --depth 6`
- `openclaw browser snapshot --efficient`
- `openclaw browser snapshot --labels`
- `openclaw browser snapshot --selector "#main" --interactive`
- `openclaw browser snapshot --frame "iframe#main" --interactive`
- `openclaw browser console --level error`

Uwaga dotycząca cyklu życia:

- Dla profili attach-only i zdalnego CDP `openclaw browser stop` nadal jest
  poprawnym poleceniem czyszczenia po testach. Zamknie aktywną sesję sterowania i
  wyczyści tymczasowe nadpisania emulacji zamiast zabijać właściwą
  przeglądarkę.
- `openclaw browser errors --clear`
- `openclaw browser requests --filter api --clear`
- `openclaw browser pdf`
- `openclaw browser responsebody "**/api" --max-chars 5000`

Akcje:

- `openclaw browser navigate https://example.com`
- `openclaw browser resize 1280 720`
- `openclaw browser click 12 --double`
- `openclaw browser click e12 --double`
- `openclaw browser type 23 "hello" --submit`
- `openclaw browser press Enter`
- `openclaw browser hover 44`
- `openclaw browser scrollintoview e12`
- `openclaw browser drag 10 11`
- `openclaw browser select 9 OptionA OptionB`
- `openclaw browser download e12 report.pdf`
- `openclaw browser waitfordownload report.pdf`
- `openclaw browser upload /tmp/openclaw/uploads/file.pdf`
- `openclaw browser fill --fields '[{"ref":"1","type":"text","value":"Ada"}]'`
- `openclaw browser dialog --accept`
- `openclaw browser wait --text "Done"`
- `openclaw browser wait "#main" --url "**/dash" --load networkidle --fn "window.ready===true"`
- `openclaw browser evaluate --fn '(el) => el.textContent' --ref 7`
- `openclaw browser highlight e12`
- `openclaw browser trace start`
- `openclaw browser trace stop`

Stan:

- `openclaw browser cookies`
- `openclaw browser cookies set session abc123 --url "https://example.com"`
- `openclaw browser cookies clear`
- `openclaw browser storage local get`
- `openclaw browser storage local set theme dark`
- `openclaw browser storage session clear`
- `openclaw browser set offline on`
- `openclaw browser set headers --headers-json '{"X-Debug":"1"}'`
- `openclaw browser set credentials user pass`
- `openclaw browser set credentials --clear`
- `openclaw browser set geo 37.7749 -122.4194 --origin "https://example.com"`
- `openclaw browser set geo --clear`
- `openclaw browser set media dark`
- `openclaw browser set timezone America/New_York`
- `openclaw browser set locale en-US`
- `openclaw browser set device "iPhone 14"`

Uwagi:

- `upload` i `dialog` to wywołania **uzbrajające**; uruchamiaj je przed kliknięciem/naciśnięciem,
  które wyzwala wybór pliku/dialog.
- Ścieżki wyjściowe pobrań i śladów są ograniczone do katalogów tymczasowych OpenClaw:
  - ślady: `/tmp/openclaw` (fallback: `${os.tmpdir()}/openclaw`)
  - pobrania: `/tmp/openclaw/downloads` (fallback: `${os.tmpdir()}/openclaw/downloads`)
- Ścieżki uploadów są ograniczone do katalogu tymczasowego uploadów OpenClaw:
  - uploady: `/tmp/openclaw/uploads` (fallback: `${os.tmpdir()}/openclaw/uploads`)
- `upload` może także ustawiać wejścia plików bezpośrednio przez `--input-ref` lub `--element`.
- `snapshot`:
  - `--format ai` (domyślnie, gdy Playwright jest zainstalowany): zwraca snapshot AI z liczbowymi refami (`aria-ref="<n>"`).
  - `--format aria`: zwraca drzewo dostępności (bez refów; tylko do inspekcji).
  - `--efficient` (lub `--mode efficient`): kompaktowy preset snapshotu ról (interactive + compact + depth + niższe maxChars).
  - Domyślna konfiguracja (tylko narzędzie/CLI): ustaw `browser.snapshotDefaults.mode: "efficient"`, aby używać wydajnych snapshotów, gdy wywołujący nie przekazuje trybu (zobacz [Gateway configuration](/gateway/configuration-reference#browser)).
  - Opcje snapshotu ról (`--interactive`, `--compact`, `--depth`, `--selector`) wymuszają snapshot oparty na rolach z refami takimi jak `ref=e12`.
  - `--frame "<iframe selector>"` ogranicza snapshoty ról do iframe (łączy się z refami ról takimi jak `e12`).
  - `--interactive` wypisuje płaską, łatwą do wyboru listę elementów interaktywnych (najlepszą do wykonywania akcji).
  - `--labels` dodaje zrzut ekranu tylko aktualnego viewportu z nałożonymi etykietami refów (wypisuje `MEDIA:<path>`).
- `click`/`type`/itd. wymagają `ref` ze `snapshot` (albo liczbowego `12`, albo refu roli `e12`).
  Selektory CSS są celowo nieobsługiwane dla akcji.

## Snapshoty i refy

OpenClaw obsługuje dwa style „snapshotów”:

- **AI snapshot (liczbowe refy)**: `openclaw browser snapshot` (domyślnie; `--format ai`)
  - Wyjście: tekstowy snapshot zawierający liczbowe refy.
  - Akcje: `openclaw browser click 12`, `openclaw browser type 23 "hello"`.
  - Wewnętrznie ref jest rozwiązywany przez `aria-ref` Playwright.

- **Snapshot ról (refy ról jak `e12`)**: `openclaw browser snapshot --interactive` (albo `--compact`, `--depth`, `--selector`, `--frame`)
  - Wyjście: lista/drzewo oparte na rolach z `[ref=e12]` (oraz opcjonalnie `[nth=1]`).
  - Akcje: `openclaw browser click e12`, `openclaw browser highlight e12`.
  - Wewnętrznie ref jest rozwiązywany przez `getByRole(...)` (plus `nth()` dla duplikatów).
  - Dodaj `--labels`, aby dołączyć zrzut ekranu viewportu z nałożonymi etykietami `e12`.

Zachowanie refów:

- Refy **nie są stabilne między nawigacjami**; jeśli coś się nie powiedzie, uruchom ponownie `snapshot` i użyj świeżego refu.
- Jeśli snapshot ról został wykonany z `--frame`, refy ról są ograniczone do tego iframe do czasu następnego snapshotu ról.

## Rozszerzenia wait

Możesz czekać na coś więcej niż tylko czas/tekst:

- Czekanie na URL (obsługiwane globy przez Playwright):
  - `openclaw browser wait --url "**/dash"`
- Czekanie na stan ładowania:
  - `openclaw browser wait --load networkidle`
- Czekanie na predykat JS:
  - `openclaw browser wait --fn "window.ready===true"`
- Czekanie, aż selektor stanie się widoczny:
  - `openclaw browser wait "#main"`

Można to łączyć:

```bash
openclaw browser wait "#main" \
  --url "**/dash" \
  --load networkidle \
  --fn "window.ready===true" \
  --timeout-ms 15000
```

## Przepływy debugowania

Gdy akcja się nie powiedzie (np. „not visible”, „strict mode violation”, „covered”):

1. `openclaw browser snapshot --interactive`
2. Użyj `click <ref>` / `type <ref>` (preferuj refy ról w trybie interactive)
3. Jeśli nadal się nie powiedzie: `openclaw browser highlight <ref>`, aby zobaczyć, w co celuje Playwright
4. Jeśli strona zachowuje się dziwnie:
   - `openclaw browser errors --clear`
   - `openclaw browser requests --filter api --clear`
5. Do głębokiego debugowania: nagraj ślad:
   - `openclaw browser trace start`
   - odtwórz problem
   - `openclaw browser trace stop` (wypisuje `TRACE:<path>`)

## Wyjście JSON

`--json` służy do skryptów i narzędzi strukturalnych.

Przykłady:

```bash
openclaw browser status --json
openclaw browser snapshot --interactive --json
openclaw browser requests --filter api --json
openclaw browser cookies --json
```

Snapshoty ról w JSON zawierają `refs` oraz mały blok `stats` (lines/chars/refs/interactive), dzięki czemu narzędzia mogą analizować rozmiar i gęstość ładunku.

## Ustawienia stanu i środowiska

Są przydatne w przepływach typu „spraw, żeby strona zachowywała się jak X”:

- Cookies: `cookies`, `cookies set`, `cookies clear`
- Storage: `storage local|session get|set|clear`
- Offline: `set offline on|off`
- Headers: `set headers --headers-json '{"X-Debug":"1"}'` (starsze `set headers --json '{"X-Debug":"1"}'` nadal jest obsługiwane)
- Auth HTTP Basic: `set credentials user pass` (lub `--clear`)
- Geolokalizacja: `set geo <lat> <lon> --origin "https://example.com"` (lub `--clear`)
- Media: `set media dark|light|no-preference|none`
- Timezone / locale: `set timezone ...`, `set locale ...`
- Device / viewport:
  - `set device "iPhone 14"` (presety urządzeń Playwright)
  - `set viewport 1280 720`

## Bezpieczeństwo i prywatność

- Profil Browser openclaw może zawierać zalogowane sesje; traktuj go jako wrażliwy.
- `browser act kind=evaluate` / `openclaw browser evaluate` oraz `wait --fn`
  wykonują dowolny JavaScript w kontekście strony. Prompt injection może tym sterować.
  Wyłącz to przez `browser.evaluateEnabled=false`, jeśli tego nie potrzebujesz.
- W przypadku logowania i uwag dotyczących antybotów (X/Twitter itd.) zobacz [Browser login + X/Twitter posting](/tools/browser-login).
- Utrzymuj Gateway/hosta węzła jako prywatne (tylko loopback lub tailnet).
- Endpointy zdalnego CDP są potężne; tuneluj je i chroń.

Przykład trybu ścisłego (domyślnie blokowanie prywatnych/wewnętrznych miejsc docelowych):

```json5
{
  browser: {
    ssrfPolicy: {
      dangerouslyAllowPrivateNetwork: false,
      hostnameAllowlist: ["*.example.com", "example.com"],
      allowedHostnames: ["localhost"], // optional exact allow
    },
  },
}
```

## Rozwiązywanie problemów

W przypadku problemów specyficznych dla Linuxa (szczególnie snap Chromium) zobacz
[Browser troubleshooting](/tools/browser-linux-troubleshooting).

Dla konfiguracji split-host WSL2 Gateway + Windows Chrome zobacz
[WSL2 + Windows + remote Chrome CDP troubleshooting](/tools/browser-wsl2-windows-remote-cdp-troubleshooting).

## Narzędzia agenta + jak działa sterowanie

Agent otrzymuje **jedno narzędzie** do automatyzacji Browser:

- `browser` — status/start/stop/tabs/open/focus/close/snapshot/screenshot/navigate/act

Jak to działa:

- `browser snapshot` zwraca stabilne drzewo UI (AI lub ARIA).
- `browser act` używa identyfikatorów `ref` ze snapshotów do click/type/drag/select.
- `browser screenshot` przechwytuje piksele (całą stronę albo element).
- `browser` akceptuje:
  - `profile`, aby wybrać nazwany profil Browser (`openclaw`, `chrome` albo zdalny CDP).
  - `target` (`sandbox` | `host` | `node`), aby wybrać miejsce działania Browser.
  - W sesjach sandboxowanych `target: "host"` wymaga `agents.defaults.sandbox.browser.allowHostControl=true`.
  - Jeśli pominięto `target`: sesje sandboxowane domyślnie używają `sandbox`, a sesje niesandboxowane — `host`.
  - Jeśli połączony jest węzeł obsługujący Browser, narzędzie może automatycznie kierować ruch do niego, chyba że przypniesz `target="host"` lub `target="node"`.

To utrzymuje deterministyczne działanie agenta i pozwala uniknąć kruchych selektorów.

## Powiązane

- [Tools Overview](/tools) — wszystkie dostępne narzędzia agenta
- [Sandboxing](/gateway/sandboxing) — sterowanie Browser w środowiskach sandboxowanych
- [Security](/gateway/security) — ryzyka sterowania Browser i utwardzanie
