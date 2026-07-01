---
read_when:
    - Dostrajanie ustawień domyślnych agentów (modele, myślenie, obszar roboczy, heartbeat, media, skills)
    - Konfigurowanie routingu i powiązań wielu agentów
    - Dostosowywanie zachowania sesji, dostarczania wiadomości i trybu rozmowy
summary: Domyślne ustawienia agenta, routing wieloagentowy, sesja, wiadomości i konfiguracja rozmowy
title: Konfiguracja — agenci
x-i18n:
    generated_at: "2026-07-01T13:24:20Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: e73e82e78ea597919a304e5bb4966221c805d2ddd48e1d37b2bf06eb60aaf5c8
    source_path: gateway/config-agents.md
    workflow: 16
---

Klucze konfiguracji o zakresie agenta pod `agents.*`, `multiAgent.*`, `session.*`,
`messages.*` i `talk.*`. Informacje o kanałach, narzędziach, środowisku wykonawczym Gateway i innych
kluczach najwyższego poziomu znajdziesz w [Dokumentacji konfiguracji](/pl/gateway/configuration-reference).

## Domyślne ustawienia agentów

### `agents.defaults.workspace`

Domyślnie: `OPENCLAW_WORKSPACE_DIR`, gdy jest ustawione, w przeciwnym razie `~/.openclaw/workspace`.

```json5
{
  agents: { defaults: { workspace: "~/.openclaw/workspace" } },
}
```

Jawna wartość `agents.defaults.workspace` ma pierwszeństwo przed
`OPENCLAW_WORKSPACE_DIR`. Użyj zmiennej środowiskowej, aby skierować domyślne agenty
do zamontowanego obszaru roboczego, gdy nie chcesz zapisywać tej ścieżki w konfiguracji.

### `agents.defaults.repoRoot`

Opcjonalny katalog główny repozytorium wyświetlany w wierszu Runtime promptu systemowego. Jeśli nie jest ustawiony, OpenClaw wykrywa go automatycznie, idąc w górę od obszaru roboczego.

```json5
{
  agents: { defaults: { repoRoot: "~/Projects/openclaw" } },
}
```

### `agents.defaults.skills`

Opcjonalna domyślna lista dozwolonych skill dla agentów, które nie ustawiają
`agents.list[].skills`.

```json5
{
  agents: {
    defaults: { skills: ["github", "weather"] },
    list: [
      { id: "writer" }, // dziedziczy github, weather
      { id: "docs", skills: ["docs-search"] }, // zastępuje wartości domyślne
      { id: "locked-down", skills: [] }, // bez skills
    ],
  },
}
```

- Pomiń `agents.defaults.skills`, aby domyślnie zezwolić na nieograniczone skills.
- Pomiń `agents.list[].skills`, aby odziedziczyć wartości domyślne.
- Ustaw `agents.list[].skills: []`, aby wyłączyć skills.
- Niepusta lista `agents.list[].skills` jest ostatecznym zestawem dla tego agenta; nie
  scala się z wartościami domyślnymi.

### `agents.defaults.skipBootstrap`

Wyłącza automatyczne tworzenie plików startowych obszaru roboczego (`AGENTS.md`, `SOUL.md`, `TOOLS.md`, `IDENTITY.md`, `USER.md`, `HEARTBEAT.md`, `BOOTSTRAP.md`).

```json5
{
  agents: { defaults: { skipBootstrap: true } },
}
```

### `agents.defaults.skipOptionalBootstrapFiles`

Pomija tworzenie wybranych opcjonalnych plików obszaru roboczego, nadal zapisując wymagane pliki startowe. Prawidłowe wartości: `SOUL.md`, `USER.md`, `HEARTBEAT.md` i `IDENTITY.md`.

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

Kontroluje, kiedy pliki startowe obszaru roboczego są wstrzykiwane do promptu systemowego. Domyślnie: `"always"`.

- `"continuation-skip"`: bezpieczne tury kontynuacji (po ukończonej odpowiedzi asystenta) pomijają ponowne wstrzyknięcie plików startowych obszaru roboczego, zmniejszając rozmiar promptu. Uruchomienia Heartbeat i ponowienia po Compaction nadal odbudowują kontekst.
- `"never"`: wyłącza wstrzykiwanie plików startowych obszaru roboczego i plików kontekstowych w każdej turze. Używaj tego tylko dla agentów, które w pełni zarządzają cyklem życia swojego promptu (niestandardowe silniki kontekstu, natywne środowiska wykonawcze budujące własny kontekst lub wyspecjalizowane przepływy pracy bez bootstrapu). Tury Heartbeat i odzyskiwania po Compaction także pomijają wstrzykiwanie.

```json5
{
  agents: { defaults: { contextInjection: "continuation-skip" } },
}
```

Nadpisanie dla agenta: `agents.list[].contextInjection`. Pominięte wartości dziedziczą
`agents.defaults.contextInjection`.

### `agents.defaults.bootstrapMaxChars`

Maksymalna liczba znaków na plik startowy obszaru roboczego przed obcięciem. Domyślnie: `20000`.

```json5
{
  agents: { defaults: { bootstrapMaxChars: 20000 } },
}
```

Nadpisanie dla agenta: `agents.list[].bootstrapMaxChars`. Pominięte wartości dziedziczą
`agents.defaults.bootstrapMaxChars`.

### `agents.defaults.bootstrapTotalMaxChars`

Maksymalna łączna liczba znaków wstrzykiwanych ze wszystkich plików startowych obszaru roboczego. Domyślnie: `60000`.

```json5
{
  agents: { defaults: { bootstrapTotalMaxChars: 60000 } },
}
```

Nadpisanie dla agenta: `agents.list[].bootstrapTotalMaxChars`. Pominięte wartości
dziedziczą `agents.defaults.bootstrapTotalMaxChars`.

### Nadpisania profilu bootstrapu dla agenta

Użyj nadpisań profilu bootstrapu dla agenta, gdy jeden agent potrzebuje innego zachowania
wstrzykiwania promptu niż współdzielone wartości domyślne. Pominięte pola dziedziczą po
`agents.defaults`.

```json5
{
  agents: {
    defaults: {
      contextInjection: "continuation-skip",
      bootstrapMaxChars: 20000,
      bootstrapTotalMaxChars: 60000,
    },
    list: [
      {
        id: "strict-worker",
        contextInjection: "always",
        bootstrapMaxChars: 50000,
        bootstrapTotalMaxChars: 300000,
      },
    ],
  },
}
```

### `agents.defaults.bootstrapPromptTruncationWarning`

Kontroluje widoczne dla agenta powiadomienie w prompcie systemowym, gdy kontekst bootstrapu zostanie obcięty.
Domyślnie: `"always"`.

- `"off"`: nigdy nie wstrzykuj tekstu powiadomienia o obcięciu do promptu systemowego.
- `"once"`: wstrzyknij zwięzłe powiadomienie raz dla każdej unikalnej sygnatury obcięcia.
- `"always"`: wstrzykuj zwięzłe powiadomienie przy każdym uruchomieniu, gdy istnieje obcięcie (zalecane).

Szczegółowe liczby surowe/wstrzyknięte i pola dostrajania konfiguracji pozostają w diagnostyce, takiej
jak raporty stanu/kontekstu i logi; rutynowy kontekst użytkownika/środowiska wykonawczego WebChat otrzymuje tylko
zwięzłe powiadomienie odzyskiwania.

```json5
{
  agents: { defaults: { bootstrapPromptTruncationWarning: "always" } }, // off | once | always
}
```

### Mapa własności budżetu kontekstu

OpenClaw ma wiele wysokowolumenowych budżetów promptu/kontekstu i są one
celowo podzielone według podsystemów, zamiast przechodzić przez jedno ogólne
pokrętło.

- `agents.defaults.bootstrapMaxChars` /
  `agents.defaults.bootstrapTotalMaxChars`:
  zwykłe wstrzykiwanie bootstrapu obszaru roboczego.
- `agents.defaults.startupContext.*`:
  jednorazowy prelude uruchomienia modelu po resecie/starcie, obejmujący ostatnie dzienne
  pliki `memory/*.md`. Surowe polecenia czatu `/new` i `/reset` są
  potwierdzane bez wywoływania modelu.
- `skills.limits.*`:
  zwarta lista skills wstrzykiwana do promptu systemowego.
- `agents.defaults.contextLimits.*`:
  ograniczone wycinki środowiska wykonawczego i wstrzyknięte bloki należące do środowiska wykonawczego.
- `memory.qmd.limits.*`:
  rozmiarowanie fragmentu indeksowanego wyszukiwania pamięci i wstrzykiwania.

Użyj odpowiedniego nadpisania dla agenta tylko wtedy, gdy jeden agent potrzebuje innego
budżetu:

- `agents.list[].skillsLimits.maxSkillsPromptChars`
- `agents.list[].contextInjection`
- `agents.list[].bootstrapMaxChars`
- `agents.list[].bootstrapTotalMaxChars`
- `agents.list[].contextLimits.*`

#### `agents.defaults.startupContext`

Kontroluje prelude startowy pierwszej tury wstrzykiwany przy uruchomieniach modelu po resecie/starcie.
Surowe polecenia czatu `/new` i `/reset` potwierdzają reset bez wywoływania
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

Współdzielone wartości domyślne dla ograniczonych powierzchni kontekstu środowiska wykonawczego.

```json5
{
  agents: {
    defaults: {
      contextLimits: {
        memoryGetMaxChars: 12000,
        memoryGetDefaultLines: 120,
        postCompactionMaxChars: 1800,
      },
    },
  },
}
```

- `memoryGetMaxChars`: domyślny limit wycinka `memory_get` przed dodaniem
  metadanych obcięcia i powiadomienia o kontynuacji.
- `memoryGetDefaultLines`: domyślne okno linii `memory_get`, gdy `lines` jest
  pominięte.
- `toolResultMaxChars`: zaawansowany sufit wyników narzędzi live używany dla utrwalonych
  wyników i odzyskiwania po przepełnieniu. Pozostaw nieustawione, aby użyć automatycznego limitu kontekstu modelu:
  `16000` znaków poniżej 100K tokenów, `32000` znaków przy 100K+ tokenach i `64000`
  znaków przy 200K+ tokenach. Jawne wartości do `1000000` są akceptowane dla
  modeli z długim kontekstem, ale efektywny limit nadal jest ograniczony do około 30%
  okna kontekstu modelu. `openclaw doctor --deep` wypisuje efektywny limit,
  a doctor ostrzega tylko wtedy, gdy jawne nadpisanie jest nieaktualne lub nie ma efektu.
- `postCompactionMaxChars`: limit wycinka AGENTS.md używany podczas wstrzykiwania
  odświeżenia po Compaction.

#### `agents.list[].contextLimits`

Nadpisanie dla agenta dla współdzielonych pokręteł `contextLimits`. Pominięte pola dziedziczą
po `agents.defaults.contextLimits`.

```json5
{
  agents: {
    defaults: {
      contextLimits: {
        memoryGetMaxChars: 12000,
      },
    },
    list: [
      {
        id: "tiny-local",
        contextLimits: {
          memoryGetMaxChars: 6000,
          toolResultMaxChars: 8000, // zaawansowany sufit dla tego agenta
        },
      },
    ],
  },
}
```

#### `skills.limits.maxSkillsPromptChars`

Globalny limit zwartej listy skills wstrzykiwanej do promptu systemowego. Nie
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

Nadpisanie dla agenta dla budżetu promptu skills.

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

Maksymalny rozmiar w pikselach najdłuższego boku obrazu w blokach obrazu transkryptu/narzędzi przed wywołaniami providera.
Domyślnie: `1200`.

Niższe wartości zwykle zmniejszają użycie tokenów wizyjnych i rozmiar ładunku żądania przy uruchomieniach z dużą liczbą zrzutów ekranu.
Wyższe wartości zachowują więcej szczegółów wizualnych.

```json5
{
  agents: { defaults: { imageMaxDimensionPx: 1200 } },
}
```

### `agents.defaults.imageQuality`

Preferencja kompresji/szczegółowości narzędzia obrazów dla obrazów ładowanych ze ścieżek plików, URL-i i odwołań do mediów.
Domyślnie: `auto`.

OpenClaw dostosowuje drabinkę zmiany rozmiaru do wybranego modelu obrazów. Na przykład Claude Opus 4.8, OpenAI GPT-5.5, Qwen VL i hostowane modele wizyjne Llama 4 mogą używać większych obrazów niż starsze/domyślne ścieżki wizyjne wysokiej szczegółowości, podczas gdy tury z wieloma obrazami są kompresowane bardziej agresywnie w trybie `auto`, aby kontrolować koszt tokenów i opóźnienie.

Wartości:

- `auto`: dostosuj do limitów modelu i liczby obrazów.
- `efficient`: preferuj mniejsze obrazy dla niższego użycia tokenów i bajtów.
- `balanced`: użyj standardowej drabinki pośredniej.
- `high`: zachowaj więcej szczegółów dla zrzutów ekranu, diagramów i obrazów dokumentów.

```json5
{
  agents: { defaults: { imageQuality: "auto" } },
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
      params: { cacheRetention: "long" }, // globalne domyślne parametry providera
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
  - Forma ciągu znaków ustawia tylko model główny.
  - Forma obiektu ustawia model główny oraz uporządkowane modele przełączania awaryjnego.
- `imageModel`: akceptuje ciąg znaków (`"provider/model"`) albo obiekt (`{ primary, fallbacks }`).
  - Używany przez ścieżkę narzędzia `image` jako konfiguracja modelu wizyjnego.
  - Używany także jako routing awaryjny, gdy wybrany/domyślny model nie może przyjąć wejścia obrazowego.
  - Preferuj jawne odwołania `provider/model`. Gołe identyfikatory są akceptowane dla zgodności; jeśli goły identyfikator jednoznacznie pasuje do skonfigurowanej pozycji obsługującej obrazy w `models.providers.*.models`, OpenClaw kwalifikuje go do tego dostawcy. Niejednoznaczne skonfigurowane dopasowania wymagają jawnego prefiksu dostawcy.
- `imageGenerationModel`: akceptuje ciąg znaków (`"provider/model"`) albo obiekt (`{ primary, fallbacks }`).
  - Używany przez współdzieloną funkcję generowania obrazów oraz każdą przyszłą powierzchnię narzędzia/pluginu, która generuje obrazy.
  - Typowe wartości: `google/gemini-3.1-flash-image-preview` dla natywnego generowania obrazów Gemini, `fal/fal-ai/flux/dev` dla fal, `openai/gpt-image-2` dla OpenAI Images albo `openai/gpt-image-1.5` dla wyjścia PNG/WebP OpenAI z przezroczystym tłem.
  - Jeśli wybierasz dostawcę/model bezpośrednio, skonfiguruj także pasujące uwierzytelnianie dostawcy (na przykład `GEMINI_API_KEY` lub `GOOGLE_API_KEY` dla `google/*`, `OPENAI_API_KEY` lub OpenAI Codex OAuth dla `openai/gpt-image-2` / `openai/gpt-image-1.5`, `FAL_KEY` dla `fal/*`).
  - Jeśli pominięto, `image_generate` nadal może wywnioskować domyślnego dostawcę wspieranego uwierzytelnianiem. Najpierw próbuje bieżącego domyślnego dostawcy, a potem pozostałych zarejestrowanych dostawców generowania obrazów w kolejności identyfikatorów dostawców.
- `musicGenerationModel`: akceptuje ciąg znaków (`"provider/model"`) albo obiekt (`{ primary, fallbacks }`).
  - Używany przez współdzieloną funkcję generowania muzyki oraz wbudowane narzędzie `music_generate`.
  - Typowe wartości: `google/lyria-3-clip-preview`, `google/lyria-3-pro-preview` albo `minimax/music-2.6`.
  - Jeśli pominięto, `music_generate` nadal może wywnioskować domyślnego dostawcę wspieranego uwierzytelnianiem. Najpierw próbuje bieżącego domyślnego dostawcy, a potem pozostałych zarejestrowanych dostawców generowania muzyki w kolejności identyfikatorów dostawców.
  - Jeśli wybierasz dostawcę/model bezpośrednio, skonfiguruj także pasujące uwierzytelnianie dostawcy/klucz API.
- `videoGenerationModel`: akceptuje ciąg znaków (`"provider/model"`) albo obiekt (`{ primary, fallbacks }`).
  - Używany przez współdzieloną funkcję generowania wideo oraz wbudowane narzędzie `video_generate`.
  - Typowe wartości: `qwen/wan2.6-t2v`, `qwen/wan2.6-i2v`, `qwen/wan2.6-r2v`, `qwen/wan2.6-r2v-flash` albo `qwen/wan2.7-r2v`.
  - Jeśli pominięto, `video_generate` nadal może wywnioskować domyślnego dostawcę wspieranego uwierzytelnianiem. Najpierw próbuje bieżącego domyślnego dostawcy, a potem pozostałych zarejestrowanych dostawców generowania wideo w kolejności identyfikatorów dostawców.
  - Jeśli wybierasz dostawcę/model bezpośrednio, skonfiguruj także pasujące uwierzytelnianie dostawcy/klucz API.
  - Oficjalny Plugin generowania wideo Qwen obsługuje do 1 wyjściowego wideo, 1 obrazu wejściowego, 4 wideo wejściowych, czas trwania 10 sekund oraz opcje na poziomie dostawcy `size`, `aspectRatio`, `resolution`, `audio` i `watermark`.
- `pdfModel`: akceptuje ciąg znaków (`"provider/model"`) albo obiekt (`{ primary, fallbacks }`).
  - Używany przez narzędzie `pdf` do routingu modeli.
  - Jeśli pominięto, narzędzie PDF przechodzi awaryjnie do `imageModel`, a następnie do rozwiązanego modelu sesji/domyślnego.
- `pdfMaxBytesMb`: domyślny limit rozmiaru PDF dla narzędzia `pdf`, gdy `maxBytesMb` nie zostanie przekazane w czasie wywołania.
- `pdfMaxPages`: domyślna maksymalna liczba stron uwzględnianych przez awaryjny tryb ekstrakcji w narzędziu `pdf`.
- `verboseDefault`: domyślny poziom szczegółowości dla agentów. Wartości: `"off"`, `"on"`, `"full"`. Domyślnie: `"off"`.
- `toolProgressDetail`: tryb szczegółowości dla podsumowań narzędzi `/verbose` i szkicowych linii postępu narzędzi. Wartości: `"explain"` (domyślnie, zwięzłe etykiety zrozumiałe dla człowieka) albo `"raw"` (dołącz surowe polecenie/szczegół, gdy jest dostępny). `agents.list[].toolProgressDetail` na poziomie agenta zastępuje tę wartość domyślną.
- `reasoningDefault`: domyślna widoczność rozumowania dla agentów. Wartości: `"off"`, `"on"`, `"stream"`. `agents.list[].reasoningDefault` na poziomie agenta zastępuje tę wartość domyślną. Skonfigurowane wartości domyślne rozumowania są stosowane tylko dla właścicieli, autoryzowanych nadawców albo kontekstów Gateway administratora-operatora, gdy nie ustawiono nadpisania rozumowania dla wiadomości lub sesji.
- `elevatedDefault`: domyślny poziom wyjścia podwyższonego dla agentów. Wartości: `"off"`, `"on"`, `"ask"`, `"full"`. Domyślnie: `"on"`.
- `model.primary`: format `provider/model` (np. `openai/gpt-5.5` dla dostępu przez klucz API OpenAI albo Codex OAuth). Jeśli pominiesz dostawcę, OpenClaw najpierw próbuje aliasu, potem unikalnego dopasowania skonfigurowanego dostawcy dla dokładnie tego identyfikatora modelu, a dopiero potem przechodzi awaryjnie do skonfigurowanego domyślnego dostawcy (przestarzałe zachowanie zgodności, więc preferuj jawne `provider/model`). Jeśli ten dostawca nie udostępnia już skonfigurowanego modelu domyślnego, OpenClaw przechodzi awaryjnie do pierwszego skonfigurowanego dostawcy/modelu zamiast ujawniać nieaktualny domyślny model usuniętego dostawcy.
- `models`: skonfigurowany katalog modeli i lista dozwolonych dla `/model`. Każda pozycja może zawierać `alias` (skrót) oraz `params` (specyficzne dla dostawcy, na przykład `temperature`, `maxTokens`, `cacheRetention`, `context1m`, `responsesServerCompaction`, `responsesCompactThreshold`, routing OpenRouter `provider`, `chat_template_kwargs`, `extra_body`/`extraBody`).
  - Użyj pozycji `provider/*`, takich jak `"openai/*": {}` albo `"vllm/*": {}`, aby pokazać wszystkie wykryte modele dla wybranych dostawców bez ręcznego wymieniania każdego identyfikatora modelu.
  - Dodaj `agentRuntime` do pozycji `provider/*`, gdy każdy dynamicznie wykryty model dla tego dostawcy powinien używać tego samego środowiska uruchomieniowego. Dokładna polityka środowiska uruchomieniowego `provider/model` nadal ma pierwszeństwo przed symbolem wieloznacznym.
  - Bezpieczne edycje: użyj `openclaw config set agents.defaults.models '<json>' --strict-json --merge`, aby dodać pozycje. `config set` odmawia zastąpień, które usunęłyby istniejące pozycje listy dozwolonych, chyba że przekażesz `--replace`.
  - Przepływy konfiguracji/wdrożenia zakresowane do dostawcy scalają wybrane modele dostawcy z tą mapą i zachowują już skonfigurowanych niepowiązanych dostawców.
  - Dla bezpośrednich modeli OpenAI Responses Compaction po stronie serwera jest włączana automatycznie. Użyj `params.responsesServerCompaction: false`, aby przestać wstrzykiwać `context_management`, albo `params.responsesCompactThreshold`, aby nadpisać próg. Zobacz [Compaction po stronie serwera OpenAI](/pl/providers/openai#server-side-compaction-responses-api).
- `params`: globalne domyślne parametry dostawcy stosowane do wszystkich modeli. Ustawiane w `agents.defaults.params` (np. `{ cacheRetention: "long" }`).
- Pierwszeństwo scalania `params` (konfiguracja): `agents.defaults.params` (globalna baza) jest zastępowane przez `agents.defaults.models["provider/model"].params` (dla modelu), a potem `agents.list[].params` (pasujący identyfikator agenta) zastępuje według klucza. Szczegóły w [Prompt Caching](/pl/reference/prompt-caching).
- `models.providers.openrouter.params.provider`: domyślna polityka routingu dostawcy w całym OpenRouter. OpenClaw przekazuje ją do obiektu `provider` żądania OpenRouter; `agents.defaults.models["openrouter/<model>"].params.provider` dla modelu oraz parametry agenta zastępują według klucza. Zobacz [routing dostawcy OpenRouter](/pl/providers/openrouter#advanced-configuration).
- `params.extra_body`/`params.extraBody`: zaawansowany przekazywany dalej JSON scalany z treściami żądań `api: "openai-completions"` dla proxy zgodnych z OpenAI. Jeśli koliduje z wygenerowanymi kluczami żądania, dodatkowa treść wygrywa; nienatywne trasy completions nadal później usuwają `store` tylko dla OpenAI.
- `params.chat_template_kwargs`: argumenty szablonu czatu zgodne z vLLM/OpenAI scalane z najwyższym poziomem treści żądań `api: "openai-completions"`. Dla `vllm/nemotron-3-*` z wyłączonym myśleniem dołączony plugin vLLM automatycznie wysyła `enable_thinking: false` i `force_nonempty_content: true`; jawne `chat_template_kwargs` zastępują wygenerowane wartości domyślne, a `extra_body.chat_template_kwargs` nadal ma ostateczne pierwszeństwo. Skonfigurowane modele myślące vLLM Qwen i Nemotron udostępniają binarne wybory `/think` (`off`, `on`) zamiast wielopoziomowej drabiny wysiłku.
- `compat.thinkingFormat`: styl payloadu myślenia zgodny z OpenAI. Użyj `"together"` dla stylu Together `reasoning.enabled`, `"qwen"` dla stylu Qwen z `enable_thinking` na najwyższym poziomie albo `"qwen-chat-template"` dla `chat_template_kwargs.enable_thinking` na backendach rodziny Qwen, które obsługują kwargs szablonu czatu na poziomie żądania, takich jak vLLM. OpenClaw mapuje wyłączone myślenie na `false`, a włączone myślenie na `true`, a skonfigurowane modele vLLM Qwen udostępniają binarne wybory `/think` dla tych formatów.
- `compat.supportedReasoningEfforts`: lista wysiłków rozumowania zgodna z OpenAI dla modelu. Uwzględnij `"xhigh"` dla niestandardowych punktów końcowych, które naprawdę ją akceptują; OpenClaw udostępnia wtedy `/think xhigh` w menu poleceń, wierszach sesji Gateway, walidacji łatek sesji, walidacji CLI agenta oraz walidacji `llm-task` dla tego skonfigurowanego dostawcy/modelu. Użyj `compat.reasoningEffortMap`, gdy backend wymaga wartości specyficznej dla dostawcy dla kanonicznego poziomu.
- `params.preserveThinking`: opcjonalne włączenie tylko dla Z.AI zachowywanego myślenia. Po włączeniu i przy włączonym myśleniu OpenClaw wysyła `thinking.clear_thinking: false` i odtwarza wcześniejsze `reasoning_content`; zobacz [myślenie Z.AI i zachowywane myślenie](/pl/providers/zai#thinking-and-preserved-thinking).
- `localService`: opcjonalny menedżer procesów na poziomie dostawcy dla lokalnych/samodzielnie hostowanych serwerów modeli. Gdy wybrany model należy do tego dostawcy, OpenClaw sonduje `healthUrl` (albo `baseUrl + "/models"`), uruchamia `command` z `args`, jeśli punkt końcowy jest niedostępny, czeka do `readyTimeoutMs`, a potem wysyła żądanie modelu. `command` musi być ścieżką bezwzględną. `idleStopMs: 0` utrzymuje proces przy życiu do zamknięcia OpenClaw; wartość dodatnia zatrzymuje proces uruchomiony przez OpenClaw po tylu milisekundach bezczynności. Zobacz [lokalne usługi modeli](/pl/gateway/local-model-services).
- Polityka środowiska uruchomieniowego należy do dostawców albo modeli, nie do `agents.defaults`. Użyj `models.providers.<provider>.agentRuntime` dla reguł obejmujących całego dostawcę albo `agents.defaults.models["provider/model"].agentRuntime` / `agents.list[].models["provider/model"].agentRuntime` dla reguł specyficznych dla modelu. Modele agentowe OpenAI u oficjalnego dostawcy OpenAI domyślnie wybierają Codex.
- Programy zapisujące konfigurację, które mutują te pola (na przykład `/models set`, `/models set-image` oraz polecenia dodawania/usuwania opcji awaryjnych), zapisują kanoniczną formę obiektu i zachowują istniejące listy opcji awaryjnych, gdy to możliwe.
- `maxConcurrent`: maksymalna liczba równoległych uruchomień agentów między sesjami (każda sesja nadal jest serializowana). Domyślnie: 4.

### Polityka środowiska uruchomieniowego

```json5
{
  models: {
    providers: {
      openai: {
        agentRuntime: { id: "codex" },
      },
    },
  },
  agents: {
    defaults: {
      model: "openai/gpt-5.5",
      models: {
        "anthropic/claude-opus-4-8": {
          agentRuntime: { id: "claude-cli" },
        },
        "vllm/*": {
          agentRuntime: { id: "openclaw" },
        },
      },
    },
  },
}
```

- `id`: `"auto"`, `"openclaw"`, zarejestrowany identyfikator harnessu pluginu albo obsługiwany alias backendu CLI. Dołączony plugin Codex rejestruje `codex`; dołączony plugin Anthropic udostępnia backend CLI `claude-cli`.
- `id: "auto"` pozwala zarejestrowanym harnessom pluginów przejmować obsługiwane tury i używa OpenClaw, gdy żaden harness nie pasuje. Jawne środowisko wykonawcze pluginu, takie jak `id: "codex"`, wymaga tego harnessu i kończy działanie w trybie fail-closed, jeśli jest niedostępny albo zawiedzie.
- `id: "pi"` jest akceptowane tylko jako przestarzały alias `openclaw`, aby zachować wysłane konfiguracje z wersji v2026.5.22 i wcześniejszych. Nowa konfiguracja powinna używać `openclaw`.
- Pierwszeństwo środowiska wykonawczego to najpierw dokładna polityka modelu (`agents.list[].models["provider/model"]`, `agents.defaults.models["provider/model"]` albo `models.providers.<provider>.models[]`), następnie `agents.list[]` / `agents.defaults.models["provider/*"]`, a potem polityka całego dostawcy w `models.providers.<provider>.agentRuntime`.
- Klucze środowiska wykonawczego całego agenta są przestarzałe. `agents.defaults.agentRuntime`, `agents.list[].agentRuntime`, przypięcia środowiska wykonawczego sesji oraz `OPENCLAW_AGENT_RUNTIME` są ignorowane przy wyborze środowiska wykonawczego. Uruchom `openclaw doctor --fix`, aby usunąć przestarzałe wartości.
- Modele agentów OpenAI domyślnie używają harnessu Codex; `agentRuntime.id: "codex"` dla provider/model pozostaje prawidłowe, gdy chcesz ustawić to jawnie.
- W przypadku wdrożeń Claude CLI preferuj `model: "anthropic/claude-opus-4-8"` wraz z zakreślonym do modelu `agentRuntime.id: "claude-cli"`. Starsze referencje modeli `claude-cli/claude-opus-4-7` nadal działają ze względu na zgodność, ale nowa konfiguracja powinna utrzymywać kanoniczny wybór provider/model i umieszczać backend wykonawczy w polityce środowiska wykonawczego provider/model.
- To kontroluje wyłącznie wykonywanie tekstowych tur agenta. Generowanie multimediów, wizja, PDF, muzyka, wideo i TTS nadal używają swoich ustawień provider/model.

**Wbudowane skróty aliasów** (mają zastosowanie tylko wtedy, gdy model znajduje się w `agents.defaults.models`):

| Alias               | Model                           |
| ------------------- | ------------------------------- |
| `opus`              | `anthropic/claude-opus-4-8`     |
| `sonnet`            | `anthropic/claude-sonnet-4-6`   |
| `gpt`               | `openai/gpt-5.4`                |
| `gpt-mini`          | `openai/gpt-5.4-mini`           |
| `gpt-nano`          | `openai/gpt-5.4-nano`           |
| `gemini`            | `google/gemini-3.1-pro-preview` |
| `gemini-flash`      | `google/gemini-3-flash-preview` |
| `gemini-flash-lite` | `google/gemini-3.1-flash-lite`  |

Skonfigurowane przez Ciebie aliasy zawsze mają pierwszeństwo przed wartościami domyślnymi.

Modele Z.AI GLM-4.x automatycznie włączają tryb myślenia, chyba że ustawisz `--thinking off` albo samodzielnie zdefiniujesz `agents.defaults.models["zai/<model>"].params.thinking`.
Modele Z.AI domyślnie włączają `tool_stream` na potrzeby strumieniowania wywołań narzędzi. Ustaw `agents.defaults.models["zai/<model>"].params.tool_stream` na `false`, aby to wyłączyć.
Anthropic Claude Opus 4.8 domyślnie pozostawia myślenie wyłączone w OpenClaw; gdy myślenie adaptacyjne jest jawnie włączone, domyślny poziom wysiłku należący do dostawcy Anthropic to `high`. Modele Claude 4.6 domyślnie używają `adaptive`, gdy nie ustawiono jawnego poziomu myślenia.

### `agents.defaults.cliBackends`

Opcjonalne backendy CLI dla awaryjnych uruchomień wyłącznie tekstowych (bez wywołań narzędzi). Przydatne jako kopia zapasowa, gdy dostawcy API zawodzą.

```json5
{
  agents: {
    defaults: {
      cliBackends: {
        "claude-cli": {
          command: "/opt/homebrew/bin/claude",
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
- `reseedFromRawTranscriptWhenUncompacted: true` pozwala backendowi odzyskać bezpieczne
  unieważnione sesje z ograniczonego ogona surowego transkryptu OpenClaw przed
  utworzeniem pierwszego podsumowania Compaction. Zmiany profilu uwierzytelniania albo epoki poświadczeń
  nadal nigdy nie używają ponownego zasilenia surowym transkryptem.

### `agents.defaults.promptOverlays`

Niezależne od dostawcy nakładki promptów stosowane według rodziny modeli na powierzchniach promptów składanych przez OpenClaw. Identyfikatory modeli z rodziny GPT-5 otrzymują wspólny kontrakt zachowania w trasach OpenClaw/dostawcy; `personality` kontroluje tylko przyjazną warstwę stylu interakcji. Natywne trasy serwera aplikacji Codex zachowują bazowe instrukcje/modelowe należące do Codex zamiast tej nakładki OpenClaw GPT-5, a OpenClaw wyłącza wbudowaną osobowość Codex dla natywnych wątków.

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
        skipWhenBusy: false, // default: false; true also waits for this agent's subagent/nested lanes
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
- `includeSystemPromptSection`: gdy false, pomija sekcję Heartbeat w prompcie systemowym i pomija wstrzyknięcie `HEARTBEAT.md` do kontekstu bootstrap. Domyślnie: `true`.
- `suppressToolErrorWarnings`: gdy true, pomija ostrzegawcze ładunki błędów narzędzi podczas uruchomień Heartbeat.
- `timeoutSeconds`: maksymalny dozwolony czas w sekundach dla tury agenta Heartbeat przed jej przerwaniem. Pozostaw nieustawione, aby użyć `agents.defaults.timeoutSeconds`, gdy jest ustawione, w przeciwnym razie kadencja Heartbeat jest ograniczona do 600 sekund.
- `directPolicy`: polityka dostarczania bezpośredniego/DM. `allow` (domyślnie) zezwala na dostarczanie do celu bezpośredniego. `block` tłumi dostarczanie do celu bezpośredniego i emituje `reason=dm-blocked`.
- `lightContext`: gdy true, uruchomienia Heartbeat używają lekkiego kontekstu bootstrap i zachowują tylko `HEARTBEAT.md` z plików bootstrap przestrzeni roboczej.
- `isolatedSession`: gdy true, każde uruchomienie Heartbeat działa w świeżej sesji bez wcześniejszej historii rozmowy. Ten sam wzorzec izolacji co cron `sessionTarget: "isolated"`. Zmniejsza koszt tokenów na Heartbeat z ~100K do ~2-5K tokenów.
- `skipWhenBusy`: gdy true, uruchomienia Heartbeat są odraczane na dodatkowych zajętych ścieżkach tego agenta: jego własnym subagencie z kluczem sesji albo zagnieżdżonej pracy polecenia. Ścieżki Cron zawsze odraczają Heartbeat, nawet bez tej flagi.
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
        timeoutSeconds: 180,
        reserveTokensFloor: 24000,
        keepRecentTokens: 50000,
        identifierPolicy: "strict", // strict | off | custom
        identifierInstructions: "Preserve deployment IDs, ticket IDs, and host:port pairs exactly.", // used when identifierPolicy=custom
        qualityGuard: { enabled: true, maxRetries: 1 },
        midTurnPrecheck: { enabled: false }, // optional tool-loop pressure check
        postCompactionSections: ["Session Startup", "Red Lines"], // opt in to AGENTS.md section reinjection
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

- `mode`: `default` lub `safeguard` (fragmentaryczne podsumowywanie długich historii). Zobacz [Compaction](/pl/concepts/compaction).
- `provider`: identyfikator zarejestrowanego pluginu dostawcy Compaction. Gdy jest ustawiony, wywoływane jest `summarize()` dostawcy zamiast wbudowanego podsumowywania LLM. W razie niepowodzenia następuje powrót do wbudowanego mechanizmu. Ustawienie dostawcy wymusza `mode: "safeguard"`. Zobacz [Compaction](/pl/concepts/compaction).
- `timeoutSeconds`: maksymalna liczba sekund dozwolona dla pojedynczej operacji Compaction, zanim OpenClaw ją przerwie. Domyślnie: `180`.
- `keepRecentTokens`: budżet punktu odcięcia agenta służący do zachowania najnowszej końcówki transkrypcji dosłownie. Ręczne `/compact` respektuje to ustawienie, gdy jest jawnie ustawione; w przeciwnym razie ręczna Compaction jest twardym punktem kontrolnym.
- `identifierPolicy`: `strict` (domyślnie), `off` lub `custom`. `strict` dodaje na początku wbudowane wskazówki dotyczące zachowywania nieprzezroczystych identyfikatorów podczas podsumowywania Compaction.
- `identifierInstructions`: opcjonalny niestandardowy tekst dotyczący zachowywania identyfikatorów, używany, gdy `identifierPolicy=custom`.
- `qualityGuard`: kontrole ponawiania przy nieprawidłowo sformatowanych danych wyjściowych dla podsumowań safeguard. Domyślnie włączone w trybie safeguard; ustaw `enabled: false`, aby pominąć audyt.
- `midTurnPrecheck`: opcjonalna kontrola presji pętli narzędzi. Gdy `enabled: true`, OpenClaw sprawdza presję kontekstu po dołączeniu wyników narzędzi i przed następnym wywołaniem modelu. Jeśli kontekst już się nie mieści, przerywa bieżącą próbę przed wysłaniem promptu i ponownie używa istniejącej ścieżki odzyskiwania po kontroli wstępnej, aby skrócić wyniki narzędzi albo wykonać Compaction i ponowić próbę. Działa z trybami Compaction `default` i `safeguard`. Domyślnie: wyłączone.
- `postCompactionSections`: opcjonalne nazwy sekcji H2/H3 z AGENTS.md do ponownego wstrzyknięcia po Compaction. Ponowne wstrzykiwanie jest wyłączone, gdy nie ustawiono wartości albo ustawiono `[]`. Jawne ustawienie `["Session Startup", "Red Lines"]` włącza tę parę i zachowuje starszy mechanizm awaryjny `Every Session`/`Safety`. Włącz to tylko wtedy, gdy dodatkowy kontekst jest wart ryzyka powielenia wskazówek projektowych już ujętych w podsumowaniu Compaction.
- `model`: opcjonalny `provider/model-id` albo prosty alias z `agents.defaults.models` używany wyłącznie do podsumowywania Compaction. Proste aliasy są rozwiązywane przed wysłaniem; skonfigurowane dosłowne identyfikatory modeli zachowują pierwszeństwo przy kolizjach. Użyj tego, gdy główna sesja ma zachować jeden model, ale podsumowania Compaction mają działać na innym; gdy nie ustawiono wartości, Compaction używa podstawowego modelu sesji.
- `maxActiveTranscriptBytes`: opcjonalny próg bajtów (`number` albo ciągi takie jak `"20mb"`), który uruchamia normalną lokalną Compaction przed uruchomieniem, gdy aktywny JSONL przekroczy próg. Wymaga `truncateAfterCompaction`, aby udana Compaction mogła przełączyć się na mniejszą następną transkrypcję. Wyłączone, gdy nie ustawiono wartości albo ustawiono `0`.
- `notifyUser`: gdy `true`, wysyła użytkownikowi krótkie powiadomienia, gdy Compaction się zaczyna i gdy się kończy (na przykład „Kompaktowanie kontekstu...” i „Compaction zakończona”). Domyślnie wyłączone, aby Compaction pozostała cicha.
- `memoryFlush`: cicha tura agentowa przed automatyczną Compaction służąca do zapisania trwałych wspomnień. Ustaw `model` na dokładny provider/model, taki jak `ollama/qwen3:8b`, gdy ta tura porządkowa ma pozostać na modelu lokalnym; nadpisanie nie dziedziczy aktywnego łańcucha awaryjnego sesji. Pomijane, gdy obszar roboczy jest tylko do odczytu.

### `agents.defaults.runRetries`

Granice iteracji ponawiania zewnętrznej pętli uruchomienia dla osadzonego środowiska uruchomieniowego agenta, aby zapobiec nieskończonym pętlom wykonywania podczas odzyskiwania po błędach. Pamiętaj, że to ustawienie obecnie dotyczy tylko osadzonego środowiska uruchomieniowego agenta, a nie środowisk ACP ani CLI.

```json5
{
  agents: {
    defaults: {
      runRetries: {
        base: 24,
        perProfile: 8,
        min: 32,
        max: 160,
      },
    },
    list: [
      {
        id: "main",
        runRetries: { max: 50 }, // optional per-agent overrides
      },
    ],
  },
}
```

- `base`: podstawowa liczba iteracji ponawiania uruchomienia dla zewnętrznej pętli uruchomienia. Domyślnie: `24`.
- `perProfile`: dodatkowe iteracje ponawiania uruchomienia przyznawane dla każdego kandydata profilu awaryjnego. Domyślnie: `8`.
- `min`: minimalny bezwzględny limit iteracji ponawiania uruchomienia. Domyślnie: `32`.
- `max`: maksymalny bezwzględny limit iteracji ponawiania uruchomienia zapobiegający niekontrolowanemu wykonywaniu. Domyślnie: `160`.

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
- `ttl` kontroluje, jak często przycinanie może zostać ponownie uruchomione (po ostatnim dotknięciu pamięci podręcznej).
- Przycinanie najpierw miękko skraca nadmiernie duże wyniki narzędzi, a następnie, jeśli trzeba, twardo czyści starsze wyniki narzędzi.
- `softTrimRatio` i `hardClearRatio` akceptują wartości od `0.0` do `1.0`; walidacja konfiguracji odrzuca wartości spoza tego zakresu.

**Miękkie skracanie** zachowuje początek i koniec oraz wstawia `...` pośrodku.

**Twarde czyszczenie** zastępuje cały wynik narzędzia symbolem zastępczym.

Uwagi:

- Bloki obrazów nigdy nie są skracane ani czyszczone.
- Współczynniki są oparte na znakach (przybliżone), a nie na dokładnej liczbie tokenów.
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
- `humanDelay`: losowa pauza między odpowiedziami blokowymi. `natural` = 800–2500 ms. Nadpisanie dla agenta: `agents.list[].humanDelay`.

Zobacz [Strumieniowanie](/pl/concepts/streaming), aby poznać szczegóły zachowania i dzielenia na fragmenty.

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

Opcjonalny sandboxing dla osadzonego agenta. Zobacz [Sandboxing](/pl/gateway/sandboxing), aby przeczytać pełny przewodnik.

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

<Accordion title="Szczegóły sandboxa">

**Backend:**

- `docker`: lokalne środowisko uruchomieniowe Docker (domyślnie)
- `ssh`: ogólne zdalne środowisko uruchomieniowe oparte na SSH
- `openshell`: środowisko uruchomieniowe OpenShell

Gdy wybrano `backend: "openshell"`, ustawienia specyficzne dla środowiska uruchomieniowego przenoszą się do
`plugins.entries.openshell.config`.

**Konfiguracja backendu SSH:**

- `target`: cel SSH w formie `user@host[:port]`
- `command`: polecenie klienta SSH (domyślnie: `ssh`)
- `workspaceRoot`: bezwzględny zdalny katalog główny używany dla obszarów roboczych w poszczególnych zakresach
- `identityFile` / `certificateFile` / `knownHostsFile`: istniejące pliki lokalne przekazywane do OpenSSH
- `identityData` / `certificateData` / `knownHostsData`: treści wbudowane albo SecretRefs, które OpenClaw materializuje w pliki tymczasowe w czasie działania
- `strictHostKeyChecking` / `updateHostKeys`: pokrętła polityki kluczy hosta OpenSSH

**Pierwszeństwo uwierzytelniania SSH:**

- `identityData` ma pierwszeństwo przed `identityFile`
- `certificateData` ma pierwszeństwo przed `certificateFile`
- `knownHostsData` ma pierwszeństwo przed `knownHostsFile`
- Wartości `*Data` oparte na SecretRef są rozwiązywane z aktywnego zrzutu środowiska uruchomieniowego sekretów przed uruchomieniem sesji sandboxa

**Zachowanie backendu SSH:**

- inicjalizuje zdalny obszar roboczy raz po utworzeniu lub ponownym utworzeniu
- następnie utrzymuje zdalny obszar roboczy SSH jako kanoniczny
- kieruje `exec`, narzędzia plikowe i ścieżki multimediów przez SSH
- nie synchronizuje automatycznie zmian zdalnych z powrotem na hosta
- nie obsługuje kontenerów przeglądarki sandboxa

**Dostęp do obszaru roboczego:**

- `none`: obszar roboczy sandboxa dla zakresu pod `~/.openclaw/sandboxes`
- `ro`: obszar roboczy sandboxa w `/workspace`, obszar roboczy agenta zamontowany tylko do odczytu w `/agent`
- `rw`: obszar roboczy agenta zamontowany do odczytu/zapisu w `/workspace`

**Zakres:**

- `session`: kontener i obszar roboczy dla sesji
- `agent`: jeden kontener i obszar roboczy na agenta (domyślnie)
- `shared`: współdzielony kontener i obszar roboczy (bez izolacji między sesjami)

**Konfiguracja pluginu OpenShell:**

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

- `mirror`: inicjuje środowisko zdalne z lokalnego przed wykonaniem, synchronizuje z powrotem po wykonaniu; lokalny obszar roboczy pozostaje kanoniczny
- `remote`: inicjuje środowisko zdalne raz podczas tworzenia piaskownicy, a następnie utrzymuje zdalny obszar roboczy jako kanoniczny

W trybie `remote` lokalne zmiany hosta wykonane poza OpenClaw nie są automatycznie synchronizowane do piaskownicy po kroku inicjalizacji.
Transport odbywa się przez SSH do piaskownicy OpenShell, ale Plugin zarządza cyklem życia piaskownicy i opcjonalną synchronizacją lustrzaną.

**`setupCommand`** uruchamia się raz po utworzeniu kontenera (przez `sh -lc`). Wymaga wyjścia do sieci, zapisywalnego katalogu głównego i użytkownika root.

**Kontenery domyślnie mają `network: "none"`** — ustaw `"bridge"` (lub niestandardową sieć mostkową), jeśli agent potrzebuje dostępu wychodzącego.
`"host"` jest blokowane. `"container:<id>"` jest domyślnie blokowane, chyba że jawnie ustawisz
`sandbox.docker.dangerouslyAllowContainerNamespaceJoin: true` (tryb awaryjny).
Tury serwera aplikacji Codex w aktywnej piaskownicy OpenClaw używają tego samego ustawienia wyjścia do sieci dla natywnego dostępu sieciowego w trybie kodu.

**Załączniki przychodzące** są umieszczane w `media/inbound/*` w aktywnym obszarze roboczym.

**`docker.binds`** montuje dodatkowe katalogi hosta; wiązania globalne i per-agent są scalane.

**Przeglądarka w piaskownicy** (`sandbox.browser.enabled`): Chromium + CDP w kontenerze. Adres URL noVNC wstrzykiwany do promptu systemowego. Nie wymaga `browser.enabled` w `openclaw.json`.
Dostęp obserwatora noVNC domyślnie używa uwierzytelniania VNC, a OpenClaw emituje krótkotrwały adres URL z tokenem (zamiast ujawniać hasło we współdzielonym adresie URL).

- `allowHostControl: false` (domyślnie) blokuje sesjom w piaskownicy kierowanie do przeglądarki hosta.
- `network` domyślnie ma wartość `openclaw-sandbox-browser` (dedykowana sieć mostkowa). Ustaw `bridge` tylko wtedy, gdy jawnie chcesz globalnej łączności mostkowej.
- `cdpSourceRange` opcjonalnie ogranicza ruch przychodzący CDP na brzegu kontenera do zakresu CIDR (na przykład `172.21.0.1/32`).
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
  - `--disable-3d-apis`, `--disable-software-rasterizer` i `--disable-gpu` są
    domyślnie włączone i można je wyłączyć za pomocą
    `OPENCLAW_BROWSER_DISABLE_GRAPHICS_FLAGS=0`, jeśli wymaga tego użycie WebGL/3D.
  - `OPENCLAW_BROWSER_DISABLE_EXTENSIONS=0` ponownie włącza rozszerzenia, jeśli Twój przepływ pracy
    od nich zależy.
  - `--renderer-process-limit=2` można zmienić za pomocą
    `OPENCLAW_BROWSER_RENDERER_PROCESS_LIMIT=<N>`; ustaw `0`, aby użyć domyślnego
    limitu procesów Chromium.
  - plus `--no-sandbox`, gdy `noSandbox` jest włączone.
  - Wartości domyślne są bazą obrazu kontenera; użyj niestandardowego obrazu przeglądarki z niestandardowym
    punktem wejścia, aby zmienić domyślne ustawienia kontenera.

</Accordion>

Izolacja przeglądarki w piaskownicy i `sandbox.docker.binds` działają tylko z Dockerem.

Zbuduj obrazy (z checkoutu źródłowego):

```bash
scripts/sandbox-setup.sh           # main sandbox image
scripts/sandbox-browser-setup.sh   # optional browser image
```

W przypadku instalacji npm bez checkoutu źródłowego zobacz [Piaskownica § Obrazy i konfiguracja](/pl/gateway/sandboxing#images-and-setup), aby uzyskać wbudowane polecenia `docker build`.

### `agents.list` (nadpisania per-agent)

Użyj `agents.list[].tts`, aby nadać agentowi własnego dostawcę TTS, głos, model,
styl lub tryb automatycznego TTS. Blok agenta głęboko scala się z globalnym
`messages.tts`, więc współdzielone dane uwierzytelniające mogą pozostać w jednym miejscu, podczas gdy poszczególni
agenci nadpisują tylko potrzebne pola głosu lub dostawcy. Nadpisanie aktywnego agenta
ma zastosowanie do automatycznych odpowiedzi mówionych, `/tts audio`, `/tts status` oraz
narzędzia agenta `tts`. Zobacz [Synteza mowy](/pl/tools/tts#per-agent-voice-overrides),
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
        params: { cacheRetention: "none" }, // overrides matching defaults.models params by key
        tts: {
          providers: {
            elevenlabs: { speakerVoiceId: "EXAVITQu4vr4xnSDxMaL" },
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
- `default`: gdy ustawiono wiele, wygrywa pierwszy (rejestrowane jest ostrzeżenie). Jeśli żaden nie jest ustawiony, domyślny jest pierwszy wpis listy.
- `model`: forma tekstowa ustawia ścisły podstawowy model per-agent bez modelu awaryjnego; forma obiektu `{ primary }` również jest ścisła, chyba że dodasz `fallbacks`. Użyj `{ primary, fallbacks: [...] }`, aby włączyć dla tego agenta zachowanie awaryjne, lub `{ primary, fallbacks: [] }`, aby jawnie ustawić ścisłe zachowanie. Zadania Cron, które nadpisują tylko `primary`, nadal dziedziczą domyślne modele awaryjne, chyba że ustawisz `fallbacks: []`.
- `params`: parametry strumienia per-agent scalane z wybranym wpisem modelu w `agents.defaults.models`. Używaj tego do nadpisań specyficznych dla agenta, takich jak `cacheRetention`, `temperature` lub `maxTokens`, bez duplikowania całego katalogu modeli.
- `tts`: opcjonalne nadpisania syntezy mowy per-agent. Blok głęboko scala się z `messages.tts`, więc trzymaj współdzielone dane uwierzytelniające dostawcy i politykę awaryjną w `messages.tts`, a tutaj ustawiaj tylko wartości specyficzne dla persony, takie jak dostawca, głos, model, styl lub tryb automatyczny.
- `skills`: opcjonalna lista dozwolonych Skills per-agent. Jeśli pominięta, agent dziedziczy `agents.defaults.skills`, gdy jest ustawione; jawna lista zastępuje wartości domyślne zamiast scalać, a `[]` oznacza brak Skills.
- `thinkingDefault`: opcjonalny domyślny poziom myślenia per-agent (`off | minimal | low | medium | high | xhigh | adaptive | max`). Nadpisuje `agents.defaults.thinkingDefault` dla tego agenta, gdy nie ustawiono nadpisania per-wiadomość ani per-sesja. Wybrany profil dostawcy/modelu kontroluje, które wartości są prawidłowe; dla Google Gemini `adaptive` zachowuje dynamiczne myślenie zarządzane przez dostawcę (`thinkingLevel` pominięte w Gemini 3/3.1, `thinkingBudget: -1` w Gemini 2.5).
- `reasoningDefault`: opcjonalna domyślna widoczność rozumowania per-agent (`on | off | stream`). Nadpisuje `agents.defaults.reasoningDefault` dla tego agenta, gdy nie ustawiono nadpisania rozumowania per-wiadomość ani per-sesja.
- `fastModeDefault`: opcjonalna wartość domyślna per-agent dla trybu szybkiego (`"auto" | true | false`). Ma zastosowanie, gdy nie ustawiono nadpisania trybu szybkiego per-wiadomość ani per-sesja.
- `models`: opcjonalny katalog modeli/nadpisania runtime per-agent, kluczowane pełnymi identyfikatorami `provider/model`. Użyj `models["provider/model"].agentRuntime` dla wyjątków runtime per-agent.
- `runtime`: opcjonalny deskryptor runtime per-agent. Użyj `type: "acp"` z wartościami domyślnymi `runtime.acp` (`agent`, `backend`, `mode`, `cwd`), gdy agent powinien domyślnie używać sesji uprzęży ACP.
- `identity.avatar`: ścieżka względna względem obszaru roboczego, adres URL `http(s)` albo URI `data:`.
- Lokalne pliki obrazów `identity.avatar` względne względem obszaru roboczego są ograniczone do 2 MB. Adresy URL `http(s)` i URI `data:` nie są sprawdzane lokalnym limitem rozmiaru pliku.
- `identity` wyprowadza wartości domyślne: `ackReaction` z `emoji`, `mentionPatterns` z `name`/`emoji`.
- `subagents.allowAgents`: lista dozwolonych skonfigurowanych identyfikatorów agentów dla jawnych celów `sessions_spawn.agentId` (`["*"]` = dowolny skonfigurowany cel; domyślnie: tylko ten sam agent). Uwzględnij identyfikator żądającego, gdy wywołania `agentId` kierowane do samego siebie powinny być dozwolone. Nieaktualne wpisy, których konfiguracja agenta została usunięta, są odrzucane przez `sessions_spawn` i pomijane w `agents_list`; uruchom `openclaw doctor --fix`, aby je wyczyścić, albo dodaj minimalny wpis `agents.list[]`, jeśli ten cel ma pozostać możliwy do zespawnowania przy dziedziczeniu wartości domyślnych.
- Straż dziedziczenia piaskownicy: jeśli sesja żądająca działa w piaskownicy, `sessions_spawn` odrzuca cele, które działałyby bez piaskownicy.
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

### Pola dopasowania wiązania

- `type` (opcjonalne): `route` dla normalnego routingu (brak typu domyślnie oznacza route), `acp` dla trwałych wiązań rozmów ACP.
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

W obrębie każdej warstwy wygrywa pierwszy pasujący wpis `bindings`.

Dla wpisów `type: "acp"` OpenClaw rozwiązuje według dokładnej tożsamości rozmowy (`match.channel` + konto + `match.peer.id`) i nie używa powyższej kolejności warstw wiązań routingu.

### Profile dostępu per-agent

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

Zobacz [Piaskownica i narzędzia wieloagentowe](/pl/tools/multi-agent-sandbox-tools), aby poznać szczegóły kolejności pierwszeństwa.

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
      mode: "enforce", // enforce (default) | warn
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

- **`scope`**: podstawowa strategia grupowania sesji dla kontekstów czatów grupowych.
  - `per-sender` (domyślnie): każdy nadawca otrzymuje izolowaną sesję w kontekście kanału.
  - `global`: wszyscy uczestnicy w kontekście kanału współdzielą jedną sesję (używaj tylko wtedy, gdy zamierzony jest wspólny kontekst).
- **`dmScope`**: sposób grupowania wiadomości prywatnych.
  - `main`: wszystkie wiadomości prywatne współdzielą sesję główną.
  - `per-peer`: izolacja według identyfikatora nadawcy między kanałami.
  - `per-channel-peer`: izolacja według kanału + nadawcy (zalecane dla skrzynek odbiorczych z wieloma użytkownikami).
  - `per-account-channel-peer`: izolacja według konta + kanału + nadawcy (zalecane dla wielu kont).
- **`identityLinks`**: mapuje identyfikatory kanoniczne na peery z prefiksem dostawcy w celu współdzielenia sesji między kanałami. Polecenia dokowania, takie jak `/dock_discord`, używają tej samej mapy, aby przełączyć trasę odpowiedzi aktywnej sesji na inny połączony peer kanału; zobacz [Dokowanie kanałów](/pl/concepts/channel-docking).
- **`reset`**: podstawowa polityka resetowania. `daily` resetuje o lokalnej godzinie `atHour`; `idle` resetuje po `idleMinutes`. Gdy skonfigurowane są oba, wygrywa ten, który wygaśnie pierwszy. Świeżość resetu dziennego używa `sessionStartedAt` z wiersza sesji; świeżość resetu bezczynności używa `lastInteractionAt`. Zapisy zdarzeń tła/systemowych, takie jak Heartbeat, wybudzenia Cron, powiadomienia exec i księgowanie Gateway mogą aktualizować `updatedAt`, ale nie utrzymują świeżości sesji dziennych/bezczynnych.
- **`resetByType`**: nadpisania według typu (`direct`, `group`, `thread`). Starsze `dm` jest akceptowane jako alias dla `direct`.
- **`mainKey`**: starsze pole. Runtime zawsze używa `"main"` dla głównego zasobnika czatu bezpośredniego.
- **`agentToAgent.maxPingPongTurns`**: maksymalna liczba tur odpowiedzi zwrotnych między agentami podczas wymian agent-do-agenta (liczba całkowita, zakres: `0`-`20`, domyślnie: `5`). `0` wyłącza łańcuch ping-pong.
- **`sendPolicy`**: dopasowanie według `channel`, `chatType` (`direct|group|channel`, ze starszym aliasem `dm`), `keyPrefix` lub `rawKeyPrefix`. Pierwsza odmowa wygrywa.
- **`maintenance`**: kontrolki czyszczenia i retencji magazynu sesji.
  - `mode`: `enforce` stosuje czyszczenie i jest wartością domyślną; `warn` tylko emituje ostrzeżenia.
  - `pruneAfter`: próg wieku dla nieaktualnych wpisów (domyślnie `30d`).
  - `maxEntries`: maksymalna liczba wpisów w `sessions.json` (domyślnie `500`). Runtime zapisuje czyszczenie wsadowe z małym buforem wysokiego poziomu dla limitów o rozmiarze produkcyjnym; `openclaw sessions cleanup --enforce` stosuje limit natychmiast.
  - Krótkotrwałe sesje próbne uruchomień modeli Gateway używają stałej retencji `24h`, ale czyszczenie jest sterowane presją: usuwa nieaktualne, ścisłe wiersze próbne uruchomień modeli tylko wtedy, gdy osiągnięta zostanie presja konserwacji/limitu wpisów sesji. Kwalifikują się tylko ścisłe, jawne klucze próbne pasujące do `agent:*:explicit:model-run-<uuid>`; zwykłe sesje bezpośrednie, grupowe, wątkowe, Cron, hook, Heartbeat, ACP i subagentów nie dziedziczą tej 24-godzinnej retencji. Gdy działa czyszczenie uruchomień modeli, wykonuje się przed szerszym czyszczeniem nieaktualnych wpisów `pruneAfter` i limitem `maxEntries`.
  - `rotateBytes`: przestarzałe i ignorowane; `openclaw doctor --fix` usuwa je ze starszych konfiguracji.
  - `resetArchiveRetention`: retencja archiwów transkryptów `*.reset.<timestamp>`. Domyślnie równa `pruneAfter`; ustaw `false`, aby wyłączyć.
  - `maxDiskBytes`: opcjonalny budżet dyskowy katalogu sesji. W trybie `warn` rejestruje ostrzeżenia; w trybie `enforce` najpierw usuwa najstarsze artefakty/sesje.
  - `highWaterBytes`: opcjonalny cel po czyszczeniu budżetu. Domyślnie `80%` wartości `maxDiskBytes`.
- **`threadBindings`**: globalne wartości domyślne dla funkcji sesji powiązanych z wątkami.
  - `enabled`: główny przełącznik domyślny (dostawcy mogą nadpisywać; Discord używa `channels.discord.threadBindings.enabled`)
  - `idleHours`: domyślne automatyczne odfokusowanie po bezczynności w godzinach (`0` wyłącza; dostawcy mogą nadpisywać)
  - `maxAgeHours`: domyślny twardy maksymalny wiek w godzinach (`0` wyłącza; dostawcy mogą nadpisywać)
  - `spawnSessions`: domyślna bramka tworzenia sesji roboczych powiązanych z wątkami z `sessions_spawn` i spawnów wątków ACP. Domyślnie `true`, gdy powiązania wątków są włączone; dostawcy/konta mogą nadpisywać.
  - `defaultSpawnContext`: domyślny natywny kontekst subagenta dla spawnów powiązanych z wątkami (`"fork"` lub `"isolated"`). Domyślnie `"fork"`.

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
      mode: "followup", // steer | followup | collect | interrupt
      debounceMs: 500,
      cap: 20,
      drop: "summarize", // old | new | summarize
      byChannel: {
        whatsapp: "followup",
        telegram: "followup",
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

Nadpisania według kanału/konta: `channels.<channel>.responsePrefix`, `channels.<channel>.accounts.<id>.responsePrefix`.

Rozstrzyganie (najbardziej szczegółowe wygrywa): konto → kanał → globalne. `""` wyłącza i zatrzymuje kaskadę. `"auto"` wyprowadza `[{identity.name}]`.

**Zmienne szablonu:**

| Zmienna           | Opis                   | Przykład                    |
| ----------------- | ---------------------- | --------------------------- |
| `{model}`         | Krótka nazwa modelu    | `claude-opus-4-6`           |
| `{modelFull}`     | Pełny identyfikator modelu | `anthropic/claude-opus-4-6` |
| `{provider}`      | Nazwa dostawcy         | `anthropic`                 |
| `{thinkingLevel}` | Bieżący poziom myślenia | `high`, `low`, `off`        |
| `{identity.name}` | Nazwa tożsamości agenta | (tak samo jak `"auto"`)     |

W zmiennych wielkość liter nie ma znaczenia. `{think}` jest aliasem dla `{thinkingLevel}`.

### Reakcja potwierdzenia

- Domyślnie używa `identity.emoji` aktywnego agenta, w przeciwnym razie `"👀"`. Ustaw `""`, aby wyłączyć.
- Nadpisania według kanału: `channels.<channel>.ackReaction`, `channels.<channel>.accounts.<id>.ackReaction`.
- Kolejność rozstrzygania: konto → kanał → `messages.ackReaction` → wartość zastępcza tożsamości.
- Zakres: `group-mentions` (domyślnie), `group-all`, `direct`, `all`.
- `removeAckAfterReply`: usuwa potwierdzenie po odpowiedzi na kanałach obsługujących reakcje, takich jak Slack, Discord, Telegram, WhatsApp i iMessage.
- `messages.statusReactions.enabled`: włącza reakcje statusu cyklu życia w Slack, Discord, Telegram i WhatsApp.
  W Slack i Discord brak ustawienia pozostawia reakcje statusu włączone, gdy aktywne są reakcje potwierdzenia.
  W Telegram i WhatsApp ustaw tę wartość jawnie na `true`, aby włączyć reakcje statusu cyklu życia.
- `messages.statusReactions.emojis`: nadpisuje klucze emoji cyklu życia:
  `queued`, `thinking`, `compacting`, `tool`, `coding`, `web`, `deploy`, `build`,
  `concierge`, `done`, `error`, `stallSoft` i `stallHard`.
  Telegram pozwala tylko na stały zestaw reakcji, więc nieobsługiwane skonfigurowane emoji wracają
  do najbliższego obsługiwanego wariantu statusu dla danego czatu.

### Opóźnienie wiadomości przychodzących

Grupuje szybkie wiadomości wyłącznie tekstowe od tego samego nadawcy w jedną turę agenta. Media/załączniki opróżniają kolejkę natychmiast. Polecenia sterujące omijają opóźnianie.

### TTS (zamiana tekstu na mowę)

```json5
{
  messages: {
    tts: {
      auto: "always", // off | always | inbound | tagged
      mode: "final", // final | all
      provider: "elevenlabs",
      summaryModel: "openai/gpt-5.4-mini",
      modelOverrides: { enabled: true },
      maxTextLength: 4000,
      timeoutMs: 30000,
      prefsPath: "~/.openclaw/settings/tts.json",
      providers: {
        elevenlabs: {
          apiKey: "elevenlabs_api_key",
          baseUrl: "https://api.elevenlabs.io",
          speakerVoiceId: "voice_id",
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
          speakerVoice: "en-US-AvaMultilingualNeural",
          lang: "en-US",
          outputFormat: "audio-24khz-48kbitrate-mono-mp3",
        },
        openai: {
          apiKey: "openai_api_key",
          baseUrl: "https://api.openai.com/v1",
          model: "gpt-4o-mini-tts",
          speakerVoice: "alloy",
        },
      },
    },
  },
}
```

- `auto` steruje domyślnym trybem auto-TTS: `off`, `always`, `inbound` albo `tagged`. `/tts on|off` może zastąpić lokalne preferencje, a `/tts status` pokazuje efektywny stan.
- `summaryModel` zastępuje `agents.defaults.model.primary` dla automatycznego podsumowania.
- `modelOverrides` jest domyślnie włączone; `modelOverrides.allowProvider` ma domyślną wartość `false` (opt-in).
- Klucze API używają wartości zastępczych `ELEVENLABS_API_KEY`/`XI_API_KEY` i `OPENAI_API_KEY`.
- Dołączone dostawcy mowy należą do pluginów. Jeśli ustawiono `plugins.allow`, uwzględnij każdy plugin dostawcy TTS, którego chcesz użyć, na przykład `microsoft` dla Edge TTS. Starszy identyfikator dostawcy `edge` jest akceptowany jako alias dla `microsoft`.
- `providers.openai.baseUrl` zastępuje punkt końcowy OpenAI TTS. Kolejność rozwiązywania to konfiguracja, następnie `OPENAI_TTS_BASE_URL`, a następnie `https://api.openai.com/v1`.
- Gdy `providers.openai.baseUrl` wskazuje punkt końcowy inny niż OpenAI, OpenClaw traktuje go jako zgodny z OpenAI serwer TTS i rozluźnia walidację modelu/głosu.

---

## Talk

Wartości domyślne trybu Talk (macOS/iOS/Android).

```json5
{
  talk: {
    provider: "elevenlabs",
    providers: {
      elevenlabs: {
        speakerVoiceId: "elevenlabs_voice_id",
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
    consultThinkingLevel: "low",
    consultFastMode: true,
    speechLocale: "ru-RU",
    silenceTimeoutMs: 1500,
    interruptOnSpeech: true,
    realtime: {
      provider: "openai",
      providers: {
        openai: {
          model: "gpt-realtime-2",
          speakerVoice: "cedar",
        },
      },
      instructions: "Speak warmly and keep answers brief.",
      mode: "realtime",
      transport: "webrtc",
      brain: "agent-consult",
    },
  },
}
```

- `talk.provider` musi pasować do klucza w `talk.providers`, gdy skonfigurowano wielu dostawców Talk.
- Starsze płaskie klucze Talk (`talk.voiceId`, `talk.voiceAliases`, `talk.modelId`, `talk.outputFormat`, `talk.apiKey`) służą wyłącznie do zgodności. Uruchom `openclaw doctor --fix`, aby przepisać utrwaloną konfigurację do `talk.providers.<provider>`.
- Identyfikatory głosów używają wartości zastępczych `ELEVENLABS_VOICE_ID` albo `SAG_VOICE_ID`.
- `providers.*.apiKey` przyjmuje ciągi tekstowe jawne albo obiekty SecretRef.
- Wartość zastępcza `ELEVENLABS_API_KEY` ma zastosowanie tylko wtedy, gdy nie skonfigurowano klucza API Talk.
- `providers.*.voiceAliases` pozwala dyrektywom Talk używać przyjaznych nazw.
- `providers.mlx.modelId` wybiera repozytorium Hugging Face używane przez lokalnego pomocnika MLX na macOS. Jeśli zostanie pominięte, macOS używa `mlx-community/Soprano-80M-bf16`.
- Odtwarzanie MLX na macOS działa przez dołączonego pomocnika `openclaw-mlx-tts`, gdy jest obecny, albo plik wykonywalny w `PATH`; `OPENCLAW_MLX_TTS_BIN` zastępuje ścieżkę pomocnika na potrzeby rozwoju.
- `consultThinkingLevel` steruje poziomem myślenia dla pełnego uruchomienia agenta OpenClaw stojącego za wywołaniami Control UI Talk realtime `openclaw_agent_consult`. Pozostaw nieustawione, aby zachować normalne zachowanie sesji/modelu.
- `consultFastMode` ustawia jednorazowe zastąpienie trybu szybkiego dla konsultacji realtime Control UI Talk bez zmiany normalnego ustawienia trybu szybkiego sesji.
- `speechLocale` ustawia identyfikator ustawień regionalnych BCP 47 używany przez rozpoznawanie mowy Talk w iOS/macOS. Pozostaw nieustawione, aby użyć domyślnego ustawienia urządzenia.
- `silenceTimeoutMs` steruje tym, jak długo tryb Talk czeka po ciszy użytkownika, zanim wyśle transkrypcję. Brak ustawienia zachowuje domyślne dla platformy okno pauzy (`700 ms on macOS and Android, 900 ms on iOS`).
- `realtime.instructions` dołącza instrukcje systemowe widoczne dla dostawcy do wbudowanego promptu realtime OpenClaw, dzięki czemu styl głosu można skonfigurować bez utraty domyślnych wskazówek `openclaw_agent_consult`.
- `realtime.consultRouting` steruje fallbackiem przekaźnika Gateway, gdy dostawca realtime generuje końcową transkrypcję użytkownika bez `openclaw_agent_consult`: `provider-direct` zachowuje bezpośrednie odpowiedzi dostawcy, natomiast `force-agent-consult` kieruje sfinalizowane żądanie przez OpenClaw.

---

## Powiązane

- [Dokumentacja konfiguracji](/pl/gateway/configuration-reference) — wszystkie pozostałe klucze konfiguracji
- [Konfiguracja](/pl/gateway/configuration) — typowe zadania i szybka konfiguracja
- [Przykłady konfiguracji](/pl/gateway/configuration-examples)
