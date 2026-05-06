---
read_when:
    - Chcesz bezpiecznie zaktualizować kopię roboczą źródeł
    - Debugujesz dane wyjściowe lub opcje `openclaw update`
    - Musisz zrozumieć zachowanie skrótu `--update`
summary: Dokumentacja referencyjna CLI dla `openclaw update` (względnie bezpieczna aktualizacja źródła + automatyczne ponowne uruchomienie Gateway)
title: Aktualizacja
x-i18n:
    generated_at: "2026-05-06T17:54:50Z"
    model: gpt-5.5
    provider: openai
    source_hash: 483e702dfe7f1d1b2f4bcd1037a93ba794fc6a24ff2060afcb3a825c3dc165c7
    source_path: cli/update.md
    workflow: 16
---

# `openclaw update`

Bezpiecznie aktualizuj OpenClaw i przełączaj się między kanałami stable/beta/dev.

Jeśli instalacja została wykonana przez **npm/pnpm/bun** (instalacja globalna, bez metadanych git),
aktualizacje odbywają się przez przepływ menedżera pakietów opisany w [Aktualizacji](/pl/install/updating).

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

- `--no-restart`: pomiń ponowne uruchomienie usługi Gateway po udanej aktualizacji. Aktualizacje przez menedżera pakietów, które ponownie uruchamiają Gateway, przed powodzeniem polecenia weryfikują, że ponownie uruchomiona usługa zgłasza oczekiwaną zaktualizowaną wersję.
- `--channel <stable|beta|dev>`: ustaw kanał aktualizacji (git + npm; utrwalany w konfiguracji).
- `--tag <dist-tag|version|spec>`: nadpisz docelowy pakiet tylko dla tej aktualizacji. W przypadku instalacji pakietowych `main` mapuje się na `github:openclaw/openclaw#main`.
- `--dry-run`: podejrzyj planowane działania aktualizacji (przepływ channel/tag/target/restart) bez zapisywania konfiguracji, instalowania, synchronizowania pluginów ani ponownego uruchamiania.
- `--json`: wypisz czytelny maszynowo JSON `UpdateRunResult`, w tym
  `postUpdate.plugins.warnings`, gdy uszkodzone lub niemożliwe do załadowania zarządzane pluginy wymagają
  naprawy po udanej aktualizacji rdzenia, oraz `postUpdate.plugins.integrityDrifts`,
  gdy podczas synchronizacji pluginów po aktualizacji wykryto dryf artefaktu pluginu npm.
- `--timeout <seconds>`: limit czasu dla każdego kroku (domyślnie 1800 s).
- `--yes`: pomiń prośby o potwierdzenie (na przykład potwierdzenie obniżenia wersji).

`openclaw update` nie ma flagi `--verbose`. Użyj `--dry-run`, aby podejrzeć
planowane działania channel/tag/install/restart, `--json` dla wyników czytelnych
maszynowo oraz `openclaw update status --json`, gdy potrzebujesz tylko szczegółów
kanału i dostępności. Jeśli debugujesz logi Gateway w okolicy aktualizacji,
szczegółowość konsoli i poziom logowania do pliku są rozdzielne: Gateway `--verbose` wpływa na
wyjście terminala/WebSocket, natomiast logi plikowe wymagają `logging.level: "debug"` lub
`"trace"` w konfiguracji. Zobacz [logowanie Gateway](/pl/gateway/logging).

<Note>
W trybie Nix (`OPENCLAW_NIX_MODE=1`) modyfikujące uruchomienia `openclaw update` są wyłączone. Zamiast tego zaktualizuj źródło Nix lub wejście flake dla tej instalacji; w przypadku nix-openclaw użyj podejścia agent-first [Szybki start](https://github.com/openclaw/nix-openclaw#quick-start). `openclaw update status` i `openclaw update --dry-run` pozostają tylko do odczytu.
</Note>

<Warning>
Obniżanie wersji wymaga potwierdzenia, ponieważ starsze wersje mogą uszkodzić konfigurację.
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
- `--timeout <seconds>`: limit czasu dla sprawdzeń (domyślnie 3 s).

## `update wizard`

Interaktywny przepływ wyboru kanału aktualizacji i potwierdzenia, czy ponownie uruchomić Gateway
po aktualizacji (domyślnie następuje ponowne uruchomienie). Jeśli wybierzesz `dev` bez checkoutu git,
zaproponuje jego utworzenie.

Opcje:

- `--timeout <seconds>`: limit czasu dla każdego kroku aktualizacji (domyślnie `1800`)

## Co robi

Gdy jawnie przełączasz kanały (`--channel ...`), OpenClaw utrzymuje także zgodność
metody instalacji:

- `dev` → zapewnia checkout git (domyślnie: `~/openclaw`, nadpisz za pomocą `OPENCLAW_GIT_DIR`),
  aktualizuje go i instaluje globalne CLI z tego checkoutu.
- `stable` → instaluje z npm przy użyciu `latest`.
- `beta` → preferuje dist-tag npm `beta`, ale wraca do `latest`, gdy beta jest
  niedostępna albo starsza niż bieżące wydanie stabilne.

Automatyczny aktualizator rdzenia Gateway (gdy jest włączony przez konfigurację) uruchamia ścieżkę aktualizacji CLI
poza aktywnym handlerem żądania Gateway. Aktualizacje menedżera pakietów `update.run` w warstwie control-plane
wymuszają nieodroczony restart aktualizacyjny bez cooldownu po podmianie pakietu,
ponieważ stary proces Gateway może nadal mieć w pamięci fragmenty wskazujące na
pliki usunięte przez nowy pakiet.

W przypadku instalacji przez menedżera pakietów `openclaw update` rozwiązuje docelową wersję
pakietu przed wywołaniem menedżera pakietów. Globalne instalacje npm używają instalacji etapowej:
OpenClaw instaluje nowy pakiet w tymczasowym prefiksie npm, weryfikuje tam
spis zapakowanego `dist`, a następnie podmienia to czyste drzewo pakietu do
rzeczywistego globalnego prefiksu. Jeśli weryfikacja się nie powiedzie, post-update doctor, synchronizacja pluginów i
ponowne uruchomienie nie są uruchamiane z podejrzanego drzewa. Nawet gdy zainstalowana wersja
już odpowiada celowi, polecenie odświeża globalną instalację pakietu,
a następnie uruchamia synchronizację pluginów, odświeżenie uzupełniania poleceń rdzenia i ponowne uruchomienie. Dzięki temu
zapakowane sidecary i rekordy pluginów należące do kanału pozostają zgodne z
zainstalowaną kompilacją OpenClaw, a pełne przebudowy uzupełniania poleceń pluginów pozostają przypisane do
jawnych uruchomień `openclaw completion --write-state`.

Gdy zainstalowana jest lokalna zarządzana usługa Gateway, a ponowne uruchomienie jest włączone,
aktualizacje przez menedżera pakietów zatrzymują działającą usługę przed zastąpieniem drzewa pakietu,
następnie odświeżają metadane usługi ze zaktualizowanej instalacji, ponownie uruchamiają
usługę i weryfikują, że ponownie uruchomiony Gateway zgłasza oczekiwaną wersję przed
zgłoszeniem powodzenia. Na macOS sprawdzenie po aktualizacji weryfikuje także, że LaunchAgent
jest załadowany/działa dla aktywnego profilu, a skonfigurowany port loopback jest
zdrowy. Jeśli plist jest zainstalowany, ale launchd go nie nadzoruje, OpenClaw
automatycznie ponownie bootstrapuje LaunchAgent, a następnie ponownie uruchamia
sprawdzenia gotowości health/version/channel. Świeży bootstrap ładuje zadanie RunAtLoad
bezpośrednio, więc odzyskiwanie po aktualizacji nie wykonuje od razu `kickstart -k` na nowo
uruchomionym Gateway. Jeśli Gateway nadal nie stanie się zdrowy, polecenie kończy się
kodem niezerowym i wypisuje ścieżkę logu restartu oraz jawne instrukcje restartu, reinstalacji i
wycofania pakietu. Z `--no-restart`
zastąpienie pakietu nadal działa, ale zarządzana usługa nie jest zatrzymywana ani
ponownie uruchamiana, więc działający Gateway może zachować stary kod, dopóki nie uruchomisz go
ponownie ręcznie.

## Przepływ checkoutu git

### Wybór kanału

- `stable`: checkout najnowszego tagu niebędącego beta, następnie build i doctor.
- `beta`: preferuj najnowszy tag `-beta`, ale wróć do najnowszego tagu stabilnego, gdy beta jest niedostępna albo starsza.
- `dev`: checkout `main`, następnie fetch i rebase.

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
  <Step title="Build preflight (tylko dev)">
    Uruchamia build TypeScript w tymczasowym drzewie roboczym. Jeśli tip się nie powiedzie, cofa się maksymalnie o 10 commitów, aby znaleźć najnowszy commit możliwy do zbudowania. Ustaw `OPENCLAW_UPDATE_PREFLIGHT_LINT=1`, aby podczas tego preflight uruchomić także lint; lint działa w ograniczonym trybie szeregowym, ponieważ hosty aktualizacji użytkowników są często mniejsze niż runnery CI.
  </Step>
  <Step title="Rebase">
    Wykonuje rebase na wybrany commit (tylko dev).
  </Step>
  <Step title="Zainstaluj zależności">
    Używa menedżera pakietów repozytorium. W przypadku checkoutów pnpm aktualizator bootstrapuje `pnpm` na żądanie (najpierw przez `corepack`, a następnie awaryjnie przez tymczasowe `npm install pnpm@10`) zamiast uruchamiać `npm run build` wewnątrz workspace pnpm.
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

Na kanale aktualizacji beta śledzone instalacje pluginów npm i ClawHub, które podążają za
domyślną/najnowszą linią, najpierw próbują wydania pluginu `@beta`. Jeśli plugin nie ma
wydania beta, OpenClaw wraca do zarejestrowanej specyfikacji default/latest. W przypadku pluginów
npm OpenClaw wraca także wtedy, gdy pakiet beta istnieje, ale nie przechodzi walidacji
instalacji. Dokładne wersje i jawne tagi nie są przepisywane.

<Warning>
Jeśli dokładnie przypięta aktualizacja pluginu npm rozwiązuje się do artefaktu, którego integralność różni się od zapisanego rekordu instalacji, `openclaw update` przerywa tę aktualizację artefaktu pluginu zamiast go instalować. Zainstaluj ponownie lub zaktualizuj plugin jawnie dopiero po zweryfikowaniu, że ufasz nowemu artefaktowi.
</Warning>

<Note>
Błędy synchronizacji pluginów po aktualizacji, które są ograniczone do zarządzanego pluginu, są zgłaszane jako ostrzeżenia po udanej aktualizacji rdzenia. Wynik JSON zachowuje najwyższy poziom aktualizacji `status: "ok"` i zgłasza `postUpdate.plugins.status: "warning"` z instrukcjami `openclaw doctor --fix` oraz `openclaw plugins inspect <id> --runtime --json`. Nieoczekiwane wyjątki aktualizatora lub synchronizacji nadal powodują niepowodzenie wyniku aktualizacji. Napraw instalację pluginu lub błąd aktualizacji, a następnie ponownie uruchom `openclaw doctor --fix` albo `openclaw update`.

Gdy zaktualizowany Gateway startuje, ładowanie pluginów jest tylko weryfikacyjne: startup nie uruchamia menedżerów pakietów ani nie modyfikuje drzew zależności. Restarty menedżera pakietów `update.run` omijają normalne odroczenie bezczynności i cooldown restartu po podmianie drzewa pakietu, więc stary proces nie może dalej leniwie ładować usuniętych fragmentów.

Jeśli bootstrap pnpm nadal się nie powiedzie, aktualizator zatrzymuje się wcześnie z błędem specyficznym dla menedżera pakietów zamiast próbować `npm run build` wewnątrz checkoutu.
</Note>

## Skrót `--update`

`openclaw --update` jest przepisywane na `openclaw update` (przydatne dla powłok i skryptów uruchamiających).

## Powiązane

- `openclaw doctor` (proponuje najpierw uruchomienie aktualizacji w checkoutach git)
- [Kanały rozwojowe](/pl/install/development-channels)
- [Aktualizowanie](/pl/install/updating)
- [Dokumentacja CLI](/pl/cli)
