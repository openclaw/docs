---
read_when:
    - Je sluit lifecycle-gedrag van de context-engine aan op de Codex-harness
    - Je hebt lossless-claw of een andere context-engine-Plugin nodig om met ingebedde testharnas-sessies van codex/* te werken
    - Je vergelijkt het contextgedrag van ingebedde PI en de Codex-appserver
summary: Specificatie om de gebundelde Codex-app-serverharnas OpenClaw context-engine-plugins te laten honoreren
title: Portering van de contextengine naar Codex Harness
x-i18n:
    generated_at: "2026-04-29T22:58:38Z"
    model: gpt-5.5
    provider: openai
    source_hash: 61c29a6cd8955a41510b8da1575b89ed003565d564b25b37b3b0c7f65df6b663
    source_path: plan/codex-context-engine-harness.md
    workflow: 16
---

## Status

Conceptimplementatiespecificatie.

## Doel

Laat het gebundelde Codex app-server-harnas hetzelfde OpenClaw context-engine-levenscycluscontract naleven dat ingebedde PI-beurten al naleven.

Een sessie die `agents.defaults.embeddedHarness.runtime: "codex"` of een `codex/*`-model gebruikt, moet de geselecteerde context-engine-Plugin, zoals `lossless-claw`, nog steeds contextassemblage, ingestie na de beurt, onderhoud en OpenClaw-niveau Compaction-beleid laten beheren voor zover de Codex app-server-grens dat toestaat.

## Niet-doelen

- Implementeer de internals van de Codex app-server niet opnieuw.
- Laat native thread-Compaction van Codex geen lossless-claw-samenvatting produceren.
- Vereis niet dat niet-Codex-modellen het Codex-harnas gebruiken.
- Wijzig ACP/acpx-sessiegedrag niet. Deze specificatie is alleen voor het niet-ACP-pad van het ingebedde agentharnas.
- Laat externe plugins geen Codex app-server-uitbreidingsfactories registreren; de bestaande vertrouwensgrens voor gebundelde plugins blijft ongewijzigd.

## Huidige architectuur

De ingebedde runloop lost de geconfigureerde context-engine één keer per run op voordat een concreet low-level harnas wordt geselecteerd:

- `src/agents/pi-embedded-runner/run.ts`
  - initialiseert context-engine-plugins
  - roept `resolveContextEngine(params.config)` aan
  - geeft `contextEngine` en `contextTokenBudget` door aan
    `runEmbeddedAttemptWithBackend(...)`

`runEmbeddedAttemptWithBackend(...)` delegeert aan het geselecteerde agentharnas:

- `src/agents/pi-embedded-runner/run/backend.ts`
- `src/agents/harness/selection.ts`

Het Codex app-server-harnas wordt geregistreerd door de gebundelde Codex-Plugin:

- `extensions/codex/index.ts`
- `extensions/codex/harness.ts`

De implementatie van het Codex-harnas ontvangt dezelfde `EmbeddedRunAttemptParams`
als PI-ondersteunde pogingen:

- `extensions/codex/src/app-server/run-attempt.ts`

Dat betekent dat het vereiste haakpunt in door OpenClaw beheerste code zit. De externe grens is het Codex app-server-protocol zelf: OpenClaw kan beheren wat het naar `thread/start`, `thread/resume` en `turn/start` stuurt en kan meldingen observeren, maar het kan de interne threadopslag of native compactor van Codex niet wijzigen.

## Huidig hiaat

Ingebedde PI-pogingen roepen de context-engine-levenscyclus rechtstreeks aan:

- bootstrap/onderhoud vóór de poging
- assemblage vóór de modelaanroep
- afterTurn of ingestie na de poging
- onderhoud na een geslaagde beurt
- context-engine-Compaction voor engines die Compaction beheren

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
2. Bootstrap de actieve context-engine wanneer er een eerder sessiebestand bestaat.
3. Voer bootstraponderhoud uit wanneer beschikbaar.
4. Assembleer context met de actieve context-engine.
5. Zet de geassembleerde context om naar Codex-compatibele invoer.
6. Start of hervat de Codex-thread met ontwikkelaarsinstructies die eventuele context-engine-`systemPromptAddition` bevatten.
7. Start de Codex-beurt met de geassembleerde gebruikersgerichte prompt.
8. Spiegel het Codex-resultaat terug naar het OpenClaw-transcript.
9. Roep `afterTurn` aan indien geïmplementeerd, anders `ingestBatch`/`ingest`, met behulp van de gespiegelde transcriptsnapshot.
10. Voer beurtonderhoud uit na geslaagde, niet-afgebroken beurten.
11. Behoud native Compaction-signalen van Codex en OpenClaw-Compaction-hooks.

## Ontwerpbeperkingen

### Codex app-server blijft canoniek voor native threadstatus

Codex beheert zijn native thread en eventuele interne uitgebreide geschiedenis. OpenClaw mag niet proberen de interne geschiedenis van de app-server te muteren behalve via ondersteunde protocolaanroepen.

De transcriptspiegel van OpenClaw blijft de bron voor OpenClaw-functies:

- chatgeschiedenis
- zoeken
- `/new`- en `/reset`-boekhouding
- toekomstige model- of harnaswisseling
- Pluginstatus van de context-engine

### Context-engine-assemblage moet naar Codex-invoer worden geprojecteerd

De context-engine-interface retourneert OpenClaw `AgentMessage[]`, geen Codex-threadpatch. Codex app-server `turn/start` accepteert een huidige gebruikersinvoer, terwijl `thread/start` en `thread/resume` ontwikkelaarsinstructies accepteren.

Daarom heeft de implementatie een projectielaag nodig. De veilige eerste versie moet vermijden te doen alsof zij de interne geschiedenis van Codex kan vervangen. Zij moet geassembleerde context injecteren als deterministisch prompt-/ontwikkelaarsinstructiemateriaal rond de huidige beurt.

### Prompt-cache-stabiliteit is belangrijk

Voor engines zoals lossless-claw moet de geassembleerde context deterministisch zijn voor ongewijzigde invoer. Voeg geen tijdstempels, willekeurige id's of niet-deterministische ordening toe aan gegenereerde contexttekst.

### PI-fallbacksemantiek verandert niet

Harnasselectie blijft zoals die is:

- `runtime: "pi"` forceert PI
- `runtime: "codex"` selecteert het geregistreerde Codex-harnas
- `runtime: "auto"` laat Plugin-harnassen ondersteunde providers claimen
- `fallback: "none"` schakelt PI-fallback uit wanneer geen Plugin-harnas overeenkomt

Dit werk verandert wat er gebeurt nadat het Codex-harnas is geselecteerd.

## Implementatieplan

### 1. Exporteer of verplaats herbruikbare context-engine-pogingshelpers

Vandaag staan de herbruikbare levenscyclushelpers onder de PI-runner:

- `src/agents/pi-embedded-runner/run/attempt.context-engine-helpers.ts`
- `src/agents/pi-embedded-runner/run/attempt.prompt-helpers.ts`
- `src/agents/pi-embedded-runner/context-engine-maintenance.ts`

Codex zou niet moeten importeren uit een implementatiepad waarvan de naam PI impliceert als we dat kunnen vermijden.

Maak een harnasneutrale module, bijvoorbeeld:

- `src/agents/harness/context-engine-lifecycle.ts`

Verplaats of exporteer opnieuw:

- `runAttemptContextEngineBootstrap`
- `assembleAttemptContextEngine`
- `finalizeAttemptContextEngineTurn`
- `buildAfterTurnRuntimeContext`
- `buildAfterTurnRuntimeContextFromUsage`
- een kleine wrapper rond `runContextEngineMaintenance`

Laat PI-imports blijven werken door ofwel opnieuw te exporteren vanuit de oude bestanden of PI-aanroeplocaties in dezelfde PR bij te werken.

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
- Bepaal welke context in ontwikkelaarsinstructies hoort en welke in de huidige gebruikersinvoer.
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

- Plaats `systemPromptAddition` in ontwikkelaarsinstructies.
- Plaats de geassembleerde transcriptcontext vóór de huidige prompt in `promptText`.
- Label die duidelijk als door OpenClaw geassembleerde context.
- Houd de huidige prompt als laatste.
- Sluit een dubbele huidige gebruikersprompt uit als die al aan het einde staat.

Voorbeeldpromptvorm:

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

Dit is minder elegant dan native Codex-geschiedenischirurgie, maar het is implementeerbaar binnen OpenClaw en behoudt context-engine-semantiek.

Toekomstige verbetering: als Codex app-server een protocol beschikbaar stelt voor het vervangen of aanvullen van threadgeschiedenis, schakel deze projectielaag dan om naar die API.

### 3. Koppel bootstrap vóór het starten van de Codex-thread

In `extensions/codex/src/app-server/run-attempt.ts`:

- Lees de gespiegelde sessiegeschiedenis zoals vandaag.
- Bepaal of het sessiebestand vóór deze run bestond. Geef de voorkeur aan een helper die `fs.stat(params.sessionFile)` controleert vóór spiegelingsschrijfbewerkingen.
- Open een `SessionManager` of gebruik een smalle sessiemanageradapter als de helper dat vereist.
- Roep de neutrale bootstraphelper aan wanneer `params.contextEngine` bestaat.

Pseudoflow:

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

Gebruik dezelfde `sessionKey`-conventie als de Codex-toolbridge en transcriptspiegel. Vandaag berekent Codex `sandboxSessionKey` uit `params.sessionKey` of `params.sessionId`; gebruik dat consequent tenzij er een reden is om ruwe `params.sessionKey` te behouden.

### 4. Koppel assemblage vóór `thread/start` / `thread/resume` en `turn/start`

In `runCodexAppServerAttempt`:

1. Bouw eerst dynamische tools, zodat de context-engine de daadwerkelijke beschikbare toolnamen ziet.
2. Lees de gespiegelde sessiegeschiedenis.
3. Voer context-engine-`assemble(...)` uit wanneer `params.contextEngine` bestaat.
4. Projecteer het geassembleerde resultaat naar:
   - toevoeging aan ontwikkelaarsinstructies
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

moet contextbewust worden:

1. bereken basisontwikkelaarsinstructies met `buildDeveloperInstructions(params)`
2. pas context-engine-assemblage/projectie toe
3. voer `before_prompt_build` uit met de geprojecteerde prompt/ontwikkelaarsinstructies

Deze volgorde laat generieke prompthooks dezelfde prompt zien die Codex zal ontvangen. Als we strikte PI-pariteit nodig hebben, voer dan context-engine-assemblage uit vóór hookcompositie, omdat PI context-engine-`systemPromptAddition` toepast op de uiteindelijke systeemprompt na zijn promptpipeline. De belangrijke invariant is dat zowel context-engine als hooks een deterministische, gedocumenteerde volgorde krijgen.

Aanbevolen volgorde voor de eerste implementatie:

1. `buildDeveloperInstructions(params)`
2. context-engine `assemble()`
3. voeg `systemPromptAddition` toe aan ontwikkelaarsinstructies
4. projecteer geassembleerde berichten naar prompttekst
5. `resolveAgentHarnessBeforePromptBuildResult(...)`
6. geef de uiteindelijke ontwikkelaarsinstructies door aan `startOrResumeThread(...)`
7. geef de uiteindelijke prompttekst door aan `buildTurnStartParams(...)`

De specificatie moet in tests worden vastgelegd, zodat toekomstige wijzigingen de volgorde niet per ongeluk veranderen.

### 5. Behoud prompt-cache-stabiele formattering

De projectiehelper moet byte-stabiele uitvoer produceren voor identieke invoer:

- stabiele berichtvolgorde
- stabiele rollabels
- geen gegenereerde tijdstempels
- geen lekkage van object-sleutelvolgorde
- geen willekeurige scheidingstekens
- geen id's per run

Gebruik vaste scheidingstekens en expliciete secties.

### 6. Koppel post-turn na transcriptspiegeling

Codex' `CodexAppServerEventProjector` bouwt een lokale `messagesSnapshot` voor de
huidige beurt. `mirrorTranscriptBestEffort(...)` schrijft die snapshot naar de
OpenClaw-transcriptmirror.

Nadat mirroring slaagt of faalt, roep je de finalizer van de context-engine aan
met de best beschikbare berichtsnapshot:

- Geef de voorkeur aan de volledige gemirrorde sessiecontext na het schrijven, omdat `afterTurn`
  de sessiesnapshot verwacht, niet alleen de huidige beurt.
- Val terug op `historyMessages + result.messagesSnapshot` als het sessiebestand
  niet opnieuw kan worden geopend.

Pseudostroom:

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

Als mirroring faalt, roep `afterTurn` dan nog steeds aan met de fallback-snapshot, maar log
dat de context-engine gegevens opneemt uit fallback-beurtgegevens.

### 7. Gebruik en prompt-cache-runtimecontext normaliseren

Codex-resultaten bevatten genormaliseerd gebruik uit app-server-tokenmeldingen wanneer
beschikbaar. Geef dat gebruik door aan de runtimecontext van de context-engine.

Als de Codex app-server uiteindelijk cache-lees-/schrijfdetails beschikbaar maakt, map die dan naar
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

Wanneer de geselecteerde Codex-harness een native thread-binding heeft, kunnen we daarnaast
Codex native Compaction aanvragen om de app-server-thread gezond te houden, maar dit
moet als een aparte backendactie in details worden gerapporteerd.

Aanbevolen gedrag:

- Als `contextEngine.info.ownsCompaction === true`:
  - roep eerst context-engine `compact()` aan
  - roep daarna best-effort Codex native Compaction aan wanneer er een thread-binding bestaat
  - retourneer het context-engine-resultaat als het primaire resultaat
  - neem de status van Codex native Compaction op in `details.codexNativeCompaction`
- Als de actieve context-engine geen eigenaar is van Compaction:
  - behoud het huidige gedrag voor Codex native Compaction

Dit vereist waarschijnlijk een wijziging in `extensions/codex/src/app-server/compact.ts` of
een wrapper vanuit het generieke Compaction-pad, afhankelijk van waar
`maybeCompactAgentHarnessSession(...)` wordt aangeroepen.

#### In-turn Codex native contextCompaction-events

Codex kan tijdens een beurt `contextCompaction`-itemevents uitzenden. Behoud de huidige
emissie van de before/after-Compaction-hook in `event-projector.ts`, maar behandel
dat niet als een voltooide context-engine-Compaction.

Voor engines die eigenaar zijn van Compaction, emit een expliciete diagnostic wanneer Codex toch
native Compaction uitvoert:

- stream-/eventnaam: bestaande `compaction`-stream is acceptabel
- details: `{ backend: "codex-app-server", ownsCompaction: true }`

Dit maakt de scheiding auditeerbaar.

### 9. Sessiereset en bindingsgedrag

De bestaande Codex-harness `reset(...)` wist de Codex app-server-binding uit
het OpenClaw-sessiebestand. Behoud dat gedrag.

Zorg er ook voor dat opschoning van context-engine-status blijft verlopen via bestaande
OpenClaw-sessielevenscycluspaden. Voeg geen Codex-specifieke opschoning toe tenzij de
context-engine-levenscyclus momenteel reset-/delete-events mist voor alle harnesses.

### 10. Foutafhandeling

Volg PI-semantiek:

- bootstrap-fouten geven een waarschuwing en gaan door
- assemble-fouten geven een waarschuwing en vallen terug op niet-geassembleerde pipelineberichten/prompt
- afterTurn-/ingest-fouten geven een waarschuwing en markeren post-turn-finalisatie als mislukt
- maintenance draait alleen na succesvolle, niet-afgebroken, niet-yield-beurten
- Compaction-fouten mogen niet opnieuw worden geprobeerd als nieuwe prompts

Codex-specifieke toevoegingen:

- Als contextprojectie faalt, waarschuw dan en val terug op de oorspronkelijke prompt.
- Als transcriptmirroring faalt, probeer dan nog steeds context-engine-finalisatie met
  fallback-berichten.
- Als Codex native Compaction faalt nadat context-engine-Compaction is geslaagd,
  laat dan niet de hele OpenClaw Compaction mislukken wanneer de context-engine primair is.

## Testplan

### Unittests

Voeg tests toe onder `extensions/codex/src/app-server`:

1. `run-attempt.context-engine.test.ts`
   - Codex roept `bootstrap` aan wanneer er een sessiebestand bestaat.
   - Codex roept `assemble` aan met gemirrorde berichten, tokenbudget, toolnamen,
     citatiemodus, model-id en prompt.
   - `systemPromptAddition` wordt opgenomen in developerinstructies.
   - Geassembleerde berichten worden vóór de huidige aanvraag in de prompt geprojecteerd.
   - Codex roept `afterTurn` aan na transcriptmirroring.
   - Zonder `afterTurn` roept Codex `ingestBatch` of per-bericht `ingest` aan.
   - Beurtmaintenance draait na succesvolle beurten.
   - Beurtmaintenance draait niet bij promptfout, abort of yield-abort.

2. `context-engine-projection.test.ts`
   - stabiele uitvoer voor identieke invoer
   - geen dubbele huidige prompt wanneer geassembleerde geschiedenis die bevat
   - verwerkt lege geschiedenis
   - behoudt rolvolgorde
   - neemt system-prompttoevoeging alleen op in developerinstructies

3. `compact.context-engine.test.ts`
   - primair resultaat van eigenaar-context-engine wint
   - status van Codex native Compaction verschijnt in details wanneer die ook wordt geprobeerd
   - native Codex-fout laat Compaction van eigenaar-context-engine niet falen
   - niet-eigenaar-context-engine behoudt huidig native Compaction-gedrag

### Bestaande tests om bij te werken

- `extensions/codex/src/app-server/run-attempt.test.ts` indien aanwezig, anders
  dichtstbijzijnde Codex app-server-runtests.
- `extensions/codex/src/app-server/event-projector.test.ts` alleen als Compaction
  eventdetails veranderen.
- `src/agents/harness/selection.test.ts` zou geen wijzigingen nodig moeten hebben tenzij configuratiegedrag
  verandert; die moet stabiel blijven.
- PI context-engine-tests moeten ongewijzigd blijven slagen.

### Integratie- / livetests

Voeg live Codex-harness-smoketests toe of breid ze uit:

- configureer `plugins.slots.contextEngine` naar een testengine
- configureer `agents.defaults.model` naar een `codex/*`-model
- configureer `agents.defaults.embeddedHarness.runtime = "codex"`
- assert dat de testengine heeft waargenomen:
  - bootstrap
  - assemble
  - afterTurn of ingest
  - maintenance

Vereis geen lossless-claw in OpenClaw-coretests. Gebruik een kleine in-repo nep-
context-engine-Plugin.

## Observability

Voeg debuglogs toe rond lifecycle-aanroepen van de Codex context-engine:

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

Dit moet backward-compatible zijn:

- Als er geen context-engine is geconfigureerd, moet legacy context-engine-gedrag
  equivalent zijn aan het huidige Codex-harnessgedrag.
- Als context-engine `assemble` faalt, moet Codex doorgaan met het oorspronkelijke
  promptpad.
- Bestaande Codex-thread-bindings moeten geldig blijven.
- Dynamische tool-fingerprinting mag context-engine-uitvoer niet opnemen; anders
  kan elke contextwijziging een nieuwe Codex-thread afdwingen. Alleen de toolcatalogus
  mag de dynamische tool-fingerprint beïnvloeden.

## Open vragen

1. Moet geassembleerde context volledig in de gebruikersprompt worden geïnjecteerd, volledig
   in developerinstructies, of gesplitst?

   Aanbeveling: splitsen. Plaats `systemPromptAddition` in developerinstructies;
   plaats geassembleerde transcriptcontext in de wrapper van de gebruikersprompt. Dit sluit het best aan bij
   het huidige Codex-protocol zonder native threadgeschiedenis te muteren.

2. Moet Codex native Compaction worden uitgeschakeld wanneer een context-engine eigenaar is van
   Compaction?

   Aanbeveling: nee, niet initieel. Codex native Compaction kan nog steeds
   nodig zijn om de app-server-thread in leven te houden. Maar het moet worden gerapporteerd als
   native Codex Compaction, niet als context-engine-Compaction.

3. Moet `before_prompt_build` vóór of na context-engine-assembly draaien?

   Aanbeveling: na context-engine-projectie voor Codex, zodat generieke harness-
   hooks de daadwerkelijke prompt/developerinstructies zien die Codex zal ontvangen. Als PI-
   pariteit het tegenovergestelde vereist, leg de gekozen volgorde vast in tests en documenteer die
   hier.

4. Kan de Codex app-server een toekomstige gestructureerde context-/geschiedenisoverride accepteren?

   Onbekend. Als dat kan, vervang de tekstprojectielaag dan door dat protocol en
   houd de lifecycle-aanroepen ongewijzigd.

## Acceptatiecriteria

- Een `codex/*`-embedded-harnessbeurt roept de assemble-lifecycle van de geselecteerde context-engine aan.
- Een context-engine `systemPromptAddition` beïnvloedt Codex-developerinstructies.
- Geassembleerde context beïnvloedt de Codex-beurtinvoer deterministisch.
- Succesvolle Codex-beurten roepen `afterTurn` of ingest-fallback aan.
- Succesvolle Codex-beurten voeren context-engine-beurtmaintenance uit.
- Mislukte/afgebroken/yield-afgebroken beurten voeren geen beurtmaintenance uit.
- Context-engine-owned Compaction blijft primair voor OpenClaw-/Plugin-status.
- Codex native Compaction blijft auditeerbaar als native Codex-gedrag.
- Bestaand PI context-engine-gedrag blijft ongewijzigd.
- Bestaand Codex-harnessgedrag blijft ongewijzigd wanneer geen niet-legacy context-engine
  is geselecteerd of wanneer assembly faalt.
