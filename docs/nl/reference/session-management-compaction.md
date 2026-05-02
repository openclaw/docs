---
read_when:
    - Je moet sessie-ID's, transcript-JSONL of sessions.json-velden debuggen
    - Je wijzigt het gedrag voor automatische Compaction of voegt onderhoudstaken vóór Compaction toe
    - Je wilt geheugenflushes of stille systeembeurten implementeren
summary: 'Diepgaande analyse: sessieopslag + transcripties, levenscyclus en interne werking van (auto)Compaction'
title: Diepgaande uitleg over sessiebeheer
x-i18n:
    generated_at: "2026-05-02T20:58:12Z"
    model: gpt-5.5
    provider: openai
    source_hash: 8271d7b0786e1c47a8cec6e7bd73c3c86a433d629e17937fdd87fa756ed78d73
    source_path: reference/session-management-compaction.md
    workflow: 16
---

OpenClaw beheert sessies end-to-end binnen deze gebieden:

- **Sessieroutering** (hoe inkomende berichten worden gekoppeld aan een `sessionKey`)
- **Sessieopslag** (`sessions.json`) en wat die bijhoudt
- **Transcriptpersistentie** (`*.jsonl`) en de structuur ervan
- **Transcripthygiëne** (provider-specifieke correcties vóór runs)
- **Contextlimieten** (contextvenster versus bijgehouden tokens)
- **Compaction** (handmatige en automatische Compaction) en waar werk vóór Compaction kan worden ingehaakt
- **Stille huishouding** (geheugenschrijfacties die geen voor de gebruiker zichtbare uitvoer mogen produceren)

Als je eerst een overzicht op hoger niveau wilt, begin dan met:

- [Sessiebeheer](/nl/concepts/session)
- [Compaction](/nl/concepts/compaction)
- [Geheugenoverzicht](/nl/concepts/memory)
- [Geheugenzoekfunctie](/nl/concepts/memory-search)
- [Snoeien van sessies](/nl/concepts/session-pruning)
- [Transcripthygiëne](/nl/reference/transcript-hygiene)

---

## Waarheidsbron: de Gateway

OpenClaw is ontworpen rond één enkel **Gateway-proces** dat de sessiestatus beheert.

- UI's (macOS-app, web-Control UI, TUI) moeten de Gateway bevragen voor sessielijsten en tokenaantallen.
- In externe modus staan sessiebestanden op de externe host; “je lokale Mac-bestanden controleren” geeft niet weer wat de Gateway gebruikt.

---

## Twee persistentielagen

OpenClaw bewaart sessies in twee lagen:

1. **Sessieopslag (`sessions.json`)**
   - Sleutel/waarde-map: `sessionKey -> SessionEntry`
   - Klein, muteerbaar, veilig om te bewerken (of vermeldingen te verwijderen)
   - Houdt sessiemetadata bij (huidige sessie-id, laatste activiteit, schakelaars, tokentellers, enz.)

2. **Transcript (`<sessionId>.jsonl`)**
   - Alleen-toevoegen-transcript met boomstructuur (vermeldingen hebben `id` + `parentId`)
   - Slaat het daadwerkelijke gesprek + toolaanroepen + Compaction-samenvattingen op
   - Wordt gebruikt om de modelcontext voor toekomstige beurten opnieuw op te bouwen
   - Grote debugcontrolepunten vóór Compaction worden overgeslagen zodra het actieve
     transcript de groottecap voor controlepunten overschrijdt, zodat een tweede enorme
     `.checkpoint.*.jsonl`-kopie wordt vermeden.

Gateway-geschiedenislezers moeten vermijden het volledige transcript te materialiseren, tenzij
het oppervlak expliciet willekeurige historische toegang nodig heeft. Geschiedenis van de eerste pagina,
ingebedde chatgeschiedenis, herstel na herstart en token-/gebruikscontroles gebruiken begrensde tail-lezingen.
Volledige transcript-scans lopen via de asynchrone transcriptindex, die wordt
gecached op bestandspad plus `mtimeMs`/`size` en wordt gedeeld tussen gelijktijdige lezers.

---

## Locaties op schijf

Per agent, op de Gateway-host:

- Opslag: `~/.openclaw/agents/<agentId>/sessions/sessions.json`
- Transcripties: `~/.openclaw/agents/<agentId>/sessions/<sessionId>.jsonl`
  - Telegram-onderwerpsessies: `.../<sessionId>-topic-<threadId>.jsonl`

OpenClaw lost deze op via `src/config/sessions.ts`.

---

## Opslagonderhoud en schijfcontroles

Sessiepersistentie heeft automatische onderhoudscontroles (`session.maintenance`) voor `sessions.json`, transcriptartefacten en traject-sidecars:

- `mode`: `warn` (standaard) of `enforce`
- `pruneAfter`: leeftijdsgrens voor verouderde vermeldingen (standaard `30d`)
- `maxEntries`: maximumaantal vermeldingen in `sessions.json` (standaard `500`)
- `resetArchiveRetention`: bewaartermijn voor `*.reset.<timestamp>`-transcriptarchieven (standaard: hetzelfde als `pruneAfter`; `false` schakelt opschonen uit)
- `maxDiskBytes`: optioneel budget voor de sessiemap
- `highWaterBytes`: optioneel doel na opschonen (standaard `80%` van `maxDiskBytes`)

Normale Gateway-schrijfacties lopen via een sessieschrijver per opslag die mutaties binnen het proces serialiseert zonder een runtime-bestandslock te nemen. Hot-path patchhelpers lenen de gevalideerde muteerbare cache terwijl ze die schrijversleuf vasthouden, zodat grote `sessions.json`-bestanden niet voor elke metadata-update worden gekloond of opnieuw gelezen. Runtime-code moet bij voorkeur `updateSessionStore(...)` of `updateSessionStoreEntry(...)` gebruiken; directe opslag van de volledige store is bedoeld voor compatibiliteit en offline-onderhoudstools. Wanneer een Gateway bereikbaar is, delegeren niet-droog uitgevoerde `openclaw sessions cleanup` en `openclaw agents delete` opslagmutaties aan de Gateway, zodat opschonen in dezelfde schrijverswachtrij terechtkomt; `--store <path>` is het expliciete offline-reparatiepad voor direct bestandsonderhoud. Opschonen voor `maxEntries` wordt nog steeds in batches uitgevoerd voor productiecaps, waardoor een store kortstondig de geconfigureerde cap kan overschrijden voordat de volgende high-water-opruiming deze weer terugschrijft. Lezingen van de sessieopslag snoeien of begrenzen geen vermeldingen tijdens het opstarten van de Gateway; gebruik schrijfacties of `openclaw sessions cleanup --enforce` voor opschoning. `openclaw sessions cleanup --enforce` past de geconfigureerde cap nog steeds onmiddellijk toe.

Onderhoud behoudt duurzame externe gespreksverwijzingen, zoals groepssessies
en thread-gebonden chatsessies, maar synthetische runtimevermeldingen voor Cron, hooks,
Heartbeat, ACP en subagents kunnen nog steeds worden verwijderd wanneer ze de
geconfigureerde leeftijd, telling of het schijfbudget overschrijden.

OpenClaw maakt niet langer automatische rotatieback-ups van `sessions.json.bak.*` tijdens Gateway-schrijfacties. De legacy-sleutel `session.maintenance.rotateBytes` wordt genegeerd en `openclaw doctor --fix` verwijdert deze uit oudere configuraties.

Transcriptmutaties gebruiken een sessieschrijflock op het transcriptbestand. Lockverwerving wacht maximaal
`session.writeLock.acquireTimeoutMs` voordat een fout voor een bezette sessie wordt gemeld; de standaardwaarde is `60000`
ms. Verhoog dit alleen wanneer legitiem voorbereidings-, opschoon-, Compaction- of transcript-spiegelwerk
langer concurreert op trage machines. Detectie van verouderde locks en waarschuwingen voor maximale vasthoudduur blijven afzonderlijke beleidsregels.

Handhavingsvolgorde voor opschoning van schijfbudget (`mode: "enforce"`):

1. Verwijder eerst de oudste gearchiveerde artefacten, verweesde transcriptartefacten of verweesde trajectartefacten.
2. Als het gebruik nog steeds boven het doel ligt, verwijder dan de oudste sessievermeldingen en hun transcript-/trajectbestanden.
3. Ga door totdat het gebruik op of onder `highWaterBytes` ligt.

In `mode: "warn"` rapporteert OpenClaw mogelijke verwijderingen, maar muteert het de store/bestanden niet.

Voer onderhoud op aanvraag uit:

```bash
openclaw sessions cleanup --dry-run
openclaw sessions cleanup --enforce
```

---

## Cron-sessies en runlogs

Geïsoleerde Cron-runs maken ook sessievermeldingen/transcripties aan, en ze hebben speciale bewaarbeheerinstellingen:

- `cron.sessionRetention` (standaard `24h`) snoeit oude geïsoleerde Cron-run-sessies uit de sessieopslag (`false` schakelt dit uit).
- `cron.runLog.maxBytes` + `cron.runLog.keepLines` snoeien `~/.openclaw/cron/runs/<jobId>.jsonl`-bestanden (standaardwaarden: `2_000_000` bytes en `2000` regels).

Wanneer Cron geforceerd een nieuwe geïsoleerde runsessie maakt, saneert het de vorige
`cron:<jobId>`-sessievermelding voordat de nieuwe rij wordt geschreven. Het neemt veilige
voorkeuren mee, zoals thinking-/fast-/verbose-instellingen, labels en expliciete
door de gebruiker geselecteerde model-/auth-overschrijvingen. Het laat omgevingsgesprekscontext vallen, zoals
kanaal-/groepsroutering, verzend- of wachtrijbeleid, elevatie, oorsprong en ACP
runtime-binding, zodat een nieuwe geïsoleerde run geen verouderde aflevering of
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
- **Dagelijkse reset** (standaard 4:00 uur lokale tijd op de gateway-host) maakt een nieuwe `sessionId` bij het volgende bericht na de resetgrens.
- **Vervallen door inactiviteit** (`session.reset.idleMinutes` of legacy `session.idleMinutes`) maakt een nieuwe `sessionId` wanneer een bericht binnenkomt na het inactiviteitsvenster. Wanneer dagelijks + inactiviteit beide zijn geconfigureerd, wint wat het eerst verloopt.
- **Systeemgebeurtenissen** (Heartbeat, Cron-wakeups, exec-meldingen, Gateway-boekhouding) kunnen de sessierij muteren, maar verlengen de versheid voor dagelijkse/inactiviteitsreset niet. Reset-rollover gooit in de wachtrij geplaatste systeemgebeurtenismeldingen voor de vorige sessie weg voordat de nieuwe prompt wordt opgebouwd.
- **Beleid voor ouder-fork** gebruikt de actieve branch van PI bij het maken van een thread- of subagent-fork. Als die branch te groot is, start OpenClaw het kind met geïsoleerde context in plaats van te falen of onbruikbare geschiedenis te erven. Het groottebeleid is automatisch; legacy-configuratie `session.parentForkMaxTokens` wordt verwijderd door `openclaw doctor --fix`.

Implementatiedetail: de beslissing gebeurt in `initSessionState()` in `src/auto-reply/reply/session.ts`.

---

## Schema van sessieopslag (`sessions.json`)

Het waardetype van de store is `SessionEntry` in `src/config/sessions.ts`.

Belangrijke velden (niet uitputtend):

- `sessionId`: huidige transcript-id (bestandsnaam wordt hiervan afgeleid, tenzij `sessionFile` is ingesteld)
- `sessionStartedAt`: begintijdstempel voor de huidige `sessionId`; dagelijkse reset
  gebruikt dit voor versheid. Legacy-rijen kunnen dit afleiden uit de JSONL-sessieheader.
- `lastInteractionAt`: tijdstempel van de laatste echte gebruikers-/kanaalinteractie; inactiviteitsreset
  gebruikt dit voor versheid, zodat Heartbeat-, Cron- en exec-gebeurtenissen sessies niet
  levend houden. Legacy-rijen zonder dit veld vallen terug op de herstelde sessiestarttijd
  voor inactiviteitsversheid.
- `updatedAt`: tijdstempel van de laatste mutatie van de opslagrij, gebruikt voor vermelding, snoeien en
  boekhouding. Dit is niet de autoriteit voor versheid van dagelijkse/inactiviteitsreset.
- `sessionFile`: optionele expliciete overschrijving van transcriptpad
- `chatType`: `direct | group | room` (helpt UI's en verzendbeleid)
- `provider`, `subject`, `room`, `space`, `displayName`: metadata voor labels van groepen/kanalen
- Schakelaars:
  - `thinkingLevel`, `verboseLevel`, `reasoningLevel`, `elevatedLevel`
  - `sendPolicy` (overschrijving per sessie)
- Modelselectie:
  - `providerOverride`, `modelOverride`, `authProfileOverride`
- Tokentellers (best effort / provider-afhankelijk):
  - `inputTokens`, `outputTokens`, `totalTokens`, `contextTokens`
- `compactionCount`: hoe vaak automatische Compaction is voltooid voor deze sessiesleutel
- `memoryFlushAt`: tijdstempel voor de laatste geheugendoorspoeling vóór Compaction
- `memoryFlushCompactionCount`: Compaction-telling toen de laatste doorspoeling werd uitgevoerd

De store is veilig om te bewerken, maar de Gateway is de autoriteit: deze kan vermeldingen herschrijven of opnieuw hydrateren terwijl sessies draaien.

---

## Transcriptstructuur (`*.jsonl`)

Transcripties worden beheerd door `SessionManager` van `@mariozechner/pi-coding-agent`.

Het bestand is JSONL:

- Eerste regel: sessieheader (`type: "session"`, bevat `id`, `cwd`, `timestamp`, optioneel `parentSession`)
- Daarna: sessievermeldingen met `id` + `parentId` (boom)

Opmerkelijke vermeldingstypen:

- `message`: gebruikers-/assistant-/toolResult-berichten
- `custom_message`: door extensies geïnjecteerde berichten die _wel_ in modelcontext terechtkomen (kunnen verborgen zijn voor UI)
- `custom`: extensiestatus die _niet_ in modelcontext terechtkomt
- `compaction`: opgeslagen Compaction-samenvatting met `firstKeptEntryId` en `tokensBefore`
- `branch_summary`: opgeslagen samenvatting bij het navigeren door een boombranch

OpenClaw “corrigeert” transcripties bewust **niet**; de Gateway gebruikt `SessionManager` om ze te lezen/schrijven.

---

## Contextvensters versus bijgehouden tokens

Twee verschillende concepten zijn belangrijk:

1. **Modelcontextvenster**: harde limiet per model (tokens die zichtbaar zijn voor het model)
2. **Sessieopslagtellers**: rollende statistieken die naar `sessions.json` worden geschreven (gebruikt voor /status en dashboards)

Als je limieten afstemt:

- Het contextvenster komt uit de modelcatalogus (en kan via configuratie worden overschreven).
- `contextTokens` in de store is een runtime-schatting/rapportagewaarde; behandel het niet als een strikte garantie.

Zie voor meer informatie [/token-use](/nl/reference/token-use).

---

## Compaction: wat het is

Compaction vat oudere gesprekken samen in een opgeslagen `compaction`-vermelding in het transcript en houdt recente berichten intact.

Na Compaction zien toekomstige beurten:

- De Compaction-samenvatting
- Berichten na `firstKeptEntryId`

Compaction is **persistent** (in tegenstelling tot het snoeien van sessies). Zie [/concepts/session-pruning](/nl/concepts/session-pruning).

## Compaction-chunkgrenzen en tool-koppeling

Wanneer OpenClaw een lang transcript opsplitst in Compaction-chunks, houdt het
assistent-toolaanroepen gekoppeld aan hun bijbehorende `toolResult`-vermeldingen.

- Als de token-share-splitsing tussen een toolaanroep en het resultaat ervan valt, verschuift OpenClaw
  de grens naar het assistent-toolaanroepbericht in plaats van het
  paar te scheiden.
- Als een afsluitend toolresultaatblok de chunk anders boven het doel zou duwen,
  bewaart OpenClaw dat wachtende toolblok en houdt het de niet-samengevatte staart
  intact.
- Afgebroken/foutieve toolaanroepblokken houden geen wachtende splitsing open.

---

## Wanneer automatische Compaction plaatsvindt (Pi-runtime)

In de ingebedde Pi-agent wordt automatische Compaction in twee gevallen geactiveerd:

1. **Overflow-herstel**: het model retourneert een context-overflowfout
   (`request_too_large`, `context length exceeded`, `input exceeds the maximum
number of tokens`, `input token count exceeds the maximum number of input
tokens`, `input is too long for the model`, `ollama error: context length
exceeded`, en vergelijkbare providervormige varianten) → compact maken → opnieuw proberen.
2. **Drempelonderhoud**: na een geslaagde beurt, wanneer:

`contextTokens > contextWindow - reserveTokens`

Waarbij:

- `contextWindow` het contextvenster van het model is
- `reserveTokens` de speelruimte is die is gereserveerd voor prompts + de volgende modeluitvoer

Dit zijn Pi-runtime-semantieken (OpenClaw consumeert de events, maar Pi bepaalt wanneer er wordt gecompacteerd).

OpenClaw kan ook een preflight lokale Compaction activeren voordat de volgende
run wordt geopend wanneer `agents.defaults.compaction.maxActiveTranscriptBytes` is ingesteld en het
actieve transcriptbestand die grootte bereikt. Dit is een bestandsgroottebeveiliging voor lokale
heropenkosten, geen ruwe archivering: OpenClaw voert nog steeds normale semantische Compaction uit,
en vereist `truncateAfterCompaction` zodat de gecompacteerde samenvatting een
nieuw opvolgend transcript kan worden.

Voor ingebedde Pi-runs voegt `agents.defaults.compaction.midTurnPrecheck.enabled: true`
een optionele tool-loop-beveiliging toe. Nadat een toolresultaat is toegevoegd en voordat de
volgende modelaanroep plaatsvindt, schat OpenClaw de promptdruk met dezelfde preflight-
budgetlogica die aan het begin van een beurt wordt gebruikt. Als de context niet meer past, voert de beveiliging
geen Compaction uit binnen Pi's `transformContext`-hook. De beveiliging geeft een gestructureerd
mid-turn precheck-signaal, stopt de huidige promptindiening en laat de
buitenste run-loop het bestaande herstelpad gebruiken: te grote toolresultaten afkappen
wanneer dat voldoende is, of de geconfigureerde Compaction-modus activeren en opnieuw proberen. De
optie is standaard uitgeschakeld en werkt met zowel `default`- als `safeguard`-
Compaction-modi, inclusief provider-backed safeguard-Compaction.
Dit staat los van `maxActiveTranscriptBytes`: de bytegroottebeveiliging wordt uitgevoerd
voordat een beurt opent, terwijl mid-turn precheck later in de ingebedde Pi-tool-
loop wordt uitgevoerd nadat nieuwe toolresultaten zijn toegevoegd.

---

## Compaction-instellingen (`reserveTokens`, `keepRecentTokens`)

Pi’s Compaction-instellingen staan in Pi-instellingen:

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

- Als `compaction.reserveTokens < reserveTokensFloor`, verhoogt OpenClaw deze.
- De standaardvloer is `20000` tokens.
- Stel `agents.defaults.compaction.reserveTokensFloor: 0` in om de vloer uit te schakelen.
- Als deze al hoger is, laat OpenClaw de waarde ongemoeid.
- Handmatige `/compact` respecteert een expliciete `agents.defaults.compaction.keepRecentTokens`
  en behoudt Pi's recent-tail-afsnijpunt. Zonder een expliciet behoudbudget
  blijft handmatige Compaction een harde checkpoint en begint heropgebouwde context vanaf
  de nieuwe samenvatting.
- Stel `agents.defaults.compaction.midTurnPrecheck.enabled: true` in om de
  optionele tool-loop-precheck uit te voeren na nieuwe toolresultaten en vóór de volgende model-
  aanroep. Dit is alleen een trigger; samenvattingsgeneratie gebruikt nog steeds het geconfigureerde
  Compaction-pad. Dit staat los van `maxActiveTranscriptBytes`, dat een
  turn-start bytegroottebeveiliging voor actieve transcriptie is.
- Stel `agents.defaults.compaction.maxActiveTranscriptBytes` in op een bytewaarde of
  tekenreeks zoals `"20mb"` om lokale Compaction uit te voeren vóór een beurt wanneer het actieve
  transcript groot wordt. Deze beveiliging is alleen actief wanneer
  `truncateAfterCompaction` ook is ingeschakeld. Laat dit niet ingesteld of stel `0` in om
  uit te schakelen.
- Wanneer `agents.defaults.compaction.truncateAfterCompaction` is ingeschakeld,
  roteert OpenClaw het actieve transcript naar een gecompacteerde opvolger-JSONL na
  Compaction. Het oude volledige transcript blijft gearchiveerd en gelinkt vanuit het
  Compaction-checkpoint in plaats van ter plekke te worden herschreven.

Waarom: laat genoeg speelruimte over voor meerbeurts “huishouding” (zoals geheugenschrijfacties) voordat Compaction onvermijdelijk wordt.

Implementatie: `ensurePiCompactionReserveTokens()` in `src/agents/pi-settings.ts`
(aangeroepen vanuit `src/agents/pi-embedded-runner.ts`).

---

## Pluggable Compaction-providers

Plugins kunnen een Compaction-provider registreren via `registerCompactionProvider()` op de plugin-API. Wanneer `agents.defaults.compaction.provider` is ingesteld op een geregistreerde provider-id, delegeert de safeguard-extensie samenvatting aan die provider in plaats van aan de ingebouwde `summarizeInStages`-pipeline.

- `provider`: id van een geregistreerde Compaction-provider-plugin. Laat niet ingesteld voor standaard LLM-samenvatting.
- Het instellen van een `provider` forceert `mode: "safeguard"`.
- Providers ontvangen dezelfde Compaction-instructies en hetzelfde beleid voor behoud van identifiers als het ingebouwde pad.
- De safeguard behoudt nog steeds recente-beurt- en gesplitste-beurt-suffixcontext na provideruitvoer.
- Ingebouwde safeguard-samenvatting destilleert eerdere samenvattingen opnieuw met nieuwe berichten
  in plaats van de volledige vorige samenvatting letterlijk te behouden.
- Safeguard-modus schakelt standaard kwaliteitsaudits voor samenvattingen in; stel
  `qualityGuard.enabled: false` in om retry-on-malformed-output-gedrag over te slaan.
- Als de provider faalt of een leeg resultaat retourneert, valt OpenClaw automatisch terug op ingebouwde LLM-samenvatting.
- Afbreek-/timeoutsignalen worden opnieuw gegooid (niet ingeslikt) om annulering door de aanroeper te respecteren.

Bron: `src/plugins/compaction-provider.ts`, `src/agents/pi-hooks/compaction-safeguard.ts`.

---

## Voor gebruikers zichtbare oppervlakken

Je kunt Compaction- en sessiestatus bekijken via:

- `/status` (in elke chatsessie)
- `openclaw status` (CLI)
- `openclaw sessions` / `sessions --json`
- Uitgebreide modus: `🧹 Auto-compaction complete` + Compaction-aantal

---

## Stille huishouding (`NO_REPLY`)

OpenClaw ondersteunt “stille” beurten voor achtergrondtaken waarbij de gebruiker geen tussentijdse uitvoer zou moeten zien.

Conventie:

- De assistent begint zijn uitvoer met het exacte stille token `NO_REPLY` /
  `no_reply` om aan te geven “lever geen antwoord aan de gebruiker”.
- OpenClaw verwijdert/onderdrukt dit in de bezorglaag.
- Exacte stille-tokenonderdrukking is hoofdletterongevoelig, dus `NO_REPLY` en
  `no_reply` tellen allebei wanneer de hele payload alleen het stille token is.
- Dit is alleen bedoeld voor echte achtergrond-/geen-bezorging-beurten; het is geen snelkoppeling voor
  gewone uitvoerbare gebruikersverzoeken.

Sinds `2026.1.10` onderdrukt OpenClaw ook **concept-/typestreaming** wanneer een
gedeeltelijke chunk begint met `NO_REPLY`, zodat stille bewerkingen geen gedeeltelijke
uitvoer lekken midden in een beurt.

---

## Pre-Compaction "memory flush" (geïmplementeerd)

Doel: voordat automatische Compaction plaatsvindt, een stille agentische beurt uitvoeren die duurzame
staat naar schijf schrijft (bijv. `memory/YYYY-MM-DD.md` in de agentwerkruimte), zodat Compaction geen
kritieke context kan wissen.

OpenClaw gebruikt de **pre-threshold flush**-aanpak:

1. Monitor sessiecontextgebruik.
2. Wanneer dit een “zachte drempel” overschrijdt (onder Pi’s Compaction-drempel), voer een stille
   “schrijf nu geheugen”-instructie uit naar de agent.
3. Gebruik het exacte stille token `NO_REPLY` / `no_reply` zodat de gebruiker
   niets ziet.

Configuratie (`agents.defaults.compaction.memoryFlush`):

- `enabled` (standaard: `true`)
- `model` (optionele exacte provider-/modeloverride voor de flush-beurt, bijvoorbeeld `ollama/qwen3:8b`)
- `softThresholdTokens` (standaard: `4000`)
- `prompt` (gebruikersbericht voor de flush-beurt)
- `systemPrompt` (extra systeemprompt toegevoegd voor de flush-beurt)

Opmerkingen:

- De standaardprompt/systeemprompt bevatten een `NO_REPLY`-hint om
  bezorging te onderdrukken.
- Wanneer `model` is ingesteld, gebruikt de flush-beurt dat model zonder de
  fallback-keten van de actieve sessie te erven, zodat lokale huishouding niet stilzwijgend
  terugvalt op een betaald gespreksmodel.
- De flush wordt één keer per Compaction-cyclus uitgevoerd (bijgehouden in `sessions.json`).
- De flush wordt alleen uitgevoerd voor ingebedde Pi-sessies (CLI-backends slaan dit over).
- De flush wordt overgeslagen wanneer de sessiewerkruimte alleen-lezen is (`workspaceAccess: "ro"` of `"none"`).
- Zie [Geheugen](/nl/concepts/memory) voor de bestandsindeling van de werkruimte en schrijfpatronen.

Pi biedt ook een `session_before_compact`-hook in de extensie-API, maar OpenClaw’s
flush-logica staat tegenwoordig aan de Gateway-kant.

---

## Checklist voor probleemoplossing

- Sessiesleutel verkeerd? Begin met [/concepts/session](/nl/concepts/session) en bevestig de `sessionKey` in `/status`.
- Mismatch tussen store en transcript? Bevestig de Gateway-host en het store-pad vanuit `openclaw status`.
- Compaction-spam? Controleer:
  - contextvenster van het model (te klein)
  - Compaction-instellingen (`reserveTokens` te hoog voor het modelvenster kan eerdere Compaction veroorzaken)
  - opgeblazen toolresultaten: schakel sessiesnoeiing in of stem die af
- Lekken stille beurten? Bevestig dat het antwoord begint met `NO_REPLY` (hoofdletterongevoelig exact token) en dat je een build gebruikt die de streamingonderdrukkingsfix bevat.

## Gerelateerd

- [Sessiebeheer](/nl/concepts/session)
- [Sessiesnoeiing](/nl/concepts/session-pruning)
- [Context-engine](/nl/concepts/context-engine)
