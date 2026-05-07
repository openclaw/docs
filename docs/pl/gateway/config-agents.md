---
read_when:
    - Dostrajanie domyślnych ustawień agenta (modele, rozumowanie, przestrzeń robocza, Heartbeat, media, Skills)
    - Konfigurowanie routingu i powiązań dla wielu agentów
    - Dostosowywanie sesji, dostarczania wiadomości i zachowania trybu rozmowy
summary: Domyślne ustawienia agentów, routing wieloagentowy, sesja, wiadomości i konfiguracja talk
title: Konfiguracja — agenci
x-i18n:
    generated_at: "2026-05-07T13:16:40Z"
    model: gpt-5.5
    provider: openai
    source_hash: 287b832cda451900ff184546ee38313e1304ffc9bb52bacae6b1f457c64f4c08
    source_path: gateway/config-agents.md
    workflow: 16
---

Klucze konfiguracji o zakresie agenta w `agents.*`, `multiAgent.*`, `session.*`,
`messages.*` i `talk.*`. Klucze kanałów, narzędzi, środowiska uruchomieniowego
Gateway oraz inne klucze najwyższego poziomu opisuje [dokumentacja konfiguracji](/pl/gateway/configuration-reference).

## Domyślne ustawienia agentów

### `agents.defaults.workspace`

Domyślnie: `~/.openclaw/workspace`.

```json5
{
  agents: { defaults: { workspace: "~/.openclaw/workspace" } },
}
```

### `agents.defaults.repoRoot`

Opcjonalny katalog główny repozytorium pokazywany w wierszu Runtime promptu systemowego. Jeśli nie jest ustawiony, OpenClaw wykrywa go automatycznie, idąc w górę od przestrzeni roboczej.

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
- Pomiń `agents.list[].skills`, aby dziedziczyć ustawienia domyślne.
- Ustaw `agents.list[].skills: []`, aby nie używać żadnych Skills.
- Niepusta lista `agents.list[].skills` jest ostatecznym zestawem dla tego agenta;
  nie jest scalana z ustawieniami domyślnymi.

### `agents.defaults.skipBootstrap`

Wyłącza automatyczne tworzenie plików bootstrap przestrzeni roboczej (`AGENTS.md`, `SOUL.md`, `TOOLS.md`, `IDENTITY.md`, `USER.md`, `HEARTBEAT.md`, `BOOTSTRAP.md`).

```json5
{
  agents: { defaults: { skipBootstrap: true } },
}
```

### `agents.defaults.skipOptionalBootstrapFiles`

Pomija tworzenie wybranych opcjonalnych plików przestrzeni roboczej, nadal zapisując wymagane pliki bootstrap. Prawidłowe wartości: `SOUL.md`, `USER.md`, `HEARTBEAT.md` i `IDENTITY.md`.

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

Kontroluje, kiedy pliki bootstrap przestrzeni roboczej są wstrzykiwane do promptu systemowego. Domyślnie: `"always"`.

- `"continuation-skip"`: bezpieczne tury kontynuacji (po ukończonej odpowiedzi asystenta) pomijają ponowne wstrzyknięcie bootstrapu przestrzeni roboczej, zmniejszając rozmiar promptu. Uruchomienia Heartbeat i ponowienia po Compaction nadal przebudowują kontekst.
- `"never"`: wyłącza bootstrap przestrzeni roboczej i wstrzykiwanie plików kontekstu w każdej turze. Używaj tego tylko dla agentów, które w pełni kontrolują cykl życia własnego promptu (niestandardowe silniki kontekstu, natywne środowiska uruchomieniowe budujące własny kontekst lub wyspecjalizowane przepływy pracy bez bootstrapu). Tury Heartbeat i odzyskiwania po Compaction również pomijają wstrzykiwanie.

```json5
{
  agents: { defaults: { contextInjection: "continuation-skip" } },
}
```

### `agents.defaults.bootstrapMaxChars`

Maksymalna liczba znaków na plik bootstrap przestrzeni roboczej przed obcięciem. Domyślnie: `12000`.

```json5
{
  agents: { defaults: { bootstrapMaxChars: 12000 } },
}
```

### `agents.defaults.bootstrapTotalMaxChars`

Maksymalna łączna liczba znaków wstrzykiwanych ze wszystkich plików bootstrap przestrzeni roboczej. Domyślnie: `60000`.

```json5
{
  agents: { defaults: { bootstrapTotalMaxChars: 60000 } },
}
```

### `agents.defaults.bootstrapPromptTruncationWarning`

Kontroluje widoczne dla agenta powiadomienie w prompcie systemowym, gdy kontekst bootstrap jest obcinany.
Domyślnie: `"once"`.

- `"off"`: nigdy nie wstrzykuj tekstu powiadomienia o obcięciu do promptu systemowego.
- `"once"`: wstrzyknij zwięzłe powiadomienie raz dla każdej unikalnej sygnatury obcięcia (zalecane).
- `"always"`: wstrzyknij zwięzłe powiadomienie przy każdym uruchomieniu, gdy występuje obcięcie.

Szczegółowe liczby surowe/wstrzyknięte i pola dostrajania konfiguracji pozostają w diagnostyce, takiej jak raporty stanu/kontekstu i logi; rutynowy kontekst użytkownika/środowiska uruchomieniowego WebChat otrzymuje tylko zwięzłe powiadomienie odzyskiwania.

```json5
{
  agents: { defaults: { bootstrapPromptTruncationWarning: "once" } }, // off | once | always
}
```

### Mapa własności budżetu kontekstu

OpenClaw ma wiele wysokowolumenowych budżetów promptu/kontekstu i są one
celowo podzielone według podsystemu, zamiast przechodzić przez jeden ogólny
przełącznik.

- `agents.defaults.bootstrapMaxChars` /
  `agents.defaults.bootstrapTotalMaxChars`:
  zwykłe wstrzykiwanie bootstrapu przestrzeni roboczej.
- `agents.defaults.startupContext.*`:
  jednorazowe preludium uruchomienia modelu po resecie/starcie, w tym ostatnie codzienne
  pliki `memory/*.md`. Same polecenia czatu `/new` i `/reset` są
  potwierdzane bez wywoływania modelu.
- `skills.limits.*`:
  kompaktowa lista Skills wstrzykiwana do promptu systemowego.
- `agents.defaults.contextLimits.*`:
  ograniczone fragmenty środowiska uruchomieniowego i wstrzykiwane bloki należące do środowiska uruchomieniowego.
- `memory.qmd.limits.*`:
  rozmiar fragmentów indeksowanego wyszukiwania pamięci i wstrzyknięć.

Używaj odpowiedniego nadpisania dla agenta tylko wtedy, gdy jeden agent potrzebuje innego
budżetu:

- `agents.list[].skillsLimits.maxSkillsPromptChars`
- `agents.list[].contextLimits.*`

#### `agents.defaults.startupContext`

Kontroluje preludium startowe pierwszej tury wstrzykiwane przy uruchomieniach modelu po resecie/starcie.
Same polecenia czatu `/new` i `/reset` potwierdzają reset bez wywoływania
modelu, więc nie ładują tego preludium.

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

Współdzielone ustawienia domyślne dla ograniczonych powierzchni kontekstu środowiska uruchomieniowego.

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
  metadanych obcięcia i powiadomienia o kontynuacji.
- `memoryGetDefaultLines`: domyślne okno wierszy `memory_get`, gdy `lines` jest
  pominięte.
- `toolResultMaxChars`: limit wyników narzędzi na żywo używany dla utrwalonych wyników i
  odzyskiwania po przepełnieniu.
- `postCompactionMaxChars`: limit fragmentu AGENTS.md używany podczas wstrzykiwania
  odświeżenia po Compaction.

#### `agents.list[].contextLimits`

Nadpisanie dla agenta dla współdzielonych przełączników `contextLimits`. Pominięte pola dziedziczą
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

Nadpisanie budżetu promptu Skills dla agenta.

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

Maksymalny rozmiar w pikselach dla najdłuższego boku obrazu w blokach obrazu transkrypcji/narzędzi przed wywołaniami dostawcy.
Domyślnie: `1200`.

Niższe wartości zwykle zmniejszają użycie tokenów wizji i rozmiar ładunku żądania w uruchomieniach z dużą liczbą zrzutów ekranu.
Wyższe wartości zachowują więcej szczegółów wizualnych.

```json5
{
  agents: { defaults: { imageMaxDimensionPx: 1200 } },
}
```

### `agents.defaults.userTimezone`

Strefa czasowa dla kontekstu promptu systemowego (nie znaczników czasu wiadomości). W razie braku używa strefy czasowej hosta.

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
  - Używane przez ścieżkę narzędzia `image` jako konfiguracja modelu wizyjnego.
  - Używane także jako routing awaryjny, gdy wybrany/domyślny model nie obsługuje danych wejściowych obrazu.
  - Preferuj jawne odwołania `provider/model`. Same identyfikatory są akceptowane ze względu na zgodność; jeśli sam identyfikator jednoznacznie pasuje do skonfigurowanego wpisu obsługującego obrazy w `models.providers.*.models`, OpenClaw kwalifikuje go do tego providera. Niejednoznaczne skonfigurowane dopasowania wymagają jawnego prefiksu providera.
- `imageGenerationModel`: akceptuje ciąg znaków (`"provider/model"`) albo obiekt (`{ primary, fallbacks }`).
  - Używane przez wspólną funkcję generowania obrazów oraz każdą przyszłą powierzchnię narzędzia/pluginu, która generuje obrazy.
  - Typowe wartości: `google/gemini-3.1-flash-image-preview` dla natywnego generowania obrazów Gemini, `fal/fal-ai/flux/dev` dla fal, `openai/gpt-image-2` dla OpenAI Images albo `openai/gpt-image-1.5` dla wyjścia OpenAI PNG/WebP z przezroczystym tłem.
  - Jeśli wybierasz bezpośrednio provider/model, skonfiguruj także pasujące uwierzytelnianie providera (na przykład `GEMINI_API_KEY` albo `GOOGLE_API_KEY` dla `google/*`, `OPENAI_API_KEY` albo OpenAI Codex OAuth dla `openai/gpt-image-2` / `openai/gpt-image-1.5`, `FAL_KEY` dla `fal/*`).
  - Jeśli pominięto, `image_generate` nadal może wywnioskować domyślnego providera z uwierzytelnianiem. Najpierw próbuje bieżącego domyślnego providera, a następnie pozostałych zarejestrowanych providerów generowania obrazów w kolejności identyfikatorów providerów.
- `musicGenerationModel`: akceptuje ciąg znaków (`"provider/model"`) albo obiekt (`{ primary, fallbacks }`).
  - Używane przez wspólną funkcję generowania muzyki oraz wbudowane narzędzie `music_generate`.
  - Typowe wartości: `google/lyria-3-clip-preview`, `google/lyria-3-pro-preview` albo `minimax/music-2.6`.
  - Jeśli pominięto, `music_generate` nadal może wywnioskować domyślnego providera z uwierzytelnianiem. Najpierw próbuje bieżącego domyślnego providera, a następnie pozostałych zarejestrowanych providerów generowania muzyki w kolejności identyfikatorów providerów.
  - Jeśli wybierasz bezpośrednio provider/model, skonfiguruj także pasujące uwierzytelnianie/klucz API providera.
- `videoGenerationModel`: akceptuje ciąg znaków (`"provider/model"`) albo obiekt (`{ primary, fallbacks }`).
  - Używane przez wspólną funkcję generowania wideo oraz wbudowane narzędzie `video_generate`.
  - Typowe wartości: `qwen/wan2.6-t2v`, `qwen/wan2.6-i2v`, `qwen/wan2.6-r2v`, `qwen/wan2.6-r2v-flash` albo `qwen/wan2.7-r2v`.
  - Jeśli pominięto, `video_generate` nadal może wywnioskować domyślnego providera z uwierzytelnianiem. Najpierw próbuje bieżącego domyślnego providera, a następnie pozostałych zarejestrowanych providerów generowania wideo w kolejności identyfikatorów providerów.
  - Jeśli wybierasz bezpośrednio provider/model, skonfiguruj także pasujące uwierzytelnianie/klucz API providera.
  - Dołączony provider generowania wideo Qwen obsługuje maksymalnie 1 wyjściowe wideo, 1 obraz wejściowy, 4 wejściowe wideo, czas trwania 10 sekund oraz opcje na poziomie providera: `size`, `aspectRatio`, `resolution`, `audio` i `watermark`.
- `pdfModel`: akceptuje ciąg znaków (`"provider/model"`) albo obiekt (`{ primary, fallbacks }`).
  - Używane przez narzędzie `pdf` do routingu modelu.
  - Jeśli pominięto, narzędzie PDF wraca do `imageModel`, a następnie do rozstrzygniętego modelu sesji/domyślnego.
- `pdfMaxBytesMb`: domyślny limit rozmiaru PDF dla narzędzia `pdf`, gdy `maxBytesMb` nie zostanie przekazane w czasie wywołania.
- `pdfMaxPages`: domyślna maksymalna liczba stron branych pod uwagę przez tryb awaryjny ekstrakcji w narzędziu `pdf`.
- `verboseDefault`: domyślny poziom szczegółowości dla agentów. Wartości: `"off"`, `"on"`, `"full"`. Domyślnie: `"off"`.
- `toolProgressDetail`: tryb szczegółów dla podsumowań narzędzi `/verbose` i wierszy narzędzi szkicu postępu. Wartości: `"explain"` (domyślnie, zwarte etykiety czytelne dla człowieka) albo `"raw"` (dołącza surowe polecenie/szczegóły, gdy są dostępne). `agents.list[].toolProgressDetail` dla danego agenta zastępuje tę wartość domyślną.
- `reasoningDefault`: domyślna widoczność rozumowania dla agentów. Wartości: `"off"`, `"on"`, `"stream"`. `agents.list[].reasoningDefault` dla danego agenta zastępuje tę wartość domyślną. Skonfigurowane domyślne wartości rozumowania są stosowane tylko dla właścicieli, autoryzowanych nadawców albo kontekstów Gateway operator-admin, gdy nie ustawiono nadpisania rozumowania dla wiadomości ani sesji.
- `elevatedDefault`: domyślny poziom podwyższonych danych wyjściowych dla agentów. Wartości: `"off"`, `"on"`, `"ask"`, `"full"`. Domyślnie: `"on"`.
- `model.primary`: format `provider/model` (np. `openai/gpt-5.5` dla klucza API OpenAI albo dostępu Codex OAuth). Jeśli pominiesz providera, OpenClaw najpierw próbuje aliasu, potem unikalnego dopasowania skonfigurowanego providera dla dokładnie tego identyfikatora modelu, a dopiero potem wraca do skonfigurowanego domyślnego providera (przestarzałe zachowanie zgodności, więc preferuj jawne `provider/model`). Jeśli ten provider nie udostępnia już skonfigurowanego domyślnego modelu, OpenClaw wraca do pierwszego skonfigurowanego provider/model zamiast ujawniać nieaktualną wartość domyślną usuniętego providera.
- `models`: skonfigurowany katalog modeli i lista dozwolonych wartości dla `/model`. Każdy wpis może zawierać `alias` (skrót) i `params` (specyficzne dla providera, na przykład `temperature`, `maxTokens`, `cacheRetention`, `context1m`, `responsesServerCompaction`, `responsesCompactThreshold`, `chat_template_kwargs`, `extra_body`/`extraBody`).
  - Bezpieczne edycje: użyj `openclaw config set agents.defaults.models '<json>' --strict-json --merge`, aby dodać wpisy. `config set` odmawia zastąpień, które usunęłyby istniejące wpisy listy dozwolonych, chyba że przekażesz `--replace`.
  - Przepływy konfiguracji/onboardingu ograniczone do providera scalają wybrane modele providera z tą mapą i zachowują już skonfigurowanych niepowiązanych providerów.
  - Dla bezpośrednich modeli OpenAI Responses compaction po stronie serwera jest włączana automatycznie. Użyj `params.responsesServerCompaction: false`, aby zatrzymać wstrzykiwanie `context_management`, albo `params.responsesCompactThreshold`, aby nadpisać próg. Zobacz [compaction po stronie serwera OpenAI](/pl/providers/openai#server-side-compaction-responses-api).
- `params`: globalne domyślne parametry providera stosowane do wszystkich modeli. Ustawiane w `agents.defaults.params` (np. `{ cacheRetention: "long" }`).
- Kolejność pierwszeństwa scalania `params` (konfiguracja): `agents.defaults.params` (globalna baza) jest nadpisywane przez `agents.defaults.models["provider/model"].params` (dla modelu), a następnie `agents.list[].params` (pasujący identyfikator agenta) nadpisuje według klucza. Szczegóły znajdziesz w [Prompt Caching](/pl/reference/prompt-caching).
- `params.extra_body`/`params.extraBody`: zaawansowany przekazywany dalej JSON scalany z ciałami żądań `api: "openai-completions"` dla proxy zgodnych z OpenAI. Jeśli koliduje z wygenerowanymi kluczami żądania, wygrywa dodatkowe ciało; nienatywne trasy completions nadal usuwają potem wyłączne dla OpenAI `store`.
- `params.chat_template_kwargs`: argumenty szablonu czatu zgodne z vLLM/OpenAI scalane z najwyższym poziomem ciał żądań `api: "openai-completions"`. Dla `vllm/nemotron-3-*` z wyłączonym myśleniem dołączony plugin vLLM automatycznie wysyła `enable_thinking: false` i `force_nonempty_content: true`; jawne `chat_template_kwargs` nadpisują wygenerowane wartości domyślne, a `extra_body.chat_template_kwargs` nadal ma ostateczne pierwszeństwo. Dla kontrolek myślenia vLLM Qwen ustaw `params.qwenThinkingFormat` na `"chat-template"` albo `"top-level"` w tym wpisie modelu.
- `compat.supportedReasoningEfforts`: lista poziomów wysiłku rozumowania zgodna z OpenAI dla danego modelu. Uwzględnij `"xhigh"` dla niestandardowych endpointów, które rzeczywiście ją akceptują; OpenClaw udostępnia wtedy `/think xhigh` w menu poleceń, wierszach sesji Gateway, walidacji poprawek sesji, walidacji CLI agenta i walidacji `llm-task` dla tego skonfigurowanego provider/model. Użyj `compat.reasoningEffortMap`, gdy backend oczekuje wartości specyficznej dla providera dla poziomu kanonicznego.
- `params.preserveThinking`: tylko dla Z.AI, zgoda na zachowywane myślenie. Gdy włączone i myślenie jest aktywne, OpenClaw wysyła `thinking.clear_thinking: false` i odtwarza wcześniejsze `reasoning_content`; zobacz [myślenie Z.AI i zachowywane myślenie](/pl/providers/zai#thinking-and-preserved-thinking).
- `agentRuntime`: domyślna niskopoziomowa polityka środowiska wykonawczego agenta. Pominięty identyfikator domyślnie oznacza OpenClaw Pi. Użyj `id: "pi"`, aby wymusić wbudowany harness PI, `id: "auto"`, aby pozwolić zarejestrowanym harnessom pluginów przejmować obsługiwane modele i używać PI, gdy nic nie pasuje, zarejestrowanego identyfikatora harnessu, takiego jak `id: "codex"`, aby wymagać tego harnessu, albo obsługiwanego aliasu backendu CLI, takiego jak `id: "claude-cli"`. Jawne środowiska wykonawcze pluginów kończą się bezpiecznym błędem, gdy harness jest niedostępny albo zawiedzie. Zachowaj kanoniczne odwołania do modeli jako `provider/model`; wybieraj Codex, Claude CLI, Gemini CLI i inne backendy wykonawcze przez konfigurację środowiska wykonawczego zamiast starszych prefiksów providerów środowiska wykonawczego. Zobacz [Środowiska wykonawcze agentów](/pl/concepts/agent-runtimes), aby dowiedzieć się, czym różni się to od wyboru provider/model.
- Narzędzia zapisujące konfigurację, które modyfikują te pola (na przykład `/models set`, `/models set-image` i polecenia dodawania/usuwania modeli awaryjnych), zapisują kanoniczną formę obiektu i w miarę możliwości zachowują istniejące listy awaryjne.
- `maxConcurrent`: maksymalna liczba równoległych uruchomień agentów między sesjami (każda sesja nadal jest serializowana). Domyślnie: 4.

### `agents.defaults.agentRuntime`

`agentRuntime` kontroluje, który niskopoziomowy executor uruchamia tury agenta. Większość
wdrożeń powinna zachować domyślne środowisko wykonawcze OpenClaw Pi. Używaj go, gdy zaufany
plugin zapewnia natywny harness, taki jak dołączony harness app-server Codex,
albo gdy chcesz użyć obsługiwanego backendu CLI, takiego jak Claude CLI. Model
mentalny opisuje [Środowiska wykonawcze agentów](/pl/concepts/agent-runtimes).

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

- `id`: `"auto"`, `"pi"`, zarejestrowany identyfikator harnessu pluginu albo obsługiwany alias backendu CLI. Dołączony plugin Codex rejestruje `codex`; dołączony plugin Anthropic zapewnia backend CLI `claude-cli`.
- `id: "auto"` pozwala zarejestrowanym harnessom pluginów przejmować obsługiwane tury i używa PI, gdy żaden harness nie pasuje. Jawne środowisko wykonawcze pluginu, takie jak `id: "codex"`, wymaga tego harnessu i kończy się bezpiecznym błędem, jeśli jest niedostępny albo zawiedzie.
- Nadpisanie przez środowisko: `OPENCLAW_AGENT_RUNTIME=<id|auto|pi>` nadpisuje `id` dla tego procesu.
- Modele agentów OpenAI domyślnie używają harnessu Codex; `agentRuntime.id: "codex"` pozostaje prawidłowe, gdy chcesz ustawić to jawnie.
- Dla wdrożeń Claude CLI preferuj `model: "anthropic/claude-opus-4-7"` plus `agentRuntime.id: "claude-cli"`. Starsze odwołania do modeli `claude-cli/claude-opus-4-7` nadal działają ze względu na zgodność, ale nowa konfiguracja powinna utrzymywać kanoniczny wybór provider/model i umieszczać backend wykonawczy w `agentRuntime.id`.
- Starsze klucze polityki środowiska wykonawczego są przepisywane do `agentRuntime` przez `openclaw doctor --fix`.
- Wybór harnessu jest przypinany dla identyfikatora sesji po pierwszym osadzonym uruchomieniu. Zmiany konfiguracji/środowiska wpływają na nowe albo zresetowane sesje, a nie na istniejący transkrypt. Starsze sesje OpenAI z historią transkryptu, ale bez zapisanego przypięcia, używają Codex; nieaktualne przypięcia OpenAI PI można naprawić za pomocą `openclaw doctor --fix`. `/status` raportuje efektywne środowisko wykonawcze, na przykład `Runtime: OpenClaw Pi Default` albo `Runtime: OpenAI Codex`.
- To kontroluje tylko wykonywanie tekstowych tur agenta. Generowanie mediów, wizja, PDF, muzyka, wideo i TTS nadal używają swoich ustawień provider/model.

**Wbudowane skróty aliasów** (mają zastosowanie tylko wtedy, gdy model jest w `agents.defaults.models`):

| Alias               | Model                                  |
| ------------------- | -------------------------------------- |
| `opus`              | `anthropic/claude-opus-4-6`            |
| `sonnet`            | `anthropic/claude-sonnet-4-6`          |
| `gpt`               | `openai/gpt-5.5`                       |
| `gpt-mini`          | `openai/gpt-5.4-mini`                  |
| `gpt-nano`          | `openai/gpt-5.4-nano`                  |
| `gemini`            | `google/gemini-3.1-pro-preview`        |
| `gemini-flash`      | `google/gemini-3-flash-preview`        |
| `gemini-flash-lite` | `google/gemini-3.1-flash-lite-preview` |

Twoje skonfigurowane aliasy zawsze mają pierwszeństwo przed wartościami domyślnymi.

Modele Z.AI GLM-4.x automatycznie włączają tryb myślenia, chyba że ustawisz `--thinking off` albo samodzielnie zdefiniujesz `agents.defaults.models["zai/<model>"].params.thinking`.
Modele Z.AI domyślnie włączają `tool_stream` na potrzeby strumieniowania wywołań narzędzi. Ustaw `agents.defaults.models["zai/<model>"].params.tool_stream` na `false`, aby go wyłączyć.
Modele Anthropic Claude 4.6 domyślnie używają myślenia `adaptive`, gdy nie ustawiono jawnego poziomu myślenia.

### `agents.defaults.cliBackends`

Opcjonalne backendy CLI do zapasowych uruchomień tylko tekstowych (bez wywołań narzędzi). Przydatne jako rezerwa, gdy dostawcy API zawodzą.

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

- Backendy CLI są przede wszystkim tekstowe; narzędzia są zawsze wyłączone.
- Sesje są obsługiwane, gdy ustawiono `sessionArg`.
- Przekazywanie obrazów jest obsługiwane, gdy `imageArg` akceptuje ścieżki plików.

### `agents.defaults.systemPromptOverride`

Zastępuje cały prompt systemowy złożony przez OpenClaw stałym ciągiem tekstowym. Ustaw na poziomie domyślnym (`agents.defaults.systemPromptOverride`) albo dla konkretnego agenta (`agents.list[].systemPromptOverride`). Wartości dla agenta mają pierwszeństwo; wartość pusta lub zawierająca tylko białe znaki jest ignorowana. Przydatne w kontrolowanych eksperymentach z promptami.

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

Niezależne od dostawcy nakładki promptów stosowane według rodziny modeli. Identyfikatory modeli z rodziny GPT-5 otrzymują wspólny kontrakt zachowania u różnych dostawców; `personality` kontroluje tylko przyjazną warstwę stylu interakcji.

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
- `"off"` wyłącza tylko przyjazną warstwę; oznaczony kontrakt zachowania GPT-5 pozostaje włączony.
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
- `includeSystemPromptSection`: gdy ma wartość false, pomija sekcję Heartbeat w prompcie systemowym i pomija wstrzykiwanie `HEARTBEAT.md` do kontekstu startowego. Domyślnie: `true`.
- `suppressToolErrorWarnings`: gdy ma wartość true, wycisza ładunki ostrzeżeń o błędach narzędzi podczas uruchomień Heartbeat.
- `timeoutSeconds`: maksymalny czas w sekundach dozwolony dla tury agenta Heartbeat, zanim zostanie przerwana. Pozostaw nieustawione, aby użyć `agents.defaults.timeoutSeconds`.
- `directPolicy`: zasada dostarczania bezpośredniego/DM. `allow` (domyślnie) pozwala na dostarczanie do bezpośredniego celu. `block` wstrzymuje dostarczanie do bezpośredniego celu i emituje `reason=dm-blocked`.
- `lightContext`: gdy ma wartość true, uruchomienia Heartbeat używają lekkiego kontekstu startowego i zachowują tylko `HEARTBEAT.md` z plików startowych obszaru roboczego.
- `isolatedSession`: gdy ma wartość true, każde uruchomienie Heartbeat działa w świeżej sesji bez wcześniejszej historii rozmowy. Ten sam wzorzec izolacji co cron `sessionTarget: "isolated"`. Zmniejsza koszt tokenów na Heartbeat z ~100K do ~2-5K tokenów.
- `skipWhenBusy`: gdy ma wartość true, uruchomienia Heartbeat są odkładane także przy dodatkowych zajętych ścieżkach: pracy subagenta lub zagnieżdżonych poleceń. Ścieżki Cron zawsze odkładają Heartbeat, nawet bez tej flagi.
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

- `mode`: `default` albo `safeguard` (fragmentaryczne streszczanie długich historii). Zobacz [Compaction](/pl/concepts/compaction).
- `provider`: identyfikator zarejestrowanego Pluginu dostawcy Compaction. Gdy jest ustawiony, wywoływane jest `summarize()` dostawcy zamiast wbudowanego streszczania LLM. W razie niepowodzenia następuje powrót do wbudowanego mechanizmu. Ustawienie dostawcy wymusza `mode: "safeguard"`. Zobacz [Compaction](/pl/concepts/compaction).
- `timeoutSeconds`: maksymalna liczba sekund dozwolona dla pojedynczej operacji Compaction, zanim OpenClaw ją przerwie. Domyślnie: `900`.
- `keepRecentTokens`: budżet punktu odcięcia Pi na zachowanie najnowszego ogona transkrypcji w dosłownej postaci. Ręczne `/compact` honoruje to ustawienie, gdy jest jawnie ustawione; w przeciwnym razie ręczna Compaction jest twardym punktem kontrolnym.
- `identifierPolicy`: `strict` (domyślnie), `off` albo `custom`. `strict` dodaje na początku wbudowane wskazówki dotyczące zachowywania nieprzezroczystych identyfikatorów podczas streszczania Compaction.
- `identifierInstructions`: opcjonalny niestandardowy tekst zachowania identyfikatorów używany, gdy `identifierPolicy=custom`.
- `qualityGuard`: kontrole ponawiania przy zniekształconych danych wyjściowych dla podsumowań safeguard. Domyślnie włączone w trybie safeguard; ustaw `enabled: false`, aby pominąć audyt.
- `midTurnPrecheck`: opcjonalna kontrola presji pętli narzędzi Pi. Gdy `enabled: true`, OpenClaw sprawdza presję kontekstu po dołączeniu wyników narzędzi i przed następnym wywołaniem modelu. Jeśli kontekst już się nie mieści, przerywa bieżącą próbę przed przesłaniem promptu i ponownie używa istniejącej ścieżki odzyskiwania precheck, aby przyciąć wyniki narzędzi albo wykonać Compaction i ponowić. Działa zarówno z trybem Compaction `default`, jak i `safeguard`. Domyślnie: wyłączone.
- `postCompactionSections`: opcjonalne nazwy sekcji H2/H3 z AGENTS.md do ponownego wstrzyknięcia po Compaction. Domyślnie `["Session Startup", "Red Lines"]`; ustaw `[]`, aby wyłączyć ponowne wstrzykiwanie. Gdy nie ustawiono albo jawnie ustawiono tę domyślną parę, starsze nagłówki `Every Session`/`Safety` są też akceptowane jako starszy mechanizm awaryjny.
- `model`: opcjonalne nadpisanie `provider/model-id` tylko dla streszczania Compaction. Użyj tego, gdy główna sesja ma zachować jeden model, ale podsumowania Compaction mają działać na innym; gdy nie ustawiono, Compaction używa podstawowego modelu sesji.
- `maxActiveTranscriptBytes`: opcjonalny próg bajtów (`number` albo ciągi takie jak `"20mb"`), który wyzwala zwykłą lokalną Compaction przed uruchomieniem, gdy aktywny JSONL przekroczy próg. Wymaga `truncateAfterCompaction`, aby udana Compaction mogła wykonać rotację do mniejszej transkrypcji następczej. Wyłączone, gdy nie ustawiono albo ustawiono `0`.
- `notifyUser`: gdy `true`, wysyła użytkownikowi krótkie powiadomienia, gdy Compaction się zaczyna i gdy się kończy (na przykład „Kompaktowanie kontekstu...” i „Compaction zakończona”). Domyślnie wyłączone, aby Compaction pozostała cicha.
- `memoryFlush`: cicha agentowa tura przed automatyczną Compaction, aby zapisać trwałe wspomnienia. Ustaw `model` na dokładny model dostawcy, taki jak `ollama/qwen3:8b`, gdy ta tura porządkowa ma pozostać na modelu lokalnym; nadpisanie nie dziedziczy aktywnego łańcucha awaryjnego sesji. Pomijane, gdy obszar roboczy jest tylko do odczytu.

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

<Accordion title="Zachowanie trybu cache-ttl">

- `mode: "cache-ttl"` włącza przebiegi przycinania.
- `ttl` kontroluje, jak często przycinanie może zostać uruchomione ponownie (po ostatnim dotknięciu pamięci podręcznej).
- Przycinanie najpierw miękko przycina nadmiernie duże wyniki narzędzi, a potem, jeśli trzeba, twardo czyści starsze wyniki narzędzi.

**Miękkie przycięcie** zachowuje początek + koniec i wstawia `...` w środku.

**Twarde czyszczenie** zastępuje cały wynik narzędzia symbolem zastępczym.

Uwagi:

- Bloki obrazów nigdy nie są przycinane/czyszczone.
- Współczynniki są oparte na znakach (przybliżone), a nie na dokładnej liczbie tokenów.
- Jeśli istnieje mniej niż `keepLastAssistants` wiadomości asystenta, przycinanie jest pomijane.

</Accordion>

Szczegóły zachowania znajdziesz w [Przycinaniu sesji](/pl/concepts/session-pruning).

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

Szczegóły zachowania i dzielenia na fragmenty znajdziesz w [Strumieniowaniu](/pl/concepts/streaming).

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

- Domyślnie: `instant` dla czatów bezpośrednich/wzmianek, `message` dla czatów grupowych bez wzmianki.
- Nadpisania dla sesji: `session.typingMode`, `session.typingIntervalSeconds`.

Zobacz [Wskaźniki pisania](/pl/concepts/typing-indicators).

<a id="agentsdefaultssandbox"></a>

### `agents.defaults.sandbox`

Opcjonalna izolacja w piaskownicy dla osadzonego agenta. Pełny przewodnik znajdziesz w [Izolacja w piaskownicy](/pl/gateway/sandboxing).

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
- `identityData` / `certificateData` / `knownHostsData`: treści inline lub SecretRefs, które OpenClaw materializuje w plikach tymczasowych w czasie działania
- `strictHostKeyChecking` / `updateHostKeys`: pokrętła polityki kluczy hosta OpenSSH

**Kolejność pierwszeństwa uwierzytelniania SSH:**

- `identityData` ma pierwszeństwo przed `identityFile`
- `certificateData` ma pierwszeństwo przed `certificateFile`
- `knownHostsData` ma pierwszeństwo przed `knownHostsFile`
- Wartości `*Data` oparte na SecretRef są rozwiązywane z aktywnej migawki środowiska wykonawczego sekretów przed startem sesji piaskownicy

**Zachowanie backendu SSH:**

- zasila zdalną przestrzeń roboczą raz po utworzeniu lub ponownym utworzeniu
- następnie utrzymuje zdalną przestrzeń roboczą SSH jako kanoniczną
- kieruje `exec`, narzędzia plikowe i ścieżki mediów przez SSH
- nie synchronizuje automatycznie zdalnych zmian z powrotem do hosta
- nie obsługuje kontenerów przeglądarki w piaskownicy

**Dostęp do przestrzeni roboczej:**

- `none`: przestrzeń robocza piaskownicy według zakresu pod `~/.openclaw/sandboxes`
- `ro`: przestrzeń robocza piaskownicy w `/workspace`, przestrzeń robocza agenta zamontowana tylko do odczytu w `/agent`
- `rw`: przestrzeń robocza agenta zamontowana do odczytu/zapisu w `/workspace`

**Zakres:**

- `session`: kontener i przestrzeń robocza dla każdej sesji
- `agent`: jeden kontener i przestrzeń robocza na agenta (domyślnie)
- `shared`: współdzielony kontener i przestrzeń robocza (bez izolacji między sesjami)

**Konfiguracja Pluginu OpenShell:**

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

- `mirror`: zasila zdalną przestrzeń z lokalnej przed wykonaniem, synchronizuje z powrotem po wykonaniu; lokalna przestrzeń robocza pozostaje kanoniczna
- `remote`: zasila zdalną przestrzeń raz podczas tworzenia piaskownicy, następnie utrzymuje zdalną przestrzeń roboczą jako kanoniczną

W trybie `remote` lokalne edycje na hoście wykonane poza OpenClaw nie są automatycznie synchronizowane do piaskownicy po kroku zasilenia.
Transport odbywa się przez SSH do piaskownicy OpenShell, ale Plugin zarządza cyklem życia piaskownicy i opcjonalną synchronizacją mirror.

**`setupCommand`** uruchamia się raz po utworzeniu kontenera (przez `sh -lc`). Wymaga wyjścia do sieci, zapisywalnego katalogu głównego i użytkownika root.

**Kontenery domyślnie używają `network: "none"`** — ustaw `"bridge"` (lub niestandardową sieć bridge), jeśli agent potrzebuje dostępu wychodzącego.
`"host"` jest blokowane. `"container:<id>"` jest domyślnie blokowane, chyba że jawnie ustawisz
`sandbox.docker.dangerouslyAllowContainerNamespaceJoin: true` (tryb awaryjny).

**Załączniki przychodzące** są umieszczane w `media/inbound/*` w aktywnej przestrzeni roboczej.

**`docker.binds`** montuje dodatkowe katalogi hosta; powiązania globalne i przypisane do agenta są scalane.

**Przeglądarka w piaskownicy** (`sandbox.browser.enabled`): Chromium + CDP w kontenerze. Adres URL noVNC jest wstrzykiwany do promptu systemowego. Nie wymaga `browser.enabled` w `openclaw.json`.
Dostęp obserwatora noVNC domyślnie używa uwierzytelniania VNC, a OpenClaw emituje krótkotrwały adres URL z tokenem (zamiast ujawniać hasło we współdzielonym adresie URL).

- `allowHostControl: false` (domyślnie) blokuje sesjom w piaskownicy możliwość kierowania przeglądarką hosta.
- `network` domyślnie ma wartość `openclaw-sandbox-browser` (dedykowana sieć bridge). Ustaw `bridge` tylko wtedy, gdy jawnie chcesz globalną łączność bridge.
- `cdpSourceRange` opcjonalnie ogranicza ruch przychodzący CDP na krawędzi kontenera do zakresu CIDR (na przykład `172.21.0.1/32`).
- `sandbox.browser.binds` montuje dodatkowe katalogi hosta tylko w kontenerze przeglądarki piaskownicy. Gdy jest ustawione (w tym `[]`), zastępuje `docker.binds` dla kontenera przeglądarki.
- Domyślne ustawienia uruchamiania są zdefiniowane w `scripts/sandbox-browser-entrypoint.sh` i dostrojone dla hostów kontenerów:
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
  - `--disable-3d-apis`, `--disable-software-rasterizer` oraz `--disable-gpu` są
    domyślnie włączone i można je wyłączyć za pomocą
    `OPENCLAW_BROWSER_DISABLE_GRAPHICS_FLAGS=0`, jeśli wymaga tego użycie WebGL/3D.
  - `OPENCLAW_BROWSER_DISABLE_EXTENSIONS=0` ponownie włącza rozszerzenia, jeśli zależy od nich Twój przepływ pracy.
  - `--renderer-process-limit=2` można zmienić za pomocą
    `OPENCLAW_BROWSER_RENDERER_PROCESS_LIMIT=<N>`; ustaw `0`, aby użyć domyślnego
    limitu procesów Chromium.
  - plus `--no-sandbox`, gdy włączone jest `noSandbox`.
  - Wartości domyślne są bazą obrazu kontenera; użyj niestandardowego obrazu przeglądarki z niestandardowym
    punktem wejścia, aby zmienić domyślne ustawienia kontenera.

</Accordion>

Izolacja przeglądarki w piaskownicy i `sandbox.docker.binds` działają tylko z Dockerem.

Zbuduj obrazy (z checkoutu źródeł):

```bash
scripts/sandbox-setup.sh           # main sandbox image
scripts/sandbox-browser-setup.sh   # optional browser image
```

W przypadku instalacji npm bez checkoutu źródeł zobacz [Izolacja w piaskownicy § Obrazy i konfiguracja](/pl/gateway/sandboxing#images-and-setup), aby znaleźć inline polecenia `docker build`.

### `agents.list` (nadpisania dla agenta)

Użyj `agents.list[].tts`, aby nadać agentowi własnego dostawcę TTS, głos, model,
styl lub tryb automatycznego TTS. Blok agenta jest głęboko scalany z globalnym
`messages.tts`, dzięki czemu współdzielone dane uwierzytelniające mogą pozostać w jednym miejscu, a poszczególni
agenci nadpisują tylko potrzebne pola głosu lub dostawcy. Nadpisanie aktywnego agenta
ma zastosowanie do automatycznych odpowiedzi głosowych, `/tts audio`, `/tts status` oraz
narzędzia agenta `tts`. Zobacz [Text-to-speech](/pl/tools/tts#per-agent-voice-overrides),
aby poznać przykłady dostawców i kolejność pierwszeństwa.

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
- `default`: gdy ustawiono wiele, wygrywa pierwszy (rejestrowane jest ostrzeżenie). Jeśli nie ustawiono żadnego, domyślna jest pierwsza pozycja listy.
- `model`: forma ciągu tekstowego ustawia ścisły podstawowy model dla agenta bez fallbacku modelu; forma obiektowa `{ primary }` również jest ścisła, chyba że dodasz `fallbacks`. Użyj `{ primary, fallbacks: [...] }`, aby włączyć fallback dla tego agenta, albo `{ primary, fallbacks: [] }`, aby jawnie ustawić ścisłe zachowanie. Zadania Cron, które nadpisują tylko `primary`, nadal dziedziczą domyślne fallbacki, chyba że ustawisz `fallbacks: []`.
- `params`: parametry strumienia dla agenta scalane ponad wybranym wpisem modelu w `agents.defaults.models`. Użyj tego do nadpisań specyficznych dla agenta, takich jak `cacheRetention`, `temperature` lub `maxTokens`, bez duplikowania całego katalogu modeli.
- `tts`: opcjonalne nadpisania zamiany tekstu na mowę dla agenta. Blok jest głęboko scalany ponad `messages.tts`, więc współdzielone dane uwierzytelniające dostawcy i politykę fallbacku trzymaj w `messages.tts`, a tutaj ustawiaj tylko wartości specyficzne dla persony, takie jak dostawca, głos, model, styl lub tryb automatyczny.
- `skills`: opcjonalna allowlista Skills dla agenta. Jeśli pominięto, agent dziedziczy `agents.defaults.skills`, gdy jest ustawione; jawna lista zastępuje wartości domyślne zamiast ich scalania, a `[]` oznacza brak Skills.
- `thinkingDefault`: opcjonalny domyślny poziom myślenia dla agenta (`off | minimal | low | medium | high | xhigh | adaptive | max`). Nadpisuje `agents.defaults.thinkingDefault` dla tego agenta, gdy nie ustawiono nadpisania dla wiadomości ani sesji. Wybrany profil dostawcy/modelu kontroluje, które wartości są prawidłowe; dla Google Gemini `adaptive` zachowuje dynamiczne myślenie zarządzane przez dostawcę (`thinkingLevel` pominięte w Gemini 3/3.1, `thinkingBudget: -1` w Gemini 2.5).
- `reasoningDefault`: opcjonalna domyślna widoczność rozumowania dla agenta (`on | off | stream`). Nadpisuje `agents.defaults.reasoningDefault` dla tego agenta, gdy nie ustawiono nadpisania rozumowania dla wiadomości ani sesji.
- `fastModeDefault`: opcjonalna wartość domyślna trybu szybkiego dla agenta (`true | false`). Ma zastosowanie, gdy nie ustawiono nadpisania trybu szybkiego dla wiadomości ani sesji.
- `agentRuntime`: opcjonalne niskopoziomowe nadpisanie polityki środowiska uruchomieniowego dla agenta. Użyj `{ id: "codex" }`, aby jeden agent używał wyłącznie Codex, podczas gdy pozostali agenci zachowują domyślny fallback PI w trybie `auto`.
- `runtime`: opcjonalny deskryptor środowiska uruchomieniowego dla agenta. Użyj `type: "acp"` z wartościami domyślnymi `runtime.acp` (`agent`, `backend`, `mode`, `cwd`), gdy agent ma domyślnie używać sesji uprzęży ACP.
- `identity.avatar`: ścieżka względna względem obszaru roboczego, URL `http(s)` albo URI `data:`.
- `identity` wyprowadza wartości domyślne: `ackReaction` z `emoji`, `mentionPatterns` z `name`/`emoji`.
- `subagents.allowAgents`: allowlista identyfikatorów agentów dla jawnych celów `sessions_spawn.agentId` (`["*"]` = dowolny; domyślnie: tylko ten sam agent). Uwzględnij identyfikator żądającego, gdy samocelujące wywołania `agentId` mają być dozwolone.
- Strażnik dziedziczenia sandboxa: jeśli sesja żądającego działa w sandboxie, `sessions_spawn` odrzuca cele, które działałyby bez sandboxa.
- `subagents.requireAgentId`: gdy ustawione na true, blokuje wywołania `sessions_spawn`, które pomijają `agentId` (wymusza jawny wybór profilu; domyślnie: false).

---

## Routing wielu agentów

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

- `type` (opcjonalne): `route` dla zwykłego routingu (brakujący typ domyślnie oznacza route), `acp` dla trwałych powiązań konwersacji ACP.
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
6. Agent domyślny

W każdej warstwie wygrywa pierwszy pasujący wpis `bindings`.

Dla wpisów `type: "acp"` OpenClaw rozwiązuje według dokładnej tożsamości konwersacji (`match.channel` + konto + `match.peer.id`) i nie używa powyższej kolejności warstw powiązań routingu.

### Profile dostępu dla agentów

<Accordion title="Pełny dostęp (bez sandboxa)">

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

<Accordion title="Narzędzia tylko do odczytu + obszar roboczy">

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

Zobacz [Piaskownica i narzędzia dla wielu agentów](/pl/tools/multi-agent-sandbox-tools), aby poznać szczegóły pierwszeństwa.

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

<Accordion title="Session field details">

- **`scope`**: bazowa strategia grupowania sesji dla kontekstów czatu grupowego.
  - `per-sender` (domyślnie): każdy nadawca otrzymuje izolowaną sesję w kontekście kanału.
  - `global`: wszyscy uczestnicy w kontekście kanału współdzielą jedną sesję (używaj tylko wtedy, gdy współdzielony kontekst jest zamierzony).
- **`dmScope`**: sposób grupowania wiadomości prywatnych.
  - `main`: wszystkie wiadomości prywatne współdzielą główną sesję.
  - `per-peer`: izoluje według identyfikatora nadawcy między kanałami.
  - `per-channel-peer`: izoluje według kanału + nadawcy (zalecane dla skrzynek odbiorczych wielu użytkowników).
  - `per-account-channel-peer`: izoluje według konta + kanału + nadawcy (zalecane dla wielu kont).
- **`identityLinks`**: mapuje kanoniczne identyfikatory na użytkowników z prefiksem dostawcy w celu współdzielenia sesji między kanałami. Polecenia dock, takie jak `/dock_discord`, używają tej samej mapy, aby przełączyć trasę odpowiedzi aktywnej sesji na innego powiązanego użytkownika kanału; zobacz [dokowanie kanałów](/pl/concepts/channel-docking).
- **`reset`**: główna polityka resetowania. `daily` resetuje o lokalnej godzinie `atHour`; `idle` resetuje po `idleMinutes`. Gdy skonfigurowano oba warianty, wygrywa ten, który wygaśnie pierwszy. Świeżość resetu dziennego używa pola `sessionStartedAt` w wierszu sesji; świeżość resetu bezczynności używa `lastInteractionAt`. Zapisy w tle/zdarzenia systemowe, takie jak Heartbeat, wybudzenia Cron, powiadomienia `exec` i księgowanie Gateway, mogą aktualizować `updatedAt`, ale nie utrzymują świeżości sesji dziennych/bezczynnych.
- **`resetByType`**: nadpisania dla poszczególnych typów (`direct`, `group`, `thread`). Starsze `dm` jest akceptowane jako alias dla `direct`.
- **`mainKey`**: starsze pole. Środowisko uruchomieniowe zawsze używa `"main"` dla głównego zasobnika czatu bezpośredniego.
- **`agentToAgent.maxPingPongTurns`**: maksymalna liczba tur odpowiedzi między agentami podczas wymian agent-agent (liczba całkowita, zakres: `0`–`5`). `0` wyłącza łańcuch ping-pong.
- **`sendPolicy`**: dopasowanie według `channel`, `chatType` (`direct|group|channel`, ze starszym aliasem `dm`), `keyPrefix` lub `rawKeyPrefix`. Pierwsza odmowa wygrywa.
- **`maintenance`**: czyszczenie magazynu sesji + kontrola retencji.
  - `mode`: `warn` tylko emituje ostrzeżenia; `enforce` stosuje czyszczenie.
  - `pruneAfter`: granica wieku dla nieaktualnych wpisów (domyślnie `30d`).
  - `maxEntries`: maksymalna liczba wpisów w `sessions.json` (domyślnie `500`). Środowisko uruchomieniowe zapisuje czyszczenie wsadowe z małym buforem wysokiego poziomu dla limitów produkcyjnych; `openclaw sessions cleanup --enforce` stosuje limit natychmiast.
  - `rotateBytes`: przestarzałe i ignorowane; `openclaw doctor --fix` usuwa je ze starszych konfiguracji.
  - `resetArchiveRetention`: retencja archiwów transkrypcji `*.reset.<timestamp>`. Domyślnie używa `pruneAfter`; ustaw `false`, aby wyłączyć.
  - `maxDiskBytes`: opcjonalny budżet dyskowy katalogu sesji. W trybie `warn` zapisuje ostrzeżenia; w trybie `enforce` usuwa najpierw najstarsze artefakty/sesje.
  - `highWaterBytes`: opcjonalny cel po czyszczeniu budżetu. Domyślnie `80%` z `maxDiskBytes`.
- **`threadBindings`**: globalne wartości domyślne dla funkcji sesji powiązanych z wątkiem.
  - `enabled`: główny przełącznik domyślny (dostawcy mogą nadpisać; Discord używa `channels.discord.threadBindings.enabled`)
  - `idleHours`: domyślne automatyczne usuwanie fokusu po bezczynności w godzinach (`0` wyłącza; dostawcy mogą nadpisać)
  - `maxAgeHours`: domyślny twardy maksymalny wiek w godzinach (`0` wyłącza; dostawcy mogą nadpisać)
  - `spawnSessions`: domyślna bramka tworzenia sesji roboczych powiązanych z wątkiem z `sessions_spawn` i uruchomień wątku ACP. Domyślnie `true`, gdy powiązania wątków są włączone; dostawcy/konta mogą nadpisać.
  - `defaultSpawnContext`: domyślny natywny kontekst podagenta dla uruchomień powiązanych z wątkiem (`"fork"` albo `"isolated"`). Domyślnie `"fork"`.

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

Zastąpienia dla kanału/konta: `channels.<channel>.responsePrefix`, `channels.<channel>.accounts.<id>.responsePrefix`.

Rozstrzyganie (najbardziej szczegółowe wygrywa): konto → kanał → globalne. `""` wyłącza i zatrzymuje kaskadę. `"auto"` wyprowadza `[{identity.name}]`.

**Zmienne szablonu:**

| Zmienna           | Opis                       | Przykład                    |
| ----------------- | -------------------------- | --------------------------- |
| `{model}`         | Krótka nazwa modelu        | `claude-opus-4-6`           |
| `{modelFull}`     | Pełny identyfikator modelu | `anthropic/claude-opus-4-6` |
| `{provider}`      | Nazwa dostawcy             | `anthropic`                 |
| `{thinkingLevel}` | Bieżący poziom myślenia    | `high`, `low`, `off`        |
| `{identity.name}` | Nazwa tożsamości agenta    | (tak samo jak `"auto"`)     |

Wielkość liter w zmiennych nie ma znaczenia. `{think}` jest aliasem dla `{thinkingLevel}`.

### Reakcja potwierdzenia

- Domyślnie używa `identity.emoji` aktywnego agenta, w przeciwnym razie `"👀"`. Ustaw `""`, aby wyłączyć.
- Zastąpienia dla kanału: `channels.<channel>.ackReaction`, `channels.<channel>.accounts.<id>.ackReaction`.
- Kolejność rozstrzygania: konto → kanał → `messages.ackReaction` → wartość awaryjna tożsamości.
- Zakres: `group-mentions` (domyślnie), `group-all`, `direct`, `all`.
- `removeAckAfterReply`: usuwa potwierdzenie po odpowiedzi w kanałach obsługujących reakcje, takich jak Slack, Discord, Telegram, WhatsApp i BlueBubbles.
- `messages.statusReactions.enabled`: włącza reakcje statusu cyklu życia w Slack, Discord i Telegram.
  W Slack i Discord brak ustawienia zachowuje włączone reakcje statusu, gdy reakcje potwierdzenia są aktywne.
  W Telegram ustaw tę opcję jawnie na `true`, aby włączyć reakcje statusu cyklu życia.

### Debounce przychodzących wiadomości

Łączy szybko następujące po sobie wiadomości zawierające tylko tekst od tego samego nadawcy w jedną turę agenta. Multimedia/załączniki wymuszają natychmiastowe wysłanie. Polecenia sterujące omijają debounce.

### TTS (tekst na mowę)

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

- `auto` steruje domyślnym trybem automatycznego TTS: `off`, `always`, `inbound` albo `tagged`. `/tts on|off` może zastąpić lokalne preferencje, a `/tts status` pokazuje stan wynikowy.
- `summaryModel` zastępuje `agents.defaults.model.primary` dla automatycznego podsumowania.
- `modelOverrides` jest domyślnie włączone; `modelOverrides.allowProvider` ma domyślnie wartość `false` (wymaga włączenia).
- Klucze API korzystają awaryjnie z `ELEVENLABS_API_KEY`/`XI_API_KEY` oraz `OPENAI_API_KEY`.
- Dołączone dostawcy mowy są własnością Plugin. Jeśli ustawiono `plugins.allow`, uwzględnij każdy Plugin dostawcy TTS, którego chcesz używać, na przykład `microsoft` dla Edge TTS. Starszy identyfikator dostawcy `edge` jest akceptowany jako alias dla `microsoft`.
- `providers.openai.baseUrl` zastępuje punkt końcowy OpenAI TTS. Kolejność rozstrzygania to konfiguracja, następnie `OPENAI_TTS_BASE_URL`, następnie `https://api.openai.com/v1`.
- Gdy `providers.openai.baseUrl` wskazuje punkt końcowy inny niż OpenAI, OpenClaw traktuje go jako serwer TTS zgodny z OpenAI i rozluźnia walidację modelu/głosu.

---

## Talk

Domyślne wartości dla trybu Talk (macOS/iOS/Android).

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
    realtime: {
      provider: "openai",
      providers: {
        openai: {
          model: "gpt-realtime",
          voice: "alloy",
        },
      },
      mode: "realtime",
      transport: "webrtc",
      brain: "agent-consult",
    },
  },
}
```

- `talk.provider` musi pasować do klucza w `talk.providers`, gdy skonfigurowano wielu dostawców Talk.
- Starsze płaskie klucze Talk (`talk.voiceId`, `talk.voiceAliases`, `talk.modelId`, `talk.outputFormat`, `talk.apiKey`) służą tylko do zgodności. Uruchom `openclaw doctor --fix`, aby przepisać zapisaną konfigurację do `talk.providers.<provider>`.
- Identyfikatory głosów korzystają awaryjnie z `ELEVENLABS_VOICE_ID` lub `SAG_VOICE_ID`.
- `providers.*.apiKey` przyjmuje jawne ciągi tekstowe lub obiekty SecretRef.
- Wartość awaryjna `ELEVENLABS_API_KEY` ma zastosowanie tylko wtedy, gdy nie skonfigurowano klucza API Talk.
- `providers.*.voiceAliases` pozwala dyrektywom Talk używać przyjaznych nazw.
- `providers.mlx.modelId` wybiera repozytorium Hugging Face używane przez lokalnego pomocnika MLX w macOS. Jeśli pominięto, macOS używa `mlx-community/Soprano-80M-bf16`.
- Odtwarzanie MLX w macOS działa przez dołączonego pomocnika `openclaw-mlx-tts`, gdy jest obecny, albo przez plik wykonywalny w `PATH`; `OPENCLAW_MLX_TTS_BIN` zastępuje ścieżkę pomocnika na potrzeby developmentu.
- `speechLocale` ustawia identyfikator lokalizacji BCP 47 używany przez rozpoznawanie mowy Talk w iOS/macOS. Pozostaw bez ustawienia, aby użyć domyślnej wartości urządzenia.
- `silenceTimeoutMs` steruje tym, jak długo tryb Talk czeka po ciszy użytkownika, zanim wyśle transkrypcję. Brak ustawienia zachowuje domyślne okno pauzy platformy (`700 ms on macOS and Android, 900 ms on iOS`).

---

## Powiązane

- [Dokumentacja konfiguracji](/pl/gateway/configuration-reference) — wszystkie pozostałe klucze konfiguracji
- [Konfiguracja](/pl/gateway/configuration) — typowe zadania i szybka konfiguracja
- [Przykłady konfiguracji](/pl/gateway/configuration-examples)
