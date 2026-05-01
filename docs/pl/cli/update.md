---
read_when:
    - Chcesz bezpiecznie zaktualizować kopię roboczą kodu źródłowego
    - Musisz zrozumieć zachowanie skrótu `--update`
summary: Dokumentacja referencyjna CLI dla `openclaw update` (względnie bezpieczna aktualizacja źródła + automatyczne ponowne uruchomienie Gateway)
title: Aktualizacja
x-i18n:
    generated_at: "2026-05-01T09:57:45Z"
    model: gpt-5.5
    provider: openai
    source_hash: bfbbd6e3cd1a83e3700fa248a6ce2cb3adf1c94d0d5491895eea21bfec5d52b0
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

- `--no-restart`: pomija ponowne uruchomienie usługi Gateway po udanej aktualizacji. Aktualizacje przez menedżera pakietów, które ponownie uruchamiają Gateway, sprawdzają przed powodzeniem polecenia, czy ponownie uruchomiona usługa zgłasza oczekiwaną zaktualizowaną wersję.
- `--channel <stable|beta|dev>`: ustawia kanał aktualizacji (git + npm; utrwalany w konfiguracji).
- `--tag <dist-tag|version|spec>`: nadpisuje cel pakietu tylko dla tej aktualizacji. Dla instalacji pakietowych `main` mapuje się na `github:openclaw/openclaw#main`.
- `--dry-run`: pokazuje planowane działania aktualizacji (kanał/tag/cel/przepływ ponownego uruchomienia) bez zapisywania konfiguracji, instalowania, synchronizowania pluginów ani ponownego uruchamiania.
- `--json`: wypisuje czytelny maszynowo JSON `UpdateRunResult`, w tym
  `postUpdate.plugins.integrityDrifts`, gdy podczas synchronizacji pluginów po aktualizacji
  zostanie wykryty dryf artefaktu pluginu npm.
- `--timeout <seconds>`: limit czasu dla każdego kroku (domyślnie 1800 s).
- `--yes`: pomija monity o potwierdzenie (na przykład potwierdzenie obniżenia wersji).

<Warning>
Obniżenie wersji wymaga potwierdzenia, ponieważ starsze wersje mogą uszkodzić konfigurację.
</Warning>

## `update status`

Pokazuje aktywny kanał aktualizacji + tag/gałąź/SHA git (dla checkoutów źródłowych), a także dostępność aktualizacji.

```bash
openclaw update status
openclaw update status --json
openclaw update status --timeout 10
```

Opcje:

- `--json`: wypisuje czytelny maszynowo JSON statusu.
- `--timeout <seconds>`: limit czasu dla sprawdzeń (domyślnie 3 s).

## `update wizard`

Interaktywny przepływ wyboru kanału aktualizacji i potwierdzenia, czy po aktualizacji ponownie uruchomić Gateway
(domyślnie jest ponownie uruchamiany). Jeśli wybierzesz `dev` bez checkoutu git,
zaproponuje jego utworzenie.

Opcje:

- `--timeout <seconds>`: limit czasu dla każdego kroku aktualizacji (domyślnie `1800`)

## Co robi

Gdy jawnie przełączasz kanały (`--channel ...`), OpenClaw utrzymuje też zgodność
metody instalacji:

- `dev` → zapewnia checkout git (domyślnie: `~/openclaw`, nadpisanie przez `OPENCLAW_GIT_DIR`),
  aktualizuje go i instaluje globalny CLI z tego checkoutu.
- `stable` → instaluje z npm przy użyciu `latest`.
- `beta` → preferuje dist-tag npm `beta`, ale wraca do `latest`, gdy beta
  nie istnieje albo jest starsza niż bieżące wydanie stabilne.

Automatyczny aktualizator rdzenia Gateway (gdy jest włączony w konfiguracji) uruchamia ścieżkę aktualizacji CLI
poza aktywnym handlerem żądań Gateway. Aktualizacje menedżera pakietów `update.run`
z płaszczyzny sterowania wymuszają niezależne od odroczenia ponowne uruchomienie aktualizacji bez okresu schłodzenia po podmianie pakietu,
ponieważ stary proces Gateway może nadal mieć w pamięci fragmenty wskazujące na
pliki usunięte przez nowy pakiet.

Dla instalacji przez menedżera pakietów `openclaw update` rozwiązuje docelową
wersję pakietu przed wywołaniem menedżera pakietów. Globalne instalacje npm używają instalacji etapowej:
OpenClaw instaluje nowy pakiet w tymczasowym prefiksie npm, weryfikuje
tam spis spakowanego `dist`, a następnie podmienia to czyste drzewo pakietu do
rzeczywistego globalnego prefiksu. Jeśli weryfikacja się nie powiedzie, doctor po aktualizacji, synchronizacja pluginów i
praca restartu nie są uruchamiane z podejrzanego drzewa. Nawet gdy zainstalowana wersja
już odpowiada celowi, polecenie odświeża globalną instalację pakietu,
a następnie uruchamia synchronizację pluginów, odświeżenie uzupełnień poleceń rdzenia i pracę restartu. Dzięki temu
spakowane sidecary i rekordy pluginów należące do kanału pozostają zgodne z
zainstalowanym buildem OpenClaw, pozostawiając pełne przebudowy uzupełnień poleceń pluginów
jawnym uruchomieniom `openclaw completion --write-state`.

Gdy zainstalowana jest lokalna zarządzana usługa Gateway i włączony jest restart,
aktualizacje przez menedżera pakietów zatrzymują działającą usługę przed zastąpieniem drzewa pakietu,
a następnie odświeżają metadane usługi ze zaktualizowanej instalacji, ponownie uruchamiają
usługę i sprawdzają, czy ponownie uruchomiony Gateway zgłasza oczekiwaną wersję. Z
`--no-restart` zastąpienie pakietu nadal jest wykonywane, ale zarządzana usługa nie jest
zatrzymywana ani uruchamiana ponownie, więc działający Gateway może zachować stary kod, dopóki
nie uruchomisz go ponownie ręcznie.

## Przepływ checkoutu git

### Wybór kanału

- `stable`: checkout najnowszego tagu niebędącego beta, potem build i doctor.
- `beta`: preferuje najnowszy tag `-beta`, ale wraca do najnowszego tagu stabilnego, gdy beta nie istnieje lub jest starsza.
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
  <Step title="Build wstępny (tylko dev)">
    Uruchamia lint i build TypeScript w tymczasowym drzewie roboczym. Jeśli tip się nie powiedzie, cofa się maksymalnie o 10 commitów, aby znaleźć najnowszy czysty build.
  </Step>
  <Step title="Rebase">
    Wykonuje rebase na wybrany commit (tylko dev).
  </Step>
  <Step title="Zainstaluj zależności">
    Używa menedżera pakietów repozytorium. Dla checkoutów pnpm aktualizator bootstrapuje `pnpm` na żądanie (najpierw przez `corepack`, potem z tymczasowym fallbackiem `npm install pnpm@10`) zamiast uruchamiać `npm run build` wewnątrz workspace pnpm.
  </Step>
  <Step title="Zbuduj Control UI">
    Buduje gateway i Control UI.
  </Step>
  <Step title="Uruchom doctor">
    `openclaw doctor` działa jako końcowe sprawdzenie bezpiecznej aktualizacji.
  </Step>
  <Step title="Synchronizuj pluginy">
    Synchronizuje pluginy do aktywnego kanału. Dev używa dołączonych pluginów; stable i beta używają npm. Aktualizuje pluginy zainstalowane przez npm.
  </Step>
</Steps>

<Warning>
Jeśli dokładnie przypięta aktualizacja pluginu npm rozwiązuje się do artefaktu, którego integralność różni się od zapisanego rekordu instalacji, `openclaw update` przerywa tę aktualizację artefaktu pluginu zamiast ją instalować. Przeinstaluj lub zaktualizuj plugin jawnie dopiero po sprawdzeniu, że ufasz nowemu artefaktowi.
</Warning>

<Note>
Niepowodzenia synchronizacji pluginów po aktualizacji powodują niepowodzenie wyniku aktualizacji i zatrzymują dalszą pracę restartu. Napraw błąd instalacji lub aktualizacji pluginu, a następnie ponownie uruchom `openclaw update`.

Gdy zaktualizowany Gateway startuje, włączone zależności runtime dołączonych pluginów są przygotowywane etapowo przed aktywacją pluginów. Restarty `update.run` menedżera pakietów omijają normalne odroczenie bezczynności i okres schłodzenia restartu po podmianie drzewa pakietu, więc stary proces nie może nadal leniwie ładować usuniętych fragmentów. Restarty menedżera usług nadal opróżniają etapowe przygotowanie zależności runtime przed zamknięciem Gateway.

Jeśli bootstrap pnpm nadal się nie powiedzie, aktualizator zatrzyma się wcześniej z błędem specyficznym dla menedżera pakietów zamiast próbować `npm run build` wewnątrz checkoutu.
</Note>

## Skrót `--update`

`openclaw --update` przepisuje się na `openclaw update` (przydatne dla powłok i skryptów uruchamiających).

## Powiązane

- `openclaw doctor` (oferuje najpierw uruchomienie aktualizacji w checkoutach git)
- [Kanały rozwojowe](/pl/install/development-channels)
- [Aktualizowanie](/pl/install/updating)
- [Dokumentacja CLI](/pl/cli)
