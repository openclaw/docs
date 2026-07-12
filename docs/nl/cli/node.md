---
read_when:
    - De headless Node-host uitvoeren
    - Een niet-macOS-Node koppelen voor system.run
summary: CLI-referentie voor `openclaw node` (headless Node-host)
title: Node
x-i18n:
    generated_at: "2026-07-12T08:43:36Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 076449123d8b3e9cb092a2bd7de311b87b27a128cb381fc343c68d18aeb634a0
    source_path: cli/node.md
    workflow: 16
---

# `openclaw node`

Voer een **headless Node-host** uit die verbinding maakt met de Gateway-WebSocket en
`system.run` / `system.which` op deze machine beschikbaar stelt.

## Waarom een Node-host gebruiken?

Gebruik een Node-host wanneer je agents **opdrachten op andere machines** in je
netwerk wilt laten uitvoeren zonder daar een volledige bijbehorende macOS-app te installeren.

Veelvoorkomende toepassingen:

- Opdrachten uitvoeren op externe Linux-/Windows-machines (buildservers, labmachines, NAS).
- Uitvoering **in een sandbox** op de Gateway houden, maar goedgekeurde uitvoeringen aan andere hosts delegeren.
- Een lichtgewicht, headless uitvoeringsdoel bieden voor automatisering of CI-nodes.

De uitvoering wordt nog steeds beveiligd met **uitvoeringsgoedkeuringen** en allowlists per agent op de
Node-host, zodat je opdrachttoegang afgebakend en expliciet kunt houden.

`openclaw node run` kan na het verbinden door plugins of MCP ondersteunde tools publiceren.
De Gateway vertrouwt standaard descriptors van de gekoppelde Node, maar vereist
dat de opdracht van elke descriptor binnen het goedgekeurde opdrachtenoppervlak van de Node blijft. De
agent ziet elke geaccepteerde descriptor als een normale plugintool, maar de uitvoering verloopt nog steeds
via `node.invoke`, zodat het verbreken van de verbinding met de Node de tool uit nieuwe
agentuitvoeringen verwijdert. Gateway-beheerders kunnen publicatie uitschakelen met
`gateway.nodes.pluginTools.enabled: false`.

Voeg voor declaratieve MCP-tools de normale vorm van een MCP-server toe onder
`nodeHost.mcp.servers` in `openclaw.json` op de Node-machine en start vervolgens de
Node-host opnieuw. De Node declareert de door goedkeuring beveiligde opdrachtfamilie
`mcp.tools.call.v1` en publiceert de vermelde tools na het verbinden; als de serverlijst
later wordt gewijzigd, hoeft er niet opnieuw te worden gekoppeld. Zie
[Door Node gehoste MCP-servers](/nl/nodes#node-hosted-mcp-servers).

## Browserproxy (zonder configuratie)

Node-hosts kondigen automatisch een browserproxy aan als `browser.enabled` niet
is uitgeschakeld op de Node. Hierdoor kan de agent browserautomatisering op die Node gebruiken
zonder extra configuratie.

Standaard stelt de proxy het normale browserprofieloppervlak van de Node beschikbaar. Als je
`nodeHost.browserProxy.allowProfiles` instelt, wordt de proxy beperkend:
het benaderen van profielen die niet in de allowlist staan, wordt geweigerd en routes voor het
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

- `--host <host>`: Gateway-WebSocket-host (standaard: `127.0.0.1`)
- `--port <port>`: Gateway-WebSocket-poort (standaard: `18789`)
- `--context-path <path>`: Contextpad van de Gateway-WebSocket (bijv. `/openclaw-gw`). Wordt aan de WebSocket-URL toegevoegd.
- `--tls`: TLS gebruiken voor de Gateway-verbinding
- `--no-tls`: Een Gateway-verbinding met platte tekst afdwingen, zelfs wanneer TLS in de lokale Gateway-configuratie is ingeschakeld
- `--tls-fingerprint <sha256>`: Verwachte vingerafdruk van het TLS-certificaat (sha256)
- `--node-id <id>`: De verouderde clientinstantie-ID overschrijven die in `node.json` is opgeslagen (stelt de koppeling niet opnieuw in)
- `--display-name <name>`: De weergavenaam van de Node overschrijven

## Gateway-authenticatie voor de Node-host

`openclaw node run` en `openclaw node install` bepalen Gateway-authenticatie via configuratie/omgeving (geen vlaggen `--token`/`--password` voor Node-opdrachten):

- `OPENCLAW_GATEWAY_TOKEN` / `OPENCLAW_GATEWAY_PASSWORD` worden eerst gecontroleerd.
- Daarna de lokale configuratie als terugval: `gateway.auth.token` / `gateway.auth.password`.
- In lokale modus neemt de Node-host bewust `gateway.remote.token` / `gateway.remote.password` niet over.
- Als `gateway.auth.token` / `gateway.auth.password` expliciet via SecretRef is geconfigureerd en niet kan worden opgelost, mislukt het bepalen van Node-authenticatie veilig (zonder maskerende externe terugval).
- In `gateway.mode=remote` komen externe clientvelden (`gateway.remote.token` / `gateway.remote.password`) ook in aanmerking volgens de voorrangsregels voor externe verbindingen.
- Het bepalen van authenticatie voor de Node-host houdt alleen rekening met omgevingsvariabelen van het type `OPENCLAW_GATEWAY_*`.

Voor een Node die verbinding maakt met een Gateway via `ws://` met platte tekst, worden local loopback, letterlijke
privé-IP-adressen, `.local` en Tailnet-hosts van het type `*.ts.net` geaccepteerd. Stel voor andere
vertrouwde privé-DNS-namen `OPENCLAW_ALLOW_INSECURE_PRIVATE_WS=1` in; zonder
deze instelling mislukt het opstarten van de Node veilig en wordt gevraagd om `wss://`, een SSH-tunnel of
Tailscale te gebruiken. Dit is een opt-in via de procesomgeving, geen configuratiesleutel in
`openclaw.json`.
`openclaw node install` slaat deze instelling op in de beheerde Node-service wanneer deze
aanwezig is in de omgeving van de installatieopdracht.

## Service (achtergrond)

Installeer een headless Node-host als gebruikersservice (launchd op macOS, systemd op
Linux, Windows Taakplanner op Windows).

```bash
openclaw node install --host <gateway-host> --port 18789
```

Opties:

- `--host <host>`: Gateway-WebSocket-host (standaard: `127.0.0.1`)
- `--port <port>`: Gateway-WebSocket-poort (standaard: `18789`)
- `--context-path <path>`: Contextpad van de Gateway-WebSocket (bijv. `/openclaw-gw`). Wordt aan de WebSocket-URL toegevoegd.
- `--tls`: TLS gebruiken voor de Gateway-verbinding
- `--tls-fingerprint <sha256>`: Verwachte vingerafdruk van het TLS-certificaat (sha256)
- `--node-id <id>`: De verouderde clientinstantie-ID overschrijven die in `node.json` is opgeslagen (stelt de koppeling niet opnieuw in)
- `--display-name <name>`: De weergavenaam van de Node overschrijven
- `--runtime <runtime>`: Serviceruntime (`node` of `bun`)
- `--force`: Opnieuw installeren/overschrijven indien al geïnstalleerd

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

De Node-host probeert Gateway-herstarts en gesloten netwerkverbindingen binnen het proces opnieuw. Als de
Gateway een terminale authenticatiepauze voor token/wachtwoord/bootstrap meldt, registreert de Node-host
de details van het sluiten en wordt deze afgesloten met een niet-nulstatus, zodat launchd/systemd/Taakplanner
de host opnieuw kan starten met actuele configuratie en aanmeldgegevens. Pauzes waarvoor koppeling vereist is, blijven in
de voorgrondstroom zodat het openstaande verzoek kan worden goedgekeurd.

## Koppelen

De eerste verbinding maakt een openstaand verzoek voor apparaatkoppeling (`role: node`) aan op de Gateway.

Wanneer de Gateway-host niet-interactief via SSH verbinding kan maken met de Node-host (dezelfde gebruiker,
vertrouwde hostsleutel), wordt het openstaande verzoek automatisch goedgekeurd: de Gateway
voert via SSH `openclaw node identity --json` uit op de Node-host en keurt het verzoek goed
wanneer de apparaatsleutel exact overeenkomt. Dit is standaard ingeschakeld; zie
[SSH-geverifieerde automatische goedkeuring van apparaten](/nl/gateway/pairing#ssh-verified-device-auto-approval-default)
voor de vereisten en hoe je dit uitschakelt (`gateway.nodes.pairing.sshVerify: false`).

Keur het anders handmatig goed via:

```bash
openclaw devices list
openclaw devices approve <requestId>
```

Bekijk de lokale Node-identiteit waarmee de Gateway vergelijkt:

```bash
openclaw node identity --json
```

Deze opdracht toont de apparaat-ID en openbare sleutel uit `identity/device.json` en maakt of
wijzigt nooit identiteitsbestanden.

In strikt beheerde Node-netwerken kan de Gateway-beheerder expliciet instemmen
met het automatisch goedkeuren van de eerste Node-koppeling vanuit vertrouwde CIDR's:

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

Dit is standaard uitgeschakeld (`autoApproveCidrs` is niet ingesteld). Het is alleen van toepassing op
nieuwe koppelingen met `role: node` zonder aangevraagde bereiken, vanaf een client-IP dat de
Gateway vertrouwt. Beheerder-/browserclients, Control UI, WebChat en upgrades van rol,
bereik, metadata of openbare sleutel vereisen nog steeds handmatige goedkeuring.

Als de Node de koppeling opnieuw probeert met gewijzigde authenticatiegegevens (rol/bereiken/openbare sleutel),
wordt het vorige openstaande verzoek vervangen en wordt een nieuwe `requestId` aangemaakt.
Voer vóór goedkeuring opnieuw `openclaw devices list` uit.

### Identiteits- en koppelingsstatus

De headless Node houdt de verouderde clientinstantie-ID gescheiden van de ondertekende apparaatidentiteit
die de Gateway gebruikt voor koppeling en routering. Deze bestanden bevinden zich in de
OpenClaw-statusmap (standaard `~/.openclaw`, of `$OPENCLAW_STATE_DIR`
wanneer ingesteld):

| Bestand                     | Doel                                                                                                                                          |
| --------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------- |
| `node.json`                 | Clientinstantie-ID onder de verouderde sleutel `nodeId`, weergavenaam en verbindingsmetadata van de Gateway. De client verzendt deze waarde als `instanceId`. |
| `identity/device.json`      | Ondertekend Ed25519-sleutelpaar en afgeleide apparaat-ID. Voor ondertekende verbindingen is deze apparaat-ID de gerouteerde Node-ID en koppelingsidentiteit. |
| `identity/device-auth.json` | Tokens van gekoppelde apparaten, geïndexeerd op cryptografische apparaat-ID en rol.                                                           |

`--node-id` wijzigt alleen de clientinstantie-ID in `node.json`. Het wijzigt
de cryptografische apparaat-ID niet en wist de koppelingsauthenticatie niet. Alleen
`node.json` verwijderen stelt de koppeling evenmin opnieuw in. Een Node intrekken en opnieuw koppelen:

1. Voer op de Gateway `openclaw nodes remove --node <id|name|ip>` uit.
2. Start op de Node de geïnstalleerde service opnieuw met `openclaw node restart`, of
   stop de opdracht `openclaw node run` op de voorgrond en voer deze opnieuw uit. Hiermee wordt de
   apparaatkoppelingsstroom gestart. Als `openclaw devices list` geen verzoek toont
   en de Node `AUTH_DEVICE_TOKEN_MISMATCH` meldt, start of voer je de Node nog één keer
   opnieuw uit. De geweigerde poging wist het nu ingetrokken lokale token; bij de volgende
   poging kan om koppeling worden verzocht.
3. Voer op de Gateway `openclaw devices list` uit en vervolgens
   `openclaw devices approve <deviceRequestId>`.
4. Start de Node opnieuw of voer deze nogmaals uit. Een client die voor koppeling is gepauzeerd, wordt na goedkeuring
   niet automatisch hervat; deze nieuwe verbinding maakt het afzonderlijke
   verzoek voor het opdrachtenoppervlak aan.
5. Voer op de Gateway `openclaw nodes pending` uit en vervolgens
   `openclaw nodes approve <nodeRequestId>`.

De twee verzoek-ID's zijn verschillend. Een toepasselijk beleid voor vertrouwde CIDR's kan
de eerste stap voor apparaatkoppeling automatisch goedkeuren; goedkeuring van het opdrachtenoppervlak blijft
een afzonderlijke controle.

Oudere OpenClaw-versies konden een verouderd veld `token` achterlaten in `node.json`.
De huidige OpenClaw-versie gebruikt dat veld niet en verwijdert het wanneer de Node-host
het bestand de volgende keer opslaat. Houd beide bestanden onder `identity/` privé; ze bevatten het
apparaatsleutelpaar en de authenticatietokens.

## Uitvoeringsgoedkeuringen

`system.run` wordt beveiligd door lokale uitvoeringsgoedkeuringen:

- `$OPENCLAW_STATE_DIR/exec-approvals.json`, of
  `~/.openclaw/exec-approvals.json` wanneer de variabele niet is ingesteld
- [Uitvoeringsgoedkeuringen](/nl/tools/exec-approvals)
- `openclaw approvals --node <id|name|ip>` (bewerken vanaf de Gateway)

Voor goedgekeurde asynchrone Node-uitvoering bereidt OpenClaw vóór de bevestigingsvraag een canoniek `systemRunPlan`
voor. Het later goedgekeurde doorsturen van `system.run` hergebruikt dat opgeslagen
plan, zodat wijzigingen in de velden voor opdracht/werkmap/sessie nadat het goedkeuringsverzoek is
aangemaakt, worden geweigerd in plaats van te wijzigen wat de Node uitvoert.

## Gerelateerd

- [CLI-naslag](/nl/cli)
- [Nodes](/nl/nodes)
