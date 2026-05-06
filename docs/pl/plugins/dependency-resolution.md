---
read_when:
    - Debugujesz instalacje pakietów Plugin
    - Zmieniasz zachowanie uruchamiania pluginu, doctor lub instalacji przez menedżera pakietów
    - Utrzymujesz instalacje pakietowe OpenClaw lub manifesty dołączonych Plugin
sidebarTitle: Dependencies
summary: Jak OpenClaw instaluje pakiety Plugin i rozwiązuje zależności Plugin
title: Rozwiązywanie zależności Plugin
x-i18n:
    generated_at: "2026-05-06T09:23:12Z"
    model: gpt-5.5
    provider: openai
    source_hash: e06f1fdc34c8392cbf0e399484fd59af11b9b7d73c5c7e68b3617a7cfd433a36
    source_path: plugins/dependency-resolution.md
    workflow: 16
---

# Rozwiązywanie zależności Plugin

OpenClaw wykonuje prace związane z zależnościami Plugin podczas instalacji/aktualizacji. Ładowanie w czasie działania
nie uruchamia menedżerów pakietów, nie naprawia drzew zależności ani nie modyfikuje katalogu pakietu
OpenClaw.

## Podział odpowiedzialności

Pakiety Plugin są właścicielami swojego grafu zależności:

- zależności czasu działania znajdują się w `dependencies` lub
  `optionalDependencies` pakietu Plugin
- importy SDK/rdzenia są zależnościami równorzędnymi albo importami dostarczanymi przez OpenClaw
- lokalne Plugin używane w rozwoju dostarczają własne, już zainstalowane zależności
- Plugin z npm i git są instalowane w katalogach głównych pakietów należących do OpenClaw

OpenClaw odpowiada tylko za cykl życia Plugin:

- wykrywanie źródła Plugin
- instalowanie lub aktualizowanie pakietu na wyraźne żądanie
- zapisywanie metadanych instalacji
- ładowanie punktu wejścia Plugin
- zgłaszanie możliwego do naprawienia błędu, gdy brakuje zależności

## Katalogi instalacji

OpenClaw używa stabilnych katalogów dla poszczególnych źródeł:

- pakiety npm instalują się w `~/.openclaw/npm`
- pakiety git są klonowane do `~/.openclaw/git`
- instalacje lokalne/ze ścieżki/z archiwum są kopiowane albo referencjonowane bez naprawy zależności

Instalacje npm działają w katalogu npm z:

```bash
npm install --prefix ~/.openclaw/npm <spec> --omit=dev --ignore-scripts --no-audit --no-fund
```

`openclaw plugins install npm-pack:<path.tgz>` używa tego samego zarządzanego katalogu npm
dla lokalnego archiwum tarball npm-pack. OpenClaw odczytuje metadane npm z tarballa, dodaje go
do zarządzanego katalogu jako skopiowaną zależność `file:`, uruchamia normalną instalację npm,
a następnie weryfikuje metadane zainstalowanego lockfile, zanim zaufa Plugin.
Jest to przeznaczone do akceptacji pakietu i dowodu dla kandydata do wydania, gdzie
lokalny artefakt pack powinien zachowywać się jak artefakt z rejestru, który symuluje.

npm może wynieść zależności przechodnie do `~/.openclaw/npm/node_modules` obok
pakietu Plugin. OpenClaw skanuje zarządzany katalog npm, zanim zaufa
instalacji, i używa npm do usuwania pakietów zarządzanych przez npm podczas odinstalowywania, więc wyniesione
zależności czasu działania pozostają w granicy zarządzanego czyszczenia.

Plugin importujące `openclaw/plugin-sdk/*` deklarują `openclaw` jako zależność równorzędną.
OpenClaw nie pozwala npm zainstalować osobnej kopii pakietu hosta z rejestru
w zarządzanym katalogu, ponieważ nieaktualne pakiety hosta mogą wpływać na
rozwiązywanie zależności równorzędnych przez npm podczas późniejszych instalacji Plugin. Zamiast tego, po tym jak npm zakończy
modyfikowanie współdzielonego katalogu podczas instalacji, aktualizacji lub odinstalowania, OpenClaw ponownie wymusza
lokalne dla Plugin łącza `node_modules/openclaw` dla zainstalowanych pakietów, które deklarują
zależność równorzędną hosta.

Instalacje git klonują lub odświeżają repozytorium, a następnie uruchamiają:

```bash
npm install --omit=dev --ignore-scripts --no-audit --no-fund
```

Zainstalowany Plugin ładuje się potem z tego katalogu pakietu, więc rozwiązywanie
`node_modules` lokalnych dla pakietu i nadrzędnych działa tak samo jak dla zwykłego
pakietu Node.

## Lokalne Plugin

Lokalne Plugin są traktowane jako katalogi kontrolowane przez dewelopera. OpenClaw nie
uruchamia dla nich `npm install`, `pnpm install` ani naprawy zależności. Jeśli lokalny
Plugin ma zależności, zainstaluj je w tym Plugin przed jego załadowaniem.

Zewnętrzne lokalne Plugin w TypeScript mogą używać awaryjnej ścieżki Jiti. Spakowane
Plugin JavaScript i dołączone wewnętrzne Plugin ładują się przez natywne
import/require zamiast Jiti.

## Uruchamianie i przeładowywanie

Uruchomienie Gateway i przeładowanie konfiguracji nigdy nie instalują zależności Plugin. Odczytują
rekordy instalacji Plugin, obliczają punkt wejścia i go ładują.

Jeśli zależności brakuje w czasie działania, Plugin nie załaduje się, a błąd
powinien wskazywać operatorowi wyraźną poprawkę:

```bash
openclaw plugins update <id>
openclaw plugins install <source>
openclaw doctor --fix
```

`doctor --fix` może wyczyścić starszy stan zależności wygenerowany przez OpenClaw i odzyskać
pobieralne Plugin, których brakuje w lokalnych rekordach instalacji, gdy odwołuje się do nich konfiguracja.
Doctor nie naprawia zależności dla już zainstalowanego lokalnego Plugin.

## Dołączone Plugin

Lekkie i krytyczne dla rdzenia dołączone Plugin są dostarczane jako część OpenClaw.
Powinny albo nie mieć ciężkiego drzewa zależności czasu działania, albo zostać przeniesione
do pobieralnego pakietu w ClawHub/npm.

Aktualną wygenerowaną listę Plugin, które są dostarczane w pakiecie rdzenia, instalują się
zewnętrznie albo pozostają tylko w źródłach, zobacz w [Inwentarzu Plugin](/pl/plugins/plugin-inventory).

Manifesty dołączonych Plugin nie mogą żądać przygotowywania zależności. Duże lub opcjonalne
funkcje Plugin powinny być pakowane jako zwykły Plugin i instalowane przez
tę samą ścieżkę npm/git/ClawHub co Plugin zewnętrzne.

W checkoutach źródłowych OpenClaw traktuje repozytorium jako monorepo pnpm. Po
`pnpm install` dołączone Plugin ładują się z `extensions/<id>`, więc lokalne dla pakietu
zależności workspace są dostępne, a edycje są przejmowane bezpośrednio. Rozwój w checkoutach
źródłowych obsługuje tylko pnpm; zwykłe `npm install` w katalogu głównym repozytorium
nie jest obsługiwanym sposobem przygotowania zależności dołączonych Plugin.

| Kształt instalacji               | Lokalizacja dołączonego Plugin        | Właściciel zależności                                               |
| -------------------------------- | ------------------------------------- | ------------------------------------------------------------------- |
| `npm install -g openclaw`        | Zbudowane drzewo czasu działania w pakiecie | Pakiet OpenClaw i jawne przepływy instalacji/aktualizacji/doctor Plugin |
| Checkout git plus `pnpm install` | Pakiety workspace `extensions/<id>`   | Workspace pnpm, w tym własne zależności każdego pakietu Plugin      |
| `openclaw plugins install ...`   | Zarządzany katalog główny Plugin npm/git/ClawHub | Przepływ instalacji/aktualizacji Plugin                             |

## Czyszczenie starszych pozostałości

Starsze wersje OpenClaw generowały katalogi zależności dołączonych Plugin przy uruchamianiu albo
podczas naprawy przez doctor. Obecne czyszczenie doctor usuwa te nieaktualne katalogi i
symlinki, gdy użyte jest `--fix`, w tym stare katalogi główne `plugin-runtime-deps`, globalne
symlinki pakietów prefiksu Node wskazujące na przycięte cele `plugin-runtime-deps`,
manifesty `.openclaw-runtime-deps*`, wygenerowane `node_modules` Plugin, katalogi
etapów instalacji i lokalne dla pakietów magazyny pnpm. Spakowany postinstall również
usuwa te globalne symlinki przed przycięciem starszych katalogów docelowych, aby aktualizacje
nie zostawiały wiszących importów pakietów ESM.

Te ścieżki są wyłącznie starszymi pozostałościami. Nowe instalacje nie powinny ich tworzyć.
