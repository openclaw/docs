---
read_when:
    - Chcesz przełączać się między stable/beta/dev
    - Chcesz przypiąć konkretną wersję, tag lub SHA
    - Tagujesz lub publikujesz wydania przedpremierowe
sidebarTitle: Release Channels
summary: 'Kanały stable, beta i dev: semantyka, przełączanie, przypinanie i tagowanie'
title: Kanały wydań
x-i18n:
    generated_at: "2026-05-07T01:53:12Z"
    model: gpt-5.5
    provider: openai
    source_hash: 6579110cc5c0e62ef238d7e4200db5fea188f35dc9366a17b3cf92a58c8935cc
    source_path: install/development-channels.md
    workflow: 16
---

OpenClaw udostępnia trzy kanały aktualizacji:

- **stable**: npm dist-tag `latest`. Zalecany dla większości użytkowników.
- **beta**: npm dist-tag `beta`, gdy jest aktualny; jeśli beta nie istnieje lub jest starsza niż
  najnowsze wydanie stabilne, przepływ aktualizacji wraca do `latest`.
- **dev**: ruchomy stan gałęzi `main` (git). npm dist-tag: `dev` (gdy opublikowany).
  Gałąź `main` służy do eksperymentów i aktywnego rozwoju. Może zawierać
  nieukończone funkcje lub zmiany niezgodne wstecz. Nie używaj jej dla produkcyjnych Gateway.

Zwykle najpierw publikujemy stabilne kompilacje w kanale **beta**, testujemy je tam, a następnie uruchamiamy
jawny krok promocji, który przenosi zweryfikowaną kompilację do `latest` bez
zmiany numeru wersji. Maintainerzy mogą też w razie potrzeby opublikować stabilne wydanie
bezpośrednio do `latest`. Dist-tags są źródłem prawdy dla instalacji npm.

## Planowane miesięczne linie wsparcia

OpenClaw nie udostępnia jeszcze kanału LTS ani miesięcznego kanału wsparcia. Pracujemy
nad zgodnymi z SemVer miesięcznymi liniami wsparcia, aby użytkownicy mogli pozostać na spokojniejszej
linii, podczas gdy `latest` nadal szybko się zmienia.

Planowany kształt wersji to `YYYY.M.PATCH`:

- `YYYY` to rok.
- `M` to miesięczna linia wydania, bez wiodącego zera.
- `PATCH` zwiększa się w obrębie tej miesięcznej linii i w razie potrzeby może przekroczyć 100.

Przykładowe przyszłe tagi:

- `v2026.6.0`, `v2026.6.1`, `v2026.6.2` dla linii czerwcowej.
- `v2026.6.3-beta.1` dla wydania wstępnego w szybkim torze/latest.
- Przyszły dist-tag linii wsparcia, taki jak `stable-2026-6` lub `lts-2026-6`, może
  wskazywać na miesięczną linię, ale taki kanał nie jest dziś dostępny.

Dopóki ta migracja nie zostanie wdrożona, publicznymi kanałami aktualizacji pozostają `stable`, `beta`
i `dev`.

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
  `latest`, gdy `beta` nie istnieje lub jest starszy niż bieżący stabilny tag.
- **`stable`** (instalacje git): przełącza na najnowszy stabilny tag git.
- **`beta`** (instalacje git): preferuje najnowszy tag git beta, ale wraca do
  najnowszego stabilnego tagu git, gdy beta nie istnieje lub jest starsza.
- **`dev`**: zapewnia checkout git (domyślnie `~/openclaw`, nadpisz przez
  `OPENCLAW_GIT_DIR`), przełącza na `main`, wykonuje rebase względem upstream, buduje i
  instaluje globalny CLI z tego checkoutu.

<Tip>
Jeśli chcesz używać stable i dev równolegle, trzymaj dwa klony i skieruj swój Gateway na stabilny.
</Tip>

## Jednorazowe wskazanie wersji lub tagu

Użyj `--tag`, aby wskazać konkretny dist-tag, wersję lub specyfikację pakietu dla pojedynczej
aktualizacji **bez** zmiany utrwalonego kanału:

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

- `--tag` ma zastosowanie **tylko do instalacji pakietowych (npm)**. Instalacje git go ignorują.
- Tag nie jest utrwalany. Następne `openclaw update` użyje jak zwykle skonfigurowanego
  kanału.
- Ochrona przed obniżeniem wersji: jeśli docelowa wersja jest starsza niż bieżąca wersja,
  OpenClaw poprosi o potwierdzenie (pomiń przez `--yes`).
- `--channel beta` różni się od `--tag beta`: przepływ kanału może wrócić
  do stable/latest, gdy beta nie istnieje lub jest starsza, natomiast `--tag beta` wskazuje
  surowy dist-tag `beta` dla tego jednego uruchomienia.

## Próba bez zmian

Podejrzyj, co zrobiłoby `openclaw update`, bez wprowadzania zmian:

```bash
openclaw update --dry-run
openclaw update --channel beta --dry-run
openclaw update --tag 2026.4.1-beta.1 --dry-run
openclaw update --dry-run --json
```

Próba bez zmian pokazuje efektywny kanał, wersję docelową, planowane działania oraz
czy wymagane byłoby potwierdzenie obniżenia wersji.

## Pluginy i kanały

Gdy przełączasz kanały za pomocą `openclaw update`, OpenClaw synchronizuje też
źródła Pluginów:

- `dev` preferuje wbudowane Pluginy z checkoutu git.
- `stable` i `beta` przywracają pakiety Pluginów zainstalowane z npm.
- Pluginy zainstalowane z npm są aktualizowane po zakończeniu aktualizacji rdzenia.

## Sprawdzanie bieżącego stanu

```bash
openclaw update status
```

Pokazuje aktywny kanał, typ instalacji (git lub pakiet), bieżącą wersję oraz
źródło (konfiguracja, tag git, gałąź git lub domyślne).

## Najlepsze praktyki tagowania

- Otaguj wydania, na których mają lądować checkouty git (`vYYYY.M.D` dla bieżących
  wydań stabilnych, `vYYYY.M.D-beta.N` dla bieżących wydań beta).
- `vYYYY.M.D.beta.N` jest także rozpoznawany dla kompatybilności, ale preferuj `-beta.N`.
- Starsze tagi `vYYYY.M.D-<patch>` nadal są rozpoznawane jako stabilne (nie-beta),
  ale planowany miesięczny model wsparcia będzie używać normalnych numerów poprawek
  (`vYYYY.M.PATCH`) zamiast sufiksu korekty z łącznikiem.
- Utrzymuj tagi jako niezmienne: nigdy nie przenoś ani nie używaj ponownie tagu.
- npm dist-tags pozostają źródłem prawdy dla instalacji npm:
  - `latest` -> stable
  - `beta` -> kompilacja kandydująca lub stabilna kompilacja publikowana najpierw w beta
  - `dev` -> migawka main (opcjonalnie)

## Dostępność aplikacji macOS

Kompilacje beta i dev mogą **nie** zawierać wydania aplikacji macOS. To jest w porządku:

- Tag git i npm dist-tag nadal mogą zostać opublikowane.
- W informacjach o wydaniu lub changelogu zaznacz „brak kompilacji macOS dla tej beta”.

## Powiązane

- [Aktualizowanie](/pl/install/updating)
- [Wewnętrzne mechanizmy instalatora](/pl/install/installer)
