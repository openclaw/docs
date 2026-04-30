---
read_when: You are managing sandbox runtimes or debugging sandbox/tool-policy behavior.
status: active
summary: Zarządzaj środowiskami uruchomieniowymi piaskownicy i sprawdzaj obowiązującą politykę piaskownicy
title: CLI piaskownicy
x-i18n:
    generated_at: "2026-04-30T09:45:21Z"
    model: gpt-5.5
    provider: openai
    source_hash: 65520040611ccf0cfc28b28f0caf2ed1c7d3b32de06eec7884131042bba4a01e
    source_path: cli/sandbox.md
    workflow: 16
---

Zarządzaj środowiskami uruchomieniowymi piaskownicy dla izolowanego wykonywania agentów.

## Przegląd

OpenClaw może uruchamiać agentów w izolowanych środowiskach uruchomieniowych piaskownicy ze względów bezpieczeństwa. Polecenia `sandbox` pomagają sprawdzać i odtwarzać te środowiska po aktualizacjach lub zmianach konfiguracji.

Obecnie zwykle oznacza to:

- kontenery piaskownicy Docker
- środowiska uruchomieniowe piaskownicy SSH, gdy `agents.defaults.sandbox.backend = "ssh"`
- środowiska uruchomieniowe piaskownicy OpenShell, gdy `agents.defaults.sandbox.backend = "openshell"`

W przypadku `ssh` i OpenShell `remote` odtworzenie ma większe znaczenie niż przy Docker:

- zdalny obszar roboczy jest kanoniczny po początkowym zainicjowaniu
- `openclaw sandbox recreate` usuwa ten kanoniczny zdalny obszar roboczy dla wybranego zakresu
- następne użycie ponownie inicjuje go z bieżącego lokalnego obszaru roboczego

## Polecenia

### `openclaw sandbox explain`

Sprawdź **efektywny** tryb/zakres/dostęp do obszaru roboczego piaskownicy, zasady narzędzi piaskownicy oraz bramki podniesionych uprawnień (ze ścieżkami kluczy konfiguracji do naprawy).

```bash
openclaw sandbox explain
openclaw sandbox explain --session agent:main:main
openclaw sandbox explain --agent work
openclaw sandbox explain --json
```

### `openclaw sandbox list`

Wyświetl wszystkie środowiska uruchomieniowe piaskownicy wraz z ich stanem i konfiguracją.

```bash
openclaw sandbox list
openclaw sandbox list --browser  # List only browser containers
openclaw sandbox list --json     # JSON output
```

**Dane wyjściowe obejmują:**

- nazwę i stan środowiska uruchomieniowego
- backend (`docker`, `openshell` itd.)
- etykietę konfiguracji oraz informację, czy odpowiada bieżącej konfiguracji
- wiek (czas od utworzenia)
- czas bezczynności (czas od ostatniego użycia)
- powiązaną sesję/agenta

### `openclaw sandbox recreate`

Usuń środowiska uruchomieniowe piaskownicy, aby wymusić odtworzenie ze zaktualizowaną konfiguracją.

```bash
openclaw sandbox recreate --all                # Recreate all containers
openclaw sandbox recreate --session main       # Specific session
openclaw sandbox recreate --agent mybot        # Specific agent
openclaw sandbox recreate --browser            # Only browser containers
openclaw sandbox recreate --all --force        # Skip confirmation
```

**Opcje:**

- `--all`: odtwórz wszystkie kontenery piaskownicy
- `--session <key>`: odtwórz kontener dla określonej sesji
- `--agent <id>`: odtwórz kontenery dla określonego agenta
- `--browser`: odtwórz tylko kontenery przeglądarki
- `--force`: pomiń monit o potwierdzenie

<Note>
Środowiska uruchomieniowe są automatycznie odtwarzane przy następnym użyciu agenta.
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

### Po zmianie konfiguracji piaskownicy

```bash
# Edit config: agents.defaults.sandbox.* (or agents.list[].sandbox.*)

# Recreate to apply new config
openclaw sandbox recreate --all
```

### Po zmianie celu SSH lub materiału uwierzytelniającego SSH

```bash
# Edit config:
# - agents.defaults.sandbox.backend
# - agents.defaults.sandbox.ssh.target
# - agents.defaults.sandbox.ssh.workspaceRoot
# - agents.defaults.sandbox.ssh.identityFile / certificateFile / knownHostsFile
# - agents.defaults.sandbox.ssh.identityData / certificateData / knownHostsData

openclaw sandbox recreate --all
```

W przypadku podstawowego backendu `ssh` odtworzenie usuwa zdalny katalog główny obszaru roboczego dla danego zakresu
na celu SSH. Następne uruchomienie ponownie inicjuje go z lokalnego obszaru roboczego.

### Po zmianie źródła, zasad lub trybu OpenShell

```bash
# Edit config:
# - agents.defaults.sandbox.backend
# - plugins.entries.openshell.config.from
# - plugins.entries.openshell.config.mode
# - plugins.entries.openshell.config.policy

openclaw sandbox recreate --all
```

W trybie OpenShell `remote` odtworzenie usuwa kanoniczny zdalny obszar roboczy
dla tego zakresu. Następne uruchomienie ponownie inicjuje go z lokalnego obszaru roboczego.

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

Gdy aktualizujesz konfigurację piaskownicy:

- Istniejące środowiska uruchomieniowe nadal działają ze starymi ustawieniami.
- Środowiska uruchomieniowe są usuwane dopiero po 24 godzinach bezczynności.
- Regularnie używani agenci utrzymują stare środowiska uruchomieniowe przy życiu bezterminowo.

Użyj `openclaw sandbox recreate`, aby wymusić usunięcie starych środowisk uruchomieniowych. Zostaną one automatycznie odtworzone z bieżącymi ustawieniami, gdy będą ponownie potrzebne.

<Tip>
Preferuj `openclaw sandbox recreate` zamiast ręcznego czyszczenia specyficznego dla backendu. Używa ono rejestru środowisk uruchomieniowych Gateway i zapobiega niezgodnościom, gdy zmienią się zakres lub klucze sesji.
</Tip>

## Konfiguracja

Ustawienia piaskownicy znajdują się w `~/.openclaw/openclaw.json` pod `agents.defaults.sandbox` (nadpisania dla poszczególnych agentów trafiają do `agents.list[].sandbox`):

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
- [Piaskownica](/pl/gateway/sandboxing)
- [Obszar roboczy agenta](/pl/concepts/agent-workspace)
- [Doctor](/pl/gateway/doctor): sprawdza konfigurację piaskownicy.
