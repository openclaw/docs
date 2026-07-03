---
read_when:
    - Potrzebujesz dokładnej semantyki konfiguracji lub wartości domyślnych na poziomie pól
    - Walidujesz bloki konfiguracji kanału, modelu, Gateway lub narzędzia
summary: Dokumentacja referencyjna konfiguracji Gateway dla podstawowych kluczy OpenClaw, wartości domyślnych oraz linków do dedykowanych dokumentacji referencyjnych podsystemów
title: Dokumentacja konfiguracji
x-i18n:
    generated_at: "2026-07-03T23:44:45Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 1365e40b17122e9a029e294baf12db2dd974b3c2686ed1f2e9cf2a46757fa356
    source_path: gateway/configuration-reference.md
    workflow: 16
---

Dokumentacja referencyjna podstawowej konfiguracji dla `~/.openclaw/openclaw.json`. Przegląd zorientowany na zadania znajdziesz w [Konfiguracja](/pl/gateway/configuration).

Obejmuje główne powierzchnie konfiguracji OpenClaw i odsyła dalej, gdy podsystem ma własną, głębszą dokumentację referencyjną. Katalogi poleceń należące do kanałów i Pluginów oraz szczegółowe ustawienia pamięci/QMD znajdują się na własnych stronach, a nie na tej.

Źródło prawdy w kodzie:

- `openclaw config schema` wypisuje aktualny schemat JSON używany do walidacji i Control UI, z dołączonymi metadanymi pakietów/Pluginów/kanałów, gdy są dostępne
- `config.schema.lookup` zwraca jeden węzeł schematu ograniczony do ścieżki dla narzędzi drążenia szczegółów
- `pnpm config:docs:check` / `pnpm config:docs:gen` walidują bazowy hash dokumentacji konfiguracji względem bieżącej powierzchni schematu

Ścieżka wyszukiwania agenta: użyj akcji narzędzia `gateway` `config.schema.lookup`, aby przed edycją uzyskać dokładną dokumentację i ograniczenia na poziomie pól. Użyj
[Konfiguracja](/pl/gateway/configuration) jako wskazówek zorientowanych na zadania, a tej strony
jako szerszej mapy pól, wartości domyślnych i linków do dokumentacji referencyjnej podsystemów.

Dedykowane szczegółowe dokumentacje referencyjne:

- [Dokumentacja referencyjna konfiguracji pamięci](/pl/reference/memory-config) dla `agents.defaults.memorySearch.*`, `memory.qmd.*`, `memory.citations` oraz konfiguracji dreaming pod `plugins.entries.memory-core.config.dreaming`
- [Polecenia ukośnikiem](/pl/tools/slash-commands) dla bieżącego wbudowanego + pakietowego katalogu poleceń
- strony kanałów/Pluginów będących właścicielami dla powierzchni poleceń specyficznych dla kanałów

Format konfiguracji to **JSON5** (dozwolone komentarze i przecinki końcowe). Wszystkie pola są opcjonalne - OpenClaw używa bezpiecznych wartości domyślnych, gdy są pominięte.

---

## Kanały

Klucze konfiguracji poszczególnych kanałów przeniesiono na dedykowaną stronę - zobacz
[Konfiguracja - kanały](/pl/gateway/config-channels) dla `channels.*`,
w tym Slack, Discord, Telegram, WhatsApp, Matrix, iMessage oraz innych
pakietowych kanałów (uwierzytelnianie, kontrola dostępu, wiele kont, bramkowanie wzmianek).

## Domyślne ustawienia agenta, wielu agentów, sesje i wiadomości

Przeniesiono na dedykowaną stronę - zobacz
[Konfiguracja - agenci](/pl/gateway/config-agents) dla:

- `agents.defaults.*` (workspace, model, myślenie, heartbeat, pamięć, media, skills, sandbox)
- `multiAgent.*` (routing i powiązania wieloagentowe)
- `session.*` (cykl życia sesji, compaction, przycinanie)
- `messages.*` (dostarczanie wiadomości, TTS, renderowanie markdown)
- `talk.*` (tryb Talk)
  - `talk.consultThinkingLevel`: nadpisanie poziomu myślenia dla pełnego przebiegu agenta OpenClaw stojącego za konsultacjami realtime Control UI Talk
  - `talk.consultFastMode`: jednorazowe nadpisanie trybu szybkiego dla konsultacji realtime Control UI Talk
  - `talk.speechLocale`: opcjonalny identyfikator lokalizacji BCP 47 dla rozpoznawania mowy Talk na iOS/macOS
  - `talk.silenceTimeoutMs`: gdy nieustawione, Talk zachowuje domyślne okno pauzy platformy przed wysłaniem transkryptu (`700 ms on macOS and Android, 900 ms on iOS`)
  - `talk.realtime.consultRouting`: awaryjne przekazanie przez Gateway dla sfinalizowanych transkryptów realtime Talk, które pomijają `openclaw_agent_consult`

## Narzędzia i niestandardowi dostawcy

Zasady narzędzi, eksperymentalne przełączniki, konfiguracja narzędzi wspieranych przez dostawców oraz konfiguracja niestandardowych dostawców / bazowych adresów URL zostały przeniesione na dedykowaną stronę - zobacz
[Konfiguracja - narzędzia i niestandardowi dostawcy](/pl/gateway/config-tools).

## Modele

Definicje dostawców, listy dozwolonych modeli i konfiguracja niestandardowych dostawców znajdują się w
[Konfiguracja - narzędzia i niestandardowi dostawcy](/pl/gateway/config-tools#custom-providers-and-base-urls).
Katalog główny `models` jest też właścicielem globalnego zachowania katalogu modeli.

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
- `models.providers.*.localService`: opcjonalny menedżer procesów na żądanie dla
  lokalnych serwerów modeli. OpenClaw sprawdza skonfigurowany endpoint kondycji, uruchamia
  bezwzględne `command`, gdy jest potrzebne, czeka na gotowość, a następnie wysyła żądanie modelu.
  Zobacz [Lokalne usługi modeli](/pl/gateway/local-model-services).
- `models.pricing.enabled`: kontroluje bootstrap cenowy w tle, który
  uruchamia się po tym, jak procesy sidecar i kanały dotrą do ścieżki gotowości Gateway. Gdy `false`,
  Gateway pomija pobieranie katalogów cen OpenRouter i LiteLLM; skonfigurowane
  wartości `models.providers.*.models[].cost` nadal działają dla lokalnych szacunków kosztów.

## MCP

Definicje serwerów MCP zarządzanych przez OpenClaw znajdują się pod `mcp.servers` i są
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

- `mcp.servers`: nazwane definicje serwerów MCP stdio lub zdalnych dla runtime, które
  udostępniają skonfigurowane narzędzia MCP.
  Wpisy zdalne używają `transport: "streamable-http"` albo `transport: "sse"`;
  `type: "http"` to natywny dla CLI alias, który `openclaw mcp set` i
  `openclaw doctor --fix` normalizują do kanonicznego pola `transport`.
- `mcp.servers.<name>.enabled`: ustaw `false`, aby zachować zapisaną definicję serwera,
  wykluczając ją jednocześnie z odkrywania MCP osadzonego OpenClaw i projekcji narzędzi.
- `mcp.servers.<name>.timeout` / `requestTimeoutMs`: limit czasu żądania MCP dla serwera,
  w sekundach lub milisekundach.
- `mcp.servers.<name>.connectTimeout` / `connectionTimeoutMs`: limit czasu połączenia dla serwera,
  w sekundach lub milisekundach.
- `mcp.servers.<name>.supportsParallelToolCalls`: opcjonalna wskazówka współbieżności dla
  adapterów, które mogą wybrać, czy wykonywać równoległe wywołania narzędzi MCP.
- `mcp.servers.<name>.auth`: ustaw `"oauth"` dla serwerów HTTP MCP, które wymagają
  OAuth. Uruchom `openclaw mcp login <name>`, aby zapisać tokeny w stanie OpenClaw.
- `mcp.servers.<name>.oauth`: opcjonalne nadpisania zakresu OAuth, adresu URL przekierowania i adresu URL metadanych klienta.
- `mcp.servers.<name>.sslVerify`, `clientCert`, `clientKey`: kontrolki HTTP TLS
  dla prywatnych endpointów i wzajemnego TLS.
- `mcp.servers.<name>.toolFilter`: opcjonalny wybór narzędzi dla serwera. `include`
  ogranicza odkryte narzędzia MCP do pasujących nazw; `exclude` ukrywa pasujące
  nazwy. Wpisy to dokładne nazwy narzędzi MCP albo proste globs `*`. Serwery z
  zasobami lub promptami generują też nazwy narzędzi pomocniczych (`resources_list`,
  `resources_read`, `prompts_list`, `prompts_get`), a te nazwy używają
  tego samego filtra.
- `mcp.servers.<name>.codex`: opcjonalne kontrolki projekcji app-server Codex.
  Ten blok to metadane OpenClaw tylko dla wątków app-server Codex; nie wpływa na
  sesje ACP, ogólną konfigurację harness Codex ani inne adaptery runtime.
  Niepuste `codex.agents` ogranicza serwer do wymienionych identyfikatorów agentów OpenClaw.
  Puste, puste tekstowo lub nieprawidłowe listy agentów o ograniczonym zakresie są odrzucane przez walidację konfiguracji
  i pomijane przez ścieżkę projekcji runtime, zamiast stawać się globalne.
  `codex.defaultToolsApprovalMode` emituje natywne dla Codex
  `default_tools_approval_mode` dla tego serwera. OpenClaw usuwa blok `codex`
  przed przekazaniem natywnej konfiguracji `mcp_servers` do Codex. Pomiń ten blok, aby
  zachować projekcję serwera dla każdego agenta app-server Codex z domyślnym
  zachowaniem zatwierdzania MCP Codex.
- `mcp.sessionIdleTtlMs`: bezczynny TTL dla sesyjnych, pakietowych runtime MCP.
  Jednorazowe osadzone przebiegi proszą o sprzątanie po zakończeniu przebiegu; ten TTL jest zabezpieczeniem dla
  długowiecznych sesji i przyszłych wywołujących.
- Zmiany pod `mcp.*` są stosowane na gorąco przez zwolnienie buforowanych sesyjnych runtime MCP.
  Następne odkrycie/użycie narzędzia odtwarza je z nowej konfiguracji, więc usunięte
  wpisy `mcp.servers` są sprzątane natychmiast zamiast czekać na bezczynny TTL.
- Odkrywanie runtime uwzględnia też powiadomienia o zmianie listy narzędzi MCP przez porzucenie
  buforowanego katalogu dla tej sesji. Serwery, które reklamują zasoby lub
  prompty, otrzymują narzędzia pomocnicze do wyświetlania/odczytu zasobów oraz wyświetlania/pobierania
  promptów. Powtarzające się niepowodzenia wywołań narzędzi krótko pauzują dotknięty serwer przed
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

- `allowBundled`: opcjonalna lista dozwolonych tylko dla pakietowych Skills (zarządzane/workspace Skills bez zmian).
- `load.extraDirs`: dodatkowe współdzielone katalogi główne skills (najniższy priorytet).
- `load.allowSymlinkTargets`: zaufane rzeczywiste katalogi główne celów, do których symlinki skill mogą
  się rozwiązywać, gdy link znajduje się poza skonfigurowanym źródłowym katalogiem głównym.
- `workshop.allowSymlinkTargetWrites`: pozwala Skill Workshop apply pisać
  przez już zaufane cele symlinków (domyślnie: false).
- `install.preferBrew`: gdy true, preferuj instalatory Homebrew, gdy `brew` jest
  dostępne, przed przejściem do innych rodzajów instalatorów.
- `install.nodeManager`: preferencja instalatora node dla specyfikacji `metadata.openclaw.install`
  (`npm` | `pnpm` | `yarn` | `bun`).
- `install.allowUploadedArchives`: zezwala zaufanym klientom Gateway `operator.admin`
  instalować prywatne archiwa zip przygotowane przez `skills.upload.*`
  (domyślnie: false). Włącza to tylko ścieżkę przesłanych archiwów; zwykłe instalacje ClawHub
  jej nie wymagają.
- `entries.<skillKey>.enabled: false` wyłącza skill, nawet jeśli jest pakietowy/zainstalowany.
- `entries.<skillKey>.apiKey`: udogodnienie dla skills deklarujących podstawową zmienną env (jawny ciąg tekstowy albo obiekt SecretRef).

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

- Ładowane z katalogów pakietów lub pakietów wbudowanych pod `~/.openclaw/extensions` i `<workspace>/.openclaw/extensions`, plus pliki lub katalogi wymienione w `plugins.load.paths`.
- Samodzielne pliki pluginów umieszczaj w `plugins.load.paths`; automatycznie wykrywane katalogi główne rozszerzeń ignorują pliki `.js`, `.mjs` i `.ts` najwyższego poziomu, aby skrypty pomocnicze w tych katalogach nie blokowały uruchamiania.
- Wykrywanie akceptuje natywne pluginy OpenClaw oraz zgodne pakiety Codex i pakiety Claude, w tym bezmanifestowe pakiety Claude w domyślnym układzie.
- **Zmiany konfiguracji wymagają restartu gatewaya.**
- `allow`: opcjonalna lista dozwolonych (ładują się tylko wymienione pluginy). `deny` ma pierwszeństwo.
- `plugins.entries.<id>.apiKey`: wygodne pole klucza API na poziomie pluginu (gdy jest obsługiwane przez plugin).
- `plugins.entries.<id>.env`: mapa zmiennych środowiskowych o zakresie pluginu.
- `plugins.entries.<id>.hooks.allowPromptInjection`: gdy `false`, rdzeń blokuje `before_prompt_build` i ignoruje pola modyfikujące prompt ze starszego `before_agent_start`, zachowując jednocześnie starsze `modelOverride` i `providerOverride`. Dotyczy natywnych hooków pluginów i obsługiwanych katalogów hooków dostarczanych przez pakiety.
- `plugins.entries.<id>.hooks.allowConversationAccess`: gdy `true`, zaufane niewbudowane pluginy mogą odczytywać surową treść konwersacji z typowanych hooków, takich jak `llm_input`, `llm_output`, `before_model_resolve`, `before_agent_reply`, `before_agent_run`, `before_agent_finalize` i `agent_end`.
- `plugins.entries.<id>.subagent.allowModelOverride`: wyraźnie zaufaj temu pluginowi, aby mógł żądać nadpisań `provider` i `model` dla pojedynczych uruchomień subagentów w tle.
- `plugins.entries.<id>.subagent.allowedModels`: opcjonalna lista dozwolonych kanonicznych celów `provider/model` dla zaufanych nadpisań subagentów. Użyj `"*"` tylko wtedy, gdy celowo chcesz zezwolić na dowolny model.
- `plugins.entries.<id>.llm.allowModelOverride`: wyraźnie zaufaj temu pluginowi, aby mógł żądać nadpisań modelu dla `api.runtime.llm.complete`.
- `plugins.entries.<id>.llm.allowedModels`: opcjonalna lista dozwolonych kanonicznych celów `provider/model` dla zaufanych nadpisań uzupełniania LLM przez plugin. Użyj `"*"` tylko wtedy, gdy celowo chcesz zezwolić na dowolny model.
- `plugins.entries.<id>.llm.allowAgentIdOverride`: wyraźnie zaufaj temu pluginowi, aby mógł uruchamiać `api.runtime.llm.complete` dla niedomyślnego identyfikatora agenta.
- `plugins.entries.<id>.config`: obiekt konfiguracji zdefiniowany przez plugin (walidowany przez schemat natywnego pluginu OpenClaw, gdy jest dostępny).
- Ustawienia konta/czasu wykonania pluginu kanału znajdują się pod `channels.<id>` i powinny być opisane przez metadane `channelConfigs` w manifeście pluginu właściciela, a nie przez centralny rejestr opcji OpenClaw.

### Konfiguracja pluginu harness Codex

Wbudowany plugin `codex` jest właścicielem natywnych ustawień harnessa serwera aplikacji Codex pod
`plugins.entries.codex.config`. Pełną powierzchnię konfiguracji znajdziesz w
[odniesieniu harnessa Codex](/pl/plugins/codex-harness-reference), a model czasu wykonania w [harnessie Codex](/pl/plugins/codex-harness).

`codexPlugins` ma zastosowanie tylko do sesji, które wybierają natywny harness Codex.
Nie włącza pluginów Codex dla uruchomień dostawcy OpenClaw, powiązań konwersacji ACP
ani żadnego harnessa innego niż Codex.

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
  pluginów/aplikacji Codex dla harnessa Codex. Domyślnie: `false`.
- `plugins.entries.codex.config.codexPlugins.allow_destructive_actions`:
  domyślna polityka działań destrukcyjnych dla zmigrowanych wywołań aplikacji pluginów.
  Użyj `true`, aby akceptować bezpieczne schematy zatwierdzania Codex bez pytania, `false`,
  aby je odrzucać, `"auto"`, aby kierować wymagane przez Codex zatwierdzenia przez zatwierdzenia
  pluginów OpenClaw, albo `"ask"`, aby pytać o każdą akcję zapisu/destrukcyjną pluginu
  bez trwałego zatwierdzenia. Tryb `"ask"` czyści trwałe nadpisania zatwierdzeń Codex
  dla poszczególnych narzędzi w danej aplikacji i wybiera recenzenta ludzkich
  zatwierdzeń dla tej aplikacji przed uruchomieniem wątku Codex.
  Domyślnie: `true`.
- `plugins.entries.codex.config.codexPlugins.plugins.<key>.enabled`: włącza
  zmigrowany wpis pluginu, gdy globalne `codexPlugins.enabled` również ma wartość true.
  Domyślnie: `true` dla jawnych wpisów.
- `plugins.entries.codex.config.codexPlugins.plugins.<key>.marketplaceName`:
  stabilna tożsamość marketplace. V1 obsługuje tylko `"openai-curated"`.
- `plugins.entries.codex.config.codexPlugins.plugins.<key>.pluginName`: stabilna
  tożsamość pluginu Codex z migracji, na przykład `"google-calendar"`.
- `plugins.entries.codex.config.codexPlugins.plugins.<key>.allow_destructive_actions`:
  nadpisanie działań destrukcyjnych dla danego pluginu. Gdy pominięte, używana jest globalna
  wartość `allow_destructive_actions`. Wartość na poziomie pluginu akceptuje te same
  polityki `true`, `false`, `"auto"` lub `"ask"`.

Każda dopuszczona aplikacja pluginu, która używa `"ask"`, kieruje żądania zatwierdzeń tej aplikacji
do ludzkiego recenzenta. Inne aplikacje i zatwierdzenia wątków niebędących aplikacjami zachowują
skonfigurowanego recenzenta, więc mieszane polityki pluginów nie dziedziczą zachowania `"ask"`.

`codexPlugins.enabled` to globalna dyrektywa włączenia. Jawne wpisy pluginów
zapisane przez migrację są trwałym zestawem uprawnień do instalacji i naprawy.
`plugins["*"]` nie jest obsługiwane, nie ma przełącznika `install`, a lokalne
wartości `marketplacePath` celowo nie są polami konfiguracji, ponieważ są
zależne od hosta.

Kontrole gotowości `app/list` są buforowane przez jedną godzinę i odświeżane
asynchronicznie, gdy stają się nieaktualne. Konfiguracja aplikacji wątku Codex jest obliczana przy ustanawianiu sesji harnessa Codex,
a nie przy każdym przebiegu; po zmianie natywnej konfiguracji pluginu użyj `/new`, `/reset` albo zrestartuj Gateway.

- `plugins.entries.firecrawl.config.webFetch`: ustawienia dostawcy web-fetch Firecrawl.
  - `apiKey`: opcjonalny klucz API Firecrawl dla wyższych limitów (akceptuje SecretRef). W razie braku używa `plugins.entries.firecrawl.config.webSearch.apiKey`, starszego `tools.web.fetch.firecrawl.apiKey` albo zmiennej środowiskowej `FIRECRAWL_API_KEY`.
  - `baseUrl`: bazowy URL API Firecrawl (domyślnie: `https://api.firecrawl.dev`; nadpisania self-hosted muszą wskazywać prywatne/wewnętrzne endpointy).
  - `onlyMainContent`: wyodrębniaj tylko główną treść ze stron (domyślnie: `true`).
  - `maxAgeMs`: maksymalny wiek cache w milisekundach (domyślnie: `172800000` / 2 dni).
  - `timeoutSeconds`: limit czasu żądania scrape w sekundach (domyślnie: `60`).
- `plugins.entries.xai.config.xSearch`: ustawienia xAI X Search (wyszukiwanie web Grok).
  - `enabled`: włącz dostawcę X Search.
  - `model`: model Grok używany do wyszukiwania (np. `"grok-4-1-fast"`).
- `plugins.entries.memory-core.config.dreaming`: ustawienia memory dreaming. Zobacz [Dreaming](/pl/concepts/dreaming), aby poznać fazy i progi.
  - `enabled`: główny przełącznik dreaming (domyślnie `false`).
  - `frequency`: kadencja cron dla każdego pełnego przebiegu dreaming (`"0 3 * * *"` domyślnie).
  - `model`: opcjonalne nadpisanie modelu subagenta Dream Diary. Wymaga `plugins.entries.memory-core.subagent.allowModelOverride: true`; sparuj z `allowedModels`, aby ograniczyć cele. Błędy niedostępności modelu ponawiają próbę raz z domyślnym modelem sesji; błędy zaufania lub listy dozwolonych nie przechodzą po cichu do wartości zastępczej.
  - polityka faz i progi są szczegółami implementacyjnymi (nie są kluczami konfiguracji widocznymi dla użytkownika).
- Pełna konfiguracja pamięci znajduje się w [odniesieniu konfiguracji pamięci](/pl/reference/memory-config):
  - `agents.defaults.memorySearch.*`
  - `memory.backend`
  - `memory.citations`
  - `memory.qmd.*`
  - `plugins.entries.memory-core.config.dreaming`
- Włączone pluginy pakietów Claude mogą też dostarczać osadzone domyślne ustawienia OpenClaw z `settings.json`; OpenClaw stosuje je jako oczyszczone ustawienia agenta, a nie jako surowe poprawki konfiguracji OpenClaw.
- `plugins.slots.memory`: wybierz identyfikator aktywnego pluginu pamięci albo `"none"`, aby wyłączyć pluginy pamięci.
- `plugins.slots.contextEngine`: wybierz identyfikator aktywnego pluginu silnika kontekstu; domyślnie `"legacy"`, chyba że zainstalujesz i wybierzesz inny silnik.

Zobacz [Pluginy](/pl/tools/plugin).

---

## Zobowiązania

`commitments` kontroluje wywnioskowaną pamięć działań następczych: OpenClaw może wykrywać check-iny z przebiegów konwersacji i dostarczać je przez przebiegi heartbeat.

- `commitments.enabled`: włącz ukrytą ekstrakcję LLM, przechowywanie i dostarczanie przez heartbeat wywnioskowanych zobowiązań działań następczych. Domyślnie: `false`.
- `commitments.maxPerDay`: maksymalna liczba wywnioskowanych zobowiązań działań następczych dostarczanych na sesję agenta w ruchomym dniu. Domyślnie: `3`.

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
  sesja przekroczy swój limit. Ustaw `idleMinutes: 0` lub `maxTabsPerSession: 0`, aby
  wyłączyć te poszczególne tryby czyszczenia.
- `ssrfPolicy.dangerouslyAllowPrivateNetwork` jest wyłączone, gdy nie jest ustawione, więc nawigacja przeglądarki domyślnie pozostaje restrykcyjna.
- Ustaw `ssrfPolicy.dangerouslyAllowPrivateNetwork: true` tylko wtedy, gdy celowo ufasz nawigacji przeglądarki w sieci prywatnej.
- W trybie ścisłym zdalne punkty końcowe profili CDP (`profiles.*.cdpUrl`) podlegają temu samemu blokowaniu sieci prywatnej podczas sprawdzania osiągalności/wykrywania.
- `ssrfPolicy.allowPrivateNetwork` pozostaje obsługiwane jako starszy alias.
- W trybie ścisłym używaj `ssrfPolicy.hostnameAllowlist` i `ssrfPolicy.allowedHostnames` do jawnych wyjątków.
- Profile zdalne działają tylko w trybie dołączania (start/stop/reset wyłączone).
- `profiles.*.cdpUrl` akceptuje `http://`, `https://`, `ws://` i `wss://`.
  Użyj HTTP(S), gdy chcesz, aby OpenClaw wykrył `/json/version`; użyj WS(S),
  gdy dostawca podaje bezpośredni URL WebSocket DevTools.
- `remoteCdpTimeoutMs` i `remoteCdpHandshakeTimeoutMs` dotyczą zdalnej oraz
  `attachOnly` osiągalności CDP, a także żądań otwierania kart. Zarządzane profile
  loopback zachowują lokalne wartości domyślne CDP.
- Jeśli zewnętrznie zarządzana usługa CDP jest osiągalna przez loopback, ustaw dla tego
  profilu `attachOnly: true`; w przeciwnym razie OpenClaw potraktuje port loopback jako
  lokalny zarządzany profil przeglądarki i może zgłaszać błędy własności portu lokalnego.
- Profile `existing-session` używają Chrome MCP zamiast CDP i mogą dołączać na
  wybranym hoście albo przez połączony węzeł przeglądarki.
- Profile `existing-session` mogą ustawić `userDataDir`, aby wskazać konkretny
  profil przeglądarki opartej na Chromium, taki jak Brave lub Edge.
- Profile `existing-session` mogą ustawić `cdpUrl`, gdy Chrome już działa
  za punktem końcowym wykrywania DevTools HTTP(S) albo bezpośrednim punktem końcowym WS(S). W tym
  trybie OpenClaw przekazuje punkt końcowy do Chrome MCP zamiast używać automatycznego połączenia;
  `userDataDir` jest ignorowane dla argumentów uruchomienia Chrome MCP.
- Profile `existing-session` zachowują bieżące ograniczenia trasy Chrome MCP:
  akcje oparte na migawkach/ref zamiast celowania selektorami CSS, hooki przesyłania jednego pliku,
  brak nadpisań limitu czasu dialogów, brak `wait --load networkidle` oraz brak
  `responsebody`, eksportu PDF, przechwytywania pobrań ani akcji wsadowych.
- Lokalne zarządzane profile `openclaw` automatycznie przypisują `cdpPort` i `cdpUrl`; ustaw
  `cdpUrl` jawnie tylko dla zdalnych profili CDP lub dołączania punktu końcowego istniejącej sesji.
- Lokalne zarządzane profile mogą ustawić `executablePath`, aby nadpisać globalne
  `browser.executablePath` dla tego profilu. Użyj tego, aby uruchomić jeden profil w
  Chrome, a drugi w Brave.
- Lokalne zarządzane profile używają `browser.localLaunchTimeoutMs` do wykrywania HTTP Chrome CDP
  po uruchomieniu procesu oraz `browser.localCdpReadyTimeoutMs` do
  gotowości websocket CDP po uruchomieniu. Zwiększ je na wolniejszych hostach, gdzie Chrome
  uruchamia się poprawnie, ale sprawdzenia gotowości ścigają się ze startem. Obie wartości muszą być
  dodatnimi liczbami całkowitymi do `120000` ms; nieprawidłowe wartości konfiguracji są odrzucane.
- Kolejność automatycznego wykrywania: domyślna przeglądarka, jeśli oparta na Chromium → Chrome → Brave → Edge → Chromium → Chrome Canary.
- `browser.executablePath` i `browser.profiles.<name>.executablePath` akceptują zarówno
  `~`, jak i `~/...` dla katalogu domowego systemu operacyjnego przed uruchomieniem Chromium.
  `userDataDir` dla profilu w profilach `existing-session` również rozwija tyldę.
- Usługa sterowania: tylko loopback (port wyprowadzany z `gateway.port`, domyślnie `18791`).
- `extraArgs` dołącza dodatkowe flagi uruchomieniowe do lokalnego startu Chromium (na przykład
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

- `seamColor`: kolor akcentu dla obramowania interfejsu natywnej aplikacji (odcień dymku Talk Mode itd.).
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

<Accordion title="Szczegóły pól Gateway">

- `mode`: `local` (uruchom Gateway) lub `remote` (połącz ze zdalnym Gateway). Gateway odmawia uruchomienia, chyba że ustawiono `local`.
- `port`: pojedynczy multipleksowany port dla WS + HTTP. Priorytet: `--port` > `OPENCLAW_GATEWAY_PORT` > `gateway.port` > `18789`.
- `bind`: `auto`, `loopback` (domyślnie), `lan` (`0.0.0.0`), `tailnet` (tylko adres IP Tailscale) lub `custom`.
- **Starsze aliasy bind**: używaj wartości trybu bind w `gateway.bind` (`auto`, `loopback`, `lan`, `tailnet`, `custom`), nie aliasów hosta (`0.0.0.0`, `127.0.0.1`, `localhost`, `::`, `::1`).
- **Uwaga dotycząca Docker**: domyślne powiązanie `loopback` nasłuchuje na `127.0.0.1` wewnątrz kontenera. Przy sieci mostkowej Docker (`-p 18789:18789`) ruch przychodzi przez `eth0`, więc Gateway jest nieosiągalny. Użyj `--network host` albo ustaw `bind: "lan"` (lub `bind: "custom"` z `customBindHost: "0.0.0.0"`), aby nasłuchiwać na wszystkich interfejsach.
- **Uwierzytelnianie**: domyślnie wymagane. Powiązania inne niż loopback wymagają uwierzytelniania Gateway. W praktyce oznacza to współdzielony token/hasło albo reverse proxy rozpoznające tożsamość z `gateway.auth.mode: "trusted-proxy"`. Kreator wdrożenia domyślnie generuje token.
- Jeśli skonfigurowano zarówno `gateway.auth.token`, jak i `gateway.auth.password` (w tym SecretRefs), ustaw jawnie `gateway.auth.mode` na `token` albo `password`. Uruchamianie oraz przepływy instalacji/naprawy usługi kończą się błędem, gdy oba są skonfigurowane, a tryb nie jest ustawiony.
- `gateway.auth.mode: "none"`: jawny tryb bez uwierzytelniania. Używaj tylko w zaufanych konfiguracjach local loopback; celowo nie jest oferowany przez monity wdrożenia.
- `gateway.auth.mode: "trusted-proxy"`: deleguje uwierzytelnianie przeglądarki/użytkownika do reverse proxy rozpoznającego tożsamość i ufa nagłówkom tożsamości z `gateway.trustedProxies` (zobacz [Uwierzytelnianie przez zaufane proxy](/pl/gateway/trusted-proxy-auth)). Ten tryb domyślnie oczekuje źródła proxy **innego niż loopback**; odwrotne proxy loopback na tym samym hoście wymagają jawnego `gateway.auth.trustedProxy.allowLoopback = true`. Wewnętrzni wywołujący z tego samego hosta mogą użyć `gateway.auth.password` jako lokalnego bezpośredniego fallbacku; `gateway.auth.token` pozostaje wzajemnie wykluczone z trybem trusted-proxy.
- `gateway.auth.allowTailscale`: gdy `true`, nagłówki tożsamości Tailscale Serve mogą spełnić uwierzytelnianie Control UI/WebSocket (weryfikowane przez `tailscale whois`). Punkty końcowe HTTP API **nie** używają tego uwierzytelniania z nagłówka Tailscale; zamiast tego podążają za normalnym trybem uwierzytelniania HTTP Gateway. Ten bez-tokenowy przepływ zakłada, że host Gateway jest zaufany. Domyślnie `true`, gdy `tailscale.mode = "serve"`.
- `gateway.auth.rateLimit`: opcjonalny limiter nieudanych uwierzytelnień. Stosowany per adres IP klienta i per zakres uwierzytelniania (shared-secret i device-token są śledzone niezależnie). Zablokowane próby zwracają `429` + `Retry-After`.
  - Na asynchronicznej ścieżce Tailscale Serve Control UI nieudane próby dla tego samego `{scope, clientIp}` są serializowane przed zapisem błędu. Równoczesne błędne próby od tego samego klienta mogą więc uruchomić limiter przy drugim żądaniu, zamiast obu przejść równolegle jako zwykłe niezgodności.
  - `gateway.auth.rateLimit.exemptLoopback` domyślnie ma wartość `true`; ustaw `false`, gdy celowo chcesz ograniczać tempo także ruchu localhost (dla konfiguracji testowych lub rygorystycznych wdrożeń proxy).
- Próby uwierzytelniania WS z originu przeglądarki są zawsze ograniczane, z wyłączonym zwolnieniem dla loopback (obrona warstwowa przed brute force localhost z przeglądarki).
- Na loopback te blokady originu przeglądarki są izolowane per znormalizowana wartość `Origin`, więc powtarzające się niepowodzenia z jednego originu localhost nie blokują automatycznie innego originu.
- `tailscale.mode`: `serve` (tylko tailnet, bind loopback) lub `funnel` (publiczny, wymaga uwierzytelniania).
- `tailscale.serviceName`: opcjonalna nazwa usługi Tailscale dla trybu Serve, taka jak `svc:openclaw`. Gdy jest ustawiona, OpenClaw przekazuje ją do `tailscale serve
--service`, aby Control UI można było wystawić przez nazwaną usługę zamiast nazwy hosta urządzenia. Wartość musi używać formatu nazwy usługi Tailscale `svc:<dns-label>`; uruchamianie zgłasza wyprowadzony URL usługi.
- `tailscale.preserveFunnel`: gdy `true` i `tailscale.mode = "serve"`, OpenClaw sprawdza `tailscale funnel status` przed ponownym zastosowaniem Serve przy uruchamianiu i pomija je, jeśli zewnętrznie skonfigurowana trasa Funnel już obejmuje port Gateway. Domyślnie `false`.
- `controlUi.allowedOrigins`: jawna lista dozwolonych originów przeglądarki dla połączeń Gateway WebSocket. Wymagana dla publicznych originów przeglądarki innych niż loopback. Prywatne ładowania UI z tego samego originu w LAN/Tailnet z hostów loopback, RFC1918/link-local, `.local`, `.ts.net` lub Tailscale CGNAT są akceptowane bez włączania fallbacku nagłówka Host.
- `controlUi.chatMessageMaxWidth`: opcjonalna maksymalna szerokość dla grupowanych wiadomości czatu Control UI. Akceptuje ograniczone wartości szerokości CSS, takie jak `960px`, `82%`, `min(1280px, 82%)` i `calc(100% - 2rem)`.
- `controlUi.dangerouslyAllowHostHeaderOriginFallback`: niebezpieczny tryb, który włącza fallback originu z nagłówka Host dla wdrożeń celowo polegających na polityce originu z nagłówka Host.
- `remote.transport`: `ssh` (domyślnie) lub `direct` (ws/wss). Dla `direct` `remote.url` musi być `wss://` dla hostów publicznych; tekst jawny `ws://` jest akceptowany tylko dla loopback, LAN, link-local, `.local`, `.ts.net` i hostów Tailscale CGNAT.
- `remote.remotePort`: port Gateway na zdalnym hoście SSH. Domyślnie `18789`; użyj tego, gdy lokalny port tunelu różni się od zdalnego portu Gateway.
- `remote.sshHostKeyPolicy`: polityka klucza hosta tunelu SSH w macOS. `strict` jest domyślne i wymaga już zaufanego klucza. `openssh` to jawne włączenie efektywnej konfiguracji OpenSSH dla zarządzanych aliasów; przed użyciem przejrzyj pasujące ustawienia SSH użytkownika i systemu. Aplikacja macOS i `configure-remote` resetują tę politykę do `strict` przy zmianie celów, chyba że zostanie ponownie jawnie włączona.
- `gateway.remote.token` / `.password` to pola poświadczeń zdalnego klienta. Same nie konfigurują uwierzytelniania Gateway.
- `gateway.push.apns.relay.baseUrl`: bazowy URL HTTPS dla zewnętrznego przekaźnika APNs używanego po tym, jak kompilacje iOS wspierane przekaźnikiem opublikują rejestracje do Gateway. Publiczne kompilacje App Store używają hostowanego przekaźnika OpenClaw. Niestandardowe URL-e przekaźnika muszą odpowiadać celowo oddzielnej ścieżce kompilacji/wdrożenia iOS, której URL przekaźnika wskazuje na ten przekaźnik.
- `gateway.push.apns.relay.timeoutMs`: limit czasu wysyłki z Gateway do przekaźnika w milisekundach. Domyślnie `10000`.
- Rejestracje wspierane przekaźnikiem są delegowane do konkretnej tożsamości Gateway. Sparowana aplikacja iOS pobiera `gateway.identity.get`, dołącza tę tożsamość do rejestracji przekaźnika i przekazuje do Gateway grant wysyłki ograniczony do rejestracji. Inny Gateway nie może ponownie użyć tej zapisanej rejestracji.
- `OPENCLAW_APNS_RELAY_BASE_URL` / `OPENCLAW_APNS_RELAY_TIMEOUT_MS`: tymczasowe nadpisania zmiennych środowiskowych dla powyższej konfiguracji przekaźnika.
- `OPENCLAW_APNS_RELAY_ALLOW_HTTP=true`: wyjście awaryjne tylko deweloperskie dla URL-i przekaźnika HTTP loopback. Produkcyjne URL-e przekaźnika powinny pozostać na HTTPS.
- `gateway.handshakeTimeoutMs`: limit czasu uzgadniania Gateway WebSocket przed uwierzytelnieniem, w milisekundach. Domyślnie: `15000`. `OPENCLAW_HANDSHAKE_TIMEOUT_MS` ma pierwszeństwo, gdy jest ustawione. Zwiększ tę wartość na obciążonych lub słabszych hostach, gdzie lokalni klienci mogą połączyć się, gdy rozgrzewka uruchamiania jeszcze się stabilizuje.
- `gateway.channelHealthCheckMinutes`: interwał monitora kondycji kanałów w minutach. Ustaw `0`, aby globalnie wyłączyć restarty monitora kondycji. Domyślnie: `5`.
- `gateway.channelStaleEventThresholdMinutes`: próg nieaktualnego gniazda w minutach. Utrzymuj go większy lub równy `gateway.channelHealthCheckMinutes`. Domyślnie: `30`.
- `gateway.channelMaxRestartsPerHour`: maksymalna liczba restartów monitora kondycji per kanał/konto w kroczącym oknie jednej godziny. Domyślnie: `10`.
- `channels.<provider>.healthMonitor.enabled`: rezygnacja per kanał z restartów monitora kondycji przy zachowaniu włączonego globalnego monitora.
- `channels.<provider>.accounts.<accountId>.healthMonitor.enabled`: nadpisanie per konto dla kanałów wielokontowych. Gdy jest ustawione, ma pierwszeństwo przed nadpisaniem na poziomie kanału.
- Lokalne ścieżki wywołań Gateway mogą używać `gateway.remote.*` jako fallbacku tylko wtedy, gdy `gateway.auth.*` nie jest ustawione.
- Jeśli `gateway.auth.token` / `gateway.auth.password` jest jawnie skonfigurowane przez SecretRef i nierozwiązane, rozwiązywanie kończy się w trybie zamkniętym (bez maskowania przez zdalny fallback).
- `trustedProxies`: adresy IP reverse proxy, które kończą TLS lub wstrzykują nagłówki przekazanego klienta. Wymieniaj tylko proxy, które kontrolujesz. Wpisy loopback nadal są prawidłowe dla konfiguracji proxy/wykrywania lokalnego na tym samym hoście (na przykład Tailscale Serve lub lokalne reverse proxy), ale **nie** czynią żądań loopback kwalifikującymi się do `gateway.auth.mode: "trusted-proxy"`.
- `allowRealIpFallback`: gdy `true`, Gateway akceptuje `X-Real-IP`, jeśli brakuje `X-Forwarded-For`. Domyślnie `false` dla zachowania fail-closed.
- `gateway.nodes.pairing.autoApproveCidrs`: opcjonalna lista dozwolonych CIDR/IP do automatycznego zatwierdzania pierwszego parowania urządzenia węzła bez żądanych zakresów. Jest wyłączona, gdy nie jest ustawiona. Nie zatwierdza automatycznie parowania operatora/przeglądarki/Control UI/WebChat i nie zatwierdza automatycznie roli, zakresu, metadanych ani aktualizacji klucza publicznego.
- `gateway.nodes.allowCommands` / `gateway.nodes.denyCommands`: globalne kształtowanie allow/deny dla zadeklarowanych poleceń węzłów po sparowaniu i ocenie listy dozwolonych platformy. Użyj `allowCommands`, aby włączyć niebezpieczne polecenia węzłów, takie jak `camera.snap`, `camera.clip` i `screen.record`; `denyCommands` usuwa polecenie, nawet jeśli domyślna wartość platformy lub jawne zezwolenie inaczej by je obejmowały. Po zmianie przez węzeł zadeklarowanej listy poleceń odrzuć i ponownie zatwierdź parowanie tego urządzenia, aby Gateway zapisał zaktualizowaną migawkę poleceń.
- `gateway.tools.deny`: dodatkowe nazwy narzędzi blokowane dla HTTP `POST /tools/invoke` (rozszerza domyślną listę odmów).
- `gateway.tools.allow`: usuwa nazwy narzędzi z domyślnej listy odmów HTTP dla wywołujących właściciela/administratora. Nie podnosi wywołujących z tożsamością `operator.write` do dostępu właściciela/administratora; `cron`, `gateway` i `nodes` pozostają niedostępne dla wywołujących niebędących właścicielami, nawet gdy są na liście dozwolonych.

</Accordion>

### Punkty końcowe zgodne z OpenAI

- Administracyjne HTTP RPC: domyślnie wyłączone jako Plugin `admin-http-rpc`. Włącz Plugin, aby zarejestrować `POST /api/v1/admin/rpc`. Zobacz [Administracyjne HTTP RPC](/pl/plugins/admin-http-rpc).
- Uzupełnienia czatu: domyślnie wyłączone. Włącz przez `gateway.http.endpoints.chatCompletions.enabled: true`.
- API Responses: `gateway.http.endpoints.responses.enabled`.
- Wzmocnienie wejścia URL dla Responses:
  - `gateway.http.endpoints.responses.maxUrlParts`
  - `gateway.http.endpoints.responses.files.urlAllowlist`
  - `gateway.http.endpoints.responses.images.urlAllowlist`
    Puste listy dozwolone są traktowane jako nieustawione; użyj `gateway.http.endpoints.responses.files.allowUrl=false`
    i/lub `gateway.http.endpoints.responses.images.allowUrl=false`, aby wyłączyć pobieranie URL-i.
- Opcjonalny nagłówek wzmacniający odpowiedź:
  - `gateway.http.securityHeaders.strictTransportSecurity` (ustawiaj tylko dla originów HTTPS, które kontrolujesz; zobacz [Uwierzytelnianie przez zaufane proxy](/pl/gateway/trusted-proxy-auth#tls-termination-and-hsts))

### Izolacja wielu instancji

Uruchom wiele Gateway na jednym hoście z unikalnymi portami i katalogami stanu:

```bash
OPENCLAW_CONFIG_PATH=~/.openclaw/a.json \
OPENCLAW_STATE_DIR=~/.openclaw-a \
openclaw gateway --port 19001
```

Wygodne flagi: `--dev` (używa `~/.openclaw-dev` + portu `19001`), `--profile <name>` (używa `~/.openclaw-<name>`).

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
- `autoGenerate`: automatycznie generuje lokalną parę samopodpisanego certyfikatu/klucza, gdy jawne pliki nie są skonfigurowane; tylko do użytku lokalnego/deweloperskiego.
- `certPath`: ścieżka w systemie plików do pliku certyfikatu TLS.
- `keyPath`: ścieżka w systemie plików do pliku klucza prywatnego TLS; zachowaj ograniczone uprawnienia.
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
  - `"off"`: ignoruje zmiany na żywo; zmiany wymagają jawnego restartu.
  - `"restart"`: zawsze restartuje proces Gateway po zmianie konfiguracji.
  - `"hot"`: stosuje zmiany w procesie bez restartu.
  - `"hybrid"` (domyślnie): najpierw próbuje przeładowania na gorąco; w razie potrzeby wraca do restartu.
- `debounceMs`: okno debounce w ms przed zastosowaniem zmian konfiguracji (nieujemna liczba całkowita).
- `deferralTimeoutMs`: opcjonalny maksymalny czas oczekiwania w ms na operacje w toku przed wymuszeniem restartu lub przeładowania kanału na gorąco. Pomiń, aby użyć domyślnego ograniczonego oczekiwania (`300000`); ustaw `0`, aby czekać bezterminowo i okresowo logować ostrzeżenia o wciąż oczekujących operacjach.

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
- `hooks.token` powinien różnić się od aktywnego współdzielonego sekretu uwierzytelniania Gateway (`gateway.auth.token` / `OPENCLAW_GATEWAY_TOKEN` lub `gateway.auth.password` / `OPENCLAW_GATEWAY_PASSWORD`); podczas startu logowane jest niekrytyczne ostrzeżenie bezpieczeństwa, gdy wykryte zostanie ponowne użycie.
- `openclaw security audit` oznacza ponowne użycie uwierzytelniania hook/Gateway jako krytyczne znalezisko, w tym uwierzytelnianie hasłem Gateway podane tylko w czasie audytu (`--auth password --password <password>`). Uruchom `openclaw doctor --fix`, aby zrotować utrwalony ponownie użyty `hooks.token`, a następnie zaktualizuj zewnętrznych nadawców hooków, aby używali nowego tokenu hooka.
- `hooks.path` nie może być `/`; użyj dedykowanej podścieżki, takiej jak `/hooks`.
- Jeśli `hooks.allowRequestSessionKey=true`, ogranicz `hooks.allowedSessionKeyPrefixes` (na przykład `["hook:"]`).
- Jeśli mapowanie lub preset używa szablonowego `sessionKey`, ustaw `hooks.allowedSessionKeyPrefixes` oraz `hooks.allowRequestSessionKey=true`. Statyczne klucze mapowania nie wymagają takiej zgody.

**Punkty końcowe:**

- `POST /hooks/wake` → `{ text, mode?: "now"|"next-heartbeat" }`
- `POST /hooks/agent` → `{ message, name?, agentId?, sessionKey?, wakeMode?, deliver?, channel?, to?, model?, thinking?, timeoutSeconds? }`
  - `sessionKey` z danych żądania jest akceptowany tylko wtedy, gdy `hooks.allowRequestSessionKey=true` (domyślnie: `false`).
- `POST /hooks/<name>` → rozwiązywane przez `hooks.mappings`
  - Wartości `sessionKey` mapowania renderowane z szablonu są traktowane jako dostarczone z zewnątrz i również wymagają `hooks.allowRequestSessionKey=true`.

<Accordion title="Mapping details">

- `match.path` dopasowuje podścieżkę po `/hooks` (np. `/hooks/gmail` → `gmail`).
- `match.source` dopasowuje pole danych dla ścieżek ogólnych.
- Szablony takie jak `{{messages[0].subject}}` odczytują dane z payloadu.
- `transform` może wskazywać moduł JS/TS zwracający akcję hooka.
  - `transform.module` musi być ścieżką względną i pozostaje w obrębie `hooks.transformsDir` (ścieżki bezwzględne i przechodzenie poza katalog są odrzucane).
  - Trzymaj `hooks.transformsDir` pod `~/.openclaw/hooks/transforms`; katalogi Skills w przestrzeni roboczej są odrzucane. Jeśli `openclaw doctor` zgłasza tę ścieżkę jako nieprawidłową, przenieś moduł transformacji do katalogu transformacji hooków albo usuń `hooks.transformsDir`.
- `agentId` kieruje do konkretnego agenta; nieznane identyfikatory wracają do domyślnego agenta.
- `allowedAgentIds`: ogranicza efektywne kierowanie agentów, w tym ścieżkę domyślnego agenta, gdy `agentId` jest pominięte (`*` lub pominięte = zezwól na wszystkie, `[]` = odmów wszystkim).
- `defaultSessionKey`: opcjonalny stały klucz sesji dla uruchomień agenta z hooka bez jawnego `sessionKey`.
- `allowRequestSessionKey`: pozwala wywołującym `/hooks/agent` oraz kluczom sesji mapowania sterowanym szablonami ustawiać `sessionKey` (domyślnie: `false`).
- `allowedSessionKeyPrefixes`: opcjonalna lista dozwolonych prefiksów dla jawnych wartości `sessionKey` (żądanie + mapowanie), np. `["hook:"]`. Staje się wymagana, gdy dowolne mapowanie lub preset używa szablonowego `sessionKey`.
- `deliver: true` wysyła końcową odpowiedź do kanału; `channel` domyślnie przyjmuje `last`.
- `model` nadpisuje LLM dla tego uruchomienia hooka (musi być dozwolony, jeśli ustawiono katalog modeli).

</Accordion>

### Integracja Gmail

- Wbudowany preset Gmail używa `sessionKey: "hook:gmail:{{messages[0].id}}"`.
- Jeśli zachowujesz to kierowanie według wiadomości, ustaw `hooks.allowRequestSessionKey: true` i ogranicz `hooks.allowedSessionKeyPrefixes`, aby pasowało do przestrzeni nazw Gmail, na przykład `["hook:", "hook:gmail:"]`.
- Jeśli potrzebujesz `hooks.allowRequestSessionKey: false`, nadpisz preset statycznym `sessionKey` zamiast szablonowej wartości domyślnej.

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

- Udostępnia edytowalne przez agenta HTML/CSS/JS oraz A2UI przez HTTP pod portem Gateway:
  - `http://<gateway-host>:<gateway.port>/__openclaw__/canvas/`
  - `http://<gateway-host>:<gateway.port>/__openclaw__/a2ui/`
- Tylko lokalnie: zachowaj `gateway.bind: "loopback"` (domyślnie).
- Powiązania inne niż loopback: trasy canvas wymagają uwierzytelniania Gateway (token/hasło/zaufany proxy), tak samo jak inne powierzchnie HTTP Gateway.
- Node WebViews zazwyczaj nie wysyłają nagłówków uwierzytelniania; po sparowaniu i połączeniu węzła Gateway ogłasza adresy URL uprawnień ograniczone do węzła dla dostępu canvas/A2UI.
- Adresy URL uprawnień są powiązane z aktywną sesją WS węzła i szybko wygasają. Awaryjny mechanizm oparty na IP nie jest używany.
- Wstrzykuje klienta przeładowania na żywo do serwowanego HTML.
- Automatycznie tworzy startowy `index.html`, gdy katalog jest pusty.
- Udostępnia też A2UI pod `/__openclaw__/a2ui/`.
- Zmiany wymagają restartu Gateway.
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

- `minimal` (domyślnie, gdy włączony jest dołączony Plugin `bonjour`): pomija `cliPath` + `sshPort` w rekordach TXT.
- `full`: uwzględnia `cliPath` + `sshPort`; ogłaszanie multicast w LAN nadal wymaga włączenia dołączonego Pluginu `bonjour`.
- `off`: wyłącza ogłaszanie multicast w LAN bez zmiany włączenia Pluginu.
- Dołączony Plugin `bonjour` uruchamia się automatycznie na hostach macOS i jest opcjonalny na Linuxie, Windows oraz skonteneryzowanych wdrożeniach Gateway.
- Nazwa hosta domyślnie przyjmuje systemową nazwę hosta, gdy jest prawidłową etykietą DNS, w przeciwnym razie wraca do `openclaw`. Nadpisz za pomocą `OPENCLAW_MDNS_HOSTNAME`.

### Rozległe (DNS-SD)

```json5
{
  discovery: {
    wideArea: { enabled: true },
  },
}
```

Zapisuje strefę unicast DNS-SD pod `~/.openclaw/dns/`. Do wykrywania między sieciami połącz z serwerem DNS (zalecany CoreDNS) + Tailscale split DNS.

Konfiguracja: `openclaw dns setup --apply`.

---

## Środowisko

### `env` (wbudowane zmienne env)

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

- Wbudowane zmienne env są stosowane tylko wtedy, gdy w środowisku procesu brakuje klucza.
- Pliki `.env`: `.env` z CWD + `~/.openclaw/.env` (żaden nie nadpisuje istniejących zmiennych).
- `shellEnv`: importuje brakujące oczekiwane klucze z profilu powłoki logowania.
- Zobacz [Środowisko](/pl/help/environment), aby poznać pełny priorytet.

### Podstawianie zmiennych env

Odwołuj się do zmiennych env w dowolnym ciągu konfiguracji za pomocą `${VAR_NAME}`:

```json5
{
  gateway: {
    auth: { token: "${OPENCLAW_GATEWAY_TOKEN}" },
  },
}
```

- Dopasowywane są tylko nazwy wielkimi literami: `[A-Z_][A-Z0-9_]*`.
- Brakujące/puste zmienne zgłaszają błąd podczas ładowania konfiguracji.
- Ucieknij za pomocą `$${VAR}`, aby uzyskać dosłowne `${VAR}`.
- Działa z `$include`.

---

## Sekrety

Referencje sekretów są addytywne: wartości jawnym tekstem nadal działają.

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
- identyfikatory `source: "exec"` nie mogą zawierać segmentów ścieżki rozdzielonych ukośnikami `.` ani `..` (na przykład `a/../b` jest odrzucane)

### Obsługiwana powierzchnia poświadczeń

- Kanoniczna macierz: [Powierzchnia poświadczeń SecretRef](/pl/reference/secretref-credential-surface)
- `secrets apply` kieruje na obsługiwane ścieżki poświadczeń `openclaw.json`.
- Referencje `auth-profiles.json` są uwzględnione w rozwiązywaniu w czasie działania i pokryciu audytu.

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

- Dostawca `file` obsługuje `mode: "json"` oraz `mode: "singleValue"` (`id` musi mieć wartość `"value"` w trybie singleValue).
- Ścieżki dostawców file i exec kończą się niepowodzeniem w trybie zamkniętym, gdy weryfikacja ACL Windows jest niedostępna. Ustaw `allowInsecurePath: true` tylko dla zaufanych ścieżek, których nie można zweryfikować.
- Dostawca `exec` wymaga bezwzględnej ścieżki `command` i używa payloadów protokołu na stdin/stdout.
- Domyślnie ścieżki poleceń będące symlinkami są odrzucane. Ustaw `allowSymlinkCommand: true`, aby zezwolić na ścieżki symlinków przy jednoczesnej walidacji rozwiązanej ścieżki docelowej.
- Jeśli skonfigurowano `trustedDirs`, sprawdzenie zaufanego katalogu dotyczy rozwiązanej ścieżki docelowej.
- Środowisko procesu potomnego `exec` jest domyślnie minimalne; jawnie przekaż wymagane zmienne za pomocą `passEnv`.
- Referencje sekretów są rozwiązywane w czasie aktywacji do migawki w pamięci, a następnie ścieżki żądań odczytują tylko tę migawkę.
- Filtrowanie aktywnych powierzchni ma zastosowanie podczas aktywacji: nierozwiązane referencje na włączonych powierzchniach powodują niepowodzenie startu/przeładowania, a nieaktywne powierzchnie są pomijane z diagnostyką.

---

## Przechowywanie danych uwierzytelniania

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

- Profile per agenta są przechowywane w `<agentDir>/auth-profiles.json`.
- `auth-profiles.json` obsługuje odwołania na poziomie wartości (`keyRef` dla `api_key`, `tokenRef` dla `token`) dla statycznych trybów poświadczeń.
- Starsze płaskie mapy `auth-profiles.json`, takie jak `{ "provider": { "apiKey": "..." } }`, nie są formatem runtime; `openclaw doctor --fix` przepisuje je do kanonicznych profili klucza API `provider:default` z kopią zapasową `.legacy-flat.*.bak`.
- Profile w trybie OAuth (`auth.profiles.<id>.mode = "oauth"`) nie obsługują poświadczeń profilu auth opartych na SecretRef.
- Statyczne poświadczenia runtime pochodzą z rozwiązanych snapshotów w pamięci; starsze statyczne wpisy `auth.json` są czyszczone po wykryciu.
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

- `billingBackoffHours`: bazowy backoff w godzinach, gdy profil zawiedzie z powodu rzeczywistych błędów
  rozliczeń/niewystarczających środków (domyślnie: `5`). Jawny tekst dotyczący rozliczeń może
  nadal trafić tutaj nawet przy odpowiedziach `401`/`403`, ale dopasowania tekstu specyficzne
  dla dostawcy pozostają ograniczone do dostawcy, do którego należą (na przykład OpenRouter
  `Key limit exceeded`). Ponawialne komunikaty HTTP `402` dotyczące okna użycia lub
  limitu wydatków organizacji/przestrzeni roboczej pozostają zamiast tego w ścieżce `rate_limit`.
- `billingBackoffHoursByProvider`: opcjonalne nadpisania godzin backoffu rozliczeniowego dla poszczególnych dostawców.
- `billingMaxHours`: limit w godzinach dla wykładniczego wzrostu backoffu rozliczeniowego (domyślnie: `24`).
- `authPermanentBackoffMinutes`: bazowy backoff w minutach dla wysoce pewnych awarii `auth_permanent` (domyślnie: `10`).
- `authPermanentMaxMinutes`: limit w minutach dla wzrostu backoffu `auth_permanent` (domyślnie: `60`).
- `failureWindowHours`: ruchome okno w godzinach używane dla liczników backoffu (domyślnie: `24`).
- `overloadedProfileRotations`: maksymalna liczba rotacji profili auth u tego samego dostawcy dla błędów przeciążenia przed przełączeniem na fallback modelu (domyślnie: `1`). Kształty przeciążenia dostawcy, takie jak `ModelNotReadyException`, trafiają tutaj.
- `overloadedBackoffMs`: stałe opóźnienie przed ponowieniem rotacji przeciążonego dostawcy/profilu (domyślnie: `0`).
- `rateLimitedProfileRotations`: maksymalna liczba rotacji profili auth u tego samego dostawcy dla błędów limitu szybkości przed przełączeniem na fallback modelu (domyślnie: `1`). Ten kubeł limitu szybkości obejmuje teksty w kształcie dostawcy, takie jak `Too many concurrent requests`, `ThrottlingException`, `concurrency limit reached`, `workers_ai ... quota limit exceeded` oraz `resource exhausted`.

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
- `consoleLevel` przechodzi na `debug`, gdy użyto `--verbose`.
- `maxFileBytes`: maksymalny rozmiar aktywnego pliku dziennika w bajtach przed rotacją (dodatnia liczba całkowita; domyślnie: `104857600` = 100 MB). OpenClaw przechowuje do pięciu ponumerowanych archiwów obok aktywnego pliku.
- `redactSensitive` / `redactPatterns`: maskowanie best-effort dla wyjścia konsoli, dzienników plikowych, rekordów dziennika OTLP i utrwalonego tekstu transkryptu sesji. `redactSensitive: "off"` wyłącza tylko tę ogólną politykę dzienników/transkryptów; powierzchnie bezpieczeństwa UI/narzędzi/diagnostyki nadal redagują sekrety przed emisją.

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
- `stuckSessionWarnMs`: próg wieku bez postępu w ms do klasyfikowania długotrwałych sesji przetwarzania jako `session.long_running`, `session.stalled` lub `session.stuck`. Odpowiedź, narzędzie, status, blok i postęp ACP resetują licznik; powtarzane diagnostyki `session.stuck` stosują backoff, dopóki pozostają bez zmian.
- `stuckSessionAbortMs`: próg wieku bez postępu w ms, po którym kwalifikująca się zablokowana aktywna praca może zostać abort-drained w celu odzyskania. Gdy nie ustawiono, OpenClaw używa bezpieczniejszego rozszerzonego okna osadzonego uruchomienia wynoszącego co najmniej 5 minut i 3x `stuckSessionWarnMs`.
- `memoryPressureSnapshot`: przechwytuje zredagowany snapshot stabilności przed OOM, gdy presja pamięci osiągnie `critical` (domyślnie: `false`). Ustaw na `true`, aby dodać skan/zapis pliku pakietu stabilności, zachowując normalne zdarzenia presji pamięci.
- `otel.enabled`: włącza potok eksportu OpenTelemetry (domyślnie: `false`). Pełną konfigurację, katalog sygnałów i model prywatności znajdziesz w [Eksport OpenTelemetry](/pl/gateway/opentelemetry).
- `otel.endpoint`: URL kolektora dla eksportu OTel.
- `otel.tracesEndpoint` / `otel.metricsEndpoint` / `otel.logsEndpoint`: opcjonalne, specyficzne dla sygnału endpointy OTLP. Gdy są ustawione, nadpisują `otel.endpoint` tylko dla tego sygnału.
- `otel.protocol`: `"http/protobuf"` (domyślnie) lub `"grpc"`.
- `otel.headers`: dodatkowe nagłówki metadanych HTTP/gRPC wysyłane z żądaniami eksportu OTel.
- `otel.serviceName`: nazwa usługi dla atrybutów zasobu.
- `otel.traces` / `otel.metrics` / `otel.logs`: włącz eksport śladów, metryk lub dzienników.
- `otel.logsExporter`: ujście eksportu dzienników: `"otlp"` (domyślnie), `"stdout"` dla jednego obiektu JSON na linię stdout albo `"both"`.
- `otel.sampleRate`: współczynnik próbkowania śladów `0`-`1`.
- `otel.flushIntervalMs`: okresowy interwał opróżniania telemetrii w ms.
- `otel.captureContent`: opcjonalne przechwytywanie surowej treści dla atrybutów spanów OTEL. Domyślnie wyłączone. Wartość logiczna `true` przechwytuje niesystemową treść wiadomości/narzędzi; forma obiektowa pozwala jawnie włączyć `inputMessages`, `outputMessages`, `toolInputs`, `toolOutputs`, `systemPrompt` i `toolDefinitions`.
- `OTEL_SEMCONV_STABILITY_OPT_IN=gen_ai_latest_experimental`: przełącznik środowiskowy dla najnowszego eksperymentalnego kształtu spanów wnioskowania GenAI, w tym nazw spanów `{gen_ai.operation.name} {gen_ai.request.model}`, rodzaju spana `CLIENT` i `gen_ai.provider.name` zamiast starszego `gen_ai.system`. Domyślnie spany zachowują `openclaw.model.call` i `gen_ai.system` dla zgodności; metryki GenAI używają ograniczonych atrybutów semantycznych.
- `OPENCLAW_OTEL_PRELOADED=1`: przełącznik środowiskowy dla hostów, które już zarejestrowały globalny SDK OpenTelemetry. OpenClaw pomija wtedy uruchamianie/zamykanie SDK należącego do Plugin, pozostawiając aktywne listenery diagnostyczne.
- `OTEL_EXPORTER_OTLP_TRACES_ENDPOINT`, `OTEL_EXPORTER_OTLP_METRICS_ENDPOINT` i `OTEL_EXPORTER_OTLP_LOGS_ENDPOINT`: zmienne środowiskowe endpointów specyficznych dla sygnału, używane, gdy odpowiadający klucz konfiguracji jest nieustawiony.
- `cacheTrace.enabled`: zapisuj snapshoty śladu cache dla osadzonych uruchomień (domyślnie: `false`).
- `cacheTrace.filePath`: ścieżka wyjściowa dla JSONL śladu cache (domyślnie: `$OPENCLAW_STATE_DIR/logs/cache-trace.jsonl`).
- `cacheTrace.includeMessages` / `includePrompt` / `includeSystem`: kontrolują, co jest uwzględniane w wyjściu śladu cache (wszystkie domyślnie: `true`).

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
- `auto.stableJitterHours`: dodatkowe okno rozłożenia wdrożenia w kanale stable w godzinach (domyślnie: `12`; maks.: `168`).
- `auto.betaCheckIntervalHours`: jak często uruchamiane są sprawdzenia kanału beta, w godzinach (domyślnie: `1`; maks.: `24`).

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

- `enabled`: globalna bramka funkcji ACP (domyślnie: `true`; ustaw `false`, aby ukryć wysyłanie ACP i affordance’y spawn).
- `dispatch.enabled`: niezależna bramka wysyłania tur sesji ACP (domyślnie: `true`). Ustaw `false`, aby polecenia ACP pozostały dostępne, ale wykonanie było blokowane.
- `backend`: domyślny identyfikator backendu runtime ACP (musi odpowiadać zarejestrowanemu Plugin runtime ACP).
  Najpierw zainstaluj Plugin backendu, a jeśli ustawiono `plugins.allow`, uwzględnij identyfikator Plugin backendu (na przykład `acpx`), inaczej backend ACP się nie załaduje.
- `defaultAgent`: fallback identyfikatora agenta docelowego ACP, gdy spawny nie określają jawnego celu.
- `allowedAgents`: allowlista identyfikatorów agentów dozwolonych dla sesji runtime ACP; pusta oznacza brak dodatkowych ograniczeń.
- `maxConcurrentSessions`: maksymalna liczba jednocześnie aktywnych sesji ACP.
- `stream.coalesceIdleMs`: okno opróżniania bezczynności w ms dla strumieniowanego tekstu.
- `stream.maxChunkChars`: maksymalny rozmiar fragmentu przed podziałem projekcji strumieniowanego bloku.
- `stream.repeatSuppression`: tłum powtarzające się linie statusu/narzędzi na turę (domyślnie: `true`).
- `stream.deliveryMode`: `"live"` strumieniuje przyrostowo; `"final_only"` buforuje do terminalnych zdarzeń tury.
- `stream.hiddenBoundarySeparator`: separator przed widocznym tekstem po ukrytych zdarzeniach narzędzi (domyślnie: `"paragraph"`).
- `stream.maxOutputChars`: maksymalna liczba znaków wyjścia asystenta rzutowana na turę ACP.
- `stream.maxSessionUpdateChars`: maksymalna liczba znaków dla rzutowanych linii statusu/aktualizacji ACP.
- `stream.tagVisibility`: rekord nazw tagów do logicznych nadpisań widoczności dla strumieniowanych zdarzeń.
- `runtime.ttlMinutes`: TTL bezczynności w minutach dla workerów sesji ACP przed kwalifikującym się czyszczeniem.
- `runtime.installCommand`: opcjonalne polecenie instalacji uruchamiane podczas bootstrappingu środowiska runtime ACP.

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

Zobacz pola tożsamości `agents.list` w sekcji [Domyślne ustawienia agenta](/pl/gateway/config-agents#agent-defaults).

---

## Most (starszy, usunięty)

Bieżące kompilacje nie zawierają już mostu TCP. Node łączą się przez WebSocket Gateway. Klucze `bridge.*` nie są już częścią schematu konfiguracji (walidacja kończy się niepowodzeniem, dopóki nie zostaną usunięte; `openclaw doctor --fix` może usunąć nieznane klucze).

<Accordion title="Legacy bridge config (historical reference)">

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

- `sessionRetention`: jak długo przechowywać ukończone izolowane sesje uruchomień Cron przed usunięciem z `sessions.json`. Kontroluje także czyszczenie zarchiwizowanych transkrypcji usuniętych zadań Cron. Domyślnie: `24h`; ustaw `false`, aby wyłączyć.
- `runLog.maxBytes`: akceptowane dla zgodności ze starszymi dziennikami uruchomień Cron opartymi na plikach. Domyślnie: `2_000_000` bajtów.
- `runLog.keepLines`: najnowsze wiersze historii uruchomień SQLite zachowywane dla każdego zadania. Domyślnie: `2000`.
- `webhookToken`: token bearer używany do dostarczania żądań POST Cron Webhook (`delivery.mode = "webhook"`); jeśli zostanie pominięty, nagłówek uwierzytelniania nie jest wysyłany.
- `webhook`: przestarzały starszy zapasowy adres URL Webhook (http/https), używany przez `openclaw doctor --fix` do migracji zapisanych zadań, które nadal mają `notify: true`; dostarczanie w czasie wykonywania używa per-zadaniowego `delivery.mode="webhook"` oraz `delivery.to` albo `delivery.completionDestination` przy zachowywaniu dostarczania ogłoszeń.

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

- `maxAttempts`: maksymalna liczba ponowień dla zadań Cron przy błędach przejściowych (domyślnie: `3`; zakres: `0`-`10`).
- `backoffMs`: tablica opóźnień wycofania w ms dla każdej próby ponowienia (domyślnie: `[30000, 60000, 300000]`; 1-10 wpisów).
- `retryOn`: typy błędów wyzwalające ponowienia - `"rate_limit"`, `"overloaded"`, `"network"`, `"timeout"`, `"server_error"`. Pomiń, aby ponawiać wszystkie typy przejściowe.

Zadania jednorazowe pozostają włączone do wyczerpania prób ponowienia, a następnie są wyłączane z zachowaniem końcowego stanu błędu. Zadania cykliczne używają tej samej polityki ponawiania błędów przejściowych, aby uruchomić się ponownie po wycofaniu przed następnym zaplanowanym terminem; błędy trwałe lub wyczerpane ponowienia błędów przejściowych wracają do normalnego harmonogramu cyklicznego z wycofaniem po błędzie.

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
- `after`: liczba kolejnych niepowodzeń przed wywołaniem alertu (dodatnia liczba całkowita, min: `1`).
- `cooldownMs`: minimalna liczba milisekund między powtarzanymi alertami dla tego samego zadania (nieujemna liczba całkowita).
- `includeSkipped`: zlicza kolejne pominięte uruchomienia do progu alertu (domyślnie: `false`). Pominięte uruchomienia są śledzone oddzielnie i nie wpływają na wycofanie po błędzie wykonania.
- `mode`: tryb dostarczania - `"announce"` wysyła przez wiadomość kanału; `"webhook"` publikuje do skonfigurowanego Webhook.
- `accountId`: opcjonalne konto lub identyfikator kanału ograniczające zakres dostarczania alertów.

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

- Domyślny cel powiadomień o niepowodzeniach Cron we wszystkich zadaniach.
- `mode`: `"announce"` lub `"webhook"`; domyślnie `"announce"`, gdy istnieje wystarczająco danych celu.
- `channel`: nadpisanie kanału dla dostarczania ogłoszeń. `"last"` używa ostatniego znanego kanału dostarczania.
- `to`: jawny cel ogłoszenia lub adres URL Webhook. Wymagane w trybie Webhook.
- `accountId`: opcjonalne nadpisanie konta dla dostarczania.
- Per-zadaniowe `delivery.failureDestination` nadpisuje tę globalną wartość domyślną.
- Gdy nie ustawiono ani globalnego, ani per-zadaniowego celu niepowodzenia, zadania, które już dostarczają przez `announce`, wracają przy niepowodzeniu do tego głównego celu ogłoszenia.
- `delivery.failureDestination` jest obsługiwane tylko dla zadań `sessionTarget="isolated"`, chyba że główne `delivery.mode` zadania to `"webhook"`.

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
| `{{To}}`           | Identyfikator celu                                |
| `{{MessageSid}}`   | Identyfikator wiadomości kanału                   |
| `{{SessionId}}`    | UUID bieżącej sesji                               |
| `{{IsNewSession}}` | `"true"`, gdy utworzono nową sesję                |
| `{{MediaUrl}}`     | Pseudo-URL przychodzących mediów                  |
| `{{MediaPath}}`    | Lokalna ścieżka mediów                            |
| `{{MediaType}}`    | Typ mediów (obraz/audio/dokument/…)               |
| `{{Transcript}}`   | Transkrypcja audio                                |
| `{{Prompt}}`       | Rozwiązany prompt mediów dla wpisów CLI           |
| `{{MaxChars}}`     | Rozwiązana maksymalna liczba znaków wyjścia dla wpisów CLI |
| `{{ChatType}}`     | `"direct"` lub `"group"`                          |
| `{{GroupSubject}}` | Temat grupy (best effort)                         |
| `{{GroupMembers}}` | Podgląd członków grupy (best effort)              |
| `{{SenderName}}`   | Wyświetlana nazwa nadawcy (best effort)           |
| `{{SenderE164}}`   | Numer telefonu nadawcy (best effort)              |
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

- Pojedynczy plik: zastępuje zawierający go obiekt.
- Tablica plików: głęboko scalana w kolejności (późniejsze nadpisują wcześniejsze).
- Klucze siostrzane: scalane po dołączeniach (nadpisują dołączone wartości).
- Zagnieżdżone dołączenia: do 10 poziomów głębokości.
- Ścieżki: rozwiązywane względem pliku dołączającego, ale muszą pozostać w katalogu konfiguracji najwyższego poziomu (`dirname` pliku `openclaw.json`). Formy bezwzględne/`../` są dozwolone tylko wtedy, gdy nadal rozwiązują się w tej granicy. Ścieżki nie mogą zawierać bajtów null i muszą mieć ściśle mniej niż 4096 znaków przed rozwiązaniem i po nim.
- Zapisy właścicielskie OpenClaw, które zmieniają tylko jedną sekcję najwyższego poziomu opartą na dołączeniu pojedynczego pliku, zapisują bezpośrednio do tego dołączonego pliku. Na przykład `plugins install` aktualizuje `plugins: { $include: "./plugins.json5" }` w `plugins.json5` i pozostawia `openclaw.json` bez zmian.
- Dołączenia główne, tablice dołączeń oraz dołączenia z nadpisaniami kluczy siostrzanych są tylko do odczytu dla zapisów właścicielskich OpenClaw; takie zapisy kończą się odmową zamiast spłaszczania konfiguracji.
- Błędy: jasne komunikaty dla brakujących plików, błędów parsowania, cyklicznych dołączeń, nieprawidłowego formatu ścieżki i nadmiernej długości.

---

_Powiązane: [Konfiguracja](/pl/gateway/configuration) · [Przykłady konfiguracji](/pl/gateway/configuration-examples) · [Doctor](/pl/gateway/doctor)_

## Powiązane

- [Konfiguracja](/pl/gateway/configuration)
- [Przykłady konfiguracji](/pl/gateway/configuration-examples)
