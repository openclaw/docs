---
read_when:
    - Pierwsze użycie ClawHub
    - Instalowanie Skills lub Plugin z rejestru
    - Publikowanie w ClawHub
summary: 'Zacznij korzystać z ClawHub: znajduj, instaluj, aktualizuj i publikuj Skills lub pluginy.'
x-i18n:
    generated_at: "2026-07-03T01:05:24Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: f6d61bd32a359a843e68140cc90b4ff4bcc64645ea425ea4654c668d6d3d04ec
    source_path: clawhub/quickstart.md
    workflow: 16
---

# Szybki start

ClawHub to rejestr umiejętności i wtyczek OpenClaw.

Używaj OpenClaw, gdy instalujesz rzeczy w OpenClaw. Używaj CLI `clawhub`,
gdy logujesz się, publikujesz, zarządzasz własnymi wpisami albo korzystasz
z przepływów specyficznych dla rejestru.

## Znajdowanie i instalowanie umiejętności

Wyszukaj z poziomu OpenClaw:

```bash
openclaw skills search "calendar"
```

Zainstaluj umiejętność:

```bash
openclaw skills install @openclaw/demo
```

Zaktualizuj zainstalowane umiejętności:

```bash
openclaw skills update --all
```

OpenClaw zapisuje, skąd pochodzi umiejętność, aby późniejsze aktualizacje mogły nadal
rozwiązywać ją przez ClawHub.

## Znajdowanie i instalowanie wtyczki

Wyszukaj z poziomu OpenClaw:

```bash
openclaw plugins search "calendar"
```

Zainstaluj wtyczkę hostowaną w ClawHub z jawnym źródłem ClawHub:

```bash
openclaw plugins install clawhub:<package>
```

Zaktualizuj zainstalowane wtyczki:

```bash
openclaw plugins update --all
```

Użyj prefiksu `clawhub:`, gdy chcesz, aby OpenClaw rozwiązał pakiet przez
ClawHub zamiast npm lub innego źródła.

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

Środowiska bez interfejsu mogą użyć tokenu API z internetowego interfejsu ClawHub:

```bash
clawhub login --token clh_...
```

## Publikowanie umiejętności

Umiejętność to folder z wymaganym plikiem `SKILL.md` oraz opcjonalnymi plikami
pomocniczymi.

```bash
clawhub skill publish ./my-skill \
  --slug my-skill \
  --name "My Skill" \
  --changelog "Initial release"
```

Polecenie pomija niezmienioną zawartość. Nowe umiejętności zaczynają od `1.0.0`;
późniejsze zmiany automatycznie publikują następną wersję poprawkową. Użyj
`--dry-run`, aby zobaczyć podgląd, albo `--version`, aby wybrać jawną wersję.

Przed publikacją sprawdź metadane w `SKILL.md`. Zadeklaruj wymagane
zmienne środowiskowe, narzędzia i uprawnienia, aby użytkownicy mogli zrozumieć,
czego umiejętność potrzebuje, zanim ją zainstalują. Zobacz [Format umiejętności](/pl/clawhub/skill-format).

W przypadku repozytoriów zawierających wiele umiejętności wielokrotnego użytku przepływ GitHub wywołuje
`skill publish` dla każdego bezpośredniego folderu umiejętności w `skills/`:

```yaml
jobs:
  preview:
    uses: openclaw/clawhub/.github/workflows/skill-publish.yml@main
    with:
      dry_run: true
```

## Publikowanie wtyczki

Opublikuj wtyczkę z folderu lokalnego, repozytorium GitHub, refa GitHub albo
istniejącego archiwum:

```bash
clawhub package publish <source> --family code-plugin --dry-run
clawhub package publish <source> --family code-plugin
```

Najpierw użyj `--dry-run`, aby przed publikacją zobaczyć podgląd rozwiązanych metadanych pakietu, pól zgodności,
atrybucji źródła i planu przesyłania.

Wtyczki kodu muszą zawierać metadane zgodności OpenClaw w `package.json`,
w tym `openclaw.compat.pluginApi` i `openclaw.build.openclawVersion`.

## Sprawdzanie przed instalacją

Przed instalacją użyj strony internetowej ClawHub albo poleceń szczegółów w CLI,
aby sprawdzić metadane, linki źródłowe, wersje, dzienniki zmian i status skanowania:

```bash
clawhub inspect @openclaw/demo
clawhub package inspect <package>
```

Publiczne wpisy pokazują najnowszy stan skanowania. Wydania wstrzymane lub zablokowane przez
moderację mogą być ukryte w wyszukiwarce i powierzchniach instalacji do czasu rozwiązania sprawy.
