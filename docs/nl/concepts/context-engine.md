---
read_when:
    - Je wilt begrijpen hoe OpenClaw modelcontext samenstelt
    - Je schakelt tussen de verouderde engine en een plugin-engine
    - Je bouwt een contextengineplugin
sidebarTitle: Context engine
summary: 'Context-engine: uitbreidbare contextopbouw, Compaction en levenscyclus van subagents'
title: Contextengine
x-i18n:
    generated_at: "2026-07-16T15:29:32Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 05cb5eb01f002001354dc63b77cdb86f3e9f3bc51722bd943ac20c9e1566dc60
    source_path: concepts/context-engine.md
    workflow: 16
---

Een **contextengine** bepaalt hoe OpenClaw voor elke uitvoering modelcontext opbouwt: welke berichten worden opgenomen, hoe oudere geschiedenis wordt samengevat en hoe context over subagentgrenzen heen wordt beheerd.

OpenClaw wordt geleverd met een ingebouwde `legacy`-engine en gebruikt deze standaard. Installeer en selecteer alleen een Plugin-engine als je ander gedrag wilt voor samenstelling, Compaction of herinnering tussen sessies.

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
    Plugins voor contextengines worden geïnstalleerd zoals elke andere OpenClaw-Plugin.

    <Tabs>
      <Tab title="Van npm">
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
          contextEngine: "lossless-claw", // moet overeenkomen met de geregistreerde engine-id van de Plugin
        },
        entries: {
          "lossless-claw": {
            enabled: true,
            // Pluginspecifieke configuratie komt hier (zie de documentatie van de Plugin)
          },
        },
      },
    }
    ```

    Start de Gateway opnieuw nadat je de engine hebt geïnstalleerd en geconfigureerd.

  </Step>
  <Step title="Terugschakelen naar legacy (optioneel)">
    Stel `contextEngine` in op `"legacy"` (of verwijder de sleutel volledig — `"legacy"` is de standaardwaarde).
  </Step>
</Steps>

## Hoe het werkt

Elke keer dat OpenClaw een modelprompt uitvoert, neemt de contextengine op vier momenten in de levenscyclus deel:

<AccordionGroup>
  <Accordion title="1. Opnemen">
    Wordt aangeroepen wanneer een nieuw bericht aan de sessie wordt toegevoegd. De engine kan het bericht in zijn eigen gegevensopslag opslaan of indexeren.
  </Accordion>
  <Accordion title="2. Samenstellen">
    Wordt vóór elke modeluitvoering aangeroepen. De engine retourneert een geordende verzameling berichten (en een optionele `systemPromptAddition`) die binnen het tokenbudget passen.
  </Accordion>
  <Accordion title="3. Compaction">
    Wordt aangeroepen wanneer het contextvenster vol is of wanneer de gebruiker `/compact` uitvoert. De engine vat oudere geschiedenis samen om ruimte vrij te maken.
  </Accordion>
  <Accordion title="4. Na de beurt">
    Wordt aangeroepen nadat een uitvoering is voltooid. De engine kan status persistent opslaan, Compaction op de achtergrond activeren of indexen bijwerken.
  </Accordion>
</AccordionGroup>

Engines kunnen ook een optionele `maintain()`-methode implementeren voor transcriptbeheer (veilige herschrijvingen via `runtimeContext.rewriteTranscriptEntries()`) na het opstarten, een geslaagde beurt of Compaction. Stel `info.turnMaintenanceMode: "background"` in om dit als uitgesteld werk uit te voeren in plaats van het antwoord te blokkeren.

Voor de meegeleverde niet-ACP Codex-harnas past OpenClaw dezelfde levenscyclus toe door de samengestelde context te projecteren in Codex-ontwikkelaarsinstructies en de prompt van de huidige beurt. Codex beheert nog steeds zijn eigen systeemeigen threadgeschiedenis en compactor.

### Levenscyclus van subagents (optioneel)

OpenClaw roept twee optionele levenscyclushooks voor subagents aan:

<ParamField path="prepareSubagentSpawn" type="method">
  Bereid gedeelde contextstatus voor voordat een onderliggende uitvoering begint. De hook ontvangt sessiesleutels van de ouder en het kind, `contextMode` (`isolated` of `fork`), beschikbare transcript-id's/-bestanden en een optionele TTL. Als deze een rollback-handle retourneert, roept OpenClaw die aan wanneer het starten mislukt nadat de voorbereiding is geslaagd. Systeemeigen subagentstarts die `lightContext` aanvragen en worden omgezet naar `contextMode="isolated"`, slaan deze hook bewust over, zodat het kind begint met de lichtgewicht opstartcontext zonder door de contextengine beheerde status vóór het starten.
</ParamField>
<ParamField path="onSubagentEnded" type="method">
  Ruim op wanneer een subagentsessie wordt voltooid of opgeschoond.
</ParamField>

### Toevoeging aan de systeemprompt

De methode `assemble` kan een `systemPromptAddition`-tekenreeks retourneren. OpenClaw voegt deze vóór de systeemprompt voor de uitvoering in. Zo kunnen engines dynamische richtlijnen voor herinnering, ophaalinstructies of contextbewuste aanwijzingen injecteren zonder statische werkruimtebestanden nodig te hebben.

## De legacy-engine

De ingebouwde `legacy`-engine behoudt het oorspronkelijke gedrag van OpenClaw:

- **Opnemen**: geen bewerking (de sessiebeheerder handelt de persistentie van berichten rechtstreeks af).
- **Samenstellen**: ongewijzigde doorgifte (de bestaande pijplijn opschonen → valideren → beperken in de runtime handelt de contextsamenstelling af).
- **Compaction**: delegeert aan de ingebouwde samenvattende Compaction, die één samenvatting van oudere berichten maakt en recente berichten intact laat.
- **Na de beurt**: geen bewerking.

De legacy-engine registreert geen hulpmiddelen en biedt geen `systemPromptAddition`.

Wanneer geen `plugins.slots.contextEngine` is ingesteld (of deze is ingesteld op `"legacy"`), wordt deze engine automatisch gebruikt.

## Plugin-engines

Een Plugin kan via de Plugin-API een contextengine registreren:

```ts
import { buildMemorySystemPromptAddition } from "openclaw/plugin-sdk/core";
import { resolveSessionAgentId } from "openclaw/plugin-sdk/memory-host-core";

export default function register(api) {
  api.registerContextEngine("my-engine", (ctx) => ({
    info: {
      id: "my-engine",
      name: "My Context Engine",
      ownsCompaction: true,
    },

    async ingest({ sessionId, message, isHeartbeat }) {
      // Sla het bericht op in je gegevensopslag
      return { ingested: true };
    },

    async assemble({
      sessionId,
      sessionKey,
      messages,
      tokenBudget,
      availableTools,
      citationsMode,
    }) {
      // Retourneer berichten die binnen het budget passen
      return {
        messages: buildContext(messages, tokenBudget),
        estimatedTokens: countTokens(messages),
        systemPromptAddition: buildMemorySystemPromptAddition({
          availableTools: availableTools ?? new Set(),
          citationsMode,
          agentId: resolveSessionAgentId({ config: ctx.config, sessionKey }),
          agentSessionKey: sessionKey,
        }),
      };
    },

    async compact({ sessionId, force }) {
      // Vat oudere context samen
      return { ok: true, compacted: true };
    },
  }));
}
```

De factory `ctx` bevat optionele waarden voor `config`, `agentDir` en `workspaceDir`, zodat Plugins status per agent of per werkruimte kunnen initialiseren voordat de eerste levenscyclushook wordt uitgevoerd.

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
| `info`             | Eigenschap | Engine-id, naam, versie en of de engine Compaction beheert        |
| `ingest(params)`   | Methode    | Eén bericht opslaan                                               |
| `assemble(params)` | Methode    | Context voor een modeluitvoering opbouwen (retourneert `AssembleResult`) |
| `compact(params)`  | Methode    | Context samenvatten/reduceren                                     |

`assemble` retourneert een `AssembleResult` met:

<ParamField path="messages" type="Message[]" required>
  De geordende berichten die naar het model worden verzonden.
</ParamField>
<ParamField path="estimatedTokens" type="number" required>
  De schatting van de engine van het totale aantal tokens in de samengestelde context. OpenClaw gebruikt dit voor beslissingen over Compaction-drempels en diagnostische rapportage.
</ParamField>
<ParamField path="systemPromptAddition" type="string">
  Wordt vóór de systeemprompt ingevoegd.
</ParamField>
<ParamField path="promptAuthority" type='"assembled" | "preassembly_may_overflow"'>
  Bepaalt welke tokenschatting de runner gebruikt voor preventieve controles op overschrijding. De standaardwaarde is `"assembled"`, wat betekent dat voor engines die Compaction niet beheren alleen de schatting van de samengestelde prompt wordt gecontroleerd. Engines die `ownsCompaction: true` instellen, beheren zelf de toelating van prompts, zodat OpenClaw de algemene controle vóór de prompt standaard overslaat. Stel `"preassembly_may_overflow"` alleen in wanneer je samengestelde weergave het risico op overschrijding in het onderliggende transcript kan verbergen; de runner houdt dan de algemene controle actief en neemt het maximum van de samengestelde schatting en de schatting van de sessiegeschiedenis vóór samenstelling (zonder venster) bij de beslissing om preventief Compaction uit te voeren. Hoe dan ook blijven de door jou geretourneerde berichten wat het model ziet — `promptAuthority` beïnvloedt alleen de controle vooraf.
</ParamField>
<ParamField path="contextProjection" type="ContextEngineProjection">
  Optionele projectielevenscyclus voor hosts met persistente backendthreads (bijvoorbeeld Codex app-server). `mode: "thread_bootstrap"` met een stabiele `epoch` vraagt de host om de samengestelde context eenmaal per epoch te injecteren en de backendthread opnieuw te gebruiken totdat de epoch verandert, in plaats van deze elke beurt opnieuw te projecteren. Laat dit veld weg voor normale projectie per beurt.
</ParamField>

`compact` retourneert een `CompactResult`. Wanneer Compaction de actieve sessie-identiteit wijzigt, identificeert `result.sessionTarget` (een getypeerde `ContextEngineSessionTarget` die de sessie-identiteit en opslagscope bevat) de opvolgende sessie die bij de volgende nieuwe poging of beurt moet worden gebruikt; `result.sessionId` weerspiegelt de id van de opvolger.

Optionele leden:

| Lid                            | Soort   | Doel                                                                                                                                          |
| ------------------------------ | ------- | --------------------------------------------------------------------------------------------------------------------------------------------- |
| `bootstrap(params)`            | Methode | Enginestatus voor een sessie initialiseren. Wordt eenmaal aangeroepen wanneer de engine een sessie voor het eerst ziet (bijvoorbeeld geschiedenis importeren). |
| `maintain(params)`             | Methode | Transcriptbeheer na het opstarten, een geslaagde beurt of Compaction. Gebruik `runtimeContext.rewriteTranscriptEntries()` voor veilige herschrijvingen. |
| `ingestBatch(params)`          | Methode | Een voltooide beurt als batch opnemen. Wordt aangeroepen nadat een uitvoering is voltooid, met alle berichten van die beurt tegelijk.          |
| `afterTurn(params)`            | Methode | Levenscycluswerk na de uitvoering (status persistent opslaan, Compaction op de achtergrond activeren).                                        |
| `prepareSubagentSpawn(params)` | Methode | Gedeelde status voor een onderliggende sessie instellen voordat deze begint.                                                                   |
| `onSubagentEnded(params)`      | Methode | Opruimen nadat een subagent is beëindigd.                                                                                                      |
| `dispose()`                    | Methode | Resources vrijgeven. Wordt aangeroepen tijdens het afsluiten van de Gateway of het opnieuw laden van de Plugin, niet per sessie.                |

### Runtime-instellingen

Levenscyclushooks die binnen OpenClaw worden uitgevoerd, ontvangen een optioneel `runtimeSettings`-object. Dit is een geversioneerd, alleen-lezen intern API-oppervlak voor producenten en consumenten: OpenClaw produceert het voor de geselecteerde contextengine en de contextengine gebruikt het binnen levenscyclushooks. Het wordt niet rechtstreeks aan gebruikers weergegeven en creëert geen speciaal rapportageoppervlak.

- `schemaVersion`: momenteel `1`
- `runtime`: OpenClaw-host, runtimemodus (`normal`, `fallback` of
  `degraded`) en optionele harness-/runtime-id's
- `contextEngineSelection`: geselecteerde contextengine-id en selectiebron
- `executionHost`: host-id en label voor het oppervlak dat de hook aanroept
- `model`: aangevraagd model, herleid model, provider en optionele modelfamilie
- `limits`: prompttokenbudget en maximaal aantal uitvoertokens indien bekend
- `diagnostics`: gesloten fallback- en degradatieredencodes indien bekend

Velden die onbekend kunnen zijn, worden weergegeven als `null`; discriminatorvelden zoals
runtimemodus en selectiebron blijven niet-nullable. Oudere engines blijven
compatibel: als een strikte verouderde engine `runtimeSettings` als onbekende
eigenschap afwijst, probeert OpenClaw de levenscyclusaanroep opnieuw zonder deze eigenschap, in plaats van
de engine in quarantaine te plaatsen.

### Hostvereisten

Contextengines kunnen vereisten voor hostmogelijkheden declareren in `info.hostRequirements`.
OpenClaw controleert deze vereisten voordat de bewerking wordt gestart en sluit bij een fout
met een beschrijvende foutmelding als de geselecteerde runtime er niet aan kan voldoen.

Declareer voor agentruns `assemble-before-prompt` wanneer de engine de
daadwerkelijke modelprompt moet beheren via `assemble()`:

```ts
info: {
  id: "my-context-engine",
  name: "My Context Engine",
  hostRequirements: {
    "agent-run": {
      requiredCapabilities: ["assemble-before-prompt"],
      unsupportedMessage:
        "Gebruik de ingebouwde runtime van Codex of OpenClaw, of selecteer de verouderde contextengine.",
    },
  },
}
```

Native Codex- en ingebouwde OpenClaw-agentruns voldoen aan `assemble-before-prompt`.
Generieke CLI-backends doen dat niet. Engines die dit vereisen, worden daarom afgewezen voordat het
CLI-proces wordt gestart.

### Foutisolatie

OpenClaw isoleert de geselecteerde plugin-engine van het kernpad voor antwoorden. Als een
niet-verouderde engine ontbreekt, niet door de contractvalidatie komt, een fout genereert tijdens het
maken van de factory of vanuit een levenscyclusmethode, plaatst OpenClaw die engine
voor het huidige Gateway-proces in quarantaine en schakelt het contextenginewerk terug naar de
ingebouwde engine `legacy`. De fout wordt samen met de mislukte bewerking gelogd, zodat de
operator de plugin kan repareren, bijwerken of uitschakelen zonder dat de agent
stilvalt.

Fouten in hostvereisten zijn anders: wanneer een engine declareert dat een runtime
een vereiste mogelijkheid mist, sluit OpenClaw bij een fout voordat de run wordt gestart. Dit
beschermt engines die de status zouden beschadigen als ze op een niet-ondersteunde host werden uitgevoerd.

### ownsCompaction

`ownsCompaction` bepaalt of de ingebouwde automatische Compaction tijdens een poging van de OpenClaw-runtime voor de run ingeschakeld blijft:

<AccordionGroup>
  <Accordion title="ownsCompaction: true">
    De engine beheert het Compaction-gedrag. OpenClaw schakelt voor die run de ingebouwde automatische Compaction van de OpenClaw-runtime en de generieke overflowcontrole vóór de prompt uit. De implementatie van `compact()` door de engine is verantwoordelijk voor `/compact`, Compaction voor herstel na provider-overflow en alle proactieve Compaction die deze in `afterTurn()` wil uitvoeren. OpenClaw voert de overflowbeveiliging vóór de prompt nog steeds uit wanneer de engine `promptAuthority: "preassembly_may_overflow"` retourneert vanuit `assemble()`.
  </Accordion>
  <Accordion title="ownsCompaction: false of niet ingesteld">
    De ingebouwde automatische Compaction van de OpenClaw-runtime kan nog steeds tijdens de promptuitvoering plaatsvinden, maar de methode `compact()` van de actieve engine wordt nog steeds aangeroepen voor `/compact` en herstel na overflow.
  </Accordion>
</AccordionGroup>

<Warning>
`ownsCompaction: false` betekent **niet** dat OpenClaw automatisch terugvalt op het Compaction-pad van de verouderde engine.
</Warning>

Dit betekent dat er twee geldige pluginpatronen zijn:

<Tabs>
  <Tab title="Beheermodus">
    Implementeer je eigen Compaction-algoritme en stel `ownsCompaction: true` in.
  </Tab>
  <Tab title="Delegatiemodus">
    Stel `ownsCompaction: false` in en laat `compact()` vanuit `openclaw/plugin-sdk/core` `delegateCompactionToRuntime(...)` aanroepen om het ingebouwde Compaction-gedrag van OpenClaw te gebruiken.
  </Tab>
</Tabs>

Een `compact()` die niets doet, is onveilig voor een actieve engine die geen eigenaar is, omdat deze het normale Compaction-pad voor `/compact` en herstel na overflow voor dat engineslot uitschakelt.

## Configuratiereferentie

```json5
{
  plugins: {
    slots: {
      // Selecteer de actieve contextengine. Standaard: "legacy".
      // Stel dit in op een plugin-id om een plugin-engine te gebruiken.
      contextEngine: "legacy",
    },
  },
}
```

<Note>
Het slot is tijdens runtime exclusief: voor een bepaalde run of Compaction-bewerking wordt slechts één geregistreerde contextengine herleid. Andere ingeschakelde `kind: "context-engine"`-plugins kunnen nog steeds worden geladen en hun registratiecode uitvoeren; `plugins.slots.contextEngine` selecteert alleen welke geregistreerde engine-id OpenClaw herleidt wanneer een contextengine nodig is.
</Note>

<Note>
**Plugin verwijderen:** wanneer je de plugin verwijdert die momenteel als `plugins.slots.contextEngine` is geselecteerd, zet OpenClaw het slot terug naar de standaardwaarde (`legacy`). Hetzelfde resetgedrag geldt voor `plugins.slots.memory`. De configuratie hoeft niet handmatig te worden aangepast.
</Note>

## Relatie met Compaction en geheugen

<AccordionGroup>
  <Accordion title="Compaction">
    Compaction is een van de verantwoordelijkheden van de contextengine. De verouderde engine delegeert aan de ingebouwde samenvattingsfunctie van OpenClaw. Plugin-engines kunnen elke gewenste Compaction-strategie implementeren (DAG-samenvattingen, vectorzoekacties enzovoort).
  </Accordion>
  <Accordion title="Geheugenplugins">
    Geheugenplugins (`plugins.slots.memory`) staan los van contextengines. Geheugenplugins bieden zoeken en ophalen; contextengines bepalen wat het model ziet. Ze kunnen samenwerken: een contextengine kan tijdens de samenstelling gegevens van een geheugenplugin gebruiken. Plugin-engines die het actieve promptpad voor geheugen willen gebruiken, kunnen het beste `buildMemorySystemPromptAddition(...)` uit `openclaw/plugin-sdk/core` gebruiken. Dit zet de actieve promptsecties voor geheugen om in een direct vooraf te voegen `systemPromptAddition`. Als een engine meer controle op laag niveau nodig heeft, kan deze nog steeds onbewerkte regels uit `openclaw/plugin-sdk/memory-host-core` ophalen via `buildActiveMemoryPromptSection(...)`.
  </Accordion>
  <Accordion title="Sessies opschonen">
    Het in het geheugen inkorten van oude toolresultaten wordt nog steeds uitgevoerd, ongeacht welke contextengine actief is.
  </Accordion>
</AccordionGroup>

## Tips

- Gebruik `openclaw doctor` om te controleren of je engine correct wordt geladen.
- Bij het wisselen van engine behouden bestaande sessies hun huidige geschiedenis. De nieuwe engine neemt toekomstige runs over.
- Enginefouten worden gelogd en de geselecteerde plugin-engine wordt voor het huidige Gateway-proces in quarantaine geplaatst. OpenClaw valt voor gebruikersbeurten terug op `legacy`, zodat antwoorden kunnen doorgaan. Je moet de defecte plugin echter nog steeds repareren, bijwerken, uitschakelen of verwijderen.
- Gebruik voor ontwikkeling `openclaw plugins install -l ./my-engine` om een lokale pluginmap te koppelen zonder deze te kopiëren.

## Gerelateerd

- [Compaction](/nl/concepts/compaction) - lange gesprekken samenvatten
- [Context](/nl/concepts/context) - hoe context voor agentbeurten wordt samengesteld
- [Pluginarchitectuur](/nl/plugins/architecture) - contextengineplugins registreren
- [Pluginmanifest](/nl/plugins/manifest) - velden van het pluginmanifest
- [Plugins](/nl/tools/plugin) - overzicht van plugins
