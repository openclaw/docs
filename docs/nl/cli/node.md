---
read_when:
    - De headless Node-host uitvoeren
    - Een niet-macOS-Node koppelen voor system.run
summary: CLI-referentie voor `openclaw node` (Node-host zonder grafische interface)
title: Node
x-i18n:
    generated_at: "2026-04-29T22:33:44Z"
    model: gpt-5.5
    provider: openai
    source_hash: 40f623b163a3c3bcd2d3ff218c5e62a4acba45f7e3f16694d8da62a004b77706
    source_path: cli/node.md
    workflow: 16
---

# `openclaw node`

Voer een **headless Node-host** uit die verbinding maakt met de Gateway WebSocket en
`system.run` / `system.which` op deze machine beschikbaar maakt.

## Waarom een Node-host gebruiken?

Gebruik een Node-host wanneer je agents **opdrachten op andere machines** in je
netwerk wilt laten uitvoeren zonder daar een volledige macOS-companion-app te installeren.

Veelvoorkomende gebruikssituaties:

- Voer opdrachten uit op externe Linux-/Windows-machines (buildservers, labmachines, NAS).
- Houd exec **gesandboxt** op de Gateway, maar delegeer goedgekeurde uitvoeringen naar andere hosts.
- Bied een lichtgewicht, headless uitvoeringsdoel voor automatisering of CI-nodes.

Uitvoering wordt nog steeds bewaakt door **exec-goedkeuringen** en allowlists per agent op de
Node-host, zodat je opdrachttoegang afgebakend en expliciet kunt houden.

## Browserproxy (zero-config)

Node-hosts adverteren automatisch een browserproxy als `browser.enabled` niet is
uitgeschakeld op de Node. Hierdoor kan de agent browserautomatisering op die Node gebruiken
zonder extra configuratie.

Standaard stelt de proxy het normale browserprofieloppervlak van de Node beschikbaar. Als je
`nodeHost.browserProxy.allowProfiles` instelt, wordt de proxy beperkend:
profieltargeting buiten de allowlist wordt geweigerd, en routes voor het
aanmaken/verwijderen van persistente profielen worden via de proxy geblokkeerd.

Schakel dit indien nodig uit op de Node:

```json5
{
  nodeHost: {
    browserProxy: {
      enabled: false,
    },
  },
}
```

## Uitvoeren (voorgrond)

```bash
openclaw node run --host <gateway-host> --port 18789
```

Opties:

- `--host <host>`: Gateway WebSocket-host (standaard: `127.0.0.1`)
- `--port <port>`: Gateway WebSocket-poort (standaard: `18789`)
- `--tls`: Gebruik TLS voor de Gateway-verbinding
- `--tls-fingerprint <sha256>`: Verwachte TLS-certificaatvingerafdruk (sha256)
- `--node-id <id>`: Overschrijf Node-id (wist pairing-token)
- `--display-name <name>`: Overschrijf de weergavenaam van de Node

## Gateway-auth voor Node-host

`openclaw node run` en `openclaw node install` lossen Gateway-auth op uit config/env (geen `--token`/`--password`-vlaggen op Node-opdrachten):

- `OPENCLAW_GATEWAY_TOKEN` / `OPENCLAW_GATEWAY_PASSWORD` worden eerst gecontroleerd.
- Daarna lokale config-fallback: `gateway.auth.token` / `gateway.auth.password`.
- In lokale modus erft de Node-host bewust geen `gateway.remote.token` / `gateway.remote.password`.
- Als `gateway.auth.token` / `gateway.auth.password` expliciet via SecretRef is geconfigureerd en niet kan worden opgelost, faalt Node-authresolutie gesloten (geen maskering door remote fallback).
- In `gateway.mode=remote` komen remote-clientvelden (`gateway.remote.token` / `gateway.remote.password`) ook in aanmerking volgens remote-voorrangsregels.
- Authresolutie van Node-hosts respecteert alleen `OPENCLAW_GATEWAY_*`-env-vars.

Voor een Node die verbinding maakt met een niet-loopback `ws://` Gateway op een vertrouwd privénetwerk
stel je `OPENCLAW_ALLOW_INSECURE_PRIVATE_WS=1` in. Zonder dit faalt het starten van de Node
gesloten en wordt je gevraagd `wss://`, een SSH-tunnel of Tailscale te gebruiken.
Dit is een opt-in via de procesomgeving, geen `openclaw.json`-configuratiesleutel.
`openclaw node install` legt dit vast in de bewaakte Node-service wanneer het
aanwezig is in de omgeving van de installatieopdracht.

## Service (achtergrond)

Installeer een headless Node-host als gebruikersservice.

```bash
openclaw node install --host <gateway-host> --port 18789
```

Opties:

- `--host <host>`: Gateway WebSocket-host (standaard: `127.0.0.1`)
- `--port <port>`: Gateway WebSocket-poort (standaard: `18789`)
- `--tls`: Gebruik TLS voor de Gateway-verbinding
- `--tls-fingerprint <sha256>`: Verwachte TLS-certificaatvingerafdruk (sha256)
- `--node-id <id>`: Overschrijf Node-id (wist pairing-token)
- `--display-name <name>`: Overschrijf de weergavenaam van de Node
- `--runtime <runtime>`: Service-runtime (`node` of `bun`)
- `--force`: Herinstalleer/overschrijf als al geïnstalleerd

Beheer de service:

```bash
openclaw node status
openclaw node start
openclaw node stop
openclaw node restart
openclaw node uninstall
```

Gebruik `openclaw node run` voor een Node-host op de voorgrond (geen service).

Serviceopdrachten accepteren `--json` voor machineleesbare uitvoer.

De Node-host probeert Gateway-herstarts en netwerkafsluitingen opnieuw binnen hetzelfde proces. Als de
Gateway een terminale token-/wachtwoord-/bootstrap-authpauze rapporteert, logt de Node-host
de sluitingsdetails en sluit af met een niet-nulstatus, zodat launchd/systemd hem met
verse config en referenties kan herstarten. Pauzes waarvoor pairing vereist is, blijven in de voorgrondflow
zodat het wachtende verzoek kan worden goedgekeurd.

## Pairing

De eerste verbinding maakt een wachtend apparaatpairingverzoek (`role: node`) aan op de Gateway.
Keur dit goed via:

```bash
openclaw devices list
openclaw devices approve <requestId>
```

Op strikt gecontroleerde Node-netwerken kan de Gateway-operator expliciet opt-innen
voor automatische goedkeuring van eerste Node-pairing vanaf vertrouwde CIDR's:

```json5
{
  gateway: {
    nodes: {
      pairing: {
        autoApproveCidrs: ["192.168.1.0/24"],
      },
    },
  },
}
```

Dit is standaard uitgeschakeld. Het is alleen van toepassing op nieuwe `role: node`-pairing met
geen gevraagde scopes. Operator-/browserclients, Control UI, WebChat, en upgrades van rol,
scope, metadata of publieke sleutel vereisen nog steeds handmatige goedkeuring.

Als de Node pairing opnieuw probeert met gewijzigde authdetails (rol/scopes/publieke sleutel),
wordt het vorige wachtende verzoek vervangen en wordt een nieuwe `requestId` aangemaakt.
Voer `openclaw devices list` opnieuw uit vóór goedkeuring.

De Node-host slaat zijn Node-id, token, weergavenaam en Gateway-verbindingsinfo op in
`~/.openclaw/node.json`.

## Exec-goedkeuringen

`system.run` wordt gated door lokale exec-goedkeuringen:

- `~/.openclaw/exec-approvals.json`
- [Exec-goedkeuringen](/nl/tools/exec-approvals)
- `openclaw approvals --node <id|name|ip>` (bewerken vanaf de Gateway)

Voor goedgekeurde async Node-exec bereidt OpenClaw een canoniek `systemRunPlan` voor
voordat om bevestiging wordt gevraagd. De latere goedgekeurde `system.run`-forward hergebruikt dat opgeslagen
plan, zodat bewerkingen aan opdracht-/cwd-/sessievelden nadat het goedkeuringsverzoek is
aangemaakt, worden geweigerd in plaats van te wijzigen wat de Node uitvoert.

## Gerelateerd

- [CLI-referentie](/nl/cli)
- [Nodes](/nl/nodes)
