---
read_when:
    - Gateway-WS-clients implementeren of bijwerken
    - Foutopsporing bij protocolverschillen of verbindingsfouten
    - Protocolschema/-modellen opnieuw genereren
summary: 'Gateway WebSocket-protocol: handshake, frames, versionering'
title: Gateway-protocol
x-i18n:
    generated_at: "2026-05-07T13:18:40Z"
    model: gpt-5.5
    provider: openai
    source_hash: 75580b3ad8b2a511cf53975b8d734d18db88bcbfe33bd62c360c24333d65d1c6
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
- Pre-connect-frames zijn beperkt tot 64 KiB. Na een geslaagde handshake moeten clients
  de limieten `hello-ok.policy.maxPayload` en
  `hello-ok.policy.maxBufferedBytes` volgen. Met diagnostiek ingeschakeld
  genereren te grote inkomende frames en trage uitgaande buffers `payload.large`-events
  voordat de Gateway sluit of het betreffende frame laat vallen. Deze events bewaren
  groottes, limieten, oppervlakken en veilige redencodes. Ze bewaren niet de berichttekst,
  bijlage-inhoud, ruwe frame-inhoud, tokens, cookies of geheime waarden.

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

Terwijl de Gateway nog bezig is met het afronden van opstart-sidecars, kan het `connect`-request
een opnieuw te proberen `UNAVAILABLE`-fout retourneren met `details.reason` ingesteld op
`"startup-sidecars"` en `retryAfterMs`. Clients moeten die response opnieuw proberen
binnen hun totale verbindingsbudget in plaats van deze als een terminale
handshakefout te tonen.

`server`, `features`, `snapshot` en `policy` zijn allemaal vereist door het schema
(`src/gateway/protocol/schema/frames.ts`). `auth` is ook vereist en rapporteert
de onderhandelde rol/scopes. `pluginSurfaceUrls` is optioneel en koppelt Plugin-
oppervlaknamen, zoals `canvas`, aan scoped gehoste URL's.

Scoped Plugin-oppervlak-URL's kunnen verlopen. Nodes kunnen
`node.pluginSurface.refresh` aanroepen met `{ "surface": "canvas" }` om een nieuwe
entry in `pluginSurfaceUrls` te ontvangen. De experimentele Canvas Plugin-refactor ondersteunt niet
het verouderde compatibiliteitspad `canvasHostUrl`, `canvasCapability` of
`node.canvas.capability.refresh`; huidige native clients en
gateways moeten Plugin-oppervlakken gebruiken.

Wanneer er geen device-token wordt uitgegeven, rapporteert `hello-ok.auth` de onderhandelde
machtigingen zonder tokenvelden:

```json
{
  "auth": {
    "role": "operator",
    "scopes": ["operator.read", "operator.write"]
  }
}
```

Vertrouwde backend-clients binnen hetzelfde proces (`client.id: "gateway-client"`,
`client.mode: "backend"`) mogen `device` weglaten bij directe local loopback-verbindingen wanneer
ze authenticeren met het gedeelde Gateway-token/wachtwoord. Dit pad is gereserveerd
voor interne RPC's van het besturingsvlak en voorkomt dat verouderde CLI/device-koppelingsbaselines
lokaal backend-werk blokkeren, zoals subagent-sessie-updates. Externe clients,
browser-origin-clients, node-clients en expliciete device-token/device-identiteit-
clients gebruiken nog steeds de normale koppelings- en scope-upgradecontroles.

Wanneer een device-token wordt uitgegeven, bevat `hello-ok` ook:

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
begrensde rolentries in `deviceTokens` bevatten:

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

Voor de ingebouwde node/operator-bootstrapflow blijft het primaire node-token
`scopes: []` en blijft elk overgedragen operator-token begrensd tot de bootstrap-
operator-allowlist (`operator.approvals`, `operator.read`,
`operator.talk.secrets`, `operator.write`). Bootstrap-scopecontroles blijven
rolgeprefixd: operatorentries voldoen alleen aan operator-requests, en niet-operator-
rollen hebben nog steeds scopes nodig onder hun eigen rolprefix.

### Node-voorbeeld

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

## Framing

- **Request**: `{type:"req", id, method, params}`
- **Response**: `{type:"res", id, ok, payload|error}`
- **Event**: `{type:"event", event, payload, seq?, stateVersion?}`

Methoden met bijwerkingen vereisen **idempotentiesleutels** (zie schema).

## Rollen + scopes

Voor het volledige operator-scope-model, controles tijdens goedkeuring en
semantiek van gedeelde geheimen, zie [Operator-scopes](/nl/gateway/operator-scopes).

### Rollen

- `operator` = client van het besturingsvlak (CLI/UI/automatisering).
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

Door Plugins geregistreerde Gateway RPC-methoden kunnen hun eigen operator-scope aanvragen, maar
gereserveerde core-adminprefixen (`config.*`, `exec.approvals.*`, `wizard.*`,
`update.*`) worden altijd herleid tot `operator.admin`.

Methodscope is alleen de eerste poort. Sommige slash-commando's die via
`chat.send` worden bereikt, passen daarbovenop strengere controles op commandoniveau toe. Bijvoorbeeld: persistente
`/config set`- en `/config unset`-schrijfacties vereisen `operator.admin`.

`node.pair.approve` heeft ook een extra scopecontrole tijdens goedkeuring bovenop de
basismethodscope:

- requests zonder commando: `operator.pairing`
- requests met non-exec-nodecommando's: `operator.pairing` + `operator.write`
- requests die `system.run`, `system.run.prepare` of `system.which` bevatten:
  `operator.pairing` + `operator.admin`

### Caps/commando's/machtigingen (node)

Nodes declareren capability-claims tijdens het verbinden:

- `caps`: capability-categorieën op hoog niveau, zoals `camera`, `canvas`, `screen`,
  `location`, `voice` en `talk`.
- `commands`: commando-allowlist voor invoke.
- `permissions`: granulaire schakelaars (bijv. `screen.record`, `camera.capture`).

De Gateway behandelt deze als **claims** en dwingt server-side allowlists af.

## Aanwezigheid

- `system-presence` retourneert entries gesleuteld op device-identiteit.
- Aanwezigheidsentries bevatten `deviceId`, `roles` en `scopes`, zodat UI's één rij per device kunnen tonen
  zelfs wanneer het verbindt als zowel **operator** als **node**.
- `node.list` bevat optionele velden `lastSeenAtMs` en `lastSeenReason`. Verbonden nodes rapporteren
  hun huidige verbindingstijd als `lastSeenAtMs` met reden `connect`; gekoppelde nodes kunnen ook
  duurzame achtergrondaanwezigheid rapporteren wanneer een vertrouwd node-event hun koppelingsmetadata bijwerkt.

### Achtergrond-alive-event van node

Nodes kunnen `node.event` aanroepen met `event: "node.presence.alive"` om vast te leggen dat een gekoppelde node
alive was tijdens een background wake zonder deze als verbonden te markeren.

```json
{
  "event": "node.presence.alive",
  "payloadJSON": "{\"trigger\":\"silent_push\",\"sentAtMs\":1737264000000,\"displayName\":\"Peter's iPhone\",\"version\":\"2026.4.28\",\"platform\":\"iOS 18.4.0\",\"deviceFamily\":\"iPhone\",\"modelIdentifier\":\"iPhone17,1\",\"pushTransport\":\"relay\"}"
}
```

`trigger` is een gesloten enum: `background`, `silent_push`, `bg_app_refresh`,
`significant_location`, `manual` of `connect`. Onbekende triggerstrings worden door de gateway
genormaliseerd naar `background` vóór persistentie. Het event is alleen duurzaam voor geauthenticeerde node-
devicesessies; device-loze of ongekoppelde sessies retourneren `handled: false`.

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
bevestigde RPC, niet als duurzame aanwezigheidspersistentie.

## Scoping van broadcast-events

Door de server gepushte WebSocket-broadcast-events zijn scope-gated, zodat sessies met pairing-scope of alleen node-sessies niet passief sessie-inhoud ontvangen.

- **Chat-, agent- en tool-result-frames** (inclusief gestreamde `agent`-events en tool call-resultaten) vereisen ten minste `operator.read`. Sessies zonder `operator.read` slaan deze frames volledig over.
- **Door Plugins gedefinieerde `plugin.*`-broadcasts** zijn gated op `operator.write` of `operator.admin`, afhankelijk van hoe de Plugin ze heeft geregistreerd.
- **Status- en transportevents** (`heartbeat`, `presence`, `tick`, connect/disconnect-levenscyclus, enz.) blijven onbeperkt, zodat transportgezondheid voor elke geauthenticeerde sessie observeerbaar blijft.
- **Onbekende broadcast-eventfamilies** zijn standaard scope-gated (fail-closed), tenzij een geregistreerde handler ze expliciet versoepelt.

Elke clientverbinding behoudt zijn eigen sequence number per client, zodat broadcasts monotone ordening op die socket behouden, zelfs wanneer verschillende clients verschillende scope-gefilterde subsets van de eventstream zien.

## Veelvoorkomende RPC-methodfamilies

Het publieke WS-oppervlak is breder dan de handshake-/auth-voorbeelden hierboven. Dit
is geen gegenereerde dump — `hello-ok.features.methods` is een conservatieve
discoverylijst opgebouwd uit `src/gateway/server-methods-list.ts` plus geladen
Plugin-/channel-methodexports. Behandel het als featurediscovery, niet als een volledige
opsomming van `src/gateway/server-methods/*.ts`.

<AccordionGroup>
  <Accordion title="System and identity">
    - `health` retourneert de gecachte of vers geprobede Gateway-healthsnapshot.
    - `diagnostics.stability` retourneert de recente begrensde diagnostische stabiliteitsrecorder. Deze bewaart operationele metadata zoals eventnamen, aantallen, bytegroottes, geheugenmetingen, queue-/sessiestatus, channel-/Plugin-namen en sessie-id's. Deze bewaart geen chattekst, Webhook-bodies, tooloutputs, ruwe request- of responsebodies, tokens, cookies of geheime waarden. Operator-read-scope is vereist.
    - `status` retourneert de `/status`-achtige Gateway-samenvatting; gevoelige velden worden alleen opgenomen voor admin-scoped operator-clients.
    - `gateway.identity.get` retourneert de Gateway-device-identiteit die wordt gebruikt door relay- en koppelingsflows.
    - `system-presence` retourneert de huidige aanwezigheidssnapshot voor verbonden operator-/node-devices.
    - `system-event` voegt een systemevent toe en kan aanwezigheidscontext bijwerken/broadcasten.
    - `last-heartbeat` retourneert het meest recente gepersisteerde Heartbeat-event.
    - `set-heartbeats` schakelt Heartbeat-verwerking op de Gateway aan of uit.

  </Accordion>

  <Accordion title="Modellen en gebruik">
    - `models.list` retourneert de modelcatalogus die tijdens runtime is toegestaan. Geef `{ "view": "configured" }` door voor geconfigureerde modellen op picker-formaat (`agents.defaults.models` eerst, daarna `models.providers.*.models`), of `{ "view": "all" }` voor de volledige catalogus.
    - `usage.status` retourneert samenvattingen van providergebruikvensters/resterend quotum.
    - `usage.cost` retourneert geaggregeerde samenvattingen van kostengebruik voor een datumbereik.
    - `doctor.memory.status` retourneert de gereedheid van vectorgeheugen / gecachte embeddings voor de actieve standaard-agentwerkruimte. Geef `{ "probe": true }` of `{ "deep": true }` alleen door wanneer de aanroeper expliciet een live ping naar de embeddingprovider wil.
    - `doctor.memory.remHarness` retourneert een begrensde, alleen-lezen REM-harnesspreview voor externe control-plane-clients. Deze kan werkruimtepaden, geheugenfragmenten, gerenderde grounded markdown en kandidaten voor diepe promotie bevatten, dus aanroepers hebben `operator.read` nodig.
    - `sessions.usage` retourneert gebruikssamenvattingen per sessie.
    - `sessions.usage.timeseries` retourneert tijdreeksgebruik voor één sessie.
    - `sessions.usage.logs` retourneert gebruikslogboekvermeldingen voor één sessie.

  </Accordion>

  <Accordion title="Kanalen en aanmeldhelpers">
    - `channels.status` retourneert ingebouwde + gebundelde statusoverzichten voor kanalen/plugins.
    - `channels.logout` meldt een specifiek kanaal/account af waar het kanaal afmelden ondersteunt.
    - `web.login.start` start een QR-/webaanmeldflow voor de huidige webkanaalprovider met QR-ondersteuning.
    - `web.login.wait` wacht tot die QR-/webaanmeldflow is voltooid en start het kanaal bij succes.
    - `push.test` verzendt een test-APNs-push naar een geregistreerde iOS-node.
    - `voicewake.get` retourneert de opgeslagen wake-wordtriggers.
    - `voicewake.set` werkt wake-wordtriggers bij en broadcast de wijziging.

  </Accordion>

  <Accordion title="Berichten en logboeken">
    - `send` is de directe RPC voor uitgaande aflevering voor verzenden gericht op kanaal/account/thread buiten de chatrunner.
    - `logs.tail` retourneert de geconfigureerde Gateway-bestandslog-tail met cursor-/limiet- en max-byte-besturing.

  </Accordion>

  <Accordion title="Talk en TTS">
    - `talk.catalog` retourneert de alleen-lezen Talk-providercatalogus voor spraak, streamingtranscriptie en realtime stem. Deze bevat provider-id's, labels, geconfigureerde status, blootgestelde model-/stem-id's, canonieke modi, transports, brain-strategieën en realtime audio-/capabilityvlaggen zonder providergeheimen te retourneren of globale configuratie te muteren.
    - `talk.config` retourneert de effectieve Talk-configuratiepayload; `includeSecrets` vereist `operator.talk.secrets` (of `operator.admin`).
    - `talk.session.create` maakt een Talk-sessie in eigendom van de Gateway voor `realtime/gateway-relay`, `transcription/gateway-relay` of `stt-tts/managed-room`. `brain: "direct-tools"` vereist `operator.admin`.
    - `talk.session.join` valideert een beheerde-ruimte-sessietoken, emit indien nodig `session.ready`- of `session.replaced`-events, en retourneert ruimte-/sessiemetadata plus recente Talk-events zonder de platteteksttoken of opgeslagen tokenhash.
    - `talk.session.appendAudio` voegt base64 PCM-invoeraudio toe aan realtime relay- en transcriptiesessies in eigendom van de Gateway.
    - `talk.session.startTurn`, `talk.session.endTurn` en `talk.session.cancelTurn` sturen de levenscyclus van beurten in beheerde ruimtes aan met afwijzing van verouderde beurten voordat de status wordt gewist.
    - `talk.session.cancelOutput` stopt audio-uitvoer van de assistent, voornamelijk voor VAD-gated barge-in in Gateway-relaysessies.
    - `talk.session.submitToolResult` voltooit een providertoolaanroep die door een realtime relaysessie in eigendom van de Gateway is uitgezonden.
    - `talk.session.close` sluit een relay-, transcriptie- of beheerde-ruimte-sessie in eigendom van de Gateway en emit terminale Talk-events.
    - `talk.mode` stelt de huidige Talk-modusstatus in/broadcast deze voor WebChat-/Control UI-clients.
    - `talk.client.create` maakt een realtime providersessie in eigendom van de client met `webrtc` of `provider-websocket`, terwijl de Gateway eigenaar blijft van configuratie, inloggegevens, instructies en toolbeleid.
    - `talk.client.toolCall` laat realtime transports in eigendom van de client providertoolaanroepen doorsturen naar Gateway-beleid. De eerste ondersteunde tool is `openclaw_agent_consult`; clients ontvangen een run-id en wachten op normale chatlevenscyclusevents voordat ze het providerspecifieke toolresultaat indienen.
    - `talk.event` is het enige Talk-eventkanaal voor realtime, transcriptie, STT/TTS, beheerde ruimtes, telefonie en vergaderadapters.
    - `talk.speak` synthetiseert spraak via de actieve Talk-spraakprovider.
    - `tts.status` retourneert de ingeschakelde TTS-status, actieve provider, fallbackproviders en providerconfiguratiestatus.
    - `tts.providers` retourneert de zichtbare TTS-providerinventaris.
    - `tts.enable` en `tts.disable` schakelen de TTS-voorkeursstatus om.
    - `tts.setProvider` werkt de voorkeurs-TTS-provider bij.
    - `tts.convert` voert een eenmalige tekst-naar-spraakconversie uit.

  </Accordion>

  <Accordion title="Geheimen, configuratie, update en wizard">
    - `secrets.reload` her-resolvet actieve SecretRefs en wisselt de runtime-geheimstatus alleen bij volledig succes.
    - `secrets.resolve` resolvet geheime toewijzingen voor commando-doelen voor een specifieke set commando's/doelen.
    - `config.get` retourneert de huidige configuratiesnapshot en hash.
    - `config.set` schrijft een gevalideerde configuratiepayload.
    - `config.patch` voegt een gedeeltelijke configuratie-update samen.
    - `config.apply` valideert + vervangt de volledige configuratiepayload.
    - `config.schema` retourneert de live configuratieschemapayload die wordt gebruikt door Control UI en CLI-tooling: schema, `uiHints`, versie en generatiemetadata, inclusief plugin- + kanaalschemametadata wanneer de runtime deze kan laden. Het schema bevat veldmetadata voor `title` / `description`, afgeleid van dezelfde labels en helptekst die door de UI worden gebruikt, inclusief geneste objecten, wildcards, array-items en `anyOf`- / `oneOf`- / `allOf`-compositietakken wanneer overeenkomende velddocumentatie bestaat.
    - `config.schema.lookup` retourneert een padgescopeerde lookuppayload voor één configuratiepad: genormaliseerd pad, een oppervlakkige schemanode, overeenkomende hint + `hintPath`, en directe kindsamenvattingen voor UI/CLI-drill-down. Lookupschemanodes behouden de gebruikersgerichte documentatie en algemene validatievelden (`title`, `description`, `type`, `enum`, `const`, `format`, `pattern`, numerieke/tekenreeks-/array-/objectgrenzen en vlaggen zoals `additionalProperties`, `deprecated`, `readOnly`, `writeOnly`). Kindsamenvattingen tonen `key`, genormaliseerd `path`, `type`, `required`, `hasChildren`, plus de overeenkomende `hint` / `hintPath`.
    - `update.run` voert de Gateway-updateflow uit en plant alleen een herstart wanneer de update zelf is geslaagd; aanroepers met een sessie kunnen `continuationMessage` opnemen, zodat startup één vervolgende agentbeurt hervat via de wachtrij voor herstartvoortzetting. Package-manager-updates forceren na de pakketwissel een niet-uitgestelde updateherstart zonder cooldown, zodat het oude Gateway-proces niet lazy blijft laden vanuit een vervangen `dist`-tree.
    - `update.status` retourneert de meest recente gecachte sentinel voor updateherstart, inclusief de na-herstart draaiende versie wanneer beschikbaar.
    - `wizard.start`, `wizard.next`, `wizard.status` en `wizard.cancel` stellen de onboardingwizard beschikbaar via WS RPC.

  </Accordion>

  <Accordion title="Agent- en werkruimtehelpers">
    - `agents.list` retourneert geconfigureerde agentvermeldingen, inclusief effectief model en runtimemetadata.
    - `agents.create`, `agents.update` en `agents.delete` beheren agentrecords en werkruimtebedrading.
    - `agents.files.list`, `agents.files.get` en `agents.files.set` beheren de bootstrapwerkruimtebestanden die voor een agent worden blootgesteld.
    - `artifacts.list`, `artifacts.get` en `artifacts.download` stellen van transcript afgeleide artifactsamenvattingen en downloads beschikbaar voor een expliciete scope `sessionKey`, `runId` of `taskId`. Run- en taakqueries resolven de eigenaarsessie server-side en retourneren alleen transcriptmedia met overeenkomende provenance; onveilige of lokale URL-bronnen retourneren niet-ondersteunde downloads in plaats van server-side op te halen.
    - `environments.list` en `environments.status` stellen alleen-lezen Gateway-lokale en node-omgevingdetectie beschikbaar voor SDK-clients.
    - `agent.identity.get` retourneert de effectieve assistentidentiteit voor een agent of sessie.
    - `agent.wait` wacht tot een run is voltooid en retourneert de terminale snapshot wanneer beschikbaar.

  </Accordion>

  <Accordion title="Sessiebesturing">
    - `sessions.list` retourneert de huidige sessie-index, inclusief `agentRuntime`-metadata per rij wanneer een runtime-backend voor agents is geconfigureerd.
    - `sessions.subscribe` en `sessions.unsubscribe` schakelen abonnementen op sessiewijzigingsevents voor de huidige WS-client om.
    - `sessions.messages.subscribe` en `sessions.messages.unsubscribe` schakelen abonnementen op transcript-/berichtenevents voor één sessie om.
    - `sessions.preview` retourneert begrensde transcriptpreviews voor specifieke sessiesleutels.
    - `sessions.describe` retourneert één Gateway-sessierij voor een exacte sessiesleutel.
    - `sessions.resolve` resolvet of canonicaliseert een sessiedoel.
    - `sessions.create` maakt een nieuwe sessievermelding.
    - `sessions.send` verzendt een bericht naar een bestaande sessie.
    - `sessions.steer` is de interrupt-and-steer-variant voor een actieve sessie.
    - `sessions.abort` breekt actief werk voor een sessie af. Een aanroeper kan `key` plus optioneel `runId` doorgeven, of alleen `runId` doorgeven voor actieve runs die de Gateway naar een sessie kan resolven.
    - `sessions.patch` werkt sessiemetadata/-overrides bij en rapporteert het opgeloste canonieke model plus effectieve `agentRuntime`.
    - `sessions.reset`, `sessions.delete` en `sessions.compact` voeren sessieonderhoud uit.
    - `sessions.get` retourneert de volledige opgeslagen sessierij.
    - Chatuitvoering gebruikt nog steeds `chat.history`, `chat.send`, `chat.abort` en `chat.inject`. `chat.history` is voor weergave genormaliseerd voor UI-clients: inline directivetags worden uit zichtbare tekst gestript, XML-payloads voor plattetekst-toolaanroepen (inclusief `<tool_call>...</tool_call>`, `<function_call>...</function_call>`, `<tool_calls>...</tool_calls>`, `<function_calls>...</function_calls>` en afgekorte toolaanroepblokken) en gelekte ASCII-/full-width-modelbesturingstokens worden gestript, pure assistentrijen met stille tokens zoals exact `NO_REPLY` / `no_reply` worden weggelaten, en te grote rijen kunnen worden vervangen door placeholders.

  </Accordion>

  <Accordion title="Apparaatkoppeling en apparaattokens">
    - `device.pair.list` retourneert wachtende en goedgekeurde gekoppelde apparaten.
    - `device.pair.approve`, `device.pair.reject` en `device.pair.remove` beheren apparaatkoppelingsrecords.
    - `device.token.rotate` roteert een gekoppelde apparaattoken binnen de grenzen van de goedgekeurde rol en aanroeperscope.
    - `device.token.revoke` trekt een gekoppelde apparaattoken in binnen de grenzen van de goedgekeurde rol en aanroeperscope.

  </Accordion>

  <Accordion title="Node-koppeling, aanroepen en wachtend werk">
    - `node.pair.request`, `node.pair.list`, `node.pair.approve`, `node.pair.reject`, `node.pair.remove` en `node.pair.verify` dekken node-koppeling en bootstrapverificatie.
    - `node.list` en `node.describe` retourneren bekende/verbonden nodestatus.
    - `node.rename` werkt een gekoppeld nodelabel bij.
    - `node.invoke` stuurt een commando door naar een verbonden node.
    - `node.invoke.result` retourneert het resultaat voor een aanroepverzoek.
    - `node.event` draagt events afkomstig van nodes terug naar de Gateway.
    - `node.pending.pull` en `node.pending.ack` zijn de wachtrij-API's voor verbonden nodes.
    - `node.pending.enqueue` en `node.pending.drain` beheren duurzaam wachtend werk voor offline/losgekoppelde nodes.

  </Accordion>

  <Accordion title="Goedkeuringsfamilies">
    - `exec.approval.request`, `exec.approval.get`, `exec.approval.list` en `exec.approval.resolve` dekken eenmalige exec-goedkeuringsaanvragen plus opzoeken/opnieuw afspelen van openstaande goedkeuringen.
    - `exec.approval.waitDecision` wacht op één openstaande exec-goedkeuring en retourneert de definitieve beslissing (of `null` bij een time-out).
    - `exec.approvals.get` en `exec.approvals.set` beheren snapshots van het exec-goedkeuringsbeleid van de Gateway.
    - `exec.approvals.node.get` en `exec.approvals.node.set` beheren node-lokaal exec-goedkeuringsbeleid via Node-relaycommando's.
    - `plugin.approval.request`, `plugin.approval.list`, `plugin.approval.waitDecision` en `plugin.approval.resolve` dekken door Plugins gedefinieerde goedkeuringsstromen.

  </Accordion>

  <Accordion title="Automatisering, Skills en tools">
    - Automatisering: `wake` plant een onmiddellijke of volgende-Heartbeat wake-tekstinjectie; `cron.list`, `cron.status`, `cron.add`, `cron.update`, `cron.remove`, `cron.run`, `cron.runs` beheren gepland werk.
    - Skills en tools: `commands.list`, `skills.*`, `tools.catalog`, `tools.effective`, `tools.invoke`.

  </Accordion>
</AccordionGroup>

### Veelvoorkomende eventfamilies

- `chat`: UI-chatupdates zoals `chat.inject` en andere chatgebeurtenissen die
  alleen voor transcripten zijn.
- `session.message` en `session.tool`: transcript-/eventstreamupdates voor een
  geabonneerde sessie.
- `sessions.changed`: sessie-index of metadata gewijzigd.
- `presence`: updates van systeemaanwezigheidssnapshots.
- `tick`: periodieke keepalive-/liveness-gebeurtenis.
- `health`: update van Gateway-gezondheidssnapshot.
- `heartbeat`: update van Heartbeat-eventstream.
- `cron`: Cron-run-/taakwijzigingsgebeurtenis.
- `shutdown`: melding voor afsluiten van de Gateway.
- `node.pair.requested` / `node.pair.resolved`: koppelingslevenscyclus van Node.
- `node.invoke.request`: broadcast van Node-aanroepverzoek.
- `device.pair.requested` / `device.pair.resolved`: levenscyclus van gekoppeld apparaat.
- `voicewake.changed`: configuratie voor wake-wordtrigger gewijzigd.
- `exec.approval.requested` / `exec.approval.resolved`: exec-goedkeuringslevenscyclus.
- `plugin.approval.requested` / `plugin.approval.resolved`: Plugin-goedkeuringslevenscyclus.

### Node-helpermethoden

- Nodes kunnen `skills.bins` aanroepen om de huidige lijst met skill-executables
  op te halen voor auto-allow-controles.

### Operator-helpermethoden

- Operators kunnen `commands.list` (`operator.read`) aanroepen om de runtime-
  commando-inventaris voor een agent op te halen.
  - `agentId` is optioneel; laat dit weg om de standaardagentwerkruimte te lezen.
  - `scope` bepaalt op welk oppervlak de primaire `name` is gericht:
    - `text` retourneert het primaire tekstcommandotoken zonder de voorloop-`/`
    - `native` en het standaardpad `both` retourneren providerbewuste native namen
      wanneer beschikbaar
  - `textAliases` bevat exacte slash-aliassen zoals `/model` en `/m`.
  - `nativeName` bevat de providerbewuste native commandonaam wanneer die bestaat.
  - `provider` is optioneel en beïnvloedt alleen native naamgeving plus beschikbaarheid van native Plugin-
    commando's.
  - `includeArgs=false` laat geserialiseerde argumentmetadata weg uit het antwoord.
- Operators kunnen `tools.catalog` (`operator.read`) aanroepen om de runtime-toolcatalogus voor een
  agent op te halen. Het antwoord bevat gegroepeerde tools en herkomstmetadata:
  - `source`: `core` of `plugin`
  - `pluginId`: Plugin-eigenaar wanneer `source="plugin"`
  - `optional`: of een Plugin-tool optioneel is
- Operators kunnen `tools.effective` (`operator.read`) aanroepen om de runtime-effectieve tool-
  inventaris voor een sessie op te halen.
  - `sessionKey` is vereist.
  - De Gateway leidt vertrouwde runtimecontext server-side af uit de sessie in plaats van
    door de aanroeper geleverde auth- of afleveringscontext te accepteren.
  - Het antwoord is sessiegebonden en weerspiegelt wat het actieve gesprek nu kan gebruiken,
    inclusief core-, Plugin- en kanaaltools.
- Operators kunnen `tools.invoke` (`operator.write`) aanroepen om één beschikbare tool aan te roepen via hetzelfde
  Gateway-beleidspad als `/tools/invoke`.
  - `name` is vereist. `args`, `sessionKey`, `agentId`, `confirm` en
    `idempotencyKey` zijn optioneel.
  - Als zowel `sessionKey` als `agentId` aanwezig zijn, moet de opgeloste sessieagent overeenkomen met
    `agentId`.
  - Het antwoord is een SDK-gerichte envelop met `ok`, `toolName`, optioneel `output` en getypeerde
    `error`-velden. Goedkeurings- of beleidsweigeringen retourneren `ok:false` in de payload in plaats van
    de Gateway-toolbeleidspijplijn te omzeilen.
- Operators kunnen `skills.status` (`operator.read`) aanroepen om de zichtbare
  skill-inventaris voor een agent op te halen.
  - `agentId` is optioneel; laat dit weg om de standaardagentwerkruimte te lezen.
  - Het antwoord bevat geschiktheid, ontbrekende vereisten, configuratiecontroles en
    opgeschoonde installatieopties zonder ruwe geheime waarden bloot te leggen.
- Operators kunnen `skills.search` en `skills.detail` (`operator.read`) aanroepen voor
  ClawHub-ontdekkingsmetadata.
- Operators kunnen `skills.install` (`operator.admin`) in twee modi aanroepen:
  - ClawHub-modus: `{ source: "clawhub", slug, version?, force? }` installeert een
    skill-map in de `skills/`-directory van de standaardagentwerkruimte.
  - Gateway-installatiemodus: `{ name, installId, dangerouslyForceUnsafeInstall?, timeoutMs? }`
    voert een gedeclareerde `metadata.openclaw.install`-actie uit op de Gateway-host.
- Operators kunnen `skills.update` (`operator.admin`) in twee modi aanroepen:
  - ClawHub-modus werkt één gevolgde slug of alle gevolgde ClawHub-installaties bij in
    de standaardagentwerkruimte.
  - Configuratiemodus patcht waarden van `skills.entries.<skillKey>` zoals `enabled`,
    `apiKey` en `env`.

### `models.list`-weergaven

`models.list` accepteert een optionele parameter `view`:

- Weggelaten of `"default"`: huidig runtimegedrag. Als `agents.defaults.models` is geconfigureerd, is het antwoord de toegestane catalogus; anders is het antwoord de volledige Gateway-catalogus.
- `"configured"`: gedrag op picker-formaat. Als `agents.defaults.models` is geconfigureerd, heeft dat nog steeds voorrang. Anders gebruikt het antwoord expliciete vermeldingen in `models.providers.*.models`, met terugval naar de volledige catalogus alleen wanneer er geen geconfigureerde modelrijen bestaan.
- `"all"`: volledige Gateway-catalogus, waarbij `agents.defaults.models` wordt omzeild. Gebruik dit voor diagnostiek en ontdekkings-UI's, niet voor normale modelpickers.

## Exec-goedkeuringen

- Wanneer een exec-aanvraag goedkeuring vereist, broadcast de Gateway `exec.approval.requested`.
- Operatorclients lossen dit op door `exec.approval.resolve` aan te roepen (vereist scope `operator.approvals`).
- Voor `host=node` moet `exec.approval.request` `systemRunPlan` bevatten (canonieke `argv`/`cwd`/`rawCommand`/sessiemetadata). Aanvragen zonder `systemRunPlan` worden geweigerd.
- Na goedkeuring hergebruiken doorgestuurde `node.invoke system.run`-aanroepen dat canonieke
  `systemRunPlan` als de gezaghebbende command-/cwd-/sessiecontext.
- Als een aanroeper `command`, `rawCommand`, `cwd`, `agentId` of
  `sessionKey` wijzigt tussen voorbereiding en de definitieve goedgekeurde `system.run`-doorsturing, weigert de
  Gateway de run in plaats van de gewijzigde payload te vertrouwen.

## Fallback voor agentaflevering

- `agent`-aanvragen kunnen `deliver=true` bevatten om uitgaande aflevering aan te vragen.
- `bestEffortDeliver=false` behoudt strikt gedrag: niet-opgeloste of alleen-interne afleverdoelen retourneren `INVALID_REQUEST`.
- `bestEffortDeliver=true` staat fallback naar alleen-sessie-uitvoering toe wanneer geen externe afleverbare route kan worden opgelost (bijvoorbeeld interne/webchatsessies of dubbelzinnige multikanaalconfiguraties).

## Versionering

- `PROTOCOL_VERSION` staat in `src/gateway/protocol/version.ts`.
- Clients sturen `minProtocol` + `maxProtocol`; de server weigert mismatches.
- Schema's + modellen worden gegenereerd uit TypeBox-definities:
  - `pnpm protocol:gen`
  - `pnpm protocol:gen:swift`
  - `pnpm protocol:check`

### Clientconstanten

De referentieclient in `src/gateway/client.ts` gebruikt deze standaardwaarden. Waarden zijn
stabiel binnen protocol v4 en vormen de verwachte baseline voor clients van derden.

| Constante                                  | Standaard                                             | Bron                                                                                       |
| ----------------------------------------- | ----------------------------------------------------- | ------------------------------------------------------------------------------------------ |
| `PROTOCOL_VERSION`                        | `4`                                                   | `src/gateway/protocol/version.ts`                                                          |
| Aanvraagtime-out (per RPC)                | `30_000` ms                                           | `src/gateway/client.ts` (`requestTimeoutMs`)                                               |
| Preauth-/connect-challenge-time-out       | `15_000` ms                                           | `src/gateway/handshake-timeouts.ts` (config/env kan het gekoppelde server-/clientbudget verhogen) |
| Initiële reconnect-backoff                | `1_000` ms                                            | `src/gateway/client.ts` (`backoffMs`)                                                      |
| Maximale reconnect-backoff                | `30_000` ms                                           | `src/gateway/client.ts` (`scheduleReconnect`)                                              |
| Fast-retry-klem na sluiten door device-token | `250` ms                                           | `src/gateway/client.ts`                                                                    |
| Force-stop-respijt vóór `terminate()`     | `250` ms                                              | `FORCE_STOP_TERMINATE_GRACE_MS`                                                            |
| Standaardtime-out van `stopAndWait()`     | `1_000` ms                                            | `STOP_AND_WAIT_TIMEOUT_MS`                                                                 |
| Standaard tick-interval (vóór `hello-ok`) | `30_000` ms                                           | `src/gateway/client.ts`                                                                    |
| Sluiten bij tick-time-out                 | code `4000` wanneer stilte langer duurt dan `tickIntervalMs * 2` | `src/gateway/client.ts`                                                          |
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
- Na koppeling geeft de Gateway een **apparaat-token** uit dat is beperkt tot de verbindingsrol
  + bereiken. Het wordt geretourneerd in `hello-ok.auth.deviceToken` en moet door de
  client worden bewaard voor toekomstige verbindingen.
- Clients moeten de primaire `hello-ok.auth.deviceToken` bewaren na elke
  succesvolle verbinding.
- Opnieuw verbinden met dat **opgeslagen** apparaat-token moet ook de opgeslagen
  goedgekeurde bereikenset voor dat token hergebruiken. Dit behoudt lees-/probe-/statustoegang
  die al was verleend en voorkomt dat herverbindingen stilzwijgend terugvallen naar een
  smaller impliciet alleen-admin-bereik.
- Samenstelling van connect-authenticatie aan clientzijde (`selectConnectAuth` in
  `src/gateway/client.ts`):
  - `auth.password` staat los hiervan en wordt altijd doorgestuurd wanneer ingesteld.
  - `auth.token` wordt gevuld in prioriteitsvolgorde: eerst een expliciet gedeeld token,
    daarna een expliciete `deviceToken`, daarna een opgeslagen token per apparaat (gesleuteld op
    `deviceId` + `role`).
  - `auth.bootstrapToken` wordt alleen verzonden wanneer geen van bovenstaande een
    `auth.token` opleverde. Een gedeeld token of elk opgelost apparaat-token onderdrukt dit.
  - Automatische promotie van een opgeslagen apparaat-token bij de eenmalige
    `AUTH_TOKEN_MISMATCH`-herpoging is beperkt tot **alleen vertrouwde endpoints** —
    loopback, of `wss://` met een vastgepinde `tlsFingerprint`. Publieke `wss://`
    zonder pinning komt niet in aanmerking.
- Aanvullende `hello-ok.auth.deviceTokens`-vermeldingen zijn bootstrap-overdrachtstokens.
  Bewaar ze alleen wanneer de verbinding bootstrap-authenticatie gebruikte op een vertrouwd transport
  zoals `wss://` of loopback/lokale koppeling.
- Als een client een **expliciete** `deviceToken` of expliciete `scopes` opgeeft, blijft die
  door de aanroeper gevraagde bereikenset gezaghebbend; gecachete bereiken worden alleen
  hergebruikt wanneer de client het opgeslagen token per apparaat hergebruikt.
- Apparaat-tokens kunnen worden geroteerd/ingetrokken via `device.token.rotate` en
  `device.token.revoke` (vereist bereik `operator.pairing`).
- `device.token.rotate` retourneert rotatiemetadata. Het echoot het vervangende
  bearer-token alleen voor oproepen vanaf hetzelfde apparaat die al met dat apparaat-token zijn
  geauthenticeerd, zodat clients met alleen tokens hun vervanging kunnen bewaren voordat
  ze opnieuw verbinden. Rotaties via gedeelde/admin-authenticatie echoën het bearer-token niet.
- Tokenuitgifte, -rotatie en -intrekking blijven beperkt tot de goedgekeurde rollenset
  die is vastgelegd in de koppelingsvermelding van dat apparaat; tokenmutatie kan geen
  apparaatrol uitbreiden of targeten waarvoor koppeling nooit goedkeuring heeft verleend.
- Voor token-sessies van gekoppelde apparaten is apparaatbeheer zelf-beperkt tenzij de
  aanroeper ook `operator.admin` heeft: niet-admin-aanroepers kunnen alleen hun **eigen**
  apparaatvermelding verwijderen/intrekken/roteren.
- `device.token.rotate` en `device.token.revoke` controleren ook de bereikenset van het doeloperator-token
  tegen de huidige sessiebereiken van de aanroeper. Niet-admin-aanroepers
  kunnen geen breder operator-token roteren of intrekken dan ze zelf al hebben.
- Authenticatiefouten bevatten `error.details.code` plus herstelhints:
  - `error.details.canRetryWithDeviceToken` (boolean)
  - `error.details.recommendedNextStep` (`retry_with_device_token`, `update_auth_configuration`, `update_auth_credentials`, `wait_then_retry`, `review_auth_configuration`)
- Clientgedrag voor `AUTH_TOKEN_MISMATCH`:
  - Vertrouwde clients mogen één begrensde herpoging proberen met een gecachet token per apparaat.
  - Als die herpoging mislukt, moeten clients automatische herverbindingslussen stoppen en begeleiding voor operatoractie tonen.

## Apparaatidentiteit + koppeling

- Nodes moeten een stabiele apparaatidentiteit (`device.id`) bevatten, afgeleid van een
  keypair-fingerprint.
- Gateways geven tokens uit per apparaat + rol.
- Koppelingsgoedkeuringen zijn vereist voor nieuwe apparaat-ID's tenzij lokale automatische goedkeuring
  is ingeschakeld.
- Automatische koppelingsgoedkeuring is gericht op directe local loopback-verbindingen.
- OpenClaw heeft ook een smal backend-/container-lokaal zelfverbindingspad voor
  vertrouwde helperflows met gedeeld geheim.
- Tailnet- of LAN-verbindingen op dezelfde host worden nog steeds behandeld als extern voor koppeling en
  vereisen goedkeuring.
- WS-clients bevatten normaal gesproken `device`-identiteit tijdens `connect` (operator +
  node). De enige operator-uitzonderingen zonder apparaat zijn expliciete vertrouwenspaden:
  - `gateway.controlUi.allowInsecureAuth=true` voor localhost-only compatibiliteit met onveilige HTTP.
  - succesvolle `gateway.auth.mode: "trusted-proxy"` operator-Control UI-authenticatie.
  - `gateway.controlUi.dangerouslyDisableDeviceAuth=true` (noodmaatregel, ernstige beveiligingsverlaging).
  - direct-loopback `gateway-client` backend-RPC's die zijn geauthenticeerd met het gedeelde
    gateway-token/wachtwoord.
- Alle verbindingen moeten de door de server geleverde `connect.challenge`-nonce ondertekenen.

### Migratiediagnostiek voor apparaatauthenticatie

Voor legacy clients die nog pre-challenge ondertekeningsgedrag gebruiken, retourneert `connect` nu
`DEVICE_AUTH_*`-detailcodes onder `error.details.code` met een stabiele `error.details.reason`.

Veelvoorkomende migratiefouten:

| Bericht                     | details.code                     | details.reason           | Betekenis                                          |
| --------------------------- | -------------------------------- | ------------------------ | -------------------------------------------------- |
| `device nonce required`     | `DEVICE_AUTH_NONCE_REQUIRED`     | `device-nonce-missing`   | Client liet `device.nonce` weg (of stuurde leeg).  |
| `device nonce mismatch`     | `DEVICE_AUTH_NONCE_MISMATCH`     | `device-nonce-mismatch`  | Client ondertekende met een verouderde/verkeerde nonce. |
| `device signature invalid`  | `DEVICE_AUTH_SIGNATURE_INVALID`  | `device-signature`       | Signature-payload komt niet overeen met v2-payload. |
| `device signature expired`  | `DEVICE_AUTH_SIGNATURE_EXPIRED`  | `device-signature-stale` | Ondertekende timestamp valt buiten de toegestane skew. |
| `device identity mismatch`  | `DEVICE_AUTH_DEVICE_ID_MISMATCH` | `device-id-mismatch`     | `device.id` komt niet overeen met de publieke-sleutel-fingerprint. |
| `device public key invalid` | `DEVICE_AUTH_PUBLIC_KEY_INVALID` | `device-public-key`      | Publieke-sleutelindeling/canonicalisatie is mislukt. |

Migratiedoel:

- Wacht altijd op `connect.challenge`.
- Onderteken de v2-payload die de servernonce bevat.
- Stuur dezelfde nonce in `connect.params.device.nonce`.
- De voorkeurs-signature-payload is `v3`, die `platform` en `deviceFamily`
  bindt naast de velden voor apparaat/client/rol/bereiken/token/nonce.
- Legacy `v2`-handtekeningen blijven geaccepteerd voor compatibiliteit, maar metadata-pinning
  van gekoppelde apparaten blijft het opdrachtbeleid bij herverbinding bepalen.

## TLS + pinning

- TLS wordt ondersteund voor WS-verbindingen.
- Clients kunnen optioneel de gateway-certificaatfingerprint vastpinnen (zie `gateway.tls`
  config plus `gateway.remote.tlsFingerprint` of CLI `--tls-fingerprint`).

## Bereik

Dit protocol stelt de **volledige gateway-API** bloot (status, kanalen, modellen, chat,
agent, sessies, nodes, goedkeuringen, enz.). Het exacte oppervlak wordt gedefinieerd door de
TypeBox-schema's in `src/gateway/protocol/schema.ts`.

## Gerelateerd

- [Bridge-protocol](/nl/gateway/bridge-protocol)
- [Gateway-runbook](/nl/gateway)
