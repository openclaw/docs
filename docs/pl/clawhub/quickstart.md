---
read_when:
    - Pierwsze użycie ClawHub
    - Instalowanie umiejętności lub Plugin z rejestru
    - Publikowanie w ClawHub
summary: 'Zacznij korzystać z ClawHub: znajduj, instaluj, aktualizuj i publikuj Skills lub pluginy.'
x-i18n:
    generated_at: "2026-05-12T12:49:45Z"
    model: gpt-5.5
    provider: openai
    source_hash: c7345a51a6b4fc2348505cacdd687dbf789114efa06c92b8a27306da1c94557b
    source_path: clawhub/quickstart.md
    workflow: 16
---

# Szybki start

ClawHub to rejestr Skills i plugins dla OpenClaw.

Używaj OpenClaw, gdy instalujesz elementy w OpenClaw. Używaj CLI `clawhub`,
gdy logujesz się, publikujesz, zarządzasz własnymi wpisami lub korzystasz z
przepływów pracy specyficznych dla rejestru.

## Znajdź i zainstaluj Skills

Wyszukaj z poziomu OpenClaw:

```bash
openclaw skills search "calendar"
```

Zainstaluj Skills:

```bash
openclaw skills install <skill-slug>
```

Zaktualizuj zainstalowane Skills:

```bash
openclaw skills update --all
```

OpenClaw zapisuje, skąd pochodził dany Skills, aby późniejsze aktualizacje mogły
nadal być rozwiązywane przez ClawHub.

## Znajdź i zainstaluj Plugin

Wyszukaj z poziomu OpenClaw:

```bash
openclaw plugins search "calendar"
```

Zainstaluj Plugin hostowany w ClawHub z jawnym źródłem ClawHub:

```bash
openclaw plugins install clawhub:<package>
```

Zaktualizuj zainstalowane plugins:

```bash
openclaw plugins update --all
```

Użyj prefiksu `clawhub:`, gdy chcesz, aby OpenClaw rozwiązywał pakiet przez
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

Środowiska bez interfejsu graficznego mogą użyć tokenu API z interfejsu webowego ClawHub:

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
  --version 1.0.0 \
  --changelog "Initial release"
```

Przed publikacją sprawdź metadane w `SKILL.md`. Zadeklaruj wymagane zmienne
środowiskowe, narzędzia i uprawnienia, aby użytkownicy mogli zrozumieć, czego
wymaga Skills przed instalacją. Zobacz [Format Skills](/pl/clawhub/skill-format).

## Opublikuj Plugin

Opublikuj Plugin z lokalnego folderu, repozytorium GitHub, referencji GitHub lub
istniejącego archiwum:

```bash
clawhub package publish <source> --family code-plugin --dry-run
clawhub package publish <source> --family code-plugin
```

Najpierw użyj `--dry-run`, aby podejrzeć rozwiązane metadane pakietu, pola
zgodności, przypisanie źródła i plan przesyłania bez publikowania.

Plugins kodu muszą zawierać metadane zgodności OpenClaw w `package.json`,
w tym `openclaw.compat.pluginApi` i `openclaw.build.openclawVersion`.

## Synchronizuj Skills, które utrzymujesz

`sync` skanuje foldery Skills i publikuje nowe lub zmienione Skills, które nie są
jeszcze zsynchronizowane.

```bash
clawhub sync --all --dry-run
clawhub sync --all
```

Gdy jesteś zalogowany, `sync` może również wysłać minimalny zrzut instalacji na
potrzeby zagregowanych liczników instalacji. Zobacz [Telemetria](/pl/clawhub/telemetry), aby sprawdzić, co jest raportowane
i jak zrezygnować.

## Sprawdź przed instalacją

Przed instalacją użyj strony webowej ClawHub lub poleceń szczegółów CLI, aby
sprawdzić metadane, linki źródłowe, wersje, dzienniki zmian i status skanowania:

```bash
clawhub inspect <skill-slug>
clawhub package inspect <package>
```

Publiczne wpisy pokazują najnowszy stan skanowania. Wydania wstrzymane lub
zablokowane przez moderację mogą być ukryte w wyszukiwaniu i powierzchniach
instalacji do czasu rozwiązania sprawy.
