---
read_when:
    - Chcesz bezpiecznie zaktualizować kopię roboczą źródeł
    - Debugujesz dane wyjściowe lub opcje `openclaw update`
    - Musisz zrozumieć zachowanie skrótu `--update`
summary: Dokumentacja referencyjna CLI dla `openclaw update` (względnie bezpieczna aktualizacja źródła + automatyczne ponowne uruchomienie Gateway)
title: Aktualizuj
x-i18n:
    generated_at: "2026-05-07T01:52:08Z"
    model: gpt-5.5
    provider: openai
    source_hash: 33c1474c6525257b79e947dfa4ce750cadd4e2e440775f5fa3058dcea1a17809
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

- `--no-restart`: pomija ponowne uruchomienie usługi Gateway po pomyślnej aktualizacji. Aktualizacje przez menedżera pakietów, które ponownie uruchamiają Gateway, weryfikują przed powodzeniem polecenia, że ponownie uruchomiona usługa zgłasza oczekiwaną zaktualizowaną wersję.
- `--channel <stable|beta|dev>`: ustawia kanał aktualizacji (git + npm; utrwalany w konfiguracji).
- `--tag <dist-tag|version|spec>`: nadpisuje docelowy pakiet tylko dla tej aktualizacji. Dla instalacji pakietowych `main` mapuje się na `github:openclaw/openclaw#main`.
- `--dry-run`: podgląda planowane działania aktualizacji (kanał/tag/cel/przepływ ponownego uruchomienia) bez zapisywania konfiguracji, instalowania, synchronizowania plugins ani ponownego uruchamiania.
- `--json`: wypisuje czytelny maszynowo JSON `UpdateRunResult`, w tym
  `postUpdate.plugins.warnings`, gdy uszkodzone lub nienadające się do załadowania zarządzane plugins wymagają
  naprawy po pomyślnej aktualizacji rdzenia, oraz `postUpdate.plugins.integrityDrifts`,
  gdy podczas synchronizacji plugins po aktualizacji zostanie wykryty dryf artefaktów npm Plugin.
- `--timeout <seconds>`: limit czasu na krok (domyślnie 1800 s).
- `--yes`: pomija prośby o potwierdzenie (na przykład potwierdzenie obniżenia wersji).

`openclaw update` nie ma flagi `--verbose`. Użyj `--dry-run`, aby podejrzeć
planowane działania kanału/tagu/instalacji/ponownego uruchomienia, `--json` dla czytelnych maszynowo
wyników oraz `openclaw update status --json`, gdy potrzebujesz tylko szczegółów kanału i
dostępności. Jeśli debugujesz logi Gateway wokół aktualizacji,
szczegółowość konsoli i poziom logów pliku są oddzielne: `--verbose` Gateway wpływa na
wyjście terminala/WebSocket, natomiast logi pliku wymagają w konfiguracji `logging.level: "debug"` lub
`"trace"`. Zobacz [rejestrowanie Gateway](/pl/gateway/logging).

<Note>
W trybie Nix (`OPENCLAW_NIX_MODE=1`) modyfikujące uruchomienia `openclaw update` są wyłączone. Zamiast tego zaktualizuj źródło Nix lub wejście flake dla tej instalacji; dla nix-openclaw użyj ukierunkowanego na agenta [Szybkiego startu](https://github.com/openclaw/nix-openclaw#quick-start). `openclaw update status` i `openclaw update --dry-run` pozostają tylko do odczytu.
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
po aktualizacji (domyślnie ponownie uruchamia). Jeśli wybierzesz `dev` bez checkoutu git,
zaproponuje jego utworzenie.

Opcje:

- `--timeout <seconds>`: limit czasu dla każdego kroku aktualizacji (domyślnie `1800`)

## Co robi

Gdy jawnie przełączasz kanały (`--channel ...`), OpenClaw utrzymuje także
zgodność metody instalacji:

- `dev` → zapewnia checkout git (domyślnie: `~/openclaw`, nadpisanie przez `OPENCLAW_GIT_DIR`),
  aktualizuje go i instaluje globalne CLI z tego checkoutu.
- `stable` → instaluje z npm przy użyciu `latest`.
- `beta` → preferuje npm dist-tag `beta`, ale wraca do `latest`, gdy beta
  nie istnieje albo jest starsza niż bieżące wydanie stable.

OpenClaw nie ma jeszcze kanału LTS ani miesięcznego kanału wsparcia. Pracujemy
nad miesięcznymi liniami wsparcia, ale `--channel` obecnie akceptuje tylko
`stable`, `beta` i `dev`. Użyj `--tag <version-or-dist-tag>` jako jednorazowego
celu, gdy potrzebujesz konkretnego artefaktu pakietu.

Automatyczny aktualizator rdzenia Gateway (gdy jest włączony w konfiguracji) uruchamia ścieżkę aktualizacji CLI
poza aktywną obsługą żądań Gateway. Aktualizacje przez menedżera pakietów
`update.run` w płaszczyźnie sterowania wymuszają nieodroczone ponowne uruchomienie aktualizacyjne bez okresu wyciszenia po podmianie pakietu,
ponieważ stary proces Gateway może nadal mieć w pamięci fragmenty wskazujące na
pliki usunięte przez nowy pakiet.

Dla instalacji przez menedżera pakietów `openclaw update` rozwiązuje docelową wersję
pakietu przed wywołaniem menedżera pakietów. Globalne instalacje npm używają instalacji etapowej:
OpenClaw instaluje nowy pakiet w tymczasowym prefiksie npm, weryfikuje
spakowany inwentarz `dist`, a następnie podmienia to czyste drzewo pakietu do
rzeczywistego globalnego prefiksu. Jeśli weryfikacja się nie powiedzie, doctor po aktualizacji, synchronizacja Plugin i
ponowne uruchomienie nie są wykonywane z podejrzanego drzewa. Nawet gdy zainstalowana wersja
już odpowiada celowi, polecenie odświeża globalną instalację pakietu,
a następnie uruchamia synchronizację Plugin, odświeżenie uzupełnień poleceń rdzenia i ponowne uruchomienie. Dzięki temu
spakowane procesy pomocnicze i rekordy Plugin zależne od kanału pozostają zgodne z
zainstalowaną kompilacją OpenClaw, pozostawiając pełne przebudowy uzupełnień poleceń Plugin
jawnym uruchomieniom `openclaw completion --write-state`.

Gdy lokalna zarządzana usługa Gateway jest zainstalowana, a ponowne uruchomienie jest włączone,
aktualizacje przez menedżera pakietów zatrzymują działającą usługę przed zastąpieniem drzewa
pakietu, następnie odświeżają metadane usługi ze zaktualizowanej instalacji, ponownie uruchamiają
usługę i weryfikują, że ponownie uruchomiony Gateway zgłasza oczekiwaną wersję przed
zgłoszeniem powodzenia. Na macOS sprawdzenie po aktualizacji weryfikuje także, że LaunchAgent
jest załadowany/działa dla aktywnego profilu, a skonfigurowany port loopback
jest zdrowy. Jeśli plist jest zainstalowany, ale launchd go nie nadzoruje, OpenClaw
automatycznie ponownie bootstrappuje LaunchAgent, a następnie ponownie uruchamia
sprawdzenia gotowości zdrowia/wersji/kanału. Świeży bootstrap ładuje zadanie RunAtLoad
bezpośrednio, więc odzyskiwanie aktualizacji nie wykonuje natychmiast `kickstart -k` dla nowo
uruchomionego Gateway. Jeśli Gateway nadal nie stanie się zdrowy, polecenie kończy się
kodem niezerowym i wypisuje ścieżkę logu ponownego uruchomienia oraz jawne instrukcje ponownego uruchomienia, reinstalacji i
wycofania pakietu. Z `--no-restart`
zastąpienie pakietu nadal jest wykonywane, ale zarządzana usługa nie jest zatrzymywana ani
ponownie uruchamiana, więc działający Gateway może zachować stary kod, dopóki nie uruchomisz go ponownie
ręcznie.

## Przepływ checkoutu git

### Wybór kanału

- `stable`: checkout najnowszego tagu niebędącego beta, następnie kompilacja i doctor.
- `beta`: preferuje najnowszy tag `-beta`, ale wraca do najnowszego tagu stable, gdy beta nie istnieje albo jest starsza.
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
  <Step title="Kompilacja wstępna (tylko dev)">
    Uruchamia kompilację TypeScript w tymczasowym drzewie roboczym. Jeśli tip się nie skompiluje, cofa się do 10 commitów, aby znaleźć najnowszy kompilowalny commit. Ustaw `OPENCLAW_UPDATE_PREFLIGHT_LINT=1`, aby podczas tej kontroli wstępnej uruchomić także lint; lint działa w ograniczonym trybie szeregowym, ponieważ hosty aktualizacji użytkowników są często mniejsze niż runnery CI.
  </Step>
  <Step title="Rebase">
    Wykonuje rebase na wybrany commit (tylko dev).
  </Step>
  <Step title="Zainstaluj zależności">
    Używa menedżera pakietów repozytorium. Dla checkoutów pnpm aktualizator bootstrappuje `pnpm` na żądanie (najpierw przez `corepack`, a następnie przez tymczasowy fallback `npm install pnpm@10`) zamiast uruchamiać `npm run build` wewnątrz workspace pnpm.
  </Step>
  <Step title="Zbuduj interfejs Control UI">
    Buduje Gateway i interfejs Control UI.
  </Step>
  <Step title="Uruchom doctor">
    `openclaw doctor` działa jako końcowe sprawdzenie bezpiecznej aktualizacji.
  </Step>
  <Step title="Synchronizuj plugins">
    Synchronizuje plugins z aktywnym kanałem. Dev używa dołączonych plugins; stable i beta używają npm. Aktualizuje śledzone instalacje Plugin.
  </Step>
</Steps>

Na kanale aktualizacji beta śledzone instalacje npm i ClawHub Plugin, które podążają za
domyślną/najnowszą linią, najpierw próbują wydania Plugin `@beta`. Jeśli Plugin nie ma
wydania beta, OpenClaw wraca do zapisanej specyfikacji domyślnej/najnowszej. Dla npm
plugins OpenClaw wraca także wtedy, gdy pakiet beta istnieje, ale nie przechodzi walidacji
instalacji. Dokładne wersje i jawne tagi nie są przepisywane.

<Warning>
Jeśli dokładnie przypięta aktualizacja npm Plugin rozwiązuje się do artefaktu, którego integralność różni się od przechowywanego rekordu instalacji, `openclaw update` przerywa tę aktualizację artefaktu Plugin zamiast go instalować. Zainstaluj ponownie albo zaktualizuj Plugin jawnie dopiero po zweryfikowaniu, że ufasz nowemu artefaktowi.
</Warning>

<Note>
Błędy synchronizacji Plugin po aktualizacji, które są ograniczone do zarządzanego Plugin, są zgłaszane jako ostrzeżenia po pomyślnej aktualizacji rdzenia. Wynik JSON zachowuje najwyższy poziom aktualizacji `status: "ok"` i zgłasza `postUpdate.plugins.status: "warning"` z zaleceniami `openclaw doctor --fix` oraz `openclaw plugins inspect <id> --runtime --json`. Nieoczekiwane wyjątki aktualizatora lub synchronizacji nadal powodują niepowodzenie wyniku aktualizacji. Napraw błąd instalacji lub aktualizacji Plugin, a następnie ponownie uruchom `openclaw doctor --fix` albo `openclaw update`.

Gdy zaktualizowany Gateway startuje, ładowanie Plugin jest wyłącznie weryfikacyjne: startup nie uruchamia menedżerów pakietów ani nie modyfikuje drzew zależności. Ponowne uruchomienia `update.run` przez menedżera pakietów omijają normalne odroczenie bezczynności i okres wyciszenia restartu po podmianie drzewa pakietu, więc stary proces nie może dalej leniwie ładować usuniętych fragmentów.

Jeśli bootstrap pnpm nadal się nie powiedzie, aktualizator zatrzymuje się wcześnie z błędem specyficznym dla menedżera pakietów zamiast próbować `npm run build` wewnątrz checkoutu.
</Note>

## Skrót `--update`

`openclaw --update` przepisuje się na `openclaw update` (przydatne dla powłok i skryptów uruchamiających).

## Powiązane

- `openclaw doctor` (proponuje najpierw uruchomienie aktualizacji w checkoutach git)
- [Kanały rozwojowe](/pl/install/development-channels)
- [Aktualizacja](/pl/install/updating)
- [Dokumentacja CLI](/pl/cli)
