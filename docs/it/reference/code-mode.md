---
read_when:
    - Vuoi abilitare la modalità codice di OpenClaw per un’esecuzione dell’agente
    - Devi spiegare perché la modalità codice è diversa dalla modalità Codex Code
    - Stai esaminando il contratto exec/wait, la sandbox QuickJS-WASI, la trasformazione TypeScript o il bridge nascosto del catalogo degli strumenti
    - Stai aggiungendo o revisionando un'integrazione interna del registro degli spazi dei nomi in modalità codice
sidebarTitle: Code mode
summary: 'Modalità codice di OpenClaw: una superficie di strumenti exec/wait opzionale basata su QuickJS-WASI e un catalogo di strumenti nascosto con ambito di esecuzione'
title: Modalità codice
x-i18n:
    generated_at: "2026-06-27T18:12:16Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 859d56eb09e21c9277961ac5178c1458ce669de114e8cc3f2c8d4b104f428a74
    source_path: reference/code-mode.md
    workflow: 16
---

La modalità codice è una funzionalità sperimentale del runtime degli agenti di OpenClaw. È disattivata per impostazione
predefinita. Quando la abiliti, OpenClaw cambia ciò che il modello vede per una singola esecuzione:
invece di esporre direttamente ogni schema di strumento abilitato, il modello vede solo
`exec` e `wait`.

Questa pagina documenta la modalità codice di OpenClaw. Non è la modalità Codex Code. Le due
funzionalità condividono un nome, ma sono implementate da runtime diversi ed espongono
contratti `exec` diversi:

- Codex Code Mode è abilitata per i thread del server app Codex, a meno che una policy
  degli strumenti restrittiva disabiliti la modalità codice nativa. Viene eseguita nell'harness di codifica Codex,
  dove il modello scrive comandi shell tramite un contratto `exec.command`.
- La modalità codice di OpenClaw è disabilitata a meno che non sia configurato
  `tools.codeMode.enabled: true`. Viene eseguita nel runtime generico degli agenti di OpenClaw, dove il modello
  scrive programmi JavaScript o TypeScript tramite un contratto `exec.code`.

Codex Code Mode e la ricerca dinamica di strumenti nativa di Codex sono superfici stabili
dell'harness Codex. La modalità codice di OpenClaw è un adattatore sperimentale della superficie
degli strumenti, di proprietà di OpenClaw, per esecuzioni generiche di OpenClaw. Usa `quickjs-wasi`, un catalogo
nascosto degli strumenti OpenClaw e il normale esecutore di strumenti OpenClaw.

## Che cos'è?

La modalità codice di OpenClaw consente al modello di scrivere un piccolo programma JavaScript o TypeScript
invece di scegliere direttamente da un lungo elenco di strumenti.

Quando la modalità codice è attiva:

- L'elenco di strumenti visibile al modello è esattamente `exec` e `wait`.
- `exec` valuta JavaScript o TypeScript generato dal modello in un worker
  QuickJS-WASI vincolato.
- I normali strumenti OpenClaw sono nascosti dal prompt del modello ed esposti all'interno del
  programma guest tramite `ALL_TOOLS` e `tools`.
- Il codice guest può cercare nel catalogo nascosto, descrivere uno strumento e chiamare uno strumento
  tramite lo stesso percorso di esecuzione OpenClaw usato dai normali turni dell'agente.
- Gli strumenti MCP sono raggruppati nello spazio dei nomi `MCP`. In modalità codice, questo spazio dei nomi
  è l'unico modo supportato per chiamare gli strumenti MCP.
- `wait` riprende un'esecuzione in modalità codice sospesa quando le chiamate a strumenti annidate sono ancora
  in sospeso.

La distinzione importante: la modalità codice cambia la superficie di orchestrazione rivolta al modello.
Non sostituisce gli strumenti OpenClaw, gli strumenti dei Plugin, gli strumenti MCP, l'autenticazione,
la policy di approvazione, il comportamento dei canali o la selezione del modello.

## Perché è utile?

La modalità codice rende i grandi cataloghi di strumenti più facili da usare per i modelli.

- Superficie di prompt più piccola: i provider ricevono due strumenti di controllo invece di decine
  o centinaia di schemi completi di strumenti.
- Orchestrazione migliore: il modello può usare cicli, join, piccole trasformazioni,
  logica condizionale e chiamate a strumenti annidate parallele all'interno di una singola cella di codice.
- Neutrale rispetto al provider: funziona per strumenti OpenClaw, Plugin, MCP e client senza
  dipendere dall'esecuzione di codice nativa del provider.
- Le policy esistenti restano in vigore: le chiamate a strumenti annidate passano comunque attraverso le
  policy, le approvazioni, gli hook, il contesto di sessione e i percorsi di audit di OpenClaw.
- Modalità di errore chiara: quando la modalità codice è abilitata esplicitamente e il runtime non è
  disponibile, OpenClaw fallisce in modo chiuso invece di ripiegare su un'ampia esposizione diretta degli strumenti.

La modalità codice è particolarmente utile per agenti con un ampio catalogo di strumenti abilitati o
per workflow in cui il modello deve ripetutamente cercare, combinare e chiamare
strumenti prima di produrre una risposta.

## Come abilitarla

Aggiungi `tools.codeMode.enabled: true` alla configurazione dell'agente o del runtime:

```json5
{
  tools: {
    codeMode: {
      enabled: true,
    },
  },
}
```

È accettata anche la forma abbreviata:

```json5
{
  tools: {
    codeMode: true,
  },
}
```

La modalità codice resta disattivata quando `tools.codeMode` è omesso, `false` o un oggetto
senza `enabled: true`.

Quando usi agenti in sandbox con server MCP configurati, assicurati anche che la
policy degli strumenti della sandbox consenta il Plugin MCP in bundle, per esempio con
`tools.sandbox.tools.alsoAllow: ["bundle-mcp"]`. Vedi
[Configurazione - strumenti e provider personalizzati](/it/gateway/config-tools#mcp-and-plugin-tools-inside-sandbox-tool-policy).

Usa limiti espliciti quando vuoi vincoli più stretti:

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

Per confermare la forma del payload del modello durante il debug, esegui il Gateway con
logging mirato:

```bash
OPENCLAW_DEBUG_CODE_MODE=1 \
OPENCLAW_DEBUG_MODEL_TRANSPORT=1 \
OPENCLAW_DEBUG_MODEL_PAYLOAD=tools \
openclaw gateway
```

Con la modalità codice attiva, i nomi degli strumenti rivolti al modello registrati nei log dovrebbero essere `exec` e
`wait`. Se ti serve il payload del provider redatto, aggiungi
`OPENCLAW_DEBUG_MODEL_PAYLOAD=full-redacted` per una breve sessione di debug.

## Tour tecnico

Il resto di questa pagina descrive il contratto del runtime e i dettagli di implementazione.
È destinato ai manutentori, agli autori di Plugin che eseguono il debug dell'esposizione degli strumenti e
agli operatori che convalidano distribuzioni ad alto rischio.

## Stato del runtime

- Runtime: [`quickjs-wasi`](https://github.com/vercel-labs/quickjs-wasi).
- Stato predefinito: disabilitato.
- Stabilità: superficie sperimentale di OpenClaw; Codex Code mode è una superficie stabile separata
  dell'harness Codex.
- Superficie di destinazione: esecuzioni generiche di agenti OpenClaw.
- Postura di sicurezza: il codice del modello è ostile.
- Promessa rivolta all'utente: abilitare la modalità codice non ripiega mai silenziosamente su un'ampia
  esposizione diretta degli strumenti.

## Ambito

La modalità codice possiede la forma di orchestrazione rivolta al modello per un'esecuzione preparata. Non
possiede la selezione del modello, il comportamento dei canali, l'autenticazione, la policy degli strumenti o le
implementazioni degli strumenti.

Incluso nell'ambito:

- definizioni degli strumenti `exec` e `wait` visibili al modello
- costruzione del catalogo nascosto degli strumenti
- esecuzione guest JavaScript e TypeScript
- runtime worker QuickJS-WASI
- callback host per ricerca nel catalogo, descrizione degli schemi e chiamata di strumenti
- stato riprendibile per programmi guest sospesi
- limiti di output, timeout, memoria, chiamate in sospeso e snapshot
- telemetria e proiezione della traiettoria per chiamate a strumenti annidate

Fuori ambito:

- esecuzione remota di codice nativa del provider
- semantica di esecuzione shell
- modifica dell'autorizzazione esistente degli strumenti
- script persistenti creati dall'utente
- accesso a package manager, file, rete o moduli nel codice guest
- riuso diretto degli internals di Codex Code mode

Gli strumenti di proprietà del provider, come le sandbox Python remote, restano strumenti separati. Vedi
[Esecuzione di codice](/it/tools/code-execution).

## Termini

**Modalità codice** è la modalità del runtime OpenClaw che nasconde i normali strumenti del modello ed
espone solo `exec` e `wait`.

**Runtime guest** è la VM JavaScript QuickJS-WASI che valuta il codice del modello.

**Bridge host** è la superficie ristretta di callback compatibile con JSON dal codice guest
verso OpenClaw.

**Catalogo** è l'elenco con ambito di esecuzione degli strumenti effettivi dopo la normale policy degli strumenti,
la risoluzione di Plugin, MCP e strumenti client.

**Chiamata a strumento annidata** è una chiamata a strumento effettuata dal codice guest tramite il bridge host.

**Snapshot** è lo stato serializzato della VM QuickJS-WASI salvato affinché `wait` possa continuare un'
esecuzione in modalità codice sospesa.

## Configurazione

`tools.codeMode.enabled` è il gate di attivazione. Impostare altri campi della modalità codice
non abilita la funzionalità.

Campi supportati:

- `enabled`: boolean. Predefinito `false`. Abilita la modalità codice solo quando è `true`.
- `runtime`: `"quickjs-wasi"`. Unico runtime supportato.
- `mode`: `"only"`. Espone `exec` e `wait`, nasconde i normali strumenti del modello.
- `languages`: array di `"javascript"` e `"typescript"`. Il valore predefinito include
  entrambi.
- `timeoutMs`: limite in tempo reale per un singolo `exec` o `wait`. Predefinito `10000`.
  Clamp del runtime: da `100` a `60000`.
- `memoryLimitBytes`: limite heap QuickJS. Predefinito `67108864`. Clamp del runtime:
  da `1048576` a `1073741824`.
- `maxOutputBytes`: limite per testo, JSON e log restituiti. Predefinito `65536`.
  Clamp del runtime: da `1024` a `10485760`.
- `maxSnapshotBytes`: limite per gli snapshot serializzati della VM. Predefinito `10485760`.
  Clamp del runtime: da `1024` a `268435456`.
- `maxPendingToolCalls`: limite per le chiamate a strumenti annidate concorrenti. Predefinito `16`.
  Clamp del runtime: da `1` a `128`.
- `snapshotTtlSeconds`: per quanto tempo una VM sospesa può essere ripresa. Predefinito `900`.
  Clamp del runtime: da `1` a `86400`.
- `searchDefaultLimit`: numero predefinito di risultati della ricerca nel catalogo nascosto. Predefinito `8`.
  Il runtime lo limita a `maxSearchLimit`.
- `maxSearchLimit`: numero massimo di risultati della ricerca nel catalogo nascosto. Predefinito `50`.
  Clamp del runtime: da `1` a `50`.

Se la modalità codice è abilitata ma QuickJS-WASI non può essere caricato, OpenClaw fallisce in modo chiuso per
quell'esecuzione. Non espone silenziosamente i normali strumenti come fallback.

## Attivazione

La modalità codice viene valutata dopo che la policy effettiva degli strumenti è nota e prima che la
richiesta finale al modello venga assemblata.

Ordine di attivazione:

1. Risolvi agente, modello, provider, sandbox, canale, mittente e policy di esecuzione.
2. Costruisci l'elenco effettivo degli strumenti OpenClaw.
3. Aggiungi gli strumenti Plugin, MCP e client idonei.
4. Applica la policy di allow e deny.
5. Se `tools.codeMode.enabled` è false, continua con la normale esposizione degli strumenti.
6. Se è abilitata e gli strumenti sono attivi per l'esecuzione, registra gli strumenti effettivi nel
   catalogo della modalità codice.
7. Rimuovi tutti i normali strumenti dall'elenco di strumenti visibile al modello.
8. Aggiungi `exec` e `wait` della modalità codice.

Le esecuzioni che intenzionalmente non hanno strumenti, come chiamate raw al modello, `disableTools`
o una allowlist vuota, non attivano la superficie della modalità codice anche se la configurazione
contiene `tools.codeMode.enabled: true`.

Il catalogo della modalità codice ha ambito di esecuzione. Non deve far trapelare strumenti da un altro agente,
sessione, mittente o esecuzione.

## Strumenti visibili al modello

Quando la modalità codice è attiva, il modello vede esattamente questi strumenti di primo livello:

- `exec`
- `wait`

Tutti gli altri strumenti abilitati sono nascosti dall'elenco di strumenti rivolto al modello e registrati
nel catalogo della modalità codice.

Il modello dovrebbe usare `exec` per orchestrazione degli strumenti, join di dati, cicli,
chiamate annidate parallele e trasformazioni strutturate. Il modello dovrebbe usare
`wait` solo quando `exec` restituisce un risultato `waiting` riprendibile.

## `exec`

`exec` avvia una cella in modalità codice e restituisce un risultato. Il codice di input è generato dal modello
e deve essere trattato come ostile.

Input:

```typescript
type CodeModeExecInput = {
  code?: string;
  command?: string;
  language?: "javascript" | "typescript";
};
```

Regole di input:

- Uno tra `code` o `command` deve essere non vuoto.
- `code` è il campo documentato rivolto al modello.
- `command` è accettato come alias compatibile con exec per policy degli hook e
  riscritture fidate; quando entrambi sono presenti, i valori devono corrispondere.
- Gli eventi hook `exec` esterni della modalità codice includono `toolKind: "code_mode_exec"` e
  includono `toolInputKind: "javascript" | "typescript"` quando il linguaggio di input
  è noto, così le policy possono distinguere le celle in modalità codice dalle chiamate `exec`
  in stile shell che condividono lo stesso nome dello strumento.
- `language` usa `"javascript"` come impostazione predefinita.
- Se `language` è `"typescript"`, OpenClaw transpila prima della valutazione.
- `exec` rifiuta `import`, `require`, import dinamico e pattern di module-loader
  in v1.
- `exec` non espone ricorsivamente la normale implementazione shell di `exec`.

Risultato:

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

`exec` restituisce `waiting` quando la VM QuickJS si sospende con stato riprendibile che
richiede ancora una continuazione visibile al modello. Il risultato include un `runId` per
`wait`. Le chiamate al bridge degli spazi dei nomi, incluse le chiamate allo spazio dei nomi MCP, vengono svuotate automaticamente
all'interno della stessa chiamata `exec`/`wait` mentre sono pronte, così un blocco di codice compatto
può ispezionare `$api()` e chiamare uno strumento MCP senza forzare una chiamata a strumento del modello per
ogni await dello spazio dei nomi.

`exec` restituisce `completed` solo quando la VM guest non ha lavoro in sospeso e il
valore finale è compatibile con JSON dopo l'esecuzione dell'adattatore di output di OpenClaw.

## `wait`

`wait` continua una VM in modalità codice sospesa.

Input:

```typescript
type CodeModeWaitInput = {
  runId: string;
};
```

L'output è la stessa union `CodeModeResult` restituita da `exec`.

`wait` esiste perché gli strumenti OpenClaw annidati possono essere lenti, interattivi, soggetti ad approvazione
o trasmettere aggiornamenti parziali. Il modello non dovrebbe dover mantenere aperta una lunga chiamata
`exec` mentre l'host attende lavoro esterno.

Snapshot e ripristino di QuickJS-WASI sono il meccanismo di ripresa v1:

1. `exec` valuta il codice fino al completamento, al fallimento o alla sospensione.
2. In caso di sospensione, OpenClaw crea uno snapshot della VM QuickJS e registra il lavoro
   host in sospeso.
3. Quando il lavoro in sospeso si risolve, `wait` ripristina lo snapshot della VM.
4. OpenClaw registra nuovamente i callback host tramite nomi stabili.
5. OpenClaw consegna i risultati degli strumenti annidati nella VM ripristinata.
6. OpenClaw svuota i job QuickJS in sospeso.
7. `wait` restituisce `completed`, `failed` o un altro risultato `waiting`.

Gli snapshot sono stato runtime, non artefatti utente. Hanno limiti di dimensione, scadono
e sono limitati all'esecuzione e alla sessione che li hanno creati.

`wait` fallisce quando:

- `runId` è sconosciuto.
- lo snapshot è scaduto.
- l'esecuzione o la sessione padre è stata interrotta.
- il chiamante non si trova nello stesso ambito di esecuzione/sessione.
- il ripristino QuickJS-WASI fallisce.
- il ripristino supererebbe i limiti configurati.

## API runtime guest

Il runtime guest espone una piccola API globale:

```typescript
declare const ALL_TOOLS: ToolCatalogEntry[];
declare const tools: ToolCatalog;
declare const MCP: Record<string, unknown>;
declare const namespaces: Record<string, unknown>;

declare function text(value: unknown): void;
declare function json(value: unknown): void;
declare function yield_control(reason?: string): Promise<void>;
```

`ALL_TOOLS` è metadati compatti per il catalogo con ambito dell'esecuzione. Per impostazione predefinita
non contiene schemi completi.

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

Lo schema completo viene caricato solo su richiesta:

```typescript
type ToolCatalogEntryWithSchema = ToolCatalogEntry & {
  parameters: unknown;
};
```

Helper del catalogo:

```typescript
type ToolCatalog = {
  search(query: string, options?: { limit?: number }): Promise<ToolCatalogEntry[]>;
  describe(id: string): Promise<ToolCatalogEntryWithSchema>;
  call(id: string, input?: unknown): Promise<unknown>;
  [safeToolName: string]: unknown;
};
```

Le funzioni strumento di utilità vengono installate solo per nomi sicuri non ambigui:

```typescript
const files = await tools.search("read local file");
const fileRead = await tools.describe(files[0].id);
const content = await tools.call(fileRead.id, { path: "README.md" });

// If the hidden catalog has an unambiguous `web_search` entry:
const hits = await tools.web_search({ query: "OpenClaw code mode" });
```

Le voci del catalogo MCP non sono chiamabili tramite `tools.call(...)` o funzioni di utilità
in modalità codice. Sono esposte solo tramite il namespace `MCP` generato.
I file di dichiarazione in stile TypeScript sono disponibili tramite la superficie di file virtuale
`API` di sola lettura, così gli agenti possono ispezionare le firme MCP
senza aggiungere schemi MCP al prompt:

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

`API.read("mcp/<server>.d.ts")` restituisce dichiarazioni compatte inferite dai metadati
degli strumenti MCP:

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

I file di dichiarazione sono virtuali, non file scritti sotto la workspace o
la directory di stato. Per ogni chiamata `exec` in modalità codice, OpenClaw costruisce il catalogo strumenti
con ambito dell'esecuzione, mantiene le voci MCP visibili, renderizza `mcp/index.d.ts` più una
dichiarazione `mcp/<server>.d.ts` per ogni server visibile e inserisce quella piccola
tabella di sola lettura nel worker QuickJS. Il codice guest vede solo l'oggetto `API`:
`API.list(prefix?)` restituisce i metadati dei file e `API.read(path)` restituisce il
contenuto della dichiarazione selezionata. I percorsi sconosciuti e i segmenti `.` / `..` vengono rifiutati.

Questo mantiene gli schemi MCP di grandi dimensioni fuori dal prompt del modello. L'agente apprende che
l'API virtuale esiste dalla descrizione dello strumento `exec`, legge solo il file di
dichiarazione necessario e poi chiama `MCP.<server>.<tool>()` con un unico argomento oggetto.
`MCP.<server>.$api()` resta disponibile come fallback inline quando l'agente
ha bisogno di una risposta schema per un singolo strumento all'interno del programma.

Il runtime guest non deve esporre direttamente oggetti host. Input e output attraversano
il bridge come valori compatibili con JSON con limiti di dimensione espliciti.

## Namespace interni

I namespace interni forniscono alla modalità codice un'API di dominio concisa senza aggiungere altri
strumenti visibili al modello. Un'integrazione di proprietà del loader può registrare un namespace
come `Issues`, `Fictions` o `Calendar`; il codice guest quindi chiama quel namespace
all'interno del programma QuickJS mentre OpenClaw mostra ancora solo `exec` e `wait` al
modello.

Per ora i namespace sono interni. Non esiste un'API namespace pubblica dell'SDK Plugin:
i namespace dei Plugin esterni hanno bisogno di un contratto di proprietà del loader affinché identità del Plugin,
manifest installati, stato di autenticazione e descrittori di catalogo memorizzati in cache non possano divergere
dagli strumenti Plugin che supportano il namespace. La modalità codice core possiede solo
sandbox, serializzazione, gating del catalogo e dispatch del bridge.

Il codice guest può quindi usare il globale diretto o la mappa `namespaces`:

```javascript
const open = await Issues.list({ state: "open" });
const alsoOpen = await namespaces.Issues.list({ state: "open" });
return { count: open.length, alsoCount: alsoOpen.length };
```

### Ciclo di vita del registry

Il registry dei namespace è locale al processo e indicizzato per id del namespace. Una tipica
esecuzione segue questo percorso:

1. Un loader attendibile chiama `registerCodeModeNamespaceForPlugin(pluginId, registration)`.
2. La modalità codice crea il `ToolSearchRuntime` nascosto per l'esecuzione e legge il suo
   catalogo con ambito dell'esecuzione.
3. `createCodeModeNamespaceRuntime(ctx, catalog)` mantiene solo le registrazioni
   i cui `requiredToolNames` sono tutti visibili e di proprietà dello stesso `pluginId`.
4. Ogni namespace visibile chiama `createScope(ctx)` per l'esecuzione corrente. Lo
   scope riceve il contesto di esecuzione come `agentId`, `sessionKey`, `sessionId`,
   `runId`, configurazione e stato di interruzione.
5. I dati dello scope vengono serializzati in un descrittore semplice e iniettati in QuickJS come
   globali diretti e `namespaces.<globalName>`.
6. Le chiamate guest vengono sospese tramite il bridge del worker, risolvono il percorso del namespace sull'
   host, mappano la chiamata a uno strumento di catalogo dichiarato di proprietà del Plugin ed eseguono
   quello strumento tramite `ToolSearchRuntime.call`.
7. OpenClaw svuota automaticamente le chiamate bridge namespace pronte all'interno della chiamata strumento
   `exec`/`wait` attiva. Se il lavoro del namespace è ancora in sospeso al timeout o
   il guest cede esplicitamente il controllo, `wait` riprende lo stesso runtime namespace in seguito.
8. Il rollback o la disinstallazione del Plugin chiama `clearCodeModeNamespacesForPlugin(pluginId)`
   così i globali obsoleti non sopravvivono a un caricamento Plugin fallito.

L'invariante importante: le chiamate namespace sono chiamate a strumenti del catalogo. Usano gli
stessi hook di policy, approvazioni, gestione delle interruzioni, telemetria, proiezione della trascrizione
e comportamento di sospensione/ripresa di `tools.call(...)`.

### Forma della registrazione

Registra i namespace dall'integrazione che possiede gli strumenti di supporto. Mantieni lo
scope piccolo ed esponi solo verbi di dominio che mappano a strumenti di catalogo dichiarati.

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

`createCodeModeNamespaceTool(toolName, inputMapper)` marca un membro dello scope come
funzione namespace chiamabile. L'`inputMapper` facoltativo riceve gli argomenti guest
e restituisce l'oggetto input per lo strumento di catalogo di supporto. Senza un
input mapper, viene usato il primo argomento guest, oppure `{}` quando omesso.

Le funzioni host grezze vengono rifiutate prima dell'esecuzione del codice guest:

```typescript
createScope: () => ({
  // Wrong: this bypasses the catalog tool lifecycle and will be rejected.
  list: async () => githubClient.listIssues(),
});
```

### Proprietà e visibilità

La proprietà del namespace è vincolata al `pluginId` del chiamante della registrazione.
`requiredToolNames` è sia un gate di visibilità sia un controllo di proprietà:

- ogni strumento richiesto deve esistere nel catalogo dell'esecuzione
- ogni strumento richiesto deve avere `sourceName === pluginId`
- il namespace è nascosto quando uno strumento richiesto è assente o di proprietà di un altro
  Plugin
- ogni percorso chiamabile può puntare solo a uno strumento nominato in `requiredToolNames`

Questo impedisce a un altro Plugin di esporre un namespace registrando uno strumento
con lo stesso nome. Mantiene inoltre i namespace allineati alla normale policy degli agenti:
se l'esecuzione non può vedere gli strumenti di supporto, non può vedere il namespace.

Ad esempio, un namespace GitHub dovrebbe vivere dietro un'estensione di proprietà di GitHub che
possiede autenticazione GitHub, client REST o GraphQL, limiti di frequenza, approvazioni di scrittura e
test. La modalità codice core non dovrebbe incorporare API specifiche di GitHub, gestione dei token o
policy del provider.

### Regole di serializzazione dello scope

`createScope(ctx)` può restituire un oggetto semplice contenente valori compatibili con JSON,
array, oggetti annidati e marker di chiamata `createCodeModeNamespaceTool(...)`.
Gli oggetti host non entrano mai direttamente in QuickJS.

Il serializzatore rifiuta:

- funzioni grezze
- grafi di oggetti circolari
- segmenti di percorso non sicuri: `__proto__`, `constructor`, `prototype`, chiavi vuote o
  chiavi contenenti il separatore di percorso interno
- valori `globalName` che non sono identificatori JavaScript
- collisioni di `globalName` con globali integrati della modalità codice come `tools`,
  `namespaces`, `text`, `json`, `yield_control` o `__openclaw*`

I valori che non possono essere serializzati in JSON vengono convertiti in valori di fallback
sicuri per JSON prima di attraversare il bridge. Dati binari, handle, socket, client e
istanze di classi dovrebbero restare dietro strumenti di catalogo ordinari.

### Prompt

La `description` del namespace e il `prompt` facoltativo vengono aggiunti allo schema `exec`
visibile al modello solo quando il namespace è visibile per quell'esecuzione. Usali
per insegnare la superficie utile più piccola:

```typescript
{
  description: "Fiction production service helpers.",
  prompt:
    "Use Fictions.riskAudit(), Fictions.promoteIfReady(id, status), and Fictions.unpaidOver(amount).",
}
```

Mantieni i prompt relativi al contratto del namespace, non alla configurazione dell'autenticazione, alla storia
dell'implementazione o a comportamenti non correlati del Plugin.

### Pulizia

Gli spazi dei nomi sono registrazioni locali al processo. Rimuovili quando il Plugin proprietario
viene disabilitato, disinstallato o ripristinato a una versione precedente:

```typescript
clearCodeModeNamespacesForPlugin(pluginId);
```

La pulizia della modalità codice è di proprietà del Plugin; cancella le registrazioni
degli spazi dei nomi del Plugin quando il suo ciclo di vita termina, invece di mantenere
handle di teardown per ogni spazio dei nomi. I test possono chiamare
`clearCodeModeNamespacesForTest()` per evitare perdite di registrazioni tra i casi.

### Checklist dei test

Le modifiche agli spazi dei nomi devono coprire il confine di sicurezza e il comportamento guest:

- il testo del prompt dello spazio dei nomi appare solo quando gli strumenti sottostanti sono visibili
- strumenti con lo stesso nome da un altro `sourceName` non espongono lo spazio dei nomi
- le funzioni di ambito grezze vengono rifiutate
- gli ID di spazio dei nomi contraffatti e i percorsi contraffatti vengono rifiutati
- i percorsi invocabili non possono puntare a strumenti non dichiarati
- gli oggetti annidati e i riferimenti condivisi vengono serializzati correttamente
- le chiamate allo spazio dei nomi vengono eseguite tramite gli strumenti del catalogo e restituiscono dettagli sicuri per JSON
- gli errori possono essere intercettati dal codice guest
- le chiamate sospese allo spazio dei nomi riprendono tramite `wait`
- il rollback del Plugin cancella le registrazioni degli spazi dei nomi di proprietà

Gli spazi dei nomi completano il catalogo generico `tools.search` / `tools.call`. Usa il
catalogo per strumenti OpenClaw, Plugin e client abilitati arbitrari; usa `MCP` per
gli strumenti MCP; usa altri spazi dei nomi per API di dominio documentate e di proprietà
del Plugin, dove il codice conciso è più affidabile di ricerche ripetute negli schemi.

## API di output

`text(value)` aggiunge output leggibile dall'uomo all'array `output`.

`json(value)` aggiunge un elemento di output strutturato dopo una serializzazione
compatibile con JSON.

Il valore restituito finale del codice guest diventa `value` in un risultato `completed`.

Elemento di output:

```typescript
type CodeModeOutput = { type: "text"; text: string } | { type: "json"; value: unknown };
```

Regole di output:

- l'ordine dell'output corrisponde alle chiamate guest
- l'output è limitato da `maxOutputBytes`
- i valori non serializzabili vengono convertiti in stringhe semplici o errori
- i valori binari non sono supportati nella v1
- immagini e file passano attraverso i normali strumenti OpenClaw, non attraverso il
  bridge della modalità codice

## Catalogo degli strumenti

Il catalogo nascosto include gli strumenti dopo il filtro delle policy effettive:

1. Strumenti core di OpenClaw.
2. Strumenti dei Plugin inclusi.
3. Strumenti dei Plugin esterni.
4. Strumenti MCP.
5. Strumenti forniti dal client per l'esecuzione corrente.

Gli ID del catalogo sono stabili all'interno di una singola esecuzione e deterministici
tra set di strumenti equivalenti quando possibile.

Forma consigliata degli ID:

```text
<source>:<owner>:<tool-name>
```

Esempi:

```text
openclaw:core:message
plugin:browser:browser_request
mcp:github:create_issue
client:app:select_file
```

Il catalogo omette gli strumenti di controllo della modalità codice:

- `exec`
- `wait`
- `tool_search_code`
- `tool_search`
- `tool_describe`
- `tool_call`

Questo impedisce la ricorsione e mantiene ristretto il contratto esposto al modello.

Le voci MCP restano nel catalogo con ambito di esecuzione, così policy, approvazioni, hook,
telemetria, proiezione del transcript e ID esatti degli strumenti restano condivisi con la normale
esecuzione degli strumenti. Le viste esposte al guest `ALL_TOOLS`, `tools.search(...)`,
`tools.describe(...)` e `tools.call(...)` omettono le voci MCP. Lo spazio dei nomi
generato `MCP.<server>.<tool>({ ...input })` viene risolto di nuovo nell'ID esatto del
catalogo e poi inviato tramite lo stesso percorso dell'esecutore.

## Interazione con Ricerca strumenti

La modalità codice sostituisce la superficie del modello Ricerca strumenti di OpenClaw per le esecuzioni in cui è
attiva.

Quando `tools.codeMode.enabled` è true e la modalità codice si attiva:

- OpenClaw non espone `tool_search_code`, `tool_search`, `tool_describe`
  o `tool_call` come strumenti visibili al modello.
- La stessa idea di catalogazione si sposta all'interno del runtime guest.
- Il runtime guest riceve metadati compatti `ALL_TOOLS` e helper di ricerca, descrizione
  e chiamata per strumenti non MCP.
- Le chiamate MCP usano lo spazio dei nomi `MCP` generato e le sue intestazioni `$api()`
  invece di `tools.call(...)`.
- Le chiamate annidate vengono inviate attraverso lo stesso percorso dell'esecutore OpenClaw usato da Ricerca strumenti.

La pagina esistente [Ricerca strumenti](/it/tools/tool-search) descrive il bridge compatto del
catalogo OpenClaw. La modalità codice è l'alternativa generica di OpenClaw per le esecuzioni che possono
usare `exec` e `wait`.

## Nomi degli strumenti e collisioni

Lo strumento `exec` visibile al modello è lo strumento della modalità codice. Se il normale strumento
shell `exec` di OpenClaw è abilitato, viene nascosto al modello e catalogato come qualsiasi
altro strumento.

All'interno del runtime guest:

- `tools.call("openclaw:core:exec", input)` può chiamare lo strumento shell exec se
  la policy lo consente.
- `tools.exec(...)` viene installato solo se la voce di catalogo shell exec ha un
  nome sicuro non ambiguo.
- lo strumento `exec` della modalità codice non è mai disponibile ricorsivamente tramite `tools`.

Se due strumenti si normalizzano nello stesso nome di utilità sicuro, OpenClaw omette la
funzione di utilità e richiede `tools.call(id, input)`.

## Esecuzione annidata degli strumenti

Ogni chiamata annidata a uno strumento attraversa il bridge host e rientra in OpenClaw.

L'esecuzione annidata preserva:

- ID agente attivo
- ID sessione e chiave sessione
- contesto del mittente e del canale
- policy sandbox
- policy di approvazione
- hook `before_tool_call` del Plugin
- segnale di annullamento
- aggiornamenti in streaming dove disponibili
- eventi di traiettoria e audit

Le chiamate annidate vengono proiettate nel transcript come vere chiamate a strumenti, così i pacchetti di supporto
possono mostrare cosa è successo. La proiezione identifica la chiamata allo strumento della modalità codice padre
e l'ID dello strumento annidato.

Le chiamate annidate parallele sono consentite fino a `maxPendingToolCalls`.

## Stato del runtime

Ogni esecuzione in modalità codice ha una macchina a stati:

- `running`: la VM è in esecuzione o ci sono chiamate annidate in corso.
- `waiting`: esiste uno snapshot della VM e può essere ripreso con `wait`.
- `completed`: valore finale restituito; snapshot eliminato.
- `failed`: errore restituito; snapshot eliminato.
- `expired`: snapshot o stato in sospeso ha superato la conservazione; impossibile riprendere.
- `aborted`: esecuzione/sessione padre annullata; snapshot eliminato.

Lo stato ha ambito per esecuzione agente, sessione e ID chiamata strumento. Una chiamata `wait` da
un'esecuzione o sessione diversa fallisce.

L'archiviazione degli snapshot è limitata:

- byte massimi di snapshot per esecuzione
- snapshot live massimi per processo
- TTL degli snapshot
- pulizia alla fine dell'esecuzione
- pulizia allo spegnimento del Gateway dove la persistenza non è supportata

## Runtime QuickJS-WASI

OpenClaw carica `quickjs-wasi` come dipendenza diretta nel package proprietario. Il
runtime non si affida a una copia transitiva installata per proxy, PAC o altre
dipendenze non correlate.

Responsabilità del runtime:

- compilare o caricare il modulo WebAssembly QuickJS-WASI
- creare una VM isolata per ogni esecuzione o ripresa della modalità codice
- registrare callback host con nomi stabili
- impostare limiti di memoria e interruzione
- valutare JavaScript
- svuotare i job in sospeso
- creare snapshot dello stato sospeso della VM
- ripristinare snapshot per `wait`
- rilasciare handle della VM e snapshot dopo stati terminali

Il runtime viene eseguito fuori dal ciclo eventi principale di OpenClaw in un worker. Un ciclo infinito
guest non deve bloccare indefinitamente il processo Gateway.

## TypeScript

Il supporto TypeScript è solo una trasformazione sorgente:

- input accettato: una stringa di codice TypeScript
- output: stringa JavaScript valutata da QuickJS-WASI
- nessun typechecking
- nessuna risoluzione dei moduli
- nessun `import` o `require` nella v1
- le diagnostiche vengono restituite come risultati `failed`

Il compilatore TypeScript viene caricato pigramente solo per celle TypeScript. Le celle
JavaScript semplici e la modalità codice disabilitata non caricano il compilatore.

La trasformazione dovrebbe preservare numeri di riga utili dove fattibile.

## Confine di sicurezza

Il codice del modello è ostile. Il runtime usa difesa in profondità:

- eseguire QuickJS-WASI fuori dal ciclo eventi principale
- caricare `quickjs-wasi` come dipendenza diretta, non tramite Codex o un package
  transitivo
- niente filesystem, rete, sottoprocessi, importazione di moduli, variabili d'ambiente o
  oggetti globali host nel guest
- usare limiti di memoria e interruzione di QuickJS
- applicare timeout wall-clock del processo padre
- applicare limiti a output, snapshot, log e chiamate in sospeso
- serializzare i valori del bridge host tramite un adapter JSON ristretto
- convertire gli errori host in errori guest semplici, mai oggetti del realm host
- eliminare gli snapshot in caso di timeout, annullamento, fine sessione o scadenza
- rifiutare l'accesso ricorsivo a `exec`, `wait` e agli strumenti di controllo di Ricerca strumenti
- impedire che collisioni nei nomi di utilità oscurino gli helper del catalogo

Il sandbox è un livello di sicurezza. Gli operatori possono comunque avere bisogno di hardening
a livello di sistema operativo per distribuzioni ad alto rischio.

## Codici di errore

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

Gli errori restituiti al guest sono dati semplici. Le istanze host di `Error`, gli oggetti stack,
i prototipi e le funzioni host non entrano in QuickJS.

## Telemetria

La modalità codice segnala:

- nomi degli strumenti visibili inviati al modello
- dimensione del catalogo nascosto e scomposizione per sorgente
- conteggi di `exec` e `wait`
- conteggi di ricerca, descrizione e chiamata annidate
- ID degli strumenti annidati chiamati
- errori di timeout, memoria, snapshot e limite di output
- eventi del ciclo di vita degli snapshot

La telemetria non deve includere segreti, valori grezzi dell'ambiente o input degli strumenti non oscurati
oltre la policy di traiettoria esistente di OpenClaw.

## Debug

Usa logging mirato del trasporto del modello quando la modalità codice si comporta diversamente da una
normale esecuzione di strumento:

```bash
OPENCLAW_DEBUG_CODE_MODE=1 \
OPENCLAW_DEBUG_MODEL_TRANSPORT=1 \
OPENCLAW_DEBUG_MODEL_PAYLOAD=tools \
OPENCLAW_DEBUG_SSE=events \
openclaw gateway
```

Per il debug della forma del payload, usa `OPENCLAW_DEBUG_MODEL_PAYLOAD=full-redacted`.
Questo registra uno snapshot JSON limitato e redatto della richiesta al modello; dovrebbe essere usato solo
durante il debug perché prompt e testo dei messaggi possono comunque apparire.

Per il debug dello stream, usa `OPENCLAW_DEBUG_SSE=peek` per registrare i primi cinque
eventi SSE redatti. La modalità codice fallisce anche in modo chiuso se il payload finale del provider
non contiene esattamente `exec` e `wait` dopo che la superficie della modalità codice si è
attivata.

## Layout di implementazione

Unità di implementazione:

- contratto di configurazione: `tools.codeMode`
- builder del catalogo: strumenti effettivi in voci compatte e mappa degli ID
- adapter della superficie del modello: sostituire gli strumenti visibili con `exec` e `wait`
- adapter runtime QuickJS-WASI: caricare, valutare, creare snapshot, ripristinare, rilasciare
- supervisore worker: timeout, annullamento, isolamento dai crash
- adapter bridge: callback host sicure per JSON e consegna dei risultati
- adapter di trasformazione TypeScript
- archivio snapshot: TTL, limiti di dimensione, ambito esecuzione/sessione
- proiezione della traiettoria per chiamate annidate a strumenti
- contatori di telemetria e diagnostiche

L'implementazione riusa i concetti di catalogo ed esecutore da Ricerca strumenti, ma
non usa il child `node:vm` come sandbox.

## Checklist di validazione

La copertura della modalità codice dovrebbe dimostrare:

- la configurazione disabilitata lascia invariata l'esposizione degli strumenti esistenti
- la configurazione a oggetto senza `enabled: true` lascia disabilitata la modalità codice
- la configurazione abilitata espone al modello solo `exec` e `wait` quando gli strumenti sono
  attivi per l'esecuzione
- le esecuzioni grezze senza strumenti, `disableTools` e le allowlist vuote non attivano l'applicazione del payload
  della modalità codice
- tutti gli strumenti non MCP effettivi compaiono in `ALL_TOOLS`
- gli strumenti negati non compaiono in `ALL_TOOLS`
- `tools.search`, `tools.describe` e `tools.call` funzionano per gli strumenti OpenClaw
- `API.list("mcp")` e `API.read("mcp/<server>.d.ts")` espongono dichiarazioni MCP in stile TypeScript
  senza una chiamata bridge/strumento
- lo spazio dei nomi MCP `$api()` rimane disponibile come fallback inline per gli schemi
- le chiamate allo spazio dei nomi MCP funzionano per gli strumenti MCP visibili con un input oggetto, mentre
  le voci dirette del catalogo MCP sono assenti da `tools.*`
- gli strumenti di controllo di Ricerca strumenti sono nascosti sia dalla superficie del modello sia dal catalogo
  nascosto
- le chiamate annidate preservano il comportamento di approvazione e degli hook
- `exec` della shell è nascosto al modello ma richiamabile tramite id catalogo quando consentito
- `exec` e `wait` ricorsivi della modalità codice non sono richiamabili dal codice guest
- l'input TypeScript viene trasformato e valutato senza caricare TypeScript nei percorsi
  disabilitati o solo JavaScript
- `import`, `require`, filesystem, rete e accesso all'ambiente falliscono
- i loop infiniti vanno in timeout e non possono bloccare il Gateway
- gli errori del limite di memoria terminano la VM guest
- i limiti di output e snapshot vengono applicati per le chiamate completate e sospese
- `wait` riprende uno snapshot sospeso e restituisce il valore finale
- i valori `runId` scaduti, interrotti, di sessione errata e sconosciuti falliscono
- la riproduzione e la persistenza della trascrizione preservano le chiamate di controllo della modalità codice
- trascrizione e telemetria mostrano chiaramente le chiamate agli strumenti annidate

## Piano di test E2E

Esegui questi test come integrazione o end-to-end quando modifichi il runtime:

1. Avvia un Gateway con `tools.codeMode.enabled: false`.
2. Invia un turno agente con un piccolo insieme di strumenti diretti.
3. Verifica che gli strumenti visibili al modello siano invariati.
4. Riavvia con `tools.codeMode.enabled: true`.
5. Invia un turno agente con strumenti di test OpenClaw, Plugin, MCP e client.
6. Verifica che l'elenco degli strumenti visibili al modello sia esattamente `exec`, `wait`.
7. In `exec`, leggi `ALL_TOOLS` e verifica che gli strumenti di test effettivi siano presenti.
8. In `exec`, chiama strumenti OpenClaw/Plugin/client tramite `tools.search`,
   `tools.describe` e `tools.call`.
9. In `exec`, chiama `API.list("mcp")` e `API.read("mcp/<server>.d.ts")` e
   verifica che i file di dichiarazione descrivano gli strumenti MCP visibili.
10. In `exec`, chiama strumenti MCP tramite `MCP.<server>.<tool>({ ...input })` e
    verifica che le voci dirette del catalogo MCP siano assenti da `ALL_TOOLS` e `tools.*`.
11. Verifica che gli strumenti negati siano assenti e non possano essere chiamati con un id indovinato.
12. Avvia una chiamata a uno strumento annidata che si risolve dopo che `exec` restituisce `waiting`.
13. Chiama `wait` e verifica che la VM ripristinata riceva il risultato dello strumento.
14. Verifica che la risposta finale contenga l'output prodotto dopo il ripristino.
15. Verifica che timeout, interruzione e scadenza dello snapshot ripuliscano lo stato del runtime.
16. Esporta la traiettoria e verifica che le chiamate annidate siano visibili sotto la chiamata
    padre della modalità codice.

Le modifiche solo documentali a questa pagina dovrebbero comunque eseguire `pnpm check:docs`.

## Correlati

- [Ricerca strumenti](/it/tools/tool-search)
- [Runtime agente](/it/concepts/agent-runtimes)
- [Strumento exec](/it/tools/exec)
- [Esecuzione codice](/it/tools/code-execution)
