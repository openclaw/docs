---
read_when:
    - Chcesz skonfigurować QMD jako backend pamięci@endsection to=final code  彩神争霸电脑版
    - Chcesz zaawansowanych funkcji pamięci, takich jak reranking lub dodatkowe indeksowane ścieżki
summary: Sidecar wyszukiwania lokalnego z BM25, wektorami, rerankingiem i rozwijaniem zapytań
title: Silnik pamięci QMD
x-i18n:
    generated_at: "2026-04-24T09:06:03Z"
    model: gpt-5.4
    provider: openai
    source_hash: 7d7af326291e194a04a17aa425901bf7e2517c23bae8282cd504802d24e9e522
    source_path: concepts/memory-qmd.md
    workflow: 15
---

[QMD](https://github.com/tobi/qmd) to sidecar wyszukiwania local-first, który działa
obok OpenClaw. Łączy BM25, wyszukiwanie wektorowe i reranking w jednym
pliku binarnym, a także może indeksować treści wykraczające poza pliki pamięci obszaru roboczego.

## Co dodaje względem wbudowanego rozwiązania

- **Reranking i rozwijanie zapytań** dla lepszego recall.
- **Indeksowanie dodatkowych katalogów** — dokumentacja projektu, notatki zespołu, wszystko na dysku.
- **Indeksowanie transkryptów sesji** — przywoływanie wcześniejszych rozmów.
- **W pełni lokalne** — działa przez Bun + node-llama-cpp, automatycznie pobiera modele GGUF.
- **Automatyczny fallback** — jeśli QMD jest niedostępne, OpenClaw płynnie wraca do
  wbudowanego silnika.

## Pierwsze kroki

### Wymagania wstępne

- Zainstaluj QMD: `npm install -g @tobilu/qmd` lub `bun install -g @tobilu/qmd`
- Kompilacja SQLite pozwalająca na rozszerzenia (`brew install sqlite` na macOS).
- QMD musi być dostępne w `PATH` gateway.
- macOS i Linux działają od razu. Windows jest najlepiej obsługiwany przez WSL2.

### Włączanie

```json5
{
  memory: {
    backend: "qmd",
  },
}
```

OpenClaw tworzy samowystarczalny katalog domowy QMD w
`~/.openclaw/agents/<agentId>/qmd/` i automatycznie zarządza cyklem życia sidecara
— kolekcje, aktualizacje i uruchomienia embeddingów są obsługiwane za Ciebie.
Preferuje bieżące kształty kolekcji QMD i zapytań MCP, ale nadal wraca do
starszych flag kolekcji `--mask` i starszych nazw narzędzi MCP, gdy jest to potrzebne.
Rekonsyliacja przy starcie odtwarza też nieaktualne zarządzane kolekcje z powrotem do ich
kanonicznych wzorców, gdy nadal istnieje starsza kolekcja QMD o tej samej nazwie.

## Jak działa sidecar

- OpenClaw tworzy kolekcje z plików pamięci obszaru roboczego oraz wszystkich
  ścieżek skonfigurowanych w `memory.qmd.paths`, a następnie uruchamia `qmd update` + `qmd embed` przy starcie
  i okresowo (domyślnie co 5 minut).
- Domyślna kolekcja obszaru roboczego śledzi `MEMORY.md` oraz drzewo `memory/`.
  Małe litery `memory.md` nie są indeksowane jako główny plik pamięci.
- Odświeżanie przy starcie działa w tle, więc uruchamianie czatu nie jest blokowane.
- Wyszukiwania używają skonfigurowanego `searchMode` (domyślnie: `search`; obsługuje także
  `vsearch` i `query`). Jeśli tryb zawiedzie, OpenClaw ponawia próbę z `qmd query`.
- Jeśli QMD całkowicie zawiedzie, OpenClaw wraca do wbudowanego silnika SQLite.

<Info>
Pierwsze wyszukiwanie może być wolne — QMD automatycznie pobiera modele GGUF (~2 GB) do
rerankingu i rozwijania zapytań przy pierwszym uruchomieniu `qmd query`.
</Info>

## Nadpisania modeli

Zmienne środowiskowe modeli QMD są przekazywane bez zmian z procesu
gateway, więc możesz stroić QMD globalnie bez dodawania nowej konfiguracji OpenClaw:

```bash
export QMD_EMBED_MODEL="hf:Qwen/Qwen3-Embedding-0.6B-GGUF/Qwen3-Embedding-0.6B-Q8_0.gguf"
export QMD_RERANK_MODEL="/absolute/path/to/reranker.gguf"
export QMD_GENERATE_MODEL="/absolute/path/to/generator.gguf"
```

Po zmianie modelu embeddingów uruchom embeddingi ponownie, aby indeks pasował do
nowej przestrzeni wektorowej.

## Indeksowanie dodatkowych ścieżek

Skieruj QMD na dodatkowe katalogi, aby można je było przeszukiwać:

```json5
{
  memory: {
    backend: "qmd",
    qmd: {
      paths: [{ name: "docs", path: "~/notes", pattern: "**/*.md" }],
    },
  },
}
```

Fragmenty z dodatkowych ścieżek pojawiają się jako `qmd/<collection>/<relative-path>` w
wynikach wyszukiwania. `memory_get` rozumie ten prefiks i odczytuje z właściwego
katalogu głównego kolekcji.

## Indeksowanie transkryptów sesji

Włącz indeksowanie sesji, aby przywoływać wcześniejsze rozmowy:

```json5
{
  memory: {
    backend: "qmd",
    qmd: {
      sessions: { enabled: true },
    },
  },
}
```

Transkrypty są eksportowane jako zsanityzowane tury User/Assistant do dedykowanej kolekcji QMD
w `~/.openclaw/agents/<id>/qmd/sessions/`.

## Zakres wyszukiwania

Domyślnie wyniki wyszukiwania QMD są udostępniane w sesjach bezpośrednich i kanałowych
(nie grupowych). Aby to zmienić, skonfiguruj `memory.qmd.scope`:

```json5
{
  memory: {
    qmd: {
      scope: {
        default: "deny",
        rules: [{ action: "allow", match: { chatType: "direct" } }],
      },
    },
  },
}
```

Gdy zakres odrzuca wyszukiwanie, OpenClaw zapisuje ostrzeżenie z wyprowadzonym kanałem i
typem czatu, dzięki czemu puste wyniki są łatwiejsze do debugowania.

## Cytowania

Gdy `memory.citations` ma wartość `auto` lub `on`, fragmenty wyszukiwania zawierają
stopkę `Source: <path#line>`. Ustaw `memory.citations = "off"`, aby pominąć stopkę,
nadal przekazując ścieżkę agentowi wewnętrznie.

## Kiedy używać

Wybierz QMD, gdy potrzebujesz:

- Rerankingu dla wyników wyższej jakości.
- Przeszukiwania dokumentacji projektu lub notatek poza obszarem roboczym.
- Przywoływania wcześniejszych rozmów z sesji.
- W pełni lokalnego wyszukiwania bez kluczy API.

W prostszych konfiguracjach [wbudowany silnik](/pl/concepts/memory-builtin) działa dobrze
bez dodatkowych zależności.

## Rozwiązywanie problemów

**Nie znaleziono QMD?** Upewnij się, że plik binarny jest dostępny w `PATH` gateway. Jeśli OpenClaw
działa jako usługa, utwórz dowiązanie symboliczne:
`sudo ln -s ~/.bun/bin/qmd /usr/local/bin/qmd`.

**Pierwsze wyszukiwanie jest bardzo wolne?** QMD pobiera modele GGUF przy pierwszym użyciu. Rozgrzej je wcześniej
przez `qmd query "test"` z użyciem tych samych katalogów XDG, których używa OpenClaw.

**Wyszukiwanie przekracza limit czasu?** Zwiększ `memory.qmd.limits.timeoutMs` (domyślnie: 4000 ms).
Ustaw `120000` dla wolniejszego sprzętu.

**Puste wyniki w czatach grupowych?** Sprawdź `memory.qmd.scope` — domyślna konfiguracja
zezwala tylko na sesje bezpośrednie i kanałowe.

**Wyszukiwanie w głównej pamięci nagle stało się zbyt szerokie?** Uruchom ponownie gateway lub poczekaj do
następnej rekonsyliacji przy starcie. OpenClaw odtwarza nieaktualne zarządzane kolekcje
z powrotem do kanonicznych wzorców `MEMORY.md` i `memory/`, gdy wykryje konflikt
tej samej nazwy.

**Tymczasowe repozytoria widoczne w obszarze roboczym powodują `ENAMETOOLONG` albo uszkodzone indeksowanie?**
Przechodzenie QMD obecnie podąża za zachowaniem skanera bazowego QMD, a nie za
wbudowanymi regułami dowiązań symbolicznych OpenClaw. Trzymaj tymczasowe checkouty monorepo w
ukrytych katalogach takich jak `.tmp/` albo poza indeksowanymi katalogami głównymi QMD, dopóki QMD nie udostępni
bezpiecznego względem cykli przechodzenia albo jawnych mechanizmów wykluczania.

## Konfiguracja

Pełną powierzchnię konfiguracji (`memory.qmd.*`), tryby wyszukiwania, interwały
aktualizacji, reguły zakresu i wszystkie pozostałe ustawienia znajdziesz w
[Dokumentacji konfiguracji pamięci](/pl/reference/memory-config).

## Powiązane

- [Przegląd pamięci](/pl/concepts/memory)
- [Wbudowany silnik pamięci](/pl/concepts/memory-builtin)
- [Pamięć Honcho](/pl/concepts/memory-honcho)
