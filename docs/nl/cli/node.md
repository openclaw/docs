---
read_when:
    - De headless Node-host uitvoeren
    - Een niet-macOS-node koppelen voor system.run
summary: CLI-referentie voor `openclaw node` (nodehost zonder grafische interface)
title: Node
x-i18n:
    generated_at: "2026-07-01T13:09:51Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: b7e68602cb655a6852544f055b9b6c26f2e9cfe1b4d7933e7c27e67011c7cd55
    source_path: cli/node.md
    workflow: 16
---

# `openclaw node`

Voer een **headless node-host** uit die verbinding maakt met de Gateway WebSocket en
`system.run` / `system.which` op deze machine beschikbaar maakt.

## Waarom een node-host gebruiken?

Gebruik een node-host wanneer je agents **opdrachten op andere machines** in je
netwerk wilt laten uitvoeren zonder daar een volledige macOS companion-app te installeren.

Veelvoorkomende gebruikssituaties:

- Voer opdrachten uit op externe Linux-/Windows-machines (buildservers, labmachines, NAS).
- Houd exec **gesandboxed** op de gateway, maar delegeer goedgekeurde uitvoeringen naar andere hosts.
- Bied een lichte, headless uitvoeringsdoel voor automatisering of CI-nodes.

Uitvoering wordt nog steeds bewaakt door **exec-goedkeuringen** en per-agent allowlists op de
node-host, zodat je opdrachttoegang afgebakend en expliciet kunt houden.

## Browserproxy (zero-configuratie)

Node-hosts adverteren automatisch een browserproxy als `browser.enabled` niet is
uitgeschakeld op de node. Hierdoor kan de agent browserautomatisering op die node gebruiken
zonder extra configuratie.

Standaard stelt de proxy het normale browserprofieloppervlak van de node beschikbaar. Als je
`nodeHost.browserProxy.allowProfiles` instelt, wordt de proxy beperkend:
profieltargeting buiten de allowlist wordt geweigerd, en permanente profielroutes voor
aanmaken/verwijderen worden via de proxy geblokkeerd.

Schakel dit zo nodig uit op de node:

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
- `--context-path <path>`: Gateway WebSocket-contextpad (bijv. `/openclaw-gw`). Wordt toegevoegd aan de WebSocket-URL.
- `--tls`: Gebruik TLS voor de gatewayverbinding
- `--tls-fingerprint <sha256>`: Verwachte TLS-certificaatvingerafdruk (sha256)
- `--node-id <id>`: Overschrijf node-id (wist pairing-token)
- `--display-name <name>`: Overschrijf de weergavenaam van de node

## Gateway-authenticatie voor node-host

`openclaw node run` en `openclaw node install` lossen gateway-authenticatie op uit config/env (geen `--token`/`--password`-vlaggen op node-opdrachten):

- `OPENCLAW_GATEWAY_TOKEN` / `OPENCLAW_GATEWAY_PASSWORD` worden eerst gecontroleerd.
- Daarna lokale config-fallback: `gateway.auth.token` / `gateway.auth.password`.
- In lokale modus neemt de node-host bewust geen `gateway.remote.token` / `gateway.remote.password` over.
- Als `gateway.auth.token` / `gateway.auth.password` expliciet via SecretRef is geconfigureerd en niet kan worden opgelost, faalt node-authenticatie gesloten (geen maskering door externe fallback).
- In `gateway.mode=remote` komen externe clientvelden (`gateway.remote.token` / `gateway.remote.password`) ook in aanmerking volgens de externe prioriteitsregels.
- Auth-resolutie voor de node-host respecteert alleen `OPENCLAW_GATEWAY_*`-env-vars.

Voor een node die verbinding maakt met een niet-versleutelde `ws://` Gateway, worden loopback, letterlijke privé-IP-adressen,
`.local` en Tailnet `*.ts.net`-hosts geaccepteerd. Stel voor andere
vertrouwde private-DNS-namen `OPENCLAW_ALLOW_INSECURE_PRIVATE_WS=1` in; zonder
deze instelling faalt het starten van de node gesloten en wordt gevraagd om `wss://`, een SSH-tunnel of
Tailscale te gebruiken. Dit is een opt-in via de procesomgeving, geen `openclaw.json`-configuratiesleutel.
`openclaw node install` bewaart dit in de beheerde nodeservice wanneer het aanwezig is
in de omgeving van de install-opdracht.

## Service (achtergrond)

Installeer een headless node-host als gebruikersservice.

```bash
openclaw node install --host <gateway-host> --port 18789
```

Opties:

- `--host <host>`: Gateway WebSocket-host (standaard: `127.0.0.1`)
- `--port <port>`: Gateway WebSocket-poort (standaard: `18789`)
- `--context-path <path>`: Gateway WebSocket-contextpad (bijv. `/openclaw-gw`). Wordt toegevoegd aan de WebSocket-URL.
- `--tls`: Gebruik TLS voor de gatewayverbinding
- `--tls-fingerprint <sha256>`: Verwachte TLS-certificaatvingerafdruk (sha256)
- `--node-id <id>`: Overschrijf node-id (wist pairing-token)
- `--display-name <name>`: Overschrijf de weergavenaam van de node
- `--runtime <runtime>`: Serviceruntime (`node` of `bun`)
- `--force`: Opnieuw installeren/overschrijven als al geinstalleerd

Beheer de service:

```bash
openclaw node status
openclaw node start
openclaw node stop
openclaw node restart
openclaw node uninstall
```

Gebruik `openclaw node run` voor een node-host op de voorgrond (geen service).

Serviceopdrachten accepteren `--json` voor machineleesbare uitvoer.

De node-host probeert Gateway-herstarts en netwerkafsluitingen opnieuw binnen het proces. Als de
Gateway een terminale auth-pauze voor token/wachtwoord/bootstrap meldt, logt de node-host
de sluitingsdetails en sluit af met een niet-nulstatus, zodat launchd/systemd hem met
verse config en referenties kan herstarten. Pauzes waarvoor pairing vereist is blijven in de voorgrondflow,
zodat het wachtende verzoek kan worden goedgekeurd.

## Pairing

De eerste verbinding maakt een wachtend device-pairingverzoek (`role: node`) aan op de Gateway.
Keur het goed via:

```bash
openclaw devices list
openclaw devices approve <requestId>
```

Op strak gecontroleerde nodenetwerken kan de Gateway-operator expliciet opt-innen
voor automatische goedkeuring van eerste node-pairing vanaf vertrouwde CIDR's:

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

Dit is standaard uitgeschakeld. Het geldt alleen voor nieuwe `role: node`-pairing zonder
aangevraagde scopes. Operator-/browserclients, Control UI, WebChat en upgrades van rol,
scope, metadata of publieke sleutel vereisen nog steeds handmatige goedkeuring.

Als de node pairing opnieuw probeert met gewijzigde authenticatiedetails (rol/scopes/publieke sleutel),
wordt het vorige wachtende verzoek vervangen en wordt een nieuwe `requestId` aangemaakt.
Voer `openclaw devices list` opnieuw uit vóór goedkeuring.

De node-host bewaart zijn node-id, token, weergavenaam en gatewayverbindingsinfo in
`~/.openclaw/node.json`.

## Exec-goedkeuringen

`system.run` wordt afgeschermd door lokale exec-goedkeuringen:

- `$OPENCLAW_STATE_DIR/exec-approvals.json`, of
  `~/.openclaw/exec-approvals.json` wanneer de variabele niet is ingesteld
- [Exec-goedkeuringen](/nl/tools/exec-approvals)
- `openclaw approvals --node <id|name|ip>` (bewerken vanaf de Gateway)

Voor goedgekeurde async node-exec bereidt OpenClaw een canoniek `systemRunPlan` voor
voordat er wordt gevraagd. De later goedgekeurde `system.run`-forward hergebruikt dat opgeslagen
plan, zodat bewerkingen aan opdracht-/cwd-/sessievelden nadat het goedkeuringsverzoek is
aangemaakt worden geweigerd in plaats van te wijzigen wat de node uitvoert.

## Gerelateerd

- [CLI-referentie](/nl/cli)
- [Nodes](/nl/nodes)
