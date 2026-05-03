---
read_when:
    - Gateway-WS-clients implementeren of bijwerken
    - Protocolmismatches of verbindingsfouten debuggen
    - Protocolschema/-modellen opnieuw genereren
summary: 'Gateway WebSocket-protocol: handshake, frames, versiebeheer'
title: Gateway-protocol
x-i18n:
    generated_at: "2026-05-03T11:10:15Z"
    model: gpt-5.5
    provider: openai
    source_hash: 06f6e1f2188860362bff481e646bd1c4bae4cf8f9a9ccae4fbd5ceea434d2247
    source_path: gateway/protocol.md
    workflow: 16
---

Het Gateway WS-protocol is het **enige control plane + node-transport** voor
OpenClaw. Alle clients (CLI, web-UI, macOS-app, iOS/Android-nodes, headless
nodes) maken verbinding via WebSocket en declareren hun **rol** + **scope** tijdens
de handshake.

## Transport

- WebSocket, tekstframes met JSON-payloads.
- Het eerste frame **moet** een `connect`-verzoek zijn.
- Pre-connect-frames zijn begrensd op 64 KiB. Na een geslaagde handshake moeten clients
  de limieten `hello-ok.policy.maxPayload` en
  `hello-ok.policy.maxBufferedBytes` volgen. Met diagnostiek ingeschakeld geven
  te grote inkomende frames en trage uitgaande buffers `payload.large`-events
  voordat de gateway het betrokken frame sluit of laat vallen. Deze events bewaren
  groottes, limieten, oppervlakken en veilige redencodes. Ze bewaren niet de berichttekst,
  inhoud van bijlagen, ruwe framebody, tokens, cookies of geheime waarden.

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

Terwijl de Gateway nog bezig is met het afronden van startup-sidecars, kan het `connect`-verzoek
een opnieuw te proberen `UNAVAILABLE`-fout retourneren met `details.reason` ingesteld op
`"startup-sidecars"` en `retryAfterMs`. Clients moeten die respons opnieuw proberen
binnen hun totale verbindingsbudget in plaats van deze als een definitieve
handshake-fout te tonen.

`server`, `features`, `snapshot` en `policy` zijn allemaal vereist door het schema
(`src/gateway/protocol/schema/frames.ts`). `auth` is ook vereist en rapporteert
de onderhandelde rol/scopes. `canvasHostUrl` is optioneel.

Wanneer er geen devicetoken wordt uitgegeven, rapporteert `hello-ok.auth` de onderhandelde
rechten zonder tokenvelden:

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
ze zich authenticeren met het gedeelde gatewaytoken/wachtwoord. Dit pad is gereserveerd
voor interne control-plane-RPC's en voorkomt dat verouderde CLI-/device-pairingbaselines
lokaal backendwerk blokkeren, zoals updates van subagentsessies. Externe clients,
clients met browser-origin, nodeclients en expliciete device-token-/device-identityclients
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

Voor de ingebouwde node-/operator-bootstrapflow blijft het primaire nodetoken
`scopes: []` en blijft elk overgedragen operatortoken begrensd tot de bootstrap
operator-allowlist (`operator.approvals`, `operator.read`,
`operator.talk.secrets`, `operator.write`). Bootstrap-scopecontroles blijven
rolgeprefixd: operatorvermeldingen voldoen alleen aan operatorverzoeken, en niet-operatorrollen
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

## Frame-indeling

- **Verzoek**: `{type:"req", id, method, params}`
- **Respons**: `{type:"res", id, ok, payload|error}`
- **Event**: `{type:"event", event, payload, seq?, stateVersion?}`

Methoden met neveneffecten vereisen **idempotentiesleutels** (zie schema).

## Rollen + scopes

Voor het volledige operatorscopemodel, approval-time-controles en shared-secret-
semantiek, zie [Operatorscopes](/nl/gateway/operator-scopes).

### Rollen

- `operator` = control plane-client (CLI/UI/automatisering).
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

Door Plugins geregistreerde gateway-RPC-methoden mogen hun eigen operatorscope aanvragen, maar
gereserveerde core-adminprefixen (`config.*`, `exec.approvals.*`, `wizard.*`,
`update.*`) worden altijd opgelost naar `operator.admin`.

Methodescope is alleen de eerste gate. Sommige slash-commands die via
`chat.send` worden bereikt, passen daarbovenop strengere controles op commandoniveau toe. Bijvoorbeeld: persistente
`/config set`- en `/config unset`-schrijfacties vereisen `operator.admin`.

`node.pair.approve` heeft ook een extra approval-time-scopecontrole bovenop de
basismethodescope:

- verzoeken zonder command: `operator.pairing`
- verzoeken met non-exec-nodecommands: `operator.pairing` + `operator.write`
- verzoeken die `system.run`, `system.run.prepare` of `system.which` bevatten:
  `operator.pairing` + `operator.admin`

### Caps/commands/permissions (node)

Nodes declareren capabilityclaims tijdens het verbinden:

- `caps`: capabilitycategorieën op hoog niveau.
- `commands`: command-allowlist voor invoke.
- `permissions`: granulaire schakelaars (bijv. `screen.record`, `camera.capture`).

De Gateway behandelt deze als **claims** en handhaaft server-side allowlists.

## Aanwezigheid

- `system-presence` retourneert vermeldingen keyed by device identity.
- Aanwezigheidsvermeldingen bevatten `deviceId`, `roles` en `scopes`, zodat UI's één rij per device kunnen tonen
  zelfs wanneer het zowel als **operator** als **node** verbonden is.
- `node.list` bevat optionele velden `lastSeenAtMs` en `lastSeenReason`. Verbonden nodes rapporteren
  hun huidige verbindingstijd als `lastSeenAtMs` met reden `connect`; gepairde nodes kunnen ook
  duurzame achtergrondaanwezigheid rapporteren wanneer een vertrouwd node-event hun pairingmetadata bijwerkt.

### Node-achtergrond alive-event

Nodes mogen `node.event` aanroepen met `event: "node.presence.alive"` om vast te leggen dat een gepairde node
alive was tijdens een achtergrondwake zonder deze als verbonden te markeren.

```json
{
  "event": "node.presence.alive",
  "payloadJSON": "{\"trigger\":\"silent_push\",\"sentAtMs\":1737264000000,\"displayName\":\"Peter's iPhone\",\"version\":\"2026.4.28\",\"platform\":\"iOS 18.4.0\",\"deviceFamily\":\"iPhone\",\"modelIdentifier\":\"iPhone17,1\",\"pushTransport\":\"relay\"}"
}
```

`trigger` is een gesloten enum: `background`, `silent_push`, `bg_app_refresh`,
`significant_location`, `manual` of `connect`. Onbekende triggerstrings worden door de gateway vóór persistentie genormaliseerd naar
`background`. Het event is alleen duurzaam voor geauthenticeerde node-
devicesessies; sessies zonder device of zonder pairing retourneren `handled: false`.

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

## Scoping van broadcastevents

Door de server gepushte WebSocket-broadcastevents zijn scope-gated zodat pairing-scoped of node-only sessies niet passief sessie-inhoud ontvangen.

- **Chat-, agent- en tool-result-frames** (inclusief gestreamde `agent`-events en toolcallresultaten) vereisen ten minste `operator.read`. Sessies zonder `operator.read` slaan deze frames volledig over.
- **Door Plugins gedefinieerde `plugin.*`-broadcasts** zijn gated naar `operator.write` of `operator.admin`, afhankelijk van hoe de Plugin ze heeft geregistreerd.
- **Status- en transportevents** (`heartbeat`, `presence`, `tick`, connect/disconnect-levenscyclus, enz.) blijven onbeperkt, zodat transportgezondheid zichtbaar blijft voor elke geauthenticeerde sessie.
- **Onbekende broadcasteventfamilies** zijn standaard scope-gated (fail-closed), tenzij een geregistreerde handler ze expliciet versoepelt.

Elke clientverbinding behoudt zijn eigen per-client-volgnummer, zodat broadcasts monotone ordening op die socket behouden, zelfs wanneer verschillende clients verschillende scope-gefilterde subsets van de eventstream zien.

## Veelgebruikte RPC-methodefamilies

Het publieke WS-oppervlak is breder dan de handshake-/authvoorbeelden hierboven. Dit
is geen gegenereerde dump — `hello-ok.features.methods` is een conservatieve
discoverylijst opgebouwd uit `src/gateway/server-methods-list.ts` plus geladen
exports van Plugin-/channelmethoden. Behandel dit als featurediscovery, niet als een volledige
opsomming van `src/gateway/server-methods/*.ts`.

<AccordionGroup>
  <Accordion title="Systeem en identiteit">
    - `health` retourneert de gecachte of nieuw geprobede gatewaygezondheidssnapshot.
    - `diagnostics.stability` retourneert de recente begrensde diagnostische stabiliteitsrecorder. Deze bewaart operationele metadata zoals eventnamen, aantallen, bytegroottes, geheugenmetingen, queue-/sessiestatus, channel-/Pluginnamen en sessie-id's. Deze bewaart geen chattekst, webhookbody's, tooloutputs, ruwe request- of responsebody's, tokens, cookies of geheime waarden. Operatorleesscope is vereist.
    - `status` retourneert de `/status`-achtige gatewaysamenvatting; gevoelige velden worden alleen opgenomen voor operatorclients met adminscope.
    - `gateway.identity.get` retourneert de gateway-device identity die wordt gebruikt door relay- en pairingflows.
    - `system-presence` retourneert de huidige aanwezigheidssnapshot voor verbonden operator-/nodedevices.
    - `system-event` voegt een systeemevent toe en kan aanwezigheidscontext bijwerken/broadcasten.
    - `last-heartbeat` retourneert het laatst gepersisteerde heartbeat-event.
    - `set-heartbeats` schakelt heartbeatverwerking op de gateway in of uit.

  </Accordion>

  <Accordion title="Modellen en gebruik">
    - `models.list` retourneert de runtime-toegestane modelcatalogus. Geef `{ "view": "configured" }` door voor geconfigureerde modellen op picker-formaat (eerst `agents.defaults.models`, daarna `models.providers.*.models`), of `{ "view": "all" }` voor de volledige catalogus.
    - `usage.status` retourneert samenvattingen van providergebruiksvensters/resterend quotum.
    - `usage.cost` retourneert geaggregeerde kostengebruikssamenvattingen voor een datumbereik.
    - `doctor.memory.status` retourneert vectorgeheugen-/gecachete embedding-gereedheid voor de actieve standaardagentwerkruimte. Geef `{ "probe": true }` of `{ "deep": true }` alleen door wanneer de aanroeper expliciet een live ping naar de embedding-provider wil.
    - `doctor.memory.remHarness` retourneert een begrensde, alleen-lezen REM-harnesspreview voor externe control-plane-clients. Deze kan werkruimtepaden, geheugenfragmenten, gerenderde grounded markdown en kandidaten voor diepe promotie bevatten, dus aanroepers hebben `operator.read` nodig.
    - `sessions.usage` retourneert gebruikssamenvattingen per sessie.
    - `sessions.usage.timeseries` retourneert tijdreeksgebruik voor één sessie.
    - `sessions.usage.logs` retourneert gebruikslogvermeldingen voor één sessie.

  </Accordion>

  <Accordion title="Kanalen en loginhelpers">
    - `channels.status` retourneert statusoverzichten van ingebouwde + gebundelde kanalen/plugins.
    - `channels.logout` logt een specifiek kanaal/account uit waar het kanaal logout ondersteunt.
    - `web.login.start` start een QR-/webloginstroom voor de huidige QR-geschikte webkanaalprovider.
    - `web.login.wait` wacht tot die QR-/webloginstroom is voltooid en start het kanaal bij succes.
    - `push.test` verstuurt een test-APNs-push naar een geregistreerde iOS-Node.
    - `voicewake.get` retourneert de opgeslagen wake-word-triggers.
    - `voicewake.set` werkt wake-word-triggers bij en zendt de wijziging uit.

  </Accordion>

  <Accordion title="Berichten en logs">
    - `send` is de directe RPC voor uitgaande aflevering voor verzendingen gericht op kanaal/account/thread buiten de chatrunner.
    - `logs.tail` retourneert de geconfigureerde Gateway-bestandslogstaart met cursor-/limiet- en max-byte-instellingen.

  </Accordion>

  <Accordion title="Talk en TTS">
    - `talk.config` retourneert de effectieve Talk-configpayload; `includeSecrets` vereist `operator.talk.secrets` (of `operator.admin`).
    - `talk.mode` stelt de huidige Talk-modusstatus in voor WebChat-/Control UI-clients en zendt deze uit.
    - `talk.speak` synthetiseert spraak via de actieve Talk-spraakprovider.
    - `tts.status` retourneert de ingeschakelde TTS-status, actieve provider, fallback-providers en providerconfiguratiestatus.
    - `tts.providers` retourneert de zichtbare TTS-providerinventaris.
    - `tts.enable` en `tts.disable` schakelen de TTS-voorkeurenstatus om.
    - `tts.setProvider` werkt de voorkeurs-TTS-provider bij.
    - `tts.convert` voert een eenmalige tekst-naar-spraakconversie uit.

  </Accordion>

  <Accordion title="Geheimen, configuratie, update en wizard">
    - `secrets.reload` lost actieve SecretRefs opnieuw op en vervangt de runtime-geheimstatus alleen bij volledig succes.
    - `secrets.resolve` lost geheimtoewijzingen voor commandodoelen op voor een specifieke opdracht-/doelset.
    - `config.get` retourneert de huidige configuratiesnapshot en hash.
    - `config.set` schrijft een gevalideerde configuratiepayload.
    - `config.patch` voegt een gedeeltelijke configuratie-update samen.
    - `config.apply` valideert + vervangt de volledige configuratiepayload.
    - `config.schema` retourneert de live configuratieschemapayload die wordt gebruikt door Control UI en CLI-tooling: schema, `uiHints`, versie en generatiemetadata, inclusief plugin- + kanaalschemametadata wanneer de runtime deze kan laden. Het schema bevat veldmetadata voor `title` / `description` afgeleid van dezelfde labels en helptekst die door de UI worden gebruikt, inclusief geneste object-, wildcard-, array-item- en `anyOf` / `oneOf` / `allOf`-compositietakken wanneer overeenkomende velddocumentatie bestaat.
    - `config.schema.lookup` retourneert een padgebonden opzoekpayload voor één configuratiepad: genormaliseerd pad, een ondiepe schemaknoop, overeenkomende hint + `hintPath`, en directe kindsamenvattingen voor UI-/CLI-drill-down. Opzoekschemaknopen behouden de gebruikersgerichte docs en algemene validatievelden (`title`, `description`, `type`, `enum`, `const`, `format`, `pattern`, numerieke/string-/array-/objectgrenzen en vlaggen zoals `additionalProperties`, `deprecated`, `readOnly`, `writeOnly`). Kindsamenvattingen tonen `key`, genormaliseerde `path`, `type`, `required`, `hasChildren`, plus de overeenkomende `hint` / `hintPath`.
    - `update.run` voert de Gateway-updatestroom uit en plant alleen een herstart wanneer de update zelf is geslaagd. Package-manager-updates forceren na de pakketwissel een niet-uitgestelde updateherstart zonder cooldown, zodat het oude Gateway-proces niet lazy blijft laden uit een vervangen `dist`-boom.
    - `update.status` retourneert de nieuwste gecachete update-herstartsentinel, inclusief de draaiende versie na herstart wanneer beschikbaar.
    - `wizard.start`, `wizard.next`, `wizard.status` en `wizard.cancel` stellen de onboardingwizard beschikbaar via WS RPC.

  </Accordion>

  <Accordion title="Agent- en werkruimtehelpers">
    - `agents.list` retourneert geconfigureerde agentvermeldingen, inclusief effectief model en runtime-metadata.
    - `agents.create`, `agents.update` en `agents.delete` beheren agentrecords en werkruimtebedrading.
    - `agents.files.list`, `agents.files.get` en `agents.files.set` beheren de bootstrap-werkruimtebestanden die voor een agent worden beschikbaar gesteld.
    - `artifacts.list`, `artifacts.get` en `artifacts.download` stellen uit transcript afgeleide artifactsamenvattingen en downloads beschikbaar voor een expliciete `sessionKey`-, `runId`- of `taskId`-scope. Run- en taakquery's lossen de eigenaarssessie server-side op en retourneren alleen transcriptmedia met overeenkomende herkomst; onveilige of lokale URL-bronnen retourneren niet-ondersteunde downloads in plaats van server-side op te halen.
    - `agent.identity.get` retourneert de effectieve assistentidentiteit voor een agent of sessie.
    - `agent.wait` wacht tot een run is voltooid en retourneert de terminale snapshot wanneer beschikbaar.

  </Accordion>

  <Accordion title="Sessiebesturing">
    - `sessions.list` retourneert de huidige sessie-index, inclusief `agentRuntime`-metadata per rij wanneer een agent-runtimebackend is geconfigureerd.
    - `sessions.subscribe` en `sessions.unsubscribe` schakelen abonnementen op sessiewijzigingsgebeurtenissen in of uit voor de huidige WS-client.
    - `sessions.messages.subscribe` en `sessions.messages.unsubscribe` schakelen transcript-/berichtgebeurtenisabonnementen in of uit voor één sessie.
    - `sessions.preview` retourneert begrensde transcriptpreviews voor specifieke sessiesleutels.
    - `sessions.describe` retourneert één Gateway-sessierij voor een exacte sessiesleutel.
    - `sessions.resolve` lost een sessiedoel op of canoniseert het.
    - `sessions.create` maakt een nieuwe sessievermelding.
    - `sessions.send` stuurt een bericht naar een bestaande sessie.
    - `sessions.steer` is de interrupt-en-stuur-variant voor een actieve sessie.
    - `sessions.abort` breekt actief werk voor een sessie af. Een aanroeper kan `key` plus optioneel `runId` doorgeven, of alleen `runId` doorgeven voor actieve runs die de Gateway naar een sessie kan herleiden.
    - `sessions.patch` werkt sessiemetadata/-overrides bij en rapporteert het opgeloste canonieke model plus effectieve `agentRuntime`.
    - `sessions.reset`, `sessions.delete` en `sessions.compact` voeren sessieonderhoud uit.
    - `sessions.get` retourneert de volledig opgeslagen sessierij.
    - Chatuitvoering gebruikt nog steeds `chat.history`, `chat.send`, `chat.abort` en `chat.inject`. `chat.history` is display-genormaliseerd voor UI-clients: inline directivetags worden uit zichtbare tekst gestript, tool-call-XML-payloads in platte tekst (inclusief `<tool_call>...</tool_call>`, `<function_call>...</function_call>`, `<tool_calls>...</tool_calls>`, `<function_calls>...</function_calls>` en afgekorte tool-call-blokken) en gelekte ASCII-/full-width modelbesturingstokens worden gestript, pure silent-token-assistentrijen zoals exact `NO_REPLY` / `no_reply` worden weggelaten, en te grote rijen kunnen worden vervangen door placeholders.

  </Accordion>

  <Accordion title="Apparaatkoppeling en apparaattokens">
    - `device.pair.list` retourneert in behandeling zijnde en goedgekeurde gekoppelde apparaten.
    - `device.pair.approve`, `device.pair.reject` en `device.pair.remove` beheren apparaatkoppelingsrecords.
    - `device.token.rotate` roteert een gekoppeld apparaattoken binnen zijn goedgekeurde rol- en aanroeperscopegrenzen.
    - `device.token.revoke` trekt een gekoppeld apparaattoken in binnen zijn goedgekeurde rol- en aanroeperscopegrenzen.

  </Accordion>

  <Accordion title="Node-koppeling, aanroepen en openstaand werk">
    - `node.pair.request`, `node.pair.list`, `node.pair.approve`, `node.pair.reject`, `node.pair.remove` en `node.pair.verify` dekken Node-koppeling en bootstrapverificatie.
    - `node.list` en `node.describe` retourneren bekende/verbonden Node-status.
    - `node.rename` werkt een gekoppeld Node-label bij.
    - `node.invoke` stuurt een commando door naar een verbonden Node.
    - `node.invoke.result` retourneert het resultaat voor een invoke-verzoek.
    - `node.event` draagt van Nodes afkomstige gebeurtenissen terug naar de Gateway.
    - `node.canvas.capability.refresh` ververst gescopete canvas-capability-tokens.
    - `node.pending.pull` en `node.pending.ack` zijn de wachtrij-API's voor verbonden Nodes.
    - `node.pending.enqueue` en `node.pending.drain` beheren duurzaam openstaand werk voor offline/losgekoppelde Nodes.

  </Accordion>

  <Accordion title="Goedkeuringsfamilies">
    - `exec.approval.request`, `exec.approval.get`, `exec.approval.list` en `exec.approval.resolve` dekken eenmalige exec-goedkeuringsverzoeken plus opzoeken/opnieuw afspelen van in behandeling zijnde goedkeuringen.
    - `exec.approval.waitDecision` wacht op één in behandeling zijnde exec-goedkeuring en retourneert de definitieve beslissing (of `null` bij timeout).
    - `exec.approvals.get` en `exec.approvals.set` beheren snapshots van Gateway-exec-goedkeuringsbeleid.
    - `exec.approvals.node.get` en `exec.approvals.node.set` beheren Node-lokaal exec-goedkeuringsbeleid via Node-relaycommando's.
    - `plugin.approval.request`, `plugin.approval.list`, `plugin.approval.waitDecision` en `plugin.approval.resolve` dekken door plugins gedefinieerde goedkeuringsstromen.

  </Accordion>

  <Accordion title="Automatisering, Skills en tools">
    - Automatisering: `wake` plant een onmiddellijke of volgende-Heartbeat wake-tekstinjectie; `cron.list`, `cron.status`, `cron.add`, `cron.update`, `cron.remove`, `cron.run`, `cron.runs` beheren gepland werk.
    - Skills en tools: `commands.list`, `skills.*`, `tools.catalog`, `tools.effective`, `tools.invoke`.

  </Accordion>
</AccordionGroup>

### Algemene gebeurtenisfamilies

- `chat`: UI-chatupdates zoals `chat.inject` en andere transcript-only chatgebeurtenissen.
- `session.message` en `session.tool`: transcript-/eventstream-updates voor een geabonneerde sessie.
- `sessions.changed`: sessie-index of metadata gewijzigd.
- `presence`: updates van systeempresencesnapshots.
- `tick`: periodieke keepalive-/livenessgebeurtenis.
- `health`: update van Gateway-gezondheidssnapshot.
- `heartbeat`: update van Heartbeat-gebeurtenisstroom.
- `cron`: wijzigingsgebeurtenis voor Cron-run/job.
- `shutdown`: Gateway-afsluitmelding.
- `node.pair.requested` / `node.pair.resolved`: Node-koppelingslevenscyclus.
- `node.invoke.request`: broadcast van Node-invoke-verzoek.
- `device.pair.requested` / `device.pair.resolved`: levenscyclus van gekoppeld apparaat.
- `voicewake.changed`: wake-word-triggerconfiguratie gewijzigd.
- `exec.approval.requested` / `exec.approval.resolved`: exec-goedkeuringslevenscyclus.
- `plugin.approval.requested` / `plugin.approval.resolved`: plugin-goedkeuringslevenscyclus.

### Node-helpermethoden

- Nodes mogen `skills.bins` aanroepen om de huidige lijst met uitvoerbare skill-bestanden op te halen
  voor auto-allow-controles.

### Operator-helpermethoden

- Operators kunnen `commands.list` (`operator.read`) aanroepen om de runtime
  opdrachteninventaris voor een agent op te halen.
  - `agentId` is optioneel; laat dit weg om de standaard agentwerkruimte te lezen.
  - `scope` bepaalt op welk oppervlak de primaire `name` is gericht:
    - `text` retourneert het primaire tekstopdrachttoken zonder de voorafgaande `/`
    - `native` en het standaardpad `both` retourneren providerbewuste native namen
      wanneer beschikbaar
  - `textAliases` bevat exacte slash-aliassen zoals `/model` en `/m`.
  - `nativeName` bevat de providerbewuste native opdrachtnaam wanneer die bestaat.
  - `provider` is optioneel en beïnvloedt alleen native naamgeving plus de beschikbaarheid
    van native Plugin-opdrachten.
  - `includeArgs=false` laat geserialiseerde argumentmetadata weg uit het antwoord.
- Operators kunnen `tools.catalog` (`operator.read`) aanroepen om de runtime-toolcatalogus voor een
  agent op te halen. Het antwoord bevat gegroepeerde tools en herkomstmetadata:
  - `source`: `core` of `plugin`
  - `pluginId`: eigenaar van de Plugin wanneer `source="plugin"`
  - `optional`: of een Plugin-tool optioneel is
- Operators kunnen `tools.effective` (`operator.read`) aanroepen om de runtime-effectieve toolinventaris
  voor een sessie op te halen.
  - `sessionKey` is vereist.
  - De Gateway leidt vertrouwde runtimecontext server-side af uit de sessie in plaats van door de
    aanroeper aangeleverde authenticatie- of bezorgcontext te accepteren.
  - Het antwoord is sessiegebonden en weerspiegelt wat het actieve gesprek nu kan gebruiken,
    inclusief core-, Plugin- en kanaaltools.
- Operators kunnen `tools.invoke` (`operator.write`) aanroepen om een beschikbare tool aan te roepen via
  hetzelfde Gateway-beleidspad als `/tools/invoke`.
  - `name` is vereist. `args`, `sessionKey`, `agentId`, `confirm` en
    `idempotencyKey` zijn optioneel.
  - Als zowel `sessionKey` als `agentId` aanwezig zijn, moet de opgeloste sessieagent overeenkomen met
    `agentId`.
  - Het antwoord is een SDK-gerichte envelop met `ok`, `toolName`, optioneel `output` en getypeerde
    `error`-velden. Goedkeurings- of beleidsweigeringen retourneren `ok:false` in de payload in plaats van
    de Gateway-toolbeleidspijplijn te omzeilen.
- Operators kunnen `skills.status` (`operator.read`) aanroepen om de zichtbare
  Skills-inventaris voor een agent op te halen.
  - `agentId` is optioneel; laat dit weg om de standaard agentwerkruimte te lezen.
  - Het antwoord bevat geschiktheid, ontbrekende vereisten, configuratiecontroles en
    opgeschoonde installatieopties zonder ruwe geheime waarden bloot te leggen.
- Operators kunnen `skills.search` en `skills.detail` (`operator.read`) aanroepen voor
  ClawHub-ontdekkingsmetadata.
- Operators kunnen `skills.install` (`operator.admin`) in twee modi aanroepen:
  - ClawHub-modus: `{ source: "clawhub", slug, version?, force? }` installeert een
    Skills-map in de map `skills/` van de standaard agentwerkruimte.
  - Gateway-installatiemodus: `{ name, installId, dangerouslyForceUnsafeInstall?, timeoutMs? }`
    voert een gedeclareerde `metadata.openclaw.install`-actie uit op de Gateway-host.
- Operators kunnen `skills.update` (`operator.admin`) in twee modi aanroepen:
  - ClawHub-modus werkt een bijgehouden slug bij of alle bijgehouden ClawHub-installaties in
    de standaard agentwerkruimte.
  - Configuratiemodus patcht `skills.entries.<skillKey>`-waarden zoals `enabled`,
    `apiKey` en `env`.

### `models.list`-weergaven

`models.list` accepteert een optionele parameter `view`:

- Weggelaten of `"default"`: huidig runtimegedrag. Als `agents.defaults.models` is geconfigureerd, is het antwoord de toegestane catalogus; anders is het antwoord de volledige Gateway-catalogus.
- `"configured"`: gedrag met picker-grootte. Als `agents.defaults.models` is geconfigureerd, blijft dat leidend. Anders gebruikt het antwoord expliciete vermeldingen in `models.providers.*.models`, met terugval naar de volledige catalogus alleen wanneer er geen geconfigureerde modelrijen bestaan.
- `"all"`: volledige Gateway-catalogus, waarbij `agents.defaults.models` wordt omzeild. Gebruik dit voor diagnostiek en ontdekkings-UI's, niet voor normale modelpickers.

## Exec-goedkeuringen

- Wanneer een exec-aanvraag goedkeuring nodig heeft, zendt de Gateway `exec.approval.requested` uit.
- Operatorclients lossen dit op door `exec.approval.resolve` aan te roepen (vereist scope `operator.approvals`).
- Voor `host=node` moet `exec.approval.request` `systemRunPlan` bevatten (canonieke `argv`/`cwd`/`rawCommand`/sessiemetadata). Aanvragen zonder `systemRunPlan` worden geweigerd.
- Na goedkeuring hergebruiken doorgestuurde `node.invoke system.run`-aanroepen dat canonieke
  `systemRunPlan` als de gezaghebbende opdracht-/cwd-/sessiecontext.
- Als een aanroeper `command`, `rawCommand`, `cwd`, `agentId` of
  `sessionKey` wijzigt tussen voorbereiding en de uiteindelijke goedgekeurde `system.run`-doorsturing, weigert de
  Gateway de run in plaats van de gewijzigde payload te vertrouwen.

## Fallback voor agentbezorging

- `agent`-aanvragen kunnen `deliver=true` bevatten om uitgaande bezorging aan te vragen.
- `bestEffortDeliver=false` behoudt strikt gedrag: niet-opgeloste of alleen-interne bezorgdoelen retourneren `INVALID_REQUEST`.
- `bestEffortDeliver=true` staat fallback naar sessie-only uitvoering toe wanneer geen externe bezorgbare route kan worden opgelost (bijvoorbeeld interne/webchatsessies of dubbelzinnige meerkanaalsconfiguraties).

## Versionering

- `PROTOCOL_VERSION` staat in `src/gateway/protocol/schema/protocol-schemas.ts`.
- Clients sturen `minProtocol` + `maxProtocol`; de server weigert mismatches.
- Schema's + modellen worden gegenereerd uit TypeBox-definities:
  - `pnpm protocol:gen`
  - `pnpm protocol:gen:swift`
  - `pnpm protocol:check`

### Clientconstanten

De referentieclient in `src/gateway/client.ts` gebruikt deze standaardwaarden. Waarden zijn
stabiel in protocol v3 en vormen de verwachte baseline voor clients van derden.

| Constante                                 | Standaardwaarde                                       | Bron                                                                                       |
| ----------------------------------------- | ----------------------------------------------------- | ------------------------------------------------------------------------------------------ |
| `PROTOCOL_VERSION`                        | `3`                                                   | `src/gateway/protocol/schema/protocol-schemas.ts`                                          |
| Aanvraagtime-out (per RPC)                | `30_000` ms                                           | `src/gateway/client.ts` (`requestTimeoutMs`)                                               |
| Preauth- / connect-challenge-time-out     | `15_000` ms                                           | `src/gateway/handshake-timeouts.ts` (config/env kan het gekoppelde server-/clientbudget verhogen) |
| Initiële reconnect-backoff                | `1_000` ms                                            | `src/gateway/client.ts` (`backoffMs`)                                                      |
| Maximale reconnect-backoff                | `30_000` ms                                           | `src/gateway/client.ts` (`scheduleReconnect`)                                              |
| Fast-retry-klem na sluiten door device-token | `250` ms                                           | `src/gateway/client.ts`                                                                    |
| Force-stop-gratie voor `terminate()`      | `250` ms                                              | `FORCE_STOP_TERMINATE_GRACE_MS`                                                            |
| Standaardtime-out van `stopAndWait()`     | `1_000` ms                                            | `STOP_AND_WAIT_TIMEOUT_MS`                                                                 |
| Standaard tick-interval (voor `hello-ok`) | `30_000` ms                                           | `src/gateway/client.ts`                                                                    |
| Sluiten bij tick-time-out                 | code `4000` wanneer stilte langer duurt dan `tickIntervalMs * 2` | `src/gateway/client.ts`                                                         |
| `MAX_PAYLOAD_BYTES`                       | `25 * 1024 * 1024` (25 MB)                            | `src/gateway/server-constants.ts`                                                          |

De server adverteert de effectieve `policy.tickIntervalMs`, `policy.maxPayload`
en `policy.maxBufferedBytes` in `hello-ok`; clients moeten die waarden respecteren
in plaats van de standaardwaarden van voor de handshake.

## Auth

- Gateway-authenticatie met gedeeld geheim gebruikt `connect.params.auth.token` of
  `connect.params.auth.password`, afhankelijk van de geconfigureerde authenticatiemodus.
- Modi met identiteit, zoals Tailscale Serve
  (`gateway.auth.allowTailscale: true`) of niet-loopback
  `gateway.auth.mode: "trusted-proxy"`, voldoen aan de connect-authenticatiecontrole via
  aanvraagheaders in plaats van `connect.params.auth.*`.
- Private-ingress `gateway.auth.mode: "none"` slaat connect-authenticatie met gedeeld geheim
  volledig over; stel die modus niet bloot op publieke/niet-vertrouwde ingress.
- Na koppeling geeft de Gateway een **apparaat-token** uit dat is beperkt tot de verbindingsrol
  + scopes. Het wordt teruggegeven in `hello-ok.auth.deviceToken` en moet door de
  client worden bewaard voor toekomstige verbindingen.
- Clients moeten de primaire `hello-ok.auth.deviceToken` bewaren na elke
  geslaagde verbinding.
- Opnieuw verbinden met dat **opgeslagen** apparaat-token moet ook de opgeslagen
  goedgekeurde scopeset voor dat token hergebruiken. Dit behoudt lees-/probe-/status-toegang
  die al was toegekend en voorkomt dat herverbindingen stilzwijgend worden teruggebracht tot een
  beperktere impliciete admin-only scope.
- Samenstelling van connect-authenticatie aan clientzijde (`selectConnectAuth` in
  `src/gateway/client.ts`):
  - `auth.password` is orthogonaal en wordt altijd doorgestuurd wanneer ingesteld.
  - `auth.token` wordt gevuld in prioriteitsvolgorde: eerst expliciet gedeeld token,
    daarna een expliciete `deviceToken`, daarna een opgeslagen token per apparaat (gesleuteld op
    `deviceId` + `role`).
  - `auth.bootstrapToken` wordt alleen verzonden wanneer geen van bovenstaande een
    `auth.token` heeft opgeleverd. Een gedeeld token of elk gevonden apparaat-token onderdrukt dit.
  - Automatische promotie van een opgeslagen apparaat-token bij de eenmalige
    `AUTH_TOKEN_MISMATCH`-retry is beperkt tot **alleen vertrouwde eindpunten** —
    loopback, of `wss://` met een vastgepinde `tlsFingerprint`. Publieke `wss://`
    zonder pinning komt niet in aanmerking.
- Aanvullende vermeldingen in `hello-ok.auth.deviceTokens` zijn bootstrap-overdrachtstokens.
  Bewaar ze alleen wanneer de verbinding bootstrap-authenticatie gebruikte op een vertrouwd transport
  zoals `wss://` of loopback/lokale koppeling.
- Als een client een **expliciete** `deviceToken` of expliciete `scopes` opgeeft, blijft die
  door de aanroeper aangevraagde scopeset leidend; gecachete scopes worden alleen
  hergebruikt wanneer de client het opgeslagen token per apparaat hergebruikt.
- Apparaat-tokens kunnen worden geroteerd/ingetrokken via `device.token.rotate` en
  `device.token.revoke` (vereist de scope `operator.pairing`).
- `device.token.rotate` retourneert rotatiemetadata. Het echoot het vervangende
  bearer-token alleen voor aanroepen vanaf hetzelfde apparaat die al met
  dat apparaat-token zijn geauthenticeerd, zodat clients met alleen tokens hun vervanging kunnen bewaren voordat
  ze opnieuw verbinden. Shared/admin-rotaties echoën het bearer-token niet.
- Tokenuitgifte, rotatie en intrekking blijven begrensd tot de goedgekeurde rollenset
  die is vastgelegd in de koppelingsvermelding van dat apparaat; tokenmutatie kan geen
  apparaatrol uitbreiden of targeten waarvoor de koppelingsgoedkeuring nooit toestemming gaf.
- Voor token-sessies van gekoppelde apparaten is apparaatbeheer self-scoped, tenzij de
  aanroeper ook `operator.admin` heeft: niet-admin-aanroepers kunnen alleen hun **eigen**
  apparaatvermelding verwijderen/intrekken/roteren.
- `device.token.rotate` en `device.token.revoke` controleren ook de scopeset van het doeloperator-token
  tegen de huidige sessiescopes van de aanroeper. Niet-admin-aanroepers
  kunnen geen breder operator-token roteren of intrekken dan ze zelf al hebben.
- Authenticatiefouten bevatten `error.details.code` plus herstelhints:
  - `error.details.canRetryWithDeviceToken` (boolean)
  - `error.details.recommendedNextStep` (`retry_with_device_token`, `update_auth_configuration`, `update_auth_credentials`, `wait_then_retry`, `review_auth_configuration`)
- Clientgedrag voor `AUTH_TOKEN_MISMATCH`:
  - Vertrouwde clients mogen één begrensde retry proberen met een gecachet token per apparaat.
  - Als die retry mislukt, moeten clients automatische herverbindingslussen stoppen en operator-actierichtlijnen tonen.

## Apparaatidentiteit + koppeling

- Nodes moeten een stabiele apparaatidentiteit (`device.id`) opnemen die is afgeleid van een
  keypair-fingerprint.
- Gateways geven tokens uit per apparaat + rol.
- Koppelingsgoedkeuringen zijn vereist voor nieuwe apparaat-ID's, tenzij lokale automatische goedkeuring
  is ingeschakeld.
- Automatische koppelingsgoedkeuring draait om directe lokale local loopback-verbindingen.
- OpenClaw heeft ook een smal backend/container-lokaal self-connect-pad voor
  vertrouwde helperflows met gedeeld geheim.
- Same-host tailnet- of LAN-verbindingen worden voor koppeling nog steeds als remote behandeld en
  vereisen goedkeuring.
- WS-clients nemen normaal gesproken `device`-identiteit op tijdens `connect` (operator +
  node). De enige apparaatloze operator-uitzonderingen zijn expliciete vertrouwenspaden:
  - `gateway.controlUi.allowInsecureAuth=true` voor localhost-only compatibiliteit met onveilige HTTP.
  - geslaagde operator-authenticatie voor Control UI met `gateway.auth.mode: "trusted-proxy"`.
  - `gateway.controlUi.dangerouslyDisableDeviceAuth=true` (break-glass, ernstige beveiligingsdowngrade).
  - direct-loopback `gateway-client` backend-RPC's die zijn geauthenticeerd met het gedeelde
    Gateway-token/-wachtwoord.
- Alle verbindingen moeten de door de server verstrekte nonce `connect.challenge` ondertekenen.

### Migratiediagnostiek voor apparaatauthenticatie

Voor verouderde clients die nog steeds pre-challenge-ondertekeningsgedrag gebruiken, retourneert `connect` nu
`DEVICE_AUTH_*`-detailcodes onder `error.details.code` met een stabiele `error.details.reason`.

Veelvoorkomende migratiefouten:

| Bericht                     | details.code                     | details.reason           | Betekenis                                          |
| --------------------------- | -------------------------------- | ------------------------ | -------------------------------------------------- |
| `device nonce required`     | `DEVICE_AUTH_NONCE_REQUIRED`     | `device-nonce-missing`   | Client liet `device.nonce` weg (of stuurde leeg).  |
| `device nonce mismatch`     | `DEVICE_AUTH_NONCE_MISMATCH`     | `device-nonce-mismatch`  | Client ondertekende met een oude/verkeerde nonce.  |
| `device signature invalid`  | `DEVICE_AUTH_SIGNATURE_INVALID`  | `device-signature`       | Handtekeningpayload komt niet overeen met v2-payload. |
| `device signature expired`  | `DEVICE_AUTH_SIGNATURE_EXPIRED`  | `device-signature-stale` | Ondertekende timestamp valt buiten toegestane skew. |
| `device identity mismatch`  | `DEVICE_AUTH_DEVICE_ID_MISMATCH` | `device-id-mismatch`     | `device.id` komt niet overeen met public-key-fingerprint. |
| `device public key invalid` | `DEVICE_AUTH_PUBLIC_KEY_INVALID` | `device-public-key`      | Public-key-indeling/canonicalisatie is mislukt.    |

Migratiedoel:

- Wacht altijd op `connect.challenge`.
- Onderteken de v2-payload die de server-nonce bevat.
- Stuur dezelfde nonce in `connect.params.device.nonce`.
- De voorkeurs-handtekeningpayload is `v3`, die `platform` en `deviceFamily`
  bindt naast velden voor apparaat/client/rol/scopes/token/nonce.
- Verouderde `v2`-handtekeningen blijven geaccepteerd voor compatibiliteit, maar metadata-pinning
  voor gekoppelde apparaten blijft het opdrachtbeleid bij opnieuw verbinden bepalen.

## TLS + pinning

- TLS wordt ondersteund voor WS-verbindingen.
- Clients kunnen optioneel de certificaatfingerprint van de gateway pinnen (zie `gateway.tls`
  config plus `gateway.remote.tlsFingerprint` of CLI `--tls-fingerprint`).

## Scope

Dit protocol stelt de **volledige Gateway-API** beschikbaar (status, kanalen, modellen, chat,
agent, sessies, nodes, goedkeuringen, enz.). Het exacte oppervlak wordt gedefinieerd door de
TypeBox-schema's in `src/gateway/protocol/schema.ts`.

## Gerelateerd

- [Bridge-protocol](/nl/gateway/bridge-protocol)
- [Gateway-runbook](/nl/gateway)
