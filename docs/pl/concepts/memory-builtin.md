---
read_when:
    - Chcesz zrozumieć domyślny backend pamięci
    - Chcesz skonfigurować dostawców osadzeń lub wyszukiwanie hybrydowe
summary: Domyślny backend pamięci oparty na SQLite z wyszukiwaniem słów kluczowych, wektorowym i hybrydowym
title: Wbudowany silnik pamięci
x-i18n:
    generated_at: "2026-06-27T17:26:57Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: a867bd295778f81109b258a63a35a1683d652d4564e44335053af4d86f90584e
    source_path: concepts/memory-builtin.md
    workflow: 16
---

Wbudowany silnik jest domyślnym backendem pamięci. Przechowuje indeks pamięci w
bazie danych SQLite osobnej dla każdego agenta i nie wymaga dodatkowych zależności, aby rozpocząć.

## Co zapewnia

- **Wyszukiwanie po słowach kluczowych** przez pełnotekstowe indeksowanie FTS5 (punktacja BM25).
- **Wyszukiwanie wektorowe** przez osadzenia z dowolnego obsługiwanego dostawcy.
- **Wyszukiwanie hybrydowe**, które łączy oba podejścia dla najlepszych wyników.
- **Obsługa CJK** przez tokenizację trigramową dla języka chińskiego, japońskiego i koreańskiego.
- **Przyspieszenie sqlite-vec** dla zapytań wektorowych w bazie danych (opcjonalnie).

## Pierwsze kroki

Domyślnie wbudowany silnik używa osadzeń OpenAI. Jeśli masz już skonfigurowane
`OPENAI_API_KEY` albo `models.providers.openai.apiKey`, wyszukiwanie wektorowe
działa bez dodatkowej konfiguracji pamięci.

Aby jawnie ustawić dostawcę:

```json5
{
  agents: {
    defaults: {
      memorySearch: {
        provider: "openai",
      },
    },
  },
}
```

Bez dostawcy osadzeń dostępne jest tylko wyszukiwanie po słowach kluczowych.

Aby wymusić lokalne osadzenia GGUF, zainstaluj oficjalny plugin dostawcy llama.cpp,
a następnie wskaż w `local.modelPath` plik GGUF:

```bash
openclaw plugins install @openclaw/llama-cpp-provider
```

```json5
{
  agents: {
    defaults: {
      memorySearch: {
        provider: "local",
        fallback: "none",
        local: {
          modelPath: "~/.node-llama-cpp/models/embeddinggemma-300m-qat-Q8_0.gguf",
        },
      },
    },
  },
}
```

## Obsługiwani dostawcy osadzeń

| Dostawca          | ID                  | Uwagi                               |
| ----------------- | ------------------- | ----------------------------------- |
| Bedrock           | `bedrock`           | Używa łańcucha poświadczeń AWS      |
| DeepInfra         | `deepinfra`         | Domyślnie: `BAAI/bge-m3`            |
| Gemini            | `gemini`            | Obsługuje multimodalność (obraz + audio) |
| GitHub Copilot    | `github-copilot`    | Używa subskrypcji Copilot           |
| Lokalny           | `local`             | `@openclaw/llama-cpp-provider`      |
| Mistral           | `mistral`           |                                     |
| Ollama            | `ollama`            | Lokalny/samodzielnie hostowany      |
| OpenAI            | `openai`            | Domyślnie: `text-embedding-3-small` |
| Zgodny z OpenAI   | `openai-compatible` | Ogólny punkt końcowy `/v1/embeddings` |
| Voyage            | `voyage`            |                                     |

Ustaw `memorySearch.provider`, aby przełączyć się z OpenAI na innego dostawcę.

## Jak działa indeksowanie

OpenClaw indeksuje `MEMORY.md` i `memory/*.md` jako fragmenty (~400 tokenów z
nakładaniem 80 tokenów) i przechowuje je w bazie danych SQLite osobnej dla każdego agenta.

- **Lokalizacja indeksu:** baza danych agenta właściciela pod adresem
  `~/.openclaw/agents/<agentId>/agent/openclaw-agent.sqlite`
- **Utrzymanie magazynu:** pliki poboczne SQLite WAL są ograniczane przez okresowe
  punkty kontrolne oraz punkty kontrolne przy zamykaniu.
- **Obserwowanie plików:** zmiany w plikach pamięci wyzwalają reindeksowanie z opóźnieniem antydrganiowym (1,5 s).
- **Automatyczne reindeksowanie:** gdy dostawca osadzeń, model lub konfiguracja dzielenia na fragmenty
  się zmieni, cały indeks jest automatycznie odbudowywany.
- **Reindeksowanie na żądanie:** `openclaw memory index --force`

<Info>
Możesz także indeksować pliki Markdown spoza obszaru roboczego za pomocą
`memorySearch.extraPaths`. Zobacz
[odniesienie konfiguracji](/pl/reference/memory-config#additional-memory-paths).
</Info>

## Kiedy używać

Wbudowany silnik jest właściwym wyborem dla większości użytkowników:

- Działa od razu bez dodatkowych zależności.
- Dobrze obsługuje wyszukiwanie po słowach kluczowych i wektorowe.
- Obsługuje wszystkich dostawców osadzeń.
- Wyszukiwanie hybrydowe łączy najlepsze cechy obu podejść do pobierania.

Rozważ przełączenie na [QMD](/pl/concepts/memory-qmd), jeśli potrzebujesz rerankingu, rozszerzania zapytań
albo chcesz indeksować katalogi poza obszarem roboczym.

Rozważ [Honcho](/pl/concepts/memory-honcho), jeśli chcesz pamięć między sesjami z
automatycznym modelowaniem użytkownika.

## Rozwiązywanie problemów

**Wyszukiwanie w pamięci jest wyłączone?** Sprawdź `openclaw memory status`. Jeśli żaden dostawca nie jest
wykryty, ustaw go jawnie albo dodaj klucz API.

**Lokalny dostawca nie został wykryty?** Potwierdź, że lokalna ścieżka istnieje, i uruchom:

```bash
openclaw memory status --deep --agent main
openclaw memory index --force --agent main
```

Zarówno samodzielne polecenia CLI, jak i Gateway używają tego samego identyfikatora dostawcy `local`.
Ustaw `memorySearch.provider: "local"`, gdy chcesz używać lokalnych osadzeń.

**Nieaktualne wyniki?** Uruchom `openclaw memory index --force`, aby odbudować indeks. Obserwator
może pominąć zmiany w rzadkich przypadkach brzegowych.

**sqlite-vec się nie ładuje?** OpenClaw automatycznie przełącza się na podobieństwo cosinusowe
w procesie. `openclaw memory status --deep` raportuje lokalny magazyn wektorowy
oddzielnie od dostawcy osadzeń, więc `Vector store: unavailable` wskazuje
na ładowanie sqlite-vec, natomiast `Embeddings: unavailable` wskazuje na dostawcę/uwierzytelnianie
albo gotowość modelu. Sprawdź w logach konkretny błąd ładowania.

## Konfiguracja

Informacje o konfiguracji dostawcy osadzeń, dostrajaniu wyszukiwania hybrydowego (wagi, MMR, zanikanie czasowe),
indeksowaniu wsadowym, pamięci multimodalnej, sqlite-vec, dodatkowych ścieżkach i wszystkich
innych opcjach konfiguracji znajdziesz w
[odniesieniu konfiguracji pamięci](/pl/reference/memory-config).

## Powiązane

- [Przegląd pamięci](/pl/concepts/memory)
- [Wyszukiwanie w pamięci](/pl/concepts/memory-search)
- [Active Memory](/pl/concepts/active-memory)
