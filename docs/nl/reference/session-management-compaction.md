---
read_when:
    - Je moet sessie-id's, transcript-JSONL of sessions.json-velden debuggen
    - Je wijzigt auto-Compaction-gedrag of voegt “pre-Compaction”-onderhoud toe
    - Je wilt geheugenflushes of stille systeembeurten implementeren
summary: 'Diepgaande verkenning: sessieopslag + transcripten, levenscyclus en interne werking van (auto)Compaction'
title: Diepgaande uitleg over sessiebeheer
x-i18n:
    generated_at: "2026-05-05T08:26:32Z"
    model: gpt-5.5
    provider: openai
    source_hash: 3161dd9c98bff7ea24266f44a9261693d8a9ee2b47d9af2d152de7057016748b
    source_path: reference/session-management-compaction.md
    workflow: 16
---

OpenClaw beheert sessies end-to-end over deze gebieden:

- **Sessieroutering** (hoe inkomende berichten worden gekoppeld aan een `sessionKey`)
- **Sessiestore** (`sessions.json`) en wat deze bijhoudt
- **Transcriptpersistentie** (`*.jsonl`) en de structuur ervan
- **Transcripthygiëne** (providerspecifieke correcties vóór runs)
- **Contextlimieten** (contextvenster versus bijgehouden tokens)
- **Compaction** (handmatige en automatische Compaction) en waar pre-Compaction-werk kan worden ingehaakt
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

OpenClaw is ontworpen rond één **Gateway-proces** dat eigenaar is van de sessiestatus.

- UI's (macOS-app, web Control UI, TUI) moeten de Gateway opvragen voor sessielijsten en tokenaantallen.
- In externe modus staan sessiebestanden op de externe host; “je lokale Mac-bestanden controleren” geeft niet weer wat de Gateway gebruikt.

---

## Twee persistentielagen

OpenClaw bewaart sessies in twee lagen:

1. **Sessiestore (`sessions.json`)**
   - Key/value-map: `sessionKey -> SessionEntry`
   - Klein, muteerbaar, veilig om te bewerken (of vermeldingen te verwijderen)
   - Houdt sessiemetadata bij (huidige sessie-id, laatste activiteit, schakelaars, tokentellers, enz.)

2. **Transcript (`<sessionId>.jsonl`)**
   - Append-only transcript met boomstructuur (vermeldingen hebben `id` + `parentId`)
   - Slaat het daadwerkelijke gesprek + tool-aanroepen + Compaction-samenvattingen op
   - Wordt gebruikt om de modelcontext voor toekomstige beurten opnieuw op te bouwen
   - Grote pre-Compaction-debugcontrolepunten worden overgeslagen zodra het actieve
     transcript de groottelimiet voor controlepunten overschrijdt, zodat een tweede enorme
     `.checkpoint.*.jsonl`-kopie wordt vermeden.

Gateway-geschiedenislezers moeten voorkomen dat ze het hele transcript materialiseren, tenzij
het oppervlak expliciet willekeurige historische toegang nodig heeft. Geschiedenis van de eerste pagina,
ingebedde chatgeschiedenis, herstel na herstart en token-/gebruikscontroles gebruiken begrensde tail-lezingen.
Volledige transcriptscans lopen via de asynchrone transcriptindex, die wordt
gecached op bestandspad plus `mtimeMs`/`size` en gedeeld wordt tussen gelijktijdige lezers.

---

## Locaties op schijf

Per agent, op de Gateway-host:

- Store: `~/.openclaw/agents/<agentId>/sessions/sessions.json`
- Transcripten: `~/.openclaw/agents/<agentId>/sessions/<sessionId>.jsonl`
  - Telegram-onderwerpsessies: `.../<sessionId>-topic-<threadId>.jsonl`

OpenClaw lost deze op via `src/config/sessions.ts`.

---

## Store-onderhoud en schijfcontroles

Sessiepersistentie heeft automatische onderhoudscontroles (`session.maintenance`) voor `sessions.json`, transcriptartefacten en trajectory-sidecars:

- `mode`: `warn` (standaard) of `enforce`
- `pruneAfter`: leeftijdsgrens voor verouderde vermeldingen (standaard `30d`)
- `maxEntries`: maximumaantal vermeldingen in `sessions.json` (standaard `500`)
- `resetArchiveRetention`: bewaartermijn voor `*.reset.<timestamp>`-transcriptarchieven (standaard: hetzelfde als `pruneAfter`; `false` schakelt opschonen uit)
- `maxDiskBytes`: optioneel budget voor de sessiemap
- `highWaterBytes`: optioneel doel na opschonen (standaard `80%` van `maxDiskBytes`)

Normale Gateway-schrijfacties lopen via een sessieschrijver per store die mutaties binnen het proces serialiseert zonder een runtime-bestandslock te nemen. Hot-path patchhelpers lenen de gevalideerde muteerbare cache terwijl ze die schrijverslot vasthouden, zodat grote `sessions.json`-bestanden niet voor elke metadata-update worden gekloond of opnieuw gelezen. Runtimecode moet bij voorkeur `updateSessionStore(...)` of `updateSessionStoreEntry(...)` gebruiken; directe saves van de volledige store zijn compatibiliteits- en offline-onderhoudstools. Wanneer een Gateway bereikbaar is, delegeren non-dry-run `openclaw sessions cleanup` en `openclaw agents delete` store-mutaties aan de Gateway, zodat opschonen in dezelfde schrijfwachtrij terechtkomt; `--store <path>` is het expliciete offline reparatiepad voor direct bestandsonderhoud. `maxEntries`-opschoning wordt nog steeds gebatcht voor productie-achtige limieten, dus een store kan kort boven de geconfigureerde limiet uitkomen voordat de volgende high-water-opschoning deze weer terugbrengt. Lezen van de sessiestore snoeit of limiteert geen vermeldingen tijdens het opstarten van de Gateway; gebruik schrijfacties of `openclaw sessions cleanup --enforce` voor opschoning. `openclaw sessions cleanup --enforce` past de geconfigureerde limiet nog steeds direct toe en snoeit oude niet-gerefereerde transcript-, checkpoint- en trajectory-artefacten, ook wanneer er geen schijfbudget is geconfigureerd.

Onderhoud behoudt duurzame externe gesprekspointers zoals groepssessies
en thread-scoped chatsessies, maar synthetische runtimevermeldingen voor cron, hooks,
Heartbeat, ACP en subagents kunnen nog steeds worden verwijderd wanneer ze het
geconfigureerde leeftijds-, aantal- of schijfbudget overschrijden.

OpenClaw maakt niet langer automatische `sessions.json.bak.*`-rotatieback-ups tijdens Gateway-schrijfacties. De legacy-sleutel `session.maintenance.rotateBytes` wordt genegeerd en `openclaw doctor --fix` verwijdert deze uit oudere configuraties.

Transcriptmutaties gebruiken een sessieschrijflock op het transcriptbestand. Lockverwerving wacht maximaal
`session.writeLock.acquireTimeoutMs` voordat een fout voor een bezette sessie wordt getoond; de standaard is `60000`
ms. Verhoog dit alleen wanneer legitieme voorbereiding, opschoning, Compaction of transcriptspiegelwerk
langer conflicteert op trage machines. Detectie van verouderde locks en waarschuwingen voor maximale vasthoudduur blijven afzonderlijke beleidsregels.

Handhavingsvolgorde voor opschoning van schijfbudget (`mode: "enforce"`):

1. Verwijder eerst de oudste gearchiveerde, verweesde transcript- of verweesde trajectory-artefacten.
2. Als het gebruik nog steeds boven het doel ligt, verwijder dan de oudste sessievermeldingen en hun transcript-/trajectory-bestanden.
3. Ga door totdat het gebruik op of onder `highWaterBytes` ligt.

In `mode: "warn"` rapporteert OpenClaw mogelijke verwijderingen, maar muteert het de store/bestanden niet.

Voer onderhoud op aanvraag uit:

```bash
openclaw sessions cleanup --dry-run
openclaw sessions cleanup --enforce
```

---

## Cron-sessies en runlogs

Geïsoleerde Cron-runs maken ook sessievermeldingen/transcripten aan, en ze hebben eigen bewaarbeheer:

- `cron.sessionRetention` (standaard `24h`) snoeit oude geïsoleerde Cron-run-sessies uit de sessiestore (`false` schakelt dit uit).
- `cron.runLog.maxBytes` + `cron.runLog.keepLines` snoeien `~/.openclaw/cron/runs/<jobId>.jsonl`-bestanden (standaarden: `2_000_000` bytes en `2000` regels).

Wanneer Cron geforceerd een nieuwe geïsoleerde run-sessie aanmaakt, schoont het de vorige
`cron:<jobId>`-sessievermelding op voordat de nieuwe rij wordt geschreven. Het neemt veilige
voorkeuren mee zoals instellingen voor thinking/fast/verbose, labels en expliciete
door de gebruiker geselecteerde model-/auth-overrides. Het laat omgevingscontext van gesprekken vallen,
zoals kanaal-/groepsroutering, verzend- of wachtrijbeleid, elevatie, oorsprong en ACP-
runtimebinding, zodat een nieuwe geïsoleerde run geen verouderde aflevering of
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

De canonieke regels staan beschreven op [/concepts/session](/nl/concepts/session).

---

## Sessie-id's (`sessionId`)

Elke `sessionKey` verwijst naar een huidige `sessionId` (het transcriptbestand dat het gesprek voortzet).

Vuistregels:

- **Reset** (`/new`, `/reset`) maakt een nieuwe `sessionId` aan voor die `sessionKey`.
- **Dagelijkse reset** (standaard 4:00 AM lokale tijd op de gatewayhost) maakt een nieuwe `sessionId` aan bij het volgende bericht na de resetgrens.
- **Vervallen door inactiviteit** (`session.reset.idleMinutes` of legacy `session.idleMinutes`) maakt een nieuwe `sessionId` aan wanneer een bericht binnenkomt na het inactiviteitsvenster. Wanneer dagelijks + inactiviteit beide zijn geconfigureerd, wint wat het eerst verloopt.
- **Systeemgebeurtenissen** (Heartbeat, Cron-wakeups, exec-meldingen, gatewayboekhouding) kunnen de sessierij muteren, maar verlengen de versheid voor dagelijkse reset/inactiviteitsreset niet. Reset-rollover verwijdert in de wachtrij geplaatste systeemgebeurtenismeldingen voor de vorige sessie voordat de nieuwe prompt wordt opgebouwd.
- **Parent-forkbeleid** gebruikt de actieve branch van PI bij het maken van een thread- of subagent-fork. Als die branch te groot is, start OpenClaw het kind met geïsoleerde context in plaats van te falen of onbruikbare geschiedenis te erven. Het sizingbeleid is automatisch; legacy-configuratie `session.parentForkMaxTokens` wordt verwijderd door `openclaw doctor --fix`.

Implementatiedetail: de beslissing gebeurt in `initSessionState()` in `src/auto-reply/reply/session.ts`.

---

## Sessiestore-schema (`sessions.json`)

Het waardetype van de store is `SessionEntry` in `src/config/sessions.ts`.

Belangrijke velden (niet uitputtend):

- `sessionId`: huidige transcript-id (bestandsnaam wordt hiervan afgeleid tenzij `sessionFile` is ingesteld)
- `sessionStartedAt`: starttijdstempel voor de huidige `sessionId`; dagelijkse reset
  gebruikt dit voor versheid. Legacy-rijen kunnen dit afleiden uit de JSONL-sessieheader.
- `lastInteractionAt`: tijdstempel van de laatste echte gebruikers-/kanaalinteractie; inactiviteitsreset
  gebruikt dit voor versheid, zodat Heartbeat-, Cron- en exec-gebeurtenissen sessies niet
  levend houden. Legacy-rijen zonder dit veld vallen terug op de herstelde sessiestarttijd
  voor versheid bij inactiviteit.
- `updatedAt`: tijdstempel van de laatste mutatie van de store-rij, gebruikt voor lijsten, snoeien en
  boekhouding. Dit is niet de autoriteit voor versheid bij dagelijkse reset/inactiviteitsreset.
- `sessionFile`: optionele expliciete override voor transcriptpad
- `chatType`: `direct | group | room` (helpt UI's en verzendbeleid)
- `provider`, `subject`, `room`, `space`, `displayName`: metadata voor groeps-/kanaallabels
- Schakelaars:
  - `thinkingLevel`, `verboseLevel`, `reasoningLevel`, `elevatedLevel`
  - `sendPolicy` (override per sessie)
- Modelselectie:
  - `providerOverride`, `modelOverride`, `authProfileOverride`
- Tokentellers (best-effort / providerafhankelijk):
  - `inputTokens`, `outputTokens`, `totalTokens`, `contextTokens`
- `compactionCount`: hoe vaak automatische Compaction is voltooid voor deze sessiesleutel
- `memoryFlushAt`: tijdstempel voor de laatste pre-Compaction-geheugenflush
- `memoryFlushCompactionCount`: Compaction-aantal toen de laatste flush draaide

De store is veilig te bewerken, maar de Gateway is de autoriteit: deze kan vermeldingen herschrijven of opnieuw hydrateren terwijl sessies draaien.

---

## Transcriptstructuur (`*.jsonl`)

Transcripten worden beheerd door `SessionManager` van `@mariozechner/pi-coding-agent`.

Het bestand is JSONL:

- Eerste regel: sessieheader (`type: "session"`, bevat `id`, `cwd`, `timestamp`, optioneel `parentSession`)
- Daarna: sessievermeldingen met `id` + `parentId` (boom)

Opmerkelijke vermeldingstypen:

- `message`: gebruikers-/assistent-/toolResult-berichten
- `custom_message`: door extension geïnjecteerde berichten die _wel_ in de modelcontext terechtkomen (kunnen verborgen zijn voor de UI)
- `custom`: extension-status die _niet_ in de modelcontext terechtkomt
- `compaction`: opgeslagen Compaction-samenvatting met `firstKeptEntryId` en `tokensBefore`
- `branch_summary`: opgeslagen samenvatting bij het navigeren door een boombranch

OpenClaw “repareert” transcripten bewust **niet**; de Gateway gebruikt `SessionManager` om ze te lezen/schrijven.

---

## Contextvensters versus bijgehouden tokens

Twee verschillende concepten zijn belangrijk:

1. **Modelcontextvenster**: harde limiet per model (tokens zichtbaar voor het model)
2. **Sessiestore-tellers**: rollende statistieken die naar `sessions.json` worden geschreven (gebruikt voor /status en dashboards)

Als je limieten afstemt:

- Het contextvenster komt uit de modelcatalogus (en kan via configuratie worden overschreven).
- `contextTokens` in de store is een runtime-schatting/rapportagewaarde; behandel het niet als een strikte garantie.

Zie voor meer informatie [/token-use](/nl/reference/token-use).

---

## Compaction: wat het is

Compaction vat oudere gesprekken samen in een opgeslagen `compaction`-vermelding in het transcript en laat recente berichten intact.

Na Compaction zien toekomstige beurten:

- De Compaction-samenvatting
- Berichten na `firstKeptEntryId`

Compaction is **persistent** (in tegenstelling tot sessie-pruning). Zie [/concepts/session-pruning](/nl/concepts/session-pruning).

## Compaction-chunkgrenzen en toolkoppeling

Wanneer OpenClaw een lang transcript opsplitst in Compaction-chunks, houdt het
assistant-toolaanroepen gekoppeld aan hun overeenkomende `toolResult`-items.

- Als de token-share-splitsing tussen een toolaanroep en het resultaat ervan valt, verschuift OpenClaw
  de grens naar het assistant-toolaanroepbericht in plaats van het paar te scheiden.
- Als een afsluitend tool-resultaatblok de chunk anders over het doel zou duwen,
  bewaart OpenClaw dat wachtende toolblok en houdt het de niet-samengevatte staart
  intact.
- Afgebroken/fout-toolaanroepblokken houden geen wachtende splitsing open.

---

## Wanneer auto-Compaction plaatsvindt (Pi-runtime)

In de ingebedde Pi-agent wordt auto-Compaction in twee gevallen geactiveerd:

1. **Overflowherstel**: het model retourneert een context-overflowfout
   (`request_too_large`, `context length exceeded`, `input exceeds the maximum
number of tokens`, `input token count exceeds the maximum number of input
tokens`, `input is too long for the model`, `ollama error: context length
exceeded`, en vergelijkbare provider-vormige varianten) → compact maken → opnieuw proberen.
2. **Drempelonderhoud**: na een succesvolle beurt, wanneer:

`contextTokens > contextWindow - reserveTokens`

Waarbij:

- `contextWindow` het contextvenster van het model is
- `reserveTokens` gereserveerde ruimte is voor prompts + de volgende modeluitvoer

Dit zijn Pi-runtime-semantieken (OpenClaw verwerkt de gebeurtenissen, maar Pi beslist wanneer compactie plaatsvindt).

OpenClaw kan ook een preflight lokale Compaction activeren voordat de volgende
run wordt geopend wanneer `agents.defaults.compaction.maxActiveTranscriptBytes` is ingesteld en het
actieve transcriptbestand die grootte bereikt. Dit is een bestandsgroottebescherming voor lokale
heropeningskosten, geen ruwe archivering: OpenClaw voert nog steeds normale semantische Compaction uit,
en vereist `truncateAfterCompaction` zodat de compacte samenvatting een
nieuw opvolgend transcript kan worden.

Voor ingebedde Pi-runs voegt `agents.defaults.compaction.midTurnPrecheck.enabled: true`
een optionele tool-loopbescherming toe. Nadat een toolresultaat is toegevoegd en voordat de
volgende modelaanroep plaatsvindt, schat OpenClaw de promptdruk met dezelfde preflight-
budgetlogica die bij het begin van de beurt wordt gebruikt. Als de context niet meer past, voert de bescherming
geen Compaction uit binnen Pi's `transformContext`-hook. Deze geeft een gestructureerd
mid-turn-prechecksignaal, stopt de huidige promptinzending en laat de
buitenste run-loop het bestaande herstelpad gebruiken: te grote toolresultaten afkappen
wanneer dat genoeg is, of de geconfigureerde Compaction-modus activeren en opnieuw proberen. De
optie is standaard uitgeschakeld en werkt met zowel `default`- als `safeguard`-
Compaction-modi, inclusief provider-ondersteunde safeguard-Compaction.
Dit staat los van `maxActiveTranscriptBytes`: de bytegroottebescherming draait
voordat een beurt wordt geopend, terwijl mid-turn precheck later in de ingebedde Pi-tool-
loop draait nadat nieuwe toolresultaten zijn toegevoegd.

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

- Als `compaction.reserveTokens < reserveTokensFloor`, verhoogt OpenClaw dit.
- De standaardvloer is `20000` tokens.
- Stel `agents.defaults.compaction.reserveTokensFloor: 0` in om de vloer uit te schakelen.
- Als deze al hoger is, laat OpenClaw dit ongewijzigd.
- Handmatige `/compact` respecteert een expliciete `agents.defaults.compaction.keepRecentTokens`
  en behoudt Pi's afkappunt voor de recente staart. Zonder expliciet bewaarbodget
  blijft handmatige Compaction een hard checkpoint en begint herbouwde context vanaf
  de nieuwe samenvatting.
- Stel `agents.defaults.compaction.midTurnPrecheck.enabled: true` in om de
  optionele tool-loop-precheck uit te voeren na nieuwe toolresultaten en vóór de volgende model-
  aanroep. Dit is alleen een trigger; samenvattingsgeneratie gebruikt nog steeds het geconfigureerde
  Compaction-pad. Het staat los van `maxActiveTranscriptBytes`, wat een
  bytegroottebescherming voor actieve transcriptie bij beurtstart is.
- Stel `agents.defaults.compaction.maxActiveTranscriptBytes` in op een bytewaarde of
  tekenreeks zoals `"20mb"` om lokale Compaction uit te voeren vóór een beurt wanneer het actieve
  transcript groot wordt. Deze bescherming is alleen actief wanneer
  `truncateAfterCompaction` ook is ingeschakeld. Laat dit leeg of stel `0` in om
  uit te schakelen.
- Wanneer `agents.defaults.compaction.truncateAfterCompaction` is ingeschakeld,
  roteert OpenClaw het actieve transcript na Compaction naar een compacte opvolger-JSONL.
  Het oude volledige transcript blijft gearchiveerd en gekoppeld vanuit het
  Compaction-checkpoint in plaats van ter plekke te worden herschreven.

Waarom: laat genoeg ruimte over voor meerbeurts “huishouding” (zoals geheugenschrijfacties) voordat Compaction onvermijdelijk wordt.

Implementatie: `ensurePiCompactionReserveTokens()` in `src/agents/pi-settings.ts`
(aangeroepen vanuit `src/agents/pi-embedded-runner.ts`).

---

## Pluggable Compaction-providers

Plugins kunnen een Compaction-provider registreren via `registerCompactionProvider()` op de Plugin-API. Wanneer `agents.defaults.compaction.provider` is ingesteld op een geregistreerde provider-id, delegeert de safeguard-Plugin samenvatting aan die provider in plaats van aan de ingebouwde `summarizeInStages`-pipeline.

- `provider`: id van een geregistreerde Compaction-provider-Plugin. Laat leeg voor standaard LLM-samenvatting.
- Het instellen van een `provider` forceert `mode: "safeguard"`.
- Providers ontvangen dezelfde Compaction-instructies en hetzelfde beleid voor behoud van identifiers als het ingebouwde pad.
- De safeguard behoudt nog steeds recente-beurt- en gesplitste-beurt-suffixcontext na provideruitvoer.
- Ingebouwde safeguard-samenvatting destilleert eerdere samenvattingen opnieuw met nieuwe berichten
  in plaats van de volledige vorige samenvatting letterlijk te behouden.
- Safeguard-modus schakelt standaard kwaliteitscontroles van samenvattingen in; stel
  `qualityGuard.enabled: false` in om retry-on-malformed-output-gedrag over te slaan.
- Als de provider faalt of een leeg resultaat retourneert, valt OpenClaw automatisch terug op ingebouwde LLM-samenvatting.
- Abort-/timeoutsignalen worden opnieuw gegooid (niet ingeslikt) om annulering door de aanroeper te respecteren.

Bron: `src/plugins/compaction-provider.ts`, `src/agents/pi-hooks/compaction-safeguard.ts`.

---

## Zichtbare oppervlakken voor gebruikers

Je kunt Compaction en sessiestatus bekijken via:

- `/status` (in elke chatsessie)
- `openclaw status` (CLI)
- `openclaw sessions` / `sessions --json`
- Uitgebreide modus: `🧹 Auto-compaction complete` + Compaction-aantal

---

## Stille huishouding (`NO_REPLY`)

OpenClaw ondersteunt “stille” beurten voor achtergrondtaken waarbij de gebruiker geen tussentijdse uitvoer zou moeten zien.

Conventie:

- De assistant begint de uitvoer met het exacte stille token `NO_REPLY` /
  `no_reply` om aan te geven “lever geen antwoord aan de gebruiker”.
- OpenClaw verwijdert/onderdrukt dit in de afleverlaag.
- Exacte stille-tokenonderdrukking is hoofdletterongevoelig, dus `NO_REPLY` en
  `no_reply` tellen beide wanneer de volledige payload alleen het stille token is.
- Dit is alleen voor echte achtergrond-/geen-aflevering-beurten; het is geen snelkoppeling voor
  gewone uitvoerbare gebruikersverzoeken.

Vanaf `2026.1.10` onderdrukt OpenClaw ook **concept-/typestreaming** wanneer een
gedeeltelijke chunk begint met `NO_REPLY`, zodat stille bewerkingen geen gedeeltelijke
uitvoer halverwege de beurt lekken.

---

## Pre-Compaction "memory flush" (geïmplementeerd)

Doel: voordat auto-Compaction plaatsvindt, een stille agentische beurt uitvoeren die duurzame
status naar schijf schrijft (bijv. `memory/YYYY-MM-DD.md` in de agentwerkruimte), zodat Compaction
kritieke context niet kan wissen.

OpenClaw gebruikt de **pre-threshold flush**-aanpak:

1. Monitor het contextgebruik van de sessie.
2. Wanneer dit een “zachte drempel” overschrijdt (onder Pi's Compaction-drempel), voer dan een stille
   “schrijf geheugen nu”-instructie uit voor de agent.
3. Gebruik het exacte stille token `NO_REPLY` / `no_reply` zodat de gebruiker
   niets ziet.

Configuratie (`agents.defaults.compaction.memoryFlush`):

- `enabled` (standaard: `true`)
- `model` (optionele exacte provider/model-override voor de flush-beurt, bijvoorbeeld `ollama/qwen3:8b`)
- `softThresholdTokens` (standaard: `4000`)
- `prompt` (gebruikersbericht voor de flush-beurt)
- `systemPrompt` (extra systeemprompt toegevoegd voor de flush-beurt)

Opmerkingen:

- De standaardprompt/systeemprompt bevat een `NO_REPLY`-hint om
  aflevering te onderdrukken.
- Wanneer `model` is ingesteld, gebruikt de flush-beurt dat model zonder de
  fallbackketen van de actieve sessie te erven, zodat lokale huishouding niet stilzwijgend
  terugvalt op een betaald gespreksmodel.
- De flush wordt eenmaal per Compaction-cyclus uitgevoerd (bijgehouden in `sessions.json`).
- De flush draait alleen voor ingebedde Pi-sessies (CLI-backends slaan deze over).
- De flush wordt overgeslagen wanneer de sessiewerkruimte alleen-lezen is (`workspaceAccess: "ro"` of `"none"`).
- Zie [Geheugen](/nl/concepts/memory) voor de werkruimtebestandsindeling en schrijfpatronen.

Pi biedt ook een `session_before_compact`-hook in de Plugin-API, maar OpenClaw’s
flushlogica leeft vandaag aan de Gateway-kant.

---

## Checklist voor probleemoplossing

- Sessiesleutel verkeerd? Begin met [/concepts/session](/nl/concepts/session) en bevestig de `sessionKey` in `/status`.
- Store versus transcript komt niet overeen? Bevestig de Gateway-host en het storepad vanuit `openclaw status`.
- Compaction-spam? Controleer:
  - contextvenster van het model (te klein)
  - Compaction-instellingen (`reserveTokens` te hoog voor het modelvenster kan eerdere Compaction veroorzaken)
  - opgeblazen toolresultaten: schakel sessie-pruning in/stem deze af
- Stille beurten lekken? Bevestig dat het antwoord begint met `NO_REPLY` (hoofdletterongevoelig exact token) en dat je een build gebruikt die de streamingonderdrukkingsfix bevat.

## Gerelateerd

- [Sessiebeheer](/nl/concepts/session)
- [Sessie-pruning](/nl/concepts/session-pruning)
- [Context-engine](/nl/concepts/context-engine)
