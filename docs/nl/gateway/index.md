---
read_when:
    - Het Gateway-proces uitvoeren of debuggen
summary: Runbook voor de Gateway-service, levenscyclus en operationeel beheer
title: Gateway-draaiboek
x-i18n:
    generated_at: "2026-04-29T22:45:19Z"
    model: gpt-5.5
    provider: openai
    source_hash: 14f3d288c426848bc176291ff084a2b63b00e81739cd02f31fdf517d230d8111
    source_path: gateway/index.md
    workflow: 16
---

Gebruik deze pagina voor day-1-opstart en day-2-beheer van de Gateway-service.

<CardGroup cols={2}>
  <Card title="Grondige probleemoplossing" icon="siren" href="/nl/gateway/troubleshooting">
    Symptoomgerichte diagnostiek met exacte commandoladders en logsignaturen.
  </Card>
  <Card title="Configuratie" icon="sliders" href="/nl/gateway/configuration">
    Taakgerichte installatiegids + volledige configuratiereferentie.
  </Card>
  <Card title="Geheimenbeheer" icon="key-round" href="/nl/gateway/secrets">
    SecretRef-contract, gedrag van runtime-snapshots en migreer-/herlaadbewerkingen.
  </Card>
  <Card title="Contract voor geheimenplan" icon="shield-check" href="/nl/gateway/secrets-plan-contract">
    Exacte `secrets apply`-regels voor doel/pad en ref-only gedrag voor auth-profielen.
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

  <Step title="Controleer de servicegezondheid">

```bash
openclaw gateway status
openclaw status
openclaw logs --follow
```

Gezonde basislijn: `Runtime: running`, `Connectivity probe: ok` en `Capability: ...` die overeenkomt met wat je verwacht. Gebruik `openclaw gateway status --require-rpc` wanneer je RPC-bewijs met leesbereik nodig hebt, niet alleen bereikbaarheid.

  </Step>

  <Step title="Valideer kanaalgereedheid">

```bash
openclaw channels status --probe
```

Met een bereikbare gateway voert dit live kanaalprobes per account en optionele audits uit.
Als de gateway niet bereikbaar is, valt de CLI terug op configuratie-only kanaalsamenvattingen in plaats van live probe-uitvoer.

  </Step>
</Steps>

<Note>
Het herladen van Gateway-configuratie bewaakt het actieve configuratiebestandspad (opgelost vanuit profiel-/statusstandaarden, of `OPENCLAW_CONFIG_PATH` wanneer ingesteld).
De standaardmodus is `gateway.reload.mode="hybrid"`.
Na de eerste succesvolle laadactie bedient het actieve proces de actieve in-memory configuratiesnapshot; een succesvolle herlaadactie vervangt die snapshot atomair.
</Note>

## Runtimemodel

- Eén altijd actief proces voor routering, control plane en kanaalverbindingen.
- Eén gemultiplexte poort voor:
  - WebSocket-control/RPC
  - HTTP-API's, OpenAI-compatibel (`/v1/models`, `/v1/embeddings`, `/v1/chat/completions`, `/v1/responses`, `/tools/invoke`)
  - Control UI en hooks
- Standaard bindmodus: `loopback`.
- Auth is standaard vereist. Installaties met gedeeld geheim gebruiken
  `gateway.auth.token` / `gateway.auth.password` (of
  `OPENCLAW_GATEWAY_TOKEN` / `OPENCLAW_GATEWAY_PASSWORD`), en niet-loopback
  reverse-proxy-installaties kunnen `gateway.auth.mode: "trusted-proxy"` gebruiken.

## OpenAI-compatibele endpoints

OpenClaw’s compatibiliteitsoppervlak met de meeste hefboomwerking is nu:

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
- Gebruik `x-openclaw-model` wanneer je een override voor backendprovider/model wilt; anders blijven het normale model en de embeddinginstallatie van de geselecteerde agent leidend.

Al deze endpoints draaien op de hoofdpoort van de Gateway en gebruiken dezelfde auth-grens voor vertrouwde operators als de rest van de Gateway HTTP-API.

### Poort- en bindprioriteit

| Instelling    | Oplosvolgorde                                                |
| ------------- | ------------------------------------------------------------ |
| Gateway-poort | `--port` → `OPENCLAW_GATEWAY_PORT` → `gateway.port` → `18789` |
| Bindmodus     | CLI/override → `gateway.bind` → `loopback`                   |

Geïnstalleerde gateway-services slaan de opgeloste `--port` op in supervisormetadata. Voer na het wijzigen van `gateway.port` `openclaw doctor --fix` of `openclaw gateway install --force` uit zodat launchd/systemd/schtasks het proces op de nieuwe poort start.

Gateway-opstart gebruikt dezelfde effectieve poort en bind wanneer het lokale
Control UI-origins seedt voor niet-loopback binds. Bijvoorbeeld, `--bind lan --port 3000`
seedt `http://localhost:3000` en `http://127.0.0.1:3000` voordat runtimevalidatie
wordt uitgevoerd. Voeg externe browserorigins, zoals HTTPS-proxy-URL's, expliciet toe aan
`gateway.controlUi.allowedOrigins`.

### Hot reload-modi

| `gateway.reload.mode` | Gedrag                                      |
| --------------------- | ------------------------------------------- |
| `off`                 | Geen configuratieherlaadactie               |
| `hot`                 | Pas alleen hot-safe wijzigingen toe         |
| `restart`             | Herstart bij wijzigingen die herstart vereisen |
| `hybrid` (standaard)  | Hot-toepassen wanneer veilig, herstarten wanneer vereist |

## Operator-commandoset

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

`gateway status --deep` is bedoeld voor extra servicedetectie (LaunchDaemons/systemd-systeemunits/schtasks), niet voor een diepere RPC-gezondheidsprobe.

## Meerdere gateways (dezelfde host)

De meeste installaties moeten één gateway per machine uitvoeren. Eén gateway kan meerdere
agents en kanalen hosten.

Je hebt alleen meerdere gateways nodig wanneer je bewust isolatie of een reddingsbot wilt.

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
- Als dat opzettelijk is, isoleer dan poorten, configuratie/status en werkruimteroots per gateway.

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

Gedetailleerde installatie: [/gateway/multiple-gateways](/nl/gateway/multiple-gateways).

## VoiceClaw realtime brein-endpoint

OpenClaw biedt een VoiceClaw-compatibel realtime WebSocket-endpoint op
`/voiceclaw/realtime`. Gebruik dit wanneer een VoiceClaw-desktopclient direct
met een realtime OpenClaw-brein moet praten in plaats van via een afzonderlijk relayproces.

Het endpoint gebruikt Gemini Live voor realtime audio en roept OpenClaw aan als het
brein door OpenClaw-tools direct aan Gemini Live beschikbaar te stellen. Toolaanroepen retourneren een
direct `working`-resultaat om de spraakbeurt responsief te houden, waarna OpenClaw
de daadwerkelijke tool asynchroon uitvoert en het resultaat terug injecteert in de
live sessie. Stel `GEMINI_API_KEY` in de procesomgeving van de gateway in. Als
gateway-auth is ingeschakeld, verzendt de desktopclient het gateway-token of wachtwoord
in zijn eerste `session.config`-bericht.

Realtime breintoegang voert door de eigenaar geautoriseerde OpenClaw-agentcommando's uit. Beperk
`gateway.auth.mode: "none"` tot testinstanties met alleen loopback. Niet-lokale
realtime breinverbindingen vereisen gateway-auth.

Voer voor een geïsoleerde testgateway een afzonderlijke instantie uit met een eigen poort, configuratie
en status:

```bash
OPENCLAW_CONFIG_PATH=/path/to/openclaw-realtime/openclaw.json \
OPENCLAW_STATE_DIR=/path/to/openclaw-realtime/state \
OPENCLAW_SKIP_CHANNELS=1 \
GEMINI_API_KEY=... \
openclaw gateway --port 19789
```

Configureer VoiceClaw daarna om te gebruiken:

```text
ws://127.0.0.1:19789/voiceclaw/realtime
```

## Toegang op afstand

Aanbevolen: Tailscale/VPN.
Fallback: SSH-tunnel.

```bash
ssh -N -L 18789:127.0.0.1:18789 user@host
```

Verbind clients daarna lokaal met `ws://127.0.0.1:18789`.

<Warning>
SSH-tunnels omzeilen gateway-auth niet. Voor auth met gedeeld geheim moeten clients nog steeds
`token`/`password` verzenden, ook via de tunnel. Voor modi met identiteit
moet het verzoek nog steeds aan dat auth-pad voldoen.
</Warning>

Zie: [Remote Gateway](/nl/gateway/remote), [Authenticatie](/nl/gateway/authentication), [Tailscale](/nl/gateway/tailscale).

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

Gebruik `openclaw gateway restart` voor herstarts. Chain `openclaw gateway stop` en `openclaw gateway start` niet; op macOS schakelt `gateway stop` de LaunchAgent bewust uit voordat deze wordt gestopt.

LaunchAgent-labels zijn `ai.openclaw.gateway` (standaard) of `ai.openclaw.<profile>` (benoemd profiel). `openclaw doctor` auditt en repareert drift in serviceconfiguratie.

  </Tab>

  <Tab title="Linux (systemd-gebruiker)">

```bash
openclaw gateway install
systemctl --user enable --now openclaw-gateway[-<profile>].service
openclaw gateway status
```

Schakel lingering in voor persistentie na uitloggen:

```bash
sudo loginctl enable-linger <user>
```

Voorbeeld van een handmatige gebruikersunit wanneer je een aangepast installatiepad nodig hebt:

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

Native Windows beheerde opstart gebruikt een Scheduled Task met de naam `OpenClaw Gateway`
(of `OpenClaw Gateway (<profile>)` voor benoemde profielen). Als het maken van een Scheduled Task
wordt geweigerd, valt OpenClaw terug op een launcher in de Startup-map per gebruiker
die verwijst naar `gateway.cmd` in de statusmap.

  </Tab>

  <Tab title="Linux (systeemservice)">

Gebruik een systeemunit voor multi-user/altijd actieve hosts.

```bash
sudo systemctl daemon-reload
sudo systemctl enable --now openclaw-gateway[-<profile>].service
```

Gebruik dezelfde servicebody als de gebruikersunit, maar installeer deze onder
`/etc/systemd/system/openclaw-gateway[-<profile>].service` en pas
`ExecStart=` aan als je `openclaw`-binary ergens anders staat.

Laat `openclaw doctor --fix` niet ook een gateway-service op gebruikersniveau installeren voor hetzelfde profiel/dezelfde poort. Doctor weigert die automatische installatie wanneer het een OpenClaw-gateway-service op systeemniveau vindt; gebruik `OPENCLAW_SERVICE_REPAIR_POLICY=external` wanneer de systeemunit de levenscyclus beheert.

  </Tab>
</Tabs>

## Snelle route voor dev-profiel

```bash
openclaw --dev setup
openclaw --dev gateway --allow-unconfigured
openclaw --dev status
```

Standaarden bevatten geïsoleerde status/configuratie en basisgatewaypoort `19001`.

## Snelle protocolreferentie (operatorweergave)

- Het eerste clientframe moet `connect` zijn.
- Gateway retourneert `hello-ok`-snapshot (`presence`, `health`, `stateVersion`, `uptimeMs`, limieten/beleid).
- `hello-ok.features.methods` / `events` zijn een conservatieve ontdekkingslijst, geen
  gegenereerde dump van elke aanroepbare helperroute.
- Verzoeken: `req(method, params)` → `res(ok/payload|error)`.
- Veelvoorkomende gebeurtenissen zijn onder meer `connect.challenge`, `agent`, `chat`,
  `session.message`, `session.tool`, `sessions.changed`, `presence`, `tick`,
  `health`, `heartbeat`, pairing-/goedkeuringslevenscyclusgebeurtenissen en `shutdown`.

Agentruns verlopen in twee fasen:

1. Direct geaccepteerde ack (`status:"accepted"`)
2. Definitieve voltooiingsrespons (`status:"ok"|"error"`), met gestreamde `agent`-gebeurtenissen ertussen.

Zie de volledige protocoldocumentatie: [Gateway-protocol](/nl/gateway/protocol).

## Operationele controles

### Liveness

- Open WS en stuur `connect`.
- Verwacht een `hello-ok`-antwoord met momentopname.

### Gereedheid

```bash
openclaw gateway status
openclaw channels status --probe
openclaw health
```

### Herstel bij hiaten

Gebeurtenissen worden niet opnieuw afgespeeld. Vernieuw bij sequentiehiaten de toestand (`health`, `system-presence`) voordat je verdergaat.

## Veelvoorkomende foutsignaturen

| Signatuur                                                      | Waarschijnlijk probleem                                                                    |
| -------------------------------------------------------------- | ------------------------------------------------------------------------------------------ |
| `refusing to bind gateway ... without auth`                    | Niet-loopback-binding zonder geldig Gateway-authenticatiepad                                |
| `another gateway instance is already listening` / `EADDRINUSE` | Poortconflict                                                                              |
| `Gateway start blocked: set gateway.mode=local`                | Configuratie ingesteld op externe modus, of local-modus-stempel ontbreekt in een beschadigde configuratie |
| `unauthorized` tijdens verbinden                              | Authenticatie komt niet overeen tussen client en Gateway                                    |

Gebruik [Gateway-probleemoplossing](/nl/gateway/troubleshooting) voor volledige diagnoseladders.

## Veiligheidsgaranties

- Gateway-protocolclients falen snel wanneer Gateway niet beschikbaar is (geen impliciete fallback naar direct kanaal).
- Ongeldige/niet-`connect`-eerste frames worden geweigerd en gesloten.
- Gecontroleerd afsluiten verzendt een `shutdown`-gebeurtenis voordat de socket wordt gesloten.

---

Gerelateerd:

- [Probleemoplossing](/nl/gateway/troubleshooting)
- [Achtergrondproces](/nl/gateway/background-process)
- [Configuratie](/nl/gateway/configuration)
- [Health](/nl/gateway/health)
- [Doctor](/nl/gateway/doctor)
- [Authenticatie](/nl/gateway/authentication)

## Gerelateerd

- [Configuratie](/nl/gateway/configuration)
- [Gateway-probleemoplossing](/nl/gateway/troubleshooting)
- [Externe toegang](/nl/gateway/remote)
- [Geheimenbeheer](/nl/gateway/secrets)
