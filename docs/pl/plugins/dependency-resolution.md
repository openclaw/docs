---
read_when:
    - Debugujesz instalacje pakietów Plugin
    - Zmieniasz zachowanie uruchamiania Plugin, doctor lub instalacji menedżera pakietów
    - Utrzymujesz pakietowe instalacje OpenClaw lub manifesty Plugin dołączone w pakiecie
sidebarTitle: Dependencies
summary: Jak OpenClaw instaluje pakiety Plugin i rozwiązuje zależności Plugin
title: Rozwiązywanie zależności Plugin
x-i18n:
    generated_at: "2026-05-10T19:45:35Z"
    model: gpt-5.5
    provider: openai
    source_hash: eb9637f46f273de976ff9203d23558d8bb51922b347871bc71917ef61d3c04a3
    source_path: plugins/dependency-resolution.md
    workflow: 16
---

OpenClaw utrzymuje pracę z zależnościami pluginów na etapie instalacji/aktualizacji. Ładowanie w czasie wykonywania
nie uruchamia menedżerów pakietów, nie naprawia drzew zależności ani nie modyfikuje katalogu pakietu
OpenClaw.

## Podział odpowiedzialności

Pakiety pluginów są właścicielami swojego grafu zależności:

- zależności runtime znajdują się w `dependencies` lub
  `optionalDependencies` pakietu pluginu
- importy SDK/rdzenia są importami równorzędnymi lub dostarczanymi przez OpenClaw
- lokalne pluginy deweloperskie dostarczają własne, już zainstalowane zależności
- pluginy npm i git są instalowane w katalogach głównych pakietów należących do OpenClaw

OpenClaw odpowiada tylko za cykl życia pluginu:

- wykrycie źródła pluginu
- instalację lub aktualizację pakietu na wyraźne żądanie
- zapisanie metadanych instalacji
- załadowanie punktu wejścia pluginu
- zakończenie z możliwym do wykonania błędem, gdy brakuje zależności

## Katalogi główne instalacji

OpenClaw używa stabilnych katalogów głównych dla poszczególnych źródeł:

- pakiety npm instalują się w `~/.openclaw/npm`
- pakiety git klonują się do `~/.openclaw/git`
- instalacje lokalne/ścieżkowe/archiwalne są kopiowane lub referencjonowane bez naprawy zależności

Instalacje npm działają w katalogu głównym npm z:

```bash
cd ~/.openclaw/npm
npm install --omit=dev --omit=peer --legacy-peer-deps --ignore-scripts --no-audit --no-fund
```

`openclaw plugins install npm-pack:<path.tgz>` używa tego samego zarządzanego katalogu głównego npm
dla lokalnego archiwum npm-pack. OpenClaw odczytuje metadane npm archiwum, dodaje je
do zarządzanego katalogu głównego jako skopiowaną zależność `file:`, uruchamia normalną instalację npm,
a następnie weryfikuje metadane zainstalowanego pliku blokady przed zaufaniem pluginowi.
Jest to przeznaczone do akceptacji pakietów i dowodów dla kandydatów do wydania, gdzie
lokalny artefakt pack powinien zachowywać się jak artefakt rejestru, który symuluje.

npm może wynosić zależności przechodnie do `~/.openclaw/npm/node_modules` obok
pakietu pluginu. OpenClaw skanuje zarządzany katalog główny npm przed zaufaniem
instalacji i używa npm do usuwania pakietów zarządzanych przez npm podczas odinstalowywania, więc wyniesione
zależności runtime pozostają w granicach zarządzanego czyszczenia.

Pluginy importujące `openclaw/plugin-sdk/*` deklarują `openclaw` jako zależność równorzędną.
OpenClaw nie pozwala npm zainstalować osobnej kopii pakietu hosta z rejestru
w zarządzanym katalogu głównym, ponieważ nieaktualne pakiety hosta mogą wpływać na rozwiązywanie
zależności równorzędnych npm podczas późniejszych instalacji pluginów. Zarządzane instalacje npm pomijają
rozwiązywanie/materializację zależności równorzędnych npm dla współdzielonego katalogu głównego, a OpenClaw ponownie ustanawia
lokalne dla pluginu linki `node_modules/openclaw` dla zainstalowanych pakietów, które deklarują
zależność równorzędną hosta po instalacji, aktualizacji lub odinstalowaniu.

Instalacje git klonują lub odświeżają repozytorium, a następnie uruchamiają:

```bash
npm install --omit=dev --ignore-scripts --no-audit --no-fund
```

Zainstalowany plugin jest następnie ładowany z tego katalogu pakietu, więc rozwiązywanie zależności
z lokalnego pakietu i nadrzędnych `node_modules` działa tak samo jak dla zwykłego
pakietu Node.

## Lokalne pluginy

Lokalne pluginy są traktowane jako katalogi kontrolowane przez dewelopera. OpenClaw nie
uruchamia dla nich `npm install`, `pnpm install` ani naprawy zależności. Jeśli lokalny
plugin ma zależności, zainstaluj je w tym pluginie przed jego załadowaniem.

Lokalne pluginy TypeScript innych firm mogą używać awaryjnej ścieżki Jiti. Spakowane
pluginy JavaScript i dołączone wewnętrzne pluginy ładują się przez natywne
import/require zamiast Jiti.

## Uruchamianie i ponowne ładowanie

Uruchomienie Gateway i ponowne ładowanie konfiguracji nigdy nie instalują zależności pluginów. Odczytują
rekordy instalacji pluginów, wyliczają punkt wejścia i ładują go.

Jeśli w czasie wykonywania brakuje zależności, plugin nie zostanie załadowany, a błąd
powinien wskazać operatorowi wyraźną poprawkę:

```bash
openclaw plugins update <id>
openclaw plugins install <source>
openclaw doctor --fix
```

`doctor --fix` może wyczyścić starszy stan zależności wygenerowany przez OpenClaw i odzyskać
pobieralne pluginy, których brakuje w lokalnych rekordach instalacji, gdy odwołuje się do nich
konfiguracja. Doctor nie naprawia zależności dla już zainstalowanego
lokalnego pluginu.

## Dołączone pluginy

Lekkie i krytyczne dla rdzenia dołączone pluginy są dostarczane jako część OpenClaw.
Powinny albo nie mieć ciężkiego drzewa zależności runtime, albo zostać przeniesione
do pobieralnego pakietu w ClawHub/npm.

Aktualną wygenerowaną listę pluginów dostarczanych w pakiecie rdzenia, instalowanych
zewnętrznie lub pozostających tylko w źródłach znajdziesz w [Inwentarzu pluginów](/pl/plugins/plugin-inventory).

Manifesty dołączonych pluginów nie mogą żądać przygotowywania zależności. Duża lub opcjonalna
funkcjonalność pluginu powinna być spakowana jako zwykły plugin i instalowana przez
tę samą ścieżkę npm/git/ClawHub co pluginy innych firm.

W checkoutach źródłowych OpenClaw traktuje repozytorium jako monorepo pnpm. Po
`pnpm install` dołączone pluginy ładują się z `extensions/<id>`, więc lokalne dla pakietu
zależności workspace są dostępne, a edycje są pobierane bezpośrednio. Rozwój z checkoutu
źródłowego obsługuje tylko pnpm; zwykłe `npm install` w katalogu głównym repozytorium nie jest
obsługiwanym sposobem przygotowania zależności dołączonych pluginów.

| Kształt instalacji               | Lokalizacja dołączonego pluginu       | Właściciel zależności                                                |
| -------------------------------- | ------------------------------------- | -------------------------------------------------------------------- |
| `npm install -g openclaw`        | Zbudowane drzewo runtime w pakiecie   | Pakiet OpenClaw i jawne przepływy instalacji/aktualizacji/doctor pluginów |
| Checkout git plus `pnpm install` | Pakiety workspace `extensions/<id>`   | Workspace pnpm, w tym własne zależności każdego pakietu pluginu      |
| `openclaw plugins install ...`   | Zarządzany katalog główny pluginu npm/git/ClawHub | Przepływ instalacji/aktualizacji pluginu                             |

## Czyszczenie pozostałości

Starsze wersje OpenClaw generowały katalogi główne zależności dołączonych pluginów przy uruchomieniu lub
podczas naprawy doctor. Obecne czyszczenie doctor usuwa te przestarzałe katalogi i
symlinki po użyciu `--fix`, w tym stare katalogi główne `plugin-runtime-deps`, globalne
symlinki pakietów z prefiksu Node wskazujące na przycięte cele `plugin-runtime-deps`,
manifesty `.openclaw-runtime-deps*`, wygenerowane pluginowe `node_modules`, katalogi
etapów instalacji oraz lokalne dla pakietów magazyny pnpm. Spakowany postinstall również
usuwa te globalne symlinki przed przycięciem starszych katalogów głównych celów, aby aktualizacje
nie pozostawiały wiszących importów pakietów ESM.

Te ścieżki są wyłącznie pozostałościami po starszych wersjach. Nowe instalacje nie powinny ich tworzyć.
