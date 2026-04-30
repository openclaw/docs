---
read_when:
    - Chcesz skonfigurować dostawców wyszukiwania w pamięci lub modele osadzania
    - Chcesz skonfigurować backend QMD
    - Chcesz dostroić wyszukiwanie hybrydowe, MMR lub wygaszanie czasowe
    - Chcesz włączyć multimodalne indeksowanie pamięci
sidebarTitle: Memory config
summary: Wszystkie opcje konfiguracyjne dotyczące wyszukiwania w pamięci, dostawców osadzeń, QMD, wyszukiwania hybrydowego i indeksowania multimodalnego
title: Referencja konfiguracji pamięci
x-i18n:
    generated_at: "2026-04-30T16:29:57Z"
    model: gpt-5.5
    provider: openai
    source_hash: 58b75751a19afb883fd7646cf5f71859f95bac468b2bfd8cc79db12ae892f70f
    source_path: reference/memory-config.md
    workflow: 16
---

Ta strona zawiera listę wszystkich ustawień konfiguracyjnych wyszukiwania pamięci w OpenClaw. Omówienia koncepcyjne znajdziesz tutaj:

<CardGroup cols={2}>
  <Card title="Omówienie pamięci" href="/pl/concepts/memory">
    Jak działa pamięć.
  </Card>
  <Card title="Wbudowany silnik" href="/pl/concepts/memory-builtin">
    Domyślny backend SQLite.
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
Jeśli szukasz przełącznika funkcji **Active Memory** i konfiguracji podagenta, znajduje się ona w `plugins.entries.active-memory`, a nie w `memorySearch`.

Active Memory używa modelu dwóch bramek:

1. plugin musi być włączony i kierować na identyfikator bieżącego agenta
2. żądanie musi być kwalifikującą się interaktywną, trwałą sesją czatu

Zobacz [Active Memory](/pl/concepts/active-memory), aby poznać model aktywacji, konfigurację należącą do pluginu, trwałość transkrypcji i bezpieczny wzorzec wdrażania.
</Note>

---

## Wybór dostawcy

| Klucz      | Typ       | Domyślnie              | Opis                                                                                                                                                                                                                               |
| ---------- | --------- | ---------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `provider` | `string`  | wykrywane automatycznie | Identyfikator adaptera embeddingów, taki jak `bedrock`, `deepinfra`, `gemini`, `github-copilot`, `local`, `mistral`, `ollama`, `openai` lub `voyage`; może też być skonfigurowanym `models.providers.<id>`, którego `api` wskazuje jeden z tych adapterów |
| `model`    | `string`  | domyślny dostawcy       | Nazwa modelu embeddingów                                                                                                                                                                                                           |
| `fallback` | `string`  | `"none"`               | Identyfikator adaptera awaryjnego, gdy główny zawiedzie                                                                                                                                                                             |
| `enabled`  | `boolean` | `true`                 | Włącz lub wyłącz wyszukiwanie pamięci                                                                                                                                                                                              |

### Kolejność automatycznego wykrywania

Gdy `provider` nie jest ustawiony, OpenClaw wybiera pierwszy dostępny:

<Steps>
  <Step title="local">
    Wybrany, jeśli `memorySearch.local.modelPath` jest skonfigurowane i plik istnieje.
  </Step>
  <Step title="github-copilot">
    Wybrany, jeśli można rozwiązać token GitHub Copilot (zmienna środowiskowa lub profil uwierzytelniania).
  </Step>
  <Step title="openai">
    Wybrany, jeśli można rozwiązać klucz OpenAI.
  </Step>
  <Step title="gemini">
    Wybrany, jeśli można rozwiązać klucz Gemini.
  </Step>
  <Step title="voyage">
    Wybrany, jeśli można rozwiązać klucz Voyage.
  </Step>
  <Step title="mistral">
    Wybrany, jeśli można rozwiązać klucz Mistral.
  </Step>
  <Step title="deepinfra">
    Wybrany, jeśli można rozwiązać klucz DeepInfra.
  </Step>
  <Step title="bedrock">
    Wybrany, jeśli łańcuch poświadczeń AWS SDK zostanie rozwiązany (rola instancji, klucze dostępu, profil, SSO, tożsamość sieciowa lub współdzielona konfiguracja).
  </Step>
</Steps>

`ollama` jest obsługiwany, ale nie jest wykrywany automatycznie (ustaw go jawnie).

### Niestandardowe identyfikatory dostawców

`memorySearch.provider` może wskazywać niestandardowy wpis `models.providers.<id>`. OpenClaw rozwiązuje właściciela `api` tego dostawcy dla adaptera embeddingów, zachowując niestandardowy identyfikator dostawcy na potrzeby endpointu, uwierzytelniania i obsługi prefiksu modelu. Dzięki temu konfiguracje z wieloma GPU lub hostami mogą dedykować embeddingi pamięci konkretnemu lokalnemu endpointowi:

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

### Rozwiązywanie klucza API

Zdalne embeddingi wymagają klucza API. Bedrock używa zamiast tego domyślnego łańcucha poświadczeń AWS SDK (role instancji, SSO, klucze dostępu).

| Dostawca       | Zmienna środowiskowa                            | Klucz konfiguracji                 |
| -------------- | -------------------------------------------------- | ----------------------------------- |
| Bedrock        | Łańcuch poświadczeń AWS                            | Klucz API nie jest potrzebny        |
| DeepInfra      | `DEEPINFRA_API_KEY`                                | `models.providers.deepinfra.apiKey` |
| Gemini         | `GEMINI_API_KEY`                                   | `models.providers.google.apiKey`    |
| GitHub Copilot | `COPILOT_GITHUB_TOKEN`, `GH_TOKEN`, `GITHUB_TOKEN` | Profil uwierzytelniania przez logowanie urządzenia |
| Mistral        | `MISTRAL_API_KEY`                                  | `models.providers.mistral.apiKey`   |
| Ollama         | `OLLAMA_API_KEY` (placeholder)                     | --                                  |
| OpenAI         | `OPENAI_API_KEY`                                   | `models.providers.openai.apiKey`    |
| Voyage         | `VOYAGE_API_KEY`                                   | `models.providers.voyage.apiKey`    |

<Note>
OAuth Codex obejmuje tylko czat/uzupełnienia i nie spełnia wymagań żądań embeddingów.
</Note>

---

## Konfiguracja zdalnego endpointu

Dla niestandardowych endpointów zgodnych z OpenAI lub nadpisywania wartości domyślnych dostawcy:

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
    Endpointy embeddingów zgodne z OpenAI mogą włączać specyficzne dla dostawcy pola żądań `input_type`. Jest to przydatne w przypadku asymetrycznych modeli embeddingów, które wymagają różnych etykiet dla embeddingów zapytań i dokumentów.

    | Klucz               | Typ      | Domyślnie    | Opis                                                   |
    | ------------------- | -------- | ------------ | ------------------------------------------------------ |
    | `inputType`         | `string` | nieustawione | Wspólne `input_type` dla embeddingów zapytań i dokumentów |
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

    Zmiana tych wartości wpływa na tożsamość pamięci podręcznej embeddingów dla indeksowania wsadowego dostawcy i powinna być poprzedzona ponownym indeksowaniem pamięci, gdy model upstream traktuje etykiety inaczej.

  </Accordion>
  <Accordion title="Bedrock">
    Bedrock używa domyślnego łańcucha poświadczeń AWS SDK — klucze API nie są potrzebne. Jeśli OpenClaw działa na EC2 z rolą instancji z włączonym Bedrock, wystarczy ustawić dostawcę i model:

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

    | Klucz                  | Typ      | Domyślnie                     | Opis                          |
    | ---------------------- | -------- | ----------------------------- | ----------------------------- |
    | `model`                | `string` | `amazon.titan-embed-text-v2:0` | Dowolny identyfikator modelu embeddingów Bedrock |
    | `outputDimensionality` | `number` | domyślne modelu               | Dla Titan V2: 256, 512 lub 1024 |

    **Obsługiwane modele** (z wykrywaniem rodziny i domyślnymi wymiarami):

    | Identyfikator modelu                       | Dostawca   | Domyślne wymiary | Konfigurowalne wymiary |
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

    **Uwierzytelnianie:** uwierzytelnianie Bedrock używa standardowej kolejności rozwiązywania poświadczeń AWS SDK:

    1. Zmienne środowiskowe (`AWS_ACCESS_KEY_ID` + `AWS_SECRET_ACCESS_KEY`)
    2. Pamięć podręczna tokenów SSO
    3. Poświadczenia tokenu tożsamości sieciowej
    4. Współdzielone pliki poświadczeń i konfiguracji
    5. Poświadczenia metadanych ECS lub EC2

    Region jest rozwiązywany z `AWS_REGION`, `AWS_DEFAULT_REGION`, `baseUrl` dostawcy `amazon-bedrock` albo domyślnie przyjmuje `us-east-1`.

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
  <Accordion title="Lokalny (GGUF + node-llama-cpp)">
    | Klucz                 | Typ                | Domyślnie              | Opis                                                                                                                                                                                                                                                                                                                 |
    | --------------------- | ------------------ | ---------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
    | `local.modelPath`     | `string`           | automatycznie pobierany | Ścieżka do pliku modelu GGUF                                                                                                                                                                                                                                                                                        |
    | `local.modelCacheDir` | `string`           | domyślne node-llama-cpp | Katalog pamięci podręcznej dla pobranych modeli                                                                                                                                                                                                                                                                      |
    | `local.contextSize`   | `number \| "auto"` | `4096`                 | Rozmiar okna kontekstu dla kontekstu osadzania. 4096 obejmuje typowe fragmenty (128–512 tokenów), jednocześnie ograniczając VRAM niezajęty przez wagi. Na hostach o ograniczonych zasobach zmniejsz do 1024–2048. `"auto"` używa maksymalnej wartości wytrenowanej modelu — niezalecane dla modeli 8B+ (Qwen3-Embedding-8B: 40 960 tokenów → ~32 GB VRAM vs ~8.8 GB przy 4096). |

    Model domyślny: `embeddinggemma-300m-qat-Q8_0.gguf` (~0.6 GB, pobierany automatycznie). Instalacje pakietowe naprawiają natywne środowisko uruchomieniowe `node-llama-cpp` przez zarządzane zależności środowiska uruchomieniowego Plugin, gdy skonfigurowano `provider: "local"`. Checkouty źródłowe nadal wymagają zatwierdzenia natywnej kompilacji: `pnpm approve-builds`, a następnie `pnpm rebuild node-llama-cpp`.

    Użyj samodzielnego CLI, aby zweryfikować tę samą ścieżkę dostawcy, której używa Gateway:

    ```bash
    openclaw memory status --deep --agent main
    openclaw memory index --force --agent main
    ```

    Jeśli `provider` to `auto`, `local` jest wybierany tylko wtedy, gdy `local.modelPath` wskazuje istniejący plik lokalny. Odwołań do modeli `hf:` i HTTP(S) nadal można używać jawnie z `provider: "local"`, ale nie sprawiają one, że `auto` wybierze tryb lokalny, zanim model będzie dostępny na dysku.

  </Accordion>
</AccordionGroup>

### Limit czasu osadzania inline

<ParamField path="sync.embeddingBatchTimeoutSeconds" type="number">
  Zastąp limit czasu dla partii osadzania inline podczas indeksowania pamięci.

Wartość nieustawiona używa wartości domyślnej dostawcy: 600 sekund dla dostawców lokalnych/samohostowanych, takich jak `local`, `ollama` i `lmstudio`, oraz 120 sekund dla dostawców hostowanych. Zwiększ tę wartość, gdy lokalne partie osadzania ograniczone przez CPU działają poprawnie, ale wolno.
</ParamField>

---

## Konfiguracja wyszukiwania hybrydowego

Wszystko w `memorySearch.query.hybrid`:

| Klucz                 | Typ       | Domyślnie | Opis                                           |
| --------------------- | --------- | --------- | ---------------------------------------------- |
| `enabled`             | `boolean` | `true`    | Włącz hybrydowe wyszukiwanie BM25 + wektorowe |
| `vectorWeight`        | `number`  | `0.7`     | Waga wyników wektorowych (0-1)                |
| `textWeight`          | `number`  | `0.3`     | Waga wyników BM25 (0-1)                       |
| `candidateMultiplier` | `number`  | `4`       | Mnożnik rozmiaru puli kandydatów              |

<Tabs>
  <Tab title="MMR (różnorodność)">
    | Klucz         | Typ       | Domyślnie | Opis                                      |
    | ------------- | --------- | --------- | ----------------------------------------- |
    | `mmr.enabled` | `boolean` | `false`   | Włącz ponowne szeregowanie MMR            |
    | `mmr.lambda`  | `number`  | `0.7`     | 0 = maksymalna różnorodność, 1 = maksymalna trafność |
  </Tab>
  <Tab title="Zanik czasowy (świeżość)">
    | Klucz                        | Typ       | Domyślnie | Opis                                  |
    | ---------------------------- | --------- | --------- | ------------------------------------- |
    | `temporalDecay.enabled`      | `boolean` | `false`   | Włącz premię za świeżość              |
    | `temporalDecay.halfLifeDays` | `number`  | `30`      | Wynik zmniejsza się o połowę co N dni |

    Pliki wiecznie aktualne (`MEMORY.md`, niedatowane pliki w `memory/`) nigdy nie podlegają zanikowi.

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

| Klucz        | Typ        | Opis                                    |
| ------------ | ---------- | --------------------------------------- |
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

Ścieżki mogą być bezwzględne albo względne względem workspace. Katalogi są skanowane rekurencyjnie pod kątem plików `.md`. Obsługa dowiązań symbolicznych zależy od aktywnego backendu: wbudowany silnik ignoruje dowiązania symboliczne, podczas gdy QMD stosuje bazowe zachowanie skanera QMD.

Do wyszukiwania transkrypcji między agentami w zakresie agenta użyj `agents.list[].memorySearch.qmd.extraCollections` zamiast `memory.qmd.paths`. Te dodatkowe kolekcje mają ten sam kształt `{ path, name, pattern? }`, ale są scalane per agent i mogą zachować jawne nazwy współdzielone, gdy ścieżka wskazuje poza bieżący workspace. Jeśli ta sama rozpoznana ścieżka pojawia się zarówno w `memory.qmd.paths`, jak i `memorySearch.qmd.extraCollections`, QMD zachowuje pierwszy wpis i pomija duplikat.

---

## Pamięć multimodalna (Gemini)

Indeksuj obrazy i dźwięk razem z Markdown za pomocą Gemini Embedding 2:

| Klucz                     | Typ        | Domyślnie  | Opis                                  |
| ------------------------- | ---------- | ---------- | ------------------------------------- |
| `multimodal.enabled`      | `boolean`  | `false`    | Włącz indeksowanie multimodalne       |
| `multimodal.modalities`   | `string[]` | --         | `["image"]`, `["audio"]` lub `["all"]` |
| `multimodal.maxFileBytes` | `number`   | `10000000` | Maksymalny rozmiar pliku do indeksowania |

<Note>
Dotyczy tylko plików w `extraPaths`. Domyślne katalogi główne pamięci pozostają tylko w Markdown. Wymaga `gemini-embedding-2-preview`. `fallback` musi mieć wartość `"none"`.
</Note>

Obsługiwane formaty: `.jpg`, `.jpeg`, `.png`, `.webp`, `.gif`, `.heic`, `.heif` (obrazy); `.mp3`, `.wav`, `.ogg`, `.opus`, `.m4a`, `.aac`, `.flac` (audio).

---

## Pamięć podręczna osadzeń

| Klucz              | Typ       | Domyślnie | Opis                                      |
| ------------------ | --------- | --------- | ----------------------------------------- |
| `cache.enabled`    | `boolean` | `false`   | Buforuj osadzenia fragmentów w SQLite     |
| `cache.maxEntries` | `number`  | `50000`   | Maksymalna liczba zbuforowanych osadzeń   |

Zapobiega ponownemu osadzaniu niezmienionego tekstu podczas ponownego indeksowania lub aktualizacji transkrypcji.

---

## Indeksowanie wsadowe

| Klucz                         | Typ       | Domyślnie | Opis                         |
| ----------------------------- | --------- | --------- | ---------------------------- |
| `remote.nonBatchConcurrency`  | `number`  | `4`       | Równoległe osadzenia inline  |
| `remote.batch.enabled`        | `boolean` | `false`   | Włącz API osadzania wsadowego |
| `remote.batch.concurrency`    | `number`  | `2`       | Równoległe zadania wsadowe   |
| `remote.batch.wait`           | `boolean` | `true`    | Czekaj na ukończenie partii  |
| `remote.batch.pollIntervalMs` | `number`  | --        | Interwał odpytywania         |
| `remote.batch.timeoutMinutes` | `number`  | --        | Limit czasu partii           |

Dostępne dla `openai`, `gemini` i `voyage`. Partia OpenAI jest zwykle najszybsza i najtańsza przy dużych uzupełnieniach.

`remote.nonBatchConcurrency` kontroluje wywołania osadzania inline używane przez dostawców lokalnych/samohostowanych oraz dostawców hostowanych, gdy wsadowe API dostawcy nie są aktywne. Ollama domyślnie używa `1` dla indeksowania niewsadowego, aby uniknąć przeciążenia mniejszych hostów lokalnych; ustaw wyższą wartość na większych maszynach.

To ustawienie jest oddzielne od `sync.embeddingBatchTimeoutSeconds`, które kontroluje limit czasu dla wywołań osadzania inline.

---

## Wyszukiwanie w pamięci sesji (eksperymentalne)

Indeksuj transkrypcje sesji i udostępniaj je przez `memory_search`:

| Klucz                         | Typ        | Domyślnie    | Opis                                         |
| ----------------------------- | ---------- | ------------ | -------------------------------------------- |
| `experimental.sessionMemory`  | `boolean`  | `false`      | Włącz indeksowanie sesji                     |
| `sources`                     | `string[]` | `["memory"]` | Dodaj `"sessions"`, aby uwzględnić transkrypcje |
| `sync.sessions.deltaBytes`    | `number`   | `100000`     | Próg bajtów do ponownego indeksowania        |
| `sync.sessions.deltaMessages` | `number`   | `50`         | Próg wiadomości do ponownego indeksowania    |

<Warning>
Indeksowanie sesji jest opcjonalne i działa asynchronicznie. Wyniki mogą być nieznacznie nieaktualne. Logi sesji znajdują się na dysku, więc traktuj dostęp do systemu plików jako granicę zaufania.
</Warning>

---

## Przyspieszenie wektorowe SQLite (sqlite-vec)

| Klucz                        | Typ       | Domyślnie | Opis                              |
| ---------------------------- | --------- | --------- | --------------------------------- |
| `store.vector.enabled`       | `boolean` | `true`    | Użyj sqlite-vec do zapytań wektorowych |
| `store.vector.extensionPath` | `string`  | w pakiecie | Zastąp ścieżkę sqlite-vec         |

Gdy sqlite-vec jest niedostępny, OpenClaw automatycznie przełącza się na podobieństwo cosinusowe w procesie.

---

## Przechowywanie indeksu

| Klucz                 | Typ      | Domyślnie                            | Opis                                           |
| --------------------- | -------- | ------------------------------------ | ---------------------------------------------- |
| `store.path`          | `string` | `~/.openclaw/memory/{agentId}.sqlite` | Lokalizacja indeksu (obsługuje token `{agentId}`) |
| `store.fts.tokenizer` | `string` | `unicode61`                          | Tokenizer FTS5 (`unicode61` lub `trigram`)     |

---

## Konfiguracja backendu QMD

Ustaw `memory.backend = "qmd"`, aby włączyć. Wszystkie ustawienia QMD znajdują się w `memory.qmd`:

| Klucz                    | Typ       | Domyślne | Opis                                                                                  |
| ------------------------ | --------- | -------- | ------------------------------------------------------------------------------------- |
| `command`                | `string`  | `qmd`    | Ścieżka wykonywalna QMD; ustaw ścieżkę bezwzględną, gdy `PATH` usługi różni się od powłoki |
| `searchMode`             | `string`  | `search` | Polecenie wyszukiwania: `search`, `vsearch`, `query`                                  |
| `includeDefaultMemory`   | `boolean` | `true`   | Automatycznie indeksuj `MEMORY.md` + `memory/**/*.md`                                 |
| `paths[]`                | `array`   | --       | Dodatkowe ścieżki: `{ name, path, pattern? }`                                         |
| `sessions.enabled`       | `boolean` | `false`  | Indeksuj transkrypcje sesji                                                           |
| `sessions.retentionDays` | `number`  | --       | Przechowywanie transkrypcji                                                           |
| `sessions.exportDir`     | `string`  | --       | Katalog eksportu                                                                      |

`searchMode: "search"` działa wyłącznie leksykalnie/BM25. OpenClaw nie uruchamia sond gotowości wektorów semantycznych ani utrzymania embeddingów QMD dla tego trybu, także podczas `memory status --deep`; `vsearch` i `query` nadal wymagają gotowości wektorów QMD oraz embeddingów.

OpenClaw preferuje bieżące kształty kolekcji QMD i zapytań MCP, ale utrzymuje działanie starszych wydań QMD, próbując w razie potrzeby zgodnych flag wzorców kolekcji i starszych nazw narzędzi MCP. Gdy QMD deklaruje obsługę wielu filtrów kolekcji, kolekcje z tego samego źródła są przeszukiwane jednym procesem QMD; starsze kompilacje QMD zachowują ścieżkę zgodności osobną dla każdej kolekcji. To samo źródło oznacza, że trwałe kolekcje pamięci są grupowane razem, podczas gdy kolekcje transkrypcji sesji pozostają osobną grupą, dzięki czemu dywersyfikacja źródeł nadal ma oba wejścia.

<Note>
Nadpisania modeli QMD pozostają po stronie QMD, a nie w konfiguracji OpenClaw. Jeśli musisz globalnie nadpisać modele QMD, ustaw zmienne środowiskowe, takie jak `QMD_EMBED_MODEL`, `QMD_RERANK_MODEL` i `QMD_GENERATE_MODEL` w środowisku uruchomieniowym gateway.
</Note>

<AccordionGroup>
  <Accordion title="Harmonogram aktualizacji">
    | Klucz                     | Typ       | Domyślne | Opis                                  |
    | ------------------------- | --------- | ------- | ------------------------------------- |
    | `update.interval`         | `string`  | `5m`    | Interwał odświeżania                  |
    | `update.debounceMs`       | `number`  | `15000` | Debounce zmian plików                 |
    | `update.onBoot`           | `boolean` | `true`  | Odświeżaj po otwarciu długotrwałego menedżera QMD; steruje też opcjonalnym odświeżaniem przy starcie |
    | `update.startup`          | `string`  | `off`   | Opcjonalne odświeżanie przy starcie gateway: `off`, `idle` lub `immediate` |
    | `update.startupDelayMs`   | `number`  | `120000` | Opóźnienie przed uruchomieniem odświeżania `startup: "idle"` |
    | `update.waitForBootSync`  | `boolean` | `false` | Blokuj otwarcie menedżera do zakończenia jego początkowego odświeżania |
    | `update.embedInterval`    | `string`  | --      | Osobny rytm embeddingów               |
    | `update.commandTimeoutMs` | `number`  | --      | Limit czasu dla poleceń QMD           |
    | `update.updateTimeoutMs`  | `number`  | --      | Limit czasu dla operacji aktualizacji QMD |
    | `update.embedTimeoutMs`   | `number`  | --      | Limit czasu dla operacji embeddingów QMD |
  </Accordion>
  <Accordion title="Limity">
    | Klucz                     | Typ      | Domyślne | Opis                       |
    | ------------------------- | -------- | ------- | -------------------------- |
    | `limits.maxResults`       | `number` | `6`     | Maksymalna liczba wyników wyszukiwania |
    | `limits.maxSnippetChars`  | `number` | --      | Ogranicz długość fragmentu |
    | `limits.maxInjectedChars` | `number` | --      | Ogranicz łączną liczbę wstrzykiwanych znaków |
    | `limits.timeoutMs`        | `number` | `4000`  | Limit czasu wyszukiwania   |
  </Accordion>
  <Accordion title="Zakres">
    Określa, które sesje mogą otrzymywać wyniki wyszukiwania QMD. Ten sam schemat co [`session.sendPolicy`](/pl/gateway/config-agents#session):

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

    Domyślne ustawienie dostarczane z produktem zezwala na sesje bezpośrednie i kanałowe, nadal odmawiając grupom.

    Domyślnie tylko DM. `match.keyPrefix` dopasowuje znormalizowany klucz sesji; `match.rawKeyPrefix` dopasowuje surowy klucz wraz z `agent:<id>:`.

  </Accordion>
  <Accordion title="Cytowania">
    `memory.citations` dotyczy wszystkich backendów:

    | Wartość          | Zachowanie                                          |
    | ---------------- | --------------------------------------------------- |
    | `auto` (domyślnie) | Dołącz stopkę `Source: <path#line>` we fragmentach |
    | `on`             | Zawsze dołączaj stopkę                              |
    | `off`            | Pomijaj stopkę (ścieżka nadal jest przekazywana wewnętrznie do agenta) |

  </Accordion>
</AccordionGroup>

Odświeżenia rozruchowe QMD używają jednorazowej ścieżki podprocesu podczas startu gateway. Długotrwały menedżer QMD nadal zarządza zwykłym obserwatorem plików i timerami interwałów, gdy wyszukiwanie w pamięci jest otwierane do użycia interaktywnego.

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

Dreaming konfiguruje się w `plugins.entries.memory-core.config.dreaming`, a nie w `agents.defaults.memorySearch`.

Dreaming działa jako jeden zaplanowany przebieg i używa wewnętrznych faz light/deep/REM jako szczegółu implementacji.

Opis koncepcyjnego zachowania i poleceń ukośnikowych znajdziesz w [Dreaming](/pl/concepts/dreaming).

### Ustawienia użytkownika

| Klucz       | Typ       | Domyślne       | Opis                                             |
| ----------- | --------- | ------------- | ------------------------------------------------- |
| `enabled`   | `boolean` | `false`       | Włącz lub całkowicie wyłącz dreaming              |
| `frequency` | `string`  | `0 3 * * *`   | Opcjonalny rytm cron dla pełnego przebiegu dreaming |
| `model`     | `string`  | model domyślny | Opcjonalne nadpisanie modelu subagenta Dream Diary |

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
- Dreaming zapisuje stan maszynowy do `memory/.dreams/`.
- Dreaming zapisuje czytelne dla człowieka dane narracyjne do `DREAMS.md` (lub istniejącego `dreams.md`).
- `dreaming.model` używa istniejącej bramki zaufania subagenta Plugin; ustaw `plugins.entries.memory-core.subagent.allowModelOverride: true` przed jej włączeniem.
- Dream Diary ponawia próbę raz z domyślnym modelem sesji, gdy skonfigurowany model jest niedostępny. Błędy zaufania lub listy dozwolonych są logowane i nie są po cichu ponawiane.
- Zasady i progi faz light/deep/REM są zachowaniem wewnętrznym, a nie konfiguracją użytkownika.

</Note>

## Powiązane

- [Dokumentacja konfiguracji](/pl/gateway/configuration-reference)
- [Omówienie pamięci](/pl/concepts/memory)
- [Wyszukiwanie w pamięci](/pl/concepts/memory-search)
