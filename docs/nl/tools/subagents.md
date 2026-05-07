---
read_when:
    - Je wilt achtergrond- of parallel werk via de agent
    - Je wijzigt sessions_spawn of het beleid voor subagenttools
    - Je implementeert threadgebonden subagent-sessies of lost problemen ermee op
sidebarTitle: Sub-agents
summary: Start geïsoleerde agentuitvoeringen op de achtergrond die resultaten terugmelden in de chat van de aanvrager
title: Subagenten
x-i18n:
    generated_at: "2026-05-07T13:27:43Z"
    model: gpt-5.5
    provider: openai
    source_hash: 5b112f9c45bcb9cdc5d3b856f2fe2a36617606ad278b0ccc3db8830f0e847ba9
    source_path: tools/subagents.md
    workflow: 16
---

Subagents zijn achtergrond-agentruns die vanuit een bestaande agentrun worden gestart.
Ze draaien in hun eigen sessie (`agent:<agentId>:subagent:<uuid>`) en
**kondigen** na afronding hun resultaat aan in het chatkanaal van de
aanvrager. Elke subagentrun wordt gevolgd als een
[achtergrondtaak](/nl/automation/tasks).

Primaire doelen:

- "Onderzoek / lange taak / traag hulpmiddel"-werk paralleliseren zonder de hoofdrun te blokkeren.
- Subagents standaard geisoleerd houden (sessiescheiding + optionele sandboxing).
- Het tool-oppervlak moeilijk te misbruiken houden: subagents krijgen standaard **geen** sessietools.
- Configureerbare nestingsdiepte ondersteunen voor orchestratorpatronen.

<Note>
**Kostenopmerking:** elke subagent heeft standaard zijn eigen context en
tokengebruik. Stel voor zware of repetitieve taken een goedkoper model in voor
subagents en houd je hoofdagent op een model van hogere kwaliteit. Configureer via
`agents.defaults.subagents.model` of per-agent overschrijvingen. Wanneer een child
    echt het huidige transcript van de aanvrager nodig heeft, kan de agent
    `context: "fork"` aanvragen bij die ene spawn. Threadgebonden subagentsessies gebruiken standaard
    `context: "fork"` omdat ze het huidige gesprek vertakken naar een
    follow-upthread.
</Note>

## Slash-opdracht

Gebruik `/subagents` om subagentruns voor de **huidige
sessie** te inspecteren of te beheren:

```text
/subagents list
/subagents kill <id|#|all>
/subagents log <id|#> [limit] [tools]
/subagents info <id|#>
/subagents send <id|#> <message>
/subagents steer <id|#> <message>
/subagents spawn <agentId> <task> [--model <model>] [--thinking <level>]
```

Gebruik [`/steer <message>`](/nl/tools/steer) op topniveau om de actieve run van de huidige aanvragersessie bij te sturen. Gebruik `/subagents steer <id|#> <message>` wanneer het doel een child-run is.

`/subagents info` toont runmetadata (status, tijdstempels, sessie-id,
transcriptpad, opschoning). Gebruik `sessions_history` voor een begrensde,
veiligheidsgefilterde recall-weergave; inspecteer het transcriptpad op schijf wanneer je
het ruwe volledige transcript nodig hebt.

### Regelaars voor threadbinding

Deze opdrachten werken op kanalen die permanente threadbindingen ondersteunen.
Zie [Kanalen met threadondersteuning](#thread-supporting-channels) hieronder.

```text
/focus <subagent-label|session-key|session-id|session-label>
/unfocus
/agents
/session idle <duration|off>
/session max-age <duration|off>
```

### Spawngedrag

`/subagents spawn` start een achtergrondsubagent als gebruikersopdracht (niet als
interne relay) en stuurt een laatste voltooiingsupdate terug naar de
aanvragerchat wanneer de run is voltooid.

<AccordionGroup>
  <Accordion title="Non-blocking, push-based completion">
    - De spawnopdracht blokkeert niet; deze retourneert direct een run-id.
    - Bij voltooiing kondigt de subagent een samenvattings-/resultaatbericht aan in het chatkanaal van de aanvrager.
    - Voltooiing is pushgebaseerd. Na het spawnen moet je **niet** in een lus `/subagents list`, `sessions_list` of `sessions_history` pollen alleen om te wachten tot het klaar is; inspecteer de status alleen op aanvraag voor debugging of interventie.
    - Bij voltooiing sluit OpenClaw best-effort gevolgde browsertabs/processen die door die subagentsessie zijn geopend voordat de aankondigingsopschoningsflow doorgaat.

  </Accordion>
  <Accordion title="Manual-spawn delivery resilience">
    - OpenClaw geeft voltooiingen terug aan de aanvragersessie via een `agent`-turn met een stabiele idempotentiesleutel.
    - Als de aanvragerrun nog actief is, probeert OpenClaw eerst die run te wekken/bij te sturen in plaats van een tweede zichtbaar antwoordpad te starten.
    - Als de overdracht van de aanvrager-agentvoltooiing mislukt of geen zichtbare output oplevert, behandelt OpenClaw levering als mislukt en valt terug op wachtrijroutering/opnieuw proberen. Het stuurt het child-resultaat niet ruw rechtstreeks naar de externe chat.
    - Als directe overdracht niet kan worden gebruikt, valt het terug op wachtrijroutering.
    - Als wachtrijroutering nog steeds niet beschikbaar is, wordt de aankondiging opnieuw geprobeerd met een korte exponentiele backoff voordat definitief wordt opgegeven.
    - Voltooiingslevering behoudt de opgeloste aanvragerroute: threadgebonden of gespreksgebonden voltooiingsroutes winnen wanneer ze beschikbaar zijn; als de voltooiingsoorsprong alleen een kanaal levert, vult OpenClaw het ontbrekende doel/account in vanuit de opgeloste route van de aanvragersessie (`lastChannel` / `lastTo` / `lastAccountId`), zodat directe levering nog steeds werkt.

  </Accordion>
  <Accordion title="Completion handoff metadata">
    De voltooiingsoverdracht naar de aanvragersessie is runtime-gegenereerde
    interne context (geen door de gebruiker geschreven tekst) en bevat:

    - `Result` — nieuwste zichtbare `assistant`-antwoordtekst, anders opgeschoonde nieuwste tool-/toolResult-tekst. Terminaal mislukte runs hergebruiken geen vastgelegde antwoordtekst.
    - `Status` — `completed successfully` / `failed` / `timed out` / `unknown`.
    - Compacte runtime-/tokenstatistieken.
    - Een leveringsinstructie die de aanvrager-agent vertelt te herschrijven in normale assistant-stem (niet ruwe interne metadata doorsturen).

  </Accordion>
  <Accordion title="Modes and ACP runtime">
    - `--model` en `--thinking` overschrijven de standaardwaarden voor die specifieke run.
    - Gebruik `info`/`log` om details en output na voltooiing te inspecteren.
    - `/subagents spawn` is eenmalige modus (`mode: "run"`). Gebruik voor permanente threadgebonden sessies `sessions_spawn` met `thread: true` en `mode: "session"`.
    - Gebruik voor ACP-harnesssessies (Claude Code, Gemini CLI, OpenCode, of expliciete Codex ACP/acpx) `sessions_spawn` met `runtime: "acp"` wanneer de tool die runtime adverteert. Zie [ACP-leveringsmodel](/nl/tools/acp-agents#delivery-model) bij het debuggen van voltooiingen of agent-naar-agentlussen. Wanneer de `codex` Plugin is ingeschakeld, moet Codex-chat-/threadbeheer de voorkeur geven aan `/codex ...` boven ACP, tenzij de gebruiker expliciet om ACP/acpx vraagt.
    - OpenClaw verbergt `runtime: "acp"` totdat ACP is ingeschakeld, de aanvrager niet in een sandbox zit en een backend-Plugin zoals `acpx` is geladen. `runtime: "acp"` verwacht een externe ACP-harness-id, of een `agents.list[]`-entry met `runtime.type="acp"`; gebruik de standaard subagentruntime voor normale OpenClaw-configagenten uit `agents_list`.

  </Accordion>
</AccordionGroup>

## Contextmodi

Native subagents starten geisoleerd tenzij de aanroeper expliciet vraagt om het
huidige transcript te forken.

| Modus      | Wanneer je deze gebruikt                                                                                                               | Gedrag                                                                           |
| ---------- | -------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------- |
| `isolated` | Vers onderzoek, onafhankelijke implementatie, traag toolwerk, of alles wat in de taaktekst kan worden gebrieft                         | Maakt een schoon child-transcript. Dit is de standaard en houdt tokengebruik lager. |
| `fork`     | Werk dat afhangt van het huidige gesprek, eerdere toolresultaten of genuanceerde instructies die al in het aanvragertranscript staan   | Vertakt het aanvragertranscript naar de child-sessie voordat de child start. |

Gebruik `fork` spaarzaam. Het is bedoeld voor contextgevoelige delegatie, niet als
vervanging voor het schrijven van een duidelijke taakprompt.

## Tool: `sessions_spawn`

Start een subagentrun met `deliver: false` op de globale `subagent`-lane,
voert daarna een aankondigingsstap uit en plaatst het aankondigingsantwoord in het
chatkanaal van de aanvrager.

Beschikbaarheid hangt af van het effectieve toolbeleid van de aanroeper. De profielen `coding` en
`full` stellen `sessions_spawn` standaard beschikbaar. Het profiel `messaging`
doet dat niet; voeg `tools.alsoAllow: ["sessions_spawn", "sessions_yield",
"subagents"]` toe of gebruik `tools.profile: "coding"` voor agents die werk moeten delegeren.
Kanaal/groep, provider, sandbox en per-agent allow/deny-beleid kunnen
de tool na de profielfase nog steeds verwijderen. Gebruik `/tools` vanuit dezelfde
sessie om de effectieve toollijst te bevestigen.

**Standaarden:**

- **Model:** erft van de aanroeper tenzij je `agents.defaults.subagents.model` instelt (of per-agent `agents.list[].subagents.model`); een expliciete `sessions_spawn.model` wint nog steeds.
- **Thinking:** erft van de aanroeper tenzij je `agents.defaults.subagents.thinking` instelt (of per-agent `agents.list[].subagents.thinking`); een expliciete `sessions_spawn.thinking` wint nog steeds.
- **Run-time-out:** als `sessions_spawn.runTimeoutSeconds` is weggelaten, gebruikt OpenClaw `agents.defaults.subagents.runTimeoutSeconds` wanneer ingesteld; anders valt het terug op `0` (geen time-out).

### Toolparameters

<ParamField path="task" type="string" required>
  De taakbeschrijving voor de subagent.
</ParamField>
<ParamField path="label" type="string">
  Optioneel voor mensen leesbaar label.
</ParamField>
<ParamField path="agentId" type="string">
  Spawn onder een andere agent-id wanneer toegestaan door `subagents.allowAgents`.
</ParamField>
<ParamField path="runtime" type='"subagent" | "acp"' default="subagent">
  `acp` is alleen voor externe ACP-harnassen (`claude`, `droid`, `gemini`, `opencode`, of expliciet aangevraagde Codex ACP/acpx) en voor `agents.list[]`-entries waarvan `runtime.type` `acp` is.
</ParamField>
<ParamField path="resumeSessionId" type="string">
  Alleen ACP. Hervat een bestaande ACP-harnesssessie wanneer `runtime: "acp"`; genegeerd voor native subagentspawns.
</ParamField>
<ParamField path="streamTo" type='"parent"'>
  Alleen ACP. Streamt ACP-runoutput naar de bovenliggende sessie wanneer `runtime: "acp"`; laat weg voor native subagentspawns.
</ParamField>
<ParamField path="model" type="string">
  Overschrijf het subagentmodel. Ongeldige waarden worden overgeslagen en de subagent draait op het standaardmodel met een waarschuwing in het toolresultaat.
</ParamField>
<ParamField path="thinking" type="string">
  Overschrijf het thinking-niveau voor de subagentrun.
</ParamField>
<ParamField path="runTimeoutSeconds" type="number">
  Standaard `agents.defaults.subagents.runTimeoutSeconds` wanneer ingesteld, anders `0`. Wanneer ingesteld, wordt de subagentrun na N seconden afgebroken.
</ParamField>
<ParamField path="thread" type="boolean" default="false">
  Wanneer `true`, vraagt dit om kanaalthreadbinding voor deze subagentsessie.
</ParamField>
<ParamField path="mode" type='"run" | "session"' default="run">
  Als `thread: true` en `mode` is weggelaten, wordt de standaard `session`. `mode: "session"` vereist `thread: true`.
</ParamField>
<ParamField path="cleanup" type='"delete" | "keep"' default="keep">
  `"delete"` archiveert direct na aankondiging (behoudt het transcript nog steeds via hernoemen).
</ParamField>
<ParamField path="sandbox" type='"inherit" | "require"' default="inherit">
  `require` weigert spawn tenzij de beoogde child-runtime in een sandbox zit.
</ParamField>
<ParamField path="context" type='"isolated" | "fork"' default="isolated">
  `fork` vertakt het huidige transcript van de aanvrager naar de child-sessie. Alleen native subagents. Threadgebonden spawns gebruiken standaard `fork`; niet-threadspawns gebruiken standaard `isolated`.
</ParamField>

<Warning>
`sessions_spawn` accepteert **geen** kanaalleveringsparameters (`target`,
`channel`, `to`, `threadId`, `replyTo`, `transport`). Gebruik voor levering
`message`/`sessions_send` vanuit de gespawnde run.
</Warning>

## Threadgebonden sessies

Wanneer threadbindingen zijn ingeschakeld voor een kanaal, kan een subagent gebonden blijven
aan een thread, zodat follow-upgebruikersberichten in die thread naar dezelfde
subagentsessie blijven routeren.

### Kanalen met threadondersteuning

**Discord** is momenteel het enige ondersteunde kanaal. Het ondersteunt
permanente threadgebonden subagentsessies (`sessions_spawn` met
`thread: true`), handmatige threadregelaars (`/focus`, `/unfocus`, `/agents`,
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
  <Step title="Koppelen">
    OpenClaw maakt een thread aan of koppelt een thread aan dat sessiedoel in het actieve kanaal.
  </Step>
  <Step title="Vervolgberichten routeren">
    Antwoorden en vervolgberichten in die thread worden naar de gekoppelde sessie gerouteerd.
  </Step>
  <Step title="Time-outs inspecteren">
    Gebruik `/session idle` om automatische ontfocus bij inactiviteit te inspecteren/bij te werken en
    `/session max-age` om de harde limiet te beheren.
  </Step>
  <Step title="Ontkoppelen">
    Gebruik `/unfocus` om handmatig te ontkoppelen.
  </Step>
</Steps>

### Handmatige besturing

| Opdracht           | Effect                                                                |
| ------------------ | --------------------------------------------------------------------- |
| `/focus <target>`  | Koppel de huidige thread (of maak er een aan) aan een sub-agent-/sessiedoel |
| `/unfocus`         | Verwijder de koppeling voor de huidige gekoppelde thread              |
| `/agents`          | Toon actieve runs en koppelingsstatus (`thread:<id>` of `unbound`)    |
| `/session idle`    | Inspecteer/werk automatische ontfocus bij inactiviteit bij (alleen gefocuste gekoppelde threads) |
| `/session max-age` | Inspecteer/werk de harde limiet bij (alleen gefocuste gekoppelde threads) |

### Configuratieschakelaars

- **Globale standaard:** `session.threadBindings.enabled`, `session.threadBindings.idleHours`, `session.threadBindings.maxAgeHours`.
- **Kanaaloverride en spawn-auto-bind-sleutels** zijn adapterspecifiek. Zie [Kanalen met threadondersteuning](#thread-supporting-channels) hierboven.

Zie [Configuratiereferentie](/nl/gateway/configuration-reference) en
[Slash-opdrachten](/nl/tools/slash-commands) voor actuele adapterdetails.

### Toegestane lijst

<ParamField path="agents.list[].subagents.allowAgents" type="string[]">
  Lijst met agent-id's die via expliciete `agentId` kunnen worden gekozen (`["*"]` staat alles toe). Standaard: alleen de aanvragende agent. Als je een lijst instelt en nog steeds wilt dat de aanvrager zichzelf met `agentId` spawnt, neem dan de aanvrager-id op in de lijst.
</ParamField>
<ParamField path="agents.defaults.subagents.allowAgents" type="string[]">
  Standaard toegestane lijst met doelagents die wordt gebruikt wanneer de aanvragende agent geen eigen `subagents.allowAgents` instelt.
</ParamField>
<ParamField path="agents.defaults.subagents.requireAgentId" type="boolean" default="false">
  Blokkeer `sessions_spawn`-aanroepen die `agentId` weglaten (dwingt expliciete profielselectie af). Override per agent: `agents.list[].subagents.requireAgentId`.
</ParamField>

Als de aanvragende sessie in een sandbox draait, weigert `sessions_spawn` doelen
die zonder sandbox zouden worden uitgevoerd.

### Detectie

Gebruik `agents_list` om te zien welke agent-id's momenteel zijn toegestaan voor
`sessions_spawn`. De respons bevat het effectieve model van elke vermelde agent
en ingesloten runtimemetadata, zodat aanroepers onderscheid kunnen maken tussen PI, Codex
app-server en andere geconfigureerde native runtimes.

### Automatisch archiveren

- Sub-agentsessies worden automatisch gearchiveerd na `agents.defaults.subagents.archiveAfterMinutes` (standaard `60`).
- Archiveren gebruikt `sessions.delete` en hernoemt het transcript naar `*.deleted.<timestamp>` (dezelfde map).
- `cleanup: "delete"` archiveert direct na aankondiging (bewaart het transcript nog steeds via hernoemen).
- Automatisch archiveren is best-effort; openstaande timers gaan verloren als de Gateway opnieuw start.
- `runTimeoutSeconds` archiveert **niet** automatisch; het stopt alleen de run. De sessie blijft bestaan tot automatisch archiveren.
- Automatisch archiveren geldt zowel voor diepte-1- als diepte-2-sessies.
- Browseropschoning staat los van archiefopschoning: bijgehouden browsertabbladen/processen worden best-effort gesloten wanneer de run eindigt, zelfs als het transcript/de sessierecord wordt bewaard.

## Geneste sub-agents

Standaard kunnen sub-agents hun eigen sub-agents niet spawnen
(`maxSpawnDepth: 1`). Stel `maxSpawnDepth: 2` in om één niveau van
nesting in te schakelen — het **orchestratorpatroon**: hoofd → orchestrator-sub-agent →
worker-sub-sub-agents.

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
| 0      | `agent:<id>:main`                            | Hoofdagent                                    | Altijd                       |
| 1      | `agent:<id>:subagent:<uuid>`                 | Sub-agent (orchestrator wanneer diepte 2 is toegestaan) | Alleen als `maxSpawnDepth >= 2` |
| 2      | `agent:<id>:subagent:<uuid>:subagent:<uuid>` | Sub-sub-agent (leaf-worker)                   | Nooit                        |

### Aankondigingsketen

Resultaten stromen terug omhoog door de keten:

1. Diepte-2-worker eindigt → kondigt aan bij de ouder (diepte-1-orchestrator).
2. Diepte-1-orchestrator ontvangt de aankondiging, synthetiseert resultaten, eindigt → kondigt aan bij hoofd.
3. Hoofdagent ontvangt de aankondiging en levert aan de gebruiker.

Elk niveau ziet alleen aankondigingen van zijn directe kinderen.

<Note>
**Operationele richtlijn:** start kindwerk één keer en wacht op voltooiingsgebeurtenissen
in plaats van pollinglussen te bouwen rond `sessions_list`,
`sessions_history`, `/subagents list` of `exec`-sleepopdrachten.
`sessions_list` en `/subagents list` houden kind-sessierelaties
gericht op live werk — live kinderen blijven gekoppeld, beëindigde kinderen blijven
kort zichtbaar in een recent venster en verouderde alleen-store-kindkoppelingen worden
genegeerd na hun versheidsvenster. Dit voorkomt dat oude `spawnedBy`-/
`parentSessionKey`-metadata na een herstart spookkinderen opnieuw laat verschijnen.
Als een kind-voltooiingsgebeurtenis arriveert nadat je het definitieve antwoord al hebt
verzonden, is de juiste follow-up het exacte stille token
`NO_REPLY` / `no_reply`.
</Note>

### Toolbeleid per diepte

- Rol en beheerscope worden bij spawntijd naar sessiemetadata geschreven. Dat voorkomt dat platte of herstelde sessiesleutels per ongeluk orchestratorrechten terugkrijgen.
- **Diepte 1 (orchestrator, wanneer `maxSpawnDepth >= 2`):** krijgt `sessions_spawn`, `subagents`, `sessions_list`, `sessions_history` zodat hij zijn kinderen kan beheren. Andere sessie-/systeemtools blijven geweigerd.
- **Diepte 1 (leaf, wanneer `maxSpawnDepth == 1`):** geen sessietools (huidig standaardgedrag).
- **Diepte 2 (leaf-worker):** geen sessietools — `sessions_spawn` wordt op diepte 2 altijd geweigerd. Kan geen verdere kinderen spawnen.

### Spawnlimiet per agent

Elke agentsessie (op elke diepte) kan tegelijk maximaal `maxChildrenPerAgent`
(standaard `5`) actieve kinderen hebben. Dit voorkomt ongecontroleerde fan-out
vanuit één orchestrator.

### Cascade-stop

Het stoppen van een diepte-1-orchestrator stopt automatisch al zijn diepte-2-
kinderen:

- `/stop` in de hoofdchat stopt alle diepte-1-agents en cascadeert naar hun diepte-2-kinderen.
- `/subagents kill <id>` stopt een specifieke sub-agent en cascadeert naar zijn kinderen.
- `/subagents kill all` stopt alle sub-agents voor de aanvrager en cascadeert.

## Authenticatie

Sub-agentauthenticatie wordt bepaald door **agent-id**, niet door sessietype:

- De sessiesleutel van de sub-agent is `agent:<agentId>:subagent:<uuid>`.
- De auth-store wordt geladen uit de `agentDir` van die agent.
- De auth-profielen van de hoofdagent worden samengevoegd als **fallback**; agentprofielen overschrijven hoofdprofielen bij conflicten.

De samenvoeging is additief, dus hoofdprofielen zijn altijd beschikbaar als
fallbacks. Volledig geïsoleerde auth per agent wordt nog niet ondersteund.

## Aankondiging

Sub-agents rapporteren terug via een aankondigingsstap:

- De aankondigingsstap draait binnen de sub-agentsessie (niet de aanvragersessie).
- Als de sub-agent exact `ANNOUNCE_SKIP` antwoordt, wordt er niets geplaatst.
- Als de nieuwste assistenttekst het exacte stille token `NO_REPLY` / `no_reply` is, wordt aankondigingsuitvoer onderdrukt, zelfs als er eerder zichtbare voortgang was.

Levering hangt af van de aanvragerdiepte:

- Aanvragersessies op topniveau gebruiken een vervolg-`agent`-aanroep met externe levering (`deliver=true`).
- Geneste aanvragende subagentsessies ontvangen een interne follow-upinjectie (`deliver=false`), zodat de orchestrator kindresultaten binnen de sessie kan synthetiseren.
- Als een geneste aanvragende subagentsessie verdwenen is, valt OpenClaw terug op de aanvrager van die sessie wanneer beschikbaar.

Voor aanvragersessies op topniveau lost directe levering in voltooiingsmodus eerst
een eventuele gekoppelde conversatie-/threadroute en hook-override op, en vult daarna
ontbrekende kanaaldoelvelden vanuit de opgeslagen route van de aanvragersessie.
Zo blijven voltooiingen in de juiste chat/topic, zelfs wanneer de voltooiingsoorsprong
alleen het kanaal identificeert.

Aggregatie van kindvoltooiingen is beperkt tot de huidige aanvragerrun bij het
opbouwen van geneste voltooiingsbevindingen, zodat verouderde kinduitvoer uit eerdere runs
niet in de huidige aankondiging lekt. Aankondigingsantwoorden behouden
thread-/topicroutering wanneer die beschikbaar is op kanaaladapters.

### Aankondigingscontext

Aankondigingscontext wordt genormaliseerd naar een stabiel intern gebeurtenisblok:

| Veld           | Bron                                                                                                          |
| -------------- | ------------------------------------------------------------------------------------------------------------- |
| Bron           | `subagent` of `cron`                                                                                          |
| Sessie-id's    | Kind-sessiesleutel/-id                                                                                        |
| Type           | Aankondigingstype + taaklabel                                                                                 |
| Status         | Afgeleid van runtime-uitkomst (`success`, `error`, `timeout` of `unknown`) — **niet** afgeleid uit modeltekst |
| Resultaatinhoud | Nieuwste zichtbare assistenttekst, anders opgeschoonde nieuwste tool-/toolResult-tekst                       |
| Follow-up      | Instructie die beschrijft wanneer te antwoorden versus stil te blijven                                        |

Terminale mislukte runs rapporteren de foutstatus zonder vastgelegde
antwoordtekst opnieuw af te spelen. Bij een time-out kan announce, als het kind
alleen toolaanroepen heeft bereikt, die geschiedenis samenvouwen tot een korte samenvatting
van gedeeltelijke voortgang in plaats van ruwe tooluitvoer opnieuw af te spelen.

### Statistiekregel

Aankondigingspayloads bevatten aan het einde een statistiekregel (ook wanneer ingepakt):

- Runtime (bijv. `runtime 5m12s`).
- Tokengebruik (input/output/totaal).
- Geschatte kosten wanneer modelprijzen zijn geconfigureerd (`models.providers.*.models[].cost`).
- `sessionKey`, `sessionId` en transcriptpad zodat de hoofdagent geschiedenis kan ophalen via `sessions_history` of het bestand op schijf kan inspecteren.

Interne metadata is alleen bedoeld voor orchestration; gebruikersgerichte antwoorden
moeten worden herschreven in een normale assistentstem.

### Waarom `sessions_history` de voorkeur heeft

`sessions_history` is het veiligere orchestrationpad:

- Assistentherinnering wordt eerst genormaliseerd: thinking-tags gestript; `<relevant-memories>`- / `<relevant_memories>`-scaffolding gestript; XML-payloadblokken voor platte tekst-toolaanroepen (`<tool_call>`, `<function_call>`, `<tool_calls>`, `<function_calls>`) gestript, inclusief afgekorte payloads die nooit netjes sluiten; gedegradeerde tool-call/result-scaffolding en historical-context-markers gestript; gelekte modelbesturingstokens (`<|assistant|>`, andere ASCII `<|...|>`, full-width `<｜...｜>`) gestript; misvormde MiniMax-tool-call-XML gestript.
- Credential-/tokenachtige tekst wordt geredigeerd.
- Lange blokken kunnen worden afgekapt.
- Zeer grote geschiedenissen kunnen oudere rijen laten vallen of een te grote rij vervangen door `[sessions_history omitted: message too large]`.
- Inspectie van het ruwe transcript op schijf is de fallback wanneer je het volledige byte-voor-byte transcript nodig hebt.

## Toolbeleid

Subagenten gebruiken eerst hetzelfde profiel en dezelfde tool-policy-pipeline als de bovenliggende of doelagent. Daarna past OpenClaw de restrictielaag voor subagenten toe.

Zonder beperkend `tools.profile` krijgen subagenten **alle tools behalve sessietools** en systeemtools:

- `sessions_list`
- `sessions_history`
- `sessions_send`
- `sessions_spawn`

`sessions_history` blijft ook hier een begrensde, opgeschoonde recall-weergave — het is geen ruwe transcriptdump.

Wanneer `maxSpawnDepth >= 2`, ontvangen depth-1 orchestrator-subagenten daarnaast `sessions_spawn`, `subagents`, `sessions_list` en `sessions_history`, zodat ze hun kinderen kunnen beheren.

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

`tools.subagents.tools.allow` is een definitief allow-only-filter. Het kan de al opgeloste toolset beperken, maar het kan een tool die door `tools.profile` is verwijderd niet **terug toevoegen**. Bijvoorbeeld: `tools.profile: "coding"` bevat `web_search`/`web_fetch`, maar niet de `browser`-tool. Voeg browser toe in de profielfase om subagenten met het coding-profiel browserautomatisering te laten gebruiken:

```json5
{
  tools: {
    profile: "coding",
    alsoAllow: ["browser"],
  },
}
```

Gebruik per agent `agents.list[].tools.alsoAllow: ["browser"]` wanneer slechts één agent browserautomatisering moet krijgen.

## Gelijktijdigheid

Subagenten gebruiken een eigen in-process wachtrij-lane:

- **Lane-naam:** `subagent`
- **Gelijktijdigheid:** `agents.defaults.subagents.maxConcurrent` (standaard `8`)

## Liveness en herstel

OpenClaw behandelt het ontbreken van `endedAt` niet als permanent bewijs dat een subagent nog leeft. Niet-beëindigde runs die ouder zijn dan het stale-run-venster tellen niet langer als actief/in behandeling in `/subagents list`, statusoverzichten, gating voor voltooiing van descendants en gelijktijdigheidscontroles per sessie.

Na een Gateway-herstart worden stale, niet-beëindigde herstelde runs opgeschoond, tenzij hun kindsessie is gemarkeerd als `abortedLastRun: true`. Die door herstart afgebroken kindsessies blijven herstelbaar via de orphan-herstelstroom voor subagenten, die een synthetisch hervattingsbericht verzendt voordat de afgebroken-markering wordt gewist.

Automatisch herstart-herstel is begrensd per kindsessie. Als hetzelfde subagent-kind herhaaldelijk wordt geaccepteerd voor orphan-herstel binnen het rapid re-wedge-venster, bewaart OpenClaw een herstel-tombstone op die sessie en stopt het met automatisch hervatten ervan bij latere herstarts. Voer `openclaw tasks maintenance --apply` uit om de taakrecord te reconciliëren, of `openclaw doctor --fix` om stale afgebroken-herstelvlaggen op getombstonede sessies te wissen.

<Note>
Als het spawnen van een subagent mislukt met Gateway `PAIRING_REQUIRED` / `scope-upgrade`, controleer dan de RPC-aanroeper voordat je de pairing-status bewerkt. Interne `sessions_spawn`-coördinatie moet verbinden als `client.id: "gateway-client"` met `client.mode: "backend"` via directe local loopback shared-token/password-authenticatie; dat pad is niet afhankelijk van de paired-device scope-baseline van de CLI. Remote aanroepers, expliciete `deviceIdentity`, expliciete device-token-paden en browser/node-clients hebben nog steeds normale apparaatgoedkeuring nodig voor scope-upgrades.
</Note>

## Stoppen

- Het verzenden van `/stop` in de aanvragerchat breekt de aanvragersessie af en stopt alle actieve subagent-runs die daaruit zijn gespawnd, inclusief cascade naar geneste kinderen.
- `/subagents kill <id>` stopt een specifieke subagent en cascadeert naar diens kinderen.

## Beperkingen

- Aankondigingen van subagenten zijn **best-effort**. Als de gateway herstart, gaat in behandeling zijnd "announce back"-werk verloren.
- Subagenten delen nog steeds dezelfde Gateway-procesresources; behandel `maxConcurrent` als veiligheidsventiel.
- `sessions_spawn` is altijd niet-blokkerend: het retourneert direct `{ status: "accepted", runId, childSessionKey }`.
- Subagentcontext injecteert alleen `AGENTS.md` + `TOOLS.md` (geen `SOUL.md`, `IDENTITY.md`, `USER.md`, `HEARTBEAT.md` of `BOOTSTRAP.md`).
- Maximale nestdiepte is 5 (`maxSpawnDepth`-bereik: 1–5). Diepte 2 wordt aanbevolen voor de meeste use cases.
- `maxChildrenPerAgent` begrenst actieve kinderen per sessie (standaard `5`, bereik `1–20`).

## Gerelateerd

- [ACP-agenten](/nl/tools/acp-agents)
- [Agent verzenden](/nl/tools/agent-send)
- [Achtergrondtaken](/nl/automation/tasks)
- [Multi-agent sandbox-tools](/nl/tools/multi-agent-sandbox-tools)
