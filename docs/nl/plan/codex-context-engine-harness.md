---
read_when:
    - Je koppelt levenscyclusgedrag van de context-engine aan de Codex-harness
    - Je hebt lossless-claw of een andere context-engine-plugin nodig om met ingebedde harness-sessies van codex/* te werken
    - Je vergelijkt het contextgedrag van embedded OpenClaw en de Codex-appserver
summary: Specificatie om de gebundelde Codex app-server-harness OpenClaw context-engine-plugins te laten respecteren
title: Codex Harness-contextengineport
x-i18n:
    generated_at: "2026-06-27T17:46:12Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: a757ee324e7937e30736ff8a82d86fec6b3fe93e837a71a69a6d0af911e9f395
    source_path: plan/codex-context-engine-harness.md
    workflow: 16
---

## Status

Concept-implementatiespecificatie.

## Doel

Laat de gebundelde Codex app-server-harness hetzelfde OpenClaw context-engine-levenscycluscontract respecteren dat ingebedde OpenClaw-beurten al respecteren.

Een sessie die provider/model `agentRuntime.id: "codex"` of een `codex/*`-model gebruikt, moet de geselecteerde context-engine-plugin, zoals `lossless-claw`, nog steeds contextassemblage, ingest na de beurt, onderhoud en OpenClaw-niveau Compaction-beleid laten beheren voor zover de Codex app-server-grens dat toestaat.

## Niet-doelen

- Implementeer Codex app-server-internals niet opnieuw.
- Laat native Codex-thread-Compaction geen lossless-claw-samenvatting produceren.
- Vereis niet dat niet-Codex-modellen de Codex-harness gebruiken.
- Wijzig het gedrag van ACP/acpx-sessies niet. Deze specificatie is alleen voor het niet-ACP-pad van de ingebedde agent-harness.
- Laat externe plugins geen Codex app-server-extensiefabrieken registreren; de bestaande vertrouwensgrens voor gebundelde plugins blijft ongewijzigd.

## Huidige architectuur

De ingebedde run-loop lost de geconfigureerde context-engine eenmaal per run op voordat een concrete low-level harness wordt geselecteerd:

- `src/agents/embedded-agent-runner/run.ts`
  - initialiseert context-engine-plugins
  - roept `resolveContextEngine(params.config)` aan
  - geeft `contextEngine` en `contextTokenBudget` door aan
    `runEmbeddedAttemptWithBackend(...)`

`runEmbeddedAttemptWithBackend(...)` delegeert naar de geselecteerde agent-harness:

- `src/agents/embedded-agent-runner/run/backend.ts`
- `src/agents/harness/selection.ts`

De Codex app-server-harness wordt geregistreerd door de gebundelde Codex Plugin:

- `extensions/codex/index.ts`
- `extensions/codex/harness.ts`

De Codex-harnessimplementatie ontvangt dezelfde `EmbeddedRunAttemptParams` als ingebouwde OpenClaw-pogingen:

- `extensions/codex/src/app-server/run-attempt.ts`

Dat betekent dat het vereiste hookpunt in door OpenClaw beheerde code zit. De externe grens is het Codex app-server-protocol zelf: OpenClaw kan beheren wat het naar `thread/start`, `thread/resume` en `turn/start` stuurt, en kan notificaties observeren, maar het kan Codex' interne threadopslag of native compactor niet wijzigen.

## Huidige kloof

Ingebouwde OpenClaw-pogingen roepen de context-engine-levenscyclus direct aan:

- bootstrap/onderhoud vóór de poging
- assemble vóór de modelaanroep
- afterTurn of ingest na de poging
- onderhoud na een geslaagde beurt
- context-engine-Compaction voor engines die Compaction beheren

Relevante OpenClaw-code:

- `src/agents/embedded-agent-runner/run/attempt.ts`
- `src/agents/embedded-agent-runner/run/attempt.context-engine-helpers.ts`
- `src/agents/embedded-agent-runner/context-engine-maintenance.ts`

Codex app-server-pogingen voeren momenteel generieke agent-harness-hooks uit en spiegelen het transcript, maar roepen `params.contextEngine.bootstrap`, `params.contextEngine.assemble`, `params.contextEngine.afterTurn`, `params.contextEngine.ingestBatch`, `params.contextEngine.ingest` of `params.contextEngine.maintain` niet aan.

Relevante Codex-code:

- `extensions/codex/src/app-server/run-attempt.ts`
- `extensions/codex/src/app-server/thread-lifecycle.ts`
- `extensions/codex/src/app-server/event-projector.ts`
- `extensions/codex/src/app-server/compact.ts`

## Gewenst gedrag

Voor Codex-harnessbeurten moet OpenClaw deze levenscyclus behouden:

1. Lees het gespiegelde OpenClaw-sessietranscript.
2. Bootstrap de actieve context-engine wanneer er een vorig sessiebestand bestaat.
3. Voer bootstraponderhoud uit wanneer beschikbaar.
4. Assembleer context met de actieve context-engine.
5. Converteer de geassembleerde context naar Codex-compatibele invoer.
6. Start of hervat de Codex-thread met ontwikkelaarsinstructies die eventuele context-engine-`systemPromptAddition` bevatten.
7. Start de Codex-beurt met de geassembleerde gebruikersgerichte prompt.
8. Spiegel het Codex-resultaat terug naar het OpenClaw-transcript.
9. Roep `afterTurn` aan indien geïmplementeerd, anders `ingestBatch`/`ingest`, met de gespiegelde transcriptsnapshot.
10. Voer beurtonderhoud uit na geslaagde, niet-afgebroken beurten.
11. Behoud native Codex-Compaction-signalen en OpenClaw-Compaction-hooks.

## Ontwerpbeperkingen

### Codex app-server blijft canoniek voor native threadstatus

Codex beheert zijn native thread en eventuele interne uitgebreide geschiedenis. OpenClaw moet niet proberen de interne geschiedenis van de app-server te muteren, behalve via ondersteunde protocolaanroepen.

OpenClaw's transcriptspiegel blijft de bron voor OpenClaw-functies:

- chatgeschiedenis
- zoeken
- `/new`- en `/reset`-boekhouding
- toekomstige model- of harnesswissels
- context-engine-pluginstatus

### Context-engineassemblage moet naar Codex-invoer worden geprojecteerd

De context-engine-interface retourneert OpenClaw `AgentMessage[]`, geen Codex-threadpatch. Codex app-server `turn/start` accepteert een huidige gebruikersinvoer, terwijl `thread/start` en `thread/resume` ontwikkelaarsinstructies accepteren.

Daarom heeft de implementatie een projectielaag nodig. De veilige eerste versie moet vermijden te doen alsof die Codex' interne geschiedenis kan vervangen. Ze moet geassembleerde context injecteren als deterministisch prompt-/ontwikkelaarsinstructiemateriaal rond de huidige beurt.

### Prompt-cachestabiliteit is belangrijk

Voor engines zoals lossless-claw moet de geassembleerde context deterministisch zijn voor ongewijzigde invoer. Voeg geen tijdstempels, willekeurige id's of niet-deterministische ordening toe aan gegenereerde contexttekst.

### Runtime-selectiesemantiek verandert niet

Harnessselectie blijft zoals die is:

- `runtime: "openclaw"` selecteert de ingebouwde OpenClaw-harness
- `runtime: "codex"` selecteert de geregistreerde Codex-harness
- `runtime: "auto"` laat plugin-harnesses ondersteunde providers claimen
- niet-gematchte `auto`-runs gebruiken de ingebouwde OpenClaw-harness

Dit werk verandert wat er gebeurt nadat de Codex-harness is geselecteerd.

## Implementatieplan

### 1. Exporteer of verplaats herbruikbare context-engine-poginghelpers

Vandaag staan de herbruikbare levenscyclushelpers onder de ingebedde agentrunner:

- `src/agents/embedded-agent-runner/run/attempt.context-engine-helpers.ts`
- `src/agents/embedded-agent-runner/run/attempt.prompt-helpers.ts`
- `src/agents/embedded-agent-runner/context-engine-maintenance.ts`

Codex moet harness-neutrale helpers importeren in plaats van in runnerimplementatiedetails te grijpen.

Maak een harness-neutrale module, bijvoorbeeld:

- `src/agents/harness/context-engine-lifecycle.ts`

Verplaats of herexporteer:

- `runAttemptContextEngineBootstrap`
- `assembleAttemptContextEngine`
- `finalizeAttemptContextEngineTurn`
- `buildAfterTurnRuntimeContext`
- `buildAfterTurnRuntimeContextFromUsage`
- een kleine wrapper rond `runContextEngineMaintenance`

Werk de aanroeppunten van de ingebouwde harness in dezelfde PR bij.

De neutrale helpernamen mogen de ingebouwde harness niet noemen.

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
- Sluit dubbele huidige gebruikersprompt uit als die al aan het einde voorkomt.

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

Toekomstige verbetering: als Codex app-server een protocol beschikbaar maakt voor het vervangen of aanvullen van threadgeschiedenis, wijzig deze projectielaag dan om die API te gebruiken.

### 3. Sluit bootstrap aan vóór Codex-threadopstart

In `extensions/codex/src/app-server/run-attempt.ts`:

- Lees gespiegelde sessiegeschiedenis zoals vandaag.
- Bepaal of het sessiebestand vóór deze run bestond. Geef de voorkeur aan een helper die `fs.stat(params.sessionFile)` controleert vóór spiegelingswrites.
- Open een `SessionManager` of gebruik een smalle sessiemanageradapter als de helper die vereist.
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

Gebruik dezelfde `sessionKey`-conventie als de Codex-toolbrug en transcriptspiegel. Vandaag berekent Codex `sandboxSessionKey` uit `params.sessionKey` of `params.sessionId`; gebruik dat consistent, tenzij er een reden is om ruwe `params.sessionKey` te behouden.

### 4. Sluit assemble aan vóór `thread/start` / `thread/resume` en `turn/start`

In `runCodexAppServerAttempt`:

1. Bouw eerst dynamische tools, zodat de context-engine de daadwerkelijk beschikbare toolnamen ziet.
2. Lees gespiegelde sessiegeschiedenis.
3. Voer context-engine `assemble(...)` uit wanneer `params.contextEngine` bestaat.
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
2. pas context-engineassemblage/-projectie toe
3. voer `before_prompt_build` uit met de geprojecteerde prompt/ontwikkelaarsinstructies

Deze volgorde laat generieke prompthooks dezelfde prompt zien die Codex zal ontvangen. Als strikte OpenClaw-pariteit nodig is, voer context-engineassemblage dan uit vóór hookcompositie, omdat de ingebouwde harness context-engine-`systemPromptAddition` toepast op de uiteindelijke systeemprompt na de promptpipeline. De belangrijke invariant is dat zowel context-engine als hooks een deterministische, gedocumenteerde volgorde krijgen.

Aanbevolen volgorde voor de eerste implementatie:

1. `buildDeveloperInstructions(params)`
2. context-engine `assemble()`
3. voeg `systemPromptAddition` toe aan ontwikkelaarsinstructies, vooraf of achteraf
4. projecteer geassembleerde berichten naar prompttekst
5. `resolveAgentHarnessBeforePromptBuildResult(...)`
6. geef uiteindelijke ontwikkelaarsinstructies door aan `startOrResumeThread(...)`
7. geef uiteindelijke prompttekst door aan `buildTurnStartParams(...)`

De specificatie moet in tests worden vastgelegd zodat toekomstige wijzigingen de volgorde niet per ongeluk veranderen.

### 5. Behoud prompt-cache-stabiele opmaak

De projectiehelper moet byte-stabiele uitvoer produceren voor identieke invoer:

- stabiele berichtvolgorde
- stabiele rollabels
- geen gegenereerde tijdstempels
- geen lekkage van object-sleutelvolgorde
- geen willekeurige scheidingstekens
- geen per-run-id's

Gebruik vaste scheidingstekens en expliciete secties.

### 6. Sluit post-turn aan na transcriptspiegeling

Codex' `CodexAppServerEventProjector` bouwt een lokale `messagesSnapshot` voor de
huidige beurt. `mirrorTranscriptBestEffort(...)` schrijft die momentopname naar de
OpenClaw-transcriptspiegel.

Nadat spiegelen slaagt of faalt, roep je de context-enginefinalizer aan met de
best beschikbare berichtmomentopname:

- Geef de voorkeur aan volledige gespiegelde sessiecontext na de schrijfactie, omdat `afterTurn`
  de sessiemomentopname verwacht, niet alleen de huidige beurt.
- Val terug op `historyMessages + result.messagesSnapshot` als het sessiebestand
  niet opnieuw kan worden geopend.

Pseudoflow:

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

Als spiegelen mislukt, roep dan nog steeds `afterTurn` aan met de fallbackmomentopname, maar log
dat de context engine gegevens inneemt uit fallbackbeurtgegevens.

### 7. Gebruik en prompt-cache-runtimecontext normaliseren

Codex-resultaten bevatten genormaliseerd gebruik uit app-servertokenmeldingen wanneer
beschikbaar. Geef dat gebruik door aan de context-engine-runtimecontext.

Als de Codex-app-server uiteindelijk cachelees-/schrijfdetails beschikbaar stelt, map die dan naar
`ContextEnginePromptCacheInfo`. Laat tot die tijd `promptCache` weg in plaats van
nullen te verzinnen.

### 8. Compaction-beleid

Er zijn twee Compaction-systemen:

1. OpenClaw context-engine `compact()`
2. Codex app-server native `thread/compact/start`

Voeg ze niet stilzwijgend samen.

#### `/compact` en expliciete OpenClaw-Compaction

Wanneer de geselecteerde context engine `info.ownsCompaction === true` heeft, moet expliciete
OpenClaw-Compaction de voorkeur geven aan het `compact()`-resultaat van de context engine voor
de OpenClaw-transcriptspiegel en Plugin-status.

Wanneer de geselecteerde Codex-harness een native threadbinding heeft, kunnen we daarnaast
Codex-native Compaction aanvragen om de app-serverthread gezond te houden, maar dit
moet in details als een afzonderlijke backendactie worden gerapporteerd.

Aanbevolen gedrag:

- Als `contextEngine.info.ownsCompaction === true`:
  - roep eerst context-engine `compact()` aan
  - roep daarna best-effort Codex-native Compaction aan wanneer er een threadbinding bestaat
  - retourneer het context-engineresultaat als het primaire resultaat
  - neem de status van Codex-native Compaction op in `details.codexNativeCompaction`
- Als de actieve context engine geen eigenaar is van Compaction:
  - behoud het huidige gedrag voor Codex-native Compaction

Dit vereist waarschijnlijk een wijziging in `extensions/codex/src/app-server/compact.ts` of
een wrapper vanuit het generieke Compaction-pad, afhankelijk van waar
`maybeCompactAgentHarnessSession(...)` wordt aangeroepen.

#### In-turn Codex-native contextCompaction-events

Codex kan tijdens een beurt `contextCompaction`-itemevents uitsturen. Behoud de huidige
emissie van before/after-Compaction-hooks in `event-projector.ts`, maar behandel
dat niet als een voltooide context-engine-Compaction.

Voor engines die eigenaar zijn van Compaction, emit je een expliciete diagnostische melding wanneer Codex toch
native Compaction uitvoert:

- stream-/eventnaam: bestaande `compaction`-stream is acceptabel
- details: `{ backend: "codex-app-server", ownsCompaction: true }`

Dit maakt de splitsing controleerbaar.

### 9. Sessiereset en bindingsgedrag

De bestaande Codex-harness `reset(...)` wist de Codex-app-serverbinding uit
het OpenClaw-sessiebestand. Behoud dat gedrag.

Zorg er ook voor dat opschoning van context-engine-status via bestaande
OpenClaw-sessielevenscycluspaden blijft verlopen. Voeg geen Codex-specifieke opschoning toe, tenzij de
context-enginelevenscyclus momenteel reset-/delete-events mist voor alle harnesses.

### 10. Foutafhandeling

Volg ingebouwde OpenClaw-semantiek:

- bootstrapfouten waarschuwen en gaan door
- assemble-fouten waarschuwen en vallen terug op niet-geassembleerde pipelineberichten/prompt
- afterTurn-/ingest-fouten waarschuwen en markeren post-turn-finalisatie als onsuccesvol
- onderhoud draait alleen na geslaagde, niet-afgebroken beurten zonder yield
- Compaction-fouten mogen niet opnieuw worden geprobeerd als nieuwe prompts

Codex-specifieke aanvullingen:

- Als contextprojectie mislukt, waarschuw dan en val terug op de oorspronkelijke prompt.
- Als transcriptspiegeling mislukt, probeer dan nog steeds context-enginefinalisatie met
  fallbackberichten.
- Als Codex-native Compaction mislukt nadat context-engine-Compaction is geslaagd,
  laat dan niet de hele OpenClaw-Compaction falen wanneer de context engine primair is.

## Testplan

### Unittests

Voeg tests toe onder `extensions/codex/src/app-server`:

1. `run-attempt.context-engine.test.ts`
   - Codex roept `bootstrap` aan wanneer er een sessiebestand bestaat.
   - Codex roept `assemble` aan met gespiegelde berichten, tokenbudget, toolnamen,
     citatiemodus, model-id en prompt.
   - `systemPromptAddition` wordt opgenomen in developer-instructies.
   - Geassembleerde berichten worden vóór het huidige verzoek in de prompt geprojecteerd.
   - Codex roept `afterTurn` aan na transcriptspiegeling.
   - Zonder `afterTurn` roept Codex `ingestBatch` of per-bericht `ingest` aan.
   - Beurtonderhoud draait na geslaagde beurten.
   - Beurtonderhoud draait niet bij promptfout, afbreken of yield-afbreken.

2. `context-engine-projection.test.ts`
   - stabiele uitvoer voor identieke invoer
   - geen dubbele huidige prompt wanneer geassembleerde geschiedenis die bevat
   - verwerkt lege geschiedenis
   - behoudt rolvolgorde
   - neemt systeem-prompttoevoeging alleen op in developer-instructies

3. `compact.context-engine.test.ts`
   - primair resultaat van eigenaar-context engine wint
   - status van Codex-native Compaction verschijnt in details wanneer die ook is geprobeerd
   - Codex-native fout laat eigenaar-context-engine-Compaction niet falen
   - niet-eigenaar context engine behoudt huidig native Compaction-gedrag

### Bestaande tests om bij te werken

- `extensions/codex/src/app-server/run-attempt.test.ts` indien aanwezig, anders
  de dichtstbijzijnde Codex-app-serverruntests.
- `extensions/codex/src/app-server/event-projector.test.ts` alleen als details van
  Compaction-events wijzigen.
- `src/agents/harness/selection.test.ts` zou geen wijzigingen nodig moeten hebben, tenzij
  configuratiegedrag wijzigt; die moet stabiel blijven.
- Ingebouwde harness-context-enginetests moeten ongewijzigd blijven slagen.

### Integratie-/livetests

Voeg live Codex-harness-smoketests toe of breid ze uit:

- configureer `plugins.slots.contextEngine` naar een testengine
- configureer `agents.defaults.model` naar een `codex/*`-model
- configureer provider/model `agentRuntime.id = "codex"`
- verifieer dat de testengine het volgende observeerde:
  - bootstrap
  - assemble
  - afterTurn of ingest
  - onderhoud

Vermijd dat lossless-claw vereist is in OpenClaw-coretests. Gebruik een kleine in-repo fake
context-engine-Plugin.

## Observeerbaarheid

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

- Als er geen context engine is geconfigureerd, moet legacy context-enginegedrag
  gelijkwaardig zijn aan het huidige Codex-harnessgedrag.
- Als context-engine `assemble` mislukt, moet Codex doorgaan met het oorspronkelijke
  promptpad.
- Bestaande Codex-threadbindingen moeten geldig blijven.
- Dynamische toolfingerprinting mag geen context-engine-uitvoer bevatten; anders
  kan elke contextwijziging een nieuwe Codex-thread afdwingen. Alleen de toolcatalogus
  mag invloed hebben op de dynamische toolfingerprint.

## Open vragen

1. Moet geassembleerde context volledig in de gebruikersprompt worden geïnjecteerd, volledig
   in developer-instructies, of gesplitst?

   Aanbeveling: splitsen. Plaats `systemPromptAddition` in developer-instructies;
   plaats geassembleerde transcriptcontext in de wrapper voor de gebruikersprompt. Dit sluit het best aan bij
   het huidige Codex-protocol zonder native threadgeschiedenis te muteren.

2. Moet Codex-native Compaction worden uitgeschakeld wanneer een context engine eigenaar is van
   Compaction?

   Aanbeveling: nee, aanvankelijk niet. Codex-native Compaction kan nog steeds
   nodig zijn om de app-serverthread actief te houden. Maar het moet worden gerapporteerd als
   native Codex-Compaction, niet als context-engine-Compaction.

3. Moet `before_prompt_build` vóór of na context-engine-assembly draaien?

   Aanbeveling: na context-engineprojectie voor Codex, zodat generieke harnesshooks
   de daadwerkelijke prompt/developer-instructies zien die Codex zal ontvangen. Als
   pariteit met ingebouwde harnesses het tegenovergestelde vereist, leg dan de gekozen volgorde vast in
   tests en documenteer die hier.

4. Kan de Codex-app-server in de toekomst een gestructureerde context-/geschiedenisoverride accepteren?

   Onbekend. Als dat kan, vervang dan de tekstprojectielaag door dat protocol en
   houd de levenscyclusaanroepen ongewijzigd.

## Acceptatiecriteria

- Een `codex/*` embedded harnessbeurt roept de assemble-levenscyclus van de geselecteerde context engine aan.
- Een context-engine `systemPromptAddition` beïnvloedt Codex developer-instructies.
- Geassembleerde context beïnvloedt de invoer van de Codex-beurt deterministisch.
- Geslaagde Codex-beurten roepen `afterTurn` of ingest-fallback aan.
- Geslaagde Codex-beurten draaien context-engine-beurtonderhoud.
- Mislukte/afgebroken/yield-afgebroken beurten draaien geen beurtonderhoud.
- Context-engine-owned Compaction blijft primair voor OpenClaw-/Plugin-status.
- Codex-native Compaction blijft controleerbaar als native Codex-gedrag.
- Bestaand ingebouwd harness-context-enginegedrag is ongewijzigd.
- Bestaand Codex-harnessgedrag is ongewijzigd wanneer geen non-legacy context engine
  is geselecteerd of wanneer assembly mislukt.
