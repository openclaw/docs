---
read_when:
    - Potrzebujesz dokładnej semantyki konfiguracji na poziomie pól lub wartości domyślnych
    - Sprawdzasz poprawność bloków konfiguracji kanału, modelu, Gateway lub narzędzia
summary: Dokumentacja referencyjna konfiguracji Gateway dla podstawowych kluczy OpenClaw, wartości domyślnych i odnośników do dedykowanych dokumentacji referencyjnych podsystemów
title: Dokumentacja referencyjna konfiguracji
x-i18n:
    generated_at: "2026-05-12T00:58:47Z"
    model: gpt-5.5
    provider: openai
    source_hash: 7b8e31f7a6ed82faf3b5a50daa286bb6fce0c2e4452ae81a8e792a437004ad54
    source_path: gateway/configuration-reference.md
    workflow: 16
---

Podstawowa dokumentacja konfiguracji dla `~/.openclaw/openclaw.json`. Omówienie zorientowane na zadania znajdziesz w [Konfiguracji](/pl/gateway/configuration).

Obejmuje główne powierzchnie konfiguracji OpenClaw i odsyła dalej, gdy podsystem ma własną, głębszą dokumentację. Katalogi poleceń należące do kanałów i pluginów oraz głębokie ustawienia pamięci/QMD znajdują się na własnych stronach, a nie na tej.

Źródło prawdy w kodzie:

- `openclaw config schema` wypisuje bieżący JSON Schema używany do walidacji i Control UI, z dołączonymi metadanymi wbudowanymi/pluginów/kanałów, gdy są dostępne
- `config.schema.lookup` zwraca jeden węzeł schematu ograniczony do ścieżki na potrzeby narzędzi drill-down
- `pnpm config:docs:check` / `pnpm config:docs:gen` walidują hash bazowy dokumentacji konfiguracji względem bieżącej powierzchni schematu

Ścieżka wyszukiwania agenta: użyj akcji narzędzia `gateway` `config.schema.lookup`, aby uzyskać dokładną dokumentację i ograniczenia na poziomie pól przed edycją. Użyj [Konfiguracji](/pl/gateway/configuration) dla wskazówek zorientowanych na zadania, a tej strony dla szerszej mapy pól, wartości domyślnych i linków do dokumentacji podsystemów.

Dedykowane szczegółowe dokumentacje:

- [Dokumentacja konfiguracji pamięci](/pl/reference/memory-config) dla `agents.defaults.memorySearch.*`, `memory.qmd.*`, `memory.citations` oraz konfiguracji dreaming pod `plugins.entries.memory-core.config.dreaming`
- [Polecenia slash](/pl/tools/slash-commands) dla bieżącego katalogu poleceń wbudowanych i dołączonych
- strony właścicielskich kanałów/pluginów dla powierzchni poleceń specyficznych dla kanału

Format konfiguracji to **JSON5** (dozwolone komentarze i końcowe przecinki). Wszystkie pola są opcjonalne - OpenClaw używa bezpiecznych wartości domyślnych, gdy zostaną pominięte.

---

## Kanały

Klucze konfiguracji poszczególnych kanałów przeniesiono na dedykowaną stronę - zobacz [Konfiguracja - kanały](/pl/gateway/config-channels) dla `channels.*`, w tym Slack, Discord, Telegram, WhatsApp, Matrix, iMessage i innych dołączonych kanałów (uwierzytelnianie, kontrola dostępu, wiele kont, bramkowanie wzmianek).

## Wartości domyślne agenta, wielu agentów, sesje i wiadomości

Przeniesiono na dedykowaną stronę - zobacz [Konfiguracja - agenci](/pl/gateway/config-agents) dla:

- `agents.defaults.*` (workspace, model, thinking, heartbeat, pamięć, media, skills, sandbox)
- `multiAgent.*` (routing i powiązania wielu agentów)
- `session.*` (cykl życia sesji, compaction, przycinanie)
- `messages.*` (dostarczanie wiadomości, TTS, renderowanie markdown)
- `talk.*` (tryb Talk)
  - `talk.consultThinkingLevel`: nadpisanie poziomu thinking dla pełnego uruchomienia agenta OpenClaw za konsultacjami realtime Control UI Talk
  - `talk.consultFastMode`: jednorazowe nadpisanie trybu szybkiego dla konsultacji realtime Control UI Talk
  - `talk.speechLocale`: opcjonalny identyfikator lokalizacji BCP 47 dla rozpoznawania mowy Talk na iOS/macOS
  - `talk.silenceTimeoutMs`: gdy nie ustawiono, Talk zachowuje domyślne okno pauzy platformy przed wysłaniem transkrypcji (`700 ms on macOS and Android, 900 ms on iOS`)

## Narzędzia i niestandardowi dostawcy

Polityka narzędzi, eksperymentalne przełączniki, konfiguracja narzędzi wspieranych przez dostawców oraz konfiguracja niestandardowego dostawcy / bazowego URL zostały przeniesione na dedykowaną stronę - zobacz [Konfiguracja - narzędzia i niestandardowi dostawcy](/pl/gateway/config-tools).

## Modele

Definicje dostawców, listy dozwolonych modeli i konfiguracja niestandardowych dostawców znajdują się w [Konfiguracja - narzędzia i niestandardowi dostawcy](/pl/gateway/config-tools#custom-providers-and-base-urls). Root `models` odpowiada też za globalne zachowanie katalogu modeli.

```json5
{
  models: {
    // Optional. Default: true. Requires a Gateway restart when changed.
    pricing: { enabled: false },
  },
}
```

- `models.mode`: zachowanie katalogu dostawcy (`merge` lub `replace`).
- `models.providers`: mapa niestandardowych dostawców kluczowana identyfikatorem dostawcy.
- `models.providers.*.localService`: opcjonalny menedżer procesów na żądanie dla lokalnych serwerów modeli. OpenClaw sprawdza skonfigurowany endpoint zdrowia, uruchamia bezwzględne `command` w razie potrzeby, czeka na gotowość, a następnie wysyła żądanie modelu. Zobacz [Lokalne usługi modeli](/pl/gateway/local-model-services).
- `models.pricing.enabled`: kontroluje bootstrap cennika w tle, który startuje po tym, jak sidecary i kanały osiągną ścieżkę gotowości Gateway. Gdy `false`, Gateway pomija pobieranie katalogów cenowych OpenRouter i LiteLLM; skonfigurowane wartości `models.providers.*.models[].cost` nadal działają dla lokalnych szacunków kosztów.

## MCP

Definicje serwerów MCP zarządzanych przez OpenClaw znajdują się pod `mcp.servers` i są używane przez osadzone Pi oraz inne adaptery runtime. Polecenia `openclaw mcp list`, `show`, `set` i `unset` zarządzają tym blokiem bez łączenia się z serwerem docelowym podczas edycji konfiguracji.

```json5
{
  mcp: {
    // Optional. Default: 600000 ms (10 minutes). Set 0 to disable idle eviction.
    sessionIdleTtlMs: 600000,
    servers: {
      docs: {
        command: "npx",
        args: ["-y", "@modelcontextprotocol/server-fetch"],
      },
      remote: {
        url: "https://example.com/mcp",
        transport: "streamable-http", // streamable-http | sse
        headers: {
          Authorization: "Bearer ${MCP_REMOTE_TOKEN}",
        },
      },
    },
  },
}
```

- `mcp.servers`: nazwane definicje serwerów MCP stdio lub zdalnych dla runtime’ów, które udostępniają skonfigurowane narzędzia MCP. Zdalne wpisy używają `transport: "streamable-http"` lub `transport: "sse"`; `type: "http"` to natywny dla CLI alias, który `openclaw mcp set` i `openclaw doctor --fix` normalizują do kanonicznego pola `transport`.
- `mcp.sessionIdleTtlMs`: bezczynny TTL dla dołączonych runtime’ów MCP ograniczonych do sesji. Jednorazowe osadzone uruchomienia żądają czyszczenia po zakończeniu uruchomienia; ten TTL jest zabezpieczeniem dla długotrwałych sesji i przyszłych wywołujących.
- Zmiany pod `mcp.*` stosują się na gorąco przez zwolnienie zbuforowanych runtime’ów MCP sesji. Następne wykrycie/użycie narzędzia odtwarza je z nowej konfiguracji, więc usunięte wpisy `mcp.servers` są zbierane natychmiast zamiast czekać na bezczynny TTL.

Zobacz [MCP](/pl/cli/mcp#openclaw-as-an-mcp-client-registry) i [Backendy CLI](/pl/gateway/cli-backends#bundle-mcp-overlays), aby poznać zachowanie runtime.

## Skills

```json5
{
  skills: {
    allowBundled: ["gemini", "peekaboo"],
    load: {
      extraDirs: ["~/Projects/agent-scripts/skills"],
      allowSymlinkTargets: ["~/Projects/manager/skills"],
    },
    install: {
      preferBrew: true,
      nodeManager: "npm", // npm | pnpm | yarn | bun
      allowUploadedArchives: false,
    },
    entries: {
      "image-lab": {
        apiKey: { source: "env", provider: "default", id: "GEMINI_API_KEY" }, // or plaintext string
        env: { GEMINI_API_KEY: "GEMINI_KEY_HERE" },
      },
      peekaboo: { enabled: true },
      sag: { enabled: false },
    },
  },
}
```

- `allowBundled`: opcjonalna lista dozwolonych wyłącznie dla dołączonych skills (zarządzane/workspace skills pozostają bez wpływu).
- `load.extraDirs`: dodatkowe współdzielone korzenie skills (najniższy priorytet).
- `load.allowSymlinkTargets`: zaufane rzeczywiste korzenie docelowe, do których mogą rozwiązywać się symlinki skills, gdy link znajduje się poza skonfigurowanym korzeniem źródłowym.
- `install.preferBrew`: gdy true, preferuj instalatory Homebrew, kiedy `brew` jest dostępne, zanim nastąpi przejście do innych rodzajów instalatorów.
- `install.nodeManager`: preferencja instalatora node dla specyfikacji `metadata.openclaw.install` (`npm` | `pnpm` | `yarn` | `bun`).
- `install.allowUploadedArchives`: zezwala zaufanym klientom Gateway `operator.admin` instalować prywatne archiwa zip wystawione przez `skills.upload.*` (domyślnie: false). Włącza to tylko ścieżkę przesłanego archiwum; zwykłe instalacje ClawHub tego nie wymagają.
- `entries.<skillKey>.enabled: false` wyłącza skill, nawet jeśli jest dołączony/zainstalowany.
- `entries.<skillKey>.apiKey`: ułatwienie dla skills deklarujących główną zmienną env (ciąg jawny lub obiekt SecretRef).

---

## Pluginy

```json5
{
  plugins: {
    enabled: true,
    allow: ["voice-call"],
    bundledDiscovery: "allowlist",
    deny: [],
    load: {
      paths: ["~/Projects/oss/voice-call-plugin"],
    },
    entries: {
      "voice-call": {
        enabled: true,
        hooks: {
          allowPromptInjection: false,
        },
        config: { provider: "twilio" },
      },
    },
  },
}
```

- Ładowane z `~/.openclaw/extensions`, `<workspace>/.openclaw/extensions` oraz `plugins.load.paths`.
- Wykrywanie akceptuje natywne pluginy OpenClaw oraz zgodne pakiety Codex i pakiety Claude, w tym bezmanifestowe pakiety Claude o domyślnym układzie.
- **Zmiany konfiguracji wymagają restartu gateway.**
- `allow`: opcjonalna lista dozwolonych (ładowane są tylko wymienione pluginy). `deny` ma pierwszeństwo.
- `bundledDiscovery`: domyślnie `"allowlist"` dla nowych konfiguracji, więc niepusta lista `plugins.allow` bramkuje również dołączone pluginy dostawców, w tym runtime’owych dostawców wyszukiwania w sieci. Doctor zapisuje `"compat"` dla zmigrowanych starszych konfiguracji listy dozwolonych, aby zachować istniejące zachowanie dołączonych dostawców do czasu świadomego włączenia.
- `plugins.entries.<id>.apiKey`: wygodne pole klucza API na poziomie pluginu (gdy obsługiwane przez plugin).
- `plugins.entries.<id>.env`: mapa zmiennych env ograniczona do pluginu.
- `plugins.entries.<id>.hooks.allowPromptInjection`: gdy `false`, core blokuje `before_prompt_build` i ignoruje pola mutujące prompt ze starszego `before_agent_start`, zachowując jednocześnie starsze `modelOverride` i `providerOverride`. Dotyczy natywnych hooków pluginu oraz obsługiwanych katalogów hooków dostarczanych przez pakiety.
- `plugins.entries.<id>.hooks.allowConversationAccess`: gdy `true`, zaufane niewbudowane pluginy mogą odczytywać surową treść rozmowy z typowanych hooków, takich jak `llm_input`, `llm_output`, `before_model_resolve`, `before_agent_reply`, `before_agent_run`, `before_agent_finalize` i `agent_end`.
- `plugins.entries.<id>.subagent.allowModelOverride`: jawnie zaufaj temu pluginowi, aby mógł żądać nadpisań `provider` i `model` dla pojedynczego uruchomienia w tle subagenta.
- `plugins.entries.<id>.subagent.allowedModels`: opcjonalna lista dozwolonych kanonicznych celów `provider/model` dla zaufanych nadpisań subagenta. Używaj `"*"` tylko wtedy, gdy celowo chcesz zezwolić na dowolny model.
- `plugins.entries.<id>.llm.allowModelOverride`: jawnie zaufaj temu pluginowi, aby mógł żądać nadpisań modelu dla `api.runtime.llm.complete`.
- `plugins.entries.<id>.llm.allowedModels`: opcjonalna lista dozwolonych kanonicznych celów `provider/model` dla zaufanych nadpisań uzupełniania LLM przez plugin. Używaj `"*"` tylko wtedy, gdy celowo chcesz zezwolić na dowolny model.
- `plugins.entries.<id>.llm.allowAgentIdOverride`: jawnie zaufaj temu pluginowi, aby mógł uruchamiać `api.runtime.llm.complete` względem innego niż domyślny identyfikatora agenta.
- `plugins.entries.<id>.config`: obiekt konfiguracji zdefiniowany przez plugin (walidowany przez natywny schemat pluginu OpenClaw, gdy dostępny).
- Ustawienia konta/runtime pluginu kanału znajdują się pod `channels.<id>` i powinny być opisywane przez metadane `channelConfigs` manifestu właścicielskiego pluginu, a nie przez centralny rejestr opcji OpenClaw.

### Konfiguracja pluginu harness Codex

Dołączony plugin `codex` odpowiada za natywne ustawienia harness serwera aplikacji Codex pod `plugins.entries.codex.config`. Zobacz [Dokumentacja harness Codex](/pl/plugins/codex-harness-reference), aby uzyskać pełną powierzchnię konfiguracji, oraz [Harness Codex](/pl/plugins/codex-harness), aby poznać model runtime.

`codexPlugins` stosuje się tylko do sesji wybierających natywny harness Codex. Nie włącza pluginów Codex dla Pi, zwykłych uruchomień dostawcy OpenAI, powiązań rozmów ACP ani żadnego harness innego niż Codex.

```json5
{
  plugins: {
    entries: {
      codex: {
        enabled: true,
        config: {
          codexPlugins: {
            enabled: true,
            allow_destructive_actions: true,
            plugins: {
              "google-calendar": {
                enabled: true,
                marketplaceName: "openai-curated",
                pluginName: "google-calendar",
                allow_destructive_actions: false,
              },
            },
          },
        },
      },
    },
  },
}
```

- `plugins.entries.codex.config.codexPlugins.enabled`: włącza natywną obsługę
  pluginów/aplikacji Codex dla środowiska harness Codex. Domyślnie: `false`.
- `plugins.entries.codex.config.codexPlugins.allow_destructive_actions`:
  domyślna polityka działań destrukcyjnych dla zmigrowanych wywołań aplikacji pluginu.
  Domyślnie: `true`.
- `plugins.entries.codex.config.codexPlugins.plugins.<key>.enabled`: włącza
  zmigrowany wpis pluginu, gdy globalne `codexPlugins.enabled` również ma wartość true.
  Domyślnie: `true` dla jawnych wpisów.
- `plugins.entries.codex.config.codexPlugins.plugins.<key>.marketplaceName`:
  stabilna tożsamość marketplace. V1 obsługuje tylko `"openai-curated"`.
- `plugins.entries.codex.config.codexPlugins.plugins.<key>.pluginName`: stabilna
  tożsamość pluginu Codex z migracji, na przykład `"google-calendar"`.
- `plugins.entries.codex.config.codexPlugins.plugins.<key>.allow_destructive_actions`:
  nadpisanie polityki działań destrukcyjnych dla danego pluginu. Gdy pominięte, używana jest globalna
  wartość `allow_destructive_actions`.

`codexPlugins.enabled` to globalna dyrektywa włączania. Jawne wpisy pluginów
zapisane przez migrację są trwałym zestawem kwalifikującym do instalacji i naprawy.
`plugins["*"]` nie jest obsługiwane, nie ma przełącznika `install`, a lokalne
wartości `marketplacePath` celowo nie są polami konfiguracji, ponieważ są
specyficzne dla hosta.

Kontrole gotowości `app/list` są buforowane przez jedną godzinę i odświeżane
asynchronicznie, gdy staną się nieaktualne. Konfiguracja aplikacji wątku Codex jest obliczana przy ustanawianiu sesji środowiska harness Codex, a nie przy każdej turze; użyj `/new`, `/reset` albo zrestartuj Gateway po zmianie konfiguracji natywnego pluginu.

- `plugins.entries.firecrawl.config.webFetch`: ustawienia dostawcy pobierania stron Firecrawl.
  - `apiKey`: klucz API Firecrawl (akceptuje SecretRef). W razie braku używa `plugins.entries.firecrawl.config.webSearch.apiKey`, starszego `tools.web.fetch.firecrawl.apiKey` albo zmiennej środowiskowej `FIRECRAWL_API_KEY`.
  - `baseUrl`: bazowy URL API Firecrawl (domyślnie: `https://api.firecrawl.dev`; nadpisania dla instancji hostowanych samodzielnie muszą wskazywać prywatne/wewnętrzne punkty końcowe).
  - `onlyMainContent`: wyodrębnia tylko główną treść ze stron (domyślnie: `true`).
  - `maxAgeMs`: maksymalny wiek pamięci podręcznej w milisekundach (domyślnie: `172800000` / 2 dni).
  - `timeoutSeconds`: limit czasu żądania scrape w sekundach (domyślnie: `60`).
- `plugins.entries.xai.config.xSearch`: ustawienia xAI X Search (wyszukiwanie internetowe Grok).
  - `enabled`: włącza dostawcę X Search.
  - `model`: model Grok używany do wyszukiwania (np. `"grok-4-1-fast"`).
- `plugins.entries.memory-core.config.dreaming`: ustawienia memory dreaming. Zobacz [Dreaming](/pl/concepts/dreaming), aby poznać fazy i progi.
  - `enabled`: główny przełącznik dreaming (domyślnie `false`).
  - `frequency`: harmonogram cron dla każdego pełnego przebiegu dreaming (`"0 3 * * *"` domyślnie).
  - `model`: opcjonalne nadpisanie modelu podagenta Dream Diary. Wymaga `plugins.entries.memory-core.subagent.allowModelOverride: true`; połącz z `allowedModels`, aby ograniczyć cele. Błędy niedostępności modelu ponawiają próbę raz z domyślnym modelem sesji; błędy zaufania lub listy dozwolonych nie przechodzą po cichu na model zapasowy.
  - polityka faz i progi są szczegółami implementacji (nie są kluczami konfiguracji widocznymi dla użytkownika).
- Pełna konfiguracja pamięci znajduje się w [referencji konfiguracji pamięci](/pl/reference/memory-config):
  - `agents.defaults.memorySearch.*`
  - `memory.backend`
  - `memory.citations`
  - `memory.qmd.*`
  - `plugins.entries.memory-core.config.dreaming`
- Włączone pluginy z pakietu Claude mogą również dostarczać osadzone wartości domyślne Pi z `settings.json`; OpenClaw stosuje je jako oczyszczone ustawienia agenta, a nie jako surowe poprawki konfiguracji OpenClaw.
- `plugins.slots.memory`: wybiera identyfikator aktywnego pluginu pamięci albo `"none"`, aby wyłączyć pluginy pamięci.
- `plugins.slots.contextEngine`: wybiera identyfikator aktywnego pluginu silnika kontekstu; domyślnie `"legacy"`, chyba że zainstalujesz i wybierzesz inny silnik.

Zobacz [Pluginy](/pl/tools/plugin).

---

## Zobowiązania

`commitments` kontroluje wywnioskowaną pamięć działań następczych: OpenClaw może wykrywać sprawdzenia z tur rozmowy i dostarczać je przez przebiegi Heartbeat.

- `commitments.enabled`: włącza ukryte wyodrębnianie LLM, przechowywanie i dostarczanie przez Heartbeat dla wywnioskowanych zobowiązań działań następczych. Domyślnie: `false`.
- `commitments.maxPerDay`: maksymalna liczba wywnioskowanych zobowiązań działań następczych dostarczanych na sesję agenta w ruchomym oknie dnia. Domyślnie: `3`.

Zobacz [Wywnioskowane zobowiązania](/pl/concepts/commitments).

---

## Przeglądarka

```json5
{
  browser: {
    enabled: true,
    evaluateEnabled: true,
    defaultProfile: "user",
    ssrfPolicy: {
      // dangerouslyAllowPrivateNetwork: true, // opt in only for trusted private-network access
      // allowPrivateNetwork: true, // legacy alias
      // hostnameAllowlist: ["*.example.com", "example.com"],
      // allowedHostnames: ["localhost"],
    },
    tabCleanup: {
      enabled: true,
      idleMinutes: 120,
      maxTabsPerSession: 8,
      sweepMinutes: 5,
    },
    profiles: {
      openclaw: { cdpPort: 18800, color: "#FF4500" },
      work: {
        cdpPort: 18801,
        color: "#0066CC",
        executablePath: "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
      },
      user: { driver: "existing-session", attachOnly: true, color: "#00AA00" },
      brave: {
        driver: "existing-session",
        attachOnly: true,
        userDataDir: "~/Library/Application Support/BraveSoftware/Brave-Browser",
        color: "#FB542B",
      },
      remote: { cdpUrl: "http://10.0.0.42:9222", color: "#00AA00" },
    },
    color: "#FF4500",
    // headless: false,
    // noSandbox: false,
    // extraArgs: [],
    // executablePath: "/Applications/Brave Browser.app/Contents/MacOS/Brave Browser",
    // attachOnly: false,
  },
}
```

- `evaluateEnabled: false` wyłącza `act:evaluate` i `wait --fn`.
- `tabCleanup` odzyskuje śledzone karty głównego agenta po czasie bezczynności lub gdy
  sesja przekroczy limit. Ustaw `idleMinutes: 0` albo `maxTabsPerSession: 0`, aby
  wyłączyć te poszczególne tryby czyszczenia.
- `ssrfPolicy.dangerouslyAllowPrivateNetwork` jest wyłączone, gdy nie jest ustawione, więc nawigacja przeglądarki domyślnie pozostaje restrykcyjna.
- Ustaw `ssrfPolicy.dangerouslyAllowPrivateNetwork: true` tylko wtedy, gdy celowo ufasz nawigacji przeglądarki w sieci prywatnej.
- W trybie restrykcyjnym zdalne punkty końcowe profili CDP (`profiles.*.cdpUrl`) podlegają temu samemu blokowaniu sieci prywatnej podczas kontroli osiągalności/wykrywania.
- `ssrfPolicy.allowPrivateNetwork` pozostaje obsługiwane jako starszy alias.
- W trybie restrykcyjnym używaj `ssrfPolicy.hostnameAllowlist` i `ssrfPolicy.allowedHostnames` do jawnych wyjątków.
- Profile zdalne są tylko do dołączania (uruchamianie/zatrzymywanie/resetowanie wyłączone).
- `profiles.*.cdpUrl` akceptuje `http://`, `https://`, `ws://` i `wss://`.
  Użyj HTTP(S), gdy chcesz, aby OpenClaw wykrywał `/json/version`; użyj WS(S),
  gdy dostawca podaje bezpośredni URL WebSocket DevTools.
- `remoteCdpTimeoutMs` i `remoteCdpHandshakeTimeoutMs` mają zastosowanie do zdalnych i
  `attachOnly` kontroli osiągalności CDP oraz żądań otwierania kart. Zarządzane profile local loopback
  zachowują lokalne wartości domyślne CDP.
- Jeśli zewnętrznie zarządzana usługa CDP jest osiągalna przez loopback, ustaw dla tego
  profilu `attachOnly: true`; w przeciwnym razie OpenClaw traktuje port loopback jako
  lokalny zarządzany profil przeglądarki i może zgłaszać błędy własności portu lokalnego.
- Profile `existing-session` używają Chrome MCP zamiast CDP i mogą dołączać na
  wybranym hoście albo przez połączony węzeł przeglądarki.
- Profile `existing-session` mogą ustawić `userDataDir`, aby wskazać określony
  profil przeglądarki opartej na Chromium, takiej jak Brave lub Edge.
- Profile `existing-session` zachowują obecne limity tras Chrome MCP:
  działania oparte na snapshot/ref zamiast wskazywania selektorami CSS, haki przesyłania
  jednego pliku, brak nadpisywania limitu czasu dialogów, brak `wait --load networkidle` oraz brak
  `responsebody`, eksportu PDF, przechwytywania pobrań lub działań wsadowych.
- Lokalne zarządzane profile `openclaw` automatycznie przypisują `cdpPort` i `cdpUrl`; ustawiaj
  `cdpUrl` jawnie tylko dla zdalnego CDP.
- Lokalne profile zarządzane mogą ustawić `executablePath`, aby nadpisać globalną
  wartość `browser.executablePath` dla tego profilu. Użyj tego, aby uruchomić jeden profil w
  Chrome, a drugi w Brave.
- Lokalne profile zarządzane używają `browser.localLaunchTimeoutMs` do wykrywania HTTP Chrome CDP
  po uruchomieniu procesu oraz `browser.localCdpReadyTimeoutMs` do gotowości websocket CDP
  po uruchomieniu. Zwiększ je na wolniejszych hostach, gdzie Chrome
  uruchamia się pomyślnie, ale kontrole gotowości ścigają się ze startem. Obie wartości muszą być
  dodatnimi liczbami całkowitymi do `120000` ms; nieprawidłowe wartości konfiguracji są odrzucane.
- Kolejność automatycznego wykrywania: domyślna przeglądarka, jeśli oparta na Chromium → Chrome → Brave → Edge → Chromium → Chrome Canary.
- `browser.executablePath` i `browser.profiles.<name>.executablePath` akceptują zarówno
  `~`, jak i `~/...` dla katalogu domowego systemu operacyjnego przed uruchomieniem Chromium.
  `userDataDir` dla profilu na profilach `existing-session` również jest rozwijane z tyldą.
- Usługa sterowania: tylko loopback (port wyprowadzony z `gateway.port`, domyślnie `18791`).
- `extraArgs` dodaje dodatkowe flagi uruchomieniowe do lokalnego startu Chromium (na przykład
  `--disable-gpu`, rozmiar okna lub flagi debugowania).

---

## Interfejs użytkownika

```json5
{
  ui: {
    seamColor: "#FF4500",
    assistant: {
      name: "OpenClaw",
      avatar: "CB", // emoji, short text, image URL, or data URI
    },
  },
}
```

- `seamColor`: kolor akcentu dla chromu interfejsu natywnej aplikacji (odcień dymku Talk Mode itp.).
- `assistant`: nadpisanie tożsamości Control UI. W razie braku używa tożsamości aktywnego agenta.

---

## Gateway

```json5
{
  gateway: {
    mode: "local", // local | remote
    port: 18789,
    bind: "loopback",
    auth: {
      mode: "token", // none | token | password | trusted-proxy
      token: "your-token",
      // password: "your-password", // or OPENCLAW_GATEWAY_PASSWORD
      // trustedProxy: { userHeader: "x-forwarded-user" }, // for mode=trusted-proxy; see /gateway/trusted-proxy-auth
      allowTailscale: true,
      rateLimit: {
        maxAttempts: 10,
        windowMs: 60000,
        lockoutMs: 300000,
        exemptLoopback: true,
      },
    },
    tailscale: {
      mode: "off", // off | serve | funnel
      resetOnExit: false,
    },
    controlUi: {
      enabled: true,
      basePath: "/openclaw",
      // root: "dist/control-ui",
      // embedSandbox: "scripts", // strict | scripts | trusted
      // allowExternalEmbedUrls: false, // dangerous: allow absolute external http(s) embed URLs
      // chatMessageMaxWidth: "min(1280px, 82%)", // optional grouped chat message max-width
      // allowedOrigins: ["https://control.example.com"], // required for non-loopback Control UI
      // dangerouslyAllowHostHeaderOriginFallback: false, // dangerous Host-header origin fallback mode
      // allowInsecureAuth: false,
      // dangerouslyDisableDeviceAuth: false,
    },
    remote: {
      url: "ws://gateway.tailnet:18789",
      transport: "ssh", // ssh | direct
      token: "your-token",
      // password: "your-password",
    },
    trustedProxies: ["10.0.0.1"],
    // Optional. Default false.
    allowRealIpFallback: false,
    nodes: {
      pairing: {
        // Optional. Default unset/disabled.
        autoApproveCidrs: ["192.168.1.0/24", "fd00:1234:5678::/64"],
      },
      allowCommands: ["canvas.navigate"],
      denyCommands: ["system.run"],
    },
    tools: {
      // Additional /tools/invoke HTTP denies
      deny: ["browser"],
      // Remove tools from the default HTTP deny list
      allow: ["gateway"],
    },
    push: {
      apns: {
        relay: {
          baseUrl: "https://relay.example.com",
          timeoutMs: 10000,
        },
      },
    },
  },
}
```

<Accordion title="Gateway field details">

- `mode`: `local` (uruchom Gateway) albo `remote` (połącz ze zdalnym Gateway). Gateway odmawia uruchomienia, jeśli wartość nie wynosi `local`.
- `port`: pojedynczy multipleksowany port dla WS + HTTP. Pierwszeństwo: `--port` > `OPENCLAW_GATEWAY_PORT` > `gateway.port` > `18789`.
- `bind`: `auto`, `loopback` (domyślnie), `lan` (`0.0.0.0`), `tailnet` (tylko adres IP Tailscale) albo `custom`.
- **Starsze aliasy bind**: używaj wartości trybu bind w `gateway.bind` (`auto`, `loopback`, `lan`, `tailnet`, `custom`), a nie aliasów hosta (`0.0.0.0`, `127.0.0.1`, `localhost`, `::`, `::1`).
- **Uwaga dotycząca Docker**: domyślne powiązanie `loopback` nasłuchuje na `127.0.0.1` wewnątrz kontenera. Przy sieci mostkowanej Docker (`-p 18789:18789`) ruch przychodzi przez `eth0`, więc Gateway jest nieosiągalny. Użyj `--network host` albo ustaw `bind: "lan"` (lub `bind: "custom"` z `customBindHost: "0.0.0.0"`), aby nasłuchiwać na wszystkich interfejsach.
- **Uwierzytelnianie**: domyślnie wymagane. Powiązania inne niż loopback wymagają uwierzytelniania Gateway. W praktyce oznacza to współdzielony token/hasło albo świadomy tożsamości reverse proxy z `gateway.auth.mode: "trusted-proxy"`. Kreator onboardingu domyślnie generuje token.
- Jeśli skonfigurowano zarówno `gateway.auth.token`, jak i `gateway.auth.password` (w tym SecretRefs), ustaw jawnie `gateway.auth.mode` na `token` albo `password`. Przepływy uruchamiania oraz instalacji/naprawy usługi kończą się niepowodzeniem, gdy oba są skonfigurowane, a tryb nie jest ustawiony.
- `gateway.auth.mode: "none"`: jawny tryb bez uwierzytelniania. Używaj tylko w zaufanych konfiguracjach local loopback; celowo nie jest on oferowany w promptach onboardingu.
- `gateway.auth.mode: "trusted-proxy"`: deleguje uwierzytelnianie przeglądarki/użytkownika do świadomego tożsamości reverse proxy i ufa nagłówkom tożsamości z `gateway.trustedProxies` (zobacz [Uwierzytelnianie przez zaufany proxy](/pl/gateway/trusted-proxy-auth)). Ten tryb domyślnie oczekuje źródła proxy **innego niż loopback**; reverse proxy na tym samym hoście przez loopback wymagają jawnego `gateway.auth.trustedProxy.allowLoopback = true`. Wewnętrzni wywołujący z tego samego hosta mogą używać `gateway.auth.password` jako lokalnego bezpośredniego fallbacku; `gateway.auth.token` pozostaje wzajemnie wykluczone z trybem trusted-proxy.
- `gateway.auth.allowTailscale`: gdy `true`, nagłówki tożsamości Tailscale Serve mogą spełnić wymagania uwierzytelniania interfejsu kontrolnego/WebSocket (weryfikowane przez `tailscale whois`). Endpointy HTTP API **nie** używają tego uwierzytelniania nagłówkiem Tailscale; zamiast tego podążają za normalnym trybem uwierzytelniania HTTP Gateway. Ten przepływ bez tokenu zakłada, że host Gateway jest zaufany. Domyślnie `true`, gdy `tailscale.mode = "serve"`.
- `gateway.auth.rateLimit`: opcjonalny limiter nieudanego uwierzytelniania. Stosowany osobno dla adresu IP klienta i zakresu uwierzytelniania (shared-secret oraz device-token są śledzone niezależnie). Zablokowane próby zwracają `429` + `Retry-After`.
  - Na asynchronicznej ścieżce interfejsu kontrolnego Tailscale Serve nieudane próby dla tego samego `{scope, clientIp}` są serializowane przed zapisem niepowodzenia. Równoczesne błędne próby od tego samego klienta mogą więc uruchomić limiter przy drugim żądaniu, zamiast przejść równolegle jako zwykłe niedopasowania.
  - `gateway.auth.rateLimit.exemptLoopback` domyślnie ma wartość `true`; ustaw `false`, gdy celowo chcesz limitować także ruch z localhost (dla konfiguracji testowych lub rygorystycznych wdrożeń proxy).
- Próby uwierzytelniania WS z originu przeglądarki są zawsze limitowane z wyłączonym wyjątkiem dla loopback (obrona w głąb przed przeglądarkowym brute force na localhost).
- Na loopback te blokady z originu przeglądarki są izolowane dla każdej znormalizowanej wartości `Origin`, więc powtarzające się niepowodzenia z jednego originu localhost nie blokują automatycznie innego originu.
- `tailscale.mode`: `serve` (tylko tailnet, powiązanie loopback) albo `funnel` (publiczne, wymaga uwierzytelniania).
- `tailscale.preserveFunnel`: gdy `true` i `tailscale.mode = "serve"`, OpenClaw sprawdza `tailscale funnel status` przed ponownym zastosowaniem Serve przy uruchomieniu i pomija to, jeśli zewnętrznie skonfigurowana trasa Funnel już obejmuje port Gateway. Domyślnie `false`.
- `controlUi.allowedOrigins`: jawna lista dozwolonych originów przeglądarki dla połączeń WebSocket Gateway. Wymagana, gdy oczekiwani są klienci przeglądarkowi z originów innych niż loopback.
- `controlUi.chatMessageMaxWidth`: opcjonalna maksymalna szerokość pogrupowanych wiadomości czatu interfejsu kontrolnego. Akceptuje ograniczone wartości szerokości CSS, takie jak `960px`, `82%`, `min(1280px, 82%)` i `calc(100% - 2rem)`.
- `controlUi.dangerouslyAllowHostHeaderOriginFallback`: niebezpieczny tryb, który włącza fallback originu oparty na nagłówku Host dla wdrożeń celowo polegających na polityce originu z nagłówka Host.
- `remote.transport`: `ssh` (domyślnie) albo `direct` (ws/wss). Dla `direct` wartość `remote.url` musi być `ws://` albo `wss://`.
- `OPENCLAW_ALLOW_INSECURE_PRIVATE_WS=1`: awaryjne nadpisanie po stronie klienta przez środowisko procesu, które zezwala na plaintext `ws://` do zaufanych adresów IP sieci prywatnej; domyślnie plaintext pozostaje dozwolony tylko dla loopback. Nie ma odpowiednika w `openclaw.json`, a konfiguracja sieci prywatnej przeglądarki, taka jak `browser.ssrfPolicy.dangerouslyAllowPrivateNetwork`, nie wpływa na klientów WebSocket Gateway.
- `gateway.remote.token` / `.password` to pola poświadczeń klienta zdalnego. Same nie konfigurują uwierzytelniania Gateway.
- `gateway.push.apns.relay.baseUrl`: bazowy URL HTTPS dla zewnętrznego przekaźnika APNs używanego przez oficjalne kompilacje iOS/TestFlight po opublikowaniu w Gateway rejestracji wspieranych przez przekaźnik. Ten URL musi pasować do URL przekaźnika wkompilowanego w kompilację iOS.
- `gateway.push.apns.relay.timeoutMs`: limit czasu wysyłania z Gateway do przekaźnika w milisekundach. Domyślnie `10000`.
- Rejestracje wspierane przez przekaźnik są delegowane do konkretnej tożsamości Gateway. Sparowana aplikacja iOS pobiera `gateway.identity.get`, dołącza tę tożsamość do rejestracji przekaźnika i przekazuje do Gateway grant wysyłania ograniczony do rejestracji. Inny Gateway nie może ponownie użyć tej zapisanej rejestracji.
- `OPENCLAW_APNS_RELAY_BASE_URL` / `OPENCLAW_APNS_RELAY_TIMEOUT_MS`: tymczasowe nadpisania środowiskowe dla powyższej konfiguracji przekaźnika.
- `OPENCLAW_APNS_RELAY_ALLOW_HTTP=true`: furtka tylko do developmentu dla URL-i przekaźnika HTTP na loopback. Produkcyjne URL-e przekaźnika powinny pozostać przy HTTPS.
- `gateway.handshakeTimeoutMs`: limit czasu handshake WebSocket Gateway przed uwierzytelnieniem w milisekundach. Domyślnie: `15000`. `OPENCLAW_HANDSHAKE_TIMEOUT_MS` ma pierwszeństwo, gdy jest ustawione. Zwiększ tę wartość na obciążonych lub mało wydajnych hostach, gdzie lokalni klienci mogą łączyć się, gdy rozgrzewka uruchomieniowa nadal się stabilizuje.
- `gateway.channelHealthCheckMinutes`: interwał monitora kondycji kanału w minutach. Ustaw `0`, aby globalnie wyłączyć restarty monitora kondycji. Domyślnie: `5`.
- `gateway.channelStaleEventThresholdMinutes`: próg nieaktualnego gniazda w minutach. Utrzymuj tę wartość większą lub równą `gateway.channelHealthCheckMinutes`. Domyślnie: `30`.
- `gateway.channelMaxRestartsPerHour`: maksymalna liczba restartów monitora kondycji na kanał/konto w kroczącym oknie godzinnym. Domyślnie: `10`.
- `channels.<provider>.healthMonitor.enabled`: wyłączenie restartów monitora kondycji dla danego kanału przy zachowaniu włączonego monitora globalnego.
- `channels.<provider>.accounts.<accountId>.healthMonitor.enabled`: nadpisanie dla danego konta w kanałach wielokontowych. Gdy ustawione, ma pierwszeństwo przed nadpisaniem na poziomie kanału.
- Lokalne ścieżki wywołań Gateway mogą używać `gateway.remote.*` jako fallbacku tylko wtedy, gdy `gateway.auth.*` nie jest ustawione.
- Jeśli `gateway.auth.token` / `gateway.auth.password` jest jawnie skonfigurowane przez SecretRef i nierozwiązane, rozwiązywanie kończy się zamknięciem bez dostępu (bez maskowania przez zdalny fallback).
- `trustedProxies`: adresy IP reverse proxy, które terminują TLS lub wstrzykują nagłówki przekazanego klienta. Wymieniaj tylko proxy, które kontrolujesz. Wpisy loopback nadal są prawidłowe dla konfiguracji proxy/wykrywania lokalnego na tym samym hoście (na przykład Tailscale Serve lub lokalny reverse proxy), ale **nie** sprawiają, że żądania loopback kwalifikują się do `gateway.auth.mode: "trusted-proxy"`.
- `allowRealIpFallback`: gdy `true`, Gateway akceptuje `X-Real-IP`, jeśli brakuje `X-Forwarded-For`. Domyślnie `false` dla zachowania fail-closed.
- `gateway.nodes.pairing.autoApproveCidrs`: opcjonalna lista dozwolonych CIDR/IP do automatycznego zatwierdzania pierwszego parowania urządzenia węzła bez żądanych zakresów. Jest wyłączona, gdy nieustawiona. Nie zatwierdza automatycznie parowania operatora/przeglądarki/interfejsu kontrolnego/WebChat ani nie zatwierdza automatycznie ról, zakresów, metadanych czy aktualizacji klucza publicznego.
- `gateway.nodes.allowCommands` / `gateway.nodes.denyCommands`: globalne kształtowanie allow/deny dla zadeklarowanych poleceń węzła po parowaniu i ocenie listy dozwolonej platformy. Użyj `allowCommands`, aby włączyć niebezpieczne polecenia węzła, takie jak `camera.snap`, `camera.clip` i `screen.record`; `denyCommands` usuwa polecenie, nawet jeśli domyślna wartość platformy lub jawne zezwolenie w przeciwnym razie by je obejmowały. Po zmianie przez węzeł zadeklarowanej listy poleceń odrzuć i ponownie zatwierdź to parowanie urządzenia, aby Gateway zapisał zaktualizowaną migawkę poleceń.
- `gateway.tools.deny`: dodatkowe nazwy narzędzi blokowane dla HTTP `POST /tools/invoke` (rozszerza domyślną listę odmów).
- `gateway.tools.allow`: usuwa nazwy narzędzi z domyślnej listy odmów HTTP.

</Accordion>

### Endpointy zgodne z OpenAI

- Chat Completions: domyślnie wyłączone. Włącz przez `gateway.http.endpoints.chatCompletions.enabled: true`.
- Responses API: `gateway.http.endpoints.responses.enabled`.
- Utwardzanie wejścia URL w Responses:
  - `gateway.http.endpoints.responses.maxUrlParts`
  - `gateway.http.endpoints.responses.files.urlAllowlist`
  - `gateway.http.endpoints.responses.images.urlAllowlist`
    Puste listy dozwolonych są traktowane jako nieustawione; użyj `gateway.http.endpoints.responses.files.allowUrl=false` i/lub `gateway.http.endpoints.responses.images.allowUrl=false`, aby wyłączyć pobieranie z URL.
- Opcjonalny nagłówek utwardzania odpowiedzi:
  - `gateway.http.securityHeaders.strictTransportSecurity` (ustawiaj tylko dla originów HTTPS, które kontrolujesz; zobacz [Uwierzytelnianie przez zaufany proxy](/pl/gateway/trusted-proxy-auth#tls-termination-and-hsts))

### Izolacja wielu instancji

Uruchamiaj wiele Gateway na jednym hoście z unikalnymi portami i katalogami stanu:

```bash
OPENCLAW_CONFIG_PATH=~/.openclaw/a.json \
OPENCLAW_STATE_DIR=~/.openclaw-a \
openclaw gateway --port 19001
```

Flagi wygody: `--dev` (używa `~/.openclaw-dev` + port `19001`), `--profile <name>` (używa `~/.openclaw-<name>`).

Zobacz [Wiele Gateway](/pl/gateway/multiple-gateways).

### `gateway.tls`

```json5
{
  gateway: {
    tls: {
      enabled: false,
      autoGenerate: false,
      certPath: "/etc/openclaw/tls/server.crt",
      keyPath: "/etc/openclaw/tls/server.key",
      caPath: "/etc/openclaw/tls/ca-bundle.crt",
    },
  },
}
```

- `enabled`: włącza terminację TLS na listenerze Gateway (HTTPS/WSS) (domyślnie: `false`).
- `autoGenerate`: automatycznie generuje lokalną samopodpisaną parę certyfikatu/klucza, gdy jawne pliki nie są skonfigurowane; tylko do użytku lokalnego/developerskiego.
- `certPath`: ścieżka w systemie plików do pliku certyfikatu TLS.
- `keyPath`: ścieżka w systemie plików do pliku klucza prywatnego TLS; zachowaj ograniczone uprawnienia.
- `caPath`: opcjonalna ścieżka do pakietu CA dla weryfikacji klienta lub niestandardowych łańcuchów zaufania.

### `gateway.reload`

```json5
{
  gateway: {
    reload: {
      mode: "hybrid", // off | restart | hot | hybrid
      debounceMs: 500,
      deferralTimeoutMs: 300000,
    },
  },
}
```

- `mode`: kontroluje sposób stosowania edycji konfiguracji w czasie działania.
  - `"off"`: ignoruje edycje na żywo; zmiany wymagają jawnego restartu.
  - `"restart"`: zawsze restartuje proces Gateway przy zmianie konfiguracji.
  - `"hot"`: stosuje zmiany w procesie bez restartu.
  - `"hybrid"` (domyślnie): najpierw próbuje hot reload; w razie potrzeby wraca do restartu.
- `debounceMs`: okno debounce w ms przed zastosowaniem zmian konfiguracji (nieujemna liczba całkowita).
- `deferralTimeoutMs`: opcjonalny maksymalny czas w ms oczekiwania na operacje w toku przed wymuszeniem restartu lub hot reload kanału. Pomiń, aby użyć domyślnego ograniczonego oczekiwania (`300000`); ustaw `0`, aby czekać bezterminowo i logować okresowe ostrzeżenia o nadal oczekujących operacjach.

---

## Hooki

```json5
{
  hooks: {
    enabled: true,
    token: "shared-secret",
    path: "/hooks",
    maxBodyBytes: 262144,
    defaultSessionKey: "hook:ingress",
    allowRequestSessionKey: true,
    allowedSessionKeyPrefixes: ["hook:", "hook:gmail:"],
    allowedAgentIds: ["hooks", "main"],
    presets: ["gmail"],
    transformsDir: "~/.openclaw/hooks/transforms",
    mappings: [
      {
        match: { path: "gmail" },
        action: "agent",
        agentId: "hooks",
        wakeMode: "now",
        name: "Gmail",
        sessionKey: "hook:gmail:{{messages[0].id}}",
        messageTemplate: "From: {{messages[0].from}}\nSubject: {{messages[0].subject}}\n{{messages[0].snippet}}",
        deliver: true,
        channel: "last",
        model: "openai/gpt-5.4-mini",
      },
    ],
  },
}
```

Uwierzytelnianie: `Authorization: Bearer <token>` lub `x-openclaw-token: <token>`.
Tokeny hooków w query string są odrzucane.

Uwagi dotyczące walidacji i bezpieczeństwa:

- `hooks.enabled=true` wymaga niepustego `hooks.token`.
- `hooks.token` musi być **inny** niż `gateway.auth.token`; ponowne użycie tokena Gateway jest odrzucane.
- `hooks.path` nie może być `/`; użyj dedykowanej podścieżki, takiej jak `/hooks`.
- Jeśli `hooks.allowRequestSessionKey=true`, ogranicz `hooks.allowedSessionKeyPrefixes` (na przykład `["hook:"]`).
- Jeśli mapowanie lub preset używa szablonowego `sessionKey`, ustaw `hooks.allowedSessionKeyPrefixes` i `hooks.allowRequestSessionKey=true`. Statyczne klucze mapowania nie wymagają tej zgody.

**Punkty końcowe:**

- `POST /hooks/wake` → `{ text, mode?: "now"|"next-heartbeat" }`
- `POST /hooks/agent` → `{ message, name?, agentId?, sessionKey?, wakeMode?, deliver?, channel?, to?, model?, thinking?, timeoutSeconds? }`
  - `sessionKey` z payloadu żądania jest akceptowany tylko wtedy, gdy `hooks.allowRequestSessionKey=true` (domyślnie: `false`).
- `POST /hooks/<name>` → rozwiązywane przez `hooks.mappings`
  - Wartości `sessionKey` mapowania renderowane z szablonu są traktowane jako dostarczone z zewnątrz i również wymagają `hooks.allowRequestSessionKey=true`.

<Accordion title="Mapping details">

- `match.path` dopasowuje podścieżkę po `/hooks` (np. `/hooks/gmail` → `gmail`).
- `match.source` dopasowuje pole payloadu dla ścieżek ogólnych.
- Szablony takie jak `{{messages[0].subject}}` czytają dane z payloadu.
- `transform` może wskazywać moduł JS/TS zwracający akcję hooka.
  - `transform.module` musi być ścieżką względną i pozostawać w obrębie `hooks.transformsDir` (ścieżki bezwzględne i przechodzenie katalogów są odrzucane).
  - Trzymaj `hooks.transformsDir` pod `~/.openclaw/hooks/transforms`; katalogi Skills w obszarze roboczym są odrzucane. Jeśli `openclaw doctor` zgłosi tę ścieżkę jako nieprawidłową, przenieś moduł transformacji do katalogu transformacji hooków albo usuń `hooks.transformsDir`.
- `agentId` kieruje do określonego agenta; nieznane identyfikatory przechodzą na domyślny.
- `allowedAgentIds`: ogranicza jawne kierowanie (`*` lub pominięte = zezwól na wszystkie, `[]` = odmów wszystkim).
- `defaultSessionKey`: opcjonalny stały klucz sesji dla uruchomień agenta hooka bez jawnego `sessionKey`.
- `allowRequestSessionKey`: zezwala wywołującym `/hooks/agent` oraz kluczom sesji mapowania sterowanym szablonem ustawiać `sessionKey` (domyślnie: `false`).
- `allowedSessionKeyPrefixes`: opcjonalna lista dozwolonych prefiksów dla jawnych wartości `sessionKey` (żądanie + mapowanie), np. `["hook:"]`. Staje się wymagana, gdy dowolne mapowanie lub preset używa szablonowego `sessionKey`.
- `deliver: true` wysyła końcową odpowiedź do kanału; `channel` domyślnie ma wartość `last`.
- `model` nadpisuje LLM dla tego uruchomienia hooka (musi być dozwolony, jeśli katalog modeli jest ustawiony).

</Accordion>

### Integracja Gmail

- Wbudowany preset Gmail używa `sessionKey: "hook:gmail:{{messages[0].id}}"`.
- Jeśli zachowujesz to kierowanie według wiadomości, ustaw `hooks.allowRequestSessionKey: true` i ogranicz `hooks.allowedSessionKeyPrefixes`, aby pasowało do przestrzeni nazw Gmail, na przykład `["hook:", "hook:gmail:"]`.
- Jeśli potrzebujesz `hooks.allowRequestSessionKey: false`, nadpisz preset statycznym `sessionKey` zamiast domyślnej wartości szablonowej.

```json5
{
  hooks: {
    gmail: {
      account: "openclaw@gmail.com",
      topic: "projects/<project-id>/topics/gog-gmail-watch",
      subscription: "gog-gmail-watch-push",
      pushToken: "shared-push-token",
      hookUrl: "http://127.0.0.1:18789/hooks/gmail",
      includeBody: true,
      maxBytes: 20000,
      renewEveryMinutes: 720,
      serve: { bind: "127.0.0.1", port: 8788, path: "/" },
      tailscale: { mode: "funnel", path: "/gmail-pubsub" },
      model: "openrouter/meta-llama/llama-3.3-70b-instruct:free",
      thinking: "off",
    },
  },
}
```

- Gateway automatycznie uruchamia `gog gmail watch serve` przy starcie, gdy jest skonfigurowany. Ustaw `OPENCLAW_SKIP_GMAIL_WATCHER=1`, aby wyłączyć.
- Nie uruchamiaj osobnego `gog gmail watch serve` równolegle z Gateway.

---

## Host Plugin canvas

```json5
{
  plugins: {
    entries: {
      canvas: {
        config: {
          host: {
            root: "~/.openclaw/workspace/canvas",
            liveReload: true,
            // enabled: false, // or OPENCLAW_SKIP_CANVAS_HOST=1
          },
        },
      },
    },
  },
}
```

- Serwuje edytowalne przez agenta HTML/CSS/JS oraz A2UI przez HTTP pod portem Gateway:
  - `http://<gateway-host>:<gateway.port>/__openclaw__/canvas/`
  - `http://<gateway-host>:<gateway.port>/__openclaw__/a2ui/`
- Tylko lokalnie: pozostaw `gateway.bind: "loopback"` (domyślnie).
- Powiązania inne niż loopback: trasy canvas wymagają uwierzytelniania Gateway (token/hasło/zaufany proxy), tak jak inne powierzchnie HTTP Gateway.
- WebViewy Node zwykle nie wysyłają nagłówków uwierzytelniania; po sparowaniu i połączeniu węzła Gateway ogłasza adresy URL możliwości o zakresie węzła dla dostępu do canvas/A2UI.
- Adresy URL możliwości są powiązane z aktywną sesją WS węzła i szybko wygasają. Awaryjne rozwiązanie oparte na IP nie jest używane.
- Wstrzykuje klienta live reload do serwowanego HTML.
- Automatycznie tworzy startowy `index.html`, gdy katalog jest pusty.
- Serwuje też A2UI pod `/__openclaw__/a2ui/`.
- Zmiany wymagają ponownego uruchomienia Gateway.
- Wyłącz live reload dla dużych katalogów lub błędów `EMFILE`.

---

## Wykrywanie

### mDNS (Bonjour)

```json5
{
  discovery: {
    mdns: {
      mode: "minimal", // minimal | full | off
    },
  },
}
```

- `minimal` (domyślnie, gdy wbudowany Plugin `bonjour` jest włączony): pomija `cliPath` + `sshPort` w rekordach TXT.
- `full`: uwzględnia `cliPath` + `sshPort`; rozgłaszanie multicast w sieci LAN nadal wymaga włączenia wbudowanego Plugin `bonjour`.
- `off`: wyłącza rozgłaszanie multicast w sieci LAN bez zmiany włączenia pluginu.
- Wbudowany Plugin `bonjour` uruchamia się automatycznie na hostach macOS i jest opcjonalny na Linuxie, Windowsie oraz skonteneryzowanych wdrożeniach Gateway.
- Nazwa hosta domyślnie przyjmuje systemową nazwę hosta, gdy jest poprawną etykietą DNS, a w przeciwnym razie przechodzi na `openclaw`. Nadpisz za pomocą `OPENCLAW_MDNS_HOSTNAME`.

### Wide-area (DNS-SD)

```json5
{
  discovery: {
    wideArea: { enabled: true },
  },
}
```

Zapisuje strefę unicast DNS-SD pod `~/.openclaw/dns/`. Do wykrywania między sieciami połącz to z serwerem DNS (zalecany CoreDNS) + Tailscale split DNS.

Konfiguracja: `openclaw dns setup --apply`.

---

## Środowisko

### `env` (wbudowane zmienne środowiskowe)

```json5
{
  env: {
    OPENROUTER_API_KEY: "sk-or-...",
    vars: {
      GROQ_API_KEY: "gsk-...",
    },
    shellEnv: {
      enabled: true,
      timeoutMs: 15000,
    },
  },
}
```

- Wbudowane zmienne środowiskowe są stosowane tylko wtedy, gdy w środowisku procesu brakuje danego klucza.
- Pliki `.env`: `.env` w CWD + `~/.openclaw/.env` (żaden nie nadpisuje istniejących zmiennych).
- `shellEnv`: importuje brakujące oczekiwane klucze z profilu powłoki logowania.
- Pełną kolejność pierwszeństwa opisuje [Środowisko](/pl/help/environment).

### Podstawianie zmiennych środowiskowych

Odwołuj się do zmiennych środowiskowych w dowolnym ciągu konfiguracji za pomocą `${VAR_NAME}`:

```json5
{
  gateway: {
    auth: { token: "${OPENCLAW_GATEWAY_TOKEN}" },
  },
}
```

- Dopasowywane są tylko nazwy pisane wielkimi literami: `[A-Z_][A-Z0-9_]*`.
- Brakujące/puste zmienne powodują błąd podczas ładowania konfiguracji.
- Użyj `$${VAR}`, aby uzyskać literał `${VAR}`.
- Działa z `$include`.

---

## Sekrety

Odwołania do sekretów są addytywne: wartości w tekście jawnym nadal działają.

### `SecretRef`

Użyj jednego kształtu obiektu:

```json5
{ source: "env" | "file" | "exec", provider: "default", id: "..." }
```

Walidacja:

- wzorzec `provider`: `^[a-z][a-z0-9_-]{0,63}$`
- wzorzec `source: "env"` id: `^[A-Z][A-Z0-9_]{0,127}$`
- `source: "file"` id: bezwzględny wskaźnik JSON (na przykład `"/providers/openai/apiKey"`)
- wzorzec `source: "exec"` id: `^[A-Za-z0-9][A-Za-z0-9._:/-]{0,255}$`
- identyfikatory `source: "exec"` nie mogą zawierać segmentów ścieżki rozdzielonych ukośnikami `.` ani `..` (na przykład `a/../b` jest odrzucane)

### Obsługiwany obszar poświadczeń

- Kanoniczna macierz: [Obszar poświadczeń SecretRef](/pl/reference/secretref-credential-surface)
- `secrets apply` wskazuje obsługiwane ścieżki poświadczeń w `openclaw.json`.
- Odwołania w `auth-profiles.json` są uwzględniane w rozwiązywaniu w czasie działania i pokryciu audytu.

### Konfiguracja dostawców sekretów

```json5
{
  secrets: {
    providers: {
      default: { source: "env" }, // optional explicit env provider
      filemain: {
        source: "file",
        path: "~/.openclaw/secrets.json",
        mode: "json",
        timeoutMs: 5000,
      },
      vault: {
        source: "exec",
        command: "/usr/local/bin/openclaw-vault-resolver",
        passEnv: ["PATH", "VAULT_ADDR"],
      },
    },
    defaults: {
      env: "default",
      file: "filemain",
      exec: "vault",
    },
  },
}
```

Uwagi:

- Dostawca `file` obsługuje `mode: "json"` i `mode: "singleValue"` (`id` musi być `"value"` w trybie singleValue).
- Ścieżki dostawców plikowych i exec kończą się błędem w sposób zamknięty, gdy weryfikacja ACL systemu Windows jest niedostępna. Ustaw `allowInsecurePath: true` tylko dla zaufanych ścieżek, których nie można zweryfikować.
- Dostawca `exec` wymaga bezwzględnej ścieżki `command` i używa ładunków protokołu na stdin/stdout.
- Domyślnie ścieżki poleceń będące dowiązaniami symbolicznymi są odrzucane. Ustaw `allowSymlinkCommand: true`, aby zezwolić na ścieżki dowiązań symbolicznych przy jednoczesnej walidacji rozwiązanej ścieżki docelowej.
- Jeśli skonfigurowano `trustedDirs`, sprawdzenie zaufanego katalogu dotyczy rozwiązanej ścieżki docelowej.
- Środowisko procesu potomnego `exec` jest domyślnie minimalne; wymagane zmienne przekaż jawnie za pomocą `passEnv`.
- Odwołania do sekretów są rozwiązywane podczas aktywacji do migawki w pamięci, a następnie ścieżki żądań czytają tylko tę migawkę.
- Filtrowanie aktywnego obszaru ma zastosowanie podczas aktywacji: nierozwiązane odwołania na włączonych obszarach powodują błąd uruchomienia/przeładowania, a nieaktywne obszary są pomijane z diagnostyką.

---

## Przechowywanie uwierzytelniania

```json5
{
  auth: {
    profiles: {
      "anthropic:default": { provider: "anthropic", mode: "api_key" },
      "anthropic:work": { provider: "anthropic", mode: "api_key" },
      "openai-codex:personal": { provider: "openai-codex", mode: "oauth" },
    },
    order: {
      anthropic: ["anthropic:default", "anthropic:work"],
      "openai-codex": ["openai-codex:personal"],
    },
  },
}
```

- Profile poszczególnych agentów są przechowywane w `<agentDir>/auth-profiles.json`.
- `auth-profiles.json` obsługuje odwołania na poziomie wartości (`keyRef` dla `api_key`, `tokenRef` dla `token`) dla statycznych trybów poświadczeń.
- Starsze płaskie mapy `auth-profiles.json`, takie jak `{ "provider": { "apiKey": "..." } }`, nie są formatem czasu działania; `openclaw doctor --fix` przepisuje je do kanonicznych profili klucza API `provider:default` z kopią zapasową `.legacy-flat.*.bak`.
- Profile w trybie OAuth (`auth.profiles.<id>.mode = "oauth"`) nie obsługują poświadczeń profilu uwierzytelniania opartych na SecretRef.
- Statyczne poświadczenia czasu działania pochodzą z rozwiązanych migawek w pamięci; starsze statyczne wpisy `auth.json` są czyszczone po wykryciu.
- Starsze importy OAuth pochodzą z `~/.openclaw/credentials/oauth.json`.
- Zobacz [OAuth](/pl/concepts/oauth).
- Zachowanie sekretów w czasie działania oraz narzędzia `audit/configure/apply`: [Zarządzanie sekretami](/pl/gateway/secrets).

### `auth.cooldowns`

```json5
{
  auth: {
    cooldowns: {
      billingBackoffHours: 5,
      billingBackoffHoursByProvider: { anthropic: 3, openai: 8 },
      billingMaxHours: 24,
      authPermanentBackoffMinutes: 10,
      authPermanentMaxMinutes: 60,
      failureWindowHours: 24,
      overloadedProfileRotations: 1,
      overloadedBackoffMs: 0,
      rateLimitedProfileRotations: 1,
    },
  },
}
```

- `billingBackoffHours`: bazowy czas backoff w godzinach, gdy profil kończy się niepowodzeniem z powodu rzeczywistych błędów
  rozliczeniowych lub niewystarczających środków (domyślnie: `5`). Jawny tekst dotyczący rozliczeń może
  nadal trafić tutaj nawet przy odpowiedziach `401`/`403`, ale dopasowania tekstu specyficzne dla dostawcy
  pozostają ograniczone do dostawcy, do którego należą (na przykład OpenRouter
  `Key limit exceeded`). Ponawialne komunikaty HTTP `402` dotyczące okna użycia lub
  limitu wydatków organizacji/przestrzeni roboczej pozostają zamiast tego w ścieżce `rate_limit`.
- `billingBackoffHoursByProvider`: opcjonalne nadpisania godzin backoff dla rozliczeń dla poszczególnych dostawców.
- `billingMaxHours`: limit w godzinach dla wykładniczego wzrostu backoff dla rozliczeń (domyślnie: `24`).
- `authPermanentBackoffMinutes`: bazowy czas backoff w minutach dla niepowodzeń `auth_permanent` o wysokiej pewności (domyślnie: `10`).
- `authPermanentMaxMinutes`: limit w minutach dla wzrostu backoff `auth_permanent` (domyślnie: `60`).
- `failureWindowHours`: kroczące okno w godzinach używane dla liczników backoff (domyślnie: `24`).
- `overloadedProfileRotations`: maksymalna liczba rotacji profili uwierzytelniania tego samego dostawcy dla błędów przeciążenia przed przełączeniem na fallback modelu (domyślnie: `1`). Kształty zajętości dostawcy, takie jak `ModelNotReadyException`, trafiają tutaj.
- `overloadedBackoffMs`: stałe opóźnienie przed ponowieniem rotacji przeciążonego dostawcy/profilu (domyślnie: `0`).
- `rateLimitedProfileRotations`: maksymalna liczba rotacji profili uwierzytelniania tego samego dostawcy dla błędów limitu szybkości przed przełączeniem na fallback modelu (domyślnie: `1`). Ten koszyk limitu szybkości obejmuje tekst ukształtowany przez dostawcę, taki jak `Too many concurrent requests`, `ThrottlingException`, `concurrency limit reached`, `workers_ai ... quota limit exceeded` i `resource exhausted`.

---

## Rejestrowanie

```json5
{
  logging: {
    level: "info",
    file: "/tmp/openclaw/openclaw.log",
    consoleLevel: "info",
    consoleStyle: "pretty", // pretty | compact | json
    redactSensitive: "tools", // off | tools
    redactPatterns: ["\\bTOKEN\\b\\s*[=:]\\s*([\"']?)([^\\s\"']+)\\1"],
  },
}
```

- Domyślny plik dziennika: `/tmp/openclaw/openclaw-YYYY-MM-DD.log`.
- Ustaw `logging.file`, aby użyć stabilnej ścieżki.
- `consoleLevel` podnosi się do `debug`, gdy użyto `--verbose`.
- `maxFileBytes`: maksymalny rozmiar aktywnego pliku dziennika w bajtach przed rotacją (dodatnia liczba całkowita; domyślnie: `104857600` = 100 MB). OpenClaw przechowuje obok aktywnego pliku do pięciu numerowanych archiwów.
- `redactSensitive` / `redactPatterns`: najlepsze możliwe maskowanie dla wyjścia konsoli, dzienników plikowych, rekordów dzienników OTLP i utrwalonego tekstu transkrypcji sesji. `redactSensitive: "off"` wyłącza tylko tę ogólną politykę dzienników/transkrypcji; powierzchnie bezpieczeństwa UI/narzędzi/diagnostyki nadal redagują sekrety przed emisją.

---

## Diagnostyka

```json5
{
  diagnostics: {
    enabled: true,
    flags: ["telegram.*"],
    stuckSessionWarnMs: 30000,
    stuckSessionAbortMs: 600000,

    otel: {
      enabled: false,
      endpoint: "https://otel-collector.example.com:4318",
      tracesEndpoint: "https://traces.example.com/v1/traces",
      metricsEndpoint: "https://metrics.example.com/v1/metrics",
      logsEndpoint: "https://logs.example.com/v1/logs",
      protocol: "http/protobuf", // http/protobuf | grpc
      headers: { "x-tenant-id": "my-org" },
      serviceName: "openclaw-gateway",
      traces: true,
      metrics: true,
      logs: false,
      sampleRate: 1.0,
      flushIntervalMs: 5000,
      captureContent: {
        enabled: false,
        inputMessages: false,
        outputMessages: false,
        toolInputs: false,
        toolOutputs: false,
        systemPrompt: false,
      },
    },

    cacheTrace: {
      enabled: false,
      filePath: "~/.openclaw/logs/cache-trace.jsonl",
      includeMessages: true,
      includePrompt: true,
      includeSystem: true,
    },
  },
}
```

- `enabled`: główny przełącznik wyjścia instrumentacji (domyślnie: `true`).
- `flags`: tablica ciągów flag włączających ukierunkowane wyjście dziennika (obsługuje symbole wieloznaczne, takie jak `"telegram.*"` lub `"*"`).
- `stuckSessionWarnMs`: próg wieku bez postępu w ms do klasyfikowania długotrwałych sesji przetwarzania jako `session.long_running`, `session.stalled` lub `session.stuck`. Odpowiedź, narzędzie, status, blok i postęp ACP resetują licznik czasu; powtarzane diagnostyki `session.stuck` wycofują się, gdy nie ma zmian.
- `stuckSessionAbortMs`: próg wieku bez postępu w ms, po którym kwalifikująca się zablokowana aktywna praca może zostać przerwana i opróżniona w celu odzyskania. Gdy nie ustawiono, OpenClaw używa bezpieczniejszego rozszerzonego okna uruchomienia osadzonego wynoszącego co najmniej 10 minut i 5x `stuckSessionWarnMs`.
- `otel.enabled`: włącza potok eksportu OpenTelemetry (domyślnie: `false`). Pełną konfigurację, katalog sygnałów i model prywatności znajdziesz w [Eksport OpenTelemetry](/pl/gateway/opentelemetry).
- `otel.endpoint`: URL kolektora dla eksportu OTel.
- `otel.tracesEndpoint` / `otel.metricsEndpoint` / `otel.logsEndpoint`: opcjonalne punkty końcowe OTLP specyficzne dla sygnału. Gdy ustawione, nadpisują `otel.endpoint` tylko dla tego sygnału.
- `otel.protocol`: `"http/protobuf"` (domyślnie) lub `"grpc"`.
- `otel.headers`: dodatkowe nagłówki metadanych HTTP/gRPC wysyłane z żądaniami eksportu OTel.
- `otel.serviceName`: nazwa usługi dla atrybutów zasobu.
- `otel.traces` / `otel.metrics` / `otel.logs`: włącz eksport śladów, metryk lub dzienników.
- `otel.sampleRate`: współczynnik próbkowania śladów `0`-`1`.
- `otel.flushIntervalMs`: okresowy interwał opróżniania telemetrii w ms.
- `otel.captureContent`: opcjonalne przechwytywanie surowej treści dla atrybutów span OTEL. Domyślnie wyłączone. Wartość logiczna `true` przechwytuje niesystemową treść wiadomości/narzędzi; forma obiektowa pozwala jawnie włączyć `inputMessages`, `outputMessages`, `toolInputs`, `toolOutputs` i `systemPrompt`.
- `OTEL_SEMCONV_STABILITY_OPT_IN=gen_ai_latest_experimental`: przełącznik środowiskowy dla najnowszych eksperymentalnych atrybutów dostawcy span GenAI. Domyślnie spany zachowują starszy atrybut `gen_ai.system` dla zgodności; metryki GenAI używają ograniczonych atrybutów semantycznych.
- `OPENCLAW_OTEL_PRELOADED=1`: przełącznik środowiskowy dla hostów, które już zarejestrowały globalny SDK OpenTelemetry. OpenClaw pomija wtedy uruchamianie/zamykanie SDK należącego do pluginu, zachowując aktywne odbiorniki diagnostyczne.
- `OTEL_EXPORTER_OTLP_TRACES_ENDPOINT`, `OTEL_EXPORTER_OTLP_METRICS_ENDPOINT` i `OTEL_EXPORTER_OTLP_LOGS_ENDPOINT`: zmienne środowiskowe punktów końcowych specyficznych dla sygnału, używane, gdy pasujący klucz konfiguracji nie jest ustawiony.
- `cacheTrace.enabled`: rejestruj migawki śladu pamięci podręcznej dla uruchomień osadzonych (domyślnie: `false`).
- `cacheTrace.filePath`: ścieżka wyjściowa dla JSONL śladu pamięci podręcznej (domyślnie: `$OPENCLAW_STATE_DIR/logs/cache-trace.jsonl`).
- `cacheTrace.includeMessages` / `includePrompt` / `includeSystem`: kontrolują, co jest uwzględniane w wyjściu śladu pamięci podręcznej (wszystkie domyślnie: `true`).

---

## Aktualizacja

```json5
{
  update: {
    channel: "stable", // stable | beta | dev
    checkOnStart: true,

    auto: {
      enabled: false,
      stableDelayHours: 6,
      stableJitterHours: 12,
      betaCheckIntervalHours: 1,
    },
  },
}
```

- `channel`: kanał wydania dla instalacji npm/git - `"stable"`, `"beta"` lub `"dev"`.
- `checkOnStart`: sprawdzaj aktualizacje npm podczas uruchamiania gatewaya (domyślnie: `true`).
- `auto.enabled`: włącz automatyczną aktualizację w tle dla instalacji pakietowych (domyślnie: `false`).
- `auto.stableDelayHours`: minimalne opóźnienie w godzinach przed automatycznym zastosowaniem na kanale stabilnym (domyślnie: `6`; maks.: `168`).
- `auto.stableJitterHours`: dodatkowe okno rozłożenia wdrożenia na kanale stabilnym w godzinach (domyślnie: `12`; maks.: `168`).
- `auto.betaCheckIntervalHours`: jak często uruchamiane są sprawdzenia kanału beta w godzinach (domyślnie: `1`; maks.: `24`).

---

## ACP

```json5
{
  acp: {
    enabled: true,
    dispatch: { enabled: true },
    backend: "acpx",
    defaultAgent: "main",
    allowedAgents: ["main", "ops"],
    maxConcurrentSessions: 10,

    stream: {
      coalesceIdleMs: 50,
      maxChunkChars: 1000,
      repeatSuppression: true,
      deliveryMode: "live", // live | final_only
      hiddenBoundarySeparator: "paragraph", // none | space | newline | paragraph
      maxOutputChars: 50000,
      maxSessionUpdateChars: 500,
    },

    runtime: {
      ttlMinutes: 30,
    },
  },
}
```

- `enabled`: globalna bramka funkcji ACP (domyślnie: `true`; ustaw `false`, aby ukryć wysyłanie ACP i opcje uruchamiania).
- `dispatch.enabled`: niezależna bramka dla wysyłania tur sesji ACP (domyślnie: `true`). Ustaw `false`, aby zachować dostępność poleceń ACP, blokując jednocześnie wykonanie.
- `backend`: domyślny identyfikator backendu środowiska wykonawczego ACP (musi pasować do zarejestrowanego pluginu środowiska wykonawczego ACP).
  Najpierw zainstaluj plugin backendu, a jeśli ustawiono `plugins.allow`, uwzględnij identyfikator pluginu backendu (na przykład `acpx`), inaczej backend ACP się nie załaduje.
- `defaultAgent`: zapasowy identyfikator agenta docelowego ACP, gdy uruchomienia nie określają jawnego celu.
- `allowedAgents`: lista dozwolonych identyfikatorów agentów dopuszczonych do sesji środowiska wykonawczego ACP; pusta oznacza brak dodatkowego ograniczenia.
- `maxConcurrentSessions`: maksymalna liczba jednocześnie aktywnych sesji ACP.
- `stream.coalesceIdleMs`: okno bezczynności opróżniania w ms dla strumieniowanego tekstu.
- `stream.maxChunkChars`: maksymalny rozmiar fragmentu przed podziałem projekcji strumieniowanego bloku.
- `stream.repeatSuppression`: tłum powtarzane linie statusu/narzędzi na turę (domyślnie: `true`).
- `stream.deliveryMode`: `"live"` strumieniuje przyrostowo; `"final_only"` buforuje do zdarzeń kończących turę.
- `stream.hiddenBoundarySeparator`: separator przed widocznym tekstem po ukrytych zdarzeniach narzędzi (domyślnie: `"paragraph"`).
- `stream.maxOutputChars`: maksymalna liczba znaków wyjścia asystenta projektowanych na turę ACP.
- `stream.maxSessionUpdateChars`: maksymalna liczba znaków dla projektowanych linii statusu/aktualizacji ACP.
- `stream.tagVisibility`: rekord nazw tagów z logicznymi nadpisaniami widoczności dla strumieniowanych zdarzeń.
- `runtime.ttlMinutes`: TTL bezczynności w minutach dla procesów roboczych sesji ACP przed kwalifikującym się czyszczeniem.
- `runtime.installCommand`: opcjonalne polecenie instalacji uruchamiane podczas przygotowywania środowiska wykonawczego ACP.

---

## CLI

```json5
{
  cli: {
    banner: {
      taglineMode: "off", // random | default | off
    },
  },
}
```

- `cli.banner.taglineMode` kontroluje styl sloganu banera:
  - `"random"` (domyślnie): rotujące zabawne/sezonowe slogany.
  - `"default"`: stały neutralny slogan (`All your chats, one OpenClaw.`).
  - `"off"`: brak tekstu sloganu (tytuł/wersja banera nadal są pokazywane).
- Aby ukryć cały baner (nie tylko slogany), ustaw zmienną środowiskową `OPENCLAW_HIDE_BANNER=1`.

---

## Kreator

Metadane zapisywane przez prowadzone przepływy konfiguracji CLI (`onboard`, `configure`, `doctor`):

```json5
{
  wizard: {
    lastRunAt: "2026-01-01T00:00:00.000Z",
    lastRunVersion: "2026.1.4",
    lastRunCommit: "abc1234",
    lastRunCommand: "configure",
    lastRunMode: "local",
  },
}
```

---

## Tożsamość

Zobacz pola tożsamości `agents.list` w sekcji [Domyślne ustawienia agenta](/pl/gateway/config-agents#agent-defaults).

---

## Most (starszy, usunięty)

Bieżące buildy nie zawierają już mostu TCP. Węzły łączą się przez WebSocket Gateway. Klucze `bridge.*` nie są już częścią schematu konfiguracji (walidacja kończy się niepowodzeniem do czasu ich usunięcia; `openclaw doctor --fix` może usunąć nieznane klucze).

<Accordion title="Starsza konfiguracja mostu (odniesienie historyczne)">

```json
{
  "bridge": {
    "enabled": true,
    "port": 18790,
    "bind": "tailnet",
    "tls": {
      "enabled": true,
      "autoGenerate": true
    }
  }
}
```

</Accordion>

---

## Cron

```json5
{
  cron: {
    enabled: true,
    maxConcurrentRuns: 2, // cron dispatch + isolated cron agent-turn execution
    webhook: "https://example.invalid/legacy", // deprecated fallback for stored notify:true jobs
    webhookToken: "replace-with-dedicated-token", // optional bearer token for outbound webhook auth
    sessionRetention: "24h", // duration string or false
    runLog: {
      maxBytes: "2mb", // default 2_000_000 bytes
      keepLines: 2000, // default 2000
    },
  },
}
```

- `sessionRetention`: jak długo przechowywać zakończone izolowane sesje uruchomień Cron przed usunięciem z `sessions.json`. Kontroluje także czyszczenie zarchiwizowanych transkrypcji usuniętych zadań Cron. Domyślnie: `24h`; ustaw `false`, aby wyłączyć.
- `runLog.maxBytes`: maksymalny rozmiar pojedynczego pliku dziennika uruchomień (`cron/runs/<jobId>.jsonl`) przed przycinaniem. Domyślnie: `2_000_000` bajtów.
- `runLog.keepLines`: najnowsze wiersze zachowywane po uruchomieniu przycinania dziennika uruchomień. Domyślnie: `2000`.
- `webhookToken`: token bearer używany do dostarczania POST Webhook zadań Cron (`delivery.mode = "webhook"`); jeśli zostanie pominięty, nagłówek uwierzytelniania nie jest wysyłany.
- `webhook`: przestarzały zapasowy adres URL Webhook (http/https), używany tylko dla zapisanych zadań, które nadal mają `notify: true`.

### `cron.retry`

```json5
{
  cron: {
    retry: {
      maxAttempts: 3,
      backoffMs: [30000, 60000, 300000],
      retryOn: ["rate_limit", "overloaded", "network", "timeout", "server_error"],
    },
  },
}
```

- `maxAttempts`: maksymalna liczba ponownych prób dla zadań jednorazowych przy błędach przejściowych (domyślnie: `3`; zakres: `0`-`10`).
- `backoffMs`: tablica opóźnień wycofania w ms dla każdej ponownej próby (domyślnie: `[30000, 60000, 300000]`; 1-10 wpisów).
- `retryOn`: typy błędów, które wyzwalają ponowne próby - `"rate_limit"`, `"overloaded"`, `"network"`, `"timeout"`, `"server_error"`. Pomiń, aby ponawiać wszystkie typy przejściowe.

Dotyczy tylko jednorazowych zadań Cron. Zadania cykliczne używają osobnej obsługi błędów.

### `cron.failureAlert`

```json5
{
  cron: {
    failureAlert: {
      enabled: false,
      after: 3,
      cooldownMs: 3600000,
      includeSkipped: false,
      mode: "announce",
      accountId: "main",
    },
  },
}
```

- `enabled`: włącz alerty o niepowodzeniach zadań Cron (domyślnie: `false`).
- `after`: liczba kolejnych niepowodzeń przed wyzwoleniem alertu (dodatnia liczba całkowita, min: `1`).
- `cooldownMs`: minimalna liczba milisekund między powtarzanymi alertami dla tego samego zadania (nieujemna liczba całkowita).
- `includeSkipped`: wliczaj kolejne pominięte uruchomienia do progu alertu (domyślnie: `false`). Pominięte uruchomienia są śledzone osobno i nie wpływają na wycofywanie po błędach wykonania.
- `mode`: tryb dostarczania - `"announce"` wysyła przez wiadomość kanału; `"webhook"` publikuje do skonfigurowanego Webhook.
- `accountId`: opcjonalny identyfikator konta lub kanału ograniczający dostarczanie alertów.

### `cron.failureDestination`

```json5
{
  cron: {
    failureDestination: {
      mode: "announce",
      channel: "last",
      to: "channel:C1234567890",
      accountId: "main",
    },
  },
}
```

- Domyślne miejsce docelowe powiadomień o niepowodzeniach Cron dla wszystkich zadań.
- `mode`: `"announce"` lub `"webhook"`; domyślnie `"announce"`, gdy istnieje wystarczająca ilość danych celu.
- `channel`: nadpisanie kanału dla dostarczania announce. `"last"` ponownie używa ostatniego znanego kanału dostarczania.
- `to`: jawny cel announce lub adres URL Webhook. Wymagane w trybie Webhook.
- `accountId`: opcjonalne nadpisanie konta do dostarczania.
- `delivery.failureDestination` ustawione dla zadania nadpisuje tę globalną wartość domyślną.
- Gdy nie ustawiono ani globalnego, ani ustawionego dla zadania miejsca docelowego niepowodzeń, zadania, które już dostarczają przez `announce`, w razie niepowodzenia wracają do tego podstawowego celu announce.
- `delivery.failureDestination` jest obsługiwane tylko dla zadań `sessionTarget="isolated"`, chyba że podstawowy `delivery.mode` zadania to `"webhook"`.

Zobacz [Zadania Cron](/pl/automation/cron-jobs). Izolowane wykonania Cron są śledzone jako [zadania w tle](/pl/automation/tasks).

---

## Zmienne szablonu modelu multimediów

Symbole zastępcze szablonu rozwijane w `tools.media.models[].args`:

| Zmienna            | Opis                                              |
| ------------------ | ------------------------------------------------- |
| `{{Body}}`         | Pełna treść przychodzącej wiadomości              |
| `{{RawBody}}`      | Surowa treść (bez opakowań historii/nadawcy)      |
| `{{BodyStripped}}` | Treść z usuniętymi wzmiankami grupowymi           |
| `{{From}}`         | Identyfikator nadawcy                             |
| `{{To}}`           | Identyfikator miejsca docelowego                  |
| `{{MessageSid}}`   | Identyfikator wiadomości kanału                   |
| `{{SessionId}}`    | UUID bieżącej sesji                               |
| `{{IsNewSession}}` | `"true"`, gdy utworzono nową sesję                |
| `{{MediaUrl}}`     | Pseudo-URL przychodzących multimediów             |
| `{{MediaPath}}`    | Lokalna ścieżka multimediów                       |
| `{{MediaType}}`    | Typ multimediów (obraz/audio/dokument/…)          |
| `{{Transcript}}`   | Transkrypcja audio                                |
| `{{Prompt}}`       | Rozwiązany prompt multimediów dla wpisów CLI      |
| `{{MaxChars}}`     | Rozwiązana maksymalna liczba znaków wyjścia dla wpisów CLI |
| `{{ChatType}}`     | `"direct"` lub `"group"`                          |
| `{{GroupSubject}}` | Temat grupy (najlepsza próba)                     |
| `{{GroupMembers}}` | Podgląd członków grupy (najlepsza próba)          |
| `{{SenderName}}`   | Wyświetlana nazwa nadawcy (najlepsza próba)       |
| `{{SenderE164}}`   | Numer telefonu nadawcy (najlepsza próba)          |
| `{{Provider}}`     | Wskazówka dostawcy (WhatsApp, Telegram, Discord itp.) |

---

## Dołączanie konfiguracji (`$include`)

Podziel konfigurację na wiele plików:

```json5
// ~/.openclaw/openclaw.json
{
  gateway: { port: 18789 },
  agents: { $include: "./agents.json5" },
  broadcast: {
    $include: ["./clients/mueller.json5", "./clients/schmidt.json5"],
  },
}
```

**Zachowanie scalania:**

- Pojedynczy plik: zastępuje zawierający go obiekt.
- Tablica plików: scalana głęboko w kolejności (późniejsze nadpisują wcześniejsze).
- Klucze równorzędne: scalane po dołączeniach (nadpisują dołączone wartości).
- Zagnieżdżone dołączenia: do 10 poziomów głębokości.
- Ścieżki: rozwiązywane względem pliku dołączającego, ale muszą pozostać wewnątrz katalogu konfiguracji najwyższego poziomu (`dirname` pliku `openclaw.json`). Formy bezwzględne/`../` są dozwolone tylko wtedy, gdy nadal rozwiązują się w obrębie tej granicy.
- Zapisy należące do OpenClaw, które zmieniają tylko jedną sekcję najwyższego poziomu opartą na dołączeniu pojedynczego pliku, zapisują zmiany do tego dołączonego pliku. Na przykład `plugins install` aktualizuje `plugins: { $include: "./plugins.json5" }` w `plugins.json5` i pozostawia `openclaw.json` bez zmian.
- Dołączenia główne, tablice dołączeń oraz dołączenia z nadpisaniami kluczy równorzędnych są tylko do odczytu dla zapisów należących do OpenClaw; takie zapisy kończą się niepowodzeniem zamiast spłaszczać konfigurację.
- Błędy: jasne komunikaty dla brakujących plików, błędów parsowania i cyklicznych dołączeń.

---

_Powiązane: [Konfiguracja](/pl/gateway/configuration) · [Przykłady konfiguracji](/pl/gateway/configuration-examples) · [Doctor](/pl/gateway/doctor)_

## Powiązane

- [Konfiguracja](/pl/gateway/configuration)
- [Przykłady konfiguracji](/pl/gateway/configuration-examples)
