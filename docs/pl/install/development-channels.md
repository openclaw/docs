---
read_when:
    - Chcesz przełączać się między wersjami stable/beta/dev
    - Chcesz przypiąć konkretną wersję, tag lub SHA
    - Oznaczasz tagami lub publikujesz wersje przedpremierowe
sidebarTitle: Release Channels
summary: 'Kanały stable, beta i dev: semantyka, przełączanie, przypinanie i tagowanie'
title: Kanały wydań
x-i18n:
    generated_at: "2026-05-06T09:17:54Z"
    model: gpt-5.5
    provider: openai
    source_hash: d2516165635eb8fbaddf19e07fbb591b659479b5226c2bf467e29247552ababb
    source_path: install/development-channels.md
    workflow: 16
---

OpenClaw udostępnia trzy kanały aktualizacji:

- **stable**: npm dist-tag `latest`. Zalecany dla większości użytkowników.
- **beta**: npm dist-tag `beta`, gdy jest aktualny; jeśli beta jest niedostępna lub starsza niż
  najnowsze wydanie stable, przepływ aktualizacji wraca do `latest`.
- **dev**: ruchoma głowica `main` (git). npm dist-tag: `dev` (gdy opublikowany).
  Gałąź `main` służy do eksperymentowania i aktywnego rozwoju. Może zawierać
  nieukończone funkcje lub zmiany łamiące zgodność. Nie używaj jej dla gatewayów produkcyjnych.

Zwykle publikujemy kompilacje stable najpierw do **beta**, testujemy je tam, a następnie uruchamiamy
jawny krok promocji, który przenosi sprawdzoną kompilację do `latest` bez
zmiany numeru wersji. Opiekunowie mogą też w razie potrzeby opublikować wydanie stable
bezpośrednio do `latest`. Dist-tagi są źródłem prawdy dla instalacji npm.

## Przełączanie kanałów

```bash
openclaw update --channel stable
openclaw update --channel beta
openclaw update --channel dev
```

`--channel` utrwala Twój wybór w konfiguracji (`update.channel`) i dopasowuje
metodę instalacji:

- **`stable`** (instalacje pakietowe): aktualizuje przez npm dist-tag `latest`.
- **`beta`** (instalacje pakietowe): preferuje npm dist-tag `beta`, ale wraca do
  `latest`, gdy `beta` jest niedostępna lub starsza niż bieżący tag stable.
- **`stable`** (instalacje git): przełącza na najnowszy stabilny tag git.
- **`beta`** (instalacje git): preferuje najnowszy tag git beta, ale wraca do
  najnowszego stabilnego tagu git, gdy beta jest niedostępna lub starsza.
- **`dev`**: zapewnia checkout git (domyślnie `~/openclaw`, można nadpisać przez
  `OPENCLAW_GIT_DIR`), przełącza na `main`, wykonuje rebase względem upstream, buduje i
  instaluje globalne CLI z tego checkoutu.

<Tip>
Jeśli chcesz używać stable i dev równolegle, utrzymuj dwa klony i skieruj swój Gateway na stabilny.
</Tip>

## Jednorazowe wskazanie wersji lub tagu

Użyj `--tag`, aby wskazać konkretny dist-tag, wersję lub specyfikację pakietu dla pojedynczej
aktualizacji **bez** zmieniania utrwalonego kanału:

```bash
# Install a specific version
openclaw update --tag 2026.4.1-beta.1

# Install from the beta dist-tag (one-off, does not persist)
openclaw update --tag beta

# Install from GitHub main branch (npm tarball)
openclaw update --tag main

# Install a specific npm package spec
openclaw update --tag openclaw@2026.4.1-beta.1
```

Uwagi:

- `--tag` dotyczy **wyłącznie instalacji pakietowych (npm)**. Instalacje git go ignorują.
- Tag nie jest utrwalany. Następne `openclaw update` użyje standardowo skonfigurowanego
  kanału.
- Ochrona przed downgrade: jeśli docelowa wersja jest starsza niż bieżąca wersja,
  OpenClaw poprosi o potwierdzenie (pomiń przez `--yes`).
- `--channel beta` różni się od `--tag beta`: przepływ kanału może wrócić
  do stable/latest, gdy beta jest niedostępna lub starsza, podczas gdy `--tag beta` wskazuje
  surowy dist-tag `beta` dla tego jednego uruchomienia.

## Próba na sucho

Podejrzyj, co zrobiłoby `openclaw update`, bez wprowadzania zmian:

```bash
openclaw update --dry-run
openclaw update --channel beta --dry-run
openclaw update --tag 2026.4.1-beta.1 --dry-run
openclaw update --dry-run --json
```

Próba na sucho pokazuje efektywny kanał, wersję docelową, planowane działania oraz
czy wymagane byłoby potwierdzenie downgrade.

## Pluginy i kanały

Gdy przełączasz kanały za pomocą `openclaw update`, OpenClaw synchronizuje też
źródła pluginów:

- `dev` preferuje dołączone pluginy z checkoutu git.
- `stable` i `beta` przywracają pakiety pluginów zainstalowane przez npm.
- Pluginy zainstalowane przez npm są aktualizowane po zakończeniu aktualizacji rdzenia.

## Sprawdzanie bieżącego stanu

```bash
openclaw update status
```

Pokazuje aktywny kanał, typ instalacji (git lub pakiet), bieżącą wersję oraz
źródło (konfiguracja, tag git, gałąź git lub domyślne).

## Najlepsze praktyki tagowania

- Taguj wydania, na których mają lądować checkouty git (`vYYYY.M.D` dla stable,
  `vYYYY.M.D-beta.N` dla beta).
- `vYYYY.M.D.beta.N` jest też rozpoznawany dla zgodności, ale preferuj `-beta.N`.
- Starsze tagi `vYYYY.M.D-<patch>` są nadal rozpoznawane jako stable (nie beta).
- Utrzymuj tagi niezmienne: nigdy nie przenoś ani nie używaj ponownie tagu.
- npm dist-tagi pozostają źródłem prawdy dla instalacji npm:
  - `latest` -> stable
  - `beta` -> kompilacja kandydująca lub kompilacja stable najpierw publikowana w beta
  - `dev` -> migawka main (opcjonalnie)

## Dostępność aplikacji macOS

Kompilacje beta i dev mogą **nie** zawierać wydania aplikacji macOS. To jest w porządku:

- Tag git i npm dist-tag nadal mogą zostać opublikowane.
- W informacjach o wydaniu lub changelogu zaznacz „brak kompilacji macOS dla tej beta”.

## Powiązane

- [Aktualizacja](/pl/install/updating)
- [Wewnętrzne mechanizmy instalatora](/pl/install/installer)
