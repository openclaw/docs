---
read_when: You are managing sandbox runtimes or debugging sandbox/tool-policy behavior.
status: active
summary: Sandbox-runtimes beheren en het geldende sandboxbeleid inspecteren
title: Sandbox-CLI
x-i18n:
    generated_at: "2026-05-03T21:28:52Z"
    model: gpt-5.5
    provider: openai
    source_hash: c50b97c35ba8cd79416de6a167a7cbc313d063b320db7deafd42f7a570e507ac
    source_path: cli/sandbox.md
    workflow: 16
---

Beheer sandbox-runtimes voor geisoleerde uitvoering van agents.

## Overzicht

OpenClaw kan agents in geisoleerde sandbox-runtimes uitvoeren voor beveiliging. De `sandbox`-opdrachten helpen je die runtimes te inspecteren en opnieuw te maken na updates of configuratiewijzigingen.

Vandaag betekent dat meestal:

- Docker-sandboxcontainers
- SSH-sandboxruntimes wanneer `agents.defaults.sandbox.backend = "ssh"`
- OpenShell-sandboxruntimes wanneer `agents.defaults.sandbox.backend = "openshell"`

Voor `ssh` en OpenShell `remote` is opnieuw maken belangrijker dan bij Docker:

- de externe werkruimte is canoniek na de eerste seed
- `openclaw sandbox recreate` verwijdert die canonieke externe werkruimte voor het geselecteerde bereik
- het volgende gebruik seedt deze opnieuw vanuit de huidige lokale werkruimte

## Opdrachten

### `openclaw sandbox explain`

Inspecteer de **effectieve** sandboxmodus, het sandboxbereik, de werkruimtetoegang, het beleid voor sandbox-tools en verhoogde gates (met paden voor configuratiesleutels voor herstel).

```bash
openclaw sandbox explain
openclaw sandbox explain --session agent:main:main
openclaw sandbox explain --agent work
openclaw sandbox explain --json
```

### `openclaw sandbox list`

Toon alle sandbox-runtimes met hun status en configuratie.

```bash
openclaw sandbox list
openclaw sandbox list --browser  # List only browser containers
openclaw sandbox list --json     # JSON output
```

**Uitvoer bevat:**

- Runtimenaam en status
- Backend (`docker`, `openshell`, enz.)
- Configuratielabel en of dit overeenkomt met de huidige configuratie
- Leeftijd (tijd sinds aanmaak)
- Inactieve tijd (tijd sinds laatste gebruik)
- Gekoppelde sessie/agent

### `openclaw sandbox recreate`

Verwijder sandbox-runtimes om opnieuw maken met bijgewerkte configuratie af te dwingen.

```bash
openclaw sandbox recreate --all                # Recreate all containers
openclaw sandbox recreate --session main       # Specific session
openclaw sandbox recreate --agent mybot        # Specific agent
openclaw sandbox recreate --browser            # Only browser containers
openclaw sandbox recreate --all --force        # Skip confirmation
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
# Pull new image
docker pull openclaw-sandbox:latest
docker tag openclaw-sandbox:latest openclaw-sandbox:bookworm-slim

# Update config to use new image
# Edit config: agents.defaults.sandbox.docker.image (or agents.list[].sandbox.docker.image)

# Recreate containers
openclaw sandbox recreate --all
```

### Na het wijzigen van sandboxconfiguratie

```bash
# Edit config: agents.defaults.sandbox.* (or agents.list[].sandbox.*)

# Recreate to apply new config
openclaw sandbox recreate --all
```

### Na het wijzigen van SSH-doel of SSH-authenticatiemateriaal

```bash
# Edit config:
# - agents.defaults.sandbox.backend
# - agents.defaults.sandbox.ssh.target
# - agents.defaults.sandbox.ssh.workspaceRoot
# - agents.defaults.sandbox.ssh.identityFile / certificateFile / knownHostsFile
# - agents.defaults.sandbox.ssh.identityData / certificateData / knownHostsData

openclaw sandbox recreate --all
```

Voor de kern-`ssh`-backend verwijdert opnieuw maken de externe werkruimteroot per bereik
op het SSH-doel. De volgende run seedt deze opnieuw vanuit de lokale werkruimte.

### Na het wijzigen van OpenShell-bron, beleid of modus

```bash
# Edit config:
# - agents.defaults.sandbox.backend
# - plugins.entries.openshell.config.from
# - plugins.entries.openshell.config.mode
# - plugins.entries.openshell.config.policy

openclaw sandbox recreate --all
```

Voor OpenShell `remote`-modus verwijdert opnieuw maken de canonieke externe werkruimte
voor dat bereik. De volgende run seedt deze opnieuw vanuit de lokale werkruimte.

### Na het wijzigen van setupCommand

```bash
openclaw sandbox recreate --all
# or just one agent:
openclaw sandbox recreate --agent family
```

### Alleen voor een specifieke agent

```bash
# Update only one agent's containers
openclaw sandbox recreate --agent alfred
```

## Waarom dit nodig is

Wanneer je sandboxconfiguratie bijwerkt:

- Bestaande runtimes blijven draaien met oude instellingen.
- Runtimes worden pas opgeschoond na 24 uur inactiviteit.
- Regelmatig gebruikte agents houden oude runtimes onbeperkt actief.

Gebruik `openclaw sandbox recreate` om verwijdering van oude runtimes af te dwingen. Ze worden automatisch opnieuw gemaakt met de huidige instellingen wanneer ze de volgende keer nodig zijn.

<Tip>
Geef de voorkeur aan `openclaw sandbox recreate` boven handmatige backend-specifieke opschoning. Dit gebruikt het runtimeregister van de Gateway en voorkomt mismatches wanneer bereik- of sessiesleutels wijzigen.
</Tip>

## Registermigratie

OpenClaw slaat metadata van sandbox-runtimes op als een JSON-shard per container-/browseritem onder de sandboxstatusmap. Oudere installaties kunnen nog steeds monolithische legacybestanden hebben:

- `~/.openclaw/sandbox/containers.json`
- `~/.openclaw/sandbox/browsers.json`

Normale reads van sandbox-runtimes herschrijven die bestanden niet. Voer `openclaw doctor --fix` uit om geldige legacyitems naar de gesharde registermappen te migreren. Ongeldige legacybestanden worden in quarantaine geplaatst zodat een oud register met fouten geen huidige runtime-items kan verbergen.

## Configuratie

Sandboxinstellingen staan in `~/.openclaw/openclaw.json` onder `agents.defaults.sandbox` (overschrijvingen per agent staan in `agents.list[].sandbox`):

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
- [Agentwerkruimte](/nl/concepts/agent-workspace)
- [Doctor](/nl/gateway/doctor): controleert sandboxconfiguratie.
