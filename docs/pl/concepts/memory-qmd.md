---
read_when:
    - Chcesz skonfigurować QMD jako backend pamięci
    - Potrzebujesz zaawansowanych funkcji pamięci, takich jak ponowne ustalanie kolejności wyników lub dodatkowe indeksowane ścieżki
summary: Lokalny komponent pomocniczy wyszukiwania z BM25, wektorami, ponownym rankingiem i rozszerzaniem zapytań
title: Silnik pamięci QMD
x-i18n:
    generated_at: "2026-07-12T15:05:17Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: d4fc87c31835a6a1fdabbb271902334755b9801e51a5b2a3cb5525f1657e9317
    source_path: concepts/memory-qmd.md
    workflow: 16
---

[QMD](https://github.com/tobi/qmd) to lokalny proces pomocniczy wyszukiwania, który działa
obok OpenClaw. Łączy BM25, wyszukiwanie wektorowe i ponowne szeregowanie w jednym
pliku binarnym oraz może indeksować treści spoza plików pamięci obszaru roboczego.

## Co oferuje ponad wbudowany mechanizm

- **Ponowne szeregowanie i rozszerzanie zapytań** w celu uzyskania lepszego pokrycia wyników.
- **Indeksowanie dodatkowych katalogów** — dokumentacji projektu, notatek zespołu i dowolnych plików na dysku.
- **Indeksowanie transkrypcji sesji** — przywoływanie wcześniejszych rozmów.
- **W pełni lokalne działanie** — korzysta z oficjalnego pluginu dostawcy llama.cpp i
  automatycznie pobiera modele GGUF.
- **Automatyczny mechanizm zapasowy** — jeśli QMD jest niedostępny, OpenClaw płynnie
  przełącza się na wbudowany mechanizm.

## Pierwsze kroki

### Wymagania wstępne

- Zainstaluj QMD: `npm install -g @tobilu/qmd` lub `bun install -g @tobilu/qmd`
- Kompilacja SQLite obsługująca rozszerzenia (`brew install sqlite` w systemie macOS).
- QMD musi znajdować się w zmiennej `PATH` Gateway.
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
procesu pomocniczego — kolekcjami, aktualizacjami i generowaniem osadzeń.
Preferuje bieżące formaty kolekcji QMD i zapytań MCP, ale w razie potrzeby
korzysta z alternatywnych flag wzorców kolekcji i starszych nazw narzędzi MCP.
Uzgadnianie podczas uruchamiania odtwarza również nieaktualne zarządzane kolekcje
zgodnie z ich kanonicznymi wzorcami, gdy nadal istnieje starsza kolekcja QMD
o tej samej nazwie.

## Jak działa proces pomocniczy

- OpenClaw tworzy kolekcje z plików pamięci obszaru roboczego i wszystkich
  skonfigurowanych ścieżek `memory.qmd.paths`, a następnie uruchamia `qmd update`
  po otwarciu menedżera QMD oraz okresowo później (`memory.qmd.update.interval`,
  domyślnie `5m`). Odświeżanie odbywa się za pośrednictwem podprocesów QMD, a nie
  przez skanowanie systemu plików wewnątrz procesu. Tryby wyszukiwania semantycznego
  uruchamiają również `qmd embed` (`memory.qmd.update.embedInterval`, domyślnie `60m`).
- Domyślna kolekcja obszaru roboczego śledzi plik `MEMORY.md` oraz drzewo
  `memory/`. Plik `memory.md` pisany małymi literami nie jest indeksowany jako
  główny plik pamięci.
- Własny skaner QMD ignoruje ukryte ścieżki i typowe katalogi zależności lub
  wyników kompilacji, takie jak `.git`, `.cache`, `node_modules`, `vendor`, `dist`
  i `build`. Uruchomienie Gateway domyślnie nie inicjuje QMD
  (`memory.qmd.update.startup` ma domyślną wartość `off`), dzięki czemu zimny
  start nie importuje środowiska pamięci ani nie tworzy długotrwałego procesu
  obserwującego przed pierwszym użyciem pamięci.
- Ustaw `memory.qmd.update.startup` na `idle` lub `immediate`, aby mimo to
  zainicjować QMD podczas uruchamiania Gateway. `memory.qmd.update.onBoot` ma
  domyślną wartość `true` i uruchamia początkowe odświeżanie przy starcie;
  ustaw ją na `false`, aby pominąć to natychmiastowe odświeżanie (długotrwały
  menedżer nadal się otworzy, gdy skonfigurowano interwały aktualizacji lub
  osadzania, więc QMD nadal zarządza swoim zwykłym procesem obserwującym i
  licznikami czasu).
- Wyszukiwania używają skonfigurowanego trybu `searchMode` (domyślnie:
  `search`; obsługiwane są także `vsearch` i `query`). Tryb `search` korzysta
  wyłącznie z BM25, dlatego OpenClaw pomija w nim kontrole gotowości wektorów
  semantycznych i utrzymywanie osadzeń. Jeśli dany tryb zawiedzie, OpenClaw
  ponawia próbę za pomocą `qmd query`.
- Gdy `searchMode` ma wartość `query`, ustaw `memory.qmd.rerank` na `false`,
  aby użyć hybrydowej ścieżki zapytań QMD bez mechanizmu ponownego szeregowania
  (wymaga QMD 2.1 lub nowszego). OpenClaw przekazuje `--no-rerank` do
  bezpośredniej ścieżki CLI QMD oraz `rerank: false` do narzędzia zapytań MCP
  QMD.
- W wydaniach QMD deklarujących obsługę filtrów wielu kolekcji OpenClaw grupuje
  kolekcje z tego samego źródła w jednym wywołaniu wyszukiwania QMD. Starsze
  wydania QMD zachowują zgodny mechanizm zapasowy obsługujący każdą kolekcję
  oddzielnie.
- Jeśli QMD całkowicie zawiedzie, OpenClaw przełącza się na wbudowany mechanizm
  SQLite. Powtarzane próby podczas kolejnych tur czatu są krótko wstrzymywane
  po błędzie otwarcia, aby brak pliku binarnego lub uszkodzona zależność procesu
  pomocniczego nie powodowały lawiny ponownych prób; `openclaw memory status`
  i jednorazowe kontrole CLI nadal bezpośrednio sprawdzają QMD.

<Info>
Pierwsze wyszukiwanie może być powolne — przy pierwszym uruchomieniu `qmd query`
QMD automatycznie pobiera modele GGUF (około 2 GB) do ponownego szeregowania
i rozszerzania zapytań.
</Info>

## Wydajność i zgodność wyszukiwania

OpenClaw zachowuje zgodność ścieżki wyszukiwania QMD zarówno z bieżącymi, jak
i starszymi instalacjami QMD.

Podczas uruchamiania OpenClaw sprawdza tekst pomocy zainstalowanego QMD raz dla
każdego menedżera. Jeśli plik binarny deklaruje obsługę wielu filtrów kolekcji,
OpenClaw przeszukuje wszystkie kolekcje z tego samego źródła jednym poleceniem:

```bash
qmd search "router notes" --json -n 10 -c memory-root-main -c memory-dir-main
```

Pozwala to uniknąć uruchamiania osobnego podprocesu QMD dla każdej kolekcji
trwałej pamięci. Kolekcje transkrypcji sesji pozostają we własnej grupie
źródłowej, dlatego mieszane wyszukiwania `memory` + `sessions` nadal dostarczają
mechanizmowi różnicowania wyników dane z obu źródeł.

Starsze kompilacje QMD akceptują tylko jeden filtr kolekcji. Gdy OpenClaw
wykryje taką kompilację, zachowuje ścieżkę zgodności i przeszukuje każdą
kolekcję oddzielnie, a następnie scala i deduplikuje wyniki.

Aby ręcznie sprawdzić zainstalowany kontrakt, uruchom:

```bash
qmd --help | grep -i collection
```

Pomoc bieżącej wersji QMD wspomina o kierowaniu wyszukiwania do jednej lub
wielu kolekcji. Pomoc starszej wersji zwykle opisuje pojedynczą kolekcję.

## Nadpisywanie modeli

Zmienne środowiskowe modeli QMD są przekazywane bez zmian z procesu Gateway,
dzięki czemu można globalnie dostroić QMD bez dodawania nowej konfiguracji
OpenClaw:

```bash
export QMD_EMBED_MODEL="hf:Qwen/Qwen3-Embedding-0.6B-GGUF/Qwen3-Embedding-0.6B-Q8_0.gguf"
export QMD_RERANK_MODEL="/absolute/path/to/reranker.gguf"
export QMD_GENERATE_MODEL="/absolute/path/to/generator.gguf"
```

Po zmianie modelu osadzania ponownie wygeneruj osadzenia, aby indeks odpowiadał
nowej przestrzeni wektorowej.

## Indeksowanie dodatkowych ścieżek

Wskaż QMD dodatkowe katalogi, aby umożliwić ich przeszukiwanie:

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

Fragmenty z dodatkowych ścieżek pojawiają się w wynikach wyszukiwania jako
`qmd/<collection>/<relative-path>`. `memory_get` rozpoznaje ten prefiks i
odczytuje dane z właściwego katalogu głównego kolekcji.

## Indeksowanie transkrypcji sesji

Włącz indeksowanie sesji, aby przywoływać wcześniejsze rozmowy. QMD wymaga
zarówno ogólnego źródła sesji `memorySearch`, jak i eksportera transkrypcji QMD:

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

Transkrypcje są eksportowane jako oczyszczone tury użytkownika i asystenta do
dedykowanej kolekcji QMD w
`~/.openclaw/agents/<id>/qmd/sessions/`. Samo ustawienie
`memorySearch.experimental.sessionMemory` nie eksportuje transkrypcji do QMD.

Trafienia z sesji są nadal filtrowane przez
[`tools.sessions.visibility`](/pl/gateway/config-tools#toolssessions). Domyślna
widoczność `tree` nie udostępnia niepowiązanych sesji tego samego agenta. Jeśli
sesja rozdzielana przez Gateway ma być dostępna do przywołania z oddzielnej
sesji wiadomości bezpośrednich, świadomie ustaw
`tools.sessions.visibility: "agent"`.

## Zakres wyszukiwania

Domyślnie wyniki wyszukiwania QMD są udostępniane tylko w sesjach bezpośrednich
(a nie w czatach grupowych lub kanałowych). Aby to zmienić, skonfiguruj
`memory.qmd.scope`:

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

Powyższy fragment przedstawia rzeczywistą regułę domyślną. Gdy zakres blokuje
wyszukiwanie, OpenClaw rejestruje ostrzeżenie z ustalonym kanałem i typem czatu,
co ułatwia diagnozowanie pustych wyników.

## Cytowania

Gdy `memory.citations` ma wartość `auto` lub `on`, do fragmentów wyników
wyszukiwania dołączana jest stopka `Source: <path>#L<line>` (lub
`#L<start>-L<end>`). W trybie `auto` stopka jest dodawana tylko w sesjach czatu
bezpośredniego. Ustaw `memory.citations = "off"`, aby pominąć stopkę, nadal
przekazując agentowi ścieżkę wewnętrznie.

## Kiedy używać

Wybierz QMD, gdy potrzebujesz:

- Ponownego szeregowania w celu uzyskania wyników wyższej jakości.
- Przeszukiwania dokumentacji projektu lub notatek spoza obszaru roboczego.
- Przywoływania rozmów z wcześniejszych sesji.
- W pełni lokalnego wyszukiwania bez kluczy API.

W prostszych konfiguracjach [wbudowany mechanizm](/pl/concepts/memory-builtin)
działa dobrze bez dodatkowych zależności.

## Rozwiązywanie problemów

**Nie znaleziono QMD?** Upewnij się, że plik binarny znajduje się w zmiennej
`PATH` Gateway. Jeśli OpenClaw działa jako usługa, utwórz dowiązanie
symboliczne: `sudo ln -s ~/.bun/bin/qmd /usr/local/bin/qmd`.

Jeśli `qmd --version` działa w Twojej powłoce, ale OpenClaw nadal zgłasza
`spawn qmd ENOENT`, proces Gateway prawdopodobnie ma inną zmienną `PATH` niż
powłoka interaktywna. Jawnie przypisz ścieżkę pliku binarnego:

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

Użyj `command -v qmd` w środowisku, w którym zainstalowano QMD, a następnie
sprawdź ponownie za pomocą `openclaw memory status --deep`.

**Pierwsze wyszukiwanie jest bardzo powolne?** QMD pobiera modele GGUF przy
pierwszym użyciu. Wstępnie przygotuj je za pomocą `qmd query "test"`, używając
tych samych katalogów XDG co OpenClaw.

**Wiele podprocesów QMD podczas wyszukiwania?** Jeśli to możliwe, zaktualizuj
QMD. OpenClaw używa jednego procesu do wyszukiwania w wielu kolekcjach z tego
samego źródła tylko wtedy, gdy zainstalowany QMD deklaruje obsługę wielu filtrów
`-c`; w przeciwnym razie zachowuje starszy mechanizm zapasowy przeszukujący
każdą kolekcję oddzielnie w celu zapewnienia poprawności.

**QMD działający wyłącznie z BM25 nadal próbuje kompilować llama.cpp?** Ustaw
`memory.qmd.searchMode = "search"`. OpenClaw traktuje ten tryb jako wyłącznie
leksykalny, pomija kontrole stanu wektorów QMD i utrzymywanie osadzeń oraz
pozostawia kontrole gotowości semantycznej konfiguracjom `vsearch` lub `query`.

**Przekroczono limit czasu wyszukiwania?** Zwiększ
`memory.qmd.limits.timeoutMs` (domyślnie: 4000 ms). W przypadku wolniejszego
sprzętu ustaw wyższą wartość, na przykład `120000`.

**Puste wyniki w czatach grupowych lub kanałowych?** Jest to oczekiwane przy
domyślnym ustawieniu `memory.qmd.scope`, które zezwala tylko na sesje
bezpośrednie. Dodaj regułę `allow` dla typów czatu `group` lub `channel`, jeśli
chcesz otrzymywać tam wyniki QMD.

**Wyszukiwanie w głównej pamięci nagle stało się zbyt szerokie?** Uruchom
ponownie Gateway lub poczekaj na kolejne uzgadnianie podczas uruchamiania.
OpenClaw odtwarza nieaktualne zarządzane kolekcje zgodnie z kanonicznymi
wzorcami `MEMORY.md` i `memory/`, gdy wykryje konflikt nazw.

**Repozytoria tymczasowe widoczne w obszarze roboczym powodują błąd
`ENAMETOOLONG` lub uszkodzenie indeksowania?** Przechodzenie po katalogach QMD
korzysta z bazowego skanera QMD zamiast z wbudowanych reguł OpenClaw dotyczących
dowiązań symbolicznych. Przechowuj tymczasowe kopie robocze monorepo w ukrytych
katalogach, takich jak `.tmp/`, lub poza indeksowanymi katalogami głównymi QMD,
dopóki QMD nie udostępni mechanizmu przechodzenia odpornego na cykle lub
jawnych ustawień wykluczeń.

## Konfiguracja

Pełny zakres konfiguracji (`memory.qmd.*`), tryby wyszukiwania, interwały
aktualizacji, reguły zakresu i wszystkie pozostałe ustawienia opisano w
[dokumentacji konfiguracji pamięci](/pl/reference/memory-config).

## Powiązane

- [Omówienie pamięci](/pl/concepts/memory)
- [Wbudowany mechanizm pamięci](/pl/concepts/memory-builtin)
- [Pamięć Honcho](/pl/concepts/memory-honcho)
