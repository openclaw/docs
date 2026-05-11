---
read_when:
    - Konfigurowanie polityki `tools.*`, list dozwolonych lub funkcji eksperymentalnych
    - Rejestrowanie niestandardowych dostawców lub nadpisywanie bazowych adresów URL
    - Konfigurowanie samodzielnie hostowanych punktów końcowych zgodnych z OpenAI
sidebarTitle: Tools and custom providers
summary: Konfiguracja narzędzi (zasady, przełączniki eksperymentalne, narzędzia oparte na dostawcy) i niestandardowa konfiguracja dostawcy/bazowego adresu URL
title: Konfiguracja — narzędzia i niestandardowi dostawcy
x-i18n:
    generated_at: "2026-05-11T20:29:58Z"
    model: gpt-5.5
    provider: openai
    source_hash: c9ab0ec823da1e2e8598d9efb998a207c4486ba82dcf4dd65422c6bf90581b46
    source_path: gateway/config-tools.md
    workflow: 16
---

`tools.*` klucze konfiguracji oraz konfiguracja niestandardowego dostawcy / bazowego URL-a. Informacje o agentach, kanałach i innych kluczach konfiguracji najwyższego poziomu znajdziesz w [dokumentacji konfiguracji](/pl/gateway/configuration-reference).

## Narzędzia

### Profile narzędzi

`tools.profile` ustawia bazową listę dozwolonych narzędzi przed `tools.allow`/`tools.deny`:

<Note>
Lokalne wdrażanie domyślnie ustawia w nowych lokalnych konfiguracjach `tools.profile: "coding"`, gdy nie jest ustawione (istniejące jawne profile są zachowywane).
</Note>

| Profil      | Obejmuje                                                                                                                        |
| ----------- | ------------------------------------------------------------------------------------------------------------------------------- |
| `minimal`   | tylko `session_status`                                                                                                          |
| `coding`    | `group:fs`, `group:runtime`, `group:web`, `group:sessions`, `group:memory`, `cron`, `image`, `image_generate`, `video_generate` |
| `messaging` | `group:messaging`, `sessions_list`, `sessions_history`, `sessions_send`, `session_status`                                       |
| `full`      | Bez ograniczeń (tak samo jak brak ustawienia)                                                                                   |

### Grupy narzędzi

| Grupa              | Narzędzia                                                                                                               |
| ------------------ | ----------------------------------------------------------------------------------------------------------------------- |
| `group:runtime`    | `exec`, `process`, `code_execution` (`bash` jest akceptowane jako alias dla `exec`)                                     |
| `group:fs`         | `read`, `write`, `edit`, `apply_patch`                                                                                  |
| `group:sessions`   | `sessions_list`, `sessions_history`, `sessions_send`, `sessions_spawn`, `sessions_yield`, `subagents`, `session_status` |
| `group:memory`     | `memory_search`, `memory_get`                                                                                           |
| `group:web`        | `web_search`, `x_search`, `web_fetch`                                                                                   |
| `group:ui`         | `browser`, `canvas`                                                                                                     |
| `group:automation` | `heartbeat_respond`, `cron`, `gateway`                                                                                  |
| `group:messaging`  | `message`                                                                                                               |
| `group:nodes`      | `nodes`                                                                                                                 |
| `group:agents`     | `agents_list`, `update_plan`                                                                                            |
| `group:media`      | `image`, `image_generate`, `music_generate`, `video_generate`, `tts`                                                    |
| `group:openclaw`   | Wszystkie wbudowane narzędzia (z wyłączeniem pluginów dostawców)                                                        |

### `tools.allow` / `tools.deny`

Globalna polityka zezwalania/odmawiania narzędzi (odmowa wygrywa). Bez rozróżniania wielkości liter, obsługuje symbole wieloznaczne `*`. Stosowana nawet wtedy, gdy sandbox Docker jest wyłączony.

```json5
{
  tools: { deny: ["browser", "canvas"] },
}
```

`write` i `apply_patch` to oddzielne identyfikatory narzędzi. `allow: ["write"]` włącza też `apply_patch` dla zgodnych modeli, ale `deny: ["write"]` nie blokuje `apply_patch`. Aby zablokować wszystkie mutacje plików, odmów `group:fs` albo jawnie wymień każde narzędzie modyfikujące:

```json5
{
  tools: { deny: ["write", "edit", "apply_patch"] },
}
```

### `tools.byProvider`

Dodatkowo ogranicza narzędzia dla konkretnych dostawców lub modeli. Kolejność: profil bazowy → profil dostawcy → allow/deny.

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

### `tools.toolsBySender`

Ogranicza narzędzia dla konkretnej tożsamości zgłaszającego. To obrona warstwowa ponad kontrolą dostępu kanału; wartości nadawcy muszą pochodzić z adaptera kanału, a nie z tekstu wiadomości.

```json5
{
  tools: {
    toolsBySender: {
      "channel:discord:1234567890123": { alsoAllow: ["group:fs"] },
      "id:guest-user-id": { deny: ["group:runtime", "group:fs"] },
      "*": { deny: ["exec", "process", "write", "edit", "apply_patch"] },
    },
  },
}
```

Klucze używają jawnych prefiksów: `channel:<channelId>:<senderId>`, `id:<senderId>`, `e164:<phone>`, `username:<handle>`, `name:<displayName>` albo `"*"`. Identyfikatory kanałów to kanoniczne identyfikatory OpenClaw; aliasy takie jak `teams` są normalizowane do `msteams`. Starsze klucze bez prefiksu są akceptowane wyłącznie jako `id:`. Kolejność dopasowania to channel+id, id, e164, username, name, a potem symbol wieloznaczny.

`agents.list[].tools.toolsBySender` przypisane do agenta zastępuje globalne dopasowanie nadawcy, gdy pasuje, nawet przy pustej polityce `{}`.

### `tools.elevated`

Kontroluje podwyższony dostęp `exec` poza sandboxem:

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

- Nadpisanie dla agenta (`agents.list[].tools.elevated`) może tylko dalej ograniczać.
- `/elevated on|off|ask|full` zapisuje stan dla sesji; dyrektywy inline dotyczą pojedynczej wiadomości.
- Podwyższony `exec` omija sandboxing i używa skonfigurowanej ścieżki ucieczki (`gateway` domyślnie albo `node`, gdy celem `exec` jest `node`).

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
      commandHighlighting: false,
      applyPatch: {
        enabled: false,
        allowModels: ["gpt-5.5"],
      },
    },
  },
}
```

### `tools.loopDetection`

Kontrole bezpieczeństwa pętli narzędzi są **domyślnie wyłączone**. Ustaw `enabled: true`, aby aktywować wykrywanie. Ustawienia można definiować globalnie w `tools.loopDetection` i nadpisywać dla poszczególnych agentów w `agents.list[].tools.loopDetection`.

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
  Maksymalna historia wywołań narzędzi przechowywana do analizy pętli.
</ParamField>
<ParamField path="warningThreshold" type="number">
  Próg powtarzającego się wzorca bez postępu dla ostrzeżeń.
</ParamField>
<ParamField path="criticalThreshold" type="number">
  Wyższy próg powtórzeń do blokowania krytycznych pętli.
</ParamField>
<ParamField path="globalCircuitBreakerThreshold" type="number">
  Twardy próg zatrzymania dla dowolnej serii bez postępu.
</ParamField>
<ParamField path="detectors.genericRepeat" type="boolean">
  Ostrzegaj przy powtarzanych wywołaniach tego samego narzędzia z tymi samymi argumentami.
</ParamField>
<ParamField path="detectors.knownPollNoProgress" type="boolean">
  Ostrzegaj/blokuj przy znanych narzędziach odpytywania (`process.poll`, `command_status` itp.).
</ParamField>
<ParamField path="detectors.pingPong" type="boolean">
  Ostrzegaj/blokuj przy naprzemiennych parach wzorców bez postępu.
</ParamField>

<Warning>
Jeśli `warningThreshold >= criticalThreshold` lub `criticalThreshold >= globalCircuitBreakerThreshold`, walidacja kończy się niepowodzeniem.
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

Konfiguruje rozumienie przychodzących multimediów (obraz/audio/wideo):

```json5
{
  tools: {
    media: {
      concurrency: 2,
      asyncCompletion: {
        directSend: false, // deprecated: completions stay agent-mediated
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

    - `provider`: identyfikator dostawcy API (`openai`, `anthropic`, `google`/`gemini`, `groq` itp.)
    - `model`: nadpisanie identyfikatora modelu
    - `profile` / `preferredProfile`: wybór profilu `auth-profiles.json`

    **Wpis CLI** (`type: "cli"`):

    - `command`: plik wykonywalny do uruchomienia
    - `args`: argumenty szablonowe (obsługuje `{{MediaPath}}`, `{{Prompt}}`, `{{MaxChars}}` itp.; `openclaw doctor --fix` migruje przestarzałe symbole zastępcze `{input}` do `{{MediaPath}}`)

    **Wspólne pola:**

    - `capabilities`: opcjonalna lista (`image`, `audio`, `video`). Domyślnie: `openai`/`anthropic`/`minimax` → obraz, `google` → obraz+audio+wideo, `groq` → audio.
    - `prompt`, `maxChars`, `maxBytes`, `timeoutSeconds`, `language`: nadpisania dla wpisu.
    - `tools.media.image.timeoutSeconds` oraz odpowiadające wpisy `timeoutSeconds` modeli obrazu mają zastosowanie także wtedy, gdy agent wywołuje jawne narzędzie `image`.
    - Niepowodzenia przełączają obsługę na następny wpis.

    Uwierzytelnianie dostawcy używa standardowej kolejności: `auth-profiles.json` → zmienne env → `models.providers.*.apiKey`.

    **Pola ukończenia asynchronicznego:**

    - `asyncCompletion.directSend`: przestarzała flaga zgodności. Ukończone asynchroniczne zadania multimedialne pozostają pośredniczone przez sesję żądającego, aby agent otrzymał wynik, zdecydował, jak poinformować użytkownika, i użył narzędzia wiadomości, gdy wymaga tego dostarczenie źródłowe.

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

Domyślnie: `tree` (bieżąca sesja + sesje przez nią utworzone, takie jak podagenci).

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
    - `tree`: bieżąca sesja + sesje utworzone przez bieżącą sesję (podagenci).
    - `agent`: dowolna sesja należąca do bieżącego identyfikatora agenta (może obejmować innych użytkowników, jeśli uruchamiasz sesje dla poszczególnych nadawców pod tym samym identyfikatorem agenta).
    - `all`: dowolna sesja. Kierowanie między agentami nadal wymaga `tools.agentToAgent`.
    - Ograniczenie piaskownicy: gdy bieżąca sesja działa w piaskownicy i `agents.defaults.sandbox.sessionToolsVisibility="spawned"`, widoczność jest wymuszana na `tree`, nawet jeśli `tools.sessions.visibility="all"`.

  </Accordion>
</AccordionGroup>

### `tools.sessions_spawn`

Kontroluje obsługę załączników inline dla `sessions_spawn`.

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
    - Załączniki są obsługiwane tylko dla `runtime: "subagent"`. Środowisko wykonawcze ACP je odrzuca.
    - Pliki są materializowane w podrzędnym obszarze roboczym w `.openclaw/attachments/<uuid>/` z plikiem `.manifest.json`.
    - Zawartość załączników jest automatycznie redagowana z utrwalania transkryptu.
    - Dane wejściowe Base64 są weryfikowane przez ścisłe sprawdzanie alfabetu/wypełnienia oraz zabezpieczenie rozmiaru przed dekodowaniem.
    - Uprawnienia plików to `0700` dla katalogów i `0600` dla plików.
    - Czyszczenie jest zgodne z zasadą `cleanup`: `delete` zawsze usuwa załączniki; `keep` zachowuje je tylko wtedy, gdy `retainOnSessionKeep: true`.

  </Accordion>
</AccordionGroup>

<a id="toolsexperimental"></a>

### `tools.experimental`

Eksperymentalne flagi wbudowanych narzędzi. Domyślnie wyłączone, chyba że ma zastosowanie reguła automatycznego włączania dla strict-agentic GPT-5.

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
- Domyślnie: `false`, chyba że `agents.defaults.embeddedPi.executionContract` (albo nadpisanie dla konkretnego agenta) jest ustawione na `"strict-agentic"` dla uruchomienia z rodziny OpenAI lub OpenAI Codex GPT-5. Ustaw `true`, aby wymusić włączenie narzędzia poza tym zakresem, albo `false`, aby pozostawić je wyłączone nawet dla uruchomień strict-agentic GPT-5.
- Po włączeniu prompt systemowy dodaje też wskazówki użycia, aby model używał go tylko do znaczącej pracy i utrzymywał najwyżej jeden krok `in_progress`.

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
        announceTimeoutMs: 120000,
        archiveAfterMinutes: 60,
      },
    },
  },
}
```

- `model`: domyślny model dla uruchamianych podagentów. Jeśli zostanie pominięty, podagenci dziedziczą model wywołującego.
- `allowAgents`: domyślna lista dozwolonych identyfikatorów agentów docelowych dla `sessions_spawn`, gdy agent żądający nie ustawia własnego `subagents.allowAgents` (`["*"]` = dowolny; domyślnie: tylko ten sam agent).
- `runTimeoutSeconds`: domyślny limit czasu (w sekundach) dla `sessions_spawn`, gdy wywołanie narzędzia pomija `runTimeoutSeconds`. `0` oznacza brak limitu czasu.
- `announceTimeoutMs`: limit czasu dla pojedynczego wywołania (w milisekundach) dla prób dostarczenia ogłoszenia `agent` przez gateway. Domyślnie: `120000`. Przejściowe ponowienia mogą sprawić, że łączny czas oczekiwania na ogłoszenie będzie dłuższy niż jeden skonfigurowany limit czasu.
- Zasada narzędzi dla podagentów: `tools.subagents.tools.allow` / `tools.subagents.tools.deny`.

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
  <Accordion title="Uwierzytelnianie i priorytet scalania">
    - Użyj `authHeader: true` + `headers` dla niestandardowych potrzeb uwierzytelniania.
    - Nadpisz katalog główny konfiguracji agenta za pomocą `OPENCLAW_AGENT_DIR` (albo `PI_CODING_AGENT_DIR`, starszego aliasu zmiennej środowiskowej).
    - Priorytet scalania dla pasujących identyfikatorów dostawców:
      - Niepuste wartości `baseUrl` z `models.json` agenta wygrywają.
      - Niepuste wartości `apiKey` agenta wygrywają tylko wtedy, gdy ten dostawca nie jest zarządzany przez SecretRef w bieżącym kontekście konfiguracji/profilu uwierzytelniania.
      - Wartości `apiKey` dostawcy zarządzanego przez SecretRef są odświeżane ze znaczników źródłowych (`ENV_VAR_NAME` dla odwołań do zmiennych środowiskowych, `secretref-managed` dla odwołań do plików/wykonań) zamiast utrwalania rozwiązanych sekretów.
      - Wartości nagłówków dostawcy zarządzanego przez SecretRef są odświeżane ze znaczników źródłowych (`secretref-env:ENV_VAR_NAME` dla odwołań do zmiennych środowiskowych, `secretref-managed` dla odwołań do plików/wykonań).
      - Puste lub brakujące `apiKey`/`baseUrl` agenta wracają do `models.providers` w konfiguracji.
      - Pasujące `contextWindow`/`maxTokens` modelu używają wyższej wartości spośród jawnej konfiguracji i niejawnych wartości katalogu.
      - Pasujące `contextTokens` modelu zachowuje jawny limit środowiska wykonawczego, gdy jest obecny; użyj go, aby ograniczyć efektywny kontekst bez zmieniania natywnych metadanych modelu.
      - Użyj `models.mode: "replace"`, gdy chcesz, aby konfiguracja całkowicie przepisała `models.json`.
      - Utrwalanie znaczników jest autorytatywne względem źródła: znaczniki są zapisywane z aktywnej migawki konfiguracji źródłowej (przed rozwiązaniem), a nie z rozwiązanych wartości sekretów środowiska wykonawczego.

  </Accordion>
</AccordionGroup>

### Szczegóły pól dostawcy

<AccordionGroup>
  <Accordion title="Katalog najwyższego poziomu">
    - `models.mode`: zachowanie katalogu dostawców (`merge` albo `replace`).
    - `models.providers`: mapa niestandardowych dostawców indeksowana identyfikatorem dostawcy.
      - Bezpieczne edycje: użyj `openclaw config set models.providers.<id> '<json>' --strict-json --merge` albo `openclaw config set models.providers.<id>.models '<json-array>' --strict-json --merge` dla aktualizacji addytywnych. `config set` odmawia destrukcyjnych zastąpień, chyba że przekażesz `--replace`.

  </Accordion>
  <Accordion title="Połączenie i uwierzytelnianie dostawcy">
    - `models.providers.*.api`: adapter żądań (`openai-completions`, `openai-responses`, `anthropic-messages`, `google-generative-ai` itd.). Dla samodzielnie hostowanych backendów `/v1/chat/completions`, takich jak MLX, vLLM, SGLang i większość lokalnych serwerów zgodnych z OpenAI, użyj `openai-completions`. Niestandardowy dostawca z `baseUrl`, ale bez `api`, domyślnie używa `openai-completions`; ustaw `openai-responses` tylko wtedy, gdy backend obsługuje `/v1/responses`.
    - `models.providers.*.apiKey`: poświadczenie dostawcy (preferuj podstawianie SecretRef/zmiennych środowiskowych).
    - `models.providers.*.auth`: strategia uwierzytelniania (`api-key`, `token`, `oauth`, `aws-sdk`).
    - `models.providers.*.contextWindow`: domyślne natywne okno kontekstu dla modeli u tego dostawcy, gdy wpis modelu nie ustawia `contextWindow`.
    - `models.providers.*.contextTokens`: domyślny efektywny limit kontekstu środowiska wykonawczego dla modeli u tego dostawcy, gdy wpis modelu nie ustawia `contextTokens`.
    - `models.providers.*.maxTokens`: domyślny limit tokenów wyjściowych dla modeli u tego dostawcy, gdy wpis modelu nie ustawia `maxTokens`.
    - `models.providers.*.timeoutSeconds`: opcjonalny limit czasu żądania HTTP modelu dla dostawcy w sekundach, obejmujący połączenie, nagłówki, treść oraz obsługę przerwania całego żądania.
    - `models.providers.*.injectNumCtxForOpenAICompat`: dla Ollama + `openai-completions` wstrzykuje `options.num_ctx` do żądań (domyślnie: `true`).
    - `models.providers.*.authHeader`: wymusza przesyłanie poświadczenia w nagłówku `Authorization`, gdy jest to wymagane.
    - `models.providers.*.baseUrl`: bazowy adres URL nadrzędnego API.
    - `models.providers.*.headers`: dodatkowe statyczne nagłówki do routingu proxy/dzierżawcy.

  </Accordion>
  <Accordion title="Nadpisania transportu żądań">
    `models.providers.*.request`: nadpisania transportu dla żądań HTTP dostawcy modelu.

    - `request.headers`: dodatkowe nagłówki (scalane z domyślnymi ustawieniami dostawcy). Wartości akceptują SecretRef.
    - `request.auth`: nadpisanie strategii uwierzytelniania. Tryby: `"provider-default"` (użyj wbudowanego uwierzytelniania dostawcy), `"authorization-bearer"` (z `token`), `"header"` (z `headerName`, `value`, opcjonalnie `prefix`).
    - `request.proxy`: nadpisanie proxy HTTP. Tryby: `"env-proxy"` (użyj zmiennych środowiskowych `HTTP_PROXY`/`HTTPS_PROXY`), `"explicit-proxy"` (z `url`). Oba tryby akceptują opcjonalny podobiekt `tls`.
    - `request.tls`: nadpisanie TLS dla połączeń bezpośrednich. Pola: `ca`, `cert`, `key`, `passphrase` (wszystkie akceptują SecretRef), `serverName`, `insecureSkipVerify`.
    - `request.allowPrivateNetwork`: gdy `true`, zezwala na HTTPS do `baseUrl`, gdy DNS rozwiązuje się do zakresów prywatnych, CGNAT lub podobnych, przez zabezpieczenie pobierania HTTP dostawcy (wybór operatora dla zaufanych, samodzielnie hostowanych punktów końcowych zgodnych z OpenAI). Adresy URL strumienia dostawcy modelu local loopback, takie jak `localhost`, `127.0.0.1` i `[::1]`, są dozwolone automatycznie, chyba że to pole jest jawnie ustawione na `false`; hosty LAN, tailnet i prywatne hosty DNS nadal wymagają zgody. WebSocket używa tego samego `request` dla nagłówków/TLS, ale nie tej bramki SSRF pobierania. Domyślnie `false`.

  </Accordion>
  <Accordion title="Wpisy katalogu modeli">
    - `models.providers.*.models`: jawne wpisy katalogu modeli dostawcy.
    - `models.providers.*.models.*.input`: modalności wejściowe modelu. Użyj `["text"]` dla modeli wyłącznie tekstowych i `["text", "image"]` dla natywnych modeli obrazu/wizji. Załączniki obrazów są wstrzykiwane do tur agenta tylko wtedy, gdy wybrany model jest oznaczony jako obsługujący obrazy.
    - `models.providers.*.models.*.contextWindow`: metadane natywnego okna kontekstu modelu. Nadpisuje to `contextWindow` na poziomie dostawcy dla tego modelu.
    - `models.providers.*.models.*.contextTokens`: opcjonalny limit kontekstu środowiska wykonawczego. Nadpisuje to `contextTokens` na poziomie dostawcy; użyj go, gdy chcesz mniejszy efektywny budżet kontekstu niż natywne `contextWindow` modelu; `openclaw models list` pokazuje obie wartości, gdy się różnią.
    - `models.providers.*.models.*.compat.supportsDeveloperRole`: opcjonalna wskazówka zgodności. Dla `api: "openai-completions"` z niepustym, nienatywnym `baseUrl` (host inny niż `api.openai.com`) OpenClaw wymusza w środowisku wykonawczym wartość `false`. Puste/pominięte `baseUrl` zachowuje domyślne zachowanie OpenAI.
    - `models.providers.*.models.*.compat.requiresStringContent`: opcjonalna wskazówka zgodności dla tekstowych punktów końcowych czatu zgodnych z OpenAI. Gdy `true`, OpenClaw spłaszcza czysto tekstowe tablice `messages[].content` do zwykłych ciągów znaków przed wysłaniem żądania.
    - `models.providers.*.models.*.compat.strictMessageKeys`: opcjonalna wskazówka zgodności dla ścisłych punktów końcowych czatu zgodnych z OpenAI. Gdy `true`, OpenClaw przycina wychodzące obiekty wiadomości Chat Completions do `role` i `content` przed wysłaniem żądania.
    - `models.providers.*.models.*.compat.thinkingFormat`: opcjonalna wskazówka ładunku myślenia. Użyj `"qwen"` dla najwyższopoziomowego `enable_thinking` albo `"qwen-chat-template"` dla `chat_template_kwargs.enable_thinking` na zgodnych z OpenAI serwerach rodziny Qwen, które obsługują kwargs szablonu czatu na poziomie żądania, takich jak vLLM.

  </Accordion>
  <Accordion title="Wykrywanie Amazon Bedrock">
    - `plugins.entries.amazon-bedrock.config.discovery`: katalog główny ustawień automatycznego wykrywania Bedrock.
    - `plugins.entries.amazon-bedrock.config.discovery.enabled`: włącza/wyłącza niejawne wykrywanie.
    - `plugins.entries.amazon-bedrock.config.discovery.region`: region AWS do wykrywania.
    - `plugins.entries.amazon-bedrock.config.discovery.providerFilter`: opcjonalny filtr identyfikatora dostawcy do ukierunkowanego wykrywania.
    - `plugins.entries.amazon-bedrock.config.discovery.refreshInterval`: interwał odpytywania dla odświeżania wykrywania.
    - `plugins.entries.amazon-bedrock.config.discovery.defaultContextWindow`: zastępcze okno kontekstu dla wykrytych modeli.
    - `plugins.entries.amazon-bedrock.config.discovery.defaultMaxTokens`: zastępczy maksymalny limit tokenów wyjściowych dla wykrytych modeli.

  </Accordion>
</AccordionGroup>

Interaktywne wdrażanie niestandardowego providera wnioskuje obsługę wejścia obrazu dla popularnych identyfikatorów modeli wizyjnych, takich jak GPT-4o, Claude, Gemini, Qwen-VL, LLaVA, Pixtral, InternVL, Mllama, MiniCPM-V i GLM-4V, oraz pomija dodatkowe pytanie dla znanych rodzin wyłącznie tekstowych. Nieznane identyfikatory modeli nadal wyświetlają pytanie o obsługę obrazów. Nieinteraktywne wdrażanie używa tego samego wnioskowania; przekaż `--custom-image-input`, aby wymusić metadane obsługujące obrazy, albo `--custom-text-input`, aby wymusić metadane wyłącznie tekstowe.

### Przykłady providerów

<AccordionGroup>
  <Accordion title="Cerebras (GLM 4.7 / GPT OSS)">
    Dołączony plugin providera `cerebras` może skonfigurować to przez `openclaw onboard --auth-choice cerebras-api-key`. Używaj jawnej konfiguracji providera tylko wtedy, gdy nadpisujesz wartości domyślne.

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
          model: { primary: "kimi/kimi-for-coding" },
          models: { "kimi/kimi-for-coding": { alias: "Kimi Code" } },
        },
      },
    }
    ```

    Zgodny z Anthropic, wbudowany provider. Skrót: `openclaw onboard --auth-choice kimi-code-api-key`.

  </Accordion>
  <Accordion title="Local models (LM Studio)">
    Zobacz [Modele lokalne](/pl/gateway/local-models). W skrócie: uruchom duży model lokalny przez LM Studio Responses API na solidnym sprzęcie; zachowaj scalone modele hostowane jako rezerwę.
  </Accordion>
  <Accordion title="MiniMax M2.7 (direct)">
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

    Ustaw `MINIMAX_API_KEY`. Skróty: `openclaw onboard --auth-choice minimax-global-api` albo `openclaw onboard --auth-choice minimax-cn-api`. Katalog modeli domyślnie zawiera tylko M2.7. Na ścieżce streamingu zgodnej z Anthropic OpenClaw domyślnie wyłącza myślenie MiniMax, chyba że samodzielnie jawnie ustawisz `thinking`. `/fast on` albo `params.fastMode: true` przepisuje `MiniMax-M2.7` na `MiniMax-M2.7-highspeed`.

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

    Dla punktu końcowego w Chinach: `baseUrl: "https://api.moonshot.cn/v1"` albo `openclaw onboard --auth-choice moonshot-api-key-cn`.

    Natywne punkty końcowe Moonshot deklarują zgodność użycia streamingu we współdzielonym transporcie `openai-completions`, a OpenClaw opiera to na możliwościach punktu końcowego, a nie wyłącznie na identyfikatorze wbudowanego providera.

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

    Ustaw `OPENCODE_API_KEY` (albo `OPENCODE_ZEN_API_KEY`). Używaj odwołań `opencode/...` dla katalogu Zen albo odwołań `opencode-go/...` dla katalogu Go. Skrót: `openclaw onboard --auth-choice opencode-zen` albo `openclaw onboard --auth-choice opencode-go`.

  </Accordion>
  <Accordion title="Synthetic (Anthropic-compatible)">
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
    - Dla ogólnego punktu końcowego zdefiniuj niestandardowego providera z nadpisaniem bazowego URL.

  </Accordion>
</AccordionGroup>

---

## Powiązane

- [Konfiguracja — agenci](/pl/gateway/config-agents)
- [Konfiguracja — kanały](/pl/gateway/config-channels)
- [Odwołanie konfiguracji](/pl/gateway/configuration-reference) — inne klucze najwyższego poziomu
- [Narzędzia i pluginy](/pl/tools)
