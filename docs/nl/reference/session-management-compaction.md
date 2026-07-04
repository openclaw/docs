---
read_when:
    - Je moet sessie-ID's, transcript-JSONL of velden in sessions.json debuggen
    - Je wijzigt het gedrag voor auto-Compaction of voegt opschoontaken voor "pre-Compaction" toe
    - Je wilt geheugenflushes of stille systeembeurten implementeren
summary: 'Diepgaande uitleg: sessieopslag + transcripten, levenscyclus en interne werking van (auto)Compaction'
title: Diepgaande uitleg over sessiebeheer
x-i18n:
    generated_at: "2026-07-04T20:38:33Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: c97994f674e14ec01b2eaadc10a61e524f5071f95b2ef84957d71abacbdc719b
    source_path: reference/session-management-compaction.md
    workflow: 16
---

OpenClaw beheert sessies end-to-end over deze gebieden:

- **Sessieroutering** (hoe inkomende berichten aan een `sessionKey` worden gekoppeld)
- **Sessiestore** (`sessions.json`) en wat deze bijhoudt
- **Transcriptpersistentie** (`*.jsonl`) en de structuur ervan
- **Transcripthygiëne** (providerspecifieke correcties vóór runs)
- **Contextlimieten** (contextvenster versus bijgehouden tokens)
- **Compaction** (handmatige en automatische Compaction) en waar je werk vóór Compaction kunt inhaken
- **Stille huishouding** (geheugenschrijfacties die geen voor de gebruiker zichtbare uitvoer mogen produceren)

Als je eerst een overzicht op hoger niveau wilt, begin dan met:

- [Sessiebeheer](/nl/concepts/session)
- [Compaction](/nl/concepts/compaction)
- [Geheugenoverzicht](/nl/concepts/memory)
- [Geheugen zoeken](/nl/concepts/memory-search)
- [Sessies opschonen](/nl/concepts/session-pruning)
- [Transcripthygiëne](/nl/reference/transcript-hygiene)

---

## Bron van waarheid: de Gateway

OpenClaw is ontworpen rond één **Gateway-proces** dat eigenaar is van de sessiestatus.

- UI's (macOS-app, web-Control UI, TUI) moeten de Gateway bevragen voor sessielijsten en tokentellingen.
- In externe modus staan sessiebestanden op de externe host; "je lokale Mac-bestanden controleren" weerspiegelt niet wat de Gateway gebruikt.

---

## Twee persistentielagen

OpenClaw bewaart sessies in twee lagen:

1. **Sessiestore (`sessions.json`)**
   - Sleutel/waarde-map: `sessionKey -> SessionEntry`
   - Klein, muteerbaar, veilig om te bewerken (of vermeldingen te verwijderen)
   - Houdt sessiemetadata bij (huidige sessie-id, laatste activiteit, schakelaars, tokentellers, enz.)

2. **Transcript (`<sessionId>.jsonl`)**
   - Alleen-toevoegen-transcript met boomstructuur (items hebben `id` + `parentId`)
   - Slaat het daadwerkelijke gesprek + toolaanroepen + Compaction-samenvattingen op
   - Wordt gebruikt om de modelcontext voor toekomstige beurten opnieuw op te bouwen
   - Compaction-controlepunten zijn metadata over het gecompacteerde opvolgerstranscript. Nieuwe Compactions schrijven geen tweede `.checkpoint.*.jsonl`-kopie.

Gateway-geschiedenislezers moeten voorkomen dat ze het hele transcript materialiseren, tenzij het oppervlak expliciet willekeurige historische toegang nodig heeft. Geschiedenis van de eerste pagina, ingebedde chatgeschiedenis, herstel na herstart en token-/gebruikscontroles gebruiken begrensde tail-reads. Volledige transcriptscans lopen via de asynchrone transcriptindex, die wordt gecachet op bestandspad plus `mtimeMs`/`size` en wordt gedeeld tussen gelijktijdige lezers.

---

## Locaties op schijf

Per agent, op de Gateway-host:

- Store: `~/.openclaw/agents/<agentId>/sessions/sessions.json`
- Transcripten: `~/.openclaw/agents/<agentId>/sessions/<sessionId>.jsonl`
  - Telegram-onderwerpsessies: `.../<sessionId>-topic-<threadId>.jsonl`

OpenClaw lost deze op via `src/config/sessions.ts`.

---

## Store-onderhoud en schijfcontroles

Sessiepersistentie heeft automatische onderhoudscontroles (`session.maintenance`) voor `sessions.json`, transcriptartefacten en trajectorie-sidecars:

- `mode`: `enforce` (standaard) of `warn`
- `pruneAfter`: leeftijdsgrens voor verlopen vermeldingen (standaard `30d`)
- `maxEntries`: maximumaantal vermeldingen in `sessions.json` (standaard `500`)
- Retentie voor kortlevende gateway-modelrun-probes staat vast op `24h`, maar is drukgestuurd: oude strikte probe-rijen worden alleen verwijderd wanneer onderhouds-/maximumdruk voor sessievermeldingen wordt bereikt. Dit geldt alleen voor strikte expliciete probe-sleutels die overeenkomen met `agent:*:explicit:model-run-<uuid>` en draait vóór globale opschoning/maximering van oude vermeldingen wanneer het draait.
- `resetArchiveRetention`: retentie voor `*.reset.<timestamp>`-transcriptarchieven (standaard: hetzelfde als `pruneAfter`; `false` schakelt opschoning uit)
- `maxDiskBytes`: optioneel budget voor de sessiemap
- `highWaterBytes`: optioneel doel na opschoning (standaard `80%` van `maxDiskBytes`)

Normale Gateway-schrijfacties lopen via een sessieschrijver per store die mutaties binnen het proces serialiseert zonder een runtime-bestandslock te nemen. Hot-path patchhelpers lenen de gevalideerde muteerbare cache zolang ze die schrijversleuf vasthouden, zodat grote `sessions.json`-bestanden niet voor elke metadata-update worden gekloond of opnieuw gelezen. Runtimecode moet de voorkeur geven aan `updateSessionStore(...)` of `updateSessionStoreEntry(...)`; directe whole-store saves zijn compatibiliteits- en offline-onderhoudstools. Wanneer een Gateway bereikbaar is, delegeren niet-dry-run `openclaw sessions cleanup` en `openclaw agents delete` store-mutaties aan de Gateway, zodat opschoning in dezelfde schrijverswachtrij terechtkomt; `--store <path>` is het expliciete offline reparatiepad voor direct bestandsonderhoud. `maxEntries`-opschoning wordt nog steeds in batches uitgevoerd voor productieomvang-limieten, waardoor een store kort boven de geconfigureerde limiet kan uitkomen voordat de volgende high-water-opschoning deze weer terugschrijft. Reads van de sessiestore schonen geen vermeldingen op en passen geen maximum toe tijdens het opstarten van de Gateway; gebruik schrijfacties of `openclaw sessions cleanup --enforce` voor opschoning. `openclaw sessions cleanup --enforce` past de geconfigureerde limiet nog steeds onmiddellijk toe en verwijdert oude niet-gerefereerde transcript-, checkpoint- en trajectorieartefacten, zelfs wanneer er geen schijfbudget is geconfigureerd.

Onderhoud behoudt duurzame externe gespreksverwijzingen zoals groepssessies en thread-scoped chatsessies, maar synthetische runtime-vermeldingen voor Cron, hooks, Heartbeat, ACP en subagents kunnen nog steeds worden verwijderd wanneer ze de geconfigureerde leeftijd, telling of het schijfbudget overschrijden. Gateway-modelrun-probesessies gebruiken de afzonderlijke `24h`-modelrunretentie alleen wanneer hun sleutel exact overeenkomt met `agent:*:explicit:model-run-<uuid>`; andere expliciete sessies maken geen deel uit van die retentie. De modelrun-opschoning wordt alleen toegepast onder limietdruk voor sessievermeldingen. Geïsoleerde Cron-runs behouden hun eigen `cron.sessionRetention`-controle, onafhankelijk van modelrun-proberetentie.

OpenClaw maakt niet langer automatische `sessions.json.bak.*`-rotatieback-ups tijdens Gateway-schrijfacties. De legacy-sleutel `session.maintenance.rotateBytes` wordt genegeerd en `openclaw doctor --fix` verwijdert deze uit oudere configuraties.

Transcriptmutaties gebruiken een sessieschrijflock op het transcriptbestand. Lockverwerving wacht maximaal `session.writeLock.acquireTimeoutMs` voordat een fout voor een bezette sessie wordt getoond; de standaard is `60000` ms. Verhoog dit alleen wanneer legitieme voorbereiding, opschoning, Compaction of transcriptspiegelwerk langer concurreert op trage machines. `session.writeLock.staleMs` bepaalt wanneer een bestaande lock als verlopen kan worden teruggevorderd; de standaard is `1800000` ms. `session.writeLock.maxHoldMs` bepaalt de in-proces watchdog-vrijgavedrempel; de standaard is `300000` ms. Nood-env-overrides zijn `OPENCLAW_SESSION_WRITE_LOCK_ACQUIRE_TIMEOUT_MS`, `OPENCLAW_SESSION_WRITE_LOCK_STALE_MS` en `OPENCLAW_SESSION_WRITE_LOCK_MAX_HOLD_MS`.

Handhavingsvolgorde voor opschoning van schijfbudget (`mode: "enforce"`):

1. Verwijder eerst de oudste gearchiveerde, wees-transcript- of wees-trajectorieartefacten.
2. Als het gebruik nog steeds boven het doel ligt, verwijder dan de oudste sessievermeldingen en hun transcript-/trajectoriebestanden.
3. Ga door totdat het gebruik op of onder `highWaterBytes` ligt.

In `mode: "warn"` rapporteert OpenClaw mogelijke verwijderingen, maar muteert de store/bestanden niet.

Voer onderhoud op aanvraag uit:

```bash
openclaw sessions cleanup --dry-run
openclaw sessions cleanup --enforce
```

---

## Cron-sessies en runlogs

Geïsoleerde Cron-runs maken ook sessievermeldingen/transcripten aan en hebben speciale retentiecontroles:

- `cron.sessionRetention` (standaard `24h`) verwijdert oude geïsoleerde Cron-run-sessies uit de sessiestore (`false` schakelt uit).
- `cron.runLog.keepLines` verwijdert bewaarde SQLite-runhistorierijen per Cron-taak (standaard: `2000`). `cron.runLog.maxBytes` blijft geaccepteerd voor oudere bestandsgebaseerde runlogs.

Wanneer Cron geforceerd een nieuwe geïsoleerde runsessie aanmaakt, saneert het de vorige `cron:<jobId>`-sessievermelding voordat de nieuwe rij wordt geschreven. Het neemt veilige voorkeuren mee, zoals denk-/snel-/uitgebreid-instellingen, labels en expliciete door de gebruiker geselecteerde model-/auth-overrides. Het verwijdert omgevingsgesprekscontext zoals kanaal-/groepsroutering, verzend- of wachtrijbeleid, elevation, oorsprong en ACP-runtimebinding, zodat een nieuwe geïsoleerde run geen verouderde afleverings- of runtimebevoegdheid van een oudere run kan erven.

---

## Sessiesleutels (`sessionKey`)

Een `sessionKey` identificeert _in welke gespreksbucket_ je zit (routering + isolatie).

Veelvoorkomende patronen:

- Hoofd-/directe chat (per agent): `agent:<agentId>:<mainKey>` (standaard `main`)
- Groep: `agent:<agentId>:<channel>:group:<id>`
- Ruimte/kanaal (Discord/Slack): `agent:<agentId>:<channel>:channel:<id>` of `...:room:<id>`
- Cron: `cron:<job.id>`
- Webhook: `hook:<uuid>` (tenzij overschreven)

De canonieke regels zijn gedocumenteerd op [/concepts/session](/nl/concepts/session).

---

## Sessie-id's (`sessionId`)

Elke `sessionKey` wijst naar een huidige `sessionId` (het transcriptbestand dat het gesprek voortzet).

Vuistregels:

- **Reset** (`/new`, `/reset`) maakt een nieuwe `sessionId` aan voor die `sessionKey`.
- **Dagelijkse reset** (standaard 4:00 AM lokale tijd op de gateway-host) maakt een nieuwe `sessionId` aan bij het volgende bericht na de resetgrens.
- **Inactiviteitsverloop** (`session.reset.idleMinutes` of legacy `session.idleMinutes`) maakt een nieuwe `sessionId` aan wanneer een bericht binnenkomt na het inactiviteitsvenster. Wanneer dagelijks + inactiviteit beide zijn geconfigureerd, wint wat het eerst verloopt.
- **Control UI reconnect resume** kan de momenteel zichtbare sessie behouden voor één reconnect-verzending wanneer de Gateway de overeenkomende `sessionId` ontvangt van een operator-UI-client. Gewone verouderde verzendingen maken nog steeds een nieuwe `sessionId` aan.
- **Systeemgebeurtenissen** (Heartbeat, Cron-wakeups, exec-meldingen, Gateway-boekhouding) kunnen de sessierij muteren, maar verlengen de versheid voor dagelijkse/inactiviteitsreset niet. Reset-rollover verwijdert in de wachtrij staande systeemgebeurtenismeldingen voor de vorige sessie voordat de verse prompt wordt opgebouwd.
- **Parent-forkbeleid** gebruikt de actieve branch van OpenClaw bij het aanmaken van een thread- of subagent-fork. Als die branch te groot is, start OpenClaw het kind met geïsoleerde context in plaats van te falen of onbruikbare geschiedenis te erven. Het sizingbeleid is automatisch; legacy-configuratie `session.parentForkMaxTokens` wordt verwijderd door `openclaw doctor --fix`.

Implementatiedetail: de beslissing vindt plaats in `initSessionState()` in `src/auto-reply/reply/session.ts`.

---

## Sessiestore-schema (`sessions.json`)

Het waardetype van de store is `SessionEntry` in `src/config/sessions.ts`.

Belangrijke velden (niet uitputtend):

- `sessionId`: huidige transcript-id (bestandsnaam wordt hiervan afgeleid, tenzij `sessionFile` is ingesteld)
- `sessionStartedAt`: starttijdstempel voor de huidige `sessionId`; dagelijkse reset
  gebruikt dit voor versheid. Legacy-rijen kunnen dit afleiden uit de JSONL-sessieheader.
- `lastInteractionAt`: tijdstempel van de laatste echte gebruikers-/kanaalinteractie; inactieve reset
  gebruikt dit voor versheid, zodat Heartbeat-, Cron- en exec-gebeurtenissen sessies niet
  actief houden. Legacy-rijen zonder dit veld vallen voor inactieve versheid terug op de
  herstelde starttijd van de sessie.
- `updatedAt`: tijdstempel van de laatste store-rijmutatie, gebruikt voor lijsten, opschonen en
  boekhouding. Dit is niet de autoriteit voor versheid bij dagelijkse/inactieve resets.
- `archivedAt`: optioneel archieftijdstempel. Gearchiveerde sessies blijven in de store
  met hun transcript intact en worden uitgesloten van normale actieve lijsten.
- `pinnedAt`: optioneel vastzettijdstempel. Actieve vastgezette sessies worden vóór
  niet-vastgezette sessies gesorteerd; het archiveren van een sessie wist de vastzetting.
- Codex-threadinteroperabiliteit: beide velden volgen de Codex-vorm voor threadbeheer —
  de booleans `archived`/`pinned` op de wire worden altijd afgeleid van het
  tijdstempel en server-side gestempeld, overeenkomstig de semantiek van Codex
  `threads.archived_at` en camelCase-serialisatie. OpenClaw-tijdstempels zijn epoch
  milliseconden, terwijl Codex epoch-seconden gebruikt, dus bridges converteren bij de
  codex Plugin-naad. Codex heeft nog geen pin-API (`thread/archive`/`thread/unarchive`
  alleen); vastgezette status blijft aan de OpenClaw-kant totdat die bestaat, waarna de
  overeenkomende vorm gebonden sessies de vastgezette status mechanisch laat round-trippen.
- `sessionFile`: optionele expliciete override voor transcriptpad
- `chatType`: `direct | group | room` (helpt UI's en verzendbeleid)
- `provider`, `subject`, `room`, `space`, `displayName`: metadata voor groeps-/kanaallabeling
- Schakelaars:
  - `thinkingLevel`, `verboseLevel`, `reasoningLevel`, `elevatedLevel`
  - `sendPolicy` (override per sessie)
- Modelselectie:
  - `providerOverride`, `modelOverride`, `authProfileOverride`
- Tokentellers (best-effort / providerafhankelijk):
  - `inputTokens`, `outputTokens`, `totalTokens`, `contextTokens`
- `compactionCount`: hoe vaak auto-Compaction is voltooid voor deze sessiesleutel
- `memoryFlushAt`: tijdstempel voor de laatste geheugenflush vóór Compaction
- `memoryFlushCompactionCount`: Compaction-aantal toen de laatste flush draaide

De store kan veilig worden bewerkt, maar de Gateway is de autoriteit: deze kan vermeldingen herschrijven of rehydrateren terwijl sessies draaien.

---

## Transcriptstructuur (`*.jsonl`)

Transcripten worden beheerd door `SessionManager` van `openclaw/plugin-sdk/agent-sessions`.

Het bestand is JSONL:

- Eerste regel: sessieheader (`type: "session"`, bevat `id`, `cwd`, `timestamp`, optioneel `parentSession`)
- Daarna: sessievermeldingen met `id` + `parentId` (boom)

Opmerkelijke vermeldingstypen:

- `message`: gebruikers-/assistent-/toolResult-berichten
- `custom_message`: door extensies geïnjecteerde berichten die _wel_ in de modelcontext terechtkomen (kunnen voor de UI verborgen zijn)
- `custom`: extensiestatus die _niet_ in de modelcontext terechtkomt
- `compaction`: gepersistente Compaction-samenvatting met `firstKeptEntryId` en `tokensBefore`
- `branch_summary`: gepersistente samenvatting bij navigeren door een boomtak

OpenClaw "herstelt" transcripten bewust **niet**; de Gateway gebruikt `SessionManager` om ze te lezen/schrijven.

---

## Contextvensters versus bijgehouden tokens

Twee verschillende concepten zijn belangrijk:

1. **Modelcontextvenster**: harde limiet per model (tokens zichtbaar voor het model)
2. **Sessiestore-tellers**: doorlopende statistieken die naar `sessions.json` worden geschreven (gebruikt voor /status en dashboards)

Als je limieten afstemt:

- Het contextvenster komt uit de modelcatalogus (en kan via configuratie worden overschreven).
- `contextTokens` in de store is een runtime-schatting/rapportagewaarde; behandel het niet als een strikte garantie.

Zie voor meer informatie [/token-use](/nl/reference/token-use).

---

## Compaction: wat het is

Compaction vat oudere conversatie samen in een gepersistente `compaction`-vermelding in het transcript en houdt recente berichten intact.

Na Compaction zien toekomstige beurten:

- De Compaction-samenvatting
- Berichten na `firstKeptEntryId`

Herinjectie van AGENTS.md-secties na Compaction is opt-in via
`agents.defaults.compaction.postCompactionSections`; wanneer niet ingesteld of `[]`,
voegt OpenClaw geen AGENTS.md-fragmenten toe boven op de Compaction-samenvatting.

Compaction is **persistent** (in tegenstelling tot sessieopschoning). Zie [/concepts/session-pruning](/nl/concepts/session-pruning).

## Compaction-chunkgrenzen en toolkoppeling

Wanneer OpenClaw een lang transcript in Compaction-chunks splitst, houdt het
assistent-toolaanroepen gekoppeld aan hun bijbehorende `toolResult`-vermeldingen.

- Als de splitsing op basis van tokendeel tussen een toolaanroep en het resultaat valt, verschuift OpenClaw
  de grens naar het assistent-toolaanroepbericht in plaats van het paar te scheiden.
- Als een afsluitend tool-resultaatblok de chunk anders boven het doel zou brengen,
  bewaart OpenClaw dat wachtende toolblok en houdt de niet-samengevatte staart
  intact.
- Afgebroken/foutieve toolaanroepblokken houden geen wachtende splitsing open.

---

## Wanneer auto-Compaction plaatsvindt (OpenClaw-runtime)

In de ingebedde OpenClaw-agent wordt auto-Compaction in twee gevallen geactiveerd:

1. **Overloopherstel**: het model retourneert een contextoverloopfout
   (`request_too_large`, `context length exceeded`, `input exceeds the maximum
number of tokens`, `input token count exceeds the maximum number of input
tokens`, `input is too long for the model`, `ollama error: context length
exceeded`, en vergelijkbare providervormige varianten) → compact → opnieuw proberen.
   Wanneer de provider het geprobeerde tokenaantal rapporteert, geeft OpenClaw dat
   waargenomen aantal door aan Compaction voor overloopherstel. Als de provider
   overloop bevestigt maar geen parsebaar aantal blootstelt, geeft OpenClaw een minimaal
   budgetoverschrijdend synthetisch aantal door aan Compaction-engines en diagnostiek.
   Als overloopherstel nog steeds faalt, toont OpenClaw expliciete begeleiding aan de
   gebruiker en behoudt de huidige sessiemapping in plaats van stilzwijgend de
   sessiesleutel naar een nieuwe sessie-id te roteren. De volgende stap wordt door de operator bepaald:
   probeer het bericht opnieuw, voer `/compact` uit, of voer `/new` uit wanneer een nieuwe sessie
   de voorkeur heeft.
2. **Drempelonderhoud**: na een succesvolle beurt, wanneer:

`contextTokens > contextWindow - reserveTokens`

Waarbij:

- `contextWindow` het contextvenster van het model is
- `reserveTokens` headroom is die is gereserveerd voor prompts + de volgende modeluitvoer

Dit zijn OpenClaw-runtime-semantieken.

OpenClaw kan ook een preflight lokale Compaction activeren voordat de volgende
run wordt geopend wanneer `agents.defaults.compaction.maxActiveTranscriptBytes` is ingesteld en het
actieve transcriptbestand die grootte bereikt. Dit is een bestandsgroottebescherming voor lokale
heropenkosten, geen ruwe archivering: OpenClaw voert nog steeds normale semantische Compaction uit,
en vereist `truncateAfterCompaction` zodat de gecompacteerde samenvatting een
nieuw opvolgerstranscript kan worden.

Voor ingebedde OpenClaw-runs voegt `agents.defaults.compaction.midTurnPrecheck.enabled: true`
een opt-in tool-loopbescherming toe. Nadat een toolresultaat is toegevoegd en vóór de
volgende modelaanroep schat OpenClaw de promptdruk met dezelfde preflight
budgetlogica die bij de start van een beurt wordt gebruikt. Als de context niet langer past, compacteert de bescherming
niet binnen de `transformContext`-hook van de OpenClaw-runtime. Ze geeft een gestructureerd
mid-turn-prechecksignaal, stopt de huidige promptinzending en laat de
buitenste run-loop het bestaande herstelpad gebruiken: te grote toolresultaten afkappen
wanneer dat genoeg is, of de geconfigureerde Compaction-modus activeren en opnieuw proberen. De
optie is standaard uitgeschakeld en werkt met zowel `default`- als `safeguard`-
Compaction-modi, inclusief provider-ondersteunde safeguard-Compaction.
Dit staat los van `maxActiveTranscriptBytes`: de bytegroottebescherming draait
voordat een beurt opent, terwijl mid-turn precheck later in de ingebedde OpenClaw-tool
loop draait nadat nieuwe toolresultaten zijn toegevoegd.

---

## Compaction-instellingen (`reserveTokens`, `keepRecentTokens`)

De Compaction-instellingen van de OpenClaw-runtime staan in agentinstellingen:

```json5
{
  compaction: {
    enabled: true,
    reserveTokens: 16384,
    keepRecentTokens: 20000,
  },
}
```

OpenClaw dwingt ook een veiligheidsvloer af voor ingebedde runs:

- Als `compaction.reserveTokens < reserveTokensFloor`, verhoogt OpenClaw dit.
- Standaardvloer is `20000` tokens.
- Stel `agents.defaults.compaction.reserveTokensFloor: 0` in om de vloer uit te schakelen.
- Als deze al hoger is, laat OpenClaw hem ongemoeid.
- Handmatige `/compact` respecteert een expliciete `agents.defaults.compaction.keepRecentTokens`
  en behoudt het afkappunt voor de recente staart van de OpenClaw-runtime. Zonder expliciet behoudbudget
  blijft handmatige Compaction een hard checkpoint en begint herbouwde context vanaf
  de nieuwe samenvatting.
- Stel `agents.defaults.compaction.midTurnPrecheck.enabled: true` in om de
  optionele tool-loop-precheck uit te voeren na nieuwe toolresultaten en vóór de volgende model-
  aanroep. Dit is alleen een trigger; samenvattingsgeneratie gebruikt nog steeds het geconfigureerde
  Compaction-pad. Het staat los van `maxActiveTranscriptBytes`, wat een
  bytegroottebescherming voor het actieve transcript bij beurtstart is.
- Stel `agents.defaults.compaction.maxActiveTranscriptBytes` in op een bytewaarde of
  string zoals `"20mb"` om lokale Compaction uit te voeren vóór een beurt wanneer het actieve
  transcript groot wordt. Deze bescherming is alleen actief wanneer
  `truncateAfterCompaction` ook is ingeschakeld. Laat dit niet ingesteld of stel `0` in om
  uit te schakelen.
- Wanneer `agents.defaults.compaction.truncateAfterCompaction` is ingeschakeld,
  roteert OpenClaw het actieve transcript na Compaction naar een gecompacteerde opvolger-JSONL.
  Branch-/restore-checkpointacties gebruiken die gecompacteerde opvolger;
  legacy checkpointbestanden van vóór Compaction blijven leesbaar zolang ernaar wordt verwezen.

Waarom: laat genoeg headroom over voor meerbeurts "huishouding" (zoals geheugenschrijfacties) voordat Compaction onvermijdelijk wordt.

Implementatie: `applyAgentCompactionSettingsFromConfig()` in `src/agents/agent-settings.ts`
(aangeroepen vanuit de beurt- en Compaction-installatiepaden van embedded-runner).

---

## Inplugbare Compaction-providers

Plugins kunnen een Compaction-provider registreren via `registerCompactionProvider()` op de Plugin-API. Wanneer `agents.defaults.compaction.provider` is ingesteld op een geregistreerde provider-id, delegeert de safeguard-extensie samenvatting aan die provider in plaats van aan de ingebouwde `summarizeInStages`-pipeline.

- `provider`: id van een geregistreerde Compaction-provider-Plugin. Laat niet ingesteld voor standaard LLM-samenvatting.
- Het instellen van een `provider` forceert `mode: "safeguard"`.
- Providers ontvangen dezelfde Compaction-instructies en hetzelfde beleid voor identifierbehoud als het ingebouwde pad.
- De safeguard behoudt nog steeds recente-beurt- en gesplitste-beurt-suffixcontext na provideruitvoer.
- Ingebouwde safeguard-samenvatting distilleert eerdere samenvattingen opnieuw met nieuwe berichten
  in plaats van de volledige vorige samenvatting letterlijk te behouden.
- Safeguard-modus schakelt standaard kwaliteitsaudits van samenvattingen in; stel
  `qualityGuard.enabled: false` in om gedrag voor opnieuw proberen bij misvormde uitvoer over te slaan.
- Als de provider faalt of een leeg resultaat retourneert, valt OpenClaw automatisch terug op ingebouwde LLM-samenvatting.
- Abort-/timeoutsignalen worden opnieuw gegooid (niet opgeslokt) om annulering door de aanroeper te respecteren.

Bron: `src/plugins/compaction-provider.ts`, `src/agents/agent-hooks/compaction-safeguard.ts`.

---

## Gebruikerszichtbare oppervlakken

Je kunt Compaction en sessiestatus observeren via:

- `/status` (in elke chatsessie)
- `openclaw status` (CLI)
- `openclaw sessions` / `sessions --json`
- Gateway-logs (`pnpm gateway:watch` of `openclaw logs --follow`): `embedded run auto-compaction start` + `complete`
- Uitgebreide modus: `🧹 Auto-compaction complete` + Compaction-aantal

---

## Stil onderhoud (`NO_REPLY`)

OpenClaw ondersteunt "stille" beurten voor achtergrondtaken waarbij de gebruiker geen tussenuitvoer zou moeten zien.

Conventie:

- De assistant begint zijn uitvoer met het exacte stille token `NO_REPLY` /
  `no_reply` om aan te geven: "lever geen antwoord aan de gebruiker".
- OpenClaw verwijdert/onderdrukt dit in de afleverlaag.
- Exacte onderdrukking van stille tokens is hoofdletterongevoelig, dus `NO_REPLY` en
  `no_reply` tellen allebei wanneer de volledige payload alleen uit het stille token bestaat.
- Dit is alleen bedoeld voor echte achtergrondbeurten zonder aflevering; het is geen snelkoppeling voor
  gewone uitvoerbare gebruikersverzoeken.

Vanaf `2026.1.10` onderdrukt OpenClaw ook **concept-/typestreaming** wanneer een
gedeeltelijk fragment begint met `NO_REPLY`, zodat stille bewerkingen halverwege de beurt geen gedeeltelijke
uitvoer lekken.

---

## Pre-Compaction "geheugenflush" (geïmplementeerd)

Doel: voordat auto-Compaction plaatsvindt, een stille agentische beurt uitvoeren die duurzame
state naar schijf schrijft (bijv. `memory/YYYY-MM-DD.md` in de agentwerkruimte), zodat Compaction geen
kritieke context kan wissen.

OpenClaw gebruikt de aanpak met **flush vóór de drempel**:

1. Bewaak het contextgebruik van de sessie.
2. Wanneer dit een "zachte drempel" overschrijdt (onder de Compaction-drempel van de OpenClaw-runtime), voer dan een stille
   instructie "schrijf geheugen nu" uit naar de agent.
3. Gebruik het exacte stille token `NO_REPLY` / `no_reply`, zodat de gebruiker
   niets ziet.

Config (`agents.defaults.compaction.memoryFlush`):

- `enabled` (standaard: `true`)
- `model` (optionele exacte override voor provider/model voor de flush-beurt, bijvoorbeeld `ollama/qwen3:8b`)
- `softThresholdTokens` (standaard: `4000`)
- `prompt` (gebruikersbericht voor de flush-beurt)
- `systemPrompt` (extra systeemprompt toegevoegd voor de flush-beurt)

Opmerkingen:

- De standaardprompt/systeemprompt bevat een `NO_REPLY`-hint om aflevering te onderdrukken.
- Wanneer `model` is ingesteld, gebruikt de flush-beurt dat model zonder de
  fallbackketen van de actieve sessie te erven, zodat lokaal huishoudelijk werk niet stilzwijgend
  terugvalt op een betaald conversatiemodel.
- De flush wordt eenmaal per Compaction-cyclus uitgevoerd (bijgehouden in `sessions.json`).
- De flush wordt alleen uitgevoerd voor ingesloten OpenClaw-sessies (CLI-backends slaan deze over).
- De flush wordt overgeslagen wanneer de sessiewerkruimte alleen-lezen is (`workspaceAccess: "ro"` of `"none"`).
- Zie [Geheugen](/nl/concepts/memory) voor de bestandsindeling van de werkruimte en schrijfpatronen.

OpenClaw biedt ook een `session_before_compact`-hook in de extensie-API, maar de
flushlogica van OpenClaw bevindt zich momenteel aan de Gateway-kant.

---

## Checklist voor probleemoplossing

- Sessiesleutel verkeerd? Begin met [/concepts/session](/nl/concepts/session) en bevestig de `sessionKey` in `/status`.
- Mismatch tussen store en transcript? Bevestig de Gateway-host en het store-pad via `openclaw status`.
- Compaction-spam? Controleer:
  - contextvenster van het model (te klein)
  - Compaction-instellingen (`reserveTokens` te hoog voor het modelvenster kan eerdere Compaction veroorzaken)
  - opgeblazen toolresultaten: schakel sessieopschoning in/stem deze af
- Lekken stille beurten? Bevestig dat het antwoord begint met `NO_REPLY` (hoofdletterongevoelig exact token) en dat je een build gebruikt die de fix voor streamingonderdrukking bevat.

## Gerelateerd

- [Sessiebeheer](/nl/concepts/session)
- [Sessieopschoning](/nl/concepts/session-pruning)
- [Contextengine](/nl/concepts/context-engine)
