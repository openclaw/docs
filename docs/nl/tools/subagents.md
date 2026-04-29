---
read_when:
    - Je wilt achtergrond- of parallel werk via de agent
    - Je wijzigt sessions_spawn of het beleid voor subagenttools
    - U implementeert of verhelpt problemen met threadgebonden subagent-sessies
sidebarTitle: Sub-agents
summary: Start geïsoleerde agentuitvoeringen op de achtergrond die resultaten terugmelden aan de chat van de aanvrager.
title: Subagenten
x-i18n:
    generated_at: "2026-04-29T23:26:56Z"
    model: gpt-5.5
    provider: openai
    source_hash: 84386ea706873cf9f2ea03261f916c8fb01304999f2d9fa86e037e734a62bf7e
    source_path: tools/subagents.md
    workflow: 16
---

Sub-agents zijn achtergrond-agentruns die vanuit een bestaande agentrun worden gestart.
Ze draaien in hun eigen sessie (`agent:<agentId>:subagent:<uuid>`) en
**melden** hun resultaat na afloop terug aan het chatkanaal van de aanvrager.
Elke sub-agentrun wordt bijgehouden als een
[achtergrondtaak](/nl/automation/tasks).

Primaire doelen:

- Paralleliseer werk voor "onderzoek / lange taak / traag hulpmiddel" zonder de hoofdrun te blokkeren.
- Houd sub-agents standaard geïsoleerd (sessiescheiding + optionele sandboxing).
- Houd het hulpmiddeloppervlak moeilijk te misbruiken: sub-agents krijgen standaard **geen** sessiehulpmiddelen.
- Ondersteun configureerbare nestingsdiepte voor orchestrator-patronen.

<Note>
**Kostenopmerking:** elke sub-agent heeft standaard zijn eigen context en
tokengebruik. Stel voor zware of repetitieve taken een goedkoper model in
voor sub-agents en houd je hoofd-agent op een model van hogere kwaliteit.
Configureer via `agents.defaults.subagents.model` of overschrijvingen per agent.
Wanneer een kind echt het huidige transcript van de aanvrager nodig heeft,
kan de agent `context: "fork"` aanvragen bij die ene spawn.
</Note>

## Slash-opdracht

Gebruik `/subagents` om sub-agentruns voor de **huidige sessie** te inspecteren
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
transcriptpad, opruiming). Gebruik `sessions_history` voor een begrensde,
veiligheidsgefilterde herinneringsweergave; inspecteer het transcriptpad op schijf
wanneer je het onbewerkte volledige transcript nodig hebt.

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

`/subagents spawn` start een achtergrond-sub-agent als gebruikersopdracht (niet als
interne relay) en stuurt één laatste voltooiingsupdate terug naar de chat van de
aanvrager wanneer de run is voltooid.

<AccordionGroup>
  <Accordion title="Non-blocking, push-based completion">
    - De spawnopdracht blokkeert niet; hij retourneert onmiddellijk een run-id.
    - Na voltooiing meldt de sub-agent een samenvatting/resultaatbericht terug aan het chatkanaal van de aanvrager.
    - Voltooiing is push-gebaseerd. Zodra de sub-agent is gestart, poll **niet** `/subagents list`, `sessions_list` of `sessions_history` in een lus alleen om te wachten tot hij klaar is; inspecteer de status alleen op aanvraag voor foutopsporing of ingrijpen.
    - Na voltooiing sluit OpenClaw naar beste vermogen bijgehouden browsertabs/processen die door die sub-agentsessie zijn geopend voordat de opruimingsflow voor de melding doorgaat.

  </Accordion>
  <Accordion title="Manual-spawn delivery resilience">
    - OpenClaw probeert eerst directe `agent`-bezorging met een stabiele idempotentiesleutel.
    - Als directe bezorging mislukt, valt het terug op routering via de wachtrij.
    - Als wachtrijroutering nog steeds niet beschikbaar is, wordt de melding opnieuw geprobeerd met een korte exponentiële backoff voordat definitief wordt opgegeven.
    - Voltooiingsbezorging behoudt de opgeloste aanvragersroute: threadgebonden of gespreksgebonden voltooiingsroutes winnen wanneer ze beschikbaar zijn; als de voltooiingsoorsprong alleen een kanaal levert, vult OpenClaw het ontbrekende doel/account aan vanuit de opgeloste route van de aanvragersessie (`lastChannel` / `lastTo` / `lastAccountId`), zodat directe bezorging nog steeds werkt.

  </Accordion>
  <Accordion title="Completion handoff metadata">
    De overdracht van voltooiing aan de aanvragersessie is runtime-gegenereerde
    interne context (geen door de gebruiker geschreven tekst) en bevat:

    - `Result` — nieuwste zichtbare `assistant`-antwoordtekst, anders opgeschoonde nieuwste tool/toolResult-tekst. Terminal mislukte runs hergebruiken vastgelegde antwoordtekst niet.
    - `Status` — `completed successfully` / `failed` / `timed out` / `unknown`.
    - Compacte runtime-/tokenstatistieken.
    - Een bezorginstructie die de aanvragende agent vertelt te herschrijven in normale assistant-stem (niet onbewerkte interne metadata door te sturen).

  </Accordion>
  <Accordion title="Modes and ACP runtime">
    - `--model` en `--thinking` overschrijven de standaardwaarden voor die specifieke run.
    - Gebruik `info`/`log` om details en uitvoer na voltooiing te inspecteren.
    - `/subagents spawn` is eenmalige modus (`mode: "run"`). Gebruik voor persistente threadgebonden sessies `sessions_spawn` met `thread: true` en `mode: "session"`.
    - Gebruik voor ACP-harnesssessies (Claude Code, Gemini CLI, OpenCode, of expliciete Codex ACP/acpx) `sessions_spawn` met `runtime: "acp"` wanneer het hulpmiddel die runtime adverteert. Zie [ACP-bezorgmodel](/nl/tools/acp-agents#delivery-model) bij het debuggen van voltooiingen of agent-naar-agent-lussen. Wanneer de `codex`-Plugin is ingeschakeld, moet Codex-chat-/threadbesturing de voorkeur geven aan `/codex ...` boven ACP, tenzij de gebruiker expliciet om ACP/acpx vraagt.
    - OpenClaw verbergt `runtime: "acp"` totdat ACP is ingeschakeld, de aanvrager niet in een sandbox zit en een backend-Plugin zoals `acpx` is geladen. `runtime: "acp"` verwacht een externe ACP-harness-id, of een `agents.list[]`-vermelding met `runtime.type="acp"`; gebruik de standaard-sub-agentruntime voor normale OpenClaw-configagenten uit `agents_list`.

  </Accordion>
</AccordionGroup>

## Contextmodi

Native sub-agents starten geïsoleerd, tenzij de aanroeper expliciet vraagt om
het huidige transcript te forken.

| Modus      | Wanneer gebruiken                                                                                                                      | Gedrag                                                                           |
| ---------- | -------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------- |
| `isolated` | Nieuw onderzoek, onafhankelijke implementatie, traag hulpmiddelwerk of alles wat in de taaktekst kan worden gebrieft                  | Maakt een schoon kindtranscript. Dit is de standaard en houdt tokengebruik lager. |
| `fork`     | Werk dat afhangt van het huidige gesprek, eerdere toolresultaten of genuanceerde instructies die al in het aanvragerstranscript staan | Vertakt het aanvragerstranscript naar de kindsessie voordat het kind start.       |

Gebruik `fork` spaarzaam. Het is bedoeld voor contextgevoelige delegatie, niet als
vervanging voor het schrijven van een duidelijke taakprompt.

## Hulpmiddel: `sessions_spawn`

Start een sub-agentrun met `deliver: false` op de globale `subagent`-lane,
voert daarna een meldstap uit en plaatst het meldantwoord in het chatkanaal
van de aanvrager.

Beschikbaarheid hangt af van het effectieve hulpmiddelbeleid van de aanroeper.
De profielen `coding` en `full` stellen `sessions_spawn` standaard beschikbaar.
Het profiel `messaging` doet dat niet; voeg `tools.alsoAllow: ["sessions_spawn", "sessions_yield",
"subagents"]` toe of gebruik `tools.profile: "coding"` voor agents die werk
moeten delegeren. Kanaal/groep, provider, sandbox en allow-/deny-beleid per agent
kunnen het hulpmiddel na de profielfase nog steeds verwijderen. Gebruik `/tools`
vanuit dezelfde sessie om de effectieve hulpmiddelenlijst te bevestigen.

**Standaardwaarden:**

- **Model:** erft de aanroeper, tenzij je `agents.defaults.subagents.model` instelt (of per-agent `agents.list[].subagents.model`); een expliciete `sessions_spawn.model` wint nog steeds.
- **Thinking:** erft de aanroeper, tenzij je `agents.defaults.subagents.thinking` instelt (of per-agent `agents.list[].subagents.thinking`); een expliciete `sessions_spawn.thinking` wint nog steeds.
- **Run-time-out:** als `sessions_spawn.runTimeoutSeconds` is weggelaten, gebruikt OpenClaw `agents.defaults.subagents.runTimeoutSeconds` wanneer ingesteld; anders valt het terug op `0` (geen time-out).

### Hulpmiddelparameters

<ParamField path="task" type="string" required>
  De taakbeschrijving voor de sub-agent.
</ParamField>
<ParamField path="label" type="string">
  Optioneel voor mensen leesbaar label.
</ParamField>
<ParamField path="agentId" type="string">
  Spawn onder een andere agent-id wanneer toegestaan door `subagents.allowAgents`.
</ParamField>
<ParamField path="runtime" type='"subagent" | "acp"' default="subagent">
  `acp` is alleen voor externe ACP-harnassen (`claude`, `droid`, `gemini`, `opencode`, of expliciet aangevraagde Codex ACP/acpx) en voor `agents.list[]`-vermeldingen waarvan `runtime.type` `acp` is.
</ParamField>
<ParamField path="resumeSessionId" type="string">
  Alleen ACP. Hervat een bestaande ACP-harnesssessie wanneer `runtime: "acp"`; genegeerd voor native sub-agentspawns.
</ParamField>
<ParamField path="streamTo" type='"parent"'>
  Alleen ACP. Streamt ACP-runuitvoer naar de bovenliggende sessie wanneer `runtime: "acp"`; weglaten voor native sub-agentspawns.
</ParamField>
<ParamField path="model" type="string">
  Overschrijf het sub-agentmodel. Ongeldige waarden worden overgeslagen en de sub-agent draait op het standaardmodel met een waarschuwing in het toolresultaat.
</ParamField>
<ParamField path="thinking" type="string">
  Overschrijf het thinking-niveau voor de sub-agentrun.
</ParamField>
<ParamField path="runTimeoutSeconds" type="number">
  Standaard `agents.defaults.subagents.runTimeoutSeconds` wanneer ingesteld, anders `0`. Wanneer ingesteld, wordt de sub-agentrun na N seconden afgebroken.
</ParamField>
<ParamField path="thread" type="boolean" default="false">
  Wanneer `true`, vraagt dit kanaalthreadbinding aan voor deze sub-agentsessie.
</ParamField>
<ParamField path="mode" type='"run" | "session"' default="run">
  Als `thread: true` en `mode` is weggelaten, wordt de standaard `session`. `mode: "session"` vereist `thread: true`.
</ParamField>
<ParamField path="cleanup" type='"delete" | "keep"' default="keep">
  `"delete"` archiveert onmiddellijk na de melding (behoudt het transcript nog steeds via hernoemen).
</ParamField>
<ParamField path="sandbox" type='"inherit" | "require"' default="inherit">
  `require` weigert spawn tenzij de doel-kindruntime in een sandbox zit.
</ParamField>
<ParamField path="context" type='"isolated" | "fork"' default="isolated">
  `fork` vertakt het huidige transcript van de aanvrager naar de kindsessie. Alleen native sub-agents. Gebruik `fork` alleen wanneer het kind het huidige transcript nodig heeft.
</ParamField>

<Warning>
`sessions_spawn` accepteert **geen** kanaalbezorgingsparams (`target`,
`channel`, `to`, `threadId`, `replyTo`, `transport`). Gebruik voor bezorging
`message`/`sessions_send` vanuit de gespawnde run.
</Warning>

## Threadgebonden sessies

Wanneer threadbindingen zijn ingeschakeld voor een kanaal, kan een sub-agent
aan een thread gebonden blijven zodat opvolgende gebruikersberichten in die thread
naar dezelfde sub-agentsessie blijven routeren.

### Kanalen met threadondersteuning

**Discord** is momenteel het enige ondersteunde kanaal. Het ondersteunt
persistente threadgebonden sub-agentsessies (`sessions_spawn` met
`thread: true`), handmatige threadbesturing (`/focus`, `/unfocus`, `/agents`,
`/session idle`, `/session max-age`) en adaptersleutels
`channels.discord.threadBindings.enabled`,
`channels.discord.threadBindings.idleHours`,
`channels.discord.threadBindings.maxAgeHours` en
`channels.discord.threadBindings.spawnSubagentSessions`.

### Snelle flow

<Steps>
  <Step title="Spawn">
    `sessions_spawn` met `thread: true` (en optioneel `mode: "session"`).
  </Step>
  <Step title="Bind">
    OpenClaw maakt of bindt een thread aan dat sessiedoel in het actieve kanaal.
  </Step>
  <Step title="Route follow-ups">
    Antwoorden en opvolgende berichten in die thread routeren naar de gebonden sessie.
  </Step>
  <Step title="Inspect timeouts">
    Gebruik `/session idle` om automatische unfocus bij inactiviteit te inspecteren/bij te werken en
    `/session max-age` om de harde limiet te beheren.
  </Step>
  <Step title="Detach">
    Gebruik `/unfocus` om handmatig los te koppelen.
  </Step>
</Steps>

### Handmatige besturing

| Opdracht           | Effect                                                                |
| ------------------ | --------------------------------------------------------------------- |
| `/focus <target>`  | Koppel de huidige thread (of maak er een) aan een subagent-/sessiedoel |
| `/unfocus`         | Verwijder de koppeling voor de huidige gekoppelde thread              |
| `/agents`          | Toon actieve runs en koppelingsstatus (`thread:<id>` of `unbound`)    |
| `/session idle`    | Inspecteer/update automatisch ontfocussen bij inactiviteit (alleen gefocuste gekoppelde threads) |
| `/session max-age` | Inspecteer/update harde limiet (alleen gefocuste gekoppelde threads)  |

### Configuratieschakelaars

- **Globale standaard:** `session.threadBindings.enabled`, `session.threadBindings.idleHours`, `session.threadBindings.maxAgeHours`.
- **Kanaaloverride en sleutels voor automatisch koppelen bij spawn** zijn adapterspecifiek. Zie [Kanalen met threadondersteuning](#thread-supporting-channels) hierboven.

Zie [Configuratiereferentie](/nl/gateway/configuration-reference) en
[Slash-opdrachten](/nl/tools/slash-commands) voor actuele adapterdetails.

### Toestaanlijst

<ParamField path="agents.list[].subagents.allowAgents" type="string[]">
  Lijst met agent-id's die via expliciete `agentId` kunnen worden benaderd (`["*"]` staat alles toe). Standaard: alleen de aanvragende agent. Als je een lijst instelt en nog steeds wilt dat de aanvrager zichzelf met `agentId` kan spawnen, neem dan de id van de aanvrager op in de lijst.
</ParamField>
<ParamField path="agents.defaults.subagents.allowAgents" type="string[]">
  Standaard toestaanlijst voor doelagents die wordt gebruikt wanneer de aanvragende agent geen eigen `subagents.allowAgents` instelt.
</ParamField>
<ParamField path="agents.defaults.subagents.requireAgentId" type="boolean" default="false">
  Blokkeer `sessions_spawn`-aanroepen die `agentId` weglaten (dwingt expliciete profielselectie af). Override per agent: `agents.list[].subagents.requireAgentId`.
</ParamField>

Als de sessie van de aanvrager in een sandbox draait, weigert `sessions_spawn` doelen
die zonder sandbox zouden draaien.

### Ontdekking

Gebruik `agents_list` om te zien welke agent-id's momenteel zijn toegestaan voor
`sessions_spawn`. Het antwoord bevat het effectieve model en ingesloten runtime-metadata
van elke vermelde agent, zodat aanroepers PI, Codex
app-server en andere geconfigureerde native runtimes kunnen onderscheiden.

### Automatisch archiveren

- Subagentsessies worden automatisch gearchiveerd na `agents.defaults.subagents.archiveAfterMinutes` (standaard `60`).
- Archiveren gebruikt `sessions.delete` en hernoemt het transcript naar `*.deleted.<timestamp>` (dezelfde map).
- `cleanup: "delete"` archiveert direct na de aankondiging (het transcript blijft via hernoemen behouden).
- Automatisch archiveren is best-effort; lopende timers gaan verloren als de Gateway herstart.
- `runTimeoutSeconds` archiveert **niet** automatisch; het stopt alleen de run. De sessie blijft bestaan tot automatisch archiveren.
- Automatisch archiveren geldt zowel voor diepte-1- als diepte-2-sessies.
- Browseropschoning staat los van archiefopschoning: bijgehouden browsertabs/-processen worden best-effort gesloten wanneer de run eindigt, zelfs als het transcript-/sessierecord wordt behouden.

## Geneste subagents

Standaard kunnen subagents geen eigen subagents spawnen
(`maxSpawnDepth: 1`). Stel `maxSpawnDepth: 2` in om één niveau
nesting in te schakelen — het **orchestrator-patroon**: hoofd → orchestrator-subagent →
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

| Diepte | Vorm van sessiesleutel                        | Rol                                           | Kan spawnen?                 |
| ------ | --------------------------------------------- | --------------------------------------------- | ---------------------------- |
| 0      | `agent:<id>:main`                             | Hoofdagent                                    | Altijd                       |
| 1      | `agent:<id>:subagent:<uuid>`                  | Subagent (orchestrator wanneer diepte 2 is toegestaan) | Alleen als `maxSpawnDepth >= 2` |
| 2      | `agent:<id>:subagent:<uuid>:subagent:<uuid>`  | Subsubagent (leaf-worker)                     | Nooit                        |

### Aankondigingsketen

Resultaten stromen terug omhoog door de keten:

1. Diepte-2-worker voltooit → kondigt aan bij de ouder (diepte-1-orchestrator).
2. Diepte-1-orchestrator ontvangt de aankondiging, synthetiseert resultaten, voltooit → kondigt aan bij hoofd.
3. Hoofdagent ontvangt de aankondiging en levert die aan de gebruiker.

Elk niveau ziet alleen aankondigingen van zijn directe kinderen.

<Note>
**Operationele richtlijn:** start kindwerk één keer en wacht op voltooiingsgebeurtenissen
in plaats van poll-loops te bouwen rond `sessions_list`,
`sessions_history`, `/subagents list` of `exec`-slaapopdrachten.
`sessions_list` en `/subagents list` houden relaties van kindsessies
gericht op live werk — live kinderen blijven gekoppeld, beëindigde kinderen blijven
kort zichtbaar in een recent venster, en verouderde alleen-opslag-kindlinks worden
genegeerd na hun versheidsvenster. Dit voorkomt dat oude `spawnedBy`- /
`parentSessionKey`-metadata na een herstart schijnkinderen doen herleven.
Als een voltooiingsgebeurtenis van een kind binnenkomt nadat je het
definitieve antwoord al hebt verzonden, is de juiste follow-up het exacte stille token
`NO_REPLY` / `no_reply`.
</Note>

### Toolbeleid per diepte

- Rol en controlescope worden bij het spawnen naar sessiemetadata geschreven. Daardoor kunnen platte of herstelde sessiesleutels niet per ongeluk opnieuw orchestratorrechten krijgen.
- **Diepte 1 (orchestrator, wanneer `maxSpawnDepth >= 2`):** krijgt `sessions_spawn`, `subagents`, `sessions_list`, `sessions_history` zodat deze zijn kinderen kan beheren. Andere sessie-/systeemtools blijven geweigerd.
- **Diepte 1 (leaf, wanneer `maxSpawnDepth == 1`):** geen sessietools (huidig standaardgedrag).
- **Diepte 2 (leaf-worker):** geen sessietools — `sessions_spawn` wordt op diepte 2 altijd geweigerd. Kan geen verdere kinderen spawnen.

### Spawnlimiet per agent

Elke agentsessie (op elke diepte) kan maximaal `maxChildrenPerAgent`
(standaard `5`) actieve kinderen tegelijk hebben. Dit voorkomt onbeheersbare fan-out
vanuit één orchestrator.

### Cascaderend stoppen

Het stoppen van een diepte-1-orchestrator stopt automatisch al zijn diepte-2
kinderen:

- `/stop` in de hoofdchat stopt alle diepte-1-agents en cascadeert naar hun diepte-2-kinderen.
- `/subagents kill <id>` stopt een specifieke subagent en cascadeert naar zijn kinderen.
- `/subagents kill all` stopt alle subagents voor de aanvrager en cascadeert.

## Authenticatie

Subagentauthenticatie wordt opgelost op basis van **agent-id**, niet op basis van sessietype:

- De sessiesleutel van de subagent is `agent:<agentId>:subagent:<uuid>`.
- De auth-store wordt geladen uit de `agentDir` van die agent.
- De auth-profielen van de hoofdagent worden samengevoegd als **fallback**; agentprofielen overschrijven hoofdprofielen bij conflicten.

De samenvoeging is additief, dus hoofdprofielen zijn altijd beschikbaar als
fallbacks. Volledig geïsoleerde authenticatie per agent wordt nog niet ondersteund.

## Aankondigen

Subagents rapporteren terug via een aankondigingsstap:

- De aankondigingsstap draait binnen de subagentsessie (niet de aanvragersessie).
- Als de subagent exact `ANNOUNCE_SKIP` antwoordt, wordt er niets geplaatst.
- Als de nieuwste assistenttekst het exacte stille token `NO_REPLY` / `no_reply` is, wordt aankondigingsuitvoer onderdrukt, zelfs als er eerder zichtbare voortgang bestond.

Levering hangt af van de diepte van de aanvrager:

- Sessies van aanvragers op topniveau gebruiken een follow-up `agent`-aanroep met externe levering (`deliver=true`).
- Geneste subagentsessies van aanvragers ontvangen een interne follow-upinjectie (`deliver=false`) zodat de orchestrator kindresultaten binnen de sessie kan synthetiseren.
- Als een geneste subagentsessie van een aanvrager verdwenen is, valt OpenClaw terug op de aanvrager van die sessie wanneer beschikbaar.

Voor sessies van aanvragers op topniveau lost directe levering in voltooiingsmodus eerst
een gekoppelde conversatie-/threadroute en hook-override op, en vult daarna
ontbrekende kanaaldoelvelden vanuit de opgeslagen route van de aanvragersessie.
Daardoor blijven voltooiingen op de juiste chat/het juiste topic, zelfs wanneer de voltooiingsoorsprong
alleen het kanaal identificeert.

Aggregatie van kindvoltooiingen is gescoped tot de huidige run van de aanvrager bij het
opbouwen van geneste voltooiingsbevindingen, zodat verouderde kinduitvoer uit eerdere runs
niet in de huidige aankondiging lekt. Aankondigingsantwoorden behouden
thread-/topicroutering wanneer beschikbaar op kanaaladapters.

### Aankondigingscontext

Aankondigingscontext wordt genormaliseerd naar een stabiel intern gebeurtenisblok:

| Veld             | Bron                                                                                                          |
| ---------------- | ------------------------------------------------------------------------------------------------------------- |
| Bron             | `subagent` of `cron`                                                                                          |
| Sessie-id's      | Sessiekey/-id van kind                                                                                        |
| Type             | Aankondigingstype + taaklabel                                                                                 |
| Status           | Afgeleid van runtime-uitkomst (`success`, `error`, `timeout` of `unknown`) — **niet** afgeleid van modeltekst |
| Resultaatinhoud  | Nieuwste zichtbare assistenttekst, anders opgeschoonde nieuwste tool-/toolResult-tekst                         |
| Follow-up        | Instructie die beschrijft wanneer te antwoorden versus stil te blijven                                         |

Terminaal mislukte runs rapporteren de foutstatus zonder vastgelegde
antwoordtekst opnieuw af te spelen. Bij een timeout kan, als het kind alleen door toolaanroepen is gekomen, de aankondiging
die geschiedenis samenvouwen tot een korte samenvatting van gedeeltelijke voortgang in plaats van
ruwe tooluitvoer opnieuw af te spelen.

### Statistiekregel

Aankondigingspayloads bevatten aan het einde een statistiekregel (ook wanneer ingepakt):

- Runtime (bijv. `runtime 5m12s`).
- Tokengebruik (invoer/uitvoer/totaal).
- Geschatte kosten wanneer modelprijzen zijn geconfigureerd (`models.providers.*.models[].cost`).
- `sessionKey`, `sessionId` en transcriptpad zodat de hoofdagent geschiedenis kan ophalen via `sessions_history` of het bestand op schijf kan inspecteren.

Interne metadata is alleen bedoeld voor orchestratie; gebruikersgerichte antwoorden
moeten worden herschreven in normale assistentstem.

### Waarom `sessions_history` de voorkeur heeft

`sessions_history` is het veiligere orchestratiepad:

- Assistentherinnering wordt eerst genormaliseerd: thinking-tags verwijderd; `<relevant-memories>`- / `<relevant_memories>`-scaffolding verwijderd; XML-payloadblokken met toolaanroepen in platte tekst (`<tool_call>`, `<function_call>`, `<tool_calls>`, `<function_calls>`) verwijderd, inclusief afgekorte payloads die nooit netjes sluiten; gedegradeerde tool-call/result-scaffolding en historische-contextmarkeringen verwijderd; gelekte modelcontroletokens (`<|assistant|>`, andere ASCII `<|...|>`, full-width `<｜...｜>`) verwijderd; misvormde MiniMax-tool-call-XML verwijderd.
- Tekst die op referenties/tokens lijkt, wordt geredigeerd.
- Lange blokken kunnen worden afgekapt.
- Zeer grote geschiedenissen kunnen oudere rijen laten vallen of een te grote rij vervangen door `[sessions_history omitted: message too large]`.
- Inspectie van het ruwe transcript op schijf is de fallback wanneer je het volledige byte-voor-byte transcript nodig hebt.

## Toolbeleid

Subagents gebruiken eerst dezelfde profiel- en toolbeleidspijplijn als de ouder- of
doelagent. Daarna past OpenClaw de restrictielaag voor subagents toe.

Zonder beperkend `tools.profile` krijgen subagents **alle tools behalve
sessietools** en systeemtools:

- `sessions_list`
- `sessions_history`
- `sessions_send`
- `sessions_spawn`

`sessions_history` blijft ook hier een begrensde, opgeschoonde herinneringsweergave —
het is geen ruwe transcriptdump.

Wanneer `maxSpawnDepth >= 2` ontvangen diepte-1-orchestrator-subagents daarnaast
`sessions_spawn`, `subagents`, `sessions_list` en
`sessions_history` zodat ze hun kinderen kunnen beheren.

### Override via configuratie

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

`tools.subagents.tools.allow` is een definitief allow-only filter. Het kan de al opgeloste toolset beperken, maar het kan geen tool **terug toevoegen** die door `tools.profile` is verwijderd. Bijvoorbeeld: `tools.profile: "coding"` bevat `web_search`/`web_fetch`, maar niet de tool `browser`. Voeg browser toe in de profielfase om sub-agents met het coding-profiel browserautomatisering te laten gebruiken:

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

Sub-agents gebruiken een toegewezen in-process wachtrijbaan:

- **Baannaam:** `subagent`
- **Gelijktijdigheid:** `agents.defaults.subagents.maxConcurrent` (standaard `8`)

## Liveness en herstel

OpenClaw behandelt het ontbreken van `endedAt` niet als permanent bewijs dat een sub-agent nog leeft. Niet-beëindigde runs die ouder zijn dan het venster voor verouderde runs tellen niet meer mee als actief/in behandeling in `/subagents list`, statusoverzichten, gating voor voltooiing van descendants, en gelijktijdigheidscontroles per sessie.

Na een Gateway-herstart worden verouderde, niet-beëindigde herstelde runs opgeschoond, tenzij hun child session is gemarkeerd als `abortedLastRun: true`. Die door een herstart afgebroken child sessions blijven herstelbaar via de herstelstroom voor verweesde sub-agents, die een synthetisch hervattingsbericht verzendt voordat de afbreekmarkering wordt gewist.

<Note>
Als het spawnen van een sub-agent mislukt met Gateway `PAIRING_REQUIRED` / `scope-upgrade`, controleer dan de RPC-caller voordat je de pairing-status bewerkt. Interne `sessions_spawn`-coördinatie moet verbinden als `client.id: "gateway-client"` met `client.mode: "backend"` via directe local loopback shared-token/password-auth; dat pad is niet afhankelijk van de scope-baseline voor gekoppelde apparaten van de CLI. Externe callers, expliciete `deviceIdentity`, expliciete device-token-paden en browser/node-clients hebben nog steeds normale apparaatgoedkeuring nodig voor scope-upgrades.
</Note>

## Stoppen

- Het verzenden van `/stop` in de chat van de aanvrager breekt de aanvragersessie af en stopt alle actieve sub-agent-runs die daaruit zijn gespawnd, met cascade naar geneste children.
- `/subagents kill <id>` stopt een specifieke sub-agent en cascadeert naar diens children.

## Beperkingen

- Aankondiging door sub-agents is **best-effort**. Als de gateway herstart, gaat in behandeling zijnd "announce back"-werk verloren.
- Sub-agents delen nog steeds dezelfde procesresources van de gateway; behandel `maxConcurrent` als een veiligheidsklep.
- `sessions_spawn` is altijd niet-blokkerend: het retourneert onmiddellijk `{ status: "accepted", runId, childSessionKey }`.
- Sub-agent-context injecteert alleen `AGENTS.md` + `TOOLS.md` (geen `SOUL.md`, `IDENTITY.md`, `USER.md`, `HEARTBEAT.md` of `BOOTSTRAP.md`).
- Maximale nestingsdiepte is 5 (`maxSpawnDepth`-bereik: 1–5). Diepte 2 wordt aanbevolen voor de meeste gebruikssituaties.
- `maxChildrenPerAgent` beperkt actieve children per sessie (standaard `5`, bereik `1–20`).

## Gerelateerd

- [ACP-agents](/nl/tools/acp-agents)
- [Agent verzenden](/nl/tools/agent-send)
- [Achtergrondtaken](/nl/automation/tasks)
- [Multi-agent sandbox-tools](/nl/tools/multi-agent-sandbox-tools)
