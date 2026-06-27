---
read_when:
    - Je moet sessie-id's, transcript-JSONL of velden in sessions.json debuggen
    - Je wijzigt het gedrag voor automatische Compaction of voegt "pre-Compaction"-opschoning toe
    - U wilt memory-flushes of stille systeembeurten implementeren
summary: 'Diepgaand: sessiestore + transcripten, levenscyclus en interne werking van (auto-)Compaction'
title: Diepgaande uitleg over sessiebeheer
x-i18n:
    generated_at: "2026-06-27T18:19:42Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 7d4b6195c54024a8c0096ec2462ba367dbb6e16a8f6e10f2f912b879848c65af
    source_path: reference/session-management-compaction.md
    workflow: 16
---

OpenClaw beheert sessies end-to-end over deze gebieden:

- **Sessieroutering** (hoe inkomende berichten aan een `sessionKey` worden gekoppeld)
- **Sessiestore** (`sessions.json`) en wat deze bijhoudt
- **Transcriptpersistentie** (`*.jsonl`) en de structuur ervan
- **Transcripthygiëne** (providerspecifieke correcties vóór runs)
- **Contextlimieten** (contextvenster versus bijgehouden tokens)
- **Compaction** (handmatige en automatische compaction) en waar je pre-compaction-werk kunt inhaken
- **Stil onderhoud** (geheugenschrijfacties die geen voor gebruikers zichtbare uitvoer mogen produceren)

Als je eerst een overzicht op hoger niveau wilt, begin dan met:

- [Sessiebeheer](/nl/concepts/session)
- [Compaction](/nl/concepts/compaction)
- [Geheugenoverzicht](/nl/concepts/memory)
- [Geheugenzoekactie](/nl/concepts/memory-search)
- [Sessies opschonen](/nl/concepts/session-pruning)
- [Transcripthygiëne](/nl/reference/transcript-hygiene)

---

## Bron van waarheid: de Gateway

OpenClaw is ontworpen rond één **Gateway-proces** dat sessiestatus beheert.

- UI's (macOS-app, web-Control UI, TUI) moeten de Gateway bevragen voor sessielijsten en tokentellingen.
- In remote-modus staan sessiebestanden op de externe host; "je lokale Mac-bestanden controleren" weerspiegelt niet wat de Gateway gebruikt.

---

## Twee persistentielagen

OpenClaw bewaart sessies in twee lagen:

1. **Sessiestore (`sessions.json`)**
   - Key/value-map: `sessionKey -> SessionEntry`
   - Klein, muteerbaar, veilig te bewerken (of vermeldingen te verwijderen)
   - Houdt sessiemetadata bij (huidige sessie-id, laatste activiteit, schakelaars, tokentellers, enz.)

2. **Transcript (`<sessionId>.jsonl`)**
   - Append-only transcript met boomstructuur (vermeldingen hebben `id` + `parentId`)
   - Slaat het daadwerkelijke gesprek + toolaanroepen + compaction-samenvattingen op
   - Wordt gebruikt om de modelcontext voor toekomstige beurten opnieuw op te bouwen
   - Compaction-checkpoints zijn metadata over het gecompacteerde opvolgtranscript. Nieuwe compactions schrijven geen tweede `.checkpoint.*.jsonl`-kopie.

Gateway-geschiedenislezers moeten vermijden het hele transcript te materialiseren, tenzij
het oppervlak expliciet willekeurige historische toegang nodig heeft. Geschiedenis van de
eerste pagina, ingesloten chatgeschiedenis, herstel na herstart en token-/gebruikscontroles gebruiken begrensde tail-reads. Volledige transcriptscans lopen via de asynchrone transcriptindex, die wordt
gecached op bestandspad plus `mtimeMs`/`size` en gedeeld wordt tussen gelijktijdige lezers.

---

## Locaties op schijf

Per agent, op de Gateway-host:

- Store: `~/.openclaw/agents/<agentId>/sessions/sessions.json`
- Transcripts: `~/.openclaw/agents/<agentId>/sessions/<sessionId>.jsonl`
  - Telegram-onderwerpsessies: `.../<sessionId>-topic-<threadId>.jsonl`

OpenClaw lost deze op via `src/config/sessions.ts`.

---

## Store-onderhoud en schijfcontroles

Sessiepersistentie heeft automatische onderhoudscontroles (`session.maintenance`) voor `sessions.json`, transcriptartefacten en trajectory-sidecars:

- `mode`: `enforce` (standaard) of `warn`
- `pruneAfter`: leeftijdsdrempel voor verouderde vermeldingen (standaard `30d`)
- `maxEntries`: maximumaantal vermeldingen in `sessions.json` (standaard `500`)
- Retentie van kortlevende Gateway-model-run-probes staat vast op `24h`, maar is drukgestuurd: verouderde strikte probe-rijen worden alleen verwijderd wanneer onderhouds-/capdruk op sessievermeldingen wordt bereikt. Dit geldt alleen voor strikte expliciete probe-keys die overeenkomen met `agent:*:explicit:model-run-<uuid>` en wordt uitgevoerd vóór globale opschoning/capping van verouderde vermeldingen wanneer het draait.
- `resetArchiveRetention`: retentie voor `*.reset.<timestamp>`-transcriptarchieven (standaard: hetzelfde als `pruneAfter`; `false` schakelt opschoning uit)
- `maxDiskBytes`: optioneel budget voor de sessiemap
- `highWaterBytes`: optioneel doel na opschoning (standaard `80%` van `maxDiskBytes`)

Normale Gateway-schrijfacties lopen via een sessieschrijver per store die mutaties binnen het proces serialiseert zonder een runtime-bestandslock te nemen. Hot-path patchhelpers lenen de gevalideerde muteerbare cache terwijl ze die schrijverslot vasthouden, zodat grote `sessions.json`-bestanden niet voor elke metadata-update worden gekloond of opnieuw gelezen. Runtimecode moet bij voorkeur `updateSessionStore(...)` of `updateSessionStoreEntry(...)` gebruiken; directe saves van de hele store zijn compatibiliteits- en offline-onderhoudstools. Wanneer een Gateway bereikbaar is, delegeren niet-dry-run `openclaw sessions cleanup` en `openclaw agents delete` store-mutaties aan de Gateway, zodat opschoning in dezelfde schrijverswachtrij terechtkomt; `--store <path>` is het expliciete offline-reparatiepad voor direct bestandsonderhoud. `maxEntries`-opschoning wordt nog steeds gebatcht voor productiecapgroottes, dus een store kan kortstondig de geconfigureerde cap overschrijden voordat de volgende high-water-opschoning deze weer terugschrijft. Sessiestore-reads prunen of cappen geen vermeldingen tijdens het opstarten van de Gateway; gebruik schrijfaanroepen of `openclaw sessions cleanup --enforce` voor opschoning. `openclaw sessions cleanup --enforce` past de geconfigureerde cap nog steeds direct toe en prunet oude niet-gerefereerde transcript-, checkpoint- en trajectory-artefacten, zelfs wanneer er geen schijfbudget is geconfigureerd.

Onderhoud behoudt duurzame externe gesprekspointers zoals groepssessies
en thread-scoped chatsessies, maar synthetische runtime-vermeldingen voor Cron, hooks,
Heartbeat, ACP en subagents kunnen nog steeds worden verwijderd wanneer ze de
geconfigureerde leeftijd, telling of het schijfbudget overschrijden. Gateway-model-run-probesessies gebruiken de
afzonderlijke `24h`-model-run-retentie alleen wanneer hun key exact overeenkomt met
`agent:*:explicit:model-run-<uuid>`; andere expliciete sessies maken geen deel uit van
die retentie. De model-run-opschoning wordt alleen toegepast bij capdruk op sessievermeldingen. Geïsoleerde Cron-runs behouden hun eigen `cron.sessionRetention`-controle,
onafhankelijk van model-run-proberetentie.

OpenClaw maakt niet langer automatische `sessions.json.bak.*`-rotatieback-ups tijdens Gateway-schrijfacties. De legacy-key `session.maintenance.rotateBytes` wordt genegeerd en `openclaw doctor --fix` verwijdert deze uit oudere configuraties.

Transcriptmutaties gebruiken een sessieschrijflock op het transcriptbestand. Lockverwerving wacht maximaal
`session.writeLock.acquireTimeoutMs` voordat een fout voor een bezette sessie wordt getoond; de standaard is `60000`
ms. Verhoog dit alleen wanneer legitiem voorbereidings-, opschonings-, compaction- of transcriptmirrorwerk
langer concurreert op trage machines. `session.writeLock.staleMs` bepaalt wanneer een bestaande lock als
verouderd kan worden teruggevorderd; de standaard is `1800000` ms. `session.writeLock.maxHoldMs` bepaalt de
in-process watchdog-vrijgavedrempel; de standaard is `300000` ms. Nood-env-overrides zijn
`OPENCLAW_SESSION_WRITE_LOCK_ACQUIRE_TIMEOUT_MS`, `OPENCLAW_SESSION_WRITE_LOCK_STALE_MS` en
`OPENCLAW_SESSION_WRITE_LOCK_MAX_HOLD_MS`.

Handhavingsvolgorde voor opschoning van schijfbudget (`mode: "enforce"`):

1. Verwijder eerst de oudste gearchiveerde, verweesde transcript- of verweesde trajectory-artefacten.
2. Als het nog steeds boven het doel zit, verwijder dan de oudste sessievermeldingen en hun transcript-/trajectory-bestanden.
3. Ga door totdat het gebruik op of onder `highWaterBytes` ligt.

In `mode: "warn"` rapporteert OpenClaw mogelijke verwijderingen, maar muteert de store/bestanden niet.

Voer onderhoud op aanvraag uit:

```bash
openclaw sessions cleanup --dry-run
openclaw sessions cleanup --enforce
```

---

## Cron-sessies en runlogs

Geïsoleerde Cron-runs maken ook sessievermeldingen/transcripts aan, en ze hebben speciale retentiecontroles:

- `cron.sessionRetention` (standaard `24h`) prunet oude geïsoleerde Cron-run-sessies uit de sessiestore (`false` schakelt uit).
- `cron.runLog.keepLines` prunet bewaarde SQLite-run-history-rijen per Cron-job (standaard: `2000`). `cron.runLog.maxBytes` blijft geaccepteerd voor oudere bestandsgebaseerde runlogs.

Wanneer Cron geforceerd een nieuwe geïsoleerde run-sessie maakt, saneert het de vorige
`cron:<jobId>`-sessievermelding voordat de nieuwe rij wordt geschreven. Het neemt veilige
voorkeuren mee, zoals thinking-/fast-/verbose-instellingen, labels en expliciete
door de gebruiker gekozen model-/auth-overrides. Het laat ambient gesprekscontext vallen,
zoals kanaal-/groepsroutering, verzend- of wachtrijbeleid, elevatie, oorsprong en ACP-
runtimebinding, zodat een nieuwe geïsoleerde run geen verouderde afleverings- of
runtimebevoegdheid van een oudere run kan erven.

---

## Sessiesleutels (`sessionKey`)

Een `sessionKey` identificeert _in welke gespreksbucket_ je zit (routering + isolatie).

Veelvoorkomende patronen:

- Hoofd-/directe chat (per agent): `agent:<agentId>:<mainKey>` (standaard `main`)
- Groep: `agent:<agentId>:<channel>:group:<id>`
- Room/kanaal (Discord/Slack): `agent:<agentId>:<channel>:channel:<id>` of `...:room:<id>`
- Cron: `cron:<job.id>`
- Webhook: `hook:<uuid>` (tenzij overschreven)

De canonieke regels zijn gedocumenteerd op [/concepts/session](/nl/concepts/session).

---

## Sessie-id's (`sessionId`)

Elke `sessionKey` wijst naar een huidige `sessionId` (het transcriptbestand dat het gesprek voortzet).

Vuistregels:

- **Reset** (`/new`, `/reset`) maakt een nieuwe `sessionId` voor die `sessionKey`.
- **Dagelijkse reset** (standaard 4:00 AM lokale tijd op de Gateway-host) maakt een nieuwe `sessionId` aan bij het volgende bericht na de resetgrens.
- **Inactiviteitsverloop** (`session.reset.idleMinutes` of legacy `session.idleMinutes`) maakt een nieuwe `sessionId` aan wanneer een bericht binnenkomt na het inactiviteitsvenster. Wanneer dagelijks + inactiviteit beide zijn geconfigureerd, wint wat het eerst verloopt.
- **Control UI reconnect resume** kan de momenteel zichtbare sessie behouden voor één reconnect-send wanneer de Gateway de overeenkomende `sessionId` ontvangt van een operator-UI-client. Gewone verouderde sends maken nog steeds een nieuwe `sessionId`.
- **Systeemgebeurtenissen** (Heartbeat, Cron-wakeups, exec-notificaties, Gateway-boekhouding) kunnen de sessierij muteren, maar verlengen de versheid voor dagelijkse/inactiviteitsreset niet. Reset-rollover verwijdert in de wachtrij staande systeemgebeurtenismeldingen voor de vorige sessie voordat de verse prompt wordt opgebouwd.
- **Parent-forkbeleid** gebruikt de actieve branch van OpenClaw bij het maken van een thread- of subagent-fork. Als die branch te groot is, start OpenClaw het kind met geïsoleerde context in plaats van te falen of onbruikbare geschiedenis te erven. Het sizingbeleid is automatisch; legacy-configuratie `session.parentForkMaxTokens` wordt verwijderd door `openclaw doctor --fix`.

Implementatiedetail: de beslissing gebeurt in `initSessionState()` in `src/auto-reply/reply/session.ts`.

---

## Sessiestore-schema (`sessions.json`)

Het waardetype van de store is `SessionEntry` in `src/config/sessions.ts`.

Belangrijke velden (niet uitputtend):

- `sessionId`: huidige transcript-id (bestandsnaam wordt hiervan afgeleid, tenzij `sessionFile` is ingesteld)
- `sessionStartedAt`: starttijdstempel voor de huidige `sessionId`; dagelijkse reset
  gebruikt dit voor versheid. Legacy-rijen kunnen dit afleiden uit de JSONL-sessieheader.
- `lastInteractionAt`: tijdstempel van de laatste echte gebruikers-/kanaalinteractie; inactiviteitsreset
  gebruikt dit voor versheid, zodat Heartbeat-, Cron- en exec-gebeurtenissen sessies niet
  levend houden. Legacy-rijen zonder dit veld vallen terug op de herstelde sessiestarttijd
  voor inactiviteitsversheid.
- `updatedAt`: tijdstempel van de laatste mutatie van de store-rij, gebruikt voor lijsten, pruning en
  boekhouding. Het is niet de autoriteit voor versheid van dagelijkse/inactiviteitsreset.
- `sessionFile`: optionele expliciete overschrijving van transcriptpad
- `chatType`: `direct | group | room` (helpt UI's en verzendbeleid)
- `provider`, `subject`, `room`, `space`, `displayName`: metadata voor groeps-/kanaallabeling
- Schakelaars:
  - `thinkingLevel`, `verboseLevel`, `reasoningLevel`, `elevatedLevel`
  - `sendPolicy` (override per sessie)
- Modelselectie:
  - `providerOverride`, `modelOverride`, `authProfileOverride`
- Tokentellers (best-effort / providerafhankelijk):
  - `inputTokens`, `outputTokens`, `totalTokens`, `contextTokens`
- `compactionCount`: hoe vaak automatische compaction is voltooid voor deze sessiekey
- `memoryFlushAt`: tijdstempel voor de laatste pre-compaction-geheugenflush
- `memoryFlushCompactionCount`: compaction-telling toen de laatste flush draaide

De store is veilig te bewerken, maar de Gateway is de autoriteit: deze kan vermeldingen herschrijven of opnieuw hydrateren terwijl sessies draaien.

---

## Transcriptstructuur (`*.jsonl`)

Transcripts worden beheerd door `SessionManager` van `openclaw/plugin-sdk/agent-sessions`.

Het bestand is JSONL:

- Eerste regel: sessieheader (`type: "session"`, bevat `id`, `cwd`, `timestamp`, optioneel `parentSession`)
- Daarna: sessievermeldingen met `id` + `parentId` (boom)

Opmerkelijke vermeldingstypen:

- `message`: user-/assistant-/toolResult-berichten
- `custom_message`: door extensie geïnjecteerde berichten die _wel_ in de modelcontext terechtkomen (kunnen verborgen zijn voor de UI)
- `custom`: extensiestatus die _niet_ in de modelcontext terechtkomt
- `compaction`: blijvend opgeslagen Compaction-samenvatting met `firstKeptEntryId` en `tokensBefore`
- `branch_summary`: blijvend opgeslagen samenvatting bij het navigeren door een boomtak

OpenClaw "herstelt" transcripties bewust **niet**; de Gateway gebruikt `SessionManager` om ze te lezen/schrijven.

---

## Contextvensters versus bijgehouden tokens

Twee verschillende concepten zijn belangrijk:

1. **Modelcontextvenster**: harde limiet per model (tokens zichtbaar voor het model)
2. **Sessiestore-tellers**: voortschrijdende statistieken die naar `sessions.json` worden geschreven (gebruikt voor /status en dashboards)

Als je limieten afstemt:

- Het contextvenster komt uit de modelcatalogus (en kan via configuratie worden overschreven).
- `contextTokens` in de store is een runtime-schatting/rapportagewaarde; behandel het niet als een strikte garantie.

Zie voor meer informatie [/token-use](/nl/reference/token-use).

---

## Compaction: wat het is

Compaction vat oudere conversatie samen in een blijvend opgeslagen `compaction`-item in de transcriptie en houdt recente berichten intact.

Na Compaction zien toekomstige beurten:

- De Compaction-samenvatting
- Berichten na `firstKeptEntryId`

Herinjectie van AGENTS.md-secties na Compaction is opt-in via
`agents.defaults.compaction.postCompactionSections`; wanneer dit niet is ingesteld of `[]` is,
voegt OpenClaw geen AGENTS.md-fragmenten toe boven op de Compaction-samenvatting.

Compaction is **blijvend** (anders dan sessiesnoei). Zie [/concepts/session-pruning](/nl/concepts/session-pruning).

## Compaction-chunkgrenzen en toolkoppeling

Wanneer OpenClaw een lange transcriptie in Compaction-chunks splitst, houdt het
assistant-toolaanroepen gekoppeld aan hun bijbehorende `toolResult`-items.

- Als de tokenaandeel-split tussen een toolaanroep en het resultaat ervan valt, verschuift OpenClaw
  de grens naar het assistant-toolaanroepbericht in plaats van het paar te scheiden.
- Als een afsluitend tool-resultaatblok de chunk anders boven het doel zou duwen,
  behoudt OpenClaw dat wachtende toolblok en laat het de niet-samengevatte staart
  intact.
- Afgebroken/foutieve toolaanroepblokken houden geen wachtende split open.

---

## Wanneer automatische Compaction plaatsvindt (OpenClaw-runtime)

In de ingebedde OpenClaw-agent wordt automatische Compaction in twee gevallen geactiveerd:

1. **Overloopherstel**: het model retourneert een contextoverloopfout
   (`request_too_large`, `context length exceeded`, `input exceeds the maximum
number of tokens`, `input token count exceeds the maximum number of input
tokens`, `input is too long for the model`, `ollama error: context length
exceeded`, en vergelijkbare provider-vormige varianten) → compact → opnieuw proberen.
   Wanneer de provider het geprobeerde tokenaantal rapporteert, geeft OpenClaw dat
   waargenomen aantal door aan Compaction voor overloopherstel. Als de provider
   overloop bevestigt maar geen parsebaar aantal blootlegt, geeft OpenClaw een minimaal
   boven-budget synthetisch aantal door aan Compaction-engines en diagnostiek.
   Als overloopherstel nog steeds mislukt, toont OpenClaw expliciete instructies aan de
   gebruiker en behoudt het de huidige sessiemapping in plaats van de sessiesleutel
   stilzwijgend naar een nieuw sessie-id te roteren. De volgende stap wordt door de operator bepaald:
   probeer het bericht opnieuw, voer `/compact` uit, of voer `/new` uit wanneer een nieuwe sessie
   de voorkeur heeft.
2. **Drempelonderhoud**: na een geslaagde beurt, wanneer:

`contextTokens > contextWindow - reserveTokens`

Waarbij:

- `contextWindow` het contextvenster van het model is
- `reserveTokens` ruimte is die is gereserveerd voor prompts + de volgende modeluitvoer

Dit zijn OpenClaw-runtime-semantieken.

OpenClaw kan ook een preflight lokale Compaction activeren voordat de volgende
run wordt geopend wanneer `agents.defaults.compaction.maxActiveTranscriptBytes` is ingesteld en het
actieve transcriptiebestand die grootte bereikt. Dit is een bestandsgroottebeveiliging voor lokale
heropenkosten, geen ruwe archivering: OpenClaw voert nog steeds normale semantische Compaction uit,
en vereist `truncateAfterCompaction` zodat de gecompacteerde samenvatting een
nieuwe opvolgertranscriptie kan worden.

Voor ingebedde OpenClaw-runs voegt `agents.defaults.compaction.midTurnPrecheck.enabled: true`
een opt-in tool-loopbeveiliging toe. Nadat een toolresultaat is toegevoegd en vóór de
volgende modelaanroep, schat OpenClaw de promptdruk met dezelfde preflight-
budgetlogica die aan het begin van een beurt wordt gebruikt. Als de context niet meer past, compact de beveiliging
niet binnen de `transformContext`-hook van de OpenClaw-runtime. Het verhoogt een gestructureerd
mid-turn-prechecksignaal, stopt de huidige promptinzending en laat de
buitenste runloop het bestaande herstelpad gebruiken: te grote toolresultaten inkorten
wanneer dat voldoende is, of de geconfigureerde Compaction-modus activeren en opnieuw proberen. De
optie is standaard uitgeschakeld en werkt met zowel `default`- als `safeguard`-
Compaction-modi, inclusief provider-backed safeguard Compaction.
Dit staat los van `maxActiveTranscriptBytes`: de bytegroottebeveiliging draait
voordat een beurt wordt geopend, terwijl mid-turn precheck later in de ingebedde OpenClaw-toolloop draait
nadat nieuwe toolresultaten zijn toegevoegd.

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

OpenClaw handhaaft ook een veiligheidsvloer voor ingebedde runs:

- Als `compaction.reserveTokens < reserveTokensFloor`, verhoogt OpenClaw dit.
- De standaardvloer is `20000` tokens.
- Stel `agents.defaults.compaction.reserveTokensFloor: 0` in om de vloer uit te schakelen.
- Als deze al hoger is, laat OpenClaw hem ongemoeid.
- Handmatige `/compact` respecteert een expliciete `agents.defaults.compaction.keepRecentTokens`
  en behoudt het recente-staart-afkappunt van de OpenClaw-runtime. Zonder een expliciet bewaarbudget
  blijft handmatige Compaction een hard checkpoint en begint opnieuw opgebouwde context vanaf
  de nieuwe samenvatting.
- Stel `agents.defaults.compaction.midTurnPrecheck.enabled: true` in om de
  optionele tool-loop-precheck uit te voeren na nieuwe toolresultaten en vóór de volgende model-
  aanroep. Dit is alleen een trigger; samenvattingsgeneratie gebruikt nog steeds het geconfigureerde
  Compaction-pad. Het staat los van `maxActiveTranscriptBytes`, wat een
  bytegroottebeveiliging voor actieve transcripties bij het begin van een beurt is.
- Stel `agents.defaults.compaction.maxActiveTranscriptBytes` in op een bytewaarde of
  tekenreeks zoals `"20mb"` om lokale Compaction vóór een beurt uit te voeren wanneer de actieve
  transcriptie groot wordt. Deze beveiliging is alleen actief wanneer
  `truncateAfterCompaction` ook is ingeschakeld. Laat dit niet ingesteld of stel `0` in om
  uit te schakelen.
- Wanneer `agents.defaults.compaction.truncateAfterCompaction` is ingeschakeld,
  roteert OpenClaw de actieve transcriptie na Compaction naar een gecompacteerde opvolger-JSONL.
  Branch-/herstel-checkpointacties gebruiken die gecompacteerde opvolger;
  oudere pre-Compaction-checkpointbestanden blijven leesbaar zolang ernaar wordt verwezen.

Waarom: genoeg ruimte overlaten voor multi-turn "huishouding" (zoals geheugenschrijfacties) voordat Compaction onvermijdelijk wordt.

Implementatie: `applyAgentCompactionSettingsFromConfig()` in `src/agents/agent-settings.ts`
(aangeroepen vanuit ingebedde-runner-beurt- en Compaction-instelpaden).

---

## Pluggable Compaction-providers

Plugins kunnen een Compaction-provider registreren via `registerCompactionProvider()` op de Plugin-API. Wanneer `agents.defaults.compaction.provider` is ingesteld op een geregistreerd provider-id, delegeert de safeguard-extensie samenvatting aan die provider in plaats van aan de ingebouwde `summarizeInStages`-pipeline.

- `provider`: id van een geregistreerde Compaction-provider-Plugin. Laat niet ingesteld voor standaard LLM-samenvatting.
- Het instellen van een `provider` forceert `mode: "safeguard"`.
- Providers ontvangen dezelfde Compaction-instructies en hetzelfde identifier-preservation-beleid als het ingebouwde pad.
- De safeguard behoudt nog steeds recente-beurt- en split-turn-suffixcontext na provideruitvoer.
- Ingebouwde safeguard-samenvatting distilleert eerdere samenvattingen opnieuw met nieuwe berichten
  in plaats van de volledige vorige samenvatting letterlijk te behouden.
- Safeguard-modus schakelt standaard audits voor samenvattingskwaliteit in; stel
  `qualityGuard.enabled: false` in om retry-on-malformed-output-gedrag over te slaan.
- Als de provider faalt of een leeg resultaat retourneert, valt OpenClaw automatisch terug op ingebouwde LLM-samenvatting.
- Afbreek-/time-outsignalen worden opnieuw geworpen (niet ingeslikt) om annulering door de aanroeper te respecteren.

Bron: `src/plugins/compaction-provider.ts`, `src/agents/agent-hooks/compaction-safeguard.ts`.

---

## Voor gebruikers zichtbare oppervlakken

Je kunt Compaction en sessiestatus bekijken via:

- `/status` (in elke chatsessie)
- `openclaw status` (CLI)
- `openclaw sessions` / `sessions --json`
- Gateway-logboeken (`pnpm gateway:watch` of `openclaw logs --follow`): `embedded run auto-compaction start` + `complete`
- Uitgebreide modus: `🧹 Auto-compaction complete` + Compaction-aantal

---

## Stille huishouding (`NO_REPLY`)

OpenClaw ondersteunt "stille" beurten voor achtergrondtaken waarbij de gebruiker geen tussentijdse uitvoer zou moeten zien.

Conventie:

- De assistant begint zijn uitvoer met het exacte stille token `NO_REPLY` /
  `no_reply` om aan te geven "lever geen antwoord aan de gebruiker".
- OpenClaw stript/onderdrukt dit in de afleverlaag.
- Exacte stille-tokenonderdrukking is hoofdletterongevoelig, dus `NO_REPLY` en
  `no_reply` tellen allebei wanneer de hele payload alleen het stille token is.
- Dit is alleen voor echte achtergrond-/geen-aflevering-beurten; het is geen snelkoppeling voor
  gewone uitvoerbare gebruikersverzoeken.

Vanaf `2026.1.10` onderdrukt OpenClaw ook **concept-/typestreaming** wanneer een
gedeeltelijke chunk begint met `NO_REPLY`, zodat stille bewerkingen geen gedeeltelijke
uitvoer halverwege een beurt lekken.

---

## Pre-Compaction "geheugenflush" (geïmplementeerd)

Doel: voordat automatische Compaction plaatsvindt, een stille agentische beurt uitvoeren die duurzame
status naar schijf schrijft (bijv. `memory/YYYY-MM-DD.md` in de agentwerkruimte), zodat Compaction
kritieke context niet kan wissen.

OpenClaw gebruikt de **pre-threshold flush**-aanpak:

1. Bewaak het contextgebruik van de sessie.
2. Wanneer dit een "zachte drempel" overschrijdt (onder de Compaction-drempel van de OpenClaw-runtime), voer dan een stille
   "schrijf geheugen nu"-instructie uit naar de agent.
3. Gebruik het exacte stille token `NO_REPLY` / `no_reply` zodat de gebruiker
   niets ziet.

Configuratie (`agents.defaults.compaction.memoryFlush`):

- `enabled` (standaard: `true`)
- `model` (optionele exacte provider/model-overschrijving voor de flush-beurt, bijvoorbeeld `ollama/qwen3:8b`)
- `softThresholdTokens` (standaard: `4000`)
- `prompt` (gebruikersbericht voor de flush-beurt)
- `systemPrompt` (extra systeemprompt toegevoegd voor de flush-beurt)

Opmerkingen:

- De standaardprompt/systeemprompt bevat een `NO_REPLY`-hint om
  aflevering te onderdrukken.
- Wanneer `model` is ingesteld, gebruikt de flush-beurt dat model zonder de
  fallbackketen van de actieve sessie te erven, zodat lokale huishouding niet stilzwijgend
  terugvalt op een betaald conversatiemodel.
- De flush draait één keer per Compaction-cyclus (bijgehouden in `sessions.json`).
- De flush draait alleen voor ingebedde OpenClaw-sessies (CLI-backends slaan dit over).
- De flush wordt overgeslagen wanneer de sessiewerkruimte alleen-lezen is (`workspaceAccess: "ro"` of `"none"`).
- Zie [Geheugen](/nl/concepts/memory) voor de bestandsindeling van de werkruimte en schrijfpatronen.

OpenClaw stelt ook een `session_before_compact`-hook beschikbaar in de extensie-API, maar de
flushlogica van OpenClaw leeft vandaag aan de Gateway-kant.

---

## Probleemoplossingschecklist

- Verkeerde sessiesleutel? Begin met [/concepts/session](/nl/concepts/session) en bevestig de `sessionKey` in `/status`.
- Store versus transcriptie komt niet overeen? Bevestig de Gateway-host en het store-pad via `openclaw status`.
- Compaction-spam? Controleer:
  - modelcontextvenster (te klein)
  - Compaction-instellingen (`reserveTokens` te hoog voor het modelvenster kan eerdere Compaction veroorzaken)
  - opgeblazen toolresultaten: schakel sessiesnoei in/stem het af
- Lekken stille beurten? Bevestig dat het antwoord begint met `NO_REPLY` (hoofdletterongevoelig exact token) en dat je een build gebruikt die de fix voor streamingonderdrukking bevat.

## Gerelateerd

- [Sessiebeheer](/nl/concepts/session)
- [Sessiesnoei](/nl/concepts/session-pruning)
- [Contextengine](/nl/concepts/context-engine)
