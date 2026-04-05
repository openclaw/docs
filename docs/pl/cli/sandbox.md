---
read_when: You are managing sandbox runtimes or debugging sandbox/tool-policy behavior.
status: active
summary: Zarządzaj środowiskami uruchomieniowymi sandbox i sprawdzaj efektywną politykę sandbox
title: CLI sandbox
x-i18n:
    generated_at: "2026-04-05T13:49:38Z"
    model: gpt-5.4
    provider: openai
    source_hash: fa2783037da2901316108d35e04bb319d5d57963c2764b9146786b3c6474b48a
    source_path: cli/sandbox.md
    workflow: 15
---

# CLI sandbox

Zarządzaj środowiskami uruchomieniowymi sandbox do izolowanego wykonywania agentów.

## Omówienie

OpenClaw może uruchamiać agentów w izolowanych środowiskach uruchomieniowych sandbox dla bezpieczeństwa. Polecenia `sandbox` pomagają sprawdzać i odtwarzać te środowiska po aktualizacjach lub zmianach konfiguracji.

Obecnie zwykle oznacza to:

- kontenery sandbox Docker
- środowiska uruchomieniowe sandbox SSH, gdy `agents.defaults.sandbox.backend = "ssh"`
- środowiska uruchomieniowe sandbox OpenShell, gdy `agents.defaults.sandbox.backend = "openshell"`

W przypadku `ssh` i OpenShell `remote` odtworzenie ma większe znaczenie niż w Dockerze:

- zdalny obszar roboczy jest kanoniczny po początkowym zasianiu
- `openclaw sandbox recreate` usuwa ten kanoniczny zdalny obszar roboczy dla wybranego zakresu
- kolejne użycie zasiewa go ponownie z bieżącego lokalnego obszaru roboczego

## Polecenia

### `openclaw sandbox explain`

Sprawdź **efektywny** tryb/zakres/dostęp do obszaru roboczego sandbox, politykę narzędzi sandbox oraz bramki podwyższonych uprawnień (z ścieżkami kluczy konfiguracji do naprawy).

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
openclaw sandbox list --browser  # Wyświetl tylko kontenery przeglądarki
openclaw sandbox list --json     # Dane wyjściowe JSON
```

**Dane wyjściowe obejmują:**

- nazwę i stan środowiska uruchomieniowego
- backend (`docker`, `openshell` itd.)
- etykietę konfiguracji i informację, czy odpowiada bieżącej konfiguracji
- wiek (czas od utworzenia)
- czas bezczynności (czas od ostatniego użycia)
- powiązaną sesję/agenta

### `openclaw sandbox recreate`

Usuń środowiska uruchomieniowe sandbox, aby wymusić ich odtworzenie z zaktualizowaną konfiguracją.

```bash
openclaw sandbox recreate --all                # Odtwórz wszystkie kontenery
openclaw sandbox recreate --session main       # Określona sesja
openclaw sandbox recreate --agent mybot        # Określony agent
openclaw sandbox recreate --browser            # Tylko kontenery przeglądarki
openclaw sandbox recreate --all --force        # Pomiń potwierdzenie
```

**Opcje:**

- `--all`: odtwarza wszystkie kontenery sandbox
- `--session <key>`: odtwarza kontener dla określonej sesji
- `--agent <id>`: odtwarza kontenery dla określonego agenta
- `--browser`: odtwarza tylko kontenery przeglądarki
- `--force`: pomija monit o potwierdzenie

**Ważne:** środowiska uruchomieniowe są automatycznie odtwarzane przy następnym użyciu agenta.

## Przypadki użycia

### Po aktualizacji obrazu Docker

```bash
# Pobierz nowy obraz
docker pull openclaw-sandbox:latest
docker tag openclaw-sandbox:latest openclaw-sandbox:bookworm-slim

# Zaktualizuj konfigurację, aby używać nowego obrazu
# Edytuj konfigurację: agents.defaults.sandbox.docker.image (lub agents.list[].sandbox.docker.image)

# Odtwórz kontenery
openclaw sandbox recreate --all
```

### Po zmianie konfiguracji sandbox

```bash
# Edytuj konfigurację: agents.defaults.sandbox.* (lub agents.list[].sandbox.*)

# Odtwórz, aby zastosować nową konfigurację
openclaw sandbox recreate --all
```

### Po zmianie celu SSH lub materiałów uwierzytelniających SSH

```bash
# Edytuj konfigurację:
# - agents.defaults.sandbox.backend
# - agents.defaults.sandbox.ssh.target
# - agents.defaults.sandbox.ssh.workspaceRoot
# - agents.defaults.sandbox.ssh.identityFile / certificateFile / knownHostsFile
# - agents.defaults.sandbox.ssh.identityData / certificateData / knownHostsData

openclaw sandbox recreate --all
```

W przypadku podstawowego backendu `ssh` odtworzenie usuwa zdalny katalog główny obszaru roboczego dla danego zakresu
na celu SSH. Kolejne uruchomienie zasiewa go ponownie z lokalnego obszaru roboczego.

### Po zmianie źródła, polityki lub trybu OpenShell

```bash
# Edytuj konfigurację:
# - agents.defaults.sandbox.backend
# - plugins.entries.openshell.config.from
# - plugins.entries.openshell.config.mode
# - plugins.entries.openshell.config.policy

openclaw sandbox recreate --all
```

W przypadku trybu OpenShell `remote` odtworzenie usuwa kanoniczny zdalny obszar roboczy
dla tego zakresu. Kolejne uruchomienie zasiewa go ponownie z lokalnego obszaru roboczego.

### Po zmianie setupCommand

```bash
openclaw sandbox recreate --all
# lub tylko dla jednego agenta:
openclaw sandbox recreate --agent family
```

### Tylko dla określonego agenta

```bash
# Zaktualizuj kontenery tylko jednego agenta
openclaw sandbox recreate --agent alfred
```

## Dlaczego jest to potrzebne?

**Problem:** gdy aktualizujesz konfigurację sandbox:

- istniejące środowiska uruchomieniowe nadal działają ze starymi ustawieniami
- środowiska uruchomieniowe są przycinane dopiero po 24 godzinach bezczynności
- regularnie używani agenci utrzymują stare środowiska uruchomieniowe przy życiu bezterminowo

**Rozwiązanie:** użyj `openclaw sandbox recreate`, aby wymusić usunięcie starych środowisk uruchomieniowych. Zostaną one automatycznie odtworzone z bieżącymi ustawieniami, gdy będą znów potrzebne.

Wskazówka: preferuj `openclaw sandbox recreate` zamiast ręcznego czyszczenia specyficznego dla backendu.
Używa rejestru środowisk uruchomieniowych Gateway i pozwala uniknąć niezgodności, gdy zmieniają się klucze zakresu/sesji.

## Konfiguracja

Ustawienia sandbox znajdują się w `~/.openclaw/openclaw.json` w sekcji `agents.defaults.sandbox` (nadpisania dla poszczególnych agentów umieszcza się w `agents.list[].sandbox`):

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
          // ... więcej opcji Docker
        },
        "prune": {
          "idleHours": 24, // Automatyczne przycinanie po 24 h bezczynności
          "maxAgeDays": 7, // Automatyczne przycinanie po 7 dniach
        },
      },
    },
  },
}
```

## Zobacz także

- [Dokumentacja sandbox](/gateway/sandboxing)
- [Konfiguracja agenta](/concepts/agent-workspace)
- [Polecenie Doctor](/gateway/doctor) - Sprawdź konfigurację sandbox
