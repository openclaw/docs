---
read_when:
    - Gateway-WS-clients implementeren of bijwerken
    - Protocolmismatches of verbindingsfouten debuggen
    - Protocolschema en modellen opnieuw genereren
summary: 'Gateway WebSocket-protocol: handshake, frames, versiebeheer'
title: Gateway-protocol
x-i18n:
    generated_at: "2026-06-27T17:36:23Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: df37fcb4f6a52ef3f6044840a4c1fb1a59bf1d2b880b9f3752490c6eb8a2135f
    source_path: gateway/protocol.md
    workflow: 16
---

De Gateway WS-protocol is het **enige besturingsvlak + nodetransport** voor
OpenClaw. Alle clients (CLI, web-UI, macOS-app, iOS/Android-nodes, headless
nodes) verbinden via WebSocket en declareren hun **rol** + **scope** tijdens
de handshake.

## Transport

- WebSocket, tekstframes met JSON-payloads.
- Het eerste frame **moet** een `connect`-aanvraag zijn.
- Pre-connect-frames zijn begrensd op 64 KiB. Na een geslaagde handshake moeten clients
  de limieten `hello-ok.policy.maxPayload` en
  `hello-ok.policy.maxBufferedBytes` volgen. Met diagnostiek ingeschakeld
  geven te grote inkomende frames en trage uitgaande buffers `payload.large`-events
  voordat de gateway het betreffende frame sluit of laat vallen. Deze events bewaren
  groottes, limieten, oppervlakken en veilige redencodes. Ze bewaren niet de berichtinhoud,
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

Terwijl de Gateway nog bezig is opstart-sidecars af te ronden, kan de `connect`-aanvraag
een opnieuw te proberen `UNAVAILABLE`-fout teruggeven met `details.reason` ingesteld op
`"startup-sidecars"` en `retryAfterMs`. Clients moeten die respons opnieuw proberen
binnen hun totale verbindingsbudget in plaats van deze als een terminale
handshakefout te tonen.

`server`, `features`, `snapshot` en `policy` zijn allemaal vereist door het schema
(`packages/gateway-protocol/src/schema/frames.ts`). `auth` is ook vereist en rapporteert
de overeengekomen rol/scopes. `pluginSurfaceUrls` is optioneel en koppelt pluginoppervlaknamen,
zoals `canvas`, aan scoped gehoste URL's.

Scoped pluginoppervlak-URL's kunnen verlopen. Nodes kunnen
`node.pluginSurface.refresh` aanroepen met `{ "surface": "canvas" }` om een nieuwe
vermelding in `pluginSurfaceUrls` te ontvangen. De experimentele Canvas Plugin-refactor ondersteunt
het verouderde compatibiliteitspad `canvasHostUrl`, `canvasCapability` of
`node.canvas.capability.refresh` niet; huidige native clients en
gateways moeten pluginoppervlakken gebruiken.

Wanneer er geen apparaattoken wordt uitgegeven, rapporteert `hello-ok.auth` de overeengekomen
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
`client.mode: "backend"`) mogen `device` weglaten bij directe loopback-verbindingen wanneer
ze authenticeren met het gedeelde gatewaytoken/wachtwoord. Dit pad is gereserveerd
voor interne control-plane-RPC's en voorkomt dat verouderde CLI/apparaatkoppelingsbaselines
lokaal backendwerk blokkeren, zoals updates van subagentsessies. Externe clients,
clients met browser-origin, nodeclients en expliciete apparaat-token/apparaatidentiteit-
clients gebruiken nog steeds de normale koppelings- en scope-upgradecontroles.

Wanneer er een apparaattoken wordt uitgegeven, bevat `hello-ok` ook:

```json
{
  "auth": {
    "deviceToken": "…",
    "role": "operator",
    "scopes": ["operator.read", "operator.write"]
  }
}
```

Ingebouwde QR/setup-code-bootstrap is een nieuw mobiel overdrachtspad. Een succesvolle
baseline setup-code connect retourneert een primair nodetoken plus één begrensd
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

De operatoroverdracht is opzettelijk begrensd zodat QR-onboarding de
mobiele operatorlus kan starten zonder `operator.admin` of `operator.pairing` toe te kennen.
Deze bevat wel `operator.talk.secrets` zodat de native client de Talk-
configuratie kan lezen die hij na bootstrap nodig heeft. Bredere admin- en koppelingsscopes vereisen
een aparte goedgekeurde operatorkoppeling of tokenflow. Clients moeten
`hello-ok.auth.deviceTokens` alleen bewaren
wanneer de connect bootstrap-auth gebruikte op vertrouwd transport zoals `wss://` of
loopback/lokale koppeling.

### Nodevoorbeeld

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

- **Aanvraag**: `{type:"req", id, method, params}`
- **Respons**: `{type:"res", id, ok, payload|error}`
- **Event**: `{type:"event", event, payload, seq?, stateVersion?}`

Methoden met neveneffecten vereisen **idempotentiesleutels** (zie schema).

## Rollen + scopes

Voor het volledige operatorscopemodel, controles tijdens goedkeuring en semantiek voor
gedeelde geheimen, zie [Operatorscopes](/nl/gateway/operator-scopes).

### Rollen

- `operator` = client voor besturingsvlak (CLI/UI/automatisering).
- `node` = capabilityhost (camera/screen/canvas/system.run).

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

Gateway-RPC-methoden die door Plugins zijn geregistreerd kunnen hun eigen operatorscope aanvragen, maar
gereserveerde core-adminprefixen (`config.*`, `exec.approvals.*`, `wizard.*`,
`update.*`) worden altijd omgezet naar `operator.admin`.

Methodescope is slechts de eerste poort. Sommige slashcommando's die via
`chat.send` worden bereikt, passen daarbovenop strengere controles op commandoniveau toe. Bijvoorbeeld: persistente
`/config set`- en `/config unset`-schrijfbewerkingen vereisen `operator.admin`.

`node.pair.approve` heeft ook een extra scopecontrole tijdens goedkeuring bovenop de
basismethodescope:

- aanvragen zonder commando: `operator.pairing`
- aanvragen met non-exec nodecommando's: `operator.pairing` + `operator.write`
- aanvragen die `system.run`, `system.run.prepare` of `system.which` bevatten:
  `operator.pairing` + `operator.admin`

### Caps/commands/permissions (node)

Nodes declareren capabilityclaims tijdens connect:

- `caps`: capabilitycategorieën op hoog niveau zoals `camera`, `canvas`, `screen`,
  `location`, `voice` en `talk`.
- `commands`: commandotoestaanlijst voor invoke.
- `permissions`: granulaire schakelaars (bijv. `screen.record`, `camera.capture`).

De Gateway behandelt deze als **claims** en dwingt server-side toestaanlijsten af.

## Aanwezigheid

- `system-presence` retourneert vermeldingen met apparaatidentiteit als sleutel.
- Aanwezigheidsvermeldingen bevatten `deviceId`, `roles` en `scopes` zodat UI's één rij per apparaat kunnen tonen,
  zelfs wanneer het als zowel **operator** als **node** verbindt.
- `node.list` bevat optionele velden `lastSeenAtMs` en `lastSeenReason`. Verbonden nodes rapporteren
  hun huidige verbindingstijd als `lastSeenAtMs` met reden `connect`; gekoppelde nodes kunnen ook
  duurzame achtergrondaanwezigheid rapporteren wanneer een vertrouwd node-event hun koppelingsmetadata bijwerkt.

### Nodeachtergrond-alive-event

Nodes mogen `node.event` aanroepen met `event: "node.presence.alive"` om vast te leggen dat een gekoppelde node
alive was tijdens een background wake zonder deze als verbonden te markeren.

```json
{
  "event": "node.presence.alive",
  "payloadJSON": "{\"trigger\":\"silent_push\",\"sentAtMs\":1737264000000,\"displayName\":\"Peter's iPhone\",\"version\":\"2026.4.28\",\"platform\":\"iOS 18.4.0\",\"deviceFamily\":\"iPhone\",\"modelIdentifier\":\"iPhone17,1\",\"pushTransport\":\"relay\"}"
}
```

`trigger` is een gesloten enum: `background`, `silent_push`, `bg_app_refresh`,
`significant_location`, `manual` of `connect`. Onbekende triggerstrings worden door de gateway
genormaliseerd naar `background` vóór persistentie. Het event is alleen duurzaam voor geauthenticeerde
nodeapparaatsessies; sessies zonder apparaat of zonder koppeling retourneren `handled: false`.

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
bevestigde RPC, niet als duurzame aanwezigheidspersistentie.

## Scoping van broadcast-events

Door de server gepushte WebSocket-broadcast-events zijn scope-gated zodat sessions met koppelingsscope of alleen nodes niet passief sessie-inhoud ontvangen.

- **Chat-, agent- en tool-resultaatframes** (inclusief gestreamde `agent`-events en tool call-resultaten) vereisen minimaal `operator.read`. Sessions zonder `operator.read` slaan deze frames volledig over.
- **Door Plugins gedefinieerde `plugin.*`-broadcasts** worden gated naar `operator.write` of `operator.admin`, afhankelijk van hoe de Plugin ze heeft geregistreerd.
- **Status- en transportevents** (`heartbeat`, `presence`, `tick`, connect/disconnect-levenscyclus, enz.) blijven onbeperkt zodat transportgezondheid zichtbaar blijft voor elke geauthenticeerde sessie.
- **Onbekende broadcast-eventfamilies** zijn standaard scope-gated (fail-closed), tenzij een geregistreerde handler ze expliciet versoepelt.

Elke clientverbinding behoudt zijn eigen sequentienummer per client, zodat broadcasts monotone ordening op die socket behouden, zelfs wanneer verschillende clients verschillende scope-gefilterde subsets van de eventstream zien.

## Veelvoorkomende RPC-methodefamilies

Het openbare WS-oppervlak is breder dan de handshake/auth-voorbeelden hierboven. Dit
is geen gegenereerde dump — `hello-ok.features.methods` is een conservatieve
discoverylijst opgebouwd uit `src/gateway/server-methods-list.ts` plus geladen
Plugin/channel-methode-exports. Behandel deze als featurediscovery, niet als een volledige
opsomming van `src/gateway/server-methods/*.ts`.

  <AccordionGroup>
  <Accordion title="Systeem en identiteit">
    - `health` retourneert de gecachte of vers gepeilde Gateway-gezondheidssnapshot.
    - `diagnostics.stability` retourneert de recente begrensde recorder voor diagnostische stabiliteit. Deze bewaart operationele metadata zoals gebeurtenisnamen, aantallen, bytegroottes, geheugenmetingen, wachtrij-/sessiestatus, kanaal-/Plugin-namen en sessie-id's. Deze bewaart geen chattekst, Webhook-bodies, tooluitvoer, ruwe aanvraag- of respons-bodies, tokens, cookies of geheime waarden. Operatorleesscope is vereist.
    - `status` retourneert de Gateway-samenvatting in `/status`-stijl; gevoelige velden worden alleen opgenomen voor operatorclients met admin-scope.
    - `gateway.identity.get` retourneert de Gateway-apparaatidentiteit die wordt gebruikt door relay- en koppelingsflows.
    - `system-presence` retourneert de huidige aanwezigheidssnapshot voor verbonden operator-/Node-apparaten.
    - `system-event` voegt een systeemgebeurtenis toe en kan aanwezigheidscontext bijwerken/uitzenden.
    - `last-heartbeat` retourneert de laatst bewaarde Heartbeat-gebeurtenis.
    - `set-heartbeats` schakelt Heartbeat-verwerking op de Gateway in of uit.

  </Accordion>

  <Accordion title="Modellen en gebruik">
    - `models.list` retourneert de modelcatalogus die door de runtime is toegestaan. Geef `{ "view": "configured" }` door voor geconfigureerde modellen op pickerformaat (eerst `agents.defaults.models`, daarna `models.providers.*.models`), of `{ "view": "all" }` voor de volledige catalogus.
    - `usage.status` retourneert gebruiksvensters/resterende quotasamenvattingen per provider.
    - `usage.cost` retourneert geaggregeerde kosten-gebruikssamenvattingen voor een datumbereik.
      Geef `agentId` door voor één agent, of `agentScope: "all"` om geconfigureerde agents te aggregeren.
    - `doctor.memory.status` retourneert de gereedheid van vectorgeheugen / gecachte embeddings voor de actieve standaardagentwerkruimte. Geef `{ "probe": true }` of `{ "deep": true }` alleen door wanneer de aanroeper expliciet een live ping naar de embedding-provider wil. Dreaming-bewuste clients kunnen ook `{ "agentId": "agent-id" }` doorgeven om statistieken van de Dreaming-store te beperken tot een geselecteerde agentwerkruimte; als `agentId` wordt weggelaten, blijft de fallback naar de standaardagent behouden en worden geconfigureerde Dreaming-werkruimten geaggregeerd.
    - `doctor.memory.dreamDiary`, `doctor.memory.backfillDreamDiary`, `doctor.memory.resetDreamDiary`, `doctor.memory.resetGroundedShortTerm`, `doctor.memory.repairDreamingArtifacts` en `doctor.memory.dedupeDreamDiary` accepteren optionele parameters `{ "agentId": "agent-id" }` voor Dreaming-weergaven/-acties van de geselecteerde agent. Wanneer `agentId` wordt weggelaten, werken ze op de geconfigureerde standaardagentwerkruimte.
    - `doctor.memory.remHarness` retourneert een begrensde, alleen-lezen preview van de REM-harness voor externe control-plane-clients. Deze kan werkruimtepaden, geheugenfragmenten, gerenderde gegronde Markdown en kandidaten voor diepe promotie bevatten, dus aanroepers hebben `operator.read` nodig.
    - `sessions.usage` retourneert gebruikssamenvattingen per sessie. Geef `agentId` door voor één
      agent, of `agentScope: "all"` om geconfigureerde agents samen te vermelden.
    - `sessions.usage.timeseries` retourneert tijdreeksgebruik voor één sessie.
    - `sessions.usage.logs` retourneert gebruikslogitems voor één sessie.

  </Accordion>

  <Accordion title="Kanalen en aanmeldhulpen">
    - `channels.status` retourneert statussamenvattingen van ingebouwde + gebundelde kanalen/Plugins.
    - `channels.logout` meldt een specifiek kanaal/account af wanneer het kanaal afmelden ondersteunt.
    - `web.login.start` start een QR-/webaanmeldflow voor de huidige webkanaalprovider met QR-ondersteuning.
    - `web.login.wait` wacht tot die QR-/webaanmeldflow is voltooid en start het kanaal bij succes.
    - `push.test` verzendt een test-APNs-push naar een geregistreerde iOS-Node.
    - `voicewake.get` retourneert de opgeslagen wake-word-triggers.
    - `voicewake.set` werkt wake-word-triggers bij en zendt de wijziging uit.

  </Accordion>

  <Accordion title="Berichten en logs">
    - `send` is de directe RPC voor uitgaande levering voor kanaal-/account-/threadgerichte verzendingen buiten de chat-runner.
    - `logs.tail` retourneert de geconfigureerde staart van het Gateway-bestandslogboek met cursor-/limiet- en max-byte-instellingen.

  </Accordion>

  <Accordion title="Talk en TTS">
    - `talk.catalog` retourneert de alleen-lezen Talk-providercatalogus voor spraak, streaming transcriptie en realtime spraak. Deze bevat provider-id's, labels, geconfigureerde status, blootgestelde model-/spraak-id's, canonieke modi, transports, brain-strategieën en realtime audio-/capability-vlaggen zonder providergeheimen te retourneren of globale configuratie te wijzigen.
    - `talk.config` retourneert de effectieve Talk-configuratiepayload; `includeSecrets` vereist `operator.talk.secrets` (of `operator.admin`).
    - `talk.session.create` maakt een door Gateway beheerde Talk-sessie voor `realtime/gateway-relay`, `transcription/gateway-relay` of `stt-tts/managed-room`. Voor `stt-tts/managed-room` moeten `operator.write`-aanroepers die `sessionKey` doorgeven ook `spawnedBy` doorgeven voor scoped zichtbaarheid van sessiesleutels; het maken van een niet-gescopete `sessionKey` en `brain: "direct-tools"` vereisen `operator.admin`.
    - `talk.session.join` valideert een managed-room-sessietoken, emitteert zo nodig `session.ready`- of `session.replaced`-gebeurtenissen en retourneert kamer-/sessiemetadata plus recente Talk-gebeurtenissen zonder het platte-teksttoken of de opgeslagen tokenhash.
    - `talk.session.appendAudio` voegt base64-PCM-invoeraudio toe aan door Gateway beheerde realtime relay- en transcriptiesessies.
    - `talk.session.startTurn`, `talk.session.endTurn` en `talk.session.cancelTurn` sturen de turn-levenscyclus van managed-room aan met afwijzing van verouderde turns voordat de status wordt gewist.
    - `talk.session.cancelOutput` stopt de audio-uitvoer van de assistant, voornamelijk voor door VAD bewaakte barge-in in Gateway-relay-sessies.
    - `talk.session.submitToolResult` voltooit een providertoolaanroep die is geëmitteerd door een door Gateway beheerde realtime relay-sessie. Geef `options: { willContinue: true }` door voor tussentijdse tooluitvoer wanneer er nog een eindresultaat volgt, of `options: { suppressResponse: true }` wanneer het toolresultaat de provideraanroep moet afhandelen zonder een nieuwe realtime assistant-respons te starten.
    - `talk.session.steer` stuurt spraakbesturing voor een actieve run naar een door Gateway beheerde, agent-ondersteunde Talk-sessie. Het accepteert `{ sessionId, text, mode? }`, waarbij `mode` `status`, `steer`, `cancel` of `followup` is; een weggelaten modus wordt geclassificeerd op basis van de gesproken tekst.
    - `talk.session.close` sluit een door Gateway beheerde relay-, transcriptie- of managed-room-sessie en emitteert terminale Talk-gebeurtenissen.
    - `talk.mode` stelt de huidige Talk-modusstatus in voor WebChat-/Control UI-clients en broadcast deze.
    - `talk.client.create` maakt een client-beheerde realtime providersessie met `webrtc` of `provider-websocket`, terwijl de Gateway eigenaar is van configuratie, referenties, instructies en toolbeleid.
    - `talk.client.toolCall` laat client-beheerde realtime transports providertoolaanroepen doorsturen naar Gateway-beleid. De eerste ondersteunde tool is `openclaw_agent_consult`; clients ontvangen een run-id en wachten op normale chat-levenscyclusgebeurtenissen voordat ze het providerspecifieke toolresultaat indienen.
    - `talk.client.steer` verzendt spraakbesturing voor een actieve run voor client-beheerde realtime transports. De Gateway resolveert de actieve ingebedde run uit `sessionKey` en retourneert een gestructureerd geaccepteerd/geweigerd resultaat in plaats van sturing stilzwijgend te negeren.
    - `talk.event` is het enkele Talk-gebeurteniskanaal voor realtime, transcriptie, STT/TTS, managed-room, telefonie en meetingadapters.
    - `talk.speak` synthetiseert spraak via de actieve Talk-spraakprovider.
    - `tts.status` retourneert de ingeschakelde TTS-status, actieve provider, fallbackproviders en providerconfiguratiestatus.
    - `tts.providers` retourneert de zichtbare TTS-providerinventaris.
    - `tts.enable` en `tts.disable` schakelen de TTS-voorkeursstatus om.
    - `tts.setProvider` werkt de voorkeurs-TTS-provider bij.
    - `tts.convert` voert een eenmalige tekst-naar-spraakconversie uit.

  </Accordion>

  <Accordion title="Geheimen, configuratie, updates en wizard">
    - `secrets.reload` resolveert actieve SecretRefs opnieuw en wisselt de runtimegeheimstatus alleen bij volledig succes.
    - `secrets.resolve` resolveert commandogerichte geheimtoewijzingen voor een specifieke opdracht-/doelset.
    - `config.get` retourneert de huidige configuratiesnapshot en hash.
    - `config.set` schrijft een gevalideerde configuratiepayload.
    - `config.patch` voegt een gedeeltelijke configuratie-update samen. Destructieve arrayvervanging
      vereist het getroffen pad in `replacePaths`; geneste arrays
      onder array-items gebruiken `[]`-paden zoals `agents.list[].skills`.
    - `config.apply` valideert en vervangt de volledige configuratiepayload.
    - `config.schema` retourneert de live configuratieschema-payload die door Control UI- en CLI-tools wordt gebruikt: schema, `uiHints`, versie en generatiemetadata, inclusief Plugin- en kanaalschemametadata wanneer de runtime deze kan laden. Het schema bevat veldmetadata voor `title` / `description`, afgeleid van dezelfde labels en helptekst die door de UI worden gebruikt, inclusief geneste object-, wildcard-, array-item- en `anyOf` / `oneOf` / `allOf`-compositietakken wanneer bijpassende velddocumentatie bestaat.
    - `config.schema.lookup` retourneert een pad-gescopete lookup-payload voor één configuratiepad: genormaliseerd pad, een oppervlakkige schemaknoop, overeenkomende hint + `hintPath`, optionele `reloadKind` en directe onderliggende samenvattingen voor UI/CLI-drilldown. `reloadKind` is een van `restart`, `hot` of `none` en weerspiegelt de Gateway-configuratieherlaadplanner voor het aangevraagde pad. Lookup-schemaknopen behouden de gebruikersgerichte documentatie en algemene validatievelden (`title`, `description`, `type`, `enum`, `const`, `format`, `pattern`, grenzen voor numeriek/string/array/object en vlaggen zoals `additionalProperties`, `deprecated`, `readOnly`, `writeOnly`). Onderliggende samenvattingen tonen `key`, genormaliseerd `path`, `type`, `required`, `hasChildren`, optionele `reloadKind`, plus de overeenkomende `hint` / `hintPath`.
    - `update.run` voert de Gateway-updateflow uit en plant alleen een herstart wanneer de update zelf is geslaagd; aanroepers met een sessie kunnen `continuationMessage` opnemen zodat het opstarten na de herstart één vervolgturndoorloop van de agent hervat via de wachtrij voor herstartvoortzetting. Updates via pakketbeheerders en supervised git-checkout-updates vanuit het control plane gebruiken een losgekoppelde managed-service-overdracht in plaats van de pakketboom te vervangen of checkout-/builduitvoer binnen de live Gateway te wijzigen. Een gestarte overdracht retourneert `ok: true` met `result.reason: "managed-service-handoff-started"` en `handoff.status: "started"`; niet-beschikbare of mislukte overdrachten retourneren `ok: false` met `managed-service-handoff-unavailable` of `managed-service-handoff-failed`, plus `handoff.command` wanneer een handmatige shell-update vereist is. Een niet-beschikbare overdracht betekent dat OpenClaw geen veilige supervisorgrens of duurzame service-identiteit heeft, zoals `OPENCLAW_SYSTEMD_UNIT` voor systemd. Tijdens een gestarte overdracht kan de herstartsentinel kort `stats.reason: "restart-health-pending"` rapporteren; de voortzetting wordt vertraagd totdat de CLI de herstartte Gateway verifieert en de definitieve `ok`-sentinel schrijft.
    - `update.status` ververst en retourneert de nieuwste updatesentinel voor herstart, inclusief de na-herstart draaiende versie wanneer beschikbaar.
    - `wizard.start`, `wizard.next`, `wizard.status` en `wizard.cancel` stellen de onboardingwizard beschikbaar via WS RPC.

  </Accordion>

  <Accordion title="Agent and workspace helpers">
    - `agents.list` retourneert geconfigureerde agentvermeldingen, inclusief effectief model en runtime-metadata.
    - `agents.create`, `agents.update` en `agents.delete` beheren agentrecords en workspace-bedrading.
    - `agents.files.list`, `agents.files.get` en `agents.files.set` beheren de bootstrap-workspacebestanden die voor een agent beschikbaar worden gemaakt.
    - `tasks.list`, `tasks.get` en `tasks.cancel` stellen het Gateway-taaklogboek beschikbaar aan SDK- en operatorclients.
    - `artifacts.list`, `artifacts.get` en `artifacts.download` stellen uit transcripties afgeleide artifactsamenvattingen en downloads beschikbaar voor een expliciete `sessionKey`-, `runId`- of `taskId`-scope. Run- en taakquery's lossen de eigenaarsessie server-side op en retourneren alleen transcriptiemedia met overeenkomende herkomst; onveilige of lokale URL-bronnen retourneren niet-ondersteunde downloads in plaats van server-side op te halen.
    - `environments.list` en `environments.status` stellen alleen-lezen Gateway-lokale en node-omgevingsdetectie beschikbaar voor SDK-clients.
    - `agent.identity.get` retourneert de effectieve assistentidentiteit voor een agent of sessie.
    - `agent.wait` wacht tot een run is voltooid en retourneert de terminale momentopname wanneer die beschikbaar is.

  </Accordion>

  <Accordion title="Session control">
    - `sessions.list` retourneert de huidige sessie-index, inclusief `agentRuntime`-metadata per rij wanneer een agent-runtimebackend is geconfigureerd.
    - `sessions.subscribe` en `sessions.unsubscribe` schakelen abonnementen op sessiewijzigingsgebeurtenissen in of uit voor de huidige WS-client.
    - `sessions.messages.subscribe` en `sessions.messages.unsubscribe` schakelen abonnementen op transcriptie-/berichtgebeurtenissen in of uit voor één sessie.
    - `sessions.preview` retourneert begrensde transcriptievoorbeelden voor specifieke sessiesleutels.
    - `sessions.describe` retourneert één Gateway-sessierij voor een exacte sessiesleutel.
    - `sessions.resolve` lost een sessiedoel op of canonicaliseert het.
    - `sessions.create` maakt een nieuwe sessievermelding.
    - `sessions.send` stuurt een bericht naar een bestaande sessie.
    - `sessions.steer` is de onderbreek-en-stuur-variant voor een actieve sessie.
    - `sessions.abort` breekt actief werk voor een sessie af. Een aanroeper kan `key` plus optioneel `runId` doorgeven, of alleen `runId` doorgeven voor actieve runs die de Gateway naar een sessie kan herleiden.
    - `sessions.patch` werkt sessiemetadata/-overrides bij en rapporteert het opgeloste canonieke model plus effectieve `agentRuntime`.
    - `sessions.reset`, `sessions.delete` en `sessions.compact` voeren sessieonderhoud uit.
    - `sessions.get` retourneert de volledige opgeslagen sessierij.
    - Chatuitvoering gebruikt nog steeds `chat.history`, `chat.send`, `chat.abort` en `chat.inject`. `chat.history` is weergavegenormaliseerd voor UI-clients: inline directivetags worden uit zichtbare tekst verwijderd, plattetekst-toolaanroep-XML-payloads (inclusief `<tool_call>...</tool_call>`, `<function_call>...</function_call>`, `<tool_calls>...</tool_calls>`, `<function_calls>...</function_calls>` en afgekorte toolaanroepblokken) en gelekte ASCII-/volledige-breedte-modelcontroletokens worden verwijderd, zuivere stille-token-assistentrijen zoals exacte `NO_REPLY` / `no_reply` worden weggelaten, en te grote rijen kunnen worden vervangen door placeholders.
    - `chat.message.get` is de additieve begrensde volledige-berichtlezer voor één zichtbare transcriptievermelding. Clients geven `sessionKey` door, optioneel `agentId` wanneer de sessieselectie agent-scoped is, plus een transcriptie-`messageId` die eerder via `chat.history` beschikbaar is gemaakt, en de Gateway retourneert dezelfde weergavegenormaliseerde projectie zonder de lichte afkappingslimiet van de geschiedenis wanneer de opgeslagen vermelding nog beschikbaar en niet te groot is.
    - `chat.send` accepteert een eenmalige `fastMode: "auto"` om snelle modus te gebruiken voor modelaanroepen die vóór de automatische afsluitgrens zijn gestart, en start daarna latere retry-, fallback-, toolresultaat- of vervolgaanroepen zonder snelle modus. De afsluitgrens is standaard 60 seconden en kan per model worden geconfigureerd met `agents.defaults.models["<provider>/<model>"].params.fastAutoOnSeconds`. Een `chat.send`-aanroeper kan eenmalig `fastAutoOnSeconds` doorgeven om de afsluitgrens voor die aanvraag te overschrijven.

  </Accordion>

  <Accordion title="Device pairing and device tokens">
    - `device.pair.list` retourneert wachtende en goedgekeurde gekoppelde apparaten.
    - `device.pair.approve`, `device.pair.reject` en `device.pair.remove` beheren apparaatkoppelingsrecords.
    - `device.token.rotate` roteert een gekoppeld apparaattoken binnen de grenzen van de goedgekeurde rol en aanroeperscope.
    - `device.token.revoke` trekt een gekoppeld apparaattoken in binnen de grenzen van de goedgekeurde rol en aanroeperscope.

  </Accordion>

  <Accordion title="Node pairing, invoke, and pending work">
    - `node.pair.request`, `node.pair.list`, `node.pair.approve`, `node.pair.reject`, `node.pair.remove` en `node.pair.verify` dekken node-koppeling en bootstrapverificatie.
    - `node.list` en `node.describe` retourneren bekende/verbonden node-status.
    - `node.rename` werkt een gekoppeld nodelabel bij.
    - `node.invoke` stuurt een opdracht door naar een verbonden node.
    - `node.invoke.result` retourneert het resultaat voor een invoke-aanvraag.
    - `node.event` brengt gebeurtenissen afkomstig van nodes terug naar de gateway.
    - `node.pending.pull` en `node.pending.ack` zijn de wachtrij-API's voor verbonden nodes.
    - `node.pending.enqueue` en `node.pending.drain` beheren duurzaam wachtend werk voor offline/losgekoppelde nodes.

  </Accordion>

  <Accordion title="Approval families">
    - `exec.approval.request`, `exec.approval.get`, `exec.approval.list` en `exec.approval.resolve` dekken eenmalige exec-goedkeuringsaanvragen plus lookup/replay van wachtende goedkeuringen.
    - `exec.approval.waitDecision` wacht op één wachtende exec-goedkeuring en retourneert de definitieve beslissing (of `null` bij timeout).
    - `exec.approvals.get` en `exec.approvals.set` beheren momentopnamen van Gateway-exec-goedkeuringsbeleid.
    - `exec.approvals.node.get` en `exec.approvals.node.set` beheren node-lokaal exec-goedkeuringsbeleid via node-relayopdrachten.
    - `plugin.approval.request`, `plugin.approval.list`, `plugin.approval.waitDecision` en `plugin.approval.resolve` dekken door plugins gedefinieerde goedkeuringsflows.

  </Accordion>

  <Accordion title="Automation, skills, and tools">
    - Automatisering: `wake` plant een onmiddellijke of volgende-heartbeat-wake-tekstinjectie; `cron.get`, `cron.list`, `cron.status`, `cron.add`, `cron.update`, `cron.remove`, `cron.run`, `cron.runs` beheren gepland werk.
    - `cron.run` blijft een enqueue-achtige RPC voor handmatige runs. Clients die voltooiingssemantiek nodig hebben, moeten de geretourneerde `runId` lezen en `cron.runs` pollen.
    - `cron.runs` accepteert een optioneel niet-leeg `runId`-filter zodat clients één handmatig in de wachtrij geplaatste run kunnen volgen zonder te racen tegen andere geschiedenisvermeldingen voor dezelfde job.
    - Skills en tools: `commands.list`, `skills.*`, `tools.catalog`, `tools.effective`, `tools.invoke`.

  </Accordion>
</AccordionGroup>

### Veelvoorkomende gebeurtenisfamilies

- `chat`: UI-chatupdates zoals `chat.inject` en andere chatgebeurtenissen die alleen transcriptie betreffen. In protocol v4 bevatten delta-payloads `deltaText`; `message` blijft de cumulatieve assistentmomentopname. Niet-prefixvervangingen zetten `replace=true` en gebruiken `deltaText` als vervangende tekst.
- `session.message`, `session.operation` en `session.tool`: transcriptie-, lopende sessiebewerking- en eventstreamupdates voor een geabonneerde sessie.
- `sessions.changed`: sessie-index of metadata gewijzigd.
- `presence`: updates van momentopnamen van systeempresentie.
- `tick`: periodieke keepalive-/liveness-gebeurtenis.
- `health`: update van gatewaygezondheidsmomentopname.
- `heartbeat`: update van heartbeat-eventstream.
- `cron`: wijzigingsgebeurtenis voor cron-run/job.
- `shutdown`: gateway-afsluitmelding.
- `node.pair.requested` / `node.pair.resolved`: node-koppelingslevenscyclus.
- `node.invoke.request`: broadcast van node-invoke-aanvraag.
- `device.pair.requested` / `device.pair.resolved`: levenscyclus van gekoppeld apparaat.
- `voicewake.changed`: wake-word-triggerconfiguratie gewijzigd.
- `exec.approval.requested` / `exec.approval.resolved`: exec-goedkeuringslevenscyclus.
- `plugin.approval.requested` / `plugin.approval.resolved`: plugin-goedkeuringslevenscyclus.

### Node-helpermethoden

- Nodes kunnen `skills.bins` aanroepen om de huidige lijst met Skills-executables op te halen voor auto-allow-controles.

### RPC's voor taaklogboek

Operatorclients kunnen Gateway-achtergrondtaakrecords inspecteren en annuleren via de RPC's voor het taaklogboek. Deze methoden retourneren opgeschoonde taaksamenvattingen, geen ruwe runtimestatus.

- `tasks.list` vereist `operator.read`.
  - Parameters: optioneel `status` (`"queued"`, `"running"`, `"completed"`, `"failed"`, `"cancelled"` of `"timed_out"`) of een array van die statussen, optioneel `agentId`, optioneel `sessionKey`, optioneel `limit` van `1` tot `500`, en optionele string `cursor`.
  - Resultaat: `{ "tasks": TaskSummary[], "nextCursor"?: string }`.
- `tasks.get` vereist `operator.read`.
  - Parameters: `{ "taskId": string }`.
  - Resultaat: `{ "task": TaskSummary }`.
  - Ontbrekende taak-id's retourneren de not-found-foutvorm van de Gateway.
- `tasks.cancel` vereist `operator.write`.
  - Parameters: `{ "taskId": string, "reason"?: string }`.
  - Resultaat:
    `{ "found": boolean, "cancelled": boolean, "reason"?: string, "task"?: TaskSummary }`.
  - `found` meldt of het logboek een overeenkomende taak had. `cancelled` meldt of de runtime annulering heeft geaccepteerd of vastgelegd.

`TaskSummary` bevat `id`, `status` en optionele metadata zoals `kind`, `runtime`, `title`, `agentId`, `sessionKey`, `childSessionKey`, `ownerKey`, `runId`, `taskId`, `flowId`, `parentTaskId`, `sourceId`, tijdstempels, voortgang, terminale samenvatting en opgeschoonde fouttekst. `agentId` identificeert de agent die de taak uitvoert; `sessionKey` en `ownerKey` behouden aanvrager- en besturingscontext.

### Operator-helpermethoden

- Operators kunnen `commands.list` (`operator.read`) aanroepen om de runtime
  command-inventaris voor een agent op te halen.
  - `agentId` is optioneel; laat het weg om de standaardagentwerkruimte te lezen.
  - `scope` bepaalt op welk oppervlak de primaire `name` is gericht:
    - `text` retourneert het primaire tekstcommandotoken zonder de voorafgaande `/`
    - `native` en het standaardpad `both` retourneren providerbewuste native namen
      wanneer beschikbaar
  - `textAliases` bevat exacte slash-aliassen zoals `/model` en `/m`.
  - `nativeName` bevat de providerbewuste native commandonaam wanneer die bestaat.
  - `provider` is optioneel en beïnvloedt alleen native naamgeving plus beschikbaarheid
    van native Plugin-commando's.
  - `includeArgs=false` laat geserialiseerde argumentmetadata weg uit de respons.
- Operators kunnen `tools.catalog` (`operator.read`) aanroepen om de runtime-toolcatalogus voor een
  agent op te halen. De respons bevat gegroepeerde tools en herkomstmetadata:
  - `source`: `core` of `plugin`
  - `pluginId`: plugin-eigenaar wanneer `source="plugin"`
  - `optional`: of een plugin-tool optioneel is
- Operators kunnen `tools.effective` (`operator.read`) aanroepen om de runtime-effectieve
  toolinventaris voor een sessie op te halen.
  - `sessionKey` is vereist.
  - De gateway leidt vertrouwde runtimecontext server-side af uit de sessie in plaats van
    door de aanroeper aangeleverde auth- of aflevercontext te accepteren.
  - De respons is een sessiegebonden, server-afgeleide projectie van de actieve inventaris,
    inclusief core-, plugin-, kanaal- en al ontdekte MCP-servertools.
  - `tools.effective` is read-only voor MCP: het kan een warme sessie-MCP-catalogus projecteren via het
    uiteindelijke toolbeleid, maar het maakt geen MCP-runtimes aan, verbindt geen transports en voert geen
    `tools/list` uit. Als er geen overeenkomende warme catalogus bestaat, kan de respons een melding bevatten zoals
    `mcp-not-yet-connected`, `mcp-not-yet-listed` of `mcp-stale-catalog`.
  - Effectieve toolitems gebruiken `source="core"`, `source="plugin"`, `source="channel"` of
    `source="mcp"`.
- Operators kunnen `tools.invoke` (`operator.write`) aanroepen om één beschikbare tool uit te voeren via hetzelfde
  gatewaybeleidspad als `/tools/invoke`.
  - `name` is vereist. `args`, `sessionKey`, `agentId`, `confirm` en
    `idempotencyKey` zijn optioneel.
  - Als zowel `sessionKey` als `agentId` aanwezig zijn, moet de opgeloste sessieagent overeenkomen met
    `agentId`.
  - Core-wrappers die alleen voor eigenaren zijn, zoals `cron`, `gateway` en `nodes`, vereisen
    eigenaar-/adminidentiteit (`operator.admin`), ook al is de
    methode `tools.invoke` zelf `operator.write`.
  - De respons is een SDK-gerichte envelop met `ok`, `toolName`, optioneel `output` en getypeerde
    `error`-velden. Goedkeurings- of beleidsweigeringen retourneren `ok:false` in de payload in plaats van
    de gateway-toolbeleidspijplijn te omzeilen.
- Operators kunnen `skills.status` (`operator.read`) aanroepen om de zichtbare
  skillinventaris voor een agent op te halen.
  - `agentId` is optioneel; laat het weg om de standaardagentwerkruimte te lezen.
  - De respons bevat geschiktheid, ontbrekende vereisten, configuratiecontroles en
    opgeschoonde installatieopties zonder ruwe geheime waarden bloot te leggen.
- Operators kunnen `skills.search` en `skills.detail` (`operator.read`) aanroepen voor
  ClawHub-detectiemetadata.
- Operators kunnen `skills.upload.begin`, `skills.upload.chunk` en
  `skills.upload.commit` (`operator.admin`) aanroepen om een privé-skillarchief klaar te zetten
  voordat het wordt geïnstalleerd. Dit is een apart admin-uploadpad voor vertrouwde clients,
  niet de normale ClawHub-skillinstallatiestroom, en is standaard uitgeschakeld tenzij
  `skills.install.allowUploadedArchives` is ingeschakeld.
  - `skills.upload.begin({ kind: "skill-archive", slug, sizeBytes, sha256?, force?, idempotencyKey? })`
    maakt een upload aan die aan die slug en force-waarde is gebonden.
  - `skills.upload.chunk({ uploadId, offset, dataBase64 })` voegt bytes toe op
    de exacte gedecodeerde offset.
  - `skills.upload.commit({ uploadId, sha256? })` verifieert de uiteindelijke grootte en
    SHA-256. Commit rondt alleen de upload af; het installeert de skill niet.
  - Geüploade skillarchieven zijn zip-archieven met een `SKILL.md`-root. De
    interne directorynaam van het archief kiest nooit het installatiedoel.
- Operators kunnen `skills.install` (`operator.admin`) in drie modi aanroepen:
  - ClawHub-modus: `{ source: "clawhub", slug, version?, force? }` installeert een
    skillmap in de standaardagentwerkruimte-directory `skills/`.
  - Uploadmodus: `{ source: "upload", uploadId, slug, force?, sha256?, timeoutMs? }`
    installeert een gecommitte upload in de standaardagentwerkruimte-directory
    `skills/<slug>`. De slug en force-waarde moeten overeenkomen met het oorspronkelijke
    `skills.upload.begin`-verzoek. Deze modus wordt geweigerd tenzij
    `skills.install.allowUploadedArchives` is ingeschakeld. De instelling heeft geen
    invloed op ClawHub-installaties.
  - Gateway-installermodus: `{ name, installId, timeoutMs? }`
    voert een gedeclareerde `metadata.openclaw.install`-actie uit op de gatewayhost.
    Oudere clients kunnen nog steeds `dangerouslyForceUnsafeInstall` verzenden; dit veld is
    verouderd, wordt alleen geaccepteerd voor protocolcompatibiliteit en genegeerd. Gebruik
    `security.installPolicy` voor installatiebeslissingen die eigendom zijn van operators.
- Operators kunnen `skills.update` (`operator.admin`) in twee modi aanroepen:
  - ClawHub-modus werkt één gevolgde slug of alle gevolgde ClawHub-installaties bij in
    de standaardagentwerkruimte.
  - Configuratiemodus patcht waarden van `skills.entries.<skillKey>` zoals `enabled`,
    `apiKey` en `env`.

### `models.list`-weergaven

`models.list` accepteert een optionele parameter `view`:

- Weggelaten of `"default"`: huidig runtimegedrag. Als `agents.defaults.models` is geconfigureerd, is de respons de toegestane catalogus, inclusief dynamisch ontdekte modellen voor `provider/*`-items. Anders is de respons de volledige Gateway-catalogus.
- `"configured"`: gedrag met picker-formaat. Als `agents.defaults.models` is geconfigureerd, heeft dat nog steeds voorrang, inclusief providergebonden detectie voor `provider/*`-items. Zonder allowlist gebruikt de respons expliciete `models.providers.*.models`-items, met terugval naar de volledige catalogus alleen wanneer er geen geconfigureerde modelrijen bestaan.
- `"all"`: volledige Gateway-catalogus, waarbij `agents.defaults.models` wordt omzeild. Gebruik dit voor diagnostiek en detectie-UI's, niet voor normale modelpickers.

## Exec-goedkeuringen

- Wanneer een exec-verzoek goedkeuring nodig heeft, broadcast de gateway `exec.approval.requested`.
- Operatorclients lossen dit op door `exec.approval.resolve` aan te roepen (vereist scope `operator.approvals`).
- Voor `host=node` moet `exec.approval.request` `systemRunPlan` bevatten (canonieke `argv`/`cwd`/`rawCommand`/sessiemetadata). Verzoeken zonder `systemRunPlan` worden geweigerd.
- Na goedkeuring gebruiken doorgestuurde `node.invoke system.run`-aanroepen dat canonieke
  `systemRunPlan` opnieuw als de gezaghebbende command-/cwd-/sessiecontext.
- Als een aanroeper `command`, `rawCommand`, `cwd`, `agentId` of
  `sessionKey` muteert tussen voorbereiding en de uiteindelijke goedgekeurde `system.run`-forward, weigert de
  gateway de run in plaats van de gemuteerde payload te vertrouwen.

## Terugval voor agentaflevering

- `agent`-verzoeken kunnen `deliver=true` bevatten om uitgaande aflevering aan te vragen.
- `bestEffortDeliver=false` behoudt strikt gedrag: onopgeloste of alleen-interne afleverdoelen retourneren `INVALID_REQUEST`.
- `bestEffortDeliver=true` staat terugval naar alleen-sessie-uitvoering toe wanneer geen extern afleverbare route kan worden opgelost (bijvoorbeeld interne/webchatsessies of ambigue multikanaalconfiguraties).
- Uiteindelijke `agent`-resultaten kunnen `result.deliveryStatus` bevatten wanneer aflevering was
  aangevraagd, met dezelfde statussen `sent`, `suppressed`, `partial_failed` en `failed`
  die zijn gedocumenteerd voor [`openclaw agent --json --deliver`](/nl/cli/agent#json-delivery-status).

## Versionering

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
stabiel binnen protocol v4 en vormen de verwachte baseline voor clients van derden.

| Constante                                 | Standaard                                             | Bron                                                                                       |
| ----------------------------------------- | ----------------------------------------------------- | ------------------------------------------------------------------------------------------ |
| `PROTOCOL_VERSION`                        | `4`                                                   | `packages/gateway-protocol/src/version.ts`                                                 |
| `MIN_CLIENT_PROTOCOL_VERSION`             | `4`                                                   | `packages/gateway-protocol/src/version.ts`                                                 |
| Verzoektimeout (per RPC)                  | `30_000` ms                                           | `src/gateway/client.ts` (`requestTimeoutMs`)                                               |
| Preauth-/connect-challenge-timeout        | `15_000` ms                                           | `src/gateway/handshake-timeouts.ts` (config/env kan het gekoppelde server-/clientbudget verhogen) |
| Initiële reconnect-backoff                | `1_000` ms                                            | `src/gateway/client.ts` (`backoffMs`)                                                      |
| Maximale reconnect-backoff                | `30_000` ms                                           | `src/gateway/client.ts` (`scheduleReconnect`)                                              |
| Fast-retry-clamp na sluiten door devicetoken | `250` ms                                           | `src/gateway/client.ts`                                                                    |
| Force-stop-gratie vóór `terminate()`      | `250` ms                                              | `FORCE_STOP_TERMINATE_GRACE_MS`                                                            |
| Standaardtimeout van `stopAndWait()`      | `1_000` ms                                            | `STOP_AND_WAIT_TIMEOUT_MS`                                                                 |
| Standaard tick-interval (vóór `hello-ok`) | `30_000` ms                                           | `src/gateway/client.ts`                                                                    |
| Sluiten bij tick-timeout                  | code `4000` wanneer stilte langer duurt dan `tickIntervalMs * 2` | `src/gateway/client.ts`                                                                    |
| `MAX_PAYLOAD_BYTES`                       | `25 * 1024 * 1024` (25 MB)                            | `src/gateway/server-constants.ts`                                                          |

De server adverteert de effectieve `policy.tickIntervalMs`, `policy.maxPayload`
en `policy.maxBufferedBytes` in `hello-ok`; clients moeten die waarden respecteren
in plaats van de standaardwaarden van vóór de handshake.

## Auth

- Gateway-authenticatie met een gedeeld geheim gebruikt `connect.params.auth.token` of
  `connect.params.auth.password`, afhankelijk van de geconfigureerde auth-modus.
- Modi die identiteit dragen, zoals Tailscale Serve
  (`gateway.auth.allowTailscale: true`) of niet-loopback
  `gateway.auth.mode: "trusted-proxy"`, voldoen aan de connect-auth-controle via
  requestheaders in plaats van via `connect.params.auth.*`.
- Private-ingress `gateway.auth.mode: "none"` slaat connect-auth met gedeeld geheim
  volledig over; stel die modus niet bloot op publieke/niet-vertrouwde ingress.
- Na koppeling geeft de Gateway een **apparaattoken** uit dat is beperkt tot de verbindingsrol
  + machtigingen. Het wordt geretourneerd in `hello-ok.auth.deviceToken` en moet door
  de client worden bewaard voor toekomstige connects.
- Clients moeten de primaire `hello-ok.auth.deviceToken` bewaren na elke
  succesvolle connect.
- Opnieuw verbinden met dat **opgeslagen** apparaattoken moet ook de opgeslagen
  goedgekeurde machtigingenset voor dat token hergebruiken. Dit behoudt lees-/probe-/status-toegang
  die al was verleend en voorkomt dat reconnects stilzwijgend worden teruggebracht tot een
  nauwere impliciete admin-only machtiging.
- Client-side connect-auth-opbouw (`selectConnectAuth` in
  `src/gateway/client.ts`):
  - `auth.password` staat hier los van en wordt altijd doorgestuurd wanneer het is ingesteld.
  - `auth.token` wordt in prioriteitsvolgorde gevuld: eerst een expliciet gedeeld token,
    daarna een expliciete `deviceToken`, daarna een opgeslagen per-apparaat-token (gesleuteld op
    `deviceId` + `role`).
  - `auth.bootstrapToken` wordt alleen verzonden wanneer geen van bovenstaande een
    `auth.token` opleverde. Een gedeeld token of een opgelost apparaattoken onderdrukt het.
  - Automatische promotie van een opgeslagen apparaattoken bij de eenmalige
    `AUTH_TOKEN_MISMATCH`-retry is beperkt tot **vertrouwde endpoints** —
    loopback, of `wss://` met een gepinde `tlsFingerprint`. Publieke `wss://`
    zonder pinning komt niet in aanmerking.
- Ingebouwde setup-code-bootstrap retourneert de primaire Node
  `hello-ok.auth.deviceToken` plus een begrensd operatortoken in
  `hello-ok.auth.deviceTokens` voor vertrouwde mobiele overdracht. Het operatortoken
  bevat `operator.talk.secrets` voor native Talk-configuratielezingen en
  sluit `operator.admin` en `operator.pairing` uit.
- Terwijl een niet-baseline setup-code-bootstrap op goedkeuring wacht, bevatten `PAIRING_REQUIRED`-details
  `recommendedNextStep: "wait_then_retry"`, `retryable: true`,
  en `pauseReconnect: false`. Clients moeten blijven reconnecten met hetzelfde
  bootstrap-token totdat de aanvraag is goedgekeurd of het token ongeldig wordt.
- Bewaar `hello-ok.auth.deviceTokens` alleen wanneer de connect bootstrap-auth gebruikte
  op een vertrouwd transport zoals `wss://` of loopback/lokale koppeling.
- Als een client een **expliciete** `deviceToken` of expliciete `scopes` opgeeft, blijft die
  door de aanroeper gevraagde machtigingenset gezaghebbend; gecachte machtigingen worden alleen
  hergebruikt wanneer de client het opgeslagen per-apparaat-token hergebruikt.
- Apparaattokens kunnen worden geroteerd/ingetrokken via `device.token.rotate` en
  `device.token.revoke` (vereist de machtiging `operator.pairing`). Het roteren of
  intrekken van een Node-rol of andere niet-operatorrol vereist ook `operator.admin`.
- `device.token.rotate` retourneert rotatiemetadata. Het echoot het vervangende
  bearer-token alleen voor calls vanaf hetzelfde apparaat die al met
  dat apparaattoken zijn geauthenticeerd, zodat token-only clients hun vervanging kunnen bewaren voordat
  ze opnieuw verbinden. Gedeelde/admin-rotaties echoën het bearer-token niet.
- Tokenuitgifte, rotatie en intrekking blijven begrensd tot de goedgekeurde rollenset
  die in de pairing-entry van dat apparaat is vastgelegd; tokenmutatie kan geen
  apparaatrol uitbreiden of targeten die pairing-goedkeuring nooit heeft verleend.
- Voor tokensessies van gekoppelde apparaten is apparaatbeheer self-scoped tenzij de
  aanroeper ook `operator.admin` heeft: niet-admin-aanroepers kunnen alleen het
  operatortoken voor hun **eigen** apparaat-entry beheren. Beheer van Node- en andere niet-operator-tokens
  is alleen voor admins, zelfs voor het eigen apparaat van de aanroeper.
- `device.token.rotate` en `device.token.revoke` controleren ook de machtigingenset van het doel-operatortoken
  tegen de huidige sessiemachtigingen van de aanroeper. Niet-admin-aanroepers
  kunnen geen breder operatortoken roteren of intrekken dan ze zelf al hebben.
- Auth-fouten bevatten `error.details.code` plus herstelhints:
  - `error.details.canRetryWithDeviceToken` (boolean)
  - `error.details.recommendedNextStep` (`retry_with_device_token`, `update_auth_configuration`, `update_auth_credentials`, `wait_then_retry`, `review_auth_configuration`)
- Clientgedrag voor `AUTH_TOKEN_MISMATCH`:
  - Vertrouwde clients mogen één begrensde retry proberen met een gecachet per-apparaat-token.
  - Als die retry mislukt, moeten clients automatische reconnect-loops stoppen en begeleiding voor operatoractie tonen.
- `AUTH_SCOPE_MISMATCH` betekent dat het apparaattoken is herkend maar de
  gevraagde rol/machtigingen niet dekt. Clients moeten dit niet presenteren als een slecht token;
  vraag de operator om opnieuw te koppelen of het nauwere/bredere machtigingscontract goed te keuren.

## Apparaatidentiteit + koppeling

- Nodes moeten een stabiele apparaatidentiteit (`device.id`) opnemen die is afgeleid van een
  keypair-fingerprint.
- Gateways geven tokens uit per apparaat + rol.
- Pairing-goedkeuringen zijn vereist voor nieuwe apparaat-ID's, tenzij lokale automatische goedkeuring
  is ingeschakeld.
- Automatische pairing-goedkeuring is gericht op directe local loopback-connects.
- OpenClaw heeft ook een smal backend/container-lokaal self-connect-pad voor
  vertrouwde helperflows met gedeeld geheim.
- Same-host tailnet- of LAN-connects worden nog steeds als extern behandeld voor pairing en
  vereisen goedkeuring.
- WS-clients nemen normaal `device`-identiteit op tijdens `connect` (operator +
  Node). De enige operatoruitzonderingen zonder apparaat zijn expliciete vertrouwenspaden:
  - `gateway.controlUi.allowInsecureAuth=true` voor localhost-only onveilige HTTP-compatibiliteit.
  - succesvolle `gateway.auth.mode: "trusted-proxy"` operator-Control UI-auth.
  - `gateway.controlUi.dangerouslyDisableDeviceAuth=true` (break-glass, ernstige beveiligingsverlaging).
  - directe-loopback `gateway-client` backend-RPC's op het gereserveerde interne
    helperpad.
- Het weglaten van apparaatidentiteit heeft gevolgen voor machtigingen. Wanneer een operatorverbinding
  zonder apparaat via een expliciet vertrouwenspad wordt toegestaan, wist OpenClaw nog steeds
  zelfverklaarde machtigingen naar een lege set, tenzij dat pad een benoemde
  uitzondering voor behoud van machtigingen heeft. Door machtigingen afgeschermde methoden mislukken dan met
  `missing scope`.
- `gateway.controlUi.dangerouslyDisableDeviceAuth=true` is een Control UI
  break-glass-pad voor behoud van machtigingen. Het verleent geen machtigingen aan willekeurige
  aangepaste backend- of CLI-vormige WebSocket-clients.
- Het gereserveerde directe-loopback `gateway-client` backend-helperpad behoudt
  machtigingen alleen voor interne lokale control-plane-RPC's; aangepaste backend-ID's krijgen
  deze uitzondering niet.
- Alle verbindingen moeten de door de server geleverde `connect.challenge`-nonce ondertekenen.

### Diagnostiek voor apparaatauth-migratie

Voor legacy clients die nog steeds pre-challenge-ondertekeningsgedrag gebruiken, retourneert `connect` nu
`DEVICE_AUTH_*`-detailcodes onder `error.details.code` met een stabiele `error.details.reason`.

Veelvoorkomende migratiefouten:

| Bericht                     | details.code                     | details.reason           | Betekenis                                          |
| --------------------------- | -------------------------------- | ------------------------ | -------------------------------------------------- |
| `device nonce required`     | `DEVICE_AUTH_NONCE_REQUIRED`     | `device-nonce-missing`   | Client liet `device.nonce` weg (of stuurde leeg).  |
| `device nonce mismatch`     | `DEVICE_AUTH_NONCE_MISMATCH`     | `device-nonce-mismatch`  | Client ondertekende met een oude/verkeerde nonce.  |
| `device signature invalid`  | `DEVICE_AUTH_SIGNATURE_INVALID`  | `device-signature`       | Signature-payload komt niet overeen met v2-payload. |
| `device signature expired`  | `DEVICE_AUTH_SIGNATURE_EXPIRED`  | `device-signature-stale` | Ondertekende timestamp valt buiten toegestane skew. |
| `device identity mismatch`  | `DEVICE_AUTH_DEVICE_ID_MISMATCH` | `device-id-mismatch`     | `device.id` komt niet overeen met public-key-fingerprint. |
| `device public key invalid` | `DEVICE_AUTH_PUBLIC_KEY_INVALID` | `device-public-key`      | Public-key-formaat/canonicalisatie is mislukt.     |

Migratiedoel:

- Wacht altijd op `connect.challenge`.
- Onderteken de v2-payload die de servernonce bevat.
- Verzend dezelfde nonce in `connect.params.device.nonce`.
- De voorkeurs-signature-payload is `v3`, die `platform` en `deviceFamily`
  bindt naast velden voor device/client/role/scopes/token/nonce.
- Legacy `v2`-signatures blijven geaccepteerd voor compatibiliteit, maar pinning van gekoppelde-apparaatmetadata
  blijft het commandobeleid bij reconnect bepalen.

## TLS + pinning

- TLS wordt ondersteund voor WS-verbindingen.
- Clients kunnen optioneel de cert-fingerprint van de Gateway pinnen (zie `gateway.tls`
  config plus `gateway.remote.tlsFingerprint` of CLI `--tls-fingerprint`).

## Bereik

Dit protocol stelt de **volledige gateway-API** beschikbaar (status, kanalen, modellen, chat,
agent, sessies, Nodes, goedkeuringen, enz.). Het exacte oppervlak wordt gedefinieerd door de
TypeBox-schema's in `packages/gateway-protocol/src/schema.ts`.

## Gerelateerd

- [Bridge-protocol](/nl/gateway/bridge-protocol)
- [Gateway-runbook](/nl/gateway)
