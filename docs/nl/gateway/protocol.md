---
read_when:
    - Implementeren of bijwerken van Gateway-WS-clients
    - Fouten opsporen bij protocolverschillen of verbindingsfouten
    - Protocolschema's en modellen opnieuw genereren
summary: 'Gateway WebSocket-protocol: handshake, frames, versionering'
title: Gateway-protocol
x-i18n:
    generated_at: "2026-05-11T20:31:32Z"
    model: gpt-5.5
    provider: openai
    source_hash: 8db92a8ea464fa3ca1fdc6cc32fdcd7d981c186c9900bb8dc2eeaf1a2d2be05d
    source_path: gateway/protocol.md
    workflow: 16
---

Het Gateway WS-protocol is het **enige control plane + node-transport** voor
OpenClaw. Alle clients (CLI, web-UI, macOS-app, iOS/Android-nodes, headless
nodes) verbinden via WebSocket en declareren hun **rol** + **scope** tijdens
de handshake.

## Transport

- WebSocket, tekstframes met JSON-payloads.
- Het eerste frame **moet** een `connect`-request zijn.
- Pre-connect-frames zijn beperkt tot 64 KiB. Na een geslaagde handshake moeten clients
  de limieten `hello-ok.policy.maxPayload` en
  `hello-ok.policy.maxBufferedBytes` volgen. Met diagnostics ingeschakeld
  emitten te grote inkomende frames en trage uitgaande buffers `payload.large`-events
  voordat de Gateway het betreffende frame sluit of laat vallen. Deze events bewaren
  groottes, limieten, oppervlakken en veilige reden-codes. Ze bewaren niet de berichttekst,
  bijlage-inhoud, ruwe frame-body, tokens, cookies of geheime waarden.

## Handshake (connect)

Gateway → Client (pre-connect-challenge):

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

Terwijl de Gateway nog startup-sidecars afrondt, kan de `connect`-request
een opnieuw te proberen `UNAVAILABLE`-fout teruggeven met `details.reason`
ingesteld op `"startup-sidecars"` en `retryAfterMs`. Clients moeten die respons
opnieuw proberen binnen hun totale verbindingsbudget in plaats van deze als een definitieve
handshakefout te tonen.

`server`, `features`, `snapshot` en `policy` zijn allemaal vereist door het schema
(`src/gateway/protocol/schema/frames.ts`). `auth` is ook vereist en rapporteert
de onderhandelde rol/scopes. `pluginSurfaceUrls` is optioneel en koppelt Plugin-
oppervlaknamen, zoals `canvas`, aan gescopete gehoste URL's.

Gescopete Plugin-oppervlak-URL's kunnen verlopen. Nodes kunnen
`node.pluginSurface.refresh` aanroepen met `{ "surface": "canvas" }` om een verse
entry in `pluginSurfaceUrls` te ontvangen. De experimentele Canvas-Plugin-refactor ondersteunt
het verouderde compatibiliteitspad `canvasHostUrl`, `canvasCapability` of
`node.canvas.capability.refresh` niet; huidige native clients en
gateways moeten Plugin-oppervlakken gebruiken.

Wanneer geen device-token wordt uitgegeven, rapporteert `hello-ok.auth` de onderhandelde
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
`client.mode: "backend"`) mogen `device` weglaten op directe loopback-verbindingen wanneer
ze authenticeren met het gedeelde Gateway-token/wachtwoord. Dit pad is gereserveerd
voor interne control-plane-RPC's en voorkomt dat verouderde CLI/device-pairingbaselines
lokaal backendwerk blokkeren, zoals updates van subagentsessies. Externe clients,
browser-origin-clients, nodeclients en expliciete device-token/device-identity-
clients gebruiken nog steeds de normale pairing- en scope-upgradecontroles.

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

Tijdens vertrouwde bootstrap-handoff kan `hello-ok.auth` ook aanvullende
begrensde role entries in `deviceTokens` bevatten:

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

Voor de ingebouwde bootstrapflow voor node/operator blijft het primaire node-token
`scopes: []` en blijft elk overgedragen operator-token begrensd tot de allowlist voor
bootstrapoperators (`operator.approvals`, `operator.read`,
`operator.talk.secrets`, `operator.write`). Bootstrap-scopecontroles blijven
role-prefixed: operator entries voldoen alleen aan operator-requests, en niet-operator-
rollen hebben nog steeds scopes nodig onder hun eigen rolprefix.

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

Zie [Operator-scopes](/nl/gateway/operator-scopes) voor het volledige operator-scope-model,
controles tijdens approval en shared-secret-semantiek.

### Rollen

- `operator` = control-plane-client (CLI/UI/automation).
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

Door Plugin geregistreerde Gateway-RPC-methoden kunnen hun eigen operator-scope aanvragen, maar
gereserveerde core-admin-prefixen (`config.*`, `exec.approvals.*`, `wizard.*`,
`update.*`) worden altijd opgelost naar `operator.admin`.

Method scope is alleen de eerste gate. Sommige slash commands die via
`chat.send` worden bereikt, passen daarbovenop strengere command-level checks toe.
Bijvoorbeeld: persistente writes met `/config set` en `/config unset` vereisen
`operator.admin`.

`node.pair.approve` heeft ook een extra scopecontrole tijdens approval boven op de
basis-method-scope:

- requests zonder command: `operator.pairing`
- requests met niet-exec-nodecommands: `operator.pairing` + `operator.write`
- requests die `system.run`, `system.run.prepare` of `system.which` bevatten:
  `operator.pairing` + `operator.admin`

### Caps/commands/permissions (node)

Nodes declareren capability-claims tijdens connect:

- `caps`: capability-categorieën op hoog niveau zoals `camera`, `canvas`, `screen`,
  `location`, `voice` en `talk`.
- `commands`: command-allowlist voor invoke.
- `permissions`: granulaire toggles (bijv. `screen.record`, `camera.capture`).

De Gateway behandelt deze als **claims** en dwingt server-side allowlists af.

## Presence

- `system-presence` retourneert entries met device identity als key.
- Presence entries bevatten `deviceId`, `roles` en `scopes` zodat UI's één rij per device kunnen tonen,
  zelfs wanneer het zowel als **operator** als **node** verbindt.
- `node.list` bevat optionele velden `lastSeenAtMs` en `lastSeenReason`. Verbonden nodes rapporteren
  hun huidige verbindingstijd als `lastSeenAtMs` met reden `connect`; paired nodes kunnen ook
  duurzame background presence rapporteren wanneer een vertrouwd node-event hun pairingmetadata bijwerkt.

### Node background alive event

Nodes kunnen `node.event` aanroepen met `event: "node.presence.alive"` om vast te leggen dat een paired node
tijdens een background wake alive was zonder deze als connected te markeren.

```json
{
  "event": "node.presence.alive",
  "payloadJSON": "{\"trigger\":\"silent_push\",\"sentAtMs\":1737264000000,\"displayName\":\"Peter's iPhone\",\"version\":\"2026.4.28\",\"platform\":\"iOS 18.4.0\",\"deviceFamily\":\"iPhone\",\"modelIdentifier\":\"iPhone17,1\",\"pushTransport\":\"relay\"}"
}
```

`trigger` is een gesloten enum: `background`, `silent_push`, `bg_app_refresh`,
`significant_location`, `manual` of `connect`. Onbekende triggerstrings worden door de Gateway
vóór persistence genormaliseerd naar `background`. Het event is alleen duurzaam voor geauthenticeerde node-
devicesessies; sessies zonder device of zonder pairing retourneren `handled: false`.

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
bevestigde RPC, niet als duurzame presence persistence.

## Scoping van broadcast-events

Door de server gepushte WebSocket-broadcast-events zijn scope-gated zodat pairing-scoped of node-only sessies niet passief sessie-inhoud ontvangen.

- **Chat-, agent- en tool-result-frames** (inclusief gestreamde `agent`-events en tool call results) vereisen minimaal `operator.read`. Sessies zonder `operator.read` slaan deze frames volledig over.
- **Door Plugin gedefinieerde `plugin.*`-broadcasts** worden gated op `operator.write` of `operator.admin`, afhankelijk van hoe de Plugin ze heeft geregistreerd.
- **Status- en transport-events** (`heartbeat`, `presence`, `tick`, connect/disconnect lifecycle, enz.) blijven onbeperkt zodat transportgezondheid voor elke geauthenticeerde sessie waarneembaar blijft.
- **Onbekende broadcast-eventfamilies** zijn standaard scope-gated (fail-closed), tenzij een geregistreerde handler ze expliciet versoepelt.

Elke clientverbinding houdt zijn eigen sequence number per client bij, zodat broadcasts monotone ordering op die socket behouden, zelfs wanneer verschillende clients verschillende scope-filtered subsets van de eventstream zien.

## Veelvoorkomende RPC-methodfamilies

Het publieke WS-oppervlak is breder dan de handshake-/auth-voorbeelden hierboven. Dit
is geen gegenereerde dump — `hello-ok.features.methods` is een conservatieve
discoverylist gebouwd uit `src/gateway/server-methods-list.ts` plus geladen
Plugin-/channel-method-exports. Behandel het als feature discovery, niet als een volledige
opsomming van `src/gateway/server-methods/*.ts`.

<AccordionGroup>
  <Accordion title="Systeem en identiteit">
    - `health` retourneert de gecachete of vers geprobede Gateway-health-snapshot.
    - `diagnostics.stability` retourneert de recente begrensde diagnostic stability recorder. Deze bewaart operationele metadata zoals eventnamen, aantallen, bytegroottes, memory readings, queue-/session state, channel-/Plugin-namen en session ids. Deze bewaart geen chattekst, Webhook-bodies, tool outputs, ruwe request- of response-bodies, tokens, cookies of geheime waarden. Operator read scope is vereist.
    - `status` retourneert de Gateway-samenvatting in `/status`-stijl; gevoelige velden worden alleen opgenomen voor operatorclients met admin-scope.
    - `gateway.identity.get` retourneert de Gateway-device identity die wordt gebruikt door relay- en pairingflows.
    - `system-presence` retourneert de huidige presence-snapshot voor verbonden operator-/node-devices.
    - `system-event` voegt een system event toe en kan presence context bijwerken/broadcasten.
    - `last-heartbeat` retourneert het laatst persistente Heartbeat-event.
    - `set-heartbeats` schakelt Heartbeat-verwerking op de Gateway in of uit.

  </Accordion>

  <Accordion title="Modellen en gebruik">
    - `models.list` retourneert de door de runtime toegestane modelcatalogus. Geef `{ "view": "configured" }` mee voor geconfigureerde modellen in picker-formaat (`agents.defaults.models` eerst, daarna `models.providers.*.models`), of `{ "view": "all" }` voor de volledige catalogus.
    - `usage.status` retourneert gebruiksvensters van providers en samenvattingen van resterend quotum.
    - `usage.cost` retourneert samengevoegde kostengebruikssamenvattingen voor een datumbereik.
    - `doctor.memory.status` retourneert de gereedheid van vectorgeheugen / gecachte embeddings voor de actieve standaardagentwerkruimte. Geef `{ "probe": true }` of `{ "deep": true }` alleen mee wanneer de aanroeper expliciet een live ping naar de embeddingprovider wil.
    - `doctor.memory.remHarness` retourneert een begrensde, alleen-lezen REM-harnesspreview voor externe control-plane-clients. Deze kan werkruimtepaden, geheugenfragmenten, gerenderde gegronde markdown en kandidaten voor diepe promotie bevatten, dus aanroepers hebben `operator.read` nodig.
    - `sessions.usage` retourneert gebruikssamenvattingen per sessie.
    - `sessions.usage.timeseries` retourneert tijdreeksgebruik voor één sessie.
    - `sessions.usage.logs` retourneert gebruikslogvermeldingen voor één sessie.

  </Accordion>

  <Accordion title="Kanalen en aanmeldhulpen">
    - `channels.status` retourneert statussamenvattingen van ingebouwde + gebundelde kanalen/Plugins.
    - `channels.logout` meldt een specifiek kanaal/account af wanneer het kanaal afmelden ondersteunt.
    - `web.login.start` start een QR-/webaanmeldingsflow voor de huidige webkanaalprovider met QR-ondersteuning.
    - `web.login.wait` wacht tot die QR-/webaanmeldingsflow is voltooid en start het kanaal bij succes.
    - `push.test` verzendt een test-APNs-push naar een geregistreerde iOS-node.
    - `voicewake.get` retourneert de opgeslagen wake-wordtriggers.
    - `voicewake.set` werkt wake-wordtriggers bij en broadcast de wijziging.

  </Accordion>

  <Accordion title="Berichten en logs">
    - `send` is de directe RPC voor uitgaande aflevering voor verzendingen gericht op kanaal/account/thread buiten de chatrunner.
    - `logs.tail` retourneert de geconfigureerde Gateway-bestandslogtail met cursor-/limiet- en max-bytebesturing.

  </Accordion>

  <Accordion title="Talk en TTS">
    - `talk.catalog` retourneert de alleen-lezen Talk-providercatalogus voor spraak, streamingtranscriptie en realtime spraak. Deze bevat provider-id's, labels, geconfigureerde status, blootgestelde model-/spraak-id's, canonieke modi, transports, brain-strategieën en realtime audio-/capabilityvlaggen zonder providergeheimen te retourneren of globale configuratie te wijzigen.
    - `talk.config` retourneert de effectieve Talk-configuratiepayload; `includeSecrets` vereist `operator.talk.secrets` (of `operator.admin`).
    - `talk.session.create` maakt een door de Gateway beheerde Talk-sessie voor `realtime/gateway-relay`, `transcription/gateway-relay` of `stt-tts/managed-room`. `brain: "direct-tools"` vereist `operator.admin`.
    - `talk.session.join` valideert een managed-room-sessietoken, zendt indien nodig `session.ready`- of `session.replaced`-events uit, en retourneert room-/sessiemetadata plus recente Talk-events zonder het platte-teksttoken of de opgeslagen tokenhash.
    - `talk.session.appendAudio` voegt base64-PCM-invoeraudio toe aan door de Gateway beheerde realtime relay- en transcriptiesessies.
    - `talk.session.startTurn`, `talk.session.endTurn` en `talk.session.cancelTurn` sturen de managed-room-turnlevenscyclus aan met stale-turn-afwijzing voordat de status wordt gewist.
    - `talk.session.cancelOutput` stopt audio-uitvoer van de assistent, voornamelijk voor door VAD bewaakte barge-in in Gateway-relaysessies.
    - `talk.session.submitToolResult` voltooit een provider-toolaanroep die is uitgezonden door een door de Gateway beheerde realtime relaysessie. Geef `options: { willContinue: true }` mee voor tussentijdse tooluitvoer wanneer er nog een eindresultaat volgt, of `options: { suppressResponse: true }` wanneer het toolresultaat de provideraanroep moet afhandelen zonder nog een realtime assistentrespons te starten.
    - `talk.session.close` sluit een door de Gateway beheerde relay-, transcriptie- of managed-room-sessie en zendt terminale Talk-events uit.
    - `talk.mode` stelt de huidige Talk-modusstatus in voor WebChat-/Control UI-clients en broadcast deze.
    - `talk.client.create` maakt een door de client beheerde realtime providersessie met `webrtc` of `provider-websocket`, terwijl de Gateway eigenaar blijft van configuratie, referenties, instructies en toolbeleid.
    - `talk.client.toolCall` laat door de client beheerde realtime transports provider-toolaanroepen doorsturen naar Gateway-beleid. De eerste ondersteunde tool is `openclaw_agent_consult`; clients ontvangen een run-id en wachten op normale chatlevenscyclus-events voordat ze het providerspecifieke toolresultaat indienen.
    - `talk.event` is het enkele Talk-eventkanaal voor realtime, transcriptie, STT/TTS, managed-room, telefonie en vergaderadapters.
    - `talk.speak` synthetiseert spraak via de actieve Talk-spraakprovider.
    - `tts.status` retourneert de ingeschakelde TTS-status, actieve provider, fallbackproviders en configuratiestatus van providers.
    - `tts.providers` retourneert de zichtbare TTS-providerinventaris.
    - `tts.enable` en `tts.disable` schakelen de TTS-voorkeursstatus om.
    - `tts.setProvider` werkt de voorkeurs-TTS-provider bij.
    - `tts.convert` voert een eenmalige tekst-naar-spraakconversie uit.

  </Accordion>

  <Accordion title="Geheimen, configuratie, update en wizard">
    - `secrets.reload` lost actieve SecretRefs opnieuw op en wisselt runtime-geheimstatus alleen bij volledig succes.
    - `secrets.resolve` lost geheime toewijzingen met commandodoel op voor een specifieke commando-/doelset.
    - `config.get` retourneert de huidige configuratiesnapshot en hash.
    - `config.set` schrijft een gevalideerde configuratiepayload.
    - `config.patch` voegt een gedeeltelijke configuratie-update samen.
    - `config.apply` valideert + vervangt de volledige configuratiepayload.
    - `config.schema` retourneert de live configuratieschemapayload die wordt gebruikt door Control UI en CLI-tooling: schema, `uiHints`, versie en generatiemetadata, inclusief Plugin- + kanaalschemametadata wanneer de runtime die kan laden. Het schema bevat veldmetadata voor `title` / `description`, afgeleid van dezelfde labels en helptekst die door de UI worden gebruikt, inclusief geneste objecten, jokertekens, array-items en compositiebranches voor `anyOf` / `oneOf` / `allOf` wanneer bijpassende velddocumentatie bestaat.
    - `config.schema.lookup` retourneert een padgescopeerde lookuppayload voor één configuratiepad: genormaliseerd pad, een oppervlakkige schemanode, bijpassende hint + `hintPath`, en directe kindsamenvattingen voor UI-/CLI-drilldown. Lookupschemanodes behouden de gebruikersgerichte documentatie en algemene validatievelden (`title`, `description`, `type`, `enum`, `const`, `format`, `pattern`, numerieke/string-/array-/objectgrenzen en vlaggen zoals `additionalProperties`, `deprecated`, `readOnly`, `writeOnly`). Kindsamenvattingen tonen `key`, genormaliseerde `path`, `type`, `required`, `hasChildren`, plus de bijpassende `hint` / `hintPath`.
    - `update.run` voert de Gateway-updateflow uit en plant alleen een herstart wanneer de update zelf is geslaagd; aanroepers met een sessie kunnen `continuationMessage` opnemen zodat het opstarten één vervolgturndialoog van de agent hervat via de herstartvervolgwachtrij. Updates via pakketbeheerders forceren na de pakketwisseling een niet-uitgestelde updateherstart zonder cooldown, zodat het oude Gateway-proces niet lazy blijft laden uit een vervangen `dist`-boom.
    - `update.status` retourneert de nieuwste gecachte updateherstartsentinel, inclusief de draaiende versie na herstart wanneer beschikbaar.
    - `wizard.start`, `wizard.next`, `wizard.status` en `wizard.cancel` stellen de onboardingwizard beschikbaar via WS RPC.

  </Accordion>

  <Accordion title="Agent- en werkruimtehulpen">
    - `agents.list` retourneert geconfigureerde agentvermeldingen, inclusief effectief model en runtimemetadata.
    - `agents.create`, `agents.update` en `agents.delete` beheren agentrecords en werkruimtebedrading.
    - `agents.files.list`, `agents.files.get` en `agents.files.set` beheren de bootstrapwerkruimtebestanden die voor een agent worden blootgesteld.
    - `tasks.list`, `tasks.get` en `tasks.cancel` stellen het Gateway-takenregister beschikbaar aan SDK- en operatorclients.
    - `artifacts.list`, `artifacts.get` en `artifacts.download` stellen uit transcript afgeleide artifactsamenvattingen en downloads beschikbaar voor een expliciete scope `sessionKey`, `runId` of `taskId`. Run- en taakquery's lossen de eigenaarssessie server-side op en retourneren alleen transcriptmedia met overeenkomende herkomst; onveilige of lokale URL-bronnen retourneren niet-ondersteunde downloads in plaats van server-side op te halen.
    - `environments.list` en `environments.status` stellen alleen-lezen Gateway-lokale en node-omgevingsdetectie beschikbaar voor SDK-clients.
    - `agent.identity.get` retourneert de effectieve assistentidentiteit voor een agent of sessie.
    - `agent.wait` wacht tot een run is voltooid en retourneert de terminale snapshot wanneer beschikbaar.

  </Accordion>

  <Accordion title="Sessiebesturing">
    - `sessions.list` retourneert de huidige sessie-index, inclusief `agentRuntime`-metadata per rij wanneer een agentruntimebackend is geconfigureerd.
    - `sessions.subscribe` en `sessions.unsubscribe` schakelen sessiewijzigingseventabonnementen in of uit voor de huidige WS-client.
    - `sessions.messages.subscribe` en `sessions.messages.unsubscribe` schakelen transcript-/berichteneventabonnementen in of uit voor één sessie.
    - `sessions.preview` retourneert begrensde transcriptpreviews voor specifieke sessiesleutels.
    - `sessions.describe` retourneert één Gateway-sessierij voor een exacte sessiesleutel.
    - `sessions.resolve` lost een sessiedoel op of maakt het canoniek.
    - `sessions.create` maakt een nieuwe sessievermelding.
    - `sessions.send` verzendt een bericht naar een bestaande sessie.
    - `sessions.steer` is de interrupt-and-steer-variant voor een actieve sessie.
    - `sessions.abort` breekt actief werk voor een sessie af. Een aanroeper kan `key` plus optioneel `runId` meegeven, of alleen `runId` meegeven voor actieve runs die de Gateway naar een sessie kan herleiden.
    - `sessions.patch` werkt sessiemetadata/-overrides bij en rapporteert het opgeloste canonieke model plus de effectieve `agentRuntime`.
    - `sessions.reset`, `sessions.delete` en `sessions.compact` voeren sessieonderhoud uit.
    - `sessions.get` retourneert de volledige opgeslagen sessierij.
    - Chatuitvoering gebruikt nog steeds `chat.history`, `chat.send`, `chat.abort` en `chat.inject`. `chat.history` is weergavegenormaliseerd voor UI-clients: inline instructietags worden uit zichtbare tekst verwijderd, platte-tekst XML-payloads voor toolaanroepen (inclusief `<tool_call>...</tool_call>`, `<function_call>...</function_call>`, `<tool_calls>...</tool_calls>`, `<function_calls>...</function_calls>` en afgekorte toolaanroepblokken) en gelekte ASCII-/full-width modelbesturingstokens worden verwijderd, zuivere assistentrijen met stille tokens zoals exact `NO_REPLY` / `no_reply` worden weggelaten, en te grote rijen kunnen door placeholders worden vervangen.

  </Accordion>

  <Accordion title="Apparaatkoppeling en apparaattokens">
    - `device.pair.list` retourneert in behandeling zijnde en goedgekeurde gekoppelde apparaten.
    - `device.pair.approve`, `device.pair.reject` en `device.pair.remove` beheren apparaatkoppelingsrecords.
    - `device.token.rotate` roteert een gekoppeld apparaattoken binnen de grenzen van de goedgekeurde rol en aanroeperscope.
    - `device.token.revoke` trekt een gekoppeld apparaattoken in binnen de grenzen van de goedgekeurde rol en aanroeperscope.

  </Accordion>

  <Accordion title="Node-koppeling, invoke en werk in behandeling">
    - `node.pair.request`, `node.pair.list`, `node.pair.approve`, `node.pair.reject`, `node.pair.remove` en `node.pair.verify` dekken node-koppeling en bootstrapverificatie.
    - `node.list` en `node.describe` retourneren bekende/verbonden nodestatus.
    - `node.rename` werkt een gekoppeld nodelabel bij.
    - `node.invoke` stuurt een commando door naar een verbonden node.
    - `node.invoke.result` retourneert het resultaat voor een invoke-aanvraag.
    - `node.event` draagt events die van een node afkomstig zijn terug naar de gateway.
    - `node.pending.pull` en `node.pending.ack` zijn de wachtrij-API's voor verbonden nodes.
    - `node.pending.enqueue` en `node.pending.drain` beheren duurzaam werk in behandeling voor offline/ontkoppelde nodes.

  </Accordion>

  <Accordion title="Goedkeuringsfamilies">
    - `exec.approval.request`, `exec.approval.get`, `exec.approval.list` en `exec.approval.resolve` dekken eenmalige exec-goedkeuringsaanvragen plus opzoeken/opnieuw afspelen van wachtende goedkeuringen.
    - `exec.approval.waitDecision` wacht op één wachtende exec-goedkeuring en retourneert de definitieve beslissing (of `null` bij timeout).
    - `exec.approvals.get` en `exec.approvals.set` beheren momentopnamen van het Gateway-beleid voor exec-goedkeuringen.
    - `exec.approvals.node.get` en `exec.approvals.node.set` beheren node-lokaal exec-goedkeuringsbeleid via node-relaycommando's.
    - `plugin.approval.request`, `plugin.approval.list`, `plugin.approval.waitDecision` en `plugin.approval.resolve` dekken door Plugins gedefinieerde goedkeuringsstromen.

  </Accordion>

  <Accordion title="Automatisering, Skills en tools">
    - Automatisering: `wake` plant een onmiddellijke of volgende-Heartbeat wake-tekstinjectie; `cron.get`, `cron.list`, `cron.status`, `cron.add`, `cron.update`, `cron.remove`, `cron.run`, `cron.runs` beheren gepland werk.
    - Skills en tools: `commands.list`, `skills.*`, `tools.catalog`, `tools.effective`, `tools.invoke`.

  </Accordion>
</AccordionGroup>

### Algemene gebeurtenisfamilies

- `chat`: UI-chatupdates zoals `chat.inject` en andere uitsluitend transcript-chatgebeurtenissen.
- `session.message` en `session.tool`: transcript-/eventstream-updates voor een
  geabonneerde sessie.
- `sessions.changed`: sessie-index of metadata gewijzigd.
- `presence`: updates van momentopnamen van systeempresentie.
- `tick`: periodieke keepalive- / liveness-gebeurtenis.
- `health`: update van Gateway-gezondheidsmomentopname.
- `heartbeat`: update van Heartbeat-eventstream.
- `cron`: wijzigingsgebeurtenis voor Cron-run/-taak.
- `shutdown`: melding van Gateway-afsluiting.
- `node.pair.requested` / `node.pair.resolved`: levenscyclus van node-koppeling.
- `node.invoke.request`: broadcast van node-aanroepverzoek.
- `device.pair.requested` / `device.pair.resolved`: levenscyclus van gekoppeld apparaat.
- `voicewake.changed`: configuratie van wake-wordtrigger gewijzigd.
- `exec.approval.requested` / `exec.approval.resolved`: exec-goedkeuringslevenscyclus.
- `plugin.approval.requested` / `plugin.approval.resolved`: Plugin-goedkeuringslevenscyclus.

### Node-helpermethoden

- Nodes mogen `skills.bins` aanroepen om de huidige lijst met skill-executables
  voor auto-allow-controles op te halen.

### Taakregister-RPC's

Operatorclients kunnen Gateway-achtergrondtaakrecords inspecteren en annuleren via
de taakregister-RPC's. Deze methoden retourneren opgeschoonde taaksamenvattingen, geen ruwe
runtime-status.

- `tasks.list` vereist `operator.read`.
  - Parameters: optioneel `status` (`"queued"`, `"running"`, `"completed"`,
    `"failed"`, `"cancelled"` of `"timed_out"`) of een array van die statussen,
    optioneel `agentId`, optioneel `sessionKey`, optioneel `limit` van `1` tot
    `500`, en optioneel string `cursor`.
  - Resultaat: `{ "tasks": TaskSummary[], "nextCursor"?: string }`.
- `tasks.get` vereist `operator.read`.
  - Parameters: `{ "taskId": string }`.
  - Resultaat: `{ "task": TaskSummary }`.
  - Ontbrekende taak-id's retourneren de Gateway not-found-foutvorm.
- `tasks.cancel` vereist `operator.write`.
  - Parameters: `{ "taskId": string, "reason"?: string }`.
  - Resultaat:
    `{ "found": boolean, "cancelled": boolean, "reason"?: string, "task"?: TaskSummary }`.
  - `found` meldt of het register een overeenkomende taak had. `cancelled`
    meldt of de runtime annulering heeft geaccepteerd of vastgelegd.

`TaskSummary` bevat `id`, `status` en optionele metadata zoals `kind`,
`runtime`, `title`, `agentId`, `sessionKey`, `childSessionKey`, `ownerKey`,
`runId`, `taskId`, `flowId`, `parentTaskId`, `sourceId`, tijdstempels, voortgang,
terminale samenvatting en opgeschoonde fouttekst.

### Operator-helpermethoden

- Operators mogen `commands.list` (`operator.read`) aanroepen om de runtime
  commando-inventaris voor een agent op te halen.
  - `agentId` is optioneel; laat het weg om de standaard agent-werkruimte te lezen.
  - `scope` bepaalt welk oppervlak de primaire `name` target:
    - `text` retourneert het primaire tekstcommandotoken zonder de voorafgaande `/`
    - `native` en het standaardpad `both` retourneren providerbewuste native namen
      wanneer beschikbaar
  - `textAliases` bevat exacte slash-aliassen zoals `/model` en `/m`.
  - `nativeName` bevat de providerbewuste native commandonaam wanneer die bestaat.
  - `provider` is optioneel en beïnvloedt alleen native naamgeving plus native beschikbaarheid
    van Plugin-commando's.
  - `includeArgs=false` laat geserialiseerde argumentmetadata weg uit de respons.
- Operators mogen `tools.catalog` (`operator.read`) aanroepen om de runtime-toolcatalogus voor een
  agent op te halen. De respons bevat gegroepeerde tools en herkomstmetadata:
  - `source`: `core` of `plugin`
  - `pluginId`: Plugin-eigenaar wanneer `source="plugin"`
  - `optional`: of een Plugin-tool optioneel is
- Operators mogen `tools.effective` (`operator.read`) aanroepen om de runtime-effectieve tool-
  inventaris voor een sessie op te halen.
  - `sessionKey` is vereist.
  - De Gateway leidt vertrouwde runtime-context af uit de sessie aan serverzijde in plaats van door de
    aanroeper geleverde auth- of leveringscontext te accepteren.
  - De respons is sessiegebonden en weerspiegelt wat het actieve gesprek nu kan gebruiken,
    inclusief core-, Plugin- en kanaaltools.
- Operators mogen `tools.invoke` (`operator.write`) aanroepen om één beschikbare tool aan te roepen via hetzelfde
  Gateway-beleidspad als `/tools/invoke`.
  - `name` is vereist. `args`, `sessionKey`, `agentId`, `confirm` en
    `idempotencyKey` zijn optioneel.
  - Als zowel `sessionKey` als `agentId` aanwezig zijn, moet de opgeloste sessieagent overeenkomen met
    `agentId`.
  - De respons is een SDK-gerichte envelop met `ok`, `toolName`, optionele `output` en getypeerde
    `error`-velden. Goedkeurings- of beleidsweigeringen retourneren `ok:false` in de payload in plaats van
    de Gateway-toolbeleidspijplijn te omzeilen.
- Operators mogen `skills.status` (`operator.read`) aanroepen om de zichtbare
  skill-inventaris voor een agent op te halen.
  - `agentId` is optioneel; laat het weg om de standaard agent-werkruimte te lezen.
  - De respons bevat geschiktheid, ontbrekende vereisten, configuratiecontroles en
    opgeschoonde installatieopties zonder ruwe geheime waarden bloot te leggen.
- Operators mogen `skills.search` en `skills.detail` (`operator.read`) aanroepen voor
  ClawHub-ontdekkingsmetadata.
- Operators mogen `skills.upload.begin`, `skills.upload.chunk` en
  `skills.upload.commit` (`operator.admin`) aanroepen om een privé-skillarchief klaar te zetten
  voordat het wordt geïnstalleerd. Dit is een apart admin-uploadpad voor vertrouwde clients,
  niet de normale ClawHub-skillinstallatiestroom, en is standaard uitgeschakeld tenzij
  `skills.install.allowUploadedArchives` is ingeschakeld.
  - `skills.upload.begin({ kind: "skill-archive", slug, sizeBytes, sha256?, force?, idempotencyKey? })`
    maakt een upload aan die is gekoppeld aan die slug en force-waarde.
  - `skills.upload.chunk({ uploadId, offset, dataBase64 })` voegt bytes toe op
    de exacte gedecodeerde offset.
  - `skills.upload.commit({ uploadId, sha256? })` verifieert de uiteindelijke grootte en
    SHA-256. Commit voltooit alleen de upload; het installeert de skill niet.
  - Geüploade skillarchieven zijn zip-archieven met een `SKILL.md`-root. De
    interne directorynaam van het archief selecteert nooit het installatiedoel.
- Operators mogen `skills.install` (`operator.admin`) aanroepen in drie modi:
  - ClawHub-modus: `{ source: "clawhub", slug, version?, force? }` installeert een
    skillmap in de `skills/`-directory van de standaard agent-werkruimte.
  - Uploadmodus: `{ source: "upload", uploadId, slug, force?, sha256?, timeoutMs? }`
    installeert een gecommitte upload in de directory `skills/<slug>` van de standaard agent-werkruimte.
    De slug en force-waarde moeten overeenkomen met het oorspronkelijke
    `skills.upload.begin`-verzoek. Deze modus wordt geweigerd tenzij
    `skills.install.allowUploadedArchives` is ingeschakeld. De instelling heeft geen
    invloed op ClawHub-installaties.
  - Gateway-installermodus: `{ name, installId, dangerouslyForceUnsafeInstall?, timeoutMs? }`
    voert een gedeclareerde `metadata.openclaw.install`-actie uit op de Gateway-host.
- Operators mogen `skills.update` (`operator.admin`) aanroepen in twee modi:
  - ClawHub-modus werkt één bijgehouden slug of alle bijgehouden ClawHub-installaties bij in
    de standaard agent-werkruimte.
  - Configuratiemodus patcht `skills.entries.<skillKey>`-waarden zoals `enabled`,
    `apiKey` en `env`.

### `models.list`-weergaven

`models.list` accepteert een optionele parameter `view`:

- Weggelaten of `"default"`: huidig runtime-gedrag. Als `agents.defaults.models` is geconfigureerd, is de respons de toegestane catalogus, inclusief dynamisch ontdekte modellen voor `provider/*`-items. Anders is de respons de volledige Gateway-catalogus.
- `"configured"`: picker-formaat gedrag. Als `agents.defaults.models` is geconfigureerd, heeft dit nog steeds voorrang, inclusief providergebonden ontdekking voor `provider/*`-items. Zonder allowlist gebruikt de respons expliciete `models.providers.*.models`-items, met terugval naar de volledige catalogus alleen wanneer er geen geconfigureerde modelrijen bestaan.
- `"all"`: volledige Gateway-catalogus, waarbij `agents.defaults.models` wordt omzeild. Gebruik dit voor diagnostiek en ontdekkings-UI's, niet voor normale modelpickers.

## Exec-goedkeuringen

- Wanneer een exec-verzoek goedkeuring nodig heeft, broadcast de Gateway `exec.approval.requested`.
- Operatorclients lossen dit op door `exec.approval.resolve` aan te roepen (vereist `operator.approvals`-scope).
- Voor `host=node` moet `exec.approval.request` `systemRunPlan` bevatten (canonieke `argv`/`cwd`/`rawCommand`/sessiemetadata). Verzoeken zonder `systemRunPlan` worden geweigerd.
- Na goedkeuring hergebruiken doorgestuurde `node.invoke system.run`-aanroepen dat canonieke
  `systemRunPlan` als de gezaghebbende opdracht-/cwd-/sessiecontext.
- Als een aanroeper `command`, `rawCommand`, `cwd`, `agentId` of
  `sessionKey` muteert tussen voorbereiding en de definitieve goedgekeurde `system.run`-forward, weigert de
  Gateway de run in plaats van de gemuteerde payload te vertrouwen.

## Terugval voor agentlevering

- `agent`-verzoeken kunnen `deliver=true` bevatten om uitgaande levering aan te vragen.
- `bestEffortDeliver=false` behoudt strikt gedrag: onopgeloste of alleen interne leveringsdoelen retourneren `INVALID_REQUEST`.
- `bestEffortDeliver=true` staat terugval naar sessie-only uitvoering toe wanneer geen externe leverbare route kan worden opgelost (bijvoorbeeld interne/webchat-sessies of dubbelzinnige multikanaalconfiguraties).
- Definitieve `agent`-resultaten kunnen `result.deliveryStatus` bevatten wanneer levering is
  aangevraagd, met dezelfde statussen `sent`, `suppressed`, `partial_failed` en `failed`
  die zijn gedocumenteerd voor [`openclaw agent --json --deliver`](/nl/cli/agent#json-delivery-status).

## Versiebeheer

- `PROTOCOL_VERSION` staat in `src/gateway/protocol/version.ts`.
- Clients sturen `minProtocol` + `maxProtocol`; de server weigert bereiken die
  het huidige protocol niet bevatten. Native clients gebruiken een v3-ondergrens zodat
  additieve v4-clients nog steeds v3-Gateways kunnen bereiken.
- Schema's + modellen worden gegenereerd uit TypeBox-definities:
  - `pnpm protocol:gen`
  - `pnpm protocol:gen:swift`
  - `pnpm protocol:check`

### Clientconstanten

De referentieclient in `src/gateway/client.ts` gebruikt deze standaardwaarden. Waarden zijn
stabiel binnen protocol v4 en vormen de verwachte basislijn voor externe clients.

| Constante                                 | Standaardwaarde                                       | Bron                                                                                       |
| ----------------------------------------- | ----------------------------------------------------- | ------------------------------------------------------------------------------------------ |
| `PROTOCOL_VERSION`                        | `4`                                                   | `src/gateway/protocol/version.ts`                                                          |
| `MIN_CLIENT_PROTOCOL_VERSION`             | `3`                                                   | `src/gateway/protocol/version.ts`                                                          |
| Aanvraagtime-out (per RPC)                | `30_000` ms                                           | `src/gateway/client.ts` (`requestTimeoutMs`)                                               |
| Preauth-/connect-challenge-time-out       | `15_000` ms                                           | `src/gateway/handshake-timeouts.ts` (config/env kan het gekoppelde server-/clientbudget verhogen) |
| Initiële reconnect-backoff                | `1_000` ms                                            | `src/gateway/client.ts` (`backoffMs`)                                                      |
| Maximale reconnect-backoff                | `30_000` ms                                           | `src/gateway/client.ts` (`scheduleReconnect`)                                              |
| Klem voor snelle nieuwe poging na sluiten door apparaat-token | `250` ms                                              | `src/gateway/client.ts`                                                                    |
| Respijtperiode voor geforceerd stoppen vóór `terminate()` | `250` ms                                              | `FORCE_STOP_TERMINATE_GRACE_MS`                                                            |
| Standaardtime-out voor `stopAndWait()`    | `1_000` ms                                            | `STOP_AND_WAIT_TIMEOUT_MS`                                                                 |
| Standaard tick-interval (vóór `hello-ok`) | `30_000` ms                                           | `src/gateway/client.ts`                                                                    |
| Sluiten bij tick-time-out                 | code `4000` wanneer stilte langer duurt dan `tickIntervalMs * 2` | `src/gateway/client.ts`                                                                    |
| `MAX_PAYLOAD_BYTES`                       | `25 * 1024 * 1024` (25 MB)                            | `src/gateway/server-constants.ts`                                                          |

De server adverteert de effectieve waarden voor `policy.tickIntervalMs`, `policy.maxPayload`,
en `policy.maxBufferedBytes` in `hello-ok`; clients moeten die waarden respecteren
in plaats van de standaardwaarden van vóór de handshake.

## Authenticatie

- Shared-secret Gateway-authenticatie gebruikt `connect.params.auth.token` of
  `connect.params.auth.password`, afhankelijk van de geconfigureerde authenticatiemodus.
- Modi die identiteit dragen, zoals Tailscale Serve
  (`gateway.auth.allowTailscale: true`) of niet-loopback
  `gateway.auth.mode: "trusted-proxy"` voldoen aan de connect-authenticatiecontrole via
  aanvraagheaders in plaats van `connect.params.auth.*`.
- Private-ingress `gateway.auth.mode: "none"` slaat shared-secret connect-authenticatie
  volledig over; stel die modus niet bloot op publieke/niet-vertrouwde ingress.
- Na pairing geeft de Gateway een **apparaat-token** uit dat is beperkt tot de verbindingsrol
  + scopes. Het wordt teruggegeven in `hello-ok.auth.deviceToken` en moet door de
  client worden bewaard voor toekomstige verbindingen.
- Clients moeten het primaire `hello-ok.auth.deviceToken` bewaren na elke
  geslaagde verbinding.
- Opnieuw verbinden met dat **opgeslagen** apparaat-token moet ook de opgeslagen
  goedgekeurde scopeset voor dat token hergebruiken. Dit behoudt lees-/probe-/statustoegang
  die al was verleend en voorkomt dat reconnects stilzwijgend worden teruggebracht tot een
  beperktere impliciete admin-only scope.
- Client-side samenstelling van connect-authenticatie (`selectConnectAuth` in
  `src/gateway/client.ts`):
  - `auth.password` is orthogonaal en wordt altijd doorgestuurd wanneer ingesteld.
  - `auth.token` wordt gevuld in prioriteitsvolgorde: eerst expliciet gedeeld token,
    daarna een expliciete `deviceToken`, daarna een opgeslagen per-device token (gesleuteld op
    `deviceId` + `role`).
  - `auth.bootstrapToken` wordt alleen verzonden wanneer geen van bovenstaande een
    `auth.token` heeft opgelost. Een gedeeld token of een opgelost apparaat-token onderdrukt dit.
  - Automatische promotie van een opgeslagen apparaat-token bij de eenmalige
    `AUTH_TOKEN_MISMATCH`-retry is beperkt tot **vertrouwde eindpunten** —
    loopback, of `wss://` met een gepinde `tlsFingerprint`. Publieke `wss://`
    zonder pinning kwalificeert niet.
- Aanvullende vermeldingen in `hello-ok.auth.deviceTokens` zijn bootstrap-handofftokens.
  Bewaar ze alleen wanneer de verbinding bootstrap-authenticatie gebruikte op een vertrouwd transport
  zoals `wss://` of loopback/lokale pairing.
- Als een client een **expliciete** `deviceToken` of expliciete `scopes` levert, blijft die
  door de caller aangevraagde scopeset leidend; gecachte scopes worden alleen
  hergebruikt wanneer de client het opgeslagen per-device token hergebruikt.
- Apparaat-tokens kunnen worden geroteerd/ingetrokken via `device.token.rotate` en
  `device.token.revoke` (vereist scope `operator.pairing`).
- `device.token.rotate` retourneert rotatiemetadata. Het echoot het vervangende
  bearer-token alleen voor same-device calls die al met dat apparaat-token zijn geauthenticeerd,
  zodat token-only clients hun vervanging kunnen bewaren voordat ze opnieuw verbinden.
  Shared/admin-rotaties echoën het bearer-token niet.
- Tokenuitgifte, rotatie en intrekking blijven begrensd tot de goedgekeurde rollenset
  die is vastgelegd in de pairing-vermelding van dat apparaat; tokenmutatie kan geen
  apparaatrol uitbreiden of targeten die nooit door pairing-goedkeuring is verleend.
- Voor paired-device tokensessies is apparaatbeheer self-scoped, tenzij de
  caller ook `operator.admin` heeft: niet-admin-callers kunnen alleen hun **eigen**
  apparaatvermelding verwijderen/intrekken/roteren.
- `device.token.rotate` en `device.token.revoke` controleren ook de scopeset van het target
  operator-token tegen de huidige sessiescopes van de caller. Niet-admin-callers
  kunnen geen breder operator-token roteren of intrekken dan ze al hebben.
- Authenticatiefouten bevatten `error.details.code` plus herstelhints:
  - `error.details.canRetryWithDeviceToken` (boolean)
  - `error.details.recommendedNextStep` (`retry_with_device_token`, `update_auth_configuration`, `update_auth_credentials`, `wait_then_retry`, `review_auth_configuration`)
- Clientgedrag voor `AUTH_TOKEN_MISMATCH`:
  - Vertrouwde clients mogen één begrensde retry proberen met een gecacht per-device token.
  - Als die retry faalt, moeten clients automatische reconnect-loops stoppen en operator-actieadvies tonen.
- `AUTH_SCOPE_MISMATCH` betekent dat het apparaat-token werd herkend maar de
  gevraagde rol/scopes niet dekt. Clients moeten dit niet presenteren als een ongeldig token;
  vraag de operator om opnieuw te pairen of het smallere/bredere scopecontract goed te keuren.

## Apparaatidentiteit + pairing

- Nodes moeten een stabiele apparaatidentiteit (`device.id`) opnemen die is afgeleid van een
  keypair-fingerprint.
- Gateways geven tokens uit per apparaat + rol.
- Pairing-goedkeuringen zijn vereist voor nieuwe apparaat-ID's, tenzij lokale auto-goedkeuring
  is ingeschakeld.
- Pairing-auto-goedkeuring is gericht op directe local loopback-verbindingen.
- OpenClaw heeft ook een smal backend-/container-lokaal self-connect-pad voor
  vertrouwde shared-secret helperflows.
- Same-host tailnet- of LAN-verbindingen worden nog steeds als remote behandeld voor pairing en
  vereisen goedkeuring.
- WS-clients nemen normaal gesproken `device`-identiteit op tijdens `connect` (operator +
  node). De enige operator-uitzonderingen zonder apparaat zijn expliciete vertrouwenspaden:
  - `gateway.controlUi.allowInsecureAuth=true` voor localhost-only onveilige HTTP-compatibiliteit.
  - geslaagde `gateway.auth.mode: "trusted-proxy"` operator Control UI-authenticatie.
  - `gateway.controlUi.dangerouslyDisableDeviceAuth=true` (break-glass, ernstige beveiligingsdowngrade).
  - direct-loopback `gateway-client` backend-RPC's geauthenticeerd met het gedeelde
    gatewaytoken/wachtwoord.
- Alle verbindingen moeten de door de server geleverde nonce `connect.challenge` ondertekenen.

### Diagnostiek voor migratie van apparaatauthenticatie

Voor legacy clients die nog gedrag van vóór challenge-ondertekening gebruiken, retourneert `connect` nu
`DEVICE_AUTH_*`-detailcodes onder `error.details.code` met een stabiele `error.details.reason`.

Veelvoorkomende migratiefouten:

| Bericht                     | details.code                     | details.reason           | Betekenis                                          |
| --------------------------- | -------------------------------- | ------------------------ | -------------------------------------------------- |
| `device nonce required`     | `DEVICE_AUTH_NONCE_REQUIRED`     | `device-nonce-missing`   | Client liet `device.nonce` weg (of stuurde leeg).  |
| `device nonce mismatch`     | `DEVICE_AUTH_NONCE_MISMATCH`     | `device-nonce-mismatch`  | Client ondertekende met een verouderde/verkeerde nonce. |
| `device signature invalid`  | `DEVICE_AUTH_SIGNATURE_INVALID`  | `device-signature`       | Signature-payload komt niet overeen met v2-payload. |
| `device signature expired`  | `DEVICE_AUTH_SIGNATURE_EXPIRED`  | `device-signature-stale` | Ondertekende timestamp valt buiten toegestane skew. |
| `device identity mismatch`  | `DEVICE_AUTH_DEVICE_ID_MISMATCH` | `device-id-mismatch`     | `device.id` komt niet overeen met de public-key-fingerprint. |
| `device public key invalid` | `DEVICE_AUTH_PUBLIC_KEY_INVALID` | `device-public-key`      | Public-key-formaat/canonicalisatie is mislukt.     |

Migratiedoel:

- Wacht altijd op `connect.challenge`.
- Onderteken de v2-payload die de servernonce bevat.
- Stuur dezelfde nonce in `connect.params.device.nonce`.
- De voorkeurs-signature-payload is `v3`, die naast device/client/role/scopes/token/nonce-velden ook
  `platform` en `deviceFamily` bindt.
- Legacy `v2`-handtekeningen blijven geaccepteerd voor compatibiliteit, maar paired-device
  metadata-pinning blijft commandobeleid bij reconnect bepalen.

## TLS + pinning

- TLS wordt ondersteund voor WS-verbindingen.
- Clients kunnen optioneel de gateway-certfingerprint pinnen (zie `gateway.tls`
  configuratie plus `gateway.remote.tlsFingerprint` of CLI `--tls-fingerprint`).

## Scope

Dit protocol exposeert de **volledige gateway-API** (status, kanalen, modellen, chat,
agent, sessies, nodes, goedkeuringen, enz.). Het exacte oppervlak wordt gedefinieerd door de
TypeBox-schema's in `src/gateway/protocol/schema.ts`.

## Gerelateerd

- [Bridge-protocol](/nl/gateway/bridge-protocol)
- [Gateway-runbook](/nl/gateway)
