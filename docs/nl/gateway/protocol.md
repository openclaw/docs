---
read_when:
    - Gateway-WS-clients implementeren of bijwerken
    - Protocolmismatches of verbindingsfouten debuggen
    - Protocolschema/-modellen opnieuw genereren
summary: 'Gateway WebSocket-protocol: handshake, frames, versiebeheer'
title: Gateway-protocol
x-i18n:
    generated_at: "2026-07-03T13:39:30Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 815ac729824587579d112d665df2060d84d2894b4d46235e210804ca8a07082d
    source_path: gateway/protocol.md
    workflow: 16
---

Het Gateway WS-protocol is het **enige control plane + node-transport** voor
OpenClaw. Alle clients (CLI, web-UI, macOS-app, iOS/Android-nodes, headless
nodes) verbinden via WebSocket en declareren hun **rol** + **scope** tijdens de
handshake.

## Transport

- WebSocket, tekstframes met JSON-payloads.
- Het eerste frame **moet** een `connect`-request zijn.
- Pre-connect-frames zijn begrensd op 64 KiB. Na een succesvolle handshake moeten clients
  de limieten `hello-ok.policy.maxPayload` en
  `hello-ok.policy.maxBufferedBytes` volgen. Met diagnostiek ingeschakeld
  versturen te grote inkomende frames en trage uitgaande buffers `payload.large`-events
  voordat de gateway het getroffen frame sluit of laat vallen. Deze events bewaren
  groottes, limieten, oppervlakken en veilige reden-codes. Ze bewaren niet de berichttekst,
  attachment-inhoud, raw frame body, tokens, cookies of geheime waarden.

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

Terwijl de Gateway nog bezig is met het afronden van startup-sidecars, kan de `connect`-request
een opnieuw te proberen `UNAVAILABLE`-fout retourneren met `details.reason` ingesteld op
`"startup-sidecars"` en `retryAfterMs`. Clients moeten die respons opnieuw proberen
binnen hun totale verbindingsbudget in plaats van deze als terminale
handshake-fout te tonen.

`server`, `features`, `snapshot` en `policy` zijn allemaal vereist door het schema
(`packages/gateway-protocol/src/schema/frames.ts`). `auth` is ook vereist en rapporteert
de onderhandelde rol/scopes. `pluginSurfaceUrls` is optioneel en koppelt Plugin-oppervlaknamen,
zoals `canvas`, aan gescopete gehoste URL's.

Gescopete Plugin-oppervlak-URL's kunnen verlopen. Nodes kunnen
`node.pluginSurface.refresh` aanroepen met `{ "surface": "canvas" }` om een verse
entry in `pluginSurfaceUrls` te ontvangen. De experimentele Canvas Plugin-refactor ondersteunt niet
het verouderde compatibiliteitspad `canvasHostUrl`, `canvasCapability` of
`node.canvas.capability.refresh`; huidige native clients en
gateways moeten Plugin-oppervlakken gebruiken.

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
`client.mode: "backend"`) mogen `device` weglaten op directe loopback-verbindingen wanneer
ze authenticeren met het gedeelde gateway-token/wachtwoord. Dit pad is gereserveerd
voor interne control-plane-RPC's en voorkomt dat verouderde CLI/device-pairingbaselines
lokaal backendwerk blokkeren, zoals updates van subagentsessies. Remote clients,
browser-origin-clients, node-clients en expliciete device-token/device-identity-clients
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

Ingebouwde bootstrap via QR/setup-code is een vers mobiel overdrachtspad. Een succesvolle
connect met baseline-setup-code retourneert een primaire node-token plus één begrensde
operator-token:

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

De operator-overdracht is bewust begrensd zodat QR-onboarding de
mobiele operatorlus kan starten en native setup kan voltooien zonder pairing-
mutatiescopes of `operator.admin` te verlenen. Deze bevat `operator.talk.secrets` zodat de
native client de Talk-configuratie kan lezen die hij na bootstrap nodig heeft. Bredere
pairing- en admin-toegang vereist een aparte goedgekeurde operator-pairing of tokenflow.
Clients moeten `hello-ok.auth.deviceTokens` alleen bewaren
wanneer de connect bootstrap-auth gebruikte op vertrouwd transport zoals `wss://` of
loopback/lokale pairing.

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

Methoden met side-effects vereisen **idempotency keys** (zie schema).

## Rollen + scopes

Zie [Operatorscopes](/nl/gateway/operator-scopes) voor het volledige operator-scopemodel,
controles op goedkeuringstijd en semantiek voor gedeelde secrets.

### Rollen

- `operator` = control plane-client (CLI/UI/automatisering).
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
Wanneer secrets zijn opgenomen, moeten clients de actieve Talk-providercredential
lezen uit `talk.resolved.config.apiKey`; `talk.providers.<id>.apiKey`
blijft source-shaped en kan een SecretRef-object of een geredigeerde string zijn.

Door Plugins geregistreerde gateway-RPC-methoden kunnen hun eigen operator-scope vragen, maar
gereserveerde core-adminprefixen (`config.*`, `exec.approvals.*`, `wizard.*`,
`update.*`) resolven altijd naar `operator.admin`.

Methodescope is alleen de eerste poort. Sommige slash-commando's die via
`chat.send` worden bereikt, passen daarbovenop strengere controles op commandoniveau toe. Bijvoorbeeld: persistente
`/config set`- en `/config unset`-writes vereisen `operator.admin`.

`node.pair.approve` heeft ook een extra scopecontrole op goedkeuringstijd boven op de
basismethodescope:

- requests zonder commando: `operator.pairing`
- requests met non-exec node-commando's: `operator.pairing` + `operator.write`
- requests die `system.run`, `system.run.prepare` of `system.which` bevatten:
  `operator.pairing` + `operator.admin`

### Caps/commands/permissions (node)

Nodes declareren capability-claims tijdens connect:

- `caps`: capability-categorieën op hoog niveau zoals `camera`, `canvas`, `screen`,
  `location`, `voice` en `talk`.
- `commands`: allowlist voor commando's voor invoke.
- `permissions`: granulaire toggles (bijv. `screen.record`, `camera.capture`).

De Gateway behandelt deze als **claims** en handhaaft server-side allowlists.

## Presence

- `system-presence` retourneert entries met device-identiteit als sleutel.
- Presence-entries bevatten `deviceId`, `roles` en `scopes`, zodat UI's één rij per device kunnen tonen
  zelfs wanneer het verbindt als zowel **operator** als **node**.
- `node.list` bevat optionele velden `lastSeenAtMs` en `lastSeenReason`. Verbonden nodes rapporteren
  hun huidige verbindingstijd als `lastSeenAtMs` met reden `connect`; gepairde nodes kunnen ook
  duurzame achtergrond-presence rapporteren wanneer een vertrouwd node-event hun pairingmetadata bijwerkt.

### Achtergrond-alive-event voor nodes

Nodes mogen `node.event` aanroepen met `event: "node.presence.alive"` om vast te leggen dat een gepairde node
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

Oudere gateways kunnen voor `node.event` nog steeds `{ "ok": true }` retourneren; clients moeten dat behandelen als een
bevestigde RPC, niet als duurzame presence-persistentie.

## Scoping van broadcast-events

Door de server gepushte WebSocket-broadcast-events zijn scope-gated zodat pairing-gescopete of node-only sessies niet passief sessie-inhoud ontvangen.

- **Chat-, agent- en tool-result-frames** (inclusief gestreamde `agent`-events en resultaten van tool-calls) vereisen minimaal `operator.read`. Sessies zonder `operator.read` slaan deze frames volledig over.
- **Door Plugins gedefinieerde `plugin.*`-broadcasts** zijn gated op `operator.write` of `operator.admin`, afhankelijk van hoe de Plugin ze heeft geregistreerd.
- **Status- en transportevents** (`heartbeat`, `presence`, `tick`, connect/disconnect-lifecycle, enz.) blijven onbeperkt zodat transportgezondheid zichtbaar blijft voor elke geauthenticeerde sessie.
- **Onbekende broadcast-eventfamilies** zijn standaard scope-gated (fail-closed), tenzij een geregistreerde handler ze expliciet versoepelt.

Elke clientverbinding houdt haar eigen per-client-volgnummer bij, zodat broadcasts monotone ordening op die socket behouden, zelfs wanneer verschillende clients verschillende scope-gefilterde subsets van de eventstream zien.

## Veelvoorkomende RPC-methodefamilies

Het publieke WS-oppervlak is breder dan de handshake/auth-voorbeelden hierboven. Dit
is geen gegenereerde dump — `hello-ok.features.methods` is een conservatieve
discoverylijst die is opgebouwd uit `src/gateway/server-methods-list.ts` plus geladen
exports van Plugin-/kanaalmethoden. Behandel deze als feature-discovery, niet als een volledige
opsomming van `src/gateway/server-methods/*.ts`.

  <AccordionGroup>
  <Accordion title="System and identity">
    - `health` retourneert de in de cache opgeslagen of zojuist gepeilde momentopname van de Gateway-gezondheid.
    - `diagnostics.stability` retourneert de recente begrensde recorder voor diagnostische stabiliteit. Deze bewaart operationele metadata zoals gebeurtenisnamen, aantallen, bytegroottes, geheugenuitlezingen, wachtrij-/sessiestatus, kanaal-/Plugin-namen en sessie-id's. Deze bewaart geen chattekst, Webhook-bodies, tooluitvoer, onbewerkte aanvraag- of responsbodies, tokens, cookies of geheime waarden. Leesbereik voor operators is vereist.
    - `status` retourneert de Gateway-samenvatting in `/status`-stijl; gevoelige velden worden alleen opgenomen voor operatorclients met adminbereik.
    - `gateway.identity.get` retourneert de Gateway-apparaatidentiteit die wordt gebruikt door relay- en koppelingsflows.
    - `system-presence` retourneert de huidige aanwezigheidsmomentopname voor verbonden operator-/node-apparaten.
    - `system-event` voegt een systeemgebeurtenis toe en kan aanwezigheidscontext bijwerken/uitzenden.
    - `last-heartbeat` retourneert de laatst bewaarde Heartbeat-gebeurtenis.
    - `set-heartbeats` schakelt Heartbeat-verwerking op de Gateway in of uit.

  </Accordion>

  <Accordion title="Models and usage">
    - `models.list` retourneert de modelcatalogus die tijdens runtime is toegestaan. Geef `{ "view": "configured" }` door voor geconfigureerde modellen op pickerformaat (eerst `agents.defaults.models`, daarna `models.providers.*.models`), of `{ "view": "all" }` voor de volledige catalogus.
    - `usage.status` retourneert providergebruikvensters/samenvattingen van resterende quota.
    - `usage.cost` retourneert geaggregeerde kostenoverzichten voor een datumbereik.
      Geef `agentId` door voor één agent, of `agentScope: "all"` om geconfigureerde agents te aggregeren.
    - `doctor.memory.status` retourneert gereedheid van vectorgeheugen / gecachete embeddings voor de actieve standaardagentwerkruimte. Geef `{ "probe": true }` of `{ "deep": true }` alleen door wanneer de aanroeper expliciet een live ping naar de embeddingprovider wil. Dreaming-bewuste clients kunnen ook `{ "agentId": "agent-id" }` doorgeven om Dreaming-storestatistieken te beperken tot een geselecteerde agentwerkruimte; als `agentId` wordt weggelaten, blijft de fallback naar de standaardagent behouden en worden geconfigureerde Dreaming-werkruimten geaggregeerd.
    - `doctor.memory.dreamDiary`, `doctor.memory.backfillDreamDiary`, `doctor.memory.resetDreamDiary`, `doctor.memory.resetGroundedShortTerm`, `doctor.memory.repairDreamingArtifacts` en `doctor.memory.dedupeDreamDiary` accepteren optionele `{ "agentId": "agent-id" }`-parameters voor Dreaming-weergaven/-acties voor geselecteerde agents. Wanneer `agentId` wordt weggelaten, werken ze op de geconfigureerde standaardagentwerkruimte.
    - `doctor.memory.remHarness` retourneert een begrensde, alleen-lezen REM-harnesspreview voor externe control-plane-clients. Deze kan werkruimtepaden, geheugenfragmenten, gerenderde gegronde Markdown en kandidaten voor diepe promotie bevatten, dus aanroepers hebben `operator.read` nodig.
    - `sessions.usage` retourneert gebruikssamenvattingen per sessie. Geef `agentId` door voor één
      agent, of `agentScope: "all"` om geconfigureerde agents samen weer te geven.
    - `sessions.usage.timeseries` retourneert tijdreeksgebruik voor één sessie.
    - `sessions.usage.logs` retourneert gebruikslogboekitems voor één sessie.

  </Accordion>

  <Accordion title="Channels and login helpers">
    - `channels.status` retourneert statusoverzichten van ingebouwde + gebundelde kanalen/Plugins.
    - `channels.logout` meldt een specifiek kanaal/account af wanneer het kanaal afmelden ondersteunt.
    - `web.login.start` start een QR-/webinlogflow voor de huidige webkanaalprovider met QR-ondersteuning.
    - `web.login.wait` wacht tot die QR-/webinlogflow is voltooid en start het kanaal bij succes.
    - `push.test` verzendt een test-APNs-push naar een geregistreerde iOS-node.
    - `voicewake.get` retourneert de opgeslagen wake-word-triggers.
    - `voicewake.set` werkt wake-word-triggers bij en zendt de wijziging uit.

  </Accordion>

  <Accordion title="Messaging and logs">
    - `send` is de directe RPC voor uitgaande aflevering voor verzenden gericht op kanaal/account/thread buiten de chatrunner.
    - `logs.tail` retourneert de geconfigureerde Gateway-bestandslogtail met cursor-/limiet- en max-bytebesturing.

  </Accordion>

  <Accordion title="Talk and TTS">
    - `talk.catalog` retourneert de alleen-lezen Talk-providercatalogus voor spraak, streamingtranscriptie en realtime stem. Deze bevat canonieke provider-id's, registeraliassen, labels, geconfigureerde status, een optioneel groepsniveau-`ready`-resultaat, blootgestelde model-/stem-id's, canonieke modi, transporten, brain-strategieën en realtime audio-/capability-vlaggen, zonder providergeheimen te retourneren of globale config te muteren. Huidige Gateways zetten `ready` na toepassing van providerselectie tijdens runtime; clients moeten afwezigheid ervan behandelen als niet-geverifieerd voor compatibiliteit met oudere Gateways.
    - `talk.config` retourneert de effectieve Talk-configpayload; `includeSecrets` vereist `operator.talk.secrets` (of `operator.admin`).
    - `talk.session.create` maakt een door de Gateway beheerde Talk-sessie voor `realtime/gateway-relay`, `transcription/gateway-relay` of `stt-tts/managed-room`. Voor `stt-tts/managed-room` moeten aanroepers met `operator.write` die `sessionKey` doorgeven ook `spawnedBy` doorgeven voor zichtbaarheid van sessiesleutels met bereik; aanmaken van een `sessionKey` zonder bereik en `brain: "direct-tools"` vereisen `operator.admin`.
    - `talk.session.join` valideert een sessietoken voor een beheerde ruimte, emitteert waar nodig `session.ready`- of `session.replaced`-gebeurtenissen, en retourneert ruimte-/sessiemetadata plus recente Talk-gebeurtenissen zonder de token in platte tekst of opgeslagen tokenhash.
    - `talk.session.appendAudio` voegt base64-PCM-invoeraudio toe aan door de Gateway beheerde realtime relay- en transcriptiesessies.
    - `talk.session.startTurn`, `talk.session.endTurn` en `talk.session.cancelTurn` sturen de beurtlevenscyclus van beheerde ruimtes aan met verwerping van verlopen beurten voordat de status wordt gewist.
    - `talk.session.cancelOutput` stopt audio-uitvoer van de assistant, vooral voor door VAD begrensde barge-in in Gateway-relaysessies.
    - `talk.session.submitToolResult` voltooit een providertoolaanroep die is geëmitteerd door een door de Gateway beheerde realtime relaysessie. Geef `options: { willContinue: true }` door voor tussentijdse tooluitvoer wanneer een eindresultaat volgt, of `options: { suppressResponse: true }` wanneer het toolresultaat de provideraanroep moet vervullen zonder een nieuwe realtime assistant-respons te starten.
    - `talk.session.steer` stuurt spraakbesturing voor een actieve run naar een door de Gateway beheerde, agentondersteunde Talk-sessie. Deze accepteert `{ sessionId, text, mode? }`, waarbij `mode` `status`, `steer`, `cancel` of `followup` is; weggelaten modus wordt geclassificeerd op basis van de uitgesproken tekst.
    - `talk.session.close` sluit een door de Gateway beheerde relay-, transcriptie- of beheerde-ruimtesessie en emitteert terminale Talk-gebeurtenissen.
    - `talk.mode` stelt de huidige Talk-modusstatus in voor WebChat-/Control UI-clients en zendt deze uit.
    - `talk.client.create` maakt een door de client beheerde realtime providersessie met `webrtc` of `provider-websocket`, terwijl de Gateway eigenaar blijft van config, referenties, instructies en toolbeleid.
    - `talk.client.toolCall` laat door de client beheerde realtime transporten providertoolaanroepen doorsturen naar Gateway-beleid. De eerste ondersteunde tool is `openclaw_agent_consult`; clients ontvangen een run-id en wachten op normale chatlevenscyclusgebeurtenissen voordat ze het providerspecifieke toolresultaat indienen.
    - `talk.client.steer` verzendt spraakbesturing voor een actieve run voor door de client beheerde realtime transporten. De Gateway lost de actieve embedded run op uit `sessionKey` en retourneert een gestructureerd geaccepteerd/geweigerd resultaat in plaats van sturing stilzwijgend te negeren.
    - `talk.event` is het enkele Talk-gebeurteniskanaal voor realtime, transcriptie, STT/TTS, beheerde ruimtes, telefonie en vergaderadapters.
    - `talk.speak` synthetiseert spraak via de actieve Talk-spraakprovider.
    - `tts.status` retourneert de ingeschakelde TTS-status, actieve provider, fallbackproviders en providerconfigstatus.
    - `tts.providers` retourneert de zichtbare TTS-providerinventaris.
    - `tts.enable` en `tts.disable` schakelen de TTS-voorkeursstatus in of uit.
    - `tts.setProvider` werkt de voorkeurs-TTS-provider bij.
    - `tts.convert` voert een eenmalige tekst-naar-spraakconversie uit.

  </Accordion>

  <Accordion title="Secrets, config, update, and wizard">
    - `secrets.reload` lost actieve SecretRefs opnieuw op en vervangt de runtimegeheimstatus alleen bij volledig succes.
    - `secrets.resolve` lost geheime toewijzingen voor opdrachttargets op voor een specifieke opdracht-/targetset.
    - `config.get` retourneert de huidige configmomentopname en hash.
    - `config.set` schrijft een gevalideerde configpayload.
    - `config.patch` voegt een gedeeltelijke configupdate samen. Destructieve arrayvervanging
      vereist het betrokken pad in `replacePaths`; geneste arrays
      onder array-items gebruiken `[]`-paden zoals `agents.list[].skills`.
    - `config.apply` valideert + vervangt de volledige configpayload.
    - `config.schema` retourneert de live configschemapayload die wordt gebruikt door Control UI- en CLI-tooling: schema, `uiHints`, versie en generatiemetadata, inclusief Plugin- + kanaalschemametadata wanneer de runtime die kan laden. Het schema bevat veldmetadata `title` / `description` die is afgeleid van dezelfde labels en helptekst die door de UI worden gebruikt, inclusief geneste object-, wildcard-, array-item- en `anyOf` / `oneOf` / `allOf`-compositietakken wanneer bijpassende velddocumentatie bestaat.
    - `config.schema.lookup` retourneert een padgebonden lookuppayload voor één configpad: genormaliseerd pad, een oppervlakkige schemanode, overeenkomende hint + `hintPath`, optionele `reloadKind` en directe kindsamenvattingen voor UI-/CLI-drill-down. `reloadKind` is een van `restart`, `hot` of `none` en weerspiegelt de Gateway-configherlaadplanner voor het aangevraagde pad. Lookupschemanodes behouden de gebruikersgerichte docs en gangbare validatievelden (`title`, `description`, `type`, `enum`, `const`, `format`, `pattern`, grenzen voor numeriek/string/array/object, en vlaggen zoals `additionalProperties`, `deprecated`, `readOnly`, `writeOnly`). Kindsamenvattingen tonen `key`, genormaliseerd `path`, `type`, `required`, `hasChildren`, optionele `reloadKind`, plus de overeenkomende `hint` / `hintPath`.
    - `update.run` voert de Gateway-updateflow uit en plant alleen een herstart wanneer de update zelf is geslaagd; aanroepers met een sessie kunnen `continuationMessage` opnemen zodat het opstarten één vervolgbeurt van de agent hervat via de wachtrij voor herstartvoortzetting. Package-manager-updates en gecontroleerde git-checkout-updates vanuit de control plane gebruiken een losgekoppelde overdracht aan een beheerde service in plaats van de pakketboom te vervangen of checkout-/builduitvoer binnen de live Gateway te muteren. Een gestarte overdracht retourneert `ok: true` met `result.reason: "managed-service-handoff-started"` en `handoff.status: "started"`; niet-beschikbare of mislukte overdrachten retourneren `ok: false` met `managed-service-handoff-unavailable` of `managed-service-handoff-failed`, plus `handoff.command` wanneer een handmatige shellupdate vereist is. Een niet-beschikbare overdracht betekent dat OpenClaw geen veilige supervisorgrens of duurzame service-identiteit heeft, zoals `OPENCLAW_SYSTEMD_UNIT` voor systemd. Tijdens een gestarte overdracht kan de herstartsentinel kort `stats.reason: "restart-health-pending"` rapporteren; de voortzetting wordt uitgesteld totdat de CLI de herstarte Gateway verifieert en de definitieve `ok`-sentinel schrijft.
    - `update.status` vernieuwt en retourneert de nieuwste update-herstartsentinel, inclusief de draaiende versie na herstart wanneer beschikbaar.
    - `wizard.start`, `wizard.next`, `wizard.status` en `wizard.cancel` stellen de onboardingwizard beschikbaar via WS RPC.

  </Accordion>

  <Accordion title="Helpers voor agents en werkruimten">
    - `agents.list` retourneert geconfigureerde agentvermeldingen, inclusief effectief model en runtimemetagegevens.
    - `agents.create`, `agents.update` en `agents.delete` beheren agentrecords en werkruimtebedrading.
    - `agents.files.list`, `agents.files.get` en `agents.files.set` beheren de bootstrap-werkruimtebestanden die voor een agent beschikbaar zijn.
    - `tasks.list`, `tasks.get` en `tasks.cancel` stellen het Gateway-taakregister beschikbaar aan SDK- en operatorclients.
    - `artifacts.list`, `artifacts.get` en `artifacts.download` stellen uit transcripties afgeleide artifactsamenvattingen en downloads beschikbaar voor een expliciete `sessionKey`-, `runId`- of `taskId`-scope. Run- en taakquery's lossen de eigenaarsessie server-side op en retourneren alleen transcriptiemedia met overeenkomende herkomst; onveilige of lokale URL-bronnen retourneren niet-ondersteunde downloads in plaats van server-side ophalen.
    - `environments.list` en `environments.status` stellen alleen-lezen Gateway-lokale en node-omgevingsdetectie beschikbaar voor SDK-clients.
    - `agent.identity.get` retourneert de effectieve assistentidentiteit voor een agent of sessie.
    - `agent.wait` wacht tot een run is voltooid en retourneert de terminale snapshot wanneer beschikbaar.

  </Accordion>

  <Accordion title="Sessiebeheer">
    - `sessions.list` retourneert de huidige sessie-index, inclusief `agentRuntime`-metagegevens per rij wanneer een agentruntimebackend is geconfigureerd.
    - `sessions.subscribe` en `sessions.unsubscribe` schakelen abonnementen op sessiewijzigingsgebeurtenissen voor de huidige WS-client in of uit.
    - `sessions.messages.subscribe` en `sessions.messages.unsubscribe` schakelen abonnementen op transcriptie-/berichtgebeurtenissen voor één sessie in of uit.
    - `sessions.preview` retourneert begrensde transcriptievoorbeelden voor specifieke sessiesleutels.
    - `sessions.describe` retourneert één Gateway-sessierij voor een exacte sessiesleutel.
    - `sessions.resolve` lost een sessiedoel op of canonicaliseert het.
    - `sessions.create` maakt een nieuwe sessievermelding.
    - `sessions.send` stuurt een bericht naar een bestaande sessie.
    - `sessions.steer` is de variant voor onderbreken en bijsturen voor een actieve sessie.
    - `sessions.abort` breekt actief werk voor een sessie af. Een aanroeper kan `key` plus optionele `runId` doorgeven, of alleen `runId` doorgeven voor actieve runs die de Gateway naar een sessie kan herleiden.
    - `sessions.patch` werkt sessiemetagegevens/-overrides bij en rapporteert het opgeloste canonieke model plus effectieve `agentRuntime`.
    - `sessions.reset`, `sessions.delete` en `sessions.compact` voeren sessieonderhoud uit.
    - `sessions.get` retourneert de volledige opgeslagen sessierij.
    - Chatuitvoering gebruikt nog steeds `chat.history`, `chat.send`, `chat.abort` en `chat.inject`. `chat.history` is display-genormaliseerd voor UI-clients: inline directive-tags worden uit zichtbare tekst gestript, XML-payloads van tool-calls in platte tekst (inclusief `<tool_call>...</tool_call>`, `<function_call>...</function_call>`, `<tool_calls>...</tool_calls>`, `<function_calls>...</function_calls>` en afgekorte tool-call-blokken) en gelekte ASCII-/full-width-modelcontroletokens worden gestript, pure silent-token-assistentrijen zoals exacte `NO_REPLY` / `no_reply` worden weggelaten, en te grote rijen kunnen worden vervangen door placeholders.
    - `chat.message.get` is de additieve begrensde lezer voor volledige berichten voor één zichtbare transcriptievermelding. Clients geven `sessionKey`, optioneel `agentId` wanneer de sessieselectie agent-scoped is, plus een transcriptie-`messageId` door die eerder via `chat.history` beschikbaar is gemaakt, en de Gateway retourneert dezelfde display-genormaliseerde projectie zonder de lichte afkappingslimiet van history wanneer de opgeslagen vermelding nog beschikbaar is en niet te groot is.
    - `chat.send` accepteert een one-turn `fastMode: "auto"` om snelle modus te gebruiken voor modelaanroepen die vóór de automatische cutoff worden gestart, en vervolgens latere retry-, fallback-, tool-result- of continuation-aanroepen zonder snelle modus te starten. De cutoff is standaard 60 seconden en kan per model worden geconfigureerd met `agents.defaults.models["<provider>/<model>"].params.fastAutoOnSeconds`. Een `chat.send`-aanroeper kan one-turn `fastAutoOnSeconds` doorgeven om de cutoff voor die aanvraag te overschrijven.

  </Accordion>

  <Accordion title="Apparaatkoppeling en apparaattokens">
    - `device.pair.list` retourneert wachtende en goedgekeurde gekoppelde apparaten.
    - `device.pair.approve`, `device.pair.reject` en `device.pair.remove` beheren apparaatkoppelingsrecords.
    - `device.token.rotate` roteert een gekoppeld apparaattoken binnen de grenzen van de goedgekeurde rol en aanroeperscope.
    - `device.token.revoke` trekt een gekoppeld apparaattoken in binnen de grenzen van de goedgekeurde rol en aanroeperscope.

  </Accordion>

  <Accordion title="Node-koppeling, invoke en wachtend werk">
    - `node.pair.request`, `node.pair.list`, `node.pair.approve`, `node.pair.reject`, `node.pair.remove` en `node.pair.verify` dekken node-koppeling en bootstrap-verificatie.
    - `node.list` en `node.describe` retourneren bekende/verbonden node-status.
    - `node.rename` werkt een gekoppeld nodelabel bij.
    - `node.invoke` stuurt een opdracht door naar een verbonden node.
    - `node.invoke.result` retourneert het resultaat voor een invoke-aanvraag.
    - `node.event` draagt node-afkomstige gebeurtenissen terug naar de gateway.
    - `node.pending.pull` en `node.pending.ack` zijn de API's voor de verbonden-nodewachtrij.
    - `node.pending.enqueue` en `node.pending.drain` beheren duurzaam wachtend werk voor offline/losgekoppelde nodes.

  </Accordion>

  <Accordion title="Goedkeuringsfamilies">
    - `exec.approval.request`, `exec.approval.get`, `exec.approval.list` en `exec.approval.resolve` dekken eenmalige exec-goedkeuringsaanvragen plus lookup/replay van wachtende goedkeuringen.
    - `exec.approval.waitDecision` wacht op één wachtende exec-goedkeuring en retourneert de definitieve beslissing (of `null` bij timeout).
    - `exec.approvals.get` en `exec.approvals.set` beheren snapshots van Gateway-exec-goedkeuringsbeleid.
    - `exec.approvals.node.get` en `exec.approvals.node.set` beheren node-lokaal exec-goedkeuringsbeleid via node-relayopdrachten.
    - `plugin.approval.request`, `plugin.approval.list`, `plugin.approval.waitDecision` en `plugin.approval.resolve` dekken door plugins gedefinieerde goedkeuringsflows.

  </Accordion>

  <Accordion title="Automatisering, Skills en tools">
    - Automatisering: `wake` plant een directe of volgende-heartbeat wake-tekstinjectie; `cron.get`, `cron.list`, `cron.status`, `cron.add`, `cron.update`, `cron.remove`, `cron.run`, `cron.runs` beheren gepland werk.
    - `cron.run` blijft een enqueue-achtige RPC voor handmatige runs. Clients die voltooiingssemantiek nodig hebben, moeten de geretourneerde `runId` lezen en `cron.runs` pollen.
    - `cron.runs` accepteert een optioneel niet-leeg `runId`-filter zodat clients één in de wachtrij geplaatste handmatige run kunnen volgen zonder race met andere history-vermeldingen voor dezelfde job.
    - Skills en tools: `commands.list`, `skills.*`, `tools.catalog`, `tools.effective`, `tools.invoke`.

  </Accordion>
</AccordionGroup>

### Algemene gebeurtenisfamilies

- `chat`: UI-chatupdates zoals `chat.inject` en andere transcriptie-only chat
  gebeurtenissen. In protocol v4 dragen delta-payloads `deltaText`; `message` blijft
  de cumulatieve assistentsnapshot. Niet-prefixvervangingen zetten `replace=true`
  en gebruiken `deltaText` als de vervangende tekst.
- `session.message`, `session.operation` en `session.tool`: transcriptie-,
  lopende sessiebewerking- en event-streamupdates voor een geabonneerde
  sessie.
- `sessions.changed`: sessie-index of metagegevens gewijzigd.
- `presence`: updates van systeempresentiesnapshots.
- `tick`: periodieke keepalive-/livenessgebeurtenis.
- `health`: update van gateway-gezondheidssnapshot.
- `heartbeat`: update van heartbeat-gebeurtenisstroom.
- `cron`: wijzigingsgebeurtenis voor cron-run/job.
- `shutdown`: melding van gateway-afsluiting.
- `node.pair.requested` / `node.pair.resolved`: levenscyclus van node-koppeling.
- `node.invoke.request`: broadcast van node-invoke-aanvraag.
- `device.pair.requested` / `device.pair.resolved`: levenscyclus van gekoppeld apparaat.
- `voicewake.changed`: triggerconfiguratie voor wake-word gewijzigd.
- `exec.approval.requested` / `exec.approval.resolved`: levenscyclus van exec-goedkeuring.
- `plugin.approval.requested` / `plugin.approval.resolved`: levenscyclus van plugin-goedkeuring.

### Node-helpermethoden

- Nodes kunnen `skills.bins` aanroepen om de huidige lijst met uitvoerbare Skills
  voor auto-allow-controles op te halen.

### RPC's voor taakregister

Operatorclients kunnen Gateway-achtergrondtaakrecords inspecteren en annuleren via
de RPC's voor het taakregister. Deze methoden retourneren opgeschoonde taaksamenvattingen, geen ruwe
runtimestatus.

- `tasks.list` vereist `operator.read`.
  - Params: optionele `status` (`"queued"`, `"running"`, `"completed"`,
    `"failed"`, `"cancelled"` of `"timed_out"`) of een array van die statussen,
    optionele `agentId`, optionele `sessionKey`, optionele `limit` van `1` tot
    `500`, en optionele string `cursor`.
  - Resultaat: `{ "tasks": TaskSummary[], "nextCursor"?: string }`.
- `tasks.get` vereist `operator.read`.
  - Params: `{ "taskId": string }`.
  - Resultaat: `{ "task": TaskSummary }`.
  - Ontbrekende taak-id's retourneren de Gateway not-found-foutvorm.
- `tasks.cancel` vereist `operator.write`.
  - Params: `{ "taskId": string, "reason"?: string }`.
  - Resultaat:
    `{ "found": boolean, "cancelled": boolean, "reason"?: string, "task"?: TaskSummary }`.
  - `found` rapporteert of het register een overeenkomende taak had. `cancelled`
    rapporteert of de runtime annulering heeft geaccepteerd of vastgelegd.

`TaskSummary` bevat `id`, `status` en optionele metagegevens zoals `kind`,
`runtime`, `title`, `agentId`, `sessionKey`, `childSessionKey`, `ownerKey`,
`runId`, `taskId`, `flowId`, `parentTaskId`, `sourceId`, tijdstempels, voortgang,
terminale samenvatting en opgeschoonde fouttekst. `agentId` identificeert de agent
die de taak uitvoert; `sessionKey` en `ownerKey` behouden de aanvrager- en controlecontext.

### Operator-helpermethoden

- Operators kunnen `commands.list` (`operator.read`) aanroepen om de runtime
  opdrachtinventaris voor een agent op te halen.
  - `agentId` is optioneel; laat dit weg om de standaard agentwerkruimte te lezen.
  - `scope` bepaalt op welk oppervlak de primaire `name` is gericht:
    - `text` retourneert het primaire tekstopdrachttoken zonder de voorafgaande `/`
    - `native` en het standaardpad `both` retourneren providerbewuste native namen
      wanneer beschikbaar
  - `textAliases` bevat exacte slash-aliassen zoals `/model` en `/m`.
  - `nativeName` bevat de providerbewuste native opdrachtnaam wanneer die bestaat.
  - `provider` is optioneel en heeft alleen invloed op native naamgeving plus beschikbaarheid van native Plugin-
    opdrachten.
  - `includeArgs=false` laat geserialiseerde argumentmetadata weg uit de respons.
- Operators kunnen `tools.catalog` (`operator.read`) aanroepen om de runtime-toolcatalogus voor een
  agent op te halen. De respons bevat gegroepeerde tools en herkomstmetadata:
  - `source`: `core` of `plugin`
  - `pluginId`: Plugin-eigenaar wanneer `source="plugin"`
  - `optional`: of een Plugin-tool optioneel is
- Operators kunnen `tools.effective` (`operator.read`) aanroepen om de runtime-effectieve tool-
  inventaris voor een sessie op te halen.
  - `sessionKey` is vereist.
  - De Gateway leidt vertrouwde runtimecontext af van de sessie aan serverzijde in plaats van door de
    aanroeper geleverde auth- of aflevercontext te accepteren.
  - De respons is een sessiegebonden, door de server afgeleide projectie van de actieve inventaris,
    inclusief core-, Plugin-, kanaal- en al ontdekte MCP-servertools.
  - `tools.effective` is alleen-lezen voor MCP: het kan een warme sessie-MCP-catalogus projecteren via het
    uiteindelijke toolbeleid, maar het maakt geen MCP-runtimes aan, verbindt geen transports en voert geen
    `tools/list` uit. Als er geen overeenkomende warme catalogus bestaat, kan de respons een melding bevatten zoals
    `mcp-not-yet-connected`, `mcp-not-yet-listed` of `mcp-stale-catalog`.
  - Effectieve toolvermeldingen gebruiken `source="core"`, `source="plugin"`, `source="channel"` of
    `source="mcp"`.
- Operators kunnen `tools.invoke` (`operator.write`) aanroepen om één beschikbare tool uit te voeren via hetzelfde
  Gateway-beleidspad als `/tools/invoke`.
  - `name` is vereist. `args`, `sessionKey`, `agentId`, `confirm` en
    `idempotencyKey` zijn optioneel.
  - Als zowel `sessionKey` als `agentId` aanwezig zijn, moet de opgeloste sessieagent overeenkomen met
    `agentId`.
  - Core-wrappers die alleen voor eigenaars zijn, zoals `cron`, `gateway` en `nodes`, vereisen
    eigenaar-/adminidentiteit (`operator.admin`), ook al is de methode `tools.invoke`
    zelf `operator.write`.
  - De respons is een SDK-gerichte envelop met `ok`, `toolName`, optionele `output` en getypeerde
    `error`-velden. Goedkeurings- of beleidsweigeringen retourneren `ok:false` in de payload in plaats van
    de Gateway-toolbeleidspijplijn te omzeilen.
- Operators kunnen `skills.status` (`operator.read`) aanroepen om de zichtbare
  skillinventaris voor een agent op te halen.
  - `agentId` is optioneel; laat dit weg om de standaard agentwerkruimte te lezen.
  - De respons bevat geschiktheid, ontbrekende vereisten, configuratiecontroles en
    opgeschoonde installatieopties zonder ruwe geheime waarden bloot te leggen.
- Operators kunnen `skills.search` en `skills.detail` (`operator.read`) aanroepen voor
  ClawHub-ontdekkingsmetadata.
- Operators kunnen `skills.upload.begin`, `skills.upload.chunk` en
  `skills.upload.commit` (`operator.admin`) aanroepen om een privé-skillarchief te stagen
  voordat het wordt geïnstalleerd. Dit is een apart adminuploadpad voor vertrouwde clients,
  niet de normale ClawHub-skillinstallatiestroom, en is standaard uitgeschakeld tenzij
  `skills.install.allowUploadedArchives` is ingeschakeld.
  - `skills.upload.begin({ kind: "skill-archive", slug, sizeBytes, sha256?, force?, idempotencyKey? })`
    maakt een upload die aan die slug en force-waarde is gebonden.
  - `skills.upload.chunk({ uploadId, offset, dataBase64 })` voegt bytes toe op
    de exacte gedecodeerde offset.
  - `skills.upload.commit({ uploadId, sha256? })` verifieert de uiteindelijke grootte en
    SHA-256. Commit voltooit alleen de upload; het installeert de skill niet.
  - Geüploade skillarchieven zijn ziparchieven met een `SKILL.md`-root. De
    interne mapnaam van het archief selecteert nooit het installatiedoel.
- Operators kunnen `skills.install` (`operator.admin`) in drie modi aanroepen:
  - ClawHub-modus: `{ source: "clawhub", slug, version?, force? }` installeert een
    skillmap in de standaard `skills/`-map van de agentwerkruimte.
  - Uploadmodus: `{ source: "upload", uploadId, slug, force?, sha256?, timeoutMs? }`
    installeert een gecommitte upload in de map `skills/<slug>` van de standaard agentwerkruimte.
    De slug en force-waarde moeten overeenkomen met het oorspronkelijke
    `skills.upload.begin`-verzoek. Deze modus wordt geweigerd tenzij
    `skills.install.allowUploadedArchives` is ingeschakeld. De instelling heeft geen
    invloed op ClawHub-installaties.
  - Gateway-installatiemodus: `{ name, installId, timeoutMs? }`
    voert een gedeclareerde `metadata.openclaw.install`-actie uit op de Gateway-host.
    Oudere clients kunnen nog steeds `dangerouslyForceUnsafeInstall` verzenden; dit veld is
    verouderd, wordt alleen geaccepteerd voor protocolcompatibiliteit en wordt genegeerd. Gebruik
    `security.installPolicy` voor installatiebeslissingen die door de operator worden beheerd.
- Operators kunnen `skills.update` (`operator.admin`) in twee modi aanroepen:
  - ClawHub-modus werkt één gevolgde slug of alle gevolgde ClawHub-installaties bij in
    de standaard agentwerkruimte.
  - Configuratiemodus patcht `skills.entries.<skillKey>`-waarden zoals `enabled`,
    `apiKey` en `env`.

### `models.list`-weergaven

`models.list` accepteert een optionele parameter `view`:

- Weggelaten of `"default"`: huidig runtimegedrag. Als `agents.defaults.models` is geconfigureerd, is de respons de toegestane catalogus, inclusief dynamisch ontdekte modellen voor `provider/*`-vermeldingen. Anders is de respons de volledige Gateway-catalogus.
- `"configured"`: gedrag met picker-formaat. Als `agents.defaults.models` is geconfigureerd, blijft dit voorrang hebben, inclusief providergebonden ontdekking voor `provider/*`-vermeldingen. Zonder allowlist gebruikt de respons expliciete `models.providers.*.models`-vermeldingen, met terugval naar de volledige catalogus alleen wanneer er geen geconfigureerde modelrijen bestaan.
- `"all"`: volledige Gateway-catalogus, waarbij `agents.defaults.models` wordt omzeild. Gebruik dit voor diagnostiek en ontdekkings-UI's, niet voor normale modelpickers.

## Exec-goedkeuringen

- Wanneer een exec-verzoek goedkeuring nodig heeft, broadcast de Gateway `exec.approval.requested`.
- Operatorclients lossen dit op door `exec.approval.resolve` aan te roepen (vereist `operator.approvals`-scope).
- Voor `host=node` moet `exec.approval.request` `systemRunPlan` bevatten (canonieke `argv`/`cwd`/`rawCommand`/sessiemetadata). Verzoeken zonder `systemRunPlan` worden geweigerd.
- Na goedkeuring hergebruiken doorgestuurde `node.invoke system.run`-aanroepen dat canonieke
  `systemRunPlan` als de gezaghebbende opdracht-/cwd-/sessiecontext.
- Als een aanroeper `command`, `rawCommand`, `cwd`, `agentId` of
  `sessionKey` wijzigt tussen voorbereiden en de uiteindelijke goedgekeurde `system.run`-doorsturing, weigert de
  Gateway de run in plaats van de gewijzigde payload te vertrouwen.

## Terugval voor agentaflevering

- `agent`-verzoeken kunnen `deliver=true` bevatten om uitgaande aflevering aan te vragen.
- `bestEffortDeliver=false` behoudt strikt gedrag: onopgeloste of alleen-interne afleverdoelen retourneren `INVALID_REQUEST`.
- `bestEffortDeliver=true` staat terugval naar sessie-only uitvoering toe wanneer geen externe afleverbare route kan worden opgelost (bijvoorbeeld interne/webchatsessies of ambigue multikanaalconfiguraties).
- Uiteindelijke `agent`-resultaten kunnen `result.deliveryStatus` bevatten wanneer aflevering is
  aangevraagd, met dezelfde statussen `sent`, `suppressed`, `partial_failed` en `failed`
  die zijn gedocumenteerd voor [`openclaw agent --json --deliver`](/nl/cli/agent#json-delivery-status).

## Versiebeheer

- `PROTOCOL_VERSION` staat in `packages/gateway-protocol/src/version.ts`.
- Clients verzenden `minProtocol` + `maxProtocol`; de server weigert bereiken die
  het huidige protocol niet bevatten. Huidige clients en servers vereisen
  protocol v4.
- Schema's + modellen worden gegenereerd uit TypeBox-definities:
  - `pnpm protocol:gen`
  - `pnpm protocol:gen:swift`
  - `pnpm protocol:check`

### Clientconstanten

De referentieclient in `src/gateway/client.ts` gebruikt deze standaardwaarden. Waarden zijn
stabiel binnen protocol v4 en vormen de verwachte basislijn voor clients van derden.

| Constante                                 | Standaard                                             | Bron                                                                                       |
| ----------------------------------------- | ----------------------------------------------------- | ------------------------------------------------------------------------------------------ |
| `PROTOCOL_VERSION`                        | `4`                                                   | `packages/gateway-protocol/src/version.ts`                                                 |
| `MIN_CLIENT_PROTOCOL_VERSION`             | `4`                                                   | `packages/gateway-protocol/src/version.ts`                                                 |
| Verzoektime-out (per RPC)                 | `30_000` ms                                           | `src/gateway/client.ts` (`requestTimeoutMs`)                                               |
| Preauth-/connect-challenge-time-out       | `15_000` ms                                           | `src/gateway/handshake-timeouts.ts` (config/env kan het gekoppelde server-/clientbudget verhogen) |
| Initiële reconnect-backoff                | `1_000` ms                                            | `src/gateway/client.ts` (`backoffMs`)                                                      |
| Maximale reconnect-backoff                | `30_000` ms                                           | `src/gateway/client.ts` (`scheduleReconnect`)                                              |
| Fast-retry-klem na sluiten van device-token | `250` ms                                            | `src/gateway/client.ts`                                                                    |
| Force-stop-grace vóór `terminate()`       | `250` ms                                              | `FORCE_STOP_TERMINATE_GRACE_MS`                                                            |
| Standaardtime-out van `stopAndWait()`     | `1_000` ms                                            | `STOP_AND_WAIT_TIMEOUT_MS`                                                                 |
| Standaard tickinterval (vóór `hello-ok`)  | `30_000` ms                                           | `src/gateway/client.ts`                                                                    |
| Sluiten bij tick-time-out                 | code `4000` wanneer stilte langer is dan `tickIntervalMs * 2` | `src/gateway/client.ts`                                                                    |
| `MAX_PAYLOAD_BYTES`                       | `25 * 1024 * 1024` (25 MB)                            | `src/gateway/server-constants.ts`                                                          |

De server adverteert de effectieve `policy.tickIntervalMs`, `policy.maxPayload`
en `policy.maxBufferedBytes` in `hello-ok`; clients moeten die waarden respecteren
in plaats van de standaardwaarden van vóór de handshake.

## Auth

- Shared-secret Gateway-authenticatie gebruikt `connect.params.auth.token` of
  `connect.params.auth.password`, afhankelijk van de geconfigureerde authenticatiemodus.
- Modi die identiteit bevatten, zoals Tailscale Serve
  (`gateway.auth.allowTailscale: true`) of niet-loopback
  `gateway.auth.mode: "trusted-proxy"`, voldoen aan de connect-authenticatiecontrole via
  requestheaders in plaats van `connect.params.auth.*`.
- Private-ingress `gateway.auth.mode: "none"` slaat shared-secret connect-authenticatie
  volledig over; stel die modus niet bloot op publieke/niet-vertrouwde ingress.
- Na koppeling geeft de Gateway een **device token** uit dat is beperkt tot de verbindingsrol
  + scopes. Het wordt teruggegeven in `hello-ok.auth.deviceToken` en moet door de
  client worden bewaard voor toekomstige verbindingen.
- Clients moeten de primaire `hello-ok.auth.deviceToken` bewaren na elke
  succesvolle verbinding.
- Opnieuw verbinden met dat **opgeslagen** device token moet ook de opgeslagen
  goedgekeurde scopeset voor dat token hergebruiken. Dit behoudt lees-/probe-/status-toegang
  die al was toegekend en voorkomt dat reconnects stilzwijgend worden teruggebracht tot een
  smallere impliciete admin-only scope.
- Client-side samenstelling van connect-authenticatie (`selectConnectAuth` in
  `src/gateway/client.ts`):
  - `auth.password` is orthogonaal en wordt altijd doorgestuurd wanneer ingesteld.
  - `auth.token` wordt in prioriteitsvolgorde ingevuld: eerst een expliciet gedeeld token,
    daarna een expliciete `deviceToken`, daarna een opgeslagen per-device token (gekeyed op
    `deviceId` + `role`).
  - `auth.bootstrapToken` wordt alleen verzonden wanneer geen van bovenstaande een
    `auth.token` heeft opgeleverd. Een gedeeld token of een opgelost device token onderdrukt dit.
  - Automatische promotie van een opgeslagen device token bij de eenmalige
    `AUTH_TOKEN_MISMATCH`-retry is beperkt tot **alleen vertrouwde endpoints**:
    loopback, of `wss://` met een gepinde `tlsFingerprint`. Publieke `wss://`
    zonder pinning kwalificeert niet.
- Ingebouwde setup-code bootstrap retourneert de primaire node
  `hello-ok.auth.deviceToken` plus een begrensd operator-token in
  `hello-ok.auth.deviceTokens` voor vertrouwde mobiele overdracht. Het operator-token
  bevat `operator.talk.secrets` voor native Talk-configuratielezingen, maar
  sluit pairing-mutatiescopes en `operator.admin` uit.
- Terwijl een niet-baseline setup-code bootstrap op goedkeuring wacht, bevatten `PAIRING_REQUIRED`
  details `recommendedNextStep: "wait_then_retry"`, `retryable: true`,
  en `pauseReconnect: false`. Clients moeten blijven reconnecten met hetzelfde
  bootstrap-token totdat de aanvraag is goedgekeurd of het token ongeldig wordt.
- Bewaar `hello-ok.auth.deviceTokens` alleen wanneer de verbinding bootstrap-authenticatie gebruikte
  op een vertrouwd transport zoals `wss://` of loopback/lokale koppeling.
- Als een client een **expliciete** `deviceToken` of expliciete `scopes` aanlevert, blijft die
  door de caller aangevraagde scopeset leidend; gecachte scopes worden alleen
  hergebruikt wanneer de client het opgeslagen per-device token hergebruikt.
- Device tokens kunnen worden geroteerd/ingetrokken via `device.token.rotate` en
  `device.token.revoke` (vereist `operator.pairing`-scope). Het roteren of
  intrekken van een node of andere niet-operatorrol vereist ook `operator.admin`.
- `device.token.rotate` retourneert rotatiemetadata. Het echoot het vervangende
  bearer-token alleen voor same-device calls die al met dat device token zijn geauthenticeerd,
  zodat token-only clients hun vervanging kunnen bewaren voordat ze opnieuw verbinden.
  Shared/admin-rotaties echoën het bearer-token niet.
- Tokenuitgifte, rotatie en intrekking blijven beperkt tot de goedgekeurde rollenset
  die is vastgelegd in de pairing-entry van dat device; tokenmutatie kan geen device-rol
  uitbreiden of targeten die nooit door pairing-goedkeuring is verleend.
- Voor paired-device tokensessies is devicebeheer self-scoped tenzij de
  caller ook `operator.admin` heeft: niet-admin callers kunnen alleen het
  operator-token voor hun **eigen** device-entry beheren. Beheer van node- en andere
  niet-operator-tokens is admin-only, zelfs voor het eigen device van de caller.
- `device.token.rotate` en `device.token.revoke` controleren ook de beoogde operator-
  token-scopeset tegen de huidige sessiescopes van de caller. Niet-admin callers
  kunnen geen breder operator-token roteren of intrekken dan ze zelf al hebben.
- Authenticatiefouten bevatten `error.details.code` plus herstelhints:
  - `error.details.canRetryWithDeviceToken` (boolean)
  - `error.details.recommendedNextStep` (`retry_with_device_token`, `update_auth_configuration`, `update_auth_credentials`, `wait_then_retry`, `review_auth_configuration`)
- Clientgedrag voor `AUTH_TOKEN_MISMATCH`:
  - Vertrouwde clients mogen een begrensde retry proberen met een gecacht per-device token.
  - Als die retry mislukt, moeten clients automatische reconnect-loops stoppen en guidance voor operatoractie tonen.
- `AUTH_SCOPE_MISMATCH` betekent dat het device token werd herkend maar de
  aangevraagde rol/scopes niet dekt. Clients moeten dit niet presenteren als een slecht token;
  vraag de operator om opnieuw te koppelen of het smallere/bredere scopecontract goed te keuren.

## Device-identiteit + pairing

- Nodes moeten een stabiele device-identiteit (`device.id`) opnemen die is afgeleid van een
  keypair-fingerprint.
- Gateways geven tokens uit per device + rol.
- Pairing-goedkeuringen zijn vereist voor nieuwe device-ID's, tenzij lokale auto-goedkeuring
  is ingeschakeld.
- Pairing-auto-goedkeuring is gecentreerd rond directe local loopback-verbindingen.
- OpenClaw heeft ook een smal backend/container-lokaal self-connect-pad voor
  vertrouwde shared-secret helperflows.
- Same-host tailnet- of LAN-verbindingen worden nog steeds als remote behandeld voor pairing en
  vereisen goedkeuring.
- WS-clients nemen normaal gesproken `device`-identiteit op tijdens `connect` (operator +
  node). De enige device-less operator-uitzonderingen zijn expliciete vertrouwenspaden:
  - `gateway.controlUi.allowInsecureAuth=true` voor localhost-only onveilige HTTP-compatibiliteit.
  - succesvolle `gateway.auth.mode: "trusted-proxy"` operator Control UI-authenticatie.
  - `gateway.controlUi.dangerouslyDisableDeviceAuth=true` (break-glass, ernstige security-downgrade).
  - direct-loopback `gateway-client` backend-RPC's op het gereserveerde interne
    helperpad.
- Het weglaten van device-identiteit heeft scopegevolgen. Wanneer een device-less operator-
  verbinding wordt toegestaan via een expliciet vertrouwenspad, wist OpenClaw nog steeds
  zelfverklaarde scopes naar een lege set, tenzij dat pad een benoemde
  scopebehoud-uitzondering heeft. Scope-gated methoden falen dan met
  `missing scope`.
- `gateway.controlUi.dangerouslyDisableDeviceAuth=true` is een Control UI
  break-glass scopebehoud-pad. Het kent geen scopes toe aan willekeurige
  aangepaste backend- of CLI-vormige WebSocket-clients.
- Het gereserveerde direct-loopback `gateway-client` backend-helperpad behoudt
  scopes alleen voor interne lokale control-plane RPC's; aangepaste backend-ID's krijgen
  deze uitzondering niet.
- Alle verbindingen moeten de door de server geleverde `connect.challenge` nonce ondertekenen.

### Diagnostiek voor device-authenticatiemigratie

Voor legacy clients die nog pre-challenge ondertekeningsgedrag gebruiken, retourneert `connect` nu
`DEVICE_AUTH_*`-detailcodes onder `error.details.code` met een stabiele `error.details.reason`.

Veelvoorkomende migratiefouten:

| Bericht                     | details.code                     | details.reason           | Betekenis                                          |
| --------------------------- | -------------------------------- | ------------------------ | -------------------------------------------------- |
| `device nonce required`     | `DEVICE_AUTH_NONCE_REQUIRED`     | `device-nonce-missing`   | Client liet `device.nonce` weg (of stuurde leeg).  |
| `device nonce mismatch`     | `DEVICE_AUTH_NONCE_MISMATCH`     | `device-nonce-mismatch`  | Client ondertekende met een verouderde/verkeerde nonce. |
| `device signature invalid`  | `DEVICE_AUTH_SIGNATURE_INVALID`  | `device-signature`       | Signature-payload komt niet overeen met v2-payload. |
| `device signature expired`  | `DEVICE_AUTH_SIGNATURE_EXPIRED`  | `device-signature-stale` | Ondertekende timestamp valt buiten de toegestane skew. |
| `device identity mismatch`  | `DEVICE_AUTH_DEVICE_ID_MISMATCH` | `device-id-mismatch`     | `device.id` komt niet overeen met de public key-fingerprint. |
| `device public key invalid` | `DEVICE_AUTH_PUBLIC_KEY_INVALID` | `device-public-key`      | Public key-indeling/canonicalisatie is mislukt.    |

Migratiedoel:

- Wacht altijd op `connect.challenge`.
- Onderteken de v2-payload die de servernonce bevat.
- Stuur dezelfde nonce in `connect.params.device.nonce`.
- De voorkeurs-signature-payload is `v3`, die `platform` en `deviceFamily`
  bindt naast device/client/role/scopes/token/nonce-velden.
- Legacy `v2`-signatures blijven geaccepteerd voor compatibiliteit, maar paired-device
  metadata-pinning blijft commandbeleid bij reconnect bepalen.

## TLS + pinning

- TLS wordt ondersteund voor WS-verbindingen.
- Clients kunnen optioneel de gateway-certificaatfingerprint pinnen (zie `gateway.tls`-
  configuratie plus `gateway.remote.tlsFingerprint` of CLI `--tls-fingerprint`).

## Scope

Dit protocol stelt de **volledige Gateway-API** bloot (status, channels, models, chat,
agent, sessions, nodes, approvals, enz.). Het exacte oppervlak wordt gedefinieerd door de
TypeBox-schema's in `packages/gateway-protocol/src/schema.ts`.

## Gerelateerd

- [Bridge-protocol](/nl/gateway/bridge-protocol)
- [Gateway-runbook](/nl/gateway)
