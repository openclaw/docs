---
read_when:
    - Chcesz bezpiecznie zaktualizować checkout źródłowy
    - Musisz zrozumieć zachowanie skrótu `--update`
summary: Dokumentacja CLI dla `openclaw update` (w miarę bezpieczna aktualizacja źródeł + automatyczny restart Gateway)
title: update
x-i18n:
    generated_at: "2026-04-05T13:49:52Z"
    model: gpt-5.4
    provider: openai
    source_hash: 12c8098654b644c3666981d379f6c018e84fde56a5420f295d78052f9001bdad
    source_path: cli/update.md
    workflow: 15
---

# `openclaw update`

Bezpiecznie aktualizuj OpenClaw i przełączaj się między kanałami stable/beta/dev.

Jeśli instalacja została wykonana przez **npm/pnpm/bun** (instalacja globalna, bez metadanych git),
aktualizacje odbywają się przez przepływ menedżera pakietów opisany w [Aktualizowanie](/install/updating).

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

- `--no-restart`: pomija restart usługi Gateway po pomyślnej aktualizacji.
- `--channel <stable|beta|dev>`: ustawia kanał aktualizacji (git + npm; zapisywany w konfiguracji).
- `--tag <dist-tag|version|spec>`: zastępuje docelowy pakiet tylko dla tej aktualizacji. W przypadku instalacji pakietowych `main` mapuje się na `github:openclaw/openclaw#main`.
- `--dry-run`: wyświetla podgląd planowanych działań aktualizacji (kanał/tag/cel/przepływ restartu) bez zapisywania konfiguracji, instalowania, synchronizowania pluginów ani restartowania.
- `--json`: wypisuje JSON `UpdateRunResult` w formacie czytelnym maszynowo.
- `--timeout <seconds>`: limit czasu dla każdego kroku (domyślnie 1200s).
- `--yes`: pomija pytania potwierdzające (na przykład potwierdzenie obniżenia wersji)

Uwaga: obniżenia wersji wymagają potwierdzenia, ponieważ starsze wersje mogą uszkodzić konfigurację.

## `update status`

Pokazuje aktywny kanał aktualizacji oraz tag/gałąź/SHA git (dla checkoutów źródłowych), a także dostępność aktualizacji.

```bash
openclaw update status
openclaw update status --json
openclaw update status --timeout 10
```

Opcje:

- `--json`: wypisuje JSON statusu w formacie czytelnym maszynowo.
- `--timeout <seconds>`: limit czasu dla sprawdzeń (domyślnie 3s).

## `update wizard`

Interaktywny przepływ wyboru kanału aktualizacji i potwierdzenia, czy po
aktualizacji zrestartować Gateway (domyślnie następuje restart). Jeśli wybierzesz `dev`
bez checkoutu git, pojawi się propozycja jego utworzenia.

Opcje:

- `--timeout <seconds>`: limit czasu dla każdego kroku aktualizacji (domyślnie `1200`)

## Co robi

Gdy jawnie przełączasz kanały (`--channel ...`), OpenClaw utrzymuje też
zgodność metody instalacji:

- `dev` → zapewnia checkout git (domyślnie: `~/openclaw`, zastąp przez `OPENCLAW_GIT_DIR`),
  aktualizuje go i instaluje globalne CLI z tego checkoutu.
- `stable` → instaluje z npm przy użyciu `latest`.
- `beta` → preferuje dist-tag npm `beta`, ale wraca do `latest`, gdy wersja beta
  nie istnieje lub jest starsza niż bieżące wydanie stable.

Automatyczny aktualizator rdzenia Gateway (gdy jest włączony w konfiguracji) używa tej samej ścieżki aktualizacji.

## Przepływ checkoutu git

Kanały:

- `stable`: checkout najnowszego tagu niebędącego beta, a następnie build + doctor.
- `beta`: preferuje najnowszy tag `-beta`, ale wraca do najnowszego tagu stable,
  gdy beta nie istnieje lub jest starsza.
- `dev`: checkout `main`, a następnie fetch + rebase.

Ogólnie:

1. Wymaga czystego worktree (bez niezacommitowanych zmian).
2. Przełącza na wybrany kanał (tag lub gałąź).
3. Pobiera upstream (tylko dev).
4. Tylko dev: uruchamia wstępne sprawdzenie lint + build TypeScript w tymczasowym worktree; jeśli tip nie przejdzie, cofa się maksymalnie o 10 commitów, aby znaleźć najnowszy poprawnie budujący się stan.
5. Wykonuje rebase na wybrany commit (tylko dev).
6. Instaluje zależności (preferowany `pnpm`; awaryjnie `npm`; `bun` pozostaje dostępny jako dodatkowa kompatybilna opcja awaryjna).
7. Buduje oraz buduje Control UI.
8. Uruchamia `openclaw doctor` jako końcową kontrolę „bezpiecznej aktualizacji”.
9. Synchronizuje pluginy z aktywnym kanałem (dev używa bundlowanych rozszerzeń; stable/beta używa npm) i aktualizuje pluginy zainstalowane przez npm.

## Skrót `--update`

`openclaw --update` jest przepisywane na `openclaw update` (przydatne dla powłok i skryptów uruchamiających).

## Zobacz także

- `openclaw doctor` (proponuje najpierw uruchomić aktualizację dla checkoutów git)
- [Kanały deweloperskie](/install/development-channels)
- [Aktualizowanie](/install/updating)
- [Dokumentacja CLI](/cli)
