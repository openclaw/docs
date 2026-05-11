---
read_when:
    - Chcesz bezpiecznie zaktualizować kopię roboczą źródeł
    - Debugujesz dane wyjściowe lub opcje `openclaw update`
    - Musisz zrozumieć zachowanie skrótu `--update`
summary: Referencja CLI dla `openclaw update` (względnie bezpieczna aktualizacja źródła + automatyczny restart Gateway)
title: Aktualizacja
x-i18n:
    generated_at: "2026-05-11T20:27:17Z"
    model: gpt-5.5
    provider: openai
    source_hash: cefe31181412d398f205a51429f6f5c20e86dfa96bd3d78333cefeb8ab6873b0
    source_path: cli/update.md
    workflow: 16
---

# `openclaw update`

Bezpiecznie aktualizuj OpenClaw i przełączaj się między kanałami stable/beta/dev.

Jeśli instalacja została wykonana przez **npm/pnpm/bun** (instalacja globalna, bez metadanych git),
aktualizacje odbywają się przepływem menedżera pakietów opisanym w [Aktualizowanie](/pl/install/updating).

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

- `--no-restart`: pomija ponowne uruchomienie usługi Gateway po udanej aktualizacji. Aktualizacje przez menedżera pakietów, które ponownie uruchamiają Gateway, sprawdzają przed powodzeniem polecenia, czy ponownie uruchomiona usługa zgłasza oczekiwaną zaktualizowaną wersję.
- `--channel <stable|beta|dev>`: ustawia kanał aktualizacji (git + npm; utrwalany w konfiguracji).
- `--tag <dist-tag|version|spec>`: nadpisuje cel pakietu tylko dla tej aktualizacji. Dla instalacji pakietowych `main` mapuje się na `github:openclaw/openclaw#main`.
- `--dry-run`: pokazuje podgląd planowanych działań aktualizacji (kanał/tag/cel/przepływ restartu) bez zapisywania konfiguracji, instalowania, synchronizowania plugins ani ponownego uruchamiania.
- `--json`: wypisuje czytelny maszynowo JSON `UpdateRunResult`, w tym
  `postUpdate.plugins.warnings`, gdy uszkodzone lub niemożliwe do załadowania zarządzane plugins wymagają
  naprawy po powodzeniu aktualizacji rdzenia, szczegóły awaryjnego wyboru plugin dla kanału beta,
  gdy plugin nie ma wydania beta, oraz `postUpdate.plugins.integrityDrifts`,
  gdy podczas synchronizacji plugin po aktualizacji wykryto rozjazd artefaktu plugin npm.
- `--timeout <seconds>`: limit czasu dla każdego kroku (domyślnie 1800s).
- `--yes`: pomija monity potwierdzenia (na przykład potwierdzenie obniżenia wersji).

`openclaw update` nie ma flagi `--verbose`. Użyj `--dry-run`, aby podejrzeć
planowane działania kanału/tagu/instalacji/restartu, `--json` dla czytelnych maszynowo
wyników oraz `openclaw update status --json`, gdy potrzebujesz tylko szczegółów kanału i
dostępności. Jeśli debugujesz logi Gateway wokół aktualizacji,
szczegółowość konsoli i poziom logowania do pliku są osobne: Gateway `--verbose` wpływa na
wyjście terminala/WebSocket, natomiast logi plikowe wymagają `logging.level: "debug"` lub
`"trace"` w konfiguracji. Zobacz [Logowanie Gateway](/pl/gateway/logging).

<Note>
W trybie Nix (`OPENCLAW_NIX_MODE=1`) mutujące uruchomienia `openclaw update` są wyłączone. Zamiast tego zaktualizuj źródło Nix lub wejście flake dla tej instalacji; dla nix-openclaw użyj [Szybkiego startu](https://github.com/openclaw/nix-openclaw#quick-start) z podejściem agent-first. `openclaw update status` i `openclaw update --dry-run` pozostają tylko do odczytu.
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
- `--timeout <seconds>`: limit czasu dla sprawdzeń (domyślnie 3s).

## `update wizard`

Interaktywny przepływ wyboru kanału aktualizacji i potwierdzenia, czy ponownie uruchomić Gateway
po aktualizacji (domyślnie ponownie uruchamia). Jeśli wybierzesz `dev` bez checkoutu git, zaoferuje
utworzenie go.

Opcje:

- `--timeout <seconds>`: limit czasu dla każdego kroku aktualizacji (domyślnie `1800`)

## Co robi

Gdy jawnie przełączasz kanały (`--channel ...`), OpenClaw utrzymuje też zgodność
metody instalacji:

- `dev` → zapewnia checkout git (domyślnie: `~/openclaw`, nadpisz przez `OPENCLAW_GIT_DIR`),
  aktualizuje go i instaluje globalne CLI z tego checkoutu.
- `stable` → instaluje z npm przy użyciu `latest`.
- `beta` → preferuje npm dist-tag `beta`, ale wraca do `latest`, gdy beta jest
  brakująca albo starsza niż bieżące wydanie stable.

Automatyczny aktualizator rdzenia Gateway (gdy jest włączony w konfiguracji) uruchamia ścieżkę aktualizacji CLI
poza aktywną obsługą żądania Gateway. Aktualizacje menedżera pakietów `update.run` w płaszczyźnie kontrolnej
wymuszają nieodroczony restart aktualizacji bez okresu cooldown po podmianie pakietu,
ponieważ stary proces Gateway nadal może mieć w pamięci fragmenty wskazujące na
pliki usunięte przez nowy pakiet.

Dla instalacji przez menedżera pakietów `openclaw update` rozwiązuje docelową
wersję pakietu przed wywołaniem menedżera pakietów. Globalne instalacje npm używają instalacji etapowej:
OpenClaw instaluje nowy pakiet do tymczasowego prefiksu npm, weryfikuje
spakowany spis `dist`, a następnie podmienia czyste drzewo pakietu do
rzeczywistego globalnego prefiksu. Jeśli weryfikacja się nie powiedzie, doctor po aktualizacji, synchronizacja plugin i
restart nie są uruchamiane z podejrzanego drzewa. Nawet gdy zainstalowana wersja
już odpowiada celowi, polecenie odświeża globalną instalację pakietu,
a następnie uruchamia synchronizację plugin, odświeżenie uzupełnień poleceń rdzenia oraz restart.
Dzięki temu spakowane procesy pomocnicze i należące do kanału rekordy plugin pozostają zgodne z
zainstalowaną kompilacją OpenClaw, pozostawiając pełne przebudowy uzupełnień poleceń plugin
jawnym uruchomieniom `openclaw completion --write-state`.

Gdy lokalna zarządzana usługa Gateway jest zainstalowana i restart jest włączony,
aktualizacje przez menedżera pakietów zatrzymują działającą usługę przed zastąpieniem drzewa pakietu,
następnie odświeżają metadane usługi ze zaktualizowanej instalacji, ponownie uruchamiają
usługę i sprawdzają, czy ponownie uruchomiony Gateway zgłasza oczekiwaną wersję przed
zgłoszeniem powodzenia. W systemie macOS sprawdzenie po aktualizacji weryfikuje też, czy LaunchAgent
jest załadowany/działa dla aktywnego profilu oraz czy skonfigurowany port loopback jest
zdrowy. Jeśli plist jest zainstalowany, ale launchd go nie nadzoruje, OpenClaw
automatycznie ponownie bootstrapuje LaunchAgent, a następnie ponownie uruchamia
sprawdzenia gotowości zdrowia/wersji/kanału. Świeży bootstrap ładuje zadanie RunAtLoad
bezpośrednio, więc odzyskiwanie po aktualizacji nie wykonuje natychmiast `kickstart -k` na nowo
uruchomionym Gateway. Jeśli Gateway nadal nie stanie się zdrowy, polecenie kończy się
kodem niezerowym i wypisuje ścieżkę logu restartu oraz jawne instrukcje restartu, ponownej instalacji i
wycofania pakietu. Z `--no-restart`
zastąpienie pakietu nadal działa, ale zarządzana usługa nie jest zatrzymywana ani
ponownie uruchamiana, więc działający Gateway może zachować stary kod, dopóki nie zrestartujesz go
ręcznie.

## Przepływ checkoutu git

### Wybór kanału

- `stable`: checkout najnowszego tagu nie-beta, potem build i doctor.
- `beta`: preferuje najnowszy tag `-beta`, ale wraca do najnowszego tagu stable, gdy beta jest brakująca lub starsza.
- `dev`: checkout `main`, potem fetch i rebase.

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
    Używa menedżera pakietów repozytorium. Dla checkoutów pnpm aktualizator bootstrapuje `pnpm` na żądanie (najpierw przez `corepack`, potem awaryjnie przez tymczasowe `npm install pnpm@11`) zamiast uruchamiać `npm run build` wewnątrz workspace pnpm.
  </Step>
  <Step title="Zbuduj Control UI">
    Buduje gateway i Control UI.
  </Step>
  <Step title="Uruchom doctor">
    `openclaw doctor` działa jako końcowe sprawdzenie bezpiecznej aktualizacji.
  </Step>
  <Step title="Synchronizuj plugins">
    Synchronizuje plugins z aktywnym kanałem. Dev używa dołączonych plugins; stable i beta używają npm. Aktualizuje śledzone instalacje plugin.
  </Step>
</Steps>

Na kanale aktualizacji beta śledzone instalacje plugin npm i ClawHub, które podążają
domyślną/najnowszą linią, najpierw próbują wydania plugin `@beta`. Jeśli plugin nie ma
wydania beta, OpenClaw wraca do zapisanego domyślnego/najnowszego spec i zgłasza
to jako ostrzeżenie. Dla plugins npm OpenClaw wraca też, gdy pakiet beta
istnieje, ale nie przechodzi walidacji instalacji. Te ostrzeżenia awaryjnego wyboru plugin
nie powodują niepowodzenia aktualizacji rdzenia. Dokładne wersje i jawne tagi nie są
przepisywane.

<Warning>
Jeśli aktualizacja dokładnie przypiętego plugin npm rozwiązuje się do artefaktu, którego integralność różni się od zapisanego rekordu instalacji, `openclaw update` przerywa aktualizację tego artefaktu plugin zamiast go instalować. Ponownie zainstaluj lub zaktualizuj plugin jawnie dopiero po sprawdzeniu, że ufasz nowemu artefaktowi.
</Warning>

<Note>
Niepowodzenia synchronizacji plugin po aktualizacji, które są ograniczone do zarządzanego plugin, są zgłaszane jako ostrzeżenia po powodzeniu aktualizacji rdzenia. Wynik JSON zachowuje najwyższy poziom aktualizacji `status: "ok"` i zgłasza `postUpdate.plugins.status: "warning"` z poradami `openclaw doctor --fix` oraz `openclaw plugins inspect <id> --runtime --json`. Nieoczekiwane wyjątki aktualizatora lub synchronizacji nadal powodują niepowodzenie wyniku aktualizacji. Napraw instalację plugin lub błąd aktualizacji, a następnie ponownie uruchom `openclaw doctor --fix` albo `openclaw update`.

Gdy zaktualizowany Gateway startuje, ładowanie plugin jest tylko weryfikacyjne: start nie uruchamia menedżerów pakietów ani nie mutuje drzew zależności. Restarty menedżera pakietów `update.run` omijają normalne odroczenie bezczynności i cooldown restartu po podmianie drzewa pakietu, więc stary proces nie może dalej lazy-loadować usuniętych fragmentów.

Jeśli bootstrap pnpm nadal się nie powiedzie, aktualizator zatrzymuje się wcześnie z błędem specyficznym dla menedżera pakietów zamiast próbować `npm run build` wewnątrz checkoutu.
</Note>

## Skrót `--update`

`openclaw --update` przepisuje się na `openclaw update` (przydatne dla powłok i skryptów uruchamiających).

## Powiązane

- `openclaw doctor` (oferuje najpierw uruchomienie aktualizacji na checkoutach git)
- [Kanały deweloperskie](/pl/install/development-channels)
- [Aktualizowanie](/pl/install/updating)
- [Referencja CLI](/pl/cli)
