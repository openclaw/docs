---
read_when:
    - Chcesz bezpiecznie zaktualizować lokalną kopię źródłową
    - Debugujesz dane wyjściowe lub opcje `openclaw update`
    - Musisz rozumieć zachowanie skrótu `--update`
summary: Dokumentacja referencyjna CLI dla `openclaw update` (względnie bezpieczna aktualizacja źródła + automatyczny restart Gateway)
title: Aktualizacja
x-i18n:
    generated_at: "2026-05-05T01:45:20Z"
    model: gpt-5.5
    provider: openai
    source_hash: b12b1837ae80a3688fb7805d78d5a354f07dccdaba175cfa429e18145e543a1f
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

- `--no-restart`: pomiń ponowne uruchomienie usługi Gateway po udanej aktualizacji. Aktualizacje przez menedżera pakietów, które ponownie uruchamiają Gateway, sprawdzają przed powodzeniem polecenia, czy uruchomiona ponownie usługa zgłasza oczekiwaną zaktualizowaną wersję.
- `--channel <stable|beta|dev>`: ustaw kanał aktualizacji (git + npm; utrwalany w konfiguracji).
- `--tag <dist-tag|version|spec>`: nadpisz docelowy pakiet tylko dla tej aktualizacji. W przypadku instalacji pakietowych `main` mapuje się na `github:openclaw/openclaw#main`.
- `--dry-run`: podejrzyj planowane działania aktualizacji (kanał/tag/cel/przepływ ponownego uruchomienia) bez zapisywania konfiguracji, instalowania, synchronizowania Plugin ani ponownego uruchamiania.
- `--json`: wypisz czytelny maszynowo JSON `UpdateRunResult`, w tym
  `postUpdate.plugins.integrityDrifts`, gdy podczas synchronizacji Plugin po aktualizacji zostanie
  wykryte przesunięcie artefaktu Plugin npm.
- `--timeout <seconds>`: limit czasu dla każdego kroku (domyślnie 1800 s).
- `--yes`: pomiń monity o potwierdzenie (na przykład potwierdzenie obniżenia wersji).

`openclaw update` nie ma flagi `--verbose`. Użyj `--dry-run`, aby podejrzeć
planowane działania dotyczące kanału/tagu/instalacji/ponownego uruchomienia, `--json` dla czytelnych maszynowo
wyników oraz `openclaw update status --json`, gdy potrzebujesz tylko szczegółów kanału i
dostępności. Jeśli debugujesz logi Gateway w czasie aktualizacji,
szczegółowość konsoli i poziom logów plikowych są oddzielne: `--verbose` Gateway wpływa na
wyjście terminala/WebSocket, natomiast logi plikowe wymagają `logging.level: "debug"` lub
`"trace"` w konfiguracji. Zobacz [logowanie Gateway](/pl/gateway/logging).

<Warning>
Obniżenie wersji wymaga potwierdzenia, ponieważ starsze wersje mogą uszkodzić konfigurację.
</Warning>

## `update status`

Pokaż aktywny kanał aktualizacji oraz tag/gałąź/SHA git (dla checkoutów ze źródeł), a także dostępność aktualizacji.

```bash
openclaw update status
openclaw update status --json
openclaw update status --timeout 10
```

Opcje:

- `--json`: wypisz czytelny maszynowo JSON statusu.
- `--timeout <seconds>`: limit czasu sprawdzeń (domyślnie 3 s).

## `update wizard`

Interaktywny przepływ wyboru kanału aktualizacji i potwierdzenia, czy ponownie uruchomić Gateway
po aktualizacji (domyślnie ponownie uruchamia). Jeśli wybierzesz `dev` bez checkoutu git,
zaproponuje jego utworzenie.

Opcje:

- `--timeout <seconds>`: limit czasu dla każdego kroku aktualizacji (domyślnie `1800`)

## Co robi

Gdy jawnie przełączasz kanały (`--channel ...`), OpenClaw utrzymuje także
zgodność metody instalacji:

- `dev` → zapewnia checkout git (domyślnie: `~/openclaw`, nadpisywane przez `OPENCLAW_GIT_DIR`),
  aktualizuje go i instaluje globalne CLI z tego checkoutu.
- `stable` → instaluje z npm przy użyciu `latest`.
- `beta` → preferuje npm dist-tag `beta`, ale wraca do `latest`, gdy beta jest
  niedostępna albo starsza niż bieżące wydanie stabilne.

Automatyczny aktualizator rdzenia Gateway (gdy włączony w konfiguracji) uruchamia ścieżkę aktualizacji CLI
poza aktywnym handlerem żądania Gateway. Aktualizacje menedżera pakietów z płaszczyzny sterowania `update.run`
wymuszają nieodroczone ponowne uruchomienie aktualizacyjne bez okresu schłodzenia po podmianie pakietu,
ponieważ stary proces Gateway może nadal mieć w pamięci fragmenty wskazujące na
pliki usunięte przez nowy pakiet.

W przypadku instalacji przez menedżera pakietów `openclaw update` rozwiązuje docelową
wersję pakietu przed wywołaniem menedżera pakietów. Globalne instalacje npm używają etapowanej
instalacji: OpenClaw instaluje nowy pakiet w tymczasowym prefiksie npm, weryfikuje
tam spis spakowanego `dist`, a następnie podmienia czyste drzewo pakietu do
rzeczywistego globalnego prefiksu. Jeśli weryfikacja się nie powiedzie, doctor po aktualizacji, synchronizacja Plugin i
ponowne uruchomienie nie są wykonywane z podejrzanego drzewa. Nawet gdy zainstalowana wersja
już odpowiada celowi, polecenie odświeża globalną instalację pakietu,
a następnie wykonuje synchronizację Plugin, odświeżenie uzupełnień poleceń rdzenia i ponowne uruchomienie. To
utrzymuje spakowane procesy pomocnicze i rekordy Plugin należące do kanału w zgodzie z
zainstalowaną kompilacją OpenClaw, pozostawiając pełne przebudowy uzupełnień poleceń Plugin
jawnym uruchomieniom `openclaw completion --write-state`.

Gdy lokalna zarządzana usługa Gateway jest zainstalowana i ponowne uruchomienie jest włączone,
aktualizacje przez menedżera pakietów zatrzymują działającą usługę przed zastąpieniem drzewa pakietu,
następnie odświeżają metadane usługi ze zaktualizowanej instalacji, ponownie uruchamiają
usługę i sprawdzają, czy ponownie uruchomiony Gateway zgłasza oczekiwaną wersję przed
zgłoszeniem powodzenia. W systemie macOS sprawdzenie po aktualizacji weryfikuje także, czy LaunchAgent
jest załadowany/działa dla aktywnego profilu oraz czy skonfigurowany port loopback jest
sprawny. Jeśli plist jest zainstalowany, ale launchd go nie nadzoruje, OpenClaw
automatycznie ponownie bootstrapuje LaunchAgent, a następnie ponownie uruchamia
sprawdzenia gotowości zdrowia/wersji/kanału. Świeży bootstrap ładuje zadanie RunAtLoad
bezpośrednio, więc odzyskiwanie aktualizacji nie wykonuje natychmiast `kickstart -k` na nowo
uruchomionym Gateway. Jeśli Gateway nadal nie staje się zdrowy, polecenie kończy się
kodem niezerowym i wypisuje ścieżkę logu ponownego uruchomienia oraz jawne instrukcje ponownego uruchomienia, ponownej instalacji i
wycofania pakietu. Z `--no-restart`,
zastąpienie pakietu nadal działa, ale zarządzana usługa nie jest zatrzymywana ani
ponownie uruchamiana, więc działający Gateway może zachować stary kod, dopóki nie uruchomisz go
ręcznie ponownie.

## Przepływ checkoutu git

### Wybór kanału

- `stable`: przełącz na najnowszy tag niebędący beta, następnie zbuduj i uruchom doctor.
- `beta`: preferuj najnowszy tag `-beta`, ale wróć do najnowszego tagu stabilnego, gdy beta jest niedostępna lub starsza.
- `dev`: przełącz na `main`, następnie pobierz i wykonaj rebase.

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
  <Step title="Wstępna kompilacja (tylko dev)">
    Uruchamia lint i kompilację TypeScript w tymczasowym drzewie roboczym. Jeśli tip się nie powiedzie, cofa się maksymalnie o 10 commitów, aby znaleźć najnowszą czystą kompilację.
  </Step>
  <Step title="Rebase">
    Wykonuje rebase na wybrany commit (tylko dev).
  </Step>
  <Step title="Zainstaluj zależności">
    Używa menedżera pakietów repozytorium. W przypadku checkoutów pnpm aktualizator bootstrapuje `pnpm` na żądanie (najpierw przez `corepack`, następnie przez tymczasową ścieżkę awaryjną `npm install pnpm@10`) zamiast uruchamiać `npm run build` w obszarze roboczym pnpm.
  </Step>
  <Step title="Zbuduj Control UI">
    Buduje gateway i Control UI.
  </Step>
  <Step title="Uruchom doctor">
    `openclaw doctor` działa jako ostatnie sprawdzenie bezpiecznej aktualizacji.
  </Step>
  <Step title="Synchronizuj Plugin">
    Synchronizuje Plugin z aktywnym kanałem. Dev używa dołączonych Plugin; stable i beta używają npm. Aktualizuje śledzone instalacje Plugin.
  </Step>
</Steps>

Na kanale aktualizacji beta śledzone instalacje Plugin npm i ClawHub, które podążają za
domyślną/najnowszą linią, najpierw próbują wydania Plugin `@beta`. Jeśli Plugin nie ma
wydania beta, OpenClaw wraca do zapisanej specyfikacji domyślnej/najnowszej. W przypadku Plugin
npm OpenClaw wraca także wtedy, gdy pakiet beta istnieje, ale nie przechodzi
walidacji instalacji. Dokładne wersje i jawne tagi nie są przepisywane.

<Warning>
Jeśli dokładnie przypięta aktualizacja Plugin npm rozwiązuje się do artefaktu, którego integralność różni się od zapisanego rekordu instalacji, `openclaw update` przerywa aktualizację tego artefaktu Plugin zamiast go instalować. Zainstaluj ponownie lub zaktualizuj Plugin jawnie dopiero po zweryfikowaniu, że ufasz nowemu artefaktowi.
</Warning>

<Note>
Niepowodzenia synchronizacji Plugin po aktualizacji powodują niepowodzenie wyniku aktualizacji i zatrzymują dalsze ponowne uruchamianie. Napraw instalację Plugin lub błąd aktualizacji, a następnie uruchom ponownie `openclaw update`.

Gdy zaktualizowany Gateway startuje, ładowanie Plugin jest tylko weryfikacyjne: start nie uruchamia menedżerów pakietów ani nie mutuje drzew zależności. Ponowne uruchomienia menedżera pakietów `update.run` omijają zwykłe odroczenie bezczynności i okres schłodzenia ponownego uruchomienia po podmianie drzewa pakietu, aby stary proces nie mógł nadal leniwie ładować usuniętych fragmentów.

Jeśli bootstrap pnpm nadal się nie powiedzie, aktualizator zatrzymuje się wcześnie z błędem specyficznym dla menedżera pakietów zamiast próbować `npm run build` w checkoutcie.
</Note>

## Skrót `--update`

`openclaw --update` jest przepisywane na `openclaw update` (przydatne dla powłok i skryptów uruchamiających).

## Powiązane

- `openclaw doctor` (proponuje najpierw uruchomienie aktualizacji w checkoutach git)
- [Kanały deweloperskie](/pl/install/development-channels)
- [Aktualizowanie](/pl/install/updating)
- [Dokumentacja CLI](/pl/cli)
