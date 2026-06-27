---
read_when:
    - Dostosowywanie ustawień domyślnych agenta (modele, thinking, workspace, Heartbeat, multimedia, Skills)
    - Konfigurowanie routingu i powiązań wieloagentowych
    - Dostosowywanie zachowania sesji, dostarczania wiadomości i trybu rozmowy
summary: Domyślne ustawienia agenta, routing wieloagentowy, sesja, wiadomości i konfiguracja rozmów
title: Konfiguracja — agenci
x-i18n:
    generated_at: "2026-06-27T17:31:36Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 3e5e5e1301e331b1a5dbf42e2396ee92d36297159015181f6263dcd59c8cd33c
    source_path: gateway/config-agents.md
    workflow: 16
---

Klucze konfiguracji o zakresie agenta pod `agents.*`, `multiAgent.*`, `session.*`,
`messages.*` i `talk.*`. Kanały, narzędzia, środowisko uruchomieniowe Gateway oraz inne
klucze najwyższego poziomu opisuje [Dokumentacja konfiguracji](/pl/gateway/configuration-reference).

## Domyślne ustawienia agentów

### `agents.defaults.workspace`

Domyślnie: `OPENCLAW_WORKSPACE_DIR`, gdy jest ustawione, w przeciwnym razie `~/.openclaw/workspace`.

```json5
{
  agents: { defaults: { workspace: "~/.openclaw/workspace" } },
}
```

Jawna wartość `agents.defaults.workspace` ma pierwszeństwo przed
`OPENCLAW_WORKSPACE_DIR`. Użyj zmiennej środowiskowej, aby wskazać domyślne agenty
na zamontowany obszar roboczy, gdy nie chcesz zapisywać tej ścieżki w konfiguracji.

### `agents.defaults.repoRoot`

Opcjonalny katalog główny repozytorium pokazywany w wierszu Runtime promptu systemowego. Jeśli nie jest ustawiony, OpenClaw wykrywa go automatycznie, idąc w górę od obszaru roboczego.

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
- Niepusta lista `agents.list[].skills` jest ostatecznym zestawem dla tego agenta; nie
  jest scalana z ustawieniami domyślnymi.

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

- `"continuation-skip"`: bezpieczne tury kontynuacji (po ukończonej odpowiedzi asystenta) pomijają ponowne wstrzykiwanie inicjalizacji obszaru roboczego, zmniejszając rozmiar promptu. Uruchomienia Heartbeat i ponowne próby po Compaction nadal odbudowują kontekst.
- `"never"`: wyłącza wstrzykiwanie inicjalizacji obszaru roboczego i plików kontekstu w każdej turze. Używaj tego tylko dla agentów, którzy w pełni kontrolują cykl życia swojego promptu (niestandardowe silniki kontekstu, natywne środowiska uruchomieniowe budujące własny kontekst albo wyspecjalizowane przepływy pracy bez inicjalizacji). Tury Heartbeat i odzyskiwania po Compaction także pomijają wstrzykiwanie.

```json5
{
  agents: { defaults: { contextInjection: "continuation-skip" } },
}
```

Nadpisanie dla agenta: `agents.list[].contextInjection`. Pominięte wartości dziedziczą
`agents.defaults.contextInjection`.

### `agents.defaults.bootstrapMaxChars`

Maksymalna liczba znaków na plik inicjalizacji obszaru roboczego przed obcięciem. Domyślnie: `20000`.

```json5
{
  agents: { defaults: { bootstrapMaxChars: 20000 } },
}
```

Nadpisanie dla agenta: `agents.list[].bootstrapMaxChars`. Pominięte wartości dziedziczą
`agents.defaults.bootstrapMaxChars`.

### `agents.defaults.bootstrapTotalMaxChars`

Maksymalna łączna liczba znaków wstrzykiwanych ze wszystkich plików inicjalizacji obszaru roboczego. Domyślnie: `60000`.

```json5
{
  agents: { defaults: { bootstrapTotalMaxChars: 60000 } },
}
```

Nadpisanie dla agenta: `agents.list[].bootstrapTotalMaxChars`. Pominięte wartości
dziedziczą `agents.defaults.bootstrapTotalMaxChars`.

### Nadpisania profilu inicjalizacji dla agenta

Użyj nadpisań profilu inicjalizacji dla agenta, gdy jeden agent potrzebuje innego zachowania
wstrzykiwania promptu niż współdzielone ustawienia domyślne. Pominięte pola dziedziczą z
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

Kontroluje widoczną dla agenta informację w prompcie systemowym, gdy kontekst inicjalizacji jest obcięty.
Domyślnie: `"always"`.

- `"off"`: nigdy nie wstrzykuj tekstu powiadomienia o obcięciu do promptu systemowego.
- `"once"`: wstrzyknij zwięzłe powiadomienie raz dla każdej unikalnej sygnatury obcięcia.
- `"always"`: wstrzykuj zwięzłe powiadomienie przy każdym uruchomieniu, gdy występuje obcięcie (zalecane).

Szczegółowe surowe/wstrzyknięte liczniki i pola dostrajania konfiguracji pozostają w diagnostyce,
takiej jak raporty stanu/kontekstu i logi; rutynowy kontekst użytkownika/środowiska uruchomieniowego WebChat
otrzymuje tylko zwięzłe powiadomienie odzyskiwania.

```json5
{
  agents: { defaults: { bootstrapPromptTruncationWarning: "always" } }, // off | once | always
}
```

### Mapa własności budżetu kontekstu

OpenClaw ma wiele dużych budżetów promptu/kontekstu, które są
celowo rozdzielone według podsystemu zamiast przechodzić przez jedno ogólne
pokrętło.

- `agents.defaults.bootstrapMaxChars` /
  `agents.defaults.bootstrapTotalMaxChars`:
  zwykłe wstrzykiwanie inicjalizacji obszaru roboczego.
- `agents.defaults.startupContext.*`:
  jednorazowy wstęp dla uruchomienia modelu po resecie/starcie, obejmujący ostatnie dzienne
  pliki `memory/*.md`. Same polecenia czatu `/new` i `/reset` są
  potwierdzane bez wywoływania modelu.
- `skills.limits.*`:
  kompaktowa lista Skills wstrzykiwana do promptu systemowego.
- `agents.defaults.contextLimits.*`:
  ograniczone fragmenty środowiska uruchomieniowego i wstrzyknięte bloki należące do środowiska uruchomieniowego.
- `memory.qmd.limits.*`:
  rozmiar fragmentu indeksowanego wyszukiwania pamięci i wstrzykiwania.

Użyj pasującego nadpisania dla agenta tylko wtedy, gdy jeden agent potrzebuje innego
budżetu:

- `agents.list[].skillsLimits.maxSkillsPromptChars`
- `agents.list[].contextInjection`
- `agents.list[].bootstrapMaxChars`
- `agents.list[].bootstrapTotalMaxChars`
- `agents.list[].contextLimits.*`

#### `agents.defaults.startupContext`

Kontroluje wstęp startowy pierwszej tury wstrzykiwany przy uruchomieniach modelu po resecie/starcie.
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

Współdzielone ustawienia domyślne dla ograniczonych powierzchni kontekstu środowiska uruchomieniowego.

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

- `memoryGetMaxChars`: domyślny limit fragmentu `memory_get` przed dodaniem
  metadanych obcięcia i powiadomienia o kontynuacji.
- `memoryGetDefaultLines`: domyślne okno wierszy `memory_get`, gdy `lines` jest
  pominięte.
- `toolResultMaxChars`: zaawansowany limit wyników narzędzi na żywo używany dla utrwalonych
  wyników i odzyskiwania po przepełnieniu. Pozostaw nieustawione dla automatycznego limitu kontekstu modelu:
  `16000` znaków poniżej 100K tokenów, `32000` znaków przy 100K+ tokenów i `64000`
  znaków przy 200K+ tokenów. Jawne wartości do `1000000` są akceptowane dla
  modeli z długim kontekstem, ale efektywny limit nadal jest ograniczony do około 30%
  okna kontekstu modelu. `openclaw doctor --deep` wypisuje efektywny limit,
  a doctor ostrzega tylko wtedy, gdy jawne nadpisanie jest nieaktualne lub nie ma efektu.
- `postCompactionMaxChars`: limit fragmentu AGENTS.md używany podczas wstrzykiwania
  odświeżenia po Compaction.

#### `agents.list[].contextLimits`

Nadpisanie dla agenta dla współdzielonych pokręteł `contextLimits`. Pominięte pola dziedziczą
z `agents.defaults.contextLimits`.

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
          toolResultMaxChars: 8000, // advanced ceiling for this agent
        },
      },
    ],
  },
}
```

#### `skills.limits.maxSkillsPromptChars`

Globalny limit dla kompaktowej listy Skills wstrzykiwanej do promptu systemowego. Nie
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

Maksymalny rozmiar w pikselach dla najdłuższego boku obrazu w blokach obrazu transkryptu/narzędzia przed wywołaniami dostawcy.
Domyślnie: `1200`.

Niższe wartości zwykle zmniejszają użycie tokenów wizyjnych i rozmiar ładunku żądania przy uruchomieniach z dużą liczbą zrzutów ekranu.
Wyższe wartości zachowują więcej szczegółów wizualnych.

```json5
{
  agents: { defaults: { imageMaxDimensionPx: 1200 } },
}
```

### `agents.defaults.imageQuality`

Preferencja kompresji/szczegółowości narzędzia obrazów dla obrazów ładowanych ze ścieżek plików, URL-i i odniesień do multimediów.
Domyślnie: `auto`.

OpenClaw dostosowuje drabinkę zmiany rozmiaru do wybranego modelu obrazów. Na przykład Claude Opus 4.8, OpenAI GPT-5.5, Qwen VL i hostowane modele wizyjne Llama 4 mogą używać większych obrazów niż starsze/domyślne ścieżki wizyjne o wysokiej szczegółowości, podczas gdy tury z wieloma obrazami są kompresowane bardziej agresywnie w trybie `auto`, aby kontrolować koszt tokenów i opóźnienia.

Wartości:

- `auto`: dostosuj do limitów modelu i liczby obrazów.
- `efficient`: preferuj mniejsze obrazy dla niższego użycia tokenów i bajtów.
- `balanced`: użyj standardowej pośredniej drabinki.
- `high`: zachowaj więcej szczegółów dla zrzutów ekranu, diagramów i obrazów dokumentów.

```json5
{
  agents: { defaults: { imageQuality: "auto" } },
}
```

### `agents.defaults.userTimezone`

Strefa czasowa dla kontekstu promptu systemowego (nie znaczników czasu wiadomości). Używa strefy czasowej hosta jako wartości zastępczej.

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
  - Forma obiektu ustawia model podstawowy oraz uporządkowane modele przełączenia awaryjnego.
- `imageModel`: akceptuje ciąg znaków (`"provider/model"`) albo obiekt (`{ primary, fallbacks }`).
  - Używane przez ścieżkę narzędzia `image` jako konfiguracja modelu wizyjnego.
  - Używane także jako routing awaryjny, gdy wybrany/domyślny model nie może przyjmować wejścia obrazowego.
  - Preferuj jawne referencje `provider/model`. Surowe identyfikatory są akceptowane ze względu na zgodność; jeśli surowy identyfikator jednoznacznie pasuje do skonfigurowanego wpisu obsługującego obrazy w `models.providers.*.models`, OpenClaw kwalifikuje go do tego dostawcy. Niejednoznaczne skonfigurowane dopasowania wymagają jawnego prefiksu dostawcy.
- `imageGenerationModel`: akceptuje ciąg znaków (`"provider/model"`) albo obiekt (`{ primary, fallbacks }`).
  - Używane przez współdzieloną funkcję generowania obrazów oraz każdą przyszłą powierzchnię narzędzia/Pluginu, która generuje obrazy.
  - Typowe wartości: `google/gemini-3.1-flash-image-preview` dla natywnego generowania obrazów Gemini, `fal/fal-ai/flux/dev` dla fal, `openai/gpt-image-2` dla OpenAI Images albo `openai/gpt-image-1.5` dla wyjścia OpenAI PNG/WebP z przezroczystym tłem.
  - Jeśli wybierzesz dostawcę/model bezpośrednio, skonfiguruj też pasujące uwierzytelnianie dostawcy (na przykład `GEMINI_API_KEY` albo `GOOGLE_API_KEY` dla `google/*`, `OPENAI_API_KEY` albo OpenAI Codex OAuth dla `openai/gpt-image-2` / `openai/gpt-image-1.5`, `FAL_KEY` dla `fal/*`).
  - Jeśli pominięto, `image_generate` nadal może wywnioskować domyślnego dostawcę wspieranego uwierzytelnianiem. Najpierw próbuje bieżącego domyślnego dostawcy, a następnie pozostałych zarejestrowanych dostawców generowania obrazów w kolejności identyfikatorów dostawców.
- `musicGenerationModel`: akceptuje ciąg znaków (`"provider/model"`) albo obiekt (`{ primary, fallbacks }`).
  - Używane przez współdzieloną funkcję generowania muzyki oraz wbudowane narzędzie `music_generate`.
  - Typowe wartości: `google/lyria-3-clip-preview`, `google/lyria-3-pro-preview` albo `minimax/music-2.6`.
  - Jeśli pominięto, `music_generate` nadal może wywnioskować domyślnego dostawcę wspieranego uwierzytelnianiem. Najpierw próbuje bieżącego domyślnego dostawcy, a następnie pozostałych zarejestrowanych dostawców generowania muzyki w kolejności identyfikatorów dostawców.
  - Jeśli wybierzesz dostawcę/model bezpośrednio, skonfiguruj też pasujące uwierzytelnianie dostawcy / klucz API.
- `videoGenerationModel`: akceptuje ciąg znaków (`"provider/model"`) albo obiekt (`{ primary, fallbacks }`).
  - Używane przez współdzieloną funkcję generowania wideo oraz wbudowane narzędzie `video_generate`.
  - Typowe wartości: `qwen/wan2.6-t2v`, `qwen/wan2.6-i2v`, `qwen/wan2.6-r2v`, `qwen/wan2.6-r2v-flash` albo `qwen/wan2.7-r2v`.
  - Jeśli pominięto, `video_generate` nadal może wywnioskować domyślnego dostawcę wspieranego uwierzytelnianiem. Najpierw próbuje bieżącego domyślnego dostawcy, a następnie pozostałych zarejestrowanych dostawców generowania wideo w kolejności identyfikatorów dostawców.
  - Jeśli wybierzesz dostawcę/model bezpośrednio, skonfiguruj też pasujące uwierzytelnianie dostawcy / klucz API.
  - Oficjalny Plugin generowania wideo Qwen obsługuje maksymalnie 1 wyjściowe wideo, 1 obraz wejściowy, 4 wideo wejściowe, czas trwania 10 sekund oraz opcje na poziomie dostawcy `size`, `aspectRatio`, `resolution`, `audio` i `watermark`.
- `pdfModel`: akceptuje ciąg znaków (`"provider/model"`) albo obiekt (`{ primary, fallbacks }`).
  - Używane przez narzędzie `pdf` do routingu modeli.
  - Jeśli pominięto, narzędzie PDF wraca do `imageModel`, a następnie do rozwiązanego modelu sesji/domyślnego.
- `pdfMaxBytesMb`: domyślny limit rozmiaru PDF dla narzędzia `pdf`, gdy `maxBytesMb` nie zostanie przekazane podczas wywołania.
- `pdfMaxPages`: domyślna maksymalna liczba stron uwzględnianych przez tryb awaryjny ekstrakcji w narzędziu `pdf`.
- `verboseDefault`: domyślny poziom szczegółowości dla agentów. Wartości: `"off"`, `"on"`, `"full"`. Domyślnie: `"off"`.
- `toolProgressDetail`: tryb szczegółowości dla podsumowań narzędzi `/verbose` oraz wierszy narzędzi w roboczych komunikatach postępu. Wartości: `"explain"` (domyślna, zwarte etykiety czytelne dla człowieka) albo `"raw"` (dołącz surowe polecenie/szczegół, gdy jest dostępne). `agents.list[].toolProgressDetail` na poziomie agenta zastępuje tę wartość domyślną.
- `reasoningDefault`: domyślna widoczność rozumowania dla agentów. Wartości: `"off"`, `"on"`, `"stream"`. `agents.list[].reasoningDefault` na poziomie agenta zastępuje tę wartość domyślną. Skonfigurowane wartości domyślne rozumowania są stosowane tylko dla właścicieli, autoryzowanych nadawców albo kontekstów operatora-administratora Gateway, gdy nie ustawiono zastąpienia rozumowania dla wiadomości ani sesji.
- `elevatedDefault`: domyślny poziom wyjścia podwyższonego dla agentów. Wartości: `"off"`, `"on"`, `"ask"`, `"full"`. Domyślnie: `"on"`.
- `model.primary`: format `provider/model` (np. `openai/gpt-5.5` dla dostępu przez klucz API OpenAI albo Codex OAuth). Jeśli pominiesz dostawcę, OpenClaw najpierw próbuje aliasu, następnie unikatowego dopasowania skonfigurowanego dostawcy dla dokładnie tego identyfikatora modelu, a dopiero potem wraca do skonfigurowanego domyślnego dostawcy (przestarzałe zachowanie zgodnościowe, dlatego preferuj jawne `provider/model`). Jeśli ten dostawca nie udostępnia już skonfigurowanego modelu domyślnego, OpenClaw wraca do pierwszego skonfigurowanego dostawcy/modelu zamiast ujawniać nieaktualną wartość domyślną usuniętego dostawcy.
- `models`: skonfigurowany katalog modeli i lista dozwolonych dla `/model`. Każdy wpis może zawierać `alias` (skrót) i `params` (specyficzne dla dostawcy, na przykład `temperature`, `maxTokens`, `cacheRetention`, `context1m`, `responsesServerCompaction`, `responsesCompactThreshold`, routing OpenRouter `provider`, `chat_template_kwargs`, `extra_body`/`extraBody`).
  - Użyj wpisów `provider/*`, takich jak `"openai/*": {}` albo `"vllm/*": {}`, aby pokazać wszystkie wykryte modele dla wybranych dostawców bez ręcznego wypisywania każdego identyfikatora modelu.
  - Dodaj `agentRuntime` do wpisu `provider/*`, gdy każdy dynamicznie wykryty model dla tego dostawcy powinien używać tego samego środowiska uruchomieniowego. Dokładna polityka środowiska uruchomieniowego `provider/model` nadal ma pierwszeństwo przed symbolem wieloznacznym.
  - Bezpieczne edycje: użyj `openclaw config set agents.defaults.models '<json>' --strict-json --merge`, aby dodać wpisy. `config set` odmawia zastąpień, które usunęłyby istniejące wpisy listy dozwolonych, chyba że przekażesz `--replace`.
  - Przepływy konfiguracji/wdrażania ograniczone do dostawcy scalają wybrane modele dostawcy z tą mapą i zachowują już skonfigurowanych, niepowiązanych dostawców.
  - Dla bezpośrednich modeli OpenAI Responses Compaction po stronie serwera jest włączana automatycznie. Użyj `params.responsesServerCompaction: false`, aby przestać wstrzykiwać `context_management`, albo `params.responsesCompactThreshold`, aby zastąpić próg. Zobacz [Compaction po stronie serwera OpenAI](/pl/providers/openai#server-side-compaction-responses-api).
- `params`: globalne domyślne parametry dostawcy stosowane do wszystkich modeli. Ustawiane w `agents.defaults.params` (np. `{ cacheRetention: "long" }`).
- Pierwszeństwo scalania `params` (konfiguracja): `agents.defaults.params` (globalna baza) jest zastępowane przez `agents.defaults.models["provider/model"].params` (dla modelu), a następnie `agents.list[].params` (pasujący identyfikator agenta) zastępuje według klucza. Szczegóły znajdziesz w [buforowaniu promptów](/pl/reference/prompt-caching).
- `models.providers.openrouter.params.provider`: domyślna polityka routingu dostawcy dla całego OpenRouter. OpenClaw przekazuje ją do obiektu `provider` żądania OpenRouter; `agents.defaults.models["openrouter/<model>"].params.provider` dla modelu oraz parametry agenta zastępują według klucza. Zobacz [routing dostawców OpenRouter](/pl/providers/openrouter#advanced-configuration).
- `params.extra_body`/`params.extraBody`: zaawansowany przepuszczany JSON scalany z treściami żądań `api: "openai-completions"` dla proxy zgodnych z OpenAI. Jeśli koliduje z wygenerowanymi kluczami żądania, dodatkowa treść ma pierwszeństwo; nienatywne trasy completions nadal później usuwają `store` specyficzne dla OpenAI.
- `params.chat_template_kwargs`: argumenty szablonu czatu zgodne z vLLM/OpenAI scalane z najwyższym poziomem treści żądań `api: "openai-completions"`. Dla `vllm/nemotron-3-*` przy wyłączonym myśleniu dołączony Plugin vLLM automatycznie wysyła `enable_thinking: false` i `force_nonempty_content: true`; jawne `chat_template_kwargs` zastępują wygenerowane wartości domyślne, a `extra_body.chat_template_kwargs` nadal ma ostateczne pierwszeństwo. Skonfigurowane modele myślenia vLLM Qwen i Nemotron udostępniają binarne wybory `/think` (`off`, `on`) zamiast wielopoziomowej drabiny nakładu.
- `compat.thinkingFormat`: styl ładunku myślenia zgodny z OpenAI. Użyj `"together"` dla stylu Together `reasoning.enabled`, `"qwen"` dla stylu Qwen z najwyższym poziomem `enable_thinking` albo `"qwen-chat-template"` dla `chat_template_kwargs.enable_thinking` w backendach z rodziny Qwen obsługujących argumenty szablonu czatu na poziomie żądania, takich jak vLLM. OpenClaw mapuje wyłączone myślenie na `false`, a włączone myślenie na `true`; skonfigurowane modele vLLM Qwen udostępniają binarne wybory `/think` dla tych formatów.
- `compat.supportedReasoningEfforts`: lista nakładów rozumowania zgodna z OpenAI dla modelu. Uwzględnij `"xhigh"` dla niestandardowych endpointów, które faktycznie je akceptują; OpenClaw udostępni wtedy `/think xhigh` w menu poleceń, wierszach sesji Gateway, walidacji poprawek sesji, walidacji CLI agenta oraz walidacji `llm-task` dla tego skonfigurowanego dostawcy/modelu. Użyj `compat.reasoningEffortMap`, gdy backend oczekuje wartości specyficznej dla dostawcy dla poziomu kanonicznego.
- `params.preserveThinking`: wyłącznie dla Z.AI zgoda na zachowane myślenie. Po włączeniu i przy włączonym myśleniu OpenClaw wysyła `thinking.clear_thinking: false` i odtwarza wcześniejsze `reasoning_content`; zobacz [myślenie i zachowane myślenie Z.AI](/pl/providers/zai#thinking-and-preserved-thinking).
- `localService`: opcjonalny menedżer procesów na poziomie dostawcy dla lokalnych/samodzielnie hostowanych serwerów modeli. Gdy wybrany model należy do tego dostawcy, OpenClaw sonduje `healthUrl` (albo `baseUrl + "/models"`), uruchamia `command` z `args`, jeśli endpoint nie działa, czeka do `readyTimeoutMs`, a następnie wysyła żądanie modelu. `command` musi być ścieżką bezwzględną. `idleStopMs: 0` utrzymuje proces przy życiu do zamknięcia OpenClaw; wartość dodatnia zatrzymuje proces uruchomiony przez OpenClaw po tylu milisekundach bezczynności. Zobacz [lokalne usługi modeli](/pl/gateway/local-model-services).
- Polityka środowiska uruchomieniowego należy do dostawców albo modeli, nie do `agents.defaults`. Użyj `models.providers.<provider>.agentRuntime` dla reguł obejmujących dostawcę albo `agents.defaults.models["provider/model"].agentRuntime` / `agents.list[].models["provider/model"].agentRuntime` dla reguł specyficznych dla modelu. Modele agentów OpenAI u oficjalnego dostawcy OpenAI domyślnie wybierają Codex.
- Programy zapisujące konfigurację, które modyfikują te pola (na przykład `/models set`, `/models set-image` oraz polecenia dodawania/usuwania wariantów awaryjnych), zapisują kanoniczną formę obiektu i zachowują istniejące listy awaryjne, gdy to możliwe.
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

- `id`: `"auto"`, `"openclaw"`, identyfikator zarejestrowanej uprzęży Plugin albo obsługiwany alias zaplecza CLI. Wbudowany Plugin Codex rejestruje `codex`; wbudowany Plugin Anthropic udostępnia zaplecze CLI `claude-cli`.
- `id: "auto"` pozwala zarejestrowanym uprzężom Plugin przejmować obsługiwane tury i używa OpenClaw, gdy żadna uprząż nie pasuje. Jawne środowisko wykonawcze Plugin, takie jak `id: "codex"`, wymaga tej uprzęży i zamyka się awaryjnie, jeśli jest niedostępna albo zawiedzie.
- `id: "pi"` jest akceptowane tylko jako przestarzały alias dla `openclaw`, aby zachować wysłane konfiguracje z wersji v2026.5.22 i wcześniejszych. Nowa konfiguracja powinna używać `openclaw`.
- Priorytet środowiska wykonawczego zaczyna się od dokładnej polityki modelu (`agents.list[].models["provider/model"]`, `agents.defaults.models["provider/model"]` albo `models.providers.<provider>.models[]`), następnie `agents.list[]` / `agents.defaults.models["provider/*"]`, a potem polityka całego dostawcy w `models.providers.<provider>.agentRuntime`.
- Klucze środowiska wykonawczego całego agenta są starszym mechanizmem. `agents.defaults.agentRuntime`, `agents.list[].agentRuntime`, przypięcia środowiska wykonawczego sesji oraz `OPENCLAW_AGENT_RUNTIME` są ignorowane przez wybór środowiska wykonawczego. Uruchom `openclaw doctor --fix`, aby usunąć nieaktualne wartości.
- Modele agentów OpenAI domyślnie używają uprzęży Codex; `agentRuntime.id: "codex"` dostawcy/modelu pozostaje prawidłowe, gdy chcesz to ustawić jawnie.
- Dla wdrożeń Claude CLI preferuj `model: "anthropic/claude-opus-4-8"` oraz modelowy zakres `agentRuntime.id: "claude-cli"`. Starsze odwołania do modeli `claude-cli/claude-opus-4-7` nadal działają ze względu na zgodność, ale nowa konfiguracja powinna utrzymywać kanoniczny wybór dostawcy/modelu i umieszczać zaplecze wykonawcze w polityce środowiska wykonawczego dostawcy/modelu.
- To steruje tylko wykonywaniem tekstowych tur agenta. Generowanie mediów, wizja, PDF, muzyka, wideo i TTS nadal używają swoich ustawień dostawcy/modelu.

**Wbudowane skróty aliasów** (mają zastosowanie tylko wtedy, gdy model jest w `agents.defaults.models`):

| Alias               | Model                           |
| ------------------- | ------------------------------- |
| `opus`              | `anthropic/claude-opus-4-6`     |
| `sonnet`            | `anthropic/claude-sonnet-4-6`   |
| `gpt`               | `openai/gpt-5.5`                |
| `gpt-mini`          | `openai/gpt-5.4-mini`           |
| `gpt-nano`          | `openai/gpt-5.4-nano`           |
| `gemini`            | `google/gemini-3.1-pro-preview` |
| `gemini-flash`      | `google/gemini-3-flash-preview` |
| `gemini-flash-lite` | `google/gemini-3.1-flash-lite`  |

Skonfigurowane aliasy zawsze mają pierwszeństwo przed wartościami domyślnymi.

Modele Z.AI GLM-4.x automatycznie włączają tryb myślenia, chyba że ustawisz `--thinking off` albo samodzielnie zdefiniujesz `agents.defaults.models["zai/<model>"].params.thinking`.
Modele Z.AI domyślnie włączają `tool_stream` dla strumieniowania wywołań narzędzi. Ustaw `agents.defaults.models["zai/<model>"].params.tool_stream` na `false`, aby to wyłączyć.
Anthropic Claude Opus 4.8 w OpenClaw domyślnie utrzymuje myślenie wyłączone; gdy myślenie adaptacyjne jest jawnie włączone, domyślny wysiłek należący do dostawcy Anthropic to `high`. Modele Claude 4.6 domyślnie używają `adaptive`, gdy nie ustawiono jawnego poziomu myślenia.

### `agents.defaults.cliBackends`

Opcjonalne zaplecza CLI dla wyłącznie tekstowych uruchomień awaryjnych (bez wywołań narzędzi). Przydatne jako rezerwa, gdy dostawcy API zawiodą.

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

- Zaplecza CLI są najpierw tekstowe; narzędzia są zawsze wyłączone.
- Sesje są obsługiwane, gdy ustawiono `sessionArg`.
- Przekazywanie obrazów jest obsługiwane, gdy `imageArg` akceptuje ścieżki plików.
- `reseedFromRawTranscriptWhenUncompacted: true` pozwala zapleczu odzyskiwać bezpieczne
  unieważnione sesje z ograniczonego końca surowego transkryptu OpenClaw przed
  pojawieniem się pierwszego podsumowania Compaction. Zmiany profilu uwierzytelniania lub epoki poświadczeń
  nadal nigdy nie używają ponownego zasiania z surowego transkryptu.

### `agents.defaults.promptOverlays`

Niezależne od dostawcy nakładki promptu stosowane według rodziny modeli na powierzchniach promptów składanych przez OpenClaw. Identyfikatory modeli z rodziny GPT-5 otrzymują wspólny kontrakt zachowania na trasach OpenClaw/dostawcy; `personality` steruje tylko przyjazną warstwą stylu interakcji. Natywne trasy serwera aplikacji Codex zachowują instrukcje bazowe/modelowe należące do Codex zamiast tej nakładki OpenClaw GPT-5, a OpenClaw wyłącza wbudowaną osobowość Codex dla natywnych wątków.

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

- `every`: ciąg czasu trwania (ms/s/m/h). Domyślnie: `30m` (uwierzytelnianie kluczem API) albo `1h` (uwierzytelnianie OAuth). Ustaw `0m`, aby wyłączyć.
- `includeSystemPromptSection`: gdy ma wartość false, pomija sekcję Heartbeat w prompcie systemowym i pomija wstrzykiwanie `HEARTBEAT.md` do kontekstu startowego. Domyślnie: `true`.
- `suppressToolErrorWarnings`: gdy ma wartość true, wycisza ładunki ostrzeżeń o błędach narzędzi podczas uruchomień Heartbeat.
- `timeoutSeconds`: maksymalny czas w sekundach dozwolony dla tury agenta Heartbeat przed jej przerwaniem. Pozostaw nieustawione, aby użyć `agents.defaults.timeoutSeconds`, gdy jest ustawione, w przeciwnym razie kadencja Heartbeat zostanie ograniczona do 600 sekund.
- `directPolicy`: polityka dostarczania bezpośredniego/DM. `allow` (domyślnie) zezwala na dostarczanie do celu bezpośredniego. `block` tłumi dostarczanie do celu bezpośredniego i emituje `reason=dm-blocked`.
- `lightContext`: gdy ma wartość true, uruchomienia Heartbeat używają lekkiego kontekstu startowego i zachowują tylko `HEARTBEAT.md` z plików startowych obszaru roboczego.
- `isolatedSession`: gdy ma wartość true, każde Heartbeat działa w świeżej sesji bez wcześniejszej historii rozmowy. Ten sam wzorzec izolacji co Cron `sessionTarget: "isolated"`. Zmniejsza koszt tokenów na Heartbeat z około 100 tys. do około 2-5 tys. tokenów.
- `skipWhenBusy`: gdy ma wartość true, uruchomienia Heartbeat są odraczane na dodatkowych zajętych pasach tego agenta: jego własnym podagencie z kluczem sesji albo zagnieżdżonej pracy polecenia. Pasy Cron zawsze odraczają Heartbeat, nawet bez tej flagi.
- Na agenta: ustaw `agents.list[].heartbeat`. Gdy dowolny agent definiuje `heartbeat`, **tylko ci agenci** uruchamiają Heartbeat.
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
- `provider`: identyfikator zarejestrowanego Plugina dostawcy Compaction. Gdy jest ustawiony, wywoływane jest `summarize()` dostawcy zamiast wbudowanego podsumowywania LLM. W razie niepowodzenia następuje powrót do wbudowanego mechanizmu. Ustawienie dostawcy wymusza `mode: "safeguard"`. Zobacz [Compaction](/pl/concepts/compaction).
- `timeoutSeconds`: maksymalna liczba sekund dozwolona dla pojedynczej operacji Compaction, zanim OpenClaw ją przerwie. Domyślnie: `180`.
- `keepRecentTokens`: budżet punktu odcięcia agenta na zachowanie najnowszego końca transkryptu dosłownie. Ręczne `/compact` honoruje to, gdy jest ustawione jawnie; w przeciwnym razie ręczna Compaction jest twardym punktem kontrolnym.
- `identifierPolicy`: `strict` (domyślnie), `off` lub `custom`. `strict` dodaje na początku wbudowane wskazówki dotyczące zachowywania nieprzezroczystych identyfikatorów podczas podsumowywania Compaction.
- `identifierInstructions`: opcjonalny niestandardowy tekst dotyczący zachowywania identyfikatorów, używany gdy `identifierPolicy=custom`.
- `qualityGuard`: kontrole ponawiania przy niepoprawnie sformatowanym wyniku dla podsumowań safeguard. Domyślnie włączone w trybie safeguard; ustaw `enabled: false`, aby pominąć audyt.
- `midTurnPrecheck`: opcjonalna kontrola presji pętli narzędzi. Gdy `enabled: true`, OpenClaw sprawdza presję kontekstu po dołączeniu wyników narzędzi i przed następnym wywołaniem modelu. Jeśli kontekst już się nie mieści, przerywa bieżącą próbę przed przesłaniem promptu i ponownie używa istniejącej ścieżki odzyskiwania precheck, aby przyciąć wyniki narzędzi albo wykonać Compaction i ponowić próbę. Działa z trybami Compaction `default` i `safeguard`. Domyślnie: wyłączone.
- `postCompactionSections`: opcjonalne nazwy sekcji H2/H3 z AGENTS.md do ponownego wstrzyknięcia po Compaction. Ponowne wstrzykiwanie jest wyłączone, gdy nie ustawiono wartości albo ustawiono `[]`. Jawne ustawienie `["Session Startup", "Red Lines"]` włącza tę parę i zachowuje starszy fallback `Every Session`/`Safety`. Włączaj to tylko wtedy, gdy dodatkowy kontekst jest wart ryzyka powielenia wskazówek projektu już ujętych w podsumowaniu Compaction.
- `model`: opcjonalne `provider/model-id` albo goły alias z `agents.defaults.models` tylko dla podsumowywania Compaction. Gołe aliasy są rozwiązywane przed wysłaniem; skonfigurowane dosłowne identyfikatory modeli zachowują pierwszeństwo przy kolizjach. Użyj tego, gdy główna sesja ma zachować jeden model, ale podsumowania Compaction mają działać na innym; gdy nie ustawiono, Compaction używa głównego modelu sesji.
- `maxActiveTranscriptBytes`: opcjonalny próg bajtów (`number` albo ciągi takie jak `"20mb"`), który uruchamia normalną lokalną Compaction przed uruchomieniem, gdy aktywny JSONL przekroczy próg. Wymaga `truncateAfterCompaction`, aby udana Compaction mogła obrócić transkrypt na mniejszy następny transkrypt. Wyłączone, gdy nie ustawiono albo ustawiono `0`.
- `notifyUser`: gdy `true`, wysyła krótkie powiadomienia do użytkownika, gdy Compaction się zaczyna i gdy się kończy (na przykład „Kompaktowanie kontekstu...” i „Compaction ukończona”). Domyślnie wyłączone, aby Compaction pozostawała cicha.
- `memoryFlush`: cicha agentowa tura przed automatyczną Compaction do przechowywania trwałych wspomnień. Ustaw `model` na dokładny dostawca/model, taki jak `ollama/qwen3:8b`, gdy ta tura porządkowa ma pozostać na modelu lokalnym; nadpisanie nie dziedziczy aktywnego łańcucha fallback sesji. Pomijane, gdy workspace jest tylko do odczytu.

### `agents.defaults.runRetries`

Granice iteracji ponawiania zewnętrznej pętli uruchomienia dla osadzonego runtime agenta, aby zapobiec nieskończonym pętlom wykonania podczas odzyskiwania po awarii. Zauważ, że to ustawienie obecnie dotyczy tylko osadzonego runtime agenta, a nie runtime ACP ani CLI.

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

- `base`: bazowa liczba iteracji ponawiania uruchomienia dla zewnętrznej pętli uruchomienia. Domyślnie: `24`.
- `perProfile`: dodatkowe iteracje ponawiania uruchomienia przyznawane dla każdego kandydata profilu fallback. Domyślnie: `8`.
- `min`: minimalny bezwzględny limit iteracji ponawiania uruchomienia. Domyślnie: `32`.
- `max`: maksymalny bezwzględny limit iteracji ponawiania uruchomienia, aby zapobiec niekontrolowanemu wykonaniu. Domyślnie: `160`.

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

<Accordion title="cache-ttl mode behavior">

- `mode: "cache-ttl"` włącza przebiegi przycinania.
- `ttl` kontroluje, jak często przycinanie może zostać ponownie uruchomione (po ostatnim dotknięciu cache).
- Przycinanie najpierw miękko skraca zbyt duże wyniki narzędzi, a następnie w razie potrzeby twardo czyści starsze wyniki narzędzi.
- `softTrimRatio` i `hardClearRatio` przyjmują wartości od `0.0` do `1.0`; walidacja konfiguracji odrzuca wartości spoza tego zakresu.

**Miękkie skracanie** zachowuje początek i koniec oraz wstawia `...` w środku.

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
- Nadpisania kanałów: `channels.<channel>.blockStreamingCoalesce` (oraz warianty per konto). Signal/Slack/Discord/Google Chat domyślnie używają `minChars: 1500`.
- `humanDelay`: losowa pauza między odpowiedziami blokowymi. `natural` = 800–2500 ms. Nadpisanie per agent: `agents.list[].humanDelay`.

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

- Domyślnie: `instant` dla czatów bezpośrednich/wzmianek, `message` dla niewspomnianych czatów grupowych.
- Nadpisania per sesja: `session.typingMode`, `session.typingIntervalSeconds`.

Zobacz [Wskaźniki pisania](/pl/concepts/typing-indicators).

<a id="agentsdefaultssandbox"></a>

### `agents.defaults.sandbox`

Opcjonalny sandboxing dla osadzonego agenta. Pełny przewodnik znajdziesz w [Sandboxing](/pl/gateway/sandboxing).

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

<Accordion title="Sandbox details">

**Backend:**

- `docker`: lokalny runtime Docker (domyślnie)
- `ssh`: ogólny zdalny runtime oparty na SSH
- `openshell`: runtime OpenShell

Gdy wybrano `backend: "openshell"`, ustawienia specyficzne dla runtime przechodzą do
`plugins.entries.openshell.config`.

**Konfiguracja backendu SSH:**

- `target`: cel SSH w formie `user@host[:port]`
- `command`: polecenie klienta SSH (domyślnie: `ssh`)
- `workspaceRoot`: bezwzględny zdalny katalog główny używany dla workspace'ów per zakres
- `identityFile` / `certificateFile` / `knownHostsFile`: istniejące pliki lokalne przekazywane do OpenSSH
- `identityData` / `certificateData` / `knownHostsData`: treści inline albo SecretRefs, które OpenClaw materializuje w plikach tymczasowych w czasie działania
- `strictHostKeyChecking` / `updateHostKeys`: pokrętła polityki kluczy hosta OpenSSH

**Pierwszeństwo uwierzytelniania SSH:**

- `identityData` ma pierwszeństwo przed `identityFile`
- `certificateData` ma pierwszeństwo przed `certificateFile`
- `knownHostsData` ma pierwszeństwo przed `knownHostsFile`
- Wartości `*Data` oparte na SecretRef są rozwiązywane z aktywnego snapshotu runtime sekretów przed rozpoczęciem sesji sandbox

**Zachowanie backendu SSH:**

- zasiewa zdalny workspace raz po utworzeniu albo ponownym utworzeniu
- następnie utrzymuje zdalny workspace SSH jako kanoniczny
- kieruje `exec`, narzędzia plikowe i ścieżki mediów przez SSH
- nie synchronizuje automatycznie zdalnych zmian z powrotem do hosta
- nie obsługuje kontenerów przeglądarki sandbox

**Dostęp do workspace:**

- `none`: workspace sandbox per zakres pod `~/.openclaw/sandboxes`
- `ro`: workspace sandbox pod `/workspace`, workspace agenta zamontowany tylko do odczytu pod `/agent`
- `rw`: workspace agenta zamontowany do odczytu/zapisu pod `/workspace`

**Zakres:**

- `session`: kontener i workspace per sesja
- `agent`: jeden kontener i workspace na agenta (domyślnie)
- `shared`: współdzielony kontener i workspace (bez izolacji między sesjami)

**Konfiguracja Plugina OpenShell:**

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

- `mirror`: zasiej zdalne środowisko z lokalnego przed wykonaniem, zsynchronizuj z powrotem po wykonaniu; lokalny obszar roboczy pozostaje kanoniczny
- `remote`: zasiej zdalne środowisko raz podczas tworzenia piaskownicy, a potem utrzymuj zdalny obszar roboczy jako kanoniczny

W trybie `remote` lokalne dla hosta edycje wykonane poza OpenClaw nie są automatycznie synchronizowane do piaskownicy po kroku zasiania.
Transport odbywa się przez SSH do piaskownicy OpenShell, ale Plugin odpowiada za cykl życia piaskownicy i opcjonalną synchronizację lustrzaną.

**`setupCommand`** uruchamia się raz po utworzeniu kontenera (przez `sh -lc`). Wymaga wyjścia do sieci, zapisywalnego katalogu głównego i użytkownika root.

**Kontenery domyślnie używają `network: "none"`** — ustaw `"bridge"` (lub niestandardową sieć bridge), jeśli agent potrzebuje dostępu wychodzącego.
`"host"` jest blokowane. `"container:<id>"` jest domyślnie blokowane, chyba że jawnie ustawisz
`sandbox.docker.dangerouslyAllowContainerNamespaceJoin: true` (awaryjne obejście).
Tury app-server Codex w aktywnej piaskownicy OpenClaw używają tego samego ustawienia wyjścia do sieci dla natywnego dostępu sieciowego w trybie kodu.

**Załączniki przychodzące** są umieszczane w `media/inbound/*` w aktywnym obszarze roboczym.

**`docker.binds`** montuje dodatkowe katalogi hosta; powiązania globalne i per-agent są scalane.

**Przeglądarka w piaskownicy** (`sandbox.browser.enabled`): Chromium + CDP w kontenerze. Adres URL noVNC wstrzykiwany do promptu systemowego. Nie wymaga `browser.enabled` w `openclaw.json`.
Dostęp obserwatora noVNC domyślnie używa uwierzytelniania VNC, a OpenClaw emituje krótkotrwały adres URL z tokenem (zamiast ujawniać hasło we współdzielonym adresie URL).

- `allowHostControl: false` (domyślnie) blokuje sesjom w piaskownicy możliwość wskazywania przeglądarki hosta jako celu.
- `network` domyślnie ma wartość `openclaw-sandbox-browser` (dedykowana sieć bridge). Ustaw `bridge` tylko wtedy, gdy jawnie chcesz globalnej łączności bridge.
- `cdpSourceRange` opcjonalnie ogranicza wejście CDP na granicy kontenera do zakresu CIDR (na przykład `172.21.0.1/32`).
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
  - `OPENCLAW_BROWSER_DISABLE_EXTENSIONS=0` ponownie włącza rozszerzenia, jeśli Twój przepływ pracy
    od nich zależy.
  - `--renderer-process-limit=2` można zmienić za pomocą
    `OPENCLAW_BROWSER_RENDERER_PROCESS_LIMIT=<N>`; ustaw `0`, aby użyć domyślnego
    limitu procesów Chromium.
  - plus `--no-sandbox`, gdy `noSandbox` jest włączone.
  - Wartości domyślne są bazą obrazu kontenera; użyj niestandardowego obrazu przeglądarki z niestandardowym
    punktem wejścia, aby zmienić domyślne ustawienia kontenera.

</Accordion>

Piaskownica przeglądarki i `sandbox.docker.binds` działają tylko z Dockerem.

Zbuduj obrazy (z checkoutu źródeł):

```bash
scripts/sandbox-setup.sh           # main sandbox image
scripts/sandbox-browser-setup.sh   # optional browser image
```

W przypadku instalacji npm bez checkoutu źródeł zobacz [Piaskownica § Obrazy i konfiguracja](/pl/gateway/sandboxing#images-and-setup), aby użyć wbudowanych poleceń `docker build`.

### `agents.list` (nadpisania per-agent)

Użyj `agents.list[].tts`, aby nadać agentowi własnego dostawcę TTS, głos, model,
styl lub tryb automatycznego TTS. Blok agenta jest głęboko scalany z globalnym
`messages.tts`, więc współdzielone dane uwierzytelniające mogą pozostać w jednym miejscu, a poszczególni
agenci nadpisują tylko potrzebne im pola głosu lub dostawcy. Nadpisanie aktywnego agenta
dotyczy automatycznych odpowiedzi mówionych, `/tts audio`, `/tts status` oraz
narzędzia agenta `tts`. Zobacz [Tekst na mowę](/pl/tools/tts#per-agent-voice-overrides),
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
- `default`: gdy ustawiono kilka, pierwszy wygrywa (zostanie zapisane ostrzeżenie). Jeśli nie ustawiono żadnego, domyślny jest pierwszy wpis listy.
- `model`: forma ciągu znaków ustawia ścisły podstawowy model dla agenta bez modelu awaryjnego; forma obiektu `{ primary }` również jest ścisła, chyba że dodasz `fallbacks`. Użyj `{ primary, fallbacks: [...] }`, aby włączyć dla tego agenta mechanizm awaryjny, albo `{ primary, fallbacks: [] }`, aby jawnie wskazać ścisłe zachowanie. Zadania Cron, które nadpisują tylko `primary`, nadal dziedziczą domyślne modele awaryjne, chyba że ustawisz `fallbacks: []`.
- `params`: parametry strumienia dla agenta scalane z wybranym wpisem modelu w `agents.defaults.models`. Użyj tego do nadpisań specyficznych dla agenta, takich jak `cacheRetention`, `temperature` lub `maxTokens`, bez duplikowania całego katalogu modeli.
- `tts`: opcjonalne nadpisania funkcji zamiany tekstu na mowę dla agenta. Blok jest głęboko scalany z `messages.tts`, więc zachowaj współdzielone dane uwierzytelniające dostawcy i politykę awaryjną w `messages.tts`, a tutaj ustawiaj tylko wartości specyficzne dla persony, takie jak dostawca, głos, model, styl lub tryb automatyczny.
- `skills`: opcjonalna lista dozwolonych Skills dla agenta. Jeśli zostanie pominięta, agent dziedziczy `agents.defaults.skills`, gdy jest ustawione; jawna lista zastępuje wartości domyślne zamiast je scalać, a `[]` oznacza brak Skills.
- `thinkingDefault`: opcjonalny domyślny poziom myślenia dla agenta (`off | minimal | low | medium | high | xhigh | adaptive | max`). Nadpisuje `agents.defaults.thinkingDefault` dla tego agenta, gdy nie ustawiono nadpisania dla wiadomości ani sesji. Wybrany profil dostawcy/modelu kontroluje, które wartości są prawidłowe; dla Google Gemini `adaptive` zachowuje dynamiczne myślenie kontrolowane przez dostawcę (`thinkingLevel` pominięte w Gemini 3/3.1, `thinkingBudget: -1` w Gemini 2.5).
- `reasoningDefault`: opcjonalna domyślna widoczność rozumowania dla agenta (`on | off | stream`). Nadpisuje `agents.defaults.reasoningDefault` dla tego agenta, gdy nie ustawiono nadpisania rozumowania dla wiadomości ani sesji.
- `fastModeDefault`: opcjonalna wartość domyślna trybu szybkiego dla agenta (`"auto" | true | false`). Ma zastosowanie, gdy nie ustawiono nadpisania trybu szybkiego dla wiadomości ani sesji.
- `models`: opcjonalny katalog modeli/nadpisania środowiska wykonawczego dla agenta, indeksowane pełnymi identyfikatorami `provider/model`. Użyj `models["provider/model"].agentRuntime` dla wyjątków środowiska wykonawczego specyficznych dla agenta.
- `runtime`: opcjonalny deskryptor środowiska wykonawczego dla agenta. Użyj `type: "acp"` z domyślnymi wartościami `runtime.acp` (`agent`, `backend`, `mode`, `cwd`), gdy agent ma domyślnie używać sesji uprzęży ACP.
- `identity.avatar`: ścieżka względna względem przestrzeni roboczej, URL `http(s)` albo URI `data:`.
- Lokalne pliki obrazów `identity.avatar` o ścieżce względnej względem przestrzeni roboczej są ograniczone do 2 MB. URL-e `http(s)` i URI `data:` nie są sprawdzane lokalnym limitem rozmiaru pliku.
- `identity` wyprowadza wartości domyślne: `ackReaction` z `emoji`, `mentionPatterns` z `name`/`emoji`.
- `subagents.allowAgents`: lista dozwolonych identyfikatorów skonfigurowanych agentów dla jawnych celów `sessions_spawn.agentId` (`["*"]` = dowolny skonfigurowany cel; domyślnie: tylko ten sam agent). Uwzględnij identyfikator żądającego, gdy wywołania `agentId` kierowane do samego siebie mają być dozwolone. Nieaktualne wpisy, których konfiguracja agenta została usunięta, są odrzucane przez `sessions_spawn` i pomijane w `agents_list`; uruchom `openclaw doctor --fix`, aby je wyczyścić, albo dodaj minimalny wpis `agents.list[]`, jeśli ten cel ma pozostać możliwy do utworzenia przy dziedziczeniu wartości domyślnych.
- Strażnik dziedziczenia sandboxa: jeśli sesja żądającego działa w sandboxie, `sessions_spawn` odrzuca cele, które działałyby bez sandboxa.
- `subagents.requireAgentId`: gdy ma wartość true, blokuje wywołania `sessions_spawn`, które pomijają `agentId` (wymusza jawny wybór profilu; domyślnie: false).

---

## Routing wielu agentów

Uruchamiaj wielu izolowanych agentów w jednym Gateway. Zobacz [Multi-Agent](/pl/concepts/multi-agent).

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
6. Agent domyślny

W obrębie każdego poziomu wygrywa pierwszy pasujący wpis `bindings`.

Dla wpisów `type: "acp"` OpenClaw rozwiązuje po dokładnej tożsamości konwersacji (`match.channel` + konto + `match.peer.id`) i nie używa powyższej kolejności poziomów powiązań tras.

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

<Accordion title="Narzędzia tylko do odczytu + przestrzeń robocza">

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

<Accordion title="Brak dostępu do systemu plików (tylko wiadomości)">

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

Szczegóły pierwszeństwa znajdziesz w [Piaskownicy i narzędziach dla wielu agentów](/pl/tools/multi-agent-sandbox-tools).

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

<Accordion title="Szczegóły pól sesji">

- **`scope`**: podstawowa strategia grupowania sesji dla kontekstów czatu grupowego.
  - `per-sender` (domyślnie): każdy nadawca otrzymuje izolowaną sesję w kontekście kanału.
  - `global`: wszyscy uczestnicy w kontekście kanału współdzielą jedną sesję (używaj tylko wtedy, gdy zamierzony jest wspólny kontekst).
- **`dmScope`**: sposób grupowania wiadomości prywatnych.
  - `main`: wszystkie wiadomości prywatne współdzielą główną sesję.
  - `per-peer`: izolacja według identyfikatora nadawcy między kanałami.
  - `per-channel-peer`: izolacja według kanału i nadawcy (zalecane dla skrzynek odbiorczych wielu użytkowników).
  - `per-account-channel-peer`: izolacja według konta, kanału i nadawcy (zalecane przy wielu kontach).
- **`identityLinks`**: mapuje kanoniczne identyfikatory na równorzędne wpisy z prefiksem dostawcy w celu współdzielenia sesji między kanałami. Polecenia dock, takie jak `/dock_discord`, używają tej samej mapy do przełączania trasy odpowiedzi aktywnej sesji na inny połączony kanał równorzędny; zobacz [Dockowanie kanałów](/pl/concepts/channel-docking).
- **`reset`**: podstawowa polityka resetowania. `daily` resetuje o lokalnej godzinie `atHour`; `idle` resetuje po `idleMinutes`. Gdy skonfigurowano oba, wygrywa ten, który wygaśnie jako pierwszy. Świeżość dziennego resetu używa `sessionStartedAt` z wiersza sesji; świeżość resetu bezczynności używa `lastInteractionAt`. Zapisy zdarzeń w tle/systemowych, takie jak heartbeat, wybudzenia cron, powiadomienia exec i księgowanie Gateway, mogą aktualizować `updatedAt`, ale nie utrzymują świeżości sesji dziennych/bezczynności.
- **`resetByType`**: nadpisania według typu (`direct`, `group`, `thread`). Starsze `dm` jest akceptowane jako alias `direct`.
- **`mainKey`**: starsze pole. Środowisko wykonawcze zawsze używa `"main"` dla głównego koszyka czatu bezpośredniego.
- **`agentToAgent.maxPingPongTurns`**: maksymalna liczba tur odpowiedzi zwrotnych między agentami podczas wymian agent-agent (liczba całkowita, zakres: `0`-`20`, domyślnie: `5`). `0` wyłącza łańcuch ping-pong.
- **`sendPolicy`**: dopasowanie według `channel`, `chatType` (`direct|group|channel`, ze starszym aliasem `dm`), `keyPrefix` lub `rawKeyPrefix`. Pierwsza odmowa wygrywa.
- **`maintenance`**: kontrolki czyszczenia magazynu sesji i retencji.
  - `mode`: `enforce` stosuje czyszczenie i jest domyślne; `warn` emituje tylko ostrzeżenia.
  - `pruneAfter`: próg wieku dla przestarzałych wpisów (domyślnie `30d`).
  - `maxEntries`: maksymalna liczba wpisów w `sessions.json` (domyślnie `500`). Środowisko wykonawcze zapisuje czyszczenie wsadowe z małym buforem wysokiego progu dla limitów produkcyjnych; `openclaw sessions cleanup --enforce` stosuje limit natychmiast.
  - Krótkotrwałe sesje sondy uruchomienia modelu Gateway używają stałej retencji `24h`, ale czyszczenie jest sterowane presją: usuwa tylko przestarzałe, ścisłe wiersze sondy uruchomienia modelu, gdy zostanie osiągnięta presja utrzymania/limitu wpisów sesji. Kwalifikują się tylko ścisłe, jawne klucze sondy pasujące do `agent:*:explicit:model-run-<uuid>`; normalne sesje bezpośrednie, grupowe, wątkowe, cron, hook, heartbeat, ACP i podagentów nie dziedziczą tej retencji 24h. Gdy działa czyszczenie uruchomień modelu, działa przed szerszym czyszczeniem przestarzałych wpisów `pruneAfter` i limitem `maxEntries`.
  - `rotateBytes`: przestarzałe i ignorowane; `openclaw doctor --fix` usuwa je ze starszych konfiguracji.
  - `resetArchiveRetention`: retencja archiwów transkrypcji `*.reset.<timestamp>`. Domyślnie `pruneAfter`; ustaw `false`, aby wyłączyć.
  - `maxDiskBytes`: opcjonalny budżet dyskowy katalogu sesji. W trybie `warn` rejestruje ostrzeżenia; w trybie `enforce` najpierw usuwa najstarsze artefakty/sesje.
  - `highWaterBytes`: opcjonalny cel po czyszczeniu budżetu. Domyślnie `80%` wartości `maxDiskBytes`.
- **`threadBindings`**: globalne wartości domyślne funkcji sesji powiązanych z wątkiem.
  - `enabled`: główny przełącznik domyślny (dostawcy mogą nadpisywać; Discord używa `channels.discord.threadBindings.enabled`)
  - `idleHours`: domyślne automatyczne odogniskowanie po bezczynności w godzinach (`0` wyłącza; dostawcy mogą nadpisywać)
  - `maxAgeHours`: domyślny twardy maksymalny wiek w godzinach (`0` wyłącza; dostawcy mogą nadpisywać)
  - `spawnSessions`: domyślna bramka tworzenia sesji roboczych powiązanych z wątkiem z `sessions_spawn` i uruchomień wątków ACP. Domyślnie `true`, gdy powiązania wątków są włączone; dostawcy/konta mogą nadpisywać.
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

| Zmienna           | Opis                    | Przykład                    |
| ----------------- | ----------------------- | --------------------------- |
| `{model}`         | Krótka nazwa modelu     | `claude-opus-4-6`           |
| `{modelFull}`     | Pełny identyfikator modelu | `anthropic/claude-opus-4-6` |
| `{provider}`      | Nazwa dostawcy          | `anthropic`                 |
| `{thinkingLevel}` | Bieżący poziom myślenia | `high`, `low`, `off`        |
| `{identity.name}` | Nazwa tożsamości agenta | (tak samo jak `"auto"`)     |

Wielkość liter w zmiennych nie ma znaczenia. `{think}` jest aliasem `{thinkingLevel}`.

### Reakcja potwierdzenia

- Domyślnie `identity.emoji` aktywnego agenta, w przeciwnym razie `"👀"`. Ustaw `""`, aby wyłączyć.
- Nadpisania według kanału: `channels.<channel>.ackReaction`, `channels.<channel>.accounts.<id>.ackReaction`.
- Kolejność rozstrzygania: konto → kanał → `messages.ackReaction` → awaryjna wartość tożsamości.
- Zakres: `group-mentions` (domyślnie), `group-all`, `direct`, `all`.
- `removeAckAfterReply`: usuwa potwierdzenie po odpowiedzi w kanałach obsługujących reakcje, takich jak Slack, Discord, Telegram, WhatsApp i iMessage.
- `messages.statusReactions.enabled`: włącza reakcje statusu cyklu życia w Slack, Discord, Telegram i WhatsApp.
  W Slack i Discord brak ustawienia pozostawia reakcje statusu włączone, gdy reakcje potwierdzenia są aktywne.
  W Telegram i WhatsApp ustaw jawnie na `true`, aby włączyć reakcje statusu cyklu życia.
- `messages.statusReactions.emojis`: nadpisuje klucze emoji cyklu życia:
  `queued`, `thinking`, `compacting`, `tool`, `coding`, `web`, `deploy`, `build`,
  `concierge`, `done`, `error`, `stallSoft` i `stallHard`.
  Telegram zezwala tylko na stały zestaw reakcji, więc nieobsługiwane skonfigurowane emoji cofają się
  do najbliższego obsługiwanego wariantu statusu dla danego czatu.

### Debounce przychodzących wiadomości

Grupuje szybkie wiadomości tekstowe od tego samego nadawcy w jedną turę agenta. Multimedia/załączniki opróżniają kolejkę natychmiast. Polecenia sterujące omijają debounce.

### TTS (tekst na mowę)

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

- `auto` kontroluje domyślny tryb automatycznego TTS: `off`, `always`, `inbound` lub `tagged`. `/tts on|off` może nadpisać lokalne preferencje, a `/tts status` pokazuje efektywny stan.
- `summaryModel` nadpisuje `agents.defaults.model.primary` dla automatycznego podsumowania.
- `modelOverrides` jest domyślnie włączone; `modelOverrides.allowProvider` ma domyślną wartość `false` (wymaga zgody).
- Klucze API używają awaryjnie `ELEVENLABS_API_KEY`/`XI_API_KEY` oraz `OPENAI_API_KEY`.
- Dołączone dostawcy mowy należą do pluginów. Jeśli ustawiono `plugins.allow`, uwzględnij każdy Plugin dostawcy TTS, którego chcesz używać, na przykład `microsoft` dla Edge TTS. Starszy identyfikator dostawcy `edge` jest akceptowany jako alias dla `microsoft`.
- `providers.openai.baseUrl` nadpisuje punkt końcowy OpenAI TTS. Kolejność rozstrzygania to konfiguracja, potem `OPENAI_TTS_BASE_URL`, a następnie `https://api.openai.com/v1`.
- Gdy `providers.openai.baseUrl` wskazuje punkt końcowy inny niż OpenAI, OpenClaw traktuje go jako serwer TTS zgodny z OpenAI i rozluźnia walidację modelu/głosu.

---

## Rozmowa

Domyślne ustawienia trybu rozmowy (macOS/iOS/Android).

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

- `talk.provider` musi pasować do klucza w `talk.providers`, gdy skonfigurowano wielu dostawców trybu rozmowy.
- Starsze płaskie klucze trybu rozmowy (`talk.voiceId`, `talk.voiceAliases`, `talk.modelId`, `talk.outputFormat`, `talk.apiKey`) służą wyłącznie zgodności. Uruchom `openclaw doctor --fix`, aby przepisać utrwaloną konfigurację do `talk.providers.<provider>`.
- Identyfikatory głosów używają awaryjnie `ELEVENLABS_VOICE_ID` lub `SAG_VOICE_ID`.
- `providers.*.apiKey` akceptuje ciągi tekstowe w formie jawnej albo obiekty SecretRef.
- Awaryjne użycie `ELEVENLABS_API_KEY` ma zastosowanie tylko wtedy, gdy nie skonfigurowano klucza API trybu rozmowy.
- `providers.*.voiceAliases` pozwala dyrektywom trybu rozmowy używać przyjaznych nazw.
- `providers.mlx.modelId` wybiera repozytorium Hugging Face używane przez lokalnego pomocnika MLX na macOS. Jeśli zostanie pominięte, macOS używa `mlx-community/Soprano-80M-bf16`.
- Odtwarzanie MLX na macOS działa przez dołączonego pomocnika `openclaw-mlx-tts`, gdy jest obecny, albo przez plik wykonywalny w `PATH`; `OPENCLAW_MLX_TTS_BIN` nadpisuje ścieżkę pomocnika na potrzeby programowania.
- `consultThinkingLevel` kontroluje poziom myślenia dla pełnego uruchomienia agenta OpenClaw stojącego za wywołaniami Control UI Talk realtime `openclaw_agent_consult`. Pozostaw bez ustawienia, aby zachować normalne zachowanie sesji/modelu.
- `consultFastMode` ustawia jednorazowe nadpisanie trybu szybkiego dla konsultacji Control UI Talk realtime bez zmiany normalnego ustawienia trybu szybkiego sesji.
- `speechLocale` ustawia identyfikator lokalizacji BCP 47 używany przez rozpoznawanie mowy trybu rozmowy na iOS/macOS. Pozostaw bez ustawienia, aby użyć domyślnych ustawień urządzenia.
- `silenceTimeoutMs` kontroluje, jak długo tryb rozmowy czeka po ciszy użytkownika, zanim wyśle transkrypcję. Brak ustawienia zachowuje domyślne okno pauzy platformy (`700 ms on macOS and Android, 900 ms on iOS`).
- `realtime.instructions` dołącza instrukcje systemowe widoczne dla dostawcy do wbudowanego promptu realtime OpenClaw, dzięki czemu styl głosu można konfigurować bez utraty domyślnych wskazówek `openclaw_agent_consult`.
- `realtime.consultRouting` kontroluje awaryjne przekazywanie przez Gateway, gdy dostawca realtime generuje finalną transkrypcję użytkownika bez `openclaw_agent_consult`: `provider-direct` zachowuje bezpośrednie odpowiedzi dostawcy, natomiast `force-agent-consult` kieruje sfinalizowane żądanie przez OpenClaw.

---

## Powiązane

- [Dokumentacja konfiguracji](/pl/gateway/configuration-reference) — wszystkie pozostałe klucze konfiguracji
- [Konfiguracja](/pl/gateway/configuration) — typowe zadania i szybka konfiguracja
- [Przykłady konfiguracji](/pl/gateway/configuration-examples)
