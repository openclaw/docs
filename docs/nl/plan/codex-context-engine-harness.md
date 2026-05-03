---
read_when:
    - Je integreert levenscyclusgedrag van de context-engine in de Codex-omgeving
    - Je hebt lossless-claw of een andere context-engine-Plugin nodig om met ingesloten codex/*-harness-sessies te werken
    - Je vergelijkt het contextgedrag van ingebedde PI en de Codex-appserver
summary: Specificatie om de meegeleverde Codex app-server-harness OpenClaw context-engine-plugins te laten respecteren
title: Codex Harness Context Engine-port
x-i18n:
    generated_at: "2026-05-03T11:12:25Z"
    model: gpt-5.5
    provider: openai
    source_hash: 6575c25973d43c04cada6157e39c52ea5ad1cc60171cf801fe36cbb9c54c9237
    source_path: plan/codex-context-engine-harness.md
    workflow: 16
---

## Status

Concept-implementatiespecificatie.

## Doel

Laat het gebundelde Codex app-server-harnas hetzelfde OpenClaw context-engine-levenscycluscontract naleven dat ingebedde PI-beurten al naleven.

Een sessie die `agents.defaults.embeddedHarness.runtime: "codex"` of een `codex/*`-model gebruikt, moet de geselecteerde context-engine-Plugin, zoals `lossless-claw`, nog steeds contextassemblage, post-turn ingest, onderhoud en OpenClaw-niveau Compaction-beleid laten beheren voor zover de Codex app-server-grens dat toestaat.

## Niet-doelen

- Implementeer Codex app-server-internals niet opnieuw.
- Laat Codex native thread Compaction geen lossless-claw-samenvatting produceren.
- Vereis niet dat niet-Codex-modellen het Codex-harnas gebruiken.
- Wijzig ACP/acpx-sessiegedrag niet. Deze specificatie is alleen voor het niet-ACP embedded agent-harnaspad.
- Laat derdepartijplugins geen Codex app-server-extensiefactories registreren; de bestaande vertrouwensgrens voor gebundelde Plugins blijft ongewijzigd.

## Huidige architectuur

De embedded run-loop lost de geconfigureerde context engine eenmaal per run op voordat een concreet low-level harnas wordt geselecteerd:

- `src/agents/pi-embedded-runner/run.ts`
  - initialiseert context-engine-Plugins
  - roept `resolveContextEngine(params.config)` aan
  - geeft `contextEngine` en `contextTokenBudget` door aan `runEmbeddedAttemptWithBackend(...)`

`runEmbeddedAttemptWithBackend(...)` delegeert aan het geselecteerde agentharnas:

- `src/agents/pi-embedded-runner/run/backend.ts`
- `src/agents/harness/selection.ts`

Het Codex app-server-harnas wordt geregistreerd door de gebundelde Codex-Plugin:

- `extensions/codex/index.ts`
- `extensions/codex/harness.ts`

De implementatie van het Codex-harnas ontvangt dezelfde `EmbeddedRunAttemptParams` als PI-backed pogingen:

- `extensions/codex/src/app-server/run-attempt.ts`

Dat betekent dat het vereiste hookpunt in door OpenClaw beheerde code zit. De externe grens is het Codex app-server-protocol zelf: OpenClaw kan bepalen wat het naar `thread/start`, `thread/resume` en `turn/start` stuurt en kan meldingen observeren, maar het kan Codex' interne threadopslag of native compactor niet wijzigen.

## Huidige tekortkoming

Embedded PI-pogingen roepen de context-engine-levenscyclus rechtstreeks aan:

- bootstrap/onderhoud vóór de poging
- assemblage vóór de modelaanroep
- afterTurn of ingest na de poging
- onderhoud na een succesvolle beurt
- context-engine Compaction voor engines die Compaction beheren

Relevante PI-code:

- `src/agents/pi-embedded-runner/run/attempt.ts`
- `src/agents/pi-embedded-runner/run/attempt.context-engine-helpers.ts`
- `src/agents/pi-embedded-runner/context-engine-maintenance.ts`

Codex app-server-pogingen voeren momenteel generieke agentharnas-hooks uit en spiegelen het transcript, maar roepen `params.contextEngine.bootstrap`, `params.contextEngine.assemble`, `params.contextEngine.afterTurn`, `params.contextEngine.ingestBatch`, `params.contextEngine.ingest` of `params.contextEngine.maintain` niet aan.

Relevante Codex-code:

- `extensions/codex/src/app-server/run-attempt.ts`
- `extensions/codex/src/app-server/thread-lifecycle.ts`
- `extensions/codex/src/app-server/event-projector.ts`
- `extensions/codex/src/app-server/compact.ts`

## Gewenst gedrag

Voor Codex-harnasbeurten moet OpenClaw deze levenscyclus behouden:

1. Lees het gespiegelde OpenClaw-sessietranscript.
2. Bootstrap de actieve context engine wanneer een vorig sessiebestand bestaat.
3. Voer bootstrap-onderhoud uit wanneer beschikbaar.
4. Assembleer context met de actieve context engine.
5. Zet de geassembleerde context om naar Codex-compatibele invoer.
6. Start of hervat de Codex-thread met developer instructions die eventuele context-engine `systemPromptAddition` bevatten.
7. Start de Codex-beurt met de geassembleerde gebruikersgerichte prompt.
8. Spiegel het Codex-resultaat terug naar het OpenClaw-transcript.
9. Roep `afterTurn` aan als dit is geïmplementeerd, anders `ingestBatch`/`ingest`, met de gespiegelde transcriptsnapshot.
10. Voer beurt-onderhoud uit na succesvolle niet-afgebroken beurten.
11. Behoud Codex native Compaction-signalen en OpenClaw Compaction-hooks.

## Ontwerpbeperkingen

### Codex app-server blijft canoniek voor native threadstatus

Codex beheert zijn native thread en eventuele interne uitgebreide geschiedenis. OpenClaw moet niet proberen de interne geschiedenis van de app-server te muteren behalve via ondersteunde protocolaanroepen.

OpenClaw's transcriptspiegel blijft de bron voor OpenClaw-functionaliteit:

- chatgeschiedenis
- zoeken
- `/new`- en `/reset`-boekhouding
- toekomstige model- of harnaswisseling
- context-engine-Pluginstatus

### Context-engine-assemblage moet naar Codex-invoer worden geprojecteerd

De context-engine-interface retourneert OpenClaw `AgentMessage[]`, geen Codex-threadpatch. Codex app-server `turn/start` accepteert een huidige gebruikersinvoer, terwijl `thread/start` en `thread/resume` developer instructions accepteren.

Daarom heeft de implementatie een projectielaag nodig. De veilige eerste versie moet niet doen alsof ze Codex interne geschiedenis kan vervangen. Ze moet geassembleerde context injecteren als deterministisch prompt-/developer-instruction-materiaal rond de huidige beurt.

### Prompt-cache-stabiliteit is belangrijk

Voor engines zoals lossless-claw moet de geassembleerde context deterministisch zijn voor ongewijzigde invoer. Voeg geen timestamps, willekeurige ids of niet-deterministische ordening toe aan gegenereerde contexttekst.

### Runtime-selectiesemantiek verandert niet

Harnasselectie blijft zoals die is:

- `runtime: "pi"` forceert PI
- `runtime: "codex"` selecteert het geregistreerde Codex-harnas
- `runtime: "auto"` laat Plugin-harnassen ondersteunde providers claimen
- niet-gematchte `auto`-runs gebruiken PI

Dit werk verandert wat er gebeurt nadat het Codex-harnas is geselecteerd.

## Implementatieplan

### 1. Exporteer of verplaats herbruikbare context-engine-pogingshelpers

Vandaag staan de herbruikbare levenscyclushelpers onder de PI-runner:

- `src/agents/pi-embedded-runner/run/attempt.context-engine-helpers.ts`
- `src/agents/pi-embedded-runner/run/attempt.prompt-helpers.ts`
- `src/agents/pi-embedded-runner/context-engine-maintenance.ts`

Codex moet niet importeren uit een implementatiepad waarvan de naam PI impliceert als we dat kunnen vermijden.

Maak een harnasneutrale module, bijvoorbeeld:

- `src/agents/harness/context-engine-lifecycle.ts`

Verplaats of herexporteer:

- `runAttemptContextEngineBootstrap`
- `assembleAttemptContextEngine`
- `finalizeAttemptContextEngineTurn`
- `buildAfterTurnRuntimeContext`
- `buildAfterTurnRuntimeContextFromUsage`
- een kleine wrapper rond `runContextEngineMaintenance`

Laat PI-imports blijven werken door ofwel vanuit de oude bestanden te herexporteren of PI-call-sites in dezelfde PR bij te werken.

De neutrale helpernamen mogen PI niet noemen.

Voorgestelde namen:

- `bootstrapHarnessContextEngine`
- `assembleHarnessContextEngine`
- `finalizeHarnessContextEngineTurn`
- `buildHarnessContextEngineRuntimeContext`
- `runHarnessContextEngineMaintenance`

### 2. Voeg een Codex-contextprojectiehelper toe

Voeg een nieuwe module toe:

- `extensions/codex/src/app-server/context-engine-projection.ts`

Verantwoordelijkheden:

- Accepteer de geassembleerde `AgentMessage[]`, oorspronkelijke gespiegelde geschiedenis en huidige prompt.
- Bepaal welke context in developer instructions hoort versus huidige gebruikersinvoer.
- Behoud de huidige gebruikersprompt als het laatste uitvoerbare verzoek.
- Render eerdere berichten in een stabiel, expliciet formaat.
- Vermijd vluchtige metadata.

Voorgestelde API:

```ts
export type CodexContextProjection = {
  developerInstructionAddition?: string;
  promptText: string;
  assembledMessages: AgentMessage[];
  prePromptMessageCount: number;
};

export function projectContextEngineAssemblyForCodex(params: {
  assembledMessages: AgentMessage[];
  originalHistoryMessages: AgentMessage[];
  prompt: string;
  systemPromptAddition?: string;
}): CodexContextProjection;
```

Aanbevolen eerste projectie:

- Plaats `systemPromptAddition` in developer instructions.
- Plaats de geassembleerde transcriptcontext vóór de huidige prompt in `promptText`.
- Label dit duidelijk als door OpenClaw geassembleerde context.
- Houd de huidige prompt als laatste.
- Sluit dubbele huidige gebruikersprompt uit als die al aan het einde staat.

Voorbeeld van promptvorm:

```text
OpenClaw assembled context for this turn:

<conversation_context>
[user]
...

[assistant]
...
</conversation_context>

Current user request:
...
```

Dit is minder elegant dan native Codex-geschiedenismanipulatie, maar het is implementeerbaar binnen OpenClaw en behoudt context-engine-semantiek.

Toekomstige verbetering: als Codex app-server een protocol blootstelt voor het vervangen of aanvullen van threadgeschiedenis, pas deze projectielaag dan aan om die API te gebruiken.

### 3. Wire bootstrap vóór Codex-threadstartup

In `extensions/codex/src/app-server/run-attempt.ts`:

- Lees gespiegelde sessiegeschiedenis zoals vandaag.
- Bepaal of het sessiebestand vóór deze run bestond. Geef de voorkeur aan een helper die `fs.stat(params.sessionFile)` controleert vóór spiegelingswrites.
- Open een `SessionManager` of gebruik een smalle session manager-adapter als de helper dat vereist.
- Roep de neutrale bootstraphelper aan wanneer `params.contextEngine` bestaat.

Pseudo-flow:

```ts
const hadSessionFile = await fileExists(params.sessionFile);
const sessionManager = SessionManager.open(params.sessionFile);
const historyMessages = sessionManager.buildSessionContext().messages;

await bootstrapHarnessContextEngine({
  hadSessionFile,
  contextEngine: params.contextEngine,
  sessionId: params.sessionId,
  sessionKey: sandboxSessionKey,
  sessionFile: params.sessionFile,
  sessionManager,
  runtimeContext: buildHarnessContextEngineRuntimeContext(...),
  runMaintenance: runHarnessContextEngineMaintenance,
  warn,
});
```

Gebruik dezelfde `sessionKey`-conventie als de Codex-toolbridge en transcriptspiegel. Vandaag berekent Codex `sandboxSessionKey` uit `params.sessionKey` of `params.sessionId`; gebruik dat consistent tenzij er een reden is om ruwe `params.sessionKey` te behouden.

### 4. Wire assemble vóór `thread/start` / `thread/resume` en `turn/start`

In `runCodexAppServerAttempt`:

1. Bouw eerst dynamic tools, zodat de context engine de daadwerkelijk beschikbare toolnamen ziet.
2. Lees gespiegelde sessiegeschiedenis.
3. Voer context-engine `assemble(...)` uit wanneer `params.contextEngine` bestaat.
4. Projecteer het geassembleerde resultaat naar:
   - developer instruction-toevoeging
   - prompttekst voor `turn/start`

De bestaande hookaanroep:

```ts
resolveAgentHarnessBeforePromptBuildResult({
  prompt: params.prompt,
  developerInstructions: buildDeveloperInstructions(params),
  messages: historyMessages,
  ctx: hookContext,
});
```

moet context-aware worden:

1. bereken basis-developer instructions met `buildDeveloperInstructions(params)`
2. pas context-engine-assemblage/-projectie toe
3. voer `before_prompt_build` uit met de geprojecteerde prompt/developer instructions

Deze volgorde laat generieke prompty-hooks dezelfde prompt zien die Codex zal ontvangen. Als we strikte PI-pariteit nodig hebben, voer context-engine-assemblage dan uit vóór hookcompositie, omdat PI context-engine `systemPromptAddition` toepast op de uiteindelijke system prompt na de promptpipeline. De belangrijke invariant is dat zowel context engine als hooks een deterministische, gedocumenteerde volgorde krijgen.

Aanbevolen volgorde voor de eerste implementatie:

1. `buildDeveloperInstructions(params)`
2. context-engine `assemble()`
3. voeg `systemPromptAddition` toe aan developer instructions
4. projecteer geassembleerde berichten naar prompttekst
5. `resolveAgentHarnessBeforePromptBuildResult(...)`
6. geef uiteindelijke developer instructions door aan `startOrResumeThread(...)`
7. geef uiteindelijke prompttekst door aan `buildTurnStartParams(...)`

De specificatie moet in tests worden vastgelegd zodat toekomstige wijzigingen de volgorde niet per ongeluk veranderen.

### 5. Behoud prompt-cache-stabiele formattering

De projectiehelper moet byte-stabiele output produceren voor identieke invoer:

- stabiele berichtvolgorde
- stabiele rollabels
- geen gegenereerde timestamps
- geen lekkage van object-key-volgorde
- geen willekeurige scheidingstekens
- geen per-run ids

Gebruik vaste scheidingstekens en expliciete secties.

### 6. Wire post-turn na transcriptspiegeling

Codex' `CodexAppServerEventProjector` bouwt een lokale `messagesSnapshot` voor de
huidige beurt. `mirrorTranscriptBestEffort(...)` schrijft die snapshot naar de
OpenClaw-transcriptmirror.

Roep nadat spiegelen slaagt of mislukt de finalizer van de context-engine aan met de
best beschikbare berichtsnapshot:

- Geef de voorkeur aan volledige gespiegelde sessiecontext na het schrijven, omdat `afterTurn`
  de sessiesnapshot verwacht, niet alleen de huidige beurt.
- Val terug op `historyMessages + result.messagesSnapshot` als het sessiebestand
  niet opnieuw kan worden geopend.

Pseudo-flow:

```ts
const prePromptMessageCount = historyMessages.length;
await mirrorTranscriptBestEffort(...);
const finalMessages = readMirroredSessionHistoryMessages(params.sessionFile)
  ?? [...historyMessages, ...result.messagesSnapshot];

await finalizeHarnessContextEngineTurn({
  contextEngine: params.contextEngine,
  promptError: Boolean(finalPromptError),
  aborted: finalAborted,
  yieldAborted,
  sessionIdUsed: params.sessionId,
  sessionKey: sandboxSessionKey,
  sessionFile: params.sessionFile,
  messagesSnapshot: finalMessages,
  prePromptMessageCount,
  tokenBudget: params.contextTokenBudget,
  runtimeContext: buildHarnessContextEngineRuntimeContextFromUsage({
    attempt: params,
    workspaceDir: effectiveWorkspace,
    agentDir,
    tokenBudget: params.contextTokenBudget,
    lastCallUsage: result.attemptUsage,
    promptCache: result.promptCache,
  }),
  runMaintenance: runHarnessContextEngineMaintenance,
  sessionManager,
  warn,
});
```

Als spiegelen mislukt, roep `afterTurn` dan nog steeds aan met de fallback-snapshot, maar log
dat de context-engine invoert vanuit fallback-beurtgegevens.

### 7. Normaliseer gebruik en prompt-cache-runtimecontext

Codex-resultaten bevatten genormaliseerd gebruik uit app-server-tokenmeldingen wanneer
beschikbaar. Geef dat gebruik door aan de runtimecontext van de context-engine.

Als Codex app-server uiteindelijk details voor cachelezen/-schrijven beschikbaar maakt, map die dan naar
`ContextEnginePromptCacheInfo`. Laat tot die tijd `promptCache` weg in plaats van
nullen te verzinnen.

### 8. Compaction-beleid

Er zijn twee Compaction-systemen:

1. OpenClaw context-engine `compact()`
2. Codex app-server native `thread/compact/start`

Voeg ze niet stilzwijgend samen.

#### `/compact` en expliciete OpenClaw Compaction

Wanneer de geselecteerde context-engine `info.ownsCompaction === true` heeft, moet expliciete
OpenClaw Compaction de voorkeur geven aan het `compact()`-resultaat van de context-engine voor
de OpenClaw-transcriptmirror en Plugin-status.

Wanneer de geselecteerde Codex-harness een native thread-binding heeft, kunnen we aanvullend
Codex-native Compaction aanvragen om de app-server-thread gezond te houden, maar dit
moet in details als aparte backendactie worden gerapporteerd.

Aanbevolen gedrag:

- Als `contextEngine.info.ownsCompaction === true`:
  - roep eerst context-engine `compact()` aan
  - roep daarna best-effort Codex-native Compaction aan wanneer er een thread-binding bestaat
  - retourneer het context-engine-resultaat als primair resultaat
  - neem de status van Codex-native Compaction op in `details.codexNativeCompaction`
- Als de actieve context-engine geen eigenaar is van Compaction:
  - behoud het huidige gedrag voor Codex-native Compaction

Dit vereist waarschijnlijk een wijziging in `extensions/codex/src/app-server/compact.ts` of
een wrapper vanuit het generieke Compaction-pad, afhankelijk van waar
`maybeCompactAgentHarnessSession(...)` wordt aangeroepen.

#### Codex-native contextCompaction-events tijdens een beurt

Codex kan tijdens een beurt `contextCompaction`-itemevents uitsturen. Behoud de huidige
emissie van before/after-Compaction-hooks in `event-projector.ts`, maar behandel
dat niet als een voltooide context-engine-Compaction.

Voor engines die eigenaar zijn van Compaction, stuur een expliciete diagnose uit wanneer Codex toch
native Compaction uitvoert:

- stream-/eventnaam: bestaande `compaction`-stream is acceptabel
- details: `{ backend: "codex-app-server", ownsCompaction: true }`

Dit maakt de scheiding controleerbaar.

### 9. Sessiereset en bindingsgedrag

De bestaande Codex-harness `reset(...)` wist de Codex app-server-binding uit
het OpenClaw-sessiebestand. Behoud dat gedrag.

Zorg er ook voor dat het opschonen van context-engine-status via bestaande
OpenClaw-sessielevenscycluspaden blijft verlopen. Voeg geen Codex-specifieke cleanup toe tenzij de
context-enginelevenscyclus momenteel reset-/delete-events voor alle harnesses mist.

### 10. Foutafhandeling

Volg PI-semantiek:

- bootstrap-fouten waarschuwen en gaan door
- assemble-fouten waarschuwen en vallen terug op niet-geassembleerde pipelineberichten/-prompt
- afterTurn-/ingest-fouten waarschuwen en markeren post-turn-finalisatie als mislukt
- onderhoud draait alleen na geslaagde, niet-afgebroken, niet-yield-beurten
- Compaction-fouten mogen niet opnieuw worden geprobeerd als verse prompts

Codex-specifieke toevoegingen:

- Als contextprojectie mislukt, waarschuw en val terug op de oorspronkelijke prompt.
- Als transcriptspiegeling mislukt, probeer nog steeds context-engine-finalisatie met
  fallbackberichten.
- Als Codex-native Compaction mislukt nadat context-engine-Compaction is geslaagd,
  laat dan niet de hele OpenClaw-Compaction mislukken wanneer de context-engine primair is.

## Testplan

### Unittests

Voeg tests toe onder `extensions/codex/src/app-server`:

1. `run-attempt.context-engine.test.ts`
   - Codex roept `bootstrap` aan wanneer er een sessiebestand bestaat.
   - Codex roept `assemble` aan met gespiegelde berichten, tokenbudget, toolnamen,
     citatiemodus, model-id en prompt.
   - `systemPromptAddition` wordt opgenomen in ontwikkelaarsinstructies.
   - Geassembleerde berichten worden vóór het huidige verzoek in de prompt geprojecteerd.
   - Codex roept `afterTurn` aan na transcriptspiegeling.
   - Zonder `afterTurn` roept Codex `ingestBatch` of per-bericht `ingest` aan.
   - Beurtonderhoud draait na geslaagde beurten.
   - Beurtonderhoud draait niet bij promptfout, abort of yield-abort.

2. `context-engine-projection.test.ts`
   - stabiele output voor identieke invoer
   - geen dubbele huidige prompt wanneer geassembleerde geschiedenis die bevat
   - verwerkt lege geschiedenis
   - behoudt rolvolgorde
   - neemt system prompt-toevoeging alleen op in ontwikkelaarsinstructies

3. `compact.context-engine.test.ts`
   - primair resultaat van context-engine met eigenaarschap wint
   - status van Codex-native Compaction verschijnt in details wanneer die ook wordt geprobeerd
   - native Codex-fout laat Compaction van de eigenaar-context-engine niet mislukken
   - niet-eigenaar-context-engine behoudt huidig native Compaction-gedrag

### Bestaande tests om bij te werken

- `extensions/codex/src/app-server/run-attempt.test.ts` indien aanwezig, anders
  de dichtstbijzijnde Codex app-server-runtests.
- `extensions/codex/src/app-server/event-projector.test.ts` alleen als Compaction-
  eventdetails wijzigen.
- `src/agents/harness/selection.test.ts` zou geen wijzigingen nodig moeten hebben tenzij config-
  gedrag wijzigt; die moet stabiel blijven.
- PI-context-engine-tests moeten ongewijzigd blijven slagen.

### Integratie-/livetests

Voeg live Codex-harness-smoketests toe of breid ze uit:

- configureer `plugins.slots.contextEngine` naar een testengine
- configureer `agents.defaults.model` naar een `codex/*`-model
- configureer `agents.defaults.embeddedHarness.runtime = "codex"`
- assert dat testengine observeerde:
  - bootstrap
  - assemble
  - afterTurn of ingest
  - onderhoud

Vereis geen lossless-claw in OpenClaw-coretests. Gebruik een kleine in-repo nep-
context-engine-Plugin.

## Observability

Voeg debuglogs toe rond Codex context-engine-levenscyclusaanroepen:

- `codex context engine bootstrap started/completed/failed`
- `codex context engine assemble applied`
- `codex context engine finalize completed/failed`
- `codex context engine maintenance skipped` met reden
- `codex native compaction completed alongside context-engine compaction`

Log geen volledige prompts of transcriptinhoud.

Voeg gestructureerde velden toe waar nuttig:

- `sessionId`
- `sessionKey` geredigeerd of weggelaten volgens bestaande loggingpraktijk
- `engineId`
- `threadId`
- `turnId`
- `assembledMessageCount`
- `estimatedTokens`
- `hasSystemPromptAddition`

## Migratie / compatibiliteit

Dit moet achterwaarts compatibel zijn:

- Als er geen context-engine is geconfigureerd, moet legacy context-engine-gedrag
  gelijkwaardig zijn aan het huidige Codex-harnessgedrag.
- Als context-engine `assemble` mislukt, moet Codex doorgaan met het oorspronkelijke
  promptpad.
- Bestaande Codex-threadbindings moeten geldig blijven.
- Dynamische tool-fingerprinting mag geen context-engine-output bevatten; anders
  zou elke contextwijziging een nieuwe Codex-thread kunnen afdwingen. Alleen de toolcatalogus
  mag de dynamische tool-fingerprint beïnvloeden.

## Open vragen

1. Moet geassembleerde context volledig in de gebruikersprompt worden geïnjecteerd, volledig
   in ontwikkelaarsinstructies, of gesplitst?

   Aanbeveling: splitsen. Plaats `systemPromptAddition` in ontwikkelaarsinstructies;
   plaats geassembleerde transcriptcontext in de gebruikersprompt-wrapper. Dit sluit het best aan op
   het huidige Codex-protocol zonder native threadgeschiedenis te muteren.

2. Moet Codex-native Compaction worden uitgeschakeld wanneer een context-engine eigenaar is van
   Compaction?

   Aanbeveling: nee, niet aanvankelijk. Codex-native Compaction kan nog steeds
   nodig zijn om de app-server-thread in leven te houden. Maar het moet worden gerapporteerd als
   native Codex-Compaction, niet als context-engine-Compaction.

3. Moet `before_prompt_build` vóór of na context-engine-assembly draaien?

   Aanbeveling: na context-engine-projectie voor Codex, zodat generieke harness-
   hooks de werkelijke prompt/ontwikkelaarsinstructies zien die Codex zal ontvangen. Als PI-
   pariteit het tegenovergestelde vereist, leg de gekozen volgorde vast in tests en documenteer die
   hier.

4. Kan Codex app-server een toekomstige gestructureerde context-/geschiedenis-override accepteren?

   Onbekend. Als dat kan, vervang de tekstprojectielaag dan door dat protocol en
   laat de levenscyclusaanroepen ongewijzigd.

## Acceptatiecriteria

- Een `codex/*` embedded harness-beurt roept de assemble-levenscyclus van de geselecteerde
  context-engine aan.
- Een context-engine `systemPromptAddition` beïnvloedt Codex-ontwikkelaarsinstructies.
- Geassembleerde context beïnvloedt de Codex-beurtinvoer deterministisch.
- Geslaagde Codex-beurten roepen `afterTurn` of ingest-fallback aan.
- Geslaagde Codex-beurten draaien context-engine-beurtonderhoud.
- Mislukte/afgebroken/yield-afgebroken beurten draaien geen beurtonderhoud.
- Context-engine-owned Compaction blijft primair voor OpenClaw-/Plugin-status.
- Codex-native Compaction blijft controleerbaar als native Codex-gedrag.
- Bestaand PI-context-engine-gedrag blijft ongewijzigd.
- Bestaand Codex-harnessgedrag blijft ongewijzigd wanneer er geen niet-legacy context-engine
  is geselecteerd of wanneer assembly mislukt.
