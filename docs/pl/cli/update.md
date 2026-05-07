---
read_when:
    - Chcesz bezpiecznie zaktualizować kopię roboczą źródeł
    - Debugujesz dane wyjściowe lub opcje `openclaw update`
    - Należy zrozumieć zachowanie skrótu `--update`
summary: Dokumentacja referencyjna CLI dla `openclaw update` (względnie bezpieczna aktualizacja źródła + automatyczny restart Gateway)
title: Aktualizacja
x-i18n:
    generated_at: "2026-05-07T13:15:14Z"
    model: gpt-5.5
    provider: openai
    source_hash: 483e702dfe7f1d1b2f4bcd1037a93ba794fc6a24ff2060afcb3a825c3dc165c7
    source_path: cli/update.md
    workflow: 16
---

# `openclaw update`

Bezpiecznie aktualizuj OpenClaw i przełączaj się między kanałami stable/beta/dev.

Jeśli zainstalowano przez **npm/pnpm/bun** (instalacja globalna, bez metadanych git),
aktualizacje odbywają się przez przepływ menedżera pakietów opisany w [Aktualizacja](/pl/install/updating).

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

- `--no-restart`: pomiń ponowne uruchomienie usługi Gateway po pomyślnej aktualizacji. Aktualizacje przez menedżera pakietów, które ponownie uruchamiają Gateway, weryfikują przed powodzeniem polecenia, że ponownie uruchomiona usługa zgłasza oczekiwaną zaktualizowaną wersję.
- `--channel <stable|beta|dev>`: ustaw kanał aktualizacji (git + npm; utrwalany w konfiguracji).
- `--tag <dist-tag|version|spec>`: nadpisz docelowy pakiet tylko dla tej aktualizacji. W przypadku instalacji pakietowych `main` mapuje się na `github:openclaw/openclaw#main`.
- `--dry-run`: wyświetl podgląd planowanych działań aktualizacji (kanał/tag/cel/przepływ ponownego uruchomienia) bez zapisywania konfiguracji, instalowania, synchronizowania pluginów ani ponownego uruchamiania.
- `--json`: wypisz czytelny maszynowo JSON `UpdateRunResult`, w tym
  `postUpdate.plugins.warnings`, gdy uszkodzone lub niemożliwe do załadowania zarządzane pluginy wymagają
  naprawy po pomyślnej aktualizacji rdzenia, oraz `postUpdate.plugins.integrityDrifts`,
  gdy podczas synchronizacji pluginów po aktualizacji wykryto dryf artefaktów pluginów npm.
- `--timeout <seconds>`: limit czasu dla każdego kroku (domyślnie 1800s).
- `--yes`: pomiń monity o potwierdzenie (na przykład potwierdzenie downgrade’u).

`openclaw update` nie ma flagi `--verbose`. Użyj `--dry-run`, aby podejrzeć
planowane działania kanału/tagu/instalacji/ponownego uruchomienia, `--json` do czytelnych maszynowo
wyników oraz `openclaw update status --json`, gdy potrzebujesz tylko szczegółów kanału i
dostępności. Jeśli debugujesz logi Gateway w okolicy aktualizacji,
szczegółowość konsoli i poziom logowania do pliku są oddzielne: Gateway `--verbose` wpływa na
wyjście terminala/WebSocket, natomiast logi plikowe wymagają `logging.level: "debug"` lub
`"trace"` w konfiguracji. Zobacz [Logowanie Gateway](/pl/gateway/logging).

<Note>
W trybie Nix (`OPENCLAW_NIX_MODE=1`) modyfikujące uruchomienia `openclaw update` są wyłączone. Zamiast tego zaktualizuj źródło Nix lub wejście flake dla tej instalacji; w przypadku nix-openclaw użyj ścieżki agent-first [Szybki start](https://github.com/openclaw/nix-openclaw#quick-start). `openclaw update status` i `openclaw update --dry-run` pozostają tylko do odczytu.
</Note>

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

- `--json`: wypisz czytelny maszynowo JSON statusu.
- `--timeout <seconds>`: limit czasu dla sprawdzeń (domyślnie 3s).

## `update wizard`

Interaktywny przepływ wyboru kanału aktualizacji i potwierdzenia, czy ponownie uruchomić Gateway
po aktualizacji (domyślnie ponowne uruchomienie). Jeśli wybierzesz `dev` bez checkoutu git,
zaproponuje jego utworzenie.

Opcje:

- `--timeout <seconds>`: limit czasu dla każdego kroku aktualizacji (domyślnie `1800`)

## Co robi

Gdy jawnie przełączasz kanały (`--channel ...`), OpenClaw utrzymuje też zgodność
metody instalacji:

- `dev` → zapewnia checkout git (domyślnie: `~/openclaw`, nadpisz przez `OPENCLAW_GIT_DIR`),
  aktualizuje go i instaluje globalny CLI z tego checkoutu.
- `stable` → instaluje z npm przy użyciu `latest`.
- `beta` → preferuje dist-tag npm `beta`, ale wraca do `latest`, gdy beta jest
  niedostępna lub starsza niż bieżące wydanie stable.

Automatyczny aktualizator rdzenia Gateway (gdy jest włączony w konfiguracji) uruchamia ścieżkę aktualizacji CLI
poza aktywnym handlerem żądania Gateway. Aktualizacje menedżera pakietów control-plane `update.run`
wymuszają nieodroczone ponowne uruchomienie aktualizacyjne bez okresu cooldown po podmianie pakietu,
ponieważ stary proces Gateway może nadal mieć w pamięci fragmenty wskazujące na
pliki usunięte przez nowy pakiet.

W przypadku instalacji przez menedżera pakietów `openclaw update` rozwiązuje docelową
wersję pakietu przed wywołaniem menedżera pakietów. Globalne instalacje npm używają instalacji etapowej:
OpenClaw instaluje nowy pakiet do tymczasowego prefiksu npm, weryfikuje
tam spis spakowanego `dist`, a następnie podmienia to czyste drzewo pakietu w
rzeczywistym prefiksie globalnym. Jeśli weryfikacja się nie powiedzie, doctor po aktualizacji, synchronizacja pluginów i
ponowne uruchamianie nie są wykonywane z podejrzanego drzewa. Nawet gdy zainstalowana wersja
już odpowiada celowi, polecenie odświeża globalną instalację pakietu,
a następnie uruchamia synchronizację pluginów, odświeżenie uzupełniania poleceń rdzenia oraz ponowne uruchomienie. To
utrzymuje spakowane procesy pomocnicze i rekordy pluginów właściciela kanału w zgodzie z
zainstalowanym buildem OpenClaw, pozostawiając pełne przebudowy uzupełnień poleceń pluginów
jawnym uruchomieniom `openclaw completion --write-state`.

Gdy zainstalowana jest lokalna zarządzana usługa Gateway i włączone jest ponowne uruchamianie,
aktualizacje przez menedżera pakietów zatrzymują działającą usługę przed zastąpieniem drzewa pakietu,
następnie odświeżają metadane usługi ze zaktualizowanej instalacji, ponownie uruchamiają
usługę i weryfikują przed zgłoszeniem powodzenia, że ponownie uruchomiony Gateway raportuje oczekiwaną wersję.
Na macOS sprawdzenie po aktualizacji weryfikuje także, że LaunchAgent
jest załadowany/działa dla aktywnego profilu, a skonfigurowany port loopback jest
zdrowy. Jeśli plist jest zainstalowany, ale launchd go nie nadzoruje, OpenClaw
automatycznie ponownie bootstrapuje LaunchAgent, a następnie ponawia
sprawdzenia gotowości zdrowia/wersji/kanału. Świeży bootstrap ładuje zadanie RunAtLoad
bezpośrednio, więc odzyskiwanie po aktualizacji nie wykonuje natychmiast `kickstart -k` dla nowo
uruchomionego Gateway. Jeśli Gateway nadal nie staje się zdrowy, polecenie kończy się
kodem niezerowym i wypisuje ścieżkę logu ponownego uruchomienia oraz jawne instrukcje ponownego uruchomienia, reinstalacji i
rollbacku pakietu. Z `--no-restart`
zastąpienie pakietu nadal jest wykonywane, ale zarządzana usługa nie jest zatrzymywana ani
ponownie uruchamiana, więc działający Gateway może zachować stary kod, dopóki nie uruchomisz go ponownie
ręcznie.

## Przepływ checkoutu git

### Wybór kanału

- `stable`: checkout najnowszego tagu nie-beta, następnie build i doctor.
- `beta`: preferuj najnowszy tag `-beta`, ale wróć do najnowszego tagu stable, gdy beta jest niedostępna lub starsza.
- `dev`: checkout `main`, następnie fetch i rebase.

### Kroki aktualizacji

<Steps>
  <Step title="Weryfikuj czysty worktree">
    Wymaga braku niezatwierdzonych zmian.
  </Step>
  <Step title="Przełącz kanał">
    Przełącza na wybrany kanał (tag lub gałąź).
  </Step>
  <Step title="Pobierz upstream">
    Tylko dev.
  </Step>
  <Step title="Build preflight (tylko dev)">
    Uruchamia build TypeScript w tymczasowym worktree. Jeśli tip się nie powiedzie, cofa się do 10 commitów, aby znaleźć najnowszy commit możliwy do zbudowania. Ustaw `OPENCLAW_UPDATE_PREFLIGHT_LINT=1`, aby podczas tego preflightu uruchomić także lint; lint działa w ograniczonym trybie szeregowym, ponieważ hosty aktualizacji użytkowników są często mniejsze niż runnery CI.
  </Step>
  <Step title="Rebase">
    Wykonuje rebase na wybrany commit (tylko dev).
  </Step>
  <Step title="Zainstaluj zależności">
    Używa menedżera pakietów repo. W przypadku checkoutów pnpm aktualizator bootstrapuje `pnpm` na żądanie (najpierw przez `corepack`, następnie przez tymczasowy fallback `npm install pnpm@10`) zamiast uruchamiać `npm run build` wewnątrz workspace pnpm.
  </Step>
  <Step title="Zbuduj Control UI">
    Buduje gateway i Control UI.
  </Step>
  <Step title="Uruchom doctor">
    `openclaw doctor` działa jako końcowe sprawdzenie bezpiecznej aktualizacji.
  </Step>
  <Step title="Synchronizuj pluginy">
    Synchronizuje pluginy z aktywnym kanałem. Dev używa dołączonych pluginów; stable i beta używają npm. Aktualizuje śledzone instalacje pluginów.
  </Step>
</Steps>

Na kanale aktualizacji beta śledzone instalacje pluginów npm i ClawHub, które podążają
za domyślną/najnowszą linią, najpierw próbują wydania pluginu `@beta`. Jeśli plugin nie ma
wydania beta, OpenClaw wraca do zapisanej specyfikacji default/latest. W przypadku pluginów npm
OpenClaw wraca także wtedy, gdy pakiet beta istnieje, ale nie przechodzi walidacji
instalacji. Dokładne wersje i jawne tagi nie są przepisywane.

<Warning>
Jeśli aktualizacja dokładnie przypiętego pluginu npm rozwiązuje się do artefaktu, którego integralność różni się od zapisanego rekordu instalacji, `openclaw update` przerywa tę aktualizację artefaktu pluginu zamiast go instalować. Przeinstaluj lub zaktualizuj plugin jawnie dopiero po zweryfikowaniu, że ufasz nowemu artefaktowi.
</Warning>

<Note>
Niepowodzenia synchronizacji pluginów po aktualizacji, które są ograniczone do zarządzanego pluginu, są raportowane jako ostrzeżenia po pomyślnej aktualizacji rdzenia. Wynik JSON zachowuje najwyższy poziom aktualizacji `status: "ok"` i raportuje `postUpdate.plugins.status: "warning"` z wytycznymi `openclaw doctor --fix` oraz `openclaw plugins inspect <id> --runtime --json`. Nieoczekiwane wyjątki aktualizatora lub synchronizacji nadal powodują niepowodzenie wyniku aktualizacji. Napraw instalację pluginu lub błąd aktualizacji, a następnie ponownie uruchom `openclaw doctor --fix` albo `openclaw update`.

Gdy zaktualizowany Gateway startuje, ładowanie pluginów jest tylko weryfikacyjne: start nie uruchamia menedżerów pakietów ani nie modyfikuje drzew zależności. Ponowne uruchomienia `update.run` menedżera pakietów omijają normalne odroczenie bezczynności i cooldown ponownego uruchomienia po podmianie drzewa pakietu, więc stary proces nie może nadal leniwie ładować usuniętych fragmentów.

Jeśli bootstrap pnpm nadal się nie powiedzie, aktualizator zatrzymuje się wcześnie z błędem specyficznym dla menedżera pakietów, zamiast próbować `npm run build` wewnątrz checkoutu.
</Note>

## Skrót `--update`

`openclaw --update` przepisuje się na `openclaw update` (przydatne dla powłok i skryptów uruchamiających).

## Powiązane

- `openclaw doctor` (oferuje najpierw uruchomienie aktualizacji w checkoutach git)
- [Kanały rozwojowe](/pl/install/development-channels)
- [Aktualizacja](/pl/install/updating)
- [Dokumentacja CLI](/pl/cli)
