---
read_when:
    - Je wilt door de cloud beheerde sandboxes in plaats van lokale Docker
    - Je stelt de OpenShell-plugin in
    - Je moet kiezen tussen spiegel- en externe-werkruimtemodi
summary: Gebruik OpenShell als beheerde sandbox-backend voor OpenClaw-agenten
title: OpenShell
x-i18n:
    generated_at: "2026-06-27T17:35:33Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: d278f7550a3178c30a1b42f80495c55bb9827f7785ce9c4d1ee4a57adb3a5e4b
    source_path: gateway/openshell.md
    workflow: 16
---

OpenShell is een beheerde sandbox-backend voor OpenClaw. In plaats van Docker
containers lokaal uit te voeren, delegeert OpenClaw de levenscyclus van de
sandbox aan de `openshell` CLI, die externe omgevingen inricht met
SSH-gebaseerde opdrachtuitvoering.

De OpenShell-Plugin hergebruikt hetzelfde kern-SSH-transport en dezelfde
externe bestandssysteembrug als de generieke [SSH-backend](/nl/gateway/sandboxing#ssh-backend). Deze voegt
OpenShell-specifieke levenscyclus toe (`sandbox create/get/delete`, `sandbox ssh-config`)
en een optionele `mirror`-werkruimtemodus.

## Vereisten

- OpenShell-Plugin geïnstalleerd (`openclaw plugins install @openclaw/openshell-sandbox`)
- De `openshell` CLI geïnstalleerd en beschikbaar op `PATH` (of stel een aangepast pad in via
  `plugins.entries.openshell.config.command`)
- Een OpenShell-account met sandbox-toegang
- OpenClaw Gateway actief op de host

## Snel starten

1. Installeer en schakel de Plugin in en stel daarna de sandbox-backend in:

```bash
openclaw plugins install @openclaw/openshell-sandbox
```

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

2. Herstart de Gateway. Bij de volgende agentbeurt maakt OpenClaw een OpenShell-
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

- Vóór `exec` synchroniseert OpenClaw de lokale werkruimte naar de OpenShell-sandbox.
- Na `exec` synchroniseert OpenClaw de externe werkruimte terug naar de lokale werkruimte.
- Bestandstools werken nog steeds via de sandboxbrug, maar de lokale werkruimte
  blijft tussen beurten de bron van waarheid.

Het meest geschikt voor:

- Je bewerkt bestanden lokaal buiten OpenClaw en wilt dat die wijzigingen automatisch
  zichtbaar zijn in de sandbox.
- Je wilt dat de OpenShell-sandbox zich zoveel mogelijk gedraagt als de Docker-backend.
- Je wilt dat de hostwerkruimte sandboxschrijfacties weergeeft na elke exec-beurt.

Afweging: extra synchronisatiekosten vóór en na elke exec.

### `remote`

Gebruik `plugins.entries.openshell.config.mode: "remote"` wanneer je wilt dat de
**OpenShell-werkruimte canoniek wordt**.

Gedrag:

- Wanneer de sandbox voor het eerst wordt aangemaakt, vult OpenClaw de externe werkruimte
  één keer vanuit de lokale werkruimte.
- Daarna werken `exec`, `read`, `write`, `edit` en `apply_patch`
  rechtstreeks op de externe OpenShell-werkruimte.
- OpenClaw synchroniseert externe wijzigingen **niet** terug naar de lokale werkruimte.
- Media-lezingen tijdens prompts blijven werken, omdat bestands- en mediatools via
  de sandboxbrug lezen.

Het meest geschikt voor:

- De sandbox moet primair aan de externe kant leven.
- Je wilt lagere synchronisatie-overhead per beurt.
- Je wilt niet dat lokale bewerkingen op de host stilzwijgend externe sandboxstatus overschrijven.

<Warning>
Als je na de initiële vulling bestanden op de host buiten OpenClaw bewerkt, ziet de externe sandbox die wijzigingen **niet**. Gebruik `openclaw sandbox recreate` om opnieuw te vullen.
</Warning>

### Een modus kiezen

|                          | `mirror`                   | `remote`                  |
| ------------------------ | -------------------------- | ------------------------- |
| **Canonieke werkruimte** | Lokale host                | Externe OpenShell         |
| **Synchronisatierichting** | Bidirectioneel (elke exec) | Eenmalige vulling         |
| **Overhead per beurt**   | Hoger (upload + download)  | Lager (rechtstreekse externe bewerkingen) |
| **Lokale bewerkingen zichtbaar?** | Ja, bij de volgende exec | Nee, tot opnieuw aanmaken |
| **Het meest geschikt voor** | Ontwikkelworkflows       | Langlopende agents, CI    |

## Configuratiereferentie

Alle OpenShell-configuratie staat onder `plugins.entries.openshell.config`:

| Sleutel                   | Type                     | Standaard     | Beschrijving                                          |
| ------------------------- | ------------------------ | ------------- | ----------------------------------------------------- |
| `mode`                    | `"mirror"` of `"remote"` | `"mirror"`    | Synchronisatiemodus voor werkruimte                   |
| `command`                 | `string`                 | `"openshell"` | Pad of naam van de `openshell` CLI                    |
| `from`                    | `string`                 | `"openclaw"`  | Sandboxbron voor eerste aanmaak                       |
| `gateway`                 | `string`                 | —             | OpenShell Gateway-naam (`--gateway`)                  |
| `gatewayEndpoint`         | `string`                 | —             | OpenShell Gateway-eindpunt-URL (`--gateway-endpoint`) |
| `policy`                  | `string`                 | —             | OpenShell-beleids-ID voor sandboxaanmaak              |
| `providers`               | `string[]`               | `[]`          | Providernamen om te koppelen wanneer de sandbox wordt aangemaakt |
| `gpu`                     | `boolean`                | `false`       | GPU-resources aanvragen                               |
| `autoProviders`           | `boolean`                | `true`        | Geef `--auto-providers` mee tijdens sandboxaanmaak    |
| `remoteWorkspaceDir`      | `string`                 | `"/sandbox"`  | Primaire schrijfbare werkruimte binnen de sandbox     |
| `remoteAgentWorkspaceDir` | `string`                 | `"/agent"`    | Koppelpad voor agentwerkruimte (voor alleen-lezen-toegang) |
| `timeoutSeconds`          | `number`                 | `120`         | Timeout voor `openshell` CLI-bewerkingen              |

Sandboxinstellingen op niveau (`mode`, `scope`, `workspaceAccess`) worden geconfigureerd onder
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

Voor `remote`-modus is **opnieuw aanmaken extra belangrijk**: dit verwijdert de canonieke
externe werkruimte voor die scope. Het volgende gebruik vult een nieuwe externe werkruimte vanuit
de lokale werkruimte.

Voor `mirror`-modus reset opnieuw aanmaken vooral de externe uitvoeringsomgeving, omdat
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

## Beveiligingsversterking

OpenShell pint de fd van de werkruimteroot en controleert de sandboxidentiteit opnieuw vóór elke
leesactie, zodat symlinkwissels of een opnieuw gekoppelde werkruimte leesacties niet buiten
de bedoelde externe werkruimte kunnen omleiden.

## Huidige beperkingen

- Sandboxbrowser wordt niet ondersteund op de OpenShell-backend.
- `sandbox.docker.binds` is niet van toepassing op OpenShell.
- Docker-specifieke runtimeknoppen onder `sandbox.docker.*` zijn alleen van toepassing op de Docker-
  backend.

## Hoe het werkt

1. OpenClaw roept `openshell sandbox create` aan (met `--from`, `--gateway`,
   `--policy`, `--providers`, `--gpu`-flags zoals geconfigureerd).
2. OpenClaw roept `openshell sandbox ssh-config <name>` aan om SSH-verbindingsdetails
   voor de sandbox op te halen.
3. Core schrijft de SSH-configuratie naar een tijdelijk bestand en opent een SSH-sessie met
   dezelfde externe bestandssysteembrug als de generieke SSH-backend.
4. In `mirror`-modus: synchroniseer lokaal naar extern vóór exec, voer uit, synchroniseer terug na exec.
5. In `remote`-modus: vul één keer bij aanmaak en werk daarna rechtstreeks op de externe
   werkruimte.

## Gerelateerd

- [Sandboxing](/nl/gateway/sandboxing) -- modi, scopes en backendvergelijking
- [Sandbox versus toolbeleid versus Elevated](/nl/gateway/sandbox-vs-tool-policy-vs-elevated) -- geblokkeerde tools debuggen
- [Multi-agent-sandbox en tools](/nl/tools/multi-agent-sandbox-tools) -- overschrijvingen per agent
- [Sandbox-CLI](/nl/cli/sandbox) -- `openclaw sandbox`-opdrachten
