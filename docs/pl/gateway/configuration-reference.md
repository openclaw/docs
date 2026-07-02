---
read_when:
    - Potrzebujesz dokładnej semantyki konfiguracji na poziomie pól lub wartości domyślnych
    - Walidujesz bloki konfiguracji kanału, modelu, Gateway lub narzędzia
summary: Dokumentacja referencyjna konfiguracji Gateway dla podstawowych kluczy OpenClaw, wartości domyślnych i linków do osobnych dokumentacji referencyjnych podsystemów
title: Dokumentacja konfiguracji
x-i18n:
    generated_at: "2026-07-02T08:53:46Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: b1d31c4c35f216480f4536a57bca50558a8d19dcf57dcf30be9033555c019d72
    source_path: gateway/configuration-reference.md
    workflow: 16
---

Podstawowa dokumentacja konfiguracji dla `~/.openclaw/openclaw.json`. Omówienie zorientowane na zadania znajdziesz w [Konfiguracja](/pl/gateway/configuration).

Obejmuje główne powierzchnie konfiguracji OpenClaw i odsyła dalej, gdy podsystem ma własną, głębszą dokumentację. Katalogi poleceń należące do kanałów i Pluginów oraz szczegółowe ustawienia pamięci/QMD znajdują się na osobnych stronach, a nie tutaj.

Źródło prawdy w kodzie:

- `openclaw config schema` wypisuje aktualny schemat JSON używany do walidacji i Control UI, z dołączonymi metadanymi wbudowanych elementów/Pluginów/kanałów, gdy są dostępne
- `config.schema.lookup` zwraca jeden węzeł schematu ograniczony do ścieżki dla narzędzi drążących
- `pnpm config:docs:check` / `pnpm config:docs:gen` sprawdzają bazowy hash dokumentacji konfiguracji względem bieżącej powierzchni schematu

Ścieżka wyszukiwania agenta: użyj akcji narzędzia `gateway` `config.schema.lookup`, aby przed edycją uzyskać dokładną dokumentację i ograniczenia na poziomie pól. Użyj [Konfiguracja](/pl/gateway/configuration) jako przewodnika zorientowanego na zadania, a tej strony jako szerszej mapy pól, wartości domyślnych i linków do dokumentacji podsystemów.

Dedykowane szczegółowe dokumentacje:

- [Dokumentacja konfiguracji pamięci](/pl/reference/memory-config) dla `agents.defaults.memorySearch.*`, `memory.qmd.*`, `memory.citations` oraz konfiguracji Dreaming pod `plugins.entries.memory-core.config.dreaming`
- [Polecenia slash](/pl/tools/slash-commands) dla bieżącego katalogu poleceń wbudowanych i dołączonych
- strony właścicielskie kanałów/Pluginów dla powierzchni poleceń specyficznych dla kanału

Format konfiguracji to **JSON5** (komentarze i końcowe przecinki są dozwolone). Wszystkie pola są opcjonalne - OpenClaw używa bezpiecznych wartości domyślnych, gdy zostaną pominięte.

---

## Kanały

Klucze konfiguracji poszczególnych kanałów przeniesiono na dedykowaną stronę - zobacz [Konfiguracja - kanały](/pl/gateway/config-channels) dla `channels.*`, w tym Slack, Discord, Telegram, WhatsApp, Matrix, iMessage i innych dołączonych kanałów (uwierzytelnianie, kontrola dostępu, wiele kont, bramkowanie wzmianek).

## Domyślne ustawienia agentów, wielu agentów, sesje i wiadomości

Przeniesiono na dedykowaną stronę - zobacz [Konfiguracja - agenci](/pl/gateway/config-agents) dla:

- `agents.defaults.*` (workspace, model, thinking, heartbeat, pamięć, media, skills, sandbox)
- `multiAgent.*` (routing i powiązania wielu agentów)
- `session.*` (cykl życia sesji, Compaction, przycinanie)
- `messages.*` (dostarczanie wiadomości, TTS, renderowanie markdown)
- `talk.*` (tryb Talk)
  - `talk.consultThinkingLevel`: nadpisanie poziomu thinking dla pełnego uruchomienia agenta OpenClaw stojącego za konsultacjami realtime Control UI Talk
  - `talk.consultFastMode`: jednorazowe nadpisanie trybu szybkiego dla konsultacji realtime Control UI Talk
  - `talk.speechLocale`: opcjonalny identyfikator locale BCP 47 dla rozpoznawania mowy Talk na iOS/macOS
  - `talk.silenceTimeoutMs`: gdy nieustawione, Talk zachowuje domyślne okno pauzy platformy przed wysłaniem transkrypcji (`700 ms on macOS and Android, 900 ms on iOS`)
  - `talk.realtime.consultRouting`: awaryjny przekaźnik Gateway dla sfinalizowanych transkrypcji realtime Talk, które pomijają `openclaw_agent_consult`

## Narzędzia i niestandardowi dostawcy

Politykę narzędzi, eksperymentalne przełączniki, konfigurację narzędzi opartych na dostawcach oraz konfigurację niestandardowego dostawcy / bazowego URL przeniesiono na dedykowaną stronę - zobacz [Konfiguracja - narzędzia i niestandardowi dostawcy](/pl/gateway/config-tools).

## Modele

Definicje dostawców, listy dozwolonych modeli i konfiguracja niestandardowych dostawców znajdują się w [Konfiguracja - narzędzia i niestandardowi dostawcy](/pl/gateway/config-tools#custom-providers-and-base-urls).
Katalog główny `models` odpowiada też za globalne zachowanie katalogu modeli.

```json5
{
  models: {
    // Optional. Default: true. Requires a Gateway restart when changed.
    pricing: { enabled: false },
  },
}
```

- `models.mode`: zachowanie katalogu dostawców (`merge` lub `replace`).
- `models.providers`: mapa niestandardowych dostawców indeksowana identyfikatorem dostawcy.
- `models.providers.*.localService`: opcjonalny menedżer procesów uruchamianych na żądanie dla lokalnych serwerów modeli. OpenClaw sprawdza skonfigurowany endpoint health, w razie potrzeby uruchamia bezwzględne `command`, czeka na gotowość, a potem wysyła żądanie modelu. Zobacz [Lokalne usługi modeli](/pl/gateway/local-model-services).
- `models.pricing.enabled`: kontroluje bootstrap cennika w tle, który startuje po osiągnięciu ścieżki gotowości Gateway przez sidecary i kanały. Gdy `false`, Gateway pomija pobieranie katalogów cen OpenRouter i LiteLLM; skonfigurowane wartości `models.providers.*.models[].cost` nadal działają dla lokalnych szacunków kosztów.

## MCP

Definicje serwerów MCP zarządzanych przez OpenClaw znajdują się pod `mcp.servers` i są używane przez osadzony OpenClaw oraz inne adaptery runtime. Polecenia `openclaw mcp list`, `show`, `set` i `unset` zarządzają tym blokiem bez łączenia się z serwerem docelowym podczas edycji konfiguracji.

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

- `mcp.servers`: nazwane definicje serwerów MCP stdio lub zdalnych dla runtime, które udostępniają skonfigurowane narzędzia MCP.
  Wpisy zdalne używają `transport: "streamable-http"` albo `transport: "sse"`; `type: "http"` jest aliasem natywnym dla CLI, który `openclaw mcp set` i `openclaw doctor --fix` normalizują do kanonicznego pola `transport`.
- `mcp.servers.<name>.enabled`: ustaw `false`, aby zachować zapisaną definicję serwera, jednocześnie wykluczając ją z wykrywania MCP osadzonego OpenClaw i projekcji narzędzi.
- `mcp.servers.<name>.timeout` / `requestTimeoutMs`: limit czasu żądania MCP dla serwera w sekundach lub milisekundach.
- `mcp.servers.<name>.connectTimeout` / `connectionTimeoutMs`: limit czasu połączenia dla serwera w sekundach lub milisekundach.
- `mcp.servers.<name>.supportsParallelToolCalls`: opcjonalna wskazówka współbieżności dla adapterów, które mogą wybierać, czy wykonywać równoległe wywołania narzędzi MCP.
- `mcp.servers.<name>.auth`: ustaw `"oauth"` dla serwerów HTTP MCP wymagających OAuth. Uruchom `openclaw mcp login <name>`, aby zapisać tokeny w stanie OpenClaw.
- `mcp.servers.<name>.oauth`: opcjonalne nadpisania zakresu OAuth, adresu URL przekierowania i adresu URL metadanych klienta.
- `mcp.servers.<name>.sslVerify`, `clientCert`, `clientKey`: ustawienia TLS HTTP dla prywatnych endpointów i wzajemnego TLS.
- `mcp.servers.<name>.toolFilter`: opcjonalny wybór narzędzi dla serwera. `include` ogranicza odkryte narzędzia MCP do pasujących nazw; `exclude` ukrywa pasujące nazwy. Wpisy to dokładne nazwy narzędzi MCP albo proste globy `*`. Serwery z zasobami lub promptami generują też nazwy narzędzi pomocniczych (`resources_list`, `resources_read`, `prompts_list`, `prompts_get`), a te nazwy używają tego samego filtra.
- `mcp.servers.<name>.codex`: opcjonalne ustawienia projekcji serwera aplikacji Codex.
  Ten blok to metadane OpenClaw tylko dla wątków serwera aplikacji Codex; nie wpływa na sesje ACP, ogólną konfigurację harness Codex ani inne adaptery runtime.
  Niepuste `codex.agents` ogranicza serwer do wymienionych identyfikatorów agentów OpenClaw.
  Puste, blank albo nieprawidłowe listy agentów o ograniczonym zakresie są odrzucane przez walidację konfiguracji i pomijane przez ścieżkę projekcji runtime zamiast stawać się globalne.
  `codex.defaultToolsApprovalMode` emituje natywne `default_tools_approval_mode` Codex dla tego serwera. OpenClaw usuwa blok `codex` przed przekazaniem natywnej konfiguracji `mcp_servers` do Codex. Pomiń ten blok, aby serwer był projektowany dla każdego agenta serwera aplikacji Codex z domyślnym zachowaniem zatwierdzania MCP w Codex.
- `mcp.sessionIdleTtlMs`: TTL bezczynności dla runtime MCP dołączonych w zakresie sesji.
  Jednorazowe uruchomienia osadzone żądają sprzątania po zakończeniu uruchomienia; ten TTL jest zabezpieczeniem dla długotrwałych sesji i przyszłych wywołujących.
- Zmiany pod `mcp.*` są stosowane na gorąco przez zwolnienie zbuforowanych runtime MCP sesji.
  Następne odkrycie/użycie narzędzia odtwarza je z nowej konfiguracji, więc usunięte wpisy `mcp.servers` są zbierane natychmiast zamiast czekać na TTL bezczynności.
- Wykrywanie runtime honoruje też powiadomienia o zmianie listy narzędzi MCP, usuwając zbuforowany katalog dla tej sesji. Serwery reklamujące zasoby lub prompty otrzymują narzędzia pomocnicze do listowania/odczytu zasobów oraz listowania/pobierania promptów. Powtarzające się błędy wywołań narzędzi krótko wstrzymują dotknięty serwer przed próbą kolejnego wywołania.

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

- `allowBundled`: opcjonalna lista dozwolonych tylko dla dołączonych skills (zarządzane/workspace skills bez zmian).
- `load.extraDirs`: dodatkowe współdzielone katalogi główne skill (najniższy priorytet).
- `load.allowSymlinkTargets`: zaufane rzeczywiste katalogi docelowe, do których mogą rozwiązywać się symlinki skill, gdy link znajduje się poza skonfigurowanym katalogiem źródłowym.
- `workshop.allowSymlinkTargetWrites`: pozwala Skill Workshop apply zapisywać przez już zaufane cele symlinków (domyślnie: false).
- `install.preferBrew`: gdy true, preferuj instalatory Homebrew, gdy `brew` jest dostępny, zanim nastąpi powrót do innych rodzajów instalatorów.
- `install.nodeManager`: preferencja instalatora Node dla specyfikacji `metadata.openclaw.install` (`npm` | `pnpm` | `yarn` | `bun`).
- `install.allowUploadedArchives`: pozwala zaufanym klientom Gateway `operator.admin` instalować prywatne archiwa zip przygotowane przez `skills.upload.*` (domyślnie: false). Włącza to tylko ścieżkę przesłanego archiwum; normalne instalacje ClawHub jej nie wymagają.
- `entries.<skillKey>.enabled: false` wyłącza skill, nawet jeśli jest dołączony/zainstalowany.
- `entries.<skillKey>.apiKey`: ułatwienie dla skills deklarujących podstawową zmienną środowiskową (jawny ciąg tekstowy albo obiekt SecretRef).

---

## Pluginy

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

- Ładowane z katalogów pakietów lub bundle pod `~/.openclaw/extensions` i `<workspace>/.openclaw/extensions` oraz z plików lub katalogów wymienionych w `plugins.load.paths`.
- Umieszczaj samodzielne pliki pluginów w `plugins.load.paths`; automatycznie wykrywane katalogi główne rozszerzeń ignorują pliki `.js`, `.mjs` i `.ts` najwyższego poziomu, aby skrypty pomocnicze w tych katalogach nie blokowały uruchamiania.
- Wykrywanie akceptuje natywne pluginy OpenClaw oraz zgodne bundle Codex i bundle Claude, w tym bundle Claude bez manifestu o domyślnym układzie.
- **Zmiany konfiguracji wymagają ponownego uruchomienia gatewaya.**
- `allow`: opcjonalna lista dozwolonych elementów (ładują się tylko wymienione pluginy). `deny` ma pierwszeństwo.
- `plugins.entries.<id>.apiKey`: wygodne pole klucza API na poziomie pluginu (gdy jest obsługiwane przez plugin).
- `plugins.entries.<id>.env`: mapa zmiennych środowiskowych o zakresie pluginu.
- `plugins.entries.<id>.hooks.allowPromptInjection`: gdy `false`, rdzeń blokuje `before_prompt_build` i ignoruje pola modyfikujące prompt ze starszego `before_agent_start`, zachowując jednocześnie starsze `modelOverride` i `providerOverride`. Dotyczy natywnych hooków pluginów i obsługiwanych katalogów hooków dostarczanych przez bundle.
- `plugins.entries.<id>.hooks.allowConversationAccess`: gdy `true`, zaufane pluginy spoza bundle mogą odczytywać surową treść konwersacji z typowanych hooków, takich jak `llm_input`, `llm_output`, `before_model_resolve`, `before_agent_reply`, `before_agent_run`, `before_agent_finalize` i `agent_end`.
- `plugins.entries.<id>.subagent.allowModelOverride`: jawnie zaufaj temu pluginowi, aby mógł żądać nadpisań `provider` i `model` dla pojedynczego uruchomienia w tle subagentów.
- `plugins.entries.<id>.subagent.allowedModels`: opcjonalna lista dozwolonych kanonicznych celów `provider/model` dla zaufanych nadpisań subagenta. Użyj `"*"` tylko wtedy, gdy celowo chcesz dopuścić dowolny model.
- `plugins.entries.<id>.llm.allowModelOverride`: jawnie zaufaj temu pluginowi, aby mógł żądać nadpisań modelu dla `api.runtime.llm.complete`.
- `plugins.entries.<id>.llm.allowedModels`: opcjonalna lista dozwolonych kanonicznych celów `provider/model` dla zaufanych nadpisań uzupełniania LLM pluginu. Użyj `"*"` tylko wtedy, gdy celowo chcesz dopuścić dowolny model.
- `plugins.entries.<id>.llm.allowAgentIdOverride`: jawnie zaufaj temu pluginowi, aby mógł uruchamiać `api.runtime.llm.complete` względem identyfikatora agenta innego niż domyślny.
- `plugins.entries.<id>.config`: obiekt konfiguracji zdefiniowany przez plugin (walidowany przez schemat natywnego pluginu OpenClaw, gdy jest dostępny).
- Ustawienia konta/czasu działania pluginu kanału znajdują się pod `channels.<id>` i powinny być opisywane przez metadane `channelConfigs` manifestu pluginu właściciela, a nie przez centralny rejestr opcji OpenClaw.

### Konfiguracja pluginu harnessu Codex

Dołączony plugin `codex` jest właścicielem natywnych ustawień harnessu serwera aplikacji Codex pod
`plugins.entries.codex.config`. Zobacz
[odniesienie harnessu Codex](/pl/plugins/codex-harness-reference), aby poznać pełną
powierzchnię konfiguracji, oraz [harness Codex](/pl/plugins/codex-harness), aby poznać model czasu działania.

`codexPlugins` dotyczy tylko sesji, które wybierają natywny harness Codex.
Nie włącza pluginów Codex dla uruchomień dostawcy OpenClaw, powiązań konwersacji
ACP ani żadnego harnessu innego niż Codex.

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
  pluginów/aplikacji Codex dla harnessu Codex. Domyślnie: `false`.
- `plugins.entries.codex.config.codexPlugins.allow_destructive_actions`:
  domyślna polityka działań destrukcyjnych dla zmigrowanych wywołań aplikacji pluginów.
  Użyj `true`, aby akceptować bez pytania bezpieczne schematy zatwierdzania Codex, `false`,
  aby je odrzucać, `"auto"`, aby kierować zatwierdzenia wymagane przez Codex przez
  zatwierdzenia pluginów OpenClaw, albo `"ask"`, aby pytać o każde zapisujące/destrukcyjne
  działanie pluginu bez trwałego zatwierdzenia. Tryb `"ask"` czyści trwałe nadpisania
  zatwierdzeń Codex dla poszczególnych narzędzi dotkniętej aplikacji i wybiera recenzenta
  zatwierdzeń ludzkich dla tej aplikacji przed rozpoczęciem wątku Codex.
  Domyślnie: `true`.
- `plugins.entries.codex.config.codexPlugins.plugins.<key>.enabled`: włącza
  zmigrowany wpis pluginu, gdy globalne `codexPlugins.enabled` również ma wartość true.
  Domyślnie: `true` dla jawnych wpisów.
- `plugins.entries.codex.config.codexPlugins.plugins.<key>.marketplaceName`:
  stabilna tożsamość marketplace. V1 obsługuje tylko `"openai-curated"`.
- `plugins.entries.codex.config.codexPlugins.plugins.<key>.pluginName`: stabilna
  tożsamość pluginu Codex z migracji, na przykład `"google-calendar"`.
- `plugins.entries.codex.config.codexPlugins.plugins.<key>.allow_destructive_actions`:
  nadpisanie działań destrukcyjnych dla pojedynczego pluginu. Gdy pominięte, używana jest
  globalna wartość `allow_destructive_actions`. Wartość dla pojedynczego pluginu akceptuje
  te same polityki `true`, `false`, `"auto"` lub `"ask"`.

Każda dopuszczona aplikacja pluginu używająca `"ask"` kieruje żądania zatwierdzenia tej aplikacji
do recenzenta ludzkiego. Inne aplikacje i zatwierdzenia wątków niezwiązane z aplikacją zachowują
skonfigurowanego recenzenta, więc mieszane polityki pluginów nie dziedziczą zachowania `"ask"`.

`codexPlugins.enabled` to globalna dyrektywa włączenia. Jawne wpisy pluginów
zapisane przez migrację są trwałym zestawem instalacji i kwalifikacji do naprawy.
`plugins["*"]` nie jest obsługiwane, nie ma przełącznika `install`, a lokalne
wartości `marketplacePath` celowo nie są polami konfiguracji, ponieważ są
zależne od hosta.

Kontrole gotowości `app/list` są buforowane przez godzinę i odświeżane
asynchronicznie, gdy są nieaktualne. Konfiguracja aplikacji wątku Codex jest obliczana przy
ustanawianiu sesji harnessu Codex, a nie przy każdej turze; użyj `/new`, `/reset` albo ponownego
uruchomienia gatewaya po zmianie natywnej konfiguracji pluginu.

- `plugins.entries.firecrawl.config.webFetch`: ustawienia dostawcy pobierania stron Firecrawl.
  - `apiKey`: opcjonalny klucz API Firecrawl dla wyższych limitów (akceptuje SecretRef). Rezerwowo używa `plugins.entries.firecrawl.config.webSearch.apiKey`, starszego `tools.web.fetch.firecrawl.apiKey` albo zmiennej środowiskowej `FIRECRAWL_API_KEY`.
  - `baseUrl`: bazowy URL API Firecrawl (domyślnie: `https://api.firecrawl.dev`; nadpisania self-hosted muszą wskazywać prywatne/wewnętrzne endpointy).
  - `onlyMainContent`: wyodrębniaj tylko główną treść ze stron (domyślnie: `true`).
  - `maxAgeMs`: maksymalny wiek pamięci podręcznej w milisekundach (domyślnie: `172800000` / 2 dni).
  - `timeoutSeconds`: limit czasu żądania scrape w sekundach (domyślnie: `60`).
- `plugins.entries.xai.config.xSearch`: ustawienia xAI X Search (wyszukiwanie webowe Grok).
  - `enabled`: włącz dostawcę X Search.
  - `model`: model Grok używany do wyszukiwania (np. `"grok-4-1-fast"`).
- `plugins.entries.memory-core.config.dreaming`: ustawienia memory dreaming. Zobacz [Dreaming](/pl/concepts/dreaming), aby poznać fazy i progi.
  - `enabled`: główny przełącznik dreaming (domyślnie `false`).
  - `frequency`: rytm cron dla każdego pełnego przebiegu dreaming (`"0 3 * * *"` domyślnie).
  - `model`: opcjonalne nadpisanie modelu subagenta Dream Diary. Wymaga `plugins.entries.memory-core.subagent.allowModelOverride: true`; połącz z `allowedModels`, aby ograniczyć cele. Błędy niedostępności modelu ponawiają próbę raz z domyślnym modelem sesji; błędy zaufania lub listy dozwolonych nie przechodzą po cichu na rozwiązanie rezerwowe.
  - polityka faz i progi są szczegółami implementacji (nie kluczami konfiguracji widocznymi dla użytkownika).
- Pełna konfiguracja pamięci znajduje się w [odniesieniu konfiguracji pamięci](/pl/reference/memory-config):
  - `agents.defaults.memorySearch.*`
  - `memory.backend`
  - `memory.citations`
  - `memory.qmd.*`
  - `plugins.entries.memory-core.config.dreaming`
- Włączone pluginy bundle Claude mogą też wnosić osadzone domyślne ustawienia OpenClaw z `settings.json`; OpenClaw stosuje je jako oczyszczone ustawienia agenta, a nie jako surowe patche konfiguracji OpenClaw.
- `plugins.slots.memory`: wybierz identyfikator aktywnego pluginu pamięci albo `"none"`, aby wyłączyć pluginy pamięci.
- `plugins.slots.contextEngine`: wybierz identyfikator aktywnego pluginu silnika kontekstu; domyślnie `"legacy"`, chyba że zainstalujesz i wybierzesz inny silnik.

Zobacz [Pluginy](/pl/tools/plugin).

---

## Zobowiązania

`commitments` kontroluje wywnioskowaną pamięć działań następczych: OpenClaw może wykrywać check-iny z tur konwersacji i dostarczać je przez uruchomienia Heartbeat.

- `commitments.enabled`: włącz ukryte wyodrębnianie LLM, przechowywanie i dostarczanie Heartbeat dla wywnioskowanych zobowiązań działań następczych. Domyślnie: `false`.
- `commitments.maxPerDay`: maksymalna liczba wywnioskowanych zobowiązań działań następczych dostarczanych na sesję agenta w kroczącym dniu. Domyślnie: `3`.

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
- `tabCleanup` odzyskuje śledzone karty głównego agenta po czasie bezczynności albo gdy
  sesja przekroczy swój limit. Ustaw `idleMinutes: 0` lub `maxTabsPerSession: 0`, aby
  wyłączyć te poszczególne tryby czyszczenia.
- `ssrfPolicy.dangerouslyAllowPrivateNetwork` jest wyłączone, gdy nie jest ustawione, więc nawigacja przeglądarki domyślnie pozostaje restrykcyjna.
- Ustaw `ssrfPolicy.dangerouslyAllowPrivateNetwork: true` tylko wtedy, gdy celowo ufasz nawigacji przeglądarki w sieci prywatnej.
- W trybie restrykcyjnym zdalne punkty końcowe profilu CDP (`profiles.*.cdpUrl`) podlegają temu samemu blokowaniu sieci prywatnej podczas kontroli osiągalności/odkrywania.
- `ssrfPolicy.allowPrivateNetwork` pozostaje obsługiwane jako starszy alias.
- W trybie restrykcyjnym używaj `ssrfPolicy.hostnameAllowlist` i `ssrfPolicy.allowedHostnames` do jawnych wyjątków.
- Profile zdalne są tylko do podłączania (uruchamianie/zatrzymywanie/resetowanie wyłączone).
- `profiles.*.cdpUrl` akceptuje `http://`, `https://`, `ws://` i `wss://`.
  Używaj HTTP(S), gdy chcesz, aby OpenClaw odkrywał `/json/version`; używaj WS(S),
  gdy dostawca podaje bezpośredni adres URL WebSocket DevTools.
- `remoteCdpTimeoutMs` i `remoteCdpHandshakeTimeoutMs` mają zastosowanie do zdalnej oraz
  `attachOnly` osiągalności CDP, a także żądań otwierania kart. Zarządzane profile loopback
  zachowują lokalne wartości domyślne CDP.
- Jeśli zewnętrznie zarządzana usługa CDP jest osiągalna przez loopback, ustaw dla tego
  profilu `attachOnly: true`; w przeciwnym razie OpenClaw potraktuje port loopback jako
  lokalnie zarządzany profil przeglądarki i może zgłaszać błędy własności portu lokalnego.
- Profile `existing-session` używają Chrome MCP zamiast CDP i mogą podłączać się na
  wybranym hoście albo przez połączony węzeł przeglądarki.
- Profile `existing-session` mogą ustawić `userDataDir`, aby wskazać konkretny
  profil przeglądarki opartej na Chromium, taki jak Brave lub Edge.
- Profile `existing-session` mogą ustawić `cdpUrl`, gdy Chrome już działa
  za punktem końcowym odkrywania HTTP(S) DevTools albo bezpośrednim punktem końcowym WS(S). W tym
  trybie OpenClaw przekazuje punkt końcowy do Chrome MCP zamiast używać automatycznego łączenia;
  `userDataDir` jest ignorowane dla argumentów uruchamiania Chrome MCP.
- Profile `existing-session` zachowują obecne limity tras Chrome MCP:
  akcje oparte na migawkach/ref zamiast wskazywania selektorami CSS, haki przesyłania
  jednego pliku, brak nadpisań limitu czasu okien dialogowych, brak `wait --load networkidle` oraz brak
  `responsebody`, eksportu PDF, przechwytywania pobrań lub akcji wsadowych.
- Lokalne zarządzane profile `openclaw` automatycznie przypisują `cdpPort` i `cdpUrl`; ustaw
  `cdpUrl` jawnie tylko dla zdalnych profili CDP albo podłączania punktu końcowego existing-session.
- Lokalne zarządzane profile mogą ustawić `executablePath`, aby nadpisać globalne
  `browser.executablePath` dla tego profilu. Użyj tego, aby uruchomić jeden profil w
  Chrome, a inny w Brave.
- Lokalne zarządzane profile używają `browser.localLaunchTimeoutMs` do odkrywania HTTP Chrome CDP
  po uruchomieniu procesu oraz `browser.localCdpReadyTimeoutMs` do
  gotowości websocket CDP po uruchomieniu. Zwiększ je na wolniejszych hostach, gdzie Chrome
  uruchamia się pomyślnie, ale kontrole gotowości ścigają się ze startem. Obie wartości muszą być
  dodatnimi liczbami całkowitymi do `120000` ms; nieprawidłowe wartości konfiguracji są odrzucane.
- Kolejność automatycznego wykrywania: domyślna przeglądarka, jeśli oparta na Chromium → Chrome → Brave → Edge → Chromium → Chrome Canary.
- `browser.executablePath` i `browser.profiles.<name>.executablePath` akceptują zarówno
  `~`, jak i `~/...` dla katalogu domowego Twojego systemu operacyjnego przed uruchomieniem Chromium.
  `userDataDir` na profil dla profili `existing-session` jest również rozwijane z tyldą.
- Usługa sterowania: tylko loopback (port pochodny od `gateway.port`, domyślnie `18791`).
- `extraArgs` dodaje dodatkowe flagi uruchomienia do lokalnego startu Chromium (na przykład
  `--disable-gpu`, rozmiar okna albo flagi debugowania).

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

- `seamColor`: kolor akcentu dla chrome interfejsu natywnej aplikacji (odcień dymka Talk Mode itd.).
- `assistant`: nadpisanie tożsamości Control UI. Wraca do tożsamości aktywnego agenta.

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

<Accordion title="Szczegóły pól Gateway">

- `mode`: `local` (uruchom gateway) lub `remote` (połącz ze zdalnym gateway). Gateway odmawia uruchomienia, jeśli nie ustawiono `local`.
- `port`: pojedynczy multipleksowany port dla WS + HTTP. Kolejność pierwszeństwa: `--port` > `OPENCLAW_GATEWAY_PORT` > `gateway.port` > `18789`.
- `bind`: `auto`, `loopback` (domyślnie), `lan` (`0.0.0.0`), `tailnet` (tylko adres IP Tailscale) lub `custom`.
- **Starsze aliasy bind**: używaj wartości trybu bind w `gateway.bind` (`auto`, `loopback`, `lan`, `tailnet`, `custom`), a nie aliasów hosta (`0.0.0.0`, `127.0.0.1`, `localhost`, `::`, `::1`).
- **Uwaga dotycząca Dockera**: domyślny bind `loopback` nasłuchuje na `127.0.0.1` wewnątrz kontenera. Przy sieci mostkowanej Dockera (`-p 18789:18789`) ruch dociera przez `eth0`, więc gateway jest nieosiągalny. Użyj `--network host` albo ustaw `bind: "lan"` (lub `bind: "custom"` z `customBindHost: "0.0.0.0"`), aby nasłuchiwać na wszystkich interfejsach.
- **Uwierzytelnianie**: domyślnie wymagane. Bindy inne niż loopback wymagają uwierzytelniania gateway. W praktyce oznacza to współdzielony token/hasło albo reverse proxy świadome tożsamości z `gateway.auth.mode: "trusted-proxy"`. Kreator wdrażania domyślnie generuje token.
- Jeśli skonfigurowano jednocześnie `gateway.auth.token` i `gateway.auth.password` (w tym SecretRefs), ustaw jawnie `gateway.auth.mode` na `token` albo `password`. Uruchamianie oraz przepływy instalacji/naprawy usługi kończą się niepowodzeniem, gdy oba są skonfigurowane, a tryb nie jest ustawiony.
- `gateway.auth.mode: "none"`: jawny tryb bez uwierzytelniania. Używaj tylko w zaufanych konfiguracjach local loopback; celowo nie jest on oferowany w promptach wdrażania.
- `gateway.auth.mode: "trusted-proxy"`: deleguje uwierzytelnianie przeglądarki/użytkownika do reverse proxy świadomego tożsamości i ufa nagłówkom tożsamości z `gateway.trustedProxies` (zobacz [Uwierzytelnianie przez zaufany serwer proxy](/pl/gateway/trusted-proxy-auth)). Ten tryb domyślnie oczekuje źródła proxy **innego niż loopback**; reverse proxy loopback na tym samym hoście wymagają jawnego `gateway.auth.trustedProxy.allowLoopback = true`. Wewnętrzni wywołujący z tego samego hosta mogą używać `gateway.auth.password` jako lokalnego bezpośredniego fallbacku; `gateway.auth.token` pozostaje wzajemnie wykluczone z trybem trusted-proxy.
- `gateway.auth.allowTailscale`: gdy `true`, nagłówki tożsamości Tailscale Serve mogą spełnić uwierzytelnianie Control UI/WebSocket (weryfikowane przez `tailscale whois`). Endpointy API HTTP **nie** używają tego uwierzytelniania nagłówkiem Tailscale; zamiast tego stosują normalny tryb uwierzytelniania HTTP gateway. Ten przepływ bez tokenu zakłada, że host gateway jest zaufany. Domyślnie `true`, gdy `tailscale.mode = "serve"`.
- `gateway.auth.rateLimit`: opcjonalny limiter nieudanego uwierzytelniania. Stosowany per adres IP klienta i per zakres uwierzytelniania (współdzielony sekret i token urządzenia są śledzone niezależnie). Zablokowane próby zwracają `429` + `Retry-After`.
  - W asynchronicznej ścieżce Tailscale Serve Control UI nieudane próby dla tego samego `{scope, clientIp}` są serializowane przed zapisem niepowodzenia. Równoczesne błędne próby od tego samego klienta mogą więc uruchomić limiter przy drugim żądaniu, zamiast przejść równolegle jako zwykłe niezgodności.
  - `gateway.auth.rateLimit.exemptLoopback` domyślnie ma wartość `true`; ustaw `false`, gdy celowo chcesz limitować także ruch localhost (w konfiguracjach testowych lub restrykcyjnych wdrożeniach proxy).
- Próby uwierzytelniania WS z originu przeglądarki są zawsze throttlowane z wyłączonym wyjątkiem loopback (obrona warstwowa przed brute force localhost z poziomu przeglądarki).
- Na loopback te blokady z originu przeglądarki są izolowane per znormalizowana wartość `Origin`, więc powtarzające się niepowodzenia z jednego originu localhost nie blokują automatycznie innego originu.
- `tailscale.mode`: `serve` (tylko tailnet, bind loopback) lub `funnel` (publiczny, wymaga uwierzytelniania).
- `tailscale.serviceName`: opcjonalna nazwa Tailscale Service dla trybu Serve, taka jak `svc:openclaw`. Gdy jest ustawiona, OpenClaw przekazuje ją do `tailscale serve --service`, aby Control UI mogło być udostępnione przez nazwaną Service zamiast nazwy hosta urządzenia. Wartość musi używać formatu nazwy Service Tailscale `svc:<dns-label>`; podczas uruchamiania zgłaszany jest wynikowy adres URL Service.
- `tailscale.preserveFunnel`: gdy `true` i `tailscale.mode = "serve"`, OpenClaw sprawdza `tailscale funnel status` przed ponownym zastosowaniem Serve podczas uruchamiania i pomija to, jeśli zewnętrznie skonfigurowana trasa Funnel obejmuje już port gateway. Domyślnie `false`.
- `controlUi.allowedOrigins`: jawna allowlista originów przeglądarki dla połączeń Gateway WebSocket. Wymagana dla publicznych originów przeglądarki innych niż loopback. Prywatne ładowania UI z tego samego originu w LAN/Tailnet z loopback, RFC1918/link-local, `.local`, `.ts.net` lub hostów Tailscale CGNAT są akceptowane bez włączania fallbacku nagłówka Host.
- `controlUi.chatMessageMaxWidth`: opcjonalna maksymalna szerokość dla zgrupowanych wiadomości czatu Control UI. Akceptuje ograniczone wartości szerokości CSS, takie jak `960px`, `82%`, `min(1280px, 82%)` i `calc(100% - 2rem)`.
- `controlUi.dangerouslyAllowHostHeaderOriginFallback`: niebezpieczny tryb, który włącza fallback originu z nagłówka Host dla wdrożeń celowo polegających na polityce originu z nagłówka Host.
- `remote.transport`: `ssh` (domyślnie) lub `direct` (ws/wss). Dla `direct` wartość `remote.url` musi być `wss://` dla hostów publicznych; jawny tekst `ws://` jest akceptowany tylko dla loopback, LAN, link-local, `.local`, `.ts.net` i hostów Tailscale CGNAT.
- `remote.remotePort`: port gateway na zdalnym hoście SSH. Domyślnie `18789`; użyj tego, gdy lokalny port tunelu różni się od zdalnego portu gateway.
- `gateway.remote.token` / `.password` to pola poświadczeń klienta zdalnego. Same nie konfigurują uwierzytelniania gateway.
- `gateway.push.apns.relay.baseUrl`: bazowy adres URL HTTPS dla zewnętrznego przekaźnika APNs używanego po tym, jak kompilacje iOS oparte na przekaźniku opublikują rejestracje do gateway. Publiczne kompilacje App Store używają hostowanego przekaźnika OpenClaw. Niestandardowe adresy URL przekaźnika muszą odpowiadać celowo osobnej ścieżce kompilacji/wdrożenia iOS, której adres URL przekaźnika wskazuje na ten przekaźnik.
- `gateway.push.apns.relay.timeoutMs`: limit czasu wysyłki gateway-do-przekaźnika w milisekundach. Domyślnie `10000`.
- Rejestracje oparte na przekaźniku są delegowane do konkretnej tożsamości gateway. Sparowana aplikacja iOS pobiera `gateway.identity.get`, dołącza tę tożsamość do rejestracji przekaźnika i przekazuje do gateway uprawnienie wysyłania ograniczone zakresem rejestracji. Inny gateway nie może ponownie użyć tej zapisanej rejestracji.
- `OPENCLAW_APNS_RELAY_BASE_URL` / `OPENCLAW_APNS_RELAY_TIMEOUT_MS`: tymczasowe nadpisania env dla powyższej konfiguracji przekaźnika.
- `OPENCLAW_APNS_RELAY_ALLOW_HTTP=true`: wyjście awaryjne tylko do developmentu dla adresów URL przekaźnika HTTP loopback. Produkcyjne adresy URL przekaźnika powinny pozostać przy HTTPS.
- `gateway.handshakeTimeoutMs`: limit czasu uzgadniania Gateway WebSocket przed uwierzytelnieniem w milisekundach. Domyślnie: `15000`. `OPENCLAW_HANDSHAKE_TIMEOUT_MS` ma pierwszeństwo, gdy jest ustawione. Zwiększ tę wartość na obciążonych lub słabszych hostach, gdzie lokalni klienci mogą się połączyć, gdy rozgrzewanie po starcie wciąż się stabilizuje.
- `gateway.channelHealthCheckMinutes`: interwał monitora kondycji kanału w minutach. Ustaw `0`, aby globalnie wyłączyć restarty monitora kondycji. Domyślnie: `5`.
- `gateway.channelStaleEventThresholdMinutes`: próg przestarzałego gniazda w minutach. Utrzymuj tę wartość większą lub równą `gateway.channelHealthCheckMinutes`. Domyślnie: `30`.
- `gateway.channelMaxRestartsPerHour`: maksymalna liczba restartów monitora kondycji na kanał/konto w kroczącym oknie godziny. Domyślnie: `10`.
- `channels.<provider>.healthMonitor.enabled`: wyłączenie restartów monitora kondycji dla pojedynczego kanału przy zachowaniu włączonego monitora globalnego.
- `channels.<provider>.accounts.<accountId>.healthMonitor.enabled`: nadpisanie per konto dla kanałów wielokontowych. Gdy jest ustawione, ma pierwszeństwo przed nadpisaniem na poziomie kanału.
- Lokalne ścieżki wywołań gateway mogą używać `gateway.remote.*` jako fallbacku tylko wtedy, gdy `gateway.auth.*` nie jest ustawione.
- Jeśli `gateway.auth.token` / `gateway.auth.password` jest jawnie skonfigurowane przez SecretRef i nierozwiązane, rozwiązywanie kończy się fail-closed (bez maskowania przez fallback zdalny).
- `trustedProxies`: adresy IP reverse proxy, które terminują TLS lub wstrzykują nagłówki forwarded-client. Wymieniaj tylko proxy, które kontrolujesz. Wpisy loopback są nadal poprawne dla konfiguracji proxy/wykrywania lokalnego na tym samym hoście (na przykład Tailscale Serve lub lokalne reverse proxy), ale **nie** sprawiają, że żądania loopback kwalifikują się do `gateway.auth.mode: "trusted-proxy"`.
- `allowRealIpFallback`: gdy `true`, gateway akceptuje `X-Real-IP`, jeśli brakuje `X-Forwarded-For`. Domyślnie `false` dla zachowania fail-closed.
- `gateway.nodes.pairing.autoApproveCidrs`: opcjonalna allowlista CIDR/IP do automatycznego zatwierdzania pierwszego parowania urządzenia node bez żądanych zakresów. Jest wyłączona, gdy nie jest ustawiona. Nie zatwierdza automatycznie parowania operatora/przeglądarki/Control UI/WebChat ani nie zatwierdza automatycznie podwyższeń roli, zakresu, metadanych lub klucza publicznego.
- `gateway.nodes.allowCommands` / `gateway.nodes.denyCommands`: globalne kształtowanie allow/deny dla zadeklarowanych poleceń node po parowaniu i ocenie allowlisty platformy. Użyj `allowCommands`, aby włączyć niebezpieczne polecenia node, takie jak `camera.snap`, `camera.clip` i `screen.record`; `denyCommands` usuwa polecenie, nawet jeśli domyślna wartość platformy lub jawne zezwolenie w innym przypadku by je obejmowały. Po zmianie przez node zadeklarowanej listy poleceń odrzuć i ponownie zatwierdź parowanie tego urządzenia, aby gateway zapisał zaktualizowaną migawkę poleceń.
- `gateway.tools.deny`: dodatkowe nazwy narzędzi blokowane dla HTTP `POST /tools/invoke` (rozszerza domyślną listę deny).
- `gateway.tools.allow`: usuwa nazwy narzędzi z domyślnej listy deny HTTP dla wywołujących właściciel/admin. Nie podnosi wywołujących z tożsamością `operator.write` do dostępu właściciel/admin; `cron`, `gateway` i `nodes` pozostają niedostępne dla wywołujących innych niż właściciel nawet po dodaniu do allowlisty.

</Accordion>

### Endpointy zgodne z OpenAI

- Admin HTTP RPC: domyślnie wyłączone jako Plugin `admin-http-rpc`. Włącz Plugin, aby zarejestrować `POST /api/v1/admin/rpc`. Zobacz [Admin HTTP RPC](/pl/plugins/admin-http-rpc).
- Chat Completions: domyślnie wyłączone. Włącz za pomocą `gateway.http.endpoints.chatCompletions.enabled: true`.
- Responses API: `gateway.http.endpoints.responses.enabled`.
- Wzmocnienie wejścia URL w Responses:
  - `gateway.http.endpoints.responses.maxUrlParts`
  - `gateway.http.endpoints.responses.files.urlAllowlist`
  - `gateway.http.endpoints.responses.images.urlAllowlist`
    Puste allowlisty są traktowane jako nieustawione; użyj `gateway.http.endpoints.responses.files.allowUrl=false` i/lub `gateway.http.endpoints.responses.images.allowUrl=false`, aby wyłączyć pobieranie URL.
- Opcjonalny nagłówek wzmacniania odpowiedzi:
  - `gateway.http.securityHeaders.strictTransportSecurity` (ustawiaj tylko dla originów HTTPS, które kontrolujesz; zobacz [Uwierzytelnianie przez zaufany serwer proxy](/pl/gateway/trusted-proxy-auth#tls-termination-and-hsts))

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
- `autoGenerate`: automatycznie generuje lokalną parę samopodpisanego certyfikatu/klucza, gdy jawne pliki nie są skonfigurowane; tylko do użytku lokalnego/dev.
- `certPath`: ścieżka w systemie plików do pliku certyfikatu TLS.
- `keyPath`: ścieżka w systemie plików do pliku klucza prywatnego TLS; utrzymuj ograniczone uprawnienia.
- `caPath`: opcjonalna ścieżka pakietu CA do weryfikacji klienta lub niestandardowych łańcuchów zaufania.

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
  - `"off"`: ignoruj zmiany na żywo; zmiany wymagają jawnego ponownego uruchomienia.
  - `"restart"`: zawsze ponownie uruchamiaj proces Gateway przy zmianie konfiguracji.
  - `"hot"`: stosuj zmiany w procesie bez ponownego uruchamiania.
  - `"hybrid"` (domyślnie): najpierw spróbuj przeładowania na gorąco; w razie potrzeby wróć do ponownego uruchomienia.
- `debounceMs`: okno debounce w ms przed zastosowaniem zmian konfiguracji (nieujemna liczba całkowita).
- `deferralTimeoutMs`: opcjonalny maksymalny czas w ms oczekiwania na trwające operacje przed wymuszeniem ponownego uruchomienia lub przeładowania kanału na gorąco. Pomiń, aby użyć domyślnego ograniczonego oczekiwania (`300000`); ustaw `0`, aby czekać bezterminowo i okresowo rejestrować ostrzeżenia o nadal oczekujących operacjach.

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
- `hooks.token` powinien różnić się od aktywnego uwierzytelniania Gateway przez wspólny sekret (`gateway.auth.token` / `OPENCLAW_GATEWAY_TOKEN` albo `gateway.auth.password` / `OPENCLAW_GATEWAY_PASSWORD`); podczas startu rejestrowane jest niekrytyczne ostrzeżenie bezpieczeństwa, gdy zostanie wykryte ponowne użycie.
- `openclaw security audit` oznacza ponowne użycie uwierzytelniania hooka/Gateway jako ustalenie krytyczne, w tym uwierzytelnianie hasłem Gateway podane tylko w czasie audytu (`--auth password --password <password>`). Uruchom `openclaw doctor --fix`, aby obrócić utrwalony, ponownie użyty `hooks.token`, a następnie zaktualizuj zewnętrznych nadawców hooków, aby używali nowego tokenu hooka.
- `hooks.path` nie może być `/`; użyj dedykowanej podścieżki, takiej jak `/hooks`.
- Jeśli `hooks.allowRequestSessionKey=true`, ogranicz `hooks.allowedSessionKeyPrefixes` (na przykład `["hook:"]`).
- Jeśli mapowanie lub preset używa szablonowego `sessionKey`, ustaw `hooks.allowedSessionKeyPrefixes` oraz `hooks.allowRequestSessionKey=true`. Statyczne klucze mapowania nie wymagają takiej zgody.

**Endpointy:**

- `POST /hooks/wake` → `{ text, mode?: "now"|"next-heartbeat" }`
- `POST /hooks/agent` → `{ message, name?, agentId?, sessionKey?, wakeMode?, deliver?, channel?, to?, model?, thinking?, timeoutSeconds? }`
  - `sessionKey` z treści żądania jest akceptowany tylko wtedy, gdy `hooks.allowRequestSessionKey=true` (domyślnie: `false`).
- `POST /hooks/<name>` → rozwiązywane przez `hooks.mappings`
  - Wartości `sessionKey` mapowania renderowane z szablonu są traktowane jako dostarczone zewnętrznie i również wymagają `hooks.allowRequestSessionKey=true`.

<Accordion title="Mapping details">

- `match.path` dopasowuje podścieżkę po `/hooks` (np. `/hooks/gmail` → `gmail`).
- `match.source` dopasowuje pole payloadu dla ścieżek ogólnych.
- Szablony takie jak `{{messages[0].subject}}` czytają z payloadu.
- `transform` może wskazywać moduł JS/TS zwracający akcję hooka.
  - `transform.module` musi być ścieżką względną i pozostaje w obrębie `hooks.transformsDir` (ścieżki bezwzględne i przechodzenie po katalogach są odrzucane).
  - Trzymaj `hooks.transformsDir` pod `~/.openclaw/hooks/transforms`; katalogi Skills w obszarze roboczym są odrzucane. Jeśli `openclaw doctor` zgłasza tę ścieżkę jako nieprawidłową, przenieś moduł transformacji do katalogu transformacji hooków albo usuń `hooks.transformsDir`.
- `agentId` kieruje do określonego agenta; nieznane identyfikatory wracają do agenta domyślnego.
- `allowedAgentIds`: ogranicza efektywne trasowanie agentów, w tym ścieżkę agenta domyślnego, gdy `agentId` jest pominięte (`*` lub pominięte = zezwól na wszystkie, `[]` = odmów wszystkim).
- `defaultSessionKey`: opcjonalny stały klucz sesji dla uruchomień agenta hooka bez jawnego `sessionKey`.
- `allowRequestSessionKey`: zezwala wywołującym `/hooks/agent` oraz kluczom sesji mapowania sterowanym szablonem ustawiać `sessionKey` (domyślnie: `false`).
- `allowedSessionKeyPrefixes`: opcjonalna lista dozwolonych prefiksów dla jawnych wartości `sessionKey` (żądanie + mapowanie), np. `["hook:"]`. Staje się wymagana, gdy jakiekolwiek mapowanie lub preset używa szablonowego `sessionKey`.
- `deliver: true` wysyła końcową odpowiedź do kanału; `channel` domyślnie przyjmuje `last`.
- `model` nadpisuje LLM dla tego uruchomienia hooka (musi być dozwolony, jeśli katalog modeli jest ustawiony).

</Accordion>

### Integracja z Gmail

- Wbudowany preset Gmail używa `sessionKey: "hook:gmail:{{messages[0].id}}"`.
- Jeśli zachowujesz to trasowanie dla każdej wiadomości, ustaw `hooks.allowRequestSessionKey: true` i ogranicz `hooks.allowedSessionKeyPrefixes`, aby pasowało do przestrzeni nazw Gmail, na przykład `["hook:", "hook:gmail:"]`.
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

## Host Pluginu Canvas

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
- Powiązania inne niż loopback: trasy canvas wymagają uwierzytelniania Gateway (token/hasło/zaufane proxy), tak jak inne powierzchnie HTTP Gateway.
- Widoki WebView Node zwykle nie wysyłają nagłówków uwierzytelniania; po sparowaniu i połączeniu węzła Gateway ogłasza adresy URL uprawnień o zakresie węzła do dostępu canvas/A2UI.
- Adresy URL uprawnień są powiązane z aktywną sesją WS węzła i szybko wygasają. Awaryjny mechanizm oparty na IP nie jest używany.
- Wstrzykuje klienta przeładowania na żywo do serwowanego HTML.
- Automatycznie tworzy startowy `index.html`, gdy katalog jest pusty.
- Serwuje również A2UI pod `/__openclaw__/a2ui/`.
- Zmiany wymagają ponownego uruchomienia Gateway.
- Wyłącz przeładowanie na żywo dla dużych katalogów lub błędów `EMFILE`.

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

- `minimal` (domyślnie, gdy włączony jest dołączony Plugin `bonjour`): pomiń `cliPath` + `sshPort` z rekordów TXT.
- `full`: uwzględnij `cliPath` + `sshPort`; rozgłaszanie multicast w sieci LAN nadal wymaga włączenia dołączonego Pluginu `bonjour`.
- `off`: wycisz rozgłaszanie multicast w sieci LAN bez zmiany włączenia Pluginu.
- Dołączony Plugin `bonjour` uruchamia się automatycznie na hostach macOS i jest opcjonalny na Linux, Windows oraz w skonteneryzowanych wdrożeniach Gateway.
- Nazwa hosta domyślnie przyjmuje nazwę hosta systemu, gdy jest ona prawidłową etykietą DNS, w przeciwnym razie wraca do `openclaw`. Nadpisz za pomocą `OPENCLAW_MDNS_HOSTNAME`.

### Szeroki obszar (DNS-SD)

```json5
{
  discovery: {
    wideArea: { enabled: true },
  },
}
```

Zapisuje strefę unicast DNS-SD w `~/.openclaw/dns/`. Do wykrywania między sieciami połącz to z serwerem DNS (zalecany CoreDNS) + Tailscale split DNS.

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
- Zobacz [Środowisko](/pl/help/environment), aby poznać pełną kolejność pierwszeństwa.

### Podstawianie zmiennych środowiskowych

Odwołuj się do zmiennych środowiskowych w dowolnym ciągu konfiguracji za pomocą `${VAR_NAME}`:

```json5
{
  gateway: {
    auth: { token: "${OPENCLAW_GATEWAY_TOKEN}" },
  },
}
```

- Dopasowywane są tylko nazwy zapisane wielkimi literami: `[A-Z_][A-Z0-9_]*`.
- Brakujące/puste zmienne powodują błąd podczas wczytywania konfiguracji.
- Użyj `$${VAR}`, aby uzyskać literał `${VAR}`.
- Działa z `$include`.

---

## Sekrety

Odwołania do sekretów są addytywne: wartości w postaci zwykłego tekstu nadal działają.

### `SecretRef`

Użyj jednego kształtu obiektu:

```json5
{ source: "env" | "file" | "exec", provider: "default", id: "..." }
```

Walidacja:

- Wzorzec `provider`: `^[a-z][a-z0-9_-]{0,63}$`
- Wzorzec id dla `source: "env"`: `^[A-Z][A-Z0-9_]{0,127}$`
- id dla `source: "file"`: bezwzględny wskaźnik JSON (na przykład `"/providers/openai/apiKey"`)
- Wzorzec id dla `source: "exec"`: `^[A-Za-z0-9][A-Za-z0-9._:/#-]{0,255}$` (obsługuje selektory w stylu AWS `secret#json_key`)
- Identyfikatory `source: "exec"` nie mogą zawierać segmentów ścieżki rozdzielanych ukośnikiem `.` ani `..` (na przykład `a/../b` jest odrzucane)

### Obsługiwana powierzchnia poświadczeń

- Macierz kanoniczna: [SecretRef Credential Surface](/pl/reference/secretref-credential-surface)
- `secrets apply` kieruje na obsługiwane ścieżki poświadczeń w `openclaw.json`.
- Odwołania `auth-profiles.json` są uwzględniane w rozwiązywaniu w czasie działania i zakresie audytu.

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
- Ścieżki dostawców file i exec kończą się odmową, gdy weryfikacja Windows ACL jest niedostępna. Ustaw `allowInsecurePath: true` tylko dla zaufanych ścieżek, których nie można zweryfikować.
- Dostawca `exec` wymaga bezwzględnej ścieżki `command` i używa ładunków protokołu na stdin/stdout.
- Domyślnie ścieżki poleceń będące dowiązaniami symbolicznymi są odrzucane. Ustaw `allowSymlinkCommand: true`, aby zezwolić na ścieżki będące dowiązaniami symbolicznymi przy jednoczesnej walidacji rozwiązanej ścieżki docelowej.
- Jeśli skonfigurowano `trustedDirs`, sprawdzenie zaufanego katalogu dotyczy rozwiązanej ścieżki docelowej.
- Środowisko procesu potomnego `exec` jest domyślnie minimalne; przekaż wymagane zmienne jawnie za pomocą `passEnv`.
- Odwołania do sekretów są rozwiązywane podczas aktywacji do migawki w pamięci, a następnie ścieżki żądań odczytują tylko tę migawkę.
- Filtrowanie aktywnej powierzchni jest stosowane podczas aktywacji: nierozwiązane odwołania na włączonych powierzchniach powodują niepowodzenie uruchomienia/przeładowania, natomiast nieaktywne powierzchnie są pomijane z diagnostyką.

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
- `auth-profiles.json` obsługuje referencje na poziomie wartości (`keyRef` dla `api_key`, `tokenRef` dla `token`) w statycznych trybach poświadczeń.
- Starsze płaskie mapy `auth-profiles.json`, takie jak `{ "provider": { "apiKey": "..." } }`, nie są formatem runtime; `openclaw doctor --fix` przepisuje je na kanoniczne profile klucza API `provider:default` z kopią zapasową `.legacy-flat.*.bak`.
- Profile w trybie OAuth (`auth.profiles.<id>.mode = "oauth"`) nie obsługują poświadczeń profilu uwierzytelniania opartych na SecretRef.
- Statyczne poświadczenia runtime pochodzą z rozstrzygniętych migawek w pamięci; starsze statyczne wpisy `auth.json` są czyszczone po wykryciu.
- Starsze importy OAuth pochodzą z `~/.openclaw/credentials/oauth.json`.
- Zobacz [OAuth](/pl/concepts/oauth).
- Zachowanie runtime sekretów oraz narzędzia `audit/configure/apply`: [Zarządzanie sekretami](/pl/gateway/secrets).

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

- `billingBackoffHours`: podstawowy czas wycofania w godzinach, gdy profil zawiedzie z powodu rzeczywistych błędów rozliczeń lub niewystarczających środków (domyślnie: `5`). Jawny tekst dotyczący rozliczeń nadal może trafić tutaj nawet przy odpowiedziach `401`/`403`, ale dopasowania tekstu specyficzne dla dostawcy pozostają ograniczone do dostawcy, który je posiada (na przykład OpenRouter `Key limit exceeded`). Ponawialne komunikaty HTTP `402` dotyczące okna użycia lub limitu wydatków organizacji/przestrzeni roboczej pozostają zamiast tego w ścieżce `rate_limit`.
- `billingBackoffHoursByProvider`: opcjonalne nadpisania godzin wycofania rozliczeń dla poszczególnych dostawców.
- `billingMaxHours`: limit w godzinach dla wykładniczego wzrostu wycofania rozliczeń (domyślnie: `24`).
- `authPermanentBackoffMinutes`: podstawowy czas wycofania w minutach dla niepowodzeń `auth_permanent` o wysokiej pewności (domyślnie: `10`).
- `authPermanentMaxMinutes`: limit w minutach dla wzrostu wycofania `auth_permanent` (domyślnie: `60`).
- `failureWindowHours`: kroczące okno w godzinach używane dla liczników wycofania (domyślnie: `24`).
- `overloadedProfileRotations`: maksymalna liczba rotacji profili uwierzytelniania tego samego dostawcy dla błędów przeciążenia przed przełączeniem na zastępczy model (domyślnie: `1`). Kształty oznaczające zajętość dostawcy, takie jak `ModelNotReadyException`, trafiają tutaj.
- `overloadedBackoffMs`: stałe opóźnienie przed ponowieniem rotacji przeciążonego dostawcy/profilu (domyślnie: `0`).
- `rateLimitedProfileRotations`: maksymalna liczba rotacji profili uwierzytelniania tego samego dostawcy dla błędów limitu szybkości przed przełączeniem na zastępczy model (domyślnie: `1`). Ten koszyk limitów szybkości obejmuje teksty w kształcie dostawcy, takie jak `Too many concurrent requests`, `ThrottlingException`, `concurrency limit reached`, `workers_ai ... quota limit exceeded` i `resource exhausted`.

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
- `maxFileBytes`: maksymalny rozmiar aktywnego pliku dziennika w bajtach przed rotacją (dodatnia liczba całkowita; domyślnie: `104857600` = 100 MB). OpenClaw przechowuje do pięciu numerowanych archiwów obok aktywnego pliku.
- `redactSensitive` / `redactPatterns`: maskowanie typu best-effort dla wyjścia konsoli, dzienników plikowych, rekordów dziennika OTLP i utrwalonego tekstu transkrypcji sesji. `redactSensitive: "off"` wyłącza tylko tę ogólną politykę dzienników/transkrypcji; powierzchnie bezpieczeństwa UI/narzędzi/diagnostyki nadal redagują sekrety przed emisją.

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
- `stuckSessionWarnMs`: próg wieku bez postępu w ms do klasyfikowania długotrwałych sesji przetwarzania jako `session.long_running`, `session.stalled` lub `session.stuck`. Odpowiedź, narzędzie, status, blok i postęp ACP resetują licznik czasu; powtarzające się diagnostyki `session.stuck` wycofują się, gdy stan pozostaje bez zmian.
- `stuckSessionAbortMs`: próg wieku bez postępu w ms, po którym kwalifikująca się zablokowana aktywna praca może zostać przerwana i opróżniona w celu odzyskania. Gdy nie ustawiono, OpenClaw używa bezpieczniejszego, rozszerzonego okna uruchomienia osadzonego wynoszącego co najmniej 5 minut i 3x `stuckSessionWarnMs`.
- `memoryPressureSnapshot`: przechwytuje zredagowaną migawkę stabilności sprzed OOM, gdy presja pamięci osiągnie poziom `critical` (domyślnie: `false`). Ustaw na `true`, aby dodać skan/zapis pliku pakietu stabilności przy zachowaniu normalnych zdarzeń presji pamięci.
- `otel.enabled`: włącza potok eksportu OpenTelemetry (domyślnie: `false`). Pełną konfigurację, katalog sygnałów i model prywatności znajdziesz w [Eksport OpenTelemetry](/pl/gateway/opentelemetry).
- `otel.endpoint`: URL kolektora dla eksportu OTel.
- `otel.tracesEndpoint` / `otel.metricsEndpoint` / `otel.logsEndpoint`: opcjonalne punkty końcowe OTLP specyficzne dla sygnałów. Po ustawieniu nadpisują `otel.endpoint` tylko dla danego sygnału.
- `otel.protocol`: `"http/protobuf"` (domyślnie) lub `"grpc"`.
- `otel.headers`: dodatkowe nagłówki metadanych HTTP/gRPC wysyłane z żądaniami eksportu OTel.
- `otel.serviceName`: nazwa usługi dla atrybutów zasobu.
- `otel.traces` / `otel.metrics` / `otel.logs`: włącz eksport śladów, metryk lub dzienników.
- `otel.logsExporter`: ujście eksportu dzienników: `"otlp"` (domyślnie), `"stdout"` dla jednego obiektu JSON na linię stdout lub `"both"`.
- `otel.sampleRate`: współczynnik próbkowania śladów `0`-`1`.
- `otel.flushIntervalMs`: okresowy interwał opróżniania telemetrii w ms.
- `otel.captureContent`: opcjonalne przechwytywanie surowej treści dla atrybutów span OTEL. Domyślnie wyłączone. Wartość logiczna `true` przechwytuje niesystemową treść wiadomości/narzędzi; forma obiektowa pozwala jawnie włączyć `inputMessages`, `outputMessages`, `toolInputs`, `toolOutputs`, `systemPrompt` i `toolDefinitions`.
- `OTEL_SEMCONV_STABILITY_OPT_IN=gen_ai_latest_experimental`: przełącznik środowiskowy dla najnowszego eksperymentalnego kształtu span wnioskowania GenAI, w tym nazw span `{gen_ai.operation.name} {gen_ai.request.model}`, rodzaju span `CLIENT` i `gen_ai.provider.name` zamiast starszego `gen_ai.system`. Domyślnie spany zachowują `openclaw.model.call` i `gen_ai.system` dla zgodności; metryki GenAI używają ograniczonych atrybutów semantycznych.
- `OPENCLAW_OTEL_PRELOADED=1`: przełącznik środowiskowy dla hostów, które już zarejestrowały globalny SDK OpenTelemetry. OpenClaw pomija wtedy uruchamianie/zamykanie SDK należące do Pluginu, zachowując aktywne listenery diagnostyczne.
- `OTEL_EXPORTER_OTLP_TRACES_ENDPOINT`, `OTEL_EXPORTER_OTLP_METRICS_ENDPOINT` i `OTEL_EXPORTER_OTLP_LOGS_ENDPOINT`: zmienne środowiskowe punktów końcowych specyficzne dla sygnałów, używane, gdy odpowiadający klucz konfiguracji nie jest ustawiony.
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
- `checkOnStart`: sprawdzaj aktualizacje npm przy starcie gateway (domyślnie: `true`).
- `auto.enabled`: włącz automatyczną aktualizację w tle dla instalacji pakietów (domyślnie: `false`).
- `auto.stableDelayHours`: minimalne opóźnienie w godzinach przed automatycznym zastosowaniem kanału stable (domyślnie: `6`; maks.: `168`).
- `auto.stableJitterHours`: dodatkowe okno rozproszenia wdrożenia kanału stable w godzinach (domyślnie: `12`; maks.: `168`).
- `auto.betaCheckIntervalHours`: jak często wykonywane są sprawdzenia kanału beta w godzinach (domyślnie: `1`; maks.: `24`).

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

- `enabled`: globalna bramka funkcji ACP (domyślnie: `true`; ustaw `false`, aby ukryć dispatch ACP i możliwości spawn).
- `dispatch.enabled`: niezależna bramka dla dispatch tur sesji ACP (domyślnie: `true`). Ustaw `false`, aby zachować dostępność poleceń ACP, blokując wykonywanie.
- `backend`: domyślny identyfikator backendu runtime ACP (musi pasować do zarejestrowanego Pluginu runtime ACP).
  Najpierw zainstaluj Plugin backendu, a jeśli ustawiono `plugins.allow`, uwzględnij identyfikator Pluginu backendu (na przykład `acpx`), inaczej backend ACP się nie załaduje.
- `defaultAgent`: zastępczy identyfikator agenta docelowego ACP, gdy spawny nie określają jawnego celu.
- `allowedAgents`: lista dozwolonych identyfikatorów agentów dopuszczonych do sesji runtime ACP; pusta oznacza brak dodatkowych ograniczeń.
- `maxConcurrentSessions`: maksymalna liczba jednocześnie aktywnych sesji ACP.
- `stream.coalesceIdleMs`: okno opróżniania przy bezczynności w ms dla strumieniowanego tekstu.
- `stream.maxChunkChars`: maksymalny rozmiar fragmentu przed podziałem projekcji strumieniowanego bloku.
- `stream.repeatSuppression`: tłum powtarzające się linie statusu/narzędzi na turę (domyślnie: `true`).
- `stream.deliveryMode`: `"live"` strumieniuje przyrostowo; `"final_only"` buforuje do zdarzeń końcowych tury.
- `stream.hiddenBoundarySeparator`: separator przed widocznym tekstem po ukrytych zdarzeniach narzędzi (domyślnie: `"paragraph"`).
- `stream.maxOutputChars`: maksymalna liczba znaków wyjścia asystenta projektowana na turę ACP.
- `stream.maxSessionUpdateChars`: maksymalna liczba znaków dla projektowanych linii statusu/aktualizacji ACP.
- `stream.tagVisibility`: rekord nazw tagów do logicznych nadpisań widoczności dla strumieniowanych zdarzeń.
- `runtime.ttlMinutes`: TTL bezczynności w minutach dla workerów sesji ACP przed kwalifikującym się czyszczeniem.
- `runtime.installCommand`: opcjonalne polecenie instalacji uruchamiane podczas bootstrapowania środowiska runtime ACP.

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
  - `"random"` (domyślnie): rotujące zabawne/sezonowe slogany.
  - `"default"`: stały neutralny slogan (`All your chats, one OpenClaw.`).
  - `"off"`: brak tekstu sloganu (tytuł/wersja banera nadal są wyświetlane).
- Aby ukryć cały baner (nie tylko slogany), ustaw env `OPENCLAW_HIDE_BANNER=1`.

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

## Most (starszy, usunięty)

Bieżące kompilacje nie zawierają już mostu TCP. Node’y łączą się przez Gateway WebSocket. Klucze `bridge.*` nie są już częścią schematu konfiguracji (walidacja nie powiedzie się, dopóki nie zostaną usunięte; `openclaw doctor --fix` może usunąć nieznane klucze).

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

- `sessionRetention`: jak długo zachowywać ukończone izolowane sesje uruchomień Cron przed usunięciem z `sessions.json`. Steruje też czyszczeniem zarchiwizowanych transkrypcji usuniętych zadań Cron. Domyślnie: `24h`; ustaw `false`, aby wyłączyć.
- `runLog.maxBytes`: akceptowane dla zgodności ze starszymi dziennikami uruchomień Cron opartymi na plikach. Domyślnie: `2_000_000` bajtów.
- `runLog.keepLines`: najnowsze wiersze historii uruchomień SQLite zachowywane dla każdego zadania. Domyślnie: `2000`.
- `webhookToken`: token bearer używany do dostarczania POST przez Cron Webhook (`delivery.mode = "webhook"`); jeśli zostanie pominięty, nagłówek autoryzacji nie jest wysyłany.
- `webhook`: przestarzały zapasowy URL Webhook starszego typu (http/https), używany przez `openclaw doctor --fix` do migracji zapisanych zadań, które nadal mają `notify: true`; dostarczanie w czasie działania używa `delivery.mode="webhook"` dla zadania oraz `delivery.to`, albo `delivery.completionDestination` przy zachowywaniu dostarczania ogłoszeń.

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

- `maxAttempts`: maksymalna liczba ponowień zadań Cron przy błędach przejściowych (domyślnie: `3`; zakres: `0`-`10`).
- `backoffMs`: tablica opóźnień wycofywania w ms dla każdej próby ponowienia (domyślnie: `[30000, 60000, 300000]`; 1-10 wpisów).
- `retryOn`: typy błędów wyzwalające ponowienia - `"rate_limit"`, `"overloaded"`, `"network"`, `"timeout"`, `"server_error"`. Pomiń, aby ponawiać wszystkie typy przejściowe.

Zadania jednorazowe pozostają włączone do wyczerpania prób ponowienia, a następnie są wyłączane z zachowaniem końcowego stanu błędu. Zadania cykliczne używają tej samej polityki ponawiania błędów przejściowych, aby uruchomić się ponownie po wycofaniu przed następnym zaplanowanym oknem; błędy trwałe albo wyczerpane ponowienia błędów przejściowych wracają do normalnego harmonogramu cyklicznego z wycofaniem po błędzie.

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

- `enabled`: włącza alerty o niepowodzeniach dla zadań Cron (domyślnie: `false`).
- `after`: liczba kolejnych niepowodzeń przed wyzwoleniem alertu (dodatnia liczba całkowita, min: `1`).
- `cooldownMs`: minimalna liczba milisekund między powtarzanymi alertami dla tego samego zadania (nieujemna liczba całkowita).
- `includeSkipped`: zalicza kolejne pominięte uruchomienia do progu alertu (domyślnie: `false`). Pominięte uruchomienia są śledzone osobno i nie wpływają na wycofywanie po błędach wykonania.
- `mode`: tryb dostarczania - `"announce"` wysyła przez wiadomość kanału; `"webhook"` publikuje do skonfigurowanego Webhook.
- `accountId`: opcjonalne konto lub identyfikator kanału ograniczający zakres dostarczania alertów.

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

- Domyślne miejsce docelowe powiadomień o niepowodzeniach Cron we wszystkich zadaniach.
- `mode`: `"announce"` albo `"webhook"`; domyślnie `"announce"`, gdy istnieje wystarczająca ilość danych celu.
- `channel`: nadpisanie kanału dla dostarczania ogłoszeń. `"last"` ponownie używa ostatniego znanego kanału dostarczania.
- `to`: jawny cel ogłoszenia albo URL Webhook. Wymagane dla trybu Webhook.
- `accountId`: opcjonalne nadpisanie konta dla dostarczania.
- `delivery.failureDestination` dla zadania nadpisuje tę globalną wartość domyślną.
- Gdy nie ustawiono ani globalnego, ani zadaniowego miejsca docelowego niepowodzeń, zadania, które już dostarczają przez `announce`, w razie niepowodzenia wracają do tego podstawowego celu ogłoszeń.
- `delivery.failureDestination` jest obsługiwane tylko dla zadań `sessionTarget="isolated"`, chyba że podstawowy `delivery.mode` zadania to `"webhook"`.

Zobacz [Zadania Cron](/pl/automation/cron-jobs). Izolowane wykonania Cron są śledzone jako [zadania w tle](/pl/automation/tasks).

---

## Zmienne szablonu modelu mediów

Symbole zastępcze szablonu rozwijane w `tools.media.models[].args`:

| Zmienna            | Opis                                              |
| ------------------ | ------------------------------------------------- |
| `{{Body}}`         | Pełna treść wiadomości przychodzącej              |
| `{{RawBody}}`      | Surowa treść (bez opakowań historii/nadawcy)      |
| `{{BodyStripped}}` | Treść z usuniętymi wzmiankami grupowymi           |
| `{{From}}`         | Identyfikator nadawcy                             |
| `{{To}}`           | Identyfikator miejsca docelowego                  |
| `{{MessageSid}}`   | Identyfikator wiadomości kanału                   |
| `{{SessionId}}`    | UUID bieżącej sesji                               |
| `{{IsNewSession}}` | `"true"`, gdy utworzono nową sesję                |
| `{{MediaUrl}}`     | Pseudo-URL przychodzących mediów                  |
| `{{MediaPath}}`    | Lokalna ścieżka mediów                            |
| `{{MediaType}}`    | Typ mediów (obraz/audio/dokument/…)               |
| `{{Transcript}}`   | Transkrypcja audio                                |
| `{{Prompt}}`       | Rozwiązany prompt mediów dla wpisów CLI           |
| `{{MaxChars}}`     | Rozwiązana maksymalna liczba znaków wyjściowych dla wpisów CLI |
| `{{ChatType}}`     | `"direct"` albo `"group"`                         |
| `{{GroupSubject}}` | Temat grupy (najlepsza możliwa próba)             |
| `{{GroupMembers}}` | Podgląd członków grupy (najlepsza możliwa próba)  |
| `{{SenderName}}`   | Wyświetlana nazwa nadawcy (najlepsza możliwa próba) |
| `{{SenderE164}}`   | Numer telefonu nadawcy (najlepsza możliwa próba)  |
| `{{Provider}}`     | Wskazówka dostawcy (whatsapp, telegram, discord itd.) |

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

- Pojedynczy plik: zastępuje obiekt zawierający.
- Tablica plików: scalana głęboko w kolejności (późniejsze nadpisują wcześniejsze).
- Klucze równorzędne: scalane po dołączeniach (nadpisują dołączone wartości).
- Zagnieżdżone dołączenia: do 10 poziomów głębokości.
- Ścieżki: rozwiązywane względem pliku dołączającego, ale muszą pozostać wewnątrz katalogu konfiguracji najwyższego poziomu (`dirname` pliku `openclaw.json`). Formy bezwzględne/`../` są dozwolone tylko wtedy, gdy nadal rozwiązują się wewnątrz tej granicy. Ścieżki nie mogą zawierać bajtów null i muszą mieć ściśle mniej niż 4096 znaków przed rozwiązaniem i po nim.
- Zapisy własne OpenClaw, które zmieniają tylko jedną sekcję najwyższego poziomu opartą na dołączeniu pojedynczego pliku, zapisują do tego dołączonego pliku. Na przykład `plugins install` aktualizuje `plugins: { $include: "./plugins.json5" }` w `plugins.json5` i pozostawia `openclaw.json` bez zmian.
- Dołączenia główne, tablice dołączeń i dołączenia z nadpisaniami równorzędnymi są tylko do odczytu dla zapisów własnych OpenClaw; takie zapisy kończą się zamkniętym niepowodzeniem zamiast spłaszczać konfigurację.
- Błędy: jasne komunikaty dla brakujących plików, błędów parsowania, cyklicznych dołączeń, nieprawidłowego formatu ścieżki i nadmiernej długości.

---

_Powiązane: [Konfiguracja](/pl/gateway/configuration) · [Przykłady konfiguracji](/pl/gateway/configuration-examples) · [Doctor](/pl/gateway/doctor)_

## Powiązane

- [Konfiguracja](/pl/gateway/configuration)
- [Przykłady konfiguracji](/pl/gateway/configuration-examples)
