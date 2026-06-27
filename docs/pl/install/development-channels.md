---
read_when:
    - Chcesz przełączać się między stable/beta/dev
    - Chcesz przypiąć konkretną wersję, tag lub SHA
    - Tagujesz lub publikujesz wydania wstępne
sidebarTitle: Release Channels
summary: 'Kanały stabilne, beta i deweloperskie: semantyka, przełączanie, przypinanie i tagowanie'
title: Kanały wydań
x-i18n:
    generated_at: "2026-06-27T17:42:16Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 7b5b0b8b43dd15b3fdd83d28c5d0292d260594325ad6e6e95533720ba3e59277
    source_path: install/development-channels.md
    workflow: 16
---

OpenClaw udostępnia trzy kanały aktualizacji:

- **stable**: npm dist-tag `latest`. Zalecany dla większości użytkowników.
- **beta**: npm dist-tag `beta`, gdy jest aktualny; jeśli beta nie istnieje albo jest starsza niż
  najnowsze stabilne wydanie, przepływ aktualizacji wraca do `latest`.
- **dev**: ruchomy HEAD gałęzi `main` (git). npm dist-tag: `dev` (gdy opublikowany).
  Gałąź `main` służy do eksperymentów i aktywnego rozwoju. Może zawierać
  nieukończone funkcje albo zmiany niezgodne wstecz. Nie używaj jej dla instancji Gateway w produkcji.

Zwykle najpierw publikujemy stabilne kompilacje do **beta**, testujemy je tam, a następnie uruchamiamy
jawny krok promocji, który przenosi zweryfikowaną kompilację do `latest` bez
zmiany numeru wersji. Maintainerzy mogą też w razie potrzeby opublikować stabilne wydanie
bezpośrednio do `latest`. Dist-tagi są źródłem prawdy dla instalacji npm.

## Przełączanie kanałów

```bash
openclaw update --channel stable
openclaw update --channel beta
openclaw update --channel dev
```

`--channel` zapisuje wybrany kanał w konfiguracji (`update.channel`) i dopasowuje
metodę instalacji:

- **`stable`** (instalacje pakietowe): aktualizuje przez npm dist-tag `latest`.
- **`beta`** (instalacje pakietowe): preferuje npm dist-tag `beta`, ale wraca do
  `latest`, gdy `beta` nie istnieje albo jest starsza niż bieżący stabilny tag.
- **`stable`** (instalacje git): przełącza na najnowszy stabilny tag git, z wyłączeniem
  prerelease tagów semver, takich jak `-alpha.N`, `-beta.N`, `-rc.N`, `-dev.N`,
  `-next.N`, `-preview.N`, `-canary.N`, `-nightly.N` oraz innych sufiksów prerelease.
- **`beta`** (instalacje git): preferuje najnowszy tag git beta, ale wraca do
  najnowszego stabilnego tagu git, gdy beta nie istnieje albo jest starsza.
- **`dev`**: zapewnia checkout git (domyślnie `~/openclaw` albo
  `$OPENCLAW_HOME/openclaw`, gdy ustawiono `OPENCLAW_HOME`; można nadpisać przez
  `OPENCLAW_GIT_DIR`), przełącza na `main`, wykonuje rebase względem upstream, buduje i
  instaluje globalne CLI z tego checkoutu.

<Tip>
Jeśli chcesz używać stable i dev równolegle, utrzymuj dwa klony i skieruj swój Gateway na stabilny.
</Tip>

## Jednorazowe wskazanie wersji lub tagu

Użyj `--tag`, aby wskazać konkretny dist-tag, wersję albo specyfikację pakietu dla pojedynczej
aktualizacji **bez** zmiany zapisanego kanału:

```bash
# Install a specific version
openclaw update --tag 2026.4.1-beta.1

# Install from the beta dist-tag (one-off, does not persist)
openclaw update --tag beta

# Switch to the moving GitHub main checkout
openclaw update --channel dev

# Install a specific npm package spec
openclaw update --tag openclaw@2026.4.1-beta.1

# Install from GitHub main once without persisting the channel
openclaw update --tag main
```

Uwagi:

- `--tag` dotyczy **wyłącznie instalacji pakietowych (npm)**. Instalacje git go ignorują.
- Tag nie jest zapisywany. Następne `openclaw update` użyje jak zwykle skonfigurowanego
  kanału.
- Dla instalacji pakietowych OpenClaw wstępnie pakuje specyfikacje źródeł GitHub/git do
  tymczasowego archiwum tarball przed etapową instalacją npm. Użyj `--channel dev` albo
  `--install-method git --version main`, gdy chcesz mieć ruchomy checkout `main`
  jako trwałą instalację.
- Ochrona przed downgrade’em: jeśli wersja docelowa jest starsza niż bieżąca,
  OpenClaw poprosi o potwierdzenie (pomiń przez `--yes`).
- `--channel beta` różni się od `--tag beta`: przepływ kanału może wrócić
  do stable/latest, gdy beta nie istnieje albo jest starsza, podczas gdy `--tag beta` wskazuje
  surowy dist-tag `beta` tylko dla tego jednego uruchomienia.

## Próba bez zmian

Podejrzyj, co zrobiłoby `openclaw update` bez wprowadzania zmian:

```bash
openclaw update --dry-run
openclaw update --channel beta --dry-run
openclaw update --tag 2026.4.1-beta.1 --dry-run
openclaw update --dry-run --json
```

Próba bez zmian pokazuje efektywny kanał, wersję docelową, planowane działania oraz
czy wymagane byłoby potwierdzenie downgrade’u.

## Pluginy i kanały

Gdy przełączasz kanały przez `openclaw update`, OpenClaw synchronizuje też źródła Pluginów:

- `dev` preferuje dołączone Pluginy z checkoutu git.
- `stable` i `beta` przywracają pakiety Pluginów zainstalowane przez npm.
- Pluginy zainstalowane przez npm są aktualizowane po zakończeniu aktualizacji rdzenia.

## Sprawdzanie bieżącego statusu

```bash
openclaw update status
```

Pokazuje aktywny kanał, rodzaj instalacji (git albo pakietowa), bieżącą wersję oraz
źródło (konfiguracja, tag git, gałąź git albo domyślne).

## Najlepsze praktyki tagowania

- Taguj wydania, na których mają lądować checkouty git (`vYYYY.M.PATCH` dla stable,
  `vYYYY.M.PATCH-beta.N` dla beta; nazwane sufiksy prerelease semver, takie jak
  `-alpha.N`, `-rc.N` i `-next.N`, nie są celami stable).
- Starsze numeryczne stabilne tagi, takie jak `vYYYY.M.PATCH-1` i `v1.0.1-1`, nadal
  są rozpoznawane jako stabilne tagi git dla zgodności.
- `vYYYY.M.PATCH.beta.N` jest również rozpoznawany dla zgodności, ale preferuj `-beta.N`.
- Utrzymuj tagi jako niezmienne: nigdy nie przenoś ani nie używaj ponownie tagu.
- npm dist-tagi pozostają źródłem prawdy dla instalacji npm:
  - `latest` -> stable
  - `beta` -> kompilacja kandydująca albo stabilna kompilacja publikowana najpierw do beta
  - `dev` -> migawka main (opcjonalnie)

## Dostępność aplikacji macOS

Kompilacje beta i dev mogą **nie** zawierać wydania aplikacji macOS. To jest w porządku:

- Tag git i npm dist-tag nadal mogą zostać opublikowane.
- W informacjach o wydaniu albo changelogu zaznacz „brak kompilacji macOS dla tej bety”.

## Powiązane

- [Aktualizowanie](/pl/install/updating)
- [Wewnętrzne mechanizmy instalatora](/pl/install/installer)
