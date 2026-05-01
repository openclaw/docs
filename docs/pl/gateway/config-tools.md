---
read_when:
    - Konfigurowanie polityki `tools.*`, list dozwolonych lub funkcji eksperymentalnych
    - Rejestrowanie niestandardowych dostawców lub zastępowanie bazowych adresów URL
    - Konfigurowanie samodzielnie hostowanych punktów końcowych zgodnych z OpenAI
sidebarTitle: Tools and custom providers
summary: Konfiguracja narzędzi (zasady, eksperymentalne przełączniki, narzędzia obsługiwane przez dostawcę) oraz konfiguracja niestandardowego dostawcy / bazowego adresu URL
title: Konfiguracja — narzędzia i niestandardowi dostawcy
x-i18n:
    generated_at: "2026-05-01T09:58:40Z"
    model: gpt-5.5
    provider: openai
    source_hash: 97e6bd8c762f6f7a9985b99ec016dde22c8ea8adc925778b11c2ae5103b887a8
    source_path: gateway/config-tools.md
    workflow: 16
---

`tools.*` klucze konfiguracji oraz konfiguracja niestandardowego dostawcy / bazowego adresu URL. Informacje o agentach, kanałach i innych kluczach konfiguracji najwyższego poziomu znajdziesz w [odniesieniu do konfiguracji](/pl/gateway/configuration-reference).

## Narzędzia

### Profile narzędzi

`tools.profile` ustawia bazową listę dozwolonych elementów przed `tools.allow`/`tools.deny`:

<Note>
Lokalny onboarding domyślnie ustawia w nowych konfiguracjach lokalnych `tools.profile: "coding"`, gdy nie jest ustawiony (istniejące jawne profile są zachowywane).
</Note>

| Profil      | Obejmuje                                                                                                                        |
| ----------- | ------------------------------------------------------------------------------------------------------------------------------- |
| `minimal`   | tylko `session_status`                                                                                                          |
| `coding`    | `group:fs`, `group:runtime`, `group:web`, `group:sessions`, `group:memory`, `cron`, `image`, `image_generate`, `video_generate` |
| `messaging` | `group:messaging`, `sessions_list`, `sessions_history`, `sessions_send`, `session_status`                                       |
| `full`      | Brak ograniczeń (tak samo jak brak ustawienia)                                                                                  |

### Grupy narzędzi

| Grupa              | Narzędzia                                                                                                               |
| ------------------ | ----------------------------------------------------------------------------------------------------------------------- |
| `group:runtime`    | `exec`, `process`, `code_execution` (`bash` jest akceptowany jako alias dla `exec`)                                     |
| `group:fs`         | `read`, `write`, `edit`, `apply_patch`                                                                                  |
| `group:sessions`   | `sessions_list`, `sessions_history`, `sessions_send`, `sessions_spawn`, `sessions_yield`, `subagents`, `session_status` |
| `group:memory`     | `memory_search`, `memory_get`                                                                                           |
| `group:web`        | `web_search`, `x_search`, `web_fetch`                                                                                   |
| `group:ui`         | `browser`, `canvas`                                                                                                     |
| `group:automation` | `cron`, `gateway`                                                                                                       |
| `group:messaging`  | `message`                                                                                                               |
| `group:nodes`      | `nodes`                                                                                                                 |
| `group:agents`     | `agents_list`                                                                                                           |
| `group:media`      | `image`, `image_generate`, `video_generate`, `tts`                                                                      |
| `group:openclaw`   | Wszystkie wbudowane narzędzia (z wyłączeniem Plugin dostawców)                                                          |

### `tools.allow` / `tools.deny`

Globalna polityka zezwalania/odmawiania narzędzi (odmowa wygrywa). Bez rozróżniania wielkości liter, obsługuje symbole wieloznaczne `*`. Stosowana nawet wtedy, gdy piaskownica Docker jest wyłączona.

```json5
{
  tools: { deny: ["browser", "canvas"] },
}
```

### `tools.byProvider`

Dodatkowo ogranicza narzędzia dla konkretnych dostawców lub modeli. Kolejność: profil bazowy → profil dostawcy → zezwalaj/odmawiaj.

```json5
{
  tools: {
    profile: "coding",
    byProvider: {
      "google-antigravity": { profile: "minimal" },
      "openai/gpt-5.4": { allow: ["group:fs", "sessions_list"] },
    },
  },
}
```

### `tools.elevated`

Kontroluje podwyższony dostęp `exec` poza piaskownicą:

```json5
{
  tools: {
    elevated: {
      enabled: true,
      allowFrom: {
        whatsapp: ["+15555550123"],
        discord: ["1234567890123", "987654321098765432"],
      },
    },
  },
}
```

- Nadpisanie per agent (`agents.list[].tools.elevated`) może tylko dodatkowo ograniczać.
- `/elevated on|off|ask|full` zapisuje stan dla sesji; dyrektywy inline dotyczą pojedynczej wiadomości.
- Podwyższone `exec` omija piaskownicę i używa skonfigurowanej ścieżki wyjścia (`gateway` domyślnie albo `node`, gdy celem exec jest `node`).

### `tools.exec`

```json5
{
  tools: {
    exec: {
      backgroundMs: 10000,
      timeoutSec: 1800,
      cleanupMs: 1800000,
      notifyOnExit: true,
      notifyOnExitEmptySuccess: false,
      applyPatch: {
        enabled: false,
        allowModels: ["gpt-5.5"],
      },
    },
  },
}
```

### `tools.loopDetection`

Kontrole bezpieczeństwa pętli narzędzi są **domyślnie wyłączone**. Ustaw `enabled: true`, aby aktywować wykrywanie. Ustawienia można definiować globalnie w `tools.loopDetection` i nadpisywać per agent w `agents.list[].tools.loopDetection`.

```json5
{
  tools: {
    loopDetection: {
      enabled: true,
      historySize: 30,
      warningThreshold: 10,
      criticalThreshold: 20,
      globalCircuitBreakerThreshold: 30,
      detectors: {
        genericRepeat: true,
        knownPollNoProgress: true,
        pingPong: true,
      },
    },
  },
}
```

<ParamField path="historySize" type="number">
  Maksymalna historia wywołań narzędzi zachowywana do analizy pętli.
</ParamField>
<ParamField path="warningThreshold" type="number">
  Próg powtarzającego się wzorca bez postępu dla ostrzeżeń.
</ParamField>
<ParamField path="criticalThreshold" type="number">
  Wyższy próg powtórzeń do blokowania krytycznych pętli.
</ParamField>
<ParamField path="globalCircuitBreakerThreshold" type="number">
  Twardy próg zatrzymania dla dowolnego przebiegu bez postępu.
</ParamField>
<ParamField path="detectors.genericRepeat" type="boolean">
  Ostrzegaj przy powtarzających się wywołaniach tego samego narzędzia z tymi samymi argumentami.
</ParamField>
<ParamField path="detectors.knownPollNoProgress" type="boolean">
  Ostrzegaj/blokuj przy znanych narzędziach odpytywania (`process.poll`, `command_status` itd.).
</ParamField>
<ParamField path="detectors.pingPong" type="boolean">
  Ostrzegaj/blokuj przy naprzemiennych wzorcach par bez postępu.
</ParamField>

<Warning>
Jeśli `warningThreshold >= criticalThreshold` albo `criticalThreshold >= globalCircuitBreakerThreshold`, walidacja kończy się niepowodzeniem.
</Warning>

### `tools.web`

```json5
{
  tools: {
    web: {
      search: {
        enabled: true,
        apiKey: "brave_api_key", // or BRAVE_API_KEY env
        maxResults: 5,
        timeoutSeconds: 30,
        cacheTtlMinutes: 15,
      },
      fetch: {
        enabled: true,
        provider: "firecrawl", // optional; omit for auto-detect
        maxChars: 50000,
        maxCharsCap: 50000,
        maxResponseBytes: 2000000,
        timeoutSeconds: 30,
        cacheTtlMinutes: 15,
        maxRedirects: 3,
        readability: true,
        userAgent: "custom-ua",
      },
    },
  },
}
```

### `tools.media`

Konfiguruje rozumienie przychodzących multimediów (obrazu/audio/wideo):

```json5
{
  tools: {
    media: {
      concurrency: 2,
      asyncCompletion: {
        directSend: false, // opt-in: send finished async video directly to the channel
      },
      audio: {
        enabled: true,
        maxBytes: 20971520,
        scope: {
          default: "deny",
          rules: [{ action: "allow", match: { chatType: "direct" } }],
        },
        models: [
          { provider: "openai", model: "gpt-4o-mini-transcribe" },
          { type: "cli", command: "whisper", args: ["--model", "base", "{{MediaPath}}"] },
        ],
      },
      image: {
        enabled: true,
        timeoutSeconds: 180,
        models: [{ provider: "ollama", model: "gemma4:26b", timeoutSeconds: 300 }],
      },
      video: {
        enabled: true,
        maxBytes: 52428800,
        models: [{ provider: "google", model: "gemini-3-flash-preview" }],
      },
    },
  },
}
```

<AccordionGroup>
  <Accordion title="Pola wpisu modelu multimediów">
    **Wpis dostawcy** (`type: "provider"` lub pominięty):

    - `provider`: identyfikator dostawcy API (`openai`, `anthropic`, `google`/`gemini`, `groq` itd.)
    - `model`: zastąpienie identyfikatora modelu
    - `profile` / `preferredProfile`: wybór profilu `auth-profiles.json`

    **Wpis CLI** (`type: "cli"`):

    - `command`: plik wykonywalny do uruchomienia
    - `args`: argumenty szablonowane (obsługuje `{{MediaPath}}`, `{{Prompt}}`, `{{MaxChars}}` itd.; `openclaw doctor --fix` migruje przestarzałe symbole zastępcze `{input}` do `{{MediaPath}}`)

    **Wspólne pola:**

    - `capabilities`: opcjonalna lista (`image`, `audio`, `video`). Domyślne: `openai`/`anthropic`/`minimax` → obraz, `google` → obraz+audio+wideo, `groq` → audio.
    - `prompt`, `maxChars`, `maxBytes`, `timeoutSeconds`, `language`: zastąpienia dla pojedynczego wpisu.
    - `tools.media.image.timeoutSeconds` i pasujące wpisy `timeoutSeconds` modelu obrazu mają też zastosowanie, gdy agent wywołuje jawne narzędzie `image`.
    - Awarie powodują przejście do następnego wpisu.

    Uwierzytelnianie dostawcy stosuje standardową kolejność: `auth-profiles.json` → zmienne środowiskowe → `models.providers.*.apiKey`.

    **Pola ukończenia asynchronicznego:**

    - `asyncCompletion.directSend`: gdy `true`, ukończone asynchroniczne zadania multimedialne obsługujące bezpośrednie dostarczanie ukończenia najpierw próbują bezpośredniego dostarczenia do kanału. Domyślnie: `false` (ścieżka wybudzenia sesji żądającego/dostarczenia przez model). Obecnie dotyczy to asynchronicznego `video_generate`; ukończenia asynchronicznego `music_generate` pozostają pośredniczone przez sesję żądającego nawet wtedy, gdy ta opcja jest włączona.

  </Accordion>
</AccordionGroup>

### `tools.agentToAgent`

```json5
{
  tools: {
    agentToAgent: {
      enabled: false,
      allow: ["home", "work"],
    },
  },
}
```

### `tools.sessions`

Kontroluje, które sesje mogą być wskazywane przez narzędzia sesji (`sessions_list`, `sessions_history`, `sessions_send`).

Domyślnie: `tree` (bieżąca sesja + sesje przez nią utworzone, takie jak subagenci).

```json5
{
  tools: {
    sessions: {
      // "self" | "tree" | "agent" | "all"
      visibility: "tree",
    },
  },
}
```

<AccordionGroup>
  <Accordion title="Zakresy widoczności">
    - `self`: tylko klucz bieżącej sesji.
    - `tree`: bieżąca sesja + sesje utworzone przez bieżącą sesję (subagenci).
    - `agent`: dowolna sesja należąca do identyfikatora bieżącego agenta (może obejmować innych użytkowników, jeśli uruchamiasz sesje dla poszczególnych nadawców pod tym samym identyfikatorem agenta).
    - `all`: dowolna sesja. Kierowanie między agentami nadal wymaga `tools.agentToAgent`.
    - Ograniczenie sandboxa: gdy bieżąca sesja jest w sandboxie, a `agents.defaults.sandbox.sessionToolsVisibility="spawned"`, widoczność jest wymuszana na `tree`, nawet jeśli `tools.sessions.visibility="all"`.

  </Accordion>
</AccordionGroup>

### `tools.sessions_spawn`

Kontroluje obsługę załączników w treści dla `sessions_spawn`.

```json5
{
  tools: {
    sessions_spawn: {
      attachments: {
        enabled: false, // opt-in: set true to allow inline file attachments
        maxTotalBytes: 5242880, // 5 MB total across all files
        maxFiles: 50,
        maxFileBytes: 1048576, // 1 MB per file
        retainOnSessionKeep: false, // keep attachments when cleanup="keep"
      },
    },
  },
}
```

<AccordionGroup>
  <Accordion title="Uwagi dotyczące załączników">
    - Załączniki są obsługiwane tylko dla `runtime: "subagent"`. Środowisko uruchomieniowe ACP je odrzuca.
    - Pliki są materializowane w obszarze roboczym dziecka w `.openclaw/attachments/<uuid>/` z plikiem `.manifest.json`.
    - Treść załączników jest automatycznie redagowana z trwałego zapisu transkryptu.
    - Dane wejściowe Base64 są weryfikowane za pomocą ścisłych kontroli alfabetu/wypełnienia oraz zabezpieczenia rozmiaru przed dekodowaniem.
    - Uprawnienia plików to `0700` dla katalogów i `0600` dla plików.
    - Czyszczenie przestrzega polityki `cleanup`: `delete` zawsze usuwa załączniki; `keep` zachowuje je tylko wtedy, gdy `retainOnSessionKeep: true`.

  </Accordion>
</AccordionGroup>

<a id="toolsexperimental"></a>

### `tools.experimental`

Eksperymentalne flagi wbudowanych narzędzi. Domyślnie wyłączone, chyba że ma zastosowanie reguła automatycznego włączania dla ściśle agentowego GPT-5.

```json5
{
  tools: {
    experimental: {
      planTool: true, // enable experimental update_plan
    },
  },
}
```

- `planTool`: włącza ustrukturyzowane narzędzie `update_plan` do śledzenia nietrywialnej pracy wieloetapowej.
- Domyślnie: `false`, chyba że `agents.defaults.embeddedPi.executionContract` (lub nadpisanie dla danego agenta) jest ustawione na `"strict-agentic"` dla uruchomienia OpenAI albo OpenAI Codex z rodziny GPT-5. Ustaw `true`, aby wymusić włączenie narzędzia poza tym zakresem, albo `false`, aby pozostawić je wyłączone nawet dla uruchomień strict-agentic GPT-5.
- Gdy jest włączone, prompt systemowy dodaje też wskazówki użycia, aby model korzystał z niego tylko przy istotnej pracy i utrzymywał najwyżej jeden krok `in_progress`.

### `agents.defaults.subagents`

```json5
{
  agents: {
    defaults: {
      subagents: {
        allowAgents: ["research"],
        model: "minimax/MiniMax-M2.7",
        maxConcurrent: 8,
        runTimeoutSeconds: 900,
        archiveAfterMinutes: 60,
      },
    },
  },
}
```

- `model`: domyślny model dla uruchamianych subagentów. Jeśli pominięto, subagenci dziedziczą model wywołującego.
- `allowAgents`: domyślna lista dozwolonych identyfikatorów agentów docelowych dla `sessions_spawn`, gdy agent żądający nie ustawi własnego `subagents.allowAgents` (`["*"]` = dowolny; domyślnie: tylko ten sam agent).
- `runTimeoutSeconds`: domyślny limit czasu (w sekundach) dla `sessions_spawn`, gdy wywołanie narzędzia pomija `runTimeoutSeconds`. `0` oznacza brak limitu czasu.
- Zasady narzędzi dla poszczególnych subagentów: `tools.subagents.tools.allow` / `tools.subagents.tools.deny`.

---

## Niestandardowi dostawcy i bazowe adresy URL

OpenClaw używa wbudowanego katalogu modeli. Dodaj niestandardowych dostawców przez `models.providers` w konfiguracji albo `~/.openclaw/agents/<agentId>/agent/models.json`.

```json5
{
  models: {
    mode: "merge", // merge (default) | replace
    providers: {
      "custom-proxy": {
        baseUrl: "http://localhost:4000/v1",
        apiKey: "LITELLM_KEY",
        api: "openai-completions", // openai-completions | openai-responses | anthropic-messages | google-generative-ai
        models: [
          {
            id: "llama-3.1-8b",
            name: "Llama 3.1 8B",
            reasoning: false,
            input: ["text"],
            cost: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0 },
            contextWindow: 128000,
            contextTokens: 96000,
            maxTokens: 32000,
          },
        ],
      },
    },
  },
}
```

<AccordionGroup>
  <Accordion title="Auth and merge precedence">
    - Użyj `authHeader: true` + `headers` dla niestandardowych wymagań uwierzytelniania.
    - Nadpisz katalog główny konfiguracji agenta za pomocą `OPENCLAW_AGENT_DIR` (albo `PI_CODING_AGENT_DIR`, starszego aliasu zmiennej środowiskowej).
    - Kolejność scalania dla pasujących identyfikatorów dostawców:
      - Niepuste wartości `baseUrl` z `models.json` agenta mają pierwszeństwo.
      - Niepuste wartości `apiKey` agenta mają pierwszeństwo tylko wtedy, gdy ten dostawca nie jest zarządzany przez SecretRef w bieżącym kontekście konfiguracji/profilu uwierzytelniania.
      - Wartości `apiKey` dostawcy zarządzanego przez SecretRef są odświeżane ze znaczników źródłowych (`ENV_VAR_NAME` dla odwołań do zmiennych środowiskowych, `secretref-managed` dla odwołań do pliku/exec) zamiast utrwalać rozwiązane sekrety.
      - Wartości nagłówków dostawcy zarządzanego przez SecretRef są odświeżane ze znaczników źródłowych (`secretref-env:ENV_VAR_NAME` dla odwołań do zmiennych środowiskowych, `secretref-managed` dla odwołań do pliku/exec).
      - Puste lub brakujące `apiKey`/`baseUrl` agenta wracają do `models.providers` w konfiguracji.
      - Pasujące `contextWindow`/`maxTokens` modelu używają wyższej wartości spośród jawnej konfiguracji i niejawnych wartości katalogu.
      - Pasujące `contextTokens` modelu zachowuje jawny limit środowiska uruchomieniowego, gdy jest obecny; użyj go, aby ograniczyć efektywny kontekst bez zmieniania natywnych metadanych modelu.
      - Użyj `models.mode: "replace"`, gdy chcesz, aby konfiguracja w pełni przepisała `models.json`.
      - Utrwalanie znaczników jest autorytatywne względem źródła: znaczniki są zapisywane z aktywnej migawki konfiguracji źródłowej (przed rozwiązaniem), nie z rozwiązanych wartości sekretów w środowisku uruchomieniowym.

  </Accordion>
</AccordionGroup>

### Szczegóły pól dostawcy

<AccordionGroup>
  <Accordion title="Top-level catalog">
    - `models.mode`: zachowanie katalogu dostawców (`merge` albo `replace`).
    - `models.providers`: mapa niestandardowych dostawców indeksowana identyfikatorem dostawcy.
      - Bezpieczne edycje: użyj `openclaw config set models.providers.<id> '<json>' --strict-json --merge` albo `openclaw config set models.providers.<id>.models '<json-array>' --strict-json --merge` dla aktualizacji addytywnych. `config set` odmawia destrukcyjnych zamian, chyba że przekażesz `--replace`.

  </Accordion>
  <Accordion title="Provider connection and auth">
    - `models.providers.*.api`: adapter żądań (`openai-completions`, `openai-responses`, `anthropic-messages`, `google-generative-ai` itd.). Dla samodzielnie hostowanych backendów `/v1/chat/completions`, takich jak MLX, vLLM, SGLang i większość lokalnych serwerów zgodnych z OpenAI, użyj `openai-completions`. Niestandardowy dostawca z `baseUrl`, ale bez `api`, domyślnie używa `openai-completions`; ustaw `openai-responses` tylko wtedy, gdy backend obsługuje `/v1/responses`.
    - `models.providers.*.apiKey`: poświadczenie dostawcy (preferuj podstawianie SecretRef/zmiennych środowiskowych).
    - `models.providers.*.auth`: strategia uwierzytelniania (`api-key`, `token`, `oauth`, `aws-sdk`).
    - `models.providers.*.contextWindow`: domyślne natywne okno kontekstu dla modeli u tego dostawcy, gdy wpis modelu nie ustawia `contextWindow`.
    - `models.providers.*.contextTokens`: domyślny efektywny limit kontekstu środowiska uruchomieniowego dla modeli u tego dostawcy, gdy wpis modelu nie ustawia `contextTokens`.
    - `models.providers.*.maxTokens`: domyślny limit tokenów wyjściowych dla modeli u tego dostawcy, gdy wpis modelu nie ustawia `maxTokens`.
    - `models.providers.*.timeoutSeconds`: opcjonalny limit czasu żądania HTTP modelu dla danego dostawcy w sekundach, obejmujący połączenie, nagłówki, treść i obsługę przerwania całego żądania.
    - `models.providers.*.injectNumCtxForOpenAICompat`: dla Ollama + `openai-completions`, wstrzykuje `options.num_ctx` do żądań (domyślnie: `true`).
    - `models.providers.*.authHeader`: wymusza transport poświadczeń w nagłówku `Authorization`, gdy jest wymagany.
    - `models.providers.*.baseUrl`: bazowy adres URL nadrzędnego API.
    - `models.providers.*.headers`: dodatkowe statyczne nagłówki do trasowania przez proxy/dzierżawcę.

  </Accordion>
  <Accordion title="Request transport overrides">
    `models.providers.*.request`: nadpisania transportu dla żądań HTTP dostawcy modelu.

    - `request.headers`: dodatkowe nagłówki (scalane z domyślnymi dostawcy). Wartości akceptują SecretRef.
    - `request.auth`: nadpisanie strategii uwierzytelniania. Tryby: `"provider-default"` (używa wbudowanego uwierzytelniania dostawcy), `"authorization-bearer"` (z `token`), `"header"` (z `headerName`, `value`, opcjonalnie `prefix`).
    - `request.proxy`: nadpisanie proxy HTTP. Tryby: `"env-proxy"` (używa zmiennych środowiskowych `HTTP_PROXY`/`HTTPS_PROXY`), `"explicit-proxy"` (z `url`). Oba tryby akceptują opcjonalny podobiekt `tls`.
    - `request.tls`: nadpisanie TLS dla bezpośrednich połączeń. Pola: `ca`, `cert`, `key`, `passphrase` (wszystkie akceptują SecretRef), `serverName`, `insecureSkipVerify`.
    - `request.allowPrivateNetwork`: gdy `true`, zezwala na HTTPS do `baseUrl`, gdy DNS rozwiązuje nazwę na zakresy prywatne, CGNAT lub podobne, przez zabezpieczenie pobierania HTTP dostawcy (świadoma zgoda operatora dla zaufanych, samodzielnie hostowanych punktów końcowych zgodnych z OpenAI). Adresy URL strumienia dostawcy modelu local loopback, takie jak `localhost`, `127.0.0.1` i `[::1]`, są dozwolone automatycznie, chyba że jawnie ustawiono to na `false`; hosty LAN, tailnet i prywatne hosty DNS nadal wymagają zgody. WebSocket używa tego samego `request` dla nagłówków/TLS, ale nie tej bramki SSRF pobierania. Domyślnie `false`.

  </Accordion>
  <Accordion title="Model catalog entries">
    - `models.providers.*.models`: jawne wpisy katalogu modeli dostawcy.
    - `models.providers.*.models.*.input`: modalności wejściowe modelu. Użyj `["text"]` dla modeli tylko tekstowych oraz `["text", "image"]` dla natywnych modeli obrazu/wizji. Załączniki obrazów są wstrzykiwane do tur agenta tylko wtedy, gdy wybrany model jest oznaczony jako obsługujący obrazy.
    - `models.providers.*.models.*.contextWindow`: natywne metadane okna kontekstu modelu. Nadpisuje `contextWindow` na poziomie dostawcy dla tego modelu.
    - `models.providers.*.models.*.contextTokens`: opcjonalny limit kontekstu środowiska uruchomieniowego. Nadpisuje `contextTokens` na poziomie dostawcy; użyj go, gdy chcesz mniejszy efektywny budżet kontekstu niż natywne `contextWindow` modelu; `openclaw models list` pokazuje obie wartości, gdy się różnią.
    - `models.providers.*.models.*.compat.supportsDeveloperRole`: opcjonalna wskazówka zgodności. Dla `api: "openai-completions"` z niepustym, nienatywnym `baseUrl` (host inny niż `api.openai.com`) OpenClaw wymusza to na `false` w środowisku uruchomieniowym. Puste/pominięte `baseUrl` zachowuje domyślne zachowanie OpenAI.
    - `models.providers.*.models.*.compat.requiresStringContent`: opcjonalna wskazówka zgodności dla tekstowych punktów końcowych czatu zgodnych z OpenAI. Gdy `true`, OpenClaw spłaszcza czysto tekstowe tablice `messages[].content` do zwykłych ciągów znaków przed wysłaniem żądania.

  </Accordion>
  <Accordion title="Amazon Bedrock discovery">
    - `plugins.entries.amazon-bedrock.config.discovery`: korzeń ustawień automatycznego wykrywania Bedrock.
    - `plugins.entries.amazon-bedrock.config.discovery.enabled`: włącza/wyłącza niejawne wykrywanie.
    - `plugins.entries.amazon-bedrock.config.discovery.region`: region AWS do wykrywania.
    - `plugins.entries.amazon-bedrock.config.discovery.providerFilter`: opcjonalny filtr identyfikatora dostawcy dla ukierunkowanego wykrywania.
    - `plugins.entries.amazon-bedrock.config.discovery.refreshInterval`: interwał odpytywania odświeżania wykrywania.
    - `plugins.entries.amazon-bedrock.config.discovery.defaultContextWindow`: zapasowe okno kontekstu dla wykrytych modeli.
    - `plugins.entries.amazon-bedrock.config.discovery.defaultMaxTokens`: zapasowy maksymalny limit tokenów wyjściowych dla wykrytych modeli.

  </Accordion>
</AccordionGroup>

Interaktywne wdrażanie niestandardowego dostawcy wywnioskuje wejście obrazu dla popularnych identyfikatorów modeli wizyjnych, takich jak GPT-4o, Claude, Gemini, Qwen-VL, LLaVA, Pixtral, InternVL, Mllama, MiniCPM-V i GLM-4V, oraz pomija dodatkowe pytanie dla znanych rodzin tylko tekstowych. Nieznane identyfikatory modeli nadal wyświetlają pytanie o obsługę obrazów. Nieinteraktywne wdrażanie używa tego samego wnioskowania; przekaż `--custom-image-input`, aby wymusić metadane obsługi obrazów, albo `--custom-text-input`, aby wymusić metadane tylko tekstowe.

### Przykłady dostawców

<AccordionGroup>
  <Accordion title="Cerebras (GLM 4.7 / GPT OSS)">
    Dołączony Plugin dostawcy `cerebras` może skonfigurować to przez `openclaw onboard --auth-choice cerebras-api-key`. Używaj jawnej konfiguracji dostawcy tylko podczas nadpisywania wartości domyślnych.

    ```json5
    {
      env: { CEREBRAS_API_KEY: "sk-..." },
      agents: {
        defaults: {
          model: {
            primary: "cerebras/zai-glm-4.7",
            fallbacks: ["cerebras/gpt-oss-120b"],
          },
          models: {
            "cerebras/zai-glm-4.7": { alias: "GLM 4.7 (Cerebras)" },
            "cerebras/gpt-oss-120b": { alias: "GPT OSS 120B (Cerebras)" },
          },
        },
      },
      models: {
        mode: "merge",
        providers: {
          cerebras: {
            baseUrl: "https://api.cerebras.ai/v1",
            apiKey: "${CEREBRAS_API_KEY}",
            api: "openai-completions",
            models: [
              { id: "zai-glm-4.7", name: "GLM 4.7 (Cerebras)" },
              { id: "gpt-oss-120b", name: "GPT OSS 120B (Cerebras)" },
            ],
          },
        },
      },
    }
    ```

    Użyj `cerebras/zai-glm-4.7` dla Cerebras; `zai/glm-4.7` dla bezpośredniego Z.AI.

  </Accordion>
  <Accordion title="Kimi Coding">
    ```json5
    {
      env: { KIMI_API_KEY: "sk-..." },
      agents: {
        defaults: {
          model: { primary: "kimi/kimi-code" },
          models: { "kimi/kimi-code": { alias: "Kimi Code" } },
        },
      },
    }
    ```

    Zgodny z Anthropic, wbudowany dostawca. Skrót: `openclaw onboard --auth-choice kimi-code-api-key`.

  </Accordion>
  <Accordion title="Modele lokalne (LM Studio)">
    Zobacz [Modele lokalne](/pl/gateway/local-models). TL;DR: uruchom duży model lokalny przez LM Studio Responses API na solidnym sprzęcie; zachowaj scalone modele hostowane jako fallback.
  </Accordion>
  <Accordion title="MiniMax M2.7 (bezpośrednio)">
    ```json5
    {
      agents: {
        defaults: {
          model: { primary: "minimax/MiniMax-M2.7" },
          models: {
            "minimax/MiniMax-M2.7": { alias: "Minimax" },
          },
        },
      },
      models: {
        mode: "merge",
        providers: {
          minimax: {
            baseUrl: "https://api.minimax.io/anthropic",
            apiKey: "${MINIMAX_API_KEY}",
            api: "anthropic-messages",
            models: [
              {
                id: "MiniMax-M2.7",
                name: "MiniMax M2.7",
                reasoning: true,
                input: ["text"],
                cost: { input: 0.3, output: 1.2, cacheRead: 0.06, cacheWrite: 0.375 },
                contextWindow: 204800,
                maxTokens: 131072,
              },
            ],
          },
        },
      },
    }
    ```

    Ustaw `MINIMAX_API_KEY`. Skróty: `openclaw onboard --auth-choice minimax-global-api` lub `openclaw onboard --auth-choice minimax-cn-api`. Katalog modeli domyślnie zawiera tylko M2.7. Na ścieżce strumieniowania zgodnej z Anthropic OpenClaw domyślnie wyłącza myślenie MiniMax, chyba że jawnie ustawisz `thinking` samodzielnie. `/fast on` lub `params.fastMode: true` przepisuje `MiniMax-M2.7` na `MiniMax-M2.7-highspeed`.

  </Accordion>
  <Accordion title="Moonshot AI (Kimi)">
    ```json5
    {
      env: { MOONSHOT_API_KEY: "sk-..." },
      agents: {
        defaults: {
          model: { primary: "moonshot/kimi-k2.6" },
          models: { "moonshot/kimi-k2.6": { alias: "Kimi K2.6" } },
        },
      },
      models: {
        mode: "merge",
        providers: {
          moonshot: {
            baseUrl: "https://api.moonshot.ai/v1",
            apiKey: "${MOONSHOT_API_KEY}",
            api: "openai-completions",
            models: [
              {
                id: "kimi-k2.6",
                name: "Kimi K2.6",
                reasoning: false,
                input: ["text", "image"],
                cost: { input: 0.95, output: 4, cacheRead: 0.16, cacheWrite: 0 },
                contextWindow: 262144,
                maxTokens: 262144,
              },
            ],
          },
        },
      },
    }
    ```

    Dla punktu końcowego w Chinach: `baseUrl: "https://api.moonshot.cn/v1"` lub `openclaw onboard --auth-choice moonshot-api-key-cn`.

    Natywne punkty końcowe Moonshot deklarują zgodność użycia strumieniowania we wspólnym transporcie `openai-completions`, a OpenClaw opiera to na możliwościach punktu końcowego, a nie wyłącznie na wbudowanym identyfikatorze dostawcy.

  </Accordion>
  <Accordion title="OpenCode">
    ```json5
    {
      agents: {
        defaults: {
          model: { primary: "opencode/claude-opus-4-6" },
          models: { "opencode/claude-opus-4-6": { alias: "Opus" } },
        },
      },
    }
    ```

    Ustaw `OPENCODE_API_KEY` (lub `OPENCODE_ZEN_API_KEY`). Używaj odwołań `opencode/...` dla katalogu Zen albo odwołań `opencode-go/...` dla katalogu Go. Skrót: `openclaw onboard --auth-choice opencode-zen` lub `openclaw onboard --auth-choice opencode-go`.

  </Accordion>
  <Accordion title="Synthetic (zgodny z Anthropic)">
    ```json5
    {
      env: { SYNTHETIC_API_KEY: "sk-..." },
      agents: {
        defaults: {
          model: { primary: "synthetic/hf:MiniMaxAI/MiniMax-M2.5" },
          models: { "synthetic/hf:MiniMaxAI/MiniMax-M2.5": { alias: "MiniMax M2.5" } },
        },
      },
      models: {
        mode: "merge",
        providers: {
          synthetic: {
            baseUrl: "https://api.synthetic.new/anthropic",
            apiKey: "${SYNTHETIC_API_KEY}",
            api: "anthropic-messages",
            models: [
              {
                id: "hf:MiniMaxAI/MiniMax-M2.5",
                name: "MiniMax M2.5",
                reasoning: true,
                input: ["text"],
                cost: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0 },
                contextWindow: 192000,
                maxTokens: 65536,
              },
            ],
          },
        },
      },
    }
    ```

    Bazowy URL powinien pomijać `/v1` (klient Anthropic dodaje go sam). Skrót: `openclaw onboard --auth-choice synthetic-api-key`.

  </Accordion>
  <Accordion title="Z.AI (GLM-4.7)">
    ```json5
    {
      agents: {
        defaults: {
          model: { primary: "zai/glm-4.7" },
          models: { "zai/glm-4.7": {} },
        },
      },
    }
    ```

    Ustaw `ZAI_API_KEY`. `z.ai/*` i `z-ai/*` są akceptowanymi aliasami. Skrót: `openclaw onboard --auth-choice zai-api-key`.

    - Ogólny punkt końcowy: `https://api.z.ai/api/paas/v4`
    - Punkt końcowy do kodowania (domyślny): `https://api.z.ai/api/coding/paas/v4`
    - Dla ogólnego punktu końcowego zdefiniuj niestandardowego dostawcę z nadpisaniem bazowego URL.

  </Accordion>
</AccordionGroup>

---

## Powiązane

- [Konfiguracja — agenci](/pl/gateway/config-agents)
- [Konfiguracja — kanały](/pl/gateway/config-channels)
- [Dokumentacja konfiguracji](/pl/gateway/configuration-reference) — inne klucze najwyższego poziomu
- [Narzędzia i plugins](/pl/tools)
