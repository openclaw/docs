---
read_when:
    - Dodawanie automatyzacji przeglądarki sterowanej przez agenta
    - Diagnozowanie, dlaczego OpenClaw zakłóca działanie używanej przeglądarki Chrome
    - Implementacja ustawień przeglądarki i cyklu życia w aplikacji macOS
summary: Zintegrowana usługa sterowania przeglądarką + polecenia działań
title: Przeglądarka (zarządzana przez OpenClaw)
x-i18n:
    generated_at: "2026-07-16T19:05:39Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: cf43bd54994d29d48cfc1e16889ec34af83e885c1dd1b63c287f0df116c7f0bf
    source_path: tools/browser.md
    workflow: 16
---

OpenClaw może uruchamiać **dedykowany profil Chrome/Brave/Edge/Chromium**, którym steruje agent. Działa on za pośrednictwem niewielkiej lokalnej usługi sterowania wewnątrz Gateway (wyłącznie przez interfejs pętli zwrotnej) i jest odizolowany od osobistej przeglądarki.

- Można go traktować jako **oddzielną przeglądarkę wyłącznie dla agenta**. Profil `openclaw` nigdy nie korzysta z osobistego profilu przeglądarki.
- Agent otwiera karty, odczytuje strony, klika i wpisuje tekst w tym odizolowanym środowisku.
- Wbudowany profil `user` zamiast tego łączy się z rzeczywistą, zalogowaną sesją Chrome za pośrednictwem Chrome DevTools MCP.

## Dostępne możliwości

- Oddzielny profil przeglądarki o nazwie **openclaw** (domyślnie z pomarańczowym akcentem).
- Deterministyczne sterowanie kartami (wyświetlanie listy/otwieranie/ustawianie aktywnej/zamykanie).
- Działania agenta (klikanie/wpisywanie/przeciąganie/wybieranie), migawki, zrzuty ekranu i pliki PDF.
- Profile oparte na Playwright zapisują pliki z bezpośrednich przejść do załączników w zarządzanym katalogu pobierania i zwracają metadane `{ url, suggestedFilename, path }` po sprawdzeniu zasad dotyczących końcowego adresu URL.
- Działania agenta oparte na Playwright zwracają tablicę `downloads` z tymi samymi zarządzanymi metadanymi, gdy działanie natychmiast rozpoczyna pobieranie co najmniej jednego pliku.
- Dołączona umiejętność `browser-automation`, która po włączeniu pluginu przeglądarki uczy agentów procedury obsługi migawek,
  stabilnych kart, nieaktualnych odwołań i przeszkód wymagających ręcznej interwencji.
- Opcjonalna obsługa wielu profili (`openclaw`, `work`, `remote`, ...).

Ta przeglądarka **nie** jest przeznaczona do codziennego użytku. Stanowi bezpieczne, odizolowane środowisko do
automatyzacji i weryfikacji przez agenta.

W systemie macOS można jawnie skopiować pliki cookie z systemowego profilu przeglądarki z rodziny Chrome do oddzielnego profilu zarządzanego. Zarządzana przeglądarka nadal używa własnego katalogu danych użytkownika; kopiowane są tylko wybrane pliki cookie, natomiast pamięć lokalna i IndexedDB pozostają w pierwotnym profilu. Polecenia importowania i ograniczenia opisano w sekcji [Profile](#profiles-multi-browser) oraz w [dokumentacji CLI `openclaw browser`](/pl/cli/browser).

## Szybki start

```bash
openclaw browser --browser-profile openclaw doctor
openclaw browser --browser-profile openclaw doctor --deep
openclaw browser --browser-profile openclaw status
openclaw browser --browser-profile openclaw start
openclaw browser --browser-profile openclaw open https://example.com
openclaw browser --browser-profile openclaw snapshot
```

Komunikat „Przeglądarka wyłączona” oznacza, że plugin lub ustawienie `browser.enabled` jest wyłączone; zobacz
[Konfiguracja](#configuration) i [Sterowanie pluginem](#plugin-control).

Jeśli elementu `openclaw browser` w ogóle brakuje lub agent zgłasza niedostępność narzędzia przeglądarki,
przejdź do sekcji [Brak polecenia lub narzędzia przeglądarki](#missing-browser-command-or-tool).

## Sterowanie pluginem

Domyślne narzędzie `browser` jest dołączonym pluginem. Wyłącz je, aby zastąpić je innym pluginem rejestrującym tę samą nazwę narzędzia `browser`:

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

Ustawienia domyślne wymagają zarówno `plugins.entries.browser.enabled`, **jak i** `browser.enabled=true`. Wyłączenie samego pluginu usuwa jako jedną całość CLI `openclaw browser`, metodę Gateway `browser.request`, narzędzie agenta i usługę sterowania; konfiguracja `browser.*` pozostaje nienaruszona, aby umożliwić użycie zamiennika.

Zmiany konfiguracji przeglądarki wymagają ponownego uruchomienia Gateway, aby plugin mógł ponownie zarejestrować swoją usługę.

## Wskazówki dla agenta

Uwaga dotycząca profilu narzędzi: `tools.profile: "coding"` obejmuje `web_search` i
`web_fetch`, ale nie pełne narzędzie `browser`. Aby agent lub
uruchomiony agent podrzędny mógł korzystać z automatyzacji przeglądarki, należy dodać przeglądarkę na etapie
profilu:

```json5
{
  tools: {
    profile: "coding",
    alsoAllow: ["browser"],
  },
}
```

W przypadku pojedynczego agenta należy użyć `agents.list[].tools.alsoAllow: ["browser"]`.
Samo `tools.subagents.tools.allow: ["browser"]` nie wystarcza, ponieważ zasady dotyczące agentów podrzędnych
są stosowane po filtrowaniu profilu.

Plugin przeglądarki zapewnia dwa poziomy wskazówek dla agenta:

- Opis narzędzia `browser` zawiera zwięzłą, zawsze aktywną umowę: wybrać
  właściwy profil, zachować odwołania w obrębie tej samej karty, używać `tabId`/etykiet do wskazywania
  kart i wczytać umiejętność przeglądarki do pracy wieloetapowej.
- Dołączona umiejętność `browser-automation` opisuje dłuższą procedurę działania:
  najpierw sprawdzić stan/karty, oznaczyć karty zadania etykietami, utworzyć migawkę przed działaniem, ponownie utworzyć migawkę
  po zmianach interfejsu, jednokrotnie odtworzyć nieaktualne odwołania oraz zgłaszać logowanie/2FA/captcha lub
  przeszkody związane z kamerą/mikrofonem jako działania ręczne zamiast zgadywać.

Umiejętności dołączone do pluginu są wymieniane wśród dostępnych umiejętności agenta, gdy
plugin jest włączony. Pełne instrukcje umiejętności są wczytywane na żądanie, dlatego rutynowe
tury nie ponoszą pełnego kosztu tokenów.

## Brak polecenia lub narzędzia przeglądarki

Jeśli po uaktualnieniu element `openclaw browser` jest nieznany, brakuje `browser.request` lub agent zgłasza niedostępność narzędzia przeglądarki, zwykle przyczyną jest lista `plugins.allow`, która nie zawiera `browser`, przy jednoczesnym braku głównego bloku konfiguracji `browser`. Należy go dodać:

```json5
{
  plugins: {
    allow: ["telegram", "browser"],
  },
}
```

Jawny główny blok `browser` (dowolny klucz w `browser`, taki jak
`browser.enabled=true` lub `browser.profiles.<name>`) aktywuje dołączony
plugin przeglądarki nawet przy restrykcyjnym ustawieniu `plugins.allow`, zgodnie z działaniem konfiguracji
dołączonych kanałów. Same `plugins.entries.browser.enabled=true` i
`tools.alsoAllow: ["browser"]` nie zastępują członkostwa na liście dozwolonych.
Całkowite usunięcie `plugins.allow` również przywraca ustawienie domyślne.

## Profile: `openclaw`, `user`, `chrome`

- `openclaw`: zarządzana, odizolowana przeglądarka (nie wymaga rozszerzenia).
- `user`: wbudowany profil połączenia Chrome DevTools MCP z **rzeczywistą
  zalogowaną sesją Chrome**. Przy pierwszym połączeniu OpenClaw przeglądarka Chrome wyświetla blokujący monit „Allow remote debugging?”,
  dlatego ktoś musi znajdować się przy komputerze.
- `chrome`: wbudowany profil [rozszerzenia Chrome](/pl/tools/chrome-extension) dla
  **rzeczywistej zalogowanej sesji Chrome**. Działa z telefonu bez obecności kogokolwiek przy
  komputerze, ponieważ steruje kartami za pomocą rozszerzenia przeglądarki OpenClaw zamiast
  portu zdalnego debugowania, więc monit „Allow remote debugging?” się nie pojawia.

W przypadku wywołań narzędzia przeglądarki przez agenta:

- Domyślnie: używana jest odizolowana przeglądarka `openclaw`.
- Preferowany jest profil `profile="chrome"` (rozszerzenie), gdy istotne są istniejące zalogowane sesje,
  a użytkownik jest **z dala od komputera** (Telegram, WhatsApp itp.).
- Preferowany jest profil `profile="user"` (Chrome MCP), gdy istotne są istniejące zalogowane sesje,
  a użytkownik jest **przy komputerze** i może zatwierdzić monit o połączenie.
- `profile` stanowi jawne nadpisanie, gdy wymagany jest określony tryb przeglądarki.

Aby domyślnie używać trybu zarządzanego, należy ustawić `browser.defaultProfile: "openclaw"`.

## Konfiguracja

Ustawienia przeglądarki znajdują się w `~/.openclaw/openclaw.json`.

```json5
{
  browser: {
    enabled: true, // domyślnie: true
    evaluateEnabled: true, // domyślnie: true; false wyłącza act:evaluate (dowolny kod JS)
    ssrfPolicy: {
      // dangerouslyAllowPrivateNetwork: true, // włączaj tylko w przypadku zaufanego dostępu do sieci prywatnej
      // hostnameAllowlist: ["*.example.com", "example.com"],
      // allowedHostnames: ["localhost"],
    },
    // cdpUrl: "http://127.0.0.1:18792", // starsze nadpisanie dla pojedynczego profilu
    remoteCdpTimeoutMs: 1500, // limit czasu zdalnego żądania HTTP CDP (ms)
    remoteCdpHandshakeTimeoutMs: 3000, // limit czasu zdalnego uzgadniania połączenia WebSocket CDP (ms)
    localLaunchTimeoutMs: 15000, // limit czasu wykrywania lokalnej zarządzanej przeglądarki Chrome (ms)
    localCdpReadyTimeoutMs: 8000, // limit czasu gotowości lokalnego CDP po uruchomieniu zarządzanej przeglądarki (ms)
    actionTimeoutMs: 60000, // domyślny limit czasu działania przeglądarki (ms)
    tabCleanup: {
      enabled: true, // domyślnie: true
      idleMinutes: 120, // ustaw 0, aby wyłączyć czyszczenie bezczynnych kart
      maxTabsPerSession: 8, // ustaw 0, aby wyłączyć limit na sesję
      sweepMinutes: 5,
    },
    // snapshotDefaults: { mode: "efficient" }, // domyślny tryb migawki, gdy wywołujący go nie poda
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

`browser.snapshotDefaults.mode: "efficient"` zmienia domyślny tryb wyodrębniania `snapshot`,
gdy wywołujący nie przekazuje jawnego `snapshotFormat` ani
`mode`; opcje migawek dla poszczególnych wywołań opisano w sekcji [Interfejs API sterowania przeglądarką](/pl/tools/browser-control).

### Analiza zrzutów ekranu (obsługa modeli wyłącznie tekstowych)

Gdy główny model obsługuje wyłącznie tekst (bez obsługi obrazu/wielomodalności), zrzuty ekranu
przeglądarki zwracają bloki obrazów, których model nie może odczytać. Zrzuty ekranu przeglądarki
korzystają z istniejącej konfiguracji rozpoznawania obrazów, dzięki czemu model obrazu
skonfigurowany do interpretacji multimediów może opisywać zrzuty ekranu tekstowo bez żadnych
ustawień modelu specyficznych dla przeglądarki.

```json5
{
  tools: {
    media: {
      image: {
        models: [
          { provider: "bytedance", model: "doubao-seed-2.0-pro" },
          // Dodaj modele zapasowe; używany jest pierwszy zakończony powodzeniem
          { provider: "openai", model: "gpt-4o" },
        ],
      },
      // Współdzielone modele multimedialne również działają, jeśli oznaczono obsługę obrazów.
      // models: [{ provider: "openai", model: "gpt-4o", capabilities: ["image"] }],
    },
  },
  agents: {
    defaults: {
      // Istniejące domyślne ustawienia modelu obrazu również są uwzględniane.
      // imageModel: { primary: "openai/gpt-4o" },
    },
  },
}
```

**Jak to działa:**

1. Agent wywołuje `browser screenshot`, a obraz jest jak zwykle zapisywany na dysku.
2. Narzędzie przeglądarki sprawdza w istniejącym środowisku rozpoznawania obrazów, czy może ono
   opisać zrzut ekranu przy użyciu skonfigurowanych modeli obrazów multimedialnych, współdzielonych modeli
   multimedialnych, domyślnych modeli obrazu lub dostawcy obrazów korzystającego z uwierzytelniania.
3. Model wizyjny zwraca opis tekstowy, który jest opakowywany za pomocą
   `wrapExternalContent` (ochrona przed wstrzyknięciem polecenia) i zwracany agentowi
   jako blok tekstowy zamiast bloku obrazu.
4. Jeśli rozpoznawanie obrazów jest niedostępne, pominięte lub zakończy się niepowodzeniem, przeglądarka
   powraca do zwracania pierwotnego bloku obrazu.

Bloki obrazów zrzutów ekranu są prywatnymi wynikami narzędzia: agent może je analizować,
ale OpenClaw nie dołącza ich automatycznie do odpowiedzi w kanałach. Aby udostępnić
zrzut ekranu, należy poprosić agenta o jawne wysłanie go za pomocą narzędzia wiadomości.

Istniejące pola `tools.media.image` / `tools.media.models` służą do konfigurowania
modeli zapasowych, limitów czasu, limitów bajtów, profili i ustawień żądań dostawcy.

Jeśli aktywny model główny już obsługuje obrazy i nie skonfigurowano jawnego modelu
rozpoznawania obrazów, OpenClaw zachowuje standardowy wynik obrazu, aby
model główny mógł bezpośrednio odczytać zrzut ekranu.

<AccordionGroup>

<Accordion title="Porty i dostępność">

- Usługa sterowania nasłuchuje na interfejsie pętli zwrotnej na porcie wyznaczonym na podstawie `gateway.port` (domyślnie `18791` = Gateway + 2). `OPENCLAW_GATEWAY_PORT` ma pierwszeństwo przed `gateway.port`; każda z tych wartości przesuwa wyznaczone porty z tej samej grupy.
- Lokalne profile `openclaw` automatycznie przypisują `cdpPort`/`cdpUrl` z zakresu rozpoczynającego się 9 portów powyżej portu sterowania (domyślnie `18800`-`18899`); należy je ustawiać wyłącznie dla
  zdalnych profili CDP lub dołączania do punktu końcowego istniejącej sesji. Jeśli nie ustawiono `cdpUrl`, domyślnie
  używany jest zarządzany lokalny port CDP.
- `remoteCdpTimeoutMs` dotyczy zdalnych kontroli dostępności HTTP CDP i kontroli `attachOnly`
  oraz żądań HTTP otwierających karty; `remoteCdpHandshakeTimeoutMs` dotyczy
  ich uzgadniania połączeń CDP WebSocket. Trwałe wyliczanie zdalnych kart Playwright
  używa większej z tych dwóch wartości jako limitu czasu operacji.
- `localLaunchTimeoutMs` to limit czasu, w którym uruchomiony lokalnie zarządzany proces Chrome
  ma udostępnić swój punkt końcowy HTTP CDP. `localCdpReadyTimeoutMs` to
  późniejszy limit czasu oczekiwania na gotowość WebSocket CDP po wykryciu procesu.
  Wartości te należy zwiększyć na Raspberry Pi, słabszych serwerach VPS lub starszym sprzęcie, na którym Chromium
  uruchamia się powoli. Wartości muszą być dodatnimi liczbami całkowitymi nie większymi niż `120000` ms; nieprawidłowe
  wartości konfiguracji są odrzucane.
- Powtarzające się niepowodzenia uruchomienia lub osiągnięcia gotowości zarządzanego Chrome powodują otwarcie wyłącznika obwodu osobno dla każdego
  profilu. Po kilku kolejnych niepowodzeniach OpenClaw na krótko wstrzymuje nowe próby
  uruchomienia, zamiast uruchamiać Chromium przy każdym wywołaniu narzędzia przeglądarki. Należy usunąć
  problem z uruchamianiem, wyłączyć przeglądarkę, jeśli nie jest potrzebna, albo po naprawie ponownie uruchomić
  Gateway.
- `actionTimeoutMs` to domyślny limit czasu żądań `act` przeglądarki, gdy wywołujący nie przekazuje `timeoutMs`. Warstwa transportowa klienta dodaje niewielki margines czasu, aby długie oczekiwanie mogło się zakończyć zamiast przekroczyć limit na granicy HTTP.
- `tabCleanup` zapewnia czyszczenie w miarę możliwości kart otwartych przez sesje przeglądarki głównego agenta. Czyszczenie cyklu życia podagentów, zadań cron i ACP nadal zamyka jawnie śledzone przez nie karty po zakończeniu sesji; sesje główne zachowują aktywne karty do ponownego użycia, a następnie w tle zamykają bezczynne lub nadmiarowe śledzone karty.

</Accordion>

<Accordion title="Zasady SSRF">

- Żądania nawigacji w przeglądarce i otwierania kart są wstępnie sprawdzane. Podczas działania i ograniczonego okresu dodatkowej ochrony po jego zakończeniu zabezpieczone interakcje Playwright (kliknięcie, kliknięcie współrzędnych, najechanie, przeciągnięcie, przewijanie, wybranie, naciśnięcie, wpisywanie, wypełnianie formularza i wykonywanie kodu) przechwytują zabronione przez zasady ładowanie dokumentów najwyższego poziomu i podramek przed wysłaniem bajtów żądania HTTP, a następnie w miarę możliwości ponownie sprawdzają końcowy adres URL `http(s)`.
- Przed każdym nowym uruchomieniem Chrome zarządzanego przez OpenClaw system OpenClaw w miarę możliwości wyłącza przewidywanie sieciowe, tłumiąc zaobserwowane spekulacyjne połączenia wstępne Chromium dla tych zabronionych operacji ładowania. Jest to ochrona warstwowa, a nie granica zasad: przeglądarka używana ponownie po restarcie usługi sterowania oraz inne mechanizmy przeglądarek mogą nie korzystać z tego zabezpieczenia. Routing Playwright nadal nie jest zaporą sieciową i nie przechwytuje etapów przekierowań, pierwszego żądania wyskakującego okna, ruchu Service Worker, kodu strony wykonywanego po ograniczonym okresie ochrony ani wszystkich ścieżek zasobów podrzędnych i działających w tle. Pełna izolacja ruchu wychodzącego wymaga izolacji po stronie właściciela lub serwera proxy egzekwującego zasady.
- W ścisłym trybie SSRF sprawdzane jest również wykrywanie zdalnych punktów końcowych CDP i sondy `/json/version` (`cdpUrl`).
- Zmienne środowiskowe Gateway/dostawcy `HTTP_PROXY`, `HTTPS_PROXY`, `ALL_PROXY` i `NO_PROXY` nie kierują automatycznie przeglądarki zarządzanej przez OpenClaw przez serwer proxy. Zarządzany Chrome domyślnie uruchamia się z bezpośrednim połączeniem, aby ustawienia proxy dostawcy nie osłabiały kontroli SSRF przeglądarki.
- Lokalne sondy gotowości CDP i połączenia DevTools WebSocket zarządzane przez OpenClaw omijają zarządzany sieciowy serwer proxy dla dokładnie tego uruchomionego punktu końcowego pętli zwrotnej, dzięki czemu `openclaw browser start` nadal działa, gdy serwer proxy operatora blokuje ruch wychodzący przez pętlę zwrotną.
- Aby skierować samą zarządzaną przeglądarkę przez serwer proxy, należy przekazać jawne flagi proxy Chrome za pośrednictwem `browser.extraArgs`, na przykład `--proxy-server=...` lub `--proxy-pac-url=...`. Ścisły tryb SSRF blokuje jawne kierowanie przeglądarki przez serwer proxy, chyba że dostęp przeglądarki do sieci prywatnej został celowo włączony.
- `browser.ssrfPolicy.dangerouslyAllowPrivateNetwork` jest domyślnie wyłączone; należy je włączać tylko wtedy, gdy dostęp przeglądarki do sieci prywatnej jest celowo uznawany za zaufany.
- `browser.ssrfPolicy.allowPrivateNetwork` pozostaje obsługiwane jako starszy alias.

</Accordion>

<Accordion title="Działanie profili">

- `attachOnly: true` oznacza, że lokalna przeglądarka nigdy nie jest uruchamiana; następuje tylko dołączenie, jeśli jest już uruchomiona.
- `headless` można ustawić globalnie lub dla poszczególnych lokalnych profili zarządzanych. Wartości poszczególnych profili zastępują `browser.headless`, dzięki czemu jeden lokalnie uruchamiany profil może działać bez interfejsu graficznego, a inny pozostać widoczny.
- `POST /start?headless=true` i `openclaw browser start --headless` żądają
  jednorazowego uruchomienia bez interfejsu graficznego dla lokalnych profili zarządzanych bez zmiany
  `browser.headless` ani konfiguracji profilu. Profile istniejącej sesji, tylko do dołączania i
  zdalnego CDP odrzucają to nadpisanie, ponieważ OpenClaw nie uruchamia tych
  procesów przeglądarki.
- Na hostach z systemem Linux bez `DISPLAY` ani `WAYLAND_DISPLAY` lokalne profile zarządzane
  domyślnie automatycznie działają bez interfejsu graficznego, jeśli ani środowisko, ani konfiguracja profilu lub globalna
  nie wybierają jawnie trybu z interfejsem graficznym. Należy użyć jednoznacznej formy na poziomie przeglądarki
  `openclaw browser --json status`; końcowe `openclaw browser status --json`
  również działa, ponieważ `status` nie definiuje własnego `--json`. Polecenie zgłasza
  `headlessSource` jako `env`, `profile`, `config`,
  `request`, `linux-display-fallback` lub `default`.
- `OPENCLAW_BROWSER_HEADLESS=1` wymusza uruchamianie lokalnych profili zarządzanych bez interfejsu graficznego w
  bieżącym procesie. `OPENCLAW_BROWSER_HEADLESS=0` wymusza tryb z interfejsem graficznym dla zwykłych
  uruchomień i zwraca możliwy do rozwiązania błąd na hostach z systemem Linux bez serwera wyświetlania;
  jawne żądanie `start --headless` nadal ma pierwszeństwo dla tego jednego uruchomienia.
- Trasa sterowania przeglądarką i klient programistyczny zachowują czytelne dla człowieka
  pole `error` błędu braku wyświetlacza oraz udostępniają stabilną przyczynę
  `no_display_for_headed_profile`. Jego `details` zawierają wyłącznie `profile`,
  `requestedHeadless`, `headlessSource` i `displayPresent`, dzięki czemu klienci API mogą
  wybrać właściwe działanie naprawcze bez dopasowywania tekstu komunikatu.
- Dla uruchomionego lokalnego profilu zarządzanego status i narzędzie doctor odpytują
  punkt końcowy CDP Chrome na poziomie przeglądarki o mechanizm renderowania, backend, urządzenie/sterownik, stan
  funkcji, obejścia problemów ze sterownikami oraz możliwości sprzętowego przyspieszania wideo. Wynik jest
  buforowany dla tego procesu przeglądarki i w całości udostępniany przez
  `openclaw browser --json status`. Pasywne wywołanie statusu nie uruchamia Chrome.
  Przeglądarki istniejących sesji, rozszerzeń, zdalnego CDP i piaskownicy pozostają odrębne
  i nie są sprawdzane za pośrednictwem tej ścieżki zarządzanego hosta.
- Zarządzany Chrome bez interfejsu graficznego nadal używa zachowawczej wartości domyślnej `--disable-gpu`.
  Diagnostyka nie włącza przyspieszania, nie dodaje globalnego ustawienia przyspieszania
  ani nie przyznaje przeglądarce w piaskownicy dostępu do urządzeń.
- `executablePath` można ustawić globalnie lub dla poszczególnych lokalnych profili zarządzanych. Wartości poszczególnych profili zastępują `browser.executablePath`, dzięki czemu różne profile zarządzane mogą uruchamiać różne przeglądarki oparte na Chromium. Obie formy akceptują `~` jako katalog domowy systemu operacyjnego.
- `color` (na najwyższym poziomie i dla poszczególnych profili) barwi interfejs przeglądarki, aby wskazać aktywny profil.
- Domyślnym profilem jest `openclaw` (zarządzany, samodzielny). Aby użyć przeglądarki zalogowanego użytkownika, należy ustawić `defaultProfile: "user"`.
- Kolejność automatycznego wykrywania: domyślna przeglądarka systemowa, jeśli jest oparta na Chromium; w przeciwnym razie Chrome, Brave, Edge, Chromium, Chrome Canary.
- `driver: "existing-session"` używa Chrome DevTools MCP zamiast surowego CDP. Może dołączyć za pośrednictwem automatycznego łączenia Chrome MCP albo za pośrednictwem `cdpUrl`, jeśli punkt końcowy DevTools uruchomionej przeglądarki jest już dostępny.
- `driver: "extension"` steruje zalogowanym Chrome za pośrednictwem [rozszerzenia OpenClaw do Chrome](/pl/tools/chrome-extension). Przekaźnik jest właścicielem swojego punktu końcowego pętli zwrotnej, dlatego te profile nie akceptują `cdpUrl`. Jest to jedyny tryb zalogowanej przeglądarki, który działa bez obecności kogokolwiek przy komputerze.
- Należy ustawić `browser.profiles.<name>.userDataDir`, gdy profil istniejącej sesji ma dołączyć do innego niż domyślny profilu użytkownika Chromium (Brave, Edge itp.). Ta ścieżka akceptuje również `~` jako katalog domowy systemu operacyjnego.

</Accordion>

</AccordionGroup>

## Używanie Brave lub innej przeglądarki opartej na Chromium

Jeśli **domyślna przeglądarka systemowa** jest oparta na Chromium (Chrome/Brave/Edge/itp.),
OpenClaw używa jej automatycznie. Aby zastąpić
automatyczne wykrywanie, należy ustawić `browser.executablePath`. Wartości `executablePath` na najwyższym poziomie i dla poszczególnych profili akceptują `~`
jako katalog domowy systemu operacyjnego:

```bash
openclaw config set browser.executablePath "/usr/bin/google-chrome"
openclaw config set browser.profiles.work.executablePath "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome"
```

Można też ustawić tę wartość w konfiguracji odpowiedniej platformy:

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

Wartość `executablePath` dla profilu wpływa tylko na lokalne profile zarządzane uruchamiane przez OpenClaw.
Profile `existing-session` dołączają natomiast do już uruchomionej przeglądarki,
a zdalne profile CDP używają przeglądarki dostępnej pod adresem `cdpUrl`.

## Sterowanie lokalne a zdalne

- **Sterowanie lokalne (domyślne):** Gateway uruchamia usługę sterowania na interfejsie pętli zwrotnej i może uruchomić lokalną przeglądarkę.
- **Sterowanie zdalne (host Node):** należy uruchomić host Node na maszynie z przeglądarką; Gateway przekazuje do niego działania przeglądarki.
- **Zdalne CDP:** należy ustawić `browser.profiles.<name>.cdpUrl` (lub `browser.cdpUrl`), aby
  dołączyć do zdalnej przeglądarki opartej na Chromium. W takim przypadku OpenClaw nie uruchomi lokalnej przeglądarki.
- W przypadku zewnętrznie zarządzanych usług CDP na interfejsie pętli zwrotnej (na przykład Browserless w
  Dockerze opublikowany pod adresem `127.0.0.1`) należy również ustawić `attachOnly: true`. CDP na interfejsie pętli zwrotnej
  bez `attachOnly` jest traktowane jako lokalny profil przeglądarki zarządzany przez OpenClaw.
- `headless` wpływa tylko na lokalne profile zarządzane uruchamiane przez OpenClaw. Nie uruchamia ponownie ani nie zmienia przeglądarek istniejącej sesji lub zdalnego CDP.
- `executablePath` podlega tej samej regule dotyczącej lokalnych profili zarządzanych. Zmiana tej wartości w
  uruchomionym lokalnym profilu zarządzanym oznacza profil do ponownego uruchomienia/uzgodnienia, dzięki czemu
  następne uruchomienie użyje nowego pliku binarnego.

Sposób zatrzymywania różni się zależnie od trybu profilu:

- lokalne profile zarządzane: `openclaw browser stop` zatrzymuje proces przeglądarki uruchomiony przez
  OpenClaw
- profile tylko do dołączania i zdalnego CDP: `openclaw browser stop` zamyka aktywną
  sesję sterowania i zwalnia nadpisania emulacji Playwright/CDP (obszar roboczy,
  schemat kolorów, ustawienia regionalne, strefę czasową, tryb offline i podobny stan), mimo że
  OpenClaw nie uruchomił żadnego procesu przeglądarki

Zdalne adresy URL CDP mogą zawierać dane uwierzytelniające:

- Tokeny zapytania (np. `https://provider.example?token=<token>`)
- Uwierzytelnianie HTTP Basic (np. `https://user:pass@provider.example`)

OpenClaw zachowuje dane uwierzytelniające podczas wywoływania punktów końcowych `/json/*` i nawiązywania połączenia
z CDP WebSocket. Zamiast zapisywać tokeny w plikach konfiguracyjnych, zaleca się używanie
zmiennych środowiskowych lub menedżerów sekretów.

## Serwer proxy przeglądarki Node (domyślnie bez konfiguracji)

Jeśli na komputerze, na którym działa przeglądarka, uruchomiony jest **host węzła**, OpenClaw może
automatycznie kierować wywołania narzędzia przeglądarki do tego węzła bez dodatkowej konfiguracji przeglądarki.
Jest to domyślna ścieżka dla zdalnych Gatewayów.

Uwagi:

- Host węzła udostępnia swój lokalny serwer sterowania przeglądarką za pośrednictwem **polecenia proxy**.
- Profile pochodzą z własnej konfiguracji `browser.profiles` węzła (tak samo jak lokalnie).
- Polecenie proxy nigdy nie zezwala na trwałe modyfikacje profili (`create-profile`, `delete-profile`, `reset-profile`) niezależnie od `allowProfiles`; takie zmiany należy wprowadzać bezpośrednio w węźle.
- `nodeHost.browserProxy.allowProfiles` jest opcjonalne. Pozostawienie pustej wartości zachowuje starsze/domyślne działanie: wszystkie skonfigurowane profile pozostają dostępne przez proxy.
- Po ustawieniu `nodeHost.browserProxy.allowProfiles` OpenClaw traktuje tę wartość jako granicę minimalnych uprawnień, ograniczającą nazwy profili, do których proxy może kierować żądania.
- Jeśli ta funkcja nie jest potrzebna, można ją wyłączyć:
  - W węźle: `nodeHost.browserProxy.enabled=false`
  - W Gatewayu: `gateway.nodes.browser.mode="off"` (akceptuje również `"auto"`, aby wybrać jeden połączony węzeł przeglądarki, lub `"manual"`, aby wymagać jawnego parametru węzła)

## Browserless (hostowany zdalny CDP)

[Browserless](https://browserless.io) to hostowana usługa Chromium, która udostępnia
adresy URL połączeń CDP przez HTTPS i WebSocket. OpenClaw może używać obu form, ale
dla zdalnego profilu przeglądarki najprostszym rozwiązaniem jest bezpośredni adres URL WebSocket
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

- Zastąp `<BROWSERLESS_API_KEY>` rzeczywistym tokenem Browserless.
- Wybierz regionalny punkt końcowy odpowiadający kontu Browserless (zobacz dokumentację tej usługi).
- Jeśli Browserless udostępnia podstawowy adres URL HTTPS, można przekształcić go na
  `wss://`, aby uzyskać bezpośrednie połączenie CDP, albo zachować adres URL HTTPS i pozwolić OpenClaw
  wykryć `/json/version`.

### Browserless Docker na tym samym hoście

Gdy Browserless jest hostowany samodzielnie w Dockerze, a OpenClaw działa na hoście, należy traktować
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
OpenClaw. Browserless musi również rozgłaszać pasujący, osiągalny punkt końcowy;
ustaw `EXTERNAL` Browserless na tę samą bazę WebSocket dostępną publicznie dla OpenClaw, na przykład
`ws://127.0.0.1:3000`, `ws://browserless:3000` lub stabilny prywatny adres sieci
Docker. Jeśli `/json/version` zwraca `webSocketDebuggerUrl` wskazujące
adres nieosiągalny dla OpenClaw, CDP HTTP może wyglądać na sprawne, mimo że
dołączenie przez WebSocket nadal kończy się niepowodzeniem.

Nie pozostawiaj `attachOnly` bez wartości dla profilu Browserless używającego adresu pętli zwrotnej. Bez
`attachOnly` OpenClaw traktuje port pętli zwrotnej jako lokalny zarządzany profil
przeglądarki i może zgłosić, że port jest używany, ale nie należy do OpenClaw.

## Dostawcy bezpośredniego CDP przez WebSocket

Niektóre hostowane usługi przeglądarek udostępniają **bezpośredni punkt końcowy WebSocket** zamiast
standardowego wykrywania CDP opartego na HTTP (`/json/version`). OpenClaw akceptuje trzy
postacie adresów URL CDP i automatycznie wybiera właściwą strategię połączenia:

- **Wykrywanie HTTP(S)** — `http://host[:port]` lub `https://host[:port]`.
  OpenClaw wywołuje `/json/version`, aby wykryć adres URL debugera WebSocket, a następnie
  nawiązuje połączenie. Bez mechanizmu rezerwowego WebSocket.
- **Bezpośrednie punkty końcowe WebSocket** — `ws://host[:port]/devtools/<kind>/<id>` lub
  `wss://...` ze ścieżką `/devtools/browser|page|worker|shared_worker|service_worker/<id>`.
  OpenClaw łączy się bezpośrednio przez uzgadnianie WebSocket i całkowicie pomija
  `/json/version`.
- **Bazowe adresy WebSocket** — `ws://host[:port]` lub `wss://host[:port]` bez
  ścieżki `/devtools/...` (np. [Browserless](https://browserless.io),
  [Browserbase](https://www.browserbase.com)). OpenClaw najpierw próbuje wykrywania HTTP
  `/json/version` (normalizując schemat do `http`/`https`);
  jeśli wykrywanie zwróci `webSocketDebuggerUrl`, zostaje ono użyte, w przeciwnym razie OpenClaw
  przechodzi na bezpośrednie uzgadnianie WebSocket pod adresem bazowym. Jeśli rozgłaszany
  punkt końcowy WebSocket odrzuca uzgadnianie CDP, ale skonfigurowany adres bazowy
  je akceptuje, OpenClaw również przechodzi na ten adres bazowy. Dzięki temu bazowy `ws://`
  wskazujący lokalną przeglądarkę Chrome nadal może się połączyć, ponieważ Chrome akceptuje uaktualnienia WebSocket
  tylko w określonej ścieżce celu zwróconej przez `/json/version`, natomiast hostowani
  dostawcy mogą nadal używać bazowego punktu końcowego WebSocket, gdy ich punkt końcowy
  wykrywania rozgłasza krótkotrwały adres URL, który nie nadaje się do CDP Playwright.

`openclaw browser doctor` używa tej samej logiki najpierw wykrywania, a następnie rezerwowego połączenia WebSocket
co dołączanie w czasie działania, dlatego adres URL bazowy, z którym można się pomyślnie połączyć, nie jest
zgłaszany przez diagnostykę jako nieosiągalny.

### Browserbase

[Browserbase](https://www.browserbase.com) to platforma chmurowa do uruchamiania
przeglądarek bez interfejsu graficznego, z wbudowanym rozwiązywaniem CAPTCHA, trybem niewykrywalnym i domowymi
serwerami proxy.

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

- [Zarejestruj się](https://www.browserbase.com/sign-up) i skopiuj **API Key**
  z [panelu Overview](https://www.browserbase.com/overview).
- Zastąp `<BROWSERBASE_API_KEY>` rzeczywistym kluczem API Browserbase.
- Browserbase automatycznie tworzy sesję przeglądarki po nawiązaniu połączenia WebSocket, dlatego
  nie jest wymagane ręczne tworzenie sesji.
- Zobacz [cennik](https://www.browserbase.com/pricing), aby poznać aktualne limity warstwy bezpłatnej i płatne plany.
- Pełne informacje o API, przewodniki po SDK i przykłady integracji zawiera
  [dokumentacja Browserbase](https://docs.browserbase.com).

### Notte

[Notte](https://www.notte.cc) to platforma chmurowa do uruchamiania przeglądarek
bez interfejsu graficznego, z wbudowanym trybem niewykrywalnym, domowymi serwerami proxy i natywną dla CDP
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

- [Zarejestruj się](https://console.notte.cc) i skopiuj **API Key** ze
  strony ustawień konsoli.
- Zastąp `<NOTTE_API_KEY>` rzeczywistym kluczem API Notte.
- Notte automatycznie tworzy sesję przeglądarki po nawiązaniu połączenia WebSocket, dlatego
  nie jest wymagane ręczne tworzenie sesji. Sesja zostaje zniszczona po
  rozłączeniu WebSocket.
- Zobacz [cennik](https://www.notte.cc/#pricing), aby poznać aktualne limity warstwy bezpłatnej i płatne plany.
- Pełne informacje o API, przewodniki po SDK i przykłady integracji zawiera
  [dokumentacja Notte](https://docs.notte.cc).

## Bezpieczeństwo

Najważniejsze założenia:

- Sterowanie przeglądarką jest dostępne tylko przez interfejs pętli zwrotnej; dostęp odbywa się przez uwierzytelnianie Gatewaya lub parowanie węzłów.
- Samodzielny interfejs API HTTP przeglądarki dostępny przez pętlę zwrotną używa **wyłącznie uwierzytelniania współdzielonym sekretem**:
  uwierzytelniania tokenem bearer Gatewaya, `x-openclaw-password` lub uwierzytelniania HTTP Basic przy użyciu
  skonfigurowanego hasła Gatewaya.
- Nagłówki tożsamości Tailscale Serve i `gateway.auth.mode: "trusted-proxy"`
  **nie** uwierzytelniają tego samodzielnego interfejsu API przeglądarki dostępnego przez pętlę zwrotną.
- Jeśli sterowanie przeglądarką jest włączone i nie skonfigurowano uwierzytelniania współdzielonym sekretem, OpenClaw
  podczas uruchamiania automatycznie generuje i zapisuje dane uwierzytelniające sterowania przeglądarką:
  token, gdy `gateway.auth.mode` ma wartość `none`, lub hasło, gdy ma wartość
  `trusted-proxy` (zapisywane przez `gateway.auth.password`, aby klienci pętli zwrotnej
  działający poza procesem mogli je rozpoznać). Automatyczne generowanie jest pomijane, gdy dla tego trybu
  skonfigurowano już jawne tekstowe dane uwierzytelniające lub gdy
  `gateway.auth.mode` ma wartość `password`.
- Skonfiguruj jawnie `gateway.auth.token`, `gateway.auth.password`, `OPENCLAW_GATEWAY_TOKEN` lub
  `OPENCLAW_GATEWAY_PASSWORD`, jeśli zamiast wygenerowanego sekretu potrzebny jest stabilny sekret
  pozostający pod własną kontrolą.

Wskazówki dotyczące zdalnego CDP:

- W miarę możliwości preferuj szyfrowane punkty końcowe (HTTPS lub WSS) i krótkotrwałe tokeny.
- Unikaj osadzania długotrwałych tokenów bezpośrednio w plikach konfiguracyjnych.
- Utrzymuj Gateway i wszystkie hosty węzłów w sieci prywatnej (Tailscale); unikaj publicznego udostępniania.
- Traktuj zdalne adresy URL i tokeny CDP jako sekrety; preferuj zmienne środowiskowe lub menedżera sekretów.

## Profile (wiele przeglądarek)

OpenClaw obsługuje wiele nazwanych profili (konfiguracji routingu). Profile mogą być następujące:

- **zarządzany przez OpenClaw**: dedykowana instancja przeglądarki opartej na Chromium z własnym katalogiem danych użytkownika i portem CDP
- **zdalny**: jawny adres URL CDP (przeglądarka oparta na Chromium działająca w innym miejscu)
- **istniejąca sesja**: istniejący profil Chrome przez automatyczne połączenie Chrome DevTools MCP

Wartości domyślne:

- Profil `openclaw` jest tworzony automatycznie, jeśli go brakuje.
- Profil `user` jest wbudowany i służy do dołączania do istniejącej sesji przez Chrome MCP.
- Poza `user` profile istniejących sesji wymagają jawnego włączenia; można je utworzyć za pomocą `--driver existing-session`.
- Lokalne porty CDP są domyślnie przydzielane z zakresu **18800-18899**.
- Usunięcie profilu przenosi jego lokalny katalog danych do Kosza.

Wszystkie punkty końcowe sterowania akceptują `?profile=<name>`; CLI używa `--browser-profile`.

## Istniejąca sesja przez Chrome DevTools MCP

OpenClaw może również dołączyć do uruchomionego profilu przeglądarki opartej na Chromium za pośrednictwem
oficjalnego serwera Chrome DevTools MCP. Pozwala to ponownie wykorzystać karty i stan logowania
już otwarte w tym profilu przeglądarki.

Oficjalne materiały wprowadzające i instrukcje konfiguracji:

- [Chrome dla deweloperów: korzystanie z Chrome DevTools MCP z sesją przeglądarki](https://developer.chrome.com/blog/chrome-devtools-mcp-debug-your-browser-session)
- [README Chrome DevTools MCP](https://github.com/ChromeDevTools/chrome-devtools-mcp)

Wbudowany profil: `user`. Jeśli potrzebna jest inna nazwa, inny kolor lub inny katalog danych przeglądarki,
należy utworzyć własny profil istniejącej sesji.

Domyślnie wbudowany profil `user` używa automatycznego połączenia Chrome MCP, które
wybiera domyślny lokalny profil Google Chrome. Użyj `userDataDir` dla Brave,
Edge, Chromium lub profilu Chrome innego niż domyślny. `~` rozwija się do katalogu domowego
systemu operacyjnego:

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

1. Otwórz stronę inspekcji tej przeglądarki przeznaczoną do zdalnego debugowania.
2. Włącz zdalne debugowanie.
3. Pozostaw przeglądarkę uruchomioną i zatwierdź monit o połączenie, gdy OpenClaw będzie się dołączać.

Typowe strony inspekcji:

- Chrome: `chrome://inspect/#remote-debugging`
- Brave: `brave://inspect/#remote-debugging`
- Edge: `edge://inspect/#remote-debugging`

Test kontrolny dołączenia na żywo:

```bash
openclaw browser --browser-profile user start
openclaw browser --browser-profile user status
openclaw browser --browser-profile user tabs
openclaw browser --browser-profile user snapshot --format ai
```

Oznaki powodzenia:

- `status` pokazuje `driver: existing-session`
- `status` pokazuje `transport: chrome-mcp`
- `status` pokazuje `running: true`
- `tabs` wyświetla listę już otwartych kart przeglądarki
- `snapshot` zwraca odwołania z wybranej aktywnej karty

Co sprawdzić, jeśli dołączanie nie działa:

- docelowa przeglądarka oparta na Chromium ma wersję `144+`
- zdalne debugowanie jest włączone na stronie inspekcji tej przeglądarki
- przeglądarka wyświetliła monit o zgodę na dołączenie i zgoda została udzielona
- jeśli Chrome uruchomiono z jawnym parametrem `--remote-debugging-port`, należy ustawić
  `browser.profiles.<name>.cdpUrl` na ten punkt końcowy DevTools zamiast polegać
  na automatycznym łączeniu Chrome MCP
- `openclaw doctor` migruje starą konfigurację przeglądarki opartą na rozszerzeniu i sprawdza,
  czy Chrome jest zainstalowany lokalnie dla domyślnych profili automatycznego łączenia, ale nie może
  włączyć zdalnego debugowania po stronie przeglądarki

Użycie przez agenta:

- Należy użyć `profile="user"`, gdy potrzebny jest stan przeglądarki z zalogowanym użytkownikiem.
- W przypadku używania niestandardowego profilu istniejącej sesji należy przekazać jawną nazwę tego profilu.
- Ten tryb należy wybierać tylko wtedy, gdy użytkownik jest przy komputerze i może zatwierdzić monit
  o dołączenie.
- Host Gateway lub Node może uruchomić `npx chrome-devtools-mcp@latest --autoConnect`.

Uwagi:

- Ta ścieżka wiąże się z większym ryzykiem niż izolowany profil `openclaw`, ponieważ może
  wykonywać działania w zalogowanej sesji przeglądarki.
- OpenClaw nie uruchamia przeglądarki dla tego sterownika; jedynie się do niej dołącza.
- OpenClaw używa tutaj oficjalnego przepływu Chrome DevTools MCP `--autoConnect`. Jeśli
  ustawiono `userDataDir`, wartość ta jest przekazywana w celu wskazania tego katalogu danych użytkownika.
- Tryb istniejącej sesji może dołączać na wybranym hoście lub za pośrednictwem połączonego
  węzła przeglądarki. Jeśli Chrome działa gdzie indziej i nie jest połączony żaden węzeł przeglądarki, należy użyć
  zdalnego CDP lub hosta Node.
- Cele Chrome MCP i odwołania migawek są ograniczone do jednego podprocesu MCP. Po
  ponownym uruchomieniu tego procesu należy ponownie uruchomić `browser tabs`, jawnie wybrać nowy
  cel przed wykonaniem pracy specyficznej dla celu oraz utworzyć nową migawkę przed użyciem odwołań.
  Każde odwołanie jest prawidłowe tylko dla swojego celu i najnowszej migawki. Stare aliasy nie są
  przenoszone do zastępczej karty, nawet jeśli jej adres URL jest taki sam.
- Chrome DevTools MCP obecnie kieruje narzędzia stron według lokalnego dla procesu numerycznego
  identyfikatora strony. Uchwyty ograniczone do procesu zapobiegają ponownemu użyciu po zastąpieniu podprocesu, ale
  zastąpienie kontekstu przeglądarki w obrębie procesu między sąsiadującymi wywołaniami narzędzi nadal może
  przekierować działanie do innego celu. W pełni atomowe kierowanie wymaga obsługi stabilnych identyfikatorów celów
  przez nadrzędne narzędzia stron.

### Niestandardowe uruchamianie Chrome MCP

Można zastąpić uruchamiany serwer Chrome DevTools MCP dla każdego profilu, gdy domyślny
przepływ `npx chrome-devtools-mcp@latest` nie jest odpowiedni (hosty offline,
przypięte wersje, dostarczane lokalnie pliki wykonywalne):

| Pole         | Działanie                                                                                                                   |
| ------------ | -------------------------------------------------------------------------------------------------------------------------- |
| `mcpCommand` | Plik wykonywalny uruchamiany zamiast `npx`. Jest rozpoznawany bez zmian; ścieżki bezwzględne są respektowane.            |
| `mcpArgs`    | Tablica argumentów przekazywana bez zmian do `mcpCommand`. Zastępuje domyślne argumenty `chrome-devtools-mcp@latest --autoConnect`. |

Gdy w profilu istniejącej sesji ustawiono `cdpUrl`, OpenClaw pomija
`--autoConnect` i automatycznie przekazuje punkt końcowy do Chrome MCP:

- `http(s)://...` → `--browserUrl <url>` (punkt końcowy wykrywania HTTP DevTools).
- `ws(s)://...` → `--wsEndpoint <url>` (bezpośredni WebSocket CDP).

Flag punktu końcowego i `userDataDir` nie można łączyć: gdy ustawiono `cdpUrl`,
`userDataDir` jest ignorowany podczas uruchamiania Chrome MCP, ponieważ Chrome MCP dołącza do
działającej przeglądarki za punktem końcowym zamiast otwierać katalog
profilu.

<Accordion title="Ograniczenia funkcji istniejącej sesji">

W porównaniu z zarządzanym profilem `openclaw` sterowniki istniejącej sesji mają więcej ograniczeń:

- **Zrzuty ekranu** — działają przechwytywanie stron i przechwytywanie elementów `--ref`; selektory CSS `--element` nie działają. Playwright nie jest wymagany do wykonywania zrzutów stron ani zrzutów elementów opartych na odwołaniach. (`--full-page` nie można łączyć z `--ref` ani `--element` w żadnym profilu, nie tylko w istniejącej sesji.)
- **Działania** — `click`, `type`, `hover`, `scrollIntoView`, `drag` i `select` wymagają odwołań migawek (bez selektorów CSS). `click-coords` klika widoczne współrzędne obszaru roboczego i nie wymaga odwołania do migawki. `click` obsługuje tylko lewy przycisk (bez zastępowania przycisku ani modyfikatorów). `type` nie obsługuje `slowly=true`; należy użyć `fill` lub `press`. `press` nie obsługuje `delayMs`. `type`, `hover`, `scrollIntoView`, `drag`, `select` i `fill` nie obsługują zastępowania `timeoutMs` dla poszczególnych wywołań; `evaluate` je obsługuje. `select` przyjmuje pojedynczą wartość. `batch` nie jest obsługiwane; działania należy wysyłać pojedynczo.
- **Oczekiwanie / przesyłanie / okno dialogowe** — `wait --url` obsługuje wzorce dokładne, podciągi i glob (tak samo jak profil zarządzany); `wait --load networkidle` nie jest obsługiwane w profilach istniejącej sesji (działa w profilach zarządzanych oraz surowych/zdalnych profilach CDP). Punkty zaczepienia przesyłania wymagają `ref` lub `inputRef`, po jednym pliku naraz, bez CSS `element`. Punkty zaczepienia okien dialogowych nie obsługują zastępowania limitu czasu ani `dialogId`.
- **Widoczność okien dialogowych** — odpowiedzi zarządzanych działań przeglądarki zawierają `blockedByDialog` i `browserState.dialogs.pending`, gdy działanie otwiera modalne okno dialogowe; migawki zawierają również stan oczekującego okna dialogowego. Gdy okno dialogowe oczekuje, należy odpowiedzieć za pomocą `browser dialog --accept/--dismiss --dialog-id <id>`. Okna dialogowe obsłużone poza OpenClaw pojawiają się w `browserState.dialogs.recent`.
- **Funkcje dostępne tylko w trybie zarządzanym** — eksport do PDF, przechwytywanie pobierania i `responsebody` nadal wymagają zarządzanej ścieżki przeglądarki.

</Accordion>

## Gwarancje izolacji

- **Dedykowany katalog danych użytkownika**: nigdy nie modyfikuje osobistego profilu przeglądarki.
- **Dedykowane porty**: unika `9222`, aby zapobiegać kolizjom z przepływami pracy programistycznej.
- **Deterministyczne sterowanie kartami**: `tabs` zwraca najpierw `suggestedTargetId`, a następnie
  stabilne uchwyty `tabId`, takie jak `t1`, opcjonalne etykiety i surowy `targetId`.
  Agenci powinni ponownie używać `suggestedTargetId`; surowe identyfikatory pozostają dostępne do
  debugowania i zapewniania zgodności.

## Wybór przeglądarki

Podczas uruchamiania lokalnego OpenClaw wybiera pierwszą dostępną przeglądarkę:

1. Chrome
2. Brave
3. Edge
4. Chromium
5. Chrome Canary

Wybór można zastąpić za pomocą `browser.executablePath`.

Platformy:

- macOS: sprawdza `/Applications` i `~/Applications`.
- Linux: sprawdza typowe lokalizacje Chrome/Brave/Edge/Chromium w `/usr/bin`,
  `/snap/bin`, `/opt/google`, `/opt/brave.com`, `/usr/lib/chromium` i
  `/usr/lib/chromium-browser`, a także Chromium zarządzane przez Playwright w
  `PLAYWRIGHT_BROWSERS_PATH` lub `~/.cache/ms-playwright`.
- Windows: sprawdza typowe lokalizacje instalacji.

## Interfejs API sterowania (opcjonalny)

Na potrzeby skryptów i debugowania Gateway udostępnia niewielki **interfejs API sterowania HTTP
dostępny wyłącznie przez interfejs pętli zwrotnej** oraz odpowiadający mu interfejs CLI `openclaw browser` (migawki, odwołania, oczekiwanie
z rozszerzonymi możliwościami, dane wyjściowe JSON, przepływy debugowania). Pełna dokumentacja znajduje się w
[Interfejs API sterowania przeglądarką](/pl/tools/browser-control).

## Rozwiązywanie problemów

Problemy specyficzne dla systemu Linux (zwłaszcza Chromium w pakiecie snap) opisano w sekcji
[Rozwiązywanie problemów z przeglądarką](/pl/tools/browser-linux-troubleshooting).

Konfiguracje z Gateway w WSL2 i Chrome w systemie Windows działającymi na oddzielnych hostach opisano w sekcji
[Rozwiązywanie problemów z WSL2 + Windows + zdalnym CDP Chrome](/pl/tools/browser-wsl2-windows-remote-cdp-troubleshooting).

### Niepowodzenie uruchamiania CDP a blokada SSRF nawigacji

Są to różne klasy błędów, które wskazują na różne ścieżki kodu.

- **Niepowodzenie uruchamiania lub gotowości CDP** oznacza, że OpenClaw nie może potwierdzić prawidłowego działania płaszczyzny sterowania przeglądarką.
- **Blokada SSRF nawigacji** oznacza, że płaszczyzna sterowania przeglądarką działa prawidłowo, ale docelowy adres nawigacji strony jest odrzucany przez zasady.

Typowe przykłady:

- Niepowodzenie uruchamiania lub gotowości CDP:
  - `Chrome CDP websocket for profile "openclaw" is not reachable after start`
  - `Remote CDP for profile "<name>" is not reachable at <cdpUrl>`
  - `Port <port> is in use for profile "<name>" but not by openclaw`, gdy
    skonfigurowano zewnętrzną usługę CDP w interfejsie pętli zwrotnej bez `attachOnly: true`
- Blokada SSRF nawigacji:
  - przepływy `open`, `navigate`, migawek lub otwierania kart kończą się błędem zasad przeglądarki/sieci, podczas gdy `start` i `tabs` nadal działają

Aby rozróżnić te dwa przypadki, należy użyć następującej minimalnej sekwencji:

```bash
openclaw browser --browser-profile openclaw start
openclaw browser --browser-profile openclaw tabs
openclaw browser --browser-profile openclaw open https://example.com
```

Interpretowanie wyników:

- Jeśli `start` kończy się niepowodzeniem z `not reachable after start`, należy najpierw rozwiązać problemy z gotowością CDP.
- Jeśli `start` kończy się powodzeniem, ale `tabs` nie, płaszczyzna sterowania nadal nie działa prawidłowo. Należy traktować to jako problem z osiągalnością CDP, a nie problem z nawigacją strony.
- Jeśli `start` i `tabs` kończą się powodzeniem, ale `open` lub `navigate` nie, płaszczyzna sterowania przeglądarką działa, a błąd dotyczy zasad nawigacji lub strony docelowej.
- Jeśli `start`, `tabs` i `open` kończą się powodzeniem, podstawowa ścieżka sterowania zarządzaną przeglądarką działa prawidłowo.

Ważne szczegóły działania:

- Konfiguracja przeglądarki domyślnie używa obiektu zasad SSRF odmawiającego dostępu w razie błędu, nawet jeśli `browser.ssrfPolicy` nie zostało skonfigurowane.
- W przypadku lokalnego zarządzanego profilu `openclaw` w interfejsie pętli zwrotnej kontrole kondycji CDP celowo pomijają egzekwowanie osiągalności SSRF przeglądarki dla własnej lokalnej płaszczyzny sterowania OpenClaw.
- Ochrona nawigacji działa oddzielnie. Pomyślny wynik `start` lub `tabs` nie oznacza, że późniejszy cel `open` lub `navigate` jest dozwolony.

Wskazówki dotyczące bezpieczeństwa:

- Domyślnie **nie należy** łagodzić zasad SSRF przeglądarki.
- Należy preferować wąskie wyjątki hostów, takie jak `hostnameAllowlist` lub `allowedHostnames`, zamiast szerokiego dostępu do sieci prywatnej.
- Opcji `dangerouslyAllowPrivateNetwork: true` należy używać wyłącznie w celowo zaufanych środowiskach, w których dostęp przeglądarki do sieci prywatnej jest wymagany i został zweryfikowany.

## Narzędzia agenta i sposób działania sterowania

Agent otrzymuje **jedno narzędzie** do automatyzacji przeglądarki:

- `browser` — doctor/status/start/stop/tabs/open/focus/close/snapshot/screenshot/navigate/act

Mapowanie:

- `browser snapshot` zwraca stabilne drzewo interfejsu użytkownika (AI lub ARIA).
- `browser act` używa identyfikatorów `ref` ze zrzutu do klikania, wpisywania, przeciągania i wybierania.
- `browser screenshot` przechwytuje piksele (całą stronę, element lub oznaczone odwołania).
- `browser doctor` sprawdza gotowość Gateway, pluginu, profilu, przeglądarki i karty.
- `browser` akceptuje:
  - `profile` w celu wybrania nazwanego profilu przeglądarki (openclaw, chrome lub zdalnego CDP).
  - `target` (`sandbox` | `host` | `node`) w celu wybrania lokalizacji przeglądarki.
  - W sesjach izolowanych `target: "host"` wymaga `agents.defaults.sandbox.browser.allowHostControl=true`.
  - Jeśli pominięto `target`: sesje izolowane domyślnie używają `sandbox`, a sesje nieizolowane — `host`.
  - Jeśli połączony jest Node obsługujący przeglądarkę, narzędzie może automatycznie skierować do niego żądanie, chyba że przypisano na stałe `target="host"` lub `target="node"`.

Zapewnia to deterministyczne działanie agenta i pozwala uniknąć zawodnych selektorów.

## Powiązane

- [Przegląd narzędzi](/pl/tools) — wszystkie dostępne narzędzia agenta
- [Izolacja](/pl/gateway/sandboxing) — sterowanie przeglądarką w środowiskach izolowanych
- [Bezpieczeństwo](/pl/gateway/security) — zagrożenia związane ze sterowaniem przeglądarką i jego zabezpieczanie
