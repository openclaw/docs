---
read_when:
    - Je wilt begrijpen hoe OpenClaw modelcontext samenstelt
    - Je schakelt tussen de verouderde motor en een Plugin-motor
    - Je bouwt een contextengine-Plugin
sidebarTitle: Context engine
summary: 'Contextengine: inplugbare contextopbouw, Compaction en levenscyclus van subagenten'
title: Contextengine
x-i18n:
    generated_at: "2026-04-29T22:37:42Z"
    model: gpt-5.5
    provider: openai
    source_hash: 8f192c6b28ad2b5960b504811926fb5e30fe8da9d985d8eec3ad4b65c9f7cae5
    source_path: concepts/context-engine.md
    workflow: 16
---

Een **context-engine** bepaalt hoe OpenClaw modelcontext opbouwt voor elke uitvoering: welke berichten worden opgenomen, hoe oudere geschiedenis wordt samengevat en hoe context over subagent-grenzen heen wordt beheerd.

OpenClaw wordt geleverd met een ingebouwde `legacy`-engine en gebruikt die standaard — de meeste gebruikers hoeven dit nooit te wijzigen. Installeer en selecteer alleen een plugin-engine wanneer je ander assemblage-, compaction- of cross-session recall-gedrag wilt.

## Snelle start

<Steps>
  <Step title="Controleren welke engine actief is">
    ```bash
    openclaw doctor
    # or inspect config directly:
    cat ~/.openclaw/openclaw.json | jq '.plugins.slots.contextEngine'
    ```
  </Step>
  <Step title="Een plugin-engine installeren">
    Context-engine-plugins worden geïnstalleerd zoals elke andere OpenClaw-plugin.

    <Tabs>
      <Tab title="Vanaf npm">
        ```bash
        openclaw plugins install @martian-engineering/lossless-claw
        ```
      </Tab>
      <Tab title="Vanaf een lokaal pad">
        ```bash
        openclaw plugins install -l ./my-context-engine
        ```
      </Tab>
    </Tabs>

  </Step>
  <Step title="De engine inschakelen en selecteren">
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
  <Step title="Terugschakelen naar legacy (optioneel)">
    Zet `contextEngine` op `"legacy"` (of verwijder de sleutel helemaal — `"legacy"` is de standaardinstelling).
  </Step>
</Steps>

## Hoe het werkt

Telkens wanneer OpenClaw een modelprompt uitvoert, neemt de context-engine deel op vier lifecycle-punten:

<AccordionGroup>
  <Accordion title="1. Ingest">
    Wordt aangeroepen wanneer een nieuw bericht aan de sessie wordt toegevoegd. De engine kan het bericht opslaan of indexeren in zijn eigen datastore.
  </Accordion>
  <Accordion title="2. Assemble">
    Wordt aangeroepen vóór elke modeluitvoering. De engine retourneert een geordende set berichten (en een optionele `systemPromptAddition`) die binnen het tokenbudget past.
  </Accordion>
  <Accordion title="3. Compact">
    Wordt aangeroepen wanneer het contextvenster vol is, of wanneer de gebruiker `/compact` uitvoert. De engine vat oudere geschiedenis samen om ruimte vrij te maken.
  </Accordion>
  <Accordion title="4. Na de beurt">
    Wordt aangeroepen nadat een uitvoering is voltooid. De engine kan status bewaren, achtergrondcompaction triggeren of indexen bijwerken.
  </Accordion>
</AccordionGroup>

Voor de meegeleverde niet-ACP Codex-harness past OpenClaw dezelfde lifecycle toe door geassembleerde context te projecteren naar Codex-developerinstructies en de prompt van de huidige beurt. Codex blijft eigenaar van zijn eigen native thread-geschiedenis en native compactor.

### Subagent-lifecycle (optioneel)

OpenClaw roept twee optionele subagent-lifecycle-hooks aan:

<ParamField path="prepareSubagentSpawn" type="method">
  Bereid gedeelde contextstatus voor voordat een child-uitvoering start. De hook ontvangt parent/child-sessiesleutels, `contextMode` (`isolated` of `fork`), beschikbare transcript-id's/-bestanden en optionele TTL. Als deze een rollback-handle retourneert, roept OpenClaw die aan wanneer spawn mislukt nadat voorbereiding is geslaagd.
</ParamField>
<ParamField path="onSubagentEnded" type="method">
  Ruim op wanneer een subagent-sessie is voltooid of wordt opgeveegd.
</ParamField>

### Systeemprompttoevoeging

De methode `assemble` kan een `systemPromptAddition`-string retourneren. OpenClaw voegt deze vóór de systeemprompt voor de uitvoering toe. Hiermee kunnen engines dynamische recall-richtlijnen, retrieval-instructies of contextbewuste hints injecteren zonder statische workspace-bestanden te vereisen.

## De legacy-engine

De ingebouwde `legacy`-engine behoudt het oorspronkelijke gedrag van OpenClaw:

- **Ingest**: no-op (de sessiemanager handelt berichtpersistentie rechtstreeks af).
- **Assemble**: pass-through (de bestaande sanitize → validate → limit-pijplijn in de runtime handelt contextassemblage af).
- **Compact**: delegeert naar de ingebouwde summarization-compaction, die één samenvatting van oudere berichten maakt en recente berichten intact laat.
- **Na de beurt**: no-op.

De legacy-engine registreert geen tools en levert geen `systemPromptAddition`.

Wanneer geen `plugins.slots.contextEngine` is ingesteld (of deze op `"legacy"` is ingesteld), wordt deze engine automatisch gebruikt.

## Plugin-engines

Een plugin kan een context-engine registreren met de plugin-API:

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

De factory `ctx` bevat optionele waarden voor `config`, `agentDir` en `workspaceDir`,
zodat plugins per-agent- of per-workspace-status kunnen initialiseren voordat de
eerste lifecycle-hook wordt uitgevoerd.

Schakel deze daarna in de configuratie in:

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

| Member             | Soort    | Doel                                                      |
| ------------------ | -------- | --------------------------------------------------------- |
| `info`             | Property | Engine-id, naam, versie en of deze compaction beheert     |
| `ingest(params)`   | Method   | Eén bericht opslaan                                       |
| `assemble(params)` | Method   | Context bouwen voor een modeluitvoering (retourneert `AssembleResult`) |
| `compact(params)`  | Method   | Context samenvatten/reduceren                             |

`assemble` retourneert een `AssembleResult` met:

<ParamField path="messages" type="Message[]" required>
  De geordende berichten die naar het model worden gestuurd.
</ParamField>
<ParamField path="estimatedTokens" type="number" required>
  De schatting van de engine van het totale aantal tokens in de geassembleerde context. OpenClaw gebruikt dit voor beslissingen over compaction-drempels en diagnostische rapportage.
</ParamField>
<ParamField path="systemPromptAddition" type="string">
  Wordt vóór de systeemprompt toegevoegd.
</ParamField>

`compact` retourneert een `CompactResult`. Wanneer compaction het actieve
transcript roteert, identificeren `result.sessionId` en `result.sessionFile` de opvolgende
sessie die de volgende retry of beurt moet gebruiken.

Optionele members:

| Member                         | Soort  | Doel                                                                                                            |
| ------------------------------ | ------ | --------------------------------------------------------------------------------------------------------------- |
| `bootstrap(params)`            | Method | Engine-status initialiseren voor een sessie. Wordt eenmaal aangeroepen wanneer de engine voor het eerst een sessie ziet (bijv. importgeschiedenis). |
| `ingestBatch(params)`          | Method | Een voltooide beurt als batch opnemen. Wordt aangeroepen nadat een uitvoering is voltooid, met alle berichten uit die beurt tegelijk. |
| `afterTurn(params)`            | Method | Lifecycle-werk na de uitvoering (status bewaren, achtergrondcompaction triggeren).                              |
| `prepareSubagentSpawn(params)` | Method | Gedeelde status instellen voor een child-sessie voordat deze start.                                             |
| `onSubagentEnded(params)`      | Method | Opruimen nadat een subagent eindigt.                                                                            |
| `dispose()`                    | Method | Resources vrijgeven. Wordt aangeroepen tijdens Gateway-shutdown of het herladen van plugins — niet per sessie. |

### ownsCompaction

`ownsCompaction` bepaalt of Pi's ingebouwde auto-compaction binnen de poging ingeschakeld blijft voor de uitvoering:

<AccordionGroup>
  <Accordion title="ownsCompaction: true">
    De engine beheert compaction-gedrag. OpenClaw schakelt Pi's ingebouwde auto-compaction voor die uitvoering uit, en de `compact()`-implementatie van de engine is verantwoordelijk voor `/compact`, overflow-herstelcompaction en eventuele proactieve compaction die deze in `afterTurn()` wil uitvoeren. OpenClaw kan de pre-prompt-overflowbeveiliging nog steeds uitvoeren; wanneer die voorspelt dat het volledige transcript zal overlopen, roept het herstelpad de `compact()` van de actieve engine aan voordat een nieuwe prompt wordt verzonden.
  </Accordion>
  <Accordion title="ownsCompaction: false of niet ingesteld">
    Pi's ingebouwde auto-compaction kan nog steeds worden uitgevoerd tijdens promptuitvoering, maar de `compact()`-methode van de actieve engine wordt nog steeds aangeroepen voor `/compact` en overflow-herstel.
  </Accordion>
</AccordionGroup>

<Warning>
`ownsCompaction: false` betekent **niet** dat OpenClaw automatisch terugvalt op het compaction-pad van de legacy-engine.
</Warning>

Dat betekent dat er twee geldige pluginpatronen zijn:

<Tabs>
  <Tab title="Eigen beheermodus">
    Implementeer je eigen compaction-algoritme en stel `ownsCompaction: true` in.
  </Tab>
  <Tab title="Delegatiemodus">
    Stel `ownsCompaction: false` in en laat `compact()` `delegateCompactionToRuntime(...)` uit `openclaw/plugin-sdk/core` aanroepen om OpenClaw's ingebouwde compaction-gedrag te gebruiken.
  </Tab>
</Tabs>

Een no-op `compact()` is onveilig voor een actieve niet-beherende engine, omdat dit het normale `/compact`- en overflow-herstelcompaction-pad voor dat engine-slot uitschakelt.

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
Het slot is exclusief tijdens runtime — er wordt slechts één geregistreerde context-engine opgelost voor een gegeven uitvoering of compaction-bewerking. Andere ingeschakelde `kind: "context-engine"`-plugins kunnen nog steeds laden en hun registratiecode uitvoeren; `plugins.slots.contextEngine` selecteert alleen welk geregistreerd engine-id OpenClaw oplost wanneer het een context-engine nodig heeft.
</Note>

<Note>
**Plugin verwijderen:** wanneer je de plugin verwijdert die momenteel is geselecteerd als `plugins.slots.contextEngine`, zet OpenClaw het slot terug naar de standaardinstelling (`legacy`). Hetzelfde resetgedrag geldt voor `plugins.slots.memory`. Handmatige configuratiebewerking is niet nodig.
</Note>

## Relatie tot compaction en memory

<AccordionGroup>
  <Accordion title="Compaction">
    Compaction is een verantwoordelijkheid van de contextengine. De verouderde engine delegeert aan de ingebouwde samenvatting van OpenClaw. Plugin-engines kunnen elke compaction-strategie implementeren (DAG-samenvattingen, vectoropvraging, enz.).
  </Accordion>
  <Accordion title="Geheugenplugins">
    Geheugenplugins (`plugins.slots.memory`) staan los van contextengines. Geheugenplugins bieden zoeken/ophalen; contextengines bepalen wat het model ziet. Ze kunnen samenwerken — een contextengine kan gegevens van geheugenplugins gebruiken tijdens de assemblage. Plugin-engines die het Active Memory-promptpad willen, moeten bij voorkeur `buildMemorySystemPromptAddition(...)` uit `openclaw/plugin-sdk/core` gebruiken, dat de Active Memory-promptsecties omzet in een kant-en-klare, vooraf toe te voegen `systemPromptAddition`. Als een engine fijnmazigere controle nodig heeft, kan deze nog steeds ruwe regels uit `openclaw/plugin-sdk/memory-host-core` halen via `buildActiveMemoryPromptSection(...)`.
  </Accordion>
  <Accordion title="Sessie-opschoning">
    Het in het geheugen inkorten van oude toolresultaten blijft draaien, ongeacht welke contextengine actief is.
  </Accordion>
</AccordionGroup>

## Tips

- Gebruik `openclaw doctor` om te verifiëren dat je engine correct wordt geladen.
- Als je van engine wisselt, gaan bestaande sessies door met hun huidige geschiedenis. De nieuwe engine neemt toekomstige runs over.
- Enginefouten worden gelogd en getoond in diagnostiek. Als een Plugin-engine niet kan worden geregistreerd of de geselecteerde engine-id niet kan worden opgelost, valt OpenClaw niet automatisch terug; runs mislukken totdat je de Plugin herstelt of `plugins.slots.contextEngine` terugzet naar `"legacy"`.
- Gebruik voor ontwikkeling `openclaw plugins install -l ./my-engine` om een lokale Plugin-map te koppelen zonder te kopiëren.

## Gerelateerd

- [Compaction](/nl/concepts/compaction) — lange gesprekken samenvatten
- [Context](/nl/concepts/context) — hoe context wordt opgebouwd voor agentbeurten
- [Plugin-architectuur](/nl/plugins/architecture) — contextengine-Plugins registreren
- [Pluginmanifest](/nl/plugins/manifest) — velden van het Pluginmanifest
- [Plugins](/nl/tools/plugin) — Plugin-overzicht
