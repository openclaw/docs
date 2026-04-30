---
read_when:
    - Gateway-WS-clients implementeren of bijwerken
    - Fouten opsporen bij protocolmismatches of verbindingsfouten
    - Protocolschema/-modellen opnieuw genereren
summary: 'Gateway WebSocket-protocol: handshake, frames, versiebeheer'
title: Gateway-protocol
x-i18n:
    generated_at: "2026-04-30T00:06:39Z"
    model: gpt-5.5
    provider: openai
    source_hash: c0d922e9b4b778c333873e551498b905461f30f944e809555b45669ae2f5c404
    source_path: gateway/protocol.md
    workflow: 16
---

De Gateway WS-protocol is het **enige besturingsvlak + nodetransport** voor
OpenClaw. Alle clients (CLI, web-UI, macOS-app, iOS/Android-nodes, headless
nodes) maken verbinding via WebSocket en verklaren hun **rol** + **scope** tijdens
de handshake.

## Transport

- WebSocket, tekstframes met JSON-payloads.
- Het eerste frame **moet** een `connect`-verzoek zijn.
- Pre-connect-frames zijn beperkt tot 64 KiB. Na een geslaagde handshake moeten clients
  de limieten `hello-ok.policy.maxPayload` en
  `hello-ok.policy.maxBufferedBytes` volgen. Wanneer diagnostiek is ingeschakeld,
  geven te grote inkomende frames en trage uitgaande buffers `payload.large`-events
  voordat de Gateway het betrokken frame sluit of laat vallen. Deze events bewaren
  groottes, limieten, oppervlakken en veilige redencodes. Ze bewaren niet de berichttekst,
  bijlage-inhoud, ruwe frametekst, tokens, cookies of geheime waarden.

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

Terwijl de Gateway nog bezig is met het afronden van startup-sidecars, kan het `connect`-verzoek
een opnieuw te proberen `UNAVAILABLE`-fout retourneren met `details.reason` ingesteld op
`"startup-sidecars"` en `retryAfterMs`. Clients moeten die respons opnieuw proberen
binnen hun totale verbindingsbudget in plaats van die te tonen als een definitieve
handshakefout.

`server`, `features`, `snapshot` en `policy` zijn allemaal verplicht volgens het schema
(`src/gateway/protocol/schema/frames.ts`). `auth` is ook verplicht en rapporteert
de onderhandelde rol/scopes. `canvasHostUrl` is optioneel.

Wanneer er geen devicetoken wordt uitgegeven, rapporteert `hello-ok.auth` de onderhandelde
machtigingen zonder tokenvelden:

```json
{
  "auth": {
    "role": "operator",
    "scopes": ["operator.read", "operator.write"]
  }
}
```

Vertrouwde backendclients in hetzelfde proces (`client.id: "gateway-client"`,
`client.mode: "backend"`) mogen `device` weglaten bij directe loopbackverbindingen wanneer
ze authenticeren met het gedeelde Gateway-token/wachtwoord. Dit pad is gereserveerd
voor interne control-plane-RPC's en voorkomt dat verouderde CLI/device-pairingbaselines
lokaal backendwerk blokkeren, zoals updates van subagent-sessies. Externe clients,
browser-originclients, nodeclients en expliciete devicetoken-/device-identityclients
gebruiken nog steeds de normale pairing- en scope-upgradecontroles.

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

Tijdens vertrouwde bootstrap-overdracht kan `hello-ok.auth` ook extra
begrensde rolvermeldingen in `deviceTokens` bevatten:

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

Voor de ingebouwde bootstrapflow voor node/operator blijft het primaire nodetoken
`scopes: []` en blijft elk overgedragen operatortoken begrensd tot de allowlist
voor bootstrapoperators (`operator.approvals`, `operator.read`,
`operator.talk.secrets`, `operator.write`). Bootstrap-scopecontroles blijven
rolgeprefixt: operatorvermeldingen voldoen alleen aan operatorverzoeken, en niet-operatorrollen
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

- **Verzoek**: `{type:"req", id, method, params}`
- **Respons**: `{type:"res", id, ok, payload|error}`
- **Event**: `{type:"event", event, payload, seq?, stateVersion?}`

Methoden met bijwerkingen vereisen **idempotency keys** (zie schema).

## Rollen + scopes

### Rollen

- `operator` = control-planeclient (CLI/UI/automatisering).
- `node` = capabilityhost (camera/screen/canvas/system.run).

### Scopes (operator)

Veelgebruikte scopes:

- `operator.read`
- `operator.write`
- `operator.admin`
- `operator.approvals`
- `operator.pairing`
- `operator.talk.secrets`

`talk.config` met `includeSecrets: true` vereist `operator.talk.secrets`
(of `operator.admin`).

Door Plugins geregistreerde Gateway-RPC-methoden kunnen hun eigen operatorscope aanvragen, maar
gereserveerde core-adminprefixen (`config.*`, `exec.approvals.*`, `wizard.*`,
`update.*`) worden altijd omgezet naar `operator.admin`.

Methodescope is alleen de eerste controle. Sommige slashopdrachten die via
`chat.send` worden bereikt, passen daarbovenop strengere controles op opdrachtniveau toe.
Zo vereisen permanente schrijfacties van `/config set` en `/config unset` `operator.admin`.

`node.pair.approve` heeft ook een extra scopecontrole op goedkeuringstijdstip bovenop de
basisscope van de methode:

- verzoeken zonder opdracht: `operator.pairing`
- verzoeken met niet-exec-nodeopdrachten: `operator.pairing` + `operator.write`
- verzoeken die `system.run`, `system.run.prepare` of `system.which` bevatten:
  `operator.pairing` + `operator.admin`

### Caps/opdrachten/machtigingen (node)

Nodes verklaren capabilityclaims tijdens het verbinden:

- `caps`: capabilitycategorieën op hoog niveau.
- `commands`: allowlist voor opdrachten voor invoke.
- `permissions`: granulaire schakelaars (bijv. `screen.record`, `camera.capture`).

De Gateway behandelt deze als **claims** en dwingt server-side allowlists af.

## Presence

- `system-presence` retourneert vermeldingen met device-identiteit als sleutel.
- Presence-vermeldingen bevatten `deviceId`, `roles` en `scopes`, zodat UI's één rij per device kunnen tonen
  zelfs wanneer het zowel als **operator** als **node** verbinding maakt.
- `node.list` bevat optionele velden `lastSeenAtMs` en `lastSeenReason`. Verbonden nodes rapporteren
  hun huidige verbindingstijd als `lastSeenAtMs` met reden `connect`; gepairde nodes kunnen ook
  duurzame achtergrond-presence rapporteren wanneer een vertrouwd node-event hun pairingmetadata bijwerkt.

### Achtergrond-alive-event van node

Nodes kunnen `node.event` aanroepen met `event: "node.presence.alive"` om vast te leggen dat een gepairde node
alive was tijdens een achtergrondwake zonder die als verbonden te markeren.

```json
{
  "event": "node.presence.alive",
  "payloadJSON": "{\"trigger\":\"silent_push\",\"sentAtMs\":1737264000000,\"displayName\":\"Peter's iPhone\",\"version\":\"2026.4.28\",\"platform\":\"iOS 18.4.0\",\"deviceFamily\":\"iPhone\",\"modelIdentifier\":\"iPhone17,1\",\"pushTransport\":\"relay\"}"
}
```

`trigger` is een gesloten enum: `background`, `silent_push`, `bg_app_refresh`,
`significant_location`, `manual` of `connect`. Onbekende triggerstrings worden door de Gateway
genormaliseerd naar `background` vóór persistentie. Het event is alleen duurzaam voor geauthenticeerde
nodesessies met device; sessies zonder device of zonder pairing retourneren `handled: false`.

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
erkende RPC, niet als duurzame presence-persistentie.

## Scoping van broadcast-events

Door de server gepushte WebSocket-broadcast-events zijn scope-gated, zodat pairing-scoped sessies of node-only sessies niet passief sessie-inhoud ontvangen.

- **Chat-, agent- en tool-resultframes** (inclusief gestreamde `agent`-events en resultaten van toolaanroepen) vereisen minimaal `operator.read`. Sessies zonder `operator.read` slaan deze frames volledig over.
- **Door Plugins gedefinieerde `plugin.*`-broadcasts** zijn afgeschermd tot `operator.write` of `operator.admin`, afhankelijk van hoe de Plugin ze heeft geregistreerd.
- **Status- en transportevents** (`heartbeat`, `presence`, `tick`, connect/disconnect-levenscyclus, enz.) blijven onbeperkt, zodat transportgezondheid zichtbaar blijft voor elke geauthenticeerde sessie.
- **Onbekende broadcast-eventfamilies** zijn standaard scope-gated (fail-closed), tenzij een geregistreerde handler ze expliciet versoepelt.

Elke clientverbinding behoudt zijn eigen sequentienummer per client, zodat broadcasts monotone ordening op die socket behouden, zelfs wanneer verschillende clients verschillende scope-gefilterde subsets van de eventstream zien.

## Veelvoorkomende RPC-methodefamilies

Het openbare WS-oppervlak is breder dan de handshake-/auth-voorbeelden hierboven. Dit
is geen gegenereerde dump — `hello-ok.features.methods` is een conservatieve
discoverylijst die is opgebouwd uit `src/gateway/server-methods-list.ts` plus geladen
methode-exports van Plugins/kanalen. Behandel het als featurediscovery, niet als een volledige
opsomming van `src/gateway/server-methods/*.ts`.

<AccordionGroup>
  <Accordion title="System and identity">
    - `health` retourneert de gecachete of net geprobede healthsnapshot van de Gateway.
    - `diagnostics.stability` retourneert de recente begrensde diagnostische stabiliteitsrecorder. Deze bewaart operationele metadata zoals eventnamen, aantallen, bytegroottes, geheugenuitlezingen, queue-/sessiestatus, kanaal-/Plugin-namen en sessie-id's. Deze bewaart geen chattekst, Webhook-bodies, tooloutputs, ruwe request- of responsebodies, tokens, cookies of geheime waarden. Operator-read-scope is vereist.
    - `status` retourneert de Gateway-samenvatting in `/status`-stijl; gevoelige velden worden alleen opgenomen voor operatorclients met adminscope.
    - `gateway.identity.get` retourneert de device-identiteit van de Gateway die door relay- en pairingflows wordt gebruikt.
    - `system-presence` retourneert de huidige presencesnapshot voor verbonden operator-/nodedevices.
    - `system-event` voegt een systemevent toe en kan presencecontext bijwerken/broadcasten.
    - `last-heartbeat` retourneert het laatst gepersisteerde Heartbeat-event.
    - `set-heartbeats` schakelt Heartbeat-verwerking op de Gateway om.

  </Accordion>

  <Accordion title="Modellen en gebruik">
    - `models.list` retourneert de modelcatalogus die tijdens runtime is toegestaan. Geef `{ "view": "configured" }` door voor geconfigureerde modellen op picker-formaat (`agents.defaults.models` eerst, daarna `models.providers.*.models`), of `{ "view": "all" }` voor de volledige catalogus.
    - `usage.status` retourneert provider-gebruiksvensters en samenvattingen van resterend quotum.
    - `usage.cost` retourneert geaggregeerde samenvattingen van kostengebruik voor een datumbereik.
    - `doctor.memory.status` retourneert gereedheid van vectorgeheugen / gecachte embeddings voor de actieve standaard-agentwerkruimte. Geef `{ "probe": true }` of `{ "deep": true }` alleen door wanneer de aanroeper expliciet een live ping naar de embeddingprovider wil.
    - `doctor.memory.remHarness` retourneert een begrensde, alleen-lezen REM-harnesspreview voor externe control-plane-clients. Deze kan werkruimtepaden, geheugenfragmenten, gerenderde grounded markdown en kandidaten voor diepe promotie bevatten, dus aanroepers hebben `operator.read` nodig.
    - `sessions.usage` retourneert gebruikssamenvattingen per sessie.
    - `sessions.usage.timeseries` retourneert tijdreeksgebruik voor één sessie.
    - `sessions.usage.logs` retourneert gebruikslogitems voor één sessie.

  </Accordion>

  <Accordion title="Kanalen en loginhelpers">
    - `channels.status` retourneert ingebouwde + gebundelde kanaal-/Plugin-statussamenvattingen.
    - `channels.logout` meldt een specifiek kanaal/account af wanneer het kanaal afmelden ondersteunt.
    - `web.login.start` start een QR-/webloginflow voor de huidige QR-geschikte webkanaalprovider.
    - `web.login.wait` wacht tot die QR-/webloginflow is voltooid en start het kanaal bij succes.
    - `push.test` verstuurt een test-APNs-push naar een geregistreerde iOS-node.
    - `voicewake.get` retourneert de opgeslagen wake-word-triggers.
    - `voicewake.set` werkt wake-word-triggers bij en broadcast de wijziging.

  </Accordion>

  <Accordion title="Berichten en logs">
    - `send` is de directe RPC voor uitgaande aflevering voor kanaal-/account-/threadgerichte verzendingen buiten de chatrunner.
    - `logs.tail` retourneert de geconfigureerde gateway-file-log-tail met cursor-/limiet- en max-byte-instellingen.

  </Accordion>

  <Accordion title="Talk en TTS">
    - `talk.config` retourneert de effectieve Talk-configpayload; `includeSecrets` vereist `operator.talk.secrets` (of `operator.admin`).
    - `talk.mode` stelt de huidige Talk-modusstatus in voor WebChat-/Control UI-clients en broadcast deze.
    - `talk.speak` synthetiseert spraak via de actieve Talk-spraakprovider.
    - `tts.status` retourneert de ingeschakelde TTS-status, actieve provider, fallbackproviders en providerconfigstatus.
    - `tts.providers` retourneert de zichtbare inventaris van TTS-providers.
    - `tts.enable` en `tts.disable` schakelen de TTS-voorkeurstatus.
    - `tts.setProvider` werkt de voorkeurs-TTS-provider bij.
    - `tts.convert` voert een eenmalige tekst-naar-spraakconversie uit.

  </Accordion>

  <Accordion title="Secrets, config, update en wizard">
    - `secrets.reload` lost actieve SecretRefs opnieuw op en wisselt de runtime-secretstatus alleen bij volledig succes.
    - `secrets.resolve` lost commandogerichte secrettoewijzingen op voor een specifieke opdracht-/doelset.
    - `config.get` retourneert de huidige config-snapshot en hash.
    - `config.set` schrijft een gevalideerde configpayload.
    - `config.patch` voegt een gedeeltelijke config-update samen.
    - `config.apply` valideert en vervangt de volledige configpayload.
    - `config.schema` retourneert de live config-schemapayload die wordt gebruikt door Control UI en CLI-tooling: schema, `uiHints`, versie en generatiemetadata, inclusief Plugin- + kanaalschemametadata wanneer de runtime deze kan laden. Het schema bevat veldmetadata voor `title` / `description`, afgeleid van dezelfde labels en helptekst die door de UI worden gebruikt, inclusief geneste objecten, wildcards, array-items en `anyOf` / `oneOf` / `allOf`-compositietakken wanneer overeenkomende velddocumentatie bestaat.
    - `config.schema.lookup` retourneert een padgebonden lookuppayload voor één configpad: genormaliseerd pad, een ondiepe schemanode, overeenkomende hint + `hintPath`, en directe child-samenvattingen voor UI-/CLI-drilldown. Lookup-schemanodes behouden de gebruikersgerichte docs en algemene validatievelden (`title`, `description`, `type`, `enum`, `const`, `format`, `pattern`, numerieke/string-/array-/objectgrenzen, en vlaggen zoals `additionalProperties`, `deprecated`, `readOnly`, `writeOnly`). Child-samenvattingen tonen `key`, genormaliseerd `path`, `type`, `required`, `hasChildren`, plus de overeenkomende `hint` / `hintPath`.
    - `update.run` voert de gateway-updateflow uit en plant alleen een herstart wanneer de update zelf is geslaagd.
    - `update.status` retourneert de nieuwste gecachte update-herstartsentinel, inclusief de draaiende versie na herstart wanneer beschikbaar.
    - `wizard.start`, `wizard.next`, `wizard.status` en `wizard.cancel` ontsluiten de onboardingwizard via WS RPC.

  </Accordion>

  <Accordion title="Agent- en werkruimtehelpers">
    - `agents.list` retourneert geconfigureerde agentitems, inclusief effectief model en runtimemetadata.
    - `agents.create`, `agents.update` en `agents.delete` beheren agentrecords en werkruimtebedrading.
    - `agents.files.list`, `agents.files.get` en `agents.files.set` beheren de bootstrap-werkruimtebestanden die voor een agent worden ontsloten.
    - `agent.identity.get` retourneert de effectieve assistant-identiteit voor een agent of sessie.
    - `agent.wait` wacht tot een run is voltooid en retourneert de terminalsnapshot wanneer beschikbaar.

  </Accordion>

  <Accordion title="Sessiebeheer">
    - `sessions.list` retourneert de huidige sessie-index, inclusief `agentRuntime`-metadata per rij wanneer een agentruntime-backend is geconfigureerd.
    - `sessions.subscribe` en `sessions.unsubscribe` schakelen sessiewijziging-eventabonnementen voor de huidige WS-client.
    - `sessions.messages.subscribe` en `sessions.messages.unsubscribe` schakelen transcript-/bericht-eventabonnementen voor één sessie.
    - `sessions.preview` retourneert begrensde transcriptpreviews voor specifieke sessiesleutels.
    - `sessions.resolve` lost een sessiedoel op of canonicaliseert het.
    - `sessions.create` maakt een nieuw sessie-item aan.
    - `sessions.send` stuurt een bericht naar een bestaande sessie.
    - `sessions.steer` is de variant voor onderbreken en bijsturen van een actieve sessie.
    - `sessions.abort` breekt actief werk voor een sessie af. Een aanroeper kan `key` plus optioneel `runId` doorgeven, of alleen `runId` voor actieve runs die de Gateway naar een sessie kan herleiden.
    - `sessions.patch` werkt sessiemetadata/-overrides bij en rapporteert het opgeloste canonieke model plus effectieve `agentRuntime`.
    - `sessions.reset`, `sessions.delete` en `sessions.compact` voeren sessieonderhoud uit.
    - `sessions.get` retourneert de volledige opgeslagen sessierij.
    - Chatuitvoering gebruikt nog steeds `chat.history`, `chat.send`, `chat.abort` en `chat.inject`. `chat.history` is display-genormaliseerd voor UI-clients: inline directivetags worden uit zichtbare tekst verwijderd, platte-tekst tool-call XML-payloads (inclusief `<tool_call>...</tool_call>`, `<function_call>...</function_call>`, `<tool_calls>...</tool_calls>`, `<function_calls>...</function_calls>` en afgekorte tool-call-blokken) en gelekte ASCII-/volledige-breedte modelcontroletokens worden verwijderd, pure silent-token-assistantrijen zoals exact `NO_REPLY` / `no_reply` worden weggelaten, en te grote rijen kunnen worden vervangen door placeholders.

  </Accordion>

  <Accordion title="Apparaatkoppeling en apparaattokens">
    - `device.pair.list` retourneert wachtende en goedgekeurde gekoppelde apparaten.
    - `device.pair.approve`, `device.pair.reject` en `device.pair.remove` beheren apparaatkoppelingsrecords.
    - `device.token.rotate` roteert een gekoppeld apparaattoken binnen de goedgekeurde rol- en aanroeperscopegrenzen.
    - `device.token.revoke` trekt een gekoppeld apparaattoken in binnen de goedgekeurde rol- en aanroeperscopegrenzen.

  </Accordion>

  <Accordion title="Node-koppeling, invoke en wachtend werk">
    - `node.pair.request`, `node.pair.list`, `node.pair.approve`, `node.pair.reject`, `node.pair.remove` en `node.pair.verify` dekken nodekoppeling en bootstrapverificatie.
    - `node.list` en `node.describe` retourneren bekende/verbonden nodestatus.
    - `node.rename` werkt een gekoppeld nodelabel bij.
    - `node.invoke` stuurt een opdracht door naar een verbonden node.
    - `node.invoke.result` retourneert het resultaat voor een invoke-aanvraag.
    - `node.event` draagt events afkomstig van nodes terug naar de gateway.
    - `node.canvas.capability.refresh` vernieuwt canvas-capabilitytokens met scope.
    - `node.pending.pull` en `node.pending.ack` zijn de queue-API's voor verbonden nodes.
    - `node.pending.enqueue` en `node.pending.drain` beheren duurzaam wachtend werk voor offline/losgekoppelde nodes.

  </Accordion>

  <Accordion title="Goedkeuringsfamilies">
    - `exec.approval.request`, `exec.approval.get`, `exec.approval.list` en `exec.approval.resolve` dekken eenmalige exec-goedkeuringsaanvragen plus lookup/replay van wachtende goedkeuringen.
    - `exec.approval.waitDecision` wacht op één wachtende exec-goedkeuring en retourneert de uiteindelijke beslissing (of `null` bij timeout).
    - `exec.approvals.get` en `exec.approvals.set` beheren gateway-exec-goedkeuringsbeleidssnapshots.
    - `exec.approvals.node.get` en `exec.approvals.node.set` beheren node-lokaal exec-goedkeuringsbeleid via noderelayopdrachten.
    - `plugin.approval.request`, `plugin.approval.list`, `plugin.approval.waitDecision` en `plugin.approval.resolve` dekken door plugins gedefinieerde goedkeuringsflows.

  </Accordion>

  <Accordion title="Automatisering, Skills en tools">
    - Automatisering: `wake` plant een directe of volgende-Heartbeat-wake-tekstinjectie; `cron.list`, `cron.status`, `cron.add`, `cron.update`, `cron.remove`, `cron.run`, `cron.runs` beheren gepland werk.
    - Skills en tools: `commands.list`, `skills.*`, `tools.catalog`, `tools.effective`.

  </Accordion>
</AccordionGroup>

### Algemene eventfamilies

- `chat`: UI-chatupdates zoals `chat.inject` en andere transcript-only chat
  events.
- `session.message` en `session.tool`: transcript-/eventstreamupdates voor een
  geabonneerde sessie.
- `sessions.changed`: sessie-index of metadata gewijzigd.
- `presence`: updates van systeempresence-snapshots.
- `tick`: periodiek keepalive-/liveness-event.
- `health`: update van gateway-healthsnapshot.
- `heartbeat`: update van Heartbeat-eventstream.
- `cron`: event voor wijziging van Cron-run/job.
- `shutdown`: melding van gateway-afsluiting.
- `node.pair.requested` / `node.pair.resolved`: levenscyclus van nodekoppeling.
- `node.invoke.request`: broadcast van node-invoke-aanvraag.
- `device.pair.requested` / `device.pair.resolved`: levenscyclus van gekoppeld apparaat.
- `voicewake.changed`: wake-word-triggerconfig gewijzigd.
- `exec.approval.requested` / `exec.approval.resolved`: levenscyclus van exec-goedkeuring.
- `plugin.approval.requested` / `plugin.approval.resolved`: levenscyclus van Plugin-goedkeuring.

### Node-helpermethoden

- Nodes kunnen `skills.bins` aanroepen om de huidige lijst met uitvoerbare skillbestanden
  op te halen voor auto-allow-controles.

### Operator-helpermethoden

- Operators kunnen `commands.list` (`operator.read`) aanroepen om de runtime
  opdrachtinventaris voor een agent op te halen.
  - `agentId` is optioneel; laat dit weg om de standaardagentworkspace te lezen.
  - `scope` bepaalt op welk oppervlak de primaire `name` is gericht:
    - `text` retourneert het primaire tekstopdrachttoken zonder de voorafgaande `/`
    - `native` en het standaardpad `both` retourneren provideraane native namen
      wanneer beschikbaar
  - `textAliases` bevat exacte slash-aliassen zoals `/model` en `/m`.
  - `nativeName` bevat de provideraane native opdrachtnaam wanneer die bestaat.
  - `provider` is optioneel en beïnvloedt alleen native naamgeving plus de
    beschikbaarheid van native pluginopdrachten.
  - `includeArgs=false` laat geserialiseerde argumentmetadata weg uit het antwoord.
- Operators kunnen `tools.catalog` (`operator.read`) aanroepen om de runtime-toolcatalogus voor een
  agent op te halen. Het antwoord bevat gegroepeerde tools en herkomstmetadata:
  - `source`: `core` of `plugin`
  - `pluginId`: plugin-eigenaar wanneer `source="plugin"`
  - `optional`: of een plugintool optioneel is
- Operators kunnen `tools.effective` (`operator.read`) aanroepen om de runtime-effectieve
  toolinventaris voor een sessie op te halen.
  - `sessionKey` is vereist.
  - De Gateway leidt vertrouwde runtimecontext server-side af uit de sessie in plaats van door
    de aanroeper aangeleverde auth- of aflevercontext te accepteren.
  - Het antwoord is sessiegebonden en weerspiegelt wat het actieve gesprek nu kan gebruiken,
    inclusief core-, plugin- en kanaaltools.
- Operators kunnen `skills.status` (`operator.read`) aanroepen om de zichtbare
  Skills-inventaris voor een agent op te halen.
  - `agentId` is optioneel; laat dit weg om de standaardagentworkspace te lezen.
  - Het antwoord bevat geschiktheid, ontbrekende vereisten, configuratiecontroles en
    opgeschoonde installatieopties zonder ruwe geheime waarden bloot te leggen.
- Operators kunnen `skills.search` en `skills.detail` (`operator.read`) aanroepen voor
  ClawHub-ontdekkingsmetadata.
- Operators kunnen `skills.install` (`operator.admin`) in twee modi aanroepen:
  - ClawHub-modus: `{ source: "clawhub", slug, version?, force? }` installeert een
    skillmap in de map `skills/` van de standaardagentworkspace.
  - Gateway-installatiemodus: `{ name, installId, dangerouslyForceUnsafeInstall?, timeoutMs? }`
    voert een gedeclareerde actie `metadata.openclaw.install` uit op de Gateway-host.
- Operators kunnen `skills.update` (`operator.admin`) in twee modi aanroepen:
  - ClawHub-modus werkt een gevolgde slug bij of alle gevolgde ClawHub-installaties in
    de standaardagentworkspace.
  - Configuratiemodus patcht waarden van `skills.entries.<skillKey>` zoals `enabled`,
    `apiKey` en `env`.

### `models.list`-weergaven

`models.list` accepteert een optionele parameter `view`:

- Weggelaten of `"default"`: huidig runtimegedrag. Als `agents.defaults.models` is geconfigureerd, is het antwoord de toegestane catalogus; anders is het antwoord de volledige Gateway-catalogus.
- `"configured"`: picker-formaat gedrag. Als `agents.defaults.models` is geconfigureerd, heeft dat nog steeds voorrang. Anders gebruikt het antwoord expliciete vermeldingen in `models.providers.*.models`, met terugval naar de volledige catalogus alleen wanneer er geen geconfigureerde modelrijen bestaan.
- `"all"`: volledige Gateway-catalogus, waarbij `agents.defaults.models` wordt omzeild. Gebruik dit voor diagnostiek en ontdekkings-UI's, niet voor normale modelpickers.

## Uitvoergoedkeuringen

- Wanneer een uitvoerverzoek goedkeuring nodig heeft, broadcast de Gateway `exec.approval.requested`.
- Operatorclients lossen dit op door `exec.approval.resolve` aan te roepen (vereist scope `operator.approvals`).
- Voor `host=node` moet `exec.approval.request` `systemRunPlan` bevatten (canonieke `argv`/`cwd`/`rawCommand`/sessiemetadata). Verzoeken zonder `systemRunPlan` worden geweigerd.
- Na goedkeuring hergebruiken doorgestuurde `node.invoke system.run`-aanroepen dat canonieke
  `systemRunPlan` als de gezaghebbende opdracht-/cwd-/sessiecontext.
- Als een aanroeper `command`, `rawCommand`, `cwd`, `agentId` of
  `sessionKey` wijzigt tussen voorbereiding en de uiteindelijke goedgekeurde doorsturing van `system.run`, weigert de
  Gateway de uitvoering in plaats van de gewijzigde payload te vertrouwen.

## Fallback voor agentbezorging

- `agent`-verzoeken kunnen `deliver=true` bevatten om uitgaande bezorging aan te vragen.
- `bestEffortDeliver=false` behoudt strikt gedrag: onopgeloste of alleen-interne bezorgdoelen retourneren `INVALID_REQUEST`.
- `bestEffortDeliver=true` staat fallback naar alleen-sessie-uitvoering toe wanneer er geen externe bezorgbare route kan worden opgelost (bijvoorbeeld interne/webchat-sessies of dubbelzinnige meerkanaalsconfiguraties).

## Versiebeheer

- `PROTOCOL_VERSION` staat in `src/gateway/protocol/schema/protocol-schemas.ts`.
- Clients sturen `minProtocol` + `maxProtocol`; de server weigert mismatches.
- Schema's + modellen worden gegenereerd uit TypeBox-definities:
  - `pnpm protocol:gen`
  - `pnpm protocol:gen:swift`
  - `pnpm protocol:check`

### Clientconstanten

De referentieclient in `src/gateway/client.ts` gebruikt deze standaarden. Waarden zijn
stabiel binnen protocol v3 en vormen de verwachte baseline voor clients van derden.

| Constante                                 | Standaard                                             | Bron                                                                                       |
| ----------------------------------------- | ----------------------------------------------------- | ------------------------------------------------------------------------------------------ |
| `PROTOCOL_VERSION`                        | `3`                                                   | `src/gateway/protocol/schema/protocol-schemas.ts`                                          |
| Verzoektime-out (per RPC)                 | `30_000` ms                                           | `src/gateway/client.ts` (`requestTimeoutMs`)                                               |
| Preauth-/connect-challenge-time-out       | `15_000` ms                                           | `src/gateway/handshake-timeouts.ts` (config/env kan het gekoppelde server/clientbudget verhogen) |
| Initiële reconnect-backoff                | `1_000` ms                                            | `src/gateway/client.ts` (`backoffMs`)                                                      |
| Maximale reconnect-backoff                | `30_000` ms                                           | `src/gateway/client.ts` (`scheduleReconnect`)                                              |
| Fast-retry-limiet na sluiten wegens device-token | `250` ms                                      | `src/gateway/client.ts`                                                                    |
| Respijt voor geforceerd stoppen vóór `terminate()` | `250` ms                                      | `FORCE_STOP_TERMINATE_GRACE_MS`                                                            |
| Standaardtime-out van `stopAndWait()`     | `1_000` ms                                            | `STOP_AND_WAIT_TIMEOUT_MS`                                                                 |
| Standaard tick-interval (vóór `hello-ok`) | `30_000` ms                                           | `src/gateway/client.ts`                                                                    |
| Sluiten bij tick-time-out                 | code `4000` wanneer stilte langer duurt dan `tickIntervalMs * 2` | `src/gateway/client.ts`                                                            |
| `MAX_PAYLOAD_BYTES`                       | `25 * 1024 * 1024` (25 MB)                            | `src/gateway/server-constants.ts`                                                          |

De server adverteert de effectieve `policy.tickIntervalMs`, `policy.maxPayload`,
en `policy.maxBufferedBytes` in `hello-ok`; clients moeten die waarden respecteren
in plaats van de standaarden van vóór de handshake.

## Auth

- Shared-secret Gateway-auth gebruikt `connect.params.auth.token` of
  `connect.params.auth.password`, afhankelijk van de geconfigureerde auth-modus.
- Modi met identiteit zoals Tailscale Serve
  (`gateway.auth.allowTailscale: true`) of niet-loopback
  `gateway.auth.mode: "trusted-proxy"` voldoen aan de connect-auth-controle via
  verzoekheaders in plaats van `connect.params.auth.*`.
- Private-ingress `gateway.auth.mode: "none"` slaat shared-secret connect-auth
  volledig over; stel die modus niet bloot op publieke/onvertrouwde ingress.
- Na pairing geeft de Gateway een **device token** uit, gebonden aan de verbindingsrol
  + scopes. Dit wordt geretourneerd in `hello-ok.auth.deviceToken` en moet door
  de client worden opgeslagen voor toekomstige connects.
- Clients moeten de primaire `hello-ok.auth.deviceToken` opslaan na elke
  succesvolle connect.
- Opnieuw verbinden met dat **opgeslagen** device token moet ook de opgeslagen
  goedgekeurde scopeset voor dat token hergebruiken. Dit behoudt lees-/probe-/statustoegang
  die al was verleend en voorkomt dat reconnects stilzwijgend terugvallen naar een
  beperktere impliciete alleen-admin-scope.
- Client-side samenstelling van connect-auth (`selectConnectAuth` in
  `src/gateway/client.ts`):
  - `auth.password` is orthogonaal en wordt altijd doorgestuurd wanneer ingesteld.
  - `auth.token` wordt gevuld in prioriteitsvolgorde: eerst expliciet gedeeld token,
    daarna een expliciete `deviceToken`, daarna een opgeslagen per-device token (gekeyed op
    `deviceId` + `role`).
  - `auth.bootstrapToken` wordt alleen verzonden wanneer geen van de bovenstaande een
    `auth.token` opleverde. Een gedeeld token of een opgelost device token onderdrukt dit.
  - Automatische promotie van een opgeslagen device token bij de eenmalige
    `AUTH_TOKEN_MISMATCH`-retry is beperkt tot **vertrouwde endpoints only** —
    loopback, of `wss://` met een gepinde `tlsFingerprint`. Publieke `wss://`
    zonder pinning komt niet in aanmerking.
- Extra vermeldingen in `hello-ok.auth.deviceTokens` zijn bootstrap-handoff-tokens.
  Sla ze alleen op wanneer de connect bootstrap-auth gebruikte op een vertrouwd transport
  zoals `wss://` of loopback/local pairing.
- Als een client een **expliciete** `deviceToken` of expliciete `scopes` levert, blijft die
  door de aanroeper aangevraagde scopeset gezaghebbend; gecachte scopes worden alleen
  hergebruikt wanneer de client het opgeslagen per-device token hergebruikt.
- Device tokens kunnen worden geroteerd/ingetrokken via `device.token.rotate` en
  `device.token.revoke` (vereist scope `operator.pairing`).
- `device.token.rotate` retourneert rotatiemetadata. Het echoot het vervangende
  bearer token alleen voor same-device-aanroepen die al met dat device token zijn geauthenticeerd,
  zodat token-only clients hun vervanging kunnen opslaan voordat ze opnieuw verbinden.
  Shared/admin-rotaties echoën het bearer token niet.
- Tokenuitgifte, rotatie en intrekking blijven beperkt tot de goedgekeurde rollenset
  die is vastgelegd in de pairingvermelding van dat device; tokenmutatie kan geen devicerol
  uitbreiden of targeten die pairinggoedkeuring nooit heeft verleend.
- Voor gekoppelde-device-tokensessies is devicebeheer self-scoped tenzij de
  aanroeper ook `operator.admin` heeft: niet-admin-aanroepers kunnen alleen hun **eigen**
  devicevermelding verwijderen/intrekken/roteren.
- `device.token.rotate` en `device.token.revoke` controleren ook de scopeset van het doel-operator
  token tegen de huidige sessiescopes van de aanroeper. Niet-admin-aanroepers
  kunnen geen breder operator token roteren of intrekken dan ze al bezitten.
- Auth-fouten bevatten `error.details.code` plus herstelhints:
  - `error.details.canRetryWithDeviceToken` (boolean)
  - `error.details.recommendedNextStep` (`retry_with_device_token`, `update_auth_configuration`, `update_auth_credentials`, `wait_then_retry`, `review_auth_configuration`)
- Clientgedrag voor `AUTH_TOKEN_MISMATCH`:
  - Vertrouwde clients mogen één begrensde retry proberen met een gecacht per-device token.
  - Als die retry mislukt, moeten clients automatische reconnect-lussen stoppen en begeleiding voor operatoractie tonen.

## Device-identiteit + pairing

- Nodes moeten een stabiele apparaatidentiteit (`device.id`) bevatten die is afgeleid van een
  keypair-vingerafdruk.
- Gateways geven tokens uit per apparaat + rol.
- Koppelingsgoedkeuringen zijn vereist voor nieuwe apparaat-ID's, tenzij lokale automatische goedkeuring
  is ingeschakeld.
- Automatische goedkeuring voor koppeling is gericht op directe local loopback-verbindingen.
- OpenClaw heeft ook een smal backend/container-lokaal zelfverbindingspad voor
  vertrouwde helperflows met gedeeld geheim.
- Verbindingen via dezelfde host-tailnet of LAN worden voor koppeling nog steeds als extern behandeld en
  vereisen goedkeuring.
- WS-clients nemen normaal gesproken de `device`-identiteit op tijdens `connect` (operator +
  node). De enige operator-uitzonderingen zonder apparaat zijn expliciete vertrouwenspaden:
  - `gateway.controlUi.allowInsecureAuth=true` voor localhost-only onveilige HTTP-compatibiliteit.
  - succesvolle operator-Control UI-authenticatie met `gateway.auth.mode: "trusted-proxy"`.
  - `gateway.controlUi.dangerouslyDisableDeviceAuth=true` (noodmaatregel, ernstige beveiligingsverlaging).
  - directe-loopback `gateway-client` backend-RPC's geauthenticeerd met het gedeelde
    gateway-token/wachtwoord.
- Alle verbindingen moeten de door de server verstrekte `connect.challenge`-nonce ondertekenen.

### Diagnostiek voor apparaatauthenticatiemigratie

Voor verouderde clients die nog steeds pre-challenge-ondertekeningsgedrag gebruiken, retourneert `connect` nu
`DEVICE_AUTH_*`-detailcodes onder `error.details.code` met een stabiele `error.details.reason`.

Veelvoorkomende migratiefouten:

| Bericht                     | details.code                     | details.reason           | Betekenis                                          |
| --------------------------- | -------------------------------- | ------------------------ | -------------------------------------------------- |
| `device nonce required`     | `DEVICE_AUTH_NONCE_REQUIRED`     | `device-nonce-missing`   | Client liet `device.nonce` weg (of stuurde leeg).  |
| `device nonce mismatch`     | `DEVICE_AUTH_NONCE_MISMATCH`     | `device-nonce-mismatch`  | Client ondertekende met een verlopen/verkeerde nonce. |
| `device signature invalid`  | `DEVICE_AUTH_SIGNATURE_INVALID`  | `device-signature`       | Handtekeningpayload komt niet overeen met v2-payload. |
| `device signature expired`  | `DEVICE_AUTH_SIGNATURE_EXPIRED`  | `device-signature-stale` | Ondertekende tijdstempel valt buiten toegestane afwijking. |
| `device identity mismatch`  | `DEVICE_AUTH_DEVICE_ID_MISMATCH` | `device-id-mismatch`     | `device.id` komt niet overeen met vingerafdruk van publieke sleutel. |
| `device public key invalid` | `DEVICE_AUTH_PUBLIC_KEY_INVALID` | `device-public-key`      | Indeling/canonicalisatie van publieke sleutel is mislukt. |

Migratiedoel:

- Wacht altijd op `connect.challenge`.
- Onderteken de v2-payload die de server-nonce bevat.
- Stuur dezelfde nonce in `connect.params.device.nonce`.
- De voorkeurs-handtekeningpayload is `v3`, die `platform` en `deviceFamily`
  bindt naast de velden voor apparaat/client/rol/scopes/token/nonce.
- Verouderde `v2`-handtekeningen blijven geaccepteerd voor compatibiliteit, maar metadata-pinning
  van gekoppelde apparaten blijft het opdrachtbeleid bij opnieuw verbinden bepalen.

## TLS + pinning

- TLS wordt ondersteund voor WS-verbindingen.
- Clients kunnen optioneel de cert-vingerafdruk van de gateway pinnen (zie `gateway.tls`-
  configuratie plus `gateway.remote.tlsFingerprint` of CLI `--tls-fingerprint`).

## Bereik

Dit protocol stelt de **volledige Gateway-API** beschikbaar (status, kanalen, modellen, chat,
agent, sessies, nodes, goedkeuringen, enz.). Het exacte oppervlak wordt gedefinieerd door de
TypeBox-schema's in `src/gateway/protocol/schema.ts`.

## Gerelateerd

- [Bridge-protocol](/nl/gateway/bridge-protocol)
- [Gateway-runbook](/nl/gateway)
