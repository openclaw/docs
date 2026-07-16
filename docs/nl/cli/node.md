---
read_when:
    - De headless Node-host uitvoeren
    - Een niet-macOS-Node koppelen voor system.run
summary: CLI-referentie voor `openclaw node` (headless Node-host)
title: Node
x-i18n:
    generated_at: "2026-07-16T15:35:59Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: d17b96b8829bef4202ff220d9b20e04c183702f997f669120cb16aa7191235b6
    source_path: cli/node.md
    workflow: 16
---

# `openclaw node`

Voer een **headless Node-host** uit die verbinding maakt met de Gateway-WebSocket en
`system.run` / `system.which` op deze machine beschikbaar stelt.

Op macOS bevat de menubalk-app deze Node-hostruntime al in zijn eigen
Node-verbinding en voegt deze systeemeigen Mac-mogelijkheden toe. Gebruik `openclaw node run` op een
Mac alleen wanneer je bewust een headless Node zonder de app wilt. Als je
beide uitvoert, ontstaan er twee Node-identiteiten voor dezelfde machine.

## Waarom een Node-host gebruiken?

Gebruik een Node-host wanneer je agents **opdrachten op andere machines** in je
netwerk wilt laten uitvoeren zonder daar een volledige bijbehorende macOS-app te installeren.

Veelvoorkomende toepassingen:

- Voer opdrachten uit op externe Linux-/Windows-machines (buildservers, labmachines, NAS).
- Houd exec **in een sandbox** op de Gateway, maar delegeer goedgekeurde uitvoeringen aan andere hosts.
- Bied een lichtgewicht, headless uitvoeringsdoel voor automatisering of CI-Nodes.

De uitvoering wordt nog steeds beveiligd door **exec-goedkeuringen** en allowlists per agent op de
Node-host, zodat je opdrachttoegang beperkt en expliciet kunt houden.

`openclaw node run` kan na het maken van de verbinding door een Plugin of MCP ondersteunde tools publiceren.
De Gateway vertrouwt standaard descriptors van de gekoppelde Node, maar vereist
dat de opdracht van elke descriptor binnen het goedgekeurde opdrachtenoppervlak van de Node blijft. De
agent ziet elke geaccepteerde descriptor als een normale Plugin-tool, maar de uitvoering verloopt nog steeds
via `node.invoke`, zodat de tool niet beschikbaar is voor nieuwe
agentuitvoeringen wanneer de verbinding met de Node wordt verbroken. Gateway-operators kunnen publicatie uitschakelen met
`gateway.nodes.pluginTools.enabled: false`.

Voeg voor declaratieve MCP-tools de normale MCP-serverstructuur toe onder
`nodeHost.mcp.servers` in `openclaw.json` op de Node-machine en start vervolgens de
Node-host opnieuw. De Node declareert de door goedkeuring beveiligde opdrachtfamilie
`mcp.tools.call.v1` en publiceert de vermelde tools na het maken van de verbinding; als je de serverlijst
later wijzigt, hoef je niet opnieuw te koppelen. Zie
[Door Nodes gehoste MCP-servers](/nl/nodes#node-hosted-mcp-servers).

## Browserproxy (zonder configuratie)

Node-hosts maken automatisch een browserproxy bekend als `browser.enabled` niet
is uitgeschakeld op de Node. Hierdoor kan de agent browserautomatisering op die Node gebruiken
zonder aanvullende configuratie.

Standaard stelt de proxy het normale browserprofieloppervlak van de Node beschikbaar. Als je
`nodeHost.browserProxy.allowProfiles` instelt, wordt de proxy restrictief:
het benaderen van profielen die niet op de allowlist staan, wordt geweigerd en routes voor het
maken/verwijderen van permanente profielen worden via de proxy geblokkeerd.

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

- `--host <host>`: Gateway-WebSockethost (standaard: `127.0.0.1`)
- `--port <port>`: Gateway-WebSocketpoort (standaard: `18789`)
- `--context-path <path>`: Contextpad van de Gateway-WebSocket (bijv. `/openclaw-gw`). Wordt aan de WebSocket-URL toegevoegd.
- `--tls`: Gebruik TLS voor de Gateway-verbinding
- `--no-tls`: Dwing een Gateway-verbinding met platte tekst af, zelfs wanneer TLS in de lokale Gateway-configuratie is ingeschakeld
- `--tls-fingerprint <sha256>`: Verwachte vingerafdruk van het TLS-certificaat (sha256)
- `--node-id <id>`: Overschrijf de clientinstantie-ID die in de gedeelde SQLite-status is opgeslagen (stelt de koppeling niet opnieuw in)
- `--display-name <name>`: Overschrijf de weergavenaam van de Node

## Gateway-authenticatie voor de Node-host

`openclaw node run` en `openclaw node install` bepalen Gateway-authenticatie via configuratie/omgevingsvariabelen (geen vlaggen `--token`/`--password` voor Node-opdrachten):

- `OPENCLAW_GATEWAY_TOKEN` / `OPENCLAW_GATEWAY_PASSWORD` worden eerst gecontroleerd.
- Daarna volgt de lokale configuratie als terugvaloptie: `gateway.auth.token` / `gateway.auth.password`.
- In lokale modus neemt de Node-host bewust `gateway.remote.token` / `gateway.remote.password` niet over.
- Als `gateway.auth.token` / `gateway.auth.password` expliciet via SecretRef is geconfigureerd en niet kan worden omgezet, wordt het bepalen van de Node-authenticatie afgesloten met een fout (zonder dat externe terugval dit maskeert).
- In `gateway.mode=remote` komen externe clientvelden (`gateway.remote.token` / `gateway.remote.password`) ook in aanmerking volgens de externe voorrangsregels.
- Bij het bepalen van de authenticatie houdt de Node-host alleen rekening met `OPENCLAW_GATEWAY_*`-omgevingsvariabelen.

Voor een Node die verbinding maakt met een Gateway met platte tekst via `ws://`, worden loopback, letterlijke privé-IP-adressen,
`.local` en Tailnet-hosts met `*.ts.net` geaccepteerd. Stel voor andere
vertrouwde privé-DNS-namen `OPENCLAW_ALLOW_INSECURE_PRIVATE_WS=1` in; zonder
deze instelling wordt het opstarten van de Node afgesloten met een fout en wordt je gevraagd `wss://`, een SSH-tunnel of
Tailscale te gebruiken. Dit is een opt-in via de procesomgeving, geen configuratiesleutel
`openclaw.json`.
`openclaw node install` slaat deze instelling op in de bewaakte Node-service wanneer deze
aanwezig is in de omgeving van de installatieopdracht.

## Service (achtergrond)

Installeer een headless Node-host als gebruikersservice (launchd op macOS, systemd op
Linux, Windows Taakplanner op Windows).

```bash
openclaw node install --host <gateway-host> --port 18789
```

Opties:

- `--host <host>`: Gateway-WebSockethost (standaard: `127.0.0.1`)
- `--port <port>`: Gateway-WebSocketpoort (standaard: `18789`)
- `--context-path <path>`: Contextpad van de Gateway-WebSocket (bijv. `/openclaw-gw`). Wordt aan de WebSocket-URL toegevoegd.
- `--tls`: Gebruik TLS voor de Gateway-verbinding
- `--tls-fingerprint <sha256>`: Verwachte vingerafdruk van het TLS-certificaat (sha256)
- `--node-id <id>`: Overschrijf de clientinstantie-ID die in de gedeelde SQLite-status is opgeslagen (stelt de koppeling niet opnieuw in)
- `--display-name <name>`: Overschrijf de weergavenaam van de Node
- `--runtime <runtime>`: Serviceruntime (`node`)
- `--force`: Installeer opnieuw/overschrijf indien al geïnstalleerd

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

De Node-host probeert Gateway-herstarts en netwerkverbrekingen opnieuw binnen hetzelfde proces. Als de
Gateway een definitieve authenticatiepauze voor token/wachtwoord/bootstrap meldt, registreert de Node-host
de details van het verbreken en sluit deze af met een niet-nulstatus, zodat launchd/systemd/Taakplanner
de host opnieuw kan starten met actuele configuratie en aanmeldgegevens. Pauzes waarvoor koppeling is vereist, blijven in
de voorgrondstroom, zodat het openstaande verzoek kan worden goedgekeurd.

## Koppelen

De eerste verbinding maakt een openstaand verzoek voor het koppelen van een apparaat (`role: node`) aan op de Gateway.

Wanneer de Gateway-host zonder interactie via SSH verbinding kan maken met de Node-host (dezelfde gebruiker,
vertrouwde hostsleutel), wordt het openstaande verzoek automatisch goedgekeurd: de Gateway
voert `openclaw node identity --json` via SSH uit op de Node-host en keurt het goed bij
een exacte overeenkomst van de apparaatsleutel. Dit is standaard ingeschakeld; zie
[Automatische goedkeuring van apparaten met SSH-verificatie](/nl/gateway/pairing#ssh-verified-device-auto-approval-default)
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

Hiermee worden de apparaat-ID en openbare sleutel uit `identity/device.json` weergegeven en worden
nooit identiteitsbestanden gemaakt of gewijzigd.

In streng gecontroleerde Node-netwerken kan de Gateway-operator expliciet instemmen
met het automatisch goedkeuren van de eerste Node-koppeling vanaf vertrouwde CIDR's:

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
nieuwe `role: node`-koppelingen zonder aangevraagde bereiken, vanaf een client-IP dat de
Gateway vertrouwt. Operator-/browserclients, Control UI, WebChat en upgrades van rol,
bereik, metadata of openbare sleutel vereisen nog steeds handmatige goedkeuring.

Als de Node opnieuw probeert te koppelen met gewijzigde authenticatiegegevens (rol/bereiken/openbare sleutel),
wordt het vorige openstaande verzoek vervangen en wordt een nieuwe `requestId` gemaakt.
Voer `openclaw devices list` opnieuw uit voordat je het verzoek goedkeurt.

### Identiteits- en koppelingsstatus

De headless Node houdt zijn clientinstantie-ID gescheiden van de ondertekende apparaatidentiteit
die de Gateway gebruikt voor koppeling en routering. Deze status bevindt zich in de
OpenClaw-statusmap (standaard `~/.openclaw`, of `$OPENCLAW_STATE_DIR`
wanneer ingesteld):

| Status                                       | Doel                                                                                                                             |
| -------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------- |
| `state/openclaw.sqlite` (`node_host_config`) | Clientinstantie-ID, weergavenaam en verbindingsmetadata van de Gateway. De client verzendt deze ID als `instanceId`.             |
| `identity/device.json`                       | Ondertekend Ed25519-sleutelpaar en afgeleide apparaat-ID. Voor ondertekende verbindingen is deze apparaat-ID de gerouteerde Node-ID en koppelingsidentiteit. |
| `identity/device-auth.json`                  | Tokens van gekoppelde apparaten, geïndexeerd op cryptografische apparaat-ID en rol.                                               |

`--node-id` wijzigt alleen de clientinstantie-ID in de gedeelde SQLite-status. Hiermee wordt
de cryptografische apparaat-ID niet gewijzigd en de koppelingsauthenticatie niet gewist. Het migreren van een verouderd
`node.json` met `openclaw doctor --fix` stelt de koppeling evenmin opnieuw in. Een
Node intrekken en opnieuw koppelen:

1. Voer op de Gateway `openclaw nodes remove --node <id|name|ip>` uit.
2. Start op de Node de geïnstalleerde service opnieuw met `openclaw node restart`, of
   stop de opdracht `openclaw node run` op de voorgrond en voer deze opnieuw uit. Hiermee wordt de
   stroom voor apparaatkoppeling gestart. Als `openclaw devices list` geen verzoek toont
   en de Node `AUTH_DEVICE_TOKEN_MISMATCH` meldt, start de Node dan nog
   eenmaal opnieuw of voer de opdracht nogmaals uit. De geweigerde poging wist het inmiddels ingetrokken lokale token; bij de volgende
   poging kan om koppeling worden gevraagd.
3. Voer op de Gateway `openclaw devices list` uit en vervolgens
   `openclaw devices approve <deviceRequestId>`.
4. Start de Node opnieuw of voer de opdracht opnieuw uit. Een client die voor koppeling is gepauzeerd, wordt na goedkeuring
   niet automatisch hervat; met deze nieuwe verbinding wordt het afzonderlijke
   verzoek voor het opdrachtenoppervlak gemaakt.
5. Voer op de Gateway `openclaw nodes pending` uit en vervolgens
   `openclaw nodes approve <nodeRequestId>`.

De twee verzoek-ID's zijn verschillend. Een toepasselijk beleid voor vertrouwde CIDR's kan
de eerste stap voor apparaatkoppeling automatisch goedkeuren; de goedkeuring van het opdrachtenoppervlak blijft
een afzonderlijke controle.

Oudere OpenClaw-versies sloegen de status van de Node-host op in `node.json` en konden daar een
verouderd veld `token` achterlaten. Stop de Node-host en voer `openclaw doctor --fix`
eenmaal uit; Doctor importeert de ondersteunde identiteits- en verbindingsvelden in SQLite,
verwijdert het ongebruikte tokenveld, verifieert de rij en verwijdert het verouderde bestand.
Normale Node-opdrachten worden afgesloten met deze reparatie-instructie zolang het bestand of
een onderbroken claim van Doctor blijft bestaan. Houd beide bestanden onder `identity/` privé;
ze bevatten het apparaatsleutelpaar en authenticatietokens.

## Exec-goedkeuringen

`system.run` wordt beveiligd door lokale exec-goedkeuringen:

- `$OPENCLAW_STATE_DIR/exec-approvals.json`, of
  `~/.openclaw/exec-approvals.json` wanneer de variabele niet is ingesteld
- [Exec-goedkeuringen](/nl/tools/exec-approvals)
- `openclaw approvals --node <id|name|ip>` (bewerken vanaf de Gateway)

Voor goedgekeurde asynchrone Node-exec bereidt OpenClaw vóór de prompt een canonieke
`systemRunPlan` voor. De later goedgekeurde doorgifte van `system.run` hergebruikt dat opgeslagen
plan, zodat wijzigingen in opdracht-/cwd-/sessievelden nadat het goedkeuringsverzoek is
gemaakt, worden geweigerd in plaats van te wijzigen wat de Node uitvoert.

## Gerelateerd

- [CLI-referentie](/nl/cli)
- [Nodes](/nl/nodes)
