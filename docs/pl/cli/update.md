---
read_when:
    - Chcesz bezpiecznie zaktualizować roboczą kopię źródeł
    - Należy zrozumieć zachowanie skrótu `--update`
summary: Referencja CLI dla `openclaw update` (względnie bezpieczna aktualizacja źródeł + automatyczny restart Gateway)
title: Aktualizacja
x-i18n:
    generated_at: "2026-04-30T09:45:52Z"
    model: gpt-5.5
    provider: openai
    source_hash: 9cd4be6be8f6ae7df501f8bce3d208dd507ae5a1539f9772101cd844dcd93976
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

- `--no-restart`: pomija ponowne uruchomienie usługi Gateway po pomyślnej aktualizacji. Aktualizacje przez menedżera pakietów, które ponownie uruchamiają Gateway, przed powodzeniem polecenia weryfikują, że ponownie uruchomiona usługa zgłasza oczekiwaną zaktualizowaną wersję.
- `--channel <stable|beta|dev>`: ustawia kanał aktualizacji (git + npm; zapisywany w konfiguracji).
- `--tag <dist-tag|version|spec>`: nadpisuje docelowy pakiet tylko dla tej aktualizacji. W przypadku instalacji pakietowych `main` mapuje się na `github:openclaw/openclaw#main`.
- `--dry-run`: wyświetla planowane działania aktualizacji (kanał/tag/cel/przepływ ponownego uruchomienia) bez zapisywania konfiguracji, instalowania, synchronizowania plugins ani ponownego uruchamiania.
- `--json`: wypisuje czytelny maszynowo JSON `UpdateRunResult`, w tym
  `postUpdate.plugins.integrityDrifts`, gdy podczas synchronizacji plugins po aktualizacji
  wykryto dryf artefaktu npm plugin.
- `--timeout <seconds>`: limit czasu dla każdego kroku (domyślnie 1800s).
- `--yes`: pomija monity o potwierdzenie (na przykład potwierdzenie downgrade'u).

<Warning>
Downgrade'y wymagają potwierdzenia, ponieważ starsze wersje mogą uszkodzić konfigurację.
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
- `--timeout <seconds>`: limit czasu sprawdzania (domyślnie 3s).

## `update wizard`

Interaktywny przepływ wyboru kanału aktualizacji i potwierdzenia, czy ponownie uruchomić Gateway
po aktualizacji (domyślnie ponowne uruchomienie). Jeśli wybierzesz `dev` bez checkoutu git,
zaproponuje jego utworzenie.

Opcje:

- `--timeout <seconds>`: limit czasu dla każdego kroku aktualizacji (domyślnie `1800`)

## Co robi

Gdy jawnie przełączysz kanały (`--channel ...`), OpenClaw utrzymuje też zgodność
metody instalacji:

- `dev` → zapewnia checkout git (domyślnie: `~/openclaw`, nadpisz przez `OPENCLAW_GIT_DIR`),
  aktualizuje go i instaluje globalne CLI z tego checkoutu.
- `stable` → instaluje z npm przy użyciu `latest`.
- `beta` → preferuje dist-tag npm `beta`, ale wraca do `latest`, gdy beta jest
  niedostępna albo starsza niż bieżące wydanie stable.

Automatyczny aktualizator rdzenia Gateway (gdy jest włączony w konfiguracji) używa ponownie tej samej ścieżki aktualizacji.

W przypadku instalacji przez menedżera pakietów `openclaw update` rozwiązuje docelową wersję
pakietu przed wywołaniem menedżera pakietów. Globalne instalacje npm używają instalacji etapowanej:
OpenClaw instaluje nowy pakiet w tymczasowym prefiksie npm, weryfikuje tam spis zapakowanego `dist`,
a następnie podmienia to czyste drzewo pakietu do rzeczywistego globalnego prefiksu. Jeśli weryfikacja się nie powiedzie,
doctor po aktualizacji, synchronizacja plugin i ponowne uruchomienie nie są wykonywane z podejrzanego drzewa.
Nawet gdy zainstalowana wersja już odpowiada celowi, polecenie odświeża globalną instalację pakietu,
a następnie wykonuje synchronizację plugin, odświeżenie uzupełnień poleceń rdzenia i ponowne uruchomienie.
Utrzymuje to zapakowane sidecary oraz rekordy plugin należące do kanału w zgodzie z
zainstalowaną kompilacją OpenClaw, pozostawiając pełne przebudowy uzupełnień poleceń plugin
jawnym uruchomieniom `openclaw completion --write-state`.

Gdy zainstalowana jest lokalna zarządzana usługa Gateway i włączone jest ponowne uruchomienie,
aktualizacje przez menedżera pakietów zatrzymują działającą usługę przed zastąpieniem drzewa pakietu,
następnie odświeżają metadane usługi ze zaktualizowanej instalacji, ponownie uruchamiają usługę
i weryfikują, że ponownie uruchomiony Gateway zgłasza oczekiwaną wersję. Przy
`--no-restart` zastąpienie pakietu nadal jest wykonywane, ale zarządzana usługa nie jest
zatrzymywana ani ponownie uruchamiana, więc działający Gateway może zachować stary kod do czasu,
aż uruchomisz go ponownie ręcznie.

## Przepływ checkoutu git

### Wybór kanału

- `stable`: wykonuje checkout najnowszego tagu innego niż beta, następnie kompiluje i uruchamia doctor.
- `beta`: preferuje najnowszy tag `-beta`, ale wraca do najnowszego tagu stable, gdy beta jest niedostępna albo starsza.
- `dev`: wykonuje checkout `main`, a następnie fetch i rebase.

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
    Uruchamia lint i kompilację TypeScript w tymczasowym drzewie roboczym. Jeśli tip się nie powiedzie, cofa się maksymalnie o 10 commitów, aby znaleźć najnowszą czystą kompilację.
  </Step>
  <Step title="Rebase">
    Wykonuje rebase na wybrany commit (tylko dev).
  </Step>
  <Step title="Zainstaluj zależności">
    Używa menedżera pakietów repozytorium. W przypadku checkoutów pnpm aktualizator uruchamia `pnpm` na żądanie (najpierw przez `corepack`, a potem awaryjnie przez tymczasowe `npm install pnpm@10`) zamiast uruchamiać `npm run build` wewnątrz workspace pnpm.
  </Step>
  <Step title="Zbuduj Control UI">
    Buduje gateway i Control UI.
  </Step>
  <Step title="Uruchom doctor">
    `openclaw doctor` działa jako końcowa kontrola bezpiecznej aktualizacji.
  </Step>
  <Step title="Synchronizuj plugins">
    Synchronizuje plugins z aktywnym kanałem. Dev używa dołączonych plugins; stable i beta używają npm. Aktualizuje plugins zainstalowane przez npm.
  </Step>
</Steps>

<Warning>
Jeśli dokładnie przypięta aktualizacja npm plugin rozwiąże się do artefaktu, którego integralność różni się od zapisanego rekordu instalacji, `openclaw update` przerywa aktualizację tego artefaktu plugin zamiast go instalować. Zainstaluj ponownie albo zaktualizuj plugin jawnie dopiero po zweryfikowaniu, że ufasz nowemu artefaktowi.
</Warning>

<Note>
Niepowodzenia synchronizacji plugin po aktualizacji powodują niepowodzenie wyniku aktualizacji i zatrzymują dalsze ponowne uruchamianie. Napraw błąd instalacji albo aktualizacji plugin, a następnie ponownie uruchom `openclaw update`.

Gdy zaktualizowany Gateway startuje, włączone zależności runtime dołączonych plugin są przygotowywane przed aktywacją plugin. Ponowne uruchomienia wywołane aktualizacją opróżniają aktywne przygotowywanie zależności runtime przed zamknięciem Gateway, więc ponowne uruchomienia menedżera usług nie przerywają trwającej instalacji npm.

Jeśli bootstrap pnpm nadal się nie powiedzie, aktualizator zatrzymuje się wcześnie z błędem właściwym dla menedżera pakietów zamiast próbować `npm run build` wewnątrz checkoutu.
</Note>

## Skrót `--update`

`openclaw --update` jest przepisywane na `openclaw update` (przydatne dla powłok i skryptów uruchamiających).

## Powiązane

- `openclaw doctor` (proponuje najpierw uruchomienie aktualizacji w checkoutach git)
- [Kanały deweloperskie](/pl/install/development-channels)
- [Aktualizowanie](/pl/install/updating)
- [Dokumentacja CLI](/pl/cli)
