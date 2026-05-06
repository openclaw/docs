---
read_when:
    - Je moet sessie-id's, transcript-JSONL of sessions.json-velden debuggen
    - Je wijzigt het gedrag voor automatische Compaction of voegt opschoning vóór Compaction toe
    - Je wilt geheugenflushes of stille systeembeurten implementeren
summary: 'Diepgaande verkenning: sessieopslag + transcripten, levenscyclus en interne werking van (auto)Compaction'
title: Diepgaande bespreking van sessiebeheer
x-i18n:
    generated_at: "2026-05-06T09:31:47Z"
    model: gpt-5.5
    provider: openai
    source_hash: 3ade29b83c2b3857c52e56275ed11c5b1f3cd07050ba9f35ea49ad427efcc39d
    source_path: reference/session-management-compaction.md
    workflow: 16
---

OpenClaw beheert sessies end-to-end in deze gebieden:

- **Sessieroutering** (hoe inkomende berichten naar een `sessionKey` worden toegewezen)
- **Sessiestore** (`sessions.json`) en wat die bijhoudt
- **Transcriptpersistentie** (`*.jsonl`) en de structuur ervan
- **Transcripthygiëne** (providerspecifieke correcties vóór runs)
- **Contextlimieten** (contextvenster versus bijgehouden tokens)
- **Compaction** (handmatige en automatische Compaction) en waar je pre-Compaction-werk kunt inhaken
- **Stil onderhoud** (geheugenschrijfacties die geen voor gebruikers zichtbare uitvoer mogen opleveren)

Als je eerst een overzicht op hoger niveau wilt, begin dan met:

- [Sessiebeheer](/nl/concepts/session)
- [Compaction](/nl/concepts/compaction)
- [Geheugenoverzicht](/nl/concepts/memory)
- [Geheugen zoeken](/nl/concepts/memory-search)
- [Sessies opschonen](/nl/concepts/session-pruning)
- [Transcripthygiëne](/nl/reference/transcript-hygiene)

---

## Bron van waarheid: de Gateway

OpenClaw is ontworpen rond één **Gateway-proces** dat eigenaar is van sessiestatus.

- UI's (macOS-app, web-Control-UI, TUI) moeten de Gateway raadplegen voor sessielijsten en tokenaantallen.
- In externe modus staan sessiebestanden op de externe host; "je lokale Mac-bestanden controleren" geeft niet weer wat de Gateway gebruikt.

---

## Twee persistentielagen

OpenClaw bewaart sessies in twee lagen:

1. **Sessiestore (`sessions.json`)**
   - Key/value-map: `sessionKey -> SessionEntry`
   - Klein, mutabel, veilig om te bewerken (of vermeldingen te verwijderen)
   - Houdt sessiemetadata bij (huidige sessie-id, laatste activiteit, toggles, tokentellers, enz.)

2. **Transcript (`<sessionId>.jsonl`)**
   - Append-only transcript met boomstructuur (vermeldingen hebben `id` + `parentId`)
   - Slaat het daadwerkelijke gesprek + toolaanroepen + Compaction-samenvattingen op
   - Wordt gebruikt om de modelcontext voor toekomstige beurten opnieuw op te bouwen
   - Grote debug-checkpoints vóór Compaction worden overgeslagen zodra het actieve
     transcript de maximale checkpointgrootte overschrijdt, zodat een tweede enorme
     `.checkpoint.*.jsonl`-kopie wordt vermeden.

Gateway-geschiedenislezers moeten vermijden het hele transcript te materialiseren, tenzij
het oppervlak expliciet willekeurige historische toegang nodig heeft. Geschiedenis van de
eerste pagina, ingesloten chatgeschiedenis, herstel na herstart en token-/gebruikscontroles gebruiken begrensde tail-reads. Volledige transcript-scans lopen via de asynchrone transcriptindex, die wordt
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

Sessiepersistentie heeft automatische onderhoudscontroles (`session.maintenance`) voor `sessions.json`, transcriptartefacten en trajectorie-sidecars:

- `mode`: `warn` (standaard) of `enforce`
- `pruneAfter`: leeftijdsgrens voor verouderde vermeldingen (standaard `30d`)
- `maxEntries`: maximumaantal vermeldingen in `sessions.json` (standaard `500`)
- `resetArchiveRetention`: bewaartermijn voor `*.reset.<timestamp>`-transcriptarchieven (standaard: hetzelfde als `pruneAfter`; `false` schakelt opschonen uit)
- `maxDiskBytes`: optioneel budget voor de sessiemap
- `highWaterBytes`: optioneel doel na opschoning (standaard `80%` van `maxDiskBytes`)

Normale Gateway-schrijfacties lopen via een sessieschrijver per store die mutaties binnen het proces serialiseert zonder een runtime-bestandslock te nemen. Hot-path patch-helpers lenen de gevalideerde mutabele cache terwijl ze dat writer-slot vasthouden, zodat grote `sessions.json`-bestanden niet voor elke metadata-update worden gekloond of opnieuw gelezen. Runtimecode moet bij voorkeur `updateSessionStore(...)` of `updateSessionStoreEntry(...)` gebruiken; directe whole-store-saves zijn compatibiliteits- en offline-onderhoudstools. Wanneer een Gateway bereikbaar is, delegeren niet-dry-run `openclaw sessions cleanup` en `openclaw agents delete` store-mutaties aan de Gateway zodat opschoning in dezelfde schrijfwachtrij terechtkomt; `--store <path>` is het expliciete offline herstelpad voor direct bestandsonderhoud. `maxEntries`-opschoning wordt nog steeds in batches uitgevoerd voor productieformaatlimieten, dus een store kan kortstondig de geconfigureerde limiet overschrijden voordat de volgende high-water-opschoning die weer terugschrijft. Sessiestore-reads snoeien of limiteren geen vermeldingen tijdens Gateway-start; gebruik schrijfacties of `openclaw sessions cleanup --enforce` voor opschoning. `openclaw sessions cleanup --enforce` past de geconfigureerde limiet nog steeds direct toe en snoeit oude transcript-, checkpoint- en trajectorieartefacten zonder referentie, zelfs wanneer er geen schijfbudget is geconfigureerd.

Onderhoud behoudt duurzame externe gesprekspointers zoals groepssessies
en chat-sessies met thread-scope, maar synthetische runtimevermeldingen voor Cron, hooks,
Heartbeat, ACP en sub-agents kunnen nog steeds worden verwijderd wanneer ze de
geconfigureerde leeftijd, telling of schijfbudget overschrijden.

OpenClaw maakt niet langer automatische `sessions.json.bak.*`-rotatieback-ups tijdens Gateway-schrijfacties. De verouderde sleutel `session.maintenance.rotateBytes` wordt genegeerd en `openclaw doctor --fix` verwijdert die uit oudere configuraties.

Transcriptmutaties gebruiken een sessieschrijflock op het transcriptbestand. Lockverwerving wacht maximaal
`session.writeLock.acquireTimeoutMs` voordat een busy-session-fout wordt weergegeven; de standaard is `60000`
ms. Verhoog dit alleen wanneer legitieme voorbereiding, opschoning, Compaction of transcriptspiegelwerk
langer concurreert op trage machines. Detectie van stale locks en waarschuwingen voor maximale vasthoudtijd blijven afzonderlijke beleidsregels.

Handhavingsvolgorde voor opschoning van schijfbudget (`mode: "enforce"`):

1. Verwijder eerst de oudste gearchiveerde, orphan transcript- of orphan trajectorieartefacten.
2. Als het gebruik nog steeds boven het doel ligt, verwijder dan de oudste sessievermeldingen en hun transcript-/trajectoriebestanden.
3. Ga door totdat het gebruik op of onder `highWaterBytes` ligt.

In `mode: "warn"` rapporteert OpenClaw mogelijke verwijderingen, maar muteert de store/bestanden niet.

Voer onderhoud op aanvraag uit:

```bash
openclaw sessions cleanup --dry-run
openclaw sessions cleanup --enforce
```

---

## Cron-sessies en run-logs

Geïsoleerde Cron-runs maken ook sessievermeldingen/transcripten aan en hebben eigen bewaartermijncontroles:

- `cron.sessionRetention` (standaard `24h`) snoeit oude geïsoleerde Cron-run-sessies uit de sessiestore (`false` schakelt dit uit).
- `cron.runLog.maxBytes` + `cron.runLog.keepLines` snoeien `~/.openclaw/cron/runs/<jobId>.jsonl`-bestanden (standaarden: `2_000_000` bytes en `2000` regels).

Wanneer Cron geforceerd een nieuwe geïsoleerde run-sessie aanmaakt, schoont het de vorige
`cron:<jobId>`-sessievermelding op voordat de nieuwe rij wordt geschreven. Het neemt veilige
voorkeuren mee, zoals instellingen voor denken/snel/uitgebreid, labels en expliciete
door de gebruiker geselecteerde model-/auth-overrides. Het laat omgevingsgesprekscontext vallen, zoals
kanaal-/groepsroutering, verzend- of wachtrijbeleid, verhoging, oorsprong en ACP-
runtimebinding, zodat een nieuwe geïsoleerde run geen verouderde delivery- of
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

- **Reset** (`/new`, `/reset`) maakt een nieuwe `sessionId` aan voor die `sessionKey`.
- **Dagelijkse reset** (standaard 4:00 lokale tijd op de gateway-host) maakt een nieuwe `sessionId` aan bij het volgende bericht na de resetgrens.
- **Idle-verloop** (`session.reset.idleMinutes` of legacy `session.idleMinutes`) maakt een nieuwe `sessionId` aan wanneer er een bericht binnenkomt na het idle-venster. Wanneer dagelijkse reset + idle allebei zijn geconfigureerd, wint degene die het eerst verloopt.
- **Systeemgebeurtenissen** (Heartbeat, Cron wakeups, exec-meldingen, Gateway-boekhouding) kunnen de sessierij muteren, maar verlengen de versheid voor dagelijkse/idle reset niet. Reset-rollover verwijdert in de wachtrij geplaatste systeemgebeurtenismeldingen voor de vorige sessie voordat de nieuwe prompt wordt opgebouwd.
- **Parent-forkbeleid** gebruikt Pi's actieve vertakking bij het maken van een thread- of subagent-fork. Als die vertakking te groot is, start OpenClaw het child met geïsoleerde context in plaats van te falen of onbruikbare geschiedenis te erven. Het omvangbeleid is automatisch; legacy `session.parentForkMaxTokens`-configuratie wordt verwijderd door `openclaw doctor --fix`.

Implementatiedetail: de beslissing vindt plaats in `initSessionState()` in `src/auto-reply/reply/session.ts`.

---

## Sessiestore-schema (`sessions.json`)

Het waardetype van de store is `SessionEntry` in `src/config/sessions.ts`.

Belangrijke velden (niet uitputtend):

- `sessionId`: huidige transcript-id (bestandsnaam wordt hiervan afgeleid tenzij `sessionFile` is ingesteld)
- `sessionStartedAt`: starttijdstempel voor de huidige `sessionId`; dagelijkse reset-
  versheid gebruikt dit. Legacy rijen kunnen dit afleiden uit de JSONL-sessieheader.
- `lastInteractionAt`: tijdstempel van de laatste echte gebruiker-/kanaalinteractie; idle reset-
  versheid gebruikt dit zodat Heartbeat-, Cron- en exec-gebeurtenissen sessies niet
  levend houden. Legacy rijen zonder dit veld vallen terug op de herstelde sessiestart-
  tijd voor idle-versheid.
- `updatedAt`: tijdstempel van de laatste mutatie van de store-rij, gebruikt voor lijsten, snoeien en
  boekhouding. Het is niet de autoriteit voor dagelijkse/idle reset-versheid.
- `sessionFile`: optionele expliciete transcriptpad-override
- `chatType`: `direct | group | room` (helpt UI's en verzendbeleid)
- `provider`, `subject`, `room`, `space`, `displayName`: metadata voor groeps-/kanaallabeling
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
- `custom_message`: door extensie geïnjecteerde berichten die _wel_ modelcontext binnengaan (kunnen verborgen zijn voor UI)
- `custom`: extensiestatus die _niet_ modelcontext binnengaat
- `compaction`: bewaarde Compaction-samenvatting met `firstKeptEntryId` en `tokensBefore`
- `branch_summary`: bewaarde samenvatting bij navigeren door een boomtak

OpenClaw "corrigeert" transcripten bewust **niet**; de Gateway gebruikt `SessionManager` om ze te lezen/schrijven.

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

Compaction vat oudere gesprekken samen in een bewaarde `compaction`-vermelding in het transcript en houdt recente berichten intact.

Na Compaction zien toekomstige beurten:

- De Compaction-samenvatting
- Berichten na `firstKeptEntryId`

Compaction is **persistent** (in tegenstelling tot sessie-opschoning). Zie [/concepts/session-pruning](/nl/concepts/session-pruning).

## Chunkgrenzen voor Compaction en tool-koppeling

Wanneer OpenClaw een lang transcript opsplitst in Compaction-chunks, houdt het
tool-aanroepen van de assistant gekoppeld aan hun bijbehorende `toolResult`-vermeldingen.

- Als de splitsing op tokenaandeel tussen een tool-aanroep en het resultaat daarvan valt, verschuift OpenClaw
  de grens naar het bericht met de tool-aanroep van de assistant in plaats van
  het paar te scheiden.
- Als een afsluitend tool-resultaatblok de chunk anders over het doel heen zou duwen,
  behoudt OpenClaw dat wachtende tool-blok en houdt het de niet-samengevatte staart
  intact.
- Afgebroken tool-aanroepblokken of tool-aanroepblokken met fouten houden geen wachtende splitsing open.

---

## Wanneer automatische Compaction plaatsvindt (Pi-runtime)

In de ingebedde Pi-agent wordt automatische Compaction in twee gevallen geactiveerd:

1. **Herstel bij overloop**: het model retourneert een contextoverloopfout
   (`request_too_large`, `context length exceeded`, `input exceeds the maximum
number of tokens`, `input token count exceeds the maximum number of input
tokens`, `input is too long for the model`, `ollama error: context length
exceeded`, en vergelijkbare varianten in provider-vorm) → comprimeer → probeer opnieuw.
2. **Drempelonderhoud**: na een succesvolle beurt, wanneer:

`contextTokens > contextWindow - reserveTokens`

Waarbij:

- `contextWindow` het contextvenster van het model is
- `reserveTokens` de ruimte is die is gereserveerd voor prompts + de volgende modeluitvoer

Dit zijn Pi-runtime-semantieken (OpenClaw verbruikt de gebeurtenissen, maar Pi bepaalt wanneer er wordt gecomprimeerd).

OpenClaw kan ook een lokale preflight-Compaction activeren voordat de volgende
run wordt geopend wanneer `agents.defaults.compaction.maxActiveTranscriptBytes` is ingesteld en het
actieve transcriptbestand die grootte bereikt. Dit is een bestandsgroottebeveiliging voor lokale
heropeningskosten, geen ruwe archivering: OpenClaw voert nog steeds normale semantische Compaction uit,
en vereist `truncateAfterCompaction` zodat de gecomprimeerde samenvatting een
nieuw opvolgend transcript kan worden.

Voor ingebedde Pi-runs voegt `agents.defaults.compaction.midTurnPrecheck.enabled: true`
een optionele tool-loopbeveiliging toe. Nadat een tool-resultaat is toegevoegd en vóór de
volgende modelaanroep, schat OpenClaw de promptdruk in met dezelfde preflight-
budgetlogica die aan het begin van een beurt wordt gebruikt. Als de context niet meer past, comprimeert de beveiliging
niet binnen Pi's `transformContext`-hook. Deze geeft een gestructureerd
mid-turn-prechecksignaal, stopt de huidige promptindiening en laat de
buitenste run-loop het bestaande herstelpad gebruiken: oversized tool-resultaten afkappen
wanneer dat genoeg is, of de geconfigureerde Compaction-modus activeren en opnieuw proberen. De
optie is standaard uitgeschakeld en werkt met zowel `default`- als `safeguard`-
Compaction-modi, inclusief provider-ondersteunde safeguard-Compaction.
Dit staat los van `maxActiveTranscriptBytes`: de bytegroottebeveiliging draait
voordat een beurt wordt geopend, terwijl mid-turn precheck later in de ingebedde Pi-tool-loop draait
nadat nieuwe tool-resultaten zijn toegevoegd.

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

OpenClaw dwingt ook een veiligheidsminimum af voor ingebedde runs:

- Als `compaction.reserveTokens < reserveTokensFloor`, verhoogt OpenClaw dit.
- Het standaardminimum is `20000` tokens.
- Stel `agents.defaults.compaction.reserveTokensFloor: 0` in om het minimum uit te schakelen.
- Als het al hoger is, laat OpenClaw het ongemoeid.
- Handmatige `/compact` respecteert een expliciete `agents.defaults.compaction.keepRecentTokens`
  en behoudt Pi's afkappunt voor de recente staart. Zonder expliciet bewaarbuffet
  blijft handmatige Compaction een harde checkpoint en begint heropgebouwde context vanaf
  de nieuwe samenvatting.
- Stel `agents.defaults.compaction.midTurnPrecheck.enabled: true` in om de
  optionele tool-loopprecheck uit te voeren na nieuwe tool-resultaten en vóór de volgende model-
  aanroep. Dit is alleen een trigger; het genereren van de samenvatting gebruikt nog steeds het geconfigureerde
  Compaction-pad. Het staat los van `maxActiveTranscriptBytes`, wat een
  bytegroottebeveiliging voor het actieve transcript aan het begin van een beurt is.
- Stel `agents.defaults.compaction.maxActiveTranscriptBytes` in op een bytewaarde of
  tekenreeks zoals `"20mb"` om lokale Compaction vóór een beurt uit te voeren wanneer het actieve
  transcript groot wordt. Deze beveiliging is alleen actief wanneer
  `truncateAfterCompaction` ook is ingeschakeld. Laat dit oningesteld of stel `0` in om
  uit te schakelen.
- Wanneer `agents.defaults.compaction.truncateAfterCompaction` is ingeschakeld,
  roteert OpenClaw het actieve transcript na Compaction naar een gecomprimeerde opvolger-JSONL.
  Het oude volledige transcript blijft gearchiveerd en gekoppeld vanaf de
  Compaction-checkpoint in plaats van ter plekke te worden herschreven.

Waarom: genoeg ruimte overhouden voor "huishoudelijke" taken over meerdere beurten (zoals geheugenschrijfbewerkingen) voordat Compaction onvermijdelijk wordt.

Implementatie: `ensurePiCompactionReserveTokens()` in `src/agents/pi-settings.ts`
(aangeroepen vanuit `src/agents/pi-embedded-runner.ts`).

---

## Inplugbare Compaction-providers

Plugins kunnen een Compaction-provider registreren via `registerCompactionProvider()` op de Plugin-API. Wanneer `agents.defaults.compaction.provider` is ingesteld op een geregistreerde provider-id, delegeert de safeguard-Plugin samenvatting aan die provider in plaats van aan de ingebouwde `summarizeInStages`-pipeline.

- `provider`: id van een geregistreerde Compaction-provider-Plugin. Laat oningesteld voor standaard LLM-samenvatting.
- Het instellen van een `provider` forceert `mode: "safeguard"`.
- Providers ontvangen dezelfde Compaction-instructies en hetzelfde beleid voor behoud van identifiers als het ingebouwde pad.
- De safeguard behoudt nog steeds context uit recente beurten en split-turnsuffix na provideruitvoer.
- Ingebouwde safeguard-samenvatting distilleert eerdere samenvattingen opnieuw met nieuwe berichten
  in plaats van de volledige vorige samenvatting letterlijk te behouden.
- Safeguard-modus schakelt standaard audits van samenvattingskwaliteit in; stel
  `qualityGuard.enabled: false` in om gedrag voor opnieuw proberen bij verkeerd gevormde uitvoer over te slaan.
- Als de provider faalt of een leeg resultaat retourneert, valt OpenClaw automatisch terug op ingebouwde LLM-samenvatting.
- Afbreek-/timeoutsignalen worden opnieuw gegooid (niet opgeslokt) om annulering door de aanroeper te respecteren.

Bron: `src/plugins/compaction-provider.ts`, `src/agents/pi-hooks/compaction-safeguard.ts`.

---

## Voor gebruikers zichtbare oppervlakken

Je kunt Compaction en sessiestatus observeren via:

- `/status` (in elke chatsessie)
- `openclaw status` (CLI)
- `openclaw sessions` / `sessions --json`
- Uitgebreide modus: `🧹 Auto-compaction complete` + Compaction-aantal

---

## Stil onderhoud (`NO_REPLY`)

OpenClaw ondersteunt "stille" beurten voor achtergrondtaken waarbij de gebruiker geen tussentijdse uitvoer mag zien.

Conventie:

- De assistant begint de uitvoer met het exacte stille token `NO_REPLY` /
  `no_reply` om aan te geven: "lever geen antwoord aan de gebruiker".
- OpenClaw verwijdert/onderdrukt dit in de afleverlaag.
- Exacte onderdrukking van het stille token is hoofdletterongevoelig, dus `NO_REPLY` en
  `no_reply` tellen allebei wanneer de volledige payload alleen uit het stille token bestaat.
- Dit is alleen bedoeld voor echte achtergrondbeurten/geen-aflevering; het is geen snelkoppeling voor
  gewone uitvoerbare gebruikersverzoeken.

Vanaf `2026.1.10` onderdrukt OpenClaw ook **concept-/typestreaming** wanneer een
gedeeltelijke chunk begint met `NO_REPLY`, zodat stille bewerkingen geen gedeeltelijke
uitvoer halverwege de beurt lekken.

---

## "Geheugenflush" vóór Compaction (geïmplementeerd)

Doel: voordat automatische Compaction plaatsvindt, een stille agentic beurt uitvoeren die duurzame
status naar schijf schrijft (bijv. `memory/YYYY-MM-DD.md` in de agent-werkruimte), zodat Compaction geen
kritieke context kan wissen.

OpenClaw gebruikt de aanpak met **pre-drempelflush**:

1. Monitor het contextgebruik van de sessie.
2. Wanneer dit een "zachte drempel" overschrijdt (onder Pi's Compaction-drempel), voer een stille
   instructie "schrijf geheugen nu" uit voor de agent.
3. Gebruik het exacte stille token `NO_REPLY` / `no_reply` zodat de gebruiker
   niets ziet.

Configuratie (`agents.defaults.compaction.memoryFlush`):

- `enabled` (standaard: `true`)
- `model` (optionele exacte provider-/model-override voor de flush-beurt, bijvoorbeeld `ollama/qwen3:8b`)
- `softThresholdTokens` (standaard: `4000`)
- `prompt` (gebruikersbericht voor de flush-beurt)
- `systemPrompt` (extra systeemprompt toegevoegd voor de flush-beurt)

Opmerkingen:

- De standaardprompt/systeemprompt bevatten een `NO_REPLY`-hint om
  aflevering te onderdrukken.
- Wanneer `model` is ingesteld, gebruikt de flush-beurt dat model zonder de
  fallbackketen van de actieve sessie te erven, zodat lokaal onderhoud niet stilzwijgend
  terugvalt op een betaald gespreksmodel.
- De flush draait eenmaal per Compaction-cyclus (bijgehouden in `sessions.json`).
- De flush draait alleen voor ingebedde Pi-sessies (CLI-backends slaan deze over).
- De flush wordt overgeslagen wanneer de sessiewerkruimte alleen-lezen is (`workspaceAccess: "ro"` of `"none"`).
- Zie [Geheugen](/nl/concepts/memory) voor de bestandsindeling en schrijfpatronen van de werkruimte.

Pi stelt ook een `session_before_compact`-hook beschikbaar in de Plugin-API, maar OpenClaw's
flushlogica leeft vandaag aan de Gateway-kant.

---

## Checklist voor probleemoplossing

- Verkeerde sessiesleutel? Begin met [/concepts/session](/nl/concepts/session) en bevestig de `sessionKey` in `/status`.
- Mismatch tussen store en transcript? Bevestig de Gateway-host en het store-pad vanuit `openclaw status`.
- Compaction-spam? Controleer:
  - contextvenster van het model (te klein)
  - Compaction-instellingen (`reserveTokens` te hoog voor het modelvenster kan eerdere Compaction veroorzaken)
  - opgeblazen tool-resultaten: schakel sessie-opschoning in/stem deze af
- Lekken stille beurten? Bevestig dat het antwoord begint met `NO_REPLY` (hoofdletterongevoelig exact token) en dat je een build gebruikt die de oplossing voor streamingonderdrukking bevat.

## Gerelateerd

- [Sessiebeheer](/nl/concepts/session)
- [Sessie-opschoning](/nl/concepts/session-pruning)
- [Context-engine](/nl/concepts/context-engine)
