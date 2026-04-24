---
read_when: You are managing sandbox runtimes or debugging sandbox/tool-policy behavior.
status: active
summary: Zarządzaj środowiskami wykonawczymi sandbox i sprawdzaj efektywną politykę sandboxa
title: CLI sandboxa
x-i18n:
    generated_at: "2026-04-24T09:04:01Z"
    model: gpt-5.4
    provider: openai
    source_hash: 4f2b5835968faac0a8243fd6eadfcecb51b211fe7b346454e215312b1b6d5e65
    source_path: cli/sandbox.md
    workflow: 15
---

Zarządzaj środowiskami wykonawczymi sandbox dla izolowanego wykonywania agentów.

## Omówienie

OpenClaw może uruchamiać agentów w izolowanych środowiskach wykonawczych sandbox ze względów bezpieczeństwa. Polecenia `sandbox` pomagają sprawdzać i odtwarzać te środowiska po aktualizacjach lub zmianach konfiguracji.

Obecnie zwykle oznacza to:

- kontenery sandbox Docker
- środowiska wykonawcze sandbox SSH, gdy `agents.defaults.sandbox.backend = "ssh"`
- środowiska wykonawcze sandbox OpenShell, gdy `agents.defaults.sandbox.backend = "openshell"`

W przypadku `ssh` i OpenShell `remote` odtworzenie ma większe znaczenie niż w Docker:

- zdalny obszar roboczy jest kanoniczny po początkowym zasianiu
- `openclaw sandbox recreate` usuwa ten kanoniczny zdalny obszar roboczy dla wybranego zakresu
- przy następnym użyciu jest on ponownie zasiewany z bieżącego lokalnego obszaru roboczego

## Polecenia

### `openclaw sandbox explain`

Sprawdź **efektywny** tryb/zakres/dostęp do obszaru roboczego sandbox, politykę narzędzi sandboxa oraz bramki podwyższonych uprawnień (wraz ze ścieżkami kluczy konfiguracji do naprawy).

```bash
openclaw sandbox explain
openclaw sandbox explain --session agent:main:main
openclaw sandbox explain --agent work
openclaw sandbox explain --json
```

### `openclaw sandbox list`

Wyświetl wszystkie środowiska wykonawcze sandbox wraz z ich statusem i konfiguracją.

```bash
openclaw sandbox list
openclaw sandbox list --browser  # Wyświetl tylko kontenery przeglądarki
openclaw sandbox list --json     # Wyjście JSON
```

**Wyjście zawiera:**

- nazwę i status środowiska wykonawczego
- backend (`docker`, `openshell` itp.)
- etykietę konfiguracji i informację, czy odpowiada bieżącej konfiguracji
- wiek (czas od utworzenia)
- czas bezczynności (czas od ostatniego użycia)
- powiązaną sesję/agenta

### `openclaw sandbox recreate`

Usuń środowiska wykonawcze sandbox, aby wymusić ich odtworzenie z zaktualizowaną konfiguracją.

```bash
openclaw sandbox recreate --all                # Odtwórz wszystkie kontenery
openclaw sandbox recreate --session main       # Konkretna sesja
openclaw sandbox recreate --agent mybot        # Konkretny agent
openclaw sandbox recreate --browser            # Tylko kontenery przeglądarki
openclaw sandbox recreate --all --force        # Pomiń potwierdzenie
```

**Opcje:**

- `--all`: odtwórz wszystkie kontenery sandbox
- `--session <key>`: odtwórz kontener dla konkretnej sesji
- `--agent <id>`: odtwórz kontenery dla konkretnego agenta
- `--browser`: odtwórz tylko kontenery przeglądarki
- `--force`: pomiń monit o potwierdzenie

**Ważne:** środowiska wykonawcze są automatycznie odtwarzane przy następnym użyciu agenta.

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

### Po zmianie konfiguracji sandboxa

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

Dla podstawowego backendu `ssh` odtworzenie usuwa katalog główny zdalnego obszaru roboczego per zakres
na celu SSH. Następne uruchomienie ponownie zasiewa go z lokalnego obszaru roboczego.

### Po zmianie źródła, polityki lub trybu OpenShell

```bash
# Edytuj konfigurację:
# - agents.defaults.sandbox.backend
# - plugins.entries.openshell.config.from
# - plugins.entries.openshell.config.mode
# - plugins.entries.openshell.config.policy

openclaw sandbox recreate --all
```

Dla trybu OpenShell `remote` odtworzenie usuwa kanoniczny zdalny obszar roboczy
dla tego zakresu. Następne uruchomienie ponownie zasiewa go z lokalnego obszaru roboczego.

### Po zmianie setupCommand

```bash
openclaw sandbox recreate --all
# lub tylko dla jednego agenta:
openclaw sandbox recreate --agent family
```

### Tylko dla konkretnego agenta

```bash
# Zaktualizuj tylko kontenery jednego agenta
openclaw sandbox recreate --agent alfred
```

## Dlaczego jest to potrzebne?

**Problem:** gdy aktualizujesz konfigurację sandboxa:

- istniejące środowiska wykonawcze nadal działają ze starymi ustawieniami
- środowiska wykonawcze są usuwane dopiero po 24 h bezczynności
- regularnie używani agenci utrzymują stare środowiska wykonawcze przy życiu bezterminowo

**Rozwiązanie:** użyj `openclaw sandbox recreate`, aby wymusić usunięcie starych środowisk wykonawczych. Zostaną one automatycznie odtworzone z bieżącymi ustawieniami, gdy będą ponownie potrzebne.

Wskazówka: preferuj `openclaw sandbox recreate` zamiast ręcznego czyszczenia specyficznego dla backendu.
Używa ono rejestru środowisk wykonawczych Gateway i pozwala uniknąć niedopasowań, gdy zmieniają się klucze zakresu/sesji.

## Konfiguracja

Ustawienia sandboxa znajdują się w `~/.openclaw/openclaw.json` pod `agents.defaults.sandbox` (nadpisania per agent trafiają do `agents.list[].sandbox`):

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
          "idleHours": 24, // Automatyczne usuwanie po 24 h bezczynności
          "maxAgeDays": 7, // Automatyczne usuwanie po 7 dniach
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
- [Doctor](/pl/gateway/doctor) — sprawdza konfigurację sandboxa
