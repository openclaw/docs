---
read_when:
    - Dostrajanie domyślnych ustawień agenta (modele, myślenie, przestrzeń robocza, Heartbeat, media, Skills)
    - Konfigurowanie routingu i powiązań wieloagentowych
    - Dostosowywanie zachowania sesji, dostarczania wiadomości i trybu rozmowy
summary: Domyślne ustawienia agenta, routing wieloagentowy, sesja, wiadomości i konfiguracja talk
title: Konfiguracja — agenci
x-i18n:
    generated_at: "2026-05-04T02:24:54Z"
    model: gpt-5.5
    provider: openai
    source_hash: 9d339b82b8b3b82e55820ca6568b3ed569fe64135e698515fa7f316c3afbbfd9
    source_path: gateway/config-agents.md
    workflow: 16
---

Klucze konfiguracji o zakresie agenta w `agents.*`, `multiAgent.*`, `session.*`,
`messages.*` i `talk.*`. Kanały, narzędzia, środowisko uruchomieniowe Gateway i inne
klucze najwyższego poziomu opisano w [Dokumentacji konfiguracji](/pl/gateway/configuration-reference).

## Domyślne ustawienia agenta

### `agents.defaults.workspace`

Domyślnie: `~/.openclaw/workspace`.

```json5
{
  agents: { defaults: { workspace: "~/.openclaw/workspace" } },
}
```

### `agents.defaults.repoRoot`

Opcjonalny katalog główny repozytorium wyświetlany w wierszu Runtime w prompcie systemowym. Jeśli nie jest ustawiony, OpenClaw wykrywa go automatycznie, przechodząc w górę od obszaru roboczego.

```json5
{
  agents: { defaults: { repoRoot: "~/Projects/openclaw" } },
}
```

### `agents.defaults.skills`

Opcjonalna domyślna lista dozwolonych Skills dla agentów, które nie ustawiają
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

- Pomiń `agents.defaults.skills`, aby domyślnie nie ograniczać Skills.
- Pomiń `agents.list[].skills`, aby odziedziczyć wartości domyślne.
- Ustaw `agents.list[].skills: []`, aby nie używać żadnych Skills.
- Niepusta lista `agents.list[].skills` jest ostatecznym zestawem dla tego agenta; nie jest
  scalana z wartościami domyślnymi.

### `agents.defaults.skipBootstrap`

Wyłącza automatyczne tworzenie plików inicjalizacji obszaru roboczego (`AGENTS.md`, `SOUL.md`, `TOOLS.md`, `IDENTITY.md`, `USER.md`, `HEARTBEAT.md`, `BOOTSTRAP.md`).

```json5
{
  agents: { defaults: { skipBootstrap: true } },
}
```

### `agents.defaults.skipOptionalBootstrapFiles`

Pomija tworzenie wybranych opcjonalnych plików obszaru roboczego, nadal zapisując wymagane pliki inicjalizacji. Prawidłowe wartości: `SOUL.md`, `USER.md`, `HEARTBEAT.md` i `IDENTITY.md`.

```json5
{
  agents: {
    defaults: {
      skipOptionalBootstrapFiles: ["SOUL.md", "USER.md"],
    },
  },
}
```

### `agents.defaults.contextInjection`

Kontroluje, kiedy pliki inicjalizacji obszaru roboczego są wstrzykiwane do promptu systemowego. Domyślnie: `"always"`.

- `"continuation-skip"`: bezpieczne tury kontynuacji (po ukończonej odpowiedzi asystenta) pomijają ponowne wstrzyknięcie inicjalizacji obszaru roboczego, zmniejszając rozmiar promptu. Uruchomienia Heartbeat i ponowne próby po Compaction nadal odbudowują kontekst.
- `"never"`: wyłącza inicjalizację obszaru roboczego i wstrzykiwanie plików kontekstu w każdej turze. Używaj tego tylko dla agentów, które w pełni zarządzają cyklem życia swojego promptu (niestandardowe silniki kontekstu, natywne środowiska uruchomieniowe budujące własny kontekst albo wyspecjalizowane przepływy pracy bez inicjalizacji). Tury Heartbeat i odzyskiwania po Compaction również pomijają wstrzykiwanie.

```json5
{
  agents: { defaults: { contextInjection: "continuation-skip" } },
}
```

### `agents.defaults.bootstrapMaxChars`

Maksymalna liczba znaków na plik inicjalizacji obszaru roboczego przed skróceniem. Domyślnie: `12000`.

```json5
{
  agents: { defaults: { bootstrapMaxChars: 12000 } },
}
```

### `agents.defaults.bootstrapTotalMaxChars`

Maksymalna łączna liczba znaków wstrzykiwana ze wszystkich plików inicjalizacji obszaru roboczego. Domyślnie: `60000`.

```json5
{
  agents: { defaults: { bootstrapTotalMaxChars: 60000 } },
}
```

### `agents.defaults.bootstrapPromptTruncationWarning`

Kontroluje widoczne dla agenta powiadomienie w prompcie systemowym, gdy kontekst inicjalizacji zostanie skrócony.
Domyślnie: `"once"`.

- `"off"`: nigdy nie wstrzykuj tekstu powiadomienia o skróceniu do promptu systemowego.
- `"once"`: wstrzyknij zwięzłe powiadomienie raz dla każdej unikatowej sygnatury skrócenia (zalecane).
- `"always"`: wstrzykuj zwięzłe powiadomienie przy każdym uruchomieniu, gdy istnieje skrócenie.

Szczegółowe surowe/wstrzyknięte liczby oraz pola dostrajania konfiguracji pozostają w diagnostyce,
takiej jak raporty kontekstu/statusu i dzienniki; rutynowy kontekst użytkownika/środowiska uruchomieniowego WebChat
otrzymuje tylko zwięzłe powiadomienie odzyskiwania.

```json5
{
  agents: { defaults: { bootstrapPromptTruncationWarning: "once" } }, // off | once | always
}
```

### Mapa własności budżetów kontekstu

OpenClaw ma wiele wysokonakładowych budżetów promptu/kontekstu i są one
celowo podzielone według podsystemów, zamiast przechodzić przez jedno ogólne
pokrętło.

- `agents.defaults.bootstrapMaxChars` /
  `agents.defaults.bootstrapTotalMaxChars`:
  standardowe wstrzykiwanie inicjalizacji obszaru roboczego.
- `agents.defaults.startupContext.*`:
  jednorazowy wstęp uruchomienia modelu przy resetowaniu/uruchamianiu, w tym ostatnie dzienne
  pliki `memory/*.md`. Same polecenia czatu `/new` i `/reset`
  są potwierdzane bez wywoływania modelu.
- `skills.limits.*`:
  kompaktowa lista Skills wstrzykiwana do promptu systemowego.
- `agents.defaults.contextLimits.*`:
  ograniczone fragmenty środowiska uruchomieniowego i wstrzyknięte bloki należące do środowiska uruchomieniowego.
- `memory.qmd.limits.*`:
  rozmiary fragmentów indeksowanego wyszukiwania pamięci i wstrzykiwania.

Użyj odpowiedniego nadpisania dla agenta tylko wtedy, gdy jeden agent potrzebuje innego
budżetu:

- `agents.list[].skillsLimits.maxSkillsPromptChars`
- `agents.list[].contextLimits.*`

#### `agents.defaults.startupContext`

Kontroluje wstęp pierwszej tury uruchomienia wstrzykiwany podczas uruchomień modelu przy resetowaniu/uruchamianiu.
Same polecenia czatu `/new` i `/reset` potwierdzają reset bez wywoływania
modelu, więc nie ładują tego wstępu.

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

Wspólne wartości domyślne dla ograniczonych powierzchni kontekstu środowiska uruchomieniowego.

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

- `memoryGetMaxChars`: domyślny limit fragmentu `memory_get` przed dodaniem
  metadanych skrócenia i powiadomienia o kontynuacji.
- `memoryGetDefaultLines`: domyślne okno wierszy `memory_get`, gdy `lines` jest
  pominięte.
- `toolResultMaxChars`: limit wyniku narzędzia na żywo używany dla utrwalonych wyników i
  odzyskiwania po przepełnieniu.
- `postCompactionMaxChars`: limit fragmentu AGENTS.md używany podczas wstrzykiwania
  odświeżenia po Compaction.

#### `agents.list[].contextLimits`

Nadpisanie dla agenta dla wspólnych pokręteł `contextLimits`. Pominięte pola dziedziczą
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

Globalny limit kompaktowej listy Skills wstrzykiwanej do promptu systemowego. Nie
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

Nadpisanie dla agenta dla budżetu promptu Skills.

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

Maksymalny rozmiar w pikselach najdłuższego boku obrazu w blokach obrazu transkrypcji/narzędzi przed wywołaniami dostawcy.
Domyślnie: `1200`.

Niższe wartości zwykle zmniejszają zużycie tokenów wizji i rozmiar ładunku żądania przy uruchomieniach intensywnie korzystających ze zrzutów ekranu.
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
      },
      pdfMaxBytesMb: 10,
      pdfMaxPages: 20,
      thinkingDefault: "low",
      verboseDefault: "off",
      toolProgressDetail: "explain",
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
  - Forma obiektu ustawia model podstawowy oraz uporządkowane modele awaryjne.
- `imageModel`: akceptuje ciąg znaków (`"provider/model"`) albo obiekt (`{ primary, fallbacks }`).
  - Używany przez ścieżkę narzędzia `image` jako konfiguracja modelu wizyjnego.
  - Używany także jako routing awaryjny, gdy wybrany/domyślny model nie może przyjmować danych wejściowych obrazu.
  - Preferuj jawne odwołania `provider/model`. Surowe identyfikatory są akceptowane dla zgodności; jeśli surowy identyfikator jednoznacznie pasuje do skonfigurowanego wpisu obsługującego obrazy w `models.providers.*.models`, OpenClaw kwalifikuje go do tego dostawcy. Niejednoznaczne skonfigurowane dopasowania wymagają jawnego prefiksu dostawcy.
- `imageGenerationModel`: akceptuje ciąg znaków (`"provider/model"`) albo obiekt (`{ primary, fallbacks }`).
  - Używany przez współdzieloną funkcję generowania obrazów oraz każdą przyszłą powierzchnię narzędzia/Pluginu, która generuje obrazy.
  - Typowe wartości: `google/gemini-3.1-flash-image-preview` dla natywnego generowania obrazów Gemini, `fal/fal-ai/flux/dev` dla fal, `openai/gpt-image-2` dla OpenAI Images albo `openai/gpt-image-1.5` dla wyjścia OpenAI PNG/WebP z przezroczystym tłem.
  - Jeśli wybierzesz dostawcę/model bezpośrednio, skonfiguruj też pasujące uwierzytelnianie dostawcy (na przykład `GEMINI_API_KEY` albo `GOOGLE_API_KEY` dla `google/*`, `OPENAI_API_KEY` albo OpenAI Codex OAuth dla `openai/gpt-image-2` / `openai/gpt-image-1.5`, `FAL_KEY` dla `fal/*`).
  - Jeśli pominięto, `image_generate` nadal może wywnioskować domyślnego dostawcę opartego na uwierzytelnianiu. Najpierw próbuje bieżącego domyślnego dostawcy, a potem pozostałych zarejestrowanych dostawców generowania obrazów w kolejności identyfikatorów dostawców.
- `musicGenerationModel`: akceptuje ciąg znaków (`"provider/model"`) albo obiekt (`{ primary, fallbacks }`).
  - Używany przez współdzieloną funkcję generowania muzyki oraz wbudowane narzędzie `music_generate`.
  - Typowe wartości: `google/lyria-3-clip-preview`, `google/lyria-3-pro-preview` albo `minimax/music-2.6`.
  - Jeśli pominięto, `music_generate` nadal może wywnioskować domyślnego dostawcę opartego na uwierzytelnianiu. Najpierw próbuje bieżącego domyślnego dostawcy, a potem pozostałych zarejestrowanych dostawców generowania muzyki w kolejności identyfikatorów dostawców.
  - Jeśli wybierzesz dostawcę/model bezpośrednio, skonfiguruj też pasujące uwierzytelnianie/klucz API dostawcy.
- `videoGenerationModel`: akceptuje ciąg znaków (`"provider/model"`) albo obiekt (`{ primary, fallbacks }`).
  - Używany przez współdzieloną funkcję generowania wideo oraz wbudowane narzędzie `video_generate`.
  - Typowe wartości: `qwen/wan2.6-t2v`, `qwen/wan2.6-i2v`, `qwen/wan2.6-r2v`, `qwen/wan2.6-r2v-flash` albo `qwen/wan2.7-r2v`.
  - Jeśli pominięto, `video_generate` nadal może wywnioskować domyślnego dostawcę opartego na uwierzytelnianiu. Najpierw próbuje bieżącego domyślnego dostawcy, a potem pozostałych zarejestrowanych dostawców generowania wideo w kolejności identyfikatorów dostawców.
  - Jeśli wybierzesz dostawcę/model bezpośrednio, skonfiguruj też pasujące uwierzytelnianie/klucz API dostawcy.
  - Dołączony dostawca generowania wideo Qwen obsługuje maksymalnie 1 wyjściowe wideo, 1 obraz wejściowy, 4 wejściowe wideo, czas trwania 10 sekund oraz opcje na poziomie dostawcy `size`, `aspectRatio`, `resolution`, `audio` i `watermark`.
- `pdfModel`: akceptuje ciąg znaków (`"provider/model"`) albo obiekt (`{ primary, fallbacks }`).
  - Używany przez narzędzie `pdf` do routingu modeli.
  - Jeśli pominięto, narzędzie PDF wraca awaryjnie do `imageModel`, a potem do rozwiązanego modelu sesji/domyślnego.
- `pdfMaxBytesMb`: domyślny limit rozmiaru PDF dla narzędzia `pdf`, gdy `maxBytesMb` nie zostanie przekazane w momencie wywołania.
- `pdfMaxPages`: domyślna maksymalna liczba stron uwzględniana przez tryb awaryjny ekstrakcji w narzędziu `pdf`.
- `verboseDefault`: domyślny poziom szczegółowości dla agentów. Wartości: `"off"`, `"on"`, `"full"`. Domyślnie: `"off"`.
- `toolProgressDetail`: tryb szczegółów dla podsumowań narzędzi `/verbose` i linii narzędzi wersji roboczej postępu. Wartości: `"explain"` (domyślnie, zwięzłe etykiety dla ludzi) albo `"raw"` (dołącza surowe polecenie/szczegół, gdy jest dostępne). `agents.list[].toolProgressDetail` na poziomie agenta zastępuje tę wartość domyślną.
- `reasoningDefault`: domyślna widoczność rozumowania dla agentów. Wartości: `"off"`, `"on"`, `"stream"`. `agents.list[].reasoningDefault` na poziomie agenta zastępuje tę wartość domyślną. Skonfigurowane domyślne wartości rozumowania są stosowane tylko dla właścicieli, autoryzowanych nadawców albo kontekstów Gateway administratora operatora, gdy nie ustawiono zastąpienia rozumowania dla wiadomości ani sesji.
- `elevatedDefault`: domyślny poziom podniesionego wyjścia dla agentów. Wartości: `"off"`, `"on"`, `"ask"`, `"full"`. Domyślnie: `"on"`.
- `model.primary`: format `provider/model` (np. `openai/gpt-5.5` dla dostępu kluczem API albo `openai-codex/gpt-5.5` dla Codex OAuth). Jeśli pominiesz dostawcę, OpenClaw najpierw próbuje aliasu, potem jednoznacznego dopasowania skonfigurowanego dostawcy dla tego dokładnego identyfikatora modelu, a dopiero potem wraca awaryjnie do skonfigurowanego domyślnego dostawcy (przestarzałe zachowanie zgodności, więc preferuj jawne `provider/model`). Jeśli ten dostawca nie udostępnia już skonfigurowanego domyślnego modelu, OpenClaw wraca awaryjnie do pierwszego skonfigurowanego dostawcy/modelu zamiast ujawniać nieaktualną wartość domyślną usuniętego dostawcy.
- `models`: skonfigurowany katalog modeli i lista dozwolonych dla `/model`. Każdy wpis może zawierać `alias` (skrót) i `params` (specyficzne dla dostawcy, na przykład `temperature`, `maxTokens`, `cacheRetention`, `context1m`, `responsesServerCompaction`, `responsesCompactThreshold`, `chat_template_kwargs`, `extra_body`/`extraBody`).
  - Bezpieczne edycje: użyj `openclaw config set agents.defaults.models '<json>' --strict-json --merge`, aby dodać wpisy. `config set` odrzuca zastąpienia, które usunęłyby istniejące wpisy listy dozwolonych, chyba że przekażesz `--replace`.
  - Przepływy konfiguracji/wprowadzania ograniczone do dostawcy scalają wybrane modele dostawcy z tą mapą i zachowują niepowiązanych dostawców już skonfigurowanych.
  - Dla bezpośrednich modeli OpenAI Responses kompakcja po stronie serwera jest włączana automatycznie. Użyj `params.responsesServerCompaction: false`, aby przestać wstrzykiwać `context_management`, albo `params.responsesCompactThreshold`, aby zastąpić próg. Zobacz [kompakcja po stronie serwera OpenAI](/pl/providers/openai#server-side-compaction-responses-api).
- `params`: globalne domyślne parametry dostawcy stosowane do wszystkich modeli. Ustawiane w `agents.defaults.params` (np. `{ cacheRetention: "long" }`).
- Kolejność pierwszeństwa scalania `params` (konfiguracja): `agents.defaults.params` (globalna baza) jest zastępowane przez `agents.defaults.models["provider/model"].params` (dla modelu), a następnie `agents.list[].params` (pasujący identyfikator agenta) zastępuje według klucza. Szczegóły znajdziesz w [buforowaniu promptów](/pl/reference/prompt-caching).
- `params.extra_body`/`params.extraBody`: zaawansowany przekazywany dalej JSON scalany z treściami żądań `api: "openai-completions"` dla proxy zgodnych z OpenAI. Jeśli koliduje z wygenerowanymi kluczami żądania, dodatkowa treść wygrywa; nienatywne trasy completions nadal potem usuwają właściwość `store` specyficzną dla OpenAI.
- `params.chat_template_kwargs`: argumenty szablonu czatu zgodne z vLLM/OpenAI scalane z najwyższym poziomem treści żądań `api: "openai-completions"`. Dla `vllm/nemotron-3-*` z wyłączonym myśleniem dołączony Plugin vLLM automatycznie wysyła `enable_thinking: false` i `force_nonempty_content: true`; jawne `chat_template_kwargs` zastępują wygenerowane wartości domyślne, a `extra_body.chat_template_kwargs` nadal ma ostateczne pierwszeństwo. Dla kontrolek myślenia vLLM Qwen ustaw `params.qwenThinkingFormat` na `"chat-template"` albo `"top-level"` w tym wpisie modelu.
- `compat.supportedReasoningEfforts`: lista poziomów wysiłku rozumowania zgodna z OpenAI dla modelu. Uwzględnij `"xhigh"` dla niestandardowych punktów końcowych, które naprawdę ją akceptują; OpenClaw wtedy udostępnia `/think xhigh` w menu poleceń, wierszach sesji Gateway, walidacji łatek sesji, walidacji CLI agenta oraz walidacji `llm-task` dla tego skonfigurowanego dostawcy/modelu. Użyj `compat.reasoningEffortMap`, gdy backend wymaga wartości specyficznej dla dostawcy dla poziomu kanonicznego.
- `params.preserveThinking`: opcja włączana tylko dla Z.AI dla zachowanego myślenia. Gdy jest włączona i myślenie jest włączone, OpenClaw wysyła `thinking.clear_thinking: false` i odtwarza wcześniejsze `reasoning_content`; zobacz [myślenie Z.AI i zachowane myślenie](/pl/providers/zai#thinking-and-preserved-thinking).
- `agentRuntime`: domyślna niskopoziomowa polityka środowiska wykonawczego agenta. Pominięty identyfikator domyślnie oznacza OpenClaw Pi. Użyj `id: "pi"`, aby wymusić wbudowany harness PI, `id: "auto"`, aby pozwolić zarejestrowanym harnessom Pluginów przejmować obsługiwane modele i używać PI, gdy żaden nie pasuje, zarejestrowanego identyfikatora harnessu, takiego jak `id: "codex"`, aby wymagać tego harnessu, albo obsługiwanego aliasu backendu CLI, takiego jak `id: "claude-cli"`. Jawne środowiska wykonawcze Pluginów zawodzą w sposób zamknięty, gdy harness jest niedostępny albo zawodzi. Zachowaj kanoniczne odwołania do modeli jako `provider/model`; wybieraj Codex, Claude CLI, Gemini CLI i inne backendy wykonawcze przez konfigurację środowiska wykonawczego zamiast starszych prefiksów dostawcy środowiska wykonawczego. Zobacz [środowiska wykonawcze agentów](/pl/concepts/agent-runtimes), aby dowiedzieć się, czym różni się to od wyboru dostawcy/modelu.
- Mechanizmy zapisujące konfigurację, które mutują te pola (na przykład `/models set`, `/models set-image` oraz polecenia dodawania/usuwania awaryjnych modeli), zapisują kanoniczną formę obiektu i zachowują istniejące listy awaryjne, gdy to możliwe.
- `maxConcurrent`: maksymalna liczba równoległych uruchomień agentów w sesjach (każda sesja nadal jest serializowana). Domyślnie: 4.

### `agents.defaults.agentRuntime`

`agentRuntime` kontroluje, który niskopoziomowy wykonawca uruchamia tury agenta. Większość
wdrożeń powinna zachować domyślne środowisko wykonawcze OpenClaw Pi. Użyj go, gdy zaufany
Plugin udostępnia natywny harness, taki jak dołączony harness serwera aplikacji Codex,
albo gdy chcesz użyć obsługiwanego backendu CLI, takiego jak Claude CLI. Model
mentalny opisano w [środowiskach wykonawczych agentów](/pl/concepts/agent-runtimes).

```json5
{
  agents: {
    defaults: {
      model: "openai/gpt-5.5",
      agentRuntime: {
        id: "codex",
      },
    },
  },
}
```

- `id`: `"auto"`, `"pi"`, zarejestrowany identyfikator harnessu Pluginu albo obsługiwany alias backendu CLI. Dołączony Plugin Codex rejestruje `codex`; dołączony Plugin Anthropic udostępnia backend CLI `claude-cli`.
- `id: "auto"` pozwala zarejestrowanym harnessom Pluginów przejmować obsługiwane tury i używa PI, gdy żaden harness nie pasuje. Jawne środowisko wykonawcze Pluginu, takie jak `id: "codex"`, wymaga tego harnessu i zawodzi w sposób zamknięty, jeśli jest niedostępny albo zawodzi.
- Zastąpienie środowiskowe: `OPENCLAW_AGENT_RUNTIME=<id|auto|pi>` zastępuje `id` dla tego procesu.
- Dla wdrożeń wyłącznie z Codex ustaw `model: "openai/gpt-5.5"` i `agentRuntime.id: "codex"`.
- Dla wdrożeń Claude CLI preferuj `model: "anthropic/claude-opus-4-7"` plus `agentRuntime.id: "claude-cli"`. Starsze odwołania modeli `claude-cli/claude-opus-4-7` nadal działają dla zgodności, ale nowa konfiguracja powinna zachować kanoniczny wybór dostawcy/modelu i umieścić backend wykonawczy w `agentRuntime.id`.
- Starsze klucze polityki środowiska wykonawczego są przepisywane na `agentRuntime` przez `openclaw doctor --fix`.
- Wybór harnessu jest przypinany dla identyfikatora sesji po pierwszym osadzonym uruchomieniu. Zmiany konfiguracji/środowiska wpływają na nowe albo zresetowane sesje, nie na istniejący transkrypt. Starsze sesje z historią transkryptu, ale bez zapisanego przypięcia, są traktowane jako przypięte do PI. `/status` zgłasza efektywne środowisko wykonawcze, na przykład `Runtime: OpenClaw Pi Default` albo `Runtime: OpenAI Codex`.
- To kontroluje tylko wykonywanie tekstowych tur agenta. Generowanie mediów, wizja, PDF, muzyka, wideo i TTS nadal używają swoich ustawień dostawcy/modelu.

**Wbudowane skróty aliasów** (mają zastosowanie tylko wtedy, gdy model jest w `agents.defaults.models`):

| Alias               | Model                                      |
| ------------------- | ------------------------------------------ |
| `opus`              | `anthropic/claude-opus-4-6`                |
| `sonnet`            | `anthropic/claude-sonnet-4-6`              |
| `gpt`               | `openai/gpt-5.5` or `openai-codex/gpt-5.5` |
| `gpt-mini`          | `openai/gpt-5.4-mini`                      |
| `gpt-nano`          | `openai/gpt-5.4-nano`                      |
| `gemini`            | `google/gemini-3.1-pro-preview`            |
| `gemini-flash`      | `google/gemini-3-flash-preview`            |
| `gemini-flash-lite` | `google/gemini-3.1-flash-lite-preview`     |

Skonfigurowane przez Ciebie aliasy zawsze mają pierwszeństwo.

Modele Z.AI GLM-4.x automatycznie włączają tryb myślenia, chyba że ustawisz `--thinking off` albo samodzielnie zdefiniujesz `agents.defaults.models["zai/<model>"].params.thinking`.
Modele Z.AI domyślnie włączają `tool_stream` dla strumieniowania wywołań narzędzi. Ustaw `agents.defaults.models["zai/<model>"].params.tool_stream` na `false`, aby go wyłączyć.
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

- Backendy CLI są tekstowe w pierwszej kolejności; narzędzia są zawsze wyłączone.
- Sesje są obsługiwane, gdy ustawiono `sessionArg`.
- Przekazywanie obrazów jest obsługiwane, gdy `imageArg` akceptuje ścieżki plików.

### `agents.defaults.systemPromptOverride`

Zastępuje cały prompt systemowy złożony przez OpenClaw stałym ciągiem. Ustaw na poziomie domyślnym (`agents.defaults.systemPromptOverride`) albo dla poszczególnego agenta (`agents.list[].systemPromptOverride`). Wartości dla agenta mają pierwszeństwo; wartość pusta albo zawierająca tylko białe znaki jest ignorowana. Przydatne do kontrolowanych eksperymentów z promptami.

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

Niezależne od dostawcy nakładki promptów stosowane według rodziny modeli. Identyfikatory modeli z rodziny GPT-5 otrzymują współdzielony kontrakt zachowania między dostawcami; `personality` kontroluje tylko warstwę przyjaznego stylu interakcji.

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

- `"friendly"` (domyślnie) i `"on"` włączają warstwę przyjaznego stylu interakcji.
- `"off"` wyłącza tylko warstwę przyjazną; oznaczony kontrakt zachowania GPT-5 pozostaje włączony.
- Starsze `plugins.entries.openai.config.personality` nadal jest odczytywane, gdy to współdzielone ustawienie nie jest ustawione.

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
- `includeSystemPromptSection`: gdy ma wartość false, pomija sekcję Heartbeat w promptcie systemowym i pomija wstrzyknięcie `HEARTBEAT.md` do kontekstu startowego. Domyślnie: `true`.
- `suppressToolErrorWarnings`: gdy ma wartość true, tłumi ładunki ostrzeżeń o błędach narzędzi podczas uruchomień Heartbeat.
- `timeoutSeconds`: maksymalny czas w sekundach dozwolony dla tury agenta Heartbeat przed jej przerwaniem. Pozostaw nieustawione, aby użyć `agents.defaults.timeoutSeconds`.
- `directPolicy`: zasada dostarczania bezpośredniego/DM. `allow` (domyślnie) zezwala na dostarczanie do celu bezpośredniego. `block` tłumi dostarczanie do celu bezpośredniego i emituje `reason=dm-blocked`.
- `lightContext`: gdy ma wartość true, uruchomienia Heartbeat używają lekkiego kontekstu startowego i zachowują tylko `HEARTBEAT.md` z plików startowych obszaru roboczego.
- `isolatedSession`: gdy ma wartość true, każde Heartbeat działa w świeżej sesji bez wcześniejszej historii rozmowy. Ten sam wzorzec izolacji co cron `sessionTarget: "isolated"`. Zmniejsza koszt tokenów na jedno Heartbeat z ~100K do ~2-5K tokenów.
- `skipWhenBusy`: gdy ma wartość true, uruchomienia Heartbeat są odraczane także przy dodatkowych zajętych torach: pracy subagenta albo zagnieżdżonego polecenia. Tory Cron zawsze odraczają Heartbeat, nawet bez tej flagi.
- Dla agenta: ustaw `agents.list[].heartbeat`. Gdy dowolny agent definiuje `heartbeat`, **tylko ci agenci** uruchamiają Heartbeat.
- Heartbeat uruchamia pełne tury agenta — krótsze interwały zużywają więcej tokenów.

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
        midTurnPrecheck: { enabled: false }, // optional Pi tool-loop pressure check
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

- `mode`: `default` albo `safeguard` (fragmentaryczne podsumowywanie długich historii). Zobacz [Compaction](/pl/concepts/compaction).
- `provider`: identyfikator zarejestrowanego Pluginu dostawcy Compaction. Gdy jest ustawiony, wywoływane jest `summarize()` dostawcy zamiast wbudowanego podsumowywania LLM. W razie niepowodzenia następuje powrót do wbudowanego mechanizmu. Ustawienie dostawcy wymusza `mode: "safeguard"`. Zobacz [Compaction](/pl/concepts/compaction).
- `timeoutSeconds`: maksymalna liczba sekund dozwolona dla pojedynczej operacji Compaction, zanim OpenClaw ją przerwie. Domyślnie: `900`.
- `keepRecentTokens`: budżet punktu odcięcia Pi do zachowania najnowszego ogona transkryptu dosłownie. Ręczne `/compact` respektuje to ustawienie, gdy jest jawnie ustawione; w przeciwnym razie ręczne Compaction jest twardym punktem kontrolnym.
- `identifierPolicy`: `strict` (domyślnie), `off` albo `custom`. `strict` dokleja wbudowane wskazówki dotyczące zachowania nieprzezroczystych identyfikatorów podczas podsumowywania Compaction.
- `identifierInstructions`: opcjonalny niestandardowy tekst zachowywania identyfikatorów używany, gdy `identifierPolicy=custom`.
- `qualityGuard`: kontrole ponawiania przy nieprawidłowo sformatowanych wynikach dla podsumowań safeguard. Domyślnie włączone w trybie safeguard; ustaw `enabled: false`, aby pominąć audyt.
- `midTurnPrecheck`: opcjonalna kontrola presji pętli narzędzi Pi. Gdy `enabled: true`, OpenClaw sprawdza presję kontekstu po dołączeniu wyników narzędzi i przed następnym wywołaniem modelu. Jeśli kontekst już się nie mieści, przerywa bieżącą próbę przed przesłaniem promptu i ponownie używa istniejącej ścieżki odzyskiwania precheck, aby przyciąć wyniki narzędzi albo wykonać Compaction i ponowić próbę. Działa zarówno z trybem Compaction `default`, jak i `safeguard`. Domyślnie: wyłączone.
- `postCompactionSections`: opcjonalne nazwy sekcji H2/H3 z AGENTS.md do ponownego wstrzyknięcia po Compaction. Domyślnie `["Session Startup", "Red Lines"]`; ustaw `[]`, aby wyłączyć ponowne wstrzyknięcie. Gdy nie ustawiono albo jawnie ustawiono tę domyślną parę, starsze nagłówki `Every Session`/`Safety` są również akceptowane jako starsza alternatywa.
- `model`: opcjonalne nadpisanie `provider/model-id` tylko dla podsumowywania Compaction. Użyj tego, gdy główna sesja ma zachować jeden model, ale podsumowania Compaction mają działać na innym; gdy nie ustawiono, Compaction używa głównego modelu sesji.
- `maxActiveTranscriptBytes`: opcjonalny próg bajtów (`number` albo ciągi takie jak `"20mb"`), który wyzwala normalne lokalne Compaction przed uruchomieniem, gdy aktywny JSONL przekroczy próg. Wymaga `truncateAfterCompaction`, aby udane Compaction mogło obrócić transkrypt do mniejszego następcy. Wyłączone, gdy nie ustawiono albo ustawiono `0`.
- `notifyUser`: gdy ma wartość `true`, wysyła użytkownikowi krótkie powiadomienia, gdy Compaction się zaczyna i gdy się kończy (na przykład „Kompaktowanie kontekstu...” i „Compaction zakończone”). Domyślnie wyłączone, aby Compaction pozostało ciche.
- `memoryFlush`: cicha agentowa tura przed automatycznym Compaction w celu zapisania trwałych wspomnień. Ustaw `model` na dokładny model dostawcy, taki jak `ollama/qwen3:8b`, gdy ta tura porządkowa ma pozostać na modelu lokalnym; nadpisanie nie dziedziczy aktywnego łańcucha awaryjnego sesji. Pomijane, gdy obszar roboczy jest tylko do odczytu.

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
- `ttl` kontroluje, jak często przycinanie może uruchomić się ponownie (po ostatnim dotknięciu cache).
- Przycinanie najpierw miękko skraca zbyt duże wyniki narzędzi, a następnie w razie potrzeby twardo czyści starsze wyniki narzędzi.

**Miękkie skracanie** zachowuje początek + koniec i wstawia `...` pośrodku.

**Twarde czyszczenie** zastępuje cały wynik narzędzia symbolem zastępczym.

Uwagi:

- Bloki obrazów nigdy nie są skracane ani czyszczone.
- Współczynniki są oparte na znakach (przybliżone), a nie na dokładnych liczbach tokenów.
- Jeśli istnieje mniej niż `keepLastAssistants` wiadomości asystenta, przycinanie jest pomijane.

</Accordion>

Zobacz [Przycinanie sesji](/pl/concepts/session-pruning), aby poznać szczegóły zachowania.

### Strumieniowanie blokowe

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
- Nadpisania kanałów: `channels.<channel>.blockStreamingCoalesce` (oraz warianty dla kont). Signal/Slack/Discord/Google Chat domyślnie używają `minChars: 1500`.
- `humanDelay`: losowa pauza między odpowiedziami blokowymi. `natural` = 800–2500ms. Nadpisanie dla agenta: `agents.list[].humanDelay`.

Zobacz [Strumieniowanie](/pl/concepts/streaming), aby poznać szczegóły zachowania i fragmentacji.

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

- Domyślne: `instant` dla czatów bezpośrednich/wzmianek, `message` dla czatów grupowych bez wzmianki.
- Nadpisania dla sesji: `session.typingMode`, `session.typingIntervalSeconds`.

Zobacz [Wskaźniki pisania](/pl/concepts/typing-indicators).

<a id="agentsdefaultssandbox"></a>

### `agents.defaults.sandbox`

Opcjonalna izolacja w piaskownicy dla osadzonego agenta. Pełny przewodnik znajdziesz w sekcji [Izolacja w piaskownicy](/pl/gateway/sandboxing).

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

- `docker`: lokalne środowisko wykonawcze Docker (domyślne)
- `ssh`: ogólne zdalne środowisko wykonawcze oparte na SSH
- `openshell`: środowisko wykonawcze OpenShell

Gdy wybrano `backend: "openshell"`, ustawienia specyficzne dla środowiska wykonawczego przenoszą się do
`plugins.entries.openshell.config`.

**Konfiguracja backendu SSH:**

- `target`: cel SSH w formacie `user@host[:port]`
- `command`: polecenie klienta SSH (domyślnie: `ssh`)
- `workspaceRoot`: bezwzględny zdalny katalog główny używany dla przestrzeni roboczych według zakresu
- `identityFile` / `certificateFile` / `knownHostsFile`: istniejące pliki lokalne przekazywane do OpenSSH
- `identityData` / `certificateData` / `knownHostsData`: treść inline lub SecretRefs, które OpenClaw materializuje jako pliki tymczasowe w czasie wykonywania
- `strictHostKeyChecking` / `updateHostKeys`: ustawienia zasad kluczy hosta OpenSSH

**Kolejność pierwszeństwa uwierzytelniania SSH:**

- `identityData` ma pierwszeństwo przed `identityFile`
- `certificateData` ma pierwszeństwo przed `certificateFile`
- `knownHostsData` ma pierwszeństwo przed `knownHostsFile`
- Wartości `*Data` oparte na SecretRef są rozwiązywane z aktywnej migawki środowiska wykonawczego sekretów przed uruchomieniem sesji piaskownicy

**Zachowanie backendu SSH:**

- inicjuje zdalną przestrzeń roboczą raz po utworzeniu lub ponownym utworzeniu
- następnie utrzymuje zdalną przestrzeń roboczą SSH jako kanoniczną
- kieruje `exec`, narzędzia plikowe i ścieżki multimediów przez SSH
- nie synchronizuje automatycznie zdalnych zmian z powrotem na hosta
- nie obsługuje kontenerów przeglądarki w piaskownicy

**Dostęp do przestrzeni roboczej:**

- `none`: przestrzeń robocza piaskownicy według zakresu pod `~/.openclaw/sandboxes`
- `ro`: przestrzeń robocza piaskownicy w `/workspace`, przestrzeń robocza agenta zamontowana tylko do odczytu w `/agent`
- `rw`: przestrzeń robocza agenta zamontowana do odczytu/zapisu w `/workspace`

**Zakres:**

- `session`: kontener i przestrzeń robocza dla każdej sesji
- `agent`: jeden kontener i przestrzeń robocza na agenta (domyślnie)
- `shared`: współdzielony kontener i przestrzeń robocza (bez izolacji między sesjami)

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

- `mirror`: inicjuje zdalne środowisko z lokalnego przed exec, synchronizuje z powrotem po exec; lokalna przestrzeń robocza pozostaje kanoniczna
- `remote`: inicjuje zdalne środowisko raz podczas tworzenia piaskownicy, a następnie utrzymuje zdalną przestrzeń roboczą jako kanoniczną

W trybie `remote` lokalne edycje hosta wykonane poza OpenClaw nie są automatycznie synchronizowane z piaskownicą po kroku inicjowania.
Transport odbywa się przez SSH do piaskownicy OpenShell, ale Plugin odpowiada za cykl życia piaskownicy i opcjonalną synchronizację lustrzaną.

**`setupCommand`** uruchamia się raz po utworzeniu kontenera (przez `sh -lc`). Wymaga wychodzącego dostępu do sieci, zapisywalnego katalogu głównego i użytkownika root.

**Kontenery domyślnie używają `network: "none"`** — ustaw `"bridge"` (lub niestandardową sieć bridge), jeśli agent potrzebuje dostępu wychodzącego.
`"host"` jest blokowane. `"container:<id>"` jest domyślnie blokowane, chyba że jawnie ustawisz
`sandbox.docker.dangerouslyAllowContainerNamespaceJoin: true` (awaryjne obejście).

**Załączniki przychodzące** są umieszczane w `media/inbound/*` w aktywnej przestrzeni roboczej.

**`docker.binds`** montuje dodatkowe katalogi hosta; wiązania globalne i dla agenta są scalane.

**Przeglądarka w piaskownicy** (`sandbox.browser.enabled`): Chromium + CDP w kontenerze. URL noVNC jest wstrzykiwany do promptu systemowego. Nie wymaga `browser.enabled` w `openclaw.json`.
Dostęp obserwatora noVNC domyślnie używa uwierzytelniania VNC, a OpenClaw emituje krótkotrwały URL z tokenem (zamiast ujawniać hasło we współdzielonym URL).

- `allowHostControl: false` (domyślnie) blokuje sesjom w piaskownicy możliwość celowania w przeglądarkę hosta.
- `network` domyślnie ma wartość `openclaw-sandbox-browser` (dedykowana sieć bridge). Ustaw `bridge` tylko wtedy, gdy jawnie chcesz globalną łączność bridge.
- `cdpSourceRange` opcjonalnie ogranicza wejście CDP na krawędzi kontenera do zakresu CIDR (na przykład `172.21.0.1/32`).
- `sandbox.browser.binds` montuje dodatkowe katalogi hosta tylko w kontenerze przeglądarki piaskownicy. Gdy jest ustawione (w tym `[]`), zastępuje `docker.binds` dla kontenera przeglądarki.
- Domyślne ustawienia uruchamiania są zdefiniowane w `scripts/sandbox-browser-entrypoint.sh` i dostrojone pod hosty kontenerów:
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
  - `OPENCLAW_BROWSER_DISABLE_EXTENSIONS=0` ponownie włącza rozszerzenia, jeśli zależy od nich Twój przepływ pracy.
  - `--renderer-process-limit=2` można zmienić za pomocą
    `OPENCLAW_BROWSER_RENDERER_PROCESS_LIMIT=<N>`; ustaw `0`, aby użyć domyślnego limitu procesów Chromium.
  - plus `--no-sandbox`, gdy włączone jest `noSandbox`.
  - Domyślne wartości są bazą obrazu kontenera; użyj niestandardowego obrazu przeglądarki z niestandardowym
    entrypointem, aby zmienić domyślne wartości kontenera.

</Accordion>

Izolacja przeglądarki w piaskownicy i `sandbox.docker.binds` działają tylko z Dockerem.

Budowanie obrazów (z checkoutu źródłowego):

```bash
scripts/sandbox-setup.sh           # main sandbox image
scripts/sandbox-browser-setup.sh   # optional browser image
```

W przypadku instalacji npm bez checkoutu źródłowego zobacz [Izolacja w piaskownicy § Obrazy i konfiguracja](/pl/gateway/sandboxing#images-and-setup), aby uzyskać polecenia `docker build` inline.

### `agents.list` (nadpisania dla agentów)

Użyj `agents.list[].tts`, aby nadać agentowi własnego dostawcę TTS, głos, model,
styl lub tryb auto-TTS. Blok agenta jest głęboko scalany z globalnym
`messages.tts`, więc współdzielone dane uwierzytelniające mogą pozostać w jednym miejscu, a poszczególni
agenci nadpisują tylko potrzebne pola głosu lub dostawcy. Nadpisanie aktywnego agenta
dotyczy automatycznych odpowiedzi mówionych, `/tts audio`, `/tts status` oraz
narzędzia agenta `tts`. Przykłady dostawców i kolejność pierwszeństwa znajdziesz w sekcji [Zamiana tekstu na mowę](/pl/tools/tts#per-agent-voice-overrides).

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
        agentRuntime: { id: "auto" },
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

- `id`: stabilny identyfikator agenta (wymagane).
- `default`: gdy ustawiono kilka, wygrywa pierwszy (logowane jest ostrzeżenie). Jeśli nie ustawiono żadnego, domyślna jest pierwsza pozycja listy.
- `model`: forma tekstowa ustawia ścisły model podstawowy dla danego agenta bez modelu zapasowego; forma obiektowa `{ primary }` również jest ścisła, chyba że dodasz `fallbacks`. Użyj `{ primary, fallbacks: [...] }`, aby włączyć dla tego agenta modele zapasowe, albo `{ primary, fallbacks: [] }`, aby jawnie ustawić ścisłe zachowanie. Zadania Cron, które nadpisują tylko `primary`, nadal dziedziczą domyślne modele zapasowe, chyba że ustawisz `fallbacks: []`.
- `params`: parametry strumienia dla danego agenta scalane nad wybraną pozycją modelu w `agents.defaults.models`. Użyj tego do nadpisań specyficznych dla agenta, takich jak `cacheRetention`, `temperature` lub `maxTokens`, bez duplikowania całego katalogu modeli.
- `tts`: opcjonalne nadpisania zamiany tekstu na mowę dla danego agenta. Blok jest głęboko scalany nad `messages.tts`, więc wspólne dane uwierzytelniające dostawcy i politykę modeli zapasowych trzymaj w `messages.tts`, a tutaj ustawiaj tylko wartości specyficzne dla persony, takie jak dostawca, głos, model, styl lub tryb automatyczny.
- `skills`: opcjonalna lista dozwolonych Skills dla danego agenta. Jeśli pominięta, agent dziedziczy `agents.defaults.skills`, gdy jest ustawione; jawna lista zastępuje wartości domyślne zamiast je scalać, a `[]` oznacza brak Skills.
- `thinkingDefault`: opcjonalny domyślny poziom myślenia dla danego agenta (`off | minimal | low | medium | high | xhigh | adaptive | max`). Nadpisuje `agents.defaults.thinkingDefault` dla tego agenta, gdy nie ustawiono nadpisania na poziomie wiadomości ani sesji. Wybrany profil dostawcy/modelu kontroluje, które wartości są prawidłowe; dla Google Gemini `adaptive` zachowuje dynamiczne myślenie zarządzane przez dostawcę (`thinkingLevel` pominięte w Gemini 3/3.1, `thinkingBudget: -1` w Gemini 2.5).
- `reasoningDefault`: opcjonalna domyślna widoczność rozumowania dla danego agenta (`on | off | stream`). Nadpisuje `agents.defaults.reasoningDefault` dla tego agenta, gdy nie ustawiono nadpisania rozumowania na poziomie wiadomości ani sesji.
- `fastModeDefault`: opcjonalna wartość domyślna trybu szybkiego dla danego agenta (`true | false`). Stosowana, gdy nie ustawiono nadpisania trybu szybkiego na poziomie wiadomości ani sesji.
- `agentRuntime`: opcjonalne niskopoziomowe nadpisanie polityki środowiska uruchomieniowego dla danego agenta. Użyj `{ id: "codex" }`, aby jeden agent używał tylko Codex, podczas gdy inni agenci zachowają domyślny zapasowy tryb PI w trybie `auto`.
- `runtime`: opcjonalny deskryptor środowiska uruchomieniowego dla danego agenta. Użyj `type: "acp"` z domyślnymi ustawieniami `runtime.acp` (`agent`, `backend`, `mode`, `cwd`), gdy agent ma domyślnie używać sesji uprzęży ACP.
- `identity.avatar`: ścieżka względna względem obszaru roboczego, URL `http(s)` albo identyfikator URI `data:`.
- `identity` wyprowadza wartości domyślne: `ackReaction` z `emoji`, `mentionPatterns` z `name`/`emoji`.
- `subagents.allowAgents`: lista dozwolonych identyfikatorów agentów dla jawnych celów `sessions_spawn.agentId` (`["*"]` = dowolny; domyślnie: tylko ten sam agent). Uwzględnij identyfikator żądającego, gdy mają być dozwolone samocelujące wywołania `agentId`.
- Ochrona dziedziczenia piaskownicy: jeśli sesja żądającego działa w piaskownicy, `sessions_spawn` odrzuca cele, które uruchomiłyby się poza piaskownicą.
- `subagents.requireAgentId`: gdy ma wartość true, blokuje wywołania `sessions_spawn`, które pomijają `agentId` (wymusza jawny wybór profilu; domyślnie: false).

---

## Routing wielu agentów

Uruchamiaj wielu izolowanych agentów w jednym Gateway. Zobacz [wielu agentów](/pl/concepts/multi-agent).

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

### Pola dopasowania powiązań

- `type` (opcjonalne): `route` dla normalnego routingu (brak typu domyślnie oznacza route), `acp` dla trwałych powiązań konwersacji ACP.
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
5. `match.accountId: "*"` (dla całego kanału)
6. Domyślny agent

W obrębie każdego poziomu wygrywa pierwsza pasująca pozycja `bindings`.

Dla pozycji `type: "acp"` OpenClaw rozwiązuje według dokładnej tożsamości konwersacji (`match.channel` + konto + `match.peer.id`) i nie używa powyższej kolejności poziomów powiązań routingu.

### Profile dostępu dla agentów

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

<Accordion title="Brak dostępu do systemu plików (tylko komunikacja)">

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

Zobacz [Piaskownica i narzędzia wieloagentowe](/pl/tools/multi-agent-sandbox-tools), aby poznać szczegóły pierwszeństwa.

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

<Accordion title="Szczegóły pól sesji">

- **`scope`**: podstawowa strategia grupowania sesji dla kontekstów czatu grupowego.
  - `per-sender` (domyślnie): każdy nadawca otrzymuje izolowaną sesję w kontekście kanału.
  - `global`: wszyscy uczestnicy w kontekście kanału współdzielą jedną sesję (używaj tylko wtedy, gdy zamierzony jest współdzielony kontekst).
- **`dmScope`**: sposób grupowania wiadomości bezpośrednich.
  - `main`: wszystkie wiadomości bezpośrednie współdzielą sesję główną.
  - `per-peer`: izoluje według identyfikatora nadawcy między kanałami.
  - `per-channel-peer`: izoluje według kanału i nadawcy (zalecane dla skrzynek odbiorczych wielu użytkowników).
  - `per-account-channel-peer`: izoluje według konta, kanału i nadawcy (zalecane dla wielu kont).
- **`identityLinks`**: mapuje kanoniczne identyfikatory na peery z prefiksem dostawcy w celu współdzielenia sesji między kanałami. Polecenia dokowania, takie jak `/dock_discord`, używają tej samej mapy, aby przełączyć trasę odpowiedzi aktywnej sesji na inny powiązany peer kanału; zobacz [Dokowanie kanałów](/pl/concepts/channel-docking).
- **`reset`**: główna polityka resetowania. `daily` resetuje o lokalnej godzinie `atHour`; `idle` resetuje po `idleMinutes`. Gdy skonfigurowano oba, wygrywa ten, który wygaśnie pierwszy. Świeżość resetu dziennego używa `sessionStartedAt` wiersza sesji; świeżość resetu bezczynności używa `lastInteractionAt`. Zapisy w tle i zdarzenia systemowe, takie jak Heartbeat, wybudzenia Cron, powiadomienia exec i księgowanie Gateway, mogą aktualizować `updatedAt`, ale nie utrzymują świeżości sesji dziennych/bezczynności.
- **`resetByType`**: nadpisania dla typów (`direct`, `group`, `thread`). Starsze `dm` jest akceptowane jako alias dla `direct`.
- **`mainKey`**: pole starszego typu. Runtime zawsze używa `"main"` dla głównego zasobnika czatu bezpośredniego.
- **`agentToAgent.maxPingPongTurns`**: maksymalna liczba tur odpowiedzi zwrotnych między agentami podczas wymian agent-agent (liczba całkowita, zakres: `0`–`5`). `0` wyłącza łańcuch ping-pong.
- **`sendPolicy`**: dopasowuje według `channel`, `chatType` (`direct|group|channel`, ze starszym aliasem `dm`), `keyPrefix` lub `rawKeyPrefix`. Pierwsza odmowa wygrywa.
- **`maintenance`**: kontrolki czyszczenia magazynu sesji i przechowywania.
  - `mode`: `warn` tylko emituje ostrzeżenia; `enforce` stosuje czyszczenie.
  - `pruneAfter`: próg wieku dla nieaktualnych wpisów (domyślnie `30d`).
  - `maxEntries`: maksymalna liczba wpisów w `sessions.json` (domyślnie `500`). Runtime zapisuje czyszczenie wsadowe z niewielkim buforem wysokiego poziomu dla limitów o rozmiarze produkcyjnym; `openclaw sessions cleanup --enforce` stosuje limit natychmiast.
  - `rotateBytes`: przestarzałe i ignorowane; `openclaw doctor --fix` usuwa je ze starszych konfiguracji.
  - `resetArchiveRetention`: okres przechowywania archiwów transkrypcji `*.reset.<timestamp>`. Domyślnie równe `pruneAfter`; ustaw `false`, aby wyłączyć.
  - `maxDiskBytes`: opcjonalny budżet dysku katalogu sesji. W trybie `warn` zapisuje ostrzeżenia w dzienniku; w trybie `enforce` najpierw usuwa najstarsze artefakty/sesje.
  - `highWaterBytes`: opcjonalny cel po czyszczeniu budżetu. Domyślnie `80%` wartości `maxDiskBytes`.
- **`threadBindings`**: globalne wartości domyślne dla funkcji sesji powiązanych z wątkiem.
  - `enabled`: główny przełącznik domyślny (dostawcy mogą nadpisać; Discord używa `channels.discord.threadBindings.enabled`)
  - `idleHours`: domyślne automatyczne odfokusowanie po bezczynności w godzinach (`0` wyłącza; dostawcy mogą nadpisać)
  - `maxAgeHours`: domyślny twardy maksymalny wiek w godzinach (`0` wyłącza; dostawcy mogą nadpisać)
  - `spawnSessions`: domyślna bramka tworzenia sesji roboczych powiązanych z wątkiem z `sessions_spawn` i wywołań ACP tworzących wątki. Domyślnie `true`, gdy powiązania wątków są włączone; dostawcy/konta mogą nadpisać.
  - `defaultSpawnContext`: domyślny natywny kontekst podagenta dla uruchomień powiązanych z wątkiem (`"fork"` lub `"isolated"`). Domyślnie `"fork"`.

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

| Zmienna           | Opis                         | Przykład                    |
| ----------------- | ---------------------------- | --------------------------- |
| `{model}`         | Krótka nazwa modelu          | `claude-opus-4-6`           |
| `{modelFull}`     | Pełny identyfikator modelu   | `anthropic/claude-opus-4-6` |
| `{provider}`      | Nazwa dostawcy               | `anthropic`                 |
| `{thinkingLevel}` | Bieżący poziom myślenia      | `high`, `low`, `off`        |
| `{identity.name}` | Nazwa tożsamości agenta      | (tak samo jak `"auto"`)     |

Zmienne nie rozróżniają wielkości liter. `{think}` jest aliasem `{thinkingLevel}`.

### Reakcja potwierdzenia

- Domyślnie używa `identity.emoji` aktywnego agenta, w przeciwnym razie `"👀"`. Ustaw `""`, aby wyłączyć.
- Nadpisania dla kanału: `channels.<channel>.ackReaction`, `channels.<channel>.accounts.<id>.ackReaction`.
- Kolejność rozstrzygania: konto → kanał → `messages.ackReaction` → awaryjna wartość z tożsamości.
- Zakres: `group-mentions` (domyślnie), `group-all`, `direct`, `all`.
- `removeAckAfterReply`: usuwa potwierdzenie po odpowiedzi w kanałach obsługujących reakcje, takich jak Slack, Discord, Telegram, WhatsApp i BlueBubbles.
- `messages.statusReactions.enabled`: włącza reakcje statusu cyklu życia w Slack, Discord i Telegram.
  W Slack i Discord brak ustawienia pozostawia reakcje statusu włączone, gdy reakcje potwierdzenia są aktywne.
  W Telegram ustaw to jawnie na `true`, aby włączyć reakcje statusu cyklu życia.

### Debounce wiadomości przychodzących

Łączy szybkie wiadomości wyłącznie tekstowe od tego samego nadawcy w jedną turę agenta. Media/załączniki opróżniają kolejkę natychmiast. Polecenia sterujące omijają debounce.

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
- `modelOverrides` jest domyślnie włączone; `modelOverrides.allowProvider` domyślnie ma wartość `false` (wymaga świadomego włączenia).
- Klucze API awaryjnie używają `ELEVENLABS_API_KEY`/`XI_API_KEY` oraz `OPENAI_API_KEY`.
- Dołączone dostawcy mowy są własnością Plugin. Jeśli ustawiono `plugins.allow`, uwzględnij każdy Plugin dostawcy TTS, którego chcesz użyć, na przykład `microsoft` dla Edge TTS. Starszy identyfikator dostawcy `edge` jest akceptowany jako alias `microsoft`.
- `providers.openai.baseUrl` nadpisuje punkt końcowy OpenAI TTS. Kolejność rozstrzygania to konfiguracja, następnie `OPENAI_TTS_BASE_URL`, a następnie `https://api.openai.com/v1`.
- Gdy `providers.openai.baseUrl` wskazuje punkt końcowy inny niż OpenAI, OpenClaw traktuje go jako serwer TTS zgodny z OpenAI i łagodzi walidację modelu/głosu.

---

## Talk

Ustawienia domyślne trybu Talk (macOS/iOS/Android).

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

- `talk.provider` musi pasować do klucza w `talk.providers`, gdy skonfigurowano wielu dostawców Talk.
- Starsze płaskie klucze Talk (`talk.voiceId`, `talk.voiceAliases`, `talk.modelId`, `talk.outputFormat`, `talk.apiKey`) służą wyłącznie do zgodności i są automatycznie migrowane do `talk.providers.<provider>`.
- Identyfikatory głosów awaryjnie używają `ELEVENLABS_VOICE_ID` lub `SAG_VOICE_ID`.
- `providers.*.apiKey` akceptuje ciągi tekstowe jawne albo obiekty SecretRef.
- Awaryjne użycie `ELEVENLABS_API_KEY` ma zastosowanie tylko wtedy, gdy nie skonfigurowano klucza API Talk.
- `providers.*.voiceAliases` pozwala dyrektywom Talk używać przyjaznych nazw.
- `providers.mlx.modelId` wybiera repozytorium Hugging Face używane przez lokalnego pomocnika MLX na macOS. Jeśli pominięto, macOS używa `mlx-community/Soprano-80M-bf16`.
- Odtwarzanie MLX na macOS działa przez dołączonego pomocnika `openclaw-mlx-tts`, gdy jest obecny, albo przez plik wykonywalny w `PATH`; `OPENCLAW_MLX_TTS_BIN` nadpisuje ścieżkę pomocnika na potrzeby tworzenia oprogramowania.
- `speechLocale` ustawia identyfikator lokalizacji BCP 47 używany przez rozpoznawanie mowy Talk na iOS/macOS. Pozostaw nieustawione, aby użyć domyślnej wartości urządzenia.
- `silenceTimeoutMs` kontroluje, jak długo tryb Talk czeka po ciszy użytkownika, zanim wyśle transkrypcję. Brak ustawienia zachowuje domyślne okno pauzy platformy (`700 ms on macOS and Android, 900 ms on iOS`).

---

## Powiązane

- [Dokumentacja konfiguracji](/pl/gateway/configuration-reference) — wszystkie pozostałe klucze konfiguracji
- [Konfiguracja](/pl/gateway/configuration) — typowe zadania i szybka konfiguracja
- [Przykłady konfiguracji](/pl/gateway/configuration-examples)
