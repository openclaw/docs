---
read_when:
    - Debugujesz instalacje pakietów Plugin
    - Zmieniasz zachowanie uruchamiania Plugin, doctor lub instalacji przez menedżera pakietów
    - Utrzymujesz pakietowe instalacje OpenClaw lub dołączone manifesty Plugin
sidebarTitle: Dependencies
summary: Jak OpenClaw instaluje pakiety Plugin i rozwiązuje zależności Plugin
title: Rozwiązywanie zależności Plugin
x-i18n:
    generated_at: "2026-05-06T17:59:02Z"
    model: gpt-5.5
    provider: openai
    source_hash: 15cdc75d92a675fd5474c49572639ab7510618e393fb7cf9f8b94506c859bee8
    source_path: plugins/dependency-resolution.md
    workflow: 16
---

OpenClaw wykonuje pracę z zależnościami Plugin podczas instalacji/aktualizacji. Ładowanie w czasie działania
nie uruchamia menedżerów pakietów, nie naprawia drzew zależności ani nie modyfikuje katalogu
pakietu OpenClaw.

## Podział odpowiedzialności

Pakiety Plugin są właścicielami swojego grafu zależności:

- zależności czasu działania znajdują się w `dependencies` lub
  `optionalDependencies` pakietu Plugin
- importy SDK/rdzenia są importami równorzędnymi albo dostarczanymi przez OpenClaw
- lokalne Plugin używane w środowisku deweloperskim dostarczają własne, już zainstalowane zależności
- Plugin z npm i git są instalowane w katalogach głównych pakietów należących do OpenClaw

OpenClaw jest właścicielem tylko cyklu życia Plugin:

- wykrywa źródło Plugin
- instaluje lub aktualizuje pakiet na wyraźne żądanie
- zapisuje metadane instalacji
- ładuje punkt wejścia Plugin
- kończy się niepowodzeniem z użytecznym błędem, gdy brakuje zależności

## Katalogi główne instalacji

OpenClaw używa stabilnych katalogów głównych dla poszczególnych źródeł:

- pakiety npm instalują się w `~/.openclaw/npm`
- pakiety git są klonowane w `~/.openclaw/git`
- instalacje lokalne/ze ścieżki/z archiwum są kopiowane lub wskazywane bez naprawy zależności

Instalacje npm działają w katalogu głównym npm z:

```bash
npm install --prefix ~/.openclaw/npm <spec> --omit=dev --ignore-scripts --no-audit --no-fund
```

`openclaw plugins install npm-pack:<path.tgz>` używa tego samego zarządzanego katalogu głównego npm
dla lokalnego archiwum tarball npm-pack. OpenClaw odczytuje metadane npm archiwum tarball, dodaje je
do zarządzanego katalogu głównego jako skopiowaną zależność `file:`, uruchamia standardową instalację npm,
a następnie weryfikuje metadane zainstalowanego lockfile przed zaufaniem Plugin.
Jest to przeznaczone do akceptacji pakietu i weryfikacji kandydata do wydania, gdy
lokalny artefakt pakietu powinien zachowywać się jak artefakt z rejestru, który symuluje.

npm może wynosić zależności przechodnie do `~/.openclaw/npm/node_modules` obok
pakietu Plugin. OpenClaw skanuje zarządzany katalog główny npm przed zaufaniem
instalacji i używa npm do usuwania pakietów zarządzanych przez npm podczas odinstalowania, więc wyniesione
zależności czasu działania pozostają wewnątrz zarządzanej granicy czyszczenia.

Plugin, które importują `openclaw/plugin-sdk/*`, deklarują `openclaw` jako zależność równorzędną.
OpenClaw nie pozwala npm instalować osobnej kopii pakietu hosta z rejestru
w zarządzanym katalogu głównym, ponieważ przestarzałe pakiety hosta mogą wpływać na
rozwiązywanie zależności równorzędnych przez npm podczas późniejszych instalacji Plugin. Zamiast tego, po zakończeniu przez npm
modyfikowania współdzielonego katalogu głównego podczas instalacji, aktualizacji lub odinstalowania, OpenClaw ponownie wymusza
lokalne dla Plugin dowiązania `node_modules/openclaw` dla zainstalowanych pakietów, które deklarują
równorzędnego hosta.

Instalacje git klonują lub odświeżają repozytorium, a następnie uruchamiają:

```bash
npm install --omit=dev --ignore-scripts --no-audit --no-fund
```

Zainstalowany Plugin jest następnie ładowany z tego katalogu pakietu, więc rozwiązywanie pakietowych
i nadrzędnych `node_modules` działa tak samo jak w normalnym
pakiecie Node.

## Lokalne Plugin

Lokalne Plugin są traktowane jako katalogi kontrolowane przez dewelopera. OpenClaw nie
uruchamia dla nich `npm install`, `pnpm install` ani naprawy zależności. Jeśli lokalny
Plugin ma zależności, zainstaluj je w tym Plugin przed jego załadowaniem.

Lokalne Plugin TypeScript innych firm mogą używać awaryjnej ścieżki Jiti. Spakowane
Plugin JavaScript i dołączone wewnętrzne Plugin ładują się przez natywne
import/require zamiast Jiti.

## Uruchamianie i przeładowanie

Uruchomienie Gateway i przeładowanie konfiguracji nigdy nie instalują zależności Plugin. Odczytują
rekordy instalacji Plugin, wyliczają punkt wejścia i go ładują.

Jeśli w czasie działania brakuje zależności, Plugin nie zostaje załadowany, a błąd
powinien wskazać operatorowi jednoznaczną naprawę:

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
Powinny albo nie mieć ciężkiego drzewa zależności czasu działania, albo zostać przeniesione
do pobieralnego pakietu w ClawHub/npm.

Bieżącą wygenerowaną listę Plugin dostarczanych w pakiecie rdzenia, instalowanych
zewnętrznie lub pozostających tylko w źródłach znajdziesz w [Inwentarzu Plugin](/pl/plugins/plugin-inventory).

Manifesty dołączonych Plugin nie mogą żądać przygotowywania zależności. Duża lub opcjonalna
funkcjonalność Plugin powinna zostać spakowana jako normalny Plugin i zainstalowana przez
tę samą ścieżkę npm/git/ClawHub co Plugin innych firm.

W checkoutach źródeł OpenClaw traktuje repozytorium jako monorepo pnpm. Po
`pnpm install` dołączone Plugin ładują się z `extensions/<id>`, więc pakietowe
zależności workspace są dostępne, a zmiany są pobierane bezpośrednio. Dewelopment w checkoutach
źródeł jest obsługiwany tylko przez pnpm; zwykłe `npm install` w katalogu głównym repozytorium nie jest
obsługiwanym sposobem przygotowania zależności dołączonych Plugin.

| Kształt instalacji               | Lokalizacja dołączonego Plugin        | Właściciel zależności                                                |
| -------------------------------- | ------------------------------------- | -------------------------------------------------------------------- |
| `npm install -g openclaw`        | Zbudowane drzewo czasu działania wewnątrz pakietu | Pakiet OpenClaw oraz jawne przepływy instalacji/aktualizacji/doctor Plugin |
| Checkout git plus `pnpm install` | Pakiety workspace `extensions/<id>`   | Workspace pnpm, w tym własne zależności każdego pakietu Plugin       |
| `openclaw plugins install ...`   | Zarządzany katalog główny Plugin npm/git/ClawHub | Przepływ instalacji/aktualizacji Plugin                              |

## Czyszczenie starszego stanu

Starsze wersje OpenClaw generowały katalogi główne zależności dołączonych Plugin podczas uruchamiania lub
podczas naprawy doctor. Obecne czyszczenie doctor usuwa te przestarzałe katalogi i
dowiązania symboliczne, gdy użyto `--fix`, w tym stare katalogi główne `plugin-runtime-deps`, globalne
dowiązania symboliczne pakietów prefiksu Node wskazujące na przycięte cele `plugin-runtime-deps`,
manifesty `.openclaw-runtime-deps*`, wygenerowane `node_modules` Plugin, katalogi
etapu instalacji oraz lokalne dla pakietu magazyny pnpm. Spakowany postinstall również
usuwa te globalne dowiązania symboliczne przed przycinaniem starszych katalogów docelowych, aby aktualizacje
nie pozostawiały wiszących importów pakietów ESM.

Te ścieżki są wyłącznie pozostałościami starszego stanu. Nowe instalacje nie powinny ich tworzyć.
