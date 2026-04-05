---
read_when:
    - Chcesz skonfigurować QMD jako backend pamięci
    - Chcesz korzystać z zaawansowanych funkcji pamięci, takich jak reranking lub dodatkowe indeksowane ścieżki
summary: Lokalny sidecar wyszukiwania z BM25, wektorami, rerankingiem i rozszerzaniem zapytań
title: Silnik pamięci QMD
x-i18n:
    generated_at: "2026-04-05T13:50:50Z"
    model: gpt-5.4
    provider: openai
    source_hash: fa8a31ec1a6cc83b6ab413b7dbed6a88055629251664119bfd84308ed166c58e
    source_path: concepts/memory-qmd.md
    workflow: 15
---

# Silnik pamięci QMD

[QMD](https://github.com/tobi/qmd) to lokalny sidecar wyszukiwania działający
obok OpenClaw. Łączy BM25, wyszukiwanie wektorowe i reranking w jednym
pliku binarnym oraz może indeksować treści wykraczające poza pliki pamięci workspace.

## Co dodaje ponad wbudowane rozwiązanie

- **Reranking i rozszerzanie zapytań** dla lepszego odzyskiwania wyników.
- **Indeksowanie dodatkowych katalogów** -- dokumentacja projektu, notatki zespołu, wszystko na dysku.
- **Indeksowanie transkryptów sesji** -- przywoływanie wcześniejszych rozmów.
- **W pełni lokalnie** -- działa przez Bun + node-llama-cpp, automatycznie pobiera modele GGUF.
- **Automatyczny fallback** -- jeśli QMD jest niedostępne, OpenClaw płynnie wraca do
  wbudowanego silnika.

## Pierwsze kroki

### Wymagania wstępne

- Zainstaluj QMD: `bun install -g @tobilu/qmd`
- Kompilacja SQLite pozwalająca na rozszerzenia (`brew install sqlite` na macOS).
- QMD musi znajdować się w `PATH` gateway.
- macOS i Linux działają od razu po instalacji. Windows jest najlepiej obsługiwany przez WSL2.

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
-- kolekcje, aktualizacje i uruchomienia embeddingów są obsługiwane za Ciebie.

## Jak działa sidecar

- OpenClaw tworzy kolekcje z plików pamięci workspace i wszelkich
  skonfigurowanych `memory.qmd.paths`, a następnie uruchamia `qmd update` + `qmd embed` przy starcie
  i okresowo (domyślnie co 5 minut).
- Odświeżanie przy starcie działa w tle, więc uruchomienie czatu nie jest blokowane.
- Wyszukiwania używają skonfigurowanego `searchMode` (domyślnie: `search`; obsługiwane są też
  `vsearch` i `query`). Jeśli dany tryb zawiedzie, OpenClaw ponawia próbę z `qmd query`.
- Jeśli QMD całkowicie zawiedzie, OpenClaw wraca do wbudowanego silnika SQLite.

<Info>
Pierwsze wyszukiwanie może być wolne -- QMD automatycznie pobiera modele GGUF (~2 GB) do
rerankingu i rozszerzania zapytań przy pierwszym uruchomieniu `qmd query`.
</Info>

## Indeksowanie dodatkowych ścieżek

Skieruj QMD na dodatkowe katalogi, aby można było je przeszukiwać:

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
wynikach wyszukiwania. `memory_get` rozumie ten prefiks i odczytuje z poprawnego
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

Transkrypty są eksportowane jako oczyszczone tury User/Assistant do dedykowanej kolekcji QMD
w `~/.openclaw/agents/<id>/qmd/sessions/`.

## Zakres wyszukiwania

Domyślnie wyniki wyszukiwania QMD są pokazywane tylko w sesjach DM (nie w grupach ani
kanałach). Aby to zmienić, skonfiguruj `memory.qmd.scope`:

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
typem czatu, dzięki czemu puste wyniki łatwiej debugować.

## Cytowania

Gdy `memory.citations` ma wartość `auto` lub `on`, fragmenty wyszukiwania zawierają
stopkę `Source: <path#line>`. Ustaw `memory.citations = "off"`, aby pominąć stopkę,
jednocześnie nadal przekazując ścieżkę agentowi wewnętrznie.

## Kiedy używać

Wybierz QMD, gdy potrzebujesz:

- Rerankingu dla wyników wyższej jakości.
- Przeszukiwania dokumentacji projektu lub notatek poza workspace.
- Przywoływania wcześniejszych rozmów z sesji.
- W pełni lokalnego wyszukiwania bez kluczy API.

W przypadku prostszych konfiguracji [wbudowany silnik](/concepts/memory-builtin) działa dobrze
bez dodatkowych zależności.

## Rozwiązywanie problemów

**Nie znaleziono QMD?** Upewnij się, że plik binarny jest w `PATH` gateway. Jeśli OpenClaw
działa jako usługa, utwórz dowiązanie symboliczne:
`sudo ln -s ~/.bun/bin/qmd /usr/local/bin/qmd`.

**Pierwsze wyszukiwanie jest bardzo wolne?** QMD pobiera modele GGUF przy pierwszym użyciu. Wstępnie rozgrzej
je za pomocą `qmd query "test"` z użyciem tych samych katalogów XDG, których używa OpenClaw.

**Wyszukiwanie przekracza limit czasu?** Zwiększ `memory.qmd.limits.timeoutMs` (domyślnie: 4000 ms).
Ustaw na `120000` dla wolniejszego sprzętu.

**Puste wyniki w czatach grupowych?** Sprawdź `memory.qmd.scope` -- domyślnie
dozwolone są tylko sesje DM.

**Tymczasowe repozytoria widoczne w workspace powodują `ENAMETOOLONG` lub uszkodzone indeksowanie?**
Przechodzenie QMD obecnie podąża za zachowaniem bazowego skanera QMD zamiast
wbudowanych reguł dowiązań symbolicznych OpenClaw. Trzymaj tymczasowe checkouty monorepo w
ukrytych katalogach takich jak `.tmp/` lub poza indeksowanymi katalogami głównymi QMD, dopóki QMD nie udostępni
bezpiecznego wobec cykli przechodzenia albo jawnych mechanizmów wykluczania.

## Konfiguracja

Pełną powierzchnię config (`memory.qmd.*`), tryby wyszukiwania, interwały aktualizacji,
reguły zakresu i wszystkie pozostałe ustawienia znajdziesz w
[dokumentacji konfiguracji pamięci](/reference/memory-config).
