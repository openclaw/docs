---
read_when:
    - Chcesz zrozumieć domyślny backend pamięci
    - Chcesz skonfigurować dostawców embeddingów lub wyszukiwanie hybrydowe
summary: Domyślny backend pamięci oparty na SQLite z wyszukiwaniem słów kluczowych, wektorowym i hybrydowym
title: Wbudowany silnik pamięci
x-i18n:
    generated_at: "2026-04-05T13:50:30Z"
    model: gpt-5.4
    provider: openai
    source_hash: 181c40a43332315bf915ff6f395d9d5fd766c889e1a8d1aa525f9ba0198d3367
    source_path: concepts/memory-builtin.md
    workflow: 15
---

# Wbudowany silnik pamięci

Wbudowany silnik jest domyślnym backendem pamięci. Przechowuje indeks pamięci w
bazie danych SQLite przypisanej do agenta i nie wymaga żadnych dodatkowych zależności na start.

## Co zapewnia

- **Wyszukiwanie słów kluczowych** przez indeksowanie pełnotekstowe FTS5 (ocenianie BM25).
- **Wyszukiwanie wektorowe** przez embeddingi od dowolnego obsługiwanego dostawcy.
- **Wyszukiwanie hybrydowe** łączące oba podejścia dla najlepszych wyników.
- **Obsługa CJK** przez tokenizację trigramową dla języków chińskiego, japońskiego i koreańskiego.
- **Przyspieszenie sqlite-vec** dla zapytań wektorowych w bazie danych (opcjonalne).

## Pierwsze kroki

Jeśli masz klucz API do OpenAI, Gemini, Voyage lub Mistral, wbudowany
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

## Obsługiwani dostawcy embeddingów

| Dostawca | ID        | Wykrywany automatycznie | Uwagi                               |
| -------- | --------- | ----------------------- | ----------------------------------- |
| OpenAI   | `openai`  | Tak                     | Domyślnie: `text-embedding-3-small` |
| Gemini   | `gemini`  | Tak                     | Obsługuje multimodalność (obraz + audio) |
| Voyage   | `voyage`  | Tak                     |                                     |
| Mistral  | `mistral` | Tak                     |                                     |
| Ollama   | `ollama`  | Nie                     | Lokalny, ustaw jawnie               |
| Local    | `local`   | Tak (jako pierwszy)     | Model GGUF, pobieranie ~0.6 GB      |

Automatyczne wykrywanie wybiera pierwszego dostawcę, którego klucz API można rozwiązać, w
pokazanej kolejności. Ustaw `memorySearch.provider`, aby to nadpisać.

## Jak działa indeksowanie

OpenClaw indeksuje `MEMORY.md` oraz `memory/*.md` do fragmentów (~400 tokenów z
nakładaniem 80 tokenów) i przechowuje je w bazie danych SQLite przypisanej do agenta.

- **Lokalizacja indeksu:** `~/.openclaw/memory/<agentId>.sqlite`
- **Obserwowanie plików:** zmiany w plikach pamięci wyzwalają opóźnione ponowne indeksowanie (1.5s).
- **Automatyczne ponowne indeksowanie:** gdy zmieni się dostawca embeddingów, model lub konfiguracja dzielenia na fragmenty,
  cały indeks jest automatycznie przebudowywany.
- **Ponowne indeksowanie na żądanie:** `openclaw memory index --force`

<Info>
Możesz także indeksować pliki Markdown spoza workspace za pomocą
`memorySearch.extraPaths`. Zobacz
[dokumentację konfiguracji](/reference/memory-config#additional-memory-paths).
</Info>

## Kiedy używać

Wbudowany silnik to właściwy wybór dla większości użytkowników:

- Działa od razu, bez dodatkowych zależności.
- Dobrze obsługuje wyszukiwanie słów kluczowych i wektorowe.
- Obsługuje wszystkich dostawców embeddingów.
- Wyszukiwanie hybrydowe łączy zalety obu podejść do wyszukiwania.

Rozważ przejście na [QMD](/concepts/memory-qmd), jeśli potrzebujesz rerankingu, rozwijania
zapytań albo chcesz indeksować katalogi spoza workspace.

Rozważ [Honcho](/concepts/memory-honcho), jeśli chcesz pamięć między sesjami z
automatycznym modelowaniem użytkownika.

## Rozwiązywanie problemów

**Wyszukiwanie pamięci jest wyłączone?** Sprawdź `openclaw memory status`. Jeśli nie wykryto dostawcy,
ustaw go jawnie lub dodaj klucz API.

**Nieaktualne wyniki?** Uruchom `openclaw memory index --force`, aby przebudować indeks. Obserwator
może w rzadkich przypadkach nie wychwycić zmian.

**`sqlite-vec` się nie ładuje?** OpenClaw automatycznie przełącza się na obliczanie podobieństwa cosinusowego
w procesie. Sprawdź logi, aby zobaczyć konkretny błąd ładowania.

## Konfiguracja

Informacje o konfiguracji dostawcy embeddingów, strojeniu wyszukiwania hybrydowego (wagi, MMR, czasowy
zanik), indeksowaniu wsadowym, pamięci multimodalnej, sqlite-vec, dodatkowych ścieżkach i wszystkich
pozostałych opcjach konfiguracji znajdziesz w
[dokumentacji konfiguracji pamięci](/reference/memory-config).
