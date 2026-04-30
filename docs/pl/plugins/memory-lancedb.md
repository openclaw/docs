---
read_when:
    - Konfigurujesz dołączony plugin memory-lancedb
    - Chcesz mieć pamięć długoterminową opartą na LanceDB z automatycznym przywoływaniem lub automatycznym przechwytywaniem
    - Używasz lokalnych embeddingów zgodnych z OpenAI, takich jak Ollama
sidebarTitle: Memory LanceDB
summary: Skonfiguruj dołączony Plugin pamięci LanceDB, w tym lokalne osadzenia zgodne z Ollama
title: Pamięć LanceDB
x-i18n:
    generated_at: "2026-04-30T10:07:37Z"
    model: gpt-5.5
    provider: openai
    source_hash: bda53528857a492f1627f655e49be6775e0114115781371ff67debb155b7e731
    source_path: plugins/memory-lancedb.md
    workflow: 16
---

`memory-lancedb` to dołączony Plugin pamięci, który przechowuje pamięć długoterminową w
LanceDB i używa osadzeń do przywoływania. Może automatycznie przywoływać istotne
wspomnienia przed turą modelu i przechwytywać ważne fakty po odpowiedzi.

Użyj go, gdy chcesz mieć lokalną wektorową bazę danych dla pamięci, potrzebujesz
punktu końcowego osadzeń zgodnego z OpenAI albo chcesz przechowywać bazę pamięci poza
domyślnym wbudowanym magazynem pamięci.

<Note>
`memory-lancedb` to Plugin aktywnej pamięci. Włącz go, wybierając slot pamięci za pomocą `plugins.slots.memory = "memory-lancedb"`. Towarzyszące Pluginy, takie jak
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

Uruchom ponownie Gateway po zmianie konfiguracji Pluginu:

```bash
openclaw gateway restart
```

Następnie sprawdź, czy Plugin został załadowany:

```bash
openclaw plugins list
```

## Osadzenia oparte na dostawcy

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

Ta ścieżka działa z profilami uwierzytelniania dostawców, które udostępniają dane logowania do osadzeń.
Na przykład GitHub Copilot może być używany, gdy profil/plan Copilot obsługuje
osadzenia:

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

OpenAI Codex / ChatGPT OAuth (`openai-codex`) nie jest poświadczeniem osadzeń OpenAI Platform.
W przypadku osadzeń OpenAI użyj profilu uwierzytelniania z kluczem API OpenAI,
`OPENAI_API_KEY` albo `models.providers.openai.apiKey`. Użytkownicy korzystający tylko z OAuth mogą użyć
innego dostawcy obsługującego osadzenia, takiego jak GitHub Copilot albo Ollama.

## Osadzenia Ollama

W przypadku osadzeń Ollama preferuj dołączonego dostawcę osadzeń Ollama. Używa on
natywnego punktu końcowego Ollama `/api/embed` i stosuje te same reguły uwierzytelniania/bazowego adresu URL co
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

W przypadku małych lokalnych modeli osadzeń zmniejsz `recallMaxChars`, jeśli widzisz błędy
długości kontekstu z lokalnego serwera.

## Dostawcy zgodni z OpenAI

Niektórzy dostawcy osadzeń zgodni z OpenAI odrzucają parametr `encoding_format`,
podczas gdy inni go ignorują i zawsze zwracają wektory `number[]`.
Dlatego `memory-lancedb` pomija `encoding_format` w żądaniach osadzeń i
akceptuje odpowiedzi w postaci tablic liczb zmiennoprzecinkowych albo zakodowane w base64 odpowiedzi float32.

Jeśli masz surowy punkt końcowy osadzeń zgodny z OpenAI, który nie ma
dołączonego adaptera dostawcy, pomiń `embedding.provider` (albo pozostaw jako `openai`) i
ustaw `embedding.apiKey` oraz `embedding.baseUrl`. Zachowuje to bezpośrednią
ścieżkę klienta zgodnego z OpenAI.

Ustaw `embedding.dimensions` dla dostawców, których wymiary modeli nie są wbudowane.
Na przykład ZhiPu `embedding-3` używa `2048` wymiarów:

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

## Limity przywoływania i przechwytywania

`memory-lancedb` ma dwa osobne limity tekstu:

| Ustawienie        | Domyślnie | Zakres    | Dotyczy                                       |
| ----------------- | --------- | --------- | --------------------------------------------- |
| `recallMaxChars`  | `1000`    | 100-10000 | tekst wysyłany do API osadzeń na potrzeby przywoływania |
| `captureMaxChars` | `500`     | 100-10000 | długość wiadomości asystenta kwalifikująca się do przechwycenia |

`recallMaxChars` kontroluje automatyczne przywoływanie, narzędzie `memory_recall`, ścieżkę zapytania
`memory_forget` oraz `openclaw ltm search`. Automatyczne przywoływanie preferuje
najnowszą wiadomość użytkownika z tury i wraca do pełnego promptu tylko wtedy, gdy żadna
wiadomość użytkownika nie jest dostępna. Dzięki temu metadane kanału i duże bloki promptów
nie trafiają do żądania osadzeń.

`captureMaxChars` kontroluje, czy odpowiedź jest wystarczająco krótka, aby rozważyć ją
do automatycznego przechwycenia. Nie ogranicza osadzeń zapytań przywoływania.

## Polecenia

Gdy `memory-lancedb` jest aktywnym Pluginem pamięci, rejestruje przestrzeń nazw CLI
`ltm`:

```bash
openclaw ltm list
openclaw ltm search "project preferences"
openclaw ltm stats
```

Plugin rozszerza także `openclaw memory` o niewektorowe podpolecenie `query`,
które działa bezpośrednio na tabeli LanceDB:

```bash
openclaw memory query --cols id,text,createdAt --limit 20
openclaw memory query --filter "category = 'preference'" --order-by createdAt:desc
```

- `--cols <columns>`: rozdzielona przecinkami lista dozwolonych kolumn (domyślnie `id`, `text`, `importance`, `category`, `createdAt`).
- `--filter <condition>`: klauzula WHERE w stylu SQL; ograniczona do 200 znaków i zawężona do znaków alfanumerycznych, operatorów porównania, cudzysłowów, nawiasów oraz niewielkiego zestawu bezpiecznych znaków interpunkcyjnych.
- `--limit <n>`: dodatnia liczba całkowita; domyślnie `10`.
- `--order-by <column>:<asc|desc>`: sortowanie w pamięci stosowane po filtrze; kolumna sortowania jest automatycznie uwzględniana w projekcji.

Agenci otrzymują również narzędzia pamięci LanceDB z aktywnego Pluginu pamięci:

- `memory_recall` do przywoływania opartego na LanceDB
- `memory_store` do zapisywania ważnych faktów, preferencji, decyzji i encji
- `memory_forget` do usuwania pasujących wspomnień

## Przechowywanie

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

`storageOptions` akceptuje pary klucz/wartość typu string dla backendów przechowywania LanceDB i
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

## Zależności uruchomieniowe

`memory-lancedb` zależy od natywnego pakietu `@lancedb/lancedb`. Spakowane
instalacje OpenClaw najpierw próbują użyć dołączonej zależności uruchomieniowej i mogą naprawić
zależność uruchomieniową Pluginu w stanie OpenClaw, gdy dołączony import nie jest
dostępny.

Jeśli starsza instalacja podczas ładowania Pluginu zapisuje w logach błąd braku `dist/package.json` lub brakującego
`@lancedb/lancedb`, zaktualizuj OpenClaw i uruchom ponownie
Gateway.

Jeśli Plugin zapisuje w logach, że LanceDB jest niedostępne na `darwin-x64`, użyj domyślnego
backendu pamięci na tej maszynie, przenieś Gateway na obsługiwaną platformę albo
wyłącz `memory-lancedb`.

## Rozwiązywanie problemów

### Długość wejścia przekracza długość kontekstu

Zwykle oznacza to, że model osadzeń odrzucił zapytanie przywoływania:

```text
memory-lancedb: recall failed: Error: 400 the input length exceeds the context length
```

Ustaw niższą wartość `recallMaxChars`, a następnie uruchom ponownie Gateway:

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

W przypadku Ollama sprawdź także, czy serwer osadzeń jest osiągalny z hosta Gateway:

```bash
curl http://127.0.0.1:11434/v1/embeddings \
  -H "Content-Type: application/json" \
  -d '{"model":"mxbai-embed-large","input":"hello"}'
```

### Nieobsługiwany model osadzeń

Bez `dimensions` znane są tylko wbudowane wymiary osadzeń OpenAI.
W przypadku lokalnych lub niestandardowych modeli osadzeń ustaw `embedding.dimensions` na rozmiar wektora
zgłaszany przez ten model.

### Plugin ładuje się, ale nie pojawiają się żadne wspomnienia

Sprawdź, czy `plugins.slots.memory` wskazuje na `memory-lancedb`, a następnie uruchom:

```bash
openclaw ltm stats
openclaw ltm search "recent preference"
```

Jeśli `autoCapture` jest wyłączone, Plugin będzie przywoływać istniejące wspomnienia, ale
nie będzie automatycznie przechowywać nowych. Użyj narzędzia `memory_store` albo włącz
`autoCapture`, jeśli chcesz automatycznego przechwytywania.

## Powiązane

- [Przegląd pamięci](/pl/concepts/memory)
- [Active Memory](/pl/concepts/active-memory)
- [Wyszukiwanie w pamięci](/pl/concepts/memory-search)
- [Memory Wiki](/pl/plugins/memory-wiki)
- [Ollama](/pl/providers/ollama)
