---
read_when:
    - Chcesz skonfigurować QMD jako backend pamięci
    - Chcesz zaawansowanych funkcji pamięci, takich jak ponowne rankingowanie lub dodatkowe indeksowane ścieżki
summary: Lokalny sidecar wyszukiwania z BM25, wektorami, ponownym rankingowaniem i rozszerzaniem zapytań
title: Silnik pamięci QMD
x-i18n:
    generated_at: "2026-06-27T17:26:59Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 101a29a88a34ebbb6f9414fc91f599db2a6f098bd8c320737d3c8fbc78785f4a
    source_path: concepts/memory-qmd.md
    workflow: 16
---

[QMD](https://github.com/tobi/qmd) to lokalny przede wszystkim proces pomocniczy wyszukiwania, który działa
obok OpenClaw. Łączy BM25, wyszukiwanie wektorowe i ponowne rankingowanie w jednym
pliku binarnym oraz może indeksować treści poza plikami pamięci w Twoim obszarze roboczym.

## Co dodaje względem wbudowanego rozwiązania

- **Ponowne rankingowanie i rozszerzanie zapytań** dla lepszego przypominania.
- **Indeksowanie dodatkowych katalogów** -- dokumentacja projektu, notatki zespołu, wszystko na dysku.
- **Indeksowanie transkrypcji sesji** -- przywoływanie wcześniejszych rozmów.
- **W pełni lokalne działanie** -- działa z oficjalnym Pluginem dostawcy llama.cpp i
  automatycznie pobiera modele GGUF.
- **Automatyczne przełączanie awaryjne** -- jeśli QMD jest niedostępne, OpenClaw płynnie przełącza się na
  wbudowany silnik.

## Pierwsze kroki

### Wymagania wstępne

- Zainstaluj QMD: `npm install -g @tobilu/qmd` lub `bun install -g @tobilu/qmd`
- Kompilacja SQLite zezwalająca na rozszerzenia (`brew install sqlite` na macOS).
- QMD musi znajdować się w `PATH` Gateway.
- macOS i Linux działają od razu. Windows jest najlepiej obsługiwany przez WSL2.

### Włączanie

```json5
{
  memory: {
    backend: "qmd",
  },
}
```

OpenClaw tworzy samodzielny katalog domowy QMD pod
`~/.openclaw/agents/<agentId>/qmd/` i automatycznie zarządza cyklem życia procesu pomocniczego
-- kolekcje, aktualizacje i przebiegi osadzania są obsługiwane za Ciebie.
Preferuje bieżące kształty kolekcji QMD i zapytań MCP, ale w razie potrzeby nadal przełącza się na
alternatywne flagi wzorców kolekcji i starsze nazwy narzędzi MCP.
Uzgadnianie podczas rozruchu odtwarza też przestarzałe zarządzane kolekcje z powrotem do ich
kanonicznych wzorców, gdy starsza kolekcja QMD o tej samej nazwie jest nadal
obecna.

## Jak działa proces pomocniczy

- OpenClaw tworzy kolekcje z plików pamięci Twojego obszaru roboczego i dowolnych
  skonfigurowanych `memory.qmd.paths`, a następnie uruchamia `qmd update` po
  otwarciu menedżera QMD i okresowo później (domyślnie co 5 minut). Te odświeżenia
  działają przez podprocesy QMD, a nie przez skanowanie systemu plików w procesie. Tryby semantyczne
  uruchamiają też `qmd embed`.
- Domyślna kolekcja obszaru roboczego śledzi `MEMORY.md` oraz drzewo `memory/`.
  Plik `memory.md` pisany małymi literami nie jest indeksowany jako główny plik pamięci.
- Własny skaner QMD ignoruje ukryte ścieżki i typowe katalogi zależności/kompilacji
  takie jak `.git`, `.cache`, `node_modules`, `vendor`, `dist` i
  `build`. Uruchomienie Gateway domyślnie nie inicjuje QMD, więc zimny start
  unika importowania środowiska wykonawczego pamięci lub tworzenia długotrwałego obserwatora przed
  pierwszym użyciem pamięci.
- Jeśli mimo to chcesz inicjować QMD przy starcie Gateway, ustaw
  `memory.qmd.update.startup` na `idle` lub `immediate`. Przy
  `memory.qmd.update.onBoot: true` start uruchamia początkowe odświeżenie. Przy
  `onBoot: false` start pomija to natychmiastowe odświeżenie, ale nadal otwiera
  długotrwały menedżer, gdy skonfigurowane są interwały aktualizacji lub osadzania, dzięki czemu QMD może
  posiadać swój zwykły obserwator i timery.
- Wyszukiwania używają skonfigurowanego `searchMode` (domyślnie: `search`; obsługiwane są też
  `vsearch` i `query`). `search` jest wyłącznie BM25, więc OpenClaw pomija semantyczne
  sondy gotowości wektorowej i utrzymanie osadzeń w tym trybie. Jeśli tryb
  zawiedzie, OpenClaw ponawia próbę z `qmd query`.
- Gdy `searchMode` to `query`, ustaw `memory.qmd.rerank` na `false`, aby używać hybrydowej
  ścieżki zapytań QMD bez rerankera. OpenClaw przekazuje `--no-rerank` do
  bezpośredniej ścieżki CLI QMD oraz `rerank: false` do narzędzia zapytań MCP QMD. Ta opcja
  wymaga QMD 2.1 lub nowszego.
- W wydaniach QMD, które deklarują filtry wielu kolekcji, OpenClaw grupuje
  kolekcje z tego samego źródła w jedno wywołanie wyszukiwania QMD. Starsze wydania QMD
  zachowują zgodne przełączanie awaryjne per kolekcja.
- Jeśli QMD całkowicie zawiedzie, OpenClaw przełącza się na wbudowany silnik SQLite.
  Powtarzające się próby w turach czatu po nieudanym otwarciu na krótko się wycofują, aby
  brakujący plik binarny lub uszkodzona zależność procesu pomocniczego nie tworzyły burzy ponowień;
  `openclaw memory status` i jednorazowe sondy CLI nadal sprawdzają QMD bezpośrednio.

<Info>
Pierwsze wyszukiwanie może być wolne -- QMD automatycznie pobiera modele GGUF (~2 GB) do
ponownego rankingowania i rozszerzania zapytań przy pierwszym uruchomieniu `qmd query`.
</Info>

## Wydajność wyszukiwania i zgodność

OpenClaw utrzymuje ścieżkę wyszukiwania QMD zgodną zarówno z bieżącymi, jak i starszymi
instalacjami QMD.

Podczas startu OpenClaw sprawdza tekst pomocy zainstalowanego QMD raz na menedżera. Jeśli
plik binarny deklaruje obsługę filtrów wielu kolekcji, OpenClaw przeszukuje wszystkie
kolekcje z tego samego źródła jednym poleceniem:

```bash
qmd search "router notes" --json -n 10 -c memory-root-main -c memory-dir-main
```

Pozwala to uniknąć uruchamiania jednego podprocesu QMD dla każdej kolekcji trwałej pamięci.
Kolekcje transkrypcji sesji pozostają we własnej grupie źródeł, więc mieszane
wyszukiwania `memory` + `sessions` nadal dostarczają dywersyfikatorowi wyników dane z obu
źródeł.

Starsze kompilacje QMD akceptują tylko jeden filtr kolekcji. Gdy OpenClaw wykryje jedną
z takich kompilacji, zachowuje ścieżkę zgodności i przeszukuje każdą kolekcję
osobno przed scaleniem i deduplikacją wyników.

Aby ręcznie sprawdzić zainstalowany kontrakt, uruchom:

```bash
qmd --help | grep -i collection
```

Bieżąca pomoc QMD mówi, że filtry kolekcji mogą wskazywać jedną lub więcej kolekcji.
Starsza pomoc zwykle opisuje pojedynczą kolekcję.

## Nadpisania modeli

Zmienne środowiskowe modeli QMD przechodzą bez zmian z procesu Gateway,
więc możesz stroić QMD globalnie bez dodawania nowej konfiguracji OpenClaw:

```bash
export QMD_EMBED_MODEL="hf:Qwen/Qwen3-Embedding-0.6B-GGUF/Qwen3-Embedding-0.6B-Q8_0.gguf"
export QMD_RERANK_MODEL="/absolute/path/to/reranker.gguf"
export QMD_GENERATE_MODEL="/absolute/path/to/generator.gguf"
```

Po zmianie modelu osadzania uruchom osadzania ponownie, aby indeks odpowiadał
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
wynikach wyszukiwania. `memory_get` rozumie ten prefiks i czyta z właściwego
katalogu głównego kolekcji.

## Indeksowanie transkrypcji sesji

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

Transkrypcje są eksportowane jako oczyszczone tury User/Assistant do dedykowanej kolekcji QMD
pod `~/.openclaw/agents/<id>/qmd/sessions/`.

## Zakres wyszukiwania

Domyślnie wyniki wyszukiwania QMD są udostępniane w sesjach bezpośrednich i kanałowych
(nie w grupach). Skonfiguruj `memory.qmd.scope`, aby to zmienić:

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

Gdy zakres odmawia wyszukiwania, OpenClaw rejestruje ostrzeżenie z wyprowadzonym kanałem i
typem czatu, aby łatwiej debugować puste wyniki.

## Cytowania

Gdy `memory.citations` ma wartość `auto` lub `on`, fragmenty wyszukiwania zawierają
stopkę `Source: <path#line>`. Ustaw `memory.citations = "off"`, aby pominąć stopkę,
nadal przekazując ścieżkę wewnętrznie do agenta.

## Kiedy używać

Wybierz QMD, gdy potrzebujesz:

- Ponownego rankingowania dla wyników wyższej jakości.
- Przeszukiwania dokumentacji projektu lub notatek poza obszarem roboczym.
- Przywoływania rozmów z wcześniejszych sesji.
- W pełni lokalnego wyszukiwania bez kluczy API.

W prostszych konfiguracjach [wbudowany silnik](/pl/concepts/memory-builtin) działa dobrze
bez dodatkowych zależności.

## Rozwiązywanie problemów

**Nie znaleziono QMD?** Upewnij się, że plik binarny znajduje się w `PATH` Gateway. Jeśli OpenClaw
działa jako usługa, utwórz dowiązanie symboliczne:
`sudo ln -s ~/.bun/bin/qmd /usr/local/bin/qmd`.

Jeśli `qmd --version` działa w Twojej powłoce, ale OpenClaw nadal zgłasza
`spawn qmd ENOENT`, proces Gateway prawdopodobnie ma inne `PATH` niż Twoja
powłoka interaktywna. Przypnij plik binarny jawnie:

```json5
{
  memory: {
    backend: "qmd",
    qmd: {
      command: "/absolute/path/to/qmd",
    },
  },
}
```

Użyj `command -v qmd` w środowisku, w którym QMD jest zainstalowane, a następnie sprawdź ponownie
przez `openclaw memory status --deep`.

**Pierwsze wyszukiwanie jest bardzo wolne?** QMD pobiera modele GGUF przy pierwszym użyciu. Rozgrzej
je poleceniem `qmd query "test"` przy użyciu tych samych katalogów XDG, których używa OpenClaw.

**Wiele podprocesów QMD podczas wyszukiwania?** Zaktualizuj QMD, jeśli to możliwe. OpenClaw używa
jednego procesu dla wyszukiwań wielu kolekcji z tego samego źródła tylko wtedy, gdy zainstalowane
QMD deklaruje obsługę wielu filtrów `-c`; w przeciwnym razie zachowuje starsze
przełączanie awaryjne per kolekcja ze względu na poprawność.

**QMD tylko BM25 nadal próbuje budować llama.cpp?** Ustaw
`memory.qmd.searchMode = "search"`. OpenClaw traktuje ten tryb jako wyłącznie leksykalny,
nie uruchamia sond statusu wektorów QMD ani utrzymania osadzeń i pozostawia
semantyczne sprawdzanie gotowości konfiguracjom `vsearch` lub `query`.

**Wyszukiwanie przekracza limit czasu?** Zwiększ `memory.qmd.limits.timeoutMs` (domyślnie: 4000ms).
Ustaw `120000` dla wolniejszego sprzętu.

**Puste wyniki w czatach grupowych?** Sprawdź `memory.qmd.scope` -- domyślnie zezwala tylko
na sesje bezpośrednie i kanałowe.

**Wyszukiwanie pamięci głównej nagle stało się zbyt szerokie?** Uruchom ponownie Gateway lub poczekaj na
następne uzgadnianie startowe. OpenClaw odtwarza przestarzałe zarządzane kolekcje
z powrotem do kanonicznych wzorców `MEMORY.md` i `memory/`, gdy wykryje konflikt
tej samej nazwy.

**Repozytoria tymczasowe widoczne w obszarze roboczym powodują `ENAMETOOLONG` lub uszkodzone indeksowanie?**
Przechodzenie QMD obecnie podąża za zachowaniem bazowego skanera QMD, a nie za
wbudowanymi regułami dowiązań symbolicznych OpenClaw. Trzymaj tymczasowe checkouty monorepo w
ukrytych katalogach takich jak `.tmp/` albo poza indeksowanymi katalogami głównymi QMD, dopóki QMD nie udostępni
przechodzenia odpornego na cykle lub jawnych mechanizmów wykluczania.

## Konfiguracja

Pełną powierzchnię konfiguracji (`memory.qmd.*`), tryby wyszukiwania, interwały aktualizacji,
reguły zakresu i wszystkie inne ustawienia znajdziesz w
[referencji konfiguracji pamięci](/pl/reference/memory-config).

## Powiązane

- [Omówienie pamięci](/pl/concepts/memory)
- [Wbudowany silnik pamięci](/pl/concepts/memory-builtin)
- [Pamięć Honcho](/pl/concepts/memory-honcho)
