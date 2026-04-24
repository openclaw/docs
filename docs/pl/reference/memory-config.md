---
read_when:
    - Chcesz skonfigurować dostawców wyszukiwania Memory lub modele osadzania
    - Chcesz skonfigurować backend QMD
    - Chcesz dostroić wyszukiwanie hybrydowe, MMR lub zanik czasowy
    - Chcesz włączyć multimodalne indeksowanie Memory
summary: Wszystkie ustawienia konfiguracji wyszukiwania pamięci, dostawców osadzania, QMD, wyszukiwania hybrydowego i indeksowania multimodalnego
title: Informacje o konfiguracji Memory
x-i18n:
    generated_at: "2026-04-24T09:31:17Z"
    model: gpt-5.4
    provider: openai
    source_hash: b9152d6cdf3959319c2ba000fae06c72b27b9b8c90ee08ce57b80d1c0670f850
    source_path: reference/memory-config.md
    workflow: 15
---

Ta strona zawiera wszystkie ustawienia konfiguracji wyszukiwania Memory w OpenClaw. Aby zapoznać się z omówieniem koncepcyjnym, zobacz:

- [Informacje o Memory](/pl/concepts/memory) -- jak działa Memory
- [Wbudowany silnik](/pl/concepts/memory-builtin) -- domyślny backend SQLite
- [Silnik QMD](/pl/concepts/memory-qmd) -- lokalny sidecar
- [Wyszukiwanie Memory](/pl/concepts/memory-search) -- pipeline wyszukiwania i strojenie
- [Active Memory](/pl/concepts/active-memory) -- włączanie podagenta pamięci dla sesji interaktywnych

Wszystkie ustawienia wyszukiwania Memory znajdują się w `agents.defaults.memorySearch` w
`openclaw.json`, chyba że zaznaczono inaczej.

Jeśli szukasz przełącznika funkcji **Active Memory** i konfiguracji podagenta,
znajdują się one w `plugins.entries.active-memory`, a nie w `memorySearch`.

Active Memory używa modelu dwóch bramek:

1. Plugin musi być włączony i kierowany do bieżącego identyfikatora agenta
2. Żądanie musi dotyczyć kwalifikującej się interaktywnej trwałej sesji czatu

Zobacz [Active Memory](/pl/concepts/active-memory), aby poznać model aktywacji,
konfigurację należącą do Pluginu, trwałość transkryptu i bezpieczny wzorzec wdrażania.

---

## Wybór dostawcy

| Klucz     | Typ       | Domyślnie       | Opis                                                                                                         |
| --------- | --------- | --------------- | ------------------------------------------------------------------------------------------------------------ |
| `provider` | `string` | wykrywany automatycznie | Identyfikator adaptera osadzania: `bedrock`, `gemini`, `github-copilot`, `local`, `mistral`, `ollama`, `openai`, `voyage` |
| `model`   | `string`  | wartość domyślna dostawcy | Nazwa modelu osadzania                                                                                       |
| `fallback` | `string` | `"none"`        | Identyfikator adaptera fallback, gdy główny zawiedzie                                                       |
| `enabled` | `boolean` | `true`          | Włącza lub wyłącza wyszukiwanie Memory                                                                       |

### Kolejność automatycznego wykrywania

Gdy `provider` nie jest ustawiony, OpenClaw wybiera pierwszy dostępny:

1. `local` -- jeśli skonfigurowano `memorySearch.local.modelPath` i plik istnieje.
2. `github-copilot` -- jeśli można rozstrzygnąć token GitHub Copilot (zmienna środowiskowa lub profil uwierzytelniania).
3. `openai` -- jeśli można rozstrzygnąć klucz OpenAI.
4. `gemini` -- jeśli można rozstrzygnąć klucz Gemini.
5. `voyage` -- jeśli można rozstrzygnąć klucz Voyage.
6. `mistral` -- jeśli można rozstrzygnąć klucz Mistral.
7. `bedrock` -- jeśli łańcuch poświadczeń AWS SDK zostanie rozstrzygnięty (rola instancji, klucze dostępu, profil, SSO, tożsamość internetowa lub konfiguracja współdzielona).

`ollama` jest obsługiwane, ale nie jest wykrywane automatycznie (ustaw je jawnie).

### Rozstrzyganie klucza API

Zdalne osadzanie wymaga klucza API. Zamiast tego Bedrock używa domyślnego
łańcucha poświadczeń AWS SDK (role instancji, SSO, klucze dostępu).

| Dostawca       | Zmienna środowiskowa                              | Klucz konfiguracji                 |
| -------------- | ------------------------------------------------- | ---------------------------------- |
| Bedrock        | łańcuch poświadczeń AWS                           | klucz API nie jest wymagany        |
| Gemini         | `GEMINI_API_KEY`                                  | `models.providers.google.apiKey`   |
| GitHub Copilot | `COPILOT_GITHUB_TOKEN`, `GH_TOKEN`, `GITHUB_TOKEN` | Profil uwierzytelniania przez logowanie urządzenia |
| Mistral        | `MISTRAL_API_KEY`                                 | `models.providers.mistral.apiKey`  |
| Ollama         | `OLLAMA_API_KEY` (placeholder)                    | --                                 |
| OpenAI         | `OPENAI_API_KEY`                                  | `models.providers.openai.apiKey`   |
| Voyage         | `VOYAGE_API_KEY`                                  | `models.providers.voyage.apiKey`   |

Codex OAuth obejmuje tylko czat/completions i nie spełnia wymagań żądań
osadzania.

---

## Konfiguracja zdalnego punktu końcowego

Dla niestandardowych punktów końcowych zgodnych z OpenAI lub zastępowania wartości domyślnych dostawcy:

| Klucz            | Typ      | Opis                                                |
| ---------------- | -------- | --------------------------------------------------- |
| `remote.baseUrl` | `string` | Niestandardowy bazowy adres URL API                 |
| `remote.apiKey`  | `string` | Nadpisanie klucza API                               |
| `remote.headers` | `object` | Dodatkowe nagłówki HTTP (scalane z domyślnymi dostawcy) |

```json5
{
  agents: {
    defaults: {
      memorySearch: {
        provider: "openai",
        model: "text-embedding-3-small",
        remote: {
          baseUrl: "https://api.example.com/v1/",
          apiKey: "YOUR_KEY",
        },
      },
    },
  },
}
```

---

## Konfiguracja specyficzna dla Gemini

| Klucz                  | Typ      | Domyślnie              | Opis                                       |
| ---------------------- | -------- | ---------------------- | ------------------------------------------ |
| `model`                | `string` | `gemini-embedding-001` | Obsługuje także `gemini-embedding-2-preview` |
| `outputDimensionality` | `number` | `3072`                 | Dla Embedding 2: 768, 1536 lub 3072        |

<Warning>
Zmiana modelu lub `outputDimensionality` uruchamia automatyczne pełne ponowne indeksowanie.
</Warning>

---

## Konfiguracja osadzania Bedrock

Bedrock używa domyślnego łańcucha poświadczeń AWS SDK -- klucze API nie są wymagane.
Jeśli OpenClaw działa na EC2 z rolą instancji z włączonym Bedrock, po prostu ustaw
dostawcę i model:

```json5
{
  agents: {
    defaults: {
      memorySearch: {
        provider: "bedrock",
        model: "amazon.titan-embed-text-v2:0",
      },
    },
  },
}
```

| Klucz                  | Typ      | Domyślnie                     | Opis                                |
| ---------------------- | -------- | ----------------------------- | ----------------------------------- |
| `model`                | `string` | `amazon.titan-embed-text-v2:0` | Dowolny identyfikator modelu osadzania Bedrock |
| `outputDimensionality` | `number` | wartość domyślna modelu       | Dla Titan V2: 256, 512 lub 1024     |

### Obsługiwane modele

Obsługiwane są następujące modele (z wykrywaniem rodziny i wartościami domyślnymi wymiarów):

| Identyfikator modelu                        | Dostawca   | Domyślne wymiary | Konfigurowalne wymiary |
| ------------------------------------------- | ---------- | ---------------- | ---------------------- |
| `amazon.titan-embed-text-v2:0`              | Amazon     | 1024             | 256, 512, 1024         |
| `amazon.titan-embed-text-v1`                | Amazon     | 1536             | --                     |
| `amazon.titan-embed-g1-text-02`             | Amazon     | 1536             | --                     |
| `amazon.titan-embed-image-v1`               | Amazon     | 1024             | --                     |
| `amazon.nova-2-multimodal-embeddings-v1:0`  | Amazon     | 1024             | 256, 384, 1024, 3072   |
| `cohere.embed-english-v3`                   | Cohere     | 1024             | --                     |
| `cohere.embed-multilingual-v3`              | Cohere     | 1024             | --                     |
| `cohere.embed-v4:0`                         | Cohere     | 1536             | 256-1536               |
| `twelvelabs.marengo-embed-3-0-v1:0`         | TwelveLabs | 512              | --                     |
| `twelvelabs.marengo-embed-2-7-v1:0`         | TwelveLabs | 1024             | --                     |

Warianty z sufiksem przepustowości (np. `amazon.titan-embed-text-v1:2:8k`) dziedziczą
konfigurację modelu bazowego.

### Uwierzytelnianie

Uwierzytelnianie Bedrock używa standardowej kolejności rozstrzygania poświadczeń AWS SDK:

1. Zmienne środowiskowe (`AWS_ACCESS_KEY_ID` + `AWS_SECRET_ACCESS_KEY`)
2. Cache tokenów SSO
3. Poświadczenia tokena tożsamości internetowej
4. Współdzielone pliki poświadczeń i konfiguracji
5. Poświadczenia metadanych ECS lub EC2

Region jest rozstrzygany z `AWS_REGION`, `AWS_DEFAULT_REGION`, `baseUrl` dostawcy
`amazon-bedrock` albo domyślnie przyjmuje wartość `us-east-1`.

### Uprawnienia IAM

Rola lub użytkownik IAM potrzebuje:

```json
{
  "Effect": "Allow",
  "Action": "bedrock:InvokeModel",
  "Resource": "*"
}
```

Dla zasady najmniejszych uprawnień ogranicz `InvokeModel` do konkretnego modelu:

```
arn:aws:bedrock:*::foundation-model/amazon.titan-embed-text-v2:0
```

---

## Konfiguracja osadzania lokalnego

| Klucz                 | Typ                  | Domyślnie              | Opis                                                                                                                                                                                                                                                                                                            |
| --------------------- | -------------------- | ---------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `local.modelPath`     | `string`             | pobierany automatycznie | Ścieżka do pliku modelu GGUF                                                                                                                                                                                                                                                                                    |
| `local.modelCacheDir` | `string`             | domyślna wartość node-llama-cpp | Katalog cache dla pobranych modeli                                                                                                                                                                                                                                                                      |
| `local.contextSize`   | `number \| "auto"`   | `4096`                 | Rozmiar okna kontekstu dla kontekstu osadzania. 4096 obejmuje typowe fragmenty (128–512 tokenów), jednocześnie ograniczając VRAM niezwiązany z wagami. Zmniejsz do 1024–2048 na hostach z ograniczonymi zasobami. `"auto"` używa wytrenowanego maksimum modelu — niezalecane dla modeli 8B+ (Qwen3-Embedding-8B: 40 960 tokenów → ~32 GB VRAM wobec ~8,8 GB przy 4096). |

Model domyślny: `embeddinggemma-300m-qat-Q8_0.gguf` (~0,6 GB, pobierany automatycznie).
Wymaga natywnego builda: `pnpm approve-builds`, a następnie `pnpm rebuild node-llama-cpp`.

Użyj samodzielnego CLI, aby zweryfikować tę samą ścieżkę dostawcy, której używa Gateway:

```bash
openclaw memory status --deep --agent main
openclaw memory index --force --agent main
```

Jeśli `provider` ma wartość `auto`, `local` jest wybierany tylko wtedy, gdy `local.modelPath` wskazuje
na istniejący plik lokalny. Odwołania do modeli `hf:` i HTTP(S) nadal mogą być używane
jawnie z `provider: "local"`, ale nie powodują, że `auto` wybierze `local`
zanim model będzie dostępny na dysku.

---

## Konfiguracja wyszukiwania hybrydowego

Wszystko w `memorySearch.query.hybrid`:

| Klucz                 | Typ       | Domyślnie | Opis                                 |
| --------------------- | --------- | --------- | ------------------------------------ |
| `enabled`             | `boolean` | `true`    | Włącza wyszukiwanie hybrydowe BM25 + wektorowe |
| `vectorWeight`        | `number`  | `0.7`     | Waga dla wyników wektorowych (0-1)   |
| `textWeight`          | `number`  | `0.3`     | Waga dla wyników BM25 (0-1)          |
| `candidateMultiplier` | `number`  | `4`       | Mnożnik rozmiaru puli kandydatów     |

### MMR (różnorodność)

| Klucz         | Typ       | Domyślnie | Opis                                   |
| ------------- | --------- | --------- | -------------------------------------- |
| `mmr.enabled` | `boolean` | `false`   | Włącza ponowne rankingowanie MMR       |
| `mmr.lambda`  | `number`  | `0.7`     | 0 = maks. różnorodność, 1 = maks. trafność |

### Zanik czasowy (świeżość)

| Klucz                       | Typ       | Domyślnie | Opis                           |
| --------------------------- | --------- | --------- | ------------------------------ |
| `temporalDecay.enabled`     | `boolean` | `false`   | Włącza wzmocnienie świeżości   |
| `temporalDecay.halfLifeDays` | `number` | `30`      | Wynik zmniejsza się o połowę co N dni |

Pliki evergreen (`MEMORY.md`, pliki bez daty w `memory/`) nigdy nie podlegają zanikowi.

### Pełny przykład

```json5
{
  agents: {
    defaults: {
      memorySearch: {
        query: {
          hybrid: {
            vectorWeight: 0.7,
            textWeight: 0.3,
            mmr: { enabled: true, lambda: 0.7 },
            temporalDecay: { enabled: true, halfLifeDays: 30 },
          },
        },
      },
    },
  },
}
```

---

## Dodatkowe ścieżki Memory

| Klucz       | Typ        | Opis                                      |
| ----------- | ---------- | ----------------------------------------- |
| `extraPaths` | `string[]` | Dodatkowe katalogi lub pliki do indeksowania |

```json5
{
  agents: {
    defaults: {
      memorySearch: {
        extraPaths: ["../team-docs", "/srv/shared-notes"],
      },
    },
  },
}
```

Ścieżki mogą być bezwzględne lub względne względem obszaru roboczego. Katalogi są skanowane
rekurencyjnie w poszukiwaniu plików `.md`. Obsługa symlinków zależy od aktywnego backendu:
wbudowany silnik ignoruje symlinki, a QMD stosuje zachowanie skanera QMD, na którym się opiera.

W przypadku wyszukiwania transkryptów między agentami o zakresie agenta użyj
`agents.list[].memorySearch.qmd.extraCollections` zamiast `memory.qmd.paths`.
Te dodatkowe kolekcje mają ten sam kształt `{ path, name, pattern? }`, ale
są scalane per agent i mogą zachowywać jawne współdzielone nazwy, gdy ścieżka
wskazuje poza bieżący obszar roboczy.
Jeśli ta sama rozstrzygnięta ścieżka pojawia się zarówno w `memory.qmd.paths`, jak i
`memorySearch.qmd.extraCollections`, QMD zachowuje pierwszy wpis i pomija
duplikat.

---

## Multimodalna Memory (Gemini)

Indeksuj obrazy i audio razem z Markdown przy użyciu Gemini Embedding 2:

| Klucz                      | Typ        | Domyślnie  | Opis                                  |
| -------------------------- | ---------- | ---------- | ------------------------------------- |
| `multimodal.enabled`       | `boolean`  | `false`    | Włącza indeksowanie multimodalne      |
| `multimodal.modalities`    | `string[]` | --         | `["image"]`, `["audio"]` lub `["all"]` |
| `multimodal.maxFileBytes`  | `number`   | `10000000` | Maksymalny rozmiar pliku do indeksowania |

Dotyczy tylko plików w `extraPaths`. Domyślne katalogi główne Memory pozostają tylko dla Markdown.
Wymaga `gemini-embedding-2-preview`. `fallback` musi mieć wartość `"none"`.

Obsługiwane formaty: `.jpg`, `.jpeg`, `.png`, `.webp`, `.gif`, `.heic`, `.heif`
(obrazy); `.mp3`, `.wav`, `.ogg`, `.opus`, `.m4a`, `.aac`, `.flac` (audio).

---

## Cache osadzania

| Klucz              | Typ       | Domyślnie | Opis                               |
| ------------------ | --------- | --------- | ---------------------------------- |
| `cache.enabled`    | `boolean` | `false`   | Buforuje osadzania fragmentów w SQLite |
| `cache.maxEntries` | `number`  | `50000`   | Maksymalna liczba buforowanych osadzań |

Zapobiega ponownemu osadzaniu niezmienionego tekstu podczas ponownego indeksowania lub aktualizacji transkryptu.

---

## Indeksowanie wsadowe

| Klucz                        | Typ       | Domyślnie | Opis                         |
| ---------------------------- | --------- | --------- | ---------------------------- |
| `remote.batch.enabled`       | `boolean` | `false`   | Włącza API osadzania wsadowego |
| `remote.batch.concurrency`   | `number`  | `2`       | Równoległe zadania wsadowe   |
| `remote.batch.wait`          | `boolean` | `true`    | Czeka na zakończenie wsadu   |
| `remote.batch.pollIntervalMs` | `number` | --        | Interwał odpytywania         |
| `remote.batch.timeoutMinutes` | `number` | --        | Limit czasu wsadu            |

Dostępne dla `openai`, `gemini` i `voyage`. Wsady OpenAI są zwykle
najszybsze i najtańsze dla dużych backfilli.

---

## Wyszukiwanie Memory sesji (eksperymentalne)

Indeksuj transkrypty sesji i udostępniaj je przez `memory_search`:

| Klucz                        | Typ        | Domyślnie    | Opis                                   |
| ---------------------------- | ---------- | ------------ | -------------------------------------- |
| `experimental.sessionMemory` | `boolean`  | `false`      | Włącza indeksowanie sesji              |
| `sources`                    | `string[]` | `["memory"]` | Dodaj `"sessions"`, aby uwzględnić transkrypty |
| `sync.sessions.deltaBytes`   | `number`   | `100000`     | Próg bajtowy dla ponownego indeksowania |
| `sync.sessions.deltaMessages` | `number`  | `50`         | Próg liczby wiadomości dla ponownego indeksowania |

Indeksowanie sesji jest funkcją opt-in i działa asynchronicznie. Wyniki mogą być nieco
nieaktualne. Logi sesji znajdują się na dysku, więc granicą zaufania
jest dostęp do systemu plików.

---

## Akceleracja wektorowa SQLite (`sqlite-vec`)

| Klucz                       | Typ       | Domyślnie | Opis                                |
| --------------------------- | --------- | --------- | ----------------------------------- |
| `store.vector.enabled`      | `boolean` | `true`    | Używa `sqlite-vec` do zapytań wektorowych |
| `store.vector.extensionPath` | `string` | dołączone | Nadpisuje ścieżkę `sqlite-vec`      |

Gdy `sqlite-vec` jest niedostępne, OpenClaw automatycznie wraca do
podobieństwa cosinusowego w procesie.

---

## Przechowywanie indeksu

| Klucz                 | Typ      | Domyślnie                            | Opis                                          |
| --------------------- | -------- | ------------------------------------ | --------------------------------------------- |
| `store.path`          | `string` | `~/.openclaw/memory/{agentId}.sqlite` | Lokalizacja indeksu (obsługuje token `{agentId}`) |
| `store.fts.tokenizer` | `string` | `unicode61`                          | Tokenizer FTS5 (`unicode61` lub `trigram`)    |

---

## Konfiguracja backendu QMD

Ustaw `memory.backend = "qmd"`, aby włączyć. Wszystkie ustawienia QMD znajdują się w
`memory.qmd`:

| Klucz                    | Typ       | Domyślnie | Opis                                         |
| ------------------------ | --------- | --------- | -------------------------------------------- |
| `command`                | `string`  | `qmd`     | Ścieżka do pliku wykonywalnego QMD           |
| `searchMode`             | `string`  | `search`  | Polecenie wyszukiwania: `search`, `vsearch`, `query` |
| `includeDefaultMemory`   | `boolean` | `true`    | Automatycznie indeksuj `MEMORY.md` + `memory/**/*.md` |
| `paths[]`                | `array`   | --        | Dodatkowe ścieżki: `{ name, path, pattern? }` |
| `sessions.enabled`       | `boolean` | `false`   | Indeksuj transkrypty sesji                   |
| `sessions.retentionDays` | `number`  | --        | Okres przechowywania transkryptów            |
| `sessions.exportDir`     | `string`  | --        | Katalog eksportu                             |

OpenClaw preferuje bieżące kształty kolekcji QMD i zapytań MCP, ale zachowuje
zgodność ze starszymi wydaniami QMD, przełączając się w razie potrzeby na starsze flagi kolekcji `--mask`
oraz starsze nazwy narzędzi MCP.

Nadpisania modeli QMD pozostają po stronie QMD, a nie w konfiguracji OpenClaw. Jeśli musisz
globalnie nadpisać modele QMD, ustaw zmienne środowiskowe takie jak
`QMD_EMBED_MODEL`, `QMD_RERANK_MODEL` i `QMD_GENERATE_MODEL` w środowisku uruchomieniowym gateway.

### Harmonogram aktualizacji

| Klucz                     | Typ       | Domyślnie | Opis                                   |
| ------------------------- | --------- | --------- | -------------------------------------- |
| `update.interval`         | `string`  | `5m`      | Interwał odświeżania                   |
| `update.debounceMs`       | `number`  | `15000`   | Opóźnienie zmian plików                |
| `update.onBoot`           | `boolean` | `true`    | Odśwież przy uruchomieniu              |
| `update.waitForBootSync`  | `boolean` | `false`   | Wstrzymaj uruchamianie do ukończenia odświeżania |
| `update.embedInterval`    | `string`  | --        | Osobny harmonogram osadzania           |
| `update.commandTimeoutMs` | `number`  | --        | Limit czasu dla poleceń QMD            |
| `update.updateTimeoutMs`  | `number`  | --        | Limit czasu dla operacji aktualizacji QMD |
| `update.embedTimeoutMs`   | `number`  | --        | Limit czasu dla operacji osadzania QMD |

### Limity

| Klucz                     | Typ      | Domyślnie | Opis                           |
| ------------------------- | -------- | --------- | ------------------------------ |
| `limits.maxResults`       | `number` | `6`       | Maksymalna liczba wyników wyszukiwania |
| `limits.maxSnippetChars`  | `number` | --        | Ogranicz długość fragmentu     |
| `limits.maxInjectedChars` | `number` | --        | Ogranicz łączną liczbę wstrzykniętych znaków |
| `limits.timeoutMs`        | `number` | `4000`    | Limit czasu wyszukiwania       |

### Zakres

Określa, które sesje mogą otrzymywać wyniki wyszukiwania QMD. Ten sam schemat co
[`session.sendPolicy`](/pl/gateway/config-agents#session):

```json5
{
  memory: {
    qmd: {
      scope: {
        default: "deny",
        rules: [{ action: "allow", match: { chatType: "direct" } }],
      },
    },
  },
}
```

Dostarczona domyślna konfiguracja dopuszcza sesje bezpośrednie i kanałowe, nadal odrzucając
grupy.

Domyślnie tylko DM. `match.keyPrefix` dopasowuje znormalizowany klucz sesji;
`match.rawKeyPrefix` dopasowuje surowy klucz, w tym `agent:<id>:`.

### Cytowania

`memory.citations` dotyczy wszystkich backendów:

| Wartość          | Działanie                                           |
| ---------------- | --------------------------------------------------- |
| `auto` (domyślnie) | Dołącz stopkę `Source: <path#line>` we fragmentach |
| `on`             | Zawsze dołączaj stopkę                              |
| `off`            | Pomiń stopkę (ścieżka nadal jest przekazywana wewnętrznie do agenta) |

### Pełny przykład QMD

```json5
{
  memory: {
    backend: "qmd",
    citations: "auto",
    qmd: {
      includeDefaultMemory: true,
      update: { interval: "5m", debounceMs: 15000 },
      limits: { maxResults: 6, timeoutMs: 4000 },
      scope: {
        default: "deny",
        rules: [{ action: "allow", match: { chatType: "direct" } }],
      },
      paths: [{ name: "docs", path: "~/notes", pattern: "**/*.md" }],
    },
  },
}
```

---

## Dreaming

Dreaming jest konfigurowane w `plugins.entries.memory-core.config.dreaming`,
a nie w `agents.defaults.memorySearch`.

Dreaming działa jako jeden zaplanowany przebieg i używa wewnętrznych faz light/deep/REM jako
szczegółu implementacyjnego.

Aby poznać zachowanie koncepcyjne i komendy slash, zobacz [Dreaming](/pl/concepts/dreaming).

### Ustawienia użytkownika

| Klucz       | Typ       | Domyślnie   | Opis                                                |
| ----------- | --------- | ----------- | --------------------------------------------------- |
| `enabled`   | `boolean` | `false`     | Włącz lub wyłącz Dreaming całkowicie                |
| `frequency` | `string`  | `0 3 * * *` | Opcjonalny harmonogram Cron dla pełnego przebiegu Dreaming |

### Przykład

```json5
{
  plugins: {
    entries: {
      "memory-core": {
        config: {
          dreaming: {
            enabled: true,
            frequency: "0 3 * * *",
          },
        },
      },
    },
  },
}
```

Uwagi:

- Dreaming zapisuje stan maszyny do `memory/.dreams/`.
- Dreaming zapisuje czytelne dla człowieka wyjście narracyjne do `DREAMS.md` (lub istniejącego `dreams.md`).
- Zasady faz light/deep/REM i progi są zachowaniem wewnętrznym, a nie konfiguracją dostępną dla użytkownika.

## Powiązane

- [Przegląd pamięci](/pl/concepts/memory)
- [Wyszukiwanie w pamięci](/pl/concepts/memory-search)
- [Dokumentacja konfiguracji](/pl/gateway/configuration-reference)
