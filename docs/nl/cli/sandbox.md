---
read_when: You are managing sandbox runtimes or debugging sandbox/tool-policy behavior.
status: active
summary: Beheer sandbox-runtimes en inspecteer het effectieve sandboxbeleid
title: Sandbox-CLI
x-i18n:
    generated_at: "2026-06-27T17:22:38Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: eeba1a5530bb946b334cfe399b7a0c862694ae47c55b2341d7146333e112602a
    source_path: cli/sandbox.md
    workflow: 16
---

Beheer sandbox-runtimes voor geïsoleerde agentuitvoering.

## Overzicht

OpenClaw kan agents uitvoeren in geïsoleerde sandbox-runtimes voor beveiliging. De `sandbox`-opdrachten helpen je die runtimes te inspecteren en opnieuw aan te maken na updates of configuratiewijzigingen.

Vandaag betekent dat meestal:

- Docker-sandboxcontainers
- SSH-sandbox-runtimes wanneer `agents.defaults.sandbox.backend = "ssh"`
- OpenShell-sandbox-runtimes wanneer `agents.defaults.sandbox.backend = "openshell"`

Voor `ssh` en OpenShell `remote` is opnieuw aanmaken belangrijker dan bij Docker:

- de externe werkruimte is canoniek na de initiële seed
- `openclaw sandbox recreate` verwijdert die canonieke externe werkruimte voor het geselecteerde bereik
- bij het volgende gebruik wordt deze opnieuw geseed vanuit de huidige lokale werkruimte

## Opdrachten

### `openclaw sandbox explain`

Inspecteer de **effectieve** sandboxmodus, het bereik, de werkruimtetoegang, het sandbox-toolbeleid en verhoogde gates (met configuratiesleutelpaden om het op te lossen).

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

Verwijder sandbox-runtimes om opnieuw aanmaken met bijgewerkte configuratie af te dwingen.

```bash
openclaw sandbox recreate --all                # Recreate all containers
openclaw sandbox recreate --session main       # Specific session
openclaw sandbox recreate --agent mybot        # Specific agent
openclaw sandbox recreate --browser            # Only browser containers
openclaw sandbox recreate --all --force        # Skip confirmation
```

**Opties:**

- `--all`: Maak alle sandboxcontainers opnieuw aan
- `--session <key>`: Maak de container voor een specifieke sessie opnieuw aan
- `--agent <id>`: Maak containers voor een specifieke agent opnieuw aan
- `--browser`: Maak alleen browsercontainers opnieuw aan
- `--force`: Sla de bevestigingsprompt over

<Note>
Runtimes worden automatisch opnieuw aangemaakt wanneer de agent de volgende keer wordt gebruikt.
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

### Na het wijzigen van het SSH-doel of SSH-authenticatiemateriaal

```bash
# Edit config:
# - agents.defaults.sandbox.backend
# - agents.defaults.sandbox.ssh.target
# - agents.defaults.sandbox.ssh.workspaceRoot
# - agents.defaults.sandbox.ssh.identityFile / certificateFile / knownHostsFile
# - agents.defaults.sandbox.ssh.identityData / certificateData / knownHostsData

openclaw sandbox recreate --all
```

Voor de core-`ssh`-backend verwijdert opnieuw aanmaken de externe werkruimteroot per bereik
op het SSH-doel. De volgende run seedt deze opnieuw vanuit de lokale werkruimte.

### Na het wijzigen van OpenShell-bron, -beleid of -modus

```bash
# Edit config:
# - agents.defaults.sandbox.backend
# - plugins.entries.openshell.config.from
# - plugins.entries.openshell.config.mode
# - plugins.entries.openshell.config.policy

openclaw sandbox recreate --all
```

Voor OpenShell `remote`-modus verwijdert opnieuw aanmaken de canonieke externe werkruimte
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

Gebruik `openclaw sandbox recreate` om verwijdering van oude runtimes af te dwingen. Ze worden automatisch opnieuw aangemaakt met de huidige instellingen wanneer ze de volgende keer nodig zijn.

<Tip>
Geef de voorkeur aan `openclaw sandbox recreate` boven handmatige backend-specifieke opschoning. Het gebruikt het runtimeregister van de Gateway en voorkomt mismatches wanneer bereik- of sessiesleutels wijzigen.
</Tip>

## Registermigratie

OpenClaw slaat metadata van sandbox-runtimes op in de gedeelde SQLite-statusdatabase. Oudere installaties kunnen nog legacy sandbox-registerbestanden hebben:

- `~/.openclaw/sandbox/containers.json`
- `~/.openclaw/sandbox/browsers.json`

Sommige upgrades kunnen ook één JSON-shard per container/browser hebben onder `~/.openclaw/sandbox/containers/` of `~/.openclaw/sandbox/browsers/`. Normale leesbewerkingen van sandbox-runtimes herschrijven die legacy-bronnen niet. Voer `openclaw doctor --fix` uit om geldige legacy-vermeldingen naar SQLite te migreren. Ongeldige legacy-bestanden worden in quarantaine geplaatst, zodat één slecht oud register huidige runtimevermeldingen niet kan verbergen.

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
- [Doctor](/nl/gateway/doctor): controleert sandboxinstellingen.
