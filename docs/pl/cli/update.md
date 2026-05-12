---
read_when:
    - Chcesz bezpiecznie zaktualizować kopię roboczą źródeł
    - Debugujesz dane wyjściowe lub opcje `openclaw update`
    - Musisz zrozumieć działanie skrótu `--update`
summary: Referencja CLI dla `openclaw update` (względnie bezpieczna aktualizacja źródła + automatyczny restart Gateway)
title: Aktualizacja
x-i18n:
    generated_at: "2026-05-12T08:45:52Z"
    model: gpt-5.5
    provider: openai
    source_hash: 93244af800aaa53c55a52f9593a7727910aa91acac9d1e34e89c39a95b133461
    source_path: cli/update.md
    workflow: 16
---

# `openclaw update`

Bezpiecznie aktualizuj OpenClaw i przełączaj się między kanałami stable/beta/dev.

Jeśli instalacja została wykonana przez **npm/pnpm/bun** (instalacja globalna, bez metadanych git),
aktualizacje odbywają się przez przepływ menedżera pakietów opisany w [Aktualizowanie](/pl/install/updating).

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

- `--no-restart`: pomija ponowne uruchomienie usługi Gateway po udanej aktualizacji. Aktualizacje przez menedżer pakietów, które ponownie uruchamiają Gateway, weryfikują, czy ponownie uruchomiona usługa zgłasza oczekiwaną zaktualizowaną wersję, zanim polecenie zakończy się powodzeniem.
- `--channel <stable|beta|dev>`: ustawia kanał aktualizacji (git + npm; zapisywany w konfiguracji).
- `--tag <dist-tag|version|spec>`: nadpisuje docelowy pakiet tylko dla tej aktualizacji. Dla instalacji pakietowych `main` mapuje się na `github:openclaw/openclaw#main`.
- `--dry-run`: pokazuje planowane działania aktualizacji (kanał/tag/cel/przepływ ponownego uruchomienia) bez zapisywania konfiguracji, instalowania, synchronizowania wtyczek ani ponownego uruchamiania.
- `--json`: wypisuje czytelny maszynowo JSON `UpdateRunResult`, w tym
  `postUpdate.plugins.warnings`, gdy uszkodzone lub niemożliwe do załadowania zarządzane wtyczki wymagają
  naprawy po udanej aktualizacji rdzenia, szczegóły awaryjnego użycia wersji wtyczki dla kanału beta,
  gdy wtyczka nie ma wydania beta, oraz `postUpdate.plugins.integrityDrifts`,
  gdy podczas synchronizacji wtyczek po aktualizacji wykryto rozbieżność artefaktu wtyczki npm.
- `--timeout <seconds>`: limit czasu na krok (domyślnie 1800 s).
- `--yes`: pomija monity o potwierdzenie (na przykład potwierdzenie obniżenia wersji).

`openclaw update` nie ma flagi `--verbose`. Użyj `--dry-run`, aby podejrzeć
planowane działania kanału/tagu/instalacji/ponownego uruchomienia, `--json` dla czytelnych maszynowo
wyników oraz `openclaw update status --json`, gdy potrzebujesz tylko szczegółów kanału i
dostępności. Jeśli debugujesz logi Gateway podczas aktualizacji,
szczegółowość konsoli i poziom logowania do pliku są oddzielne: `--verbose` dla Gateway wpływa na
wyjście terminala/WebSocket, natomiast logi plikowe wymagają `logging.level: "debug"` lub
`"trace"` w konfiguracji. Zobacz [Logowanie Gateway](/pl/gateway/logging).

<Note>
W trybie Nix (`OPENCLAW_NIX_MODE=1`) modyfikujące uruchomienia `openclaw update` są wyłączone. Zamiast tego zaktualizuj źródło Nix lub wejście flake dla tej instalacji; w przypadku nix-openclaw użyj agent-first [Szybki start](https://github.com/openclaw/nix-openclaw#quick-start). `openclaw update status` i `openclaw update --dry-run` pozostają tylko do odczytu.
</Note>

<Warning>
Obniżenia wersji wymagają potwierdzenia, ponieważ starsze wersje mogą uszkodzić konfigurację.
</Warning>

## `update status`

Pokazuje aktywny kanał aktualizacji + tag/gałąź/SHA git (dla checkoutów źródłowych) oraz dostępność aktualizacji.

```bash
openclaw update status
openclaw update status --json
openclaw update status --timeout 10
```

Opcje:

- `--json`: wypisuje czytelny maszynowo JSON statusu.
- `--timeout <seconds>`: limit czasu dla sprawdzeń (domyślnie 3 s).

## `update wizard`

Interaktywny przepływ wyboru kanału aktualizacji i potwierdzenia, czy ponownie uruchomić Gateway
po aktualizacji (domyślnie ponowne uruchomienie). Jeśli wybierzesz `dev` bez checkoutu git,
zaproponuje jego utworzenie.

Opcje:

- `--timeout <seconds>`: limit czasu dla każdego kroku aktualizacji (domyślnie `1800`)

## Co robi

Gdy przełączasz kanały jawnie (`--channel ...`), OpenClaw utrzymuje także
zgodność metody instalacji:

- `dev` → zapewnia checkout git (domyślnie: `~/openclaw`, nadpisanie przez `OPENCLAW_GIT_DIR`),
  aktualizuje go i instaluje globalny CLI z tego checkoutu.
- `stable` → instaluje z npm przy użyciu `latest`.
- `beta` → preferuje dist-tag npm `beta`, ale wraca do `latest`, gdy beta jest
  brakująca lub starsza niż bieżące wydanie stable.

Automatyczny aktualizator rdzenia Gateway (gdy jest włączony przez konfigurację) uruchamia ścieżkę aktualizacji CLI
poza aktywną obsługą żądania Gateway. Aktualizacje menedżera pakietów przez płaszczyznę sterowania `update.run`
wymuszają nieodroczone ponowne uruchomienie aktualizacyjne bez cooldownu po podmianie pakietu,
ponieważ stary proces Gateway nadal może mieć w pamięci fragmenty wskazujące na
pliki usunięte przez nowy pakiet.

W przypadku instalacji przez menedżer pakietów `openclaw update` rozwiązuje docelową wersję pakietu
przed wywołaniem menedżera pakietów. Globalne instalacje npm używają instalacji etapowej:
OpenClaw instaluje nowy pakiet w tymczasowym prefiksie npm, weryfikuje
spis zapakowanego `dist`, a następnie podmienia to czyste drzewo pakietu na
rzeczywisty prefiks globalny. Jeśli weryfikacja się nie powiedzie, doctor po aktualizacji, synchronizacja wtyczek i
ponowne uruchomienie nie są wykonywane z podejrzanego drzewa. Nawet gdy zainstalowana wersja
już odpowiada celowi, polecenie odświeża globalną instalację pakietu,
a następnie uruchamia synchronizację wtyczek, odświeżenie uzupełnień poleceń rdzenia i ponowne uruchomienie. Dzięki temu
spakowane sidecary i rekordy wtyczek należące do kanału pozostają zgodne z
zainstalowaną kompilacją OpenClaw, a pełne przebudowy uzupełnień poleceń wtyczek pozostają
dla jawnych uruchomień `openclaw completion --write-state`.

Gdy zainstalowana jest lokalna zarządzana usługa Gateway i włączono ponowne uruchomienie,
aktualizacje menedżera pakietów zatrzymują działającą usługę przed zastąpieniem drzewa pakietu,
następnie odświeżają metadane usługi ze zaktualizowanej instalacji, ponownie uruchamiają
usługę i weryfikują, czy ponownie uruchomiony Gateway zgłasza oczekiwaną wersję przed
zgłoszeniem powodzenia. W systemie macOS sprawdzenie po aktualizacji weryfikuje także, czy LaunchAgent
jest załadowany/uruchomiony dla aktywnego profilu oraz czy skonfigurowany port loopback
jest zdrowy. Jeśli plist jest zainstalowany, ale launchd go nie nadzoruje, OpenClaw
automatycznie ponownie bootstrapuje LaunchAgent, a następnie ponownie uruchamia
sprawdzenia gotowości zdrowia/wersji/kanału. Świeży bootstrap ładuje zadanie RunAtLoad
bezpośrednio, więc odzyskiwanie aktualizacji nie wykonuje natychmiast `kickstart -k` na nowo
uruchomionym Gateway. Jeśli Gateway nadal nie stanie się zdrowy, polecenie kończy się
kodem różnym od zera i wypisuje ścieżkę logu ponownego uruchomienia oraz jawne instrukcje ponownego uruchomienia, ponownej instalacji i
wycofania pakietu. Z `--no-restart`
zastąpienie pakietu nadal jest wykonywane, ale zarządzana usługa nie jest zatrzymywana ani
ponownie uruchamiana, więc działający Gateway może zachować stary kod, dopóki nie uruchomisz go ponownie
ręcznie.

## Przepływ checkoutu git

### Wybór kanału

- `stable`: wykonuje checkout najnowszego tagu nie-beta, a następnie build i doctor.
- `beta`: preferuje najnowszy tag `-beta`, ale wraca do najnowszego tagu stable, gdy beta jest brakująca lub starsza.
- `dev`: wykonuje checkout `main`, a następnie fetch i rebase.

### Kroki aktualizacji

<Steps>
  <Step title="Weryfikacja czystego worktree">
    Wymaga braku niezatwierdzonych zmian.
  </Step>
  <Step title="Przełączenie kanału">
    Przełącza na wybrany kanał (tag lub gałąź).
  </Step>
  <Step title="Fetch upstream">
    Tylko dev.
  </Step>
  <Step title="Build preflight (tylko dev)">
    Uruchamia build TypeScript w tymczasowym worktree. Jeśli tip się nie powiedzie, cofa się maksymalnie o 10 commitów, aby znaleźć najnowszy commit możliwy do zbudowania. Ustaw `OPENCLAW_UPDATE_PREFLIGHT_LINT=1`, aby podczas tego preflight uruchomić także lint; lint działa w ograniczonym trybie szeregowym, ponieważ hosty aktualizacji użytkowników są często mniejsze niż runnerzy CI.
  </Step>
  <Step title="Rebase">
    Wykonuje rebase na wybrany commit (tylko dev).
  </Step>
  <Step title="Instalacja zależności">
    Używa menedżera pakietów repozytorium. Dla checkoutów pnpm aktualizator bootstrapuje `pnpm` na żądanie (najpierw przez `corepack`, potem awaryjnie przez tymczasowe `npm install pnpm@11`) zamiast uruchamiać `npm run build` wewnątrz workspace pnpm.
  </Step>
  <Step title="Build Control UI">
    Buduje gateway i Control UI.
  </Step>
  <Step title="Uruchomienie doctor">
    `openclaw doctor` działa jako końcowe sprawdzenie bezpiecznej aktualizacji.
  </Step>
  <Step title="Synchronizacja wtyczek">
    Synchronizuje wtyczki do aktywnego kanału. Dev używa wtyczek wbudowanych; stable i beta używają npm. Aktualizuje śledzone instalacje wtyczek.
  </Step>
</Steps>

Na kanale aktualizacji beta śledzone instalacje wtyczek npm i ClawHub, które podążają za
domyślną/najnowszą linią, najpierw próbują wydania wtyczki `@beta`. Jeśli wtyczka nie ma
wydania beta, OpenClaw wraca do zapisanej domyślnej/najnowszej specyfikacji i zgłasza
to jako ostrzeżenie. Dla wtyczek npm OpenClaw wraca także wtedy, gdy pakiet beta
istnieje, ale nie przejdzie walidacji instalacji. Te ostrzeżenia o awaryjnym wyborze wtyczek nie
powodują niepowodzenia aktualizacji rdzenia. Dokładne wersje i jawne tagi nie są
przepisywane.

<Warning>
Jeśli aktualizacja dokładnie przypiętej wtyczki npm rozwiąże się do artefaktu, którego integralność różni się od zapisanego rekordu instalacji, `openclaw update` przerywa tę aktualizację artefaktu wtyczki zamiast ją instalować. Zainstaluj ponownie lub zaktualizuj wtyczkę jawnie dopiero po zweryfikowaniu, że ufasz nowemu artefaktowi.
</Warning>

<Note>
Niepowodzenia synchronizacji wtyczek po aktualizacji, które są ograniczone do zarządzanej wtyczki i które ścieżka synchronizacji może obejść (np. niedostępny rejestr npm dla nieistotnej wtyczki), są zgłaszane jako ostrzeżenia po udanej aktualizacji rdzenia. Wynik JSON zachowuje najwyższy poziom aktualizacji `status: "ok"` i zgłasza `postUpdate.plugins.status: "warning"` ze wskazówkami `openclaw doctor --fix` oraz `openclaw plugins inspect <id> --runtime --json`. Nieoczekiwane wyjątki aktualizatora lub synchronizacji nadal powodują niepowodzenie wyniku aktualizacji. Napraw instalację wtyczki lub błąd aktualizacji, a następnie uruchom ponownie `openclaw doctor --fix` albo `openclaw update`.

Po kroku synchronizacji per wtyczka `openclaw update` uruchamia obowiązkowy przebieg **konwergencji po rdzeniu** przed ponownym uruchomieniem gateway: naprawia brakujące skonfigurowane payloady wtyczek, waliduje każdy _aktywny_ śledzony rekord instalacji na dysku i statycznie weryfikuje, czy jego `package.json` jest parsowalny (oraz czy istnieje jawnie zadeklarowany `main`, jeśli podano). Niepowodzenia z tego przebiegu — oraz nieprawidłowy snapshot konfiguracji OpenClaw — zwracają `postUpdate.plugins.status: "error"` i przełączają najwyższy poziom aktualizacji `status` na `"error"`, więc `openclaw update` kończy się kodem różnym od zera, a gateway _nie_ jest ponownie uruchamiany z niezweryfikowanym zestawem wtyczek. Błąd zawiera strukturalne wiersze `postUpdate.plugins.warnings[].guidance` wskazujące na `openclaw doctor --fix` i `openclaw plugins inspect <id> --runtime --json` jako dalsze kroki. Wyłączone wpisy wtyczek oraz rekordy, które nie są oficjalnymi celami synchronizacji powiązanymi z zaufanym źródłem, są tutaj pomijane, odzwierciedlając zasadę `skipDisabledPlugins` używaną przez sprawdzanie brakujących payloadów, więc przestarzały wyłączony rekord wtyczki nie może zablokować poza tym prawidłowej aktualizacji.

Gdy zaktualizowany Gateway startuje, ładowanie wtyczek jest tylko weryfikacyjne: start nie uruchamia menedżerów pakietów ani nie modyfikuje drzew zależności. Ponowne uruchomienia `update.run` menedżera pakietów omijają normalne odroczenie bezczynności i cooldown ponownego uruchomienia po podmianie drzewa pakietu, więc stary proces nie może dalej lazy-loadować usuniętych fragmentów.

Jeśli bootstrap pnpm nadal się nie powiedzie, aktualizator zatrzymuje się wcześnie z błędem specyficznym dla menedżera pakietów zamiast próbować `npm run build` wewnątrz checkoutu.
</Note>

## Skrót `--update`

`openclaw --update` przepisuje się na `openclaw update` (przydatne dla powłok i skryptów uruchamiających).

## Powiązane

- `openclaw doctor` (proponuje najpierw uruchomić aktualizację na checkoutach git)
- [Kanały deweloperskie](/pl/install/development-channels)
- [Aktualizowanie](/pl/install/updating)
- [Dokumentacja CLI](/pl/cli)
