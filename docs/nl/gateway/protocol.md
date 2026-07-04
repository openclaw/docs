---
read_when:
    - Gateway-WS-clients implementeren of bijwerken
    - Fouten opsporen bij protocolmismatches of verbindingsfouten
    - Protocolschema en -modellen opnieuw genereren
summary: 'Gateway WebSocket-protocol: handshake, frames, versiebeheer'
title: Gateway-protocol
x-i18n:
    generated_at: "2026-07-04T18:07:50Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 763dd5cba2f1aa0de95243a4996b4da1b4aa32c5c1a4b5b6c112d605e677bd70
    source_path: gateway/protocol.md
    workflow: 16
---

Het Gateway WS-protocol is het **enige besturingsvlak + node-transport** voor
OpenClaw. Alle clients (CLI, web-UI, macOS-app, iOS/Android-nodes, headless
nodes) verbinden via WebSocket en declareren hun **rol** + **scope** tijdens
de handshake.

## Transport

- WebSocket, tekstframes met JSON-payloads.
- Het eerste frame **moet** een `connect`-verzoek zijn.
- Pre-connect-frames zijn beperkt tot 64 KiB. Na een geslaagde handshake moeten clients
  de limieten `hello-ok.policy.maxPayload` en
  `hello-ok.policy.maxBufferedBytes` volgen. Met diagnostiek ingeschakeld
  zenden te grote inkomende frames en trage uitgaande buffers `payload.large`-events
  uit voordat de Gateway het betrokken frame sluit of laat vallen. Deze events bewaren
  groottes, limieten, oppervlakken en veilige redencodes. Ze bewaren niet de berichttekst,
  inhoud van bijlagen, ruwe framebody, tokens, cookies of geheime waarden.

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

Terwijl de Gateway startup-sidecars nog afrondt, kan het `connect`-verzoek
een opnieuw te proberen `UNAVAILABLE`-fout retourneren met `details.reason` ingesteld op
`"startup-sidecars"` en `retryAfterMs`. Clients moeten die respons opnieuw proberen
binnen hun totale verbindingsbudget in plaats van deze als terminale
handshakefout te tonen.

`server`, `features`, `snapshot` en `policy` zijn allemaal vereist door het schema
(`packages/gateway-protocol/src/schema/frames.ts`). `auth` is ook vereist en rapporteert
de onderhandelde rol/scopes. `pluginSurfaceUrls` is optioneel en koppelt Plugin-
oppervlaknamen, zoals `canvas`, aan gescopete gehoste URL's.

Gescopete URL's voor Plugin-oppervlakken kunnen verlopen. Nodes kunnen
`node.pluginSurface.refresh` aanroepen met `{ "surface": "canvas" }` om een verse
vermelding in `pluginSurfaceUrls` te ontvangen. De experimentele refactor van de Canvas-Plugin
ondersteunt het verouderde compatibiliteitspad `canvasHostUrl`, `canvasCapability` of
`node.canvas.capability.refresh` niet; huidige native clients en
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
ze authenticeren met het gedeelde Gateway-token/wachtwoord. Dit pad is gereserveerd
voor interne RPC's van het besturingsvlak en voorkomt dat verouderde CLI/device-koppelingsbaselines
lokaal backendwerk blokkeren, zoals updates van subagentsessies. Externe clients,
clients met browser-origin, nodeclients en expliciete device-token/device-identity-
clients gebruiken nog steeds de normale koppelings- en scope-upgradecontroles.

Wanneer een devicetoken wordt uitgegeven, bevat `hello-ok` ook:

```json
{
  "auth": {
    "deviceToken": "…",
    "role": "operator",
    "scopes": ["operator.read", "operator.write"]
  }
}
```

Ingebouwde QR/setup-code-bootstrap is een vers pad voor mobiele overdracht. Een geslaagde
basisverbinding met setup-code retourneert een primair nodetoken plus één begrensd
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
mobiele operatorloop kan starten en native setup kan voltooien zonder koppelings-
mutatiescopes of `operator.admin` te verlenen. Het omvat `operator.talk.secrets` zodat de
native client de Talk-configuratie kan lezen die na bootstrap nodig is. Bredere
koppeling en admintoegang vereisen een aparte goedgekeurde operatorkoppeling of tokenflow.
Clients moeten `hello-ok.auth.deviceTokens` alleen bewaren
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

- **Verzoek**: `{type:"req", id, method, params}`
- **Respons**: `{type:"res", id, ok, payload|error}`
- **Event**: `{type:"event", event, payload, seq?, stateVersion?}`

Methoden met neveneffecten vereisen **idempotentiesleutels** (zie schema).

## Rollen + scopes

Voor het volledige operator-scope-model, controles tijdens goedkeuring en semantiek
voor gedeelde geheimen, zie [Operator-scopes](/nl/gateway/operator-scopes).

### Rollen

- `operator` = client van het besturingsvlak (CLI/UI/automatisering).
- `node` = capability-host (camera/screen/canvas/system.run).

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
Wanneer geheimen zijn opgenomen, moeten clients de actieve Talk-providercredential lezen
uit `talk.resolved.config.apiKey`; `talk.providers.<id>.apiKey`
blijft bronvormig en kan een SecretRef-object of een geredigeerde tekenreeks zijn.

Door Plugins geregistreerde Gateway RPC-methoden kunnen hun eigen operator-scope aanvragen, maar
gereserveerde core-adminprefixen (`config.*`, `exec.approvals.*`, `wizard.*`,
`update.*`) worden altijd opgelost naar `operator.admin`.

Methodescope is alleen de eerste poort. Sommige slashcommando's die via
`chat.send` worden bereikt, passen daarbovenop strengere controles op commandoniveau toe. Persistente
schrijfbewerkingen met `/config set` en `/config unset` vereisen bijvoorbeeld `operator.admin`.

`node.pair.approve` heeft ook een extra scopecontrole tijdens goedkeuring bovenop de
basisscope van de methode:

- verzoeken zonder commando: `operator.pairing`
- verzoeken met niet-exec-nodecommando's: `operator.pairing` + `operator.write`
- verzoeken die `system.run`, `system.run.prepare` of `system.which` bevatten:
  `operator.pairing` + `operator.admin`

### Caps/commands/permissions (node)

Nodes declareren capability-claims tijdens het verbinden:

- `caps`: capability-categorieën op hoog niveau zoals `camera`, `canvas`, `screen`,
  `location`, `voice` en `talk`.
- `commands`: allowlist met commando's voor invoke.
- `permissions`: granulaire schakelaars (bijv. `screen.record`, `camera.capture`).

De Gateway behandelt deze als **claims** en handhaaft server-side allowlists.

## Aanwezigheid

- `system-presence` retourneert vermeldingen met device-identiteit als sleutel.
- Aanwezigheidsvermeldingen bevatten `deviceId`, `roles` en `scopes` zodat UI's één rij per device kunnen tonen,
  zelfs wanneer het verbindt als zowel **operator** als **node**.
- `node.list` bevat optionele velden `lastSeenAtMs` en `lastSeenReason`. Verbonden nodes rapporteren
  hun huidige verbindingstijd als `lastSeenAtMs` met reden `connect`; gekoppelde nodes kunnen ook
  duurzame achtergrondaanwezigheid rapporteren wanneer een vertrouwd node-event hun koppelingsmetadata bijwerkt.

### Achtergrond-alive-event voor nodes

Nodes mogen `node.event` aanroepen met `event: "node.presence.alive"` om vast te leggen dat een gekoppelde node
actief was tijdens een achtergrondwake zonder deze als verbonden te markeren.

```json
{
  "event": "node.presence.alive",
  "payloadJSON": "{\"trigger\":\"silent_push\",\"sentAtMs\":1737264000000,\"displayName\":\"Peter's iPhone\",\"version\":\"2026.4.28\",\"platform\":\"iOS 18.4.0\",\"deviceFamily\":\"iPhone\",\"modelIdentifier\":\"iPhone17,1\",\"pushTransport\":\"relay\"}"
}
```

`trigger` is een gesloten enum: `background`, `silent_push`, `bg_app_refresh`,
`significant_location`, `manual` of `connect`. Onbekende triggertekenreeksen worden door de Gateway
genormaliseerd naar `background` vóór persistentie. Het event is alleen duurzaam voor geauthenticeerde node-
devicesessies; sessies zonder device of zonder koppeling retourneren `handled: false`.

Geslaagde gateways retourneren een gestructureerd resultaat:

```json
{
  "ok": true,
  "event": "node.presence.alive",
  "handled": true,
  "reason": "persisted"
}
```

Oudere gateways kunnen nog steeds `{ "ok": true }` retourneren voor `node.event`; clients moeten dit behandelen als een
bevestigde RPC, niet als duurzame persistentie van aanwezigheid.

## Scoping van broadcastevents

Door de server gepushte WebSocket-broadcastevents zijn scope-gated zodat sessies met alleen koppelingsscope of alleen node-sessies niet passief sessie-inhoud ontvangen.

- **Chat-, agent- en tool-result-frames** (inclusief gestreamde `agent`-events en resultaten van toolcalls) vereisen minimaal `operator.read`. Sessies zonder `operator.read` slaan deze frames volledig over.
- **Door Plugins gedefinieerde `plugin.*`-broadcasts** zijn beperkt tot `operator.write` of `operator.admin`, afhankelijk van hoe de Plugin ze heeft geregistreerd.
- **Status- en transportevents** (`heartbeat`, `presence`, `tick`, connect/disconnect-levenscyclus, enz.) blijven onbeperkt zodat transportstatus zichtbaar blijft voor elke geauthenticeerde sessie.
- **Onbekende broadcasteventfamilies** zijn standaard scope-gated (fail-closed), tenzij een geregistreerde handler ze expliciet versoepelt.

Elke clientverbinding behoudt zijn eigen sequentienummer per client, zodat broadcasts monotone ordening op die socket behouden, zelfs wanneer verschillende clients verschillende scope-gefilterde subsets van de eventstream zien.

## Veelgebruikte RPC-methodefamilies

Het openbare WS-oppervlak is breder dan de handshake-/auth-voorbeelden hierboven. Dit
is geen gegenereerde dump — `hello-ok.features.methods` is een conservatieve
discoverlijst die is opgebouwd uit `src/gateway/server-methods-list.ts` plus geladen
methode-exports van Plugins/kanalen. Behandel het als featurediscovery, niet als een volledige
opsomming van `src/gateway/server-methods/*.ts`.

  <AccordionGroup>
  <Accordion title="Systeem en identiteit">
    - `health` retourneert de gecachte of zojuist gepeilde gateway-gezondheidssnapshot.
    - `diagnostics.stability` retourneert de recente begrensde recorder voor diagnostische stabiliteit. Deze bewaart operationele metadata zoals gebeurtenisnamen, aantallen, bytegroottes, geheugenmetingen, wachtrij-/sessiestatus, kanaal-/pluginnamen en sessie-id's. Deze bewaart geen chattekst, webhook-bodies, tooluitvoer, ruwe request- of response-bodies, tokens, cookies of geheime waarden. Leesbereik voor operators is vereist.
    - `status` retourneert de Gateway-samenvatting in `/status`-stijl; gevoelige velden worden alleen opgenomen voor operatorclients met admin-bereik.
    - `gateway.identity.get` retourneert de Gateway-apparaatidentiteit die wordt gebruikt door relay- en koppelingsflows.
    - `system-presence` retourneert de huidige aanwezigheidssnapshot voor verbonden operator-/Node-apparaten.
    - `system-event` voegt een systeemgebeurtenis toe en kan aanwezigheidscontext bijwerken/uitzenden.
    - `last-heartbeat` retourneert de laatst bewaarde heartbeat-gebeurtenis.
    - `set-heartbeats` schakelt Heartbeat-verwerking op de Gateway in of uit.

  </Accordion>

  <Accordion title="Modellen en gebruik">
    - `models.list` retourneert de modelcatalogus die tijdens runtime is toegestaan. Geef `{ "view": "configured" }` door voor geconfigureerde modellen op picker-formaat (`agents.defaults.models` eerst, daarna `models.providers.*.models`), of `{ "view": "all" }` voor de volledige catalogus.
    - `usage.status` retourneert gebruiksvensters/resterende-quotumsamenvattingen per provider.
    - `usage.cost` retourneert geaggregeerde kostengebruikssamenvattingen voor een datumbereik.
      Geef `agentId` door voor één agent, of `agentScope: "all"` om geconfigureerde agents te aggregeren.
    - `doctor.memory.status` retourneert gereedheid van vectorgeheugen / gecachte embeddings voor de actieve standaard-agentwerkruimte. Geef `{ "probe": true }` of `{ "deep": true }` alleen door wanneer de caller expliciet een live ping naar de embeddingprovider wil. Dreaming-bewuste clients kunnen ook `{ "agentId": "agent-id" }` doorgeven om statistieken van de Dreaming-store te beperken tot een geselecteerde agentwerkruimte; als `agentId` wordt weggelaten, blijft de fallback naar de standaardagent behouden en worden geconfigureerde Dreaming-werkruimten geaggregeerd.
    - `doctor.memory.dreamDiary`, `doctor.memory.backfillDreamDiary`, `doctor.memory.resetDreamDiary`, `doctor.memory.resetGroundedShortTerm`, `doctor.memory.repairDreamingArtifacts` en `doctor.memory.dedupeDreamDiary` accepteren optionele parameters `{ "agentId": "agent-id" }` voor Dreaming-weergaven/acties van een geselecteerde agent. Wanneer `agentId` wordt weggelaten, werken ze op de geconfigureerde standaard-agentwerkruimte.
    - `doctor.memory.remHarness` retourneert een begrensde, alleen-lezen REM-harnesspreview voor externe control-plane-clients. Deze kan werkruimtepaden, geheugenfragmenten, gerenderde grounded markdown en kandidaten voor diepe promotie bevatten, dus callers hebben `operator.read` nodig.
    - `sessions.usage` retourneert gebruikssamenvattingen per sessie. Geef `agentId` door voor één
      agent, of `agentScope: "all"` om geconfigureerde agents samen te tonen.
    - `sessions.usage.timeseries` retourneert tijdreeksgebruik voor één sessie.
    - `sessions.usage.logs` retourneert gebruikslogitems voor één sessie.

  </Accordion>

  <Accordion title="Kanalen en loginhelpers">
    - `channels.status` retourneert statusoverzichten voor ingebouwde + gebundelde kanalen/Plugins.
    - `channels.logout` logt een specifiek kanaal/account uit wanneer het kanaal uitloggen ondersteunt.
    - `web.login.start` start een QR-/webloginflow voor de huidige webkanaalprovider die QR ondersteunt.
    - `web.login.wait` wacht tot die QR-/webloginflow is voltooid en start het kanaal bij succes.
    - `push.test` verstuurt een test-APNs-push naar een geregistreerde iOS-node.
    - `voicewake.get` retourneert de opgeslagen wake-word-triggers.
    - `voicewake.set` werkt wake-word-triggers bij en zendt de wijziging uit.

  </Accordion>

  <Accordion title="Berichten en logs">
    - `send` is de directe RPC voor uitgaande aflevering voor kanaal-/account-/threadgerichte verzendingen buiten de chatrunner.
    - `logs.tail` retourneert de geconfigureerde Gateway-bestandslogtail met cursor-/limiet- en max-byte-instellingen.

  </Accordion>

  <Accordion title="Talk en TTS">
    - `talk.catalog` retourneert de alleen-lezen Talk-providercatalogus voor spraak, streamingtranscriptie en realtime spraak. Deze bevat canonieke provider-id's, registry-aliassen, labels, geconfigureerde status, een optioneel `ready`-resultaat op groepsniveau, blootgestelde model-/spraak-id's, canonieke modi, transports, brain-strategieën en realtime audio-/capability-vlaggen zonder providergeheimen te retourneren of globale config te wijzigen. Huidige Gateways zetten `ready` nadat runtimeproviderselectie is toegepast; clients moeten afwezigheid ervan behandelen als niet-geverifieerd voor compatibiliteit met oudere Gateways.
    - `talk.config` retourneert de effectieve Talk-configpayload; `includeSecrets` vereist `operator.talk.secrets` (of `operator.admin`).
    - `talk.session.create` maakt een Talk-sessie die eigendom is van de Gateway voor `realtime/gateway-relay`, `transcription/gateway-relay` of `stt-tts/managed-room`. Voor `stt-tts/managed-room` moeten callers met `operator.write` die `sessionKey` doorgeven ook `spawnedBy` doorgeven voor zichtbaarheid van sessiesleutels binnen het bereik; het maken van een `sessionKey` zonder bereik en `brain: "direct-tools"` vereisen `operator.admin`.
    - `talk.session.join` valideert een managed-room-sessietoken, emit `session.ready`- of `session.replaced`-gebeurtenissen waar nodig, en retourneert room-/sessiemetadata plus recente Talk-gebeurtenissen zonder het plaintext-token of de opgeslagen tokenhash.
    - `talk.session.appendAudio` voegt base64 PCM-invoeraudio toe aan realtime relay- en transcriptiesessies die eigendom zijn van de Gateway.
    - `talk.session.startTurn`, `talk.session.endTurn` en `talk.session.cancelTurn` sturen de turn-levenscyclus van managed-room aan met afwijzing van verouderde turns voordat de status wordt gewist.
    - `talk.session.cancelOutput` stopt audio-uitvoer van de assistant, primair voor VAD-gated barge-in in Gateway-relaysessies.
    - `talk.session.submitToolResult` voltooit een provider-toolcall die is geëmit door een realtime relaysessie die eigendom is van de Gateway. Geef `options: { willContinue: true }` door voor tussentijdse tooluitvoer wanneer er nog een definitief resultaat volgt, of `options: { suppressResponse: true }` wanneer het toolresultaat de providercall moet afhandelen zonder nog een realtime assistant-response te starten.
    - `talk.session.steer` stuurt actieve-run-spraakbesturing naar een agent-ondersteunde Talk-sessie die eigendom is van de Gateway. Deze accepteert `{ sessionId, text, mode? }`, waarbij `mode` `status`, `steer`, `cancel` of `followup` is; een weggelaten modus wordt geclassificeerd op basis van de gesproken tekst.
    - `talk.session.close` sluit een relay-, transcriptie- of managed-room-sessie die eigendom is van de Gateway en emit terminale Talk-gebeurtenissen.
    - `talk.mode` stelt de huidige Talk-modusstatus in voor WebChat-/Control UI-clients en zendt deze uit.
    - `talk.client.create` maakt een realtime providersessie die eigendom is van de client met `webrtc` of `provider-websocket`, terwijl de Gateway eigenaar blijft van config, credentials, instructies en toolbeleid.
    - `talk.client.toolCall` laat realtime transports die eigendom zijn van clients provider-toolcalls doorsturen naar Gateway-beleid. De eerste ondersteunde tool is `openclaw_agent_consult`; clients ontvangen een run-id en wachten op normale chatlevenscyclusgebeurtenissen voordat ze het provider-specifieke toolresultaat indienen.
    - `talk.client.steer` verstuurt actieve-run-spraakbesturing voor realtime transports die eigendom zijn van clients. De Gateway herleidt de actieve embedded run uit `sessionKey` en retourneert een gestructureerd geaccepteerd/afgewezen resultaat in plaats van sturing stilzwijgend te laten vallen.
    - `talk.event` is het enkele Talk-gebeurteniskanaal voor realtime, transcriptie, STT/TTS, managed-room, telefonie en meetingadapters.
    - `talk.speak` synthetiseert spraak via de actieve Talk-spraakprovider.
    - `tts.status` retourneert de ingeschakelde TTS-status, actieve provider, fallbackproviders en providerconfigstatus.
    - `tts.providers` retourneert de zichtbare TTS-providerinventaris.
    - `tts.enable` en `tts.disable` schakelen de TTS-voorkeursstatus in of uit.
    - `tts.setProvider` werkt de voorkeurs-TTS-provider bij.
    - `tts.convert` voert een eenmalige tekst-naar-spraakconversie uit.

  </Accordion>

  <Accordion title="Geheimen, config, update en wizard">
    - `secrets.reload` lost actieve SecretRefs opnieuw op en wisselt runtimegeheimstatus alleen bij volledig succes.
    - `secrets.resolve` lost geheime toewijzingen voor commandotargets op voor een specifieke commando-/targetset.
    - `config.get` retourneert de huidige configsnapshot en hash.
    - `config.set` schrijft een gevalideerde configpayload.
    - `config.patch` voegt een gedeeltelijke configupdate samen. Destructieve array-
      vervanging vereist het betrokken pad in `replacePaths`; geneste arrays
      onder array-items gebruiken `[]`-paden zoals `agents.list[].skills`.
    - `config.apply` valideert + vervangt de volledige configpayload.
    - `config.schema` retourneert de live configschemapayload die wordt gebruikt door Control UI en CLI-tooling: schema, `uiHints`, versie en generatiemetadata, inclusief Plugin- + kanaalschemametadata wanneer de runtime deze kan laden. Het schema bevat veldmetadata `title` / `description` die is afgeleid van dezelfde labels en helptekst die door de UI worden gebruikt, inclusief geneste object-, wildcard-, array-item- en `anyOf` / `oneOf` / `allOf`-compositietakken wanneer overeenkomende velddocumentatie bestaat.
    - `config.schema.lookup` retourneert een padgerichte lookup-payload voor één configpad: genormaliseerd pad, een oppervlakkig schemaknooppunt, overeenkomende hint + `hintPath`, optionele `reloadKind` en directe child-samenvattingen voor UI-/CLI-drilldown. `reloadKind` is een van `restart`, `hot` of `none` en weerspiegelt de Gateway-configherlaadplanner voor het gevraagde pad. Lookup-schemaknooppunten behouden de gebruikersgerichte docs en algemene validatievelden (`title`, `description`, `type`, `enum`, `const`, `format`, `pattern`, numerieke/string-/array-/objectgrenzen en vlaggen zoals `additionalProperties`, `deprecated`, `readOnly`, `writeOnly`). Child-samenvattingen tonen `key`, genormaliseerd `path`, `type`, `required`, `hasChildren`, optionele `reloadKind`, plus de overeenkomende `hint` / `hintPath`.
    - `update.run` voert de Gateway-updateflow uit en plant alleen een herstart wanneer de update zelf is geslaagd; callers met een sessie kunnen `continuationMessage` opnemen zodat startup één vervolgturn van de agent hervat via de herstart-continuation-wachtrij. Package-manager-updates en supervised git-checkout-updates vanuit de control plane gebruiken een losgekoppelde managed-service-handoff in plaats van de package tree te vervangen of checkout-/builduitvoer binnen de live Gateway te wijzigen. Een gestarte handoff retourneert `ok: true` met `result.reason: "managed-service-handoff-started"` en `handoff.status: "started"`; niet-beschikbare of mislukte handoffs retourneren `ok: false` met `managed-service-handoff-unavailable` of `managed-service-handoff-failed`, plus `handoff.command` wanneer een handmatige shell-update vereist is. Een niet-beschikbare handoff betekent dat OpenClaw geen veilige supervisorgrens of duurzame service-identiteit heeft, zoals `OPENCLAW_SYSTEMD_UNIT` voor systemd. Tijdens een gestarte handoff kan de herstartsentinel kort `stats.reason: "restart-health-pending"` rapporteren; de continuation wordt uitgesteld totdat de CLI de herstarte Gateway verifieert en de definitieve `ok`-sentinel schrijft.
    - `update.status` ververst en retourneert de nieuwste update-herstartsentinel, inclusief de draaiende versie na de herstart wanneer beschikbaar.
    - `wizard.start`, `wizard.next`, `wizard.status` en `wizard.cancel` stellen de onboardingwizard beschikbaar via WS RPC.

  </Accordion>

  <Accordion title="Agent- en werkruimtehelpers">
    - `agents.list` retourneert geconfigureerde agentvermeldingen, inclusief effectief model en runtimemetadata.
    - `agents.create`, `agents.update` en `agents.delete` beheren agentrecords en werkruimtekoppeling.
    - `agents.files.list`, `agents.files.get` en `agents.files.set` beheren de bootstrap-werkruimtebestanden die voor een agent beschikbaar worden gemaakt.
    - `tasks.list`, `tasks.get` en `tasks.cancel` stellen het Gateway-taakregister beschikbaar aan SDK- en operatorclients.
    - `artifacts.list`, `artifacts.get` en `artifacts.download` stellen uit transcripties afgeleide artifactsamenvattingen en downloads beschikbaar voor een expliciet bereik van `sessionKey`, `runId` of `taskId`. Run- en taakquery's lossen de bijbehorende sessie aan serverzijde op en retourneren alleen transcriptiemedia met overeenkomende herkomst; onveilige of lokale URL-bronnen retourneren niet-ondersteunde downloads in plaats van ze aan serverzijde op te halen.
    - `environments.list` en `environments.status` stellen alleen-lezen Gateway-lokale en Node-omgevingsdetectie beschikbaar aan SDK-clients.
    - `agent.identity.get` retourneert de effectieve assistentidentiteit voor een agent of sessie.
    - `agent.wait` wacht tot een run is voltooid en retourneert de terminale snapshot wanneer beschikbaar.

  </Accordion>

  <Accordion title="Sessiebesturing">
    - `sessions.list` retourneert de huidige sessie-index, inclusief `agentRuntime`-metadata per rij wanneer een agent-runtimebackend is geconfigureerd.
    - `sessions.subscribe` en `sessions.unsubscribe` schakelen abonnementen op sessiewijzigingsgebeurtenissen in of uit voor de huidige WS-client.
    - `sessions.messages.subscribe` en `sessions.messages.unsubscribe` schakelen abonnementen op transcriptie-/berichtgebeurtenissen in of uit voor één sessie.
    - `sessions.preview` retourneert begrensde transcriptievoorbeelden voor specifieke sessiesleutels.
    - `sessions.describe` retourneert één Gateway-sessierij voor een exacte sessiesleutel.
    - `sessions.resolve` lost een sessiedoel op of canoniseert het.
    - `sessions.create` maakt een nieuwe sessievermelding.
    - `sessions.send` verzendt een bericht naar een bestaande sessie.
    - `sessions.steer` is de variant voor onderbreken-en-bijsturen voor een actieve sessie.
    - `sessions.abort` breekt actief werk voor een sessie af. Een aanroeper kan `key` plus optioneel `runId` doorgeven, of alleen `runId` doorgeven voor actieve runs die de Gateway naar een sessie kan herleiden.
    - `sessions.patch` werkt sessiemetadata/-overrides bij en rapporteert het opgeloste canonieke model plus de effectieve `agentRuntime`.
    - `sessions.reset`, `sessions.delete` en `sessions.compact` voeren sessieonderhoud uit.
    - `sessions.get` retourneert de volledige opgeslagen sessierij.
    - Chatuitvoering gebruikt nog steeds `chat.history`, `chat.send`, `chat.abort` en `chat.inject`. `chat.history` is weergavegenormaliseerd voor UI-clients: inline richtlijntags worden uit zichtbare tekst verwijderd, plattetekst-XML-payloads voor tool-calls (inclusief `<tool_call>...</tool_call>`, `<function_call>...</function_call>`, `<tool_calls>...</tool_calls>`, `<function_calls>...</function_calls>` en afgekorte tool-callblokken) en gelekte ASCII-/full-width-modelbesturingstokens worden verwijderd, zuivere stille-tokenassistentrijen zoals exact `NO_REPLY` / `no_reply` worden weggelaten, en te grote rijen kunnen worden vervangen door placeholders.
    - `chat.message.get` is de additieve begrensde lezer voor volledige berichten voor één zichtbare transcriptievermelding. Clients geven `sessionKey`, optioneel `agentId` wanneer de sessieselectie agent-scoped is, plus een transcriptie-`messageId` dat eerder via `chat.history` is getoond door, en de Gateway retourneert dezelfde weergavegenormaliseerde projectie zonder de lichte afkaplimiet van de geschiedenis wanneer de opgeslagen vermelding nog beschikbaar is en niet te groot is.
    - `chat.send` accepteert voor één beurt `fastMode: "auto"` om snelle modus te gebruiken voor modelaanroepen die vóór de automatische afkapgrens zijn gestart, en daarna latere retry-, fallback-, tool-resultaat- of vervolgaanroepen zonder snelle modus te starten. De afkapgrens is standaard 60 seconden en kan per model worden geconfigureerd met `agents.defaults.models["<provider>/<model>"].params.fastAutoOnSeconds`. Een `chat.send`-aanroeper kan voor één beurt `fastAutoOnSeconds` doorgeven om de afkapgrens voor die aanvraag te overschrijven.

  </Accordion>

  <Accordion title="Apparaatkoppeling en apparaattokens">
    - `device.pair.list` retourneert wachtende en goedgekeurde gekoppelde apparaten.
    - `device.pair.setupCode` maakt een mobiele setupcode en standaard een PNG-QR-data-URL. Dit vereist `operator.admin` en wordt bewust weggelaten uit geadverteerde detectie. Het resultaat bevat `setupCode`, optioneel `qrDataUrl`, `gatewayUrl`, het niet-geheime `auth`-label en `urlSource`.
    - `device.pair.approve`, `device.pair.reject` en `device.pair.remove` beheren records voor apparaatkoppeling.
    - `device.token.rotate` roteert een gekoppeld apparaattoken binnen de grenzen van de goedgekeurde rol en het aanroepersbereik.
    - `device.token.revoke` trekt een gekoppeld apparaattoken in binnen de grenzen van de goedgekeurde rol en het aanroepersbereik.

    De setupcode bevat een kortlevende bootstrapreferentie. Clients mogen deze niet
    loggen of bewaren buiten de koppelingsflow.

  </Accordion>

  <Accordion title="Node-koppeling, aanroepen en wachtend werk">
    - `node.pair.request`, `node.pair.list`, `node.pair.approve`, `node.pair.reject`, `node.pair.remove` en `node.pair.verify` dekken Node-koppeling en bootstrapverificatie.
    - `node.list` en `node.describe` retourneren bekende/verbonden Node-status.
    - `node.rename` werkt een gekoppeld Node-label bij.
    - `node.invoke` stuurt een opdracht door naar een verbonden Node.
    - `node.invoke.result` retourneert het resultaat voor een aanroepaanvraag.
    - `node.event` draagt door Nodes afkomstige gebeurtenissen terug naar de gateway.
    - `node.pending.pull` en `node.pending.ack` zijn de wachtrij-API's voor verbonden Nodes.
    - `node.pending.enqueue` en `node.pending.drain` beheren duurzaam wachtend werk voor offline/losgekoppelde Nodes.

  </Accordion>

  <Accordion title="Goedkeuringsfamilies">
    - `exec.approval.request`, `exec.approval.get`, `exec.approval.list` en `exec.approval.resolve` dekken eenmalige exec-goedkeuringsaanvragen plus opzoeken/herhalen van wachtende goedkeuringen.
    - `exec.approval.waitDecision` wacht op één wachtende exec-goedkeuring en retourneert de definitieve beslissing (of `null` bij time-out).
    - `exec.approvals.get` en `exec.approvals.set` beheren snapshots van het Gateway-beleid voor exec-goedkeuring.
    - `exec.approvals.node.get` en `exec.approvals.node.set` beheren Node-lokaal beleid voor exec-goedkeuring via Node-relayopdrachten.
    - `plugin.approval.request`, `plugin.approval.list`, `plugin.approval.waitDecision` en `plugin.approval.resolve` dekken door plugins gedefinieerde goedkeuringsflows.

  </Accordion>

  <Accordion title="Automatisering, Skills en tools">
    - Automatisering: `wake` plant een onmiddellijke of volgende-Heartbeat wake-tekstinjectie; `cron.get`, `cron.list`, `cron.status`, `cron.add`, `cron.update`, `cron.remove`, `cron.run`, `cron.runs` beheren gepland werk.
    - `cron.run` blijft een enqueue-achtige RPC voor handmatige runs. Clients die voltooiingssemantiek nodig hebben, moeten de geretourneerde `runId` lezen en `cron.runs` pollen.
    - `cron.runs` accepteert een optioneel niet-leeg `runId`-filter, zodat clients één in de wachtrij geplaatste handmatige run kunnen volgen zonder te racen met andere geschiedenisvermeldingen voor dezelfde taak.
    - Skills en tools: `commands.list`, `skills.*`, `tools.catalog`, `tools.effective`, `tools.invoke`.

  </Accordion>
</AccordionGroup>

### Veelvoorkomende gebeurtenisfamilies

- `chat`: UI-chatupdates zoals `chat.inject` en andere uitsluitend-transcriptiechat-
  gebeurtenissen. In protocol v4 dragen deltapayloads `deltaText`; `message` blijft
  de cumulatieve assistentsnapshot. Niet-prefixvervangingen zetten `replace=true`
  en gebruiken `deltaText` als vervangende tekst.
- `session.message`, `session.operation` en `session.tool`: transcriptie,
  lopende sessiebewerking en event-streamupdates voor een geabonneerde
  sessie.
- `sessions.changed`: sessie-index of metadata gewijzigd.
- `presence`: updates van systeempresentiesnapshots.
- `tick`: periodieke keepalive-/livenessgebeurtenis.
- `health`: update van gateway-gezondheidssnapshot.
- `heartbeat`: update van Heartbeat-gebeurtenisstroom.
- `cron`: wijzigingsgebeurtenis voor Cron-run/taak.
- `shutdown`: gateway-afsluitmelding.
- `node.pair.requested` / `node.pair.resolved`: levenscyclus van Node-koppeling.
- `node.invoke.request`: broadcast van Node-aanroepaanvraag.
- `device.pair.requested` / `device.pair.resolved`: levenscyclus van gekoppeld apparaat.
- `voicewake.changed`: wake-word-triggerconfiguratie gewijzigd.
- `exec.approval.requested` / `exec.approval.resolved`: levenscyclus van exec-goedkeuring.
- `plugin.approval.requested` / `plugin.approval.resolved`: levenscyclus van plugin-goedkeuring.

### Node-helpermethoden

- Nodes kunnen `skills.bins` aanroepen om de huidige lijst met uitvoerbare Skill-bestanden
  op te halen voor auto-allow-controles.

### RPC's voor taakregister

Operatorclients kunnen Gateway-achtergrondtaakrecords inspecteren en annuleren via
de RPC's voor het taakregister. Deze methoden retourneren opgeschoonde taaksamenvattingen, geen ruwe
runtimestatus.

- `tasks.list` vereist `operator.read`.
  - Params: optioneel `status` (`"queued"`, `"running"`, `"completed"`,
    `"failed"`, `"cancelled"` of `"timed_out"`) of een array van die statussen,
    optioneel `agentId`, optioneel `sessionKey`, optioneel `limit` van `1` tot
    `500`, en optionele string `cursor`.
  - Resultaat: `{ "tasks": TaskSummary[], "nextCursor"?: string }`.
- `tasks.get` vereist `operator.read`.
  - Params: `{ "taskId": string }`.
  - Resultaat: `{ "task": TaskSummary }`.
  - Ontbrekende taak-id's retourneren de Gateway-foutvorm voor niet gevonden.
- `tasks.cancel` vereist `operator.write`.
  - Params: `{ "taskId": string, "reason"?: string }`.
  - Resultaat:
    `{ "found": boolean, "cancelled": boolean, "reason"?: string, "task"?: TaskSummary }`.
  - `found` rapporteert of het register een overeenkomende taak had. `cancelled`
    rapporteert of de runtime annulering heeft geaccepteerd of vastgelegd.

`TaskSummary` bevat `id`, `status` en optionele metadata zoals `kind`,
`runtime`, `title`, `agentId`, `sessionKey`, `childSessionKey`, `ownerKey`,
`runId`, `taskId`, `flowId`, `parentTaskId`, `sourceId`, tijdstempels, voortgang,
terminale samenvatting en opgeschoonde fouttekst. `agentId` identificeert de agent
die de taak uitvoert; `sessionKey` en `ownerKey` behouden aanvrager- en besturings-
context.

### Operator-helpermethoden

- Operators kunnen `commands.list` (`operator.read`) aanroepen om de runtime
  opdrachteninventaris voor een agent op te halen.
  - `agentId` is optioneel; laat dit weg om de standaard agentwerkruimte te lezen.
  - `scope` bepaalt welk oppervlak de primaire `name` aanstuurt:
    - `text` retourneert het primaire tekstopdrachttoken zonder de voorafgaande `/`
    - `native` en het standaardpad `both` retourneren providerbewuste native namen
      wanneer beschikbaar
  - `textAliases` bevat exacte slash-aliassen zoals `/model` en `/m`.
  - `nativeName` bevat de providerbewuste native opdrachtnaam wanneer die bestaat.
  - `provider` is optioneel en beïnvloedt alleen native naamgeving plus
    beschikbaarheid van native Plugin-opdrachten.
  - `includeArgs=false` laat geserialiseerde argumentmetadata weg uit de respons.
- Operators kunnen `tools.catalog` (`operator.read`) aanroepen om de runtime-toolcatalogus voor een
  agent op te halen. De respons bevat gegroepeerde tools en herkomstmetadata:
  - `source`: `core` of `plugin`
  - `pluginId`: Plugin-eigenaar wanneer `source="plugin"`
  - `optional`: of een Plugin-tool optioneel is
- Operators kunnen `tools.effective` (`operator.read`) aanroepen om de runtime-effectieve
  toolinventaris voor een sessie op te halen.
  - `sessionKey` is verplicht.
  - De Gateway leidt vertrouwde runtimecontext server-side af uit de sessie in plaats van
    door de aanroeper aangeleverde auth- of aflevercontext te accepteren.
  - De respons is een sessiegebonden, server-afgeleide projectie van de actieve inventaris,
    inclusief core-, Plugin-, kanaal- en al ontdekte MCP-servertools.
  - `tools.effective` is alleen-lezen voor MCP: het kan een warme MCP-catalogus van een sessie projecteren via het
    uiteindelijke toolbeleid, maar het maakt geen MCP-runtimes aan, verbindt geen transporten en geeft geen
    `tools/list` uit. Als er geen overeenkomende warme catalogus bestaat, kan de respons een melding bevatten zoals
    `mcp-not-yet-connected`, `mcp-not-yet-listed` of `mcp-stale-catalog`.
  - Effectieve toolvermeldingen gebruiken `source="core"`, `source="plugin"`, `source="channel"` of
    `source="mcp"`.
- Operators kunnen `tools.invoke` (`operator.write`) aanroepen om één beschikbare tool uit te voeren via hetzelfde
  Gateway-beleidspad als `/tools/invoke`.
  - `name` is verplicht. `args`, `sessionKey`, `agentId`, `confirm` en
    `idempotencyKey` zijn optioneel.
  - Als zowel `sessionKey` als `agentId` aanwezig zijn, moet de opgeloste sessieagent overeenkomen met
    `agentId`.
  - Core-wrappers die alleen voor eigenaren zijn, zoals `cron`, `gateway` en `nodes`, vereisen
    eigenaar-/adminidentiteit (`operator.admin`), ook al is de methode
    `tools.invoke` zelf `operator.write`.
  - De respons is een SDK-gerichte envelope met `ok`, `toolName`, optioneel `output` en getypeerde
    `error`-velden. Goedkeurings- of beleidsweigeringen retourneren `ok:false` in de payload in plaats van
    de Gateway-toolbeleidspijplijn te omzeilen.
- Operators kunnen `skills.status` (`operator.read`) aanroepen om de zichtbare
  Skills-inventaris voor een agent op te halen.
  - `agentId` is optioneel; laat dit weg om de standaard agentwerkruimte te lezen.
  - De respons bevat geschiktheid, ontbrekende vereisten, configcontroles en
    opgeschoonde installatieopties zonder ruwe geheime waarden bloot te leggen.
- Operators kunnen `skills.search` en `skills.detail` (`operator.read`) aanroepen voor
  ClawHub-ontdekkingsmetadata.
- Operators kunnen `skills.upload.begin`, `skills.upload.chunk` en
  `skills.upload.commit` (`operator.admin`) aanroepen om een privé-Skill-archief te stagen
  voordat het wordt geïnstalleerd. Dit is een afzonderlijk admin-uploadpad voor vertrouwde clients,
  niet de normale ClawHub-Skill-installatiestroom, en is standaard uitgeschakeld tenzij
  `skills.install.allowUploadedArchives` is ingeschakeld.
  - `skills.upload.begin({ kind: "skill-archive", slug, sizeBytes, sha256?, force?, idempotencyKey? })`
    maakt een upload aan die aan die slug en force-waarde is gekoppeld.
  - `skills.upload.chunk({ uploadId, offset, dataBase64 })` voegt bytes toe op
    de exacte gedecodeerde offset.
  - `skills.upload.commit({ uploadId, sha256? })` verifieert de uiteindelijke grootte en
    SHA-256. Commit rondt alleen de upload af; het installeert de Skill niet.
  - Geüploade Skill-archieven zijn ziparchieven met een `SKILL.md`-root. De
    interne mapnaam van het archief selecteert nooit het installatiedoel.
- Operators kunnen `skills.install` (`operator.admin`) in drie modi aanroepen:
  - ClawHub-modus: `{ source: "clawhub", slug, version?, force? }` installeert een
    Skill-map in de standaard `skills/`-directory van de agentwerkruimte.
  - Uploadmodus: `{ source: "upload", uploadId, slug, force?, sha256?, timeoutMs? }`
    installeert een gecommitte upload in de directory `skills/<slug>` van de
    standaard agentwerkruimte. De slug en force-waarde moeten overeenkomen met de oorspronkelijke
    `skills.upload.begin`-aanvraag. Deze modus wordt geweigerd tenzij
    `skills.install.allowUploadedArchives` is ingeschakeld. De instelling heeft geen
    invloed op ClawHub-installaties.
  - Gateway-installatiemodus: `{ name, installId, timeoutMs? }`
    voert een gedeclareerde `metadata.openclaw.install`-actie uit op de Gateway-host.
    Oudere clients kunnen nog steeds `dangerouslyForceUnsafeInstall` sturen; dit veld is
    verouderd, wordt alleen geaccepteerd voor protocolcompatibiliteit en wordt genegeerd. Gebruik
    `security.installPolicy` voor installatiebeslissingen die door de operator worden beheerd.
- Operators kunnen `skills.update` (`operator.admin`) in twee modi aanroepen:
  - ClawHub-modus werkt één gevolgde slug bij of alle gevolgde ClawHub-installaties in
    de standaard agentwerkruimte.
  - Configmodus patcht waarden van `skills.entries.<skillKey>`, zoals `enabled`,
    `apiKey` en `env`.

### `models.list`-weergaven

`models.list` accepteert een optionele parameter `view`:

- Weggelaten of `"default"`: huidig runtimegedrag. Als `agents.defaults.models` is geconfigureerd, is de respons de toegestane catalogus, inclusief dynamisch ontdekte modellen voor `provider/*`-vermeldingen. Anders is de respons de volledige Gateway-catalogus.
- `"configured"`: gedrag met picker-grootte. Als `agents.defaults.models` is geconfigureerd, heeft dat nog steeds voorrang, inclusief providergebonden ontdekking voor `provider/*`-vermeldingen. Zonder allowlist gebruikt de respons expliciete `models.providers.*.models`-vermeldingen, met terugval naar de volledige catalogus alleen wanneer er geen geconfigureerde modelrijen bestaan.
- `"all"`: volledige Gateway-catalogus, waarbij `agents.defaults.models` wordt omzeild. Gebruik dit voor diagnostiek en ontdekkings-UI's, niet voor normale modelpickers.

## Exec-goedkeuringen

- Wanneer een exec-aanvraag goedkeuring nodig heeft, broadcast de Gateway `exec.approval.requested`.
- Operatorclients lossen dit op door `exec.approval.resolve` aan te roepen (vereist scope `operator.approvals`).
- Voor `host=node` moet `exec.approval.request` `systemRunPlan` bevatten (canonieke `argv`/`cwd`/`rawCommand`/sessiemetadata). Aanvragen zonder `systemRunPlan` worden geweigerd.
- Na goedkeuring gebruiken doorgestuurde `node.invoke system.run`-aanroepen dat canonieke
  `systemRunPlan` opnieuw als de gezaghebbende opdracht-/cwd-/sessiecontext.
- Als een aanroeper `command`, `rawCommand`, `cwd`, `agentId` of
  `sessionKey` wijzigt tussen voorbereiding en de uiteindelijke goedgekeurde `system.run`-doorsturing, weigert de
  Gateway de run in plaats van de gewijzigde payload te vertrouwen.

## Fallback voor agentaflevering

- `agent`-aanvragen kunnen `deliver=true` bevatten om uitgaande aflevering aan te vragen.
- `bestEffortDeliver=false` behoudt strikt gedrag: onopgeloste of alleen-interne afleverdoelen retourneren `INVALID_REQUEST`.
- `bestEffortDeliver=true` staat fallback naar uitvoering alleen binnen de sessie toe wanneer geen extern afleverbare route kan worden opgelost (bijvoorbeeld interne/webchat-sessies of dubbelzinnige multi-channel-configuraties).
- Uiteindelijke `agent`-resultaten kunnen `result.deliveryStatus` bevatten wanneer aflevering is
  aangevraagd, met dezelfde statussen `sent`, `suppressed`, `partial_failed` en `failed`
  die zijn gedocumenteerd voor [`openclaw agent --json --deliver`](/nl/cli/agent#json-delivery-status).

## Versiebeheer

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
| Aanvraag-time-out (per RPC)               | `30_000` ms                                           | `src/gateway/client.ts` (`requestTimeoutMs`)                                               |
| Preauth-/connect-challenge-time-out       | `15_000` ms                                           | `src/gateway/handshake-timeouts.ts` (config/env kan het gekoppelde server-/clientbudget verhogen) |
| Initiële reconnect-backoff                | `1_000` ms                                            | `src/gateway/client.ts` (`backoffMs`)                                                      |
| Maximale reconnect-backoff                | `30_000` ms                                           | `src/gateway/client.ts` (`scheduleReconnect`)                                              |
| Fast-retry-klem na device-token-close     | `250` ms                                              | `src/gateway/client.ts`                                                                    |
| Graceperiode voor force-stop vóór `terminate()` | `250` ms                                         | `FORCE_STOP_TERMINATE_GRACE_MS`                                                            |
| Standaard-time-out voor `stopAndWait()`   | `1_000` ms                                            | `STOP_AND_WAIT_TIMEOUT_MS`                                                                 |
| Standaard tick-interval (vóór `hello-ok`) | `30_000` ms                                           | `src/gateway/client.ts`                                                                    |
| Sluiting bij tick-time-out                | code `4000` wanneer stilte langer is dan `tickIntervalMs * 2` | `src/gateway/client.ts`                                                             |
| `MAX_PAYLOAD_BYTES`                       | `25 * 1024 * 1024` (25 MB)                            | `src/gateway/server-constants.ts`                                                          |

De server adverteert de effectieve waarden `policy.tickIntervalMs`, `policy.maxPayload`
en `policy.maxBufferedBytes` in `hello-ok`; clients moeten die waarden respecteren
in plaats van de standaardwaarden van vóór de handshake.

## Auth

- Gedeelde-geheim Gateway-authenticatie gebruikt `connect.params.auth.token` of
  `connect.params.auth.password`, afhankelijk van de geconfigureerde authenticatiemodus.
- Modi met identiteit, zoals Tailscale Serve
  (`gateway.auth.allowTailscale: true`) of niet-loopback
  `gateway.auth.mode: "trusted-proxy"` voldoen aan de connect-authenticatiecontrole via
  requestheaders in plaats van `connect.params.auth.*`.
- Private-ingress `gateway.auth.mode: "none"` slaat gedeelde-geheim connect-authenticatie
  volledig over; stel die modus niet bloot via publieke/niet-vertrouwde ingress.
- Na het koppelen geeft de Gateway een **apparaat-token** uit dat is beperkt tot de verbindingsrol
  + scopes. Het wordt geretourneerd in `hello-ok.auth.deviceToken` en moet door de client
  worden bewaard voor toekomstige verbindingen.
- Clients moeten de primaire `hello-ok.auth.deviceToken` bewaren na elke
  geslaagde verbinding.
- Opnieuw verbinden met dat **opgeslagen** apparaat-token moet ook de opgeslagen
  goedgekeurde scopeset voor dat token hergebruiken. Dit behoudt lees-/probe-/status-toegang
  die al was verleend en voorkomt dat reconnects stilzwijgend worden teruggebracht tot een
  smallere impliciete admin-only scope.
- Client-side samenstelling van connect-authenticatie (`selectConnectAuth` in
  `src/gateway/client.ts`):
  - `auth.password` is orthogonaal en wordt altijd doorgestuurd wanneer ingesteld.
  - `auth.token` wordt gevuld in prioriteitsvolgorde: eerst een expliciet gedeeld token,
    daarna een expliciete `deviceToken`, daarna een opgeslagen per-apparaat-token (gesleuteld op
    `deviceId` + `role`).
  - `auth.bootstrapToken` wordt alleen verzonden wanneer geen van bovenstaande een
    `auth.token` heeft opgeleverd. Een gedeeld token of een opgelost apparaat-token onderdrukt dit.
  - Automatische promotie van een opgeslagen apparaat-token bij de eenmalige
    `AUTH_TOKEN_MISMATCH`-retry is beperkt tot **vertrouwde endpoints**:
    loopback, of `wss://` met een vastgezette `tlsFingerprint`. Publieke `wss://`
    zonder pinning komt niet in aanmerking.
- Ingebouwde bootstrap met installatiecode retourneert het primaire node
  `hello-ok.auth.deviceToken` plus een begrensd operator-token in
  `hello-ok.auth.deviceTokens` voor vertrouwde mobiele overdracht. Het operator-token
  bevat `operator.talk.secrets` voor native leesacties van Talk-configuratie, maar
  sluit scopes voor koppelingsmutaties en `operator.admin` uit.
- Terwijl een niet-baseline bootstrap met installatiecode wacht op goedkeuring, bevatten
  `PAIRING_REQUIRED`-details `recommendedNextStep: "wait_then_retry"`, `retryable: true`,
  en `pauseReconnect: false`. Clients moeten met hetzelfde
  bootstrap-token blijven reconnecten totdat het verzoek is goedgekeurd of het token ongeldig wordt.
- Bewaar `hello-ok.auth.deviceTokens` alleen wanneer de verbinding bootstrap-authenticatie gebruikte
  via een vertrouwd transport zoals `wss://` of loopback/lokale koppeling.
- Als een client een **expliciete** `deviceToken` of expliciete `scopes` opgeeft, blijft die
  door de aanroeper gevraagde scopeset gezaghebbend; gecachte scopes worden alleen
  hergebruikt wanneer de client het opgeslagen per-apparaat-token hergebruikt.
- Apparaat-tokens kunnen worden geroteerd/ingetrokken via `device.token.rotate` en
  `device.token.revoke` (vereist de scope `operator.pairing`). Het roteren of
  intrekken van een node- of andere niet-operatorrol vereist ook `operator.admin`.
- `device.token.rotate` retourneert rotatiemetadata. Het echoot het vervangende
  bearer-token alleen voor same-device calls die al met dat apparaat-token zijn geauthenticeerd,
  zodat token-only clients hun vervanging kunnen bewaren voordat ze opnieuw verbinden.
  Gedeelde/admin-rotaties echoën het bearer-token niet.
- Tokenuitgifte, rotatie en intrekking blijven begrensd tot de goedgekeurde rollenset
  die in de koppelingsvermelding van dat apparaat is vastgelegd; tokenmutatie kan geen
  apparaatrol uitbreiden of targeten die nooit door koppelingsgoedkeuring is verleend.
- Voor token-sessies van gekoppelde apparaten is apparaatbeheer self-scoped tenzij de
  aanroeper ook `operator.admin` heeft: niet-admin aanroepers kunnen alleen het
  operator-token voor hun **eigen** apparaatvermelding beheren. Node- en ander
  niet-operator-tokenbeheer is admin-only, zelfs voor het eigen apparaat van de aanroeper.
- `device.token.rotate` en `device.token.revoke` controleren ook de doel-operator
  token-scopeset tegen de huidige sessiescopes van de aanroeper. Niet-admin aanroepers
  kunnen geen breder operator-token roteren of intrekken dan ze zelf al hebben.
- Authenticatiefouten bevatten `error.details.code` plus herstelhints:
  - `error.details.canRetryWithDeviceToken` (boolean)
  - `error.details.recommendedNextStep` (`retry_with_device_token`, `update_auth_configuration`, `update_auth_credentials`, `wait_then_retry`, `review_auth_configuration`)
- Clientgedrag voor `AUTH_TOKEN_MISMATCH`:
  - Vertrouwde clients mogen één begrensde retry proberen met een gecacht per-apparaat-token.
  - Als die retry mislukt, moeten clients automatische reconnect-lussen stoppen en guidance voor operatoractie tonen.
- `AUTH_SCOPE_MISMATCH` betekent dat het apparaat-token is herkend maar niet dekt
  wat voor de gevraagde rol/scopes nodig is. Clients moeten dit niet presenteren als een verkeerd token;
  vraag de operator om opnieuw te koppelen of het smallere/bredere scopecontract goed te keuren.

## Apparaatidentiteit + koppeling

- Nodes moeten een stabiele apparaatidentiteit (`device.id`) opnemen die is afgeleid van een
  keypair-vingerafdruk.
- Gateways geven tokens uit per apparaat + rol.
- Koppelingsgoedkeuringen zijn vereist voor nieuwe apparaat-ID's, tenzij lokale automatische goedkeuring
  is ingeschakeld.
- Automatische koppelingsgoedkeuring is gericht op directe local loopback-verbindingen.
- OpenClaw heeft ook een smal backend/container-local self-connect-pad voor
  vertrouwde helperflows met gedeeld geheim.
- Same-host tailnet- of LAN-verbindingen worden nog steeds als remote behandeld voor koppeling en
  vereisen goedkeuring.
- WS-clients nemen normaal gesproken `device`-identiteit op tijdens `connect` (operator +
  node). De enige operatoruitzonderingen zonder apparaat zijn expliciete vertrouwenspaden:
  - `gateway.controlUi.allowInsecureAuth=true` voor localhost-only onveilige HTTP-compatibiliteit.
  - geslaagde `gateway.auth.mode: "trusted-proxy"` operator Control UI-authenticatie.
  - `gateway.controlUi.dangerouslyDisableDeviceAuth=true` (break-glass, ernstige beveiligingsverlaging).
  - direct-loopback `gateway-client` backend-RPC's op het gereserveerde interne
    helperpad.
- Het weglaten van apparaatidentiteit heeft scopegevolgen. Wanneer een apparaatloze operatorverbinding
  via een expliciet vertrouwenspad wordt toegestaan, wist OpenClaw nog steeds
  zelfverklaarde scopes naar een lege set, tenzij dat pad een benoemde
  uitzondering voor scopebehoud heeft. Scope-gated methoden falen dan met
  `missing scope`.
- `gateway.controlUi.dangerouslyDisableDeviceAuth=true` is een Control UI
  break-glass-pad voor scopebehoud. Het kent geen scopes toe aan willekeurige
  aangepaste backend- of CLI-vormige WebSocket-clients.
- Het gereserveerde direct-loopback `gateway-client` backend-helperpad behoudt
  scopes alleen voor interne lokale control-plane RPC's; aangepaste backend-ID's krijgen
  deze uitzondering niet.
- Alle verbindingen moeten de door de server verstrekte `connect.challenge`-nonce ondertekenen.

### Diagnostiek voor apparaat-authenticatiemigratie

Voor legacy clients die nog pre-challenge ondertekeningsgedrag gebruiken, retourneert `connect` nu
`DEVICE_AUTH_*`-detailcodes onder `error.details.code` met een stabiele `error.details.reason`.

Veelvoorkomende migratiefouten:

| Bericht                     | details.code                     | details.reason           | Betekenis                                          |
| --------------------------- | -------------------------------- | ------------------------ | -------------------------------------------------- |
| `device nonce required`     | `DEVICE_AUTH_NONCE_REQUIRED`     | `device-nonce-missing`   | Client liet `device.nonce` weg (of stuurde leeg).  |
| `device nonce mismatch`     | `DEVICE_AUTH_NONCE_MISMATCH`     | `device-nonce-mismatch`  | Client ondertekende met een verouderde/verkeerde nonce. |
| `device signature invalid`  | `DEVICE_AUTH_SIGNATURE_INVALID`  | `device-signature`       | Ondertekeningspayload komt niet overeen met v2-payload. |
| `device signature expired`  | `DEVICE_AUTH_SIGNATURE_EXPIRED`  | `device-signature-stale` | Ondertekende tijdstempel valt buiten toegestane skew. |
| `device identity mismatch`  | `DEVICE_AUTH_DEVICE_ID_MISMATCH` | `device-id-mismatch`     | `device.id` komt niet overeen met vingerafdruk van publieke sleutel. |
| `device public key invalid` | `DEVICE_AUTH_PUBLIC_KEY_INVALID` | `device-public-key`      | Indeling/canonicalisatie van publieke sleutel mislukt. |

Migratiedoel:

- Wacht altijd op `connect.challenge`.
- Onderteken de v2-payload die de server-nonce bevat.
- Stuur dezelfde nonce in `connect.params.device.nonce`.
- De voorkeurs-ondertekeningspayload is `v3`, die `platform` en `deviceFamily`
  bindt naast de velden voor apparaat/client/rol/scopes/token/nonce.
- Legacy `v2`-handtekeningen blijven geaccepteerd voor compatibiliteit, maar metadata-pinning
  van gekoppelde apparaten blijft commandobeleid bij reconnects bepalen.

## TLS + pinning

- TLS wordt ondersteund voor WS-verbindingen.
- Clients kunnen optioneel de cert-vingerafdruk van de gateway pinnen (zie `gateway.tls`
  config plus `gateway.remote.tlsFingerprint` of CLI `--tls-fingerprint`).

## Scope

Dit protocol stelt de **volledige gateway-API** beschikbaar (status, kanalen, modellen, chat,
agent, sessies, nodes, goedkeuringen, enz.). Het exacte oppervlak wordt gedefinieerd door de
TypeBox-schema's in `packages/gateway-protocol/src/schema.ts`.

## Gerelateerd

- [Bridge-protocol](/nl/gateway/bridge-protocol)
- [Gateway-runbook](/nl/gateway)
