---
read_when:
    - Chcesz bezpiecznie zaktualizować checkout źródłowy
    - Musisz zrozumieć skrócone działanie `--update`
summary: Dokumentacja CLI dla `openclaw update` (w miarę bezpieczna aktualizacja źródeł + automatyczne ponowne uruchamianie Gateway)
title: Aktualizacja
x-i18n:
    generated_at: "2026-04-24T09:04:42Z"
    model: gpt-5.4
    provider: openai
    source_hash: c7ab28ae6fe91c094826ccbd9fa11c5d7c41849cc95d570a634a0721b82f0e3a
    source_path: cli/update.md
    workflow: 15
---

# `openclaw update`

Bezpiecznie aktualizuj OpenClaw i przełączaj się między kanałami stable/beta/dev.

Jeśli zainstalowano przez **npm/pnpm/bun** (instalacja globalna, bez metadanych git),
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

- `--no-restart`: pomija ponowne uruchomienie usługi Gateway po udanej aktualizacji.
- `--channel <stable|beta|dev>`: ustawia kanał aktualizacji (git + npm; zapisywany w konfiguracji).
- `--tag <dist-tag|version|spec>`: nadpisuje docelowy pakiet tylko dla tej aktualizacji. W instalacjach pakietowych `main` mapuje się na `github:openclaw/openclaw#main`.
- `--dry-run`: pokazuje podgląd planowanych działań aktualizacji (kanał/tag/cel/przepływ restartu) bez zapisu konfiguracji, instalacji, synchronizacji Plugin ani restartu.
- `--json`: wypisuje czytelny dla maszyn JSON `UpdateRunResult`, w tym
  `postUpdate.plugins.integrityDrifts`, gdy podczas synchronizacji Plugin po aktualizacji
  zostanie wykryty dryf artefaktów npm Plugin.
- `--timeout <seconds>`: limit czasu dla każdego kroku (domyślnie 1200 s).
- `--yes`: pomija pytania o potwierdzenie (na przykład potwierdzenie obniżenia wersji)

Uwaga: obniżenia wersji wymagają potwierdzenia, ponieważ starsze wersje mogą uszkodzić konfigurację.

## `update status`

Pokazuje aktywny kanał aktualizacji oraz tag/gałąź/SHA git (dla checkoutów źródłowych), a także dostępność aktualizacji.

```bash
openclaw update status
openclaw update status --json
openclaw update status --timeout 10
```

Opcje:

- `--json`: wypisuje czytelny dla maszyn JSON statusu.
- `--timeout <seconds>`: limit czasu sprawdzania (domyślnie 3 s).

## `update wizard`

Interaktywny przepływ wyboru kanału aktualizacji i potwierdzenia, czy po aktualizacji
ponownie uruchomić Gateway (domyślnie następuje restart). Jeśli wybierzesz `dev` bez checkoutu git,
zostanie zaproponowane jego utworzenie.

Opcje:

- `--timeout <seconds>`: limit czasu dla każdego kroku aktualizacji (domyślnie `1200`)

## Co robi

Gdy jawnie przełączasz kanały (`--channel ...`), OpenClaw utrzymuje także
spójność metody instalacji:

- `dev` → zapewnia checkout git (domyślnie: `~/openclaw`, nadpisywane przez `OPENCLAW_GIT_DIR`),
  aktualizuje go i instaluje globalne CLI z tego checkoutu.
- `stable` → instaluje z npm przy użyciu `latest`.
- `beta` → preferuje dist-tag npm `beta`, ale wraca do `latest`, gdy beta
  nie istnieje lub jest starsza niż bieżące wydanie stable.

Automatyczny aktualizator rdzenia Gateway (gdy jest włączony w konfiguracji) używa tej samej ścieżki aktualizacji.

W przypadku instalacji przez menedżer pakietów `openclaw update` najpierw rozwiązuje docelową
wersję pakietu przed wywołaniem menedżera pakietów. Jeśli zainstalowana wersja dokładnie
odpowiada wersji docelowej i nie trzeba zapisywać żadnej zmiany kanału aktualizacji,
polecenie kończy się jako pominięte jeszcze przed instalacją pakietu, synchronizacją Plugin, odświeżeniem uzupełniania poleceń
lub restartem Gateway.

## Przepływ checkoutu git

Kanały:

- `stable`: checkout najnowszego tagu non-beta, następnie build + doctor.
- `beta`: preferuje najnowszy tag `-beta`, ale wraca do najnowszego tagu stable,
  gdy beta nie istnieje lub jest starsza.
- `dev`: checkout `main`, następnie fetch + rebase.

Ogólny przebieg:

1. Wymaga czystego worktree (brak niezacommitowanych zmian).
2. Przełącza na wybrany kanał (tag lub gałąź).
3. Pobiera upstream (tylko dev).
4. Tylko dev: uruchamia wstępny lint + build TypeScript w tymczasowym worktree; jeśli tip nie przejdzie, cofa się maksymalnie o 10 commitów, aby znaleźć najnowszą czystą kompilację.
5. Robi rebase na wybrany commit (tylko dev).
6. Instaluje zależności przy użyciu menedżera pakietów repozytorium. W checkoutach pnpm aktualizator bootstrapuje `pnpm` na żądanie (najpierw przez `corepack`, potem awaryjnie przez tymczasowe `npm install pnpm@10`) zamiast uruchamiać `npm run build` wewnątrz workspace pnpm.
7. Buduje oraz buduje Control UI.
8. Uruchamia `openclaw doctor` jako końcowe sprawdzenie „bezpiecznej aktualizacji”.
9. Synchronizuje Plugin z aktywnym kanałem (dev używa dołączonych Plugin; stable/beta używają npm) i aktualizuje Plugin zainstalowane przez npm.

Jeśli aktualizacja dokładnie przypiętego npm Plugin zostanie rozwiązana do artefaktu, którego integralność
różni się od zapisanego rekordu instalacji, `openclaw update` przerywa tę aktualizację artefaktu
Plugin zamiast ją instalować. Zainstaluj ponownie lub zaktualizuj Plugin jawnie dopiero po sprawdzeniu,
że ufasz nowemu artefaktowi.

Jeśli bootstrap pnpm nadal się nie powiedzie, aktualizator kończy działanie wcześniej z błędem
specyficznym dla menedżera pakietów zamiast próbować `npm run build` wewnątrz checkoutu.

## Skrót `--update`

`openclaw --update` jest przepisywane na `openclaw update` (przydatne dla powłok i skryptów uruchamiających).

## Powiązane

- `openclaw doctor` (proponuje najpierw uruchomić aktualizację w checkoutach git)
- [Kanały deweloperskie](/pl/install/development-channels)
- [Aktualizowanie](/pl/install/updating)
- [Dokumentacja CLI](/pl/cli)
