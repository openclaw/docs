---
read_when:
    - Je moet sessie-id's, transcript-JSONL of velden in sessions.json debuggen
    - Je wijzigt het gedrag voor automatische Compaction of voegt opschoning vóór Compaction toe
    - Je wilt geheugenflushes of stille systeembeurten implementeren
summary: 'Diepgaande uitleg: sessieopslag + transcripties, levenscyclus en interne werking van (auto)Compaction'
title: Diepgaande uitleg over sessiebeheer
x-i18n:
    generated_at: "2026-05-02T11:27:26Z"
    model: gpt-5.5
    provider: openai
    source_hash: b9ca8a35210625051f5051e90a18a005d6103bc1d65d356c34f818d2bfc0058c
    source_path: reference/session-management-compaction.md
    workflow: 16
---

OpenClaw beheert sessies end-to-end in deze gebieden:

- **Sessieroutering** (hoe inkomende berichten aan een `sessionKey` worden gekoppeld)
- **Sessiestore** (`sessions.json`) en wat die bijhoudt
- **Transcriptpersistente opslag** (`*.jsonl`) en de structuur ervan
- **Transcripthygiëne** (providerspecifieke correcties vóór runs)
- **Contextlimieten** (contextvenster versus bijgehouden tokens)
- **Compaction** (handmatige en automatische Compaction) en waar je pre-Compaction-werk kunt inhaken
- **Stille huishouding** (geheugenschrijfacties die geen voor de gebruiker zichtbare uitvoer mogen produceren)

Als je eerst een overzicht op hoger niveau wilt, begin dan met:

- [Sessiebeheer](/nl/concepts/session)
- [Compaction](/nl/concepts/compaction)
- [Geheugenoverzicht](/nl/concepts/memory)
- [Geheugen zoeken](/nl/concepts/memory-search)
- [Sessies snoeien](/nl/concepts/session-pruning)
- [Transcripthygiëne](/nl/reference/transcript-hygiene)

---

## Bron van waarheid: de Gateway

OpenClaw is ontworpen rond één **Gateway-proces** dat sessiestatus beheert.

- UI's (macOS-app, web Control UI, TUI) moeten de Gateway raadplegen voor sessielijsten en tokentellingen.
- In remote modus staan sessiebestanden op de externe host; “je lokale Mac-bestanden controleren” geeft niet weer wat de Gateway gebruikt.

---

## Twee persistentielagen

OpenClaw bewaart sessies in twee lagen:

1. **Sessiestore (`sessions.json`)**
   - Key/value-map: `sessionKey -> SessionEntry`
   - Klein, muteerbaar, veilig te bewerken (of vermeldingen te verwijderen)
   - Houdt sessiemetadata bij (huidige sessie-id, laatste activiteit, toggles, tokentellers, enz.)

2. **Transcript (`<sessionId>.jsonl`)**
   - Append-only transcript met boomstructuur (vermeldingen hebben `id` + `parentId`)
   - Slaat het daadwerkelijke gesprek + toolaanroepen + Compaction-samenvattingen op
   - Wordt gebruikt om de modelcontext opnieuw op te bouwen voor toekomstige beurten
   - Grote debug-checkpoints vóór Compaction worden overgeslagen zodra het actieve
     transcript de checkpoint-groottecap overschrijdt, zodat een tweede enorme
     `.checkpoint.*.jsonl`-kopie wordt vermeden.

Gateway-geschiedenislezers moeten vermijden het hele transcript te materialiseren, tenzij
het oppervlak expliciet willekeurige historische toegang nodig heeft. Geschiedenis van de eerste pagina,
ingebedde chatgeschiedenis, herstel na herstart en token-/gebruikscontroles gebruiken begrensde tail-reads.
Volledige transcriptscans lopen via de asynchrone transcriptindex, die wordt
gecached op bestandspad plus `mtimeMs`/`size` en wordt gedeeld tussen gelijktijdige lezers.

---

## Locaties op schijf

Per agent, op de Gateway-host:

- Store: `~/.openclaw/agents/<agentId>/sessions/sessions.json`
- Transcripten: `~/.openclaw/agents/<agentId>/sessions/<sessionId>.jsonl`
  - Telegram-onderwerpsessies: `.../<sessionId>-topic-<threadId>.jsonl`

OpenClaw lost deze op via `src/config/sessions.ts`.

---

## Store-onderhoud en schijfcontroles

Sessiepersistentie heeft automatische onderhoudscontroles (`session.maintenance`) voor `sessions.json`, transcriptartefacten en traject-sidecars:

- `mode`: `warn` (standaard) of `enforce`
- `pruneAfter`: leeftijdsgrens voor verouderde vermeldingen (standaard `30d`)
- `maxEntries`: cap op vermeldingen in `sessions.json` (standaard `500`)
- `resetArchiveRetention`: bewaartermijn voor transcriptarchieven met `*.reset.<timestamp>` (standaard: hetzelfde als `pruneAfter`; `false` schakelt opschonen uit)
- `maxDiskBytes`: optioneel budget voor sessiemap
- `highWaterBytes`: optioneel doel na opschoning (standaard `80%` van `maxDiskBytes`)

Normale Gateway-schrijfacties batchen `maxEntries`-opschoning voor productieformaat caps, dus een store kan kortstondig de geconfigureerde cap overschrijden voordat de volgende high-water-opschoning die weer omlaag herschrijft. Sessiestore-reads snoeien of cappen vermeldingen niet tijdens het opstarten van de Gateway; gebruik schrijfacties of `openclaw sessions cleanup --enforce` voor opschoning. `openclaw sessions cleanup --enforce` past de geconfigureerde cap nog steeds direct toe.

Onderhoud behoudt duurzame externe gesprekspointers zoals groepssessies
en thread-scoped chatsessies, maar synthetische runtimevermeldingen voor cron, hooks,
Heartbeat, ACP en sub-agents kunnen nog steeds worden verwijderd wanneer ze de
geconfigureerde leeftijd, telling of schijfbudget overschrijden.

OpenClaw maakt tijdens Gateway-schrijfacties geen automatische `sessions.json.bak.*`-rotatieback-ups meer. De legacy `session.maintenance.rotateBytes`-sleutel wordt genegeerd en `openclaw doctor --fix` verwijdert die uit oudere configs.

Handhavingsvolgorde voor opschoning van schijfbudget (`mode: "enforce"`):

1. Verwijder eerst de oudste gearchiveerde, verweesde transcript- of verweesde trajectartefacten.
2. Als het doel dan nog wordt overschreden, verwijder dan de oudste sessievermeldingen en hun transcript-/trajectbestanden.
3. Ga door totdat het gebruik op of onder `highWaterBytes` ligt.

In `mode: "warn"` rapporteert OpenClaw potentiële verwijderingen maar muteert het de store/bestanden niet.

Voer onderhoud op aanvraag uit:

```bash
openclaw sessions cleanup --dry-run
openclaw sessions cleanup --enforce
```

---

## Cron-sessies en runlogs

Geïsoleerde cron-runs maken ook sessievermeldingen/transcripten aan en hebben speciale retentiecontroles:

- `cron.sessionRetention` (standaard `24h`) snoeit oude geïsoleerde cron-run-sessies uit de sessiestore (`false` schakelt dit uit).
- `cron.runLog.maxBytes` + `cron.runLog.keepLines` snoeien `~/.openclaw/cron/runs/<jobId>.jsonl`-bestanden (standaardwaarden: `2_000_000` bytes en `2000` regels).

Wanneer cron geforceerd een nieuwe geïsoleerde run-sessie aanmaakt, saneert het de vorige
`cron:<jobId>`-sessievermelding voordat de nieuwe rij wordt geschreven. Het neemt veilige
voorkeuren mee zoals instellingen voor thinking/fast/verbose, labels en expliciete
door de gebruiker geselecteerde model-/auth-overrides. Het verwijdert omgevingsgesprekscontext
zoals channel-/groepsroutering, send- of queue-beleid, elevation, origin en ACP
runtimebinding, zodat een nieuwe geïsoleerde run geen verouderde bezorgings- of
runtimebevoegdheid van een oudere run kan erven.

---

## Sessiesleutels (`sessionKey`)

Een `sessionKey` identificeert _in welke gespreksbucket_ je zit (routering + isolatie).

Veelvoorkomende patronen:

- Hoofd-/directe chat (per agent): `agent:<agentId>:<mainKey>` (standaard `main`)
- Groep: `agent:<agentId>:<channel>:group:<id>`
- Room/channel (Discord/Slack): `agent:<agentId>:<channel>:channel:<id>` of `...:room:<id>`
- Cron: `cron:<job.id>`
- Webhook: `hook:<uuid>` (tenzij overschreven)

De canonieke regels zijn gedocumenteerd op [/concepts/session](/nl/concepts/session).

---

## Sessie-id's (`sessionId`)

Elke `sessionKey` wijst naar een huidige `sessionId` (het transcriptbestand dat het gesprek voortzet).

Vuistregels:

- **Reset** (`/new`, `/reset`) maakt een nieuwe `sessionId` aan voor die `sessionKey`.
- **Dagelijkse reset** (standaard 4:00 AM lokale tijd op de gateway-host) maakt een nieuwe `sessionId` aan bij het volgende bericht na de resetgrens.
- **Idle-verloop** (`session.reset.idleMinutes` of legacy `session.idleMinutes`) maakt een nieuwe `sessionId` aan wanneer een bericht arriveert na het idle-venster. Wanneer zowel dagelijks als idle zijn geconfigureerd, wint wat het eerst verloopt.
- **Systeemgebeurtenissen** (Heartbeat, cron-wakeups, exec-meldingen, gateway-boekhouding) kunnen de sessierij muteren maar verlengen de versheid voor dagelijkse/idle reset niet. Reset-rollover verwijdert in de wachtrij geplaatste systeemgebeurtenismeldingen voor de vorige sessie voordat de nieuwe prompt wordt opgebouwd.
- **Parent-forkbeleid** gebruikt de actieve branch van PI bij het maken van een thread of subagent-fork. Als die branch te groot is, start OpenClaw het kind met geïsoleerde context in plaats van te falen of onbruikbare geschiedenis te erven. Het groottebeleid is automatisch; legacy `session.parentForkMaxTokens`-config wordt verwijderd door `openclaw doctor --fix`.

Implementatiedetail: de beslissing gebeurt in `initSessionState()` in `src/auto-reply/reply/session.ts`.

---

## Sessiestore-schema (`sessions.json`)

Het waardetype van de store is `SessionEntry` in `src/config/sessions.ts`.

Belangrijke velden (niet uitputtend):

- `sessionId`: huidige transcript-id (bestandsnaam wordt hiervan afgeleid tenzij `sessionFile` is ingesteld)
- `sessionStartedAt`: starttijdstempel voor de huidige `sessionId`; dagelijkse reset
  gebruikt dit voor versheid. Legacy rijen kunnen dit afleiden uit de JSONL-sessieheader.
- `lastInteractionAt`: tijdstempel van de laatste echte gebruiker-/channelinteractie; idle reset
  gebruikt dit voor versheid, zodat Heartbeat-, cron- en exec-gebeurtenissen sessies niet
  levend houden. Legacy rijen zonder dit veld vallen terug op de herstelde sessiestarttijd
  voor idle-versheid.
- `updatedAt`: tijdstempel van de laatste mutatie van de store-rij, gebruikt voor lijsten, snoeien en
  boekhouding. Dit is niet de autoriteit voor versheid van dagelijkse/idle reset.
- `sessionFile`: optionele expliciete overschrijving van transcriptpad
- `chatType`: `direct | group | room` (helpt UI's en send-beleid)
- `provider`, `subject`, `room`, `space`, `displayName`: metadata voor groeps-/channellabeling
- Toggles:
  - `thinkingLevel`, `verboseLevel`, `reasoningLevel`, `elevatedLevel`
  - `sendPolicy` (override per sessie)
- Modelselectie:
  - `providerOverride`, `modelOverride`, `authProfileOverride`
- Tokentellers (best-effort / providerafhankelijk):
  - `inputTokens`, `outputTokens`, `totalTokens`, `contextTokens`
- `compactionCount`: hoe vaak automatische Compaction is voltooid voor deze sessiesleutel
- `memoryFlushAt`: tijdstempel voor de laatste geheugenflush vóór Compaction
- `memoryFlushCompactionCount`: Compaction-telling toen de laatste flush draaide

De store is veilig te bewerken, maar de Gateway is de autoriteit: die kan vermeldingen herschrijven of opnieuw hydrateren terwijl sessies draaien.

---

## Transcriptstructuur (`*.jsonl`)

Transcripten worden beheerd door de `SessionManager` van `@mariozechner/pi-coding-agent`.

Het bestand is JSONL:

- Eerste regel: sessieheader (`type: "session"`, bevat `id`, `cwd`, `timestamp`, optioneel `parentSession`)
- Daarna: sessievermeldingen met `id` + `parentId` (boom)

Opmerkelijke vermeldingstypen:

- `message`: user-/assistant-/toolResult-berichten
- `custom_message`: door extensies geïnjecteerde berichten die _wel_ modelcontext binnengaan (kunnen verborgen zijn voor UI)
- `custom`: extensiestatus die _niet_ modelcontext binnengaat
- `compaction`: persistente Compaction-samenvatting met `firstKeptEntryId` en `tokensBefore`
- `branch_summary`: persistente samenvatting bij het navigeren door een boombranch

OpenClaw “corrigeert” transcripten bewust **niet**; de Gateway gebruikt `SessionManager` om ze te lezen/schrijven.

---

## Contextvensters versus bijgehouden tokens

Twee verschillende concepten zijn belangrijk:

1. **Modelcontextvenster**: harde cap per model (tokens zichtbaar voor het model)
2. **Sessiestore-tellers**: doorlopende statistieken die naar `sessions.json` worden geschreven (gebruikt voor /status en dashboards)

Als je limieten afstemt:

- Het contextvenster komt uit de modelcatalogus (en kan via config worden overschreven).
- `contextTokens` in de store is een runtime-schatting/rapportagewaarde; behandel het niet als een strikte garantie.

Zie voor meer informatie [/token-use](/nl/reference/token-use).

---

## Compaction: wat het is

Compaction vat oudere gesprekken samen in een persistente `compaction`-vermelding in het transcript en houdt recente berichten intact.

Na Compaction zien toekomstige beurten:

- De Compaction-samenvatting
- Berichten na `firstKeptEntryId`

Compaction is **persistent** (in tegenstelling tot sessies snoeien). Zie [/concepts/session-pruning](/nl/concepts/session-pruning).

## Compaction-chunkgrenzen en toolkoppeling

Wanneer OpenClaw een lang transcript opsplitst in Compaction-chunks, houdt het
assistant-toolaanroepen gekoppeld aan hun bijbehorende `toolResult`-vermeldingen.

- Als de token-share-splitsing tussen een toolaanroep en het resultaat ervan terechtkomt, verschuift OpenClaw
  de grens naar het assistant-toolaanroepbericht in plaats van het
  paar te scheiden.
- Als een afsluitend tool-result-blok de chunk anders boven het doel zou duwen,
  behoudt OpenClaw dat pending toolblok en houdt het de niet-samengevatte tail
  intact.
- Afgebroken/foutieve tool-call-blokken houden geen pending splitsing open.

---

## Wanneer automatische Compaction plaatsvindt (Pi-runtime)

In de ingebedde Pi-agent wordt automatische Compaction in twee gevallen geactiveerd:

1. **Herstel bij overflow**: het model retourneert een contextoverflowfout
   (`request_too_large`, `context length exceeded`, `input exceeds the maximum
number of tokens`, `input token count exceeds the maximum number of input
tokens`, `input is too long for the model`, `ollama error: context length
exceeded`, en vergelijkbare providerachtige varianten) → compacteren → opnieuw proberen.
2. **Threshold-onderhoud**: na een geslaagde beurt, wanneer:

`contextTokens > contextWindow - reserveTokens`

Waarbij:

- `contextWindow` het contextvenster van het model is
- `reserveTokens` headroom is die is gereserveerd voor prompts + de volgende modeluitvoer

Dit zijn runtime-semantieken van Pi (OpenClaw gebruikt de events, maar Pi bepaalt wanneer er wordt gecompacteerd).

OpenClaw kan ook een preflight lokale Compaction activeren voordat de volgende
run wordt geopend wanneer `agents.defaults.compaction.maxActiveTranscriptBytes` is ingesteld en het
actieve transcriptbestand die grootte bereikt. Dit is een bestandsgroottebeveiliging voor lokale
heropenkosten, geen ruwe archivering: OpenClaw voert nog steeds normale semantische Compaction uit,
en hiervoor is `truncateAfterCompaction` vereist, zodat de gecompacteerde samenvatting een
nieuw opvolgend transcript kan worden.

Voor embedded Pi-runs voegt `agents.defaults.compaction.midTurnPrecheck.enabled: true`
een optionele tool-loopbeveiliging toe. Nadat een toolresultaat is toegevoegd en vóór de
volgende modelaanroep, schat OpenClaw de promptdruk met dezelfde preflight-
budgetlogica die bij het begin van een beurt wordt gebruikt. Als de context niet meer past,
compacteert de beveiliging niet binnen Pi's `transformContext`-hook. Ze geeft een gestructureerd
mid-turn precheck-signaal, stopt de huidige promptinzending en laat de
buitenste run-loop het bestaande herstelpad gebruiken: te grote toolresultaten
afkappen wanneer dat genoeg is, of de geconfigureerde Compaction-modus activeren en opnieuw proberen. De
optie is standaard uitgeschakeld en werkt met zowel de `default`- als `safeguard`-
Compaction-modi, inclusief provider-backed safeguard-Compaction.
Dit staat los van `maxActiveTranscriptBytes`: de bytegroottebeveiliging draait
voordat een beurt wordt geopend, terwijl mid-turn precheck later in de embedded Pi-tool-
loop draait nadat nieuwe toolresultaten zijn toegevoegd.

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

OpenClaw handhaaft ook een veiligheidsvloer voor embedded runs:

- Als `compaction.reserveTokens < reserveTokensFloor`, verhoogt OpenClaw deze.
- De standaardvloer is `20000` tokens.
- Stel `agents.defaults.compaction.reserveTokensFloor: 0` in om de vloer uit te schakelen.
- Als deze al hoger is, laat OpenClaw hem ongemoeid.
- Handmatige `/compact` respecteert een expliciete `agents.defaults.compaction.keepRecentTokens`
  en behoudt Pi's afkappunt voor de recente staart. Zonder expliciet behoudbudget
  blijft handmatige Compaction een hard checkpoint en begint de opnieuw opgebouwde context bij
  de nieuwe samenvatting.
- Stel `agents.defaults.compaction.midTurnPrecheck.enabled: true` in om de
  optionele tool-loopprecheck uit te voeren na nieuwe toolresultaten en vóór de volgende model-
  aanroep. Dit is alleen een trigger; samenvattingsgeneratie gebruikt nog steeds het geconfigureerde
  Compaction-pad. Het staat los van `maxActiveTranscriptBytes`, dat een
  bytegroottebeveiliging voor actieve transcripties bij het begin van de beurt is.
- Stel `agents.defaults.compaction.maxActiveTranscriptBytes` in op een bytewaarde of
  string zoals `"20mb"` om lokale Compaction uit te voeren vóór een beurt wanneer het actieve
  transcript groot wordt. Deze beveiliging is alleen actief wanneer
  `truncateAfterCompaction` ook is ingeschakeld. Laat deze niet ingesteld of stel `0` in om
  uit te schakelen.
- Wanneer `agents.defaults.compaction.truncateAfterCompaction` is ingeschakeld,
  roteert OpenClaw het actieve transcript naar een gecompacteerde opvolger-JSONL na
  Compaction. Het oude volledige transcript blijft gearchiveerd en gekoppeld vanuit het
  Compaction-checkpoint in plaats van ter plekke te worden herschreven.

Waarom: voldoende headroom overlaten voor multi-turn “huishouding” (zoals memory-writes) voordat Compaction onvermijdelijk wordt.

Implementatie: `ensurePiCompactionReserveTokens()` in `src/agents/pi-settings.ts`
(aangeroepen vanuit `src/agents/pi-embedded-runner.ts`).

---

## Pluggable Compaction-providers

Plugins kunnen een Compaction-provider registreren via `registerCompactionProvider()` op de plugin-API. Wanneer `agents.defaults.compaction.provider` is ingesteld op een geregistreerde provider-id, delegeert de safeguard-extensie samenvatting aan die provider in plaats van aan de ingebouwde `summarizeInStages`-pipeline.

- `provider`: id van een geregistreerde Compaction-provider-plugin. Laat niet ingesteld voor standaard LLM-samenvatting.
- Het instellen van een `provider` forceert `mode: "safeguard"`.
- Providers ontvangen dezelfde Compaction-instructies en hetzelfde beleid voor behoud van identifiers als het ingebouwde pad.
- De safeguard behoudt nog steeds recente-beurt- en split-turn-suffixcontext na provideruitvoer.
- Ingebouwde safeguard-samenvatting distilleert eerdere samenvattingen opnieuw met nieuwe berichten
  in plaats van de volledige vorige samenvatting letterlijk te behouden.
- Safeguard-modus schakelt kwaliteitsaudits van samenvattingen standaard in; stel
  `qualityGuard.enabled: false` in om gedrag voor opnieuw proberen bij misvormde uitvoer over te slaan.
- Als de provider faalt of een leeg resultaat retourneert, valt OpenClaw automatisch terug op ingebouwde LLM-samenvatting.
- Abort-/timeoutsignalen worden opnieuw gegooid (niet ingeslikt) om annulering door de aanroeper te respecteren.

Bron: `src/plugins/compaction-provider.ts`, `src/agents/pi-hooks/compaction-safeguard.ts`.

---

## Voor gebruikers zichtbare oppervlakken

Je kunt Compaction en sessiestatus observeren via:

- `/status` (in elke chatsessie)
- `openclaw status` (CLI)
- `openclaw sessions` / `sessions --json`
- Uitgebreide modus: `🧹 Auto-compaction complete` + Compaction-aantal

---

## Stille huishouding (`NO_REPLY`)

OpenClaw ondersteunt “stille” beurten voor achtergrondtaken waarbij de gebruiker geen tussentijdse uitvoer zou moeten zien.

Conventie:

- De assistant begint zijn uitvoer met de exacte stille token `NO_REPLY` /
  `no_reply` om aan te geven “geen antwoord aan de gebruiker afleveren”.
- OpenClaw verwijdert/onderdrukt dit in de afleverlaag.
- Exacte onderdrukking van stille tokens is hoofdletterongevoelig, dus `NO_REPLY` en
  `no_reply` tellen allebei wanneer de hele payload alleen de stille token is.
- Dit is alleen voor echte achtergrond-/geen-afleveringbeurten; het is geen snelkoppeling voor
  gewone uitvoerbare gebruikersverzoeken.

Vanaf `2026.1.10` onderdrukt OpenClaw ook **draft-/typing-streaming** wanneer een
gedeeltelijke chunk begint met `NO_REPLY`, zodat stille operaties geen gedeeltelijke
uitvoer midden in de beurt lekken.

---

## Pre-Compaction "memory flush" (geïmplementeerd)

Doel: voordat auto-Compaction plaatsvindt, een stille agentische beurt draaien die duurzame
state naar schijf schrijft (bijv. `memory/YYYY-MM-DD.md` in de agent-workspace), zodat Compaction
kritieke context niet kan wissen.

OpenClaw gebruikt de **pre-threshold flush**-aanpak:

1. Monitor het sessiecontextgebruik.
2. Wanneer dit een “soft threshold” overschrijdt (onder Pi's Compaction-threshold), draai een stille
   “schrijf memory nu”-instructie naar de agent.
3. Gebruik de exacte stille token `NO_REPLY` / `no_reply` zodat de gebruiker
   niets ziet.

Config (`agents.defaults.compaction.memoryFlush`):

- `enabled` (standaard: `true`)
- `model` (optionele exacte provider-/modeloverride voor de flush-beurt, bijvoorbeeld `ollama/qwen3:8b`)
- `softThresholdTokens` (standaard: `4000`)
- `prompt` (gebruikersbericht voor de flush-beurt)
- `systemPrompt` (extra systeemprompt toegevoegd voor de flush-beurt)

Opmerkingen:

- De standaardprompt/systeemprompt bevatten een `NO_REPLY`-hint om
  aflevering te onderdrukken.
- Wanneer `model` is ingesteld, gebruikt de flush-beurt dat model zonder de
  fallback-keten van de actieve sessie te erven, zodat lokale huishouding niet stilletjes
  terugvalt naar een betaald gespreksmodel.
- De flush draait één keer per Compaction-cyclus (bijgehouden in `sessions.json`).
- De flush draait alleen voor embedded Pi-sessies (CLI-backends slaan deze over).
- De flush wordt overgeslagen wanneer de sessieworkspace read-only is (`workspaceAccess: "ro"` of `"none"`).
- Zie [Memory](/nl/concepts/memory) voor de workspacebestandsindeling en schrijfpatronen.

Pi stelt ook een `session_before_compact`-hook beschikbaar in de extensie-API, maar OpenClaw's
flushlogica staat vandaag aan de Gateway-kant.

---

## Probleemoplossingschecklist

- Sessiesleutel verkeerd? Begin met [/concepts/session](/nl/concepts/session) en bevestig de `sessionKey` in `/status`.
- Mismatch tussen store en transcript? Bevestig de Gateway-host en het store-pad vanuit `openclaw status`.
- Compaction-spam? Controleer:
  - contextvenster van het model (te klein)
  - Compaction-instellingen (`reserveTokens` te hoog voor het modelvenster kan eerdere Compaction veroorzaken)
  - toolresultaat-bloat: schakel sessiepruning in/stem deze af
- Lekken stille beurten? Bevestig dat het antwoord begint met `NO_REPLY` (hoofdletterongevoelige exacte token) en dat je een build gebruikt die de fix voor streamingonderdrukking bevat.

## Gerelateerd

- [Sessiebeheer](/nl/concepts/session)
- [Sessiepruning](/nl/concepts/session-pruning)
- [Context-engine](/nl/concepts/context-engine)
