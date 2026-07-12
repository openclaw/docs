---
read_when:
    - Konfigurowanie zasad `tools.*`, list dozwolonych elementów lub funkcji eksperymentalnych
    - Rejestrowanie niestandardowych dostawców lub zastępowanie bazowych adresów URL
    - Konfigurowanie samodzielnie hostowanych punktów końcowych zgodnych z OpenAI
sidebarTitle: Tools and custom providers
summary: Konfiguracja narzędzi (zasady, eksperymentalne przełączniki, narzędzia obsługiwane przez dostawców) oraz konfiguracja niestandardowego dostawcy/bazowego adresu URL
title: Konfiguracja — narzędzia i dostawcy niestandardowi
x-i18n:
    generated_at: "2026-07-12T15:06:45Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 91f392efc7ca08ddd18875625ed3c95d21c5c12f70396594f8dc8e88a20293fc
    source_path: gateway/config-tools.md
    workflow: 16
---

Klucze konfiguracji `tools.*` oraz konfiguracja niestandardowego dostawcy / bazowego adresu URL. Informacje o agentach, kanałach i innych kluczach konfiguracji najwyższego poziomu zawiera [dokumentacja konfiguracji](/pl/gateway/configuration-reference).

## Narzędzia

### Profile narzędzi

`tools.profile` ustawia bazową listę dozwolonych narzędzi przed zastosowaniem `tools.allow`/`tools.deny`:

<Note>
Lokalne wdrażanie domyślnie ustawia w nowych konfiguracjach lokalnych `tools.profile: "coding"`, jeśli wartość nie jest określona (istniejące jawnie ustawione profile są zachowywane).
</Note>

| Profil      | Obejmuje                                                                                                                                                                                                                     |
| ----------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `minimal`   | tylko `session_status`                                                                                                                                                                                                       |
| `coding`    | `group:fs`, `group:runtime`, `group:web`, `group:sessions`, `group:memory`, `cron`, `get_goal`, `create_goal`, `update_goal`, `update_plan`, `skill_workshop`, `image`, `image_generate`, `music_generate`, `video_generate` |
| `messaging` | `group:messaging`, `sessions_list`, `sessions_history`, `sessions_send`, `session_status`                                                                                                                                    |
| `full`      | Bez ograniczeń (tak samo jak przy braku ustawienia)                                                                                                                                                                          |

Profile `coding` i `messaging` również niejawnie zezwalają na `bundle-mcp` (skonfigurowane serwery MCP).

### Grupy narzędzi

| Grupa              | Narzędzia                                                                                                                                             |
| ------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------- |
| `group:runtime`    | `exec`, `process`, `code_execution` (`bash` jest akceptowany jako alias `exec`)                                                                        |
| `group:fs`         | `read`, `write`, `edit`, `apply_patch`                                                                                                                |
| `group:sessions`   | `sessions_list`, `sessions_history`, `sessions_send`, `sessions_spawn`, `sessions_yield`, `subagents`, `session_status`, `spawn_task`, `dismiss_task` |
| `group:memory`     | `memory_search`, `memory_get`                                                                                                                         |
| `group:web`        | `web_search`, `x_search`, `web_fetch`                                                                                                                 |
| `group:ui`         | `browser`, `canvas`                                                                                                                                   |
| `group:automation` | `heartbeat_respond`, `cron`, `gateway`                                                                                                                |
| `group:messaging`  | `message`                                                                                                                                             |
| `group:nodes`      | `nodes`, `computer`                                                                                                                                   |
| `group:agents`     | `agents_list`, `get_goal`, `create_goal`, `update_goal`, `update_plan`, `skill_workshop`                                                              |
| `group:media`      | `image`, `image_generate`, `music_generate`, `video_generate`, `tts`                                                                                  |
| `group:openclaw`   | Wszystkie powyższe wbudowane narzędzia z wyjątkiem `read`/`write`/`edit`/`apply_patch`/`exec`/`process`/`canvas` (bez narzędzi pluginów)                |
| `group:plugins`    | Narzędzia należące do załadowanych pluginów, w tym skonfigurowane serwery MCP udostępniane przez `bundle-mcp`                                          |

`spawn_task` umożliwia agentowi programistycznemu zaproponowanie potwierdzonych dalszych prac bez ich uruchamiania. Interfejs sterowania wyświetla tytuł i podsumowanie jako interaktywny znacznik działania; TUI obsługiwany przez Gateway wyświetla równoważne interaktywne pytanie. Zaakceptowanie jednej z tych opcji tworzy nową sesję w zarządzanym drzewie roboczym i wysyła do niej pełne polecenie, podczas gdy bieżąca tura jest kontynuowana. `dismiss_task` wycofuje nadal oczekującą sugestię na podstawie tymczasowego `task_id` zwróconego przez `spawn_task`.

Narzędzia są udostępniane tylko wtedy, gdy powierzchnia operatora inicjującego może odbierać zdarzenia sugestii zadań Gateway i podejmować na ich podstawie działania. Sesje kanałów oraz lokalne/osadzone sesje TUI ich nie odbierają; transporty kanałów wymagają przenośnej, typowanej akcji zadania, zanim będą mogły bezpiecznie udostępnić ten przepływ. Sugestie są lokalne dla procesu i znikają po ponownym uruchomieniu Gateway. Oba narzędzia pozostają w profilu `coding` oraz grupie `group:sessions`, dlatego standardowe zasady `tools.allow` i `tools.deny` konfigurują je automatycznie, gdy powierzchnia je obsługuje.

### Narzędzia MCP i pluginów w zasadach narzędzi piaskownicy

Skonfigurowane serwery MCP są udostępniane jako narzędzia należące do pluginu o identyfikatorze `bundle-mcp`. Standardowe profile narzędzi mogą na nie zezwalać, ale `tools.sandbox.tools` stanowi dodatkową bramę dla sesji w piaskownicy. Jeśli tryb piaskownicy to `"all"` lub `"non-main"`, dodaj jeden z następujących wpisów do listy dozwolonych narzędzi piaskownicy, gdy narzędzia MCP/pluginów mają być widoczne:

- `bundle-mcp` dla serwerów MCP zarządzanych przez OpenClaw z `mcp.servers`
- identyfikator pluginu dla określonego natywnego pluginu
- `group:plugins` dla wszystkich załadowanych narzędzi należących do pluginów
- dokładne nazwy narzędzi serwera MCP lub wzorce serwera, takie jak `outlook__send_mail` albo `outlook__*`, jeśli potrzebujesz tylko jednego serwera

Wzorce serwerów używają bezpiecznego dla dostawcy prefiksu serwera MCP, który nie musi być surowym kluczem `mcp.servers`. Znaki spoza zakresu `[A-Za-z0-9_-]` są zastępowane znakiem `-`, nazwy, które nie zaczynają się literą, otrzymują prefiks `mcp-`, a długie lub zduplikowane prefiksy mogą zostać skrócone albo otrzymać sufiks; na przykład `mcp.servers["Outlook Graph"]` używa wzorca takiego jak `outlook-graph__*`.

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

Bez tego wpisu na poziomie piaskownicy serwer MCP może nadal załadować się pomyślnie, ale jego narzędzia zostaną odfiltrowane przed wysłaniem żądania do dostawcy. Użyj `openclaw doctor`, aby wykryć taką konfigurację serwerów zarządzanych przez OpenClaw w `mcp.servers`. Serwery MCP ładowane z manifestów dołączonych pluginów lub pliku `.mcp.json` Claude korzystają z tej samej bramy piaskownicy, ale ta diagnostyka nie wylicza jeszcze tych źródeł; jeśli ich narzędzia znikają w turach wykonywanych w piaskownicy, użyj tych samych wpisów listy dozwolonych.

### `tools.codeMode`

`tools.codeMode` włącza ogólną powierzchnię trybu kodu OpenClaw. Po włączeniu
dla przebiegu z narzędziami standardowe narzędzia OpenClaw są przenoszone za działający w piaskownicy
most katalogu `tools.*`, a narzędzia MCP stają się dostępne przez wygenerowaną przestrzeń nazw
`MCP`. Model zwykle widzi `exec` i `wait`; narzędzia takie jak `computer`,
których ustrukturyzowane wyniki nie mogą przejść przez most obsługujący wyłącznie JSON, pozostają dostępne bezpośrednio.

```json5
{
  tools: {
    codeMode: {
      enabled: true,
    },
  },
}
```

Akceptowany jest również zapis skrócony:

```json5
{
  tools: { codeMode: true },
}
```

W trybie kodu deklaracje MCP są udostępniane przez wirtualną powierzchnię plików API tylko do odczytu.
Kod gościa może wywołać `API.list("mcp")` oraz
`API.read("mcp/<server>.d.ts")`, aby sprawdzić sygnatury w stylu TypeScript przed
wywołaniem `MCP.<server>.<tool>()`. Kontrakt środowiska wykonawczego, ograniczenia i kroki debugowania zawiera dokument [Tryb kodu](/pl/reference/code-mode).

### `tools.allow` / `tools.deny`

Globalna polityka zezwalania na narzędzia i ich blokowania (blokada ma pierwszeństwo). Nie rozróżnia wielkości liter i obsługuje symbole wieloznaczne `*`. Jest stosowana nawet wtedy, gdy piaskownica Docker jest wyłączona.

```json5
{
  tools: { deny: ["browser", "canvas"] },
}
```

`write` i `apply_patch` to osobne identyfikatory narzędzi. `allow: ["write"]` włącza również `apply_patch` dla zgodnych modeli, ale `deny: ["write"]` nie blokuje `apply_patch`. Aby zablokować wszystkie modyfikacje plików, zablokuj `group:fs` lub jawnie wymień każde narzędzie modyfikujące:

```json5
{
  tools: { deny: ["write", "edit", "apply_patch"] },
}
```

<Note>
`allow` i `alsoAllow` nie mogą być ustawione jednocześnie w tym samym zakresie (`tools`, `tools.byProvider.<id>`, `agents.list[].tools`) — walidacja konfiguracji to odrzuci. Scal wpisy `alsoAllow` z `allow` albo usuń `allow` i zamiast tego użyj `profile` + `alsoAllow`.
</Note>

### `tools.byProvider`

Dodatkowo ogranicza narzędzia dla określonych dostawców lub modeli. Kolejność: profil bazowy → profil dostawcy → zezwolenia/blokady.

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

Ogranicza narzędzia dla określonej tożsamości żądającego. Jest to dodatkowa warstwa ochrony ponad kontrolą dostępu do kanału; wartości nadawcy muszą pochodzić z adaptera kanału, a nie z treści wiadomości.

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

Klucze używają jawnych prefiksów: `channel:<channelId>:<senderId>`, `id:<senderId>`, `e164:<phone>`, `username:<handle>`, `name:<displayName>` lub `"*"`. Identyfikatory kanałów są kanonicznymi identyfikatorami OpenClaw; aliasy, takie jak `teams`, są normalizowane do `msteams`. Starsze klucze bez prefiksu są akceptowane wyłącznie jako `id:`. Kolejność dopasowywania: kanał+identyfikator, identyfikator, e164, nazwa użytkownika, nazwa, a następnie symbol wieloznaczny.

Konfiguracja `agents.list[].tools.toolsBySender` dla danego agenta zastępuje globalne dopasowanie nadawcy, jeśli pasuje, nawet gdy polityka jest pustym obiektem `{}`.

### `tools.elevated`

Steruje podwyższonym dostępem do wykonywania poleceń poza piaskownicą:

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

- Nadpisanie dla danego agenta (`agents.list[].tools.elevated`) może jedynie wprowadzać dalsze ograniczenia.
- `/elevated on|off|ask|full` zapisuje stan osobno dla każdej sesji; dyrektywy w treści dotyczą pojedynczej wiadomości.
- `exec` z podwyższonymi uprawnieniami omija piaskownicę i używa skonfigurowanej ścieżki wyjścia (`gateway` domyślnie lub `node`, gdy celem wykonania jest `node`).

### `tools.exec`

```json5
{
  tools: {
    exec: {
      backgroundMs: 10000,
      timeoutSec: 1800,
      cleanupMs: 1800000,
      approvalRunningNoticeMs: 10000,
      notifyOnExit: true,
      notifyOnExitEmptySuccess: false,
      commandHighlighting: false,
      applyPatch: {
        enabled: true,
        allowModels: ["gpt-5.6-sol"],
      },
    },
  },
}
```

Przedstawione wartości są domyślne z wyjątkiem `applyPatch.allowModels` (domyślnie puste/nieustawione, co oznacza, że każdy zgodny model może używać `apply_patch`). `approvalRunningNoticeMs` wyświetla powiadomienie o trwającym wykonywaniu, gdy zatwierdzone wykonanie trwa długo; wartość `0` je wyłącza.

### `tools.loopDetection`

Kontrole zabezpieczające przed pętlami narzędzi są **domyślnie wyłączone**. Ustaw `enabled: true`, aby włączyć wykrywanie. Ustawienia można zdefiniować globalnie w `tools.loopDetection` i nadpisać dla poszczególnych agentów w `agents.list[].tools.loopDetection`.

```json5
{
  tools: {
    loopDetection: {
      enabled: true,
      historySize: 30,
      warningThreshold: 10,
      unknownToolThreshold: 10,
      criticalThreshold: 20,
      globalCircuitBreakerThreshold: 30,
      detectors: {
        genericRepeat: true,
        knownPollNoProgress: true,
        pingPong: true,
      },
      postCompactionGuard: {
        windowSize: 3,
      },
    },
  },
}
```

<ParamField path="historySize" type="number">
  Maksymalna historia wywołań narzędzi zachowywana do analizy pętli.
</ParamField>
<ParamField path="warningThreshold" type="number">
  Próg ostrzeżeń dla powtarzającego się wzorca bez postępu.
</ParamField>
<ParamField path="unknownToolThreshold" type="number">
  Blokuje powtarzające się wywołania tej samej niedostępnej lub nieznanej nazwy narzędzia po tylu nieudanych próbach.
</ParamField>
<ParamField path="criticalThreshold" type="number">
  Wyższy próg powtórzeń służący do blokowania krytycznych pętli.
</ParamField>
<ParamField path="globalCircuitBreakerThreshold" type="number">
  Próg bezwzględnego zatrzymania każdego przebiegu bez postępu.
</ParamField>
<ParamField path="detectors.genericRepeat" type="boolean">
  Ostrzega przed powtarzającymi się wywołaniami tego samego narzędzia z tymi samymi argumentami.
</ParamField>
<ParamField path="detectors.knownPollNoProgress" type="boolean">
  Ostrzega lub blokuje w przypadku znanych narzędzi odpytywania (`process.poll`, `command_status` itp.).
</ParamField>
<ParamField path="detectors.pingPong" type="boolean">
  Ostrzega lub blokuje w przypadku naprzemiennych par wzorców bez postępu.
</ParamField>
<ParamField path="postCompactionGuard.windowSize" type="number">
  Liczba prób po automatycznej kompakcji, przez które zabezpieczenie pozostaje aktywne; przerywa działanie, jeśli agent powtórzy tę samą trójkę (narzędzie, argumenty, wynik) w tym oknie.
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
        apiKey: "brave_api_key", // lub zmienna środowiskowa BRAVE_API_KEY (dostawca Brave)
        maxResults: 5,
        timeoutSeconds: 30,
        cacheTtlMinutes: 15,
      },
      fetch: {
        enabled: true,
        provider: "firecrawl", // opcjonalne; pomiń, aby wykryć automatycznie
        maxChars: 20000,
        maxCharsCap: 20000,
        maxResponseBytes: 750000,
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

Pokazane wartości są domyślne z wyjątkiem `provider` i `userAgent`. Wartość `maxResponseBytes` jest ograniczana do zakresu 32000–10000000; wartość `maxChars` jest ograniczana do `maxCharsCap` (zwiększ `maxCharsCap`, aby zezwolić na większe odpowiedzi).

### `tools.media`

Konfiguruje rozpoznawanie przychodzących multimediów (obrazów, dźwięku i wideo):

```json5
{
  tools: {
    media: {
      concurrency: 2,
      asyncCompletion: {
        directSend: false, // przestarzałe: ukończenia pozostają obsługiwane przez agenta
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

Wartości `concurrency` (domyślnie `2`), `audio.maxBytes` (domyślnie 20 MB) i `video.maxBytes` (domyślnie 50 MB) pokazano w ich ustawieniach domyślnych; domyślna wartość `image.maxBytes` wynosi 10 MB. Domyślne limity czasu żądań dla poszczególnych możliwości: obraz/dźwięk `60` s, wideo `120` s.

<AccordionGroup>
  <Accordion title="Pola wpisu modelu multimediów">
    **Wpis dostawcy** (`type: "provider"` lub pominięte):

    - `provider`: identyfikator dostawcy API (`openai`, `anthropic`, `google`/`gemini`, `groq` itp.)
    - `model`: nadpisanie identyfikatora modelu
    - `profile` / `preferredProfile`: wybór profilu z `auth-profiles.json`

    **Wpis CLI** (`type: "cli"`):

    - `command`: plik wykonywalny do uruchomienia
    - `args`: argumenty szablonowe (obsługuje `{{MediaPath}}`, `{{Prompt}}`, `{{MaxChars}}` itp.; `openclaw doctor --fix` migruje przestarzałe symbole zastępcze `{input}` do `{{MediaPath}}`)

    **Pola wspólne:**

    - `capabilities`: opcjonalna lista (`image`, `audio`, `video`). Każdy Plugin dostawcy deklaruje własny domyślny zestaw możliwości; na przykład dołączony dostawca `openai` domyślnie obsługuje obraz i dźwięk, `anthropic`/`minimax` — obraz, `google` — obraz, dźwięk i wideo, a `groq` — dźwięk.
    - `prompt`, `maxChars`, `maxBytes`, `timeoutSeconds`, `language`: nadpisania dla poszczególnych wpisów.
    - `tools.media.image.timeoutSeconds` oraz odpowiadające mu wpisy `timeoutSeconds` modelu obrazu mają również zastosowanie, gdy agent wywołuje jawne narzędzie `image`. W przypadku rozpoznawania obrazów ten limit czasu dotyczy samego żądania i nie jest pomniejszany o wcześniejsze prace przygotowawcze.
    - W przypadku niepowodzenia używany jest następny wpis.

    Uwierzytelnianie dostawcy odbywa się w standardowej kolejności: `auth-profiles.json` → zmienne środowiskowe → `models.providers.*.apiKey`.

    **Pola ukończenia asynchronicznego:**

    - `asyncCompletion.directSend`: przestarzała flaga zgodności. Ukończone asynchroniczne zadania multimedialne pozostają obsługiwane za pośrednictwem sesji żądającego, dzięki czemu agent otrzymuje wynik, decyduje, jak przekazać go użytkownikowi, i używa narzędzia wiadomości, gdy wymaga tego dostarczenie do źródła.

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

Określa, które sesje mogą być wskazywane przez narzędzia sesji (`sessions_list`, `sessions_history`, `sessions_send`).

Domyślnie: `tree` (bieżąca sesja oraz sesje przez nią utworzone, takie jak podagenci).

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
    - `tree`: bieżąca sesja oraz sesje utworzone przez bieżącą sesję (podagenci).
    - `agent`: dowolna sesja należąca do identyfikatora bieżącego agenta (może obejmować innych użytkowników, jeśli sesje poszczególnych nadawców są uruchamiane z tym samym identyfikatorem agenta).
    - `all`: dowolna sesja. Wskazywanie między agentami nadal wymaga `tools.agentToAgent`.
    - Ograniczenie piaskownicy: gdy bieżąca sesja działa w piaskownicy, a `agents.defaults.sandbox.sessionToolsVisibility="spawned"` (wartość domyślna), widoczność jest wymuszana na `tree`, nawet jeśli ustawiono `tools.sessions.visibility="all"`.
    - Gdy wartość nie wynosi `all`, `sessions_list` zawiera zwięzłe pole `visibility`
      opisujące obowiązujący tryb oraz ostrzeżenie, że niektóre sesje spoza
      bieżącego zakresu mogą zostać pominięte.

  </Accordion>
</AccordionGroup>

### `tools.sessions_spawn`

Określa obsługę załączników osadzonych bezpośrednio w `sessions_spawn`.

```json5
{
  tools: {
    sessions_spawn: {
      attachments: {
        enabled: false, // opcjonalne: ustaw true, aby zezwolić na osadzone załączniki plikowe
        maxTotalBytes: 5242880, // łącznie 5 MB dla wszystkich plików
        maxFiles: 50,
        maxFileBytes: 1048576, // 1 MB na plik
        retainOnSessionKeep: false, // zachowaj załączniki, gdy cleanup="keep"
      },
    },
  },
}
```

<AccordionGroup>
  <Accordion title="Uwagi dotyczące załączników">
    - Załączniki wymagają ustawienia `enabled: true`.
    - Załączniki podagenta są zapisywane w obszarze roboczym procesu potomnego w `.openclaw/attachments/<uuid>/` wraz z plikiem `.manifest.json`.
    - Załączniki ACP mogą zawierać wyłącznie obrazy i są przekazywane bezpośrednio do środowiska wykonawczego ACP po spełnieniu tych samych limitów liczby plików, liczby bajtów na plik i łącznej liczby bajtów.
    - Zawartość załączników jest automatycznie redagowana w utrwalanym zapisie transkrypcji.
    - Dane wejściowe Base64 są sprawdzane pod kątem ścisłej zgodności alfabetu i dopełnienia, a przed dekodowaniem stosowane jest zabezpieczenie rozmiaru.
    - Uprawnienia plików załączników podagenta wynoszą `0700` dla katalogów i `0600` dla plików.
    - Czyszczenie podagenta jest zgodne z zasadą `cleanup`: `delete` zawsze usuwa załączniki; `keep` zachowuje je tylko wtedy, gdy ustawiono `retainOnSessionKeep: true`.

  </Accordion>
</AccordionGroup>

<a id="toolsexperimental"></a>

### `tools.experimental`

Eksperymentalne flagi wbudowanych narzędzi. Domyślnie wyłączone, chyba że ma zastosowanie reguła automatycznego włączania GPT-5 w trybie ścisłej agentowości.

```json5
{
  tools: {
    experimental: {
      planTool: true, // włącza eksperymentalne narzędzie update_plan
    },
  },
}
```

- `planTool`: włącza ustrukturyzowane narzędzie `update_plan` do śledzenia nietrywialnych prac wieloetapowych.
- Domyślnie: `false`, chyba że `agents.defaults.embeddedAgent.executionContract` (lub nadpisanie dla danego agenta) ma wartość `"strict-agentic"` dla przebiegu dostawcy `openai` z identyfikatorem modelu z rodziny GPT-5 (obejmuje to również przebiegi OpenAI Codex CLI, ponieważ uwierzytelnianie i kierowanie modeli Codex odbywa się w ramach dostawcy `openai`). Ustaw `true`, aby wymusić włączenie narzędzia poza tym zakresem, albo `false`, aby pozostawić je wyłączone nawet dla przebiegów GPT-5 w trybie ścisłej agentowości.
- Po włączeniu monit systemowy dodaje również wskazówki dotyczące użycia, aby model korzystał z niego wyłącznie przy istotnych pracach i utrzymywał najwyżej jeden krok ze stanem `in_progress`.

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
- `allowAgents`: domyślna lista dozwolonych identyfikatorów skonfigurowanych agentów docelowych dla `sessions_spawn`, gdy agent żądający nie ustawi własnego `subagents.allowAgents` (`["*"]` = dowolny skonfigurowany agent docelowy; domyślnie: tylko ten sam agent). Nieaktualne wpisy, których konfiguracja agenta została usunięta, są odrzucane przez `sessions_spawn` i pomijane w `agents_list`; uruchom `openclaw doctor --fix`, aby je usunąć.
- `maxConcurrent`: maksymalna liczba równoczesnych przebiegów podagentów. Domyślnie: `8`.
- `runTimeoutSeconds`: limit czasu (w sekundach) dla `sessions_spawn`, gdy wywołujący nie przekaże własnego nadpisania. Domyślnie: `0` (bez limitu czasu); pokazana wyżej wartość `900` jest często wybieraną wartością opcjonalną, a nie wbudowaną wartością domyślną.
- `announceTimeoutMs`: limit czasu pojedynczego wywołania (w milisekundach) dla prób dostarczenia powiadomienia `agent` przez Gateway. Domyślnie: `120000`. Przejściowe ponowienia mogą sprawić, że łączny czas oczekiwania na powiadomienie będzie dłuższy niż jeden skonfigurowany limit czasu.
- `archiveAfterMinutes`: liczba minut od zakończenia sesji podagenta do jej automatycznego zarchiwizowania. Domyślnie: `60`; `0` wyłącza automatyczne archiwizowanie.
- Zasady narzędzi dla poszczególnych podagentów: `tools.subagents.tools.allow` / `tools.subagents.tools.deny`.

---

## Niestandardowi dostawcy i bazowe adresy URL

Pluginy dostawców publikują własne pozycje katalogu modeli. Dodawaj niestandardowych dostawców za pomocą `models.providers` w konfiguracji lub `~/.openclaw/agents/<agentId>/agent/models.json`.

Skonfigurowanie `baseUrl` niestandardowego lub lokalnego dostawcy jest również precyzyjnie ograniczoną decyzją o zaufaniu sieciowemu dla żądań HTTP modeli: OpenClaw przepuszcza przez chronioną ścieżkę pobierania dokładnie to źródło `scheme://host:port`, bez dodawania osobnej opcji konfiguracji ani obdarzania zaufaniem innych prywatnych źródeł.

```json5
{
  models: {
    mode: "merge", // merge (domyślnie) | replace
    providers: {
      "custom-proxy": {
        baseUrl: "http://localhost:4000/v1",
        apiKey: "LITELLM_KEY",
        api: "openai-completions", // openai-completions | openai-responses | anthropic-messages | google-generative-ai | itd.
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
  <Accordion title="Uwierzytelnianie i kolejność scalania">
    - Użyj `authHeader: true` wraz z `headers`, jeśli potrzebujesz niestandardowego uwierzytelniania.
    - Zastąp katalog główny konfiguracji agenta za pomocą `OPENCLAW_AGENT_DIR`.
    - Kolejność scalania dla zgodnych identyfikatorów dostawców:
      - Niepuste wartości `baseUrl` w pliku `models.json` agenta mają pierwszeństwo.
      - Niepuste wartości `apiKey` agenta mają pierwszeństwo tylko wtedy, gdy dany dostawca nie jest zarządzany przez SecretRef w bieżącym kontekście konfiguracji/profilu uwierzytelniania.
      - Wartości `apiKey` dostawców zarządzanych przez SecretRef są odświeżane na podstawie znaczników źródłowych (`ENV_VAR_NAME` dla odwołań do zmiennych środowiskowych, `secretref-managed` dla odwołań do plików/poleceń) zamiast utrwalania rozwiązanych sekretów.
      - Wartości nagłówków dostawców zarządzanych przez SecretRef są odświeżane na podstawie znaczników źródłowych (`secretref-env:ENV_VAR_NAME` dla odwołań do zmiennych środowiskowych, `secretref-managed` dla odwołań do plików/poleceń).
      - Puste lub brakujące wartości `apiKey`/`baseUrl` agenta korzystają z wartości zastępczych z `models.providers` w konfiguracji.
      - Dla zgodnych wartości `contextWindow`/`maxTokens` modelu pierwszeństwo ma jawna wartość konfiguracji, jeśli jest obecna i prawidłowa (dodatnia liczba skończona); w przeciwnym razie używana jest niejawna/wygenerowana wartość katalogowa.
      - Zgodna wartość `contextTokens` modelu podlega tej samej zasadzie pierwszeństwa wartości jawnej, a w przeciwnym razie niejawnej; użyj jej, aby ograniczyć efektywny kontekst bez zmieniania natywnych metadanych modelu.
      - Katalogi Pluginów dostawców są przechowywane jako wygenerowane fragmenty katalogu należące do Pluginu w stanie Pluginu agenta.
      - Użyj `models.mode: "replace"`, jeśli konfiguracja ma całkowicie nadpisać plik `models.json` i pominąć scalanie fragmentów katalogu należących do Pluginów.
      - Utrwalanie znaczników jest podporządkowane źródłu: znaczniki są zapisywane z aktywnej migawki konfiguracji źródłowej (sprzed rozwiązania), a nie z rozwiązanych wartości sekretów środowiska wykonawczego.

  </Accordion>
</AccordionGroup>

### Szczegóły pól dostawcy

<AccordionGroup>
  <Accordion title="Katalog najwyższego poziomu">
    - `models.mode`: sposób działania katalogu dostawców (`merge` lub `replace`).
    - `models.providers`: niestandardowa mapa dostawców indeksowana według identyfikatora dostawcy.
      - Bezpieczne zmiany: do aktualizacji addytywnych użyj `openclaw config set models.providers.<id> '<json>' --strict-json --merge` lub `openclaw config set models.providers.<id>.models '<json-array>' --strict-json --merge`. Polecenie `config set` odrzuca destrukcyjne zastąpienia, chyba że przekażesz `--replace`.

  </Accordion>
  <Accordion title="Połączenie z dostawcą i uwierzytelnianie">
    - `models.providers.*.api`: adapter żądań (`openai-completions`, `openai-responses`, `openai-chatgpt-responses`, `anthropic-messages`, `google-generative-ai`, `google-vertex`, `github-copilot`, `bedrock-converse-stream`, `ollama`, `azure-openai-responses`). W przypadku samodzielnie hostowanych backendów `/v1/chat/completions`, takich jak MLX, vLLM, SGLang i większość lokalnych serwerów zgodnych z OpenAI, użyj `openai-completions`. Niestandardowy dostawca z ustawieniem `baseUrl`, ale bez `api`, domyślnie korzysta z `openai-completions`; ustaw `openai-responses` tylko wtedy, gdy backend obsługuje `/v1/responses`.
    - `models.providers.*.apiKey`: dane uwierzytelniające dostawcy (preferowane jest podstawianie SecretRef/zmiennej środowiskowej).
    - `models.providers.*.auth`: strategia uwierzytelniania (`api-key`, `token`, `oauth`, `aws-sdk`).
    - `models.providers.*.contextWindow`: domyślne natywne okno kontekstu dla modeli tego dostawcy, gdy wpis modelu nie ustawia `contextWindow`.
    - `models.providers.*.contextTokens`: domyślny efektywny limit kontekstu środowiska wykonawczego dla modeli tego dostawcy, gdy wpis modelu nie ustawia `contextTokens`.
    - `models.providers.*.maxTokens`: domyślny limit tokenów wyjściowych dla modeli tego dostawcy, gdy wpis modelu nie ustawia `maxTokens`.
    - `models.providers.*.timeoutSeconds`: opcjonalny limit czasu żądania HTTP modelu dla danego dostawcy w sekundach, obejmujący nawiązanie połączenia, nagłówki, treść i obsługę przerwania całego żądania.
    - `models.providers.*.injectNumCtxForOpenAICompat`: dla Ollama wraz z `openai-completions` wstawia `options.num_ctx` do żądań (domyślnie: `true`).
    - `models.providers.*.authHeader`: wymusza przesyłanie danych uwierzytelniających w nagłówku `Authorization`, gdy jest to wymagane.
    - `models.providers.*.baseUrl`: bazowy adres URL nadrzędnego API.
    - `models.providers.*.headers`: dodatkowe statyczne nagłówki do trasowania przez serwer proxy lub dzierżawcę.

  </Accordion>
  <Accordion title="Nadpisywanie transportu żądań">
    `models.providers.*.request`: nadpisania transportu żądań HTTP do dostawcy modelu.

    - `request.headers`: dodatkowe nagłówki (scalane z wartościami domyślnymi dostawcy). Wartości akceptują SecretRef.
    - `request.auth`: nadpisanie strategii uwierzytelniania. Tryby: `"provider-default"` (użycie wbudowanego uwierzytelniania dostawcy), `"authorization-bearer"` (z `token`), `"header"` (z `headerName`, `value` i opcjonalnym `prefix`).
    - `request.proxy`: nadpisanie serwera proxy HTTP. Tryby: `"env-proxy"` (użycie zmiennych środowiskowych `HTTP_PROXY`/`HTTPS_PROXY`), `"explicit-proxy"` (z `url`). Oba tryby akceptują opcjonalny podobiekt `tls`.
    - `request.tls`: nadpisanie TLS dla połączeń bezpośrednich. Pola: `ca`, `cert`, `key`, `passphrase` (wszystkie akceptują SecretRef), `serverName`, `insecureSkipVerify`.
    - `request.allowPrivateNetwork`: gdy ma wartość `true`, zezwala żądaniom HTTP do dostawcy modelu na dostęp do zakresów prywatnych, CGNAT lub podobnych poprzez zabezpieczenie pobierania HTTP dostawcy. Bazowe adresy URL niestandardowych/lokalnych dostawców już ufają dokładnie skonfigurowanemu źródłu, z wyjątkiem źródeł metadanych/link-local, które pozostają zablokowane bez jawnego włączenia. Ustaw tę opcję na `false`, aby wyłączyć zaufanie do dokładnego źródła. WebSocket używa tego samego ustawienia `request` dla nagłówków/TLS, ale nie korzysta z tej bramy SSRF pobierania. Wartość domyślna: `false`.

  </Accordion>
  <Accordion title="Wpisy katalogu modeli">
    - `models.providers.*.models`: jawne wpisy katalogu modeli dostawcy.
    - `models.providers.*.models.*.input`: modalności wejściowe modelu. Użyj `["text"]` dla modeli obsługujących wyłącznie tekst oraz `["text", "image"]` dla modeli z natywną obsługą obrazów/wizji. Załączniki obrazów są wstawiane do tur agenta tylko wtedy, gdy wybrany model jest oznaczony jako obsługujący obrazy.
    - `models.providers.*.models.*.contextWindow`: metadane natywnego okna kontekstu modelu. Ta wartość zastępuje `contextWindow` na poziomie dostawcy dla tego modelu.
    - `models.providers.*.models.*.contextTokens`: opcjonalny limit kontekstu środowiska wykonawczego. Ta wartość zastępuje `contextTokens` na poziomie dostawcy; użyj jej, jeśli potrzebujesz mniejszego efektywnego budżetu kontekstu niż natywne `contextWindow` modelu; polecenie `openclaw models list` wyświetla obie wartości, gdy się różnią.
    - `models.providers.*.models.*.compat.supportsDeveloperRole`: opcjonalna wskazówka dotycząca zgodności. Dla `api: "openai-completions"` z niepustym, nienatywnym `baseUrl` (host innym niż `api.openai.com`) OpenClaw wymusza wartość `false` w środowisku wykonawczym. Puste/pominięte `baseUrl` zachowuje domyślne działanie OpenAI.
    - `models.providers.*.models.*.compat.requiresStringContent`: opcjonalna wskazówka dotycząca zgodności dla punktów końcowych czatu zgodnych z OpenAI, które obsługują wyłącznie ciągi znaków. Gdy ma wartość `true`, OpenClaw spłaszcza tablice `messages[].content` zawierające wyłącznie tekst do zwykłych ciągów znaków przed wysłaniem żądania.
    - `models.providers.*.models.*.compat.strictMessageKeys`: opcjonalna wskazówka dotycząca zgodności dla rygorystycznych punktów końcowych czatu zgodnych z OpenAI. Gdy ma wartość `true`, OpenClaw ogranicza wychodzące obiekty wiadomości Chat Completions do pól `role` i `content` przed wysłaniem żądania.
    - `models.providers.*.models.*.compat.thinkingFormat`: opcjonalna wskazówka dotycząca ładunku rozumowania. Użyj `"together"` dla `reasoning.enabled` w stylu Together, `"qwen"` dla ustawienia `enable_thinking` najwyższego poziomu lub `"qwen-chat-template"` dla `chat_template_kwargs.enable_thinking` na zgodnych z OpenAI serwerach rodziny Qwen, które obsługują argumenty słów kluczowych szablonu czatu na poziomie żądania, takich jak vLLM. Skonfigurowane modele Qwen w vLLM udostępniają dla tych formatów binarne opcje `/think` (`off`, `on`).
    - `models.providers.*.models.*.compat.requiresReasoningContentOnAssistantMessages`: opcjonalna wskazówka dotycząca zgodności dla backendów Chat Completions w stylu DeepSeek, które wymagają zachowania `reasoning_content` w poprzednich wiadomościach asystenta podczas ponownego odtwarzania. Gdy ma wartość `true`, OpenClaw zachowuje to pole w wychodzących wiadomościach asystenta. Użyj tej opcji podczas podłączania niestandardowego serwera proxy zgodnego z DeepSeek, który odrzuca żądania po usunięciu rozumowania. Wartość domyślna: `false`.

  </Accordion>
  <Accordion title="Wykrywanie Amazon Bedrock">
    - `plugins.entries.amazon-bedrock.config.discovery`: katalog główny ustawień automatycznego wykrywania Bedrock.
    - `plugins.entries.amazon-bedrock.config.discovery.enabled`: włącza lub wyłącza niejawne wykrywanie.
    - `plugins.entries.amazon-bedrock.config.discovery.region`: region AWS używany do wykrywania.
    - `plugins.entries.amazon-bedrock.config.discovery.providerFilter`: opcjonalny filtr identyfikatora dostawcy do ukierunkowanego wykrywania.
    - `plugins.entries.amazon-bedrock.config.discovery.refreshInterval`: interwał odpytywania w celu odświeżania wyników wykrywania.
    - `plugins.entries.amazon-bedrock.config.discovery.defaultContextWindow`: zastępcze okno kontekstu dla wykrytych modeli.
    - `plugins.entries.amazon-bedrock.config.discovery.defaultMaxTokens`: zastępczy maksymalny limit tokenów wyjściowych dla wykrytych modeli.

  </Accordion>
</AccordionGroup>

Interaktywny proces wdrażania niestandardowego dostawcy rozpoznaje wejście obrazowe na podstawie znanych wzorców identyfikatorów modeli wizyjnych, w tym GPT-4o/GPT-4.1/GPT-5+, rodzin rozumujących `o1`/`o3`/`o4`, Claude, Gemini, każdego identyfikatora z przyrostkiem `-vl` (Qwen-VL i podobne) oraz nazwanych rodzin, takich jak LLaVA, Pixtral, InternVL, Mllama, MiniCPM-V i GLM-4V; pomija dodatkowe pytanie w przypadku znanych rodzin obsługujących wyłącznie tekst (Llama, DeepSeek, Mistral/Mixtral, Kimi/Moonshot, Codestral, Devstral, Phi, QwQ, CodeLlama oraz podstawowych identyfikatorów Qwen bez przyrostka vl/vision). W przypadku nieznanych identyfikatorów modeli nadal wyświetlane jest pytanie o obsługę obrazów. Nieinteraktywny proces wdrażania korzysta z tego samego mechanizmu rozpoznawania; przekaż `--custom-image-input`, aby wymusić metadane obsługi obrazów, lub `--custom-text-input`, aby wymusić metadane obsługi wyłącznie tekstu.

### Przykłady dostawców

<AccordionGroup>
  <Accordion title="Cerebras (GLM 4.7 / GPT OSS)">
    Oficjalny zewnętrzny Plugin dostawcy `cerebras` może skonfigurować tę opcję za pomocą `openclaw onboard --auth-choice cerebras-api-key`. Jawnej konfiguracji dostawcy używaj tylko do zastępowania wartości domyślnych.

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

    Użyj `cerebras/zai-glm-4.7` dla Cerebras; `zai/glm-4.7` do bezpośredniego połączenia z Z.AI.

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

    Wbudowany dostawca zgodny z Anthropic. Skrót: `openclaw onboard --auth-choice kimi-code-api-key`.

  </Accordion>
  <Accordion title="Modele lokalne (LM Studio)">
    Zobacz [Modele lokalne](/pl/gateway/local-models). W skrócie: uruchom duży model lokalny za pośrednictwem interfejsu Responses API LM Studio na wydajnym sprzęcie; zachowaj scalone modele hostowane jako rozwiązanie awaryjne.
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

    Ustaw `MINIMAX_API_KEY`. Skróty: `openclaw onboard --auth-choice minimax-global-api` lub `openclaw onboard --auth-choice minimax-cn-api`. Katalog modeli domyślnie wskazuje M3 i obejmuje również warianty M2.7. Na ścieżce strumieniowej zgodnej z Anthropic OpenClaw domyślnie wyłącza wnioskowanie MiniMax M2.x, chyba że jawnie ustawisz `thinking`; MiniMax-M3 (oraz M3.x) domyślnie pozostaje na ścieżce pominiętego/adaptacyjnego wnioskowania dostawcy. `/fast on` lub `params.fastMode: true` zamienia `MiniMax-M2.7` na `MiniMax-M2.7-highspeed`.

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

    Dla chińskiego punktu końcowego: `baseUrl: "https://api.moonshot.cn/v1"` lub `openclaw onboard --auth-choice moonshot-api-key-cn`.

    Natywne punkty końcowe Moonshot deklarują zgodność ze strumieniowym raportowaniem użycia we współdzielonym transporcie `openai-completions`, a OpenClaw uzależnia tę funkcję od możliwości punktu końcowego, a nie wyłącznie od wbudowanego identyfikatora dostawcy.

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

    Ustaw `OPENCODE_API_KEY` (lub `OPENCODE_ZEN_API_KEY`). Używaj odwołań `opencode/...` dla katalogu Zen albo `opencode-go/...` dla katalogu Go. Skrót: `openclaw onboard --auth-choice opencode-zen` lub `openclaw onboard --auth-choice opencode-go`.

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

    Bazowy adres URL powinien pomijać `/v1` (klient Anthropic dodaje go automatycznie). Skrót: `openclaw onboard --auth-choice synthetic-api-key`.

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

    Ustaw `ZAI_API_KEY`. Odwołania do modeli używają kanonicznego identyfikatora dostawcy `zai/*`. Skrót: `openclaw onboard --auth-choice zai-api-key`.

    - Ogólny punkt końcowy: `https://api.z.ai/api/paas/v4`
    - Punkt końcowy do programowania: `https://api.z.ai/api/coding/paas/v4`
    - Domyślna opcja uwierzytelniania `zai-api-key` sprawdza klucz i automatycznie wykrywa, do którego punktu końcowego należy (jeśli wykrycie nie jest jednoznaczne, wyświetla monit z domyślnym wyborem Global). Dostępne są również osobne opcje uwierzytelniania CN i Coding-Plan umożliwiające jawny wybór.
    - Dla ogólnego punktu końcowego zdefiniuj niestandardowego dostawcę z nadpisanym bazowym adresem URL.

  </Accordion>
</AccordionGroup>

---

## Powiązane

- [Konfiguracja — agenci](/pl/gateway/config-agents)
- [Konfiguracja — kanały](/pl/gateway/config-channels)
- [Dokumentacja konfiguracji](/pl/gateway/configuration-reference) — pozostałe klucze najwyższego poziomu
- [Narzędzia i pluginy](/pl/tools)
