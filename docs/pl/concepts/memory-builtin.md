---
read_when:
    - Chcesz zrozumieć domyślny backend pamięci
    - Chcesz skonfigurować dostawców osadzeń lub wyszukiwanie hybrydowe
summary: Domyślny backend pamięci oparty na SQLite z wyszukiwaniem według słów kluczowych, wektorowym i hybrydowym
title: Wbudowany silnik pamięci
x-i18n:
    generated_at: "2026-07-12T15:03:50Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: e8cbe2bae73b1d393ac158edb67fc442e76d1e5ff93e5201dbb7e7216801aa85
    source_path: concepts/memory-builtin.md
    workflow: 16
---

Wbudowany silnik jest domyślnym backendem pamięci. Przechowuje indeks pamięci
w bazie danych SQLite przypisanej do agenta i nie wymaga żadnych dodatkowych
zależności, aby rozpocząć pracę.

## Co oferuje

- **Wyszukiwanie słów kluczowych** za pomocą pełnotekstowego indeksowania FTS5 (punktacja BM25).
- **Wyszukiwanie wektorowe** za pomocą embeddingów od dowolnego obsługiwanego dostawcy.
- **Wyszukiwanie hybrydowe**, które łączy obie metody w celu uzyskania najlepszych wyników.
- **Obsługę języków CJK** za pomocą tokenizacji trigramowej dla języka chińskiego, japońskiego i koreańskiego.
- **Przyspieszenie sqlite-vec** dla zapytań wektorowych wykonywanych w bazie danych (opcjonalnie).

## Pierwsze kroki

Domyślnie wbudowany silnik używa embeddingów OpenAI. Jeśli `OPENAI_API_KEY` lub
`models.providers.openai.apiKey` jest już skonfigurowany, wyszukiwanie wektorowe
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

Bez dostawcy embeddingów dostępne jest tylko wyszukiwanie słów kluczowych.

Aby wymusić lokalne embeddingi GGUF, zainstaluj oficjalny plugin dostawcy
llama.cpp, a następnie ustaw `local.modelPath` na plik GGUF:

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

## Obsługiwani dostawcy embeddingów

| Dostawca          | ID                  | Uwagi                                      |
| ----------------- | ------------------- | ------------------------------------------ |
| Bedrock           | `bedrock`           | Używa łańcucha poświadczeń AWS             |
| DeepInfra         | `deepinfra`         | Domyślnie: `BAAI/bge-m3`                   |
| Gemini            | `gemini`            | Obsługuje multimodalność (obraz i dźwięk)  |
| GitHub Copilot    | `github-copilot`    | Używa Twojej subskrypcji Copilot           |
| LM Studio         | `lmstudio`          | Lokalny/samodzielnie hostowany              |
| Lokalny           | `local`             | `@openclaw/llama-cpp-provider`             |
| Mistral           | `mistral`           |                                            |
| Ollama            | `ollama`            | Lokalny/samodzielnie hostowany              |
| OpenAI            | `openai`            | Domyślnie: `text-embedding-3-small`         |
| Zgodny z OpenAI   | `openai-compatible` | Ogólny punkt końcowy `/v1/embeddings`       |
| Voyage            | `voyage`            |                                            |

Ustaw `memorySearch.provider`, aby zmienić dostawcę z OpenAI na innego.

## Jak działa indeksowanie

OpenClaw indeksuje pliki `MEMORY.md` i `memory/*.md` w segmentach (domyślnie
po 400 tokenów z nakładaniem się 80 tokenów) i przechowuje je w bazie danych
SQLite przypisanej do agenta.

- **Lokalizacja indeksu:** baza danych agenta będącego właścicielem:
  `~/.openclaw/agents/<agentId>/agent/openclaw-agent.sqlite`
- **Konserwacja pamięci:** rozmiar plików pomocniczych SQLite WAL jest ograniczany
  za pomocą okresowych punktów kontrolnych oraz punktów kontrolnych przy zamykaniu.
- **Monitorowanie plików:** zmiany w plikach pamięci wyzwalają ponowne indeksowanie
  z eliminacją drgań (domyślnie 1,5 s).
- **Automatyczne ponowne indeksowanie:** indeks jest automatycznie przebudowywany po zmianie
  dostawcy embeddingów, modelu, konfiguracji segmentowania, skonfigurowanych źródeł lub zakresu.
- **Ponowne indeksowanie na żądanie:** `openclaw memory index --force`

<Info>
Możesz również indeksować pliki Markdown spoza przestrzeni roboczej za pomocą
`memorySearch.extraPaths`. Zobacz
[dokumentację konfiguracji](/pl/reference/memory-config#additional-memory-paths).
</Info>

## Kiedy używać

Wbudowany silnik jest właściwym wyborem dla większości użytkowników:

- Działa od razu, bez dodatkowych zależności.
- Dobrze obsługuje wyszukiwanie słów kluczowych i wektorowe.
- Obsługuje wszystkich dostawców embeddingów.
- Wyszukiwanie hybrydowe łączy zalety obu metod pobierania informacji.

Rozważ przejście na [QMD](/pl/concepts/memory-qmd), jeśli potrzebujesz ponownego
uszeregowania wyników, rozszerzania zapytań lub chcesz indeksować katalogi
spoza przestrzeni roboczej.

Rozważ użycie [Honcho](/pl/concepts/memory-honcho), jeśli potrzebujesz pamięci
między sesjami z automatycznym modelowaniem użytkownika.

## Rozwiązywanie problemów

**Wyszukiwanie pamięci jest wyłączone?** Sprawdź `openclaw memory status`. Jeśli
nie wykryto dostawcy, ustaw go jawnie lub dodaj klucz API.

**Nie wykryto lokalnego dostawcy?** Upewnij się, że lokalna ścieżka istnieje, i uruchom:

```bash
openclaw memory status --deep --agent main
openclaw memory index --force --agent main
```

Zarówno samodzielne polecenia CLI, jak i Gateway używają tego samego identyfikatora
dostawcy `local`. Ustaw `memorySearch.provider: "local"`, jeśli chcesz używać
lokalnych embeddingów.

**Nieaktualne wyniki?** Uruchom `openclaw memory index --force`, aby przebudować
indeks. W rzadkich przypadkach brzegowych mechanizm monitorowania może nie
wykryć zmian.

**sqlite-vec nie jest ładowany?** OpenClaw automatycznie przełącza się na
obliczanie podobieństwa cosinusowego w procesie. Polecenie
`openclaw memory status --deep` raportuje lokalny magazyn wektorów oddzielnie
od dostawcy embeddingów, dlatego `Vector store:
unavailable` wskazuje na problem z ładowaniem sqlite-vec, natomiast `Embeddings: unavailable`
wskazuje na problem z dostawcą lub uwierzytelnianiem albo brak gotowości modelu.
Sprawdź dzienniki pod kątem konkretnego błędu ładowania.

## Konfiguracja

Informacje o konfiguracji dostawcy embeddingów, dostrajaniu wyszukiwania
hybrydowego (wagi, MMR, wygaszanie czasowe), indeksowaniu wsadowym, pamięci
multimodalnej, sqlite-vec, dodatkowych ścieżkach i wszystkich pozostałych
ustawieniach znajdziesz w
[dokumentacji konfiguracji pamięci](/pl/reference/memory-config).

## Powiązane

- [Omówienie pamięci](/pl/concepts/memory)
- [Wyszukiwanie pamięci](/pl/concepts/memory-search)
- [Active Memory](/pl/concepts/active-memory)
