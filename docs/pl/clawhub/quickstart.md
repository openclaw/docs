---
read_when:
    - Pierwsze użycie ClawHub
    - Instalowanie Skills lub Plugin z rejestru
    - Publikowanie w ClawHub
summary: 'Zacznij korzystać z ClawHub: wyszukuj, instaluj, aktualizuj i publikuj Skills lub pluginy.'
x-i18n:
    generated_at: "2026-07-16T18:09:07Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: f6d61bd32a359a843e68140cc90b4ff4bcc64645ea425ea4654c668d6d3d04ec
    source_path: clawhub/quickstart.md
    workflow: 16
---

# Szybki start

ClawHub jest rejestrem Skills i pluginów dla OpenClaw.

Używaj OpenClaw podczas instalowania elementów w OpenClaw. Używaj CLI `clawhub`
podczas logowania, publikowania, zarządzania własnymi wpisami lub korzystania
z przepływów pracy specyficznych dla rejestru.

## Znajdowanie i instalowanie Skills

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

OpenClaw zapisuje źródło Skills, aby późniejsze aktualizacje mogły nadal
odbywać się za pośrednictwem ClawHub.

## Znajdowanie i instalowanie pluginu

Wyszukaj z poziomu OpenClaw:

```bash
openclaw plugins search "calendar"
```

Zainstaluj plugin hostowany w ClawHub, jawnie wskazując ClawHub jako źródło:

```bash
openclaw plugins install clawhub:<package>
```

Zaktualizuj zainstalowane pluginy:

```bash
openclaw plugins update --all
```

Użyj prefiksu `clawhub:`, aby OpenClaw rozwiązał pakiet za pośrednictwem
ClawHub zamiast npm lub innego źródła.

## Logowanie w celu publikowania

Zainstaluj CLI ClawHub:

```bash
npm i -g clawhub
# lub
pnpm add -g clawhub
```

Zaloguj się za pomocą GitHub:

```bash
clawhub login
clawhub whoami
```

W środowiskach bez interfejsu graficznego można użyć tokenu API z internetowego interfejsu ClawHub:

```bash
clawhub login --token clh_...
```

## Publikowanie Skills

Skills to folder z wymaganym plikiem `SKILL.md` i opcjonalnymi plikami
pomocniczymi.

```bash
clawhub skill publish ./my-skill \
  --slug my-skill \
  --name "My Skill" \
  --changelog "Initial release"
```

Polecenie pomija niezmienioną zawartość. Nowe Skills zaczynają od `1.0.0`; późniejsze zmiany
automatycznie publikują następną wersję poprawkową. Użyj `--dry-run`, aby wyświetlić podgląd, lub
`--version`, aby wybrać konkretną wersję.

Przed publikacją sprawdź metadane w `SKILL.md`. Zadeklaruj wymagane
zmienne środowiskowe, narzędzia i uprawnienia, aby użytkownicy mogli zrozumieć, czego
potrzebują Skills przed ich instalacją. Zobacz [Format Skills](/pl/clawhub/skill-format).

W przypadku repozytoriów zawierających wiele Skills przepływ pracy GitHub wielokrotnego użytku wywołuje
`skill publish` dla każdego bezpośredniego folderu Skills w `skills/`:

```yaml
jobs:
  preview:
    uses: openclaw/clawhub/.github/workflows/skill-publish.yml@main
    with:
      dry_run: true
```

## Publikowanie pluginu

Opublikuj plugin z folderu lokalnego, repozytorium GitHub, odwołania GitHub lub
istniejącego archiwum:

```bash
clawhub package publish <source> --family code-plugin --dry-run
clawhub package publish <source> --family code-plugin
```

Najpierw użyj `--dry-run`, aby bez publikowania wyświetlić podgląd rozwiązanych metadanych pakietu, pól
zgodności, informacji o źródle i planu przesyłania.

Pluginy kodu muszą zawierać metadane zgodności z OpenClaw w `package.json`,
w tym `openclaw.compat.pluginApi` i `openclaw.build.openclawVersion`.

## Sprawdzanie przed instalacją

Przed instalacją użyj strony internetowej ClawHub lub poleceń szczegółowych CLI, aby sprawdzić
metadane, łącza do źródeł, wersje, dzienniki zmian i stan skanowania:

```bash
clawhub inspect @openclaw/demo
clawhub package inspect <package>
```

Publiczne wpisy pokazują najnowszy stan skanowania. Wydania wstrzymane lub zablokowane przez
moderację mogą być ukryte w wynikach wyszukiwania i interfejsach instalacji do czasu rozwiązania problemu.
