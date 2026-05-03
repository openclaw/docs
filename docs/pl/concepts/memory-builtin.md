---
read_when:
    - Chcesz zrozumieć domyślny backend pamięci
    - Chcesz skonfigurować dostawców osadzeń lub wyszukiwanie hybrydowe
summary: Domyślny backend pamięci oparty na SQLite z wyszukiwaniem według słów kluczowych, wektorowym i hybrydowym
title: Wbudowany silnik pamięci
x-i18n:
    generated_at: "2026-05-03T21:29:51Z"
    model: gpt-5.5
    provider: openai
    source_hash: 72f5d1fee02bff0962bd012575b62846c1f11c030fd1174fdb2af1e81909f52a
    source_path: concepts/memory-builtin.md
    workflow: 16
---

Wbudowany silnik jest domyślnym backendem pamięci. Przechowuje indeks pamięci w
bazie danych SQLite przypisanej do agenta i nie wymaga dodatkowych zależności, aby rozpocząć pracę.

## Co zapewnia

- **Wyszukiwanie słów kluczowych** przez pełnotekstowe indeksowanie FTS5 (punktacja BM25).
- **Wyszukiwanie wektorowe** przez osadzenia z dowolnego obsługiwanego dostawcy.
- **Wyszukiwanie hybrydowe**, które łączy oba podejścia dla najlepszych wyników.
- **Obsługa CJK** przez tokenizację trigramową dla języków chińskiego, japońskiego i koreańskiego.
- **Akceleracja sqlite-vec** dla zapytań wektorowych w bazie danych (opcjonalnie).

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

Bez dostawcy osadzeń dostępne jest tylko wyszukiwanie słów kluczowych.

Aby wymusić wbudowanego lokalnego dostawcę osadzeń, zainstaluj opcjonalny
pakiet środowiska uruchomieniowego `node-llama-cpp` obok OpenClaw, a następnie wskaż
`local.modelPath` na plik GGUF:

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

| Dostawca  | ID          | Wykrywany automatycznie | Uwagi                               |
| --------- | ----------- | ------------- | ----------------------------------- |
| OpenAI    | `openai`    | Tak           | Domyślnie: `text-embedding-3-small` |
| Gemini    | `gemini`    | Tak           | Obsługuje multimodalność (obraz + audio) |
| Voyage    | `voyage`    | Tak           |                                     |
| Mistral   | `mistral`   | Tak           |                                     |
| DeepInfra | `deepinfra` | Tak           | Domyślnie: `BAAI/bge-m3`            |
| Ollama    | `ollama`    | Nie           | Lokalny, ustaw jawnie               |
| Lokalny   | `local`     | Tak (pierwszy) | Opcjonalne środowisko uruchomieniowe `node-llama-cpp` |

Automatyczne wykrywanie wybiera pierwszego dostawcę, którego klucz API można rozpoznać,
w pokazanej kolejności. Ustaw `memorySearch.provider`, aby nadpisać ten wybór.

## Jak działa indeksowanie

OpenClaw indeksuje `MEMORY.md` oraz `memory/*.md` w porcje (~400 tokenów z
nakładaniem 80 tokenów) i zapisuje je w bazie danych SQLite przypisanej do agenta.

- **Lokalizacja indeksu:** `~/.openclaw/memory/<agentId>.sqlite`
- **Utrzymanie pamięci masowej:** pliki poboczne SQLite WAL są ograniczane okresowymi
  punktami kontrolnymi oraz punktami kontrolnymi przy zamykaniu.
- **Obserwowanie plików:** zmiany w plikach pamięci uruchamiają opóźnione ponowne indeksowanie (1,5 s).
- **Automatyczne ponowne indeksowanie:** gdy zmieni się dostawca osadzeń, model lub konfiguracja porcjowania,
  cały indeks jest automatycznie przebudowywany.
- **Ponowne indeksowanie na żądanie:** `openclaw memory index --force`

<Info>
Możesz też indeksować pliki Markdown spoza obszaru roboczego za pomocą
`memorySearch.extraPaths`. Zobacz
[odniesienie konfiguracji](/pl/reference/memory-config#additional-memory-paths).
</Info>

## Kiedy używać

Wbudowany silnik jest właściwym wyborem dla większości użytkowników:

- Działa od razu bez dodatkowych zależności.
- Dobrze obsługuje wyszukiwanie słów kluczowych i wektorowe.
- Obsługuje wszystkich dostawców osadzeń.
- Wyszukiwanie hybrydowe łączy najlepsze cechy obu podejść do pobierania.

Rozważ przełączenie na [QMD](/pl/concepts/memory-qmd), jeśli potrzebujesz ponownego rankingu, rozszerzania
zapytań albo chcesz indeksować katalogi spoza obszaru roboczego.

Rozważ [Honcho](/pl/concepts/memory-honcho), jeśli chcesz pamięci między sesjami z
automatycznym modelowaniem użytkownika.

## Rozwiązywanie problemów

**Wyszukiwanie pamięci wyłączone?** Sprawdź `openclaw memory status`. Jeśli żaden dostawca nie jest
wykryty, ustaw go jawnie albo dodaj klucz API.

**Lokalny dostawca nie został wykryty?** Potwierdź, że lokalna ścieżka istnieje, i uruchom:

```bash
openclaw memory status --deep --agent main
openclaw memory index --force --agent main
```

Zarówno samodzielne polecenia CLI, jak i Gateway używają tego samego identyfikatora dostawcy `local`.
Jeśli dostawca jest ustawiony na `auto`, lokalne osadzenia są rozważane jako pierwsze tylko wtedy,
gdy `memorySearch.local.modelPath` wskazuje na istniejący plik lokalny.

**Nieaktualne wyniki?** Uruchom `openclaw memory index --force`, aby przebudować indeks. Obserwator
może pominąć zmiany w rzadkich przypadkach brzegowych.

**sqlite-vec nie ładuje się?** OpenClaw automatycznie przełącza się na podobieństwo cosinusowe
w procesie. `openclaw memory status --deep` raportuje lokalny magazyn wektorowy
oddzielnie od dostawcy osadzeń, więc `Vector store: unavailable` wskazuje
na ładowanie sqlite-vec, natomiast `Embeddings: unavailable` wskazuje na dostawcę/uwierzytelnianie
lub gotowość modelu. Sprawdź dzienniki pod kątem konkretnego błędu ładowania.

## Konfiguracja

Aby skonfigurować dostawcę osadzeń, dostroić wyszukiwanie hybrydowe (wagi, MMR, zanikanie
czasowe), indeksowanie wsadowe, pamięć multimodalną, sqlite-vec, dodatkowe ścieżki i wszystkie
inne ustawienia konfiguracyjne, zobacz
[odniesienie konfiguracji pamięci](/pl/reference/memory-config).

## Powiązane

- [Przegląd pamięci](/pl/concepts/memory)
- [Wyszukiwanie pamięci](/pl/concepts/memory-search)
- [Active Memory](/pl/concepts/active-memory)
