---
read_when:
    - Pierwsze użycie ClawHub
    - Instalowanie umiejętności lub wtyczki z rejestru
    - Publikowanie w ClawHub
summary: 'Zacznij korzystać z ClawHub: znajduj, instaluj, aktualizuj i publikuj Skills lub pluginy.'
x-i18n:
    generated_at: "2026-07-04T04:10:09Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: f6d61bd32a359a843e68140cc90b4ff4bcc64645ea425ea4654c668d6d3d04ec
    source_path: clawhub/quickstart.md
    workflow: 16
---

# Szybki start

ClawHub to rejestr Skills i Pluginów OpenClaw.

Używaj OpenClaw, gdy instalujesz rzeczy w OpenClaw. Używaj CLI `clawhub`,
gdy się logujesz, publikujesz, zarządzasz własnymi wpisami lub używasz
przepływów specyficznych dla rejestru.

## Znajdź i zainstaluj Skills

Wyszukaj z poziomu OpenClaw:

```bash
openclaw skills search "calendar"
```

Zainstaluj Skills:

```bash
openclaw skills install @openclaw/demo
```

Zaktualizuj zainstalowane Skills:

```bash
openclaw skills update --all
```

OpenClaw zapisuje, skąd pochodzi Skills, aby późniejsze aktualizacje mogły nadal
rozwiązywać źródło przez ClawHub.

## Znajdź i zainstaluj Plugin

Wyszukaj z poziomu OpenClaw:

```bash
openclaw plugins search "calendar"
```

Zainstaluj Plugin hostowany w ClawHub z jawnym źródłem ClawHub:

```bash
openclaw plugins install clawhub:<package>
```

Zaktualizuj zainstalowane Pluginy:

```bash
openclaw plugins update --all
```

Użyj prefiksu `clawhub:`, gdy chcesz, aby OpenClaw rozwiązał pakiet przez
ClawHub zamiast przez npm lub inne źródło.

## Zaloguj się do publikowania

Zainstaluj CLI ClawHub:

```bash
npm i -g clawhub
# or
pnpm add -g clawhub
```

Zaloguj się za pomocą GitHub:

```bash
clawhub login
clawhub whoami
```

Środowiska bez interfejsu graficznego mogą użyć tokena API z interfejsu webowego ClawHub:

```bash
clawhub login --token clh_...
```

## Opublikuj Skills

Skills to folder z wymaganym plikiem `SKILL.md` i opcjonalnymi plikami
pomocniczymi.

```bash
clawhub skill publish ./my-skill \
  --slug my-skill \
  --name "My Skill" \
  --changelog "Initial release"
```

Polecenie pomija niezmienioną zawartość. Nowe Skills zaczynają od `1.0.0`;
późniejsze zmiany automatycznie publikują następną wersję poprawkową. Użyj
`--dry-run`, aby zobaczyć podgląd, lub `--version`, aby wybrać jawną wersję.

Przed publikacją sprawdź metadane w `SKILL.md`. Zadeklaruj wymagane zmienne
środowiskowe, narzędzia i uprawnienia, aby użytkownicy mogli zrozumieć, czego
potrzebuje Skills, zanim go zainstalują. Zobacz [Format Skills](/pl/clawhub/skill-format).

W przypadku repozytoriów zawierających wiele Skills przepływ pracy GitHub
wielokrotnego użytku wywołuje `skill publish` dla każdego bezpośredniego folderu
Skills w `skills/`:

```yaml
jobs:
  preview:
    uses: openclaw/clawhub/.github/workflows/skill-publish.yml@main
    with:
      dry_run: true
```

## Opublikuj Plugin

Opublikuj Plugin z folderu lokalnego, repozytorium GitHub, ref GitHub lub
istniejącego archiwum:

```bash
clawhub package publish <source> --family code-plugin --dry-run
clawhub package publish <source> --family code-plugin
```

Najpierw użyj `--dry-run`, aby zobaczyć podgląd rozwiązanych metadanych pakietu,
pól zgodności, atrybucji źródła i planu przesyłania bez publikowania.

Pluginy kodu muszą zawierać metadane zgodności OpenClaw w `package.json`,
w tym `openclaw.compat.pluginApi` i `openclaw.build.openclawVersion`.

## Sprawdź przed instalacją

Przed instalacją użyj strony webowej ClawHub lub poleceń szczegółów CLI, aby
sprawdzić metadane, linki do źródeł, wersje, dzienniki zmian i status skanowania:

```bash
clawhub inspect @openclaw/demo
clawhub package inspect <package>
```

Publiczne wpisy pokazują najnowszy stan skanowania. Wydania wstrzymane lub
zablokowane przez moderację mogą być ukryte w wyszukiwarce i powierzchniach
instalacji do czasu rozwiązania sprawy.
