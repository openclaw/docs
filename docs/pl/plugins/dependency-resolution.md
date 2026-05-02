---
read_when:
    - Debugujesz instalacje pakietów Plugin
    - Zmieniasz zachowanie uruchamiania Plugin, doctor lub instalacji przez menedżera pakietów
    - Utrzymujesz pakietowe instalacje OpenClaw lub dołączone manifesty pluginów
sidebarTitle: Dependencies
summary: Jak OpenClaw instaluje pakiety Plugin i rozwiązuje zależności Plugin
title: Rozwiązywanie zależności Plugin
x-i18n:
    generated_at: "2026-05-02T09:57:33Z"
    model: gpt-5.5
    provider: openai
    source_hash: c9476529ad1d44ed1b17caca628c58acfbb1d8c73393f58fa7d3d76944a71aea
    source_path: plugins/dependency-resolution.md
    workflow: 16
---

# Rozwiązywanie zależności Plugin

OpenClaw wykonuje prace związane z zależnościami Plugin podczas instalacji/aktualizacji. Ładowanie w czasie działania
nie uruchamia menedżerów pakietów, nie naprawia drzew zależności ani nie modyfikuje katalogu pakietu OpenClaw.

## Podział odpowiedzialności

Pakiety Plugin są właścicielami swojego grafu zależności:

- zależności uruchomieniowe znajdują się w `dependencies` lub
  `optionalDependencies` pakietu Plugin
- importy SDK/core są importami peer albo dostarczanymi przez OpenClaw
- lokalne Plugin używane podczas programowania dostarczają własne, już zainstalowane zależności
- Plugin z npm i git są instalowane w katalogach głównych pakietów zarządzanych przez OpenClaw

OpenClaw odpowiada tylko za cykl życia Plugin:

- wykrycie źródła Plugin
- instalację lub aktualizację pakietu na wyraźne żądanie
- zapisanie metadanych instalacji
- załadowanie punktu wejścia Plugin
- zgłoszenie użytecznego błędu, gdy brakuje zależności

## Katalogi główne instalacji

OpenClaw używa stabilnych katalogów głównych dla każdego źródła:

- pakiety npm instalują się w `~/.openclaw/npm`
- pakiety git są klonowane do `~/.openclaw/git`
- instalacje lokalne/ścieżkowe/archiwalne są kopiowane lub referencjonowane bez naprawy zależności

Instalacje npm działają w katalogu głównym npm z:

```bash
npm install --prefix ~/.openclaw/npm <spec> --omit=dev --ignore-scripts --no-audit --no-fund
```

npm może wynieść zależności przechodnie do `~/.openclaw/npm/node_modules` obok
pakietu Plugin. OpenClaw skanuje zarządzany katalog główny npm przed zaufaniem
instalacji i używa npm do usuwania pakietów zarządzanych przez npm podczas odinstalowywania, dzięki czemu wyniesione
zależności uruchomieniowe pozostają wewnątrz zarządzanej granicy sprzątania.

Instalacje git klonują lub odświeżają repozytorium, a następnie uruchamiają:

```bash
npm install --omit=dev --ignore-scripts --no-audit --no-fund
```

Zainstalowany Plugin ładuje się następnie z tego katalogu pakietu, więc rozwiązywanie
`node_modules` lokalnych dla pakietu i nadrzędnych działa tak samo jak dla zwykłego
pakietu Node.

## Lokalne Plugin

Lokalne Plugin są traktowane jako katalogi kontrolowane przez programistę. OpenClaw nie
uruchamia dla nich `npm install`, `pnpm install` ani naprawy zależności. Jeśli lokalny
Plugin ma zależności, zainstaluj je w tym Plugin przed jego załadowaniem.

Zewnętrzne lokalne Plugin TypeScript mogą używać awaryjnej ścieżki Jiti. Spakowane
Plugin JavaScript oraz dołączone wewnętrzne Plugin ładują się przez natywne
import/require zamiast Jiti.

## Uruchamianie i ponowne ładowanie

Uruchomienie Gateway i przeładowanie konfiguracji nigdy nie instalują zależności Plugin. Odczytują
rekordy instalacji Plugin, wyliczają punkt wejścia i go ładują.

Jeśli podczas działania brakuje zależności, ładowanie Plugin kończy się niepowodzeniem, a błąd
powinien wskazywać operatorowi jawną poprawkę:

```bash
openclaw plugins update <id>
openclaw plugins install <source>
openclaw doctor --fix
```

`doctor --fix` może wyczyścić starszy stan zależności wygenerowany przez OpenClaw i zainstalować
skonfigurowane, możliwe do pobrania Plugin, których brakuje w lokalnych rekordach instalacji.
Nie naprawia zależności już zainstalowanego lokalnego Plugin.

## Dołączone Plugin

Lekkie i krytyczne dla rdzenia dołączone Plugin są dostarczane jako część OpenClaw.
Powinny albo nie mieć ciężkiego drzewa zależności uruchomieniowych, albo zostać przeniesione
do pakietu możliwego do pobrania z ClawHub/npm.

Aktualną wygenerowaną listę Plugin dostarczanych w pakiecie rdzenia, instalowanych
zewnętrznie lub pozostających wyłącznie w źródłach znajdziesz w [Inwentarzu Plugin](/pl/plugins/plugin-inventory).

Manifesty dołączonych Plugin nie mogą żądać przygotowywania zależności. Duża lub opcjonalna
funkcjonalność Plugin powinna być spakowana jako zwykły Plugin i instalowana przez
tę samą ścieżkę npm/git/ClawHub co zewnętrzne Plugin.

W checkoutach źródłowych OpenClaw traktuje repozytorium jako monorepo pnpm. Po
`pnpm install` dołączone Plugin ładują się z `extensions/<id>`, dzięki czemu lokalne dla pakietu
zależności workspace są dostępne, a zmiany są pobierane bezpośrednio. Programowanie w checkoucie
źródłowym obsługuje tylko pnpm; zwykłe `npm install` w katalogu głównym repozytorium nie jest
obsługiwanym sposobem przygotowania zależności dołączonych Plugin.

| Kształt instalacji               | Lokalizacja dołączonego Plugin        | Właściciel zależności                                                |
| -------------------------------- | ------------------------------------- | -------------------------------------------------------------------- |
| `npm install -g openclaw`        | Zbudowane drzewo uruchomieniowe wewnątrz pakietu | Pakiet OpenClaw oraz jawne przepływy instalacji/aktualizacji/doctor Plugin |
| Checkout git plus `pnpm install` | Pakiety workspace `extensions/<id>`   | Workspace pnpm, w tym własne zależności każdego pakietu Plugin       |
| `openclaw plugins install ...`   | Zarządzany katalog główny Plugin npm/git/ClawHub | Przepływ instalacji/aktualizacji Plugin                              |

## Czyszczenie starszego stanu

Starsze wersje OpenClaw generowały katalogi główne zależności dołączonych Plugin podczas uruchamiania lub
w trakcie naprawy doctor. Obecne czyszczenie doctor usuwa te nieaktualne katalogi i
symlinki po użyciu `--fix`, w tym stare katalogi główne `plugin-runtime-deps`,
manifesty `.openclaw-runtime-deps*`, wygenerowane `node_modules` Plugin, katalogi
etapów instalacji oraz lokalne dla pakietów magazyny pnpm.

Te ścieżki są wyłącznie starszymi pozostałościami. Nowe instalacje nie powinny ich tworzyć.
