---
read_when:
    - Gateway-WS-clients implementeren of bijwerken
    - Protocolverschillen of verbindingsfouten debuggen
    - Protocolschema/modellen opnieuw genereren
summary: 'Gateway WebSocket-protocol: handshake, frames, versionering'
title: Gateway-protocol
x-i18n:
    generated_at: "2026-05-03T21:32:49Z"
    model: gpt-5.5
    provider: openai
    source_hash: 238706fcecd8ca96394402714cde5b01fb296de8e7b5a5867b1b3cf5b7940689
    source_path: gateway/protocol.md
    workflow: 16
---

Het Gateway WS-protocol is het **enkele control plane + node-transport** voor
OpenClaw. Alle clients (CLI, web-UI, macOS-app, iOS/Android-nodes, headless
nodes) verbinden via WebSocket en declareren hun **rol** + **scope** tijdens
de handshake.

## Transport

- WebSocket, tekstframes met JSON-payloads.
- Het eerste frame **moet** een `connect`-request zijn.
- Pre-connect-frames zijn begrensd op 64 KiB. Na een succesvolle handshake moeten clients
  de limieten `hello-ok.policy.maxPayload` en
  `hello-ok.policy.maxBufferedBytes` volgen. Met diagnostiek ingeschakeld
  zenden te grote inkomende frames en trage uitgaande buffers `payload.large`-events
  voordat de Gateway het betrokken frame sluit of laat vallen. Deze events bewaren
  groottes, limieten, oppervlakken en veilige redencodes. Ze bewaren niet de berichtbody,
  bijlage-inhoud, ruwe framebody, tokens, cookies of geheime waarden.

## Handshake (connect)

Gateway → Client (pre-connect challenge):

```json
{
  "type": "event",
  "event": "connect.challenge",
  "payload": { "nonce": "…", "ts": 1737264000000 }
}
```

Client → Gateway:

```json
{
  "type": "req",
  "id": "…",
  "method": "connect",
  "params": {
    "minProtocol": 3,
    "maxProtocol": 3,
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

Gateway → Client:

```json
{
  "type": "res",
  "id": "…",
  "ok": true,
  "payload": {
    "type": "hello-ok",
    "protocol": 3,
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

Terwijl de Gateway nog startup-sidecars afrondt, kan het `connect`-request
een opnieuw te proberen `UNAVAILABLE`-fout retourneren met `details.reason` ingesteld op
`"startup-sidecars"` en `retryAfterMs`. Clients moeten die response opnieuw proberen
binnen hun totale verbindingsbudget in plaats van die als een terminale
handshakefout te tonen.

`server`, `features`, `snapshot` en `policy` zijn allemaal vereist door het schema
(`src/gateway/protocol/schema/frames.ts`). `auth` is ook vereist en rapporteert
de onderhandelde rol/scopes. `canvasHostUrl` is optioneel.

Wanneer er geen devicetoken wordt uitgegeven, rapporteert `hello-ok.auth` de onderhandelde
rechten zonder tokenvelden:

```json
{
  "auth": {
    "role": "operator",
    "scopes": ["operator.read", "operator.write"]
  }
}
```

Vertrouwde backendclients in hetzelfde proces (`client.id: "gateway-client"`,
`client.mode: "backend"`) mogen `device` weglaten op directe local loopback-verbindingen wanneer
ze authenticeren met het gedeelde gatewaytoken/wachtwoord. Dit pad is gereserveerd
voor interne control-plane-RPC's en voorkomt dat verouderde CLI/device-koppelingsbaselines
lokaal backendwerk blokkeren, zoals updates van subagentsessies. Externe clients,
clients met browser-origin, nodeclients en expliciete device-token/device-identity
clients gebruiken nog steeds de normale koppelings- en scope-upgradecontroles.

Wanneer er een devicetoken wordt uitgegeven, bevat `hello-ok` ook:

```json
{
  "auth": {
    "deviceToken": "…",
    "role": "operator",
    "scopes": ["operator.read", "operator.write"]
  }
}
```

Tijdens vertrouwde bootstrap-overdracht kan `hello-ok.auth` ook aanvullende
begrensde rolvermeldingen bevatten in `deviceTokens`:

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

Voor de ingebouwde node/operator-bootstrapflow blijft het primaire nodetoken
`scopes: []` en blijft elk overgedragen operatortoken begrensd tot de bootstrap
operator-allowlist (`operator.approvals`, `operator.read`,
`operator.talk.secrets`, `operator.write`). Bootstrap-scopecontroles blijven
rol-geprefixt: operatorvermeldingen voldoen alleen aan operatorrequests, en niet-operatorrollen
hebben nog steeds scopes nodig onder hun eigen rolprefix.

### Nodevoorbeeld

```json
{
  "type": "req",
  "id": "…",
  "method": "connect",
  "params": {
    "minProtocol": 3,
    "maxProtocol": 3,
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

## Framing

- **Request**: `{type:"req", id, method, params}`
- **Response**: `{type:"res", id, ok, payload|error}`
- **Event**: `{type:"event", event, payload, seq?, stateVersion?}`

Methoden met neveneffecten vereisen **idempotentiesleutels** (zie schema).

## Rollen + scopes

Voor het volledige operatorscopemodel, controles tijdens goedkeuring en semantiek
voor gedeelde geheimen, zie [Operatorscopes](/nl/gateway/operator-scopes).

### Rollen

- `operator` = control-planeclient (CLI/UI/automatisering).
- `node` = capability-host (camera/screen/canvas/system.run).

### Scopes (operator)

Veelvoorkomende scopes:

- `operator.read`
- `operator.write`
- `operator.admin`
- `operator.approvals`
- `operator.pairing`
- `operator.talk.secrets`

`talk.config` met `includeSecrets: true` vereist `operator.talk.secrets`
(of `operator.admin`).

Door Plugins geregistreerde Gateway-RPC-methoden kunnen hun eigen operatorscope aanvragen, maar
gereserveerde kern-adminprefixen (`config.*`, `exec.approvals.*`, `wizard.*`,
`update.*`) lossen altijd op naar `operator.admin`.

Methodescope is alleen de eerste poort. Sommige slash-commands die via
`chat.send` worden bereikt, passen daarbovenop strengere controles op commandniveau toe. Bijvoorbeeld: persistente
`/config set`- en `/config unset`-writes vereisen `operator.admin`.

`node.pair.approve` heeft ook een extra scopecontrole tijdens goedkeuring bovenop de
basismethodescope:

- requests zonder command: `operator.pairing`
- requests met non-exec nodecommands: `operator.pairing` + `operator.write`
- requests die `system.run`, `system.run.prepare` of `system.which` bevatten:
  `operator.pairing` + `operator.admin`

### Caps/commands/permissions (node)

Nodes declareren capability-claims tijdens connectie:

- `caps`: capabilitycategorieën op hoog niveau.
- `commands`: command-allowlist voor invoke.
- `permissions`: granulaire toggles (bijv. `screen.record`, `camera.capture`).

De Gateway behandelt deze als **claims** en handhaaft server-side allowlists.

## Presence

- `system-presence` retourneert vermeldingen met device-identiteit als sleutel.
- Presence-vermeldingen bevatten `deviceId`, `roles` en `scopes`, zodat UI's één rij per device kunnen tonen
  zelfs wanneer het verbindt als zowel **operator** als **node**.
- `node.list` bevat optionele velden `lastSeenAtMs` en `lastSeenReason`. Verbonden nodes rapporteren
  hun huidige verbindingstijd als `lastSeenAtMs` met reden `connect`; gekoppelde nodes kunnen ook
  duurzame achtergrond-presence rapporteren wanneer een vertrouwd node-event hun koppelingsmetadata bijwerkt.

### Node-achtergrond alive-event

Nodes mogen `node.event` aanroepen met `event: "node.presence.alive"` om vast te leggen dat een gekoppelde node
alive was tijdens een achtergrondwake zonder die als verbonden te markeren.

```json
{
  "event": "node.presence.alive",
  "payloadJSON": "{\"trigger\":\"silent_push\",\"sentAtMs\":1737264000000,\"displayName\":\"Peter's iPhone\",\"version\":\"2026.4.28\",\"platform\":\"iOS 18.4.0\",\"deviceFamily\":\"iPhone\",\"modelIdentifier\":\"iPhone17,1\",\"pushTransport\":\"relay\"}"
}
```

`trigger` is een gesloten enum: `background`, `silent_push`, `bg_app_refresh`,
`significant_location`, `manual` of `connect`. Onbekende triggerstrings worden door de Gateway
genormaliseerd naar `background` vóór persistentie. Het event is alleen duurzaam voor geauthenticeerde node
devicesessies; sessies zonder device of ongekoppelde sessies retourneren `handled: false`.

Succesvolle gateways retourneren een gestructureerd resultaat:

```json
{
  "ok": true,
  "event": "node.presence.alive",
  "handled": true,
  "reason": "persisted"
}
```

Oudere gateways kunnen nog steeds `{ "ok": true }` retourneren voor `node.event`; clients moeten dat behandelen als een
bevestigde RPC, niet als duurzame presence-persistentie.

## Scoping van broadcastevents

Door de server gepushte WebSocket-broadcastevents zijn scope-gated, zodat sessies met alleen pairing-scope of node-only sessies passief geen sessie-inhoud ontvangen.

- **Chat-, agent- en tool-result-frames** (inclusief gestreamde `agent`-events en tool call-resultaten) vereisen ten minste `operator.read`. Sessies zonder `operator.read` slaan deze frames volledig over.
- **Door Plugins gedefinieerde `plugin.*`-broadcasts** worden begrensd tot `operator.write` of `operator.admin`, afhankelijk van hoe de Plugin ze heeft geregistreerd.
- **Status- en transportevents** (`heartbeat`, `presence`, `tick`, connect/disconnect-levenscyclus, enz.) blijven onbeperkt, zodat transportgezondheid voor elke geauthenticeerde sessie zichtbaar blijft.
- **Onbekende broadcasteventfamilies** zijn standaard scope-gated (fail-closed), tenzij een geregistreerde handler ze expliciet versoepelt.

Elke clientverbinding houdt zijn eigen per-client-volgnummer bij, zodat broadcasts monotone ordening op die socket behouden, zelfs wanneer verschillende clients verschillende scope-gefilterde subsets van de eventstream zien.

## Veelvoorkomende RPC-methodefamilies

Het publieke WS-oppervlak is breder dan de handshake/auth-voorbeelden hierboven. Dit
is geen gegenereerde dump — `hello-ok.features.methods` is een conservatieve
discoverylijst opgebouwd uit `src/gateway/server-methods-list.ts` plus geladen
Plugin-/kanaalmethode-exports. Behandel het als featurediscovery, niet als een volledige
opsomming van `src/gateway/server-methods/*.ts`.

<AccordionGroup>
  <Accordion title="System and identity">
    - `health` retourneert de gecachete of vers geprobede gateway-healthsnapshot.
    - `diagnostics.stability` retourneert de recente begrensde diagnostische stabiliteitsrecorder. Deze bewaart operationele metadata zoals eventnamen, aantallen, bytegroottes, geheugenuitlezingen, queue-/sessiestatus, kanaal-/Pluginnamen en sessie-id's. Deze bewaart geen chattekst, webhookbody's, tooloutputs, ruwe request- of responsebody's, tokens, cookies of geheime waarden. Operator-leesscope is vereist.
    - `status` retourneert de Gateway-samenvatting in `/status`-stijl; gevoelige velden worden alleen opgenomen voor operatorclients met adminscope.
    - `gateway.identity.get` retourneert de Gateway-device-identiteit die wordt gebruikt door relay- en koppelingsflows.
    - `system-presence` retourneert de huidige presence-snapshot voor verbonden operator-/nodedevices.
    - `system-event` voegt een systeemevent toe en kan presencecontext bijwerken/broadcasten.
    - `last-heartbeat` retourneert het meest recente gepersisteerde Heartbeat-event.
    - `set-heartbeats` schakelt Heartbeat-verwerking op de Gateway in of uit.

  </Accordion>

  <Accordion title="Modellen en gebruik">
    - `models.list` retourneert de modelcatalogus die door de runtime is toegestaan. Geef `{ "view": "configured" }` door voor picker-grote geconfigureerde modellen (`agents.defaults.models` eerst, daarna `models.providers.*.models`), of `{ "view": "all" }` voor de volledige catalogus.
    - `usage.status` retourneert gebruiksvensters van providers/samenvattingen van resterend quotum.
    - `usage.cost` retourneert samengevoegde samenvattingen van kostengebruik voor een datumbereik.
    - `doctor.memory.status` retourneert gereedheid van vectorgeheugen / gecachete embeddings voor de actieve standaard-agentwerkruimte. Geef `{ "probe": true }` of `{ "deep": true }` alleen door wanneer de aanroeper expliciet een live ping naar de embeddingprovider wil.
    - `doctor.memory.remHarness` retourneert een begrensde, alleen-lezen REM-harnesspreview voor externe control-plane-clients. Deze kan werkruimtepaden, geheugensnippets, gerenderde gegronde markdown en deep promotion-kandidaten bevatten, dus aanroepers hebben `operator.read` nodig.
    - `sessions.usage` retourneert gebruikssamenvattingen per sessie.
    - `sessions.usage.timeseries` retourneert tijdreeksgebruik voor één sessie.
    - `sessions.usage.logs` retourneert gebruikslogvermeldingen voor één sessie.

  </Accordion>

  <Accordion title="Kanalen en aanmeldhelpers">
    - `channels.status` retourneert statusoverzichten van ingebouwde + gebundelde kanalen/plugins.
    - `channels.logout` meldt een specifiek kanaal/account af wanneer het kanaal afmelden ondersteunt.
    - `web.login.start` start een QR-/webaanmeldflow voor de huidige QR-geschikte webkanaalprovider.
    - `web.login.wait` wacht tot die QR-/webaanmeldflow is voltooid en start het kanaal bij succes.
    - `push.test` stuurt een test-APNs-push naar een geregistreerde iOS-Node.
    - `voicewake.get` retourneert de opgeslagen wake-word-triggers.
    - `voicewake.set` werkt wake-word-triggers bij en broadcast de wijziging.

  </Accordion>

  <Accordion title="Berichten en logs">
    - `send` is de directe RPC voor uitgaande aflevering voor kanaal-/account-/thread-gerichte verzendingen buiten de chatrunner.
    - `logs.tail` retourneert de geconfigureerde gateway-bestandslogtail met cursor-/limiet- en max-byte-instellingen.

  </Accordion>

  <Accordion title="Talk en TTS">
    - `talk.config` retourneert de effectieve Talk-configpayload; `includeSecrets` vereist `operator.talk.secrets` (of `operator.admin`).
    - `talk.mode` stelt de huidige Talk-modusstatus in/broadcast deze voor WebChat-/Control UI-clients.
    - `talk.speak` synthetiseert spraak via de actieve Talk-spraakprovider.
    - `tts.status` retourneert de ingeschakelde TTS-status, actieve provider, fallbackproviders en providerconfiguratiestatus.
    - `tts.providers` retourneert de zichtbare TTS-providerinventaris.
    - `tts.enable` en `tts.disable` schakelen de TTS-voorkeurenstatus om.
    - `tts.setProvider` werkt de voorkeurs-TTS-provider bij.
    - `tts.convert` voert een eenmalige tekst-naar-spraakconversie uit.

  </Accordion>

  <Accordion title="Geheimen, configuratie, update en wizard">
    - `secrets.reload` lost actieve SecretRefs opnieuw op en wisselt de runtime-geheimstatus alleen bij volledig succes.
    - `secrets.resolve` lost geheime toewijzingen voor opdracht-doelen op voor een specifieke opdracht-/doelenset.
    - `config.get` retourneert de huidige configuratiesnapshot en hash.
    - `config.set` schrijft een gevalideerde configuratiepayload.
    - `config.patch` voegt een gedeeltelijke configuratie-update samen.
    - `config.apply` valideert + vervangt de volledige configuratiepayload.
    - `config.schema` retourneert de live configuratieschemapayload die wordt gebruikt door Control UI en CLI-tooling: schema, `uiHints`, versie en generatiemetadata, inclusief plugin- + kanaalschemametadata wanneer de runtime deze kan laden. Het schema bevat veldmetadata voor `title` / `description`, afgeleid van dezelfde labels en helptekst die door de UI worden gebruikt, inclusief geneste object-, wildcard-, array-item- en `anyOf` / `oneOf` / `allOf`-compositietakken wanneer overeenkomende velddocumentatie bestaat.
    - `config.schema.lookup` retourneert een pad-gescopeerde lookuppayload voor één configuratiepad: genormaliseerd pad, een oppervlakkige schemaknoop, overeenkomende hint + `hintPath` en directe kindsamenvattingen voor UI-/CLI-drill-down. Lookupschemaknopen behouden de gebruikersgerichte docs en algemene validatievelden (`title`, `description`, `type`, `enum`, `const`, `format`, `pattern`, numerieke/string-/array-/objectgrenzen en vlaggen zoals `additionalProperties`, `deprecated`, `readOnly`, `writeOnly`). Kindsamenvattingen tonen `key`, genormaliseerd `path`, `type`, `required`, `hasChildren`, plus de overeenkomende `hint` / `hintPath`.
    - `update.run` voert de Gateway-updateflow uit en plant alleen een herstart wanneer de update zelf is geslaagd; aanroepers met een sessie kunnen `continuationMessage` opnemen zodat het opstarten één vervolgt beurt van de agent hervat via de herstart-continuation-wachtrij. Package-managerupdates forceren na de pakketwissel een niet-uitgestelde updateherstart zonder cooldown, zodat het oude Gateway-proces niet lazy blijft laden uit een vervangen `dist`-boom.
    - `update.status` retourneert de laatst gecachete update-herstartsentinel, inclusief de draaiende versie na de herstart wanneer beschikbaar.
    - `wizard.start`, `wizard.next`, `wizard.status` en `wizard.cancel` stellen de onboardingwizard beschikbaar via WS RPC.

  </Accordion>

  <Accordion title="Agent- en werkruimtehelpers">
    - `agents.list` retourneert geconfigureerde agentvermeldingen, inclusief effectief model en runtimemetadata.
    - `agents.create`, `agents.update` en `agents.delete` beheren agentrecords en werkruimtebedrading.
    - `agents.files.list`, `agents.files.get` en `agents.files.set` beheren de bootstrap-werkruimtebestanden die voor een agent worden blootgesteld.
    - `artifacts.list`, `artifacts.get` en `artifacts.download` stellen uit transcript afgeleide artifactsamenvattingen en downloads beschikbaar voor een expliciete `sessionKey`-, `runId`- of `taskId`-scope. Run- en taakquery's lossen de eigenaarssessie server-side op en retourneren alleen transcriptmedia met overeenkomende herkomst; onveilige of lokale URL-bronnen retourneren niet-ondersteunde downloads in plaats van server-side op te halen.
    - `agent.identity.get` retourneert de effectieve assistentidentiteit voor een agent of sessie.
    - `agent.wait` wacht tot een run is afgerond en retourneert de terminale snapshot wanneer beschikbaar.

  </Accordion>

  <Accordion title="Sessiebeheer">
    - `sessions.list` retourneert de huidige sessie-index, inclusief `agentRuntime`-metadata per rij wanneer een agent-runtimebackend is geconfigureerd.
    - `sessions.subscribe` en `sessions.unsubscribe` schakelen abonnementen op sessiewijzigingsgebeurtenissen om voor de huidige WS-client.
    - `sessions.messages.subscribe` en `sessions.messages.unsubscribe` schakelen abonnementen op transcript-/berichtgebeurtenissen om voor één sessie.
    - `sessions.preview` retourneert begrensde transcriptpreviews voor specifieke sessiesleutels.
    - `sessions.describe` retourneert één Gateway-sessierij voor een exacte sessiesleutel.
    - `sessions.resolve` lost een sessiedoel op of canoniseert het.
    - `sessions.create` maakt een nieuwe sessievermelding aan.
    - `sessions.send` stuurt een bericht naar een bestaande sessie.
    - `sessions.steer` is de onderbreek-en-stuur-variant voor een actieve sessie.
    - `sessions.abort` breekt actief werk voor een sessie af. Een aanroeper kan `key` plus optionele `runId` doorgeven, of alleen `runId` doorgeven voor actieve runs die de Gateway naar een sessie kan herleiden.
    - `sessions.patch` werkt sessiemetadata/-overrides bij en rapporteert het opgeloste canonieke model plus effectieve `agentRuntime`.
    - `sessions.reset`, `sessions.delete` en `sessions.compact` voeren sessieonderhoud uit.
    - `sessions.get` retourneert de volledige opgeslagen sessierij.
    - Chatuitvoering gebruikt nog steeds `chat.history`, `chat.send`, `chat.abort` en `chat.inject`. `chat.history` is display-genormaliseerd voor UI-clients: inline directivetags worden uit zichtbare tekst verwijderd, XML-payloads van toolaanroepen in platte tekst (inclusief `<tool_call>...</tool_call>`, `<function_call>...</function_call>`, `<tool_calls>...</tool_calls>`, `<function_calls>...</function_calls>` en afgekorte toolaanroepblokken) en gelekte ASCII-/full-width-modelcontroletokens worden verwijderd, pure silent-token-assistentrijen zoals exact `NO_REPLY` / `no_reply` worden weggelaten en te grote rijen kunnen worden vervangen door placeholders.

  </Accordion>

  <Accordion title="Apparaatkoppeling en apparaattokens">
    - `device.pair.list` retourneert wachtende en goedgekeurde gekoppelde apparaten.
    - `device.pair.approve`, `device.pair.reject` en `device.pair.remove` beheren apparaatkoppelingsrecords.
    - `device.token.rotate` roteert een token van een gekoppeld apparaat binnen de grenzen van de goedgekeurde rol en aanroeperscope.
    - `device.token.revoke` trekt een token van een gekoppeld apparaat in binnen de grenzen van de goedgekeurde rol en aanroeperscope.

  </Accordion>

  <Accordion title="Node-koppeling, invoke en wachtend werk">
    - `node.pair.request`, `node.pair.list`, `node.pair.approve`, `node.pair.reject`, `node.pair.remove` en `node.pair.verify` dekken Node-koppeling en bootstrapverificatie.
    - `node.list` en `node.describe` retourneren bekende/verbonden Node-status.
    - `node.rename` werkt een gekoppeld Node-label bij.
    - `node.invoke` stuurt een opdracht door naar een verbonden Node.
    - `node.invoke.result` retourneert het resultaat voor een invoke-aanvraag.
    - `node.event` draagt gebeurtenissen afkomstig van een Node terug naar de Gateway.
    - `node.canvas.capability.refresh` vernieuwt gescopeerde canvas-capabilitytokens.
    - `node.pending.pull` en `node.pending.ack` zijn de wachtrij-API's voor verbonden Nodes.
    - `node.pending.enqueue` en `node.pending.drain` beheren duurzaam wachtend werk voor offline/losgekoppelde Nodes.

  </Accordion>

  <Accordion title="Goedkeuringsfamilies">
    - `exec.approval.request`, `exec.approval.get`, `exec.approval.list` en `exec.approval.resolve` dekken eenmalige exec-goedkeuringsaanvragen plus lookup/replay van wachtende goedkeuringen.
    - `exec.approval.waitDecision` wacht op één wachtende exec-goedkeuring en retourneert de definitieve beslissing (of `null` bij timeout).
    - `exec.approvals.get` en `exec.approvals.set` beheren snapshots van het exec-goedkeuringsbeleid van de Gateway.
    - `exec.approvals.node.get` en `exec.approvals.node.set` beheren Node-lokaal exec-goedkeuringsbeleid via Node-relayopdrachten.
    - `plugin.approval.request`, `plugin.approval.list`, `plugin.approval.waitDecision` en `plugin.approval.resolve` dekken Plugin-gedefinieerde goedkeuringsflows.

  </Accordion>

  <Accordion title="Automatisering, Skills en tools">
    - Automatisering: `wake` plant een onmiddellijke of volgende-Heartbeat wake-tekstinjectie; `cron.list`, `cron.status`, `cron.add`, `cron.update`, `cron.remove`, `cron.run`, `cron.runs` beheren gepland werk.
    - Skills en tools: `commands.list`, `skills.*`, `tools.catalog`, `tools.effective`, `tools.invoke`.

  </Accordion>
</AccordionGroup>

### Algemene gebeurtenisfamilies

- `chat`: UI-chatupdates zoals `chat.inject` en andere chatgebeurtenissen
  die alleen transcript betreffen.
- `session.message` en `session.tool`: transcript-/eventstreamupdates voor een
  geabonneerde sessie.
- `sessions.changed`: sessie-index of metadata gewijzigd.
- `presence`: updates van systeemaanwezigheidssnapshots.
- `tick`: periodieke keepalive- / liveness-gebeurtenis.
- `health`: update van Gateway-gezondheidssnapshot.
- `heartbeat`: update van Heartbeat-gebeurtenisstream.
- `cron`: wijzigingsgebeurtenis voor Cron-run/-job.
- `shutdown`: melding van Gateway-afsluiting.
- `node.pair.requested` / `node.pair.resolved`: levenscyclus van Node-koppeling.
- `node.invoke.request`: broadcast van Node-invoke-aanvraag.
- `device.pair.requested` / `device.pair.resolved`: levenscyclus van gekoppeld apparaat.
- `voicewake.changed`: configuratie van wake-word-triggers gewijzigd.
- `exec.approval.requested` / `exec.approval.resolved`: exec-goedkeuringslevenscyclus.
- `plugin.approval.requested` / `plugin.approval.resolved`: levenscyclus van Plugin-goedkeuring.

### Node-helpermethoden

- Nodes kunnen `skills.bins` aanroepen om de huidige lijst met uitvoerbare Skill-bestanden
  voor auto-allow-controles op te halen.

### Operator-helpermethoden

- Operators mogen `commands.list` (`operator.read`) aanroepen om de runtime
  commando-inventaris voor een agent op te halen.
  - `agentId` is optioneel; laat dit weg om de standaardagentwerkruimte te lezen.
  - `scope` bepaalt op welk oppervlak de primaire `name` zich richt:
    - `text` retourneert het primaire tekstcommandotoken zonder de voorafgaande `/`
    - `native` en het standaardpad `both` retourneren providerebewuste native namen
      wanneer beschikbaar
  - `textAliases` bevat exacte slash-aliassen zoals `/model` en `/m`.
  - `nativeName` bevat de providerebewuste native commandonaam wanneer die bestaat.
  - `provider` is optioneel en heeft alleen invloed op native naamgeving plus de beschikbaarheid van native Plugin-commando's.
  - `includeArgs=false` laat geserialiseerde argumentmetadata weg uit de respons.
- Operators mogen `tools.catalog` (`operator.read`) aanroepen om de runtime-toolcatalogus voor een
  agent op te halen. De respons bevat gegroepeerde tools en herkomstmetadata:
  - `source`: `core` of `plugin`
  - `pluginId`: plugineigenaar wanneer `source="plugin"`
  - `optional`: of een plugintool optioneel is
- Operators mogen `tools.effective` (`operator.read`) aanroepen om de runtime-effectieve toolinventaris
  voor een sessie op te halen.
  - `sessionKey` is vereist.
  - De gateway leidt vertrouwde runtimecontext af van de sessie aan serverzijde in plaats van door de
    aanroeper geleverde authenticatie- of afleveringscontext te accepteren.
  - De respons is sessiegebonden en weerspiegelt wat het actieve gesprek nu kan gebruiken,
    inclusief core-, plugin- en kanaaltools.
- Operators mogen `tools.invoke` (`operator.write`) aanroepen om één beschikbare tool aan te roepen via hetzelfde
  gatewaybeleidspad als `/tools/invoke`.
  - `name` is vereist. `args`, `sessionKey`, `agentId`, `confirm` en
    `idempotencyKey` zijn optioneel.
  - Als zowel `sessionKey` als `agentId` aanwezig zijn, moet de opgeloste sessieagent overeenkomen met
    `agentId`.
  - De respons is een SDK-gerichte envelop met `ok`, `toolName`, optionele `output` en getypte
    `error`-velden. Goedkeuringen of beleidsweigeringen retourneren `ok:false` in de payload in plaats van
    de gateway-toolbeleidspijplijn te omzeilen.
- Operators mogen `skills.status` (`operator.read`) aanroepen om de zichtbare
  skillinventaris voor een agent op te halen.
  - `agentId` is optioneel; laat dit weg om de standaardagentwerkruimte te lezen.
  - De respons bevat geschiktheid, ontbrekende vereisten, configuratiecontroles en
    opgeschoonde installatieopties zonder ruwe geheime waarden bloot te geven.
- Operators mogen `skills.search` en `skills.detail` (`operator.read`) aanroepen voor
  ClawHub-detectiemetadata.
- Operators mogen `skills.install` (`operator.admin`) in twee modi aanroepen:
  - ClawHub-modus: `{ source: "clawhub", slug, version?, force? }` installeert een
    skillmap in de map `skills/` van de standaardagentwerkruimte.
  - Gateway-installatiemodus: `{ name, installId, dangerouslyForceUnsafeInstall?, timeoutMs? }`
    voert een gedeclareerde `metadata.openclaw.install`-actie uit op de gatewayhost.
- Operators mogen `skills.update` (`operator.admin`) in twee modi aanroepen:
  - ClawHub-modus werkt één gevolgde slug bij of alle gevolgde ClawHub-installaties in
    de standaardagentwerkruimte.
  - Configuratiemodus patcht `skills.entries.<skillKey>`-waarden zoals `enabled`,
    `apiKey` en `env`.

### `models.list`-weergaven

`models.list` accepteert een optionele parameter `view`:

- Weggelaten of `"default"`: huidig runtimegedrag. Als `agents.defaults.models` is geconfigureerd, is de respons de toegestane catalogus; anders is de respons de volledige Gateway-catalogus.
- `"configured"`: gedrag op picker-formaat. Als `agents.defaults.models` is geconfigureerd, blijft die nog steeds leidend. Anders gebruikt de respons expliciete `models.providers.*.models`-vermeldingen, met terugval naar de volledige catalogus alleen wanneer er geen geconfigureerde modelrijen bestaan.
- `"all"`: volledige Gateway-catalogus, waarbij `agents.defaults.models` wordt omzeild. Gebruik dit voor diagnose- en detectie-UI's, niet voor normale modelpickers.

## Exec-goedkeuringen

- Wanneer een exec-verzoek goedkeuring nodig heeft, broadcast de gateway `exec.approval.requested`.
- Operatorclients lossen dit op door `exec.approval.resolve` aan te roepen (vereist `operator.approvals`-scope).
- Voor `host=node` moet `exec.approval.request` `systemRunPlan` bevatten (canonieke `argv`/`cwd`/`rawCommand`/sessiemetadata). Verzoeken zonder `systemRunPlan` worden geweigerd.
- Na goedkeuring hergebruiken doorgestuurde `node.invoke system.run`-aanroepen dat canonieke
  `systemRunPlan` als de gezaghebbende commando-/cwd-/sessiecontext.
- Als een aanroeper `command`, `rawCommand`, `cwd`, `agentId` of
  `sessionKey` wijzigt tussen de voorbereiding en de definitieve goedgekeurde `system.run`-doorsturing, weigert de
  gateway de run in plaats van de gewijzigde payload te vertrouwen.

## Terugval voor agentaflevering

- `agent`-verzoeken kunnen `deliver=true` bevatten om uitgaande aflevering aan te vragen.
- `bestEffortDeliver=false` behoudt strikt gedrag: niet-opgeloste of alleen-interne afleveringsdoelen retourneren `INVALID_REQUEST`.
- `bestEffortDeliver=true` staat terugval naar sessiegebonden uitvoering toe wanneer er geen externe afleverbare route kan worden opgelost (bijvoorbeeld interne/webchatsessies of dubbelzinnige configuraties met meerdere kanalen).

## Versionering

- `PROTOCOL_VERSION` staat in `src/gateway/protocol/schema/protocol-schemas.ts`.
- Clients sturen `minProtocol` + `maxProtocol`; de server weigert mismatches.
- Schema's + modellen worden gegenereerd uit TypeBox-definities:
  - `pnpm protocol:gen`
  - `pnpm protocol:gen:swift`
  - `pnpm protocol:check`

### Clientconstanten

De referentieclient in `src/gateway/client.ts` gebruikt deze standaardwaarden. Waarden zijn
stabiel binnen protocol v3 en vormen de verwachte basislijn voor clients van derden.

| Constante                                 | Standaard                                             | Bron                                                                                       |
| ----------------------------------------- | ----------------------------------------------------- | ------------------------------------------------------------------------------------------ |
| `PROTOCOL_VERSION`                        | `3`                                                   | `src/gateway/protocol/schema/protocol-schemas.ts`                                          |
| Aanvraagtimeout (per RPC)                 | `30_000` ms                                           | `src/gateway/client.ts` (`requestTimeoutMs`)                                               |
| Preauth-/connect-challenge-timeout        | `15_000` ms                                           | `src/gateway/handshake-timeouts.ts` (config/env kan het gekoppelde server-/clientbudget verhogen) |
| Initiële reconnect-backoff                | `1_000` ms                                            | `src/gateway/client.ts` (`backoffMs`)                                                      |
| Maximale reconnect-backoff                | `30_000` ms                                           | `src/gateway/client.ts` (`scheduleReconnect`)                                              |
| Fast-retry-klem na sluiten met device-token | `250` ms                                            | `src/gateway/client.ts`                                                                    |
| Force-stop-respijt vóór `terminate()`     | `250` ms                                              | `FORCE_STOP_TERMINATE_GRACE_MS`                                                            |
| Standaardtimeout van `stopAndWait()`      | `1_000` ms                                            | `STOP_AND_WAIT_TIMEOUT_MS`                                                                 |
| Standaard tick-interval (vóór `hello-ok`) | `30_000` ms                                           | `src/gateway/client.ts`                                                                    |
| Sluiten bij tick-timeout                  | code `4000` wanneer stilte langer is dan `tickIntervalMs * 2` | `src/gateway/client.ts`                                                                    |
| `MAX_PAYLOAD_BYTES`                       | `25 * 1024 * 1024` (25 MB)                            | `src/gateway/server-constants.ts`                                                          |

De server adverteert de effectieve `policy.tickIntervalMs`, `policy.maxPayload`
en `policy.maxBufferedBytes` in `hello-ok`; clients moeten die waarden respecteren
in plaats van de standaardwaarden van vóór de handshake.

## Auth

- Gateway-authenticatie met gedeeld geheim gebruikt `connect.params.auth.token` of
  `connect.params.auth.password`, afhankelijk van de geconfigureerde authenticatiemodus.
- Modi met identiteit, zoals Tailscale Serve
  (`gateway.auth.allowTailscale: true`) of niet-loopback
  `gateway.auth.mode: "trusted-proxy"`, voldoen aan de connect-authenticatiecontrole via
  aanvraagheaders in plaats van `connect.params.auth.*`.
- Private-ingress `gateway.auth.mode: "none"` slaat connect-authenticatie met gedeeld geheim
  volledig over; stel die modus niet bloot op publieke/niet-vertrouwde ingress.
- Na koppeling geeft de Gateway een **apparaat-token** uit dat is afgebakend tot de verbindingsrol
  + scopes. Het wordt geretourneerd in `hello-ok.auth.deviceToken` en moet door
  de client worden bewaard voor toekomstige verbindingen.
- Clients moeten de primaire `hello-ok.auth.deviceToken` bewaren na elke
  succesvolle verbinding.
- Opnieuw verbinden met dat **opgeslagen** apparaat-token moet ook de opgeslagen
  goedgekeurde scopeset voor dat token hergebruiken. Dit behoudt lees-/probe-/status-toegang
  die al was verleend en voorkomt dat herverbindingen stilzwijgend worden teruggebracht tot een
  smallere impliciete alleen-admin-scope.
- Samenstelling van connect-authenticatie aan clientzijde (`selectConnectAuth` in
  `src/gateway/client.ts`):
  - `auth.password` staat los hiervan en wordt altijd doorgestuurd wanneer ingesteld.
  - `auth.token` wordt ingevuld in prioriteitsvolgorde: eerst een expliciet gedeeld token,
    daarna een expliciete `deviceToken`, daarna een opgeslagen token per apparaat (gesleuteld op
    `deviceId` + `role`).
  - `auth.bootstrapToken` wordt alleen verzonden wanneer geen van bovenstaande een
    `auth.token` heeft opgeleverd. Een gedeeld token of een opgelost apparaat-token onderdrukt dit.
  - Automatische promotie van een opgeslagen apparaat-token bij de eenmalige
    `AUTH_TOKEN_MISMATCH`-retry is beperkt tot **uitsluitend vertrouwde eindpunten**:
    loopback, of `wss://` met een vastgezette `tlsFingerprint`. Publieke `wss://`
    zonder pinning komt niet in aanmerking.
- Aanvullende `hello-ok.auth.deviceTokens`-items zijn bootstrap-overdrachtstokens.
  Bewaar ze alleen wanneer de verbinding bootstrap-authenticatie gebruikte op een vertrouwd transport
  zoals `wss://` of loopback/lokale koppeling.
- Als een client een **expliciete** `deviceToken` of expliciete `scopes` levert, blijft die
  door de aanroeper gevraagde scopeset gezaghebbend; gecachete scopes worden alleen
  hergebruikt wanneer de client het opgeslagen token per apparaat hergebruikt.
- Apparaat-tokens kunnen worden geroteerd/ingetrokken via `device.token.rotate` en
  `device.token.revoke` (vereist `operator.pairing`-scope).
- `device.token.rotate` retourneert rotatiemetadata. Het echoot het vervangende
  bearer-token alleen voor aanroepen vanaf hetzelfde apparaat die al met
  dat apparaat-token zijn geauthenticeerd, zodat clients die alleen tokens gebruiken hun vervanging kunnen bewaren voordat
  ze opnieuw verbinden. Gedeelde/admin-rotaties echoën het bearer-token niet.
- Tokenuitgifte, rotatie en intrekking blijven beperkt tot de goedgekeurde rollenset
  die is vastgelegd in de koppelingsvermelding van dat apparaat; tokenmutatie kan geen apparaatrol uitbreiden of
  targeten die nooit door koppelingsgoedkeuring is verleend.
- Voor gekoppelde-apparaat-tokensessies is apparaatbeheer zelf-afgebakend tenzij de
  aanroeper ook `operator.admin` heeft: niet-admin-aanroepers kunnen alleen hun **eigen**
  apparaatvermelding verwijderen/intrekken/roteren.
- `device.token.rotate` en `device.token.revoke` controleren ook de scopeset van het doeloperator-token
  tegen de huidige sessiescopes van de aanroeper. Niet-admin-aanroepers
  kunnen geen breder operator-token roteren of intrekken dan ze zelf al hebben.
- Authenticatiefouten bevatten `error.details.code` plus herstelhints:
  - `error.details.canRetryWithDeviceToken` (boolean)
  - `error.details.recommendedNextStep` (`retry_with_device_token`, `update_auth_configuration`, `update_auth_credentials`, `wait_then_retry`, `review_auth_configuration`)
- Clientgedrag voor `AUTH_TOKEN_MISMATCH`:
  - Vertrouwde clients mogen één begrensde retry proberen met een gecachet token per apparaat.
  - Als die retry mislukt, moeten clients automatische herverbindingslussen stoppen en richtlijnen voor operatoractie tonen.

## Apparaatidentiteit + koppeling

- Nodes moeten een stabiele apparaatidentiteit (`device.id`) opnemen, afgeleid van een
  sleutelpaarkingerafdruk.
- Gateways geven tokens uit per apparaat + rol.
- Koppelingsgoedkeuringen zijn vereist voor nieuwe apparaat-ID's, tenzij lokale automatische goedkeuring
  is ingeschakeld.
- Automatische koppelingsgoedkeuring is gericht op directe local loopback-verbindingen.
- OpenClaw heeft ook een smal backend-/container-lokaal zelfverbindingspad voor
  vertrouwde helperflows met gedeeld geheim.
- Tailnet- of LAN-verbindingen op dezelfde host worden nog steeds als extern behandeld voor koppeling en
  vereisen goedkeuring.
- WS-clients nemen normaal `device`-identiteit op tijdens `connect` (operator +
  node). De enige apparaatloze operator-uitzonderingen zijn expliciete vertrouwenspaden:
  - `gateway.controlUi.allowInsecureAuth=true` voor localhost-only onveilige HTTP-compatibiliteit.
  - succesvolle `gateway.auth.mode: "trusted-proxy"` operator-Control UI-authenticatie.
  - `gateway.controlUi.dangerouslyDisableDeviceAuth=true` (break-glass, ernstige beveiligingsverlaging).
  - directe-loopback `gateway-client` backend-RPC's geauthenticeerd met het gedeelde
    Gateway-token/wachtwoord.
- Alle verbindingen moeten de door de server geleverde `connect.challenge`-nonce ondertekenen.

### Diagnostiek voor migratie van apparaat-authenticatie

Voor legacy-clients die nog steeds pre-challenge-ondertekeningsgedrag gebruiken, retourneert `connect` nu
`DEVICE_AUTH_*`-detailcodes onder `error.details.code` met een stabiele `error.details.reason`.

Veelvoorkomende migratiefouten:

| Bericht                     | details.code                     | details.reason           | Betekenis                                          |
| --------------------------- | -------------------------------- | ------------------------ | -------------------------------------------------- |
| `device nonce required`     | `DEVICE_AUTH_NONCE_REQUIRED`     | `device-nonce-missing`   | Client heeft `device.nonce` weggelaten (of leeg verzonden). |
| `device nonce mismatch`     | `DEVICE_AUTH_NONCE_MISMATCH`     | `device-nonce-mismatch`  | Client heeft ondertekend met een verouderde/verkeerde nonce. |
| `device signature invalid`  | `DEVICE_AUTH_SIGNATURE_INVALID`  | `device-signature`       | Ondertekeningspayload komt niet overeen met v2-payload. |
| `device signature expired`  | `DEVICE_AUTH_SIGNATURE_EXPIRED`  | `device-signature-stale` | Ondertekende tijdstempel ligt buiten de toegestane afwijking. |
| `device identity mismatch`  | `DEVICE_AUTH_DEVICE_ID_MISMATCH` | `device-id-mismatch`     | `device.id` komt niet overeen met de publieke-sleutelvingerafdruk. |
| `device public key invalid` | `DEVICE_AUTH_PUBLIC_KEY_INVALID` | `device-public-key`      | Publieke-sleutelindeling/canonicalisatie mislukt. |

Migratiedoel:

- Wacht altijd op `connect.challenge`.
- Onderteken de v2-payload die de servernonce bevat.
- Verzend dezelfde nonce in `connect.params.device.nonce`.
- Voorkeur heeft ondertekeningspayload `v3`, die `platform` en `deviceFamily`
  bindt naast velden voor apparaat/client/rol/scopes/token/nonce.
- Legacy-`v2`-handtekeningen blijven voor compatibiliteit geaccepteerd, maar metadata-pinning
  van gekoppelde apparaten blijft het opdrachtbeleid bij opnieuw verbinden bepalen.

## TLS + pinning

- TLS wordt ondersteund voor WS-verbindingen.
- Clients kunnen optioneel de certificaatvingerafdruk van de Gateway pinnen (zie `gateway.tls`-
  configuratie plus `gateway.remote.tlsFingerprint` of CLI `--tls-fingerprint`).

## Scope

Dit protocol stelt de **volledige Gateway-API** bloot (status, kanalen, modellen, chat,
agent, sessies, nodes, goedkeuringen, enz.). Het exacte oppervlak wordt gedefinieerd door de
TypeBox-schema's in `src/gateway/protocol/schema.ts`.

## Gerelateerd

- [Bridge-protocol](/nl/gateway/bridge-protocol)
- [Gateway-runbook](/nl/gateway)
