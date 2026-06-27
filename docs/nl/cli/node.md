---
read_when:
    - De headless Node-host uitvoeren
    - Een niet-macOS-node koppelen voor system.run
summary: CLI-referentie voor `openclaw node` (Node-host zonder grafische interface)
title: Node
x-i18n:
    generated_at: "2026-06-27T17:21:15Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 03a1b02e90f8f5f7edcfb2e7fd75ef0cbbdeae79dc0ce91339f31a80daeaaa92
    source_path: cli/node.md
    workflow: 16
---

# `openclaw node`

Voer een **headless nodehost** uit die verbinding maakt met de Gateway WebSocket en
`system.run` / `system.which` op deze machine beschikbaar maakt.

## Waarom een nodehost gebruiken?

Gebruik een nodehost wanneer je wilt dat agents **opdrachten uitvoeren op andere machines** in je
netwerk zonder daar een volledige macOS-companion-app te installeren.

Veelvoorkomende gebruiksscenario's:

- Opdrachten uitvoeren op externe Linux-/Windows-machines (buildservers, labmachines, NAS).
- Exec **gesandboxed** houden op de gateway, maar goedgekeurde uitvoeringen delegeren naar andere hosts.
- Een lichtgewicht, headless uitvoeringsdoel bieden voor automatisering of CI-nodes.

Uitvoering blijft beschermd door **exec-goedkeuringen** en allowlists per agent op de
nodehost, zodat je opdrachttoegang beperkt en expliciet kunt houden.

## Browserproxy (zero-config)

Nodehosts adverteren automatisch een browserproxy als `browser.enabled` niet is
uitgeschakeld op de node. Hierdoor kan de agent browserautomatisering op die node gebruiken
zonder extra configuratie.

Standaard stelt de proxy het normale browserprofieloppervlak van de node beschikbaar. Als je
`nodeHost.browserProxy.allowProfiles` instelt, wordt de proxy restrictief:
profieltargeting buiten de allowlist wordt geweigerd, en routes voor het
maken/verwijderen van persistente profielen worden via de proxy geblokkeerd.

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
- `--tls`: TLS gebruiken voor de gatewayverbinding
- `--tls-fingerprint <sha256>`: Verwachte TLS-certificaatvingerafdruk (sha256)
- `--node-id <id>`: Node-id overschrijven (wist pairing-token)
- `--display-name <name>`: Weergavenaam van de node overschrijven

## Gateway-auth voor nodehost

`openclaw node run` en `openclaw node install` bepalen gateway-auth uit config/env (geen `--token`/`--password`-flags op node-opdrachten):

- `OPENCLAW_GATEWAY_TOKEN` / `OPENCLAW_GATEWAY_PASSWORD` worden eerst gecontroleerd.
- Daarna lokale config-fallback: `gateway.auth.token` / `gateway.auth.password`.
- In lokale modus erft de nodehost bewust geen `gateway.remote.token` / `gateway.remote.password`.
- Als `gateway.auth.token` / `gateway.auth.password` expliciet via SecretRef is geconfigureerd en niet kan worden opgelost, faalt node-authresolutie fail-closed (geen maskering door externe fallback).
- In `gateway.mode=remote` komen externe clientvelden (`gateway.remote.token` / `gateway.remote.password`) ook in aanmerking volgens de externe prioriteitsregels.
- Authresolutie voor nodehosts honoreert alleen `OPENCLAW_GATEWAY_*`-env-vars.

Voor een node die verbinding maakt met een plaintext `ws://` Gateway worden loopback,
private IP-literals, `.local` en Tailnet `*.ts.net`-hosts geaccepteerd. Voor andere
vertrouwde private-DNS-namen stel je `OPENCLAW_ALLOW_INSECURE_PRIVATE_WS=1` in; zonder
deze instelling faalt het starten van de node fail-closed en wordt je gevraagd `wss://`, een SSH-tunnel of
Tailscale te gebruiken. Dit is een opt-in via de procesomgeving, geen `openclaw.json`-configkey.
`openclaw node install` bewaart dit in de beheerde nodeservice wanneer het
aanwezig is in de omgeving van de installatieopdracht.

## Service (achtergrond)

Installeer een headless nodehost als gebruikersservice.

```bash
openclaw node install --host <gateway-host> --port 18789
```

Opties:

- `--host <host>`: Gateway WebSocket-host (standaard: `127.0.0.1`)
- `--port <port>`: Gateway WebSocket-poort (standaard: `18789`)
- `--tls`: TLS gebruiken voor de gatewayverbinding
- `--tls-fingerprint <sha256>`: Verwachte TLS-certificaatvingerafdruk (sha256)
- `--node-id <id>`: Node-id overschrijven (wist pairing-token)
- `--display-name <name>`: Weergavenaam van de node overschrijven
- `--runtime <runtime>`: Serviceruntime (`node` of `bun`)
- `--force`: Opnieuw installeren/overschrijven als deze al is geïnstalleerd

Beheer de service:

```bash
openclaw node status
openclaw node start
openclaw node stop
openclaw node restart
openclaw node uninstall
```

Gebruik `openclaw node run` voor een nodehost op de voorgrond (geen service).

Serviceopdrachten accepteren `--json` voor machineleesbare uitvoer.

De nodehost probeert Gateway-herstarts en netwerksluitingen opnieuw binnen hetzelfde proces. Als de
Gateway een terminale token-/wachtwoord-/bootstrap-authpauze meldt, logt de nodehost
de sluitingsdetails en sluit af met een niet-nulstatus, zodat launchd/systemd hem met
verse config en credentials kan herstarten. Pauzes waarvoor pairing vereist is, blijven in de voorgrondflow
zodat het wachtende verzoek kan worden goedgekeurd.

## Pairing

De eerste verbinding maakt een wachtend device-pairingverzoek (`role: node`) op de Gateway.
Keur dit goed via:

```bash
openclaw devices list
openclaw devices approve <requestId>
```

Op strikt beheerde nodenetwerken kan de Gateway-operator expliciet opt-innen
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
aangevraagde scopes. Operator-/browserclients, Control UI, WebChat, en role-,
scope-, metadata- of public-key-upgrades vereisen nog steeds handmatige goedkeuring.

Als de node opnieuw pairing probeert met gewijzigde authdetails (role/scopes/public key),
wordt het vorige wachtende verzoek vervangen en wordt een nieuwe `requestId` gemaakt.
Voer `openclaw devices list` opnieuw uit vóór goedkeuring.

De nodehost bewaart zijn node-id, token, weergavenaam en gatewayverbindingsinformatie in
`~/.openclaw/node.json`.

## Exec-goedkeuringen

`system.run` wordt beschermd door lokale exec-goedkeuringen:

- `$OPENCLAW_STATE_DIR/exec-approvals.json`, of
  `~/.openclaw/exec-approvals.json` wanneer de variabele niet is ingesteld
- [Exec-goedkeuringen](/nl/tools/exec-approvals)
- `openclaw approvals --node <id|name|ip>` (bewerken vanaf de Gateway)

Voor goedgekeurde async node-exec bereidt OpenClaw een canonieke `systemRunPlan` voor
vóór de prompt. De later goedgekeurde `system.run`-forward hergebruikt dat opgeslagen
plan, zodat bewerkingen aan opdracht-/cwd-/sessievelden nadat het goedkeuringsverzoek is
gemaakt worden geweigerd in plaats van te wijzigen wat de node uitvoert.

## Gerelateerd

- [CLI-referentie](/nl/cli)
- [Nodes](/nl/nodes)
