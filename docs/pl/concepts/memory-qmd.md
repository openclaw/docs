---
read_when:
    - Chcesz skonfigurować QMD jako backend pamięci
    - Chcesz korzystać z zaawansowanych funkcji pamięci, takich jak ponowne rankingowanie lub dodatkowe indeksowane ścieżki
summary: Sidecar wyszukiwania działający najpierw lokalnie, z BM25, wektorami, rerankingiem i rozszerzaniem zapytań
title: Silnik pamięci QMD
x-i18n:
    generated_at: "2026-06-28T22:33:37Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 14af147882829451f026f0b9b6cc052c6e2129626a4ab0d0b1c7b77a31c1c050
    source_path: concepts/memory-qmd.md
    workflow: 16
---

[QMD](https://github.com/tobi/qmd) to lokalny, priorytetowo działający po stronie użytkownika sidecar wyszukiwania, który działa
obok OpenClaw. Łączy BM25, wyszukiwanie wektorowe i reranking w jednym
pliku binarnym oraz może indeksować treści wykraczające poza pliki pamięci obszaru roboczego.

## Co dodaje względem wbudowanego rozwiązania

- **Reranking i rozszerzanie zapytań** dla lepszego przywoływania wyników.
- **Indeksowanie dodatkowych katalogów** -- dokumentacja projektu, notatki zespołu, wszystko na dysku.
- **Indeksowanie transkrypcji sesji** -- przywoływanie wcześniejszych rozmów.
- **W pełni lokalnie** -- działa z oficjalnym pluginem dostawcy llama.cpp i
  automatycznie pobiera modele GGUF.
- **Automatyczny fallback** -- jeśli QMD jest niedostępne, OpenClaw płynnie wraca do
  wbudowanego silnika.

## Pierwsze kroki

### Wymagania wstępne

- Zainstaluj QMD: `npm install -g @tobilu/qmd` lub `bun install -g @tobilu/qmd`
- Kompilacja SQLite, która zezwala na rozszerzenia (`brew install sqlite` w macOS).
- QMD musi znajdować się w `PATH` gatewaya.
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
-- kolekcje, aktualizacje i uruchomienia embeddingów są obsługiwane za Ciebie.
Preferuje bieżące kształty kolekcji QMD i zapytań MCP, ale nadal w razie potrzeby wraca do
alternatywnych flag wzorców kolekcji i starszych nazw narzędzi MCP.
Uzgadnianie przy uruchomieniu odtwarza też nieaktualne zarządzane kolekcje z powrotem do ich
kanonicznych wzorców, gdy starsza kolekcja QMD o tej samej nazwie nadal jest
obecna.

## Jak działa sidecar

- OpenClaw tworzy kolekcje z plików pamięci obszaru roboczego i dowolnych
  skonfigurowanych `memory.qmd.paths`, a następnie uruchamia `qmd update`, gdy menedżer QMD zostaje
  otwarty, oraz okresowo później (domyślnie co 5 minut). Te odświeżenia
  przechodzą przez podprocesy QMD, a nie przez skanowanie systemu plików w procesie. Tryby semantyczne
  uruchamiają także `qmd embed`.
- Domyślna kolekcja obszaru roboczego śledzi `MEMORY.md` oraz drzewo `memory/`.
  `memory.md` zapisane małymi literami nie jest indeksowane jako główny plik pamięci.
- Własny skaner QMD ignoruje ukryte ścieżki i typowe katalogi zależności/kompilacji,
  takie jak `.git`, `.cache`, `node_modules`, `vendor`, `dist` i
  `build`. Uruchomienie Gateway domyślnie nie inicjalizuje QMD, więc zimny start
  unika importowania runtime pamięci lub tworzenia długowiecznego obserwatora przed
  pierwszym użyciem pamięci.
- Jeśli mimo to chcesz inicjalizować QMD przy starcie Gateway, ustaw
  `memory.qmd.update.startup` na `idle` lub `immediate`. Przy
  `memory.qmd.update.onBoot: true` start uruchamia początkowe odświeżenie. Przy
  `onBoot: false` start pomija to natychmiastowe odświeżenie, ale nadal otwiera
  długowiecznego menedżera, gdy skonfigurowane są interwały aktualizacji lub embeddingów, aby QMD mogło
  zarządzać swoim regularnym obserwatorem i timerami.
- Wyszukiwania używają skonfigurowanego `searchMode` (domyślnie: `search`; obsługiwane są też
  `vsearch` i `query`). `search` jest wyłącznie BM25, więc OpenClaw pomija semantyczne
  sondy gotowości wektorów i utrzymanie embeddingów w tym trybie. Jeśli tryb
  zawiedzie, OpenClaw ponawia próbę z `qmd query`.
- Gdy `searchMode` to `query`, ustaw `memory.qmd.rerank` na `false`, aby używać hybrydowej
  ścieżki zapytań QMD bez rerankera. OpenClaw przekazuje `--no-rerank` do
  bezpośredniej ścieżki CLI QMD oraz `rerank: false` do narzędzia zapytań MCP QMD. Ta opcja
  wymaga QMD 2.1 lub nowszego.
- W wydaniach QMD, które ogłaszają filtry wielokolekcyjne, OpenClaw grupuje
  kolekcje z tego samego źródła w jedno wywołanie wyszukiwania QMD. Starsze wydania QMD
  zachowują zgodny fallback per kolekcja.
- Jeśli QMD całkowicie zawiedzie, OpenClaw wraca do wbudowanego silnika SQLite.
  Powtarzające się próby w turach czatu krótko wycofują się po błędzie otwarcia, aby
  brakujący plik binarny lub uszkodzona zależność sidecara nie utworzyły burzy ponowień;
  `openclaw memory status` i jednorazowe sondy CLI nadal ponownie sprawdzają QMD bezpośrednio.

<Info>
Pierwsze wyszukiwanie może być wolne -- QMD automatycznie pobiera modele GGUF (~2 GB) do
rerankingu i rozszerzania zapytań przy pierwszym uruchomieniu `qmd query`.
</Info>

## Wydajność wyszukiwania i zgodność

OpenClaw utrzymuje ścieżkę wyszukiwania QMD zgodną zarówno z bieżącymi, jak i starszymi
instalacjami QMD.

Przy starcie OpenClaw sprawdza tekst pomocy zainstalowanego QMD raz na menedżera. Jeśli
plik binarny ogłasza obsługę wielu filtrów kolekcji, OpenClaw przeszukuje wszystkie
kolekcje z tego samego źródła jednym poleceniem:

```bash
qmd search "router notes" --json -n 10 -c memory-root-main -c memory-dir-main
```

Pozwala to uniknąć uruchamiania jednego podprocesu QMD dla każdej kolekcji pamięci trwałej.
Kolekcje transkrypcji sesji pozostają we własnej grupie źródłowej, więc mieszane
wyszukiwania `memory` + `sessions` nadal dostarczają dywersyfikatorowi wyników wejście z obu
źródeł.

Starsze kompilacje QMD akceptują tylko jeden filtr kolekcji. Gdy OpenClaw wykryje jedną
z tych kompilacji, zachowuje ścieżkę zgodności i przeszukuje każdą kolekcję
osobno przed scaleniem i deduplikacją wyników.

Aby ręcznie sprawdzić zainstalowany kontrakt, uruchom:

```bash
qmd --help | grep -i collection
```

Bieżąca pomoc QMD mówi, że filtry kolekcji mogą kierować do jednej lub wielu kolekcji.
Starsza pomoc zwykle opisuje pojedynczą kolekcję.

## Nadpisania modeli

Zmienne środowiskowe modeli QMD przechodzą niezmienione z procesu Gateway,
więc możesz stroić QMD globalnie bez dodawania nowej konfiguracji OpenClaw:

```bash
export QMD_EMBED_MODEL="hf:Qwen/Qwen3-Embedding-0.6B-GGUF/Qwen3-Embedding-0.6B-Q8_0.gguf"
export QMD_RERANK_MODEL="/absolute/path/to/reranker.gguf"
export QMD_GENERATE_MODEL="/absolute/path/to/generator.gguf"
```

Po zmianie modelu embeddingów uruchom embeddingi ponownie, aby indeks pasował do
nowej przestrzeni wektorowej.

## Indeksowanie dodatkowych ścieżek

Wskaż QMD dodatkowe katalogi, aby można było je przeszukiwać:

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

Fragmenty z dodatkowych ścieżek pojawiają się w wynikach wyszukiwania jako `qmd/<collection>/<relative-path>`.
`memory_get` rozumie ten prefiks i czyta z właściwego
katalogu głównego kolekcji.

## Indeksowanie transkrypcji sesji

Włącz indeksowanie sesji, aby przywoływać wcześniejsze rozmowy. QMD potrzebuje zarówno ogólnego
źródła sesji `memorySearch`, jak i eksportera transkrypcji QMD:

```json5
{
  agents: {
    defaults: {
      memorySearch: {
        experimental: { sessionMemory: true },
        sources: ["memory", "sessions"],
      },
    },
  },
  memory: {
    backend: "qmd",
    qmd: {
      sessions: { enabled: true },
    },
  },
}
```

Transkrypcje są eksportowane jako oczyszczone tury User/Assistant do dedykowanej kolekcji QMD
pod `~/.openclaw/agents/<id>/qmd/sessions/`. Ustawienie wyłącznie
`memorySearch.experimental.sessionMemory` nie eksportuje transkrypcji do QMD.

Trafienia sesji nadal są filtrowane przez
[`tools.sessions.visibility`](/pl/gateway/config-tools#toolssessions). Domyślna
widoczność `tree` nie ujawnia niepowiązanych sesji tego samego agenta. Jeśli
sesja wysłana przez Gateway ma być możliwa do przywołania z osobnej sesji DM, ustaw
`tools.sessions.visibility: "agent"` celowo.

## Zakres wyszukiwania

Domyślnie wyniki wyszukiwania QMD są pokazywane w sesjach bezpośrednich i kanałowych
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

Gdy zakres odmawia wyszukiwania, OpenClaw zapisuje ostrzeżenie z wyprowadzonym kanałem i
typem czatu, aby łatwiej debugować puste wyniki.

## Cytowania

Gdy `memory.citations` ma wartość `auto` lub `on`, fragmenty wyszukiwania zawierają stopkę
`Source: <path#line>`. Ustaw `memory.citations = "off"`, aby pominąć stopkę,
nadal przekazując ścieżkę agentowi wewnętrznie.

## Kiedy używać

Wybierz QMD, gdy potrzebujesz:

- Rerankingu dla wyników wyższej jakości.
- Przeszukiwania dokumentacji projektu lub notatek poza obszarem roboczym.
- Przywoływania wcześniejszych rozmów z sesji.
- W pełni lokalnego wyszukiwania bez kluczy API.

Dla prostszych konfiguracji [wbudowany silnik](/pl/concepts/memory-builtin) działa dobrze
bez dodatkowych zależności.

## Rozwiązywanie problemów

**Nie znaleziono QMD?** Upewnij się, że plik binarny znajduje się w `PATH` Gateway. Jeśli OpenClaw
działa jako usługa, utwórz symlink:
`sudo ln -s ~/.bun/bin/qmd /usr/local/bin/qmd`.

Jeśli `qmd --version` działa w Twojej powłoce, ale OpenClaw nadal zgłasza
`spawn qmd ENOENT`, proces Gateway prawdopodobnie ma inny `PATH` niż Twoja
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

Użyj `command -v qmd` w środowisku, w którym zainstalowano QMD, a potem ponownie sprawdź
przez `openclaw memory status --deep`.

**Pierwsze wyszukiwanie jest bardzo wolne?** QMD pobiera modele GGUF przy pierwszym użyciu. Rozgrzej
je przez `qmd query "test"` z użyciem tych samych katalogów XDG, których używa OpenClaw.

**Wiele podprocesów QMD podczas wyszukiwania?** Zaktualizuj QMD, jeśli to możliwe. OpenClaw używa
jednego procesu dla wyszukiwań wielokolekcyjnych z tego samego źródła tylko wtedy, gdy zainstalowane
QMD ogłasza obsługę wielu filtrów `-c`; w przeciwnym razie zachowuje starszy
fallback per kolekcja dla poprawności.

**QMD tylko BM25 nadal próbuje budować llama.cpp?** Ustaw
`memory.qmd.searchMode = "search"`. OpenClaw traktuje ten tryb jako wyłącznie leksykalny,
nie uruchamia sond statusu wektorów QMD ani utrzymania embeddingów i pozostawia
semantyczne sprawdzanie gotowości konfiguracjom `vsearch` lub `query`.

**Wyszukiwanie przekracza limit czasu?** Zwiększ `memory.qmd.limits.timeoutMs` (domyślnie: 4000ms).
Ustaw `120000` dla wolniejszego sprzętu.

**Puste wyniki w czatach grupowych?** Sprawdź `memory.qmd.scope` -- domyślna konfiguracja
zezwala tylko na sesje bezpośrednie i kanałowe.

**Wyszukiwanie pamięci głównej nagle stało się zbyt szerokie?** Uruchom Gateway ponownie albo poczekaj na
następne uzgadnianie przy starcie. OpenClaw odtwarza nieaktualne zarządzane kolekcje
z powrotem do kanonicznych wzorców `MEMORY.md` i `memory/`, gdy wykryje konflikt
tej samej nazwy.

**Tymczasowe repozytoria widoczne w obszarze roboczym powodują `ENAMETOOLONG` lub uszkodzone indeksowanie?**
Przechodzenie QMD obecnie podąża za zachowaniem bazowego skanera QMD, a nie za
wbudowanymi zasadami symlinków OpenClaw. Trzymaj tymczasowe checkouty monorepo w
ukrytych katalogach, takich jak `.tmp/`, albo poza indeksowanymi katalogami głównymi QMD, dopóki QMD nie udostępni
przechodzenia bezpiecznego wobec cykli lub jawnych mechanizmów wykluczeń.

## Konfiguracja

Pełną powierzchnię konfiguracji (`memory.qmd.*`), tryby wyszukiwania, interwały aktualizacji,
reguły zakresu i wszystkie inne pokrętła opisuje
[referencja konfiguracji pamięci](/pl/reference/memory-config).

## Powiązane

- [Przegląd pamięci](/pl/concepts/memory)
- [Wbudowany silnik pamięci](/pl/concepts/memory-builtin)
- [Pamięć Honcho](/pl/concepts/memory-honcho)
