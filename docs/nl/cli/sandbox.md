---
read_when: You are managing sandbox runtimes or debugging sandbox/tool-policy behavior.
status: active
summary: Beheer sandbox-runtimes en inspecteer het effectieve sandboxbeleid
title: Sandbox-CLI
x-i18n:
    generated_at: "2026-07-12T08:43:36Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: d41d81971b673d814697a4bf800d6973180c58e4cc5e69748614501dca3a6b6d
    source_path: cli/sandbox.md
    workflow: 16
---

Beheer sandbox-runtimes voor geïsoleerde uitvoering van agents: Docker-containers, SSH-doelen of OpenShell-backends.

## Opdrachten

### `openclaw sandbox list`

Toon sandbox-runtimes met status, backend, configuratieovereenkomst, leeftijd, inactiviteitsduur en gekoppelde sessie/agent.

```bash
openclaw sandbox list
openclaw sandbox list --browser  # alleen browsercontainers
openclaw sandbox list --json
```

### `openclaw sandbox recreate`

Verwijder sandbox-runtimes om ze opnieuw te laten maken met de huidige configuratie. Runtimes worden automatisch opnieuw gemaakt wanneer de agent de volgende keer wordt gebruikt.

```bash
openclaw sandbox recreate --all
openclaw sandbox recreate --agent mybot        # omvat subsessies van agent:mybot:*
openclaw sandbox recreate --session "agent:main:main"
openclaw sandbox recreate --browser --all      # alleen browsercontainers
openclaw sandbox recreate --all --force        # bevestiging overslaan
```

Opties:

- `--all`: maak alle sandboxcontainers opnieuw
- `--session <key>`: maak de runtime met exact deze bereikssleutel opnieuw (zoals weergegeven door `sandbox list`); korte namen worden niet uitgebreid
- `--agent <id>`: maak runtimes voor één agent opnieuw (komt overeen met `agent:<id>` en `agent:<id>:*`)
- `--browser`: pas alleen browsercontainers aan
- `--force`: sla de bevestigingsvraag over

Geef exact één van `--all`, `--session` of `--agent` door.

Voor `ssh` en OpenShell `remote` is opnieuw maken belangrijker dan bij Docker: na de initiële vulling is de externe werkruimte de canonieke versie, `recreate` verwijdert die canonieke externe werkruimte voor het geselecteerde bereik en bij de volgende uitvoering wordt deze opnieuw gevuld vanuit de huidige lokale werkruimte.

### `openclaw sandbox explain`

Inspecteer de effectieve sandboxmodus, het bereik en de werkruimtetoegang, het sandboxbeleid voor tools en de poorten voor tools met verhoogde bevoegdheden (met configuratiesleutelpaden voor herstel).

Het rapport behoudt `workspaceRoot` als de geconfigureerde sandboxhoofdmap en toont afzonderlijk de effectieve werkruimte op de host, de runtimewerkmap van de backend en de tabel met Docker-koppelingen. Voor `workspaceAccess: "rw"` is de effectieve werkruimte op de host de werkruimte van de agent in plaats van een map onder `workspaceRoot`.

```bash
openclaw sandbox explain
openclaw sandbox explain --session agent:main:main
openclaw sandbox explain --agent work
openclaw sandbox explain --json
```

In tegenstelling tot `recreate --session` accepteert dit korte sessienamen (bijvoorbeeld `main`) en breidt het deze uit op basis van de herleide agent.

## Waarom opnieuw maken nodig is

Het bijwerken van de sandboxconfiguratie heeft geen invloed op actieve containers: bestaande runtimes behouden hun oude instellingen en inactieve runtimes worden pas opgeschoond na `prune.idleHours` (standaard 24 uur). Regelmatig gebruikte agents kunnen verouderde runtimes onbeperkt actief houden. `openclaw sandbox recreate` verwijdert de oude runtime, zodat deze bij het volgende gebruik opnieuw wordt opgebouwd met de huidige configuratie.

<Tip>
Geef de voorkeur aan `openclaw sandbox recreate` boven handmatige, backendspecifieke opschoning. Deze opdracht gebruikt het runtimeregister van de Gateway en voorkomt afwijkingen wanneer bereik- of sessiesleutels veranderen.
</Tip>

## Veelvoorkomende aanleidingen

| Wijziging                                                                                                                                                      | Opdracht                                                              |
| -------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------- |
| Update van Docker-image (`agents.defaults.sandbox.docker.image`)                                                                                               | `openclaw sandbox recreate --all`                                     |
| Sandboxconfiguratie (`agents.defaults.sandbox.*`)                                                                                                              | `openclaw sandbox recreate --all`                                     |
| SSH-doel/-authenticatie (`agents.defaults.sandbox.ssh.{target,workspaceRoot,identityFile,certificateFile,knownHostsFile,identityData,certificateData,knownHostsData}`) | `openclaw sandbox recreate --all`                                     |
| OpenShell-bron/-beleid/-modus (`plugins.entries.openshell.config.{from,mode,policy}`)                                                                           | `openclaw sandbox recreate --all`                                     |
| `setupCommand`                                                                                                                                                 | `openclaw sandbox recreate --all` (of `--agent <id>` voor één agent) |

<Note>
Runtimes worden automatisch opnieuw gemaakt wanneer de agent de volgende keer wordt gebruikt.
</Note>

## Registermigratie

Metagegevens van sandbox-runtimes bevinden zich in de gedeelde SQLite-statusdatabase. Oudere installaties kunnen verouderde registerbestanden bevatten die bij normale leesbewerkingen niet meer worden herschreven:

- `~/.openclaw/sandbox/containers.json`
- `~/.openclaw/sandbox/browsers.json`
- één JSON-deelbestand per container/browser onder `~/.openclaw/sandbox/containers/` of `~/.openclaw/sandbox/browsers/`

Voer `openclaw doctor --fix` uit om geldige verouderde vermeldingen naar SQLite te migreren. Ongeldige verouderde bestanden worden in quarantaine geplaatst, zodat een beschadigd oud register de huidige runtimevermeldingen niet kan verbergen.

## Configuratie

Sandboxinstellingen staan in `~/.openclaw/openclaw.json` onder `agents.defaults.sandbox` (overschrijvingen per agent staan in `agents.list[].sandbox`):

```jsonc
{
  "agents": {
    "defaults": {
      "sandbox": {
        "mode": "all", // uit, niet-hoofd, alles
        "backend": "docker", // docker, ssh, openshell (geleverd door Plugin)
        "scope": "agent", // sessie, agent, gedeeld
        "docker": {
          "image": "openclaw-sandbox:bookworm-slim",
          "containerPrefix": "openclaw-sbx-",
          // ... meer Docker-opties
        },
        "prune": {
          "idleHours": 24, // automatisch opschonen na 24 uur inactiviteit
          "maxAgeDays": 7, // automatisch opschonen na 7 dagen
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
- [Doctor](/nl/gateway/doctor): controleert de sandboxconfiguratie.
