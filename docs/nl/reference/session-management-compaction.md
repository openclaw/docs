---
read_when:
    - Je moet sessie-id's, transcriptgebeurtenissen of velden van sessierijen debuggen
    - Je wijzigt het gedrag van automatische Compaction of voegt opschoning vóór Compaction toe
    - Je wilt geheugenflushes of stille systeembeurten implementeren
summary: 'Diepgaande uitleg: sessieopslag + transcripties, levenscyclus en interne werking van (automatische) Compaction'
title: Diepgaande uitleg over sessiebeheer
x-i18n:
    generated_at: "2026-07-16T16:22:20Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 7551a94a4e2dc8be8b69503795309d0200cc3b5d7231b54083dbcaade697b06c
    source_path: reference/session-management-compaction.md
    workflow: 16
---

Eén **Gateway-proces** beheert de sessiestatus van begin tot eind. Gebruikersinterfaces (macOS-app, web-Control UI, TUI) vragen de Gateway om sessielijsten en aantallen tokens. In de externe modus staan sessiebestanden op de externe host, dus de bestanden op je lokale Mac controleren geeft niet weer wat de Gateway gebruikt.

Lees eerst de overzichtsdocumentatie: [Sessiebeheer](/nl/concepts/session), [Compaction](/nl/concepts/compaction), [Geheugenoverzicht](/nl/concepts/memory), [Zoeken in geheugen](/nl/concepts/memory-search), [Sessies opschonen](/nl/concepts/session-pruning), [Transcripthygiëne](/nl/reference/transcript-hygiene), en de volledige configuratiereferentie bij [Agentconfiguratie](/nl/gateway/config-agents).

## Twee persistentielagen

1. **Sessierijen (SQLite per agent)** - sleutel-waardetoewijzing `sessionKey -> SessionEntry`. Veranderlijke runtimestatus die door de Gateway wordt beheerd. Houdt metagegevens bij: huidige sessie-id, laatste activiteit, schakelaars en tokentellers.
2. **Transcriptgebeurtenissen (SQLite per agent)** - alleen toevoegbaar en boomgestructureerd (vermeldingen hebben `id` + `parentId`). Slaat het gesprek, toolaanroepen en Compaction-samenvattingen op; bouwt de modelcontext voor toekomstige beurten opnieuw op. Compaction-controlepunten zijn metagegevens over het gecompacteerde vervolgtranscript; een nieuwe Compaction schrijft geen tweede kopie van `.checkpoint.*.jsonl`.

Oudere installaties kunnen nog `sessions.json`-bestanden hebben in de map `sessions/` van de agent. Beschouw die bestanden als migratie-invoer voor verouderde sessierijen of als expliciete doelen voor offlineonderhoud. Bij het starten van de Gateway en met `openclaw doctor --fix` worden actieve verouderde rijen en transcriptgeschiedenis automatisch geïmporteerd in de SQLite-opslag per agent. Voer `openclaw doctor --session-sqlite inspect
--session-sqlite-all-agents` uit en volg daarna de [Doctor-migratiereeks](/nl/cli/doctor#session-sqlite-migration) wanneer je expliciete inspectie of validatiebewijs nodig hebt. Als een migratie mislukt nadat verouderde transcriptartefacten zijn gearchiveerd, gebruik je de Doctor-herstelmodus uit die reeks. Herstel gebruikt migratiemanifesten, herstelt alleen de betrokken gearchiveerde ondersteuningsartefacten, stelt desgevraagd een opgeschoond GitHub-probleemrapport op en zorgt er niet voor dat de actieve runtime opnieuw JSONL-bestanden leest.

Gateway-geschiedenislezers voorkomen dat het volledige transcript in het geheugen wordt geladen, tenzij het oppervlak willekeurige historische toegang nodig heeft. Geschiedenis van de eerste pagina, ingesloten chatgeschiedenis, herstel na opnieuw starten en token-/gebruikscontroles gebruiken begrensde uitlezingen van het einde uit SQLite. Volledige transcriptscans verlopen via de asynchrone transcriptindex en worden gedeeld door gelijktijdige lezers.

## Locaties op schijf

Per agent, op de Gateway-host (opgelost via `src/config/sessions.ts`):

- Runtimeopslag voor sessierijen: `~/.openclaw/agents/<agentId>/agent/openclaw-agent.sqlite`
- Runtimerijen voor transcripten: `~/.openclaw/agents/<agentId>/agent/openclaw-agent.sqlite`
- Verouderde/gearchiveerde transcriptartefacten: `~/.openclaw/agents/<agentId>/sessions/`
- Migratie-invoer voor verouderde rijen: `~/.openclaw/agents/<agentId>/sessions/sessions.json`

## Opslagonderhoud en schijflimieten

`session.maintenance` bepaalt automatisch onderhoud voor SQLite-sessierijen, SQLite-transcriptrijen, archiefartefacten en trajectnevenbestanden:

| Sleutel                 | Standaard              | Opmerkingen                                                                                       |
| ----------------------- | ---------------------- | ------------------------------------------------------------------------------------------------- |
| `mode`      | `"enforce"`     | of `"warn"` (alleen rapporteren, geen wijzigingen)                                      |
| `pruneAfter`      | `"30d"`     | leeftijdsgrens voor verouderde vermeldingen                                                       |
| `maxEntries`      | `500`     | maximumaantal sessievermeldingen                                                                  |
| `resetArchiveRetention`      | behouden (geen leeftijdsgrens) | leeftijdsgrens voor `*.reset.*`/`*.deleted.*`-transcriptarchieven; met een duur wordt verwijdering ingeschakeld |
| `maxDiskBytes`      | `2gb`     | schijfbudget per agent voor sessies; `false` schakelt dit uit                           |
| `highWaterBytes`      | 80% van `maxDiskBytes` | doel na opschoning wegens budgetoverschrijding                                                 |

Gearchiveerde transcripten worden standaard bewaard en met zstd (`*.jsonl.<reason>.<timestamp>.zst`) gecomprimeerd wanneer de runtime dit ondersteunt, zodat het verwijderen of opnieuw instellen van een sessie nooit ongemerkt de gespreksgeschiedenis wist. Binnen het schijfbudget worden eerst de oudste archieven verwijderd, voordat actieve sessies worden aangeraakt.

Actieve SQLite-handhaving van `maxDiskBytes` meet per sessie de JSON-bytes van sessierijen plus transcriptgebeurtenissen; verouderde handhaving voor offlineonderhoud meet bestanden in de geselecteerde sessiemap.

Gateway-probesessies voor modeluitvoeringen (sleutels die overeenkomen met `agent:*:explicit:model-run-<uuid>`) krijgen een afzonderlijke, vaste bewaartermijn van `24h`. Deze opschoning wordt alleen bij druk uitgevoerd: alleen wanneer de onderhouds- of capaciteitsgrens voor sessievermeldingen is bereikt, en uitsluitend vóór de globale stap voor het opruimen of begrenzen van verouderde vermeldingen. Andere expliciete sessies gebruiken deze bewaartermijn niet.

Handhavingsvolgorde voor opschoning van het schijfbudget (`mode: "enforce"`):

1. Verwijder eerst de oudste gearchiveerde transcriptartefacten, verweesde verouderde artefacten of verweesde trajectartefacten.
2. Als het gebruik nog steeds boven het doel ligt, verwijder dan de oudste sessievermeldingen en de bijbehorende transcriptrijen of trajectartefacten.
3. Herhaal dit totdat het gebruik gelijk is aan of lager is dan `highWaterBytes`.

`mode: "warn"` rapporteert mogelijke verwijderingen zonder de opslag of bestanden te wijzigen.

Voer onderhoud op aanvraag uit:

```bash
openclaw sessions cleanup --dry-run
openclaw sessions cleanup --enforce
```

Onderhoud behoudt duurzame externe gespreksverwijzingen, zoals groepssessies en chatgesprekken die aan een thread zijn gebonden, maar synthetische runtimevermeldingen (cron, hooks, Heartbeat, ACP, subagenten) kunnen nog steeds worden verwijderd zodra ze de geconfigureerde leeftijd, het aantal of het schijfbudget overschrijden. Geïsoleerde cron-uitvoeringen gebruiken een afzonderlijke instelling `cron.sessionRetention`, onafhankelijk van de bewaartermijn voor modeluitvoeringsprobes.

Normale schrijfbewerkingen van de Gateway verlopen via de sessietoegangslaag, die SQLite-wijzigingen per agent serialiseert via het runtimeschrijverpad. Runtimecode moet bij voorkeur de toegangshulpfuncties in `src/config/sessions/session-accessor.ts` gebruiken; de verouderde hulpfuncties van `sessions.json` zijn tools voor migratie en offlineonderhoud. Wanneer een Gateway bereikbaar is, delegeren `openclaw sessions cleanup` en `openclaw agents delete` zonder dry-run opslagwijzigingen aan de Gateway, zodat opschoning in dezelfde schrijfwachtrij wordt geplaatst; `--store <path>` is het expliciete offlineherstelpad voor een geselecteerde verouderde opslag en blijft altijd lokaal (net als `--dry-run`). De opschoning van `maxEntries` wordt voor opslag van productieomvang in batches uitgevoerd, zodat een opslag kortstondig de geconfigureerde limiet kan overschrijden voordat de volgende opschoning bij de bovengrens deze terugbrengt. Leesbewerkingen verwijderen of begrenzen nooit vermeldingen tijdens het starten van de Gateway; alleen schrijfbewerkingen of `openclaw sessions cleanup --enforce` doen dat. Deze laatste past de limiet ook onmiddellijk toe en verwijdert oude, niet-verwezen verouderde transcript-, controlepunt- en trajectartefacten, zelfs wanneer geen schijfbudget is geconfigureerd.

OpenClaw maakt tijdens schrijfbewerkingen van de Gateway niet langer automatisch roterende back-ups van `sessions.json.bak.*`. Het huidige schema weigert de verouderde sleutel `session.maintenance.rotateBytes`, en `openclaw doctor --fix` verwijdert deze uit oudere configuraties.

Transcriptwijzigingen gebruiken de sessieschrijfwachtrij voor het SQLite-transcriptdoel:

| Instelling                           | Standaard | Omgevingsoverschrijving                         |
| ------------------------------------ | --------- | ----------------------------------------------- |
| `session.writeLock.acquireTimeoutMs`                  | `60000` | `OPENCLAW_SESSION_WRITE_LOCK_ACQUIRE_TIMEOUT_MS`                     |
| `session.writeLock.staleMs`                  | `1800000` | `OPENCLAW_SESSION_WRITE_LOCK_STALE_MS`                     |
| `session.writeLock.maxHoldMs`                  | `300000` | `OPENCLAW_SESSION_WRITE_LOCK_MAX_HOLD_MS`                     |

`acquireTimeoutMs` bepaalt hoelang wachten op een vergrendeling duurt voordat een fout voor een bezette sessie wordt weergegeven en de poging wordt opgegeven; verhoog dit alleen wanneer legitieme voorbereiding, opschoning, Compaction of werk voor een transcriptspiegel op trage machines langer conflicteert. `staleMs` bepaalt wanneer een bestaande vergrendeling als verouderd kan worden teruggewonnen. `maxHoldMs` is de vrijgavedrempel voor de waakhond binnen het proces.

### Downgraden na de overstap naar SQLite

Herstel gearchiveerde verouderde transcriptartefacten voordat je een oudere, door bestanden ondersteunde versie van OpenClaw uitvoert:

```bash
openclaw doctor --session-sqlite restore --session-sqlite-all-agents
```

De migratie laat verouderde `sessions.json`-bestanden staan voor ondersteuning en terugdraaien, maar actieve JSONL-transcriptbestanden die in SQLite zijn geïmporteerd, worden hernoemd naar `session-sqlite-import-archive/`. Oudere, door bestanden ondersteunde runtimes volgen de paden van `sessionFile` in `sessions.json`, dus die artefacten moeten vóór het starten worden hersteld. Herstel gebruikt migratiemanifesten, verplaatst alleen vastgelegde gearchiveerde artefacten waarvan de oorspronkelijke paden ontbreken en laat de SQLite-database staan voor toekomstig herstel.

Sessies die na de overstap naar SQLite zijn gemaakt, bestaan alleen in SQLite en zijn niet zichtbaar voor een oudere, door bestanden ondersteunde runtime. Als je na een downgrade opnieuw upgradet, voer je de Doctor-reeks voor inspectie en validatie opnieuw uit, zodat OpenClaw de herstelde verouderde artefacten kan controleren voordat ze worden geïmporteerd.

## Cron-sessies en uitvoeringslogboeken

Geïsoleerde cron-uitvoeringen maken hun eigen sessievermeldingen en transcripten met een afzonderlijk bewaarbeleid:

- `cron.sessionRetention` (standaard `"24h"`) verwijdert oude, geïsoleerde cron-uitvoeringssessies uit de opslag; `false` schakelt dit uit.
- De uitvoeringsgeschiedenis bewaart de nieuwste 2000 terminalrijen per cron-taak. Verloren rijen behouden hun opschoningsperiode van 24 uur.

Wanneer cron gedwongen een nieuwe geïsoleerde uitvoeringssessie maakt, schoont het de vorige sessievermelding van `cron:<jobId>` op voordat de nieuwe rij wordt geschreven: veilige voorkeuren (instellingen voor denken/snel/uitgebreid/redeneren, labels en weergavenaam) en expliciet door de gebruiker geselecteerde model-/authenticatieoverschrijvingen worden overgenomen, maar omgevingsgebonden gesprekscontext (kanaal-/groepsroutering, verzend-/wachtrijbeleid, verhoging van bevoegdheden, oorsprong en ACP-runtimebinding) wordt verwijderd, zodat een nieuwe geïsoleerde uitvoering geen verouderde afleverings- of runtimebevoegdheid van een oudere uitvoering kan erven.

## Sessiesleutels (`sessionKey`)

Een `sessionKey` bepaalt in welke gespreksbucket je je bevindt (routering + isolatie). Canonieke regels: [/concepts/session](/nl/concepts/session).

| Patroon                      | Voorbeeld                                                   |
| ---------------------------- | ----------------------------------------------------------- |
| Hoofd-/directe chat (per agent) | `agent:<agentId>:<mainKey>` (standaard `main`)        |
| Groep                        | `agent:<agentId>:<channel>:group:<id>`                                          |
| Ruimte/kanaal (Discord/Slack) | `agent:<agentId>:<channel>:channel:<id>` of `...:room:<id>`                   |
| Cron                         | `cron:<job.id>`                                          |
| Webhook                      | `hook:<uuid>` (tenzij overschreven)                    |

## Sessie-id's (`sessionId`)

Elke `sessionKey` verwijst naar een huidige `sessionId` (de SQLite-transcriptidentiteit waarmee het gesprek wordt voortgezet). De beslislogica staat in `initSessionState()` in `src/auto-reply/reply/session.ts`.

- **Reset** (`/new`, `/reset`) maakt een nieuwe `sessionId` voor die `sessionKey`.
- **Dagelijkse reset** (standaard om 4:00 AM lokale tijd op de Gateway-host) maakt bij het eerstvolgende bericht na de resetgrens een nieuwe `sessionId`.
- **Verloop wegens inactiviteit** (`session.reset.idleMinutes`, of de verouderde `session.idleMinutes`) maakt een nieuwe `sessionId` wanneer een bericht binnenkomt nadat het inactiviteitsvenster is verstreken. Als zowel dagelijks als inactiviteit zijn geconfigureerd, geldt wat het eerst verloopt.
- **Hervatten bij opnieuw verbinden van de Control UI** behoudt de momenteel zichtbare sessie voor één verzending na opnieuw verbinden wanneer de Gateway de overeenkomende `sessionId` ontvangt van een UI-client van een operator. Dit is een eenmalig signaal; gewone verouderde verzendingen maken nog steeds een nieuwe `sessionId`.
- **Systeemgebeurtenissen** (Heartbeat, Cron-activeringen, uitvoeringsmeldingen, Gateway-administratie) kunnen de sessierij wijzigen, maar verlengen nooit de actualiteit voor dagelijkse resets of resets wegens inactiviteit. Bij een resetovergang worden meldingen van systeemgebeurtenissen in de wachtrij voor de vorige sessie verwijderd voordat de nieuwe prompt wordt opgebouwd.
- **Beleid voor bovenliggende forks** gebruikt de actieve vertakking van OpenClaw bij het maken van een thread- of subagentfork. Als die vertakking te groot is (boven een vaste interne limiet, momenteel 100K tokens), start OpenClaw het kind met geïsoleerde context in plaats van te mislukken of onbruikbare geschiedenis over te nemen. De groottebepaling is automatisch en niet configureerbaar; verouderde `session.parentForkMaxTokens`-configuratie wordt verwijderd door `openclaw doctor --fix`.
- **Operatorforks**: `sessions.create { parentSessionKey, fork: true }` maakt een nieuwe sessie waarvan het transcript aftakt van de huidige toestand van de bovenliggende sessie (hetzelfde forkmechanisme als bij het starten van subagents, inclusief de bovenstaande groottelimiet). De fork wordt geweigerd zolang de bovenliggende sessie een actieve uitvoering heeft, neemt de modelselectie van de bovenliggende sessie over tenzij er expliciet een wordt doorgegeven, en markeert het kind als `forkedFromParent` met nieuwe tokentellers.

## Schema van de sessieopslag

De runtimeopslag bewaart `SessionEntry`-waarden in SQLite per agent. Het waardetype is `SessionEntry` in `src/config/sessions.ts`. Belangrijke velden (niet uitputtend):

- `sessionId`: huidige transcript-id waarmee SQLite-transcriptrijen worden aangesproken
- `sessionStartedAt`: begintijdstempel voor de huidige `sessionId`; de actualiteit voor dagelijkse resets gebruikt deze. Verouderde rijen kunnen deze afleiden uit de JSONL-sessieheader.
- `lastInteractionAt`: tijdstempel van de laatste echte gebruikers-/kanaalinteractie; de actualiteit voor resets wegens inactiviteit gebruikt deze, zodat Heartbeat-, Cron- en uitvoeringsgebeurtenissen sessies niet actief houden. Verouderde rijen zonder dit veld vallen terug op de herstelde begintijd van de sessie.
- `updatedAt`: tijdstempel van de laatste wijziging van de opslagrij, gebruikt voor lijsten/opschonen/administratie - niet de autoriteit voor actualiteit van dagelijkse resets of resets wegens inactiviteit.
- `archivedAt`: optionele archieftijdstempel. Gearchiveerde sessies blijven met een intact transcript in de opslag staan en worden uitgesloten van normale lijsten met actieve sessies.
- `pinnedAt`: optionele vastzettijdstempel. Actieve vastgezette sessies worden vóór niet-vastgezette sessies gesorteerd; bij het archiveren van een sessie wordt de vastzetting opgeheven.
- Interoperabiliteit met Codex-threads: beide velden volgen de vorm voor Codex-threadbeheer - de booleaanse waarden `archived`/`pinned` op de verbinding worden altijd afgeleid van de tijdstempel en aan serverzijde ingesteld, overeenkomstig de semantiek van Codex `threads.archived_at` en serialisatie in camelCase. OpenClaw-tijdstempels zijn epochmilliseconden, terwijl Codex epochseconden gebruikt, dus bridges converteren bij de `codex`-Plugin-seam. Codex heeft nog geen API voor vastzetten (alleen `thread/archive`/`thread/unarchive`); de vastgezette toestand blijft aan OpenClaw-zijde totdat die API bestaat. Daarna kunnen gekoppelde sessies dankzij de overeenkomende vorm de vastgezette toestand mechanisch heen en terug doorgeven.
- Codex-supervisie vermeldt alleen niet-gearchiveerde native threads. Een Gateway-lokale `idle`- of `notLoaded`-thread met onbekende activiteit kan via native `thread/archive` alleen worden gearchiveerd nadat de operator expliciet bevestigt dat geen ander Codex-proces er eigenaar van is; de Plugin leest eerst opnieuw de proceslokale status, waarna de thread uit de catalogus verdwijnt. Die lezing kan niet bewijzen dat een ander App Server-proces de thread niet gebruikt. OpenClaw weigert actieve rijen en foutrijen te archiveren, en archivering via een gekoppelde Node is niet beschikbaar totdat de Node-bridge de volledige gestreamde levenscyclus van de thread kan beheren. Door de archivering in een native Codex-client ongedaan te maken, kan de thread opnieuw worden weergegeven.
- `lastReadAt` / `markedUnreadAt`: tijdstempels voor de leesstatus die door `sessions.patch { unread }` aan serverzijde worden ingesteld - `unread: false` registreert dat er is gelezen (stelt `lastReadAt` in, wist `markedUnreadAt`); `unread: true` markeert de sessie als ongelezen tot de volgende lezing. Sessierijen tonen een afgeleide booleaanse waarde `unread`: expliciet gemarkeerd als ongelezen, of gelezen vóór de recentste activiteit. Sessies die nooit als gelezen zijn gemarkeerd, blijven `unread: false`, zodat bestaande installaties na een upgrade niet allemaal oplichten.
- `lastActivityAt`: tijdstempel van de laatste voltooide agentuitvoering die geldt als activiteit die ongelezen mag zijn (gebruikers-, kanaal- en Cron-uitvoeringen). Heartbeat- en interne-gebeurtenisbeurten en metadatapatches werken deze niet bij; `updatedAt` is geen activiteitssignaal.
- `sessionFile`: verouderde markering die behouden blijft voor compatibiliteit met migratie/archivering; de actieve runtime gebruikt SQLite-identiteit
- `chatType`: `direct | group | room`
- `provider`, `subject`, `room`, `space`, `displayName`: metadata voor groeps-/kanaallabels
- Schakelaars: `thinkingLevel`, `verboseLevel`, `reasoningLevel`, `elevatedLevel`, `sendPolicy` (overschrijving per sessie)
- Modelselectie: `providerOverride`, `modelOverride`, `authProfileOverride`
- Tokentellers (naar beste vermogen/providerafhankelijk): `inputTokens`, `outputTokens`, `totalTokens`, `contextTokens`
- `compactionCount`: hoe vaak automatische Compaction voor deze sessiesleutel is voltooid
- `memoryFlushAt` / `memoryFlushCompactionCount`: tijdstempel en Compaction-aantal van de laatste geheugenflush vóór Compaction

De Gateway is de autoriteit: deze kan vermeldingen herschrijven of opnieuw laden terwijl sessies
worden uitgevoerd. Migreer verouderde installaties met bestandsopslag met
`openclaw doctor --session-sqlite import --session-sqlite-all-agents` in plaats van
`sessions.json` te bewerken en te verwachten dat de runtime dat bestand blijft lezen.

## Structuur van transcriptgebeurtenissen

Transcripten worden beheerd door de OpenClaw-sessietoegang en via identiteitsgebaseerde helpers beschikbaar gesteld aan runtimecode. De gebeurtenisstroom is alleen-toevoegen:

- Eerste vermelding: sessieheader - `type: "session"`, `id`, `cwd`, `timestamp`, optioneel `parentSession`.
- Daarna: vermeldingen met `id` + `parentId` (boomstructuur).

Opmerkelijke vermeldingstypen:

- `message`: berichten van gebruiker/assistent/toolResult
- `custom_message`: door een extensie ingevoegd bericht dat _wel_ in de modelcontext terechtkomt (weergegeven in de TUI wanneer `display: true`, volledig verborgen wanneer `display: false`)
- `custom`: extensietoestand die _niet_ in de modelcontext terechtkomt (om extensietoestand tussen herlaadbeurten te bewaren)
- `compaction`: opgeslagen Compaction-samenvatting met `firstKeptEntryId` en `tokensBefore`
- `branch_summary`: opgeslagen samenvatting bij het navigeren door een boomvertakking

OpenClaw corrigeert transcripten bewust niet; de Gateway gebruikt `SessionManager` om ze te lezen/schrijven.

## Contextvensters versus bijgehouden tokens

Twee verschillende concepten:

1. **Modelcontextvenster**: harde limiet per model (tokens die zichtbaar zijn voor het model). Is afkomstig uit de modelcatalogus en kan via configuratie worden overschreven.
2. **Tellers in de sessieopslag**: doorlopende statistieken die naar de sessierij worden geschreven (gebruikt voor `/status` en dashboards). `contextTokens` is een runtimewaarde voor schatting/rapportage - beschouw deze niet als een strikte garantie.

Meer over limieten: [/reference/token-use](/nl/reference/token-use).

## Compaction: wat het is

Compaction vat oudere gesprekken samen in een opgeslagen `compaction`-vermelding in het transcript en houdt recente berichten intact. Na Compaction zien toekomstige beurten de Compaction-samenvatting plus berichten na `firstKeptEntryId`. Compaction is **blijvend**, in tegenstelling tot het opschonen van sessies - zie [/concepten/sessie-opschoning](/nl/concepts/session-pruning).

Het opnieuw invoegen van AGENTS.md-secties na Compaction is opt-in via `agents.defaults.compaction.postCompactionSections`; wanneer dit niet is ingesteld of `[]` is, voegt OpenClaw geen AGENTS.md-fragmenten boven op de Compaction-samenvatting toe.

### Chunkgrenzen en koppeling van tools

Bij het splitsen van een lang transcript in Compaction-chunks houdt OpenClaw toolaanroepen van de assistent gekoppeld aan de overeenkomende `toolResult`-vermeldingen:

- Als de splitsing op basis van het tokenaandeel tussen een toolaanroep en het resultaat ervan zou vallen, verplaatst OpenClaw de grens naar het assistentbericht met de toolaanroep in plaats van het paar te scheiden.
- Als een afsluitend blok met toolresultaten de chunk anders boven het doel zou brengen, behoudt OpenClaw dat wachtende toolblok en houdt het niet-samengevatte einde intact.
- Afgebroken toolaanroepblokken en toolaanroepblokken met fouten houden een wachtende splitsing niet open.

## Wanneer automatische Compaction plaatsvindt

Twee triggers in de ingebedde OpenClaw-agent:

1. **Herstel bij overschrijding**: het model retourneert een fout wegens overschrijding van de context (`request_too_large`, `context length exceeded`, `input exceeds the maximum number of tokens`, `input token count exceeds the maximum number of input tokens`, `input is too long for the model`, `ollama error: context length exceeded` en andere providerspecifieke varianten) - voer Compaction uit en probeer het daarna opnieuw. Wanneer de provider het aantal gebruikte tokens rapporteert, geeft OpenClaw dat waargenomen aantal door aan de Compaction voor herstel bij overschrijding; als de provider de overschrijding bevestigt maar geen parseerbaar aantal verstrekt, geeft OpenClaw een synthetisch aantal dat minimaal boven het budget ligt door aan Compaction-engines en diagnostiek. Als herstel bij overschrijding nog steeds mislukt, toont OpenClaw expliciete instructies en behoudt het de huidige sessietoewijzing in plaats van stilzwijgend over te schakelen naar een nieuwe sessie-id - probeer het bericht opnieuw, voer `/compact` uit of voer `/new` uit.
2. **Drempelonderhoud**: na een geslaagde beurt, wanneer `contextTokens > contextWindow - reserveTokens`, waarbij `contextWindow` het contextvenster van het model is en `reserveTokens` de ruimte is die is gereserveerd voor prompts plus de volgende modeluitvoer.

Buiten deze twee triggers worden twee aanvullende controles uitgevoerd:

- **Lokale Compaction vóór uitvoering**: stel `agents.defaults.compaction.maxActiveTranscriptBytes` in (bytes of een tekenreeks zoals `"20mb"`) om lokale Compaction te activeren voordat de volgende uitvoering wordt geopend zodra het actieve transcript die grootte bereikt. Dit is een groottebeveiliging voor de kosten van lokaal opnieuw openen, geen onbewerkte archivering - normale semantische Compaction wordt nog steeds uitgevoerd en vereist `truncateAfterCompaction`, zodat de gecompacteerde samenvatting een nieuw opvolgend transcript wordt.
- **Voorcontrole tijdens een beurt**: stel `agents.defaults.compaction.midTurnPrecheck.enabled: true` in (standaard `false`) om een beveiliging voor de toollus toe te voegen. Nadat een toolresultaat is toegevoegd en vóór de volgende modelaanroep schat OpenClaw de promptdruk met dezelfde budgetlogica vóór uitvoering die aan het begin van de beurt wordt gebruikt. Als de context niet meer past, voert de beveiliging geen Compaction ter plaatse uit - deze genereert een gestructureerd voorcontrolesignaal tijdens de beurt, stopt de huidige promptinzending en laat de buitenste uitvoeringslus het bestaande herstelpad gebruiken (te grote toolresultaten afkappen wanneer dat voldoende is, of de geconfigureerde Compaction-modus activeren en opnieuw proberen). Werkt met zowel de Compaction-modus `default` als `safeguard`, inclusief door de provider ondersteunde beveiligings-Compaction. Onafhankelijk van `maxActiveTranscriptBytes`: de beveiliging voor bytegrootte wordt uitgevoerd voordat een beurt wordt geopend; de voorcontrole tijdens een beurt wordt later uitgevoerd, nadat nieuwe toolresultaten zijn toegevoegd.

## Compaction-instellingen

```json5
{
  agents: {
    defaults: {
      compaction: {
        enabled: true,
        reserveTokens: 16384,
        keepRecentTokens: 20000,
      },
    },
  },
}
```

OpenClaw handhaaft ook een veiligheidsminimum voor ingebedde uitvoeringen: als `compaction.reserveTokens` lager is dan `reserveTokensFloor` (standaard `20000`), verhoogt OpenClaw dit. Stel `agents.defaults.compaction.reserveTokensFloor: 0` in om het minimum uit te schakelen. Wanneer het contextvenster van het actieve model bekend is, worden zowel het minimum als de uiteindelijke effectieve reserve begrensd, zodat de reserve niet het volledige promptbudget kan verbruiken. Dit voorkomt dat modellen met een kleine context (bijvoorbeeld een lokaal model met 16K tokens) vanaf het eerste token met Compaction beginnen; zonder een bekend contextvenster blijven geconfigureerde en actuele reservebudgetten onbegrensd. Waarom überhaupt een minimum: om voldoende ruimte over te laten voor "huishoudelijke" taken over meerdere beurten (zoals het hieronder beschreven wegschrijven van het geheugen) voordat Compaction onvermijdelijk wordt. Implementatie: `applyAgentCompactionSettingsFromConfig()` in `src/agents/agent-settings.ts`, aangeroepen vanuit de paden voor beurten van de ingebedde runner en de instelling van Compaction.

Handmatige `/compact` respecteert een expliciete `agents.defaults.compaction.keepRecentTokens` en behoudt het afkappunt van de runtime voor het recente einde. Zonder een expliciet behoudsbudget is handmatige Compaction een hard controlepunt en begint de opnieuw opgebouwde context bij de nieuwe samenvatting.

Wanneer `truncateAfterCompaction` is ingeschakeld, roteert OpenClaw het actieve transcript na Compaction naar een gecompacte opvolger. Acties voor vertakkings-/herstelcontrolepunten gebruiken die gecompacte opvolger; verouderde controlepuntbestanden van vóór Compaction blijven leesbaar zolang ernaar wordt verwezen.

## Inplugbare Compaction-providers

Plugins registreren een Compaction-provider via `registerCompactionProvider()` in de Plugin-API. Wanneer `agents.defaults.compaction.provider` is ingesteld op de id van een geregistreerde provider, delegeert de beveiligingsuitbreiding de samenvatting aan die provider in plaats van aan de ingebouwde `summarizeInStages`-pipeline.

- `provider`: id van een geregistreerde Compaction-provider-Plugin. Laat dit oningesteld voor de standaard LLM-samenvatting. Het instellen van een `provider` dwingt `mode: "safeguard"` af.
- Providers ontvangen dezelfde Compaction-instructies en hetzelfde beleid voor het behoud van identifiers als het ingebouwde pad, en de beveiliging behoudt na de uitvoer van de provider nog steeds de suffixcontext van recente en opgesplitste beurten.
- De ingebouwde beveiligingssamenvatting distilleert eerdere samenvattingen opnieuw met nieuwe berichten, in plaats van de volledige vorige samenvatting letterlijk te behouden.
- De beveiligingsmodus schakelt standaard kwaliteitscontroles voor samenvattingen in; stel `qualityGuard.enabled: false` in om het gedrag voor opnieuw proberen bij onjuist gevormde uitvoer over te slaan.
- Als de provider mislukt of een leeg resultaat retourneert, valt OpenClaw automatisch terug op de ingebouwde LLM-samenvatting. Afbreek-/time-outsignalen die de aanroeper expliciet heeft geactiveerd, worden opnieuw opgeworpen en niet onderdrukt, zodat annulering altijd wordt gerespecteerd.

Bron: `src/plugins/compaction-provider.ts`, `src/agents/agent-hooks/compaction-safeguard.ts`.

## Voor gebruikers zichtbare oppervlakken

- `/status` in elke chatsessie
- `openclaw status` (CLI)
- `openclaw sessions` / `openclaw sessions --json`
- Gateway-logboeken (`pnpm gateway:watch` of `openclaw logs --follow`): `embedded run auto-compaction start` + `complete`
- Uitgebreide modus: `🧹 Auto-compaction complete` plus het aantal Compaction-bewerkingen

## Stille huishoudelijke taken (`NO_REPLY`)

OpenClaw ondersteunt "stille" beurten voor achtergrondtaken waarbij de gebruiker geen tussentijdse uitvoer mag zien.

- De assistent begint de uitvoer met het exacte stille token `NO_REPLY` / `no_reply` om aan te geven: "lever geen antwoord aan de gebruiker." OpenClaw verwijdert/onderdrukt dit in de leveringslaag.
- De onderdrukking van het exacte stille token is niet hoofdlettergevoelig: `NO_REPLY` en `no_reply` tellen beide wanneer de volledige payload uitsluitend uit het stille token bestaat.
- Vanaf `2026.1.10` onderdrukt OpenClaw ook het streamen van concept-/typestatus wanneer een gedeeltelijk fragment begint met `NO_REPLY`, zodat stille bewerkingen niet halverwege een beurt gedeeltelijke uitvoer lekken.
- Dit is uitsluitend bedoeld voor echte achtergrondbeurten/beurten zonder levering; het is geen snelle omweg voor gewone uitvoerbare gebruikersverzoeken.

## Geheugen wegschrijven vóór Compaction

Voordat automatische Compaction plaatsvindt, kan OpenClaw een stille agentische beurt uitvoeren die duurzame status naar schijf schrijft (bijvoorbeeld `memory/YYYY-MM-DD.md` in de werkruimte van de agent), zodat Compaction geen kritieke context kan wissen. Het bewaakt het gebruik van de sessiecontext en zodra dit een zachte drempel onder de Compaction-drempel overschrijdt, verzendt het een stille instructie "schrijf het geheugen nu weg" met het exacte stille token `NO_REPLY` / `no_reply`, zodat de gebruiker niets ziet.

Configuratie (`agents.defaults.compaction.memoryFlush`), volledige referentie op [/gateway/config-agents](/nl/gateway/config-agents#agentsdefaultscompaction):

| Sleutel                     | Standaard        | Opmerkingen                                                                                                                            |
| --------------------------- | ---------------- | -------------------------------------------------------------------------------------------------------------------------------------- |
| `enabled`                   | `true`           |                                                                                                                                        |
| `model`                     | niet ingesteld   | exacte provider-/modeloverschrijving uitsluitend voor de wegschrijfbeurt, bijvoorbeeld `ollama/qwen3:8b`                               |
| `softThresholdTokens`       | `4000`           | afstand onder de Compaction-drempel die het wegschrijven activeert                                                                     |
| `forceFlushTranscriptBytes` | niet ingesteld (uitgeschakeld) | dwing wegschrijven af zodra het transcriptbestand deze grootte in bytes bereikt (of een tekenreeks zoals `"2mb"`), zelfs als tokentellers verouderd zijn; `0` schakelt dit uit |
| `prompt`                    | ingebouwd        | gebruikersbericht voor de wegschrijfbeurt                                                                                              |
| `systemPrompt`              | ingebouwd        | extra systeemprompt die aan de wegschrijfbeurt wordt toegevoegd                                                                         |

Opmerkingen:

- De standaardprompt/systeemprompt bevat een `NO_REPLY`-hint om levering te onderdrukken.
- Wanneer `model` is ingesteld, gebruikt de wegschrijfbeurt dat model zonder de terugvalketen van de actieve sessie over te nemen, zodat uitsluitend lokale huishoudelijke taken bij een fout niet stilzwijgend terugvallen op een betaald gespreksmodel.
- Het wegschrijven wordt eenmaal per Compaction-cyclus uitgevoerd (bijgehouden in de sessierij).
- Het wegschrijven wordt uitsluitend uitgevoerd voor ingebedde OpenClaw-sessies; CLI-backends en Heartbeat-beurten slaan dit over.
- Het wegschrijven wordt overgeslagen wanneer de sessiewerkruimte alleen-lezen is (`workspaceAccess: "ro"` of `"none"`).
- Zie [Geheugen](/nl/concepts/memory) voor de indeling en schrijfpatronen van bestanden in de werkruimte.

OpenClaw stelt een `session_before_compact`-hook beschikbaar in de extensie-API, maar de bovenstaande wegschrijflogica bevindt zich aan de Gateway-zijde (`src/auto-reply/reply/memory-flush.ts`, `src/auto-reply/reply/agent-runner-memory.ts`), niet in die hook.

## Controlelijst voor probleemoplossing

- **Verkeerde sessiesleutel?** Begin bij [/concepts/session](/nl/concepts/session) en bevestig de `sessionKey` in `/status`.
- **Verschil tussen opslag en transcript?** Bevestig de Gateway-host en het opslagpad uit `openclaw status`.
- **Overmatige Compaction?** Controleer het contextvenster van het model (een te klein venster dwingt frequente Compaction af), `reserveTokens` (een te hoge waarde voor het modelvenster veroorzaakt eerdere Compaction) en opgeblazen toolresultaten (stel het opschonen van sessies af).
- **Lijkt elke prompt op een klein lokaal model over te lopen?** Controleer of de provider het juiste contextvenster van het model rapporteert. OpenClaw kan de effectieve reserve alleen begrenzen wanneer dat venster bekend is.
- **Lekken stille beurten?** Controleer of het antwoord begint met het exacte stille token `NO_REPLY` (niet hoofdlettergevoelig) en of je een build gebruikt die de correctie voor streamingonderdrukking bevat (`2026.1.10`+).

## Gerelateerd

- [Sessiebeheer](/nl/concepts/session)
- [Sessies opschonen](/nl/concepts/session-pruning)
- [Context-engine](/nl/concepts/context-engine)
- [Referentie voor agentconfiguratie](/nl/gateway/config-agents)
