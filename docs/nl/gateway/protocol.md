---
read_when:
    - Gateway-WS-clients implementeren of bijwerken
    - Protocolverschillen of verbindingsfouten opsporen
    - Protocolschema/-modellen opnieuw genereren
summary: 'Gateway-WebSocket-protocol: handshake, frames, versiebeheer'
title: Gateway-protocol
x-i18n:
    generated_at: "2026-07-16T15:39:31Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 4cc92cfed4cf1bcc7b9499d90eef9f9225a89c0e6a71bb6230bb416f8f6884b5
    source_path: gateway/protocol.md
    workflow: 16
---

Het Gateway WS-protocol is het centrale besturingsvlak en het nodetransport voor
OpenClaw. Operator- en nodeclients (CLI, web-UI, macOS-app, iOS/Android-nodes,
headless nodes) maken verbinding via WebSocket en declareren tijdens de
handshake een **rol** en **scope**.

## Transport en framing

- WebSocket, tekstframes, JSON-payloads.
- Het eerste frame **moet** een `connect`-verzoek zijn.
- Frames vóór de verbinding zijn beperkt tot 64 KiB (`MAX_PREAUTH_PAYLOAD_BYTES`). Volg na
  de handshake `hello-ok.policy.maxPayload` en
  `hello-ok.policy.maxBufferedBytes`. Als diagnostiek is ingeschakeld, genereren te grote
  inkomende frames en trage uitgaande buffers `payload.large`-gebeurtenissen voordat
  de Gateway het frame sluit of verwijdert. Deze gebeurtenissen bevatten `surface`, bytegroottes,
  limieten en een veilige redencode, maar nooit berichtinhoud, inhoud van
  bijlagen, onbewerkte framebytes, tokens, cookies of geheimen.

Framevormen:

- Verzoek: `{type:"req", id, method, params}`
- Antwoord: `{type:"res", id, ok, payload|error}`
- Gebeurtenis: `{type:"event", event, payload, seq?, stateVersion?}`

Methoden met bijwerkingen vereisen idempotentiesleutels (zie schema).

## Handshake

De Gateway verzendt vóór de verbinding een challenge:

```json
{
  "type": "event",
  "event": "connect.challenge",
  "payload": { "nonce": "…", "ts": 1737264000000 }
}
```

De client antwoordt met `connect`:

```json
{
  "type": "req",
  "id": "…",
  "method": "connect",
  "params": {
    "minProtocol": 4,
    "maxProtocol": 4,
    "client": {
      "id": "cli",
      "version": "1.2.3",
      "platform": "macos",
      "mode": "operator"
    },
    "role": "operator",
    "scopes": ["operator.read", "operator.write"],
    "caps": [],
    "commands": [],
    "permissions": {},
    "auth": { "token": "…" },
    "locale": "en-US",
    "userAgent": "openclaw-cli/1.2.3",
    "device": {
      "id": "device_fingerprint",
      "publicKey": "…",
      "signature": "…",
      "signedAt": 1737264000000,
      "nonce": "…"
    }
  }
}
```

De Gateway antwoordt met `hello-ok`:

```json
{
  "type": "res",
  "id": "…",
  "ok": true,
  "payload": {
    "type": "hello-ok",
    "protocol": 4,
    "server": { "version": "…", "connId": "…" },
    "features": { "methods": ["…"], "events": ["…"] },
    "snapshot": { "…": "…" },
    "auth": {
      "role": "operator",
      "scopes": ["operator.read", "operator.write"]
    },
    "policy": {
      "maxPayload": 26214400,
      "maxBufferedBytes": 52428800,
      "tickIntervalMs": 15000
    }
  }
}
```

`server`, `features`, `snapshot`, `policy` en `auth` zijn allemaal vereist door
`HelloOkSchema` (`packages/gateway-protocol/src/schema/frames.ts`). `auth`
rapporteert de overeengekomen rol/scopes, zelfs wanneer geen apparaattoken wordt uitgegeven (vorm
hierboven). `pluginSurfaceUrls` is optioneel en koppelt namen van Plugin-oppervlakken (bijv.
`canvas`) aan gehoste URL's met een scope; deze kunnen verlopen, dus nodes roepen
`node.pluginSurface.refresh` aan met `{ "surface": "canvas" }` voor een nieuwe vermelding.
Het verouderde pad `canvasHostUrl` / `canvasCapability` / `node.canvas.capability.refresh`
wordt niet ondersteund; gebruik Plugin-oppervlakken.
De optionele `appliedConfigHash` van de snapshot is de opgeloste bronconfiguratierevisie
die door de actieve Gateway-runtime is geaccepteerd. Clients kunnen deze vergelijken met
`config.get.configRevisionHash` om te bepalen of voor een nieuwere opgeslagen configuratie nog steeds
een herstart nodig is. `config.get.hash` blijft de onbewerkte revisie van het hoofdbestand die wordt gebruikt door
conflictcontroles bij het schrijven van configuraties.

Terwijl de Gateway het opstarten van sidecars nog voltooit, kan `connect` een
opnieuw te proberen `UNAVAILABLE`-fout retourneren met `details.reason: "startup-sidecars"` en
`retryAfterMs`. Probeer het opnieuw binnen je verbindingsbudget in plaats van dit als
een definitieve handshakefout te behandelen.

Wanneer een apparaattoken wordt uitgegeven, voegt `hello-ok.auth` dit toe:

```json
{
  "auth": {
    "deviceToken": "…",
    "role": "operator",
    "scopes": ["operator.read", "operator.write"]
  }
}
```

De ingebouwde bootstrap via QR-/installatiecode is een overdrachtspad voor mobiele apparaten. Een geslaagde
basisverbinding met een installatiecode retourneert een primair nodetoken plus één begrensd
operatortoken:

```json
{
  "auth": {
    "deviceToken": "…",
    "role": "node",
    "scopes": [],
    "deviceTokens": [
      {
        "deviceToken": "…",
        "role": "operator",
        "scopes": ["operator.approvals", "operator.read", "operator.talk.secrets", "operator.write"]
      }
    ]
  }
}
```

Deze operatoroverdracht is bewust begrensd: voldoende om de mobiele
operatorlus en systeemeigen installatie te starten, inclusief `operator.talk.secrets` voor het lezen van
Talk-configuraties, maar zonder scopes voor koppelingswijzigingen en zonder `operator.admin`. Ruimere
koppelings-/beheerderstoegang vereist een afzonderlijke goedgekeurde koppeling of tokenstroom. Sla
`hello-ok.auth.deviceTokens` alleen permanent op wanneer de bootstrapauthenticatie via een vertrouwd
transport is uitgevoerd (`wss://` of loopback/lokale koppeling).

Vertrouwde backendclients binnen hetzelfde proces (`client.id: "gateway-client"`,
`client.mode: "backend"`) mogen `device` weglaten bij directe loopbackverbindingen wanneer
ze zich authenticeren met het gedeelde Gateway-token/-wachtwoord. Dit pad is gereserveerd
voor interne RPC's van het besturingsvlak (bijv. updates van subagentsessies) en voorkomt
dat verouderde CLI-/apparaatkoppelingsbaselines lokaal backendwerk blokkeren. Externe
clients, clients met een browseroorsprong, nodes en expliciete clients met apparaattokens/apparaatidentiteiten
doorlopen nog steeds de normale controles voor koppeling en scope-upgrades.

### Workerrol en gesloten protocol

Cloudworkers gebruiken een speciale loopback-ingang via de door de Gateway beheerde,
aan hostsleutels gekoppelde SSH-tunnel. Deze accepteert alleen workeridentiteiten en routeert nooit
algemene authenticatie, nodegebeurtenissen, operator-RPC's of Plugin-methoden. Een strikte `connect`
verifieert een gehashte opgeslagen, kortlevende credential die is gekoppeld aan de omgeving, de bundle-
hash, de ownerepoch, de RPC-setversie, de vervaldatum en één optionele sessie; daarnaast
controleert deze afzonderlijk de huidige versie en functieset. Bij succes wordt een minimale
`worker-hello-ok` geretourneerd; functieonderhandeling staat los van de algemene protocolversie.
Frames blijven kleiner dan 64 KiB, behalve dat een overeengekomen `worker.inference.start`-
frame maximaal 25 MiB groot mag zijn. De gesloten allowlist bevat `worker.heartbeat`,
`worker.transcript.commit`, `worker.live-event`, `worker.inference.start` en
`worker.inference.cancel`.

Transcriptcommits gebruiken afscherming via de ownerepoch, een door de Gateway beheerde sessiekoppeling,
compare-and-swap voor het basisblad en duurzame sequentieherhaling; de Gateway genereert
transcriptvermeldings- en bovenliggende ID's via de normale sessieschrijver. Eigendom en
vervaldatum worden bij elke RPC opnieuw gecontroleerd.

### Clientmogelijkheden

Operatorclients kunnen optionele mogelijkheden bekendmaken in `connect.params.caps`:

- `tool-events`: accepteert gestructureerde gebeurtenissen voor de levenscyclus van tools.
- `inline-widgets`: kan gehoste inline widgetresultaten van tools weergeven.

Clientmogelijkheden beschrijven de verbonden client, niet de autorisatie. Agenttools kunnen vereiste mogelijkheden declareren; de Gateway laat die tools weg tenzij elke vereiste voorkomt in `caps` van de oorspronkelijke client. Runs die vanuit kanalen zijn gestart, hebben geen Gateway-clientmogelijkheden, dus tools waarvoor mogelijkheden vereist zijn, zijn niet beschikbaar, zelfs wanneer het toolbeleid ze expliciet toestaat.

### Voorbeeld van nodeverbinding

```json
{
  "type": "req",
  "id": "…",
  "method": "connect",
  "params": {
    "minProtocol": 4,
    "maxProtocol": 4,
    "client": {
      "id": "ios-node",
      "version": "1.2.3",
      "platform": "ios",
      "mode": "node"
    },
    "role": "node",
    "scopes": [],
    "caps": ["camera", "canvas", "screen", "location", "voice"],
    "commands": ["camera.snap", "canvas.navigate", "screen.record", "location.get"],
    "permissions": { "camera.capture": true, "screen.record": false },
    "auth": { "token": "…" },
    "locale": "en-US",
    "userAgent": "openclaw-ios/1.2.3",
    "device": {
      "id": "device_fingerprint",
      "publicKey": "…",
      "signature": "…",
      "signedAt": 1737264000000,
      "nonce": "…"
    }
  }
}
```

Nodes declareren bij het verbinden aanspraken op mogelijkheden:

- `caps`: categorieën op hoog niveau, zoals `camera`, `canvas`, `screen`,
  `location`, `voice`, `talk`.
- `commands`: allowlist met opdrachten voor aanroepen.
- `permissions`: gedetailleerde schakelaars (bijv. `screen.record`, `camera.capture`).

De Gateway behandelt deze als aanspraken en handhaaft allowlists aan de serverzijde.

## Rollen en scopes

Zie [Operatorscopes](/nl/gateway/operator-scopes) voor het volledige model voor operatorscopes, controles tijdens goedkeuring en
semantiek van gedeelde geheimen.

Rollen:

- `operator`: client van het besturingsvlak (CLI/UI/automatisering).
- `node`: host voor mogelijkheden (camera/scherm/canvas/system.run).
- `worker`: clouduitvoeringshost op het speciale, gesloten workerprotocol.

Operatorscopes (`src/gateway/operator-scopes.ts`), de volledige gesloten set:

- `operator.read`
- `operator.write`
- `operator.admin`
- `operator.approvals`
- `operator.pairing`
- `operator.talk.secrets`

`talk.config` met `includeSecrets: true` vereist `operator.talk.secrets` (of
`operator.admin`). Wanneer geheimen zijn opgenomen, lees je de credential van de actieve Talk-provider
uit `talk.resolved.config.apiKey`; `talk.providers.<id>.apiKey`
behoudt de vorm van de bron en kan een SecretRef-object of een geredigeerde tekenreeks zijn.

Door Plugins geregistreerde Gateway-RPC-methoden kunnen hun eigen operatorscope vereisen,
maar deze gereserveerde kernprefixen worden altijd omgezet in `operator.admin`
(`src/shared/gateway-method-policy.ts`): `config.*`, `exec.approvals.*`,
`wizard.*`, `update.*`.

De methodescope is slechts de eerste controle. Sommige slashopdrachten die via
`chat.send` worden bereikt, passen strengere controles op opdrachtniveau toe: permanente schrijfbewerkingen voor `/config set` en
`/config unset` vereisen `operator.admin`, zelfs voor Gateway-clients die
al een lagere operatorscope hebben.

`node.pair.approve` heeft boven op de basismethodescope
(`operator.pairing`) een extra scopecontrole tijdens de goedkeuring, gebaseerd op de gedeclareerde
`commands` (`src/infra/node-pairing-authz.ts`) van het openstaande verzoek:

| Gedeclareerde opdrachten                                                                                                      | Vereiste scopes                        |
| ----------------------------------------------------------------------------------------------------------------------------- | ------------------------------------- |
| geen                                                                                                                          | `operator.pairing`                    |
| gewone opdrachten                                                                                                             | `operator.pairing` + `operator.write` |
| bevat `system.run`, `system.run.prepare`, `system.which`, `browser.proxy`, `fs.listDir` of `system.execApprovals.get/set` | `operator.pairing` + `operator.admin` |

### Caps/opdrachten/machtigingen (node)

Nodes declareren bij het verbinden aanspraken op mogelijkheden:

- `caps`: categorieën van mogelijkheden op hoog niveau, zoals `camera`, `canvas`, `screen`,
  `location`, `voice` en `talk`.
- `commands`: allowlist met opdrachten voor aanroepen.
- `permissions`: gedetailleerde schakelaars (bijv. `screen.record`, `camera.capture`).

De Gateway behandelt deze als **claims** en dwingt allowlists aan de serverzijde af.
Verbonden nodes kunnen optionele, voor agents zichtbare Plugin- of MCP-tooldescriptors
publiceren met `node.pluginTools.update` na een geslaagde verbinding of
herverbinding. Headless nodehosts starten opnieuw op om declaratieve wijzigingen
in de MCP-inventaris toe te passen. Deze updatemethode is het enige publicatiepad; descriptors van Plugin-tools worden niet geaccepteerd in
de parameters van `connect`. Elke descriptor moet een providerveilige tool-`name` gebruiken en
een `command` benoemen in de huidige command-allowlist van de node. De Gateway vertrouwt descriptor-
metadata van de gekoppelde node, filtert descriptors buiten het goedgekeurde command-
oppervlak, verwijdert ze wanneer de verbinding met de node wordt verbroken en weigert pogingen van operators
om de catalogus van een andere node te wijzigen. Stel `gateway.nodes.pluginTools.enabled: false`
in om door nodes gepubliceerde descriptors te negeren.

Verbonden nodehosts publiceren hun volledige vervangende skillcatalogus met
`node.skills.update`. Deze node-rolmethode is het enige publicatiepad voor nodeskills;
skills worden niet geaccepteerd in de parameters van `connect`. Elke descriptor bevat een
veilige naam, beschrijving en begrensde `SKILL.md`-inhoud. De Gateway parseert die
inhoud met de normale skillsloader, neemt deze op in snapshots van agentskills
zolang de node verbonden is en verwijdert deze wanneer de verbinding wordt verbroken. Stel
`gateway.nodes.skills.enabled: false` in om door nodes gepubliceerde skills te negeren.

## Aanwezigheid

- `system-presence` retourneert vermeldingen die op apparaatidentiteit zijn geïndexeerd, waaronder
  `deviceId`, `roles` en `scopes`, zodat UI's één rij per apparaat kunnen tonen, zelfs
  wanneer het zowel als operator als node verbinding maakt.
- `node.list` bevat optionele `lastSeenAtMs` en `lastSeenReason`. Verbonden
  nodes rapporteren de huidige verbindingstijd met reden `connect`; gekoppelde nodes kunnen
  ook duurzame achtergrondaanwezigheid rapporteren via een vertrouwde nodegebeurtenis.

Native macOS-nodes kunnen ook geauthenticeerde `node.presence.activity`-gebeurtenissen
verzenden met een begrensde inactieve invoertijd. De Gateway leidt activiteitstijdstempels af met
zijn eigen klok, stelt de meest recent actieve verbonden Mac beschikbaar via `node.list` en
`node.describe`, en zendt `node.presence`-updates uit naar clients met leesbereik.
Zie [Aanwezigheid van actieve computer](/nodes/presence) voor selectie, privacy, model-
context en routeringsgedrag voor meldingen.

### Achtergrondgebeurtenis voor actieve node

Nodes roepen `node.event` aan met `event: "node.presence.alive"` om vast te leggen dat een
gekoppelde node actief was tijdens ontwaken op de achtergrond, zonder deze als verbonden te markeren:

```json
{
  "event": "node.presence.alive",
  "payloadJSON": "{\"trigger\":\"silent_push\",\"sentAtMs\":1737264000000,\"displayName\":\"Peter's iPhone\",\"version\":\"2026.4.28\",\"platform\":\"iOS 18.4.0\",\"deviceFamily\":\"iPhone\",\"modelIdentifier\":\"iPhone17,1\",\"pushTransport\":\"relay\"}"
}
```

`trigger` is een gesloten enum: `background`, `silent_push`, `bg_app_refresh`,
`significant_location`, `manual`, `connect`. Onbekende waarden worden genormaliseerd naar
`background` (`src/shared/node-presence.ts`). De gebeurtenis wordt alleen opgeslagen voor
geauthenticeerde apparaatsessies van nodes; sessies zonder apparaat of niet-gekoppelde sessies retourneren
`handled: false`.

Geslaagde gateways retourneren een gestructureerd resultaat:

```json
{
  "ok": true,
  "event": "node.presence.alive",
  "handled": true,
  "reason": "persisted"
}
```

Oudere gateways retourneren mogelijk alleen `{ "ok": true }` voor `node.event`; behandel dat
als een bevestigde RPC, niet als duurzame opslag van aanwezigheid.

## Bereik van broadcastgebeurtenissen

Door de server gepushte broadcastgebeurtenissen worden op bereik afgeschermd, zodat sessies
met alleen koppelingsbereik of alleen noderol niet passief sessie-inhoud ontvangen
(`src/gateway/server-broadcast.ts`):

- Chat-, agent- en toolresultaatframes (gestreamde `agent`-gebeurtenissen, toolresultaat-
  gebeurtenissen) vereisen ten minste `operator.read`. Sessies zonder dit bereik slaan deze
  frames volledig over.
- Door Plugins gedefinieerde `plugin.*`-broadcasts zijn standaard beperkt tot `operator.write` of
  `operator.admin`; expliciete vermeldingen zoals
  `plugin.approval.requested` / `plugin.approval.resolved` gebruiken
  in plaats daarvan `operator.approvals`.
- Status-/transportgebeurtenissen (`heartbeat`, `presence`, `tick`, verbindings-/verbrekings-
  levenscyclus) blijven onbeperkt, zodat de transportstatus voor elke
  geauthenticeerde sessie waarneembaar is.
- Onbekende families van broadcastgebeurtenissen worden standaard op bereik afgeschermd (fail-closed),
  tenzij een geregistreerde handler dit expliciet versoepelt.

Elke clientverbinding houdt een eigen volgnummer per client bij, zodat broadcasts
op die socket monotoon geordend blijven, zelfs wanneer verschillende clients
verschillende, op bereik gefilterde subsets van de gebeurtenisstroom zien.

## RPC-methodefamilies

`hello-ok.features.methods` is een conservatieve detectielijst die is opgebouwd uit
`src/gateway/server-methods-list.ts` plus geëxporteerde methoden van geladen Plugins/kanalen
— het is geen gegenereerde dump van elke methode, en sommige methoden (bijvoorbeeld
`push.test`, `web.login.start`, `web.login.wait`, `sessions.usage`)
zijn bewust uitgesloten van detectie, hoewel het echte, aanroepbare
methoden zijn. Behandel dit als functiedetectie, niet als een volledige opsomming van
`src/gateway/server-methods/*.ts`.

<AccordionGroup>
  <Accordion title="Systeem en identiteit">
    - `health` retourneert de gecachte of zojuist gepeilde momentopname van de Gateway-status.
    - `diagnostics.stability` retourneert de recente begrensde recorder voor diagnostische stabiliteit: gebeurtenisnamen, aantallen, bytegroottes, geheugenuitlezingen, wachtrij-/sessiestatus, kanaal-/Pluginnamen en sessie-id's. Geen chattekst, Webhook-bodies, tooluitvoer, onbewerkte request-/response-bodies, tokens, cookies of geheimen. Vereist `operator.read`.
    - `status` retourneert de Gateway-samenvatting in `/status`-stijl; gevoelige velden alleen voor operatorclients met adminbereik.
    - `gateway.identity.get` retourneert de apparaatidentiteit van de Gateway die door relay- en koppelingsstromen wordt gebruikt.
    - `system-presence` retourneert de huidige momentopname van de aanwezigheid van verbonden operator-/nodeapparaten.
    - `system-event` voegt een systeemgebeurtenis toe en kan de aanwezigheidscontext bijwerken/uitzenden.
    - `last-heartbeat` retourneert de laatst opgeslagen Heartbeat-gebeurtenis.
    - `set-heartbeats` schakelt Heartbeat-verwerking op de Gateway in of uit.
    - `gateway.suspend.prepare` maakt alleen een korte lease voor coöperatieve onderbreking wanneer bijgehouden Gateway-werk inactief is. `gateway.suspend.status` controleert die lease en `gateway.suspend.resume` geeft deze vrij na hervatting of een afgebroken hostbewerking.

  </Accordion>

  <Accordion title="Modellen en gebruik">
    - `models.list` retourneert de tijdens runtime toegestane modelcatalogus. Zie de weergaven voor "`models.list`" hieronder.
    - `usage.status` retourneert gebruiksvensters/resterende quotasamenvattingen van providers.
    - `usage.cost` retourneert geaggregeerde samenvattingen van kostengebruik voor een datumbereik. Geef `agentId` door voor één agent, of `agentScope: "all"` om geconfigureerde agents te aggregeren.
    - `doctor.memory.status` retourneert de gereedheidsstatus van vectorgeheugen/gecachete embeddings voor de actieve standaardwerkruimte van de agent. Geef `{ "probe": true }` of `{ "deep": true }` alleen door voor een expliciete liveping naar een embeddingprovider. Geef `{ "agentId": "agent-id" }` door om statistieken van de Dreaming-opslag tot één agentwerkruimte te beperken; bij weglating worden geconfigureerde Dreaming-werkruimten geaggregeerd.
    - `doctor.memory.dreamDiary`, `doctor.memory.backfillDreamDiary`, `doctor.memory.resetDreamDiary`, `doctor.memory.resetGroundedShortTerm`, `doctor.memory.repairDreamingArtifacts` en `doctor.memory.dedupeDreamDiary` accepteren optioneel `{ "agentId": "agent-id" }`; bij weglating werken ze op de geconfigureerde standaardwerkruimte van de agent.
    - `doctor.memory.remHarness` retourneert een begrensde, alleen-lezen preview van de REM-harness voor externe control-plane-clients, inclusief werkruimtepaden, geheugenfragmenten, gerenderde onderbouwde markdown en kandidaten voor diepgaande promotie. Vereist `operator.read`.
    - `sessions.usage` retourneert gebruikssamenvattingen per sessie. Geef `agentId` door voor één agent, of `agentScope: "all"` om geconfigureerde agents samen weer te geven.
      Beide gebruiksmethoden accepteren `mode: "specific"` met een IANA-`timeZone` voor zomertijdbewuste grenzen en buckets van kalenderdagen. `utcOffset` blijft ondersteund voor oudere clients en als fallback wanneer de Gateway-runtime de gevraagde zone niet herkent.
    - `sessions.usage.timeseries` retourneert tijdreeksgebruik voor één sessie.
    - `sessions.usage.logs` retourneert gebruikslogvermeldingen voor één sessie.

  </Accordion>

  <Accordion title="Kanalen en aanmeldhulpmiddelen">
    - `channels.status` retourneert ingebouwde + gebundelde statusoverzichten van kanalen/Plugins.
    - `channels.logout` meldt een specifiek kanaal/account af wanneer het kanaal dit ondersteunt.
    - `web.login.start` start een QR-/webaanmeldingsstroom voor de huidige webkanaalprovider met QR-ondersteuning.
    - `web.login.wait` wacht tot die stroom is voltooid en start bij succes het kanaal.
    - `push.test` verzendt een testpush via APNs naar een geregistreerde iOS-node.
    - `voicewake.get` retourneert de opgeslagen activeringswoordtriggers.
    - `voicewake.set` werkt activeringswoordtriggers bij en zendt de wijziging uit.

  </Accordion>

  <Accordion title="Pluginbeheer">
    - `plugins.list` (`operator.read`) retourneert de inventaris van geïnstalleerde Plugins plus lokaal samengestelde officiële keuzes, diagnostiek en of de huidige installatiemodus wijzigingen toestaat.
    - `plugins.search` (`operator.read`) zoekt naar installeerbare families van ClawHub-code-Plugins en bundel-Plugins. Geef een niet-lege `query` en een optionele `limit` van 1 tot 100 door.
    - `plugins.install` (`operator.admin`) installeert een officiële catalogusvermelding met `{ source: "official", pluginId }` of een ClawHub-pakket met `{ source: "clawhub", packageName, version?, acknowledgeClawHubRisk? }`. ClawHub-installaties behouden de vertrouwens-, integriteits- en installatiebeleidscontroles van de Gateway. Geslaagde installaties vereisen dat de Gateway opnieuw wordt gestart.
    - `plugins.setEnabled` (`operator.admin`) wijzigt met `{ pluginId, enabled }` het inschakelbeleid van één geïnstalleerde Plugin. Het antwoord bevat de bijgewerkte catalogusvermelding, metadata voor opnieuw starten en eventuele waarschuwingen over slotselectie.
    - `plugins.uninstall` (`operator.admin`) verwijdert één extern geïnstalleerde Plugin met `{ pluginId }`: configuratieverwijzingen, de installatierecord en beheerde bestanden. Gebundelde Plugins kunnen niet worden verwijderd, alleen uitgeschakeld. Het antwoord vermeldt de verwijderingsacties en vereist altijd dat de Gateway opnieuw wordt gestart.

  </Accordion>

  <Accordion title="Berichten en logboeken">
    - `send` is de directe RPC voor uitgaande aflevering voor verzendingen gericht op een kanaal/account/thread buiten de chatrunner.
    - `logs.tail` retourneert het geconfigureerde uiteinde van het Gateway-bestandslogboek met besturingselementen voor cursor/limiet en maximaal aantal bytes.

  </Accordion>

  <Accordion title="Operatorterminal">
    - `terminal.open` start een host-PTY voor een expliciete `agentId` of de standaardagent en retourneert de bepaalde agent, werkmap, shell en isolatiestatus.
    - `terminal.input`, `terminal.resize` en `terminal.close` werken alleen op sessies die eigendom zijn van de aanroepende verbinding.
    - `terminal.upload` accepteert één base64-bestand van maximaal 16 MiB, plaatst het in een persoonlijke tijdelijke map met een bewaartermijn van 24 uur op de Gateway- of gekoppelde Node-host van de sessie en retourneert het absolute pad. De aanroeper moet dat pad nog steeds plakken of anderszins gebruiken; de RPC schrijft nooit terminalinvoer en voert geen opdracht uit.
    - `terminal.data`- en `terminal.exit`-gebeurtenissen worden alleen gestreamd naar de verbinding die eigenaar is van de sessie.
    - Sessies waarvan de verbinding wegvalt, worden losgekoppeld en niet beëindigd: ze blijven gedurende `gateway.terminal.detachedSessionTimeoutSeconds` opnieuw koppelbaar (standaard 300; `0` herstelt beëindiging bij verbroken verbinding), terwijl recente uitvoer zich ophoopt in een begrensde buffer aan de serverzijde.
    - `terminal.list` retourneert koppelbare sessies; `terminal.attach` koppelt een actieve of losgekoppelde sessie opnieuw aan de aanroepende verbinding en retourneert de herhalingsbuffer (overname in tmux-stijl — een eerdere actieve eigenaar ontvangt `terminal.exit` met reden `detached`); `terminal.text` leest de buffer als platte tekst zonder deze te koppelen.
    - Elke terminalmethode vereist `operator.admin`; `gateway.terminal.enabled` moet expliciet waar zijn. Volledig gesandboxte agents worden geweigerd en een wijziging van het agentbeleid sluit bestaande en lopende PTY's, inclusief losgekoppelde PTY's.

  </Accordion>

  <Accordion title="Spraak en TTS">
    - `talk.catalog` retourneert de alleen-lezen catalogus met Talk-providers voor spraak, streamingtranscriptie en realtime spraak: canonieke provider-id's, registeraliassen, labels, configuratiestatus, een optioneel `ready`-resultaat op groepsniveau, beschikbare model-/spraak-id's, canonieke modi, transporten, breinstrategieën en vlaggen voor realtime audio/mogelijkheden, zonder providergeheimen te retourneren of de globale configuratie te wijzigen. Huidige gateways stellen `ready` in nadat de selectie van de runtimeprovider is toegepast; beschouw afwezigheid ervan op oudere gateways als niet-geverifieerd.
    - `talk.config` retourneert de effectieve Talk-configuratiepayload; `includeSecrets` vereist `operator.talk.secrets` (of `operator.admin`).
    - `talk.session.create` maakt een Talk-sessie onder beheer van de Gateway voor `realtime/gateway-relay`, `transcription/gateway-relay` of `stt-tts/managed-room`. Voor `stt-tts/managed-room` moeten `operator.write`-aanroepers die `sessionKey` doorgeven, ook `spawnedBy` doorgeven voor zichtbaarheid van de sessiesleutel binnen het bereik; het maken van een `sessionKey` zonder bereik en `brain: "direct-tools"` vereisen `operator.admin`.
    - `talk.session.join` valideert een sessietoken voor een beheerde ruimte, verzendt zo nodig `session.ready` of `session.replaced` en retourneert metagegevens over de ruimte/sessie plus recente Talk-gebeurtenissen, maar nooit het platteteksttoken of de hash ervan.
    - `talk.session.appendAudio` voegt base64-PCM-invoeraudio toe aan realtime relay- en transcriptiesessies onder beheer van de Gateway.
    - `talk.session.startTurn`, `talk.session.endTurn` en `talk.session.cancelTurn` sturen de levenscyclus van beurten in beheerde ruimten aan, waarbij verouderde beurten worden geweigerd voordat de status wordt gewist.
    - `talk.session.cancelOutput` stopt de audio-uitvoer van de assistent, hoofdzakelijk voor door VAD afgeschermd onderbreken in Gateway-relaysessies.
    - `talk.session.submitToolResult` voltooit een providertoolaanroep die is verzonden door een realtime relaysessie onder beheer van de Gateway. Het verzoek wacht op elk asynchroon voltooiingssignaal dat door de providerbrug beschikbaar wordt gesteld; mislukte inzendingen houden de gekoppelde uitvoering actief en verzenden geen gebeurtenis voor een geslaagd toolresultaat. Geef `options: { willContinue: true }` door voor tussentijdse tooluitvoer of `options: { suppressResponse: true }` wanneer de providerbrug ondersteuning voor onderdrukking aangeeft en het resultaat geen nieuwe respons mag starten.
    - `talk.session.steer` stuurt spraakbesturing voor de actieve uitvoering naar een door een agent ondersteunde Talk-sessie onder beheer van de Gateway: `{ sessionId, text, mode? }`, waarbij `mode` gelijk is aan `status`, `steer`, `cancel` of `followup`; als de modus is weggelaten, wordt deze geclassificeerd op basis van de gesproken tekst.
    - `talk.session.close` sluit een relay-, transcriptie- of beheerde-ruimtesessie onder beheer van de Gateway en verzendt afsluitende Talk-gebeurtenissen.
    - `talk.mode` stelt de huidige Talk-modusstatus in en zendt deze uit naar WebChat-/Control UI-clients.
    - `talk.client.create` maakt een realtime providersessie onder beheer van de client via `webrtc` of `provider-websocket`, terwijl de Gateway de configuratie, aanmeldgegevens, instructies en het toolbeleid beheert.
    - `talk.client.toolCall` laat realtime transporten onder beheer van de client providertoolaanroepen doorsturen naar het Gateway-beleid. De eerste ondersteunde tool is `openclaw_agent_consult`; clients ontvangen een uitvoerings-id en wachten op normale chatlevenscyclusgebeurtenissen voordat ze het providerspecifieke toolresultaat indienen.
    - `talk.client.steer` stuurt spraakbesturing voor de actieve uitvoering voor realtime transporten onder beheer van de client. De Gateway bepaalt de actieve ingesloten uitvoering op basis van `sessionKey` en retourneert een gestructureerd geaccepteerd/afgewezen resultaat in plaats van bijsturing stilzwijgend te negeren.
    - `talk.event` is het enige Talk-gebeurteniskanaal voor realtime, transcriptie, STT/TTS, beheerde ruimten, telefonie en vergaderadapters.
    - `talk.speak` synthetiseert spraak via de actieve Talk-spraakprovider.
    - `tts.status` retourneert de ingeschakelde TTS-status, actieve provider, fallbackproviders en de configuratiestatus van providers.
    - `tts.providers` retourneert de zichtbare inventaris van TTS-providers.
    - `tts.enable` en `tts.disable` schakelen de TTS-voorkeursstatus om.
    - `tts.setProvider` werkt de voorkeursprovider voor TTS bij.
    - `tts.convert` voert een eenmalige omzetting van tekst naar spraak uit.
    - `tts.speak` (`operator.write`) zet niet-lege `text` om met de geconfigureerde algemene TTS-providerketen en retourneert één volledige clip inline als `audioBase64`, plus `provider` en optionele metagegevens voor `outputFormat`, `mimeType` en `fileExtension`. In tegenstelling tot `tts.convert` retourneert dit geen lokaal Gateway-pad; in tegenstelling tot `talk.speak` vereist dit geen Talk-provider. Tekst boven `messages.tts.maxTextLength` retourneert `INVALID_REQUEST`; synthesefouten retourneren `UNAVAILABLE`.

  </Accordion>

  <Accordion title="Geheimen, configuratie, update en wizard">
    - `secrets.reload` bepaalt actieve SecretRefs opnieuw en vervangt de status van runtimegeheimen alleen bij volledig succes.
    - `secrets.resolve` bepaalt toewijzingen van geheimen aan opdrachtdoelen voor een specifieke set opdrachten/doelen.
    - `config.get` retourneert de huidige configuratiesnapshot op schijf, het onbewerkte `hash` van het hoofdbestand, de bepaalde `configRevisionHash` en optioneel `appliedConfigHash` voor de bepaalde revisie die door de actieve Gateway-runtime is geaccepteerd.
    - `config.set` schrijft een gevalideerde configuratiepayload.
    - `config.patch` voegt een gedeeltelijke configuratie-update samen. Destructieve vervanging van arrays vereist het betreffende pad in `replacePaths`; geneste arrays onder array-items gebruiken `[]`-paden, zoals `agents.list[].skills`.
    - `config.apply` valideert en vervangt de volledige configuratiepayload.
    - `config.schema` retourneert de actuele configuratieschemapayload die door Control UI en CLI-tooling wordt gebruikt: schema, `uiHints`, versie, generatiemetagegevens en metagegevens voor Plugin- en kanaalschema's wanneer deze kunnen worden geladen. De payload bevat `title`- en `description`-metagegevens uit dezelfde labels/helptekst als de gebruikersinterface, inclusief geneste object-, jokerteken-, array-item- en `anyOf`- / `oneOf`- / `allOf`-compositievertakkingen wanneer overeenkomende velddocumentatie bestaat.
    - `config.schema.lookup` retourneert voor één configuratiepad een op dat pad begrensde opzoekpayload: genormaliseerd pad, een oppervlakkig schemaknooppunt, overeenkomende hint plus `hintPath`, optionele `reloadKind` en directe onderliggende samenvattingen om in UI/CLI dieper te navigeren. `reloadKind` is `restart`, `hot` of `none` (`src/config/schema.ts`) en weerspiegelt de planner van de Gateway voor het opnieuw laden van de configuratie voor het aangevraagde pad. Schemaknooppunten voor opzoeken behouden de gebruikersgerichte documentatie en algemene validatievelden (`title`, `description`, `type`, `enum`, `const`, `format`, `pattern`, grenzen voor getallen/tekenreeksen/arrays/objecten, `additionalProperties`, `deprecated`, `readOnly`, `writeOnly`). Onderliggende samenvattingen tonen `key`, genormaliseerde `path`, `type`, `required`, `hasChildren`, optionele `reloadKind`, plus de overeenkomende `hint` / `hintPath`.
    - `update.run` voert de Gateway-updateprocedure uit en plant alleen een herstart als de update is geslaagd; aanroepers met een sessie kunnen `continuationMessage` opnemen, zodat bij het opstarten één vervolgstap van de agent wordt hervat via de wachtrij voor voortzetting na een herstart. Updates via pakketbeheerders en begeleide updates van git-checkouts vanuit het besturingsvlak gebruiken een losgekoppelde overdracht aan een beheerde service, in plaats van de pakketstructuur te vervangen of checkout-/builduitvoer binnen de actieve Gateway te wijzigen. Een gestarte overdracht retourneert `ok: true` met `result.reason: "managed-service-handoff-started"` en `handoff.status: "started"`; niet-beschikbare of mislukte overdrachten retourneren `ok: false` met `managed-service-handoff-unavailable` of `managed-service-handoff-failed`, plus `handoff.command` wanneer een handmatige shell-update vereist is. Niet-beschikbaar betekent dat OpenClaw geen veilige supervisorgrens of duurzame service-identiteit heeft, zoals `OPENCLAW_SYSTEMD_UNIT` voor systemd. Tijdens een gestarte overdracht kan de herstartmarkering kort `stats.reason: "restart-health-pending"` melden; de voortzetting wordt uitgesteld totdat de CLI de opnieuw gestarte Gateway verifieert en de definitieve `ok`-markering schrijft.
    - `update.status` vernieuwt en retourneert de nieuwste herstartmarkering voor de update, inclusief de actieve versie na de herstart wanneer deze beschikbaar is.
    - `wizard.start`, `wizard.next`, `wizard.status` en `wizard.cancel` stellen de onboardingwizard beschikbaar via WS-RPC.

  </Accordion>

  <Accordion title="Helpers voor agents en werkruimten">
    - `agents.list` retourneert geconfigureerde agentvermeldingen, inclusief effectieve model- en runtime-metadata.
    - `agents.create`, `agents.update` en `agents.delete` beheren agentrecords en werkruimteverbindingen.
    - `agents.files.list`, `agents.files.get` en `agents.files.set` beheren de bootstrap-werkruimtebestanden die aan een agent beschikbaar worden gesteld.
    - `audit.activity.list` retourneert het geversioneerde activiteitenlogboek dat alleen metadata bevat; `audit.list` blijft de compatibiliteitsveilige RPC voor uitvoeringen en tools.
    - `agents.workspace.list` en `agents.workspace.get` (`operator.read`) bieden alleen-lezen, gepagineerde toegang tot de werkruimtemap van een agent voor clients in het vertrouwde beheerdersdomein dat wordt beschreven in [Beheerdersbereiken](/nl/gateway/operator-scopes). Aanvragen accepteren uitsluitend paden die relatief zijn ten opzichte van de werkruimte; leesbewerkingen blijven beperkt tot de via realpath bepaalde werkruimteroot (ontsnappingen via symbolische en harde koppelingen worden geweigerd), hebben een maximale grootte en zijn beperkt tot UTF-8-tekst en gangbare afbeeldingstypen (base64). Antwoorden stellen het werkruimtepad op de host niet beschikbaar. Deze naamruimte bevat geen schrijfbewerkingen.
    - `tasks.list`, `tasks.get` en `tasks.cancel` stellen het Gateway-taaklogboek beschikbaar aan SDK- en beheerclients. Zie hieronder [RPC's voor het taaklogboek](#task-ledger-rpcs).
    - `artifacts.list`, `artifacts.get` en `artifacts.download` bieden uit transcripties afgeleide artefactsamenvattingen en downloads voor een expliciet bereik van `sessionKey`, `runId` of `taskId`. Uitvoerings- en taakquery's bepalen de bijbehorende sessie aan de serverzijde en retourneren alleen transcriptiemedia met een overeenkomende herkomst; onveilige of lokale URL-bronnen retourneren niet-ondersteunde downloads in plaats van ze aan de serverzijde op te halen.
    - `environments.list` en `environments.status` behouden de detectie van de Gateway-lokale omgeving en Node-omgeving. Geconfigureerde cloudworkers en duurzame records die door eerdere profielen zijn achtergelaten, voegen `worker`-metadata toe met `providerId`, optioneel `leaseId`, `state`, `ageMs`, optioneel `idleMs` en `attachedSessionIds`. De levenscyclusstatussen van workers zijn `requested`, `provisioning`, `bootstrapping`, `ready`, `attached`, `idle`, `draining`, `destroying`, `destroyed`, `failed` en `orphaned`.
    - `environments.create` (`{ profileId, idempotencyKey }`) maakt een worker aan vanuit een geconfigureerd profiel van een Plugin-provider; nieuwe pogingen met dezelfde sleutel hergebruiken de duurzame bewerking. `environments.destroy` (`{ environmentId }`) vraagt om idempotente ontmanteling van een duurzame workeromgeving. Beide vereisen `operator.admin`, zijn schrijfbewerkingen op het besturingsvlak en retourneren dezelfde vorm van omgevingssamenvatting als statusantwoorden.
    - `agent.identity.get` retourneert de effectieve assistentidentiteit voor een agent of sessie.
    - `agent.wait` wacht tot een uitvoering is voltooid en retourneert de terminale momentopname wanneer die beschikbaar is.

  </Accordion>

  <Accordion title="Sessiebeheer">
    - `sessions.list` retourneert de huidige sessie-index, inclusief `agentRuntime`-metadata per rij wanneer een runtimebackend voor agents is geconfigureerd. Wanneer plaatsing bij cloudworkers is ingeschakeld of er een duurzame herstelstatus bestaat, bevatten sessierijen ook een gesloten `placement`-status (`local`, `requested`, `provisioning`, `syncing`, `starting`, `active`, `draining`, `reconciling`, `reclaimed` of `failed`) plus statusspecifieke velden voor omgeving, eigenaarsepoch, werkruimte, bundel, ACK-cursor of herstel.
    - `sessions.subscribe` en `sessions.unsubscribe` schakelen abonnementen op sessiewijzigingsgebeurtenissen in of uit voor de huidige WS-client.
    - `sessions.messages.subscribe` en `sessions.messages.unsubscribe` schakelen abonnementen op transcriptie-/berichtgebeurtenissen in of uit voor één sessie. Geef `includeApprovals: true` door om ook opgeschoonde `session.approval`-levenscyclusgebeurtenissen te ontvangen voor goedkeuringen waarvan het opgeslagen publiek precies die sessie omvat en waarvan de beoordelaarsbinding de abonnerende client machtigt. Het antwoord op het abonnement bevat dan een begrensde, openstaande `approvalReplay`; deze is gezaghebbend wanneer `truncated` onwaar is. De opt-in geldt per abonnementsaanroep en blijft niet behouden: opnieuw abonneren op dezelfde sessie zonder `includeApprovals: true` verwijdert een bestaand goedkeuringsabonnement. Naast de normale autorisatie om de sessie te lezen vereist deze opt-in `operator.admin`, of `operator.approvals` op een gekoppeld apparaat.
    - `sessions.preview` retourneert begrensde transcriptievoorbeelden voor specifieke sessiesleutels.
    - `sessions.describe` retourneert één Gateway-sessierij voor een exacte sessiesleutel.
    - `sessions.resolve` herleidt of canonicaliseert een sessiedoel.
    - `sessions.create` maakt een nieuwe sessievermelding. Optionele waarden voor `model` en `thinkingLevel` slaan de aanvankelijke model- en redeneeroverrides atomair op. `worktree: true` maakt een beheerde worktree aan; optionele waarden voor `worktreeBaseRef`/`worktreeName` selecteren de basisreferentie en branchnaam, en `execNode` (`operator.admin`) bindt sessie-uitvoering aan een Node-host. De aangemaakte worktree wordt in het resultaat teruggegeven en in de sessierij opgeslagen (`worktree: { id, branch, repoRoot }`). Wanneer de vermelding wordt aangemaakt maar de geneste initiële `chat.send` wordt geweigerd, bevat het succesvolle resultaat `runStarted: false` en `runError`; clients kunnen de prompt behouden en de poging herhalen met de geretourneerde sessiesleutel.
    - `sessions.dispatch` (`operator.admin`) verplaatst een bestaande lokale OpenClaw-sessie met een door de sessie beheerde worktree naar een geconfigureerd cloudworkerprofiel. Geef `{ key, profileId, agentId? }` door. De methode ontbreekt wanneer er geen workerprofiel is geconfigureerd, sluit de lokale toelating van beurten voordat actief werk wordt afgehandeld en retourneert pas nadat de plaatsing het workereigenaarschap `active` heeft bereikt. De overdracht is eenrichtingsverkeer; het terughalen van een worker naar lokaal maakt geen deel uit van deze RPC.
    - `sessions.groups.list`, `sessions.groups.put`, `sessions.groups.rename` en `sessions.groups.delete` beheren de aangepaste, door de Gateway beheerde catalogus met sessiegroepen (namen + weergavevolgorde). Het lidmaatschap blijft opgeslagen in het veld `category` van elke sessie; hernoemen en verwijderen werken lidsessies aan de serverzijde bij.
    - `sessions.send` stuurt een bericht naar een bestaande sessie.
    - `sessions.steer` is de variant voor onderbreken en bijsturen van een actieve sessie.
    - `sessions.abort` breekt actief werk voor een sessie af. Geef `key` plus optioneel `runId` door, of alleen `runId` voor actieve uitvoeringen die de Gateway tot een sessie kan herleiden.
    - `sessions.patch` werkt sessiemetadata/-overrides bij en rapporteert het herleide canonieke model plus de effectieve `agentRuntime`.
    - `sessions.reset`, `sessions.delete` en `sessions.compact` voeren sessieonderhoud uit.
    - `sessions.get` retourneert de volledige opgeslagen sessierij.
    - Chatuitvoering gebruikt nog steeds `chat.history`, `chat.send`, `chat.abort` en `chat.inject`. `chat.history` wordt voor UI-clients genormaliseerd voor weergave: inline directivetags worden uit zichtbare tekst verwijderd, XML-payloads voor toolaanroepen in platte tekst (`<tool_call>...</tool_call>`, `<function_call>...</function_call>`, `<tool_calls>...</tool_calls>`, `<function_calls>...</function_calls>` en afgekorte toolaanroepblokken) en gelekte ASCII-/volledige-breedtebesturingstokens van modellen worden verwijderd, assistentrijen die uitsluitend uit stille tokens bestaan (exact `NO_REPLY` / `no_reply`) worden weggelaten en te grote rijen kunnen door tijdelijke aanduidingen worden vervangen.
    - `chat.message.get` is de aanvullende, begrensde lezer voor volledige berichten van één zichtbare transcriptievermelding. Geef `sessionKey` door, optioneel `agentId` wanneer de sessieselectie tot een agent is beperkt, en een transcriptie-`messageId` die eerder via `chat.history` is aangeboden; de Gateway retourneert dezelfde voor weergave genormaliseerde projectie zonder de lichte afkappingslimiet voor geschiedenis, wanneer de opgeslagen vermelding nog beschikbaar en niet te groot is.
    - `chat.toolTitles` retourneert korte doeltitels voor toolaanroepen die in de Control UI worden weergegeven (in batches, maximaal 24 items met begrensde invoer). De functie is opt-in via `gateway.controlUi.toolTitles` (standaard uitgeschakeld); uitgeschakelde Gateways beantwoorden `{ titles: {}, disabled: true }` zonder modelaanroep, zodat clients stoppen met aanvragen. Wanneer ingeschakeld gebruiken titels de standaardroutering voor utility-modellen: een expliciet geconfigureerde `utilityModel` (een beheerdersbeslissing die, net als alle utility-taken, begrensde taakinhoud naar de gekozen provider kan sturen), anders de opgegeven standaard voor kleine modellen van de sessieprovider, zodat er niet impliciet een nieuwe uitgaande bestemming ontstaat; een lege `utilityModel` schakelt ze volledig uit. Titels vallen nooit terug op het primaire model. Resultaten worden in de statusdatabase per agent gecachet op basis van toolnaam + invoer, zodat herhaalde weergaven dezelfde aanroepen nooit opnieuw in rekening brengen.
    - `chat.send` accepteert voor één beurt `fastMode: "auto"` om de snelle modus te gebruiken voor modelaanroepen die vóór de automatische grens worden gestart, en start latere nieuwe pogingen, fallbacks, toolresultaten of vervolgaanroepen vervolgens zonder snelle modus. De grens is standaard 60 seconden (`DEFAULT_FAST_MODE_AUTO_ON_SECONDS`) en kan per model worden geconfigureerd met `agents.defaults.models["<provider>/<model>"].params.fastAutoOnSeconds`. Een `chat.send`-aanroeper kan voor één beurt `fastAutoOnSeconds` doorgeven om de grens voor die aanvraag te overschrijven. Geef `queueMode` (`steer`, `followup`, `collect` of `interrupt`) door om de opgeslagen wachtrijmodus alleen voor deze aanvraag te overschrijven; expliciete bijstuuracties in de Control UI gebruiken `queueMode: "steer"`.

  </Accordion>

  <Accordion title="Apparaatkoppeling en apparaattokens">
    - `device.pair.list` retourneert apparaten waarvan de koppeling in behandeling of goedgekeurd is.
    - `device.pair.setupCode` maakt een mobiele installatiecode en standaard een PNG-QR-gegevens-URL aan. Hiervoor is `operator.admin` vereist en de methode wordt opzettelijk weggelaten uit de gepubliceerde detectiegegevens. Het resultaat bevat `setupCode`, optioneel `qrDataUrl`, `gatewayUrl`, het niet-geheime label `auth` en `urlSource`.
    - `device.pair.approve`, `device.pair.reject` en `device.pair.remove` beheren records voor apparaatkoppeling.
    - `device.pair.rename` wijst een beheerderslabel (`{ deviceId, label }`) toe dat de voorkeur krijgt boven de door de client gemelde weergavenaam en behouden blijft na reparatie of hernieuwde goedkeuring van het apparaat.
    - `device.token.rotate` roteert een token van een gekoppeld apparaat binnen de grenzen van de goedgekeurde rol en het bereik van de aanroeper.
    - `device.token.revoke` trekt een token van een gekoppeld apparaat in binnen de grenzen van de goedgekeurde rol en het bereik van de aanroeper.

    De installatiecode bevat een kortlevende bootstrapreferentie. Clients mogen deze niet
    loggen of langer dan de koppelingsprocedure bewaren.

  </Accordion>

  <Accordion title="Node-koppeling, aanroepen en openstaand werk">
    - `node.pair.list`, `node.pair.approve`, `node.pair.reject` en `node.pair.remove` behandelen goedkeuringen voor Node-mogelijkheden. `node.pair.request` en `node.pair.verify` zijn in 2026.7 verwijderd, samen met het zelfstandige opslagmechanisme voor Node-koppelingen; openstaande verzoeken worden door de Gateway aangemaakt wanneer Nodes verbinding maken.
    - `node.list` en `node.describe` retourneren de status van bekende/verbonden Nodes.
    - `node.rename` werkt het label van een gekoppelde Node bij.
    - `node.invoke` stuurt een opdracht door naar een verbonden Node.
    - `node.invoke.result` retourneert het resultaat van een aanroepverzoek.
    - `mcp.tools.call.v1` is de headless Node-hostopdracht voor het aanroepen van een geconfigureerde Node-lokale MCP-tool. Deze wordt doorgegeven via `node.invoke`, vereist dat de Node de opdracht declareert en blijft onderworpen aan koppelingsgoedkeuring en `gateway.nodes.denyCommands`.
    - `node.event` stuurt gebeurtenissen die van Nodes afkomstig zijn terug naar de Gateway.
    - `node.pluginTools.update` is het enige publicatiepad voor het vervangen van de voor de agent zichtbare Plugin-/MCP-toolbeschrijvingen van de verbonden Node; de parameters van `connect` bevatten deze niet.
    - `node.pending.pull` en `node.pending.ack` zijn de wachtrij-API's voor verbonden Nodes.
    - `node.pending.enqueue` en `node.pending.drain` beheren duurzaam openstaand werk voor offline/niet-verbonden Nodes.

  </Accordion>

  <Accordion title="Goedkeuringsfamilies">
    - `approval.get` en `approval.resolve` zijn de soortonafhankelijke methoden voor duurzame goedkeuring (bereik `operator.approvals`). `approval.get` retourneert een opgeschoonde openstaande of bewaarde terminale projectie met een stabiele `urlPath`; `approval.resolve` accepteert de canonieke goedkeurings-id, een expliciete `kind` en een beslissing, past een resolutie toe waarbij het eerste antwoord wint en retourneert altijd het vastgelegde canonieke resultaat.
    - `exec.approval.request`, `exec.approval.get`, `exec.approval.list` en `exec.approval.resolve` behandelen eenmalige uitvoeringsgoedkeuringsverzoeken plus het opzoeken/opnieuw afspelen van openstaande goedkeuringen. Het zijn adapters aan de protocolgrens bovenop hetzelfde duurzame goedkeuringsregister.
    - `exec.approval.waitDecision` wacht op één openstaande uitvoeringsgoedkeuring en retourneert de definitieve beslissing (of `null` bij een time-out).
    - `exec.approvals.get` en `exec.approvals.set` beheren momentopnamen van het Gateway-beleid voor uitvoeringsgoedkeuring.
    - `exec.approvals.node.get` en `exec.approvals.node.set` beheren Node-lokaal beleid voor uitvoeringsgoedkeuring via Node-relayopdrachten.
    - `plugin.approval.request`, `plugin.approval.list`, `plugin.approval.waitDecision` en `plugin.approval.resolve` behandelen door Plugins gedefinieerde goedkeuringsstromen.

  </Accordion>

  <Accordion title="Automatisering, Skills en tools">
    - Automatisering: `wake` plant een tekstinjectie in om onmiddellijk of bij de volgende Heartbeat te activeren; `cron.get`, `cron.list`, `cron.status`, `cron.add`, `cron.update`, `cron.remove`, `cron.run`, `cron.runs` beheren gepland werk.
    - `cron.run` blijft een RPC in wachtrijstijl voor handmatige uitvoeringen. Clients die voltooiingssemantiek nodig hebben, moeten de geretourneerde `runId` lezen en `cron.runs` pollen.
    - `cron.runs` accepteert een optioneel, niet-leeg `runId`-filter, zodat clients één handmatige uitvoering in de wachtrij kunnen volgen zonder te concurreren met andere geschiedenisitems voor dezelfde taak.
    - Skills en tools: `commands.list`, `skills.*`, `tools.catalog`, `tools.effective`, `tools.invoke`. Zie [Hulpmethoden voor operators](#operator-helper-methods) hieronder.

  </Accordion>
</AccordionGroup>

### Algemene gebeurtenisfamilies

- `chat`: updates van UI-chats, zoals `chat.inject`, en andere chatgebeurtenissen die
  uitsluitend voor het transcript bestemd zijn. In protocol v4 bevatten delta-payloads `deltaText`; `message` blijft
  de cumulatieve momentopname van de assistent. Vervangingen zonder voorvoegsel stellen
  `replace=true` in en gebruiken `deltaText` als vervangende tekst.
- `session.message`, `session.operation`, `session.tool`: updates van het transcript, de lopende
  sessiebewerking en de gebeurtenisstroom voor een sessie waarop is geabonneerd.
- `session.approval`: opgeschoonde waarheid over openstaande en terminale goedkeuringen voor een
  expliciet aangemelde abonnee van exact die sessie. Onderliggende goedkeuringen gebruiken de
  opgeslagen doelgroep van de voorouder; gebeurtenissen wijzigen nooit transcripties en activeren geen agents.
- `sessions.changed`: sessie-index of metagegevens gewijzigd.
- `presence`: updates van momentopnamen van systeemaanwezigheid.
- `tick`: periodieke keepalive-/levendigheidsgebeurtenis.
- `health`: update van de momentopname van de Gateway-status.
- `heartbeat`: update van de Heartbeat-gebeurtenisstroom.
- `cron`: gebeurtenis voor een wijziging van een Cron-uitvoering/-taak.
- `shutdown`: melding dat de Gateway wordt afgesloten.
- `node.pair.requested` / `node.pair.resolved`: levenscyclus van Node-koppelingen.
- `node.invoke.request`: uitzending van een Node-aanroepverzoek.
- `device.pair.requested` / `device.pair.resolved`: levenscyclus van gekoppelde apparaten.
- `voicewake.changed`: configuratie van het activeringswoord gewijzigd.
- `exec.approval.requested` / `exec.approval.resolved`: levenscyclus van
  uitvoeringsgoedkeuringen.
- `plugin.approval.requested` / `plugin.approval.resolved`: levenscyclus van
  Plugin-goedkeuringen.

### Hulpmethoden voor Nodes

Nodes kunnen `skills.bins` aanroepen om de huidige lijst met uitvoerbare Skills
voor controles op automatische toestemming op te halen.

## RPC voor auditlogboek

`audit.activity.list` biedt operatorclients een stabiele weergave, met de nieuwste items eerst, van metagegevens over de levenscyclus van
agentuitvoeringen, toolacties en berichten waarvoor expliciet is gekozen. Hiervoor is
`operator.read` vereist. Query's sluiten records ouder dan 30 dagen uit en het gedeelde
SQLite-logboek is beperkt tot 100,000 records. Verlopen rijen worden verwijderd tijdens
het opstarten van de Gateway, tijdens elk uur uitgevoerd onderhoud en bij latere schrijfbewerkingen. Zie
[Auditgeschiedenis](/gateway/audit) voor het gegevensmodel en de privacysemantiek.

- Parameters: optionele exacte `agentId`, `sessionKey` of `runId`; optionele `kind`
  (`"agent_run"`, `"tool_action"` of `"message"`); optionele `status`
  (`"started"`, `"succeeded"`, `"failed"`, `"cancelled"`, `"timed_out"`,
  `"blocked"` of `"unknown"`); optionele bericht-`direction` (`"inbound"` of
  `"outbound"`) en exacte `channel`; optionele inclusieve Unix-millisecondegrenzen `after` / `before`;
  optionele `limit` van `1` tot `500`; en optionele
  tekenreeks `cursor` van de vorige pagina.
- Resultaat: `{ "events": AuditActivityEventV1[], "nextCursor"?: string }`.

De benoemde V1-resultaatunion heeft afzonderlijke schema's voor agentuitvoeringen, toolacties, inkomende berichten
en uitgaande berichten. De discriminator `eventType` is respectievelijk
`agent_run`, `tool_action`, `inbound_message` of `outbound_message`; `kind` en
bericht-`direction` blijven beschikbaar voor filtering en weergave. Elke gebeurtenis heeft
een gehele `schemaVersion: 1`. Verwijzingen naar berichtidentiteiten gebruiken de exacte
`hmac-sha256:v1:<32 hex key id>:<64 hex digest>`-notatie; een actor-id van een kanaalafzender
gebruikt dezelfde notatie.

Alle varianten vereisen `eventType`, `schemaVersion`, `eventId`, `sequence`,
`sourceSequence`, `occurredAt`, `kind`, `action`, `status`, `actor` en
`redaction`. De variantvelden zijn:

| `eventType`        | Verplichte velden                                                   | Optionele velden                                                                                                                 |
| ------------------ | ----------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------- |
| `agent_run`        | `agentId`, `runId`; `kind: "agent_run"`                           | `sessionKey`, `sessionId`, `errorCode`                                                                                          |
| `tool_action`      | `agentId`, `runId`; `kind: "tool_action"`                         | `sessionKey`, `sessionId`, `toolCallId`, `toolName`, `errorCode`                                                                |
| `inbound_message`  | `direction: "inbound"`, `channel`, `conversationKind`, `outcome`  | `agentId`, `runId`, `durationMs`, `resultCount`, identiteitsverwijzingen, `reasonCode`, `errorCode`                                 |
| `outbound_message` | `direction: "outbound"`, `channel`, `conversationKind`, `outcome` | `agentId`, `runId`, `durationMs`, `resultCount`, identiteitsverwijzingen, `reasonCode`, `deliveryKind`, `failureStage`, `errorCode` |

De gesloten bericht-enums zijn:

- `conversationKind`: `direct`, `group`, `channel` of `unknown`.
- Inkomende `outcome`: `completed`, `skipped` of `failed`; optionele
  `reasonCode`: `duplicate`, `reply_operation_active`,
  `reply_operation_aborted`, `fast_abort`, `plugin_bound_handled`,
  `plugin_bound_unavailable`, `plugin_bound_declined`, `plugin_bound_error`,
  `before_dispatch_handled`, `acp_dispatch_completed`, `acp_dispatch_failed`,
  `acp_dispatch_empty` of `acp_dispatch_aborted`.
- Uitgaande `outcome`: `sent`, `suppressed`, `failed` of `unknown`; optionele
  `reasonCode`: `cancelled_by_message_sending_hook`,
  `cancelled_by_reply_payload_sending_hook`,
  `empty_after_message_sending_hook`, `empty_after_reply_payload_sending_hook`
  of `no_visible_payload`. Een adapter die geen platformidentiteit retourneert, is
  `unknown`, omdat het externe neveneffect niet kan worden uitgesloten.
- `deliveryKind`: `text`, `media` of `other`; `failureStage`:
  `platform_send`, `queue` of `unknown`.

Terminale velden zijn gecorreleerd en niet onafhankelijk optioneel:

| Variant          | Terminale toewijzing                                                                                                                                                   |
| ---------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Agentuitvoering        | `started` heeft geen `errorCode`; elke voltooide status die geen succes aangeeft, vereist de bijbehorende `run_*`-code.                                                                 |
| Toolactie      | `started` en geslaagd hebben geen `errorCode`; elke andere voltooide status vereist de bijbehorende `tool_*`-code.                                                       |
| Inkomend bericht  | geslaagd = `completed`; geblokkeerd = `skipped`; mislukt = `failed` plus `message_processing_failed`. `reasonCode` moet, indien aanwezig, tot die terminale familie behoren. |
| Uitgaand bericht | geslaagd = `sent`; geblokkeerd = `suppressed` plus `reasonCode`; mislukt = `failed` plus `errorCode` en `failureStage`; onbekend = `unknown` plus `failureStage`.      |

Elke activiteitsgebeurtenis bevat een stabiele gebeurtenis-id, een monotoon oplopend grootboekvolgnummer,
een volgnummer van de brongebeurtenis, een tijdstempel, actor, actie, status, een geheel getal
`schemaVersion: 1` en `redaction: "metadata_only"`. Uitvoerings- en toolrecords
vereisen herkomstgegevens van de agent en uitvoering en kunnen herkomstgegevens van de sessie bevatten. Berichtrecords
kunnen agent- en uitvoerings-id's bevatten, maar bevatten opzettelijk nooit
`sessionKey` of `sessionId`; het queryfilter `sessionKey` is daarom alleen van toepassing op
uitvoerings- en toolrijen. Toolgebeurtenissen kunnen een toolaanroep-id en toolnaam bevatten.

Berichtrecords gebruiken `message.inbound.processed` of
`message.outbound.finished` en voegen richting, kanaal, gesprekstype,
genormaliseerde uitkomst en optioneel leveringstype, foutfase, duur,
aantal resultaten, redencode en installatiegebonden gepseudonimiseerde
account-, gespreks-, bericht- en doelwaarden met sleutel toe. Deze pseudoniemen helpen
bij correlatie, maar zijn geen anonimisering: de statusdatabase bevat hun sleutel,
terwijl RPC- en CLI-exports die niet bevatten. Het grootboek bewaart geen prompts, berichtinhoud,
toolargumenten, toolresultaten, opdrachtuitvoer of onbewerkte fouttekst.
Waarden van uitvoerings-/tool-`sessionKey` blijven onbewerkte correlatiemetadata en kunnen
platformaccount- of peer-id's bevatten; berichtrecords laten sessiesleutels weg.

Voor inkomende rijen meet `durationMs` de kerndispatch tot en met de eindstatus en
telt `resultCount` definitief verwerkte payloads voor tools, blokken en antwoorden in de wachtrij. Voor
uitgaande rijen omvat `durationMs` het leveringsbeheer tot en met bevestiging,
dead-letterverwerking of reconciliatie (inclusief wachttijd in de wachtrij), en telt `resultCount`
geïdentificeerde fysieke verzendingen via het platform. `deliveryKind` beschrijft, indien aanwezig,
de effectieve payload na hooks en rendering; onderdrukte rijen of rijen met een
door een crash veroorzaakte onduidelijke status laten dit weg.

De huidige berichtdekking omvat geaccepteerde inkomende berichten die de
kerndispatch bereiken, inclusief uitkomsten voor duplicaten/eindstatussen van de kern. Voor uitgaande dekking wordt
één eindrij geschreven per oorspronkelijke logische antwoordpayload die de gedeelde duurzame
levering bereikt; opsplitsing en adapterfan-out worden samengevoegd in `resultCount`. In de wachtrij geplaatste
opnieuw te proberen of onduidelijke verzendingen worden pas vastgelegd na bevestiging,
dead-letterverwerking of reconciliatie. Plugin-lokale en directe verzendpaden die deze
gedeelde grenzen omzeilen, vallen nog niet onder de dekking. De begrensde workerwachtrij werkt op basis van beste inspanning
en kan records laten vallen bij storingen of verzadiging, waardoor dit oppervlak geen
verliesvrij compliance-archief is.

Registratie staat standaard aan en wordt beheerd via
[`audit.enabled`](/nl/gateway/configuration-reference#audit). Berichtregistratie wordt
afzonderlijk beheerd door `audit.messages` en is standaard `"off"`. Wanneer
registratie is uitgeschakeld, blijft `audit.activity.list` eerder geschreven records aanbieden
totdat ze verlopen.

De uitgebrachte schema's voor het `audit.list`-verzoek, resultaat en `AuditEvent`
blijven ongewijzigd en retourneren alleen records van agentuitvoeringen en toolacties. Nieuwe operatorclients
moeten `audit.activity.list` aanroepen wanneer de Gateway dit adverteert. Oudere
Gateways kunnen bij een verzoek met leesbereik `unknown method: audit.activity.list` melden, of
`missing scope:
operator.admin` omdat autorisatie in uitgebrachte versies vóór het opzoeken van de methode plaatsvond. Behandel dat laatste
alleen als het ontbreken van de methode wanneer de methode niet werd geadverteerd. Een client kan vervolgens alleen `audit.list`
opnieuw proberen wanneer de filters geen ondersteuning voor berichttype, richting of kanaal
vereisen.

Gebruik [`openclaw audit`](/nl/cli/audit) voor tekstquery's en begrensde JSON-exports.

## RPC's voor het taakgrootboek

Operatorclients inspecteren en annuleren records van gateway-achtergrondtaken via
de RPC's voor het taakgrootboek (`packages/gateway-protocol/src/schema/tasks.ts`). Deze
retourneren opgeschoonde taaksamenvattingen, geen onbewerkte runtimestatus.

- `tasks.list` vereist `operator.read`.
  - Parameters: optioneel `status` (`"queued"`, `"running"`, `"completed"`,
    `"failed"`, `"cancelled"` of `"timed_out"`) of een array van die statussen,
    optioneel `agentId`, optioneel `sessionKey`, optioneel `limit` van `1` tot
    `500` en optionele tekenreeks `cursor`.
  - Resultaat: `{ "tasks": TaskSummary[], "nextCursor"?: string }`.
- `tasks.get` vereist `operator.read`.
  - Parameters: `{ "taskId": string }`.
  - Resultaat: `{ "task": TaskSummary }`.
  - Ontbrekende taak-id's retourneren de niet-gevonden-foutstructuur van de gateway.
- `tasks.cancel` vereist `operator.write`.
  - Parameters: `{ "taskId": string, "reason"?: string }`.
  - Resultaat: `{ "found": boolean, "cancelled": boolean, "reason"?: string, "task"?: TaskSummary }`.
  - `found` meldt of het grootboek een overeenkomende taak bevatte. `cancelled`
    meldt of de runtime de annulering heeft geaccepteerd of vastgelegd.

`TaskSummary` bevat `id`, `status` en optionele metadata: `kind`,
`runtime`, `title`, `agentId`, `sessionKey`, `childSessionKey`, `ownerKey`,
`runId`, `taskId`, `flowId`, `parentTaskId`, `sourceId`, tijdstempels, voortgang,
eindsamenvatting en opgeschoonde fouttekst. `agentId` identificeert de agent
die de taak uitvoert; `sessionKey` en `ownerKey` behouden de context van de aanvrager en besturing.

## Hulpmethoden voor operators

- `commands.list` (`operator.read`) haalt de runtime-opdrachtinventaris voor
  een agent op.
  - `agentId` is optioneel; laat dit weg om de standaardwerkruimte van de agent te lezen.
  - `scope` bepaalt op welk oppervlak de primaire `name` is gericht: `text` retourneert
    het primaire tekstopdrachttoken zonder de voorafgaande `/`; `native` en het
    standaardpad `both` retourneren providerbewuste systeemeigen namen wanneer die beschikbaar zijn.
  - `textAliases` bevat exacte slash-aliassen zoals `/model` en `/m`.
  - `nativeName` bevat de providerbewuste systeemeigen opdrachtnaam wanneer die
    bestaat.
  - `provider` is optioneel en beïnvloedt alleen systeemeigen naamgeving en de beschikbaarheid van systeemeigen Plugin-
    opdrachten.
  - `includeArgs=false` laat geserialiseerde argumentmetadata weg uit het antwoord.
- `tools.catalog` (`operator.read`) haalt de runtime-toolcatalogus voor een
  agent op. Het antwoord bevat gegroepeerde tools en herkomstmetadata:
  - `source`: `core` of `plugin`
  - `pluginId`: Plugin-eigenaar wanneer `source="plugin"`
  - `optional`: of een Plugin-tool optioneel is
- `tools.effective` (`operator.read`) haalt de effectief in de runtime beschikbare toolinventaris
  voor een sessie op.
  - `sessionKey` is vereist.
  - De gateway leidt vertrouwde runtimecontext server-side af uit de sessie
    in plaats van door de aanroeper aangeleverde authenticatie- of leveringscontext te accepteren.
  - Het antwoord is een sessiegebonden, door de server afgeleide projectie van de actieve
    inventaris, inclusief kern-, Plugin-, kanaal- en reeds ontdekte MCP-
    servertools.
  - `tools.effective` is alleen-lezen voor MCP: het kan een warme MCP-catalogus van een sessie
    via het uiteindelijke toolbeleid projecteren, maar maakt geen MCP-runtimes,
    verbindt geen transports en geeft geen `tools/list` uit. Als er geen overeenkomende warme catalogus
    bestaat, kan het antwoord een melding bevatten zoals `mcp-not-yet-connected`,
    `mcp-not-yet-listed` of `mcp-stale-catalog`.
  - Effectieve toolvermeldingen gebruiken `source="core"`, `source="plugin"`,
    `source="channel"` of `source="mcp"`.
- `tools.invoke` (`operator.write`) roept één beschikbare tool aan via hetzelfde
  gatewaybeleidspad als `/tools/invoke`.
  - `name` is vereist. `args`, `sessionKey`, `agentId`, `confirm` en
    `idempotencyKey` zijn optioneel.
  - Als zowel `sessionKey` als `agentId` aanwezig zijn, moet de opgeloste sessieagent
    overeenkomen met `agentId`.
  - Alleen voor eigenaren bedoelde kernwrappers zoals `cron`, `gateway` en `nodes` vereisen
    een eigenaar-/beheerdersidentiteit (`operator.admin`), hoewel `tools.invoke` zelf
    `operator.write` is.
  - Het antwoord is een op de SDK gerichte envelop met `ok`, `toolName`, optioneel
    `output` en getypeerde `error`-velden. Weigeringen wegens goedkeuring of beleid retourneren
    `ok:false` in de payload in plaats van de toolbeleidspijplijn van de gateway te
    omzeilen.
- `skills.status` (`operator.read`) haalt de zichtbare Skills-inventaris voor een
  agent op.
  - `agentId` is optioneel; laat dit weg om de standaardwerkruimte van de agent te lezen.
  - Het antwoord bevat geschiktheid, ontbrekende vereisten, configuratiecontroles
    en opgeschoonde installatieopties zonder onbewerkte geheime waarden bloot te stellen.
- `skills.search` en `skills.detail` (`operator.read`) retourneren ClawHub-
  detectiemetadata.
- `skills.upload.begin`, `skills.upload.chunk` en `skills.upload.commit`
  (`operator.admin`) zetten een privéarchief met een Skill klaar voordat het wordt geïnstalleerd. Dit
  is een afzonderlijk uploadpad voor beheerders en vertrouwde clients, niet de normale ClawHub-
  installatiestroom voor Skills, en is standaard uitgeschakeld tenzij
  `skills.install.allowUploadedArchives` is ingeschakeld.
  - `skills.upload.begin({ kind: "skill-archive", slug, sizeBytes, sha256?, force?, idempotencyKey? })`
    maakt een upload die aan die slug en force-waarde is gekoppeld.
  - `skills.upload.chunk({ uploadId, offset, dataBase64 })` voegt bytes toe op
    de exacte gedecodeerde offset.
  - `skills.upload.commit({ uploadId, sha256? })` verifieert de uiteindelijke grootte en
    SHA-256. Commit rondt alleen de upload af; de Skill wordt niet geïnstalleerd.
  - Geüploade Skill-archieven zijn ziparchieven die een `SKILL.md`-hoofdmap bevatten. De
    interne mapnaam van het archief bepaalt nooit het installatiedoel.
- `skills.install` (`operator.admin`) heeft drie modi:
  - ClawHub-modus: `{ source: "clawhub", slug, version?, force? }` installeert een
    Skill-map in de map `skills/` van de standaardwerkruimte van de agent.
  - Uploadmodus: `{ source: "upload", uploadId, slug, force?, sha256?, timeoutMs? }`
    installeert een vastgelegde upload in de map `skills/<slug>` van de
    standaardwerkruimte van de agent. De slug en force-waarde moeten overeenkomen met het
    oorspronkelijke `skills.upload.begin`-verzoek. Wordt geweigerd tenzij
    `skills.install.allowUploadedArchives` is ingeschakeld; de instelling heeft geen
    invloed op ClawHub-installaties.
  - Gateway-installatiemodus: `{ name, installId, timeoutMs? }` voert een gedeclareerde
    `metadata.openclaw.install`-actie uit op de gatewayhost. Oudere clients kunnen
    nog steeds `dangerouslyForceUnsafeInstall` verzenden; dit veld is verouderd,
    wordt alleen geaccepteerd voor protocolcompatibiliteit en wordt genegeerd. Gebruik
    `security.installPolicy` voor installatiebeslissingen die door de operator worden beheerd.
- `skills.update` (`operator.admin`) heeft twee modi:
  - De ClawHub-modus werkt één bijgehouden slug of alle bijgehouden ClawHub-installaties in
    de standaardwerkruimte van de agent bij.
  - De configuratiemodus past `skills.entries.<skillKey>`-waarden aan, zoals `enabled`,
    `apiKey` en `env`.

### `models.list`-weergaven

`models.list` accepteert een optionele parameter `view`
(`src/agents/model-catalog-visibility.ts`):

- Weggelaten of `"default"`: als `agents.defaults.models` is geconfigureerd, is het
  antwoord de toegestane catalogus, inclusief dynamisch ontdekte modellen
  voor `provider/*`-vermeldingen. Anders is het antwoord de volledige Gateway-
  catalogus.
- `"configured"`: gedrag afgestemd op de keuzelijst. Als `agents.defaults.models` is
  geconfigureerd, heeft dit nog steeds voorrang, inclusief providergebonden detectie voor
  `provider/*`-vermeldingen. Zonder toelatingslijst gebruikt het antwoord expliciete
  `models.providers.<provider>.models`-vermeldingen en valt het alleen terug op de volledige
  catalogus als er geen geconfigureerde modelrijen bestaan.
- `"provider-config"`: door de bron samengestelde `models.providers.*.models`-inventaris,
  onafhankelijk van toelatingslijsten voor keuzelijsten. Rijen bevatten openbare modelmogelijkheden en
  routebewuste beschikbaarheid, maar laten providereindpunten, authenticatiemateriaal en
  configuratie van runtimeverzoeken weg.
- `"all"`: volledige Gateway-catalogus, waarbij `agents.defaults.models` wordt omzeild. Gebruik dit voor
  diagnostische/detectie-interfaces, niet voor normale modelkeuzelijsten.

## Uitvoeringsgoedkeuringen

- Wanneer een uitvoeringsverzoek goedkeuring vereist, zendt de Gateway
  `exec.approval.requested` uit.
- Operatorclients handelen dit af door `exec.approval.resolve` aan te roepen (vereist
  `operator.approvals`).
- Voor `host=node` moet `exec.approval.request` `systemRunPlan` bevatten
  (canonieke `argv`/`cwd`/`rawCommand`/sessiemetadata). Verzoeken zonder
  `systemRunPlan` worden geweigerd.
- Na goedkeuring hergebruiken doorgestuurde `node.invoke system.run`-aanroepen die
  canonieke `systemRunPlan` als de gezaghebbende opdracht-/cwd-/sessiecontext.
- Als een aanroeper `command`, `rawCommand`, `cwd`, `agentId` of
  `sessionKey` wijzigt tussen de voorbereiding en het uiteindelijk goedgekeurde doorsturen van `system.run`,
  weigert de Gateway de uitvoering in plaats van de gewijzigde payload te vertrouwen.

## Terugval voor agentlevering

- `agent`-verzoeken kunnen `deliver=true` bevatten om uitgaande levering aan te vragen.
- `bestEffortDeliver=false` (de standaardwaarde) handhaaft strikt gedrag: onopgeloste of
  uitsluitend interne leveringsdoelen retourneren `INVALID_REQUEST`.
- `bestEffortDeliver=true` staat terugval naar uitvoering uitsluitend binnen de sessie toe wanneer geen
  externe leverbare route kan worden bepaald (bijvoorbeeld interne/webchat-
  sessies of dubbelzinnige configuraties met meerdere kanalen).
- Definitieve `agent`-resultaten kunnen `result.deliveryStatus` bevatten wanneer levering is
  aangevraagd, met dezelfde statussen `sent`, `suppressed`, `partial_failed` en
  `failed` die zijn gedocumenteerd voor
  [`openclaw agent --json --deliver`](/nl/cli/agent#json-delivery-status).

## Versiebeheer

- `PROTOCOL_VERSION`, `MIN_CLIENT_PROTOCOL_VERSION`,
  `MIN_NODE_PROTOCOL_VERSION` en `MIN_PROBE_PROTOCOL_VERSION` bevinden zich in
  `packages/gateway-protocol/src/version.ts`.
- Clients verzenden `minProtocol` + `maxProtocol`. Operator- en UI-clients moeten
  het huidige protocol binnen dat bereik opnemen; huidige clients en servers gebruiken
  protocol v4.
- Geverifieerde clients met zowel `role: "node"` als `client.mode: "node"`
  mogen het N-1-Node-protocol gebruiken (momenteel v3). Lichtgewicht herstartcontroles gebruiken
  hetzelfde N-1-venster. Apparaatauthenticatie, koppeling, scopes, opdrachtbeleid en uitvoerings-
  goedkeuringen blijven ongewijzigd door dit compatibiliteitsvenster. Door Plugins beheerde Node-
  mogelijkheden en opdrachten worden niet beschikbaar gesteld totdat de Node naar het huidige
  protocol is bijgewerkt, omdat hun gehoste oppervlakken geen deel uitmaken van het N-1-contract.
- Schema's en modellen worden gegenereerd vanuit TypeBox-definities:
  - `pnpm protocol:gen`
  - `pnpm protocol:gen:swift`
  - `pnpm protocol:check`

### Clientconstanten

De referentie-implementatie van de client bevindt zich in `packages/gateway-client/src/`
(OpenClaw omhult deze via de dunne `src/gateway/client.ts`-façade). Deze
standaardwaarden zijn stabiel binnen protocol v4 en vormen de verwachte basis voor
clients van derden.

| Constante                                 | Standaardwaarde                                       | Bron                                                                                                                      |
| ----------------------------------------- | ----------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------- |
| `PROTOCOL_VERSION`                        | `4`                                                   | `packages/gateway-protocol/src/version.ts`                                                                                |
| `MIN_CLIENT_PROTOCOL_VERSION`             | `4`                                                   | `packages/gateway-protocol/src/version.ts`                                                                                |
| `MIN_NODE_PROTOCOL_VERSION`               | `3`                                                   | `packages/gateway-protocol/src/version.ts`                                                                                |
| `MIN_PROBE_PROTOCOL_VERSION`              | `3`                                                   | `packages/gateway-protocol/src/version.ts`                                                                                |
| Time-out voor verzoeken (per RPC)         | `30_000` ms                                           | `packages/gateway-client/src/client.ts` (`requestTimeoutMs`)                                                              |
| Time-out voor preauth/verbindingsuitdaging | `15_000` ms                                           | `packages/gateway-client/src/timeouts.ts` (de omgevingsvariabele `OPENCLAW_HANDSHAKE_TIMEOUT_MS` kan het budget van de gekoppelde server/client verhogen) |
| Initiële wachttijd voor opnieuw verbinden | `1_000` ms                                            | `packages/gateway-client/src/client.ts` (`GATEWAY_RECONNECT_POLICY`)                                                      |
| Maximale wachttijd voor opnieuw verbinden | `30_000` ms                                           | `packages/gateway-client/src/client.ts` (`GATEWAY_RECONNECT_POLICY`)                                                      |
| Begrenzing voor snelle nieuwe poging na sluiting vanwege apparaattoken | `250` ms                                              | `packages/gateway-client/src/client.ts`                                                                                   |
| Respijtperiode voor geforceerd stoppen vóór `terminate()` | `250` ms                                              | `FORCE_STOP_TERMINATE_GRACE_MS`                                                                                           |
| Standaardtime-out van `stopAndWait()`  | `1_000` ms                                            | `STOP_AND_WAIT_TIMEOUT_MS`                                                                                                |
| Standaard tick-interval (vóór `hello-ok`) | `30_000` ms                                           | `packages/gateway-client/src/client.ts`                                                                                   |
| Sluiting bij tick-time-out                | code `4000` wanneer de stilte `tickIntervalMs * 2` overschrijdt | `packages/gateway-client/src/client.ts`                                                                                   |
| `MAX_PAYLOAD_BYTES`                        | `25 * 1024 * 1024` (25 MB)                            | `src/gateway/server-constants.ts`                                                                                         |

De server kondigt de effectieve waarden voor `policy.tickIntervalMs`,
`policy.maxPayload` en `policy.maxBufferedBytes` aan in `hello-ok`; clients
moeten die waarden respecteren in plaats van de standaardwaarden van vóór de handshake.

De referentieclient laat eindige verzoeken hun geconfigureerde deadline beheren wanneer
elk wachtend verzoek er een heeft. Een `expectFinal`-verzoek zonder een eindige
`timeoutMs`, elk verzoek met `timeoutMs: null`, of een combinatie van eindige en
onbegrensde verzoeken houdt de tick-watchdog actief. Als binnenkomende gebeurtenissen en
antwoorden langer stil blijven dan de drempel voor de tick-time-out, sluit de client de
socket met code `4000`, wijst elk wachtend verzoek af en maakt opnieuw verbinding. De client
speelt afgewezen verzoeken niet opnieuw af nadat opnieuw verbinding is gemaakt.

## Authenticatie

- Gateway-authenticatie met een gedeeld geheim gebruikt `connect.params.auth.token` of
  `connect.params.auth.password`, afhankelijk van de geconfigureerde
  `gateway.auth.mode` (`"none" | "token" | "password" | "trusted-proxy"`).
- Modi met identiteitsgegevens, zoals Tailscale Serve (`gateway.auth.allowTailscale: true`)
  of niet-loopback `gateway.auth.mode: "trusted-proxy"`, voldoen via aanvraagheaders aan de
  authenticatiecontrole voor verbindingen in plaats van via `connect.params.auth.*`.
- Private-ingress `gateway.auth.mode: "none"` slaat authenticatie met een gedeeld geheim
  voor verbindingen volledig over; stel deze modus niet beschikbaar op openbare/niet-vertrouwde ingress.
- Na het koppelen geeft de Gateway een apparaattoken uit dat is beperkt tot de
  verbindingsrol + bereiken en wordt geretourneerd in `hello-ok.auth.deviceToken`. Clients moeten
  dit na elke geslaagde verbinding permanent opslaan.
- Bij opnieuw verbinden met dat opgeslagen apparaattoken moet ook de opgeslagen
  goedgekeurde bereikenset voor dat token worden hergebruikt. Zo blijft reeds verleende
  lees-/probe-/statustoegang behouden en wordt voorkomen dat opnieuw verbinden ongemerkt
  wordt beperkt tot een nauwer impliciet bereik dat alleen voor beheerders geldt.
- Samenstelling van verbindingsauthenticatie aan de clientzijde (`selectConnectAuth` in
  `packages/gateway-client/src/client.ts`):
  - `auth.password` staat hier los van en wordt altijd doorgestuurd wanneer deze is ingesteld.
  - `auth.token` wordt in deze prioriteitsvolgorde ingevuld: eerst een expliciet gedeeld token,
    vervolgens een expliciete `deviceToken`, en daarna een opgeslagen apparaatspecifiek token (op basis van
    `deviceId` + `role`).
  - `auth.bootstrapToken` wordt alleen verzonden wanneer geen van de bovenstaande opties
    `auth.token` heeft opgeleverd. Een gedeeld token of een gevonden apparaattoken onderdrukt dit.
  - Automatische promotie van een opgeslagen apparaattoken bij de eenmalige
    `AUTH_TOKEN_MISMATCH`-poging is uitsluitend toegestaan voor vertrouwde eindpunten: loopback,
    of `wss://` met een vastgezette `tlsFingerprint`. Openbare `wss://` zonder vastzetting
    komt niet in aanmerking.
- De ingebouwde bootstrap met installatiecode retourneert de primaire Node
  `hello-ok.auth.deviceToken` plus een begrensd operatortoken in
  `hello-ok.auth.deviceTokens` voor vertrouwde overdracht naar mobiele apparaten. Het operatortoken
  bevat `operator.talk.secrets` voor het lezen van native Talk-configuratie, maar
  sluit bereiken voor koppelingsmutaties en `operator.admin` uit.
- Terwijl een bootstrap met een niet-standaard installatiecode op goedkeuring wacht,
  bevatten de details van `PAIRING_REQUIRED` `recommendedNextStep: "wait_then_retry"`,
  `retryable: true` en `pauseReconnect: false`. Blijf opnieuw verbinding maken met
  hetzelfde bootstraptoken totdat de aanvraag is goedgekeurd of het token
  ongeldig wordt.
- Sla `hello-ok.auth.deviceTokens` alleen permanent op wanneer voor de verbinding bootstrap-
  authenticatie is gebruikt via een vertrouwd transport, zoals `wss://` of lokale/loopback-koppeling.
- Als een client een expliciete `deviceToken` of expliciete `scopes` opgeeft,
  blijft de door de aanroeper aangevraagde bereikenset leidend; bereiken uit de cache worden
  alleen hergebruikt wanneer de client het opgeslagen apparaatspecifieke token hergebruikt.
- Apparaattokens kunnen worden geroteerd/ingetrokken via `device.token.rotate` en
  `device.token.revoke` (vereist `operator.pairing`). Voor het roteren of intrekken van een
  Node of andere niet-operatorrol is ook `operator.admin` vereist.
- `device.token.rotate` retourneert rotatiemetadata. Het vervangende
  bearer-token wordt alleen teruggestuurd voor aanroepen vanaf hetzelfde apparaat die al
  met dat apparaattoken zijn geauthenticeerd, zodat clients die uitsluitend tokens gebruiken
  hun vervangende token vóór het opnieuw verbinden permanent kunnen opslaan.
  Rotaties met een gedeeld token of beheerderstoken sturen het bearer-token niet terug.
- Uitgifte, rotatie en intrekking van tokens blijven beperkt tot de goedgekeurde
  rollenset die in de koppelingsvermelding van dat apparaat is vastgelegd; tokenmutatie kan
  geen apparaatrol uitbreiden of als doel kiezen die nooit via koppelingsgoedkeuring is verleend.
- Voor tokensessies van gekoppelde apparaten is apparaatbeheer tot het eigen apparaat
  beperkt, tenzij de aanroeper ook `operator.admin` heeft: aanroepers zonder beheerdersrechten
  kunnen alleen het operatortoken voor hun eigen apparaatvermelding beheren. Beheer van tokens voor
  een Node en andere niet-operatorrollen is uitsluitend voor beheerders, zelfs voor het eigen apparaat
  van de aanroeper.
- `device.token.rotate` en `device.token.revoke` controleren ook de bereikenset van het
  beoogde operatortoken aan de hand van de huidige sessiebereiken van de aanroeper.
  Aanroepers zonder beheerdersrechten kunnen geen operatortoken roteren of intrekken met
  ruimere bereiken dan waarover ze zelf al beschikken.
- Authenticatiefouten bevatten `error.details.code` plus aanwijzingen voor herstel:
  - `error.details.canRetryWithDeviceToken` (booleaans)
  - `error.details.recommendedNextStep`: een van `retry_with_device_token`,
    `update_auth_configuration`, `update_auth_credentials`,
    `wait_then_retry`, `review_auth_configuration`
    (`packages/gateway-protocol/src/connect-error-details.ts`).
- Clientgedrag voor `AUTH_TOKEN_MISMATCH`:
  - Vertrouwde clients mogen één begrensde nieuwe poging doen met een apparaatspecifiek token
    uit de cache.
  - Als die nieuwe poging mislukt, moeten automatische lussen voor opnieuw verbinden worden gestopt
    en moeten instructies voor actie door de operator worden getoond.
- `AUTH_SCOPE_MISMATCH` betekent dat het apparaattoken is herkend, maar niet
  de aangevraagde rol/bereiken dekt. Presenteer dit niet als een ongeldig token; vraag
  de operator om opnieuw te koppelen of het nauwere/ruimere bereikcontract goed te keuren.

## Apparaatidentiteit en koppeling

- Nodes moeten een stabiele apparaatidentiteit (`device.id`) bevatten die is afgeleid van een
  vingerafdruk van een sleutelpaar.
- Gateways geven tokens uit per apparaat + rol.
- Koppelingsgoedkeuringen zijn vereist voor nieuwe apparaat-ID's, tenzij lokale
  automatische goedkeuring is ingeschakeld.
- Automatische koppelingsgoedkeuring is gericht op directe lokale loopback-verbindingen.
- OpenClaw heeft ook een beperkt lokaal zelfverbindingspad voor backends/containers
  voor vertrouwde helperstromen met een gedeeld geheim.
- Tailnet- of LAN-verbindingen op dezelfde host worden voor koppeling nog steeds als extern
  behandeld en vereisen goedkeuring.
- WS-clients nemen normaal gesproken de identiteit `device` op tijdens `connect` (operator +
  Node). De enige uitzonderingen voor operators zonder apparaat zijn expliciete vertrouwenspaden:
  - `gateway.controlUi.allowInsecureAuth=true` voor onveilige HTTP-compatibiliteit die
    uitsluitend voor localhost geldt.
  - geslaagde `gateway.auth.mode: "trusted-proxy"`-operatorauthenticatie voor de Control UI.
  - `gateway.controlUi.dangerouslyDisableDeviceAuth=true` (noodvoorziening, ernstige
    beveiligingsverslechtering).
  - directe loopback-`gateway-client`-backend-RPC's via het gereserveerde interne
    helperpad.
- Het weglaten van de apparaatidentiteit heeft gevolgen voor de bereiken. Wanneer een operatorverbinding
  zonder apparaat via een expliciet vertrouwenspad wordt toegestaan, wist OpenClaw
  nog steeds zelf opgegeven bereiken tot een lege set, tenzij dat pad een benoemde
  uitzondering voor behoud van bereiken heeft. Methoden waarvoor bereiken vereist zijn, mislukken vervolgens met
  `missing scope`.
- `gateway.controlUi.dangerouslyDisableDeviceAuth=true` is een noodpad van de Control UI
  voor behoud van bereiken. Het kent geen bereiken toe aan willekeurige aangepaste
  backend- of CLI-achtige WebSocket-clients.
- Het gereserveerde directe loopback-`gateway-client`-pad voor backendhelpers behoudt
  bereiken alleen voor interne lokale RPC's van het besturingsvlak; aangepaste backend-ID's
  krijgen deze uitzondering niet.
- Alle verbindingen moeten de door de server verstrekte nonce `connect.challenge` ondertekenen.

### Migratiediagnostiek voor apparaatauthenticatie

Voor verouderde clients die nog ondertekeningsgedrag van vóór de challenge gebruiken, retourneert `connect`
de detailcodes `DEVICE_AUTH_*` onder `error.details.code` met een stabiele
`error.details.reason`.

Veelvoorkomende migratiefouten:

| Bericht                     | details.code                     | details.reason           | Betekenis                                          |
| --------------------------- | -------------------------------- | ------------------------ | -------------------------------------------------- |
| `device nonce required`     | `DEVICE_AUTH_NONCE_REQUIRED`     | `device-nonce-missing`   | Client heeft `device.nonce` weggelaten (of leeg verzonden). |
| `device nonce mismatch`     | `DEVICE_AUTH_NONCE_MISMATCH`     | `device-nonce-mismatch`  | Client heeft ondertekend met een verouderde/verkeerde nonce. |
| `device signature invalid`  | `DEVICE_AUTH_SIGNATURE_INVALID`  | `device-signature`       | De ondertekeningspayload komt niet overeen met de v2-payload. |
| `device signature expired`  | `DEVICE_AUTH_SIGNATURE_EXPIRED`  | `device-signature-stale` | Het ondertekende tijdstempel valt buiten de toegestane afwijking. |
| `device identity mismatch`  | `DEVICE_AUTH_DEVICE_ID_MISMATCH` | `device-id-mismatch`     | `device.id` komt niet overeen met de vingerafdruk van de openbare sleutel. |
| `device public key invalid` | `DEVICE_AUTH_PUBLIC_KEY_INVALID` | `device-public-key`      | De indeling/canonicalisatie van de openbare sleutel is mislukt. |

Migratiedoel:

- Wacht altijd op `connect.challenge`.
- Onderteken de v2-payload die de servernonce bevat.
- Verzend dezelfde nonce in `connect.params.device.nonce`.
- De voorkeurspayload voor ondertekening is `v3`
  (`buildDeviceAuthPayloadV3` in `packages/gateway-client/src/device-auth.ts`),
  die naast de velden voor apparaat/client/rol/bereiken/token/nonce ook
  `platform` en `deviceFamily` bindt.
- Verouderde `v2`-ondertekeningen blijven voor compatibiliteit geaccepteerd, maar het vastzetten van
  metadata voor gekoppelde apparaten blijft het commandobeleid bij opnieuw verbinden bepalen.

## TLS en vastzetten

- TLS wordt ondersteund voor WS-verbindingen (`gateway.tls`-configuratie).
- Clients kunnen optioneel de vingerafdruk van het Gateway-certificaat vastzetten via
  `gateway.remote.tlsFingerprint` of CLI `--tls-fingerprint`.

## Bereik

Dit protocol stelt de volledige Gateway-API beschikbaar: status, kanalen, modellen, chat,
agent, sessies, Nodes, goedkeuringen en meer. Het exacte oppervlak wordt bepaald door
de TypeBox-schema's die opnieuw worden geëxporteerd vanuit `packages/gateway-protocol/src/schema.ts`.

## Gerelateerd

- [Bridge-protocol](/nl/gateway/bridge-protocol)
- [Gateway-draaiboek](/nl/gateway)
