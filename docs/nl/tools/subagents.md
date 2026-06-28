---
read_when:
    - Je wilt achtergrond- of parallel werk via de agent
    - Je wijzigt sessions_spawn of het beleid voor sub-agenthulpmiddelen
    - Je implementeert threadgebonden subagentsessies of lost problemen ermee op
sidebarTitle: Sub-agents
summary: Start geïsoleerde agentruns op de achtergrond die resultaten terugmelden in de aanvraagchat
title: Subagenten
x-i18n:
    generated_at: "2026-06-28T00:13:49Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 144af6e020c86d171fe6c5734efaad229adaea35f8d1c1b07e37c549805c88ff
    source_path: tools/subagents.md
    workflow: 16
---

Subagenten zijn achtergrond-agentruns die vanuit een bestaande agentrun worden gestart.
Ze draaien in hun eigen sessie (`agent:<agentId>:subagent:<uuid>`) en
**melden** hun resultaat na afloop terug aan het chatchannel van de aanvrager.
Elke subagentrun wordt bijgehouden als een
[achtergrondtaak](/nl/automation/tasks).

Primaire doelen:

- Paralleliseer werk voor "onderzoek / lange taak / trage tool" zonder de hoofdrun te blokkeren.
- Houd subagenten standaard geisoleerd (sessiescheiding + optionele sandboxing).
- Houd het tooloppervlak moeilijk te misbruiken: subagenten krijgen standaard **geen** sessietools.
- Ondersteun configureerbare nestingsdiepte voor orchestratorpatronen.

<Note>
**Kostenopmerking:** elke subagent heeft standaard zijn eigen context en
tokengebruik. Stel voor zware of repetitieve taken een goedkoper model in voor subagenten
en houd je hoofdagent op een model van hogere kwaliteit. Configureer dit via
`agents.defaults.subagents.model` of per-agent overschrijvingen. Wanneer een child
    echt het huidige transcript van de aanvrager nodig heeft, kan de agent
    `context: "fork"` aanvragen voor die ene spawn. Thread-gebonden subagentsessies gebruiken standaard
    `context: "fork"` omdat ze het huidige gesprek vertakken naar een
    vervolgthread.
</Note>

## Slash-command

Gebruik `/subagents` om subagentruns voor de **huidige sessie** te inspecteren:

```text
/subagents list
/subagents log <id|#> [limit] [tools]
/subagents info <id|#>
```

`/subagents info` toont runmetadata (status, tijdstempels, sessie-id,
transcriptpad, opschoning). Gebruik `sessions_history` voor een begrensde,
veiligheidsgefilterde recall-weergave; inspecteer het transcriptpad op schijf wanneer je
het ruwe volledige transcript nodig hebt.

### Besturing voor thread-binding

Deze commando's werken op channels die persistente thread-bindings ondersteunen.
Zie [Channels met thread-ondersteuning](#thread-supporting-channels) hieronder.

```text
/focus <subagent-label|session-key|session-id|session-label>
/unfocus
/agents
/session idle <duration|off>
/session max-age <duration|off>
```

### Spawn-gedrag

Agents starten achtergrondsubagenten met `sessions_spawn`. Voltooiingen van subagenten
komen terug als interne parent-sessiegebeurtenissen; de parent-/aanvrageragent beslist
of een gebruikersgerichte update nodig is.

<AccordionGroup>
  <Accordion title="Niet-blokkerende, push-gebaseerde voltooiing">
    - `sessions_spawn` is niet-blokkerend; het retourneert direct een run-id.
    - Bij voltooiing rapporteert de subagent terug aan de parent-/aanvragersessie.
    - Agentbeurten die child-resultaten nodig hebben, moeten `sessions_yield` aanroepen na het starten van vereist werk. Dat beeindigt de huidige beurt en laat voltooiingsgebeurtenissen binnenkomen als het volgende model-zichtbare bericht.
    - Voltooiing is push-gebaseerd. Eenmaal gestart, poll **niet** `/subagents list`, `sessions_list` of `sessions_history` in een lus alleen om te wachten tot het klaar is; inspecteer de status alleen op aanvraag voor debugzichtbaarheid.
    - Child-uitvoer is een rapport/bewijs voor de aanvrageragent om te synthetiseren. Het is geen door de gebruiker geschreven instructietekst en kan systeem-, developer- of gebruikersbeleid niet overschrijven.
    - Bij voltooiing sluit OpenClaw naar beste vermogen gevolgde browsertabs/processen die door die subagentsessie zijn geopend voordat de meldingsopschoningsflow doorgaat.

  </Accordion>
  <Accordion title="Levering van voltooiing">
    - OpenClaw geeft voltooiingen terug aan de aanvragersessie via een `agent`-beurt met een stabiele idempotentiesleutel.
    - Als de aanvragerrun nog actief is, probeert OpenClaw eerst die run te wekken/sturen in plaats van een tweede zichtbaar antwoordpad te starten.
    - Als een actieve aanvrager niet kan worden gewekt, valt OpenClaw terug op een aanvrager-agent-handoff met dezelfde voltooiingscontext in plaats van de melding te laten vallen.
    - Een geslaagde parent-handoff voltooit de levering van de subagent, zelfs wanneer de parent beslist dat geen zichtbare gebruikersupdate nodig is.
    - Native subagenten krijgen de berichttool niet. Ze retourneren gewone assistenttekst aan de parent-/aanvrageragent; mens-zichtbare antwoorden vallen onder het normale leveringsbeleid van de parent-/aanvrageragent.
    - Als directe handoff niet kan worden gebruikt, valt dit terug op wachtrijroutering.
    - Als wachtrijroutering nog steeds niet beschikbaar is, wordt de melding opnieuw geprobeerd met een korte exponentiele backoff voordat definitief wordt opgegeven.
    - Levering van voltooiing behoudt de opgeloste aanvragerroute: thread-gebonden of conversatie-gebonden voltooiingsroutes winnen wanneer beschikbaar; als de voltooiingsoorsprong alleen een channel levert, vult OpenClaw het ontbrekende doel/account aan vanuit de opgeloste route van de aanvragersessie (`lastChannel` / `lastTo` / `lastAccountId`) zodat directe levering nog steeds werkt.

  </Accordion>
  <Accordion title="Metadata voor voltooiingshandoff">
    De voltooiingshandoff naar de aanvragersessie is runtime-gegenereerde
    interne context (geen door de gebruiker geschreven tekst) en bevat:

    - `Result` — de nieuwste zichtbare `assistant`-antwoordtekst van het child. Tool-/toolResult-uitvoer wordt niet gepromoveerd naar child-resultaten. Terminale mislukte runs hergebruiken vastgelegde antwoordtekst niet.
    - `Status` — `completed; ready for parent review` / `failed` / `timed out` / `unknown`.
    - Compacte runtime-/tokenstatistieken.
    - Een review-instructie die de aanvrageragent vertelt het resultaat te verifiëren voordat wordt beslist of de oorspronkelijke taak klaar is.
    - Vervolgrichtlijnen die de aanvrageragent vertellen de taak voort te zetten of een vervolg vast te leggen wanneer het child-resultaat meer actie vereist.
    - Een instructie voor de laatste update voor het pad zonder verdere actie, geschreven in normale assistentstem zonder ruwe interne metadata door te sturen.

  </Accordion>
  <Accordion title="Modi en ACP-runtime">
    - `--model` en `--thinking` overschrijven standaardwaarden voor die specifieke run.
    - Gebruik `info`/`log` om details en uitvoer na voltooiing te inspecteren.
    - Gebruik voor persistente thread-gebonden sessies `sessions_spawn` met `thread: true` en `mode: "session"`.
    - Als het aanvragerchannel geen thread-bindings ondersteunt, gebruik dan `mode: "run"` in plaats van onmogelijke thread-gebonden combinaties opnieuw te proberen.
    - Gebruik voor ACP-harnesssessies (Claude Code, Gemini CLI, OpenCode of expliciete Codex ACP/acpx) `sessions_spawn` met `runtime: "acp"` wanneer de tool die runtime adverteert. Zie [ACP-leveringsmodel](/nl/tools/acp-agents#delivery-model) bij het debuggen van voltooiingen of agent-naar-agent-lussen. Wanneer de `codex`-Plugin is ingeschakeld, moet Codex-chat-/threadbesturing de voorkeur geven aan `/codex ...` boven ACP, tenzij de gebruiker expliciet om ACP/acpx vraagt.
    - OpenClaw verbergt `runtime: "acp"` totdat ACP is ingeschakeld, de aanvrager niet in een sandbox zit en een backend-Plugin zoals `acpx` is geladen. `runtime: "acp"` verwacht een externe ACP-harness-id, of een `agents.list[]`-item met `runtime.type="acp"`; gebruik de standaard subagentruntime voor normale OpenClaw-configuratieagents uit `agents_list`.

  </Accordion>
</AccordionGroup>

## Contextmodi

Native subagenten starten geisoleerd tenzij de caller expliciet vraagt om
het huidige transcript te forken.

| Modus      | Wanneer je deze gebruikt                                                                                                               | Gedrag                                                                            |
| ---------- | -------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------- |
| `isolated` | Nieuw onderzoek, onafhankelijke implementatie, traag toolwerk of alles wat kort in de taaktekst kan worden uitgelegd                   | Maakt een schoon child-transcript. Dit is de standaard en houdt tokengebruik lager. |
| `fork`     | Werk dat afhangt van het huidige gesprek, eerdere toolresultaten of genuanceerde instructies die al in het aanvragertranscript staan   | Vertakt het aanvragertranscript naar de child-sessie voordat het child start.      |

Gebruik `fork` spaarzaam. Het is bedoeld voor contextgevoelige delegatie, niet als
vervanging voor het schrijven van een duidelijke taakprompt.

## Tool: `sessions_spawn`

Start een subagentrun met `deliver: false` op de globale `subagent`-lane,
voert daarna een meldingsstap uit en plaatst het meldingsantwoord in het
chatchannel van de aanvrager.

Beschikbaarheid hangt af van het effectieve toolbeleid van de caller. De profielen `coding` en
`full` stellen `sessions_spawn` standaard beschikbaar. Het profiel `messaging`
doet dat niet; voeg `tools.alsoAllow: ["sessions_spawn", "sessions_yield",
"subagents"]` toe of gebruik `tools.profile: "coding"` voor agents die werk moeten delegeren.
Channel-/groep-, provider-, sandbox- en per-agent allow/deny-beleid kan
de tool na de profielfase nog steeds verwijderen. Gebruik `/tools` vanuit dezelfde
sessie om de effectieve toollijst te bevestigen.

**Standaardwaarden:**

- **Model:** native subagenten erven de caller tenzij je `agents.defaults.subagents.model` instelt (of per-agent `agents.list[].subagents.model`). ACP-runtime-spawns gebruiken hetzelfde geconfigureerde subagentmodel wanneer aanwezig; anders behoudt de ACP-harness zijn eigen standaard. Een expliciete `sessions_spawn.model` wint nog steeds.
- **Thinking:** native subagenten erven de caller tenzij je `agents.defaults.subagents.thinking` instelt (of per-agent `agents.list[].subagents.thinking`). ACP-runtime-spawns passen ook `agents.defaults.models["provider/model"].params.thinking` toe voor het geselecteerde model. Een expliciete `sessions_spawn.thinking` wint nog steeds.
- **Run-time-out:** OpenClaw gebruikt `agents.defaults.subagents.runTimeoutSeconds` wanneer ingesteld; anders valt het terug op `0` (geen time-out). `sessions_spawn` accepteert geen time-outoverschrijvingen per aanroep.
- **Taaklevering:** native subagenten ontvangen de gedelegeerde taak in hun eerste zichtbare `[Subagent Task]`-bericht. De systeem-prompt van de subagent bevat runtimeregels en routeringscontext, geen verborgen duplicaat van de taak.

Geaccepteerde native subagent-spawns bevatten de opgeloste child-modelmetadata in
het toolresultaat: `resolvedModel` bevat de toegepaste modelreferentie en
`resolvedProvider` bevat de providerprefix wanneer de referentie er een heeft.

### Delegatiepromptmodus

`agents.defaults.subagents.delegationMode` bepaalt alleen promptbegeleiding; het verandert het toolbeleid niet en dwingt delegatie niet af.

- `suggest` (standaard): behoud de standaard promptnudge om subagenten te gebruiken voor groter of trager werk.
- `prefer`: vertel de hoofdagent responsief te blijven en alles wat meer omvat dan een direct antwoord via `sessions_spawn` te delegeren.

Per-agent overschrijvingen gebruiken `agents.list[].subagents.delegationMode`.

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
  De taakbeschrijving voor de subagent.
</ParamField>
<ParamField path="taskName" type="string">
  Optionele stabiele handle om een specifiek kind in latere statusuitvoer te identificeren. Moet overeenkomen met `[a-z][a-z0-9_-]{0,63}` en mag geen gereserveerde doelen zijn, zoals `last` of `all`.
</ParamField>
<ParamField path="label" type="string">
  Optioneel menselijk leesbaar label.
</ParamField>
<ParamField path="agentId" type="string">
  Spawn onder een andere geconfigureerde agent-id wanneer toegestaan door `subagents.allowAgents`.
</ParamField>
<ParamField path="cwd" type="string">
  Optionele taakwerkmap voor de kindrun. Native subagenten laden bootstrap-bestanden nog steeds vanuit de werkruimte van de doelagent; `cwd` wijzigt alleen waar runtimetools en CLI-harnassen het gedelegeerde werk uitvoeren.
</ParamField>
<ParamField path="runtime" type='"subagent" | "acp"' default="subagent">
  `acp` is alleen bedoeld voor externe ACP-harnassen (`claude`, `droid`, `gemini`, `opencode`, of expliciet aangevraagde Codex ACP/acpx) en voor vermeldingen in `agents.list[]` waarvan `runtime.type` `acp` is.
</ParamField>
<ParamField path="resumeSessionId" type="string">
  Alleen ACP. Hervat een bestaande ACP-harnassessie wanneer `runtime: "acp"`; genegeerd voor native subagent-spawns.
</ParamField>
<ParamField path="streamTo" type='"parent"'>
  Alleen ACP. Streamt ACP-runuitvoer naar de bovenliggende sessie wanneer `runtime: "acp"`; weglaten voor native subagent-spawns.
</ParamField>
<ParamField path="model" type="string">
  Overschrijf het subagentmodel. Ongeldige waarden worden overgeslagen en de subagent draait op het standaardmodel met een waarschuwing in het toolresultaat.
</ParamField>
<ParamField path="thinking" type="string">
  Overschrijf het denkniveau voor de subagentrun.
</ParamField>
<ParamField path="thread" type="boolean" default="false">
  Wanneer `true`, vraagt dit kanaalthreadbinding aan voor deze subagentsessie.
</ParamField>
<ParamField path="mode" type='"run" | "session"' default="run">
  Als `thread: true` en `mode` is weggelaten, wordt de standaardwaarde `session`. `mode: "session"` vereist `thread: true`.
  Als threadbinding niet beschikbaar is voor het aanvragende kanaal, gebruik dan in plaats daarvan `mode: "run"`.
</ParamField>
<ParamField path="cleanup" type='"delete" | "keep"' default="keep">
  `"delete"` archiveert direct na aankondiging (het transcript blijft nog steeds bewaard via hernoemen).
</ParamField>
<ParamField path="sandbox" type='"inherit" | "require"' default="inherit">
  `require` weigert spawn tenzij de doelruntime van het kind in een sandbox draait.
</ParamField>
<ParamField path="context" type='"isolated" | "fork"' default="isolated">
  `fork` vertakt het huidige transcript van de aanvrager naar de kindsessie. Alleen native subagenten. Thread-gebonden spawns gebruiken standaard `fork`; niet-threadspawns gebruiken standaard `isolated`.
</ParamField>

<Warning>
`sessions_spawn` accepteert **geen** kanaalbezorgingsparameters (`target`,
`channel`, `to`, `threadId`, `replyTo`, `transport`). Native subagenten rapporteren
hun nieuwste assistentbeurt terug aan de aanvrager; externe bezorging blijft bij
de bovenliggende/aanvragende agent.
</Warning>

### Taaknamen en targeting

`taskName` is een modelgerichte handle voor orkestratie, geen sessiesleutel.
Gebruik deze voor stabiele kindnamen zoals `review_subagents`,
`linux_validation` of `docs_update` wanneer een coördinator dat kind later
mogelijk moet inspecteren.

Doelresolutie accepteert exacte `taskName`-overeenkomsten en eenduidige
voorvoegsels. Overeenkomsten zijn beperkt tot hetzelfde actieve/recente
doelvenster dat wordt gebruikt door genummerde `/subagents`-doelen, zodat een
verouderd voltooid kind een hergebruikte handle niet ambigu maakt. Als twee
actieve of recente kinderen dezelfde `taskName` delen, is het doel ambigu;
gebruik in plaats daarvan de lijstindex, sessiesleutel of run-id.

De gereserveerde doelen `last` en `all` zijn geen geldige `taskName`-waarden,
omdat ze al besturingsbetekenissen hebben.

## Tool: `sessions_yield`

Beëindigt de huidige modelbeurt en wacht tot runtimegebeurtenissen, vooral
voltooiingsgebeurtenissen van subagenten, als het volgende bericht binnenkomen.
Gebruik dit na het spawnen van vereist kindwerk wanneer de aanvrager geen
definitief antwoord kan produceren totdat die voltooiingen binnenkomen.

`sessions_yield` is de wachtprimitive. Vervang deze niet door pollinglussen
over `subagents`, `sessions_list`, `sessions_history`, shell-`sleep` of
procespolling alleen om voltooiing van een kind te detecteren.

Gebruik `sessions_yield` alleen wanneer de effectieve toollijst van de sessie
deze bevat. Sommige minimale of aangepaste toolprofielen kunnen `sessions_spawn`
en `subagents` beschikbaar stellen zonder `sessions_yield`; verzin in dat geval
geen pollinglus alleen om op voltooiing te wachten.

Wanneer er actieve kinderen bestaan, injecteert OpenClaw een compact,
runtimegegenereerd `Active Subagents`-promptblok in normale beurten, zodat de
aanvrager de huidige kindsessies, run-id's, statussen, labels, taken en
`taskName`-aliassen kan zien zonder polling. De taak- en labelvelden in dat blok
worden als gegevens geciteerd, niet als instructies, omdat ze afkomstig kunnen
zijn uit door de gebruiker/het model opgegeven spawnargumenten.

## Tool: `subagents`

Toont gespawnde subagentruns die eigendom zijn van de aanvragersessie. Het is
beperkt tot de huidige aanvrager; een kind kan alleen zijn eigen beheerde
kinderen zien.

Gebruik `subagents` voor status op aanvraag en foutopsporing. Gebruik
`sessions_yield` om op voltooiingsgebeurtenissen te wachten.

## Thread-gebonden sessies

Wanneer threadbindingen voor een kanaal zijn ingeschakeld, kan een subagent
aan een thread gebonden blijven, zodat vervolgeberichten van gebruikers in die
thread naar dezelfde subagentsessie blijven routeren.

### Kanalen met threadondersteuning

Elk kanaal met een sessiebindingsadapter kan persistente thread-gebonden
subagentsessies ondersteunen (`sessions_spawn` met `thread: true`).
Gebundelde adapters bevatten momenteel Discord-threads, Matrix-threads,
Telegram-forumonderwerpen en huidige-gespreksbindingen voor Feishu.
Gebruik de per-kanaal `threadBindings`-configuratiesleutels voor inschakeling,
timeouts en `spawnSessions`.

### Snelle flow

<Steps>
  <Step title="Spawnen">
    `sessions_spawn` met `thread: true` (en optioneel `mode: "session"`).
  </Step>
  <Step title="Binden">
    OpenClaw maakt of bindt een thread aan dat sessiedoel in het actieve kanaal.
  </Step>
  <Step title="Vervolgen routeren">
    Antwoorden en vervolgeberichten in die thread routeren naar de gebonden sessie.
  </Step>
  <Step title="Timeouts inspecteren">
    Gebruik `/session idle` om automatische ontfocus bij inactiviteit te inspecteren/bij te werken en
    `/session max-age` om de harde limiet te beheren.
  </Step>
  <Step title="Loskoppelen">
    Gebruik `/unfocus` om handmatig los te koppelen.
  </Step>
</Steps>

### Handmatige besturing

| Opdracht           | Effect                                                                |
| ------------------ | --------------------------------------------------------------------- |
| `/focus <target>`  | Bind de huidige thread (of maak er een) aan een subagent-/sessiedoel |
| `/unfocus`         | Verwijder de binding voor de huidige gebonden thread                  |
| `/agents`          | Toon actieve runs en bindingsstatus (`thread:<id>` of `unbound`)     |
| `/session idle`    | Inspecteer/update automatische ontfocus bij inactiviteit (alleen gefocuste gebonden threads) |
| `/session max-age` | Inspecteer/update harde limiet (alleen gefocuste gebonden threads)   |

### Configuratieschakelaars

- **Globale standaard:** `session.threadBindings.enabled`, `session.threadBindings.idleHours`, `session.threadBindings.maxAgeHours`.
- **Kanaaloverschrijving en spawn-autobind-sleutels** zijn adapterspecifiek. Zie [Kanalen met threadondersteuning](#thread-supporting-channels) hierboven.

Zie [Configuratiereferentie](/nl/gateway/configuration-reference) en
[Slash-opdrachten](/nl/tools/slash-commands) voor actuele adapterdetails.

### Toestaanlijst

<ParamField path="agents.list[].subagents.allowAgents" type="string[]">
  Lijst met geconfigureerde agent-id's die via expliciete `agentId` kunnen worden getarget (`["*"]` staat elk geconfigureerd doel toe). Standaard: alleen de aanvragende agent. Als u een lijst instelt en nog steeds wilt dat de aanvrager zichzelf met `agentId` spawnt, neem dan de aanvrager-id op in de lijst.
</ParamField>
<ParamField path="agents.defaults.subagents.allowAgents" type="string[]">
  Standaard toestaanlijst voor geconfigureerde doelagenten die wordt gebruikt wanneer de aanvragende agent geen eigen `subagents.allowAgents` instelt.
</ParamField>
<ParamField path="agents.defaults.subagents.requireAgentId" type="boolean" default="false">
  Blokkeer `sessions_spawn`-aanroepen die `agentId` weglaten (dwingt expliciete profielselectie af). Per-agent overschrijving: `agents.list[].subagents.requireAgentId`.
</ParamField>
<ParamField path="agents.defaults.subagents.announceTimeoutMs" type="number" default="120000">
  Timeout per aanroep voor Gateway-`agent`-aankondigingsbezorgingspogingen. Waarden zijn positieve gehele milliseconden en worden begrensd op het platformveilige timermaximum. Tijdelijke retries kunnen de totale wachttijd voor aankondiging langer maken dan één geconfigureerde timeout.
</ParamField>

Als de aanvragersessie in een sandbox draait, weigert `sessions_spawn` doelen
die zonder sandbox zouden draaien.

### Detectie

Gebruik `agents_list` om te zien welke agent-id's momenteel zijn toegestaan voor
`sessions_spawn`. Het antwoord bevat het effectieve model van elke vermelde
agent en ingesloten runtimemetadata, zodat aanroepers onderscheid kunnen maken
tussen OpenClaw, Codex app-server en andere geconfigureerde native runtimes.

`allowAgents`-vermeldingen moeten verwijzen naar geconfigureerde agent-id's in `agents.list[]`.
`["*"]` betekent elke geconfigureerde doelagent plus de aanvrager. Als een agentconfiguratie
wordt verwijderd maar de id in `allowAgents` blijft staan, weigert `sessions_spawn` die id
en laat `agents_list` deze weg. Voer `openclaw doctor --fix` uit om verouderde
toestaanlijstvermeldingen op te schonen, of voeg een minimale `agents.list[]`-vermelding toe wanneer het doel
spawnbaar moet blijven terwijl het standaardwaarden erft.

### Automatisch archiveren

- Subagentsessies worden automatisch gearchiveerd na `agents.defaults.subagents.archiveAfterMinutes` (standaard `60`).
- Archiveren gebruikt `sessions.delete` en hernoemt het transcript naar `*.deleted.<timestamp>` (dezelfde map).
- `cleanup: "delete"` archiveert direct na aankondiging (het transcript blijft nog steeds bewaard via hernoemen).
- Automatisch archiveren is best-effort; lopende timers gaan verloren als de Gateway opnieuw start.
- Geconfigureerde runtimeouts archiveren **niet** automatisch; ze stoppen alleen de run. De sessie blijft bestaan tot automatisch archiveren.
- Automatisch archiveren geldt gelijk voor diepte-1- en diepte-2-sessies.
- Browseropruiming staat los van archiefopruiming: bijgehouden browsertabbladen/-processen worden best-effort gesloten wanneer de run is voltooid, zelfs als het transcript-/sessierecord behouden blijft.

## Geneste subagenten

Standaard kunnen subagenten hun eigen subagenten niet spawnen
(`maxSpawnDepth: 1`). Stel `maxSpawnDepth: 2` in om één niveau van
nesting in te schakelen — het **orchestratorpatroon**: hoofd → orchestrator-subagent →
worker-subsubagenten.

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

| Diepte | Vorm van sessiesleutel                      | Rol                                           | Kan spawnen?                 |
| ------ | ------------------------------------------- | --------------------------------------------- | ---------------------------- |
| 0      | `agent:<id>:main`                           | Hoofdagent                                    | Altijd                       |
| 1      | `agent:<id>:subagent:<uuid>`                | Subagent (orchestrator wanneer diepte 2 is toegestaan) | Alleen als `maxSpawnDepth >= 2` |
| 2      | `agent:<id>:subagent:<uuid>:subagent:<uuid>` | Subsubagent (leaf-worker)                    | Nooit                        |

### Aankondigingsketen

Resultaten stromen terug omhoog door de keten:

1. Worker op diepte 2 voltooit → kondigt dit aan bij zijn parent (orchestrator op diepte 1).
2. Orchestrator op diepte 1 ontvangt de aankondiging, synthetiseert resultaten, voltooit → kondigt dit aan bij main.
3. Hoofdagent ontvangt de aankondiging en levert die aan de gebruiker.

Elk niveau ziet alleen aankondigingen van zijn directe children.

<Note>
**Operationele richtlijn:** start child-werk één keer en wacht op voltooiingsgebeurtenissen in plaats van poll-lussen te bouwen rond `sessions_list`, `sessions_history`, `/subagents list` of `exec`-sleepopdrachten.
`sessions_list` en `/subagents list` houden child-session-relaties gericht op live werk — live children blijven gekoppeld, beëindigde children blijven gedurende een korte recente periode zichtbaar, en verouderde store-only child-links worden na hun versheidsvenster genegeerd. Dit voorkomt dat oude `spawnedBy`-/
`parentSessionKey`-metadata ghost children na een herstart opnieuw tot leven wekt. Als een child completion event binnenkomt nadat je het definitieve antwoord al hebt verzonden, is de juiste follow-up de exacte stille token
`NO_REPLY` / `no_reply`.
</Note>

### Toolbeleid per diepte

- Rol en controlebereik worden bij het spawnen in sessiemetadata geschreven. Zo wordt voorkomen dat vlakke of herstelde sessiesleutels per ongeluk orchestrator-rechten terugkrijgen.
- **Diepte 1 (orchestrator, wanneer `maxSpawnDepth >= 2`):** krijgt `sessions_spawn`, `subagents`, `sessions_list`, `sessions_history`, zodat deze children kan spawnen en hun status kan inspecteren. Andere sessie-/systeemtools blijven geweigerd.
- **Diepte 1 (leaf, wanneer `maxSpawnDepth == 1`):** geen sessietools (huidig standaardgedrag).
- **Diepte 2 (leaf worker):** geen sessietools — `sessions_spawn` wordt op diepte 2 altijd geweigerd. Kan geen verdere children spawnen.

### Spawnlimiet per agent

Elke agentsessie (op elke diepte) kan tegelijk maximaal `maxChildrenPerAgent`
(standaard `5`) actieve children hebben. Dit voorkomt ongecontroleerde fan-out vanuit één orchestrator.

### Cascaderend stoppen

Het stoppen van een orchestrator op diepte 1 stopt automatisch al zijn children op diepte 2:

- `/stop` in de hoofdchat stopt alle agents op diepte 1 en cascadeert naar hun children op diepte 2.

## Authenticatie

Authenticatie van subagents wordt opgelost op basis van **agent-id**, niet op basis van sessietype:

- De sessiesleutel van de subagent is `agent:<agentId>:subagent:<uuid>`.
- De auth-store wordt geladen vanuit de `agentDir` van die agent.
- De auth-profielen van de hoofdagent worden samengevoegd als **fallback**; agentprofielen overschrijven hoofdprofielen bij conflicten.

De samenvoeging is additief, dus hoofdprofielen zijn altijd beschikbaar als fallbacks. Volledig geïsoleerde authenticatie per agent wordt nog niet ondersteund.

## Aankondiging

Subagents rapporteren terug via een aankondigingsstap:

- De aankondigingsstap draait binnen de subagent-sessie (niet de requester-sessie).
- Als de subagent exact `ANNOUNCE_SKIP` antwoordt, wordt er niets geplaatst.
- Als de nieuwste assistenttekst de exacte stille token `NO_REPLY` / `no_reply` is, wordt aankondigingsuitvoer onderdrukt, zelfs als er eerder zichtbare voortgang bestond.

Levering hangt af van de diepte van de requester:

- Top-level requester-sessies gebruiken een follow-up `agent`-aanroep met externe levering (`deliver=true`).
- Geneste requester-subagent-sessies ontvangen een interne follow-up-injectie (`deliver=false`), zodat de orchestrator child-resultaten in de sessie kan synthetiseren.
- Als een geneste requester-subagent-sessie verdwenen is, valt OpenClaw terug op de requester van die sessie wanneer die beschikbaar is.

Voor top-level requester-sessies lost directe levering in completion-modus eerst een gebonden conversation-/threadroute en hook-override op, en vult daarna ontbrekende channel-target-velden aan vanuit de opgeslagen route van de requester-sessie. Zo blijven completions in de juiste chat/topic, zelfs wanneer de oorsprong van de completion alleen het channel identificeert.

Aggregatie van child-completions wordt bij het bouwen van geneste completion-findings beperkt tot de huidige requester-run, zodat verouderde child-uitvoer uit eerdere runs niet in de huidige aankondiging lekt. Aankondigingsantwoorden behouden thread-/topicrouting wanneer die beschikbaar is op channel-adapters.

### Aankondigingscontext

Aankondigingscontext wordt genormaliseerd naar een stabiel intern eventblok:

| Veld           | Bron                                                                                                                   |
| -------------- | ---------------------------------------------------------------------------------------------------------------------- |
| Bron           | `subagent` of `cron`                                                                                                   |
| Sessie-id's    | Child-sessiesleutel/id                                                                                                 |
| Type           | Aankondigingstype + taaklabel                                                                                          |
| Status         | Afgeleid van runtime-uitkomst (`success`, `error`, `timeout` of `unknown`) — **niet** afgeleid uit modeltekst          |
| Resultaatinhoud | Nieuwste zichtbare assistenttekst van de child                                                                        |
| Follow-up      | Instructie die beschrijft wanneer te antwoorden versus stil te blijven                                                 |

Terminal failed runs rapporteren foutstatus zonder vastgelegde antwoordtekst opnieuw af te spelen. Tool-/toolResult-uitvoer wordt niet gepromoveerd naar child-resultaattekst.

### Statistiekregel

Aankondigingspayloads bevatten aan het einde een statistiekregel (ook wanneer ingepakt):

- Runtime (bijv. `runtime 5m12s`).
- Tokengebruik (input/output/totaal).
- Geschatte kosten wanneer modelprijzen zijn geconfigureerd (`models.providers.*.models[].cost`).
- `sessionKey`, `sessionId` en transcriptpad, zodat de hoofdagent geschiedenis kan ophalen via `sessions_history` of het bestand op schijf kan inspecteren.

Interne metadata is alleen bedoeld voor orchestratie; gebruikersgerichte antwoorden moeten worden herschreven in een normale assistentstem.

### Waarom `sessions_history` de voorkeur heeft

`sessions_history` is het veiligere orchestratiepad:

- Assistentherinnering wordt eerst genormaliseerd: thinking-tags gestript; `<relevant-memories>`- / `<relevant_memories>`-scaffolding gestript; plain-text tool-call XML-payloadblokken (`<tool_call>`, `<function_call>`, `<tool_calls>`, `<function_calls>`) gestript, inclusief afgekorte payloads die nooit netjes sluiten; gedegradeerde tool-call-/result-scaffolding en historical-context-markers gestript; gelekte modelcontroletokens (`<|assistant|>`, andere ASCII `<|...|>`, full-width `<｜...｜>`) gestript; misvormde MiniMax tool-call XML gestript.
- Tekst die op credentials/tokens lijkt, wordt geredigeerd.
- Lange blokken kunnen worden afgekapt.
- Zeer grote geschiedenissen kunnen oudere rijen laten vallen of een te grote rij vervangen door `[sessions_history omitted: message too large]`.
- Gebruik `nextOffset` wanneer aanwezig om achteruit door oudere transcriptvensters te bladeren.
- Inspectie van het ruwe transcript op schijf is de fallback wanneer je het volledige byte-voor-byte-transcript nodig hebt.

## Toolbeleid

Subagents gebruiken eerst dezelfde profiel- en tool-policy-pipeline als de parent of doelagent. Daarna past OpenClaw de restrictielaag voor subagents toe.

Zonder beperkend `tools.profile` krijgen subagents **alle tools behalve de message-tool, sessietools en systeemtools**:

- `sessions_list`
- `sessions_history`
- `sessions_send`
- `sessions_spawn`
- `message`

`sessions_history` blijft ook hier een begrensde, gesanitiseerde recall-weergave — het is geen ruwe transcriptdump.

Wanneer `maxSpawnDepth >= 2`, krijgen orchestrator-subagents op diepte 1 daarnaast `sessions_spawn`, `subagents`, `sessions_list` en
`sessions_history`, zodat ze hun children kunnen beheren.

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

`tools.subagents.tools.allow` is een definitief allow-only-filter. Het kan de al opgeloste toolset beperken, maar het kan geen tool **terug toevoegen** die door `tools.profile` is verwijderd. Bijvoorbeeld: `tools.profile: "coding"` bevat
`web_search`/`web_fetch`, maar niet de `browser`-tool. Om subagents met coding-profiel browserautomatisering te laten gebruiken, voeg je browser toe in de profielfase:

```json5
{
  tools: {
    profile: "coding",
    alsoAllow: ["browser"],
  },
}
```

Gebruik per-agent `agents.list[].tools.alsoAllow: ["browser"]` wanneer slechts één agent browserautomatisering moet krijgen.

## Concurrency

Subagents gebruiken een dedicated in-process queue-lane:

- **Lanenaam:** `subagent`
- **Concurrency:** `agents.defaults.subagents.maxConcurrent` (standaard `8`)

## Liveness en herstel

OpenClaw behandelt het ontbreken van `endedAt` niet als permanent bewijs dat een subagent nog actief is. Niet-beëindigde runs ouder dan het stale-run-venster tellen niet meer als actief/in behandeling in `/subagents list`, statusoverzichten, gating voor descendant-completion en concurrencycontroles per sessie.

Na een gateway-herstart worden verouderde niet-beëindigde herstelde runs opgeschoond, tenzij hun child-sessie is gemarkeerd als `abortedLastRun: true`. Die door herstart afgebroken child-sessies blijven herstelbaar via de orphan recovery flow voor subagents, die een synthetisch resume-bericht verzendt voordat de aborted-marker wordt gewist.

Automatisch herstel na herstart is per child-sessie begrensd. Als dezelfde subagent-child herhaaldelijk binnen het snelle re-wedge-venster voor orphan recovery wordt geaccepteerd, bewaart OpenClaw een recovery-tombstone op die sessie en stopt het met automatisch hervatten bij latere herstarts. Voer
`openclaw tasks maintenance --apply` uit om het taakrecord te reconciliëren, of
`openclaw doctor --fix` om verouderde aborted recovery-flags op tombstoned sessies te wissen.

<Note>
Als het spawnen van een subagent mislukt met Gateway `PAIRING_REQUIRED` /
`scope-upgrade`, controleer dan de RPC-caller voordat je pairing-state wijzigt.
Interne `sessions_spawn`-coördinatie dispatcht in-process wanneer de caller al binnen de gateway-requestcontext draait, dus opent geen loopback-WebSocket en is niet afhankelijk van de paired-device-scope-baseline van de CLI. Callers buiten het gatewayproces gebruiken nog steeds de WebSocket-fallback als `client.id: "gateway-client"` met `client.mode: "backend"`
via directe loopback shared-token-/password-auth. Externe callers, expliciete
`deviceIdentity`, expliciete device-token-paden en browser-/node-clients hebben nog steeds normale device approval nodig voor scope-upgrades.
</Note>

## Stoppen

- Het verzenden van `/stop` in de requester-chat breekt de requester-sessie af en stopt alle actieve subagent-runs die daaruit zijn gespawnd, met cascade naar geneste children.

## Beperkingen

- Subagent-aankondiging is **best-effort**. Als de gateway herstart, gaat in behandeling zijnd "announce back"-werk verloren.
- Subagents delen nog steeds dezelfde gatewayprocesresources; behandel `maxConcurrent` als een veiligheidsventiel.
- `sessions_spawn` is altijd non-blocking: het retourneert onmiddellijk `{ status: "accepted", runId, childSessionKey }`.
- Subagent-context injecteert alleen `AGENTS.md` en `TOOLS.md` (geen `SOUL.md`, `IDENTITY.md`, `USER.md`, `MEMORY.md`, `HEARTBEAT.md` of `BOOTSTRAP.md`). Codex-native subagents volgen dezelfde grens: `TOOLS.md` blijft in geërfde Codex-threadinstructies, terwijl parent-only persona-, identity- en user-bestanden als turn-scoped samenwerkinginstructies worden geïnjecteerd, zodat children ze niet klonen.
- Maximale nestingdiepte is 5 (`maxSpawnDepth`-bereik: 1–5). Diepte 2 wordt aanbevolen voor de meeste use-cases.
- `maxChildrenPerAgent` begrenst actieve children per sessie (standaard `5`, bereik `1–20`).

## Gerelateerd

- [ACP-agents](/nl/tools/acp-agents)
- [Agent send](/nl/tools/agent-send)
- [Achtergrondtaken](/nl/automation/tasks)
- [Multi-agent sandbox-tools](/nl/tools/multi-agent-sandbox-tools)
