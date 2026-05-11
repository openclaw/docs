---
read_when:
    - Je moet sessie-ID's, transcript-JSONL of sessions.json-velden debuggen
    - Je wijzigt het gedrag voor automatische Compaction of voegt "pre-Compaction"-opschoning toe
    - Je wilt geheugenflushes of stille systeembeurten implementeren
summary: 'Diepgaande uitleg: sessieopslag + transcripten, levenscyclus en interne werking van (automatische) Compaction'
title: Diepgaande uitleg over sessiebeheer
x-i18n:
    generated_at: "2026-05-11T20:49:29Z"
    model: gpt-5.5
    provider: openai
    source_hash: 4ed30f6b1943b2ed5808c5ccdd593e6899e10fb7f75ff5911e6a9623a30ed6be
    source_path: reference/session-management-compaction.md
    workflow: 16
---

OpenClaw beheert sessies end-to-end in deze gebieden:

- **Sessierouting** (hoe inkomende berichten aan een `sessionKey` worden gekoppeld)
- **Sessieopslag** (`sessions.json`) en wat deze bijhoudt
- **Transcript-persistentie** (`*.jsonl`) en de structuur ervan
- **Transcript-hygiëne** (providerspecifieke correcties vóór runs)
- **Contextlimieten** (contextvenster versus bijgehouden tokens)
- **Compaction** (handmatige en automatische compaction) en waar pre-compaction-werk kan worden gekoppeld
- **Stille huishouding** (geheugenschrijfacties die geen voor gebruikers zichtbare uitvoer mogen produceren)

Als je eerst een overzicht op hoger niveau wilt, begin dan met:

- [Sessiebeheer](/nl/concepts/session)
- [Compaction](/nl/concepts/compaction)
- [Geheugenoverzicht](/nl/concepts/memory)
- [Geheugen zoeken](/nl/concepts/memory-search)
- [Sessies opschonen](/nl/concepts/session-pruning)
- [Transcript-hygiëne](/nl/reference/transcript-hygiene)

---

## Bron van waarheid: de Gateway

OpenClaw is ontworpen rond één **Gateway-proces** dat eigenaar is van de sessiestatus.

- UI's (macOS-app, web Control UI, TUI) moeten de Gateway bevragen voor sessielijsten en tokenaantallen.
- In externe modus staan sessiebestanden op de externe host; "je lokale Mac-bestanden controleren" weerspiegelt niet wat de Gateway gebruikt.

---

## Twee persistentielagen

OpenClaw bewaart sessies in twee lagen:

1. **Sessieopslag (`sessions.json`)**
   - Key/value-map: `sessionKey -> SessionEntry`
   - Klein, muteerbaar, veilig te bewerken (of entries te verwijderen)
   - Houdt sessiemetadata bij (huidige sessie-id, laatste activiteit, schakelaars, tokentellers, enz.)

2. **Transcript (`<sessionId>.jsonl`)**
   - Append-only transcript met boomstructuur (entries hebben `id` + `parentId`)
   - Slaat het daadwerkelijke gesprek + tool-calls + compaction-samenvattingen op
   - Wordt gebruikt om de modelcontext voor toekomstige beurten opnieuw op te bouwen
   - Grote pre-compaction-debugcheckpoints worden overgeslagen zodra het actieve
     transcript de groottelimiet voor checkpoints overschrijdt, zodat een tweede enorme
     `.checkpoint.*.jsonl`-kopie wordt vermeden.

Gateway-geschiedenislezers moeten vermijden het hele transcript te materialiseren, tenzij
het oppervlak expliciet willekeurige toegang tot historische data nodig heeft. Geschiedenis
van de eerste pagina, ingesloten chatgeschiedenis, herstel na herstart en token-/gebruikscontroles gebruiken begrensde tail-reads.
Volledige transcript-scans lopen via de asynchrone transcriptindex, die wordt
gecached op bestandspad plus `mtimeMs`/`size` en wordt gedeeld tussen gelijktijdige lezers.

---

## Locaties op schijf

Per agent, op de Gateway-host:

- Opslag: `~/.openclaw/agents/<agentId>/sessions/sessions.json`
- Transcripts: `~/.openclaw/agents/<agentId>/sessions/<sessionId>.jsonl`
  - Telegram-onderwerpsessies: `.../<sessionId>-topic-<threadId>.jsonl`

OpenClaw resolveert deze via `src/config/sessions.ts`.

---

## Onderhoud van opslag en schijfcontroles

Sessiepersistentie heeft automatische onderhoudscontroles (`session.maintenance`) voor `sessions.json`, transcriptartefacten en trajectory-sidecars:

- `mode`: `warn` (standaard) of `enforce`
- `pruneAfter`: leeftijdsgrens voor verouderde entries (standaard `30d`)
- `maxEntries`: maximumaantal entries in `sessions.json` (standaard `500`)
- `resetArchiveRetention`: retentie voor `*.reset.<timestamp>`-transcriptarchieven (standaard: hetzelfde als `pruneAfter`; `false` schakelt opschoning uit)
- `maxDiskBytes`: optioneel budget voor de sessiemap
- `highWaterBytes`: optioneel doel na opschoning (standaard `80%` van `maxDiskBytes`)

Normale Gateway-schrijfacties lopen via een sessieschrijver per opslag die mutaties binnen het proces serialiseert zonder een runtime-bestandslock te nemen. Hot-path patch-helpers lenen de gevalideerde muteerbare cache terwijl ze die schrijverslot vasthouden, zodat grote `sessions.json`-bestanden niet voor elke metadata-update worden gekloond of opnieuw gelezen. Runtimecode moet de voorkeur geven aan `updateSessionStore(...)` of `updateSessionStoreEntry(...)`; directe saves van de hele opslag zijn compatibiliteits- en offline-onderhoudstools. Wanneer een Gateway bereikbaar is, delegeren niet-dry-run `openclaw sessions cleanup` en `openclaw agents delete` opslagmutaties aan de Gateway, zodat opschoning in dezelfde schrijfwachtrij komt; `--store <path>` is het expliciete offline reparatiepad voor direct bestandsonderhoud. `maxEntries`-opschoning wordt nog steeds gebatcht voor productiecaps, dus een opslag kan kort boven de geconfigureerde cap uitkomen voordat de volgende high-water-opschoning deze weer terugschrijft. Lezen uit de sessieopslag prune't of capped geen entries tijdens het opstarten van de Gateway; gebruik schrijfacties of `openclaw sessions cleanup --enforce` voor opschoning. `openclaw sessions cleanup --enforce` past de geconfigureerde cap nog steeds onmiddellijk toe en prune't oude, niet-gerefereerde transcript-, checkpoint- en trajectory-artefacten, zelfs wanneer er geen schijfbudget is geconfigureerd.

Onderhoud bewaart duurzame externe gesprekspointers zoals groepssessies
en thread-scoped chatsessies, maar synthetische runtime-entries voor cron, hooks,
Heartbeat, ACP en sub-agents kunnen nog steeds worden verwijderd wanneer ze de
geconfigureerde leeftijd, telling of schijfbudget overschrijden.

OpenClaw maakt niet langer automatische `sessions.json.bak.*`-rotatieback-ups tijdens Gateway-schrijfacties. De legacy sleutel `session.maintenance.rotateBytes` wordt genegeerd en `openclaw doctor --fix` verwijdert deze uit oudere configuraties.

Transcriptmutaties gebruiken een sessieschrijflock op het transcriptbestand. Lock-acquisitie wacht maximaal
`session.writeLock.acquireTimeoutMs` voordat een busy-session-fout zichtbaar wordt; de standaard is `60000`
ms. Verhoog dit alleen wanneer legitieme voorbereiding, opschoning, compaction of transcript-mirrorwerk
langer concurreert op trage machines. Detectie van verouderde locks en waarschuwingen voor maximale houdtijd blijven aparte beleidsregels.

Handhavingsvolgorde voor opschoning van schijfbudget (`mode: "enforce"`):

1. Verwijder eerst de oudste gearchiveerde, verweesde transcript- of verweesde trajectory-artefacten.
2. Als het doel nog steeds wordt overschreden, verwijder dan de oudste sessie-entries en hun transcript-/trajectory-bestanden.
3. Ga door totdat het gebruik op of onder `highWaterBytes` ligt.

In `mode: "warn"` rapporteert OpenClaw potentiële verwijderingen, maar muteert de opslag/bestanden niet.

Voer onderhoud op verzoek uit:

```bash
openclaw sessions cleanup --dry-run
openclaw sessions cleanup --enforce
```

---

## Cron-sessies en run-logs

Geïsoleerde Cron-runs maken ook sessie-entries/transcripts aan, en ze hebben specifieke retentiecontroles:

- `cron.sessionRetention` (standaard `24h`) prune't oude geïsoleerde Cron-run-sessies uit de sessieopslag (`false` schakelt dit uit).
- `cron.runLog.maxBytes` + `cron.runLog.keepLines` prune'n `~/.openclaw/cron/runs/<jobId>.jsonl`-bestanden (standaarden: `2_000_000` bytes en `2000` regels).

Wanneer Cron geforceerd een nieuwe geïsoleerde run-sessie aanmaakt, sanitizet het de vorige
`cron:<jobId>`-sessie-entry voordat de nieuwe rij wordt geschreven. Het neemt veilige
voorkeuren mee, zoals instellingen voor thinking/fast/verbose, labels en expliciete
door de gebruiker geselecteerde model-/auth-overrides. Het laat omgevingsgesprekscontext vallen,
zoals kanaal-/groepsrouting, verzend- of wachtrijbeleid, elevation, oorsprong en ACP
runtime-binding, zodat een nieuwe geïsoleerde run geen verouderde delivery- of
runtime-authority van een oudere run kan erven.

---

## Sessiesleutels (`sessionKey`)

Een `sessionKey` identificeert _in welke gespreksemmer_ je zit (routing + isolatie).

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
- **Dagelijkse reset** (standaard 4:00 AM lokale tijd op de gateway-host) maakt een nieuwe `sessionId` bij het volgende bericht na de resetgrens.
- **Idle-verval** (`session.reset.idleMinutes` of legacy `session.idleMinutes`) maakt een nieuwe `sessionId` wanneer een bericht binnenkomt na het idle-venster. Wanneer dagelijks + idle beide zijn geconfigureerd, wint wat het eerst verloopt.
- **Systeemevents** (Heartbeat, Cron-wakeups, exec-meldingen, gateway-boekhouding) kunnen de sessierij muteren, maar verlengen de dagelijkse/idle resetversheid niet. Reset-rollover verwijdert queued systeemeventmeldingen voor de vorige sessie voordat de nieuwe prompt wordt gebouwd.
- **Parent fork-beleid** gebruikt de actieve branch van Pi bij het maken van een thread- of subagent-fork. Als die branch te groot is, start OpenClaw het kind met geïsoleerde context in plaats van te falen of onbruikbare geschiedenis te erven. Het sizingbeleid is automatisch; legacy `session.parentForkMaxTokens`-configuratie wordt verwijderd door `openclaw doctor --fix`.

Implementatiedetail: de beslissing gebeurt in `initSessionState()` in `src/auto-reply/reply/session.ts`.

---

## Schema voor sessieopslag (`sessions.json`)

Het waardetype van de opslag is `SessionEntry` in `src/config/sessions.ts`.

Belangrijke velden (niet uitputtend):

- `sessionId`: huidige transcript-id (bestandsnaam wordt hiervan afgeleid, tenzij `sessionFile` is ingesteld)
- `sessionStartedAt`: starttijdstempel voor de huidige `sessionId`; dagelijkse reset
  gebruikt dit voor versheid. Legacy rijen kunnen dit afleiden uit de JSONL-sessieheader.
- `lastInteractionAt`: tijdstempel van de laatste echte gebruikers-/kanaalinteractie; idle reset
  gebruikt dit voor versheid, zodat Heartbeat-, Cron- en exec-events sessies niet
  levend houden. Legacy rijen zonder dit veld vallen terug op de herstelde sessiestarttijd
  voor idle-versheid.
- `updatedAt`: tijdstempel van de laatste mutatie van de opslagrij, gebruikt voor lijsten, pruning en
  boekhouding. Dit is niet de autoriteit voor dagelijkse/idle resetversheid.
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
- `compactionCount`: hoe vaak automatische compaction is voltooid voor deze sessiesleutel
- `memoryFlushAt`: tijdstempel van de laatste pre-compaction-geheugenflush
- `memoryFlushCompactionCount`: compaction-aantal toen de laatste flush draaide

De opslag is veilig te bewerken, maar de Gateway is de autoriteit: deze kan entries herschrijven of rehydrateren terwijl sessies draaien.

---

## Transcriptstructuur (`*.jsonl`)

Transcripts worden beheerd door `SessionManager` van `@earendil-works/pi-coding-agent`.

Het bestand is JSONL:

- Eerste regel: sessieheader (`type: "session"`, bevat `id`, `cwd`, `timestamp`, optioneel `parentSession`)
- Daarna: sessie-entries met `id` + `parentId` (boom)

Opmerkelijke entrytypen:

- `message`: gebruiker-/assistant-/toolResult-berichten
- `custom_message`: door extensie ingevoegde berichten die _wel_ in de modelcontext terechtkomen (kunnen verborgen zijn voor UI)
- `custom`: extensiestatus die _niet_ in de modelcontext terechtkomt
- `compaction`: gepersisteerde compaction-samenvatting met `firstKeptEntryId` en `tokensBefore`
- `branch_summary`: gepersisteerde samenvatting bij het navigeren door een boombranch

OpenClaw "corrigeert" transcripts bewust **niet**; de Gateway gebruikt `SessionManager` om ze te lezen/schrijven.

---

## Contextvensters versus bijgehouden tokens

Twee verschillende concepten zijn belangrijk:

1. **Modelcontextvenster**: harde cap per model (tokens zichtbaar voor het model)
2. **Tellers in sessieopslag**: rollende statistieken die naar `sessions.json` worden geschreven (gebruikt voor /status en dashboards)

Als je limieten afstemt:

- Het contextvenster komt uit de modelcatalogus (en kan via configuratie worden overschreven).
- `contextTokens` in de opslag is een runtime schatting/rapportagewaarde; behandel het niet als een strikte garantie.

Zie voor meer informatie [/token-use](/nl/reference/token-use).

---

## Compaction: wat het is

Compaction vat oudere gesprekken samen in een gepersisteerde `compaction`-entry in het transcript en houdt recente berichten intact.

Na compaction zien toekomstige beurten:

- De compaction-samenvatting
- Berichten na `firstKeptEntryId`

Compaction is **persistent** (in tegenstelling tot sessie-opschoning). Zie [/concepts/session-pruning](/nl/concepts/session-pruning).

## Compaction-chunkgrenzen en tool-koppeling

Wanneer OpenClaw een lang transcript opsplitst in Compaction-chunks, houdt het
assistant-toolaanroepen gekoppeld aan hun bijbehorende `toolResult`-items.

- Als de splitsing op basis van tokensaandeel tussen een toolaanroep en het resultaat ervan valt, verschuift OpenClaw
  de grens naar het assistant-toolaanroepbericht in plaats van het
  paar te scheiden.
- Als een afsluitend tool-resultaatblok de chunk anders boven het doel zou brengen,
  behoudt OpenClaw dat wachtende toolblok en houdt het de niet-samengevatte staart
  intact.
- Afgebroken toolaanroepblokken of toolaanroepblokken met fouten houden een wachtende splitsing niet open.

---

## Wanneer auto-Compaction plaatsvindt (Pi-runtime)

In de ingebedde Pi-agent wordt auto-Compaction in twee gevallen geactiveerd:

1. **Overflow-herstel**: het model retourneert een context-overflowfout
   (`request_too_large`, `context length exceeded`, `input exceeds the maximum
number of tokens`, `input token count exceeds the maximum number of input
tokens`, `input is too long for the model`, `ollama error: context length
exceeded`, en vergelijkbare provider-vormige varianten) → comprimeren → opnieuw proberen.
2. **Drempelonderhoud**: na een succesvolle beurt, wanneer:

`contextTokens > contextWindow - reserveTokens`

Waarbij:

- `contextWindow` het contextvenster van het model is
- `reserveTokens` gereserveerde ruimte is voor prompts + de volgende modeluitvoer

Dit zijn Pi-runtime-semantieken (OpenClaw consumeert de events, maar Pi bepaalt wanneer er wordt gecomprimeerd).

OpenClaw kan ook een preflight lokale Compaction activeren voordat de volgende
run wordt geopend wanneer `agents.defaults.compaction.maxActiveTranscriptBytes` is ingesteld en het
actieve transcriptbestand die grootte bereikt. Dit is een bestandsgroottebeveiliging voor lokale
heropenkosten, geen ruwe archivering: OpenClaw voert nog steeds normale semantische Compaction uit,
en vereist `truncateAfterCompaction` zodat de gecomprimeerde samenvatting een
nieuw opvolgend transcript kan worden.

Voor ingebedde Pi-runs voegt `agents.defaults.compaction.midTurnPrecheck.enabled: true`
een optionele tool-loopbeveiliging toe. Nadat een toolresultaat is toegevoegd en vóór de
volgende modelaanroep, schat OpenClaw de promptdruk met dezelfde preflight-
budgetlogica die aan het begin van de beurt wordt gebruikt. Als de context niet meer past, comprimeert de beveiliging
niet binnen Pi's `transformContext`-hook. Het genereert een gestructureerd
mid-turn precheck-signaal, stopt de huidige promptinzending en laat de
buitenste run-loop het bestaande herstelpad gebruiken: te grote toolresultaten afkappen
wanneer dat genoeg is, of de geconfigureerde Compaction-modus activeren en opnieuw proberen. De
optie is standaard uitgeschakeld en werkt met zowel `default`- als `safeguard`-
Compaction-modi, inclusief provider-ondersteunde safeguard-Compaction.
Dit staat los van `maxActiveTranscriptBytes`: de bytegroottebeveiliging draait
voordat een beurt wordt geopend, terwijl mid-turn precheck later in de ingebedde Pi-tool-
loop draait nadat nieuwe toolresultaten zijn toegevoegd.

---

## Compaction-instellingen (`reserveTokens`, `keepRecentTokens`)

Pi's Compaction-instellingen staan in de Pi-instellingen:

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
- Als deze al hoger is, laat OpenClaw deze ongemoeid.
- Handmatige `/compact` respecteert een expliciete `agents.defaults.compaction.keepRecentTokens`
  en behoudt Pi's afkappunt voor de recente staart. Zonder expliciet bewaarbudget
  blijft handmatige Compaction een hard checkpoint en begint de herbouwde context vanaf
  de nieuwe samenvatting.
- Stel `agents.defaults.compaction.midTurnPrecheck.enabled: true` in om de
  optionele tool-loop-precheck uit te voeren na nieuwe toolresultaten en vóór de volgende model-
  aanroep. Dit is alleen een trigger; samenvattingsgeneratie gebruikt nog steeds het geconfigureerde
  Compaction-pad. Het staat los van `maxActiveTranscriptBytes`, wat een
  bytegroottebeveiliging voor actieve transcriptie aan het begin van een beurt is.
- Stel `agents.defaults.compaction.maxActiveTranscriptBytes` in op een bytewaarde of
  string zoals `"20mb"` om lokale Compaction uit te voeren vóór een beurt wanneer het actieve
  transcript groot wordt. Deze beveiliging is alleen actief wanneer
  `truncateAfterCompaction` ook is ingeschakeld. Laat dit niet ingesteld of stel `0` in om
  uit te schakelen.
- Wanneer `agents.defaults.compaction.truncateAfterCompaction` is ingeschakeld,
  roteert OpenClaw het actieve transcript naar een gecomprimeerde opvolger-JSONL na
  Compaction. Het oude volledige transcript blijft gearchiveerd en gekoppeld vanuit het
  Compaction-checkpoint in plaats van ter plekke herschreven te worden.

Waarom: laat genoeg ruimte over voor multi-turn "housekeeping" (zoals geheugenschrijfacties) voordat Compaction onvermijdelijk wordt.

Implementatie: `ensurePiCompactionReserveTokens()` in `src/agents/pi-settings.ts`
(aangeroepen vanuit `src/agents/pi-embedded-runner.ts`).

---

## Pluggable Compaction-providers

Plugins kunnen een Compaction-provider registreren via `registerCompactionProvider()` op de Plugin-API. Wanneer `agents.defaults.compaction.provider` is ingesteld op een geregistreerde provider-id, delegeert de safeguard-Plugin samenvatting aan die provider in plaats van aan de ingebouwde `summarizeInStages`-pipeline.

- `provider`: id van een geregistreerde Compaction-provider-Plugin. Laat niet ingesteld voor standaard LLM-samenvatting.
- Het instellen van een `provider` forceert `mode: "safeguard"`.
- Providers ontvangen dezelfde Compaction-instructies en hetzelfde beleid voor behoud van identifiers als het ingebouwde pad.
- De safeguard behoudt nog steeds recente-beurt- en split-turn-achtervoegselcontext na provideruitvoer.
- Ingebouwde safeguard-samenvatting destilleert eerdere samenvattingen opnieuw met nieuwe berichten
  in plaats van de volledige vorige samenvatting letterlijk te behouden.
- Safeguard-modus schakelt standaard kwaliteitsaudits van samenvattingen in; stel
  `qualityGuard.enabled: false` in om retry-on-malformed-output-gedrag over te slaan.
- Als de provider faalt of een leeg resultaat retourneert, valt OpenClaw automatisch terug op ingebouwde LLM-samenvatting.
- Afbreek-/timeoutsignalen worden opnieuw gegooid (niet ingeslikt) om annulering door de aanroeper te respecteren.

Bron: `src/plugins/compaction-provider.ts`, `src/agents/pi-hooks/compaction-safeguard.ts`.

---

## Gebruikerszichtbare oppervlakken

Je kunt Compaction en sessiestatus observeren via:

- `/status` (in elke chatsessie)
- `openclaw status` (CLI)
- `openclaw sessions` / `sessions --json`
- Gateway-logs (`pnpm gateway:watch` of `openclaw logs --follow`): `embedded run auto-compaction start` + `complete`
- Uitgebreide modus: `🧹 Auto-compaction complete` + Compaction-aantal

---

## Stille housekeeping (`NO_REPLY`)

OpenClaw ondersteunt "stille" beurten voor achtergrondtaken waarbij de gebruiker geen tussentijdse uitvoer zou moeten zien.

Conventie:

- De assistant begint zijn uitvoer met de exacte stille token `NO_REPLY` /
  `no_reply` om aan te geven "lever geen antwoord af bij de gebruiker".
- OpenClaw verwijdert/onderdrukt dit in de afleverlaag.
- Exacte onderdrukking van stille tokens is hoofdletterongevoelig, dus `NO_REPLY` en
  `no_reply` tellen allebei wanneer de volledige payload alleen de stille token is.
- Dit is alleen voor echte achtergrond-/niet-afleverbeurten; het is geen snelkoppeling voor
  gewone uitvoerbare gebruikersverzoeken.

Vanaf `2026.1.10` onderdrukt OpenClaw ook **concept-/typestreaming** wanneer een
gedeeltelijke chunk begint met `NO_REPLY`, zodat stille bewerkingen geen gedeeltelijke
uitvoer midden in een beurt lekken.

---

## "Memory flush" vóór Compaction (geïmplementeerd)

Doel: voordat auto-Compaction plaatsvindt, voer een stille agentische beurt uit die duurzame
status naar schijf schrijft (bijv. `memory/YYYY-MM-DD.md` in de agentwerkruimte), zodat Compaction geen
kritieke context kan wissen.

OpenClaw gebruikt de **pre-threshold flush**-aanpak:

1. Bewaak het contextgebruik van de sessie.
2. Wanneer dit een "zachte drempel" overschrijdt (onder Pi's Compaction-drempel), voer een stille
   "write memory now"-richtlijn uit naar de agent.
3. Gebruik de exacte stille token `NO_REPLY` / `no_reply` zodat de gebruiker
   niets ziet.

Config (`agents.defaults.compaction.memoryFlush`):

- `enabled` (standaard: `true`)
- `model` (optionele exacte provider/model-override voor de flush-beurt, bijvoorbeeld `ollama/qwen3:8b`)
- `softThresholdTokens` (standaard: `4000`)
- `prompt` (gebruikersbericht voor de flush-beurt)
- `systemPrompt` (extra systeemprompt toegevoegd voor de flush-beurt)

Opmerkingen:

- De standaardprompt/systeemprompt bevatten een `NO_REPLY`-hint om
  aflevering te onderdrukken.
- Wanneer `model` is ingesteld, gebruikt de flush-beurt dat model zonder de
  fallbackketen van de actieve sessie te erven, zodat lokale housekeeping niet stilletjes
  terugvalt op een betaald gespreksmodel.
- De flush draait eenmaal per Compaction-cyclus (bijgehouden in `sessions.json`).
- De flush draait alleen voor ingebedde Pi-sessies (CLI-backends slaan deze over).
- De flush wordt overgeslagen wanneer de sessiewerkruimte alleen-lezen is (`workspaceAccess: "ro"` of `"none"`).
- Zie [Memory](/nl/concepts/memory) voor de bestandsindeling van de werkruimte en schrijfpatronen.

Pi stelt ook een `session_before_compact`-hook beschikbaar in de Plugin-API, maar OpenClaw's
flush-logica leeft momenteel aan de Gateway-kant.

---

## Checklist voor probleemoplossing

- Sessiesleutel onjuist? Begin met [/concepts/session](/nl/concepts/session) en bevestig de `sessionKey` in `/status`.
- Mismatch tussen store en transcript? Bevestig de Gateway-host en het store-pad vanuit `openclaw status`.
- Compaction-spam? Controleer:
  - contextvenster van het model (te klein)
  - Compaction-instellingen (`reserveTokens` te hoog voor het modelvenster kan eerdere Compaction veroorzaken)
  - opgeblazen toolresultaten: schakel sessie-opschoning in en stem deze af
- Stille beurten lekken? Bevestig dat het antwoord begint met `NO_REPLY` (hoofdletterongevoelige exacte token) en dat je een build gebruikt met de streamingonderdrukkingsfix.

## Gerelateerd

- [Sessiebeheer](/nl/concepts/session)
- [Sessie-opschoning](/nl/concepts/session-pruning)
- [Context-engine](/nl/concepts/context-engine)
