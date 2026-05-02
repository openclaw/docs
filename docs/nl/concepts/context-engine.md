---
read_when:
    - Je wilt begrijpen hoe OpenClaw modelcontext samenstelt
    - Je schakelt tussen de verouderde engine en een Plugin-engine
    - Je bouwt een contextengine-Plugin
sidebarTitle: Context engine
summary: 'Contextengine: plug-inbare contextopbouw, Compaction en levenscyclus van subagents'
title: Contextengine
x-i18n:
    generated_at: "2026-05-02T11:14:07Z"
    model: gpt-5.5
    provider: openai
    source_hash: e7477dd1d48f9633586dce67204912a810e0931d7bc9f2d6719ba465fe19681b
    source_path: concepts/context-engine.md
    workflow: 16
---

Een **context-engine** bepaalt hoe OpenClaw modelcontext voor elke run opbouwt: welke berichten worden opgenomen, hoe oudere geschiedenis wordt samengevat en hoe context over subagent-grenzen heen wordt beheerd.

OpenClaw wordt geleverd met een ingebouwde `legacy`-engine en gebruikt die standaard — de meeste gebruikers hoeven dit nooit te wijzigen. Installeer en selecteer alleen een Plugin-engine wanneer je ander samenstellings-, compaction- of cross-session recall-gedrag wilt.

## Snel aan de slag

<Steps>
  <Step title="Controleren welke engine actief is">
    ```bash
    openclaw doctor
    # of inspecteer de configuratie rechtstreeks:
    cat ~/.openclaw/openclaw.json | jq '.plugins.slots.contextEngine'
    ```
  </Step>
  <Step title="Een Plugin-engine installeren">
    Context-engine-Plugins worden geïnstalleerd zoals elke andere OpenClaw-Plugin.

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
    Stel `contextEngine` in op `"legacy"` (of verwijder de sleutel volledig — `"legacy"` is de standaardinstelling).
  </Step>
</Steps>

## Hoe het werkt

Elke keer dat OpenClaw een modelprompt uitvoert, neemt de context-engine deel op vier momenten in de levenscyclus:

<AccordionGroup>
  <Accordion title="1. Opnemen">
    Aangeroepen wanneer een nieuw bericht aan de sessie wordt toegevoegd. De engine kan het bericht opslaan of indexeren in zijn eigen datastore.
  </Accordion>
  <Accordion title="2. Samenstellen">
    Aangeroepen vóór elke modelrun. De engine retourneert een geordende set berichten (en een optionele `systemPromptAddition`) die binnen het tokenbudget past.
  </Accordion>
  <Accordion title="3. Compact maken">
    Aangeroepen wanneer het contextvenster vol is, of wanneer de gebruiker `/compact` uitvoert. De engine vat oudere geschiedenis samen om ruimte vrij te maken.
  </Accordion>
  <Accordion title="4. Na de beurt">
    Aangeroepen nadat een run is voltooid. De engine kan status persistent opslaan, Compaction op de achtergrond starten of indexen bijwerken.
  </Accordion>
</AccordionGroup>

Voor de meegeleverde niet-ACP Codex-harness past OpenClaw dezelfde levenscyclus toe door samengestelde context te projecteren naar Codex-ontwikkelaarsinstructies en de prompt van de huidige beurt. Codex blijft eigenaar van zijn native threadgeschiedenis en native compactor.

### Subagent-levenscyclus (optioneel)

OpenClaw roept twee optionele hooks voor de subagent-levenscyclus aan:

<ParamField path="prepareSubagentSpawn" type="method">
  Bereid gedeelde contextstatus voor voordat een child-run start. De hook ontvangt parent/child-sessiesleutels, `contextMode` (`isolated` of `fork`), beschikbare transcript-id's/-bestanden en optionele TTL. Als deze een rollback-handle retourneert, roept OpenClaw die aan wanneer spawn mislukt nadat de voorbereiding is geslaagd.
</ParamField>
<ParamField path="onSubagentEnded" type="method">
  Ruim op wanneer een subagent-sessie wordt voltooid of opgeschoond.
</ParamField>

### Toevoeging aan de systeemprompt

De methode `assemble` kan een `systemPromptAddition`-string retourneren. OpenClaw voegt deze vooraan toe aan de systeemprompt voor de run. Hierdoor kunnen engines dynamische recall-richtlijnen, retrieval-instructies of contextbewuste hints injecteren zonder statische workspace-bestanden te vereisen.

## De legacy-engine

De ingebouwde `legacy`-engine behoudt het oorspronkelijke gedrag van OpenClaw:

- **Opnemen**: no-op (de sessiemanager handelt berichtpersistentie rechtstreeks af).
- **Samenstellen**: pass-through (de bestaande sanitize → validate → limit-pijplijn in de runtime handelt contextsamenstelling af).
- **Compact maken**: delegeert naar de ingebouwde samenvattende Compaction, die één samenvatting van oudere berichten maakt en recente berichten intact laat.
- **Na de beurt**: no-op.

De legacy-engine registreert geen tools en levert geen `systemPromptAddition`.

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

De factory `ctx` bevat optionele waarden voor `config`, `agentDir` en `workspaceDir`, zodat Plugins per-agent- of per-workspace-status kunnen initialiseren voordat de eerste levenscyclus-hook wordt uitgevoerd.

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

| Member             | Soort    | Doel                                                     |
| ------------------ | -------- | -------------------------------------------------------- |
| `info`             | Property | Engine-id, naam, versie en of deze Compaction beheert    |
| `ingest(params)`   | Method   | Eén bericht opslaan                                     |
| `assemble(params)` | Method   | Context bouwen voor een modelrun (retourneert `AssembleResult`) |
| `compact(params)`  | Method   | Context samenvatten/verkleinen                          |

`assemble` retourneert een `AssembleResult` met:

<ParamField path="messages" type="Message[]" required>
  De geordende berichten die naar het model worden verzonden.
</ParamField>
<ParamField path="estimatedTokens" type="number" required>
  De schatting van de engine van het totale aantal tokens in de samengestelde context. OpenClaw gebruikt dit voor beslissingen over Compaction-drempels en diagnostische rapportage.
</ParamField>
<ParamField path="systemPromptAddition" type="string">
  Voorgevoegd aan de systeemprompt.
</ParamField>
<ParamField path="promptAuthority" type='"assembled" | "preassembly_may_overflow"'>
  Bepaalt welke tokenschatting de runner gebruikt voor preventieve overflow-prechecks. Standaard is dit `"assembled"`, wat betekent dat alleen de schatting van de samengestelde prompt wordt gecontroleerd — geschikt voor engines die een venstergebonden, zelfstandige context retourneren. Stel dit alleen in op `"preassembly_may_overflow"` wanneer je samengestelde weergave overflowrisico in het onderliggende transcript kan verbergen; de runner neemt dan het maximum van de samengestelde schatting en de pre-assembly (niet-venstergebonden) schatting van de sessiegeschiedenis bij de beslissing of preventief compact maken nodig is. Hoe dan ook blijven de berichten die je retourneert wat het model ziet — `promptAuthority` beïnvloedt alleen de precheck.
</ParamField>

`compact` retourneert een `CompactResult`. Wanneer Compaction het actieve transcript roteert, identificeren `result.sessionId` en `result.sessionFile` de opvolgende sessie die de volgende retry of beurt moet gebruiken.

Optionele members:

| Member                         | Soort  | Doel                                                                                                            |
| ------------------------------ | ------ | --------------------------------------------------------------------------------------------------------------- |
| `bootstrap(params)`            | Method | Engine-status voor een sessie initialiseren. Wordt eenmaal aangeroepen wanneer de engine voor het eerst een sessie ziet (bijv. geschiedenis importeren). |
| `ingestBatch(params)`          | Method | Een voltooide beurt als batch opnemen. Wordt aangeroepen nadat een run is voltooid, met alle berichten uit die beurt tegelijk. |
| `afterTurn(params)`            | Method | Levenscycluswerk na een run (status persistent opslaan, Compaction op de achtergrond starten).                   |
| `prepareSubagentSpawn(params)` | Method | Gedeelde status instellen voor een child-sessie voordat die start.                                               |
| `onSubagentEnded(params)`      | Method | Opruimen nadat een subagent eindigt.                                                                             |
| `dispose()`                    | Method | Resources vrijgeven. Wordt aangeroepen tijdens Gateway-shutdown of Plugin-reload — niet per sessie.              |

### ownsCompaction

`ownsCompaction` bepaalt of Pi's ingebouwde automatische Compaction binnen een poging ingeschakeld blijft voor de run:

<AccordionGroup>
  <Accordion title="ownsCompaction: true">
    De engine beheert het Compaction-gedrag. OpenClaw schakelt Pi's ingebouwde automatische Compaction uit voor die run, en de `compact()`-implementatie van de engine is verantwoordelijk voor `/compact`, Compaction voor overflowherstel en elke proactieve Compaction die de engine in `afterTurn()` wil uitvoeren. OpenClaw kan nog steeds de overflow-beveiliging vóór de prompt uitvoeren; wanneer die voorspelt dat het volledige transcript zal overlopen, roept het herstelpad de `compact()` van de actieve engine aan voordat een andere prompt wordt verzonden.
  </Accordion>
  <Accordion title="ownsCompaction: false of niet ingesteld">
    Pi's ingebouwde automatische Compaction kan nog steeds worden uitgevoerd tijdens promptuitvoering, maar de methode `compact()` van de actieve engine wordt nog steeds aangeroepen voor `/compact` en overflowherstel.
  </Accordion>
</AccordionGroup>

<Warning>
`ownsCompaction: false` betekent **niet** dat OpenClaw automatisch terugvalt op het Compaction-pad van de legacy-engine.
</Warning>

Dat betekent dat er twee geldige Plugin-patronen zijn:

<Tabs>
  <Tab title="Eigenaarmodus">
    Implementeer je eigen Compaction-algoritme en stel `ownsCompaction: true` in.
  </Tab>
  <Tab title="Delegatiemodus">
    Stel `ownsCompaction: false` in en laat `compact()` `delegateCompactionToRuntime(...)` uit `openclaw/plugin-sdk/core` aanroepen om het ingebouwde Compaction-gedrag van OpenClaw te gebruiken.
  </Tab>
</Tabs>

Een no-op `compact()` is onveilig voor een actieve niet-beherende engine, omdat dit het normale `/compact`- en overflowherstel-Compaction-pad voor die engineslot uitschakelt.

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
De slot is exclusief tijdens runtime — er wordt slechts één geregistreerde context-engine opgelost voor een bepaalde run of Compaction-bewerking. Andere ingeschakelde `kind: "context-engine"`-Plugins kunnen nog steeds laden en hun registratiecode uitvoeren; `plugins.slots.contextEngine` selecteert alleen welke geregistreerde engine-id OpenClaw oplost wanneer het een context-engine nodig heeft.
</Note>

<Note>
**Plugin verwijderen:** wanneer je de Plugin verwijdert die momenteel is geselecteerd als `plugins.slots.contextEngine`, zet OpenClaw de slot terug naar de standaardinstelling (`legacy`). Hetzelfde resetgedrag geldt voor `plugins.slots.memory`. Er is geen handmatige configuratiebewerking vereist.
</Note>

## Relatie tot Compaction en memory

<AccordionGroup>
  <Accordion title="Compaction">
    Compaction is één verantwoordelijkheid van de contextengine. De legacy-engine delegeert naar de ingebouwde samenvatting van OpenClaw. Plugin-engines kunnen elke compaction-strategie implementeren (DAG-samenvattingen, vectorretrieval, enz.).
  </Accordion>
  <Accordion title="Geheugenplugins">
    Geheugenplugins (`plugins.slots.memory`) staan los van contextengines. Geheugenplugins bieden zoeken/retrieval; contextengines bepalen wat het model ziet. Ze kunnen samenwerken — een contextengine kan gegevens van geheugenplugins gebruiken tijdens de samenstelling. Plugin-engines die het active-memory-promptpad willen, moeten bij voorkeur `buildMemorySystemPromptAddition(...)` uit `openclaw/plugin-sdk/core` gebruiken, dat de active-memory-promptsecties omzet in een kant-en-klare, vooraan toe te voegen `systemPromptAddition`. Als een engine fijnmazigere controle nodig heeft, kan deze nog steeds ruwe regels ophalen uit `openclaw/plugin-sdk/memory-host-core` via `buildActiveMemoryPromptSection(...)`.
  </Accordion>
  <Accordion title="Sessies snoeien">
    Het in het geheugen inkorten van oude toolresultaten blijft draaien, ongeacht welke contextengine actief is.
  </Accordion>
</AccordionGroup>

## Tips

- Gebruik `openclaw doctor` om te verifiëren dat je engine correct wordt geladen.
- Als je van engine wisselt, gaan bestaande sessies verder met hun huidige geschiedenis. De nieuwe engine neemt toekomstige runs over.
- Enginefouten worden gelogd en zichtbaar gemaakt in diagnostics. Als een plugin-engine zich niet kan registreren of de geselecteerde engine-id niet kan worden opgelost, valt OpenClaw niet automatisch terug; runs mislukken totdat je de plugin herstelt of `plugins.slots.contextEngine` terugzet naar `"legacy"`.
- Gebruik tijdens ontwikkeling `openclaw plugins install -l ./my-engine` om een lokale pluginmap te koppelen zonder te kopiëren.

## Gerelateerd

- [Compaction](/nl/concepts/compaction) — lange gesprekken samenvatten
- [Context](/nl/concepts/context) — hoe context wordt opgebouwd voor agentbeurten
- [Plugin-architectuur](/nl/plugins/architecture) — contextengineplugins registreren
- [Plugin-manifest](/nl/plugins/manifest) — velden van het pluginmanifest
- [Plugins](/nl/tools/plugin) — pluginoverzicht
