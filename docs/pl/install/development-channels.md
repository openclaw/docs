---
read_when:
    - Chcesz przełączać się między stable/beta/dev
    - Chcesz przypiąć konkretną wersję, tag lub SHA
    - Tagujesz lub publikujesz wydania wstępne
sidebarTitle: Release Channels
summary: 'Kanały stable, beta i dev: semantyka, przełączanie, pinning i tagowanie'
title: Kanały wydań
x-i18n:
    generated_at: "2026-04-05T13:56:30Z"
    model: gpt-5.4
    provider: openai
    source_hash: 3f33a77bf356f989cd4de5f8bb57f330c276e7571b955bea6994a4527e40258d
    source_path: install/development-channels.md
    workflow: 15
---

# Kanały deweloperskie

OpenClaw udostępnia trzy kanały aktualizacji:

- **stable**: npm dist-tag `latest`. Zalecany dla większości użytkowników.
- **beta**: npm dist-tag `beta`, gdy jest aktualny; jeśli beta nie istnieje lub jest starsza niż
  najnowsze wydanie stable, proces aktualizacji wraca do `latest`.
- **dev**: ruchoma główka `main` (git). npm dist-tag: `dev` (gdy opublikowany).
  Gałąź `main` służy do eksperymentów i aktywnego rozwoju. Może zawierać
  nieukończone funkcje lub niekompatybilne zmiany. Nie używaj jej dla produkcyjnych gateway.

Zwykle najpierw publikujemy wydania stable do **beta**, testujemy je tam, a potem wykonujemy
jawny krok promocji, który przenosi zatwierdzone wydanie do `latest` bez
zmiany numeru wersji. Maintainerzy mogą też w razie potrzeby opublikować wydanie stable
bezpośrednio do `latest`. Dist-tagi są źródłem prawdy dla
instalacji npm.

## Przełączanie kanałów

```bash
openclaw update --channel stable
openclaw update --channel beta
openclaw update --channel dev
```

`--channel` zapisuje Twój wybór w config (`update.channel`) i dopasowuje
metodę instalacji:

- **`stable`** (instalacje pakietowe): aktualizuje przez npm dist-tag `latest`.
- **`beta`** (instalacje pakietowe): preferuje npm dist-tag `beta`, ale wraca do
  `latest`, gdy `beta` nie istnieje lub jest starszy od bieżącego tagu stable.
- **`stable`** (instalacje git): przełącza na najnowszy tag git stable.
- **`beta`** (instalacje git): preferuje najnowszy tag git beta, ale wraca do
  najnowszego tagu git stable, gdy beta nie istnieje lub jest starsza.
- **`dev`**: zapewnia checkout git (domyślnie `~/openclaw`, można nadpisać przez
  `OPENCLAW_GIT_DIR`), przełącza na `main`, wykonuje rebase na upstream, buduje
  i instaluje globalne CLI z tego checkoutu.

Wskazówka: jeśli chcesz równolegle używać stable + dev, trzymaj dwa klony i skieruj
gateway na stabilny.

## Jednorazowe wskazanie wersji lub tagu

Użyj `--tag`, aby wskazać konkretny dist-tag, wersję lub spec pakietu dla pojedynczej
aktualizacji **bez** zmieniania zapisanego kanału:

```bash
# Zainstaluj konkretną wersję
openclaw update --tag 2026.4.1-beta.1

# Zainstaluj z dist-tagu beta (jednorazowo, bez zapisywania)
openclaw update --tag beta

# Zainstaluj z gałęzi GitHub main (tarball npm)
openclaw update --tag main

# Zainstaluj konkretny spec pakietu npm
openclaw update --tag openclaw@2026.4.1-beta.1
```

Uwagi:

- `--tag` dotyczy tylko **instalacji pakietowych (npm)**. Instalacje git go ignorują.
- Tag nie jest zapisywany. Następne `openclaw update` użyje jak zwykle skonfigurowanego
  kanału.
- Ochrona przed downgrade: jeśli wersja docelowa jest starsza od bieżącej wersji,
  OpenClaw poprosi o potwierdzenie (pomiń przez `--yes`).
- `--channel beta` różni się od `--tag beta`: przepływ kanału może wrócić
  do stable/latest, gdy beta nie istnieje lub jest starsza, podczas gdy `--tag beta` wskazuje
  surowy dist-tag `beta` tylko dla tego jednego uruchomienia.

## Dry run

Podejrzyj, co zrobi `openclaw update`, bez wprowadzania zmian:

```bash
openclaw update --dry-run
openclaw update --channel beta --dry-run
openclaw update --tag 2026.4.1-beta.1 --dry-run
openclaw update --dry-run --json
```

Dry run pokazuje efektywny kanał, wersję docelową, planowane działania oraz
czy wymagane byłoby potwierdzenie downgrade.

## Pluginy i kanały

Gdy przełączasz kanały przez `openclaw update`, OpenClaw synchronizuje również źródła pluginów:

- `dev` preferuje bundlowane pluginy z checkoutu git.
- `stable` i `beta` przywracają pakiety pluginów zainstalowane przez npm.
- Pluginy zainstalowane przez npm są aktualizowane po zakończeniu aktualizacji core.

## Sprawdzanie bieżącego stanu

```bash
openclaw update status
```

Pokazuje aktywny kanał, rodzaj instalacji (git lub pakiet), bieżącą wersję oraz
źródło (config, tag git, gałąź git lub wartość domyślna).

## Dobre praktyki tagowania

- Taguj wydania, na których mają lądować checkouty git (`vYYYY.M.D` dla stable,
  `vYYYY.M.D-beta.N` dla beta).
- `vYYYY.M.D.beta.N` też jest rozpoznawane dla zgodności, ale preferuj `-beta.N`.
- Starsze tagi `vYYYY.M.D-<patch>` nadal są rozpoznawane jako stable (nie-beta).
- Zachowuj niezmienność tagów: nigdy nie przenoś ani nie używaj ponownie tagu.
- npm dist-tagi pozostają źródłem prawdy dla instalacji npm:
  - `latest` -> stable
  - `beta` -> kompilacja kandydująca lub stabilna kompilacja najpierw do beta
  - `dev` -> migawka `main` (opcjonalnie)

## Dostępność aplikacji macOS

Wydania beta i dev mogą **nie** zawierać wydania aplikacji macOS. To jest OK:

- Tag git i npm dist-tag nadal mogą zostać opublikowane.
- W informacji o wydaniu lub changelogu zaznacz „brak kompilacji macOS dla tej beta”.
