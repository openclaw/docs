---
read_when:
    - Gateway-WS-clients implementeren of bijwerken
    - Foutopsporing bij protocolincompatibiliteiten of verbindingsfouten
    - Protocolschema en -modellen opnieuw genereren
summary: 'Gateway WebSocket-protocol: handshake, frames, versionering'
title: Gateway-protocol
x-i18n:
    generated_at: "2026-05-01T11:18:16Z"
    model: gpt-5.5
    provider: openai
    source_hash: 8295e4e416250e7381393c0aa6a0016719f96552485cf9d56bb3896c9704c4a9
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
  `hello-ok.policy.maxBufferedBytes` volgen. Als diagnostics is ingeschakeld,
  sturen te grote inkomende frames en trage uitgaande buffers `payload.large`-events
  voordat de Gateway het betreffende frame sluit of laat vallen. Deze events bewaren
  groottes, limieten, surfaces en veilige redencodes. Ze bewaren niet de berichttekst,
  attachment-inhoud, ruwe frame-body, tokens, cookies of geheime waarden.

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

Terwijl de Gateway startup-sidecars nog afrondt, kan het `connect`-request
een opnieuw te proberen `UNAVAILABLE`-fout retourneren waarbij `details.reason` is ingesteld op
`"startup-sidecars"` en `retryAfterMs`. Clients moeten die respons opnieuw proberen
binnen hun totale verbindingsbudget, in plaats van deze als een terminale
handshake-fout te tonen.

`server`, `features`, `snapshot` en `policy` zijn allemaal vereist door het schema
(`src/gateway/protocol/schema/frames.ts`). `auth` is ook vereist en rapporteert
de onderhandelde rol/scopes. `canvasHostUrl` is optioneel.

Wanneer er geen device-token wordt uitgegeven, rapporteert `hello-ok.auth` de onderhandelde
rechten zonder tokenvelden:

```json
{
  "auth": {
    "role": "operator",
    "scopes": ["operator.read", "operator.write"]
  }
}
```

Vertrouwde backend-clients in hetzelfde proces (`client.id: "gateway-client"`,
`client.mode: "backend"`) mogen `device` weglaten bij directe loopback-verbindingen wanneer
ze authenticeren met het gedeelde Gateway-token/wachtwoord. Dit pad is gereserveerd
voor interne control-plane-RPC's en voorkomt dat verouderde CLI/device-pairingbaselines
lokaal backend-werk blokkeren, zoals updates van subagent-sessies. Externe clients,
browser-origin-clients, node-clients en expliciete device-token/device-identity-clients
gebruiken nog steeds de normale pairing- en scope-upgradecontroles.

Wanneer er een device-token wordt uitgegeven, bevat `hello-ok` ook:

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

Voor de ingebouwde node/operator-bootstrapflow blijft het primaire node-token
`scopes: []` en blijft elk overgedragen operator-token begrensd tot de bootstrap
operator-allowlist (`operator.approvals`, `operator.read`,
`operator.talk.secrets`, `operator.write`). Bootstrap-scopecontroles blijven
rolgeprefixd: operator-vermeldingen voldoen alleen aan operator-requests, en niet-operatorrollen
hebben nog steeds scopes nodig onder hun eigen rolprefix.

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

Methoden met neveneffecten vereisen **idempotency keys** (zie schema).

## Rollen + scopes

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

Door Plugins geregistreerde Gateway-RPC-methoden kunnen hun eigen operator-scope aanvragen, maar
gereserveerde core-adminprefixen (`config.*`, `exec.approvals.*`, `wizard.*`,
`update.*`) worden altijd herleid tot `operator.admin`.

Method-scope is alleen de eerste controle. Sommige slash-commands die via
`chat.send` worden bereikt, passen daarbovenop strengere command-levelcontroles toe. Bijvoorbeeld: persistente
`/config set`- en `/config unset`-writes vereisen `operator.admin`.

`node.pair.approve` heeft ook een extra scopecontrole tijdens goedkeuring bovenop de
basismethod-scope:

- requests zonder command: `operator.pairing`
- requests met niet-exec node-commands: `operator.pairing` + `operator.write`
- requests die `system.run`, `system.run.prepare` of `system.which` bevatten:
  `operator.pairing` + `operator.admin`

### Caps/commands/permissions (node)

Nodes declareren capability-claims tijdens het verbinden:

- `caps`: capability-categorieën op hoog niveau.
- `commands`: command-allowlist voor invoke.
- `permissions`: fijnmazige toggles (bijv. `screen.record`, `camera.capture`).

De Gateway behandelt deze als **claims** en dwingt server-side allowlists af.

## Presence

- `system-presence` retourneert vermeldingen met device-identiteit als sleutel.
- Presence-vermeldingen bevatten `deviceId`, `roles` en `scopes`, zodat UI's één rij per device kunnen tonen
  ook wanneer het zowel als **operator** als **node** verbonden is.
- `node.list` bevat optionele velden `lastSeenAtMs` en `lastSeenReason`. Verbonden nodes rapporteren
  hun huidige verbindingstijd als `lastSeenAtMs` met reden `connect`; gekoppelde nodes kunnen ook
  duurzame achtergrondpresence rapporteren wanneer een vertrouwd node-event hun pairing-metadata bijwerkt.

### Node-background-alive-event

Nodes kunnen `node.event` aanroepen met `event: "node.presence.alive"` om vast te leggen dat een gekoppelde node
leefde tijdens een achtergrond-wake zonder deze als verbonden te markeren.

```json
{
  "event": "node.presence.alive",
  "payloadJSON": "{\"trigger\":\"silent_push\",\"sentAtMs\":1737264000000,\"displayName\":\"Peter's iPhone\",\"version\":\"2026.4.28\",\"platform\":\"iOS 18.4.0\",\"deviceFamily\":\"iPhone\",\"modelIdentifier\":\"iPhone17,1\",\"pushTransport\":\"relay\"}"
}
```

`trigger` is een gesloten enum: `background`, `silent_push`, `bg_app_refresh`,
`significant_location`, `manual` of `connect`. Onbekende trigger-strings worden door de Gateway
genormaliseerd naar `background` voordat ze worden opgeslagen. Het event is alleen duurzaam voor geauthenticeerde node-
device-sessies; sessies zonder device of zonder pairing retourneren `handled: false`.

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
bevestigde RPC, niet als duurzame presence-opslag.

## Scoping van broadcast-events

Door de server gepushte WebSocket-broadcast-events zijn scope-gated, zodat pairing-scoped of node-only sessies niet passief sessie-inhoud ontvangen.

- **Chat-, agent- en tool-result-frames** (inclusief gestreamde `agent`-events en resultaten van tool-calls) vereisen ten minste `operator.read`. Sessies zonder `operator.read` slaan deze frames volledig over.
- **Door Plugins gedefinieerde `plugin.*`-broadcasts** worden gated op `operator.write` of `operator.admin`, afhankelijk van hoe de Plugin ze heeft geregistreerd.
- **Status- en transportevents** (`heartbeat`, `presence`, `tick`, connect/disconnect-lifecycle, enz.) blijven onbeperkt, zodat transportgezondheid zichtbaar blijft voor elke geauthenticeerde sessie.
- **Onbekende broadcast-eventfamilies** zijn standaard scope-gated (fail-closed), tenzij een geregistreerde handler ze expliciet versoepelt.

Elke clientverbinding houdt een eigen sequence number per client bij, zodat broadcasts monotone volgorde op die socket behouden, zelfs wanneer verschillende clients verschillende scope-gefilterde subsets van de eventstream zien.

## Veelvoorkomende RPC-methodfamilies

Het openbare WS-surface is breder dan de handshake/auth-voorbeelden hierboven. Dit
is geen gegenereerde dump — `hello-ok.features.methods` is een conservatieve
discoverylijst opgebouwd uit `src/gateway/server-methods-list.ts` plus geladen
exports van Plugin-/channel-methoden. Behandel het als feature discovery, niet als een volledige
opsomming van `src/gateway/server-methods/*.ts`.

<AccordionGroup>
  <Accordion title="Systeem en identiteit">
    - `health` retourneert de gecachete of net geprobede gateway-healthsnapshot.
    - `diagnostics.stability` retourneert de recente begrensde diagnostic stability recorder. Deze bewaart operationele metadata zoals eventnamen, aantallen, bytegroottes, geheugenmetingen, queue-/sessiestatus, channel-/Plugin-namen en sessie-ID's. Deze bewaart geen chattekst, webhook-bodies, tool-outputs, ruwe request- of response-bodies, tokens, cookies of geheime waarden. Operator-read-scope is vereist.
    - `status` retourneert de gateway-samenvatting in `/status`-stijl; gevoelige velden worden alleen opgenomen voor operator-clients met admin-scope.
    - `gateway.identity.get` retourneert de gateway-device-identiteit die wordt gebruikt door relay- en pairingflows.
    - `system-presence` retourneert de huidige presence-snapshot voor verbonden operator-/node-devices.
    - `system-event` voegt een system-event toe en kan presence-context bijwerken/broadcasten.
    - `last-heartbeat` retourneert het nieuwste opgeslagen Heartbeat-event.
    - `set-heartbeats` schakelt Heartbeat-verwerking op de Gateway in of uit.

  </Accordion>

  <Accordion title="Modellen en gebruik">
    - `models.list` retourneert de modelcatalogus die tijdens runtime is toegestaan. Geef `{ "view": "configured" }` door voor geconfigureerde modellen op picker-formaat (`agents.defaults.models` eerst, daarna `models.providers.*.models`), of `{ "view": "all" }` voor de volledige catalogus.
    - `usage.status` retourneert samenvattingen van providergebruiksvensters/resterend quotum.
    - `usage.cost` retourneert geaggregeerde kostengebruikssamenvattingen voor een datumbereik.
    - `doctor.memory.status` retourneert vectorgeheugen-/gecachete embedding-gereedheid voor de actieve standaardwerkruimte van de agent. Geef `{ "probe": true }` of `{ "deep": true }` alleen door wanneer de caller expliciet een live ping naar de embedding-provider wil.
    - `doctor.memory.remHarness` retourneert een begrensde, alleen-lezen REM-harnaspreview voor externe control-plane-clients. Deze kan werkruimtepaden, geheugenfragmenten, gerenderde grounded markdown en kandidaten voor diepe promotie bevatten, dus callers hebben `operator.read` nodig.
    - `sessions.usage` retourneert gebruikssamenvattingen per sessie.
    - `sessions.usage.timeseries` retourneert tijdreeksgebruik voor één sessie.
    - `sessions.usage.logs` retourneert gebruikslogvermeldingen voor één sessie.

  </Accordion>

  <Accordion title="Kanalen en inloghelpers">
    - `channels.status` retourneert statussamenvattingen voor ingebouwde + gebundelde kanalen/plugins.
    - `channels.logout` meldt een specifiek kanaal/account af wanneer het kanaal afmelden ondersteunt.
    - `web.login.start` start een QR-/webinlogflow voor de huidige QR-geschikte webkanaalprovider.
    - `web.login.wait` wacht tot die QR-/webinlogflow is voltooid en start het kanaal bij succes.
    - `push.test` stuurt een test-APNs-push naar een geregistreerde iOS-node.
    - `voicewake.get` retourneert de opgeslagen wake-word-triggers.
    - `voicewake.set` werkt wake-word-triggers bij en broadcast de wijziging.

  </Accordion>

  <Accordion title="Berichten en logs">
    - `send` is de directe RPC voor uitgaande levering voor verzendingen gericht op kanaal/account/thread buiten de chat-runner.
    - `logs.tail` retourneert de geconfigureerde staart van het Gateway-bestandslogboek met cursor-/limiet- en max-byte-instellingen.

  </Accordion>

  <Accordion title="Talk en TTS">
    - `talk.config` retourneert de effectieve Talk-configpayload; `includeSecrets` vereist `operator.talk.secrets` (of `operator.admin`).
    - `talk.mode` stelt de huidige Talk-modusstatus voor WebChat-/Control UI-clients in en broadcast deze.
    - `talk.speak` synthetiseert spraak via de actieve Talk-spraakprovider.
    - `tts.status` retourneert de ingeschakelde TTS-status, actieve provider, fallbackproviders en providerconfiguratiestatus.
    - `tts.providers` retourneert de zichtbare TTS-providerinventaris.
    - `tts.enable` en `tts.disable` schakelen de TTS-voorkeursstatus.
    - `tts.setProvider` werkt de gewenste TTS-provider bij.
    - `tts.convert` voert een eenmalige tekst-naar-spraakconversie uit.

  </Accordion>

  <Accordion title="Geheimen, configuratie, update en wizard">
    - `secrets.reload` lost actieve SecretRefs opnieuw op en wisselt de runtime-geheimstatus alleen bij volledig succes.
    - `secrets.resolve` lost geheime toewijzingen voor commandodoelen op voor een specifieke commando-/doelset.
    - `config.get` retourneert de huidige configuratiesnapshot en hash.
    - `config.set` schrijft een gevalideerde configuratiepayload.
    - `config.patch` voegt een gedeeltelijke configuratie-update samen.
    - `config.apply` valideert en vervangt de volledige configuratiepayload.
    - `config.schema` retourneert de live configuratieschemapayload die wordt gebruikt door Control UI- en CLI-tooling: schema, `uiHints`, versie en generatiemetadata, inclusief plugin- + kanaalschemametadata wanneer de runtime deze kan laden. Het schema bevat veldmetadata voor `title` / `description`, afgeleid van dezelfde labels en helptekst die door de UI worden gebruikt, inclusief geneste object-, wildcard-, array-item- en `anyOf` / `oneOf` / `allOf`-compositietakken wanneer overeenkomende velddocumentatie bestaat.
    - `config.schema.lookup` retourneert een path-gescopete lookuppayload voor één configuratiepad: genormaliseerd pad, een ondiepe schemanode, overeenkomende hint + `hintPath`, en directe kindsamenvattingen voor UI-/CLI-drilldown. Lookup-schemanodes behouden de gebruikersgerichte docs en algemene validatievelden (`title`, `description`, `type`, `enum`, `const`, `format`, `pattern`, numerieke/string-/array-/objectgrenzen en vlaggen zoals `additionalProperties`, `deprecated`, `readOnly`, `writeOnly`). Kindsamenvattingen tonen `key`, genormaliseerd `path`, `type`, `required`, `hasChildren`, plus de overeenkomende `hint` / `hintPath`.
    - `update.run` voert de Gateway-updateflow uit en plant alleen een herstart wanneer de update zelf is geslaagd. Package-manager-updates forceren na de pakketwissel een niet-uitgestelde updateherstart zonder cooldown, zodat het oude Gateway-proces niet lazy blijft laden vanuit een vervangen `dist`-tree.
    - `update.status` retourneert de meest recente gecachete updateherstart-sentinel, inclusief de draaiende versie na de herstart wanneer beschikbaar.
    - `wizard.start`, `wizard.next`, `wizard.status` en `wizard.cancel` stellen de onboardingwizard beschikbaar via WS RPC.

  </Accordion>

  <Accordion title="Agent- en werkruimtehelpers">
    - `agents.list` retourneert geconfigureerde agentvermeldingen, inclusief effectief model en runtimemetadata.
    - `agents.create`, `agents.update` en `agents.delete` beheren agentrecords en werkruimtebedrading.
    - `agents.files.list`, `agents.files.get` en `agents.files.set` beheren de bootstrapwerkruimtebestanden die voor een agent worden blootgesteld.
    - `artifacts.list`, `artifacts.get` en `artifacts.download` stellen uit transcript afgeleide artifactsamenvattingen en downloads beschikbaar voor een expliciete `sessionKey`-, `runId`- of `taskId`-scope. Run- en taakquery's lossen de eigenaarssessie server-side op en retourneren alleen transcriptmedia met overeenkomende herkomst; onveilige of lokale URL-bronnen retourneren niet-ondersteunde downloads in plaats van server-side op te halen.
    - `agent.identity.get` retourneert de effectieve assistentidentiteit voor een agent of sessie.
    - `agent.wait` wacht tot een run is voltooid en retourneert de eindsnapshot wanneer beschikbaar.

  </Accordion>

  <Accordion title="Sessiebeheer">
    - `sessions.list` retourneert de huidige sessie-index, inclusief `agentRuntime`-metadata per rij wanneer een agentruntime-backend is geconfigureerd.
    - `sessions.subscribe` en `sessions.unsubscribe` schakelen abonnementen op sessiewijzigingsgebeurtenissen voor de huidige WS-client.
    - `sessions.messages.subscribe` en `sessions.messages.unsubscribe` schakelen transcript-/berichtgebeurtenisabonnementen voor één sessie.
    - `sessions.preview` retourneert begrensde transcriptpreviews voor specifieke sessiesleutels.
    - `sessions.resolve` lost een sessiedoel op of canoniseert het.
    - `sessions.create` maakt een nieuwe sessievermelding.
    - `sessions.send` stuurt een bericht naar een bestaande sessie.
    - `sessions.steer` is de interrupt-and-steer-variant voor een actieve sessie.
    - `sessions.abort` breekt actief werk voor een sessie af. Een caller kan `key` plus optioneel `runId` doorgeven, of alleen `runId` doorgeven voor actieve runs die de Gateway naar een sessie kan herleiden.
    - `sessions.patch` werkt sessiemetadata/-overrides bij en rapporteert het opgeloste canonieke model plus de effectieve `agentRuntime`.
    - `sessions.reset`, `sessions.delete` en `sessions.compact` voeren sessieonderhoud uit.
    - `sessions.get` retourneert de volledige opgeslagen sessierij.
    - Chatuitvoering gebruikt nog steeds `chat.history`, `chat.send`, `chat.abort` en `chat.inject`. `chat.history` is weergavegenormaliseerd voor UI-clients: inline directive-tags worden uit zichtbare tekst verwijderd, plain-text tool-call-XML-payloads (inclusief `<tool_call>...</tool_call>`, `<function_call>...</function_call>`, `<tool_calls>...</tool_calls>`, `<function_calls>...</function_calls>` en afgekorte tool-call-blokken) en gelekte ASCII-/full-width modelcontroletokens worden verwijderd, zuivere silent-token-assistentrijen zoals exact `NO_REPLY` / `no_reply` worden weggelaten, en te grote rijen kunnen worden vervangen door placeholders.

  </Accordion>

  <Accordion title="Apparaatkoppeling en apparaattokens">
    - `device.pair.list` retourneert wachtende en goedgekeurde gekoppelde apparaten.
    - `device.pair.approve`, `device.pair.reject` en `device.pair.remove` beheren apparaatkoppelingsrecords.
    - `device.token.rotate` roteert een gekoppeld apparaattoken binnen de goedgekeurde rol- en callerscopegrenzen.
    - `device.token.revoke` trekt een gekoppeld apparaattoken in binnen de goedgekeurde rol- en callerscopegrenzen.

  </Accordion>

  <Accordion title="Node-koppeling, invoke en wachtend werk">
    - `node.pair.request`, `node.pair.list`, `node.pair.approve`, `node.pair.reject`, `node.pair.remove` en `node.pair.verify` dekken node-koppeling en bootstrapverificatie.
    - `node.list` en `node.describe` retourneren bekende/verbonden nodestatus.
    - `node.rename` werkt een gekoppeld nodelabel bij.
    - `node.invoke` stuurt een commando door naar een verbonden node.
    - `node.invoke.result` retourneert het resultaat voor een invoke-verzoek.
    - `node.event` brengt door nodes afkomstige gebeurtenissen terug naar de Gateway.
    - `node.canvas.capability.refresh` ververst gescopete canvas-capability-tokens.
    - `node.pending.pull` en `node.pending.ack` zijn de queue-API's voor verbonden nodes.
    - `node.pending.enqueue` en `node.pending.drain` beheren duurzaam wachtend werk voor offline/losgekoppelde nodes.

  </Accordion>

  <Accordion title="Goedkeuringsfamilies">
    - `exec.approval.request`, `exec.approval.get`, `exec.approval.list` en `exec.approval.resolve` dekken eenmalige exec-goedkeuringsverzoeken plus lookup/replay van wachtende goedkeuringen.
    - `exec.approval.waitDecision` wacht op één wachtende exec-goedkeuring en retourneert de definitieve beslissing (of `null` bij timeout).
    - `exec.approvals.get` en `exec.approvals.set` beheren snapshots van het Gateway-exec-goedkeuringsbeleid.
    - `exec.approvals.node.get` en `exec.approvals.node.set` beheren node-lokaal exec-goedkeuringsbeleid via node-relaycommando's.
    - `plugin.approval.request`, `plugin.approval.list`, `plugin.approval.waitDecision` en `plugin.approval.resolve` dekken door plugins gedefinieerde goedkeuringsflows.

  </Accordion>

  <Accordion title="Automatisering, skills en tools">
    - Automatisering: `wake` plant een onmiddellijke of volgende-Heartbeat wake-tekstinjectie; `cron.list`, `cron.status`, `cron.add`, `cron.update`, `cron.remove`, `cron.run`, `cron.runs` beheren gepland werk.
    - Skills en tools: `commands.list`, `skills.*`, `tools.catalog`, `tools.effective`, `tools.invoke`.

  </Accordion>
</AccordionGroup>

### Veelvoorkomende gebeurtenisfamilies

- `chat`: UI-chatupdates zoals `chat.inject` en andere chatgebeurtenissen die alleen het transcript betreffen.
- `session.message` en `session.tool`: transcript-/event-stream-updates voor een geabonneerde sessie.
- `sessions.changed`: sessie-index of metadata gewijzigd.
- `presence`: updates van systeemaanwezigheidssnapshots.
- `tick`: periodieke keepalive-/liveness-gebeurtenis.
- `health`: update van Gateway-gezondheidssnapshot.
- `heartbeat`: update van Heartbeat-eventstream.
- `cron`: wijzigingsgebeurtenis voor Cron-run/job.
- `shutdown`: Gateway-afsluitmelding.
- `node.pair.requested` / `node.pair.resolved`: levenscyclus van node-koppeling.
- `node.invoke.request`: broadcast van node-invoke-verzoek.
- `device.pair.requested` / `device.pair.resolved`: levenscyclus van gekoppeld apparaat.
- `voicewake.changed`: wake-word-triggerconfiguratie gewijzigd.
- `exec.approval.requested` / `exec.approval.resolved`: exec-goedkeuringslevenscyclus.
- `plugin.approval.requested` / `plugin.approval.resolved`: plugin-goedkeuringslevenscyclus.

### Node-helpermethoden

- Nodes kunnen `skills.bins` aanroepen om de huidige lijst met Skill-uitvoerbare bestanden op te halen voor auto-allow-controles.

### Operator-helpermethoden

- Operators kunnen `commands.list` (`operator.read`) aanroepen om de runtime
  commando-inventaris voor een agent op te halen.
  - `agentId` is optioneel; laat dit weg om de standaardagentwerkruimte te lezen.
  - `scope` bepaalt op welk oppervlak de primaire `name` is gericht:
    - `text` retourneert het primaire tekstcommandotoken zonder de voorloop-`/`
    - `native` en het standaardpad `both` retourneren provideraangepaste native namen
      wanneer beschikbaar
  - `textAliases` bevat exacte slash-aliassen zoals `/model` en `/m`.
  - `nativeName` bevat de provideraangepaste native commandonaam wanneer die bestaat.
  - `provider` is optioneel en heeft alleen invloed op native naamgeving plus beschikbaarheid van native Plugin-
    commando's.
  - `includeArgs=false` laat geserialiseerde argumentmetadata weg uit de respons.
- Operators kunnen `tools.catalog` (`operator.read`) aanroepen om de runtime-toolcatalogus voor een
  agent op te halen. De respons bevat gegroepeerde tools en herkomstmetadata:
  - `source`: `core` of `plugin`
  - `pluginId`: Plugin-eigenaar wanneer `source="plugin"`
  - `optional`: of een Plugin-tool optioneel is
- Operators kunnen `tools.effective` (`operator.read`) aanroepen om de runtime-effectieve tool-
  inventaris voor een sessie op te halen.
  - `sessionKey` is vereist.
  - De Gateway leidt vertrouwde runtimecontext server-side af uit de sessie in plaats van door de
    aanroeper aangeleverde auth- of leveringscontext te accepteren.
  - De respons is sessiegebonden en weerspiegelt wat het actieve gesprek nu kan gebruiken,
    inclusief core-, Plugin- en kanaaltools.
- Operators kunnen `tools.invoke` (`operator.write`) aanroepen om één beschikbare tool aan te roepen via hetzelfde
  Gateway-beleidspad als `/tools/invoke`.
  - `name` is vereist. `args`, `sessionKey`, `agentId`, `confirm` en
    `idempotencyKey` zijn optioneel.
  - Als zowel `sessionKey` als `agentId` aanwezig zijn, moet de opgeloste sessieagent overeenkomen met
    `agentId`.
  - De respons is een SDK-gerichte envelop met `ok`, `toolName`, optionele `output` en getypeerde
    `error`-velden. Goedkeurings- of beleidsweigeringen retourneren `ok:false` in de payload in plaats van
    de Gateway-toolbeleidspijplijn te omzeilen.
- Operators kunnen `skills.status` (`operator.read`) aanroepen om de zichtbare
  Skills-inventaris voor een agent op te halen.
  - `agentId` is optioneel; laat dit weg om de standaardagentwerkruimte te lezen.
  - De respons bevat geschiktheid, ontbrekende vereisten, configuratiecontroles en
    opgeschoonde installatieopties zonder ruwe geheime waarden bloot te leggen.
- Operators kunnen `skills.search` en `skills.detail` (`operator.read`) aanroepen voor
  ClawHub-detectiemetadata.
- Operators kunnen `skills.install` (`operator.admin`) in twee modi aanroepen:
  - ClawHub-modus: `{ source: "clawhub", slug, version?, force? }` installeert een
    skillmap in de standaardagentwerkruimte-directory `skills/`.
  - Gateway-installatiemodus: `{ name, installId, dangerouslyForceUnsafeInstall?, timeoutMs? }`
    voert een gedeclareerde `metadata.openclaw.install`-actie uit op de Gateway-host.
- Operators kunnen `skills.update` (`operator.admin`) in twee modi aanroepen:
  - ClawHub-modus werkt één gevolgde slug of alle gevolgde ClawHub-installaties bij in
    de standaardagentwerkruimte.
  - Configuratiemodus patcht `skills.entries.<skillKey>`-waarden zoals `enabled`,
    `apiKey` en `env`.

### `models.list`-weergaven

`models.list` accepteert een optionele parameter `view`:

- Weggelaten of `"default"`: huidig runtimegedrag. Als `agents.defaults.models` is geconfigureerd, is de respons de toegestane catalogus; anders is de respons de volledige Gateway-catalogus.
- `"configured"`: gedrag met picker-formaat. Als `agents.defaults.models` is geconfigureerd, heeft dit nog steeds voorrang. Anders gebruikt de respons expliciete `models.providers.*.models`-items, met terugval naar de volledige catalogus alleen wanneer er geen geconfigureerde modelrijen bestaan.
- `"all"`: volledige Gateway-catalogus, waarbij `agents.defaults.models` wordt omzeild. Gebruik dit voor diagnostiek en detectie-UI's, niet voor normale modelpickers.

## Exec-goedkeuringen

- Wanneer een exec-verzoek goedkeuring nodig heeft, broadcast de Gateway `exec.approval.requested`.
- Operator-clients lossen dit op door `exec.approval.resolve` aan te roepen (vereist `operator.approvals`-scope).
- Voor `host=node` moet `exec.approval.request` `systemRunPlan` bevatten (canonieke `argv`/`cwd`/`rawCommand`/sessiemetadata). Verzoeken zonder `systemRunPlan` worden geweigerd.
- Na goedkeuring hergebruiken doorgestuurde `node.invoke system.run`-aanroepen dat canonieke
  `systemRunPlan` als de gezaghebbende opdracht-/cwd-/sessiecontext.
- Als een aanroeper `command`, `rawCommand`, `cwd`, `agentId` of
  `sessionKey` wijzigt tussen voorbereiding en de uiteindelijk goedgekeurde `system.run`-doorsturing, weigert de
  Gateway de run in plaats van de gewijzigde payload te vertrouwen.

## Fallback voor agentlevering

- `agent`-verzoeken kunnen `deliver=true` bevatten om uitgaande levering aan te vragen.
- `bestEffortDeliver=false` behoudt strikt gedrag: niet-opgeloste of alleen-interne leveringsdoelen retourneren `INVALID_REQUEST`.
- `bestEffortDeliver=true` staat fallback naar alleen-sessie-uitvoering toe wanneer er geen extern leverbare route kan worden opgelost (bijvoorbeeld interne/webchat-sessies of dubbelzinnige multichannelconfiguraties).

## Versiebeheer

- `PROTOCOL_VERSION` staat in `src/gateway/protocol/schema/protocol-schemas.ts`.
- Clients sturen `minProtocol` + `maxProtocol`; de server weigert mismatches.
- Schema's + modellen worden gegenereerd uit TypeBox-definities:
  - `pnpm protocol:gen`
  - `pnpm protocol:gen:swift`
  - `pnpm protocol:check`

### Clientconstanten

De referentieclient in `src/gateway/client.ts` gebruikt deze standaardwaarden. Waarden zijn
stabiel in protocol v3 en vormen de verwachte baseline voor externe clients.

| Constante                                 | Standaard                                             | Bron                                                                                       |
| ----------------------------------------- | ----------------------------------------------------- | ------------------------------------------------------------------------------------------ |
| `PROTOCOL_VERSION`                        | `3`                                                   | `src/gateway/protocol/schema/protocol-schemas.ts`                                          |
| Verzoektime-out (per RPC)                 | `30_000` ms                                           | `src/gateway/client.ts` (`requestTimeoutMs`)                                               |
| Preauth- / connect-challenge-time-out     | `15_000` ms                                           | `src/gateway/handshake-timeouts.ts` (config/env kan het gekoppelde server-/clientbudget verhogen) |
| Initiële reconnect-backoff                | `1_000` ms                                            | `src/gateway/client.ts` (`backoffMs`)                                                      |
| Maximale reconnect-backoff                | `30_000` ms                                           | `src/gateway/client.ts` (`scheduleReconnect`)                                              |
| Fast-retry-klem na sluiten door apparaattoken | `250` ms                                          | `src/gateway/client.ts`                                                                    |
| Graceperiode voor geforceerd stoppen vóór `terminate()` | `250` ms                                  | `FORCE_STOP_TERMINATE_GRACE_MS`                                                            |
| Standaardtime-out voor `stopAndWait()`    | `1_000` ms                                            | `STOP_AND_WAIT_TIMEOUT_MS`                                                                 |
| Standaard tick-interval (vóór `hello-ok`) | `30_000` ms                                           | `src/gateway/client.ts`                                                                    |
| Sluiten bij tick-time-out                 | code `4000` wanneer stilte langer is dan `tickIntervalMs * 2` | `src/gateway/client.ts`                                                          |
| `MAX_PAYLOAD_BYTES`                       | `25 * 1024 * 1024` (25 MB)                            | `src/gateway/server-constants.ts`                                                          |

De server adverteert de effectieve `policy.tickIntervalMs`, `policy.maxPayload`
en `policy.maxBufferedBytes` in `hello-ok`; clients moeten die waarden respecteren
in plaats van de standaardwaarden van vóór de handshake.

## Auth

- Shared-secret-gatewayauthenticatie gebruikt `connect.params.auth.token` of
  `connect.params.auth.password`, afhankelijk van de geconfigureerde auth-modus.
- Modi met identiteit, zoals Tailscale Serve
  (`gateway.auth.allowTailscale: true`) of niet-loopback
  `gateway.auth.mode: "trusted-proxy"`, voldoen aan de connect-authenticatiecontrole via
  aanvraagheaders in plaats van `connect.params.auth.*`.
- Private-ingress `gateway.auth.mode: "none"` slaat shared-secret-connect-authenticatie
  volledig over; stel die modus niet bloot op openbare/niet-vertrouwde ingress.
- Na pairing geeft de Gateway een **device token** uit dat is beperkt tot de verbindingsrol
  + scopes. Het wordt geretourneerd in `hello-ok.auth.deviceToken` en moet door
  de client worden bewaard voor toekomstige connects.
- Clients moeten de primaire `hello-ok.auth.deviceToken` bewaren na elke
  succesvolle connect.
- Opnieuw verbinden met dat **opgeslagen** device token moet ook de opgeslagen
  goedgekeurde scopeset voor dat token hergebruiken. Dit behoudt lees-/probe-/status-toegang
  die al was verleend en voorkomt dat reconnects stilzwijgend terugvallen naar een
  smallere impliciete scope met alleen admin-rechten.
- Clientzijdige samenstelling van connect-authenticatie (`selectConnectAuth` in
  `src/gateway/client.ts`):
  - `auth.password` staat los hiervan en wordt altijd doorgestuurd wanneer ingesteld.
  - `auth.token` wordt ingevuld in prioriteitsvolgorde: eerst een expliciet shared token,
    daarna een expliciete `deviceToken`, daarna een opgeslagen token per apparaat (gesleuteld op
    `deviceId` + `role`).
  - `auth.bootstrapToken` wordt alleen verzonden wanneer geen van bovenstaande opties een
    `auth.token` heeft opgeleverd. Een shared token of een opgelost device token onderdrukt dit.
  - Automatische promotie van een opgeslagen device token bij de eenmalige
    `AUTH_TOKEN_MISMATCH`-retry is beperkt tot **vertrouwde endpoints**:
    loopback, of `wss://` met een vastgezette `tlsFingerprint`. Openbare `wss://`
    zonder pinning komt niet in aanmerking.
- Aanvullende items in `hello-ok.auth.deviceTokens` zijn bootstrap-handofftokens.
  Bewaar ze alleen wanneer de connect bootstrap-authenticatie gebruikte op een vertrouwd transport
  zoals `wss://` of loopback/local pairing.
- Als een client een **expliciete** `deviceToken` of expliciete `scopes` opgeeft, blijft die
  door de aanroeper gevraagde scopeset leidend; gecachete scopes worden alleen
  hergebruikt wanneer de client het opgeslagen token per apparaat hergebruikt.
- Device tokens kunnen worden geroteerd/ingetrokken via `device.token.rotate` en
  `device.token.revoke` (vereist `operator.pairing`-scope).
- `device.token.rotate` retourneert rotatiemetadata. Het geeft het vervangende
  bearer token alleen terug voor aanroepen vanaf hetzelfde apparaat die al met
  dat device token zijn geauthenticeerd, zodat clients met alleen tokens hun vervanging kunnen bewaren voordat
  ze opnieuw verbinden. Shared/admin-rotaties geven het bearer token niet terug.
- Tokenuitgifte, rotatie en intrekking blijven beperkt tot de goedgekeurde rolset
  die is vastgelegd in de pairingvermelding van dat apparaat; tokenmutatie kan geen
  apparaatrol uitbreiden of targeten waarvoor pairing-goedkeuring nooit is verleend.
- Voor token-sessies van gekoppelde apparaten is apparaatbeheer zelf-beperkt, tenzij de
  aanroeper ook `operator.admin` heeft: niet-admin-aanroepers kunnen alleen hun **eigen**
  apparaatvermelding verwijderen/intrekken/roteren.
- `device.token.rotate` en `device.token.revoke` controleren ook de scopeset van het doel-operator
  token tegen de huidige sessiescopes van de aanroeper. Niet-admin-aanroepers
  kunnen geen breder operator token roteren of intrekken dan ze al hebben.
- Authenticatiefouten bevatten `error.details.code` plus herstelhints:
  - `error.details.canRetryWithDeviceToken` (boolean)
  - `error.details.recommendedNextStep` (`retry_with_device_token`, `update_auth_configuration`, `update_auth_credentials`, `wait_then_retry`, `review_auth_configuration`)
- Clientgedrag voor `AUTH_TOKEN_MISMATCH`:
  - Vertrouwde clients mogen één begrensde retry proberen met een gecachet token per apparaat.
  - Als die retry mislukt, moeten clients automatische reconnect-lussen stoppen en richtlijnen voor operatoractie tonen.

## Apparaatidentiteit + pairing

- Nodes moeten een stabiele apparaatidentiteit (`device.id`) opnemen, afgeleid van een
  keypair-fingerprint.
- Gateways geven tokens uit per apparaat + rol.
- Pairing-goedkeuringen zijn vereist voor nieuwe apparaat-ID's, tenzij lokale automatische goedkeuring
  is ingeschakeld.
- Automatische pairing-goedkeuring is gericht op directe local loopback-connects.
- OpenClaw heeft ook een smal backend-/container-lokaal zelfconnectiepad voor
  vertrouwde shared-secret-helperflows.
- Same-host tailnet- of LAN-connects worden nog steeds als extern behandeld voor pairing en
  vereisen goedkeuring.
- WS-clients nemen normaal gesproken `device`-identiteit op tijdens `connect` (operator +
  node). De enige apparaatsloze operator-uitzonderingen zijn expliciete vertrouwenspaden:
  - `gateway.controlUi.allowInsecureAuth=true` voor localhost-only onveilige HTTP-compatibiliteit.
  - succesvolle `gateway.auth.mode: "trusted-proxy"` operator-Control UI-authenticatie.
  - `gateway.controlUi.dangerouslyDisableDeviceAuth=true` (noodoptie, ernstige beveiligingsverlaging).
  - direct-loopback `gateway-client` backend-RPC's geauthenticeerd met het shared
    gateway-token/-wachtwoord.
- Alle verbindingen moeten de door de server verstrekte `connect.challenge`-nonce ondertekenen.

### Diagnostiek voor migratie van apparaatauthenticatie

Voor legacy-clients die nog pre-challenge-ondertekeningsgedrag gebruiken, retourneert `connect` nu
`DEVICE_AUTH_*`-detailcodes onder `error.details.code` met een stabiele `error.details.reason`.

Veelvoorkomende migratiefouten:

| Bericht                     | details.code                     | details.reason           | Betekenis                                          |
| --------------------------- | -------------------------------- | ------------------------ | -------------------------------------------------- |
| `device nonce required`     | `DEVICE_AUTH_NONCE_REQUIRED`     | `device-nonce-missing`   | Client heeft `device.nonce` weggelaten (of leeg verzonden). |
| `device nonce mismatch`     | `DEVICE_AUTH_NONCE_MISMATCH`     | `device-nonce-mismatch`  | Client heeft ondertekend met een verouderde/verkeerde nonce. |
| `device signature invalid`  | `DEVICE_AUTH_SIGNATURE_INVALID`  | `device-signature`       | Handtekeningpayload komt niet overeen met v2-payload. |
| `device signature expired`  | `DEVICE_AUTH_SIGNATURE_EXPIRED`  | `device-signature-stale` | Ondertekende timestamp ligt buiten de toegestane afwijking. |
| `device identity mismatch`  | `DEVICE_AUTH_DEVICE_ID_MISMATCH` | `device-id-mismatch`     | `device.id` komt niet overeen met de public key-fingerprint. |
| `device public key invalid` | `DEVICE_AUTH_PUBLIC_KEY_INVALID` | `device-public-key`      | Public key-formaat/canonicalisatie is mislukt.     |

Migratiedoel:

- Wacht altijd op `connect.challenge`.
- Onderteken de v2-payload die de servernonce bevat.
- Verzend dezelfde nonce in `connect.params.device.nonce`.
- De voorkeurspayload voor handtekeningen is `v3`, die `platform` en `deviceFamily`
  bindt naast apparaat-/client-/rol-/scopes-/token-/noncevelden.
- Legacy `v2`-handtekeningen blijven geaccepteerd voor compatibiliteit, maar metadata-pinning
  van gekoppelde apparaten blijft het opdrachtbeleid bij opnieuw verbinden bepalen.

## TLS + pinning

- TLS wordt ondersteund voor WS-verbindingen.
- Clients kunnen optioneel de fingerprint van het gateway-certificaat pinnen (zie `gateway.tls`-
  configuratie plus `gateway.remote.tlsFingerprint` of CLI `--tls-fingerprint`).

## Scope

Dit protocol stelt de **volledige gateway-API** beschikbaar (status, kanalen, modellen, chat,
agent, sessies, nodes, goedkeuringen, enzovoort). Het exacte oppervlak wordt gedefinieerd door de
TypeBox-schema's in `src/gateway/protocol/schema.ts`.

## Gerelateerd

- [Bridge-protocol](/nl/gateway/bridge-protocol)
- [Gateway-runbook](/nl/gateway)
