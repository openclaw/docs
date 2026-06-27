---
read_when:
    - Konfigurujesz Plugin memory-lancedb
    - Potrzebujesz długoterminowej pamięci opartej na LanceDB z automatycznym przywoływaniem lub automatycznym przechwytywaniem
    - Używasz lokalnych embeddingów zgodnych z OpenAI, takich jak Ollama
sidebarTitle: Memory LanceDB
summary: Skonfiguruj oficjalny zewnętrzny Plugin pamięci LanceDB, w tym lokalne embeddingi zgodne z Ollama
title: Memory LanceDB
x-i18n:
    generated_at: "2026-06-27T17:55:02Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 4142a755e788418a8b9c64a6ff3a8ce3c520bd6be09b685929478ae0754f7d39
    source_path: plugins/memory-lancedb.md
    workflow: 16
---

`memory-lancedb` to oficjalny zewnętrzny Plugin pamięci, który przechowuje pamięć długoterminową w
LanceDB i używa osadzeń do odtwarzania. Może automatycznie odtwarzać istotne
wspomnienia przed turą modelu i przechwytywać ważne fakty po odpowiedzi.

Użyj go, gdy chcesz mieć lokalną wektorową bazę danych dla pamięci, potrzebujesz
punktu końcowego osadzeń zgodnego z OpenAI albo chcesz trzymać bazę pamięci poza
domyślnym wbudowanym magazynem pamięci.

## Instalacja

Zainstaluj `memory-lancedb` przed ustawieniem `plugins.slots.memory = "memory-lancedb"`:

```bash
openclaw plugins install @openclaw/memory-lancedb
```

Plugin jest publikowany w npm i nie jest dołączony do obrazu runtime OpenClaw.
Instalator zapisuje wpis Plugin i przełącza slot pamięci, gdy nie jest on
własnością żadnego innego Plugin.

<Note>
`memory-lancedb` to Plugin Active Memory. Włącz go, wybierając slot pamięci
za pomocą `plugins.slots.memory = "memory-lancedb"`. Pluginy towarzyszące, takie jak
`memory-wiki`, mogą działać obok niego, ale tylko jeden Plugin jest właścicielem aktywnego slotu pamięci.
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

Po zmianie konfiguracji Plugin uruchom ponownie Gateway:

```bash
openclaw gateway restart
```

Następnie sprawdź, czy Plugin został załadowany:

```bash
openclaw plugins list
```

## Osadzenia obsługiwane przez dostawcę

`memory-lancedb` może używać tych samych adapterów dostawców osadzeń pamięci co
`memory-core`. Ustaw `embedding.provider` i pomiń `embedding.apiKey`, aby użyć
skonfigurowanego profilu uwierzytelniania dostawcy, zmiennej środowiskowej albo
`models.providers.<provider>.apiKey`.

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
        },
      },
    },
  },
}
```

Ta ścieżka działa z profilami uwierzytelniania dostawców, które udostępniają
poświadczenia osadzeń. Na przykład GitHub Copilot może być używany, gdy profil/plan
Copilot obsługuje osadzenia:

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
            provider: "github-copilot",
            model: "text-embedding-3-small",
          },
        },
      },
    },
  },
}
```

OpenAI Codex / ChatGPT OAuth nie jest poświadczeniem osadzeń OpenAI Platform.
Dla osadzeń OpenAI użyj profilu uwierzytelniania z kluczem API OpenAI,
`OPENAI_API_KEY` albo `models.providers.openai.apiKey`. Użytkownicy korzystający wyłącznie z OAuth mogą użyć
innego dostawcy obsługującego osadzenia, takiego jak GitHub Copilot lub Ollama.

## Osadzenia Ollama

Dla osadzeń Ollama preferuj dołączonego dostawcę osadzeń Ollama. Używa on
natywnego punktu końcowego Ollama `/api/embed` i stosuje te same reguły uwierzytelniania/adresu bazowego URL co
dostawca Ollama opisany w [Ollama](/pl/providers/ollama).

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

Ustaw `dimensions` dla niestandardowych modeli osadzeń. OpenClaw zna
wymiary dla `text-embedding-3-small` i `text-embedding-3-large`; modele niestandardowe
wymagają tej wartości w konfiguracji, aby LanceDB mogło utworzyć kolumnę wektorową.

Dla małych lokalnych modeli osadzeń obniż `recallMaxChars`, jeśli widzisz błędy
długości kontekstu z lokalnego serwera.

## Dostawcy zgodni z OpenAI

Niektórzy dostawcy osadzeń zgodni z OpenAI odrzucają parametr `encoding_format`,
podczas gdy inni go ignorują i zawsze zwracają wektory `number[]`.
Dlatego `memory-lancedb` pomija `encoding_format` w żądaniach osadzeń i
akceptuje odpowiedzi w postaci tablic liczb zmiennoprzecinkowych albo odpowiedzi float32 zakodowane w base64.

Jeśli masz surowy punkt końcowy osadzeń zgodny z OpenAI, który nie ma
dołączonego adaptera dostawcy, pomiń `embedding.provider` (albo zostaw `openai`) i
ustaw `embedding.apiKey` oraz `embedding.baseUrl`. Zachowuje to bezpośrednią
ścieżkę klienta zgodnego z OpenAI.

Ustaw `embedding.dimensions` dla dostawców, których wymiary modeli nie są
wbudowane. Na przykład ZhiPu `embedding-3` używa wymiarów `2048`:

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

## Limity odtwarzania i przechwytywania

`memory-lancedb` ma dwa osobne limity tekstu:

| Ustawienie        | Domyślnie | Zakres    | Dotyczy                                                   |
| ----------------- | --------- | --------- | --------------------------------------------------------- |
| `recallMaxChars`  | `1000`    | 100-10000 | tekstu wysyłanego do API osadzeń na potrzeby odtwarzania  |
| `captureMaxChars` | `500`     | 100-10000 | długości wiadomości kwalifikującej się do automatycznego przechwycenia |
| `customTriggers`  | `[]`      | 0-50      | dosłownych fraz, które sprawiają, że automatyczne przechwytywanie rozważa wiadomość |

`recallMaxChars` steruje automatycznym odtwarzaniem, narzędziem `memory_recall`, ścieżką zapytań
`memory_forget` oraz `openclaw ltm search`. Automatyczne odtwarzanie preferuje
najnowszą wiadomość użytkownika z tury i wraca do pełnego promptu tylko wtedy, gdy
nie ma dostępnej wiadomości użytkownika. Dzięki temu metadane kanału i duże bloki promptu
nie trafiają do żądania osadzeń.

`captureMaxChars` steruje tym, czy odpowiedź jest wystarczająco krótka, aby można ją było rozważyć
do automatycznego przechwycenia. Nie ogranicza osadzeń zapytań odtwarzania.

`customTriggers` pozwala dodać dosłowne frazy automatycznego przechwytywania bez pisania
wyrażeń regularnych. Wbudowane wyzwalacze obejmują typowe frazy pamięci w języku angielskim, czeskim,
chińskim, japońskim i koreańskim.

## Polecenia

Gdy `memory-lancedb` jest aktywnym Plugin pamięci, rejestruje przestrzeń nazw CLI `ltm`:

```bash
openclaw ltm list
openclaw ltm search "project preferences"
openclaw ltm stats
```

Podpolecenie `query` uruchamia zapytanie niewektorowe bezpośrednio na tabeli LanceDB:

```bash
openclaw ltm query --cols id,text,createdAt --limit 20
openclaw ltm query --filter "category = 'preference'" --order-by createdAt:desc
```

- `--cols <columns>`: rozdzielona przecinkami lista dozwolonych kolumn (domyślnie `id`, `text`, `importance`, `category`, `createdAt`).
- `--filter <condition>`: klauzula WHERE w stylu SQL; ograniczona do 200 znaków i zawężona do znaków alfanumerycznych, operatorów porównania, cudzysłowów, nawiasów oraz małego zestawu bezpiecznych znaków interpunkcyjnych.
- `--limit <n>`: dodatnia liczba całkowita; domyślnie `10`.
- `--order-by <column>:<asc|desc>`: sortowanie w pamięci stosowane po filtrze; kolumna sortowania jest automatycznie dołączana do projekcji.

Agenci otrzymują również narzędzia pamięci LanceDB z aktywnego Plugin pamięci:

- `memory_recall` do odtwarzania opartego na LanceDB
- `memory_store` do zapisywania ważnych faktów, preferencji, decyzji i encji
- `memory_forget` do usuwania pasujących wspomnień

## Pamięć masowa

Domyślnie dane LanceDB znajdują się w `~/.openclaw/memory/lancedb`. Nadpisz
ścieżkę za pomocą `dbPath`:

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

`storageOptions` przyjmuje pary klucz/wartość typu string dla backendów pamięci masowej LanceDB i
obsługuje rozwijanie `${ENV_VAR}`:

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

## Zależności runtime

`memory-lancedb` zależy od natywnego pakietu `@lancedb/lancedb`. Spakowany
OpenClaw traktuje ten pakiet jako część pakietu Plugin. Uruchomienie Gateway
nie naprawia zależności Plugin; jeśli zależności brakuje, zainstaluj ponownie albo
zaktualizuj pakiet Plugin i uruchom ponownie Gateway.

Jeśli starsza instalacja loguje błąd brakującego `dist/package.json` albo brakującego
`@lancedb/lancedb` podczas ładowania Plugin, zaktualizuj OpenClaw i uruchom ponownie
Gateway.

Jeśli Plugin loguje, że LanceDB jest niedostępne na `darwin-x64`, użyj domyślnego
backendu pamięci na tej maszynie, przenieś Gateway na obsługiwaną platformę albo
wyłącz `memory-lancedb`.

## Rozwiązywanie problemów

### Długość wejścia przekracza długość kontekstu

Zwykle oznacza to, że model osadzeń odrzucił zapytanie odtwarzania:

```text
memory-lancedb: recall failed: Error: 400 the input length exceeds the context length
```

Ustaw niższe `recallMaxChars`, a następnie uruchom ponownie Gateway:

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

Dla Ollama sprawdź też, czy serwer osadzeń jest osiągalny z hosta Gateway:

```bash
curl http://127.0.0.1:11434/v1/embeddings \
  -H "Content-Type: application/json" \
  -d '{"model":"mxbai-embed-large","input":"hello"}'
```

### Nieobsługiwany model osadzeń

Bez `dimensions` znane są tylko wbudowane wymiary osadzeń OpenAI.
Dla lokalnych lub niestandardowych modeli osadzeń ustaw `embedding.dimensions` na rozmiar wektora
zgłaszany przez ten model.

### Plugin ładuje się, ale nie pojawiają się żadne wspomnienia

Sprawdź, czy `plugins.slots.memory` wskazuje na `memory-lancedb`, a następnie uruchom:

```bash
openclaw ltm stats
openclaw ltm search "recent preference"
```

Jeśli `autoCapture` jest wyłączone, Plugin będzie odtwarzać istniejące wspomnienia, ale
nie będzie automatycznie zapisywać nowych. Użyj narzędzia `memory_store` albo włącz
`autoCapture`, jeśli chcesz automatycznego przechwytywania.

## Powiązane

- [Omówienie pamięci](/pl/concepts/memory)
- [Active Memory](/pl/concepts/active-memory)
- [Wyszukiwanie pamięci](/pl/concepts/memory-search)
- [Memory Wiki](/pl/plugins/memory-wiki)
- [Ollama](/pl/providers/ollama)
