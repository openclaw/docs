---
read_when:
    - Je wilt werk op de achtergrond of parallel werk via de agent
    - Je wijzigt sessions_spawn of het beleid voor sub-agenttools
    - Je implementeert threadgebonden subagentsessies of lost problemen ermee op
sidebarTitle: Sub-agents
summary: Start geïsoleerde agentuitvoeringen op de achtergrond die resultaten terugmelden in de chat van de aanvrager
title: Sub-agenten
x-i18n:
    generated_at: "2026-06-27T18:30:23Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: bf8b819b1bb478c5161a7493f6a806aefb8df252e6c3d9faeee94a66689a5f5f
    source_path: tools/subagents.md
    workflow: 16
---

Subagents zijn agentruns op de achtergrond die vanuit een bestaande agentrun worden gestart.
Ze draaien in hun eigen sessie (`agent:<agentId>:subagent:<uuid>`) en
**melden** hun resultaat na afloop terug aan het chatkanaal van de aanvrager.
Elke subagentrun wordt bijgehouden als een
[achtergrondtaak](/nl/automation/tasks).

Primaire doelen:

- "onderzoek / lange taak / traag hulpmiddel"-werk parallel uitvoeren zonder de hoofdrun te blokkeren.
- Subagents standaard geïsoleerd houden (sessiescheiding + optionele sandboxing).
- Het hulpmiddeloppervlak moeilijk te misbruiken houden: subagents krijgen standaard **geen** sessiehulpmiddelen.
- Configureerbare nestingsdiepte ondersteunen voor orchestrator-patronen.

<Note>
**Kostenopmerking:** elke subagent heeft standaard zijn eigen context en
tokengebruik. Stel voor zware of repetitieve taken een goedkoper model in voor
subagents en houd je hoofdagent op een model van hogere kwaliteit. Configureer
dit via `agents.defaults.subagents.model` of per-agent overrides. Wanneer een
kind daadwerkelijk het huidige transcript van de aanvrager nodig heeft, kan de
agent `context: "fork"` aanvragen voor die ene spawn. Threadgebonden
subagentsessies gebruiken standaard `context: "fork"` omdat ze het huidige
gesprek vertakken naar een vervolgthread.
</Note>

## Slash-opdracht

Gebruik `/subagents` om subagentruns voor de **huidige sessie** te inspecteren:

```text
/subagents list
/subagents log <id|#> [limit] [tools]
/subagents info <id|#>
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

Agents starten subagents op de achtergrond met `sessions_spawn`. Voltooiingen
van subagents komen terug als interne gebeurtenissen in de oudersessie; de
ouder-/aanvrageragent beslist of een gebruikersgerichte update nodig is.

<AccordionGroup>
  <Accordion title="Niet-blokkerende, pushgebaseerde voltooiing">
    - `sessions_spawn` is niet-blokkerend; het retourneert direct een run-id.
    - Bij voltooiing rapporteert de subagent terug aan de ouder-/aanvragersessie.
    - Agentbeurten die kindresultaten nodig hebben, moeten na het starten van vereist werk `sessions_yield` aanroepen. Dat beëindigt de huidige beurt en laat voltooiingsgebeurtenissen binnenkomen als het volgende modelzichtbare bericht.
    - Voltooiing is pushgebaseerd. Zodra de spawn is gestart, moet je **niet** `/subagents list`, `sessions_list` of `sessions_history` in een lus pollen alleen om te wachten tot deze klaar is; inspecteer de status alleen op aanvraag voor debugzichtbaarheid.
    - Kinduitvoer is een rapport/bewijs voor de aanvrageragent om samen te vatten. Het is geen door de gebruiker geschreven instructietekst en kan systeem-, ontwikkelaars- of gebruikersbeleid niet overschrijven.
    - Bij voltooiing sluit OpenClaw naar best vermogen bijgehouden browsertabs/-processen die door die subagentsessie zijn geopend voordat de meldingsopschoningsstroom doorgaat.

  </Accordion>
  <Accordion title="Levering van voltooiingen">
    - OpenClaw geeft voltooiingen terug aan de aanvragersessie via een `agent`-beurt met een stabiele idempotentiesleutel.
    - Als de aanvragerrun nog actief is, probeert OpenClaw eerst die run te wekken/sturen in plaats van een tweede zichtbaar antwoordpad te starten.
    - Als een actieve aanvrager niet kan worden gewekt, valt OpenClaw terug op een overdracht aan de aanvrageragent met dezelfde voltooiingscontext in plaats van de melding te laten vallen.
    - Een geslaagde ouderoverdracht voltooit de levering van de subagent, zelfs wanneer de ouder beslist dat er geen zichtbare gebruikersupdate nodig is.
    - Native subagents krijgen het berichthulpmiddel niet. Ze retourneren platte assistenttekst aan de ouder-/aanvrageragent; voor mensen zichtbare antwoorden vallen onder het normale leveringsbeleid van de ouder-/aanvrageragent.
    - Als directe overdracht niet kan worden gebruikt, valt dit terug op wachtrijroutering.
    - Als wachtrijroutering nog steeds niet beschikbaar is, wordt de melding opnieuw geprobeerd met een korte exponentiële backoff voordat definitief wordt opgegeven.
    - Levering van voltooiingen behoudt de opgeloste aanvragerroute: threadgebonden of gespreksgebonden voltooiingsroutes winnen wanneer ze beschikbaar zijn; als de voltooiingsoorsprong alleen een kanaal levert, vult OpenClaw het ontbrekende doel/account in vanuit de opgeloste route van de aanvragersessie (`lastChannel` / `lastTo` / `lastAccountId`), zodat directe levering nog steeds werkt.

  </Accordion>
  <Accordion title="Metadata voor voltooiingsoverdracht">
    De voltooiingsoverdracht naar de aanvragersessie is runtimegegenereerde
    interne context (geen door de gebruiker geschreven tekst) en bevat:

    - `Result` — de nieuwste zichtbare `assistant`-antwoordtekst van het kind. Uitvoer van hulpmiddelen/toolResult wordt niet gepromoveerd naar kindresultaten. Terminaal mislukte runs hergebruiken vastgelegde antwoordtekst niet.
    - `Status` — `completed; ready for parent review` / `failed` / `timed out` / `unknown`.
    - Compacte runtime-/tokenstatistieken.
    - Een reviewinstructie die de aanvrageragent vertelt het resultaat te verifiëren voordat wordt beslist of de oorspronkelijke taak klaar is.
    - Vervolgrichtlijnen die de aanvrageragent vertellen de taak voort te zetten of een vervolgactie vast te leggen wanneer het kindresultaat meer actie openlaat.
    - Een instructie voor de laatste update voor het pad zonder verdere actie, geschreven in normale assistentstem zonder ruwe interne metadata door te sturen.

  </Accordion>
  <Accordion title="Modi en ACP-runtime">
    - `--model` en `--thinking` overschrijven de standaardwaarden voor die specifieke run.
    - Gebruik `info`/`log` om details en uitvoer na voltooiing te inspecteren.
    - Gebruik voor persistente threadgebonden sessies `sessions_spawn` met `thread: true` en `mode: "session"`.
    - Als het aanvragerkanaal geen threadbindingen ondersteunt, gebruik dan `mode: "run"` in plaats van onmogelijke threadgebonden combinaties opnieuw te proberen.
    - Gebruik voor ACP-harness-sessies (Claude Code, Gemini CLI, OpenCode, of expliciete Codex ACP/acpx) `sessions_spawn` met `runtime: "acp"` wanneer het hulpmiddel die runtime adverteert. Zie [ACP-leveringsmodel](/nl/tools/acp-agents#delivery-model) bij het debuggen van voltooiingen of agent-naar-agent-lussen. Wanneer de `codex`-Plugin is ingeschakeld, hoort Codex-chat-/threadbesturing de voorkeur te geven aan `/codex ...` boven ACP, tenzij de gebruiker expliciet om ACP/acpx vraagt.
    - OpenClaw verbergt `runtime: "acp"` totdat ACP is ingeschakeld, de aanvrager niet in een sandbox zit en een backend-Plugin zoals `acpx` is geladen. `runtime: "acp"` verwacht een externe ACP-harness-id, of een `agents.list[]`-item met `runtime.type="acp"`; gebruik de standaard subagentruntime voor normale OpenClaw-configuratieagents uit `agents_list`.

  </Accordion>
</AccordionGroup>

## Contextmodi

Native subagents starten geïsoleerd tenzij de aanroeper expliciet vraagt om
het huidige transcript te forken.

| Modus      | Wanneer je deze gebruikt                                                                                                                | Gedrag                                                                           |
| ---------- | --------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------- |
| `isolated` | Nieuw onderzoek, onafhankelijke implementatie, traag hulpmiddelwerk, of alles wat kort kan worden uitgelegd in de taaktekst             | Maakt een schoon kindtranscript. Dit is de standaard en houdt tokengebruik lager. |
| `fork`     | Werk dat afhangt van het huidige gesprek, eerdere hulpmiddelresultaten of genuanceerde instructies die al in het aanvragertranscript staan | Vertakt het aanvragertranscript naar de kindsessie voordat het kind start.        |

Gebruik `fork` spaarzaam. Het is bedoeld voor contextgevoelige delegatie, niet
als vervanging voor het schrijven van een duidelijke taakprompt.

## Hulpmiddel: `sessions_spawn`

Start een subagentrun met `deliver: false` op de globale `subagent`-lane,
voert daarna een meldingsstap uit en plaatst het meldingsantwoord in het
chatkanaal van de aanvrager.

Beschikbaarheid hangt af van het effectieve hulpmiddelenbeleid van de aanroeper.
De profielen `coding` en `full` tonen standaard `sessions_spawn`. Het profiel
`messaging` doet dat niet; voeg `tools.alsoAllow: ["sessions_spawn", "sessions_yield",
"subagents"]` toe of gebruik `tools.profile: "coding"` voor agents die werk
moeten delegeren. Kanaal/groep, provider, sandbox en per-agent allow/deny-beleid
kunnen het hulpmiddel na de profielfase nog steeds verwijderen. Gebruik `/tools`
vanuit dezelfde sessie om de effectieve hulpmiddelenlijst te bevestigen.

**Standaarden:**

- **Model:** native subagents erven de aanroeper tenzij je `agents.defaults.subagents.model` instelt (of per-agent `agents.list[].subagents.model`). ACP-runtimespawns gebruiken hetzelfde geconfigureerde subagentmodel wanneer aanwezig; anders behoudt de ACP-harness zijn eigen standaard. Een expliciete `sessions_spawn.model` wint nog steeds.
- **Thinking:** native subagents erven de aanroeper tenzij je `agents.defaults.subagents.thinking` instelt (of per-agent `agents.list[].subagents.thinking`). ACP-runtimespawns passen ook `agents.defaults.models["provider/model"].params.thinking` toe voor het geselecteerde model. Een expliciete `sessions_spawn.thinking` wint nog steeds.
- **Run-time-out:** OpenClaw gebruikt `agents.defaults.subagents.runTimeoutSeconds` wanneer dit is ingesteld; anders valt het terug op `0` (geen time-out). `sessions_spawn` accepteert geen time-outoverrides per aanroep.
- **Taaklevering:** native subagents ontvangen de gedelegeerde taak in hun eerste zichtbare `[Subagent Task]`-bericht. De systeemprompt van de subagent bevat runtimeregels en routeringscontext, geen verborgen duplicaat van de taak.

Geaccepteerde native subagentspawns bevatten de opgeloste kindmodelmetadata in
het hulpmiddelresultaat: `resolvedModel` bevat de toegepaste modelreferentie en
`resolvedProvider` bevat het providerprefix wanneer de referentie er een heeft.

### Delegatiepromptmodus

`agents.defaults.subagents.delegationMode` bestuurt alleen promptrichtlijnen; het verandert geen hulpmiddelenbeleid en dwingt geen delegatie af.

- `suggest` (standaard): behoud de standaard promptaanmoediging om subagents te gebruiken voor groter of trager werk.
- `prefer`: vertel de hoofdagent responsief te blijven en alles wat meer omvat dan een direct antwoord te delegeren via `sessions_spawn`.

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

### Hulpmiddelparameters

<ParamField path="task" type="string" required>
  De taakbeschrijving voor de subagent.
</ParamField>
<ParamField path="taskName" type="string">
  Optionele stabiele handle om een specifiek kind in latere statusuitvoer te identificeren. Moet overeenkomen met `[a-z][a-z0-9_-]{0,63}` en mag geen gereserveerde targets zijn, zoals `last` of `all`.
</ParamField>
<ParamField path="label" type="string">
  Optioneel menselijk leesbaar label.
</ParamField>
<ParamField path="agentId" type="string">
  Spawn onder een andere geconfigureerde agent-id wanneer toegestaan door `subagents.allowAgents`.
</ParamField>
<ParamField path="cwd" type="string">
  Optionele werkmap voor de taak van de kind-run. Native subagenten laden bootstrapbestanden nog steeds vanuit de workspace van de doelagent; `cwd` wijzigt alleen waar runtimetools en CLI-harnassen het gedelegeerde werk uitvoeren.
</ParamField>
<ParamField path="runtime" type='"subagent" | "acp"' default="subagent">
  `acp` is alleen voor externe ACP-harnassen (`claude`, `droid`, `gemini`, `opencode`, of expliciet aangevraagde Codex ACP/acpx) en voor `agents.list[]`-items waarvan `runtime.type` `acp` is.
</ParamField>
<ParamField path="resumeSessionId" type="string">
  Alleen ACP. Hervat een bestaande ACP-harnassessie wanneer `runtime: "acp"`; genegeerd voor native subagent-spawns.
</ParamField>
<ParamField path="streamTo" type='"parent"'>
  Alleen ACP. Streamt ACP-runuitvoer naar de oudersessie wanneer `runtime: "acp"`; weglaten voor native subagent-spawns.
</ParamField>
<ParamField path="model" type="string">
  Overschrijf het subagentmodel. Ongeldige waarden worden overgeslagen en de subagent draait op het standaardmodel met een waarschuwing in het toolresultaat.
</ParamField>
<ParamField path="thinking" type="string">
  Overschrijf het denkniveau voor de subagent-run.
</ParamField>
<ParamField path="thread" type="boolean" default="false">
  Wanneer `true`, vraagt dit threadbinding voor deze subagentsessie aan.
</ParamField>
<ParamField path="mode" type='"run" | "session"' default="run">
  Als `thread: true` en `mode` is weggelaten, wordt de standaardwaarde `session`. `mode: "session"` vereist `thread: true`.
  Als threadbinding niet beschikbaar is voor het aanvragende kanaal, gebruik dan in plaats daarvan `mode: "run"`.
</ParamField>
<ParamField path="cleanup" type='"delete" | "keep"' default="keep">
  `"delete"` archiveert direct na aankondiging (bewaart het transcript nog steeds via hernoemen).
</ParamField>
<ParamField path="sandbox" type='"inherit" | "require"' default="inherit">
  `require` weigert spawn tenzij de doel-kindruntime in een sandbox draait.
</ParamField>
<ParamField path="context" type='"isolated" | "fork"' default="isolated">
  `fork` vertakt het huidige transcript van de aanvrager naar de kindsessie. Alleen native subagenten. Threadgebonden spawns gebruiken standaard `fork`; niet-threadspawns gebruiken standaard `isolated`.
</ParamField>

<Warning>
`sessions_spawn` accepteert **geen** kanaalbezorgingsparameters (`target`,
`channel`, `to`, `threadId`, `replyTo`, `transport`). Native subagenten rapporteren
hun nieuwste assistentbeurt terug aan de aanvrager; externe bezorging blijft bij
de ouder-/aanvrageragent.
</Warning>

### Taaknamen en targeting

`taskName` is een modelgerichte handle voor orkestratie, geen sessiesleutel.
Gebruik dit voor stabiele kindnamen zoals `review_subagents`,
`linux_validation` of `docs_update` wanneer een coördinator dat kind later
mogelijk moet inspecteren.

Targetresolutie accepteert exacte `taskName`-overeenkomsten en ondubbelzinnige
prefixen. Matching is beperkt tot hetzelfde actieve/recente targetvenster dat
door genummerde `/subagents`-targets wordt gebruikt, zodat een oud voltooid kind
een hergebruikte handle niet ambigu maakt. Als twee actieve of recente kinderen
dezelfde `taskName` delen, is het target ambigu; gebruik dan in plaats daarvan
de lijstindex, sessiesleutel of run-id.

De gereserveerde targets `last` en `all` zijn geen geldige `taskName`-waarden,
omdat ze al besturingsbetekenissen hebben.

## Tool: `sessions_yield`

Beëindigt de huidige modelbeurt en wacht tot runtimegebeurtenissen, primair
voltooiingsgebeurtenissen van subagenten, als het volgende bericht binnenkomen. Gebruik dit na
het spawnen van vereist kindwerk wanneer de aanvrager geen definitief antwoord
kan produceren totdat die voltooiingen binnenkomen.

`sessions_yield` is de wachtprimitief. Vervang dit niet door pollingloops
over `subagents`, `sessions_list`, `sessions_history`, shell-`sleep` of
procespolling alleen om voltooiing van een kind te detecteren.

Gebruik `sessions_yield` alleen wanneer de effectieve toollijst van de sessie
dit bevat. Sommige minimale of aangepaste toolprofielen kunnen `sessions_spawn` en
`subagents` beschikbaar maken zonder `sessions_yield`; verzin in dat geval geen
pollingloop alleen om op voltooiing te wachten.

Wanneer er actieve kinderen bestaan, injecteert OpenClaw een compact runtime-gegenereerd
`Active Subagents`-promptblok in normale beurten, zodat de aanvrager de
huidige kindsessies, run-id's, statussen, labels, taken en
`taskName`-aliassen kan zien zonder polling. De taak- en labelvelden in dat
blok worden geciteerd als data, niet als instructies, omdat ze kunnen ontstaan
uit door de gebruiker/het model aangeleverde spawn-argumenten.

## Tool: `subagents`

Geeft gespawnde subagent-runs weer die eigendom zijn van de aanvragersessie. Dit is beperkt
tot de huidige aanvrager; een kind kan alleen zijn eigen gecontroleerde kinderen zien.

Gebruik `subagents` voor status op aanvraag en debugging. Gebruik `sessions_yield` om
op voltooiingsgebeurtenissen te wachten.

## Threadgebonden sessies

Wanneer threadbindingen zijn ingeschakeld voor een kanaal, kan een subagent gebonden blijven
aan een thread, zodat vervolgbberichten van gebruikers in die thread naar dezelfde
subagentsessie blijven routeren.

### Kanalen met threadondersteuning

Elk kanaal met een sessiebindingadapter kan persistente
threadgebonden subagentsessies ondersteunen (`sessions_spawn` met `thread: true`).
Gebundelde adapters omvatten momenteel Discord-threads, Matrix-threads,
Telegram-forumonderwerpen en huidige-gespreksbindingen voor Feishu.
Gebruik de per-kanaal `threadBindings`-configuratiesleutels voor inschakeling,
time-outs en `spawnSessions`.

### Snelle flow

<Steps>
  <Step title="Spawn">
    `sessions_spawn` met `thread: true` (en optioneel `mode: "session"`).
  </Step>
  <Step title="Binden">
    OpenClaw maakt of bindt een thread aan dat sessietarget in het actieve kanaal.
  </Step>
  <Step title="Vervolgberichten routeren">
    Antwoorden en vervolgbberichten in die thread worden naar de gebonden sessie gerouteerd.
  </Step>
  <Step title="Time-outs inspecteren">
    Gebruik `/session idle` om automatische ontfocus bij inactiviteit te inspecteren/bij te werken en
    `/session max-age` om de harde limiet te beheren.
  </Step>
  <Step title="Loskoppelen">
    Gebruik `/unfocus` om handmatig los te koppelen.
  </Step>
</Steps>

### Handmatige besturing

| Command            | Effect                                                                |
| ------------------ | --------------------------------------------------------------------- |
| `/focus <target>`  | Bind de huidige thread (of maak er een) aan een subagent-/sessietarget |
| `/unfocus`         | Verwijder de binding voor de huidige gebonden thread                  |
| `/agents`          | Toon actieve runs en bindingsstatus (`thread:<id>` of `unbound`)      |
| `/session idle`    | Inspecteer/werk automatische ontfocus bij inactiviteit bij (alleen gefocuste gebonden threads) |
| `/session max-age` | Inspecteer/werk harde limiet bij (alleen gefocuste gebonden threads)  |

### Configuratieschakelaars

- **Globale standaard:** `session.threadBindings.enabled`, `session.threadBindings.idleHours`, `session.threadBindings.maxAgeHours`.
- **Kanaaloverride- en automatische spawn-bindingssleutels** zijn adapterspecifiek. Zie [Kanalen met threadondersteuning](#thread-supporting-channels) hierboven.

Zie [Configuratiereferentie](/nl/gateway/configuration-reference) en
[Slash commands](/nl/tools/slash-commands) voor actuele adapterdetails.

### Allowlist

<ParamField path="agents.list[].subagents.allowAgents" type="string[]">
  Lijst met geconfigureerde agent-id's die via expliciete `agentId` kunnen worden getarget (`["*"]` staat elk geconfigureerd target toe). Standaard: alleen de aanvrageragent. Als u een lijst instelt en nog steeds wilt dat de aanvrager zichzelf spawnt met `agentId`, neem dan de aanvrager-id op in de lijst.
</ParamField>
<ParamField path="agents.defaults.subagents.allowAgents" type="string[]">
  Standaard geconfigureerde allowlist voor doelagents die wordt gebruikt wanneer de aanvrageragent geen eigen `subagents.allowAgents` instelt.
</ParamField>
<ParamField path="agents.defaults.subagents.requireAgentId" type="boolean" default="false">
  Blokkeer `sessions_spawn`-aanroepen die `agentId` weglaten (dwingt expliciete profielselectie af). Override per agent: `agents.list[].subagents.requireAgentId`.
</ParamField>
<ParamField path="agents.defaults.subagents.announceTimeoutMs" type="number" default="120000">
  Time-out per aanroep voor gateway-`agent`-aankondigingsbezorgingspogingen. Waarden zijn positieve gehele milliseconden en worden begrensd op het platformveilige timermaximum. Tijdelijke retries kunnen de totale wachttijd voor aankondiging langer maken dan één geconfigureerde time-out.
</ParamField>

Als de aanvragersessie in een sandbox draait, weigert `sessions_spawn` targets
die zonder sandbox zouden draaien.

### Discovery

Gebruik `agents_list` om te zien welke agent-id's momenteel zijn toegestaan voor
`sessions_spawn`. Het antwoord bevat het effectieve model en de ingesloten
runtimemetadata van elke vermelde agent, zodat callers onderscheid kunnen maken tussen OpenClaw, Codex
app-server en andere geconfigureerde native runtimes.

`allowAgents`-items moeten verwijzen naar geconfigureerde agent-id's in `agents.list[]`.
`["*"]` betekent elke geconfigureerde doelagent plus de aanvrager. Als een agentconfiguratie
wordt verwijderd maar de id in `allowAgents` blijft staan, weigert `sessions_spawn` die id
en laat `agents_list` deze weg. Voer `openclaw doctor --fix` uit om oude
allowlist-items op te schonen, of voeg een minimale `agents.list[]`-entry toe wanneer het target
spawnbaar moet blijven terwijl het defaults erft.

### Automatisch archiveren

- Subagentsessies worden automatisch gearchiveerd na `agents.defaults.subagents.archiveAfterMinutes` (standaard `60`).
- Archiveren gebruikt `sessions.delete` en hernoemt het transcript naar `*.deleted.<timestamp>` (dezelfde map).
- `cleanup: "delete"` archiveert direct na aankondiging (bewaart het transcript nog steeds via hernoemen).
- Automatisch archiveren is best-effort; wachtende timers gaan verloren als de Gateway opnieuw start.
- Geconfigureerde run-time-outs archiveren **niet** automatisch; ze stoppen alleen de run. De sessie blijft bestaan tot automatisch archiveren.
- Automatisch archiveren geldt evenzeer voor diepte-1- en diepte-2-sessies.
- Browseropschoning staat los van archiefopschoning: bijgehouden browsertabs/-processen worden best-effort gesloten wanneer de run eindigt, zelfs als het transcript-/sessierecord wordt behouden.

## Geneste subagenten

Standaard kunnen subagenten hun eigen subagenten niet spawnen
(`maxSpawnDepth: 1`). Stel `maxSpawnDepth: 2` in om één niveau
nesting in te schakelen — het **orkestratorpatroon**: hoofd → orkestrator-subagent →
worker-sub-subagenten.

```json5
{
  agents: {
    defaults: {
      subagents: {
        maxSpawnDepth: 2, // allow sub-agents to spawn children (default: 1)
        maxChildrenPerAgent: 5, // max active children per agent session (default: 5)
        maxConcurrent: 8, // global concurrency lane cap (default: 8)
        runTimeoutSeconds: 900, // default timeout for sessions_spawn (0 = no timeout)
        announceTimeoutMs: 120000, // per-call gateway announce timeout
      },
    },
  },
}
```

### Diepteniveaus

| Diepte | Vorm van sessiesleutel                       | Rol                                           | Kan spawnen?                 |
| ----- | -------------------------------------------- | --------------------------------------------- | ---------------------------- |
| 0     | `agent:<id>:main`                            | Hoofdagent                                    | Altijd                       |
| 1     | `agent:<id>:subagent:<uuid>`                 | Subagent (orkestrator wanneer diepte 2 is toegestaan) | Alleen als `maxSpawnDepth >= 2` |
| 2     | `agent:<id>:subagent:<uuid>:subagent:<uuid>` | Sub-subagent (leafworker)                     | Nooit                        |

### Aankondigingsketen

Resultaten stromen terug omhoog door de keten:

1. Depth-2-worker voltooit → kondigt dit aan bij de bovenliggende agent (depth-1-orchestrator).
2. Depth-1-orchestrator ontvangt de aankondiging, synthetiseert resultaten, voltooit → kondigt dit aan bij main.
3. Hoofdagent ontvangt de aankondiging en levert deze aan de gebruiker.

Elk niveau ziet alleen aankondigingen van zijn directe kinderen.

<Note>
**Operationele richtlijn:** start kindwerk één keer en wacht op voltooiingsgebeurtenissen in plaats van poll-lussen te bouwen rond `sessions_list`, `sessions_history`, `/subagents list` of `exec`-slaapcommando's. `sessions_list` en `/subagents list` houden kind-sessierelaties gericht op live werk — live kinderen blijven gekoppeld, beëindigde kinderen blijven kort zichtbaar in een recent venster, en verouderde alleen-in-store kindkoppelingen worden genegeerd na hun versheidsvenster. Dit voorkomt dat oude `spawnedBy`- / `parentSessionKey`-metadata na een herstart spookkinderen laat terugkeren. Als een voltooiingsgebeurtenis van een kind aankomt nadat je het definitieve antwoord al hebt verzonden, is de juiste follow-up het exacte stille token `NO_REPLY` / `no_reply`.
</Note>

### Toolbeleid per diepte

- Rol en control scope worden bij het spawnen in sessiemetadata geschreven. Daardoor kunnen platte of herstelde sessiesleutels niet per ongeluk opnieuw orchestratorrechten krijgen.
- **Depth 1 (orchestrator, wanneer `maxSpawnDepth >= 2`):** krijgt `sessions_spawn`, `subagents`, `sessions_list`, `sessions_history` zodat deze kinderen kan spawnen en hun status kan inspecteren. Andere sessie-/systeemtools blijven geweigerd.
- **Depth 1 (leaf, wanneer `maxSpawnDepth == 1`):** geen sessietools (huidig standaardgedrag).
- **Depth 2 (leaf-worker):** geen sessietools — `sessions_spawn` wordt altijd geweigerd op depth 2. Kan geen verdere kinderen spawnen.

### Spawnlimiet per agent

Elke agentsessie (op elke diepte) kan tegelijk maximaal `maxChildrenPerAgent` (standaard `5`) actieve kinderen hebben. Dit voorkomt onbeheersbare fan-out vanuit één orchestrator.

### Cascade-stop

Het stoppen van een depth-1-orchestrator stopt automatisch al zijn depth-2-kinderen:

- `/stop` in de hoofdchat stopt alle depth-1-agenten en cascadeert naar hun depth-2-kinderen.

## Authenticatie

Authenticatie van subagenten wordt opgelost op basis van **agent-id**, niet op basis van sessietype:

- De sessiesleutel van de subagent is `agent:<agentId>:subagent:<uuid>`.
- De auth-store wordt geladen uit de `agentDir` van die agent.
- De auth-profielen van de hoofdagent worden samengevoegd als **fallback**; agentprofielen overschrijven hoofdprofielen bij conflicten.

De samenvoeging is additief, dus hoofdprofielen zijn altijd beschikbaar als fallbacks. Volledig geïsoleerde authenticatie per agent wordt nog niet ondersteund.

## Aankondiging

Subagenten rapporteren terug via een aankondigingsstap:

- De aankondigingsstap draait binnen de subagentsessie (niet de sessie van de aanvrager).
- Als de subagent exact `ANNOUNCE_SKIP` antwoordt, wordt er niets geplaatst.
- Als de meest recente assistenttekst het exacte stille token `NO_REPLY` / `no_reply` is, wordt aankondigingsuitvoer onderdrukt, zelfs als er eerder zichtbare voortgang was.

Levering hangt af van de diepte van de aanvrager:

- Aanvragersessies op het hoogste niveau gebruiken een follow-up-`agent`-aanroep met externe levering (`deliver=true`).
- Geneste aanvrager-subagentsessies ontvangen een interne follow-up-injectie (`deliver=false`) zodat de orchestrator kindresultaten in de sessie kan synthetiseren.
- Als een geneste aanvrager-subagentsessie verdwenen is, valt OpenClaw terug op de aanvrager van die sessie wanneer beschikbaar.

Voor aanvragersessies op het hoogste niveau lost rechtstreekse levering in voltooiingsmodus eerst een gekoppelde gespreks-/threadroute en hook-override op, en vult daarna ontbrekende kanaal-doelvelden in vanuit de opgeslagen route van de aanvragersessie. Zo blijven voltooiingen in de juiste chat/topic, zelfs wanneer de voltooiingsoorsprong alleen het kanaal identificeert.

Aggregatie van kindvoltooiingen is bij het bouwen van geneste voltooiingsbevindingen beperkt tot de huidige aanvragerrun, zodat verouderde kinduitvoer uit eerdere runs niet in de huidige aankondiging lekt. Aankondigingsantwoorden behouden thread-/topicroutering wanneer die beschikbaar is op kanaaladapters.

### Aankondigingscontext

Aankondigingscontext wordt genormaliseerd naar een stabiel intern gebeurtenisblok:

| Veld           | Bron                                                                                                                   |
| -------------- | ---------------------------------------------------------------------------------------------------------------------- |
| Bron           | `subagent` of `cron`                                                                                                   |
| Sessie-id's    | Kind-sessiesleutel/id                                                                                                  |
| Type           | Aankondigingstype + taaklabel                                                                                          |
| Status         | Afgeleid van runtime-uitkomst (`success`, `error`, `timeout` of `unknown`) — **niet** afgeleid uit modeltekst          |
| Resultaatinhoud | Meest recente zichtbare assistenttekst van het kind                                                                    |
| Follow-up      | Instructie die beschrijft wanneer te antwoorden versus stil te blijven                                                  |

Terminale mislukte runs rapporteren een foutstatus zonder vastgelegde antwoordtekst opnieuw af te spelen. Tool-/toolResult-uitvoer wordt niet gepromoveerd naar kindresultaattekst.

### Statistiekregel

Aankondigingspayloads bevatten aan het einde een statistiekregel (ook wanneer ingepakt):

- Runtime (bijv. `runtime 5m12s`).
- Tokengebruik (invoer/uitvoer/totaal).
- Geschatte kosten wanneer modelprijzen zijn geconfigureerd (`models.providers.*.models[].cost`).
- `sessionKey`, `sessionId` en transcriptpad zodat de hoofdagent geschiedenis kan ophalen via `sessions_history` of het bestand op schijf kan inspecteren.

Interne metadata is alleen bedoeld voor orchestration; gebruikersgerichte antwoorden moeten worden herschreven in normale assistentstem.

### Waarom `sessions_history` de voorkeur heeft

`sessions_history` is het veiligere orchestration-pad:

- Assistentherinnering wordt eerst genormaliseerd: thinking-tags verwijderd; `<relevant-memories>`- / `<relevant_memories>`-scaffolding verwijderd; platte-tekst tool-call-XML-payloadblokken (`<tool_call>`, `<function_call>`, `<tool_calls>`, `<function_calls>`) verwijderd, inclusief afgekorte payloads die nooit netjes sluiten; gedegradeerde tool-call-/result-scaffolding en historische-contextmarkeringen verwijderd; gelekte modelbesturingstokens (`<|assistant|>`, andere ASCII `<|...|>`, full-width `<｜...｜>`) verwijderd; misvormde MiniMax-tool-call-XML verwijderd.
- Tekst die op credentials/tokens lijkt, wordt geredigeerd.
- Lange blokken kunnen worden afgekapt.
- Zeer grote geschiedenissen kunnen oudere rijen laten vallen of een te grote rij vervangen door `[sessions_history omitted: message too large]`.
- Ruwe transcriptinspectie op schijf is de fallback wanneer je het volledige byte-voor-byte transcript nodig hebt.

## Toolbeleid

Subagenten gebruiken eerst dezelfde profiel- en toolbeleidspipeline als de ouder- of doelagent. Daarna past OpenClaw de restrictielaag voor subagenten toe.

Zonder restrictieve `tools.profile` krijgen subagenten **alle tools behalve de berichttool, sessietools en systeemtools**:

- `sessions_list`
- `sessions_history`
- `sessions_send`
- `sessions_spawn`
- `message`

`sessions_history` blijft ook hier een begrensde, gesaneerde herinneringsweergave — het is geen ruwe transcriptdump.

Wanneer `maxSpawnDepth >= 2`, ontvangen depth-1-orchestrator-subagenten daarnaast `sessions_spawn`, `subagents`, `sessions_list` en `sessions_history` zodat ze hun kinderen kunnen beheren.

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

`tools.subagents.tools.allow` is een definitief allow-only filter. Het kan de al opgeloste toolset beperken, maar het kan geen tool **terug toevoegen** die door `tools.profile` is verwijderd. Bijvoorbeeld: `tools.profile: "coding"` bevat `web_search`/`web_fetch` maar niet de `browser`-tool. Voeg browser toe in de profielfase om coding-profiel-subagenten browserautomatisering te laten gebruiken:

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

Subagenten gebruiken een toegewezen in-process queue-lane:

- **Lanenaam:** `subagent`
- **Gelijktijdigheid:** `agents.defaults.subagents.maxConcurrent` (standaard `8`)

## Liveness en herstel

OpenClaw behandelt het ontbreken van `endedAt` niet als permanent bewijs dat een subagent nog leeft. Niet-beëindigde runs ouder dan het stale-run-venster tellen niet meer als actief/in behandeling in `/subagents list`, statussamenvattingen, gating van nakomelingvoltooiingen en gelijktijdigheidscontroles per sessie.

Na een gateway-herstart worden verouderde niet-beëindigde herstelde runs opgeschoond, tenzij hun kindsessie is gemarkeerd met `abortedLastRun: true`. Die bij herstart afgebroken kindsessies blijven herstelbaar via de orphan-herstelstroom voor subagenten, die een synthetisch hervattingsbericht verstuurt voordat de afgebroken-markering wordt gewist.

Automatisch herstartherstel is begrensd per kindsessie. Als hetzelfde subagentkind herhaaldelijk wordt geaccepteerd voor orphan-herstel binnen het snelle re-wedge-venster, bewaart OpenClaw een herstel-tombstone op die sessie en stopt het met automatisch hervatten bij latere herstarts. Voer `openclaw tasks maintenance --apply` uit om het taakrecord te reconciliëren, of `openclaw doctor --fix` om verouderde afgebroken-herstelvlaggen op tombstoned sessies te wissen.

<Note>
Als het spawnen van een subagent faalt met Gateway `PAIRING_REQUIRED` / `scope-upgrade`, controleer dan de RPC-caller voordat je pairing state wijzigt. Interne `sessions_spawn`-coördinatie dispatcht in-process wanneer de caller al binnen de gateway-requestcontext draait, dus die opent geen loopback-WebSocket en is niet afhankelijk van de paired-device-scopebaseline van de CLI. Callers buiten het gateway-proces gebruiken nog steeds de WebSocket-fallback als `client.id: "gateway-client"` met `client.mode: "backend"` via directe loopback shared-token/password-authenticatie. Externe callers, expliciete `deviceIdentity`, expliciete device-token-paden en browser-/node-clients hebben nog steeds normale apparaatgoedkeuring nodig voor scope-upgrades.
</Note>

## Stoppen

- Het verzenden van `/stop` in de aanvragerchat breekt de aanvragersessie af en stopt alle actieve subagentruns die daaruit zijn gespawnd, met cascade naar geneste kinderen.

## Beperkingen

- Aankondiging door subagenten is **best-effort**. Als de gateway herstart, gaat wachtend "announce back"-werk verloren.
- Subagenten delen nog steeds dezelfde gateway-procesresources; behandel `maxConcurrent` als veiligheidsklep.
- `sessions_spawn` is altijd niet-blokkerend: het retourneert direct `{ status: "accepted", runId, childSessionKey }`.
- Subagentcontext injecteert alleen `AGENTS.md` en `TOOLS.md` (geen `SOUL.md`, `IDENTITY.md`, `USER.md`, `MEMORY.md`, `HEARTBEAT.md` of `BOOTSTRAP.md`). Codex-native subagenten volgen dezelfde grens: `TOOLS.md` blijft in overgeërfde Codex-threadinstructies, terwijl alleen-voor-ouder persona-, identity- en user-bestanden worden geïnjecteerd als turnspecifieke samenwerkingsinstructies, zodat kinderen die niet klonen.
- Maximale nestingsdiepte is 5 (`maxSpawnDepth`-bereik: 1–5). Depth 2 wordt aanbevolen voor de meeste use cases.
- `maxChildrenPerAgent` limiteert actieve kinderen per sessie (standaard `5`, bereik `1–20`).

## Gerelateerd

- [ACP-agenten](/nl/tools/acp-agents)
- [Agent verzenden](/nl/tools/agent-send)
- [Achtergrondtaken](/nl/automation/tasks)
- [Multi-agent sandbox-tools](/nl/tools/multi-agent-sandbox-tools)
