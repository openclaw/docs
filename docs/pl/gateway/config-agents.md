---
read_when:
    - Dostosowywanie ustawień domyślnych agenta (modele, rozumowanie, obszar roboczy, Heartbeat, multimedia, Skills)
    - Konfigurowanie routingu i powiązań wielu agentów
    - Dostosowywanie zachowania sesji, dostarczania wiadomości i trybu rozmowy
summary: Domyślne ustawienia agentów, routing wieloagentowy oraz konfiguracja sesji, wiadomości i rozmów
title: Konfiguracja — agenci
x-i18n:
    generated_at: "2026-07-16T18:18:04Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 61e6d6b6db806b05f5354a86a4d937a0e16b9f656b22ae4f3185a1674d2ee21a
    source_path: gateway/config-agents.md
    workflow: 16
---

Klucze konfiguracji o zakresie agenta w sekcjach `agents.*`, `multiAgent.*`, `session.*`,
`messages.*` i `talk.*`. Informacje o kanałach, narzędziach, środowisku wykonawczym Gateway i innych
kluczach najwyższego poziomu zawiera [dokumentacja konfiguracji](/pl/gateway/configuration-reference).

## Ustawienia domyślne agentów

### `agents.defaults.workspace`

Domyślnie: `OPENCLAW_WORKSPACE_DIR`, jeśli jest ustawiona; w przeciwnym razie `~/.openclaw/workspace` (lub `~/.openclaw/workspace-<profile>`, gdy `OPENCLAW_PROFILE` wskazuje profil inny niż domyślny).

```json5
{
  agents: { defaults: { workspace: "~/.openclaw/workspace" } },
}
```

Jawna wartość `agents.defaults.workspace` ma pierwszeństwo przed
`OPENCLAW_WORKSPACE_DIR`. Zmienna środowiskowa pozwala skierować domyślnych agentów
do zamontowanego obszaru roboczego bez zapisywania tej ścieżki w konfiguracji.

### `agents.defaults.repoRoot`

Opcjonalny katalog główny repozytorium wyświetlany w wierszu Runtime monitu systemowego. Jeśli nie jest ustawiony, OpenClaw wykrywa go automatycznie, przechodząc w górę od obszaru roboczego.

```json5
{
  agents: { defaults: { repoRoot: "~/Projects/openclaw" } },
}
```

### `agents.defaults.skills`

Opcjonalna domyślna lista dozwolonych Skills dla agentów, którzy nie ustawiają
`agents.list[].skills`.

```json5
{
  agents: {
    defaults: { skills: ["github", "weather"] },
    list: [
      { id: "writer" }, // dziedziczy github, weather
      { id: "docs", skills: ["docs-search"] }, // zastępuje ustawienia domyślne
      { id: "locked-down", skills: [] }, // bez Skills
    ],
  },
}
```

- Pominięcie `agents.defaults.skills` domyślnie zapewnia nieograniczony dostęp do Skills.
- Pominięcie `agents.list[].skills` powoduje odziedziczenie ustawień domyślnych.
- Ustawienie `agents.list[].skills: []` wyłącza wszystkie Skills.
- Niepusta lista `agents.list[].skills` stanowi ostateczny zestaw dla danego agenta;
  nie jest łączona z ustawieniami domyślnymi.

### `agents.defaults.skipBootstrap`

Wyłącza automatyczne tworzenie plików inicjalizacyjnych obszaru roboczego (`AGENTS.md`, `SOUL.md`, `TOOLS.md`, `IDENTITY.md`, `USER.md`, `HEARTBEAT.md`, `BOOTSTRAP.md`).

```json5
{
  agents: { defaults: { skipBootstrap: true } },
}
```

### `agents.defaults.skipOptionalBootstrapFiles`

Pomija tworzenie wybranych opcjonalnych plików obszaru roboczego, nadal zapisując wymagane pliki inicjalizacyjne (`AGENTS.md`, `TOOLS.md`, `BOOTSTRAP.md`). Prawidłowe wartości: `SOUL.md`, `USER.md`, `HEARTBEAT.md` i `IDENTITY.md`.

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

Określa, kiedy pliki inicjalizacyjne obszaru roboczego są wstrzykiwane do monitu systemowego. Domyślnie: `"always"`.

- `"continuation-skip"`: bezpieczne tury kontynuacji (po ukończonej odpowiedzi asystenta) pomijają ponowne wstrzykiwanie plików inicjalizacyjnych obszaru roboczego, zmniejszając rozmiar monitu. Uruchomienia Heartbeat i ponowne próby po Compaction nadal odbudowują kontekst.
- `"never"`: wyłącza wstrzykiwanie plików inicjalizacyjnych obszaru roboczego i plików kontekstowych w każdej turze. Tej opcji należy używać tylko w przypadku agentów, które w pełni zarządzają cyklem życia swojego monitu (niestandardowe mechanizmy kontekstu, natywne środowiska wykonawcze samodzielnie budujące kontekst lub wyspecjalizowane przepływy pracy bez inicjalizacji). Tury Heartbeat i odzyskiwania po Compaction również pomijają wstrzykiwanie.

```json5
{
  agents: { defaults: { contextInjection: "continuation-skip" } },
}
```

Nadpisanie dla poszczególnych agentów: `agents.list[].contextInjection`. Pominięte wartości dziedziczą
`agents.defaults.contextInjection`.

### `agents.defaults.bootstrapMaxChars`

Maksymalna liczba znaków w każdym pliku inicjalizacyjnym obszaru roboczego przed obcięciem. Domyślnie: `20000`.

```json5
{
  agents: { defaults: { bootstrapMaxChars: 20000 } },
}
```

Nadpisanie dla poszczególnych agentów: `agents.list[].bootstrapMaxChars`. Pominięte wartości dziedziczą
`agents.defaults.bootstrapMaxChars`.

### `agents.defaults.bootstrapTotalMaxChars`

Maksymalna łączna liczba znaków wstrzykiwanych ze wszystkich plików inicjalizacyjnych obszaru roboczego. Domyślnie: `60000`.

```json5
{
  agents: { defaults: { bootstrapTotalMaxChars: 60000 } },
}
```

Nadpisanie dla poszczególnych agentów: `agents.list[].bootstrapTotalMaxChars`. Pominięte wartości
dziedziczą `agents.defaults.bootstrapTotalMaxChars`.

### Nadpisania profilu inicjalizacji dla poszczególnych agentów

Nadpisania profilu inicjalizacji dla poszczególnych agentów służą do sytuacji, w których jeden agent wymaga innego sposobu
wstrzykiwania monitu niż wspólne ustawienia domyślne. Pominięte pola dziedziczą wartości z
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

Steruje widocznym dla agenta powiadomieniem w monicie systemowym, gdy kontekst inicjalizacyjny zostaje obcięty.
Domyślnie: `"always"`.

- `"off"`: nigdy nie wstrzykuje tekstu powiadomienia o obcięciu do monitu systemowego.
- `"once"`: wstrzykuje zwięzłe powiadomienie raz dla każdej unikatowej sygnatury obcięcia.
- `"always"`: wstrzykuje zwięzłe powiadomienie przy każdym uruchomieniu, gdy występuje obcięcie (zalecane).

Szczegółowe liczby surowych i wstrzykniętych znaków oraz pola dostrajania konfiguracji pozostają w diagnostyce, takiej
jak raporty kontekstu lub stanu i dzienniki; zwykły kontekst użytkownika i środowiska wykonawczego WebChat otrzymuje tylko
zwięzłe powiadomienie dotyczące odzyskiwania.

```json5
{
  agents: { defaults: { bootstrapPromptTruncationWarning: "always" } }, // off | once | always
}
```

### Mapa odpowiedzialności za budżet kontekstu

OpenClaw ma wiele budżetów monitu i kontekstu o dużej objętości, które są
celowo rozdzielone według podsystemów, zamiast być sterowane przez jeden ogólny
parametr.

| Budżet                                                         | Obejmuje                                                                                                                                                          |
| -------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `agents.defaults.bootstrapMaxChars` / `bootstrapTotalMaxChars` | Standardowe wstrzykiwanie plików inicjalizacyjnych obszaru roboczego                                                                                                                            |
| `agents.defaults.startupContext.*`                             | Jednorazowe preludium uruchomienia modelu podczas resetowania lub uruchamiania, w tym ostatnie dzienne pliki `memory/*.md`. Same polecenia czatu `/new` i `/reset` są potwierdzane bez wywoływania modelu |
| `skills.limits.*`                                              | Zwarta lista Skills wstrzykiwana do monitu systemowego                                                                                                         |
| `agents.defaults.contextLimits.*`                              | Ograniczone fragmenty środowiska wykonawczego i wstrzykiwane bloki należące do środowiska wykonawczego                                                                                                      |
| `memory.qmd.limits.*`                                          | Rozmiar indeksowanego fragmentu wyszukiwania pamięci i jego wstrzykiwania                                                                                                              |

Odpowiednie nadpisania dla poszczególnych agentów:

- `agents.list[].skillsLimits.maxSkillsPromptChars`
- `agents.list[].contextInjection`
- `agents.list[].bootstrapMaxChars`
- `agents.list[].bootstrapTotalMaxChars`
- `agents.list[].contextLimits.*`

#### `agents.defaults.startupContext`

Steruje preludium startowym pierwszej tury, wstrzykiwanym podczas uruchomień modelu przy resetowaniu lub uruchamianiu.
Same polecenia czatu `/new` i `/reset` potwierdzają reset bez wywoływania
modelu, więc nie wczytują tego preludium.

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

Wspólne ustawienia domyślne ograniczonych powierzchni kontekstu środowiska wykonawczego.

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
- `memoryGetDefaultLines`: domyślne okno `memory_get` w wierszach, gdy pominięto `lines`.
- `toolResultMaxChars`: zaawansowany limit wyników narzędzi na żywo, używany dla utrwalonych
  wyników i odzyskiwania po przepełnieniu. Pozostawienie bez wartości włącza automatyczny limit kontekstu modelu:
  `16000` znaków poniżej 100K tokenów, `32000` znaków przy co najmniej 100K tokenów oraz `64000`
  znaków przy co najmniej 200K tokenów. Jawne wartości do `1000000` są akceptowane dla
  modeli o długim kontekście, ale efektywny limit nadal jest ograniczony do około 30% okna
  kontekstu modelu. `openclaw doctor --deep` wyświetla efektywny limit,
  a doctor ostrzega tylko wtedy, gdy jawne nadpisanie jest nieaktualne lub nie ma wpływu.
- `postCompactionMaxChars`: limit fragmentu AGENTS.md używany podczas wstrzykiwania
  odświeżenia po Compaction.

#### `agents.list[].contextLimits`

Nadpisanie dla poszczególnych agentów wspólnych parametrów `contextLimits`. Pominięte pola dziedziczą
wartości z `agents.defaults.contextLimits`.

```json5
{
  agents: {
    defaults: {
      contextLimits: { memoryGetMaxChars: 12000 },
    },
    list: [
      {
        id: "tiny-local",
        contextLimits: {
          memoryGetMaxChars: 6000,
          toolResultMaxChars: 8000, // zaawansowany limit dla tego agenta
        },
      },
    ],
  },
}
```

#### `skills.limits.maxSkillsPromptChars`

Globalny limit zwartej listy Skills wstrzykiwanej do monitu systemowego. Nie
wpływa to na odczytywanie plików `SKILL.md` na żądanie.

```json5
{
  skills: { limits: { maxSkillsPromptChars: 18000 } },
}
```

#### `agents.list[].skillsLimits.maxSkillsPromptChars`

Nadpisanie budżetu monitu Skills dla poszczególnych agentów.

```json5
{
  agents: {
    list: [{ id: "tiny-local", skillsLimits: { maxSkillsPromptChars: 6000 } }],
  },
}
```

### `agents.defaults.imageMaxDimensionPx`

Maksymalny rozmiar w pikselach najdłuższego boku obrazu w blokach obrazów transkrypcji lub narzędzi przed wywołaniami dostawcy.
Domyślnie: `1200`.

Niższe wartości zwykle zmniejszają zużycie tokenów wizyjnych i rozmiar ładunku żądania w uruchomieniach zawierających wiele zrzutów ekranu.
Wyższe wartości zachowują więcej szczegółów wizualnych.

```json5
{
  agents: { defaults: { imageMaxDimensionPx: 1200 } },
}
```

### `agents.defaults.imageQuality`

Preferencja kompresji i szczegółowości narzędzia obrazów dla obrazów wczytywanych ze ścieżek plików, adresów URL i odwołań do multimediów.
Domyślnie: `auto`.

OpenClaw dostosowuje sekwencję poziomów zmiany rozmiaru do wybranego modelu obrazów. Na przykład Claude Opus 4.8, OpenAI GPT-5.6 Sol, Qwen VL i hostowane modele wizyjne Llama 4 mogą używać większych obrazów niż starsze lub domyślne ścieżki wizyjne o wysokiej szczegółowości, natomiast tury z wieloma obrazami są w trybie `auto` kompresowane bardziej agresywnie, aby ograniczyć koszt tokenów i opóźnienie.

Wartości:

- `auto`: dostosowuje się do limitów modelu i liczby obrazów.
- `efficient`: preferuje mniejsze obrazy w celu zmniejszenia zużycia tokenów i bajtów.
- `balanced`: używa standardowej, pośredniej sekwencji poziomów.
- `high`: zachowuje więcej szczegółów zrzutów ekranu, diagramów i obrazów dokumentów.

```json5
{
  agents: { defaults: { imageQuality: "auto" } },
}
```

### `agents.defaults.userTimezone`

Strefa czasowa kontekstu monitu systemowego (nie znaczników czasu wiadomości). W razie braku wartości używana jest strefa czasowa hosta.

```json5
{
  agents: { defaults: { userTimezone: "America/Chicago" } },
}
```

### `agents.defaults.timeFormat`

Format czasu w monicie systemowym. Domyślnie: `auto` (preferencja systemu operacyjnego).

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
      utilityModel: "openai/gpt-5.4-mini",
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
      params: { cacheRetention: "long" }, // globalne domyślne parametry dostawcy
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
      maxConcurrent: 4,
    },
  },
}
```

- `model`: akceptuje ciąg znaków (`"provider/model"`) albo obiekt (`{ primary, fallbacks }`).
  - Forma ciągu znaków ustawia tylko model podstawowy.
  - Forma obiektu ustawia model podstawowy oraz uporządkowaną listę modeli przełączania awaryjnego.
- `utilityModel`: opcjonalne odwołanie `provider/model` lub alias dla krótkich zadań wewnętrznych. Obecnie obsługuje generowane tytuły sesji interfejsu Control UI, tytuły tematów wiadomości prywatnych Telegrama, automatyczne tytuły wątków Discorda oraz [narrację wersji roboczych postępu](/pl/concepts/progress-drafts#narrated-status). Gdy ta opcja nie jest ustawiona, OpenClaw używa zadeklarowanego przez głównego dostawcę domyślnego małego modelu, jeśli taki istnieje (OpenAI → `gpt-5.6-luna`, Anthropic → `claude-haiku-4-5`); w przeciwnym razie zadania tworzenia tytułów używają głównego modelu agenta, a narracja pozostaje wyłączona. Ustaw `utilityModel: ""`, aby całkowicie wyłączyć kierowanie zadań pomocniczych. `agents.list[].utilityModel` zastępuje wartość domyślną (pusta wartość dla danego agenta wyłącza tę funkcję dla tego agenta), a ustawienie modelu właściwe dla operacji ma pierwszeństwo przed obiema wartościami. Zadania pomocnicze wykonują oddzielne wywołania modelu i wysyłają treść właściwą dla zadania do wybranego dostawcy modelu. Generowanie tytułów pulpitu wysyła maksymalnie pierwsze 1 000 znaków pierwszej wiadomości, która nie jest poleceniem; narracja wysyła żądanie przychodzące wraz ze zwięzłymi, zredagowanymi podsumowaniami narzędzi. Należy wybrać dostawcę zgodnego z wymaganiami dotyczącymi kosztów i przetwarzania danych.
- `imageModel`: akceptuje ciąg znaków (`"provider/model"`) albo obiekt (`{ primary, fallbacks }`).
  - Używane przez ścieżkę narzędzia `image` jako konfiguracja modelu wizyjnego, gdy aktywny model nie może przyjmować obrazów. Modele z natywną obsługą obrazu otrzymują bezpośrednio wczytane bajty obrazu.
  - Używane również do kierowania awaryjnego, gdy wybrany lub domyślny model nie może przyjmować danych wejściowych obrazu.
  - Preferowane są jawne odwołania `provider/model`. Same identyfikatory są akceptowane ze względu na zgodność; jeśli sam identyfikator jednoznacznie odpowiada skonfigurowanemu wpisowi obsługującemu obrazy w `models.providers.*.models`, OpenClaw uzupełnia go o tego dostawcę. Niejednoznaczne dopasowania w konfiguracji wymagają jawnego prefiksu dostawcy.
- `imageGenerationModel`: akceptuje ciąg znaków (`"provider/model"`) albo obiekt (`{ primary, fallbacks }`).
  - Używane przez współdzieloną funkcję generowania obrazów oraz wszystkie przyszłe narzędzia i powierzchnie Pluginów generujące obrazy.
  - Typowe wartości: `google/gemini-3.1-flash-image-preview` dla natywnego generowania obrazów Gemini, `fal/fal-ai/flux/dev` dla fal, `openai/gpt-image-2` dla OpenAI Images lub `openai/gpt-image-1.5` dla obrazów OpenAI PNG/WebP z przezroczystym tłem.
  - W przypadku bezpośredniego wyboru dostawcy/modelu należy również skonfigurować pasujące uwierzytelnianie dostawcy (na przykład `GEMINI_API_KEY` lub `GOOGLE_API_KEY` dla `google/*`, `OPENAI_API_KEY` lub OpenAI Codex OAuth dla `openai/gpt-image-2` / `openai/gpt-image-1.5`, `FAL_KEY` dla `fal/*`).
  - Jeśli opcja zostanie pominięta, `image_generate` nadal może ustalić domyślnego dostawcę na podstawie skonfigurowanego uwierzytelniania. Najpierw sprawdzany jest bieżący domyślny dostawca, a następnie pozostali zarejestrowani dostawcy generowania obrazów w kolejności identyfikatorów dostawców.
- `musicGenerationModel`: akceptuje ciąg znaków (`"provider/model"`) albo obiekt (`{ primary, fallbacks }`).
  - Używane przez współdzieloną funkcję generowania muzyki oraz wbudowane narzędzie `music_generate`.
  - Typowe wartości: `google/lyria-3-clip-preview`, `google/lyria-3-pro-preview` lub `minimax/music-2.6`.
  - Jeśli opcja zostanie pominięta, `music_generate` nadal może ustalić domyślnego dostawcę na podstawie skonfigurowanego uwierzytelniania. Najpierw sprawdzany jest bieżący domyślny dostawca, a następnie pozostali zarejestrowani dostawcy generowania muzyki w kolejności identyfikatorów dostawców.
  - W przypadku bezpośredniego wyboru dostawcy/modelu należy również skonfigurować pasujące uwierzytelnianie lub klucz API dostawcy.
- `videoGenerationModel`: akceptuje ciąg znaków (`"provider/model"`) albo obiekt (`{ primary, fallbacks }`).
  - Używane przez współdzieloną funkcję generowania filmów oraz wbudowane narzędzie `video_generate`.
  - Typowe wartości: `qwen/wan2.6-t2v`, `qwen/wan2.6-i2v`, `qwen/wan2.6-r2v`, `qwen/wan2.6-r2v-flash` lub `qwen/wan2.7-r2v`.
  - Jeśli opcja zostanie pominięta, `video_generate` nadal może ustalić domyślnego dostawcę na podstawie skonfigurowanego uwierzytelniania. Najpierw sprawdzany jest bieżący domyślny dostawca, a następnie pozostali zarejestrowani dostawcy generowania filmów w kolejności identyfikatorów dostawców.
  - W przypadku bezpośredniego wyboru dostawcy/modelu należy również skonfigurować pasujące uwierzytelnianie lub klucz API dostawcy.
  - Oficjalny Plugin generowania filmów Qwen obsługuje maksymalnie 1 film wyjściowy, 1 obraz wejściowy, 4 filmy wejściowe, czas trwania 10 sekund oraz opcje `size`, `aspectRatio`, `resolution`, `audio` i `watermark` na poziomie dostawcy.
- `pdfModel`: akceptuje ciąg znaków (`"provider/model"`) albo obiekt (`{ primary, fallbacks }`).
  - Używane przez narzędzie `pdf` do kierowania modeli.
  - Jeśli opcja zostanie pominięta, narzędzie PDF używa awaryjnie `imageModel`, a następnie rozpoznanego modelu sesji lub modelu domyślnego.
- `pdfMaxBytesMb`: domyślny limit rozmiaru pliku PDF dla narzędzia `pdf`, gdy parametr `maxBytesMb` nie został przekazany podczas wywołania.
- `pdfMaxPages`: domyślna maksymalna liczba stron uwzględnianych w awaryjnym trybie wyodrębniania narzędzia `pdf`.
- `verboseDefault`: domyślny poziom szczegółowości agentów. Wartości: `"off"`, `"on"`, `"full"`. Wartość domyślna: `"off"`.
- `toolProgressDetail`: tryb szczegółowości podsumowań narzędzia `/verbose` i wierszy narzędzi w wersjach roboczych postępu. Wartości: `"explain"` (wartość domyślna, zwięzłe etykiety czytelne dla człowieka) lub `"raw"` (dołącza nieprzetworzone polecenie lub szczegóły, jeśli są dostępne). Ustawienie `agents.list[].toolProgressDetail` dla danego agenta zastępuje tę wartość domyślną.
- `reasoningDefault`: domyślna widoczność rozumowania agentów. Wartości: `"off"`, `"on"`, `"stream"`. Ustawienie `agents.list[].reasoningDefault` dla danego agenta zastępuje tę wartość domyślną. Skonfigurowane domyślne ustawienia rozumowania są stosowane tylko dla właścicieli, autoryzowanych nadawców lub kontekstów administracyjnych operatora Gateway, gdy nie ustawiono zastąpienia rozumowania dla wiadomości ani sesji.
- `elevatedDefault`: domyślny poziom wyświetlania rozszerzonych danych wyjściowych agentów. Wartości: `"off"`, `"on"`, `"ask"`, `"full"`. Wartość domyślna: `"on"`.
- `model.primary`: format `provider/model` (np. `openai/gpt-5.6-sol` dla dostępu Codex OAuth). Jeśli dostawca zostanie pominięty, OpenClaw najpierw próbuje użyć aliasu, następnie szuka jednoznacznego dopasowania skonfigurowanego dostawcy do dokładnie tego identyfikatora modelu, a dopiero potem używa skonfigurowanego domyślnego dostawcy (przestarzałe zachowanie zgodności, dlatego preferowane jest jawne `provider/model`). Jeśli ten dostawca nie udostępnia już skonfigurowanego modelu domyślnego, OpenClaw używa pierwszej skonfigurowanej pary dostawca/model zamiast zgłaszać nieaktualne ustawienie domyślne usuniętego dostawcy.
- `models`: skonfigurowany katalog modeli i lista dozwolonych dla `/model`. Każdy wpis może zawierać `alias` (skrót) i `params` (właściwe dla dostawcy, na przykład `temperature`, `maxTokens`, `cacheRetention`, `context1m`, `responsesServerCompaction`, `responsesCompactThreshold`, kierowanie OpenRouter `provider`, `chat_template_kwargs`, `extra_body`/`extraBody`).
  - Użyj wpisów `provider/*`, takich jak `"openai/*": {}` lub `"vllm/*": {}`, aby wyświetlić wszystkie wykryte modele wybranych dostawców bez ręcznego wymieniania każdego identyfikatora modelu.
  - Dodaj `agentRuntime` do wpisu `provider/*`, gdy każdy dynamicznie wykryty model tego dostawcy powinien używać tego samego środowiska wykonawczego. Dokładna zasada środowiska wykonawczego `provider/model` nadal ma pierwszeństwo przed symbolem wieloznacznym.
  - Bezpieczne modyfikacje: użyj `openclaw config set agents.defaults.models '<json>' --strict-json --merge`, aby dodać wpisy. `config set` odrzuca zastąpienia, które usunęłyby istniejące wpisy listy dozwolonych, chyba że zostanie przekazane `--replace`.
  - Przepływy konfiguracji i wdrażania ograniczone do dostawcy scalają wybrane modele dostawcy z tą mapą i zachowują już skonfigurowanych, niezwiązanych z nimi dostawców.
  - W przypadku bezpośrednich modeli OpenAI Responses Compaction po stronie serwera jest włączana automatycznie. Użyj `params.responsesServerCompaction: false`, aby wyłączyć wstrzykiwanie `context_management`, lub `params.responsesCompactThreshold`, aby zastąpić próg. Zobacz [Compaction po stronie serwera OpenAI](/pl/providers/openai#advanced-configuration).
- `params`: globalne domyślne parametry dostawcy stosowane do wszystkich modeli. Ustawiane w `agents.defaults.params` (np. `{ cacheRetention: "long" }`).
- Kolejność pierwszeństwa scalania `params` (konfiguracja): `agents.defaults.params` (globalna podstawa) jest zastępowane przez `agents.defaults.models["provider/model"].params` (dla modelu), a następnie `agents.list[].params` (pasujący identyfikator agenta) zastępuje wartości według klucza. Szczegóły zawiera sekcja [Buforowanie promptów](/pl/reference/prompt-caching).
- `models.providers.openrouter.params.provider`: domyślna zasada kierowania dostawców obowiązująca w całym OpenRouter. OpenClaw przekazuje ją do obiektu `provider` żądania OpenRouter; ustawienia `agents.defaults.models["openrouter/<model>"].params.provider` dla poszczególnych modeli i parametry agenta zastępują wartości według klucza. Zobacz [Kierowanie dostawców OpenRouter](/pl/providers/openrouter#advanced-configuration).
- `params.extra_body`/`params.extraBody`: zaawansowany przekazywany bez zmian kod JSON scalany z treściami żądań `api: "openai-completions"` dla serwerów proxy zgodnych z OpenAI. Jeśli koliduje z wygenerowanymi kluczami żądania, dodatkowa treść ma pierwszeństwo; trasy uzupełniania inne niż natywne nadal usuwają później właściwe tylko dla OpenAI `store`.
- `params.chat_template_kwargs`: argumenty szablonu czatu zgodne z vLLM/OpenAI, scalane z treściami żądań najwyższego poziomu `api: "openai-completions"`. Dla `vllm/nemotron-3-*` przy wyłączonym rozumowaniu dołączony Plugin vLLM automatycznie wysyła `enable_thinking: false` i `force_nonempty_content: true`; jawne `chat_template_kwargs` zastępują wygenerowane wartości domyślne, a `extra_body.chat_template_kwargs` nadal ma ostateczne pierwszeństwo. Skonfigurowane modele rozumowania vLLM Qwen i Nemotron udostępniają binarne opcje `/think` (`off`, `on`) zamiast wielopoziomowej skali intensywności.
- `compat.thinkingFormat`: styl ładunku rozumowania zgodny z OpenAI. Użyj `"together"` dla `reasoning.enabled` w stylu Together, `"qwen"` dla `enable_thinking` najwyższego poziomu w stylu Qwen lub `"qwen-chat-template"` dla `chat_template_kwargs.enable_thinking` na backendach z rodziny Qwen obsługujących argumenty słów kluczowych szablonu czatu na poziomie żądania, takich jak vLLM. OpenClaw mapuje wyłączone rozumowanie na `false`, a włączone rozumowanie na `true`; skonfigurowane modele vLLM Qwen udostępniają dla tych formatów binarne opcje `/think`.
- `compat.supportedReasoningEfforts`: lista intensywności rozumowania zgodnych z OpenAI dla poszczególnych modeli. Uwzględnij `"xhigh"` dla niestandardowych punktów końcowych, które rzeczywiście je akceptują; OpenClaw udostępni wtedy `/think xhigh` w menu poleceń, wierszach sesji Gateway, walidacji poprawek sesji, walidacji CLI agenta oraz walidacji `llm-task` dla tego skonfigurowanego dostawcy/modelu. Użyj `compat.reasoningEffortMap`, gdy backend wymaga wartości właściwej dla dostawcy zamiast poziomu kanonicznego.
- `params.preserveThinking`: opcja zachowywania rozumowania dostępna wyłącznie dla Z.AI. Gdy jest włączona i rozumowanie jest aktywne, OpenClaw wysyła `thinking.clear_thinking: false` i ponownie odtwarza wcześniejsze `reasoning_content`; zobacz [Rozumowanie i zachowywanie rozumowania w Z.AI](/pl/providers/zai#advanced-configuration).
- `localService`: opcjonalny menedżer procesów na poziomie dostawcy dla lokalnych lub samodzielnie hostowanych serwerów modeli. Gdy wybrany model należy do tego dostawcy, OpenClaw sprawdza `healthUrl` (lub `baseUrl + "/models"`), uruchamia `command` z `args`, jeśli punkt końcowy jest niedostępny, czeka maksymalnie `readyTimeoutMs`, a następnie wysyła żądanie modelu. `command` musi być ścieżką bezwzględną. `idleStopMs: 0` utrzymuje proces przy życiu do czasu zakończenia działania OpenClaw; wartość dodatnia zatrzymuje proces uruchomiony przez OpenClaw po tylu milisekundach bezczynności. Zobacz [Lokalne usługi modeli](/pl/gateway/local-model-services).
- Zasady środowiska uruchomieniowego należy definiować dla dostawców lub modeli, a nie dla `agents.defaults`. Użyj `models.providers.<provider>.agentRuntime` dla reguł dotyczących całego dostawcy albo `agents.defaults.models["provider/model"].agentRuntime` / `agents.list[].models["provider/model"].agentRuntime` dla reguł dotyczących konkretnego modelu. Sam prefiks dostawcy/modelu nigdy nie wybiera środowiska wykonawczego. Gdy środowisko uruchomieniowe nie jest ustawione lub ma wartość `auto`, OpenAI może niejawnie wybrać Codex wyłącznie dla dokładnie pasującej oficjalnej trasy HTTPS Platform Responses lub ChatGPT Responses bez jawnego nadpisania w żądaniu. Zobacz [niejawne środowisko uruchomieniowe agenta OpenAI](/pl/providers/openai#implicit-agent-runtime).
- Mechanizmy zapisu konfiguracji, które modyfikują te pola (na przykład `/models set`, `/models set-image` oraz polecenia dodawania i usuwania opcji rezerwowych), zapisują kanoniczną postać obiektową i w miarę możliwości zachowują istniejące listy opcji rezerwowych.
- `maxConcurrent`: maksymalna liczba równoległych uruchomień agentów w różnych sesjach (w obrębie każdej sesji nadal wykonywane są szeregowo). Wartość domyślna: `4`.

### Zasady środowiska wykonawczego

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
      model: "openai/gpt-5.6-sol",
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

- `id`: `"auto"`, `"openclaw"`, identyfikator zarejestrowanej infrastruktury pluginu lub obsługiwany alias zaplecza CLI. Dołączony plugin Codex rejestruje `codex`; dołączony plugin Anthropic udostępnia zaplecze CLI `claude-cli`.
- `id: "auto"` umożliwia zarejestrowanym infrastrukturom pluginów przejmowanie efektywnych tras, które deklarują lub w inny sposób spełniają ich kontrakt obsługi, oraz używa OpenClaw, gdy żadna infrastruktura nie pasuje. Jawne środowisko wykonawcze pluginu, takie jak `id: "codex"`, wymaga tej infrastruktury i zgodnej efektywnej trasy; kończy działanie błędem, jeśli którykolwiek z tych elementów jest niedostępny lub wykonanie się nie powiedzie.
- `id: "pi"` jest akceptowane wyłącznie jako przestarzały alias `openclaw` w celu zachowania opublikowanych konfiguracji z wersji v2026.5.22 i wcześniejszych. Nowa konfiguracja powinna używać `openclaw`.
- Kolejność pierwszeństwa środowiska wykonawczego jest następująca: najpierw dokładna zasada modelu (`agents.list[].models["provider/model"]`, `agents.defaults.models["provider/model"]` lub `models.providers.<provider>.models[]`), następnie `agents.list[]` / `agents.defaults.models["provider/*"]`, a na końcu zasada dla całego dostawcy w `models.providers.<provider>.agentRuntime`.
- Klucze środowiska wykonawczego całego agenta są starszym mechanizmem. `agents.defaults.agentRuntime`, `agents.list[].agentRuntime`, przypięcia środowiska wykonawczego sesji oraz `OPENCLAW_AGENT_RUNTIME` są ignorowane podczas wyboru środowiska wykonawczego. Uruchom `openclaw doctor --fix`, aby usunąć nieaktualne wartości.
- Kwalifikujące się dokładne oficjalne trasy HTTPS OpenAI Responses/ChatGPT bez jawnego nadpisania żądania mogą niejawnie używać infrastruktury Codex. Ustawienie dostawcy/modelu `agentRuntime.id: "codex"` sprawia, że Codex staje się wymaganiem kończącym działanie błędem, ale nie zapewnia zgodności niezgodnej trasy.
- W przypadku wdrożeń Claude CLI preferowane są `model: "anthropic/claude-opus-4-8"` oraz `agentRuntime.id: "claude-cli"` ograniczone do modelu. Starsze odwołania `claude-cli/<model>` nadal działają ze względu na zgodność, ale nowa konfiguracja powinna zachowywać kanoniczny wybór dostawcy/modelu i umieszczać zaplecze wykonawcze w zasadach środowiska wykonawczego dostawcy/modelu.
- Steruje to wyłącznie wykonywaniem tekstowych tur agenta. Generowanie multimediów, obsługa obrazu, plików PDF, muzyki, wideo i TTS nadal korzystają z własnych ustawień dostawcy/modelu.

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

Skonfigurowane aliasy zawsze mają pierwszeństwo przed wartościami domyślnymi.

Modele Z.AI GLM-4.x automatycznie włączają tryb rozumowania, chyba że ustawiono `--thinking off` lub samodzielnie zdefiniowano `agents.defaults.models["zai/<model>"].params.thinking`.
Modele Z.AI domyślnie włączają `tool_stream` na potrzeby strumieniowania wywołań narzędzi. Ustaw `agents.defaults.models["zai/<model>"].params.tool_stream` na `false`, aby je wyłączyć.
W OpenClaw rozumowanie dla Anthropic Claude Opus 4.8 jest domyślnie wyłączone; gdy rozumowanie adaptacyjne zostanie jawnie włączone, należącą do dostawcy Anthropic domyślną wartością nakładu jest `high`. Modele Claude 4.6 domyślnie używają `adaptive`, gdy nie ustawiono jawnego poziomu rozumowania.

### `agents.defaults.cliBackends`

Opcjonalne zaplecza CLI dla zapasowych uruchomień wyłącznie tekstowych (bez wywołań narzędzi). Przydatne jako rozwiązanie zapasowe, gdy dostawcy API zawiodą.

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
          // Lub użyj systemPromptFileArg, gdy CLI akceptuje flagę pliku promptu.
          systemPromptWhen: "first",
          imageArg: "--image",
          imageMode: "repeat",
        },
      },
    },
  },
}
```

- Zaplecza CLI są przeznaczone przede wszystkim do tekstu; narzędzia są zawsze wyłączone.
- Sesje są obsługiwane, gdy ustawiono `sessionArg`.
- Przekazywanie obrazów jest obsługiwane, gdy `imageArg` akceptuje ścieżki plików.
- `reseedFromRawTranscriptWhenUncompacted: true` umożliwia zapleczu bezpieczne odzyskanie
  unieważnionych sesji z ograniczonej końcowej części surowego transkryptu OpenClaw, zanim
  powstanie pierwsze podsumowanie Compaction. Zmiany profilu uwierzytelniania lub epoki poświadczeń
  nadal nigdy nie powodują ponownego zasilenia surowymi danymi.

### `agents.defaults.promptOverlays`

Niezależne od dostawcy nakładki promptów stosowane według rodziny modeli na powierzchniach promptów składanych przez OpenClaw. Identyfikatory modeli z rodziny GPT-5 otrzymują wspólny kontrakt zachowania na trasach OpenClaw/dostawcy; `personality` steruje wyłącznie przyjazną warstwą stylu interakcji. Natywne trasy serwera aplikacji Codex zachowują należące do Codex instrukcje bazowe/modelu zamiast tej nakładki GPT-5 OpenClaw, a OpenClaw wyłącza wbudowaną osobowość Codex dla natywnych wątków.

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

- `"friendly"` (wartość domyślna) i `"on"` włączają przyjazną warstwę stylu interakcji.
- `"off"` wyłącza wyłącznie przyjazną warstwę; oznaczony kontrakt zachowania GPT-5 pozostaje włączony.
- Starsze ustawienie `plugins.entries.openai.config.personality` jest nadal odczytywane, gdy to wspólne ustawienie nie zostało określone.

### `agents.defaults.heartbeat`

Okresowe uruchomienia Heartbeat.

```json5
{
  agents: {
    defaults: {
      heartbeat: {
        every: "30m", // 0m wyłącza
        model: "openai/gpt-5.4-mini",
        includeReasoning: false,
        includeSystemPromptSection: true, // domyślnie: true; false pomija sekcję Heartbeat w prompcie systemowym
        lightContext: false, // domyślnie: false; true zachowuje wyłącznie HEARTBEAT.md z plików inicjalizacyjnych obszaru roboczego
        isolatedSession: false, // domyślnie: false; true uruchamia każdy Heartbeat w nowej sesji (bez historii rozmowy)
        skipWhenBusy: false, // domyślnie: false; true oczekuje również na ścieżki podagentów/zagnieżdżone tego agenta
        session: "main",
        to: "+15555550123",
        directPolicy: "allow", // allow (domyślnie) | block
        target: "none", // domyślnie: none | opcje: last | whatsapp | telegram | discord | ...
        prompt: "Odczytaj HEARTBEAT.md, jeśli istnieje...",
        ackMaxChars: 300,
        suppressToolErrorWarnings: false,
        timeoutSeconds: 45,
      },
    },
  },
}
```

- `every`: ciąg czasu trwania (ms/s/m/h). Domyślnie: `30m` (uwierzytelnianie kluczem API) lub `1h` (uwierzytelnianie OAuth). Ustaw `0m`, aby wyłączyć.
- `includeSystemPromptSection`: wartość false pomija sekcję Heartbeat w prompcie systemowym i wstrzykiwanie `HEARTBEAT.md` do kontekstu inicjalizacyjnego. Domyślnie: `true`.
- `suppressToolErrorWarnings`: wartość true pomija ładunki ostrzeżeń o błędach narzędzi podczas uruchomień Heartbeat.
- `timeoutSeconds`: maksymalny czas w sekundach dozwolony na turę agenta Heartbeat przed jej przerwaniem. Pozostaw bez ustawienia, aby użyć `agents.defaults.timeoutSeconds`, jeśli je ustawiono; w przeciwnym razie używana jest częstotliwość Heartbeat ograniczona do 600 sekund.
- `directPolicy`: zasada dostarczania bezpośredniego/DM. `allow` (wartość domyślna) zezwala na dostarczanie do celu bezpośredniego. `block` blokuje dostarczanie do celu bezpośredniego i emituje `reason=dm-blocked`.
- `lightContext`: wartość true powoduje, że uruchomienia Heartbeat korzystają z uproszczonego kontekstu inicjalizacyjnego i zachowują wyłącznie `HEARTBEAT.md` z plików inicjalizacyjnych obszaru roboczego.
- `isolatedSession`: wartość true powoduje, że każdy Heartbeat działa w nowej sesji bez wcześniejszej historii rozmowy. Jest to ten sam wzorzec izolacji co Cron `sessionTarget: "isolated"`. Zmniejsza koszt tokenów każdego Heartbeat z ~100K do ~2-5K tokenów.
- `skipWhenBusy`: wartość true powoduje, że uruchomienia Heartbeat są odkładane, gdy dodatkowe ścieżki tego agenta są zajęte: jego własna praca podagenta powiązana kluczem sesji lub zagnieżdżona praca polecenia. Ścieżki Cron zawsze odkładają Heartbeat, nawet bez tej flagi.
- Dla poszczególnych agentów: ustaw `agents.list[].heartbeat`. Gdy dowolny agent definiuje `heartbeat`, Heartbeat uruchamiają **wyłącznie ci agenci**.
- Heartbeat wykonuje pełne tury agenta — krótsze interwały zużywają więcej tokenów.

### `agents.defaults.compaction`

```json5
{
  agents: {
    defaults: {
      compaction: {
        mode: "safeguard", // default | safeguard
        provider: "my-provider", // identyfikator zarejestrowanego pluginu dostawcy Compaction (opcjonalnie)
        timeoutSeconds: 180,
        reserveTokensFloor: 24000,
        keepRecentTokens: 50000,
        recentTurnsPreserve: 3,
        maxHistoryShare: 0.7,
        identifierPolicy: "strict", // strict | off | custom
        identifierInstructions: "Zachowaj dokładnie identyfikatory wdrożeń, identyfikatory zgłoszeń oraz pary host:port.", // używane, gdy identifierPolicy=custom
        qualityGuard: { enabled: true, maxRetries: 1 },
        midTurnPrecheck: { enabled: false }, // opcjonalne sprawdzanie presji pętli narzędzi w trakcie tury
        postIndexSync: "async", // off | async | await
        postCompactionSections: ["Session Startup", "Red Lines"], // włącza ponowne wstrzykiwanie sekcji AGENTS.md
        model: "openrouter/anthropic/claude-sonnet-4-6", // opcjonalne nadpisanie modelu wyłącznie dla Compaction
        truncateAfterCompaction: true, // po Compaction przechodzi do mniejszego następczego pliku JSONL
        maxActiveTranscriptBytes: "20mb", // opcjonalny wyzwalacz lokalnej Compaction podczas kontroli wstępnej
        notifyUser: true, // powiadamia o rozpoczęciu/zakończeniu Compaction i pogorszeniu opróżniania pamięci (domyślnie: false)
        memoryFlush: {
          enabled: true,
          model: "ollama/qwen3:8b", // opcjonalne nadpisanie modelu wyłącznie dla opróżniania pamięci
          softThresholdTokens: 6000,
          forceFlushTranscriptBytes: "2mb",
          systemPrompt: "Sesja zbliża się do Compaction. Zapisz teraz trwałe wspomnienia.",
          prompt: "Zapisz wszelkie trwałe notatki w memory/YYYY-MM-DD.md; jeśli nie ma nic do zapisania, odpowiedz dokładnie cichym tokenem NO_REPLY.",
        },
      },
    },
  },
}
```

- `mode`: `default` lub `safeguard` (podsumowywanie fragmentami w przypadku długich historii). Zobacz [Compaction](/pl/concepts/compaction).
- `provider`: identyfikator zarejestrowanego pluginu dostawcy Compaction. Gdy jest ustawiony, wywoływana jest funkcja `summarize()` dostawcy zamiast wbudowanego podsumowywania przez LLM. W razie niepowodzenia używany jest mechanizm wbudowany. Ustawienie dostawcy wymusza `mode: "safeguard"`. Zobacz [Compaction](/pl/concepts/compaction).
- `timeoutSeconds`: maksymalna liczba sekund dozwolona dla pojedynczej operacji Compaction, po której OpenClaw ją przerywa. Domyślnie: `180`.
- `reserveTokens`: zapas tokenów pozostawiany na dane wyjściowe modelu i przyszłe wyniki narzędzi po Compaction. Gdy rozmiar okna kontekstu modelu jest znany, OpenClaw ogranicza efektywną rezerwę, aby nie mogła zużyć budżetu promptu.
- `reserveTokensFloor`: minimalna rezerwa wymuszana przez osadzone środowisko wykonawcze. Ustaw `0`, aby wyłączyć dolny limit. Dolny limit nadal podlega aktywnemu ograniczeniu okna kontekstu.
- `keepRecentTokens`: budżet punktu odcięcia agenta służący do zachowania bez zmian najnowszej końcowej części transkrypcji. Ręczne `/compact` respektuje tę wartość, gdy ustawiono ją jawnie; w przeciwnym razie ręczne Compaction stanowi twardy punkt kontrolny.
- `recentTurnsPreserve`: liczba najnowszych tur użytkownika/asystenta zachowywanych bez zmian poza podsumowaniem zabezpieczającym. Domyślnie: `3`.
- `maxHistoryShare`: maksymalna część całkowitego budżetu kontekstu, która może zostać przeznaczona na zachowaną historię po Compaction (zakres `0.1`-`0.9`).
- `identifierPolicy`: `strict` (domyślnie), `off` lub `custom`. `strict` dodaje na początku wbudowane wskazówki dotyczące zachowywania nieprzezroczystych identyfikatorów podczas podsumowywania Compaction.
- `identifierInstructions`: opcjonalny niestandardowy tekst dotyczący zachowywania identyfikatorów, używany, gdy `identifierPolicy=custom`.
- `qualityGuard`: kontrole ponawiające próbę w przypadku nieprawidłowo sformatowanych danych wyjściowych podsumowań zabezpieczających. Domyślnie włączone w trybie zabezpieczającym; ustaw `enabled: false`, aby pominąć audyt.
- `midTurnPrecheck`: opcjonalna kontrola obciążenia pętli narzędzi. Gdy `enabled: true`, OpenClaw sprawdza obciążenie kontekstu po dołączeniu wyników narzędzi, a przed następnym wywołaniem modelu. Jeśli kontekst przestanie się mieścić, bieżąca próba zostaje przerwana przed przesłaniem promptu, a istniejąca ścieżka odzyskiwania kontroli wstępnej jest ponownie używana do skrócenia wyników narzędzi albo wykonania Compaction i ponowienia próby. Działa z trybami Compaction `default` oraz `safeguard`. Domyślnie: wyłączone.
- `postIndexSync`: tryb ponownego indeksowania pamięci sesji po Compaction. Domyślnie: `"async"`. Użyj `"await"`, aby uzyskać najwyższą aktualność, `"async"`, aby zmniejszyć opóźnienie Compaction, lub `"off"` tylko wtedy, gdy synchronizacja pamięci sesji jest obsługiwana w innym miejscu.
- `postCompactionSections`: opcjonalne nazwy sekcji H2/H3 pliku AGENTS.md, które mają zostać ponownie wstrzyknięte po Compaction. Ponowne wstrzykiwanie jest wyłączone, gdy wartość nie jest ustawiona lub wynosi `[]`. Jawne ustawienie `["Session Startup", "Red Lines"]` włącza tę parę i zachowuje starszy mechanizm awaryjny `Every Session`/`Safety`. Należy włączyć tę opcję tylko wtedy, gdy dodatkowy kontekst jest wart ryzyka powielenia wskazówek projektowych już ujętych w podsumowaniu Compaction.
- `model`: opcjonalny `provider/model-id` lub sam alias z `agents.defaults.models`, używany wyłącznie do podsumowywania Compaction. Same aliasy są rozwiązywane przed wysłaniem; skonfigurowane dosłowne identyfikatory modeli zachowują pierwszeństwo w przypadku kolizji. Należy użyć tej opcji, gdy główna sesja ma korzystać z jednego modelu, a podsumowania Compaction z innego; jeśli wartość nie jest ustawiona, Compaction używa podstawowego modelu sesji.
- `truncateAfterCompaction`: rotuje aktywną transkrypcję sesji po Compaction, dzięki czemu przyszłe tury wczytują tylko podsumowanie i niepodsumowaną końcową część, natomiast poprzednia pełna transkrypcja pozostaje zarchiwizowana. Zapobiega nieograniczonemu wzrostowi aktywnej transkrypcji w długotrwałych sesjach. Domyślnie: `false`.
- `maxActiveTranscriptBytes`: opcjonalny próg w bajtach (`number` lub ciągi takie jak `"20mb"`), który przed uruchomieniem wyzwala zwykłe lokalne Compaction, gdy historia transkrypcji przekroczy ten próg. Wymaga `truncateAfterCompaction`, aby pomyślne Compaction mogło wykonać rotację do mniejszej transkrypcji następczej. Wyłączone, gdy wartość nie jest ustawiona lub wynosi `0`.
- `notifyUser`: gdy `true`, wysyła użytkownikowi krótkie powiadomienia o utrzymaniu kontekstu: gdy Compaction rozpoczyna się i kończy (na przykład „Kompaktowanie kontekstu...” i „Kompaktowanie zakończone”) oraz gdy przed Compaction zostanie wyczerpana możliwość opróżnienia pamięci, przez co odpowiedź jest kontynuowana w trybie ograniczonym (na przykład „Utrzymanie pamięci tymczasowo nie powiodło się; odpowiedź będzie kontynuowana.”). Domyślnie wyłączone, aby te powiadomienia nie były wyświetlane.
- `memoryFlush`: cicha tura agenta przed automatycznym Compaction, służąca do zapisania trwałych wspomnień. Ustaw `model` na dokładnego dostawcę/model, takiego jak `ollama/qwen3:8b`, jeśli ta tura porządkowa ma pozostać na modelu lokalnym; nadpisanie nie dziedziczy aktywnego łańcucha modeli awaryjnych sesji. `forceFlushTranscriptBytes` wymusza opróżnienie, gdy rozmiar transkrypcji osiągnie próg, nawet jeśli liczniki tokenów są nieaktualne. Pomijane, gdy obszar roboczy jest tylko do odczytu.

### `agents.defaults.runRetries`

Granice iteracji ponawiania zewnętrznej pętli uruchomieniowej osadzonego środowiska wykonawczego agenta, zapobiegające nieskończonym pętlom wykonywania podczas odzyskiwania po awarii. To ustawienie dotyczy wyłącznie osadzonego środowiska wykonawczego agenta, a nie środowisk wykonawczych ACP ani CLI.

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
        runRetries: { max: 50 }, // opcjonalne nadpisania dla poszczególnych agentów
      },
    ],
  },
}
```

- `base`: podstawowa liczba iteracji ponawiania uruchomienia dla zewnętrznej pętli uruchomieniowej. Domyślnie: `24`.
- `perProfile`: dodatkowe iteracje ponawiania uruchomienia przyznawane każdemu kandydatowi profilu awaryjnego. Domyślnie: `8`.
- `min`: minimalny bezwzględny limit iteracji ponawiania uruchomienia. Domyślnie: `32`.
- `max`: maksymalny bezwzględny limit iteracji ponawiania uruchomienia, zapobiegający niekontrolowanemu wykonywaniu. Domyślnie: `160`.

### `agents.defaults.contextPruning`

Usuwa **stare wyniki narzędzi** z kontekstu w pamięci przed wysłaniem go do LLM. **Nie** modyfikuje historii sesji na dysku. Domyślnie wyłączone; ustaw `mode: "cache-ttl"`, aby włączyć.

```json5
{
  agents: {
    defaults: {
      contextPruning: {
        mode: "cache-ttl", // off (domyślnie) | cache-ttl
        ttl: "1h", // czas trwania (ms/s/m/h), jednostka domyślna: minuty; domyślnie: 5m
        keepLastAssistants: 3,
        softTrimRatio: 0.3,
        hardClearRatio: 0.5,
        minPrunableToolChars: 50000,
        softTrim: { maxChars: 4000, headChars: 1500, tailChars: 1500 },
        hardClear: { enabled: true, placeholder: "[Usunięto zawartość starego wyniku narzędzia]" },
        tools: { deny: ["browser", "canvas"] },
      },
    },
  },
}
```

<Accordion title="Działanie trybu cache-ttl">

- `mode: "cache-ttl"` włącza przebiegi przycinania.
- `ttl` określa, jak często przycinanie może zostać uruchomione ponownie (po ostatnim użyciu pamięci podręcznej). Domyślnie: `5m`.
- Przycinanie najpierw łagodnie skraca zbyt duże wyniki narzędzi, a następnie, jeśli jest to konieczne, całkowicie usuwa starsze wyniki narzędzi.
- `softTrimRatio` i `hardClearRatio` przyjmują wartości od `0.0` do `1.0`; walidacja konfiguracji odrzuca wartości spoza tego zakresu.

**Łagodne skracanie** zachowuje początek i koniec oraz wstawia `...` pośrodku.

**Całkowite usuwanie** zastępuje cały wynik narzędzia tekstem zastępczym.

Uwagi:

- Bloki obrazów nigdy nie są skracane ani usuwane.
- Współczynniki są oparte na liczbie znaków (w przybliżeniu), a nie na dokładnej liczbie tokenów.
- Jeśli istnieje mniej niż `keepLastAssistants` wiadomości asystenta, przycinanie jest pomijane.

</Accordion>

Szczegóły działania opisano w sekcji [Przycinanie sesji](/pl/concepts/session-pruning).

### Strumieniowanie blokowe

```json5
{
  agents: {
    defaults: {
      blockStreamingDefault: "off", // on | off
      blockStreamingBreak: "text_end", // text_end | message_end
      blockStreamingChunk: { minChars: 800, maxChars: 1200, breakPreference: "paragraph" },
      blockStreamingCoalesce: { idleMs: 1000 },
      humanDelay: { mode: "natural" }, // off (domyślnie) | natural | custom (używa minMs/maxMs)
    },
  },
}
```

- Kanały inne niż Telegram wymagają jawnego ustawienia `*.streaming.block.enabled: true`, aby włączyć odpowiedzi blokowe. QQ Bot stanowi wyjątek: nie ma kluczy `streaming.block` i strumieniuje odpowiedzi blokowe, chyba że `channels.qqbot.streaming.mode` ma wartość `"off"`.
- Nadpisania dla kanałów: `channels.<channel>.streaming.block.coalesce` (oraz warianty dla poszczególnych kont). Discord, Google Chat, Mattermost, MS Teams, Signal i Slack domyślnie używają `minChars: 1500` / `idleMs: 1000`.
- `blockStreamingChunk.breakPreference`: preferowana granica fragmentu (`"paragraph" | "newline" | "sentence"`).
- `humanDelay`: losowa pauza między odpowiedziami blokowymi. Domyślnie: `off`. `natural` = 800-2500ms. `custom` używa `minMs`/`maxMs` (dla każdej nieustawionej granicy używany jest naturalny zakres). Nadpisanie dla poszczególnych agentów: `agents.list[].humanDelay`.

Szczegóły działania i dzielenia na fragmenty opisano w sekcji [Strumieniowanie](/pl/concepts/streaming).

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

- Wartości domyślne: `instant` dla czatów bezpośrednich/wzmianek, `message` dla czatów grupowych bez wzmianki.
- Domyślna wartość `typingIntervalSeconds`: `6`.
- Nadpisania dla poszczególnych sesji: `session.typingMode`, `session.typingIntervalSeconds`.

Zobacz [Wskaźniki pisania](/pl/concepts/typing-indicators).

<a id="agentsdefaultssandbox"></a>

### `agents.defaults.sandbox`

Opcjonalna izolacja osadzonego agenta w piaskownicy. Pełny przewodnik znajduje się w sekcji [Izolacja w piaskownicy](/pl/gateway/sandboxing).

```json5
{
  agents: {
    defaults: {
      sandbox: {
        mode: "non-main", // off (domyślnie) | non-main | all
        backend: "docker", // docker (domyślnie) | ssh | openshell
        scope: "agent", // session | agent (domyślnie) | shared
        workspaceAccess: "none", // none (domyślnie) | ro | rw
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
          gpus: "all",
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
          // Obsługiwane są również SecretRefs / treści wbudowane:
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

Wartości domyślne przedstawione powyżej (obraz `off`/`docker`/`agent`/`none`/`bookworm-slim`/`none`, sieć itd.) są rzeczywistymi wartościami domyślnymi OpenClaw, a nie tylko wartościami przykładowymi.

<Accordion title="Szczegóły piaskownicy">

**Backend:**

- `docker`: lokalne środowisko uruchomieniowe Docker (domyślnie)
- `ssh`: ogólne zdalne środowisko uruchomieniowe oparte na SSH
- `openshell`: środowisko uruchomieniowe OpenShell

Po wybraniu `backend: "openshell"` ustawienia właściwe dla środowiska uruchomieniowego zostają przeniesione do
`plugins.entries.openshell.config`.

**Konfiguracja backendu SSH:**

- `target`: cel SSH w formacie `user@host[:port]`
- `command`: polecenie klienta SSH (domyślnie: `ssh`)
- `workspaceRoot`: bezwzględny zdalny katalog główny używany dla przestrzeni roboczych poszczególnych zakresów (domyślnie: `/tmp/openclaw-sandboxes`)
- `identityFile` / `certificateFile` / `knownHostsFile`: istniejące pliki lokalne przekazywane do OpenSSH
- `identityData` / `certificateData` / `knownHostsData`: treści wbudowane lub SecretRefs, które OpenClaw materializuje w plikach tymczasowych podczas działania
- `strictHostKeyChecking` / `updateHostKeys`: ustawienia zasad kluczy hosta OpenSSH (obie wartości domyślnie: `true`)

**Kolejność pierwszeństwa uwierzytelniania SSH:**

- `identityData` ma pierwszeństwo przed `identityFile`
- `certificateData` ma pierwszeństwo przed `certificateFile`
- `knownHostsData` ma pierwszeństwo przed `knownHostsFile`
- Wartości `*Data` oparte na SecretRef są rozwiązywane z aktywnej migawki środowiska uruchomieniowego sekretów przed rozpoczęciem sesji piaskownicy

**Działanie backendu SSH:**

- inicjuje zdalną przestrzeń roboczą jeden raz po utworzeniu lub ponownym utworzeniu
- następnie utrzymuje zdalną przestrzeń roboczą SSH jako kanoniczną
- kieruje `exec`, narzędzia plikowe i ścieżki multimediów przez SSH
- nie synchronizuje automatycznie zdalnych zmian z powrotem do hosta
- nie obsługuje kontenerów przeglądarki w piaskownicy

**Dostęp do przestrzeni roboczej:**

- `none`: przestrzeń robocza piaskownicy dla poszczególnych zakresów w `~/.openclaw/sandboxes` (domyślnie)
- `ro`: przestrzeń robocza piaskownicy w `/workspace`, przestrzeń robocza agenta zamontowana tylko do odczytu w `/agent`
- `rw`: przestrzeń robocza agenta zamontowana do odczytu i zapisu w `/workspace`

**Zakres:**

- `session`: kontener i przestrzeń robocza dla każdej sesji
- `agent`: jeden kontener i jedna przestrzeń robocza na agenta (domyślnie)
- `shared`: współdzielony kontener i przestrzeń robocza (bez izolacji między sesjami)

**Konfiguracja pluginu OpenShell:**

```json5
{
  plugins: {
    entries: {
      openshell: {
        enabled: true,
        config: {
          mode: "mirror", // mirror (domyślnie) | remote
          command: "openshell",
          from: "openclaw",
          remoteWorkspaceDir: "/sandbox",
          remoteAgentWorkspaceDir: "/agent",
          gateway: "lab", // opcjonalnie
          gatewayEndpoint: "https://lab.example", // opcjonalnie
          policy: "strict", // opcjonalny identyfikator zasad OpenShell
          providers: ["openai"], // opcjonalnie
          autoProviders: true,
          timeoutSeconds: 120,
        },
      },
    },
  },
}
```

**Tryb OpenShell:**

- `mirror`: przed wykonaniem inicjuje zasób zdalny na podstawie lokalnego, a po wykonaniu synchronizuje zmiany z powrotem; lokalna przestrzeń robocza pozostaje kanoniczna
- `remote`: inicjuje zasób zdalny jeden raz podczas tworzenia piaskownicy, a następnie utrzymuje zdalną przestrzeń roboczą jako kanoniczną

W trybie `remote` lokalne zmiany na hoście wprowadzone poza OpenClaw nie są automatycznie synchronizowane z piaskownicą po etapie inicjowania.
Transport odbywa się przez SSH do piaskownicy OpenShell, ale plugin zarządza cyklem życia piaskownicy i opcjonalną synchronizacją lustrzaną.

**`setupCommand`** jest uruchamiane jeden raz po utworzeniu kontenera (przez `sh -lc`). Wymaga wychodzącego dostępu do sieci, zapisywalnego katalogu głównego i użytkownika root.

**Kontenery domyślnie używają `network: "none"`** — jeśli agent potrzebuje dostępu wychodzącego, należy ustawić `"bridge"` (lub niestandardową sieć mostkową).
`"host"` jest blokowane. `"container:<id>"` jest domyślnie blokowane, chyba że jawnie ustawiono
`sandbox.docker.dangerouslyAllowContainerNamespaceJoin: true` (tryb awaryjny).
Tury serwera aplikacji Codex w aktywnej piaskownicy OpenClaw używają tego samego ustawienia ruchu wychodzącego do natywnego dostępu sieciowego w trybie kodu.

**Załączniki przychodzące** są umieszczane w `media/inbound/*` w aktywnej przestrzeni roboczej.

**`docker.binds`** montuje dodatkowe katalogi hosta; powiązania globalne i właściwe dla agenta są scalane.

**Przeglądarka w piaskownicy** (`sandbox.browser.enabled`, domyślnie `false`): Chromium + CDP w kontenerze. Adres URL noVNC jest wstrzykiwany do monitu systemowego. Nie wymaga `browser.enabled` w `openclaw.json`.
Dostęp obserwatora noVNC domyślnie korzysta z uwierzytelniania VNC, a OpenClaw generuje adres URL z krótkotrwałym tokenem (zamiast ujawniać hasło we współdzielonym adresie URL).

- `allowHostControl: false` (domyślnie) uniemożliwia sesjom w piaskownicy korzystanie z przeglądarki hosta.
- `network` ma domyślnie wartość `openclaw-sandbox-browser` (dedykowana sieć mostkowa). Wartość `bridge` należy ustawić tylko wtedy, gdy jawnie wymagana jest globalna łączność mostkowa. `"host"` jest również tutaj blokowane.
- `cdpSourceRange` opcjonalnie ogranicza ruch przychodzący CDP na granicy kontenera do zakresu CIDR (na przykład `172.21.0.1/32`).
- `sandbox.browser.binds` montuje dodatkowe katalogi hosta wyłącznie w kontenerze przeglądarki piaskownicy. Po ustawieniu (w tym na `[]`) zastępuje `docker.binds` dla kontenera przeglądarki.
- Chromium w kontenerze przeglądarki piaskownicy zawsze jest uruchamiane z `--no-sandbox --disable-setuid-sandbox` (kontenery nie mają mechanizmów jądra wymaganych przez własną piaskownicę Chrome); nie istnieje przełącznik konfiguracyjny tej opcji.
- Wartości domyślne uruchamiania są zdefiniowane w `scripts/sandbox-browser-entrypoint.sh` i dostosowane do hostów kontenerów:
  - `--remote-debugging-address=127.0.0.1`
  - `--remote-debugging-port=<derived from OPENCLAW_BROWSER_CDP_PORT>`
  - `--user-data-dir=${HOME}/.chrome`
  - `--no-first-run`
  - `--no-default-browser-check`
  - `--disable-dev-shm-usage`
  - `--disable-background-networking`
  - `--disable-breakpad`
  - `--disable-crash-reporter`
  - `--no-zygote`
  - `--metrics-recording-only`
  - `--password-store=basic`
  - `--use-mock-keychain`
  - `--disable-3d-apis`, `--disable-gpu` i `--disable-software-rasterizer` są
    domyślnie włączone i można je wyłączyć za pomocą
    `OPENCLAW_BROWSER_DISABLE_GRAPHICS_FLAGS=0`, jeśli wymaga tego korzystanie z WebGL/3D.
  - `--disable-extensions` (domyślnie włączone); `OPENCLAW_BROWSER_DISABLE_EXTENSIONS=0`
    ponownie włącza rozszerzenia, jeśli przepływ pracy od nich zależy.
  - `--renderer-process-limit=2` domyślnie; można zmienić za pomocą
    `OPENCLAW_BROWSER_RENDERER_PROCESS_LIMIT=<N>`, a ustawienie `0` powoduje użycie domyślnego
    limitu procesów Chromium.
  - `--headless=new` tylko wtedy, gdy włączono `headless`.
  - Wartości domyślne odpowiadają konfiguracji bazowej obrazu kontenera; aby zmienić wartości domyślne kontenera, należy użyć niestandardowego obrazu przeglądarki z niestandardowym
    punktem wejścia.

</Accordion>

Izolacja przeglądarki w piaskownicy i `sandbox.docker.binds` są dostępne tylko w Dockerze.

Budowanie obrazów (z kopii roboczej kodu źródłowego):

```bash
scripts/sandbox-setup.sh           # główny obraz piaskownicy
scripts/sandbox-browser-setup.sh   # opcjonalny obraz przeglądarki
```

W przypadku instalacji npm bez kopii roboczej kodu źródłowego zobacz [Piaskownica § Obrazy i konfiguracja](/pl/gateway/sandboxing#images-and-setup), gdzie opisano wbudowane polecenia `docker build`.

### `agents.list` (nadpisania dla poszczególnych agentów)

Użyj `agents.list[].tts`, aby przypisać agentowi własnego dostawcę TTS, głos, model,
styl lub tryb automatycznego TTS. Blok agenta jest głęboko scalany z globalnym
`messages.tts`, dzięki czemu współdzielone poświadczenia mogą pozostać w jednym miejscu, a poszczególni
agenci mogą nadpisywać tylko potrzebne pola głosu lub dostawcy. Nadpisanie aktywnego agenta
ma zastosowanie do automatycznych odpowiedzi głosowych, `/tts audio`, `/tts status` oraz
narzędzia agenta `tts`. Przykłady dostawców i kolejność pierwszeństwa opisano w sekcji [Synteza mowy](/pl/tools/tts#per-agent-voice-overrides).

```json5
{
  agents: {
    list: [
      {
        id: "main",
        default: true,
        name: "Główny agent",
        workspace: "~/.openclaw/workspace",
        agentDir: "~/.openclaw/agents/main/agent",
        model: "anthropic/claude-opus-4-6", // lub { primary, fallbacks }
        utilityModel: "openai/gpt-5.4-mini",
        thinkingDefault: "high", // nadpisanie poziomu myślenia dla danego agenta
        reasoningDefault: "on", // nadpisanie widoczności rozumowania dla danego agenta
        fastModeDefault: false, // nadpisanie trybu szybkiego dla danego agenta
        params: { cacheRetention: "none" }, // nadpisuje według klucza pasujące parametry defaults.models
        tts: {
          providers: {
            elevenlabs: { speakerVoiceId: "EXAVITQu4vr4xnSDxMaL" },
          },
        },
        skills: ["docs-search"], // po ustawieniu zastępuje agents.defaults.skills
        identity: {
          name: "Samantha",
          theme: "pomocny leniwiec",
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
            mode: "persistent", // persistent | oneshot
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
- `default`: gdy ustawiono wiele, obowiązuje pierwszy (rejestrowane jest ostrzeżenie). Jeśli nie ustawiono żadnego, domyślny jest pierwszy wpis listy.
- `model`: forma tekstowa ustawia ścisły model główny dla danego agenta bez modelu rezerwowego; forma obiektowa `{ primary }` również jest ścisła, chyba że dodano `fallbacks`. Użyj `{ primary, fallbacks: [...] }`, aby włączyć model rezerwowy dla tego agenta, lub `{ primary, fallbacks: [] }`, aby jawnie wskazać ścisłe zachowanie. Zadania Cron, które nadpisują tylko `primary`, nadal dziedziczą domyślne modele rezerwowe, chyba że ustawiono `fallbacks: []`.
- `utilityModel`: opcjonalne nadpisanie dla danego agenta używane w krótkich zadaniach wewnętrznych, takich jak generowanie tytułów sesji i wątków. W razie braku wartości używane jest `agents.defaults.utilityModel`, następnie zadeklarowany przez głównego dostawcę domyślny mały model, a na końcu główny model tego agenta. Pusty ciąg wyłącza kierowanie zadań pomocniczych dla tego agenta.
- `params`: parametry strumienia dla danego agenta scalane z wybranym wpisem modelu w `agents.defaults.models`. Służy do nadpisań właściwych dla agenta, takich jak `cacheRetention`, `temperature` lub `maxTokens`, bez powielania całego katalogu modeli.
- `tts`: opcjonalne nadpisania zamiany tekstu na mowę dla danego agenta. Blok jest głęboko scalany z `messages.tts`, dlatego współdzielone dane uwierzytelniające dostawcy i zasady rezerwowe należy przechowywać w `messages.tts`, a tutaj ustawiać tylko wartości właściwe dla persony, takie jak dostawca, głos, model, styl lub tryb automatyczny.
- `skills`: opcjonalna lista dozwolonych Skills dla danego agenta. Jeśli ją pominięto, agent dziedziczy `agents.defaults.skills`, o ile je ustawiono; jawna lista zastępuje wartości domyślne zamiast się z nimi scalać, a `[]` oznacza brak Skills.
- `thinkingDefault`: opcjonalny domyślny poziom myślenia dla danego agenta (`off | minimal | low | medium | high | xhigh | adaptive | max`). Nadpisuje `agents.defaults.thinkingDefault` dla tego agenta, gdy nie ustawiono nadpisania dla wiadomości ani sesji. Wybrany profil dostawcy/modelu określa, które wartości są prawidłowe; w przypadku Google Gemini `adaptive` zachowuje dynamiczne myślenie kontrolowane przez dostawcę (`thinkingLevel` pominięte w Gemini 3/3.1, `thinkingBudget: -1` w Gemini 2.5).
- `reasoningDefault`: opcjonalna domyślna widoczność rozumowania dla danego agenta (`on | off | stream`). Nadpisuje `agents.defaults.reasoningDefault` dla tego agenta, gdy nie ustawiono nadpisania rozumowania dla wiadomości ani sesji.
- `fastModeDefault`: opcjonalne ustawienie domyślne trybu szybkiego dla danego agenta (`"auto" | true | false`). Obowiązuje, gdy nie ustawiono nadpisania trybu szybkiego dla wiadomości ani sesji.
- `models`: opcjonalne nadpisania katalogu modeli/środowiska uruchomieniowego dla danego agenta, indeksowane pełnymi identyfikatorami `provider/model`. Użyj `models["provider/model"].agentRuntime` dla wyjątków środowiska uruchomieniowego właściwych dla agenta.
- `runtime`: opcjonalny opis środowiska uruchomieniowego dla danego agenta. Użyj `type: "acp"` z wartościami domyślnymi `runtime.acp` (`agent`, `backend`, `mode`, `cwd`), gdy agent powinien domyślnie korzystać z sesji systemu ACP.
- `identity.avatar`: ścieżka względna wobec przestrzeni roboczej, adres URL `http(s)` lub URI `data:`.
- Lokalne pliki obrazów `identity.avatar` wskazane ścieżką względną wobec przestrzeni roboczej są ograniczone do 2 MB. Adresy URL `http(s)` i URI `data:` nie są sprawdzane pod kątem lokalnego limitu rozmiaru pliku.
- `identity` wyprowadza wartości domyślne: `ackReaction` z `emoji`, `mentionPatterns` z `name`/`emoji`.
- `subagents.allowAgents`: lista dozwolonych identyfikatorów skonfigurowanych agentów dla jawnych celów `sessions_spawn.agentId` (`["*"]` = dowolny skonfigurowany cel; domyślnie: tylko ten sam agent). Uwzględnij identyfikator żądającego, jeśli mają być dozwolone wywołania `agentId` kierowane do niego samego. Nieaktualne wpisy, których konfigurację agenta usunięto, są odrzucane przez `sessions_spawn` i pomijane w `agents_list`; uruchom `openclaw doctor --fix`, aby je usunąć, albo dodaj minimalny wpis `agents.list[]`, jeśli ten cel ma nadal umożliwiać tworzenie instancji przy jednoczesnym dziedziczeniu wartości domyślnych.
- Zabezpieczenie dziedziczenia piaskownicy: jeśli sesja żądającego działa w piaskownicy, `sessions_spawn` odrzuca cele, które działałyby poza piaskownicą.
- `subagents.requireAgentId`: gdy ma wartość true, blokuje wywołania `sessions_spawn`, które pomijają `agentId` (wymusza jawny wybór profilu; domyślnie: false).
- `subagents.maxConcurrent`: maksymalna liczba jednoczesnych uruchomień agentów podrzędnych w całym wykonywaniu podagentów. Domyślnie: `8`.
- `subagents.maxChildrenPerAgent`: maksymalna liczba aktywnych agentów podrzędnych, które może utworzyć pojedyncza sesja agenta. Domyślnie: `5`.
- `subagents.maxSpawnDepth`: maksymalna głębokość zagnieżdżenia tworzenia agentów podrzędnych (`1`-`5`). Domyślnie: `1` (bez zagnieżdżania).
- `subagents.archiveAfterMinutes`: czas, po którym stan ukończonego podagenta jest archiwizowany. Domyślnie: `60`.

---

## Kierowanie ruchem wielu agentów

Uruchamiaj wiele odizolowanych agentów wewnątrz jednego Gateway. Zobacz [Wielu agentów](/pl/concepts/multi-agent).

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

- `type` (opcjonalne): `route` dla zwykłego kierowania ruchem (brak typu oznacza domyślnie trasę), `acp` dla trwałych powiązań konwersacji ACP.
- `match.channel` (wymagane)
- `match.accountId` (opcjonalne; `*` = dowolne konto; pominięte = konto domyślne)
- `match.peer` (opcjonalne; `{ kind: direct|group|channel, id }`)
- `match.guildId` / `match.teamId` (opcjonalne; właściwe dla kanału)
- `acp` (opcjonalne; tylko dla `type: "acp"`): `{ mode, label, cwd, backend }`

**Deterministyczna kolejność dopasowania:**

1. `match.peer`
2. `match.guildId`
3. `match.teamId`
4. `match.accountId` (dokładne, bez partnera/gildii/zespołu)
5. `match.accountId: "*"` (dla całego kanału)
6. Agent domyślny

W ramach każdego poziomu obowiązuje pierwszy pasujący wpis `bindings`.

W przypadku wpisów `type: "acp"` OpenClaw rozpoznaje dokładną tożsamość konwersacji (`match.channel` + konto + `match.peer.id`) i nie używa opisanej wyżej kolejności poziomów powiązań tras.

### Profile dostępu dla poszczególnych agentów

<Accordion title="Pełny dostęp (bez piaskownicy)">

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

<Accordion title="Narzędzia i przestrzeń robocza tylko do odczytu">

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

Szczegółowe informacje o pierwszeństwie zawiera strona [Piaskownica i narzędzia dla wielu agentów](/pl/tools/multi-agent-sandbox-tools).

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
    resetByChannel: {
      discord: { mode: "idle", idleMinutes: 30 },
    },
    resetTriggers: ["/new", "/reset"],
    store: "~/.openclaw/agents/{agentId}/sessions/sessions.json",
    maintenance: {
      mode: "enforce", // enforce (domyślnie) | warn
      pruneAfter: "30d",
      maxEntries: 500,
      resetArchiveRetention: "30d", // czas trwania lub false
      maxDiskBytes: "500mb", // opcjonalny sztywny budżet
      highWaterBytes: "400mb", // opcjonalny docelowy poziom czyszczenia
    },
    writeLock: {
      acquireTimeoutMs: 60000,
      staleMs: 1800000,
      maxHoldMs: 300000,
    },
    threadBindings: {
      enabled: true,
      idleHours: 24, // domyślne automatyczne usunięcie fokusu po bezczynności w godzinach (`0` wyłącza)
      maxAgeHours: 0, // domyślny sztywny maksymalny wiek w godzinach (`0` wyłącza)
    },
    mainKey: "main", // starsza opcja (środowisko uruchomieniowe zawsze używa "main")
    agentToAgent: { maxPingPongTurns: 5 },
    sendPolicy: {
      rules: [{ action: "deny", match: { channel: "discord", chatType: "group" } }],
      default: "allow",
    },
  },
}
```

<Accordion title="Szczegóły pól sesji">

- **`scope`**: podstawowa strategia grupowania sesji w kontekstach czatów grupowych.
  - `per-sender` (domyślnie): każdy nadawca otrzymuje odizolowaną sesję w kontekście kanału.
  - `global`: wszyscy uczestnicy w kontekście kanału współdzielą jedną sesję (należy używać tylko wtedy, gdy współdzielony kontekst jest zamierzony).
- **`dmScope`**: sposób grupowania wiadomości prywatnych.
  - `main`: wszystkie wiadomości prywatne współdzielą sesję główną.
  - `per-peer`: izolowanie według identyfikatora nadawcy we wszystkich kanałach.
  - `per-channel-peer`: izolowanie według kanału i nadawcy (zalecane w skrzynkach odbiorczych obsługujących wielu użytkowników).
  - `per-account-channel-peer`: izolowanie według konta, kanału i nadawcy (zalecane przy wielu kontach).
- **`identityLinks`**: mapowanie kanonicznych identyfikatorów na partnerów z prefiksem dostawcy w celu współdzielenia sesji między kanałami. Polecenia dokowania, takie jak `/dock_discord`, używają tej samej mapy do przełączania trasy odpowiedzi aktywnej sesji na partnera w innym połączonym kanale; zobacz [Dokowanie kanałów](/pl/concepts/channel-docking).
- **`reset`**: podstawowe zasady resetowania. `daily` resetuje o `atHour` czasu lokalnego; `idle` resetuje po `idleMinutes`. Gdy skonfigurowano oba ustawienia, pierwszeństwo ma to, które wygaśnie wcześniej. Aktualność resetu dziennego wykorzystuje pole `sessionStartedAt` wiersza sesji, a aktualność resetu z powodu bezczynności wykorzystuje `lastInteractionAt`. Zapisy zdarzeń w tle/systemowych, takich jak heartbeat, wybudzenia cron, powiadomienia exec i operacje ewidencyjne Gateway, mogą aktualizować `updatedAt`, ale nie podtrzymują aktualności sesji dziennych ani sesji opartych na bezczynności.
- **`resetByType`**: nadpisania dla poszczególnych typów (`direct`, `group`, `thread`). Starsze `dm` jest akceptowane jako alias `direct`.
- **`resetByChannel`**: nadpisania resetowania dla poszczególnych kanałów, indeksowane według identyfikatora dostawcy/kanału. Gdy kanał sesji ma pasujący wpis, ma on bezwzględne pierwszeństwo przed `resetByType`/`reset` dla tej sesji. Należy używać tylko wtedy, gdy jeden kanał wymaga zachowania resetowania innego niż zasady na poziomie typu.
- **`mainKey`**: starsze pole. Środowisko wykonawcze zawsze używa `"main"` jako głównego zasobnika czatu bezpośredniego.
- **`agentToAgent.maxPingPongTurns`**: maksymalna liczba tur odpowiedzi zwrotnych między agentami podczas wymiany agent–agent (liczba całkowita, zakres: `0`-`20`, domyślnie: `5`). `0` wyłącza łańcuchowe odpowiedzi naprzemienne.
- **`sendPolicy`**: dopasowanie według `channel`, `chatType` (`direct|group|channel`, ze starszym aliasem `dm`), `keyPrefix` lub `rawKeyPrefix`. Pierwsza odmowa ma pierwszeństwo.
- **`maintenance`**: mechanizmy czyszczenia i przechowywania magazynu sesji.
  - `mode`: `enforce` wykonuje czyszczenie i jest wartością domyślną; `warn` generuje tylko ostrzeżenia.
  - `pruneAfter`: graniczny wiek nieaktualnych wpisów (domyślnie `30d`).
  - `maxEntries`: maksymalna liczba wpisów sesji SQLite (domyślnie `500`). Zapisy środowiska wykonawczego wykonują czyszczenie wsadowe z niewielkim buforem górnego progu dla limitów o skali produkcyjnej; `openclaw sessions cleanup --enforce` stosuje limit natychmiast.
  - Krótkotrwałe sesje diagnostyczne uruchomień modeli Gateway mają stały okres przechowywania `24h`, ale czyszczenie jest uzależnione od obciążenia: usuwa nieaktualne wiersze ścisłych sesji diagnostycznych uruchomień modeli tylko po osiągnięciu progu konserwacji/liczby wpisów sesji. Kwalifikują się wyłącznie jawne klucze ścisłych sesji diagnostycznych zgodne z `agent:*:explicit:model-run-<uuid>`; zwykłe sesje bezpośrednie, grupowe, wątkowe, cron, hook, heartbeat, ACP i podagentów nie dziedziczą tego 24-godzinnego okresu przechowywania. Gdy uruchamiane jest czyszczenie uruchomień modeli, następuje ono przed szerszym czyszczeniem nieaktualnych wpisów `pruneAfter` i zastosowaniem limitu `maxEntries`.
  - Starsze `rotateBytes` jest odrzucane przez bieżący schemat; `openclaw doctor --fix` usuwa je ze starszych konfiguracji.
  - `resetArchiveRetention`: przechowywanie archiwów zresetowanych/usuniętych transkrypcji zależne od wieku. Domyślnie archiwa pozostają do czasu usunięcia z powodu limitu miejsca na dysku; należy ustawić czas trwania, aby włączyć usuwanie według czasu zegarowego, albo `false`, aby jawnie je wyłączyć.
  - `maxDiskBytes`: opcjonalny limit miejsca na dysku dla katalogu sesji. W trybie `warn` rejestruje ostrzeżenia; w trybie `enforce` najpierw usuwa najstarsze artefakty/sesje.
  - `highWaterBytes`: opcjonalny poziom docelowy po czyszczeniu wynikającym z limitu. Domyślnie `80%` wartości `maxDiskBytes`.
- **`writeLock`**: ustawienia blokady zapisu transkrypcji sesji. Należy je dostosowywać tylko wtedy, gdy prawidłowe przygotowywanie transkrypcji, czyszczenie, Compaction lub wykonywanie kopii lustrzanych powoduje rywalizację trwającą dłużej niż przewidują domyślne zasady.
  - `acquireTimeoutMs`: liczba milisekund oczekiwania podczas uzyskiwania blokady przed zgłoszeniem sesji jako zajętej. Domyślnie: `60000`; nadpisanie zmienną środowiskową `OPENCLAW_SESSION_WRITE_LOCK_ACQUIRE_TIMEOUT_MS`.
  - `staleMs`: liczba milisekund, po której istniejąca blokada jest uznawana za nieaktualną i przejmowana. Domyślnie: `1800000`; nadpisanie zmienną środowiskową `OPENCLAW_SESSION_WRITE_LOCK_STALE_MS`.
  - `maxHoldMs`: liczba milisekund, przez którą utrzymywana blokada wewnątrz procesu może pozostać aktywna, zanim mechanizm nadzorujący ją zwolni. Domyślnie: `300000`; nadpisanie zmienną środowiskową `OPENCLAW_SESSION_WRITE_LOCK_MAX_HOLD_MS`.
- **`threadBindings`**: globalne wartości domyślne funkcji sesji powiązanych z wątkami.
  - `enabled`: główny przełącznik domyślny (dostawcy mogą go nadpisać; Discord używa `channels.discord.threadBindings.enabled`)
  - `idleHours`: domyślny czas automatycznego wyłączenia aktywności po bezczynności, w godzinach (`0` wyłącza; dostawcy mogą nadpisać)
  - `maxAgeHours`: domyślny bezwzględny maksymalny wiek w godzinach (`0` wyłącza; dostawcy mogą nadpisać)
  - `spawnSessions`: domyślna bramka tworzenia sesji roboczych powiązanych z wątkami z `sessions_spawn` oraz uruchomień wątków ACP. Domyślnie `true`, gdy powiązania wątków są włączone; dostawcy/konta mogą nadpisać.
  - `defaultSpawnContext`: domyślny natywny kontekst podagenta dla uruchomień powiązanych z wątkami (`"fork"` lub `"isolated"`). Domyślnie `"fork"`.

</Accordion>

---

## Wiadomości

```json5
{
  messages: {
    responsePrefix: "🦞", // lub "auto"
    ackReaction: "👀",
    ackReactionScope: "group-mentions", // group-mentions | group-all | direct | all | off | none
    removeAckAfterReply: false,
    queue: {
      mode: "steer", // steer (domyślnie) | followup | collect | interrupt
      debounceMs: 500,
      cap: 20,
      drop: "summarize", // old | new | summarize (domyślnie)
      byChannel: {
        whatsapp: "followup",
        telegram: "followup",
      },
    },
    inbound: {
      debounceMs: 2000, // 0 wyłącza
      byChannel: {
        whatsapp: 5000,
        slack: 1500,
      },
    },
  },
}
```

### Prefiks odpowiedzi

Nadpisania dla poszczególnych kanałów/kont: `channels.<channel>.responsePrefix`, `channels.<channel>.accounts.<id>.responsePrefix`.

Rozstrzyganie (pierwszeństwo ma najbardziej szczegółowe ustawienie): konto → kanał → globalne. `""` wyłącza i zatrzymuje kaskadę. `"auto"` wyznacza `[{identity.name}]`.

**Zmienne szablonu:**

| Zmienna           | Opis                   | Przykład                    |
| ----------------- | ---------------------- | --------------------------- |
| `{model}`         | Krótka nazwa modelu    | `claude-opus-4-6`           |
| `{modelFull}`     | Pełny identyfikator modelu | `anthropic/claude-opus-4-6` |
| `{provider}`      | Nazwa dostawcy         | `anthropic`                 |
| `{thinkingLevel}` | Bieżący poziom rozumowania | `high`, `low`, `off`        |
| `{identity.name}` | Nazwa tożsamości agenta | (taka sama jak `"auto"`)          |

Wielkość liter w zmiennych nie ma znaczenia. `{think}` jest aliasem `{thinkingLevel}`.

### Reakcja potwierdzająca

- Domyślnie używa `identity.emoji` aktywnego agenta, a w przeciwnym razie `"👀"`. Aby wyłączyć, należy ustawić `""`.
- Nadpisania dla poszczególnych kanałów: `channels.<channel>.ackReaction`, `channels.<channel>.accounts.<id>.ackReaction`.
- Kolejność rozstrzygania: konto → kanał → `messages.ackReaction` → wartość zastępcza tożsamości.
- Zakres: `group-mentions` (domyślnie), `group-all`, `direct`, `all` albo `off`/`none` (całkowicie wyłącza reakcje potwierdzające).
- `removeAckAfterReply`: usuwa reakcję potwierdzającą po odpowiedzi w kanałach obsługujących reakcje, takich jak Slack, Discord, Signal, Telegram, WhatsApp i iMessage.
- `messages.statusReactions.enabled`: włącza reakcje stanu cyklu życia w Slack, Discord, Signal, Telegram i WhatsApp.
  W Discord brak ustawienia pozostawia reakcje stanu włączone, gdy aktywne są reakcje potwierdzające.
  W Slack, Signal, Telegram i WhatsApp należy jawnie ustawić `true`, aby włączyć reakcje stanu cyklu życia.
  Slack domyślnie używa natywnego stanu wątku asystenta i zmieniających się komunikatów ładowania do wskazywania postępu, pozostawiając skonfigurowaną reakcję potwierdzającą bez zmian.
- `messages.statusReactions.emojis`: nadpisuje klucze emoji cyklu życia:
  `queued`, `thinking`, `compacting`, `tool`, `coding`, `web`, `deploy`, `build`,
  `concierge`, `done`, `error`, `stallSoft` i `stallHard`.
  Telegram zezwala tylko na stały zestaw reakcji, dlatego nieobsługiwane skonfigurowane emoji są zastępowane
  najbliższym obsługiwanym wariantem stanu dla danego czatu.

### Kolejka

- `mode`: strategia kolejkowania wiadomości przychodzących, które docierają podczas aktywnego uruchomienia sesji. Domyślnie: `"steer"`.
  - `steer`: wstrzykuje nowy prompt do aktywnego uruchomienia.
  - `followup`: uruchamia nowy prompt po zakończeniu aktywnego uruchomienia.
  - `collect`: grupuje zgodne wiadomości i uruchamia je później razem.
  - `interrupt`: przerywa aktywne uruchomienie przed rozpoczęciem najnowszego promptu.
- `debounceMs`: opóźnienie przed przekazaniem wiadomości oczekującej w kolejce/kierowanej. Domyślnie: `500`.
- `cap`: maksymalna liczba wiadomości w kolejce przed zastosowaniem zasad odrzucania. Domyślnie: `20`.
- `drop`: strategia po przekroczeniu limitu. `"summarize"` (domyślnie) odrzuca najstarsze wpisy, ale zachowuje zwięzłe podsumowania; `"old"` odrzuca najstarsze bez podsumowań; `"new"` odrzuca najnowszy element.
- `byChannel`: nadpisania `mode` dla poszczególnych kanałów, indeksowane według identyfikatora dostawcy.
- `debounceMsByChannel`: nadpisania `debounceMs` dla poszczególnych kanałów, indeksowane według identyfikatora dostawcy.

### Opóźnianie wiadomości przychodzących

Grupuje szybko następujące po sobie wiadomości zawierające wyłącznie tekst od tego samego nadawcy w jedną turę agenta. Multimedia/załączniki powodują natychmiastowe przekazanie. Polecenia sterujące omijają opóźnianie. Domyślne `debounceMs`: `2000`.

### Inne klucze wiadomości

- `messages.messagePrefix`: tekst prefiksu dołączany przed przychodzącymi wiadomościami użytkownika, zanim dotrą one do środowiska wykonawczego agenta. Należy używać oszczędnie jako znacznika kontekstu kanału.
- `messages.visibleReplies`: steruje widocznymi odpowiedziami źródłowymi w rozmowach bezpośrednich, grupowych i kanałowych (`"message_tool"` wymaga `message(action=send)` do uzyskania widocznych danych wyjściowych; `"automatic"` publikuje zwykłe odpowiedzi tak jak wcześniej).
- `messages.usageTemplate` / `messages.responseUsage`: niestandardowy szablon stopki `/usage` i domyślny tryb użycia dla każdej odpowiedzi (`off | tokens | full` oraz starszy alias `on` dla `tokens`).
- `messages.groupChat.mentionPatterns` / `historyLimit`: wyzwalacze wzmianek w wiadomościach grupowych i rozmiar okna historii.
- `messages.suppressToolErrors`: gdy ustawiono `true`, ukrywa ostrzeżenia o błędach narzędzi `⚠️` wyświetlane użytkownikowi (agent nadal widzi błędy w kontekście i może ponowić próbę). Domyślnie: `false`.

### TTS (zamiana tekstu na mowę)

```json5
{
  messages: {
    tts: {
      auto: "off", // off (domyślnie) | always | inbound | tagged
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
          speakerVoice: "en-US-MichelleNeural",
          lang: "en-US",
          outputFormat: "audio-24khz-48kbitrate-mono-mp3",
        },
        openai: {
          apiKey: "openai_api_key",
          baseUrl: "https://api.openai.com/v1",
          model: "gpt-4o-mini-tts",
          speakerVoice: "coral",
        },
      },
    },
  },
}
```

- `auto` kontroluje domyślny automatyczny tryb TTS: `off`, `always`, `inbound` lub `tagged`. `/tts on|off` może zastąpić lokalne preferencje, a `/tts status` pokazuje obowiązujący stan.
- `summaryModel` zastępuje `agents.defaults.model.primary` na potrzeby automatycznego podsumowania.
- `modelOverrides` jest domyślnie włączone (`enabled !== false`); `modelOverrides.allowProvider` wymaga jawnego włączenia.
- Klucze API korzystają awaryjnie z `ELEVENLABS_API_KEY`/`XI_API_KEY` i `OPENAI_API_KEY`.
- Dostawcy syntezy mowy dołączani w pakiecie są zarządzani przez pluginy. Jeśli ustawiono `plugins.allow`, należy uwzględnić każdy plugin dostawcy TTS, który ma być używany, na przykład `microsoft` dla Edge TTS. Starszy identyfikator dostawcy `edge` jest akceptowany jako alias dla `microsoft`.
- `providers.openai.baseUrl` zastępuje punkt końcowy TTS OpenAI. Kolejność rozstrzygania to konfiguracja, następnie `OPENAI_TTS_BASE_URL`, a potem `https://api.openai.com/v1`.
- Gdy `providers.openai.baseUrl` wskazuje punkt końcowy inny niż OpenAI, OpenClaw traktuje go jako serwer TTS zgodny z OpenAI i stosuje mniej rygorystyczną walidację modelu oraz głosu.

---

## Rozmowa

Ustawienia domyślne trybu rozmowy (macOS/iOS/Android oraz interfejs Control UI w przeglądarce).

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
        modelId: "eleven_multilingual_v2",
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
          model: "gpt-realtime-2.1",
          speakerVoice: "cedar",
        },
      },
      instructions: "Mów ciepłym tonem i odpowiadaj zwięźle.",
      mode: "realtime", // realtime | stt-tts | transcription
      transport: "webrtc", // webrtc | provider-websocket | gateway-relay | managed-room
      vadThreshold: 0.5,
      silenceDurationMs: 500,
      prefixPaddingMs: 300,
      reasoningEffort: "medium",
      brain: "agent-consult", // agent-consult | direct-tools | none
    },
  },
}
```

- `talk.provider` musi odpowiadać kluczowi w `talk.providers`, gdy skonfigurowano wielu dostawców trybu rozmowy.
- Starsze płaskie klucze trybu rozmowy (`talk.voiceId`, `talk.voiceAliases`, `talk.modelId`, `talk.outputFormat`, `talk.apiKey`) służą wyłącznie do zachowania zgodności. Należy uruchomić `openclaw doctor --fix`, aby przepisać utrwaloną konfigurację do `talk.providers.<provider>`.
- Identyfikatory głosu korzystają awaryjnie z `ELEVENLABS_VOICE_ID` lub `SAG_VOICE_ID` (zachowanie klienta trybu rozmowy w systemie macOS).
- `providers.*.apiKey` przyjmuje ciągi tekstowe w postaci zwykłego tekstu lub obiekty SecretRef.
- Mechanizm awaryjny `ELEVENLABS_API_KEY` ma zastosowanie tylko wtedy, gdy nie skonfigurowano klucza API trybu rozmowy.
- `providers.*.voiceAliases` umożliwia dyrektywom trybu rozmowy używanie przyjaznych nazw.
- `providers.mlx.modelId` wybiera repozytorium Hugging Face używane przez lokalnego pomocnika MLX w systemie macOS. Jeśli pominięto tę wartość, macOS używa `mlx-community/Soprano-80M-bf16`.
- Odtwarzanie MLX w systemie macOS odbywa się przez dołączonego pomocnika `openclaw-mlx-tts`, jeśli jest dostępny, lub przez plik wykonywalny w `PATH`; `OPENCLAW_MLX_TTS_BIN` zastępuje ścieżkę pomocnika na potrzeby programowania.
- `consultThinkingLevel` kontroluje poziom rozumowania dla pełnego uruchomienia agenta OpenClaw obsługującego wywołania `openclaw_agent_consult` trybu rozmowy w czasie rzeczywistym w Control UI. Pozostawienie tej opcji bez ustawienia zachowuje normalne działanie sesji/modelu.
- `consultFastMode` ustawia jednorazowe zastąpienie trybu szybkiego dla konsultacji trybu rozmowy w czasie rzeczywistym w Control UI bez zmiany normalnego ustawienia trybu szybkiego sesji.
- `speechLocale` ustawia identyfikator ustawień regionalnych BCP 47 używany przez rozpoznawanie mowy trybu rozmowy w systemach iOS/macOS. Pozostawienie tej opcji bez ustawienia powoduje użycie wartości domyślnej urządzenia.
- `silenceTimeoutMs` kontroluje czas oczekiwania trybu rozmowy po zapadnięciu ciszy po stronie użytkownika, zanim transkrypcja zostanie wysłana. Pozostawienie bez ustawienia zachowuje domyślne okno pauzy platformy (`700 ms on macOS and Android, 900 ms on iOS`).
- `realtime.instructions` dołącza instrukcje systemowe przeznaczone dla dostawcy do wbudowanego monitu OpenClaw czasu rzeczywistego, dzięki czemu można skonfigurować styl głosu bez utraty domyślnych wytycznych `openclaw_agent_consult`.
- `realtime.vadThreshold` ustawia próg aktywności głosowej dostawcy od `0` (największa czułość) do `1` (najmniejsza czułość). Pozostawienie bez ustawienia zachowuje wartość domyślną dostawcy.
- `realtime.silenceDurationMs` ustawia dodatnie, wyrażone liczbą całkowitą okno ciszy, po którym dostawca zatwierdza wypowiedź użytkownika w czasie rzeczywistym. Pozostawienie bez ustawienia zachowuje wartość domyślną dostawcy.
- `realtime.prefixPaddingMs` ustawia nieujemną, wyrażoną liczbą całkowitą ilość dźwięku zachowywanego przed początkiem wykrytej mowy. Pozostawienie bez ustawienia zachowuje wartość domyślną dostawcy.
- `realtime.reasoningEffort` ustawia właściwy dla dostawcy poziom rozumowania dla sesji czasu rzeczywistego. Pozostawienie bez ustawienia zachowuje wartość domyślną dostawcy.
- `realtime.consultRouting`: `"provider-direct"` (domyślnie) zachowuje bezpośrednie odpowiedzi dostawcy, gdy dostawca czasu rzeczywistego generuje ostateczną transkrypcję wypowiedzi użytkownika bez `openclaw_agent_consult`. Zamiast tego `"force-agent-consult"` kieruje sfinalizowane żądanie przez OpenClaw.

---

## Powiązane materiały

- [Dokumentacja konfiguracji](/pl/gateway/configuration-reference) — wszystkie pozostałe klucze konfiguracji
- [Konfiguracja](/pl/gateway/configuration) — typowe zadania i szybka konfiguracja
- [Przykłady konfiguracji](/pl/gateway/configuration-examples)
