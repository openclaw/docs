---
read_when:
    - Chcesz przełączać się między stable/beta/dev
    - Chcesz przypiąć konkretną wersję, tag lub SHA
    - Tagujesz lub publikujesz wydania prerelease
sidebarTitle: Release Channels
summary: 'Kanały stable, beta i dev: semantyka, przełączanie, przypinanie i tagowanie'
title: Kanały wydań
x-i18n:
    generated_at: "2026-04-24T09:16:10Z"
    model: gpt-5.4
    provider: openai
    source_hash: d892f3b801cb480652e6e7e757c91c000e842689070564f18782c25108dafa3e
    source_path: install/development-channels.md
    workflow: 15
---

# Kanały deweloperskie

OpenClaw ma trzy kanały aktualizacji:

- **stable**: npm dist-tag `latest`. Zalecany dla większości użytkowników.
- **beta**: npm dist-tag `beta`, gdy jest aktualny; jeśli beta nie istnieje lub jest starszy niż
  najnowsze wydanie stable, przepływ aktualizacji wraca do `latest`.
- **dev**: ruchomy head `main` (git). npm dist-tag: `dev` (gdy opublikowany).
  Gałąź `main` służy do eksperymentów i aktywnego rozwoju. Może zawierać
  niekompletne funkcje albo zmiany łamiące zgodność. Nie używaj jej dla produkcyjnych gatewayów.

Zwykle najpierw publikujemy buildy stable do **beta**, testujemy je tam, a następnie uruchamiamy
jawny krok promocji, który przenosi zweryfikowany build do `latest` bez
zmiany numeru wersji. Maintainerzy mogą też opublikować wydanie stable
bezpośrednio do `latest`, gdy jest to potrzebne. Dist-tagi są źródłem prawdy dla
instalacji npm.

## Przełączanie kanałów

```bash
openclaw update --channel stable
openclaw update --channel beta
openclaw update --channel dev
```

`--channel` utrwala wybór w konfiguracji (`update.channel`) i dopasowuje
metodę instalacji:

- **`stable`** (instalacje pakietowe): aktualizacje przez npm dist-tag `latest`.
- **`beta`** (instalacje pakietowe): preferuje npm dist-tag `beta`, ale wraca do
  `latest`, gdy `beta` nie istnieje lub jest starszy niż bieżący tag stable.
- **`stable`** (instalacje git): checkout najnowszego stabilnego tagu git.
- **`beta`** (instalacje git): preferuje najnowszy tag git beta, ale wraca do
  najnowszego stabilnego tagu git, gdy beta nie istnieje lub jest starsza.
- **`dev`**: zapewnia checkout git (domyślnie `~/openclaw`, nadpisanie przez
  `OPENCLAW_GIT_DIR`), przełącza na `main`, robi rebase na upstream, buduje i
  instaluje globalne CLI z tego checkoutu.

Wskazówka: jeśli chcesz mieć stable + dev równolegle, utrzymuj dwa klony i skieruj
gateway na stabilny.

## Jednorazowe wskazanie wersji lub tagu

Użyj `--tag`, aby wskazać konkretny dist-tag, wersję albo specyfikację pakietu dla pojedynczej
aktualizacji **bez** zmiany utrwalonego kanału:

```bash
# Zainstaluj konkretną wersję
openclaw update --tag 2026.4.1-beta.1

# Zainstaluj z dist-tagu beta (jednorazowo, bez utrwalania)
openclaw update --tag beta

# Zainstaluj z gałęzi GitHub main (tarball npm)
openclaw update --tag main

# Zainstaluj konkretną specyfikację pakietu npm
openclaw update --tag openclaw@2026.4.1-beta.1
```

Uwagi:

- `--tag` dotyczy **tylko instalacji pakietowych (npm)**. Instalacje git go ignorują.
- Tag nie jest utrwalany. Następne `openclaw update` użyje zwykłego
  skonfigurowanego kanału.
- Ochrona przed downgrade: jeśli docelowa wersja jest starsza niż bieżąca,
  OpenClaw poprosi o potwierdzenie (pomiń przez `--yes`).
- `--channel beta` różni się od `--tag beta`: przepływ kanału może wrócić
  do stable/latest, gdy beta nie istnieje lub jest starsza, podczas gdy `--tag beta` wskazuje
  surowy dist-tag `beta` dla tego jednego uruchomienia.

## Symulacja

Podejrzyj, co zrobiłoby `openclaw update`, bez wprowadzania zmian:

```bash
openclaw update --dry-run
openclaw update --channel beta --dry-run
openclaw update --tag 2026.4.1-beta.1 --dry-run
openclaw update --dry-run --json
```

Symulacja pokazuje efektywny kanał, wersję docelową, planowane działania oraz
czy wymagane byłoby potwierdzenie downgrade.

## Pluginy i kanały

Gdy przełączasz kanały przez `openclaw update`, OpenClaw synchronizuje też źródła Pluginów:

- `dev` preferuje dołączone Pluginy z checkoutu git.
- `stable` i `beta` przywracają pakiety Pluginów zainstalowane przez npm.
- Pluginy zainstalowane przez npm są aktualizowane po zakończeniu aktualizacji rdzenia.

## Sprawdzanie bieżącego stanu

```bash
openclaw update status
```

Pokazuje aktywny kanał, rodzaj instalacji (git lub pakiet), bieżącą wersję i
źródło (konfiguracja, tag git, gałąź git albo ustawienie domyślne).

## Dobre praktyki tagowania

- Taguj wydania, na których mają lądować checkouty git (`vYYYY.M.D` dla stable,
  `vYYYY.M.D-beta.N` dla beta).
- `vYYYY.M.D.beta.N` jest również rozpoznawane dla zgodności, ale preferuj `-beta.N`.
- Starsze tagi `vYYYY.M.D-<patch>` są nadal rozpoznawane jako stable (nie-beta).
- Zachowuj niezmienność tagów: nigdy nie przesuwaj ani nie używaj ponownie tagu.
- npm dist-tagi pozostają źródłem prawdy dla instalacji npm:
  - `latest` -> stable
  - `beta` -> build kandydujący albo stable build publikowany najpierw do beta
  - `dev` -> snapshot main (opcjonalnie)

## Dostępność aplikacji macOS

Buildy beta i dev mogą **nie** zawierać wydania aplikacji macOS. To jest OK:

- Tag git i npm dist-tag nadal mogą zostać opublikowane.
- Zaznacz „brak builda macOS dla tej bety” w informacjach o wydaniu lub changelogu.

## Powiązane

- [Updating](/pl/install/updating)
- [Installer internals](/pl/install/installer)
