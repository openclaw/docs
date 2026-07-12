---
read_when:
    - Debugujesz instalacje pakietów Pluginów
    - Zmieniasz sposób uruchamiania Pluginu, działania narzędzia doctor lub instalowania za pomocą menedżera pakietów
    - Utrzymujesz dystrybuowane instalacje OpenClaw lub manifesty dołączonych pluginów
sidebarTitle: Dependencies
summary: Jak OpenClaw instaluje pakiety pluginów i rozwiązuje ich zależności
title: Rozwiązywanie zależności Pluginów
x-i18n:
    generated_at: "2026-07-12T15:19:55Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: ae24a82568e275399cb7b68729d2805956792852612f84d6918850305f0eb243
    source_path: plugins/dependency-resolution.md
    workflow: 16
---

OpenClaw obsługuje zależności pluginów wyłącznie podczas instalacji lub aktualizacji. Ładowanie
w czasie działania nigdy nie uruchamia menedżera pakietów, nie naprawia drzewa zależności ani nie modyfikuje
katalogu pakietu OpenClaw.

## Podział odpowiedzialności

Pakiety pluginów są właścicielami swoich grafów zależności:

- Zależności środowiska uruchomieniowego znajdują się w `dependencies` lub
  `optionalDependencies` pakietu pluginu.
- Importy SDK/rdzenia są zależnościami równorzędnymi lub importami dostarczanymi przez OpenClaw.
- Lokalne pluginy deweloperskie zapewniają własne, już zainstalowane zależności.
- Pluginy npm i git są instalowane w katalogach głównych pakietów zarządzanych przez OpenClaw.

OpenClaw odpowiada wyłącznie za cykl życia pluginu:

- Wykrycie źródła pluginu.
- Zainstalowanie lub zaktualizowanie pakietu na wyraźne żądanie.
- Zapisanie metadanych instalacji.
- Załadowanie punktu wejścia pluginu.
- Zgłoszenie błędu ze wskazaniem sposobu rozwiązania, gdy brakuje zależności.

## Katalogi główne instalacji

OpenClaw używa stabilnych katalogów głównych dla poszczególnych źródeł:

- Pakiety npm są instalowane w projektach poszczególnych pluginów w
  `~/.openclaw/npm/projects/<encoded-package>`.
- Pakiety git są klonowane w `~/.openclaw/git`.
- Instalacje lokalne, ze ścieżki lub archiwum są kopiowane bądź wskazywane bez naprawiania
  zależności.

Instalacje npm są uruchamiane w katalogu głównym projektu danego pluginu za pomocą:

```bash
cd ~/.openclaw/npm/projects/<encoded-package>
npm install --omit=dev --omit=peer --legacy-peer-deps --ignore-scripts --no-audit --no-fund
```

Polecenie `openclaw plugins install npm-pack:<path.tgz>` używa tego samego katalogu głównego projektu npm
pluginu dla lokalnego archiwum npm-pack: OpenClaw odczytuje metadane npm
archiwum, dodaje je do zarządzanego projektu jako skopiowaną zależność `file:`, uruchamia
powyższą standardową instalację npm, a następnie weryfikuje metadane zainstalowanego pliku blokady
przed uznaniem pluginu za zaufany. Ta ścieżka służy do weryfikacji akceptacji pakietu i
wersji kandydującej do wydania, gdy lokalny artefakt pakietu powinien zachowywać się tak jak
symulowany przez niego artefakt z rejestru.

Używaj `npm-pack:` podczas testowania oficjalnych lub zewnętrznych pakietów pluginów przed
publikacją. Instalacja bezpośrednio z archiwum lub ścieżki jest przydatna do lokalnego debugowania, ale
nie weryfikuje tej samej ścieżki zależności co zainstalowany pakiet npm lub ClawHub.
`npm-pack:` weryfikuje strukturę instalacji zarządzanego pakietu; samo w sobie nie
dowodzi, że plugin jest oficjalną zawartością powiązaną z katalogiem.

Gdy zachowanie zależy od statusu pluginu dołączonego lub zaufanego oficjalnego pluginu,
połącz lokalną weryfikację pakietu z oficjalną instalacją opartą na katalogu albo
ścieżką opublikowanego pakietu, która rejestruje oficjalne zaufanie. Dostęp do uprzywilejowanych funkcji pomocniczych
i obsługę zakresu zaufanych oficjalnych pluginów należy weryfikować przy użyciu tej zaufanej
ścieżki instalacji, a nie wnioskować o nich na podstawie instalacji lokalnego archiwum.

Jeśli plugin przestaje działać z powodu brakującego importu, popraw manifest pakietu,
zamiast ręcznie naprawiać zarządzany projekt. Importy środowiska uruchomieniowego należą do
`dependencies` lub `optionalDependencies` pakietu pluginu; `devDependencies`
nie są instalowane w zarządzanych projektach środowiska uruchomieniowego. Lokalne polecenie `npm install` wewnątrz
`~/.openclaw/npm/projects/<encoded-package>` może tymczasowo odblokować
diagnostykę, ale nie stanowi weryfikacji akceptacji pakietu, ponieważ następna instalacja lub
aktualizacja odtworzy projekt na podstawie metadanych pakietu.

npm może przenosić zależności przechodnie do katalogu `node_modules` projektu danego pluginu
obok pakietu pluginu. OpenClaw skanuje katalog główny zarządzanego projektu
przed uznaniem instalacji za zaufaną i usuwa ten projekt podczas odinstalowywania, dzięki czemu
przeniesione zależności środowiska uruchomieniowego pozostają w granicach usuwania tego pluginu.

Opublikowane pakiety pluginów npm mogą zawierać plik `npm-shrinkwrap.json`; npm używa tego
publikowalnego pliku blokady podczas instalacji, a katalog główny zarządzanego projektu npm OpenClaw
obsługuje go za pośrednictwem standardowej ścieżki instalacji. Publikowalne pakiety pluginów
zarządzane przez OpenClaw muszą zawierać lokalny dla pakietu plik shrinkwrap wygenerowany na podstawie
opublikowanego grafu zależności tego pakietu:

```bash
pnpm deps:shrinkwrap:generate
pnpm deps:shrinkwrap:check
```

Generator usuwa `devDependencies` pluginu, stosuje zasady nadpisywania obszaru roboczego
i zapisuje `extensions/<id>/npm-shrinkwrap.json` dla każdego pluginu z
`openclaw.release.publishToNpm: true`. Pakiety pluginów innych firm również mogą
zawierać plik shrinkwrap; OpenClaw nie wymaga go dla pakietów społecznościowych, ale
npm respektuje go, gdy jest obecny.

Przed uznaniem lokalnego pakietu za weryfikację wersji kandydującej do wydania sprawdź
archiwum, które zostanie zainstalowane:

```bash
npm pack --pack-destination /tmp
tar -xOf /tmp/<plugin-package>.tgz package/package.json
tar -tf /tmp/<plugin-package>.tgz | grep '^package/dist/'
```

W przypadku zmian zależności sprawdź również, czy instalacja produkcyjna potrafi rozwiązać
pakiety środowiska uruchomieniowego bez zależności deweloperskich:

```bash
tmpdir=$(mktemp -d)
(
  cd "$tmpdir"
  npm init -y >/dev/null
  npm install --package-lock-only --omit=dev --omit=peer --legacy-peer-deps --ignore-scripts /tmp/<plugin-package>.tgz
)
rm -rf "$tmpdir"
```

Pakiety pluginów npm zarządzane przez OpenClaw mogą być również publikowane z jawnymi
`bundledDependencies`. Ścieżka publikowania npm nakłada listę nazw zależności
środowiska uruchomieniowego, usuwa z publikowanego manifestu metadane obszaru roboczego używane wyłącznie podczas programowania,
uruchamia instalację npm bez skryptów dla lokalnych zależności środowiska uruchomieniowego pakietu,
a następnie tworzy lub publikuje archiwum pluginu z dołączonymi plikami tych zależności.
Pakiety intensywnie korzystające z kodu natywnego (Codex, ACPX, Copilot, llama.cpp,
memory-lancedb, Tlon) wyłączają tę funkcję za pomocą
`openclaw.release.bundleRuntimeDependencies: false`; nadal zawierają
plik shrinkwrap, ale npm rozwiązuje zależności środowiska uruchomieniowego podczas instalacji, zamiast
umieszczać pliki binarne każdej platformy w archiwum pluginu. Główny pakiet `openclaw`
nie dołącza całego swojego drzewa zależności.

Pluginy importujące `openclaw/plugin-sdk/*` deklarują `openclaw` jako zależność
równorzędną. OpenClaw nie pozwala npm zainstalować w zarządzanym projekcie osobnej kopii
pakietu hosta z rejestru, ponieważ nieaktualny pakiet hosta może wpływać
na rozwiązywanie zależności równorzędnych przez npm wewnątrz tego pluginu. Zarządzane instalacje npm pomijają
rozwiązywanie i materializację zależności równorzędnych przez npm, a OpenClaw ponownie ustanawia lokalne dla pluginu
dowiązania `node_modules/openclaw` dla zainstalowanych pakietów deklarujących zależność równorzędną
od hosta po instalacji lub aktualizacji.

Instalacje git klonują lub odświeżają repozytorium, a następnie uruchamiają:

```bash
npm install --omit=dev --ignore-scripts --no-audit --no-fund
```

Zainstalowany plugin jest następnie ładowany z katalogu tego pakietu, więc
rozwiązywanie lokalnego dla pakietu i nadrzędnego katalogu `node_modules` działa tak samo jak
w przypadku zwykłego pakietu Node.

## Lokalne pluginy

Lokalne pluginy są katalogami kontrolowanymi przez programistę. OpenClaw nigdy nie uruchamia
dla nich `npm install`, `pnpm install` ani naprawy zależności; jeśli lokalny
plugin ma zależności, zainstaluj je w tym pluginie przed jego załadowaniem.

Lokalne pluginy TypeScript innych firm są awaryjnie ładowane przez Jiti.
Spakowane pluginy JavaScript i dołączone pluginy wewnętrzne są natomiast ładowane za pomocą natywnych
mechanizmów import/require.

## Uruchamianie i ponowne ładowanie

Uruchomienie Gateway i ponowne załadowanie konfiguracji nigdy nie instalują zależności pluginów. Odczytują
rekordy instalacji pluginów, wyznaczają punkt wejścia i go ładują.

Brak zależności w czasie działania powoduje niepowodzenie ładowania pluginu z błędem wskazującym
operatorowi jawny sposób naprawy:

```bash
openclaw plugins update <id>
openclaw plugins install <source>
openclaw doctor --fix
```

`doctor --fix` usuwa starszy stan zależności wygenerowany przez OpenClaw i może
odzyskać dostępne do pobrania pluginy, których brakuje w lokalnych rekordach instalacji, jeśli
konfiguracja nadal się do nich odwołuje. Doctor nie naprawia zależności
już zainstalowanego lokalnego pluginu.

## Dołączone pluginy

Lekkie i krytyczne dla rdzenia pluginy dołączone są dostarczane jako część OpenClaw. Nie powinny
mieć rozbudowanego drzewa zależności środowiska uruchomieniowego albo powinny zostać przeniesione do
pakietu dostępnego do pobrania z ClawHub/npm.

Bieżącą wygenerowaną listę pluginów dostarczanych w pakiecie rdzenia,
instalowanych zewnętrznie lub pozostających wyłącznie w kodzie źródłowym zawiera
[wykaz pluginów](/pl/plugins/plugin-inventory).

Manifesty dołączonych pluginów nie mogą żądać przygotowywania zależności. Rozbudowana lub
opcjonalna funkcjonalność pluginu powinna być spakowana jako zwykły plugin i
instalowana tą samą ścieżką npm/git/ClawHub co pluginy innych firm.

W kopiach roboczych kodu źródłowego OpenClaw traktuje repozytorium jako monorepo pnpm.
Po wykonaniu `pnpm install` dołączone pluginy są ładowane z `extensions/<id>`, dzięki czemu
lokalne zależności obszaru roboczego pakietu są dostępne, a zmiany są uwzględniane
bezpośrednio. Programowanie w kopii roboczej kodu źródłowego obsługuje wyłącznie pnpm; zwykłe `npm install` w
katalogu głównym repozytorium nie przygotowuje zależności dołączonych pluginów.

| Sposób instalacji                 | Lokalizacja dołączonego pluginu          | Właściciel zależności                                                   |
| -------------------------------- | ------------------------------------- | -------------------------------------------------------------------- |
| `npm install -g openclaw`        | Zbudowane drzewo środowiska uruchomieniowego wewnątrz pakietu | Pakiet OpenClaw oraz jawne przepływy instalacji, aktualizacji i obsługi przez Doctor dla pluginu |
| Kopia robocza git i `pnpm install` | Pakiety obszaru roboczego `extensions/<id>` | Obszar roboczy pnpm, w tym własne zależności każdego pakietu pluginu |
| `openclaw plugins install ...`   | Zarządzany katalog główny projektu npm/git/ClawHub | Przepływ instalacji i aktualizacji pluginu                           |

## Usuwanie starszego stanu

Starsze wersje OpenClaw generowały katalogi główne zależności dołączonych pluginów podczas uruchamiania
lub naprawy przez Doctor. Bieżące czyszczenie przez Doctor usuwa te nieaktualne
katalogi i dowiązania symboliczne za pomocą `--fix`, w tym stare katalogi główne `plugin-runtime-deps`,
globalne dowiązania symboliczne pakietów z prefiksu Node wskazujące na usunięte
cele `plugin-runtime-deps`, manifesty `.openclaw-runtime-deps*`, wygenerowane
katalogi `node_modules` pluginów, katalogi etapów instalacji oraz lokalne dla pakietu magazyny
pnpm. Skrypt wykonywany po instalacji spakowanej wersji również usuwa te globalne dowiązania symboliczne przed
usunięciem starszych katalogów docelowych, dzięki czemu aktualizacje nie pozostawiają nieprawidłowych importów
pakietów ESM.

Starsze instalacje npm używały również współdzielonego katalogu głównego `~/.openclaw/npm/node_modules`.
Bieżące przepływy instalacji, aktualizacji, odinstalowywania i obsługi przez Doctor nadal rozpoznają ten
starszy płaski katalog główny wyłącznie na potrzeby odzyskiwania i czyszczenia. Nowe instalacje npm tworzą
zamiast niego katalogi główne projektów dla poszczególnych pluginów.
