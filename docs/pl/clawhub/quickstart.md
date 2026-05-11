---
read_when:
    - Pierwsze użycie ClawHub
    - Instalowanie umiejętności lub Pluginu z rejestru
    - Publikowanie w ClawHub
summary: 'Zacznij korzystać z ClawHub: znajdź, zainstaluj, zaktualizuj i opublikuj Skills lub pluginy.'
x-i18n:
    generated_at: "2026-05-11T22:19:39Z"
    model: gpt-5.5
    provider: openai
    source_hash: c7345a51a6b4fc2348505cacdd687dbf789114efa06c92b8a27306da1c94557b
    source_path: clawhub/quickstart.md
    workflow: 16
---

# Szybki start

ClawHub to rejestr umiejętności i pluginów OpenClaw.

Używaj OpenClaw, gdy instalujesz rzeczy w OpenClaw. Używaj CLI `clawhub`,
gdy się logujesz, publikujesz, zarządzasz własnymi wpisami lub korzystasz z
przepływów specyficznych dla rejestru.

## Znajdź i zainstaluj umiejętność

Wyszukaj z OpenClaw:

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

Użyj prefiksu `clawhub:`, gdy chcesz, aby OpenClaw rozwiązywał pakiet przez
ClawHub zamiast przez npm lub inne źródło.

## Zaloguj się do publikowania

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

Opublikuj plugin z lokalnego folderu, repozytorium GitHub, referencji GitHub lub
istniejącego archiwum:

```bash
clawhub package publish <source> --family code-plugin --dry-run
clawhub package publish <source> --family code-plugin
```

Najpierw użyj `--dry-run`, aby podejrzeć rozpoznane metadane pakietu, pola
zgodności, przypisanie źródła i plan przesyłania bez publikowania.

Pluginy kodu muszą zawierać metadane zgodności z OpenClaw w `package.json`,
w tym `openclaw.compat.pluginApi` i `openclaw.build.openclawVersion`.

## Synchronizuj utrzymywane umiejętności

`sync` skanuje foldery umiejętności i publikuje nowe lub zmienione umiejętności, które nie są
jeszcze zsynchronizowane.

```bash
clawhub sync --all --dry-run
clawhub sync --all
```

Gdy jesteś zalogowany, `sync` może również wysłać minimalną migawkę instalacji na potrzeby
zbiorczych liczników instalacji. Zobacz [Telemetria](/pl/clawhub/telemetry), aby dowiedzieć się, co jest zgłaszane
i jak z tego zrezygnować.

## Sprawdź przed instalacją

Przed instalacją użyj strony internetowej ClawHub lub poleceń szczegółów CLI, aby sprawdzić
metadane, linki źródłowe, wersje, dzienniki zmian i status skanowania:

```bash
clawhub inspect <skill-slug>
clawhub package inspect <package>
```

Publiczne wpisy pokazują najnowszy stan skanowania. Wydania wstrzymane lub zablokowane przez
moderację mogą być ukryte w wyszukiwaniu i powierzchniach instalacji do czasu rozwiązania sprawy.
