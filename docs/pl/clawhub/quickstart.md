---
read_when:
    - Pierwsze użycie ClawHub
    - Instalowanie Skills lub Pluginu z rejestru
    - Publikowanie w ClawHub
summary: 'Zacznij korzystać z ClawHub: wyszukuj, instaluj, aktualizuj i publikuj Skills lub pluginy.'
x-i18n:
    generated_at: "2026-07-12T14:52:44Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: f6d61bd32a359a843e68140cc90b4ff4bcc64645ea425ea4654c668d6d3d04ec
    source_path: clawhub/quickstart.md
    workflow: 16
---

# Szybki start

ClawHub to rejestr Skills i Pluginów dla OpenClaw.

Używaj OpenClaw podczas instalowania elementów w OpenClaw. Używaj CLI `clawhub`,
gdy się logujesz, publikujesz, zarządzasz własnymi pozycjami lub korzystasz
z przepływów pracy właściwych dla rejestru.

## Znajdowanie i instalowanie Skill

Wyszukaj za pomocą OpenClaw:

```bash
openclaw skills search "calendar"
```

Zainstaluj Skill:

```bash
openclaw skills install @openclaw/demo
```

Zaktualizuj zainstalowane Skills:

```bash
openclaw skills update --all
```

OpenClaw zapisuje źródło Skill, dzięki czemu późniejsze aktualizacje mogą nadal
rozpoznawać go za pośrednictwem ClawHub.

## Znajdowanie i instalowanie Pluginu

Wyszukaj za pomocą OpenClaw:

```bash
openclaw plugins search "calendar"
```

Zainstaluj Plugin hostowany w ClawHub, podając jawnie źródło ClawHub:

```bash
openclaw plugins install clawhub:<package>
```

Zaktualizuj zainstalowane Pluginy:

```bash
openclaw plugins update --all
```

Użyj prefiksu `clawhub:`, jeśli chcesz, aby OpenClaw rozpoznał pakiet za
pośrednictwem ClawHub zamiast npm lub innego źródła.

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

Środowiska bez interfejsu graficznego mogą używać tokenu API z interfejsu
internetowego ClawHub:

```bash
clawhub login --token clh_...
```

## Publikowanie Skill

Skill to folder z wymaganym plikiem `SKILL.md` i opcjonalnymi plikami
pomocniczymi.

```bash
clawhub skill publish ./my-skill \
  --slug my-skill \
  --name "My Skill" \
  --changelog "Initial release"
```

Polecenie pomija niezmienioną zawartość. Nowe Skills zaczynają od wersji `1.0.0`;
późniejsze zmiany automatycznie publikują kolejną wersję poprawkową. Użyj
`--dry-run`, aby wyświetlić podgląd, lub `--version`, aby wybrać konkretną wersję.

Przed opublikowaniem sprawdź metadane w pliku `SKILL.md`. Zadeklaruj wymagane
zmienne środowiskowe, narzędzia i uprawnienia, aby użytkownicy mogli zrozumieć,
czego potrzebuje Skill, zanim go zainstalują. Zobacz [Format Skill](/pl/clawhub/skill-format).

W repozytoriach zawierających wiele Skills przepływ pracy GitHub wielokrotnego
użytku wywołuje `skill publish` dla każdego bezpośredniego folderu Skill
w katalogu `skills/`:

```yaml
jobs:
  preview:
    uses: openclaw/clawhub/.github/workflows/skill-publish.yml@main
    with:
      dry_run: true
```

## Publikowanie Pluginu

Opublikuj Plugin z folderu lokalnego, repozytorium GitHub, odwołania GitHub lub
istniejącego archiwum:

```bash
clawhub package publish <source> --family code-plugin --dry-run
clawhub package publish <source> --family code-plugin
```

Najpierw użyj `--dry-run`, aby bez publikowania wyświetlić podgląd rozpoznanych
metadanych pakietu, pól zgodności, informacji o źródle i planu przesyłania.

Pluginy kodu muszą zawierać metadane zgodności z OpenClaw w pliku `package.json`,
w tym `openclaw.compat.pluginApi` i `openclaw.build.openclawVersion`.

## Sprawdzanie przed instalacją

Przed instalacją użyj strony internetowej ClawHub lub poleceń CLI wyświetlających
szczegóły, aby sprawdzić metadane, odnośniki do źródeł, wersje, dzienniki zmian
i stan skanowania:

```bash
clawhub inspect @openclaw/demo
clawhub package inspect <package>
```

Publiczne pozycje pokazują najnowszy stan skanowania. Wydania wstrzymane lub
zablokowane przez moderację mogą być ukryte w wynikach wyszukiwania i interfejsach
instalacji do czasu rozwiązania problemu.
