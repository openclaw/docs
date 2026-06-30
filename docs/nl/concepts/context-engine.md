---
read_when:
    - Je wilt begrijpen hoe OpenClaw modelcontext samenstelt
    - Je wisselt tussen de legacy-engine en een Plugin-engine
    - Je bouwt een Plugin voor een context-engine
sidebarTitle: Context engine
summary: 'Context-engine: pluggable contextassemblage, Compaction en levenscyclus van subagent'
title: Contextengine
x-i18n:
    generated_at: "2026-06-30T14:12:13Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: f0ed65cbb72b14b1a6e8d4d9a394f730a48ada35d77e34c12b3356162b281eec
    source_path: concepts/context-engine.md
    workflow: 16
---

Een **context-engine** bepaalt hoe OpenClaw modelcontext voor elke run opbouwt: welke berichten worden opgenomen, hoe oudere geschiedenis wordt samengevat en hoe context over subagent-grenzen heen wordt beheerd.

OpenClaw wordt geleverd met een ingebouwde `legacy`-engine en gebruikt die standaard - de meeste gebruikers hoeven dit nooit te wijzigen. Installeer en selecteer alleen een Plugin-engine wanneer je ander samenstellen, andere Compaction of ander herinneringsgedrag over sessies heen wilt.

## Snel aan de slag

<Steps>
  <Step title="Check which engine is active">
    ```bash
    openclaw doctor
    # or inspect config directly:
    cat ~/.openclaw/openclaw.json | jq '.plugins.slots.contextEngine'
    ```
  </Step>
  <Step title="Install a plugin engine">
    Context-engine-Plugins worden net als elke andere OpenClaw-Plugin geïnstalleerd.

    <Tabs>
      <Tab title="From npm">
        ```bash
        openclaw plugins install @martian-engineering/lossless-claw
        ```
      </Tab>
      <Tab title="From a local path">
        ```bash
        openclaw plugins install -l ./my-context-engine
        ```
      </Tab>
    </Tabs>

  </Step>
  <Step title="Enable and select the engine">
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
  <Step title="Switch back to legacy (optional)">
    Zet `contextEngine` op `"legacy"` (of verwijder de sleutel helemaal - `"legacy"` is de standaardwaarde).
  </Step>
</Steps>

## Hoe het werkt

Elke keer dat OpenClaw een modelprompt uitvoert, neemt de context-engine deel op vier momenten in de levenscyclus:

<AccordionGroup>
  <Accordion title="1. Ingest">
    Wordt aangeroepen wanneer een nieuw bericht aan de sessie wordt toegevoegd. De engine kan het bericht opslaan of indexeren in zijn eigen gegevensopslag.
  </Accordion>
  <Accordion title="2. Assemble">
    Wordt aangeroepen vóór elke modelrun. De engine retourneert een geordende set berichten (en een optionele `systemPromptAddition`) die binnen het tokenbudget passen.
  </Accordion>
  <Accordion title="3. Compact">
    Wordt aangeroepen wanneer het contextvenster vol is, of wanneer de gebruiker `/compact` uitvoert. De engine vat oudere geschiedenis samen om ruimte vrij te maken.
  </Accordion>
  <Accordion title="4. After turn">
    Wordt aangeroepen nadat een run is voltooid. De engine kan toestand persistent opslaan, Compaction op de achtergrond starten of indexen bijwerken.
  </Accordion>
</AccordionGroup>

Voor de gebundelde niet-ACP Codex-harness past OpenClaw dezelfde levenscyclus toe door samengestelde context te projecteren naar Codex-ontwikkelaarsinstructies en de prompt van de huidige beurt. Codex blijft eigenaar van zijn eigen native threadgeschiedenis en native compactor.

### Levenscyclus van subagent (optioneel)

OpenClaw roept twee optionele subagent-levenscyclushooks aan:

<ParamField path="prepareSubagentSpawn" type="method">
  Bereid gedeelde contexttoestand voor voordat een child-run start. De hook ontvangt parent/child-sessiesleutels, `contextMode` (`isolated` of `fork`), beschikbare transcript-id's/-bestanden en een optionele TTL. Als deze een rollback-handle retourneert, roept OpenClaw die aan wanneer spawn mislukt nadat de voorbereiding is geslaagd. Native subagent-spawns die `lightContext` aanvragen en naar `contextMode="isolated"` resolven, slaan deze hook bewust over zodat het child start vanuit de lichtgewicht bootstrapcontext zonder door de context-engine beheerde pre-spawn-toestand.
</ParamField>
<ParamField path="onSubagentEnded" type="method">
  Ruim op wanneer een subagent-sessie wordt voltooid of opgeveegd.
</ParamField>

### Toevoeging aan systeemprompt

De methode `assemble` kan een `systemPromptAddition`-tekenreeks retourneren. OpenClaw plaatst deze vóór de systeemprompt voor de run. Zo kunnen engines dynamische herinneringsrichtlijnen, ophaalinstructies of contextbewuste hints injecteren zonder statische werkruimtebestanden te vereisen.

## De legacy-engine

De ingebouwde `legacy`-engine behoudt het oorspronkelijke gedrag van OpenClaw:

- **Ingest**: no-op (de sessiemanager handelt berichtpersistentie rechtstreeks af).
- **Assemble**: pass-through (de bestaande sanitize → validate → limit-pijplijn in de runtime handelt contextsamenstelling af).
- **Compact**: delegeert naar de ingebouwde samenvattende Compaction, die één samenvatting van oudere berichten maakt en recente berichten intact laat.
- **After turn**: no-op.

De legacy-engine registreert geen tools en levert geen `systemPromptAddition`.

Wanneer er geen `plugins.slots.contextEngine` is ingesteld (of wanneer deze op `"legacy"` staat), wordt deze engine automatisch gebruikt.

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

De factory `ctx` bevat optionele waarden voor `config`, `agentDir` en `workspaceDir`, zodat Plugins per-agent- of per-workspace-toestand kunnen initialiseren voordat de eerste levenscyclushook wordt uitgevoerd.

Schakel de engine daarna in de configuratie in:

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

Vereiste members:

| Member             | Soort      | Doel                                                        |
| ------------------ | ---------- | ----------------------------------------------------------- |
| `info`             | Eigenschap | Engine-id, naam, versie en of de engine Compaction beheert  |
| `ingest(params)`   | Methode    | Eén bericht opslaan                                         |
| `assemble(params)` | Methode    | Context bouwen voor een modelrun (retourneert `AssembleResult`) |
| `compact(params)`  | Methode    | Context samenvatten/verkleinen                              |

`assemble` retourneert een `AssembleResult` met:

<ParamField path="messages" type="Message[]" required>
  De geordende berichten die naar het model worden verzonden.
</ParamField>
<ParamField path="estimatedTokens" type="number" required>
  De schatting van de engine van het totale aantal tokens in de samengestelde context. OpenClaw gebruikt dit voor beslissingen over Compaction-drempels en diagnostische rapportage.
</ParamField>
<ParamField path="systemPromptAddition" type="string">
  Wordt vóór de systeemprompt geplaatst.
</ParamField>
<ParamField path="promptAuthority" type='"assembled" | "preassembly_may_overflow"'>
  Bepaalt welke tokenschatting de runner gebruikt voor preventieve prechecks op overloop. De standaardwaarde is `"assembled"`, wat betekent dat alleen de schatting van de samengestelde prompt wordt gecontroleerd voor engines die geen eigenaar zijn van Compaction. Engines die `ownsCompaction: true` instellen, beheren hun eigen prompttoelating, dus OpenClaw slaat standaard de generieke pre-prompt-precheck over. Stel `"preassembly_may_overflow"` alleen in wanneer je samengestelde weergave een overlooprisico in het onderliggende transcript kan verbergen; de runner houdt de generieke precheck dan actief en neemt het maximum van de samengestelde schatting en de pre-assembly-schatting van de sessiegeschiedenis (zonder venster) wanneer wordt besloten of er preventief moet worden gecomprimeerd. Hoe dan ook blijven de berichten die je retourneert datgene wat het model ziet - `promptAuthority` beïnvloedt alleen de precheck.
</ParamField>

`compact` retourneert een `CompactResult`. Wanneer Compaction het actieve transcript roteert, identificeren `result.sessionId` en `result.sessionFile` de opvolgende sessie die de volgende retry of beurt moet gebruiken.

Optionele members:

| Member                         | Soort   | Doel                                                                                                            |
| ------------------------------ | ------- | --------------------------------------------------------------------------------------------------------------- |
| `bootstrap(params)`            | Methode | Engine-toestand voor een sessie initialiseren. Wordt eenmaal aangeroepen wanneer de engine een sessie voor het eerst ziet (bijv. geschiedenis importeren). |
| `ingestBatch(params)`          | Methode | Een voltooide beurt als batch innemen. Wordt aangeroepen nadat een run is voltooid, met alle berichten uit die beurt tegelijk. |
| `afterTurn(params)`            | Methode | Levenscycluswerk na de run (toestand persistent opslaan, Compaction op de achtergrond starten).                 |
| `prepareSubagentSpawn(params)` | Methode | Gedeelde toestand voor een child-sessie instellen voordat deze start.                                           |
| `onSubagentEnded(params)`      | Methode | Opruimen nadat een subagent eindigt.                                                                            |
| `dispose()`                    | Methode | Resources vrijgeven. Wordt aangeroepen tijdens het afsluiten van de Gateway of het herladen van een Plugin - niet per sessie. |

### Runtime-instellingen

Levenscyclushooks die binnen OpenClaw worden uitgevoerd, ontvangen een optioneel `runtimeSettings`-object. Dit is een geversioneerd, alleen-lezen intern API-oppervlak voor producent/consument: OpenClaw produceert het voor de geselecteerde context-engine, en de context-engine consumeert het binnen levenscyclushooks. Het wordt niet rechtstreeks aan gebruikers getoond en maakt geen apart rapportageoppervlak.

- `schemaVersion`: momenteel `1`
- `runtime`: OpenClaw-host, runtime-modus (`normal`, `fallback` of `degraded`) en optionele harness-/runtime-id's
- `contextEngineSelection`: geselecteerde context-engine-id en selectiebron
- `executionHost`: host-id en label voor het oppervlak dat de hook aanroept
- `model`: aangevraagd model, geresolved model, provider en optionele modelfamilie
- `limits`: prompt-tokenbudget en maximaal aantal outputtokens wanneer bekend
- `diagnostics`: gesloten fallback- en degraded-redencodes wanneer bekend

Velden die onbekend kunnen zijn, worden weergegeven als `null`; discriminatorvelden zoals runtime-modus en selectiebron blijven non-nullable. Oudere engines blijven compatibel: als een strikte legacy-engine `runtimeSettings` als onbekende eigenschap weigert, probeert OpenClaw de levenscyclusaanroep opnieuw zonder deze eigenschap in plaats van de engine in quarantaine te plaatsen.

### Hostvereisten

Context-engines kunnen hostcapaciteitsvereisten declareren op `info.hostRequirements`. OpenClaw controleert deze vereisten voordat de bewerking wordt gestart en faalt gesloten met een beschrijvende fout wanneer de geselecteerde runtime er niet aan kan voldoen.

Declareer voor agent-runs `assemble-before-prompt` wanneer de engine de daadwerkelijke modelprompt via `assemble()` moet beheren:

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

Native Codex- en OpenClaw-embedded agent-runs voldoen aan `assemble-before-prompt`. Generieke CLI-backends doen dat niet, dus engines die dit vereisen, worden geweigerd voordat het CLI-proces start.

### Foutisolatie

OpenClaw isoleert de geselecteerde plugin-engine van het kernpad voor antwoorden. Als een
niet-verouderde engine ontbreekt, niet door contractvalidatie komt, een fout gooit tijdens het maken
van de factory, of een fout gooit vanuit een lifecycle-methode, plaatst OpenClaw die engine in quarantaine
voor het huidige Gateway-proces en verlaagt context-enginewerk naar de
ingebouwde `legacy`-engine. De fout wordt gelogd met de mislukte bewerking, zodat de
operator de plugin kan repareren, bijwerken of uitschakelen zonder dat de agent
stilvalt.

Fouten in hostvereisten zijn anders: wanneer een engine verklaart dat een runtime
een vereiste capability mist, faalt OpenClaw gesloten voordat de run wordt gestart. Dat
beschermt engines die state zouden beschadigen als ze in een niet-ondersteunde host zouden draaien.

### ownsCompaction

`ownsCompaction` bepaalt of de ingebouwde auto-Compaction binnen een poging van de OpenClaw-runtime ingeschakeld blijft voor de run:

<AccordionGroup>
  <Accordion title="ownsCompaction: true">
    De engine is eigenaar van het Compaction-gedrag. OpenClaw schakelt de ingebouwde auto-Compaction en generieke pre-prompt-overflowcontrole van de OpenClaw-runtime uit voor die run, en de `compact()`-implementatie van de engine is verantwoordelijk voor `/compact`, provider-overflowherstel-Compaction en alle proactieve Compaction die de engine in `afterTurn()` wil uitvoeren. OpenClaw voert de pre-prompt-overflowbeveiliging nog steeds uit wanneer de engine `promptAuthority: "preassembly_may_overflow"` retourneert vanuit `assemble()`.
  </Accordion>
  <Accordion title="ownsCompaction: false or unset">
    De ingebouwde auto-Compaction van de OpenClaw-runtime kan nog steeds tijdens promptuitvoering draaien, maar de `compact()`-methode van de actieve engine wordt nog steeds aangeroepen voor `/compact` en overflowherstel.
  </Accordion>
</AccordionGroup>

<Warning>
`ownsCompaction: false` betekent **niet** dat OpenClaw automatisch terugvalt op het Compaction-pad van de legacy-engine.
</Warning>

Dat betekent dat er twee geldige pluginpatronen zijn:

<Tabs>
  <Tab title="Owning mode">
    Implementeer je eigen Compaction-algoritme en stel `ownsCompaction: true` in.
  </Tab>
  <Tab title="Delegating mode">
    Stel `ownsCompaction: false` in en laat `compact()` `delegateCompactionToRuntime(...)` uit `openclaw/plugin-sdk/core` aanroepen om het ingebouwde Compaction-gedrag van OpenClaw te gebruiken.
  </Tab>
</Tabs>

Een no-op `compact()` is onveilig voor een actieve engine die geen eigenaar is, omdat dit het normale `/compact`- en overflowherstel-Compaction-pad voor die enginesleuf uitschakelt.

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
De sleuf is exclusief tijdens runtime - er wordt slechts één geregistreerde contextengine opgelost voor een bepaalde run of Compaction-bewerking. Andere ingeschakelde `kind: "context-engine"`-plugins kunnen nog steeds laden en hun registratiecode uitvoeren; `plugins.slots.contextEngine` selecteert alleen welke geregistreerde engine-id OpenClaw oplost wanneer het een contextengine nodig heeft.
</Note>

<Note>
**Plugin verwijderen:** wanneer je de plugin verwijdert die momenteel is geselecteerd als `plugins.slots.contextEngine`, zet OpenClaw de sleuf terug naar de standaardwaarde (`legacy`). Hetzelfde resetgedrag geldt voor `plugins.slots.memory`. Er is geen handmatige configuratiebewerking vereist.
</Note>

## Relatie met Compaction en geheugen

<AccordionGroup>
  <Accordion title="Compaction">
    Compaction is één verantwoordelijkheid van de contextengine. De legacy-engine delegeert naar de ingebouwde samenvatting van OpenClaw. Plugin-engines kunnen elke Compaction-strategie implementeren (DAG-samenvattingen, vectorretrieval, enzovoort).
  </Accordion>
  <Accordion title="Memory plugins">
    Geheugenplugins (`plugins.slots.memory`) staan los van contextengines. Geheugenplugins bieden zoek- en retrievalmogelijkheden; contextengines bepalen wat het model ziet. Ze kunnen samenwerken - een contextengine kan geheugenplugingegevens gebruiken tijdens assembly. Plugin-engines die het actieve geheugenpromptpad willen gebruiken, moeten bij voorkeur `buildMemorySystemPromptAddition(...)` uit `openclaw/plugin-sdk/core` gebruiken, waarmee de actieve geheugenpromptsecties worden omgezet in een klaar om vooraan toe te voegen `systemPromptAddition`. Als een engine controle op lager niveau nodig heeft, kan deze nog steeds ruwe regels ophalen uit `openclaw/plugin-sdk/memory-host-core` via `buildActiveMemoryPromptSection(...)`.
  </Accordion>
  <Accordion title="Session pruning">
    Het in-memory inkorten van oude toolresultaten blijft draaien, ongeacht welke contextengine actief is.
  </Accordion>
</AccordionGroup>

## Tips

- Gebruik `openclaw doctor` om te controleren of je engine correct wordt geladen.
- Als je van engine wisselt, gaan bestaande sessies door met hun huidige geschiedenis. De nieuwe engine neemt toekomstige runs over.
- Enginefouten worden gelogd en de geselecteerde plugin-engine wordt voor het huidige Gateway-proces in quarantaine geplaatst. OpenClaw valt terug op `legacy` voor gebruikersbeurten, zodat antwoorden kunnen doorgaan, maar je moet de kapotte plugin nog steeds repareren, bijwerken, uitschakelen of verwijderen.
- Gebruik voor ontwikkeling `openclaw plugins install -l ./my-engine` om een lokale pluginmap te koppelen zonder te kopiëren.

## Gerelateerd

- [Compaction](/nl/concepts/compaction) - lange gesprekken samenvatten
- [Context](/nl/concepts/context) - hoe context wordt opgebouwd voor agentbeurten
- [Pluginarchitectuur](/nl/plugins/architecture) - contextengineplugins registreren
- [Pluginmanifest](/nl/plugins/manifest) - pluginmanifestvelden
- [Plugins](/nl/tools/plugin) - pluginoverzicht
