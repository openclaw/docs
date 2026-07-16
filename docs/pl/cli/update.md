---
read_when:
    - Chcesz bezpiecznie zaktualizować kopię roboczą kodu źródłowego
    - Debugujesz dane wyjściowe lub opcje `openclaw update`
    - Trzeba zrozumieć skrótowe zachowanie `--update`
summary: Dokumentacja CLI dla `openclaw update` (względnie bezpieczna aktualizacja źródła + automatyczny restart gatewaya)
title: Aktualizacja
x-i18n:
    generated_at: "2026-07-16T18:11:25Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: b46696f6b9cba5c318f870bcb6c5ea8e0652940968da2ad85e86709fe4c11146
    source_path: cli/update.md
    workflow: 16
---

# `openclaw update`

Zaktualizuj OpenClaw i przełączaj się między kanałami stable/extended-stable/beta/dev.

Jeśli instalację przeprowadzono za pomocą **npm/pnpm/bun** (instalacja globalna, bez metadanych git),
aktualizacje odbywają się zgodnie z przepływem menedżera pakietów opisanym w sekcji
[Aktualizowanie](/pl/install/updating).

## Użycie

```bash
openclaw update
openclaw update status
openclaw update repair
openclaw update wizard
openclaw update --channel extended-stable
openclaw update --channel beta
openclaw update --channel dev
openclaw update --tag beta
openclaw update --tag main
openclaw update --dry-run
openclaw update --no-restart
openclaw update --yes
openclaw update --acknowledge-clawhub-risk
openclaw update --json
openclaw --update
```

`openclaw --update` jest przekształcane w `openclaw update` (przydatne w powłokach i
skryptach uruchamiających).

## Opcje

| Flaga                                             | Opis                                                                                                                                                                                                                                                                                                                                  |
| ------------------------------------------------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `--no-restart`                                   | Pomija ponowne uruchomienie usługi Gateway po pomyślnej aktualizacji. Aktualizacje za pośrednictwem menedżera pakietów, które ponownie uruchamiają usługę, przed pomyślnym zakończeniem polecenia sprawdzają, czy ponownie uruchomiona usługa zgłasza oczekiwaną wersję.                                                                                |
| `--channel <stable\|extended-stable\|beta\|dev>` | Ustawia kanał aktualizacji i zachowuje go po pomyślnej aktualizacji rdzenia. Kanał extended-stable jest dostępny tylko dla pakietów.                                                                                                                                                                                                                                            |
| `--tag <dist-tag\|version\|spec>`                | Zastępuje docelowy pakiet tylko dla tej aktualizacji. Nie można go połączyć z aktywnym kanałem `extended-stable`, dla którego wymagany jest zweryfikowany, dokładny cel. W przypadku innych instalacji pakietów `main` jest mapowane na `github:openclaw/openclaw#main`; specyfikacje źródeł GitHub/git są pakowane do tymczasowego archiwum tar przed etapową globalną instalacją npm. |
| `--dry-run`                                      | Wyświetla podgląd zaplanowanych działań (przepływu kanału/tagu/celu/ponownego uruchomienia) bez zapisywania konfiguracji, instalowania, synchronizowania pluginów ani ponownego uruchamiania.                                                                                                                                                                                                                |
| `--json`                                         | Wyświetla nadający się do przetwarzania maszynowego kod JSON `UpdateRunResult`. Obejmuje `postUpdate.plugins.warnings`, gdy zarządzany plugin wymaga naprawy, szczegóły mechanizmu rezerwowego pluginu kanału beta oraz `postUpdate.plugins.integrityDrifts`, gdy podczas synchronizacji po aktualizacji zostanie wykryta rozbieżność artefaktu pluginu npm.                                                                 |
| `--timeout <seconds>`                            | Limit czasu dla poszczególnych kroków. Domyślnie `1800`.                                                                                                                                                                                                                                                                                                            |
| `--yes`                                          | Pomija monity o potwierdzenie (na przykład potwierdzenie obniżenia wersji).                                                                                                                                                                                                                                                                              |
| `--acknowledge-clawhub-risk`                     | Zezwala synchronizacji pluginów po aktualizacji na kontynuowanie mimo ostrzeżeń dotyczących zaufania do społecznościowych pakietów ClawHub bez interaktywnego monitu. Bez tej opcji ryzykowne wydania społecznościowe są pomijane i pozostają niezmienione, gdy OpenClaw nie może wyświetlić monitu. Oficjalne pakiety ClawHub i dołączone źródła pluginów pomijają ten monit.                                                     |

Flaga `--verbose` nie istnieje. Aby wyświetlić podgląd zaplanowanych działań, należy użyć `--dry-run`,
aby uzyskać wyniki nadające się do przetwarzania maszynowego — `--json`, a aby sprawdzić
wyłącznie kanał/dostępność — `openclaw update status --json`. Szczegółowość konsoli Gateway (`--verbose`) i
poziom rejestrowania w pliku (`logging.level: "debug"`/`"trace"`) są niezależnymi ustawieniami; zobacz
[Rejestrowanie zdarzeń Gateway](/pl/gateway/logging).

<Note>
W trybie Nix (`OPENCLAW_NIX_MODE=1`) modyfikujące uruchomienia `openclaw update` są wyłączone. Zamiast tego należy zaktualizować źródło Nix lub dane wejściowe flake dla tej instalacji; w przypadku nix-openclaw należy skorzystać z przewodnika [Szybki start](https://github.com/openclaw/nix-openclaw#quick-start), który w pierwszej kolejności wykorzystuje agenta. `openclaw update status` i `openclaw update --dry-run` pozostają tylko do odczytu.
</Note>

<Warning>
Obniżenie wersji wymaga potwierdzenia, ponieważ starsze wersje mogą uszkodzić konfigurację.
Jeśli instalacja przeniosła już sesje do SQLite, przed uruchomieniem starszej wersji
korzystającej z plików należy przywrócić zarchiwizowane starsze artefakty transkrypcji. Zobacz
[Doctor: obniżanie wersji po migracji sesji do SQLite](/pl/cli/doctor#downgrading-after-session-sqlite-migration).
</Warning>

## `update status`

Wyświetla aktywny kanał aktualizacji, tag/gałąź/SHA git (tylko w kopiach roboczych źródeł)
oraz dostępność aktualizacji.

```bash
openclaw update status
openclaw update status --json
openclaw update status --timeout 10
```

| Flaga                  | Domyślnie | Opis                         |
| --------------------- | ------- | ----------------------------------- |
| `--json`              | `false` | Wyświetla nadający się do przetwarzania maszynowego kod JSON ze stanem. |
| `--timeout <seconds>` | `3`     | Limit czasu sprawdzania.                 |

W przypadku instalacji pakietów extended-stable sprawdzanie stanu wykonuje ten sam publiczny wybór
i weryfikację dokładnego pakietu co aktualizacja pierwszoplanowa. Może zgłosić
`ahead of extended-stable`, gdy zainstalowana wersja jest nowsza. Błędy JSON
obejmują `registry.reason` (`selector_missing`, `selector_query_failed`,
`exact_package_mismatch` lub `unsupported_git_channel`).

## `update repair`

Ponownie uruchamia finalizację aktualizacji, gdy pakiet rdzenia został już zmieniony, ale późniejsze
prace naprawcze nie zakończyły się prawidłowo. Jest to obsługiwana ścieżka odzyskiwania, gdy
`openclaw update` zainstalowało nowy pakiet rdzenia, ale synchronizacja pluginów po aktualizacji rdzenia,
metadane zarządzanych pluginów npm, odświeżenie rejestru lub naprawa przez Doctor nie
osiągnęły spójnego stanu.

```bash
openclaw update repair
openclaw update repair --channel beta
openclaw update repair --acknowledge-clawhub-risk
openclaw update repair --json
```

| Flaga                                             | Opis                                                                                                                                                                                                                                                         |
| ------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `--channel <stable\|extended-stable\|beta\|dev>` | Zachowuje kanał aktualizacji rdzenia przed naprawą. W przypadku extended-stable kwalifikujące się oficjalne pluginy npm zgodne z intencją bare/default lub `latest` są kierowane na dokładną zainstalowaną wersję rdzenia. Naprawa extended-stable jest odrzucana w kopiach roboczych Git bez zmiany konfiguracji. |
| `--json`                                         | Wyświetla nadający się do przetwarzania maszynowego kod JSON finalizacji.                                                                                                                                                                                                                           |
| `--timeout <seconds>`                            | Limit czasu kroków naprawy. Domyślnie `1800`.                                                                                                                                                                                                                           |
| `--yes`                                          | Pomija monity o potwierdzenie.                                                                                                                                                                                                                                          |
| `--acknowledge-clawhub-risk`                     | Działa tak samo jak w przypadku `openclaw update`.                                                                                                                                                                                                                              |
| `--no-restart`                                   | Akceptowana dla zachowania zgodności; naprawa nigdy nie uruchamia ponownie Gateway.                                                                                                                                                                                                             |

`update repair` uruchamia `openclaw doctor --fix`, ponownie wczytuje naprawioną konfigurację i
rekordy instalacji, synchronizuje śledzone pluginy dla aktywnego kanału aktualizacji, aktualizuje
zarządzane instalacje pluginów npm, naprawia brakujące dane skonfigurowanych pluginów,
odświeża rejestr pluginów i zapisuje metadane rekordów instalacji w spójnym stanie.
Nie instaluje nowego pakietu rdzenia ani nie uruchamia ponownie Gateway.

## `update wizard`

Interaktywny przepływ umożliwiający wybranie kanału aktualizacji i potwierdzenie, czy następnie
ponownie uruchomić Gateway (domyślnie jest ponownie uruchamiany). Wybranie `dev` bez kopii
roboczej git powoduje wyświetlenie propozycji jej utworzenia.

| Flaga                  | Domyślnie | Opis                   |
| --------------------- | ------- | ----------------------------- |
| `--timeout <seconds>` | `1800`  | Limit czasu dla każdego kroku aktualizacji. |

## Sposób działania

Jawne przełączanie kanałów (`--channel ...`) zapewnia również zgodność
metody instalacji:

- `dev` -> zapewnia kopię roboczą git (domyślnie `~/openclaw` lub
  `$OPENCLAW_HOME/openclaw`, gdy ustawiono `OPENCLAW_HOME`; można zastąpić za pomocą
  `OPENCLAW_GIT_DIR`), aktualizuje ją i instaluje globalny CLI z tej
  kopii roboczej.
- `stable` -> instaluje z npm przy użyciu `latest`.
- `extended-stable` -> rozwiązuje publiczny selektor npm `extended-stable`,
  weryfikuje dokładny wybrany pakiet i instaluje dokładnie tę wersję. Nie
  korzysta z innego selektora jako rozwiązania rezerwowego i jest odrzucany w kopiach roboczych Git.
- `beta` -> preferuje tag dystrybucyjny npm `beta`, a gdy wersja beta
  jest niedostępna lub starsza od bieżącego wydania stabilnego, korzysta z `latest`.

### Przekazanie ponownego uruchomienia

Automatyczny aktualizator rdzenia Gateway (gdy jest włączony w konfiguracji) uruchamia ścieżkę
aktualizacji CLI poza aktywną procedurą obsługi żądań Gateway. Aktualizacje menedżera pakietów
`update.run` w płaszczyźnie sterowania oraz nadzorowane aktualizacje kopii roboczych git używają
tego samego przekazania do zarządzanej usługi zamiast zastępowania drzewa pakietów lub
ponownego kompilowania `dist/` wewnątrz aktywnego procesu Gateway: Gateway uruchamia
odłączony proces pomocniczy i kończy działanie, a ten proces pomocniczy uruchamia `openclaw update --yes --json`
spoza drzewa procesów Gateway. Jeśli przekazanie jest niedostępne,
`update.run` zwraca ustrukturyzowaną odpowiedź z bezpiecznym poleceniem powłoki do ręcznego
uruchomienia.

Zapisane wybory kanału extended-stable otrzymują wskazówki tylko do odczytu podczas uruchamiania i co 24 godziny,
gdy włączono `update.checkOnStart`. Te kontrole nigdy nie stosują aktualizacji,
nie rozpoczynają przekazania, nie uruchamiają ponownie Gateway, nie używają opóźnienia/losowego rozrzutu kanału stable ani
częstotliwości odpytywania kanału beta. Nadal obsługiwane są jawne aktualizacje pierwszoplanowe, aktualizacje pierwszoplanowe bez argumentów z
zapisanym `update.channel: "extended-stable"`, stan na żądanie oraz powiązane z nimi zarządzane
przekazanie Gateway.

Gdy zainstalowano lokalną zarządzaną usługę Gateway i włączono ponowne uruchamianie,
aktualizacje za pomocą menedżera pakietów i aktualizacje kopii roboczej Git zatrzymują działającą usługę przed
zastąpieniem drzewa pakietu lub zmodyfikowaniem kopii roboczej/wyniku kompilacji. Aktualizator
następnie odświeża metadane usługi, uruchamia ją ponownie i weryfikuje
ponownie uruchomiony Gateway przed zgłoszeniem `Gateway: restarted and verified.`.
Aktualizacje za pomocą menedżera pakietów dodatkowo sprawdzają, czy ponownie uruchomiony Gateway zgłasza
oczekiwaną wersję pakietu; aktualizacje kopii roboczej Git sprawdzają po ponownej kompilacji kondycję Gateway i
gotowość usługi.

Aktualizacje za pomocą menedżera pakietów zwykle nadal używają pliku wykonywalnego Node zapisanego w
zarządzanej usłudze. Jeśli ten Node nie może uruchomić docelowego wydania, ale bieżący
Node CLI może to zrobić, a usługa z pewnością należy do aktualizowanego pakietu,
aktualizacja z włączonym ponownym uruchamianiem używa bieżącego Node do finalizacji i przepisuje
metadane usługi na to środowisko uruchomieniowe. `--no-restart` nie może naprawić metadanych
usługi, dlatego taka sama niezgodność środowiska uruchomieniowego powoduje zatrzymanie przed modyfikacją pakietu.

W systemie macOS kontrola po aktualizacji sprawdza również, czy LaunchAgent jest
załadowany/uruchomiony dla aktywnego profilu i czy skonfigurowany port pętli zwrotnej jest
sprawny. Jeśli plik plist jest zainstalowany, ale launchd go nie nadzoruje, OpenClaw
automatycznie ponownie inicjuje LaunchAgent i powtarza kontrole kondycji/wersji/
gotowości kanału (świeża inicjalizacja ładuje zadanie `RunAtLoad` bezpośrednio,
więc odzyskiwanie nie powoduje natychmiastowego `kickstart -k` nowo uruchomionego Gateway). Jeśli
Gateway nadal nie osiągnie prawidłowego stanu, polecenie kończy się kodem różnym od zera i
wyświetla ścieżkę dziennika ponownego uruchamiania oraz instrukcje ponownego uruchomienia, ponownej instalacji i wycofania
pakietu.

Jeśli nie można wykonać ponownego uruchomienia, polecenie wyświetla `Gateway: restart skipped (...)` lub
`Gateway: restart failed: ...` ze wskazówką dotyczącą ręcznego `openclaw gateway restart`.
Przy `--no-restart` zastąpienie pakietu lub ponowna kompilacja Git nadal jest wykonywana, ale
zarządzana usługa nie jest zatrzymywana ani ponownie uruchamiana, więc działający Gateway zachowuje stary
kod do czasu ręcznego ponownego uruchomienia.

### Struktura odpowiedzi płaszczyzny sterowania

Gdy `update.run` działa przez płaszczyznę sterowania Gateway w instalacji za pomocą menedżera pakietów
lub nadzorowanej kopii roboczej Git, procedura obsługi zgłasza rozpoczęcie przekazania
oddzielnie od aktualizacji CLI kontynuowanej po zakończeniu działania Gateway:

- `ok: true`, `result.status: "skipped"`,
  `result.reason: "managed-service-handoff-started"` oraz
  `handoff.status: "started"`: Gateway utworzył przekazanie zarządzanej usługi
  i zaplanował własne ponowne uruchomienie, aby odłączony proces pomocniczy mógł uruchomić
  `openclaw update --yes --json` poza aktywnym procesem usługi.
- `ok: false`, `result.reason: "managed-service-handoff-unavailable"` oraz
  `handoff.status: "unavailable"`: OpenClaw nie mógł znaleźć granicy nadzorowanej
  usługi i trwałej tożsamości usługi potrzebnych do bezpiecznego przekazania (na
  przykład przekazanie systemd wymaga tożsamości jednostki `OPENCLAW_SYSTEMD_UNIT`,
  a nie tylko kontekstowych znaczników procesu systemd). Odpowiedź zawiera
  `handoff.command`, czyli polecenie powłoki do uruchomienia spoza Gateway.
- `ok: false`, `result.reason: "managed-service-handoff-failed"`: Gateway
  próbował utworzyć przekazanie, ale nie mógł uruchomić odłączonego procesu pomocniczego.

Ładunek `sentinel` jest zapisywany przed zakończeniem działania Gateway, a przekazanie
CLI aktualizuje ten sam znacznik ponownego uruchomienia po zakończeniu kontroli kondycji
zarządzanej usługi po ponownym uruchomieniu. Podczas przekazania znacznik może zawierać
`stats.reason: "restart-health-pending"` bez kontynuacji powodzenia;
ponownie uruchomiony Gateway odpytuje go i uruchamia kontynuację dopiero po zweryfikowaniu przez CLI
kondycji usługi oraz ponownym zapisaniu znacznika z końcowym wynikiem `ok`.
`openclaw status` i `openclaw status --all` pokazują wiersz `Update restart`,
gdy ten znacznik oczekuje lub wskazuje niepowodzenie, a `update.status` odświeża i
zwraca najnowszy znacznik.

## Przepływ kopii roboczej Git

### Wybór kanału

- `stable`: przełącza kopię roboczą na najnowszy znacznik inny niż beta, a następnie wykonuje kompilację i doctor.
- `beta`: preferuje najnowszy znacznik `-beta`, przechodząc na najnowszy znacznik stable,
  gdy kanał beta jest niedostępny lub starszy.
- `dev`: przełącza kopię roboczą na `main`, a następnie pobiera zmiany i wykonuje rebase.
- `extended-stable`: nieobsługiwane w przypadku kopii roboczych Git; kopia robocza
  nie jest modyfikowana.

### Kroki aktualizacji

<Steps>
  <Step title="Sprawdzenie czystości drzewa roboczego">
    Wymaga braku niezacommitowanych zmian.
  </Step>
  <Step title="Zmiana kanału">
    Przełącza na wybrany kanał (znacznik lub gałąź).
  </Step>
  <Step title="Pobranie zmian z repozytorium nadrzędnego">
    Tylko kanał dev.
  </Step>
  <Step title="Wstępna kompilacja (tylko kanał dev)">
    Uruchamia kompilację TypeScript w tymczasowym drzewie roboczym. Jeśli najnowszy commit nie przejdzie kompilacji, cofa się o maksymalnie 10 commitów, aby znaleźć najnowszy commit możliwy do skompilowania. Ustaw `OPENCLAW_UPDATE_PREFLIGHT_LINT=1`, aby podczas tej kontroli wstępnej uruchomić również lint; lint działa w ograniczonym trybie szeregowym, ponieważ hosty aktualizacji użytkowników często mają mniej zasobów niż maszyny wykonawcze CI.
  </Step>
  <Step title="Rebase">
    Wykonuje rebase na wybrany commit (tylko kanał dev).
  </Step>
  <Step title="Instalacja zależności">
    Używa menedżera pakietów repozytorium. W przypadku kopii roboczych pnpm aktualizator inicjuje `pnpm` na żądanie (najpierw przez `corepack`, a następnie przez tymczasowy mechanizm awaryjny `npm install pnpm@11`), zamiast uruchamiać `npm run build` wewnątrz przestrzeni roboczej pnpm. Jeśli inicjalizacja pnpm nadal się nie powiedzie, aktualizator zatrzymuje się wcześniej z błędem właściwym dla menedżera pakietów, zamiast próbować użyć `npm run build` w kopii roboczej.
  </Step>
  <Step title="Kompilacja interfejsu sterowania">
    Kompiluje Gateway i interfejs sterowania.
  </Step>
  <Step title="Uruchomienie doctor">
    `openclaw doctor` działa jako końcowa kontrola bezpiecznej aktualizacji.
  </Step>
  <Step title="Synchronizacja pluginów">
    Synchronizuje pluginy z aktywnym kanałem. Kanał dev używa dołączonych pluginów; kanały stable i beta używają npm. Aktualizuje śledzone instalacje pluginów.
  </Step>
</Steps>

### Szczegóły synchronizacji pluginów

Na kanale beta śledzone instalacje pluginów npm i ClawHub, które korzystają z
domyślnej/najnowszej linii, najpierw próbują użyć wydania pluginu `@beta`. Jeśli plugin nie ma
wydania beta, OpenClaw wraca do zapisanej specyfikacji domyślnej/najnowszej i
zgłasza ostrzeżenie. W przypadku pluginów npm OpenClaw używa mechanizmu awaryjnego również wtedy, gdy pakiet
beta istnieje, ale nie przechodzi walidacji instalacji. Te ostrzeżenia mechanizmu awaryjnego nie
powodują niepowodzenia aktualizacji rdzenia. Dokładne wersje i jawne znaczniki nigdy nie są przepisywane.

<Warning>
Jeśli aktualizacja pluginu npm przypiętego do dokładnej wersji zostanie rozwiązana do artefaktu, którego integralność różni się od zapisanego rekordu instalacji, `openclaw update` przerywa aktualizację tego artefaktu pluginu zamiast go instalować. Ponownie zainstaluj lub zaktualizuj plugin jawnie dopiero po sprawdzeniu, że nowy artefakt jest zaufany.
</Warning>

<Note>
Niepowodzenia synchronizacji pluginów po aktualizacji, które ograniczają się do zarządzanego pluginu i które ścieżka synchronizacji może ominąć (na przykład niedostępny rejestr npm dla nieistotnego pluginu), są zgłaszane jako ostrzeżenia po pomyślnym zakończeniu aktualizacji rdzenia. Wynik JSON zachowuje `status: "ok"` aktualizacji najwyższego poziomu i zgłasza `postUpdate.plugins.status: "warning"` ze wskazówkami `openclaw update repair` i `openclaw plugins inspect <id> --runtime --json`. Nieoczekiwane wyjątki aktualizatora lub synchronizacji nadal powodują niepowodzenie wyniku aktualizacji. Napraw błąd instalacji lub aktualizacji pluginu, a następnie ponownie uruchom `openclaw update repair`. Gdy nieudana aktualizacja pozostawi zarządzany plugin w stanie niezdatnym do użycia, OpenClaw wyłącza jego wpis środowiska uruchomieniowego i resetuje aktywne sloty bez zmiany zasad `plugins.allow` ani `plugins.deny` utworzonych przez operatora.

Po kroku synchronizacji poszczególnych pluginów `openclaw update` uruchamia obowiązkowy przebieg **konwergencji po aktualizacji rdzenia** przed ponownym uruchomieniem Gateway: naprawia brakujące ładunki skonfigurowanych pluginów, sprawdza na dysku każdy _aktywny_ śledzony rekord instalacji i statycznie weryfikuje, czy jego `package.json` można przeanalizować (oraz czy istnieje każdy jawnie zadeklarowany `main`). Niepowodzenia tego przebiegu oraz nieprawidłowa migawka konfiguracji zwracają `postUpdate.plugins.status: "error"` i zmieniają `status` aktualizacji najwyższego poziomu na `"error"`, przez co `openclaw update` kończy się kodem różnym od zera, a Gateway _nie_ jest uruchamiany ponownie z niezweryfikowanym zestawem pluginów. Błąd zawiera ustrukturyzowane wiersze `postUpdate.plugins.warnings[].guidance` wskazujące `openclaw update repair` i `openclaw plugins inspect <id> --runtime --json`. Wyłączone wpisy pluginów oraz rekordy, które nie są powiązanymi z zaufanym źródłem oficjalnymi celami synchronizacji, są tutaj pomijane (zgodnie z zasadą `skipDisabledPlugins` używaną podczas sprawdzania brakujących ładunków), więc nieaktualny rekord wyłączonego pluginu nie może zablokować prawidłowej poza tym aktualizacji.

Po uruchomieniu zaktualizowanego Gateway ładowanie pluginów służy wyłącznie do weryfikacji: uruchamianie nie wywołuje menedżerów pakietów ani nie modyfikuje drzew zależności. Ponowne uruchomienia `update.run` menedżera pakietów są przekazywane do ścieżki zarządzanej usługi CLI, dzięki czemu zamiana pakietu odbywa się poza starym procesem Gateway, a kontrole kondycji usługi decydują, czy aktualizację można zgłosić jako zakończoną.
</Note>

Po pomyślnym zakończeniu aktualizacji rdzenia extended-stable sprawdzanie integralności i
konwergencja pluginów po aktualizacji rdzenia obejmują kwalifikujące się oficjalne pluginy npm w dokładnie tej samej wersji co zainstalowany
rdzeń. W przypadku intencji domyślnej/`latest` OpenClaw nie odpytuje
`@extended-stable` pluginu ani nie wraca do `latest` npm; wyznacza wersję pakietu
na podstawie zainstalowanego rdzenia. Jawne przypięcia wersji, jawne znaczniki inne niż `latest`,
pakiety innych firm oraz źródła inne niż npm zachowują dotychczasową intencję.

W przypadku instalacji za pomocą menedżera pakietów `openclaw update` rozwiązuje docelową wersję
pakietu przed wywołaniem menedżera pakietów. Globalne instalacje npm korzystają z instalacji etapowej:
OpenClaw instaluje nowy pakiet w tymczasowym prefiksie npm,
pozwala pakietowi kandydującemu zweryfikować wersję Node hosta podczas `preinstall`
i sprawdza tam spis pakietu `dist`. Spakowane zabezpieczenie ukończenia
pozostaje poza tym spisem do czasu pomyślnego zakończenia `preinstall`, dzięki czemu menedżery pakietów,
które pomijają skrypty cyklu życia, również zatrzymują się przed aktywacją. W npm 12 i nowszych
aktualizator zatwierdza wyłącznie cykl życia kandydującego pakietu OpenClaw; skrypty
zależności przechodnich pozostają zablokowane. Następnie OpenClaw zamienia czyste drzewo pakietu
w rzeczywistym globalnym prefiksie. Jeśli weryfikacja się nie powiedzie, doctor po aktualizacji, synchronizacja
pluginów i ponowne uruchomienie nie są wykonywane z podejrzanego drzewa. Nawet gdy
zainstalowana wersja już odpowiada docelowej, polecenie odświeża
globalną instalację pakietu, a następnie uruchamia synchronizację pluginów, odświeżenie uzupełnień
poleceń rdzenia i ponowne uruchomienie. Dzięki temu spakowane procesy pomocnicze i należące do kanału
rekordy pluginów pozostają zgodne z zainstalowaną kompilacją OpenClaw, natomiast pełne
przebudowywanie uzupełnień poleceń pluginów pozostaje zadaniem jawnych
uruchomień `openclaw completion --write-state`.

## Powiązane

- `openclaw doctor` (oferuje najpierw uruchomienie aktualizacji w kopiach roboczych Git)
- [Kanały deweloperskie](/pl/install/development-channels)
- [Aktualizowanie](/pl/install/updating)
- [Dokumentacja CLI](/pl/cli)
