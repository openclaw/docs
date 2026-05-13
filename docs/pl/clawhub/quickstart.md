---
read_when:
    - Pierwsze użycie ClawHub
    - Instalowanie umiejętności lub Plugin z rejestru
    - Publikowanie w ClawHub
summary: 'Zacznij korzystać z ClawHub: znajduj, instaluj, aktualizuj i publikuj Skills lub plugins.'
x-i18n:
    generated_at: "2026-05-13T05:32:56Z"
    model: gpt-5.5
    provider: openai
    source_hash: c7345a51a6b4fc2348505cacdd687dbf789114efa06c92b8a27306da1c94557b
    source_path: clawhub/quickstart.md
    workflow: 16
---

# Szybki start

ClawHub to rejestr Skills i pluginów OpenClaw.

Używaj OpenClaw, gdy instalujesz rzeczy w OpenClaw. Używaj CLI `clawhub`,
gdy logujesz się, publikujesz, zarządzasz własnymi pozycjami lub korzystasz z
przepływów pracy specyficznych dla rejestru.

## Znajdź i zainstaluj Skill

Wyszukaj z poziomu OpenClaw:

```bash
openclaw skills search "calendar"
```

Zainstaluj Skill:

```bash
openclaw skills install <skill-slug>
```

Zaktualizuj zainstalowane Skills:

```bash
openclaw skills update --all
```

OpenClaw zapisuje, skąd pochodzi Skill, aby późniejsze aktualizacje mogły nadal
być rozwiązywane przez ClawHub.

## Znajdź i zainstaluj plugin

Wyszukaj z poziomu OpenClaw:

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

Używaj prefiksu `clawhub:`, gdy chcesz, aby OpenClaw rozwiązywał pakiet przez
ClawHub zamiast przez npm lub inne źródło.

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

Środowiska bezinterfejsowe mogą użyć tokena API z internetowego interfejsu ClawHub:

```bash
clawhub login --token clh_...
```

## Opublikuj Skill

Skill to folder z wymaganym plikiem `SKILL.md` i opcjonalnymi plikami
pomocniczymi.

```bash
clawhub skill publish ./my-skill \
  --slug my-skill \
  --name "My Skill" \
  --version 1.0.0 \
  --changelog "Initial release"
```

Przed publikacją sprawdź metadane w `SKILL.md`. Zadeklaruj wymagane zmienne
środowiskowe, narzędzia i uprawnienia, aby użytkownicy mogli zrozumieć, czego
Skill potrzebuje, zanim go zainstalują. Zobacz [Format Skill](/pl/clawhub/skill-format).

## Opublikuj plugin

Opublikuj plugin z folderu lokalnego, repozytorium GitHub, referencji GitHub lub
istniejącego archiwum:

```bash
clawhub package publish <source> --family code-plugin --dry-run
clawhub package publish <source> --family code-plugin
```

Najpierw użyj `--dry-run`, aby podejrzeć rozwiązane metadane pakietu, pola
zgodności, atrybucję źródła i plan przesyłania bez publikowania.

Pluginy kodu muszą zawierać metadane zgodności z OpenClaw w `package.json`,
w tym `openclaw.compat.pluginApi` i `openclaw.build.openclawVersion`.

## Synchronizuj utrzymywane przez siebie Skills

`sync` skanuje foldery Skills i publikuje nowe lub zmienione Skills, które nie są
jeszcze zsynchronizowane.

```bash
clawhub sync --all --dry-run
clawhub sync --all
```

Gdy jesteś zalogowany, `sync` może także wysłać minimalny zrzut instalacji na
potrzeby zbiorczych liczników instalacji. Zobacz [Telemetria](/pl/clawhub/telemetry),
aby dowiedzieć się, co jest raportowane i jak zrezygnować.

## Sprawdź przed instalacją

Przed instalacją użyj strony internetowej ClawHub lub poleceń szczegółów w CLI,
aby sprawdzić metadane, linki źródłowe, wersje, dzienniki zmian i stan skanowania:

```bash
clawhub inspect <skill-slug>
clawhub package inspect <package>
```

Publiczne pozycje pokazują najnowszy stan skanowania. Wydania wstrzymane lub
zablokowane przez moderację mogą być ukryte w wyszukiwarce i powierzchniach
instalacji do czasu rozwiązania problemu.
