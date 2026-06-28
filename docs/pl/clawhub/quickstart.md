---
read_when:
    - Pierwsze użycie ClawHub
    - Instalowanie skillu lub Plugin z rejestru
    - Publikowanie w ClawHub
summary: 'Zacznij korzystać z ClawHub: znajduj, instaluj, aktualizuj i publikuj Skills lub Plugin.'
x-i18n:
    generated_at: "2026-06-28T10:03:24Z"
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

## Znajdowanie i instalowanie skill

Szukaj z OpenClaw:

```bash
openclaw skills search "calendar"
```

Zainstaluj skill:

```bash
openclaw skills install @openclaw/demo
```

Aktualizuj zainstalowane Skills:

```bash
openclaw skills update --all
```

OpenClaw zapisuje, skąd pochodzi skill, aby późniejsze aktualizacje mogły nadal
być rozwiązywane przez ClawHub.

## Znajdowanie i instalowanie plugina

Szukaj z OpenClaw:

```bash
openclaw plugins search "calendar"
```

Zainstaluj plugin hostowany w ClawHub z jawnym źródłem ClawHub:

```bash
openclaw plugins install clawhub:<package>
```

Aktualizuj zainstalowane pluginy:

```bash
openclaw plugins update --all
```

Używaj prefiksu `clawhub:`, gdy chcesz, aby OpenClaw rozwiązywał pakiet przez
ClawHub, a nie npm lub inne źródło.

## Logowanie do publikowania

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

Środowiska bezinterfejsowe mogą używać tokenu API z webowego UI ClawHub:

```bash
clawhub login --token clh_...
```

## Publikowanie skill

Skill to folder z wymaganym plikiem `SKILL.md` i opcjonalnymi plikami
pomocniczymi.

```bash
clawhub skill publish ./my-skill \
  --slug my-skill \
  --name "My Skill" \
  --changelog "Initial release"
```

Polecenie pomija niezmienioną zawartość. Nowe Skills zaczynają od `1.0.0`;
późniejsze zmiany automatycznie publikują następną wersję poprawkową. Użyj
`--dry-run`, aby podejrzeć wynik, lub `--version`, aby wybrać jawną wersję.

Przed publikacją sprawdź metadane w `SKILL.md`. Zadeklaruj wymagane zmienne
środowiskowe, narzędzia i uprawnienia, aby użytkownicy mogli zrozumieć, czego
potrzebuje skill, zanim go zainstalują. Zobacz [Format skill](/pl/clawhub/skill-format).

W przypadku repozytoriów zawierających wiele Skills wielokrotnego użytku
workflow GitHub wywołuje `skill publish` dla każdego bezpośredniego folderu
skill w `skills/`:

```yaml
jobs:
  preview:
    uses: openclaw/clawhub/.github/workflows/skill-publish.yml@main
    with:
      dry_run: true
```

## Publikowanie plugina

Opublikuj plugin z lokalnego folderu, repozytorium GitHub, ref GitHub lub
istniejącego archiwum:

```bash
clawhub package publish <source> --family code-plugin --dry-run
clawhub package publish <source> --family code-plugin
```

Najpierw użyj `--dry-run`, aby podejrzeć rozwiązane metadane pakietu, pola
zgodności, atrybucję źródła i plan przesyłania bez publikowania.

Pluginy kodu muszą zawierać metadane zgodności z OpenClaw w `package.json`,
w tym `openclaw.compat.pluginApi` i `openclaw.build.openclawVersion`.

## Sprawdzanie przed instalacją

Przed instalacją użyj strony webowej ClawHub lub poleceń CLI pokazujących
szczegóły, aby sprawdzić metadane, linki źródłowe, wersje, dzienniki zmian i
stan skanowania:

```bash
clawhub inspect @openclaw/demo
clawhub package inspect <package>
```

Publiczne listingi pokazują najnowszy stan skanowania. Wydania wstrzymane lub
zablokowane przez moderację mogą być ukryte w wyszukiwarce i powierzchniach
instalacji do czasu rozwiązania sprawy.
