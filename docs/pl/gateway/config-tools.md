---
read_when:
    - Konfigurowanie polityki `tools.*`, list dozwolonych lub funkcji eksperymentalnych
    - Rejestrowanie niestandardowych dostawców lub nadpisywanie `baseUrl`
    - Konfigurowanie self-hosted punktów końcowych zgodnych z OpenAI
summary: Konfiguracja narzędzi (polityka, przełączniki eksperymentalne, narzędzia wspierane przez dostawcę) oraz konfiguracja niestandardowego dostawcy/`baseUrl`
title: Konfiguracja — narzędzia i niestandardowi dostawcy
x-i18n:
    generated_at: "2026-04-24T09:08:40Z"
    model: gpt-5.4
    provider: openai
    source_hash: 92535fb937f688c7cd39dcf5fc55f4663c8d234388a46611527efad4b7ee85eb
    source_path: gateway/config-tools.md
    workflow: 15
---

Klucze konfiguracji `tools.*` oraz konfiguracja niestandardowego dostawcy / `baseUrl`. Informacje o agentach,
kanałach i innych kluczach konfiguracji najwyższego poziomu znajdziesz w
[Odwołaniu do konfiguracji](/pl/gateway/configuration-reference).

## Narzędzia

### Profile narzędzi

`tools.profile` ustawia bazową listę dozwolonych przed `tools.allow`/`tools.deny`:

Lokalny onboarding domyślnie ustawia nowe lokalne konfiguracje na `tools.profile: "coding"`, gdy wartość nie jest ustawiona (istniejące jawne profile są zachowywane).

| Profil      | Obejmuje                                                                                                                        |
| ----------- | -------------------------------------------------------------------------------------------------------------------------------- |
| `minimal`   | tylko `session_status`                                                                                                           |
| `coding`    | `group:fs`, `group:runtime`, `group:web`, `group:sessions`, `group:memory`, `cron`, `image`, `image_generate`, `video_generate` |
| `messaging` | `group:messaging`, `sessions_list`, `sessions_history`, `sessions_send`, `session_status`                                       |
| `full`      | Brak ograniczeń (tak samo jak brak ustawienia)                                                                                   |

### Grupy narzędzi

| Grupa              | Narzędzia                                                                                                                |
| ------------------ | ------------------------------------------------------------------------------------------------------------------------ |
| `group:runtime`    | `exec`, `process`, `code_execution` (`bash` jest akceptowany jako alias dla `exec`)                                     |
| `group:fs`         | `read`, `write`, `edit`, `apply_patch`                                                                                   |
| `group:sessions`   | `sessions_list`, `sessions_history`, `sessions_send`, `sessions_spawn`, `sessions_yield`, `subagents`, `session_status` |
| `group:memory`     | `memory_search`, `memory_get`                                                                                            |
| `group:web`        | `web_search`, `x_search`, `web_fetch`                                                                                    |
| `group:ui`         | `browser`, `canvas`                                                                                                      |
| `group:automation` | `cron`, `gateway`                                                                                                        |
| `group:messaging`  | `message`                                                                                                                |
| `group:nodes`      | `nodes`                                                                                                                  |
| `group:agents`     | `agents_list`                                                                                                            |
| `group:media`      | `image`, `image_generate`, `video_generate`, `tts`                                                                       |
| `group:openclaw`   | Wszystkie wbudowane narzędzia (z wyłączeniem Pluginów dostawców)                                                         |

### `tools.allow` / `tools.deny`

Globalna polityka dozwalania/zabraniania narzędzi (deny ma pierwszeństwo). Niewrażliwa na wielkość liter, obsługuje wildcardy `*`. Stosowana nawet wtedy, gdy sandbox Docker jest wyłączony.

```json5
{
  tools: { deny: ["browser", "canvas"] },
}
```

### `tools.byProvider`

Dalsze ograniczanie narzędzi dla konkretnych dostawców lub modeli. Kolejność: profil bazowy → profil dostawcy → allow/deny.

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

Steruje dostępem do podwyższonego exec poza sandboxem:

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

- Nadpisanie per agent (`agents.list[].tools.elevated`) może tylko dalej ograniczać.
- `/elevated on|off|ask|full` zapisuje stan per sesja; dyrektywy inline mają zastosowanie do pojedynczej wiadomości.
- Podwyższone `exec` omija sandboxing i używa skonfigurowanej ścieżki ucieczki (`gateway` domyślnie lub `node`, gdy celem exec jest `node`).

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

Kontrole bezpieczeństwa pętli narzędzi są **domyślnie wyłączone**. Ustaw `enabled: true`, aby aktywować wykrywanie.
Ustawienia można definiować globalnie w `tools.loopDetection` i nadpisywać per agent w `agents.list[].tools.loopDetection`.

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

- `historySize`: maksymalna historia wywołań narzędzi przechowywana do analizy pętli.
- `warningThreshold`: próg powtarzającego się wzorca bez postępu dla ostrzeżeń.
- `criticalThreshold`: wyższy próg powtarzania dla blokowania krytycznych pętli.
- `globalCircuitBreakerThreshold`: próg twardego zatrzymania dla dowolnego przebiegu bez postępu.
- `detectors.genericRepeat`: ostrzeganie przy powtarzanych wywołaniach tego samego narzędzia z tymi samymi argumentami.
- `detectors.knownPollNoProgress`: ostrzeganie/blokowanie przy znanych narzędziach odpytywania (`process.poll`, `command_status` itp.).
- `detectors.pingPong`: ostrzeganie/blokowanie przy naprzemiennych wzorcach par bez postępu.
- Jeśli `warningThreshold >= criticalThreshold` lub `criticalThreshold >= globalCircuitBreakerThreshold`, walidacja kończy się niepowodzeniem.

### `tools.web`

```json5
{
  tools: {
    web: {
      search: {
        enabled: true,
        apiKey: "brave_api_key", // lub zmienna env BRAVE_API_KEY
        maxResults: 5,
        timeoutSeconds: 30,
        cacheTtlMinutes: 15,
      },
      fetch: {
        enabled: true,
        provider: "firecrawl", // opcjonalne; pomiń dla automatycznego wykrywania
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

Konfiguruje rozumienie multimediów przychodzących (obraz/audio/wideo):

```json5
{
  tools: {
    media: {
      concurrency: 2,
      asyncCompletion: {
        directSend: false, // opcjonalne: wysyłaj ukończoną asynchroniczną muzykę/wideo bezpośrednio do kanału
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
      video: {
        enabled: true,
        maxBytes: 52428800,
        models: [{ provider: "google", model: "gemini-3-flash-preview" }],
      },
    },
  },
}
```

<Accordion title="Pola wpisu modelu multimediów">

**Wpis dostawcy** (`type: "provider"` lub pominięte):

- `provider`: identyfikator dostawcy API (`openai`, `anthropic`, `google`/`gemini`, `groq` itd.)
- `model`: nadpisanie identyfikatora modelu
- `profile` / `preferredProfile`: wybór profilu z `auth-profiles.json`

**Wpis CLI** (`type: "cli"`):

- `command`: wykonywalny program do uruchomienia
- `args`: argumenty z szablonami (obsługuje `{{MediaPath}}`, `{{Prompt}}`, `{{MaxChars}}` itd.)

**Pola wspólne:**

- `capabilities`: opcjonalna lista (`image`, `audio`, `video`). Domyślnie: `openai`/`anthropic`/`minimax` → image, `google` → image+audio+video, `groq` → audio.
- `prompt`, `maxChars`, `maxBytes`, `timeoutSeconds`, `language`: nadpisania per wpis.
- Błędy powodują fallback do następnego wpisu.

Uwierzytelnianie dostawcy przebiega według standardowej kolejności: `auth-profiles.json` → zmienne środowiskowe → `models.providers.*.apiKey`.

**Pola asynchronicznego zakończenia:**

- `asyncCompletion.directSend`: gdy ma wartość `true`, ukończone asynchroniczne zadania `music_generate`
  i `video_generate` najpierw próbują bezpośredniego dostarczenia do kanału. Domyślnie: `false`
  (starsza ścieżka wybudzania sesji żądającego/dostarczania modelu).

</Accordion>

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

Steruje tym, które sesje mogą być celem dla narzędzi sesji (`sessions_list`, `sessions_history`, `sessions_send`).

Domyślnie: `tree` (bieżąca sesja + sesje uruchomione przez nią, takie jak podagenci).

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

Uwagi:

- `self`: tylko bieżący klucz sesji.
- `tree`: bieżąca sesja + sesje uruchomione przez bieżącą sesję (podagenci).
- `agent`: dowolna sesja należąca do bieżącego identyfikatora agenta (może obejmować innych użytkowników, jeśli uruchamiasz sesje per nadawca pod tym samym identyfikatorem agenta).
- `all`: dowolna sesja. Kierowanie między agentami nadal wymaga `tools.agentToAgent`.
- Ograniczenie sandboxa: gdy bieżąca sesja jest w sandboxie i `agents.defaults.sandbox.sessionToolsVisibility="spawned"`, widoczność jest wymuszana na `tree`, nawet jeśli `tools.sessions.visibility="all"`.

### `tools.sessions_spawn`

Steruje obsługą załączników inline dla `sessions_spawn`.

```json5
{
  tools: {
    sessions_spawn: {
      attachments: {
        enabled: false, // opcjonalne: ustaw true, aby zezwolić na załączniki plikowe inline
        maxTotalBytes: 5242880, // 5 MB łącznie dla wszystkich plików
        maxFiles: 50,
        maxFileBytes: 1048576, // 1 MB na plik
        retainOnSessionKeep: false, // zachowaj załączniki, gdy cleanup="keep"
      },
    },
  },
}
```

Uwagi:

- Załączniki są obsługiwane tylko dla `runtime: "subagent"`. Runtime ACP je odrzuca.
- Pliki są materializowane w przestrzeni roboczej dziecka w `.openclaw/attachments/<uuid>/` z plikiem `.manifest.json`.
- Zawartość załączników jest automatycznie redagowana przy utrwalaniu transkryptu.
- Dane wejściowe Base64 są walidowane ścisłymi kontrolami alfabetu/dopełnienia oraz zabezpieczeniem rozmiaru przed dekodowaniem.
- Uprawnienia plików to `0700` dla katalogów i `0600` dla plików.
- Czyszczenie podąża za polityką `cleanup`: `delete` zawsze usuwa załączniki; `keep` zachowuje je tylko wtedy, gdy `retainOnSessionKeep: true`.

<a id="toolsexperimental"></a>

### `tools.experimental`

Eksperymentalne flagi wbudowanych narzędzi. Domyślnie wyłączone, chyba że działa reguła automatycznego włączenia strict-agentic GPT-5.

```json5
{
  tools: {
    experimental: {
      planTool: true, // włącz eksperymentalne update_plan
    },
  },
}
```

Uwagi:

- `planTool`: włącza ustrukturyzowane narzędzie `update_plan` do śledzenia nietrywialnej pracy wieloetapowej.
- Domyślnie: `false`, chyba że `agents.defaults.embeddedPi.executionContract` (lub nadpisanie per agent) jest ustawione na `"strict-agentic"` dla uruchomienia rodziny GPT-5 OpenAI lub OpenAI Codex. Ustaw `true`, aby wymusić włączenie narzędzia poza tym zakresem, albo `false`, aby pozostawić je wyłączone nawet dla uruchomień strict-agentic GPT-5.
- Gdy jest włączone, prompt systemowy dodaje także wskazówki użycia, aby model używał go tylko do istotnej pracy i utrzymywał co najwyżej jeden krok `in_progress`.

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

- `model`: domyślny model dla uruchamianych podagentów. Jeśli pominięto, podagenci dziedziczą model wywołującego.
- `allowAgents`: domyślna lista dozwolonych identyfikatorów agentów docelowych dla `sessions_spawn`, gdy agent żądający nie ustawia własnego `subagents.allowAgents` (`["*"]` = dowolny; domyślnie: tylko ten sam agent).
- `runTimeoutSeconds`: domyślny limit czasu (sekundy) dla `sessions_spawn`, gdy wywołanie narzędzia pomija `runTimeoutSeconds`. `0` oznacza brak limitu czasu.
- Polityka narzędzi per podagent: `tools.subagents.tools.allow` / `tools.subagents.tools.deny`.

---

## Niestandardowi dostawcy i `baseUrl`

OpenClaw używa wbudowanego katalogu modeli. Dodaj niestandardowych dostawców przez `models.providers` w konfiguracji lub `~/.openclaw/agents/<agentId>/agent/models.json`.

```json5
{
  models: {
    mode: "merge", // merge (domyślnie) | replace
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

- Użyj `authHeader: true` + `headers` dla niestandardowych potrzeb uwierzytelniania.
- Nadpisz katalog główny konfiguracji agenta przez `OPENCLAW_AGENT_DIR` (lub `PI_CODING_AGENT_DIR`, starszy alias zmiennej środowiskowej).
- Pierwszeństwo scalania dla pasujących identyfikatorów dostawców:
  - Niepuste wartości `baseUrl` w `models.json` agenta mają pierwszeństwo.
  - Niepuste wartości `apiKey` agenta mają pierwszeństwo tylko wtedy, gdy ten dostawca nie jest zarządzany przez SecretRef w bieżącym kontekście konfiguracji/profilu uwierzytelniania.
  - Wartości `apiKey` dostawców zarządzanych przez SecretRef są odświeżane z markerów źródła (`ENV_VAR_NAME` dla referencji env, `secretref-managed` dla referencji file/exec) zamiast utrwalania rozstrzygniętych sekretów.
  - Wartości nagłówków dostawców zarządzanych przez SecretRef są odświeżane z markerów źródła (`secretref-env:ENV_VAR_NAME` dla referencji env, `secretref-managed` dla referencji file/exec).
  - Puste lub brakujące `apiKey`/`baseUrl` agenta używają fallbacku do `models.providers` w konfiguracji.
  - Dla pasujących modeli `contextWindow`/`maxTokens` używają wyższej wartości z jawnej konfiguracji i niejawnych wartości katalogu.
  - Dla pasujących modeli `contextTokens` zachowuje jawny limit runtime, gdy istnieje; użyj tego, aby ograniczyć efektywny kontekst bez zmiany natywnych metadanych modelu.
  - Użyj `models.mode: "replace"`, gdy chcesz, aby konfiguracja całkowicie przepisała `models.json`.
  - Utrwalanie markerów jest autorytatywne względem źródła: markery są zapisywane z migawki aktywnej konfiguracji źródłowej (przed rozstrzyganiem), a nie z rozstrzygniętych wartości sekretów w czasie działania.

### Szczegóły pól dostawcy

- `models.mode`: zachowanie katalogu dostawców (`merge` lub `replace`).
- `models.providers`: mapa niestandardowych dostawców kluczowana identyfikatorem dostawcy.
  - Bezpieczne edycje: używaj `openclaw config set models.providers.<id> '<json>' --strict-json --merge` lub `openclaw config set models.providers.<id>.models '<json-array>' --strict-json --merge` do aktualizacji addytywnych. `config set` odmawia destrukcyjnych zastąpień, jeśli nie przekażesz `--replace`.
- `models.providers.*.api`: adapter żądań (`openai-completions`, `openai-responses`, `anthropic-messages`, `google-generative-ai` itd.).
- `models.providers.*.apiKey`: poświadczenie dostawcy (preferowane SecretRef/podstawienie env).
- `models.providers.*.auth`: strategia uwierzytelniania (`api-key`, `token`, `oauth`, `aws-sdk`).
- `models.providers.*.injectNumCtxForOpenAICompat`: dla Ollama + `openai-completions` wstrzykuje `options.num_ctx` do żądań (domyślnie: `true`).
- `models.providers.*.authHeader`: wymusza przesyłanie poświadczeń w nagłówku `Authorization`, gdy jest to wymagane.
- `models.providers.*.baseUrl`: bazowy URL nadrzędnego API.
- `models.providers.*.headers`: dodatkowe statyczne nagłówki do routingu proxy/dzierżawy.
- `models.providers.*.request`: nadpisania transportu dla żądań HTTP dostawcy modeli.
  - `request.headers`: dodatkowe nagłówki (scalane z domyślnymi nagłówkami dostawcy). Wartości akceptują SecretRef.
  - `request.auth`: nadpisanie strategii uwierzytelniania. Tryby: `"provider-default"` (użyj wbudowanego uwierzytelniania dostawcy), `"authorization-bearer"` (z `token`), `"header"` (z `headerName`, `value`, opcjonalnym `prefix`).
  - `request.proxy`: nadpisanie proxy HTTP. Tryby: `"env-proxy"` (użyj zmiennych środowiskowych `HTTP_PROXY`/`HTTPS_PROXY`), `"explicit-proxy"` (z `url`). Oba tryby akceptują opcjonalny podobiekt `tls`.
  - `request.tls`: nadpisanie TLS dla połączeń bezpośrednich. Pola: `ca`, `cert`, `key`, `passphrase` (wszystkie akceptują SecretRef), `serverName`, `insecureSkipVerify`.
  - `request.allowPrivateNetwork`: gdy ma wartość `true`, zezwala na HTTPS do `baseUrl`, gdy DNS rozstrzyga do zakresów prywatnych, CGNAT lub podobnych, przez ochronę pobierania HTTP dostawcy (świadoma zgoda operatora dla zaufanych self-hosted punktów końcowych zgodnych z OpenAI). WebSocket używa tego samego `request` dla nagłówków/TLS, ale nie dla tej ochrony SSRF pobierania. Domyślnie `false`.
- `models.providers.*.models`: jawne wpisy katalogu modeli dostawcy.
- `models.providers.*.models.*.contextWindow`: natywne metadane okna kontekstu modelu.
- `models.providers.*.models.*.contextTokens`: opcjonalny limit kontekstu runtime. Użyj tego, gdy chcesz mniejszy efektywny budżet kontekstu niż natywne `contextWindow` modelu.
- `models.providers.*.models.*.compat.supportsDeveloperRole`: opcjonalna wskazówka zgodności. Dla `api: "openai-completions"` z niepustym, nienatywnym `baseUrl` (host inny niż `api.openai.com`) OpenClaw wymusza w runtime wartość `false`. Puste/pominięte `baseUrl` zachowuje domyślne zachowanie OpenAI.
- `models.providers.*.models.*.compat.requiresStringContent`: opcjonalna wskazówka zgodności dla punktów końcowych czatu zgodnych z OpenAI obsługujących tylko ciągi znaków. Gdy ma wartość `true`, OpenClaw spłaszcza czysto tekstowe tablice `messages[].content` do zwykłych ciągów przed wysłaniem żądania.
- `plugins.entries.amazon-bedrock.config.discovery`: główny poziom ustawień automatycznego wykrywania Bedrock.
- `plugins.entries.amazon-bedrock.config.discovery.enabled`: włącza/wyłącza niejawne wykrywanie.
- `plugins.entries.amazon-bedrock.config.discovery.region`: region AWS do wykrywania.
- `plugins.entries.amazon-bedrock.config.discovery.providerFilter`: opcjonalny filtr identyfikatora dostawcy do ukierunkowanego wykrywania.
- `plugins.entries.amazon-bedrock.config.discovery.refreshInterval`: interwał odpytywania odświeżania wykrywania.
- `plugins.entries.amazon-bedrock.config.discovery.defaultContextWindow`: zapasowe okno kontekstu dla wykrytych modeli.
- `plugins.entries.amazon-bedrock.config.discovery.defaultMaxTokens`: zapasowa maksymalna liczba tokenów wyjściowych dla wykrytych modeli.

### Przykłady dostawców

<Accordion title="Cerebras (GLM 4.6 / 4.7)">

```json5
{
  env: { CEREBRAS_API_KEY: "sk-..." },
  agents: {
    defaults: {
      model: {
        primary: "cerebras/zai-glm-4.7",
        fallbacks: ["cerebras/zai-glm-4.6"],
      },
      models: {
        "cerebras/zai-glm-4.7": { alias: "GLM 4.7 (Cerebras)" },
        "cerebras/zai-glm-4.6": { alias: "GLM 4.6 (Cerebras)" },
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
          { id: "zai-glm-4.6", name: "GLM 4.6 (Cerebras)" },
        ],
      },
    },
  },
}
```

Użyj `cerebras/zai-glm-4.7` dla Cerebras; `zai/glm-4.7` dla bezpośredniego Z.AI.

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

Ustaw `OPENCODE_API_KEY` (lub `OPENCODE_ZEN_API_KEY`). Używaj referencji `opencode/...` dla katalogu Zen albo `opencode-go/...` dla katalogu Go. Skrót: `openclaw onboard --auth-choice opencode-zen` lub `openclaw onboard --auth-choice opencode-go`.

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
- Punkt końcowy kodowania (domyślny): `https://api.z.ai/api/coding/paas/v4`
- Dla ogólnego punktu końcowego zdefiniuj niestandardowego dostawcę z nadpisaniem `baseUrl`.

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

Dla punktu końcowego China: `baseUrl: "https://api.moonshot.cn/v1"` lub `openclaw onboard --auth-choice moonshot-api-key-cn`.

Natywne punkty końcowe Moonshot reklamują zgodność z użyciem streamingu na współdzielonym
transporcie `openai-completions`, a OpenClaw opiera to na możliwościach punktu końcowego,
a nie tylko na identyfikatorze wbudowanego dostawcy.

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

`baseUrl` powinien pomijać `/v1` (klient Anthropic dopisuje je sam). Skrót: `openclaw onboard --auth-choice synthetic-api-key`.

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
            input: ["text", "image"],
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

Ustaw `MINIMAX_API_KEY`. Skróty:
`openclaw onboard --auth-choice minimax-global-api` lub
`openclaw onboard --auth-choice minimax-cn-api`.
Katalog modeli domyślnie obejmuje tylko M2.7.
Na ścieżce streamingu zgodnej z Anthropic OpenClaw domyślnie wyłącza myślenie MiniMax,
chyba że jawnie ustawisz `thinking`. `/fast on` lub
`params.fastMode: true` przepisuje `MiniMax-M2.7` na
`MiniMax-M2.7-highspeed`.

</Accordion>

<Accordion title="Modele lokalne (LM Studio)">

Zobacz [Local Models](/pl/gateway/local-models). W skrócie: uruchamiaj duży model lokalny przez API Responses LM Studio na odpowiednio wydajnym sprzęcie; zachowaj scalenie modeli hostowanych jako fallback.

</Accordion>

---

## Powiązane

- [Odwołanie do konfiguracji](/pl/gateway/configuration-reference) — inne klucze najwyższego poziomu
- [Konfiguracja — agenci](/pl/gateway/config-agents)
- [Konfiguracja — kanały](/pl/gateway/config-channels)
- [Narzędzia i Pluginy](/pl/tools)
