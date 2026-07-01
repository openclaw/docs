---
read_when:
    - Implementeren of bijwerken van Gateway WS-clients
    - Protocolmismatches of verbindingsfouten debuggen
    - Protocolschema/-modellen opnieuw genereren
summary: 'Gateway WebSocket-protocol: handshake, frames, versiebeheer'
title: Gateway-protocol
x-i18n:
    generated_at: "2026-07-01T08:16:23Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 2fbfc5db0169f7ac2eacdb882d2afe08c80d5b8d669b6a1cfb2ffd0edbf71d16
    source_path: gateway/protocol.md
    workflow: 16
---

Het Gateway WS-protocol is het **enige besturingsvlak + Node-transport** voor
OpenClaw. Alle clients (CLI, web-UI, macOS-app, iOS/Android-Nodes, headless
Nodes) verbinden via WebSocket en declareren hun **rol** + **scope** tijdens
de handshake.

## Transport

- WebSocket, tekstframes met JSON-payloads.
- Het eerste frame **moet** een `connect`-request zijn.
- Frames voor connectie zijn begrensd op 64 KiB. Na een geslaagde handshake
  moeten clients de limieten `hello-ok.policy.maxPayload` en
  `hello-ok.policy.maxBufferedBytes` volgen. Als diagnostiek is ingeschakeld,
  geven te grote inkomende frames en trage uitgaande buffers `payload.large`-events
  uit voordat de gateway het betreffende frame sluit of laat vallen. Deze events bewaren
  groottes, limieten, oppervlakken en veilige reden-codes. Ze bewaren niet de berichttekst,
  bijlage-inhoud, ruwe frame-body, tokens, cookies of geheime waarden.

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

Terwijl de Gateway nog bezig is startup-sidecars af te ronden, kan het `connect`-request
een opnieuw te proberen `UNAVAILABLE`-fout teruggeven met `details.reason` ingesteld op
`"startup-sidecars"` en `retryAfterMs`. Clients moeten die response opnieuw proberen
binnen hun totale verbindingsbudget in plaats van die te tonen als een terminale
handshake-fout.

`server`, `features`, `snapshot` en `policy` zijn allemaal vereist door het schema
(`packages/gateway-protocol/src/schema/frames.ts`). `auth` is ook vereist en rapporteert
de onderhandelde rol/scopes. `pluginSurfaceUrls` is optioneel en koppelt namen van
Plugin-oppervlakken, zoals `canvas`, aan gescopete gehoste URL's.

Gescopete URL's voor Plugin-oppervlakken kunnen verlopen. Nodes kunnen
`node.pluginSurface.refresh` aanroepen met `{ "surface": "canvas" }` om een verse
entry in `pluginSurfaceUrls` te ontvangen. De experimentele Canvas Plugin-refactor ondersteunt niet
het verouderde compatibiliteitspad `canvasHostUrl`, `canvasCapability` of
`node.canvas.capability.refresh`; huidige native clients en gateways moeten Plugin-oppervlakken gebruiken.

Wanneer er geen apparaattoken wordt uitgegeven, rapporteert `hello-ok.auth` de onderhandelde
machtigingen zonder tokenvelden:

```json
{
  "auth": {
    "role": "operator",
    "scopes": ["operator.read", "operator.write"]
  }
}
```

Vertrouwde backend-clients in hetzelfde proces (`client.id: "gateway-client"`,
`client.mode: "backend"`) mogen `device` weglaten op directe local loopback-verbindingen wanneer
ze authenticeren met het gedeelde gateway-token/wachtwoord. Dit pad is gereserveerd
voor interne besturingsvlak-RPC's en voorkomt dat verouderde CLI/apparaat-koppelingsbaselines
lokaal backend-werk blokkeren, zoals updates van subagent-sessies. Externe clients,
clients met browser-origin, Node-clients en expliciete clients met apparaattoken/apparaatidentiteit
gebruiken nog steeds de normale koppelings- en scope-upgradecontroles.

Wanneer een apparaattoken wordt uitgegeven, bevat `hello-ok` ook:

```json
{
  "auth": {
    "deviceToken": "…",
    "role": "operator",
    "scopes": ["operator.read", "operator.write"]
  }
}
```

Ingebouwde QR/setup-code-bootstrap is een vers mobiel overdrachtspad. Een geslaagde
baseline setup-code-connect retourneert een primair Node-token plus één begrensd
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

De operator-overdracht is bewust begrensd zodat QR-onboarding de mobiele
operator-loop kan starten zonder `operator.admin` of `operator.pairing` toe te kennen.
Deze bevat wel `operator.talk.secrets`, zodat de native client de Talk-configuratie
kan lezen die nodig is na bootstrap. Bredere admin- en koppelingsscopes vereisen
een afzonderlijke goedgekeurde operator-koppeling of tokenflow. Clients moeten
`hello-ok.auth.deviceTokens` alleen bewaren
wanneer de connect bootstrap-auth gebruikte op vertrouwd transport zoals `wss://` of
loopback/lokale koppeling.

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

Methoden met neveneffecten vereisen **idempotentiesleutels** (zie schema).

## Rollen + scopes

Voor het volledige operator-scope-model, controles tijdens goedkeuring en
semantiek voor gedeelde geheimen, zie [Operator-scopes](/nl/gateway/operator-scopes).

### Rollen

- `operator` = client voor besturingsvlak (CLI/UI/automatisering).
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
Wanneer geheimen zijn opgenomen, moeten clients de actieve Talk-providercredential
lezen uit `talk.resolved.config.apiKey`; `talk.providers.<id>.apiKey`
blijft bronvormig en kan een SecretRef-object of een geredacteerde string zijn.

Door Plugins geregistreerde gateway-RPC-methoden kunnen hun eigen operator-scope aanvragen, maar
gereserveerde core-adminvoorvoegsels (`config.*`, `exec.approvals.*`, `wizard.*`,
`update.*`) worden altijd opgelost naar `operator.admin`.

Methodscope is alleen de eerste poort. Sommige slash-commands die via
`chat.send` worden bereikt, passen daarbovenop strengere controles op command-niveau toe.
Bijvoorbeeld: persistente writes met `/config set` en `/config unset` vereisen
`operator.admin`.

`node.pair.approve` heeft ook een extra scopecontrole tijdens goedkeuring boven op de
basismethodscope:

- requests zonder command: `operator.pairing`
- requests met niet-exec Node-commands: `operator.pairing` + `operator.write`
- requests die `system.run`, `system.run.prepare` of `system.which` bevatten:
  `operator.pairing` + `operator.admin`

### Caps/commands/permissions (Node)

Nodes declareren capability-claims tijdens connectie:

- `caps`: capability-categorieën op hoog niveau zoals `camera`, `canvas`, `screen`,
  `location`, `voice` en `talk`.
- `commands`: command-allowlist voor invoke.
- `permissions`: fijnmazige toggles (bijv. `screen.record`, `camera.capture`).

De Gateway behandelt deze als **claims** en handhaaft allowlists aan serverzijde.

## Aanwezigheid

- `system-presence` retourneert entries keyed op apparaatidentiteit.
- Aanwezigheidsentries bevatten `deviceId`, `roles` en `scopes`, zodat UI's één rij per apparaat kunnen tonen,
  zelfs wanneer het verbindt als zowel **operator** als **Node**.
- `node.list` bevat optionele velden `lastSeenAtMs` en `lastSeenReason`. Verbonden Nodes rapporteren
  hun huidige verbindingstijd als `lastSeenAtMs` met reden `connect`; gekoppelde Nodes kunnen ook
  duurzame achtergrondaanwezigheid rapporteren wanneer een vertrouwd Node-event hun koppelingsmetadata bijwerkt.

### Node-event voor achtergrond alive

Nodes kunnen `node.event` aanroepen met `event: "node.presence.alive"` om vast te leggen dat een gekoppelde Node
alive was tijdens een achtergrondwake zonder deze als verbonden te markeren.

```json
{
  "event": "node.presence.alive",
  "payloadJSON": "{\"trigger\":\"silent_push\",\"sentAtMs\":1737264000000,\"displayName\":\"Peter's iPhone\",\"version\":\"2026.4.28\",\"platform\":\"iOS 18.4.0\",\"deviceFamily\":\"iPhone\",\"modelIdentifier\":\"iPhone17,1\",\"pushTransport\":\"relay\"}"
}
```

`trigger` is een gesloten enum: `background`, `silent_push`, `bg_app_refresh`,
`significant_location`, `manual` of `connect`. Onbekende triggerstrings worden door de gateway
genormaliseerd naar `background` vóór persistentie. Het event is alleen duurzaam voor geauthenticeerde Node-
apparaatsessies; sessies zonder apparaat of ongekoppelde sessies retourneren `handled: false`.

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

Door de server gepushte WebSocket-broadcast-events zijn scope-gated, zodat sessies met alleen koppelingsscope of Node-only sessies niet passief sessie-inhoud ontvangen.

- **Chat-, agent- en toolresultaatframes** (inclusief gestreamde `agent`-events en resultaten van toolaanroepen) vereisen minimaal `operator.read`. Sessies zonder `operator.read` slaan deze frames volledig over.
- **Door Plugins gedefinieerde `plugin.*`-broadcasts** worden gated op `operator.write` of `operator.admin`, afhankelijk van hoe de Plugin ze heeft geregistreerd.
- **Status- en transportevents** (`heartbeat`, `presence`, `tick`, connect/disconnect-levenscyclus, enz.) blijven onbeperkt, zodat transportgezondheid zichtbaar blijft voor elke geauthenticeerde sessie.
- **Onbekende broadcast-eventfamilies** worden standaard scope-gated (fail-closed), tenzij een geregistreerde handler ze expliciet versoepelt.

Elke clientverbinding houdt zijn eigen sequence number per client bij, zodat broadcasts monotone ordening op die socket behouden, zelfs wanneer verschillende clients verschillende scope-gefilterde subsets van de eventstream zien.

## Veelgebruikte RPC-methodfamilies

Het publieke WS-oppervlak is breder dan de handshake/auth-voorbeelden hierboven. Dit
is geen gegenereerde dump — `hello-ok.features.methods` is een conservatieve
discoverylijst die is opgebouwd uit `src/gateway/server-methods-list.ts` plus geladen
Plugin-/kanaalmethode-exports. Behandel deze als feature discovery, niet als volledige
opsomming van `src/gateway/server-methods/*.ts`.

  <AccordionGroup>
  <Accordion title="System and identity">
    - `health` retourneert de gecachte of vers gepeilde gateway-gezondheidssnapshot.
    - `diagnostics.stability` retourneert de recente begrensde recorder voor diagnostische stabiliteit. Deze bewaart operationele metadata zoals gebeurtenisnamen, aantallen, bytegroottes, geheugenuitlezingen, wachtrij-/sessiestatus, kanaal-/Pluginnamen en sessie-id's. Deze bewaart geen chattekst, Webhook-bodies, tooluitvoer, ruwe request- of response-bodies, tokens, cookies of geheime waarden. Operator-leesbereik is vereist.
    - `status` retourneert de gateway-samenvatting in `/status`-stijl; gevoelige velden worden alleen opgenomen voor operatorclients met admin-bereik.
    - `gateway.identity.get` retourneert de Gateway-apparaatidentiteit die wordt gebruikt door relay- en koppelingsflows.
    - `system-presence` retourneert de huidige aanwezigheidssnapshot voor verbonden operator-/Node-apparaten.
    - `system-event` voegt een systeemgebeurtenis toe en kan aanwezigheidscontext bijwerken/uitzenden.
    - `last-heartbeat` retourneert de laatst vastgelegde Heartbeat-gebeurtenis.
    - `set-heartbeats` schakelt Heartbeat-verwerking op de Gateway in of uit.

  </Accordion>

  <Accordion title="Models and usage">
    - `models.list` retourneert de modelcatalogus die door de runtime is toegestaan. Geef `{ "view": "configured" }` door voor picker-grote geconfigureerde modellen (`agents.defaults.models` eerst, daarna `models.providers.*.models`), of `{ "view": "all" }` voor de volledige catalogus.
    - `usage.status` retourneert gebruiksvensters/resterende quotasamenvattingen per provider.
    - `usage.cost` retourneert geaggregeerde kosten-/gebruikssamenvattingen voor een datumbereik.
      Geef `agentId` door voor één agent, of `agentScope: "all"` om geconfigureerde agents te aggregeren.
    - `doctor.memory.status` retourneert vectorgeheugen-/gecachete embedding-gereedheid voor de actieve standaard-agentwerkruimte. Geef `{ "probe": true }` of `{ "deep": true }` alleen door wanneer de caller expliciet een live ping naar de embeddingprovider wil. Dreaming-bewuste clients kunnen ook `{ "agentId": "agent-id" }` doorgeven om Dreaming-storestatistieken te beperken tot een geselecteerde agentwerkruimte; als `agentId` wordt weggelaten, blijft de fallback naar de standaardagent behouden en worden geconfigureerde Dreaming-werkruimten geaggregeerd.
    - `doctor.memory.dreamDiary`, `doctor.memory.backfillDreamDiary`, `doctor.memory.resetDreamDiary`, `doctor.memory.resetGroundedShortTerm`, `doctor.memory.repairDreamingArtifacts` en `doctor.memory.dedupeDreamDiary` accepteren optionele `{ "agentId": "agent-id" }`-parameters voor Dreaming-weergaven/acties van geselecteerde agents. Wanneer `agentId` wordt weggelaten, werken ze op de geconfigureerde standaard-agentwerkruimte.
    - `doctor.memory.remHarness` retourneert een begrensde, alleen-lezen REM-harnesspreview voor externe control-plane-clients. Deze kan werkruimtepaden, geheugenfragmenten, gerenderde grounded markdown en diepe promotiekandidaten bevatten, dus callers hebben `operator.read` nodig.
    - `sessions.usage` retourneert gebruikssamenvattingen per sessie. Geef `agentId` door voor één
      agent, of `agentScope: "all"` om geconfigureerde agents samen weer te geven.
    - `sessions.usage.timeseries` retourneert tijdreeksgebruik voor één sessie.
    - `sessions.usage.logs` retourneert gebruikslogitems voor één sessie.

  </Accordion>

  <Accordion title="Channels and login helpers">
    - `channels.status` retourneert statusoverzichten van ingebouwde + gebundelde kanaal-/Plugins.
    - `channels.logout` logt uit bij een specifiek kanaal/account waar het kanaal uitloggen ondersteunt.
    - `web.login.start` start een QR-/webloginflow voor de huidige webkanaalprovider met QR-ondersteuning.
    - `web.login.wait` wacht tot die QR-/webloginflow is voltooid en start het kanaal bij succes.
    - `push.test` verstuurt een test-APNs-push naar een geregistreerde iOS-Node.
    - `voicewake.get` retourneert de opgeslagen wake-word-triggers.
    - `voicewake.set` werkt wake-word-triggers bij en zendt de wijziging uit.

  </Accordion>

  <Accordion title="Messaging and logs">
    - `send` is de directe RPC voor uitgaande levering voor kanaal-/account-/threadgerichte verzendingen buiten de chatrunner.
    - `logs.tail` retourneert de geconfigureerde Gateway-bestandslogtail met cursor-/limiet- en max-bytebesturing.

  </Accordion>

  <Accordion title="Talk and TTS">
    - `talk.catalog` retourneert de alleen-lezen Talk-providercatalogus voor spraak, streaming transcriptie en realtime stem. Deze bevat provider-id's, labels, geconfigureerde status, blootgestelde model-/stem-id's, canonieke modi, transporten, brain-strategieën en realtime audio-/capabilityvlaggen zonder providergeheimen te retourneren of globale config te muteren.
    - `talk.config` retourneert de effectieve Talk-configpayload; `includeSecrets` vereist `operator.talk.secrets` (of `operator.admin`).
    - `talk.session.create` maakt een Talk-sessie in eigendom van de Gateway voor `realtime/gateway-relay`, `transcription/gateway-relay` of `stt-tts/managed-room`. Voor `stt-tts/managed-room` moeten `operator.write`-callers die `sessionKey` doorgeven ook `spawnedBy` doorgeven voor zichtbaarheid van sessiesleutels binnen scope; het maken van een `sessionKey` zonder scope en `brain: "direct-tools"` vereisen `operator.admin`.
    - `talk.session.join` valideert een managed-room-sessietoken, emit `session.ready`- of `session.replaced`-gebeurtenissen waar nodig en retourneert kamer-/sessiemetadata plus recente Talk-gebeurtenissen zonder het platte-teksttoken of de opgeslagen tokenhash.
    - `talk.session.appendAudio` voegt base64 PCM-invoeraudio toe aan realtime relay- en transcriptiesessies in eigendom van de Gateway.
    - `talk.session.startTurn`, `talk.session.endTurn` en `talk.session.cancelTurn` sturen de levenscyclus van managed-room-beurten aan met afwijzing van verouderde beurten voordat de status wordt gewist.
    - `talk.session.cancelOutput` stopt audio-uitvoer van de assistent, primair voor VAD-afgeschermde barge-in in Gateway-relaysessies.
    - `talk.session.submitToolResult` voltooit een provider-toolcall die is geëmiteerd door een realtime relaysessie in eigendom van de Gateway. Geef `options: { willContinue: true }` door voor tussentijdse tooluitvoer wanneer een eindresultaat volgt, of `options: { suppressResponse: true }` wanneer het toolresultaat de providercall moet afhandelen zonder nog een realtime assistentresponse te starten.
    - `talk.session.steer` stuurt voicecontrol voor een actieve run naar een agent-backed Talk-sessie in eigendom van de Gateway. Deze accepteert `{ sessionId, text, mode? }`, waarbij `mode` `status`, `steer`, `cancel` of `followup` is; een weggelaten modus wordt geclassificeerd op basis van de gesproken tekst.
    - `talk.session.close` sluit een relay-, transcriptie- of managed-room-sessie in eigendom van de Gateway en emit terminale Talk-gebeurtenissen.
    - `talk.mode` stelt de huidige Talk-modestatus in voor WebChat-/Control UI-clients en zendt deze uit.
    - `talk.client.create` maakt een realtime providersessie in eigendom van de client met `webrtc` of `provider-websocket`, terwijl de Gateway config, referenties, instructies en toolbeleid beheert.
    - `talk.client.toolCall` laat realtime transporten in eigendom van de client provider-toolcalls doorsturen naar Gateway-beleid. De eerste ondersteunde tool is `openclaw_agent_consult`; clients ontvangen een run-id en wachten op normale chatlevenscyclusgebeurtenissen voordat ze het providerspecifieke toolresultaat indienen.
    - `talk.client.steer` verstuurt voicecontrol voor een actieve run voor realtime transporten in eigendom van de client. De Gateway resolveert de actieve embedded run vanuit `sessionKey` en retourneert een gestructureerd geaccepteerd/afgewezen resultaat in plaats van sturing stilzwijgend te laten vallen.
    - `talk.event` is het enige Talk-gebeurteniskanaal voor realtime, transcriptie, STT/TTS, managed-room, telefonie en meetingadapters.
    - `talk.speak` synthetiseert spraak via de actieve Talk-spraakprovider.
    - `tts.status` retourneert de ingeschakelde TTS-status, actieve provider, fallbackproviders en providerconfigstatus.
    - `tts.providers` retourneert de zichtbare TTS-providerinventaris.
    - `tts.enable` en `tts.disable` schakelen de TTS-voorkeursstatus in of uit.
    - `tts.setProvider` werkt de voorkeurs-TTS-provider bij.
    - `tts.convert` voert een eenmalige tekst-naar-spraakconversie uit.

  </Accordion>

  <Accordion title="Secrets, config, update, and wizard">
    - `secrets.reload` resolveert actieve SecretRefs opnieuw en wisselt runtimegeheimstatus alleen bij volledig succes.
    - `secrets.resolve` resolveert geheimtoewijzingen voor commandtargets voor een specifieke command-/targetset.
    - `config.get` retourneert de huidige configsnapshot en hash.
    - `config.set` schrijft een gevalideerde configpayload.
    - `config.patch` voegt een gedeeltelijke configupdate samen. Destructieve array-
      vervanging vereist het betrokken pad in `replacePaths`; geneste arrays
      onder array-items gebruiken `[]`-paden zoals `agents.list[].skills`.
    - `config.apply` valideert + vervangt de volledige configpayload.
    - `config.schema` retourneert de live configschemapayload die wordt gebruikt door Control UI- en CLI-tooling: schema, `uiHints`, versie en generatiemetadata, inclusief Plugin- + kanaalschemametadata wanneer de runtime deze kan laden. Het schema bevat veldmetadata `title` / `description` afgeleid van dezelfde labels en helptekst die door de UI worden gebruikt, inclusief geneste object-, wildcard-, array-item- en `anyOf` / `oneOf` / `allOf`-compositietakken wanneer overeenkomende velddocumentatie bestaat.
    - `config.schema.lookup` retourneert een padgescopeerde lookuppayload voor één configpad: genormaliseerd pad, een oppervlakkige schemanode, overeenkomende hint + `hintPath`, optionele `reloadKind` en directe child-samenvattingen voor UI-/CLI-drilldown. `reloadKind` is een van `restart`, `hot` of `none` en spiegelt de Gateway-configreloadplanner voor het aangevraagde pad. Lookupschemanodes behouden de gebruikersgerichte docs en algemene validatievelden (`title`, `description`, `type`, `enum`, `const`, `format`, `pattern`, numerieke/string-/array-/objectgrenzen en vlaggen zoals `additionalProperties`, `deprecated`, `readOnly`, `writeOnly`). Child-samenvattingen tonen `key`, genormaliseerd `path`, `type`, `required`, `hasChildren`, optioneel `reloadKind`, plus de overeenkomende `hint` / `hintPath`.
    - `update.run` voert de Gateway-updateflow uit en plant alleen een herstart wanneer de update zelf is geslaagd; callers met een sessie kunnen `continuationMessage` opnemen zodat startup één opvolgende agentbeurt hervat via de herstartvoortzettingswachtrij. Package-managerupdates en supervised git-checkoutupdates vanuit de control plane gebruiken een losgekoppelde managed-service-handoff in plaats van de package tree te vervangen of checkout-/builduitvoer binnen de live Gateway te muteren. Een gestarte handoff retourneert `ok: true` met `result.reason: "managed-service-handoff-started"` en `handoff.status: "started"`; niet-beschikbare of mislukte handoffs retourneren `ok: false` met `managed-service-handoff-unavailable` of `managed-service-handoff-failed`, plus `handoff.command` wanneer een handmatige shellupdate vereist is. Een niet-beschikbare handoff betekent dat OpenClaw geen veilige supervisorgrens of duurzame service-identiteit heeft, zoals `OPENCLAW_SYSTEMD_UNIT` voor systemd. Tijdens een gestarte handoff kan de herstartsentinel kort `stats.reason: "restart-health-pending"` rapporteren; de voortzetting wordt vertraagd totdat de CLI de herstarte Gateway verifieert en de definitieve `ok`-sentinel schrijft.
    - `update.status` ververst en retourneert de nieuwste update-herstartsentinel, inclusief de na-herstart draaiende versie wanneer beschikbaar.
    - `wizard.start`, `wizard.next`, `wizard.status` en `wizard.cancel` stellen de onboardingwizard beschikbaar via WS RPC.

  </Accordion>

  <Accordion title="Agent- en werkruimtehelpers">
    - `agents.list` retourneert geconfigureerde agentvermeldingen, inclusief effectief model en runtimemetadata.
    - `agents.create`, `agents.update` en `agents.delete` beheren agentrecords en werkruimtebedrading.
    - `agents.files.list`, `agents.files.get` en `agents.files.set` beheren de bootstrap-werkruimtebestanden die voor een agent worden blootgesteld.
    - `tasks.list`, `tasks.get` en `tasks.cancel` stellen het Gateway-taaklogboek beschikbaar aan SDK- en operatorclients.
    - `artifacts.list`, `artifacts.get` en `artifacts.download` stellen uit transcripten afgeleide artifactsamenvattingen en downloads beschikbaar voor een expliciet `sessionKey`-, `runId`- of `taskId`-bereik. Run- en taakquery's lossen de eigenaarssessie server-side op en retourneren alleen transcriptmedia met overeenkomende herkomst; onveilige of lokale URL-bronnen retourneren niet-ondersteunde downloads in plaats van server-side op te halen.
    - `environments.list` en `environments.status` stellen alleen-lezen Gateway-lokale en node-omgevingsdetectie beschikbaar aan SDK-clients.
    - `agent.identity.get` retourneert de effectieve assistentidentiteit voor een agent of sessie.
    - `agent.wait` wacht tot een run is voltooid en retourneert de terminale snapshot wanneer beschikbaar.

  </Accordion>

  <Accordion title="Sessiebesturing">
    - `sessions.list` retourneert de huidige sessie-index, inclusief `agentRuntime`-metadata per rij wanneer een agentruntime-backend is geconfigureerd.
    - `sessions.subscribe` en `sessions.unsubscribe` schakelen abonnementen op sessiewijzigingsgebeurtenissen in of uit voor de huidige WS-client.
    - `sessions.messages.subscribe` en `sessions.messages.unsubscribe` schakelen abonnementen op transcript-/berichtgebeurtenissen in of uit voor één sessie.
    - `sessions.preview` retourneert begrensde transcriptvoorvertoningen voor specifieke sessiesleutels.
    - `sessions.describe` retourneert één Gateway-sessierij voor een exacte sessiesleutel.
    - `sessions.resolve` lost een sessiedoel op of canoniseert het.
    - `sessions.create` maakt een nieuwe sessievermelding.
    - `sessions.send` stuurt een bericht naar een bestaande sessie.
    - `sessions.steer` is de interrupt-and-steer-variant voor een actieve sessie.
    - `sessions.abort` breekt actief werk voor een sessie af. Een aanroeper kan `key` plus optioneel `runId` doorgeven, of alleen `runId` doorgeven voor actieve runs die de Gateway naar een sessie kan herleiden.
    - `sessions.patch` werkt sessiemetadata/-overrides bij en rapporteert het opgeloste canonieke model plus effectieve `agentRuntime`.
    - `sessions.reset`, `sessions.delete` en `sessions.compact` voeren sessieonderhoud uit.
    - `sessions.get` retourneert de volledige opgeslagen sessierij.
    - Chatuitvoering gebruikt nog steeds `chat.history`, `chat.send`, `chat.abort` en `chat.inject`. `chat.history` wordt voor UI-clients genormaliseerd voor weergave: inline directive-tags worden uit zichtbare tekst verwijderd, XML-payloads voor platte-tekst toolaanroepen (inclusief `<tool_call>...</tool_call>`, `<function_call>...</function_call>`, `<tool_calls>...</tool_calls>`, `<function_calls>...</function_calls>` en afgekorte tool-call-blokken) en gelekte ASCII-/full-width modelbesturingstokens worden verwijderd, pure silent-token assistentrijen zoals exact `NO_REPLY` / `no_reply` worden weggelaten, en te grote rijen kunnen worden vervangen door placeholders.
    - `chat.message.get` is de additieve begrensde volledige-berichtlezer voor één zichtbare transcriptvermelding. Clients geven `sessionKey` door, optioneel `agentId` wanneer de sessieselectie agent-scoped is, plus een transcript-`messageId` dat eerder via `chat.history` is getoond, en de Gateway retourneert dezelfde voor weergave genormaliseerde projectie zonder de lichte afkappingslimiet van history wanneer de opgeslagen vermelding nog beschikbaar is en niet te groot is.
    - `chat.send` accepteert een eenmalige `fastMode: "auto"` om fast mode te gebruiken voor modelaanroepen die vóór de automatische cutoff worden gestart, en vervolgens latere retry-, fallback-, toolresultaat- of vervolgaanroepen zonder fast mode te starten. De cutoff is standaard 60 seconden en kan per model worden geconfigureerd met `agents.defaults.models["<provider>/<model>"].params.fastAutoOnSeconds`. Een `chat.send`-aanroeper kan eenmalig `fastAutoOnSeconds` doorgeven om de cutoff voor die aanvraag te overschrijven.

  </Accordion>

  <Accordion title="Apparaatkoppeling en apparaattokens">
    - `device.pair.list` retourneert wachtende en goedgekeurde gekoppelde apparaten.
    - `device.pair.approve`, `device.pair.reject` en `device.pair.remove` beheren apparaatkoppelingsrecords.
    - `device.token.rotate` roteert een gekoppeld apparaattoken binnen de grenzen van de goedgekeurde rol en het aanroeperbereik.
    - `device.token.revoke` trekt een gekoppeld apparaattoken in binnen de grenzen van de goedgekeurde rol en het aanroeperbereik.

  </Accordion>

  <Accordion title="Node-koppeling, aanroepen en wachtend werk">
    - `node.pair.request`, `node.pair.list`, `node.pair.approve`, `node.pair.reject`, `node.pair.remove` en `node.pair.verify` dekken node-koppeling en bootstrapverificatie.
    - `node.list` en `node.describe` retourneren bekende/verbonden node-status.
    - `node.rename` werkt een gekoppeld node-label bij.
    - `node.invoke` stuurt een opdracht door naar een verbonden node.
    - `node.invoke.result` retourneert het resultaat voor een aanroepverzoek.
    - `node.event` voert door nodes afkomstige gebeurtenissen terug naar de gateway.
    - `node.pending.pull` en `node.pending.ack` zijn de queue-API's voor verbonden nodes.
    - `node.pending.enqueue` en `node.pending.drain` beheren duurzaam wachtend werk voor offline/losgekoppelde nodes.

  </Accordion>

  <Accordion title="Goedkeuringsfamilies">
    - `exec.approval.request`, `exec.approval.get`, `exec.approval.list` en `exec.approval.resolve` dekken eenmalige exec-goedkeuringsverzoeken plus opzoeken/opnieuw afspelen van wachtende goedkeuringen.
    - `exec.approval.waitDecision` wacht op één wachtende exec-goedkeuring en retourneert de uiteindelijke beslissing (of `null` bij timeout).
    - `exec.approvals.get` en `exec.approvals.set` beheren snapshots van het Gateway-exec-goedkeuringsbeleid.
    - `exec.approvals.node.get` en `exec.approvals.node.set` beheren node-lokaal exec-goedkeuringsbeleid via node-relayopdrachten.
    - `plugin.approval.request`, `plugin.approval.list`, `plugin.approval.waitDecision` en `plugin.approval.resolve` dekken door plugins gedefinieerde goedkeuringsflows.

  </Accordion>

  <Accordion title="Automatisering, Skills en tools">
    - Automatisering: `wake` plant een onmiddellijke of volgende-heartbeat wake-tekstinjectie; `cron.get`, `cron.list`, `cron.status`, `cron.add`, `cron.update`, `cron.remove`, `cron.run`, `cron.runs` beheren gepland werk.
    - `cron.run` blijft een enqueue-stijl RPC voor handmatige runs. Clients die voltooiingssemantiek nodig hebben, moeten de geretourneerde `runId` lezen en `cron.runs` pollen.
    - `cron.runs` accepteert een optioneel niet-leeg `runId`-filter zodat clients één in de wachtrij geplaatste handmatige run kunnen volgen zonder race met andere geschiedenisvermeldingen voor dezelfde taak.
    - Skills en tools: `commands.list`, `skills.*`, `tools.catalog`, `tools.effective`, `tools.invoke`.

  </Accordion>
</AccordionGroup>

### Veelvoorkomende gebeurtenisfamilies

- `chat`: UI-chatupdates zoals `chat.inject` en andere uitsluitend transcript-chatgebeurtenissen. In protocol v4 dragen delta-payloads `deltaText`; `message` blijft de cumulatieve assistent-snapshot. Niet-prefixvervangingen stellen `replace=true` in en gebruiken `deltaText` als vervangende tekst.
- `session.message`, `session.operation` en `session.tool`: transcript-, lopende sessieoperatie- en event-streamupdates voor een geabonneerde sessie.
- `sessions.changed`: sessie-index of metadata gewijzigd.
- `presence`: updates van systeemaanwezigheidssnapshot.
- `tick`: periodieke keepalive-/livenessgebeurtenis.
- `health`: update van gateway-gezondheidssnapshot.
- `heartbeat`: update van Heartbeat-gebeurtenisstroom.
- `cron`: wijzigingsgebeurtenis voor Cron-run/taak.
- `shutdown`: melding van afsluiten van gateway.
- `node.pair.requested` / `node.pair.resolved`: levenscyclus van node-koppeling.
- `node.invoke.request`: broadcast van node-aanroepverzoek.
- `device.pair.requested` / `device.pair.resolved`: levenscyclus van gekoppeld apparaat.
- `voicewake.changed`: configuratie van wake-wordtrigger gewijzigd.
- `exec.approval.requested` / `exec.approval.resolved`: levenscyclus van exec-goedkeuring.
- `plugin.approval.requested` / `plugin.approval.resolved`: levenscyclus van plugin-goedkeuring.

### Node-helpermethoden

- Nodes kunnen `skills.bins` aanroepen om de huidige lijst met uitvoerbare skillbestanden op te halen voor auto-allow-controles.

### RPC's voor taaklogboek

Operatorclients kunnen Gateway-achtergrondtaakrecords inspecteren en annuleren via de RPC's voor het taaklogboek. Deze methoden retourneren opgeschoonde taaksamenvattingen, geen ruwe runtimestatus.

- `tasks.list` vereist `operator.read`.
  - Params: optioneel `status` (`"queued"`, `"running"`, `"completed"`, `"failed"`, `"cancelled"` of `"timed_out"`) of een array van die statussen, optioneel `agentId`, optioneel `sessionKey`, optioneel `limit` van `1` tot `500`, en optioneel string `cursor`.
  - Resultaat: `{ "tasks": TaskSummary[], "nextCursor"?: string }`.
- `tasks.get` vereist `operator.read`.
  - Params: `{ "taskId": string }`.
  - Resultaat: `{ "task": TaskSummary }`.
  - Ontbrekende taak-ID's retourneren de not-found-foutvorm van de Gateway.
- `tasks.cancel` vereist `operator.write`.
  - Params: `{ "taskId": string, "reason"?: string }`.
  - Resultaat:
    `{ "found": boolean, "cancelled": boolean, "reason"?: string, "task"?: TaskSummary }`.
  - `found` rapporteert of het logboek een overeenkomende taak had. `cancelled`
    rapporteert of de runtime annulering heeft geaccepteerd of geregistreerd.

`TaskSummary` bevat `id`, `status` en optionele metadata zoals `kind`,
`runtime`, `title`, `agentId`, `sessionKey`, `childSessionKey`, `ownerKey`,
`runId`, `taskId`, `flowId`, `parentTaskId`, `sourceId`, timestamps, voortgang,
terminale samenvatting en opgeschoonde fouttekst. `agentId` identificeert de agent
die de taak uitvoert; `sessionKey` en `ownerKey` bewaren de aanvrager- en besturingscontext.

### Operator-helpermethoden

- Operators mogen `commands.list` (`operator.read`) aanroepen om de runtime
  opdrachtinventaris voor een agent op te halen.

- Shared-secret Gateway-authenticatie gebruikt `connect.params.auth.token` of
  `connect.params.auth.password`, afhankelijk van de geconfigureerde auth-modus.
- Modi met identiteit, zoals Tailscale Serve
  (`gateway.auth.allowTailscale: true`) of niet-loopback
  `gateway.auth.mode: "trusted-proxy"`, voldoen aan de connect-auth-controle via
  requestheaders in plaats van `connect.params.auth.*`.
- Private-ingress `gateway.auth.mode: "none"` slaat shared-secret connect-auth
  volledig over; stel die modus niet bloot op publieke/niet-vertrouwde ingress.
- Na pairing geeft de Gateway een **device token** uit dat is beperkt tot de
  verbindingsrol + scopes. Het wordt geretourneerd in
  `hello-ok.auth.deviceToken` en moet door de client worden bewaard voor
  toekomstige connects.
- Clients moeten de primaire `hello-ok.auth.deviceToken` bewaren na elke
  geslaagde connect.
- Opnieuw verbinden met dat **opgeslagen** device token moet ook de opgeslagen
  goedgekeurde scopeset voor dat token hergebruiken. Dit behoudt
  lees-/probe-/statustoegang die al was toegekend en voorkomt dat reconnects
  stilzwijgend worden teruggebracht tot een smallere impliciete admin-only
  scope.
- Client-side connect-auth-assemblage (`selectConnectAuth` in
  `src/gateway/client.ts`):
  - `auth.password` is orthogonaal en wordt altijd doorgestuurd wanneer het is ingesteld.
  - `auth.token` wordt ingevuld in prioriteitsvolgorde: eerst een expliciet shared token,
    daarna een expliciet `deviceToken`, daarna een opgeslagen token per device (gesleuteld op
    `deviceId` + `role`).
  - `auth.bootstrapToken` wordt alleen verzonden wanneer geen van bovenstaande een
    `auth.token` heeft opgeleverd. Een shared token of een opgelost device token onderdrukt het.
  - Automatische promotie van een opgeslagen device token bij de eenmalige
    `AUTH_TOKEN_MISMATCH`-retry is beperkt tot **alleen vertrouwde endpoints**:
    loopback, of `wss://` met een vastgezette `tlsFingerprint`. Publieke `wss://`
    zonder pinning komt niet in aanmerking.
- Ingebouwde setup-code-bootstrap retourneert het primaire node
  `hello-ok.auth.deviceToken` plus een begrensd operator-token in
  `hello-ok.auth.deviceTokens` voor vertrouwde mobiele overdracht. Het operator-token
  bevat `operator.talk.secrets` voor native Talk-configuratielezingen en sluit
  `operator.admin` en `operator.pairing` uit.
- Terwijl een niet-baseline setup-code-bootstrap op goedkeuring wacht, bevatten
  `PAIRING_REQUIRED`-details `recommendedNextStep: "wait_then_retry"`, `retryable: true`
  en `pauseReconnect: false`. Clients moeten blijven reconnecten met hetzelfde
  bootstrap-token totdat de aanvraag is goedgekeurd of het token ongeldig wordt.
- Bewaar `hello-ok.auth.deviceTokens` alleen wanneer de connect bootstrap-auth
  gebruikte op een vertrouwd transport zoals `wss://` of loopback/lokale pairing.
- Als een client een **expliciet** `deviceToken` of expliciete `scopes` opgeeft, blijft die
  door de caller aangevraagde scopeset leidend; gecachete scopes worden alleen
  hergebruikt wanneer de client het opgeslagen token per device hergebruikt.
- Device tokens kunnen worden geroteerd/ingetrokken via `device.token.rotate` en
  `device.token.revoke` (vereist de scope `operator.pairing`). Het roteren of
  intrekken van een node of andere niet-operatorrol vereist ook `operator.admin`.
- `device.token.rotate` retourneert rotatiemetadata. Het echoot het vervangende
  bearer-token alleen voor same-device-calls die al met dat device token zijn
  geauthenticeerd, zodat token-only clients hun vervanging kunnen bewaren voordat
  ze opnieuw verbinden. Shared/admin-rotaties echoën het bearer-token niet.
- Tokenuitgifte, rotatie en intrekking blijven begrensd tot de goedgekeurde rollenset
  die is vastgelegd in de pairing-entry van dat device; tokenmutatie kan geen
  devicerol uitbreiden of targeten die pairing-goedkeuring nooit heeft verleend.
- Voor paired-device-tokensessies is devicebeheer self-scoped, tenzij de caller ook
  `operator.admin` heeft: niet-admin-callers kunnen alleen het operator-token voor hun
  **eigen** device-entry beheren. Node- en ander niet-operator-tokenbeheer is
  admin-only, zelfs voor het eigen device van de caller.
- `device.token.rotate` en `device.token.revoke` controleren ook de target-operator
  tokenscopeset tegen de huidige sessiescopes van de caller. Niet-admin-callers
  kunnen geen breder operator-token roteren of intrekken dan ze al hebben.
- Auth-fouten bevatten `error.details.code` plus herstelhints:
  - `error.details.canRetryWithDeviceToken` (boolean)
  - `error.details.recommendedNextStep` (`retry_with_device_token`, `update_auth_configuration`, `update_auth_credentials`, `wait_then_retry`, `review_auth_configuration`)
- Clientgedrag voor `AUTH_TOKEN_MISMATCH`:
  - Vertrouwde clients mogen één begrensde retry proberen met een gecachet token per device.
  - Als die retry mislukt, moeten clients automatische reconnect-loops stoppen en guidance voor operatoractie tonen.
- `AUTH_SCOPE_MISMATCH` betekent dat het device token is herkend, maar de
  aangevraagde rol/scopes niet dekt. Clients moeten dit niet presenteren als een slecht token;
  vraag de operator om opnieuw te pairen of het smallere/bredere scopecontract goed te keuren.

## Device-identiteit + pairing

- Nodes moeten een stabiele device-identiteit (`device.id`) opnemen die is afgeleid van een
  keypair-fingerprint.
- Gateways geven tokens uit per device + rol.
- Pairing-goedkeuringen zijn vereist voor nieuwe device-ID's, tenzij lokale automatische goedkeuring
  is ingeschakeld.
- Automatische pairing-goedkeuring is gecentreerd rond directe local loopback-connects.
- OpenClaw heeft ook een smal backend/container-local self-connect-pad voor
  vertrouwde shared-secret helper-flows.
- Same-host tailnet- of LAN-connects worden voor pairing nog steeds als remote behandeld en
  vereisen goedkeuring.
- WS-clients nemen normaal gesproken `device`-identiteit op tijdens `connect` (operator +
  node). De enige operator-uitzonderingen zonder device zijn expliciete vertrouwenspaden:
  - `gateway.controlUi.allowInsecureAuth=true` voor localhost-only onveilige HTTP-compatibiliteit.
  - geslaagde `gateway.auth.mode: "trusted-proxy"` operator Control UI-auth.
  - `gateway.controlUi.dangerouslyDisableDeviceAuth=true` (break-glass, ernstige security-downgrade).
  - direct-loopback `gateway-client` backend-RPC's op het gereserveerde interne
    helperpad.
- Het weglaten van device-identiteit heeft gevolgen voor scopes. Wanneer een operatorverbinding
  zonder device via een expliciet vertrouwenspad wordt toegestaan, wist OpenClaw nog steeds
  zelfverklaarde scopes naar een lege set, tenzij dat pad een benoemde
  uitzondering voor scopebehoud heeft. Scope-gated methoden falen dan met
  `missing scope`.
- `gateway.controlUi.dangerouslyDisableDeviceAuth=true` is een Control UI
  break-glass-pad voor scopebehoud. Het verleent geen scopes aan willekeurige
  custom backend- of CLI-vormige WebSocket-clients.
- Het gereserveerde direct-loopback `gateway-client` backend-helperpad behoudt
  scopes alleen voor interne lokale control-plane-RPC's; custom backend-ID's ontvangen
  deze uitzondering niet.
- Alle verbindingen moeten de door de server verstrekte `connect.challenge`-nonce ondertekenen.

### Diagnostiek voor device-auth-migratie

Voor legacy-clients die nog pre-challenge-ondertekeningsgedrag gebruiken, retourneert `connect` nu
`DEVICE_AUTH_*`-detailcodes onder `error.details.code` met een stabiele `error.details.reason`.

Veelvoorkomende migratiefouten:

| Bericht                     | details.code                     | details.reason           | Betekenis                                          |
| --------------------------- | -------------------------------- | ------------------------ | -------------------------------------------------- |
| `device nonce required`     | `DEVICE_AUTH_NONCE_REQUIRED`     | `device-nonce-missing`   | Client liet `device.nonce` weg (of verzond leeg).  |
| `device nonce mismatch`     | `DEVICE_AUTH_NONCE_MISMATCH`     | `device-nonce-mismatch`  | Client ondertekende met een verlopen/verkeerde nonce. |
| `device signature invalid`  | `DEVICE_AUTH_SIGNATURE_INVALID`  | `device-signature`       | Signature-payload komt niet overeen met v2-payload. |
| `device signature expired`  | `DEVICE_AUTH_SIGNATURE_EXPIRED`  | `device-signature-stale` | Ondertekende timestamp valt buiten de toegestane afwijking. |
| `device identity mismatch`  | `DEVICE_AUTH_DEVICE_ID_MISMATCH` | `device-id-mismatch`     | `device.id` komt niet overeen met de public key-fingerprint. |
| `device public key invalid` | `DEVICE_AUTH_PUBLIC_KEY_INVALID` | `device-public-key`      | Public key-formaat/canonicalisatie is mislukt.     |

Migratiedoel:

- Wacht altijd op `connect.challenge`.
- Onderteken de v2-payload die de servernonce bevat.
- Verzend dezelfde nonce in `connect.params.device.nonce`.
- De voorkeurs-signature-payload is `v3`, die naast device/client/role/scopes/token/nonce-velden
  ook `platform` en `deviceFamily` bindt.
- Legacy `v2`-signatures blijven geaccepteerd voor compatibiliteit, maar paired-device
  metadata-pinning blijft command policy bij reconnect controleren.

## TLS + pinning

- TLS wordt ondersteund voor WS-verbindingen.
- Clients kunnen optioneel de gateway-cert-fingerprint pinnen (zie `gateway.tls`-
  config plus `gateway.remote.tlsFingerprint` of CLI `--tls-fingerprint`).

## Scope

Dit protocol stelt de **volledige Gateway-API** bloot (status, kanalen, modellen, chat,
agent, sessies, nodes, goedkeuringen, enz.). Het exacte oppervlak wordt gedefinieerd door de
TypeBox-schema's in `packages/gateway-protocol/src/schema.ts`.

## Gerelateerd

- [Bridge-protocol](/nl/gateway/bridge-protocol)
- [Gateway-runbook](/nl/gateway)
