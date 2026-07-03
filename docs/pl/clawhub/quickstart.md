---
read_when:
    - Pierwsze użycie ClawHub
    - Instalowanie Skills lub Plugin z rejestru
    - Publikowanie w ClawHub
summary: 'Zacznij korzystać z ClawHub: wyszukuj, instaluj, aktualizuj i publikuj Skills lub pluginy.'
x-i18n:
    generated_at: "2026-07-03T10:00:02Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: f6d61bd32a359a843e68140cc90b4ff4bcc64645ea425ea4654c668d6d3d04ec
    source_path: clawhub/quickstart.md
    workflow: 16
---

# Szybki start

ClawHub to rejestr Skills i pluginów OpenClaw.

Używaj OpenClaw, gdy instalujesz rzeczy w OpenClaw. Używaj CLI `clawhub`,
gdy się logujesz, publikujesz, zarządzasz własnymi listingami lub używasz
przepływów pracy specyficznych dla rejestru.

## Znajdź i zainstaluj skill

Wyszukaj z OpenClaw:

```bash
openclaw skills search "calendar"
```

Zainstaluj skill:

```bash
openclaw skills install @openclaw/demo
```

Zaktualizuj zainstalowane skills:

```bash
openclaw skills update --all
```

OpenClaw zapisuje, skąd pochodzi skill, aby późniejsze aktualizacje mogły nadal
rozwiązywać go przez ClawHub.

## Znajdź i zainstaluj plugin

Wyszukaj z OpenClaw:

```bash
openclaw plugins search "calendar"
```

Zainstaluj plugin hostowany w ClawHub z jawnym źródłem ClawHub:

```bash
openclaw plugins install clawhub:<package>
```

Zaktualizuj zainstalowane pluginy:

```bash
openclaw plugins update --all
```

Użyj prefiksu `clawhub:`, gdy chcesz, aby OpenClaw rozwiązał pakiet przez
ClawHub, a nie przez npm lub inne źródło.

## Zaloguj się, aby publikować

Zainstaluj CLI ClawHub:

```bash
npm i -g clawhub
# or
pnpm add -g clawhub
```

Zaloguj się przez GitHub:

```bash
clawhub login
clawhub whoami
```

Środowiska bez interfejsu graficznego mogą użyć tokenu API z internetowego UI ClawHub:

```bash
clawhub login --token clh_...
```

## Opublikuj skill

Skill to folder z wymaganym plikiem `SKILL.md` i opcjonalnymi plikami
pomocniczymi.

```bash
clawhub skill publish ./my-skill \
  --slug my-skill \
  --name "My Skill" \
  --changelog "Initial release"
```

Polecenie pomija niezmienioną zawartość. Nowe skills zaczynają od `1.0.0`; późniejsze zmiany
automatycznie publikują kolejną wersję poprawkową. Użyj `--dry-run`, aby wyświetlić podgląd, lub
`--version`, aby wybrać jawną wersję.

Przed publikacją sprawdź metadane w `SKILL.md`. Zadeklaruj wymagane
zmienne środowiskowe, narzędzia i uprawnienia, aby użytkownicy mogli zrozumieć, czego
skill potrzebuje przed instalacją. Zobacz [Format skill](/pl/clawhub/skill-format).

W przypadku repozytoriów zawierających wiele skills wielokrotnego użytku workflow GitHub wywołuje
`skill publish` dla każdego bezpośredniego folderu skill w katalogu `skills/`:

```yaml
jobs:
  preview:
    uses: openclaw/clawhub/.github/workflows/skill-publish.yml@main
    with:
      dry_run: true
```

## Opublikuj plugin

Opublikuj plugin z lokalnego folderu, repozytorium GitHub, referencji GitHub lub
istniejącego archiwum:

```bash
clawhub package publish <source> --family code-plugin --dry-run
clawhub package publish <source> --family code-plugin
```

Najpierw użyj `--dry-run`, aby podejrzeć rozstrzygnięte metadane pakietu, pola
zgodności, przypisanie źródła i plan przesyłania bez publikowania.

Pluginy kodu muszą zawierać metadane zgodności z OpenClaw w `package.json`,
w tym `openclaw.compat.pluginApi` i `openclaw.build.openclawVersion`.

## Sprawdź przed instalacją

Przed instalacją użyj strony internetowej ClawHub lub poleceń szczegółów CLI, aby sprawdzić
metadane, linki źródłowe, wersje, changelogi i status skanowania:

```bash
clawhub inspect @openclaw/demo
clawhub package inspect <package>
```

Publiczne listingi pokazują najnowszy stan skanowania. Wydania wstrzymane lub zablokowane przez
moderację mogą być ukryte w wyszukiwarce i powierzchniach instalacji do czasu rozwiązania sprawy.
