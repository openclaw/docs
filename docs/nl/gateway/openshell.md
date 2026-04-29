---
read_when:
    - Je wilt door de cloud beheerde sandboxen in plaats van lokale Docker
    - Je stelt de OpenShell-Plugin in
    - Je moet kiezen tussen de spiegelmodus en de modus voor externe werkruimtes
summary: Gebruik OpenShell als beheerde sandbox-backend voor OpenClaw-agents
title: OpenShell
x-i18n:
    generated_at: "2026-04-29T22:46:57Z"
    model: gpt-5.5
    provider: openai
    source_hash: 694a0a145802f4b624af01b58cbb5886bab7426fb9a90f216480141082089144
    source_path: gateway/openshell.md
    workflow: 16
---

OpenShell is een beheerde sandbox-backend voor OpenClaw. In plaats van Docker
containers lokaal uit te voeren, delegeert OpenClaw de sandboxlevenscyclus aan de `openshell` CLI,
die externe omgevingen inricht met SSH-gebaseerde opdrachtuitvoering.

De OpenShell-Plugin hergebruikt hetzelfde kerntransport via SSH en dezelfde externe bestandssysteembrug
als de generieke [SSH-backend](/nl/gateway/sandboxing#ssh-backend). Deze voegt
OpenShell-specifieke levenscyclusfunctionaliteit toe (`sandbox create/get/delete`, `sandbox ssh-config`)
en een optionele `mirror`-werkruimtemodus.

## Vereisten

- De `openshell` CLI geinstalleerd en beschikbaar op `PATH` (of stel een aangepast pad in via
  `plugins.entries.openshell.config.command`)
- Een OpenShell-account met sandboxtoegang
- OpenClaw Gateway actief op de host

## Snel starten

1. Schakel de Plugin in en stel de sandbox-backend in:

```json5
{
  agents: {
    defaults: {
      sandbox: {
        mode: "all",
        backend: "openshell",
        scope: "session",
        workspaceAccess: "rw",
      },
    },
  },
  plugins: {
    entries: {
      openshell: {
        enabled: true,
        config: {
          from: "openclaw",
          mode: "remote",
        },
      },
    },
  },
}
```

2. Start de Gateway opnieuw. Bij de volgende agentbeurt maakt OpenClaw een OpenShell
   sandbox aan en routeert het tooluitvoering erdoorheen.

3. Verifieer:

```bash
openclaw sandbox list
openclaw sandbox explain
```

## Werkruimtemodi

Dit is de belangrijkste beslissing bij het gebruik van OpenShell.

### `mirror`

Gebruik `plugins.entries.openshell.config.mode: "mirror"` wanneer je wilt dat de **lokale
werkruimte canoniek blijft**.

Gedrag:

- Voor `exec` synchroniseert OpenClaw de lokale werkruimte naar de OpenShell-sandbox.
- Na `exec` synchroniseert OpenClaw de externe werkruimte terug naar de lokale werkruimte.
- Bestandstools werken nog steeds via de sandboxbrug, maar de lokale werkruimte
  blijft tussen beurten de bron van waarheid.

Het beste voor:

- Je bewerkt bestanden lokaal buiten OpenClaw en wilt dat die wijzigingen automatisch zichtbaar zijn in de
  sandbox.
- Je wilt dat de OpenShell-sandbox zich zo veel mogelijk gedraagt als de Docker-backend.
- Je wilt dat de hostwerkruimte sandboxschrijfacties weerspiegelt na elke exec-beurt.

Afweging: extra synchronisatiekosten voor en na elke exec.

### `remote`

Gebruik `plugins.entries.openshell.config.mode: "remote"` wanneer je wilt dat de
**OpenShell-werkruimte canoniek wordt**.

Gedrag:

- Wanneer de sandbox voor het eerst wordt aangemaakt, vult OpenClaw de externe werkruimte eenmalig vanuit
  de lokale werkruimte.
- Daarna werken `exec`, `read`, `write`, `edit` en `apply_patch`
  rechtstreeks op de externe OpenShell-werkruimte.
- OpenClaw synchroniseert externe wijzigingen **niet** terug naar de lokale werkruimte.
- Media-lezingen tijdens prompttijd blijven werken omdat bestands- en mediatools lezen via
  de sandboxbrug.

Het beste voor:

- De sandbox moet hoofdzakelijk aan de externe kant leven.
- Je wilt minder synchronisatie-overhead per beurt.
- Je wilt niet dat host-lokale bewerkingen stilzwijgend externe sandboxstatus overschrijven.

<Warning>
Als je na de eerste vulling bestanden op de host buiten OpenClaw bewerkt, ziet de externe sandbox die wijzigingen **niet**. Gebruik `openclaw sandbox recreate` om opnieuw te vullen.
</Warning>

### Een modus kiezen

|                          | `mirror`                   | `remote`                  |
| ------------------------ | -------------------------- | ------------------------- |
| **Canonieke werkruimte** | Lokale host                | Externe OpenShell         |
| **Synchronisatierichting** | Bidirectioneel (elke exec) | Eenmalige vulling         |
| **Overhead per beurt**   | Hoger (upload + download)  | Lager (directe externe bewerkingen) |
| **Lokale bewerkingen zichtbaar?** | Ja, bij volgende exec | Nee, tot opnieuw aanmaken |
| **Het beste voor**       | Ontwikkelworkflows         | Langlopende agents, CI    |

## Configuratiereferentie

Alle OpenShell-configuratie staat onder `plugins.entries.openshell.config`:

| Sleutel                   | Type                     | Standaard     | Beschrijving                                          |
| ------------------------- | ------------------------ | ------------- | ----------------------------------------------------- |
| `mode`                    | `"mirror"` or `"remote"` | `"mirror"`    | Werkruimtesynchronisatiemodus                         |
| `command`                 | `string`                 | `"openshell"` | Pad of naam van de `openshell` CLI                    |
| `from`                    | `string`                 | `"openclaw"`  | Sandboxbron voor eerste aanmaak                       |
| `gateway`                 | `string`                 | —             | OpenShell-Gatewaynaam (`--gateway`)                   |
| `gatewayEndpoint`         | `string`                 | —             | OpenShell-Gatewayendpoint-URL (`--gateway-endpoint`)  |
| `policy`                  | `string`                 | —             | OpenShell-beleids-ID voor sandboxaanmaak              |
| `providers`               | `string[]`               | `[]`          | Providernamen om te koppelen wanneer de sandbox wordt aangemaakt |
| `gpu`                     | `boolean`                | `false`       | GPU-resources aanvragen                               |
| `autoProviders`           | `boolean`                | `true`        | Geef `--auto-providers` door tijdens sandboxaanmaak   |
| `remoteWorkspaceDir`      | `string`                 | `"/sandbox"`  | Primaire beschrijfbare werkruimte binnen de sandbox   |
| `remoteAgentWorkspaceDir` | `string`                 | `"/agent"`    | Mountpad voor agentwerkruimte (voor alleen-lezen-toegang) |
| `timeoutSeconds`          | `number`                 | `120`         | Time-out voor `openshell` CLI-bewerkingen             |

Instellingen op sandboxniveau (`mode`, `scope`, `workspaceAccess`) worden geconfigureerd onder
`agents.defaults.sandbox`, zoals bij elke backend. Zie
[Sandboxing](/nl/gateway/sandboxing) voor de volledige matrix.

## Voorbeelden

### Minimale externe setup

```json5
{
  agents: {
    defaults: {
      sandbox: {
        mode: "all",
        backend: "openshell",
      },
    },
  },
  plugins: {
    entries: {
      openshell: {
        enabled: true,
        config: {
          from: "openclaw",
          mode: "remote",
        },
      },
    },
  },
}
```

### Mirror-modus met GPU

```json5
{
  agents: {
    defaults: {
      sandbox: {
        mode: "all",
        backend: "openshell",
        scope: "agent",
        workspaceAccess: "rw",
      },
    },
  },
  plugins: {
    entries: {
      openshell: {
        enabled: true,
        config: {
          from: "openclaw",
          mode: "mirror",
          gpu: true,
          providers: ["openai"],
          timeoutSeconds: 180,
        },
      },
    },
  },
}
```

### OpenShell per agent met aangepaste Gateway

```json5
{
  agents: {
    defaults: {
      sandbox: { mode: "off" },
    },
    list: [
      {
        id: "researcher",
        sandbox: {
          mode: "all",
          backend: "openshell",
          scope: "agent",
          workspaceAccess: "rw",
        },
      },
    ],
  },
  plugins: {
    entries: {
      openshell: {
        enabled: true,
        config: {
          from: "openclaw",
          mode: "remote",
          gateway: "lab",
          gatewayEndpoint: "https://lab.example",
          policy: "strict",
        },
      },
    },
  },
}
```

## Levenscyclusbeheer

OpenShell-sandboxes worden beheerd via de normale sandbox-CLI:

```bash
# List all sandbox runtimes (Docker + OpenShell)
openclaw sandbox list

# Inspect effective policy
openclaw sandbox explain

# Recreate (deletes remote workspace, re-seeds on next use)
openclaw sandbox recreate --all
```

Voor de `remote`-modus is **opnieuw aanmaken bijzonder belangrijk**: dit verwijdert de canonieke
externe werkruimte voor dat bereik. Bij het volgende gebruik wordt een nieuwe externe werkruimte gevuld vanuit
de lokale werkruimte.

Voor de `mirror`-modus zet opnieuw aanmaken vooral de externe uitvoeringsomgeving terug, omdat
de lokale werkruimte canoniek blijft.

### Wanneer opnieuw aanmaken

Maak opnieuw aan na het wijzigen van een van deze:

- `agents.defaults.sandbox.backend`
- `plugins.entries.openshell.config.from`
- `plugins.entries.openshell.config.mode`
- `plugins.entries.openshell.config.policy`

```bash
openclaw sandbox recreate --all
```

## Beveiligingsverharding

OpenShell pint de root-fd van de werkruimte en controleert de sandboxidentiteit opnieuw voor elke
leesactie, zodat symlinkwissels of een opnieuw gemounte werkruimte leesacties niet kunnen omleiden uit
de bedoelde externe werkruimte.

## Huidige beperkingen

- Sandboxbrowser wordt niet ondersteund op de OpenShell-backend.
- `sandbox.docker.binds` is niet van toepassing op OpenShell.
- Docker-specifieke runtimeknoppen onder `sandbox.docker.*` zijn alleen van toepassing op de Docker-
  backend.

## Hoe het werkt

1. OpenClaw roept `openshell sandbox create` aan (met `--from`, `--gateway`,
   `--policy`, `--providers`, `--gpu`-vlaggen zoals geconfigureerd).
2. OpenClaw roept `openshell sandbox ssh-config <name>` aan om SSH-verbindingsgegevens
   voor de sandbox op te halen.
3. Core schrijft de SSH-configuratie naar een tijdelijk bestand en opent een SSH-sessie met dezelfde
   externe bestandssysteembrug als de generieke SSH-backend.
4. In `mirror`-modus: synchroniseer lokaal naar extern voor exec, voer uit, synchroniseer terug na exec.
5. In `remote`-modus: vul eenmalig bij aanmaak en werk daarna rechtstreeks op de externe
   werkruimte.

## Gerelateerd

- [Sandboxing](/nl/gateway/sandboxing) -- modi, bereiken en backendvergelijking
- [Sandbox vs Toolbeleid vs Verhoogd](/nl/gateway/sandbox-vs-tool-policy-vs-elevated) -- geblokkeerde tools debuggen
- [Multi-Agent-sandbox en tools](/nl/tools/multi-agent-sandbox-tools) -- overschrijvingen per agent
- [Sandbox-CLI](/nl/cli/sandbox) -- `openclaw sandbox`-opdrachten
