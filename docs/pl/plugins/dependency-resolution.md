---
read_when:
    - Debugujesz instalacje pakietów Plugin
    - Zmieniasz zachowanie uruchamiania Plugin, doctor lub instalacji przez menedżera pakietów
    - Utrzymujesz pakietowane instalacje OpenClaw lub manifesty dołączonych Pluginów
sidebarTitle: Dependencies
summary: Jak OpenClaw instaluje pakiety Plugin i rozwiązuje zależności Plugin
title: Rozwiązywanie zależności Plugin
x-i18n:
    generated_at: "2026-05-06T19:35:47Z"
    model: gpt-5.5
    provider: openai
    source_hash: d51785b67d491d09e3a7a3ffcd6c991f7415c46b207596151dbc29b0c43e9341
    source_path: plugins/dependency-resolution.md
    workflow: 16
---

OpenClaw utrzymuje prace związane z zależnościami pluginów na etapie instalacji/aktualizacji. Ładowanie w czasie działania
nie uruchamia menedżerów pakietów, nie naprawia drzew zależności ani nie modyfikuje katalogu pakietu
OpenClaw.

## Podział odpowiedzialności

Pakiety pluginów są właścicielami swojego grafu zależności:

- zależności runtime znajdują się w `dependencies` lub
  `optionalDependencies` pakietu pluginu
- importy SDK/core są zależnościami peer albo importami dostarczanymi przez OpenClaw
- pluginy do lokalnego developmentu dostarczają własne, już zainstalowane zależności
- pluginy npm i git są instalowane w korzeniach pakietów należących do OpenClaw

OpenClaw odpowiada tylko za cykl życia pluginu:

- wykrycie źródła pluginu
- instalację lub aktualizację pakietu na jawne żądanie
- zapis metadanych instalacji
- załadowanie entrypointu pluginu
- zakończenie z użytecznym błędem, gdy brakuje zależności

## Korzenie instalacji

OpenClaw używa stabilnych korzeni dla poszczególnych źródeł:

- pakiety npm instalują się pod `~/.openclaw/npm`
- pakiety git klonują się pod `~/.openclaw/git`
- instalacje lokalne/ścieżkowe/archiwalne są kopiowane albo wskazywane bez naprawy zależności

Instalacje npm działają w korzeniu npm z:

```bash
npm install --prefix ~/.openclaw/npm <spec> --omit=dev --omit=peer --legacy-peer-deps --ignore-scripts --no-audit --no-fund
```

`openclaw plugins install npm-pack:<path.tgz>` używa tego samego zarządzanego korzenia npm
dla lokalnego tarballa npm-pack. OpenClaw odczytuje metadane npm tarballa, dodaje go
do zarządzanego korzenia jako skopiowaną zależność `file:`, uruchamia standardową instalację npm,
a następnie weryfikuje metadane zainstalowanego lockfile, zanim zaufa pluginowi.
Jest to przeznaczone do akceptacji pakietu i potwierdzania kandydatów do wydania, gdy
lokalny artefakt pack powinien zachowywać się jak artefakt z rejestru, który symuluje.

npm może hoistować zależności przechodnie do `~/.openclaw/npm/node_modules` obok
pakietu pluginu. OpenClaw skanuje zarządzany korzeń npm przed zaufaniem
instalacji i używa npm do usuwania pakietów zarządzanych przez npm podczas odinstalowania, więc hoistowane
zależności runtime pozostają w zarządzanej granicy czyszczenia.

Pluginy importujące `openclaw/plugin-sdk/*` deklarują `openclaw` jako zależność peer.
OpenClaw nie pozwala npm zainstalować osobnej kopii pakietu hosta z rejestru
w zarządzanym korzeniu, ponieważ nieaktualne pakiety hosta mogą wpływać na rozwiązywanie peer przez npm
podczas późniejszych instalacji pluginów. Zarządzane instalacje npm pomijają rozwiązywanie/materializację peer npm
dla współdzielonego korzenia, a OpenClaw ponownie wymusza
lokalne dla pluginu linki `node_modules/openclaw` dla zainstalowanych pakietów, które deklarują
peer hosta po instalacji, aktualizacji lub odinstalowaniu.

Instalacje git klonują albo odświeżają repozytorium, a następnie uruchamiają:

```bash
npm install --omit=dev --ignore-scripts --no-audit --no-fund
```

Zainstalowany plugin ładuje się potem z tego katalogu pakietu, więc rozwiązywanie zależności z lokalnego
i nadrzędnego `node_modules` działa tak samo jak w normalnym pakiecie
Node.

## Pluginy lokalne

Pluginy lokalne są traktowane jako katalogi kontrolowane przez developera. OpenClaw nie
uruchamia dla nich `npm install`, `pnpm install` ani naprawy zależności. Jeśli lokalny
plugin ma zależności, zainstaluj je w tym pluginie przed jego załadowaniem.

Lokalne pluginy TypeScript innych firm mogą używać awaryjnej ścieżki Jiti. Spakowane
pluginy JavaScript i dołączone wewnętrzne pluginy ładują się przez natywne
import/require zamiast Jiti.

## Uruchamianie i przeładowanie

Uruchomienie Gateway i przeładowanie konfiguracji nigdy nie instalują zależności pluginów. Odczytują
rekordy instalacji pluginów, obliczają entrypoint i go ładują.

Jeśli w czasie działania brakuje zależności, plugin nie ładuje się, a błąd
powinien wskazać operatorowi jawne rozwiązanie:

```bash
openclaw plugins update <id>
openclaw plugins install <source>
openclaw doctor --fix
```

`doctor --fix` może wyczyścić starszy stan zależności wygenerowany przez OpenClaw i odzyskać
pobieralne pluginy, których brakuje w lokalnych rekordach instalacji, gdy odwołuje się do nich konfiguracja.
Doctor nie naprawia zależności już zainstalowanego lokalnego pluginu.

## Dołączone pluginy

Lekkie i krytyczne dla core dołączone pluginy są dostarczane jako część OpenClaw.
Powinny albo nie mieć ciężkiego drzewa zależności runtime, albo zostać przeniesione do
pobieralnego pakietu w ClawHub/npm.

Bieżącą wygenerowaną listę pluginów dostarczanych w pakiecie core, instalowanych
zewnętrznie albo pozostających tylko w źródłach znajdziesz w [Inwentarzu pluginów](/pl/plugins/plugin-inventory).

Manifesty dołączonych pluginów nie mogą żądać etapowania zależności. Duża lub opcjonalna
funkcjonalność pluginu powinna być spakowana jako normalny plugin i zainstalowana przez
tę samą ścieżkę npm/git/ClawHub co pluginy innych firm.

W checkoutach źródłowych OpenClaw traktuje repozytorium jako monorepo pnpm. Po
`pnpm install` dołączone pluginy ładują się z `extensions/<id>`, więc lokalne dla pakietu
zależności workspace są dostępne, a edycje są podchwytywane bezpośrednio. Development
z checkoutu źródłowego jest wyłącznie pnpm; zwykłe `npm install` w korzeniu repozytorium nie jest
obsługiwanym sposobem przygotowania zależności dołączonych pluginów.

| Kształt instalacji               | Lokalizacja dołączonego pluginu       | Właściciel zależności                                               |
| -------------------------------- | ------------------------------------- | -------------------------------------------------------------------- |
| `npm install -g openclaw`        | Zbudowane drzewo runtime w pakiecie   | Pakiet OpenClaw i jawne przepływy instalacji/aktualizacji/doctor pluginu |
| Checkout git plus `pnpm install` | Pakiety workspace `extensions/<id>`   | Workspace pnpm, w tym własne zależności każdego pakietu pluginu      |
| `openclaw plugins install ...`   | Zarządzany korzeń pluginu npm/git/ClawHub | Przepływ instalacji/aktualizacji pluginu                             |

## Czyszczenie starszego stanu

Starsze wersje OpenClaw generowały korzenie zależności dołączonych pluginów przy uruchomieniu albo
podczas naprawy doctor. Obecne czyszczenie doctor usuwa te nieaktualne katalogi i
symlinki, gdy użyto `--fix`, w tym stare korzenie `plugin-runtime-deps`, globalne
symlinki pakietów z prefiksu Node wskazujące na przycięte cele `plugin-runtime-deps`,
manifesty `.openclaw-runtime-deps*`, wygenerowane pluginowe `node_modules`, katalogi
etapu instalacji i lokalne dla pakietu magazyny pnpm. Spakowany postinstall również
usuwa te globalne symlinki przed przycięciem starszych korzeni docelowych, aby aktualizacje
nie zostawiały wiszących importów pakietów ESM.

Te ścieżki są wyłącznie pozostałościami starszego stanu. Nowe instalacje nie powinny ich tworzyć.
