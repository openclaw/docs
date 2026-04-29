---
read_when:
    - Gateway-WS-clients implementeren of bijwerken
    - Protocolmismatches of verbindingsfouten debuggen
    - Protocolschema/-modellen opnieuw genereren
summary: 'Gateway WebSocket-protocol: handshake, frames, versionering'
title: Gateway-protocol
x-i18n:
    generated_at: "2026-04-29T22:47:20Z"
    model: gpt-5.5
    provider: openai
    source_hash: 51647177913f9ba0bbbe4fffbe4e06ff120d5307d075f49cb99d363ac6ad0f11
    source_path: gateway/protocol.md
    workflow: 16
---

Het Gateway WS-protocol is het **enige besturingsvlak + Node-transport** voor
OpenClaw. Alle clients (CLI, web-UI, macOS-app, iOS/Android-nodes, headless
nodes) verbinden via WebSocket en declareren hun **rol** + **scope** tijdens de
handshake.

## Transport

- WebSocket, tekstframes met JSON-inhoud.
- Het eerste frame **moet** een `connect`-verzoek zijn.
- Pre-connect-frames zijn begrensd op 64 KiB. Na een geslaagde handshake moeten clients
  de limieten `hello-ok.policy.maxPayload` en
  `hello-ok.policy.maxBufferedBytes` volgen. Met diagnostiek ingeschakeld
  zenden te grote inkomende frames en trage uitgaande buffers `payload.large`-gebeurtenissen uit
  voordat de Gateway het betrokken frame sluit of weggooit. Deze gebeurtenissen bewaren
  groottes, limieten, oppervlakken en veilige redencodes. Ze bewaren niet de berichtinhoud,
  bijlage-inhoud, onbewerkte frame-inhoud, tokens, cookies of geheime waarden.

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
een opnieuw probeerbare `UNAVAILABLE`-fout teruggeven met `details.reason` ingesteld op
`"startup-sidecars"` en `retryAfterMs`. Clients moeten die respons opnieuw proberen
binnen hun totale verbindingsbudget in plaats van deze als een definitieve
handshakefout te tonen.

`server`, `features`, `snapshot` en `policy` zijn allemaal vereist door het schema
(`src/gateway/protocol/schema/frames.ts`). `auth` is ook vereist en rapporteert
de onderhandelde rol/scopes. `canvasHostUrl` is optioneel.

Wanneer geen apparaattoken wordt uitgegeven, rapporteert `hello-ok.auth` de onderhandelde
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
ze authenticeren met het gedeelde gatewaytoken/wachtwoord. Dit pad is gereserveerd
voor interne besturingsvlak-RPC's en voorkomt dat verouderde CLI-/apparaatkoppelingsbaselines
lokaal backendwerk blokkeren, zoals sessie-updates van subagenten. Externe clients,
clients met browser-origin, nodeclients en expliciete apparaat-token-/apparaat-identiteitsclients
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

Tijdens vertrouwde bootstrap-overdracht kan `hello-ok.auth` ook extra
begrensde rolitems bevatten in `deviceTokens`:

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

Voor de ingebouwde bootstrapstroom voor node/operator blijft het primaire nodetoken
`scopes: []` en blijft elk overgedragen operatortoken begrensd tot de allowlist
voor bootstrapoperators (`operator.approvals`, `operator.read`,
`operator.talk.secrets`, `operator.write`). Bootstrap-scopecontroles blijven
rolgeprefixt: operatoritems voldoen alleen aan operatorverzoeken, en niet-operatorrollen
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

- **Verzoek**: `{type:"req", id, method, params}`
- **Respons**: `{type:"res", id, ok, payload|error}`
- **Gebeurtenis**: `{type:"event", event, payload, seq?, stateVersion?}`

Methoden met neveneffecten vereisen **idempotentiesleutels** (zie schema).

## Rollen + scopes

### Rollen

- `operator` = besturingsvlakclient (CLI/UI/automatisering).
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

Door Plugins geregistreerde Gateway-RPC-methoden mogen hun eigen operatorscope aanvragen, maar
gereserveerde core-adminprefixen (`config.*`, `exec.approvals.*`, `wizard.*`,
`update.*`) lossen altijd op naar `operator.admin`.

Methode-scope is alleen de eerste poort. Sommige slashopdrachten die via
`chat.send` worden bereikt, passen daarbovenop strengere controles op opdrachtniveau toe. Bijvoorbeeld: persistente
schrijfacties van `/config set` en `/config unset` vereisen `operator.admin`.

`node.pair.approve` heeft bovenop de
basismethodescope ook een extra scopecontrole tijdens goedkeuring:

- verzoeken zonder opdracht: `operator.pairing`
- verzoeken met niet-exec-nodeopdrachten: `operator.pairing` + `operator.write`
- verzoeken die `system.run`, `system.run.prepare` of `system.which` bevatten:
  `operator.pairing` + `operator.admin`

### Caps/opdrachten/machtigingen (node)

Nodes declareren capabilityclaims tijdens het verbinden:

- `caps`: capabilitycategorieën op hoog niveau.
- `commands`: opdracht-allowlist voor aanroepen.
- `permissions`: fijnmazige schakelaars (bijv. `screen.record`, `camera.capture`).

De Gateway behandelt deze als **claims** en handhaaft serverzijdige allowlists.

## Presence

- `system-presence` retourneert items met apparaatsidentiteit als sleutel.
- Presence-items bevatten `deviceId`, `roles` en `scopes`, zodat UI's één rij per apparaat kunnen tonen
  zelfs wanneer het zowel als **operator** als **node** verbinding maakt.
- `node.list` bevat optionele velden `lastSeenAtMs` en `lastSeenReason`. Verbonden nodes rapporteren
  hun huidige verbindingstijd als `lastSeenAtMs` met reden `connect`; gekoppelde nodes kunnen ook
  duurzame achtergrond-presence rapporteren wanneer een vertrouwde nodegebeurtenis hun koppelingsmetadata bijwerkt.

### Node-achtergrond alive-gebeurtenis

Nodes mogen `node.event` aanroepen met `event: "node.presence.alive"` om vast te leggen dat een gekoppelde node
actief was tijdens een achtergrondwake zonder deze als verbonden te markeren.

```json
{
  "event": "node.presence.alive",
  "payloadJSON": "{\"trigger\":\"silent_push\",\"sentAtMs\":1737264000000,\"displayName\":\"Peter's iPhone\",\"version\":\"2026.4.28\",\"platform\":\"iOS 18.4.0\",\"deviceFamily\":\"iPhone\",\"modelIdentifier\":\"iPhone17,1\",\"pushTransport\":\"relay\"}"
}
```

`trigger` is een gesloten enum: `background`, `silent_push`, `bg_app_refresh`,
`significant_location`, `manual` of `connect`. Onbekende triggerstrings worden door de gateway vóór persistentie genormaliseerd naar
`background`. De gebeurtenis is alleen duurzaam voor geauthenticeerde node-
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

## Scoping van broadcastgebeurtenissen

Door de server gepushte WebSocket-broadcastgebeurtenissen zijn scope-begrensd, zodat sessies met koppelingsscope of alleen-node-sessies niet passief sessie-inhoud ontvangen.

- **Chat-, agent- en tool-resultaatframes** (inclusief gestreamde `agent`-gebeurtenissen en resultaten van toolaanroepen) vereisen minimaal `operator.read`. Sessies zonder `operator.read` slaan deze frames volledig over.
- **Door Plugins gedefinieerde `plugin.*`-broadcasts** worden begrensd tot `operator.write` of `operator.admin`, afhankelijk van hoe de Plugin ze heeft geregistreerd.
- **Status- en transportgebeurtenissen** (`heartbeat`, `presence`, `tick`, connect/disconnect-levenscyclus, enz.) blijven onbeperkt, zodat transportgezondheid voor elke geauthenticeerde sessie observeerbaar blijft.
- **Onbekende families van broadcastgebeurtenissen** zijn standaard scope-begrensd (fail-closed), tenzij een geregistreerde handler ze expliciet versoepelt.

Elke clientverbinding behoudt zijn eigen sequentienummer per client, zodat broadcasts monotone ordening op die socket behouden, zelfs wanneer verschillende clients verschillende scope-gefilterde subsets van de gebeurtenisstroom zien.

## Veelgebruikte RPC-methodefamilies

Het publieke WS-oppervlak is breder dan de handshake-/auth-voorbeelden hierboven. Dit
is geen gegenereerde dump — `hello-ok.features.methods` is een conservatieve
ontdekkingslijst, opgebouwd uit `src/gateway/server-methods-list.ts` plus geladen
exports van Plugin-/kanaalmethoden. Behandel deze als featureontdekking, niet als een volledige
opsomming van `src/gateway/server-methods/*.ts`.

<AccordionGroup>
  <Accordion title="Systeem en identiteit">
    - `health` retourneert de gecachete of zojuist geprobeerde gateway-gezondheidssnapshot.
    - `diagnostics.stability` retourneert de recente begrensde stabiliteitsrecorder voor diagnostiek. Deze bewaart operationele metadata zoals gebeurtenisnamen, aantallen, bytegroottes, geheugenuitlezingen, wachtrij-/sessiestatus, kanaal-/Pluginnamen en sessie-id's. Deze bewaart geen chattekst, webhook-inhouden, tooluitvoer, onbewerkte aanvraag- of responsinhouden, tokens, cookies of geheime waarden. Operatorscope voor lezen is vereist.
    - `status` retourneert de `/status`-achtige Gateway-samenvatting; gevoelige velden worden alleen opgenomen voor operatorclients met adminscope.
    - `gateway.identity.get` retourneert de Gateway-apparaatidentiteit die wordt gebruikt door relay- en koppelingsstromen.
    - `system-presence` retourneert de huidige presence-snapshot voor verbonden operator-/nodeapparaten.
    - `system-event` voegt een systeemgebeurtenis toe en kan presencecontext bijwerken/uitzenden.
    - `last-heartbeat` retourneert de laatste gepersisteerde heartbeat-gebeurtenis.
    - `set-heartbeats` schakelt heartbeat-verwerking op de Gateway in of uit.

  </Accordion>

  <Accordion title="Modellen en gebruik">
    - `models.list` retourneert de door de runtime toegestane modelcatalogus. Geef `{ "view": "configured" }` mee voor geconfigureerde modellen op picker-formaat (`agents.defaults.models` eerst, daarna `models.providers.*.models`), of `{ "view": "all" }` voor de volledige catalogus.
    - `usage.status` retourneert samenvattingen van provider-gebruiksvensters/resterende quota.
    - `usage.cost` retourneert samengevoegde kostengebruikssamenvattingen voor een datumbereik.
    - `doctor.memory.status` retourneert de gereedheid van vectorgeheugen / gecachte embeddings voor de actieve standaard-agentwerkruimte. Geef `{ "probe": true }` of `{ "deep": true }` alleen mee wanneer de aanroeper expliciet een live ping naar de embeddingprovider wil.
    - `doctor.memory.remHarness` retourneert een begrensde, alleen-lezen REM-harnesspreview voor externe control-plane-clients. Deze kan werkruimtepaden, geheugenfragmenten, gerenderde grounded markdown en kandidaten voor diepe promotie bevatten, dus aanroepers hebben `operator.read` nodig.
    - `sessions.usage` retourneert gebruikssamenvattingen per sessie.
    - `sessions.usage.timeseries` retourneert tijdreeksgebruik voor één sessie.
    - `sessions.usage.logs` retourneert gebruikslogvermeldingen voor één sessie.

  </Accordion>

  <Accordion title="Kanalen en inloghelpers">
    - `channels.status` retourneert statusoverzichten van ingebouwde + gebundelde kanalen/plugins.
    - `channels.logout` logt uit bij een specifiek kanaal/account waar het kanaal uitloggen ondersteunt.
    - `web.login.start` start een QR-/webinlogflow voor de huidige QR-compatibele webkanaalprovider.
    - `web.login.wait` wacht tot die QR-/webinlogflow is voltooid en start het kanaal bij succes.
    - `push.test` stuurt een test-APNs-push naar een geregistreerde iOS-Node.
    - `voicewake.get` retourneert de opgeslagen wake-word-triggers.
    - `voicewake.set` werkt wake-word-triggers bij en zendt de wijziging uit.

  </Accordion>

  <Accordion title="Berichten en logs">
    - `send` is de directe RPC voor uitgaande aflevering voor verzendingen gericht op kanaal/account/thread buiten de chatrunner.
    - `logs.tail` retourneert de geconfigureerde Gateway-bestandslogtail met cursor-/limiet- en max-byte-instellingen.

  </Accordion>

  <Accordion title="Talk en TTS">
    - `talk.config` retourneert de effectieve Talk-configpayload; `includeSecrets` vereist `operator.talk.secrets` (of `operator.admin`).
    - `talk.mode` stelt de huidige Talk-modusstatus in voor WebChat-/Control UI-clients en zendt die uit.
    - `talk.speak` synthetiseert spraak via de actieve Talk-spraakprovider.
    - `tts.status` retourneert de ingeschakelde TTS-status, actieve provider, fallbackproviders en providerconfiguratiestatus.
    - `tts.providers` retourneert de zichtbare TTS-providerinventaris.
    - `tts.enable` en `tts.disable` schakelen de status van TTS-voorkeuren om.
    - `tts.setProvider` werkt de voorkeurs-TTS-provider bij.
    - `tts.convert` voert een eenmalige tekst-naar-spraakconversie uit.

  </Accordion>

  <Accordion title="Geheimen, config, update en wizard">
    - `secrets.reload` lost actieve SecretRefs opnieuw op en wisselt de runtimegeheimstatus alleen bij volledig succes om.
    - `secrets.resolve` lost geheime toewijzingen voor commandodoelen op voor een specifieke opdracht-/doelset.
    - `config.get` retourneert de huidige config-snapshot en hash.
    - `config.set` schrijft een gevalideerde configpayload.
    - `config.patch` voegt een gedeeltelijke config-update samen.
    - `config.apply` valideert + vervangt de volledige configpayload.
    - `config.schema` retourneert de live config-schemapayload die wordt gebruikt door Control UI en CLI-tooling: schema, `uiHints`, versie en generatiemetadata, inclusief plugin- + kanaalschemametadata wanneer de runtime die kan laden. Het schema bevat veldmetadata voor `title` / `description`, afgeleid van dezelfde labels en helptekst die door de UI worden gebruikt, inclusief geneste object-, wildcard-, array-item- en `anyOf` / `oneOf` / `allOf`-compositietakken wanneer bijpassende velddocumentatie bestaat.
    - `config.schema.lookup` retourneert een padgebonden lookup-payload voor één configpad: genormaliseerd pad, een oppervlakkige schemanode, overeenkomende hint + `hintPath`, en directe kindsamenvattingen voor UI-/CLI-drilldown. Lookup-schemanodes behouden de gebruikersgerichte documentatie en algemene validatievelden (`title`, `description`, `type`, `enum`, `const`, `format`, `pattern`, numerieke/string-/array-/objectgrenzen, en vlaggen zoals `additionalProperties`, `deprecated`, `readOnly`, `writeOnly`). Kindsamenvattingen tonen `key`, genormaliseerde `path`, `type`, `required`, `hasChildren`, plus de overeenkomende `hint` / `hintPath`.
    - `update.run` voert de Gateway-updateflow uit en plant alleen een herstart wanneer de update zelf is geslaagd.
    - `update.status` retourneert de laatst gecachte update-herstartsentinel, inclusief de draaiende versie na herstart wanneer beschikbaar.
    - `wizard.start`, `wizard.next`, `wizard.status` en `wizard.cancel` stellen de onboardingwizard beschikbaar via WS RPC.

  </Accordion>

  <Accordion title="Agent- en werkruimtehelpers">
    - `agents.list` retourneert geconfigureerde agentvermeldingen, inclusief effectief model en runtimemetadata.
    - `agents.create`, `agents.update` en `agents.delete` beheren agentrecords en werkruimtebedrading.
    - `agents.files.list`, `agents.files.get` en `agents.files.set` beheren de bootstrap-werkruimtebestanden die voor een agent worden aangeboden.
    - `agent.identity.get` retourneert de effectieve assistentidentiteit voor een agent of sessie.
    - `agent.wait` wacht tot een run klaar is en retourneert de terminale snapshot wanneer beschikbaar.

  </Accordion>

  <Accordion title="Sessiebesturing">
    - `sessions.list` retourneert de huidige sessie-index, inclusief `agentRuntime`-metadata per rij wanneer een agent-runtimebackend is geconfigureerd.
    - `sessions.subscribe` en `sessions.unsubscribe` schakelen abonnementen op sessiewijzigingsgebeurtenissen in of uit voor de huidige WS-client.
    - `sessions.messages.subscribe` en `sessions.messages.unsubscribe` schakelen transcript-/berichtgebeurtenisabonnementen in of uit voor één sessie.
    - `sessions.preview` retourneert begrensde transcriptpreviews voor specifieke sessiesleutels.
    - `sessions.resolve` lost een sessiedoel op of canonicaliseert het.
    - `sessions.create` maakt een nieuwe sessievermelding.
    - `sessions.send` stuurt een bericht naar een bestaande sessie.
    - `sessions.steer` is de onderbreek-en-stuur-variant voor een actieve sessie.
    - `sessions.abort` breekt actief werk voor een sessie af.
    - `sessions.patch` werkt sessiemetadata/-overrides bij en rapporteert het opgeloste canonieke model plus effectieve `agentRuntime`.
    - `sessions.reset`, `sessions.delete` en `sessions.compact` voeren sessieonderhoud uit.
    - `sessions.get` retourneert de volledige opgeslagen sessierij.
    - Chatuitvoering gebruikt nog steeds `chat.history`, `chat.send`, `chat.abort` en `chat.inject`. `chat.history` is display-genormaliseerd voor UI-clients: inline directivetags worden uit zichtbare tekst verwijderd, XML-payloads van toolaanroepen in platte tekst (inclusief `<tool_call>...</tool_call>`, `<function_call>...</function_call>`, `<tool_calls>...</tool_calls>`, `<function_calls>...</function_calls>` en afgekorte toolaanroepblokken) en gelekte ASCII-/full-width modelcontroletokens worden verwijderd, zuivere stille-token-assistentrijen zoals exact `NO_REPLY` / `no_reply` worden weggelaten, en te grote rijen kunnen worden vervangen door placeholders.

  </Accordion>

  <Accordion title="Apparaatkoppeling en apparaattokens">
    - `device.pair.list` retourneert wachtende en goedgekeurde gekoppelde apparaten.
    - `device.pair.approve`, `device.pair.reject` en `device.pair.remove` beheren apparaatkoppelingsrecords.
    - `device.token.rotate` roteert een gekoppeld apparaattoken binnen de goedgekeurde rol- en aanroeperscopegrenzen.
    - `device.token.revoke` trekt een gekoppeld apparaattoken in binnen de goedgekeurde rol- en aanroeperscopegrenzen.

  </Accordion>

  <Accordion title="Node-koppeling, aanroepen en wachtend werk">
    - `node.pair.request`, `node.pair.list`, `node.pair.approve`, `node.pair.reject`, `node.pair.remove` en `node.pair.verify` dekken Node-koppeling en bootstrap-verificatie af.
    - `node.list` en `node.describe` retourneren bekende/verbonden Node-status.
    - `node.rename` werkt een gekoppeld Node-label bij.
    - `node.invoke` stuurt een opdracht door naar een verbonden Node.
    - `node.invoke.result` retourneert het resultaat voor een aanroepverzoek.
    - `node.event` voert door de Node geïnitieerde gebeurtenissen terug naar de Gateway.
    - `node.canvas.capability.refresh` vernieuwt scoped canvas-capability-tokens.
    - `node.pending.pull` en `node.pending.ack` zijn de wachtrij-API's voor verbonden Nodes.
    - `node.pending.enqueue` en `node.pending.drain` beheren duurzaam wachtend werk voor offline/losgekoppelde Nodes.

  </Accordion>

  <Accordion title="Goedkeuringsfamilies">
    - `exec.approval.request`, `exec.approval.get`, `exec.approval.list` en `exec.approval.resolve` dekken eenmalige exec-goedkeuringsverzoeken plus lookup/replay van wachtende goedkeuringen af.
    - `exec.approval.waitDecision` wacht op één wachtende exec-goedkeuring en retourneert de uiteindelijke beslissing (of `null` bij timeout).
    - `exec.approvals.get` en `exec.approvals.set` beheren snapshots van het Gateway-exec-goedkeuringsbeleid.
    - `exec.approvals.node.get` en `exec.approvals.node.set` beheren Node-lokaal exec-goedkeuringsbeleid via Node-relayopdrachten.
    - `plugin.approval.request`, `plugin.approval.list`, `plugin.approval.waitDecision` en `plugin.approval.resolve` dekken door plugins gedefinieerde goedkeuringsflows af.

  </Accordion>

  <Accordion title="Automatisering, Skills en tools">
    - Automatisering: `wake` plant een onmiddellijke of volgende-Heartbeat wake-tekstinjectie; `cron.list`, `cron.status`, `cron.add`, `cron.update`, `cron.remove`, `cron.run`, `cron.runs` beheren gepland werk.
    - Skills en tools: `commands.list`, `skills.*`, `tools.catalog`, `tools.effective`.

  </Accordion>
</AccordionGroup>

### Algemene gebeurtenisfamilies

- `chat`: UI-chatupdates zoals `chat.inject` en andere uitsluitend-transcript-chatgebeurtenissen.
- `session.message` en `session.tool`: transcript-/eventstream-updates voor een geabonneerde sessie.
- `sessions.changed`: sessie-index of metadata gewijzigd.
- `presence`: updates van systeempresence-snapshots.
- `tick`: periodieke keepalive- / liveness-gebeurtenis.
- `health`: update van Gateway-gezondheidssnapshot.
- `heartbeat`: update van Heartbeat-eventstream.
- `cron`: wijzigingsgebeurtenis voor Cron-run/-taak.
- `shutdown`: Gateway-afsluitmelding.
- `node.pair.requested` / `node.pair.resolved`: levenscyclus van Node-koppeling.
- `node.invoke.request`: broadcast van Node-aanroepverzoek.
- `device.pair.requested` / `device.pair.resolved`: levenscyclus van gekoppeld apparaat.
- `voicewake.changed`: configuratie van wake-word-triggers gewijzigd.
- `exec.approval.requested` / `exec.approval.resolved`: levenscyclus van exec-goedkeuring.
- `plugin.approval.requested` / `plugin.approval.resolved`: levenscyclus van plugin-goedkeuring.

### Node-helpermethoden

- Nodes mogen `skills.bins` aanroepen om de huidige lijst met uitvoerbare skill-bestanden voor auto-allow-controles op te halen.

### Operator-helpermethoden

- Operators kunnen `commands.list` (`operator.read`) aanroepen om de runtime
  opdrachtinventaris voor een agent op te halen.
  - `agentId` is optioneel; laat dit weg om de standaard agentwerkruimte te lezen.
  - `scope` bepaalt op welk oppervlak de primaire `name` is gericht:
    - `text` retourneert het primaire tekstopdrachttoken zonder de voorloop-`/`
    - `native` en het standaardpad `both` retourneren providerbewuste native namen
      wanneer beschikbaar
  - `textAliases` bevat exacte slash-aliassen zoals `/model` en `/m`.
  - `nativeName` bevat de providerbewuste native opdrachtnaam wanneer die bestaat.
  - `provider` is optioneel en heeft alleen invloed op native naamgeving plus beschikbaarheid van native pluginopdrachten.
  - `includeArgs=false` laat geserialiseerde argumentmetadata weg uit het antwoord.
- Operators kunnen `tools.catalog` (`operator.read`) aanroepen om de runtime-toolcatalogus voor een
  agent op te halen. Het antwoord bevat gegroepeerde tools en herkomstmetadata:
  - `source`: `core` of `plugin`
  - `pluginId`: plugineigenaar wanneer `source="plugin"`
  - `optional`: of een plugintool optioneel is
- Operators kunnen `tools.effective` (`operator.read`) aanroepen om de runtime-effectieve toolinventaris
  voor een sessie op te halen.
  - `sessionKey` is verplicht.
  - De gateway leidt vertrouwde runtimecontext server-side af uit de sessie in plaats van door de
    aanroeper aangeleverde auth- of aflevercontext te accepteren.
  - Het antwoord is sessiegebonden en weerspiegelt wat het actieve gesprek nu kan gebruiken,
    inclusief core-, Plugin- en kanaaltools.
- Operators kunnen `skills.status` (`operator.read`) aanroepen om de zichtbare
  Skills-inventaris voor een agent op te halen.
  - `agentId` is optioneel; laat dit weg om de standaard agentwerkruimte te lezen.
  - Het antwoord bevat geschiktheid, ontbrekende vereisten, configuratiecontroles en
    opgeschoonde installatieopties zonder ruwe geheime waarden bloot te leggen.
- Operators kunnen `skills.search` en `skills.detail` (`operator.read`) aanroepen voor
  ClawHub-ontdekkingsmetadata.
- Operators kunnen `skills.install` (`operator.admin`) in twee modi aanroepen:
  - ClawHub-modus: `{ source: "clawhub", slug, version?, force? }` installeert een
    skillmap in de standaardmap `skills/` van de agentwerkruimte.
  - Gateway-installatiemodus: `{ name, installId, dangerouslyForceUnsafeInstall?, timeoutMs? }`
    voert een gedeclareerde actie `metadata.openclaw.install` uit op de Gateway-host.
- Operators kunnen `skills.update` (`operator.admin`) in twee modi aanroepen:
  - ClawHub-modus werkt één gevolgde slug bij of alle gevolgde ClawHub-installaties in
    de standaard agentwerkruimte.
  - Configuratiemodus patcht waarden van `skills.entries.<skillKey>` zoals `enabled`,
    `apiKey` en `env`.

### `models.list`-weergaven

`models.list` accepteert een optionele parameter `view`:

- Weggelaten of `"default"`: huidig runtimegedrag. Als `agents.defaults.models` is geconfigureerd, is het antwoord de toegestane catalogus; anders is het antwoord de volledige Gateway-catalogus.
- `"configured"`: gedrag op formaat van een kiezer. Als `agents.defaults.models` is geconfigureerd, heeft dit nog steeds voorrang. Anders gebruikt het antwoord expliciete vermeldingen in `models.providers.*.models`, met een terugval naar de volledige catalogus alleen wanneer er geen geconfigureerde modelrijen bestaan.
- `"all"`: volledige Gateway-catalogus, waarbij `agents.defaults.models` wordt omzeild. Gebruik dit voor diagnostiek en ontdekkings-UI's, niet voor normale modelkiezers.

## Exec-goedkeuringen

- Wanneer een exec-verzoek goedkeuring nodig heeft, zendt de gateway `exec.approval.requested` uit.
- Operatorclients handelen dit af door `exec.approval.resolve` aan te roepen (vereist scope `operator.approvals`).
- Voor `host=node` moet `exec.approval.request` `systemRunPlan` bevatten (canonieke `argv`/`cwd`/`rawCommand`/sessiemetadata). Verzoeken zonder `systemRunPlan` worden geweigerd.
- Na goedkeuring hergebruiken doorgestuurde `node.invoke system.run`-aanroepen dat canonieke
  `systemRunPlan` als de gezaghebbende opdracht-/cwd-/sessiecontext.
- Als een aanroeper `command`, `rawCommand`, `cwd`, `agentId` of
  `sessionKey` wijzigt tussen voorbereiden en de uiteindelijke goedgekeurde doorsturing naar `system.run`, weigert de
  gateway de uitvoering in plaats van de gewijzigde payload te vertrouwen.

## Fallback voor agentlevering

- `agent`-verzoeken kunnen `deliver=true` bevatten om uitgaande levering aan te vragen.
- `bestEffortDeliver=false` behoudt strikt gedrag: onopgeloste of alleen-interne leveringsdoelen retourneren `INVALID_REQUEST`.
- `bestEffortDeliver=true` staat fallback naar alleen-sessie-uitvoering toe wanneer geen externe leverbare route kan worden opgelost (bijvoorbeeld interne/webchat-sessies of ambigue configuraties met meerdere kanalen).

## Versiebeheer

- `PROTOCOL_VERSION` staat in `src/gateway/protocol/schema/protocol-schemas.ts`.
- Clients sturen `minProtocol` + `maxProtocol`; de server weigert mismatches.
- Schema's + modellen worden gegenereerd uit TypeBox-definities:
  - `pnpm protocol:gen`
  - `pnpm protocol:gen:swift`
  - `pnpm protocol:check`

### Clientconstanten

De referentieclient in `src/gateway/client.ts` gebruikt deze standaardwaarden. Waarden zijn
stabiel binnen protocol v3 en vormen de verwachte basislijn voor clients van derden.

| Constante                                 | Standaard                                             | Bron                                                                                       |
| ----------------------------------------- | ----------------------------------------------------- | ------------------------------------------------------------------------------------------ |
| `PROTOCOL_VERSION`                        | `3`                                                   | `src/gateway/protocol/schema/protocol-schemas.ts`                                          |
| Verzoektime-out (per RPC)                 | `30_000` ms                                           | `src/gateway/client.ts` (`requestTimeoutMs`)                                               |
| Preauth-/connect-challenge-time-out       | `15_000` ms                                           | `src/gateway/handshake-timeouts.ts` (config/env kan het gekoppelde server-/clientbudget verhogen) |
| Initiële reconnect-backoff                | `1_000` ms                                            | `src/gateway/client.ts` (`backoffMs`)                                                      |
| Maximale reconnect-backoff                | `30_000` ms                                           | `src/gateway/client.ts` (`scheduleReconnect`)                                              |
| Fast-retry-klem na sluiten door device-token | `250` ms                                           | `src/gateway/client.ts`                                                                    |
| Graceperiode voor force-stop vóór `terminate()` | `250` ms                                        | `FORCE_STOP_TERMINATE_GRACE_MS`                                                            |
| Standaardtime-out van `stopAndWait()`     | `1_000` ms                                            | `STOP_AND_WAIT_TIMEOUT_MS`                                                                 |
| Standaard tickinterval (vóór `hello-ok`)  | `30_000` ms                                           | `src/gateway/client.ts`                                                                    |
| Sluiten bij tick-time-out                 | code `4000` wanneer stilte langer duurt dan `tickIntervalMs * 2` | `src/gateway/client.ts`                                                                    |
| `MAX_PAYLOAD_BYTES`                       | `25 * 1024 * 1024` (25 MB)                            | `src/gateway/server-constants.ts`                                                          |

De server adverteert de effectieve `policy.tickIntervalMs`, `policy.maxPayload`
en `policy.maxBufferedBytes` in `hello-ok`; clients moeten die waarden respecteren
in plaats van de standaardwaarden van vóór de handshake.

## Auth

- Gateway-auth met gedeeld geheim gebruikt `connect.params.auth.token` of
  `connect.params.auth.password`, afhankelijk van de geconfigureerde auth-modus.
- Modussen met identiteit, zoals Tailscale Serve
  (`gateway.auth.allowTailscale: true`) of niet-loopback
  `gateway.auth.mode: "trusted-proxy"`, voldoen aan de connect-auth-controle via
  verzoekheaders in plaats van `connect.params.auth.*`.
- Private-ingress `gateway.auth.mode: "none"` slaat gedeelde-geheim-connect-auth
  volledig over; stel die modus niet bloot op publieke/onvertrouwde ingress.
- Na koppeling geeft de Gateway een **device token** uit, begrensd tot de verbindingsrol
  + scopes. Het wordt geretourneerd in `hello-ok.auth.deviceToken` en moet door
  de client worden bewaard voor toekomstige verbindingen.
- Clients moeten de primaire `hello-ok.auth.deviceToken` bewaren na elke
  succesvolle verbinding.
- Opnieuw verbinden met dat **opgeslagen** device token moet ook de opgeslagen
  goedgekeurde scopeset voor dat token hergebruiken. Dit behoudt lees-/probe-/statustoegang
  die al was toegekend en voorkomt dat reconnects stilzwijgend worden teruggebracht tot een
  smallere impliciete alleen-admin-scope.
- Client-side samenstelling van connect-auth (`selectConnectAuth` in
  `src/gateway/client.ts`):
  - `auth.password` staat los hiervan en wordt altijd doorgestuurd wanneer ingesteld.
  - `auth.token` wordt in prioriteitsvolgorde gevuld: eerst expliciet gedeeld token,
    daarna een expliciete `deviceToken`, daarna een opgeslagen token per apparaat (gebaseerd op
    `deviceId` + `role`).
  - `auth.bootstrapToken` wordt alleen verzonden wanneer geen van bovenstaande een
    `auth.token` opleverde. Een gedeeld token of een opgelost device token onderdrukt dit.
  - Automatische promotie van een opgeslagen device token bij de eenmalige
    `AUTH_TOKEN_MISMATCH`-retry is beperkt tot **vertrouwde endpoints** —
    loopback, of `wss://` met een vastgepinde `tlsFingerprint`. Publieke `wss://`
    zonder pinning komt niet in aanmerking.
- Extra vermeldingen in `hello-ok.auth.deviceTokens` zijn bootstrap-overdrachtstokens.
  Bewaar ze alleen wanneer de verbinding bootstrap-auth gebruikte op een vertrouwd transport
  zoals `wss://` of loopback/lokale koppeling.
- Als een client een **expliciete** `deviceToken` of expliciete `scopes` aanlevert, blijft die
  door de aanroeper gevraagde scopeset gezaghebbend; gecachte scopes worden alleen
  hergebruikt wanneer de client het opgeslagen token per apparaat hergebruikt.
- Device tokens kunnen worden geroteerd/ingetrokken via `device.token.rotate` en
  `device.token.revoke` (vereist scope `operator.pairing`).
- `device.token.rotate` retourneert rotatiemetadata. Het echoot het vervangende
  bearer token alleen voor aanroepen vanaf hetzelfde apparaat die al zijn geauthenticeerd met
  dat device token, zodat token-only clients hun vervanging kunnen bewaren vóór
  het opnieuw verbinden. Gedeelde/admin-rotaties echoën het bearer token niet.
- Tokenuitgifte, rotatie en intrekking blijven begrensd tot de goedgekeurde rollenset
  die is vastgelegd in de pairingvermelding van dat apparaat; tokenmutatie kan geen apparaatrol uitbreiden of
  targeten die nooit door pairinggoedkeuring is toegekend.
- Voor paired-device-tokensessies is apparaatbeheer zelfgebonden tenzij de
  aanroeper ook `operator.admin` heeft: niet-admin-aanroepers kunnen alleen hun **eigen**
  apparaatvermelding verwijderen/intrekken/roteren.
- `device.token.rotate` en `device.token.revoke` controleren ook de scopeset van het doel-operator
  token tegen de huidige sessiescopes van de aanroeper. Niet-admin-aanroepers
  kunnen geen breder operator-token roteren of intrekken dan ze al hebben.
- Auth-fouten bevatten `error.details.code` plus herstelhints:
  - `error.details.canRetryWithDeviceToken` (boolean)
  - `error.details.recommendedNextStep` (`retry_with_device_token`, `update_auth_configuration`, `update_auth_credentials`, `wait_then_retry`, `review_auth_configuration`)
- Clientgedrag voor `AUTH_TOKEN_MISMATCH`:
  - Vertrouwde clients mogen één begrensde retry proberen met een gecachet token per apparaat.
  - Als die retry mislukt, moeten clients automatische reconnect-loops stoppen en begeleiding voor operatoractie tonen.

## Apparaatidentiteit + pairing

- Nodes moeten een stabiele apparaatidentiteit (`device.id`) bevatten die is afgeleid van een
  fingerprint van een sleutelpaar.
- Gateways geven tokens uit per apparaat + rol.
- Koppelingsgoedkeuringen zijn vereist voor nieuwe apparaat-ID's, tenzij lokale automatische goedkeuring
  is ingeschakeld.
- Automatische goedkeuring van koppeling draait om directe local loopback-verbindingen.
- OpenClaw heeft ook een smal backend/container-lokaal self-connect-pad voor
  vertrouwde helperflows met gedeeld geheim.
- Verbindingen via dezelfde-host-tailnet of LAN worden voor koppeling nog steeds als extern behandeld en
  vereisen goedkeuring.
- WS-clients nemen normaal gesproken `device`-identiteit op tijdens `connect` (operator +
  node). De enige operatoruitzonderingen zonder apparaat zijn expliciete vertrouwenspaden:
  - `gateway.controlUi.allowInsecureAuth=true` voor localhost-only compatibiliteit met onveilige HTTP.
  - geslaagde `gateway.auth.mode: "trusted-proxy"` operator-Control UI-authenticatie.
  - `gateway.controlUi.dangerouslyDisableDeviceAuth=true` (noodmaatregel, ernstige beveiligingsverlaging).
  - direct-loopback `gateway-client` backend-RPC's die zijn geauthenticeerd met het gedeelde
    gateway-token/wachtwoord.
- Alle verbindingen moeten de door de server verstrekte `connect.challenge` nonce ondertekenen.

### Diagnostiek voor apparaatauthenticatiemigratie

Voor legacy-clients die nog pre-challenge-ondertekeningsgedrag gebruiken, retourneert `connect` nu
`DEVICE_AUTH_*`-detailcodes onder `error.details.code` met een stabiele `error.details.reason`.

Veelvoorkomende migratiefouten:

| Bericht                     | details.code                     | details.reason           | Betekenis                                          |
| --------------------------- | -------------------------------- | ------------------------ | -------------------------------------------------- |
| `device nonce required`     | `DEVICE_AUTH_NONCE_REQUIRED`     | `device-nonce-missing`   | Client liet `device.nonce` weg (of stuurde leeg).  |
| `device nonce mismatch`     | `DEVICE_AUTH_NONCE_MISMATCH`     | `device-nonce-mismatch`  | Client ondertekende met een verouderde/verkeerde nonce. |
| `device signature invalid`  | `DEVICE_AUTH_SIGNATURE_INVALID`  | `device-signature`       | Ondertekeningspayload komt niet overeen met v2-payload. |
| `device signature expired`  | `DEVICE_AUTH_SIGNATURE_EXPIRED`  | `device-signature-stale` | Ondertekende timestamp valt buiten de toegestane afwijking. |
| `device identity mismatch`  | `DEVICE_AUTH_DEVICE_ID_MISMATCH` | `device-id-mismatch`     | `device.id` komt niet overeen met de publieke-sleutel-fingerprint. |
| `device public key invalid` | `DEVICE_AUTH_PUBLIC_KEY_INVALID` | `device-public-key`      | Publieke-sleutelformaat/canonicalisatie is mislukt. |

Migratiedoel:

- Wacht altijd op `connect.challenge`.
- Onderteken de v2-payload die de server-nonce bevat.
- Verstuur dezelfde nonce in `connect.params.device.nonce`.
- De voorkeurs-ondertekeningspayload is `v3`, die `platform` en `deviceFamily`
  bindt naast de velden voor device/client/role/scopes/token/nonce.
- Legacy `v2`-ondertekeningen blijven geaccepteerd voor compatibiliteit, maar pinning van gekoppelde-apparaatmetadata
  blijft het opdrachtbeleid bij opnieuw verbinden bepalen.

## TLS + pinning

- TLS wordt ondersteund voor WS-verbindingen.
- Clients kunnen optioneel de fingerprint van het gateway-certificaat pinnen (zie `gateway.tls`
  configuratie plus `gateway.remote.tlsFingerprint` of CLI `--tls-fingerprint`).

## Bereik

Dit protocol stelt de **volledige gateway-API** beschikbaar (status, kanalen, modellen, chat,
agent, sessies, nodes, goedkeuringen, enz.). Het exacte oppervlak wordt gedefinieerd door de
TypeBox-schema's in `src/gateway/protocol/schema.ts`.

## Gerelateerd

- [Bridge-protocol](/nl/gateway/bridge-protocol)
- [Gateway-runbook](/nl/gateway)
