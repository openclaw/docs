---
read_when:
    - Je wilt achtergrondwerk of parallel werk via de agent
    - Je wijzigt het beleid voor sessions_spawn of de sub-agenttool
    - Je implementeert of lost problemen op met threadgebonden subagentsessies
sidebarTitle: Sub-agents
summary: Start geïsoleerde agentruns op de achtergrond die de resultaten terugmelden in de chat van de aanvrager
title: Subagenten
x-i18n:
    generated_at: "2026-07-16T16:37:11Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 8c670d5c7f92d5be8ebce7b1140d9bfd7956b10f38144d275ec84c6af98ae04b
    source_path: tools/subagents.md
    workflow: 16
---

Sub-agents zijn agentruns op de achtergrond die vanuit een bestaande agentrun worden gestart.
Elke sub-agent draait in een eigen sessie (`agent:<agentId>:subagent:<uuid>`) en
**kondigt** na voltooiing het resultaat aan in het chatkanaal van de aanvrager.
Elke sub-agentrun wordt bijgehouden als een [achtergrondtaak](/nl/automation/tasks).

Doelen:

- Onderzoek, langdurige taken en traag toolwerk parallel uitvoeren zonder de hoofdrun te blokkeren.
- Sub-agents standaard geïsoleerd houden (gescheiden sessies, optionele sandboxing).
- Zorgen dat de toolset moeilijk verkeerd te gebruiken is: sub-agents krijgen standaard **geen** sessie- of berichttools.
- Configureerbare nestingsdiepte voor orkestratiepatronen ondersteunen.

<Note>
**Opmerking over kosten:** elke sub-agent heeft standaard een eigen context en
tokengebruik. Stel voor zware of repetitieve taken een goedkoper model in voor sub-agents
en behoud voor je hoofdagent een model van hogere kwaliteit via
`agents.defaults.subagents.model` of overrides per agent. Wanneer een onderliggende agent
de huidige transcriptie van de aanvrager echt nodig heeft, start je deze met
`context: "fork"`. Aan threads gebonden sub-agentsessies gebruiken standaard
`context: "fork"`, omdat ze het huidige gesprek vertakken naar een
vervolgthread.
</Note>

## Slash-opdracht

`/subagents` inspecteert sub-agentruns voor de **huidige sessie**:

```text
/subagents list
/subagents log <id|#> [limit] [tools]
/subagents info <id|#>
```

`/subagents info` toont metadata van de run (status, tijdstempels, sessie-id,
transcriptiepad, opschoning). `/subagents log` toont recente chatbeurten voor een
run; voeg het token `tools` toe om berichten voor toolaanroepen en -resultaten op te nemen (standaard
weggelaten). Gebruik `sessions_history` voor een begrensde, op veiligheid gefilterde weergave
vanuit een agentbeurt, of inspecteer het transcriptiepad op schijf voor
de onbewerkte volledige transcriptie.

In de Control UI hebben bovenliggende sessies met recente onderliggende runs een uitvouwbare
zijbalkrij. De geneste rijen tonen de status en looptijd van onderliggende agents, en wanneer je er een selecteert,
wordt de chat van die onderliggende agent geopend met behoud van de bovenliggende hiërarchie.

### Besturing voor threadbinding

Deze opdrachten werken op kanalen met persistente threadbindingen. Zie
[Kanalen die threads ondersteunen](#thread-supporting-channels) hieronder.

```text
/focus <subagent-label|session-key|session-id|session-label>
/unfocus
/agents
/session idle <duration|off>
/session max-age <duration|off>
```

### Startgedrag

Agents starten sub-agents op de achtergrond met de tool `sessions_spawn`.
Voltooiingen worden als interne gebeurtenissen in de bovenliggende sessie teruggestuurd; de bovenliggende/aanvragende
agent beslist of een zichtbare update voor de gebruiker nodig is.

<AccordionGroup>
  <Accordion title="Niet-blokkerende, pushgebaseerde voltooiing">
    - `sessions_spawn` is niet-blokkerend; deze retourneert onmiddellijk een run-id.
    - Na voltooiing rapporteert de sub-agent terug aan de bovenliggende/aanvragende sessie.
    - Agentbeurten die resultaten van onderliggende agents nodig hebben, moeten na het starten van het vereiste werk `sessions_yield` aanroepen. Hiermee eindigt de huidige beurt en kan de voltooiingsgebeurtenis als het volgende voor het model zichtbare bericht binnenkomen.
    - De voltooiing is pushgebaseerd. Voer na het starten **niet** herhaaldelijk `/subagents list`, `sessions_list` of `sessions_history` uit om alleen maar te wachten tot de run klaar is; controleer de status uitsluitend op aanvraag tijdens foutopsporing.
    - De uitvoer van de onderliggende agent is een rapport/bewijsstuk dat de aanvragende agent moet samenvoegen. Het is geen door de gebruiker geschreven instructietekst en kan systeem-, ontwikkelaars- of gebruikersbeleid niet overschrijven.
    - Na voltooiing sluit OpenClaw naar beste vermogen bijgehouden browsertabbladen/-processen die door die sub-agentsessie zijn geopend, voordat de opschoningsstroom voor de aankondiging doorgaat.

  </Accordion>
  <Accordion title="Levering van voltooiingen">
    - OpenClaw geeft voltooiingen terug aan de aanvragende sessie via een `agent`-beurt met een stabiele idempotentiesleutel.
    - Als de aanvragende run nog actief is, probeert OpenClaw die run eerst te activeren/bijsturen in plaats van een tweede zichtbaar antwoordpad te starten.
    - Als een actieve aanvrager niet kan worden geactiveerd, valt OpenClaw terug op een overdracht aan de aanvragende agent met dezelfde voltooiingscontext, in plaats van de aankondiging te laten vallen.
    - Een geslaagde overdracht aan de bovenliggende agent voltooit de levering van de sub-agent, zelfs wanneer de bovenliggende agent beslist dat geen zichtbare update voor de gebruiker nodig is.
    - Native sub-agents krijgen de berichttool niet. Ze retourneren gewone assistenttekst aan de bovenliggende/aanvragende agent; voor mensen zichtbare antwoorden blijven onder het normale leveringsbeleid van de bovenliggende/aanvragende agent vallen.
    - Als directe overdracht niet kan worden gebruikt, valt de levering terug op routering via de wachtrij en vervolgens op een korte nieuwe poging van de aankondiging met exponentiële vertraging, voordat definitief wordt opgegeven.
    - De levering behoudt de vastgestelde route van de aanvrager: aan een thread of gesprek gebonden voltooiingsroutes krijgen voorrang wanneer ze beschikbaar zijn. Als de oorsprong van de voltooiing alleen een kanaal opgeeft, vult OpenClaw het ontbrekende doel/account in vanuit de vastgestelde route van de aanvragende sessie (`lastChannel` / `lastTo` / `lastAccountId`), zodat directe levering blijft werken.

  </Accordion>
  <Accordion title="Metadata voor voltooiingsoverdracht">
    De voltooiingsoverdracht aan de aanvragende sessie is tijdens runtime gegenereerde
    interne context (geen door de gebruiker geschreven tekst) en bevat:

    - `Result` — de meest recente zichtbare `assistant`-antwoordtekst van de onderliggende agent. Tool-/toolResult-uitvoer wordt niet opgenomen in resultaten van onderliggende agents. Definitief mislukte runs gebruiken vastgelegde antwoordtekst niet opnieuw.
    - `Status` — `completed; ready for parent review` / `failed` / `timed out` / `unknown`.
    - Compacte statistieken over runtime/tokens.
    - Een beoordelingsinstructie die de aanvragende agent opdraagt het resultaat te verifiëren voordat deze beslist of de oorspronkelijke taak is voltooid.
    - Vervolgrichtlijnen die de aanvragende agent opdragen de taak voort te zetten of een vervolgactie vast te leggen wanneer het resultaat van de onderliggende agent verdere actie vereist.
    - Een instructie voor de definitieve update voor het pad zonder verdere acties, geschreven in de normale stem van de assistent zonder onbewerkte interne metadata door te sturen.

  </Accordion>
  <Accordion title="Modi en ACP-runtime">
    - `--model` en `--thinking` overschrijven de standaardwaarden voor die specifieke run.
    - Gebruik `info`/`log` om na voltooiing details en uitvoer te inspecteren.
    - Gebruik voor persistente, aan threads gebonden sessies `sessions_spawn` met `thread: true` en `mode: "session"`.
    - Als het kanaal van de aanvrager geen threadbindingen ondersteunt, gebruik je `mode: "run"` in plaats van een onmogelijke aan een thread gebonden combinatie opnieuw te proberen.
    - Gebruik voor ACP-harnesssessies (Claude Code, Gemini CLI, OpenCode of expliciete Codex ACP/acpx) `sessions_spawn` met `runtime: "acp"` wanneer de tool aangeeft die runtime te ondersteunen. Zie [ACP-leveringsmodel](/nl/tools/acp-agents#delivery-model) bij het opsporen van fouten in voltooiingen of lussen tussen agents. Wanneer de Plugin `codex` is ingeschakeld, moet de besturing van Codex-chats/-threads de voorkeur geven aan `/codex ...` boven ACP, tenzij de gebruiker expliciet om ACP/acpx vraagt.
    - OpenClaw verbergt `runtime: "acp"` totdat ACP is ingeschakeld, de aanvrager niet in een sandbox draait en een backend-Plugin zoals `acpx` is geladen. `runtime: "acp"` verwacht een externe ACP-harness-id of een `agents.list[]`-vermelding met `runtime.type="acp"`; gebruik de standaardruntime voor sub-agents voor normale OpenClaw-configuratieagents uit `agents_list`.

  </Accordion>
</AccordionGroup>

## Contextmodi

Native sub-agents starten geïsoleerd, tenzij de aanroeper expliciet vraagt om de
huidige transcriptie te vertakken.

| Modus       | Wanneer te gebruiken                                                                                                                         | Gedrag                                                                          |
| ---------- | -------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------- |
| `isolated` | Nieuw onderzoek, onafhankelijke implementatie, traag toolwerk of alles wat in de taaktekst kan worden toegelicht                           | Maakt een schone transcriptie voor de onderliggende agent. Dit is de standaard en houdt het tokengebruik lager.  |
| `fork`     | Werk dat afhankelijk is van het huidige gesprek, eerdere toolresultaten of genuanceerde instructies die al in de transcriptie van de aanvrager staan | Vertakt de transcriptie van de aanvrager naar de sessie van de onderliggende agent voordat deze start. |

Gebruik `fork` spaarzaam. Het is bedoeld voor contextgevoelige delegatie, niet als
vervanging voor het schrijven van een duidelijke taakprompt.

## Tool: `sessions_spawn`

Start een sub-agentrun met `deliver: false` op de globale `subagent`-lane,
voert vervolgens een aankondigingsstap uit en plaatst het aankondigingsantwoord in het
chatkanaal van de aanvrager.

De beschikbaarheid hangt af van het effectieve toolbeleid van de aanroeper. Het ingebouwde
`coding`-profiel bevat `sessions_spawn`; `messaging` en `minimal`
bevatten dit niet. `full` staat elke tool toe. Voeg `tools.alsoAllow: ["sessions_spawn",
"sessions_yield", "subagents"]` toe of gebruik `tools.profile: "coding"` voor
agents met een beperkter profiel die toch werk moeten kunnen delegeren.
Beleid voor kanaal/groep, provider, sandbox en toestaan/weigeren per agent kan
de tool na de profielfase nog steeds verwijderen. Gebruik `/tools` vanuit dezelfde
sessie om de effectieve lijst met tools te bevestigen.

**Standaardwaarden:**

- **Model:** native sub-agents nemen het model van de aanroeper over, tenzij je `agents.defaults.subagents.model` instelt (of `agents.list[].subagents.model` per agent). Spawns van de ACP-runtime gebruiken hetzelfde geconfigureerde sub-agentmodel wanneer dit aanwezig is; anders behoudt de ACP-harness zijn eigen standaardwaarde. Een expliciete `sessions_spawn.model` heeft nog steeds voorrang.
- **Redeneren:** native sub-agents nemen de instelling van de aanroeper over, tenzij je `agents.defaults.subagents.thinking` instelt (of `agents.list[].subagents.thinking` per agent). Spawns van de ACP-runtime passen ook `agents.defaults.models["provider/model"].params.thinking` toe voor het geselecteerde model. Een expliciete `sessions_spawn.thinking` heeft nog steeds voorrang.
- **Time-out van run:** OpenClaw gebruikt `agents.defaults.subagents.runTimeoutSeconds` wanneer dit is ingesteld; anders valt het terug op `0` (geen time-out). `sessions_spawn` accepteert geen time-outoverschrijvingen per aanroep.
- **Taaklevering:** native sub-agents ontvangen de gedelegeerde taak in hun eerste zichtbare `[Subagent Task]`-bericht. De systeemprompt van de sub-agent bevat runtimeregels en routeringscontext, geen verborgen duplicaat van de taak.

Geaccepteerde spawns van native sub-agents bevatten de vastgestelde modelmetadata van de onderliggende agent
in het toolresultaat: `resolvedModel` bevat de toegepaste modelreferentie en
`resolvedProvider` bevat het providerprefix wanneer de referentie er een heeft.

### Modus voor delegatieprompt

`agents.defaults.subagents.delegationMode` bepaalt alleen de promptrichtlijnen; dit wijzigt het toolbeleid niet en dwingt delegatie niet af.

- `suggest` (standaard): behoud de standaardaanwijzing in de prompt om sub-agents te gebruiken voor groter of trager werk.
- `prefer`: draag de hoofdagent op responsief te blijven en alles wat uitgebreider is dan een direct antwoord via `sessions_spawn` te delegeren.

Override per agent: `agents.list[].subagents.delegationMode`.

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
  Optionele stabiele naam om een specifiek kind later in statusuitvoer te identificeren. Moet overeenkomen met `[a-z][a-z0-9_-]{0,63}` en mag geen gereserveerd doel zijn, zoals `last` of `all`.
</ParamField>
<ParamField path="label" type="string">
  Optioneel voor mensen leesbaar label.
</ParamField>
<ParamField path="agentId" type="string">
  Start onder een andere geconfigureerde agent-id wanneer dit is toegestaan door `subagents.allowAgents`.
</ParamField>
<ParamField path="cwd" type="string">
  Optionele werkmap voor de taak van de kinduitvoering. Native subagenten laden bootstrapbestanden nog steeds vanuit de werkruimte van de doelagent; `cwd` wijzigt alleen waar runtime-tools en CLI-harnassen het gedelegeerde werk uitvoeren.
</ParamField>
<ParamField path="runtime" type='"subagent" | "acp"' default="subagent">
  `acp` is alleen bedoeld voor externe ACP-harnassen (`claude`, `droid`, `gemini`, `opencode` of expliciet aangevraagde Codex ACP/acpx) en voor `agents.list[]`-vermeldingen waarvan `runtime.type` gelijk is aan `acp`.
</ParamField>
<ParamField path="resumeSessionId" type="string">
  Alleen voor ACP. Hervat een bestaande ACP-harnassessie wanneer `runtime: "acp"`; wordt genegeerd voor het starten van native subagenten.
</ParamField>
<ParamField path="streamTo" type='"parent"'>
  Alleen voor ACP. Streamt de uitvoer van de ACP-uitvoering naar de bovenliggende sessie wanneer `runtime: "acp"`; laat weg voor het starten van native subagenten.
</ParamField>
<ParamField path="model" type="string">
  Overschrijf het model van de subagent. Ongeldige waarden worden overgeslagen en de subagent wordt uitgevoerd met het standaardmodel, met een waarschuwing in het toolresultaat.
</ParamField>
<ParamField path="thinking" type="string">
  Overschrijf het denkniveau voor de uitvoering van de subagent.
</ParamField>
<ParamField path="thread" type="boolean" default="false">
  Wanneer `true`, wordt threadkoppeling voor deze subagentsessie aangevraagd.
</ParamField>
<ParamField path="mode" type='"run" | "session"' default="run">
  Als `thread: true` en `mode` is weggelaten, wordt de standaardwaarde `session`. `mode: "session"` vereist `thread: true`.
  Als threadkoppeling niet beschikbaar is voor het kanaal van de aanvrager, gebruik dan in plaats daarvan `mode: "run"`.
</ParamField>
<ParamField path="cleanup" type='"delete" | "keep"' default="keep">
  `"delete"` archiveert de sessie onmiddellijk na de aankondiging (het transcript blijft behouden via hernoemen).
</ParamField>
<ParamField path="sandbox" type='"inherit" | "require"' default="inherit">
  `require` weigert het starten tenzij de doelruntime van het kind in een sandbox wordt uitgevoerd.
</ParamField>
<ParamField path="context" type='"isolated" | "fork"' default="isolated">
  `fork` vertakt het huidige transcript van de aanvrager naar de kindsessie. Alleen voor native subagenten. Aan threads gekoppelde starts gebruiken standaard `fork`; starts zonder thread gebruiken standaard `isolated`.
</ParamField>

<Warning>
`sessions_spawn` accepteert **geen** parameters voor kanaalbezorging (`target`,
`channel`, `to`, `threadId`, `replyTo`, `transport`). Native subagenten rapporteren
hun meest recente assistentbeurt terug aan de aanvrager; externe bezorging blijft de
verantwoordelijkheid van de bovenliggende/aanvragende agent.
</Warning>

### Taaknamen en doelen

`taskName` is een modelgerichte naam voor orkestratie, geen sessiesleutel.
Gebruik deze voor stabiele kindnamen zoals `review_subagents`,
`linux_validation` of `docs_update` wanneer een coördinator dat kind
later mogelijk moet inspecteren.

Doelresolutie accepteert exacte overeenkomsten met `taskName` en eenduidige
voorvoegsels. Overeenkomsten zijn beperkt tot hetzelfde actieve/recente doelvenster dat
wordt gebruikt door genummerde `/subagents`-doelen, zodat een verouderd voltooid kind
een hergebruikte naam niet dubbelzinnig maakt. Als twee actieve of recente kinderen dezelfde
`taskName` delen, is het doel dubbelzinnig; gebruik dan de lijstindex, sessiesleutel of
uitvoerings-id.

De gereserveerde doelen `last` en `all` zijn geen geldige `taskName`-waarden,
omdat ze al een besturingsbetekenis hebben.

## Tool: `sessions_yield`

Beëindigt de huidige modelbeurt en wacht tot runtimegebeurtenissen, voornamelijk
voltooiingsgebeurtenissen van subagenten, als het volgende bericht binnenkomen. Gebruik dit na
het starten van vereist kindwerk wanneer de aanvrager geen definitief
antwoord kan geven totdat deze voltooiingen zijn binnengekomen.

`sessions_yield` is het wachtmechanisme. Vervang dit niet door pollinglussen
over `subagents`, `sessions_list`, `sessions_history`, shell-
`sleep` of procespolling alleen om te detecteren dat een kind is voltooid.

Gebruik `sessions_yield` alleen wanneer de effectieve toollijst van de sessie
deze bevat. Sommige minimale of aangepaste toolprofielen kunnen `sessions_spawn` en
`subagents` beschikbaar stellen zonder `sessions_yield`; verzin in dat geval geen
pollinglus alleen om op voltooiing te wachten.

Wanneer er actieve kinderen bestaan, voegt OpenClaw een compact, door de runtime gegenereerd
`Active Subagents`-promptblok toe aan normale beurten, zodat de aanvrager
de huidige kindsessies, uitvoerings-id's, statussen, labels, taken en
`taskName`-aliassen kan zien zonder polling. De taak- en labelvelden in dat
blok worden als gegevens aangehaald, niet als instructies, omdat ze afkomstig kunnen zijn
uit door de gebruiker of het model opgegeven startargumenten.

## Tool: `subagents`

Geeft een overzicht van gestarte subagentuitvoeringen die eigendom zijn van de aanvragende sessie. Het bereik is
beperkt tot de huidige aanvrager; een kind kan alleen zijn eigen beheerde kinderen zien.

Gebruik `subagents` voor status en foutopsporing op aanvraag. Gebruik `sessions_yield` om
op voltooiingsgebeurtenissen te wachten.

## Aan threads gekoppelde sessies

Wanneer threadkoppelingen voor een kanaal zijn ingeschakeld, kan een subagent gekoppeld blijven
aan een thread, zodat vervolgberichten van gebruikers in die thread naar dezelfde
subagentsessie blijven worden gerouteerd.

### Kanalen met threadondersteuning

Een kanaal ondersteunt permanente, aan threads gekoppelde subagentsessies
(`sessions_spawn` met `thread: true`) wanneer het een adapter voor gesprekskoppeling
registreert. Meegeleverde kanalen met deze ondersteuning: **Discord**,
**iMessage**, **Matrix** en **Telegram**. Discord en Matrix maken standaard
een kindthread aan; Telegram en iMessage koppelen standaard het
huidige gesprek. Gebruik de kanaalspecifieke `threadBindings`-configuratiesleutels voor
inschakeling, time-outs en `spawnSessions`.

### Snel proces

<Steps>
  <Step title="Starten">
    `sessions_spawn` met `thread: true` (en optioneel `mode: "session"`).
  </Step>
  <Step title="Koppelen">
    OpenClaw maakt een thread aan of koppelt er een aan dat sessiedoel in het actieve kanaal.
  </Step>
  <Step title="Vervolgberichten routeren">
    Antwoorden en vervolgberichten in die thread worden naar de gekoppelde sessie gerouteerd.
  </Step>
  <Step title="Time-outs inspecteren">
    Gebruik `/session idle` om automatisch opheffen van focus na inactiviteit te inspecteren/bij te werken en
    `/session max-age` om de harde limiet te beheren.
  </Step>
  <Step title="Ontkoppelen">
    Gebruik `/unfocus` om handmatig te ontkoppelen.
  </Step>
</Steps>

### Handmatige besturing

| Opdracht            | Effect                                                                                    |
| ------------------ | ----------------------------------------------------------------------------------------- |
| `/focus <target>`  | Koppel de huidige thread (of maak er een aan) aan een subagent-/sessiedoel                |
| `/unfocus`         | Verwijder de koppeling voor de huidige gekoppelde thread                                  |
| `/agents`          | Geef actieve uitvoeringen en koppelingsstatus weer (`binding:<id>`, `unbound` of `bindings unavailable`) |
| `/session idle`    | Inspecteer/wijzig automatisch opheffen van focus bij inactiviteit (alleen gekoppelde threads met focus) |
| `/session max-age` | Inspecteer/wijzig de harde limiet (alleen gekoppelde threads met focus)                   |

### Configuratieschakelaars

- **Algemene standaardwaarde:** `session.threadBindings.enabled`, `session.threadBindings.idleHours`, `session.threadBindings.maxAgeHours`.
- **Kanaaloverschrijving en sleutels voor automatisch koppelen bij starten** zijn adapterspecifiek. Zie [Kanalen met threadondersteuning](#thread-supporting-channels) hierboven.

Zie [Configuratiereferentie](/nl/gateway/configuration-reference) en
[Slash-opdrachten](/nl/tools/slash-commands) voor actuele adapterdetails.

### Toegestane lijst

<ParamField path="agents.list[].subagents.allowAgents" type="string[]">
  Lijst met geconfigureerde agent-id's die via expliciete `agentId` als doel kunnen worden gebruikt (`["*"]` staat elk geconfigureerd doel toe). Standaard: alleen de aanvragende agent. Als je een lijst instelt en nog steeds wilt dat de aanvrager zichzelf start met `agentId`, neem dan de id van de aanvrager op in de lijst.
</ParamField>
<ParamField path="agents.defaults.subagents.allowAgents" type="string[]">
  Standaard toegestane lijst met geconfigureerde doelagenten die wordt gebruikt wanneer de aanvragende agent geen eigen `subagents.allowAgents` instelt.
</ParamField>
<ParamField path="agents.defaults.subagents.requireAgentId" type="boolean" default="false">
  Blokkeer `sessions_spawn`-aanroepen die `agentId` weglaten (dwingt expliciete profielselectie af). Overschrijving per agent: `agents.list[].subagents.requireAgentId`.
</ParamField>
<ParamField path="agents.defaults.subagents.announceTimeoutMs" type="number" default="120000">
  Time-out per aanroep voor Gateway-pogingen tot bezorging van `agent`-aankondigingen. Waarden zijn positieve gehele aantallen milliseconden en worden begrensd op het platformveilige timermaximum. Tijdelijke nieuwe pogingen kunnen de totale wachttijd voor aankondigingen langer maken dan één geconfigureerde time-out.
</ParamField>

Als de aanvragende sessie in een sandbox wordt uitgevoerd, weigert `sessions_spawn` doelen
die zonder sandbox zouden worden uitgevoerd.

### Detectie

Gebruik `agents_list` om te zien welke agent-id's momenteel zijn toegestaan voor
`sessions_spawn`. Het antwoord bevat het effectieve
model en ingesloten runtimemetadata van elke vermelde agent, zodat aanroepers onderscheid kunnen maken tussen OpenClaw, Codex
app-server en andere geconfigureerde native runtimes.

`allowAgents`-vermeldingen moeten verwijzen naar geconfigureerde agent-id's in `agents.list[]`.
`["*"]` betekent elke geconfigureerde doelagent plus de aanvrager. Als een agentconfiguratie
wordt verwijderd maar de id ervan in `allowAgents` blijft staan, weigert `sessions_spawn` die id
en laat `agents_list` deze weg. Voer `openclaw doctor --fix` uit om verouderde
vermeldingen uit de toegestane lijst op te schonen, of voeg een minimale `agents.list[]`-vermelding toe wanneer het doel
beschikbaar moet blijven om te starten en daarbij standaardwaarden moet overnemen.

### Automatisch archiveren

- Subagentsessies worden automatisch gearchiveerd na `agents.defaults.subagents.archiveAfterMinutes` (standaard `60`).
- Bij archivering wordt `sessions.delete` gebruikt en wordt het transcript hernoemd naar `*.deleted.<timestamp>` (dezelfde map).
- `cleanup: "delete"` archiveert onmiddellijk na de aankondiging (het transcript blijft behouden via hernoemen).
- Automatisch archiveren gebeurt naar beste vermogen; wachtende timers gaan verloren als de Gateway opnieuw wordt gestart.
- Geconfigureerde uitvoeringstime-outs archiveren **niet** automatisch; ze stoppen alleen de uitvoering. De sessie blijft bestaan tot automatische archivering.
- Automatisch archiveren geldt in gelijke mate voor sessies op diepte 1 en diepte 2.
- Browseropschoning staat los van archiveringsopschoning: bijgehouden browsertabbladen/-processen worden naar beste vermogen gesloten wanneer de uitvoering is voltooid, zelfs als het transcript/de sessieregistratie wordt behouden.

## Geneste subagenten

Subagenten kunnen standaard niet hun eigen subagenten starten
(`maxSpawnDepth: 1`). Stel `maxSpawnDepth: 2` in om één niveau
van nesting in te schakelen — het **orkestratorpatroon**: hoofdagent → orkestrator-subagent →
werker-subsubagenten.

```json5
{
  agents: {
    defaults: {
      subagents: {
        maxSpawnDepth: 2, // sta toe dat subagenten kinderen starten (standaard: 1, bereik 1-5)
        maxChildrenPerAgent: 5, // maximaal aantal actieve kinderen per agentsessie (standaard: 5, bereik 1-20)
        maxConcurrent: 8, // algemene limiet voor gelijktijdige uitvoeringen (standaard: 8)
        runTimeoutSeconds: 900, // standaardtime-out voor sessions_spawn (0 = geen time-out)
        announceTimeoutMs: 120000, // Gateway-time-out per aanroep voor aankondigingen
      },
    },
  },
}
```

### Diepteniveaus

| Diepte | Vorm van sessiesleutel                         | Rol                                           | Kan starten?                  |
| ------ | --------------------------------------------- | --------------------------------------------- | ----------------------------- |
| 0      | `agent:<id>:main`                           | Hoofdagent                                    | Altijd                        |
| 1      | `agent:<id>:subagent:<uuid>`                           | Subagent (orchestrator wanneer diepte 2 is toegestaan) | Alleen als `maxSpawnDepth >= 2` |
| 2      | `agent:<id>:subagent:<uuid>:subagent:<uuid>`                           | Sub-subagent (eindwerker)                     | Nooit                         |

### Aankondigingsketen

Resultaten stromen terug omhoog door de keten:

1. Werker op diepte 2 is klaar → kondigt dit aan bij de bovenliggende agent (orchestrator op diepte 1).
2. Orchestrator op diepte 1 ontvangt de aankondiging, voegt de resultaten samen, rondt af → kondigt dit aan bij de hoofdagent.
3. Hoofdagent ontvangt de aankondiging en levert deze aan de gebruiker.

Elk niveau ziet alleen aankondigingen van zijn directe kinderen.

<Note>
**Operationele richtlijn:** start onderliggend werk één keer en wacht op voltooiingsgebeurtenissen in plaats van pollinglussen te bouwen rond `sessions_list`-, `sessions_history`-, `/subagents list`- of `exec`-slaapopdrachten.
`sessions_list` en `/subagents list` houden relaties met onderliggende sessies gericht op actief werk — actieve kinderen blijven gekoppeld, beëindigde kinderen blijven gedurende een kort recent venster zichtbaar en verouderde, uitsluitend in de opslag aanwezige koppelingen naar kinderen worden na hun actualiteitsvenster genegeerd. Dit voorkomt dat oude `spawnedBy`-/
`parentSessionKey`-metagegevens na een herstart fantoomkinderen opnieuw tot leven wekken. Als een voltooiingsgebeurtenis van een kind binnenkomt nadat je het definitieve antwoord al hebt verzonden, is de juiste vervolgstap exact het stille token `NO_REPLY` / `no_reply`.
</Note>

### Toolbeleid per diepte

- Rol en besturingsbereik worden bij het starten in de sessiemetagegevens vastgelegd. Daardoor krijgen platte of herstelde sessiesleutels niet per ongeluk opnieuw orchestratorrechten.
- **Diepte 1 (orchestrator, wanneer `maxSpawnDepth >= 2`):** krijgt `sessions_spawn`, `subagents`, `sessions_list`, `sessions_history` zodat deze kinderen kan starten en hun status kan bekijken. Andere sessie-/systeemtools blijven geweigerd.
- **Diepte 1 (eindagent, wanneer `maxSpawnDepth == 1`):** geen sessietools (huidig standaardgedrag).
- **Diepte 2 (eindwerker):** geen sessietools — `sessions_spawn` wordt op diepte 2 altijd geweigerd. Kan geen verdere kinderen starten.

### Startlimiet per agent

Elke agentsessie (op elke diepte) kan maximaal `maxChildrenPerAgent`
(standaard `5`) actieve kinderen tegelijk hebben. Dit voorkomt onbeheerste vertakking vanuit één orchestrator.

### Trapsgewijs stoppen

Als een orchestrator op diepte 1 wordt gestopt, worden automatisch al diens kinderen op diepte 2 gestopt:

- `/stop` in de hoofdchat stopt alle agents op diepte 1 en stopt trapsgewijs hun kinderen op diepte 2.

## Authenticatie

Authenticatie voor subagents wordt bepaald op basis van **agent-id**, niet op basis van sessietype:

- De sessiesleutel van de subagent is `agent:<agentId>:subagent:<uuid>`.
- De authenticatieopslag wordt geladen vanuit de `agentDir` van die agent.
- De authenticatieprofielen van de hoofdagent worden als **terugvaloptie** samengevoegd; agentprofielen hebben bij conflicten voorrang op hoofdprofielen.

De samenvoeging is additief, zodat hoofdprofielen altijd als terugvalopties beschikbaar zijn. Volledig geïsoleerde authenticatie per agent wordt nog niet ondersteund.

## Aankondiging

Subagents rapporteren terug via een aankondigingsstap:

- De aankondigingsstap wordt uitgevoerd binnen de subagentsessie (niet binnen de sessie van de aanvrager).
- Als de subagent exact `ANNOUNCE_SKIP` antwoordt, wordt er niets geplaatst.
- Als de meest recente assistenttekst exact het stille token `NO_REPLY` / `no_reply` is, wordt de aankondigingsuitvoer onderdrukt, zelfs als er eerder zichtbare voortgang was.

De levering is afhankelijk van de diepte van de aanvrager:

- Aanvragersessies op het hoogste niveau gebruiken een vervolgaanroep naar `agent` met externe levering (`deliver=true`).
- Geneste subagentsessies van aanvragers ontvangen een interne vervolginjectie (`deliver=false`), zodat de orchestrator de resultaten van kinderen binnen de sessie kan samenvoegen.
- Als een geneste subagentsessie van een aanvrager niet meer bestaat, valt OpenClaw waar mogelijk terug op de aanvrager van die sessie.

Voor aanvragersessies op het hoogste niveau bepaalt rechtstreekse levering in voltooiingsmodus eerst een eventuele gekoppelde conversatie-/threadroute en hook-override, en vult daarna ontbrekende kanaal-doelvelden aan vanuit de opgeslagen route van de aanvragersessie. Daardoor komen voltooiingen in de juiste chat/het juiste onderwerp terecht, zelfs wanneer de oorsprong van de voltooiing alleen het kanaal identificeert.

Bij het opbouwen van geneste voltooiingsbevindingen wordt de aggregatie van voltooiingen van kinderen beperkt tot de huidige uitvoering van de aanvrager, zodat verouderde uitvoer van kinderen uit eerdere uitvoeringen niet in de huidige aankondiging terechtkomt. Aankondigingsantwoorden behouden waar beschikbaar de thread-/onderwerproutering op kanaaladapters.

### Aankondigingscontext

De aankondigingscontext wordt genormaliseerd tot een stabiel intern gebeurtenisblok:

| Veld           | Bron                                                                                                     |
| -------------- | -------------------------------------------------------------------------------------------------------- |
| Bron           | `subagent` of `cron`                                                                |
| Sessie-id's    | Sessiesleutel/-id van het kind                                                                           |
| Type           | Aankondigingstype + taaklabel                                                                            |
| Status         | Afgeleid van runtime-uitkomst (`ok`, `error`, `timeout` of `unknown`) — **niet** afgeleid uit modeltekst |
| Resultaatinhoud | Meest recente zichtbare assistenttekst van het kind                                                     |
| Vervolgactie   | Instructie die beschrijft wanneer moet worden geantwoord en wanneer het stil moet blijven                |

Mislukte beëindigde uitvoeringen rapporteren een foutstatus zonder vastgelegde antwoordtekst opnieuw af te spelen. Uitvoer van tools/toolResult wordt niet gepromoveerd tot resultaattekst van het kind.

### Statistiekenregel

Aankondigingspayloads bevatten aan het einde een statistiekenregel (ook wanneer ze zijn omwikkeld):

- Uitvoeringstijd (bijv. `runtime 5m12s`).
- Tokengebruik (invoer/uitvoer/totaal).
- Geschatte kosten wanneer modelprijzen zijn geconfigureerd (`models.providers.*.models[].cost`).
- `sessionKey`, `sessionId` en transcriptpad, zodat de hoofdagent de geschiedenis kan ophalen via `sessions_history` of het bestand op schijf kan bekijken.

Interne metagegevens zijn alleen bedoeld voor orchestratie; gebruikersgerichte antwoorden moeten worden herschreven in de normale assistentstijl.

### Waarom `sessions_history` de voorkeur heeft

`sessions_history` is het veiligere orchestratiepad om vanuit een agentbeurt het transcript van een kind te lezen:

- Censureert tekst die op inloggegevens/tokens lijkt, zelfs wanneer algemene logcensurering is uitgeschakeld.
- Kapt lange tekstblokken af (4000 tekens per blok) en verwijdert denksignaturen, payloads voor het opnieuw afspelen van redeneringen en inline afbeeldingsgegevens.
- Dwingt een responslimiet van 80 KB af; te grote rijen worden vervangen door `[sessions_history omitted: message too large]`.
- Gebruik `nextOffset` indien aanwezig om achterwaarts door oudere transcriptvensters te bladeren.
- `sessions_history` verwijdert **geen** redeneringstags, `<relevant-memories>`-steigerwerk of toolaanroep-XML uit berichttekst — het retourneert gestructureerde inhoudsblokken die dicht bij de ruwe transcriptvorm liggen, maar gecensureerd en in omvang begrensd. `/subagents log` past de zwaardere prozareiniger toe (verwijdert redeneringstags, geheugensteigerwerk en toolaanroep-XML), omdat deze gewone chatregels weergeeft in plaats van gestructureerde blokken.
- Inspectie van het ruwe transcript op schijf is de terugvaloptie wanneer je het volledige, byte-voor-byte transcript nodig hebt.

## Toolbeleid

Subagents gebruiken eerst dezelfde profiel- en toolbeleidspijplijn als de bovenliggende of doelagent. Daarna past OpenClaw de beperkingslaag voor subagents toe.

Subagents verliezen altijd `gateway`, `agents_list`, `session_status` en
`cron`, ongeacht diepte of rol (tools op systeemniveau/interactieve tools, of tools die de hoofdagent moet coördineren). Eindsubagents (standaardgedrag op diepte 1, en altijd op diepte 2) verliezen daarnaast `subagents`,
`sessions_list`, `sessions_history` en `sessions_spawn`. Subagents krijgen nooit de tool `message` — deze wordt bij het starten uitgeschakeld, niet door deze weigeringslijst gefilterd — en `sessions_send` blijft geweigerd, zodat subagents uitsluitend via de aankondigingsketen communiceren.

`sessions_history` blijft ook hier een begrensde, opgeschoonde herinneringsweergave — het is geen ruwe transcriptdump.

Wanneer `maxSpawnDepth >= 2`, ontvangen orchestrator-subagents op diepte 1 daarnaast `sessions_spawn`, `subagents`, `sessions_list` en
`sessions_history`, zodat ze hun kinderen kunnen beheren.

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
        // weigeren heeft voorrang
        deny: ["gateway", "cron"],
        // als toestaan is ingesteld, wordt dit uitsluitend-toestaan (weigeren heeft nog steeds voorrang)
        // allow: ["read", "exec", "process"]
      },
    },
  },
}
```

`tools.subagents.tools.allow` is een definitief uitsluitend-toestaan-filter. Het kan de reeds bepaalde toolset beperken, maar kan geen tool **terugtoevoegen** die door `tools.profile` is verwijderd. `tools.profile: "coding"` bevat bijvoorbeeld
`web_search`/`web_fetch`, maar niet de tool `browser`. Als subagents met een codeerprofiel browserautomatisering mogen gebruiken, voeg je browser toe in de profielfase:

```json5
{
  tools: {
    profile: "coding",
    alsoAllow: ["browser"],
  },
}
```

Gebruik `agents.list[].tools.alsoAllow: ["browser"]` per agent wanneer slechts één agent browserautomatisering mag krijgen.

## Gelijktijdigheid

Subagents gebruiken een speciale wachtrijstrook binnen het proces:

- **Naam van strook:** `subagent`
- **Gelijktijdigheid:** `agents.defaults.subagents.maxConcurrent` (standaard `8`)

## Beschikbaarheid en herstel

OpenClaw beschouwt het ontbreken van `endedAt` niet als permanent bewijs dat een subagent nog actief is. Niet-beëindigde uitvoeringen die ouder zijn dan het venster voor verouderde uitvoeringen (2 uur, of de geconfigureerde uitvoeringstime-out plus een korte respijtperiode, afhankelijk van welke langer is) tellen niet langer als actief/in behandeling in `/subagents list`, statusoverzichten, voltooiingsblokkering voor afstammelingen en gelijktijdigheidscontroles per sessie.

Na een herstart van de Gateway worden verouderde, niet-beëindigde herstelde uitvoeringen verwijderd, tenzij hun onderliggende sessie is gemarkeerd als `abortedLastRun: true`. Door een herstart afgebroken uitvoeringen blijven geregistreerd voor de herstelstroom voor verweesde subagents: verouderde uitvoeringen worden zonder hervatting afgerond, terwijl recente onderliggende sessies een synthetisch hervattingsbericht ontvangen voordat de afbreekmarkering wordt gewist.

Automatisch herstel na een herstart is per onderliggende sessie begrensd. Als hetzelfde subagentkind binnen het venster voor snel opnieuw vastlopen herhaaldelijk voor herstel van verweesde processen wordt geaccepteerd, slaat OpenClaw een herstelgrafsteen voor die sessie op en stopt het bij latere herstarts met automatisch hervatten. Voer
`openclaw tasks maintenance --apply` uit om de taakregistratie te vereffenen, of
`openclaw doctor --fix` om verouderde afgebroken herstelmarkeringen te wissen voor sessies met een grafsteen.

<Note>
Als het starten van een sub-agent mislukt met Gateway `PAIRING_REQUIRED` /
`scope-upgrade`, controleer dan de RPC-aanroeper voordat je de koppelingsstatus bewerkt.
Interne `sessions_spawn`-coördinatie wordt binnen het proces uitgevoerd wanneer de
aanroeper al binnen de context van het Gateway-verzoek draait, zodat er geen
loopback-WebSocket wordt geopend en er geen afhankelijkheid is van de basislijn
voor het bereik van gekoppelde apparaten van de CLI. Aanroepers buiten het
Gateway-proces gebruiken nog steeds de WebSocket-fallback als `client.id: "gateway-client"`
met `client.mode: "backend"` via directe loopback-authenticatie met een gedeeld token/wachtwoord.
Externe aanroepers, expliciete `deviceIdentity`, expliciete paden met apparaattokens
en browser-/Node-clients hebben nog steeds normale apparaatgoedkeuring nodig voor
bereikupgrades.
</Note>

## Stoppen

- Door `/stop` in de chat van de aanvrager te verzenden, wordt de sessie van de aanvrager afgebroken en worden alle actieve sub-agentuitvoeringen gestopt die vanuit deze sessie zijn gestart, inclusief geneste onderliggende uitvoeringen.

## Beperkingen

- Aankondigingen van sub-agents worden naar **beste vermogen** uitgevoerd. Als de Gateway opnieuw wordt gestart, gaan openstaande taken voor 'terugmelden' verloren.
- Sub-agents delen nog steeds dezelfde procesresources van de Gateway; beschouw `maxConcurrent` als een veiligheidsklep.
- `sessions_spawn` is altijd niet-blokkerend: deze retourneert onmiddellijk `{ status: "accepted", runId, childSessionKey }`.
- De context van een sub-agent injecteert alleen `AGENTS.md` en `TOOLS.md` (geen `SOUL.md`, `IDENTITY.md`, `USER.md`, `MEMORY.md`, `HEARTBEAT.md` of `BOOTSTRAP.md`). Codex-native sub-agents volgen dezelfde grens: `TOOLS.md` blijft in de overgenomen Codex-threadinstructies, terwijl persona-, identiteits- en gebruikersbestanden die alleen voor de ouder gelden, worden geïnjecteerd als samenwerkingsinstructies voor de huidige beurt, zodat onderliggende agents deze niet klonen.
- De maximale nestingsdiepte is 5 (bereik van `maxSpawnDepth`: 1-5). Diepte 2 wordt aanbevolen voor de meeste gebruikssituaties.
- `maxChildrenPerAgent` beperkt het aantal actieve onderliggende agents per sessie (standaard `5`, bereik `1-20`).

## Gerelateerd

- [Sessietools en statuswijzigingen](/nl/concepts/session-tool)
- [ACP-agents](/nl/tools/acp-agents)
- [Agent verzenden](/nl/tools/agent-send)
- [Achtergrondtaken](/nl/automation/tasks)
- [Sandbox-tools voor meerdere agents](/nl/tools/multi-agent-sandbox-tools)
