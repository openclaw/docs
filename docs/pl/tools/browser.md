---
read_when:
    - Dodawanie automatyzacji przeglądarki sterowanej przez agenta
    - Diagnozowanie, dlaczego OpenClaw zakłóca działanie Twojego Chrome
    - Implementacja ustawień przeglądarki + cyklu życia w aplikacji na macOS
summary: Zintegrowana usługa sterowania przeglądarką + polecenia akcji
title: Przeglądarka (zarządzana przez OpenClaw)
x-i18n:
    generated_at: "2026-04-30T10:20:55Z"
    model: gpt-5.5
    provider: openai
    source_hash: a8f0456505f4e1711626a539a0a0c48d67ca10d4788838eb53855bc83c766d2f
    source_path: tools/browser.md
    workflow: 16
---

OpenClaw może uruchamiać **dedykowany profil Chrome/Brave/Edge/Chromium**, którym steruje agent.
Jest on odizolowany od Twojej osobistej przeglądarki i zarządzany przez niewielką lokalną
usługę sterującą wewnątrz Gateway (tylko pętla zwrotna).

Widok dla początkujących:

- Traktuj to jako **oddzielną przeglądarkę tylko dla agenta**.
- Profil `openclaw` **nie** dotyka Twojego osobistego profilu przeglądarki.
- Agent może **otwierać karty, czytać strony, klikać i pisać** w bezpiecznym torze.
- Wbudowany profil `user` podłącza się do Twojej rzeczywistej, zalogowanej sesji Chrome przez Chrome MCP.

## Co otrzymujesz

- Oddzielny profil przeglądarki o nazwie **openclaw** (domyślnie pomarańczowy akcent).
- Deterministyczne sterowanie kartami (list/open/focus/close).
- Akcje agenta (click/type/drag/select), migawki, zrzuty ekranu, pliki PDF.
- Dołączona Skills `browser-automation`, która uczy agentów pętli odzyskiwania po migawkach,
  stabilnych kartach, nieaktualnych odwołaniach i ręcznych blokadach, gdy Plugin
  przeglądarki jest włączony.
- Opcjonalna obsługa wielu profili (`openclaw`, `work`, `remote`, ...).

Ta przeglądarka **nie** jest Twoją codzienną przeglądarką. To bezpieczna, izolowana powierzchnia do
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

Jeśli `openclaw browser` całkowicie nie istnieje albo agent mówi, że narzędzie przeglądarki
jest niedostępne, przejdź do [Brak polecenia lub narzędzia przeglądarki](/pl/tools/browser#missing-browser-command-or-tool).

## Sterowanie Plugin

Domyślne narzędzie `browser` jest wbudowanym Plugin. Wyłącz je, aby zastąpić je innym Plugin, który rejestruje tę samą nazwę narzędzia `browser`:

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

Domyślne ustawienia wymagają zarówno `plugins.entries.browser.enabled`, **jak i** `browser.enabled=true`. Wyłączenie tylko Plugin usuwa CLI `openclaw browser`, metodę Gateway `browser.request`, narzędzie agenta i usługę sterującą jako jedną całość; Twoja konfiguracja `browser.*` pozostaje nienaruszona dla zamiennika.

Zmiany konfiguracji przeglądarki wymagają ponownego uruchomienia Gateway, aby Plugin mógł ponownie zarejestrować swoją usługę.

## Wskazówki dla agenta

Uwaga o profilu narzędzi: `tools.profile: "coding"` obejmuje `web_search` i
`web_fetch`, ale nie obejmuje pełnego narzędzia `browser`. Jeśli agent lub
utworzony podagent ma używać automatyzacji przeglądarki, dodaj przeglądarkę na etapie
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

- Opis narzędzia `browser` zawiera zwięzły, zawsze aktywny kontrakt: wybierz
  właściwy profil, utrzymuj odwołania na tej samej karcie, używaj `tabId`/etykiet do
  wybierania kart i ładuj Skills przeglądarki do pracy wieloetapowej.
- Dołączona Skills `browser-automation` zawiera dłuższą pętlę operacyjną:
  najpierw sprawdź status/karty, etykietuj karty zadania, zrób migawkę przed działaniem, wykonaj ponowną migawkę
  po zmianach UI, raz odzyskaj nieaktualne odwołania i zgłaszaj blokady logowania/2FA/captcha albo
  kamery/mikrofonu jako wymaganą akcję ręczną zamiast zgadywać.

Skills dołączone do Plugin są widoczne na liście dostępnych Skills agenta, gdy
Plugin jest włączony. Pełne instrukcje Skills są ładowane na żądanie, więc rutynowe
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

Jawny główny blok `browser`, na przykład `browser.enabled=true` lub `browser.profiles.<name>`, aktywuje dołączony Plugin przeglądarki nawet przy restrykcyjnym `plugins.allow`, zgodnie z zachowaniem konfiguracji kanałów. Same `plugins.entries.browser.enabled=true` i `tools.alsoAllow: ["browser"]` nie zastępują przynależności do listy dozwolonych. Całkowite usunięcie `plugins.allow` również przywraca ustawienie domyślne.

## Profile: `openclaw` kontra `user`

- `openclaw`: zarządzana, izolowana przeglądarka (rozszerzenie nie jest wymagane).
- `user`: wbudowany profil podłączenia Chrome MCP do Twojej **rzeczywistej, zalogowanej sesji Chrome**.

Dla wywołań narzędzia przeglądarki przez agenta:

- Domyślnie: używaj izolowanej przeglądarki `openclaw`.
- Preferuj `profile="user"`, gdy liczą się istniejące zalogowane sesje, a użytkownik
  jest przy komputerze, aby kliknąć/zatwierdzić ewentualny monit podłączenia.
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

- Usługa sterująca wiąże się z pętlą zwrotną na porcie wyprowadzonym z `gateway.port` (domyślnie `18791` = gateway + 2). Nadpisanie `gateway.port` lub `OPENCLAW_GATEWAY_PORT` przesuwa wyprowadzane porty w tej samej rodzinie.
- Lokalne profile `openclaw` automatycznie przypisują `cdpPort`/`cdpUrl`; ustawiaj je tylko dla zdalnego CDP. `cdpUrl` domyślnie wskazuje zarządzany lokalny port CDP, gdy nie jest ustawione.
- `remoteCdpTimeoutMs` ma zastosowanie do sprawdzeń osiągalności HTTP zdalnego i `attachOnly` CDP
  oraz żądań HTTP otwierających karty; `remoteCdpHandshakeTimeoutMs` ma zastosowanie do
  ich uzgodnień CDP WebSocket.
- `localLaunchTimeoutMs` to budżet czasu dla lokalnie uruchomionego zarządzanego procesu Chrome,
  aby wystawił swój endpoint HTTP CDP. `localCdpReadyTimeoutMs` to
  kolejny budżet czasu na gotowość websocket CDP po wykryciu procesu.
  Zwiększ te wartości na Raspberry Pi, słabych VPS-ach lub starszym sprzęcie, gdzie Chromium
  uruchamia się wolno. Wartości muszą być dodatnimi liczbami całkowitymi do `120000` ms; nieprawidłowe
  wartości konfiguracji są odrzucane.
- Powtarzające się błędy uruchamiania/gotowości zarządzanego Chrome są przerywane obwodowo dla każdego
  profilu. Po kilku kolejnych niepowodzeniach OpenClaw krótko wstrzymuje nowe próby
  uruchomienia zamiast uruchamiać Chromium przy każdym wywołaniu narzędzia przeglądarki. Napraw
  problem startowy, wyłącz przeglądarkę, jeśli nie jest potrzebna, albo uruchom ponownie
  Gateway po naprawie.
- `actionTimeoutMs` to domyślny budżet czasu dla żądań przeglądarki `act`, gdy wywołujący nie przekazuje `timeoutMs`. Transport klienta dodaje niewielkie okno zapasu, aby długie oczekiwania mogły się zakończyć zamiast przekroczyć limit czasu na granicy HTTP.
- `tabCleanup` to najlepszo-wysiłkowe sprzątanie kart otwartych przez sesje przeglądarki agenta głównego. Sprzątanie cyklu życia podagenta, Cron i ACP nadal zamyka ich jawnie śledzone karty na końcu sesji; sesje główne zachowują aktywne karty do ponownego użycia, a następnie zamykają bezczynne lub nadmiarowe śledzone karty w tle.

</Accordion>

<Accordion title="Polityka SSRF">

- Nawigacja przeglądarki i otwieranie kart są chronione przed SSRF przed nawigacją oraz w miarę możliwości ponownie sprawdzane na końcowym adresie URL `http(s)` po niej.
- W trybie ścisłego SSRF sprawdzane są także wykrywanie zdalnego endpointu CDP i sondy `/json/version` (`cdpUrl`).
- Zmienne środowiskowe Gateway/dostawcy `HTTP_PROXY`, `HTTPS_PROXY`, `ALL_PROXY` i `NO_PROXY` nie pośredniczą automatycznie dla przeglądarki zarządzanej przez OpenClaw. Zarządzany Chrome domyślnie uruchamia się bezpośrednio, aby ustawienia proxy dostawcy nie osłabiały sprawdzeń SSRF przeglądarki.
- Aby użyć proxy dla samej zarządzanej przeglądarki, przekaż jawne flagi proxy Chrome przez `browser.extraArgs`, takie jak `--proxy-server=...` lub `--proxy-pac-url=...`. Tryb ścisłego SSRF blokuje jawne routowanie proxy przeglądarki, chyba że dostęp przeglądarki do sieci prywatnej jest celowo włączony.
- `browser.ssrfPolicy.dangerouslyAllowPrivateNetwork` jest domyślnie wyłączone; włączaj tylko wtedy, gdy dostęp przeglądarki do sieci prywatnej jest celowo zaufany.
- `browser.ssrfPolicy.allowPrivateNetwork` pozostaje obsługiwane jako starszy alias.

</Accordion>

<Accordion title="Zachowanie profilu">

- `attachOnly: true` oznacza: nigdy nie uruchamiaj lokalnej przeglądarki; podłączaj się tylko wtedy, gdy jakaś już działa.
- `headless` można ustawić globalnie albo dla lokalnego zarządzanego profilu. Wartości dla profilu zastępują `browser.headless`, więc jeden lokalnie uruchamiany profil może pozostać w trybie bezgłowym, a inny widoczny.
- `POST /start?headless=true` i `openclaw browser start --headless` żądają
  jednorazowego uruchomienia w trybie bezgłowym dla lokalnych zarządzanych profili bez przepisywania
  `browser.headless` ani konfiguracji profilu. Profile istniejącej sesji, tylko do podłączenia oraz
  zdalne profile CDP odrzucają to nadpisanie, ponieważ OpenClaw nie uruchamia tych
  procesów przeglądarki.
- Na hostach Linux bez `DISPLAY` ani `WAYLAND_DISPLAY` lokalne zarządzane profile
  domyślnie automatycznie przechodzą w tryb bezgłowy, gdy ani środowisko, ani konfiguracja profilu/globalna
  nie wybierają jawnie trybu z interfejsem. `openclaw browser status --json`
  zgłasza `headlessSource` jako `env`, `profile`, `config`,
  `request`, `linux-display-fallback` albo `default`.
- `OPENCLAW_BROWSER_HEADLESS=1` wymusza uruchamianie lokalnych zarządzanych profili w trybie bezgłowym dla
  bieżącego procesu. `OPENCLAW_BROWSER_HEADLESS=0` wymusza tryb z interfejsem dla zwykłych
  uruchomień i zwraca możliwy do wykonania błąd na hostach Linux bez serwera wyświetlania;
  jawne żądanie `start --headless` nadal wygrywa dla tego jednego uruchomienia.
- `executablePath` można ustawić globalnie albo dla lokalnego zarządzanego profilu. Wartości dla profilu zastępują `browser.executablePath`, więc różne zarządzane profile mogą uruchamiać różne przeglądarki oparte na Chromium. Obie formy akceptują `~` jako katalog domowy systemu operacyjnego.
- `color` (na najwyższym poziomie i dla profilu) zabarwia interfejs przeglądarki, aby było widać, który profil jest aktywny.
- Domyślny profil to `openclaw` (zarządzany samodzielnie). Użyj `defaultProfile: "user"`, aby włączyć przeglądarkę zalogowanego użytkownika.
- Kolejność autodetekcji: domyślna przeglądarka systemowa, jeśli jest oparta na Chromium; w przeciwnym razie Chrome → Brave → Edge → Chromium → Chrome Canary.
- `driver: "existing-session"` używa Chrome DevTools MCP zamiast surowego CDP. Nie ustawiaj `cdpUrl` dla tego sterownika.
- Ustaw `browser.profiles.<name>.userDataDir`, gdy profil istniejącej sesji powinien podłączać się do niestandardowego profilu użytkownika Chromium (Brave, Edge itd.). Ta ścieżka również akceptuje `~` jako katalog domowy systemu operacyjnego.

</Accordion>

</AccordionGroup>

## Używanie Brave lub innej przeglądarki opartej na Chromium

Jeśli **domyślna przeglądarka systemowa** jest oparta na Chromium (Chrome/Brave/Edge/itd.),
OpenClaw używa jej automatycznie. Ustaw `browser.executablePath`, aby nadpisać
autodetekcję. Wartości `executablePath` na najwyższym poziomie i dla profilu akceptują `~`
jako katalog domowy systemu operacyjnego:

```bash
openclaw config set browser.executablePath "/usr/bin/google-chrome"
openclaw config set browser.profiles.work.executablePath "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome"
```

Albo ustaw to w konfiguracji, osobno dla platformy:

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

`executablePath` dla profilu wpływa tylko na lokalne zarządzane profile, które OpenClaw
uruchamia. Profile `existing-session` podłączają się zamiast tego do już uruchomionej przeglądarki,
a zdalne profile CDP używają przeglądarki za `cdpUrl`.

## Sterowanie lokalne a zdalne

- **Sterowanie lokalne (domyślne):** Gateway uruchamia usługę sterowania loopback i może uruchomić lokalną przeglądarkę.
- **Sterowanie zdalne (host węzła):** uruchom host węzła na maszynie, która ma przeglądarkę; Gateway pośredniczy w akcjach przeglądarki do niego.
- **Zdalne CDP:** ustaw `browser.profiles.<name>.cdpUrl` (albo `browser.cdpUrl`), aby
  podłączyć się do zdalnej przeglądarki opartej na Chromium. W tym przypadku OpenClaw nie uruchomi lokalnej przeglądarki.
- Dla zewnętrznie zarządzanych usług CDP na loopback (na przykład Browserless w
  Dockerze opublikowanym do `127.0.0.1`) ustaw także `attachOnly: true`. CDP na loopback
  bez `attachOnly` jest traktowane jako lokalny profil przeglądarki zarządzany przez OpenClaw.
- `headless` wpływa tylko na lokalne zarządzane profile, które OpenClaw uruchamia. Nie restartuje ani nie zmienia przeglądarek istniejącej sesji ani zdalnych CDP.
- `executablePath` podlega tej samej regule lokalnego zarządzanego profilu. Zmiana tej wartości w
  działającym lokalnym zarządzanym profilu oznacza ten profil do restartu/uzgodnienia, aby
  następne uruchomienie użyło nowego pliku binarnego.

Zachowanie zatrzymywania różni się w zależności od trybu profilu:

- lokalne zarządzane profile: `openclaw browser stop` zatrzymuje proces przeglądarki, który
  OpenClaw uruchomił
- profile tylko do podłączenia i zdalne profile CDP: `openclaw browser stop` zamyka aktywną
  sesję sterowania i zwalnia nadpisania emulacji Playwright/CDP (viewport,
  schemat kolorów, ustawienia regionalne, strefa czasowa, tryb offline i podobny stan), mimo
  że OpenClaw nie uruchomił żadnego procesu przeglądarki

Zdalne adresy URL CDP mogą zawierać uwierzytelnianie:

- Tokeny zapytania (np. `https://provider.example?token=<token>`)
- Uwierzytelnianie HTTP Basic (np. `https://user:pass@provider.example`)

OpenClaw zachowuje uwierzytelnianie podczas wywoływania punktów końcowych `/json/*` i podczas łączenia
z WebSocket CDP. Preferuj zmienne środowiskowe albo menedżery sekretów dla
tokenów zamiast zatwierdzania ich w plikach konfiguracyjnych.

## Proxy przeglądarki węzła (domyślnie bez konfiguracji)

Jeśli uruchomisz **host węzła** na maszynie, która ma Twoją przeglądarkę, OpenClaw może
automatycznie kierować wywołania narzędzi przeglądarki do tego węzła bez dodatkowej konfiguracji przeglądarki.
To domyślna ścieżka dla zdalnych bram.

Uwagi:

- Host węzła wystawia swój lokalny serwer sterowania przeglądarką przez **polecenie proxy**.
- Profile pochodzą z własnej konfiguracji `browser.profiles` węzła (tak samo jak lokalnie).
- `nodeHost.browserProxy.allowProfiles` jest opcjonalne. Pozostaw to puste dla zachowania starszego/domyślnego: wszystkie skonfigurowane profile pozostają osiągalne przez proxy, w tym trasy tworzenia/usuwania profili.
- Jeśli ustawisz `nodeHost.browserProxy.allowProfiles`, OpenClaw traktuje to jako granicę najmniejszych uprawnień: tylko profile z listy dozwolonych mogą być celem, a trwałe trasy tworzenia/usuwania profili są blokowane na powierzchni proxy.
- Wyłącz, jeśli tego nie chcesz:
  - Na węźle: `nodeHost.browserProxy.enabled=false`
  - Na bramie: `gateway.nodes.browser.mode="off"`

## Browserless (hostowane zdalne CDP)

[Browserless](https://browserless.io) to hostowana usługa Chromium, która wystawia
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

- Zastąp `<BROWSERLESS_API_KEY>` swoim prawdziwym tokenem Browserless.
- Wybierz punkt końcowy regionu odpowiadający Twojemu kontu Browserless (zobacz ich dokumentację).
- Jeśli Browserless daje Ci bazowy adres URL HTTPS, możesz albo przekonwertować go na
  `wss://` dla bezpośredniego połączenia CDP, albo zachować adres HTTPS i pozwolić OpenClaw
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
OpenClaw. Browserless musi też ogłaszać pasujący osiągalny punkt końcowy;
ustaw Browserless `EXTERNAL` na tę samą bazę WebSocket publiczną względem OpenClaw, taką
jak `ws://127.0.0.1:3000`, `ws://browserless:3000` albo stabilny prywatny adres
sieci Docker. Jeśli `/json/version` zwraca `webSocketDebuggerUrl` wskazujący na
adres, którego OpenClaw nie może osiągnąć, HTTP CDP może wyglądać na zdrowe, a podłączenie
WebSocket nadal będzie zawodzić.

Nie pozostawiaj `attachOnly` nieustawionego dla profilu Browserless na loopback. Bez
`attachOnly` OpenClaw traktuje port loopback jako lokalny zarządzany profil przeglądarki
i może zgłaszać, że port jest używany, ale nie należy do OpenClaw.

## Bezpośredni dostawcy CDP WebSocket

Niektóre hostowane usługi przeglądarek wystawiają **bezpośredni WebSocket** zamiast
standardowego wykrywania CDP opartego na HTTP (`/json/version`). OpenClaw akceptuje trzy
kształty adresów URL CDP i automatycznie wybiera właściwą strategię połączenia:

- **Wykrywanie HTTP(S)** — `http://host[:port]` albo `https://host[:port]`.
  OpenClaw wywołuje `/json/version`, aby wykryć adres URL debuggera WebSocket, a potem
  się łączy. Bez awaryjnego przejścia na WebSocket.
- **Bezpośrednie punkty końcowe WebSocket** — `ws://host[:port]/devtools/<kind>/<id>` albo
  `wss://...` ze ścieżką `/devtools/browser|page|worker|shared_worker|service_worker/<id>`.
  OpenClaw łączy się bezpośrednio przez uzgadnianie WebSocket i całkowicie pomija
  `/json/version`.
- **Gołe korzenie WebSocket** — `ws://host[:port]` albo `wss://host[:port]` bez
  ścieżki `/devtools/...` (np. [Browserless](https://browserless.io),
  [Browserbase](https://www.browserbase.com)). OpenClaw najpierw próbuje wykrywania HTTP
  `/json/version` (normalizując schemat do `http`/`https`);
  jeśli wykrywanie zwróci `webSocketDebuggerUrl`, zostaje on użyty, w przeciwnym razie OpenClaw
  przechodzi awaryjnie do bezpośredniego uzgadniania WebSocket na gołym korzeniu. Jeśli ogłoszony
  punkt końcowy WebSocket odrzuci uzgadnianie CDP, ale skonfigurowany goły korzeń
  je zaakceptuje, OpenClaw przechodzi awaryjnie również do tego korzenia. Dzięki temu goły `ws://`
  wskazujący lokalny Chrome nadal może się połączyć, ponieważ Chrome akceptuje przejścia na WebSocket
  tylko na konkretnej ścieżce celu z `/json/version`, a hostowani
  dostawcy nadal mogą używać swojego głównego punktu końcowego WebSocket, gdy ich punkt końcowy
  wykrywania ogłasza krótkotrwały adres URL, który nie nadaje się dla Playwright CDP.

### Browserbase

[Browserbase](https://www.browserbase.com) to platforma chmurowa do uruchamiania
przeglądarek bezgłowych z wbudowanym rozwiązywaniem CAPTCHA, trybem stealth i rezydencjalnymi
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

- [Zarejestruj się](https://www.browserbase.com/sign-up) i skopiuj swój **API Key**
  z [panelu Overview](https://www.browserbase.com/overview).
- Zastąp `<BROWSERBASE_API_KEY>` swoim prawdziwym kluczem API Browserbase.
- Browserbase automatycznie tworzy sesję przeglądarki przy połączeniu WebSocket, więc
  ręczny krok tworzenia sesji nie jest potrzebny.
- Warstwa bezpłatna pozwala na jedną równoczesną sesję i jedną godzinę przeglądarki miesięcznie.
  Zobacz [cennik](https://www.browserbase.com/pricing), aby poznać limity płatnych planów.
- Zobacz [dokumentację Browserbase](https://docs.browserbase.com), aby uzyskać pełną dokumentację API,
  przewodniki po SDK i przykłady integracji.

## Bezpieczeństwo

Kluczowe idee:

- Sterowanie przeglądarką działa wyłącznie przez loopback; dostęp przepływa przez uwierzytelnianie Gateway albo parowanie węzła.
- Samodzielne HTTP API przeglądarki loopback używa **wyłącznie uwierzytelniania wspólnym sekretem**:
  uwierzytelniania bearer tokenem Gateway, `x-openclaw-password` albo HTTP Basic auth ze
  skonfigurowanym hasłem Gateway.
- Nagłówki tożsamości Tailscale Serve i `gateway.auth.mode: "trusted-proxy"` **nie**
  uwierzytelniają tego samodzielnego API przeglądarki loopback.
- Jeśli sterowanie przeglądarką jest włączone i nie skonfigurowano uwierzytelniania
  wspólnym sekretem, OpenClaw automatycznie generuje `gateway.auth.token` przy
  uruchomieniu i zapisuje go w konfiguracji.
- OpenClaw **nie** generuje tego tokena automatycznie, gdy `gateway.auth.mode` ma już
  wartość `password`, `none` albo `trusted-proxy`.
- Trzymaj Gateway i wszystkie hosty węzłów w sieci prywatnej (Tailscale); unikaj publicznego wystawiania.
- Traktuj zdalne adresy URL/tokeny CDP jako sekrety; preferuj zmienne środowiskowe albo menedżer sekretów.

Wskazówki dotyczące zdalnego CDP:

- Preferuj szyfrowane punkty końcowe (HTTPS albo WSS) i krótkotrwałe tokeny, gdy to możliwe.
- Unikaj osadzania długotrwałych tokenów bezpośrednio w plikach konfiguracyjnych.

## Profile (wiele przeglądarek)

OpenClaw obsługuje wiele nazwanych profili (konfiguracji routingu). Profile mogą być:

- **zarządzane przez openclaw**: dedykowana instancja przeglądarki opartej na Chromium z własnym katalogiem danych użytkownika + portem CDP
- **zdalne**: jawny adres URL CDP (przeglądarka oparta na Chromium uruchomiona gdzie indziej)
- **istniejąca sesja**: istniejący profil Chrome przez automatyczne łączenie Chrome DevTools MCP

Wartości domyślne:

- Profil `openclaw` jest tworzony automatycznie, jeśli go brakuje.
- Profil `user` jest wbudowany do dołączania istniejącej sesji Chrome MCP.
- Profile istniejącej sesji poza `user` są opcjonalne; utwórz je za pomocą `--driver existing-session`.
- Lokalne porty CDP są domyślnie przydzielane z zakresu **18800–18899**.
- Usunięcie profilu przenosi jego lokalny katalog danych do Kosza.

Wszystkie punkty końcowe sterowania akceptują `?profile=<name>`; CLI używa `--browser-profile`.

## Istniejąca sesja przez Chrome DevTools MCP

OpenClaw może też dołączyć do działającego profilu przeglądarki opartej na Chromium przez
oficjalny serwer Chrome DevTools MCP. Wykorzystuje to ponownie karty i stan logowania
już otwarte w tym profilu przeglądarki.

Oficjalne materiały ogólne i konfiguracja:

- [Chrome for Developers: Use Chrome DevTools MCP with your browser session](https://developer.chrome.com/blog/chrome-devtools-mcp-debug-your-browser-session)
- [Chrome DevTools MCP README](https://github.com/ChromeDevTools/chrome-devtools-mcp)

Profil wbudowany:

- `user`

Opcjonalnie: utwórz własny niestandardowy profil istniejącej sesji, jeśli chcesz użyć
innej nazwy, koloru albo katalogu danych przeglądarki.

Zachowanie domyślne:

- Wbudowany profil `user` używa automatycznego łączenia Chrome MCP, które celuje w
  domyślny lokalny profil Google Chrome.

Użyj `userDataDir` dla Brave, Edge, Chromium albo niedomyślnego profilu Chrome.
`~` rozwija się do katalogu domowego systemu operacyjnego:

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

1. Otwórz stronę inspekcji tej przeglądarki do zdalnego debugowania.
2. Włącz zdalne debugowanie.
3. Utrzymuj przeglądarkę uruchomioną i zatwierdź monit o połączenie, gdy OpenClaw się dołącza.

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
- `snapshot` zwraca odwołania z wybranej aktywnej karty

Co sprawdzić, jeśli dołączanie nie działa:

- docelowa przeglądarka oparta na Chromium ma wersję `144+`
- zdalne debugowanie jest włączone na stronie inspekcji tej przeglądarki
- przeglądarka pokazała monit zgody na dołączenie i został on zaakceptowany
- `openclaw doctor` migruje starą konfigurację przeglądarki opartą na rozszerzeniu i sprawdza, czy
  Chrome jest zainstalowany lokalnie dla domyślnych profili automatycznego łączenia, ale nie może
  włączyć za Ciebie zdalnego debugowania po stronie przeglądarki

Użycie przez agenta:

- Użyj `profile="user"`, gdy potrzebujesz zalogowanego stanu przeglądarki użytkownika.
- Jeśli używasz niestandardowego profilu istniejącej sesji, przekaż tę jawną nazwę profilu.
- Wybieraj ten tryb tylko wtedy, gdy użytkownik jest przy komputerze, aby zatwierdzić monit
  o dołączenie.
- Gateway albo host węzła może uruchomić `npx chrome-devtools-mcp@latest --autoConnect`

Uwagi:

- Ta ścieżka ma wyższe ryzyko niż izolowany profil `openclaw`, ponieważ może
  działać wewnątrz zalogowanej sesji przeglądarki.
- OpenClaw nie uruchamia przeglądarki dla tego sterownika; tylko się do niej dołącza.
- OpenClaw używa tutaj oficjalnego przepływu Chrome DevTools MCP `--autoConnect`. Jeśli
  ustawiono `userDataDir`, zostaje ono przekazane, aby wskazać ten katalog danych użytkownika.
- Istniejąca sesja może dołączyć na wybranym hoście albo przez połączony
  węzeł przeglądarki. Jeśli Chrome działa gdzie indziej i nie jest połączony żaden węzeł przeglądarki, użyj
  zdalnego CDP albo hosta węzła.

### Niestandardowe uruchamianie Chrome MCP

Nadpisz uruchamiany serwer Chrome DevTools MCP dla profilu, gdy domyślny przepływ
`npx chrome-devtools-mcp@latest` nie jest tym, czego potrzebujesz (hosty offline,
przypięte wersje, dołączone binaria):

| Pole         | Co robi                                                                                                                    |
| ------------ | -------------------------------------------------------------------------------------------------------------------------- |
| `mcpCommand` | Plik wykonywalny do uruchomienia zamiast `npx`. Rozwiązywany bez zmian; ścieżki bezwzględne są respektowane.              |
| `mcpArgs`    | Tablica argumentów przekazywana dosłownie do `mcpCommand`. Zastępuje domyślne argumenty `chrome-devtools-mcp@latest --autoConnect`. |

Gdy `cdpUrl` jest ustawione w profilu istniejącej sesji, OpenClaw pomija
`--autoConnect` i automatycznie przekazuje punkt końcowy do Chrome MCP:

- `http(s)://...` → `--browserUrl <url>` (punkt końcowy wykrywania HTTP DevTools).
- `ws(s)://...` → `--wsEndpoint <url>` (bezpośredni CDP WebSocket).

Flag punktów końcowych i `userDataDir` nie można łączyć: gdy ustawiono `cdpUrl`,
`userDataDir` jest ignorowane przy uruchamianiu Chrome MCP, ponieważ Chrome MCP dołącza do
działającej przeglądarki za punktem końcowym zamiast otwierać katalog
profilu.

<Accordion title="Ograniczenia funkcji istniejącej sesji">

W porównaniu z zarządzanym profilem `openclaw`, sterowniki istniejącej sesji mają więcej ograniczeń:

- **Zrzuty ekranu** — przechwytywanie stron i przechwytywanie elementów przez `--ref` działa; selektory CSS `--element` nie działają. `--full-page` nie może być łączone z `--ref` ani `--element`. Playwright nie jest wymagany do zrzutów stron ani elementów opartych na ref.
- **Akcje** — `click`, `type`, `hover`, `scrollIntoView`, `drag` i `select` wymagają odwołań ze snapshotu (bez selektorów CSS). `click-coords` klika widoczne współrzędne widoku i nie wymaga odwołania ze snapshotu. `click` działa tylko lewym przyciskiem. `type` nie obsługuje `slowly=true`; użyj `fill` albo `press`. `press` nie obsługuje `delayMs`. `type`, `hover`, `scrollIntoView`, `drag`, `select`, `fill` i `evaluate` nie obsługują limitów czasu dla pojedynczego wywołania. `select` akceptuje pojedynczą wartość.
- **Oczekiwanie / przesyłanie / dialog** — `wait --url` obsługuje dokładne wzorce, podciągi i globy; `wait --load networkidle` nie jest obsługiwane. Hooki przesyłania wymagają `ref` albo `inputRef`, jeden plik naraz, bez CSS `element`. Hooki dialogów nie obsługują nadpisywania limitu czasu.
- **Funkcje tylko zarządzane** — akcje wsadowe, eksport PDF, przechwytywanie pobrań i `responsebody` nadal wymagają ścieżki przeglądarki zarządzanej.

</Accordion>

## Gwarancje izolacji

- **Dedykowany katalog danych użytkownika**: nigdy nie dotyka osobistego profilu przeglądarki.
- **Dedykowane porty**: unika `9222`, aby zapobiec kolizjom z przepływami deweloperskimi.
- **Deterministyczne sterowanie kartami**: `tabs` zwraca najpierw `suggestedTargetId`, a następnie
  stabilne uchwyty `tabId`, takie jak `t1`, opcjonalne etykiety oraz surowe `targetId`.
  Agenci powinni ponownie używać `suggestedTargetId`; surowe identyfikatory pozostają dostępne do
  debugowania i zgodności.

## Wybór przeglądarki

Przy uruchamianiu lokalnym OpenClaw wybiera pierwszą dostępną:

1. Chrome
2. Brave
3. Edge
4. Chromium
5. Chrome Canary

Możesz nadpisać za pomocą `browser.executablePath`.

Platformy:

- macOS: sprawdza `/Applications` i `~/Applications`.
- Linux: sprawdza typowe lokalizacje Chrome/Brave/Edge/Chromium pod `/usr/bin`,
  `/snap/bin`, `/opt/google`, `/opt/brave.com`, `/usr/lib/chromium` i
  `/usr/lib/chromium-browser`.
- Windows: sprawdza typowe lokalizacje instalacji.

## API sterowania (opcjonalne)

Do skryptowania i debugowania Gateway udostępnia małe **HTTP API sterowania dostępne
wyłącznie przez loopback** oraz pasujące CLI `openclaw browser` (snapshoty, refs, dopalacze
oczekiwania, wyjście JSON, przepływy debugowania). Pełną dokumentację znajdziesz w
[API sterowania przeglądarką](/pl/tools/browser-control).

## Rozwiązywanie problemów

Problemy specyficzne dla Linuksa (zwłaszcza snap Chromium) opisuje
[Rozwiązywanie problemów z przeglądarką](/pl/tools/browser-linux-troubleshooting).

Konfiguracje z podziałem hostów WSL2 Gateway + Windows Chrome opisuje
[Rozwiązywanie problemów z WSL2 + Windows + zdalnym Chrome CDP](/pl/tools/browser-wsl2-windows-remote-cdp-troubleshooting).

### Awaria uruchamiania CDP a blokada SSRF nawigacji

To różne klasy awarii i wskazują na różne ścieżki kodu.

- **Awaria uruchamiania albo gotowości CDP** oznacza, że OpenClaw nie może potwierdzić, że płaszczyzna sterowania przeglądarką jest sprawna.
- **Blokada SSRF nawigacji** oznacza, że płaszczyzna sterowania przeglądarką jest sprawna, ale cel nawigacji strony jest odrzucany przez politykę.

Typowe przykłady:

- Awaria uruchamiania albo gotowości CDP:
  - `Chrome CDP websocket for profile "openclaw" is not reachable after start`
  - `Remote CDP for profile "<name>" is not reachable at <cdpUrl>`
  - `Port <port> is in use for profile "<name>" but not by openclaw` gdy
    usługa zewnętrznego CDP loopback jest skonfigurowana bez `attachOnly: true`
- Blokada SSRF nawigacji:
  - przepływy `open`, `navigate`, snapshotu albo otwierania kart kończą się błędem polityki przeglądarki/sieci, podczas gdy `start` i `tabs` nadal działają

Użyj tej minimalnej sekwencji, aby je rozdzielić:

```bash
openclaw browser --browser-profile openclaw start
openclaw browser --browser-profile openclaw tabs
openclaw browser --browser-profile openclaw open https://example.com
```

Jak odczytywać wyniki:

- Jeśli `start` kończy się błędem `not reachable after start`, najpierw rozwiąż problem gotowości CDP.
- Jeśli `start` się powiedzie, ale `tabs` zawiedzie, płaszczyzna sterowania nadal jest niesprawna. Traktuj to jako problem osiągalności CDP, a nie problem nawigacji strony.
- Jeśli `start` i `tabs` się powiodą, ale `open` albo `navigate` zawiedzie, płaszczyzna sterowania przeglądarką działa, a awaria jest w polityce nawigacji albo stronie docelowej.
- Jeśli `start`, `tabs` i `open` wszystkie się powiodą, podstawowa ścieżka sterowania przeglądarką zarządzaną jest sprawna.

Ważne szczegóły zachowania:

- Konfiguracja przeglądarki domyślnie używa obiektu polityki SSRF zamkniętego na awarie, nawet jeśli nie konfigurujesz `browser.ssrfPolicy`.
- Dla lokalnego profilu zarządzanego `openclaw` loopback kontrole kondycji CDP celowo pomijają egzekwowanie osiągalności SSRF przeglądarki dla własnej lokalnej płaszczyzny sterowania OpenClaw.
- Ochrona nawigacji jest osobna. Pomyślny wynik `start` albo `tabs` nie oznacza, że późniejszy cel `open` albo `navigate` jest dozwolony.

Wskazówki bezpieczeństwa:

- **Nie** rozluźniaj domyślnie polityki SSRF przeglądarki.
- Preferuj wąskie wyjątki hostów, takie jak `hostnameAllowlist` albo `allowedHostnames`, zamiast szerokiego dostępu do sieci prywatnej.
- Używaj `dangerouslyAllowPrivateNetwork: true` tylko w celowo zaufanych środowiskach, gdzie prywatnosieciowy dostęp przeglądarki jest wymagany i sprawdzony.

## Narzędzia agenta + jak działa sterowanie

Agent otrzymuje **jedno narzędzie** do automatyzacji przeglądarki:

- `browser` — doctor/status/start/stop/tabs/open/focus/close/snapshot/screenshot/navigate/act

Jak to się mapuje:

- `browser snapshot` zwraca stabilne drzewo UI (AI lub ARIA).
- `browser act` używa identyfikatorów `ref` ze zrzutu, aby klikać, wpisywać, przeciągać i wybierać.
- `browser screenshot` przechwytuje piksele (całą stronę, element albo oznaczone odwołania).
- `browser doctor` sprawdza gotowość Gateway, Plugin, profilu, przeglądarki i karty.
- `browser` akceptuje:
  - `profile`, aby wybrać nazwany profil przeglądarki (openclaw, chrome lub zdalny CDP).
  - `target` (`sandbox` | `host` | `node`), aby wybrać, gdzie znajduje się przeglądarka.
  - W sesjach izolowanych `target: "host"` wymaga `agents.defaults.sandbox.browser.allowHostControl=true`.
  - Jeśli `target` zostanie pominięty: sesje izolowane domyślnie używają `sandbox`, a sesje nieizolowane domyślnie używają `host`.
  - Jeśli podłączony jest węzeł obsługujący przeglądarkę, narzędzie może automatycznie wyznaczyć do niego trasę, chyba że przypniesz `target="host"` lub `target="node"`.

Dzięki temu agent pozostaje deterministyczny i unika kruchych selektorów.

## Powiązane

- [Przegląd narzędzi](/pl/tools) — wszystkie dostępne narzędzia agenta
- [Izolowanie](/pl/gateway/sandboxing) — sterowanie przeglądarką w środowiskach izolowanych
- [Bezpieczeństwo](/pl/gateway/security) — ryzyka związane ze sterowaniem przeglądarką i zabezpieczanie
