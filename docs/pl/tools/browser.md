---
read_when:
    - Dodawanie automatyzacji przeglądarki sterowanej przez agenta
    - Diagnozowanie, dlaczego openclaw zakłóca działanie twojej własnej przeglądarki Chrome
    - Implementacja ustawień przeglądarki i cyklu życia w aplikacji macOS
summary: Zintegrowana usługa sterowania przeglądarką + polecenia działań
title: Przeglądarka (zarządzana przez OpenClaw)
x-i18n:
    generated_at: "2026-05-06T09:31:43Z"
    model: gpt-5.5
    provider: openai
    source_hash: 3588ee1205d34df7604f1c660829c5f373b0fa76080d36c460f4ed4a08777a39
    source_path: tools/browser.md
    workflow: 16
---

OpenClaw może uruchamiać **dedykowany profil Chrome/Brave/Edge/Chromium**, którym steruje agent.
Jest on odizolowany od Twojej osobistej przeglądarki i zarządzany przez niewielką lokalną
usługę sterującą wewnątrz Gateway (tylko loopback).

Widok dla początkujących:

- Pomyśl o nim jak o **osobnej przeglądarce tylko dla agenta**.
- Profil `openclaw` **nie** dotyka Twojego osobistego profilu przeglądarki.
- Agent może **otwierać karty, czytać strony, klikać i pisać** w bezpiecznym torze.
- Wbudowany profil `user` dołącza do Twojej prawdziwej, zalogowanej sesji Chrome przez Chrome MCP.

## Co otrzymujesz

- Osobny profil przeglądarki o nazwie **openclaw** (domyślnie z pomarańczowym akcentem).
- Deterministyczne sterowanie kartami (list/open/focus/close).
- Akcje agenta (click/type/drag/select), migawki, zrzuty ekranu, pliki PDF.
- Dołączony skill `browser-automation`, który uczy agentów pętli odzyskiwania
  snapshot, stable-tab, stale-ref i manual-blocker, gdy Plugin przeglądarki
  jest włączony.
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

Jeśli pojawi się komunikat „Browser disabled”, włącz ją w konfiguracji (patrz niżej) i uruchom ponownie
Gateway.

Jeśli `openclaw browser` w ogóle nie istnieje albo agent mówi, że narzędzie przeglądarki
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

Domyślne ustawienia wymagają zarówno `plugins.entries.browser.enabled`, **jak i** `browser.enabled=true`. Wyłączenie tylko Plugin usuwa CLI `openclaw browser`, metodę Gateway `browser.request`, narzędzie agenta i usługę sterującą jako jedną całość; Twoja konfiguracja `browser.*` pozostaje nienaruszona dla zamiennika.

Zmiany konfiguracji przeglądarki wymagają ponownego uruchomienia Gateway, aby Plugin mógł ponownie zarejestrować swoją usługę.

## Wskazówki dla agenta

Uwaga o profilu narzędzi: `tools.profile: "coding"` obejmuje `web_search` i
`web_fetch`, ale nie obejmuje pełnego narzędzia `browser`. Jeśli agent albo
uruchomiony sub-agent ma używać automatyzacji przeglądarki, dodaj browser na etapie
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
Samo `tools.subagents.tools.allow: ["browser"]` nie wystarczy, ponieważ polityka sub-agent
jest stosowana po filtrowaniu profilu.

Plugin przeglądarki dostarcza dwa poziomy wskazówek dla agentów:

- Opis narzędzia `browser` zawiera zwięzły, zawsze aktywny kontrakt: wybierz
  właściwy profil, utrzymuj referencje na tej samej karcie, używaj `tabId`/etykiet do
  kierowania na karty i wczytaj skill przeglądarki do pracy wieloetapowej.
- Dołączony skill `browser-automation` zawiera dłuższą pętlę operacyjną:
  najpierw sprawdź status/karty, etykietuj karty zadania, zrób migawkę przed działaniem, wykonaj ponowną migawkę
  po zmianach UI, raz odzyskaj nieaktualne referencje i zgłaszaj blokady logowania/2FA/captcha lub
  kamery/mikrofonu jako działanie ręczne zamiast zgadywać.

Skills dołączone do Plugin są wymienione w dostępnych Skills agenta, gdy
Plugin jest włączony. Pełne instrukcje skill są wczytywane na żądanie, więc rutynowe
tury nie płacą pełnego kosztu tokenów.

## Brak polecenia lub narzędzia przeglądarki

Jeśli po uaktualnieniu `openclaw browser` jest nieznane, brakuje `browser.request` albo agent zgłasza narzędzie przeglądarki jako niedostępne, zwykle przyczyną jest lista `plugins.allow`, która pomija `browser`, i brak głównego bloku konfiguracji `browser`. Dodaj go:

```json5
{
  plugins: {
    allow: ["telegram", "browser"],
  },
}
```

Jawny główny blok `browser`, na przykład `browser.enabled=true` albo `browser.profiles.<name>`, aktywuje dołączony Plugin przeglądarki nawet przy restrykcyjnym `plugins.allow`, zgodnie z zachowaniem konfiguracji kanałów. `plugins.entries.browser.enabled=true` i `tools.alsoAllow: ["browser"]` same w sobie nie zastępują członkostwa na liście dozwolonych. Całkowite usunięcie `plugins.allow` również przywraca ustawienie domyślne.

## Profile: `openclaw` kontra `user`

- `openclaw`: zarządzana, izolowana przeglądarka (bez wymaganego rozszerzenia).
- `user`: wbudowany profil dołączania Chrome MCP do Twojej **prawdziwej, zalogowanej sesji Chrome**.

Dla wywołań narzędzia przeglądarki przez agenta:

- Domyślnie: używaj izolowanej przeglądarki `openclaw`.
- Preferuj `profile="user"`, gdy istniejące zalogowane sesje mają znaczenie, a użytkownik
  jest przy komputerze, aby kliknąć/zatwierdzić ewentualny monit dołączenia.
- `profile` jest jawnym nadpisaniem, gdy chcesz użyć konkretnego trybu przeglądarki.

Ustaw `browser.defaultProfile: "openclaw"`, jeśli domyślnie chcesz używać trybu zarządzanego.

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
- Lokalne profile `openclaw` automatycznie przypisują `cdpPort`/`cdpUrl`; ustawiaj je tylko dla zdalnego CDP. `cdpUrl` domyślnie wskazuje zarządzany lokalny port CDP, gdy nie jest ustawione.
- `remoteCdpTimeoutMs` dotyczy zdalnych i `attachOnly` sprawdzeń osiągalności CDP HTTP
  oraz żądań HTTP otwierających karty; `remoteCdpHandshakeTimeoutMs` dotyczy
  ich uzgodnień CDP WebSocket.
- `localLaunchTimeoutMs` to budżet czasu dla lokalnie uruchomionego zarządzanego procesu Chrome
  na udostępnienie punktu końcowego CDP HTTP. `localCdpReadyTimeoutMs` to
  kolejny budżet na gotowość websocket CDP po wykryciu procesu.
  Zwiększ te wartości na Raspberry Pi, słabszym VPS lub starszym sprzęcie, gdzie Chromium
  uruchamia się wolno. Wartości muszą być dodatnimi liczbami całkowitymi do `120000` ms; nieprawidłowe
  wartości konfiguracji są odrzucane.
- Powtarzające się awarie uruchamiania/gotowości zarządzanego Chrome są przerywane obwodowo dla każdego
  profilu. Po kilku kolejnych awariach OpenClaw krótko wstrzymuje nowe próby uruchomienia
  zamiast uruchamiać Chromium przy każdym wywołaniu narzędzia przeglądarki. Napraw
  problem startowy, wyłącz przeglądarkę, jeśli nie jest potrzebna, albo uruchom ponownie
  Gateway po naprawie.
- `actionTimeoutMs` to domyślny budżet dla żądań przeglądarki `act`, gdy wywołujący nie przekazuje `timeoutMs`. Transport klienta dodaje niewielkie okno zapasu, aby długie oczekiwania mogły się zakończyć zamiast przekroczyć limit czasu na granicy HTTP.
- `tabCleanup` to best-effort czyszczenie kart otwartych przez sesje przeglądarki głównego agenta. Czyszczenie cyklu życia subagentów, Cron i ACP nadal zamyka ich jawnie śledzone karty na końcu sesji; sesje główne utrzymują aktywne karty jako możliwe do ponownego użycia, a następnie zamykają bezczynne lub nadmiarowe śledzone karty w tle.

</Accordion>

<Accordion title="Polityka SSRF">

- Nawigacja przeglądarki i otwieranie kart są chronione przed SSRF przed nawigacją i best-effort ponownie sprawdzane na końcowym adresie URL `http(s)` po niej.
- W ścisłym trybie SSRF sprawdzane są także wykrywanie zdalnego punktu końcowego CDP i sondy `/json/version` (`cdpUrl`).
- Zmienne środowiskowe Gateway/providera `HTTP_PROXY`, `HTTPS_PROXY`, `ALL_PROXY` i `NO_PROXY` nie proxy'ują automatycznie przeglądarki zarządzanej przez OpenClaw. Zarządzany Chrome domyślnie uruchamia się bezpośrednio, aby ustawienia proxy providera nie osłabiały kontroli SSRF przeglądarki.
- Aby proxy'ować samą zarządzaną przeglądarkę, przekaż jawne flagi proxy Chrome przez `browser.extraArgs`, takie jak `--proxy-server=...` albo `--proxy-pac-url=...`. Ścisły tryb SSRF blokuje jawne trasowanie proxy przeglądarki, chyba że dostęp przeglądarki do sieci prywatnej został celowo włączony.
- `browser.ssrfPolicy.dangerouslyAllowPrivateNetwork` jest domyślnie wyłączone; włączaj tylko wtedy, gdy dostęp przeglądarki do sieci prywatnej jest celowo zaufany.
- `browser.ssrfPolicy.allowPrivateNetwork` pozostaje obsługiwane jako starszy alias.

</Accordion>

<Accordion title="Zachowanie profilu">

- `attachOnly: true` oznacza, że lokalna przeglądarka nigdy nie jest uruchamiana; następuje tylko podłączenie, jeśli jakaś już działa.
- `headless` można ustawić globalnie lub dla każdego lokalnego profilu zarządzanego. Wartości profilu zastępują `browser.headless`, więc jeden lokalnie uruchamiany profil może pozostać headless, podczas gdy inny pozostaje widoczny.
- `POST /start?headless=true` oraz `openclaw browser start --headless` żądają
  jednorazowego uruchomienia headless dla lokalnych profili zarządzanych bez przepisywania
  `browser.headless` ani konfiguracji profilu. Profile istniejącej sesji, tylko do podłączenia oraz
  zdalne profile CDP odrzucają to nadpisanie, ponieważ OpenClaw nie uruchamia tych
  procesów przeglądarki.
- Na hostach Linux bez `DISPLAY` lub `WAYLAND_DISPLAY` lokalne profile zarządzane
  domyślnie automatycznie przechodzą w tryb headless, gdy ani środowisko, ani konfiguracja profilu/globalna
  nie wybiera jawnie trybu z interfejsem. `openclaw browser status --json`
  raportuje `headlessSource` jako `env`, `profile`, `config`,
  `request`, `linux-display-fallback` lub `default`.
- `OPENCLAW_BROWSER_HEADLESS=1` wymusza uruchamianie lokalnych profili zarządzanych w trybie headless dla
  bieżącego procesu. `OPENCLAW_BROWSER_HEADLESS=0` wymusza tryb z interfejsem dla zwykłych
  uruchomień i zwraca możliwy do wykonania błąd na hostach Linux bez serwera wyświetlania;
  jawne żądanie `start --headless` nadal ma pierwszeństwo dla tego jednego uruchomienia.
- `executablePath` można ustawić globalnie lub dla każdego lokalnego profilu zarządzanego. Wartości profilu zastępują `browser.executablePath`, więc różne profile zarządzane mogą uruchamiać różne przeglądarki oparte na Chromium. Obie formy akceptują `~` jako katalog domowy systemu operacyjnego.
- `color` (najwyższego poziomu i profilu) zabarwia interfejs przeglądarki, aby było widać, który profil jest aktywny.
- Domyślny profil to `openclaw` (zarządzany autonomiczny). Użyj `defaultProfile: "user"`, aby wybrać przeglądarkę zalogowanego użytkownika.
- Kolejność automatycznego wykrywania: domyślna przeglądarka systemowa, jeśli jest oparta na Chromium; w przeciwnym razie Chrome → Brave → Edge → Chromium → Chrome Canary.
- `driver: "existing-session"` używa Chrome DevTools MCP zamiast surowego CDP. Nie ustawiaj `cdpUrl` dla tego sterownika.
- Ustaw `browser.profiles.<name>.userDataDir`, gdy profil istniejącej sesji powinien podłączać się do niedomyślnego profilu użytkownika Chromium (Brave, Edge itd.). Ta ścieżka także akceptuje `~` jako katalog domowy systemu operacyjnego.

</Accordion>

</AccordionGroup>

## Używanie Brave lub innej przeglądarki opartej na Chromium

Jeśli Twoja **systemowa domyślna** przeglądarka jest oparta na Chromium (Chrome/Brave/Edge/itd.),
OpenClaw używa jej automatycznie. Ustaw `browser.executablePath`, aby nadpisać
automatyczne wykrywanie. Wartości `executablePath` najwyższego poziomu i profilu akceptują `~`
jako katalog domowy systemu operacyjnego:

```bash
openclaw config set browser.executablePath "/usr/bin/google-chrome"
openclaw config set browser.profiles.work.executablePath "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome"
```

Albo ustaw to w konfiguracji, według platformy:

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

`executablePath` profilu wpływa tylko na lokalne profile zarządzane, które OpenClaw
uruchamia. Profile `existing-session` podłączają się zamiast tego do już działającej przeglądarki,
a zdalne profile CDP używają przeglądarki wskazanej przez `cdpUrl`.

## Sterowanie lokalne a zdalne

- **Sterowanie lokalne (domyślne):** Gateway uruchamia usługę sterowania loopback i może uruchomić lokalną przeglądarkę.
- **Sterowanie zdalne (host Node):** uruchom host Node na maszynie, która ma przeglądarkę; Gateway pośredniczy w akcjach przeglądarki do niego.
- **Zdalny CDP:** ustaw `browser.profiles.<name>.cdpUrl` (lub `browser.cdpUrl`), aby
  podłączyć się do zdalnej przeglądarki opartej na Chromium. W tym przypadku OpenClaw nie uruchomi lokalnej przeglądarki.
- Dla zewnętrznie zarządzanych usług CDP na loopback (na przykład Browserless w
  Docker opublikowanym na `127.0.0.1`) ustaw także `attachOnly: true`. CDP na loopback
  bez `attachOnly` jest traktowany jako lokalny profil przeglądarki zarządzany przez OpenClaw.
- `headless` wpływa tylko na lokalne profile zarządzane, które OpenClaw uruchamia. Nie restartuje ani nie zmienia przeglądarek istniejącej sesji ani zdalnych CDP.
- `executablePath` stosuje tę samą regułę lokalnego profilu zarządzanego. Zmiana go w
  działającym lokalnym profilu zarządzanym oznacza ten profil do restartu/uzgodnienia, aby
  następne uruchomienie użyło nowego pliku binarnego.

Zachowanie zatrzymywania różni się w zależności od trybu profilu:

- lokalne profile zarządzane: `openclaw browser stop` zatrzymuje proces przeglądarki, który
  uruchomił OpenClaw
- profile tylko do podłączenia i zdalne profile CDP: `openclaw browser stop` zamyka aktywną
  sesję sterowania i zwalnia nadpisania emulacji Playwright/CDP (viewport,
  schemat kolorów, ustawienia regionalne, strefa czasowa, tryb offline i podobny stan), mimo
  że OpenClaw nie uruchomił żadnego procesu przeglądarki

Zdalne URL-e CDP mogą zawierać uwierzytelnianie:

- Tokeny zapytania (np. `https://provider.example?token=<token>`)
- Uwierzytelnianie HTTP Basic (np. `https://user:pass@provider.example`)

OpenClaw zachowuje dane uwierzytelniania podczas wywoływania endpointów `/json/*` oraz podczas łączenia
z WebSocket CDP. Preferuj zmienne środowiskowe lub menedżery sekretów dla
tokenów zamiast commitowania ich do plików konfiguracji.

## Proxy przeglądarki Node (domyślne bez konfiguracji)

Jeśli uruchomisz **host Node** na maszynie, która ma Twoją przeglądarkę, OpenClaw może
automatycznie kierować wywołania narzędzi przeglądarki do tego Node bez dodatkowej konfiguracji przeglądarki.
To domyślna ścieżka dla zdalnych Gateway.

Uwagi:

- Host Node udostępnia swój lokalny serwer sterowania przeglądarką przez **polecenie proxy**.
- Profile pochodzą z własnej konfiguracji `browser.profiles` Node (tak samo jak lokalnie).
- `nodeHost.browserProxy.allowProfiles` jest opcjonalne. Pozostaw puste dla starszego/domyślnego zachowania: wszystkie skonfigurowane profile pozostają osiągalne przez proxy, w tym trasy tworzenia/usuwania profili.
- Jeśli ustawisz `nodeHost.browserProxy.allowProfiles`, OpenClaw traktuje to jako granicę najmniejszych uprawnień: tylko profile z listy dozwolonych mogą być celem, a trwałe trasy tworzenia/usuwania profili są blokowane na powierzchni proxy.
- Wyłącz, jeśli tego nie chcesz:
  - Na Node: `nodeHost.browserProxy.enabled=false`
  - Na Gateway: `gateway.nodes.browser.mode="off"`

## Browserless (hostowany zdalny CDP)

[Browserless](https://browserless.io) to hostowana usługa Chromium, która udostępnia
URL-e połączenia CDP przez HTTPS i WebSocket. OpenClaw może używać obu form, ale
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
- Wybierz endpoint regionu zgodny z Twoim kontem Browserless (zobacz ich dokumentację).
- Jeśli Browserless podaje URL bazowy HTTPS, możesz albo przekonwertować go na
  `wss://` dla bezpośredniego połączenia CDP, albo zostawić URL HTTPS i pozwolić OpenClaw
  wykryć `/json/version`.

### Browserless Docker na tym samym hoście

Gdy Browserless jest self-hosted w Docker, a OpenClaw działa na hoście, traktuj
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
OpenClaw. Browserless musi również ogłaszać zgodny osiągalny endpoint;
ustaw `EXTERNAL` Browserless na tę samą bazę WebSocket publiczną względem OpenClaw, taką
jak `ws://127.0.0.1:3000`, `ws://browserless:3000` albo stabilny prywatny adres sieci
Docker. Jeśli `/json/version` zwraca `webSocketDebuggerUrl` wskazujący
adres, którego OpenClaw nie może osiągnąć, HTTP CDP może wyglądać poprawnie, podczas gdy podłączenie
WebSocket nadal się nie powiedzie.

Nie zostawiaj `attachOnly` nieustawionego dla profilu Browserless na loopback. Bez
`attachOnly` OpenClaw traktuje port loopback jako lokalny profil przeglądarki zarządzany
i może raportować, że port jest używany, ale nie należy do OpenClaw.

## Bezpośredni dostawcy WebSocket CDP

Niektóre hostowane usługi przeglądarek udostępniają **bezpośredni endpoint WebSocket** zamiast
standardowego wykrywania CDP opartego na HTTP (`/json/version`). OpenClaw akceptuje trzy
kształty URL CDP i automatycznie wybiera właściwą strategię połączenia:

- **Wykrywanie HTTP(S)** - `http://host[:port]` lub `https://host[:port]`.
  OpenClaw wywołuje `/json/version`, aby wykryć URL debuggera WebSocket, a następnie
  się łączy. Bez fallbacku WebSocket.
- **Bezpośrednie endpointy WebSocket** - `ws://host[:port]/devtools/<kind>/<id>` lub
  `wss://...` ze ścieżką `/devtools/browser|page|worker|shared_worker|service_worker/<id>`.
  OpenClaw łączy się bezpośrednio przez handshake WebSocket i całkowicie pomija
  `/json/version`.
- **Gołe korzenie WebSocket** - `ws://host[:port]` lub `wss://host[:port]` bez
  ścieżki `/devtools/...` (np. [Browserless](https://browserless.io),
  [Browserbase](https://www.browserbase.com)). OpenClaw najpierw próbuje wykrywania HTTP
  `/json/version` (normalizując schemat do `http`/`https`);
  jeśli wykrywanie zwróci `webSocketDebuggerUrl`, jest on używany, w przeciwnym razie OpenClaw
  przechodzi awaryjnie do bezpośredniego handshake WebSocket na gołym korzeniu. Jeśli ogłaszany
  endpoint WebSocket odrzuca handshake CDP, ale skonfigurowany goły korzeń
  go akceptuje, OpenClaw także przechodzi awaryjnie do tego korzenia. Dzięki temu goły `ws://`
  wskazujący lokalnego Chrome nadal może się połączyć, ponieważ Chrome akceptuje ulepszenia WebSocket
  tylko na konkretnej ścieżce per target z `/json/version`, podczas gdy hostowani
  dostawcy nadal mogą używać swojego głównego endpointu WebSocket, gdy ich endpoint wykrywania
  ogłasza krótkotrwały URL, który nie nadaje się dla Playwright CDP.

### Browserbase

[Browserbase](https://www.browserbase.com) to platforma chmurowa do uruchamiania
przeglądarek headless z wbudowanym rozwiązywaniem CAPTCHA, trybem stealth i rezydencyjnymi
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
- Browserbase automatycznie tworzy sesję przeglądarki przy połączeniu WebSocket, więc żaden
  ręczny krok tworzenia sesji nie jest potrzebny.
- Warstwa bezpłatna pozwala na jedną równoczesną sesję i jedną godzinę przeglądarki miesięcznie.
  Zobacz [cennik](https://www.browserbase.com/pricing), aby poznać limity planów płatnych.
- Zobacz [dokumentację Browserbase](https://docs.browserbase.com), aby uzyskać pełną referencję
  API, przewodniki SDK i przykłady integracji.

## Bezpieczeństwo

Kluczowe idee:

- Sterowanie przeglądarką jest dostępne tylko przez loopback; dostęp odbywa się przez uwierzytelnianie Gateway lub parowanie węzła.
- Samodzielne HTTP API przeglądarki loopback używa **wyłącznie uwierzytelniania za pomocą współdzielonego sekretu**:
  uwierzytelniania bearer tokenem Gateway, `x-openclaw-password` albo HTTP Basic auth z
  skonfigurowanym hasłem Gateway.
- Nagłówki tożsamości Tailscale Serve oraz `gateway.auth.mode: "trusted-proxy"` **nie**
  uwierzytelniają tego samodzielnego API przeglądarki loopback.
- Jeśli sterowanie przeglądarką jest włączone i nie skonfigurowano uwierzytelniania
  za pomocą współdzielonego sekretu, OpenClaw automatycznie generuje `gateway.auth.token`
  przy uruchomieniu i zapisuje go trwale w konfiguracji.
- OpenClaw **nie** generuje automatycznie tego tokenu, gdy `gateway.auth.mode` ma już wartość
  `password`, `none` albo `trusted-proxy`.
- Trzymaj Gateway oraz wszystkie hosty węzłów w sieci prywatnej (Tailscale); unikaj wystawiania publicznego.
- Traktuj zdalne adresy URL/tokeny CDP jako sekrety; preferuj zmienne środowiskowe albo menedżer sekretów.

Wskazówki dotyczące zdalnego CDP:

- Preferuj szyfrowane punkty końcowe (HTTPS albo WSS) i krótkotrwałe tokeny, gdy to możliwe.
- Unikaj osadzania długotrwałych tokenów bezpośrednio w plikach konfiguracyjnych.

## Profile (wiele przeglądarek)

OpenClaw obsługuje wiele nazwanych profili (konfiguracji routingu). Profile mogą być:

- **zarządzane przez openclaw**: dedykowana instancja przeglądarki opartej na Chromium z własnym katalogiem danych użytkownika i portem CDP
- **zdalne**: jawny adres URL CDP (przeglądarka oparta na Chromium działająca gdzie indziej)
- **istniejąca sesja**: Twój istniejący profil Chrome przez automatyczne połączenie Chrome DevTools MCP

Domyślne ustawienia:

- Profil `openclaw` jest tworzony automatycznie, jeśli go brakuje.
- Profil `user` jest wbudowany do podłączania istniejącej sesji Chrome MCP.
- Profile istniejących sesji poza `user` są opcjonalne; twórz je za pomocą `--driver existing-session`.
- Lokalne porty CDP są domyślnie przydzielane z zakresu **18800-18899**.
- Usunięcie profilu przenosi jego lokalny katalog danych do Kosza.

Wszystkie punkty końcowe sterowania akceptują `?profile=<name>`; CLI używa `--browser-profile`.

## Istniejąca sesja przez Chrome DevTools MCP

OpenClaw może także podłączyć się do uruchomionego profilu przeglądarki opartej na Chromium przez
oficjalny serwer Chrome DevTools MCP. Pozwala to ponownie użyć kart i stanu logowania,
które są już otwarte w tym profilu przeglądarki.

Oficjalne materiały wprowadzające i referencje konfiguracji:

- [Chrome for Developers: Używanie Chrome DevTools MCP z sesją przeglądarki](https://developer.chrome.com/blog/chrome-devtools-mcp-debug-your-browser-session)
- [README Chrome DevTools MCP](https://github.com/ChromeDevTools/chrome-devtools-mcp)

Wbudowany profil:

- `user`

Opcjonalnie: utwórz własny niestandardowy profil istniejącej sesji, jeśli chcesz mieć
inną nazwę, kolor albo katalog danych przeglądarki.

Domyślne zachowanie:

- Wbudowany profil `user` używa automatycznego połączenia Chrome MCP, które wskazuje
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
3. Pozostaw przeglądarkę uruchomioną i zaakceptuj monit o połączenie, gdy OpenClaw się podłączy.

Typowe strony inspekcji:

- Chrome: `chrome://inspect/#remote-debugging`
- Brave: `brave://inspect/#remote-debugging`
- Edge: `edge://inspect/#remote-debugging`

Szybki test podłączenia na żywo:

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

Co sprawdzić, jeśli podłączenie nie działa:

- docelowa przeglądarka oparta na Chromium ma wersję `144+`
- zdalne debugowanie jest włączone na stronie inspekcji tej przeglądarki
- przeglądarka pokazała monit zgody na podłączenie i został on zaakceptowany
- `openclaw doctor` migruje starą konfigurację przeglądarki opartą na rozszerzeniu i sprawdza, czy
  Chrome jest zainstalowany lokalnie dla domyślnych profili automatycznego połączenia, ale nie może
  włączyć za Ciebie zdalnego debugowania po stronie przeglądarki

Użycie przez agenta:

- Użyj `profile="user"`, gdy potrzebujesz stanu przeglądarki zalogowanego użytkownika.
- Jeśli używasz niestandardowego profilu istniejącej sesji, przekaż tę jawną nazwę profilu.
- Wybieraj ten tryb tylko wtedy, gdy użytkownik jest przy komputerze, aby zatwierdzić monit
  o podłączenie.
- Gateway albo host węzła może uruchomić `npx chrome-devtools-mcp@latest --autoConnect`

Uwagi:

- Ta ścieżka jest bardziej ryzykowna niż izolowany profil `openclaw`, ponieważ może
  działać w zalogowanej sesji przeglądarki.
- OpenClaw nie uruchamia przeglądarki dla tego sterownika; tylko się podłącza.
- OpenClaw używa tutaj oficjalnego przepływu Chrome DevTools MCP `--autoConnect`. Jeśli
  ustawiono `userDataDir`, jest ono przekazywane dalej, aby wskazać ten katalog danych użytkownika.
- Istniejąca sesja może zostać podłączona na wybranym hoście albo przez połączony
  węzeł przeglądarki. Jeśli Chrome działa gdzie indziej i nie jest połączony żaden węzeł przeglądarki, użyj
  zdalnego CDP albo hosta węzła.

### Niestandardowe uruchamianie Chrome MCP

Nadpisz uruchamiany serwer Chrome DevTools MCP dla profilu, gdy domyślny
przepływ `npx chrome-devtools-mcp@latest` nie jest tym, czego chcesz (hosty offline,
przypięte wersje, binaria dostarczane z projektem):

| Pole         | Co robi                                                                                                                   |
| ------------ | -------------------------------------------------------------------------------------------------------------------------- |
| `mcpCommand` | Plik wykonywalny do uruchomienia zamiast `npx`. Rozwiązywany bez zmian; ścieżki bezwzględne są respektowane.             |
| `mcpArgs`    | Tablica argumentów przekazywana dosłownie do `mcpCommand`. Zastępuje domyślne argumenty `chrome-devtools-mcp@latest --autoConnect`. |

Gdy `cdpUrl` jest ustawiony w profilu istniejącej sesji, OpenClaw pomija
`--autoConnect` i automatycznie przekazuje punkt końcowy do Chrome MCP:

- `http(s)://...` → `--browserUrl <url>` (punkt końcowy wykrywania HTTP DevTools).
- `ws(s)://...` → `--wsEndpoint <url>` (bezpośredni WebSocket CDP).

Flag punktu końcowego i `userDataDir` nie można łączyć: gdy ustawiono `cdpUrl`,
`userDataDir` jest ignorowane przy uruchamianiu Chrome MCP, ponieważ Chrome MCP podłącza się do
uruchomionej przeglądarki stojącej za punktem końcowym, zamiast otwierać katalog
profilu.

<Accordion title="Ograniczenia funkcji istniejącej sesji">

W porównaniu z zarządzanym profilem `openclaw` sterowniki istniejącej sesji są bardziej ograniczone:

- **Zrzuty ekranu** - przechwytywanie stron i przechwytywanie elementów `--ref` działają; selektory CSS `--element` nie działają. `--full-page` nie można łączyć z `--ref` ani `--element`. Playwright nie jest wymagany do zrzutów ekranu strony ani elementów opartych na referencjach.
- **Akcje** - `click`, `type`, `hover`, `scrollIntoView`, `drag` i `select` wymagają referencji ze snapshotu (bez selektorów CSS). `click-coords` klika współrzędne widocznego viewportu i nie wymaga referencji ze snapshotu. `click` obsługuje tylko lewy przycisk. `type` nie obsługuje `slowly=true`; użyj `fill` albo `press`. `press` nie obsługuje `delayMs`. `type`, `hover`, `scrollIntoView`, `drag`, `select`, `fill` i `evaluate` nie obsługują limitów czasu dla pojedynczego wywołania. `select` akceptuje pojedynczą wartość.
- **Oczekiwanie / przesyłanie / dialog** - `wait --url` obsługuje wzorce dokładne, podciągu i glob; `wait --load networkidle` nie jest obsługiwane. Hooki przesyłania wymagają `ref` albo `inputRef`, jednego pliku naraz, bez CSS `element`. Hooki dialogów nie obsługują nadpisań limitu czasu.
- **Funkcje tylko dla trybu zarządzanego** - akcje wsadowe, eksport PDF, przechwytywanie pobrań i `responsebody` nadal wymagają ścieżki zarządzanej przeglądarki.

</Accordion>

## Gwarancje izolacji

- **Dedykowany katalog danych użytkownika**: nigdy nie dotyka Twojego osobistego profilu przeglądarki.
- **Dedykowane porty**: unika `9222`, aby zapobiec kolizjom z przepływami deweloperskimi.
- **Deterministyczne sterowanie kartami**: `tabs` zwraca najpierw `suggestedTargetId`, a następnie
  stabilne uchwyty `tabId`, takie jak `t1`, opcjonalne etykiety i surowe `targetId`.
  Agenci powinni ponownie używać `suggestedTargetId`; surowe identyfikatory pozostają dostępne do
  debugowania i zgodności.

## Wybór przeglądarki

Podczas uruchamiania lokalnie OpenClaw wybiera pierwszą dostępną:

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
  `/usr/lib/chromium-browser`.
- Windows: sprawdza typowe lokalizacje instalacji.

## API sterowania (opcjonalne)

Do skryptowania i debugowania Gateway udostępnia małe **HTTP API sterowania
dostępne tylko przez loopback** oraz odpowiadające mu CLI `openclaw browser`
(snapshoty, referencje, rozszerzenia oczekiwania, wyjście JSON, przepływy debugowania). Zobacz
[API sterowania przeglądarką](/pl/tools/browser-control), aby uzyskać pełną referencję.

## Rozwiązywanie problemów

Problemy specyficzne dla Linuksa (zwłaszcza snap Chromium) opisuje
[Rozwiązywanie problemów z przeglądarką](/pl/tools/browser-linux-troubleshooting).

Konfiguracje dzielonego hosta WSL2 Gateway + Windows Chrome opisuje
[Rozwiązywanie problemów z WSL2 + Windows + zdalnym Chrome CDP](/pl/tools/browser-wsl2-windows-remote-cdp-troubleshooting).

### Błąd uruchamiania CDP a blokada SSRF nawigacji

To różne klasy błędów i wskazują na różne ścieżki kodu.

- **Błąd uruchamiania albo gotowości CDP** oznacza, że OpenClaw nie może potwierdzić, że płaszczyzna sterowania przeglądarką jest zdrowa.
- **Blokada SSRF nawigacji** oznacza, że płaszczyzna sterowania przeglądarką jest zdrowa, ale docelowa nawigacja strony jest odrzucana przez zasady.

Typowe przykłady:

- Błąd uruchamiania albo gotowości CDP:
  - `Chrome CDP websocket for profile "openclaw" is not reachable after start`
  - `Remote CDP for profile "<name>" is not reachable at <cdpUrl>`
  - `Port <port> is in use for profile "<name>" but not by openclaw` gdy
    zewnętrzna usługa CDP na loopback jest skonfigurowana bez `attachOnly: true`
- Blokada SSRF nawigacji:
  - przepływy `open`, `navigate`, snapshotu albo otwierania kart kończą się błędem zasad przeglądarki/sieci, podczas gdy `start` i `tabs` nadal działają

Użyj tej minimalnej sekwencji, aby rozdzielić te dwa przypadki:

```bash
openclaw browser --browser-profile openclaw start
openclaw browser --browser-profile openclaw tabs
openclaw browser --browser-profile openclaw open https://example.com
```

Jak interpretować wyniki:

- Jeśli `start` kończy się błędem `not reachable after start`, najpierw rozwiąż problem gotowości CDP.
- Jeśli `start` się powiedzie, ale `tabs` się nie powiedzie, płaszczyzna sterowania nadal jest niezdrowa. Traktuj to jako problem osiągalności CDP, a nie problem nawigacji strony.
- Jeśli `start` i `tabs` się powiodą, ale `open` albo `navigate` się nie powiedzie, płaszczyzna sterowania przeglądarką działa, a błąd dotyczy zasad nawigacji albo strony docelowej.
- Jeśli `start`, `tabs` i `open` wszystkie się powiodą, podstawowa ścieżka sterowania zarządzaną przeglądarką jest zdrowa.

Ważne szczegóły zachowania:

- Konfiguracja przeglądarki domyślnie używa obiektu zasad SSRF zamkniętego w razie błędu, nawet gdy nie konfigurujesz `browser.ssrfPolicy`.
- Dla lokalnego profilu zarządzanego `openclaw` na loopback kontrole kondycji CDP celowo pomijają egzekwowanie osiągalności SSRF przeglądarki dla własnej lokalnej płaszczyzny sterowania OpenClaw.
- Ochrona nawigacji jest oddzielna. Pomyślny wynik `start` albo `tabs` nie oznacza, że późniejszy cel `open` albo `navigate` jest dozwolony.

Wytyczne bezpieczeństwa:

- **Nie** rozluźniaj domyślnie zasad SSRF przeglądarki.
- Preferuj wąskie wyjątki hostów, takie jak `hostnameAllowlist` albo `allowedHostnames`, zamiast szerokiego dostępu do sieci prywatnej.
- Używaj `dangerouslyAllowPrivateNetwork: true` tylko w celowo zaufanych środowiskach, w których dostęp przeglądarki do sieci prywatnej jest wymagany i sprawdzony.

## Narzędzia agenta i działanie sterowania

Agent dostaje **jedno narzędzie** do automatyzacji przeglądarki:

- `browser` - doctor/status/start/stop/tabs/open/focus/close/snapshot/screenshot/navigate/act

Jak jest mapowane:

- `browser snapshot` zwraca stabilne drzewo interfejsu użytkownika (AI lub ARIA).
- `browser act` używa identyfikatorów `ref` z migawki do klikania, wpisywania, przeciągania i wybierania.
- `browser screenshot` przechwytuje piksele (całą stronę, element lub oznaczone odwołania).
- `browser doctor` sprawdza gotowość Gateway, Plugin, profilu, przeglądarki i karty.
- `browser` akceptuje:
  - `profile`, aby wybrać nazwany profil przeglądarki (openclaw, chrome lub zdalny CDP).
  - `target` (`sandbox` | `host` | `node`), aby wybrać, gdzie znajduje się przeglądarka.
  - W sesjach w piaskownicy `target: "host"` wymaga `agents.defaults.sandbox.browser.allowHostControl=true`.
  - Jeśli `target` zostanie pominięty: sesje w piaskownicy domyślnie używają `sandbox`, a sesje poza piaskownicą domyślnie używają `host`.
  - Jeśli połączony jest Node obsługujący przeglądarkę, narzędzie może automatycznie skierować do niego ruch, chyba że przypniesz `target="host"` lub `target="node"`.

Dzięki temu agent pozostaje deterministyczny i unika kruchych selektorów.

## Powiązane

- [Przegląd narzędzi](/pl/tools) - wszystkie dostępne narzędzia agenta
- [Izolacja w piaskownicy](/pl/gateway/sandboxing) - sterowanie przeglądarką w środowiskach piaskownicy
- [Bezpieczeństwo](/pl/gateway/security) - ryzyka związane ze sterowaniem przeglądarką i utwardzanie
