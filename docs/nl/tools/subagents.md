---
read_when:
    - Je wilt achtergrondwerk of parallel werk via de agent
    - Je wijzigt sessions_spawn of het beleid voor subagenttools
    - Je implementeert gespreksgebonden subagentsessies of lost er problemen mee op
sidebarTitle: Sub-agents
summary: Start geïsoleerde agentuitvoeringen op de achtergrond die resultaten terugmelden in de chat van de aanvrager
title: Subagenten
x-i18n:
    generated_at: "2026-05-07T01:54:39Z"
    model: gpt-5.5
    provider: openai
    source_hash: 901311ae7766640ff6991f66a63070fddef47d79ef5385d2c1af84be34a5140e
    source_path: tools/subagents.md
    workflow: 16
---

Subagents zijn achtergrond-agentruns die vanuit een bestaande agentrun worden gestart.
Ze draaien in hun eigen sessie (`agent:<agentId>:subagent:<uuid>`) en
**melden** hun resultaat na afloop terug aan het aanvragende chatkanaal.
Elke subagentrun wordt bijgehouden als een
[achtergrondtaak](/nl/automation/tasks).

Zie voor het beveiligingsmodel achter delegatie
[Multi-agent- en subagentgrenzen](/nl/gateway/security#multi-agent-and-sub-agent-boundaries).
Subagents zijn nuttige eenheden voor isolatie en workflows, maar ze zijn geen vijandige
multi-tenant-autorisatiegrens binnen één gedeelde Gateway.

Primaire doelen:

- Paralleliseer werk voor "onderzoek / lange taak / trage tool" zonder de hoofdrun te blokkeren.
- Houd subagents standaard geïsoleerd (sessiescheiding + optionele sandboxing).
- Houd het tooloppervlak moeilijk te misbruiken: subagents krijgen standaard **geen** sessietools.
- Ondersteun configureerbare nestdiepte voor orchestratorpatronen.

<Note>
**Kostenopmerking:** elke subagent heeft standaard een eigen context en tokengebruik.
Stel voor zware of repetitieve taken een goedkoper model in voor subagents
en houd je hoofdagent op een model van hogere kwaliteit. Configureer dit via
`agents.defaults.subagents.model` of per-agent overrides. Wanneer een child
    echt het huidige transcript van de aanvrager nodig heeft, kan de agent
    `context: "fork"` aanvragen voor die ene spawn. Thread-gebonden subagentsessies gebruiken standaard
    `context: "fork"` omdat ze het huidige gesprek vertakken naar een
    follow-up-thread.
</Note>

## Slashopdracht

Gebruik `/subagents` om subagentruns voor de **huidige sessie** te bekijken
of te beheren:

```text
/subagents list
/subagents kill <id|#|all>
/subagents log <id|#> [limit] [tools]
/subagents info <id|#>
/subagents send <id|#> <message>
/subagents steer <id|#> <message>
/subagents spawn <agentId> <task> [--model <model>] [--thinking <level>]
```

Gebruik de top-level [`/steer <message>`](/nl/tools/steer) om de actieve run van de huidige aanvragersessie bij te sturen. Gebruik `/subagents steer <id|#> <message>` wanneer het doel een child-run is.

`/subagents info` toont runmetadata (status, tijdstempels, sessie-id,
transcriptpad, opschoning). Gebruik `sessions_history` voor een begrensde,
veiligheidsgefilterde recall-weergave; inspecteer het transcriptpad op schijf wanneer je
het ruwe volledige transcript nodig hebt.

### Besturing voor thread-binding

Deze opdrachten werken op kanalen die persistente thread-bindings ondersteunen.
Zie [Kanalen met thread-ondersteuning](#thread-supporting-channels) hieronder.

```text
/focus <subagent-label|session-key|session-id|session-label>
/unfocus
/agents
/session idle <duration|off>
/session max-age <duration|off>
```

### Spawngedrag

`/subagents spawn` start een achtergrondsubagent als gebruikersopdracht (geen
interne relay) en stuurt één laatste voltooiingsupdate terug naar de
aanvragende chat wanneer de run is voltooid.

<AccordionGroup>
  <Accordion title="Non-blocking, push-based completion">
    - De spawnopdracht is niet-blokkerend; deze retourneert direct een run-id.
    - Bij voltooiing meldt de subagent een samenvatting/resultaatbericht terug aan het aanvragende chatkanaal.
    - Voltooiing is push-gebaseerd. Poll na het spawnen **niet** `/subagents list`, `sessions_list` of `sessions_history` in een lus alleen om te wachten tot de run klaar is; inspecteer status alleen op aanvraag voor debugging of ingrijpen.
    - Bij voltooiing sluit OpenClaw naar beste vermogen bijgehouden browsertabs/processen die door die subagentsessie zijn geopend voordat de announce-opschoningsflow doorgaat.

  </Accordion>
  <Accordion title="Manual-spawn delivery resilience">
    - OpenClaw probeert eerst directe `agent`-levering met een stabiele idempotentiesleutel.
    - Als de voltooiingsbeurt van de aanvrager-agent mislukt, geen zichtbare output produceert, of een duidelijk onvolledig prefix van het vastgelegde child-resultaat retourneert, valt OpenClaw terug op directe voltooiingslevering vanuit het vastgelegde child-resultaat.
    - Als directe levering niet kan worden gebruikt, valt het terug op routering via de wachtrij.
    - Als routering via de wachtrij nog steeds niet beschikbaar is, wordt de melding opnieuw geprobeerd met korte exponentiële backoff voordat definitief wordt opgegeven.
    - Voltooiingslevering behoudt de opgeloste aanvragerroute: thread-gebonden of gesprek-gebonden voltooiingsroutes winnen wanneer beschikbaar; als de voltooiingsoorsprong alleen een kanaal levert, vult OpenClaw het ontbrekende doel/account aan vanuit de opgeloste route van de aanvragersessie (`lastChannel` / `lastTo` / `lastAccountId`) zodat directe levering nog steeds werkt.

  </Accordion>
  <Accordion title="Completion handoff metadata">
    De voltooiingsoverdracht naar de aanvragersessie is runtime-gegenereerde
    interne context (geen door de gebruiker geschreven tekst) en bevat:

    - `Result` — nieuwste zichtbare `assistant`-antwoordtekst, anders opgeschoonde nieuwste tool-/toolResult-tekst. Terminale mislukte runs hergebruiken vastgelegde antwoordtekst niet.
    - `Status` — `completed successfully` / `failed` / `timed out` / `unknown`.
    - Compacte runtime-/tokenstatistieken.
    - Een leveringsinstructie die de aanvrager-agent vertelt in normale assistant-stem te herschrijven (niet ruwe interne metadata doorsturen).

  </Accordion>
  <Accordion title="Modes and ACP runtime">
    - `--model` en `--thinking` overriden de standaardwaarden voor die specifieke run.
    - Gebruik `info`/`log` om details en output na voltooiing te inspecteren.
    - `/subagents spawn` is one-shotmodus (`mode: "run"`). Gebruik voor persistente thread-gebonden sessies `sessions_spawn` met `thread: true` en `mode: "session"`.
    - Gebruik voor ACP-harnesssessies (Claude Code, Gemini CLI, OpenCode of expliciete Codex ACP/acpx) `sessions_spawn` met `runtime: "acp"` wanneer de tool die runtime adverteert. Zie [ACP-leveringsmodel](/nl/tools/acp-agents#delivery-model) bij het debuggen van voltooiingen of agent-naar-agent-lussen. Wanneer de `codex`-Plugin is ingeschakeld, moet Codex-chat-/threadbesturing de voorkeur geven aan `/codex ...` boven ACP, tenzij de gebruiker expliciet om ACP/acpx vraagt.
    - OpenClaw verbergt `runtime: "acp"` totdat ACP is ingeschakeld, de aanvrager niet in een sandbox draait en een backend-Plugin zoals `acpx` is geladen. `runtime: "acp"` verwacht een externe ACP-harness-id, of een `agents.list[]`-item met `runtime.type="acp"`; gebruik de standaard subagentruntime voor normale OpenClaw-configuratieagents uit `agents_list`.

  </Accordion>
</AccordionGroup>

## Contextmodi

Native subagents starten geïsoleerd, tenzij de aanroeper expliciet vraagt om het
huidige transcript te forken.

| Modus      | Wanneer gebruiken                                                                                                                      | Gedrag                                                                            |
| ---------- | -------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------- |
| `isolated` | Nieuw onderzoek, onafhankelijke implementatie, traag toolwerk, of alles wat in de taaktekst kan worden uitgelegd                        | Maakt een schoon child-transcript. Dit is de standaard en houdt tokengebruik lager. |
| `fork`     | Werk dat afhangt van het huidige gesprek, eerdere toolresultaten, of genuanceerde instructies die al aanwezig zijn in het aanvragertranscript | Vertakt het aanvragertranscript naar de child-sessie voordat de child start. |

Gebruik `fork` spaarzaam. Het is bedoeld voor contextgevoelige delegatie, niet als
vervanging voor het schrijven van een duidelijke taakprompt.

## Tool: `sessions_spawn`

Start een subagentrun met `deliver: false` op de globale `subagent`-lane,
voert daarna een announce-stap uit en plaatst het announce-antwoord in het
aanvragende chatkanaal.

Beschikbaarheid hangt af van het effectieve toolbeleid van de aanroeper. De profielen `coding` en
`full` stellen `sessions_spawn` standaard beschikbaar. Het profiel `messaging`
doet dat niet; voeg `tools.alsoAllow: ["sessions_spawn", "sessions_yield",
"subagents"]` toe of gebruik `tools.profile: "coding"` voor agents die werk moeten
delegeren. Kanaal-/groep-, provider-, sandbox- en per-agent allow-/deny-beleid kan
de tool na de profielstap nog steeds verwijderen. Gebruik `/tools` vanuit dezelfde
sessie om de effectieve toollijst te bevestigen.

**Standaarden:**

- **Model:** erft van de aanroeper tenzij je `agents.defaults.subagents.model` instelt (of per-agent `agents.list[].subagents.model`); een expliciete `sessions_spawn.model` wint nog steeds.
- **Thinking:** erft van de aanroeper tenzij je `agents.defaults.subagents.thinking` instelt (of per-agent `agents.list[].subagents.thinking`); een expliciete `sessions_spawn.thinking` wint nog steeds.
- **Run-timeout:** als `sessions_spawn.runTimeoutSeconds` wordt weggelaten, gebruikt OpenClaw `agents.defaults.subagents.runTimeoutSeconds` wanneer ingesteld; anders valt het terug op `0` (geen timeout).

### Toolparameters

<ParamField path="task" type="string" required>
  De taakbeschrijving voor de subagent.
</ParamField>
<ParamField path="label" type="string">
  Optioneel menselijk leesbaar label.
</ParamField>
<ParamField path="agentId" type="string">
  Spawn onder een andere agent-id wanneer toegestaan door `subagents.allowAgents`.
</ParamField>
<ParamField path="runtime" type='"subagent" | "acp"' default="subagent">
  `acp` is alleen voor externe ACP-harnassen (`claude`, `droid`, `gemini`, `opencode` of expliciet aangevraagde Codex ACP/acpx) en voor `agents.list[]`-items waarvan `runtime.type` `acp` is.
</ParamField>
<ParamField path="resumeSessionId" type="string">
  Alleen ACP. Hervat een bestaande ACP-harnesssessie wanneer `runtime: "acp"`; genegeerd voor native subagent-spawns.
</ParamField>
<ParamField path="streamTo" type='"parent"'>
  Alleen ACP. Streamt ACP-runoutput naar de parentsessie wanneer `runtime: "acp"`; laat weg voor native subagent-spawns.
</ParamField>
<ParamField path="model" type="string">
  Override het subagentmodel. Ongeldige waarden worden overgeslagen en de subagent draait op het standaardmodel met een waarschuwing in het toolresultaat.
</ParamField>
<ParamField path="thinking" type="string">
  Override het thinking-niveau voor de subagentrun.
</ParamField>
<ParamField path="runTimeoutSeconds" type="number">
  Gebruikt standaard `agents.defaults.subagents.runTimeoutSeconds` wanneer ingesteld, anders `0`. Wanneer ingesteld, wordt de subagentrun na N seconden afgebroken.
</ParamField>
<ParamField path="thread" type="boolean" default="false">
  Wanneer `true`, vraagt kanaalthread-binding aan voor deze subagentsessie.
</ParamField>
<ParamField path="mode" type='"run" | "session"' default="run">
  Als `thread: true` en `mode` is weggelaten, wordt de standaard `session`. `mode: "session"` vereist `thread: true`.
</ParamField>
<ParamField path="cleanup" type='"delete" | "keep"' default="keep">
  `"delete"` archiveert direct na announce (behoudt het transcript nog steeds via hernoemen).
</ParamField>
<ParamField path="sandbox" type='"inherit" | "require"' default="inherit">
  `require` weigert spawn tenzij de doel-child-runtime in een sandbox draait.
</ParamField>
<ParamField path="context" type='"isolated" | "fork"' default="isolated">
  `fork` vertakt het huidige transcript van de aanvrager naar de child-sessie. Alleen native subagents. Thread-gebonden spawns gebruiken standaard `fork`; niet-thread-spawns gebruiken standaard `isolated`.
</ParamField>

<Warning>
`sessions_spawn` accepteert **geen** kanaalleveringsparams (`target`,
`channel`, `to`, `threadId`, `replyTo`, `transport`). Gebruik voor levering
`message`/`sessions_send` vanuit de gespawnde run.
</Warning>

## Thread-gebonden sessies

Wanneer thread-bindings voor een kanaal zijn ingeschakeld, kan een subagent
aan een thread gebonden blijven zodat follow-up-gebruikersberichten in die thread
naar dezelfde subagentsessie blijven routeren.

### Kanalen met thread-ondersteuning

**Discord** is momenteel het enige ondersteunde kanaal. Het ondersteunt
persistente thread-gebonden subagentsessies (`sessions_spawn` met
`thread: true`), handmatige threadbesturing (`/focus`, `/unfocus`, `/agents`,
`/session idle`, `/session max-age`) en adaptersleutels
`channels.discord.threadBindings.enabled`,
`channels.discord.threadBindings.idleHours`,
`channels.discord.threadBindings.maxAgeHours` en
`channels.discord.threadBindings.spawnSessions`.

### Snelle flow

<Steps>
  <Step title="Starten">
    `sessions_spawn` met `thread: true` (en optioneel `mode: "session"`).
  </Step>
  <Step title="Koppelen">
    OpenClaw maakt of koppelt een thread aan dat sessiedoel in het actieve kanaal.
  </Step>
  <Step title="Vervolgen routeren">
    Antwoorden en vervolgberichten in die thread worden naar de gekoppelde sessie gerouteerd.
  </Step>
  <Step title="Time-outs inspecteren">
    Gebruik `/session idle` om automatische ontfocus bij inactiviteit te inspecteren/bij te werken en
    `/session max-age` om de harde limiet te beheren.
  </Step>
  <Step title="Loskoppelen">
    Gebruik `/unfocus` om handmatig los te koppelen.
  </Step>
</Steps>

### Handmatige bediening

| Opdracht           | Effect                                                                |
| ------------------ | --------------------------------------------------------------------- |
| `/focus <target>`  | Koppel de huidige thread (of maak er een) aan een subagent-/sessiedoel |
| `/unfocus`         | Verwijder de koppeling voor de huidige gekoppelde thread              |
| `/agents`          | Toon actieve runs en koppelingsstatus (`thread:<id>` of `unbound`)    |
| `/session idle`    | Inspecteer/update automatische ontfocus bij inactiviteit (alleen gefocuste gekoppelde threads) |
| `/session max-age` | Inspecteer/update harde limiet (alleen gefocuste gekoppelde threads)  |

### Configuratieschakelaars

- **Globale standaard:** `session.threadBindings.enabled`, `session.threadBindings.idleHours`, `session.threadBindings.maxAgeHours`.
- **Kanaaloverride en sleutels voor automatisch koppelen bij spawn** zijn adapterspecifiek. Zie [Kanalen met threadondersteuning](#thread-supporting-channels) hierboven.

Zie [Configuratiereferentie](/nl/gateway/configuration-reference) en
[Slash-opdrachten](/nl/tools/slash-commands) voor actuele adapterdetails.

### Toegestane lijst

<ParamField path="agents.list[].subagents.allowAgents" type="string[]">
  Lijst met agent-id's die via expliciete `agentId` kunnen worden gericht (`["*"]` staat alles toe). Standaard: alleen de aanvragende agent. Als je een lijst instelt en nog steeds wilt dat de aanvrager zichzelf met `agentId` spawnt, neem dan de requester-id op in de lijst.
</ParamField>
<ParamField path="agents.defaults.subagents.allowAgents" type="string[]">
  Standaard toegestane lijst voor doelagents die wordt gebruikt wanneer de aanvragende agent geen eigen `subagents.allowAgents` instelt.
</ParamField>
<ParamField path="agents.defaults.subagents.requireAgentId" type="boolean" default="false">
  Blokkeer `sessions_spawn`-aanroepen die `agentId` weglaten (forceert expliciete profielselectie). Override per agent: `agents.list[].subagents.requireAgentId`.
</ParamField>

Als de aanvragende sessie in een sandbox draait, weigert `sessions_spawn` doelen
die zonder sandbox zouden draaien.

### Discovery

Gebruik `agents_list` om te zien welke agent-id's momenteel zijn toegestaan voor
`sessions_spawn`. Het antwoord bevat het effectieve model van elke vermelde agent
en ingesloten runtime-metadata, zodat aanroepers PI, Codex
app-server en andere geconfigureerde native runtimes kunnen onderscheiden.

### Automatisch archiveren

- Subagentsessies worden automatisch gearchiveerd na `agents.defaults.subagents.archiveAfterMinutes` (standaard `60`).
- Archiveren gebruikt `sessions.delete` en hernoemt het transcript naar `*.deleted.<timestamp>` (dezelfde map).
- `cleanup: "delete"` archiveert direct na aankondiging (het transcript blijft behouden via hernoemen).
- Automatisch archiveren is best-effort; timers in afwachting gaan verloren als de Gateway opnieuw start.
- `runTimeoutSeconds` archiveert **niet** automatisch; het stopt alleen de run. De sessie blijft bestaan tot automatische archivering.
- Automatisch archiveren geldt gelijk voor diepte-1- en diepte-2-sessies.
- Browseropruiming staat los van archiefopruiming: bijgehouden browsertabs/processen worden best-effort gesloten wanneer de run eindigt, zelfs als het transcript-/sessierecord behouden blijft.

## Geneste subagents

Standaard kunnen subagents hun eigen subagents niet spawnen
(`maxSpawnDepth: 1`). Stel `maxSpawnDepth: 2` in om één niveau van
nesting in te schakelen — het **orchestratorpatroon**: hoofd → orchestrator-subagent →
worker-subsubagents.

```json5
{
  agents: {
    defaults: {
      subagents: {
        maxSpawnDepth: 2, // allow sub-agents to spawn children (default: 1)
        maxChildrenPerAgent: 5, // max active children per agent session (default: 5)
        maxConcurrent: 8, // global concurrency lane cap (default: 8)
        runTimeoutSeconds: 900, // default timeout for sessions_spawn when omitted (0 = no timeout)
      },
    },
  },
}
```

### Diepteniveaus

| Diepte | Vorm van sessiesleutel                       | Rol                                           | Kan spawnen?                 |
| ----- | -------------------------------------------- | --------------------------------------------- | ---------------------------- |
| 0     | `agent:<id>:main`                            | Hoofdagent                                    | Altijd                       |
| 1     | `agent:<id>:subagent:<uuid>`                 | Subagent (orchestrator wanneer diepte 2 is toegestaan) | Alleen als `maxSpawnDepth >= 2` |
| 2     | `agent:<id>:subagent:<uuid>:subagent:<uuid>` | Subsubagent (leaf-worker)                     | Nooit                        |

### Aankondigingsketen

Resultaten stromen terug omhoog door de keten:

1. Diepte-2-worker eindigt → kondigt aan bij de ouder (diepte-1-orchestrator).
2. Diepte-1-orchestrator ontvangt de aankondiging, synthetiseert resultaten, eindigt → kondigt aan bij main.
3. Hoofdagent ontvangt de aankondiging en levert deze aan de gebruiker.

Elk niveau ziet alleen aankondigingen van zijn directe kinderen.

<Note>
**Operationele richtlijn:** start child-work één keer en wacht op voltooiingsgebeurtenissen
in plaats van poll-lussen te bouwen rond `sessions_list`,
`sessions_history`, `/subagents list` of `exec`-sleepopdrachten.
`sessions_list` en `/subagents list` houden relaties tussen child-sessies
gericht op live werk — live kinderen blijven gekoppeld, beëindigde kinderen blijven
zichtbaar gedurende een korte recente periode, en verouderde store-only child-links worden
genegeerd na hun versheidsvenster. Dit voorkomt dat oude `spawnedBy`- /
`parentSessionKey`-metadata na een herstart ghost children opnieuw tot leven brengen.
Als een voltooiingsgebeurtenis van een child aankomt nadat je het
eindantwoord al hebt verzonden, is de juiste follow-up het exacte stille token
`NO_REPLY` / `no_reply`.
</Note>

### Toolbeleid per diepte

- Rol en beheerscope worden bij het spawnen in sessiemetadata geschreven. Daardoor kunnen platte of herstelde sessiesleutels niet per ongeluk opnieuw orchestratorrechten krijgen.
- **Diepte 1 (orchestrator, wanneer `maxSpawnDepth >= 2`):** krijgt `sessions_spawn`, `subagents`, `sessions_list`, `sessions_history` zodat deze zijn children kan beheren. Andere sessie-/systeemtools blijven geweigerd.
- **Diepte 1 (leaf, wanneer `maxSpawnDepth == 1`):** geen sessietools (huidig standaardgedrag).
- **Diepte 2 (leaf-worker):** geen sessietools — `sessions_spawn` wordt altijd geweigerd op diepte 2. Kan geen verdere children spawnen.

### Spawnlimiet per agent

Elke agentsessie (op elke diepte) kan maximaal `maxChildrenPerAgent`
(standaard `5`) actieve children tegelijk hebben. Dit voorkomt ongeremde fan-out
vanuit één orchestrator.

### Cascaderend stoppen

Het stoppen van een diepte-1-orchestrator stopt automatisch al zijn diepte-2
children:

- `/stop` in de hoofdchat stopt alle diepte-1-agents en cascadeert naar hun diepte-2-children.
- `/subagents kill <id>` stopt een specifieke subagent en cascadeert naar zijn children.
- `/subagents kill all` stopt alle subagents voor de aanvrager en cascadeert.

## Authenticatie

Authenticatie voor subagents wordt opgelost op **agent-id**, niet op sessietype:

- De sessiesleutel van de subagent is `agent:<agentId>:subagent:<uuid>`.
- De auth-store wordt geladen uit de `agentDir` van die agent.
- De auth-profielen van de hoofdagent worden samengevoegd als **fallback**; agentprofielen overschrijven hoofdprofielen bij conflicten.

De samenvoeging is additief, dus hoofdprofielen zijn altijd beschikbaar als
fallbacks. Volledig geïsoleerde auth per agent wordt nog niet ondersteund.

## Aankondigen

Subagents rapporteren terug via een aankondigingsstap:

- De aankondigingsstap draait binnen de subagentsessie (niet de aanvragersessie).
- Als de subagent exact `ANNOUNCE_SKIP` antwoordt, wordt er niets geplaatst.
- Als de nieuwste assistenttekst het exacte stille token `NO_REPLY` / `no_reply` is, wordt aankondigingsuitvoer onderdrukt, zelfs als er eerder zichtbare voortgang was.

Levering hangt af van de diepte van de aanvrager:

- Aanvragersessies op topniveau gebruiken een follow-up-`agent`-aanroep met externe levering (`deliver=true`).
- Geneste aanvragende subagentsessies ontvangen een interne follow-up-injectie (`deliver=false`) zodat de orchestrator child-resultaten binnen de sessie kan synthetiseren.
- Als een geneste aanvragende subagentsessie verdwenen is, valt OpenClaw terug op de aanvrager van die sessie wanneer beschikbaar.

Voor aanvragersessies op topniveau lost directe levering in voltooiingsmodus eerst
een eventueel gekoppelde conversatie-/threadroute en hook-override op, en vult daarna
ontbrekende kanaaldoelvelden vanuit de opgeslagen route van de aanvragersessie.
Dat houdt voltooiingen in de juiste chat/topic, zelfs wanneer de voltooiingsbron
alleen het kanaal identificeert.

Aggregatie van child-voltooiingen is gescoped tot de huidige run van de aanvrager bij het
bouwen van geneste voltooiingsbevindingen, zodat verouderde child-uitvoer uit eerdere runs
niet in de huidige aankondiging lekt. Aankondigingsantwoorden behouden
thread-/topicroutering wanneer die beschikbaar is op kanaaladapters.

### Aankondigingscontext

Aankondigingscontext wordt genormaliseerd naar een stabiel intern gebeurtenisblok:

| Veld           | Bron                                                                                                          |
| -------------- | ------------------------------------------------------------------------------------------------------------- |
| Bron           | `subagent` of `cron`                                                                                          |
| Sessie-id's    | Child-sessiesleutel/-id                                                                                       |
| Type           | Aankondigingstype + taaklabel                                                                                 |
| Status         | Afgeleid van runtime-uitkomst (`success`, `error`, `timeout` of `unknown`) — **niet** afgeleid uit modeltekst |
| Resultaatinhoud | Nieuwste zichtbare assistenttekst, anders opgeschoonde nieuwste tool-/toolResult-tekst                      |
| Follow-up      | Instructie die beschrijft wanneer te antwoorden versus stil te blijven                                        |

Terminale mislukte runs rapporteren de foutstatus zonder vastgelegde
antwoordtekst opnieuw af te spelen. Bij time-out kan een aankondiging, als de child
alleen tool-aanroepen heeft doorlopen, die geschiedenis samenvouwen tot een korte
samenvatting van gedeeltelijke voortgang in plaats van ruwe tool-uitvoer opnieuw af te spelen.

### Statistiekregel

Aankondigingspayloads bevatten aan het einde een statistiekregel (zelfs wanneer ingepakt):

- Runtime (bijv. `runtime 5m12s`).
- Tokengebruik (invoer/uitvoer/totaal).
- Geschatte kosten wanneer modelprijzen zijn geconfigureerd (`models.providers.*.models[].cost`).
- `sessionKey`, `sessionId` en transcriptpad zodat de hoofdagent geschiedenis kan ophalen via `sessions_history` of het bestand op schijf kan inspecteren.

Interne metadata is alleen bedoeld voor orchestration; gebruikersgerichte antwoorden
moeten worden herschreven in een normale assistentstem.

### Waarom `sessions_history` verkiezen

`sessions_history` is het veiligere orchestration-pad:

- Assistentherinnering wordt eerst genormaliseerd: thinking-tags verwijderd; `<relevant-memories>`- / `<relevant_memories>`-scaffolding verwijderd; plattetekst-XML-payloadblokken voor tool-aanroepen (`<tool_call>`, `<function_call>`, `<tool_calls>`, `<function_calls>`) verwijderd, inclusief afgekorte payloads die nooit netjes sluiten; gedegradeerde tool-call/result-scaffolding en historische-contextmarkers verwijderd; gelekte modelbesturingstokens (`<|assistant|>`, andere ASCII `<|...|>`, full-width `<｜...｜>`) verwijderd; misvormde MiniMax-tool-call-XML verwijderd.
- Tekst die op credentials/tokens lijkt, wordt geredigeerd.
- Lange blokken kunnen worden afgekapt.
- Zeer grote geschiedenissen kunnen oudere rijen laten vallen of een te grote rij vervangen door `[sessions_history omitted: message too large]`.
- Inspectie van het ruwe transcript op schijf is de fallback wanneer je het volledige byte-voor-byte-transcript nodig hebt.

## Toolbeleid

Subagents gebruiken eerst dezelfde profiel- en toolbeleids-pipeline als de bovenliggende of doelagent. Daarna past OpenClaw de beperkingslaag voor subagents toe.

Zonder beperkende `tools.profile` krijgen subagents **alle tools behalve sessietools** en systeemtools:

- `sessions_list`
- `sessions_history`
- `sessions_send`
- `sessions_spawn`

`sessions_history` blijft ook hier een begrensde, opgeschoonde herinneringsweergave — het is geen ruwe transcriptdump.

Wanneer `maxSpawnDepth >= 2`, krijgen depth-1 orchestrator-subagents daarnaast `sessions_spawn`, `subagents`, `sessions_list` en `sessions_history`, zodat ze hun kinderen kunnen beheren.

### Overschrijven via configuratie

```json5
{
  agents: {
    defaults: {
      subagents: {
        maxConcurrent: 1,
      },
    },
  },
  tools: {
    subagents: {
      tools: {
        // deny wins
        deny: ["gateway", "cron"],
        // if allow is set, it becomes allow-only (deny still wins)
        // allow: ["read", "exec", "process"]
      },
    },
  },
}
```

`tools.subagents.tools.allow` is een laatste allow-only-filter. Het kan de al opgeloste toolset beperken, maar het kan geen tool **terug toevoegen** die door `tools.profile` is verwijderd. Bijvoorbeeld: `tools.profile: "coding"` bevat `web_search`/`web_fetch`, maar niet de `browser`-tool. Om subagents met coding-profiel browserautomatisering te laten gebruiken, voeg je browser toe in de profielfase:

```json5
{
  tools: {
    profile: "coding",
    alsoAllow: ["browser"],
  },
}
```

Gebruik per agent `agents.list[].tools.alsoAllow: ["browser"]` wanneer slechts één agent browserautomatisering moet krijgen.

## Concurrency

Subagents gebruiken een speciale wachtrij-lane binnen hetzelfde proces:

- **Lane-naam:** `subagent`
- **Concurrency:** `agents.defaults.subagents.maxConcurrent` (standaard `8`)

## Liveness en herstel

OpenClaw behandelt het ontbreken van `endedAt` niet als permanent bewijs dat een subagent nog actief is. Niet-beëindigde runs die ouder zijn dan het venster voor verouderde runs tellen niet meer als actief/in behandeling in `/subagents list`, statusoverzichten, gating voor voltooiing van descendants en concurrency-controles per sessie.

Na het opnieuw opstarten van de Gateway worden herstelde verouderde niet-beëindigde runs opgeschoond, tenzij hun child-sessie is gemarkeerd als `abortedLastRun: true`. Die door herstart afgebroken child-sessies blijven herstelbaar via de orphan-herstelstroom voor subagents, die een synthetisch hervattingsbericht verstuurt voordat de aborted-marker wordt gewist.

Automatisch herstel na herstart is begrensd per child-sessie. Als hetzelfde subagent-child herhaaldelijk wordt geaccepteerd voor orphan-herstel binnen het snelle re-wedge-venster, bewaart OpenClaw een recovery-tombstone op die sessie en stopt het met automatisch hervatten bij latere herstarts. Voer `openclaw tasks maintenance --apply` uit om het taakrecord te reconciliëren, of `openclaw doctor --fix` om verouderde aborted-herstelvlaggen op tombstoned sessies te wissen.

<Note>
Als het spawnen van een subagent mislukt met Gateway `PAIRING_REQUIRED` / `scope-upgrade`, controleer dan de RPC-caller voordat je pairing state wijzigt. Interne `sessions_spawn`-coördinatie moet verbinden als `client.id: "gateway-client"` met `client.mode: "backend"` via directe local loopback shared-token/password-authenticatie; dat pad is niet afhankelijk van de gekoppelde-apparaat-scopebaseline van de CLI. Externe callers, expliciete `deviceIdentity`, expliciete device-token-paden en browser/Node-clients hebben nog steeds normale apparaatgoedkeuring nodig voor scope-upgrades.
</Note>

## Stoppen

- Het verzenden van `/stop` in de requester-chat breekt de requester-sessie af en stopt alle actieve subagent-runs die daaruit zijn gespawnd, met cascade naar geneste kinderen.
- `/subagents kill <id>` stopt een specifieke subagent en cascadeert naar zijn kinderen.

## Beperkingen

- Subagent-aankondiging is **best-effort**. Als de Gateway opnieuw opstart, gaat in behandeling zijnd "announce back"-werk verloren.
- Subagents delen nog steeds dezelfde Gateway-procesresources; behandel `maxConcurrent` als veiligheidsklep.
- `sessions_spawn` is altijd non-blocking: het retourneert onmiddellijk `{ status: "accepted", runId, childSessionKey }`.
- Subagent-context injecteert alleen `AGENTS.md` + `TOOLS.md` (geen `SOUL.md`, `IDENTITY.md`, `USER.md`, `HEARTBEAT.md` of `BOOTSTRAP.md`).
- Maximale nestingsdiepte is 5 (`maxSpawnDepth`-bereik: 1–5). Diepte 2 wordt aanbevolen voor de meeste usecases.
- `maxChildrenPerAgent` beperkt actieve kinderen per sessie (standaard `5`, bereik `1–20`).

## Gerelateerd

- [ACP-agents](/nl/tools/acp-agents)
- [Agent verzenden](/nl/tools/agent-send)
- [Achtergrondtaken](/nl/automation/tasks)
- [Multi-agent sandbox-tools](/nl/tools/multi-agent-sandbox-tools)
