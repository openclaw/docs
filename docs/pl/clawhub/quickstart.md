---
read_when:
    - Pierwsze użycie ClawHub
    - Instalowanie umiejętności lub Plugin z rejestru
    - Publikowanie w ClawHub
summary: 'Zacznij korzystać z ClawHub: znajduj, instaluj, aktualizuj i publikuj Skills lub pluginy.'
x-i18n:
    generated_at: "2026-05-11T20:24:50Z"
    model: gpt-5.5
    provider: openai
    source_hash: c7345a51a6b4fc2348505cacdd687dbf789114efa06c92b8a27306da1c94557b
    source_path: clawhub/quickstart.md
    workflow: 16
---

# Szybki start

ClawHub to rejestr umiejętności i pluginów dla OpenClaw.

Używaj OpenClaw, gdy instalujesz rzeczy w OpenClaw. Używaj CLI `clawhub`,
gdy logujesz się, publikujesz, zarządzasz własnymi wpisami lub korzystasz
z przepływów pracy specyficznych dla rejestru.

## Znajdź i zainstaluj umiejętność

Wyszukaj z poziomu OpenClaw:

```bash
openclaw skills search "calendar"
```

Zainstaluj umiejętność:

```bash
openclaw skills install <skill-slug>
```

Zaktualizuj zainstalowane umiejętności:

```bash
openclaw skills update --all
```

OpenClaw zapisuje, skąd pochodzi umiejętność, aby późniejsze aktualizacje mogły nadal
rozwiązywać ją przez ClawHub.

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

Środowiska bez interfejsu mogą użyć tokenu API z webowego interfejsu ClawHub:

```bash
clawhub login --token clh_...
```

## Opublikuj umiejętność

Umiejętność to folder z wymaganym plikiem `SKILL.md` i opcjonalnymi plikami
pomocniczymi.

```bash
clawhub skill publish ./my-skill \
  --slug my-skill \
  --name "My Skill" \
  --version 1.0.0 \
  --changelog "Initial release"
```

Przed publikacją sprawdź metadane w `SKILL.md`. Zadeklaruj wymagane
zmienne środowiskowe, narzędzia i uprawnienia, aby użytkownicy mogli zrozumieć, czego
umiejętność potrzebuje, zanim ją zainstalują. Zobacz [Format umiejętności](/pl/clawhub/skill-format).

## Opublikuj plugin

Opublikuj plugin z lokalnego folderu, repozytorium GitHub, referencji GitHub albo
istniejącego archiwum:

```bash
clawhub package publish <source> --family code-plugin --dry-run
clawhub package publish <source> --family code-plugin
```

Najpierw użyj `--dry-run`, aby podejrzeć rozpoznane metadane pakietu, pola
zgodności, atrybucję źródła i plan przesyłania bez publikowania.

Pluginy kodu muszą zawierać metadane zgodności z OpenClaw w `package.json`,
w tym `openclaw.compat.pluginApi` i `openclaw.build.openclawVersion`.

## Synchronizuj umiejętności, które utrzymujesz

`sync` skanuje foldery umiejętności i publikuje nowe lub zmienione umiejętności, które nie są
jeszcze zsynchronizowane.

```bash
clawhub sync --all --dry-run
clawhub sync --all
```

Gdy jesteś zalogowany, `sync` może też wysłać minimalny zrzut instalacji na potrzeby
zbiorczych liczników instalacji. Zobacz [Telemetria](/pl/clawhub/telemetry), aby dowiedzieć się, co jest raportowane
i jak z tego zrezygnować.

## Sprawdź przed instalacją

Przed instalacją użyj strony internetowej ClawHub albo poleceń szczegółów w CLI, aby sprawdzić
metadane, linki źródłowe, wersje, dzienniki zmian i stan skanowania:

```bash
clawhub inspect <skill-slug>
clawhub package inspect <package>
```

Publiczne wpisy pokazują najnowszy stan skanowania. Wydania wstrzymane lub zablokowane przez
moderację mogą być ukryte w wyszukiwarce i powierzchniach instalacji do czasu rozwiązania problemu.
