---
read_when:
    - Gateway-WS-clients implementeren of bijwerken
    - Protocolverschillen of verbindingsfouten debuggen
    - Protocolschema's/-modellen opnieuw genereren
summary: 'Gateway WebSocket-protocol: handshake, frames, versiebeheer'
title: Gateway-protocol
x-i18n:
    generated_at: "2026-05-02T20:44:38Z"
    model: gpt-5.5
    provider: openai
    source_hash: bc8bd6bae485f13bbd0e8762d30abdfab7e2aee635f8ebac1a38798493239798
    source_path: gateway/protocol.md
    workflow: 16
---

Het Gateway WS-protocol is het **enige besturingsvlak + Node-transport** voor
OpenClaw. Alle clients (CLI, web-UI, macOS-app, iOS/Android-nodes, headless
nodes) maken verbinding via WebSocket en declareren hun **rol** + **scope** tijdens
de handshake.

## Transport

- WebSocket, tekstframes met JSON-payloads.
- Het eerste frame **moet** een `connect`-request zijn.
- Frames vóór verbinding zijn beperkt tot 64 KiB. Na een geslaagde handshake moeten clients
  de limieten `hello-ok.policy.maxPayload` en
  `hello-ok.policy.maxBufferedBytes` volgen. Als diagnostiek is ingeschakeld,
  zenden te grote inkomende frames en trage uitgaande buffers `payload.large`-events
  uit voordat de gateway het betreffende frame sluit of laat vallen. Deze events bewaren
  groottes, limieten, oppervlakken en veilige redencodes. Ze bewaren niet de berichttekst,
  inhoud van bijlagen, ruwe frame-inhoud, tokens, cookies of geheime waarden.

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

Terwijl de Gateway nog bezig is met het afronden van opstart-sidecars, kan de `connect`-request
een opnieuw te proberen `UNAVAILABLE`-fout retourneren met `details.reason` ingesteld op
`"startup-sidecars"` en `retryAfterMs`. Clients moeten dat antwoord opnieuw proberen
binnen hun totale verbindingsbudget in plaats van het als een terminale
handshakefout te tonen.

`server`, `features`, `snapshot` en `policy` zijn allemaal vereist door het schema
(`src/gateway/protocol/schema/frames.ts`). `auth` is ook vereist en rapporteert
de onderhandelde rol/scopes. `canvasHostUrl` is optioneel.

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

Vertrouwde backendclients in hetzelfde proces (`client.id: "gateway-client"`,
`client.mode: "backend"`) mogen `device` weglaten op directe loopback-verbindingen wanneer
ze zich authenticeren met het gedeelde Gateway-token/wachtwoord. Dit pad is gereserveerd
voor interne besturingsvlak-RPC's en voorkomt dat verouderde CLI-/apparaatkoppelingsbaselines
lokaal backendwerk blokkeren, zoals updates van subagentsessies. Externe clients,
browser-origin-clients, Node-clients en expliciete apparaat-token-/apparaat-identiteitsclients
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

Voor de ingebouwde Node/operator-bootstrapflow blijft het primaire Node-token
`scopes: []` en blijft elk overgedragen operatortoken begrensd tot de bootstrap-
operator-allowlist (`operator.approvals`, `operator.read`,
`operator.talk.secrets`, `operator.write`). Bootstrap-scopecontroles blijven
rol-geprefixd: operatorvermeldingen voldoen alleen aan operatorrequests, en niet-operatorrollen
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
- **Response**: `{type:"res", id, ok, payload|error}`
- **Event**: `{type:"event", event, payload, seq?, stateVersion?}`

Methoden met neveneffecten vereisen **idempotentiesleutels** (zie schema).

## Rollen + scopes

### Rollen

- `operator` = besturingsvlakclient (CLI/UI/automatisering).
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

Door Plugins geregistreerde Gateway RPC-methoden kunnen hun eigen operatorscope aanvragen, maar
gereserveerde core-adminprefixen (`config.*`, `exec.approvals.*`, `wizard.*`,
`update.*`) worden altijd opgelost naar `operator.admin`.

Methodscope is slechts de eerste poort. Sommige slash-commands die via
`chat.send` worden bereikt, passen daarbovenop strengere controles op commandniveau toe. Bijvoorbeeld: persistente
`/config set`- en `/config unset`-writes vereisen `operator.admin`.

`node.pair.approve` heeft ook een extra scopecontrole tijdens goedkeuring bovenop de
basismethodscope:

- requests zonder command: `operator.pairing`
- requests met non-exec Node-commands: `operator.pairing` + `operator.write`
- requests die `system.run`, `system.run.prepare` of `system.which` bevatten:
  `operator.pairing` + `operator.admin`

### Caps/commands/permissions (Node)

Nodes declareren capabilityclaims tijdens het verbinden:

- `caps`: capabilitycategorieën op hoog niveau.
- `commands`: command-allowlist voor aanroep.
- `permissions`: granulaire schakelaars (bijv. `screen.record`, `camera.capture`).

De Gateway behandelt deze als **claims** en handhaaft server-side allowlists.

## Presence

- `system-presence` retourneert vermeldingen met apparaatsidentiteit als sleutel.
- Presence-vermeldingen bevatten `deviceId`, `roles` en `scopes`, zodat UI's één rij per apparaat kunnen tonen
  zelfs wanneer het zowel als **operator** als **node** verbinding maakt.
- `node.list` bevat optionele velden `lastSeenAtMs` en `lastSeenReason`. Verbonden nodes rapporteren
  hun huidige verbindingstijd als `lastSeenAtMs` met reden `connect`; gekoppelde nodes kunnen ook
  duurzame achtergrondpresence rapporteren wanneer een vertrouwd Node-event hun koppelingsmetadata bijwerkt.

### Node-achtergrond-alive-event

Nodes kunnen `node.event` aanroepen met `event: "node.presence.alive"` om vast te leggen dat een gekoppelde node
actief was tijdens een achtergrondwake zonder deze als verbonden te markeren.

```json
{
  "event": "node.presence.alive",
  "payloadJSON": "{\"trigger\":\"silent_push\",\"sentAtMs\":1737264000000,\"displayName\":\"Peter's iPhone\",\"version\":\"2026.4.28\",\"platform\":\"iOS 18.4.0\",\"deviceFamily\":\"iPhone\",\"modelIdentifier\":\"iPhone17,1\",\"pushTransport\":\"relay\"}"
}
```

`trigger` is een gesloten enum: `background`, `silent_push`, `bg_app_refresh`,
`significant_location`, `manual` of `connect`. Onbekende triggerstrings worden door de
Gateway genormaliseerd naar `background` voordat ze worden bewaard. Het event is alleen duurzaam voor geauthenticeerde Node-
apparaatsessies; sessies zonder apparaat of zonder koppeling retourneren `handled: false`.

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

Door de server gepushte WebSocket-broadcast-events zijn scope-gated, zodat pairing-scoped of node-only sessies niet passief sessie-inhoud ontvangen.

- **Chat-, agent- en tool-result-frames** (inclusief gestreamde `agent`-events en resultaten van toolcalls) vereisen minimaal `operator.read`. Sessies zonder `operator.read` slaan deze frames volledig over.
- **Door Plugins gedefinieerde `plugin.*`-broadcasts** worden afgeschermd tot `operator.write` of `operator.admin`, afhankelijk van hoe de Plugin ze heeft geregistreerd.
- **Status- en transportevents** (`heartbeat`, `presence`, `tick`, lifecycle voor verbinden/verbreken, enz.) blijven onbeperkt, zodat transportgezondheid observeerbaar blijft voor elke geauthenticeerde sessie.
- **Onbekende broadcast-eventfamilies** zijn standaard scope-gated (fail-closed), tenzij een geregistreerde handler ze expliciet versoepelt.

Elke clientverbinding houdt zijn eigen volgnummer per client bij, zodat broadcasts monotone ordening op die socket behouden, zelfs wanneer verschillende clients verschillende scope-gefilterde subsets van de eventstream zien.

## Veelvoorkomende RPC-methodfamilies

Het openbare WS-oppervlak is breder dan de handshake-/auth-voorbeelden hierboven. Dit
is geen gegenereerde dump — `hello-ok.features.methods` is een conservatieve
discoverylijst opgebouwd uit `src/gateway/server-methods-list.ts` plus geladen
Plugin-/kanaalmethode-exports. Behandel het als featurediscovery, niet als volledige
opsomming van `src/gateway/server-methods/*.ts`.

<AccordionGroup>
  <Accordion title="Systeem en identiteit">
    - `health` retourneert de gecachete of zojuist geprobeerde health-snapshot van de Gateway.
    - `diagnostics.stability` retourneert de recente begrensde diagnostische stabiliteitsrecorder. Deze bewaart operationele metadata zoals eventnamen, aantallen, bytegroottes, geheugenmetingen, queue-/sessiestatus, kanaal-/Plugin-namen en sessie-id's. Deze bewaart geen chattekst, Webhook-bodies, tooloutputs, ruwe request- of responsebodies, tokens, cookies of geheime waarden. Operator-read-scope is vereist.
    - `status` retourneert de Gateway-samenvatting in `/status`-stijl; gevoelige velden worden alleen opgenomen voor operatorclients met adminscope.
    - `gateway.identity.get` retourneert de Gateway-apparaatidentiteit die door relay- en koppelingsflows wordt gebruikt.
    - `system-presence` retourneert de huidige presence-snapshot voor verbonden operator-/Node-apparaten.
    - `system-event` voegt een systeemevent toe en kan presencecontext bijwerken/broadcasten.
    - `last-heartbeat` retourneert het laatst gepersisteerde Heartbeat-event.
    - `set-heartbeats` schakelt Heartbeat-verwerking op de Gateway in of uit.

  </Accordion>

  <Accordion title="Modellen en gebruik">
    - `models.list` retourneert de tijdens runtime toegestane modelcatalogus. Geef `{ "view": "configured" }` door voor geconfigureerde modellen op picker-formaat (`agents.defaults.models` eerst, daarna `models.providers.*.models`), of `{ "view": "all" }` voor de volledige catalogus.
    - `usage.status` retourneert gebruiksvensters van providers en samenvattingen van resterend quotum.
    - `usage.cost` retourneert samengevoegde kostengebruikssamenvattingen voor een datumbereik.
    - `doctor.memory.status` retourneert de gereedheid van vectorgeheugen / gecachte embeddings voor de actieve standaardagentwerkruimte. Geef `{ "probe": true }` of `{ "deep": true }` alleen door wanneer de aanroeper expliciet een live ping naar de embeddingprovider wil.
    - `doctor.memory.remHarness` retourneert een begrensde, alleen-lezen REM-harnaspreview voor externe control-plane-clients. Deze kan werkruimtepaden, geheugenfragmenten, gerenderde onderbouwde markdown en kandidaten voor diepe promotie bevatten, dus aanroepers hebben `operator.read` nodig.
    - `sessions.usage` retourneert gebruikssamenvattingen per sessie.
    - `sessions.usage.timeseries` retourneert tijdreeksgebruik voor één sessie.
    - `sessions.usage.logs` retourneert gebruikslogvermeldingen voor één sessie.

  </Accordion>

  <Accordion title="Kanalen en aanmeldhulpen">
    - `channels.status` retourneert statussamenvattingen van ingebouwde + gebundelde kanalen/plugins.
    - `channels.logout` meldt een specifiek kanaal/account af wanneer het kanaal afmelden ondersteunt.
    - `web.login.start` start een QR/web-aanmeldstroom voor de huidige webkanaalprovider die QR ondersteunt.
    - `web.login.wait` wacht tot die QR/web-aanmeldstroom is voltooid en start het kanaal bij succes.
    - `push.test` verstuurt een test-APNs-push naar een geregistreerde iOS-node.
    - `voicewake.get` retourneert de opgeslagen wake-word-triggers.
    - `voicewake.set` werkt wake-word-triggers bij en broadcast de wijziging.

  </Accordion>

  <Accordion title="Berichten en logs">
    - `send` is de directe RPC voor uitgaande levering voor kanaal/account/thread-gerichte verzendingen buiten de chatrunner.
    - `logs.tail` retourneert de geconfigureerde gateway-bestandslogtail met cursor/limiet- en max-bytes-instellingen.

  </Accordion>

  <Accordion title="Talk en TTS">
    - `talk.config` retourneert de effectieve Talk-configpayload; `includeSecrets` vereist `operator.talk.secrets` (of `operator.admin`).
    - `talk.mode` stelt de huidige Talk-modusstatus in voor WebChat/Control UI-clients en broadcast deze.
    - `talk.speak` synthetiseert spraak via de actieve Talk-spraakprovider.
    - `tts.status` retourneert de ingeschakelde TTS-status, actieve provider, fallbackproviders en providerconfiguratiestatus.
    - `tts.providers` retourneert de zichtbare TTS-providerinventaris.
    - `tts.enable` en `tts.disable` schakelen de status van TTS-voorkeuren om.
    - `tts.setProvider` werkt de voorkeurs-TTS-provider bij.
    - `tts.convert` voert een eenmalige tekst-naar-spraakconversie uit.

  </Accordion>

  <Accordion title="Secrets, configuratie, update en wizard">
    - `secrets.reload` lost actieve SecretRefs opnieuw op en vervangt de runtime-secretstatus alleen bij volledig succes.
    - `secrets.resolve` lost secret-toewijzingen voor commandodoelen op voor een specifieke opdracht-/doelset.
    - `config.get` retourneert de huidige configuratiesnapshot en hash.
    - `config.set` schrijft een gevalideerde configuratiepayload.
    - `config.patch` voegt een gedeeltelijke configuratie-update samen.
    - `config.apply` valideert en vervangt de volledige configuratiepayload.
    - `config.schema` retourneert de live configuratieschemapayload die wordt gebruikt door Control UI en CLI-tooling: schema, `uiHints`, versie en generatiemetagegevens, inclusief plugin- + kanaalschemametagegevens wanneer de runtime deze kan laden. Het schema bevat veldmetadata voor `title` / `description`, afgeleid van dezelfde labels en helptekst die door de UI worden gebruikt, inclusief geneste objecten, jokertekens, array-items en `anyOf` / `oneOf` / `allOf`-compositietakken wanneer bijpassende velddocumentatie bestaat.
    - `config.schema.lookup` retourneert een padgebonden opzoekpayload voor één configuratiepad: genormaliseerd pad, een oppervlakkige schemanode, overeenkomende hint + `hintPath`, en directe onderliggende samenvattingen voor UI/CLI-drilldown. Opzoekschemanodes behouden de gebruikersgerichte docs en algemene validatievelden (`title`, `description`, `type`, `enum`, `const`, `format`, `pattern`, grenzen voor numeriek/string/array/object, en vlaggen zoals `additionalProperties`, `deprecated`, `readOnly`, `writeOnly`). Onderliggende samenvattingen tonen `key`, genormaliseerd `path`, `type`, `required`, `hasChildren`, plus de overeenkomende `hint` / `hintPath`.
    - `update.run` voert de Gateway-updatestroom uit en plant alleen een herstart wanneer de update zelf is geslaagd. Package-manager-updates forceren na de pakketvervanging een niet-uitgestelde updateherstart zonder cooldown, zodat het oude Gateway-proces niet lazy blijft laden vanuit een vervangen `dist`-boom.
    - `update.status` retourneert de laatst gecachte updateherstart-sentinel, inclusief de na de herstart draaiende versie wanneer beschikbaar.
    - `wizard.start`, `wizard.next`, `wizard.status` en `wizard.cancel` stellen de onboardingwizard beschikbaar via WS RPC.

  </Accordion>

  <Accordion title="Agent- en werkruimtehulpen">
    - `agents.list` retourneert geconfigureerde agentvermeldingen, inclusief effectief model en runtimemetagegevens.
    - `agents.create`, `agents.update` en `agents.delete` beheren agentrecords en werkruimtebedrading.
    - `agents.files.list`, `agents.files.get` en `agents.files.set` beheren de bootstrap-werkruimtebestanden die voor een agent beschikbaar worden gesteld.
    - `artifacts.list`, `artifacts.get` en `artifacts.download` stellen transcript-afgeleide artifactsamenvattingen en downloads beschikbaar voor een expliciete scope `sessionKey`, `runId` of `taskId`. Run- en taakquery's lossen de eigenaarssessie server-side op en retourneren alleen transcriptmedia met overeenkomende herkomst; onveilige of lokale URL-bronnen retourneren niet-ondersteunde downloads in plaats van server-side op te halen.
    - `agent.identity.get` retourneert de effectieve assistentidentiteit voor een agent of sessie.
    - `agent.wait` wacht tot een run is voltooid en retourneert de terminale snapshot wanneer beschikbaar.

  </Accordion>

  <Accordion title="Sessiebeheer">
    - `sessions.list` retourneert de huidige sessie-index, inclusief `agentRuntime`-metadata per rij wanneer een agentruntimebackend is geconfigureerd.
    - `sessions.subscribe` en `sessions.unsubscribe` schakelen abonnementen op sessiewijzigingsgebeurtenissen in of uit voor de huidige WS-client.
    - `sessions.messages.subscribe` en `sessions.messages.unsubscribe` schakelen abonnementen op transcript-/berichtgebeurtenissen in of uit voor één sessie.
    - `sessions.preview` retourneert begrensde transcriptpreviews voor specifieke sessiesleutels.
    - `sessions.describe` retourneert één Gateway-sessierij voor een exacte sessiesleutel.
    - `sessions.resolve` lost een sessiedoel op of canonicaliseert het.
    - `sessions.create` maakt een nieuwe sessievermelding aan.
    - `sessions.send` verstuurt een bericht naar een bestaande sessie.
    - `sessions.steer` is de variant voor onderbreken-en-bijsturen voor een actieve sessie.
    - `sessions.abort` breekt actief werk voor een sessie af. Een aanroeper kan `key` plus optioneel `runId` doorgeven, of alleen `runId` doorgeven voor actieve runs die de Gateway naar een sessie kan herleiden.
    - `sessions.patch` werkt sessiemetadata/overrides bij en rapporteert het opgeloste canonieke model plus effectieve `agentRuntime`.
    - `sessions.reset`, `sessions.delete` en `sessions.compact` voeren sessieonderhoud uit.
    - `sessions.get` retourneert de volledige opgeslagen sessierij.
    - Chatuitvoering gebruikt nog steeds `chat.history`, `chat.send`, `chat.abort` en `chat.inject`. `chat.history` is voor UI-clients display-genormaliseerd: inline directivetags worden uit zichtbare tekst verwijderd, platte-tekst tool-call-XML-payloads (inclusief `<tool_call>...</tool_call>`, `<function_call>...</function_call>`, `<tool_calls>...</tool_calls>`, `<function_calls>...</function_calls>` en afgekorte tool-call-blokken) en gelekte ASCII-/full-width-modelcontroletokens worden verwijderd, pure silent-token assistentrijen zoals exact `NO_REPLY` / `no_reply` worden weggelaten, en te grote rijen kunnen worden vervangen door placeholders.

  </Accordion>

  <Accordion title="Apparaatkoppeling en apparaattokens">
    - `device.pair.list` retourneert wachtende en goedgekeurde gekoppelde apparaten.
    - `device.pair.approve`, `device.pair.reject` en `device.pair.remove` beheren apparaatkoppelingsrecords.
    - `device.token.rotate` roteert een gekoppeld apparaattoken binnen de goedgekeurde rol- en aanroeperscopegrenzen.
    - `device.token.revoke` trekt een gekoppeld apparaattoken in binnen de goedgekeurde rol- en aanroeperscopegrenzen.

  </Accordion>

  <Accordion title="Node-koppeling, aanroepen en wachtend werk">
    - `node.pair.request`, `node.pair.list`, `node.pair.approve`, `node.pair.reject`, `node.pair.remove` en `node.pair.verify` dekken node-koppeling en bootstrapverificatie.
    - `node.list` en `node.describe` retourneren bekende/verbonden nodestatus.
    - `node.rename` werkt een gekoppeld nodelabel bij.
    - `node.invoke` stuurt een opdracht door naar een verbonden node.
    - `node.invoke.result` retourneert het resultaat voor een aanroepverzoek.
    - `node.event` brengt door nodes afkomstige gebeurtenissen terug naar de Gateway.
    - `node.canvas.capability.refresh` vernieuwt scoped canvas-capability-tokens.
    - `node.pending.pull` en `node.pending.ack` zijn de queue-API's voor verbonden nodes.
    - `node.pending.enqueue` en `node.pending.drain` beheren duurzaam wachtend werk voor offline/losgekoppelde nodes.

  </Accordion>

  <Accordion title="Goedkeuringsfamilies">
    - `exec.approval.request`, `exec.approval.get`, `exec.approval.list` en `exec.approval.resolve` dekken eenmalige exec-goedkeuringsverzoeken plus opzoeken/herhalen van wachtende goedkeuringen.
    - `exec.approval.waitDecision` wacht op één wachtende exec-goedkeuring en retourneert de uiteindelijke beslissing (of `null` bij timeout).
    - `exec.approvals.get` en `exec.approvals.set` beheren snapshots van Gateway-exec-goedkeuringsbeleid.
    - `exec.approvals.node.get` en `exec.approvals.node.set` beheren node-lokaal exec-goedkeuringsbeleid via node-relayopdrachten.
    - `plugin.approval.request`, `plugin.approval.list`, `plugin.approval.waitDecision` en `plugin.approval.resolve` dekken door plugins gedefinieerde goedkeuringsstromen.

  </Accordion>

  <Accordion title="Automatisering, Skills en tools">
    - Automatisering: `wake` plant een onmiddellijke of volgende-heartbeat wake-tekstinjectie; `cron.list`, `cron.status`, `cron.add`, `cron.update`, `cron.remove`, `cron.run`, `cron.runs` beheren gepland werk.
    - Skills en tools: `commands.list`, `skills.*`, `tools.catalog`, `tools.effective`, `tools.invoke`.

  </Accordion>
</AccordionGroup>

### Algemene gebeurtenisfamilies

- `chat`: UI-chatupdates zoals `chat.inject` en andere alleen-transcript chatgebeurtenissen.
- `session.message` en `session.tool`: transcript-/event-stream-updates voor een geabonneerde sessie.
- `sessions.changed`: sessie-index of metadata gewijzigd.
- `presence`: updates van systeempresencesnapshots.
- `tick`: periodieke keepalive-/livenessgebeurtenis.
- `health`: update van Gateway-gezondheidssnapshot.
- `heartbeat`: update van Heartbeat-gebeurtenisstroom.
- `cron`: wijzigingsgebeurtenis voor Cron-run/-job.
- `shutdown`: Gateway-afsluitmelding.
- `node.pair.requested` / `node.pair.resolved`: levenscyclus van node-koppeling.
- `node.invoke.request`: broadcast van node-aanroepverzoek.
- `device.pair.requested` / `device.pair.resolved`: levenscyclus van gekoppeld apparaat.
- `voicewake.changed`: wake-word-triggerconfiguratie gewijzigd.
- `exec.approval.requested` / `exec.approval.resolved`: levenscyclus van exec-goedkeuring.
- `plugin.approval.requested` / `plugin.approval.resolved`: levenscyclus van plugin-goedkeuring.

### Node-helpermethoden

- Nodes kunnen `skills.bins` aanroepen om de huidige lijst met uitvoerbare skillbestanden op te halen voor auto-allow-controles.

### Operator-helpermethoden

- Operators kunnen `commands.list` (`operator.read`) aanroepen om de runtime
  commando-inventaris voor een agent op te halen.
  - `agentId` is optioneel; laat dit weg om de standaard agent-werkruimte te lezen.
  - `scope` bepaalt op welk oppervlak de primaire `name` is gericht:
    - `text` retourneert het primaire tekstcommando-token zonder de voorafgaande `/`
    - `native` en het standaardpad `both` retourneren providerbewuste native namen
      wanneer beschikbaar
  - `textAliases` bevat exacte slash-aliassen zoals `/model` en `/m`.
  - `nativeName` bevat de providerbewuste native commandonaam wanneer die bestaat.
  - `provider` is optioneel en heeft alleen invloed op native naamgeving plus de beschikbaarheid van native Plugin-commando's.
  - `includeArgs=false` laat geserialiseerde argumentmetadata weg uit de respons.
- Operators kunnen `tools.catalog` (`operator.read`) aanroepen om de runtime-toolcatalogus voor een
  agent op te halen. De respons bevat gegroepeerde tools en herkomstmetadata:
  - `source`: `core` of `plugin`
  - `pluginId`: Plugin-eigenaar wanneer `source="plugin"`
  - `optional`: of een Plugin-tool optioneel is
- Operators kunnen `tools.effective` (`operator.read`) aanroepen om de runtime-effectieve tool-
  inventaris voor een sessie op te halen.
  - `sessionKey` is verplicht.
  - De gateway leidt vertrouwde runtime-context server-side af uit de sessie in plaats van
    door de aanroeper aangeleverde auth- of aflevercontext te accepteren.
  - De respons is sessiegebonden en weerspiegelt wat het actieve gesprek nu kan gebruiken,
    inclusief core-, Plugin- en kanaaltools.
- Operators kunnen `tools.invoke` (`operator.write`) aanroepen om een beschikbare tool aan te roepen via hetzelfde
  Gateway-beleidspad als `/tools/invoke`.
  - `name` is verplicht. `args`, `sessionKey`, `agentId`, `confirm` en
    `idempotencyKey` zijn optioneel.
  - Als zowel `sessionKey` als `agentId` aanwezig zijn, moet de opgeloste sessie-agent overeenkomen met
    `agentId`.
  - De respons is een SDK-gerichte envelop met `ok`, `toolName`, optionele `output` en getypeerde
    `error`-velden. Goedkeurings- of beleidsweigeringen retourneren `ok:false` in de payload in plaats van
    de Gateway-toolbeleidspijplijn te omzeilen.
- Operators kunnen `skills.status` (`operator.read`) aanroepen om de zichtbare
  Skill-inventaris voor een agent op te halen.
  - `agentId` is optioneel; laat dit weg om de standaard agent-werkruimte te lezen.
  - De respons bevat geschiktheid, ontbrekende vereisten, configuratiecontroles en
    opgeschoonde installatieopties zonder ruwe geheime waarden bloot te leggen.
- Operators kunnen `skills.search` en `skills.detail` (`operator.read`) aanroepen voor
  ClawHub-detectiemetadata.
- Operators kunnen `skills.install` (`operator.admin`) in twee modi aanroepen:
  - ClawHub-modus: `{ source: "clawhub", slug, version?, force? }` installeert een
    Skill-map in de standaard `skills/`-directory van de agent-werkruimte.
  - Gateway-installatiemodus: `{ name, installId, dangerouslyForceUnsafeInstall?, timeoutMs? }`
    voert een gedeclareerde `metadata.openclaw.install`-actie uit op de Gateway-host.
- Operators kunnen `skills.update` (`operator.admin`) in twee modi aanroepen:
  - ClawHub-modus werkt één gevolgde slug of alle gevolgde ClawHub-installaties bij in
    de standaard agent-werkruimte.
  - Configuratiemodus patcht waarden van `skills.entries.<skillKey>` zoals `enabled`,
    `apiKey` en `env`.

### `models.list`-weergaven

`models.list` accepteert een optionele parameter `view`:

- Weggelaten of `"default"`: huidig runtime-gedrag. Als `agents.defaults.models` is geconfigureerd, is de respons de toegestane catalogus; anders is de respons de volledige Gateway-catalogus.
- `"configured"`: gedrag op picker-formaat. Als `agents.defaults.models` is geconfigureerd, blijft dit leidend. Anders gebruikt de respons expliciete vermeldingen in `models.providers.*.models`, met terugval naar de volledige catalogus alleen wanneer er geen geconfigureerde modelrijen bestaan.
- `"all"`: volledige Gateway-catalogus, waarbij `agents.defaults.models` wordt omzeild. Gebruik dit voor diagnostiek en discovery-UI's, niet voor normale modelpickers.

## Exec-goedkeuringen

- Wanneer een exec-aanvraag goedkeuring vereist, zendt de Gateway `exec.approval.requested` uit.
- Operator-clients lossen dit op door `exec.approval.resolve` aan te roepen (vereist scope `operator.approvals`).
- Voor `host=node` moet `exec.approval.request` `systemRunPlan` bevatten (canonieke `argv`/`cwd`/`rawCommand`/sessiemetadata). Aanvragen zonder `systemRunPlan` worden geweigerd.
- Na goedkeuring hergebruiken doorgestuurde `node.invoke system.run`-aanroepen dat canonieke
  `systemRunPlan` als de gezaghebbende opdracht-/cwd-/sessiecontext.
- Als een aanroeper `command`, `rawCommand`, `cwd`, `agentId` of
  `sessionKey` wijzigt tussen voorbereiding en de definitieve goedgekeurde `system.run`-forward, wijst de
  Gateway de run af in plaats van de gewijzigde payload te vertrouwen.

## Terugval voor agent-aflevering

- `agent`-aanvragen kunnen `deliver=true` bevatten om uitgaande aflevering aan te vragen.
- `bestEffortDeliver=false` behoudt strikt gedrag: niet-opgeloste of alleen-interne afleverdoelen retourneren `INVALID_REQUEST`.
- `bestEffortDeliver=true` staat terugval naar sessie-only uitvoering toe wanneer geen extern afleverbare route kan worden opgelost (bijvoorbeeld interne/webchat-sessies of dubbelzinnige meerkanaalsconfiguraties).

## Versiebeheer

- `PROTOCOL_VERSION` staat in `src/gateway/protocol/schema/protocol-schemas.ts`.
- Clients sturen `minProtocol` + `maxProtocol`; de server weigert mismatches.
- Schema's + modellen worden gegenereerd uit TypeBox-definities:
  - `pnpm protocol:gen`
  - `pnpm protocol:gen:swift`
  - `pnpm protocol:check`

### Clientconstanten

De referentieclient in `src/gateway/client.ts` gebruikt deze standaardwaarden. Waarden zijn
stabiel binnen protocol v3 en vormen de verwachte basislijn voor externe clients.

| Constante                                 | Standaard                                             | Bron                                                                                       |
| ----------------------------------------- | ----------------------------------------------------- | ------------------------------------------------------------------------------------------ |
| `PROTOCOL_VERSION`                        | `3`                                                   | `src/gateway/protocol/schema/protocol-schemas.ts`                                          |
| Aanvraagtime-out (per RPC)                | `30_000` ms                                           | `src/gateway/client.ts` (`requestTimeoutMs`)                                               |
| Time-out voor preauth / connect-challenge | `15_000` ms                                           | `src/gateway/handshake-timeouts.ts` (config/env kan het gekoppelde server/client-budget verhogen) |
| Initiële reconnect-backoff                | `1_000` ms                                            | `src/gateway/client.ts` (`backoffMs`)                                                      |
| Maximale reconnect-backoff                | `30_000` ms                                           | `src/gateway/client.ts` (`scheduleReconnect`)                                              |
| Fast-retry clamp na device-token close    | `250` ms                                              | `src/gateway/client.ts`                                                                    |
| Respijt voor force-stop vóór `terminate()` | `250` ms                                             | `FORCE_STOP_TERMINATE_GRACE_MS`                                                            |
| Standaardtime-out van `stopAndWait()`     | `1_000` ms                                            | `STOP_AND_WAIT_TIMEOUT_MS`                                                                 |
| Standaard tick-interval (vóór `hello-ok`) | `30_000` ms                                           | `src/gateway/client.ts`                                                                    |
| Sluiten bij tick-time-out                 | code `4000` wanneer stilte `tickIntervalMs * 2` overschrijdt | `src/gateway/client.ts`                                                                    |
| `MAX_PAYLOAD_BYTES`                       | `25 * 1024 * 1024` (25 MB)                            | `src/gateway/server-constants.ts`                                                          |

De server adverteert de effectieve `policy.tickIntervalMs`, `policy.maxPayload`
en `policy.maxBufferedBytes` in `hello-ok`; clients moeten die waarden respecteren
in plaats van de standaardwaarden van vóór de handshake.

## Auth

- Gateway-authenticatie met een gedeeld geheim gebruikt `connect.params.auth.token` of
  `connect.params.auth.password`, afhankelijk van de geconfigureerde authenticatiemodus.
- Identiteitsdragende modi zoals Tailscale Serve
  (`gateway.auth.allowTailscale: true`) of niet-loopback
  `gateway.auth.mode: "trusted-proxy"` voldoen aan de connect-authenticatiecontrole via
  requestheaders in plaats van `connect.params.auth.*`.
- Private-ingress `gateway.auth.mode: "none"` slaat connect-authenticatie met gedeeld geheim
  volledig over; stel die modus niet beschikbaar op publieke/niet-vertrouwde ingress.
- Na koppeling geeft de Gateway een **apparaattoken** uit, beperkt tot de verbindingsrol
  + scopes. Het wordt teruggegeven in `hello-ok.auth.deviceToken` en moet door de
  client worden bewaard voor toekomstige verbindingen.
- Clients moeten de primaire `hello-ok.auth.deviceToken` bewaren na elke
  geslaagde verbinding.
- Opnieuw verbinden met dat **opgeslagen** apparaattoken moet ook de opgeslagen
  goedgekeurde scopeset voor dat token hergebruiken. Dit behoudt lees-/probe-/status-toegang
  die al was verleend en voorkomt dat herverbindingen stilzwijgend worden beperkt tot een
  smallere impliciete scope voor alleen beheerders.
- Samenstelling van connect-authenticatie aan clientzijde (`selectConnectAuth` in
  `src/gateway/client.ts`):
  - `auth.password` staat los hiervan en wordt altijd doorgestuurd wanneer deze is ingesteld.
  - `auth.token` wordt ingevuld in prioriteitsvolgorde: eerst een expliciet gedeeld token,
    daarna een expliciet `deviceToken`, daarna een opgeslagen apparaatspecifiek token
    (op basis van `deviceId` + `role`).
  - `auth.bootstrapToken` wordt alleen verzonden wanneer geen van de bovenstaande opties een
    `auth.token` heeft opgeleverd. Een gedeeld token of een gevonden apparaattoken onderdrukt dit.
  - Automatische promotie van een opgeslagen apparaattoken bij de eenmalige
    `AUTH_TOKEN_MISMATCH`-retry is beperkt tot **alleen vertrouwde eindpunten** —
    loopback, of `wss://` met een vastgezette `tlsFingerprint`. Publieke `wss://`
    zonder pinning komt niet in aanmerking.
- Aanvullende `hello-ok.auth.deviceTokens`-items zijn overdrachtstokens voor bootstrap.
  Bewaar ze alleen wanneer de verbinding bootstrap-authenticatie gebruikte op een vertrouwd transport
  zoals `wss://` of loopback/lokale koppeling.
- Als een client een **expliciet** `deviceToken` of expliciete `scopes` opgeeft, blijft die
  door de aanroeper gevraagde scopeset leidend; scopes uit de cache worden alleen
  hergebruikt wanneer de client het opgeslagen apparaatspecifieke token hergebruikt.
- Apparaattokens kunnen worden geroteerd/ingetrokken via `device.token.rotate` en
  `device.token.revoke` (vereist de scope `operator.pairing`).
- `device.token.rotate` geeft rotatiemetadata terug. Het echoot het vervangende
  bearer-token alleen voor aanroepen vanaf hetzelfde apparaat die al met dat apparaattoken zijn
  geauthenticeerd, zodat clients die alleen tokens gebruiken hun vervanging kunnen bewaren voordat
  ze opnieuw verbinden. Rotaties via gedeelde/beheerdersrechten echoën het bearer-token niet.
- Tokenuitgifte, rotatie en intrekking blijven begrensd tot de goedgekeurde rollenset
  die is vastgelegd in de koppelingsvermelding van dat apparaat; tokenmutatie kan geen
  apparaatrol uitbreiden of targeten waarvoor de koppelingsgoedkeuring nooit toestemming gaf.
- Voor gekoppelde apparaattokensessies is apparaatbeheer zelfgescoped, tenzij de
  aanroeper ook `operator.admin` heeft: niet-beheerders kunnen alleen hun **eigen**
  apparaatvermelding verwijderen/intrekken/roteren.
- `device.token.rotate` en `device.token.revoke` controleren ook de target-operatorscopeset
  van het token tegen de huidige sessiescopes van de aanroeper. Niet-beheerders
  kunnen geen breder operator-token roteren of intrekken dan ze zelf al hebben.
- Authenticatiefouten bevatten `error.details.code` plus herstelhints:
  - `error.details.canRetryWithDeviceToken` (boolean)
  - `error.details.recommendedNextStep` (`retry_with_device_token`, `update_auth_configuration`, `update_auth_credentials`, `wait_then_retry`, `review_auth_configuration`)
- Clientgedrag voor `AUTH_TOKEN_MISMATCH`:
  - Vertrouwde clients mogen één begrensde retry proberen met een gecachet apparaatspecifiek token.
  - Als die retry mislukt, moeten clients automatische herverbindingslussen stoppen en begeleiding voor operatoractie tonen.

## Apparaatidentiteit + koppeling

- Nodes moeten een stabiele apparaatidentiteit (`device.id`) opnemen, afgeleid van een
  keypair-vingerafdruk.
- Gateways geven tokens uit per apparaat + rol.
- Koppelingsgoedkeuringen zijn vereist voor nieuwe apparaat-ID's, tenzij lokale automatische goedkeuring
  is ingeschakeld.
- Automatische koppelingsgoedkeuring is gericht op directe local loopback-verbindingen.
- OpenClaw heeft ook een smal backend-/containerlokaal zelfverbindingspad voor
  vertrouwde helperflows met gedeeld geheim.
- Tailnet- of LAN-verbindingen op dezelfde host worden voor koppeling nog steeds als extern behandeld en
  vereisen goedkeuring.
- WS-clients nemen normaal gesproken `device`-identiteit op tijdens `connect` (operator +
  node). De enige apparaatloze operatorexcepties zijn expliciete vertrouwenspaden:
  - `gateway.controlUi.allowInsecureAuth=true` voor localhost-only compatibiliteit met onveilige HTTP.
  - geslaagde operator-authenticatie voor de Control UI met `gateway.auth.mode: "trusted-proxy"`.
  - `gateway.controlUi.dangerouslyDisableDeviceAuth=true` (noodmaatregel, ernstige beveiligingsverlaging).
  - direct-loopback `gateway-client` backend-RPC's die zijn geauthenticeerd met het gedeelde
    gateway-token/wachtwoord.
- Alle verbindingen moeten de door de server verstrekte `connect.challenge`-nonce ondertekenen.

### Diagnostiek voor migratie van apparaatauthenticatie

Voor legacyclients die nog pre-challenge-ondertekeningsgedrag gebruiken, geeft `connect` nu
`DEVICE_AUTH_*`-detailcodes terug onder `error.details.code` met een stabiele `error.details.reason`.

Veelvoorkomende migratiefouten:

| Bericht                     | details.code                     | details.reason           | Betekenis                                          |
| --------------------------- | -------------------------------- | ------------------------ | -------------------------------------------------- |
| `device nonce required`     | `DEVICE_AUTH_NONCE_REQUIRED`     | `device-nonce-missing`   | Client liet `device.nonce` weg (of stuurde leeg).  |
| `device nonce mismatch`     | `DEVICE_AUTH_NONCE_MISMATCH`     | `device-nonce-mismatch`  | Client ondertekende met een verlopen/verkeerde nonce. |
| `device signature invalid`  | `DEVICE_AUTH_SIGNATURE_INVALID`  | `device-signature`       | Handtekeningpayload komt niet overeen met v2-payload. |
| `device signature expired`  | `DEVICE_AUTH_SIGNATURE_EXPIRED`  | `device-signature-stale` | Ondertekende timestamp valt buiten de toegestane marge. |
| `device identity mismatch`  | `DEVICE_AUTH_DEVICE_ID_MISMATCH` | `device-id-mismatch`     | `device.id` komt niet overeen met de vingerafdruk van de publieke sleutel. |
| `device public key invalid` | `DEVICE_AUTH_PUBLIC_KEY_INVALID` | `device-public-key`      | Indeling/canonicalisatie van publieke sleutel is mislukt. |

Migratiedoel:

- Wacht altijd op `connect.challenge`.
- Onderteken de v2-payload die de servernonce bevat.
- Stuur dezelfde nonce in `connect.params.device.nonce`.
- De voorkeurs-handtekeningpayload is `v3`, die `platform` en `deviceFamily`
  bindt naast de velden voor apparaat/client/rol/scopes/token/nonce.
- Legacy `v2`-handtekeningen blijven geaccepteerd voor compatibiliteit, maar metadata-pinning
  voor gekoppelde apparaten blijft het opdrachtbeleid bij opnieuw verbinden bepalen.

## TLS + pinning

- TLS wordt ondersteund voor WS-verbindingen.
- Clients mogen optioneel de Gateway-certificaatvingerafdruk pinnen (zie `gateway.tls`-
  configuratie plus `gateway.remote.tlsFingerprint` of CLI `--tls-fingerprint`).

## Scope

Dit protocol stelt de **volledige Gateway-API** beschikbaar (status, kanalen, modellen, chat,
agent, sessies, nodes, goedkeuringen, enz.). Het exacte oppervlak wordt gedefinieerd door de
TypeBox-schema's in `src/gateway/protocol/schema.ts`.

## Gerelateerd

- [Bridge-protocol](/nl/gateway/bridge-protocol)
- [Gateway-runbook](/nl/gateway)
