---
read_when:
    - Dostosowywanie domyślnych ustawień agenta (modele, rozumowanie, obszar roboczy, Heartbeat, media, Skills)
    - Konfigurowanie routingu wieloagentowego i powiązań
    - Dostosowywanie zachowania sesji, dostarczania wiadomości i trybu rozmowy
summary: Domyślne ustawienia agenta, routing wieloagentowy, sesja, wiadomości i konfiguracja talk
title: Konfiguracja — agenci
x-i18n:
    generated_at: "2026-04-30T09:51:21Z"
    model: gpt-5.5
    provider: openai
    source_hash: 61f2d33ae1d3f4ce07636ae4584b9e344fd14e8e08a2612bb1f39ed71c99c25a
    source_path: gateway/config-agents.md
    workflow: 16
---

Klucze konfiguracji o zakresie agenta w `agents.*`, `multiAgent.*`, `session.*`,
`messages.*` i `talk.*`. Informacje o kanałach, narzędziach, środowisku wykonawczym Gateway i innych
kluczach najwyższego poziomu znajdziesz w [Dokumentacji konfiguracji](/pl/gateway/configuration-reference).

## Domyślne ustawienia agentów

### `agents.defaults.workspace`

Domyślnie: `~/.openclaw/workspace`.

```json5
{
  agents: { defaults: { workspace: "~/.openclaw/workspace" } },
}
```

### `agents.defaults.repoRoot`

Opcjonalny katalog główny repozytorium wyświetlany w wierszu Runtime promptu systemowego. Jeśli nie jest ustawiony, OpenClaw wykrywa go automatycznie, przechodząc w górę od obszaru roboczego.

```json5
{
  agents: { defaults: { repoRoot: "~/Projects/openclaw" } },
}
```

### `agents.defaults.skills`

Opcjonalna domyślna lista dozwolonych skillów dla agentów, którzy nie ustawiają
`agents.list[].skills`.

```json5
{
  agents: {
    defaults: { skills: ["github", "weather"] },
    list: [
      { id: "writer" }, // inherits github, weather
      { id: "docs", skills: ["docs-search"] }, // replaces defaults
      { id: "locked-down", skills: [] }, // no skills
    ],
  },
}
```

- Pomiń `agents.defaults.skills`, aby domyślnie zezwolić na nieograniczone skille.
- Pomiń `agents.list[].skills`, aby dziedziczyć wartości domyślne.
- Ustaw `agents.list[].skills: []`, aby nie używać skillów.
- Niepusta lista `agents.list[].skills` jest ostatecznym zestawem dla tego agenta; nie jest
  scalana z wartościami domyślnymi.

### `agents.defaults.skipBootstrap`

Wyłącza automatyczne tworzenie plików startowych obszaru roboczego (`AGENTS.md`, `SOUL.md`, `TOOLS.md`, `IDENTITY.md`, `USER.md`, `HEARTBEAT.md`, `BOOTSTRAP.md`).

```json5
{
  agents: { defaults: { skipBootstrap: true } },
}
```

### `agents.defaults.contextInjection`

Kontroluje, kiedy pliki startowe obszaru roboczego są wstrzykiwane do promptu systemowego. Domyślnie: `"always"`.

- `"continuation-skip"`: bezpieczne tury kontynuacji (po ukończonej odpowiedzi asystenta) pomijają ponowne wstrzyknięcie plików startowych obszaru roboczego, zmniejszając rozmiar promptu. Uruchomienia Heartbeat i ponowienia po Compaction nadal odbudowują kontekst.
- `"never"`: wyłącza pliki startowe obszaru roboczego oraz wstrzykiwanie plików kontekstu w każdej turze. Używaj tego tylko dla agentów, którzy w pełni zarządzają cyklem życia swojego promptu (niestandardowe silniki kontekstu, natywne środowiska wykonawcze budujące własny kontekst lub wyspecjalizowane przepływy pracy bez bootstrapu). Tury Heartbeat i odzyskiwania po Compaction także pomijają wstrzykiwanie.

```json5
{
  agents: { defaults: { contextInjection: "continuation-skip" } },
}
```

### `agents.defaults.bootstrapMaxChars`

Maksymalna liczba znaków na plik startowy obszaru roboczego przed obcięciem. Domyślnie: `12000`.

```json5
{
  agents: { defaults: { bootstrapMaxChars: 12000 } },
}
```

### `agents.defaults.bootstrapTotalMaxChars`

Maksymalna łączna liczba znaków wstrzykiwanych ze wszystkich plików startowych obszaru roboczego. Domyślnie: `60000`.

```json5
{
  agents: { defaults: { bootstrapTotalMaxChars: 60000 } },
}
```

### `agents.defaults.bootstrapPromptTruncationWarning`

Kontroluje tekst ostrzeżenia widoczny dla agenta, gdy kontekst startowy zostanie obcięty.
Domyślnie: `"once"`.

- `"off"`: nigdy nie wstrzykuj tekstu ostrzeżenia do promptu systemowego.
- `"once"`: wstrzykuj ostrzeżenie raz na unikalną sygnaturę obcięcia (zalecane).
- `"always"`: wstrzykuj ostrzeżenie przy każdym uruchomieniu, gdy występuje obcięcie.

```json5
{
  agents: { defaults: { bootstrapPromptTruncationWarning: "once" } }, // off | once | always
}
```

### Mapa własności budżetu kontekstu

OpenClaw ma wiele wysokowolumenowych budżetów promptu/kontekstu i są one
celowo podzielone według podsystemu, zamiast przechodzić przez jedno ogólne
pokrętło.

- `agents.defaults.bootstrapMaxChars` /
  `agents.defaults.bootstrapTotalMaxChars`:
  zwykłe wstrzykiwanie plików startowych obszaru roboczego.
- `agents.defaults.startupContext.*`:
  jednorazowy prelude resetu/uruchomienia przebiegu modelu, obejmujący najnowsze dzienne
  pliki `memory/*.md`. Same polecenia czatu `/new` i `/reset` są
  potwierdzane bez wywoływania modelu.
- `skills.limits.*`:
  zwarta lista Skills wstrzykiwana do promptu systemowego.
- `agents.defaults.contextLimits.*`:
  ograniczone wycinki runtime i wstrzykiwane bloki należące do runtime.
- `memory.qmd.limits.*`:
  rozmiary fragmentów zindeksowanego wyszukiwania pamięci i wstrzyknięć.

Używaj odpowiedniego nadpisania dla konkretnego agenta tylko wtedy, gdy jeden agent potrzebuje innego
budżetu:

- `agents.list[].skillsLimits.maxSkillsPromptChars`
- `agents.list[].contextLimits.*`

#### `agents.defaults.startupContext`

Kontroluje prelude startowy pierwszej tury wstrzykiwany przy przebiegach modelu resetu/uruchomienia.
Same polecenia czatu `/new` i `/reset` potwierdzają reset bez wywoływania
modelu, więc nie ładują tego prelude.

```json5
{
  agents: {
    defaults: {
      startupContext: {
        enabled: true,
        applyOn: ["new", "reset"],
        dailyMemoryDays: 2,
        maxFileBytes: 16384,
        maxFileChars: 1200,
        maxTotalChars: 2800,
      },
    },
  },
}
```

#### `agents.defaults.contextLimits`

Współdzielone wartości domyślne dla ograniczonych powierzchni kontekstu runtime.

```json5
{
  agents: {
    defaults: {
      contextLimits: {
        memoryGetMaxChars: 12000,
        memoryGetDefaultLines: 120,
        toolResultMaxChars: 16000,
        postCompactionMaxChars: 1800,
      },
    },
  },
}
```

- `memoryGetMaxChars`: domyślny limit wycinka `memory_get` przed dodaniem
  metadanych obcięcia i powiadomienia o kontynuacji.
- `memoryGetDefaultLines`: domyślne okno wierszy `memory_get`, gdy `lines` jest
  pominięte.
- `toolResultMaxChars`: limit wyników narzędzi na żywo używany dla utrwalanych wyników i
  odzyskiwania po przepełnieniu.
- `postCompactionMaxChars`: limit wycinka AGENTS.md używany podczas wstrzykiwania odświeżenia
  po Compaction.

#### `agents.list[].contextLimits`

Nadpisanie per agent dla współdzielonych pokręteł `contextLimits`. Pominięte pola dziedziczą
z `agents.defaults.contextLimits`.

```json5
{
  agents: {
    defaults: {
      contextLimits: {
        memoryGetMaxChars: 12000,
        toolResultMaxChars: 16000,
      },
    },
    list: [
      {
        id: "tiny-local",
        contextLimits: {
          memoryGetMaxChars: 6000,
          toolResultMaxChars: 8000,
        },
      },
    ],
  },
}
```

#### `skills.limits.maxSkillsPromptChars`

Globalny limit zwartej listy Skills wstrzykiwanej do promptu systemowego. Nie
wpływa to na odczytywanie plików `SKILL.md` na żądanie.

```json5
{
  skills: {
    limits: {
      maxSkillsPromptChars: 18000,
    },
  },
}
```

#### `agents.list[].skillsLimits.maxSkillsPromptChars`

Nadpisanie per agent dla budżetu promptu Skills.

```json5
{
  agents: {
    list: [
      {
        id: "tiny-local",
        skillsLimits: {
          maxSkillsPromptChars: 6000,
        },
      },
    ],
  },
}
```

### `agents.defaults.imageMaxDimensionPx`

Maksymalny rozmiar w pikselach najdłuższego boku obrazu w blokach obrazów transkryptu/narzędzi przed wywołaniami dostawcy.
Domyślnie: `1200`.

Niższe wartości zwykle zmniejszają użycie tokenów wizji i rozmiar payloadu żądania dla przebiegów z dużą liczbą zrzutów ekranu.
Wyższe wartości zachowują więcej szczegółów wizualnych.

```json5
{
  agents: { defaults: { imageMaxDimensionPx: 1200 } },
}
```

### `agents.defaults.userTimezone`

Strefa czasowa dla kontekstu promptu systemowego (nie dla znaczników czasu wiadomości). W razie braku używana jest strefa czasowa hosta.

```json5
{
  agents: { defaults: { userTimezone: "America/Chicago" } },
}
```

### `agents.defaults.timeFormat`

Format czasu w prompcie systemowym. Domyślnie: `auto` (preferencja systemu operacyjnego).

```json5
{
  agents: { defaults: { timeFormat: "auto" } }, // auto | 12 | 24
}
```

### `agents.defaults.model`

```json5
{
  agents: {
    defaults: {
      models: {
        "anthropic/claude-opus-4-6": { alias: "opus" },
        "minimax/MiniMax-M2.7": { alias: "minimax" },
      },
      model: {
        primary: "anthropic/claude-opus-4-6",
        fallbacks: ["minimax/MiniMax-M2.7"],
      },
      imageModel: {
        primary: "openrouter/qwen/qwen-2.5-vl-72b-instruct:free",
        fallbacks: ["openrouter/google/gemini-2.0-flash-vision:free"],
      },
      imageGenerationModel: {
        primary: "openai/gpt-image-2",
        fallbacks: ["google/gemini-3.1-flash-image-preview"],
      },
      videoGenerationModel: {
        primary: "qwen/wan2.6-t2v",
        fallbacks: ["qwen/wan2.6-i2v"],
      },
      pdfModel: {
        primary: "anthropic/claude-opus-4-6",
        fallbacks: ["openai/gpt-5.4-mini"],
      },
      params: { cacheRetention: "long" }, // global default provider params
      agentRuntime: {
        id: "pi", // pi | auto | registered harness id, e.g. codex
        fallback: "pi", // pi | none
      },
      pdfMaxBytesMb: 10,
      pdfMaxPages: 20,
      thinkingDefault: "low",
      verboseDefault: "off",
      reasoningDefault: "off",
      elevatedDefault: "on",
      timeoutSeconds: 600,
      mediaMaxMb: 5,
      contextTokens: 200000,
      maxConcurrent: 3,
    },
  },
}
```

- `model`: akceptuje ciąg znaków (`"provider/model"`) albo obiekt (`{ primary, fallbacks }`).
  - Forma ciągu znaków ustawia tylko model podstawowy.
  - Forma obiektu ustawia model podstawowy oraz uporządkowane modele przełączania awaryjnego.
- `imageModel`: akceptuje ciąg znaków (`"provider/model"`) albo obiekt (`{ primary, fallbacks }`).
  - Używane przez ścieżkę narzędzia `image` jako jego konfiguracja modelu wizyjnego.
  - Używane także jako trasa awaryjna, gdy wybrany/domyślny model nie może przyjmować danych wejściowych obrazu.
  - Preferuj jawne odwołania `provider/model`. Gołe identyfikatory są akceptowane ze względu na zgodność; jeśli goły identyfikator jednoznacznie pasuje do skonfigurowanego wpisu obsługującego obrazy w `models.providers.*.models`, OpenClaw kwalifikuje go do tego providera. Niejednoznaczne skonfigurowane dopasowania wymagają jawnego prefiksu providera.
- `imageGenerationModel`: akceptuje ciąg znaków (`"provider/model"`) albo obiekt (`{ primary, fallbacks }`).
  - Używane przez współdzieloną funkcję generowania obrazów oraz każdą przyszłą powierzchnię narzędzia/Pluginu, która generuje obrazy.
  - Typowe wartości: `google/gemini-3.1-flash-image-preview` dla natywnego generowania obrazów Gemini, `fal/fal-ai/flux/dev` dla fal, `openai/gpt-image-2` dla OpenAI Images lub `openai/gpt-image-1.5` dla wyjścia OpenAI PNG/WebP z przezroczystym tłem.
  - Jeśli wybierzesz bezpośrednio providera/model, skonfiguruj też pasujące uwierzytelnianie providera (na przykład `GEMINI_API_KEY` lub `GOOGLE_API_KEY` dla `google/*`, `OPENAI_API_KEY` lub OpenAI Codex OAuth dla `openai/gpt-image-2` / `openai/gpt-image-1.5`, `FAL_KEY` dla `fal/*`).
  - Jeśli pominięte, `image_generate` nadal może wywnioskować domyślnego providera opartego na uwierzytelnianiu. Najpierw próbuje bieżącego domyślnego providera, a następnie pozostałych zarejestrowanych providerów generowania obrazów w kolejności identyfikatorów providerów.
- `musicGenerationModel`: akceptuje ciąg znaków (`"provider/model"`) albo obiekt (`{ primary, fallbacks }`).
  - Używane przez współdzieloną funkcję generowania muzyki oraz wbudowane narzędzie `music_generate`.
  - Typowe wartości: `google/lyria-3-clip-preview`, `google/lyria-3-pro-preview` lub `minimax/music-2.6`.
  - Jeśli pominięte, `music_generate` nadal może wywnioskować domyślnego providera opartego na uwierzytelnianiu. Najpierw próbuje bieżącego domyślnego providera, a następnie pozostałych zarejestrowanych providerów generowania muzyki w kolejności identyfikatorów providerów.
  - Jeśli wybierzesz bezpośrednio providera/model, skonfiguruj też pasujące uwierzytelnianie/klucz API providera.
- `videoGenerationModel`: akceptuje ciąg znaków (`"provider/model"`) albo obiekt (`{ primary, fallbacks }`).
  - Używane przez współdzieloną funkcję generowania wideo oraz wbudowane narzędzie `video_generate`.
  - Typowe wartości: `qwen/wan2.6-t2v`, `qwen/wan2.6-i2v`, `qwen/wan2.6-r2v`, `qwen/wan2.6-r2v-flash` lub `qwen/wan2.7-r2v`.
  - Jeśli pominięte, `video_generate` nadal może wywnioskować domyślnego providera opartego na uwierzytelnianiu. Najpierw próbuje bieżącego domyślnego providera, a następnie pozostałych zarejestrowanych providerów generowania wideo w kolejności identyfikatorów providerów.
  - Jeśli wybierzesz bezpośrednio providera/model, skonfiguruj też pasujące uwierzytelnianie/klucz API providera.
  - Dołączony provider generowania wideo Qwen obsługuje maksymalnie 1 wyjściowe wideo, 1 obraz wejściowy, 4 wejściowe wideo, czas trwania 10 sekund oraz opcje na poziomie providera: `size`, `aspectRatio`, `resolution`, `audio` i `watermark`.
- `pdfModel`: akceptuje ciąg znaków (`"provider/model"`) albo obiekt (`{ primary, fallbacks }`).
  - Używane przez narzędzie `pdf` do trasowania modeli.
  - Jeśli pominięte, narzędzie PDF przechodzi awaryjnie na `imageModel`, a następnie na rozwiązany model sesji/domyślny.
- `pdfMaxBytesMb`: domyślny limit rozmiaru PDF dla narzędzia `pdf`, gdy `maxBytesMb` nie zostanie przekazane w momencie wywołania.
- `pdfMaxPages`: domyślna maksymalna liczba stron uwzględnianych przez tryb awaryjny ekstrakcji w narzędziu `pdf`.
- `verboseDefault`: domyślny poziom szczegółowości dla agentów. Wartości: `"off"`, `"on"`, `"full"`. Domyślnie: `"off"`.
- `reasoningDefault`: domyślna widoczność rozumowania dla agentów. Wartości: `"off"`, `"on"`, `"stream"`. `agents.list[].reasoningDefault` dla agenta zastępuje tę wartość domyślną. Skonfigurowane domyślne wartości rozumowania są stosowane tylko dla właścicieli, autoryzowanych nadawców lub kontekstów operator-admin Gateway, gdy nie ustawiono zastąpienia rozumowania dla wiadomości ani sesji.
- `elevatedDefault`: domyślny poziom podwyższonego wyjścia dla agentów. Wartości: `"off"`, `"on"`, `"ask"`, `"full"`. Domyślnie: `"on"`.
- `model.primary`: format `provider/model` (np. `openai/gpt-5.5` dla dostępu przez klucz API lub `openai-codex/gpt-5.5` dla Codex OAuth). Jeśli pominiesz providera, OpenClaw najpierw próbuje aliasu, potem unikalnego dopasowania skonfigurowanego providera dla dokładnie tego identyfikatora modelu, a dopiero potem przechodzi awaryjnie na skonfigurowanego domyślnego providera (przestarzałe zachowanie zgodności, więc preferuj jawne `provider/model`). Jeśli ten provider nie udostępnia już skonfigurowanego domyślnego modelu, OpenClaw przechodzi awaryjnie na pierwszy skonfigurowany provider/model zamiast ujawniać nieaktualną wartość domyślną usuniętego providera.
- `models`: skonfigurowany katalog modeli i lista dozwolonych modeli dla `/model`. Każdy wpis może zawierać `alias` (skrót) i `params` (specyficzne dla providera, na przykład `temperature`, `maxTokens`, `cacheRetention`, `context1m`, `responsesServerCompaction`, `responsesCompactThreshold`, `chat_template_kwargs`, `extra_body`/`extraBody`).
  - Bezpieczne edycje: użyj `openclaw config set agents.defaults.models '<json>' --strict-json --merge`, aby dodać wpisy. `config set` odrzuca zamiany, które usunęłyby istniejące wpisy listy dozwolonych, chyba że przekażesz `--replace`.
  - Przepływy konfiguracji/onboardingu ograniczone do providera scalają wybrane modele providera z tą mapą i zachowują już skonfigurowanych niepowiązanych providerów.
  - Dla bezpośrednich modeli OpenAI Responses Compaction po stronie serwera jest włączona automatycznie. Użyj `params.responsesServerCompaction: false`, aby przestać wstrzykiwać `context_management`, lub `params.responsesCompactThreshold`, aby zastąpić próg. Zobacz [OpenAI Compaction po stronie serwera](/pl/providers/openai#server-side-compaction-responses-api).
- `params`: globalne domyślne parametry providera stosowane do wszystkich modeli. Ustawiane w `agents.defaults.params` (np. `{ cacheRetention: "long" }`).
- Pierwszeństwo scalania `params` (konfiguracja): `agents.defaults.params` (globalna baza) jest zastępowane przez `agents.defaults.models["provider/model"].params` (dla modelu), następnie `agents.list[].params` (pasujący identyfikator agenta) zastępuje według klucza. Szczegóły znajdziesz w [Buforowaniu promptów](/pl/reference/prompt-caching).
- `params.extra_body`/`params.extraBody`: zaawansowany przekazywany dalej JSON scalany z treściami żądań `api: "openai-completions"` dla proxy zgodnych z OpenAI. Jeśli koliduje z wygenerowanymi kluczami żądania, dodatkowa treść wygrywa; nienatywne trasy completions nadal później usuwają `store` właściwe tylko dla OpenAI.
- `params.chat_template_kwargs`: argumenty szablonu czatu zgodne z vLLM/OpenAI, scalane z treściami żądań najwyższego poziomu `api: "openai-completions"`. Dla `vllm/nemotron-3-*` z wyłączonym myśleniem dołączony Plugin vLLM automatycznie wysyła `enable_thinking: false` i `force_nonempty_content: true`; jawne `chat_template_kwargs` zastępują wygenerowane wartości domyślne, a `extra_body.chat_template_kwargs` nadal ma ostateczne pierwszeństwo. Dla kontrolek myślenia Qwen w vLLM ustaw `params.qwenThinkingFormat` na `"chat-template"` albo `"top-level"` w tym wpisie modelu.
- `compat.supportedReasoningEfforts`: lista nakładu rozumowania zgodna z OpenAI dla modelu. Uwzględnij `"xhigh"` dla niestandardowych endpointów, które rzeczywiście go akceptują; OpenClaw udostępnia wtedy `/think xhigh` w menu poleceń, wierszach sesji Gateway, walidacji poprawek sesji, walidacji CLI agenta oraz walidacji `llm-task` dla tego skonfigurowanego providera/modelu. Użyj `compat.reasoningEffortMap`, gdy backend wymaga wartości specyficznej dla providera dla kanonicznego poziomu.
- `params.preserveThinking`: opcjonalne zachowywanie myślenia tylko dla Z.AI. Gdy jest włączone i myślenie jest aktywne, OpenClaw wysyła `thinking.clear_thinking: false` i odtwarza wcześniejsze `reasoning_content`; zobacz [myślenie Z.AI i zachowane myślenie](/pl/providers/zai#thinking-and-preserved-thinking).
- `agentRuntime`: domyślna niskopoziomowa polityka środowiska uruchomieniowego agenta. Pominięty identyfikator domyślnie oznacza OpenClaw Pi. Użyj `id: "pi"`, aby wymusić wbudowany harness PI, `id: "auto"`, aby pozwolić zarejestrowanym harnessom Pluginów przejmować obsługiwane modele, zarejestrowanego identyfikatora harnessu, takiego jak `id: "codex"`, albo obsługiwanego aliasu backendu CLI, takiego jak `id: "claude-cli"`. Ustaw `fallback: "none"`, aby wyłączyć automatyczne awaryjne przejście na PI. Jawne środowiska uruchomieniowe Pluginów, takie jak `codex`, domyślnie zawodzą w sposób zamknięty, chyba że ustawisz `fallback: "pi"` w tym samym zakresie zastąpienia. Zachowuj odwołania do modeli w kanonicznej postaci `provider/model`; wybieraj Codex, Claude CLI, Gemini CLI i inne backendy wykonawcze przez konfigurację środowiska uruchomieniowego zamiast starszych prefiksów providera środowiska uruchomieniowego. Zobacz [Środowiska uruchomieniowe agentów](/pl/concepts/agent-runtimes), aby dowiedzieć się, czym różni się to od wyboru providera/modelu.
- Programy zapisujące konfigurację, które mutują te pola (na przykład `/models set`, `/models set-image` i polecenia dodawania/usuwania modeli awaryjnych), zapisują kanoniczną formę obiektu i zachowują istniejące listy modeli awaryjnych, gdy to możliwe.
- `maxConcurrent`: maksymalna liczba równoległych uruchomień agentów między sesjami (każda sesja nadal jest serializowana). Domyślnie: 4.

### `agents.defaults.agentRuntime`

`agentRuntime` kontroluje, który niskopoziomowy executor uruchamia tury agenta. Większość
wdrożeń powinna zachować domyślne środowisko uruchomieniowe OpenClaw Pi. Używaj go, gdy zaufany
Plugin udostępnia natywny harness, taki jak dołączony harness serwera aplikacji Codex,
albo gdy chcesz obsługiwany backend CLI, taki jak Claude CLI. Model mentalny opisano w [Środowiskach uruchomieniowych agentów](/pl/concepts/agent-runtimes).

```json5
{
  agents: {
    defaults: {
      model: "openai/gpt-5.5",
      agentRuntime: {
        id: "codex",
        fallback: "none",
      },
    },
  },
}
```

- `id`: `"auto"`, `"pi"`, zarejestrowany identyfikator harnessu Pluginu albo obsługiwany alias backendu CLI. Dołączony Plugin Codex rejestruje `codex`; dołączony Plugin Anthropic udostępnia backend CLI `claude-cli`.
- `fallback`: `"pi"` albo `"none"`. W `id: "auto"` pominięty fallback domyślnie wynosi `"pi"`, aby stare konfiguracje mogły nadal używać PI, gdy żaden harness Pluginu nie przejmuje uruchomienia. W trybie jawnego środowiska uruchomieniowego Pluginu, takim jak `id: "codex"`, pominięty fallback domyślnie wynosi `"none"`, aby brak harnessu powodował błąd zamiast cicho używać PI. Zastąpienia środowiska uruchomieniowego nie dziedziczą fallbacku z szerszego zakresu; ustaw `fallback: "pi"` obok jawnego środowiska uruchomieniowego, gdy celowo chcesz tego awaryjnego fallbacku zgodności. Awarie wybranego harnessu Pluginu zawsze są ujawniane bezpośrednio.
- Zastąpienia środowiskowe: `OPENCLAW_AGENT_RUNTIME=<id|auto|pi>` zastępuje `id`; `OPENCLAW_AGENT_HARNESS_FALLBACK=pi|none` zastępuje fallback dla tego procesu.
- Dla wdrożeń wyłącznie z Codex ustaw `model: "openai/gpt-5.5"` i `agentRuntime.id: "codex"`. Możesz też jawnie ustawić `agentRuntime.fallback: "none"` dla czytelności; jest to domyślne dla jawnych środowisk uruchomieniowych Pluginów.
- Dla wdrożeń Claude CLI preferuj `model: "anthropic/claude-opus-4-7"` plus `agentRuntime.id: "claude-cli"`. Starsze odwołania do modelu `claude-cli/claude-opus-4-7` nadal działają ze względu na zgodność, ale nowa konfiguracja powinna zachować kanoniczny wybór providera/modelu i umieszczać backend wykonawczy w `agentRuntime.id`.
- Starsze klucze polityki środowiska uruchomieniowego są przepisywane na `agentRuntime` przez `openclaw doctor --fix`.
- Wybór harnessu jest przypinany dla identyfikatora sesji po pierwszym uruchomieniu osadzonym. Zmiany konfiguracji/środowiska wpływają na nowe lub zresetowane sesje, a nie na istniejącą transkrypcję. Starsze sesje z historią transkrypcji, ale bez zarejestrowanego przypięcia, są traktowane jako przypięte do PI. `/status` raportuje efektywne środowisko uruchomieniowe, na przykład `Runtime: OpenClaw Pi Default` albo `Runtime: OpenAI Codex`.
- To kontroluje tylko wykonywanie tur agenta tekstowego. Generowanie multimediów, wizja, PDF, muzyka, wideo i TTS nadal używają swoich ustawień providera/modelu.

**Wbudowane skróty aliasów** (mają zastosowanie tylko wtedy, gdy model znajduje się w `agents.defaults.models`):

| Alias               | Model                                      |
| ------------------- | ------------------------------------------ |
| `opus`              | `anthropic/claude-opus-4-6`                |
| `sonnet`            | `anthropic/claude-sonnet-4-6`              |
| `gpt`               | `openai/gpt-5.5` lub `openai-codex/gpt-5.5` |
| `gpt-mini`          | `openai/gpt-5.4-mini`                      |
| `gpt-nano`          | `openai/gpt-5.4-nano`                      |
| `gemini`            | `google/gemini-3.1-pro-preview`            |
| `gemini-flash`      | `google/gemini-3-flash-preview`            |
| `gemini-flash-lite` | `google/gemini-3.1-flash-lite-preview`     |

Skonfigurowane aliasy zawsze mają pierwszeństwo przed wartościami domyślnymi.

Modele Z.AI GLM-4.x automatycznie włączają tryb myślenia, chyba że ustawisz `--thinking off` albo samodzielnie zdefiniujesz `agents.defaults.models["zai/<model>"].params.thinking`.
Modele Z.AI domyślnie włączają `tool_stream` do strumieniowania wywołań narzędzi. Ustaw `agents.defaults.models["zai/<model>"].params.tool_stream` na `false`, aby to wyłączyć.
Modele Anthropic Claude 4.6 domyślnie używają myślenia `adaptive`, gdy nie ustawiono jawnego poziomu myślenia.

### `agents.defaults.cliBackends`

Opcjonalne backendy CLI do tekstowych uruchomień awaryjnych (bez wywołań narzędzi). Przydatne jako zapasowe rozwiązanie, gdy dostawcy API zawodzą.

```json5
{
  agents: {
    defaults: {
      cliBackends: {
        "codex-cli": {
          command: "/opt/homebrew/bin/codex",
        },
        "my-cli": {
          command: "my-cli",
          args: ["--json"],
          output: "json",
          modelArg: "--model",
          sessionArg: "--session",
          sessionMode: "existing",
          systemPromptArg: "--system",
          // Or use systemPromptFileArg when the CLI accepts a prompt file flag.
          systemPromptWhen: "first",
          imageArg: "--image",
          imageMode: "repeat",
        },
      },
    },
  },
}
```

- Backendy CLI są najpierw tekstowe; narzędzia są zawsze wyłączone.
- Sesje są obsługiwane, gdy ustawiono `sessionArg`.
- Przekazywanie obrazów jest obsługiwane, gdy `imageArg` akceptuje ścieżki plików.

### `agents.defaults.systemPromptOverride`

Zastąp cały prompt systemowy składany przez OpenClaw stałym ciągiem tekstowym. Ustaw na poziomie domyślnym (`agents.defaults.systemPromptOverride`) albo dla konkretnego agenta (`agents.list[].systemPromptOverride`). Wartości dla agenta mają pierwszeństwo; wartość pusta lub zawierająca tylko białe znaki jest ignorowana. Przydatne w kontrolowanych eksperymentach z promptami.

```json5
{
  agents: {
    defaults: {
      systemPromptOverride: "You are a helpful assistant.",
    },
  },
}
```

### `agents.defaults.promptOverlays`

Niezależne od dostawcy nakładki promptów stosowane według rodziny modelu. Identyfikatory modeli z rodziny GPT-5 otrzymują wspólny kontrakt zachowania u wszystkich dostawców; `personality` steruje tylko przyjazną warstwą stylu interakcji.

```json5
{
  agents: {
    defaults: {
      promptOverlays: {
        gpt5: {
          personality: "friendly", // friendly | on | off
        },
      },
    },
  },
}
```

- `"friendly"` (domyślnie) i `"on"` włączają przyjazną warstwę stylu interakcji.
- `"off"` wyłącza tylko przyjazną warstwę; oznaczony tagiem kontrakt zachowania GPT-5 pozostaje włączony.
- Starsze `plugins.entries.openai.config.personality` jest nadal odczytywane, gdy to wspólne ustawienie nie jest ustawione.

### `agents.defaults.heartbeat`

Okresowe uruchomienia Heartbeat.

```json5
{
  agents: {
    defaults: {
      heartbeat: {
        every: "30m", // 0m disables
        model: "openai/gpt-5.4-mini",
        includeReasoning: false,
        includeSystemPromptSection: true, // default: true; false omits the Heartbeat section from the system prompt
        lightContext: false, // default: false; true keeps only HEARTBEAT.md from workspace bootstrap files
        isolatedSession: false, // default: false; true runs each heartbeat in a fresh session (no conversation history)
        skipWhenBusy: false, // default: false; true also waits for subagent/nested lanes
        session: "main",
        to: "+15555550123",
        directPolicy: "allow", // allow (default) | block
        target: "none", // default: none | options: last | whatsapp | telegram | discord | ...
        prompt: "Read HEARTBEAT.md if it exists...",
        ackMaxChars: 300,
        suppressToolErrorWarnings: false,
        timeoutSeconds: 45,
      },
    },
  },
}
```

- `every`: ciąg czasu trwania (ms/s/m/h). Domyślnie: `30m` (uwierzytelnianie kluczem API) albo `1h` (uwierzytelnianie OAuth). Ustaw na `0m`, aby wyłączyć.
- `includeSystemPromptSection`: gdy ma wartość false, pomija sekcję Heartbeat w prompcie systemowym i pomija wstrzyknięcie `HEARTBEAT.md` do kontekstu startowego. Domyślnie: `true`.
- `suppressToolErrorWarnings`: gdy ma wartość true, wycisza ładunki ostrzeżeń o błędach narzędzi podczas uruchomień Heartbeat.
- `timeoutSeconds`: maksymalny czas w sekundach dozwolony dla tury agenta Heartbeat przed jej przerwaniem. Pozostaw nieustawione, aby użyć `agents.defaults.timeoutSeconds`.
- `directPolicy`: polityka dostarczania bezpośredniego/DM. `allow` (domyślnie) zezwala na dostarczanie do celu bezpośredniego. `block` wycisza dostarczanie do celu bezpośredniego i emituje `reason=dm-blocked`.
- `lightContext`: gdy ma wartość true, uruchomienia Heartbeat używają lekkiego kontekstu startowego i zachowują tylko `HEARTBEAT.md` z plików startowych obszaru roboczego.
- `isolatedSession`: gdy ma wartość true, każde uruchomienie Heartbeat działa w świeżej sesji bez wcześniejszej historii rozmowy. Ten sam wzorzec izolacji co cron `sessionTarget: "isolated"`. Zmniejsza koszt tokenów na Heartbeat z około 100 tys. do około 2-5 tys. tokenów.
- `skipWhenBusy`: gdy ma wartość true, uruchomienia Heartbeat są odraczane także przy dodatkowo zajętych ścieżkach: pracy podagentów lub zagnieżdżonych poleceń. Ścieżki Cron zawsze odraczają Heartbeat, nawet bez tej flagi.
- Dla agenta: ustaw `agents.list[].heartbeat`. Gdy dowolny agent definiuje `heartbeat`, **tylko ci agenci** uruchamiają Heartbeat.
- Heartbeat uruchamia pełne tury agenta — krótsze odstępy zużywają więcej tokenów.

### `agents.defaults.compaction`

```json5
{
  agents: {
    defaults: {
      compaction: {
        mode: "safeguard", // default | safeguard
        provider: "my-provider", // id of a registered compaction provider plugin (optional)
        timeoutSeconds: 900,
        reserveTokensFloor: 24000,
        keepRecentTokens: 50000,
        identifierPolicy: "strict", // strict | off | custom
        identifierInstructions: "Preserve deployment IDs, ticket IDs, and host:port pairs exactly.", // used when identifierPolicy=custom
        qualityGuard: { enabled: true, maxRetries: 1 },
        postCompactionSections: ["Session Startup", "Red Lines"], // [] disables reinjection
        model: "openrouter/anthropic/claude-sonnet-4-6", // optional compaction-only model override
        truncateAfterCompaction: true, // rotate to a smaller successor JSONL after compaction
        maxActiveTranscriptBytes: "20mb", // optional preflight local compaction trigger
        notifyUser: true, // send brief notices when compaction starts and completes (default: false)
        memoryFlush: {
          enabled: true,
          model: "ollama/qwen3:8b", // optional memory-flush-only model override
          softThresholdTokens: 6000,
          systemPrompt: "Session nearing compaction. Store durable memories now.",
          prompt: "Write any lasting notes to memory/YYYY-MM-DD.md; reply with the exact silent token NO_REPLY if nothing to store.",
        },
      },
    },
  },
}
```

- `mode`: `default` albo `safeguard` (dzielone na fragmenty streszczanie długich historii). Zobacz [Compaction](/pl/concepts/compaction).
- `provider`: identyfikator zarejestrowanego Plugin dostawcy Compaction. Gdy jest ustawiony, wywoływane jest `summarize()` dostawcy zamiast wbudowanego streszczania LLM. W razie błędu następuje powrót do wbudowanego mechanizmu. Ustawienie dostawcy wymusza `mode: "safeguard"`. Zobacz [Compaction](/pl/concepts/compaction).
- `timeoutSeconds`: maksymalna liczba sekund dozwolona dla pojedynczej operacji Compaction, zanim OpenClaw ją przerwie. Domyślnie: `900`.
- `keepRecentTokens`: budżet punktu odcięcia Pi do zachowania najnowszej końcówki transkrypcji dosłownie. Ręczne `/compact` honoruje to, gdy ustawiono jawnie; w przeciwnym razie ręczna Compaction jest twardym punktem kontrolnym.
- `identifierPolicy`: `strict` (domyślnie), `off` albo `custom`. `strict` poprzedza streszczanie Compaction wbudowanymi wskazówkami dotyczącymi zachowywania nieprzezroczystych identyfikatorów.
- `identifierInstructions`: opcjonalny niestandardowy tekst zachowywania identyfikatorów używany, gdy `identifierPolicy=custom`.
- `qualityGuard`: kontrole ponowienia przy niepoprawnie sformatowanych wynikach dla podsumowań safeguard. Domyślnie włączone w trybie safeguard; ustaw `enabled: false`, aby pominąć audyt.
- `postCompactionSections`: opcjonalne nazwy sekcji H2/H3 z AGENTS.md do ponownego wstrzyknięcia po Compaction. Domyślnie `["Session Startup", "Red Lines"]`; ustaw `[]`, aby wyłączyć ponowne wstrzyknięcie. Gdy nieustawione lub jawnie ustawione na tę domyślną parę, starsze nagłówki `Every Session`/`Safety` są też akceptowane jako starszy mechanizm awaryjny.
- `model`: opcjonalne nadpisanie `provider/model-id` tylko dla streszczania Compaction. Użyj tego, gdy główna sesja ma zachować jeden model, ale podsumowania Compaction mają działać na innym; gdy nieustawione, Compaction używa podstawowego modelu sesji.
- `maxActiveTranscriptBytes`: opcjonalny próg bajtów (`number` albo ciągi takie jak `"20mb"`), który wyzwala zwykłą lokalną Compaction przed uruchomieniem, gdy aktywny JSONL przekroczy próg. Wymaga `truncateAfterCompaction`, aby udana Compaction mogła obrócić transkrypcję do mniejszego następcy. Wyłączone, gdy nieustawione albo `0`.
- `notifyUser`: gdy `true`, wysyła użytkownikowi krótkie powiadomienia, gdy Compaction się rozpoczyna i gdy się kończy (na przykład „Kompaktowanie kontekstu...” i „Compaction zakończona”). Domyślnie wyłączone, aby Compaction była cicha.
- `memoryFlush`: cicha agentowa tura przed automatyczną Compaction w celu zapisania trwałych wspomnień. Ustaw `model` na dokładny provider/model, taki jak `ollama/qwen3:8b`, gdy ta tura porządkowa ma pozostać na modelu lokalnym; nadpisanie nie dziedziczy aktywnego łańcucha awaryjnego sesji. Pomijane, gdy obszar roboczy jest tylko do odczytu.

### `agents.defaults.contextPruning`

Przycina **stare wyniki narzędzi** z kontekstu w pamięci przed wysłaniem do LLM. **Nie** modyfikuje historii sesji na dysku.

```json5
{
  agents: {
    defaults: {
      contextPruning: {
        mode: "cache-ttl", // off | cache-ttl
        ttl: "1h", // duration (ms/s/m/h), default unit: minutes
        keepLastAssistants: 3,
        softTrimRatio: 0.3,
        hardClearRatio: 0.5,
        minPrunableToolChars: 50000,
        softTrim: { maxChars: 4000, headChars: 1500, tailChars: 1500 },
        hardClear: { enabled: true, placeholder: "[Old tool result content cleared]" },
        tools: { deny: ["browser", "canvas"] },
      },
    },
  },
}
```

<Accordion title="zachowanie trybu cache-ttl">

- `mode: "cache-ttl"` włącza przebiegi przycinania.
- `ttl` steruje tym, jak często przycinanie może uruchomić się ponownie (po ostatnim dotknięciu cache).
- Przycinanie najpierw miękko przycina nadmiernie duże wyniki narzędzi, a potem w razie potrzeby twardo czyści starsze wyniki narzędzi.

**Miękkie przycinanie** zachowuje początek i koniec oraz wstawia `...` pośrodku.

**Twarde czyszczenie** zastępuje cały wynik narzędzia symbolem zastępczym.

Uwagi:

- Bloki obrazów nigdy nie są przycinane/czyszczone.
- Współczynniki są oparte na znakach (przybliżone), a nie na dokładnej liczbie tokenów.
- Jeśli istnieje mniej niż `keepLastAssistants` wiadomości asystenta, przycinanie jest pomijane.

</Accordion>

Zobacz [Przycinanie sesji](/pl/concepts/session-pruning), aby poznać szczegóły zachowania.

### Strumieniowanie bloków

```json5
{
  agents: {
    defaults: {
      blockStreamingDefault: "off", // on | off
      blockStreamingBreak: "text_end", // text_end | message_end
      blockStreamingChunk: { minChars: 800, maxChars: 1200 },
      blockStreamingCoalesce: { idleMs: 1000 },
      humanDelay: { mode: "natural" }, // off | natural | custom (use minMs/maxMs)
    },
  },
}
```

- Kanały inne niż Telegram wymagają jawnego `*.blockStreaming: true`, aby włączyć odpowiedzi blokowe.
- Nadpisania kanałów: `channels.<channel>.blockStreamingCoalesce` (oraz warianty dla konta). Signal/Slack/Discord/Google Chat domyślnie używają `minChars: 1500`.
- `humanDelay`: losowa pauza między odpowiedziami blokowymi. `natural` = 800–2500 ms. Nadpisanie dla agenta: `agents.list[].humanDelay`.

Zobacz [Streaming](/pl/concepts/streaming), aby poznać szczegóły zachowania i dzielenia na fragmenty.

### Wskaźniki pisania

```json5
{
  agents: {
    defaults: {
      typingMode: "instant", // never | instant | thinking | message
      typingIntervalSeconds: 6,
    },
  },
}
```

- Domyślne: `instant` dla bezpośrednich czatów/wzmianek, `message` dla czatów grupowych bez wzmianki.
- Nadpisania dla sesji: `session.typingMode`, `session.typingIntervalSeconds`.

Zobacz [Wskaźniki pisania](/pl/concepts/typing-indicators).

<a id="agentsdefaultssandbox"></a>

### `agents.defaults.sandbox`

Opcjonalne sandboxowanie dla osadzonego agenta. Pełny przewodnik znajdziesz w [Sandboxowanie](/pl/gateway/sandboxing).

```json5
{
  agents: {
    defaults: {
      sandbox: {
        mode: "non-main", // off | non-main | all
        backend: "docker", // docker | ssh | openshell
        scope: "agent", // session | agent | shared
        workspaceAccess: "none", // none | ro | rw
        workspaceRoot: "~/.openclaw/sandboxes",
        docker: {
          image: "openclaw-sandbox:bookworm-slim",
          containerPrefix: "openclaw-sbx-",
          workdir: "/workspace",
          readOnlyRoot: true,
          tmpfs: ["/tmp", "/var/tmp", "/run"],
          network: "none",
          user: "1000:1000",
          capDrop: ["ALL"],
          env: { LANG: "C.UTF-8" },
          setupCommand: "apt-get update && apt-get install -y git curl jq",
          pidsLimit: 256,
          memory: "1g",
          memorySwap: "2g",
          cpus: 1,
          ulimits: {
            nofile: { soft: 1024, hard: 2048 },
            nproc: 256,
          },
          seccompProfile: "/path/to/seccomp.json",
          apparmorProfile: "openclaw-sandbox",
          dns: ["1.1.1.1", "8.8.8.8"],
          extraHosts: ["internal.service:10.0.0.5"],
          binds: ["/home/user/source:/source:rw"],
        },
        ssh: {
          target: "user@gateway-host:22",
          command: "ssh",
          workspaceRoot: "/tmp/openclaw-sandboxes",
          strictHostKeyChecking: true,
          updateHostKeys: true,
          identityFile: "~/.ssh/id_ed25519",
          certificateFile: "~/.ssh/id_ed25519-cert.pub",
          knownHostsFile: "~/.ssh/known_hosts",
          // SecretRefs / inline contents also supported:
          // identityData: { source: "env", provider: "default", id: "SSH_IDENTITY" },
          // certificateData: { source: "env", provider: "default", id: "SSH_CERTIFICATE" },
          // knownHostsData: { source: "env", provider: "default", id: "SSH_KNOWN_HOSTS" },
        },
        browser: {
          enabled: false,
          image: "openclaw-sandbox-browser:bookworm-slim",
          network: "openclaw-sandbox-browser",
          cdpPort: 9222,
          cdpSourceRange: "172.21.0.1/32",
          vncPort: 5900,
          noVncPort: 6080,
          headless: false,
          enableNoVnc: true,
          allowHostControl: false,
          autoStart: true,
          autoStartTimeoutMs: 12000,
        },
        prune: {
          idleHours: 24,
          maxAgeDays: 7,
        },
      },
    },
  },
  tools: {
    sandbox: {
      tools: {
        allow: [
          "exec",
          "process",
          "read",
          "write",
          "edit",
          "apply_patch",
          "sessions_list",
          "sessions_history",
          "sessions_send",
          "sessions_spawn",
          "session_status",
        ],
        deny: ["browser", "canvas", "nodes", "cron", "discord", "gateway"],
      },
    },
  },
}
```

<Accordion title="Szczegóły piaskownicy">

**Backend:**

- `docker`: lokalne środowisko wykonawcze Docker (domyślnie)
- `ssh`: ogólne zdalne środowisko wykonawcze oparte na SSH
- `openshell`: środowisko wykonawcze OpenShell

Gdy wybrano `backend: "openshell"`, ustawienia specyficzne dla środowiska wykonawczego przenoszą się do
`plugins.entries.openshell.config`.

**Konfiguracja backendu SSH:**

- `target`: cel SSH w formacie `user@host[:port]`
- `command`: polecenie klienta SSH (domyślnie: `ssh`)
- `workspaceRoot`: bezwzględny zdalny katalog główny używany dla obszarów roboczych dla poszczególnych zakresów
- `identityFile` / `certificateFile` / `knownHostsFile`: istniejące pliki lokalne przekazywane do OpenSSH
- `identityData` / `certificateData` / `knownHostsData`: treści inline lub SecretRefs, które OpenClaw materializuje w plikach tymczasowych w czasie działania
- `strictHostKeyChecking` / `updateHostKeys`: przełączniki polityki kluczy hosta OpenSSH

**Pierwszeństwo uwierzytelniania SSH:**

- `identityData` ma pierwszeństwo przed `identityFile`
- `certificateData` ma pierwszeństwo przed `certificateFile`
- `knownHostsData` ma pierwszeństwo przed `knownHostsFile`
- Wartości `*Data` oparte na SecretRef są rozwiązywane z aktywnego zrzutu środowiska wykonawczego sekretów przed uruchomieniem sesji piaskownicy

**Zachowanie backendu SSH:**

- inicjalizuje zdalny obszar roboczy raz po utworzeniu lub ponownym utworzeniu
- następnie utrzymuje zdalny obszar roboczy SSH jako kanoniczny
- kieruje `exec`, narzędzia plikowe i ścieżki mediów przez SSH
- nie synchronizuje automatycznie zdalnych zmian z powrotem do hosta
- nie obsługuje kontenerów przeglądarki piaskownicy

**Dostęp do obszaru roboczego:**

- `none`: obszar roboczy piaskownicy dla danego zakresu pod `~/.openclaw/sandboxes`
- `ro`: obszar roboczy piaskownicy w `/workspace`, obszar roboczy agenta zamontowany tylko do odczytu w `/agent`
- `rw`: obszar roboczy agenta zamontowany do odczytu/zapisu w `/workspace`

**Zakres:**

- `session`: kontener i obszar roboczy dla sesji
- `agent`: jeden kontener i obszar roboczy na agenta (domyślnie)
- `shared`: współdzielony kontener i obszar roboczy (bez izolacji między sesjami)

**Konfiguracja Plugin OpenShell:**

```json5
{
  plugins: {
    entries: {
      openshell: {
        enabled: true,
        config: {
          mode: "mirror", // mirror | remote
          from: "openclaw",
          remoteWorkspaceDir: "/sandbox",
          remoteAgentWorkspaceDir: "/agent",
          gateway: "lab", // optional
          gatewayEndpoint: "https://lab.example", // optional
          policy: "strict", // optional OpenShell policy id
          providers: ["openai"], // optional
          autoProviders: true,
          timeoutSeconds: 120,
        },
      },
    },
  },
}
```

**Tryb OpenShell:**

- `mirror`: inicjalizuje zdalny obszar z lokalnego przed wykonaniem, synchronizuje z powrotem po wykonaniu; lokalny obszar roboczy pozostaje kanoniczny
- `remote`: inicjalizuje zdalny obszar raz podczas tworzenia piaskownicy, a następnie utrzymuje zdalny obszar roboczy jako kanoniczny

W trybie `remote` lokalne zmiany hosta wykonane poza OpenClaw nie są automatycznie synchronizowane do piaskownicy po kroku inicjalizacji.
Transport odbywa się przez SSH do piaskownicy OpenShell, ale Plugin zarządza cyklem życia piaskownicy i opcjonalną synchronizacją lustrzaną.

**`setupCommand`** uruchamia się raz po utworzeniu kontenera (przez `sh -lc`). Wymaga ruchu wychodzącego do sieci, zapisywalnego katalogu głównego i użytkownika root.

**Kontenery domyślnie używają `network: "none"`** — ustaw na `"bridge"` (lub niestandardową sieć bridge), jeśli agent potrzebuje dostępu wychodzącego.
`"host"` jest zablokowane. `"container:<id>"` jest domyślnie zablokowane, chyba że jawnie ustawisz
`sandbox.docker.dangerouslyAllowContainerNamespaceJoin: true` (awaryjnie).

**Załączniki przychodzące** są przygotowywane w `media/inbound/*` w aktywnym obszarze roboczym.

**`docker.binds`** montuje dodatkowe katalogi hosta; powiązania globalne i dla poszczególnych agentów są scalane.

**Przeglądarka w piaskownicy** (`sandbox.browser.enabled`): Chromium + CDP w kontenerze. URL noVNC wstrzykiwany do promptu systemowego. Nie wymaga `browser.enabled` w `openclaw.json`.
Dostęp obserwatora noVNC domyślnie używa uwierzytelniania VNC, a OpenClaw emituje krótkotrwały URL z tokenem (zamiast ujawniać hasło we współdzielonym URL-u).

- `allowHostControl: false` (domyślnie) blokuje sesjom w piaskownicy możliwość wskazywania przeglądarki hosta jako celu.
- `network` domyślnie ma wartość `openclaw-sandbox-browser` (dedykowana sieć bridge). Ustaw `bridge` tylko wtedy, gdy jawnie chcesz globalnej łączności bridge.
- `cdpSourceRange` opcjonalnie ogranicza ruch przychodzący CDP na krawędzi kontenera do zakresu CIDR (na przykład `172.21.0.1/32`).
- `sandbox.browser.binds` montuje dodatkowe katalogi hosta wyłącznie w kontenerze przeglądarki piaskownicy. Gdy jest ustawione (w tym `[]`), zastępuje `docker.binds` dla kontenera przeglądarki.
- Domyślne opcje uruchamiania są zdefiniowane w `scripts/sandbox-browser-entrypoint.sh` i dostrojone pod hosty kontenerów:
  - `--remote-debugging-address=127.0.0.1`
  - `--remote-debugging-port=<derived from OPENCLAW_BROWSER_CDP_PORT>`
  - `--user-data-dir=${HOME}/.chrome`
  - `--no-first-run`
  - `--no-default-browser-check`
  - `--disable-3d-apis`
  - `--disable-gpu`
  - `--disable-software-rasterizer`
  - `--disable-dev-shm-usage`
  - `--disable-background-networking`
  - `--disable-features=TranslateUI`
  - `--disable-breakpad`
  - `--disable-crash-reporter`
  - `--renderer-process-limit=2`
  - `--no-zygote`
  - `--metrics-recording-only`
  - `--disable-extensions` (domyślnie włączone)
  - `--disable-3d-apis`, `--disable-software-rasterizer` i `--disable-gpu` są
    domyślnie włączone i można je wyłączyć za pomocą
    `OPENCLAW_BROWSER_DISABLE_GRAPHICS_FLAGS=0`, jeśli wymaga tego użycie WebGL/3D.
  - `OPENCLAW_BROWSER_DISABLE_EXTENSIONS=0` ponownie włącza rozszerzenia, jeśli Twój przepływ pracy
    od nich zależy.
  - `--renderer-process-limit=2` można zmienić za pomocą
    `OPENCLAW_BROWSER_RENDERER_PROCESS_LIMIT=<N>`; ustaw `0`, aby użyć domyślnego
    limitu procesów Chromium.
  - oraz `--no-sandbox`, gdy włączono `noSandbox`.
  - Wartości domyślne stanowią bazę obrazu kontenera; użyj niestandardowego obrazu przeglądarki z niestandardowym
    punktem wejścia, aby zmienić wartości domyślne kontenera.

</Accordion>

Sandboxowanie przeglądarki i `sandbox.docker.binds` działają tylko z Docker.

Zbuduj obrazy:

```bash
scripts/sandbox-setup.sh           # main sandbox image
scripts/sandbox-browser-setup.sh   # optional browser image
```

### `agents.list` (nadpisania dla poszczególnych agentów)

Użyj `agents.list[].tts`, aby nadać agentowi własnego dostawcę TTS, głos, model,
styl lub tryb automatycznego TTS. Blok agenta jest głęboko scalany z globalnym
`messages.tts`, więc współdzielone dane uwierzytelniające mogą pozostać w jednym miejscu, a poszczególni
agenci nadpisują tylko te pola głosu lub dostawcy, których potrzebują. Nadpisanie aktywnego agenta
ma zastosowanie do automatycznych odpowiedzi mówionych, `/tts audio`, `/tts status` i
narzędzia agenta `tts`. Zobacz [Tekst na mowę](/pl/tools/tts#per-agent-voice-overrides),
aby poznać przykłady dostawców i zasady pierwszeństwa.

```json5
{
  agents: {
    list: [
      {
        id: "main",
        default: true,
        name: "Main Agent",
        workspace: "~/.openclaw/workspace",
        agentDir: "~/.openclaw/agents/main/agent",
        model: "anthropic/claude-opus-4-6", // or { primary, fallbacks }
        thinkingDefault: "high", // per-agent thinking level override
        reasoningDefault: "on", // per-agent reasoning visibility override
        fastModeDefault: false, // per-agent fast mode override
        agentRuntime: { id: "auto", fallback: "pi" },
        params: { cacheRetention: "none" }, // overrides matching defaults.models params by key
        tts: {
          providers: {
            elevenlabs: { voiceId: "EXAVITQu4vr4xnSDxMaL" },
          },
        },
        skills: ["docs-search"], // replaces agents.defaults.skills when set
        identity: {
          name: "Samantha",
          theme: "helpful sloth",
          emoji: "🦥",
          avatar: "avatars/samantha.png",
        },
        groupChat: { mentionPatterns: ["@openclaw"] },
        sandbox: { mode: "off" },
        runtime: {
          type: "acp",
          acp: {
            agent: "codex",
            backend: "acpx",
            mode: "persistent",
            cwd: "/workspace/openclaw",
          },
        },
        subagents: { allowAgents: ["*"] },
        tools: {
          profile: "coding",
          allow: ["browser"],
          deny: ["canvas"],
          elevated: { enabled: true },
        },
      },
    ],
  },
}
```

- `id`: stabilny identyfikator agenta (wymagany).
- `default`: gdy ustawiono kilka, wygrywa pierwszy (rejestrowane jest ostrzeżenie). Jeśli nie ustawiono żadnego, domyślny jest pierwszy wpis listy.
- `model`: forma tekstowa ustawia ścisły główny model dla agenta bez modelu zapasowego; forma obiektowa `{ primary }` również jest ścisła, chyba że dodasz `fallbacks`. Użyj `{ primary, fallbacks: [...] }`, aby włączyć dla tego agenta modele zapasowe, albo `{ primary, fallbacks: [] }`, aby jawnie ustawić zachowanie ścisłe. Zadania Cron, które nadpisują tylko `primary`, nadal dziedziczą domyślne modele zapasowe, chyba że ustawisz `fallbacks: []`.
- `params`: parametry strumienia dla agenta, scalane nad wybranym wpisem modelu w `agents.defaults.models`. Użyj tego do nadpisań specyficznych dla agenta, takich jak `cacheRetention`, `temperature` lub `maxTokens`, bez duplikowania całego katalogu modeli.
- `tts`: opcjonalne nadpisania zamiany tekstu na mowę dla agenta. Blok jest głęboko scalany nad `messages.tts`, więc wspólne dane uwierzytelniające dostawcy i politykę modeli zapasowych trzymaj w `messages.tts`, a tutaj ustawiaj tylko wartości specyficzne dla persony, takie jak dostawca, głos, model, styl lub tryb automatyczny.
- `skills`: opcjonalna lista dozwolonych Skills dla agenta. Jeśli pominięto, agent dziedziczy `agents.defaults.skills`, gdy jest ustawione; jawna lista zastępuje wartości domyślne zamiast je scalać, a `[]` oznacza brak Skills.
- `thinkingDefault`: opcjonalny domyślny poziom myślenia dla agenta (`off | minimal | low | medium | high | xhigh | adaptive | max`). Nadpisuje `agents.defaults.thinkingDefault` dla tego agenta, gdy nie ustawiono nadpisania dla wiadomości ani sesji. Wybrany profil dostawcy/modelu kontroluje, które wartości są prawidłowe; dla Google Gemini `adaptive` zachowuje dynamiczne myślenie po stronie dostawcy (`thinkingLevel` pominięte w Gemini 3/3.1, `thinkingBudget: -1` w Gemini 2.5).
- `reasoningDefault`: opcjonalna domyślna widoczność rozumowania dla agenta (`on | off | stream`). Nadpisuje `agents.defaults.reasoningDefault` dla tego agenta, gdy nie ustawiono nadpisania rozumowania dla wiadomości ani sesji.
- `fastModeDefault`: opcjonalna wartość domyślna trybu szybkiego dla agenta (`true | false`). Ma zastosowanie, gdy nie ustawiono nadpisania trybu szybkiego dla wiadomości ani sesji.
- `agentRuntime`: opcjonalne niskopoziomowe nadpisanie polityki środowiska wykonawczego dla agenta. Użyj `{ id: "codex" }`, aby jeden agent używał wyłącznie Codex, podczas gdy inni agenci zachowują domyślny zapasowy PI w trybie `auto`.
- `runtime`: opcjonalny deskryptor środowiska wykonawczego dla agenta. Użyj `type: "acp"` z wartościami domyślnymi `runtime.acp` (`agent`, `backend`, `mode`, `cwd`), gdy agent ma domyślnie używać sesji uprzęży ACP.
- `identity.avatar`: ścieżka względna wobec obszaru roboczego, URL `http(s)` albo URI `data:`.
- `identity` wyprowadza wartości domyślne: `ackReaction` z `emoji`, `mentionPatterns` z `name`/`emoji`.
- `subagents.allowAgents`: lista dozwolonych identyfikatorów agentów dla jawnych celów `sessions_spawn.agentId` (`["*"]` = dowolny; domyślnie: tylko ten sam agent). Uwzględnij identyfikator żądającego, gdy samocelujące wywołania `agentId` mają być dozwolone.
- Ochrona dziedziczenia piaskownicy: jeśli sesja żądającego działa w piaskownicy, `sessions_spawn` odrzuca cele, które działałyby poza piaskownicą.
- `subagents.requireAgentId`: gdy ma wartość true, blokuje wywołania `sessions_spawn`, które pomijają `agentId` (wymusza jawny wybór profilu; domyślnie: false).

---

## Routing wieloagentowy

Uruchamiaj wielu izolowanych agentów w jednym Gateway. Zobacz [Wielu agentów](/pl/concepts/multi-agent).

```json5
{
  agents: {
    list: [
      { id: "home", default: true, workspace: "~/.openclaw/workspace-home" },
      { id: "work", workspace: "~/.openclaw/workspace-work" },
    ],
  },
  bindings: [
    { agentId: "home", match: { channel: "whatsapp", accountId: "personal" } },
    { agentId: "work", match: { channel: "whatsapp", accountId: "biz" } },
  ],
}
```

### Pola dopasowania powiązania

- `type` (opcjonalne): `route` dla normalnego routingu (brakujący typ domyślnie oznacza route), `acp` dla trwałych powiązań konwersacji ACP.
- `match.channel` (wymagane)
- `match.accountId` (opcjonalne; `*` = dowolne konto; pominięte = konto domyślne)
- `match.peer` (opcjonalne; `{ kind: direct|group|channel, id }`)
- `match.guildId` / `match.teamId` (opcjonalne; specyficzne dla kanału)
- `acp` (opcjonalne; tylko dla `type: "acp"`): `{ mode, label, cwd, backend }`

**Deterministyczna kolejność dopasowania:**

1. `match.peer`
2. `match.guildId`
3. `match.teamId`
4. `match.accountId` (dokładne, bez peer/guild/team)
5. `match.accountId: "*"` (w całym kanale)
6. Agent domyślny

W każdym poziomie wygrywa pierwszy pasujący wpis `bindings`.

Dla wpisów `type: "acp"` OpenClaw rozwiązuje przez dokładną tożsamość konwersacji (`match.channel` + konto + `match.peer.id`) i nie używa powyższej kolejności poziomów powiązań routingu.

### Profile dostępu dla agenta

<Accordion title="Full access (no sandbox)">

```json5
{
  agents: {
    list: [
      {
        id: "personal",
        workspace: "~/.openclaw/workspace-personal",
        sandbox: { mode: "off" },
      },
    ],
  },
}
```

</Accordion>

<Accordion title="Read-only tools + workspace">

```json5
{
  agents: {
    list: [
      {
        id: "family",
        workspace: "~/.openclaw/workspace-family",
        sandbox: { mode: "all", scope: "agent", workspaceAccess: "ro" },
        tools: {
          allow: [
            "read",
            "sessions_list",
            "sessions_history",
            "sessions_send",
            "sessions_spawn",
            "session_status",
          ],
          deny: ["write", "edit", "apply_patch", "exec", "process", "browser"],
        },
      },
    ],
  },
}
```

</Accordion>

<Accordion title="No filesystem access (messaging only)">

```json5
{
  agents: {
    list: [
      {
        id: "public",
        workspace: "~/.openclaw/workspace-public",
        sandbox: { mode: "all", scope: "agent", workspaceAccess: "none" },
        tools: {
          allow: [
            "sessions_list",
            "sessions_history",
            "sessions_send",
            "sessions_spawn",
            "session_status",
            "whatsapp",
            "telegram",
            "slack",
            "discord",
            "gateway",
          ],
          deny: [
            "read",
            "write",
            "edit",
            "apply_patch",
            "exec",
            "process",
            "browser",
            "canvas",
            "nodes",
            "cron",
            "gateway",
            "image",
          ],
        },
      },
    ],
  },
}
```

</Accordion>

Zobacz [Piaskownica i narzędzia wielu agentów](/pl/tools/multi-agent-sandbox-tools), aby uzyskać szczegóły pierwszeństwa.

---

## Sesja

```json5
{
  session: {
    scope: "per-sender",
    dmScope: "main", // main | per-peer | per-channel-peer | per-account-channel-peer
    identityLinks: {
      alice: ["telegram:123456789", "discord:987654321012345678"],
    },
    reset: {
      mode: "daily", // daily | idle
      atHour: 4,
      idleMinutes: 60,
    },
    resetByType: {
      thread: { mode: "daily", atHour: 4 },
      direct: { mode: "idle", idleMinutes: 240 },
      group: { mode: "idle", idleMinutes: 120 },
    },
    resetTriggers: ["/new", "/reset"],
    store: "~/.openclaw/agents/{agentId}/sessions/sessions.json",
    parentForkMaxTokens: 100000, // skip parent-thread fork above this token count (0 disables)
    maintenance: {
      mode: "warn", // warn | enforce
      pruneAfter: "30d",
      maxEntries: 500,
      resetArchiveRetention: "30d", // duration or false
      maxDiskBytes: "500mb", // optional hard budget
      highWaterBytes: "400mb", // optional cleanup target
    },
    threadBindings: {
      enabled: true,
      idleHours: 24, // default inactivity auto-unfocus in hours (`0` disables)
      maxAgeHours: 0, // default hard max age in hours (`0` disables)
    },
    mainKey: "main", // legacy (runtime always uses "main")
    agentToAgent: { maxPingPongTurns: 5 },
    sendPolicy: {
      rules: [{ action: "deny", match: { channel: "discord", chatType: "group" } }],
      default: "allow",
    },
  },
}
```

<Accordion title="Session field details">

- **`scope`**: podstawowa strategia grupowania sesji dla kontekstów czatu grupowego.
  - `per-sender` (domyślnie): każdy nadawca otrzymuje izolowaną sesję w kontekście kanału.
  - `global`: wszyscy uczestnicy w kontekście kanału współdzielą jedną sesję (używaj tylko wtedy, gdy zamierzony jest wspólny kontekst).
- **`dmScope`**: sposób grupowania wiadomości DM.
  - `main`: wszystkie DM współdzielą sesję główną.
  - `per-peer`: izoluj według identyfikatora nadawcy między kanałami.
  - `per-channel-peer`: izoluj według kanału + nadawcy (zalecane dla skrzynek odbiorczych wielu użytkowników).
  - `per-account-channel-peer`: izoluj według konta + kanału + nadawcy (zalecane dla wielu kont).
- **`identityLinks`**: mapuje kanoniczne identyfikatory na peery z prefiksem dostawcy do współdzielenia sesji między kanałami. Polecenia dokowania, takie jak `/dock_discord`, używają tej samej mapy do przełączenia trasy odpowiedzi aktywnej sesji na inny połączony peer kanału; zobacz [Dokowanie kanałów](/pl/concepts/channel-docking).
- **`reset`**: główna polityka resetowania. `daily` resetuje o `atHour` czasu lokalnego; `idle` resetuje po `idleMinutes`. Gdy skonfigurowano oba, wygrywa ten, który wygaśnie pierwszy. Świeżość resetu dziennego używa `sessionStartedAt` wiersza sesji; świeżość resetu bezczynności używa `lastInteractionAt`. Zapisy w tle/zdarzeń systemowych, takie jak heartbeat, wybudzenia cron, powiadomienia exec i księgowanie gateway, mogą aktualizować `updatedAt`, ale nie utrzymują świeżości sesji dziennych/bezczynnych.
- **`resetByType`**: nadpisania według typu (`direct`, `group`, `thread`). Starsze `dm` akceptowane jako alias dla `direct`.
- **`parentForkMaxTokens`**: maksymalna dozwolona wartość `totalTokens` sesji nadrzędnej podczas tworzenia rozwidlonej sesji wątku (domyślnie `100000`).
  - Jeśli `totalTokens` nadrzędnej sesji jest powyżej tej wartości, OpenClaw rozpoczyna świeżą sesję wątku zamiast dziedziczyć historię transkrypcji z sesji nadrzędnej.
  - Ustaw `0`, aby wyłączyć tę ochronę i zawsze zezwalać na rozwidlanie z sesji nadrzędnej.
- **`mainKey`**: pole starszego typu. Środowisko wykonawcze zawsze używa `"main"` dla głównego zasobnika czatu bezpośredniego.
- **`agentToAgent.maxPingPongTurns`**: maksymalna liczba tur odpowiedzi zwrotnej między agentami podczas wymian agent-agent (liczba całkowita, zakres: `0`–`5`). `0` wyłącza łańcuch ping-pong.
- **`sendPolicy`**: dopasuj według `channel`, `chatType` (`direct|group|channel`, ze starszym aliasem `dm`), `keyPrefix` albo `rawKeyPrefix`. Pierwsza odmowa wygrywa.
- **`maintenance`**: kontrolki czyszczenia magazynu sesji i retencji.
  - `mode`: `warn` emituje tylko ostrzeżenia; `enforce` stosuje czyszczenie.
  - `pruneAfter`: próg wieku dla nieaktualnych wpisów (domyślnie `30d`).
  - `maxEntries`: maksymalna liczba wpisów w `sessions.json` (domyślnie `500`). Środowisko wykonawcze zapisuje czyszczenie wsadowe z małym buforem wysokiego poziomu dla limitów rozmiaru produkcyjnego; `openclaw sessions cleanup --enforce` stosuje limit natychmiast.
  - `rotateBytes`: przestarzałe i ignorowane; `openclaw doctor --fix` usuwa je ze starszych konfiguracji.
  - `resetArchiveRetention`: retencja archiwów transkrypcji `*.reset.<timestamp>`. Domyślnie `pruneAfter`; ustaw `false`, aby wyłączyć.
  - `maxDiskBytes`: opcjonalny budżet dyskowy katalogu sesji. W trybie `warn` rejestruje ostrzeżenia; w trybie `enforce` najpierw usuwa najstarsze artefakty/sesje.
  - `highWaterBytes`: opcjonalny cel po czyszczeniu budżetu. Domyślnie `80%` wartości `maxDiskBytes`.
- **`threadBindings`**: globalne wartości domyślne dla funkcji sesji powiązanych z wątkiem.
  - `enabled`: główny przełącznik domyślny (dostawcy mogą nadpisać; Discord używa `channels.discord.threadBindings.enabled`)
  - `idleHours`: domyślne automatyczne odfokusowanie po bezczynności w godzinach (`0` wyłącza; dostawcy mogą nadpisać)
  - `maxAgeHours`: domyślny sztywny maksymalny wiek w godzinach (`0` wyłącza; dostawcy mogą nadpisać)

</Accordion>

---

## Wiadomości

```json5
{
  messages: {
    responsePrefix: "🦞", // or "auto"
    ackReaction: "👀",
    ackReactionScope: "group-mentions", // group-mentions | group-all | direct | all
    removeAckAfterReply: false,
    queue: {
      mode: "steer", // steer | queue (legacy one-at-a-time) | followup | collect | steer-backlog | steer+backlog | interrupt
      debounceMs: 500,
      cap: 20,
      drop: "summarize", // old | new | summarize
      byChannel: {
        whatsapp: "steer",
        telegram: "steer",
      },
    },
    inbound: {
      debounceMs: 2000, // 0 disables
      byChannel: {
        whatsapp: 5000,
        slack: 1500,
      },
    },
  },
}
```

### Prefiks odpowiedzi

Nadpisania dla kanału/konta: `channels.<channel>.responsePrefix`, `channels.<channel>.accounts.<id>.responsePrefix`.

Rozstrzyganie (wygrywa najbardziej szczegółowe): konto → kanał → globalne. `""` wyłącza i zatrzymuje kaskadę. `"auto"` wyprowadza `[{identity.name}]`.

**Zmienne szablonu:**

| Zmienna           | Opis                   | Przykład                    |
| ----------------- | ---------------------- | --------------------------- |
| `{model}`         | Krótka nazwa modelu    | `claude-opus-4-6`           |
| `{modelFull}`     | Pełny identyfikator modelu | `anthropic/claude-opus-4-6` |
| `{provider}`      | Nazwa dostawcy         | `anthropic`                 |
| `{thinkingLevel}` | Bieżący poziom myślenia | `high`, `low`, `off`        |
| `{identity.name}` | Nazwa tożsamości agenta | (taka sama jak `"auto"`)    |

Zmienne nie rozróżniają wielkości liter. `{think}` jest aliasem dla `{thinkingLevel}`.

### Reakcja potwierdzenia

- Domyślnie używa `identity.emoji` aktywnego agenta, w przeciwnym razie `"👀"`. Ustaw `""`, aby wyłączyć.
- Nadpisania dla kanału: `channels.<channel>.ackReaction`, `channels.<channel>.accounts.<id>.ackReaction`.
- Kolejność rozstrzygania: konto → kanał → `messages.ackReaction` → fallback tożsamości.
- Zakres: `group-mentions` (domyślnie), `group-all`, `direct`, `all`.
- `removeAckAfterReply`: usuwa potwierdzenie po odpowiedzi w kanałach obsługujących reakcje, takich jak Slack, Discord, Telegram, WhatsApp i BlueBubbles.
- `messages.statusReactions.enabled`: włącza reakcje statusu cyklu życia w Slack, Discord i Telegram.
  W Slack i Discord brak ustawienia pozostawia reakcje statusu włączone, gdy reakcje potwierdzenia są aktywne.
  W Telegram ustaw to jawnie na `true`, aby włączyć reakcje statusu cyklu życia.

### Debounce wiadomości przychodzących

Grupuje szybkie wiadomości tekstowe od tego samego nadawcy w jedną turę agenta. Multimedia/załączniki są wysyłane natychmiast. Polecenia sterujące omijają debounce.

### TTS (zamiana tekstu na mowę)

```json5
{
  messages: {
    tts: {
      auto: "always", // off | always | inbound | tagged
      mode: "final", // final | all
      provider: "elevenlabs",
      summaryModel: "openai/gpt-4.1-mini",
      modelOverrides: { enabled: true },
      maxTextLength: 4000,
      timeoutMs: 30000,
      prefsPath: "~/.openclaw/settings/tts.json",
      providers: {
        elevenlabs: {
          apiKey: "elevenlabs_api_key",
          baseUrl: "https://api.elevenlabs.io",
          voiceId: "voice_id",
          modelId: "eleven_multilingual_v2",
          seed: 42,
          applyTextNormalization: "auto",
          languageCode: "en",
          voiceSettings: {
            stability: 0.5,
            similarityBoost: 0.75,
            style: 0.0,
            useSpeakerBoost: true,
            speed: 1.0,
          },
        },
        microsoft: {
          voice: "en-US-AvaMultilingualNeural",
          lang: "en-US",
          outputFormat: "audio-24khz-48kbitrate-mono-mp3",
        },
        openai: {
          apiKey: "openai_api_key",
          baseUrl: "https://api.openai.com/v1",
          model: "gpt-4o-mini-tts",
          voice: "alloy",
        },
      },
    },
  },
}
```

- `auto` kontroluje domyślny tryb automatycznego TTS: `off`, `always`, `inbound` lub `tagged`. `/tts on|off` może nadpisać lokalne preferencje, a `/tts status` pokazuje efektywny stan.
- `summaryModel` nadpisuje `agents.defaults.model.primary` dla automatycznego podsumowania.
- `modelOverrides` jest domyślnie włączone; `modelOverrides.allowProvider` domyślnie ma wartość `false` (włączane jawnie).
- Klucze API używają fallbacku do `ELEVENLABS_API_KEY`/`XI_API_KEY` i `OPENAI_API_KEY`.
- Dołączone dostawcy mowy są własnością Plugin. Jeśli ustawiono `plugins.allow`, uwzględnij każdy Plugin dostawcy TTS, którego chcesz użyć, na przykład `microsoft` dla Edge TTS. Starszy identyfikator dostawcy `edge` jest akceptowany jako alias dla `microsoft`.
- `providers.openai.baseUrl` nadpisuje punkt końcowy OpenAI TTS. Kolejność rozstrzygania to konfiguracja, następnie `OPENAI_TTS_BASE_URL`, następnie `https://api.openai.com/v1`.
- Gdy `providers.openai.baseUrl` wskazuje punkt końcowy inny niż OpenAI, OpenClaw traktuje go jako serwer TTS zgodny z OpenAI i rozluźnia walidację modelu/głosu.

---

## Rozmowa

Wartości domyślne trybu rozmowy (macOS/iOS/Android).

```json5
{
  talk: {
    provider: "elevenlabs",
    providers: {
      elevenlabs: {
        voiceId: "elevenlabs_voice_id",
        voiceAliases: {
          Clawd: "EXAVITQu4vr4xnSDxMaL",
          Roger: "CwhRBWXzGAHq8TQ4Fs17",
        },
        modelId: "eleven_v3",
        outputFormat: "mp3_44100_128",
        apiKey: "elevenlabs_api_key",
      },
      mlx: {
        modelId: "mlx-community/Soprano-80M-bf16",
      },
      system: {},
    },
    speechLocale: "ru-RU",
    silenceTimeoutMs: 1500,
    interruptOnSpeech: true,
  },
}
```

- `talk.provider` musi odpowiadać kluczowi w `talk.providers`, gdy skonfigurowano wielu dostawców trybu rozmowy.
- Starsze płaskie klucze trybu rozmowy (`talk.voiceId`, `talk.voiceAliases`, `talk.modelId`, `talk.outputFormat`, `talk.apiKey`) służą tylko do zgodności i są automatycznie migrowane do `talk.providers.<provider>`.
- Identyfikatory głosów używają fallbacku do `ELEVENLABS_VOICE_ID` lub `SAG_VOICE_ID`.
- `providers.*.apiKey` akceptuje ciągi tekstowe jawne lub obiekty SecretRef.
- Fallback `ELEVENLABS_API_KEY` ma zastosowanie tylko wtedy, gdy nie skonfigurowano klucza API trybu rozmowy.
- `providers.*.voiceAliases` pozwala dyrektywom trybu rozmowy używać przyjaznych nazw.
- `providers.mlx.modelId` wybiera repozytorium Hugging Face używane przez lokalnego pomocnika MLX dla macOS. Jeśli pominięto, macOS używa `mlx-community/Soprano-80M-bf16`.
- Odtwarzanie MLX w macOS działa przez dołączonego pomocnika `openclaw-mlx-tts`, gdy jest dostępny, albo przez plik wykonywalny w `PATH`; `OPENCLAW_MLX_TTS_BIN` nadpisuje ścieżkę pomocnika na potrzeby programowania.
- `speechLocale` ustawia identyfikator lokalizacji BCP 47 używany przez rozpoznawanie mowy trybu rozmowy w iOS/macOS. Pozostaw bez ustawienia, aby użyć domyślnej wartości urządzenia.
- `silenceTimeoutMs` kontroluje, jak długo tryb rozmowy czeka po ciszy użytkownika, zanim wyśle transkrypcję. Brak ustawienia zachowuje domyślne okno pauzy platformy (`700 ms on macOS and Android, 900 ms on iOS`).

---

## Powiązane

- [Dokumentacja konfiguracji](/pl/gateway/configuration-reference) — wszystkie pozostałe klucze konfiguracji
- [Konfiguracja](/pl/gateway/configuration) — typowe zadania i szybka konfiguracja
- [Przykłady konfiguracji](/pl/gateway/configuration-examples)
