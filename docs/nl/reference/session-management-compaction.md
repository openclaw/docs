---
read_when:
    - Je moet sessie-id's, transcript-JSONL of sessions.json-velden debuggen
    - Je wijzigt automatisch Compaction-gedrag of voegt “pre-compaction”-opschoning toe
    - Je wilt geheugenflushes of stille systeembeurten implementeren
summary: 'Diepgaande uitleg: sessieopslag + transcripten, levenscyclus en interne werking van (auto)Compaction'
title: Verdieping in sessiebeheer
x-i18n:
    generated_at: "2026-04-30T16:30:09Z"
    model: gpt-5.5
    provider: openai
    source_hash: 5a6a7031cebd90d27784a32a0d0378ea9959249389d209f0745395f90b8a0df9
    source_path: reference/session-management-compaction.md
    workflow: 16
---

OpenClaw beheert sessies end-to-end in deze gebieden:

- **Sessieroutering** (hoe inkomende berichten aan een `sessionKey` worden gekoppeld)
- **Sessieopslag** (`sessions.json`) en wat die bijhoudt
- **Transcriptpersistentie** (`*.jsonl`) en de structuur ervan
- **Transcripthygiëne** (providerspecifieke correcties vóór runs)
- **Contextlimieten** (contextvenster versus bijgehouden tokens)
- **Compaction** (handmatige en automatische Compaction) en waar je werk vóór Compaction kunt inhaken
- **Stil onderhoud** (geheugenschrijfacties die geen voor gebruikers zichtbare uitvoer mogen produceren)

Als je eerst een overzicht op hoger niveau wilt, begin dan met:

- [Sessiebeheer](/nl/concepts/session)
- [Compaction](/nl/concepts/compaction)
- [Geheugenoverzicht](/nl/concepts/memory)
- [Geheugen zoeken](/nl/concepts/memory-search)
- [Sessies opschonen](/nl/concepts/session-pruning)
- [Transcripthygiëne](/nl/reference/transcript-hygiene)

---

## Bron van waarheid: de Gateway

OpenClaw is ontworpen rond één enkel **Gateway-proces** dat sessiestatus beheert.

- UI's (macOS-app, web Control UI, TUI) moeten de Gateway bevragen voor sessielijsten en tokentellingen.
- In remote-modus staan sessiebestanden op de remote host; “je lokale Mac-bestanden controleren” geeft niet weer wat de Gateway gebruikt.

---

## Twee persistentielagen

OpenClaw bewaart sessies in twee lagen:

1. **Sessieopslag (`sessions.json`)**
   - Sleutel/waarde-map: `sessionKey -> SessionEntry`
   - Klein, wijzigbaar, veilig om te bewerken (of items te verwijderen)
   - Houdt sessiemetadata bij (huidige sessie-id, laatste activiteit, schakelaars, tokentellers, enz.)

2. **Transcript (`<sessionId>.jsonl`)**
   - Append-only transcript met boomstructuur (items hebben `id` + `parentId`)
   - Slaat het daadwerkelijke gesprek + toolaanroepen + Compaction-samenvattingen op
   - Wordt gebruikt om de modelcontext voor toekomstige beurten opnieuw op te bouwen
   - Grote debugcheckpoints vóór Compaction worden overgeslagen zodra het actieve
     transcript de groottelimiet voor checkpoints overschrijdt, zodat een tweede reusachtige
     `.checkpoint.*.jsonl`-kopie wordt vermeden.

---

## Locaties op schijf

Per agent, op de Gateway-host:

- Opslag: `~/.openclaw/agents/<agentId>/sessions/sessions.json`
- Transcripties: `~/.openclaw/agents/<agentId>/sessions/<sessionId>.jsonl`
  - Telegram-onderwerpsessies: `.../<sessionId>-topic-<threadId>.jsonl`

OpenClaw lost deze op via `src/config/sessions.ts`.

---

## Opslagonderhoud en schijfcontroles

Sessiepersistentie heeft automatische onderhoudscontroles (`session.maintenance`) voor `sessions.json`, transcriptartefacten en trajectory-sidecars:

- `mode`: `warn` (standaard) of `enforce`
- `pruneAfter`: leeftijdsgrens voor verouderde items (standaard `30d`)
- `maxEntries`: maximumaantal items in `sessions.json` (standaard `500`)
- `resetArchiveRetention`: bewaartermijn voor `*.reset.<timestamp>`-transcriptarchieven (standaard: hetzelfde als `pruneAfter`; `false` schakelt opschoning uit)
- `maxDiskBytes`: optioneel budget voor de sessiemap
- `highWaterBytes`: optioneel doel na opschoning (standaard `80%` van `maxDiskBytes`)

Normale Gateway-schrijfacties batchen `maxEntries`-opschoning voor productieachtige limieten, dus een opslag kan de geconfigureerde limiet kort overschrijden voordat de volgende high-water-opschoning deze weer verkleint. `openclaw sessions cleanup --enforce` past de geconfigureerde limiet nog steeds direct toe.

OpenClaw maakt niet langer automatische `sessions.json.bak.*`-rotatieback-ups tijdens Gateway-schrijfacties. De verouderde sleutel `session.maintenance.rotateBytes` wordt genegeerd en `openclaw doctor --fix` verwijdert deze uit oudere configuraties.

Handhavingsvolgorde voor opschoning van schijfbudget (`mode: "enforce"`):

1. Verwijder eerst de oudste gearchiveerde, weestranscript- of weestrajectory-artefacten.
2. Als het gebruik nog steeds boven het doel ligt, verwijder dan de oudste sessie-items en hun transcript-/trajectory-bestanden.
3. Ga door totdat het gebruik op of onder `highWaterBytes` ligt.

In `mode: "warn"` rapporteert OpenClaw mogelijke verwijderingen, maar wijzigt het de opslag/bestanden niet.

Voer onderhoud op aanvraag uit:

```bash
openclaw sessions cleanup --dry-run
openclaw sessions cleanup --enforce
```

---

## Cron-sessies en runlogs

Geïsoleerde Cron-runs maken ook sessie-items/transcripties aan, en ze hebben eigen bewaartermijncontroles:

- `cron.sessionRetention` (standaard `24h`) verwijdert oude geïsoleerde Cron-run-sessies uit de sessieopslag (`false` schakelt dit uit).
- `cron.runLog.maxBytes` + `cron.runLog.keepLines` schonen `~/.openclaw/cron/runs/<jobId>.jsonl`-bestanden op (standaardwaarden: `2_000_000` bytes en `2000` regels).

Wanneer Cron geforceerd een nieuwe geïsoleerde run-sessie aanmaakt, saneert het de vorige
`cron:<jobId>`-sessieregel voordat de nieuwe rij wordt geschreven. Het neemt veilige
voorkeuren mee, zoals instellingen voor thinking/fast/verbose, labels en expliciete
door de gebruiker gekozen model-/auth-overschrijvingen. Het verwijdert omgevingscontext van gesprekken, zoals
kanaal-/groepsroutering, verzend- of wachtrijbeleid, elevation, herkomst en ACP-
runtimebinding, zodat een nieuwe geïsoleerde run geen verouderde delivery- of
runtimebevoegdheid van een oudere run kan erven.

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

- **Reset** (`/new`, `/reset`) maakt een nieuwe `sessionId` voor die `sessionKey`.
- **Dagelijkse reset** (standaard 4:00 AM lokale tijd op de Gateway-host) maakt een nieuwe `sessionId` aan bij het volgende bericht na de resetgrens.
- **Inactiviteitsverloop** (`session.reset.idleMinutes` of verouderd `session.idleMinutes`) maakt een nieuwe `sessionId` aan wanneer een bericht binnenkomt na het inactiviteitsvenster. Wanneer dagelijks + inactiviteit beide zijn geconfigureerd, wint wat het eerst verloopt.
- **Systeemgebeurtenissen** (Heartbeat, Cron-wake-ups, exec-meldingen, Gateway-boekhouding) kunnen de sessieregel wijzigen, maar verlengen de versheid voor dagelijkse/inactiviteitsreset niet. Reset-rollover verwijdert meldingen van systeemgebeurtenissen in de wachtrij voor de vorige sessie voordat de nieuwe prompt wordt opgebouwd.
- **Thread-parent-forkbescherming** (`session.parentForkMaxTokens`, standaard `100000`) slaat parent-transcript-forking over wanneer de parent-sessie al te groot is; de nieuwe thread begint schoon. Stel `0` in om dit uit te schakelen.

Implementatiedetail: de beslissing gebeurt in `initSessionState()` in `src/auto-reply/reply/session.ts`.

---

## Schema van sessieopslag (`sessions.json`)

Het waardetype van de opslag is `SessionEntry` in `src/config/sessions.ts`.

Belangrijke velden (niet uitputtend):

- `sessionId`: huidige transcript-id (bestandsnaam wordt hiervan afgeleid tenzij `sessionFile` is ingesteld)
- `sessionStartedAt`: starttijdstempel voor de huidige `sessionId`; dagelijkse reset
  gebruikt dit voor versheid. Verouderde rijen kunnen dit afleiden uit de JSONL-sessieheader.
- `lastInteractionAt`: tijdstempel van de laatste echte gebruikers-/kanaalinteractie; inactiviteitsreset
  gebruikt dit voor versheid, zodat Heartbeat-, Cron- en exec-gebeurtenissen sessies niet
  levend houden. Verouderde rijen zonder dit veld vallen terug op de herstelde sessiestarttijd
  voor inactiviteitsversheid.
- `updatedAt`: tijdstempel van de laatste wijziging van de opslagrij, gebruikt voor lijsten, opschonen en
  boekhouding. Dit is niet de autoriteit voor versheid van dagelijkse/inactiviteitsreset.
- `sessionFile`: optionele expliciete overschrijving van het transcriptpad
- `chatType`: `direct | group | room` (helpt UI's en verzendbeleid)
- `provider`, `subject`, `room`, `space`, `displayName`: metadata voor groeps-/kanaallabeling
- Schakelaars:
  - `thinkingLevel`, `verboseLevel`, `reasoningLevel`, `elevatedLevel`
  - `sendPolicy` (overschrijving per sessie)
- Modelselectie:
  - `providerOverride`, `modelOverride`, `authProfileOverride`
- Tokentellers (best effort / providerafhankelijk):
  - `inputTokens`, `outputTokens`, `totalTokens`, `contextTokens`
- `compactionCount`: hoe vaak automatische Compaction voor deze sessiesleutel is voltooid
- `memoryFlushAt`: tijdstempel voor de laatste geheugenflush vóór Compaction
- `memoryFlushCompactionCount`: Compaction-telling toen de laatste flush werd uitgevoerd

De opslag is veilig om te bewerken, maar de Gateway is de autoriteit: deze kan items herschrijven of opnieuw hydrateren terwijl sessies lopen.

---

## Transcriptstructuur (`*.jsonl`)

Transcripties worden beheerd door `SessionManager` van `@mariozechner/pi-coding-agent`.

Het bestand is JSONL:

- Eerste regel: sessieheader (`type: "session"`, bevat `id`, `cwd`, `timestamp`, optioneel `parentSession`)
- Daarna: sessie-items met `id` + `parentId` (boom)

Opmerkelijke itemtypen:

- `message`: user/assistant/toolResult-berichten
- `custom_message`: door extensions geïnjecteerde berichten die _wel_ in de modelcontext komen (kunnen verborgen zijn voor de UI)
- `custom`: extension-status die _niet_ in de modelcontext komt
- `compaction`: opgeslagen Compaction-samenvatting met `firstKeptEntryId` en `tokensBefore`
- `branch_summary`: opgeslagen samenvatting bij het navigeren door een boomtak

OpenClaw “corrigeert” transcripties bewust **niet**; de Gateway gebruikt `SessionManager` om ze te lezen/schrijven.

---

## Contextvensters versus bijgehouden tokens

Twee verschillende concepten zijn belangrijk:

1. **Modelcontextvenster**: harde limiet per model (tokens zichtbaar voor het model)
2. **Sessieopslagtellers**: doorlopende statistieken die naar `sessions.json` worden geschreven (gebruikt voor /status en dashboards)

Als je limieten afstemt:

- Het contextvenster komt uit de modelcatalogus (en kan via configuratie worden overschreven).
- `contextTokens` in de opslag is een runtime-schatting/rapportagewaarde; behandel het niet als strikte garantie.

Zie [/token-use](/nl/reference/token-use) voor meer informatie.

---

## Compaction: wat het is

Compaction vat oudere gesprekken samen in een opgeslagen `compaction`-item in het transcript en houdt recente berichten intact.

Na Compaction zien toekomstige beurten:

- De Compaction-samenvatting
- Berichten na `firstKeptEntryId`

Compaction is **persistent** (in tegenstelling tot sessieopschoning). Zie [/concepts/session-pruning](/nl/concepts/session-pruning).

## Chunkgrenzen voor Compaction en toolkoppeling

Wanneer OpenClaw een lang transcript in Compaction-chunks splitst, houdt het
assistant-toolaanroepen gekoppeld aan hun bijbehorende `toolResult`-items.

- Als de splitsing op tokenaandeel tussen een toolaanroep en het resultaat ervan valt, verschuift OpenClaw
  de grens naar het assistant-toolaanroepbericht in plaats van
  het paar te scheiden.
- Als een afsluitend tool-result-blok de chunk anders boven het doel zou brengen,
  behoudt OpenClaw dat pending toolblok en houdt het de niet-samengevatte staart
  intact.
- Afgebroken/foutieve toolaanroepblokken houden een pending splitsing niet open.

---

## Wanneer automatische Compaction gebeurt (Pi-runtime)

In de ingebedde Pi-agent wordt automatische Compaction in twee gevallen geactiveerd:

1. **Overflowherstel**: het model retourneert een context-overflowfout
   (`request_too_large`, `context length exceeded`, `input exceeds the maximum
number of tokens`, `input token count exceeds the maximum number of input
tokens`, `input is too long for the model`, `ollama error: context length
exceeded`, en vergelijkbare providervormige varianten) → compact → opnieuw proberen.
2. **Drempelonderhoud**: na een succesvolle beurt, wanneer:

`contextTokens > contextWindow - reserveTokens`

Waarbij:

- `contextWindow` het contextvenster van het model is
- `reserveTokens` ruimte is die is gereserveerd voor prompts + de volgende modeluitvoer

Dit zijn Pi-runtimesemantieken (OpenClaw consumeert de gebeurtenissen, maar Pi bepaalt wanneer er wordt gecompacteerd).

OpenClaw kan ook lokale preflight-Compaction activeren voordat de volgende
run wordt geopend wanneer `agents.defaults.compaction.maxActiveTranscriptBytes` is ingesteld en het
actieve transcriptbestand die grootte bereikt. Dit is een bestandsgroottebescherming voor lokale
heropenkosten, geen ruwe archivering: OpenClaw voert nog steeds normale semantische Compaction uit,
en vereist `truncateAfterCompaction` zodat de gecompacteerde samenvatting een
nieuw opvolgend transcript kan worden.

Voor embedded Pi-runs voegt `agents.defaults.compaction.midTurnPrecheck.enabled: true`
een opt-in bewaking voor de tool-loop toe. Nadat een toolresultaat is toegevoegd
en vóór de volgende modelaanroep, schat OpenClaw de promptdruk in met dezelfde
preflight-budgetlogica die aan het begin van een turn wordt gebruikt. Als de
context niet meer past, compacteert de bewaking niet binnen Pi's
`transformContext`-hook. De bewaking geeft een gestructureerd mid-turn
precheck-signaal, stopt de huidige promptinzending en laat de buitenste run-loop
het bestaande herstelpad gebruiken: oversized toolresultaten afkappen wanneer
dat genoeg is, of de geconfigureerde Compaction-modus activeren en opnieuw
proberen. De optie is standaard uitgeschakeld en werkt met zowel de `default`-
als de `safeguard`-Compaction-modi, inclusief door providers ondersteunde
safeguard-Compaction.
Dit staat los van `maxActiveTranscriptBytes`: de bytegroottebewaking draait
voordat een turn wordt geopend, terwijl mid-turn precheck later in de embedded
Pi-tool-loop draait nadat nieuwe toolresultaten zijn toegevoegd.

---

## Compaction-instellingen (`reserveTokens`, `keepRecentTokens`)

Pi’s Compaction-instellingen staan in de Pi-instellingen:

```json5
{
  compaction: {
    enabled: true,
    reserveTokens: 16384,
    keepRecentTokens: 20000,
  },
}
```

OpenClaw dwingt ook een veiligheidsminimum af voor embedded runs:

- Als `compaction.reserveTokens < reserveTokensFloor`, verhoogt OpenClaw dit.
- Het standaardminimum is `20000` tokens.
- Stel `agents.defaults.compaction.reserveTokensFloor: 0` in om het minimum uit te schakelen.
- Als het al hoger is, laat OpenClaw het ongemoeid.
- Handmatige `/compact` respecteert een expliciete `agents.defaults.compaction.keepRecentTokens`
  en behoudt Pi's afkappunt voor de recente staart. Zonder een expliciet bewaarbeschik
  blijft handmatige Compaction een hard checkpoint en begint de opnieuw opgebouwde context vanaf
  de nieuwe samenvatting.
- Stel `agents.defaults.compaction.midTurnPrecheck.enabled: true` in om de
  optionele tool-loop-precheck uit te voeren na nieuwe toolresultaten en vóór de volgende modelaanroep.
  Dit is alleen een trigger; het genereren van de samenvatting gebruikt nog steeds het geconfigureerde
  Compaction-pad. Het staat los van `maxActiveTranscriptBytes`, wat een
  bytegroottebewaking voor het actieve transcript aan het begin van een turn is.
- Stel `agents.defaults.compaction.maxActiveTranscriptBytes` in op een bytewaarde of
  string zoals `"20mb"` om lokale Compaction vóór een turn uit te voeren wanneer het actieve
  transcript groot wordt. Deze bewaking is alleen actief wanneer
  `truncateAfterCompaction` ook is ingeschakeld. Laat dit niet ingesteld of stel `0` in om
  uit te schakelen.
- Wanneer `agents.defaults.compaction.truncateAfterCompaction` is ingeschakeld,
  roteert OpenClaw het actieve transcript na Compaction naar een gecompact opvolgend JSONL-bestand.
  Het oude volledige transcript blijft gearchiveerd en wordt gekoppeld vanuit het
  Compaction-checkpoint in plaats van ter plekke te worden herschreven.

Waarom: voldoende speelruimte overlaten voor “huishoudelijke” taken over meerdere turns heen (zoals geheugenwrites) voordat Compaction onvermijdelijk wordt.

Implementatie: `ensurePiCompactionReserveTokens()` in `src/agents/pi-settings.ts`
(aangeroepen vanuit `src/agents/pi-embedded-runner.ts`).

---

## Pluggable Compaction-providers

Plugins kunnen een Compaction-provider registreren via `registerCompactionProvider()` op de Plugin-API. Wanneer `agents.defaults.compaction.provider` is ingesteld op een geregistreerde provider-id, delegeert de safeguard-Plugin het samenvatten aan die provider in plaats van aan de ingebouwde `summarizeInStages`-pipeline.

- `provider`: id van een geregistreerde Compaction-provider-Plugin. Laat dit niet ingesteld voor standaard LLM-samenvatting.
- Het instellen van een `provider` dwingt `mode: "safeguard"` af.
- Providers ontvangen dezelfde Compaction-instructies en hetzelfde beleid voor identifierbehoud als het ingebouwde pad.
- De safeguard behoudt nog steeds recente-turn- en split-turn-achtervoegselcontext na provideruitvoer.
- Ingebouwde safeguard-samenvatting herdistilleert eerdere samenvattingen met nieuwe berichten
  in plaats van de volledige vorige samenvatting letterlijk te behouden.
- Safeguard-modus schakelt standaard kwaliteitsaudits van samenvattingen in; stel
  `qualityGuard.enabled: false` in om retry-bij-misvormde-uitvoer over te slaan.
- Als de provider faalt of een leeg resultaat retourneert, valt OpenClaw automatisch terug op ingebouwde LLM-samenvatting.
- Abort-/timeoutsignalen worden opnieuw gegooid (niet ingeslikt) om annulering door de aanroeper te respecteren.

Bron: `src/plugins/compaction-provider.ts`, `src/agents/pi-hooks/compaction-safeguard.ts`.

---

## Gebruikerszichtbare oppervlakken

Je kunt Compaction en sessiestatus observeren via:

- `/status` (in elke chatsessie)
- `openclaw status` (CLI)
- `openclaw sessions` / `sessions --json`
- Uitgebreide modus: `🧹 Auto-compaction complete` + Compaction-aantal

---

## Stille huishouding (`NO_REPLY`)

OpenClaw ondersteunt “stille” turns voor achtergrondtaken waarbij de gebruiker geen tussentijdse uitvoer zou moeten zien.

Conventie:

- De assistant begint zijn uitvoer met de exacte stille token `NO_REPLY` /
  `no_reply` om aan te geven “lever geen antwoord aan de gebruiker”.
- OpenClaw verwijdert/onderdrukt dit in de afleverlaag.
- Exacte stille-tokenonderdrukking is hoofdletterongevoelig, dus `NO_REPLY` en
  `no_reply` tellen allebei wanneer de volledige payload alleen de stille token is.
- Dit is alleen voor echte achtergrond-/geen-aflevering-turns; het is geen verkorte route voor
  gewone uitvoerbare gebruikersverzoeken.

Vanaf `2026.1.10` onderdrukt OpenClaw ook **concept-/typen-streaming** wanneer een
gedeeltelijk chunk begint met `NO_REPLY`, zodat stille bewerkingen geen gedeeltelijke
uitvoer halverwege een turn lekken.

---

## Pre-Compaction-"memory flush" (geïmplementeerd)

Doel: voordat automatische Compaction plaatsvindt, een stille agentic turn uitvoeren die duurzame
state naar schijf schrijft (bijv. `memory/YYYY-MM-DD.md` in de agentwerkruimte), zodat Compaction
geen kritieke context kan wissen.

OpenClaw gebruikt de **pre-threshold flush**-aanpak:

1. Monitor het contextgebruik van de sessie.
2. Wanneer het een “zachte drempel” overschrijdt (onder Pi’s Compaction-drempel), voer een stille
   “schrijf nu geheugen”-richtlijn naar de agent uit.
3. Gebruik de exacte stille token `NO_REPLY` / `no_reply`, zodat de gebruiker
   niets ziet.

Configuratie (`agents.defaults.compaction.memoryFlush`):

- `enabled` (standaard: `true`)
- `model` (optionele exacte provider/model-override voor de flush-turn, bijvoorbeeld `ollama/qwen3:8b`)
- `softThresholdTokens` (standaard: `4000`)
- `prompt` (gebruikersbericht voor de flush-turn)
- `systemPrompt` (extra systeemprompt toegevoegd voor de flush-turn)

Opmerkingen:

- De standaardprompt/systeemprompt bevatten een `NO_REPLY`-hint om
  aflevering te onderdrukken.
- Wanneer `model` is ingesteld, gebruikt de flush-turn dat model zonder de
  fallbackketen van de actieve sessie te erven, zodat lokale-only huishouding niet stilletjes
  terugvalt op een betaald gespreksmodel.
- De flush draait één keer per Compaction-cyclus (bijgehouden in `sessions.json`).
- De flush draait alleen voor embedded Pi-sessies (CLI-backends slaan dit over).
- De flush wordt overgeslagen wanneer de sessiewerkruimte alleen-lezen is (`workspaceAccess: "ro"` of `"none"`).
- Zie [Memory](/nl/concepts/memory) voor de bestandsindeling van de werkruimte en schrijfpatronen.

Pi stelt ook een `session_before_compact`-hook beschikbaar in de extension-API, maar OpenClaw’s
flushlogica staat vandaag aan de Gateway-kant.

---

## Checklist voor probleemoplossing

- Sessiesleutel verkeerd? Begin met [/concepts/session](/nl/concepts/session) en bevestig de `sessionKey` in `/status`.
- Store versus transcript komt niet overeen? Bevestig de Gateway-host en het storepad vanuit `openclaw status`.
- Compaction-spam? Controleer:
  - contextvenster van het model (te klein)
  - Compaction-instellingen (`reserveTokens` te hoog voor het modelvenster kan eerdere Compaction veroorzaken)
  - opgeblazen toolresultaten: schakel sessiepruning in/stem deze af
- Stille turns lekken? Bevestig dat het antwoord begint met `NO_REPLY` (hoofdletterongevoelige exacte token) en dat je een build gebruikt die de streaming-onderdrukkingsfix bevat.

## Gerelateerd

- [Sessiebeheer](/nl/concepts/session)
- [Sessiepruning](/nl/concepts/session-pruning)
- [Contextengine](/nl/concepts/context-engine)
