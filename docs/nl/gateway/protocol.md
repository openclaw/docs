---
read_when:
    - Gateway-WS-clients implementeren of bijwerken
    - Protocolmismatches of verbindingsfouten debuggen
    - Protocolschema/modellen opnieuw genereren
summary: 'Gateway WebSocket-protocol: handshake, frames, versiebeheer'
title: Gateway-protocol
x-i18n:
    generated_at: "2026-07-03T09:46:49Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: b58ef44b15e7359ca919e487bcf94c86601f508500ece000aafd8d1a90fb1cf1
    source_path: gateway/protocol.md
    workflow: 16
---

Het Gateway WS-protocol is het **enige besturingsvlak + node-transport** voor
OpenClaw. Alle clients (CLI, web-UI, macOS-app, iOS/Android-nodes, headless
nodes) verbinden via WebSocket en declareren hun **rol** + **scope** tijdens de
handshake.

## Transport

- WebSocket, tekstframes met JSON-payloads.
- Het eerste frame **moet** een `connect`-request zijn.
- Pre-connect-frames zijn begrensd op 64 KiB. Na een geslaagde handshake moeten
  clients de limieten `hello-ok.policy.maxPayload` en
  `hello-ok.policy.maxBufferedBytes` volgen. Met diagnostiek ingeschakeld
  geven te grote inkomende frames en trage uitgaande buffers `payload.large`-events
  af voordat de Gateway het betreffende frame sluit of laat vallen. Deze events
  bewaren groottes, limieten, oppervlakken en veilige redencodes. Ze bewaren niet
  de berichtbody, bijlage-inhoud, ruwe framebody, tokens, cookies of geheime waarden.

## Handshake (connect)

Gateway → Client (pre-connect-uitdaging):

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

Gateway → Client:

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

Terwijl de Gateway de startup-sidecars nog afrondt, kan het `connect`-request
een opnieuw te proberen `UNAVAILABLE`-fout retourneren met `details.reason`
ingesteld op `"startup-sidecars"` en `retryAfterMs`. Clients moeten die response
opnieuw proberen binnen hun totale verbindingsbudget in plaats van deze als een
terminale handshakefout te tonen.

`server`, `features`, `snapshot` en `policy` zijn allemaal vereist door het schema
(`packages/gateway-protocol/src/schema/frames.ts`). `auth` is ook vereist en rapporteert
de onderhandelde rol/scopes. `pluginSurfaceUrls` is optioneel en koppelt Plugin-
oppervlaknamen, zoals `canvas`, aan gescopete gehoste URL's.

Gescopete Plugin-oppervlak-URL's kunnen verlopen. Nodes kunnen
`node.pluginSurface.refresh` aanroepen met `{ "surface": "canvas" }` om een verse
entry in `pluginSurfaceUrls` te ontvangen. De experimentele Canvas-Plugin-refactor
ondersteunt het verouderde compatibiliteitspad `canvasHostUrl`, `canvasCapability`
of `node.canvas.capability.refresh` niet; huidige native clients en
gateways moeten Plugin-oppervlakken gebruiken.

Wanneer er geen devicetoken wordt uitgegeven, rapporteert `hello-ok.auth` de
onderhandelde permissies zonder tokenvelden:

```json
{
  "auth": {
    "role": "operator",
    "scopes": ["operator.read", "operator.write"]
  }
}
```

Vertrouwde backend-clients in hetzelfde proces (`client.id: "gateway-client"`,
`client.mode: "backend"`) mogen `device` weglaten op directe loopback-verbindingen
wanneer ze authenticeren met het gedeelde Gateway-token/wachtwoord. Dit pad is
gereserveerd voor interne control-plane-RPC's en voorkomt dat verouderde
CLI/device-koppelingsbaselines lokaal backendwerk blokkeren, zoals updates van
subagentsessies. Externe clients, browser-origin-clients, node-clients en
expliciete device-token/device-identity-clients blijven de normale pairing- en
scope-upgradecontroles gebruiken.

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

Ingebouwde QR/setup-code-bootstrap is een vers mobiel overdrachtspad. Een
geslaagde baseline setup-code-connect retourneert een primair node-token plus
één begrensd operator-token:

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

De operator-overdracht is bewust begrensd, zodat QR-onboarding de mobiele
operator-loop kan starten zonder `operator.admin` of `operator.pairing` te verlenen.
Deze bevat wel `operator.talk.secrets`, zodat de native client de Talk-configuratie
kan lezen die na bootstrap nodig is. Bredere admin- en pairing-scopes vereisen
een afzonderlijk goedgekeurde operator-pairing of tokenflow. Clients moeten
`hello-ok.auth.deviceTokens` alleen persistent opslaan
wanneer de connect bootstrap-auth gebruikte op vertrouwd transport zoals `wss://` of
loopback/local pairing.

### Node-voorbeeld

```json
{
  "type": "req",
  "id": "…",
  "method": "connect",
  "params": {
    "minProtocol": 3,
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

## Framing

- **Request**: `{type:"req", id, method, params}`
- **Response**: `{type:"res", id, ok, payload|error}`
- **Event**: `{type:"event", event, payload, seq?, stateVersion?}`

Methoden met bijwerkingen vereisen **idempotency keys** (zie schema).

## Rollen + scopes

Voor het volledige operator-scope-model, controles tijdens goedkeuring en
semantiek van gedeelde geheimen, zie [Operator-scopes](/nl/gateway/operator-scopes).

### Rollen

- `operator` = control-plane-client (CLI/UI/automatisering).
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
Wanneer geheimen zijn inbegrepen, moeten clients de actieve Talk-providercredential
lezen uit `talk.resolved.config.apiKey`; `talk.providers.<id>.apiKey`
blijft source-vormig en kan een SecretRef-object of een geredigeerde string zijn.

Door Plugins geregistreerde Gateway-RPC-methoden kunnen hun eigen operator-scope
aanvragen, maar gereserveerde core-admin-prefixen (`config.*`, `exec.approvals.*`, `wizard.*`,
`update.*`) worden altijd opgelost naar `operator.admin`.

Method-scope is slechts de eerste gate. Sommige slash-commands die via
`chat.send` worden bereikt, passen daarbovenop strengere controles op commandniveau toe.
Bijvoorbeeld: persistente writes met `/config set` en `/config unset` vereisen
`operator.admin`.

`node.pair.approve` heeft ook een extra scopecontrole tijdens goedkeuring bovenop
de basismethod-scope:

- requests zonder command: `operator.pairing`
- requests met niet-exec-nodecommands: `operator.pairing` + `operator.write`
- requests die `system.run`, `system.run.prepare` of `system.which` bevatten:
  `operator.pairing` + `operator.admin`

### Caps/commands/permissies (node)

Nodes declareren capability-claims tijdens connect:

- `caps`: capability-categorieën op hoog niveau zoals `camera`, `canvas`, `screen`,
  `location`, `voice` en `talk`.
- `commands`: command-allowlist voor invoke.
- `permissions`: granulaire schakelaars (bijv. `screen.record`, `camera.capture`).

De Gateway behandelt deze als **claims** en handhaaft allowlists aan de serverzijde.

## Presence

- `system-presence` retourneert entries keyed by device identity.
- Presence-entries bevatten `deviceId`, `roles` en `scopes`, zodat UI's één rij per device kunnen tonen
  zelfs wanneer het verbindt als zowel **operator** als **node**.
- `node.list` bevat optionele velden `lastSeenAtMs` en `lastSeenReason`. Verbonden nodes rapporteren
  hun huidige verbindingstijd als `lastSeenAtMs` met reden `connect`; gepairde nodes kunnen ook
  duurzame background presence rapporteren wanneer een vertrouwd node-event hun pairingmetadata bijwerkt.

### Node background alive-event

Nodes mogen `node.event` aanroepen met `event: "node.presence.alive"` om vast te leggen dat een gepairde node
leefde tijdens een background wake zonder deze als verbonden te markeren.

```json
{
  "event": "node.presence.alive",
  "payloadJSON": "{\"trigger\":\"silent_push\",\"sentAtMs\":1737264000000,\"displayName\":\"Peter's iPhone\",\"version\":\"2026.4.28\",\"platform\":\"iOS 18.4.0\",\"deviceFamily\":\"iPhone\",\"modelIdentifier\":\"iPhone17,1\",\"pushTransport\":\"relay\"}"
}
```

`trigger` is een gesloten enum: `background`, `silent_push`, `bg_app_refresh`,
`significant_location`, `manual` of `connect`. Onbekende triggerstrings worden door de Gateway
genormaliseerd naar `background` vóór persistentie. Het event is alleen duurzaam voor geauthenticeerde
node-devicesessies; sessies zonder device of zonder pairing retourneren `handled: false`.

Geslaagde gateways retourneren een gestructureerd resultaat:

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

## Scoping van broadcast-events

Door de server gepushte WebSocket-broadcast-events zijn scope-gated, zodat pairing-scoped of node-only sessies niet passief sessie-inhoud ontvangen.

- **Chat-, agent- en tool-result-frames** (inclusief gestreamde `agent`-events en tool-call-resultaten) vereisen minimaal `operator.read`. Sessies zonder `operator.read` slaan deze frames volledig over.
- **Door Plugins gedefinieerde `plugin.*`-broadcasts** worden gated naar `operator.write` of `operator.admin`, afhankelijk van hoe de Plugin ze heeft geregistreerd.
- **Status- en transportevents** (`heartbeat`, `presence`, `tick`, connect/disconnect-lifecycle, enz.) blijven onbeperkt, zodat transportgezondheid zichtbaar blijft voor elke geauthenticeerde sessie.
- **Onbekende broadcast-eventfamilies** zijn standaard scope-gated (fail-closed), tenzij een geregistreerde handler ze expliciet versoepelt.

Elke clientverbinding houdt een eigen per-client-volgnummer bij, zodat broadcasts monotone volgorde op die socket behouden, zelfs wanneer verschillende clients verschillende scope-gefilterde subsets van de eventstream zien.

## Veelvoorkomende RPC-methodfamilies

Het publieke WS-oppervlak is breder dan de handshake/auth-voorbeelden hierboven. Dit
is geen gegenereerde dump — `hello-ok.features.methods` is een conservatieve
discovery-lijst opgebouwd uit `src/gateway/server-methods-list.ts` plus geladen
Plugin-/channel-methodexports. Behandel deze als feature discovery, niet als een volledige
opsomming van `src/gateway/server-methods/*.ts`.

  <AccordionGroup>
  <Accordion title="Systeem en identiteit">
    - `health` retourneert de gecachete of vers gepeilde Gateway-gezondheidssnapshot.
    - `diagnostics.stability` retourneert de recente begrensde recorder voor diagnostische stabiliteit. Deze bewaart operationele metadata zoals gebeurtenisnamen, aantallen, bytegroottes, geheugenuitlezingen, wachtrij-/sessiestatus, kanaal-/pluginnamen en sessie-id's. Deze bewaart geen chattekst, webhook-bodies, tooluitvoer, ruwe request- of response-bodies, tokens, cookies of geheime waarden. Operatorleestoegang is vereist.
    - `status` retourneert de Gateway-samenvatting in `/status`-stijl; gevoelige velden worden alleen opgenomen voor operatorclients met beheerdersbereik.
    - `gateway.identity.get` retourneert de Gateway-apparaatidentiteit die wordt gebruikt door relay- en koppelingsflows.
    - `system-presence` retourneert de huidige aanwezigheidssnapshot voor verbonden operator-/node-apparaten.
    - `system-event` voegt een systeemgebeurtenis toe en kan aanwezigheidscontext bijwerken/uitzenden.
    - `last-heartbeat` retourneert de laatst bewaarde Heartbeat-gebeurtenis.
    - `set-heartbeats` schakelt Heartbeat-verwerking op de Gateway in of uit.

  </Accordion>

  <Accordion title="Modellen en gebruik">
    - `models.list` retourneert de modelcatalogus die tijdens runtime is toegestaan. Geef `{ "view": "configured" }` door voor geconfigureerde modellen op picker-formaat (`agents.defaults.models` eerst, daarna `models.providers.*.models`), of `{ "view": "all" }` voor de volledige catalogus.
    - `usage.status` retourneert providergebruiksvensters/samenvattingen van resterend quotum.
    - `usage.cost` retourneert geaggregeerde kostengebruikssamenvattingen voor een datumbereik.
      Geef `agentId` door voor één agent, of `agentScope: "all"` om geconfigureerde agents te aggregeren.
    - `doctor.memory.status` retourneert gereedheid van vectorgeheugen / gecachete embeddings voor de actieve standaard-agentwerkruimte. Geef `{ "probe": true }` of `{ "deep": true }` alleen door wanneer de aanroeper expliciet een live embeddingprovider-ping wil. Dreaming-bewuste clients kunnen ook `{ "agentId": "agent-id" }` doorgeven om Dreaming-storestatistieken te beperken tot een geselecteerde agentwerkruimte; als `agentId` wordt weggelaten, blijft de terugval naar de standaardagent behouden en worden geconfigureerde Dreaming-werkruimten geaggregeerd.
    - `doctor.memory.dreamDiary`, `doctor.memory.backfillDreamDiary`, `doctor.memory.resetDreamDiary`, `doctor.memory.resetGroundedShortTerm`, `doctor.memory.repairDreamingArtifacts` en `doctor.memory.dedupeDreamDiary` accepteren optionele `{ "agentId": "agent-id" }`-parameters voor Dreaming-weergaven/acties van geselecteerde agents. Wanneer `agentId` wordt weggelaten, werken ze op de geconfigureerde standaard-agentwerkruimte.
    - `doctor.memory.remHarness` retourneert een begrensde, alleen-lezen REM-harnesspreview voor externe control-plane-clients. Deze kan werkruimtepaden, geheugenfragmenten, gerenderde grounded markdown en kandidaten voor diepe promotie bevatten, dus aanroepers hebben `operator.read` nodig.
    - `sessions.usage` retourneert gebruikssamenvattingen per sessie. Geef `agentId` door voor één
      agent, of `agentScope: "all"` om geconfigureerde agents samen weer te geven.
    - `sessions.usage.timeseries` retourneert tijdreeksgebruik voor één sessie.
    - `sessions.usage.logs` retourneert gebruikslogvermeldingen voor één sessie.

  </Accordion>

  <Accordion title="Kanalen en loginhelpers">
    - `channels.status` retourneert samenvattingen van ingebouwde + gebundelde kanaal-/pluginstatus.
    - `channels.logout` logt een specifiek kanaal/account uit waar het kanaal uitloggen ondersteunt.
    - `web.login.start` start een QR-/webloginflow voor de huidige QR-geschikte webkanaalprovider.
    - `web.login.wait` wacht tot die QR-/webloginflow is voltooid en start het kanaal bij succes.
    - `push.test` stuurt een test-APNs-push naar een geregistreerde iOS-node.
    - `voicewake.get` retourneert de opgeslagen wake-word-triggers.
    - `voicewake.set` werkt wake-word-triggers bij en zendt de wijziging uit.

  </Accordion>

  <Accordion title="Berichten en logs">
    - `send` is de directe RPC voor uitgaande levering voor kanaal-/account-/threadgerichte verzendingen buiten de chatrunner.
    - `logs.tail` retourneert de geconfigureerde Gateway-bestandslogtail met cursor-/limiet- en max-byte-instellingen.

  </Accordion>

  <Accordion title="Talk en TTS">
    - `talk.catalog` retourneert de alleen-lezen Talk-providercatalogus voor spraak, streamingtranscriptie en realtime stem. Deze bevat canonieke provider-id's, registry-aliassen, labels, geconfigureerde status, een optioneel groepsniveau-`ready`-resultaat, blootgestelde model-/stem-id's, canonieke modi, transports, brainstrategieën en realtime audio-/capabilityvlaggen zonder providergeheimen te retourneren of globale config te muteren. Huidige Gateways stellen `ready` in nadat runtime-providerselectie is toegepast; clients moeten de afwezigheid ervan behandelen als niet-geverifieerd voor compatibiliteit met oudere Gateways.
    - `talk.config` retourneert de effectieve Talk-configpayload; `includeSecrets` vereist `operator.talk.secrets` (of `operator.admin`).
    - `talk.session.create` maakt een door Gateway beheerde Talk-sessie voor `realtime/gateway-relay`, `transcription/gateway-relay` of `stt-tts/managed-room`. Voor `stt-tts/managed-room` moeten `operator.write`-aanroepers die `sessionKey` doorgeven ook `spawnedBy` doorgeven voor zichtbaarheid van session keys binnen bereik; het maken van een `sessionKey` zonder bereik en `brain: "direct-tools"` vereisen `operator.admin`.
    - `talk.session.join` valideert een managed-room-sessietoken, emit `session.ready`- of `session.replaced`-gebeurtenissen wanneer nodig, en retourneert room-/sessiemetadata plus recente Talk-gebeurtenissen zonder het platteteksttoken of de opgeslagen tokenhash.
    - `talk.session.appendAudio` voegt base64 PCM-invoeraudio toe aan door Gateway beheerde realtime relay- en transcriptiesessies.
    - `talk.session.startTurn`, `talk.session.endTurn` en `talk.session.cancelTurn` sturen de beurtlevenscyclus van managed rooms aan met weigering van stale turns voordat de status wordt gewist.
    - `talk.session.cancelOutput` stopt audio-uitvoer van de assistant, vooral voor VAD-gated barge-in in Gateway-relaysessies.
    - `talk.session.submitToolResult` voltooit een provider-toolaanroep die is geëmit door een door Gateway beheerde realtime relaysessie. Geef `options: { willContinue: true }` door voor tussentijdse tooluitvoer wanneer er nog een definitief resultaat volgt, of `options: { suppressResponse: true }` wanneer het toolresultaat de provideraanroep moet afhandelen zonder nog een realtime assistant-response te starten.
    - `talk.session.steer` stuurt stembesturing van een actieve run naar een door Gateway beheerde, agent-backed Talk-sessie. Deze accepteert `{ sessionId, text, mode? }`, waarbij `mode` `status`, `steer`, `cancel` of `followup` is; een weggelaten modus wordt geclassificeerd op basis van de gesproken tekst.
    - `talk.session.close` sluit een door Gateway beheerde relay-, transcriptie- of managed-room-sessie en emit terminale Talk-gebeurtenissen.
    - `talk.mode` stelt de huidige Talk-modusstatus in/verspreidt deze voor WebChat-/Control UI-clients.
    - `talk.client.create` maakt een door de client beheerde realtime providersessie met `webrtc` of `provider-websocket`, terwijl de Gateway eigenaar blijft van config, inloggegevens, instructies en toolbeleid.
    - `talk.client.toolCall` laat door de client beheerde realtime transports provider-toolaanroepen doorsturen naar Gateway-beleid. De eerste ondersteunde tool is `openclaw_agent_consult`; clients ontvangen een run-id en wachten op normale chatlevenscyclusgebeurtenissen voordat ze het providerspecifieke toolresultaat indienen.
    - `talk.client.steer` stuurt stembesturing van een actieve run voor door de client beheerde realtime transports. De Gateway resolveert de actieve ingebedde run vanuit `sessionKey` en retourneert een gestructureerd geaccepteerd/geweigerd resultaat in plaats van sturing stilzwijgend te laten vallen.
    - `talk.event` is het enige Talk-gebeurteniskanaal voor realtime, transcriptie, STT/TTS, managed-room, telefonie en vergaderadapters.
    - `talk.speak` synthetiseert spraak via de actieve Talk-spraakprovider.
    - `tts.status` retourneert de ingeschakelde TTS-status, actieve provider, fallbackproviders en providerconfigstatus.
    - `tts.providers` retourneert de zichtbare TTS-providerinventaris.
    - `tts.enable` en `tts.disable` schakelen de TTS-voorkeurenstatus.
    - `tts.setProvider` werkt de voorkeurs-TTS-provider bij.
    - `tts.convert` voert een eenmalige tekst-naar-spraakconversie uit.

  </Accordion>

  <Accordion title="Geheimen, config, update en wizard">
    - `secrets.reload` resolveert actieve SecretRefs opnieuw en wisselt runtime-geheimstatus alleen bij volledig succes.
    - `secrets.resolve` resolveert command-target geheimtoewijzingen voor een specifieke command-/targetset.
    - `config.get` retourneert de huidige configsnapshot en hash.
    - `config.set` schrijft een gevalideerde configpayload.
    - `config.patch` voegt een gedeeltelijke configupdate samen. Destructieve arrayvervanging
      vereist het betrokken pad in `replacePaths`; geneste arrays
      onder array-items gebruiken `[]`-paden zoals `agents.list[].skills`.
    - `config.apply` valideert + vervangt de volledige configpayload.
    - `config.schema` retourneert de live configschemapayload die wordt gebruikt door Control UI- en CLI-tooling: schema, `uiHints`, versie en generatiemetadata, inclusief plugin- + kanaalschemametadata wanneer de runtime deze kan laden. Het schema bevat veldmetadata `title` / `description` afgeleid van dezelfde labels en helptekst die door de UI worden gebruikt, inclusief geneste object-, wildcard-, array-item- en `anyOf` / `oneOf` / `allOf`-compositietakken wanneer passende velddocumentatie bestaat.
    - `config.schema.lookup` retourneert een padgebonden lookuppayload voor één configpad: genormaliseerd pad, een oppervlakkige schemanode, passende hint + `hintPath`, optionele `reloadKind` en directe kindsamenvattingen voor UI-/CLI-drilldown. `reloadKind` is één van `restart`, `hot` of `none` en weerspiegelt de Gateway-configherlaadplanner voor het gevraagde pad. Lookupschemanodes behouden de gebruikersgerichte docs en algemene validatievelden (`title`, `description`, `type`, `enum`, `const`, `format`, `pattern`, grenzen voor numeriek/string/array/object, en vlaggen zoals `additionalProperties`, `deprecated`, `readOnly`, `writeOnly`). Kindsamenvattingen tonen `key`, genormaliseerd `path`, `type`, `required`, `hasChildren`, optionele `reloadKind`, plus de passende `hint` / `hintPath`.
    - `update.run` voert de Gateway-updateflow uit en plant alleen een herstart wanneer de update zelf is geslaagd; aanroepers met een sessie kunnen `continuationMessage` opnemen zodat het opstarten één follow-up-agentbeurt hervat via de herstart-continueringswachtrij. Package-manager-updates en supervised git-checkout-updates vanuit de control plane gebruiken een losgekoppelde managed-service-overdracht in plaats van de package tree te vervangen of checkout-/builduitvoer binnen de live Gateway te muteren. Een gestarte overdracht retourneert `ok: true` met `result.reason: "managed-service-handoff-started"` en `handoff.status: "started"`; niet-beschikbare of mislukte overdrachten retourneren `ok: false` met `managed-service-handoff-unavailable` of `managed-service-handoff-failed`, plus `handoff.command` wanneer een handmatige shellupdate vereist is. Een niet-beschikbare overdracht betekent dat OpenClaw geen veilige supervisorgrens of duurzame service-identiteit heeft, zoals `OPENCLAW_SYSTEMD_UNIT` voor systemd. Tijdens een gestarte overdracht kan de herstartsentinel kort `stats.reason: "restart-health-pending"` rapporteren; de voortzetting wordt vertraagd totdat de CLI de herstarte Gateway verifieert en de definitieve `ok`-sentinel schrijft.
    - `update.status` ververst en retourneert de nieuwste update-herstartsentinel, inclusief de actieve versie na herstart wanneer beschikbaar.
    - `wizard.start`, `wizard.next`, `wizard.status` en `wizard.cancel` stellen de onboardingwizard beschikbaar via WS RPC.

  </Accordion>

  <Accordion title="Agent- en workspace-helpers">
    - `agents.list` retourneert geconfigureerde agentvermeldingen, inclusief effectief model en runtimemetadata.
    - `agents.create`, `agents.update` en `agents.delete` beheren agentrecords en workspace-koppelingen.
    - `agents.files.list`, `agents.files.get` en `agents.files.set` beheren de bootstrap-workspacebestanden die voor een agent beschikbaar zijn.
    - `tasks.list`, `tasks.get` en `tasks.cancel` stellen het Gateway-taaklogboek beschikbaar aan SDK- en operatorclients.
    - `artifacts.list`, `artifacts.get` en `artifacts.download` stellen uit transcript afgeleide artifactsamenvattingen en downloads beschikbaar voor een expliciete `sessionKey`-, `runId`- of `taskId`-scope. Run- en taakquery's bepalen server-side de eigenaarssessie en retourneren alleen transcriptmedia met overeenkomende herkomst; onveilige of lokale URL-bronnen retourneren niet-ondersteunde downloads in plaats van server-side op te halen.
    - `environments.list` en `environments.status` stellen alleen-lezen Gateway-lokale en Node-omgevingsdetectie beschikbaar voor SDK-clients.
    - `agent.identity.get` retourneert de effectieve assistentidentiteit voor een agent of sessie.
    - `agent.wait` wacht tot een run is voltooid en retourneert de terminale momentopname wanneer beschikbaar.

  </Accordion>

  <Accordion title="Sessiebeheer">
    - `sessions.list` retourneert de huidige sessie-index, inclusief `agentRuntime`-metadata per rij wanneer een agentruntime-backend is geconfigureerd.
    - `sessions.subscribe` en `sessions.unsubscribe` schakelen abonnementen op sessiewijzigingsgebeurtenissen voor de huidige WS-client in of uit.
    - `sessions.messages.subscribe` en `sessions.messages.unsubscribe` schakelen abonnementen op transcript-/berichtgebeurtenissen voor één sessie in of uit.
    - `sessions.preview` retourneert begrensde transcriptvoorbeelden voor specifieke sessiesleutels.
    - `sessions.describe` retourneert één Gateway-sessierij voor een exacte sessiesleutel.
    - `sessions.resolve` lost een sessiedoel op of canoniseert het.
    - `sessions.create` maakt een nieuwe sessievermelding.
    - `sessions.send` stuurt een bericht naar een bestaande sessie.
    - `sessions.steer` is de interrupt-and-steer-variant voor een actieve sessie.
    - `sessions.abort` breekt actief werk voor een sessie af. Een aanroeper kan `key` plus optioneel `runId` doorgeven, of alleen `runId` doorgeven voor actieve runs die de Gateway naar een sessie kan herleiden.
    - `sessions.patch` werkt sessiemetadata/-overrides bij en rapporteert het opgeloste canonieke model plus effectieve `agentRuntime`.
    - `sessions.reset`, `sessions.delete` en `sessions.compact` voeren sessieonderhoud uit.
    - `sessions.get` retourneert de volledige opgeslagen sessierij.
    - Chatuitvoering gebruikt nog steeds `chat.history`, `chat.send`, `chat.abort` en `chat.inject`. `chat.history` is weergavegenormaliseerd voor UI-clients: inline directivetags worden uit zichtbare tekst gestript, plattetekst-tool-call-XML-payloads (inclusief `<tool_call>...</tool_call>`, `<function_call>...</function_call>`, `<tool_calls>...</tool_calls>`, `<function_calls>...</function_calls>` en afgekorte tool-call-blokken) en gelekte ASCII-/full-width-modelcontroletokens worden gestript, pure silent-token-assistentrijen zoals exact `NO_REPLY` / `no_reply` worden weggelaten, en te grote rijen kunnen door placeholders worden vervangen.
    - `chat.message.get` is de additieve begrensde volledige-berichtlezer voor één zichtbare transcriptvermelding. Clients geven `sessionKey` door, optioneel `agentId` wanneer de sessieselectie agent-scoped is, plus een transcript-`messageId` die eerder via `chat.history` is getoond, en de Gateway retourneert dezelfde weergavegenormaliseerde projectie zonder de lichte afkappingslimiet van de geschiedenis wanneer de opgeslagen vermelding nog beschikbaar is en niet te groot is.
    - `chat.send` accepteert eenmalig `fastMode: "auto"` om snelle modus te gebruiken voor modelaanroepen die vóór de automatische cutoff zijn gestart, en daarna latere retry-, fallback-, tool-result- of continuation-aanroepen zonder snelle modus te starten. De cutoff is standaard 60 seconden en kan per model worden geconfigureerd met `agents.defaults.models["<provider>/<model>"].params.fastAutoOnSeconds`. Een `chat.send`-aanroeper kan eenmalig `fastAutoOnSeconds` doorgeven om de cutoff voor dat verzoek te overschrijven.

  </Accordion>

  <Accordion title="Apparaatkoppeling en apparaattokens">
    - `device.pair.list` retourneert in behandeling zijnde en goedgekeurde gekoppelde apparaten.
    - `device.pair.approve`, `device.pair.reject` en `device.pair.remove` beheren apparaatkoppelingsrecords.
    - `device.token.rotate` roteert een gekoppeld apparaattoken binnen de grenzen van zijn goedgekeurde rol en aanroeperscope.
    - `device.token.revoke` trekt een gekoppeld apparaattoken in binnen de grenzen van zijn goedgekeurde rol en aanroeperscope.

  </Accordion>

  <Accordion title="Node-koppeling, invoke en openstaand werk">
    - `node.pair.request`, `node.pair.list`, `node.pair.approve`, `node.pair.reject`, `node.pair.remove` en `node.pair.verify` dekken Node-koppeling en bootstrapverificatie.
    - `node.list` en `node.describe` retourneren bekende/verbonden Node-status.
    - `node.rename` werkt een gekoppeld Node-label bij.
    - `node.invoke` stuurt een commando door naar een verbonden Node.
    - `node.invoke.result` retourneert het resultaat voor een invoke-verzoek.
    - `node.event` draagt door Node veroorzaakte gebeurtenissen terug naar de gateway.
    - `node.pending.pull` en `node.pending.ack` zijn de queue-API's voor verbonden Nodes.
    - `node.pending.enqueue` en `node.pending.drain` beheren duurzaam openstaand werk voor offline/losgekoppelde Nodes.

  </Accordion>

  <Accordion title="Goedkeuringsfamilies">
    - `exec.approval.request`, `exec.approval.get`, `exec.approval.list` en `exec.approval.resolve` dekken eenmalige exec-goedkeuringsverzoeken plus lookup/replay van openstaande goedkeuringen.
    - `exec.approval.waitDecision` wacht op één openstaande exec-goedkeuring en retourneert de definitieve beslissing (of `null` bij timeout).
    - `exec.approvals.get` en `exec.approvals.set` beheren momentopnamen van gateway-exec-goedkeuringsbeleid.
    - `exec.approvals.node.get` en `exec.approvals.node.set` beheren Node-lokaal exec-goedkeuringsbeleid via Node-relaycommando's.
    - `plugin.approval.request`, `plugin.approval.list`, `plugin.approval.waitDecision` en `plugin.approval.resolve` dekken door plugins gedefinieerde goedkeuringsflows.

  </Accordion>

  <Accordion title="Automatisering, Skills en tools">
    - Automatisering: `wake` plant een onmiddellijke of volgende-heartbeat-wake-tekstinjectie; `cron.get`, `cron.list`, `cron.status`, `cron.add`, `cron.update`, `cron.remove`, `cron.run`, `cron.runs` beheren gepland werk.
    - `cron.run` blijft een enqueue-achtige RPC voor handmatige runs. Clients die voltooiingssemantiek nodig hebben, moeten de geretourneerde `runId` lezen en `cron.runs` pollen.
    - `cron.runs` accepteert een optioneel niet-leeg `runId`-filter, zodat clients één queued handmatige run kunnen volgen zonder te concurreren met andere geschiedenisvermeldingen voor dezelfde job.
    - Skills en tools: `commands.list`, `skills.*`, `tools.catalog`, `tools.effective`, `tools.invoke`.

  </Accordion>
</AccordionGroup>

### Veelvoorkomende gebeurtenisfamilies

- `chat`: UI-chatupdates zoals `chat.inject` en andere transcript-only chatgebeurtenissen. In protocol v4 bevatten delta-payloads `deltaText`; `message` blijft de cumulatieve assistentmomentopname. Niet-prefixvervangingen stellen `replace=true` in en gebruiken `deltaText` als vervangende tekst.
- `session.message`, `session.operation` en `session.tool`: transcript-, lopende sessieoperatie- en event-stream-updates voor een geabonneerde sessie.
- `sessions.changed`: sessie-index of metadata gewijzigd.
- `presence`: updates van systeemaanwezigheidsmomentopnamen.
- `tick`: periodieke keepalive-/liveness-gebeurtenis.
- `health`: update van gateway-gezondheidsmomentopname.
- `heartbeat`: update van heartbeat-eventstream.
- `cron`: wijzigingsgebeurtenis voor cron-run/job.
- `shutdown`: gateway-afsluitmelding.
- `node.pair.requested` / `node.pair.resolved`: levenscyclus van Node-koppeling.
- `node.invoke.request`: broadcast van Node-invoke-verzoek.
- `device.pair.requested` / `device.pair.resolved`: levenscyclus van gekoppeld apparaat.
- `voicewake.changed`: configuratie van wake-word-trigger gewijzigd.
- `exec.approval.requested` / `exec.approval.resolved`: levenscyclus van exec-goedkeuring.
- `plugin.approval.requested` / `plugin.approval.resolved`: levenscyclus van plugin-goedkeuring.

### Node-helpermethoden

- Nodes kunnen `skills.bins` aanroepen om de huidige lijst met uitvoerbare skill-bestanden voor auto-allow-controles op te halen.

### RPC's voor taaklogboek

Operatorclients kunnen Gateway-achtergrondtaakrecords inspecteren en annuleren via de RPC's voor het taaklogboek. Deze methoden retourneren opgeschoonde taaksamenvattingen, geen ruwe runtimestatus.

- `tasks.list` vereist `operator.read`.
  - Params: optioneel `status` (`"queued"`, `"running"`, `"completed"`, `"failed"`, `"cancelled"` of `"timed_out"`) of een array van die statussen, optioneel `agentId`, optioneel `sessionKey`, optioneel `limit` van `1` tot `500`, en optioneel string `cursor`.
  - Resultaat: `{ "tasks": TaskSummary[], "nextCursor"?: string }`.
- `tasks.get` vereist `operator.read`.
  - Params: `{ "taskId": string }`.
  - Resultaat: `{ "task": TaskSummary }`.
  - Ontbrekende taak-id's retourneren de Gateway-not-found-foutvorm.
- `tasks.cancel` vereist `operator.write`.
  - Params: `{ "taskId": string, "reason"?: string }`.
  - Resultaat:
    `{ "found": boolean, "cancelled": boolean, "reason"?: string, "task"?: TaskSummary }`.
  - `found` rapporteert of het logboek een overeenkomende taak had. `cancelled` rapporteert of de runtime annulering heeft geaccepteerd of geregistreerd.

`TaskSummary` bevat `id`, `status` en optionele metadata zoals `kind`, `runtime`, `title`, `agentId`, `sessionKey`, `childSessionKey`, `ownerKey`, `runId`, `taskId`, `flowId`, `parentTaskId`, `sourceId`, tijdstempels, voortgang, terminale samenvatting en opgeschoonde fouttekst. `agentId` identificeert de agent die de taak uitvoert; `sessionKey` en `ownerKey` behouden de aanvrager- en beheercontext.

### Operator-helpermethoden

- Operators mogen `commands.list` (`operator.read`) aanroepen om de runtime
  command-inventaris voor een agent op te halen.
  - `agentId` is optioneel; laat dit weg om de standaard agentwerkruimte te lezen.
  - `scope` bepaalt op welk oppervlak de primaire `name` zich richt:
    - `text` retourneert het primaire tekstcommandotoken zonder de voorafgaande `/`
    - `native` en het standaardpad `both` retourneren providervaardige native namen
      wanneer beschikbaar
  - `textAliases` bevat exacte slash-aliassen zoals `/model` en `/m`.
  - `nativeName` bevat de providervaardige native commandonaam wanneer die bestaat.
  - `provider` is optioneel en heeft alleen invloed op native naamgeving plus
    beschikbaarheid van native Plugin-commando's.
  - `includeArgs=false` laat geserialiseerde argumentmetadata weg uit de respons.
- Operators mogen `tools.catalog` (`operator.read`) aanroepen om de runtime-toolcatalogus voor een
  agent op te halen. De respons bevat gegroepeerde tools en herkomstmetadata:
  - `source`: `core` of `plugin`
  - `pluginId`: plugin-eigenaar wanneer `source="plugin"`
  - `optional`: of een plugin-tool optioneel is
- Operators mogen `tools.effective` (`operator.read`) aanroepen om de runtime-effectieve
  toolinventaris voor een sessie op te halen.
  - `sessionKey` is vereist.
  - De gateway leidt vertrouwde runtimecontext server-side af uit de sessie in plaats van
    door de aanroeper aangeleverde auth- of bezorgcontext te accepteren.
  - De respons is een sessiegebonden, server-afgeleide projectie van de actieve inventaris,
    inclusief core-, plugin-, kanaal- en al ontdekte MCP-servertools.
  - `tools.effective` is alleen-lezen voor MCP: het kan een warme MCP-catalogus van de sessie door het
    uiteindelijke toolbeleid projecteren, maar het maakt geen MCP-runtimes aan, verbindt geen transports en geeft geen
    `tools/list` uit. Als er geen overeenkomende warme catalogus bestaat, kan de respons een melding bevatten zoals
    `mcp-not-yet-connected`, `mcp-not-yet-listed` of `mcp-stale-catalog`.
  - Effectieve toolitems gebruiken `source="core"`, `source="plugin"`, `source="channel"` of
    `source="mcp"`.
- Operators mogen `tools.invoke` (`operator.write`) aanroepen om één beschikbare tool aan te roepen via hetzelfde
  gatewaybeleidspad als `/tools/invoke`.
  - `name` is vereist. `args`, `sessionKey`, `agentId`, `confirm` en
    `idempotencyKey` zijn optioneel.
  - Als zowel `sessionKey` als `agentId` aanwezig zijn, moet de opgeloste sessie-agent overeenkomen met
    `agentId`.
  - Core-wrappers alleen voor eigenaren, zoals `cron`, `gateway` en `nodes`, vereisen
    eigenaar-/adminidentiteit (`operator.admin`), ook al is de methode `tools.invoke`
    zelf `operator.write`.
  - De respons is een SDK-gerichte envelope met `ok`, `toolName`, optionele `output` en getypeerde
    `error`-velden. Goedkeurings- of beleidsweigeringen retourneren `ok:false` in de payload in plaats van
    de gateway-toolbeleidspijplijn te omzeilen.
- Operators mogen `skills.status` (`operator.read`) aanroepen om de zichtbare
  Skills-inventaris voor een agent op te halen.
  - `agentId` is optioneel; laat dit weg om de standaard agentwerkruimte te lezen.
  - De respons bevat geschiktheid, ontbrekende vereisten, configuratiecontroles en
    opgeschoonde installatieopties zonder ruwe geheime waarden bloot te geven.
- Operators mogen `skills.search` en `skills.detail` (`operator.read`) aanroepen voor
  ClawHub-ontdekkingsmetadata.
- Operators mogen `skills.upload.begin`, `skills.upload.chunk` en
  `skills.upload.commit` (`operator.admin`) aanroepen om een privé-Skills-archief te stagen
  voordat het wordt geïnstalleerd. Dit is een afzonderlijk admin-uploadpad voor vertrouwde clients,
  niet de normale ClawHub-Skills-installatiestroom, en is standaard uitgeschakeld tenzij
  `skills.install.allowUploadedArchives` is ingeschakeld.
  - `skills.upload.begin({ kind: "skill-archive", slug, sizeBytes, sha256?, force?, idempotencyKey? })`
    maakt een upload aan die aan die slug- en force-waarde is gebonden.
  - `skills.upload.chunk({ uploadId, offset, dataBase64 })` voegt bytes toe op
    de exacte gedecodeerde offset.
  - `skills.upload.commit({ uploadId, sha256? })` verifieert de uiteindelijke grootte en
    SHA-256. Commit voltooit alleen de upload; het installeert de Skill niet.
  - Geüploade Skills-archieven zijn zip-archieven met een `SKILL.md`-root. De
    interne directorynaam van het archief selecteert nooit het installatiedoel.
- Operators mogen `skills.install` (`operator.admin`) in drie modi aanroepen:
  - ClawHub-modus: `{ source: "clawhub", slug, version?, force? }` installeert een
    Skills-map in de standaarddirectory `skills/` van de agentwerkruimte.
  - Uploadmodus: `{ source: "upload", uploadId, slug, force?, sha256?, timeoutMs? }`
    installeert een gecommitte upload in de directory `skills/<slug>` van de standaard agentwerkruimte.
    De slug- en force-waarde moeten overeenkomen met het oorspronkelijke
    `skills.upload.begin`-verzoek. Deze modus wordt geweigerd tenzij
    `skills.install.allowUploadedArchives` is ingeschakeld. De instelling heeft geen
    invloed op ClawHub-installaties.
  - Gateway-installermodus: `{ name, installId, timeoutMs? }`
    voert een gedeclareerde `metadata.openclaw.install`-actie uit op de gateway-host.
    Oudere clients kunnen nog steeds `dangerouslyForceUnsafeInstall` sturen; dit veld is
    verouderd, wordt alleen geaccepteerd voor protocolcompatibiliteit en wordt genegeerd. Gebruik
    `security.installPolicy` voor door operators beheerde installatiebeslissingen.
- Operators mogen `skills.update` (`operator.admin`) in twee modi aanroepen:
  - ClawHub-modus werkt één gevolgde slug bij of alle gevolgde ClawHub-installaties in
    de standaard agentwerkruimte.
  - Configuratiemodus patcht `skills.entries.<skillKey>`-waarden zoals `enabled`,
    `apiKey` en `env`.

### `models.list`-weergaven

`models.list` accepteert een optionele parameter `view`:

- Weggelaten of `"default"`: huidig runtimegedrag. Als `agents.defaults.models` is geconfigureerd, is de respons de toegestane catalogus, inclusief dynamisch ontdekte modellen voor `provider/*`-items. Anders is de respons de volledige Gateway-catalogus.
- `"configured"`: gedrag op picker-formaat. Als `agents.defaults.models` is geconfigureerd, blijft dat leidend, inclusief providergebonden ontdekking voor `provider/*`-items. Zonder allowlist gebruikt de respons expliciete `models.providers.*.models`-items, met terugval naar de volledige catalogus alleen wanneer er geen geconfigureerde modelrijen bestaan.
- `"all"`: volledige Gateway-catalogus, waarbij `agents.defaults.models` wordt omzeild. Gebruik dit voor diagnostiek en ontdekkings-UI's, niet voor normale modelpickers.

## Exec-goedkeuringen

- Wanneer een exec-verzoek goedkeuring nodig heeft, broadcast de gateway `exec.approval.requested`.
- Operatorclients lossen dit op door `exec.approval.resolve` aan te roepen (vereist scope `operator.approvals`).
- Voor `host=node` moet `exec.approval.request` `systemRunPlan` bevatten (canonieke `argv`/`cwd`/`rawCommand`/sessiemetadata). Verzoeken zonder `systemRunPlan` worden geweigerd.
- Na goedkeuring hergebruiken doorgestuurde `node.invoke system.run`-aanroepen dat canonieke
  `systemRunPlan` als de gezaghebbende command-/cwd-/sessiecontext.
- Als een aanroeper `command`, `rawCommand`, `cwd`, `agentId` of
  `sessionKey` wijzigt tussen voorbereiding en de uiteindelijke goedgekeurde doorsturing van `system.run`, weigert de
  gateway de run in plaats van de gewijzigde payload te vertrouwen.

## Terugval voor agentbezorging

- `agent`-verzoeken kunnen `deliver=true` bevatten om uitgaande bezorging aan te vragen.
- `bestEffortDeliver=false` behoudt strikt gedrag: niet-opgeloste of alleen-interne bezorgdoelen retourneren `INVALID_REQUEST`.
- `bestEffortDeliver=true` staat terugval naar alleen-sessie-uitvoering toe wanneer geen externe leverbare route kan worden opgelost (bijvoorbeeld interne/webchatsessies of ambigue multikanaalconfiguraties).
- Uiteindelijke `agent`-resultaten kunnen `result.deliveryStatus` bevatten wanneer bezorging was
  aangevraagd, met dezelfde statussen `sent`, `suppressed`, `partial_failed` en `failed`
  die zijn gedocumenteerd voor [`openclaw agent --json --deliver`](/nl/cli/agent#json-delivery-status).

## Versionering

- `PROTOCOL_VERSION` staat in `packages/gateway-protocol/src/version.ts`.
- Clients sturen `minProtocol` + `maxProtocol`; de server weigert bereiken die
  het huidige protocol niet bevatten. Huidige clients en servers vereisen
  protocol v4.
- Schema's + modellen worden gegenereerd uit TypeBox-definities:
  - `pnpm protocol:gen`
  - `pnpm protocol:gen:swift`
  - `pnpm protocol:check`

### Clientconstanten

De referentieclient in `src/gateway/client.ts` gebruikt deze standaardwaarden. Waarden zijn
stabiel binnen protocol v4 en vormen de verwachte baseline voor clients van derden.

| Constante                                 | Standaard                                             | Bron                                                                                       |
| ----------------------------------------- | ----------------------------------------------------- | ------------------------------------------------------------------------------------------ |
| `PROTOCOL_VERSION`                        | `4`                                                   | `packages/gateway-protocol/src/version.ts`                                                 |
| `MIN_CLIENT_PROTOCOL_VERSION`             | `4`                                                   | `packages/gateway-protocol/src/version.ts`                                                 |
| Verzoektimeout (per RPC)                  | `30_000` ms                                           | `src/gateway/client.ts` (`requestTimeoutMs`)                                               |
| Preauth-/connect-challenge-timeout        | `15_000` ms                                           | `src/gateway/handshake-timeouts.ts` (config/env kan het gekoppelde server-/clientbudget verhogen) |
| Initiële reconnect-backoff                | `1_000` ms                                            | `src/gateway/client.ts` (`backoffMs`)                                                      |
| Maximale reconnect-backoff                | `30_000` ms                                           | `src/gateway/client.ts` (`scheduleReconnect`)                                              |
| Fast-retry-klem na sluiten van device-token | `250` ms                                            | `src/gateway/client.ts`                                                                    |
| Force-stop-gratie vóór `terminate()`      | `250` ms                                              | `FORCE_STOP_TERMINATE_GRACE_MS`                                                            |
| Standaardtimeout voor `stopAndWait()`     | `1_000` ms                                            | `STOP_AND_WAIT_TIMEOUT_MS`                                                                 |
| Standaard tick-interval (vóór `hello-ok`) | `30_000` ms                                           | `src/gateway/client.ts`                                                                    |
| Sluiten bij tick-timeout                  | code `4000` wanneer stilte `tickIntervalMs * 2` overschrijdt | `src/gateway/client.ts`                                                              |
| `MAX_PAYLOAD_BYTES`                       | `25 * 1024 * 1024` (25 MB)                            | `src/gateway/server-constants.ts`                                                          |

De server adverteert de effectieve `policy.tickIntervalMs`, `policy.maxPayload`
en `policy.maxBufferedBytes` in `hello-ok`; clients moeten die waarden respecteren
in plaats van de standaardwaarden van vóór de handshake.

## Auth

- Gateway-authenticatie met gedeeld geheim gebruikt `connect.params.auth.token` of
  `connect.params.auth.password`, afhankelijk van de geconfigureerde authenticatiemodus.
- Modi met identiteit, zoals Tailscale Serve
  (`gateway.auth.allowTailscale: true`) of niet-loopback
  `gateway.auth.mode: "trusted-proxy"` voldoen aan de connect-authenticatiecontrole via
  requestheaders in plaats van `connect.params.auth.*`.
- Private-ingress `gateway.auth.mode: "none"` slaat connect-authenticatie met gedeeld geheim
  volledig over; stel die modus niet bloot op publieke/niet-vertrouwde ingress.
- Na koppeling geeft de Gateway een **apparaattoken** uit, beperkt tot de verbindingsrol
  + scopes. Het wordt geretourneerd in `hello-ok.auth.deviceToken` en moet door
  de client worden bewaard voor toekomstige verbindingen.
- Clients moeten de primaire `hello-ok.auth.deviceToken` bewaren na elke
  geslaagde verbinding.
- Opnieuw verbinden met dat **opgeslagen** apparaattoken moet ook de opgeslagen
  goedgekeurde scopeset voor dat token hergebruiken. Dit behoudt lees-/probe-/status-toegang
  die al was toegekend en voorkomt dat herverbindingen stilzwijgend terugvallen naar een
  smallere impliciete alleen-admin-scope.
- Samenstelling van connect-authenticatie aan clientzijde (`selectConnectAuth` in
  `src/gateway/client.ts`):
  - `auth.password` is orthogonaal en wordt altijd doorgestuurd wanneer ingesteld.
  - `auth.token` wordt ingevuld in prioriteitsvolgorde: eerst expliciet gedeeld token,
    daarna een expliciete `deviceToken`, daarna een opgeslagen token per apparaat (gesleuteld op
    `deviceId` + `role`).
  - `auth.bootstrapToken` wordt alleen verzonden wanneer geen van de bovenstaande opties een
    `auth.token` opleverde. Een gedeeld token of elk opgelost apparaattoken onderdrukt dit.
  - Automatische promotie van een opgeslagen apparaattoken bij de eenmalige
    `AUTH_TOKEN_MISMATCH`-herpoging is beperkt tot **alleen vertrouwde eindpunten**:
    loopback, of `wss://` met een vastgezette `tlsFingerprint`. Publieke `wss://`
    zonder pinning komt niet in aanmerking.
- Ingebouwde setup-code-bootstrap retourneert het primaire node-
  `hello-ok.auth.deviceToken` plus een begrensd operatortoken in
  `hello-ok.auth.deviceTokens` voor vertrouwde mobiele overdracht. Het operatortoken
  bevat `operator.talk.secrets` voor native Talk-configuratielezingen en
  sluit `operator.admin` en `operator.pairing` uit.
- Terwijl een niet-baseline setup-code-bootstrap op goedkeuring wacht, bevatten `PAIRING_REQUIRED`-
  details `recommendedNextStep: "wait_then_retry"`, `retryable: true`,
  en `pauseReconnect: false`. Clients moeten opnieuw blijven verbinden met hetzelfde
  bootstraptoken totdat de aanvraag is goedgekeurd of het token ongeldig wordt.
- Bewaar `hello-ok.auth.deviceTokens` alleen wanneer de verbinding bootstrap-authenticatie gebruikte
  op een vertrouwd transport zoals `wss://` of loopback/lokale koppeling.
- Als een client een **expliciete** `deviceToken` of expliciete `scopes` opgeeft, blijft die
  door de aanroeper gevraagde scopeset leidend; gecachte scopes worden alleen
  hergebruikt wanneer de client het opgeslagen token per apparaat hergebruikt.
- Apparaattokens kunnen worden geroteerd/ingetrokken via `device.token.rotate` en
  `device.token.revoke` (vereist `operator.pairing`-scope). Het roteren of
  intrekken van een node of andere niet-operatorrol vereist ook `operator.admin`.
- `device.token.rotate` retourneert rotatiemetadata. Het echoot het vervangende
  bearer-token alleen voor oproepen vanaf hetzelfde apparaat die al met
  dat apparaattoken zijn geauthenticeerd, zodat clients met alleen tokens hun vervanging kunnen bewaren voordat
  ze opnieuw verbinden. Rotaties met gedeeld/admin-token echoën het bearer-token niet.
- Tokenuitgifte, -rotatie en -intrekking blijven beperkt tot de goedgekeurde rollenset
  die in de koppelingsvermelding van dat apparaat is vastgelegd; tokenmutatie kan een
  apparaatrol die nooit door koppelingsgoedkeuring is verleend niet uitbreiden of
  als doel nemen.
- Voor gekoppelde-apparaat-tokensessies is apparaatbeheer self-scoped tenzij de
  aanroeper ook `operator.admin` heeft: niet-admin-aanroepers kunnen alleen het
  operatortoken voor hun **eigen** apparaatvermelding beheren. Beheer van node- en andere
  niet-operatortokens is alleen voor admins, zelfs voor het eigen apparaat van de aanroeper.
- `device.token.rotate` en `device.token.revoke` controleren ook de scopeset van het doel-operator-
  token tegen de huidige sessiescopes van de aanroeper. Niet-admin-aanroepers
  kunnen geen breder operatortoken roteren of intrekken dan ze zelf al hebben.
- Authenticatiefouten bevatten `error.details.code` plus herstelhints:
  - `error.details.canRetryWithDeviceToken` (boolean)
  - `error.details.recommendedNextStep` (`retry_with_device_token`, `update_auth_configuration`, `update_auth_credentials`, `wait_then_retry`, `review_auth_configuration`)
- Clientgedrag voor `AUTH_TOKEN_MISMATCH`:
  - Vertrouwde clients mogen één begrensde herpoging proberen met een gecacht token per apparaat.
  - Als die herpoging mislukt, moeten clients automatische herverbindingslussen stoppen en begeleiding voor operatoractie tonen.
- `AUTH_SCOPE_MISMATCH` betekent dat het apparaattoken werd herkend maar de
  gevraagde rol/scopes niet dekt. Clients moeten dit niet presenteren als een slecht token;
  vraag de operator om opnieuw te koppelen of het smallere/bredere scopecontract goed te keuren.

## Apparaatidentiteit + koppeling

- Nodes moeten een stabiele apparaatidentiteit (`device.id`) opnemen, afgeleid van een
  keypair-vingerafdruk.
- Gateways geven tokens uit per apparaat + rol.
- Koppelingsgoedkeuringen zijn vereist voor nieuwe apparaat-ID's tenzij lokale automatische goedkeuring
  is ingeschakeld.
- Automatische goedkeuring van koppeling is gecentreerd rond directe local loopback-verbindingen.
- OpenClaw heeft ook een smal backend-/container-lokaal zelfverbindingspad voor
  vertrouwde helperflows met gedeeld geheim.
- Same-host tailnet- of LAN-verbindingen worden nog steeds als remote behandeld voor koppeling en
  vereisen goedkeuring.
- WS-clients nemen normaal `device`-identiteit op tijdens `connect` (operator +
  node). De enige operatoruitzonderingen zonder apparaat zijn expliciete vertrouwenspaden:
  - `gateway.controlUi.allowInsecureAuth=true` voor alleen-localhost onveilige HTTP-compatibiliteit.
  - geslaagde operator-Control UI-authenticatie met `gateway.auth.mode: "trusted-proxy"`.
  - `gateway.controlUi.dangerouslyDisableDeviceAuth=true` (break-glass, ernstige beveiligingsverlaging).
  - direct-loopback `gateway-client` backend-RPC's op het gereserveerde interne
    helperpad.
- Het weglaten van apparaatidentiteit heeft scopegevolgen. Wanneer een operatorverbinding
  zonder apparaat via een expliciet vertrouwenspad is toegestaan, wist OpenClaw nog steeds
  zelf gedeclareerde scopes naar een lege set, tenzij dat pad een benoemde
  scopebehoud-uitzondering heeft. Scope-gated methoden mislukken dan met
  `missing scope`.
- `gateway.controlUi.dangerouslyDisableDeviceAuth=true` is een Control UI-
  break-glass-pad voor scopebehoud. Het kent geen scopes toe aan willekeurige
  aangepaste backend- of CLI-vormige WebSocket-clients.
- Het gereserveerde direct-loopback `gateway-client` backend-helperpad behoudt
  scopes alleen voor interne lokale control-plane-RPC's; aangepaste backend-ID's krijgen
  deze uitzondering niet.
- Alle verbindingen moeten de door de server verstrekte `connect.challenge`-nonce ondertekenen.

### Diagnostiek voor apparaat-authenticatiemigratie

Voor legacy clients die nog steeds pre-challenge ondertekeningsgedrag gebruiken, retourneert `connect` nu
`DEVICE_AUTH_*`-detailcodes onder `error.details.code` met een stabiele `error.details.reason`.

Veelvoorkomende migratiefouten:

| Bericht                     | details.code                     | details.reason           | Betekenis                                          |
| --------------------------- | -------------------------------- | ------------------------ | -------------------------------------------------- |
| `device nonce required`     | `DEVICE_AUTH_NONCE_REQUIRED`     | `device-nonce-missing`   | Client liet `device.nonce` weg (of stuurde leeg).  |
| `device nonce mismatch`     | `DEVICE_AUTH_NONCE_MISMATCH`     | `device-nonce-mismatch`  | Client ondertekende met een verouderde/verkeerde nonce. |
| `device signature invalid`  | `DEVICE_AUTH_SIGNATURE_INVALID`  | `device-signature`       | Handtekeningpayload komt niet overeen met v2-payload. |
| `device signature expired`  | `DEVICE_AUTH_SIGNATURE_EXPIRED`  | `device-signature-stale` | Ondertekende timestamp ligt buiten toegestane skew. |
| `device identity mismatch`  | `DEVICE_AUTH_DEVICE_ID_MISMATCH` | `device-id-mismatch`     | `device.id` komt niet overeen met publieke-sleutelvingerafdruk. |
| `device public key invalid` | `DEVICE_AUTH_PUBLIC_KEY_INVALID` | `device-public-key`      | Publieke-sleutelformaat/canonicalisatie mislukt.   |

Migratiedoel:

- Wacht altijd op `connect.challenge`.
- Onderteken de v2-payload die de servernonce bevat.
- Stuur dezelfde nonce in `connect.params.device.nonce`.
- De voorkeurs-handtekeningpayload is `v3`, die `platform` en `deviceFamily`
  bindt naast apparaat-/client-/rol-/scope-/token-/noncevelden.
- Legacy `v2`-handtekeningen blijven geaccepteerd voor compatibiliteit, maar metadata-pinning
  van gekoppelde apparaten blijft het opdrachtbeleid bij opnieuw verbinden bepalen.

## TLS + pinning

- TLS wordt ondersteund voor WS-verbindingen.
- Clients kunnen optioneel de certificaatvingerafdruk van de Gateway pinnen (zie `gateway.tls`-
  config plus `gateway.remote.tlsFingerprint` of CLI `--tls-fingerprint`).

## Scope

Dit protocol stelt de **volledige Gateway-API** beschikbaar (status, kanalen, modellen, chat,
agent, sessies, nodes, goedkeuringen, enz.). Het exacte oppervlak wordt gedefinieerd door de
TypeBox-schema's in `packages/gateway-protocol/src/schema.ts`.

## Gerelateerd

- [Bridge-protocol](/nl/gateway/bridge-protocol)
- [Gateway-runbook](/nl/gateway)
