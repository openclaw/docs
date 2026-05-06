---
read_when:
    - Chcesz bezpiecznie zaktualizować kopię roboczą źródeł
    - Debugujesz dane wyjściowe lub opcje `openclaw update`
    - Musisz zrozumieć zachowanie skróconej notacji `--update`
summary: Dokumentacja referencyjna CLI dla `openclaw update` (w miarę bezpieczna aktualizacja źródła + automatyczny restart Gateway)
title: Aktualizacja
x-i18n:
    generated_at: "2026-05-06T09:06:57Z"
    model: gpt-5.5
    provider: openai
    source_hash: 92eff9aeaecd4bf4eaa98fa511a3b9ebaedaf5872ff9407398665f2a8c2ab7d9
    source_path: cli/update.md
    workflow: 16
---

# `openclaw update`

Bezpiecznie aktualizuj OpenClaw i przełączaj się między kanałami stable/beta/dev.

Jeśli zainstalowano za pomocą **npm/pnpm/bun** (instalacja globalna, bez metadanych git),
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

- `--no-restart`: pomiń ponowne uruchomienie usługi Gateway po udanej aktualizacji. Aktualizacje przez menedżera pakietów, które ponownie uruchamiają Gateway, sprawdzają przed pomyślnym zakończeniem polecenia, czy ponownie uruchomiona usługa zgłasza oczekiwaną zaktualizowaną wersję.
- `--channel <stable|beta|dev>`: ustaw kanał aktualizacji (git + npm; zapisywany w konfiguracji).
- `--tag <dist-tag|version|spec>`: nadpisz docelowy pakiet tylko dla tej aktualizacji. W przypadku instalacji pakietowych `main` mapuje się na `github:openclaw/openclaw#main`.
- `--dry-run`: wyświetl podgląd planowanych działań aktualizacji (kanał/tag/cel/przepływ ponownego uruchomienia) bez zapisywania konfiguracji, instalowania, synchronizowania pluginów ani ponownego uruchamiania.
- `--json`: wypisz czytelny maszynowo JSON `UpdateRunResult`, w tym
  `postUpdate.plugins.warnings`, gdy uszkodzone lub nienadające się do załadowania zarządzane pluginy wymagają
  naprawy po udanej aktualizacji rdzenia, oraz `postUpdate.plugins.integrityDrifts`,
  gdy podczas poaktualizacyjnej synchronizacji pluginów zostanie wykryta rozbieżność artefaktu pluginu npm.
- `--timeout <seconds>`: limit czasu dla każdego kroku (domyślnie 1800s).
- `--yes`: pomiń monity o potwierdzenie (na przykład potwierdzenie obniżenia wersji).

`openclaw update` nie ma flagi `--verbose`. Użyj `--dry-run`, aby podejrzeć
planowane działania dotyczące kanału/tagu/instalacji/ponownego uruchomienia, `--json` dla czytelnych maszynowo
wyników oraz `openclaw update status --json`, gdy potrzebujesz tylko szczegółów kanału i
dostępności. Jeśli debugujesz logi Gateway w okolicy aktualizacji,
szczegółowość konsoli i poziom logów w pliku są oddzielne: `--verbose` Gateway wpływa na
wyjście terminala/WebSocket, natomiast logi plikowe wymagają `logging.level: "debug"` lub
`"trace"` w konfiguracji. Zobacz [Logowanie Gateway](/pl/gateway/logging).

<Warning>
Obniżenie wersji wymaga potwierdzenia, ponieważ starsze wersje mogą uszkodzić konfigurację.
</Warning>

## `update status`

Pokaż aktywny kanał aktualizacji oraz tag/gałąź/SHA git (dla checkoutów źródłowych), a także dostępność aktualizacji.

```bash
openclaw update status
openclaw update status --json
openclaw update status --timeout 10
```

Opcje:

- `--json`: wypisz czytelny maszynowo JSON statusu.
- `--timeout <seconds>`: limit czasu dla sprawdzeń (domyślnie 3s).

## `update wizard`

Interaktywny przepływ wyboru kanału aktualizacji i potwierdzenia, czy po aktualizacji ponownie uruchomić Gateway
(domyślnie ponowne uruchomienie). Jeśli wybierzesz `dev` bez checkoutu git,
zaproponuje jego utworzenie.

Opcje:

- `--timeout <seconds>`: limit czasu dla każdego kroku aktualizacji (domyślnie `1800`)

## Co robi

Gdy jawnie przełączasz kanały (`--channel ...`), OpenClaw utrzymuje też zgodność
metody instalacji:

- `dev` → zapewnia checkout git (domyślnie: `~/openclaw`, nadpisanie przez `OPENCLAW_GIT_DIR`),
  aktualizuje go i instaluje globalne CLI z tego checkoutu.
- `stable` → instaluje z npm przy użyciu `latest`.
- `beta` → preferuje npm dist-tag `beta`, ale wraca do `latest`, gdy wersji beta
  brakuje albo jest starsza niż bieżące stabilne wydanie.

Automatyczny aktualizator rdzenia Gateway (gdy jest włączony w konfiguracji) uruchamia ścieżkę aktualizacji CLI
poza aktywnym handlerem żądania Gateway. Aktualizacje menedżera pakietów `update.run` z warstwy sterowania
wymuszają nieodroczone ponowne uruchomienie po aktualizacji, bez okresu wyciszenia, po podmianie pakietu,
ponieważ stary proces Gateway może nadal mieć w pamięci fragmenty wskazujące na
pliki usunięte przez nowy pakiet.

W przypadku instalacji przez menedżera pakietów `openclaw update` rozwiązuje docelową
wersję pakietu przed wywołaniem menedżera pakietów. Globalne instalacje npm używają instalacji etapowej:
OpenClaw instaluje nowy pakiet w tymczasowym prefiksie npm, weryfikuje tam
spis zapakowanego `dist`, a następnie podmienia ten czysty katalog pakietu do
rzeczywistego globalnego prefiksu. Jeśli weryfikacja się nie powiedzie, poaktualizacyjny doctor, synchronizacja pluginów i
ponowne uruchomienie nie są wykonywane z podejrzanego katalogu. Nawet gdy zainstalowana wersja
już odpowiada celowi, polecenie odświeża globalną instalację pakietu,
a następnie uruchamia synchronizację pluginów, odświeżenie uzupełniania poleceń rdzenia i ponowne uruchomienie. Dzięki temu
zapakowane procesy pomocnicze oraz rekordy pluginów należące do kanału pozostają zgodne z
zainstalowaną kompilacją OpenClaw, a pełne przebudowy uzupełniania poleceń pluginów pozostają dla
jawnych uruchomień `openclaw completion --write-state`.

Gdy lokalna zarządzana usługa Gateway jest zainstalowana, a ponowne uruchomienie jest włączone,
aktualizacje przez menedżera pakietów zatrzymują działającą usługę przed zastąpieniem katalogu pakietu,
następnie odświeżają metadane usługi ze zaktualizowanej instalacji, ponownie uruchamiają
usługę i sprawdzają, czy ponownie uruchomiony Gateway zgłasza oczekiwaną wersję przed
zgłoszeniem sukcesu. W systemie macOS poaktualizacyjne sprawdzenie weryfikuje też, czy LaunchAgent
jest załadowany/działa dla aktywnego profilu i czy skonfigurowany port loopback jest
zdrowy. Jeśli plist jest zainstalowany, ale launchd go nie nadzoruje, OpenClaw
automatycznie ponownie bootstrapuje LaunchAgent, a następnie ponownie uruchamia
sprawdzenia gotowości zdrowia/wersji/kanału. Świeży bootstrap ładuje zadanie RunAtLoad
bezpośrednio, więc odzyskiwanie po aktualizacji nie wykonuje natychmiast `kickstart -k` na nowo
uruchomionym Gateway. Jeśli Gateway nadal nie stanie się zdrowy, polecenie kończy się
kodem niezerowym i wypisuje ścieżkę logu ponownego uruchomienia oraz jawne instrukcje ponownego uruchomienia, ponownej instalacji i
wycofania pakietu. Przy `--no-restart`,
zastąpienie pakietu nadal jest wykonywane, ale zarządzana usługa nie jest zatrzymywana ani
ponownie uruchamiana, więc działający Gateway może zachować stary kod do czasu ręcznego
ponownego uruchomienia.

## Przepływ checkoutu git

### Wybór kanału

- `stable`: checkout najnowszego tagu niebędącego beta, następnie build i doctor.
- `beta`: preferuj najnowszy tag `-beta`, ale wróć do najnowszego stabilnego tagu, gdy wersji beta brakuje albo jest starsza.
- `dev`: checkout `main`, następnie fetch i rebase.

### Kroki aktualizacji

<Steps>
  <Step title="Zweryfikuj czysty worktree">
    Wymaga braku niezatwierdzonych zmian.
  </Step>
  <Step title="Przełącz kanał">
    Przełącza na wybrany kanał (tag lub gałąź).
  </Step>
  <Step title="Pobierz upstream">
    Tylko dev.
  </Step>
  <Step title="Preflight build (tylko dev)">
    Uruchamia build TypeScript w tymczasowym worktree. Jeśli czubek się nie powiedzie, cofa się do maksymalnie 10 commitów, aby znaleźć najnowszy commit, który da się zbudować. Ustaw `OPENCLAW_UPDATE_PREFLIGHT_LINT=1`, aby w ramach tego preflight uruchomić też lint; lint działa w ograniczonym trybie szeregowym, ponieważ hosty aktualizacji użytkowników są często mniejsze niż runnery CI.
  </Step>
  <Step title="Rebase">
    Wykonuje rebase na wybrany commit (tylko dev).
  </Step>
  <Step title="Zainstaluj zależności">
    Używa menedżera pakietów repo. W przypadku checkoutów pnpm aktualizator bootstrapuje `pnpm` na żądanie (najpierw przez `corepack`, potem przez tymczasowy fallback `npm install pnpm@10`) zamiast uruchamiać `npm run build` wewnątrz workspace pnpm.
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
domyślną/najnowszą linią, najpierw próbują wydania pluginu `@beta`. Jeśli plugin nie ma
wydania beta, OpenClaw wraca do zapisanej domyślnej/najnowszej specyfikacji. W przypadku pluginów npm
OpenClaw wraca też wtedy, gdy pakiet beta istnieje, ale nie przechodzi
walidacji instalacji. Dokładne wersje i jawne tagi nie są przepisywane.

<Warning>
Jeśli aktualizacja dokładnie przypiętego pluginu npm rozwiązuje się do artefaktu, którego integralność różni się od zapisanego rekordu instalacji, `openclaw update` przerywa aktualizację tego artefaktu pluginu zamiast go instalować. Ponownie zainstaluj lub jawnie zaktualizuj plugin dopiero po zweryfikowaniu, że ufasz nowemu artefaktowi.
</Warning>

<Note>
Poaktualizacyjne błędy synchronizacji pluginów ograniczone do zarządzanego pluginu są zgłaszane jako ostrzeżenia po udanej aktualizacji rdzenia. Wynik JSON zachowuje najwyższy poziom aktualizacji `status: "ok"` i zgłasza `postUpdate.plugins.status: "warning"` ze wskazówkami `openclaw doctor --fix` oraz `openclaw plugins inspect <id> --runtime --json`. Nieoczekiwane wyjątki aktualizatora lub synchronizacji nadal powodują niepowodzenie wyniku aktualizacji. Napraw błąd instalacji lub aktualizacji pluginu, a następnie ponownie uruchom `openclaw doctor --fix` albo `openclaw update`.

Gdy zaktualizowany Gateway startuje, ładowanie pluginów jest tylko weryfikacyjne: start nie uruchamia menedżerów pakietów ani nie modyfikuje drzew zależności. Ponowne uruchomienia menedżera pakietów `update.run` omijają normalne odroczenie bezczynności i okres wyciszenia ponownego uruchomienia po podmianie katalogu pakietu, więc stary proces nie może dalej leniwie ładować usuniętych fragmentów.

Jeśli bootstrap pnpm nadal się nie powiedzie, aktualizator zatrzymuje się wcześnie z błędem specyficznym dla menedżera pakietów zamiast próbować `npm run build` wewnątrz checkoutu.
</Note>

## Skrót `--update`

`openclaw --update` przepisuje się na `openclaw update` (przydatne dla powłok i skryptów uruchamiających).

## Powiązane

- `openclaw doctor` (proponuje najpierw uruchomić aktualizację w checkoutach git)
- [Kanały deweloperskie](/pl/install/development-channels)
- [Aktualizowanie](/pl/install/updating)
- [Dokumentacja CLI](/pl/cli)
