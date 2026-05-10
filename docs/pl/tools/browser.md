---
read_when:
    - Dodawanie automatyzacji przeglądarki sterowanej przez agenta
    - Debugowanie, dlaczego OpenClaw zakłóca działanie twojej własnej przeglądarki Chrome
    - Implementacja ustawień przeglądarki + cyklu życia w aplikacji macOS
summary: Zintegrowana usługa sterowania przeglądarką + polecenia akcji
title: Przeglądarka (zarządzana przez OpenClaw)
x-i18n:
    generated_at: "2026-05-10T19:56:27Z"
    model: gpt-5.5
    provider: openai
    source_hash: 51a78cc860ef4951548aba1e60bc686dfc19c156f69b6a59cf7c671eeaa67a0a
    source_path: tools/browser.md
    workflow: 16
---

OpenClaw może uruchamiać **dedykowany profil Chrome/Brave/Edge/Chromium**, którym steruje agent.
Jest on odizolowany od Twojej osobistej przeglądarki i zarządzany przez niewielką lokalną
usługę sterującą wewnątrz Gateway (tylko loopback).

Widok dla początkujących:

- Potraktuj to jako **osobną przeglądarkę wyłącznie dla agenta**.
- Profil `openclaw` **nie** dotyka Twojego osobistego profilu przeglądarki.
- Agent może **otwierać karty, czytać strony, klikać i pisać** w bezpiecznej ścieżce.
- Wbudowany profil `user` dołącza do Twojej prawdziwej zalogowanej sesji Chrome przez Chrome MCP.

## Co otrzymujesz

- Osobny profil przeglądarki o nazwie **openclaw** (domyślnie z pomarańczowym akcentem).
- Deterministyczne sterowanie kartami (lista/otwarcie/fokus/zamknięcie).
- Akcje agenta (kliknięcie/pisanie/przeciąganie/wybór), migawki, zrzuty ekranu, pliki PDF.
- Dołączoną umiejętność `browser-automation`, która uczy agentów pętli odzyskiwania
  z migawki, stabilnej karty, nieaktualnego odwołania i blokera ręcznego, gdy Plugin
  przeglądarki jest włączony.
- Opcjonalną obsługę wielu profili (`openclaw`, `work`, `remote`, ...).

Ta przeglądarka **nie** jest Twoją codzienną przeglądarką. To bezpieczna, odizolowana powierzchnia do
automatyzacji i weryfikacji przez agenta.

## Szybki start

```bash
openclaw browser --browser-profile openclaw doctor
openclaw browser --browser-profile openclaw doctor --deep
openclaw browser --browser-profile openclaw status
openclaw browser --browser-profile openclaw start
openclaw browser --browser-profile openclaw open https://example.com
openclaw browser --browser-profile openclaw snapshot
```

Jeśli otrzymasz komunikat „Browser disabled”, włącz ją w konfiguracji (patrz niżej) i uruchom ponownie
Gateway.

Jeśli `openclaw browser` w ogóle nie istnieje albo agent mówi, że narzędzie przeglądarki
jest niedostępne, przejdź do [Brak polecenia lub narzędzia przeglądarki](/pl/tools/browser#missing-browser-command-or-tool).

## Sterowanie Plugin

Domyślne narzędzie `browser` to dołączony Plugin. Wyłącz je, aby zastąpić je innym Plugin, który rejestruje tę samą nazwę narzędzia `browser`:

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

Wartości domyślne wymagają zarówno `plugins.entries.browser.enabled`, **jak i** `browser.enabled=true`. Wyłączenie tylko Plugin usuwa CLI `openclaw browser`, metodę Gateway `browser.request`, narzędzie agenta oraz usługę sterującą jako jedną całość; Twoja konfiguracja `browser.*` pozostaje nienaruszona dla zamiennika.

Zmiany konfiguracji przeglądarki wymagają ponownego uruchomienia Gateway, aby Plugin mógł ponownie zarejestrować swoją usługę.

## Wskazówki dla agenta

Uwaga dotycząca profilu narzędzi: `tools.profile: "coding"` obejmuje `web_search` i
`web_fetch`, ale nie obejmuje pełnego narzędzia `browser`. Jeśli agent albo
uruchomiony podagent ma używać automatyzacji przeglądarki, dodaj przeglądarkę na etapie
profilu:

```json5
{
  tools: {
    profile: "coding",
    alsoAllow: ["browser"],
  },
}
```

Dla pojedynczego agenta użyj `agents.list[].tools.alsoAllow: ["browser"]`.
Samo `tools.subagents.tools.allow: ["browser"]` nie wystarczy, ponieważ polityka podagenta
jest stosowana po filtrowaniu profilu.

Plugin przeglądarki dostarcza dwa poziomy wskazówek dla agenta:

- Opis narzędzia `browser` zawiera kompaktową, zawsze aktywną umowę: wybierz
  właściwy profil, trzymaj odwołania na tej samej karcie, używaj `tabId`/etykiet do
  wskazywania kart i załaduj umiejętność przeglądarki do pracy wieloetapowej.
- Dołączona umiejętność `browser-automation` zawiera dłuższą pętlę operacyjną:
  najpierw sprawdź status/karty, etykietuj karty zadania, wykonaj migawkę przed działaniem, wykonaj ponowną migawkę
  po zmianach UI, raz odzyskaj nieaktualne odwołania oraz zgłaszaj logowanie/2FA/captcha albo
  blokady kamery/mikrofonu jako wymaganą ręczną akcję zamiast zgadywania.

Skills dołączane przez Plugin są wymienione w dostępnych Skills agenta, gdy
Plugin jest włączony. Pełne instrukcje umiejętności są ładowane na żądanie, więc rutynowe
tury nie ponoszą pełnego kosztu tokenów.

## Brak polecenia lub narzędzia przeglądarki

Jeśli po aktualizacji `openclaw browser` jest nieznane, brakuje `browser.request` albo agent zgłasza, że narzędzie przeglądarki jest niedostępne, zwykle przyczyną jest lista `plugins.allow`, która pomija `browser`, oraz brak głównego bloku konfiguracji `browser`. Dodaj go:

```json5
{
  plugins: {
    allow: ["telegram", "browser"],
  },
}
```

Jawny główny blok `browser`, na przykład `browser.enabled=true` albo `browser.profiles.<name>`, aktywuje dołączony Plugin przeglądarki nawet przy restrykcyjnym `plugins.allow`, zgodnie z zachowaniem konfiguracji kanałów. Same `plugins.entries.browser.enabled=true` i `tools.alsoAllow: ["browser"]` nie zastępują członkostwa w allowliście. Całkowite usunięcie `plugins.allow` również przywraca wartość domyślną.

## Profile: `openclaw` kontra `user`

- `openclaw`: zarządzana, odizolowana przeglądarka (rozszerzenie nie jest wymagane).
- `user`: wbudowany profil dołączenia Chrome MCP dla Twojej **prawdziwej zalogowanej sesji Chrome**.

Dla wywołań narzędzia przeglądarki przez agenta:

- Domyślnie: używaj odizolowanej przeglądarki `openclaw`.
- Preferuj `profile="user"`, gdy istniejące zalogowane sesje mają znaczenie, a użytkownik
  jest przy komputerze, aby kliknąć/zatwierdzić ewentualny monit dołączenia.
- `profile` to jawne nadpisanie, gdy chcesz użyć konkretnego trybu przeglądarki.

Ustaw `browser.defaultProfile: "openclaw"`, jeśli chcesz domyślnie używać trybu zarządzanego.

## Konfiguracja

Ustawienia przeglądarki znajdują się w `~/.openclaw/openclaw.json`.

```json5
{
  browser: {
    enabled: true, // default: true
    ssrfPolicy: {
      // dangerouslyAllowPrivateNetwork: true, // opt in only for trusted private-network access
      // allowPrivateNetwork: true, // legacy alias
      // hostnameAllowlist: ["*.example.com", "example.com"],
      // allowedHostnames: ["localhost"],
    },
    // cdpUrl: "http://127.0.0.1:18792", // legacy single-profile override
    remoteCdpTimeoutMs: 1500, // remote CDP HTTP timeout (ms)
    remoteCdpHandshakeTimeoutMs: 3000, // remote CDP WebSocket handshake timeout (ms)
    localLaunchTimeoutMs: 15000, // local managed Chrome discovery timeout (ms)
    localCdpReadyTimeoutMs: 8000, // local managed post-launch CDP readiness timeout (ms)
    actionTimeoutMs: 60000, // default browser act timeout (ms)
    tabCleanup: {
      enabled: true, // default: true
      idleMinutes: 120, // set 0 to disable idle cleanup
      maxTabsPerSession: 8, // set 0 to disable the per-session cap
      sweepMinutes: 5,
    },
    defaultProfile: "openclaw",
    color: "#FF4500",
    headless: false,
    noSandbox: false,
    attachOnly: false,
    executablePath: "/Applications/Brave Browser.app/Contents/MacOS/Brave Browser",
    profiles: {
      openclaw: { cdpPort: 18800, color: "#FF4500" },
      work: {
        cdpPort: 18801,
        color: "#0066CC",
        headless: true,
        executablePath: "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
      },
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

- Usługa sterująca wiąże się z loopback na porcie wyprowadzonym z `gateway.port` (domyślnie `18791` = gateway + 2). Nadpisanie `gateway.port` albo `OPENCLAW_GATEWAY_PORT` przesuwa wyprowadzone porty w tej samej rodzinie.
- Lokalne profile `openclaw` automatycznie przypisują `cdpPort`/`cdpUrl`; ustawiaj je tylko dla zdalnego CDP. Gdy `cdpUrl` nie jest ustawione, domyślnie wskazuje zarządzany lokalny port CDP.
- `remoteCdpTimeoutMs` dotyczy zdalnych i `attachOnly` kontroli osiągalności HTTP CDP
  oraz żądań HTTP otwierających karty; `remoteCdpHandshakeTimeoutMs` dotyczy
  ich uzgadniania CDP WebSocket.
- `localLaunchTimeoutMs` to budżet czasu dla lokalnie uruchomionego zarządzanego procesu Chrome
  na udostępnienie punktu końcowego HTTP CDP. `localCdpReadyTimeoutMs` to
  kolejny budżet na gotowość CDP websocket po wykryciu procesu.
  Zwiększ te wartości na Raspberry Pi, słabych VPS-ach albo starszym sprzęcie, gdzie Chromium
  uruchamia się wolno. Wartości muszą być dodatnimi liczbami całkowitymi do `120000` ms; nieprawidłowe
  wartości konfiguracji są odrzucane.
- Powtarzające się błędy uruchamiania/gotowości zarządzanego Chrome są obejmowane circuit breakerem dla
  profilu. Po kilku kolejnych niepowodzeniach OpenClaw na krótko wstrzymuje nowe próby
  uruchomienia zamiast uruchamiać Chromium przy każdym wywołaniu narzędzia przeglądarki. Napraw
  problem startowy, wyłącz przeglądarkę, jeśli nie jest potrzebna, albo uruchom ponownie
  Gateway po naprawie.
- `actionTimeoutMs` to domyślny budżet dla żądań przeglądarki `act`, gdy wywołujący nie przekazuje `timeoutMs`. Transport klienta dodaje niewielkie okno zapasu, aby długie oczekiwania mogły się zakończyć zamiast przekroczyć limit czasu na granicy HTTP.
- `tabCleanup` to best-effort czyszczenie kart otwieranych przez sesje przeglądarki głównego agenta. Czyszczenie cyklu życia podagentów, cron i ACP nadal zamyka ich jawnie śledzone karty na końcu sesji; sesje główne utrzymują aktywne karty jako ponownie używalne, a następnie zamykają bezczynne albo nadmiarowe śledzone karty w tle.

</Accordion>

<Accordion title="Polityka SSRF">

- Nawigacja przeglądarki i otwieranie kart są chronione przed SSRF przed nawigacją oraz w miarę możliwości ponownie sprawdzane na końcowym URL `http(s)` później.
- W ścisłym trybie SSRF sprawdzane są także wykrywanie zdalnego punktu końcowego CDP i sondy `/json/version` (`cdpUrl`).
- Zmienne środowiskowe Gateway/providera `HTTP_PROXY`, `HTTPS_PROXY`, `ALL_PROXY` i `NO_PROXY` nie pośredniczą automatycznie w ruchu przeglądarki zarządzanej przez OpenClaw. Zarządzany Chrome domyślnie uruchamia się bezpośrednio, aby ustawienia proxy providera nie osłabiały kontroli SSRF przeglądarki.
- Aby użyć proxy dla samej zarządzanej przeglądarki, przekaż jawne flagi proxy Chrome przez `browser.extraArgs`, takie jak `--proxy-server=...` albo `--proxy-pac-url=...`. Ścisły tryb SSRF blokuje jawne trasowanie przez proxy przeglądarki, chyba że dostęp przeglądarki do sieci prywatnej został celowo włączony.
- `browser.ssrfPolicy.dangerouslyAllowPrivateNetwork` jest domyślnie wyłączone; włączaj tylko wtedy, gdy dostęp przeglądarki do sieci prywatnej jest celowo zaufany.
- `browser.ssrfPolicy.allowPrivateNetwork` pozostaje obsługiwane jako alias zgodności ze starszą wersją.

</Accordion>

<Accordion title="Zachowanie profilu">

- `attachOnly: true` oznacza: nigdy nie uruchamiaj lokalnej przeglądarki; dołącz tylko wtedy, gdy jakaś już działa.
- `headless` można ustawić globalnie albo dla lokalnego profilu zarządzanego. Wartości dla profilu zastępują `browser.headless`, więc jeden lokalnie uruchomiony profil może pozostać w trybie bezgłowym, a inny widoczny.
- `POST /start?headless=true` i `openclaw browser start --headless` żądają
  jednorazowego uruchomienia w trybie bezgłowym dla lokalnych profili
  zarządzanych bez przepisywania `browser.headless` ani konfiguracji profilu.
  Profile z istniejącą sesją, tylko do dołączania oraz zdalne profile CDP
  odrzucają to nadpisanie, ponieważ OpenClaw nie uruchamia tych procesów
  przeglądarki.
- Na hostach Linux bez `DISPLAY` lub `WAYLAND_DISPLAY` lokalne profile
  zarządzane domyślnie automatycznie przechodzą w tryb bezgłowy, gdy ani
  środowisko, ani konfiguracja profilu/globalna nie wybiera jawnie trybu z
  interfejsem graficznym. `openclaw browser status --json` zgłasza
  `headlessSource` jako `env`, `profile`, `config`,
  `request`, `linux-display-fallback` albo `default`.
- `OPENCLAW_BROWSER_HEADLESS=1` wymusza uruchomienia lokalnie zarządzane w
  trybie bezgłowym dla bieżącego procesu. `OPENCLAW_BROWSER_HEADLESS=0` wymusza
  tryb z interfejsem graficznym dla zwykłych uruchomień i zwraca możliwy do
  wykonania błąd na hostach Linux bez serwera wyświetlania; jawne żądanie
  `start --headless` nadal wygrywa dla tego jednego uruchomienia.
- `executablePath` można ustawić globalnie albo dla lokalnego profilu zarządzanego. Wartości dla profilu zastępują `browser.executablePath`, więc różne profile zarządzane mogą uruchamiać różne przeglądarki oparte na Chromium. Obie formy akceptują `~` jako katalog domowy systemu operacyjnego.
- `color` (najwyższego poziomu i dla profilu) zabarwia interfejs przeglądarki, aby było widać, który profil jest aktywny.
- Domyślny profil to `openclaw` (zarządzany samodzielny). Użyj `defaultProfile: "user"`, aby wybrać zalogowaną przeglądarkę użytkownika.
- Kolejność automatycznego wykrywania: domyślna przeglądarka systemowa, jeśli jest oparta na Chromium; w przeciwnym razie Chrome → Brave → Edge → Chromium → Chrome Canary.
- `driver: "existing-session"` używa Chrome DevTools MCP zamiast surowego CDP. Nie ustawiaj `cdpUrl` dla tego sterownika.
- Ustaw `browser.profiles.<name>.userDataDir`, gdy profil z istniejącą sesją ma dołączać do niedomyślnego profilu użytkownika Chromium (Brave, Edge itd.). Ta ścieżka również akceptuje `~` jako katalog domowy systemu operacyjnego.

</Accordion>

</AccordionGroup>

## Używanie Brave lub innej przeglądarki opartej na Chromium

Jeśli Twoja **domyślna przeglądarka systemowa** jest oparta na Chromium
(Chrome/Brave/Edge/itd.), OpenClaw używa jej automatycznie. Ustaw
`browser.executablePath`, aby zastąpić automatyczne wykrywanie. Wartości
`executablePath` najwyższego poziomu i dla profilu akceptują `~` jako katalog
domowy systemu operacyjnego:

```bash
openclaw config set browser.executablePath "/usr/bin/google-chrome"
openclaw config set browser.profiles.work.executablePath "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome"
```

Albo ustaw to w konfiguracji, zależnie od platformy:

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

`executablePath` dla profilu wpływa tylko na lokalne profile zarządzane
uruchamiane przez OpenClaw. Profile `existing-session` zamiast tego dołączają do
już działającej przeglądarki, a zdalne profile CDP używają przeglądarki za
`cdpUrl`.

## Sterowanie lokalne i zdalne

- **Sterowanie lokalne (domyślne):** Gateway uruchamia usługę sterowania loopback i może uruchomić lokalną przeglądarkę.
- **Sterowanie zdalne (host węzła):** uruchom host węzła na maszynie, na której znajduje się przeglądarka; Gateway przekazuje do niego akcje przeglądarki przez proxy.
- **Zdalne CDP:** ustaw `browser.profiles.<name>.cdpUrl` (albo `browser.cdpUrl`),
  aby dołączyć do zdalnej przeglądarki opartej na Chromium. W takim przypadku OpenClaw nie uruchomi lokalnej przeglądarki.
- Dla zewnętrznie zarządzanych usług CDP na loopback (na przykład Browserless w
  Dockerze opublikowanym na `127.0.0.1`) ustaw także `attachOnly: true`. CDP na
  loopback bez `attachOnly` jest traktowane jako lokalny profil przeglądarki
  zarządzany przez OpenClaw.
- `headless` wpływa tylko na lokalne profile zarządzane uruchamiane przez OpenClaw. Nie restartuje ani nie zmienia przeglądarek z istniejącą sesją ani zdalnych przeglądarek CDP.
- `executablePath` podlega tej samej regule lokalnego profilu zarządzanego. Zmiana go w
  działającym lokalnym profilu zarządzanym oznacza ten profil do restartu/uzgodnienia,
  aby następne uruchomienie użyło nowego pliku binarnego.

Zachowanie zatrzymywania różni się zależnie od trybu profilu:

- lokalne profile zarządzane: `openclaw browser stop` zatrzymuje proces przeglądarki
  uruchomiony przez OpenClaw
- profile tylko do dołączania i zdalne profile CDP: `openclaw browser stop` zamyka aktywną
  sesję sterowania i zwalnia nadpisania emulacji Playwright/CDP (viewport,
  schemat kolorów, ustawienia regionalne, strefę czasową, tryb offline i podobny stan), mimo
  że OpenClaw nie uruchomił żadnego procesu przeglądarki

Zdalne adresy URL CDP mogą zawierać uwierzytelnianie:

- Tokeny zapytania (np. `https://provider.example?token=<token>`)
- Uwierzytelnianie HTTP Basic (np. `https://user:pass@provider.example`)

OpenClaw zachowuje uwierzytelnianie podczas wywoływania punktów końcowych
`/json/*` oraz podczas łączenia z WebSocket CDP. Preferuj zmienne środowiskowe
lub menedżery sekretów dla tokenów zamiast zatwierdzania ich w plikach
konfiguracyjnych.

## Proxy przeglądarki Node (domyślnie bez konfiguracji)

Jeśli uruchomisz **host węzła** na maszynie, na której znajduje się przeglądarka,
OpenClaw może automatycznie kierować wywołania narzędzi przeglądarki do tego
węzła bez dodatkowej konfiguracji przeglądarki. To domyślna ścieżka dla zdalnych
Gateway.

Uwagi:

- Host węzła udostępnia swój lokalny serwer sterowania przeglądarką przez **polecenie proxy**.
- Profile pochodzą z własnej konfiguracji `browser.profiles` węzła (tak samo jak lokalnie).
- `nodeHost.browserProxy.allowProfiles` jest opcjonalne. Pozostaw je puste dla starszego/domyślnego zachowania: wszystkie skonfigurowane profile pozostają osiągalne przez proxy, w tym trasy tworzenia/usuwania profilu.
- Jeśli ustawisz `nodeHost.browserProxy.allowProfiles`, OpenClaw traktuje to jako granicę najmniejszych uprawnień: można wskazywać tylko profile z listy dozwolonych, a trwałe trasy tworzenia/usuwania profilu są blokowane na powierzchni proxy.
- Wyłącz, jeśli tego nie chcesz:
  - Na węźle: `nodeHost.browserProxy.enabled=false`
  - Na gateway: `gateway.nodes.browser.mode="off"`

## Browserless (hostowane zdalne CDP)

[Browserless](https://browserless.io) to hostowana usługa Chromium, która udostępnia
adresy URL połączeń CDP przez HTTPS i WebSocket. OpenClaw może używać obu form, ale
dla zdalnego profilu przeglądarki najprostszą opcją jest bezpośredni adres URL WebSocket
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

- Zastąp `<BROWSERLESS_API_KEY>` swoim rzeczywistym tokenem Browserless.
- Wybierz punkt końcowy regionu zgodny z kontem Browserless (zobacz ich dokumentację).
- Jeśli Browserless podaje bazowy adres URL HTTPS, możesz przekształcić go na
  `wss://` dla bezpośredniego połączenia CDP albo pozostawić adres URL HTTPS i pozwolić OpenClaw
  wykryć `/json/version`.

### Browserless Docker na tym samym hoście

Gdy Browserless jest hostowany samodzielnie w Dockerze, a OpenClaw działa na hoście, traktuj
Browserless jako zewnętrznie zarządzaną usługę CDP:

```json5
{
  browser: {
    enabled: true,
    defaultProfile: "browserless",
    profiles: {
      browserless: {
        cdpUrl: "ws://127.0.0.1:3000",
        attachOnly: true,
        color: "#00AA00",
      },
    },
  },
}
```

Adres w `browser.profiles.browserless.cdpUrl` musi być osiągalny z procesu
OpenClaw. Browserless musi także rozgłaszać pasujący osiągalny punkt końcowy;
ustaw `EXTERNAL` Browserless na tę samą bazę WebSocket publiczną dla OpenClaw,
taką jak `ws://127.0.0.1:3000`, `ws://browserless:3000` albo stabilny prywatny
adres sieci Docker. Jeśli `/json/version` zwraca `webSocketDebuggerUrl`
wskazujący adres, którego OpenClaw nie może osiągnąć, HTTP CDP może wyglądać na
sprawne, podczas gdy dołączenie WebSocket nadal się nie powiedzie.

Nie pozostawiaj `attachOnly` nieustawionego dla profilu Browserless na loopback. Bez
`attachOnly` OpenClaw traktuje port loopback jako lokalny profil przeglądarki
zarządzany i może zgłosić, że port jest używany, ale nie należy do OpenClaw.

## Bezpośredni dostawcy CDP WebSocket

Niektóre hostowane usługi przeglądarek udostępniają **bezpośredni punkt końcowy WebSocket** zamiast
standardowego wykrywania CDP opartego na HTTP (`/json/version`). OpenClaw akceptuje trzy
kształty adresów URL CDP i automatycznie wybiera właściwą strategię połączenia:

- **Wykrywanie HTTP(S)** - `http://host[:port]` albo `https://host[:port]`.
  OpenClaw wywołuje `/json/version`, aby wykryć adres URL debuggera WebSocket, a następnie
  się łączy. Brak przełączenia awaryjnego na WebSocket.
- **Bezpośrednie punkty końcowe WebSocket** - `ws://host[:port]/devtools/<kind>/<id>` albo
  `wss://...` ze ścieżką `/devtools/browser|page|worker|shared_worker|service_worker/<id>`.
  OpenClaw łączy się bezpośrednio przez uzgadnianie WebSocket i całkowicie pomija
  `/json/version`.
- **Gołe korzenie WebSocket** - `ws://host[:port]` albo `wss://host[:port]` bez
  ścieżki `/devtools/...` (np. [Browserless](https://browserless.io),
  [Browserbase](https://www.browserbase.com)). OpenClaw najpierw próbuje wykrywania HTTP
  `/json/version` (normalizując schemat do `http`/`https`);
  jeśli wykrywanie zwróci `webSocketDebuggerUrl`, zostanie on użyty, w przeciwnym razie OpenClaw
  przełączy się awaryjnie na bezpośrednie uzgadnianie WebSocket w gołym korzeniu. Jeśli rozgłaszany
  punkt końcowy WebSocket odrzuci uzgadnianie CDP, ale skonfigurowany goły korzeń
  je zaakceptuje, OpenClaw również przełączy się awaryjnie na ten korzeń. Dzięki temu goły `ws://`
  wskazujący lokalne Chrome nadal może się połączyć, ponieważ Chrome akceptuje uaktualnienia WebSocket
  tylko na określonej ścieżce docelowej z `/json/version`, a hostowani
  dostawcy nadal mogą używać swojego głównego punktu końcowego WebSocket, gdy ich punkt końcowy
  wykrywania rozgłasza krótkotrwały adres URL, który nie nadaje się dla Playwright CDP.

### Browserbase

[Browserbase](https://www.browserbase.com) to platforma chmurowa do uruchamiania
przeglądarek bezgłowych z wbudowanym rozwiązywaniem CAPTCHA, trybem stealth i
proxy rezydenckimi.

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
  z [panelu Overview](https://www.browserbase.com/overview).
- Zastąp `<BROWSERBASE_API_KEY>` swoim rzeczywistym kluczem API Browserbase.
- Browserbase automatycznie tworzy sesję przeglądarki przy połączeniu WebSocket, więc nie jest
  potrzebny ręczny krok tworzenia sesji.
- Bezpłatny plan pozwala na jedną równoczesną sesję i jedną godzinę przeglądarki miesięcznie.
  Zobacz [cennik](https://www.browserbase.com/pricing), aby poznać limity płatnych planów.
- Zobacz [dokumentację Browserbase](https://docs.browserbase.com), aby uzyskać pełne odwołanie do API,
  przewodniki SDK i przykłady integracji.

## Bezpieczeństwo

Najważniejsze założenia:

- Sterowanie przeglądarką jest dostępne tylko przez loopback; dostęp odbywa się przez uwierzytelnianie Gateway lub parowanie węzła.
- Samodzielne HTTP API przeglądarki loopback używa **wyłącznie uwierzytelniania za pomocą współdzielonego sekretu**:
  uwierzytelniania bearer tokenem Gateway, `x-openclaw-password` albo HTTP Basic auth ze
  skonfigurowanym hasłem Gateway.
- Nagłówki tożsamości Tailscale Serve oraz `gateway.auth.mode: "trusted-proxy"` **nie**
  uwierzytelniają tego samodzielnego API przeglądarki loopback.
- Jeśli sterowanie przeglądarką jest włączone i nie skonfigurowano uwierzytelniania
  za pomocą współdzielonego sekretu, OpenClaw generuje token Gateway tylko na czas
  działania tego uruchomienia. Skonfiguruj jawnie `gateway.auth.token`,
  `gateway.auth.password`, `OPENCLAW_GATEWAY_TOKEN` lub
  `OPENCLAW_GATEWAY_PASSWORD`, jeśli klienci potrzebują stabilnego sekretu między
  restartami.
- OpenClaw **nie** generuje automatycznie tego tokenu, gdy `gateway.auth.mode` ma
  już wartość `password`, `none` lub `trusted-proxy`.
- Trzymaj Gateway i wszystkie hosty węzłów w sieci prywatnej (Tailscale); unikaj publicznego wystawiania.
- Traktuj zdalne URL-e/tokeny CDP jak sekrety; preferuj zmienne środowiskowe albo menedżera sekretów.

Wskazówki dotyczące zdalnego CDP:

- Preferuj szyfrowane punkty końcowe (HTTPS lub WSS) i krótkotrwałe tokeny, gdy to możliwe.
- Unikaj osadzania długotrwałych tokenów bezpośrednio w plikach konfiguracji.

## Profile (wiele przeglądarek)

OpenClaw obsługuje wiele nazwanych profili (konfiguracji routingu). Profile mogą być:

- **zarządzane przez openclaw**: dedykowana instancja przeglądarki opartej na Chromium z własnym katalogiem danych użytkownika + portem CDP
- **zdalne**: jawny URL CDP (przeglądarka oparta na Chromium działająca gdzie indziej)
- **istniejąca sesja**: istniejący profil Chrome przez automatyczne łączenie Chrome DevTools MCP

Domyślne ustawienia:

- Profil `openclaw` jest automatycznie tworzony, jeśli go brakuje.
- Profil `user` jest wbudowany do dołączania istniejącej sesji Chrome MCP.
- Profile istniejącej sesji poza `user` są opcjonalne; utwórz je za pomocą `--driver existing-session`.
- Lokalne porty CDP są domyślnie przydzielane z zakresu **18800-18899**.
- Usunięcie profilu przenosi jego lokalny katalog danych do Kosza.

Wszystkie punkty końcowe sterowania akceptują `?profile=<name>`; CLI używa `--browser-profile`.

## Istniejąca sesja przez Chrome DevTools MCP

OpenClaw może także dołączyć do działającego profilu przeglądarki opartej na Chromium przez
oficjalny serwer Chrome DevTools MCP. Wykorzystuje to ponownie karty i stan logowania
już otwarte w tym profilu przeglądarki.

Oficjalne materiały kontekstowe i konfiguracyjne:

- [Chrome for Developers: używanie Chrome DevTools MCP z sesją przeglądarki](https://developer.chrome.com/blog/chrome-devtools-mcp-debug-your-browser-session)
- [README Chrome DevTools MCP](https://github.com/ChromeDevTools/chrome-devtools-mcp)

Wbudowany profil:

- `user`

Opcjonalnie: utwórz własny niestandardowy profil istniejącej sesji, jeśli chcesz użyć
innej nazwy, koloru albo katalogu danych przeglądarki.

Domyślne zachowanie:

- Wbudowany profil `user` używa automatycznego łączenia Chrome MCP, które kieruje na
  domyślny lokalny profil Google Chrome.

Użyj `userDataDir` dla Brave, Edge, Chromium albo niedomyślnego profilu Chrome.
`~` rozwija się do katalogu domowego w Twoim systemie operacyjnym:

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

1. Otwórz stronę inspekcji tej przeglądarki dla zdalnego debugowania.
2. Włącz zdalne debugowanie.
3. Pozostaw przeglądarkę uruchomioną i zatwierdź monit połączenia, gdy OpenClaw dołącza.

Typowe strony inspekcji:

- Chrome: `chrome://inspect/#remote-debugging`
- Brave: `brave://inspect/#remote-debugging`
- Edge: `edge://inspect/#remote-debugging`

Test dymny dołączania na żywo:

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
- `snapshot` zwraca referencje z wybranej karty na żywo

Co sprawdzić, jeśli dołączenie nie działa:

- docelowa przeglądarka oparta na Chromium ma wersję `144+`
- zdalne debugowanie jest włączone na stronie inspekcji tej przeglądarki
- przeglądarka wyświetliła monit zgody na dołączenie i został on zaakceptowany
- `openclaw doctor` migruje starą konfigurację przeglądarki opartą na rozszerzeniu i sprawdza, czy
  Chrome jest zainstalowany lokalnie dla domyślnych profili automatycznego łączenia, ale nie może
  włączyć za Ciebie zdalnego debugowania po stronie przeglądarki

Użycie przez agenta:

- Użyj `profile="user"`, gdy potrzebujesz stanu zalogowanej przeglądarki użytkownika.
- Jeśli używasz niestandardowego profilu istniejącej sesji, przekaż tę jawną nazwę profilu.
- Wybieraj ten tryb tylko wtedy, gdy użytkownik jest przy komputerze, aby zatwierdzić monit
  dołączenia.
- Gateway lub host węzła może uruchomić `npx chrome-devtools-mcp@latest --autoConnect`

Uwagi:

- Ta ścieżka ma wyższe ryzyko niż izolowany profil `openclaw`, ponieważ może działać
  w Twojej zalogowanej sesji przeglądarki.
- OpenClaw nie uruchamia przeglądarki dla tego sterownika; tylko się do niej dołącza.
- OpenClaw używa tutaj oficjalnego przepływu Chrome DevTools MCP `--autoConnect`. Jeśli
  ustawiono `userDataDir`, jest on przekazywany dalej, aby wskazać ten katalog danych użytkownika.
- Istniejąca sesja może dołączyć na wybranym hoście albo przez połączony
  węzeł przeglądarki. Jeśli Chrome znajduje się gdzie indziej i żaden węzeł przeglądarki nie jest połączony, użyj
  zdalnego CDP albo hosta węzła.

### Niestandardowe uruchomienie Chrome MCP

Nadpisz uruchamiany serwer Chrome DevTools MCP dla profilu, gdy domyślny
przepływ `npx chrome-devtools-mcp@latest` nie jest tym, czego potrzebujesz (hosty offline,
przypięte wersje, dostarczane lokalnie pliki binarne):

| Pole         | Co robi                                                                                                                    |
| ------------ | -------------------------------------------------------------------------------------------------------------------------- |
| `mcpCommand` | Plik wykonywalny uruchamiany zamiast `npx`. Rozwiązywany bez zmian; ścieżki bezwzględne są respektowane.                 |
| `mcpArgs`    | Tablica argumentów przekazywana dosłownie do `mcpCommand`. Zastępuje domyślne argumenty `chrome-devtools-mcp@latest --autoConnect`. |

Gdy `cdpUrl` jest ustawiony w profilu istniejącej sesji, OpenClaw pomija
`--autoConnect` i automatycznie przekazuje punkt końcowy do Chrome MCP:

- `http(s)://...` → `--browserUrl <url>` (punkt końcowy wykrywania HTTP DevTools).
- `ws(s)://...` → `--wsEndpoint <url>` (bezpośredni WebSocket CDP).

Flag punktów końcowych i `userDataDir` nie można łączyć: gdy `cdpUrl` jest ustawiony,
`userDataDir` jest ignorowany przy uruchamianiu Chrome MCP, ponieważ Chrome MCP dołącza do
działającej przeglądarki za punktem końcowym, zamiast otwierać katalog
profilu.

<Accordion title="Ograniczenia funkcji istniejącej sesji">

W porównaniu z zarządzanym profilem `openclaw` sterowniki istniejącej sesji mają więcej ograniczeń:

- **Zrzuty ekranu** - przechwytywanie strony i przechwytywanie elementów `--ref` działa; selektory CSS `--element` nie działają. `--full-page` nie może być łączone z `--ref` ani `--element`. Playwright nie jest wymagany do zrzutów ekranu strony ani elementów opartych na referencjach.
- **Akcje** - `click`, `type`, `hover`, `scrollIntoView`, `drag` i `select` wymagają referencji snapshotu (bez selektorów CSS). `click-coords` klika widoczne współrzędne viewportu i nie wymaga referencji snapshotu. `click` obsługuje tylko lewy przycisk. `type` nie obsługuje `slowly=true`; użyj `fill` albo `press`. `press` nie obsługuje `delayMs`. `type`, `hover`, `scrollIntoView`, `drag`, `select`, `fill` i `evaluate` nie obsługują limitów czasu dla pojedynczych wywołań. `select` akceptuje jedną wartość.
- **Oczekiwanie / przesyłanie / dialog** - `wait --url` obsługuje wzorce dokładne, podciągi i glob; `wait --load networkidle` nie jest obsługiwane. Hooki przesyłania wymagają `ref` albo `inputRef`, po jednym pliku naraz, bez CSS `element`. Hooki dialogów nie obsługują nadpisywania limitu czasu.
- **Funkcje tylko zarządzane** - akcje wsadowe, eksport PDF, przechwytywanie pobierania i `responsebody` nadal wymagają ścieżki zarządzanej przeglądarki.

</Accordion>

## Gwarancje izolacji

- **Dedykowany katalog danych użytkownika**: nigdy nie dotyka Twojego osobistego profilu przeglądarki.
- **Dedykowane porty**: unika `9222`, aby zapobiec kolizjom z przepływami pracy deweloperskiej.
- **Deterministyczne sterowanie kartami**: `tabs` zwraca najpierw `suggestedTargetId`, a następnie
  stabilne uchwyty `tabId`, takie jak `t1`, opcjonalne etykiety oraz surowy `targetId`.
  Agenci powinni ponownie używać `suggestedTargetId`; surowe identyfikatory pozostają dostępne do
  debugowania i kompatybilności.

## Wybór przeglądarki

Przy uruchamianiu lokalnym OpenClaw wybiera pierwszą dostępną:

1. Chrome
2. Brave
3. Edge
4. Chromium
5. Chrome Canary

Możesz nadpisać to za pomocą `browser.executablePath`.

Platformy:

- macOS: sprawdza `/Applications` i `~/Applications`.
- Linux: sprawdza typowe lokalizacje Chrome/Brave/Edge/Chromium pod `/usr/bin`,
  `/snap/bin`, `/opt/google`, `/opt/brave.com`, `/usr/lib/chromium` oraz
  `/usr/lib/chromium-browser`, a także Chromium zarządzane przez Playwright pod
  `PLAYWRIGHT_BROWSERS_PATH` albo `~/.cache/ms-playwright`.
- Windows: sprawdza typowe lokalizacje instalacji.

## API sterowania (opcjonalne)

Do skryptów i debugowania Gateway udostępnia małe **HTTP API sterowania dostępne tylko przez loopback**
oraz odpowiadające mu CLI `openclaw browser` (snapshoty, referencje, rozszerzenia oczekiwania,
wyjście JSON, przepływy debugowania). Pełną dokumentację znajdziesz w
[API sterowania przeglądarką](/pl/tools/browser-control).

## Rozwiązywanie problemów

Problemy specyficzne dla Linuksa (zwłaszcza snap Chromium) opisuje
[Rozwiązywanie problemów z przeglądarką](/pl/tools/browser-linux-troubleshooting).

Konfiguracje WSL2 Gateway + Windows Chrome na rozdzielonych hostach opisuje
[Rozwiązywanie problemów z WSL2 + Windows + zdalnym Chrome CDP](/pl/tools/browser-wsl2-windows-remote-cdp-troubleshooting).

### Niepowodzenie uruchomienia CDP a blokada SSRF nawigacji

To różne klasy niepowodzeń i wskazują na różne ścieżki kodu.

- **Niepowodzenie uruchomienia lub gotowości CDP** oznacza, że OpenClaw nie może potwierdzić, że płaszczyzna sterowania przeglądarką jest sprawna.
- **Blokada SSRF nawigacji** oznacza, że płaszczyzna sterowania przeglądarką jest sprawna, ale cel nawigacji strony zostaje odrzucony przez politykę.

Typowe przykłady:

- Niepowodzenie uruchomienia lub gotowości CDP:
  - `Chrome CDP websocket for profile "openclaw" is not reachable after start`
  - `Remote CDP for profile "<name>" is not reachable at <cdpUrl>`
  - `Port <port> is in use for profile "<name>" but not by openclaw`, gdy
    skonfigurowano zewnętrzną usługę CDP loopback bez `attachOnly: true`
- Blokada SSRF nawigacji:
  - przepływy `open`, `navigate`, snapshotu albo otwierania kart kończą się niepowodzeniem z błędem polityki przeglądarki/sieci, mimo że `start` i `tabs` nadal działają

Użyj tej minimalnej sekwencji, aby rozdzielić te dwa przypadki:

```bash
openclaw browser --browser-profile openclaw start
openclaw browser --browser-profile openclaw tabs
openclaw browser --browser-profile openclaw open https://example.com
```

Jak czytać wyniki:

- Jeśli `start` kończy się niepowodzeniem z `not reachable after start`, najpierw rozwiąż problem gotowości CDP.
- Jeśli `start` się powiedzie, ale `tabs` zawiedzie, płaszczyzna sterowania nadal jest niesprawna. Traktuj to jako problem osiągalności CDP, a nie problem nawigacji strony.
- Jeśli `start` i `tabs` się powiedzą, ale `open` albo `navigate` zawiedzie, płaszczyzna sterowania przeglądarką działa, a niepowodzenie dotyczy polityki nawigacji albo strony docelowej.
- Jeśli `start`, `tabs` i `open` się powiodą, podstawowa ścieżka sterowania zarządzaną przeglądarką jest sprawna.

Ważne szczegóły zachowania:

- Konfiguracja przeglądarki domyślnie używa obiektu polityki SSRF typu fail-closed, nawet gdy nie konfigurujesz `browser.ssrfPolicy`.
- Dla lokalnego profilu zarządzanego `openclaw` w local loopback kontrole kondycji CDP celowo pomijają wymuszanie osiągalności SSRF przeglądarki dla własnej lokalnej płaszczyzny sterowania OpenClaw.
- Ochrona nawigacji jest oddzielna. Pomyślny wynik `start` albo `tabs` nie oznacza, że późniejszy cel `open` albo `navigate` jest dozwolony.

Wskazówki bezpieczeństwa:

- **Nie** rozluźniaj domyślnie zasad SSRF przeglądarki.
- Preferuj wąskie wyjątki dla hostów, takie jak `hostnameAllowlist` lub `allowedHostnames`, zamiast szerokiego dostępu do sieci prywatnej.
- Używaj `dangerouslyAllowPrivateNetwork: true` tylko w celowo zaufanych środowiskach, w których dostęp przeglądarki do sieci prywatnej jest wymagany i sprawdzony.

## Narzędzia agenta + jak działa sterowanie

Agent otrzymuje **jedno narzędzie** do automatyzacji przeglądarki:

- `browser` - doctor/status/start/stop/tabs/open/focus/close/snapshot/screenshot/navigate/act

Jak to się mapuje:

- `browser snapshot` zwraca stabilne drzewo interfejsu użytkownika (AI lub ARIA).
- `browser act` używa identyfikatorów `ref` ze zrzutu, aby klikać/pisać/przeciągać/wybierać.
- `browser screenshot` przechwytuje piksele (całą stronę, element lub oznaczone etykietami refs).
- `browser doctor` sprawdza gotowość Gateway, pluginu, profilu, przeglądarki i karty.
- `browser` akceptuje:
  - `profile`, aby wybrać nazwany profil przeglądarki (openclaw, chrome lub zdalny CDP).
  - `target` (`sandbox` | `host` | `node`), aby wybrać, gdzie znajduje się przeglądarka.
  - W sesjach sandboxowych `target: "host"` wymaga `agents.defaults.sandbox.browser.allowHostControl=true`.
  - Jeśli `target` zostanie pominięte: sesje sandboxowe domyślnie używają `sandbox`, a sesje bez sandboxa domyślnie używają `host`.
  - Jeśli podłączony jest węzeł obsługujący przeglądarkę, narzędzie może automatycznie kierować do niego, chyba że przypniesz `target="host"` lub `target="node"`.

Dzięki temu agent pozostaje deterministyczny i unika kruchych selektorów.

## Powiązane

- [Omówienie narzędzi](/pl/tools) - wszystkie dostępne narzędzia agenta
- [Sandboxing](/pl/gateway/sandboxing) - sterowanie przeglądarką w środowiskach sandboxowych
- [Bezpieczeństwo](/pl/gateway/security) - ryzyka sterowania przeglądarką i wzmacnianie zabezpieczeń
