---
read_when:
    - Chcesz zrozumieć domyślny backend pamięci
    - Chcesz skonfigurować dostawców embeddingów lub wyszukiwanie hybrydowe
summary: Domyślny backend pamięci oparty na SQLite z wyszukiwaniem słów kluczowych, wektorowym i hybrydowym
title: Wbudowany silnik pamięci
x-i18n:
    generated_at: "2026-04-24T09:05:54Z"
    model: gpt-5.4
    provider: openai
    source_hash: f82c1f4dc37b4fc6c075a7fcd2ec78bfcbfbebbcba7e48d366a1da3afcaff508
    source_path: concepts/memory-builtin.md
    workflow: 15
---

Wbudowany silnik to domyślny backend pamięci. Przechowuje indeks pamięci w
bazie SQLite per agent i nie wymaga żadnych dodatkowych zależności na start.

## Co zapewnia

- **Wyszukiwanie słów kluczowych** przez pełnotekstowe indeksowanie FTS5 (ocena BM25).
- **Wyszukiwanie wektorowe** przez embeddingi od dowolnego obsługiwanego dostawcy.
- **Wyszukiwanie hybrydowe**, które łączy oba podejścia dla najlepszych wyników.
- **Obsługę CJK** przez tokenizację trigramową dla języków chińskiego, japońskiego i koreańskiego.
- **Przyspieszenie sqlite-vec** dla zapytań wektorowych w bazie danych (opcjonalnie).

## Pierwsze kroki

Jeśli masz klucz API do OpenAI, Gemini, Voyage lub Mistral, wbudowany
silnik wykryje go automatycznie i włączy wyszukiwanie wektorowe. Konfiguracja nie jest wymagana.

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

Aby wymusić użycie wbudowanego lokalnego dostawcy embeddingów, wskaż `local.modelPath`
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

| Provider | ID        | Auto-detected | Notes                               |
| -------- | --------- | ------------- | ----------------------------------- |
| OpenAI   | `openai`  | Yes           | Domyślnie: `text-embedding-3-small` |
| Gemini   | `gemini`  | Yes           | Obsługuje multimodalność (obraz + audio) |
| Voyage   | `voyage`  | Yes           |                                     |
| Mistral  | `mistral` | Yes           |                                     |
| Ollama   | `ollama`  | No            | Lokalny, ustaw jawnie               |
| Local    | `local`   | Yes (first)   | Model GGUF, pobieranie ~0,6 GB      |

Automatyczne wykrywanie wybiera pierwszego dostawcę, dla którego można rozwiązać klucz API, w
pokazanej kolejności. Ustaw `memorySearch.provider`, aby to nadpisać.

## Jak działa indeksowanie

OpenClaw indeksuje `MEMORY.md` i `memory/*.md` do chunków (~400 tokenów z
nakładaniem 80 tokenów) i zapisuje je w bazie SQLite per agent.

- **Lokalizacja indeksu:** `~/.openclaw/memory/<agentId>.sqlite`
- **Obserwowanie plików:** zmiany w plikach pamięci wyzwalają opóźnione ponowne indeksowanie (1,5 s).
- **Automatyczne ponowne indeksowanie:** gdy dostawca embeddingów, model lub konfiguracja chunkingu
  się zmienią, cały indeks jest automatycznie przebudowywany.
- **Ponowne indeksowanie na żądanie:** `openclaw memory index --force`

<Info>
Możesz także indeksować pliki Markdown spoza obszaru roboczego przy użyciu
`memorySearch.extraPaths`. Zobacz
[dokumentację konfiguracji](/pl/reference/memory-config#additional-memory-paths).
</Info>

## Kiedy używać

Wbudowany silnik to właściwy wybór dla większości użytkowników:

- Działa od razu bez dodatkowych zależności.
- Dobrze obsługuje wyszukiwanie słów kluczowych i wektorowe.
- Obsługuje wszystkich dostawców embeddingów.
- Wyszukiwanie hybrydowe łączy najlepsze cechy obu podejść do wyszukiwania.

Rozważ przejście na [QMD](/pl/concepts/memory-qmd), jeśli potrzebujesz rerankingu, rozwijania zapytań
lub chcesz indeksować katalogi spoza obszaru roboczego.

Rozważ [Honcho](/pl/concepts/memory-honcho), jeśli chcesz pamięci między sesjami z
automatycznym modelowaniem użytkownika.

## Rozwiązywanie problemów

**Wyszukiwanie pamięci wyłączone?** Sprawdź `openclaw memory status`. Jeśli nie wykryto dostawcy,
ustaw go jawnie lub dodaj klucz API.

**Lokalny dostawca nie został wykryty?** Potwierdź, że lokalna ścieżka istnieje, i uruchom:

```bash
openclaw memory status --deep --agent main
openclaw memory index --force --agent main
```

Zarówno samodzielne polecenia CLI, jak i Gateway używają tego samego identyfikatora dostawcy `local`.
Jeśli dostawca jest ustawiony na `auto`, lokalne embeddingi są rozważane jako pierwsze tylko
wtedy, gdy `memorySearch.local.modelPath` wskazuje na istniejący lokalny plik.

**Nieaktualne wyniki?** Uruchom `openclaw memory index --force`, aby przebudować indeks. Watcher
w rzadkich przypadkach brzegowych może przeoczyć zmiany.

**`sqlite-vec` nie ładuje się?** OpenClaw automatycznie wraca do podobieństwa cosinusowego w procesie.
Sprawdź logi, aby zobaczyć konkretny błąd ładowania.

## Konfiguracja

Konfigurację dostawców embeddingów, dostrajanie wyszukiwania hybrydowego (wagi, MMR, czasowy
zanik), indeksowanie wsadowe, pamięć multimodalną, sqlite-vec, dodatkowe ścieżki i wszystkie
pozostałe opcje konfiguracji znajdziesz w
[dokumentacji konfiguracji pamięci](/pl/reference/memory-config).

## Powiązane

- [Przegląd pamięci](/pl/concepts/memory)
- [Wyszukiwanie pamięci](/pl/concepts/memory-search)
- [Active Memory](/pl/concepts/active-memory)
