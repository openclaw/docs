---
read_when:
    - Chcesz skonfigurować dostawców wyszukiwania w pamięci lub modele embeddingów
    - Chcesz skonfigurować backend QMD
    - Chcesz dostroić wyszukiwanie hybrydowe, MMR lub zanik czasowy
    - Chcesz włączyć indeksowanie pamięci multimodalnej
sidebarTitle: Memory config
summary: Wszystkie opcje konfiguracji wyszukiwania pamięci, dostawców embeddingów, QMD, wyszukiwania hybrydowego i indeksowania multimodalnego
title: Dokumentacja referencyjna konfiguracji pamięci
x-i18n:
    generated_at: "2026-06-28T22:34:02Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: de7d1c23cd415293001ef59ae2572cd7bfe9a88c70c1e4cf138ee60664ff0ac2
    source_path: reference/memory-config.md
    workflow: 16
---

Ta strona wymienia wszystkie ustawienia konfiguracji wyszukiwania pamięci OpenClaw. Omówienia koncepcyjne znajdziesz tutaj:

<CardGroup cols={2}>
  <Card title="Przegląd pamięci" href="/pl/concepts/memory">
    Jak działa pamięć.
  </Card>
  <Card title="Wbudowany silnik" href="/pl/concepts/memory-builtin">
    Domyślny backend SQLite.
  </Card>
  <Card title="Silnik QMD" href="/pl/concepts/memory-qmd">
    Lokalny sidecar.
  </Card>
  <Card title="Wyszukiwanie pamięci" href="/pl/concepts/memory-search">
    Potok wyszukiwania i strojenie.
  </Card>
  <Card title="Active Memory" href="/pl/concepts/active-memory">
    Podagent pamięci dla sesji interaktywnych.
  </Card>
</CardGroup>

Wszystkie ustawienia wyszukiwania pamięci znajdują się w `agents.defaults.memorySearch` w `openclaw.json`, chyba że zaznaczono inaczej.

<Note>
Jeśli szukasz przełącznika funkcji **Active Memory** i konfiguracji podagenta, znajduje się ona w `plugins.entries.active-memory`, a nie w `memorySearch`.

Active Memory używa modelu dwóch bramek:

1. Plugin musi być włączony i wskazywać bieżący identyfikator agenta
2. żądanie musi być kwalifikującą się interaktywną, trwałą sesją czatu

Zobacz [Active Memory](/pl/concepts/active-memory), aby poznać model aktywacji, konfigurację należącą do Pluginu, utrwalanie transkryptu i wzorzec bezpiecznego wdrażania.
</Note>

---

## Wybór dostawcy

| Klucz      | Typ       | Domyślnie             | Opis                                                                                                                                                                                                                                                                                        |
| ---------- | --------- | --------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `provider` | `string`  | `"openai"`            | Identyfikator adaptera osadzania, taki jak `bedrock`, `deepinfra`, `gemini`, `github-copilot`, `local`, `mistral`, `ollama`, `openai`, `openai-compatible` lub `voyage`; może też być skonfigurowanym `models.providers.<id>`, którego `api` wskazuje adapter osadzania pamięci lub API modelu zgodne z OpenAI |
| `model`    | `string`  | domyślny dostawcy     | Nazwa modelu osadzania                                                                                                                                                                                                                                                                      |
| `fallback` | `string`  | `"none"`              | Identyfikator adaptera awaryjnego używany, gdy podstawowy zawiedzie                                                                                                                                                                                                                         |
| `enabled`  | `boolean` | `true`                | Włącz lub wyłącz wyszukiwanie pamięci                                                                                                                                                                                                                                                       |

Gdy `provider` nie jest ustawiony, OpenClaw używa osadzeń OpenAI. Ustaw `provider`
jawnie, aby użyć Gemini, Voyage, Mistral, DeepInfra, Bedrock, GitHub Copilot,
Ollama, lokalnego modelu GGUF albo zgodnego z OpenAI punktu końcowego `/v1/embeddings`.
Starsze konfiguracje, które nadal zawierają `provider: "auto"`, są rozwiązywane jako `openai`.

<Warning>
Zmiana dostawcy osadzeń, modelu, ustawień dostawcy, źródeł, zakresu,
dzielenia na fragmenty lub tokenizatora może sprawić, że istniejący indeks wektorowy SQLite stanie się niezgodny.
OpenClaw wstrzymuje wyszukiwanie wektorowe i zgłasza ostrzeżenie o tożsamości indeksu zamiast
automatycznie ponownie osadzać wszystko. Odbuduj indeks, gdy będziesz gotowy, za pomocą
`openclaw memory status --index --agent <id>` albo
`openclaw memory index --force --agent <id>`.
</Warning>

Gdy `provider` nie jest ustawiony, obecne jest starsze `provider: "auto"` albo
`provider: "none"` celowo wybiera tryb tylko FTS, przywoływanie pamięci nadal może
używać leksykalnego rankingu FTS, gdy osadzenia są niedostępne.

Jawni dostawcy nielokalni zawodzą w trybie zamkniętym. Jeśli ustawisz `memorySearch.provider` na
konkretnego dostawcę opartego na zdalnym backendzie, takiego jak OpenAI, Gemini, Voyage, Mistral,
Bedrock, GitHub Copilot, DeepInfra, Ollama, LM Studio albo zgodnego z OpenAI
dostawcę niestandardowego, i ten dostawca jest niedostępny w czasie działania, `memory_search`
zwraca wynik niedostępności zamiast po cichu używać przywoływania tylko FTS. Napraw
konfigurację dostawcy/uwierzytelniania, przełącz się na osiągalnego dostawcę albo ustaw
`provider: "none"`, jeśli chcesz celowego przywoływania tylko FTS.

### Niestandardowe identyfikatory dostawców

`memorySearch.provider` może wskazywać niestandardowy wpis `models.providers.<id>` dla adapterów dostawców specyficznych dla pamięci, takich jak `ollama`, albo dla zgodnych z OpenAI API modeli, takich jak `openai-responses` / `openai-completions`. OpenClaw rozwiązuje właściciela `api` tego dostawcy dla adaptera osadzania, zachowując jednocześnie niestandardowy identyfikator dostawcy na potrzeby obsługi punktu końcowego, uwierzytelniania i prefiksu modelu. Dzięki temu konfiguracje z wieloma GPU lub wieloma hostami mogą przeznaczyć osadzenia pamięci dla konkretnego lokalnego punktu końcowego:

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

Zdalne osadzenia wymagają klucza API. Bedrock używa zamiast tego domyślnego łańcucha poświadczeń AWS SDK (role instancji, SSO, klucze dostępu).

| Dostawca       | Zmienna środowiskowa                              | Klucz konfiguracji                |
| -------------- | -------------------------------------------------- | --------------------------------- |
| Bedrock        | Łańcuch poświadczeń AWS                           | Klucz API nie jest potrzebny      |
| DeepInfra      | `DEEPINFRA_API_KEY`                                | `models.providers.deepinfra.apiKey` |
| Gemini         | `GEMINI_API_KEY`                                   | `models.providers.google.apiKey`  |
| GitHub Copilot | `COPILOT_GITHUB_TOKEN`, `GH_TOKEN`, `GITHUB_TOKEN` | Profil uwierzytelniania przez logowanie urządzenia |
| Mistral        | `MISTRAL_API_KEY`                                  | `models.providers.mistral.apiKey` |
| Ollama         | `OLLAMA_API_KEY` (symbol zastępczy)                | --                                |
| OpenAI         | `OPENAI_API_KEY`                                   | `models.providers.openai.apiKey`  |
| Voyage         | `VOYAGE_API_KEY`                                   | `models.providers.voyage.apiKey`  |

<Note>
OAuth Codex obejmuje tylko czat/uzupełnienia i nie spełnia wymagań żądań osadzeń.
</Note>

---

## Konfiguracja zdalnego punktu końcowego

Użyj `provider: "openai-compatible"` dla ogólnego zgodnego z OpenAI
serwera `/v1/embeddings`, który nie powinien dziedziczyć globalnych poświadczeń czatu OpenAI.

<ParamField path="remote.baseUrl" type="string">
  Niestandardowy bazowy URL API.
</ParamField>
<ParamField path="remote.apiKey" type="string">
  Zastąp klucz API.
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

## Konfiguracja specyficzna dla dostawcy

<AccordionGroup>
  <Accordion title="Gemini">
    | Klucz                  | Typ      | Domyślnie              | Opis                                       |
    | ---------------------- | -------- | ---------------------- | ------------------------------------------ |
    | `model`                | `string` | `gemini-embedding-001` | Obsługuje też `gemini-embedding-2-preview` |
    | `outputDimensionality` | `number` | `3072`                 | Dla Embedding 2: 768, 1536 albo 3072       |

    <Warning>
    Zmiana modelu lub `outputDimensionality` zmienia tożsamość indeksu. OpenClaw
    wstrzymuje wyszukiwanie wektorowe, dopóki jawnie nie odbudujesz indeksu pamięci.
    </Warning>

  </Accordion>
  <Accordion title="Typy wejścia zgodne z OpenAI">
    Zgodne z OpenAI punkty końcowe osadzania mogą włączyć specyficzne dla dostawcy pola żądania `input_type`. Jest to przydatne dla asymetrycznych modeli osadzania, które wymagają różnych etykiet dla osadzeń zapytań i dokumentów.

    | Klucz               | Typ      | Domyślnie    | Opis                                                    |
    | ------------------- | -------- | ------------ | ------------------------------------------------------- |
    | `inputType`         | `string` | nieustawione | Wspólne `input_type` dla osadzeń zapytań i dokumentów   |
    | `queryInputType`    | `string` | nieustawione | `input_type` w czasie zapytania; zastępuje `inputType`  |
    | `documentInputType` | `string` | nieustawione | `input_type` indeksu/dokumentu; zastępuje `inputType`   |

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

    Zmiana tych wartości wpływa na tożsamość pamięci podręcznej osadzeń dla indeksowania wsadowego dostawcy i powinna być wykonana razem z ponownym indeksowaniem pamięci, gdy model upstream traktuje etykiety inaczej.

  </Accordion>
  <Accordion title="Bedrock">
    ### Konfiguracja osadzeń Bedrock

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

    | Klucz                  | Typ      | Domyślnie                     | Opis                            |
    | ---------------------- | -------- | ----------------------------- | ------------------------------- |
    | `model`                | `string` | `amazon.titan-embed-text-v2:0` | Dowolny identyfikator modelu osadzania Bedrock |
    | `outputDimensionality` | `number` | domyślna modelu               | Dla Titan V2: 256, 512 albo 1024 |

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
    3. Poświadczenia tokenu tożsamości webowej
    4. Współdzielone pliki poświadczeń i konfiguracji
    5. Poświadczenia metadanych ECS lub EC2

    Region jest rozwiązywany z `AWS_REGION`, `AWS_DEFAULT_REGION`, `baseUrl` dostawcy `amazon-bedrock` albo domyślnie ustawiany na `us-east-1`.

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
  <Accordion title="Lokalnie (GGUF + llama.cpp)">
    | Klucz                 | Typ                | Domyślna wartość        | Opis                                                                                                                                                                                                                                                                                                                                                    |
    | --------------------- | ------------------ | ----------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
    | `local.modelPath`     | `string`           | pobierany automatycznie | Ścieżka do pliku modelu GGUF                                                                                                                                                                                                                                                                                                                            |
    | `local.modelCacheDir` | `string`           | domyślna node-llama-cpp | Katalog pamięci podręcznej dla pobranych modeli                                                                                                                                                                                                                                                                                                         |
    | `local.contextSize`   | `number \| "auto"` | `4096`                  | Rozmiar okna kontekstu dla kontekstu embeddingów. 4096 obejmuje typowe fragmenty (128–512 tokenów), jednocześnie ograniczając VRAM niezajmowany przez wagi. Obniż do 1024–2048 na ograniczonych hostach. `"auto"` używa wytrenowanego maksimum modelu — niezalecane dla modeli 8B+ (Qwen3-Embedding-8B: 40 960 tokenów → ~32 GB VRAM vs ~8,8 GB przy 4096). |

    Najpierw zainstaluj oficjalnego dostawcę llama.cpp: `openclaw plugins install @openclaw/llama-cpp-provider`.
    Model domyślny: `embeddinggemma-300m-qat-Q8_0.gguf` (~0,6 GB, pobierany automatycznie). Kopie robocze ze źródeł nadal wymagają zatwierdzenia natywnej kompilacji: `pnpm approve-builds`, a następnie `pnpm rebuild node-llama-cpp`.

    Użyj samodzielnego CLI, aby zweryfikować tę samą ścieżkę dostawcy, której używa Gateway:

    ```bash
    openclaw memory status --deep --agent main
    openclaw memory index --force --agent main
    ```

    Ustaw `provider: "local"` jawnie dla lokalnych embeddingów GGUF. Odwołania do modeli `hf:` i HTTP(S) są obsługiwane dla jawnych konfiguracji lokalnych, ale nie zmieniają domyślnego dostawcy.

  </Accordion>
</AccordionGroup>

### Limit czasu embeddingów inline

<ParamField path="sync.embeddingBatchTimeoutSeconds" type="number">
  Nadpisz limit czasu dla partii embeddingów inline podczas indeksowania pamięci.

Brak ustawienia używa wartości domyślnej dostawcy: 600 sekund dla dostawców lokalnych/samodzielnie hostowanych, takich jak `local`, `ollama` i `lmstudio`, oraz 120 sekund dla dostawców hostowanych. Zwiększ tę wartość, gdy lokalne partie embeddingów ograniczone przez CPU działają poprawnie, ale wolno.
</ParamField>

---

## Konfiguracja wyszukiwania hybrydowego

Wszystko pod `memorySearch.query.hybrid`:

| Klucz                 | Typ       | Domyślna wartość | Opis                                      |
| --------------------- | --------- | ---------------- | ----------------------------------------- |
| `enabled`             | `boolean` | `true`           | Włącz hybrydowe wyszukiwanie BM25 + wektorowe |
| `vectorWeight`        | `number`  | `0.7`            | Waga wyników wektorowych (0-1)            |
| `textWeight`          | `number`  | `0.3`            | Waga wyników BM25 (0-1)                   |
| `candidateMultiplier` | `number`  | `4`              | Mnożnik rozmiaru puli kandydatów          |

<Tabs>
  <Tab title="MMR (różnorodność)">
    | Klucz         | Typ       | Domyślna wartość | Opis                                        |
    | ------------- | --------- | ---------------- | ------------------------------------------- |
    | `mmr.enabled` | `boolean` | `false`          | Włącz ponowne rankingowanie MMR             |
    | `mmr.lambda`  | `number`  | `0.7`            | 0 = maks. różnorodność, 1 = maks. trafność  |
  </Tab>
  <Tab title="Zanik czasowy (aktualność)">
    | Klucz                        | Typ       | Domyślna wartość | Opis                                |
    | ---------------------------- | --------- | ---------------- | ----------------------------------- |
    | `temporalDecay.enabled`      | `boolean` | `false`          | Włącz podbicie aktualności          |
    | `temporalDecay.halfLifeDays` | `number`  | `30`             | Wynik zmniejsza się o połowę co N dni |

    Pliki evergreen (`MEMORY.md`, niedatowane pliki w `memory/`) nigdy nie podlegają zanikowi.

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

| Klucz        | Typ        | Opis                                             |
| ------------ | ---------- | ------------------------------------------------ |
| `extraPaths` | `string[]` | Dodatkowe katalogi lub pliki do zaindeksowania   |

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

Ścieżki mogą być bezwzględne albo względne względem obszaru roboczego. Katalogi są skanowane rekurencyjnie w poszukiwaniu plików `.md`. Obsługa dowiązań symbolicznych zależy od aktywnego backendu: wbudowany silnik ignoruje dowiązania symboliczne, natomiast QMD stosuje zachowanie bazowego skanera QMD.

W przypadku wyszukiwania transkrypcji między agentami w zakresie agenta użyj `agents.list[].memorySearch.qmd.extraCollections` zamiast `memory.qmd.paths`. Te dodatkowe kolekcje mają ten sam kształt `{ path, name, pattern? }`, ale są scalane per agent i mogą zachowywać jawne nazwy współdzielone, gdy ścieżka wskazuje poza bieżący obszar roboczy. Jeśli ta sama rozwiązana ścieżka pojawia się zarówno w `memory.qmd.paths`, jak i w `memorySearch.qmd.extraCollections`, QMD zachowuje pierwszy wpis i pomija duplikat.

---

## Pamięć multimodalna (Gemini)

Indeksuj obrazy i audio razem z Markdown przy użyciu Gemini Embedding 2:

| Klucz                     | Typ        | Domyślnie  | Opis                                   |
| ------------------------- | ---------- | ---------- | -------------------------------------- |
| `multimodal.enabled`      | `boolean`  | `false`    | Włącz indeksowanie multimodalne        |
| `multimodal.modalities`   | `string[]` | --         | `["image"]`, `["audio"]` lub `["all"]` |
| `multimodal.maxFileBytes` | `number`   | `10000000` | Maksymalny rozmiar pliku do indeksowania |

<Note>
Dotyczy tylko plików w `extraPaths`. Domyślne katalogi główne pamięci pozostają ograniczone do Markdown. Wymaga `gemini-embedding-2-preview`. `fallback` musi mieć wartość `"none"`.
</Note>

Obsługiwane formaty: `.jpg`, `.jpeg`, `.png`, `.webp`, `.gif`, `.heic`, `.heif` (obrazy); `.mp3`, `.wav`, `.ogg`, `.opus`, `.m4a`, `.aac`, `.flac` (audio).

---

## Pamięć podręczna embeddingów

| Klucz              | Typ       | Domyślnie | Opis                                  |
| ------------------ | --------- | -------- | ------------------------------------- |
| `cache.enabled`    | `boolean` | `true`   | Buforuj embeddingi fragmentów w SQLite |
| `cache.maxEntries` | `number`  | `50000`  | Maksymalna liczba buforowanych embeddingów |

Zapobiega ponownemu embeddingowi niezmienionego tekstu podczas ponownego indeksowania lub aktualizacji transkrypcji.

---

## Indeksowanie wsadowe

| Klucz                         | Typ       | Domyślnie | Opis                               |
| ----------------------------- | --------- | -------- | ---------------------------------- |
| `remote.nonBatchConcurrency`  | `number`  | `4`      | Równoległe embeddingi inline       |
| `remote.batch.enabled`        | `boolean` | `false`  | Włącz API embeddingów wsadowych    |
| `remote.batch.concurrency`    | `number`  | `2`      | Równoległe zadania wsadowe         |
| `remote.batch.wait`           | `boolean` | `true`   | Czekaj na ukończenie wsadu         |
| `remote.batch.pollIntervalMs` | `number`  | --       | Interwał odpytywania               |
| `remote.batch.timeoutMinutes` | `number`  | --       | Limit czasu wsadu                  |

Dostępne dla `openai`, `gemini` i `voyage`. Wsad OpenAI jest zwykle najszybszy i najtańszy przy dużych uzupełnieniach historycznych.

`remote.nonBatchConcurrency` kontroluje wywołania embeddingów inline używane przez lokalnych/samodzielnie hostowanych dostawców oraz dostawców hostowanych, gdy API wsadowe dostawcy nie są aktywne. Ollama domyślnie używa `1` dla indeksowania niewsadowego, aby uniknąć przeciążenia mniejszych hostów lokalnych; ustaw wyższą wartość na większych maszynach.

Jest to niezależne od `sync.embeddingBatchTimeoutSeconds`, które kontroluje limit czasu wywołań embeddingów inline.

---

## Wyszukiwanie w pamięci sesji (eksperymentalne)

Indeksuj transkrypcje sesji i udostępniaj je przez `memory_search`:

| Klucz                         | Typ        | Domyślnie   | Opis                                             |
| ----------------------------- | ---------- | ----------- | ------------------------------------------------ |
| `experimental.sessionMemory`  | `boolean`  | `false`     | Włącz indeksowanie sesji                         |
| `sources`                     | `string[]` | `["memory"]` | Dodaj `"sessions"`, aby uwzględnić transkrypcje |
| `sync.sessions.deltaBytes`    | `number`   | `100000`    | Próg bajtów do ponownego indeksowania            |
| `sync.sessions.deltaMessages` | `number`   | `50`        | Próg wiadomości do ponownego indeksowania        |

<Warning>
Indeksowanie sesji jest opcjonalne i działa asynchronicznie. Wyniki mogą być nieco nieaktualne. Dzienniki sesji znajdują się na dysku, więc traktuj dostęp do systemu plików jako granicę zaufania.
</Warning>

Trafienia transkrypcji sesji również respektują
[`tools.sessions.visibility`](/pl/gateway/config-tools#toolssessions). Domyślna
widoczność `tree` udostępnia tylko bieżącą sesję oraz sesje przez nią utworzone. Aby
przywołać niepowiązaną sesję tego samego agenta wysłaną przez Gateway z innej
sesji, takiej jak DM, celowo rozszerz widoczność do `agent` (lub do `all` tylko
wtedy, gdy wymagane jest także przywoływanie między agentami i zezwala na to polityka agent-agent).

Poniższe przykłady umieszczają te ustawienia w `agents.defaults`. Możesz też
zastosować równoważne ustawienia `memorySearch` w nadpisaniu dla konkretnego agenta, gdy tylko jeden
agent ma indeksować i przeszukiwać transkrypcje sesji.

Dla przywoływania Gateway-do-DM tego samego agenta:

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

Podczas używania QMD, `agents.defaults.memorySearch.experimental.sessionMemory` oraz
`sources: ["sessions"]` same z siebie nie eksportują transkrypcji do QMD. Ustaw
również `memory.qmd.sessions.enabled: true`.

---

## Przyspieszenie wektorowe SQLite (sqlite-vec)

| Klucz                        | Typ       | Domyślnie | Opis                                  |
| ---------------------------- | --------- | --------- | ------------------------------------- |
| `store.vector.enabled`       | `boolean` | `true`    | Używaj sqlite-vec do zapytań wektorowych |
| `store.vector.extensionPath` | `string`  | bundled   | Nadpisz ścieżkę sqlite-vec            |

Gdy sqlite-vec jest niedostępny, OpenClaw automatycznie przełącza się na podobieństwo cosinusowe w procesie.

---

## Przechowywanie indeksów

Wbudowane indeksy pamięci znajdują się w bazie danych OpenClaw SQLite każdego agenta pod
`agents/<agentId>/agent/openclaw-agent.sqlite`.

| Klucz                 | Typ      | Domyślnie  | Opis                                      |
| --------------------- | -------- | ---------- | ----------------------------------------- |
| `store.fts.tokenizer` | `string` | `unicode61` | Tokenizer FTS5 (`unicode61` lub `trigram`) |

---

## Konfiguracja backendu QMD

Ustaw `memory.backend = "qmd"`, aby włączyć. Wszystkie ustawienia QMD znajdują się w `memory.qmd`:

| Klucz                    | Typ       | Domyślnie | Opis                                                                                         |
| ------------------------ | --------- | --------- | -------------------------------------------------------------------------------------------- |
| `command`                | `string`  | `qmd`     | Ścieżka do pliku wykonywalnego QMD; ustaw ścieżkę bezwzględną, gdy `PATH` usługi różni się od powłoki |
| `searchMode`             | `string`  | `search`  | Polecenie wyszukiwania: `search`, `vsearch`, `query`                                         |
| `rerank`                 | `boolean` | --        | Ustaw na `false` z `searchMode: "query"` i QMD 2.1+, aby pominąć ponowne rankingowanie QMD   |
| `includeDefaultMemory`   | `boolean` | `true`    | Automatycznie indeksuj `MEMORY.md` + `memory/**/*.md`                                        |
| `paths[]`                | `array`   | --        | Dodatkowe ścieżki: `{ name, path, pattern? }`                                                |
| `sessions.enabled`       | `boolean` | `false`   | Eksportuj transkrypcje sesji do QMD                                                          |
| `sessions.retentionDays` | `number`  | --        | Przechowywanie transkrypcji                                                                  |
| `sessions.exportDir`     | `string`  | --        | Katalog eksportu                                                                             |

`searchMode: "search"` działa wyłącznie leksykalnie/BM25. OpenClaw nie uruchamia sond gotowości wektorów semantycznych ani utrzymania embeddingów QMD dla tego trybu, także podczas `memory status --deep`; `vsearch` i `query` nadal wymagają gotowości wektorowej QMD oraz embeddingów.

`rerank: false` zmienia tylko tryb `query` QMD i wymaga QMD 2.1 lub nowszego. W bezpośrednim trybie CLI OpenClaw przekazuje `--no-rerank`; w trybie MCP opartym na mcporter przekazuje `rerank: false` do ujednoliconego narzędzia zapytań QMD. Pozostaw to nieustawione, aby używać domyślnego zachowania ponownego rankingowania zapytań QMD.

OpenClaw preferuje bieżące kształty kolekcji QMD i zapytań MCP, ale utrzymuje działanie starszych wydań QMD, próbując w razie potrzeby zgodnych flag wzorców kolekcji i starszych nazw narzędzi MCP. Gdy QMD deklaruje obsługę wielu filtrów kolekcji, kolekcje z tego samego źródła są przeszukiwane jednym procesem QMD; starsze kompilacje QMD zachowują ścieżkę zgodności dla pojedynczych kolekcji. To samo źródło oznacza, że trwałe kolekcje pamięci są grupowane razem, natomiast kolekcje transkrypcji sesji pozostają osobną grupą, aby dywersyfikacja źródeł nadal miała oba wejścia.

<Note>
Nadpisania modeli QMD pozostają po stronie QMD, a nie w konfiguracji OpenClaw. Jeśli musisz globalnie nadpisać modele QMD, ustaw zmienne środowiskowe, takie jak `QMD_EMBED_MODEL`, `QMD_RERANK_MODEL` i `QMD_GENERATE_MODEL`, w środowisku uruchomieniowym Gateway.
</Note>

<AccordionGroup>
  <Accordion title="Harmonogram aktualizacji">
    | Klucz                     | Typ       | Domyślnie | Opis                                  |
    | ------------------------- | --------- | --------- | ------------------------------------- |
    | `update.interval`         | `string`  | `5m`      | Interwał odświeżania                  |
    | `update.debounceMs`       | `number`  | `15000`   | Debounce zmian plików                 |
    | `update.onBoot`           | `boolean` | `true`    | Odświeżaj po otwarciu długotrwałego menedżera QMD; ustaw false, aby pominąć natychmiastową aktualizację przy uruchomieniu |
    | `update.startup`          | `string`  | `off`     | Opcjonalna inicjalizacja QMD przy starcie Gateway: `off`, `idle` lub `immediate` |
    | `update.startupDelayMs`   | `number`  | `120000`  | Opóźnienie przed uruchomieniem odświeżania `startup: "idle"` |
    | `update.waitForBootSync`  | `boolean` | `false`   | Blokuj otwarcie menedżera do zakończenia jego początkowego odświeżania |
    | `update.embedInterval`    | `string`  | --        | Osobny rytm osadzania                 |
    | `update.commandTimeoutMs` | `number`  | --        | Limit czasu poleceń QMD               |
    | `update.updateTimeoutMs`  | `number`  | --        | Limit czasu operacji aktualizacji QMD |
    | `update.embedTimeoutMs`   | `number`  | --        | Limit czasu operacji osadzania QMD    |
  </Accordion>
  <Accordion title="Limity">
    | Klucz                     | Typ      | Domyślnie | Opis                                  |
    | ------------------------- | -------- | --------- | ------------------------------------- |
    | `limits.maxResults`       | `number` | `6`       | Maksymalna liczba wyników wyszukiwania |
    | `limits.maxSnippetChars`  | `number` | --        | Ogranicz długość fragmentu            |
    | `limits.maxInjectedChars` | `number` | --        | Ogranicz łączną liczbę wstrzykniętych znaków |
    | `limits.timeoutMs`        | `number` | `4000`    | Limit czasu wyszukiwania              |
  </Accordion>
  <Accordion title="Zakres">
    Steruje tym, które sesje mogą otrzymywać wyniki wyszukiwania QMD. Ten sam schemat co [`session.sendPolicy`](/pl/gateway/config-agents#session):

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

    Dostarczona wartość domyślna zezwala na sesje bezpośrednie i kanałowe, nadal odmawiając grupom.

    Domyślnie tylko DM. `match.keyPrefix` dopasowuje znormalizowany klucz sesji; `match.rawKeyPrefix` dopasowuje surowy klucz wraz z `agent:<id>:`.

  </Accordion>
  <Accordion title="Cytowania">
    `memory.citations` dotyczy wszystkich backendów:

    | Wartość         | Zachowanie                                         |
    | --------------- | -------------------------------------------------- |
    | `auto` (domyślnie) | Uwzględnij stopkę `Source: <path#line>` we fragmentach |
    | `on`            | Zawsze uwzględniaj stopkę                          |
    | `off`           | Pomiń stopkę (ścieżka nadal jest wewnętrznie przekazywana agentowi) |

  </Accordion>
</AccordionGroup>

Gdy inicjalizacja QMD przy starcie Gateway jest włączona, OpenClaw uruchamia QMD tylko dla kwalifikujących się agentów. Jeśli `update.onBoot` ma wartość true i nie skonfigurowano konserwacji interwału ani osadzania, uruchomienie używa jednorazowego menedżera do odświeżenia przy starcie i zamyka go. Jeśli skonfigurowano interwał aktualizacji lub osadzania, uruchomienie otwiera długotrwałego menedżera QMD, aby mógł posiadać obserwator i liczniki interwałów; `update.onBoot: false` pomija tylko natychmiastowe odświeżenie przy starcie.

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

Dreaming działa jako jedno zaplanowane przemiatanie i używa wewnętrznych faz lekkiej/głębokiej/REM jako szczegółu implementacyjnego.

Opis zachowania koncepcyjnego i poleceń z ukośnikiem znajdziesz w [Dreaming](/pl/concepts/dreaming).

### Ustawienia użytkownika

| Klucz                                  | Typ       | Domyślnie        | Opis                                                                                                                             |
| -------------------------------------- | --------- | ---------------- | -------------------------------------------------------------------------------------------------------------------------------- |
| `enabled`                              | `boolean` | `false`          | Całkowicie włącz lub wyłącz dreaming                                                                                              |
| `frequency`                            | `string`  | `0 3 * * *`      | Opcjonalny rytm cron dla pełnego przemiatania dreaming                                                                            |
| `model`                                | `string`  | model domyślny   | Opcjonalne zastąpienie modelu subagenta Dziennika snów                                                                            |
| `phases.deep.maxPromotedSnippetTokens` | `number`  | `160`            | Maksymalna szacowana liczba tokenów zachowywanych z każdego krótkoterminowego fragmentu przypomnienia promowanego do `MEMORY.md`; metadane pochodzenia pozostają widoczne |

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
- Dreaming zapisuje stan maszyny w `memory/.dreams/`.
- Dreaming zapisuje czytelne dla człowieka dane narracyjne wyjściowe w `DREAMS.md` (lub istniejącym `dreams.md`).
- `dreaming.model` używa istniejącej bramki zaufania subagenta Plugin; ustaw `plugins.entries.memory-core.subagent.allowModelOverride: true` przed jej włączeniem.
- Dziennik snów ponawia próbę raz z domyślnym modelem sesji, gdy skonfigurowany model jest niedostępny. Niepowodzenia zaufania lub listy dozwolonych są rejestrowane i nie są po cichu ponawiane.
- Zasady i progi faz lekkiej/głębokiej/REM są zachowaniem wewnętrznym, a nie konfiguracją przeznaczoną dla użytkownika.

</Note>

## Powiązane

- [Dokumentacja konfiguracji](/pl/gateway/configuration-reference)
- [Omówienie pamięci](/pl/concepts/memory)
- [Wyszukiwanie w pamięci](/pl/concepts/memory-search)
