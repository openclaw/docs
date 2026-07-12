---
read_when:
    - Je wilt achtergrondwerk of parallel werk via de agent
    - U wijzigt het beleid voor sessions_spawn of de subagenttool
    - Je implementeert threadgebonden subagentsessies of lost problemen ermee op
sidebarTitle: Sub-agents
summary: Start geïsoleerde agentruns op de achtergrond die de resultaten terugmelden in de chat van de aanvrager
title: Subagenten
x-i18n:
    generated_at: "2026-07-12T09:25:00Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: d2293993ad99e2797f5cfbe13e964487f3bd0fa0a3114e78d25ce5862768b9ca
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
- Configureerbare nestingsdiepte voor orchestratorpatronen ondersteunen.

<Note>
**Opmerking over kosten:** elke sub-agent heeft standaard een eigen context en
tokengebruik. Stel voor zware of repetitieve taken een goedkoper model voor
sub-agents in en behoud voor je hoofdagent een model van hogere kwaliteit via
`agents.defaults.subagents.model` of overschrijvingen per agent. Wanneer een
child daadwerkelijk het huidige transcript van de aanvrager nodig heeft, start
je deze met `context: "fork"`. Aan threads gebonden sub-agentsessies gebruiken
standaard `context: "fork"`, omdat ze de huidige conversatie naar een
vervolgthread vertakken.
</Note>

## Slash-opdracht

`/subagents` inspecteert sub-agentruns voor de **huidige sessie**:

```text
/subagents list
/subagents log <id|#> [limit] [tools]
/subagents info <id|#>
```

`/subagents info` toont metadata van de run (status, tijdstempels, sessie-id,
transcriptpad, opschoning). `/subagents log` toont recente chatbeurten van een
run; voeg het token `tools` toe om berichten van toolaanroepen en -resultaten
op te nemen (standaard weggelaten). Gebruik `sessions_history` voor een
begrensde, op veiligheid gefilterde terugblik vanuit een agentbeurt, of
inspecteer het transcriptpad op schijf voor het onbewerkte volledige transcript.

### Besturing voor threadbinding

Deze opdrachten werken in kanalen met persistente threadbindingen. Zie
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
Voltooiingen keren terug als interne gebeurtenissen van de bovenliggende
sessie; de bovenliggende/aanvragende agent beslist of een zichtbare update
voor de gebruiker nodig is.

<AccordionGroup>
  <Accordion title="Niet-blokkerende, pushgebaseerde voltooiing">
    - `sessions_spawn` is niet-blokkerend en retourneert onmiddellijk een run-id.
    - Na voltooiing rapporteert de sub-agent terug aan de bovenliggende/aanvragende sessie.
    - Agentbeurten die resultaten van child-agents nodig hebben, moeten na het starten van het vereiste werk `sessions_yield` aanroepen. Daarmee eindigt de huidige beurt en kan de voltooiingsgebeurtenis als het volgende voor het model zichtbare bericht binnenkomen.
    - Voltooiing is pushgebaseerd. Na het starten mag je **niet** herhaaldelijk `/subagents list`, `sessions_list` of `sessions_history` aanroepen om alleen maar te wachten tot de run klaar is; controleer de status uitsluitend wanneer dat voor foutopsporing nodig is.
    - Uitvoer van een child-agent is een rapport of bewijsmateriaal dat de aanvragende agent moet samenvoegen. Het zijn geen door de gebruiker geschreven instructies en deze uitvoer kan systeem-, ontwikkelaars- of gebruikersbeleid niet overschrijven.
    - Na voltooiing sluit OpenClaw naar beste vermogen de bijgehouden browsertabbladen en processen die door die sub-agentsessie zijn geopend, voordat de opschoningsprocedure van de aankondiging doorgaat.

  </Accordion>
  <Accordion title="Aflevering van voltooiingen">
    - OpenClaw geeft voltooiingen via een `agent`-beurt met een stabiele idempotentiesleutel terug aan de aanvragende sessie.
    - Als de aanvragende run nog actief is, probeert OpenClaw die run eerst te activeren of bij te sturen in plaats van een tweede zichtbaar antwoordpad te starten.
    - Als een actieve aanvrager niet kan worden geactiveerd, valt OpenClaw terug op een overdracht aan de aanvragende agent met dezelfde voltooiingscontext, in plaats van de aankondiging te laten vervallen.
    - Een geslaagde overdracht aan de bovenliggende agent voltooit de aflevering van de sub-agent, zelfs wanneer de bovenliggende agent besluit dat geen zichtbare gebruikersupdate nodig is.
    - Native sub-agents krijgen de berichttool niet. Ze retourneren gewone assistenttekst aan de bovenliggende/aanvragende agent; voor mensen zichtbare antwoorden blijven onder het normale afleveringsbeleid van de bovenliggende/aanvragende agent vallen.
    - Als directe overdracht niet kan worden gebruikt, valt de aflevering terug op routering via de wachtrij en vervolgens op een korte nieuwe poging van de aankondiging met exponentiële vertraging, voordat deze definitief wordt opgegeven.
    - De aflevering behoudt de opgeloste route van de aanvrager: aan een thread of conversatie gebonden voltooiingsroutes krijgen voorrang wanneer deze beschikbaar zijn. Als de oorsprong van de voltooiing alleen een kanaal bevat, vult OpenClaw het ontbrekende doel/account aan vanuit de opgeloste route van de aanvragende sessie (`lastChannel` / `lastTo` / `lastAccountId`), zodat directe aflevering blijft werken.

  </Accordion>
  <Accordion title="Metadata voor voltooiingsoverdracht">
    De voltooiingsoverdracht aan de aanvragende sessie is tijdens runtime
    gegenereerde interne context (geen door de gebruiker geschreven tekst) en bevat:

    - `Result` — de meest recente zichtbare `assistant`-antwoordtekst van de child-agent. Uitvoer van tool/toolResult wordt niet opgenomen in de resultaten van de child-agent. Beëindigde mislukte runs hergebruiken geen vastgelegde antwoordtekst.
    - `Status` — `completed; ready for parent review` / `failed` / `timed out` / `unknown`.
    - Compacte runtime-/tokenstatistieken.
    - Een beoordelingsinstructie die de aanvragende agent opdraagt het resultaat te verifiëren voordat deze beslist of de oorspronkelijke taak voltooid is.
    - Vervolgrichtlijnen die de aanvragende agent opdragen de taak voort te zetten of een vervolgactie vast te leggen wanneer het resultaat van de child-agent nog meer actie vereist.
    - Een instructie voor de definitieve update wanneer geen verdere actie nodig is, geschreven in de normale stem van de assistent zonder onbewerkte interne metadata door te sturen.

  </Accordion>
  <Accordion title="Modi en ACP-runtime">
    - `--model` en `--thinking` overschrijven de standaardwaarden voor die specifieke run.
    - Gebruik `info`/`log` om na voltooiing details en uitvoer te inspecteren.
    - Gebruik voor persistente, aan threads gebonden sessies `sessions_spawn` met `thread: true` en `mode: "session"`.
    - Als het kanaal van de aanvrager geen threadbindingen ondersteunt, gebruik je `mode: "run"` in plaats van een onmogelijke combinatie met threadbinding opnieuw te proberen.
    - Gebruik voor ACP-harnessessies (Claude Code, Gemini CLI, OpenCode of expliciete Codex ACP/acpx) `sessions_spawn` met `runtime: "acp"` wanneer de tool aangeeft die runtime te ondersteunen. Zie [ACP-afleveringsmodel](/nl/tools/acp-agents#delivery-model) bij het opsporen van problemen met voltooiingen of lussen tussen agents. Wanneer de `codex`-Plugin is ingeschakeld, moet besturing van Codex-chats/threads de voorkeur geven aan `/codex ...` boven ACP, tenzij de gebruiker expliciet om ACP/acpx vraagt.
    - OpenClaw verbergt `runtime: "acp"` totdat ACP is ingeschakeld, de aanvrager niet in een sandbox draait en een backend-Plugin zoals `acpx` is geladen. `runtime: "acp"` verwacht een externe ACP-harness-id of een vermelding in `agents.list[]` met `runtime.type="acp"`; gebruik de standaardruntime voor sub-agents voor normale OpenClaw-configuratieagents uit `agents_list`.

  </Accordion>
</AccordionGroup>

## Contextmodi

Native sub-agents starten geïsoleerd, tenzij de aanroeper expliciet vraagt om
het huidige transcript te vertakken.

| Modus      | Wanneer te gebruiken                                                                                                                    | Gedrag                                                                                       |
| ---------- | --------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------- |
| `isolated` | Nieuw onderzoek, onafhankelijke implementatie, traag toolwerk of alles wat volledig in de taaktekst kan worden toegelicht                | Maakt een schoon child-transcript. Dit is de standaard en houdt het tokengebruik lager.       |
| `fork`     | Werk dat afhankelijk is van de huidige conversatie, eerdere toolresultaten of genuanceerde instructies die al in het transcript staan   | Vertakt het transcript van de aanvrager naar de child-sessie voordat de child-agent start.    |

Gebruik `fork` spaarzaam. Het is bedoeld voor contextgevoelige delegatie, niet
als vervanging voor het schrijven van een duidelijke taakprompt.

## Tool: `sessions_spawn`

Start een sub-agentrun met `deliver: false` op de algemene `subagent`-lane,
voert vervolgens een aankondigingsstap uit en plaatst het aankondigingsantwoord
in het chatkanaal van de aanvrager.

De beschikbaarheid hangt af van het effectieve toolbeleid van de aanroeper. Het
ingebouwde profiel `coding` bevat `sessions_spawn`; `messaging` en `minimal`
niet. `full` staat elke tool toe. Voeg `tools.alsoAllow: ["sessions_spawn",
"sessions_yield", "subagents"]` toe, of gebruik `tools.profile: "coding"`, voor
agents met een beperkter profiel die toch werk moeten kunnen delegeren.
Beleid voor kanalen/groepen, providers, sandboxen en toestaan/weigeren per agent
kan de tool na de profielfase nog steeds verwijderen. Gebruik `/tools` vanuit
dezelfde sessie om de effectieve toollijst te bevestigen.

**Standaardwaarden:**

- **Model:** native sub-agents nemen het model van de aanroeper over, tenzij je `agents.defaults.subagents.model` instelt (of `agents.list[].subagents.model` per agent). Starts met de ACP-runtime gebruiken hetzelfde geconfigureerde sub-agentmodel wanneer dat aanwezig is; anders behoudt de ACP-harness zijn eigen standaardwaarde. Een expliciete `sessions_spawn.model` heeft nog steeds voorrang.
- **Denkproces:** native sub-agents nemen het denkproces van de aanroeper over, tenzij je `agents.defaults.subagents.thinking` instelt (of `agents.list[].subagents.thinking` per agent). Starts met de ACP-runtime passen ook `agents.defaults.models["provider/model"].params.thinking` toe voor het geselecteerde model. Een expliciete `sessions_spawn.thinking` heeft nog steeds voorrang.
- **Runtimelimiet:** OpenClaw gebruikt `agents.defaults.subagents.runTimeoutSeconds` wanneer dit is ingesteld; anders valt het terug op `0` (geen limiet). `sessions_spawn` accepteert geen overschrijvingen van de limiet per aanroep.
- **Taakaflevering:** native sub-agents ontvangen de gedelegeerde taak in hun eerste zichtbare bericht `[Subagent Task]`. De systeemprompt van de sub-agent bevat runtimeregels en routeringscontext, niet een verborgen duplicaat van de taak.

Geaccepteerde starts van native sub-agents bevatten de opgeloste metadata van
het child-model in het toolresultaat: `resolvedModel` bevat de toegepaste
modelreferentie en `resolvedProvider` bevat het providerprefix wanneer de
referentie er een heeft.

### Modus voor delegatieprompts

`agents.defaults.subagents.delegationMode` bepaalt alleen de promptrichtlijnen; het wijzigt het toolbeleid niet en dwingt delegatie niet af.

- `suggest` (standaard): behoud de standaardaanwijzing in de prompt om sub-agents te gebruiken voor groter of trager werk.
- `prefer`: draag de hoofdagent op responsief te blijven en alles wat meer omvat dan een direct antwoord via `sessions_spawn` te delegeren.

Overschrijving per agent: `agents.list[].subagents.delegationMode`.

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
  Optionele stabiele aanduiding om een specifiek onderliggend proces in latere statusuitvoer te identificeren. Moet overeenkomen met `[a-z][a-z0-9_-]{0,63}` en mag geen gereserveerd doel zijn, zoals `last` of `all`.
</ParamField>
<ParamField path="label" type="string">
  Optioneel, voor mensen leesbaar label.
</ParamField>
<ParamField path="agentId" type="string">
  Start onder een andere geconfigureerde agent-id wanneer dit is toegestaan door `subagents.allowAgents`.
</ParamField>
<ParamField path="cwd" type="string">
  Optionele werkmap voor de taak van het onderliggende proces. Systeemeigen subagents laden nog steeds bootstrapbestanden uit de werkruimte van de doelagent; `cwd` wijzigt alleen waar runtimehulpmiddelen en CLI-harnassen het gedelegeerde werk uitvoeren.
</ParamField>
<ParamField path="runtime" type='"subagent" | "acp"' default="subagent">
  `acp` is alleen bedoeld voor externe ACP-harnassen (`claude`, `droid`, `gemini`, `opencode` of expliciet aangevraagde Codex ACP/acpx) en voor vermeldingen in `agents.list[]` waarvan `runtime.type` gelijk is aan `acp`.
</ParamField>
<ParamField path="resumeSessionId" type="string">
  Alleen voor ACP. Hervat een bestaande ACP-harnassessie wanneer `runtime: "acp"`; wordt genegeerd bij het starten van systeemeigen subagents.
</ParamField>
<ParamField path="streamTo" type='"parent"'>
  Alleen voor ACP. Streamt de uitvoer van de ACP-uitvoering naar de bovenliggende sessie wanneer `runtime: "acp"`; weglaten bij het starten van systeemeigen subagents.
</ParamField>
<ParamField path="model" type="string">
  Overschrijf het model van de subagent. Ongeldige waarden worden overgeslagen en de subagent draait op het standaardmodel, met een waarschuwing in het hulpmiddelresultaat.
</ParamField>
<ParamField path="thinking" type="string">
  Overschrijf het denkniveau voor de uitvoering van de subagent.
</ParamField>
<ParamField path="thread" type="boolean" default="false">
  Wanneer dit `true` is, wordt kanaalthreadkoppeling voor deze subagentsessie aangevraagd.
</ParamField>
<ParamField path="mode" type='"run" | "session"' default="run">
  Als `thread: true` is en `mode` wordt weggelaten, wordt `session` de standaardwaarde. `mode: "session"` vereist `thread: true`.
  Als threadkoppeling niet beschikbaar is voor het kanaal van de aanvrager, gebruik dan in plaats daarvan `mode: "run"`.
</ParamField>
<ParamField path="cleanup" type='"delete" | "keep"' default="keep">
  `"delete"` archiveert de sessie onmiddellijk na de aankondiging (het transcript blijft behouden door het te hernoemen).
</ParamField>
<ParamField path="sandbox" type='"inherit" | "require"' default="inherit">
  `require` weigert het starten tenzij de runtime van het onderliggende doelproces in een sandbox draait.
</ParamField>
<ParamField path="context" type='"isolated" | "fork"' default="isolated">
  `fork` vertakt het huidige transcript van de aanvrager naar de onderliggende sessie. Alleen voor systeemeigen subagents. Aan threads gekoppelde starts gebruiken standaard `fork`; niet aan threads gekoppelde starts gebruiken standaard `isolated`.
</ParamField>

<Warning>
`sessions_spawn` accepteert **geen** parameters voor kanaalbezorging (`target`,
`channel`, `to`, `threadId`, `replyTo`, `transport`). Systeemeigen subagents sturen
hun laatste assistentbeurt terug naar de aanvrager; externe bezorging blijft bij
de bovenliggende/aanvragende agent.
</Warning>

### Taaknamen en doelbepaling

`taskName` is een modelgerichte aanduiding voor orkestratie, geen sessiesleutel.
Gebruik deze voor stabiele namen van onderliggende processen, zoals `review_subagents`,
`linux_validation` of `docs_update`, wanneer een coördinator dat onderliggende
proces later mogelijk moet inspecteren.

Doelresolutie accepteert exacte overeenkomsten met `taskName` en eenduidige
voorvoegsels. Overeenkomsten zijn beperkt tot hetzelfde venster met actieve/recente
doelen dat wordt gebruikt door genummerde `/subagents`-doelen, zodat een verouderd
voltooid onderliggend proces een hergebruikte aanduiding niet dubbelzinnig maakt.
Als twee actieve of recente onderliggende processen dezelfde `taskName` delen, is
het doel dubbelzinnig; gebruik in plaats daarvan de lijstindex, sessiesleutel of
uitvoerings-id.

De gereserveerde doelen `last` en `all` zijn geen geldige `taskName`-waarden,
omdat ze al een besturingsbetekenis hebben.

## Hulpmiddel: `sessions_yield`

Beëindigt de huidige modelbeurt en wacht tot runtimegebeurtenissen, voornamelijk
voltooiingsgebeurtenissen van subagents, als het volgende bericht binnenkomen. Gebruik
dit na het starten van vereist onderliggend werk wanneer de aanvrager geen definitief
antwoord kan geven voordat die voltooiingen zijn binnengekomen.

`sessions_yield` is het wachtmechanisme. Vervang dit niet door pollinglussen
over `subagents`, `sessions_list`, `sessions_history`, shellopdrachten met
`sleep` of procespolling, alleen om de voltooiing van een onderliggend proces te detecteren.

Gebruik `sessions_yield` alleen wanneer de effectieve hulpmiddelenlijst van de sessie
dit bevat. Sommige minimale of aangepaste hulpmiddelprofielen kunnen `sessions_spawn`
en `subagents` beschikbaar stellen zonder `sessions_yield`; bedenk in dat geval geen
pollinglus alleen om op voltooiing te wachten.

Wanneer er actieve onderliggende processen zijn, voegt OpenClaw een compact, door de
runtime gegenereerd promptblok `Active Subagents` toe aan normale beurten, zodat de
aanvrager de huidige onderliggende sessies, uitvoerings-id's, statussen, labels, taken
en `taskName`-aliassen kan zien zonder polling. De taak- en labelvelden in dat blok
worden als gegevens aangehaald, niet als instructies, omdat ze afkomstig kunnen zijn
uit door de gebruiker of het model verstrekte startargumenten.

## Hulpmiddel: `subagents`

Toont gestarte uitvoeringen van subagents die eigendom zijn van de aanvragende sessie.
Dit is beperkt tot de huidige aanvrager; een onderliggend proces kan alleen zijn eigen
aangestuurde onderliggende processen zien.

Gebruik `subagents` voor statuscontroles en foutopsporing op aanvraag. Gebruik
`sessions_yield` om op voltooiingsgebeurtenissen te wachten.

## Aan threads gekoppelde sessies

Wanneer threadkoppelingen voor een kanaal zijn ingeschakeld, kan een subagent aan
een thread gekoppeld blijven, zodat vervolgberichten van gebruikers in die thread
naar dezelfde subagentsessie blijven worden doorgestuurd.

### Kanalen die threads ondersteunen

Een kanaal ondersteunt blijvende, aan threads gekoppelde subagentsessies
(`sessions_spawn` met `thread: true`) wanneer het een adapter voor gesprekskoppeling
registreert. Meegeleverde kanalen met deze ondersteuning: **Discord**,
**iMessage**, **Matrix** en **Telegram**. Discord en Matrix maken standaard een
onderliggende thread; Telegram en iMessage koppelen standaard het huidige gesprek.
Gebruik de `threadBindings`-configuratiesleutels per kanaal voor inschakeling,
time-outs en `spawnSessions`.

### Snelle werkwijze

<Steps>
  <Step title="Starten">
    `sessions_spawn` met `thread: true` (en optioneel `mode: "session"`).
  </Step>
  <Step title="Koppelen">
    OpenClaw maakt of koppelt een thread aan dat sessiedoel in het actieve kanaal.
  </Step>
  <Step title="Vervolgberichten doorsturen">
    Antwoorden en vervolgberichten in die thread worden naar de gekoppelde sessie doorgestuurd.
  </Step>
  <Step title="Time-outs inspecteren">
    Gebruik `/session idle` om automatisch stoppen met focussen na inactiviteit te inspecteren/bij te werken en
    `/session max-age` om de harde limiet te beheren.
  </Step>
  <Step title="Loskoppelen">
    Gebruik `/unfocus` om handmatig los te koppelen.
  </Step>
</Steps>

### Handmatige bediening

| Opdracht            | Effect                                                                                    |
| ------------------ | ----------------------------------------------------------------------------------------- |
| `/focus <target>`  | Koppel de huidige thread aan een subagent-/sessiedoel (of maak een thread)                |
| `/unfocus`         | Verwijder de koppeling voor de momenteel gekoppelde thread                                |
| `/agents`          | Toon actieve uitvoeringen en koppelingsstatus (`binding:<id>`, `unbound` of `bindings unavailable`) |
| `/session idle`    | Inspecteer/bewerk automatisch stoppen met focussen bij inactiviteit (alleen gekoppelde threads met focus) |
| `/session max-age` | Inspecteer/bewerk de harde limiet (alleen gekoppelde threads met focus)                   |

### Configuratieschakelaars

- **Algemene standaard:** `session.threadBindings.enabled`, `session.threadBindings.idleHours`, `session.threadBindings.maxAgeHours`.
- **Kanaaloverschrijvingen en sleutels voor automatische koppeling bij het starten** zijn adapterspecifiek. Zie [Kanalen die threads ondersteunen](#thread-supporting-channels) hierboven.

Zie [Configuratiereferentie](/nl/gateway/configuration-reference) en
[Slash-opdrachten](/nl/tools/slash-commands) voor actuele adapterdetails.

### Toegestane lijst

<ParamField path="agents.list[].subagents.allowAgents" type="string[]">
  Lijst met geconfigureerde agent-id's die via een expliciete `agentId` als doel kunnen worden gebruikt (`["*"]` staat elk geconfigureerd doel toe). Standaard: alleen de aanvragende agent. Als u een lijst instelt en nog steeds wilt dat de aanvrager zichzelf start met `agentId`, neem dan de id van de aanvrager op in de lijst.
</ParamField>
<ParamField path="agents.defaults.subagents.allowAgents" type="string[]">
  Standaard toegestane lijst met geconfigureerde doelagents, gebruikt wanneer de aanvragende agent geen eigen `subagents.allowAgents` instelt.
</ParamField>
<ParamField path="agents.defaults.subagents.requireAgentId" type="boolean" default="false">
  Blokkeer aanroepen van `sessions_spawn` die `agentId` weglaten (dwingt expliciete profielselectie af). Overschrijving per agent: `agents.list[].subagents.requireAgentId`.
</ParamField>
<ParamField path="agents.defaults.subagents.announceTimeoutMs" type="number" default="120000">
  Time-out per aanroep voor bezorgpogingen van Gateway-`agent`-aankondigingen. Waarden zijn positieve gehele aantallen milliseconden en worden begrensd op het platformveilige maximum voor timers. Tijdelijke nieuwe pogingen kunnen ervoor zorgen dat de totale wachttijd voor de aankondiging langer is dan één geconfigureerde time-out.
</ParamField>

Als de aanvragende sessie in een sandbox draait, weigert `sessions_spawn`
doelen die zonder sandbox zouden draaien.

### Detectie

Gebruik `agents_list` om te zien welke agent-id's momenteel zijn toegestaan voor
`sessions_spawn`. Het antwoord bevat het effectieve model en de ingebedde
runtimemetadata van elke vermelde agent, zodat aanroepers onderscheid kunnen maken
tussen OpenClaw, de Codex-appserver en andere geconfigureerde systeemeigen runtimes.

Vermeldingen in `allowAgents` moeten verwijzen naar geconfigureerde agent-id's in `agents.list[]`.
`["*"]` betekent elke geconfigureerde doelagent plus de aanvrager. Als een agentconfiguratie
wordt verwijderd maar de id ervan in `allowAgents` blijft staan, weigert `sessions_spawn`
die id en laat `agents_list` deze weg. Voer `openclaw doctor --fix` uit om verouderde
vermeldingen uit de toegestane lijst op te schonen, of voeg een minimale vermelding aan
`agents.list[]` toe wanneer het doel gestart moet kunnen blijven worden terwijl het de
standaardwaarden erft.

### Automatisch archiveren

- Subagentsessies worden automatisch gearchiveerd na `agents.defaults.subagents.archiveAfterMinutes` (standaard `60`).
- Voor archivering wordt `sessions.delete` gebruikt en wordt het transcript hernoemd naar `*.deleted.<timestamp>` (dezelfde map).
- `cleanup: "delete"` archiveert onmiddellijk na de aankondiging (het transcript blijft behouden door het te hernoemen).
- Automatische archivering gebeurt naar beste vermogen; wachtende timers gaan verloren als de Gateway opnieuw wordt gestart.
- Geconfigureerde uitvoeringstime-outs archiveren **niet** automatisch; ze stoppen alleen de uitvoering. De sessie blijft bestaan tot automatische archivering.
- Automatische archivering is in gelijke mate van toepassing op sessies van diepte 1 en diepte 2.
- Browseropschoning staat los van archiveringsopschoning: bijgehouden browsertabbladen/-processen worden naar beste vermogen gesloten wanneer de uitvoering eindigt, zelfs als het transcript/de sessieregistratie behouden blijft.

## Geneste subagents

Subagents kunnen standaard niet hun eigen subagents starten
(`maxSpawnDepth: 1`). Stel `maxSpawnDepth: 2` in om één niveau van
nesting mogelijk te maken — het **orkestratorpatroon**: hoofdproces → orkestrator-subagent →
onderliggende werkersubagents.

```json5
{
  agents: {
    defaults: {
      subagents: {
        maxSpawnDepth: 2, // allow sub-agents to spawn children (default: 1, range 1-5)
        maxChildrenPerAgent: 5, // max active children per agent session (default: 5, range 1-20)
        maxConcurrent: 8, // global concurrency lane cap (default: 8)
        runTimeoutSeconds: 900, // default timeout for sessions_spawn (0 = no timeout)
        announceTimeoutMs: 120000, // per-call gateway announce timeout
      },
    },
  },
}
```

### Diepteniveaus

| Diepte | Vorm van sessiesleutel                       | Rol                                                | Kan subagenten starten?        |
| ------ | -------------------------------------------- | -------------------------------------------------- | ------------------------------ |
| 0      | `agent:<id>:main`                            | Hoofdagent                                         | Altijd                         |
| 1      | `agent:<id>:subagent:<uuid>`                 | Subagent (orchestrator als diepte 2 is toegestaan) | Alleen als `maxSpawnDepth >= 2` |
| 2      | `agent:<id>:subagent:<uuid>:subagent:<uuid>` | Sub-subagent (eindwerker)                          | Nooit                          |

### Aankondigingsketen

Resultaten stromen terug omhoog door de keten:

1. Werker op diepte 2 is klaar → kondigt dit aan zijn ouder aan (orchestrator op diepte 1).
2. Orchestrator op diepte 1 ontvangt de aankondiging, voegt de resultaten samen, rondt af → kondigt dit aan de hoofdagent aan.
3. De hoofdagent ontvangt de aankondiging en levert deze aan de gebruiker.

Elk niveau ziet alleen aankondigingen van zijn directe kinderen.

<Note>
**Operationele richtlijn:** start onderliggend werk eenmaal en wacht op voltooiingsgebeurtenissen in plaats van pollinglussen te bouwen rond `sessions_list`, `sessions_history`, `/subagents list` of `exec`-slaapopdrachten.
`sessions_list` en `/subagents list` houden relaties met onderliggende sessies gericht op actief werk — actieve kinderen blijven gekoppeld, beëindigde kinderen blijven korte tijd zichtbaar in een venster met recente items en verouderde koppelingen naar kinderen die alleen nog in de opslag bestaan, worden na hun actualiteitsvenster genegeerd. Dit voorkomt dat oude `spawnedBy`-/
`parentSessionKey`-metadata na een herstart fantoomkinderen opnieuw tot leven brengt. Als een voltooiingsgebeurtenis van een kind aankomt nadat je het definitieve antwoord al hebt verzonden, is het juiste vervolg exact het stille token
`NO_REPLY` / `no_reply`.
</Note>

### Toolbeleid per diepte

- Rol en beheerbereik worden bij het starten in de sessiemetadata geschreven. Zo kunnen vlakke of herstelde sessiesleutels niet per ongeluk opnieuw orchestratorrechten krijgen.
- **Diepte 1 (orchestrator, wanneer `maxSpawnDepth >= 2`):** krijgt `sessions_spawn`, `subagents`, `sessions_list`, `sessions_history`, zodat deze kinderen kan starten en hun status kan controleren. Andere sessie-/systeemtools blijven geweigerd.
- **Diepte 1 (eindwerker, wanneer `maxSpawnDepth == 1`):** geen sessietools (huidig standaardgedrag).
- **Diepte 2 (eindwerker):** geen sessietools — `sessions_spawn` wordt op diepte 2 altijd geweigerd. Kan geen verdere kinderen starten.

### Startlimiet per agent

Elke agentsessie (op elke diepte) kan maximaal `maxChildrenPerAgent`
(standaard `5`) actieve kinderen tegelijk hebben. Dit voorkomt ongecontroleerde vertakking vanuit één orchestrator.

### Trapsgewijs stoppen

Als een orchestrator op diepte 1 wordt gestopt, worden automatisch al diens kinderen op diepte 2 gestopt:

- `/stop` in de hoofdchat stopt alle agenten op diepte 1 en laat dit doorwerken naar hun kinderen op diepte 2.

## Authenticatie

Authenticatie van subagenten wordt bepaald op basis van **agent-id**, niet op basis van sessietype:

- De sessiesleutel van de subagent is `agent:<agentId>:subagent:<uuid>`.
- De authenticatieopslag wordt geladen vanuit de `agentDir` van die agent.
- De authenticatieprofielen van de hoofdagent worden als **terugvaloptie** samengevoegd; agentprofielen hebben bij conflicten voorrang op hoofdprofielen.

Het samenvoegen is additief, zodat hoofdprofielen altijd beschikbaar zijn als terugvaloptie. Volledig geïsoleerde authenticatie per agent wordt nog niet ondersteund.

## Aankondiging

Subagenten rapporteren terug via een aankondigingsstap:

- De aankondigingsstap wordt uitgevoerd binnen de sessie van de subagent (niet binnen de sessie van de aanvrager).
- Als de subagent exact `ANNOUNCE_SKIP` antwoordt, wordt er niets geplaatst.
- Als de recentste assistenttekst exact het stille token `NO_REPLY` / `no_reply` is, wordt de aankondigingsuitvoer onderdrukt, zelfs als er eerder zichtbare voortgang was.

De aflevering is afhankelijk van de diepte van de aanvrager:

- Sessies van aanvragers op het hoogste niveau gebruiken een vervolgaanroep naar `agent` met externe aflevering (`deliver=true`).
- Geneste subagentsessies van aanvragers ontvangen een interne vervolginjectie (`deliver=false`), zodat de orchestrator de resultaten van kinderen binnen de sessie kan samenvoegen.
- Als een geneste subagentsessie van een aanvrager niet meer bestaat, valt OpenClaw waar mogelijk terug op de aanvrager van die sessie.

Voor sessies van aanvragers op het hoogste niveau bepaalt rechtstreekse aflevering in voltooiingsmodus eerst een eventueel gekoppelde gespreks-/threadroute en hook-overschrijving, en vult daarna ontbrekende kanaal-doelvelden aan vanuit de opgeslagen route van de aanvragerssessie. Zo blijven voltooiingen in de juiste chat/het juiste onderwerp, zelfs wanneer de oorsprong van de voltooiing alleen het kanaal identificeert.

Bij het opbouwen van geneste voltooiingsbevindingen wordt de aggregatie van voltooiingen van kinderen beperkt tot de huidige uitvoering van de aanvrager, zodat verouderde uitvoer van kinderen uit eerdere uitvoeringen niet in de huidige aankondiging terechtkomt. Aankondigingsantwoorden behouden waar beschikbaar de routering van threads/onderwerpen via kanaaladapters.

### Aankondigingscontext

De aankondigingscontext wordt genormaliseerd naar een stabiel intern gebeurtenisblok:

| Veld              | Bron                                                                                                              |
| ----------------- | ----------------------------------------------------------------------------------------------------------------- |
| Bron              | `subagent` of `cron`                                                                                              |
| Sessie-id's       | Sessiesleutel/-id van het kind                                                                                    |
| Type              | Aankondigingstype + taaklabel                                                                                     |
| Status            | Afgeleid van het uitvoeringsresultaat (`ok`, `error`, `timeout` of `unknown`) — **niet** afgeleid uit modeltekst |
| Resultaatinhoud   | Recentste zichtbare assistenttekst van het kind                                                                   |
| Vervolgactie      | Instructie die beschrijft wanneer wel of niet moet worden geantwoord                                              |

Mislukte definitieve uitvoeringen rapporteren de foutstatus zonder vastgelegde antwoordtekst opnieuw af te spelen. Uitvoer van tools/`toolResult` wordt niet opgenomen in de resultaattekst van het kind.

### Statistiekregel

Aankondigingspayloads bevatten aan het einde een statistiekregel (ook wanneer ze zijn ingepakt):

- Uitvoeringstijd (bijvoorbeeld `runtime 5m12s`).
- Tokengebruik (invoer/uitvoer/totaal).
- Geschatte kosten wanneer modelprijzen zijn geconfigureerd (`models.providers.*.models[].cost`).
- `sessionKey`, `sessionId` en het transcriptpad, zodat de hoofdagent de geschiedenis via `sessions_history` kan ophalen of het bestand op schijf kan inspecteren.

Interne metadata zijn uitsluitend bedoeld voor orchestratie; gebruikersgerichte antwoorden moeten in normale assistenttaal worden herschreven.

### Waarom `sessions_history` de voorkeur heeft

`sessions_history` is het veiligere orchestratiepad om binnen een agentbeurt het transcript van een kind te lezen:

- Maskeert tekst die op aanmeldgegevens/tokens lijkt, zelfs wanneer algemene logmaskering is uitgeschakeld.
- Kapt lange tekstblokken af (4000 tekens per blok) en verwijdert denksignaturen, payloads voor het opnieuw afspelen van redeneringen en inline afbeeldingsgegevens.
- Dwingt een responslimiet van 80 KB af; te grote rijen worden vervangen door `[sessions_history omitted: message too large]`.
- Gebruik `nextOffset` wanneer dit aanwezig is om terug te bladeren door oudere transcriptvensters.
- `sessions_history` verwijdert **geen** redeneringstags, `<relevant-memories>`-structuren of XML van toolaanroepen uit berichttekst — het retourneert gestructureerde inhoudsblokken die dicht bij de ruwe transcriptvorm blijven, maar dan gemaskeerd en in omvang begrensd. `/subagents log` past de zwaardere prozafilter toe (verwijdert redeneringstags, geheugenstructuren en XML van toolaanroepen), omdat het gewone chatregels weergeeft in plaats van gestructureerde blokken.
- Inspectie van het ruwe transcript op schijf is de terugvaloptie wanneer je het volledige byte-voor-byte-transcript nodig hebt.

## Toolbeleid

Subagenten gebruiken eerst dezelfde profiel- en toolbeleidspijplijn als de ouder- of doelagent. Daarna past OpenClaw de beperkingslaag voor subagenten toe.

Subagenten verliezen altijd `gateway`, `agents_list`, `session_status` en
`cron`, ongeacht diepte of rol (tools op systeemniveau/interactieve tools, of tools die de hoofdagent moet coördineren). Subagenten die eindwerker zijn (standaardgedrag op diepte 1 en altijd op diepte 2) verliezen daarnaast `subagents`,
`sessions_list`, `sessions_history` en `sessions_spawn`. Subagenten krijgen nooit de tool `message` — deze wordt tijdens het starten uitgeschakeld en niet door deze weigeringslijst gefilterd — en `sessions_send` blijft geweigerd, zodat subagenten uitsluitend via de aankondigingsketen communiceren.

`sessions_history` blijft ook hier een begrensde, opgeschoonde weergave om informatie terug te halen — het is geen ruwe transcriptdump.

Wanneer `maxSpawnDepth >= 2` ontvangen orchestrator-subagenten op diepte 1 daarnaast `sessions_spawn`, `subagents`, `sessions_list` en
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
        // deny wins
        deny: ["gateway", "cron"],
        // if allow is set, it becomes allow-only (deny still wins)
        // allow: ["read", "exec", "process"]
      },
    },
  },
}
```

`tools.subagents.tools.allow` is een definitief filter dat alleen toestaat wat expliciet is toegestaan. Het kan de reeds bepaalde toolset beperken, maar kan geen tool **terugtoevoegen** die door `tools.profile` is verwijderd. Zo bevat `tools.profile: "coding"`
`web_search`/`web_fetch`, maar niet de tool `browser`. Om subagenten met het coderingsprofiel browserautomatisering te laten gebruiken, voeg je de browser toe in de profielfase:

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

Subagenten gebruiken een afzonderlijke wachtrijbaan binnen het proces:

- **Baannaam:** `subagent`
- **Gelijktijdigheid:** `agents.defaults.subagents.maxConcurrent` (standaard `8`)

## Levendigheid en herstel

OpenClaw beschouwt het ontbreken van `endedAt` niet als permanent bewijs dat een subagent nog actief is. Niet-beëindigde uitvoeringen die ouder zijn dan het venster voor verouderde uitvoeringen (2 uur, of de geconfigureerde uitvoeringstime-out plus een korte respijtperiode, afhankelijk van welke langer is) tellen niet langer als actief/in afwachting in `/subagents list`, statusoverzichten, voltooiingsblokkering voor afstammelingen en gelijktijdigheidscontroles per sessie.

Na een herstart van de Gateway worden verouderde, niet-beëindigde herstelde uitvoeringen verwijderd, tenzij hun onderliggende sessie is gemarkeerd met `abortedLastRun: true`. Door een herstart afgebroken uitvoeringen blijven geregistreerd voor de herstelstroom voor verweesde subagenten: verouderde uitvoeringen worden definitief afgerond zonder hervatting, terwijl recente onderliggende sessies een synthetisch hervattingsbericht ontvangen voordat de afbreekmarkering wordt gewist.

Automatisch herstel na een herstart is per onderliggende sessie begrensd. Als hetzelfde subagentkind binnen het venster voor snelle herhaalde blokkering meermaals voor herstel van verweesde uitvoeringen wordt geaccepteerd, slaat OpenClaw een herstelgrafsteen op in die sessie en stopt het met automatisch hervatten bij latere herstarts. Voer
`openclaw tasks maintenance --apply` uit om de taakregistratie te herstellen, of
`openclaw doctor --fix` om verouderde afgebroken herstelmarkeringen te wissen voor sessies met een grafsteen.

<Note>
Als het starten van een subagent mislukt met Gateway `PAIRING_REQUIRED` /
`scope-upgrade`, controleer dan de RPC-aanroeper voordat je de koppelingsstatus bewerkt.
Interne coördinatie via `sessions_spawn` wordt binnen het proces afgehandeld wanneer de aanroeper al binnen de aanvraagcontext van de Gateway draait, zodat er geen local loopback-WebSocket wordt geopend en er geen afhankelijkheid is van de basisomvang van het gekoppelde CLI-apparaat. Aanroepers buiten het Gateway-proces gebruiken nog steeds de WebSocket-terugvaloptie als `client.id: "gateway-client"` met `client.mode: "backend"`
via directe local loopback-authenticatie met een gedeeld token/wachtwoord. Externe aanroepers, expliciete
`deviceIdentity`, expliciete apparaat-tokenpaden en browser-/nodeclients
hebben nog steeds normale apparaatgoedkeuring nodig voor bereikuitbreidingen.
</Note>

## Stoppen

- Het verzenden van `/stop` in de chat van de aanvrager breekt de aanvragerssessie af en stopt alle actieve subagentuitvoeringen die daaruit zijn gestart, waarbij dit doorwerkt naar geneste kinderen.

## Beperkingen

- Aankondigingen van subagenten worden uitgevoerd op basis van **best effort**. Als de Gateway opnieuw wordt gestart, gaan wachtende taken voor 'terugmelden' verloren.
- Subagenten delen nog steeds dezelfde procesresources van de Gateway; beschouw `maxConcurrent` als een veiligheidsklep.
- `sessions_spawn` is altijd niet-blokkerend: het retourneert onmiddellijk `{ status: "accepted", runId, childSessionKey }`.
- In de context van subagenten worden alleen `AGENTS.md` en `TOOLS.md` geïnjecteerd (geen `SOUL.md`, `IDENTITY.md`, `USER.md`, `MEMORY.md`, `HEARTBEAT.md` of `BOOTSTRAP.md`). Codex-eigen subagenten volgen dezelfde grens: `TOOLS.md` blijft in de overgenomen instructies van de Codex-thread, terwijl persona-, identiteits- en gebruikersbestanden die uitsluitend voor de ouder gelden, worden geïnjecteerd als samenwerkingsinstructies die tot de huidige beurt beperkt zijn, zodat onderliggende agenten ze niet klonen.
- De maximale nestingsdiepte is 5 (bereik van `maxSpawnDepth`: 1-5). Diepte 2 wordt voor de meeste toepassingen aanbevolen.
- `maxChildrenPerAgent` beperkt het aantal actieve onderliggende agenten per sessie (standaard `5`, bereik `1-20`).

## Gerelateerd

- [Sessietools en statuswijzigingen](/nl/concepts/session-tool)
- [ACP-agenten](/nl/tools/acp-agents)
- [Verzenden door agent](/nl/tools/agent-send)
- [Achtergrondtaken](/nl/automation/tasks)
- [Sandboxtools voor meerdere agenten](/nl/tools/multi-agent-sandbox-tools)
