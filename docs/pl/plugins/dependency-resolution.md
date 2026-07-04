---
read_when:
    - Debugujesz instalacje pakietów Plugin
    - Zmieniasz zachowanie uruchamiania Plugin, doctor lub instalacji za pomocą menedżera pakietów
    - Utrzymujesz pakietowe instalacje OpenClaw lub manifesty dołączonych Pluginów
sidebarTitle: Dependencies
summary: Jak OpenClaw instaluje pakiety Plugin i rozwiązuje zależności Plugin
title: Rozwiązywanie zależności Plugin
x-i18n:
    generated_at: "2026-07-04T15:39:47Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: adc6cc80bfe4e4c06ca0e99877c0d4148861ff88366ae233c254aac56c7cdf6d
    source_path: plugins/dependency-resolution.md
    workflow: 16
---

OpenClaw wykonuje prace nad zależnościami wtyczek podczas instalacji/aktualizacji. Ładowanie w czasie działania
nie uruchamia menedżerów pakietów, nie naprawia drzew zależności ani nie modyfikuje katalogu pakietu
OpenClaw.

## Podział odpowiedzialności

Pakiety wtyczek odpowiadają za własny graf zależności:

- zależności czasu działania znajdują się w `dependencies` lub
  `optionalDependencies` pakietu wtyczki
- importy SDK/rdzenia są równorzędne albo dostarczane jako importy OpenClaw
- lokalne wtyczki deweloperskie dostarczają własne, już zainstalowane zależności
- wtyczki npm i git są instalowane w katalogach pakietów zarządzanych przez OpenClaw

OpenClaw odpowiada tylko za cykl życia wtyczki:

- wykrycie źródła wtyczki
- zainstalowanie lub zaktualizowanie pakietu na wyraźne żądanie
- zapisanie metadanych instalacji
- załadowanie punktu wejścia wtyczki
- zakończenie błędem z możliwą do wykonania instrukcją, gdy brakuje zależności

## Katalogi instalacji

OpenClaw używa stabilnych katalogów dla każdego źródła:

- pakiety npm instalują się w projektach przypisanych do wtyczki pod
  `~/.openclaw/npm/projects/<encoded-package>`
- pakiety git są klonowane pod `~/.openclaw/git`
- instalacje lokalne/ścieżkowe/archiwalne są kopiowane albo wskazywane bez naprawy zależności

Instalacje npm działają w tym katalogu projektu przypisanego do wtyczki z:

```bash
cd ~/.openclaw/npm/projects/<encoded-package>
npm install --omit=dev --omit=peer --legacy-peer-deps --ignore-scripts --no-audit --no-fund
```

`openclaw plugins install npm-pack:<path.tgz>` używa tego samego katalogu projektu npm przypisanego do wtyczki
dla lokalnego tarballa npm-pack. OpenClaw odczytuje metadane npm tarballa,
dodaje go do zarządzanego projektu jako skopiowaną zależność `file:`, uruchamia
normalną instalację npm, a następnie weryfikuje metadane zainstalowanego lockfile'a przed
zaufaniem wtyczce.
Jest to przeznaczone do akceptacji pakietu i dowodu dla kandydata do wydania, gdy
lokalny artefakt pack powinien zachowywać się jak symulowany artefakt z rejestru.

Używaj `npm-pack:` podczas testowania oficjalnych lub zewnętrznych pakietów wtyczek przed
publikacją. Surowe archiwum albo instalacja ze ścieżki są przydatne do lokalnego debugowania, ale
nie dowodzą tej samej ścieżki zależności co zainstalowany pakiet npm albo ClawHub.
`npm-pack:` dowodzi kształtu instalacji zarządzanego pakietu; samo w sobie nie jest
dowodem, że wtyczka jest oficjalną zawartością powiązaną z katalogiem.

Gdy zachowanie zależy od statusu wtyczki dołączonej albo zaufanej oficjalnej wtyczki, połącz
dowód lokalnego pakietu z oficjalną instalacją opartą na katalogu albo opublikowaną
ścieżką pakietu, która zapisuje oficjalne zaufanie. Uprzywilejowany dostęp pomocniczy oraz
obsługa zakresu zaufanych oficjalnych wtyczek powinny być walidowane na tej zaufanej ścieżce
instalacji, a nie wnioskowane z instalacji lokalnego tarballa.

Jeśli wtyczka zawiedzie w czasie działania z powodu brakującego importu, napraw manifest pakietu
zamiast ręcznie naprawiać zarządzany projekt. Importy czasu działania należą do
`dependencies` lub `optionalDependencies` pakietu wtyczki; `devDependencies` nie są
instalowane dla zarządzanych projektów czasu działania. Lokalne `npm install` wewnątrz
`~/.openclaw/npm/projects/<encoded-package>` może odblokować tymczasową diagnostykę,
ale nie jest dowodem akceptacji pakietu, ponieważ następna instalacja albo aktualizacja
odtworzy projekt z metadanych pakietu.

npm może wynosić zależności przechodnie do `node_modules` projektu przypisanego do wtyczki
obok pakietu wtyczki. OpenClaw skanuje katalog główny zarządzanego projektu
przed zaufaniem instalacji i usuwa ten projekt podczas odinstalowania, więc
wyniesione zależności czasu działania pozostają w granicy sprzątania tej wtyczki.

Opublikowane pakiety wtyczek npm mogą dostarczać `npm-shrinkwrap.json`. npm używa tego
publikowalnego lockfile'a podczas instalacji, a katalog główny zarządzanego projektu npm OpenClaw
obsługuje go przez normalną ścieżkę instalacji npm. Publikowalne
pakiety wtyczek zarządzane przez OpenClaw muszą zawierać lokalny dla pakietu shrinkwrap wygenerowany z
opublikowanego grafu zależności tego pakietu wtyczki:

```bash
pnpm deps:shrinkwrap:generate
pnpm deps:shrinkwrap:check
```

Generator usuwa `devDependencies` wtyczki, stosuje politykę override'ów obszaru roboczego
i zapisuje `extensions/<id>/npm-shrinkwrap.json` dla każdej wtyczki
`publishToNpm`. Pakiety wtyczek firm trzecich także mogą dostarczać shrinkwrap;
OpenClaw nie wymaga go dla pakietów społecznościowych, ale npm uszanuje go,
gdy jest obecny.

Przed potraktowaniem lokalnego pakietu jako dowodu dla kandydata do wydania sprawdź tarball,
który zostanie zainstalowany:

```bash
npm pack --pack-destination /tmp
tar -xOf /tmp/<plugin-package>.tgz package/package.json
tar -tf /tmp/<plugin-package>.tgz | grep '^package/dist/'
```

Przy zmianach zależności zweryfikuj także, że instalacja produkcyjna może rozwiązać
pakiety czasu działania bez zależności deweloperskich:

```bash
tmpdir=$(mktemp -d)
(
  cd "$tmpdir"
  npm init -y >/dev/null
  npm install --package-lock-only --omit=dev --omit=peer --legacy-peer-deps --ignore-scripts /tmp/<plugin-package>.tgz
)
rm -rf "$tmpdir"
```

Pakiety wtyczek npm zarządzane przez OpenClaw mogą także publikować się z jawnymi
`bundledDependencies`. Ścieżka publikacji npm nakłada listę nazw zależności czasu działania,
usuwa wyłącznie deweloperskie metadane obszaru roboczego z manifestu publikowanego pakietu,
uruchamia instalację npm bez skryptów dla lokalnych dla pakietu zależności czasu działania,
a następnie pakuje albo publikuje tarball wtyczki z dołączonymi plikami tych zależności.
Pakiety mocno zależne od natywnych składników, w tym środowiska uruchomieniowe Codex i ACP, rezygnują z tego
przez `openclaw.release.bundleRuntimeDependencies: false`; te pakiety nadal
dostarczają swój shrinkwrap, ale npm rozwiązuje zależności czasu działania podczas instalacji
zamiast osadzać każdy binarny plik platformy w tarballu wtyczki. Główny
pakiet `openclaw` nie dołącza pełnego drzewa zależności.

Wtyczki importujące `openclaw/plugin-sdk/*` deklarują `openclaw` jako zależność równorzędną.
OpenClaw nie pozwala npm zainstalować osobnej kopii pakietu hosta z rejestru
w zarządzanym projekcie, ponieważ przestarzałe pakiety hosta mogą wpływać na
rozwiązywanie zależności równorzędnych npm wewnątrz tej wtyczki. Zarządzane instalacje npm pomijają
rozwiązywanie/materializację zależności równorzędnych npm, a OpenClaw ponownie wymusza lokalne dla wtyczki
linki `node_modules/openclaw` dla zainstalowanych pakietów, które deklarują zależność równorzędną hosta,
po instalacji albo aktualizacji.

Instalacje git klonują albo odświeżają repozytorium, a następnie uruchamiają:

```bash
npm install --omit=dev --ignore-scripts --no-audit --no-fund
```

Zainstalowana wtyczka ładuje się potem z tego katalogu pakietu, więc rozwiązywanie lokalnych dla pakietu
i nadrzędnych `node_modules` działa tak samo jak dla zwykłego pakietu
Node.

## Lokalne wtyczki

Lokalne wtyczki są traktowane jako katalogi kontrolowane przez dewelopera. OpenClaw nie
uruchamia dla nich `npm install`, `pnpm install` ani naprawy zależności. Jeśli lokalna
wtyczka ma zależności, zainstaluj je w tej wtyczce przed jej załadowaniem.

Lokalne wtyczki TypeScript firm trzecich mogą używać awaryjnej ścieżki Jiti. Spakowane
wtyczki JavaScript i dołączone wtyczki wewnętrzne ładują się przez natywne
import/require zamiast Jiti.

## Uruchamianie i ponowne ładowanie

Uruchamianie Gateway i ponowne ładowanie konfiguracji nigdy nie instalują zależności wtyczek. Odczytują
rekordy instalacji wtyczek, obliczają punkt wejścia i go ładują.

Jeśli w czasie działania brakuje zależności, wtyczka nie ładuje się, a błąd
powinien wskazać operatorowi wyraźną naprawę:

```bash
openclaw plugins update <id>
openclaw plugins install <source>
openclaw doctor --fix
```

`doctor --fix` może wyczyścić starszy stan zależności wygenerowany przez OpenClaw i odzyskać
pobieralne wtyczki, których brakuje w lokalnych rekordach instalacji, gdy konfiguracja
się do nich odwołuje. Doctor nie naprawia zależności dla już zainstalowanej
lokalnej wtyczki.

## Dołączone wtyczki

Lekkie i krytyczne dla rdzenia dołączone wtyczki są dostarczane jako część OpenClaw.
Powinny albo nie mieć ciężkiego drzewa zależności czasu działania, albo zostać przeniesione do
pobieralnego pakietu w ClawHub/npm.

Aktualną wygenerowaną listę wtyczek, które są dostarczane w pakiecie rdzenia, instalują się
zewnętrznie albo pozostają tylko w źródłach, znajdziesz w [Inwentarzu Plugin](/pl/plugins/plugin-inventory).

Manifesty dołączonych wtyczek nie mogą żądać przygotowywania zależności. Duża albo opcjonalna
funkcjonalność wtyczki powinna zostać spakowana jako normalna wtyczka i zainstalowana przez
tę samą ścieżkę npm/git/ClawHub co wtyczki firm trzecich.

W checkoutach źródłowych OpenClaw traktuje repozytorium jako monorepo pnpm. Po
`pnpm install` dołączone wtyczki ładują się z `extensions/<id>`, więc lokalne dla pakietu
zależności obszaru roboczego są dostępne, a edycje są pobierane bezpośrednio. Rozwój w
checkoucie źródłowym obsługuje tylko pnpm; zwykłe `npm install` w katalogu głównym repozytorium nie jest
obsługiwanym sposobem przygotowania zależności dołączonych wtyczek.

| Kształt instalacji               | Lokalizacja dołączonej wtyczki        | Właściciel zależności                                                |
| -------------------------------- | ------------------------------------- | -------------------------------------------------------------------- |
| `npm install -g openclaw`        | Zbudowane drzewo czasu działania wewnątrz pakietu | Pakiet OpenClaw i jawne przepływy instalacji/aktualizacji/doctor wtyczek |
| Checkout git plus `pnpm install` | Pakiety obszaru roboczego `extensions/<id>` | Obszar roboczy pnpm, w tym własne zależności każdego pakietu wtyczki |
| `openclaw plugins install ...`   | Zarządzany projekt npm/katalog główny git/ClawHub | Przepływ instalacji/aktualizacji wtyczki                             |

## Czyszczenie starszych wersji

Starsze wersje OpenClaw generowały katalogi zależności dołączonych wtyczek podczas uruchamiania albo
naprawy przez doctor. Obecne czyszczenie doctor usuwa te przestarzałe katalogi i
dowiązania symboliczne, gdy użyto `--fix`, w tym stare katalogi `plugin-runtime-deps`, globalne
dowiązania symboliczne pakietów prefiksu Node wskazujące na przycięte cele `plugin-runtime-deps`,
manifesty `.openclaw-runtime-deps*`, wygenerowane `node_modules` wtyczek, katalogi
etapów instalacji oraz lokalne dla pakietu magazyny pnpm. Spakowany postinstall także
usuwa te globalne dowiązania symboliczne przed przycięciem starszych katalogów docelowych, aby aktualizacje
nie zostawiały wiszących importów pakietów ESM.

Starsze instalacje npm używały także współdzielonego katalogu głównego `~/.openclaw/npm/node_modules`.
Obecne przepływy instalacji, aktualizacji, odinstalowania i doctor nadal rozpoznają ten starszy
płaski katalog główny tylko na potrzeby odzyskiwania i czyszczenia. Nowe instalacje npm powinny tworzyć
katalogi projektów przypisane do wtyczek.
