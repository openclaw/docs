---
read_when:
    - Je wilt achtergrondwerk of parallel werk via de agent
    - Je wijzigt sessions_spawn of het beleid voor subagenttools
    - Je implementeert threadgebonden subagent-sessies of lost er problemen mee op
sidebarTitle: Sub-agents
summary: Start geïsoleerde agentuitvoeringen op de achtergrond die resultaten terugmelden aan de chat van de aanvrager
title: Subagenten
x-i18n:
    generated_at: "2026-05-04T07:09:54Z"
    model: gpt-5.5
    provider: openai
    source_hash: 65d60bf6813d667b7311aa28109d4bd6be012a16e638c64cfff130831db88cd8
    source_path: tools/subagents.md
    workflow: 16
---

Subagenten zijn achtergronduitvoeringen van agents die vanuit een bestaande agentuitvoering worden gestart.
Ze draaien in hun eigen sessie (`agent:<agentId>:subagent:<uuid>`) en
**melden** hun resultaat na afloop terug aan het chatchannel van de
aanvrager. Elke subagentuitvoering wordt bijgehouden als een
[achtergrondtaak](/nl/automation/tasks).

Primaire doelen:

- Paralleliseer werk voor "onderzoek / lange taak / trage tool" zonder de hoofduitvoering te blokkeren.
- Houd subagenten standaard geïsoleerd (sessiescheiding + optionele sandboxing).
- Houd het tooloppervlak moeilijk te misbruiken: subagenten krijgen standaard **geen** sessietools.
- Ondersteun configureerbare nestingsdiepte voor orchestratorpatronen.

<Note>
**Kostenopmerking:** elke subagent heeft standaard zijn eigen context en tokengebruik.
Voor zware of repetitieve taken stelt u een goedkoper model in voor subagenten
en houdt u uw hoofdagent op een model van hogere kwaliteit. Configureer via
`agents.defaults.subagents.model` of per-agent overrides. Wanneer een child
    echt het huidige transcript van de aanvrager nodig heeft, kan de agent
    `context: "fork"` aanvragen voor die ene spawn. Thread-gebonden subagentsessies gebruiken standaard
    `context: "fork"`, omdat ze het huidige gesprek vertakken naar een
    follow-upthread.
</Note>

## Slash-commando

Gebruik `/subagents` om subagentuitvoeringen voor de **huidige
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

Gebruik [`/steer <message>`](/nl/tools/steer) op topniveau om de actieve uitvoering van de huidige aanvragersessie bij te sturen. Gebruik `/subagents steer <id|#> <message>` wanneer het doel een childuitvoering is.

`/subagents info` toont uitvoeringsmetadata (status, tijdstempels, sessie-id,
transcriptpad, opschoning). Gebruik `sessions_history` voor een begrensde,
veiligheidsgefilterde herinneringsweergave; inspecteer het transcriptpad op schijf wanneer u
het ruwe volledige transcript nodig hebt.

### Besturing voor thread-binding

Deze commando's werken op kanalen die persistente thread-bindings ondersteunen.
Zie [Kanalen met thread-ondersteuning](#thread-supporting-channels) hieronder.

```text
/focus <subagent-label|session-key|session-id|session-label>
/unfocus
/agents
/session idle <duration|off>
/session max-age <duration|off>
```

### Spawn-gedrag

`/subagents spawn` start een achtergrondsubagent als gebruikerscommando (niet als
interne relay) en stuurt één definitieve voltooiingsupdate terug naar de
aanvragerchat wanneer de uitvoering klaar is.

<AccordionGroup>
  <Accordion title="Niet-blokkerende, push-gebaseerde voltooiing">
    - Het spawn-commando is niet-blokkerend; het retourneert onmiddellijk een uitvoerings-id.
    - Bij voltooiing meldt de subagent een samenvatting/resultaatbericht terug aan het chatchannel van de aanvrager.
    - Voltooiing is push-gebaseerd. Zodra de subagent is gestart, poll dan **niet** `/subagents list`, `sessions_list` of `sessions_history` in een lus alleen om te wachten tot deze klaar is; inspecteer de status alleen op aanvraag voor debugging of interventie.
    - Bij voltooiing sluit OpenClaw naar beste vermogen gevolgde browsertabs/processen die door die subagentsessie zijn geopend voordat de aankondigingsopschoning verdergaat.

  </Accordion>
  <Accordion title="Veerkrachtige levering bij handmatige spawn">
    - OpenClaw probeert eerst directe `agent`-levering met een stabiele idempotentiesleutel.
    - Als de voltooiingsbeurt van de aanvrager-agent mislukt, geen zichtbare uitvoer produceert, of een duidelijk onvolledig voorvoegsel van het vastgelegde childresultaat retourneert, valt OpenClaw terug op directe voltooiingslevering vanuit het vastgelegde childresultaat.
    - Als directe levering niet kan worden gebruikt, valt het terug op routering via de wachtrij.
    - Als routering via de wachtrij nog steeds niet beschikbaar is, wordt de aankondiging opnieuw geprobeerd met korte exponentiële backoff voordat definitief wordt opgegeven.
    - Voltooiingslevering behoudt de opgeloste aanvragerroute: thread-gebonden of gespreksgebonden voltooiingsroutes winnen wanneer beschikbaar; als de voltooiingsoorsprong alleen een kanaal levert, vult OpenClaw het ontbrekende doel/account aan vanuit de opgeloste route van de aanvragersessie (`lastChannel` / `lastTo` / `lastAccountId`), zodat directe levering nog steeds werkt.

  </Accordion>
  <Accordion title="Metadata voor voltooiingsoverdracht">
    De voltooiingsoverdracht naar de aanvragersessie is runtime-gegenereerde
    interne context (geen door de gebruiker geschreven tekst) en bevat:

    - `Result` — nieuwste zichtbare `assistant`-antwoordtekst, anders gesaneerde nieuwste tool/toolResult-tekst. Terminal gefaalde uitvoeringen hergebruiken geen vastgelegde antwoordtekst.
    - `Status` — `completed successfully` / `failed` / `timed out` / `unknown`.
    - Compacte runtime-/tokenstatistieken.
    - Een leveringsinstructie die de aanvrager-agent vertelt om te herschrijven in normale assistentstem (niet ruwe interne metadata doorsturen).

  </Accordion>
  <Accordion title="Modi en ACP-runtime">
    - `--model` en `--thinking` overschrijven de standaardwaarden voor die specifieke uitvoering.
    - Gebruik `info`/`log` om details en uitvoer na voltooiing te inspecteren.
    - `/subagents spawn` is one-shotmodus (`mode: "run"`). Voor persistente thread-gebonden sessies gebruikt u `sessions_spawn` met `thread: true` en `mode: "session"`.
    - Voor ACP-harness-sessies (Claude Code, Gemini CLI, OpenCode, of expliciete Codex ACP/acpx), gebruikt u `sessions_spawn` met `runtime: "acp"` wanneer de tool die runtime adverteert. Zie [ACP-leveringsmodel](/nl/tools/acp-agents#delivery-model) bij het debuggen van voltooiingen of agent-naar-agent-lussen. Wanneer de `codex`-Plugin is ingeschakeld, moet Codex-chat-/threadbesturing de voorkeur geven aan `/codex ...` boven ACP, tenzij de gebruiker expliciet om ACP/acpx vraagt.
    - OpenClaw verbergt `runtime: "acp"` totdat ACP is ingeschakeld, de aanvrager niet in een sandbox zit en een backend-Plugin zoals `acpx` is geladen. `runtime: "acp"` verwacht een externe ACP-harness-id, of een `agents.list[]`-vermelding met `runtime.type="acp"`; gebruik de standaard subagent-runtime voor normale OpenClaw-configagents uit `agents_list`.

  </Accordion>
</AccordionGroup>

## Contextmodi

Native subagenten starten geïsoleerd, tenzij de aanroeper expliciet vraagt om
het huidige transcript te forken.

| Modus      | Wanneer u deze gebruikt                                                                                                                | Gedrag                                                                           |
| ---------- | -------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------- |
| `isolated` | Nieuw onderzoek, onafhankelijke implementatie, traag toolwerk, of alles wat kort in de taaktekst kan worden gebrieft                   | Maakt een schoon childtranscript. Dit is de standaard en houdt tokengebruik lager. |
| `fork`     | Werk dat afhangt van het huidige gesprek, eerdere toolresultaten, of genuanceerde instructies die al in het aanvragertranscript staan | Vertakt het aanvragertranscript naar de childsessie voordat de child start.      |

Gebruik `fork` spaarzaam. Het is bedoeld voor contextgevoelige delegatie, niet als
vervanging voor het schrijven van een duidelijke taakprompt.

## Tool: `sessions_spawn`

Start een subagentuitvoering met `deliver: false` op de globale `subagent`-lane,
voert daarna een aankondigingsstap uit en plaatst het aankondigingsantwoord in het
chatchannel van de aanvrager.

Beschikbaarheid hangt af van het effectieve toolbeleid van de aanroeper. De profielen `coding` en
`full` stellen `sessions_spawn` standaard beschikbaar. Het profiel `messaging`
doet dat niet; voeg `tools.alsoAllow: ["sessions_spawn", "sessions_yield",
"subagents"]` toe of gebruik `tools.profile: "coding"` voor agents die werk moeten
delegeren. Kanaal/groep, provider, sandbox en allow/deny-beleid per agent kunnen
de tool na de profielfase nog steeds verwijderen. Gebruik `/tools` vanuit dezelfde
sessie om de effectieve toollijst te bevestigen.

**Standaardwaarden:**

- **Model:** erft van de aanroeper, tenzij u `agents.defaults.subagents.model` instelt (of per-agent `agents.list[].subagents.model`); een expliciete `sessions_spawn.model` wint nog steeds.
- **Thinking:** erft van de aanroeper, tenzij u `agents.defaults.subagents.thinking` instelt (of per-agent `agents.list[].subagents.thinking`); een expliciete `sessions_spawn.thinking` wint nog steeds.
- **Uitvoeringstime-out:** als `sessions_spawn.runTimeoutSeconds` is weggelaten, gebruikt OpenClaw `agents.defaults.subagents.runTimeoutSeconds` wanneer ingesteld; anders valt het terug op `0` (geen time-out).

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
  `acp` is alleen voor externe ACP-harnesses (`claude`, `droid`, `gemini`, `opencode`, of expliciet gevraagde Codex ACP/acpx) en voor `agents.list[]`-vermeldingen waarvan `runtime.type` `acp` is.
</ParamField>
<ParamField path="resumeSessionId" type="string">
  Alleen ACP. Hervat een bestaande ACP-harness-sessie wanneer `runtime: "acp"`; genegeerd voor native subagent-spawns.
</ParamField>
<ParamField path="streamTo" type='"parent"'>
  Alleen ACP. Streamt ACP-uitvoeringsuitvoer naar de parentsessie wanneer `runtime: "acp"`; weglaten voor native subagent-spawns.
</ParamField>
<ParamField path="model" type="string">
  Overschrijf het subagentmodel. Ongeldige waarden worden overgeslagen en de subagent draait op het standaardmodel met een waarschuwing in het toolresultaat.
</ParamField>
<ParamField path="thinking" type="string">
  Overschrijf het thinkingniveau voor de subagentuitvoering.
</ParamField>
<ParamField path="runTimeoutSeconds" type="number">
  Standaard `agents.defaults.subagents.runTimeoutSeconds` wanneer ingesteld, anders `0`. Wanneer ingesteld, wordt de subagentuitvoering na N seconden afgebroken.
</ParamField>
<ParamField path="thread" type="boolean" default="false">
  Wanneer `true`, vraagt dit kanaalthread-binding aan voor deze subagentsessie.
</ParamField>
<ParamField path="mode" type='"run" | "session"' default="run">
  Als `thread: true` en `mode` is weggelaten, wordt de standaard `session`. `mode: "session"` vereist `thread: true`.
</ParamField>
<ParamField path="cleanup" type='"delete" | "keep"' default="keep">
  `"delete"` archiveert onmiddellijk na de aankondiging (behoudt het transcript nog steeds via hernoemen).
</ParamField>
<ParamField path="sandbox" type='"inherit" | "require"' default="inherit">
  `require` weigert spawn tenzij de doel-childruntime in een sandbox zit.
</ParamField>
<ParamField path="context" type='"isolated" | "fork"' default="isolated">
  `fork` vertakt het huidige transcript van de aanvrager naar de childsessie. Alleen native subagenten. Thread-gebonden spawns gebruiken standaard `fork`; niet-thread-spawns gebruiken standaard `isolated`.
</ParamField>

<Warning>
`sessions_spawn` accepteert **geen** kanaalleveringsparameters (`target`,
`channel`, `to`, `threadId`, `replyTo`, `transport`). Gebruik voor levering
`message`/`sessions_send` vanuit de gestarte uitvoering.
</Warning>

## Thread-gebonden sessies

Wanneer thread-bindings zijn ingeschakeld voor een kanaal, kan een subagent gebonden blijven
aan een thread, zodat follow-upgebruikersberichten in die thread naar dezelfde
subagentsessie blijven routeren.

### Kanalen met thread-ondersteuning

**Discord** is momenteel het enige ondersteunde kanaal. Het ondersteunt
persistente thread-gebonden subagentsessies (`sessions_spawn` met
`thread: true`), handmatige threadbesturing (`/focus`, `/unfocus`, `/agents`,
`/session idle`, `/session max-age`) en adaptersleutels
`channels.discord.threadBindings.enabled`,
`channels.discord.threadBindings.idleHours`,
`channels.discord.threadBindings.maxAgeHours`, en
`channels.discord.threadBindings.spawnSessions`.

### Snelle flow

<Steps>
  <Step title="Spawn">
    `sessions_spawn` met `thread: true` (en optioneel `mode: "session"`).
  </Step>
  <Step title="Bind">
    OpenClaw maakt of koppelt een thread aan dat sessiedoel in het actieve kanaal.
  </Step>
  <Step title="Route follow-ups">
    Antwoorden en vervolgberichten in die thread worden naar de gekoppelde sessie gerouteerd.
  </Step>
  <Step title="Inspect timeouts">
    Gebruik `/session idle` om automatische ontfocus bij inactiviteit te inspecteren/bij te werken en
    `/session max-age` om de harde limiet te beheren.
  </Step>
  <Step title="Detach">
    Gebruik `/unfocus` om handmatig los te koppelen.
  </Step>
</Steps>

### Handmatige bediening

| Commando           | Effect                                                                        |
| ------------------ | ----------------------------------------------------------------------------- |
| `/focus <target>`  | Koppel de huidige thread (of maak er een aan) aan een sub-agent-/sessiedoel   |
| `/unfocus`         | Verwijder de koppeling voor de huidige gekoppelde thread                      |
| `/agents`          | Toon actieve uitvoeringen en koppelingsstatus (`thread:<id>` of `unbound`)    |
| `/session idle`    | Inspecteer/update automatische ontfocus bij inactiviteit (alleen gefocuste gekoppelde threads) |
| `/session max-age` | Inspecteer/update harde limiet (alleen gefocuste gekoppelde threads)          |

### Configuratieschakelaars

- **Globale standaard:** `session.threadBindings.enabled`, `session.threadBindings.idleHours`, `session.threadBindings.maxAgeHours`.
- **Kanaaloverschrijving en sleutels voor automatisch koppelen bij spawn** zijn adapterspecifiek. Zie [Kanalen met thread-ondersteuning](#thread-supporting-channels) hierboven.

Zie [Configuratiereferentie](/nl/gateway/configuration-reference) en
[Slash-commando's](/nl/tools/slash-commands) voor actuele adapterdetails.

### Allowlist

<ParamField path="agents.list[].subagents.allowAgents" type="string[]">
  Lijst met agent-id's die via expliciete `agentId` kunnen worden gekozen (`["*"]` staat alles toe). Standaard: alleen de aanvragende agent. Als je een lijst instelt en nog steeds wilt dat de aanvrager zichzelf met `agentId` kan spawnen, neem dan de requester-id op in de lijst.
</ParamField>
<ParamField path="agents.defaults.subagents.allowAgents" type="string[]">
  Standaard allowlist voor doelagents die wordt gebruikt wanneer de aanvragende agent geen eigen `subagents.allowAgents` instelt.
</ParamField>
<ParamField path="agents.defaults.subagents.requireAgentId" type="boolean" default="false">
  Blokkeer `sessions_spawn`-aanroepen die `agentId` weglaten (dwingt expliciete profielselectie af). Overschrijving per agent: `agents.list[].subagents.requireAgentId`.
</ParamField>

Als de aanvragersessie in een sandbox draait, wijst `sessions_spawn` doelen af
die zonder sandbox zouden draaien.

### Detectie

Gebruik `agents_list` om te zien welke agent-id's momenteel zijn toegestaan voor
`sessions_spawn`. Het antwoord bevat voor elke vermelde agent het effectieve
model en ingesloten runtime-metadata, zodat aanroepers onderscheid kunnen maken tussen PI, Codex
app-server en andere geconfigureerde native runtimes.

### Automatisch archiveren

- Sub-agentsessies worden automatisch gearchiveerd na `agents.defaults.subagents.archiveAfterMinutes` (standaard `60`).
- Archiveren gebruikt `sessions.delete` en hernoemt het transcript naar `*.deleted.<timestamp>` (dezelfde map).
- `cleanup: "delete"` archiveert direct na aankondiging (het transcript blijft behouden via hernoeming).
- Automatisch archiveren is best-effort; geplande timers gaan verloren als de Gateway opnieuw start.
- `runTimeoutSeconds` archiveert **niet** automatisch; het stopt alleen de uitvoering. De sessie blijft bestaan tot automatische archivering.
- Automatisch archiveren geldt zowel voor diepte-1- als diepte-2-sessies.
- Browseropschoning staat los van archiefopschoning: bijgehouden browsertabs/processen worden best-effort gesloten wanneer de uitvoering eindigt, zelfs als het transcript/de sessierecord behouden blijft.

## Geneste sub-agents

Standaard kunnen sub-agents hun eigen sub-agents niet spawnen
(`maxSpawnDepth: 1`). Stel `maxSpawnDepth: 2` in om één niveau
nesting in te schakelen — het **orchestrator-patroon**: hoofd → orchestrator-sub-agent →
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
| ----- | -------------------------------------------- | --------------------------------------------- | ---------------------------- |
| 0     | `agent:<id>:main`                            | Hoofdagent                                    | Altijd                       |
| 1     | `agent:<id>:subagent:<uuid>`                 | Sub-agent (orchestrator wanneer diepte 2 is toegestaan) | Alleen als `maxSpawnDepth >= 2` |
| 2     | `agent:<id>:subagent:<uuid>:subagent:<uuid>` | Sub-sub-agent (leaf-worker)                   | Nooit                        |

### Aankondigingsketen

Resultaten stromen terug omhoog door de keten:

1. Diepte-2-worker eindigt → kondigt aan bij de ouder (diepte-1-orchestrator).
2. Diepte-1-orchestrator ontvangt de aankondiging, synthetiseert resultaten, eindigt → kondigt aan bij de hoofdsessie.
3. Hoofdagent ontvangt de aankondiging en levert die aan de gebruiker.

Elk niveau ziet alleen aankondigingen van zijn directe kinderen.

<Note>
**Operationele richtlijn:** start child-werk één keer en wacht op voltooiingsgebeurtenissen
in plaats van pollinglussen te bouwen rond `sessions_list`,
`sessions_history`, `/subagents list` of `exec`-slaapcommando's.
`sessions_list` en `/subagents list` houden child-sessierelaties
gericht op live werk — live children blijven gekoppeld, beëindigde children blijven
kort zichtbaar in een recent venster en verouderde child-koppelingen die alleen in de store staan, worden
genegeerd na hun versheidsvenster. Dit voorkomt dat oude `spawnedBy`- /
`parentSessionKey`-metadata na een herstart ghost children laten herleven.
Als een voltooiingsgebeurtenis van een child aankomt nadat je het
eindantwoord al hebt verzonden, is de juiste follow-up het exacte stille token
`NO_REPLY` / `no_reply`.
</Note>

### Toolbeleid per diepte

- Rol en beheerscope worden tijdens het spawnen in sessiemetadata geschreven. Daardoor kunnen platte of herstelde sessiesleutels niet per ongeluk orchestrator-rechten terugkrijgen.
- **Diepte 1 (orchestrator, wanneer `maxSpawnDepth >= 2`):** krijgt `sessions_spawn`, `subagents`, `sessions_list`, `sessions_history`, zodat deze zijn children kan beheren. Andere sessie-/systeemtools blijven geweigerd.
- **Diepte 1 (leaf, wanneer `maxSpawnDepth == 1`):** geen sessietools (huidig standaardgedrag).
- **Diepte 2 (leaf-worker):** geen sessietools — `sessions_spawn` wordt op diepte 2 altijd geweigerd. Kan geen verdere children spawnen.

### Spawnlimiet per agent

Elke agentsessie (op elke diepte) kan maximaal `maxChildrenPerAgent`
(standaard `5`) actieve children tegelijk hebben. Dit voorkomt ongecontroleerde fan-out
vanuit één orchestrator.

### Cascaderende stop

Het stoppen van een diepte-1-orchestrator stopt automatisch al zijn diepte-2
children:

- `/stop` in de hoofdchat stopt alle diepte-1-agents en cascadeert naar hun diepte-2-children.
- `/subagents kill <id>` stopt een specifieke sub-agent en cascadeert naar zijn children.
- `/subagents kill all` stopt alle sub-agents voor de aanvrager en cascadeert.

## Authenticatie

Authenticatie voor sub-agents wordt bepaald door **agent-id**, niet door sessietype:

- De sessiesleutel van de sub-agent is `agent:<agentId>:subagent:<uuid>`.
- De auth-store wordt geladen uit de `agentDir` van die agent.
- De auth-profielen van de hoofdagent worden samengevoegd als **fallback**; agentprofielen overschrijven hoofdprofielen bij conflicten.

De samenvoeging is additief, dus hoofdprofielen zijn altijd beschikbaar als
fallbacks. Volledig geïsoleerde authenticatie per agent wordt nog niet ondersteund.

## Aankondigen

Sub-agents rapporteren terug via een aankondigingsstap:

- De aankondigingsstap draait binnen de sub-agentsessie (niet de aanvragersessie).
- Als de sub-agent exact `ANNOUNCE_SKIP` antwoordt, wordt er niets geplaatst.
- Als de nieuwste assistenttekst het exacte stille token `NO_REPLY` / `no_reply` is, wordt aankondigingsuitvoer onderdrukt, zelfs als er eerder zichtbare voortgang was.

Levering hangt af van de diepte van de aanvrager:

- Aanvragersessies op topniveau gebruiken een follow-up `agent`-aanroep met externe levering (`deliver=true`).
- Geneste aanvragende subagentsessies ontvangen een interne follow-upinjectie (`deliver=false`), zodat de orchestrator child-resultaten in de sessie kan synthetiseren.
- Als een geneste aanvragende subagentsessie verdwenen is, valt OpenClaw waar beschikbaar terug op de requester van die sessie.

Voor aanvragersessies op topniveau lost directe levering in voltooiingsmodus eerst
elke gekoppelde conversatie-/threadroute en hook-overschrijving op, en vult daarna
ontbrekende kanaaldoelvelden aan vanuit de opgeslagen route van de aanvragersessie.
Zo blijven voltooiingen in de juiste chat/topic, zelfs wanneer de oorsprong van de voltooiing
alleen het kanaal identificeert.

Aggregatie van child-voltooiingen is beperkt tot de huidige aanvrageruitvoering bij het
opbouwen van geneste voltooiingsbevindingen, zodat verouderde child-uitvoer van eerdere uitvoeringen
niet in de huidige aankondiging lekt. Aankondigingsantwoorden behouden
thread-/topicroutering wanneer die beschikbaar is op kanaaladapters.

### Aankondigingscontext

Aankondigingscontext wordt genormaliseerd naar een stabiel intern gebeurtenisblok:

| Veld           | Bron                                                                                                          |
| -------------- | ------------------------------------------------------------------------------------------------------------- |
| Bron           | `subagent` of `cron`                                                                                          |
| Sessie-id's    | Child-sessiesleutel/id                                                                                        |
| Type           | Aankondigingstype + taaklabel                                                                                 |
| Status         | Afgeleid van runtime-uitkomst (`success`, `error`, `timeout` of `unknown`) — **niet** afgeleid uit modeltekst |
| Resultaatinhoud | Nieuwste zichtbare assistenttekst, anders opgeschoonde nieuwste tool-/toolResult-tekst                       |
| Follow-up      | Instructie die beschrijft wanneer te antwoorden versus stil te blijven                                        |

Terminal gefaalde uitvoeringen rapporteren de foutstatus zonder vastgelegde
antwoordtekst opnieuw af te spelen. Bij timeout kan, als de child alleen door toolaanroepen kwam, de aankondiging
die geschiedenis samenvouwen tot een korte samenvatting van gedeeltelijke voortgang in plaats van
ruwe tooluitvoer opnieuw af te spelen.

### Statistiekregel

Aankondigingspayloads bevatten aan het einde een statistiekregel (ook wanneer omwikkeld):

- Runtime (bijv. `runtime 5m12s`).
- Tokengebruik (input/output/totaal).
- Geschatte kosten wanneer modelprijzen zijn geconfigureerd (`models.providers.*.models[].cost`).
- `sessionKey`, `sessionId` en transcriptpad, zodat de hoofdagent geschiedenis kan ophalen via `sessions_history` of het bestand op schijf kan inspecteren.

Interne metadata is alleen bedoeld voor orchestratie; gebruikersgerichte antwoorden
moeten worden herschreven in een normale assistentstem.

### Waarom `sessions_history` de voorkeur heeft

`sessions_history` is het veiligere orchestratiepad:

- Assistentherinnering wordt eerst genormaliseerd: thinking-tags verwijderd; `<relevant-memories>`- / `<relevant_memories>`-scaffolding verwijderd; plain-text XML-payloadblokken voor toolaanroepen (`<tool_call>`, `<function_call>`, `<tool_calls>`, `<function_calls>`) verwijderd, inclusief afgekorte payloads die nooit netjes sluiten; gedegradeerde tool-call/result-scaffolding en historische-contextmarkers verwijderd; gelekte modelbesturingstokens (`<|assistant|>`, andere ASCII `<|...|>`, full-width `<｜...｜>`) verwijderd; misvormde MiniMax-tool-call-XML verwijderd.
- Tekst die op credentials/tokens lijkt, wordt geredigeerd.
- Lange blokken kunnen worden ingekort.
- Zeer grote geschiedenissen kunnen oudere rijen laten vallen of een te grote rij vervangen door `[sessions_history omitted: message too large]`.
- Inspectie van het ruwe transcript op schijf is de fallback wanneer je het volledige byte-voor-byte transcript nodig hebt.

## Toolbeleid

Subagenten gebruiken eerst dezelfde profiel- en toolbeleidspijplijn als de bovenliggende of doelagent. Daarna past OpenClaw de beperkingslaag voor subagenten toe.

Zonder beperkend `tools.profile` krijgen subagenten **alle tools behalve sessietools** en systeemtools:

- `sessions_list`
- `sessions_history`
- `sessions_send`
- `sessions_spawn`

`sessions_history` blijft ook hier een begrensde, opgeschoonde herinneringsweergave — het is geen ruwe transcriptdump.

Wanneer `maxSpawnDepth >= 2`, ontvangen orchestrator-subagenten op diepte 1 daarnaast `sessions_spawn`, `subagents`, `sessions_list` en `sessions_history`, zodat ze hun kinderen kunnen beheren.

### Overschrijven via config

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

`tools.subagents.tools.allow` is een laatste filter dat alleen toestaat. Het kan de al opgeloste toolset beperken, maar het kan een tool die door `tools.profile` is verwijderd niet **terug toevoegen**. `tools.profile: "coding"` bevat bijvoorbeeld `web_search`/`web_fetch`, maar niet de `browser`-tool. Voeg browser toe in de profielfase om subagenten met een coding-profiel browserautomatisering te laten gebruiken:

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

Subagenten gebruiken een toegewezen in-process wachtrijbaan:

- **Baannaam:** `subagent`
- **Gelijktijdigheid:** `agents.defaults.subagents.maxConcurrent` (standaard `8`)

## Liveness en herstel

OpenClaw behandelt het ontbreken van `endedAt` niet als permanent bewijs dat een subagent nog actief is. Niet-beëindigde runs die ouder zijn dan het venster voor verouderde runs, tellen niet meer als actief/in behandeling in `/subagents list`, statusoverzichten, gating voor voltooiing van afstammelingen en gelijktijdigheidscontroles per sessie.

Na een herstart van de Gateway worden verouderde, niet-beëindigde herstelde runs opgeschoond, tenzij hun kindsessie is gemarkeerd als `abortedLastRun: true`. Die door de herstart afgebroken kindsessies blijven herstelbaar via de herstelstroom voor verweesde subagenten, die een synthetisch hervattingsbericht verzendt voordat de afgebroken-markering wordt gewist.

Automatisch herstel na herstart is begrensd per kindsessie. Als hetzelfde subagent-kind herhaaldelijk binnen het snelle re-wedge-venster wordt geaccepteerd voor verweesd herstel, bewaart OpenClaw een herstel-tombstone op die sessie en stopt het met automatisch hervatten bij latere herstarts. Voer `openclaw tasks maintenance --apply` uit om de taakrecord te reconciliëren, of `openclaw doctor --fix` om verouderde afgebroken-herstelvlaggen op tombstoned sessies te wissen.

<Note>
Als het spawnen van een subagent mislukt met Gateway `PAIRING_REQUIRED` / `scope-upgrade`, controleer dan de RPC-aanroeper voordat je de koppelingsstatus bewerkt. Interne `sessions_spawn`-coördinatie moet verbinden als `client.id: "gateway-client"` met `client.mode: "backend"` via directe loopback-authenticatie met gedeeld token/wachtwoord; dat pad is niet afhankelijk van de baseline voor het gekoppelde-apparaatbereik van de CLI. Externe aanroepers, expliciete `deviceIdentity`, expliciete apparaat-tokenpaden en browser-/Node-clients hebben nog steeds normale apparaatgoedkeuring nodig voor bereikupgrades.
</Note>

## Stoppen

- Het verzenden van `/stop` in de aanvragerchat breekt de aanvragersessie af en stopt alle actieve subagent-runs die daaruit zijn gespawnd, met cascade naar geneste kinderen.
- `/subagents kill <id>` stopt een specifieke subagent en cascadeert naar zijn kinderen.

## Beperkingen

- Aankondiging door subagenten is **best-effort**. Als de Gateway herstart, gaat in behandeling zijnd "announce back"-werk verloren.
- Subagenten delen nog steeds dezelfde Gateway-procesresources; behandel `maxConcurrent` als een veiligheidsklep.
- `sessions_spawn` is altijd niet-blokkerend: het retourneert direct `{ status: "accepted", runId, childSessionKey }`.
- Subagentcontext injecteert alleen `AGENTS.md` + `TOOLS.md` (geen `SOUL.md`, `IDENTITY.md`, `USER.md`, `HEARTBEAT.md` of `BOOTSTRAP.md`).
- De maximale nestingsdiepte is 5 (`maxSpawnDepth`-bereik: 1–5). Diepte 2 wordt aanbevolen voor de meeste gebruikssituaties.
- `maxChildrenPerAgent` beperkt actieve kinderen per sessie (standaard `5`, bereik `1–20`).

## Gerelateerd

- [ACP-agenten](/nl/tools/acp-agents)
- [Agent verzenden](/nl/tools/agent-send)
- [Achtergrondtaken](/nl/automation/tasks)
- [Multi-agent-sandboxtools](/nl/tools/multi-agent-sandbox-tools)
