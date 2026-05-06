---
read_when:
    - Je wilt begrijpen hoe OpenClaw modelcontext samenstelt
    - Je schakelt tussen de verouderde engine en een Plugin-engine
    - Je bouwt een Plugin voor een contextengine
sidebarTitle: Context engine
summary: 'Context-engine: inplugbare contextopbouw, Compaction en levenscyclus van subagents'
title: Contextengine
x-i18n:
    generated_at: "2026-05-06T09:07:22Z"
    model: gpt-5.5
    provider: openai
    source_hash: 0c33c94971751d92a2ce695db545a0c0abb7adcbe1820383b83f4201fa7e628d
    source_path: concepts/context-engine.md
    workflow: 16
---

Een **context-engine** bepaalt hoe OpenClaw modelcontext opbouwt voor elke uitvoering: welke berichten worden opgenomen, hoe oudere geschiedenis wordt samengevat en hoe context over subagent-grenzen heen wordt beheerd.

OpenClaw wordt geleverd met een ingebouwde `legacy`-engine en gebruikt die standaard - de meeste gebruikers hoeven dit nooit te wijzigen. Installeer en selecteer alleen een Plugin-engine wanneer je ander assemblage-, compaction- of cross-session recall-gedrag wilt.

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
    Context-engine-plugins worden net als elke andere OpenClaw-plugin geinstalleerd.

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

    Herstart de gateway na installatie en configuratie.

  </Step>
  <Step title="Switch back to legacy (optional)">
    Stel `contextEngine` in op `"legacy"` (of verwijder de sleutel helemaal - `"legacy"` is de standaard).
  </Step>
</Steps>

## Hoe het werkt

Telkens wanneer OpenClaw een modelprompt uitvoert, neemt de context-engine deel op vier lifecycle-punten:

<AccordionGroup>
  <Accordion title="1. Ingest">
    Aangeroepen wanneer een nieuw bericht aan de sessie wordt toegevoegd. De engine kan het bericht opslaan of indexeren in zijn eigen datastore.
  </Accordion>
  <Accordion title="2. Assemble">
    Aangeroepen voor elke modeluitvoering. De engine retourneert een geordende set berichten (en een optionele `systemPromptAddition`) die binnen het tokenbudget past.
  </Accordion>
  <Accordion title="3. Compact">
    Aangeroepen wanneer het contextvenster vol is, of wanneer de gebruiker `/compact` uitvoert. De engine vat oudere geschiedenis samen om ruimte vrij te maken.
  </Accordion>
  <Accordion title="4. After turn">
    Aangeroepen nadat een uitvoering is voltooid. De engine kan status bewaren, achtergrond-compaction activeren of indexen bijwerken.
  </Accordion>
</AccordionGroup>

Voor de gebundelde niet-ACP Codex-harness past OpenClaw dezelfde lifecycle toe door geassembleerde context te projecteren naar Codex-ontwikkelaarsinstructies en de prompt van de huidige beurt. Codex blijft eigenaar van zijn native threadgeschiedenis en native compactor.

### Subagent-lifecycle (optioneel)

OpenClaw roept twee optionele subagent-lifecyclehooks aan:

<ParamField path="prepareSubagentSpawn" type="method">
  Bereid gedeelde contextstatus voor voordat een child-uitvoering start. De hook ontvangt parent/child-sessiesleutels, `contextMode` (`isolated` of `fork`), beschikbare transcript-id's/-bestanden en optionele TTL. Als deze een rollback-handle retourneert, roept OpenClaw die aan wanneer spawning mislukt nadat voorbereiding is geslaagd.
</ParamField>
<ParamField path="onSubagentEnded" type="method">
  Ruim op wanneer een subagent-sessie is voltooid of wordt opgeschoond.
</ParamField>

### Systeemprompttoevoeging

De methode `assemble` kan een `systemPromptAddition`-string retourneren. OpenClaw voegt deze vooraan toe aan de systeemprompt voor de uitvoering. Hierdoor kunnen engines dynamische recall-begeleiding, retrieval-instructies of contextbewuste hints injecteren zonder statische workspace-bestanden te vereisen.

## De legacy-engine

De ingebouwde `legacy`-engine behoudt het oorspronkelijke gedrag van OpenClaw:

- **Ingest**: no-op (de sessiemanager handelt berichtpersistentie rechtstreeks af).
- **Assemble**: pass-through (de bestaande sanitize -> validate -> limit-pipeline in de runtime handelt contextassemblage af).
- **Compact**: delegeert naar de ingebouwde summarization compaction, die een enkele samenvatting van oudere berichten maakt en recente berichten intact houdt.
- **After turn**: no-op.

De legacy-engine registreert geen tools en levert geen `systemPromptAddition`.

Wanneer er geen `plugins.slots.contextEngine` is ingesteld (of deze is ingesteld op `"legacy"`), wordt deze engine automatisch gebruikt.

## Plugin-engines

Een Plugin kan een context-engine registreren met de plugin-API:

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

De factory `ctx` bevat optionele waarden voor `config`, `agentDir` en `workspaceDir`, zodat plugins per-agent- of per-workspace-status kunnen initialiseren voordat de eerste lifecycle-hook wordt uitgevoerd.

Schakel die vervolgens in de configuratie in:

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

| Lid                | Soort    | Doel                                                     |
| ------------------ | -------- | -------------------------------------------------------- |
| `info`             | Property | Engine-id, naam, versie en of deze compaction bezit      |
| `ingest(params)`   | Method   | Een enkel bericht opslaan                                |
| `assemble(params)` | Method   | Context bouwen voor een modeluitvoering (retourneert `AssembleResult`) |
| `compact(params)`  | Method   | Context samenvatten/verkleinen                           |

`assemble` retourneert een `AssembleResult` met:

<ParamField path="messages" type="Message[]" required>
  De geordende berichten om naar het model te sturen.
</ParamField>
<ParamField path="estimatedTokens" type="number" required>
  De schatting van de engine van het totale aantal tokens in de geassembleerde context. OpenClaw gebruikt dit voor beslissingen over compaction-drempels en diagnostische rapportage.
</ParamField>
<ParamField path="systemPromptAddition" type="string">
  Vooraf toegevoegd aan de systeemprompt.
</ParamField>
<ParamField path="promptAuthority" type='"assembled" | "preassembly_may_overflow"'>
  Bepaalt welke tokenschatting de runner gebruikt voor preventieve overflow-prechecks. Standaard `"assembled"`, wat betekent dat alleen de schatting van de geassembleerde prompt wordt gecontroleerd - geschikt voor engines die een venstergebonden, zelfstandige context retourneren. Stel alleen in op `"preassembly_may_overflow"` wanneer je geassembleerde weergave overflow-risico in het onderliggende transcript kan verbergen; de runner neemt dan het maximum van de geassembleerde schatting en de pre-assembly (niet-venstergebonden) sessiegeschiedenisschatting bij het bepalen of preventief moet worden gecompact. Hoe dan ook zijn de berichten die je retourneert nog steeds wat het model ziet - `promptAuthority` beinvloedt alleen de precheck.
</ParamField>

`compact` retourneert een `CompactResult`. Wanneer compaction het actieve transcript roteert, identificeren `result.sessionId` en `result.sessionFile` de opvolgende sessie die de volgende retry of beurt moet gebruiken.

Optionele leden:

| Lid                            | Soort  | Doel                                                                                                            |
| ------------------------------ | ------ | --------------------------------------------------------------------------------------------------------------- |
| `bootstrap(params)`            | Method | Engine-status voor een sessie initialiseren. Eenmaal aangeroepen wanneer de engine voor het eerst een sessie ziet (bijv. geschiedenis importeren). |
| `ingestBatch(params)`          | Method | Een voltooide beurt als batch opnemen. Aangeroepen nadat een uitvoering is voltooid, met alle berichten uit die beurt tegelijk. |
| `afterTurn(params)`            | Method | Lifecycle-werk na de uitvoering (status bewaren, achtergrond-compaction activeren).                             |
| `prepareSubagentSpawn(params)` | Method | Gedeelde status instellen voor een child-sessie voordat die start.                                              |
| `onSubagentEnded(params)`      | Method | Opruimen nadat een subagent eindigt.                                                                            |
| `dispose()`                    | Method | Resources vrijgeven. Aangeroepen tijdens gateway-shutdown of het herladen van een Plugin - niet per sessie.     |

### ownsCompaction

`ownsCompaction` bepaalt of Pi's ingebouwde auto-compaction binnen de poging ingeschakeld blijft voor de uitvoering:

<AccordionGroup>
  <Accordion title="ownsCompaction: true">
    De engine bezit compaction-gedrag. OpenClaw schakelt Pi's ingebouwde auto-compaction uit voor die uitvoering, en de `compact()`-implementatie van de engine is verantwoordelijk voor `/compact`, overflow-recovery-compaction en elke proactieve compaction die de engine in `afterTurn()` wil uitvoeren. OpenClaw kan de overflow-beveiliging voor de prompt nog steeds uitvoeren; wanneer die voorspelt dat het volledige transcript zal overlopen, roept het recovery-pad de `compact()` van de actieve engine aan voordat een nieuwe prompt wordt ingediend.
  </Accordion>
  <Accordion title="ownsCompaction: false or unset">
    Pi's ingebouwde auto-compaction kan nog steeds worden uitgevoerd tijdens promptuitvoering, maar de methode `compact()` van de actieve engine wordt nog steeds aangeroepen voor `/compact` en overflow-recovery.
  </Accordion>
</AccordionGroup>

<Warning>
`ownsCompaction: false` betekent **niet** dat OpenClaw automatisch terugvalt op het compaction-pad van de legacy-engine.
</Warning>

Dat betekent dat er twee geldige Plugin-patronen zijn:

<Tabs>
  <Tab title="Owning mode">
    Implementeer je eigen compaction-algoritme en stel `ownsCompaction: true` in.
  </Tab>
  <Tab title="Delegating mode">
    Stel `ownsCompaction: false` in en laat `compact()` `delegateCompactionToRuntime(...)` uit `openclaw/plugin-sdk/core` aanroepen om OpenClaw's ingebouwde compaction-gedrag te gebruiken.
  </Tab>
</Tabs>

Een no-op `compact()` is onveilig voor een actieve niet-eigenaar-engine, omdat deze het normale `/compact`- en overflow-recovery-compaction-pad voor die engineslot uitschakelt.

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
De slot is exclusief tijdens runtime - er wordt slechts een geregistreerde context-engine opgelost voor een gegeven uitvoering of compaction-bewerking. Andere ingeschakelde `kind: "context-engine"`-plugins kunnen nog steeds laden en hun registratiecode uitvoeren; `plugins.slots.contextEngine` selecteert alleen welke geregistreerde engine-id OpenClaw oplost wanneer het een context-engine nodig heeft.
</Note>

<Note>
**Plugin verwijderen:** wanneer je de Plugin verwijdert die momenteel is geselecteerd als `plugins.slots.contextEngine`, zet OpenClaw de slot terug naar de standaard (`legacy`). Hetzelfde resetgedrag geldt voor `plugins.slots.memory`. Er is geen handmatige configuratiewijziging vereist.
</Note>

## Relatie tot compaction en geheugen

<AccordionGroup>
  <Accordion title="Compaction">
    Compaction is één verantwoordelijkheid van de context-engine. De legacy-engine delegeert aan de ingebouwde samenvatting van OpenClaw. Plugin-engines kunnen elke compaction-strategie implementeren (DAG-samenvattingen, vectorretrieval, enz.).
  </Accordion>
  <Accordion title="Geheugenplugins">
    Geheugenplugins (`plugins.slots.memory`) staan los van context-engines. Geheugenplugins bieden zoeken/retrieval; context-engines bepalen wat het model ziet. Ze kunnen samenwerken - een context-engine kan gegevens van geheugenplugins gebruiken tijdens de assemblage. Plugin-engines die het actieve-geheugenpromptpad willen gebruiken, moeten bij voorkeur `buildMemorySystemPromptAddition(...)` uit `openclaw/plugin-sdk/core` gebruiken, waarmee de actieve-geheugenpromptsecties worden omgezet in een kant-en-klare `systemPromptAddition` die vooraan kan worden toegevoegd. Als een engine meer controle op lager niveau nodig heeft, kan deze nog steeds ruwe regels ophalen uit `openclaw/plugin-sdk/memory-host-core` via `buildActiveMemoryPromptSection(...)`.
  </Accordion>
  <Accordion title="Sessiesnoei">
    Het in het geheugen inkorten van oude toolresultaten blijft altijd draaien, ongeacht welke context-engine actief is.
  </Accordion>
</AccordionGroup>

## Tips

- Gebruik `openclaw doctor` om te controleren of je engine correct wordt geladen.
- Als je van engine wisselt, gaan bestaande sessies door met hun huidige geschiedenis. De nieuwe engine neemt toekomstige runs over.
- Enginefouten worden gelogd en weergegeven in diagnostics. Als een plugin-engine niet kan worden geregistreerd of de geselecteerde engine-id niet kan worden opgelost, valt OpenClaw niet automatisch terug; runs mislukken totdat je de plugin repareert of `plugins.slots.contextEngine` terugzet naar `"legacy"`.
- Gebruik voor ontwikkeling `openclaw plugins install -l ./my-engine` om een lokale pluginmap te koppelen zonder te kopiëren.

## Gerelateerd

- [Compaction](/nl/concepts/compaction) - lange gesprekken samenvatten
- [Context](/nl/concepts/context) - hoe context wordt opgebouwd voor agentbeurten
- [Plugin-architectuur](/nl/plugins/architecture) - context-engineplugins registreren
- [Pluginmanifest](/nl/plugins/manifest) - velden van het pluginmanifest
- [Plugins](/nl/tools/plugin) - pluginoverzicht
