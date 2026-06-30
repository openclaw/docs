---
read_when:
    - Potrzebujesz dokładnej semantyki konfiguracji na poziomie pól lub wartości domyślnych
    - Sprawdzasz bloki konfiguracji kanału, modelu, Gateway lub narzędzia
summary: Dokumentacja referencyjna konfiguracji Gateway dla podstawowych kluczy OpenClaw, wartości domyślnych i linków do dedykowanych dokumentacji referencyjnych podsystemów
title: Dokumentacja referencyjna konfiguracji
x-i18n:
    generated_at: "2026-06-30T22:37:12Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: c95497f4f76fd124505ffb9d0173e7e2adeeed82ee12812b2eca9673d5520fc4
    source_path: gateway/configuration-reference.md
    workflow: 16
---

Dokumentacja referencyjna głównej konfiguracji dla `~/.openclaw/openclaw.json`. Omówienie zorientowane na zadania znajdziesz w [Konfiguracji](/pl/gateway/configuration).

Obejmuje główne powierzchnie konfiguracji OpenClaw i odsyła dalej, gdy podsystem ma własną, głębszą dokumentację referencyjną. Katalogi poleceń należące do kanałów i Plugin oraz szczegółowe ustawienia pamięci/QMD znajdują się na własnych stronach, a nie tutaj.

Źródło prawdy w kodzie:

- `openclaw config schema` wypisuje aktualny JSON Schema używany do walidacji i Control UI, z dołączonymi metadanymi pakietów/Plugin/kanałów, gdy są dostępne
- `config.schema.lookup` zwraca jeden węzeł schematu ograniczony do ścieżki dla narzędzi szczegółowej inspekcji
- `pnpm config:docs:check` / `pnpm config:docs:gen` walidują bazowy hash dokumentacji konfiguracji względem bieżącej powierzchni schematu

Ścieżka wyszukiwania agenta: użyj akcji narzędzia `gateway` `config.schema.lookup`, aby
uzyskać dokładną dokumentację i ograniczenia na poziomie pól przed edycjami. Użyj
[Konfiguracji](/pl/gateway/configuration) jako wskazówek zorientowanych na zadania, a tej strony
jako szerszej mapy pól, wartości domyślnych i linków do dokumentacji referencyjnej podsystemów.

Dedykowane szczegółowe dokumentacje referencyjne:

- [Dokumentacja referencyjna konfiguracji pamięci](/pl/reference/memory-config) dla `agents.defaults.memorySearch.*`, `memory.qmd.*`, `memory.citations` oraz konfiguracji dreaming w `plugins.entries.memory-core.config.dreaming`
- [Polecenia slash](/pl/tools/slash-commands) dla bieżącego wbudowanego + pakietowego katalogu poleceń
- strony kanałów/Plugin będących właścicielami dla powierzchni poleceń specyficznych dla kanału

Format konfiguracji to **JSON5** (dozwolone komentarze i końcowe przecinki). Wszystkie pola są opcjonalne - OpenClaw używa bezpiecznych wartości domyślnych, gdy zostaną pominięte.

---

## Kanały

Klucze konfiguracji poszczególnych kanałów przeniesiono na dedykowaną stronę - zobacz
[Konfiguracja - kanały](/pl/gateway/config-channels) dla `channels.*`,
w tym Slack, Discord, Telegram, WhatsApp, Matrix, iMessage i innych
pakietowych kanałów (uwierzytelnianie, kontrola dostępu, wiele kont, bramkowanie wzmianek).

## Wartości domyślne agenta, wielu agentów, sesje i wiadomości

Przeniesiono na dedykowaną stronę - zobacz
[Konfiguracja - agenci](/pl/gateway/config-agents) dla:

- `agents.defaults.*` (obszar roboczy, model, myślenie, heartbeat, pamięć, media, skills, piaskownica)
- `multiAgent.*` (trasowanie i powiązania wielu agentów)
- `session.*` (cykl życia sesji, compaction, przycinanie)
- `messages.*` (dostarczanie wiadomości, TTS, renderowanie markdown)
- `talk.*` (tryb Talk)
  - `talk.consultThinkingLevel`: nadpisanie poziomu myślenia dla pełnego uruchomienia agenta OpenClaw obsługującego konsultacje realtime Control UI Talk
  - `talk.consultFastMode`: jednorazowe nadpisanie trybu szybkiego dla konsultacji realtime Control UI Talk
  - `talk.speechLocale`: opcjonalny identyfikator lokalizacji BCP 47 dla rozpoznawania mowy Talk na iOS/macOS
  - `talk.silenceTimeoutMs`: gdy nieustawione, Talk zachowuje domyślne okno pauzy platformy przed wysłaniem transkrypcji (`700 ms on macOS and Android, 900 ms on iOS`)
  - `talk.realtime.consultRouting`: awaryjne przekazanie Gateway dla sfinalizowanych transkrypcji realtime Talk, które pomijają `openclaw_agent_consult`

## Narzędzia i niestandardowi dostawcy

Polityka narzędzi, przełączniki eksperymentalne, konfiguracja narzędzi wspieranych przez dostawcę oraz
konfiguracja niestandardowego dostawcy / bazowego URL zostały przeniesione na dedykowaną stronę - zobacz
[Konfiguracja - narzędzia i niestandardowi dostawcy](/pl/gateway/config-tools).

## Modele

Definicje dostawców, listy dozwolonych modeli i konfiguracja niestandardowych dostawców znajdują się w
[Konfiguracji - narzędzia i niestandardowi dostawcy](/pl/gateway/config-tools#custom-providers-and-base-urls).
Katalog główny `models` odpowiada też za globalne zachowanie katalogu modeli.

```json5
{
  models: {
    // Optional. Default: true. Requires a Gateway restart when changed.
    pricing: { enabled: false },
  },
}
```

- `models.mode`: zachowanie katalogu dostawcy (`merge` albo `replace`).
- `models.providers`: mapa niestandardowych dostawców indeksowana według identyfikatora dostawcy.
- `models.providers.*.localService`: opcjonalny menedżer procesu uruchamianego na żądanie dla
  lokalnych serwerów modeli. OpenClaw sonduje skonfigurowany punkt końcowy zdrowia, uruchamia
  bezwzględne `command`, gdy jest potrzebne, czeka na gotowość, a następnie wysyła
  żądanie modelu. Zobacz [Lokalne usługi modeli](/pl/gateway/local-model-services).
- `models.pricing.enabled`: kontroluje uruchamianie w tle cen, które
  zaczyna się po osiągnięciu przez sidecary i kanały ścieżki gotowości Gateway. Gdy `false`,
  Gateway pomija pobieranie katalogów cen OpenRouter i LiteLLM; skonfigurowane
  wartości `models.providers.*.models[].cost` nadal działają dla lokalnych szacunków kosztów.

## MCP

Definicje serwerów MCP zarządzanych przez OpenClaw znajdują się w `mcp.servers` i są
używane przez osadzony OpenClaw oraz inne adaptery runtime. Polecenia `openclaw mcp list`,
`show`, `set` i `unset` zarządzają tym blokiem bez łączenia się z
serwerem docelowym podczas edycji konfiguracji.

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
        timeout: 20,
        connectTimeout: 5,
        supportsParallelToolCalls: true,
        headers: {
          Authorization: "Bearer ${MCP_REMOTE_TOKEN}",
        },
        auth: "oauth",
        oauth: {
          scope: "docs.read",
        },
        sslVerify: true,
        clientCert: "/path/to/client.crt",
        clientKey: "/path/to/client.key",
        toolFilter: {
          include: ["search_*"],
          exclude: ["admin_*"],
        },
        // Optional Codex app-server projection controls.
        codex: {
          agents: ["main"],
          defaultToolsApprovalMode: "approve", // auto | prompt | approve
        },
      },
    },
  },
}
```

- `mcp.servers`: nazwane definicje serwerów stdio lub zdalnych MCP dla runtime’ów, które
  udostępniają skonfigurowane narzędzia MCP.
  Wpisy zdalne używają `transport: "streamable-http"` albo `transport: "sse"`;
  `type: "http"` to natywny dla CLI alias, który `openclaw mcp set` i
  `openclaw doctor --fix` normalizują do kanonicznego pola `transport`.
- `mcp.servers.<name>.enabled`: ustaw `false`, aby zachować zapisaną definicję serwera,
  jednocześnie wykluczając ją z wykrywania MCP osadzonego OpenClaw i projekcji narzędzi.
- `mcp.servers.<name>.timeout` / `requestTimeoutMs`: limit czasu żądania MCP dla serwera
  w sekundach lub milisekundach.
- `mcp.servers.<name>.connectTimeout` / `connectionTimeoutMs`: limit czasu połączenia dla serwera
  w sekundach lub milisekundach.
- `mcp.servers.<name>.supportsParallelToolCalls`: opcjonalna wskazówka współbieżności dla
  adapterów, które mogą wybrać, czy wykonywać równoległe wywołania narzędzi MCP.
- `mcp.servers.<name>.auth`: ustaw `"oauth"` dla serwerów HTTP MCP, które wymagają
  OAuth. Uruchom `openclaw mcp login <name>`, aby zapisać tokeny w stanie OpenClaw.
- `mcp.servers.<name>.oauth`: opcjonalne nadpisania zakresu OAuth, adresu URL przekierowania i adresu URL
  metadanych klienta.
- `mcp.servers.<name>.sslVerify`, `clientCert`, `clientKey`: kontrolki TLS HTTP
  dla prywatnych punktów końcowych i wzajemnego TLS.
- `mcp.servers.<name>.toolFilter`: opcjonalny wybór narzędzi dla serwera. `include`
  ogranicza wykryte narzędzia MCP do pasujących nazw; `exclude` ukrywa pasujące
  nazwy. Wpisy to dokładne nazwy narzędzi MCP albo proste globs `*`. Serwery z
  zasobami lub promptami generują też nazwy narzędzi pomocniczych (`resources_list`,
  `resources_read`, `prompts_list`, `prompts_get`), a te nazwy używają
  tego samego filtra.
- `mcp.servers.<name>.codex`: opcjonalne kontrolki projekcji serwera aplikacji Codex.
  Ten blok to metadane OpenClaw tylko dla wątków serwera aplikacji Codex; nie
  wpływa na sesje ACP, ogólną konfigurację harness Codex ani inne adaptery runtime.
  Niepuste `codex.agents` ogranicza serwer do wymienionych identyfikatorów agentów OpenClaw.
  Puste, blank lub nieprawidłowe listy agentów o ograniczonym zakresie są odrzucane przez walidację konfiguracji
  i pomijane przez ścieżkę projekcji runtime, zamiast stać się globalne.
  `codex.defaultToolsApprovalMode` emituje natywne dla Codex
  `default_tools_approval_mode` dla tego serwera. OpenClaw usuwa blok `codex`
  przed przekazaniem natywnej konfiguracji `mcp_servers` do Codex. Pomiń blok, aby
  zachować projekcję serwera dla każdego agenta serwera aplikacji Codex z domyślnym
  zachowaniem zatwierdzania MCP Codex.
- `mcp.sessionIdleTtlMs`: bezczynny TTL dla powiązanych z sesją pakietowych runtime’ów MCP.
  Jednorazowe osadzone uruchomienia żądają czyszczenia po zakończeniu uruchomienia; ten TTL jest zabezpieczeniem dla
  długotrwałych sesji i przyszłych wywołujących.
- Zmiany w `mcp.*` stosują się na gorąco przez usunięcie zbuforowanych runtime’ów MCP sesji.
  Następne wykrycie/użycie narzędzia odtworzy je z nowej konfiguracji, więc usunięte
  wpisy `mcp.servers` są zbierane natychmiast, zamiast czekać na bezczynny TTL.
- Wykrywanie runtime honoruje również powiadomienia o zmianie listy narzędzi MCP przez odrzucenie
  zbuforowanego katalogu dla tej sesji. Serwery, które ogłaszają zasoby lub
  prompty, otrzymują narzędzia pomocnicze do listowania/odczytu zasobów i listowania/pobierania
  promptów. Powtarzające się niepowodzenia wywołań narzędzi krótko wstrzymują dany serwer przed
  kolejną próbą wywołania.

Zobacz [MCP](/pl/cli/mcp#openclaw-as-an-mcp-client-registry) i
[Backendy CLI](/pl/gateway/cli-backends#bundle-mcp-overlays), aby poznać zachowanie runtime.

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
    workshop: {
      allowSymlinkTargetWrites: false,
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

- `allowBundled`: opcjonalna lista dozwolonych wyłącznie dla pakietowych skills (zarządzane/obszarowe skills bez zmian).
- `load.extraDirs`: dodatkowe współdzielone katalogi główne skill (najniższy priorytet).
- `load.allowSymlinkTargets`: zaufane rzeczywiste katalogi docelowe, do których symlinki skill mogą
  się rozwiązywać, gdy link znajduje się poza skonfigurowanym katalogiem źródłowym.
- `workshop.allowSymlinkTargetWrites`: pozwala Skill Workshop apply zapisywać
  przez już zaufane cele symlinków (domyślnie: false).
- `install.preferBrew`: gdy true, preferuj instalatory Homebrew, gdy `brew` jest
  dostępny, zanim nastąpi powrót do innych rodzajów instalatorów.
- `install.nodeManager`: preferencja instalatora node dla specyfikacji `metadata.openclaw.install`
  (`npm` | `pnpm` | `yarn` | `bun`).
- `install.allowUploadedArchives`: pozwala zaufanym klientom Gateway `operator.admin`
  instalować prywatne archiwa zip przygotowane przez `skills.upload.*`
  (domyślnie: false). Włącza to tylko ścieżkę przesłanego archiwum; zwykłe instalacje ClawHub
  tego nie wymagają.
- `entries.<skillKey>.enabled: false` wyłącza skill, nawet jeśli jest pakietowy/zainstalowany.
- `entries.<skillKey>.apiKey`: udogodnienie dla skills deklarujących główną zmienną env (ciąg jawnego tekstu albo obiekt SecretRef).

---

## Plugins

```json5
{
  plugins: {
    enabled: true,
    allow: ["voice-call"],
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

- Ładowane z katalogów pakietów lub pakietów wbudowanych pod `~/.openclaw/extensions` i `<workspace>/.openclaw/extensions`, a także z plików lub katalogów wymienionych w `plugins.load.paths`.
- Umieszczaj samodzielne pliki Plugin w `plugins.load.paths`; automatycznie wykrywane katalogi główne rozszerzeń ignorują pliki `.js`, `.mjs` i `.ts` najwyższego poziomu, aby skrypty pomocnicze w tych katalogach nie blokowały uruchamiania.
- Wykrywanie akceptuje natywne Pluginy OpenClaw oraz zgodne pakiety Codex i Claude, w tym pakiety Claude z domyślnym układem bez manifestu.
- **Zmiany konfiguracji wymagają ponownego uruchomienia Gateway.**
- `allow`: opcjonalna lista dozwolonych (ładują się tylko wymienione Pluginy). `deny` ma pierwszeństwo.
- `plugins.entries.<id>.apiKey`: wygodne pole klucza API na poziomie Pluginu (gdy obsługiwane przez Plugin).
- `plugins.entries.<id>.env`: mapa zmiennych środowiskowych o zakresie Pluginu.
- `plugins.entries.<id>.hooks.allowPromptInjection`: gdy `false`, rdzeń blokuje `before_prompt_build` i ignoruje pola modyfikujące prompt ze starszego `before_agent_start`, zachowując jednocześnie starsze `modelOverride` i `providerOverride`. Dotyczy natywnych haków Pluginu oraz obsługiwanych katalogów haków dostarczanych przez pakiety.
- `plugins.entries.<id>.hooks.allowConversationAccess`: gdy `true`, zaufane niewbudowane Pluginy mogą odczytywać surową treść konwersacji z typowanych haków, takich jak `llm_input`, `llm_output`, `before_model_resolve`, `before_agent_reply`, `before_agent_run`, `before_agent_finalize` i `agent_end`.
- `plugins.entries.<id>.subagent.allowModelOverride`: jawnie zaufaj temu Pluginowi, aby mógł żądać nadpisań `provider` i `model` dla pojedynczych uruchomień w tle przez subagenta.
- `plugins.entries.<id>.subagent.allowedModels`: opcjonalna lista dozwolonych kanonicznych celów `provider/model` dla zaufanych nadpisań subagenta. Używaj `"*"` tylko wtedy, gdy celowo chcesz dopuścić dowolny model.
- `plugins.entries.<id>.llm.allowModelOverride`: jawnie zaufaj temu Pluginowi, aby mógł żądać nadpisań modelu dla `api.runtime.llm.complete`.
- `plugins.entries.<id>.llm.allowedModels`: opcjonalna lista dozwolonych kanonicznych celów `provider/model` dla zaufanych nadpisań uzupełniania LLM przez Plugin. Używaj `"*"` tylko wtedy, gdy celowo chcesz dopuścić dowolny model.
- `plugins.entries.<id>.llm.allowAgentIdOverride`: jawnie zaufaj temu Pluginowi, aby mógł uruchamiać `api.runtime.llm.complete` względem identyfikatora agenta innego niż domyślny.
- `plugins.entries.<id>.config`: obiekt konfiguracji zdefiniowany przez Plugin (walidowany przez natywny schemat Pluginu OpenClaw, gdy jest dostępny).
- Ustawienia konta/środowiska wykonawczego Pluginu kanału znajdują się pod `channels.<id>` i powinny być opisywane przez metadane `channelConfigs` manifestu Pluginu będącego właścicielem, a nie przez centralny rejestr opcji OpenClaw.

### Konfiguracja Pluginu uprzęży Codex

Dołączony Plugin `codex` jest właścicielem natywnych ustawień uprzęży serwera aplikacji Codex pod
`plugins.entries.codex.config`. Pełną powierzchnię konfiguracji znajdziesz w
[Dokumentacji referencyjnej uprzęży Codex](/pl/plugins/codex-harness-reference), a model środowiska wykonawczego w [Uprzęży Codex](/pl/plugins/codex-harness).

`codexPlugins` dotyczy tylko sesji, które wybierają natywną uprząż Codex.
Nie włącza Pluginów Codex dla uruchomień dostawcy OpenClaw, powiązań konwersacji ACP
ani żadnej uprzęży innej niż Codex.

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
  Pluginu/aplikacji Codex dla uprzęży Codex. Domyślnie: `false`.
- `plugins.entries.codex.config.codexPlugins.allow_destructive_actions`:
  domyślna polityka działań destrukcyjnych dla zmigrowanych wywołań aplikacji Pluginu.
  Użyj `true`, aby akceptować bezpieczne schematy zatwierdzania Codex bez pytania, `false`,
  aby je odrzucać, `"auto"`, aby kierować wymagane przez Codex zatwierdzenia przez
  zatwierdzenia Pluginu OpenClaw, albo `"always"`, aby pytać przy każdej akcji zapisu/destrukcyjnej
  Pluginu bez trwałego zatwierdzenia. Tryb `"always"` czyści trwałe nadpisania
  zatwierdzeń Codex dla poszczególnych narzędzi w dotkniętej aplikacji przed rozpoczęciem wątku.
  Domyślnie: `true`.
- `plugins.entries.codex.config.codexPlugins.plugins.<key>.enabled`: włącza
  zmigrowany wpis Pluginu, gdy globalne `codexPlugins.enabled` również ma wartość true.
  Domyślnie: `true` dla jawnych wpisów.
- `plugins.entries.codex.config.codexPlugins.plugins.<key>.marketplaceName`:
  stabilna tożsamość marketplace. V1 obsługuje tylko `"openai-curated"`.
- `plugins.entries.codex.config.codexPlugins.plugins.<key>.pluginName`: stabilna
  tożsamość Pluginu Codex z migracji, na przykład `"google-calendar"`.
- `plugins.entries.codex.config.codexPlugins.plugins.<key>.allow_destructive_actions`:
  nadpisanie działań destrukcyjnych dla poszczególnych Pluginów. Po pominięciu używana jest globalna
  wartość `allow_destructive_actions`. Wartość dla Pluginu akceptuje te same polityki
  `true`, `false`, `"auto"` lub `"always"`.

`codexPlugins.enabled` jest globalną dyrektywą włączenia. Jawne wpisy Pluginów
zapisane przez migrację są trwałym zbiorem kwalifikującym do instalacji i naprawy.
`plugins["*"]` nie jest obsługiwane, nie ma przełącznika `install`, a lokalne
wartości `marketplacePath` celowo nie są polami konfiguracji, ponieważ są
specyficzne dla hosta.

Kontrole gotowości `app/list` są buforowane przez godzinę i odświeżane
asynchronicznie, gdy staną się nieaktualne. Konfiguracja aplikacji wątku Codex jest obliczana przy ustanawianiu sesji uprzęży Codex,
a nie przy każdej turze; użyj `/new`, `/reset` albo ponownego uruchomienia Gateway
po zmianie natywnej konfiguracji Pluginu.

- `plugins.entries.firecrawl.config.webFetch`: ustawienia dostawcy pobierania z sieci Firecrawl.
  - `apiKey`: opcjonalny klucz API Firecrawl dla wyższych limitów (akceptuje SecretRef). W razie braku używa `plugins.entries.firecrawl.config.webSearch.apiKey`, starszego `tools.web.fetch.firecrawl.apiKey` albo zmiennej środowiskowej `FIRECRAWL_API_KEY`.
  - `baseUrl`: bazowy URL API Firecrawl (domyślnie: `https://api.firecrawl.dev`; nadpisania self-hosted muszą wskazywać prywatne/wewnętrzne punkty końcowe).
  - `onlyMainContent`: wyodrębniaj tylko główną treść ze stron (domyślnie: `true`).
  - `maxAgeMs`: maksymalny wiek pamięci podręcznej w milisekundach (domyślnie: `172800000` / 2 dni).
  - `timeoutSeconds`: limit czasu żądania scrape w sekundach (domyślnie: `60`).
- `plugins.entries.xai.config.xSearch`: ustawienia xAI X Search (wyszukiwanie w sieci Grok).
  - `enabled`: włącz dostawcę X Search.
  - `model`: model Grok używany do wyszukiwania (np. `"grok-4-1-fast"`).
- `plugins.entries.memory-core.config.dreaming`: ustawienia Dreaming pamięci. Zobacz [Dreaming](/pl/concepts/dreaming), aby poznać fazy i progi.
  - `enabled`: główny przełącznik Dreaming (domyślnie `false`).
  - `frequency`: rytm Cron dla każdego pełnego przebiegu Dreaming (`"0 3 * * *"` domyślnie).
  - `model`: opcjonalne nadpisanie modelu subagenta Dream Diary. Wymaga `plugins.entries.memory-core.subagent.allowModelOverride: true`; połącz z `allowedModels`, aby ograniczyć cele. Błędy niedostępności modelu ponawiają próbę raz z domyślnym modelem sesji; błędy zaufania lub listy dozwolonych nie wracają po cichu do wartości domyślnych.
  - polityka faz i progi są szczegółami implementacji (nie kluczami konfiguracji widocznymi dla użytkownika).
- Pełna konfiguracja pamięci znajduje się w [Dokumentacji referencyjnej konfiguracji pamięci](/pl/reference/memory-config):
  - `agents.defaults.memorySearch.*`
  - `memory.backend`
  - `memory.citations`
  - `memory.qmd.*`
  - `plugins.entries.memory-core.config.dreaming`
- Włączone Pluginy pakietów Claude mogą także dostarczać osadzone wartości domyślne OpenClaw z `settings.json`; OpenClaw stosuje je jako oczyszczone ustawienia agenta, a nie jako surowe poprawki konfiguracji OpenClaw.
- `plugins.slots.memory`: wybierz identyfikator aktywnego Pluginu pamięci albo `"none"`, aby wyłączyć Pluginy pamięci.
- `plugins.slots.contextEngine`: wybierz identyfikator aktywnego Pluginu silnika kontekstu; domyślnie `"legacy"`, chyba że zainstalujesz i wybierzesz inny silnik.

Zobacz [Pluginy](/pl/tools/plugin).

---

## Zobowiązania

`commitments` kontroluje wnioskowaną pamięć działań następczych: OpenClaw może wykrywać check-iny z tur konwersacji i dostarczać je przez przebiegi Heartbeat.

- `commitments.enabled`: włącz ukrytą ekstrakcję LLM, przechowywanie i dostarczanie przez Heartbeat dla wnioskowanych zobowiązań działań następczych. Domyślnie: `false`.
- `commitments.maxPerDay`: maksymalna liczba wnioskowanych zobowiązań działań następczych dostarczanych na sesję agenta w przesuwającym się dniu. Domyślnie: `3`.

Zobacz [Wnioskowane zobowiązania](/pl/concepts/commitments).

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
- `tabCleanup` odzyskuje śledzone karty agenta głównego po czasie bezczynności albo gdy
  sesja przekroczy swój limit. Ustaw `idleMinutes: 0` lub `maxTabsPerSession: 0`, aby
  wyłączyć te poszczególne tryby czyszczenia.
- `ssrfPolicy.dangerouslyAllowPrivateNetwork` jest wyłączone, gdy nie jest ustawione, więc nawigacja przeglądarki domyślnie pozostaje restrykcyjna.
- Ustaw `ssrfPolicy.dangerouslyAllowPrivateNetwork: true` tylko wtedy, gdy świadomie ufasz nawigacji przeglądarki w sieci prywatnej.
- W trybie restrykcyjnym zdalne punkty końcowe profili CDP (`profiles.*.cdpUrl`) podlegają temu samemu blokowaniu sieci prywatnej podczas sprawdzania osiągalności/wykrywania.
- `ssrfPolicy.allowPrivateNetwork` pozostaje obsługiwane jako starszy alias.
- W trybie restrykcyjnym użyj `ssrfPolicy.hostnameAllowlist` i `ssrfPolicy.allowedHostnames` dla jawnych wyjątków.
- Profile zdalne są tylko do podłączania (start/stop/reset wyłączone).
- `profiles.*.cdpUrl` akceptuje `http://`, `https://`, `ws://` i `wss://`.
  Użyj HTTP(S), gdy chcesz, aby OpenClaw wykrywał `/json/version`; użyj WS(S),
  gdy dostawca daje bezpośredni adres URL DevTools WebSocket.
- `remoteCdpTimeoutMs` i `remoteCdpHandshakeTimeoutMs` mają zastosowanie do zdalnej
  osiągalności CDP oraz `attachOnly`, a także do żądań otwierania kart. Zarządzane profile
  loopback zachowują lokalne wartości domyślne CDP.
- Jeśli zewnętrznie zarządzana usługa CDP jest osiągalna przez loopback, ustaw dla tego
  profilu `attachOnly: true`; w przeciwnym razie OpenClaw traktuje port loopback jako
  lokalny zarządzany profil przeglądarki i może zgłaszać błędy własności portu lokalnego.
- Profile `existing-session` używają Chrome MCP zamiast CDP i mogą podłączać się na
  wybranym hoście albo przez połączony węzeł przeglądarki.
- Profile `existing-session` mogą ustawić `userDataDir`, aby wskazać konkretny
  profil przeglądarki opartej na Chromium, takiej jak Brave lub Edge.
- Profile `existing-session` mogą ustawić `cdpUrl`, gdy Chrome już działa
  za punktem końcowym wykrywania DevTools HTTP(S) albo bezpośrednim punktem końcowym WS(S). W tym
  trybie OpenClaw przekazuje punkt końcowy do Chrome MCP zamiast używać automatycznego łączenia;
  `userDataDir` jest ignorowane dla argumentów uruchomienia Chrome MCP.
- Profile `existing-session` zachowują obecne limity tras Chrome MCP:
  akcje oparte na migawkach/odwołaniach zamiast wskazywania selektorami CSS, haki przesyłania
  pojedynczego pliku, brak nadpisań limitu czasu dialogu, brak `wait --load networkidle` oraz brak
  `responsebody`, eksportu PDF, przechwytywania pobrań i akcji wsadowych.
- Lokalne zarządzane profile `openclaw` automatycznie przypisują `cdpPort` i `cdpUrl`; ustaw
  `cdpUrl` jawnie tylko dla zdalnych profili CDP albo podłączania punktu końcowego istniejącej sesji.
- Lokalne zarządzane profile mogą ustawić `executablePath`, aby nadpisać globalne
  `browser.executablePath` dla tego profilu. Użyj tego, aby uruchomić jeden profil w
  Chrome, a drugi w Brave.
- Lokalne zarządzane profile używają `browser.localLaunchTimeoutMs` do wykrywania HTTP Chrome CDP
  po uruchomieniu procesu oraz `browser.localCdpReadyTimeoutMs` do gotowości
  websocket CDP po uruchomieniu. Zwiększ je na wolniejszych hostach, gdzie Chrome
  uruchamia się poprawnie, ale sprawdzanie gotowości ściga się ze startem. Obie wartości muszą być
  dodatnimi liczbami całkowitymi do `120000` ms; nieprawidłowe wartości konfiguracji są odrzucane.
- Kolejność automatycznego wykrywania: domyślna przeglądarka, jeśli oparta na Chromium → Chrome → Brave → Edge → Chromium → Chrome Canary.
- `browser.executablePath` i `browser.profiles.<name>.executablePath` akceptują zarówno
  `~`, jak i `~/...` jako katalog domowy systemu operacyjnego przed uruchomieniem Chromium.
  `userDataDir` na profil w profilach `existing-session` również ma rozwijaną tyldę.
- Usługa sterowania: tylko loopback (port wyprowadzany z `gateway.port`, domyślnie `18791`).
- `extraArgs` dołącza dodatkowe flagi uruchomieniowe do lokalnego startu Chromium (na przykład
  `--disable-gpu`, rozmiar okna lub flagi debugowania).

---

## UI

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

- `seamColor`: kolor akcentu dla chromu UI aplikacji natywnej (odcień dymka trybu rozmowy itp.).
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
      url: "ws://127.0.0.1:18789",
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
      // Remove tools from the default HTTP deny list for owner/admin callers
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

- `mode`: `local` (uruchom gateway) lub `remote` (połącz ze zdalnym gateway). Gateway odmawia uruchomienia, jeśli nie ustawiono `local`.
- `port`: pojedynczy multipleksowany port dla WS + HTTP. Priorytet: `--port` > `OPENCLAW_GATEWAY_PORT` > `gateway.port` > `18789`.
- `bind`: `auto`, `loopback` (domyślnie), `lan` (`0.0.0.0`), `tailnet` (tylko adres IP Tailscale) lub `custom`.
- **Starsze aliasy bind**: używaj wartości trybu bind w `gateway.bind` (`auto`, `loopback`, `lan`, `tailnet`, `custom`), a nie aliasów hosta (`0.0.0.0`, `127.0.0.1`, `localhost`, `::`, `::1`).
- **Uwaga dotycząca Docker**: domyślne powiązanie `loopback` nasłuchuje na `127.0.0.1` wewnątrz kontenera. Przy sieci mostkowej Docker (`-p 18789:18789`) ruch przychodzi przez `eth0`, więc gateway jest nieosiągalny. Użyj `--network host` albo ustaw `bind: "lan"` (lub `bind: "custom"` z `customBindHost: "0.0.0.0"`), aby nasłuchiwać na wszystkich interfejsach.
- **Auth**: domyślnie wymagane. Powiązania inne niż loopback wymagają uwierzytelniania gateway. W praktyce oznacza to współdzielony token/hasło albo odwrotne proxy świadome tożsamości z `gateway.auth.mode: "trusted-proxy"`. Kreator onboardingu domyślnie generuje token.
- Jeśli skonfigurowano zarówno `gateway.auth.token`, jak i `gateway.auth.password` (w tym SecretRefs), ustaw jawnie `gateway.auth.mode` na `token` albo `password`. Uruchamianie oraz przepływy instalacji/naprawy usługi kończą się niepowodzeniem, gdy oba są skonfigurowane, a tryb nie jest ustawiony.
- `gateway.auth.mode: "none"`: jawny tryb bez uwierzytelniania. Używaj tylko w zaufanych konfiguracjach local loopback; celowo nie jest oferowany w promptach onboardingu.
- `gateway.auth.mode: "trusted-proxy"`: deleguje uwierzytelnianie przeglądarki/użytkownika do odwrotnego proxy świadomego tożsamości i ufa nagłówkom tożsamości z `gateway.trustedProxies` (zobacz [Uwierzytelnianie przez zaufane proxy](/pl/gateway/trusted-proxy-auth)). Ten tryb domyślnie oczekuje źródła proxy **innego niż loopback**; odwrotne proxy loopback na tym samym hoście wymagają jawnego `gateway.auth.trustedProxy.allowLoopback = true`. Wewnętrzni wywołujący z tego samego hosta mogą używać `gateway.auth.password` jako lokalnej bezpośredniej ścieżki awaryjnej; `gateway.auth.token` pozostaje wzajemnie wykluczone z trybem trusted-proxy.
- `gateway.auth.allowTailscale`: gdy `true`, nagłówki tożsamości Tailscale Serve mogą spełnić uwierzytelnianie Control UI/WebSocket (zweryfikowane przez `tailscale whois`). Punkty końcowe HTTP API **nie** używają tego uwierzytelniania nagłówkami Tailscale; zamiast tego podążają za normalnym trybem uwierzytelniania HTTP gateway. Ten przepływ bez tokena zakłada, że host gateway jest zaufany. Domyślnie `true`, gdy `tailscale.mode = "serve"`.
- `gateway.auth.rateLimit`: opcjonalny limiter nieudanego uwierzytelniania. Stosowany per adres IP klienta i per zakres uwierzytelniania (shared-secret i device-token są śledzone niezależnie). Zablokowane próby zwracają `429` + `Retry-After`.
  - Na asynchronicznej ścieżce Tailscale Serve Control UI nieudane próby dla tego samego `{scope, clientIp}` są serializowane przed zapisem niepowodzenia. Równoczesne błędne próby od tego samego klienta mogą więc uruchomić limiter przy drugim żądaniu, zamiast ścigać się jako zwykłe niedopasowania.
  - `gateway.auth.rateLimit.exemptLoopback` domyślnie ma wartość `true`; ustaw `false`, gdy celowo chcesz objąć limitem także ruch localhost (dla konfiguracji testowych lub rygorystycznych wdrożeń proxy).
- Próby uwierzytelniania WS z origin przeglądarki są zawsze ograniczane, z wyłączonym zwolnieniem dla loopback (obrona warstwowa przed brute force localhost z poziomu przeglądarki).
- Na loopback te blokady origin przeglądarki są izolowane per znormalizowana wartość `Origin`,
  więc powtarzające się niepowodzenia z jednego origin localhost nie blokują automatycznie
  innego origin.
- `tailscale.mode`: `serve` (tylko tailnet, bind loopback) lub `funnel` (publiczne, wymaga uwierzytelniania).
- `tailscale.serviceName`: opcjonalna nazwa Tailscale Service dla trybu Serve, taka
  jak `svc:openclaw`. Gdy jest ustawiona, OpenClaw przekazuje ją do `tailscale serve
--service`, aby Control UI mogło być udostępnione przez nazwaną Service zamiast
  nazwy hosta urządzenia. Wartość musi używać formatu nazwy Service Tailscale `svc:<dns-label>`;
  uruchamianie zgłasza wyprowadzony adres URL Service.
- `tailscale.preserveFunnel`: gdy `true` i `tailscale.mode = "serve"`, OpenClaw
  sprawdza `tailscale funnel status` przed ponownym zastosowaniem Serve przy uruchomieniu i pomija
  to, jeśli zewnętrznie skonfigurowana trasa Funnel już obejmuje port gateway.
  Domyślnie `false`.
- `controlUi.allowedOrigins`: jawna lista dozwolonych origin przeglądarki dla połączeń Gateway WebSocket. Wymagana dla publicznych origin przeglądarki innych niż loopback. Prywatne ładowania UI same-origin z LAN/Tailnet z loopback, RFC1918/link-local, `.local`, `.ts.net` lub hostów Tailscale CGNAT są akceptowane bez włączania awaryjnego użycia nagłówka Host.
- `controlUi.chatMessageMaxWidth`: opcjonalna maksymalna szerokość dla grupowanych wiadomości czatu Control UI. Akceptuje ograniczone wartości szerokości CSS, takie jak `960px`, `82%`, `min(1280px, 82%)` i `calc(100% - 2rem)`.
- `controlUi.dangerouslyAllowHostHeaderOriginFallback`: niebezpieczny tryb, który włącza awaryjne użycie origin z nagłówka Host dla wdrożeń celowo opierających się na polityce origin z nagłówka Host.
- `remote.transport`: `ssh` (domyślnie) lub `direct` (ws/wss). Dla `direct` wartość `remote.url` musi mieć `wss://` dla hostów publicznych; zwykły tekst `ws://` jest akceptowany tylko dla loopback, LAN, link-local, `.local`, `.ts.net` i hostów Tailscale CGNAT.
- `remote.remotePort`: port gateway na zdalnym hoście SSH. Domyślnie `18789`; użyj tego, gdy lokalny port tunelu różni się od zdalnego portu gateway.
- `gateway.remote.token` / `.password` to pola poświadczeń klienta zdalnego. Same nie konfigurują uwierzytelniania gateway.
- `gateway.push.apns.relay.baseUrl`: bazowy adres URL HTTPS dla zewnętrznego przekaźnika APNs używanego po tym, jak kompilacje iOS oparte na przekaźniku opublikują rejestracje w gateway. Publiczne kompilacje App Store/TestFlight używają hostowanego przekaźnika OpenClaw. Niestandardowe adresy URL przekaźnika muszą odpowiadać celowo osobnej ścieżce kompilacji/wdrożenia iOS, której adres URL przekaźnika wskazuje ten przekaźnik.
- `gateway.push.apns.relay.timeoutMs`: limit czasu wysyłania z gateway do przekaźnika w milisekundach. Domyślnie `10000`.
- Rejestracje oparte na przekaźniku są delegowane do konkretnej tożsamości gateway. Sparowana aplikacja iOS pobiera `gateway.identity.get`, dołącza tę tożsamość do rejestracji przekaźnika i przekazuje do gateway grant wysyłania ograniczony do rejestracji. Inny gateway nie może ponownie użyć tej zapisanej rejestracji.
- `OPENCLAW_APNS_RELAY_BASE_URL` / `OPENCLAW_APNS_RELAY_TIMEOUT_MS`: tymczasowe nadpisania env dla powyższej konfiguracji przekaźnika.
- `OPENCLAW_APNS_RELAY_ALLOW_HTTP=true`: wyjście awaryjne wyłącznie deweloperskie dla adresów URL przekaźnika HTTP loopback. Produkcyjne adresy URL przekaźnika powinny pozostać przy HTTPS.
- `gateway.handshakeTimeoutMs`: limit czasu handshake Gateway WebSocket przed uwierzytelnieniem, w milisekundach. Domyślnie: `15000`. `OPENCLAW_HANDSHAKE_TIMEOUT_MS` ma priorytet, gdy jest ustawione. Zwiększ to na obciążonych lub słabszych hostach, gdzie lokalni klienci mogą się łączyć, gdy rozgrzewka uruchamiania wciąż się stabilizuje.
- `gateway.channelHealthCheckMinutes`: interwał monitora kondycji kanału w minutach. Ustaw `0`, aby globalnie wyłączyć restarty monitora kondycji. Domyślnie: `5`.
- `gateway.channelStaleEventThresholdMinutes`: próg nieaktualnego gniazda w minutach. Utrzymuj tę wartość większą lub równą `gateway.channelHealthCheckMinutes`. Domyślnie: `30`.
- `gateway.channelMaxRestartsPerHour`: maksymalna liczba restartów monitora kondycji na kanał/konto w kroczącym oknie godziny. Domyślnie: `10`.
- `channels.<provider>.healthMonitor.enabled`: wyłączenie restartów monitora kondycji per kanał przy pozostawieniu włączonego monitora globalnego.
- `channels.<provider>.accounts.<accountId>.healthMonitor.enabled`: nadpisanie per konto dla kanałów wielokontowych. Gdy ustawione, ma priorytet nad nadpisaniem na poziomie kanału.
- Lokalne ścieżki wywołań gateway mogą używać `gateway.remote.*` jako ścieżki awaryjnej tylko wtedy, gdy `gateway.auth.*` nie jest ustawione.
- Jeśli `gateway.auth.token` / `gateway.auth.password` jest jawnie skonfigurowane przez SecretRef i nierozwiązane, rozwiązywanie kończy się fail-closed (bez maskowania zdalną ścieżką awaryjną).
- `trustedProxies`: adresy IP odwrotnego proxy, które kończą TLS lub wstrzykują nagłówki przekazanego klienta. Wymieniaj tylko proxy, które kontrolujesz. Wpisy loopback nadal są prawidłowe dla konfiguracji proxy/wykrywania lokalnego na tym samym hoście (na przykład Tailscale Serve lub lokalne odwrotne proxy), ale **nie** sprawiają, że żądania loopback kwalifikują się do `gateway.auth.mode: "trusted-proxy"`.
- `allowRealIpFallback`: gdy `true`, gateway akceptuje `X-Real-IP`, jeśli brakuje `X-Forwarded-For`. Domyślnie `false` dla zachowania fail-closed.
- `gateway.nodes.pairing.autoApproveCidrs`: opcjonalna lista dozwolonych CIDR/IP do automatycznego zatwierdzania pierwszego parowania urządzenia węzła bez żądanych zakresów. Jest wyłączona, gdy nie jest ustawiona. Nie zatwierdza automatycznie parowania operatora/przeglądarki/Control UI/WebChat ani nie zatwierdza automatycznie aktualizacji roli, zakresu, metadanych lub klucza publicznego.
- `gateway.nodes.allowCommands` / `gateway.nodes.denyCommands`: globalne kształtowanie allow/deny dla zadeklarowanych poleceń węzła po parowaniu i ocenie listy dozwolonych platformy. Użyj `allowCommands`, aby włączyć niebezpieczne polecenia węzła, takie jak `camera.snap`, `camera.clip` i `screen.record`; `denyCommands` usuwa polecenie, nawet jeśli domyślna wartość platformy lub jawne pozwolenie w przeciwnym razie by je obejmowały. Po zmianie przez węzeł zadeklarowanej listy poleceń odrzuć i ponownie zatwierdź parowanie tego urządzenia, aby gateway zapisał zaktualizowaną migawkę poleceń.
- `gateway.tools.deny`: dodatkowe nazwy narzędzi blokowane dla HTTP `POST /tools/invoke` (rozszerza domyślną listę deny).
- `gateway.tools.allow`: usuń nazwy narzędzi z domyślnej listy HTTP deny dla
  wywołujących właściciela/administratora. Nie podnosi to wywołujących z tożsamością `operator.write`
  do dostępu właściciela/administratora; `cron`, `gateway` i `nodes` pozostają
  niedostępne dla wywołujących niebędących właścicielem nawet po dodaniu do listy allow.

</Accordion>

### Punkty końcowe zgodne z OpenAI

- Admin HTTP RPC: domyślnie wyłączone jako Plugin `admin-http-rpc`. Włącz Plugin, aby zarejestrować `POST /api/v1/admin/rpc`. Zobacz [Admin HTTP RPC](/pl/plugins/admin-http-rpc).
- Chat Completions: domyślnie wyłączone. Włącz za pomocą `gateway.http.endpoints.chatCompletions.enabled: true`.
- Responses API: `gateway.http.endpoints.responses.enabled`.
- Wzmocnienie wejścia URL Responses:
  - `gateway.http.endpoints.responses.maxUrlParts`
  - `gateway.http.endpoints.responses.files.urlAllowlist`
  - `gateway.http.endpoints.responses.images.urlAllowlist`
    Puste listy dozwolonych są traktowane jak nieustawione; użyj `gateway.http.endpoints.responses.files.allowUrl=false`
    i/lub `gateway.http.endpoints.responses.images.allowUrl=false`, aby wyłączyć pobieranie URL.
- Opcjonalny nagłówek wzmacniający odpowiedź:
  - `gateway.http.securityHeaders.strictTransportSecurity` (ustawiaj tylko dla origin HTTPS, które kontrolujesz; zobacz [Uwierzytelnianie przez zaufane proxy](/pl/gateway/trusted-proxy-auth#tls-termination-and-hsts))

### Izolacja wielu instancji

Uruchom wiele gateway na jednym hoście z unikalnymi portami i katalogami stanu:

```bash
OPENCLAW_CONFIG_PATH=~/.openclaw/a.json \
OPENCLAW_STATE_DIR=~/.openclaw-a \
openclaw gateway --port 19001
```

Flagi wygody: `--dev` (używa `~/.openclaw-dev` + portu `19001`), `--profile <name>` (używa `~/.openclaw-<name>`).

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

- `enabled`: włącza terminację TLS na listenerze gateway (HTTPS/WSS) (domyślnie: `false`).
- `autoGenerate`: automatycznie generuje lokalną samopodpisaną parę certyfikat/klucz, gdy jawne pliki nie są skonfigurowane; tylko do użycia lokalnego/deweloperskiego.
- `certPath`: ścieżka w systemie plików do pliku certyfikatu TLS.
- `keyPath`: ścieżka w systemie plików do pliku klucza prywatnego TLS; utrzymuj ograniczone uprawnienia.
- `caPath`: opcjonalna ścieżka do pakietu CA do weryfikacji klienta lub niestandardowych łańcuchów zaufania.

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

- `mode`: kontroluje sposób stosowania zmian konfiguracji w czasie działania.
  - `"off"`: ignoruje edycje na żywo; zmiany wymagają jawnego restartu.
  - `"restart"`: zawsze restartuje proces Gateway przy zmianie konfiguracji.
  - `"hot"`: stosuje zmiany w procesie bez restartowania.
  - `"hybrid"` (domyślnie): najpierw próbuje przeładowania na gorąco; w razie potrzeby wraca do restartu.
- `debounceMs`: okno debounce w ms przed zastosowaniem zmian konfiguracji (nieujemna liczba całkowita).
- `deferralTimeoutMs`: opcjonalny maksymalny czas w ms oczekiwania na operacje w toku przed wymuszeniem restartu lub przeładowania kanału na gorąco. Pomiń, aby użyć domyślnego ograniczonego oczekiwania (`300000`); ustaw `0`, aby czekać bezterminowo i okresowo logować ostrzeżenia o nadal oczekujących operacjach.

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
Tokeny hooków w ciągu zapytania są odrzucane.

Uwagi dotyczące walidacji i bezpieczeństwa:

- `hooks.enabled=true` wymaga niepustego `hooks.token`.
- `hooks.token` powinien być inny niż aktywne uwierzytelnianie shared-secret Gateway (`gateway.auth.token` / `OPENCLAW_GATEWAY_TOKEN` lub `gateway.auth.password` / `OPENCLAW_GATEWAY_PASSWORD`); uruchamianie loguje niekrytyczne ostrzeżenie bezpieczeństwa, gdy wykryje ponowne użycie.
- `openclaw security audit` oznacza ponowne użycie uwierzytelniania hook/Gateway jako krytyczne ustalenie, w tym uwierzytelnianie hasłem Gateway podane tylko w czasie audytu (`--auth password --password <password>`). Uruchom `openclaw doctor --fix`, aby obrócić utrwalony ponownie użyty `hooks.token`, a następnie zaktualizuj zewnętrzne nadajniki hooków, aby używały nowego tokenu hooka.
- `hooks.path` nie może być `/`; użyj dedykowanej podścieżki, takiej jak `/hooks`.
- Jeśli `hooks.allowRequestSessionKey=true`, ogranicz `hooks.allowedSessionKeyPrefixes` (na przykład `["hook:"]`).
- Jeśli mapowanie lub preset używa szablonowego `sessionKey`, ustaw `hooks.allowedSessionKeyPrefixes` i `hooks.allowRequestSessionKey=true`. Statyczne klucze mapowania nie wymagają tej zgody.

**Punkty końcowe:**

- `POST /hooks/wake` → `{ text, mode?: "now"|"next-heartbeat" }`
- `POST /hooks/agent` → `{ message, name?, agentId?, sessionKey?, wakeMode?, deliver?, channel?, to?, model?, thinking?, timeoutSeconds? }`
  - `sessionKey` z ładunku żądania jest akceptowany tylko wtedy, gdy `hooks.allowRequestSessionKey=true` (domyślnie: `false`).
- `POST /hooks/<name>` → rozwiązywane przez `hooks.mappings`
  - Wartości `sessionKey` mapowania renderowane z szablonu są traktowane jako dostarczone z zewnątrz i również wymagają `hooks.allowRequestSessionKey=true`.

<Accordion title="Szczegóły mapowania">

- `match.path` dopasowuje podścieżkę po `/hooks` (np. `/hooks/gmail` → `gmail`).
- `match.source` dopasowuje pole ładunku dla ścieżek ogólnych.
- Szablony takie jak `{{messages[0].subject}}` odczytują dane z ładunku.
- `transform` może wskazywać moduł JS/TS zwracający akcję hooka.
  - `transform.module` musi być ścieżką względną i pozostaje w obrębie `hooks.transformsDir` (ścieżki bezwzględne i przechodzenie katalogów są odrzucane).
  - Trzymaj `hooks.transformsDir` pod `~/.openclaw/hooks/transforms`; katalogi Skills obszaru roboczego są odrzucane. Jeśli `openclaw doctor` zgłasza tę ścieżkę jako nieprawidłową, przenieś moduł transformacji do katalogu transformacji hooków albo usuń `hooks.transformsDir`.
- `agentId` kieruje do konkretnego agenta; nieznane identyfikatory wracają do domyślnego agenta.
- `allowedAgentIds`: ogranicza efektywne kierowanie agentów, w tym ścieżkę domyślnego agenta, gdy `agentId` jest pominięte (`*` lub pominięte = zezwól na wszystkie, `[]` = odmów wszystkim).
- `defaultSessionKey`: opcjonalny stały klucz sesji dla uruchomień agenta hooka bez jawnego `sessionKey`.
- `allowRequestSessionKey`: pozwala wywołującym `/hooks/agent` i kluczom sesji mapowania sterowanym szablonem ustawiać `sessionKey` (domyślnie: `false`).
- `allowedSessionKeyPrefixes`: opcjonalna lista dozwolonych prefiksów dla jawnych wartości `sessionKey` (żądanie + mapowanie), np. `["hook:"]`. Staje się wymagana, gdy dowolne mapowanie lub preset używa szablonowego `sessionKey`.
- `deliver: true` wysyła końcową odpowiedź do kanału; `channel` domyślnie ma wartość `last`.
- `model` nadpisuje LLM dla tego uruchomienia hooka (musi być dozwolony, jeśli ustawiono katalog modeli).

</Accordion>

### Integracja Gmail

- Wbudowany preset Gmail używa `sessionKey: "hook:gmail:{{messages[0].id}}"`.
- Jeśli zachowujesz to kierowanie per wiadomość, ustaw `hooks.allowRequestSessionKey: true` i ogranicz `hooks.allowedSessionKeyPrefixes`, aby pasowało do przestrzeni nazw Gmail, na przykład `["hook:", "hook:gmail:"]`.
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
- Nie uruchamiaj osobnego `gog gmail watch serve` obok Gateway.

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
- Tylko lokalnie: zachowaj `gateway.bind: "loopback"` (domyślnie).
- Wiązania inne niż loopback: trasy canvas wymagają uwierzytelniania Gateway (token/hasło/zaufany proxy), tak samo jak inne powierzchnie HTTP Gateway.
- WebView Node zwykle nie wysyłają nagłówków uwierzytelniania; po sparowaniu i połączeniu węzła Gateway ogłasza adresy URL uprawnień o zakresie węzła dla dostępu canvas/A2UI.
- Adresy URL uprawnień są powiązane z aktywną sesją WS węzła i szybko wygasają. Fallback oparty na IP nie jest używany.
- Wstrzykuje klienta przeładowania na żywo do serwowanego HTML.
- Automatycznie tworzy startowy `index.html`, gdy katalog jest pusty.
- Serwuje także A2UI pod `/__openclaw__/a2ui/`.
- Zmiany wymagają restartu gateway.
- Wyłącz przeładowanie na żywo dla dużych katalogów lub błędów `EMFILE`.

---

## Odkrywanie

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

- `minimal` (domyślnie, gdy dołączony Plugin `bonjour` jest włączony): pomija `cliPath` + `sshPort` z rekordów TXT.
- `full`: uwzględnia `cliPath` + `sshPort`; rozgłaszanie multicast LAN nadal wymaga włączenia dołączonego Plugin `bonjour`.
- `off`: wyłącza rozgłaszanie multicast LAN bez zmiany włączenia Plugin.
- Dołączony Plugin `bonjour` automatycznie uruchamia się na hostach macOS i jest opcjonalny na Linux, Windows oraz konteneryzowanych wdrożeniach Gateway.
- Nazwa hosta domyślnie jest nazwą hosta systemowego, gdy jest prawidłową etykietą DNS, w przeciwnym razie wraca do `openclaw`. Nadpisz za pomocą `OPENCLAW_MDNS_HOSTNAME`.

### Szeroki obszar (DNS-SD)

```json5
{
  discovery: {
    wideArea: { enabled: true },
  },
}
```

Zapisuje strefę unicast DNS-SD pod `~/.openclaw/dns/`. W przypadku wykrywania między sieciami połącz to z serwerem DNS (zalecany CoreDNS) + Tailscale split DNS.

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
- Pliki `.env`: `.env` z CWD + `~/.openclaw/.env` (żaden nie nadpisuje istniejących zmiennych).
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
- Użyj ucieczki `$${VAR}`, aby uzyskać dosłowne `${VAR}`.
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
- wzorzec id `source: "env"`: `^[A-Z][A-Z0-9_]{0,127}$`
- id `source: "file"`: bezwzględny wskaźnik JSON (na przykład `"/providers/openai/apiKey"`)
- wzorzec id `source: "exec"`: `^[A-Za-z0-9][A-Za-z0-9._:/#-]{0,255}$` (obsługuje selektory w stylu AWS `secret#json_key`)
- id `source: "exec"` nie mogą zawierać segmentów ścieżki rozdzielonych ukośnikami `.` ani `..` (na przykład `a/../b` jest odrzucane)

### Obsługiwana powierzchnia poświadczeń

- Macierz kanoniczna: [Powierzchnia poświadczeń SecretRef](/pl/reference/secretref-credential-surface)
- `secrets apply` celuje w obsługiwane ścieżki poświadczeń `openclaw.json`.
- Odwołania `auth-profiles.json` są uwzględnione w rozwiązywaniu w czasie działania i w pokryciu audytu.

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

- Dostawca `file` obsługuje `mode: "json"` i `mode: "singleValue"` (`id` musi mieć wartość `"value"` w trybie singleValue).
- Ścieżki dostawców file i exec kończą się bezpieczną porażką, gdy weryfikacja ACL systemu Windows jest niedostępna. Ustaw `allowInsecurePath: true` tylko dla zaufanych ścieżek, których nie można zweryfikować.
- Dostawca `exec` wymaga bezwzględnej ścieżki `command` i używa ładunków protokołu na stdin/stdout.
- Domyślnie ścieżki poleceń będące dowiązaniami symbolicznymi są odrzucane. Ustaw `allowSymlinkCommand: true`, aby zezwolić na ścieżki dowiązań symbolicznych przy jednoczesnej walidacji rozwiązanej ścieżki docelowej.
- Jeśli skonfigurowano `trustedDirs`, sprawdzenie zaufanego katalogu ma zastosowanie do rozwiązanej ścieżki docelowej.
- Środowisko procesu podrzędnego `exec` jest domyślnie minimalne; wymagane zmienne przekaż jawnie za pomocą `passEnv`.
- Odwołania do sekretów są rozwiązywane w czasie aktywacji do migawki w pamięci, a następnie ścieżki żądań odczytują tylko tę migawkę.
- Filtrowanie aktywnej powierzchni jest stosowane podczas aktywacji: nierozwiązane odwołania na włączonych powierzchniach powodują niepowodzenie uruchomienia/ponownego załadowania, natomiast nieaktywne powierzchnie są pomijane z diagnostyką.

---

## Przechowywanie uwierzytelniania

```json5
{
  auth: {
    profiles: {
      "anthropic:default": { provider: "anthropic", mode: "api_key" },
      "anthropic:work": { provider: "anthropic", mode: "api_key" },
      "openai:personal": { provider: "openai", mode: "oauth" },
    },
    order: {
      anthropic: ["anthropic:default", "anthropic:work"],
      openai: ["openai:personal"],
    },
  },
}
```

- Profile poszczególnych agentów są przechowywane w `<agentDir>/auth-profiles.json`.
- `auth-profiles.json` obsługuje referencje na poziomie wartości (`keyRef` dla `api_key`, `tokenRef` dla `token`) dla statycznych trybów poświadczeń.
- Starsze płaskie mapy `auth-profiles.json`, takie jak `{ "provider": { "apiKey": "..." } }`, nie są formatem środowiska uruchomieniowego; `openclaw doctor --fix` przepisuje je do kanonicznych profili kluczy API `provider:default` z kopią zapasową `.legacy-flat.*.bak`.
- Profile w trybie OAuth (`auth.profiles.<id>.mode = "oauth"`) nie obsługują poświadczeń profilu uwierzytelniania opartych na SecretRef.
- Statyczne poświadczenia środowiska uruchomieniowego pochodzą z rozwiązanych migawek w pamięci; starsze statyczne wpisy `auth.json` są czyszczone po wykryciu.
- Starsze importy OAuth pochodzą z `~/.openclaw/credentials/oauth.json`.
- Zobacz [OAuth](/pl/concepts/oauth).
- Zachowanie środowiska uruchomieniowego sekretów oraz narzędzia `audit/configure/apply`: [Zarządzanie sekretami](/pl/gateway/secrets).

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

- `billingBackoffHours`: bazowe wycofanie w godzinach, gdy profil zawodzi z powodu rzeczywistych
  błędów rozliczeń lub niewystarczających środków (domyślnie: `5`). Jawny tekst dotyczący rozliczeń może
  nadal trafić tutaj nawet przy odpowiedziach `401`/`403`, ale tekstowe dopasowania specyficzne dla dostawcy
  pozostają ograniczone do dostawcy, który jest ich właścicielem (na przykład OpenRouter
  `Key limit exceeded`). Ponawialne komunikaty HTTP `402` dotyczące okna użycia lub
  limitu wydatków organizacji/przestrzeni roboczej pozostają zamiast tego w ścieżce `rate_limit`.
- `billingBackoffHoursByProvider`: opcjonalne nadpisania godzin wycofania rozliczeń dla poszczególnych dostawców.
- `billingMaxHours`: limit w godzinach dla wykładniczego wzrostu wycofania rozliczeń (domyślnie: `24`).
- `authPermanentBackoffMinutes`: bazowe wycofanie w minutach dla błędów `auth_permanent` o wysokiej pewności (domyślnie: `10`).
- `authPermanentMaxMinutes`: limit w minutach dla wzrostu wycofania `auth_permanent` (domyślnie: `60`).
- `failureWindowHours`: kroczące okno w godzinach używane dla liczników wycofania (domyślnie: `24`).
- `overloadedProfileRotations`: maksymalna liczba rotacji profili uwierzytelniania tego samego dostawcy dla błędów przeciążenia przed przełączeniem na awaryjny model (domyślnie: `1`). Kształty zajętości dostawcy, takie jak `ModelNotReadyException`, trafiają tutaj.
- `overloadedBackoffMs`: stałe opóźnienie przed ponowieniem rotacji przeciążonego dostawcy/profilu (domyślnie: `0`).
- `rateLimitedProfileRotations`: maksymalna liczba rotacji profili uwierzytelniania tego samego dostawcy dla błędów limitu szybkości przed przełączeniem na awaryjny model (domyślnie: `1`). Ten koszyk limitu szybkości obejmuje tekst ukształtowany przez dostawcę, taki jak `Too many concurrent requests`, `ThrottlingException`, `concurrency limit reached`, `workers_ai ... quota limit exceeded` i `resource exhausted`.

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
- `consoleLevel` przełącza się na `debug`, gdy użyto `--verbose`.
- `maxFileBytes`: maksymalny rozmiar aktywnego pliku dziennika w bajtach przed rotacją (dodatnia liczba całkowita; domyślnie: `104857600` = 100 MB). OpenClaw przechowuje do pięciu ponumerowanych archiwów obok aktywnego pliku.
- `redactSensitive` / `redactPatterns`: maskowanie na zasadzie najlepszych starań dla wyjścia konsoli, dzienników plikowych, rekordów dziennika OTLP i utrwalonego tekstu transkrypcji sesji. `redactSensitive: "off"` wyłącza tylko tę ogólną politykę dzienników/transkrypcji; powierzchnie bezpieczeństwa UI/narzędzi/diagnostyki nadal redagują sekrety przed emisją.

---

## Diagnostyka

```json5
{
  diagnostics: {
    enabled: true,
    flags: ["telegram.*"],
    stuckSessionWarnMs: 30000,
    stuckSessionAbortMs: 300000,
    memoryPressureSnapshot: false,

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
      logsExporter: "otlp",
      sampleRate: 1.0,
      flushIntervalMs: 5000,
      captureContent: {
        enabled: false,
        inputMessages: false,
        outputMessages: false,
        toolInputs: false,
        toolOutputs: false,
        systemPrompt: false,
        toolDefinitions: false,
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
- `stuckSessionWarnMs`: próg wieku bez postępu w ms do klasyfikowania długotrwałych sesji przetwarzania jako `session.long_running`, `session.stalled` lub `session.stuck`. Odpowiedź, narzędzie, status, blok i postęp ACP resetują licznik czasu; powtarzane diagnostyki `session.stuck` wycofują się, gdy nic się nie zmienia.
- `stuckSessionAbortMs`: próg wieku bez postępu w ms, po którym kwalifikująca się zablokowana aktywna praca może zostać przerwana i opróżniona w celu odzyskania. Gdy nie ustawiono, OpenClaw używa bezpieczniejszego rozszerzonego okna osadzonych uruchomień wynoszącego co najmniej 5 minut i 3x `stuckSessionWarnMs`.
- `memoryPressureSnapshot`: przechwytuje zredagowaną migawkę stabilności sprzed OOM, gdy presja pamięci osiąga `critical` (domyślnie: `false`). Ustaw na `true`, aby dodać skan/zapis pliku pakietu stabilności przy zachowaniu normalnych zdarzeń presji pamięci.
- `otel.enabled`: włącza potok eksportu OpenTelemetry (domyślnie: `false`). Pełną konfigurację, katalog sygnałów i model prywatności znajdziesz w [Eksport OpenTelemetry](/pl/gateway/opentelemetry).
- `otel.endpoint`: URL kolektora dla eksportu OTel.
- `otel.tracesEndpoint` / `otel.metricsEndpoint` / `otel.logsEndpoint`: opcjonalne punkty końcowe OTLP specyficzne dla sygnału. Gdy są ustawione, nadpisują `otel.endpoint` tylko dla tego sygnału.
- `otel.protocol`: `"http/protobuf"` (domyślnie) lub `"grpc"`.
- `otel.headers`: dodatkowe nagłówki metadanych HTTP/gRPC wysyłane z żądaniami eksportu OTel.
- `otel.serviceName`: nazwa usługi dla atrybutów zasobu.
- `otel.traces` / `otel.metrics` / `otel.logs`: włącz eksport śladów, metryk lub dzienników.
- `otel.logsExporter`: ujście eksportu dzienników: `"otlp"` (domyślnie), `"stdout"` dla jednego obiektu JSON na linię stdout albo `"both"`.
- `otel.sampleRate`: częstotliwość próbkowania śladów `0`-`1`.
- `otel.flushIntervalMs`: okresowy interwał opróżniania telemetrii w ms.
- `otel.captureContent`: opcjonalne przechwytywanie surowej treści dla atrybutów zakresów OTEL. Domyślnie wyłączone. Wartość logiczna `true` przechwytuje niesystemową treść wiadomości/narzędzi; forma obiektu pozwala jawnie włączyć `inputMessages`, `outputMessages`, `toolInputs`, `toolOutputs`, `systemPrompt` i `toolDefinitions`.
- `OTEL_SEMCONV_STABILITY_OPT_IN=gen_ai_latest_experimental`: przełącznik środowiskowy dla najnowszego eksperymentalnego kształtu zakresu wnioskowania GenAI, w tym nazw zakresów `{gen_ai.operation.name} {gen_ai.request.model}`, rodzaju zakresu `CLIENT` i `gen_ai.provider.name` zamiast starszego `gen_ai.system`. Domyślnie zakresy zachowują `openclaw.model.call` i `gen_ai.system` dla zgodności; metryki GenAI używają ograniczonych atrybutów semantycznych.
- `OPENCLAW_OTEL_PRELOADED=1`: przełącznik środowiskowy dla hostów, które już zarejestrowały globalny SDK OpenTelemetry. OpenClaw pomija wtedy uruchamianie/zamykanie SDK należącego do Plugin, zachowując aktywne nasłuchiwanie diagnostyczne.
- `OTEL_EXPORTER_OTLP_TRACES_ENDPOINT`, `OTEL_EXPORTER_OTLP_METRICS_ENDPOINT` i `OTEL_EXPORTER_OTLP_LOGS_ENDPOINT`: zmienne środowiskowe punktów końcowych specyficznych dla sygnału używane, gdy odpowiadający klucz konfiguracji nie jest ustawiony.
- `cacheTrace.enabled`: rejestruj migawki śladu pamięci podręcznej dla osadzonych uruchomień (domyślnie: `false`).
- `cacheTrace.filePath`: ścieżka wyjściowa dla JSONL śladu pamięci podręcznej (domyślnie: `$OPENCLAW_STATE_DIR/logs/cache-trace.jsonl`).
- `cacheTrace.includeMessages` / `includePrompt` / `includeSystem`: kontroluje, co jest uwzględniane w wyjściu śladu pamięci podręcznej (wszystkie domyślnie: `true`).

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
- `checkOnStart`: sprawdzaj aktualizacje npm podczas uruchamiania Gateway (domyślnie: `true`).
- `auto.enabled`: włącz automatyczną aktualizację w tle dla instalacji pakietowych (domyślnie: `false`).
- `auto.stableDelayHours`: minimalne opóźnienie w godzinach przed automatycznym zastosowaniem w kanale stable (domyślnie: `6`; maks.: `168`).
- `auto.stableJitterHours`: dodatkowe okno rozłożenia wdrażania w kanale stable w godzinach (domyślnie: `12`; maks.: `168`).
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

- `enabled`: globalna bramka funkcji ACP (domyślnie: `true`; ustaw `false`, aby ukryć dispatch ACP i opcje tworzenia).
- `dispatch.enabled`: niezależna bramka dispatch tur sesji ACP (domyślnie: `true`). Ustaw `false`, aby zachować dostępność poleceń ACP, blokując wykonanie.
- `backend`: domyślny identyfikator backendu środowiska uruchomieniowego ACP (musi odpowiadać zarejestrowanemu Plugin środowiska uruchomieniowego ACP).
  Najpierw zainstaluj Plugin backendu, a jeśli ustawiono `plugins.allow`, uwzględnij identyfikator Plugin backendu (na przykład `acpx`), inaczej backend ACP się nie załaduje.
- `defaultAgent`: awaryjny identyfikator docelowego agenta ACP, gdy tworzenia nie określają jawnego celu.
- `allowedAgents`: lista dozwolonych identyfikatorów agentów dopuszczonych dla sesji środowiska uruchomieniowego ACP; pusta oznacza brak dodatkowego ograniczenia.
- `maxConcurrentSessions`: maksymalna liczba jednocześnie aktywnych sesji ACP.
- `stream.coalesceIdleMs`: okno opróżniania bezczynności w ms dla strumieniowanego tekstu.
- `stream.maxChunkChars`: maksymalny rozmiar fragmentu przed podziałem projekcji strumieniowanego bloku.
- `stream.repeatSuppression`: tłum powtarzające się linie statusu/narzędzi na turę (domyślnie: `true`).
- `stream.deliveryMode`: `"live"` strumieniuje przyrostowo; `"final_only"` buforuje do zdarzeń końcowych tury.
- `stream.hiddenBoundarySeparator`: separator przed widocznym tekstem po ukrytych zdarzeniach narzędzi (domyślnie: `"paragraph"`).
- `stream.maxOutputChars`: maksymalna liczba znaków wyjścia asystenta projektowana na turę ACP.
- `stream.maxSessionUpdateChars`: maksymalna liczba znaków dla projektowanych linii statusu/aktualizacji ACP.
- `stream.tagVisibility`: rekord nazw tagów do logicznych nadpisań widoczności dla zdarzeń strumieniowanych.
- `runtime.ttlMinutes`: TTL bezczynności w minutach dla pracowników sesji ACP przed kwalifikującym czyszczeniem.
- `runtime.installCommand`: opcjonalne polecenie instalacji do uruchomienia podczas inicjalizacji środowiska uruchomieniowego ACP.

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

- `cli.banner.taglineMode` steruje stylem sloganu banera:
  - `"random"` (domyślne): rotujące zabawne/sezonowe slogany.
  - `"default"`: stały neutralny slogan (`All your chats, one OpenClaw.`).
  - `"off"`: brak tekstu sloganu (tytuł/wersja banera nadal są wyświetlane).
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
    securityAcknowledgedAt: "2026-01-01T00:00:00.000Z",
  },
}
```

---

## Tożsamość

Zobacz pola tożsamości `agents.list` w sekcji [Domyślne ustawienia agentów](/pl/gateway/config-agents#agent-defaults).

---

## Mostek (starszy, usunięty)

Bieżące kompilacje nie zawierają już mostka TCP. Node'y łączą się przez Gateway WebSocket. Klucze `bridge.*` nie są już częścią schematu konfiguracji (walidacja nie powiedzie się, dopóki nie zostaną usunięte; `openclaw doctor --fix` może usunąć nieznane klucze).

<Accordion title="Starsza konfiguracja mostka (odniesienie historyczne)">

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
    maxConcurrentRuns: 8, // default; cron dispatch + isolated cron agent-turn execution
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

- `sessionRetention`: jak długo zachowywać ukończone izolowane sesje uruchomień cron przed usunięciem z `sessions.json`. Steruje także czyszczeniem zarchiwizowanych, usuniętych transkrypcji cron. Domyślnie: `24h`; ustaw `false`, aby wyłączyć.
- `runLog.maxBytes`: akceptowane dla zgodności ze starszymi dziennikami uruchomień cron opartymi na plikach. Domyślnie: `2_000_000` bajtów.
- `runLog.keepLines`: najnowsze wiersze historii uruchomień SQLite zachowywane dla każdego zadania. Domyślnie: `2000`.
- `webhookToken`: token bearer używany do dostarczania żądań POST Webhooka cron (`delivery.mode = "webhook"`); jeśli zostanie pominięty, nagłówek uwierzytelniania nie jest wysyłany.
- `webhook`: przestarzały starszy zapasowy URL Webhooka (http/https) używany przez `openclaw doctor --fix` do migrowania zapisanych zadań, które nadal mają `notify: true`; dostarczanie w czasie działania używa przypisanego do zadania `delivery.mode="webhook"` oraz `delivery.to`, albo `delivery.completionDestination` podczas zachowywania dostarczania ogłoszeń.

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

- `maxAttempts`: maksymalna liczba ponowień dla zadań cron przy błędach przejściowych (domyślnie: `3`; zakres: `0`-`10`).
- `backoffMs`: tablica opóźnień backoff w ms dla każdej próby ponowienia (domyślnie: `[30000, 60000, 300000]`; 1-10 wpisów).
- `retryOn`: typy błędów wywołujące ponowienia - `"rate_limit"`, `"overloaded"`, `"network"`, `"timeout"`, `"server_error"`. Pomiń, aby ponawiać wszystkie typy przejściowe.

Zadania jednorazowe pozostają włączone do wyczerpania prób ponowienia, a następnie są wyłączane z zachowaniem końcowego stanu błędu. Zadania cykliczne używają tej samej polityki ponawiania błędów przejściowych, aby uruchomić się ponownie po backoffie przed następnym zaplanowanym oknem; błędy trwałe lub wyczerpane ponowienia błędów przejściowych wracają do normalnego harmonogramu cyklicznego z backoffem błędu.

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

- `enabled`: włącza alerty o niepowodzeniach zadań cron (domyślnie: `false`).
- `after`: liczba kolejnych niepowodzeń przed wyzwoleniem alertu (dodatnia liczba całkowita, min.: `1`).
- `cooldownMs`: minimalna liczba milisekund między powtarzanymi alertami dla tego samego zadania (nieujemna liczba całkowita).
- `includeSkipped`: zlicza kolejne pominięte uruchomienia do progu alertu (domyślnie: `false`). Pominięte uruchomienia są śledzone osobno i nie wpływają na backoff błędów wykonania.
- `mode`: tryb dostarczania - `"announce"` wysyła przez wiadomość kanału; `"webhook"` publikuje do skonfigurowanego Webhooka.
- `accountId`: opcjonalne konto lub identyfikator kanału ograniczające zakres dostarczania alertu.

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

- Domyślny cel powiadomień o niepowodzeniach cron dla wszystkich zadań.
- `mode`: `"announce"` lub `"webhook"`; domyślnie `"announce"`, gdy istnieje wystarczająco dużo danych celu.
- `channel`: nadpisanie kanału dla dostarczania ogłoszeń. `"last"` ponownie używa ostatniego znanego kanału dostarczania.
- `to`: jawny cel ogłoszenia lub URL Webhooka. Wymagane w trybie Webhook.
- `accountId`: opcjonalne nadpisanie konta dla dostarczania.
- `delivery.failureDestination` na poziomie zadania nadpisuje tę globalną wartość domyślną.
- Gdy nie ustawiono ani globalnego, ani przypisanego do zadania celu niepowodzenia, zadania, które już dostarczają przez `announce`, w razie niepowodzenia wracają do tego podstawowego celu ogłoszeń.
- `delivery.failureDestination` jest obsługiwane tylko dla zadań `sessionTarget="isolated"`, chyba że podstawowe `delivery.mode` zadania to `"webhook"`.

Zobacz [Zadania Cron](/pl/automation/cron-jobs). Izolowane wykonania cron są śledzone jako [zadania w tle](/pl/automation/tasks).

---

## Zmienne szablonu modelu multimediów

Symbole zastępcze szablonu rozwijane w `tools.media.models[].args`:

| Zmienna            | Opis                                              |
| ------------------ | ------------------------------------------------- |
| `{{Body}}`         | Pełna treść wiadomości przychodzącej              |
| `{{RawBody}}`      | Surowa treść (bez opakowań historii/nadawcy)      |
| `{{BodyStripped}}` | Treść z usuniętymi wzmiankami grupy               |
| `{{From}}`         | Identyfikator nadawcy                             |
| `{{To}}`           | Identyfikator celu                                |
| `{{MessageSid}}`   | Identyfikator wiadomości kanału                   |
| `{{SessionId}}`    | Bieżący UUID sesji                                |
| `{{IsNewSession}}` | `"true"`, gdy utworzono nową sesję                |
| `{{MediaUrl}}`     | Pseudo-URL przychodzących multimediów             |
| `{{MediaPath}}`    | Lokalna ścieżka multimediów                       |
| `{{MediaType}}`    | Typ multimediów (obraz/audio/dokument/…)          |
| `{{Transcript}}`   | Transkrypcja audio                                |
| `{{Prompt}}`       | Rozwiązany prompt multimediów dla wpisów CLI      |
| `{{MaxChars}}`     | Rozwiązana maks. liczba znaków wyjścia dla wpisów CLI |
| `{{ChatType}}`     | `"direct"` lub `"group"`                          |
| `{{GroupSubject}}` | Temat grupy (najlepsza możliwa próba)             |
| `{{GroupMembers}}` | Podgląd członków grupy (najlepsza możliwa próba)  |
| `{{SenderName}}`   | Wyświetlana nazwa nadawcy (najlepsza możliwa próba) |
| `{{SenderE164}}`   | Numer telefonu nadawcy (najlepsza możliwa próba)  |
| `{{Provider}}`     | Wskazówka providera (whatsapp, telegram, discord itd.) |

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
- Tablica plików: głęboko scalana w kolejności (późniejsze nadpisują wcześniejsze).
- Klucze równorzędne: scalane po dołączeniach (nadpisują dołączone wartości).
- Zagnieżdżone dołączenia: do 10 poziomów głębokości.
- Ścieżki: rozwiązywane względem pliku dołączającego, ale muszą pozostać wewnątrz katalogu konfiguracji najwyższego poziomu (`dirname` pliku `openclaw.json`). Formy bezwzględne/`../` są dozwolone tylko wtedy, gdy nadal rozwiązują się wewnątrz tej granicy. Ścieżki nie mogą zawierać bajtów null i muszą mieć ściśle mniej niż 4096 znaków przed i po rozwiązaniu.
- Zapisy należące do OpenClaw, które zmieniają tylko jedną sekcję najwyższego poziomu wspieraną przez dołączenie pojedynczego pliku, zapisują przezroczysto do tego dołączonego pliku. Na przykład `plugins install` aktualizuje `plugins: { $include: "./plugins.json5" }` w `plugins.json5` i pozostawia `openclaw.json` bez zmian.
- Dołączenia główne, tablice dołączeń i dołączenia z nadpisaniami równorzędnymi są tylko do odczytu dla zapisów należących do OpenClaw; takie zapisy kończą się zamkniętym niepowodzeniem zamiast spłaszczać konfigurację.
- Błędy: jasne komunikaty dla brakujących plików, błędów parsowania, cyklicznych dołączeń, nieprawidłowego formatu ścieżki i nadmiernej długości.

---

_Powiązane: [Konfiguracja](/pl/gateway/configuration) · [Przykłady konfiguracji](/pl/gateway/configuration-examples) · [Doctor](/pl/gateway/doctor)_

## Powiązane

- [Konfiguracja](/pl/gateway/configuration)
- [Przykłady konfiguracji](/pl/gateway/configuration-examples)
