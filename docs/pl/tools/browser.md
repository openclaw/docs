---
read_when:
    - Dodawanie automatyzacji przeglądarki kontrolowanej przez agenta
    - Debugowanie, dlaczego openclaw zakłóca działanie Twojego Chrome
    - Implementowanie ustawień przeglądarki i cyklu życia w aplikacji macOS
summary: Zintegrowana usługa sterowania przeglądarką + polecenia akcji
title: Przeglądarka (zarządzana przez OpenClaw)
x-i18n:
    generated_at: "2026-06-27T18:24:42Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 2d24586c4ac1e271c24511be98e30725f4f589e9f5e703294190058bc3e6a123
    source_path: tools/browser.md
    workflow: 16
---

OpenClaw może uruchamiać **dedykowany profil Chrome/Brave/Edge/Chromium**, którym steruje agent.
Jest on odizolowany od Twojej osobistej przeglądarki i zarządzany przez małą lokalną
usługę sterującą wewnątrz Gateway (tylko loopback).

Widok dla początkujących:

- Pomyśl o tym jak o **osobnej przeglądarce tylko dla agenta**.
- Profil `openclaw` **nie** dotyka Twojego osobistego profilu przeglądarki.
- Agent może **otwierać karty, czytać strony, klikać i pisać** w bezpiecznym torze.
- Wbudowany profil `user` podłącza się do Twojej prawdziwej zalogowanej sesji Chrome przez Chrome MCP.

## Co otrzymujesz

- Osobny profil przeglądarki o nazwie **openclaw** (domyślnie z pomarańczowym akcentem).
- Deterministyczne sterowanie kartami (lista/otwórz/ustaw fokus/zamknij).
- Akcje agenta (kliknięcie/pisanie/przeciąganie/wybór), migawki, zrzuty ekranu, pliki PDF.
- Wbudowany Skills `browser-automation`, który uczy agentów pętli odzyskiwania
  migawek, stabilnych kart, nieaktualnych referencji i ręcznych blokad, gdy
  Plugin przeglądarki jest włączony.
- Opcjonalną obsługę wielu profili (`openclaw`, `work`, `remote`, ...).

Ta przeglądarka **nie** jest Twoją codzienną przeglądarką. To bezpieczna,
odizolowana powierzchnia do automatyzacji i weryfikacji przez agenta.

## Szybki start

```bash
openclaw browser --browser-profile openclaw doctor
openclaw browser --browser-profile openclaw doctor --deep
openclaw browser --browser-profile openclaw status
openclaw browser --browser-profile openclaw start
openclaw browser --browser-profile openclaw open https://example.com
openclaw browser --browser-profile openclaw snapshot
```

Jeśli otrzymasz komunikat „Browser disabled”, włącz ją w konfiguracji (zobacz niżej) i uruchom ponownie
Gateway.

Jeśli `openclaw browser` całkowicie brakuje albo agent mówi, że narzędzie przeglądarki
jest niedostępne, przejdź do sekcji [Brak polecenia lub narzędzia przeglądarki](/pl/tools/browser#missing-browser-command-or-tool).

## Kontrola Pluginu

Domyślne narzędzie `browser` jest wbudowanym Pluginem. Wyłącz je, aby zastąpić je innym Pluginem, który rejestruje tę samą nazwę narzędzia `browser`:

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

Wartości domyślne wymagają zarówno `plugins.entries.browser.enabled`, **jak i** `browser.enabled=true`. Wyłączenie tylko Pluginu usuwa CLI `openclaw browser`, metodę Gateway `browser.request`, narzędzie agenta i usługę sterującą jako jedną całość; Twoja konfiguracja `browser.*` pozostaje nienaruszona dla zamiennika.

Zmiany konfiguracji przeglądarki wymagają ponownego uruchomienia Gateway, aby Plugin mógł ponownie zarejestrować swoją usługę.

## Wskazówki dla agenta

Uwaga dotycząca profilu narzędzi: `tools.profile: "coding"` obejmuje `web_search` i
`web_fetch`, ale nie obejmuje pełnego narzędzia `browser`. Jeśli agent albo
uruchomiony subagent powinien używać automatyzacji przeglądarki, dodaj przeglądarkę na etapie
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
Samo `tools.subagents.tools.allow: ["browser"]` nie wystarcza, ponieważ polityka
subagenta jest stosowana po filtrowaniu profilu.

Plugin przeglądarki dostarcza dwa poziomy wskazówek dla agenta:

- Opis narzędzia `browser` zawiera zwięzły, zawsze aktywny kontrakt: wybierz
  właściwy profil, trzymaj referencje na tej samej karcie, używaj `tabId`/etykiet do
  celowania w karty i wczytaj Skills przeglądarki do pracy wieloetapowej.
- Wbudowany Skills `browser-automation` zawiera dłuższą pętlę operacyjną:
  najpierw sprawdź status/karty, oznacz karty zadania etykietami, wykonaj migawkę przed działaniem,
  ponownie wykonaj migawkę po zmianach UI, raz odzyskaj nieaktualne referencje i zgłaszaj blokady logowania/2FA/captcha albo
  kamery/mikrofonu jako wymagające ręcznego działania zamiast zgadywać.

Skills dołączone do Pluginu są wymienione w dostępnych Skills agenta, gdy
Plugin jest włączony. Pełne instrukcje Skills są wczytywane na żądanie, więc rutynowe
tury nie ponoszą pełnego kosztu tokenów.

## Brak polecenia lub narzędzia przeglądarki

Jeśli po uaktualnieniu `openclaw browser` jest nieznane, brakuje `browser.request` albo agent zgłasza narzędzie przeglądarki jako niedostępne, zwykle przyczyną jest lista `plugins.allow`, która pomija `browser`, oraz brak głównego bloku konfiguracji `browser`. Dodaj go:

```json5
{
  plugins: {
    allow: ["telegram", "browser"],
  },
}
```

Jawny główny blok `browser`, na przykład `browser.enabled=true` lub `browser.profiles.<name>`, aktywuje wbudowany Plugin przeglądarki nawet przy restrykcyjnym `plugins.allow`, zgodnie z zachowaniem konfiguracji kanałów. `plugins.entries.browser.enabled=true` i `tools.alsoAllow: ["browser"]` same w sobie nie zastępują członkostwa na liście dozwolonych. Całkowite usunięcie `plugins.allow` również przywraca ustawienie domyślne.

## Profile: `openclaw` kontra `user`

- `openclaw`: zarządzana, odizolowana przeglądarka (bez wymagania rozszerzenia).
- `user`: wbudowany profil dołączania Chrome MCP dla Twojej **prawdziwej zalogowanej sesji Chrome**.

Dla wywołań narzędzia przeglądarki przez agenta:

- Domyślnie: użyj odizolowanej przeglądarki `openclaw`.
- Preferuj `profile="user"`, gdy istniejące zalogowane sesje mają znaczenie, a użytkownik
  jest przy komputerze, aby kliknąć/zatwierdzić ewentualny monit dołączenia.
- `profile` jest jawnym nadpisaniem, gdy chcesz użyć konkretnego trybu przeglądarki.

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

### Wizja zrzutów ekranu (obsługa modeli tylko tekstowych)

Gdy główny model jest tylko tekstowy (bez obsługi wizji/multimodalnej), zrzuty ekranu
przeglądarki zwracają bloki obrazów, których model nie może odczytać. Zrzuty ekranu przeglądarki
ponownie wykorzystują istniejącą konfigurację rozumienia obrazów, więc model obrazu
skonfigurowany do rozumienia multimediów może opisywać zrzuty ekranu jako tekst bez żadnych
ustawień modelu specyficznych dla przeglądarki.

```json5
{
  tools: {
    media: {
      image: {
        models: [
          { provider: "bytedance", model: "doubao-seed-2.0-pro" },
          // Add fallback candidates; first success wins
          { provider: "openai", model: "gpt-4o" },
        ],
      },
      // Shared media models also work when tagged for image support.
      // models: [{ provider: "openai", model: "gpt-4o", capabilities: ["image"] }],
    },
  },
  agents: {
    defaults: {
      // Existing image-model defaults are also honored.
      // imageModel: { primary: "openai/gpt-4o" },
    },
  },
}
```

**Jak to działa:**

1. Agent wywołuje `browser screenshot` → obraz jest jak zwykle zapisywany na dysku.
2. Narzędzie przeglądarki pyta istniejące środowisko uruchomieniowe rozumienia obrazów, czy
   może opisać zrzut ekranu przy użyciu skonfigurowanych modeli obrazów mediów, współdzielonych modeli mediów,
   domyślnych modeli obrazów albo dostawcy obrazu opartego na autoryzacji.
3. Model wizyjny zwraca opis tekstowy, który jest opakowywany za pomocą
   `wrapExternalContent` (ochrona przed wstrzyknięciem do promptu) i zwracany agentowi
   jako blok tekstowy zamiast bloku obrazu.
4. Jeśli rozumienie obrazu jest niedostępne, pominięte albo zawiedzie, przeglądarka wraca
   do zwracania oryginalnego bloku obrazu.

Użyj istniejących pól `tools.media.image` / `tools.media.models` dla zapasowych modeli,
limitów czasu, limitów bajtów, profili i ustawień żądań dostawcy.

Jeśli aktywny główny model już obsługuje wizję i nie skonfigurowano jawnego modelu
rozumienia obrazu, OpenClaw zachowuje normalny wynik obrazu, aby
główny model mógł bezpośrednio odczytać zrzut ekranu.

<AccordionGroup>

<Accordion title="Porty i osiągalność">

- Usługa sterująca wiąże się z loopback na porcie wyprowadzonym z `gateway.port` (domyślnie `18791` = gateway + 2). Nadpisanie `gateway.port` lub `OPENCLAW_GATEWAY_PORT` przesuwa wyprowadzone porty w tej samej rodzinie.
- Lokalne profile `openclaw` automatycznie przypisują `cdpPort`/`cdpUrl`; ustawiaj je tylko dla
  zdalnych profili CDP albo dołączania do punktu końcowego istniejącej sesji. `cdpUrl` domyślnie wskazuje
  zarządzany lokalny port CDP, gdy nie jest ustawiony.
- `remoteCdpTimeoutMs` dotyczy zdalnych i `attachOnly` sprawdzeń osiągalności HTTP CDP
  oraz żądań HTTP otwierających karty; `remoteCdpHandshakeTimeoutMs` dotyczy
  ich uzgadniania CDP WebSocket.
- `localLaunchTimeoutMs` to budżet czasu dla lokalnie uruchomionego zarządzanego procesu Chrome,
  aby wystawił swój punkt końcowy HTTP CDP. `localCdpReadyTimeoutMs` to
  kolejny budżet na gotowość websocket CDP po wykryciu procesu.
  Zwiększ te wartości na Raspberry Pi, słabszym VPS albo starszym sprzęcie, gdzie Chromium
  uruchamia się wolno. Wartości muszą być dodatnimi liczbami całkowitymi do `120000` ms; nieprawidłowe
  wartości konfiguracji są odrzucane.
- Powtarzające się niepowodzenia uruchomienia/gotowości zarządzanego Chrome są przerywane obwodowo dla każdego
  profilu. Po kilku kolejnych niepowodzeniach OpenClaw na krótko wstrzymuje nowe próby
  uruchomienia zamiast tworzyć proces Chromium przy każdym wywołaniu narzędzia przeglądarki. Napraw
  problem z uruchamianiem, wyłącz przeglądarkę, jeśli nie jest potrzebna, albo uruchom ponownie
  Gateway po naprawie.
- `actionTimeoutMs` to domyślny budżet czasu dla żądań `act` przeglądarki, gdy wywołujący nie przekazuje `timeoutMs`. Transport klienta dodaje małe okno zapasu, aby długie oczekiwania mogły się zakończyć zamiast przekroczyć czas na granicy HTTP.
- `tabCleanup` to sprzątanie best-effort dla kart otwartych przez sesje przeglądarki głównego agenta. Sprzątanie cyklu życia subagentów, cron i ACP nadal zamyka ich jawnie śledzone karty na końcu sesji; sesje główne utrzymują aktywne karty jako możliwe do ponownego użycia, a następnie zamykają bezczynne lub nadmiarowe śledzone karty w tle.

</Accordion>

<Accordion title="Polityka SSRF">

- Nawigacja przeglądarki i otwieranie kart są chronione przed SSRF przed nawigacją, a następnie w miarę możliwości ponownie sprawdzane na końcowym URL `http(s)`.
- W ścisłym trybie SSRF sprawdzane są też zdalne wykrywanie endpointu CDP i sondy `/json/version` (`cdpUrl`).
- Zmienne środowiskowe Gateway/providera `HTTP_PROXY`, `HTTPS_PROXY`, `ALL_PROXY` i `NO_PROXY` nie przekierowują automatycznie przeglądarki zarządzanej przez OpenClaw przez proxy. Zarządzany Chrome domyślnie uruchamia się bezpośrednio, aby ustawienia proxy providera nie osłabiały kontroli SSRF przeglądarki.
- Lokalne sondy gotowości CDP zarządzane przez OpenClaw i połączenia WebSocket DevTools omijają zarządzane proxy sieciowe dla dokładnego uruchomionego endpointu loopback, więc `openclaw browser start` nadal działa, gdy proxy operatora blokuje wychodzący ruch loopback.
- Aby przekierować samą zarządzaną przeglądarkę przez proxy, przekaż jawne flagi proxy Chrome przez `browser.extraArgs`, takie jak `--proxy-server=...` lub `--proxy-pac-url=...`. Ścisły tryb SSRF blokuje jawne trasowanie proxy przeglądarki, chyba że dostęp przeglądarki do sieci prywatnej jest celowo włączony.
- `browser.ssrfPolicy.dangerouslyAllowPrivateNetwork` jest domyślnie wyłączone; włączaj tylko wtedy, gdy dostęp przeglądarki do sieci prywatnej jest celowo zaufany.
- `browser.ssrfPolicy.allowPrivateNetwork` pozostaje obsługiwane jako starszy alias.

</Accordion>

<Accordion title="Zachowanie profilu">

- `attachOnly: true` oznacza, że lokalna przeglądarka nigdy nie jest uruchamiana; następuje tylko dołączenie, jeśli jakaś już działa.
- `headless` można ustawić globalnie albo dla lokalnego zarządzanego profilu. Wartości per profil zastępują `browser.headless`, więc jeden lokalnie uruchomiony profil może pozostać headless, podczas gdy inny pozostaje widoczny.
- `POST /start?headless=true` i `openclaw browser start --headless` żądają
  jednorazowego uruchomienia headless dla lokalnych zarządzanych profili bez przepisywania
  `browser.headless` ani konfiguracji profilu. Istniejąca sesja, attach-only i
  zdalne profile CDP odrzucają to nadpisanie, ponieważ OpenClaw nie uruchamia tych
  procesów przeglądarki.
- Na hostach Linux bez `DISPLAY` lub `WAYLAND_DISPLAY` lokalne zarządzane profile
  domyślnie automatycznie używają headless, gdy ani środowisko, ani konfiguracja profilu/globalna
  nie wybierają jawnie trybu z interfejsem. `openclaw browser status --json`
  raportuje `headlessSource` jako `env`, `profile`, `config`,
  `request`, `linux-display-fallback` lub `default`.
- `OPENCLAW_BROWSER_HEADLESS=1` wymusza uruchomienia lokalne zarządzane jako headless dla
  bieżącego procesu. `OPENCLAW_BROWSER_HEADLESS=0` wymusza tryb z interfejsem dla zwykłych
  uruchomień i zwraca możliwy do działania błąd na hostach Linux bez serwera wyświetlania;
  jawne żądanie `start --headless` nadal wygrywa dla tego jednego uruchomienia.
- `executablePath` można ustawić globalnie albo dla lokalnego zarządzanego profilu. Wartości per profil zastępują `browser.executablePath`, więc różne zarządzane profile mogą uruchamiać różne przeglądarki oparte na Chromium. Obie formy akceptują `~` dla katalogu domowego twojego systemu operacyjnego.
- `color` (na najwyższym poziomie i per profil) barwi interfejs przeglądarki, aby było widać, który profil jest aktywny.
- Domyślny profil to `openclaw` (zarządzany samodzielny). Użyj `defaultProfile: "user"`, aby wybrać przeglądarkę zalogowanego użytkownika.
- Kolejność automatycznego wykrywania: domyślna przeglądarka systemowa, jeśli jest oparta na Chromium; w przeciwnym razie Chrome → Brave → Edge → Chromium → Chrome Canary.
- `driver: "existing-session"` używa Chrome DevTools MCP zamiast surowego CDP. Może dołączyć przez automatyczne połączenie Chrome MCP albo przez `cdpUrl`, gdy masz już endpoint DevTools dla działającej przeglądarki.
- Ustaw `browser.profiles.<name>.userDataDir`, gdy profil existing-session powinien dołączać do niedomyślnego profilu użytkownika Chromium (Brave, Edge itp.). Ta ścieżka również akceptuje `~` dla katalogu domowego twojego systemu operacyjnego.

</Accordion>

</AccordionGroup>

## Użyj Brave lub innej przeglądarki opartej na Chromium

Jeśli twoja **domyślna systemowa** przeglądarka jest oparta na Chromium (Chrome/Brave/Edge/itp.),
OpenClaw używa jej automatycznie. Ustaw `browser.executablePath`, aby nadpisać
automatyczne wykrywanie. Wartości `executablePath` na najwyższym poziomie i per profil akceptują `~`
dla katalogu domowego twojego systemu operacyjnego:

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

`executablePath` per profil wpływa tylko na lokalne zarządzane profile, które OpenClaw
uruchamia. Profile `existing-session` dołączają zamiast tego do już działającej przeglądarki,
a zdalne profile CDP używają przeglądarki za `cdpUrl`.

## Sterowanie lokalne a zdalne

- **Sterowanie lokalne (domyślne):** Gateway uruchamia usługę sterowania loopback i może uruchomić lokalną przeglądarkę.
- **Sterowanie zdalne (host Node):** uruchom host Node na maszynie z przeglądarką; Gateway przekazuje do niego akcje przeglądarki przez proxy.
- **Zdalne CDP:** ustaw `browser.profiles.<name>.cdpUrl` (lub `browser.cdpUrl`), aby
  dołączyć do zdalnej przeglądarki opartej na Chromium. W takim przypadku OpenClaw nie uruchomi lokalnej przeglądarki.
- Dla zewnętrznie zarządzanych usług CDP na loopback (na przykład Browserless w
  Dockerze opublikowanym do `127.0.0.1`) ustaw również `attachOnly: true`. CDP na loopback
  bez `attachOnly` jest traktowane jako lokalny profil przeglądarki zarządzany przez OpenClaw.
- `headless` wpływa tylko na lokalne zarządzane profile, które OpenClaw uruchamia. Nie restartuje ani nie zmienia przeglądarek existing-session ani zdalnych CDP.
- `executablePath` podlega tej samej regule lokalnego zarządzanego profilu. Zmiana go w
  działającym lokalnym zarządzanym profilu oznacza ten profil do restartu/uzgodnienia, aby
  następne uruchomienie użyło nowego pliku binarnego.

Zachowanie zatrzymywania różni się zależnie od trybu profilu:

- lokalne zarządzane profile: `openclaw browser stop` zatrzymuje proces przeglądarki, który
  uruchomił OpenClaw
- profile attach-only i zdalne CDP: `openclaw browser stop` zamyka aktywną
  sesję sterowania i zwalnia nadpisania emulacji Playwright/CDP (viewport,
  schemat kolorów, locale, strefę czasową, tryb offline i podobny stan), mimo
  że OpenClaw nie uruchomił żadnego procesu przeglądarki

Zdalne URL-e CDP mogą zawierać dane uwierzytelniające:

- Tokeny zapytania (np. `https://provider.example?token=<token>`)
- Uwierzytelnianie HTTP Basic (np. `https://user:pass@provider.example`)

OpenClaw zachowuje dane uwierzytelniające podczas wywoływania endpointów `/json/*` i podczas łączenia
z WebSocket CDP. Dla tokenów preferuj zmienne środowiskowe lub menedżery sekretów
zamiast zapisywania ich w plikach konfiguracji.

## Proxy przeglądarki Node (domyślne bez konfiguracji)

Jeśli uruchomisz **host Node** na maszynie, na której masz przeglądarkę, OpenClaw może
automatycznie kierować wywołania narzędzia przeglądarki do tego węzła bez żadnej dodatkowej konfiguracji przeglądarki.
To jest domyślna ścieżka dla zdalnych Gateway.

Uwagi:

- Host Node udostępnia swój lokalny serwer sterowania przeglądarką przez **polecenie proxy**.
- Profile pochodzą z własnej konfiguracji `browser.profiles` węzła (tak samo jak lokalnie).
- `nodeHost.browserProxy.allowProfiles` jest opcjonalne. Pozostaw je puste dla starszego/domyślnego zachowania: wszystkie skonfigurowane profile pozostają osiągalne przez proxy, w tym trasy tworzenia/usuwania profili.
- Jeśli ustawisz `nodeHost.browserProxy.allowProfiles`, OpenClaw traktuje to jako granicę najmniejszych uprawnień: można wskazywać tylko profile z listy dozwolonych, a trasy tworzenia/usuwania trwałych profili są blokowane na powierzchni proxy.
- Wyłącz, jeśli tego nie chcesz:
  - Na węźle: `nodeHost.browserProxy.enabled=false`
  - Na Gateway: `gateway.nodes.browser.mode="off"`

## Browserless (hostowany zdalny CDP)

[Browserless](https://browserless.io) to hostowana usługa Chromium, która udostępnia
adresy URL połączeń CDP przez HTTPS i WebSocket. OpenClaw może używać obu form, ale
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

- Zastąp `<BROWSERLESS_API_KEY>` swoim rzeczywistym tokenem Browserless.
- Wybierz endpoint regionu zgodny z Twoim kontem Browserless (zobacz ich dokumentację).
- Jeśli Browserless podaje bazowy URL HTTPS, możesz albo przekonwertować go na
  `wss://` dla bezpośredniego połączenia CDP, albo zachować URL HTTPS i pozwolić OpenClaw
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
OpenClaw. Browserless musi także ogłaszać zgodny, osiągalny endpoint;
ustaw `EXTERNAL` Browserless na tę samą publiczną względem OpenClaw bazę WebSocket, na przykład
`ws://127.0.0.1:3000`, `ws://browserless:3000` albo stabilny prywatny adres sieci
Docker. Jeśli `/json/version` zwraca `webSocketDebuggerUrl` wskazujący na
adres, którego OpenClaw nie może osiągnąć, HTTP CDP może wyglądać poprawnie, podczas gdy dołączenie
WebSocket nadal kończy się niepowodzeniem.

Nie pozostawiaj `attachOnly` nieustawionego dla profilu Browserless typu loopback. Bez
`attachOnly` OpenClaw traktuje port loopback jako lokalnie zarządzany profil przeglądarki
i może zgłaszać, że port jest używany, ale nie należy do OpenClaw.

## Bezpośredni dostawcy CDP WebSocket

Niektóre hostowane usługi przeglądarek udostępniają **bezpośredni endpoint WebSocket** zamiast
standardowego wykrywania CDP opartego na HTTP (`/json/version`). OpenClaw akceptuje trzy
kształty URL CDP i automatycznie wybiera właściwą strategię połączenia:

- **Wykrywanie HTTP(S)** - `http://host[:port]` lub `https://host[:port]`.
  OpenClaw wywołuje `/json/version`, aby wykryć URL debuggera WebSocket, a następnie
  się łączy. Bez awaryjnego przejścia na WebSocket.
- **Bezpośrednie endpointy WebSocket** - `ws://host[:port]/devtools/<kind>/<id>` lub
  `wss://...` ze ścieżką `/devtools/browser|page|worker|shared_worker|service_worker/<id>`.
  OpenClaw łączy się bezpośrednio przez uzgodnienie WebSocket i całkowicie pomija
  `/json/version`.
- **Bazowe korzenie WebSocket** - `ws://host[:port]` lub `wss://host[:port]` bez
  ścieżki `/devtools/...` (np. [Browserless](https://browserless.io),
  [Browserbase](https://www.browserbase.com)). OpenClaw najpierw próbuje wykrywania HTTP
  `/json/version` (normalizując schemat do `http`/`https`);
  jeśli wykrywanie zwróci `webSocketDebuggerUrl`, jest on używany, w przeciwnym razie OpenClaw
  przechodzi awaryjnie do bezpośredniego uzgodnienia WebSocket pod bazowym korzeniem. Jeśli ogłoszony
  endpoint WebSocket odrzuci uzgodnienie CDP, ale skonfigurowany bazowy korzeń
  je zaakceptuje, OpenClaw również przechodzi awaryjnie do tego korzenia. Dzięki temu bazowy `ws://`
  wskazujący na lokalnego Chrome nadal się połączy, ponieważ Chrome akceptuje podniesienia WebSocket
  tylko na konkretnej ścieżce per-target z `/json/version`, podczas gdy hostowani
  dostawcy nadal mogą używać swojego głównego endpointu WebSocket, gdy ich endpoint wykrywania
  ogłasza krótkotrwały URL, który nie nadaje się do Playwright CDP.

`openclaw browser doctor` używa tej samej logiki wykrywania w pierwszej kolejności i awaryjnego przejścia na WebSocket
co dołączanie w czasie działania, więc URL bazowego korzenia, który łączy się pomyślnie, nie jest
zgłaszany przez diagnostykę jako nieosiągalny.

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

- [Zarejestruj się](https://www.browserbase.com/sign-up) i skopiuj swój **klucz API**
  z [panelu przeglądu](https://www.browserbase.com/overview).
- Zastąp `<BROWSERBASE_API_KEY>` swoim rzeczywistym kluczem API Browserbase.
- Browserbase automatycznie tworzy sesję przeglądarki przy połączeniu WebSocket,
  więc ręczny krok tworzenia sesji nie jest potrzebny.
- Bezpłatny plan umożliwia jedną równoczesną sesję i jedną godzinę przeglądarki
  miesięcznie. Zobacz [cennik](https://www.browserbase.com/pricing), aby poznać
  limity płatnych planów.
- Zobacz [dokumentację Browserbase](https://docs.browserbase.com), aby uzyskać
  pełną dokumentację API, przewodniki po SDK i przykłady integracji.

### Notte

[Notte](https://www.notte.cc) to platforma chmurowa do uruchamiania przeglądarek
headless z wbudowanym trybem stealth, proxy rezydencjalnymi i natywną dla CDP
bramą WebSocket.

```json5
{
  browser: {
    enabled: true,
    defaultProfile: "notte",
    remoteCdpTimeoutMs: 3000,
    remoteCdpHandshakeTimeoutMs: 5000,
    profiles: {
      notte: {
        cdpUrl: "wss://us-prod.notte.cc/sessions/connect?token=<NOTTE_API_KEY>",
        color: "#7C3AED",
      },
    },
  },
}
```

Uwagi:

- [Zarejestruj się](https://console.notte.cc) i skopiuj swój **klucz API** ze
  strony ustawień konsoli.
- Zastąp `<NOTTE_API_KEY>` swoim rzeczywistym kluczem API Notte.
- Notte automatycznie tworzy sesję przeglądarki przy połączeniu WebSocket, więc
  ręczny krok tworzenia sesji nie jest potrzebny. Sesja jest niszczona po
  rozłączeniu WebSocket.
- Bezpłatny plan umożliwia pięć równoczesnych sesji i 100 godzin przeglądarki
  łącznie. Zobacz [cennik](https://www.notte.cc/#pricing), aby poznać limity
  płatnych planów.
- Zobacz [dokumentację Notte](https://docs.notte.cc), aby uzyskać pełną
  dokumentację API, przewodniki po SDK i przykłady integracji.

## Bezpieczeństwo

Kluczowe idee:

- Sterowanie przeglądarką działa wyłącznie przez local loopback; dostęp przechodzi przez uwierzytelnianie Gateway lub parowanie węzła.
- Samodzielne HTTP API przeglądarki przez loopback używa **wyłącznie
  uwierzytelniania współdzielonym sekretem**: uwierzytelniania bearer tokenem
  gateway, `x-openclaw-password` albo uwierzytelniania HTTP Basic ze
  skonfigurowanym hasłem gateway.
- Nagłówki tożsamości Tailscale Serve i `gateway.auth.mode: "trusted-proxy"`
  **nie** uwierzytelniają tego samodzielnego API przeglądarki przez loopback.
- Jeśli sterowanie przeglądarką jest włączone, a uwierzytelnianie współdzielonym
  sekretem nie jest skonfigurowane, OpenClaw generuje token gateway tylko na czas
  działania dla tego uruchomienia. Skonfiguruj jawnie `gateway.auth.token`,
  `gateway.auth.password`, `OPENCLAW_GATEWAY_TOKEN` albo
  `OPENCLAW_GATEWAY_PASSWORD`, jeśli klienci potrzebują stabilnego sekretu między
  restartami.
- OpenClaw **nie** generuje automatycznie tego tokenu, gdy `gateway.auth.mode` ma
  już wartość `password`, `none` albo `trusted-proxy`.
- Trzymaj Gateway i wszystkie hosty węzłów w sieci prywatnej (Tailscale); unikaj ekspozycji publicznej.
- Traktuj zdalne URL-e/tokeny CDP jako sekrety; preferuj zmienne środowiskowe albo menedżera sekretów.

Wskazówki dotyczące zdalnego CDP:

- Preferuj szyfrowane punkty końcowe (HTTPS albo WSS) i krótkotrwałe tokeny, gdy to możliwe.
- Unikaj osadzania długotrwałych tokenów bezpośrednio w plikach konfiguracyjnych.

## Profile (wiele przeglądarek)

OpenClaw obsługuje wiele nazwanych profili (konfiguracji routingu). Profile mogą być:

- **zarządzane przez OpenClaw**: dedykowana instancja przeglądarki opartej na Chromium z własnym katalogiem danych użytkownika i portem CDP
- **zdalne**: jawny URL CDP (przeglądarka oparta na Chromium działająca gdzie indziej)
- **istniejąca sesja**: istniejący profil Chrome przez automatyczne połączenie Chrome DevTools MCP

Wartości domyślne:

- Profil `openclaw` jest tworzony automatycznie, jeśli go brakuje.
- Profil `user` jest wbudowany do dołączania do istniejącej sesji Chrome MCP.
- Profile istniejącej sesji poza `user` są opcjonalne; utwórz je z `--driver existing-session`.
- Lokalne porty CDP są domyślnie przydzielane z zakresu **18800-18899**.
- Usunięcie profilu przenosi jego lokalny katalog danych do Kosza.

Wszystkie punkty końcowe sterowania akceptują `?profile=<name>`; CLI używa `--browser-profile`.

## Istniejąca sesja przez Chrome DevTools MCP

OpenClaw może też dołączać do działającego profilu przeglądarki opartej na
Chromium przez oficjalny serwer Chrome DevTools MCP. Powoduje to ponowne użycie
kart i stanu logowania już otwartych w tym profilu przeglądarki.

Oficjalne materiały wprowadzające i instrukcje konfiguracji:

- [Chrome for Developers: używanie Chrome DevTools MCP z sesją przeglądarki](https://developer.chrome.com/blog/chrome-devtools-mcp-debug-your-browser-session)
- [README Chrome DevTools MCP](https://github.com/ChromeDevTools/chrome-devtools-mcp)

Wbudowany profil:

- `user`

Opcjonalnie: utwórz własny niestandardowy profil istniejącej sesji, jeśli chcesz
użyć innej nazwy, koloru albo katalogu danych przeglądarki.

Domyślne zachowanie:

- Wbudowany profil `user` używa automatycznego połączenia Chrome MCP, które celuje
  w domyślny lokalny profil Google Chrome.

Użyj `userDataDir` dla Brave, Edge, Chromium albo niedomyślnego profilu Chrome.
`~` rozwija się do katalogu domowego Twojego systemu operacyjnego:

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

1. Otwórz stronę inspekcji tej przeglądarki do zdalnego debugowania.
2. Włącz zdalne debugowanie.
3. Pozostaw przeglądarkę uruchomioną i zatwierdź monit połączenia, gdy OpenClaw się dołącza.

Typowe strony inspekcji:

- Chrome: `chrome://inspect/#remote-debugging`
- Brave: `brave://inspect/#remote-debugging`
- Edge: `edge://inspect/#remote-debugging`

Test smoke dołączania na żywo:

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
- `snapshot` zwraca odwołania z wybranej karty na żywo

Co sprawdzić, jeśli dołączenie nie działa:

- docelowa przeglądarka oparta na Chromium ma wersję `144+`
- zdalne debugowanie jest włączone na stronie inspekcji tej przeglądarki
- przeglądarka wyświetliła monit zgody na dołączenie i został on zaakceptowany
- jeśli Chrome został uruchomiony z jawnym `--remote-debugging-port`, ustaw
  `browser.profiles.<name>.cdpUrl` na ten punkt końcowy DevTools zamiast polegać
  na automatycznym połączeniu Chrome MCP
- `openclaw doctor` migruje starą konfigurację przeglądarki opartą na rozszerzeniu
  i sprawdza, czy Chrome jest zainstalowany lokalnie dla domyślnych profili
  automatycznego połączenia, ale nie może włączyć za Ciebie zdalnego debugowania
  po stronie przeglądarki

Użycie przez agenta:

- Użyj `profile="user"`, gdy potrzebujesz stanu zalogowanej przeglądarki użytkownika.
- Jeśli używasz niestandardowego profilu istniejącej sesji, przekaż tę jawną nazwę profilu.
- Wybieraj ten tryb tylko wtedy, gdy użytkownik jest przy komputerze, aby
  zatwierdzić monit dołączenia.
- Gateway albo host węzła może uruchomić `npx chrome-devtools-mcp@latest --autoConnect`

Uwagi:

- Ta ścieżka jest bardziej ryzykowna niż izolowany profil `openclaw`, ponieważ
  może działać wewnątrz zalogowanej sesji przeglądarki.
- OpenClaw nie uruchamia przeglądarki dla tego sterownika; tylko się do niej dołącza.
- OpenClaw używa tutaj oficjalnego przepływu Chrome DevTools MCP `--autoConnect`.
  Jeśli ustawiono `userDataDir`, jest on przekazywany dalej, aby wskazać ten
  katalog danych użytkownika.
- Istniejąca sesja może dołączać na wybranym hoście albo przez połączony węzeł
  przeglądarki. Jeśli Chrome działa gdzie indziej i żaden węzeł przeglądarki nie
  jest połączony, użyj zamiast tego zdalnego CDP albo hosta węzła.

### Niestandardowe uruchamianie Chrome MCP

Nadpisz uruchamiany serwer Chrome DevTools MCP dla profilu, gdy domyślny przepływ
`npx chrome-devtools-mcp@latest` nie jest tym, czego chcesz (hosty offline,
przypięte wersje, dostarczone binaria):

| Pole         | Co robi                                                                                                                    |
| ------------ | -------------------------------------------------------------------------------------------------------------------------- |
| `mcpCommand` | Plik wykonywalny do uruchomienia zamiast `npx`. Rozwiązywany bez zmian; ścieżki bezwzględne są respektowane.              |
| `mcpArgs`    | Tablica argumentów przekazywana dosłownie do `mcpCommand`. Zastępuje domyślne argumenty `chrome-devtools-mcp@latest --autoConnect`. |

Gdy `cdpUrl` jest ustawione w profilu istniejącej sesji, OpenClaw pomija
`--autoConnect` i automatycznie przekazuje punkt końcowy do Chrome MCP:

- `http(s)://...` → `--browserUrl <url>` (punkt końcowy wykrywania HTTP DevTools).
- `ws(s)://...` → `--wsEndpoint <url>` (bezpośredni WebSocket CDP).

Flag punktu końcowego i `userDataDir` nie można łączyć: gdy ustawiono `cdpUrl`,
`userDataDir` jest ignorowane przy uruchamianiu Chrome MCP, ponieważ Chrome MCP
dołącza do działającej przeglądarki za punktem końcowym zamiast otwierać katalog
profilu.

<Accordion title="Ograniczenia funkcji istniejącej sesji">

W porównaniu z zarządzanym profilem `openclaw` sterowniki istniejącej sesji są bardziej ograniczone:

- **Zrzuty ekranu** - przechwytywanie stron i przechwytywanie elementów przez `--ref` działa; selektory CSS `--element` nie działają. `--full-page` nie można łączyć z `--ref` ani `--element`. Playwright nie jest wymagany do zrzutów ekranu stron ani elementów opartych na ref.
- **Akcje** - `click`, `type`, `hover`, `scrollIntoView`, `drag` i `select` wymagają odwołań ze snapshotu (bez selektorów CSS). `click-coords` klika widoczne współrzędne viewportu i nie wymaga odwołania ze snapshotu. `click` obsługuje tylko lewy przycisk. `type` nie obsługuje `slowly=true`; użyj `fill` albo `press`. `press` nie obsługuje `delayMs`. `type`, `hover`, `scrollIntoView`, `drag`, `select`, `fill` i `evaluate` nie obsługują limitów czasu dla pojedynczych wywołań. `select` akceptuje pojedynczą wartość.
- **Oczekiwanie / przesyłanie / dialog** - `wait --url` obsługuje wzorce dokładne, podciągi i glob; `wait --load networkidle` nie jest obsługiwane w profilach istniejącej sesji (działa w profilach zarządzanych oraz surowych/zdalnych profilach CDP). Hooki przesyłania wymagają `ref` albo `inputRef`, jednego pliku naraz, bez CSS `element`. Hooki dialogów nie obsługują nadpisań limitu czasu ani `dialogId`.
- **Widoczność dialogu** - odpowiedzi akcji zarządzanej przeglądarki zawierają `blockedByDialog` i `browserState.dialogs.pending`, gdy akcja otwiera modalne okno dialogowe; snapshoty również zawierają oczekujący stan dialogu. Odpowiedz za pomocą `browser dialog --accept/--dismiss --dialog-id <id>`, gdy dialog oczekuje. Dialogi obsłużone poza OpenClaw pojawiają się pod `browserState.dialogs.recent`.
- **Funkcje tylko dla trybu zarządzanego** - akcje wsadowe, eksport PDF, przechwytywanie pobrań i `responsebody` nadal wymagają ścieżki zarządzanej przeglądarki.

</Accordion>

## Gwarancje izolacji

- **Dedykowany katalog danych użytkownika**: nigdy nie dotyka Twojego osobistego profilu przeglądarki.
- **Dedykowane porty**: unika `9222`, aby zapobiec kolizjom z przepływami pracy deweloperskiej.
- **Deterministyczne sterowanie kartami**: `tabs` zwraca najpierw `suggestedTargetId`, a potem
  stabilne uchwyty `tabId`, takie jak `t1`, opcjonalne etykiety i surowe `targetId`.
  Agenci powinni ponownie używać `suggestedTargetId`; surowe identyfikatory pozostają
  dostępne do debugowania i kompatybilności.

## Wybór przeglądarki

Podczas lokalnego uruchamiania OpenClaw wybiera pierwszą dostępną:

1. Chrome
2. Brave
3. Edge
4. Chromium
5. Chrome Canary

Możesz nadpisać to za pomocą `browser.executablePath`.

Platformy:

- macOS: sprawdza `/Applications` i `~/Applications`.
- Linux: sprawdza typowe lokalizacje Chrome/Brave/Edge/Chromium pod `/usr/bin`,
  `/snap/bin`, `/opt/google`, `/opt/brave.com`, `/usr/lib/chromium` i
  `/usr/lib/chromium-browser`, a także Chromium zarządzany przez Playwright pod
  `PLAYWRIGHT_BROWSERS_PATH` albo `~/.cache/ms-playwright`.
- Windows: sprawdza typowe lokalizacje instalacji.

## API sterowania (opcjonalne)

Do skryptowania i debugowania Gateway udostępnia małe **HTTP API sterowania
dostępne tylko przez loopback** oraz odpowiadające mu CLI `openclaw browser`
(snapshoty, refy, wzmocnienia oczekiwania, wyjście JSON, przepływy debugowania).
Zobacz [API sterowania przeglądarką](/pl/tools/browser-control), aby uzyskać pełną
dokumentację.

## Rozwiązywanie problemów

W przypadku problemów specyficznych dla Linuksa (zwłaszcza snap Chromium) zobacz
[Rozwiązywanie problemów z przeglądarką](/pl/tools/browser-linux-troubleshooting).

W przypadku konfiguracji z podziałem hostów WSL2 Gateway + Windows Chrome zobacz
[Rozwiązywanie problemów z WSL2 + Windows + zdalnym Chrome CDP](/pl/tools/browser-wsl2-windows-remote-cdp-troubleshooting).

### Błąd uruchamiania CDP a blokada nawigacji SSRF

To różne klasy błędów, które wskazują na różne ścieżki kodu.

- **Błąd uruchamiania lub gotowości CDP** oznacza, że OpenClaw nie może potwierdzić, że płaszczyzna sterowania przeglądarką działa prawidłowo.
- **Blokada nawigacji SSRF** oznacza, że płaszczyzna sterowania przeglądarką działa prawidłowo, ale docelowy adres nawigacji strony został odrzucony przez politykę.

Typowe przykłady:

- Błąd uruchamiania lub gotowości CDP:
  - `Chrome CDP websocket for profile "openclaw" is not reachable after start`
  - `Remote CDP for profile "<name>" is not reachable at <cdpUrl>`
  - `Port <port> is in use for profile "<name>" but not by openclaw`, gdy
    usługa zewnętrzna CDP na local loopback jest skonfigurowana bez `attachOnly: true`
- Blokada nawigacji SSRF:
  - Przepływy `open`, `navigate`, migawki albo otwierania kart kończą się błędem polityki przeglądarki/sieci, podczas gdy `start` i `tabs` nadal działają

Użyj tej minimalnej sekwencji, aby rozdzielić te dwa przypadki:

```bash
openclaw browser --browser-profile openclaw start
openclaw browser --browser-profile openclaw tabs
openclaw browser --browser-profile openclaw open https://example.com
```

Jak interpretować wyniki:

- Jeśli `start` kończy się błędem `not reachable after start`, najpierw rozwiąż problem gotowości CDP.
- Jeśli `start` się powiedzie, ale `tabs` zawiedzie, płaszczyzna sterowania nadal jest niesprawna. Traktuj to jako problem osiągalności CDP, a nie problem nawigacji po stronie.
- Jeśli `start` i `tabs` się powiodą, ale `open` lub `navigate` zawiedzie, płaszczyzna sterowania przeglądarką działa, a błąd dotyczy polityki nawigacji albo strony docelowej.
- Jeśli `start`, `tabs` i `open` zakończą się powodzeniem, podstawowa ścieżka sterowania zarządzaną przeglądarką działa prawidłowo.

Ważne szczegóły zachowania:

- Konfiguracja przeglądarki domyślnie używa obiektu polityki SSRF typu fail-closed, nawet jeśli nie konfigurujesz `browser.ssrfPolicy`.
- Dla zarządzanego profilu `openclaw` na local loopback kontrole kondycji CDP celowo pomijają egzekwowanie osiągalności SSRF przeglądarki dla własnej lokalnej płaszczyzny sterowania OpenClaw.
- Ochrona nawigacji jest osobna. Pomyślny wynik `start` lub `tabs` nie oznacza, że późniejszy cel `open` lub `navigate` jest dozwolony.

Wytyczne bezpieczeństwa:

- **Nie** rozluźniaj domyślnie polityki SSRF przeglądarki.
- Preferuj wąskie wyjątki hostów, takie jak `hostnameAllowlist` lub `allowedHostnames`, zamiast szerokiego dostępu do sieci prywatnej.
- Używaj `dangerouslyAllowPrivateNetwork: true` tylko w celowo zaufanych środowiskach, w których dostęp przeglądarki do sieci prywatnej jest wymagany i sprawdzony.

## Narzędzia agenta i sposób działania sterowania

Agent otrzymuje **jedno narzędzie** do automatyzacji przeglądarki:

- `browser` - doctor/status/start/stop/tabs/open/focus/close/snapshot/screenshot/navigate/act

Jak to jest mapowane:

- `browser snapshot` zwraca stabilne drzewo UI (AI albo ARIA).
- `browser act` używa identyfikatorów `ref` z migawki do klikania/pisania/przeciągania/wybierania.
- `browser screenshot` przechwytuje piksele (pełną stronę, element albo oznaczone referencje).
- `browser doctor` sprawdza gotowość Gateway, Plugin, profilu, przeglądarki i karty.
- `browser` akceptuje:
  - `profile`, aby wybrać nazwany profil przeglądarki (openclaw, chrome albo zdalny CDP).
  - `target` (`sandbox` | `host` | `node`), aby wybrać, gdzie działa przeglądarka.
  - W sesjach w piaskownicy `target: "host"` wymaga `agents.defaults.sandbox.browser.allowHostControl=true`.
  - Jeśli `target` zostanie pominięty: sesje w piaskownicy domyślnie używają `sandbox`, a sesje poza piaskownicą domyślnie używają `host`.
  - Jeśli podłączony jest węzeł obsługujący przeglądarkę, narzędzie może automatycznie skierować pracę do niego, chyba że przypniesz `target="host"` lub `target="node"`.

Dzięki temu agent pozostaje deterministyczny i unika kruchych selektorów.

## Powiązane

- [Przegląd narzędzi](/pl/tools) - wszystkie dostępne narzędzia agenta
- [Piaskownica](/pl/gateway/sandboxing) - sterowanie przeglądarką w środowiskach piaskownicy
- [Bezpieczeństwo](/pl/gateway/security) - ryzyka sterowania przeglądarką i utwardzanie
