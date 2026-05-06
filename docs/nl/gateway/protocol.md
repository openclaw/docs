---
read_when:
    - Implementeren of bijwerken van Gateway-WS-clients
    - Protocolmismatches of verbindingsfouten debuggen
    - Protocolschema's/-modellen opnieuw genereren
summary: 'Gateway-WebSocket-protocol: handshake, frames, versionering'
title: Gateway-protocol
x-i18n:
    generated_at: "2026-05-06T09:15:35Z"
    model: gpt-5.5
    provider: openai
    source_hash: 8a5eb7a84dbe0664fd78271408686a643dbc0579de5b5402fd1a8d33fd59221d
    source_path: gateway/protocol.md
    workflow: 16
---

Het Gateway WS-protocol is het **enige control plane + node-transport** voor
OpenClaw. Alle clients (CLI, web-UI, macOS-app, iOS/Android-nodes, headless
nodes) maken verbinding via WebSocket en declareren hun **rol** + **scope** tijdens
de handshake.

## Transport

- WebSocket, tekstframes met JSON-payloads.
- Het eerste frame **moet** een `connect`-request zijn.
- Pre-connect-frames zijn begrensd op 64 KiB. Na een geslaagde handshake moeten clients
  de limieten `hello-ok.policy.maxPayload` en
  `hello-ok.policy.maxBufferedBytes` volgen. Wanneer diagnostiek is ingeschakeld,
  zenden te grote inkomende frames en trage uitgaande buffers `payload.large`-events
  uit voordat de Gateway sluit of het betrokken frame laat vallen. Deze events bewaren
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

Terwijl de Gateway nog bezig is met het afronden van startup-sidecars, kan de `connect`-request
een opnieuw te proberen `UNAVAILABLE`-fout retourneren met `details.reason` ingesteld op
`"startup-sidecars"` en `retryAfterMs`. Clients moeten die respons opnieuw proberen
binnen hun totale verbindingsbudget in plaats van deze als terminale
handshakefout te tonen.

`server`, `features`, `snapshot` en `policy` zijn allemaal vereist door het schema
(`src/gateway/protocol/schema/frames.ts`). `auth` is ook vereist en rapporteert
de onderhandelde rol/scopes. `canvasHostUrl` is optioneel.

Wanneer er geen device-token wordt uitgegeven, rapporteert `hello-ok.auth` de onderhandelde
permissies zonder tokenvelden:

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
lokaal backendwerk blokkeren, zoals updates van subagent-sessies. Externe clients,
clients met browser-origin, node-clients en expliciete device-token/device-identity
clients blijven de normale pairing- en scope-upgradecontroles gebruiken.

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

Tijdens een vertrouwde bootstrap-overdracht kan `hello-ok.auth` ook aanvullende
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

Voor de ingebouwde node/operator-bootstrapflow blijft het primaire node-token
`scopes: []` en blijft elk overgedragen operator-token begrensd tot de bootstrap
operator-allowlist (`operator.approvals`, `operator.read`,
`operator.talk.secrets`, `operator.write`). Bootstrap-scopecontroles blijven
rolgeprefixeerd: operator-vermeldingen voldoen alleen aan operator-requests, en niet-operator
rollen hebben nog steeds scopes nodig onder hun eigen rolprefix.

### Node-voorbeeld

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
- **Respons**: `{type:"res", id, ok, payload|error}`
- **Event**: `{type:"event", event, payload, seq?, stateVersion?}`

Methoden met bijwerkingen vereisen **idempotentiesleutels** (zie schema).

## Rollen + scopes

Zie [Operatorscopes](/nl/gateway/operator-scopes) voor het volledige operator-scopemodel,
controles op goedkeuringsmoment en shared-secret-semantiek.

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

Door plugins geregistreerde Gateway-RPC-methoden kunnen hun eigen operator-scope aanvragen, maar
gereserveerde core-adminprefixen (`config.*`, `exec.approvals.*`, `wizard.*`,
`update.*`) worden altijd herleid tot `operator.admin`.

Methodescope is alleen de eerste poort. Sommige slash-commando's die via
`chat.send` worden bereikt, passen daarbovenop strengere controles op commandoniveau toe. Permanente
`/config set`- en `/config unset`-writes vereisen bijvoorbeeld `operator.admin`.

`node.pair.approve` heeft ook een extra scopecontrole op goedkeuringsmoment bovenop de
basismethodescope:

- requests zonder commando: `operator.pairing`
- requests met non-exec node-commando's: `operator.pairing` + `operator.write`
- requests die `system.run`, `system.run.prepare` of `system.which` bevatten:
  `operator.pairing` + `operator.admin`

### Caps/commands/permissions (node)

Nodes declareren capabilityclaims tijdens het verbinden:

- `caps`: capabilitycategorieën op hoog niveau zoals `camera`, `canvas`, `screen`,
  `location`, `voice` en `talk`.
- `commands`: commando-allowlist voor invoke.
- `permissions`: fijnmazige toggles (bijv. `screen.record`, `camera.capture`).

De Gateway behandelt deze als **claims** en handhaaft server-side allowlists.

## Presence

- `system-presence` retourneert vermeldingen gesleuteld op device-identiteit.
- Presence-vermeldingen bevatten `deviceId`, `roles` en `scopes`, zodat UI's één rij per device kunnen tonen
  zelfs wanneer het zowel als **operator** en als **node** verbindt.
- `node.list` bevat optionele velden `lastSeenAtMs` en `lastSeenReason`. Verbonden nodes rapporteren
  hun huidige verbindingstijd als `lastSeenAtMs` met reden `connect`; gepairde nodes kunnen ook
  duurzame achtergrond-presence rapporteren wanneer een vertrouwd node-event hun pairingmetadata bijwerkt.

### Node-achtergrond-alive-event

Nodes mogen `node.event` aanroepen met `event: "node.presence.alive"` om vast te leggen dat een gepairde node
alive was tijdens een achtergrondwake zonder deze als verbonden te markeren.

```json
{
  "event": "node.presence.alive",
  "payloadJSON": "{\"trigger\":\"silent_push\",\"sentAtMs\":1737264000000,\"displayName\":\"Peter's iPhone\",\"version\":\"2026.4.28\",\"platform\":\"iOS 18.4.0\",\"deviceFamily\":\"iPhone\",\"modelIdentifier\":\"iPhone17,1\",\"pushTransport\":\"relay\"}"
}
```

`trigger` is een gesloten enum: `background`, `silent_push`, `bg_app_refresh`,
`significant_location`, `manual` of `connect`. Onbekende triggerstrings worden door de
Gateway genormaliseerd naar `background` voordat ze persistent worden opgeslagen. Het event is alleen duurzaam voor geauthenticeerde node
device-sessies; sessies zonder device of zonder pairing retourneren `handled: false`.

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

## Scoping van broadcast-events

Door de server gepushte WebSocket-broadcast-events zijn scope-gated, zodat sessies met alleen pairing-scope of alleen node-sessies niet passief sessie-inhoud ontvangen.

- **Chat-, agent- en tool-result-frames** (inclusief gestreamde `agent`-events en resultaten van tool-calls) vereisen minstens `operator.read`. Sessies zonder `operator.read` slaan deze frames volledig over.
- **Door plugins gedefinieerde `plugin.*`-broadcasts** zijn gated op `operator.write` of `operator.admin`, afhankelijk van hoe de plugin ze heeft geregistreerd.
- **Status- en transportevents** (`heartbeat`, `presence`, `tick`, connect/disconnect-lifecycle, enz.) blijven onbeperkt, zodat transportgezondheid voor elke geauthenticeerde sessie observeerbaar blijft.
- **Onbekende broadcast-eventfamilies** zijn standaard scope-gated (fail-closed), tenzij een geregistreerde handler ze expliciet versoepelt.

Elke clientverbinding behoudt zijn eigen per-client sequence number, zodat broadcasts monotone ordening op die socket behouden, zelfs wanneer verschillende clients verschillende scope-gefilterde subsets van de eventstream zien.

## Veelvoorkomende RPC-methodfamilies

Het publieke WS-oppervlak is breder dan de handshake/auth-voorbeelden hierboven. Dit
is geen gegenereerde dump — `hello-ok.features.methods` is een conservatieve
discoverylijst die is opgebouwd uit `src/gateway/server-methods-list.ts` plus geladen
plugin/channel-methode-exports. Behandel het als featurediscovery, niet als volledige
opsomming van `src/gateway/server-methods/*.ts`.

<AccordionGroup>
  <Accordion title="System and identity">
    - `health` retourneert de gecachete of vers geprobeerde Gateway-health-snapshot.
    - `diagnostics.stability` retourneert de recente begrensde diagnostische stabiliteitsrecorder. Deze bewaart operationele metadata zoals eventnamen, aantallen, bytegroottes, geheugenmetingen, queue-/sessiestatus, kanaal-/pluginnamen en sessie-id's. Deze bewaart geen chattekst, webhookbodies, tooloutputs, ruwe request- of responsbodies, tokens, cookies of geheime waarden. Operator-read-scope is vereist.
    - `status` retourneert de `/status`-achtige Gateway-samenvatting; gevoelige velden worden alleen opgenomen voor operator-clients met admin-scope.
    - `gateway.identity.get` retourneert de Gateway-device-identiteit die door relay- en pairingflows wordt gebruikt.
    - `system-presence` retourneert de huidige presence-snapshot voor verbonden operator-/node-devices.
    - `system-event` voegt een system-event toe en kan presencecontext bijwerken/uitzenden.
    - `last-heartbeat` retourneert het laatste persistent opgeslagen Heartbeat-event.
    - `set-heartbeats` schakelt Heartbeat-verwerking op de Gateway in of uit.

  </Accordion>

  <Accordion title="Modellen en gebruik">
    - `models.list` retourneert de modelcatalogus die tijdens runtime is toegestaan. Geef `{ "view": "configured" }` door voor geconfigureerde modellen op picker-formaat (`agents.defaults.models` eerst, daarna `models.providers.*.models`), of `{ "view": "all" }` voor de volledige catalogus.
    - `usage.status` retourneert samenvattingen van providergebruiksvensters/resterend quotum.
    - `usage.cost` retourneert geaggregeerde samenvattingen van kostengebruik voor een datumbereik.
    - `doctor.memory.status` retourneert de gereedheid van vectorgeheugen / gecachte embeddings voor de actieve standaardagentworkspace. Geef `{ "probe": true }` of `{ "deep": true }` alleen door wanneer de aanroeper expliciet een live ping naar de embeddingprovider wil.
    - `doctor.memory.remHarness` retourneert een begrensde, alleen-lezen REM-harnesspreview voor remote control-plane-clients. Deze kan workspacepaden, geheugenfragmenten, gerenderde gegronde markdown en kandidaten voor diepe promotie bevatten, dus aanroepers hebben `operator.read` nodig.
    - `sessions.usage` retourneert gebruikssamenvattingen per sessie.
    - `sessions.usage.timeseries` retourneert tijdreeksgebruik voor één sessie.
    - `sessions.usage.logs` retourneert gebruikslogvermeldingen voor één sessie.

  </Accordion>

  <Accordion title="Kanalen en loginhelpers">
    - `channels.status` retourneert statusoverzichten van ingebouwde + meegeleverde kanalen/plugins.
    - `channels.logout` meldt een specifiek kanaal/account af wanneer het kanaal afmelden ondersteunt.
    - `web.login.start` start een QR-/webloginflow voor de huidige webkanaalprovider die QR ondersteunt.
    - `web.login.wait` wacht tot die QR-/webloginflow is voltooid en start het kanaal bij succes.
    - `push.test` verzendt een test-APNs-push naar een geregistreerde iOS-Node.
    - `voicewake.get` retourneert de opgeslagen wake-word-triggers.
    - `voicewake.set` werkt wake-word-triggers bij en broadcast de wijziging.

  </Accordion>

  <Accordion title="Berichten en logs">
    - `send` is de directe RPC voor uitgaande aflevering voor kanaal-/account-/threadgerichte verzendingen buiten de chatrunner.
    - `logs.tail` retourneert de geconfigureerde Gateway-bestandslogtail met cursor-/limiet- en max-byte-besturing.

  </Accordion>

  <Accordion title="Talk en TTS">
    - `talk.catalog` retourneert de alleen-lezen Talk-providercatalogus voor spraak, streamingtranscriptie en realtime spraak. Deze bevat provider-id's, labels, geconfigureerde status, blootgestelde model-/spraak-id's, canonieke modi, transporten, brainstrategieën en realtime audio-/capabilityvlaggen zonder providergeheimen te retourneren of globale configuratie te wijzigen.
    - `talk.config` retourneert de effectieve Talk-configuratiepayload; `includeSecrets` vereist `operator.talk.secrets` (of `operator.admin`).
    - `talk.session.create` maakt een Talk-sessie in Gateway-beheer voor `realtime/gateway-relay`, `transcription/gateway-relay` of `stt-tts/managed-room`. `brain: "direct-tools"` vereist `operator.admin`.
    - `talk.session.join` valideert een managed-room-sessietoken, emit indien nodig `session.ready`- of `session.replaced`-events, en retourneert room-/sessiemetadata plus recente Talk-events zonder de platteteksttoken of opgeslagen tokenhash.
    - `talk.session.appendAudio` voegt base64 PCM-invoeraudio toe aan realtime relay- en transcriptiesessies in Gateway-beheer.
    - `talk.session.startTurn`, `talk.session.endTurn` en `talk.session.cancelTurn` sturen de levenscyclus van managed-room-beurten aan met afwijzing van verouderde beurten voordat de status wordt gewist.
    - `talk.session.cancelOutput` stopt audio-uitvoer van de assistent, voornamelijk voor VAD-gated barge-in in Gateway-relaysessies.
    - `talk.session.submitToolResult` voltooit een providertoolaanroep die is geëmit door een realtime relaysessie in Gateway-beheer.
    - `talk.session.close` sluit een relay-, transcriptie- of managed-room-sessie in Gateway-beheer en emit terminale Talk-events.
    - `talk.mode` stelt de huidige Talk-modusstatus in/broadcast deze voor WebChat-/Control UI-clients.
    - `talk.client.create` maakt een realtime providersessie in clientbeheer met `webrtc` of `provider-websocket`, terwijl de Gateway eigenaar is van configuratie, referenties, instructies en toolbeleid.
    - `talk.client.toolCall` laat realtime transporten in clientbeheer providertoolaanroepen doorsturen naar Gateway-beleid. De eerste ondersteunde tool is `openclaw_agent_consult`; clients ontvangen een run-id en wachten op normale chatlevenscyclus-events voordat ze het providerspecifieke toolresultaat indienen.
    - `talk.event` is het enkele Talk-eventkanaal voor realtime-, transcriptie-, STT/TTS-, managed-room-, telefonie- en vergaderadapters.
    - `talk.speak` synthetiseert spraak via de actieve Talk-spraakprovider.
    - `tts.status` retourneert de ingeschakelde TTS-status, actieve provider, fallbackproviders en providerconfiguratiestatus.
    - `tts.providers` retourneert de zichtbare TTS-providerinventaris.
    - `tts.enable` en `tts.disable` schakelen de TTS-voorkeursstatus om.
    - `tts.setProvider` werkt de voorkeurs-TTS-provider bij.
    - `tts.convert` voert een eenmalige tekst-naar-spraakconversie uit.

  </Accordion>

  <Accordion title="Geheimen, configuratie, update en wizard">
    - `secrets.reload` lost actieve SecretRefs opnieuw op en wisselt de runtimegeheimstatus alleen bij volledig succes.
    - `secrets.resolve` lost geheimentoewijzingen voor commandodoelen op voor een specifieke commando-/doelset.
    - `config.get` retourneert de huidige configuratiesnapshot en hash.
    - `config.set` schrijft een gevalideerde configuratiepayload.
    - `config.patch` voegt een gedeeltelijke configuratie-update samen.
    - `config.apply` valideert + vervangt de volledige configuratiepayload.
    - `config.schema` retourneert de live configuratieschemapayload die wordt gebruikt door Control UI- en CLI-tooling: schema, `uiHints`, versie en generatiemetadata, inclusief plugin- + kanaalschemametadata wanneer de runtime deze kan laden. Het schema bevat veldmetadata voor `title` / `description` die is afgeleid van dezelfde labels en helptekst die door de UI worden gebruikt, inclusief geneste object-, wildcard-, array-item- en `anyOf` / `oneOf` / `allOf`-compositietakken wanneer bijpassende velddocumentatie bestaat.
    - `config.schema.lookup` retourneert een padgescopeerde lookuppayload voor één configuratiepad: genormaliseerd pad, een oppervlakkige schemaknoop, gematchte hint + `hintPath`, en directe kindsamenvattingen voor UI/CLI-drilldown. Lookupschemaknopen behouden de gebruikersgerichte documentatie en algemene validatievelden (`title`, `description`, `type`, `enum`, `const`, `format`, `pattern`, numerieke/string-/array-/objectgrenzen en vlaggen zoals `additionalProperties`, `deprecated`, `readOnly`, `writeOnly`). Kindsamenvattingen geven `key`, genormaliseerd `path`, `type`, `required`, `hasChildren` plus de gematchte `hint` / `hintPath` weer.
    - `update.run` voert de Gateway-updateflow uit en plant alleen een herstart wanneer de update zelf is geslaagd; aanroepers met een sessie kunnen `continuationMessage` opnemen zodat het opstarten één vervolgbeurt van de agent hervat via de wachtrij voor herstartvoortzetting. Updates via pakketbeheerders forceren na de pakketwissel een niet-uitgestelde updateherstart zonder cooldown, zodat het oude Gateway-proces niet lazy blijft laden vanuit een vervangen `dist`-boom.
    - `update.status` retourneert de nieuwste gecachte updateherstart-sentinel, inclusief de na de herstart draaiende versie wanneer beschikbaar.
    - `wizard.start`, `wizard.next`, `wizard.status` en `wizard.cancel` stellen de onboardingwizard beschikbaar via WS RPC.

  </Accordion>

  <Accordion title="Agent- en workspacehelpers">
    - `agents.list` retourneert geconfigureerde agentvermeldingen, inclusief effectief model en runtimemetadata.
    - `agents.create`, `agents.update` en `agents.delete` beheren agentrecords en workspacebedrading.
    - `agents.files.list`, `agents.files.get` en `agents.files.set` beheren de bootstrapworkspacebestanden die voor een agent worden blootgesteld.
    - `artifacts.list`, `artifacts.get` en `artifacts.download` stellen uit transcript afgeleide artifactsamenvattingen en downloads beschikbaar voor een expliciete scope `sessionKey`, `runId` of `taskId`. Run- en taakquery's lossen de eigenaarsessie server-side op en retourneren alleen transcriptmedia met overeenkomende herkomst; onveilige of lokale URL-bronnen retourneren niet-ondersteunde downloads in plaats van server-side te fetchen.
    - `environments.list` en `environments.status` stellen alleen-lezen Gateway-lokale en Node-omgevingsdetectie beschikbaar voor SDK-clients.
    - `agent.identity.get` retourneert de effectieve assistentidentiteit voor een agent of sessie.
    - `agent.wait` wacht tot een run is voltooid en retourneert de terminale snapshot wanneer beschikbaar.

  </Accordion>

  <Accordion title="Sessiebesturing">
    - `sessions.list` retourneert de huidige sessie-index, inclusief `agentRuntime`-metadata per rij wanneer een backend voor agentruntime is geconfigureerd.
    - `sessions.subscribe` en `sessions.unsubscribe` schakelen sessiewijzigingseventabonnementen voor de huidige WS-client in of uit.
    - `sessions.messages.subscribe` en `sessions.messages.unsubscribe` schakelen transcript-/berichteventabonnementen voor één sessie in of uit.
    - `sessions.preview` retourneert begrensde transcriptpreviews voor specifieke sessiesleutels.
    - `sessions.describe` retourneert één Gateway-sessierij voor een exacte sessiesleutel.
    - `sessions.resolve` lost een sessiedoel op of canoniseert het.
    - `sessions.create` maakt een nieuwe sessievermelding.
    - `sessions.send` verzendt een bericht naar een bestaande sessie.
    - `sessions.steer` is de interrupt-and-steer-variant voor een actieve sessie.
    - `sessions.abort` breekt actief werk voor een sessie af. Een aanroeper kan `key` plus optioneel `runId` doorgeven, of alleen `runId` doorgeven voor actieve runs die de Gateway naar een sessie kan herleiden.
    - `sessions.patch` werkt sessiemetadata/overrides bij en rapporteert het opgeloste canonieke model plus effectieve `agentRuntime`.
    - `sessions.reset`, `sessions.delete` en `sessions.compact` voeren sessieonderhoud uit.
    - `sessions.get` retourneert de volledige opgeslagen sessierij.
    - Chatuitvoering gebruikt nog steeds `chat.history`, `chat.send`, `chat.abort` en `chat.inject`. `chat.history` is display-genormaliseerd voor UI-clients: inline directivetags worden uit zichtbare tekst gestript, plattetekst-XML-payloads voor toolaanroepen (inclusief `<tool_call>...</tool_call>`, `<function_call>...</function_call>`, `<tool_calls>...</tool_calls>`, `<function_calls>...</function_calls>` en afgekorte toolaanroepblokken) en gelekte ASCII-/full-width-modelcontroletokens worden gestript, pure silent-token-assistentrijen zoals exacte `NO_REPLY` / `no_reply` worden weggelaten, en te grote rijen kunnen worden vervangen door placeholders.

  </Accordion>

  <Accordion title="Apparaatkoppeling en apparaattokens">
    - `device.pair.list` retourneert wachtende en goedgekeurde gekoppelde apparaten.
    - `device.pair.approve`, `device.pair.reject` en `device.pair.remove` beheren apparaatkoppelingsrecords.
    - `device.token.rotate` roteert een gekoppeld apparaattoken binnen de grenzen van de goedgekeurde rol en aanroeperscope.
    - `device.token.revoke` trekt een gekoppeld apparaattoken in binnen de grenzen van de goedgekeurde rol en aanroeperscope.

  </Accordion>

  <Accordion title="Node-koppeling, invoke en wachtend werk">
    - `node.pair.request`, `node.pair.list`, `node.pair.approve`, `node.pair.reject`, `node.pair.remove` en `node.pair.verify` dekken Node-koppeling en bootstrapverificatie.
    - `node.list` en `node.describe` retourneren bekende/verbonden Node-status.
    - `node.rename` werkt een gekoppeld Node-label bij.
    - `node.invoke` stuurt een commando door naar een verbonden Node.
    - `node.invoke.result` retourneert het resultaat voor een invoke-aanvraag.
    - `node.event` draagt events afkomstig van Nodes terug naar de Gateway.
    - `node.canvas.capability.refresh` vernieuwt gescopeerde canvas-capabilitytokens.
    - `node.pending.pull` en `node.pending.ack` zijn de queue-API's voor verbonden Nodes.
    - `node.pending.enqueue` en `node.pending.drain` beheren duurzaam wachtend werk voor offline/losgekoppelde Nodes.

  </Accordion>

  <Accordion title="Goedkeuringsfamilies">
    - `exec.approval.request`, `exec.approval.get`, `exec.approval.list` en `exec.approval.resolve` dekken eenmalige exec-goedkeuringsverzoeken plus opzoeken/opnieuw afspelen van wachtende goedkeuringen.
    - `exec.approval.waitDecision` wacht op één wachtende exec-goedkeuring en retourneert de definitieve beslissing (of `null` bij een time-out).
    - `exec.approvals.get` en `exec.approvals.set` beheren Gateway-snapshots van het exec-goedkeuringsbeleid.
    - `exec.approvals.node.get` en `exec.approvals.node.set` beheren Node-lokaal exec-goedkeuringsbeleid via Node-relayopdrachten.
    - `plugin.approval.request`, `plugin.approval.list`, `plugin.approval.waitDecision` en `plugin.approval.resolve` dekken door Plugins gedefinieerde goedkeuringsstromen.

  </Accordion>

  <Accordion title="Automatisering, Skills en tools">
    - Automatisering: `wake` plant een onmiddellijke of volgende-Heartbeat-injectie van wake-tekst; `cron.list`, `cron.status`, `cron.add`, `cron.update`, `cron.remove`, `cron.run`, `cron.runs` beheren gepland werk.
    - Skills en tools: `commands.list`, `skills.*`, `tools.catalog`, `tools.effective`, `tools.invoke`.

  </Accordion>
</AccordionGroup>

### Veelvoorkomende gebeurtenisfamilies

- `chat`: UI-chatupdates zoals `chat.inject` en andere transcript-only chatgebeurtenissen.
- `session.message` en `session.tool`: transcript-/eventstream-updates voor een
  geabonneerde sessie.
- `sessions.changed`: sessie-index of metadata gewijzigd.
- `presence`: updates van systeemaanwezigheidssnapshots.
- `tick`: periodieke keepalive-/liveness-gebeurtenis.
- `health`: update van Gateway-gezondheidssnapshot.
- `heartbeat`: update van Heartbeat-eventstream.
- `cron`: wijzigingsgebeurtenis voor Cron-run/-taak.
- `shutdown`: melding van Gateway-afsluiting.
- `node.pair.requested` / `node.pair.resolved`: lifecycle van Node-koppeling.
- `node.invoke.request`: broadcast van Node-aanroepverzoek.
- `device.pair.requested` / `device.pair.resolved`: lifecycle van gekoppeld apparaat.
- `voicewake.changed`: configuratie van wake-word-trigger gewijzigd.
- `exec.approval.requested` / `exec.approval.resolved`: lifecycle van exec-goedkeuring.
- `plugin.approval.requested` / `plugin.approval.resolved`: lifecycle van Plugin-goedkeuring.

### Node-helpmethoden

- Nodes kunnen `skills.bins` aanroepen om de huidige lijst met uitvoerbare skill-bestanden
  voor auto-allow-controles op te halen.

### Operator-helpmethoden

- Operators kunnen `commands.list` (`operator.read`) aanroepen om de runtime
  opdrachtinventaris voor een agent op te halen.
  - `agentId` is optioneel; laat dit weg om de standaard agentwerkruimte te lezen.
  - `scope` bepaalt op welk oppervlak de primaire `name` is gericht:
    - `text` retourneert het primaire tekst-opdrachttoken zonder de voorafgaande `/`
    - `native` en het standaardpad `both` retourneren providerbewuste native namen
      wanneer beschikbaar
  - `textAliases` bevat exacte slash-aliassen zoals `/model` en `/m`.
  - `nativeName` bevat de providerbewuste native opdrachtnaam wanneer die bestaat.
  - `provider` is optioneel en beïnvloedt alleen native naamgeving plus beschikbaarheid van native Plugin-opdrachten.
  - `includeArgs=false` laat geserialiseerde argumentmetadata weg uit het antwoord.
- Operators kunnen `tools.catalog` (`operator.read`) aanroepen om de runtime-toolcatalogus voor een
  agent op te halen. Het antwoord bevat gegroepeerde tools en herkomstmetadata:
  - `source`: `core` of `plugin`
  - `pluginId`: Plugin-eigenaar wanneer `source="plugin"`
  - `optional`: of een Plugin-tool optioneel is
- Operators kunnen `tools.effective` (`operator.read`) aanroepen om de runtime-effectieve
  toolinventaris voor een sessie op te halen.
  - `sessionKey` is vereist.
  - De Gateway leidt vertrouwde runtimecontext server-side af uit de sessie in plaats van
    door de aanroeper aangeleverde auth- of deliverycontext te accepteren.
  - Het antwoord is sessiegebonden en weerspiegelt wat het actieve gesprek op dit moment kan gebruiken,
    inclusief core-, Plugin- en kanaaltools.
- Operators kunnen `tools.invoke` (`operator.write`) aanroepen om één beschikbare tool aan te roepen via hetzelfde
  Gateway-beleidspad als `/tools/invoke`.
  - `name` is vereist. `args`, `sessionKey`, `agentId`, `confirm` en
    `idempotencyKey` zijn optioneel.
  - Als zowel `sessionKey` als `agentId` aanwezig zijn, moet de opgeloste sessie-agent overeenkomen met
    `agentId`.
  - Het antwoord is een SDK-gerichte envelope met `ok`, `toolName`, optionele `output` en getypeerde
    `error`-velden. Goedkeurings- of beleidsweigeringen retourneren `ok:false` in de payload in plaats van
    de Gateway-toolbeleidspijplijn te omzeilen.
- Operators kunnen `skills.status` (`operator.read`) aanroepen om de zichtbare
  skill-inventaris voor een agent op te halen.
  - `agentId` is optioneel; laat dit weg om de standaard agentwerkruimte te lezen.
  - Het antwoord bevat geschiktheid, ontbrekende vereisten, configuratiecontroles en
    opgeschoonde installatieopties zonder onbewerkte geheime waarden bloot te stellen.
- Operators kunnen `skills.search` en `skills.detail` (`operator.read`) aanroepen voor
  ClawHub-ontdekkingsmetadata.
- Operators kunnen `skills.install` (`operator.admin`) in twee modi aanroepen:
  - ClawHub-modus: `{ source: "clawhub", slug, version?, force? }` installeert een
    skill-map in de standaard `skills/`-directory van de agentwerkruimte.
  - Gateway-installatiemodus: `{ name, installId, dangerouslyForceUnsafeInstall?, timeoutMs? }`
    voert een gedeclareerde `metadata.openclaw.install`-actie uit op de Gateway-host.
- Operators kunnen `skills.update` (`operator.admin`) in twee modi aanroepen:
  - ClawHub-modus werkt één gevolgde slug bij of alle gevolgde ClawHub-installaties in
    de standaard agentwerkruimte.
  - Configuratiemodus patcht `skills.entries.<skillKey>`-waarden zoals `enabled`,
    `apiKey` en `env`.

### `models.list`-weergaven

`models.list` accepteert een optionele parameter `view`:

- Weggelaten of `"default"`: huidig runtimegedrag. Als `agents.defaults.models` is geconfigureerd, is het antwoord de toegestane catalogus; anders is het antwoord de volledige Gateway-catalogus.
- `"configured"`: gedrag op picker-formaat. Als `agents.defaults.models` is geconfigureerd, blijft dit leidend. Anders gebruikt het antwoord expliciete `models.providers.*.models`-items, met een fallback naar de volledige catalogus alleen wanneer er geen geconfigureerde modelrijen bestaan.
- `"all"`: volledige Gateway-catalogus, waarbij `agents.defaults.models` wordt omzeild. Gebruik dit voor diagnostiek en discovery-UI's, niet voor normale modelpickers.

## Exec-goedkeuringen

- Wanneer een exec-verzoek goedkeuring nodig heeft, broadcast de gateway `exec.approval.requested`.
- Operator-clients lossen dit op door `exec.approval.resolve` aan te roepen (vereist `operator.approvals`-scope).
- Voor `host=node` moet `exec.approval.request` `systemRunPlan` bevatten (canonieke `argv`/`cwd`/`rawCommand`/sessiemetadata). Verzoeken zonder `systemRunPlan` worden geweigerd.
- Na goedkeuring hergebruiken doorgestuurde `node.invoke system.run`-aanroepen dat canonieke
  `systemRunPlan` als de gezaghebbende context voor opdracht/cwd/sessie.
- Als een aanroeper `command`, `rawCommand`, `cwd`, `agentId` of
  `sessionKey` wijzigt tussen prepare en de uiteindelijk goedgekeurde `system.run`-forward, weigert de
  gateway de run in plaats van de gewijzigde payload te vertrouwen.

## Fallback voor agentlevering

- `agent`-verzoeken kunnen `deliver=true` bevatten om uitgaande levering aan te vragen.
- `bestEffortDeliver=false` behoudt strikt gedrag: onopgeloste of alleen-interne leveringsdoelen retourneren `INVALID_REQUEST`.
- `bestEffortDeliver=true` staat fallback naar uitvoering alleen binnen de sessie toe wanneer er geen extern leverbare route kan worden opgelost (bijvoorbeeld interne/webchat-sessies of dubbelzinnige multichannel-configuraties).

## Versionering

- `PROTOCOL_VERSION` staat in `src/gateway/protocol/schema/protocol-schemas.ts`.
- Clients sturen `minProtocol` + `maxProtocol`; de server weigert mismatches.
- Schema's + modellen worden gegenereerd vanuit TypeBox-definities:
  - `pnpm protocol:gen`
  - `pnpm protocol:gen:swift`
  - `pnpm protocol:check`

### Clientconstanten

De referentieclient in `src/gateway/client.ts` gebruikt deze standaardwaarden. Waarden zijn
stabiel binnen protocol v3 en zijn de verwachte baseline voor clients van derden.

| Constante                                 | Standaard                                             | Bron                                                                                       |
| ----------------------------------------- | ----------------------------------------------------- | ------------------------------------------------------------------------------------------ |
| `PROTOCOL_VERSION`                        | `3`                                                   | `src/gateway/protocol/schema/protocol-schemas.ts`                                          |
| Verzoektimeout (per RPC)                  | `30_000` ms                                           | `src/gateway/client.ts` (`requestTimeoutMs`)                                               |
| Preauth-/connect-challenge-timeout        | `15_000` ms                                           | `src/gateway/handshake-timeouts.ts` (config/env kan het gekoppelde server-/clientbudget verhogen) |
| Initiële reconnect-backoff                | `1_000` ms                                            | `src/gateway/client.ts` (`backoffMs`)                                                      |
| Maximale reconnect-backoff                | `30_000` ms                                           | `src/gateway/client.ts` (`scheduleReconnect`)                                              |
| Fast-retry-klem na sluiten door apparaattoken | `250` ms                                          | `src/gateway/client.ts`                                                                    |
| Force-stop-grace vóór `terminate()`       | `250` ms                                              | `FORCE_STOP_TERMINATE_GRACE_MS`                                                            |
| Standaardtimeout voor `stopAndWait()`     | `1_000` ms                                            | `STOP_AND_WAIT_TIMEOUT_MS`                                                                 |
| Standaard tickinterval (vóór `hello-ok`)  | `30_000` ms                                           | `src/gateway/client.ts`                                                                    |
| Sluiten bij tick-timeout                  | code `4000` wanneer stilte langer duurt dan `tickIntervalMs * 2` | `src/gateway/client.ts`                                                                    |
| `MAX_PAYLOAD_BYTES`                       | `25 * 1024 * 1024` (25 MB)                            | `src/gateway/server-constants.ts`                                                          |

De server adverteert de effectieve `policy.tickIntervalMs`, `policy.maxPayload`
en `policy.maxBufferedBytes` in `hello-ok`; clients moeten die waarden respecteren
in plaats van de standaardwaarden van vóór de handshake.

## Authenticatie

- Shared-secret Gateway-authenticatie gebruikt `connect.params.auth.token` of
  `connect.params.auth.password`, afhankelijk van de geconfigureerde auth-modus.
- Modi met identiteit, zoals Tailscale Serve
  (`gateway.auth.allowTailscale: true`) of niet-loopback
  `gateway.auth.mode: "trusted-proxy"`, voldoen aan de connect-auth-controle via
  requestheaders in plaats van `connect.params.auth.*`.
- Private-ingress `gateway.auth.mode: "none"` slaat shared-secret connect-authenticatie
  volledig over; stel die modus niet bloot op publieke/niet-vertrouwde ingress.
- Na koppeling geeft de Gateway een **apparaattoken** uit dat is beperkt tot de verbindingsrol
  + scopes. Het wordt geretourneerd in `hello-ok.auth.deviceToken` en moet door
  de client worden bewaard voor toekomstige verbindingen.
- Clients moeten de primaire `hello-ok.auth.deviceToken` bewaren na elke
  succesvolle verbinding.
- Opnieuw verbinden met dat **opgeslagen** apparaattoken moet ook de opgeslagen
  goedgekeurde scopeset voor dat token hergebruiken. Dit behoudt lees-/probe-/statustoegang
  die al was verleend en voorkomt dat herverbindingen stilzwijgend terugvallen
  naar een beperktere impliciete scope met alleen adminrechten.
- Client-side samenstelling van connect-auth (`selectConnectAuth` in
  `src/gateway/client.ts`):
  - `auth.password` staat los hiervan en wordt altijd doorgestuurd wanneer ingesteld.
  - `auth.token` wordt gevuld op prioriteitsvolgorde: eerst een expliciet gedeeld token,
    daarna een expliciete `deviceToken`, daarna een opgeslagen token per apparaat (gesleuteld op
    `deviceId` + `role`).
  - `auth.bootstrapToken` wordt alleen verzonden wanneer geen van bovenstaande opties een
    `auth.token` heeft opgeleverd. Een gedeeld token of een opgelost apparaattoken onderdrukt het.
  - Automatische promotie van een opgeslagen apparaattoken bij de eenmalige
    `AUTH_TOKEN_MISMATCH`-retry is beperkt tot **alleen vertrouwde endpoints**:
    loopback, of `wss://` met een vastgepinde `tlsFingerprint`. Publieke `wss://`
    zonder pinning komt niet in aanmerking.
- Aanvullende vermeldingen in `hello-ok.auth.deviceTokens` zijn bootstrap-overdrachtstokens.
  Bewaar ze alleen wanneer de verbinding bootstrap-auth gebruikte op een vertrouwd transport
  zoals `wss://` of loopback/lokale koppeling.
- Als een client een **expliciete** `deviceToken` of expliciete `scopes` opgeeft, blijft die
  door de aanroeper gevraagde scopeset leidend; gecachete scopes worden alleen
  hergebruikt wanneer de client het opgeslagen token per apparaat hergebruikt.
- Apparaattokens kunnen worden geroteerd/ingetrokken via `device.token.rotate` en
  `device.token.revoke` (vereist de scope `operator.pairing`).
- `device.token.rotate` retourneert rotatiemetadata. Het echoot het vervangende
  bearer-token alleen voor aanroepen vanaf hetzelfde apparaat die al met dat
  apparaattoken zijn geauthenticeerd, zodat clients met alleen een token hun vervanging kunnen
  bewaren voordat ze opnieuw verbinden. Rotaties via gedeelde/admin-auth echoën het bearer-token niet.
- Tokenuitgifte, rotatie en intrekking blijven beperkt tot de goedgekeurde rollenset
  die in de koppelingsvermelding van dat apparaat is vastgelegd; tokenmutatie kan geen
  apparaatrol uitbreiden of targeten die nooit door koppelingsgoedkeuring is verleend.
- Voor gekoppelde apparaattokensessies is apparaatbeheer self-scoped, tenzij de
  aanroeper ook `operator.admin` heeft: niet-adminaanroepers kunnen alleen hun **eigen**
  apparaatvermelding verwijderen/intrekken/roteren.
- `device.token.rotate` en `device.token.revoke` controleren ook de scopeset van het doeloperator-token
  tegen de huidige sessiescopes van de aanroeper. Niet-adminaanroepers
  kunnen geen breder operator-token roteren of intrekken dan ze zelf al hebben.
- Auth-fouten bevatten `error.details.code` plus herstelhints:
  - `error.details.canRetryWithDeviceToken` (boolean)
  - `error.details.recommendedNextStep` (`retry_with_device_token`, `update_auth_configuration`, `update_auth_credentials`, `wait_then_retry`, `review_auth_configuration`)
- Clientgedrag voor `AUTH_TOKEN_MISMATCH`:
  - Vertrouwde clients mogen één begrensde retry proberen met een gecachet token per apparaat.
  - Als die retry mislukt, moeten clients automatische herverbindingslussen stoppen en begeleiding voor operatoractie tonen.

## Apparaatidentiteit + koppeling

- Nodes moeten een stabiele apparaatidentiteit (`device.id`) bevatten die is afgeleid van een
  keypair-fingerprint.
- Gateways geven tokens uit per apparaat + rol.
- Koppelingsgoedkeuringen zijn vereist voor nieuwe apparaat-ID's, tenzij lokale automatische goedkeuring
  is ingeschakeld.
- Automatische koppelingsgoedkeuring is gericht op directe local loopback-verbindingen.
- OpenClaw heeft ook een smal backend/container-lokaal self-connect-pad voor
  vertrouwde shared-secret helperflows.
- Same-host tailnet- of LAN-verbindingen worden voor koppeling nog steeds als remote behandeld en
  vereisen goedkeuring.
- WS-clients nemen normaal gesproken `device`-identiteit op tijdens `connect` (operator +
  node). De enige apparaatloze operatorexcepties zijn expliciete vertrouwenspaden:
  - `gateway.controlUi.allowInsecureAuth=true` voor localhost-only compatibiliteit met onveilige HTTP.
  - succesvolle operator-Control UI-authenticatie met `gateway.auth.mode: "trusted-proxy"`.
  - `gateway.controlUi.dangerouslyDisableDeviceAuth=true` (noodmaatregel, ernstige beveiligingsverlaging).
  - direct-loopback `gateway-client` backend-RPC's die zijn geauthenticeerd met het gedeelde
    Gateway-token/wachtwoord.
- Alle verbindingen moeten de door de server verstrekte `connect.challenge` nonce ondertekenen.

### Diagnostiek voor migratie van apparaatauthenticatie

Voor legacy clients die nog pre-challenge ondertekeningsgedrag gebruiken, retourneert `connect` nu
`DEVICE_AUTH_*`-detailcodes onder `error.details.code` met een stabiele `error.details.reason`.

Veelvoorkomende migratiefouten:

| Bericht                    | details.code                     | details.reason           | Betekenis                                          |
| -------------------------- | -------------------------------- | ------------------------ | -------------------------------------------------- |
| `device nonce required`    | `DEVICE_AUTH_NONCE_REQUIRED`     | `device-nonce-missing`   | Client liet `device.nonce` weg (of stuurde leeg).  |
| `device nonce mismatch`    | `DEVICE_AUTH_NONCE_MISMATCH`     | `device-nonce-mismatch`  | Client ondertekende met een verouderde/verkeerde nonce. |
| `device signature invalid` | `DEVICE_AUTH_SIGNATURE_INVALID`  | `device-signature`       | Signature-payload komt niet overeen met v2-payload. |
| `device signature expired` | `DEVICE_AUTH_SIGNATURE_EXPIRED`  | `device-signature-stale` | Ondertekende timestamp valt buiten de toegestane skew. |
| `device identity mismatch` | `DEVICE_AUTH_DEVICE_ID_MISMATCH` | `device-id-mismatch`     | `device.id` komt niet overeen met public-key-fingerprint. |
| `device public key invalid` | `DEVICE_AUTH_PUBLIC_KEY_INVALID` | `device-public-key`      | Public-key-formaat/canonicalisatie is mislukt.     |

Migratiedoel:

- Wacht altijd op `connect.challenge`.
- Onderteken de v2-payload die de servernonce bevat.
- Stuur dezelfde nonce in `connect.params.device.nonce`.
- De voorkeurs-signature-payload is `v3`, die `platform` en `deviceFamily` bindt
  naast de velden device/client/role/scopes/token/nonce.
- Legacy `v2`-signatures blijven geaccepteerd voor compatibiliteit, maar pinning van
  gekoppelde apparaatmetadata blijft het commandobeleid bij herverbinding bepalen.

## TLS + pinning

- TLS wordt ondersteund voor WS-verbindingen.
- Clients kunnen optioneel de Gateway-certificaatfingerprint pinnen (zie de `gateway.tls`-
  configuratie plus `gateway.remote.tlsFingerprint` of CLI `--tls-fingerprint`).

## Bereik

Dit protocol stelt de **volledige Gateway-API** beschikbaar (status, kanalen, modellen, chat,
agent, sessies, nodes, goedkeuringen, enz.). Het exacte oppervlak wordt gedefinieerd door de
TypeBox-schema's in `src/gateway/protocol/schema.ts`.

## Gerelateerd

- [Bridge-protocol](/nl/gateway/bridge-protocol)
- [Gateway-runbook](/nl/gateway)
