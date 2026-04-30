---
read_when:
    - Chcesz zrozumieć domyślny backend pamięci
    - Chcesz skonfigurować dostawców osadzeń lub wyszukiwanie hybrydowe
summary: Domyślny backend pamięci oparty na SQLite z wyszukiwaniem słów kluczowych, wektorowym i hybrydowym
title: Wbudowany silnik pamięci
x-i18n:
    generated_at: "2026-04-30T09:47:18Z"
    model: gpt-5.5
    provider: openai
    source_hash: aa1597a9a49a6f1124cedf49f6f5a4c336f76dd5998ced246affb9c2e8171f05
    source_path: concepts/memory-builtin.md
    workflow: 16
---

Wbudowany silnik jest domyślnym backendem pamięci. Przechowuje indeks pamięci w
osobnej bazie danych SQLite dla każdego agenta i nie wymaga dodatkowych zależności, aby rozpocząć pracę.

## Co zapewnia

- **Wyszukiwanie słów kluczowych** przez pełnotekstowe indeksowanie FTS5 (punktacja BM25).
- **Wyszukiwanie wektorowe** przez embeddingi od dowolnego obsługiwanego dostawcy.
- **Wyszukiwanie hybrydowe**, które łączy oba podejścia dla najlepszych wyników.
- **Obsługa CJK** przez tokenizację trigramową dla języka chińskiego, japońskiego i koreańskiego.
- **Przyspieszenie sqlite-vec** dla zapytań wektorowych w bazie danych (opcjonalnie).

## Pierwsze kroki

Jeśli masz klucz API dla OpenAI, Gemini, Voyage, Mistral lub DeepInfra, wbudowany
silnik automatycznie go wykrywa i włącza wyszukiwanie wektorowe. Konfiguracja nie jest potrzebna.

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

Aby wymusić wbudowanego lokalnego dostawcę embeddingów, zainstaluj opcjonalny
pakiet uruchomieniowy `node-llama-cpp` obok OpenClaw, a następnie ustaw `local.modelPath`
na plik GGUF:

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

| Dostawca  | ID          | Wykrywany automatycznie | Uwagi                               |
| --------- | ----------- | ------------- | ----------------------------------- |
| OpenAI    | `openai`    | Tak           | Domyślnie: `text-embedding-3-small`   |
| Gemini    | `gemini`    | Tak           | Obsługuje multimodalność (obraz + dźwięk) |
| Voyage    | `voyage`    | Tak           |                                     |
| Mistral   | `mistral`   | Tak           |                                     |
| DeepInfra | `deepinfra` | Tak           | Domyślnie: `BAAI/bge-m3`              |
| Ollama    | `ollama`    | Nie            | Lokalny, ustaw jawnie               |
| Local     | `local`     | Tak (pierwszy)   | Opcjonalny pakiet uruchomieniowy `node-llama-cpp`   |

Automatyczne wykrywanie wybiera pierwszego dostawcę, którego klucz API można rozwiązać,
w pokazanej kolejności. Ustaw `memorySearch.provider`, aby nadpisać wybór.

## Jak działa indeksowanie

OpenClaw indeksuje `MEMORY.md` i `memory/*.md` w fragmenty (~400 tokenów z
nakładaniem 80 tokenów) i przechowuje je w osobnej bazie danych SQLite dla każdego agenta.

- **Lokalizacja indeksu:** `~/.openclaw/memory/<agentId>.sqlite`
- **Konserwacja pamięci masowej:** pliki pomocnicze SQLite WAL są ograniczane przez okresowe
  punkty kontrolne oraz punkty kontrolne przy zamykaniu.
- **Obserwowanie plików:** zmiany w plikach pamięci wyzwalają opóźnione ponowne indeksowanie (1,5 s).
- **Automatyczne ponowne indeksowanie:** gdy zmienia się dostawca embeddingów, model lub konfiguracja dzielenia na fragmenty,
  cały indeks jest automatycznie przebudowywany.
- **Ponowne indeksowanie na żądanie:** `openclaw memory index --force`

<Info>
Możesz także indeksować pliki Markdown spoza obszaru roboczego za pomocą
`memorySearch.extraPaths`. Zobacz
[referencję konfiguracji](/pl/reference/memory-config#additional-memory-paths).
</Info>

## Kiedy używać

Wbudowany silnik to właściwy wybór dla większości użytkowników:

- Działa od razu bez dodatkowych zależności.
- Dobrze obsługuje wyszukiwanie słów kluczowych i wektorowe.
- Obsługuje wszystkich dostawców embeddingów.
- Wyszukiwanie hybrydowe łączy najlepsze cechy obu metod pobierania.

Rozważ przejście na [QMD](/pl/concepts/memory-qmd), jeśli potrzebujesz ponownego rangowania, rozszerzania zapytań
lub chcesz indeksować katalogi spoza obszaru roboczego.

Rozważ [Honcho](/pl/concepts/memory-honcho), jeśli potrzebujesz pamięci między sesjami z
automatycznym modelowaniem użytkownika.

## Rozwiązywanie problemów

**Wyszukiwanie pamięci jest wyłączone?** Sprawdź `openclaw memory status`. Jeśli żaden dostawca nie został
wykryty, ustaw go jawnie albo dodaj klucz API.

**Lokalny dostawca nie został wykryty?** Potwierdź, że ścieżka lokalna istnieje, i uruchom:

```bash
openclaw memory status --deep --agent main
openclaw memory index --force --agent main
```

Zarówno samodzielne polecenia CLI, jak i Gateway używają tego samego identyfikatora dostawcy `local`.
Jeśli dostawca jest ustawiony na `auto`, lokalne embeddingi są brane pod uwagę jako pierwsze tylko wtedy,
gdy `memorySearch.local.modelPath` wskazuje istniejący plik lokalny.

**Nieaktualne wyniki?** Uruchom `openclaw memory index --force`, aby przebudować indeks. Mechanizm obserwowania
może w rzadkich przypadkach pominąć zmiany.

**sqlite-vec się nie ładuje?** OpenClaw automatycznie przełącza się na podobieństwo cosinusowe
w procesie. Sprawdź logi, aby zobaczyć konkretny błąd ładowania.

## Konfiguracja

Informacje o konfiguracji dostawcy embeddingów, dostrajaniu wyszukiwania hybrydowego (wagi, MMR, zanik czasowy),
indeksowaniu wsadowym, pamięci multimodalnej, sqlite-vec, dodatkowych ścieżkach i wszystkich
pozostałych opcjach konfiguracji znajdziesz w
[referencji konfiguracji pamięci](/pl/reference/memory-config).

## Powiązane

- [Omówienie pamięci](/pl/concepts/memory)
- [Wyszukiwanie pamięci](/pl/concepts/memory-search)
- [Active Memory](/pl/concepts/active-memory)
