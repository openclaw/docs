---
read_when:
    - Debugujesz instalacje pakietów pluginów
    - Zmieniasz zachowanie uruchamiania Plugin, doctor lub instalacji przez menedżera pakietów
    - Utrzymujesz pakietowe instalacje OpenClaw lub dołączone manifesty pluginów
sidebarTitle: Dependencies
summary: Jak OpenClaw instaluje pakiety Plugin i rozwiązuje zależności Plugin
title: Rozwiązywanie zależności Plugin
x-i18n:
    generated_at: "2026-05-03T21:35:23Z"
    model: gpt-5.5
    provider: openai
    source_hash: 46af62ff866d50cb53bb2761d9928f0fd2a25bdb945040885ec6bfb85be35c6d
    source_path: plugins/dependency-resolution.md
    workflow: 16
---

# Rozwiązywanie zależności Plugin

OpenClaw wykonuje prace związane z zależnościami pluginów podczas instalacji/aktualizacji. Ładowanie w czasie działania
nie uruchamia menedżerów pakietów, nie naprawia drzew zależności ani nie modyfikuje katalogu pakietu
OpenClaw.

## Podział odpowiedzialności

Pakiety pluginów są właścicielami swojego grafu zależności:

- zależności czasu działania znajdują się w `dependencies` lub
  `optionalDependencies` pakietu pluginu
- importy SDK/rdzenia są importami peer lub importami dostarczanymi przez OpenClaw
- lokalne pluginy deweloperskie dostarczają własne, już zainstalowane zależności
- pluginy npm i git są instalowane w korzeniach pakietów należących do OpenClaw

OpenClaw odpowiada tylko za cykl życia pluginu:

- wykrycie źródła pluginu
- instalację lub aktualizację pakietu na wyraźne żądanie
- zapis metadanych instalacji
- załadowanie punktu wejścia pluginu
- zakończenie z przydatnym błędem, gdy brakuje zależności

## Korzenie instalacji

OpenClaw używa stabilnych korzeni dla poszczególnych źródeł:

- pakiety npm instalują się w `~/.openclaw/npm`
- pakiety git klonują się w `~/.openclaw/git`
- instalacje lokalne/ze ścieżki/z archiwum są kopiowane lub odwoływane bez naprawy zależności

Instalacje npm działają w korzeniu npm z:

```bash
npm install --prefix ~/.openclaw/npm <spec> --omit=dev --ignore-scripts --no-audit --no-fund
```

npm może wynieść zależności przechodnie do `~/.openclaw/npm/node_modules` obok
pakietu pluginu. OpenClaw skanuje zarządzany korzeń npm, zanim zaufa
instalacji, i używa npm do usuwania pakietów zarządzanych przez npm podczas odinstalowywania, więc wyniesione
zależności czasu działania pozostają wewnątrz zarządzanej granicy czyszczenia.

Instalacje git klonują lub odświeżają repozytorium, a następnie uruchamiają:

```bash
npm install --omit=dev --ignore-scripts --no-audit --no-fund
```

Zainstalowany plugin ładuje się potem z tego katalogu pakietu, więc rozwiązywanie `node_modules`
lokalnych dla pakietu i nadrzędnych działa tak samo jak w zwykłym pakiecie
Node.

## Lokalne pluginy

Lokalne pluginy są traktowane jako katalogi kontrolowane przez dewelopera. OpenClaw nie
uruchamia dla nich `npm install`, `pnpm install` ani naprawy zależności. Jeśli lokalny
plugin ma zależności, zainstaluj je w tym pluginie przed jego załadowaniem.

Lokalne pluginy TypeScript firm trzecich mogą używać awaryjnej ścieżki Jiti. Spakowane
pluginy JavaScript i wbudowane pluginy wewnętrzne ładują się przez natywne
import/require zamiast przez Jiti.

## Uruchamianie i przeładowanie

Uruchamianie Gateway i przeładowanie konfiguracji nigdy nie instalują zależności pluginów. Odczytują
rekordy instalacji pluginów, obliczają punkt wejścia i go ładują.

Jeśli w czasie działania brakuje zależności, plugin nie zostanie załadowany, a błąd
powinien wskazać operatorowi jednoznaczną naprawę:

```bash
openclaw plugins update <id>
openclaw plugins install <source>
openclaw doctor --fix
```

`doctor --fix` może wyczyścić starszy stan zależności wygenerowany przez OpenClaw i zainstalować
skonfigurowane pluginy do pobrania, których brakuje w lokalnych rekordach instalacji.
Nie naprawia zależności dla już zainstalowanego lokalnego pluginu.

## Wbudowane pluginy

Lekkie i krytyczne dla rdzenia wbudowane pluginy są dostarczane jako część OpenClaw.
Powinny albo nie mieć ciężkiego drzewa zależności czasu działania, albo zostać przeniesione do
pakietu do pobrania w ClawHub/npm.

Aktualną wygenerowaną listę pluginów, które są dostarczane w pakiecie rdzenia, instalują się
zewnętrznie lub pozostają tylko w źródle, znajdziesz w [Inwentarzu Plugin](/pl/plugins/plugin-inventory).

Manifesty wbudowanych pluginów nie mogą żądać przygotowania zależności. Duża lub opcjonalna
funkcjonalność pluginu powinna być spakowana jako zwykły plugin i instalowana przez
tę samą ścieżkę npm/git/ClawHub co pluginy firm trzecich.

W checkoutach źródłowych OpenClaw traktuje repozytorium jako monorepo pnpm. Po
`pnpm install` wbudowane pluginy ładują się z `extensions/<id>`, więc zależności obszaru roboczego
lokalne dla pakietu są dostępne, a edycje są pobierane bezpośrednio. Dewelopment w checkoutcie
źródłowym obsługuje tylko pnpm; zwykłe `npm install` w korzeniu repozytorium nie jest
obsługiwanym sposobem przygotowania zależności wbudowanych pluginów.

| Kształt instalacji                    | Lokalizacja wbudowanego pluginu               | Właściciel zależności                                                     |
| -------------------------------- | ------------------------------------- | -------------------------------------------------------------------- |
| `npm install -g openclaw`        | Zbudowane drzewo czasu działania wewnątrz pakietu | Pakiet OpenClaw i jawne przepływy instalacji/aktualizacji/doctor pluginu     |
| Checkout Git plus `pnpm install` | Pakiety obszaru roboczego `extensions/<id>`  | Obszar roboczy pnpm, w tym własne zależności każdego pakietu pluginu |
| `openclaw plugins install ...`   | Zarządzany korzeń pluginu npm/git/ClawHub   | Przepływ instalacji/aktualizacji pluginu                                       |

## Czyszczenie starszego stanu

Starsze wersje OpenClaw generowały korzenie zależności wbudowanych pluginów podczas uruchamiania lub
podczas naprawy doctor. Obecne czyszczenie doctor usuwa te przestarzałe katalogi i
dowiązania symboliczne, gdy użyto `--fix`, w tym stare korzenie `plugin-runtime-deps`, globalne
dowiązania symboliczne pakietów prefiksu Node wskazujące na przycięte cele `plugin-runtime-deps`,
manifesty `.openclaw-runtime-deps*`, wygenerowane `node_modules` pluginów, katalogi
etapów instalacji i lokalne dla pakietów magazyny pnpm. Spakowany postinstall także
usuwa te globalne dowiązania symboliczne przed przycięciem starszych korzeni docelowych, aby aktualizacje
nie pozostawiały wiszących importów pakietów ESM.

Te ścieżki są wyłącznie pozostałościami po starszym stanie. Nowe instalacje nie powinny ich tworzyć.
