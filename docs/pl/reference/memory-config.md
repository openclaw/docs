---
read_when:
    - Chcesz skonfigurować dostawców wyszukiwania w pamięci lub modele osadzeń
    - Chcesz skonfigurować backend QMD
    - Chcesz dostroić wyszukiwanie hybrydowe, MMR lub zanik czasowy
    - Chcesz włączyć multimodalne indeksowanie pamięci
sidebarTitle: Memory config
summary: Wszystkie ustawienia konfiguracyjne dla wyszukiwania w pamięci, dostawców osadzeń, QMD, wyszukiwania hybrydowego i indeksowania multimodalnego
title: Dokumentacja referencyjna konfiguracji pamięci
x-i18n:
    generated_at: "2026-05-02T10:02:28Z"
    model: gpt-5.5
    provider: openai
    source_hash: 11c4723b536338a777ec45673ca3c1a8c26834d6875dd4eb96617a570a55c5f5
    source_path: reference/memory-config.md
    workflow: 16
---

Ta strona zawiera listę wszystkich ustawień konfiguracji wyszukiwania pamięci OpenClaw. Omówienia koncepcyjne znajdziesz tutaj:

<CardGroup cols={2}>
  <Card title="Omówienie pamięci" href="/pl/concepts/memory">
    Jak działa pamięć.
  </Card>
  <Card title="Wbudowany silnik" href="/pl/concepts/memory-builtin">
    Domyślne zaplecze SQLite.
  </Card>
  <Card title="Silnik QMD" href="/pl/concepts/memory-qmd">
    Lokalny sidecar.
  </Card>
  <Card title="Wyszukiwanie pamięci" href="/pl/concepts/memory-search">
    Potok wyszukiwania i dostrajanie.
  </Card>
  <Card title="Active Memory" href="/pl/concepts/active-memory">
    Podagent pamięci dla sesji interaktywnych.
  </Card>
</CardGroup>

Wszystkie ustawienia wyszukiwania pamięci znajdują się w `agents.defaults.memorySearch` w `openclaw.json`, chyba że zaznaczono inaczej.

<Note>
Jeśli szukasz przełącznika funkcji **active memory** i konfiguracji podagenta, znajdują się one w `plugins.entries.active-memory`, a nie w `memorySearch`.

Active Memory używa modelu z dwiema bramkami:

1. Plugin musi być włączony i wskazywać bieżący identyfikator agenta
2. żądanie musi być kwalifikującą się interaktywną trwałą sesją czatu

Zobacz [Active Memory](/pl/concepts/active-memory), aby poznać model aktywacji, konfigurację należącą do Plugin, trwałość transkrypcji i bezpieczny wzorzec wdrażania.
</Note>

---

## Wybór dostawcy

| Klucz      | Typ       | Domyślnie             | Opis                                                                                                                                                                                                                            |
| ---------- | --------- | --------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `provider` | `string`  | wykrywane automatycznie | Identyfikator adaptera osadzeń, taki jak `bedrock`, `deepinfra`, `gemini`, `github-copilot`, `local`, `mistral`, `ollama`, `openai` lub `voyage`; może też być skonfigurowanym `models.providers.<id>`, którego `api` wskazuje jeden z tych adapterów |
| `model`    | `string`  | domyślne dostawcy     | Nazwa modelu osadzeń                                                                                                                                                                                                            |
| `fallback` | `string`  | `"none"`              | Identyfikator adaptera awaryjnego, gdy podstawowy zawiedzie                                                                                                                                                                     |
| `enabled`  | `boolean` | `true`                | Włącza lub wyłącza wyszukiwanie pamięci                                                                                                                                                                                        |

### Kolejność automatycznego wykrywania

Gdy `provider` nie jest ustawiony, OpenClaw wybiera pierwszą dostępną opcję:

<Steps>
  <Step title="local">
    Wybrany, jeśli `memorySearch.local.modelPath` jest skonfigurowany, a plik istnieje.
  </Step>
  <Step title="github-copilot">
    Wybrany, jeśli można ustalić token GitHub Copilot (zmienna środowiskowa lub profil uwierzytelniania).
  </Step>
  <Step title="openai">
    Wybrany, jeśli można ustalić klucz OpenAI.
  </Step>
  <Step title="gemini">
    Wybrany, jeśli można ustalić klucz Gemini.
  </Step>
  <Step title="voyage">
    Wybrany, jeśli można ustalić klucz Voyage.
  </Step>
  <Step title="mistral">
    Wybrany, jeśli można ustalić klucz Mistral.
  </Step>
  <Step title="deepinfra">
    Wybrany, jeśli można ustalić klucz DeepInfra.
  </Step>
  <Step title="bedrock">
    Wybrany, jeśli łańcuch poświadczeń AWS SDK zostanie ustalony (rola instancji, klucze dostępu, profil, SSO, tożsamość webowa lub współdzielona konfiguracja).
  </Step>
</Steps>

`ollama` jest obsługiwany, ale nie jest wykrywany automatycznie (ustaw go jawnie).

### Niestandardowe identyfikatory dostawców

`memorySearch.provider` może wskazywać niestandardowy wpis `models.providers.<id>`. OpenClaw ustala właściciela `api` tego dostawcy dla adaptera osadzeń, zachowując jednocześnie niestandardowy identyfikator dostawcy do obsługi punktu końcowego, uwierzytelniania i prefiksu modelu. Dzięki temu konfiguracje z wieloma GPU lub wieloma hostami mogą przeznaczyć osadzenia pamięci dla określonego lokalnego punktu końcowego:

```json5
{
  models: {
    providers: {
      "ollama-5080": {
        api: "ollama",
        baseUrl: "http://gpu-box.local:11435",
        apiKey: "ollama-local",
        models: [{ id: "qwen3-embedding:0.6b" }],
      },
    },
  },
  agents: {
    defaults: {
      memorySearch: {
        provider: "ollama-5080",
        model: "qwen3-embedding:0.6b",
      },
    },
  },
}
```

### Ustalanie klucza API

Zdalne osadzenia wymagają klucza API. Bedrock używa zamiast tego domyślnego łańcucha poświadczeń AWS SDK (role instancji, SSO, klucze dostępu).

| Dostawca       | Zmienna środowiskowa                              | Klucz konfiguracji                 |
| -------------- | -------------------------------------------------- | ----------------------------------- |
| Bedrock        | Łańcuch poświadczeń AWS                            | Klucz API nie jest wymagany         |
| DeepInfra      | `DEEPINFRA_API_KEY`                                | `models.providers.deepinfra.apiKey` |
| Gemini         | `GEMINI_API_KEY`                                   | `models.providers.google.apiKey`    |
| GitHub Copilot | `COPILOT_GITHUB_TOKEN`, `GH_TOKEN`, `GITHUB_TOKEN` | Profil uwierzytelniania przez logowanie urządzenia |
| Mistral        | `MISTRAL_API_KEY`                                  | `models.providers.mistral.apiKey`   |
| Ollama         | `OLLAMA_API_KEY` (placeholder)                     | --                                  |
| OpenAI         | `OPENAI_API_KEY`                                   | `models.providers.openai.apiKey`    |
| Voyage         | `VOYAGE_API_KEY`                                   | `models.providers.voyage.apiKey`    |

<Note>
Codex OAuth obejmuje tylko czat/uzupełnienia i nie spełnia żądań osadzeń.
</Note>

---

## Konfiguracja zdalnego punktu końcowego

Dla niestandardowych punktów końcowych zgodnych z OpenAI lub nadpisywania wartości domyślnych dostawcy:

<ParamField path="remote.baseUrl" type="string">
  Niestandardowy bazowy adres URL API.
</ParamField>
<ParamField path="remote.apiKey" type="string">
  Nadpisz klucz API.
</ParamField>
<ParamField path="remote.headers" type="object">
  Dodatkowe nagłówki HTTP (scalane z wartościami domyślnymi dostawcy).
</ParamField>

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

## Konfiguracja specyficzna dla dostawcy

<AccordionGroup>
  <Accordion title="Gemini">
    | Klucz                  | Typ      | Domyślnie              | Opis                                       |
    | ---------------------- | -------- | ---------------------- | ------------------------------------------ |
    | `model`                | `string` | `gemini-embedding-001` | Obsługuje też `gemini-embedding-2-preview` |
    | `outputDimensionality` | `number` | `3072`                 | Dla Embedding 2: 768, 1536 lub 3072        |

    <Warning>
    Zmiana modelu lub `outputDimensionality` wyzwala automatyczne pełne ponowne indeksowanie.
    </Warning>

  </Accordion>
  <Accordion title="Typy wejścia zgodne z OpenAI">
    Punkty końcowe osadzeń zgodne z OpenAI mogą włączyć specyficzne dla dostawcy pola żądania `input_type`. Jest to przydatne dla asymetrycznych modeli osadzeń, które wymagają różnych etykiet dla osadzeń zapytań i dokumentów.

    | Klucz               | Typ      | Domyślnie   | Opis                                                   |
    | ------------------- | -------- | ----------- | ------------------------------------------------------ |
    | `inputType`         | `string` | nieustawione | Wspólne `input_type` dla osadzeń zapytań i dokumentów  |
    | `queryInputType`    | `string` | nieustawione | `input_type` w czasie zapytania; nadpisuje `inputType` |
    | `documentInputType` | `string` | nieustawione | `input_type` indeksu/dokumentu; nadpisuje `inputType`  |

    ```json5
    {
      agents: {
        defaults: {
          memorySearch: {
            provider: "openai",
            remote: {
              baseUrl: "https://embeddings.example/v1",
              apiKey: "env:EMBEDDINGS_API_KEY",
            },
            model: "asymmetric-embedder",
            queryInputType: "query",
            documentInputType: "passage",
          },
        },
      },
    }
    ```

    Zmiana tych wartości wpływa na tożsamość pamięci podręcznej osadzeń dla wsadowego indeksowania dostawcy i po niej należy ponownie zindeksować pamięć, gdy model upstream traktuje etykiety inaczej.

  </Accordion>
  <Accordion title="Bedrock">
    Bedrock używa domyślnego łańcucha poświadczeń AWS SDK — klucze API nie są wymagane. Jeśli OpenClaw działa na EC2 z rolą instancji z włączonym Bedrock, wystarczy ustawić dostawcę i model:

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

    | Klucz                  | Typ      | Domyślnie                     | Opis                              |
    | ---------------------- | -------- | ----------------------------- | --------------------------------- |
    | `model`                | `string` | `amazon.titan-embed-text-v2:0` | Dowolny identyfikator modelu osadzeń Bedrock |
    | `outputDimensionality` | `number` | domyślne modelu               | Dla Titan V2: 256, 512 lub 1024   |

    **Obsługiwane modele** (z wykrywaniem rodziny i domyślnymi wymiarami):

    | Identyfikator modelu                      | Dostawca   | Domyślne wymiary | Konfigurowalne wymiary |
    | ------------------------------------------ | ---------- | ---------------- | ---------------------- |
    | `amazon.titan-embed-text-v2:0`             | Amazon     | 1024             | 256, 512, 1024         |
    | `amazon.titan-embed-text-v1`               | Amazon     | 1536             | --                     |
    | `amazon.titan-embed-g1-text-02`            | Amazon     | 1536             | --                     |
    | `amazon.titan-embed-image-v1`              | Amazon     | 1024             | --                     |
    | `amazon.nova-2-multimodal-embeddings-v1:0` | Amazon     | 1024             | 256, 384, 1024, 3072   |
    | `cohere.embed-english-v3`                  | Cohere     | 1024             | --                     |
    | `cohere.embed-multilingual-v3`             | Cohere     | 1024             | --                     |
    | `cohere.embed-v4:0`                        | Cohere     | 1536             | 256-1536               |
    | `twelvelabs.marengo-embed-3-0-v1:0`        | TwelveLabs | 512              | --                     |
    | `twelvelabs.marengo-embed-2-7-v1:0`        | TwelveLabs | 1024             | --                     |

    Warianty z sufiksem przepustowości (np. `amazon.titan-embed-text-v1:2:8k`) dziedziczą konfigurację modelu bazowego.

    **Uwierzytelnianie:** uwierzytelnianie Bedrock używa standardowej kolejności ustalania poświadczeń AWS SDK:

    1. Zmienne środowiskowe (`AWS_ACCESS_KEY_ID` + `AWS_SECRET_ACCESS_KEY`)
    2. Pamięć podręczna tokenów SSO
    3. Poświadczenia tokenu tożsamości webowej
    4. Współdzielone pliki poświadczeń i konfiguracji
    5. Poświadczenia metadanych ECS lub EC2

    Region jest ustalany z `AWS_REGION`, `AWS_DEFAULT_REGION`, `baseUrl` dostawcy `amazon-bedrock` albo domyślnie z `us-east-1`.

    **Uprawnienia IAM:** rola lub użytkownik IAM potrzebuje:

    ```json
    {
      "Effect": "Allow",
      "Action": "bedrock:InvokeModel",
      "Resource": "*"
    }
    ```

    Aby zastosować zasadę najmniejszych uprawnień, ogranicz zakres `InvokeModel` do konkretnego modelu:

    ```
    arn:aws:bedrock:*::foundation-model/amazon.titan-embed-text-v2:0
    ```

  </Accordion>
  <Accordion title="Lokalnie (GGUF + node-llama-cpp)">
    | Klucz                 | Typ                | Domyślnie              | Opis                                                                                                                                                                                                                                                                                                                           |
    | --------------------- | ------------------ | ---------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
    | `local.modelPath`     | `string`           | pobierane automatycznie | Ścieżka do pliku modelu GGUF                                                                                                                                                                                                                                                                                                   |
    | `local.modelCacheDir` | `string`           | domyślna wartość node-llama-cpp | Katalog pamięci podręcznej dla pobranych modeli                                                                                                                                                                                                                                                                         |
    | `local.contextSize`   | `number \| "auto"` | `4096`                 | Rozmiar okna kontekstu dla kontekstu embeddingu. 4096 obejmuje typowe fragmenty (128–512 tokenów), ograniczając VRAM niezajętą przez wagi. Na hostach z ograniczonymi zasobami zmniejsz do 1024–2048. `"auto"` używa wytrenowanego maksimum modelu — niezalecane dla modeli 8B+ (Qwen3-Embedding-8B: 40 960 tokenów → ~32 GB VRAM vs ~8,8 GB przy 4096). |

    Model domyślny: `embeddinggemma-300m-qat-Q8_0.gguf` (~0,6 GB, pobierany automatycznie). Checkouts źródeł nadal wymagają zatwierdzenia natywnej kompilacji: `pnpm approve-builds`, a następnie `pnpm rebuild node-llama-cpp`.

    Użyj samodzielnego CLI, aby zweryfikować tę samą ścieżkę dostawcy, której używa Gateway:

    ```bash
    openclaw memory status --deep --agent main
    openclaw memory index --force --agent main
    ```

    Jeśli `provider` ma wartość `auto`, `local` jest wybierany tylko wtedy, gdy `local.modelPath` wskazuje istniejący plik lokalny. Odwołań do modeli `hf:` i HTTP(S) nadal można używać jawnie z `provider: "local"`, ale nie sprawiają one, że `auto` wybierze lokalnego dostawcę, zanim model będzie dostępny na dysku.

  </Accordion>
</AccordionGroup>

### Limit czasu embeddingu inline

<ParamField path="sync.embeddingBatchTimeoutSeconds" type="number">
  Nadpisz limit czasu dla partii embeddingu inline podczas indeksowania pamięci.

Brak ustawienia używa domyślnej wartości dostawcy: 600 sekund dla lokalnych/samodzielnie hostowanych dostawców, takich jak `local`, `ollama` i `lmstudio`, oraz 120 sekund dla dostawców hostowanych. Zwiększ tę wartość, gdy lokalne partie embeddingu obciążające CPU działają prawidłowo, ale wolno.
</ParamField>

---

## Konfiguracja wyszukiwania hybrydowego

Wszystko w `memorySearch.query.hybrid`:

| Klucz                 | Typ       | Domyślnie | Opis                                      |
| --------------------- | --------- | --------- | ----------------------------------------- |
| `enabled`             | `boolean` | `true`    | Włącz hybrydowe wyszukiwanie BM25 + wektorowe |
| `vectorWeight`        | `number`  | `0.7`     | Waga wyników wektorowych (0-1)            |
| `textWeight`          | `number`  | `0.3`     | Waga wyników BM25 (0-1)                   |
| `candidateMultiplier` | `number`  | `4`       | Mnożnik rozmiaru puli kandydatów          |

<Tabs>
  <Tab title="MMR (różnorodność)">
    | Klucz         | Typ       | Domyślnie | Opis                                   |
    | ------------- | --------- | --------- | -------------------------------------- |
    | `mmr.enabled` | `boolean` | `false`   | Włącz ponowne rankingowanie MMR        |
    | `mmr.lambda`  | `number`  | `0.7`     | 0 = maks. różnorodność, 1 = maks. trafność |
  </Tab>
  <Tab title="Zanik czasowy (aktualność)">
    | Klucz                        | Typ       | Domyślnie | Opis                              |
    | ---------------------------- | --------- | --------- | --------------------------------- |
    | `temporalDecay.enabled`      | `boolean` | `false`   | Włącz wzmocnienie aktualności     |
    | `temporalDecay.halfLifeDays` | `number`  | `30`      | Wynik zmniejsza się o połowę co N dni |

    Pliki nieprzemijające (`MEMORY.md`, niedatowane pliki w `memory/`) nigdy nie podlegają zanikowi.

  </Tab>
</Tabs>

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

## Dodatkowe ścieżki pamięci

| Klucz        | Typ        | Opis                                      |
| ------------ | ---------- | ----------------------------------------- |
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

Ścieżki mogą być bezwzględne lub względne względem workspace. Katalogi są skanowane rekurencyjnie w poszukiwaniu plików `.md`. Obsługa dowiązań symbolicznych zależy od aktywnego backendu: wbudowany silnik ignoruje dowiązania symboliczne, natomiast QMD stosuje zachowanie bazowego skanera QMD.

Do wyszukiwania transkryptów między agentami w zakresie agenta użyj `agents.list[].memorySearch.qmd.extraCollections` zamiast `memory.qmd.paths`. Te dodatkowe kolekcje mają ten sam kształt `{ path, name, pattern? }`, ale są scalane osobno dla każdego agenta i mogą zachować jawne nazwy współdzielone, gdy ścieżka wskazuje poza bieżący workspace. Jeśli ta sama rozpoznana ścieżka pojawi się zarówno w `memory.qmd.paths`, jak i w `memorySearch.qmd.extraCollections`, QMD zachowuje pierwszy wpis i pomija duplikat.

---

## Pamięć multimodalna (Gemini)

Indeksuj obrazy i audio razem z Markdownem przy użyciu Gemini Embedding 2:

| Klucz                     | Typ        | Domyślnie  | Opis                                 |
| ------------------------- | ---------- | ---------- | ------------------------------------ |
| `multimodal.enabled`      | `boolean`  | `false`    | Włącz indeksowanie multimodalne      |
| `multimodal.modalities`   | `string[]` | --         | `["image"]`, `["audio"]` lub `["all"]` |
| `multimodal.maxFileBytes` | `number`   | `10000000` | Maksymalny rozmiar pliku do indeksowania |

<Note>
Dotyczy tylko plików w `extraPaths`. Domyślne katalogi główne pamięci pozostają ograniczone wyłącznie do Markdown. Wymaga `gemini-embedding-2-preview`. `fallback` musi mieć wartość `"none"`.
</Note>

Obsługiwane formaty: `.jpg`, `.jpeg`, `.png`, `.webp`, `.gif`, `.heic`, `.heif` (obrazy); `.mp3`, `.wav`, `.ogg`, `.opus`, `.m4a`, `.aac`, `.flac` (audio).

---

## Pamięć podręczna embeddingów

| Klucz              | Typ       | Wartość domyślna | Opis                                             |
| ------------------ | --------- | ---------------- | ------------------------------------------------ |
| `cache.enabled`    | `boolean` | `false`          | Przechowuj embeddingi fragmentów w SQLite       |
| `cache.maxEntries` | `number`  | `50000`          | Maksymalna liczba embeddingów w pamięci podręcznej |

Zapobiega ponownemu tworzeniu embeddingów dla niezmienionego tekstu podczas ponownego indeksowania lub aktualizacji transkrypcji.

---

## Indeksowanie wsadowe

| Klucz                         | Typ       | Wartość domyślna | Opis                              |
| ----------------------------- | --------- | ---------------- | --------------------------------- |
| `remote.nonBatchConcurrency`  | `number`  | `4`              | Równoległe embeddingi inline      |
| `remote.batch.enabled`        | `boolean` | `false`          | Włącz API embeddingów wsadowych   |
| `remote.batch.concurrency`    | `number`  | `2`              | Równoległe zadania wsadowe        |
| `remote.batch.wait`           | `boolean` | `true`           | Czekaj na ukończenie wsadu        |
| `remote.batch.pollIntervalMs` | `number`  | --               | Interwał odpytywania              |
| `remote.batch.timeoutMinutes` | `number`  | --               | Limit czasu wsadu                 |

Dostępne dla `openai`, `gemini` i `voyage`. Przetwarzanie wsadowe OpenAI jest zwykle najszybsze i najtańsze przy dużych uzupełnieniach indeksu.

`remote.nonBatchConcurrency` steruje wywołaniami embeddingów inline używanymi przez dostawców lokalnych/samodzielnie hostowanych oraz dostawców hostowanych, gdy wsadowe API dostawcy nie są aktywne. Ollama domyślnie używa wartości `1` dla indeksowania niewsadowego, aby nie przeciążać mniejszych hostów lokalnych; ustaw wyższą wartość na większych maszynach.

Jest to oddzielne od `sync.embeddingBatchTimeoutSeconds`, które steruje limitem czasu dla wywołań embeddingów inline.

---

## Wyszukiwanie w pamięci sesji (eksperymentalne)

Indeksuj transkrypcje sesji i udostępniaj je przez `memory_search`:

| Klucz                         | Typ        | Wartość domyślna | Opis                                           |
| ----------------------------- | ---------- | ---------------- | ---------------------------------------------- |
| `experimental.sessionMemory`  | `boolean`  | `false`          | Włącz indeksowanie sesji                       |
| `sources`                     | `string[]` | `["memory"]`     | Dodaj `"sessions"`, aby uwzględnić transkrypcje |
| `sync.sessions.deltaBytes`    | `number`   | `100000`         | Próg bajtów dla ponownego indeksowania         |
| `sync.sessions.deltaMessages` | `number`   | `50`             | Próg wiadomości dla ponownego indeksowania     |

<Warning>
Indeksowanie sesji jest opcjonalne i działa asynchronicznie. Wyniki mogą być nieco nieaktualne. Dzienniki sesji znajdują się na dysku, więc traktuj dostęp do systemu plików jako granicę zaufania.
</Warning>

---

## Akceleracja wektorowa SQLite (sqlite-vec)

| Klucz                        | Typ       | Wartość domyślna | Opis                                  |
| ---------------------------- | --------- | ---------------- | ------------------------------------- |
| `store.vector.enabled`       | `boolean` | `true`           | Użyj sqlite-vec do zapytań wektorowych |
| `store.vector.extensionPath` | `string`  | w pakiecie       | Nadpisz ścieżkę sqlite-vec            |

Gdy sqlite-vec jest niedostępny, OpenClaw automatycznie przechodzi na podobieństwo cosinusowe obliczane w procesie.

---

## Przechowywanie indeksu

| Klucz                 | Typ      | Wartość domyślna                    | Opis                                               |
| --------------------- | -------- | ----------------------------------- | -------------------------------------------------- |
| `store.path`          | `string` | `~/.openclaw/memory/{agentId}.sqlite` | Lokalizacja indeksu (obsługuje token `{agentId}`) |
| `store.fts.tokenizer` | `string` | `unicode61`                         | Tokenizer FTS5 (`unicode61` lub `trigram`)         |

---

## Konfiguracja backendu QMD

Ustaw `memory.backend = "qmd"`, aby włączyć. Wszystkie ustawienia QMD znajdują się w `memory.qmd`:

| Klucz                    | Typ       | Wartość domyślna | Opis                                                                                         |
| ------------------------ | --------- | ---------------- | -------------------------------------------------------------------------------------------- |
| `command`                | `string`  | `qmd`            | Ścieżka do pliku wykonywalnego QMD; ustaw ścieżkę bezwzględną, gdy `PATH` usługi różni się od powłoki |
| `searchMode`             | `string`  | `search`         | Polecenie wyszukiwania: `search`, `vsearch`, `query`                                         |
| `includeDefaultMemory`   | `boolean` | `true`           | Automatycznie indeksuj `MEMORY.md` + `memory/**/*.md`                                        |
| `paths[]`                | `array`   | --               | Dodatkowe ścieżki: `{ name, path, pattern? }`                                                 |
| `sessions.enabled`       | `boolean` | `false`          | Indeksuj transkrypcje sesji                                                                  |
| `sessions.retentionDays` | `number`  | --               | Przechowywanie transkrypcji                                                                  |
| `sessions.exportDir`     | `string`  | --               | Katalog eksportu                                                                             |

`searchMode: "search"` działa wyłącznie leksykalnie/BM25. OpenClaw nie uruchamia sond gotowości wektorów semantycznych ani utrzymania osadzeń QMD dla tego trybu, także podczas `memory status --deep`; `vsearch` i `query` nadal wymagają gotowości wektorów QMD i osadzeń.

OpenClaw preferuje bieżącą kolekcję QMD i kształty zapytań MCP, ale utrzymuje działanie starszych wydań QMD, próbując zgodnych flag wzorców kolekcji i starszych nazw narzędzi MCP, gdy jest to potrzebne. Gdy QMD deklaruje obsługę wielu filtrów kolekcji, kolekcje z tego samego źródła są przeszukiwane przez jeden proces QMD; starsze kompilacje QMD zachowują ścieżkę zgodności na kolekcję. To samo źródło oznacza, że kolekcje trwałej pamięci są grupowane razem, a kolekcje transkrypcji sesji pozostają osobną grupą, dzięki czemu dywersyfikacja źródeł nadal ma oba wejścia.

<Note>
Nadpisania modeli QMD pozostają po stronie QMD, a nie w konfiguracji OpenClaw. Jeśli musisz globalnie nadpisać modele QMD, ustaw zmienne środowiskowe, takie jak `QMD_EMBED_MODEL`, `QMD_RERANK_MODEL` i `QMD_GENERATE_MODEL`, w środowisku uruchomieniowym gatewaya.
</Note>

<AccordionGroup>
  <Accordion title="Harmonogram aktualizacji">
    | Klucz                     | Typ       | Domyślnie | Opis                                  |
    | ------------------------- | --------- | --------- | ------------------------------------- |
    | `update.interval`         | `string`  | `5m`      | Interwał odświeżania                  |
    | `update.debounceMs`       | `number`  | `15000`   | Debounce zmian plików                 |
    | `update.onBoot`           | `boolean` | `true`    | Odśwież, gdy długotrwały menedżer QMD zostanie otwarty; ogranicza też opcjonalne odświeżanie przy starcie |
    | `update.startup`          | `string`  | `off`     | Opcjonalne odświeżanie przy starcie gatewaya: `off`, `idle` lub `immediate` |
    | `update.startupDelayMs`   | `number`  | `120000`  | Opóźnienie przed uruchomieniem odświeżania `startup: "idle"` |
    | `update.waitForBootSync`  | `boolean` | `false`   | Blokuj otwarcie menedżera do ukończenia jego początkowego odświeżania |
    | `update.embedInterval`    | `string`  | --        | Osobny rytm osadzeń                   |
    | `update.commandTimeoutMs` | `number`  | --        | Limit czasu dla poleceń QMD           |
    | `update.updateTimeoutMs`  | `number`  | --        | Limit czasu dla operacji aktualizacji QMD |
    | `update.embedTimeoutMs`   | `number`  | --        | Limit czasu dla operacji osadzeń QMD  |
  </Accordion>
  <Accordion title="Limity">
    | Klucz                     | Typ      | Domyślnie | Opis                         |
    | ------------------------- | -------- | --------- | ---------------------------- |
    | `limits.maxResults`       | `number` | `6`       | Maksymalna liczba wyników wyszukiwania |
    | `limits.maxSnippetChars`  | `number` | --        | Ogranicz długość fragmentu   |
    | `limits.maxInjectedChars` | `number` | --        | Ogranicz łączną liczbę wstrzykniętych znaków |
    | `limits.timeoutMs`        | `number` | `4000`    | Limit czasu wyszukiwania     |
  </Accordion>
  <Accordion title="Zakres">
    Kontroluje, które sesje mogą otrzymywać wyniki wyszukiwania QMD. Ten sam schemat co [`session.sendPolicy`](/pl/gateway/config-agents#session):

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

    Dostarczone ustawienie domyślne zezwala na sesje bezpośrednie i kanałowe, nadal odmawiając grupom.

    Domyślnie tylko DM. `match.keyPrefix` dopasowuje znormalizowany klucz sesji; `match.rawKeyPrefix` dopasowuje surowy klucz, w tym `agent:<id>:`.

  </Accordion>
  <Accordion title="Cytowania">
    `memory.citations` dotyczy wszystkich backendów:

    | Wartość          | Zachowanie                                         |
    | ---------------- | -------------------------------------------------- |
    | `auto` (domyślnie) | Dołącz stopkę `Source: <path#line>` we fragmentach |
    | `on`             | Zawsze dołączaj stopkę                             |
    | `off`            | Pomiń stopkę (ścieżka nadal jest przekazywana agentowi wewnętrznie) |

  </Accordion>
</AccordionGroup>

Odświeżenia rozruchowe QMD używają jednorazowej ścieżki podprocesu podczas startu gatewaya. Długotrwały menedżer QMD nadal odpowiada za zwykły obserwator plików i timery interwałów, gdy wyszukiwanie w pamięci jest otwarte do użycia interaktywnego.

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

Dreaming jest konfigurowany pod `plugins.entries.memory-core.config.dreaming`, a nie pod `agents.defaults.memorySearch`.

Dreaming działa jako jeden zaplanowany przebieg i używa wewnętrznych faz lekkiej/głębokiej/REM jako szczegółu implementacyjnego.

Opis zachowania koncepcyjnego i poleceń ukośnikowych znajdziesz w [Dreaming](/pl/concepts/dreaming).

### Ustawienia użytkownika

| Klucz       | Typ       | Domyślnie       | Opis                                             |
| ----------- | --------- | --------------- | ------------------------------------------------ |
| `enabled`   | `boolean` | `false`         | Włącz lub całkowicie wyłącz Dreaming             |
| `frequency` | `string`  | `0 3 * * *`     | Opcjonalny rytm cron dla pełnego przebiegu Dreaming |
| `model`     | `string`  | model domyślny  | Opcjonalne nadpisanie modelu subagenta Dream Diary |

### Przykład

```json5
{
  plugins: {
    entries: {
      "memory-core": {
        subagent: {
          allowModelOverride: true,
          allowedModels: ["anthropic/claude-sonnet-4-6"],
        },
        config: {
          dreaming: {
            enabled: true,
            frequency: "0 3 * * *",
            model: "anthropic/claude-sonnet-4-6",
          },
        },
      },
    },
  },
}
```

<Note>
- Dreaming zapisuje stan maszyny do `memory/.dreams/`.
- Dreaming zapisuje czytelne dla człowieka dane narracyjne do `DREAMS.md` (lub istniejącego `dreams.md`).
- `dreaming.model` używa istniejącej bramki zaufania subagenta pluginu; ustaw `plugins.entries.memory-core.subagent.allowModelOverride: true` przed jej włączeniem.
- Dream Diary ponawia próbę raz z domyślnym modelem sesji, gdy skonfigurowany model jest niedostępny. Niepowodzenia zaufania lub listy dozwolonych są rejestrowane i nie są po cichu ponawiane.
- Polityka faz lekkiej/głębokiej/REM i progi są zachowaniem wewnętrznym, a nie konfiguracją dostępną dla użytkownika.

</Note>

## Powiązane

- [Dokumentacja konfiguracji](/pl/gateway/configuration-reference)
- [Omówienie pamięci](/pl/concepts/memory)
- [Wyszukiwanie w pamięci](/pl/concepts/memory-search)
