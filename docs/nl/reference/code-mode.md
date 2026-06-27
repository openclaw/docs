---
read_when:
    - Je wilt de OpenClaw-code-modus inschakelen voor een agent-run
    - Je moet uitleggen waarom de codemodus verschilt van de Codex Code-modus
    - Je beoordeelt het exec/wait-contract, de QuickJS-WASI-sandbox, de TypeScript-transformatie of de verborgen toolcatalogus-bridge
    - Je voegt een interne integratie voor het code-mode-naamruimteregister toe of beoordeelt deze.
sidebarTitle: Code mode
summary: 'OpenClaw-codemodus: een opt-in exec/wait-tooloppervlak ondersteund door QuickJS-WASI en een verborgen run-gebonden toolcatalogus'
title: Codemodus
x-i18n:
    generated_at: "2026-06-27T18:17:42Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 859d56eb09e21c9277961ac5178c1458ce669de114e8cc3f2c8d4b104f428a74
    source_path: reference/code-mode.md
    workflow: 16
---

Code mode is een experimentele OpenClaw agent-runtimefunctie. Deze staat
standaard uit. Wanneer je deze inschakelt, wijzigt OpenClaw wat het model voor
één run ziet: in plaats van elk ingeschakeld toolschema rechtstreeks beschikbaar
te maken, ziet het model alleen `exec` en `wait`.

Deze pagina documenteert OpenClaw-code mode. Het is niet Codex Code mode. De twee
functies delen een naam, maar worden door verschillende runtimes geïmplementeerd
en bieden verschillende `exec`-contracten:

- Codex Code Mode is ingeschakeld voor Codex app-server-threads, tenzij beperkt
  toolbeleid native code mode uitschakelt. Het draait in de Codex coding harness,
  waar het model shellcommando's schrijft via een `exec.command`-contract.
- OpenClaw-code mode is uitgeschakeld tenzij `tools.codeMode.enabled: true` is
  geconfigureerd. Het draait in de generieke agent-runtime van OpenClaw, waar het
  model JavaScript- of TypeScript-programma's schrijft via een `exec.code`-
  contract.

Codex Code Mode en Codex-native dynamisch zoeken naar tools zijn stabiele
Codex-harnessoppervlakken. OpenClaw-code mode is een experimentele, door OpenClaw
beheerde tooloppervlakadapter voor generieke OpenClaw-runs. Het gebruikt
`quickjs-wasi`, een verborgen OpenClaw-toolcatalogus en de normale
OpenClaw-toolexecutor.

## Wat is dit?

Met OpenClaw-code mode kan het model een klein JavaScript- of
TypeScript-programma schrijven in plaats van rechtstreeks uit een lange lijst
tools te kiezen.

Wanneer code mode actief is:

- De voor het model zichtbare toollijst is exact `exec` en `wait`.
- `exec` evalueert door het model gegenereerde JavaScript of TypeScript in een
  beperkte QuickJS-WASI-worker.
- Normale OpenClaw-tools worden verborgen voor de modelprompt en binnen het
  gastprogramma beschikbaar gemaakt via `ALL_TOOLS` en `tools`.
- Gastcode kan de verborgen catalogus doorzoeken, een tool beschrijven en een
  tool aanroepen via hetzelfde OpenClaw-uitvoeringspad dat normale agent-turns
  gebruiken.
- MCP-tools worden gegroepeerd onder de `MCP`-namespace. In code mode is deze
  namespace de enige ondersteunde manier om MCP-tools aan te roepen.
- `wait` hervat een onderbroken code-mode-run wanneer geneste toolaanroepen nog
  in behandeling zijn.

Het belangrijke onderscheid: code mode wijzigt het orchestratieoppervlak richting
het model. Het vervangt geen OpenClaw-tools, Plugin-tools, MCP-tools, auth,
goedkeuringsbeleid, kanaalgedrag of modelselectie.

## Waarom is dit goed?

Code mode maakt grote toolcatalogi gemakkelijker te gebruiken voor modellen.

- Kleiner promptoppervlak: providers ontvangen twee besturingstools in plaats
  van tientallen of honderden volledige toolschema's.
- Betere orchestratie: het model kan loops, joins, kleine transformaties,
  conditionele logica en parallelle geneste toolaanroepen gebruiken binnen één
  codecel.
- Providerneutraal: het werkt voor OpenClaw-, Plugin-, MCP- en clienttools
  zonder afhankelijk te zijn van provider-native code-uitvoering.
- Bestaand beleid blijft van kracht: geneste toolaanroepen lopen nog steeds via
  OpenClaw-beleid, goedkeuringen, hooks, sessiecontext en auditpaden.
- Duidelijke foutmodus: wanneer code mode expliciet is ingeschakeld en de runtime
  niet beschikbaar is, faalt OpenClaw gesloten in plaats van terug te vallen op
  brede directe toolblootstelling.

Code mode is vooral nuttig voor agents met een grote ingeschakelde toolcatalogus
of voor workflows waarin het model herhaaldelijk tools moet zoeken, combineren
en aanroepen voordat het een antwoord produceert.

## Inschakelen

Voeg `tools.codeMode.enabled: true` toe aan de agent- of runtimeconfiguratie:

```json5
{
  tools: {
    codeMode: {
      enabled: true,
    },
  },
}
```

De verkorte vorm wordt ook geaccepteerd:

```json5
{
  tools: {
    codeMode: true,
  },
}
```

Code mode blijft uit wanneer `tools.codeMode` is weggelaten, `false` is, of een
object zonder `enabled: true` is.

Wanneer je gesandboxte agents gebruikt met geconfigureerde MCP-servers, zorg er
dan ook voor dat het sandbox-toolbeleid de gebundelde MCP-Plugin toestaat,
bijvoorbeeld met `tools.sandbox.tools.alsoAllow: ["bundle-mcp"]`. Zie
[Configuratie - tools en aangepaste providers](/nl/gateway/config-tools#mcp-and-plugin-tools-inside-sandbox-tool-policy).

Gebruik expliciete limieten wanneer je strakkere grenzen wilt:

```json5
{
  tools: {
    codeMode: {
      enabled: true,
      timeoutMs: 10000,
      memoryLimitBytes: 67108864,
      maxOutputBytes: 65536,
      maxSnapshotBytes: 10485760,
      maxPendingToolCalls: 16,
      snapshotTtlSeconds: 900,
      searchDefaultLimit: 8,
      maxSearchLimit: 50,
    },
  },
}
```

Om de vorm van de modelpayload tijdens het debuggen te bevestigen, voer je de
Gateway uit met gerichte logging:

```bash
OPENCLAW_DEBUG_CODE_MODE=1 \
OPENCLAW_DEBUG_MODEL_TRANSPORT=1 \
OPENCLAW_DEBUG_MODEL_PAYLOAD=tools \
openclaw gateway
```

Met actieve code mode moeten de gelogde toolnamen richting het model `exec` en
`wait` zijn. Als je de geredigeerde providerpayload nodig hebt, voeg dan
`OPENCLAW_DEBUG_MODEL_PAYLOAD=full-redacted` toe voor een korte debugsessie.

## Technische rondleiding

De rest van deze pagina beschrijft het runtimecontract en de
implementatiedetails. De tekst is bedoeld voor maintainers, Plugin-auteurs die
toolblootstelling debuggen en operators die risicovolle deployments valideren.

## Runtimestatus

- Runtime: [`quickjs-wasi`](https://github.com/vercel-labs/quickjs-wasi).
- Standaardstatus: uitgeschakeld.
- Stabiliteit: experimenteel OpenClaw-oppervlak; Codex Code mode is een apart
  stabiel Codex-harnessoppervlak.
- Doeloppervlak: generieke OpenClaw-agent-runs.
- Beveiligingshouding: modelcode is vijandig.
- Belofte richting gebruiker: het inschakelen van code mode valt nooit stilzwijgend
  terug op brede directe toolblootstelling.

## Bereik

Code mode beheert de orchestratievorm richting het model voor een voorbereide
run. Het beheert geen modelselectie, kanaalgedrag, auth, toolbeleid of
toolimplementaties.

Binnen bereik:

- voor het model zichtbare `exec`- en `wait`-tooldefinities
- opbouw van verborgen toolcatalogus
- uitvoering van JavaScript- en TypeScript-gastcode
- QuickJS-WASI-worker-runtime
- hostcallbacks voor cataloguszoekopdrachten, schemabeschrijving en toolaanroep
- hervatbare status voor onderbroken gastprogramma's
- limieten voor output, timeout, geheugen, in behandeling zijnde aanroepen en snapshots
- telemetrie en trajectieprojectie voor geneste toolaanroepen

Buiten bereik:

- provider-native externe code-uitvoering
- shelluitvoeringssemantiek
- wijzigen van bestaande toolautorisatie
- persistente door gebruikers geschreven scripts
- package manager-, bestands-, netwerk- of moduletoegang in gastcode
- rechtstreeks hergebruik van Codex Code mode-internals

Door providers beheerde tools, zoals externe Python-sandboxes, blijven aparte
tools. Zie [Code-uitvoering](/nl/tools/code-execution).

## Termen

**Code mode** is de OpenClaw-runtimemodus die normale modeltools verbergt en
alleen `exec` en `wait` beschikbaar maakt.

**Gastruntime** is de QuickJS-WASI JavaScript-VM die modelcode evalueert.

**Hostbrug** is het smalle JSON-compatibele callbackoppervlak van gastcode terug
naar OpenClaw.

**Catalogus** is de run-gescopeerde lijst van effectieve tools na normale
resolutie van toolbeleid, Plugin, MCP en clienttools.

**Geneste toolaanroep** is een toolaanroep die vanuit gastcode via de hostbrug
wordt gedaan.

**Snapshot** is geserialiseerde QuickJS-WASI VM-status die wordt opgeslagen zodat
`wait` een onderbroken code-mode-run kan voortzetten.

## Configuratie

`tools.codeMode.enabled` is de activeringspoort. Het instellen van andere
code-mode-velden schakelt de functie niet in.

Ondersteunde velden:

- `enabled`: boolean. Standaard `false`. Schakelt code mode alleen in wanneer
  `true`.
- `runtime`: `"quickjs-wasi"`. Enige ondersteunde runtime.
- `mode`: `"only"`. Maakt `exec` en `wait` beschikbaar en verbergt normale
  modeltools.
- `languages`: array van `"javascript"` en `"typescript"`. Standaard bevat
  beide.
- `timeoutMs`: wandkloklimiet voor één `exec` of `wait`. Standaard `10000`.
  Runtimeklem: `100` tot `60000`.
- `memoryLimitBytes`: QuickJS-heaplimiet. Standaard `67108864`. Runtimeklem:
  `1048576` tot `1073741824`.
- `maxOutputBytes`: limiet voor geretourneerde tekst, JSON en logs. Standaard
  `65536`. Runtimeklem: `1024` tot `10485760`.
- `maxSnapshotBytes`: limiet voor geserialiseerde VM-snapshots. Standaard
  `10485760`. Runtimeklem: `1024` tot `268435456`.
- `maxPendingToolCalls`: limiet voor gelijktijdige geneste toolaanroepen.
  Standaard `16`. Runtimeklem: `1` tot `128`.
- `snapshotTtlSeconds`: hoe lang een onderbroken VM kan worden hervat. Standaard
  `900`. Runtimeklem: `1` tot `86400`.
- `searchDefaultLimit`: standaard aantal zoekresultaten uit de verborgen
  catalogus. Standaard `8`. De runtime klemt dit op `maxSearchLimit`.
- `maxSearchLimit`: maximum aantal zoekresultaten uit de verborgen catalogus.
  Standaard `50`. Runtimeklem: `1` tot `50`.

Als code mode is ingeschakeld maar QuickJS-WASI niet kan laden, faalt OpenClaw
gesloten voor die run. Het stelt normale tools niet stilzwijgend beschikbaar als
fallback.

## Activering

Code mode wordt geëvalueerd nadat het effectieve toolbeleid bekend is en voordat
het definitieve modelverzoek wordt samengesteld.

Activeringsvolgorde:

1. Los de agent, het model, de provider, sandbox, het kanaal, de afzender en het
   runbeleid op.
2. Bouw de effectieve OpenClaw-toollijst.
3. Voeg in aanmerking komende Plugin-, MCP- en clienttools toe.
4. Pas allow- en deny-beleid toe.
5. Als `tools.codeMode.enabled` false is, ga verder met normale toolblootstelling.
6. Als dit is ingeschakeld en tools actief zijn voor de run, registreer dan de
   effectieve tools in de code-mode-catalogus.
7. Verwijder alle normale tools uit de voor het model zichtbare toollijst.
8. Voeg code-mode `exec` en `wait` toe.

Runs die bewust geen tools hebben, zoals ruwe modelaanroepen, `disableTools` of
een lege allowlist, activeren het code-mode-oppervlak niet, zelfs niet als de
configuratie `tools.codeMode.enabled: true` bevat.

De code-mode-catalogus is run-gescopeerd. Deze mag geen tools lekken van een
andere agent, sessie, afzender of run.

## Voor het model zichtbare tools

Wanneer code mode actief is, ziet het model exact deze top-level tools:

- `exec`
- `wait`

Alle andere ingeschakelde tools worden verborgen uit de toollijst richting het
model en geregistreerd in de code-mode-catalogus.

Het model moet `exec` gebruiken voor toolorchestratie, datajoins, loops,
parallelle geneste aanroepen en gestructureerde transformaties. Het model moet
`wait` alleen gebruiken wanneer `exec` een hervatbaar `waiting`-resultaat
teruggeeft.

## `exec`

`exec` start een code-mode-cel en retourneert één resultaat. De invoercode wordt
door het model gegenereerd en moet als vijandig worden behandeld.

Invoer:

```typescript
type CodeModeExecInput = {
  code?: string;
  command?: string;
  language?: "javascript" | "typescript";
};
```

Invoerregels:

- Eén van `code` of `command` moet niet-leeg zijn.
- `code` is het gedocumenteerde veld richting het model.
- `command` wordt geaccepteerd als exec-compatibele alias voor hookbeleid en
  vertrouwde herschrijvingen; wanneer beide aanwezig zijn, moeten de waarden
  overeenkomen.
- Buitenste code-mode `exec`-hookevents bevatten `toolKind: "code_mode_exec"` en
  bevatten `toolInputKind: "javascript" | "typescript"` wanneer de invoertaal
  bekend is, zodat beleidsregels code-mode-cellen kunnen onderscheiden van
  shellstijl-`exec`-aanroepen die dezelfde toolnaam delen.
- `language` is standaard `"javascript"`.
- Als `language` `"typescript"` is, transpileert OpenClaw voor evaluatie.
- `exec` weigert `import`, `require`, dynamic import en module-loaderpatronen in
  v1.
- `exec` maakt de normale shell-`exec`-implementatie niet recursief beschikbaar.

Resultaat:

```typescript
type CodeModeResult = CodeModeCompletedResult | CodeModeWaitingResult | CodeModeFailedResult;

type CodeModeCompletedResult = {
  status: "completed";
  value: unknown;
  output?: CodeModeOutput[];
  telemetry: CodeModeTelemetry;
};

type CodeModeWaitingResult = {
  status: "waiting";
  runId: string;
  reason: "pending_tools" | "yield";
  pendingToolCalls?: CodeModePendingToolCall[];
  output?: CodeModeOutput[];
  telemetry: CodeModeTelemetry;
};

type CodeModeFailedResult = {
  status: "failed";
  error: string;
  code?: CodeModeErrorCode;
  output?: CodeModeOutput[];
  telemetry: CodeModeTelemetry;
};
```

`exec` retourneert `waiting` wanneer de QuickJS-VM onderbreekt met hervatbare
status die nog een voor het model zichtbare voortzetting nodig heeft. Het
resultaat bevat een `runId` voor `wait`. Namespace-bridge-aanroepen, waaronder
MCP-namespace-aanroepen, worden automatisch binnen dezelfde `exec`/`wait`-
aanroep afgehandeld zolang ze gereed zijn, zodat een compact codeblok `$api()`
kan inspecteren en een MCP-tool kan aanroepen zonder één modeltoolaanroep per
namespace-await af te dwingen.

`exec` retourneert alleen `completed` wanneer de gast-VM geen openstaand werk heeft en de
eindwaarde JSON-compatibel is nadat de uitvoeradapter van OpenClaw is uitgevoerd.

## `wait`

`wait` hervat een onderbroken VM in codemodus.

Invoer:

```typescript
type CodeModeWaitInput = {
  runId: string;
};
```

De uitvoer is dezelfde `CodeModeResult`-unie die door `exec` wordt geretourneerd.

`wait` bestaat omdat geneste OpenClaw-tools traag of interactief kunnen zijn,
goedkeuring kunnen vereisen, of gedeeltelijke updates kunnen streamen. Het model
hoeft niet één lange `exec`-aanroep open te houden terwijl de host wacht op
extern werk.

QuickJS-WASI-snapshot en herstel is het v1-hervattingsmechanisme:

1. `exec` evalueert code tot voltooiing, mislukking of onderbreking.
2. Bij onderbreking maakt OpenClaw een snapshot van de QuickJS-VM en registreert
   openstaand hostwerk.
3. Wanneer openstaand werk is afgerond, herstelt `wait` de VM-snapshot.
4. OpenClaw registreert hostcallbacks opnieuw met stabiele namen.
5. OpenClaw levert geneste toolresultaten aan de herstelde VM.
6. OpenClaw voert openstaande QuickJS-taken af.
7. `wait` retourneert `completed`, `failed` of een ander `waiting`-resultaat.

Snapshots zijn runtimestatus, geen gebruikersartefacten. Ze hebben een
groottelimiet, verlopen, en zijn beperkt tot de run en sessie die ze hebben
aangemaakt.

`wait` mislukt wanneer:

- `runId` onbekend is.
- de snapshot is verlopen.
- de bovenliggende run of sessie is afgebroken.
- de aanroeper zich niet binnen hetzelfde run-/sessiebereik bevindt.
- QuickJS-WASI-herstel mislukt.
- herstellen de geconfigureerde limieten zou overschrijden.

## Gast-runtime-API

De gast-runtime stelt een kleine globale API beschikbaar:

```typescript
declare const ALL_TOOLS: ToolCatalogEntry[];
declare const tools: ToolCatalog;
declare const MCP: Record<string, unknown>;
declare const namespaces: Record<string, unknown>;

declare function text(value: unknown): void;
declare function json(value: unknown): void;
declare function yield_control(reason?: string): Promise<void>;
```

`ALL_TOOLS` is compacte metadata voor de catalogus binnen het runbereik. Deze
bevat standaard geen volledige schema's.

```typescript
type ToolCatalogEntry = {
  id: string;
  name: string;
  label?: string;
  description: string;
  source: "openclaw" | "plugin" | "mcp" | "client";
  sourceName?: string;
};
```

Het volledige schema wordt alleen op aanvraag geladen:

```typescript
type ToolCatalogEntryWithSchema = ToolCatalogEntry & {
  parameters: unknown;
};
```

Catalogushelpers:

```typescript
type ToolCatalog = {
  search(query: string, options?: { limit?: number }): Promise<ToolCatalogEntry[]>;
  describe(id: string): Promise<ToolCatalogEntryWithSchema>;
  call(id: string, input?: unknown): Promise<unknown>;
  [safeToolName: string]: unknown;
};
```

Gemaksfuncties voor tools worden alleen geinstalleerd voor ondubbelzinnige veilige namen:

```typescript
const files = await tools.search("read local file");
const fileRead = await tools.describe(files[0].id);
const content = await tools.call(fileRead.id, { path: "README.md" });

// If the hidden catalog has an unambiguous `web_search` entry:
const hits = await tools.web_search({ query: "OpenClaw code mode" });
```

MCP-catalogusvermeldingen zijn in codemodus niet aanroepbaar via `tools.call(...)`
of gemaksfuncties. Ze worden alleen beschikbaar gesteld via de gegenereerde
`MCP`-namespace. Declaratiebestanden in TypeScript-stijl zijn beschikbaar via
het alleen-lezen virtuele bestandsoppervlak `API`, zodat agents MCP-signaturen
kunnen inspecteren zonder MCP-schema's aan de prompt toe te voegen:

```typescript
const files = await API.list("mcp");
const githubApi = await API.read("mcp/github.d.ts");

const issue = await MCP.github.createIssue({
  owner: "openclaw",
  repo: "openclaw",
  title: "Investigate gateway logs",
});

const snapshot = await MCP.chromeDevtools.takeSnapshot({ output: "markdown" });
const resource = await MCP.docs.resources.read({ uri: "memo://one" });
const prompt = await MCP.docs.prompts.get({
  name: "brief",
  arguments: { topic: "release" },
});
```

`API.read("mcp/<server>.d.ts")` retourneert compacte declaraties die zijn afgeleid
uit MCP-toolmetadata:

```typescript
type McpToolResult = {
  content?: unknown[];
  structuredContent?: unknown;
  isError?: boolean;
  [key: string]: unknown;
};

declare namespace MCP.github {
  /** Return this TypeScript-style API header. */
  function $api(toolName?: string, options?: { schema?: boolean }): Promise<McpApiHeader>;

  /**
   * Create a GitHub issue.
   * @param owner Repository owner
   * @param repo Repository name
   * @param title Issue title
   */
  function createIssue(input: {
    owner: string;
    repo: string;
    title: string;
    body?: string;
  }): Promise<McpToolResult>;
}
```

De declaratiebestanden zijn virtueel, geen bestanden die onder de werkruimte of
statusdirectory worden geschreven. Voor elke `exec`-aanroep in codemodus bouwt
OpenClaw de toolcatalogus binnen het runbereik, bewaart het de zichtbare
MCP-vermeldingen, rendert het `mcp/index.d.ts` plus een declaratie
`mcp/<server>.d.ts` per zichtbare server, en injecteert het die kleine
alleen-lezen tabel in de QuickJS-worker. Gastcode ziet alleen het object `API`:
`API.list(prefix?)` retourneert bestandsmetadata en `API.read(path)` retourneert
de geselecteerde declaratie-inhoud. Onbekende paden en segmenten `.` / `..`
worden geweigerd.

Dit houdt grote MCP-schema's uit de modelprompt. De agent leert uit de
beschrijving van de `exec`-tool dat de virtuele API bestaat, leest alleen het
benodigde declaratiebestand, en roept vervolgens `MCP.<server>.<tool>()` aan met
een objectargument. `MCP.<server>.$api()` blijft beschikbaar als inline fallback
wanneer de agent binnen het programma een schemarespons voor een enkele tool
nodig heeft.

De gast-runtime mag hostobjecten niet rechtstreeks beschikbaar stellen. Invoer en
uitvoer passeren de bridge als JSON-compatibele waarden met expliciete
groottelimieten.

## Interne namespaces

Interne namespaces geven codemodus een beknopte domein-API zonder meer
model-zichtbare tools toe te voegen. Een integratie die eigendom is van de loader
kan een namespace registreren zoals `Issues`, `Fictions` of `Calendar`; gastcode
roept die namespace vervolgens aan binnen het QuickJS-programma, terwijl OpenClaw
nog steeds alleen `exec` en `wait` aan het model toont.

Namespaces zijn voorlopig intern. Er is geen openbare Plugin SDK-namespace-API:
externe Plugin-namespaces hebben een contract nodig dat eigendom is van de
loader, zodat pluginidentiteit, geinstalleerde manifests, authstatus en gecachete
catalogusdescriptors niet kunnen afwijken van de Plugin-tools die de namespace
ondersteunen. De kerncodemodus is alleen eigenaar van de sandbox, serialisatie,
catalogusgating en bridgedispatch.

Gastcode kan vervolgens de directe globale waarde of de map `namespaces`
gebruiken:

```javascript
const open = await Issues.list({ state: "open" });
const alsoOpen = await namespaces.Issues.list({ state: "open" });
return { count: open.length, alsoCount: alsoOpen.length };
```

### Registry-levenscyclus

De namespace-registry is proceslokaal en wordt gesleuteld op namespace-id. Een
typische run volgt dit pad:

1. Een vertrouwde loader roept `registerCodeModeNamespaceForPlugin(pluginId, registration)` aan.
2. Codemodus maakt de verborgen `ToolSearchRuntime` voor de run aan en leest de
   catalogus binnen het runbereik.
3. `createCodeModeNamespaceRuntime(ctx, catalog)` bewaart alleen registraties
   waarvan alle `requiredToolNames` zichtbaar zijn en eigendom zijn van dezelfde
   `pluginId`.
4. Elke zichtbare namespace roept `createScope(ctx)` aan voor de huidige run. De
   scope ontvangt runcontext zoals `agentId`, `sessionKey`, `sessionId`,
   `runId`, configuratie en afbreekstatus.
5. Scopedata wordt geserialiseerd naar een gewone descriptor en in QuickJS
   geinjecteerd als directe globale waarden en `namespaces.<globalName>`.
6. Gastaanroepen worden onderbroken via de workerbridge, lossen het
   namespacepad op de host op, mappen de aanroep naar een gedeclareerde
   catalogustool die eigendom is van de Plugin, en voeren die tool uit via
   `ToolSearchRuntime.call`.
7. OpenClaw voert gereedstaande namespace-bridgeaanroepen automatisch af binnen
   de actieve `exec`-/`wait`-toolaanroep. Als namespacewerk nog openstaat bij de
   timeout of de gast expliciet yieldt, hervat `wait` later dezelfde
   namespace-runtime.
8. Plugin-rollback of deinstallatie roept `clearCodeModeNamespacesForPlugin(pluginId)`
   aan, zodat verouderde globale waarden een mislukte Plugin-load niet overleven.

De belangrijke invariant: namespaceaanroepen zijn catalogustoolaanroepen. Ze
gebruiken dezelfde policyhooks, goedkeuringen, afbreekafhandeling, telemetrie,
transcriptprojectie en onderbreek-/hervattingsgedrag als `tools.call(...)`.

### Registratievorm

Registreer namespaces vanuit de integratie die eigenaar is van de achterliggende
tools. Houd de scope klein en stel alleen domeinwerkwoorden beschikbaar die naar
gedeclareerde catalogustools mappen.

```typescript
import {
  createCodeModeNamespaceTool,
  registerCodeModeNamespaceForPlugin,
} from "../agents/code-mode-namespaces.js";

const pluginId = "github";

registerCodeModeNamespaceForPlugin(pluginId, {
  id: "github-issues",
  globalName: "Issues",
  description: "GitHub issue helpers for the current repository.",
  requiredToolNames: ["github_list_issues", "github_update_issue"],
  prompt: "Use Issues.list(params) and Issues.update(number, patch).",
  createScope: (ctx) => ({
    repository: ctx.config,
    list: createCodeModeNamespaceTool("github_list_issues", ([params]) => params ?? {}),
    update: createCodeModeNamespaceTool("github_update_issue", ([number, patch]) => ({
      number,
      patch,
    })),
  }),
});
```

`createCodeModeNamespaceTool(toolName, inputMapper)` markeert een scopelid als
een aanroepbare namespacefunctie. De optionele `inputMapper` ontvangt de
gastargumenten en retourneert het invoerobject voor de achterliggende
catalogustool. Zonder inputmapper wordt het eerste gastargument gebruikt, of `{}`
wanneer het is weggelaten.

Ruwe hostfuncties worden geweigerd voordat gastcode wordt uitgevoerd:

```typescript
createScope: () => ({
  // Wrong: this bypasses the catalog tool lifecycle and will be rejected.
  list: async () => githubClient.listIssues(),
});
```

### Eigendom en zichtbaarheid

Namespace-eigendom is gekoppeld aan de `pluginId` van de registratieaanroeper.
`requiredToolNames` is zowel een zichtbaarheidsfilter als een eigendomscontrole:

- elke vereiste tool moet in de runcatalogus bestaan
- elke vereiste tool moet `sourceName === pluginId` hebben
- de namespace wordt verborgen wanneer een vereiste tool ontbreekt of eigendom is
  van een andere Plugin
- elk aanroepbaar pad mag alleen gericht zijn op een tool die in
  `requiredToolNames` is genoemd

Dit voorkomt dat een andere Plugin een namespace blootlegt door een tool met
dezelfde naam te registreren. Het houdt namespaces ook in lijn met gewone
agentpolicy: als de run de achterliggende tools niet kan zien, kan hij de
namespace niet zien.

Een GitHub-namespace moet bijvoorbeeld achter een extensie leven die eigendom is
van GitHub en eigenaar is van GitHub-auth, REST- of GraphQL-clients, rate limits,
schrijfgoedkeuringen en tests. De kerncodemodus mag geen GitHub-specifieke API's,
tokenafhandeling of providerpolicy insluiten.

### Regels voor scopeserialisatie

`createScope(ctx)` mag een gewoon object retourneren met JSON-compatibele waarden,
arrays, geneste objecten en aanroepmarkeringen van
`createCodeModeNamespaceTool(...)`. Hostobjecten komen nooit rechtstreeks in
QuickJS terecht.

De serializer weigert:

- ruwe functies
- circulaire objectgrafen
- onveilige padsegmenten: `__proto__`, `constructor`, `prototype`, lege sleutels,
  of sleutels die het interne padscheidingsteken bevatten
- `globalName`-waarden die geen JavaScript-identifiers zijn
- `globalName`-botsingen met ingebouwde globale waarden van codemodus zoals
  `tools`, `namespaces`, `text`, `json`, `yield_control` of `__openclaw*`

Waarden die niet naar JSON kunnen worden geserialiseerd, worden geconverteerd
naar JSON-veilige fallbackwaarden voordat ze de bridge passeren. Binaire data,
handles, sockets, clients en klasse-instanties moeten achter gewone
catalogustools blijven.

### Prompts

De namespace-`description` en optionele `prompt` worden alleen aan het
model-zichtbare `exec`-schema toegevoegd wanneer de namespace zichtbaar is voor
die run. Gebruik ze om het kleinste nuttige oppervlak aan te leren:

```typescript
{
  description: "Fiction production service helpers.",
  prompt:
    "Use Fictions.riskAudit(), Fictions.promoteIfReady(id, status), and Fictions.unpaidOver(amount).",
}
```

Houd prompts gericht op het namespacecontract, niet op authconfiguratie,
implementatiegeschiedenis of niet-gerelateerd Plugin-gedrag.

### Opschonen

Naamruimten zijn proceslokale registraties. Verwijder ze wanneer de eigenaar-Plugin
wordt uitgeschakeld, verwijderd of teruggedraaid:

```typescript
clearCodeModeNamespacesForPlugin(pluginId);
```

Opschoning van de codemodus is eigendom van de Plugin; wis de naamruimteregistraties
van de Plugin wanneer de levenscyclus ervan eindigt, in plaats van teardown-handles
per naamruimte te bewaren. Tests kunnen `clearCodeModeNamespacesForTest()` aanroepen
om te voorkomen dat registraties tussen cases lekken.

### Testchecklist

Wijzigingen aan naamruimten moeten de beveiligingsgrens en het gastgedrag afdekken:

- prompttekst van de naamruimte verschijnt alleen wanneer ondersteunende tools zichtbaar zijn
- tools met dezelfde naam van een andere `sourceName` maken de naamruimte niet zichtbaar
- ruwe scopefuncties worden geweigerd
- vervalste naamruimte-id's en vervalste paden worden geweigerd
- aanroepbare paden kunnen niet op niet-gedeclareerde tools mikken
- geneste objecten en gedeelde referenties serialiseren correct
- naamruimte-aanroepen worden uitgevoerd via catalogustools en retourneren JSON-veilige details
- fouten kunnen door gastcode worden afgevangen
- opgeschorte naamruimte-aanroepen worden hervat via `wait`
- terugdraaien van de Plugin wist de naamruimteregistraties van de eigenaar

Naamruimten vullen de generieke catalogus `tools.search` / `tools.call` aan. Gebruik de
catalogus voor willekeurige ingeschakelde OpenClaw-, Plugin- en clienttools; gebruik `MCP` voor
MCP-tools; gebruik andere naamruimten voor door Plugins beheerde, gedocumenteerde domein-API's waarbij
beknopte code betrouwbaarder is dan herhaalde schemazoekacties.

## Uitvoer-API

`text(value)` voegt menselijk leesbare uitvoer toe aan de array `output`.

`json(value)` voegt een gestructureerd uitvoeritem toe na JSON-compatibele
serialisatie.

De uiteindelijke geretourneerde waarde van de gastcode wordt `value` in een resultaat `completed`.

Uitvoeritem:

```typescript
type CodeModeOutput = { type: "text"; text: string } | { type: "json"; value: unknown };
```

Uitvoerregels:

- uitvoervolgorde komt overeen met gastaanroepen
- uitvoer wordt begrensd door `maxOutputBytes`
- niet-serialiseerbare waarden worden omgezet naar platte strings of fouten
- binaire waarden worden niet ondersteund in v1
- afbeeldingen en bestanden lopen via gewone OpenClaw-tools, niet via de
  codemodusbrug

## Toolcatalogus

De verborgen catalogus bevat tools na effectieve beleidsfiltering:

1. OpenClaw-kerntools.
2. Gebundelde Plugin-tools.
3. Externe Plugin-tools.
4. MCP-tools.
5. Door de client geleverde tools voor de huidige run.

Catalogus-id's zijn stabiel binnen één run en waar mogelijk deterministisch over equivalente toolsets.

Aanbevolen id-vorm:

```text
<source>:<owner>:<tool-name>
```

Voorbeelden:

```text
openclaw:core:message
plugin:browser:browser_request
mcp:github:create_issue
client:app:select_file
```

De catalogus laat codemodusbesturingstools weg:

- `exec`
- `wait`
- `tool_search_code`
- `tool_search`
- `tool_describe`
- `tool_call`

Dit voorkomt recursie en houdt het modelgerichte contract smal.

MCP-vermeldingen blijven in de run-gescopeerde catalogus, zodat beleid, goedkeuringen, hooks,
telemetrie, transcriptprojectie en exacte tool-id's gedeeld blijven met normale
tooluitvoering. De gastgerichte weergaven `ALL_TOOLS`, `tools.search(...)`,
`tools.describe(...)` en `tools.call(...)` laten MCP-vermeldingen weg. De
gegenereerde naamruimte `MCP.<server>.<tool>({ ...input })` resolveert terug naar het
exacte catalogus-id en verzendt daarna via hetzelfde executorpad.

## Interactie met Tool Search

Codemodus vervangt het OpenClaw-modeloppervlak Tool Search voor runs waarin het
actief is.

Wanneer `tools.codeMode.enabled` waar is en codemodus activeert:

- OpenClaw stelt `tool_search_code`, `tool_search`, `tool_describe`,
  of `tool_call` niet bloot als modelzichtbare tools.
- Hetzelfde catalogusidee verplaatst zich naar binnen de gustruntime.
- De gustruntime ontvangt compacte `ALL_TOOLS`-metadata en helpers voor zoeken, beschrijven
  en aanroepen voor niet-MCP-tools.
- MCP-aanroepen gebruiken de gegenereerde naamruimte `MCP` en de `$api()`-headers ervan in plaats
  van `tools.call(...)`.
- Geneste aanroepen worden verzonden via hetzelfde OpenClaw-executorpad dat Tool Search
  gebruikt.

De bestaande pagina [Tool Search](/nl/tools/tool-search) beschrijft de compacte
catalogusbrug van OpenClaw. Codemodus is het generieke OpenClaw-alternatief voor runs die
`exec` en `wait` kunnen gebruiken.

## Toolnamen en botsingen

De modelzichtbare tool `exec` is de codemodustool. Als de normale OpenClaw
shelltool `exec` is ingeschakeld, wordt deze verborgen voor het model en gecatalogiseerd zoals elke
andere tool.

Binnen de gustruntime:

- `tools.call("openclaw:core:exec", input)` kan de shelltool exec aanroepen als
  beleid dit toestaat.
- `tools.exec(...)` wordt alleen geïnstalleerd als de shell exec-catalogusvermelding een
  ondubbelzinnige veilige naam heeft.
- de codemodustool `exec` is nooit recursief beschikbaar via `tools`.

Als twee tools normaliseren naar dezelfde veilige gemaksnaam, laat OpenClaw de
gemaksfunctie weg en vereist het `tools.call(id, input)`.

## Geneste tooluitvoering

Elke geneste toolaanroep kruist de hostbrug en komt opnieuw OpenClaw binnen.

Geneste uitvoering behoudt:

- actieve agent-id
- sessie-id en sessiesleutel
- afzender- en kanaalcontext
- sandboxbeleid
- goedkeuringsbeleid
- Plugin-hooks `before_tool_call`
- afbreeksignaal
- streamingupdates waar beschikbaar
- traject- en auditgebeurtenissen

Geneste aanroepen worden als echte toolaanroepen in het transcript geprojecteerd, zodat ondersteuningsbundels
kunnen tonen wat er is gebeurd. De projectie identificeert de bovenliggende codemodus-toolaanroep
en het geneste tool-id.

Parallelle geneste aanroepen zijn toegestaan tot `maxPendingToolCalls`.

## Runtimestatus

Elke codemodus-run heeft een statusmachine:

- `running`: VM wordt uitgevoerd of geneste aanroepen zijn onderweg.
- `waiting`: VM-snapshot bestaat en kan worden hervat met `wait`.
- `completed`: uiteindelijke waarde geretourneerd; snapshot verwijderd.
- `failed`: fout geretourneerd; snapshot verwijderd.
- `expired`: snapshot of wachtende status overschreed retentie; kan niet hervatten.
- `aborted`: bovenliggende run/sessie geannuleerd; snapshot verwijderd.

Status is gescopeerd per agent-run, sessie en toolaanroep-id. Een `wait`-aanroep vanuit een
andere run of sessie mislukt.

Snapshotopslag is begrensd:

- maximaal aantal snapshotbytes per run
- maximaal aantal live snapshots per proces
- snapshot-TTL
- opschoning aan het einde van de run
- opschoning bij Gateway-afsluiting waar persistentie niet wordt ondersteund

## QuickJS-WASI-runtime

OpenClaw laadt `quickjs-wasi` als directe afhankelijkheid in het eigendomspakket. De
runtime vertrouwt niet op een transitieve kopie die is geïnstalleerd voor proxy, PAC of andere
ongerelateerde afhankelijkheden.

Runtimeverantwoordelijkheden:

- de QuickJS-WASI WebAssembly-module compileren of laden
- één geïsoleerde VM per codemodus-run of hervatting maken
- hostcallbacks registreren met stabiele namen
- geheugen- en interruptlimieten instellen
- JavaScript evalueren
- wachtende jobs leegmaken
- opgeschorte VM-status snapshotten
- snapshots herstellen voor `wait`
- VM-handles en snapshots na terminale statussen vrijgeven

De runtime wordt buiten de hoofd-eventloop van OpenClaw uitgevoerd in een worker. Een oneindige
lus in de gast mag het Gateway-proces niet onbeperkt blokkeren.

## TypeScript

TypeScript-ondersteuning is alleen een brontransformatie:

- geaccepteerde invoer: één TypeScript-codestring
- uitvoer: JavaScript-string geëvalueerd door QuickJS-WASI
- geen typecontrole
- geen moduleresolutie
- geen `import` of `require` in v1
- diagnostiek wordt geretourneerd als `failed`-resultaten

De TypeScript-compiler wordt alleen lazy geladen voor TypeScript-cellen. Gewone
JavaScript-cellen en uitgeschakelde codemodus laden de compiler niet.

De transformatie moet waar haalbaar bruikbare regelnummers behouden.

## Beveiligingsgrens

Modelcode is vijandig. De runtime gebruikt verdediging in diepte:

- voer QuickJS-WASI buiten de hoofd-eventloop uit
- laad `quickjs-wasi` als directe afhankelijkheid, niet via Codex of een transitief
  pakket
- geen bestandssysteem, netwerk, subprocessen, module-import, omgevingsvariabelen of
  globale hostobjecten in de gast
- gebruik QuickJS-geheugen- en interruptlimieten
- handhaaf een wandkloktime-out van het bovenliggende proces
- handhaaf limieten voor uitvoer, snapshots, logs en wachtende aanroepen
- serialiseer hostbrugwaarden via een smalle JSON-adapter
- zet hostfouten om naar platte gastfouten, nooit naar hostrealm-objecten
- verwijder snapshots bij time-out, afbreken, sessie-einde of verlopen
- weiger recursieve toegang tot `exec`, `wait` en Tool Search-besturingstools
- voorkom dat botsingen tussen gemaksnamen catalogushelpers overschaduwen

De sandbox is één beveiligingslaag. Operators kunnen nog steeds hardening op OS-niveau nodig hebben
voor implementaties met hoog risico.

## Foutcodes

```typescript
type CodeModeErrorCode =
  | "runtime_unavailable"
  | "invalid_config"
  | "invalid_input"
  | "unsupported_language"
  | "typescript_transform_failed"
  | "module_access_denied"
  | "timeout"
  | "memory_limit_exceeded"
  | "output_limit_exceeded"
  | "snapshot_limit_exceeded"
  | "snapshot_expired"
  | "snapshot_restore_failed"
  | "too_many_pending_tool_calls"
  | "nested_tool_failed"
  | "aborted"
  | "internal_error";
```

Fouten die aan de gast worden geretourneerd zijn platte data. Host-`Error`-instanties, stack-
objecten, prototypes en hostfuncties kruisen niet naar QuickJS.

## Telemetrie

Codemodus rapporteert:

- zichtbare toolnamen die naar het model zijn gestuurd
- verborgen catalogusgrootte en bronverdeling
- aantallen `exec` en `wait`
- aantallen geneste zoek-, beschrijf- en aanroepacties
- aangeroepen geneste tool-id's
- fouten door time-out-, geheugen-, snapshot- en uitvoerlimieten
- lifecyclegebeurtenissen van snapshots

Telemetrie mag geen geheimen, ruwe omgevingswaarden of niet-geredigeerde tool-
invoer bevatten buiten het bestaande OpenClaw-trajectbeleid.

## Debugging

Gebruik gerichte logging van modeltransport wanneer codemodus zich anders gedraagt dan een
normale toolrun:

```bash
OPENCLAW_DEBUG_CODE_MODE=1 \
OPENCLAW_DEBUG_MODEL_TRANSPORT=1 \
OPENCLAW_DEBUG_MODEL_PAYLOAD=tools \
OPENCLAW_DEBUG_SSE=events \
openclaw gateway
```

Gebruik voor debugging van payloadvormen `OPENCLAW_DEBUG_MODEL_PAYLOAD=full-redacted`.
Dit logt een begrensde, geredigeerde JSON-snapshot van de modelaanvraag; het moet alleen
tijdens debugging worden gebruikt, omdat prompts en berichttekst nog steeds kunnen verschijnen.

Gebruik voor streamdebugging `OPENCLAW_DEBUG_SSE=peek` om de eerste vijf
geredigeerde SSE-gebeurtenissen te loggen. Codemodus faalt ook gesloten als de uiteindelijke providerpayload
niet exact `exec` en `wait` bevat nadat het codemodusoppervlak is
geactiveerd.

## Implementatie-indeling

Implementatie-eenheden:

- configuratiecontract: `tools.codeMode`
- catalogusbouwer: effectieve tools naar compacte vermeldingen en id-map
- modeloppervlakadapter: vervang zichtbare tools door `exec` en `wait`
- QuickJS-WASI-runtimeadapter: laden, evalueren, snapshotten, herstellen, vrijgeven
- workersupervisor: time-out, afbreken, crashisolatie
- brugadapter: JSON-veilige hostcallbacks en resultaatlevering
- TypeScript-transformatieadapter
- snapshotopslag: TTL, groottebegrenzingen, run-/sessiescoping
- trajectprojectie voor geneste toolaanroepen
- telemetrietellers en diagnostiek

De implementatie hergebruikt catalogus- en executorconcepten uit Tool Search, maar
gebruikt de `node:vm`-child niet als sandbox.

## Validatiechecklist

Dekking van codemodus moet aantonen:

- uitgeschakelde configuratie laat bestaande toolblootstelling ongewijzigd
- objectconfiguratie zonder `enabled: true` laat codemodus uitgeschakeld
- ingeschakelde configuratie stelt alleen `exec` en `wait` beschikbaar aan het model wanneer tools
  actief zijn voor de run
- ruwe runs zonder tools, `disableTools` en lege toelatingslijsten activeren geen payloadhandhaving
  voor codemodus
- alle effectieve niet-MCP-tools verschijnen in `ALL_TOOLS`
- geweigerde tools verschijnen niet in `ALL_TOOLS`
- `tools.search`, `tools.describe` en `tools.call` werken voor OpenClaw-tools
- `API.list("mcp")` en `API.read("mcp/<server>.d.ts")` stellen TypeScript-achtige
  MCP-declaraties beschikbaar zonder bridge-/toolaanroep
- MCP-namespace `$api()` blijft beschikbaar als inline fallback voor schema's
- MCP-namespace-aanroepen werken voor zichtbare MCP-tools met één objectinvoer, terwijl
  directe MCP-catalogusitems ontbreken in `tools.*`
- Tool Search-besturingstools zijn verborgen voor zowel het modeloppervlak als de verborgen
  catalogus
- geneste aanroepen behouden goedkeurings- en hookgedrag
- shell `exec` is verborgen voor het model, maar aanroepbaar via catalogus-id wanneer toegestaan
- recursieve codemodus-`exec` en `wait` zijn niet aanroepbaar vanuit gastcode
- TypeScript-invoer wordt getransformeerd en geëvalueerd zonder TypeScript te laden op
  uitgeschakelde of JavaScript-only-paden
- toegang tot `import`, `require`, bestandssysteem, netwerk en omgeving mislukt
- oneindige lussen verlopen door timeout en kunnen de Gateway niet blokkeren
- fouten door geheugenlimiet beëindigen de gast-VM
- uitvoer- en snapshotlimieten worden afgedwongen voor voltooide en onderbroken aanroepen
- `wait` hervat een onderbroken snapshot en retourneert de eindwaarde
- verlopen, afgebroken, verkeerde-sessie- en onbekende `runId`-waarden mislukken
- transcriptreplay en persistentie behouden besturingsaanroepen voor codemodus
- transcript en telemetrie tonen geneste toolaanroepen duidelijk

## E2E-testplan

Voer deze uit als integratie- of end-to-endtests wanneer de runtime wordt gewijzigd:

1. Start een Gateway met `tools.codeMode.enabled: false`.
2. Verstuur een agentbeurt met een kleine directe toolset.
3. Controleer dat de voor het model zichtbare tools ongewijzigd zijn.
4. Herstart met `tools.codeMode.enabled: true`.
5. Verstuur een agentbeurt met OpenClaw-, plugin-, MCP- en clienttesttools.
6. Controleer dat de voor het model zichtbare toollijst exact `exec`, `wait` is.
7. Lees in `exec` `ALL_TOOLS` en controleer dat de effectieve testtools aanwezig zijn.
8. Roep in `exec` OpenClaw-/plugin-/clienttools aan via `tools.search`,
   `tools.describe` en `tools.call`.
9. Roep in `exec` `API.list("mcp")` en `API.read("mcp/<server>.d.ts")` aan en
   controleer dat de declaratiebestanden zichtbare MCP-tools beschrijven.
10. Roep in `exec` MCP-tools aan via `MCP.<server>.<tool>({ ...input })` en
    controleer dat directe MCP-catalogusitems ontbreken in `ALL_TOOLS` en `tools.*`.
11. Controleer dat geweigerde tools ontbreken en niet kunnen worden aangeroepen via een geraden id.
12. Start een geneste toolaanroep die wordt voltooid nadat `exec` `waiting` retourneert.
13. Roep `wait` aan en controleer dat de herstelde VM het toolresultaat ontvangt.
14. Controleer dat het uiteindelijke antwoord uitvoer bevat die na het herstel is geproduceerd.
15. Controleer dat timeout, afbreken en snapshotverval runtime-status opschonen.
16. Exporteer het traject en controleer dat geneste aanroepen zichtbaar zijn onder de bovenliggende
    codemodusaanroep.

Wijzigingen alleen in de documentatie op deze pagina moeten nog steeds `pnpm check:docs` uitvoeren.

## Gerelateerd

- [Tool Search](/nl/tools/tool-search)
- [Agentruntimes](/nl/concepts/agent-runtimes)
- [Exec-tool](/nl/tools/exec)
- [Code-uitvoering](/nl/tools/code-execution)
