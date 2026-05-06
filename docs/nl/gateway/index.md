---
read_when:
    - Het Gateway-proces uitvoeren of debuggen
summary: Draaiboek voor de Gateway-service, levenscyclus en beheer
title: Gateway-draaiboek
x-i18n:
    generated_at: "2026-05-06T09:13:19Z"
    model: gpt-5.5
    provider: openai
    source_hash: 592eb379cc75402246676cbb23b1dca39b98f559c214c92983b5a3685cff7ab7
    source_path: gateway/index.md
    workflow: 16
---

Gebruik deze pagina voor dag-1-opstart en dag-2-beheer van de Gateway-service.

<CardGroup cols={2}>
  <Card title="Diepgaande probleemoplossing" icon="siren" href="/nl/gateway/troubleshooting">
    Symptoomgerichte diagnostiek met exacte commandoreeksen en logsignaturen.
  </Card>
  <Card title="Configuratie" icon="sliders" href="/nl/gateway/configuration">
    Taakgerichte installatiegids + volledige configuratiereferentie.
  </Card>
  <Card title="Geheimenbeheer" icon="key-round" href="/nl/gateway/secrets">
    SecretRef-contract, gedrag van runtimesnapshots en migreer-/herlaadbewerkingen.
  </Card>
  <Card title="Contract voor geheimenplan" icon="shield-check" href="/nl/gateway/secrets-plan-contract">
    Exacte doel-/padregels voor `secrets apply` en ref-only gedrag voor auth-profielen.
  </Card>
</CardGroup>

## Lokale opstart in 5 minuten

<Steps>
  <Step title="Start de Gateway">

```bash
openclaw gateway --port 18789
# debug/trace mirrored to stdio
openclaw gateway --port 18789 --verbose
# force-kill listener on selected port, then start
openclaw gateway --force
```

  </Step>

  <Step title="Controleer de servicestatus">

```bash
openclaw gateway status
openclaw status
openclaw logs --follow
```

Gezonde basislijn: `Runtime: running`, `Connectivity probe: ok` en `Capability: ...` die overeenkomt met wat je verwacht. Gebruik `openclaw gateway status --require-rpc` wanneer je bewijs van RPC met leesscope nodig hebt, niet alleen bereikbaarheid.

  </Step>

  <Step title="Valideer kanaalgereedheid">

```bash
openclaw channels status --probe
```

Met een bereikbare gateway voert dit live kanaalprobes per account en optionele audits uit.
Als de gateway onbereikbaar is, valt de CLI terug op configuratie-only kanaalsamenvattingen in plaats
van live probe-uitvoer.

  </Step>
</Steps>

<Note>
Het herladen van Gateway-configuratie bewaakt het actieve configuratiebestandspad (opgelost vanuit profiel-/statusstandaarden, of `OPENCLAW_CONFIG_PATH` wanneer ingesteld).
De standaardmodus is `gateway.reload.mode="hybrid"`.
Na de eerste geslaagde laadactie bedient het draaiende proces de actieve configuratiesnapshot in het geheugen; een geslaagde herlaadactie wisselt die snapshot atomisch om.
</Note>

## Runtimemodel

- Eén altijd actief proces voor routering, control plane en kanaalverbindingen.
- Eén gemultiplexte poort voor:
  - WebSocket-besturing/RPC
  - HTTP-API's, OpenAI-compatibel (`/v1/models`, `/v1/embeddings`, `/v1/chat/completions`, `/v1/responses`, `/tools/invoke`)
  - Besturings-UI en hooks
- Standaard bindmodus: `loopback`.
- Auth is standaard vereist. Setups met gedeeld geheim gebruiken
  `gateway.auth.token` / `gateway.auth.password` (of
  `OPENCLAW_GATEWAY_TOKEN` / `OPENCLAW_GATEWAY_PASSWORD`), en niet-loopback
  reverse-proxy-setups kunnen `gateway.auth.mode: "trusted-proxy"` gebruiken.

## OpenAI-compatibele eindpunten

OpenClaw's compatibiliteitsoppervlak met de hoogste impact is nu:

- `GET /v1/models`
- `GET /v1/models/{id}`
- `POST /v1/embeddings`
- `POST /v1/chat/completions`
- `POST /v1/responses`

Waarom deze set belangrijk is:

- De meeste Open WebUI-, LobeChat- en LibreChat-integraties proben eerst `/v1/models`.
- Veel RAG- en geheugenpijplijnen verwachten `/v1/embeddings`.
- Agent-native clients geven steeds vaker de voorkeur aan `/v1/responses`.

Planningsopmerking:

- `/v1/models` is agent-first: het retourneert `openclaw`, `openclaw/default` en `openclaw/<agentId>`.
- `openclaw/default` is de stabiele alias die altijd verwijst naar de geconfigureerde standaardagent.
- Gebruik `x-openclaw-model` wanneer je een override voor backendprovider/model wilt; anders blijft de normale model- en embeddingsetup van de geselecteerde agent leidend.

Al deze eindpunten draaien op de hoofdpoort van de Gateway en gebruiken dezelfde vertrouwde operator-authgrens als de rest van de Gateway HTTP-API.

### Poort- en bindvolgorde

| Instelling    | Oplossingsvolgorde                                           |
| ------------- | ------------------------------------------------------------ |
| Gateway-poort | `--port` → `OPENCLAW_GATEWAY_PORT` → `gateway.port` → `18789` |
| Bindmodus     | CLI/override → `gateway.bind` → `loopback`                   |

Geïnstalleerde gatewayservices registreren de opgeloste `--port` in supervisormetadata. Voer na het wijzigen van `gateway.port` `openclaw doctor --fix` of `openclaw gateway install --force` uit, zodat launchd/systemd/schtasks het proces op de nieuwe poort start.

Gateway-opstart gebruikt dezelfde effectieve poort en bind wanneer het lokale
oorsprongen voor de besturings-UI seedt voor niet-loopback binds. Bijvoorbeeld: `--bind lan --port 3000`
seedt `http://localhost:3000` en `http://127.0.0.1:3000` voordat runtime-
validatie wordt uitgevoerd. Voeg externe browseroorsprongen, zoals HTTPS-proxy-URL's, expliciet toe aan
`gateway.controlUi.allowedOrigins`.

### Hot-reloadmodi

| `gateway.reload.mode` | Gedrag                                      |
| --------------------- | ------------------------------------------- |
| `off`                 | Geen configuratieherlaadactie               |
| `hot`                 | Alleen hot-safe wijzigingen toepassen       |
| `restart`             | Herstarten bij wijzigingen die herstart vereisen |
| `hybrid` (standaard)  | Hot toepassen wanneer veilig, herstarten wanneer vereist |

## Operatorset met commando's

```bash
openclaw gateway status
openclaw gateway status --deep   # adds a system-level service scan
openclaw gateway status --json
openclaw gateway install
openclaw gateway restart
openclaw gateway stop
openclaw secrets reload
openclaw logs --follow
openclaw doctor
```

`gateway status --deep` is bedoeld voor extra servicedetectie (LaunchDaemons/systemd system
units/schtasks), niet voor een diepere RPC-gezondheidsprobe.

## Meerdere gateways (zelfde host)

De meeste installaties zouden één gateway per machine moeten draaien. Eén gateway kan meerdere
agents en kanalen hosten.

Je hebt alleen meerdere gateways nodig wanneer je bewust isolatie of een rescue-bot wilt.

Nuttige controles:

```bash
openclaw gateway status --deep
openclaw gateway probe
```

Wat je kunt verwachten:

- `gateway status --deep` kan `Other gateway-like services detected (best effort)` rapporteren
  en opruimhints afdrukken wanneer verouderde launchd/systemd/schtasks-installaties nog aanwezig zijn.
- `gateway probe` kan waarschuwen voor `multiple reachable gateways` wanneer meer dan één doel
  antwoordt.
- Als dat de bedoeling is, isoleer dan poorten, configuratie/status en workspace-roots per gateway.

Checklist per instantie:

- Unieke `gateway.port`
- Unieke `OPENCLAW_CONFIG_PATH`
- Unieke `OPENCLAW_STATE_DIR`
- Unieke `agents.defaults.workspace`

Voorbeeld:

```bash
OPENCLAW_CONFIG_PATH=~/.openclaw/a.json OPENCLAW_STATE_DIR=~/.openclaw-a openclaw gateway --port 19001
OPENCLAW_CONFIG_PATH=~/.openclaw/b.json OPENCLAW_STATE_DIR=~/.openclaw-b openclaw gateway --port 19002
```

Gedetailleerde setup: [/gateway/multiple-gateways](/nl/gateway/multiple-gateways).

## Externe toegang

Voorkeur: Tailscale/VPN.
Fallback: SSH-tunnel.

```bash
ssh -N -L 18789:127.0.0.1:18789 user@host
```

Verbind clients daarna lokaal met `ws://127.0.0.1:18789`.

<Warning>
SSH-tunnels omzeilen gateway-auth niet. Voor auth met gedeeld geheim moeten clients nog steeds
`token`/`password` sturen, ook via de tunnel. Voor modi met identiteit
moet het verzoek nog steeds aan dat auth-pad voldoen.
</Warning>

Zie: [Externe Gateway](/nl/gateway/remote), [Authenticatie](/nl/gateway/authentication), [Tailscale](/nl/gateway/tailscale).

## Supervisie en servicelevenscyclus

Gebruik gesuperviseerde runs voor productieachtige betrouwbaarheid.

<Tabs>
  <Tab title="macOS (launchd)">

```bash
openclaw gateway install
openclaw gateway status
openclaw gateway restart
openclaw gateway stop
```

Gebruik `openclaw gateway restart` voor herstarts. Keten `openclaw gateway stop` en `openclaw gateway start` niet; op macOS schakelt `gateway stop` de LaunchAgent bewust uit voordat deze wordt gestopt.

LaunchAgent-labels zijn `ai.openclaw.gateway` (standaard) of `ai.openclaw.<profile>` (benoemd profiel). `openclaw doctor` audit en herstelt afwijkingen in serviceconfiguratie.

  </Tab>

  <Tab title="Linux (systemd user)">

```bash
openclaw gateway install
systemctl --user enable --now openclaw-gateway[-<profile>].service
openclaw gateway status
```

Schakel lingering in voor persistentie na uitloggen:

```bash
sudo loginctl enable-linger <user>
```

Voorbeeld van een handmatige user-unit wanneer je een aangepast installatiepad nodig hebt:

```ini
[Unit]
Description=OpenClaw Gateway
After=network-online.target
Wants=network-online.target

[Service]
ExecStart=/usr/local/bin/openclaw gateway --port 18789
Restart=always
RestartSec=5
TimeoutStopSec=30
TimeoutStartSec=30
SuccessExitStatus=0 143
KillMode=control-group

[Install]
WantedBy=default.target
```

  </Tab>

  <Tab title="Windows (native)">

```powershell
openclaw gateway install
openclaw gateway status --json
openclaw gateway restart
openclaw gateway stop
```

Native door Windows beheerde opstart gebruikt een Scheduled Task met de naam `OpenClaw Gateway`
(of `OpenClaw Gateway (<profile>)` voor benoemde profielen). Als het aanmaken van de Scheduled Task
wordt geweigerd, valt OpenClaw terug op een launcher in de Startup-map per gebruiker
die wijst naar `gateway.cmd` binnen de statusdirectory.

  </Tab>

  <Tab title="Linux (system service)">

Gebruik een system-unit voor multi-user/altijd actieve hosts.

```bash
sudo systemctl daemon-reload
sudo systemctl enable --now openclaw-gateway[-<profile>].service
```

Gebruik dezelfde servicebody als de user-unit, maar installeer deze onder
`/etc/systemd/system/openclaw-gateway[-<profile>].service` en pas
`ExecStart=` aan als je `openclaw`-binary ergens anders staat.

Laat `openclaw doctor --fix` niet ook een gatewayservice op gebruikersniveau installeren voor hetzelfde profiel/dezelfde poort. Doctor weigert die automatische installatie wanneer het een OpenClaw-gatewayservice op systeemniveau vindt; gebruik `OPENCLAW_SERVICE_REPAIR_POLICY=external` wanneer de system-unit eigenaar is van de levenscyclus.

  </Tab>
</Tabs>

## Snel pad voor dev-profiel

```bash
openclaw --dev setup
openclaw --dev gateway --allow-unconfigured
openclaw --dev status
```

Standaarden omvatten geïsoleerde status/configuratie en basisgatewaypoort `19001`.

## Snelle protocolreferentie (operatorweergave)

- Het eerste clientframe moet `connect` zijn.
- Gateway retourneert `hello-ok`-snapshot (`presence`, `health`, `stateVersion`, `uptimeMs`, limieten/beleid).
- `hello-ok.features.methods` / `events` zijn een conservatieve detectielijst, niet
  een gegenereerde dump van elke aanroepbare helperroute.
- Verzoeken: `req(method, params)` → `res(ok/payload|error)`.
- Veelvoorkomende events omvatten `connect.challenge`, `agent`, `chat`,
  `session.message`, `session.tool`, `sessions.changed`, `presence`, `tick`,
  `health`, `heartbeat`, lifecycle-events voor pairing/approval en `shutdown`.

Agentruns verlopen in twee fasen:

1. Direct geaccepteerde ack (`status:"accepted"`)
2. Eindrespons bij voltooiing (`status:"ok"|"error"`), met gestreamde `agent`-events ertussen.

Zie volledige protocoldocumentatie: [Gateway-protocol](/nl/gateway/protocol).

## Operationele controles

### Liveness

- Open WS en stuur `connect`.
- Verwacht een `hello-ok`-respons met snapshot.

### Readiness

```bash
openclaw gateway status
openclaw channels status --probe
openclaw health
```

### Gap-herstel

Events worden niet opnieuw afgespeeld. Vernieuw bij sequence gaps de status (`health`, `system-presence`) voordat je doorgaat.

## Veelvoorkomende foutsignaturen

| Signatuur                                                      | Waarschijnlijk probleem                                                        |
| -------------------------------------------------------------- | ------------------------------------------------------------------------------ |
| `refusing to bind gateway ... without auth`                    | Niet-loopback bind zonder geldig gateway-authpad                               |
| `another gateway instance is already listening` / `EADDRINUSE` | Poortconflict                                                                 |
| `Gateway start blocked: set gateway.mode=local`                | Configuratie ingesteld op externe modus, of local-mode stamp ontbreekt in een beschadigde configuratie |
| `unauthorized` tijdens connect                                  | Auth-mismatch tussen client en gateway                                         |

Gebruik [Gateway-probleemoplossing](/nl/gateway/troubleshooting) voor volledige diagnosereeksen.

## Veiligheidsgaranties

- Gateway-protocolclients falen snel wanneer Gateway niet beschikbaar is (geen impliciete fallback naar een direct kanaal).
- Ongeldige eerste frames of eerste frames zonder connect worden geweigerd en gesloten.
- Gecontroleerd afsluiten zendt de `shutdown`-gebeurtenis uit voordat de socket wordt gesloten.

---

Gerelateerd:

- [Probleemoplossing](/nl/gateway/troubleshooting)
- [Achtergrondproces](/nl/gateway/background-process)
- [Configuratie](/nl/gateway/configuration)
- [Gezondheid](/nl/gateway/health)
- [Doctor](/nl/gateway/doctor)
- [Authenticatie](/nl/gateway/authentication)

## Gerelateerd

- [Configuratie](/nl/gateway/configuration)
- [Gateway-probleemoplossing](/nl/gateway/troubleshooting)
- [Externe toegang](/nl/gateway/remote)
- [Geheimenbeheer](/nl/gateway/secrets)
