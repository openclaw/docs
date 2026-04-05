---
read_when:
    - Chcesz skonfigurować dostawców wyszukiwania pamięci lub modele embeddingów
    - Chcesz skonfigurować backend QMD
    - Chcesz dostroić wyszukiwanie hybrydowe, MMR lub zanikanie czasowe
    - Chcesz włączyć multimodalne indeksowanie pamięci
summary: Wszystkie opcje konfiguracji wyszukiwania pamięci, dostawców embeddingów, QMD, wyszukiwania hybrydowego i indeksowania multimodalnego
title: Dokumentacja konfiguracji pamięci
x-i18n:
    generated_at: "2026-04-05T14:05:18Z"
    model: gpt-5.4
    provider: openai
    source_hash: 89e4c9740f71f5a47fc5e163742339362d6b95cb4757650c0c8a095cf3078caa
    source_path: reference/memory-config.md
    workflow: 15
---

# Dokumentacja konfiguracji pamięci

Ta strona zawiera wszystkie opcje konfiguracji wyszukiwania pamięci w OpenClaw. Aby zapoznać się z omówieniami koncepcyjnymi, zobacz:

- [Przegląd pamięci](/pl/concepts/memory) -- jak działa pamięć
- [Wbudowany silnik](/pl/concepts/memory-builtin) -- domyślny backend SQLite
- [Silnik QMD](/pl/concepts/memory-qmd) -- sidecar działający lokalnie
- [Wyszukiwanie pamięci](/pl/concepts/memory-search) -- potok wyszukiwania i strojenie

Wszystkie ustawienia wyszukiwania pamięci znajdują się w `agents.defaults.memorySearch` w pliku
`openclaw.json`, o ile nie zaznaczono inaczej.

---

## Wybór dostawcy

| Klucz      | Typ       | Domyślnie       | Opis                                                                             |
| ---------- | --------- | --------------- | -------------------------------------------------------------------------------- |
| `provider` | `string`  | wykrywany automatycznie | Identyfikator adaptera embeddingów: `openai`, `gemini`, `voyage`, `mistral`, `ollama`, `local` |
| `model`    | `string`  | domyślny dostawcy | Nazwa modelu embeddingów                                                        |
| `fallback` | `string`  | `"none"`        | Identyfikator adaptera zapasowego, gdy główny zawiedzie                         |
| `enabled`  | `boolean` | `true`          | Włącza lub wyłącza wyszukiwanie pamięci                                         |

### Kolejność automatycznego wykrywania

Gdy `provider` nie jest ustawiony, OpenClaw wybiera pierwszy dostępny:

1. `local` -- jeśli skonfigurowano `memorySearch.local.modelPath` i plik istnieje.
2. `openai` -- jeśli można rozwiązać klucz OpenAI.
3. `gemini` -- jeśli można rozwiązać klucz Gemini.
4. `voyage` -- jeśli można rozwiązać klucz Voyage.
5. `mistral` -- jeśli można rozwiązać klucz Mistral.

`ollama` jest obsługiwana, ale nie jest wykrywana automatycznie (ustaw ją jawnie).

### Rozpoznawanie klucza API

Zdalne embeddingi wymagają klucza API. OpenClaw rozpoznaje go z:
profili auth, `models.providers.*.apiKey` lub zmiennych środowiskowych.

| Dostawca | Zmienna środowiskowa          | Klucz konfiguracji                 |
| -------- | ----------------------------- | ---------------------------------- |
| OpenAI   | `OPENAI_API_KEY`              | `models.providers.openai.apiKey`   |
| Gemini   | `GEMINI_API_KEY`              | `models.providers.google.apiKey`   |
| Voyage   | `VOYAGE_API_KEY`              | `models.providers.voyage.apiKey`   |
| Mistral  | `MISTRAL_API_KEY`             | `models.providers.mistral.apiKey`  |
| Ollama   | `OLLAMA_API_KEY` (placeholder) | --                                |

Codex OAuth obejmuje tylko chat/completions i nie spełnia wymagań żądań
embeddingów.

---

## Konfiguracja zdalnego punktu końcowego

Dla niestandardowych punktów końcowych zgodnych z OpenAI lub nadpisania ustawień domyślnych dostawcy:

| Klucz             | Typ      | Opis                                               |
| ----------------- | -------- | -------------------------------------------------- |
| `remote.baseUrl`  | `string` | Niestandardowy bazowy URL API                      |
| `remote.apiKey`   | `string` | Nadpisanie klucza API                              |
| `remote.headers`  | `object` | Dodatkowe nagłówki HTTP (scalane z domyślnymi dostawcy) |

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
Zmiana modelu lub `outputDimensionality` powoduje automatyczne pełne ponowne indeksowanie.
</Warning>

---

## Konfiguracja lokalnych embeddingów

| Klucz                  | Typ      | Domyślnie              | Opis                               |
| ---------------------- | -------- | ---------------------- | ---------------------------------- |
| `local.modelPath`      | `string` | pobierany automatycznie | Ścieżka do pliku modelu GGUF      |
| `local.modelCacheDir`  | `string` | domyślne node-llama-cpp | Katalog cache dla pobranych modeli |

Model domyślny: `embeddinggemma-300m-qat-Q8_0.gguf` (~0.6 GB, pobierany automatycznie).
Wymaga natywnego buildu: `pnpm approve-builds`, a następnie `pnpm rebuild node-llama-cpp`.

---

## Konfiguracja wyszukiwania hybrydowego

Wszystko w `memorySearch.query.hybrid`:

| Klucz                | Typ       | Domyślnie | Opis                               |
| -------------------- | --------- | --------- | ---------------------------------- |
| `enabled`            | `boolean` | `true`    | Włącza hybrydowe wyszukiwanie BM25 + wektorowe |
| `vectorWeight`       | `number`  | `0.7`     | Waga dla wyników wektorowych (0-1) |
| `textWeight`         | `number`  | `0.3`     | Waga dla wyników BM25 (0-1)        |
| `candidateMultiplier`| `number`  | `4`       | Mnożnik rozmiaru puli kandydatów   |

### MMR (różnorodność)

| Klucz         | Typ       | Domyślnie | Opis                                  |
| ------------- | --------- | --------- | ------------------------------------- |
| `mmr.enabled` | `boolean` | `false`   | Włącza ponowne rankingowanie MMR      |
| `mmr.lambda`  | `number`  | `0.7`     | 0 = maks. różnorodność, 1 = maks. trafność |

### Zanikanie czasowe (świeżość)

| Klucz                       | Typ       | Domyślnie | Opis                              |
| --------------------------- | --------- | --------- | --------------------------------- |
| `temporalDecay.enabled`     | `boolean` | `false`   | Włącza premiowanie świeżości      |
| `temporalDecay.halfLifeDays`| `number`  | `30`      | Wynik zmniejsza się o połowę co N dni |

Pliki evergreen (`MEMORY.md`, pliki bez daty w `memory/`) nigdy nie podlegają zanikaniu.

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

| Klucz       | Typ        | Opis                                      |
| ----------- | ---------- | ----------------------------------------- |
| `extraPaths`| `string[]` | Dodatkowe katalogi lub pliki do indeksowania |

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

Ścieżki mogą być bezwzględne lub względne względem workspace. Katalogi są skanowane
rekurencyjnie w poszukiwaniu plików `.md`. Obsługa symlinków zależy od aktywnego backendu:
wbudowany silnik ignoruje symlinki, a QMD podąża za zachowaniem skanera QMD.

Do wyszukiwania transkryptów między agentami w zakresie konkretnego agenta użyj
`agents.list[].memorySearch.qmd.extraCollections` zamiast `memory.qmd.paths`.
Te dodatkowe kolekcje mają ten sam kształt `{ path, name, pattern? }`, ale
są scalane per agent i mogą zachowywać jawne wspólne nazwy, gdy ścieżka
wskazuje poza bieżący workspace.
Jeśli ta sama rozpoznana ścieżka pojawi się zarówno w `memory.qmd.paths`, jak i
`memorySearch.qmd.extraCollections`, QMD zachowuje pierwszy wpis i pomija
duplikat.

---

## Pamięć multimodalna (Gemini)

Indeksuj obrazy i audio obok Markdown przy użyciu Gemini Embedding 2:

| Klucz                      | Typ        | Domyślnie  | Opis                                 |
| -------------------------- | ---------- | ---------- | ------------------------------------ |
| `multimodal.enabled`       | `boolean`  | `false`    | Włącza indeksowanie multimodalne     |
| `multimodal.modalities`    | `string[]` | --         | `["image"]`, `["audio"]` lub `["all"]` |
| `multimodal.maxFileBytes`  | `number`   | `10000000` | Maksymalny rozmiar pliku do indeksowania |

Dotyczy tylko plików w `extraPaths`. Domyślne korzenie pamięci pozostają tylko dla Markdown.
Wymaga `gemini-embedding-2-preview`. `fallback` musi mieć wartość `"none"`.

Obsługiwane formaty: `.jpg`, `.jpeg`, `.png`, `.webp`, `.gif`, `.heic`, `.heif`
(obrazy); `.mp3`, `.wav`, `.ogg`, `.opus`, `.m4a`, `.aac`, `.flac` (audio).

---

## Cache embeddingów

| Klucz              | Typ       | Domyślnie | Opis                              |
| ------------------ | --------- | --------- | --------------------------------- |
| `cache.enabled`    | `boolean` | `false`   | Cache embeddingów chunków w SQLite |
| `cache.maxEntries` | `number`  | `50000`   | Maksymalna liczba zapisanych embeddingów |

Zapobiega ponownemu tworzeniu embeddingów dla niezmienionego tekstu podczas ponownego indeksowania lub aktualizacji transkryptów.

---

## Indeksowanie wsadowe

| Klucz                        | Typ       | Domyślnie | Opis                         |
| ---------------------------- | --------- | --------- | ---------------------------- |
| `remote.batch.enabled`       | `boolean` | `false`   | Włącza API embeddingów wsadowych |
| `remote.batch.concurrency`   | `number`  | `2`       | Równoległe zadania wsadowe   |
| `remote.batch.wait`          | `boolean` | `true`    | Czeka na zakończenie wsadu   |
| `remote.batch.pollIntervalMs`| `number`  | --        | Interwał odpytywania         |
| `remote.batch.timeoutMinutes`| `number`  | --        | Limit czasu wsadu            |

Dostępne dla `openai`, `gemini` i `voyage`. Wsadowe API OpenAI jest zwykle
najszybsze i najtańsze przy dużych backfillach.

---

## Wyszukiwanie pamięci sesji (eksperymentalne)

Indeksuj transkrypty sesji i udostępniaj je przez `memory_search`:

| Klucz                        | Typ        | Domyślnie    | Opis                                    |
| ---------------------------- | ---------- | ------------ | --------------------------------------- |
| `experimental.sessionMemory` | `boolean`  | `false`      | Włącza indeksowanie sesji               |
| `sources`                    | `string[]` | `["memory"]` | Dodaj `"sessions"`, aby uwzględnić transkrypty |
| `sync.sessions.deltaBytes`   | `number`   | `100000`     | Próg bajtów do ponownego indeksowania   |
| `sync.sessions.deltaMessages`| `number`   | `50`         | Próg wiadomości do ponownego indeksowania |

Indeksowanie sesji jest opcjonalne i działa asynchronicznie. Wyniki mogą być nieco
nieaktualne. Logi sesji są przechowywane na dysku, więc granicą zaufania
jest dostęp do systemu plików.

---

## Akceleracja wektorowa SQLite (sqlite-vec)

| Klucz                       | Typ       | Domyślnie | Opis                               |
| --------------------------- | --------- | --------- | ---------------------------------- |
| `store.vector.enabled`      | `boolean` | `true`    | Używa sqlite-vec do zapytań wektorowych |
| `store.vector.extensionPath`| `string`  | wbudowana | Nadpisuje ścieżkę sqlite-vec       |

Gdy sqlite-vec jest niedostępne, OpenClaw automatycznie wraca do
podobieństwa cosinusowego w procesie.

---

## Przechowywanie indeksu

| Klucz                | Typ      | Domyślnie                              | Opis                                       |
| -------------------- | -------- | -------------------------------------- | ------------------------------------------ |
| `store.path`         | `string` | `~/.openclaw/memory/{agentId}.sqlite`  | Lokalizacja indeksu (obsługuje token `{agentId}`) |
| `store.fts.tokenizer`| `string` | `unicode61`                            | Tokenizer FTS5 (`unicode61` lub `trigram`) |

---

## Konfiguracja backendu QMD

Ustaw `memory.backend = "qmd"`, aby włączyć. Wszystkie ustawienia QMD znajdują się w
`memory.qmd`:

| Klucz                    | Typ       | Domyślnie | Opis                                         |
| ------------------------ | --------- | --------- | -------------------------------------------- |
| `command`                | `string`  | `qmd`     | Ścieżka do pliku wykonywalnego QMD           |
| `searchMode`             | `string`  | `search`  | Polecenie wyszukiwania: `search`, `vsearch`, `query` |
| `includeDefaultMemory`   | `boolean` | `true`    | Automatycznie indeksuje `MEMORY.md` + `memory/**/*.md` |
| `paths[]`                | `array`   | --        | Dodatkowe ścieżki: `{ name, path, pattern? }` |
| `sessions.enabled`       | `boolean` | `false`   | Indeksuje transkrypty sesji                  |
| `sessions.retentionDays` | `number`  | --        | Retencja transkryptów                        |
| `sessions.exportDir`     | `string`  | --        | Katalog eksportu                             |

### Harmonogram aktualizacji

| Klucz                    | Typ       | Domyślnie | Opis                                  |
| ------------------------ | --------- | --------- | ------------------------------------- |
| `update.interval`        | `string`  | `5m`      | Interwał odświeżania                  |
| `update.debounceMs`      | `number`  | `15000`   | Debounce zmian w plikach              |
| `update.onBoot`          | `boolean` | `true`    | Odświeżanie przy uruchomieniu         |
| `update.waitForBootSync` | `boolean` | `false`   | Blokuje uruchomienie do zakończenia odświeżania |
| `update.embedInterval`   | `string`  | --        | Oddzielny harmonogram embeddingów     |
| `update.commandTimeoutMs`| `number`  | --        | Limit czasu dla poleceń QMD           |
| `update.updateTimeoutMs` | `number`  | --        | Limit czasu dla operacji aktualizacji QMD |
| `update.embedTimeoutMs`  | `number`  | --        | Limit czasu dla operacji embeddingów QMD |

### Limity

| Klucz                    | Typ      | Domyślnie | Opis                             |
| ------------------------ | -------- | --------- | -------------------------------- |
| `limits.maxResults`      | `number` | `6`       | Maksymalna liczba wyników wyszukiwania |
| `limits.maxSnippetChars` | `number` | --        | Ogranicza długość fragmentu      |
| `limits.maxInjectedChars`| `number` | --        | Ogranicza łączną liczbę wstrzykniętych znaków |
| `limits.timeoutMs`       | `number` | `4000`    | Limit czasu wyszukiwania         |

### Zakres

Kontroluje, które sesje mogą otrzymywać wyniki wyszukiwania QMD. Ten sam schemat co
[`session.sendPolicy`](/pl/gateway/configuration-reference#session):

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

Domyślnie tylko DM. `match.keyPrefix` dopasowuje znormalizowany klucz sesji;
`match.rawKeyPrefix` dopasowuje surowy klucz zawierający `agent:<id>:`.

### Cytowania

`memory.citations` dotyczy wszystkich backendów:

| Wartość         | Zachowanie                                         |
| --------------- | -------------------------------------------------- |
| `auto` (domyślnie) | Dołącza stopkę `Source: <path#line>` do fragmentów |
| `on`            | Zawsze dołącza stopkę                              |
| `off`           | Pomija stopkę (ścieżka nadal jest przekazywana wewnętrznie do agenta) |

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

## Dreaming (eksperymentalne)

Dreaming konfiguruje się w `plugins.entries.memory-core.config.dreaming`,
a nie w `agents.defaults.memorySearch`. Szczegóły koncepcyjne i polecenia
czatu znajdziesz w [Dreaming](/pl/concepts/memory-dreaming).

| Klucz             | Typ      | Domyślnie      | Opis                                           |
| ----------------- | -------- | -------------- | ---------------------------------------------- |
| `mode`            | `string` | `"off"`        | Preset: `off`, `core`, `rem` lub `deep`        |
| `cron`            | `string` | domyślnie dla presetu | Nadpisanie wyrażenia cron dla harmonogramu |
| `timezone`        | `string` | strefa czasowa użytkownika | Strefa czasowa używana do obliczania harmonogramu |
| `limit`           | `number` | domyślnie dla presetu | Maksymalna liczba kandydatów do promowania na cykl |
| `minScore`        | `number` | domyślnie dla presetu | Minimalny ważony wynik do promowania       |
| `minRecallCount`  | `number` | domyślnie dla presetu | Minimalny próg liczby przywołań            |
| `minUniqueQueries`| `number` | domyślnie dla presetu | Minimalny próg liczby różnych zapytań      |

### Domyślne wartości presetów

| Tryb   | Częstotliwość   | minScore | minRecallCount | minUniqueQueries |
| ------ | --------------- | -------- | -------------- | ---------------- |
| `off`  | Wyłączone       | --       | --             | --               |
| `core` | Codziennie 3:00 | 0.75     | 3              | 2                |
| `rem`  | Co 6 godzin     | 0.85     | 4              | 3                |
| `deep` | Co 12 godzin    | 0.80     | 3              | 3                |

### Przykład

```json5
{
  plugins: {
    entries: {
      "memory-core": {
        config: {
          dreaming: {
            mode: "core",
            timezone: "America/New_York",
          },
        },
      },
    },
  },
}
```
