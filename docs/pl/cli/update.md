---
read_when:
    - Chcesz bezpiecznie zaktualizować kopię roboczą źródeł
    - Debugujesz wyjście lub opcje `openclaw update`
    - Musisz zrozumieć zachowanie skrótu `--update`
summary: Dokumentacja referencyjna CLI dla `openclaw update` (względnie bezpieczna aktualizacja źródła + automatyczne ponowne uruchomienie Gateway)
title: Aktualizuj
x-i18n:
    generated_at: "2026-05-03T21:29:37Z"
    model: gpt-5.5
    provider: openai
    source_hash: 53ec06b8db5e2aba4000922f92a36834e8782986a77f6b5889bb19031a59f1b8
    source_path: cli/update.md
    workflow: 16
---

# `openclaw update`

Bezpiecznie aktualizuj OpenClaw i przełączaj się między kanałami stable/beta/dev.

Jeśli instalacja została wykonana przez **npm/pnpm/bun** (instalacja globalna, bez metadanych git),
aktualizacje odbywają się przez przepływ menedżera pakietów opisany w [Aktualizowaniu](/pl/install/updating).

## Użycie

```bash
openclaw update
openclaw update status
openclaw update wizard
openclaw update --channel beta
openclaw update --channel dev
openclaw update --tag beta
openclaw update --tag main
openclaw update --dry-run
openclaw update --no-restart
openclaw update --yes
openclaw update --json
openclaw --update
```

## Opcje

- `--no-restart`: pomiń ponowne uruchomienie usługi Gateway po udanej aktualizacji. Aktualizacje menedżera pakietów, które ponownie uruchamiają Gateway, przed powodzeniem polecenia sprawdzają, czy ponownie uruchomiona usługa zgłasza oczekiwaną zaktualizowaną wersję.
- `--channel <stable|beta|dev>`: ustaw kanał aktualizacji (git + npm; zapisywany w konfiguracji).
- `--tag <dist-tag|version|spec>`: nadpisz docelowy pakiet tylko dla tej aktualizacji. W przypadku instalacji pakietowych `main` mapuje się na `github:openclaw/openclaw#main`.
- `--dry-run`: podejrzyj planowane działania aktualizacji (przepływ kanału/tagu/celu/ponownego uruchomienia) bez zapisywania konfiguracji, instalowania, synchronizowania pluginów ani ponownego uruchamiania.
- `--json`: wypisz możliwy do odczytu maszynowego JSON `UpdateRunResult`, w tym
  `postUpdate.plugins.integrityDrifts`, gdy podczas synchronizacji pluginów po
  aktualizacji zostanie wykryta rozbieżność artefaktu pluginu npm.
- `--timeout <seconds>`: limit czasu na każdy krok (domyślnie 1800 s).
- `--yes`: pomiń pytania o potwierdzenie (na przykład potwierdzenie downgrade’u).

`openclaw update` nie ma flagi `--verbose`. Użyj `--dry-run`, aby podejrzeć
planowane działania kanału/tagu/instalacji/ponownego uruchomienia, `--json` dla
wyników możliwych do odczytu maszynowego oraz `openclaw update status --json`,
gdy potrzebujesz tylko szczegółów kanału i dostępności. Jeśli debugujesz logi
Gateway dotyczące aktualizacji, szczegółowość konsoli i poziom logowania do pliku
są osobne: Gateway `--verbose` wpływa na wyjście terminala/WebSocket, natomiast
logi plikowe wymagają `logging.level: "debug"` lub `"trace"` w konfiguracji.
Zobacz [logowanie Gateway](/pl/gateway/logging).

<Warning>
Downgrade’y wymagają potwierdzenia, ponieważ starsze wersje mogą uszkodzić konfigurację.
</Warning>

## `update status`

Pokaż aktywny kanał aktualizacji + tag/gałąź/SHA git (dla checkoutów źródłowych) oraz dostępność aktualizacji.

```bash
openclaw update status
openclaw update status --json
openclaw update status --timeout 10
```

Opcje:

- `--json`: wypisz możliwy do odczytu maszynowego JSON statusu.
- `--timeout <seconds>`: limit czasu dla sprawdzeń (domyślnie 3 s).

## `update wizard`

Interaktywny przepływ wyboru kanału aktualizacji i potwierdzenia, czy ponownie uruchomić Gateway
po aktualizacji (domyślnie ponowne uruchomienie). Jeśli wybierzesz `dev` bez checkoutu git,
zaproponuje jego utworzenie.

Opcje:

- `--timeout <seconds>`: limit czasu dla każdego kroku aktualizacji (domyślnie `1800`)

## Co robi

Gdy przełączysz kanały jawnie (`--channel ...`), OpenClaw utrzymuje także
zgodność metody instalacji:

- `dev` → zapewnia checkout git (domyślnie: `~/openclaw`, można nadpisać przez `OPENCLAW_GIT_DIR`),
  aktualizuje go i instaluje globalne CLI z tego checkoutu.
- `stable` → instaluje z npm przy użyciu `latest`.
- `beta` → preferuje dist-tag npm `beta`, ale wraca do `latest`, gdy beta jest
  brakująca lub starsza niż obecne wydanie stable.

Automatyczny aktualizator rdzenia Gateway (gdy jest włączony w konfiguracji) uruchamia ścieżkę aktualizacji CLI
poza aktywną obsługą żądania Gateway. Aktualizacje menedżera pakietów `update.run`
w płaszczyźnie sterowania wymuszają nieodroczony restart aktualizacji bez cooldownu po podmianie pakietu,
ponieważ stary proces Gateway może nadal mieć w pamięci fragmenty wskazujące na
pliki usunięte przez nowy pakiet.

W przypadku instalacji menedżera pakietów `openclaw update` rozwiązuje docelową
wersję pakietu przed wywołaniem menedżera pakietów. Globalne instalacje npm używają instalacji etapowej:
OpenClaw instaluje nowy pakiet w tymczasowym prefiksie npm, sprawdza tam
spakowany inwentarz `dist`, a następnie podmienia to czyste drzewo pakietu w
rzeczywistym globalnym prefiksie. Jeśli weryfikacja się nie powiedzie, doctor po aktualizacji,
synchronizacja pluginów i restart nie są uruchamiane z podejrzanego drzewa. Nawet gdy zainstalowana wersja
już pasuje do celu, polecenie odświeża globalną instalację pakietu,
a następnie uruchamia synchronizację pluginów, odświeżenie uzupełniania poleceń rdzenia i prace restartu. To
utrzymuje spakowane procesy pomocnicze i rekordy pluginów należące do kanału w zgodzie z
zainstalowaną kompilacją OpenClaw, pozostawiając pełne przebudowy uzupełniania poleceń pluginów
jawnym uruchomieniom `openclaw completion --write-state`.

Gdy lokalna zarządzana usługa Gateway jest zainstalowana, a restart włączony,
aktualizacje menedżera pakietów zatrzymują działającą usługę przed zastąpieniem drzewa pakietu,
następnie odświeżają metadane usługi ze zaktualizowanej instalacji, ponownie uruchamiają
usługę i sprawdzają, czy ponownie uruchomiony Gateway zgłasza oczekiwaną wersję przed
zgłoszeniem powodzenia. W systemie macOS sprawdzenie po aktualizacji weryfikuje także, czy LaunchAgent
jest załadowany/działa dla aktywnego profilu i czy skonfigurowany port loopback jest
sprawny. Jeśli plist jest zainstalowany, ale launchd go nie nadzoruje, OpenClaw
automatycznie ponownie bootstrapuje LaunchAgent, a następnie ponownie uruchamia
sprawdzenia gotowości zdrowia/wersji/kanału. Świeży bootstrap ładuje zadanie RunAtLoad
bezpośrednio, więc odzyskiwanie aktualizacji nie wykonuje od razu `kickstart -k` na nowo
uruchomionym Gateway. Jeśli Gateway nadal nie staje się sprawny, polecenie kończy się
niezerowym kodem i wypisuje ścieżkę logu restartu oraz jawne instrukcje restartu, ponownej instalacji i
cofnięcia pakietu. Przy `--no-restart`
zastąpienie pakietu nadal jest wykonywane, ale zarządzana usługa nie jest zatrzymywana ani
ponownie uruchamiana, więc działający Gateway może zachować stary kod do czasu ręcznego
restartu.

## Przepływ checkoutu git

### Wybór kanału

- `stable`: checkout najnowszego tagu bez beta, a następnie kompilacja i doctor.
- `beta`: preferuj najnowszy tag `-beta`, ale wróć do najnowszego tagu stable, gdy beta jest brakująca lub starsza.
- `dev`: checkout `main`, a następnie fetch i rebase.

### Kroki aktualizacji

<Steps>
  <Step title="Zweryfikuj czyste drzewo robocze">
    Wymaga braku niezatwierdzonych zmian.
  </Step>
  <Step title="Przełącz kanał">
    Przełącza na wybrany kanał (tag lub gałąź).
  </Step>
  <Step title="Pobierz upstream">
    Tylko dev.
  </Step>
  <Step title="Kompilacja preflight (tylko dev)">
    Uruchamia lint i kompilację TypeScript w tymczasowym drzewie roboczym. Jeśli tip się nie powiedzie, cofa się maksymalnie o 10 commitów, aby znaleźć najnowszą czystą kompilację.
  </Step>
  <Step title="Rebase">
    Wykonuje rebase na wybrany commit (tylko dev).
  </Step>
  <Step title="Zainstaluj zależności">
    Używa menedżera pakietów repozytorium. W przypadku checkoutów pnpm aktualizator bootstrapuje `pnpm` na żądanie (najpierw przez `corepack`, a potem przez tymczasowy fallback `npm install pnpm@10`) zamiast uruchamiać `npm run build` w obszarze roboczym pnpm.
  </Step>
  <Step title="Zbuduj Control UI">
    Buduje Gateway i Control UI.
  </Step>
  <Step title="Uruchom doctor">
    `openclaw doctor` działa jako końcowe sprawdzenie bezpiecznej aktualizacji.
  </Step>
  <Step title="Synchronizuj pluginy">
    Synchronizuje pluginy z aktywnym kanałem. Dev używa dołączonych pluginów; stable i beta używają npm. Aktualizuje śledzone instalacje pluginów.
  </Step>
</Steps>

Na kanale aktualizacji beta śledzone instalacje pluginów npm i ClawHub, które podążają
domyślną/najnowszą linią, najpierw próbują wydania pluginu `@beta`. Jeśli plugin nie ma
wydania beta, OpenClaw wraca do zapisanej specyfikacji default/latest. Dokładne
wersje i jawne tagi nie są przepisywane.

<Warning>
Jeśli aktualizacja dokładnie przypiętego pluginu npm rozwiązuje się do artefaktu, którego integralność różni się od zapisanego rekordu instalacji, `openclaw update` przerywa tę aktualizację artefaktu pluginu zamiast go instalować. Ponownie zainstaluj lub zaktualizuj plugin jawnie dopiero po sprawdzeniu, że ufasz nowemu artefaktowi.
</Warning>

<Note>
Niepowodzenia synchronizacji pluginów po aktualizacji powodują niepowodzenie wyniku aktualizacji i zatrzymują dalsze prace restartu. Napraw błąd instalacji lub aktualizacji pluginu, a następnie uruchom ponownie `openclaw update`.

Gdy zaktualizowany Gateway startuje, ładowanie pluginów jest tylko weryfikacyjne: start nie uruchamia menedżerów pakietów ani nie mutuje drzew zależności. Restarty `update.run` menedżera pakietów omijają normalne odroczenie bezczynności i cooldown restartu po podmianie drzewa pakietu, więc stary proces nie może dalej leniwie ładować usuniętych fragmentów.

Jeśli bootstrap pnpm nadal się nie powiedzie, aktualizator zatrzymuje się wcześnie z błędem specyficznym dla menedżera pakietów zamiast próbować `npm run build` wewnątrz checkoutu.
</Note>

## Skrót `--update`

`openclaw --update` przepisuje się na `openclaw update` (przydatne dla powłok i skryptów uruchamiających).

## Powiązane

- `openclaw doctor` (proponuje najpierw uruchomienie aktualizacji w checkoutach git)
- [Kanały deweloperskie](/pl/install/development-channels)
- [Aktualizowanie](/pl/install/updating)
- [Dokumentacja CLI](/pl/cli)
