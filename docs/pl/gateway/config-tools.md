---
read_when:
    - Konfigurowanie zasad `tools.*`, list dozwolonych lub funkcji eksperymentalnych
    - Rejestrowanie niestandardowych dostawców lub zastępowanie bazowych adresów URL
    - Konfigurowanie samodzielnie hostowanych endpointów zgodnych z OpenAI
sidebarTitle: Tools and custom providers
summary: Konfiguracja narzędzi (zasady, eksperymentalne przełączniki, narzędzia wspierane przez dostawcę) oraz konfiguracja dostawcy i bazowego adresu URL
title: Konfiguracja — narzędzia i niestandardowi dostawcy
x-i18n:
    generated_at: "2026-06-27T17:31:55Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 65de2ec00c28128071b6c1468417b1025d46be6d189a07ade995e050dde6445f
    source_path: gateway/config-tools.md
    workflow: 16
---

`tools.*` klucze konfiguracji oraz niestandardowa konfiguracja dostawcy / bazowego adresu URL. Informacje o agentach, kanałach i innych kluczach konfiguracji najwyższego poziomu znajdziesz w [dokumentacji konfiguracji](/pl/gateway/configuration-reference).

## Narzędzia

### Profile narzędzi

`tools.profile` ustawia podstawową listę dozwolonych elementów przed `tools.allow`/`tools.deny`:

<Note>
Lokalne wdrażanie domyślnie ustawia nowe lokalne konfiguracje na `tools.profile: "coding"`, gdy wartość nie jest ustawiona (istniejące jawne profile są zachowywane).
</Note>

| Profil      | Obejmuje                                                                                                                                          |
| ----------- | ------------------------------------------------------------------------------------------------------------------------------------------------- |
| `minimal`   | tylko `session_status`                                                                                                                            |
| `coding`    | `group:fs`, `group:runtime`, `group:web`, `group:sessions`, `group:memory`, `cron`, `image`, `image_generate`, `skill_workshop`, `video_generate` |
| `messaging` | `group:messaging`, `sessions_list`, `sessions_history`, `sessions_send`, `session_status`                                                         |
| `full`      | Brak ograniczeń (tak samo jak brak ustawienia)                                                                                                     |

### Grupy narzędzi

| Grupa              | Narzędzia                                                                                                                |
| ------------------ | ------------------------------------------------------------------------------------------------------------------------ |
| `group:runtime`    | `exec`, `process`, `code_execution` (`bash` jest akceptowany jako alias dla `exec`)                                      |
| `group:fs`         | `read`, `write`, `edit`, `apply_patch`                                                                                   |
| `group:sessions`   | `sessions_list`, `sessions_history`, `sessions_send`, `sessions_spawn`, `sessions_yield`, `subagents`, `session_status` |
| `group:memory`     | `memory_search`, `memory_get`                                                                                            |
| `group:web`        | `web_search`, `x_search`, `web_fetch`                                                                                    |
| `group:ui`         | `browser`, `canvas`                                                                                                      |
| `group:automation` | `heartbeat_respond`, `cron`, `gateway`                                                                                   |
| `group:messaging`  | `message`                                                                                                                |
| `group:nodes`      | `nodes`                                                                                                                  |
| `group:agents`     | `agents_list`, `update_plan`                                                                                             |
| `group:media`      | `image`, `image_generate`, `music_generate`, `video_generate`, `tts`                                                     |
| `group:openclaw`   | Wszystkie wbudowane narzędzia (z wyłączeniem Pluginów dostawców)                                                        |
| `group:plugins`    | Narzędzia należące do załadowanych Pluginów, w tym skonfigurowane serwery MCP udostępnione przez `bundle-mcp`            |

### Narzędzia MCP i Pluginów w polityce narzędzi sandboxa

Skonfigurowane serwery MCP są udostępniane jako narzędzia należące do Pluginu pod identyfikatorem Pluginu `bundle-mcp`. Zwykłe profile narzędzi mogą je dopuszczać, ale `tools.sandbox.tools` jest dodatkową bramką dla sesji w sandboxie. Jeśli tryb sandboxa to `"all"` lub `"non-main"`, dodaj jeden z tych wpisów do listy dozwolonych narzędzi sandboxa, gdy narzędzia MCP/Pluginów mają być widoczne:

- `bundle-mcp` dla serwerów MCP zarządzanych przez OpenClaw z `mcp.servers`
- identyfikator Pluginu dla określonego natywnego Pluginu
- `group:plugins` dla wszystkich załadowanych narzędzi należących do Pluginów
- dokładne nazwy narzędzi serwera MCP albo globy serwera, takie jak `outlook__send_mail` lub `outlook__*`, gdy chcesz użyć tylko jednego serwera

Globy serwera używają bezpiecznego dla dostawcy prefiksu serwera MCP, niekoniecznie surowego klucza `mcp.servers`. Znaki inne niż `[A-Za-z0-9_-]` stają się `-`, nazwy, które nie zaczynają się od litery, otrzymują prefiks `mcp-`, a długie lub zduplikowane prefiksy mogą zostać obcięte lub otrzymać sufiks; na przykład `mcp.servers["Outlook Graph"]` używa globu takiego jak `outlook-graph__*`.

```json5
{
  agents: { defaults: { sandbox: { mode: "all" } } },
  mcp: {
    servers: {
      outlook: { command: "node", args: ["./outlook-mcp.js"] },
    },
  },
  tools: {
    sandbox: {
      tools: {
        alsoAllow: ["web_search", "web_fetch", "memory_search", "memory_get", "bundle-mcp"],
      },
    },
  },
}
```

Bez tego wpisu warstwy sandboxa serwer MCP może nadal zostać poprawnie załadowany, ale jego narzędzia zostaną odfiltrowane przed żądaniem do dostawcy. Użyj `openclaw doctor`, aby wykryć ten kształt dla serwerów zarządzanych przez OpenClaw w `mcp.servers`. Serwery MCP ładowane z manifestów dołączonych Pluginów lub pliku Claude `.mcp.json` używają tej samej bramki sandboxa, ale ta diagnostyka nie wylicza jeszcze tych źródeł; użyj tych samych wpisów listy dozwolonych, jeśli ich narzędzia znikną w turach sandboxowych.

### `tools.codeMode`

`tools.codeMode` włącza ogólną powierzchnię trybu kodu OpenClaw. Po włączeniu
dla uruchomienia z narzędziami model widzi tylko `exec` i `wait`; zwykłe narzędzia OpenClaw
przechodzą za most katalogu `tools.*` wewnątrz sandboxa, a narzędzia MCP są
dostępne przez wygenerowaną przestrzeń nazw `MCP`.

```json5
{
  tools: {
    codeMode: {
      enabled: true,
    },
  },
}
```

Akceptowany jest też skrót:

```json5
{
  tools: { codeMode: true },
}
```

Deklaracje MCP są udostępniane przez powierzchnię wirtualnego pliku API tylko do odczytu w
trybie kodu. Kod gościa może wywołać `API.list("mcp")` i
`API.read("mcp/<server>.d.ts")`, aby sprawdzić sygnatury w stylu TypeScript przed
wywołaniem `MCP.<server>.<tool>()`. Zobacz [Tryb kodu](/pl/reference/code-mode), aby poznać
kontrakt runtime, limity i kroki debugowania.

### `tools.allow` / `tools.deny`

Globalna polityka dopuszczania/odmawiania narzędzi (odmowa wygrywa). Bez rozróżniania wielkości liter, obsługuje symbole wieloznaczne `*`. Stosowana nawet wtedy, gdy sandbox Docker jest wyłączony.

```json5
{
  tools: { deny: ["browser", "canvas"] },
}
```

`write` i `apply_patch` to osobne identyfikatory narzędzi. `allow: ["write"]` włącza także `apply_patch` dla zgodnych modeli, ale `deny: ["write"]` nie odmawia `apply_patch`. Aby zablokować wszystkie mutacje plików, odmów `group:fs` albo wymień każde narzędzie modyfikujące jawnie:

```json5
{
  tools: { deny: ["write", "edit", "apply_patch"] },
}
```

### `tools.byProvider`

Dalej ogranicza narzędzia dla określonych dostawców lub modeli. Kolejność: profil bazowy → profil dostawcy → allow/deny.

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

Ogranicza narzędzia dla określonej tożsamości żądającego. To dodatkowa warstwa obrony oprócz kontroli dostępu kanału; wartości nadawcy muszą pochodzić z adaptera kanału, nie z tekstu wiadomości.

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

Klucze używają jawnych prefiksów: `channel:<channelId>:<senderId>`, `id:<senderId>`, `e164:<phone>`, `username:<handle>`, `name:<displayName>` lub `"*"`. Identyfikatory kanałów są kanonicznymi identyfikatorami OpenClaw; aliasy takie jak `teams` normalizują się do `msteams`. Starsze klucze bez prefiksu są akceptowane tylko jako `id:`. Kolejność dopasowania to kanał+id, id, e164, nazwa użytkownika, nazwa, a następnie symbol wieloznaczny.

Per-agent `agents.list[].tools.toolsBySender` zastępuje globalne dopasowanie nadawcy, gdy pasuje, nawet przy pustej polityce `{}`.

### `tools.elevated`

Kontroluje podwyższony dostęp exec poza sandboxem:

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

- Nadpisanie per-agent (`agents.list[].tools.elevated`) może tylko dalej ograniczać.
- `/elevated on|off|ask|full` zapisuje stan dla sesji; dyrektywy inline dotyczą pojedynczej wiadomości.
- Podwyższony `exec` omija sandboxing i używa skonfigurowanej ścieżki wyjścia (`gateway` domyślnie albo `node`, gdy celem exec jest `node`).

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

Kontrole bezpieczeństwa pętli narzędzi są **domyślnie wyłączone**. Ustaw `enabled: true`, aby aktywować wykrywanie. Ustawienia można definiować globalnie w `tools.loopDetection` i nadpisywać per-agent w `agents.list[].tools.loopDetection`.

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
  Wyższy próg powtarzania do blokowania krytycznych pętli.
</ParamField>
<ParamField path="globalCircuitBreakerThreshold" type="number">
  Twardy próg zatrzymania dla dowolnego uruchomienia bez postępu.
</ParamField>
<ParamField path="detectors.genericRepeat" type="boolean">
  Ostrzegaj przy powtarzających się wywołaniach tego samego narzędzia z tymi samymi argumentami.
</ParamField>
<ParamField path="detectors.knownPollNoProgress" type="boolean">
  Ostrzegaj/blokuj znane narzędzia odpytywania (`process.poll`, `command_status` itd.).
</ParamField>
<ParamField path="detectors.pingPong" type="boolean">
  Ostrzegaj/blokuj naprzemienne wzorce par bez postępu.
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

Konfiguruje rozumienie mediów przychodzących (obraz/audio/wideo):

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

    - `provider`: identyfikator dostawcy API (`openai`, `anthropic`, `google`/`gemini`, `groq` itd.)
    - `model`: nadpisanie identyfikatora modelu
    - `profile` / `preferredProfile`: wybór profilu `auth-profiles.json`

    **Wpis CLI** (`type: "cli"`):

    - `command`: plik wykonywalny do uruchomienia
    - `args`: argumenty szablonowe (obsługuje `{{MediaPath}}`, `{{Prompt}}`, `{{MaxChars}}` itd.; `openclaw doctor --fix` migruje przestarzałe symbole zastępcze `{input}` do `{{MediaPath}}`)

    **Wspólne pola:**

    - `capabilities`: opcjonalna lista (`image`, `audio`, `video`). Wartości domyślne: `openai`/`anthropic`/`minimax` → obraz, `google` → obraz+audio+wideo, `groq` → audio.
    - `prompt`, `maxChars`, `maxBytes`, `timeoutSeconds`, `language`: nadpisania dla pojedynczego wpisu.
    - `tools.media.image.timeoutSeconds` i pasujące wpisy modelu obrazu `timeoutSeconds` mają też zastosowanie, gdy agent wywołuje jawne narzędzie `image`. W przypadku rozumienia obrazu ten limit czasu dotyczy samego żądania i nie jest skracany przez wcześniejsze prace przygotowawcze.
    - Awarie powodują przejście do następnego wpisu.

    Uwierzytelnianie dostawcy działa w standardowej kolejności: `auth-profiles.json` → zmienne środowiskowe → `models.providers.*.apiKey`.

    **Pola ukończenia asynchronicznego:**

    - `asyncCompletion.directSend`: przestarzała flaga zgodności. Ukończone asynchroniczne zadania multimedialne pozostają mediowane przez sesję żądającego, aby agent otrzymał wynik, zdecydował, jak przekazać go użytkownikowi, i użył narzędzia wiadomości, gdy wymaga tego dostarczenie ze źródła.

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

Steruje tym, które sesje mogą być wskazywane przez narzędzia sesji (`sessions_list`, `sessions_history`, `sessions_send`).

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
    - `agent`: dowolna sesja należąca do identyfikatora bieżącego agenta (może obejmować innych użytkowników, jeśli uruchamiasz sesje per nadawca pod tym samym identyfikatorem agenta).
    - `all`: dowolna sesja. Kierowanie między agentami nadal wymaga `tools.agentToAgent`.
    - Ograniczenie piaskownicy: gdy bieżąca sesja jest w piaskownicy, a `agents.defaults.sandbox.sessionToolsVisibility="spawned"`, widoczność jest wymuszana na `tree`, nawet jeśli `tools.sessions.visibility="all"`.
    - Gdy nie jest ustawione `all`, `sessions_list` zawiera zwarte pole `visibility`
      opisujące efektywny tryb oraz ostrzeżenie, że niektóre sesje mogą być
      pominięte poza bieżącym zakresem.

  </Accordion>
</AccordionGroup>

### `tools.sessions_spawn`

Steruje obsługą załączników w treści dla `sessions_spawn`.

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
    - Załączniki wymagają `enabled: true`.
    - Załączniki podagenta są materializowane w obszarze roboczym dziecka w `.openclaw/attachments/<uuid>/` z plikiem `.manifest.json`.
    - Załączniki ACP obsługują tylko obrazy i są przekazywane w treści do środowiska uruchomieniowego ACP po spełnieniu tych samych limitów liczby plików, bajtów na plik i łącznej liczby bajtów.
    - Treść załączników jest automatycznie redagowana z trwałego zapisu transkrypcji.
    - Dane wejściowe Base64 są sprawdzane za pomocą ścisłych kontroli alfabetu/dopełnienia oraz zabezpieczenia rozmiaru przed dekodowaniem.
    - Uprawnienia plików załączników podagenta to `0700` dla katalogów i `0600` dla plików.
    - Czyszczenie podagenta jest zgodne z polityką `cleanup`: `delete` zawsze usuwa załączniki; `keep` zachowuje je tylko wtedy, gdy `retainOnSessionKeep: true`.

  </Accordion>
</AccordionGroup>

<a id="toolsexperimental"></a>

### `tools.experimental`

Eksperymentalne flagi wbudowanych narzędzi. Domyślnie wyłączone, chyba że obowiązuje reguła automatycznego włączenia dla ściśle agentowego GPT-5.

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
- Domyślnie: `false`, chyba że `agents.defaults.embeddedAgent.executionContract` (lub nadpisanie dla pojedynczego agenta) jest ustawione na `"strict-agentic"` dla uruchomienia z rodziny GPT-5 OpenAI lub OpenAI Codex. Ustaw `true`, aby wymusić włączenie narzędzia poza tym zakresem, albo `false`, aby pozostawić je wyłączone nawet dla ściśle agentowych uruchomień GPT-5.
- Po włączeniu monit systemowy dodaje też wskazówki użycia, aby model korzystał z niego tylko przy istotnej pracy i utrzymywał najwyżej jeden krok `in_progress`.

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

- `model`: domyślny model dla tworzonych podagentów. Jeśli zostanie pominięty, podagenci dziedziczą model wywołującego.
- `allowAgents`: domyślna lista dozwolonych identyfikatorów skonfigurowanych agentów docelowych dla `sessions_spawn`, gdy agent żądający nie ustawia własnego `subagents.allowAgents` (`["*"]` = dowolny skonfigurowany cel; domyślnie: tylko ten sam agent). Nieaktualne wpisy, których konfiguracja agenta została usunięta, są odrzucane przez `sessions_spawn` i pomijane w `agents_list`; uruchom `openclaw doctor --fix`, aby je oczyścić.
- `runTimeoutSeconds`: domyślny limit czasu (w sekundach) dla `sessions_spawn`. `0` oznacza brak limitu czasu.
- `announceTimeoutMs`: limit czasu pojedynczego wywołania (w milisekundach) dla prób dostarczenia ogłoszenia `agent` przez Gateway. Domyślnie: `120000`. Przejściowe ponowienia mogą sprawić, że łączny czas oczekiwania na ogłoszenie będzie dłuższy niż jeden skonfigurowany limit czasu.
- Polityka narzędzi dla podagenta: `tools.subagents.tools.allow` / `tools.subagents.tools.deny`.

---

## Niestandardowi dostawcy i bazowe adresy URL

Pluginy dostawców publikują własne wiersze katalogu modeli. Dodaj niestandardowych dostawców przez `models.providers` w konfiguracji albo `~/.openclaw/agents/<agentId>/agent/models.json`.

Skonfigurowanie niestandardowego/lokalnego dostawcy `baseUrl` jest też wąską decyzją o zaufaniu sieci dla żądań HTTP modelu: OpenClaw przepuszcza dokładnie to źródło `scheme://host:port` przez chronioną ścieżkę pobierania, bez dodawania osobnej opcji konfiguracji ani ufania innym prywatnym źródłom.

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
  <Accordion title="Uwierzytelnianie i pierwszeństwo scalania">
    - Użyj `authHeader: true` + `headers` dla niestandardowych potrzeb uwierzytelniania.
    - Nadpisz katalog główny konfiguracji agenta za pomocą `OPENCLAW_AGENT_DIR`.
    - Pierwszeństwo scalania dla pasujących identyfikatorów dostawców:
      - Niepuste wartości `baseUrl` z `models.json` agenta wygrywają.
      - Niepuste wartości `apiKey` agenta wygrywają tylko wtedy, gdy ten dostawca nie jest zarządzany przez SecretRef w bieżącym kontekście konfiguracji/profilu uwierzytelniania.
      - Wartości `apiKey` dostawcy zarządzanego przez SecretRef są odświeżane ze znaczników źródła (`ENV_VAR_NAME` dla odwołań do zmiennych środowiskowych, `secretref-managed` dla odwołań do pliku/wykonania), zamiast utrwalania rozwiązanych sekretów.
      - Wartości nagłówków dostawcy zarządzanego przez SecretRef są odświeżane ze znaczników źródła (`secretref-env:ENV_VAR_NAME` dla odwołań do zmiennych środowiskowych, `secretref-managed` dla odwołań do pliku/wykonania).
      - Puste lub brakujące `apiKey`/`baseUrl` agenta wracają do `models.providers` w konfiguracji.
      - Pasujące modele `contextWindow`/`maxTokens` używają wyższej wartości między jawną konfiguracją a niejawnymi wartościami katalogu.
      - Pasujący model `contextTokens` zachowuje jawny limit środowiska uruchomieniowego, gdy jest obecny; użyj go, aby ograniczyć efektywny kontekst bez zmiany natywnych metadanych modelu.
      - Katalogi Pluginów dostawców są przechowywane jako wygenerowane, należące do Pluginu fragmenty katalogu w stanie Pluginu agenta.
      - Użyj `models.mode: "replace"`, gdy chcesz, aby konfiguracja w pełni przepisała `models.json` i aktywne fragmenty katalogu Pluginu.
      - Utrwalanie znaczników jest autorytatywne względem źródła: znaczniki są zapisywane z aktywnego zrzutu konfiguracji źródłowej (przed rozwiązaniem), a nie z rozwiązanych wartości sekretów środowiska uruchomieniowego.

  </Accordion>
</AccordionGroup>

### Szczegóły pól dostawcy

<AccordionGroup>
  <Accordion title="Katalog najwyższego poziomu">
    - `models.mode`: zachowanie katalogu dostawcy (`merge` albo `replace`).
    - `models.providers`: mapa niestandardowych dostawców kluczowana identyfikatorem dostawcy.
      - Bezpieczne edycje: użyj `openclaw config set models.providers.<id> '<json>' --strict-json --merge` albo `openclaw config set models.providers.<id>.models '<json-array>' --strict-json --merge` do aktualizacji addytywnych. `config set` odmawia destrukcyjnych zastąpień, chyba że przekażesz `--replace`.

  </Accordion>
  <Accordion title="Połączenie z dostawcą i uwierzytelnianie">
    - `models.providers.*.api`: adapter żądań (`openai-completions`, `openai-responses`, `anthropic-messages`, `google-generative-ai` itd.). Dla samodzielnie hostowanych backendów `/v1/chat/completions`, takich jak MLX, vLLM, SGLang i większość lokalnych serwerów zgodnych z OpenAI, użyj `openai-completions`. Niestandardowy dostawca z `baseUrl`, ale bez `api`, domyślnie używa `openai-completions`; ustaw `openai-responses` tylko wtedy, gdy backend obsługuje `/v1/responses`.
    - `models.providers.*.apiKey`: poświadczenie dostawcy (preferuj podstawianie SecretRef/env).
    - `models.providers.*.auth`: strategia uwierzytelniania (`api-key`, `token`, `oauth`, `aws-sdk`).
    - `models.providers.*.contextWindow`: domyślne natywne okno kontekstu dla modeli tego dostawcy, gdy wpis modelu nie ustawia `contextWindow`.
    - `models.providers.*.contextTokens`: domyślny efektywny limit kontekstu w czasie działania dla modeli tego dostawcy, gdy wpis modelu nie ustawia `contextTokens`.
    - `models.providers.*.maxTokens`: domyślny limit tokenów wyjściowych dla modeli tego dostawcy, gdy wpis modelu nie ustawia `maxTokens`.
    - `models.providers.*.timeoutSeconds`: opcjonalny limit czasu żądania HTTP modelu dla danego dostawcy w sekundach, obejmujący połączenie, nagłówki, treść i obsługę przerwania całego żądania.
    - `models.providers.*.injectNumCtxForOpenAICompat`: dla Ollama + `openai-completions` wstrzykuj `options.num_ctx` do żądań (domyślnie: `true`).
    - `models.providers.*.authHeader`: wymuś przesyłanie poświadczeń w nagłówku `Authorization`, gdy jest to wymagane.
    - `models.providers.*.baseUrl`: bazowy URL nadrzędnego API.
    - `models.providers.*.headers`: dodatkowe statyczne nagłówki do routingu przez proxy/dzierżawcę.

  </Accordion>
  <Accordion title="Nadpisania transportu żądań">
    `models.providers.*.request`: nadpisania transportu dla żądań HTTP dostawcy modelu.

    - `request.headers`: dodatkowe nagłówki (scalane z domyślnymi nagłówkami dostawcy). Wartości akceptują SecretRef.
    - `request.auth`: nadpisanie strategii uwierzytelniania. Tryby: `"provider-default"` (użyj wbudowanego uwierzytelniania dostawcy), `"authorization-bearer"` (z `token`), `"header"` (z `headerName`, `value`, opcjonalnie `prefix`).
    - `request.proxy`: nadpisanie proxy HTTP. Tryby: `"env-proxy"` (użyj zmiennych środowiskowych `HTTP_PROXY`/`HTTPS_PROXY`), `"explicit-proxy"` (z `url`). Oba tryby akceptują opcjonalny podobiekt `tls`.
    - `request.tls`: nadpisanie TLS dla połączeń bezpośrednich. Pola: `ca`, `cert`, `key`, `passphrase` (wszystkie akceptują SecretRef), `serverName`, `insecureSkipVerify`.
    - `request.allowPrivateNetwork`: gdy `true`, zezwól żądaniom HTTP dostawcy modelu na przechodzenie przez zabezpieczenie fetch HTTP dostawcy do zakresów prywatnych, CGNAT lub podobnych. Bazowe URL-e niestandardowych/lokalnych dostawców już ufają dokładnie skonfigurowanemu źródłu, z wyjątkiem źródeł metadata/link-local, które pozostają zablokowane bez jawnej zgody. Ustaw to na `false`, aby zrezygnować z zaufania do dokładnego źródła. WebSocket używa tego samego `request` dla nagłówków/TLS, ale nie używa tej bramki fetch SSRF. Domyślnie `false`.

  </Accordion>
  <Accordion title="Wpisy katalogu modeli">
    - `models.providers.*.models`: jawne wpisy katalogu modeli dostawcy.
    - `models.providers.*.models.*.input`: modalności wejściowe modelu. Użyj `["text"]` dla modeli tylko tekstowych oraz `["text", "image"]` dla natywnych modeli obrazu/wizji. Załączniki obrazów są wstrzykiwane do tur agenta tylko wtedy, gdy wybrany model jest oznaczony jako obsługujący obrazy.
    - `models.providers.*.models.*.contextWindow`: metadane natywnego okna kontekstu modelu. Nadpisuje to `contextWindow` na poziomie dostawcy dla tego modelu.
    - `models.providers.*.models.*.contextTokens`: opcjonalny limit kontekstu w czasie działania. Nadpisuje to `contextTokens` na poziomie dostawcy; użyj tego, gdy chcesz mniejszego efektywnego budżetu kontekstu niż natywne `contextWindow` modelu; `openclaw models list` pokazuje obie wartości, gdy się różnią.
    - `models.providers.*.models.*.compat.supportsDeveloperRole`: opcjonalna wskazówka zgodności. Dla `api: "openai-completions"` z niepustym, nienatywnym `baseUrl` (host inny niż `api.openai.com`) OpenClaw wymusza to na `false` w czasie działania. Puste/pominięte `baseUrl` zachowuje domyślne zachowanie OpenAI.
    - `models.providers.*.models.*.compat.requiresStringContent`: opcjonalna wskazówka zgodności dla zgodnych z OpenAI punktów końcowych czatu obsługujących tylko ciągi znaków. Gdy `true`, OpenClaw spłaszcza czysto tekstowe tablice `messages[].content` do zwykłych ciągów znaków przed wysłaniem żądania.
    - `models.providers.*.models.*.compat.strictMessageKeys`: opcjonalna wskazówka zgodności dla rygorystycznych zgodnych z OpenAI punktów końcowych czatu. Gdy `true`, OpenClaw redukuje wychodzące obiekty wiadomości Chat Completions do `role` i `content` przed wysłaniem żądania.
    - `models.providers.*.models.*.compat.thinkingFormat`: opcjonalna wskazówka dotycząca ładunku myślenia. Użyj `"together"` dla `reasoning.enabled` w stylu Together, `"qwen"` dla najwyższego poziomu `enable_thinking` albo `"qwen-chat-template"` dla `chat_template_kwargs.enable_thinking` na zgodnych z OpenAI serwerach rodziny Qwen, które obsługują kwargs szablonu czatu na poziomie żądania, takich jak vLLM. Skonfigurowane modele vLLM Qwen udostępniają binarne wybory `/think` (`off`, `on`) dla tych formatów.
    - `models.providers.*.models.*.compat.requiresReasoningContentOnAssistantMessages`: opcjonalna wskazówka zgodności dla backendów Chat Completions w stylu DeepSeek, które wymagają zachowania `reasoning_content` w poprzednich wiadomościach asystenta podczas odtwarzania. Gdy `true`, OpenClaw zachowuje to pole w wychodzących wiadomościach asystenta. Użyj tego przy podłączaniu niestandardowego proxy zgodnego z DeepSeek, które odrzuca żądania po usunięciu rozumowania. Domyślnie `false`.

  </Accordion>
  <Accordion title="Wykrywanie Amazon Bedrock">
    - `plugins.entries.amazon-bedrock.config.discovery`: główny obiekt ustawień automatycznego wykrywania Bedrock.
    - `plugins.entries.amazon-bedrock.config.discovery.enabled`: włącza/wyłącza niejawne wykrywanie.
    - `plugins.entries.amazon-bedrock.config.discovery.region`: region AWS do wykrywania.
    - `plugins.entries.amazon-bedrock.config.discovery.providerFilter`: opcjonalny filtr identyfikatora dostawcy do ukierunkowanego wykrywania.
    - `plugins.entries.amazon-bedrock.config.discovery.refreshInterval`: interwał odpytywania dla odświeżania wykrywania.
    - `plugins.entries.amazon-bedrock.config.discovery.defaultContextWindow`: zastępcze okno kontekstu dla wykrytych modeli.
    - `plugins.entries.amazon-bedrock.config.discovery.defaultMaxTokens`: zastępczy maksymalny limit tokenów wyjściowych dla wykrytych modeli.

  </Accordion>
</AccordionGroup>

Interaktywne wdrażanie niestandardowego dostawcy wnioskuje wejście obrazów dla popularnych identyfikatorów modeli wizyjnych, takich jak GPT-4o, Claude, Gemini, Qwen-VL, LLaVA, Pixtral, InternVL, Mllama, MiniCPM-V i GLM-4V, oraz pomija dodatkowe pytanie dla znanych rodzin tylko tekstowych. Nieznane identyfikatory modeli nadal pytają o obsługę obrazów. Nieinteraktywne wdrażanie używa tego samego wnioskowania; przekaż `--custom-image-input`, aby wymusić metadane obsługujące obrazy, albo `--custom-text-input`, aby wymusić metadane tylko tekstowe.

### Przykłady dostawców

<AccordionGroup>
  <Accordion title="Cerebras (GLM 4.7 / GPT OSS)">
    Oficjalny zewnętrzny Plugin dostawcy `cerebras` może skonfigurować to przez `openclaw onboard --auth-choice cerebras-api-key`. Używaj jawnej konfiguracji dostawcy tylko podczas nadpisywania ustawień domyślnych.

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

    Zgodny z Anthropic, wbudowany dostawca. Skrót: `openclaw onboard --auth-choice kimi-code-api-key`.

  </Accordion>
  <Accordion title="Modele lokalne (LM Studio)">
    Zobacz [Modele lokalne](/pl/gateway/local-models). W skrócie: uruchom duży model lokalny przez LM Studio Responses API na mocnym sprzęcie; zachowaj scalone modele hostowane jako rozwiązanie awaryjne.
  </Accordion>
  <Accordion title="MiniMax M3 (bezpośrednio)">
    ```json5
    {
      agents: {
        defaults: {
          model: { primary: "minimax/MiniMax-M3" },
          models: {
            "minimax/MiniMax-M3": { alias: "Minimax" },
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
                id: "MiniMax-M3",
                name: "MiniMax M3",
                reasoning: true,
                input: ["text", "image"],
                cost: { input: 0.6, output: 2.4, cacheRead: 0.12, cacheWrite: 0 },
                contextWindow: 1000000,
                maxTokens: 131072,
              },
            ],
          },
        },
      },
    }
    ```

    Ustaw `MINIMAX_API_KEY`. Skróty: `openclaw onboard --auth-choice minimax-global-api` albo `openclaw onboard --auth-choice minimax-cn-api`. Katalog modeli domyślnie używa M3 i obejmuje też warianty M2.7. Na ścieżce strumieniowania zgodnej z Anthropic OpenClaw domyślnie wyłącza myślenie MiniMax M2.x, chyba że jawnie ustawisz `thinking`; MiniMax-M3 (oraz M3.x) domyślnie pozostaje na pominiętej/adaptacyjnej ścieżce myślenia dostawcy. `/fast on` albo `params.fastMode: true` przepisuje `MiniMax-M2.7` na `MiniMax-M2.7-highspeed`.

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

    Natywne punkty końcowe Moonshot deklarują zgodność użycia strumieniowania na współdzielonym transporcie `openai-completions`, a OpenClaw ustala to na podstawie możliwości punktu końcowego, a nie wyłącznie wbudowanego identyfikatora dostawcy.

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

    Ustaw `OPENCODE_API_KEY` (albo `OPENCODE_ZEN_API_KEY`). Użyj odwołań `opencode/...` dla katalogu Zen albo odwołań `opencode-go/...` dla katalogu Go. Skrót: `openclaw onboard --auth-choice opencode-zen` albo `openclaw onboard --auth-choice opencode-go`.

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

    Bazowy adres URL powinien pomijać `/v1` (klient Anthropic dodaje go). Skrót: `openclaw onboard --auth-choice synthetic-api-key`.

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

    Ustaw `ZAI_API_KEY`. Referencje modeli używają kanonicznego identyfikatora dostawcy `zai/*`. Skrót: `openclaw onboard --auth-choice zai-api-key`.

    - Ogólny punkt końcowy: `https://api.z.ai/api/paas/v4`
    - Punkt końcowy do kodowania (domyślny): `https://api.z.ai/api/coding/paas/v4`
    - Dla ogólnego punktu końcowego zdefiniuj niestandardowego dostawcę z nadpisaniem bazowego adresu URL.

  </Accordion>
</AccordionGroup>

---

## Powiązane

- [Konfiguracja — agenci](/pl/gateway/config-agents)
- [Konfiguracja — kanały](/pl/gateway/config-channels)
- [Referencja konfiguracji](/pl/gateway/configuration-reference) — inne klucze najwyższego poziomu
- [Narzędzia i pluginy](/pl/tools)
