---
read_when:
    - Chcesz przełączać się między stable/beta/dev
    - Chcesz przypiąć konkretną wersję, tag lub SHA
    - Oznaczasz tagami lub publikujesz wydania przedpremierowe
sidebarTitle: Release Channels
summary: 'Kanały stabilny, beta i deweloperski: semantyka, przełączanie, przypinanie i tagowanie'
title: Kanały wydań
x-i18n:
    generated_at: "2026-04-30T10:00:19Z"
    model: gpt-5.5
    provider: openai
    source_hash: 741d8ed2a1599264e1b41a99e81fac4b06d14cb026aa945a8757b15e5733f682
    source_path: install/development-channels.md
    workflow: 16
---

# Kanały deweloperskie

OpenClaw udostępnia trzy kanały aktualizacji:

- **stable**: npm dist-tag `latest`. Zalecany dla większości użytkowników.
- **beta**: npm dist-tag `beta`, gdy jest aktualny; jeśli beta nie istnieje albo jest starsza niż
  najnowsze wydanie stable, przepływ aktualizacji wraca do `latest`.
- **dev**: ruchomy stan gałęzi `main` (git). npm dist-tag: `dev` (gdy opublikowany).
  Gałąź `main` służy do eksperymentowania i aktywnego rozwoju. Może zawierać
  nieukończone funkcje lub zmiany niezgodne wstecz. Nie używaj jej w Gatewayach produkcyjnych.

Zazwyczaj najpierw publikujemy kompilacje stable do **beta**, testujemy je tam, a następnie uruchamiamy
jawny krok promocji, który przenosi zweryfikowaną kompilację do `latest` bez
zmieniania numeru wersji. Maintainerzy mogą też w razie potrzeby opublikować wydanie stable
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
  `latest`, gdy `beta` nie istnieje albo jest starszy niż bieżący tag stable.
- **`stable`** (instalacje git): przełącza na najnowszy stabilny tag git.
- **`beta`** (instalacje git): preferuje najnowszy tag git beta, ale wraca do
  najnowszego stabilnego tagu git, gdy beta nie istnieje albo jest starsza.
- **`dev`**: zapewnia checkout git (domyślnie `~/openclaw`, można nadpisać przez
  `OPENCLAW_GIT_DIR`), przełącza na `main`, wykonuje rebase na upstream, buduje i
  instaluje globalne CLI z tego checkoutu.

<Tip>
Jeśli chcesz używać stable i dev równolegle, trzymaj dwa klony i skieruj swój Gateway na stabilny.
</Tip>

## Jednorazowe wskazanie wersji lub tagu

Użyj `--tag`, aby wskazać konkretny dist-tag, wersję lub specyfikację pakietu dla pojedynczej
aktualizacji **bez** zmieniania zapisanego kanału:

```bash
# Zainstaluj konkretną wersję
openclaw update --tag 2026.4.1-beta.1

# Zainstaluj z dist-tagu beta (jednorazowo, bez zapisywania)
openclaw update --tag beta

# Zainstaluj z gałęzi main na GitHubie (tarball npm)
openclaw update --tag main

# Zainstaluj konkretną specyfikację pakietu npm
openclaw update --tag openclaw@2026.4.1-beta.1
```

Uwagi:

- `--tag` dotyczy **wyłącznie instalacji pakietowych (npm)**. Instalacje git go ignorują.
- Tag nie jest zapisywany. Następne `openclaw update` użyje jak zwykle skonfigurowanego
  kanału.
- Ochrona przed downgrade'em: jeśli wersja docelowa jest starsza niż bieżąca wersja,
  OpenClaw poprosi o potwierdzenie (pomiń przez `--yes`).
- `--channel beta` różni się od `--tag beta`: przepływ kanału może wrócić
  do stable/latest, gdy beta nie istnieje albo jest starsza, natomiast `--tag beta` wskazuje
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
to, czy wymagane byłoby potwierdzenie downgrade'u.

## Pluginy i kanały

Gdy przełączasz kanały przez `openclaw update`, OpenClaw synchronizuje też
źródła pluginów:

- `dev` preferuje pluginy dołączone z checkoutu git.
- `stable` i `beta` przywracają pakiety pluginów zainstalowane przez npm.
- Pluginy zainstalowane przez npm są aktualizowane po zakończeniu aktualizacji rdzenia.

## Sprawdzanie bieżącego stanu

```bash
openclaw update status
```

Pokazuje aktywny kanał, rodzaj instalacji (git lub pakiet), bieżącą wersję oraz
źródło (konfiguracja, tag git, gałąź git albo domyślne).

## Najlepsze praktyki tagowania

- Otaguj wydania, na których mają lądować checkouty git (`vYYYY.M.D` dla stable,
  `vYYYY.M.D-beta.N` dla beta).
- `vYYYY.M.D.beta.N` jest też rozpoznawany dla zgodności, ale preferuj `-beta.N`.
- Starsze tagi `vYYYY.M.D-<patch>` są nadal rozpoznawane jako stable (nie beta).
- Utrzymuj tagi niezmienne: nigdy nie przenoś ani nie używaj ponownie tagu.
- npm dist-tagi pozostają źródłem prawdy dla instalacji npm:
  - `latest` -> stable
  - `beta` -> kompilacja kandydująca albo kompilacja stable publikowana najpierw do beta
  - `dev` -> migawka main (opcjonalnie)

## Dostępność aplikacji macOS

Kompilacje beta i dev mogą **nie** zawierać wydania aplikacji macOS. To jest w porządku:

- Tag git i npm dist-tag nadal mogą zostać opublikowane.
- Wskaż „brak kompilacji macOS dla tej bety” w informacjach o wydaniu lub changelogu.

## Powiązane

- [Aktualizowanie](/pl/install/updating)
- [Wewnętrzne mechanizmy instalatora](/pl/install/installer)
