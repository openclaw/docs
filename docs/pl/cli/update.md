---
read_when:
    - Chcesz bezpiecznie zaktualizować lokalną kopię kodu źródłowego
    - Musisz zrozumieć działanie skrótu `--update`
summary: Referencja CLI dla `openclaw update` (względnie bezpieczna aktualizacja źródła + automatyczne ponowne uruchomienie Gateway)
title: Aktualizuj
x-i18n:
    generated_at: "2026-05-02T20:43:13Z"
    model: gpt-5.5
    provider: openai
    source_hash: 35df8c6d8b1adb9597377f6e2b4844352577992c12636a88b3f3c1854dc0666b
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

- `--no-restart`: pomija ponowne uruchomienie usługi Gateway po udanej aktualizacji. Aktualizacje przez menedżera pakietów, które ponownie uruchamiają Gateway, przed zakończeniem polecenia z powodzeniem sprawdzają, czy ponownie uruchomiona usługa zgłasza oczekiwaną zaktualizowaną wersję.
- `--channel <stable|beta|dev>`: ustawia kanał aktualizacji (git + npm; utrwalany w konfiguracji).
- `--tag <dist-tag|version|spec>`: nadpisuje cel pakietu tylko dla tej aktualizacji. W przypadku instalacji pakietowych `main` mapuje się na `github:openclaw/openclaw#main`.
- `--dry-run`: pokazuje planowane działania aktualizacji (kanał/tag/cel/przepływ restartu) bez zapisywania konfiguracji, instalowania, synchronizowania pluginów ani ponownego uruchamiania.
- `--json`: wypisuje czytelny maszynowo JSON `UpdateRunResult`, w tym
  `postUpdate.plugins.integrityDrifts`, gdy podczas synchronizacji pluginów po aktualizacji
  zostanie wykryty dryf artefaktów pluginów npm.
- `--timeout <seconds>`: limit czasu dla każdego kroku (domyślnie 1800 s).
- `--yes`: pomija pytania o potwierdzenie (na przykład potwierdzenie obniżenia wersji).

<Warning>
Obniżenia wersji wymagają potwierdzenia, ponieważ starsze wersje mogą uszkodzić konfigurację.
</Warning>

## `update status`

Pokazuje aktywny kanał aktualizacji + tag/gałąź/SHA git (dla kopii źródłowych), a także dostępność aktualizacji.

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
(domyślnie uruchamia ponownie). Jeśli wybierzesz `dev` bez kopii git, zaproponuje jej utworzenie.

Opcje:

- `--timeout <seconds>`: limit czasu dla każdego kroku aktualizacji (domyślnie `1800`)

## Co robi

Gdy jawnie przełączasz kanały (`--channel ...`), OpenClaw utrzymuje też zgodność
metody instalacji:

- `dev` → zapewnia kopię git (domyślnie: `~/openclaw`, nadpisywane przez `OPENCLAW_GIT_DIR`),
  aktualizuje ją i instaluje globalne CLI z tej kopii.
- `stable` → instaluje z npm przy użyciu `latest`.
- `beta` → preferuje dist-tag npm `beta`, ale wraca do `latest`, gdy beta
  jest niedostępna albo starsza niż bieżące wydanie stabilne.

Automatyczny aktualizator rdzenia Gateway (gdy jest włączony w konfiguracji) uruchamia ścieżkę aktualizacji CLI
poza aktywnym handlerem żądania Gateway. Aktualizacje przez menedżera pakietów `update.run` w control plane
wymuszają nieodroczony restart aktualizacyjny bez okresu cooldown po podmianie pakietu,
ponieważ stary proces Gateway może nadal mieć w pamięci fragmenty wskazujące na
pliki usunięte przez nowy pakiet.

W przypadku instalacji przez menedżera pakietów `openclaw update` rozwiązuje docelową wersję
pakietu przed wywołaniem menedżera pakietów. Globalne instalacje npm używają instalacji etapowej:
OpenClaw instaluje nowy pakiet w tymczasowym prefiksie npm, weryfikuje tam
spis spakowanego `dist`, a następnie podmienia czyste drzewo pakietu w
rzeczywistym globalnym prefiksie. Jeśli weryfikacja się nie powiedzie, doctor po aktualizacji, synchronizacja pluginów i
prace restartu nie są uruchamiane z podejrzanego drzewa. Nawet gdy zainstalowana wersja
już odpowiada celowi, polecenie odświeża globalną instalację pakietu,
a następnie uruchamia synchronizację pluginów, odświeżenie uzupełniania poleceń rdzenia oraz prace restartu. To
utrzymuje spakowane procesy pomocnicze i rekordy pluginów należące do kanału w zgodności z
zainstalowaną kompilacją OpenClaw, pozostawiając pełne przebudowy uzupełnień poleceń pluginów
jawnym uruchomieniom `openclaw completion --write-state`.

Gdy zainstalowana jest lokalna zarządzana usługa Gateway i restart jest włączony,
aktualizacje przez menedżera pakietów zatrzymują działającą usługę przed zastąpieniem drzewa pakietu,
następnie odświeżają metadane usługi ze zaktualizowanej instalacji, ponownie uruchamiają
usługę i sprawdzają, czy ponownie uruchomiony Gateway zgłasza oczekiwaną wersję. Z
`--no-restart` zastąpienie pakietu nadal jest wykonywane, ale zarządzana usługa nie jest
zatrzymywana ani ponownie uruchamiana, więc działający Gateway może zachować stary kod, dopóki nie uruchomisz go ponownie
ręcznie.

## Przepływ kopii git

### Wybór kanału

- `stable`: przełącza na najnowszy tag niebędący beta, a następnie buduje i uruchamia doctor.
- `beta`: preferuje najnowszy tag `-beta`, ale wraca do najnowszego stabilnego tagu, gdy beta jest niedostępna lub starsza.
- `dev`: przełącza na `main`, a następnie pobiera zmiany i wykonuje rebase.

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
    Uruchamia lint i kompilację TypeScript w tymczasowym drzewie roboczym. Jeśli wskazany commit się nie powiedzie, cofa się maksymalnie o 10 commitów, aby znaleźć najnowszą czystą kompilację.
  </Step>
  <Step title="Rebase">
    Wykonuje rebase na wybrany commit (tylko dev).
  </Step>
  <Step title="Zainstaluj zależności">
    Używa menedżera pakietów repozytorium. W przypadku kopii pnpm aktualizator uruchamia `pnpm` na żądanie (najpierw przez `corepack`, a następnie przez tymczasowe awaryjne `npm install pnpm@10`) zamiast uruchamiać `npm run build` wewnątrz workspace pnpm.
  </Step>
  <Step title="Zbuduj Control UI">
    Buduje gateway i Control UI.
  </Step>
  <Step title="Uruchom doctor">
    `openclaw doctor` uruchamia się jako końcowe sprawdzenie bezpiecznej aktualizacji.
  </Step>
  <Step title="Synchronizuj pluginy">
    Synchronizuje pluginy z aktywnym kanałem. Dev używa dołączonych pluginów; stable i beta używają npm. Aktualizuje śledzone instalacje pluginów.
  </Step>
</Steps>

Na kanale aktualizacji beta śledzone instalacje pluginów npm i ClawHub, które podążają
domyślną/najnowszą linią, najpierw próbują wydania pluginu `@beta`. Jeśli plugin nie ma
wydania beta, OpenClaw wraca do zarejestrowanej specyfikacji domyślnej/najnowszej. Dokładne
wersje i jawne tagi nie są przepisywane.

<Warning>
Jeśli aktualizacja dokładnie przypiętego pluginu npm rozwiązuje się do artefaktu, którego integralność różni się od zapisanego rekordu instalacji, `openclaw update` przerywa aktualizację tego artefaktu pluginu zamiast go instalować. Zainstaluj ponownie lub zaktualizuj plugin jawnie dopiero po sprawdzeniu, że ufasz nowemu artefaktowi.
</Warning>

<Note>
Niepowodzenia synchronizacji pluginów po aktualizacji powodują niepowodzenie wyniku aktualizacji i zatrzymują dalsze prace restartu. Napraw błąd instalacji lub aktualizacji pluginu, a następnie ponownie uruchom `openclaw update`.

Gdy zaktualizowany Gateway się uruchamia, ładowanie pluginów działa tylko w trybie weryfikacji: start nie uruchamia menedżerów pakietów ani nie mutuje drzew zależności. Restarty `update.run` przez menedżera pakietów omijają normalne odroczenie bezczynności i cooldown restartu po podmianie drzewa pakietu, więc stary proces nie może dalej leniwie ładować usuniętych fragmentów.

Jeśli bootstrap pnpm nadal się nie powiedzie, aktualizator zatrzymuje się wcześnie z błędem specyficznym dla menedżera pakietów zamiast próbować `npm run build` wewnątrz kopii.
</Note>

## Skrót `--update`

`openclaw --update` przepisuje się na `openclaw update` (przydatne dla powłok i skryptów uruchamiających).

## Powiązane

- `openclaw doctor` (proponuje najpierw uruchomienie aktualizacji w kopiach git)
- [Kanały deweloperskie](/pl/install/development-channels)
- [Aktualizowanie](/pl/install/updating)
- [Dokumentacja CLI](/pl/cli)
