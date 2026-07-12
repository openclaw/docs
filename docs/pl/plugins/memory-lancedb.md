---
read_when:
    - Konfigurujesz Plugin memory-lancedb
    - Potrzebujesz pamięci długoterminowej opartej na LanceDB z automatycznym przywoływaniem lub przechwytywaniem danych
    - Korzystasz z lokalnych embeddingów zgodnych z OpenAI, takich jak Ollama
sidebarTitle: Memory LanceDB
summary: Skonfiguruj oficjalny zewnętrzny Plugin pamięci LanceDB, w tym lokalne osadzenia zgodne z Ollama
title: Pamięć LanceDB
x-i18n:
    generated_at: "2026-07-12T15:23:23Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: cdcf5ef7b7fbb8bf6055363d86782cfa36df193fc724406dba06c1380fd9f434
    source_path: plugins/memory-lancedb.md
    workflow: 16
---

`memory-lancedb` to oficjalny zewnętrzny plugin, który przechowuje pamięć długoterminową w
LanceDB i umożliwia wyszukiwanie wektorowe. Może automatycznie przywoływać istotne wspomnienia przed turą
modelu oraz automatycznie zapisywać ważne fakty po odpowiedzi.

Użyj go jako lokalnej wektorowej bazy danych, z punktem końcowym osadzania zgodnym z OpenAI lub
jako magazynu pamięci poza domyślnym, wbudowanym mechanizmem pamięci.

## Instalacja

```bash
openclaw plugins install @openclaw/memory-lancedb
```

Plugin jest publikowany w npm; nie jest dołączony do obrazu środowiska uruchomieniowego
OpenClaw. Instalacja zapisuje wpis pluginu, włącza go i przełącza
`plugins.slots.memory` na `memory-lancedb`. Jeśli inny plugin obecnie zajmuje
gniazdo pamięci, zostanie wyłączony z wyświetleniem ostrzeżenia.

<Note>
Pluginy towarzyszące, takie jak `memory-wiki`, mogą działać równolegle z `memory-lancedb`,
ale w danej chwili tylko jeden plugin zajmuje aktywne gniazdo pamięci.
</Note>

## Szybki start

```json5
{
  plugins: {
    slots: {
      memory: "memory-lancedb",
    },
    entries: {
      "memory-lancedb": {
        enabled: true,
        config: {
          embedding: {
            provider: "openai",
            model: "text-embedding-3-small",
          },
          autoRecall: true,
          autoCapture: false,
        },
      },
    },
  },
}
```

Po zmianie konfiguracji pluginu uruchom ponownie Gateway, a następnie sprawdź, czy został załadowany:

```bash
openclaw gateway restart
openclaw plugins list
```

## Konfiguracja osadzania

`embedding` jest wymagane i musi zawierać co najmniej jedno pole. `provider`
domyślnie ma wartość `openai`, a `model` — `text-embedding-3-small`.

| Pole                   | Typ           | Uwagi                                                                    |
| ---------------------- | ------------- | ------------------------------------------------------------------------ |
| `embedding.provider`   | ciąg znaków   | Identyfikator adaptera, np. `openai`, `github-copilot`, `ollama`. Domyślnie `openai`. |
| `embedding.model`      | ciąg znaków   | Domyślnie `text-embedding-3-small`.                                       |
| `embedding.apiKey`     | ciąg znaków   | Opcjonalne; obsługuje rozwijanie `${ENV_VAR}`.                            |
| `embedding.baseUrl`    | ciąg znaków   | Opcjonalne; obsługuje rozwijanie `${ENV_VAR}`.                            |
| `embedding.dimensions` | liczba całkowita (>=1) | Wymagane dla modeli spoza wbudowanej tabeli (patrz niżej).               |

Dostępne są dwie ścieżki żądań:

- **Ścieżka adaptera dostawcy** (domyślna): ustaw `embedding.provider` i pomiń
  `embedding.apiKey`/`embedding.baseUrl`. Plugin rozpoznaje skonfigurowany profil
  uwierzytelniania dostawcy, zmienną środowiskową lub
  `models.providers.<provider>.apiKey` za pomocą tych samych adapterów osadzania pamięci,
  których używa `memory-core`. Jest to ścieżka dla `github-copilot`, `ollama`
  i każdego innego dołączonego dostawcy obsługującego osadzanie.
- **Ścieżka bezpośredniego klienta zgodnego z OpenAI**: pozostaw `embedding.provider` bez ustawienia
  (lub ustaw `"openai"`) i ustaw `embedding.apiKey` oraz `embedding.baseUrl`. Użyj tej
  ścieżki dla bezpośredniego punktu końcowego osadzania zgodnego z OpenAI, który nie ma dołączonego
  adaptera dostawcy.

OAuth OpenAI Codex / ChatGPT nie jest poświadczeniem osadzania OpenAI Platform.
Do osadzania OpenAI użyj profilu uwierzytelniania z kluczem API OpenAI, `OPENAI_API_KEY` lub
`models.providers.openai.apiKey`. Użytkownicy korzystający wyłącznie z OAuth powinni wybrać innego
dostawcę obsługującego osadzanie, takiego jak `github-copilot` lub `ollama`.

```json5
{
  plugins: {
    entries: {
      "memory-lancedb": {
        enabled: true,
        config: {
          embedding: {
            provider: "github-copilot",
            model: "text-embedding-3-small",
          },
        },
      },
    },
  },
}
```

Niektóre punkty końcowe osadzania zgodne z OpenAI odrzucają parametr `encoding_format`;
inne go ignorują i zawsze zwracają `number[]`. `memory-lancedb`
pomija `encoding_format` w żądaniach i akceptuje odpowiedzi zarówno w postaci tablicy liczb zmiennoprzecinkowych, jak i
zakodowanych w base64 wartości float32, dzięki czemu oba formaty odpowiedzi działają bez dodatkowej konfiguracji.

### Wymiary

OpenClaw ma wbudowane wymiary tylko dla `text-embedding-3-small` (1536) i
`text-embedding-3-large` (3072). Każdy inny model wymaga jawnego ustawienia
`embedding.dimensions`, aby LanceDB mogło utworzyć kolumnę wektorową, na przykład
ZhiPu `embedding-3` z 2048 wymiarami:

```json5
{
  plugins: {
    entries: {
      "memory-lancedb": {
        enabled: true,
        config: {
          embedding: {
            apiKey: "${ZHIPU_API_KEY}",
            baseUrl: "https://open.bigmodel.cn/api/paas/v4",
            model: "embedding-3",
            dimensions: 2048,
          },
        },
      },
    },
  },
}
```

## Osadzanie za pomocą Ollama

Użyj ścieżki dołączonego adaptera dostawcy Ollama (`embedding.provider: "ollama"`).
Wywołuje ona natywny punkt końcowy Ollama `/api/embed` i stosuje te same reguły uwierzytelniania oraz
bazowego adresu URL co dostawca [Ollama](/pl/providers/ollama).

```json5
{
  plugins: {
    slots: {
      memory: "memory-lancedb",
    },
    entries: {
      "memory-lancedb": {
        enabled: true,
        config: {
          embedding: {
            provider: "ollama",
            baseUrl: "http://127.0.0.1:11434",
            model: "mxbai-embed-large",
            dimensions: 1024,
          },
          recallMaxChars: 400,
          autoRecall: true,
          autoCapture: false,
        },
      },
    },
  },
}
```

`mxbai-embed-large` nie znajduje się we wbudowanej tabeli wymiarów, dlatego `dimensions` jest
wymagane. W przypadku małych lokalnych modeli osadzania zmniejsz `recallMaxChars`, jeśli
lokalny serwer zwraca błędy długości kontekstu.

## Limity przywoływania i zapisywania

| Ustawienie         | Domyślnie | Zakres                       | Dotyczy                                                    |
| ------------------ | --------- | ---------------------------- | ---------------------------------------------------------- |
| `recallMaxChars`   | `1000`    | 100-10000                    | Tekst wysyłany do API osadzania podczas przywoływania.     |
| `captureMaxChars`  | `500`     | 100-10000                    | Długość wiadomości kwalifikująca ją do automatycznego zapisu. |
| `customTriggers`   | `[]`      | 0-50 elementów, każdy <=100 znaków | Dosłowne frazy powodujące uwzględnienie wiadomości podczas automatycznego zapisu. |

`recallMaxChars` ogranicza zapytanie automatycznego przywoływania `before_prompt_build`, narzędzie
`memory_recall`, ścieżkę zapytania `memory_forget` oraz `openclaw ltm
search`. Automatyczne przywoływanie osadza najnowszą wiadomość użytkownika z tury i
używa pełnego promptu tylko wtedy, gdy nie ma wiadomości użytkownika, dzięki czemu metadane
kanału i duże bloki promptu nie trafiają do żądania osadzania.

`captureMaxChars` określa, czy wiadomość użytkownika ze zdarzenia `agent_end`
danej tury jest wystarczająco krótka, aby uwzględnić ją w automatycznym zapisie; nie wpływa
na zapytania przywoływania.

`customTriggers` dodaje dosłowne frazy automatycznego zapisu bez wyrażeń regularnych. Wbudowane
wyzwalacze obejmują typowe angielskie, czeskie, chińskie, japońskie i koreańskie frazy
dotyczące pamięci (`remember`, `prefer`, `记住`, `覚えて`, `기억해` i podobne).

Automatyczny zapis odrzuca również tekst przypominający metadane koperty lub transportu,
ładunki wstrzykiwania promptu albo wcześniej wstrzyknięty kontekst `<relevant-memories>`
i ogranicza liczbę zapisanych wspomnień do 3 na turę agenta.

## Polecenia

`memory-lancedb` rejestruje przestrzeń nazw CLI `ltm` zawsze, gdy jest zainstalowany
(nie tylko wtedy, gdy zajmuje aktywne gniazdo pamięci):

```bash
openclaw ltm list [--limit <n>] [--order-by-created-at]
openclaw ltm search <query> [--limit <n>]
openclaw ltm stats
```

`ltm query` wykonuje zapytanie niewektorowe bezpośrednio względem tabeli LanceDB:

```bash
openclaw ltm query --cols id,text,createdAt --limit 20
openclaw ltm query --filter "category = 'preference'" --order-by createdAt:desc
```

| Flaga                             | Domyślnie                               | Uwagi                                                                                                                                     |
| --------------------------------- | --------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------- |
| `--cols <columns>`                | `id,text,importance,category,createdAt` | Rozdzielona przecinkami lista dozwolonych kolumn.                                                                                          |
| `--filter <condition>`            | brak                                    | Klauzula WHERE w stylu SQL. Maks. 200 znaków; dozwolone są tylko znaki alfanumeryczne, `_-`, odstępy oraz `='"<>!.,()%*`.                 |
| `--limit <n>`                     | `10`                                    | Dodatnia liczba całkowita.                                                                                                                 |
| `--order-by <column>:<asc\|desc>` | brak                                    | Sortowanie w pamięci po zastosowaniu filtra; kolumna sortowania jest automatycznie dodawana do projekcji i usuwana z wyniku, jeśli jej nie zażądano. |

Agenci otrzymują trzy narzędzia z aktywnego pluginu pamięci:

- `memory_recall`: wyszukiwanie wektorowe w zapisanych wspomnieniach.
- `memory_store`: zapisuje fakt, preferencję, decyzję lub jednostkę (odrzuca tekst
  przypominający ładunek wstrzykiwania promptu; pomija niemal identyczne wpisy).
- `memory_forget`: usuwa według `memoryId` lub `query` (automatycznie usuwa pojedyncze
  dopasowanie z wynikiem powyżej 90%, a w przeciwnym razie wyświetla identyfikatory kandydatów w celu ujednoznacznienia).

## Pamięć masowa

Dane LanceDB są domyślnie przechowywane w `~/.openclaw/memory/lancedb`. Zmień tę ścieżkę za pomocą `dbPath`:

```json5
{
  plugins: {
    entries: {
      "memory-lancedb": {
        enabled: true,
        config: {
          dbPath: "~/.openclaw/memory/lancedb",
          embedding: {
            apiKey: "${OPENAI_API_KEY}",
            model: "text-embedding-3-small",
          },
        },
      },
    },
  },
}
```

`storageOptions` przyjmuje pary klucz/wartość w postaci ciągów znaków dla mechanizmów pamięci masowej LanceDB
(np. obiektowej pamięci masowej zgodnej z S3) i obsługuje rozwijanie `${ENV_VAR}`:

```json5
{
  plugins: {
    entries: {
      "memory-lancedb": {
        enabled: true,
        config: {
          dbPath: "s3://memory-bucket/openclaw",
          storageOptions: {
            access_key: "${AWS_ACCESS_KEY_ID}",
            secret_key: "${AWS_SECRET_ACCESS_KEY}",
            endpoint: "${AWS_ENDPOINT_URL}",
          },
          embedding: {
            apiKey: "${OPENAI_API_KEY}",
            model: "text-embedding-3-small",
          },
        },
      },
    },
  },
}
```

## Zależności środowiska uruchomieniowego i obsługa platform

`memory-lancedb` zależy od natywnego pakietu `@lancedb/lancedb`, za który odpowiada
pakiet pluginu (a nie podstawowa dystrybucja OpenClaw). Uruchomienie Gateway nie naprawia
zależności pluginów; jeśli brakuje natywnej zależności lub nie można jej załadować,
zainstaluj ponownie albo zaktualizuj pakiet pluginu i uruchom ponownie Gateway.

`@lancedb/lancedb` nie publikuje natywnej kompilacji dla `darwin-x64` (Mac
z procesorem Intel). Na tej platformie plugin podczas ładowania zapisuje w dzienniku informację, że LanceDB jest niedostępne;
użyj domyślnego mechanizmu pamięci, uruchom Gateway na obsługiwanej
platformie lub architekturze albo wyłącz `memory-lancedb`.

## Rozwiązywanie problemów

### Długość danych wejściowych przekracza długość kontekstu

Model osadzania odrzucił zapytanie przywoływania:

```text
memory-lancedb: recall failed: Error: 400 the input length exceeds the context length
```

Zmniejsz `recallMaxChars`, a następnie uruchom ponownie Gateway:

```json5
{
  plugins: {
    entries: {
      "memory-lancedb": {
        config: {
          recallMaxChars: 400,
        },
      },
    },
  },
}
```

W przypadku Ollama sprawdź również, czy serwer osadzania jest osiągalny z hosta Gateway
przez jego natywny punkt końcowy osadzania:

```bash
curl http://127.0.0.1:11434/api/embed \
  -H "Content-Type: application/json" \
  -d '{"model":"mxbai-embed-large","input":"hello"}'
```

### Nieobsługiwany model osadzania

Bez `embedding.dimensions` znane są tylko wbudowane wymiary osadzania OpenAI
(`text-embedding-3-small`, `text-embedding-3-large`). Dla każdego innego
modelu ustaw `embedding.dimensions` na rozmiar wektora zgłaszany przez ten model.

### Plugin ładuje się, ale nie pojawiają się żadne wspomnienia

Upewnij się, że `plugins.slots.memory` wskazuje na `memory-lancedb`, a następnie uruchom:

```bash
openclaw ltm stats
openclaw ltm search "recent preference"
```

Jeśli opcja `autoCapture` jest wyłączona, Plugin nadal przywołuje istniejące wspomnienia, ale
nie zapisuje automatycznie nowych. Użyj narzędzia `memory_store` lub włącz
opcję `autoCapture`.

## Powiązane

- [Przegląd pamięci](/pl/concepts/memory)
- [Active Memory](/pl/concepts/active-memory)
- [Wyszukiwanie w pamięci](/pl/concepts/memory-search)
- [Wiki pamięci](/pl/plugins/memory-wiki)
- [Ollama](/pl/providers/ollama)
