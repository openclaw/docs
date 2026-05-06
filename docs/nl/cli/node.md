---
read_when:
    - De headless Node-host uitvoeren
    - Een niet-macOS-Node koppelen voor system.run
summary: CLI-referentie voor `openclaw node` (nodehost zonder grafische interface)
title: Node
x-i18n:
    generated_at: "2026-05-06T17:53:45Z"
    model: gpt-5.5
    provider: openai
    source_hash: af4735ac4961dc36fd3f11299eb3ec4e156835e7257b21a79bb1d4b467445faa
    source_path: cli/node.md
    workflow: 16
---

# `openclaw node`

Voer een **headless Node-host** uit die verbinding maakt met de Gateway WebSocket en
`system.run` / `system.which` op deze machine beschikbaar maakt.

## Waarom een Node-host gebruiken?

Gebruik een Node-host wanneer je wilt dat agents **opdrachten uitvoeren op andere machines** in je
netwerk zonder daar een volledige macOS-begeleidende app te installeren.

Veelvoorkomende gebruikssituaties:

- Voer opdrachten uit op externe Linux-/Windows-machines (buildservers, labmachines, NAS).
- Houd exec **gesandboxt** op de Gateway, maar delegeer goedgekeurde uitvoeringen naar andere hosts.
- Bied een lichtgewicht, headless uitvoeringsdoel voor automatisering of CI-nodes.

Uitvoering blijft bewaakt door **exec-goedkeuringen** en toelatingslijsten per agent op de
Node-host, zodat je opdrachttoegang afgebakend en expliciet kunt houden.

## Browserproxy (zonder configuratie)

Node-hosts adverteren automatisch een browserproxy als `browser.enabled` niet is
uitgeschakeld op de Node. Hierdoor kan de agent browserautomatisering op die Node gebruiken
zonder extra configuratie.

Standaard stelt de proxy het normale browserprofieloppervlak van de Node beschikbaar. Als je
`nodeHost.browserProxy.allowProfiles` instelt, wordt de proxy beperkend:
het richten op profielen buiten de toelatingslijst wordt geweigerd, en routes voor het
maken/verwijderen van persistente profielen worden via de proxy geblokkeerd.

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
- `--node-id <id>`: Overschrijf Node-id (wist koppelingstoken)
- `--display-name <name>`: Overschrijf de weergavenaam van de Node

## Gateway-authenticatie voor Node-host

`openclaw node run` en `openclaw node install` lossen Gateway-authenticatie op uit config/env (geen `--token`/`--password`-flags op Node-opdrachten):

- `OPENCLAW_GATEWAY_TOKEN` / `OPENCLAW_GATEWAY_PASSWORD` worden eerst gecontroleerd.
- Daarna lokale configuratieterugval: `gateway.auth.token` / `gateway.auth.password`.
- In lokale modus neemt de Node-host bewust geen `gateway.remote.token` / `gateway.remote.password` over.
- Als `gateway.auth.token` / `gateway.auth.password` expliciet via SecretRef is geconfigureerd en niet kan worden opgelost, faalt de Node-authenticatieoplossing gesloten (geen maskering door externe terugval).
- In `gateway.mode=remote` komen externe clientvelden (`gateway.remote.token` / `gateway.remote.password`) ook in aanmerking volgens de externe precedentieregels.
- Authenticatieoplossing voor de Node-host respecteert alleen `OPENCLAW_GATEWAY_*`-env-vars.

Voor een Node die verbinding maakt met een niet-loopback `ws://` Gateway op een vertrouwd privé
netwerk, stel `OPENCLAW_ALLOW_INSECURE_PRIVATE_WS=1` in. Zonder dit faalt het opstarten van de Node
gesloten en wordt je gevraagd `wss://`, een SSH-tunnel of Tailscale te gebruiken.
Dit is een opt-in via de procesomgeving, geen configuratiesleutel in `openclaw.json`.
`openclaw node install` bewaart dit in de bewaakte Node-service wanneer het
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
- `--node-id <id>`: Overschrijf Node-id (wist koppelingstoken)
- `--display-name <name>`: Overschrijf de weergavenaam van de Node
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

Gebruik `openclaw node run` voor een Node-host op de voorgrond (geen service).

Serviceopdrachten accepteren `--json` voor machineleesbare uitvoer.

De Node-host probeert Gateway-herstarts en netwerkafsluitingen opnieuw binnen het proces. Als de
Gateway een terminale token-/wachtwoord-/bootstrap-authenticatiepauze meldt, logt de Node-host
het afsluitdetail en sluit hij af met een niet-nulcode zodat launchd/systemd hem opnieuw kan starten met
verse configuratie en referenties. Pauzes waarvoor koppeling vereist is blijven in de voorgrondflow,
zodat het openstaande verzoek kan worden goedgekeurd.

## Koppelen

De eerste verbinding maakt een openstaand apparaatkoppelingsverzoek (`role: node`) aan op de Gateway.
Keur het goed via:

```bash
openclaw devices list
openclaw devices approve <requestId>
```

Op strikt beheerde Node-netwerken kan de Gateway-operator expliciet kiezen voor
automatische goedkeuring van eerste Node-koppelingen vanaf vertrouwde CIDR's:

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

Dit is standaard uitgeschakeld. Het is alleen van toepassing op nieuwe `role: node`-koppelingen zonder
aangevraagde scopes. Operator-/browserclients, Control UI, WebChat en upgrades van rol,
scope, metadata of publieke sleutel vereisen nog steeds handmatige goedkeuring.

Als de Node opnieuw probeert te koppelen met gewijzigde authenticatiedetails (rol/scopes/publieke sleutel),
wordt het vorige openstaande verzoek vervangen en wordt een nieuw `requestId` aangemaakt.
Voer `openclaw devices list` opnieuw uit voor goedkeuring.

De Node-host bewaart zijn Node-id, token, weergavenaam en Gateway-verbindingsinfo in
`~/.openclaw/node.json`.

## Exec-goedkeuringen

`system.run` wordt afgeschermd door lokale exec-goedkeuringen:

- `~/.openclaw/exec-approvals.json`
- [Exec-goedkeuringen](/nl/tools/exec-approvals)
- `openclaw approvals --node <id|name|ip>` (bewerken vanaf de Gateway)

Voor goedgekeurde asynchrone Node-exec bereidt OpenClaw een canoniek `systemRunPlan`
voor voordat er wordt gevraagd. De later goedgekeurde doorsturing van `system.run` hergebruikt dat opgeslagen
plan, zodat bewerkingen aan opdracht-/cwd-/sessievelden nadat het goedkeuringsverzoek is
aangemaakt worden geweigerd in plaats van te wijzigen wat de Node uitvoert.

## Gerelateerd

- [CLI-referentie](/nl/cli)
- [Nodes](/nl/nodes)
