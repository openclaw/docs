---
read_when: You are managing sandbox runtimes or debugging sandbox/tool-policy behavior.
status: active
summary: Beheer sandbox-runtimes en inspecteer het geldende sandboxbeleid
title: Sandbox-CLI
x-i18n:
    generated_at: "2026-04-29T22:34:25Z"
    model: gpt-5.5
    provider: openai
    source_hash: 65520040611ccf0cfc28b28f0caf2ed1c7d3b32de06eec7884131042bba4a01e
    source_path: cli/sandbox.md
    workflow: 16
---

Beheer sandbox-runtimes voor geïsoleerde agentuitvoering.

## Overzicht

OpenClaw kan agents uitvoeren in geïsoleerde sandbox-runtimes voor beveiliging. De `sandbox`-commando's helpen je die runtimes te inspecteren en opnieuw te maken na updates of configuratiewijzigingen.

Vandaag betekent dat meestal:

- Docker-sandboxcontainers
- SSH-sandbox-runtimes wanneer `agents.defaults.sandbox.backend = "ssh"`
- OpenShell-sandbox-runtimes wanneer `agents.defaults.sandbox.backend = "openshell"`

Voor `ssh` en OpenShell `remote` is opnieuw maken belangrijker dan bij Docker:

- de remote workspace is canoniek na de initiële seed
- `openclaw sandbox recreate` verwijdert die canonieke remote workspace voor het geselecteerde bereik
- bij het volgende gebruik wordt deze opnieuw geseed vanuit de huidige lokale workspace

## Commando's

### `openclaw sandbox explain`

Inspecteer de **effectieve** sandboxmodus, het bereik, de workspace-toegang, het sandbox-toolbeleid en verhoogde gates (met fix-it-configuratiesleutelpaden).

```bash
openclaw sandbox explain
openclaw sandbox explain --session agent:main:main
openclaw sandbox explain --agent work
openclaw sandbox explain --json
```

### `openclaw sandbox list`

Geef alle sandbox-runtimes weer met hun status en configuratie.

```bash
openclaw sandbox list
openclaw sandbox list --browser  # Alleen browsercontainers weergeven
openclaw sandbox list --json     # JSON-uitvoer
```

**Uitvoer bevat:**

- Runtimenaam en status
- Backend (`docker`, `openshell`, enz.)
- Configuratielabel en of dit overeenkomt met de huidige configuratie
- Leeftijd (tijd sinds aanmaak)
- Inactieve tijd (tijd sinds laatste gebruik)
- Bijbehorende sessie/agent

### `openclaw sandbox recreate`

Verwijder sandbox-runtimes om opnieuw maken met bijgewerkte configuratie af te dwingen.

```bash
openclaw sandbox recreate --all                # Alle containers opnieuw maken
openclaw sandbox recreate --session main       # Specifieke sessie
openclaw sandbox recreate --agent mybot        # Specifieke agent
openclaw sandbox recreate --browser            # Alleen browsercontainers
openclaw sandbox recreate --all --force        # Bevestiging overslaan
```

**Opties:**

- `--all`: Maak alle sandboxcontainers opnieuw
- `--session <key>`: Maak de container voor een specifieke sessie opnieuw
- `--agent <id>`: Maak containers voor een specifieke agent opnieuw
- `--browser`: Maak alleen browsercontainers opnieuw
- `--force`: Sla de bevestigingsprompt over

<Note>
Runtimes worden automatisch opnieuw gemaakt wanneer de agent de volgende keer wordt gebruikt.
</Note>

## Gebruikssituaties

### Na het bijwerken van een Docker-image

```bash
# Nieuwe image ophalen
docker pull openclaw-sandbox:latest
docker tag openclaw-sandbox:latest openclaw-sandbox:bookworm-slim

# Configuratie bijwerken om nieuwe image te gebruiken
# Configuratie bewerken: agents.defaults.sandbox.docker.image (of agents.list[].sandbox.docker.image)

# Containers opnieuw maken
openclaw sandbox recreate --all
```

### Na het wijzigen van sandboxconfiguratie

```bash
# Configuratie bewerken: agents.defaults.sandbox.* (of agents.list[].sandbox.*)

# Opnieuw maken om nieuwe configuratie toe te passen
openclaw sandbox recreate --all
```

### Na het wijzigen van SSH-doel of SSH-authenticatiemateriaal

```bash
# Configuratie bewerken:
# - agents.defaults.sandbox.backend
# - agents.defaults.sandbox.ssh.target
# - agents.defaults.sandbox.ssh.workspaceRoot
# - agents.defaults.sandbox.ssh.identityFile / certificateFile / knownHostsFile
# - agents.defaults.sandbox.ssh.identityData / certificateData / knownHostsData

openclaw sandbox recreate --all
```

Voor de core-`ssh`-backend verwijdert opnieuw maken de remote workspace-root per bereik
op het SSH-doel. De volgende run seedt deze opnieuw vanuit de lokale workspace.

### Na het wijzigen van OpenShell-bron, beleid of modus

```bash
# Configuratie bewerken:
# - agents.defaults.sandbox.backend
# - plugins.entries.openshell.config.from
# - plugins.entries.openshell.config.mode
# - plugins.entries.openshell.config.policy

openclaw sandbox recreate --all
```

Voor OpenShell `remote`-modus verwijdert opnieuw maken de canonieke remote workspace
voor dat bereik. De volgende run seedt deze opnieuw vanuit de lokale workspace.

### Na het wijzigen van setupCommand

```bash
openclaw sandbox recreate --all
# of slechts een agent:
openclaw sandbox recreate --agent family
```

### Alleen voor een specifieke agent

```bash
# Werk alleen de containers van één agent bij
openclaw sandbox recreate --agent alfred
```

## Waarom dit nodig is

Wanneer je sandboxconfiguratie bijwerkt:

- Bestaande runtimes blijven met oude instellingen draaien.
- Runtimes worden pas na 24 uur inactiviteit opgeschoond.
- Regelmatig gebruikte agents houden oude runtimes onbeperkt actief.

Gebruik `openclaw sandbox recreate` om verwijdering van oude runtimes af te dwingen. Ze worden automatisch opnieuw gemaakt met de huidige instellingen wanneer ze weer nodig zijn.

<Tip>
Gebruik bij voorkeur `openclaw sandbox recreate` in plaats van handmatige backend-specifieke opschoning. Het gebruikt het runtimeregister van de Gateway en voorkomt mismatches wanneer bereik- of sessiesleutels wijzigen.
</Tip>

## Configuratie

Sandboxinstellingen staan in `~/.openclaw/openclaw.json` onder `agents.defaults.sandbox` (overrides per agent staan in `agents.list[].sandbox`):

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

## Gerelateerd

- [CLI-referentie](/nl/cli)
- [Sandboxing](/nl/gateway/sandboxing)
- [Agent-workspace](/nl/concepts/agent-workspace)
- [Doctor](/nl/gateway/doctor): controleert sandboxinstallatie.
