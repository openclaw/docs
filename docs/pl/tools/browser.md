---
read_when:
    - Dodawanie automatyzacji przeglądarki sterowanej przez agenta
    - Debugowanie, dlaczego OpenClaw zakłóca działanie Twojej własnej przeglądarki Chrome
    - Implementowanie ustawień przeglądarki + cyklu życia w aplikacji macOS
summary: Zintegrowana usługa sterowania przeglądarką + polecenia akcji
title: Przeglądarka (zarządzana przez OpenClaw)
x-i18n:
    generated_at: "2026-05-06T18:00:42Z"
    model: gpt-5.5
    provider: openai
    source_hash: 1c9f79b4f8b9921724130b4793584facf1bfbe2de5fb21faa54274a4294dedd0
    source_path: tools/browser.md
    workflow: 16
---

OpenClaw może uruchamiać **dedykowany profil Chrome/Brave/Edge/Chromium**, którym steruje agent.
Jest odizolowany od Twojej osobistej przeglądarki i zarządzany przez małą lokalną
usługę sterowania w Gateway (tylko loopback).

Widok dla początkujących:

- Traktuj go jako **oddzielną przeglądarkę tylko dla agenta**.
- Profil `openclaw` **nie** dotyka Twojego osobistego profilu przeglądarki.
- Agent może **otwierać karty, czytać strony, klikać i pisać** w bezpiecznym torze.
- Wbudowany profil `user` podłącza się do Twojej prawdziwej, zalogowanej sesji Chrome przez Chrome MCP.

## Co otrzymujesz

- Oddzielny profil przeglądarki o nazwie **openclaw** (domyślnie z pomarańczowym akcentem).
- Deterministyczne sterowanie kartami (lista/otwórz/ustaw fokus/zamknij).
- Akcje agenta (kliknięcie/pisanie/przeciąganie/wybór), migawki, zrzuty ekranu, pliki PDF.
- Dołączony skill `browser-automation`, który uczy agentów pętli odzyskiwania
  dla migawek, stabilnych kart, nieaktualnych odwołań i ręcznych blokad, gdy
  Plugin przeglądarki jest włączony.
- Opcjonalna obsługa wielu profili (`openclaw`, `work`, `remote`, ...).

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

Jeśli pojawi się komunikat „Browser disabled”, włącz przeglądarkę w konfiguracji (patrz niżej) i zrestartuj
Gateway.

Jeśli `openclaw browser` całkowicie brakuje albo agent informuje, że narzędzie przeglądarki
jest niedostępne, przejdź do [Brak polecenia lub narzędzia przeglądarki](/pl/tools/browser#missing-browser-command-or-tool).

## Sterowanie Plugin

Domyślne narzędzie `browser` jest dołączonym Plugin. Wyłącz je, aby zastąpić je innym Plugin, który rejestruje tę samą nazwę narzędzia `browser`:

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

Domyślne ustawienia wymagają zarówno `plugins.entries.browser.enabled`, **jak i** `browser.enabled=true`. Wyłączenie samego Plugin usuwa CLI `openclaw browser`, metodę Gateway `browser.request`, narzędzie agenta i usługę sterowania jako jedną całość; Twoja konfiguracja `browser.*` pozostaje nienaruszona dla zamiennika.

Zmiany konfiguracji przeglądarki wymagają restartu Gateway, aby Plugin mógł ponownie zarejestrować swoją usługę.

## Wskazówki dla agenta

Uwaga dotycząca profilu narzędzi: `tools.profile: "coding"` obejmuje `web_search` i
`web_fetch`, ale nie obejmuje pełnego narzędzia `browser`. Jeśli agent lub
utworzony subagent ma używać automatyzacji przeglądarki, dodaj przeglądarkę na etapie
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
Samo `tools.subagents.tools.allow: ["browser"]` nie wystarcza, ponieważ polityka subagentów
jest stosowana po filtrowaniu profilu.

Plugin przeglądarki dostarcza dwa poziomy wskazówek dla agenta:

- Opis narzędzia `browser` zawiera zwięzły, zawsze aktywny kontrakt: wybierz
  właściwy profil, utrzymuj odwołania na tej samej karcie, używaj `tabId`/etykiet do
  kierowania na karty i załaduj skill przeglądarki do pracy wieloetapowej.
- Dołączony skill `browser-automation` zawiera dłuższą pętlę operacyjną:
  najpierw sprawdź status/karty, oznacz karty zadania etykietami, wykonaj migawkę przed działaniem, ponownie wykonaj migawkę
  po zmianach UI, raz odzyskaj nieaktualne odwołania i zgłoś logowanie/2FA/captcha lub
  blokady kamery/mikrofonu jako ręczne działanie zamiast zgadywać.

Skills dołączone przez Plugin są wyświetlane na liście dostępnych Skills agenta, gdy
Plugin jest włączony. Pełne instrukcje skill są ładowane na żądanie, więc rutynowe
tury nie ponoszą pełnego kosztu tokenów.

## Brak polecenia lub narzędzia przeglądarki

Jeśli `openclaw browser` jest nieznane po aktualizacji, brakuje `browser.request` albo agent zgłasza narzędzie przeglądarki jako niedostępne, zwykle przyczyną jest lista `plugins.allow`, która pomija `browser`, oraz brak głównego bloku konfiguracji `browser`. Dodaj go:

```json5
{
  plugins: {
    allow: ["telegram", "browser"],
  },
}
```

Jawny główny blok `browser`, na przykład `browser.enabled=true` lub `browser.profiles.<name>`, aktywuje dołączony Plugin przeglądarki nawet przy restrykcyjnym `plugins.allow`, zgodnie z zachowaniem konfiguracji kanałów. `plugins.entries.browser.enabled=true` i `tools.alsoAllow: ["browser"]` same w sobie nie zastępują członkostwa na liście dozwolonych. Całkowite usunięcie `plugins.allow` również przywraca ustawienie domyślne.

## Profile: `openclaw` kontra `user`

- `openclaw`: zarządzana, odizolowana przeglądarka (bez wymagania rozszerzenia).
- `user`: wbudowany profil podłączenia Chrome MCP do Twojej **prawdziwej, zalogowanej sesji Chrome**.

Dla wywołań narzędzia przeglądarki przez agenta:

- Domyślnie: używaj odizolowanej przeglądarki `openclaw`.
- Preferuj `profile="user"`, gdy znaczenie mają istniejące zalogowane sesje, a użytkownik
  jest przy komputerze, aby kliknąć/zatwierdzić ewentualny monit o podłączenie.
- `profile` jest jawnym nadpisaniem, gdy chcesz określonego trybu przeglądarki.

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

- Usługa sterowania wiąże się z loopback na porcie wyprowadzonym z `gateway.port` (domyślnie `18791` = Gateway + 2). Nadpisanie `gateway.port` lub `OPENCLAW_GATEWAY_PORT` przesuwa wyprowadzone porty w tej samej rodzinie.
- Lokalne profile `openclaw` automatycznie przypisują `cdpPort`/`cdpUrl`; ustawiaj je tylko dla zdalnego CDP. `cdpUrl` domyślnie wskazuje zarządzany lokalny port CDP, gdy nie jest ustawiony.
- `remoteCdpTimeoutMs` ma zastosowanie do zdalnych i `attachOnly` kontroli osiągalności CDP HTTP
  oraz żądań HTTP otwierających karty; `remoteCdpHandshakeTimeoutMs` ma zastosowanie do
  ich uzgadniania CDP WebSocket.
- `localLaunchTimeoutMs` to budżet czasu na udostępnienie punktu końcowego CDP HTTP przez lokalnie uruchomiony zarządzany proces Chrome. `localCdpReadyTimeoutMs` to
  kolejny budżet na gotowość websocket CDP po wykryciu procesu.
  Zwiększ te wartości na Raspberry Pi, słabym VPS lub starszym sprzęcie, gdzie Chromium
  uruchamia się wolno. Wartości muszą być dodatnimi liczbami całkowitymi do `120000` ms; nieprawidłowe
  wartości konfiguracji są odrzucane.
- Powtarzające się błędy uruchamiania/gotowości zarządzanego Chrome są przerywane przez circuit breaker dla każdego
  profilu. Po kilku kolejnych błędach OpenClaw na krótko wstrzymuje nowe próby
  uruchomienia zamiast uruchamiać Chromium przy każdym wywołaniu narzędzia przeglądarki. Napraw
  problem startowy, wyłącz przeglądarkę, jeśli nie jest potrzebna, albo zrestartuj
  Gateway po naprawie.
- `actionTimeoutMs` to domyślny budżet dla żądań `act` przeglądarki, gdy wywołujący nie przekazuje `timeoutMs`. Transport klienta dodaje małe okno zapasu, aby długie oczekiwania mogły się zakończyć zamiast przekroczyć limit czasu na granicy HTTP.
- `tabCleanup` to best-effort czyszczenie kart otwartych przez sesje przeglądarki głównego agenta. Czyszczenie cyklu życia subagentów, Cron i ACP nadal zamyka ich jawnie śledzone karty na końcu sesji; sesje główne utrzymują aktywne karty do ponownego użycia, a potem zamykają bezczynne lub nadmiarowe śledzone karty w tle.

</Accordion>

<Accordion title="Polityka SSRF">

- Nawigacja przeglądarki i otwieranie kart są chronione przed SSRF przed nawigacją oraz w miarę możliwości ponownie sprawdzane na końcowym adresie URL `http(s)` po niej.
- W ścisłym trybie SSRF sprawdzane są również wykrywanie zdalnego punktu końcowego CDP i sondy `/json/version` (`cdpUrl`).
- Zmienne środowiskowe Gateway/dostawcy `HTTP_PROXY`, `HTTPS_PROXY`, `ALL_PROXY` i `NO_PROXY` nie przekierowują automatycznie zarządzanej przez OpenClaw przeglądarki przez proxy. Zarządzany Chrome domyślnie uruchamia się bezpośrednio, aby ustawienia proxy dostawcy nie osłabiały kontroli SSRF przeglądarki.
- Aby przekierować samą zarządzaną przeglądarkę przez proxy, przekaż jawne flagi proxy Chrome przez `browser.extraArgs`, takie jak `--proxy-server=...` lub `--proxy-pac-url=...`. Ścisły tryb SSRF blokuje jawne routowanie proxy przeglądarki, chyba że dostęp przeglądarki do sieci prywatnej został celowo włączony.
- `browser.ssrfPolicy.dangerouslyAllowPrivateNetwork` jest domyślnie wyłączone; włączaj tylko wtedy, gdy dostęp przeglądarki do sieci prywatnej jest celowo zaufany.
- `browser.ssrfPolicy.allowPrivateNetwork` pozostaje obsługiwane jako starszy alias.

</Accordion>

<Accordion title="Zachowanie profilu">

- `attachOnly: true` oznacza, że lokalna przeglądarka nigdy nie zostanie uruchomiona; nastąpi tylko dołączenie, jeśli jest już uruchomiona.
- `headless` można ustawić globalnie albo dla lokalnego profilu zarządzanego. Wartości per profil zastępują `browser.headless`, więc jeden lokalnie uruchamiany profil może pozostać bezgłowy, podczas gdy inny pozostaje widoczny.
- `POST /start?headless=true` i `openclaw browser start --headless` żądają
  jednorazowego uruchomienia bezgłowego dla lokalnych profili zarządzanych bez przepisywania
  `browser.headless` ani konfiguracji profilu. Profile existing-session, attach-only i
  zdalne profile CDP odrzucają nadpisanie, ponieważ OpenClaw nie uruchamia tych
  procesów przeglądarki.
- Na hostach Linux bez `DISPLAY` ani `WAYLAND_DISPLAY` lokalne profile zarządzane
  domyślnie automatycznie przechodzą w tryb bezgłowy, gdy ani środowisko, ani konfiguracja profilu/globalna
  nie wybiera jawnie trybu z interfejsem. `openclaw browser status --json`
  raportuje `headlessSource` jako `env`, `profile`, `config`,
  `request`, `linux-display-fallback` albo `default`.
- `OPENCLAW_BROWSER_HEADLESS=1` wymusza bezgłowe uruchomienia lokalnie zarządzane dla
  bieżącego procesu. `OPENCLAW_BROWSER_HEADLESS=0` wymusza tryb z interfejsem dla zwykłych
  uruchomień i zwraca możliwy do wykonania błąd na hostach Linux bez serwera wyświetlania;
  jawne żądanie `start --headless` nadal wygrywa dla tego jednego uruchomienia.
- `executablePath` można ustawić globalnie albo dla lokalnego profilu zarządzanego. Wartości per profil zastępują `browser.executablePath`, więc różne profile zarządzane mogą uruchamiać różne przeglądarki oparte na Chromium. Obie formy akceptują `~` jako katalog domowy Twojego systemu operacyjnego.
- `color` (najwyższego poziomu i per profil) zabarwia interfejs przeglądarki, aby było widać, który profil jest aktywny.
- Domyślny profil to `openclaw` (zarządzany samodzielny). Użyj `defaultProfile: "user"`, aby wybrać zalogowaną przeglądarkę użytkownika.
- Kolejność autodetekcji: domyślna przeglądarka systemowa, jeśli jest oparta na Chromium; w przeciwnym razie Chrome → Brave → Edge → Chromium → Chrome Canary.
- `driver: "existing-session"` używa Chrome DevTools MCP zamiast surowego CDP. Nie ustawiaj `cdpUrl` dla tego sterownika.
- Ustaw `browser.profiles.<name>.userDataDir`, gdy profil existing-session powinien dołączać do niedomyślnego profilu użytkownika Chromium (Brave, Edge itd.). Ta ścieżka również akceptuje `~` jako katalog domowy Twojego systemu operacyjnego.

</Accordion>

</AccordionGroup>

## Użyj Brave albo innej przeglądarki opartej na Chromium

Jeśli Twoja **domyślna przeglądarka systemowa** jest oparta na Chromium (Chrome/Brave/Edge/itd),
OpenClaw użyje jej automatycznie. Ustaw `browser.executablePath`, aby zastąpić
autodetekcję. Wartości `executablePath` najwyższego poziomu i per profil akceptują `~`
jako katalog domowy Twojego systemu operacyjnego:

```bash
openclaw config set browser.executablePath "/usr/bin/google-chrome"
openclaw config set browser.profiles.work.executablePath "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome"
```

Albo ustaw to w konfiguracji, per platforma:

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

`executablePath` per profil wpływa tylko na lokalne profile zarządzane, które OpenClaw
uruchamia. Profile `existing-session` zamiast tego dołączają do już uruchomionej przeglądarki,
a zdalne profile CDP używają przeglądarki za `cdpUrl`.

## Sterowanie lokalne a zdalne

- **Sterowanie lokalne (domyślne):** Gateway uruchamia usługę sterowania loopback i może uruchomić lokalną przeglądarkę.
- **Sterowanie zdalne (host Node):** uruchom host Node na maszynie, która ma przeglądarkę; Gateway przekazuje do niego akcje przeglądarki.
- **Zdalne CDP:** ustaw `browser.profiles.<name>.cdpUrl` (albo `browser.cdpUrl`), aby
  dołączyć do zdalnej przeglądarki opartej na Chromium. W tym przypadku OpenClaw nie uruchomi lokalnej przeglądarki.
- Dla zewnętrznie zarządzanych usług CDP na loopback (na przykład Browserless w
  Docker opublikowanym do `127.0.0.1`) ustaw także `attachOnly: true`. CDP na loopback
  bez `attachOnly` jest traktowane jako lokalny profil przeglądarki zarządzany przez OpenClaw.
- `headless` wpływa tylko na lokalne profile zarządzane, które OpenClaw uruchamia. Nie restartuje ani nie zmienia przeglądarek existing-session lub zdalnych CDP.
- `executablePath` podlega tej samej regule lokalnego profilu zarządzanego. Zmiana go w
  działającym lokalnym profilu zarządzanym oznacza ten profil do restartu/uzgodnienia, aby
  następne uruchomienie użyło nowego pliku binarnego.

Zachowanie zatrzymywania różni się zależnie od trybu profilu:

- lokalne profile zarządzane: `openclaw browser stop` zatrzymuje proces przeglądarki, który
  OpenClaw uruchomił
- profile attach-only i zdalne CDP: `openclaw browser stop` zamyka aktywną
  sesję sterowania i zwalnia nadpisania emulacji Playwright/CDP (viewport,
  schemat kolorów, ustawienia regionalne, strefę czasową, tryb offline i podobny stan), mimo
  że OpenClaw nie uruchomił żadnego procesu przeglądarki

Zdalne adresy URL CDP mogą zawierać uwierzytelnianie:

- Tokeny zapytania (np. `https://provider.example?token=<token>`)
- Uwierzytelnianie HTTP Basic (np. `https://user:pass@provider.example`)

OpenClaw zachowuje uwierzytelnianie podczas wywoływania endpointów `/json/*` i podczas łączenia
z WebSocket CDP. Preferuj zmienne środowiskowe albo menedżery sekretów dla
tokenów zamiast zatwierdzania ich w plikach konfiguracji.

## Proxy przeglądarki Node (domyślnie bez konfiguracji)

Jeśli uruchomisz **host Node** na maszynie, która ma Twoją przeglądarkę, OpenClaw może
automatycznie kierować wywołania narzędzi przeglądarki do tego Node bez żadnej dodatkowej konfiguracji przeglądarki.
To jest domyślna ścieżka dla zdalnych Gateway.

Uwagi:

- Host Node udostępnia swój lokalny serwer sterowania przeglądarką przez **polecenie proxy**.
- Profile pochodzą z własnej konfiguracji `browser.profiles` Node (tak samo jak lokalnie).
- `nodeHost.browserProxy.allowProfiles` jest opcjonalne. Pozostaw to puste dla starszego/domyślnego zachowania: wszystkie skonfigurowane profile pozostają osiągalne przez proxy, w tym trasy tworzenia/usuwania profili.
- Jeśli ustawisz `nodeHost.browserProxy.allowProfiles`, OpenClaw traktuje to jako granicę najmniejszych uprawnień: celem mogą być tylko profile z listy dozwolonych, a trwałe trasy tworzenia/usuwania profili są blokowane na powierzchni proxy.
- Wyłącz, jeśli tego nie chcesz:
  - Na Node: `nodeHost.browserProxy.enabled=false`
  - Na Gateway: `gateway.nodes.browser.mode="off"`

## Browserless (hostowane zdalne CDP)

[Browserless](https://browserless.io) to hostowana usługa Chromium, która udostępnia
adresy URL połączenia CDP przez HTTPS i WebSocket. OpenClaw może używać obu form, ale
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
- Wybierz endpoint regionu pasujący do Twojego konta Browserless (zobacz ich dokumentację).
- Jeśli Browserless poda Ci bazowy adres URL HTTPS, możesz albo przekonwertować go na
  `wss://` dla bezpośredniego połączenia CDP, albo zachować adres URL HTTPS i pozwolić OpenClaw
  wykryć `/json/version`.

### Browserless Docker na tym samym hoście

Gdy Browserless jest hostowany samodzielnie w Docker, a OpenClaw działa na hoście, traktuj
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
OpenClaw. Browserless musi także ogłaszać pasujący osiągalny endpoint;
ustaw `EXTERNAL` Browserless na tę samą bazę WebSocket publiczną dla OpenClaw, taką
jak `ws://127.0.0.1:3000`, `ws://browserless:3000` albo stabilny prywatny adres sieci
Docker. Jeśli `/json/version` zwraca `webSocketDebuggerUrl` wskazujący na
adres, którego OpenClaw nie może osiągnąć, HTTP CDP może wyglądać na sprawne, podczas gdy dołączenie
WebSocket nadal się nie powiedzie.

Nie pozostawiaj `attachOnly` nieustawionego dla profilu Browserless na loopback. Bez
`attachOnly` OpenClaw traktuje port loopback jako lokalny zarządzany profil przeglądarki
i może zgłaszać, że port jest używany, ale nie należy do OpenClaw.

## Bezpośredni dostawcy CDP WebSocket

Niektóre hostowane usługi przeglądarek udostępniają **bezpośredni endpoint WebSocket** zamiast
standardowego wykrywania CDP opartego na HTTP (`/json/version`). OpenClaw akceptuje trzy
kształty adresów URL CDP i automatycznie wybiera właściwą strategię połączenia:

- **Wykrywanie HTTP(S)** - `http://host[:port]` albo `https://host[:port]`.
  OpenClaw wywołuje `/json/version`, aby wykryć adres URL debuggera WebSocket, a następnie
  się łączy. Brak awaryjnego przejścia na WebSocket.
- **Bezpośrednie endpointy WebSocket** - `ws://host[:port]/devtools/<kind>/<id>` albo
  `wss://...` ze ścieżką `/devtools/browser|page|worker|shared_worker|service_worker/<id>`.
  OpenClaw łączy się bezpośrednio przez uzgadnianie WebSocket i całkowicie pomija
  `/json/version`.
- **Surowe korzenie WebSocket** - `ws://host[:port]` albo `wss://host[:port]` bez
  ścieżki `/devtools/...` (np. [Browserless](https://browserless.io),
  [Browserbase](https://www.browserbase.com)). OpenClaw najpierw próbuje wykrywania HTTP
  `/json/version` (normalizując schemat do `http`/`https`);
  jeśli wykrywanie zwróci `webSocketDebuggerUrl`, zostanie on użyty, w przeciwnym razie OpenClaw
  przechodzi awaryjnie do bezpośredniego uzgadniania WebSocket w surowym korzeniu. Jeśli ogłaszany
  endpoint WebSocket odrzuci uzgadnianie CDP, ale skonfigurowany surowy korzeń
  je zaakceptuje, OpenClaw również przechodzi awaryjnie do tego korzenia. Dzięki temu surowy `ws://`
  wskazujący na lokalny Chrome nadal może się połączyć, ponieważ Chrome akceptuje aktualizacje WebSocket
  tylko na konkretnej ścieżce per cel z `/json/version`, podczas gdy hostowani
  dostawcy nadal mogą używać swojego korzenia WebSocket, gdy ich endpoint wykrywania
  ogłasza krótkotrwały adres URL, który nie nadaje się do Playwright CDP.

### Browserbase

[Browserbase](https://www.browserbase.com) to platforma chmurowa do uruchamiania
bezgłowych przeglądarek z wbudowanym rozwiązywaniem CAPTCHA, trybem stealth i rezydencjalnymi
proxy.

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
- Zastąp `<BROWSERBASE_API_KEY>` swoim rzeczywistym kluczem API Browserbase.
- Browserbase automatycznie tworzy sesję przeglądarki przy połączeniu WebSocket, więc
  nie jest potrzebny ręczny krok tworzenia sesji.
- Warstwa bezpłatna pozwala na jedną równoczesną sesję i jedną godzinę przeglądarki miesięcznie.
  Zobacz [cennik](https://www.browserbase.com/pricing), aby poznać limity płatnych planów.
- Zobacz [dokumentację Browserbase](https://docs.browserbase.com), aby uzyskać pełną dokumentację API,
  przewodniki SDK i przykłady integracji.

## Bezpieczeństwo

Kluczowe idee:

- Sterowanie przeglądarką jest dostępne tylko przez local loopback; dostęp odbywa się przez uwierzytelnianie Gateway lub parowanie Node.
- Samodzielne HTTP API przeglądarki local loopback używa **wyłącznie uwierzytelniania współdzielonym sekretem**:
  uwierzytelniania bearer tokenem Gateway, `x-openclaw-password` albo HTTP Basic auth ze
  skonfigurowanym hasłem Gateway.
- Nagłówki tożsamości Tailscale Serve i `gateway.auth.mode: "trusted-proxy"` **nie**
  uwierzytelniają tego samodzielnego API przeglądarki local loopback.
- Jeśli sterowanie przeglądarką jest włączone, a uwierzytelnianie współdzielonym sekretem nie jest skonfigurowane, OpenClaw
  generuje token Gateway tylko na czas działania dla tego uruchomienia. Skonfiguruj
  `gateway.auth.token`, `gateway.auth.password`, `OPENCLAW_GATEWAY_TOKEN` albo
  `OPENCLAW_GATEWAY_PASSWORD` jawnie, jeśli klienci potrzebują stabilnego sekretu między
  restartami.
- OpenClaw **nie** generuje automatycznie tego tokena, gdy `gateway.auth.mode` ma już wartość
  `password`, `none` albo `trusted-proxy`.
- Trzymaj Gateway i wszystkie hosty Node w sieci prywatnej (Tailscale); unikaj publicznego wystawiania.
- Traktuj zdalne adresy URL/tokeny CDP jako sekrety; preferuj zmienne środowiskowe lub menedżera sekretów.

Wskazówki dotyczące zdalnego CDP:

- Gdy to możliwe, preferuj szyfrowane punkty końcowe (HTTPS lub WSS) i krótkotrwałe tokeny.
- Unikaj osadzania długotrwałych tokenów bezpośrednio w plikach konfiguracyjnych.

## Profile (wiele przeglądarek)

OpenClaw obsługuje wiele nazwanych profili (konfiguracji routingu). Profile mogą być:

- **openclaw-managed**: dedykowana instancja przeglądarki opartej na Chromium z własnym katalogiem danych użytkownika + portem CDP
- **zdalne**: jawny adres URL CDP (przeglądarka oparta na Chromium działająca gdzie indziej)
- **istniejąca sesja**: istniejący profil Chrome przez automatyczne połączenie Chrome DevTools MCP

Wartości domyślne:

- Profil `openclaw` jest tworzony automatycznie, jeśli go brakuje.
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

- [Chrome for Developers: Używanie Chrome DevTools MCP z sesją przeglądarki](https://developer.chrome.com/blog/chrome-devtools-mcp-debug-your-browser-session)
- [Chrome DevTools MCP README](https://github.com/ChromeDevTools/chrome-devtools-mcp)

Wbudowany profil:

- `user`

Opcjonalnie: utwórz własny niestandardowy profil istniejącej sesji, jeśli chcesz użyć
innej nazwy, koloru lub katalogu danych przeglądarki.

Domyślne zachowanie:

- Wbudowany profil `user` używa automatycznego połączenia Chrome MCP, które kieruje na
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

Następnie w pasującej przeglądarce:

1. Otwórz stronę inspekcji tej przeglądarki dla zdalnego debugowania.
2. Włącz zdalne debugowanie.
3. Pozostaw przeglądarkę uruchomioną i zatwierdź monit połączenia, gdy OpenClaw się dołącza.

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

Jak wygląda powodzenie:

- `status` pokazuje `driver: existing-session`
- `status` pokazuje `transport: chrome-mcp`
- `status` pokazuje `running: true`
- `tabs` wyświetla już otwarte karty przeglądarki
- `snapshot` zwraca referencje z wybranej aktywnej karty

Co sprawdzić, jeśli dołączanie nie działa:

- docelowa przeglądarka oparta na Chromium ma wersję `144+`
- zdalne debugowanie jest włączone na stronie inspekcji tej przeglądarki
- przeglądarka pokazała monit zgody na dołączenie i został on zaakceptowany
- `openclaw doctor` migruje starą konfigurację przeglądarki opartą na Plugin i sprawdza, czy
  Chrome jest zainstalowany lokalnie dla domyślnych profili automatycznego połączenia, ale nie może
  włączyć za Ciebie zdalnego debugowania po stronie przeglądarki

Użycie przez agenta:

- Użyj `profile="user"`, gdy potrzebujesz stanu zalogowanej przeglądarki użytkownika.
- Jeśli używasz niestandardowego profilu istniejącej sesji, przekaż tę jawną nazwę profilu.
- Wybieraj ten tryb tylko wtedy, gdy użytkownik jest przy komputerze, aby zatwierdzić monit
  dołączenia.
- Gateway albo host Node może uruchomić `npx chrome-devtools-mcp@latest --autoConnect`

Uwagi:

- Ta ścieżka ma wyższe ryzyko niż odizolowany profil `openclaw`, ponieważ może
  działać wewnątrz zalogowanej sesji przeglądarki.
- OpenClaw nie uruchamia przeglądarki dla tego sterownika; tylko się do niej dołącza.
- OpenClaw używa tutaj oficjalnego przepływu Chrome DevTools MCP `--autoConnect`. Jeśli
  ustawiono `userDataDir`, jest on przekazywany dalej, aby wskazać ten katalog danych użytkownika.
- Istniejąca sesja może zostać dołączona na wybranym hoście albo przez połączony
  Node przeglądarki. Jeśli Chrome działa gdzie indziej i żaden Node przeglądarki nie jest połączony, użyj
  zamiast tego zdalnego CDP albo hosta Node.

### Niestandardowe uruchomienie Chrome MCP

Nadpisz uruchamiany serwer Chrome DevTools MCP dla profilu, gdy domyślny
przepływ `npx chrome-devtools-mcp@latest` nie jest tym, czego chcesz (hosty offline,
przypięte wersje, binaria vendored):

| Pole         | Co robi                                                                                                                    |
| ------------ | -------------------------------------------------------------------------------------------------------------------------- |
| `mcpCommand` | Plik wykonywalny uruchamiany zamiast `npx`. Rozwiązywany bez zmian; ścieżki bezwzględne są honorowane.                    |
| `mcpArgs`    | Tablica argumentów przekazywana dosłownie do `mcpCommand`. Zastępuje domyślne argumenty `chrome-devtools-mcp@latest --autoConnect`. |

Gdy `cdpUrl` jest ustawione w profilu istniejącej sesji, OpenClaw pomija
`--autoConnect` i automatycznie przekazuje punkt końcowy do Chrome MCP:

- `http(s)://...` → `--browserUrl <url>` (punkt końcowy wykrywania HTTP DevTools).
- `ws(s)://...` → `--wsEndpoint <url>` (bezpośredni WebSocket CDP).

Flag punktów końcowych i `userDataDir` nie można łączyć: gdy ustawiono `cdpUrl`,
`userDataDir` jest ignorowane przy uruchamianiu Chrome MCP, ponieważ Chrome MCP dołącza do
działającej przeglądarki za punktem końcowym zamiast otwierać katalog
profilu.

<Accordion title="Ograniczenia funkcji istniejącej sesji">

W porównaniu z zarządzanym profilem `openclaw` sterowniki istniejącej sesji mają więcej ograniczeń:

- **Zrzuty ekranu** - przechwytywanie stron i przechwytywanie elementów przez `--ref` działa; selektory CSS `--element` nie działają. `--full-page` nie można łączyć z `--ref` ani `--element`. Playwright nie jest wymagany do zrzutów ekranu strony ani elementów opartych na referencjach.
- **Akcje** - `click`, `type`, `hover`, `scrollIntoView`, `drag` i `select` wymagają referencji ze snapshotu (bez selektorów CSS). `click-coords` klika widoczne współrzędne viewportu i nie wymaga referencji ze snapshotu. `click` używa wyłącznie lewego przycisku. `type` nie obsługuje `slowly=true`; użyj `fill` albo `press`. `press` nie obsługuje `delayMs`. `type`, `hover`, `scrollIntoView`, `drag`, `select`, `fill` i `evaluate` nie obsługują limitów czasu dla pojedynczego wywołania. `select` akceptuje pojedynczą wartość.
- **Oczekiwanie / przesyłanie / dialog** - `wait --url` obsługuje wzorce dokładne, podciągu i glob; `wait --load networkidle` nie jest obsługiwane. Hooki przesyłania wymagają `ref` albo `inputRef`, jednego pliku naraz, bez CSS `element`. Hooki dialogów nie obsługują nadpisywania limitu czasu.
- **Funkcje tylko zarządzane** - akcje wsadowe, eksport PDF, przechwytywanie pobierania i `responsebody` nadal wymagają ścieżki zarządzanej przeglądarki.

</Accordion>

## Gwarancje izolacji

- **Dedykowany katalog danych użytkownika**: nigdy nie dotyka osobistego profilu przeglądarki.
- **Dedykowane porty**: unika `9222`, aby zapobiec kolizjom z przepływami developerskimi.
- **Deterministyczne sterowanie kartami**: `tabs` zwraca najpierw `suggestedTargetId`, następnie
  stabilne uchwyty `tabId`, takie jak `t1`, opcjonalne etykiety i surowe `targetId`.
  Agenci powinni ponownie używać `suggestedTargetId`; surowe identyfikatory pozostają dostępne do
  debugowania i zgodności.

## Wybór przeglądarki

Podczas uruchamiania lokalnego OpenClaw wybiera pierwszą dostępną:

1. Chrome
2. Brave
3. Edge
4. Chromium
5. Chrome Canary

Możesz nadpisać to za pomocą `browser.executablePath`.

Platformy:

- macOS: sprawdza `/Applications` i `~/Applications`.
- Linux: sprawdza typowe lokalizacje Chrome/Brave/Edge/Chromium w `/usr/bin`,
  `/snap/bin`, `/opt/google`, `/opt/brave.com`, `/usr/lib/chromium` i
  `/usr/lib/chromium-browser`.
- Windows: sprawdza typowe lokalizacje instalacji.

## API sterowania (opcjonalne)

Do skryptowania i debugowania Gateway udostępnia małe **HTTP API sterowania
tylko przez local loopback** oraz pasujące CLI `openclaw browser` (snapshoty, referencje, usprawnienia
oczekiwania, wyjście JSON, przepływy debugowania). Pełną dokumentację znajdziesz w
[API sterowania przeglądarką](/pl/tools/browser-control).

## Rozwiązywanie problemów

Problemy specyficzne dla Linuksa (zwłaszcza snap Chromium) opisuje
[Rozwiązywanie problemów z przeglądarką](/pl/tools/browser-linux-troubleshooting).

Konfiguracje z podziałem hostów WSL2 Gateway + Windows Chrome opisuje
[Rozwiązywanie problemów z WSL2 + Windows + zdalnym CDP Chrome](/pl/tools/browser-wsl2-windows-remote-cdp-troubleshooting).

### Błąd uruchomienia CDP a blokada SSRF nawigacji

To różne klasy błędów i wskazują na różne ścieżki kodu.

- **Błąd uruchomienia lub gotowości CDP** oznacza, że OpenClaw nie może potwierdzić, że płaszczyzna sterowania przeglądarką jest zdrowa.
- **Blokada SSRF nawigacji** oznacza, że płaszczyzna sterowania przeglądarką jest zdrowa, ale docelowy adres nawigacji strony został odrzucony przez politykę.

Typowe przykłady:

- Błąd uruchomienia lub gotowości CDP:
  - `Chrome CDP websocket for profile "openclaw" is not reachable after start`
  - `Remote CDP for profile "<name>" is not reachable at <cdpUrl>`
  - `Port <port> is in use for profile "<name>" but not by openclaw` gdy
    zewnętrzna usługa CDP przez loopback jest skonfigurowana bez `attachOnly: true`
- Blokada SSRF nawigacji:
  - przepływy `open`, `navigate`, snapshot albo otwierania kart kończą się błędem polityki przeglądarki/sieci, podczas gdy `start` i `tabs` nadal działają

Użyj tej minimalnej sekwencji, aby je rozdzielić:

```bash
openclaw browser --browser-profile openclaw start
openclaw browser --browser-profile openclaw tabs
openclaw browser --browser-profile openclaw open https://example.com
```

Jak odczytywać wyniki:

- Jeśli `start` kończy się błędem `not reachable after start`, najpierw rozwiąż problem gotowości CDP.
- Jeśli `start` się powiedzie, ale `tabs` się nie powiedzie, płaszczyzna sterowania nadal jest niezdrowa. Traktuj to jako problem osiągalności CDP, nie problem nawigacji strony.
- Jeśli `start` i `tabs` się powiodą, ale `open` albo `navigate` się nie powiedzie, płaszczyzna sterowania przeglądarką działa, a błąd dotyczy polityki nawigacji albo strony docelowej.
- Jeśli `start`, `tabs` i `open` wszystkie się powiodą, podstawowa ścieżka sterowania zarządzaną przeglądarką jest zdrowa.

Ważne szczegóły zachowania:

- Konfiguracja przeglądarki domyślnie używa obiektu polityki SSRF w trybie fail-closed, nawet gdy nie konfigurujesz `browser.ssrfPolicy`.
- Dla lokalnego zarządzanego profilu `openclaw` przez loopback kontrole zdrowia CDP celowo pomijają wymuszanie osiągalności SSRF przeglądarki dla własnej lokalnej płaszczyzny sterowania OpenClaw.
- Ochrona nawigacji jest osobna. Pomyślny wynik `start` albo `tabs` nie oznacza, że późniejszy cel `open` albo `navigate` jest dozwolony.

Wytyczne bezpieczeństwa:

- **Nie** rozluźniaj domyślnie polityki SSRF przeglądarki.
- Preferuj wąskie wyjątki hostów, takie jak `hostnameAllowlist` albo `allowedHostnames`, zamiast szerokiego dostępu do sieci prywatnej.
- Używaj `dangerouslyAllowPrivateNetwork: true` tylko w celowo zaufanych środowiskach, gdzie dostęp przeglądarki do sieci prywatnej jest wymagany i sprawdzony.

## Narzędzia agenta + jak działa sterowanie

Agent otrzymuje **jedno narzędzie** do automatyzacji przeglądarki:

- `browser` - doctor/status/start/stop/tabs/open/focus/close/snapshot/screenshot/navigate/act

Jak to działa:

- `browser snapshot` zwraca stabilne drzewo interfejsu użytkownika (AI lub ARIA).
- `browser act` używa identyfikatorów `ref` ze snapshotu do klikania/pisania/przeciągania/wybierania.
- `browser screenshot` przechwytuje piksele (całą stronę, element lub oznaczone odwołania).
- `browser doctor` sprawdza gotowość Gateway, Plugin, profilu, przeglądarki i karty.
- `browser` akceptuje:
  - `profile`, aby wybrać nazwany profil przeglądarki (openclaw, chrome lub zdalny CDP).
  - `target` (`sandbox` | `host` | `node`), aby wybrać, gdzie działa przeglądarka.
  - W sesjach izolowanych `target: "host"` wymaga `agents.defaults.sandbox.browser.allowHostControl=true`.
  - Jeśli `target` zostanie pominięte: sesje izolowane domyślnie używają `sandbox`, a sesje nieizolowane domyślnie używają `host`.
  - Jeśli podłączony jest węzeł obsługujący przeglądarkę, narzędzie może automatycznie skierować do niego ruch, chyba że przypniesz `target="host"` lub `target="node"`.

Dzięki temu agent pozostaje deterministyczny i unika kruchych selektorów.

## Powiązane

- [Przegląd narzędzi](/pl/tools) - wszystkie dostępne narzędzia agenta
- [Izolowanie](/pl/gateway/sandboxing) - sterowanie przeglądarką w środowiskach izolowanych
- [Bezpieczeństwo](/pl/gateway/security) - ryzyka związane ze sterowaniem przeglądarką i wzmacnianie zabezpieczeń
