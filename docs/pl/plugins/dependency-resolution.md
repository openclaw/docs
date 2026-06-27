---
read_when:
    - Debugujesz instalacje pakietów Plugin
    - Zmieniasz zachowanie uruchamiania Plugin, działania doctor lub instalacji przez menedżera pakietów
    - Utrzymujesz pakietowe instalacje OpenClaw lub manifesty dołączonych Pluginów
sidebarTitle: Dependencies
summary: Jak OpenClaw instaluje pakiety Plugin i rozwiązuje zależności Plugin
title: Rozwiązywanie zależności Plugin
x-i18n:
    generated_at: "2026-06-27T17:53:40Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: d5d2f3efe40c50433bd44961f6f5b8d03f3c69d3f5112163613b8efbd0f17c65
    source_path: plugins/dependency-resolution.md
    workflow: 16
---

OpenClaw utrzymuje prace nad zależnościami pluginów na etapie instalacji/aktualizacji. Ładowanie w czasie działania
nie uruchamia menedżerów pakietów, nie naprawia drzew zależności ani nie modyfikuje katalogu
pakietu OpenClaw.

## Podział odpowiedzialności

Pakiety pluginów są właścicielami swojego grafu zależności:

- zależności runtime znajdują się w `dependencies` lub
  `optionalDependencies` pakietu pluginu
- importy SDK/core są zależnościami peer albo importami dostarczanymi przez OpenClaw
- lokalne pluginy deweloperskie dostarczają własne, już zainstalowane zależności
- pluginy npm i git są instalowane w korzeniach pakietów należących do OpenClaw

OpenClaw odpowiada wyłącznie za cykl życia pluginu:

- wykrycie źródła pluginu
- instalację lub aktualizację pakietu na wyraźne żądanie
- zapisanie metadanych instalacji
- załadowanie entrypointu pluginu
- zakończenie błędem z możliwym do wykonania komunikatem, gdy brakuje zależności

## Korzenie instalacji

OpenClaw używa stabilnych korzeni dla każdego źródła:

- pakiety npm instalują się w projektach per plugin pod
  `~/.openclaw/npm/projects/<encoded-package>`
- pakiety git są klonowane pod `~/.openclaw/git`
- instalacje lokalne/ścieżkowe/archiwalne są kopiowane lub referencjonowane bez naprawy zależności

Instalacje npm są uruchamiane w tym korzeniu projektu per plugin za pomocą:

```bash
cd ~/.openclaw/npm/projects/<encoded-package>
npm install --omit=dev --omit=peer --legacy-peer-deps --ignore-scripts --no-audit --no-fund
```

`openclaw plugins install npm-pack:<path.tgz>` używa tego samego korzenia projektu npm
per plugin dla lokalnego tarballa npm-pack. OpenClaw odczytuje metadane npm tarballa,
dodaje go do zarządzanego projektu jako skopiowaną zależność `file:`, uruchamia
standardową instalację npm, a następnie weryfikuje metadane zainstalowanego lockfile przed
zaufaniem pluginowi.
Jest to przeznaczone do dowodów akceptacji pakietu i release candidate, gdy
lokalny artefakt pack powinien zachowywać się jak artefakt rejestru, który symuluje.

npm może hoistować zależności przechodnie do `node_modules` projektu per plugin
obok pakietu pluginu. OpenClaw skanuje korzeń zarządzanego projektu przed
zaufaniem instalacji i usuwa ten projekt podczas odinstalowania, więc
hoistowane zależności runtime pozostają wewnątrz granicy sprzątania tego pluginu.

Opublikowane pakiety pluginów npm mogą dostarczać `npm-shrinkwrap.json`. npm używa tego
publikowalnego lockfile podczas instalacji, a zarządzany przez OpenClaw korzeń projektu npm
obsługuje go przez standardową ścieżkę instalacji npm. Publikowalne pakiety pluginów
należące do OpenClaw muszą zawierać lokalny dla pakietu shrinkwrap wygenerowany z
opublikowanego grafu zależności tego pakietu pluginu:

```bash
pnpm deps:shrinkwrap:generate
pnpm deps:shrinkwrap:check
```

Generator usuwa `devDependencies` pluginu, stosuje politykę override workspace
i zapisuje `extensions/<id>/npm-shrinkwrap.json` dla każdego pluginu
`publishToNpm`. Pakiety pluginów firm trzecich również mogą dostarczać shrinkwrap;
OpenClaw nie wymaga go od pakietów społecznościowych, ale npm uszanuje go,
gdy jest obecny.

Pakiety pluginów npm należące do OpenClaw mogą również publikować z jawnymi
`bundledDependencies`. Ścieżka publikacji npm nakłada listę nazw zależności
runtime, usuwa metadane workspace tylko do developmentu z manifestu publikowanego
pakietu, uruchamia instalację npm bez skryptów dla lokalnych dla pakietu zależności
runtime, a następnie pakuje lub publikuje tarball pluginu z dołączonymi plikami
tych zależności. Pakiety mocno zależne od natywnych komponentów, w tym runtime'y
Codex i ACP, rezygnują z tego przez `openclaw.release.bundleRuntimeDependencies: false`;
te pakiety nadal dostarczają swój shrinkwrap, ale npm rozwiązuje zależności runtime
podczas instalacji zamiast osadzać każdy binarny plik platformowy w tarballu pluginu. Główny
pakiet `openclaw` nie bundluje pełnego drzewa swoich zależności.

Pluginy importujące `openclaw/plugin-sdk/*` deklarują `openclaw` jako zależność peer.
OpenClaw nie pozwala npm zainstalować oddzielnej kopii pakietu hosta z rejestru
w zarządzanym projekcie, ponieważ nieaktualne pakiety hosta mogą wpływać na
rozwiązywanie peer npm wewnątrz tego pluginu. Zarządzane instalacje npm pomijają
rozwiązywanie/materializację peer npm, a OpenClaw po instalacji lub aktualizacji
ponownie wymusza linki lokalne dla pluginu `node_modules/openclaw` dla
zainstalowanych pakietów, które deklarują host peer.

Instalacje git klonują lub odświeżają repozytorium, a następnie uruchamiają:

```bash
npm install --omit=dev --ignore-scripts --no-audit --no-fund
```

Zainstalowany plugin ładuje się następnie z tego katalogu pakietu, więc lokalne dla pakietu
i nadrzędne rozwiązywanie `node_modules` działa tak samo jak w normalnym
pakiecie Node.

## Lokalne pluginy

Lokalne pluginy są traktowane jako katalogi kontrolowane przez dewelopera. OpenClaw nie
uruchamia dla nich `npm install`, `pnpm install` ani naprawy zależności. Jeśli lokalny
plugin ma zależności, zainstaluj je w tym pluginie przed jego załadowaniem.

Lokalne pluginy TypeScript firm trzecich mogą używać awaryjnej ścieżki Jiti. Spakowane
pluginy JavaScript i bundlowane pluginy wewnętrzne ładują się przez natywne
import/require zamiast Jiti.

## Uruchamianie i przeładowanie

Start Gateway i przeładowanie konfiguracji nigdy nie instalują zależności pluginów. Odczytują
rekordy instalacji pluginów, wyliczają entrypoint i ładują go.

Jeśli w czasie działania brakuje zależności, plugin nie załaduje się, a błąd
powinien wskazać operatorowi jawne rozwiązanie:

```bash
openclaw plugins update <id>
openclaw plugins install <source>
openclaw doctor --fix
```

`doctor --fix` może wyczyścić legacy stan zależności wygenerowany przez OpenClaw i odzyskać
pobieralne pluginy, których brakuje w lokalnych rekordach instalacji, gdy konfiguracja
się do nich odwołuje. Doctor nie naprawia zależności już zainstalowanego
lokalnego pluginu.

## Bundlowane pluginy

Lekkie i krytyczne dla core bundlowane pluginy są dostarczane jako część OpenClaw.
Powinny albo nie mieć ciężkiego drzewa zależności runtime, albo zostać przeniesione do
pobieralnego pakietu na ClawHub/npm.

Aktualną wygenerowaną listę pluginów dostarczanych w pakiecie core, instalowanych
zewnętrznie lub pozostających tylko w źródłach znajdziesz w [Inwentarzu pluginów](/pl/plugins/plugin-inventory).

Manifesty bundlowanych pluginów nie mogą żądać stagingu zależności. Duża lub opcjonalna
funkcjonalność pluginu powinna być spakowana jako normalny plugin i instalowana przez
tę samą ścieżkę npm/git/ClawHub co pluginy firm trzecich.

W checkoutach źródłowych OpenClaw traktuje repozytorium jako monorepo pnpm. Po
`pnpm install` bundlowane pluginy ładują się z `extensions/<id>`, więc lokalne dla pakietu
zależności workspace są dostępne, a zmiany są wykrywane bezpośrednio. Development w
checkoucie źródłowym jest wyłącznie pnpm; zwykłe `npm install` w korzeniu repozytorium nie jest
obsługiwanym sposobem przygotowania zależności bundlowanych pluginów.

| Kształt instalacji               | Lokalizacja bundlowanego pluginu      | Właściciel zależności                                                |
| -------------------------------- | ------------------------------------- | -------------------------------------------------------------------- |
| `npm install -g openclaw`        | Zbudowane drzewo runtime w pakiecie   | Pakiet OpenClaw i jawne przepływy instalacji/aktualizacji/doctor pluginu |
| Checkout git plus `pnpm install` | Pakiety workspace `extensions/<id>`   | Workspace pnpm, w tym własne zależności każdego pakietu pluginu      |
| `openclaw plugins install ...`   | Zarządzany projekt npm/korzeń git/ClawHub | Przepływ instalacji/aktualizacji pluginu                             |

## Czyszczenie legacy

Starsze wersje OpenClaw generowały korzenie zależności bundlowanych pluginów przy starcie lub
podczas naprawy doctor. Obecne czyszczenie doctor usuwa te przestarzałe katalogi i
symlinki, gdy używane jest `--fix`, w tym stare korzenie `plugin-runtime-deps`, globalne
symlinki pakietów prefiksu Node wskazujące na przycięte cele `plugin-runtime-deps`,
manifesty `.openclaw-runtime-deps*`, wygenerowane pluginowe `node_modules`, katalogi
etapu instalacji oraz lokalne dla pakietu magazyny pnpm. Spakowany postinstall również
usuwa te globalne symlinki przed przycięciem legacy korzeni docelowych, aby aktualizacje
nie pozostawiały wiszących importów pakietów ESM.

Starsze instalacje npm używały również wspólnego korzenia `~/.openclaw/npm/node_modules`.
Obecne przepływy instalacji, aktualizacji, odinstalowania i doctor nadal rozpoznają ten legacy
płaski korzeń wyłącznie na potrzeby odzyskiwania i czyszczenia. Nowe instalacje npm powinny
zamiast tego tworzyć korzenie projektów per plugin.
