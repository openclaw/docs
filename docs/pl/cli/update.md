---
read_when:
    - Chcesz bezpiecznie zaktualizować kopię roboczą źródeł
    - Musisz zrozumieć zachowanie skrótu `--update`
summary: Dokumentacja referencyjna CLI dla `openclaw update` (względnie bezpieczna aktualizacja źródła + automatyczne ponowne uruchomienie Gateway)
title: Aktualizacja
x-i18n:
    generated_at: "2026-05-02T09:47:06Z"
    model: gpt-5.5
    provider: openai
    source_hash: cc88dc7963f1ae7d847a573924e9af7ede207f2f20028a18808116de4912d24e
    source_path: cli/update.md
    workflow: 16
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

- `--no-restart`: pomija ponowne uruchomienie usługi Gateway po udanej aktualizacji. Aktualizacje menedżera pakietów, które uruchamiają Gateway ponownie, sprawdzają przed powodzeniem polecenia, czy ponownie uruchomiona usługa zgłasza oczekiwaną zaktualizowaną wersję.
- `--channel <stable|beta|dev>`: ustawia kanał aktualizacji (git + npm; zapisywany w konfiguracji).
- `--tag <dist-tag|version|spec>`: zastępuje docelowy pakiet tylko dla tej aktualizacji. W przypadku instalacji pakietowych `main` mapuje się na `github:openclaw/openclaw#main`.
- `--dry-run`: wyświetla podgląd planowanych działań aktualizacji (kanał/tag/cel/przepływ restartu) bez zapisywania konfiguracji, instalowania, synchronizowania Plugin ani ponownego uruchamiania.
- `--json`: wypisuje czytelny maszynowo JSON `UpdateRunResult`, w tym
  `postUpdate.plugins.integrityDrifts`, gdy podczas synchronizacji Plugin po aktualizacji
  zostanie wykryta rozbieżność artefaktu Plugin npm.
- `--timeout <seconds>`: limit czasu na krok (domyślnie 1800 s).
- `--yes`: pomija monity o potwierdzenie (na przykład potwierdzenie obniżenia wersji).

<Warning>
Obniżenie wersji wymaga potwierdzenia, ponieważ starsze wersje mogą uszkodzić konfigurację.
</Warning>

## `update status`

Pokazuje aktywny kanał aktualizacji oraz tag/gałąź/SHA git (dla checkoutów źródłowych), a także dostępność aktualizacji.

```bash
openclaw update status
openclaw update status --json
openclaw update status --timeout 10
```

Opcje:

- `--json`: wypisuje czytelny maszynowo JSON statusu.
- `--timeout <seconds>`: limit czasu na sprawdzanie (domyślnie 3 s).

## `update wizard`

Interaktywny przepływ wyboru kanału aktualizacji i potwierdzenia, czy po aktualizacji ponownie uruchomić Gateway
(domyślnie restart jest wykonywany). Jeśli wybierzesz `dev` bez checkoutu git,
zaoferuje jego utworzenie.

Opcje:

- `--timeout <seconds>`: limit czasu dla każdego kroku aktualizacji (domyślnie `1800`)

## Co robi

Gdy jawnie przełączasz kanały (`--channel ...`), OpenClaw utrzymuje także zgodność
metody instalacji:

- `dev` → zapewnia checkout git (domyślnie: `~/openclaw`, nadpisywane przez `OPENCLAW_GIT_DIR`),
  aktualizuje go i instaluje globalne CLI z tego checkoutu.
- `stable` → instaluje z npm przy użyciu `latest`.
- `beta` → preferuje npm dist-tag `beta`, ale wraca do `latest`, gdy beta
  jest niedostępna lub starsza niż bieżące wydanie stable.

Automatyczny aktualizator rdzenia Gateway (gdy jest włączony w konfiguracji) uruchamia ścieżkę aktualizacji CLI
poza aktywnym handlerem żądań Gateway. Aktualizacje menedżera pakietów w płaszczyźnie sterowania `update.run`
wymuszają nieodroczony restart aktualizacyjny bez czasu wyciszenia po podmianie pakietu,
ponieważ stary proces Gateway może nadal mieć w pamięci fragmenty wskazujące
pliki usunięte przez nowy pakiet.

W przypadku instalacji menedżera pakietów `openclaw update` rozwiązuje docelową wersję
pakietu przed wywołaniem menedżera pakietów. Globalne instalacje npm używają instalacji etapowej:
OpenClaw instaluje nowy pakiet w tymczasowym prefiksie npm, sprawdza
spakowany inwentarz `dist`, a następnie podmienia czyste drzewo pakietu w
rzeczywistym globalnym prefiksie. Jeśli weryfikacja się nie powiedzie, doctor po aktualizacji, synchronizacja Plugin i
restart nie są uruchamiane z podejrzanego drzewa. Nawet gdy zainstalowana wersja
już odpowiada celowi, polecenie odświeża globalną instalację pakietu,
a następnie uruchamia synchronizację Plugin, odświeżenie uzupełnień poleceń rdzenia i restart.
Utrzymuje to spakowane procesy pomocnicze i rekordy Plugin należące do kanału w zgodzie z
zainstalowaną kompilacją OpenClaw, pozostawiając pełne przebudowy uzupełnień poleceń Plugin
jawnie uruchamianym poleceniom `openclaw completion --write-state`.

Gdy zainstalowana jest lokalna zarządzana usługa Gateway i restart jest włączony,
aktualizacje menedżera pakietów zatrzymują uruchomioną usługę przed zastąpieniem drzewa pakietu,
następnie odświeżają metadane usługi ze zaktualizowanej instalacji, ponownie uruchamiają
usługę i sprawdzają, czy ponownie uruchomiony Gateway zgłasza oczekiwaną wersję. Z
`--no-restart` zastępowanie pakietu nadal jest wykonywane, ale zarządzana usługa nie jest
zatrzymywana ani ponownie uruchamiana, więc działający Gateway może zachować stary kod, dopóki
nie uruchomisz go ponownie ręcznie.

## Przepływ checkoutu git

### Wybór kanału

- `stable`: przełącza na najnowszy tag inny niż beta, następnie buduje i uruchamia doctor.
- `beta`: preferuje najnowszy tag `-beta`, ale wraca do najnowszego tagu stable, gdy beta jest niedostępna lub starsza.
- `dev`: przełącza na `main`, następnie pobiera zmiany i wykonuje rebase.

### Kroki aktualizacji

<Steps>
  <Step title="Sprawdź czyste drzewo robocze">
    Wymaga braku niezatwierdzonych zmian.
  </Step>
  <Step title="Przełącz kanał">
    Przełącza na wybrany kanał (tag lub gałąź).
  </Step>
  <Step title="Pobierz upstream">
    Tylko dev.
  </Step>
  <Step title="Przedstartowa kompilacja (tylko dev)">
    Uruchamia lint i kompilację TypeScript w tymczasowym drzewie roboczym. Jeśli końcówka nie przejdzie, cofa się maksymalnie o 10 commitów, aby znaleźć najnowszą czystą kompilację.
  </Step>
  <Step title="Rebase">
    Wykonuje rebase na wybrany commit (tylko dev).
  </Step>
  <Step title="Zainstaluj zależności">
    Używa menedżera pakietów repozytorium. W przypadku checkoutów pnpm aktualizator inicjuje `pnpm` na żądanie (najpierw przez `corepack`, następnie przez tymczasowe awaryjne `npm install pnpm@10`) zamiast uruchamiać `npm run build` wewnątrz workspace pnpm.
  </Step>
  <Step title="Zbuduj Control UI">
    Buduje Gateway i Control UI.
  </Step>
  <Step title="Uruchom doctor">
    `openclaw doctor` działa jako końcowe sprawdzenie bezpiecznej aktualizacji.
  </Step>
  <Step title="Synchronizuj Plugin">
    Synchronizuje Plugin z aktywnym kanałem. Dev używa dołączonych Plugin; stable i beta używają npm. Aktualizuje Plugin zainstalowane przez npm.
  </Step>
</Steps>

<Warning>
Jeśli dokładnie przypięta aktualizacja Plugin npm rozwiązuje się do artefaktu, którego integralność różni się od zapisanego rekordu instalacji, `openclaw update` przerywa tę aktualizację artefaktu Plugin zamiast go instalować. Zainstaluj ponownie lub jawnie zaktualizuj Plugin dopiero po sprawdzeniu, że ufasz nowemu artefaktowi.
</Warning>

<Note>
Błędy synchronizacji Plugin po aktualizacji powodują niepowodzenie wyniku aktualizacji i zatrzymują dalsze prace restartu. Napraw błąd instalacji lub aktualizacji Plugin, a następnie ponownie uruchom `openclaw update`.

Gdy zaktualizowany Gateway się uruchamia, ładowanie Plugin jest tylko weryfikacyjne: start nie uruchamia menedżerów pakietów ani nie modyfikuje drzew zależności. Restarty `update.run` menedżera pakietów omijają normalne odroczenie bezczynności i czas wyciszenia restartu po podmianie drzewa pakietu, dzięki czemu stary proces nie może nadal leniwie ładować usuniętych fragmentów.

Jeśli inicjalizacja pnpm nadal się nie powiedzie, aktualizator zatrzymuje się wcześnie z błędem specyficznym dla menedżera pakietów zamiast próbować `npm run build` wewnątrz checkoutu.
</Note>

## Skrót `--update`

`openclaw --update` jest przepisywane na `openclaw update` (przydatne dla powłok i skryptów uruchamiających).

## Powiązane

- `openclaw doctor` (proponuje najpierw uruchomienie aktualizacji w checkoutach git)
- [Kanały deweloperskie](/pl/install/development-channels)
- [Aktualizowanie](/pl/install/updating)
- [Dokumentacja CLI](/pl/cli)
