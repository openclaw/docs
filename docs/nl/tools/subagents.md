---
read_when:
    - Je wilt werk op de achtergrond of parallel werk via de agent
    - Je wijzigt sessions_spawn of het toolbeleid voor subagents
    - Je implementeert threadgebonden subagentsessies of lost problemen ermee op
sidebarTitle: Sub-agents
summary: Start geïsoleerde agentruns op de achtergrond die resultaten terugmelden in de chat van de aanvrager
title: Subagenten
x-i18n:
    generated_at: "2026-05-11T20:54:48Z"
    model: gpt-5.5
    provider: openai
    source_hash: 02b03bdfd5cddf5618fddf0804f017400c36751095166dac18fa35fa3bfd4c6e
    source_path: tools/subagents.md
    workflow: 16
---

Subagenten zijn achtergrond-agentruns die vanuit een bestaande agentrun worden gestart.
Ze draaien in hun eigen sessie (`agent:<agentId>:subagent:<uuid>`) en
**kondigen**, wanneer ze klaar zijn, hun resultaat terug aan in het chatkanaal
van de aanvrager. Elke subagentrun wordt bijgehouden als een
[achtergrondtaak](/nl/automation/tasks).

Primaire doelen:

- "Onderzoek / lange taak / trage tool"-werk paralleliseren zonder de hoofdrun te blokkeren.
- Subagenten standaard geisoleerd houden (sessiescheiding + optionele sandboxing).
- Het tooloppervlak moeilijk te misbruiken houden: subagenten krijgen standaard **geen** sessietools.
- Configureerbare nestingsdiepte ondersteunen voor orchestrator-patronen.

<Note>
**Kostenopmerking:** elke subagent heeft standaard zijn eigen context en
tokengebruik. Stel voor zware of repetitieve taken een goedkoper model in
voor subagenten en houd je hoofdagent op een model van hogere kwaliteit.
Configureer dit via `agents.defaults.subagents.model` of per-agent overrides.
Wanneer een child werkelijk het huidige transcript van de aanvrager nodig
heeft, kan de agent `context: "fork"` aanvragen voor die ene spawn.
Threadgebonden subagentsessies gebruiken standaard `context: "fork"`, omdat
ze het huidige gesprek vertakken naar een vervolgdraad.
</Note>

## Slash-opdracht

Gebruik `/subagents` om subagentruns voor de **huidige sessie** te inspecteren
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

Gebruik top-level [`/steer <message>`](/nl/tools/steer) om de actieve run van de huidige aanvraagsessie bij te sturen. Gebruik `/subagents steer <id|#> <message>` wanneer het doel een child-run is.

`/subagents info` toont runmetadata (status, tijdstempels, sessie-id,
transcriptpad, opschoning). Gebruik `sessions_history` voor een begrensde,
veiligheidsgefilterde herinneringsweergave; inspecteer het transcriptpad op
schijf wanneer je het ruwe volledige transcript nodig hebt.

### Besturing voor threadbinding

Deze opdrachten werken op kanalen die persistente threadbindingen ondersteunen.
Zie [Kanalen met threadondersteuning](#thread-supporting-channels) hieronder.

```text
/focus <subagent-label|session-key|session-id|session-label>
/unfocus
/agents
/session idle <duration|off>
/session max-age <duration|off>
```

### Spawngedrag

`/subagents spawn` start een achtergrondsubagent als gebruikersopdracht (niet
als interne relay) en stuurt een laatste voltooiingsupdate terug naar de
aanvragerschat wanneer de run klaar is.

<AccordionGroup>
  <Accordion title="Niet-blokkerende, push-gebaseerde voltooiing">
    - De spawnopdracht is niet-blokkerend; deze retourneert onmiddellijk een run-id.
    - Bij voltooiing kondigt de subagent een samenvatting/resultaatbericht aan terug naar het chatkanaal van de aanvrager.
    - Agentbeurten die child-resultaten nodig hebben, moeten na het starten van vereist werk `sessions_yield` aanroepen. Dat beeindigt de huidige beurt en laat voltooiingsgebeurtenissen binnenkomen als het volgende voor het model zichtbare bericht.
    - Voltooiing is push-gebaseerd. Poll na het starten **niet** `/subagents list`, `sessions_list` of `sessions_history` in een lus alleen om te wachten tot het klaar is; inspecteer de status alleen op aanvraag voor debugging of interventie.
    - Child-uitvoer is een rapport/bewijs voor de aanvragende agent om te synthetiseren. Het is geen door de gebruiker geschreven instructietekst en kan systeem-, developer- of gebruikersbeleid niet overschrijven.
    - Bij voltooiing sluit OpenClaw naar beste vermogen bijgehouden browsertabs/processen die door die subagentsessie zijn geopend voordat de aankondigingsopschoningsflow doorgaat.

  </Accordion>
  <Accordion title="Veerkracht van levering bij handmatige spawn">
    - OpenClaw geeft voltooiingen terug aan de aanvraagsessie via een `agent`-beurt met een stabiele idempotentiesleutel.
    - Als de aanvraagsrun nog actief is, probeert OpenClaw eerst die run te wekken/bij te sturen in plaats van een tweede zichtbaar antwoordpad te starten.
    - Als de overdracht van de voltooiing naar de aanvragersagent mislukt of geen zichtbare uitvoer produceert, behandelt OpenClaw de levering als mislukt en valt het terug op wachtrijroutering/opnieuw proberen. Het stuurt het child-resultaat niet rauw rechtstreeks naar de externe chat.
    - Als directe overdracht niet kan worden gebruikt, valt het terug op wachtrijroutering.
    - Als wachtrijroutering nog steeds niet beschikbaar is, wordt de aankondiging opnieuw geprobeerd met korte exponentiele backoff voordat definitief wordt opgegeven.
    - Voltooiingslevering behoudt de opgeloste aanvragersroute: threadgebonden of gespreksgebonden voltooiingsroutes winnen wanneer beschikbaar; als de voltooiingsoorsprong alleen een kanaal levert, vult OpenClaw het ontbrekende doel/account in vanuit de opgeloste route van de aanvraagsessie (`lastChannel` / `lastTo` / `lastAccountId`), zodat directe levering nog steeds werkt.

  </Accordion>
  <Accordion title="Metadata voor voltooiingsoverdracht">
    De voltooiingsoverdracht naar de aanvraagsessie is runtime-gegenereerde
    interne context (geen door de gebruiker geschreven tekst) en omvat:

    - `Result` — nieuwste zichtbare `assistant`-antwoordtekst, anders opgeschoonde nieuwste tool/toolResult-tekst. Terminale mislukte runs hergebruiken geen vastgelegde antwoordtekst.
    - `Status` — `completed successfully` / `failed` / `timed out` / `unknown`.
    - Compacte runtime-/tokenstatistieken.
    - Een leveringsinstructie die de aanvragende agent vertelt om in normale assistant-stem te herschrijven (niet rauwe interne metadata door te sturen).

  </Accordion>
  <Accordion title="Modi en ACP-runtime">
    - `--model` en `--thinking` overschrijven standaarden voor die specifieke run.
    - Gebruik `info`/`log` om details en uitvoer na voltooiing te inspecteren.
    - `/subagents spawn` is eenmalige modus (`mode: "run"`). Gebruik voor persistente threadgebonden sessies `sessions_spawn` met `thread: true` en `mode: "session"`.
    - Gebruik voor ACP-harness-sessies (Claude Code, Gemini CLI, OpenCode, of expliciete Codex ACP/acpx) `sessions_spawn` met `runtime: "acp"` wanneer de tool die runtime adverteert. Zie [ACP-leveringsmodel](/nl/tools/acp-agents#delivery-model) bij het debuggen van voltooiingen of agent-naar-agent-lussen. Wanneer de `codex` Plugin is ingeschakeld, moet Codex-chat-/threadbesturing de voorkeur geven aan `/codex ...` boven ACP, tenzij de gebruiker expliciet om ACP/acpx vraagt.
    - OpenClaw verbergt `runtime: "acp"` totdat ACP is ingeschakeld, de aanvrager niet is gesandboxed en een backend-Plugin zoals `acpx` is geladen. `runtime: "acp"` verwacht een externe ACP-harness-id, of een `agents.list[]`-vermelding met `runtime.type="acp"`; gebruik de standaard subagentruntime voor normale OpenClaw-configuratieagenten uit `agents_list`.

  </Accordion>
</AccordionGroup>

## Contextmodi

Native subagenten starten geisoleerd, tenzij de aanroeper expliciet vraagt om
het huidige transcript te forken.

| Modus      | Wanneer je deze gebruikt                                                                                                                | Gedrag                                                                            |
| ---------- | ---------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------- |
| `isolated` | Nieuw onderzoek, onafhankelijke implementatie, traag toolwerk, of alles wat in de taaktekst kan worden gebriefd                           | Maakt een schoon child-transcript. Dit is de standaard en houdt tokengebruik lager. |
| `fork`     | Werk dat afhangt van het huidige gesprek, eerdere toolresultaten, of genuanceerde instructies die al in het transcript van de aanvrager staan | Vertakt het transcript van de aanvrager naar de child-sessie voordat de child start. |

Gebruik `fork` spaarzaam. Het is bedoeld voor contextgevoelige delegatie, niet
als vervanging voor het schrijven van een duidelijke taakprompt.

## Tool: `sessions_spawn`

Start een subagentrun met `deliver: false` op de globale `subagent`-lane,
voert daarna een aankondigingsstap uit en plaatst het aankondigingsantwoord in
het chatkanaal van de aanvrager.

Beschikbaarheid hangt af van het effectieve toolbeleid van de aanroeper. De
profielen `coding` en `full` stellen `sessions_spawn` standaard beschikbaar.
Het profiel `messaging` doet dat niet; voeg `tools.alsoAllow: ["sessions_spawn", "sessions_yield",
"subagents"]` toe of gebruik `tools.profile: "coding"` voor agenten die werk
moeten delegeren. Kanaal-/groeps-, provider-, sandbox- en per-agent
allow/deny-beleid kunnen de tool na de profielfase nog steeds verwijderen.
Gebruik `/tools` vanuit dezelfde sessie om de effectieve toollijst te bevestigen.

**Standaarden:**

- **Model:** erft van de aanroeper tenzij je `agents.defaults.subagents.model` instelt (of per-agent `agents.list[].subagents.model`); een expliciete `sessions_spawn.model` wint nog steeds.
- **Thinking:** erft van de aanroeper tenzij je `agents.defaults.subagents.thinking` instelt (of per-agent `agents.list[].subagents.thinking`); een expliciete `sessions_spawn.thinking` wint nog steeds.
- **Run-time-out:** als `sessions_spawn.runTimeoutSeconds` wordt weggelaten, gebruikt OpenClaw `agents.defaults.subagents.runTimeoutSeconds` wanneer ingesteld; anders valt het terug op `0` (geen time-out).

### Delegatiepromptmodus

`agents.defaults.subagents.delegationMode` bestuurt alleen promptbegeleiding; het wijzigt het toolbeleid niet en dwingt geen delegatie af.

- `suggest` (standaard): behoud de standaard promptnudging om subagenten te gebruiken voor groter of trager werk.
- `prefer`: vertel de hoofdagent om responsief te blijven en alles wat uitgebreider is dan een direct antwoord via `sessions_spawn` te delegeren.

Per-agent overrides gebruiken `agents.list[].subagents.delegationMode`.

```json5
{
  agents: {
    defaults: {
      subagents: {
        delegationMode: "prefer",
        maxConcurrent: 4,
      },
    },
    list: [
      {
        id: "coordinator",
        subagents: { delegationMode: "prefer" },
      },
    ],
  },
}
```

### Toolparameters

<ParamField path="task" type="string" required>
  De taakbeschrijving voor de sub-agent.
</ParamField>
<ParamField path="taskName" type="string">
  Optionele stabiele handle voor latere `subagents`-targeting. Moet overeenkomen met `[a-z][a-z0-9_]{0,63}` en mag geen gereserveerde targets zijn, zoals `last` of `all`. Gebruik dit bij voorkeur wanneer de coördinator later mogelijk een specifiek kind moet sturen, beëindigen of identificeren na het spawnen van meerdere kinderen.
</ParamField>
<ParamField path="label" type="string">
  Optioneel menselijk leesbaar label.
</ParamField>
<ParamField path="agentId" type="string">
  Spawn onder een andere agent-id wanneer toegestaan door `subagents.allowAgents`.
</ParamField>
<ParamField path="runtime" type='"subagent" | "acp"' default="subagent">
  `acp` is alleen voor externe ACP-harnassen (`claude`, `droid`, `gemini`, `opencode`, of expliciet aangevraagde Codex ACP/acpx) en voor `agents.list[]`-items waarvan `runtime.type` `acp` is.
</ParamField>
<ParamField path="resumeSessionId" type="string">
  Alleen ACP. Hervat een bestaande ACP-harnassessie wanneer `runtime: "acp"`; genegeerd voor native sub-agent-spawns.
</ParamField>
<ParamField path="streamTo" type='"parent"'>
  Alleen ACP. Streamt ACP-runuitvoer naar de bovenliggende sessie wanneer `runtime: "acp"`; laat weg voor native sub-agent-spawns.
</ParamField>
<ParamField path="model" type="string">
  Overschrijf het sub-agentmodel. Ongeldige waarden worden overgeslagen en de sub-agent draait op het standaardmodel met een waarschuwing in het toolresultaat.
</ParamField>
<ParamField path="thinking" type="string">
  Overschrijf het denkniveau voor de sub-agentrun.
</ParamField>
<ParamField path="runTimeoutSeconds" type="number">
  Standaard `agents.defaults.subagents.runTimeoutSeconds` wanneer ingesteld, anders `0`. Wanneer ingesteld, wordt de sub-agentrun na N seconden afgebroken.
</ParamField>
<ParamField path="thread" type="boolean" default="false">
  Wanneer `true`, vraagt dit om kanaalthreadbinding voor deze sub-agentsessie.
</ParamField>
<ParamField path="mode" type='"run" | "session"' default="run">
  Als `thread: true` en `mode` is weggelaten, wordt de standaard `session`. `mode: "session"` vereist `thread: true`.
</ParamField>
<ParamField path="cleanup" type='"delete" | "keep"' default="keep">
  `"delete"` archiveert direct na aankondiging (bewaart het transcript nog steeds via hernoeming).
</ParamField>
<ParamField path="sandbox" type='"inherit" | "require"' default="inherit">
  `require` wijst spawnen af tenzij de doel-kindruntime in een sandbox draait.
</ParamField>
<ParamField path="context" type='"isolated" | "fork"' default="isolated">
  `fork` vertakt het huidige transcript van de aanvrager naar de kindsessie. Alleen native sub-agents. Threadgebonden spawns gebruiken standaard `fork`; niet-threadspawns gebruiken standaard `isolated`.
</ParamField>

<Warning>
`sessions_spawn` accepteert **geen** kanaalbezorgingsparams (`target`,
`channel`, `to`, `threadId`, `replyTo`, `transport`). Gebruik voor bezorging
`message`/`sessions_send` vanuit de gespawnde run.
</Warning>

### Taaknamen en targeting

`taskName` is een modelgerichte handle voor orkestratie, geen sessiesleutel.
Gebruik dit voor stabiele kindnamen zoals `review_subagents`,
`linux_validation` of `docs_update` wanneer een coördinator dat kind later
mogelijk moet sturen of beëindigen.

Targetresolutie accepteert exacte `taskName`-overeenkomsten en ondubbelzinnige
prefixen. Matching is beperkt tot hetzelfde actieve/recente targetvenster dat
wordt gebruikt door genummerde `/subagents`-targets, zodat een verouderd voltooid
kind een hergebruikte handle niet ambigu maakt. Als twee actieve of recente
kinderen dezelfde `taskName` delen, is de target ambigu; gebruik in plaats
daarvan de lijstindex, sessiesleutel of run-id.

De gereserveerde targets `last` en `all` zijn geen geldige `taskName`-waarden,
omdat ze al besturingsbetekenissen hebben.

## Tool: `sessions_yield`

Beëindigt de huidige modelbeurt en wacht tot runtime-events, vooral
voltooiingsevents van sub-agents, als het volgende bericht binnenkomen. Gebruik
dit na het spawnen van vereist kindwerk wanneer de aanvrager geen definitief
antwoord kan produceren totdat die voltooiingen zijn binnengekomen.

`sessions_yield` is de wachtprimitive. Vervang dit niet door pollingloops over
`subagents`, `sessions_list`, `sessions_history`, shell-`sleep` of procespolling
alleen om kindvoltooiing te detecteren.

Gebruik `sessions_yield` alleen wanneer de effectieve toollijst van de sessie
dit bevat. Sommige minimale of aangepaste toolprofielen kunnen `sessions_spawn`
en `subagents` tonen zonder `sessions_yield` te tonen; verzin in dat geval geen
pollingloop alleen om op voltooiing te wachten.

Wanneer er actieve kinderen bestaan, injecteert OpenClaw een compact, door de
runtime gegenereerd `Active Subagents`-promptblok in normale beurten, zodat de
aanvrager de huidige kindsessies, run-id's, statussen, labels, taken en
`taskName`-aliassen kan zien zonder polling. De taak- en labelvelden in dat blok
worden als data geciteerd, niet als instructies, omdat ze afkomstig kunnen zijn
uit door gebruiker/model opgegeven spawnargumenten.

## Tool: `subagents`

Toont, stuurt of beëindigt gespawnde sub-agentruns die eigendom zijn van de
aanvragersessie. Dit is beperkt tot de huidige aanvrager; een kind kan alleen
zijn eigen beheerde kinderen zien/beheren.

Gebruik `subagents` voor status op aanvraag, debugging, sturen of beëindigen.
Gebruik `sessions_yield` om op voltooiingsevents te wachten.

## Threadgebonden sessies

Wanneer threadbindingen zijn ingeschakeld voor een kanaal, kan een sub-agent
gebonden blijven aan een thread, zodat vervolgberichten van gebruikers in die
thread naar dezelfde sub-agentsessie blijven routeren.

### Kanalen met threadondersteuning

**Discord** is momenteel het enige ondersteunde kanaal. Het ondersteunt
persistente threadgebonden sub-agentsessies (`sessions_spawn` met
`thread: true`), handmatige threadbesturing (`/focus`, `/unfocus`, `/agents`,
`/session idle`, `/session max-age`) en adaptersleutels
`channels.discord.threadBindings.enabled`,
`channels.discord.threadBindings.idleHours`,
`channels.discord.threadBindings.maxAgeHours` en
`channels.discord.threadBindings.spawnSessions`.

### Snelle flow

<Steps>
  <Step title="Spawnen">
    `sessions_spawn` met `thread: true` (en optioneel `mode: "session"`).
  </Step>
  <Step title="Binden">
    OpenClaw maakt een thread aan of bindt een thread aan die sessietarget in het actieve kanaal.
  </Step>
  <Step title="Vervolgberichten routeren">
    Antwoorden en vervolgberichten in die thread worden naar de gebonden sessie gerouteerd.
  </Step>
  <Step title="Time-outs inspecteren">
    Gebruik `/session idle` om automatische unfocus bij inactiviteit te inspecteren/bij te werken en
    `/session max-age` om de harde limiet te beheren.
  </Step>
  <Step title="Loskoppelen">
    Gebruik `/unfocus` om handmatig los te koppelen.
  </Step>
</Steps>

### Handmatige besturing

| Opdracht           | Effect                                                                |
| ------------------ | --------------------------------------------------------------------- |
| `/focus <target>`  | Bind de huidige thread (of maak er een aan) aan een sub-agent-/sessietarget |
| `/unfocus`         | Verwijder de binding voor de huidige gebonden thread                  |
| `/agents`          | Toon actieve runs en bindingsstatus (`thread:<id>` of `unbound`)      |
| `/session idle`    | Inspecteer/update automatische unfocus bij inactiviteit (alleen gefocuste gebonden threads) |
| `/session max-age` | Inspecteer/update harde limiet (alleen gefocuste gebonden threads)    |

### Configuratieschakelaars

- **Globale standaard:** `session.threadBindings.enabled`, `session.threadBindings.idleHours`, `session.threadBindings.maxAgeHours`.
- **Kanaaloverride- en spawn-autobindingsleutels** zijn adapterspecifiek. Zie [Kanalen met threadondersteuning](#thread-supporting-channels) hierboven.

Zie [Configuratiereferentie](/nl/gateway/configuration-reference) en
[Slash commands](/nl/tools/slash-commands) voor actuele adapterdetails.

### Allowlist

<ParamField path="agents.list[].subagents.allowAgents" type="string[]">
  Lijst met agent-id's die via expliciete `agentId` kunnen worden getarget (`["*"]` staat alles toe). Standaard: alleen de aanvragende agent. Als u een lijst instelt en nog steeds wilt dat de aanvrager zichzelf spawnt met `agentId`, neem dan de aanvrager-id op in de lijst.
</ParamField>
<ParamField path="agents.defaults.subagents.allowAgents" type="string[]">
  Standaard allowlist voor doelagents die wordt gebruikt wanneer de aanvragende agent geen eigen `subagents.allowAgents` instelt.
</ParamField>
<ParamField path="agents.defaults.subagents.requireAgentId" type="boolean" default="false">
  Blokkeer `sessions_spawn`-aanroepen die `agentId` weglaten (dwingt expliciete profielselectie af). Override per agent: `agents.list[].subagents.requireAgentId`.
</ParamField>
<ParamField path="agents.defaults.subagents.announceTimeoutMs" type="number" default="120000">
  Time-out per aanroep voor Gateway-`agent`-aankondigingsbezorgingspogingen. Waarden zijn positieve gehele milliseconden en worden begrensd op het platformveilige timermaximum. Tijdelijke retries kunnen de totale aankondigingswachttijd langer maken dan één geconfigureerde time-out.
</ParamField>

Als de aanvragersessie in een sandbox draait, wijst `sessions_spawn` targets af
die zonder sandbox zouden draaien.

### Ontdekking

Gebruik `agents_list` om te zien welke agent-id's momenteel zijn toegestaan voor
`sessions_spawn`. Het antwoord bevat het effectieve model en ingesloten
runtimemetadata van elke vermelde agent, zodat callers onderscheid kunnen maken
tussen PI, Codex-appserver en andere geconfigureerde native runtimes.

### Automatisch archiveren

- Sub-agentsessies worden automatisch gearchiveerd na `agents.defaults.subagents.archiveAfterMinutes` (standaard `60`).
- Archiveren gebruikt `sessions.delete` en hernoemt het transcript naar `*.deleted.<timestamp>` (dezelfde map).
- `cleanup: "delete"` archiveert direct na aankondiging (bewaart het transcript nog steeds via hernoeming).
- Automatisch archiveren is best-effort; wachtende timers gaan verloren als de Gateway opnieuw start.
- `runTimeoutSeconds` archiveert **niet** automatisch; het stopt alleen de run. De sessie blijft bestaan tot automatisch archiveren.
- Automatisch archiveren geldt zowel voor diepte-1- als diepte-2-sessies.
- Browseropschoning staat los van archiefopschoning: bijgehouden browsertabs/-processen worden best-effort gesloten wanneer de run klaar is, zelfs als het transcript/de sessierecord behouden blijft.

## Geneste sub-agents

Standaard kunnen sub-agents hun eigen sub-agents niet spawnen
(`maxSpawnDepth: 1`). Stel `maxSpawnDepth: 2` in om één niveau nesting in te
schakelen — het **orkestratorpatroon**: main → orkestrator-sub-agent →
worker-sub-sub-agents.

```json5
{
  agents: {
    defaults: {
      subagents: {
        maxSpawnDepth: 2, // sta toe dat sub-agents kinderen spawnen (standaard: 1)
        maxChildrenPerAgent: 5, // max. actieve kinderen per agentsessie (standaard: 5)
        maxConcurrent: 8, // globale limiet voor gelijktijdige lanes (standaard: 8)
        runTimeoutSeconds: 900, // standaardtime-out voor sessions_spawn wanneer weggelaten (0 = geen time-out)
        announceTimeoutMs: 120000, // Gateway-aankondigingstime-out per aanroep
      },
    },
  },
}
```

### Diepteniveaus

| Diepte | Vorm van sessiesleutel                       | Rol                                          | Kan spawnen?                 |
| ----- | -------------------------------------------- | --------------------------------------------- | ---------------------------- |
| 0     | `agent:<id>:main`                            | Hoofdagent                                   | Altijd                       |
| 1     | `agent:<id>:subagent:<uuid>`                 | Sub-agent (orkestrator wanneer diepte 2 is toegestaan) | Alleen als `maxSpawnDepth >= 2` |
| 2     | `agent:<id>:subagent:<uuid>:subagent:<uuid>` | Sub-sub-agent (leaf worker)                  | Nooit                        |

### Aankondigingsketen

Resultaten stromen terug omhoog door de keten:

1. Diepte-2-worker eindigt → kondigt aan bij zijn ouder (diepte-1-orkestrator).
2. Diepte-1-orkestrator ontvangt de aankondiging, synthetiseert resultaten, eindigt → kondigt aan bij main.
3. Hoofdagent ontvangt de aankondiging en bezorgt deze aan de gebruiker.

Elk niveau ziet alleen aankondigingen van zijn directe kinderen.

<Note>
**Operationele richtlijn:** start onderliggend werk eenmaal en wacht op voltooiingsgebeurtenissen in plaats van poll-lussen te bouwen rond `sessions_list`, `sessions_history`, `/subagents list` of `exec`-slaapopdrachten. `sessions_list` en `/subagents list` houden relaties tussen onderliggende sessies gericht op live werk: live onderliggende sessies blijven gekoppeld, beëindigde onderliggende sessies blijven kort zichtbaar in een recent venster, en verouderde koppelingen naar onderliggende sessies die alleen in de opslag staan, worden na hun versheidsvenster genegeerd. Dit voorkomt dat oude `spawnedBy`- / `parentSessionKey`-metadata spookonderliggende sessies na een herstart opnieuw tot leven wekken. Als een voltooiingsgebeurtenis van een onderliggende sessie aankomt nadat je het definitieve antwoord al hebt verzonden, is de juiste opvolging het exacte stille token `NO_REPLY` / `no_reply`.
</Note>

### Toolbeleid per diepte

- Rol en besturingsscope worden bij het spawnen in sessiemetadata geschreven. Dat voorkomt dat vlakke of herstelde sessiesleutels per ongeluk opnieuw orkestratorrechten krijgen.
- **Diepte 1 (orkestrator, wanneer `maxSpawnDepth >= 2`):** krijgt `sessions_spawn`, `subagents`, `sessions_list`, `sessions_history`, zodat deze zijn onderliggende sessies kan beheren. Andere sessie-/systeemtools blijven geweigerd.
- **Diepte 1 (blad, wanneer `maxSpawnDepth == 1`):** geen sessietools (huidig standaardgedrag).
- **Diepte 2 (bladwerker):** geen sessietools: `sessions_spawn` wordt altijd geweigerd op diepte 2. Kan geen verdere onderliggende sessies spawnen.

### Spawnlimiet per agent

Elke agentsessie (op elke diepte) kan op elk moment maximaal `maxChildrenPerAgent` (standaard `5`) actieve onderliggende sessies hebben. Dit voorkomt onbeheersbare fan-out vanuit één orkestrator.

### Cascaderende stop

Het stoppen van een orkestrator op diepte 1 stopt automatisch al diens onderliggende sessies op diepte 2:

- `/stop` in de hoofdchat stopt alle agents op diepte 1 en cascadeert naar hun onderliggende sessies op diepte 2.
- `/subagents kill <id>` stopt een specifieke subagent en cascadeert naar diens onderliggende sessies.
- `/subagents kill all` stopt alle subagents voor de aanvrager en cascadeert.

## Authenticatie

Authenticatie voor subagents wordt opgelost op basis van **agent-id**, niet op basis van sessietype:

- De sessiesleutel van de subagent is `agent:<agentId>:subagent:<uuid>`.
- De authenticatieopslag wordt geladen uit de `agentDir` van die agent.
- De authenticatieprofielen van de hoofdagent worden samengevoegd als **fallback**; agentprofielen overschrijven hoofdprofielen bij conflicten.

De samenvoeging is additief, dus hoofdprofielen zijn altijd beschikbaar als fallbacks. Volledig geïsoleerde authenticatie per agent wordt nog niet ondersteund.

## Aankondiging

Subagents rapporteren terug via een aankondigingsstap:

- De aankondigingsstap draait binnen de subagentsessie (niet de sessie van de aanvrager).
- Als de subagent exact `ANNOUNCE_SKIP` antwoordt, wordt er niets geplaatst.
- Als de nieuwste assistenttekst het exacte stille token `NO_REPLY` / `no_reply` is, wordt aankondigingsuitvoer onderdrukt, zelfs als er eerder zichtbare voortgang was.

Levering hangt af van de diepte van de aanvrager:

- Sessies van aanvragers op topniveau gebruiken een vervolgaanroep naar `agent` met externe levering (`deliver=true`).
- Geneste subagentsessies van aanvragers ontvangen een interne vervolginjectie (`deliver=false`), zodat de orkestrator onderliggende resultaten binnen de sessie kan synthetiseren.
- Als een geneste subagentsessie van een aanvrager verdwenen is, valt OpenClaw terug op de aanvrager van die sessie wanneer die beschikbaar is.

Voor sessies van aanvragers op topniveau lost directe levering in voltooiingsmodus eerst eventuele gebonden gespreks-/threadroutes en hook-overschrijvingen op, en vult daarna ontbrekende kanaaldoelvelden in vanuit de opgeslagen route van de aanvragersessie. Zo blijven voltooiingen in de juiste chat/topic, zelfs wanneer de voltooiingsoorsprong alleen het kanaal identificeert.

Aggregatie van voltooiingen van onderliggende sessies wordt bij het bouwen van geneste voltooiingsbevindingen beperkt tot de huidige run van de aanvrager, zodat verouderde uitvoer van onderliggende sessies uit eerdere runs niet in de huidige aankondiging lekt. Aankondigingsantwoorden behouden thread-/topicroutering wanneer die beschikbaar is op kanaaladapters.

### Aankondigingscontext

Aankondigingscontext wordt genormaliseerd naar een stabiel intern gebeurtenisblok:

| Veld           | Bron                                                                                                                        |
| -------------- | --------------------------------------------------------------------------------------------------------------------------- |
| Bron           | `subagent` of `cron`                                                                                                        |
| Sessie-id's    | Sessiesleutel/-id van onderliggende sessie                                                                                  |
| Type           | Aankondigingstype + taaklabel                                                                                               |
| Status         | Afgeleid van runtime-uitkomst (`success`, `error`, `timeout` of `unknown`) — **niet** afgeleid uit modeltekst               |
| Resultaatinhoud | Nieuwste zichtbare assistenttekst, anders opgeschoonde nieuwste tool-/toolResult-tekst                                    |
| Opvolging      | Instructie die beschrijft wanneer te antwoorden versus stil te blijven                                                       |

Terminaal mislukte runs rapporteren de foutstatus zonder vastgelegde antwoordtekst opnieuw af te spelen. Bij een time-out kan de aankondiging, als de onderliggende sessie alleen tot en met toolaanroepen kwam, die geschiedenis samenvouwen tot een korte samenvatting van gedeeltelijke voortgang in plaats van ruwe tooluitvoer opnieuw af te spelen.

### Statistiekregel

Aankondigingspayloads bevatten aan het einde een statistiekregel (ook wanneer ingepakt):

- Runtime (bijv. `runtime 5m12s`).
- Tokengebruik (invoer/uitvoer/totaal).
- Geschatte kosten wanneer modelprijzen zijn geconfigureerd (`models.providers.*.models[].cost`).
- `sessionKey`, `sessionId` en transcriptpad, zodat de hoofdagent de geschiedenis kan ophalen via `sessions_history` of het bestand op schijf kan inspecteren.

Interne metadata is alleen bedoeld voor orkestratie; gebruikersgerichte antwoorden moeten worden herschreven in normale assistentstem.

### Waarom `sessions_history` de voorkeur heeft

`sessions_history` is het veiligere orkestratiepad:

- Assistentherinnering wordt eerst genormaliseerd: denktags worden gestript; `<relevant-memories>`- / `<relevant_memories>`-scaffolding wordt gestript; XML-payloadblokken voor toolaanroepen in platte tekst (`<tool_call>`, `<function_call>`, `<tool_calls>`, `<function_calls>`) worden gestript, inclusief afgekorte payloads die niet netjes sluiten; gedegradeerde scaffolding voor toolaanroepen/-resultaten en historische-contextmarkeringen worden gestript; gelekte modelbesturingstokens (`<|assistant|>`, andere ASCII-`<|...|>`, volledige-breedte-`<｜...｜>`) worden gestript; misvormde MiniMax-toolaanroep-XML wordt gestript.
- Tekst die lijkt op credentials/tokens wordt geredigeerd.
- Lange blokken kunnen worden afgekapt.
- Zeer grote geschiedenissen kunnen oudere rijen laten vallen of een te grote rij vervangen door `[sessions_history omitted: message too large]`.
- Ruwe inspectie van het transcript op schijf is de fallback wanneer je het volledige byte-voor-byte-transcript nodig hebt.

## Toolbeleid

Subagents gebruiken eerst dezelfde profiel- en toolbeleidspijplijn als de bovenliggende of doelagent. Daarna past OpenClaw de beperkingslaag voor subagents toe.

Zonder beperkend `tools.profile` krijgen subagents **alle tools behalve sessietools** en systeemtools:

- `sessions_list`
- `sessions_history`
- `sessions_send`
- `sessions_spawn`

`sessions_history` blijft ook hier een begrensde, opgeschoonde herinneringsweergave: het is geen ruwe transcriptdump.

Wanneer `maxSpawnDepth >= 2`, ontvangen orkestrator-subagents op diepte 1 daarnaast `sessions_spawn`, `subagents`, `sessions_list` en `sessions_history`, zodat ze hun onderliggende sessies kunnen beheren.

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

`tools.subagents.tools.allow` is een definitief allow-only-filter. Het kan de al opgeloste toolset beperken, maar het kan geen tool **terug toevoegen** die door `tools.profile` is verwijderd. `tools.profile: "coding"` bevat bijvoorbeeld `web_search`/`web_fetch`, maar niet de `browser`-tool. Voeg browser toe in de profielfase om subagents met coding-profiel browserautomatisering te laten gebruiken:

```json5
{
  tools: {
    profile: "coding",
    alsoAllow: ["browser"],
  },
}
```

Gebruik per-agent `agents.list[].tools.alsoAllow: ["browser"]` wanneer slechts één agent browserautomatisering moet krijgen.

## Gelijktijdigheid

Subagents gebruiken een speciale in-process wachtrijbaan:

- **Baannaam:** `subagent`
- **Gelijktijdigheid:** `agents.defaults.subagents.maxConcurrent` (standaard `8`)

## Liveness en herstel

OpenClaw behandelt de afwezigheid van `endedAt` niet als permanent bewijs dat een subagent nog leeft. Niet-beëindigde runs die ouder zijn dan het venster voor verouderde runs tellen niet meer als actief/in behandeling in `/subagents list`, statusoverzichten, gating van voltooiingen van afstammelingen en gelijktijdigheidscontroles per sessie.

Na een Gateway-herstart worden verouderde niet-beëindigde herstelde runs opgeschoond, tenzij hun onderliggende sessie is gemarkeerd met `abortedLastRun: true`. Die door herstart afgebroken onderliggende sessies blijven herstelbaar via de herstelstroom voor verweesde subagents, die een synthetisch hervattingsbericht verzendt voordat de afgebroken-markering wordt gewist.

Automatisch herstartherstel is begrensd per onderliggende sessie. Als dezelfde onderliggende subagentsessie herhaaldelijk wordt geaccepteerd voor weesherstel binnen het snelle herwigvenster, bewaart OpenClaw een herstel-tombstone op die sessie en stopt het automatisch hervatten daarvan bij latere herstarts. Voer `openclaw tasks maintenance --apply` uit om het taakrecord te reconciliëren, of `openclaw doctor --fix` om verouderde afgebroken-herstelvlaggen op tombstoned sessies te wissen.

<Note>
Als het spawnen van een subagent mislukt met Gateway `PAIRING_REQUIRED` / `scope-upgrade`, controleer dan de RPC-aanroeper voordat je pairingstatus bewerkt. Interne `sessions_spawn`-coördinatie moet verbinden als `client.id: "gateway-client"` met `client.mode: "backend"` via directe loopback-authenticatie met gedeeld token/wachtwoord; dat pad is niet afhankelijk van de gekoppelde-apparaatscopebaseline van de CLI. Externe aanroepers, expliciete `deviceIdentity`, expliciete apparaat-tokenpaden en browser-/node-clients hebben nog steeds normale apparaatgoedkeuring nodig voor scope-upgrades.
</Note>

## Stoppen

- Het verzenden van `/stop` in de chat van de aanvrager breekt de aanvragersessie af en stopt alle actieve subagentruns die daaruit zijn gespawnd, met cascade naar geneste onderliggende sessies.
- `/subagents kill <id>` stopt een specifieke subagent en cascadeert naar diens onderliggende sessies.

## Beperkingen

- Aankondiging door subagents is **best-effort**. Als de Gateway herstart, gaat in behandeling staand "aankondig terug"-werk verloren.
- Subagents delen nog steeds dezelfde Gateway-procesresources; behandel `maxConcurrent` als een veiligheidsklep.
- `sessions_spawn` is altijd niet-blokkerend: het retourneert onmiddellijk `{ status: "accepted", runId, childSessionKey }`.
- Subagentcontext injecteert alleen `AGENTS.md`, `TOOLS.md`, `SOUL.md`, `IDENTITY.md` en `USER.md` (geen `MEMORY.md`, `HEARTBEAT.md` of `BOOTSTRAP.md`).
- Maximale nestdiepte is 5 (`maxSpawnDepth`-bereik: 1–5). Diepte 2 wordt aanbevolen voor de meeste gebruikssituaties.
- `maxChildrenPerAgent` begrenst actieve onderliggende sessies per sessie (standaard `5`, bereik `1–20`).

## Gerelateerd

- [ACP-agents](/nl/tools/acp-agents)
- [Agent verzenden](/nl/tools/agent-send)
- [Achtergrondtaken](/nl/automation/tasks)
- [Multi-agent-sandboxtools](/nl/tools/multi-agent-sandbox-tools)
