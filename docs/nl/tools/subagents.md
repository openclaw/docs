---
read_when:
    - Je wilt werk op de achtergrond of parallel werk via de agent
    - Je wijzigt het beleid voor sessions_spawn of sub-agenttools
    - Je implementeert threadgebonden subagent-sessies of lost problemen ermee op
sidebarTitle: Sub-agents
summary: Start geïsoleerde agentuitvoeringen op de achtergrond die resultaten terugmelden in de chat van de aanvrager
title: Subagenten
x-i18n:
    generated_at: "2026-04-30T16:30:48Z"
    model: gpt-5.5
    provider: openai
    source_hash: c7c46d2c6d9ddac23653dcbfaf20df0ff5be9619035a1b115a3b49fd48fd8280
    source_path: tools/subagents.md
    workflow: 16
---

Sub-agenten zijn agentuitvoeringen op de achtergrond die vanuit een bestaande agentuitvoering worden gestart.
Ze draaien in hun eigen sessie (`agent:<agentId>:subagent:<uuid>`) en
**kondigen** hun resultaat, wanneer ze klaar zijn, terug aan in het chatkanaal
van de aanvrager. Elke sub-agentuitvoering wordt bijgehouden als een
[achtergrondtaak](/nl/automation/tasks).

Primaire doelen:

- Werk voor "onderzoek / lange taak / trage tool" parallel uitvoeren zonder de hoofduitvoering te blokkeren.
- Sub-agenten standaard geisoleerd houden (sessiescheiding + optionele sandboxing).
- Het tooloppervlak moeilijk verkeerd bruikbaar houden: sub-agenten krijgen standaard **geen** sessietools.
- Configureerbare nestingsdiepte ondersteunen voor orchestratorpatronen.

<Note>
**Kostenopmerking:** elke sub-agent heeft standaard zijn eigen context en
tokengebruik. Stel voor zware of repetitieve taken een goedkoper model in voor
sub-agenten en houd je hoofd-agent op een model van hogere kwaliteit. Configureer via
`agents.defaults.subagents.model` of overrides per agent. Wanneer een child
echt het huidige transcript van de aanvrager nodig heeft, kan de agent
`context: "fork"` aanvragen voor die ene spawn.
</Note>

## Slash-opdracht

Gebruik `/subagents` om sub-agentuitvoeringen voor de **huidige
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

`/subagents info` toont metadata van de uitvoering (status, tijdstempels, sessie-id,
transcriptpad, cleanup). Gebruik `sessions_history` voor een begrensde,
veiligheidsgefilterde recall-weergave; inspecteer het transcriptpad op schijf wanneer je
het ruwe volledige transcript nodig hebt.

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
interne relay) en stuurt een laatste voltooiingsupdate terug naar de
chat van de aanvrager wanneer de uitvoering klaar is.

<AccordionGroup>
  <Accordion title="Non-blocking, push-based completion">
    - De spawnopdracht is niet-blokkerend; deze geeft onmiddellijk een uitvoerings-id terug.
    - Bij voltooiing kondigt de sub-agent een samenvattings-/resultaatbericht aan in het chatkanaal van de aanvrager.
    - Voltooiing is push-gebaseerd. Nadat de agent is gespawnd, poll **niet** `/subagents list`, `sessions_list` of `sessions_history` in een lus alleen om te wachten tot die klaar is; inspecteer de status alleen op aanvraag voor debugging of ingrijpen.
    - Bij voltooiing sluit OpenClaw naar beste vermogen bijgehouden browsertabbladen/processen die door die sub-agentsessie zijn geopend voordat de aankondigings-cleanupstroom doorgaat.

  </Accordion>
  <Accordion title="Manual-spawn delivery resilience">
    - OpenClaw probeert eerst directe `agent`-levering met een stabiele idempotentiesleutel.
    - Als directe levering mislukt, valt het terug op routering via de wachtrij.
    - Als routering via de wachtrij nog steeds niet beschikbaar is, wordt de aankondiging opnieuw geprobeerd met een korte exponentiële backoff voordat definitief wordt opgegeven.
    - Voltooiingslevering behoudt de opgeloste route van de aanvrager: threadgebonden of conversatiegebonden voltooiingsroutes winnen wanneer ze beschikbaar zijn; als de voltooiingsoorsprong alleen een kanaal levert, vult OpenClaw het ontbrekende doel/account aan vanuit de opgeloste route van de aanvragersessie (`lastChannel` / `lastTo` / `lastAccountId`) zodat directe levering blijft werken.

  </Accordion>
  <Accordion title="Completion handoff metadata">
    De voltooiingshandoff naar de aanvragersessie is runtime-gegenereerde
    interne context (geen door de gebruiker geschreven tekst) en bevat:

    - `Result` — nieuwste zichtbare antwoordtekst van `assistant`, anders opgeschoonde nieuwste tool-/toolResult-tekst. Terminal mislukte uitvoeringen hergebruiken geen vastgelegde antwoordtekst.
    - `Status` — `completed successfully` / `failed` / `timed out` / `unknown`.
    - Compacte runtime-/tokenstatistieken.
    - Een leveringsinstructie die de aanvragende agent vertelt om te herschrijven in normale assistant-stem (niet om ruwe interne metadata door te sturen).

  </Accordion>
  <Accordion title="Modes and ACP runtime">
    - `--model` en `--thinking` overschrijven standaardwaarden voor die specifieke uitvoering.
    - Gebruik `info`/`log` om details en uitvoer na voltooiing te inspecteren.
    - `/subagents spawn` is eenmalige modus (`mode: "run"`). Gebruik voor persistente threadgebonden sessies `sessions_spawn` met `thread: true` en `mode: "session"`.
    - Gebruik voor ACP-harnassessies (Claude Code, Gemini CLI, OpenCode, of expliciete Codex ACP/acpx) `sessions_spawn` met `runtime: "acp"` wanneer de tool die runtime adverteert. Zie [ACP-leveringsmodel](/nl/tools/acp-agents#delivery-model) bij het debuggen van voltooiingen of agent-naar-agent-lussen. Wanneer de `codex`-Plugin is ingeschakeld, moet Codex-chat-/threadbesturing de voorkeur geven aan `/codex ...` boven ACP, tenzij de gebruiker expliciet om ACP/acpx vraagt.
    - OpenClaw verbergt `runtime: "acp"` totdat ACP is ingeschakeld, de aanvrager niet in een sandbox zit en een backend-Plugin zoals `acpx` is geladen. `runtime: "acp"` verwacht een externe ACP-harness-id, of een `agents.list[]`-vermelding met `runtime.type="acp"`; gebruik de standaard sub-agentruntime voor normale OpenClaw-configagenten uit `agents_list`.

  </Accordion>
</AccordionGroup>

## Contextmodi

Native sub-agenten starten geisoleerd tenzij de aanroeper expliciet vraagt om het
huidige transcript te forken.

| Modus      | Wanneer je dit gebruikt                                                                                                                | Gedrag                                                                            |
| ---------- | -------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------- |
| `isolated` | Nieuw onderzoek, onafhankelijke implementatie, traag toolwerk, of alles wat in de taaktekst kan worden gebrieft                        | Maakt een schoon child-transcript. Dit is de standaard en houdt tokengebruik lager. |
| `fork`     | Werk dat afhangt van het huidige gesprek, eerdere toolresultaten of genuanceerde instructies die al in het transcript van de aanvrager staan | Vertakt het aanvragerstranscript naar de child-sessie voordat de child start.     |

Gebruik `fork` spaarzaam. Het is bedoeld voor contextgevoelige delegatie, niet als
vervanging voor het schrijven van een duidelijke taakprompt.

## Tool: `sessions_spawn`

Start een sub-agentuitvoering met `deliver: false` op de globale `subagent`-lane,
voert daarna een aankondigingsstap uit en plaatst het aankondigingsantwoord in het
chatkanaal van de aanvrager.

Beschikbaarheid hangt af van het effectieve toolbeleid van de aanroeper. De profielen `coding` en
`full` stellen `sessions_spawn` standaard beschikbaar. Het profiel `messaging`
doet dat niet; voeg `tools.alsoAllow: ["sessions_spawn", "sessions_yield",
"subagents"]` toe of gebruik `tools.profile: "coding"` voor agenten die werk moeten delegeren.
Kanaal-/groeps-, provider-, sandbox- en allow/deny-beleid per agent kunnen
de tool na de profielfase nog steeds verwijderen. Gebruik `/tools` vanuit dezelfde
sessie om de effectieve toollijst te bevestigen.

**Standaardwaarden:**

- **Model:** erft van de aanroeper tenzij je `agents.defaults.subagents.model` instelt (of `agents.list[].subagents.model` per agent); een expliciete `sessions_spawn.model` wint nog steeds.
- **Thinking:** erft van de aanroeper tenzij je `agents.defaults.subagents.thinking` instelt (of `agents.list[].subagents.thinking` per agent); een expliciete `sessions_spawn.thinking` wint nog steeds.
- **Uitvoeringstime-out:** als `sessions_spawn.runTimeoutSeconds` is weggelaten, gebruikt OpenClaw `agents.defaults.subagents.runTimeoutSeconds` wanneer ingesteld; anders valt het terug op `0` (geen time-out).

### Toolparameters

<ParamField path="task" type="string" required>
  De taakbeschrijving voor de sub-agent.
</ParamField>
<ParamField path="label" type="string">
  Optioneel menselijk leesbaar label.
</ParamField>
<ParamField path="agentId" type="string">
  Spawn onder een andere agent-id wanneer toegestaan door `subagents.allowAgents`.
</ParamField>
<ParamField path="runtime" type='"subagent" | "acp"' default="subagent">
  `acp` is alleen voor externe ACP-harnassen (`claude`, `droid`, `gemini`, `opencode`, of expliciet aangevraagde Codex ACP/acpx) en voor `agents.list[]`-vermeldingen waarvan `runtime.type` `acp` is.
</ParamField>
<ParamField path="resumeSessionId" type="string">
  Alleen ACP. Hervat een bestaande ACP-harnassessie wanneer `runtime: "acp"`; genegeerd voor native sub-agentspawns.
</ParamField>
<ParamField path="streamTo" type='"parent"'>
  Alleen ACP. Streamt uitvoer van ACP-uitvoering naar de parentsessie wanneer `runtime: "acp"`; laat weg voor native sub-agentspawns.
</ParamField>
<ParamField path="model" type="string">
  Overschrijf het sub-agentmodel. Ongeldige waarden worden overgeslagen en de sub-agent draait op het standaardmodel met een waarschuwing in het toolresultaat.
</ParamField>
<ParamField path="thinking" type="string">
  Overschrijf het thinking-niveau voor de sub-agentuitvoering.
</ParamField>
<ParamField path="runTimeoutSeconds" type="number">
  Standaard `agents.defaults.subagents.runTimeoutSeconds` wanneer ingesteld, anders `0`. Wanneer ingesteld, wordt de sub-agentuitvoering na N seconden afgebroken.
</ParamField>
<ParamField path="thread" type="boolean" default="false">
  Wanneer `true`, vraagt dit kanaal-threadbinding aan voor deze sub-agentsessie.
</ParamField>
<ParamField path="mode" type='"run" | "session"' default="run">
  Als `thread: true` en `mode` is weggelaten, wordt de standaard `session`. `mode: "session"` vereist `thread: true`.
</ParamField>
<ParamField path="cleanup" type='"delete" | "keep"' default="keep">
  `"delete"` archiveert onmiddellijk na de aankondiging (behoudt het transcript nog steeds via hernoemen).
</ParamField>
<ParamField path="sandbox" type='"inherit" | "require"' default="inherit">
  `require` weigert spawn tenzij de beoogde child-runtime in een sandbox zit.
</ParamField>
<ParamField path="context" type='"isolated" | "fork"' default="isolated">
  `fork` vertakt het huidige transcript van de aanvrager naar de child-sessie. Alleen native sub-agenten. Gebruik `fork` alleen wanneer de child het huidige transcript nodig heeft.
</ParamField>

<Warning>
`sessions_spawn` accepteert **geen** kanaalleveringsparameters (`target`,
`channel`, `to`, `threadId`, `replyTo`, `transport`). Gebruik voor levering
`message`/`sessions_send` vanuit de gespawnde uitvoering.
</Warning>

## Threadgebonden sessies

Wanneer threadbindingen zijn ingeschakeld voor een kanaal, kan een sub-agent gebonden blijven
aan een thread zodat vervolgeberichten van gebruikers in die thread naar dezelfde
sub-agentsessie blijven routeren.

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
    Antwoorden en vervolgeberichten in die thread routeren naar de gebonden sessie.
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

| Opdracht           | Effect                                                               |
| ------------------ | -------------------------------------------------------------------- |
| `/focus <target>`  | Koppel de huidige thread (of maak er een) aan een subagent-/sessiedoel |
| `/unfocus`         | Verwijder de koppeling voor de huidige gekoppelde thread             |
| `/agents`          | Toon actieve runs en koppelingsstatus (`thread:<id>` of `unbound`)   |
| `/session idle`    | Bekijk/wijzig automatisch ontfocussen bij inactiviteit (alleen gefocuste gekoppelde threads) |
| `/session max-age` | Bekijk/wijzig harde limiet (alleen gefocuste gekoppelde threads)     |

### Configuratieschakelaars

- **Globale standaard:** `session.threadBindings.enabled`, `session.threadBindings.idleHours`, `session.threadBindings.maxAgeHours`.
- **Kanaaloverride en spawn-auto-bind-sleutels** zijn adapterspecifiek. Zie [kanalen met threadondersteuning](#thread-supporting-channels) hierboven.

Zie [Configuratiereferentie](/nl/gateway/configuration-reference) en
[Slash-opdrachten](/nl/tools/slash-commands) voor actuele adapterdetails.

### Allowlist

<ParamField path="agents.list[].subagents.allowAgents" type="string[]">
  Lijst met agent-id's die via expliciete `agentId` kunnen worden gericht (`["*"]` staat alles toe). Standaard: alleen de aanvragende agent. Als je een lijst instelt en nog steeds wilt dat de aanvrager zichzelf met `agentId` kan spawnen, neem dan de id van de aanvrager op in de lijst.
</ParamField>
<ParamField path="agents.defaults.subagents.allowAgents" type="string[]">
  Standaard allowlist voor doelagents die wordt gebruikt wanneer de aanvragende agent geen eigen `subagents.allowAgents` instelt.
</ParamField>
<ParamField path="agents.defaults.subagents.requireAgentId" type="boolean" default="false">
  Blokkeer `sessions_spawn`-aanroepen die `agentId` weglaten (dwingt expliciete profielselectie af). Override per agent: `agents.list[].subagents.requireAgentId`.
</ParamField>

Als de aanvragende sessie in een sandbox draait, weigert `sessions_spawn` doelen
die zonder sandbox zouden worden uitgevoerd.

### Detectie

Gebruik `agents_list` om te zien welke agent-id's momenteel zijn toegestaan voor
`sessions_spawn`. De respons bevat het effectieve model en ingesloten
runtime-metadata van elke vermelde agent, zodat aanroepers onderscheid kunnen maken tussen PI, Codex
app-server en andere geconfigureerde native runtimes.

### Automatisch archiveren

- Subagentsessies worden automatisch gearchiveerd na `agents.defaults.subagents.archiveAfterMinutes` (standaard `60`).
- Archiveren gebruikt `sessions.delete` en hernoemt het transcript naar `*.deleted.<timestamp>` (dezelfde map).
- `cleanup: "delete"` archiveert direct na aankondiging (bewaart het transcript nog steeds via hernoemen).
- Automatisch archiveren is best-effort; wachtende timers gaan verloren als de Gateway opnieuw start.
- `runTimeoutSeconds` archiveert **niet** automatisch; het stopt alleen de run. De sessie blijft bestaan tot automatisch archiveren.
- Automatisch archiveren geldt zowel voor diepte-1- als diepte-2-sessies.
- Browseropschoning staat los van archiefopschoning: bijgehouden browsertabs/processen worden best-effort gesloten wanneer de run klaar is, zelfs als het transcript/de sessierecord wordt bewaard.

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
| ----- | -------------------------------------------- | --------------------------------------------- | ---------------------------- |
| 0     | `agent:<id>:main`                            | Hoofdagent                                    | Altijd                       |
| 1     | `agent:<id>:subagent:<uuid>`                 | Subagent (orchestrator wanneer diepte 2 is toegestaan) | Alleen als `maxSpawnDepth >= 2` |
| 2     | `agent:<id>:subagent:<uuid>:subagent:<uuid>` | Sub-subagent (leaf worker)                    | Nooit                        |

### Aankondigingsketen

Resultaten stromen terug omhoog door de keten:

1. Diepte-2-worker voltooit → kondigt aan bij zijn ouder (diepte-1-orchestrator).
2. Diepte-1-orchestrator ontvangt de aankondiging, synthetiseert resultaten, voltooit → kondigt aan bij hoofd.
3. Hoofdagent ontvangt de aankondiging en levert aan de gebruiker.

Elk niveau ziet alleen aankondigingen van zijn directe kinderen.

<Note>
**Operationele richtlijn:** start kindwerk eenmalig en wacht op voltooiingsgebeurtenissen
in plaats van poll-lussen te bouwen rond `sessions_list`,
`sessions_history`, `/subagents list` of `exec`-slaapopdrachten.
`sessions_list` en `/subagents list` houden kind-sessierelaties
gericht op live werk — live kinderen blijven gekoppeld, beëindigde kinderen blijven
korte tijd zichtbaar in een recent venster, en verouderde store-only kindkoppelingen worden
genegeerd na hun versheidsvenster. Dit voorkomt dat oude `spawnedBy`-/
`parentSessionKey`-metadata na een herstart spookkinderen opnieuw tot leven brengt.
Als een kind-voltooiingsgebeurtenis binnenkomt nadat je het
eindantwoord al hebt verzonden, is de juiste follow-up het exacte stille token
`NO_REPLY` / `no_reply`.
</Note>

### Toolbeleid per diepte

- Rol en controlescope worden bij het spawnen in sessiemetadata geschreven. Daardoor krijgen platte of herstelde sessiesleutels niet per ongeluk opnieuw orchestratorrechten.
- **Diepte 1 (orchestrator, wanneer `maxSpawnDepth >= 2`):** krijgt `sessions_spawn`, `subagents`, `sessions_list`, `sessions_history`, zodat hij zijn kinderen kan beheren. Andere sessie-/systeemtools blijven geweigerd.
- **Diepte 1 (leaf, wanneer `maxSpawnDepth == 1`):** geen sessietools (huidig standaardgedrag).
- **Diepte 2 (leaf worker):** geen sessietools — `sessions_spawn` wordt altijd geweigerd op diepte 2. Kan geen verdere kinderen spawnen.

### Spawnlimiet per agent

Elke agentsessie (op elke diepte) kan maximaal `maxChildrenPerAgent`
(standaard `5`) actieve kinderen tegelijk hebben. Dit voorkomt uit de hand lopende fan-out
vanuit een enkele orchestrator.

### Cascadestop

Het stoppen van een diepte-1-orchestrator stopt automatisch al zijn diepte-2-
kinderen:

- `/stop` in de hoofdchat stopt alle diepte-1-agents en cascadeert naar hun diepte-2-kinderen.
- `/subagents kill <id>` stopt een specifieke subagent en cascadeert naar zijn kinderen.
- `/subagents kill all` stopt alle subagents voor de aanvrager en cascadeert.

## Authenticatie

Subagent-authenticatie wordt bepaald op basis van **agent-id**, niet op basis van sessietype:

- De sessiesleutel van de subagent is `agent:<agentId>:subagent:<uuid>`.
- De authenticatieopslag wordt geladen vanuit de `agentDir` van die agent.
- De authenticatieprofielen van de hoofdagent worden samengevoegd als **fallback**; agentprofielen overriden hoofdprofielen bij conflicten.

De samenvoeging is additief, dus hoofdprofielen zijn altijd beschikbaar als
fallbacks. Volledig geïsoleerde authenticatie per agent wordt nog niet ondersteund.

## Aankondiging

Subagents rapporteren terug via een aankondigingsstap:

- De aankondigingsstap draait binnen de subagentsessie (niet de sessie van de aanvrager).
- Als de subagent exact `ANNOUNCE_SKIP` antwoordt, wordt er niets geplaatst.
- Als de nieuwste assistenttekst het exacte stille token `NO_REPLY` / `no_reply` is, wordt aankondigingsuitvoer onderdrukt, zelfs als er eerder zichtbare voortgang was.

Levering hangt af van de diepte van de aanvrager:

- Aanvragersessies op topniveau gebruiken een follow-up-`agent`-aanroep met externe levering (`deliver=true`).
- Geneste aanvragende subagentsessies ontvangen een interne follow-up-injectie (`deliver=false`), zodat de orchestrator kindresultaten binnen de sessie kan synthetiseren.
- Als een geneste aanvragende subagentsessie verdwenen is, valt OpenClaw terug op de aanvrager van die sessie wanneer beschikbaar.

Voor aanvragersessies op topniveau lost directe levering in voltooiingsmodus eerst
een eventueel gekoppelde conversatie-/threadroute en hookoverride op, en vult daarna
ontbrekende kanaal-doelvelden aan vanuit de opgeslagen route van de aanvragersessie.
Zo blijven voltooiingen in de juiste chat/het juiste onderwerp, zelfs wanneer de voltooiingsoorsprong
alleen het kanaal identificeert.

Aggregatie van kindvoltooiingen is gescoped op de huidige aanvragersrun bij het
bouwen van geneste voltooiingsbevindingen, zodat verouderde kinduitvoer uit eerdere runs
niet kan lekken in de huidige aankondiging. Aankondigingsantwoorden behouden
thread-/onderwerproutering wanneer die beschikbaar is op kanaaladapters.

### Aankondigingscontext

Aankondigingscontext wordt genormaliseerd naar een stabiel intern gebeurtenisblok:

| Veld           | Bron                                                                                                          |
| -------------- | ------------------------------------------------------------------------------------------------------------- |
| Bron           | `subagent` of `cron`                                                                                          |
| Sessie-id's    | Kind-sessiesleutel/id                                                                                         |
| Type           | Aankondigingstype + taaklabel                                                                                 |
| Status         | Afgeleid van runtime-uitkomst (`success`, `error`, `timeout` of `unknown`) — **niet** afgeleid uit modeltekst |
| Resultaatinhoud | Nieuwste zichtbare assistenttekst, anders opgeschoonde nieuwste tool-/toolResult-tekst                      |
| Follow-up      | Instructie die beschrijft wanneer te antwoorden en wanneer stil te blijven                                   |

Terminaal mislukte runs rapporteren foutstatus zonder vastgelegde
antwoordtekst opnieuw af te spelen. Bij time-out kan de aankondiging, als het kind alleen tot toolaanroepen kwam,
die geschiedenis samenvouwen tot een korte samenvatting van gedeeltelijke voortgang in plaats
van ruwe tooluitvoer opnieuw af te spelen.

### Statistiekregel

Aankondigingspayloads bevatten aan het einde een statistiekregel (zelfs wanneer ingepakt):

- Runtime (bijv. `runtime 5m12s`).
- Tokengebruik (input/output/totaal).
- Geschatte kosten wanneer modelprijzen zijn geconfigureerd (`models.providers.*.models[].cost`).
- `sessionKey`, `sessionId` en transcriptpad, zodat de hoofdagent geschiedenis kan ophalen via `sessions_history` of het bestand op schijf kan inspecteren.

Interne metadata is alleen bedoeld voor orchestratie; gebruikersgerichte antwoorden
moeten worden herschreven in normale assistentstem.

### Waarom `sessions_history` de voorkeur heeft

`sessions_history` is het veiligere orchestratiepad:

- Assistentherinnering wordt eerst genormaliseerd: thinking-tags gestript; `<relevant-memories>`- / `<relevant_memories>`-scaffolding gestript; XML-payloadblokken voor platte-tekst-toolaanroepen (`<tool_call>`, `<function_call>`, `<tool_calls>`, `<function_calls>`) gestript, inclusief afgekorte payloads die nooit netjes sluiten; gedegradeerde tool-call/result-scaffolding en historische-contextmarkers gestript; gelekte model-controltokens (`<|assistant|>`, andere ASCII `<|...|>`, full-width `<｜...｜>`) gestript; misvormde MiniMax-tool-call-XML gestript.
- Tekst die lijkt op referenties/credentials/tokens wordt geredigeerd.
- Lange blokken kunnen worden afgekapt.
- Zeer grote geschiedenissen kunnen oudere rijen laten vallen of een te grote rij vervangen door `[sessions_history omitted: message too large]`.
- Inspectie van het ruwe transcript op schijf is de fallback wanneer je het volledige byte-voor-byte-transcript nodig hebt.

## Toolbeleid

Subagents gebruiken eerst dezelfde profiel- en toolbeleidspijplijn als de ouder- of
doelagent. Daarna past OpenClaw de subagentbeperkingslaag toe.

Zonder beperkend `tools.profile` krijgen subagents **alle tools behalve
sessietools** en systeemtools:

- `sessions_list`
- `sessions_history`
- `sessions_send`
- `sessions_spawn`

`sessions_history` blijft ook hier een begrensde, opgeschoonde herinneringsweergave —
het is geen ruwe transcriptdump.

Wanneer `maxSpawnDepth >= 2` ontvangen diepte-1-orchestrator-subagents bovendien
`sessions_spawn`, `subagents`, `sessions_list` en
`sessions_history`, zodat ze hun kinderen kunnen beheren.

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

`tools.subagents.tools.allow` is een definitief allow-only filter. Het kan de
al opgeloste toolset beperken, maar het kan geen tool **terug toevoegen** die
door `tools.profile` is verwijderd. Bijvoorbeeld: `tools.profile: "coding"` bevat
`web_search`/`web_fetch`, maar niet de `browser`-tool. Om subagenten met een
coding-profiel browserautomatisering te laten gebruiken, voeg je browser toe in de
profielfase:

```json5
{
  tools: {
    profile: "coding",
    alsoAllow: ["browser"],
  },
}
```

Gebruik per-agent `agents.list[].tools.alsoAllow: ["browser"]` wanneer slechts één
agent browserautomatisering moet krijgen.

## Gelijktijdigheid

Subagenten gebruiken een toegewezen in-process wachtrijlane:

- **Lanenaam:** `subagent`
- **Gelijktijdigheid:** `agents.defaults.subagents.maxConcurrent` (standaard `8`)

## Levendigheid en herstel

OpenClaw behandelt het ontbreken van `endedAt` niet als permanent bewijs dat een
subagent nog actief is. Niet-beëindigde runs die ouder zijn dan het stale-run-venster
tellen niet meer mee als actief/in behandeling in `/subagents list`, statusoverzichten,
descendant completion gating en gelijktijdigheidscontroles per sessie.

Na een Gateway-herstart worden stale, niet-beëindigde herstelde runs opgeschoond, tenzij
hun kindsessie is gemarkeerd als `abortedLastRun: true`. Die door herstart afgebroken
kindsessies blijven herstelbaar via de herstelstroom voor verweesde subagenten, die een
synthetisch hervattingsbericht verstuurt voordat de afgebroken-markering wordt gewist.

Automatisch herstel na herstart is begrensd per kindsessie. Als dezelfde subagent-kind
herhaaldelijk wordt geaccepteerd voor verweesd herstel binnen het snelle re-wedge-venster,
slaat OpenClaw een herstel-tombstone op die sessie op en stopt het met automatisch hervatten
bij latere herstarts. Voer `openclaw tasks maintenance --apply` uit om het taakrecord te
reconciliëren, of `openclaw doctor --fix` om stale afgebroken-herstelvlaggen te wissen op
sessies met een tombstone.

<Note>
Als het spawnen van een subagent mislukt met Gateway `PAIRING_REQUIRED` /
`scope-upgrade`, controleer dan de RPC-aanroeper voordat je de koppelingsstatus bewerkt.
Interne `sessions_spawn`-coördinatie moet verbinden als
`client.id: "gateway-client"` met `client.mode: "backend"` via directe
local loopback shared-token/password-authenticatie; dat pad is niet afhankelijk van de
baseline voor gekoppelde-apparaat-scopes van de CLI. Externe aanroepers, expliciete
`deviceIdentity`, expliciete apparaat-tokenpaden en browser-/node-clients hebben nog steeds
normale apparaatgoedkeuring nodig voor scope-upgrades.
</Note>

## Stoppen

- Het verzenden van `/stop` in de chat van de aanvrager breekt de aanvraagsessie af en stopt alle actieve subagent-runs die daaruit zijn gespawnd, met cascade naar geneste kinderen.
- `/subagents kill <id>` stopt een specifieke subagent en cascadeert naar diens kinderen.

## Beperkingen

- Subagent-aankondiging is **best-effort**. Als de Gateway herstart, gaat werk dat wacht op "announce back" verloren.
- Subagenten delen nog steeds dezelfde Gateway-procesresources; behandel `maxConcurrent` als een veiligheidsklep.
- `sessions_spawn` is altijd niet-blokkerend: het retourneert direct `{ status: "accepted", runId, childSessionKey }`.
- Subagent-context injecteert alleen `AGENTS.md` + `TOOLS.md` (geen `SOUL.md`, `IDENTITY.md`, `USER.md`, `HEARTBEAT.md` of `BOOTSTRAP.md`).
- Maximale nestingdiepte is 5 (`maxSpawnDepth`-bereik: 1-5). Diepte 2 wordt aanbevolen voor de meeste gebruikssituaties.
- `maxChildrenPerAgent` begrenst actieve kinderen per sessie (standaard `5`, bereik `1-20`).

## Gerelateerd

- [ACP-agenten](/nl/tools/acp-agents)
- [Agent verzenden](/nl/tools/agent-send)
- [Achtergrondtaken](/nl/automation/tasks)
- [Multi-agent sandboxtools](/nl/tools/multi-agent-sandbox-tools)
