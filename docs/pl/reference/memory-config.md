---
read_when:
    - Chcesz skonfigurować dostawców wyszukiwania w pamięci lub modele osadzania
    - Chcesz skonfigurować backend QMD
    - Chcesz dostroić wyszukiwanie hybrydowe, MMR lub wygaszanie czasowe
    - Chcesz włączyć multimodalne indeksowanie pamięci
sidebarTitle: Memory config
summary: Wszystkie opcje konfiguracji wyszukiwania w pamięci, dostawców osadzania, QMD, wyszukiwania hybrydowego i indeksowania multimodalnego
title: Dokumentacja konfiguracji pamięci
x-i18n:
    generated_at: "2026-07-12T15:37:42Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 558995797a5e217e57245e1d5ff90124fca67b6eb4767d97a3ea26a4ca013d06
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
    Lokalny proces pomocniczy.
  </Card>
  <Card title="Wyszukiwanie w pamięci" href="/pl/concepts/memory-search">
    Potok wyszukiwania i dostrajanie.
  </Card>
  <Card title="Active Memory" href="/pl/concepts/active-memory">
    Podagent pamięci dla sesji interaktywnych.
  </Card>
</CardGroup>

Wszystkie ustawienia wyszukiwania pamięci znajdują się w `agents.defaults.memorySearch` w pliku `openclaw.json` (lub w nadpisaniu `agents.list[].memorySearch` dla poszczególnych agentów), chyba że zaznaczono inaczej.

<Note>
Jeśli szukasz przełącznika funkcji **Active Memory** i konfiguracji podagenta, znajdują się one w `plugins.entries.active-memory`, a nie w `memorySearch`.

Active Memory korzysta z modelu dwóch bramek:

1. Plugin musi być włączony i wskazywać identyfikator bieżącego agenta
2. żądanie musi pochodzić z kwalifikującej się interaktywnej, trwałej sesji czatu

Zobacz [Active Memory](/pl/concepts/active-memory), aby poznać model aktywacji, konfigurację należącą do Pluginu, trwałe przechowywanie transkrypcji i bezpieczny schemat wdrażania.
</Note>

---

## Wybór dostawcy

| Klucz      | Typ       | Wartość domyślna  | Opis                                                                                                                                                                                                                                                                                        |
| ---------- | --------- | ----------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `enabled`  | `boolean` | `true`            | Włącza lub wyłącza wyszukiwanie pamięci                                                                                                                                                                                                                                                     |
| `provider` | `string`  | `"openai"`        | Identyfikator adaptera osadzania, taki jak `bedrock`, `deepinfra`, `gemini`, `github-copilot`, `local`, `mistral`, `ollama`, `openai`, `openai-compatible` lub `voyage`; może to być również skonfigurowany `models.providers.<id>`, którego `api` wskazuje adapter osadzania pamięci lub interfejs API modelu zgodny z OpenAI |
| `model`    | `string`  | domyślna dostawcy | Nazwa modelu osadzania                                                                                                                                                                                                                                                                      |
| `fallback` | `string`  | `"none"`          | Identyfikator adaptera zapasowego używanego w razie awarii adaptera głównego                                                                                                                                                                                                                |

Gdy `provider` nie jest ustawiony, OpenClaw korzysta z osadzeń OpenAI. Ustaw `provider`
jawnie, aby używać Bedrock, DeepInfra, Gemini, GitHub Copilot, Mistral, Ollama,
Voyage, lokalnego modelu GGUF lub punktu końcowego `/v1/embeddings` zgodnego z OpenAI.
Starsze konfiguracje, które nadal zawierają `provider: "auto"`, są interpretowane jako `openai`.

<Warning>
Zmiana dostawcy osadzania, modelu, ustawień dostawcy, źródeł, zakresu,
podziału na fragmenty lub tokenizatora może spowodować niezgodność istniejącego indeksu wektorowego SQLite.
OpenClaw wstrzymuje wyszukiwanie wektorowe i zgłasza ostrzeżenie dotyczące tożsamości indeksu, zamiast
automatycznie ponownie generować wszystkie osadzenia. Gdy wszystko będzie gotowe, przebuduj indeks za pomocą
`openclaw memory status --index --agent <id>` lub
`openclaw memory index --force --agent <id>`.
</Warning>

Gdy `provider` nie jest ustawiony, występuje starsze ustawienie `provider: "auto"` lub
`provider: "none"` celowo wybiera tryb wyłącznie FTS, przywoływanie pamięci nadal może
korzystać z leksykalnego rankingu FTS, gdy osadzenia są niedostępne.

Jawnie określeni dostawcy nielokalni stosują zasadę bezpiecznego odrzucania. Jeśli ustawisz `memorySearch.provider` na
konkretnego dostawcę zdalnego, takiego jak Bedrock, DeepInfra, Gemini, GitHub
Copilot, LM Studio, Mistral, Ollama, OpenAI, Voyage lub niestandardowego dostawcę
zgodnego z OpenAI, a dostawca ten będzie niedostępny w czasie działania, `memory_search`
zwróci wynik informujący o niedostępności, zamiast niejawnie użyć przywoływania wyłącznie przez FTS. Popraw
konfigurację dostawcy lub uwierzytelniania, przełącz się na dostępnego dostawcę albo ustaw
`provider: "none"`, jeśli chcesz świadomie korzystać z przywoływania wyłącznie przez FTS.

### Niestandardowe identyfikatory dostawców

`memorySearch.provider` może wskazywać niestandardowy wpis `models.providers.<id>` dla adapterów dostawców przeznaczonych dla pamięci, takich jak `ollama`, lub interfejsów API modeli zgodnych z OpenAI, takich jak `openai-responses` / `openai-completions`. OpenClaw ustala właściciela `api` tego dostawcy dla adaptera osadzania, zachowując niestandardowy identyfikator dostawcy na potrzeby obsługi punktu końcowego, uwierzytelniania i prefiksu modelu. Dzięki temu konfiguracje z wieloma procesorami GPU lub hostami mogą przypisać osadzanie pamięci do konkretnego lokalnego punktu końcowego:

```json5
{
  models: {
    providers: {
      "ollama-5080": {
        api: "ollama",
        baseUrl: "http://gpu-box.local:11435",
        apiKey: "ollama-local",
        models: [{ id: "qwen3-embedding:0.6b", name: "Qwen3 Embedding 0.6B" }],
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

Zdalne osadzanie wymaga klucza API. Bedrock korzysta zamiast niego z domyślnego łańcucha poświadczeń AWS SDK (ról instancji, SSO, kluczy dostępu lub klucza API Bedrock).

| Dostawca       | Zmienna środowiskowa                                 | Klucz konfiguracji                   |
| -------------- | ---------------------------------------------------- | ------------------------------------ |
| Bedrock        | Łańcuch poświadczeń AWS lub `AWS_BEARER_TOKEN_BEDROCK` | Klucz API nie jest wymagany          |
| DeepInfra      | `DEEPINFRA_API_KEY`                                  | `models.providers.deepinfra.apiKey`  |
| Gemini         | `GEMINI_API_KEY`                                     | `models.providers.google.apiKey`     |
| GitHub Copilot | `COPILOT_GITHUB_TOKEN`, `GH_TOKEN`, `GITHUB_TOKEN`   | Profil uwierzytelniania przez logowanie na urządzeniu |
| Mistral        | `MISTRAL_API_KEY`                                    | `models.providers.mistral.apiKey`    |
| Ollama         | `OLLAMA_API_KEY` (wartość zastępcza)                 | --                                   |
| OpenAI         | `OPENAI_API_KEY`                                     | `models.providers.openai.apiKey`     |
| Voyage         | `VOYAGE_API_KEY`                                     | `models.providers.voyage.apiKey`     |

<Note>
OAuth Codex obejmuje wyłącznie czat i uzupełnienia, dlatego nie spełnia wymagań żądań osadzania.
</Note>

---

## Konfiguracja zdalnego punktu końcowego

Użyj `provider: "openai-compatible"` dla ogólnego serwera
`/v1/embeddings` zgodnego z OpenAI, który nie powinien dziedziczyć globalnych poświadczeń czatu OpenAI.

<ParamField path="remote.baseUrl" type="string">
  Niestandardowy bazowy adres URL interfejsu API.
</ParamField>
<ParamField path="remote.apiKey" type="string">
  Zastępczy klucz API.
</ParamField>
<ParamField path="remote.headers" type="object">
  Dodatkowe nagłówki HTTP (scalane z domyślnymi ustawieniami dostawcy).
</ParamField>

```json5
{
  agents: {
    defaults: {
      memorySearch: {
        provider: "openai-compatible",
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

## Konfiguracja właściwa dla dostawcy

<AccordionGroup>
  <Accordion title="Gemini">
    | Klucz                  | Typ      | Wartość domyślna       | Opis                                        |
    | ---------------------- | -------- | ---------------------- | ------------------------------------------- |
    | `model`                | `string` | `gemini-embedding-001` | Obsługuje również `gemini-embedding-2-preview` |
    | `outputDimensionality` | `number` | `3072`                 | Dla Embedding 2: 768, 1536 lub 3072         |

    <Warning>
    Zmiana modelu lub `outputDimensionality` zmienia tożsamość indeksu. OpenClaw
    wstrzymuje wyszukiwanie wektorowe do czasu jawnej przebudowy indeksu pamięci.
    </Warning>

  </Accordion>
  <Accordion title="Typy danych wejściowych zgodne z OpenAI">
    Punkty końcowe osadzania zgodne z OpenAI mogą opcjonalnie używać pól żądania `input_type` właściwych dla dostawcy. Jest to przydatne w przypadku asymetrycznych modeli osadzania, które wymagają różnych etykiet dla osadzeń zapytań i dokumentów.

    | Klucz               | Typ      | Wartość domyślna | Opis                                                      |
    | ------------------- | -------- | ---------------- | --------------------------------------------------------- |
    | `inputType`         | `string` | nie ustawiono    | Wspólna wartość `input_type` dla osadzeń zapytań i dokumentów |
    | `queryInputType`    | `string` | nie ustawiono    | Wartość `input_type` podczas zapytania; zastępuje `inputType` |
    | `documentInputType` | `string` | nie ustawiono    | Wartość `input_type` indeksu/dokumentu; zastępuje `inputType` |

    ```json5
    {
      agents: {
        defaults: {
          memorySearch: {
            provider: "openai-compatible",
            remote: {
              baseUrl: "https://embeddings.example/v1",
              apiKey: "${EMBEDDINGS_API_KEY}",
            },
            model: "asymmetric-embedder",
            queryInputType: "query",
            documentInputType: "passage",
          },
        },
      },
    }
    ```

    Zmiana tych wartości wpływa na tożsamość pamięci podręcznej osadzeń podczas indeksowania wsadowego przez dostawcę i powinna zostać uzupełniona ponownym indeksowaniem pamięci, jeśli model nadrzędny traktuje te etykiety odmiennie.

  </Accordion>
  <Accordion title="Bedrock">
    ### Konfiguracja osadzania Bedrock

    Bedrock korzysta z domyślnego łańcucha poświadczeń AWS SDK oraz tokenu okaziciela sprawdzanego przez OpenClaw, dlatego w konfiguracji nie są przechowywane żadne klucze API. Jeśli OpenClaw działa na EC2 z rolą instancji obsługującą Bedrock, wystarczy ustawić dostawcę i model:

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

    | Klucz                  | Typ      | Wartość domyślna               | Opis                                  |
    | ---------------------- | -------- | ------------------------------ | ------------------------------------- |
    | `model`                | `string` | `amazon.titan-embed-text-v2:0` | Dowolny identyfikator modelu osadzania Bedrock |
    | `outputDimensionality` | `number` | domyślna modelu                | Dla Titan V2: 256, 512 lub 1024       |

    **Obsługiwane modele** (z wykrywaniem rodziny i domyślnymi wymiarami):

    | Identyfikator modelu                         | Dostawca   | Domyślne wymiary | Konfigurowalne wymiary     |
    | ------------------------------------------- | ---------- | ---------------- | -------------------------- |
    | `amazon.titan-embed-text-v2:0`             | Amazon     | 1024             | 256, 512, 1024             |
    | `amazon.titan-embed-text-v1`               | Amazon     | 1536             | --                          |
    | `amazon.titan-embed-g1-text-02`            | Amazon     | 1536             | --                          |
    | `amazon.titan-embed-image-v1`              | Amazon     | 1024             | --                          |
    | `amazon.nova-2-multimodal-embeddings-v1:0` | Amazon     | 1024             | 256, 384, 1024, 3072       |
    | `cohere.embed-english-v3`                  | Cohere     | 1024             | --                          |
    | `cohere.embed-multilingual-v3`             | Cohere     | 1024             | --                          |
    | `cohere.embed-v4:0`                        | Cohere     | 1536             | 256, 384, 512, 768, 1024, 1536 |
    | `twelvelabs.marengo-embed-3-0-v1:0`        | TwelveLabs | 512              | --                          |
    | `twelvelabs.marengo-embed-2-7-v1:0`        | TwelveLabs | 1024             | --                          |

    Warianty z sufiksem przepustowości (np. `amazon.titan-embed-text-v1:2:8k`) oraz identyfikatory profili wnioskowania z prefiksem regionu (np. `us.amazon.titan-embed-text-v2:0`) dziedziczą konfigurację modelu bazowego.

    **Region:** rozwiązywany w następującej kolejności: nadpisanie `memorySearch.remote.baseUrl`, konfiguracja `models.providers.amazon-bedrock.baseUrl`, `AWS_REGION`, `AWS_DEFAULT_REGION`, a następnie domyślna wartość `us-east-1`.

    **Uwierzytelnianie:** OpenClaw najpierw sprawdza `AWS_ACCESS_KEY_ID` + `AWS_SECRET_ACCESS_KEY` lub `AWS_BEARER_TOKEN_BEDROCK`, a następnie przechodzi do standardowego domyślnego łańcucha dostawców poświadczeń AWS SDK:

    1. Zmienne środowiskowe (`AWS_ACCESS_KEY_ID` + `AWS_SECRET_ACCESS_KEY`), chyba że ustawiono również `AWS_PROFILE`
    2. SSO (tylko gdy skonfigurowano pola SSO)
    3. Współdzielone pliki poświadczeń i konfiguracji (`fromIni`, obejmuje `AWS_PROFILE`)
    4. Proces poświadczeń (`credential_process` w pliku konfiguracji AWS)
    5. Poświadczenia tokenu tożsamości internetowej
    6. Poświadczenia z metadanych instancji ECS lub EC2

    **Uprawnienia IAM:** rola lub użytkownik IAM wymaga:

    ```json
    {
      "Effect": "Allow",
      "Action": "bedrock:InvokeModel",
      "Resource": "*"
    }
    ```

    Aby zastosować zasadę najmniejszych uprawnień, ogranicz `InvokeModel` do konkretnego modelu:

    ```text
    arn:aws:bedrock:*::foundation-model/amazon.titan-embed-text-v2:0
    ```

  </Accordion>
  <Accordion title="Lokalnie (GGUF + llama.cpp)">
    | Klucz                 | Typ                | Wartość domyślna         | Opis                                                                                                                                                                                                                                                                                                                  |
    | --------------------- | ------------------ | ------------------------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
    | `local.modelPath`     | `string`           | pobierany automatycznie  | Ścieżka do pliku modelu GGUF                                                                                                                                                                                                                                                                                          |
    | `local.modelCacheDir` | `string`           | domyślna node-llama-cpp  | Katalog pamięci podręcznej pobranych modeli                                                                                                                                                                                                                                                                           |
    | `local.contextSize`   | `number \| "auto"` | `4096`                   | Rozmiar okna kontekstu dla kontekstu osadzania. Wartość 4096 obejmuje typowe fragmenty (128–512 tokenów), jednocześnie ograniczając pamięć VRAM niezajmowaną przez wagi. Na hostach o ograniczonych zasobach zmniejsz do 1024–2048. `"auto"` używa wytrenowanego maksimum modelu — niezalecane dla modeli 8B+ (Qwen3-Embedding-8B: do 40 960 tokenów może zwiększyć użycie VRAM do około 32 GB). |

    Najpierw zainstaluj oficjalnego dostawcę llama.cpp: `openclaw plugins install @openclaw/llama-cpp-provider`.
    Model domyślny: `embeddinggemma-300m-qat-Q8_0.gguf` (około 0,6 GB, pobierany automatycznie). Kopie robocze kodu źródłowego nadal wymagają zatwierdzenia natywnej kompilacji: `pnpm approve-builds`, a następnie `pnpm rebuild node-llama-cpp`.

    Użyj samodzielnego CLI, aby zweryfikować tę samą ścieżkę dostawcy, której używa Gateway:

    ```bash
    openclaw memory status --deep --agent main
    openclaw memory index --force --agent main
    ```

    Numeryczne wartości `local.contextSize` wpływają również na automatyczne rozmieszczanie warstw GPU przez node-llama-cpp, dzięki czemu wagi modelu i żądany kontekst osadzania mieszczą się razem. Po załadowaniu środowiska uruchomieniowego polecenie `openclaw memory status --deep` raportuje ostatnio znane informacje o mechanizmie llama.cpp, urządzeniu, odciążaniu, żądanym kontekście i użyciu pamięci wraz ze znacznikami czasu; pasywne sprawdzenie stanu nie ładuje modelu.

    Ustaw jawnie `provider: "local"` dla lokalnych osadzeń GGUF. Odwołania do modeli `hf:` i HTTP(S) są obsługiwane w jawnych konfiguracjach lokalnych (za pośrednictwem mechanizmu rozwiązywania modeli node-llama-cpp), ale nie zmieniają domyślnego dostawcy.

  </Accordion>
</AccordionGroup>

### Limit czasu osadzania w trybie bezpośrednim

<ParamField path="sync.embeddingBatchTimeoutSeconds" type="number">
  Nadpisuje limit czasu dla bezpośrednich partii osadzania podczas indeksowania pamięci.

Brak ustawienia powoduje użycie wartości domyślnej dostawcy: 600 sekund dla dostawców lokalnych/samodzielnie hostowanych, takich jak `local`, `ollama` i `lmstudio`, oraz 120 sekund dla dostawców hostowanych. Zwiększ tę wartość, gdy lokalne partie osadzania obciążające procesor działają prawidłowo, ale wolno.
</ParamField>

---

## Zachowanie indeksowania

Wszystkie opcje znajdują się w `memorySearch.sync`, chyba że zaznaczono inaczej:

| Klucz                          | Typ       | Wartość domyślna | Opis                                                                          |
| ------------------------------ | --------- | ---------------- | ----------------------------------------------------------------------------- |
| `onSessionStart`               | `boolean` | `true`           | Synchronizuje indeks pamięci przy rozpoczęciu sesji                            |
| `onSearch`                     | `boolean` | `true`           | Synchronizuje leniwie podczas wyszukiwania po wykryciu zmian zawartości        |
| `watch`                        | `boolean` | `true`           | Monitoruje pliki pamięci (chokidar) i planuje ponowne indeksowanie po zmianach |
| `watchDebounceMs`              | `number`  | `1500`           | Okno opóźnienia do łączenia szybko następujących zdarzeń monitorowania plików  |
| `intervalMinutes`              | `number`  | `0`              | Okres ponownego indeksowania w minutach (`0` wyłącza)                          |
| `sessions.postCompactionForce` | `boolean` | `true`           | Wymusza ponowne indeksowanie sesji po aktualizacjach transkrypcji wywołanych przez Compaction |

<ParamField path="chunking.tokens" type="number">
  Rozmiar fragmentu w tokenach używany podczas dzielenia źródeł pamięci przed osadzaniem (domyślnie: 400).
</ParamField>
<ParamField path="chunking.overlap" type="number">
  Nakładanie się tokenów między sąsiednimi fragmentami w celu zachowania kontekstu w pobliżu granic podziału (domyślnie: 80).
</ParamField>

<Note>
Zmiana `chunking.tokens` lub `chunking.overlap` zmienia granice fragmentów i unieważnia tożsamość istniejącego indeksu (zobacz ostrzeżenie w sekcji Wybór dostawcy).
</Note>

---

## Konfiguracja wyszukiwania hybrydowego

Wszystkie poniższe ustawienia znajdują się w `memorySearch.query`:

| Klucz        | Typ      | Domyślnie | Opis                                                     |
| ------------ | -------- | --------- | -------------------------------------------------------- |
| `maxResults` | `number` | `6`       | Maksymalna liczba trafień z pamięci zwracanych przed wstrzyknięciem |
| `minScore`   | `number` | `0.35`    | Minimalny wynik trafności wymagany do uwzględnienia trafienia |

Oraz w `memorySearch.query.hybrid`:

| Klucz                 | Typ       | Domyślnie | Opis                                           |
| --------------------- | --------- | --------- | ---------------------------------------------- |
| `enabled`             | `boolean` | `true`    | Włącza hybrydowe wyszukiwanie BM25 i wektorowe |
| `vectorWeight`        | `number`  | `0.7`     | Waga wyników wektorowych (0–1)                 |
| `textWeight`          | `number`  | `0.3`     | Waga wyników BM25 (0–1)                        |
| `candidateMultiplier` | `number`  | `4`       | Mnożnik rozmiaru puli kandydatów                |

<Tabs>
  <Tab title="MMR (różnorodność)">
    | Klucz         | Typ       | Domyślnie | Opis                                         |
    | ------------- | --------- | --------- | -------------------------------------------- |
    | `mmr.enabled` | `boolean` | `false`   | Włącza ponowne uszeregowanie za pomocą MMR   |
    | `mmr.lambda`  | `number`  | `0.7`     | 0 = maksymalna różnorodność, 1 = maksymalna trafność |
  </Tab>
  <Tab title="Spadek czasowy (aktualność)">
    | Klucz                        | Typ       | Domyślnie | Opis                                  |
    | ---------------------------- | --------- | --------- | ------------------------------------- |
    | `temporalDecay.enabled`      | `boolean` | `false`   | Włącza premiowanie aktualności        |
    | `temporalDecay.halfLifeDays` | `number`  | `30`      | Wynik zmniejsza się o połowę co N dni |

    Pliki o trwałej aktualności (`MEMORY.md` oraz pliki bez daty w `memory/`) nigdy nie podlegają obniżaniu wyniku.

  </Tab>
</Tabs>

### Pełny przykład

```json5
{
  agents: {
    defaults: {
      memorySearch: {
        query: {
          maxResults: 6,
          minScore: 0.35,
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

| Klucz        | Typ        | Opis                                        |
| ------------ | ---------- | ------------------------------------------- |
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

Ścieżki mogą być bezwzględne lub względne wobec obszaru roboczego. Katalogi są skanowane rekurencyjnie w poszukiwaniu plików `.md`. Obsługa dowiązań symbolicznych zależy od aktywnego mechanizmu: wbudowany mechanizm pomija dowiązania symboliczne, natomiast QMD stosuje zachowanie bazowego skanera QMD.

Do wyszukiwania transkrypcji między agentami w zakresie danego agenta użyj `agents.list[].memorySearch.qmd.extraCollections` zamiast `memory.qmd.paths`. Te dodatkowe kolekcje mają ten sam format `{ path, name, pattern? }`, ale są scalane osobno dla każdego agenta i mogą zachowywać jawnie określone współdzielone nazwy, gdy ścieżka wskazuje poza bieżący obszar roboczy. Jeśli ta sama rozwiązana ścieżka występuje zarówno w `memory.qmd.paths`, jak i w `memorySearch.qmd.extraCollections`, QMD zachowuje pierwszy wpis i pomija duplikat.

---

## Pamięć multimodalna (Gemini)

Indeksuj obrazy i dźwięk wraz z plikami Markdown za pomocą Gemini Embedding 2:

| Klucz                     | Typ        | Domyślnie | Opis                                             |
| ------------------------- | ---------- | --------- | ------------------------------------------------ |
| `multimodal.enabled`      | `boolean`  | `false`   | Włącza indeksowanie multimodalne                  |
| `multimodal.modalities`   | `string[]` | --        | `["image"]`, `["audio"]` lub `["all"]`           |
| `multimodal.maxFileBytes` | `number`   | `10485760`| Maksymalny rozmiar indeksowanego pliku (10 MiB)   |

<Note>
Dotyczy tylko plików w `extraPaths`. Domyślne główne katalogi pamięci nadal obsługują wyłącznie Markdown. Wymaga `gemini-embedding-2-preview`. Wartość `fallback` musi wynosić `"none"`.
</Note>

Obsługiwane formaty: `.jpg`, `.jpeg`, `.png`, `.webp`, `.gif`, `.heic`, `.heif` (obrazy); `.mp3`, `.wav`, `.ogg`, `.opus`, `.m4a`, `.aac`, `.flac` (dźwięk).

---

## Pamięć podręczna osadzeń

| Klucz              | Typ       | Wartość domyślna | Opis                                                    |
| ------------------ | --------- | ---------------- | ------------------------------------------------------- |
| `cache.enabled`    | `boolean` | `true`           | Przechowuje osadzenia fragmentów w pamięci podręcznej SQLite |
| `cache.maxEntries` | `number`  | nie ustawiono    | Orientacyjny górny limit osadzeń w pamięci podręcznej   |

Zapobiega ponownemu tworzeniu osadzeń dla niezmienionego tekstu podczas ponownego indeksowania lub aktualizacji transkrypcji. Pozostaw `maxEntries` bez wartości, aby pamięć podręczna była nieograniczona; ustaw ją, gdy ograniczenie zajętości dysku jest ważniejsze niż maksymalna szybkość ponownego indeksowania. Po ustawieniu tej wartości i przekroczeniu limitu najstarsze wpisy (według czasu ostatniej aktualizacji) są usuwane jako pierwsze.

---

## Indeksowanie wsadowe

| Klucz                         | Typ       | Wartość domyślna | Opis                                  |
| ----------------------------- | --------- | ---------------- | ------------------------------------- |
| `remote.nonBatchConcurrency`  | `number`  | `4`              | Równoległe osadzanie bezpośrednie     |
| `remote.batch.enabled`        | `boolean` | `false`          | Włącza interfejs API osadzania wsadowego |
| `remote.batch.concurrency`    | `number`  | `2`              | Równoległe zadania wsadowe            |
| `remote.batch.wait`           | `boolean` | `true`           | Oczekuje na zakończenie zadań wsadowych |
| `remote.batch.pollIntervalMs` | `number`  | `2000`           | Interwał odpytywania                  |
| `remote.batch.timeoutMinutes` | `number`  | `60`             | Limit czasu zadania wsadowego         |

Dostępne dla `gemini`, `openai` i `voyage`. Przetwarzanie wsadowe OpenAI jest zazwyczaj najszybsze i najtańsze w przypadku uzupełniania dużych zbiorów danych.

`remote.nonBatchConcurrency` steruje bezpośrednimi wywołaniami osadzania używanymi przez dostawców lokalnych lub samodzielnie hostowanych oraz dostawców hostowanych, gdy ich interfejsy API przetwarzania wsadowego nie są aktywne. W przypadku indeksowania niewsadowego Ollama domyślnie używa wartości `1`, aby nie przeciążać mniejszych hostów lokalnych; na większych maszynach ustaw wyższą wartość.

To ustawienie jest niezależne od `sync.embeddingBatchTimeoutSeconds`, które określa limit czasu bezpośrednich wywołań osadzania.

---

## Wyszukiwanie w pamięci sesji (eksperymentalne)

Indeksuj transkrypcje sesji i udostępniaj je za pomocą `memory_search`:

| Klucz                         | Typ        | Wartość domyślna | Opis                                              |
| ----------------------------- | ---------- | ---------------- | ------------------------------------------------- |
| `experimental.sessionMemory`  | `boolean`  | `false`          | Włącza indeksowanie sesji                         |
| `sources`                     | `string[]` | `["memory"]`     | Dodaj `"sessions"`, aby uwzględnić transkrypcje   |
| `sync.sessions.deltaBytes`    | `number`   | `100000`         | Próg liczby bajtów dla ponownego indeksowania     |
| `sync.sessions.deltaMessages` | `number`   | `50`             | Próg liczby wiadomości dla ponownego indeksowania |

<Warning>
Indeksowanie sesji wymaga jawnego włączenia i działa asynchronicznie. Wyniki mogą być nieco nieaktualne. Dzienniki sesji znajdują się na dysku, dlatego dostęp do systemu plików należy traktować jako granicę zaufania.
</Warning>

Trafienia w transkrypcjach sesji również podlegają ustawieniu
[`tools.sessions.visibility`](/pl/gateway/config-tools#toolssessions). Domyślna
widoczność `tree` udostępnia tylko bieżącą sesję i sesje przez nią utworzone. Aby
przywołać z innej sesji niepowiązaną sesję tego samego agenta, wysłaną przez
Gateway, na przykład wiadomość prywatną, celowo rozszerz widoczność do `agent`
(lub do `all` tylko wtedy, gdy wymagane jest również przywoływanie między
agentami i zezwalają na nie zasady komunikacji między agentami).

Poniższe przykłady umieszczają te ustawienia w `agents.defaults`. Równoważne
ustawienia `memorySearch` można również zastosować w nadpisaniu dla konkretnego
agenta, gdy tylko jeden agent ma indeksować i przeszukiwać transkrypcje sesji.

Aby umożliwić przywoływanie wiadomości prywatnych przez Gateway w obrębie tego samego agenta:

<Tabs>
  <Tab title="Wbudowany backend">
    ```json5
    {
      agents: {
        defaults: {
          memorySearch: {
            experimental: { sessionMemory: true },
            sources: ["memory", "sessions"],
          },
        },
      },
      tools: {
        sessions: { visibility: "agent" },
      },
    }
    ```
  </Tab>
  <Tab title="Backend QMD">
    ```json5
    {
      agents: {
        defaults: {
          memorySearch: {
            experimental: { sessionMemory: true },
            sources: ["memory", "sessions"],
          },
        },
      },
      memory: {
        backend: "qmd",
        qmd: {
          sessions: { enabled: true },
        },
      },
      tools: {
        sessions: { visibility: "agent" },
      },
    }
    ```
  </Tab>
</Tabs>

Podczas korzystania z QMD ustawienia `agents.defaults.memorySearch.experimental.sessionMemory` i
`sources: ["sessions"]` same nie eksportują transkrypcji do QMD. Ustaw również
`memory.qmd.sessions.enabled: true`.

---

  ## Akceleracja wektorowa SQLite (sqlite-vec)

  | Klucz                        | Typ       | Domyślnie | Opis                                      |
  | ---------------------------- | --------- | --------- | ----------------------------------------- |
  | `store.vector.enabled`       | `boolean` | `true`    | Używaj sqlite-vec do zapytań wektorowych  |
  | `store.vector.extensionPath` | `string`  | wbudowana | Zastąp ścieżkę do sqlite-vec              |

  Gdy sqlite-vec jest niedostępne, OpenClaw automatycznie przełącza się na podobieństwo cosinusowe obliczane w procesie.

  ---

  ## Przechowywanie indeksów

  Wbudowane indeksy pamięci znajdują się w bazie danych SQLite OpenClaw każdego agenta pod ścieżką
  `agents/<agentId>/agent/openclaw-agent.sqlite`.

  | Klucz                 | Typ      | Domyślnie   | Opis                                         |
  | --------------------- | -------- | ----------- | -------------------------------------------- |
  | `store.fts.tokenizer` | `string` | `unicode61` | Tokenizator FTS5 (`unicode61` lub `trigram`) |

  ---

  ## Konfiguracja backendu QMD

  Aby włączyć, ustaw `memory.backend = "qmd"`. Wszystkie ustawienia QMD znajdują się w `memory.qmd`:

  | Klucz                    | Typ       | Domyślnie | Opis                                                                                                         |
  | ------------------------ | --------- | --------- | ------------------------------------------------------------------------------------------------------------ |
  | `command`                | `string`  | `qmd`     | Ścieżka do pliku wykonywalnego QMD; ustaw ścieżkę bezwzględną, gdy `PATH` usługi różni się od powłoki         |
  | `searchMode`             | `string`  | `search`  | Polecenie wyszukiwania: `search`, `vsearch`, `query`                                                         |
  | `rerank`                 | `boolean` | --        | Ustaw `false` z `searchMode: "query"` i QMD 2.1+, aby pominąć ponowne szeregowanie wyników przez QMD          |
  | `includeDefaultMemory`   | `boolean` | `true`    | Automatycznie indeksuj `MEMORY.md` i `memory/**/*.md`                                                        |
  | `paths[]`                | `array`   | --        | Dodatkowe ścieżki: `{ name, path, pattern? }`                                                                |
  | `sessions.enabled`       | `boolean` | `false`   | Eksportuj transkrypcje sesji do QMD                                                                         |
  | `sessions.retentionDays` | `number`  | --        | Okres przechowywania transkrypcji                                                                           |
  | `sessions.exportDir`     | `string`  | --        | Katalog eksportu                                                                                            |

  `searchMode: "search"` korzysta wyłącznie z wyszukiwania leksykalnego/BM25. W tym trybie OpenClaw nie wykonuje testów gotowości semantycznych wektorów ani konserwacji osadzeń QMD, również podczas `memory status --deep`; tryby `vsearch` i `query` nadal wymagają gotowości wektorowej QMD oraz osadzeń.

  `rerank: false` zmienia wyłącznie tryb `query` QMD i wymaga QMD 2.1 lub nowszego. W bezpośrednim trybie CLI OpenClaw przekazuje `--no-rerank`; w trybie MCP obsługiwanym przez mcporter przekazuje `rerank: false` do ujednoliconego narzędzia zapytań QMD. Pozostaw tę opcję nieustawioną, aby używać domyślnego mechanizmu ponownego szeregowania zapytań QMD.

  OpenClaw preferuje aktualne formaty kolekcji QMD i zapytań MCP, ale zachowuje zgodność ze starszymi wersjami QMD, w razie potrzeby wypróbowując zgodne flagi wzorców kolekcji i starsze nazwy narzędzi MCP. Gdy QMD deklaruje obsługę wielu filtrów kolekcji, kolekcje z tego samego źródła są przeszukiwane przez jeden proces QMD; starsze kompilacje QMD zachowują ścieżkę zgodności osobną dla każdej kolekcji. To samo źródło oznacza, że kolekcje trwałej pamięci — domyślne pliki pamięci i niestandardowe ścieżki — są grupowane razem, natomiast kolekcje transkrypcji sesji pozostają osobną grupą, dzięki czemu dywersyfikacja źródeł nadal uwzględnia oba rodzaje danych wejściowych.

  <Note>
  Nadpisania modeli QMD pozostają po stronie QMD, a nie w konfiguracji OpenClaw. Jeśli chcesz globalnie zastąpić modele QMD, ustaw zmienne środowiskowe, takie jak `QMD_EMBED_MODEL`, `QMD_RERANK_MODEL` i `QMD_GENERATE_MODEL`, w środowisku uruchomieniowym Gateway.
  </Note>

  ### Integracja z mcporter

  Wszystkie ustawienia znajdują się w `memory.qmd.mcporter`. Kieruje wyszukiwania QMD przez długotrwale działającego demona MCP `mcporter` zamiast uruchamiać `qmd` dla każdego zapytania, ograniczając narzut zimnego startu w przypadku większych modeli.

  | Klucz         | Typ       | Domyślnie | Opis                                                                                       |
  | ------------- | --------- | --------- | ------------------------------------------------------------------------------------------ |
  | `enabled`     | `boolean` | `false`   | Kieruj wywołania QMD przez mcporter zamiast uruchamiać `qmd` dla każdego żądania            |
  | `serverName`  | `string`  | `qmd`     | Nazwa serwera mcporter uruchamiającego `qmd mcp` z `lifecycle: keep-alive`                  |
  | `startDaemon` | `boolean` | `true`    | Automatycznie uruchamiaj demona mcporter, gdy `enabled` ma wartość `true`                   |

  Wymaga zainstalowanego programu `mcporter`, dostępnego w PATH, oraz skonfigurowanego serwera mcporter uruchamiającego `qmd mcp`. Pozostaw wyłączone w prostszych konfiguracjach lokalnych, w których koszt uruchamiania procesu dla każdego zapytania jest akceptowalny.

  <AccordionGroup>
  <Accordion title="Update schedule">
    | Klucz                     | Typ       | Domyślnie | Opis                                                                                                    |
    | ------------------------- | --------- | --------- | ------------------------------------------------------------------------------------------------------- |
    | `update.interval`         | `string`  | `5m`      | Interwał odświeżania                                                                                    |
    | `update.debounceMs`       | `number`  | `15000`   | Opóźnienie stabilizujące zmiany plików                                                                  |
    | `update.onBoot`           | `boolean` | `true`    | Odświeżaj po otwarciu długotrwale działającego menedżera QMD; ustaw `false`, aby pominąć natychmiastową aktualizację po uruchomieniu |
    | `update.startup`          | `string`  | `off`     | Opcjonalna inicjalizacja QMD przy uruchamianiu Gateway: `off`, `idle` lub `immediate`                    |
    | `update.startupDelayMs`   | `number`  | `120000`  | Opóźnienie przed odświeżeniem `startup: "idle"`                                                         |
    | `update.waitForBootSync`  | `boolean` | `false`   | Blokuj otwarcie menedżera do czasu ukończenia jego początkowego odświeżania                              |
    | `update.embedInterval`    | `string`  | `60m`     | Osobny harmonogram generowania osadzeń                                                                  |
    | `update.commandTimeoutMs` | `number`  | `30000`   | Limit czasu poleceń konserwacyjnych QMD (wyświetlanie/dodawanie kolekcji)                                |
    | `update.updateTimeoutMs`  | `number`  | `120000`  | Limit czasu każdego cyklu `qmd update`                                                                  |
    | `update.embedTimeoutMs`   | `number`  | `120000`  | Limit czasu każdego cyklu `qmd embed`                                                                   |
  </Accordion>
  <Accordion title="Limits">
    | Klucz                     | Typ      | Domyślnie | Opis                                           |
    | ------------------------- | -------- | --------- | ---------------------------------------------- |
    | `limits.maxResults`       | `number` | `4`       | Maksymalna liczba wyników wyszukiwania         |
    | `limits.maxSnippetChars`  | `number` | `450`     | Ograniczenie długości fragmentu                |
    | `limits.maxInjectedChars` | `number` | `2200`    | Ograniczenie łącznej liczby wstrzykniętych znaków |
    | `limits.timeoutMs`        | `number` | `4000`    | Limit czasu wyszukiwania                       |
  </Accordion>
  <Accordion title="Scope">
    Określa, które sesje mogą otrzymywać wyniki wyszukiwania QMD. Schemat jest taki sam jak w [`session.sendPolicy`](/pl/gateway/config-agents#session):

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

    Domyślna dostarczana konfiguracja zezwala wyłącznie na wiadomości prywatne/bezpośrednie, odrzucając grupy i inne typy kanałów. `match.keyPrefix` dopasowuje znormalizowany klucz sesji; `match.rawKeyPrefix` dopasowuje nieprzetworzony klucz zawierający `agent:<id>:`.

  </Accordion>
  <Accordion title="Cytowania">
    `memory.citations` ma zastosowanie do wszystkich backendów:

    | Wartość          | Zachowanie                                                       |
    | ---------------- | ---------------------------------------------------------------- |
    | `auto` (domyślnie) | Dołącz stopkę `Source: <path#line>` do fragmentów               |
    | `on`             | Zawsze dołączaj stopkę                                            |
    | `off`            | Pomijaj stopkę (ścieżka nadal jest wewnętrznie przekazywana agentowi) |

  </Accordion>
</AccordionGroup>

Gdy inicjalizacja QMD podczas uruchamiania Gateway jest włączona, OpenClaw uruchamia QMD tylko dla kwalifikujących się agentów. Jeśli `update.onBoot` ma wartość true i nie skonfigurowano okresowej konserwacji aktualizacji ani osadzania, podczas uruchamiania używany jest jednorazowy menedżer do wykonania odświeżenia startowego, a następnie zostaje zamknięty. Jeśli skonfigurowano interwał aktualizacji lub osadzania, podczas uruchamiania otwierany jest długotrwały menedżer QMD, który zarządza obserwatorem i licznikami interwałów; `update.onBoot: false` pomija tylko natychmiastowe odświeżenie startowe.

### Pełny przykład QMD

```json5
{
  memory: {
    backend: "qmd",
    citations: "auto",
    qmd: {
      includeDefaultMemory: true,
      update: { interval: "5m", debounceMs: 15000 },
      limits: { maxResults: 4, timeoutMs: 4000 },
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

Dreaming działa jako jedno zaplanowane przetwarzanie i wykorzystuje wewnętrzne fazy lekką, głęboką i REM jako szczegół implementacyjny.

Opis działania koncepcyjnego i poleceń z ukośnikiem zawiera sekcja [Dreaming](/pl/concepts/dreaming).

### Ustawienia użytkownika

| Klucz                                  | Typ       | Wartość domyślna | Opis                                                                                                                                                          |
| -------------------------------------- | --------- | ---------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `enabled`                              | `boolean` | `false`          | Całkowicie włącza lub wyłącza Dreaming                                                                                                                        |
| `frequency`                            | `string`  | `0 3 * * *`      | Opcjonalna częstotliwość Cron dla pełnego przebiegu Dreaming                                                                                                  |
| `model`                                | `string`  | model domyślny   | Opcjonalne zastąpienie modelu podagenta Dream Diary                                                                                                           |
| `phases.deep.maxPromotedSnippetTokens` | `number`  | `160`            | Maksymalna szacowana liczba tokenów zachowywanych z każdego fragmentu pamięci krótkotrwałej przeniesionego do `MEMORY.md`; metadane pochodzenia pozostają widoczne |

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
- Dreaming zapisuje stan maszynowy w `memory/.dreams/`.
- Dreaming zapisuje czytelny dla człowieka opis w `DREAMS.md` (lub istniejącym `dreams.md`).
- `dreaming.model` korzysta z istniejącej bramy zaufania podagenta Pluginu; przed jego włączeniem ustaw `plugins.entries.memory-core.subagent.allowModelOverride: true`.
- Dream Diary ponawia próbę raz, używając domyślnego modelu sesji, gdy skonfigurowany model jest niedostępny. Błędy zaufania lub listy dozwolonych modeli są rejestrowane i nie powodują niejawnego ponowienia próby.
- Zasady i progi faz lekkiej, głębokiej i REM są zachowaniem wewnętrznym, a nie konfiguracją dostępną dla użytkownika.

</Note>

## Powiązane

- [Dokumentacja konfiguracji](/pl/gateway/configuration-reference)
- [Omówienie pamięci](/pl/concepts/memory)
- [Wyszukiwanie w pamięci](/pl/concepts/memory-search)
