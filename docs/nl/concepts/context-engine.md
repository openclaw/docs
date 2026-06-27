---
read_when:
    - Je wilt begrijpen hoe OpenClaw modelcontext samenstelt
    - Je schakelt tussen de verouderde engine en een Plugin-engine
    - Je bouwt een Plugin voor de context-engine
sidebarTitle: Context engine
summary: 'Context-engine: plug-inbare contextassemblage, Compaction en levenscyclus van subagent'
title: Context-engine
x-i18n:
    generated_at: "2026-06-27T17:25:39Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 124b6daf52f3d58f756352e2e169697541a8b6e67aecaa5a219bed15bda801cd
    source_path: concepts/context-engine.md
    workflow: 16
---

Een **context-engine** bepaalt hoe OpenClaw modelcontext voor elke run opbouwt: welke berichten moeten worden opgenomen, hoe oudere geschiedenis moet worden samengevat en hoe context over subagent-grenzen heen moet worden beheerd.

OpenClaw wordt geleverd met een ingebouwde `legacy`-engine en gebruikt deze standaard - de meeste gebruikers hoeven dit nooit te wijzigen. Installeer en selecteer alleen een Plugin-engine wanneer u ander assemblage-, Compaction- of cross-session recall-gedrag wilt.

## Snel aan de slag

<Steps>
  <Step title="Controleer welke engine actief is">
    ```bash
    openclaw doctor
    # or inspect config directly:
    cat ~/.openclaw/openclaw.json | jq '.plugins.slots.contextEngine'
    ```
  </Step>
  <Step title="Installeer een Plugin-engine">
    Context-engineplugins worden geïnstalleerd zoals elke andere OpenClaw-Plugin.

    <Tabs>
      <Tab title="Van npm">
        ```bash
        openclaw plugins install @martian-engineering/lossless-claw
        ```
      </Tab>
      <Tab title="Van een lokaal pad">
        ```bash
        openclaw plugins install -l ./my-context-engine
        ```
      </Tab>
    </Tabs>

  </Step>
  <Step title="Schakel de engine in en selecteer deze">
    ```json5
    // openclaw.json
    {
      plugins: {
        slots: {
          contextEngine: "lossless-claw", // must match the plugin's registered engine id
        },
        entries: {
          "lossless-claw": {
            enabled: true,
            // Plugin-specific config goes here (see the plugin's docs)
          },
        },
      },
    }
    ```

    Herstart de Gateway na installatie en configuratie.

  </Step>
  <Step title="Schakel terug naar legacy (optioneel)">
    Stel `contextEngine` in op `"legacy"` (of verwijder de sleutel helemaal - `"legacy"` is de standaardwaarde).
  </Step>
</Steps>

## Hoe het werkt

Telkens wanneer OpenClaw een modelprompt uitvoert, neemt de context-engine deel op vier momenten in de levenscyclus:

<AccordionGroup>
  <Accordion title="1. Inname">
    Wordt aangeroepen wanneer een nieuw bericht aan de sessie wordt toegevoegd. De engine kan het bericht opslaan of indexeren in zijn eigen datastore.
  </Accordion>
  <Accordion title="2. Assembleren">
    Wordt aangeroepen vóór elke modelrun. De engine retourneert een geordende set berichten (en een optionele `systemPromptAddition`) die binnen het tokenbudget passen.
  </Accordion>
  <Accordion title="3. Compact">
    Wordt aangeroepen wanneer het contextvenster vol is, of wanneer de gebruiker `/compact` uitvoert. De engine vat oudere geschiedenis samen om ruimte vrij te maken.
  </Accordion>
  <Accordion title="4. Na beurt">
    Wordt aangeroepen nadat een run is voltooid. De engine kan status bewaren, achtergrond-Compaction activeren of indexen bijwerken.
  </Accordion>
</AccordionGroup>

Voor de gebundelde niet-ACP Codex-harness past OpenClaw dezelfde levenscyclus toe door geassembleerde context te projecteren naar Codex-ontwikkelaarsinstructies en de prompt van de huidige beurt. Codex blijft eigenaar van zijn eigen native threadgeschiedenis en native compactor.

### Subagent-levenscyclus (optioneel)

OpenClaw roept twee optionele lifecycle-hooks voor subagents aan:

<ParamField path="prepareSubagentSpawn" type="method">
  Bereid gedeelde contextstatus voor voordat een child-run start. De hook ontvangt parent/child-sessiesleutels, `contextMode` (`isolated` of `fork`), beschikbare transcript-id's/bestanden en optionele TTL. Als deze een rollback-handle retourneert, roept OpenClaw deze aan wanneer spawn mislukt nadat de voorbereiding is geslaagd. Native subagent-spawns die `lightContext` aanvragen en worden opgelost naar `contextMode="isolated"` slaan deze hook bewust over, zodat de child start vanuit de lichtgewicht bootstrapcontext zonder door de context-engine beheerde pre-spawnstatus.
</ParamField>
<ParamField path="onSubagentEnded" type="method">
  Ruim op wanneer een subagent-sessie is voltooid of wordt opgeschoond.
</ParamField>

### System-prompttoevoeging

De methode `assemble` kan een `systemPromptAddition`-string retourneren. OpenClaw voegt deze vóór de system-prompt voor de run toe. Hierdoor kunnen engines dynamische recall-richtlijnen, retrieval-instructies of contextbewuste hints injecteren zonder statische workspacebestanden te vereisen.

## De legacy-engine

De ingebouwde `legacy`-engine behoudt het oorspronkelijke gedrag van OpenClaw:

- **Inname**: no-op (de sessiemanager handelt berichtpersistentie rechtstreeks af).
- **Assembleren**: pass-through (de bestaande sanitize → validate → limit-pijplijn in de runtime handelt contextassemblage af).
- **Compact**: delegeert naar de ingebouwde samenvattings-Compaction, die één samenvatting van oudere berichten maakt en recente berichten intact houdt.
- **Na beurt**: no-op.

De legacy-engine registreert geen tools en biedt geen `systemPromptAddition`.

Wanneer geen `plugins.slots.contextEngine` is ingesteld (of deze is ingesteld op `"legacy"`), wordt deze engine automatisch gebruikt.

## Plugin-engines

Een Plugin kan een context-engine registreren met de Plugin-API:

```ts
import { buildMemorySystemPromptAddition } from "openclaw/plugin-sdk/core";

export default function register(api) {
  api.registerContextEngine("my-engine", (ctx) => ({
    info: {
      id: "my-engine",
      name: "My Context Engine",
      ownsCompaction: true,
    },

    async ingest({ sessionId, message, isHeartbeat }) {
      // Store the message in your data store
      return { ingested: true };
    },

    async assemble({ sessionId, messages, tokenBudget, availableTools, citationsMode }) {
      // Return messages that fit the budget
      return {
        messages: buildContext(messages, tokenBudget),
        estimatedTokens: countTokens(messages),
        systemPromptAddition: buildMemorySystemPromptAddition({
          availableTools: availableTools ?? new Set(),
          citationsMode,
        }),
      };
    },

    async compact({ sessionId, force }) {
      // Summarize older context
      return { ok: true, compacted: true };
    },
  }));
}
```

De factory `ctx` bevat optionele waarden `config`, `agentDir` en `workspaceDir`,
zodat plugins per-agent- of per-workspace-status kunnen initialiseren voordat de
eerste lifecycle-hook wordt uitgevoerd.

Schakel deze vervolgens in de configuratie in:

```json5
{
  plugins: {
    slots: {
      contextEngine: "my-engine",
    },
    entries: {
      "my-engine": {
        enabled: true,
      },
    },
  },
}
```

### De ContextEngine-interface

Vereiste leden:

| Lid                | Soort      | Doel                                                             |
| ------------------ | ---------- | ---------------------------------------------------------------- |
| `info`             | Eigenschap | Engine-id, naam, versie en of deze eigenaar is van Compaction    |
| `ingest(params)`   | Methode    | Eén bericht opslaan                                              |
| `assemble(params)` | Methode    | Context bouwen voor een modelrun (retourneert `AssembleResult`) |
| `compact(params)`  | Methode    | Context samenvatten/reduceren                                    |

`assemble` retourneert een `AssembleResult` met:

<ParamField path="messages" type="Message[]" required>
  De geordende berichten die naar het model worden gestuurd.
</ParamField>
<ParamField path="estimatedTokens" type="number" required>
  De schatting van de engine van het totale aantal tokens in de geassembleerde context. OpenClaw gebruikt dit voor beslissingen over Compaction-drempels en diagnostische rapportage.
</ParamField>
<ParamField path="systemPromptAddition" type="string">
  Wordt vóór de system-prompt toegevoegd.
</ParamField>
<ParamField path="promptAuthority" type='"assembled" | "preassembly_may_overflow"'>
  Bepaalt welke tokenschatting de runner gebruikt voor preventieve overflow-
  prechecks. De standaardwaarde is `"assembled"`, wat betekent dat alleen de
  schatting van de geassembleerde prompt wordt gecontroleerd - geschikt voor
  engines die een venstergebonden, op zichzelf staande context retourneren.
  Stel alleen in op `"preassembly_may_overflow"` wanneer uw geassembleerde
  weergave overflow-risico in het onderliggende transcript kan verbergen; de
  runner neemt dan het maximum van de geassembleerde schatting en de
  pre-assembly (niet-venstergebonden) sessiegeschiedenisschatting bij de
  beslissing of preventieve Compaction moet worden uitgevoerd. Hoe dan ook zijn
  de berichten die u retourneert nog steeds wat het model ziet - `promptAuthority`
  beïnvloedt alleen de precheck.
</ParamField>

`compact` retourneert een `CompactResult`. Wanneer Compaction het actieve
transcript roteert, identificeren `result.sessionId` en `result.sessionFile` de opvolgende
sessie die de volgende retry of beurt moet gebruiken.

Optionele leden:

| Lid                            | Soort   | Doel                                                                                                                  |
| ------------------------------ | ------- | --------------------------------------------------------------------------------------------------------------------- |
| `bootstrap(params)`            | Methode | Initialiseer engine-status voor een sessie. Wordt één keer aangeroepen wanneer de engine voor het eerst een sessie ziet (bijv. geschiedenis importeren). |
| `ingestBatch(params)`          | Methode | Neem een voltooide beurt als batch in. Wordt aangeroepen nadat een run is voltooid, met alle berichten van die beurt tegelijk. |
| `afterTurn(params)`            | Methode | Lifecycle-werk na de run (status bewaren, achtergrond-Compaction activeren).                                           |
| `prepareSubagentSpawn(params)` | Methode | Gedeelde status instellen voor een child-sessie voordat deze start.                                                    |
| `onSubagentEnded(params)`      | Methode | Opruimen nadat een subagent eindigt.                                                                                  |
| `dispose()`                    | Methode | Resources vrijgeven. Wordt aangeroepen tijdens Gateway-shutdown of Plugin-reload - niet per sessie.                   |

### Runtime-instellingen

Lifecycle-hooks die binnen OpenClaw worden uitgevoerd, ontvangen een optioneel
`runtimeSettings`-object. Het is een versioned, read-only interne
producer/consumer-API-surface: OpenClaw produceert het voor de geselecteerde context-
engine, en de context-engine consumeert het binnen lifecycle-hooks. Het wordt niet
rechtstreeks aan gebruikers weergegeven en maakt geen dedicated rapportagesurface.

- `schemaVersion`: momenteel `1`
- `runtime`: OpenClaw-host, runtime-modus (`normal`, `fallback` of
  `degraded`) en optionele harness-/runtime-id's
- `contextEngineSelection`: geselecteerde context-engine-id en selectiebron
- `executionHost`: host-id en label voor de surface die de hook aanroept
- `model`: aangevraagd model, opgelost model, provider en optionele modelfamilie
- `limits`: prompt-tokenbudget en max uitvoertokens wanneer bekend
- `diagnostics`: gesloten fallback- en degraded-redencodes wanneer bekend

Velden die onbekend kunnen zijn, worden weergegeven als `null`; discriminatorvelden zoals
runtime-modus en selectiebron blijven niet-nullable. Oudere engines blijven
compatibel: als een strikte legacy-engine `runtimeSettings` afwijst als onbekende
eigenschap, probeert OpenClaw de lifecycle-aanroep opnieuw zonder deze, in plaats van
de engine in quarantaine te plaatsen.

### Hostvereisten

Context-engines kunnen hostcapaciteitsvereisten declareren op `info.hostRequirements`.
OpenClaw controleert deze vereisten voordat de operatie wordt gestart en faalt gesloten
met een beschrijvende fout wanneer de geselecteerde runtime er niet aan kan voldoen.

Voor agent-runs declareert u `assemble-before-prompt` wanneer de engine de
daadwerkelijke modelprompt moet controleren via `assemble()`:

```ts
info: {
  id: "my-context-engine",
  name: "My Context Engine",
  hostRequirements: {
    "agent-run": {
      requiredCapabilities: ["assemble-before-prompt"],
      unsupportedMessage:
        "Use the native Codex or OpenClaw embedded runtime, or select the legacy context engine.",
    },
  },
}
```

Native Codex- en OpenClaw embedded agent-runs voldoen aan `assemble-before-prompt`.
Generieke CLI-backends doen dat niet, dus engines die dit vereisen worden afgewezen voordat het
CLI-proces start.

### Foutisolatie

OpenClaw isoleert de geselecteerde Plugin-engine van het core-antwoordpad. Als een
niet-legacy-engine ontbreekt, faalt bij contractvalidatie, een fout gooit tijdens factory-
creatie of een fout gooit vanuit een lifecycle-methode, plaatst OpenClaw die engine
voor het huidige Gateway-proces in quarantaine en degradeert context-enginewerk naar de
ingebouwde `legacy`-engine. De fout wordt gelogd met de mislukte operatie, zodat de
operator de Plugin kan repareren, bijwerken of uitschakelen zonder dat de agent stilvalt.

Hostvereistefouten zijn anders: wanneer een engine verklaart dat een runtime
een vereiste capability mist, faalt OpenClaw gesloten voordat de run wordt gestart. Dat
beschermt engines die state zouden beschadigen als ze in een niet-ondersteunde host draaiden.

### ownsCompaction

`ownsCompaction` bepaalt of de ingebouwde auto-compaction binnen een poging van de OpenClaw-runtime ingeschakeld blijft voor de run:

<AccordionGroup>
  <Accordion title="ownsCompaction: true">
    De engine beheert het compaction-gedrag. OpenClaw schakelt de ingebouwde auto-compaction van de OpenClaw-runtime uit voor die run, en de `compact()`-implementatie van de engine is verantwoordelijk voor `/compact`, compaction voor overflow-herstel en elke proactieve compaction die de engine in `afterTurn()` wil uitvoeren. OpenClaw kan de pre-prompt-overflowbeveiliging nog steeds uitvoeren; wanneer die voorspelt dat het volledige transcript zal overlopen, roept het herstelpad de `compact()` van de actieve engine aan voordat nog een prompt wordt ingediend.
  </Accordion>
  <Accordion title="ownsCompaction: false of niet ingesteld">
    De ingebouwde auto-compaction van de OpenClaw-runtime kan nog steeds worden uitgevoerd tijdens promptuitvoering, maar de `compact()`-methode van de actieve engine wordt nog steeds aangeroepen voor `/compact` en overflow-herstel.
  </Accordion>
</AccordionGroup>

<Warning>
`ownsCompaction: false` betekent **niet** dat OpenClaw automatisch terugvalt op het compaction-pad van de legacy-engine.
</Warning>

Dat betekent dat er twee geldige Plugin-patronen zijn:

<Tabs>
  <Tab title="Beheermodus">
    Implementeer je eigen compaction-algoritme en stel `ownsCompaction: true` in.
  </Tab>
  <Tab title="Delegeermodus">
    Stel `ownsCompaction: false` in en laat `compact()` `delegateCompactionToRuntime(...)` uit `openclaw/plugin-sdk/core` aanroepen om het ingebouwde compaction-gedrag van OpenClaw te gebruiken.
  </Tab>
</Tabs>

Een no-op `compact()` is onveilig voor een actieve niet-beherende engine, omdat dit het normale `/compact`- en overflow-herstelcompaction-pad voor die engine-slot uitschakelt.

## Configuratiereferentie

```json5
{
  plugins: {
    slots: {
      // Select the active context engine. Default: "legacy".
      // Set to a plugin id to use a plugin engine.
      contextEngine: "legacy",
    },
  },
}
```

<Note>
De slot is exclusief tijdens runtime - er wordt slechts één geregistreerde context-engine opgelost voor een gegeven run of compaction-bewerking. Andere ingeschakelde `kind: "context-engine"`-plugins kunnen nog steeds laden en hun registratiecode uitvoeren; `plugins.slots.contextEngine` selecteert alleen welke geregistreerde engine-id OpenClaw oplost wanneer het een context-engine nodig heeft.
</Note>

<Note>
**Plugin verwijderen:** wanneer je de Plugin verwijdert die momenteel als `plugins.slots.contextEngine` is geselecteerd, zet OpenClaw de slot terug naar de standaardwaarde (`legacy`). Hetzelfde resetgedrag geldt voor `plugins.slots.memory`. Er is geen handmatige configbewerking vereist.
</Note>

## Relatie tot compaction en memory

<AccordionGroup>
  <Accordion title="Compaction">
    Compaction is één verantwoordelijkheid van de context-engine. De legacy-engine delegeert naar de ingebouwde samenvatting van OpenClaw. Plugin-engines kunnen elke compaction-strategie implementeren (DAG-samenvattingen, vectorretrieval, enzovoort).
  </Accordion>
  <Accordion title="Memory-plugins">
    Memory-plugins (`plugins.slots.memory`) staan los van context-engines. Memory-plugins bieden zoeken/retrieval; context-engines bepalen wat het model ziet. Ze kunnen samenwerken - een context-engine kan memory-plugingegevens gebruiken tijdens assemblage. Plugin-engines die het actieve memory-promptpad willen gebruiken, moeten bij voorkeur `buildMemorySystemPromptAddition(...)` uit `openclaw/plugin-sdk/core` gebruiken, dat de actieve memory-promptsecties omzet in een kant-en-klare `systemPromptAddition` om vooraan toe te voegen. Als een engine controle op lager niveau nodig heeft, kan die nog steeds ruwe regels uit `openclaw/plugin-sdk/memory-host-core` ophalen via `buildActiveMemoryPromptSection(...)`.
  </Accordion>
  <Accordion title="Sessiesnoei">
    Het in-memory inkorten van oude toolresultaten wordt nog steeds uitgevoerd, ongeacht welke context-engine actief is.
  </Accordion>
</AccordionGroup>

## Tips

- Gebruik `openclaw doctor` om te controleren of je engine correct wordt geladen.
- Als je van engine wisselt, gaan bestaande sessies verder met hun huidige geschiedenis. De nieuwe engine neemt toekomstige runs over.
- Enginefouten worden gelogd en de geselecteerde Plugin-engine wordt voor het huidige Gateway-proces in quarantaine geplaatst. OpenClaw valt terug op `legacy` voor gebruikersbeurten, zodat antwoorden kunnen doorgaan, maar je moet de kapotte Plugin nog steeds repareren, bijwerken, uitschakelen of verwijderen.
- Gebruik voor ontwikkeling `openclaw plugins install -l ./my-engine` om een lokale Plugin-map te linken zonder te kopiëren.

## Gerelateerd

- [Compaction](/nl/concepts/compaction) - lange gesprekken samenvatten
- [Context](/nl/concepts/context) - hoe context wordt opgebouwd voor agentbeurten
- [Plugin Architecture](/nl/plugins/architecture) - context-engine-plugins registreren
- [Plugin manifest](/nl/plugins/manifest) - Plugin-manifestvelden
- [Plugins](/nl/tools/plugin) - Plugin-overzicht
