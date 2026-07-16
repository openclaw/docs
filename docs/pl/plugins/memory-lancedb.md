---
read_when:
    - Konfiguracja pluginu memory-lancedb
    - Potrzebna jest pamięć długoterminowa oparta na LanceDB z automatycznym przywoływaniem lub automatycznym przechwytywaniem
    - Używane są lokalne osadzenia zgodne z OpenAI, takie jak Ollama
sidebarTitle: Memory LanceDB
summary: Skonfiguruj oficjalny zewnętrzny plugin pamięci LanceDB, w tym lokalne osadzania zgodne z Ollama
title: Pamięć LanceDB
x-i18n:
    generated_at: "2026-07-16T18:51:23Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 786b511da4fbfd90f4c3e5be5a1aeddf5daa59036247552bd671f4bab89319f6
    source_path: plugins/memory-lancedb.md
    workflow: 16
---

`memory-lancedb` to oficjalny zewnętrzny plugin, który przechowuje pamięć długoterminową w
LanceDB z wyszukiwaniem wektorowym. Może automatycznie przywoływać odpowiednie wspomnienia przed turą
modelu i automatycznie przechwytywać ważne fakty po odpowiedzi.

Należy go używać z lokalną bazą danych wektorowych, punktem końcowym osadzania zgodnym z OpenAI lub
magazynem pamięci innym niż domyślny wbudowany backend pamięci.

## Instalacja

```bash
openclaw plugins install @openclaw/memory-lancedb
```

Plugin jest publikowany w npm; nie jest dołączony do obrazu środowiska uruchomieniowego
OpenClaw. Jego instalacja zapisuje wpis pluginu, włącza go i przełącza
`plugins.slots.memory` na `memory-lancedb`. Jeśli miejsce pamięci jest obecnie zajmowane
przez inny plugin, zostaje on wyłączony z ostrzeżeniem.

<Note>
Pluginy towarzyszące, takie jak `memory-wiki`, mogą działać równolegle z `memory-lancedb`,
ale w danym momencie tylko jeden plugin zajmuje aktywne miejsce pamięci.
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

Po zmianie konfiguracji pluginu należy ponownie uruchomić Gateway, a następnie sprawdzić, czy plugin został załadowany:

```bash
openclaw gateway restart
openclaw plugins list
```

## Konfiguracja osadzania

`embedding` jest wymagane i musi zawierać co najmniej jedno pole. `provider`
ma domyślnie wartość `openai`; `model` ma domyślnie wartość `text-embedding-3-small`.

| Pole                   | Typ           | Uwagi                                                                    |
| ---------------------- | ------------- | ------------------------------------------------------------------------ |
| `embedding.provider`   | ciąg znaków   | Identyfikator adaptera, np. `openai`, `github-copilot`, `ollama`. Domyślnie `openai`. |
| `embedding.model`      | ciąg znaków   | Domyślnie `text-embedding-3-small`.                                        |
| `embedding.apiKey`     | ciąg znaków   | Opcjonalne; obsługuje rozwijanie `${ENV_VAR}`.                               |
| `embedding.baseUrl`    | ciąg znaków   | Opcjonalne; obsługuje rozwijanie `${ENV_VAR}`.                               |
| `embedding.dimensions` | liczba całkowita (>=1) | Wymagane dla modeli spoza wbudowanej tabeli (patrz poniżej).               |

Istnieją dwie ścieżki żądań:

- **Ścieżka adaptera dostawcy** (domyślna): należy ustawić `embedding.provider` i pominąć
  `embedding.apiKey`/`embedding.baseUrl`. Plugin rozpoznaje skonfigurowany profil
  uwierzytelniania dostawcy, zmienną środowiskową lub
  `models.providers.<provider>.apiKey` za pośrednictwem tych samych adapterów
  osadzania pamięci, których używa `memory-core`. Jest to ścieżka dla `github-copilot`, `ollama`
  oraz każdego innego dołączonego dostawcy obsługującego osadzanie.
- **Ścieżka bezpośredniego klienta zgodnego z OpenAI**: należy pozostawić `embedding.provider` bez ustawienia
  (lub ustawić `"openai"`) oraz ustawić `embedding.apiKey` i `embedding.baseUrl`. Tej ścieżki należy używać
  w przypadku surowego punktu końcowego osadzania zgodnego z OpenAI, dla którego nie ma dołączonego adaptera
  dostawcy.

OAuth OpenAI Codex / ChatGPT nie jest poświadczeniem osadzania OpenAI Platform.
Do osadzania OpenAI należy używać profilu uwierzytelniania z kluczem API OpenAI, `OPENAI_API_KEY` lub
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
liczb float32 zakodowanych w base64, dlatego oba formaty odpowiedzi działają bez konfiguracji.

### Wymiary

OpenClaw ma wbudowany wymiar wyłącznie dla `text-embedding-3-small` (1536) i
`text-embedding-3-large` (3072). Każdy inny model wymaga jawnego ustawienia
`embedding.dimensions`, aby LanceDB mogło utworzyć kolumnę wektorową, na przykład
ZhiPu `embedding-3` o 2048 wymiarach:

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

## Osadzanie Ollama

Należy użyć ścieżki dołączonego adaptera dostawcy Ollama (`embedding.provider: "ollama"`).
Wywołuje ona natywny punkt końcowy `/api/embed` Ollama i przestrzega tych samych reguł uwierzytelniania oraz
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

`mxbai-embed-large` nie znajduje się we wbudowanej tabeli wymiarów, dlatego wymagane jest
`dimensions`. W przypadku małych lokalnych modeli osadzania należy obniżyć `recallMaxChars`, jeśli
lokalny serwer zwraca błędy długości kontekstu.

## Limity przywoływania i przechwytywania

| Ustawienie         | Domyślnie | Zakres                       | Dotyczy                                                    |
| ----------------- | ------- | ---------------------------- | ---------------------------------------------------------- |
| `recallMaxChars`  | `1000`  | 100-10000                    | Tekst wysyłany do API osadzania na potrzeby przywoływania. |
| `captureMaxChars` | `500`   | 100-10000                    | Długość wiadomości kwalifikującej się do automatycznego przechwytywania. |
| `customTriggers`  | `[]`    | 0-50 elementów, każdy <=100 znaków | Dosłowne frazy powodujące uwzględnienie wiadomości przez automatyczne przechwytywanie. |

`recallMaxChars` ogranicza zapytanie automatycznego przywoływania `before_prompt_build`,
narzędzie `memory_recall`, ścieżkę zapytania `memory_forget` oraz `openclaw ltm
search`. Automatyczne przywoływanie osadza najnowszą wiadomość użytkownika z tury i korzysta
z pełnego promptu tylko wtedy, gdy nie ma wiadomości użytkownika, dzięki czemu metadane
kanału i duże bloki promptu nie trafiają do żądania osadzania.

`captureMaxChars` określa, czy wiadomość użytkownika ze zdarzenia `agent_end`
danej tury jest wystarczająco krótka, aby można ją było uwzględnić w automatycznym przechwytywaniu; nie wpływa
na zapytania przywoływania.

`customTriggers` dodaje dosłowne frazy automatycznego przechwytywania bez wyrażeń regularnych. Wbudowane
wyzwalacze obejmują typowe frazy dotyczące pamięci w języku angielskim, czeskim, chińskim, japońskim i koreańskim
(`remember`, `prefer`, `记住`, `覚えて`, `기억해` i podobne).

Automatyczne przechwytywanie odrzuca również tekst wyglądający jak metadane koperty lub transportu,
ładunki wstrzykiwania promptu albo już wstrzyknięty kontekst `<relevant-memories>`
i ogranicza liczbę przechwyconych wspomnień do 3 na turę agenta.

Każde wspomnienie należy do jednego agenta. Przywoływanie, wykrywanie duplikatów, przechwytywanie,
wyświetlanie listy, surowe zapytania i usuwanie wymuszają sprawdzenie tego właściciela przed zwróceniem lub
zmodyfikowaniem wierszy. Agent z `memorySearch.enabled: false` (w `agents.list[]`
lub za pośrednictwem `agents.defaults`) nie otrzymuje również żadnego z narzędzi `memory_recall`, `memory_store`
ani `memory_forget` i nie uczestniczy w automatycznym przywoływaniu ani
przechwytywaniu, nawet gdy flagi `autoRecall`/`autoCapture` na poziomie pluginu są włączone.

## Polecenia

`memory-lancedb` rejestruje przestrzeń nazw CLI `ltm` zawsze, gdy jest zainstalowany
(nie tylko wtedy, gdy zajmuje aktywne miejsce pamięci):

```bash
openclaw ltm list [--agent <id>] [--limit <n>] [--order-by-created-at]
openclaw ltm search <query> [--agent <id>] [--limit <n>]
openclaw ltm stats [--agent <id>]
```

`ltm query` wykonuje zapytanie niewektorowe bezpośrednio względem tabeli LanceDB:

```bash
openclaw ltm query --agent research --cols id,text,createdAt --limit 20
openclaw ltm query --filter "category = 'preference'" --order-by createdAt:desc
```

| Flaga                             | Domyślnie                               | Uwagi                                                                                                                                     |
| --------------------------------- | --------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------- |
| `--agent <id>`                    | skonfigurowany agent domyślny            | Wybiera prywatną przestrzeń nazw agenta. Dostępne dla `list`, `search`, `query` i `stats`.                                                 |
| `--cols <columns>`                | `id,text,importance,category,createdAt` | Rozdzielona przecinkami lista dozwolonych kolumn.                                                                                                         |
| `--filter <condition>`            | brak                                    | Jedno porównanie względem kolumny wyjściowej, na przykład `category = 'preference'` lub `importance >= 0.8`. Wartości ciągów znaków muszą być ujęte w cudzysłowy.             |
| `--limit <n>`                     | `10`                                    | Dodatnia liczba całkowita.                                                                                                                         |
| `--order-by <column>:<asc\|desc>` | brak                                    | Sortowanie w pamięci po zastosowaniu filtra; kolumna sortowania jest automatycznie dodawana do projekcji i usuwana z wyniku, jeśli nie została zażądana. |

Agenci otrzymują trzy narzędzia z aktywnego pluginu pamięci:

- `memory_recall`: wyszukiwanie wektorowe w przechowywanych wspomnieniach.
- `memory_store`: zapis faktu, preferencji, decyzji lub encji (odrzuca tekst
  wyglądający jak ładunek wstrzykiwania promptu; pomija zapisy niemal identycznych duplikatów).
- `memory_forget`: usuwanie według `memoryId` lub `query` (automatycznie usuwa pojedyncze
  dopasowanie o wyniku powyżej 90%, w przeciwnym razie wyświetla identyfikatory kandydatów w celu ujednoznacznienia).

## Przechowywanie

Dane LanceDB są domyślnie zapisywane w `~/.openclaw/memory/lancedb`. Można to zmienić za pomocą `dbPath`:

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

Plugin utrzymuje jedną tabelę LanceDB i zapisuje znormalizowanego właściciela-agenta w każdym
wierszu. Jest to granica przechowywania, a nie filtr stosowany po wyszukiwaniu: własność agenta jest
stosowana przed rankingiem wektorowym i uwzględniana w predykatach wyświetlania listy, zapytania, zliczania oraz usuwania.
`ltm query --filter` akceptuje jedno zweryfikowane porównanie względem
publicznych kolumn wyjściowych. Magazyn tworzy to porównanie oddzielnie od
obowiązkowego predykatu właściciela, dlatego filtr nie może rozszerzyć zapytania na innego
agenta.

Bazy danych utworzone przed wprowadzeniem własności per agent nie mają wiarygodnego pochodzenia wierszy.
Podczas uaktualniania `openclaw doctor --fix` jednorazowo przypisuje te starsze wiersze
do skonfigurowanego agenta domyślnego. Dostęp w czasie działania jest bezpiecznie blokowany do czasu
ukończenia tej migracji; inni agenci nigdy nie dziedziczą starych współdzielonych wierszy.

`storageOptions` akceptuje pary klucz/wartość w postaci ciągów znaków dla backendów przechowywania LanceDB
(np. magazynu obiektów zgodnego z S3) i obsługuje rozwijanie `${ENV_VAR}`:

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

`memory-lancedb` zależy od natywnego pakietu `@lancedb/lancedb`, należącego do
pakietu pluginu (a nie do podstawowej dystrybucji OpenClaw). Uruchomienie Gateway nie naprawia
zależności pluginu; jeśli brakuje natywnej zależności lub nie można jej załadować,
należy ponownie zainstalować albo zaktualizować pakiet pluginu i ponownie uruchomić Gateway.

`@lancedb/lancedb` nie publikuje natywnej kompilacji dla `darwin-x64` (Mac
z procesorem Intel). Na tej platformie plugin rejestruje podczas ładowania komunikat,
że LanceDB jest niedostępny; należy użyć domyślnego backendu pamięci, uruchomić Gateway
na obsługiwanej platformie lub architekturze albo wyłączyć `memory-lancedb`.

## Rozwiązywanie problemów

### Długość danych wejściowych przekracza długość kontekstu

Model osadzania odrzucił zapytanie przywoływania:

```text
memory-lancedb: przywoływanie nie powiodło się: Błąd: 400 długość danych wejściowych przekracza długość kontekstu
```

Należy zmniejszyć `recallMaxChars`, a następnie ponownie uruchomić Gateway:

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

W przypadku Ollama należy również sprawdzić, czy serwer osadzania jest osiągalny
z hosta Gateway za pomocą jego natywnego punktu końcowego osadzania:

```bash
curl http://127.0.0.1:11434/api/embed \
  -H "Content-Type: application/json" \
  -d '{"model":"mxbai-embed-large","input":"hello"}'
```

### Nieobsługiwany model osadzania

Bez `embedding.dimensions` znane są tylko wbudowane wymiary osadzania OpenAI
(`text-embedding-3-small`, `text-embedding-3-large`). Dla każdego innego
modelu należy ustawić `embedding.dimensions` na rozmiar wektora zgłaszany przez ten model.

### Plugin się ładuje, ale nie pojawiają się żadne wspomnienia

Należy potwierdzić, że `plugins.slots.memory` wskazuje na `memory-lancedb`, a następnie uruchomić:

```bash
openclaw ltm stats
openclaw ltm search "recent preference"
```

Jeśli `autoCapture` jest wyłączone, plugin nadal przywołuje istniejące wspomnienia, ale
nie zapisuje automatycznie nowych. Należy użyć narzędzia `memory_store` lub włączyć
`autoCapture`.

## Powiązane

- [Omówienie pamięci](/pl/concepts/memory)
- [Active Memory](/pl/concepts/active-memory)
- [Wyszukiwanie w pamięci](/pl/concepts/memory-search)
- [Wiki pamięci](/pl/plugins/memory-wiki)
- [Ollama](/pl/providers/ollama)
