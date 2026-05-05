---
read_when:
    - Debugujesz instalacje pakietów Plugin
    - Zmieniasz zachowanie uruchamiania Plugin, doctora lub instalacji przez menedżera pakietów
    - Utrzymujesz pakietowe instalacje OpenClaw lub manifesty dołączonych Pluginów
sidebarTitle: Dependencies
summary: Jak OpenClaw instaluje pakiety Plugin i rozwiązuje zależności Plugin
title: Rozwiązywanie zależności Plugin
x-i18n:
    generated_at: "2026-05-05T01:48:50Z"
    model: gpt-5.5
    provider: openai
    source_hash: 1a832f705e51bba8ac77e2a8715a7213fd2caf10bfa42059d53db4a6d5ad8c20
    source_path: plugins/dependency-resolution.md
    workflow: 16
---

# Rozwiązywanie zależności Plugin

OpenClaw utrzymuje pracę z zależnościami Plugin na etapie instalacji/aktualizacji. Ładowanie w czasie działania
nie uruchamia menedżerów pakietów, nie naprawia drzew zależności ani nie modyfikuje katalogu pakietu
OpenClaw.

## Podział odpowiedzialności

Pakiety Plugin są właścicielami swojego grafu zależności:

- zależności uruchomieniowe znajdują się w `dependencies` lub
  `optionalDependencies` pakietu Plugin
- importy SDK/rdzenia są importami peer lub importami dostarczanymi przez OpenClaw
- lokalne Plugin używane w pracach deweloperskich dostarczają własne, już zainstalowane zależności
- Plugin z npm i git są instalowane w korzeniach pakietów zarządzanych przez OpenClaw

OpenClaw odpowiada tylko za cykl życia Plugin:

- wykrycie źródła Plugin
- zainstalowanie lub zaktualizowanie pakietu na wyraźne żądanie
- zapisanie metadanych instalacji
- załadowanie punktu wejścia Plugin
- zakończenie błędem z możliwym do wykonania komunikatem, gdy brakuje zależności

## Korzenie instalacji

OpenClaw używa stabilnych korzeni dla każdego źródła:

- pakiety npm instalują się pod `~/.openclaw/npm`
- pakiety git są klonowane pod `~/.openclaw/git`
- instalacje lokalne/ścieżkowe/archiwalne są kopiowane lub referencjonowane bez naprawy zależności

Instalacje npm działają w korzeniu npm z:

```bash
npm install --prefix ~/.openclaw/npm <spec> --omit=dev --ignore-scripts --no-audit --no-fund
```

npm może wynieść zależności przechodnie do `~/.openclaw/npm/node_modules` obok
pakietu Plugin. OpenClaw skanuje zarządzany korzeń npm przed zaufaniem
instalacji i używa npm do usuwania pakietów zarządzanych przez npm podczas odinstalowywania, więc wyniesione
zależności uruchomieniowe pozostają w granicy zarządzanego czyszczenia.

Instalacje git klonują lub odświeżają repozytorium, a następnie uruchamiają:

```bash
npm install --omit=dev --ignore-scripts --no-audit --no-fund
```

Zainstalowany Plugin ładuje się następnie z tego katalogu pakietu, więc rozwiązywanie
pakietowych i nadrzędnych `node_modules` działa tak samo jak dla zwykłego
pakietu Node.

## Lokalne Plugin

Lokalne Plugin są traktowane jako katalogi kontrolowane przez dewelopera. OpenClaw nie
uruchamia dla nich `npm install`, `pnpm install` ani naprawy zależności. Jeśli lokalny
Plugin ma zależności, zainstaluj je w tym Plugin przed jego załadowaniem.

Zewnętrzne lokalne Plugin w TypeScript mogą używać awaryjnej ścieżki Jiti. Spakowane
Plugin JavaScript i dołączone wewnętrzne Plugin ładują się przez natywne
import/require zamiast Jiti.

## Uruchamianie i ponowne ładowanie

Uruchamianie Gateway i ponowne ładowanie konfiguracji nigdy nie instalują zależności Plugin. Odczytują
rekordy instalacji Plugin, wyliczają punkt wejścia i go ładują.

Jeśli brakuje zależności w czasie działania, Plugin nie ładuje się, a błąd
powinien wskazywać operatorowi wyraźną poprawkę:

```bash
openclaw plugins update <id>
openclaw plugins install <source>
openclaw doctor --fix
```

`doctor --fix` może wyczyścić starszy stan zależności wygenerowany przez OpenClaw i odzyskać
pobieralne Plugin, których brakuje w lokalnych rekordach instalacji, gdy konfiguracja
się do nich odwołuje. Doctor nie naprawia zależności dla już zainstalowanego
lokalnego Plugin.

## Dołączone Plugin

Lekkie i krytyczne dla rdzenia dołączone Plugin są dostarczane jako część OpenClaw.
Nie powinny mieć ciężkiego drzewa zależności uruchomieniowych albo powinny zostać przeniesione do
pobieralnego pakietu w ClawHub/npm.

Bieżącą wygenerowaną listę Plugin, które są dostarczane w pakiecie rdzenia, instalują się
zewnętrznie albo pozostają tylko źródłowe, znajdziesz w [inwentarzu Plugin](/pl/plugins/plugin-inventory).

Manifesty dołączonych Plugin nie mogą żądać przygotowania zależności. Duża lub opcjonalna
funkcjonalność Plugin powinna być spakowana jako zwykły Plugin i instalowana przez
tę samą ścieżkę npm/git/ClawHub co zewnętrzne Plugin.

W checkoutach źródłowych OpenClaw traktuje repozytorium jako monorepo pnpm. Po
`pnpm install` dołączone Plugin ładują się z `extensions/<id>`, dzięki czemu pakietowe
zależności workspace są dostępne, a zmiany są podchwytywane bezpośrednio. Praca deweloperska
na checkoucie źródłowym obsługuje tylko pnpm; zwykłe `npm install` w korzeniu repozytorium
nie jest wspieranym sposobem przygotowania zależności dołączonych Plugin.

| Kształt instalacji               | Lokalizacja dołączonego Plugin        | Właściciel zależności                                                |
| -------------------------------- | ------------------------------------- | -------------------------------------------------------------------- |
| `npm install -g openclaw`        | Zbudowane drzewo uruchomieniowe w pakiecie | Pakiet OpenClaw oraz wyraźne przepływy instalacji/aktualizacji/doctor Plugin |
| Checkout git plus `pnpm install` | Pakiety workspace `extensions/<id>`   | Workspace pnpm, w tym własne zależności każdego pakietu Plugin       |
| `openclaw plugins install ...`   | Zarządzany korzeń Plugin npm/git/ClawHub | Przepływ instalacji/aktualizacji Plugin                              |

## Czyszczenie starszych pozostałości

Starsze wersje OpenClaw generowały korzenie zależności dołączonych Plugin podczas uruchamiania lub
w trakcie naprawy doctor. Bieżące czyszczenie doctor usuwa te przestarzałe katalogi i
symlinki, gdy użyto `--fix`, w tym stare korzenie `plugin-runtime-deps`, globalne
symlinki pakietów z prefiksu Node wskazujące na przycięte cele `plugin-runtime-deps`,
manifesty `.openclaw-runtime-deps*`, wygenerowane `node_modules` Plugin, katalogi
etapów instalacji oraz pakietowe magazyny pnpm. Spakowany postinstall również
usuwa te globalne symlinki przed przycięciem starszych korzeni docelowych, aby aktualizacje
nie pozostawiały wiszących importów pakietów ESM.

Te ścieżki są wyłącznie starszymi pozostałościami. Nowe instalacje nie powinny ich tworzyć.
