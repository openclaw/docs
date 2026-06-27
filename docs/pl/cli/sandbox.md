---
read_when: You are managing sandbox runtimes or debugging sandbox/tool-policy behavior.
status: active
summary: Zarządzaj środowiskami wykonawczymi sandbox i sprawdzaj obowiązującą politykę sandbox
title: CLI piaskownicy
x-i18n:
    generated_at: "2026-06-27T17:22:57Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: eeba1a5530bb946b334cfe399b7a0c862694ae47c55b2341d7146333e112602a
    source_path: cli/sandbox.md
    workflow: 16
---

Zarządzaj środowiskami wykonawczymi sandbox do izolowanego uruchamiania agentów.

## Omówienie

OpenClaw może uruchamiać agentów w izolowanych środowiskach wykonawczych sandbox ze względów bezpieczeństwa. Polecenia `sandbox` pomagają sprawdzać i odtwarzać te środowiska po aktualizacjach lub zmianach konfiguracji.

Obecnie zwykle oznacza to:

- kontenery sandbox Docker
- środowiska wykonawcze sandbox SSH, gdy `agents.defaults.sandbox.backend = "ssh"`
- środowiska wykonawcze sandbox OpenShell, gdy `agents.defaults.sandbox.backend = "openshell"`

Dla `ssh` i OpenShell `remote` odtworzenie ma większe znaczenie niż w przypadku Docker:

- zdalny obszar roboczy jest kanoniczny po początkowym zasianiu
- `openclaw sandbox recreate` usuwa ten kanoniczny zdalny obszar roboczy dla wybranego zakresu
- następne użycie ponownie zasiewa go z bieżącego lokalnego obszaru roboczego

## Polecenia

### `openclaw sandbox explain`

Sprawdź **efektywny** tryb/zakres/dostęp do obszaru roboczego sandbox, politykę narzędzi sandbox oraz bramki podwyższonych uprawnień (ze ścieżkami kluczy konfiguracji do naprawy).

```bash
openclaw sandbox explain
openclaw sandbox explain --session agent:main:main
openclaw sandbox explain --agent work
openclaw sandbox explain --json
```

### `openclaw sandbox list`

Wyświetl wszystkie środowiska wykonawcze sandbox wraz z ich stanem i konfiguracją.

```bash
openclaw sandbox list
openclaw sandbox list --browser  # List only browser containers
openclaw sandbox list --json     # JSON output
```

**Dane wyjściowe zawierają:**

- Nazwę i stan środowiska wykonawczego
- Backend (`docker`, `openshell` itd.)
- Etykietę konfiguracji oraz informację, czy pasuje do bieżącej konfiguracji
- Wiek (czas od utworzenia)
- Czas bezczynności (czas od ostatniego użycia)
- Powiązaną sesję/agenta

### `openclaw sandbox recreate`

Usuń środowiska wykonawcze sandbox, aby wymusić ich odtworzenie ze zaktualizowaną konfiguracją.

```bash
openclaw sandbox recreate --all                # Recreate all containers
openclaw sandbox recreate --session main       # Specific session
openclaw sandbox recreate --agent mybot        # Specific agent
openclaw sandbox recreate --browser            # Only browser containers
openclaw sandbox recreate --all --force        # Skip confirmation
```

**Opcje:**

- `--all`: Odtwórz wszystkie kontenery sandbox
- `--session <key>`: Odtwórz kontener dla określonej sesji
- `--agent <id>`: Odtwórz kontenery dla określonego agenta
- `--browser`: Odtwórz tylko kontenery przeglądarki
- `--force`: Pomiń monit o potwierdzenie

<Note>
Środowiska wykonawcze są automatycznie odtwarzane przy następnym użyciu agenta.
</Note>

## Przypadki użycia

### Po zaktualizowaniu obrazu Docker

```bash
# Pull new image
docker pull openclaw-sandbox:latest
docker tag openclaw-sandbox:latest openclaw-sandbox:bookworm-slim

# Update config to use new image
# Edit config: agents.defaults.sandbox.docker.image (or agents.list[].sandbox.docker.image)

# Recreate containers
openclaw sandbox recreate --all
```

### Po zmianie konfiguracji sandbox

```bash
# Edit config: agents.defaults.sandbox.* (or agents.list[].sandbox.*)

# Recreate to apply new config
openclaw sandbox recreate --all
```

### Po zmianie celu SSH lub materiału uwierzytelniania SSH

```bash
# Edit config:
# - agents.defaults.sandbox.backend
# - agents.defaults.sandbox.ssh.target
# - agents.defaults.sandbox.ssh.workspaceRoot
# - agents.defaults.sandbox.ssh.identityFile / certificateFile / knownHostsFile
# - agents.defaults.sandbox.ssh.identityData / certificateData / knownHostsData

openclaw sandbox recreate --all
```

Dla podstawowego backendu `ssh` odtworzenie usuwa główny katalog zdalnego obszaru roboczego dla danego zakresu
na celu SSH. Następne uruchomienie ponownie zasiewa go z lokalnego obszaru roboczego.

### Po zmianie źródła, polityki lub trybu OpenShell

```bash
# Edit config:
# - agents.defaults.sandbox.backend
# - plugins.entries.openshell.config.from
# - plugins.entries.openshell.config.mode
# - plugins.entries.openshell.config.policy

openclaw sandbox recreate --all
```

W trybie OpenShell `remote` odtworzenie usuwa kanoniczny zdalny obszar roboczy
dla tego zakresu. Następne uruchomienie ponownie zasiewa go z lokalnego obszaru roboczego.

### Po zmianie setupCommand

```bash
openclaw sandbox recreate --all
# or just one agent:
openclaw sandbox recreate --agent family
```

### Tylko dla określonego agenta

```bash
# Update only one agent's containers
openclaw sandbox recreate --agent alfred
```

## Dlaczego jest to potrzebne

Gdy aktualizujesz konfigurację sandbox:

- Istniejące środowiska wykonawcze nadal działają ze starymi ustawieniami.
- Środowiska wykonawcze są usuwane dopiero po 24 godzinach bezczynności.
- Regularnie używani agenci utrzymują stare środowiska wykonawcze aktywne bezterminowo.

Użyj `openclaw sandbox recreate`, aby wymusić usunięcie starych środowisk wykonawczych. Zostaną one automatycznie odtworzone z bieżącymi ustawieniami, gdy będą następnym razem potrzebne.

<Tip>
Preferuj `openclaw sandbox recreate` zamiast ręcznego czyszczenia specyficznego dla backendu. Polecenie używa rejestru środowisk wykonawczych Gateway i unika niezgodności, gdy zmieniają się klucze zakresu lub sesji.
</Tip>

## Migracja rejestru

OpenClaw przechowuje metadane środowisk wykonawczych sandbox we współdzielonej bazie stanu SQLite. Starsze instalacje mogą nadal mieć starsze pliki rejestru sandbox:

- `~/.openclaw/sandbox/containers.json`
- `~/.openclaw/sandbox/browsers.json`

Niektóre aktualizacje mogą także mieć po jednym fragmencie JSON na kontener/przeglądarkę w `~/.openclaw/sandbox/containers/` lub `~/.openclaw/sandbox/browsers/`. Zwykłe odczyty środowisk wykonawczych sandbox nie przepisują tych starszych źródeł. Uruchom `openclaw doctor --fix`, aby zmigrować prawidłowe starsze wpisy do SQLite. Nieprawidłowe starsze pliki są poddawane kwarantannie, aby jeden błędny stary rejestr nie mógł ukryć bieżących wpisów środowisk wykonawczych.

## Konfiguracja

Ustawienia sandbox znajdują się w `~/.openclaw/openclaw.json` w sekcji `agents.defaults.sandbox` (nadpisania dla poszczególnych agentów trafiają do `agents.list[].sandbox`):

```jsonc
{
  "agents": {
    "defaults": {
      "sandbox": {
        "mode": "all", // off, non-main, all
        "backend": "docker", // docker, ssh, openshell
        "scope": "agent", // session, agent, shared
        "docker": {
          "image": "openclaw-sandbox:bookworm-slim",
          "containerPrefix": "openclaw-sbx-",
          // ... more Docker options
        },
        "prune": {
          "idleHours": 24, // Auto-prune after 24h idle
          "maxAgeDays": 7, // Auto-prune after 7 days
        },
      },
    },
  },
}
```

## Powiązane

- [Dokumentacja CLI](/pl/cli)
- [Sandboxing](/pl/gateway/sandboxing)
- [Obszar roboczy agenta](/pl/concepts/agent-workspace)
- [Doctor](/pl/gateway/doctor): sprawdza konfigurację sandbox.
