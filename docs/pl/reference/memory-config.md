---
read_when:
    - Chcesz skonfigurować dostawców wyszukiwania pamięci lub modele osadzania
    - Chcesz skonfigurować backend QMD
    - Chcesz dostroić wyszukiwanie hybrydowe, MMR lub zanik czasowy
    - Chcesz włączyć multimodalne indeksowanie pamięci
sidebarTitle: Memory config
summary: Wszystkie opcje konfiguracji wyszukiwania pamięci, dostawców osadzania, QMD, wyszukiwania hybrydowego i indeksowania multimodalnego
title: Dokumentacja konfiguracji pamięci
x-i18n:
    generated_at: "2026-04-26T11:40:34Z"
    model: gpt-5.4
    provider: openai
    source_hash: 15fd747abc6d0d43cfc869faa0b5e6c1618681ef3b02068207321d60d449a901
    source_path: reference/memory-config.md
    workflow: 15
---

Ta strona zawiera wszystkie opcje konfiguracji wyszukiwania pamięci w OpenClaw. Omówienia koncepcyjne znajdziesz tutaj:

<CardGroup cols={2}>
  <Card title="Przegląd pamięci" href="/pl/concepts/memory">
    Jak działa pamięć.
  </Card>
  <Card title="Wbudowany silnik" href="/pl/concepts/memory-builtin">
    Domyślny backend SQLite.
  </Card>
  <Card title="Silnik QMD" href="/pl/concepts/memory-qmd">
    Sidecar local-first.
  </Card>
  <Card title="Wyszukiwanie pamięci" href="/pl/concepts/memory-search">
    Potok wyszukiwania i dostrajanie.
  </Card>
  <Card title="Active Memory" href="/pl/concepts/active-memory">
    Podagent pamięci dla interaktywnych sesji.
  </Card>
</CardGroup>

Wszystkie ustawienia wyszukiwania pamięci znajdują się w `agents.defaults.memorySearch` w `openclaw.json`, o ile nie zaznaczono inaczej.

<Note>
Jeśli szukasz przełącznika funkcji **Active Memory** oraz konfiguracji podagenta, znajdują się one w `plugins.entries.active-memory`, a nie w `memorySearch`.

Active Memory używa modelu dwóch bramek:

1. plugin musi być włączony i kierować na bieżący identyfikator agenta
2. żądanie musi dotyczyć kwalifikującej się interaktywnej trwałej sesji czatu

Zobacz [Active Memory](/pl/concepts/active-memory), aby poznać model aktywacji, konfigurację zarządzaną przez plugin, utrwalanie transkryptów i bezpieczny wzorzec wdrażania.
</Note>

---

## Wybór dostawcy

| Klucz      | Typ       | Domyślnie       | Opis                                                                                                             |
| ---------- | --------- | --------------- | ---------------------------------------------------------------------------------------------------------------- |
| `provider` | `string`  | wykrywany automatycznie | ID adaptera osadzania: `bedrock`, `gemini`, `github-copilot`, `local`, `mistral`, `ollama`, `openai`, `voyage` |
| `model`    | `string`  | domyślny dostawcy | Nazwa modelu osadzania                                                                                         |
| `fallback` | `string`  | `"none"`        | ID adaptera zapasowego, gdy główny zawiedzie                                                                    |
| `enabled`  | `boolean` | `true`          | Włącza lub wyłącza wyszukiwanie pamięci                                                                          |

### Kolejność automatycznego wykrywania

Gdy `provider` nie jest ustawiony, OpenClaw wybiera pierwszy dostępny:

<Steps>
  <Step title="local">
    Wybierany, jeśli `memorySearch.local.modelPath` jest skonfigurowane i plik istnieje.
  </Step>
  <Step title="github-copilot">
    Wybierany, jeśli można rozwiązać token GitHub Copilot (zmienna środowiskowa lub profil uwierzytelniania).
  </Step>
  <Step title="openai">
    Wybierany, jeśli można rozwiązać klucz OpenAI.
  </Step>
  <Step title="gemini">
    Wybierany, jeśli można rozwiązać klucz Gemini.
  </Step>
  <Step title="voyage">
    Wybierany, jeśli można rozwiązać klucz Voyage.
  </Step>
  <Step title="mistral">
    Wybierany, jeśli można rozwiązać klucz Mistral.
  </Step>
  <Step title="bedrock">
    Wybierany, jeśli łańcuch poświadczeń AWS SDK zostanie rozwiązany (rola instancji, klucze dostępu, profil, SSO, web identity lub współdzielona konfiguracja).
  </Step>
</Steps>

`ollama` jest obsługiwane, ale nie jest wykrywane automatycznie (ustaw je jawnie).

### Rozwiązywanie klucza API

Zdalne osadzanie wymaga klucza API. Bedrock zamiast tego używa domyślnego łańcucha poświadczeń AWS SDK (role instancji, SSO, klucze dostępu).

| Dostawca       | Zmienna środowiskowa                              | Klucz konfiguracji                |
| -------------- | ------------------------------------------------ | --------------------------------- |
| Bedrock        | łańcuch poświadczeń AWS                          | Klucz API nie jest wymagany       |
| Gemini         | `GEMINI_API_KEY`                                 | `models.providers.google.apiKey`  |
| GitHub Copilot | `COPILOT_GITHUB_TOKEN`, `GH_TOKEN`, `GITHUB_TOKEN` | Profil uwierzytelniania przez device login |
| Mistral        | `MISTRAL_API_KEY`                                | `models.providers.mistral.apiKey` |
| Ollama         | `OLLAMA_API_KEY` (placeholder)                   | --                                |
| OpenAI         | `OPENAI_API_KEY`                                 | `models.providers.openai.apiKey`  |
| Voyage         | `VOYAGE_API_KEY`                                 | `models.providers.voyage.apiKey`  |

<Note>
OAuth Codex obejmuje tylko chat/completions i nie spełnia wymagań żądań osadzania.
</Note>

---

## Konfiguracja zdalnego punktu końcowego

Dla niestandardowych punktów końcowych zgodnych z OpenAI lub nadpisywania domyślnych ustawień dostawcy:

<ParamField path="remote.baseUrl" type="string">
  Niestandardowy bazowy URL API.
</ParamField>
<ParamField path="remote.apiKey" type="string">
  Nadpisuje klucz API.
</ParamField>
<ParamField path="remote.headers" type="object">
  Dodatkowe nagłówki HTTP (łączone z domyślnymi ustawieniami dostawcy).
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
    | Klucz                  | Typ      | Domyślnie             | Opis                                       |
    | ---------------------- | -------- | --------------------- | ------------------------------------------ |
    | `model`                | `string` | `gemini-embedding-001` | Obsługuje także `gemini-embedding-2-preview` |
    | `outputDimensionality` | `number` | `3072`                | Dla Embedding 2: 768, 1536 lub 3072        |

    <Warning>
    Zmiana modelu lub `outputDimensionality` powoduje automatyczne pełne ponowne indeksowanie.
    </Warning>

  </Accordion>
  <Accordion title="Bedrock">
    Bedrock używa domyślnego łańcucha poświadczeń AWS SDK — klucze API nie są potrzebne. Jeśli OpenClaw działa na EC2 z rolą instancji z włączonym Bedrock, po prostu ustaw dostawcę i model:

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
    | `outputDimensionality` | `number` | domyślnie dla modelu          | Dla Titan V2: 256, 512 lub 1024 |

    **Obsługiwane modele** (z wykrywaniem rodziny i domyślnymi wymiarami):

    | ID modelu                                  | Dostawca   | Domyślne wymiary | Konfigurowalne wymiary |
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

    Warianty z sufiksem przepustowości (na przykład `amazon.titan-embed-text-v1:2:8k`) dziedziczą konfigurację modelu bazowego.

    **Uwierzytelnianie:** uwierzytelnianie Bedrock używa standardowej kolejności rozwiązywania poświadczeń AWS SDK:

    1. Zmienne środowiskowe (`AWS_ACCESS_KEY_ID` + `AWS_SECRET_ACCESS_KEY`)
    2. Pamięć podręczna tokenów SSO
    3. Poświadczenia tokenu web identity
    4. Współdzielone pliki poświadczeń i konfiguracji
    5. Poświadczenia metadanych ECS lub EC2

    Region jest rozwiązywany z `AWS_REGION`, `AWS_DEFAULT_REGION`, `baseUrl` dostawcy `amazon-bedrock` albo domyślnie przyjmuje wartość `us-east-1`.

    **Uprawnienia IAM:** rola lub użytkownik IAM potrzebuje:

    ```json
    {
      "Effect": "Allow",
      "Action": "bedrock:InvokeModel",
      "Resource": "*"
    }
    ```

    Aby zastosować zasadę najmniejszych uprawnień, ogranicz `InvokeModel` do konkretnego modelu:

    ```
    arn:aws:bedrock:*::foundation-model/amazon.titan-embed-text-v2:0
    ```

  </Accordion>
  <Accordion title="Local (GGUF + node-llama-cpp)">
    | Klucz                 | Typ                | Domyślnie             | Opis                                                                                                                                                                                                                                                                                                              |
    | --------------------- | ------------------ | --------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
    | `local.modelPath`     | `string`           | pobierany automatycznie | Ścieżka do pliku modelu GGUF                                                                                                                                                                                                                                                                                     |
    | `local.modelCacheDir` | `string`           | domyślnie dla node-llama-cpp | Katalog pamięci podręcznej dla pobranych modeli                                                                                                                                                                                                                                                                 |
    | `local.contextSize`   | `number \| "auto"` | `4096`                | Rozmiar okna kontekstu dla kontekstu osadzania. 4096 obejmuje typowe fragmenty (128–512 tokenów), jednocześnie ograniczając VRAM niezwiązany z wagami. Na hostach z ograniczonymi zasobami zmniejsz do 1024–2048. `"auto"` używa maksymalnej wartości wytrenowanej dla modelu — niezalecane dla modeli 8B+ (Qwen3-Embedding-8B: 40 960 tokenów → ~32 GB VRAM vs ~8.8 GB przy 4096). |

    Model domyślny: `embeddinggemma-300m-qat-Q8_0.gguf` (~0.6 GB, pobierany automatycznie). Wymaga natywnego buildu: `pnpm approve-builds`, a następnie `pnpm rebuild node-llama-cpp`.

    Użyj samodzielnego CLI, aby zweryfikować tę samą ścieżkę dostawcy, której używa Gateway:

    ```bash
    openclaw memory status --deep --agent main
    openclaw memory index --force --agent main
    ```

    Jeśli `provider` ma wartość `auto`, `local` jest wybierany tylko wtedy, gdy `local.modelPath` wskazuje na istniejący plik lokalny. Odwołania do modeli `hf:` i HTTP(S) nadal mogą być używane jawnie z `provider: "local"`, ale nie powodują, że `auto` wybierze local, zanim model będzie dostępny na dysku.

  </Accordion>
</AccordionGroup>

### Limit czasu osadzania inline

<ParamField path="sync.embeddingBatchTimeoutSeconds" type="number">
  Nadpisuje limit czasu dla wsadowych operacji osadzania inline podczas indeksowania pamięci.

Brak ustawienia używa domyślnej wartości dostawcy: 600 sekund dla dostawców lokalnych/self-hosted, takich jak `local`, `ollama` i `lmstudio`, oraz 120 sekund dla dostawców hostowanych. Zwiększ tę wartość, jeśli lokalne wsady osadzania obciążające CPU działają poprawnie, ale są wolne.
</ParamField>

---

## Konfiguracja wyszukiwania hybrydowego

Wszystko w `memorySearch.query.hybrid`:

| Klucz                 | Typ       | Domyślnie | Opis                               |
| --------------------- | --------- | --------- | ---------------------------------- |
| `enabled`             | `boolean` | `true`    | Włącza wyszukiwanie hybrydowe BM25 + wektorowe |
| `vectorWeight`        | `number`  | `0.7`     | Waga dla wyników wektorowych (0-1) |
| `textWeight`          | `number`  | `0.3`     | Waga dla wyników BM25 (0-1)        |
| `candidateMultiplier` | `number`  | `4`       | Mnożnik rozmiaru puli kandydatów   |

<Tabs>
  <Tab title="MMR (różnorodność)">
    | Klucz         | Typ       | Domyślnie | Opis                                 |
    | ------------- | --------- | --------- | ------------------------------------ |
    | `mmr.enabled` | `boolean` | `false`   | Włącza ponowne rangowanie MMR        |
    | `mmr.lambda`  | `number`  | `0.7`     | 0 = maksymalna różnorodność, 1 = maksymalna trafność |
  </Tab>
  <Tab title="Zanik czasowy (świeżość)">
    | Klucz                        | Typ       | Domyślnie | Opis                          |
    | ---------------------------- | --------- | --------- | ----------------------------- |
    | `temporalDecay.enabled`      | `boolean` | `false`   | Włącza wzmocnienie świeżości  |
    | `temporalDecay.halfLifeDays` | `number`  | `30`      | Wynik spada o połowę co N dni |

    Pliki evergreen (`MEMORY.md`, pliki bez daty w `memory/`) nigdy nie podlegają zanikowi.

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

| Klucz       | Typ        | Opis                                     |
| ----------- | ---------- | ---------------------------------------- |
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

Ścieżki mogą być bezwzględne lub względne względem obszaru roboczego. Katalogi są skanowane rekursywnie w poszukiwaniu plików `.md`. Obsługa dowiązań symbolicznych zależy od aktywnego backendu: wbudowany silnik ignoruje dowiązania symboliczne, a QMD podąża za zachowaniem bazowego skanera QMD.

Do wyszukiwania transkryptów między agentami w zakresie agenta użyj `agents.list[].memorySearch.qmd.extraCollections` zamiast `memory.qmd.paths`. Te dodatkowe kolekcje mają ten sam kształt `{ path, name, pattern? }`, ale są scalane dla każdego agenta i mogą zachować jawne współdzielone nazwy, gdy ścieżka wskazuje poza bieżący obszar roboczy. Jeśli ta sama rozwiązana ścieżka pojawi się zarówno w `memory.qmd.paths`, jak i w `memorySearch.qmd.extraCollections`, QMD zachowa pierwszy wpis i pominie duplikat.

---

## Pamięć multimodalna (Gemini)

Indeksuj obrazy i dźwięk razem z Markdown przy użyciu Gemini Embedding 2:

| Klucz                     | Typ        | Domyślnie  | Opis                                  |
| ------------------------- | ---------- | ---------- | ------------------------------------- |
| `multimodal.enabled`      | `boolean`  | `false`    | Włącza indeksowanie multimodalne      |
| `multimodal.modalities`   | `string[]` | --         | `["image"]`, `["audio"]` lub `["all"]` |
| `multimodal.maxFileBytes` | `number`   | `10000000` | Maksymalny rozmiar pliku do indeksowania |

<Note>
Dotyczy tylko plików w `extraPaths`. Domyślne korzenie pamięci pozostają tylko dla Markdown. Wymaga `gemini-embedding-2-preview`. `fallback` musi mieć wartość `"none"`.
</Note>

Obsługiwane formaty: `.jpg`, `.jpeg`, `.png`, `.webp`, `.gif`, `.heic`, `.heif` (obrazy); `.mp3`, `.wav`, `.ogg`, `.opus`, `.m4a`, `.aac`, `.flac` (dźwięk).

---

## Pamięć podręczna osadzania

| Klucz             | Typ       | Domyślnie | Opis                             |
| ----------------- | --------- | --------- | -------------------------------- |
| `cache.enabled`   | `boolean` | `false`   | Buforuje osadzania fragmentów w SQLite |
| `cache.maxEntries` | `number` | `50000`   | Maksymalna liczba buforowanych osadzań |

Zapobiega ponownemu osadzaniu niezmienionego tekstu podczas ponownego indeksowania lub aktualizacji transkryptu.

---

## Indeksowanie wsadowe

| Klucz                        | Typ       | Domyślnie | Opis                          |
| ---------------------------- | --------- | --------- | ----------------------------- |
| `remote.batch.enabled`       | `boolean` | `false`   | Włącza API osadzania wsadowego |
| `remote.batch.concurrency`   | `number`  | `2`       | Równoległe zadania wsadowe    |
| `remote.batch.wait`          | `boolean` | `true`    | Czeka na ukończenie wsadu     |
| `remote.batch.pollIntervalMs` | `number` | --        | Interwał odpytywania          |
| `remote.batch.timeoutMinutes` | `number` | --        | Limit czasu wsadu             |

Dostępne dla `openai`, `gemini` i `voyage`. Batch OpenAI jest zwykle najszybszy i najtańszy przy dużych uzupełnieniach wstecznych.

To ustawienie jest oddzielne od `sync.embeddingBatchTimeoutSeconds`, które kontroluje wywołania osadzania inline używane przez dostawców lokalnych/self-hosted oraz dostawców hostowanych, gdy wsadowe API dostawcy nie są aktywne.

---

## Wyszukiwanie pamięci sesji (eksperymentalne)

Indeksuj transkrypty sesji i udostępniaj je przez `memory_search`:

| Klucz                       | Typ        | Domyślnie    | Opis                                      |
| --------------------------- | ---------- | ------------ | ----------------------------------------- |
| `experimental.sessionMemory` | `boolean` | `false`      | Włącza indeksowanie sesji                 |
| `sources`                   | `string[]` | `["memory"]` | Dodaj `"sessions"`, aby uwzględnić transkrypty |
| `sync.sessions.deltaBytes`  | `number`   | `100000`     | Próg bajtów dla ponownego indeksowania    |
| `sync.sessions.deltaMessages` | `number` | `50`         | Próg wiadomości dla ponownego indeksowania |

<Warning>
Indeksowanie sesji jest funkcją typu opt-in i działa asynchronicznie. Wyniki mogą być nieco nieaktualne. Logi sesji są przechowywane na dysku, więc granicą zaufania jest dostęp do systemu plików.
</Warning>

---

## Akceleracja wektorowa SQLite (sqlite-vec)

| Klucz                       | Typ       | Domyślnie | Opis                                |
| --------------------------- | --------- | --------- | ----------------------------------- |
| `store.vector.enabled`      | `boolean` | `true`    | Używa sqlite-vec do zapytań wektorowych |
| `store.vector.extensionPath` | `string` | bundled   | Nadpisuje ścieżkę sqlite-vec        |

Gdy sqlite-vec jest niedostępne, OpenClaw automatycznie przełącza się na podobieństwo cosinusowe w procesie.

---

## Przechowywanie indeksu

| Klucz                | Typ      | Domyślnie                             | Opis                                        |
| -------------------- | -------- | ------------------------------------- | ------------------------------------------- |
| `store.path`         | `string` | `~/.openclaw/memory/{agentId}.sqlite` | Lokalizacja indeksu (obsługuje token `{agentId}`) |
| `store.fts.tokenizer` | `string` | `unicode61`                          | Tokenizer FTS5 (`unicode61` lub `trigram`)  |

---

## Konfiguracja backendu QMD

Ustaw `memory.backend = "qmd"`, aby włączyć. Wszystkie ustawienia QMD znajdują się w `memory.qmd`:

| Klucz                    | Typ       | Domyślnie | Opis                                         |
| ------------------------ | --------- | --------- | -------------------------------------------- |
| `command`                | `string`  | `qmd`     | Ścieżka do pliku wykonywalnego QMD           |
| `searchMode`             | `string`  | `search`  | Polecenie wyszukiwania: `search`, `vsearch`, `query` |
| `includeDefaultMemory`   | `boolean` | `true`    | Automatycznie indeksuje `MEMORY.md` + `memory/**/*.md` |
| `paths[]`                | `array`   | --        | Dodatkowe ścieżki: `{ name, path, pattern? }` |
| `sessions.enabled`       | `boolean` | `false`   | Indeksuje transkrypty sesji                  |
| `sessions.retentionDays` | `number`  | --        | Retencja transkryptów                        |
| `sessions.exportDir`     | `string`  | --        | Katalog eksportu                             |

OpenClaw preferuje bieżące kształty kolekcji QMD i zapytań MCP, ale zachowuje zgodność ze starszymi wersjami QMD, przechodząc w razie potrzeby na starsze flagi kolekcji `--mask` oraz starsze nazwy narzędzi MCP.

<Note>
Nadpisania modeli QMD pozostają po stronie QMD, a nie w konfiguracji OpenClaw. Jeśli chcesz globalnie nadpisać modele QMD, ustaw zmienne środowiskowe takie jak `QMD_EMBED_MODEL`, `QMD_RERANK_MODEL` i `QMD_GENERATE_MODEL` w środowisku uruchomieniowym Gateway.
</Note>

<AccordionGroup>
  <Accordion title="Harmonogram aktualizacji">
    | Klucz                    | Typ       | Domyślnie | Opis                                      |
    | ------------------------ | --------- | --------- | ----------------------------------------- |
    | `update.interval`        | `string`  | `5m`      | Interwał odświeżania                      |
    | `update.debounceMs`      | `number`  | `15000`   | Debounce zmian plików                     |
    | `update.onBoot`          | `boolean` | `true`    | Odświeża przy uruchomieniu                |
    | `update.waitForBootSync` | `boolean` | `false`   | Blokuje uruchomienie do zakończenia odświeżania |
    | `update.embedInterval`   | `string`  | --        | Oddzielna kadencja osadzania              |
    | `update.commandTimeoutMs` | `number` | --        | Limit czasu dla poleceń QMD               |
    | `update.updateTimeoutMs` | `number`  | --        | Limit czasu dla operacji aktualizacji QMD |
    | `update.embedTimeoutMs`  | `number`  | --        | Limit czasu dla operacji osadzania QMD    |
  </Accordion>
  <Accordion title="Limity">
    | Klucz                    | Typ      | Domyślnie | Opis                         |
    | ------------------------ | -------- | --------- | ---------------------------- |
    | `limits.maxResults`      | `number` | `6`       | Maksymalna liczba wyników wyszukiwania |
    | `limits.maxSnippetChars` | `number` | --        | Ogranicza długość fragmentu  |
    | `limits.maxInjectedChars` | `number` | --       | Ogranicza łączną liczbę wstrzykniętych znaków |
    | `limits.timeoutMs`       | `number` | `4000`    | Limit czasu wyszukiwania     |
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

    Dostarczona domyślna konfiguracja zezwala na sesje direct i channel, jednocześnie nadal odmawiając grupom.

    Domyślnie tylko DM. `match.keyPrefix` dopasowuje znormalizowany klucz sesji; `match.rawKeyPrefix` dopasowuje surowy klucz wraz z `agent:<id>:`.

  </Accordion>
  <Accordion title="Cytowania">
    `memory.citations` dotyczy wszystkich backendów:

    | Wartość          | Zachowanie                                          |
    | ---------------- | --------------------------------------------------- |
    | `auto` (domyślnie) | Dołącza stopkę `Source: <path#line>` w fragmentach |
    | `on`             | Zawsze dołącza stopkę                               |
    | `off`            | Pomija stopkę (ścieżka nadal jest przekazywana wewnętrznie do agenta) |

  </Accordion>
</AccordionGroup>

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

Dreaming jest konfigurowane w `plugins.entries.memory-core.config.dreaming`, a nie w `agents.defaults.memorySearch`.

Dreaming działa jako jedno zaplanowane przetwarzanie i używa wewnętrznych faz light/deep/REM jako szczegółu implementacyjnego.

Informacje o zachowaniu koncepcyjnym i poleceniach slash znajdziesz w [Dreaming](/pl/concepts/dreaming).

### Ustawienia użytkownika

| Klucz      | Typ       | Domyślnie   | Opis                                              |
| ---------- | --------- | ----------- | ------------------------------------------------- |
| `enabled`  | `boolean` | `false`     | Całkowicie włącza lub wyłącza Dreaming            |
| `frequency` | `string` | `0 3 * * *` | Opcjonalna kadencja Cron dla pełnego przebiegu Dreaming |

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

<Note>
- Dreaming zapisuje stan maszyny w `memory/.dreams/`.
- Dreaming zapisuje czytelne dla człowieka narracyjne dane wyjściowe do `DREAMS.md` (lub istniejącego `dreams.md`).
- Zasady i progi faz light/deep/REM są zachowaniem wewnętrznym, a nie konfiguracją dostępną dla użytkownika.

</Note>

## Powiązane

- [Dokumentacja konfiguracji](/pl/gateway/configuration-reference)
- [Przegląd pamięci](/pl/concepts/memory)
- [Wyszukiwanie pamięci](/pl/concepts/memory-search)
