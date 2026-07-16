---
read_when:
    - Chcesz skonfigurować QMD jako backend pamięci
    - Potrzebne są zaawansowane funkcje pamięci, takie jak ponowne rankingowanie lub dodatkowe indeksowane ścieżki
summary: Lokalny moduł pomocniczy wyszukiwania z BM25, wektorami, ponownym rankingiem i rozszerzaniem zapytań
title: Mechanizm pamięci QMD
x-i18n:
    generated_at: "2026-07-16T18:18:45Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: b13017ead7e7340624a35e603a18216a5c23405cbab09e7f53b1e15d74d59d23
    source_path: concepts/memory-qmd.md
    workflow: 16
---

[QMD](https://github.com/tobi/qmd) to lokalny proces pomocniczy działający
obok OpenClaw. Łączy BM25, wyszukiwanie wektorowe i ponowne ustalanie rankingu w jednym
pliku binarnym oraz może indeksować treści wykraczające poza pliki pamięci obszaru roboczego.

## Co oferuje ponad wbudowany mechanizm

- **Ponowne ustalanie rankingu i rozszerzanie zapytań** zapewniające lepszą kompletność wyników.
- **Indeksowanie dodatkowych katalogów** — dokumentacji projektu, notatek zespołu i dowolnych danych na dysku.
- **Indeksowanie transkrypcji sesji** — przywoływanie wcześniejszych rozmów.
- **W pełni lokalne działanie** — korzysta z oficjalnego pluginu dostawcy llama.cpp i
  automatycznie pobiera modele GGUF.
- **Automatyczny mechanizm rezerwowy** — jeśli QMD jest niedostępny, OpenClaw płynnie przełącza się na
  wbudowany mechanizm.

## Pierwsze kroki

### Wymagania wstępne

- Zainstaluj QMD: `npm install -g @tobilu/qmd` lub `bun install -g @tobilu/qmd`
- Kompilacja SQLite umożliwiająca używanie rozszerzeń (`brew install sqlite` w systemie macOS).
- QMD musi znajdować się w `PATH` Gateway.
- Systemy macOS i Linux działają bez dodatkowej konfiguracji. W systemie Windows najlepszą obsługę zapewnia WSL2.

### Włączanie

```json5
{
  memory: {
    backend: "qmd",
  },
}
```

OpenClaw tworzy samowystarczalny katalog domowy QMD w
`~/.openclaw/agents/<agentId>/qmd/` i automatycznie zarządza cyklem życia
procesu pomocniczego — kolekcjami, aktualizacjami i uruchomieniami osadzania.
Preferuje aktualne formaty kolekcji QMD i zapytań MCP, ale w razie potrzeby
przełącza się na alternatywne flagi wzorców kolekcji i starsze nazwy narzędzi MCP.
Uzgadnianie podczas uruchamiania odtwarza również nieaktualne zarządzane kolekcje zgodnie z ich
kanonicznymi wzorcami, gdy nadal istnieje starsza kolekcja QMD o tej samej nazwie.

## Jak działa proces pomocniczy

- OpenClaw tworzy kolekcje z plików pamięci obszaru roboczego i wszystkich
  skonfigurowanych `memory.qmd.paths`, a następnie uruchamia `qmd update` podczas otwierania menedżera QMD
  i okresowo później (`memory.qmd.update.interval`, domyślnie
  `5m`). Odświeżanie odbywa się za pośrednictwem podprocesów QMD, a nie przez przeszukiwanie systemu plików
  wewnątrz procesu. Tryby wyszukiwania semantycznego uruchamiają także `qmd embed`
  (`memory.qmd.update.embedInterval`, domyślnie `60m`).
- Domyślna kolekcja obszaru roboczego śledzi `MEMORY.md` oraz drzewo `memory/`.
  Element `memory.md` zapisany małymi literami nie jest indeksowany jako główny plik pamięci.
- Własny skaner QMD ignoruje ukryte ścieżki oraz typowe katalogi zależności i kompilacji,
  takie jak `.git`, `.cache`, `node_modules`, `vendor`, `dist` i
  `build`. Uruchomienie Gateway domyślnie nie inicjalizuje QMD
  (`memory.qmd.update.startup` ma domyślną wartość `off`), dzięki czemu zimny start nie powoduje
  importowania środowiska wykonawczego pamięci ani tworzenia długotrwałego obserwatora przed
  pierwszym użyciem pamięci.
- Ustaw `memory.qmd.update.startup` na `idle` lub `immediate`, aby mimo to inicjalizować QMD
  podczas uruchamiania Gateway. `memory.qmd.update.onBoot` ma domyślną wartość `true` i
  wykonuje początkowe odświeżenie podczas uruchamiania; ustaw wartość `false`, aby pominąć to
  natychmiastowe odświeżenie (długotrwały menedżer nadal otwiera się, gdy skonfigurowano
  interwały aktualizacji lub osadzania, więc QMD nadal zarządza swoim zwykłym obserwatorem i czasomierzami).
- Wyszukiwania używają skonfigurowanego `searchMode` (domyślnie: `search`; obsługiwane są także
  `vsearch` i `query`). `search` korzysta wyłącznie z BM25, dlatego w tym trybie OpenClaw pomija
  sondy gotowości wektorów semantycznych i obsługę osadzeń. Jeśli tryb
  zawiedzie, OpenClaw ponawia próbę przy użyciu `qmd query`.
- Gdy `searchMode` ma wartość `query`, ustaw `memory.qmd.rerank` na `false`, aby używać
  hybrydowej ścieżki zapytań QMD bez modułu ponownego ustalania rankingu (wymaga QMD 2.1 lub nowszego).
  OpenClaw przekazuje `--no-rerank` bezpośredniej ścieżce CLI QMD oraz
  `rerank: false` narzędziu zapytań MCP QMD.
- W przypadku wydań QMD deklarujących obsługę filtrów wielu kolekcji OpenClaw grupuje
  kolekcje z tego samego źródła w jednym wywołaniu wyszukiwania QMD. Starsze wydania QMD
  zachowują zgodny mechanizm rezerwowy wyszukiwania osobno w każdej kolekcji.
- Jeśli QMD całkowicie zawiedzie, OpenClaw przełącza się na wbudowany mechanizm SQLite.
  Po niepowodzeniu otwarcia kolejne próby w turach czatu są na krótko wstrzymywane, aby
  brakujący plik binarny lub uszkodzona zależność procesu pomocniczego nie powodowały lawiny ponowień;
  `openclaw memory status` i jednorazowe sondy CLI nadal bezpośrednio
  sprawdzają QMD.

<Info>
Pierwsze wyszukiwanie może być powolne — podczas pierwszego uruchomienia `qmd query` QMD automatycznie pobiera modele GGUF (~2 GB) używane do
ponownego ustalania rankingu i rozszerzania zapytań.
</Info>

## Wydajność i zgodność wyszukiwania

OpenClaw utrzymuje zgodność ścieżki wyszukiwania QMD zarówno z aktualnymi, jak i starszymi
instalacjami QMD.

Podczas uruchamiania OpenClaw jednokrotnie dla każdego menedżera sprawdza tekst pomocy zainstalowanego QMD. Jeśli
plik binarny deklaruje obsługę wielu filtrów kolekcji, OpenClaw
przeszukuje wszystkie kolekcje z tego samego źródła jednym poleceniem:

```bash
qmd search "router notes" --json -n 10 -c memory-root-main -c memory-dir-main
```

Pozwala to uniknąć uruchamiania osobnego podprocesu QMD dla każdej kolekcji trwałej pamięci.
Kolekcje transkrypcji sesji pozostają we własnej grupie źródłowej, dzięki czemu mieszane
wyszukiwania `memory` + `sessions` nadal dostarczają mechanizmowi różnicowania wyników dane z
obu źródeł.

Starsze kompilacje QMD akceptują tylko jeden filtr kolekcji. Gdy OpenClaw wykryje jedną
z takich kompilacji, zachowuje ścieżkę zgodności i przeszukuje każdą kolekcję
osobno, a następnie scala wyniki i usuwa duplikaty.

Aby ręcznie sprawdzić zainstalowany kontrakt, uruchom:

```bash
qmd --help | grep -i collection
```

Pomoc aktualnej wersji QMD wspomina o kierowaniu wyszukiwania do co najmniej jednej kolekcji. Starsza pomoc
zwykle opisuje pojedynczą kolekcję.

## Nadpisywanie modeli

Zmienne środowiskowe modeli QMD są przekazywane bez zmian z procesu Gateway,
dzięki czemu można dostroić QMD globalnie bez dodawania nowej konfiguracji OpenClaw:

```bash
export QMD_EMBED_MODEL="hf:Qwen/Qwen3-Embedding-0.6B-GGUF/Qwen3-Embedding-0.6B-Q8_0.gguf"
export QMD_RERANK_MODEL="/absolute/path/to/reranker.gguf"
export QMD_GENERATE_MODEL="/absolute/path/to/generator.gguf"
```

Po zmianie modelu osadzania ponownie uruchom tworzenie osadzeń, aby indeks odpowiadał
nowej przestrzeni wektorowej.

## Indeksowanie dodatkowych ścieżek

Skieruj QMD do dodatkowych katalogów, aby umożliwić ich przeszukiwanie:

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
`memory_get` rozpoznaje ten prefiks i odczytuje dane z
właściwego katalogu głównego kolekcji.

## Indeksowanie transkrypcji sesji

Włącz indeksowanie sesji, aby przywoływać wcześniejsze rozmowy. QMD wymaga zarówno
ogólnego źródła sesji `memorySearch`, jak i eksportera transkrypcji QMD:

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

Transkrypcje są eksportowane jako oczyszczone tury użytkownika i asystenta do dedykowanej kolekcji QMD
w katalogu `~/.openclaw/agents/<id>/qmd/sessions/`. Ustawienie wyłącznie
`memorySearch.experimental.sessionMemory` nie eksportuje transkrypcji do
QMD.

Trafienia sesji są nadal filtrowane przez
[`tools.sessions.visibility`](/pl/gateway/config-tools#toolssessions). Domyślna widoczność
`tree` nie ujawnia niepowiązanych sesji tego samego agenta. Jeśli sesja
uruchomiona przez Gateway ma być dostępna do przywołania z osobnej sesji wiadomości prywatnej,
należy świadomie ustawić `tools.sessions.visibility: "agent"`.

## Zakres wyszukiwania

Domyślnie wyniki wyszukiwania QMD są udostępniane tylko w sesjach bezpośrednich (nie
w czatach grupowych ani kanałowych). Skonfiguruj `memory.qmd.scope`, aby to zmienić:

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

Powyższy fragment przedstawia faktyczną regułę domyślną. Gdy zakres odrzuca wyszukiwanie,
OpenClaw rejestruje ostrzeżenie z wyznaczonym kanałem i typem czatu, co ułatwia
debugowanie pustych wyników.

## Cytowania

Gdy `memory.citations` ma wartość `auto` lub `on`, do fragmentów wyników wyszukiwania
dołączana jest stopka `Source: <path>#L<line>` (lub `#L<start>-L<end>`). W trybie `auto`
stopka jest dodawana tylko w sesjach czatu bezpośredniego. Ustaw
`memory.citations = "off"`, aby pominąć stopkę, nadal przekazując ścieżkę
wewnętrznie agentowi.

## Kiedy używać

Wybierz QMD, gdy potrzebne jest:

- Ponowne ustalanie rankingu w celu uzyskania wyników wyższej jakości.
- Przeszukiwanie dokumentacji projektu lub notatek poza obszarem roboczym.
- Przywoływanie rozmów z wcześniejszych sesji.
- W pełni lokalne wyszukiwanie bez kluczy API.

W prostszych konfiguracjach [wbudowany mechanizm](/pl/concepts/memory-builtin) działa dobrze
bez dodatkowych zależności.

## Rozwiązywanie problemów

**Nie znaleziono QMD?** Upewnij się, że plik binarny znajduje się w `PATH` Gateway. Jeśli OpenClaw
działa jako usługa, utwórz dowiązanie symboliczne:
`sudo ln -s ~/.bun/bin/qmd /usr/local/bin/qmd`.

Jeśli `qmd --version` działa w powłoce, ale OpenClaw nadal zgłasza
`spawn qmd ENOENT`, proces Gateway prawdopodobnie ma inną wartość `PATH` niż
powłoka interaktywna. Jawnie przypnij plik binarny:

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

Użyj `command -v qmd` w środowisku, w którym zainstalowano QMD, a następnie sprawdź ponownie
za pomocą `openclaw memory status --deep`.

**Pierwsze wyszukiwanie jest bardzo powolne?** QMD pobiera modele GGUF przy pierwszym użyciu. Wstępnie je załaduj,
używając `qmd query "test"` z tymi samymi katalogami XDG, których używa OpenClaw.

**Wiele podprocesów QMD podczas wyszukiwania?** Jeśli to możliwe, zaktualizuj QMD. OpenClaw
używa jednego procesu do przeszukiwania wielu kolekcji z tego samego źródła tylko wtedy, gdy
zainstalowany QMD deklaruje obsługę wielu filtrów `-c`; w przeciwnym razie
dla zachowania poprawności używa starszego mechanizmu rezerwowego wyszukiwania osobno w każdej kolekcji.

**QMD działający wyłącznie z BM25 nadal próbuje kompilować llama.cpp?** Ustaw
`memory.qmd.searchMode = "search"`. OpenClaw traktuje ten tryb jako
wyłącznie leksykalny, pomija sondy stanu wektorów QMD i obsługę osadzeń oraz
pozostawia kontrole gotowości semantycznej konfiguracjom `vsearch` lub `query`.

**Wyszukiwanie przekracza limit czasu?** Zwiększ `memory.qmd.limits.timeoutMs` (domyślnie: 4000ms).
Ustaw wyższą wartość, na przykład `120000`, w przypadku wolniejszego sprzętu. Limit ten dotyczy
własnych poleceń wyszukiwania QMD podczas wywołań `memory_search` agenta; konfiguracja, synchronizacja,
wbudowany mechanizm rezerwowy i dodatkowa obsługa korpusu zachowują własne krótsze limity czasu.

**Puste wyniki w czatach grupowych lub kanałowych?** Jest to oczekiwane przy
domyślnym `memory.qmd.scope`, który zezwala tylko na sesje bezpośrednie. Dodaj regułę
`allow` dla typów czatu `group` lub `channel`, jeśli wyniki QMD mają być
tam dostępne.

**Wyszukiwanie w głównej pamięci nagle stało się zbyt szerokie?** Uruchom ponownie Gateway lub poczekaj
na kolejne uzgadnianie podczas uruchamiania. OpenClaw odtwarza nieaktualne zarządzane
kolekcje zgodnie z kanonicznymi wzorcami `MEMORY.md` i `memory/`, gdy
wykryje konflikt identycznych nazw.

**Repozytoria tymczasowe widoczne w obszarze roboczym powodują `ENAMETOOLONG` lub nieprawidłowe indeksowanie?**
Przechodzenie po drzewie QMD odbywa się zgodnie z bazowym skanerem QMD, a nie
wbudowanymi regułami dowiązań symbolicznych OpenClaw. Tymczasowe kopie robocze monorepo należy przechowywać w ukrytych
katalogach, takich jak `.tmp/`, lub poza indeksowanymi katalogami głównymi QMD, dopóki QMD nie udostępni
przechodzenia bezpiecznego względem cykli lub jawnych mechanizmów wykluczania.

## Konfiguracja

Pełny zakres konfiguracji (`memory.qmd.*`), tryby wyszukiwania, interwały aktualizacji,
reguły zakresu i wszystkie pozostałe ustawienia opisano w
[dokumentacji konfiguracji pamięci](/pl/reference/memory-config).

## Powiązane materiały

- [Omówienie pamięci](/pl/concepts/memory)
- [Wbudowany mechanizm pamięci](/pl/concepts/memory-builtin)
- [Pamięć Honcho](/pl/concepts/memory-honcho)
