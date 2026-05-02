---
read_when:
    - U wilt werk op de achtergrond of parallel werk via de agent
    - Je wijzigt sessions_spawn of het beleid voor subagent-tools
    - Je implementeert of verhelpt problemen met threadgebonden subagentsessies
sidebarTitle: Sub-agents
summary: Start geïsoleerde agentuitvoeringen op de achtergrond die resultaten terugmelden in de chat van de aanvrager
title: Subagenten
x-i18n:
    generated_at: "2026-05-02T11:30:29Z"
    model: gpt-5.5
    provider: openai
    source_hash: 0e964df543bd19435daf94f2c85a34b9d32e07662405d2eac7635935f1e7bf64
    source_path: tools/subagents.md
    workflow: 16
---

Subagenten zijn agentruns op de achtergrond die vanuit een bestaande agentrun worden gestart.
Ze draaien in hun eigen sessie (`agent:<agentId>:subagent:<uuid>`) en
**kondigen** hun resultaat na afloop aan terug aan het chatkanaal van de
aanvrager. Elke subagentrun wordt gevolgd als een
[achtergrondtaak](/nl/automation/tasks).

Primaire doelen:

- "onderzoek / lange taak / trage tool"-werk parallel uitvoeren zonder de hoofdrun te blokkeren.
- Subagenten standaard geisoleerd houden (sessiescheiding + optionele sandboxing).
- Het tooloppervlak moeilijk te misbruiken houden: subagenten krijgen standaard **geen** sessietools.
- Configureerbare nesteldiepte ondersteunen voor orchestratorpatronen.

<Note>
**Kostenopmerking:** elke subagent heeft standaard zijn eigen context en
tokengebruik. Stel voor zware of repetitieve taken een goedkoper model in
voor subagenten en houd je hoofdagent op een model van hogere kwaliteit.
Configureer dit via `agents.defaults.subagents.model` of overrides per agent.
Wanneer een child werkelijk het huidige transcript van de aanvrager nodig
heeft, kan de agent `context: "fork"` aanvragen voor die ene spawn.
Thread-gebonden subagentsessies gebruiken standaard `context: "fork"` omdat
ze het huidige gesprek vertakken naar een follow-upthread.
</Note>

## Slash-opdracht

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

`/subagents info` toont runmetadata (status, tijdstempels, sessie-id,
transcriptpad, opschoning). Gebruik `sessions_history` voor een begrensde,
veiligheidsgefilterde recall-weergave; inspecteer het transcriptpad op schijf
wanneer je het ruwe volledige transcript nodig hebt.

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

`/subagents spawn` start een subagent op de achtergrond als gebruikersopdracht
(niet als interne relay) en stuurt een laatste voltooiingsupdate terug naar de
chat van de aanvrager wanneer de run is afgerond.

<AccordionGroup>
  <Accordion title="Niet-blokkerende, push-gebaseerde voltooiing">
    - De spawnopdracht is niet-blokkerend; hij retourneert onmiddellijk een run-id.
    - Bij voltooiing kondigt de subagent een samenvatting/resultaatbericht aan terug aan het chatkanaal van de aanvrager.
    - Voltooiing is push-gebaseerd. Zodra de subagent is gestart, poll dan **niet** `/subagents list`, `sessions_list` of `sessions_history` in een lus alleen om te wachten tot hij klaar is; inspecteer de status alleen op aanvraag voor debugging of ingrijpen.
    - Bij voltooiing sluit OpenClaw naar beste vermogen gevolgde browsertabs/processen die door die subagentsessie zijn geopend voordat de aankondigings- en opschoningsflow doorgaat.

  </Accordion>
  <Accordion title="Veerkracht van levering bij handmatige spawn">
    - OpenClaw probeert eerst directe `agent`-levering met een stabiele idempotentiesleutel.
    - Als directe levering mislukt, valt het terug op routering via de wachtrij.
    - Als wachtrijroutering nog steeds niet beschikbaar is, wordt de aankondiging opnieuw geprobeerd met een korte exponentiele backoff voordat definitief wordt opgegeven.
    - Voltooiingslevering behoudt de opgeloste aanvragersroute: thread-gebonden of gespreksgebonden voltooiingsroutes winnen wanneer beschikbaar; als de voltooiingsoorsprong alleen een kanaal levert, vult OpenClaw het ontbrekende doel/account aan vanuit de opgeloste route van de aanvragersessie (`lastChannel` / `lastTo` / `lastAccountId`), zodat directe levering nog steeds werkt.

  </Accordion>
  <Accordion title="Metadata voor voltooiingsoverdracht">
    De voltooiingsoverdracht naar de aanvragersessie is tijdens runtime
    gegenereerde interne context (geen door de gebruiker geschreven tekst) en bevat:

    - `Result` — nieuwste zichtbare `assistant`-antwoordtekst, anders opgeschoonde nieuwste tool-/toolResult-tekst. Terminal mislukte runs hergebruiken geen vastgelegde antwoordtekst.
    - `Status` — `completed successfully` / `failed` / `timed out` / `unknown`.
    - Compacte runtime-/tokenstatistieken.
    - Een leveringsinstructie die de aanvrageragent vertelt om te herschrijven in normale assistentstem (en geen ruwe interne metadata door te sturen).

  </Accordion>
  <Accordion title="Modi en ACP-runtime">
    - `--model` en `--thinking` overschrijven defaults voor die specifieke run.
    - Gebruik `info`/`log` om details en uitvoer na voltooiing te inspecteren.
    - `/subagents spawn` is one-shotmodus (`mode: "run"`). Gebruik voor persistente thread-gebonden sessies `sessions_spawn` met `thread: true` en `mode: "session"`.
    - Gebruik voor ACP-harnesssessies (Claude Code, Gemini CLI, OpenCode, of expliciete Codex ACP/acpx) `sessions_spawn` met `runtime: "acp"` wanneer de tool die runtime adverteert. Zie [ACP-leveringsmodel](/nl/tools/acp-agents#delivery-model) bij het debuggen van voltooiingen of agent-naar-agent-lussen. Wanneer de `codex`-Plugin is ingeschakeld, moet Codex-chat-/threadbesturing de voorkeur geven aan `/codex ...` boven ACP, tenzij de gebruiker expliciet om ACP/acpx vraagt.
    - OpenClaw verbergt `runtime: "acp"` totdat ACP is ingeschakeld, de aanvrager niet is gesandboxed en een backend-Plugin zoals `acpx` is geladen. `runtime: "acp"` verwacht een externe ACP-harness-id, of een `agents.list[]`-item met `runtime.type="acp"`; gebruik de standaard subagent-runtime voor normale OpenClaw-configuratieagenten uit `agents_list`.

  </Accordion>
</AccordionGroup>

## Contextmodi

Native subagenten starten geisoleerd tenzij de aanroeper expliciet vraagt om
het huidige transcript te forken.

| Modus      | Wanneer je deze gebruikt                                                                                                               | Gedrag                                                                            |
| ---------- | -------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------- |
| `isolated` | Vers onderzoek, onafhankelijke implementatie, traag toolwerk, of alles wat in de taaktekst kan worden gebrieft                         | Maakt een schoon childtranscript. Dit is de default en houdt tokengebruik lager.  |
| `fork`     | Werk dat afhangt van het huidige gesprek, eerdere toolresultaten of genuanceerde instructies die al in het aanvragertranscript staan | Vertakt het aanvragertranscript naar de childsessie voordat het child start. |

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
moeten delegeren. Kanaal-/groep-, provider-, sandbox- en allow-/denybeleid per
agent kunnen de tool na de profielfase nog steeds verwijderen. Gebruik `/tools`
vanuit dezelfde sessie om de effectieve toollijst te bevestigen.

**Defaults:**

- **Model:** erft de aanroeper tenzij je `agents.defaults.subagents.model` instelt (of per-agent `agents.list[].subagents.model`); een expliciete `sessions_spawn.model` wint nog steeds.
- **Thinking:** erft de aanroeper tenzij je `agents.defaults.subagents.thinking` instelt (of per-agent `agents.list[].subagents.thinking`); een expliciete `sessions_spawn.thinking` wint nog steeds.
- **Run-time-out:** als `sessions_spawn.runTimeoutSeconds` is weggelaten, gebruikt OpenClaw `agents.defaults.subagents.runTimeoutSeconds` wanneer ingesteld; anders valt het terug op `0` (geen time-out).

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
  `acp` is alleen voor externe ACP-harnesses (`claude`, `droid`, `gemini`, `opencode`, of expliciet aangevraagde Codex ACP/acpx) en voor `agents.list[]`-items waarvan `runtime.type` `acp` is.
</ParamField>
<ParamField path="resumeSessionId" type="string">
  Alleen ACP. Hervat een bestaande ACP-harnesssessie wanneer `runtime: "acp"`; genegeerd voor native subagent-spawns.
</ParamField>
<ParamField path="streamTo" type='"parent"'>
  Alleen ACP. Streamt ACP-runuitvoer naar de parentsessie wanneer `runtime: "acp"`; laat weg voor native subagent-spawns.
</ParamField>
<ParamField path="model" type="string">
  Overschrijf het subagentmodel. Ongeldige waarden worden overgeslagen en de subagent draait op het standaardmodel met een waarschuwing in het toolresultaat.
</ParamField>
<ParamField path="thinking" type="string">
  Overschrijf het thinkingniveau voor de subagentrun.
</ParamField>
<ParamField path="runTimeoutSeconds" type="number">
  Default naar `agents.defaults.subagents.runTimeoutSeconds` wanneer ingesteld, anders `0`. Wanneer ingesteld, wordt de subagentrun na N seconden afgebroken.
</ParamField>
<ParamField path="thread" type="boolean" default="false">
  Wanneer `true`, vraagt dit kanaalthreadbinding aan voor deze subagentsessie.
</ParamField>
<ParamField path="mode" type='"run" | "session"' default="run">
  Als `thread: true` en `mode` is weggelaten, wordt de default `session`. `mode: "session"` vereist `thread: true`.
</ParamField>
<ParamField path="cleanup" type='"delete" | "keep"' default="keep">
  `"delete"` archiveert onmiddellijk na aankondiging (behoudt het transcript nog steeds via hernoemen).
</ParamField>
<ParamField path="sandbox" type='"inherit" | "require"' default="inherit">
  `require` weigert spawn tenzij de doel-childruntime gesandboxed is.
</ParamField>
<ParamField path="context" type='"isolated" | "fork"' default="isolated">
  `fork` vertakt het huidige transcript van de aanvrager naar de childsessie. Alleen native subagenten. Thread-gebonden spawns gebruiken standaard `fork`; niet-threadspawns gebruiken standaard `isolated`.
</ParamField>

<Warning>
`sessions_spawn` accepteert **geen** kanaalleveringsparameters (`target`,
`channel`, `to`, `threadId`, `replyTo`, `transport`). Gebruik voor levering
`message`/`sessions_send` vanuit de gestarte run.
</Warning>

## Thread-gebonden sessies

Wanneer threadbindingen zijn ingeschakeld voor een kanaal, kan een subagent
aan een thread gebonden blijven, zodat follow-upberichten van gebruikers in die
thread naar dezelfde subagentsessie blijven routeren.

### Kanalen met threadondersteuning

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
  <Step title="Spawn">
    `sessions_spawn` met `thread: true` (en optioneel `mode: "session"`).
  </Step>
  <Step title="Binden">
    OpenClaw maakt of bindt een thread aan dat sessiedoel in het actieve kanaal.
  </Step>
  <Step title="Follow-ups routeren">
    Antwoorden en follow-upberichten in die thread routeren naar de gebonden sessie.
  </Step>
  <Step title="Time-outs inspecteren">
    Gebruik `/session idle` om automatisch unfocusen bij inactiviteit te inspecteren/bij te werken en
    `/session max-age` om de harde bovengrens te beheren.
  </Step>
  <Step title="Loskoppelen">
    Gebruik `/unfocus` om handmatig los te koppelen.
  </Step>
</Steps>

### Handmatige besturing

| Opdracht           | Effect                                                                 |
| ------------------ | ---------------------------------------------------------------------- |
| `/focus <target>`  | Koppel de huidige thread (of maak er een) aan een subagent-/sessiedoel |
| `/unfocus`         | Verwijder de koppeling voor de huidige gekoppelde thread               |
| `/agents`          | Toon actieve runs en koppelingsstatus (`thread:<id>` of `unbound`)     |
| `/session idle`    | Inspecteer/update automatische idle-ontkoppeling (alleen gefocuste gekoppelde threads) |
| `/session max-age` | Inspecteer/update harde limiet (alleen gefocuste gekoppelde threads)   |

### Configuratieschakelaars

- **Globale standaard:** `session.threadBindings.enabled`, `session.threadBindings.idleHours`, `session.threadBindings.maxAgeHours`.
- **Kanaaloverschrijving en spawn-auto-bind-sleutels** zijn adapterspecifiek. Zie [Threadondersteunende kanalen](#thread-supporting-channels) hierboven.

Zie [Configuratiereferentie](/nl/gateway/configuration-reference) en
[Slash-opdrachten](/nl/tools/slash-commands) voor actuele adapterdetails.

### Toestaanlijst

<ParamField path="agents.list[].subagents.allowAgents" type="string[]">
  Lijst met agent-id's die via expliciete `agentId` kunnen worden benaderd (`["*"]` staat alles toe). Standaard: alleen de aanvragende agent. Als je een lijst instelt en nog steeds wilt dat de aanvrager zichzelf met `agentId` spawnt, neem dan de requester-id op in de lijst.
</ParamField>
<ParamField path="agents.defaults.subagents.allowAgents" type="string[]">
  Standaard toestaanlijst voor doelagents die wordt gebruikt wanneer de aanvragende agent geen eigen `subagents.allowAgents` instelt.
</ParamField>
<ParamField path="agents.defaults.subagents.requireAgentId" type="boolean" default="false">
  Blokkeer `sessions_spawn`-aanroepen die `agentId` weglaten (dwingt expliciete profielselectie af). Overschrijving per agent: `agents.list[].subagents.requireAgentId`.
</ParamField>

Als de aanvragersessie in een sandbox draait, wijst `sessions_spawn` doelen af
die zonder sandbox zouden draaien.

### Discovery

Gebruik `agents_list` om te zien welke agent-id's momenteel zijn toegestaan voor
`sessions_spawn`. Het antwoord bevat het effectieve model en ingesloten runtime-metadata
van elke vermelde agent, zodat aanroepers PI, Codex-appserver en andere geconfigureerde
native runtimes kunnen onderscheiden.

### Automatisch archiveren

- Subagentsessies worden automatisch gearchiveerd na `agents.defaults.subagents.archiveAfterMinutes` (standaard `60`).
- Archiveren gebruikt `sessions.delete` en hernoemt het transcript naar `*.deleted.<timestamp>` (dezelfde map).
- `cleanup: "delete"` archiveert direct na de aankondiging (het transcript blijft behouden via hernoemen).
- Automatisch archiveren is best-effort; uitstaande timers gaan verloren als de Gateway opnieuw start.
- `runTimeoutSeconds` archiveert **niet** automatisch; het stopt alleen de run. De sessie blijft bestaan tot automatisch archiveren.
- Automatisch archiveren geldt zowel voor diepte-1- als diepte-2-sessies.
- Browseropschoning staat los van archiefopschoning: bijgehouden browsertabs/-processen worden best-effort gesloten wanneer de run eindigt, zelfs als het transcript/de sessierecord behouden blijft.

## Geneste subagents

Standaard kunnen subagents hun eigen subagents niet spawnen
(`maxSpawnDepth: 1`). Stel `maxSpawnDepth: 2` in om een niveau
nesting in te schakelen — het **orchestratorpatroon**: hoofd → orchestrator-subagent →
worker-sub-subagents.

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
| ------ | -------------------------------------------- | --------------------------------------------- | ---------------------------- |
| 0      | `agent:<id>:main`                            | Hoofdagent                                   | Altijd                       |
| 1      | `agent:<id>:subagent:<uuid>`                 | Subagent (orchestrator wanneer diepte 2 toegestaan is) | Alleen als `maxSpawnDepth >= 2` |
| 2      | `agent:<id>:subagent:<uuid>:subagent:<uuid>` | Sub-subagent (leaf-worker)                   | Nooit                        |

### Aankondigingsketen

Resultaten stromen terug omhoog door de keten:

1. Diepte-2-worker eindigt → kondigt aan bij de ouder (diepte-1-orchestrator).
2. Diepte-1-orchestrator ontvangt de aankondiging, synthetiseert resultaten, eindigt → kondigt aan bij hoofd.
3. Hoofdagent ontvangt de aankondiging en levert aan de gebruiker.

Elk niveau ziet alleen aankondigingen van zijn directe kinderen.

<Note>
**Operationele richtlijn:** start child-werk eenmaal en wacht op voltooiingsevents
in plaats van poll-lussen te bouwen rond `sessions_list`,
`sessions_history`, `/subagents list` of `exec`-slaapopdrachten.
`sessions_list` en `/subagents list` houden child-sessierelaties
gericht op live werk — live children blijven gekoppeld, beëindigde children blijven
korte tijd zichtbaar in een recent venster, en verouderde store-only child-links worden
genegeerd na hun versheidsvenster. Dit voorkomt dat oude `spawnedBy`- /
`parentSessionKey`-metadata spook-children na een herstart opnieuw tot leven wekt.
Als een voltooiingsevent van een child arriveert nadat je het
eindantwoord al hebt verzonden, is de correcte follow-up het exacte stille token
`NO_REPLY` / `no_reply`.
</Note>

### Toolbeleid per diepte

- Rol en control scope worden bij het spawnen naar sessiemetadata geschreven. Daardoor krijgen platte of herstelde sessiesleutels niet per ongeluk opnieuw orchestratorrechten.
- **Diepte 1 (orchestrator, wanneer `maxSpawnDepth >= 2`):** krijgt `sessions_spawn`, `subagents`, `sessions_list`, `sessions_history` zodat hij zijn children kan beheren. Andere sessie-/systeemtools blijven geweigerd.
- **Diepte 1 (leaf, wanneer `maxSpawnDepth == 1`):** geen sessietools (huidig standaardgedrag).
- **Diepte 2 (leaf-worker):** geen sessietools — `sessions_spawn` wordt altijd geweigerd op diepte 2. Kan geen verdere children spawnen.

### Spawnlimiet per agent

Elke agentsessie (op elke diepte) kan op elk moment maximaal `maxChildrenPerAgent`
(standaard `5`) actieve children hebben. Dit voorkomt ontsporende fan-out
vanaf een enkele orchestrator.

### Cascadestop

Het stoppen van een diepte-1-orchestrator stopt automatisch al zijn diepte-2
children:

- `/stop` in de hoofdchat stopt alle diepte-1-agents en cascadeert naar hun diepte-2 children.
- `/subagents kill <id>` stopt een specifieke subagent en cascadeert naar zijn children.
- `/subagents kill all` stopt alle subagents voor de aanvrager en cascadeert.

## Authenticatie

Subagent-auth wordt bepaald op basis van **agent-id**, niet op basis van sessietype:

- De subagentsessiesleutel is `agent:<agentId>:subagent:<uuid>`.
- De auth-store wordt geladen vanuit de `agentDir` van die agent.
- De auth-profielen van de hoofdagent worden samengevoegd als **fallback**; agentprofielen overschrijven hoofdprofielen bij conflicten.

De merge is additief, dus hoofdprofielen zijn altijd beschikbaar als
fallbacks. Volledig geïsoleerde auth per agent wordt nog niet ondersteund.

## Aankondigen

Subagents rapporteren terug via een aankondigingsstap:

- De aankondigingsstap draait binnen de subagentsessie (niet de aanvragersessie).
- Als de subagent exact `ANNOUNCE_SKIP` antwoordt, wordt er niets geplaatst.
- Als de nieuwste assistenttekst het exacte stille token `NO_REPLY` / `no_reply` is, wordt aankondigingsoutput onderdrukt, zelfs als er eerder zichtbare voortgang was.

Levering hangt af van de diepte van de aanvrager:

- Aanvragersessies op topniveau gebruiken een follow-up-`agent`-aanroep met externe levering (`deliver=true`).
- Geneste aanvrager-subagentsessies ontvangen een interne follow-up-injectie (`deliver=false`) zodat de orchestrator child-resultaten binnen de sessie kan synthetiseren.
- Als een geneste aanvrager-subagentsessie verdwenen is, valt OpenClaw terug op de requester van die sessie wanneer beschikbaar.

Voor aanvragersessies op topniveau lost directe levering in voltooiingsmodus eerst
elke gekoppelde conversatie-/threadroute en hook-overschrijving op, en vult daarna
ontbrekende kanaaldoelvelden vanuit de opgeslagen route van de aanvragersessie.
Zo blijven voltooiingen in de juiste chat/topic, zelfs wanneer de voltooiingsbron
alleen het kanaal identificeert.

Aggregatie van child-voltooiingen is gescoped naar de huidige requester-run bij
het bouwen van geneste voltooiingsbevindingen, zodat verouderde child-output uit eerdere runs
niet in de huidige aankondiging lekt. Aankondigingsantwoorden behouden
thread-/topicroutering wanneer beschikbaar op kanaaladapters.

### Aankondigingscontext

Aankondigingscontext wordt genormaliseerd naar een stabiel intern eventblok:

| Veld           | Bron                                                                                                          |
| -------------- | ------------------------------------------------------------------------------------------------------------- |
| Bron           | `subagent` of `cron`                                                                                          |
| Sessie-id's    | Child-sessiesleutel/-id                                                                                       |
| Type           | Aankondigingstype + taaklabel                                                                                 |
| Status         | Afgeleid van runtime-uitkomst (`success`, `error`, `timeout` of `unknown`) — **niet** afgeleid uit modeltekst |
| Resultaatinhoud | Nieuwste zichtbare assistenttekst, anders opgeschoonde nieuwste tool-/toolResult-tekst                       |
| Follow-up      | Instructie die beschrijft wanneer te antwoorden versus stil te blijven                                        |

Terminale mislukte runs rapporteren foutstatus zonder vastgelegde
antwoordtekst opnieuw af te spelen. Bij timeout kan de aankondiging, als de child alleen
toolaanroepen heeft gehaald, die geschiedenis samenvouwen tot een korte samenvatting
van gedeeltelijke voortgang in plaats van ruwe tooloutput opnieuw af te spelen.

### Statistiekregel

Aankondigingspayloads bevatten aan het einde een statistiekregel (zelfs wanneer ingepakt):

- Runtime (bijv. `runtime 5m12s`).
- Tokengebruik (input/output/totaal).
- Geschatte kosten wanneer modelprijzen zijn geconfigureerd (`models.providers.*.models[].cost`).
- `sessionKey`, `sessionId` en transcriptpad zodat de hoofdagent geschiedenis kan ophalen via `sessions_history` of het bestand op schijf kan inspecteren.

Interne metadata is alleen bedoeld voor orchestratie; gebruikersgerichte antwoorden
moeten worden herschreven in normale assistentstem.

### Waarom `sessions_history` de voorkeur heeft

`sessions_history` is het veiligere orchestratiepad:

- Assistentgeheugen wordt eerst genormaliseerd: thinking-tags verwijderd; `<relevant-memories>`- / `<relevant_memories>`-scaffolding verwijderd; XML-payloadblokken voor toolaanroepen in platte tekst (`<tool_call>`, `<function_call>`, `<tool_calls>`, `<function_calls>`) verwijderd, inclusief afgekorte payloads die nooit netjes sluiten; gedegradeerde tool-call/result-scaffolding en historische-contextmarkers verwijderd; gelekte modelcontroletokens (`<|assistant|>`, andere ASCII `<|...|>`, full-width `<｜...｜>`) verwijderd; misvormde MiniMax-tool-call-XML verwijderd.
- Tekst die op credentials/tokens lijkt, wordt geredigeerd.
- Lange blokken kunnen worden afgekapt.
- Zeer grote geschiedenissen kunnen oudere rijen laten vallen of een te grote rij vervangen door `[sessions_history omitted: message too large]`.
- Inspectie van het ruwe transcript op schijf is de fallback wanneer je het volledige byte-voor-byte-transcript nodig hebt.

## Toolbeleid

Subagents gebruiken eerst dezelfde profiel- en toolbeleidpipeline als de ouder of
doelagent. Daarna past OpenClaw de restrictielaag voor subagents toe.

Zonder restrictief `tools.profile` krijgen subagents **alle tools behalve
sessietools** en systeemtools:

- `sessions_list`
- `sessions_history`
- `sessions_send`
- `sessions_spawn`

`sessions_history` blijft ook hier een begrensde, opgeschoonde geheugenweergave — het
is geen ruwe transcriptdump.

Wanneer `maxSpawnDepth >= 2`, ontvangen diepte-1-orchestrator-subagents daarnaast
`sessions_spawn`, `subagents`, `sessions_list` en
`sessions_history` zodat ze hun children kunnen beheren.

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

`tools.subagents.tools.allow` is een definitief allow-only-filter. Het kan de al opgeloste toolset beperken, maar het kan geen tool **terug toevoegen** die door `tools.profile` is verwijderd. Bijvoorbeeld: `tools.profile: "coding"` bevat `web_search`/`web_fetch`, maar niet de `browser`-tool. Om sub-agents met het coding-profiel browserautomatisering te laten gebruiken, voeg je browser toe in de profielfase:

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

Sub-agents gebruiken een speciale in-process wachtrij-lane:

- **Lane-naam:** `subagent`
- **Gelijktijdigheid:** `agents.defaults.subagents.maxConcurrent` (standaard `8`)

## Liveness en herstel

OpenClaw behandelt het ontbreken van `endedAt` niet als permanent bewijs dat een sub-agent nog actief is. Niet-beëindigde runs die ouder zijn dan het venster voor verlopen runs tellen niet meer mee als actief/in behandeling in `/subagents list`, statusoverzichten, gating voor voltooiing van descendants en gelijktijdigheidscontroles per sessie.

Na een Gateway-herstart worden verlopen, niet-beëindigde herstelde runs opgeschoond, tenzij hun child session is gemarkeerd als `abortedLastRun: true`. Die door herstart afgebroken child sessions blijven herstelbaar via de orphan-herstelstroom voor sub-agents, die een synthetisch hervattingsbericht verzendt voordat de afgebroken-markering wordt gewist.

Automatisch herstel na herstart is begrensd per child session. Als dezelfde child van een sub-agent herhaaldelijk wordt geaccepteerd voor orphan-herstel binnen het snelle re-wedge-venster, bewaart OpenClaw een herstel-tombstone op die sessie en stopt het met automatisch hervatten bij latere herstarts. Voer `openclaw tasks maintenance --apply` uit om de taakrecord te reconciliëren, of `openclaw doctor --fix` om verlopen afgebroken herstelvlaggen op sessies met een tombstone te wissen.

<Note>
Als het starten van een sub-agent mislukt met Gateway `PAIRING_REQUIRED` / `scope-upgrade`, controleer dan de RPC-caller voordat je de pairing-status bewerkt. Interne `sessions_spawn`-coördinatie moet verbinden als `client.id: "gateway-client"` met `client.mode: "backend"` via directe local loopback-authenticatie met gedeeld token/wachtwoord; dat pad is niet afhankelijk van de scope-basislijn van gekoppelde apparaten van de CLI. Externe callers, expliciete `deviceIdentity`, expliciete paden met device-token en browser-/node-clients hebben nog steeds normale apparaatgoedkeuring nodig voor scope-upgrades.
</Note>

## Stoppen

- Het verzenden van `/stop` in de aanvragerchat breekt de aanvragersessie af en stopt alle actieve sub-agent-runs die daaruit zijn gestart, met cascading naar geneste children.
- `/subagents kill <id>` stopt een specifieke sub-agent en laat dit doorlopen naar zijn children.

## Beperkingen

- Aankondiging van sub-agents is **best-effort**. Als de Gateway herstart, gaat in behandeling zijnd werk voor "announce back" verloren.
- Sub-agents delen nog steeds dezelfde procesresources van de Gateway; behandel `maxConcurrent` als een veiligheidsventiel.
- `sessions_spawn` is altijd niet-blokkerend: het retourneert onmiddellijk `{ status: "accepted", runId, childSessionKey }`.
- Sub-agent-context injecteert alleen `AGENTS.md` + `TOOLS.md` (geen `SOUL.md`, `IDENTITY.md`, `USER.md`, `HEARTBEAT.md` of `BOOTSTRAP.md`).
- Maximale nestingsdiepte is 5 (`maxSpawnDepth`-bereik: 1–5). Diepte 2 wordt aanbevolen voor de meeste use cases.
- `maxChildrenPerAgent` begrenst actieve children per sessie (standaard `5`, bereik `1–20`).

## Gerelateerd

- [ACP-agents](/nl/tools/acp-agents)
- [Agent verzenden](/nl/tools/agent-send)
- [Achtergrondtaken](/nl/automation/tasks)
- [Multi-agent sandbox-tools](/nl/tools/multi-agent-sandbox-tools)
