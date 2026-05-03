---
read_when: You are managing sandbox runtimes or debugging sandbox/tool-policy behavior.
status: active
summary: Zarządzaj środowiskami uruchomieniowymi piaskownicy i sprawdzaj obowiązującą politykę piaskownicy
title: CLI piaskownicy
x-i18n:
    generated_at: "2026-05-03T21:28:59Z"
    model: gpt-5.5
    provider: openai
    source_hash: c50b97c35ba8cd79416de6a167a7cbc313d063b320db7deafd42f7a570e507ac
    source_path: cli/sandbox.md
    workflow: 16
---

Zarządzaj środowiskami uruchomieniowymi sandbox na potrzeby izolowanego wykonywania agentów.

## Omówienie

OpenClaw może uruchamiać agentów w izolowanych środowiskach uruchomieniowych sandbox dla bezpieczeństwa. Polecenia `sandbox` pomagają sprawdzać i odtwarzać te środowiska po aktualizacjach lub zmianach konfiguracji.

Obecnie zwykle oznacza to:

- Kontenery sandbox Docker
- Środowiska uruchomieniowe sandbox SSH, gdy `agents.defaults.sandbox.backend = "ssh"`
- Środowiska uruchomieniowe sandbox OpenShell, gdy `agents.defaults.sandbox.backend = "openshell"`

Dla `ssh` i OpenShell `remote` odtworzenie ma większe znaczenie niż w przypadku Docker:

- zdalny obszar roboczy jest kanoniczny po początkowym zasianiu
- `openclaw sandbox recreate` usuwa ten kanoniczny zdalny obszar roboczy dla wybranego zakresu
- następne użycie ponownie zasiewa go z bieżącego lokalnego obszaru roboczego

## Polecenia

### `openclaw sandbox explain`

Sprawdź **efektywny** tryb/zakres/dostęp do obszaru roboczego sandbox, politykę narzędzi sandbox oraz bramki podniesionych uprawnień (ze ścieżkami kluczy konfiguracji do naprawy).

```bash
openclaw sandbox explain
openclaw sandbox explain --session agent:main:main
openclaw sandbox explain --agent work
openclaw sandbox explain --json
```

### `openclaw sandbox list`

Wyświetl wszystkie środowiska uruchomieniowe sandbox wraz z ich stanem i konfiguracją.

```bash
openclaw sandbox list
openclaw sandbox list --browser  # List only browser containers
openclaw sandbox list --json     # JSON output
```

**Dane wyjściowe obejmują:**

- Nazwę i stan środowiska uruchomieniowego
- Backend (`docker`, `openshell` itd.)
- Etykietę konfiguracji i informację, czy pasuje do bieżącej konfiguracji
- Wiek (czas od utworzenia)
- Czas bezczynności (czas od ostatniego użycia)
- Powiązaną sesję/agenta

### `openclaw sandbox recreate`

Usuń środowiska uruchomieniowe sandbox, aby wymusić ich odtworzenie ze zaktualizowaną konfiguracją.

```bash
openclaw sandbox recreate --all                # Recreate all containers
openclaw sandbox recreate --session main       # Specific session
openclaw sandbox recreate --agent mybot        # Specific agent
openclaw sandbox recreate --browser            # Only browser containers
openclaw sandbox recreate --all --force        # Skip confirmation
```

**Opcje:**

- `--all`: Odtwórz wszystkie kontenery sandbox
- `--session <key>`: Odtwórz kontener dla konkretnej sesji
- `--agent <id>`: Odtwórz kontenery dla konkretnego agenta
- `--browser`: Odtwórz tylko kontenery przeglądarki
- `--force`: Pomiń monit o potwierdzenie

<Note>
Środowiska uruchomieniowe są automatycznie odtwarzane przy następnym użyciu agenta.
</Note>

## Przypadki użycia

### Po aktualizacji obrazu Docker

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

### Po zmianie celu SSH lub materiałów uwierzytelniania SSH

```bash
# Edit config:
# - agents.defaults.sandbox.backend
# - agents.defaults.sandbox.ssh.target
# - agents.defaults.sandbox.ssh.workspaceRoot
# - agents.defaults.sandbox.ssh.identityFile / certificateFile / knownHostsFile
# - agents.defaults.sandbox.ssh.identityData / certificateData / knownHostsData

openclaw sandbox recreate --all
```

Dla podstawowego backendu `ssh` odtworzenie usuwa zdalny katalog główny obszaru roboczego dla danego zakresu
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

### Tylko dla konkretnego agenta

```bash
# Update only one agent's containers
openclaw sandbox recreate --agent alfred
```

## Dlaczego jest to potrzebne

Gdy aktualizujesz konfigurację sandbox:

- Istniejące środowiska uruchomieniowe nadal działają ze starymi ustawieniami.
- Środowiska uruchomieniowe są usuwane dopiero po 24 godzinach bezczynności.
- Regularnie używani agenci utrzymują stare środowiska uruchomieniowe aktywne bezterminowo.

Użyj `openclaw sandbox recreate`, aby wymusić usunięcie starych środowisk uruchomieniowych. Zostaną one automatycznie odtworzone z bieżącymi ustawieniami, gdy będą ponownie potrzebne.

<Tip>
Preferuj `openclaw sandbox recreate` zamiast ręcznego czyszczenia specyficznego dla backendu. Używa ono rejestru środowisk uruchomieniowych Gateway i pozwala uniknąć niezgodności, gdy zmieniają się klucze zakresu lub sesji.
</Tip>

## Migracja rejestru

OpenClaw przechowuje metadane środowiska uruchomieniowego sandbox jako jeden fragment JSON na wpis kontenera/przeglądarki w katalogu stanu sandbox. Starsze instalacje mogą nadal mieć monolityczne pliki starszego typu:

- `~/.openclaw/sandbox/containers.json`
- `~/.openclaw/sandbox/browsers.json`

Zwykłe odczyty środowisk uruchomieniowych sandbox nie przepisują tych plików. Uruchom `openclaw doctor --fix`, aby zmigrować prawidłowe starsze wpisy do katalogów rejestru podzielonego na fragmenty. Nieprawidłowe starsze pliki są poddawane kwarantannie, aby jeden wadliwy stary rejestr nie mógł ukryć bieżących wpisów środowisk uruchomieniowych.

## Konfiguracja

Ustawienia sandbox znajdują się w `~/.openclaw/openclaw.json` pod `agents.defaults.sandbox` (nadpisania dla poszczególnych agentów trafiają do `agents.list[].sandbox`):

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
