---
read_when:
    - Je moet sessie-id's, transcript-JSONL of sessions.json-velden debuggen
    - Je wijzigt het gedrag voor automatische Compaction of voegt huishouding vóór Compaction toe
    - Je wilt geheugenflushes of stille systeembeurten implementeren
summary: 'Diepgaande uitleg: sessieopslag + transcripten, levenscyclus en interne werking van (auto)Compaction'
title: Diepgaande uitleg over sessiebeheer
x-i18n:
    generated_at: "2026-04-29T23:16:23Z"
    model: gpt-5.5
    provider: openai
    source_hash: 1e9785723ebf9b5411440a8f3b2885a50d659f669811ba749c431a2b3aeed700
    source_path: reference/session-management-compaction.md
    workflow: 16
---

OpenClaw beheert sessies end-to-end in deze gebieden:

- **Sessierouting** (hoe inkomende berichten worden gekoppeld aan een `sessionKey`)
- **Sessieopslag** (`sessions.json`) en wat die bijhoudt
- **Transcriptpersistentie** (`*.jsonl`) en de structuur ervan
- **Transcripthygiëne** (providerspecifieke correcties vóór runs)
- **Contextlimieten** (contextvenster versus bijgehouden tokens)
- **Compaction** (handmatige en automatische Compaction) en waar je pre-Compaction-werk kunt aanhaken
- **Stil huishoudelijk werk** (geheugenwrites die geen gebruikerszichtbare uitvoer mogen opleveren)

Als je eerst een overzicht op hoger niveau wilt, begin dan met:

- [Sessiebeheer](/nl/concepts/session)
- [Compaction](/nl/concepts/compaction)
- [Geheugenoverzicht](/nl/concepts/memory)
- [Geheugenzoekopdracht](/nl/concepts/memory-search)
- [Sessiesnoeiing](/nl/concepts/session-pruning)
- [Transcripthygiëne](/nl/reference/transcript-hygiene)

---

## Bron van waarheid: de Gateway

OpenClaw is ontworpen rond één **Gateway-proces** dat de sessiestatus beheert.

- UI's (macOS-app, web Control UI, TUI) moeten de Gateway raadplegen voor sessielijsten en tokenaantallen.
- In externe modus staan sessiebestanden op de externe host; “je lokale Mac-bestanden controleren” weerspiegelt niet wat de Gateway gebruikt.

---

## Twee persistentielagen

OpenClaw bewaart sessies in twee lagen:

1. **Sessieopslag (`sessions.json`)**
   - Key/value-map: `sessionKey -> SessionEntry`
   - Klein, muteerbaar, veilig om te bewerken (of items te verwijderen)
   - Houdt sessiemetadata bij (huidige sessie-id, laatste activiteit, schakelaars, tokentellers, enz.)

2. **Transcript (`<sessionId>.jsonl`)**
   - Append-only transcript met boomstructuur (items hebben `id` + `parentId`)
   - Slaat het daadwerkelijke gesprek + toolaanroepen + Compaction-samenvattingen op
   - Wordt gebruikt om de modelcontext voor toekomstige beurten opnieuw op te bouwen
   - Grote pre-Compaction-debugcheckpoints worden overgeslagen zodra het actieve
     transcript de limiet voor checkpointgrootte overschrijdt, zodat een tweede enorme
     `.checkpoint.*.jsonl`-kopie wordt vermeden.

---

## Locaties op schijf

Per agent, op de Gateway-host:

- Opslag: `~/.openclaw/agents/<agentId>/sessions/sessions.json`
- Transcripten: `~/.openclaw/agents/<agentId>/sessions/<sessionId>.jsonl`
  - Telegram-onderwerpsessies: `.../<sessionId>-topic-<threadId>.jsonl`

OpenClaw lost deze op via `src/config/sessions.ts`.

---

## Onderhoud van opslag en schijfcontroles

Sessiepersistentie heeft automatische onderhoudscontroles (`session.maintenance`) voor `sessions.json`, transcriptartefacten en trajectory-sidecars:

- `mode`: `warn` (standaard) of `enforce`
- `pruneAfter`: leeftijdsgrens voor verouderde items (standaard `30d`)
- `maxEntries`: maximumaantal items in `sessions.json` (standaard `500`)
- `resetArchiveRetention`: bewaartermijn voor `*.reset.<timestamp>`-transcriptarchieven (standaard: hetzelfde als `pruneAfter`; `false` schakelt opschonen uit)
- `maxDiskBytes`: optioneel budget voor de sessiemap
- `highWaterBytes`: optioneel doel na opschonen (standaard `80%` van `maxDiskBytes`)

Normale Gateway-writes batchen `maxEntries`-opschoning voor caps op productieschaal, waardoor een opslag kort de geconfigureerde cap kan overschrijden voordat de volgende high-water-opschoning deze weer terugschrijft. `openclaw sessions cleanup --enforce` past de geconfigureerde cap nog steeds onmiddellijk toe.

OpenClaw maakt niet langer automatische rotatieback-ups `sessions.json.bak.*` tijdens Gateway-writes. De legacy-sleutel `session.maintenance.rotateBytes` wordt genegeerd en `openclaw doctor --fix` verwijdert deze uit oudere configuraties.

Handhavingsvolgorde voor opschoning van schijfbudget (`mode: "enforce"`):

1. Verwijder eerst de oudste gearchiveerde, verweesde transcript- of verweesde trajectory-artefacten.
2. Als het gebruik nog steeds boven het doel ligt, verwijder de oudste sessie-items en hun transcript-/trajectory-bestanden.
3. Ga door totdat het gebruik op of onder `highWaterBytes` ligt.

In `mode: "warn"` rapporteert OpenClaw mogelijke verwijderingen, maar muteert het de opslag/bestanden niet.

Voer onderhoud op aanvraag uit:

```bash
openclaw sessions cleanup --dry-run
openclaw sessions cleanup --enforce
```

---

## Cron-sessies en runlogs

Geïsoleerde Cron-runs maken ook sessie-items/transcripten aan en hebben eigen bewaarbeheer:

- `cron.sessionRetention` (standaard `24h`) snoeit oude geïsoleerde Cron-run-sessies uit de sessieopslag (`false` schakelt dit uit).
- `cron.runLog.maxBytes` + `cron.runLog.keepLines` snoeien `~/.openclaw/cron/runs/<jobId>.jsonl`-bestanden (standaarden: `2_000_000` bytes en `2000` regels).

Wanneer Cron geforceerd een nieuwe geïsoleerde run-sessie aanmaakt, saneert het de vorige
`cron:<jobId>`-sessierij voordat de nieuwe rij wordt geschreven. Het neemt veilige
voorkeuren mee, zoals thinking/fast/verbose-instellingen, labels en expliciete
door de gebruiker gekozen model-/auth-overschrijvingen. Het laat omgevingsgesprekscontext vallen, zoals
channel-/groeprouting, verzend- of wachtrijbeleid, elevation, origin en ACP-
runtimebinding, zodat een nieuwe geïsoleerde run geen verouderde afleverings- of
runtimebevoegdheid van een oudere run kan erven.

---

## Sessiesleutels (`sessionKey`)

Een `sessionKey` identificeert _in welke gespreksbucket_ je zit (routing + isolatie).

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
- **Verloop door inactiviteit** (`session.reset.idleMinutes` of legacy `session.idleMinutes`) maakt een nieuwe `sessionId` aan wanneer een bericht binnenkomt na het inactiviteitsvenster. Wanneer dagelijks + inactiviteit beide zijn geconfigureerd, wint wat het eerst verloopt.
- **Systeemgebeurtenissen** (heartbeat, Cron-wakeups, exec-meldingen, gateway-boekhouding) kunnen de sessierij muteren, maar verlengen de dagelijkse/inactiviteitsresetversheid niet. Resetrollover verwijdert wachtrijmeldingen van systeemgebeurtenissen voor de vorige sessie voordat de nieuwe prompt wordt gebouwd.
- **Thread-parent-forkbeveiliging** (`session.parentForkMaxTokens`, standaard `100000`) slaat het forken van parenttranscripten over wanneer de parentsessie al te groot is; de nieuwe thread begint schoon. Stel `0` in om uit te schakelen.

Implementatiedetail: de beslissing gebeurt in `initSessionState()` in `src/auto-reply/reply/session.ts`.

---

## Schema van sessieopslag (`sessions.json`)

Het waardetype van de opslag is `SessionEntry` in `src/config/sessions.ts`.

Belangrijke velden (niet uitputtend):

- `sessionId`: huidige transcript-id (bestandsnaam wordt hiervan afgeleid tenzij `sessionFile` is ingesteld)
- `sessionStartedAt`: starttijdstempel voor de huidige `sessionId`; dagelijkse reset
  gebruikt dit voor versheid. Legacy-rijen kunnen dit afleiden uit de JSONL-sessieheader.
- `lastInteractionAt`: tijdstempel van de laatste echte gebruikers-/kanaalinteractie; inactiviteitsreset
  gebruikt dit voor versheid zodat heartbeat-, Cron- en exec-gebeurtenissen sessies niet
  levend houden. Legacy-rijen zonder dit veld vallen terug op de herstelde starttijd
  van de sessie voor inactiviteitsversheid.
- `updatedAt`: tijdstempel van de laatste mutatie van de opslagrij, gebruikt voor lijsten, snoeien en
  boekhouding. Dit is niet de autoriteit voor dagelijkse/inactiviteitsresetversheid.
- `sessionFile`: optionele expliciete overschrijving van transcriptpad
- `chatType`: `direct | group | room` (helpt UI's en verzendbeleid)
- `provider`, `subject`, `room`, `space`, `displayName`: metadata voor groeps-/kanaallabeling
- Schakelaars:
  - `thinkingLevel`, `verboseLevel`, `reasoningLevel`, `elevatedLevel`
  - `sendPolicy` (overschrijving per sessie)
- Modelselectie:
  - `providerOverride`, `modelOverride`, `authProfileOverride`
- Tokentellers (best-effort / providerafhankelijk):
  - `inputTokens`, `outputTokens`, `totalTokens`, `contextTokens`
- `compactionCount`: hoe vaak automatische Compaction is voltooid voor deze sessiesleutel
- `memoryFlushAt`: tijdstempel voor de laatste pre-Compaction-geheugenflush
- `memoryFlushCompactionCount`: Compaction-aantal toen de laatste flush draaide

De opslag is veilig om te bewerken, maar de Gateway is de autoriteit: die kan items herschrijven of opnieuw hydrateren terwijl sessies lopen.

---

## Transcriptstructuur (`*.jsonl`)

Transcripten worden beheerd door `SessionManager` van `@mariozechner/pi-coding-agent`.

Het bestand is JSONL:

- Eerste regel: sessieheader (`type: "session"`, bevat `id`, `cwd`, `timestamp`, optioneel `parentSession`)
- Daarna: sessie-items met `id` + `parentId` (boom)

Opmerkelijke itemtypen:

- `message`: user/assistant/toolResult-berichten
- `custom_message`: door extensies geïnjecteerde berichten die _wel_ de modelcontext ingaan (kunnen verborgen zijn voor UI)
- `custom`: extensiestatus die _niet_ de modelcontext ingaat
- `compaction`: gepersisteerde Compaction-samenvatting met `firstKeptEntryId` en `tokensBefore`
- `branch_summary`: gepersisteerde samenvatting bij het navigeren door een boomtak

OpenClaw “corrigeert” transcripten bewust **niet**; de Gateway gebruikt `SessionManager` om ze te lezen/schrijven.

---

## Contextvensters versus bijgehouden tokens

Twee verschillende concepten zijn van belang:

1. **Modelcontextvenster**: harde cap per model (tokens zichtbaar voor het model)
2. **Tellers in de sessieopslag**: rollende statistieken die naar `sessions.json` worden geschreven (gebruikt voor /status en dashboards)

Als je limieten afstemt:

- Het contextvenster komt uit de modelcatalogus (en kan via configuratie worden overschreven).
- `contextTokens` in de opslag is een runtime-schatting/rapportagewaarde; behandel dit niet als strikte garantie.

Zie voor meer informatie [/token-use](/nl/reference/token-use).

---

## Compaction: wat het is

Compaction vat oudere gesprekken samen in een gepersisteerd `compaction`-item in het transcript en houdt recente berichten intact.

Na Compaction zien toekomstige beurten:

- De Compaction-samenvatting
- Berichten na `firstKeptEntryId`

Compaction is **persistent** (in tegenstelling tot sessiesnoeiing). Zie [/concepts/session-pruning](/nl/concepts/session-pruning).

## Compaction-chunkgrenzen en toolkoppeling

Wanneer OpenClaw een lang transcript splitst in Compaction-chunks, houdt het
assistant-toolaanroepen gekoppeld aan hun bijbehorende `toolResult`-items.

- Als de tokenaandeel-splitsing tussen een toolaanroep en het resultaat ervan valt, verschuift OpenClaw
  de grens naar het assistant-toolaanroepbericht in plaats van het paar te scheiden.
- Als een afsluitend toolresultaatblok de chunk anders boven het doel zou duwen,
  bewaart OpenClaw dat wachtende toolblok en houdt het de niet-samengevatte staart
  intact.
- Afgebroken/foutieve toolaanroepblokken houden geen wachtende splitsing open.

---

## Wanneer automatische Compaction plaatsvindt (Pi-runtime)

In de ingebedde Pi-agent wordt automatische Compaction in twee gevallen geactiveerd:

1. **Overflowherstel**: het model retourneert een contextoverflowfout
   (`request_too_large`, `context length exceeded`, `input exceeds the maximum
number of tokens`, `input token count exceeds the maximum number of input
tokens`, `input is too long for the model`, `ollama error: context length
exceeded`, en vergelijkbare providervormige varianten) → compact → opnieuw proberen.
2. **Drempelonderhoud**: na een geslaagde beurt, wanneer:

`contextTokens > contextWindow - reserveTokens`

Waarbij:

- `contextWindow` het contextvenster van het model is
- `reserveTokens` headroom is die is gereserveerd voor prompts + de volgende modeluitvoer

Dit zijn Pi-runtime-semantieken (OpenClaw consumeert de events, maar Pi beslist wanneer Compaction plaatsvindt).

OpenClaw kan ook een preflight lokale Compaction activeren voordat de volgende
run wordt geopend wanneer `agents.defaults.compaction.maxActiveTranscriptBytes` is ingesteld en het
actieve transcriptbestand die grootte bereikt. Dit is een bestandsgroottebeveiliging voor lokale
heropenkosten, geen ruwe archivering: OpenClaw voert nog steeds normale semantische Compaction uit,
en vereist `truncateAfterCompaction` zodat de samengevatte samenvatting een
nieuw opvolgertranscript kan worden.

---

## Compaction-instellingen (`reserveTokens`, `keepRecentTokens`)

Pi's Compaction-instellingen staan in Pi-instellingen:

```json5
{
  compaction: {
    enabled: true,
    reserveTokens: 16384,
    keepRecentTokens: 20000,
  },
}
```

OpenClaw dwingt ook een veiligheidsminimum af voor ingebedde uitvoeringen:

- Als `compaction.reserveTokens < reserveTokensFloor`, verhoogt OpenClaw dit.
- Het standaardminimum is `20000` tokens.
- Stel `agents.defaults.compaction.reserveTokensFloor: 0` in om het minimum uit te schakelen.
- Als het al hoger is, laat OpenClaw het ongemoeid.
- Handmatige `/compact` respecteert een expliciete `agents.defaults.compaction.keepRecentTokens`
  en behoudt Pi's knippunt voor de recente staart. Zonder expliciet bewaarbeleid
  blijft handmatige compaction een hard controlepunt en begint de herbouwde context vanaf
  de nieuwe samenvatting.
- Stel `agents.defaults.compaction.maxActiveTranscriptBytes` in op een bytewaarde of
  string zoals `"20mb"` om lokale compaction vóór een beurt uit te voeren wanneer het actieve
  transcript groot wordt. Deze beveiliging is alleen actief wanneer
  `truncateAfterCompaction` ook is ingeschakeld. Laat dit uitgeschakeld of stel `0` in om
  uit te schakelen.
- Wanneer `agents.defaults.compaction.truncateAfterCompaction` is ingeschakeld,
  roteert OpenClaw het actieve transcript na compaction naar een gecompacteerde opvolger in JSONL.
  Het oude volledige transcript blijft gearchiveerd en gekoppeld vanaf het
  compaction-controlepunt in plaats van ter plekke te worden herschreven.

Waarom: laat genoeg speelruimte over voor “huishoudelijke” acties over meerdere beurten (zoals geheugenwrites) voordat compaction onvermijdelijk wordt.

Implementatie: `ensurePiCompactionReserveTokens()` in `src/agents/pi-settings.ts`
(aangeroepen vanuit `src/agents/pi-embedded-runner.ts`).

---

## Inplugbare compaction-providers

Plugins kunnen een compaction-provider registreren via `registerCompactionProvider()` op de plugin-API. Wanneer `agents.defaults.compaction.provider` is ingesteld op een geregistreerde provider-id, delegeert de safeguard-Plugin de samenvatting aan die provider in plaats van aan de ingebouwde `summarizeInStages`-pipeline.

- `provider`: id van een geregistreerde compaction-provider-Plugin. Laat dit leeg voor standaard LLM-samenvatting.
- Het instellen van een `provider` forceert `mode: "safeguard"`.
- Providers ontvangen dezelfde compaction-instructies en hetzelfde beleid voor behoud van identifiers als het ingebouwde pad.
- De safeguard behoudt na provideruitvoer nog steeds recente-beurtcontext en split-turn-suffixcontext.
- Ingebouwde safeguard-samenvatting destilleert eerdere samenvattingen opnieuw met nieuwe berichten
  in plaats van de volledige vorige samenvatting letterlijk te behouden.
- Safeguard-modus schakelt standaard audits van samenvattingskwaliteit in; stel
  `qualityGuard.enabled: false` in om gedrag voor opnieuw proberen bij misvormde uitvoer over te slaan.
- Als de provider faalt of een leeg resultaat retourneert, valt OpenClaw automatisch terug op ingebouwde LLM-samenvatting.
- Afbreek-/timeoutsignalen worden opnieuw gegooid (niet ingeslikt) om annulering door de aanroeper te respecteren.

Bron: `src/plugins/compaction-provider.ts`, `src/agents/pi-hooks/compaction-safeguard.ts`.

---

## Voor gebruikers zichtbare oppervlakken

Je kunt compaction en sessiestatus bekijken via:

- `/status` (in elke chatsessie)
- `openclaw status` (CLI)
- `openclaw sessions` / `sessions --json`
- Uitgebreide modus: `🧹 Auto-compaction complete` + aantal compactions

---

## Stil huishoudelijk werk (`NO_REPLY`)

OpenClaw ondersteunt “stille” beurten voor achtergrondtaken waarbij de gebruiker geen tussentijdse uitvoer zou moeten zien.

Conventie:

- De assistent begint de uitvoer met het exacte stille token `NO_REPLY` /
  `no_reply` om aan te geven “lever geen antwoord aan de gebruiker”.
- OpenClaw verwijdert/onderdrukt dit in de afleverlaag.
- Onderdrukking van het exacte stille token is hoofdletterongevoelig, dus `NO_REPLY` en
  `no_reply` tellen allebei wanneer de hele payload alleen het stille token is.
- Dit is alleen bedoeld voor echte achtergrond-/niet-afleverbeurten; het is geen snelkoppeling voor
  gewone uitvoerbare gebruikersverzoeken.

Vanaf `2026.1.10` onderdrukt OpenClaw ook **concept-/typestreaming** wanneer een
gedeeltelijke chunk begint met `NO_REPLY`, zodat stille bewerkingen geen gedeeltelijke
uitvoer halverwege een beurt lekken.

---

## Geheugenflush vóór compaction (geïmplementeerd)

Doel: voordat automatische compaction plaatsvindt, een stille agentische beurt uitvoeren die duurzame
status naar schijf schrijft (bijv. `memory/YYYY-MM-DD.md` in de agentwerkruimte), zodat compaction
kritieke context niet kan wissen.

OpenClaw gebruikt de aanpak met **flush vóór de drempel**:

1. Bewaak het contextgebruik van de sessie.
2. Wanneer dit een “zachte drempel” overschrijdt (onder Pi's compaction-drempel), voer dan een stille
   “schrijf nu geheugen”-instructie uit naar de agent.
3. Gebruik het exacte stille token `NO_REPLY` / `no_reply`, zodat de gebruiker
   niets ziet.

Configuratie (`agents.defaults.compaction.memoryFlush`):

- `enabled` (standaard: `true`)
- `model` (optionele exacte provider-/model-override voor de flush-beurt, bijvoorbeeld `ollama/qwen3:8b`)
- `softThresholdTokens` (standaard: `4000`)
- `prompt` (gebruikersbericht voor de flush-beurt)
- `systemPrompt` (extra systeemprompt toegevoegd voor de flush-beurt)

Opmerkingen:

- De standaardprompt/systeemprompt bevat een `NO_REPLY`-hint om
  aflevering te onderdrukken.
- Wanneer `model` is ingesteld, gebruikt de flush-beurt dat model zonder de
  fallbackketen van de actieve sessie te erven, zodat huishoudelijk werk dat alleen lokaal is niet stilletjes
  terugvalt op een betaald gespreksmodel.
- De flush wordt eenmaal per compaction-cyclus uitgevoerd (bijgehouden in `sessions.json`).
- De flush wordt alleen uitgevoerd voor ingebedde Pi-sessies (CLI-backends slaan dit over).
- De flush wordt overgeslagen wanneer de sessiewerkruimte alleen-lezen is (`workspaceAccess: "ro"` of `"none"`).
- Zie [Geheugen](/nl/concepts/memory) voor de indeling van werkruimtebestanden en schrijfpatronen.

Pi stelt ook een `session_before_compact`-hook beschikbaar in de extensie-API, maar OpenClaw's
flushlogica leeft vandaag aan de Gateway-kant.

---

## Checklist voor probleemoplossing

- Verkeerde sessiesleutel? Begin met [/concepts/session](/nl/concepts/session) en bevestig de `sessionKey` in `/status`.
- Mismatch tussen opslag en transcript? Bevestig de Gateway-host en het opslagpad via `openclaw status`.
- Compaction-spam? Controleer:
  - modelcontextvenster (te klein)
  - compaction-instellingen (`reserveTokens` te hoog voor het modelvenster kan eerdere compaction veroorzaken)
  - opgeblazen toolresultaten: schakel sessiesnoeiing in/stem die af
- Lekkende stille beurten? Bevestig dat het antwoord begint met `NO_REPLY` (hoofdletterongevoelig exact token) en dat je een build gebruikt die de fix voor streamingonderdrukking bevat.

## Gerelateerd

- [Sessiebeheer](/nl/concepts/session)
- [Sessiesnoeiing](/nl/concepts/session-pruning)
- [Contextengine](/nl/concepts/context-engine)
