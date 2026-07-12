---
read_when:
    - Vuoi creare un semplice plugin OpenClaw che aggiunga solo strumenti per l’agente
    - Vuoi usare defineToolPlugin invece di scrivere manualmente i metadati del manifesto del plugin
    - Devi creare la struttura, generare, convalidare, testare o pubblicare un plugin costituito esclusivamente da strumenti
sidebarTitle: Tool Plugins
summary: Crea semplici strumenti tipizzati per agenti con defineToolPlugin e openclaw plugins init/build/validate
title: Plugin degli strumenti
x-i18n:
    generated_at: "2026-07-12T07:25:24Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 231eba96d4927b7411cb17d79b96e6df09ed111fc8a54eac0ca7717e58803d26
    source_path: plugins/tool-plugins.md
    workflow: 16
---

`defineToolPlugin` crea un Plugin che aggiunge esclusivamente strumenti richiamabili dall'agente: nessun
canale, provider di modelli, hook, servizio o backend di configurazione. Genera i
metadati del manifesto necessari a OpenClaw per individuare gli strumenti senza caricare il codice
di runtime del Plugin.

Per Plugin di provider, canali, hook, servizi o con funzionalità miste, consulta invece
[Creazione di Plugin](/it/plugins/building-plugins), [Plugin per canali](/it/plugins/sdk-channel-plugins)
o [Plugin per provider](/it/plugins/sdk-provider-plugins).

## Requisiti

- Node 22.19+, Node 23.11+ o Node 24+.
- Output del pacchetto TypeScript ESM.
- `typebox` in `dependencies` (non solo in `devDependencies`: il Plugin generato
  lo importa durante il runtime).
- `openclaw >=2026.5.17`, la prima versione che esporta
  `openclaw/plugin-sdk/tool-plugin`.
- Una radice del pacchetto che distribuisca `dist/`, `openclaw.plugin.json` e
  `package.json`.

## Avvio rapido

```bash
openclaw plugins init stock-quotes --name "Stock Quotes"
cd stock-quotes
npm install
npm run plugin:build
npm run plugin:validate
npm test
```

`plugins init` genera la struttura seguente:

| File                   | Scopo                                                              |
| ---------------------- | ------------------------------------------------------------------ |
| `src/index.ts`         | Punto di ingresso `defineToolPlugin` con uno strumento `echo`      |
| `src/index.test.ts`    | Test dei metadati che verifica l'elenco degli strumenti            |
| `tsconfig.json`        | Output TypeScript NodeNext in `dist/`                              |
| `vitest.config.ts`     | Configurazione Vitest per `src/**/*.test.ts`                       |
| `package.json`         | Script, dipendenze di runtime, `openclaw.extensions: ["./dist/index.js"]` |
| `openclaw.plugin.json` | Metadati del manifesto generati per lo strumento iniziale          |

`npm run plugin:build` esegue `npm run build` (tsc), quindi
`openclaw plugins build --entry ./dist/index.js`. `npm run plugin:validate`
ricompila ed esegue `openclaw plugins validate --entry ./dist/index.js`.
Una convalida riuscita mostra:

```text
Plugin stock-quotes is valid.
```

Opzioni di `openclaw plugins init <id>`:

| Flag                 | Valore predefinito        | Effetto                                      |
| -------------------- | ------------------------- | -------------------------------------------- |
| `--directory <path>` | `<id>`                    | Directory di output                          |
| `--name <name>`      | `<id>` in formato titolo  | Nome visualizzato                            |
| `--type <type>`      | `tool`                    | Tipo di struttura: `tool` o `provider`       |
| `--force`            | disattivato               | Sovrascrive una directory di output esistente |

## Scrivere uno strumento

`defineToolPlugin` accetta l'identità del Plugin, uno schema di configurazione facoltativo e un
elenco statico di strumenti. I tipi dei parametri e della configurazione vengono dedotti dagli
schemi TypeBox.

```typescript
import { Type } from "typebox";
import { defineToolPlugin } from "openclaw/plugin-sdk/tool-plugin";

export default defineToolPlugin({
  id: "stock-quotes",
  name: "Stock Quotes",
  description: "Fetch stock quote snapshots.",
  configSchema: Type.Object({
    apiKey: Type.Optional(Type.String({ description: "Quote API key." })),
    baseUrl: Type.Optional(Type.String({ description: "Quote API base URL." })),
  }),
  tools: (tool) => [
    tool({
      name: "stock_quote",
      label: "Stock Quote",
      description: "Fetch a stock quote snapshot.",
      parameters: Type.Object({
        symbol: Type.String({ description: "Ticker symbol, for example OPEN." }),
      }),
      async execute({ symbol }, config, context) {
        context.signal?.throwIfAborted();
        return {
          symbol: symbol.toUpperCase(),
          configured: Boolean(config.apiKey),
          baseUrl: config.baseUrl ?? "https://api.example.com",
        };
      },
    }),
  ],
});
```

I nomi degli strumenti costituiscono l'API stabile. Scegli nomi univoci, in minuscolo e
abbastanza specifici da evitare conflitti con gli strumenti principali o con altri Plugin.

## Strumenti facoltativi e basati su factory

Imposta `optional: true` quando gli utenti devono inserire esplicitamente lo strumento nell'elenco consentito prima che
venga inviato a un modello. `openclaw plugins build` scrive la voce corrispondente
`toolMetadata.<tool>.optional` nel manifesto, così OpenClaw può rilevare che lo
strumento è facoltativo senza caricare il codice di runtime del Plugin.

```typescript
tool({
  name: "workflow_run",
  description: "Run an external workflow.",
  parameters: Type.Object({ goal: Type.String() }),
  optional: true,
  execute: ({ goal }) => ({ queued: true, goal }),
});
```

Usa `factory` quando uno strumento necessita del contesto degli strumenti di runtime prima di poter essere
creato, ad esempio per escludersi da una specifica esecuzione, esaminare lo stato della sandbox o associare
helper di runtime. I metadati rimangono statici anche se lo strumento concreto viene creato
durante il runtime.

```typescript
tool({
  name: "local_workflow",
  description: "Run a local workflow outside sandboxed sessions.",
  parameters: Type.Object({ goal: Type.String() }),
  optional: true,
  factory({ api, toolContext }) {
    if (toolContext.sandboxed) {
      return null;
    }
    return createLocalWorkflowTool(api);
  },
});
```

Le factory dichiarano comunque in anticipo un nome fisso per lo strumento. Usa direttamente `definePluginEntry`
quando il Plugin calcola dinamicamente i nomi degli strumenti o combina strumenti
con hook, servizi, provider o comandi.

## Valori restituiti

`defineToolPlugin` racchiude i normali valori restituiti nel formato dei risultati
degli strumenti di OpenClaw:

- Restituisci una stringa quando il modello deve visualizzare esattamente quel testo.
- Restituisci un valore compatibile con JSON quando vuoi che il modello visualizzi JSON formattato
  e che OpenClaw conservi il valore originale in `details`.

```typescript
tool({
  name: "echo_text",
  description: "Echo input text.",
  parameters: Type.Object({
    input: Type.String(),
  }),
  execute: ({ input }) => input,
});
```

```typescript
tool({
  name: "echo_json",
  description: "Echo input as structured JSON.",
  parameters: Type.Object({
    input: Type.String(),
  }),
  execute: ({ input }) => ({ input, length: input.length }),
});
```

Usa uno strumento basato su factory quando ti serve un `AgentToolResult` personalizzato o vuoi riutilizzare
un'implementazione `api.registerTool` esistente.

## Configurazione

`configSchema` è facoltativo. Se lo ometti, OpenClaw applica uno schema rigoroso per un oggetto vuoto;
il manifesto generato include comunque `configSchema`.

```typescript
export default defineToolPlugin({
  id: "no-config-tools",
  name: "No Config Tools",
  description: "Adds tools that do not need configuration.",
  tools: () => [],
});
```

Con un `configSchema`, il tipo del secondo argomento di `execute` viene derivato da esso:

```typescript
const configSchema = Type.Object({
  apiKey: Type.String(),
});

export default defineToolPlugin({
  id: "configured-tools",
  name: "Configured Tools",
  description: "Adds configured tools.",
  configSchema,
  tools: (tool) => [
    tool({
      name: "configured_ping",
      description: "Check whether configuration is available.",
      parameters: Type.Object({}),
      execute: (_params, config) => ({ hasKey: config.apiKey.length > 0 }),
    }),
  ],
});
```

OpenClaw legge la configurazione del Plugin dalla voce corrispondente nella configurazione del Gateway. Non
inserire segreti direttamente nel codice sorgente o negli esempi della documentazione; usa la configurazione, le variabili
d'ambiente o i SecretRef in base al modello di sicurezza del Plugin.

## Metadati generati

OpenClaw deve leggere il manifesto del Plugin prima di importarne il codice di runtime.
`defineToolPlugin` espone metadati statici a questo scopo e
`openclaw plugins build` li scrive nel pacchetto. Esegui nuovamente il generatore dopo
aver modificato ID, nome, descrizione, schema di configurazione, attivazione o nomi degli
strumenti del Plugin:

```bash
npm run build
openclaw plugins build --entry ./dist/index.js
```

Manifesto generato per un Plugin con un solo strumento:

```json
{
  "id": "stock-quotes",
  "name": "Stock Quotes",
  "description": "Fetch stock quote snapshots.",
  "version": "0.1.0",
  "configSchema": {
    "type": "object",
    "additionalProperties": false,
    "properties": {}
  },
  "activation": {
    "onStartup": true
  },
  "contracts": {
    "tools": ["stock_quote"]
  }
}
```

`contracts.tools` è il contratto di individuazione principale: indica a OpenClaw quale
Plugin possiede ogni strumento senza caricare il runtime di tutti i Plugin installati. Un
manifesto obsoleto può impedire l'individuazione di uno strumento oppure far attribuire un errore
di registrazione al Plugin sbagliato.

## Metadati del pacchetto

`openclaw plugins build` allinea anche `package.json` al punto di ingresso di runtime
selezionato:

```json
{
  "type": "module",
  "files": ["dist", "openclaw.plugin.json", "README.md"],
  "dependencies": {
    "typebox": "^1.1.38"
  },
  "peerDependencies": {
    "openclaw": ">=2026.5.17"
  },
  "openclaw": {
    "extensions": ["./dist/index.js"]
  }
}
```

Distribuisci il JavaScript compilato (`./dist/index.js`), non un punto di ingresso sorgente TypeScript.
I punti di ingresso sorgente funzionano solo per lo sviluppo locale nell'area di lavoro.

## Convalidare nella CI

`plugins build --check` restituisce un errore senza riscrivere i file quando i metadati generati
sono obsoleti:

```bash
npm run build
openclaw plugins build --entry ./dist/index.js --check
openclaw plugins validate --entry ./dist/index.js
npm test
```

`plugins validate` verifica che:

- `openclaw.plugin.json` esista e superi il normale caricatore del manifesto.
- Il punto di ingresso corrente esporti i metadati di `defineToolPlugin`.
- I campi del manifesto generato corrispondano ai metadati del punto di ingresso.
- `contracts.tools` corrisponda ai nomi degli strumenti dichiarati.
- `package.json` indirizzi `openclaw.extensions` al punto di ingresso di runtime selezionato.

## Installare ed esaminare localmente

Da un checkout OpenClaw separato o da una CLI installata, installa il percorso del pacchetto:

```bash
openclaw plugins install ./stock-quotes
openclaw plugins inspect stock-quotes --runtime
```

Per un test rapido del pacchetto, crea prima il pacchetto e installa il tarball:

```bash
npm pack
openclaw plugins install npm-pack:./openclaw-plugin-stock-quotes-0.1.0.tgz
openclaw plugins inspect stock-quotes --runtime --json
```

Dopo l'installazione, riavvia o ricarica il Gateway e chiedi all'agente di usare lo
strumento. Se lo strumento non è visibile, esamina il runtime del Plugin e il catalogo degli
strumenti effettivo prima di modificare il codice (consulta [Risoluzione dei problemi](#troubleshooting)).

## Pubblicazione

Pubblica tramite ClawHub quando il pacchetto è pronto. `clawhub package publish`
accetta una sorgente: una cartella locale, un repository GitHub (`owner/repo[@ref]`) o un
URL di un tarball.

```bash
clawhub package publish ./stock-quotes --dry-run
clawhub package publish ./stock-quotes
```

Installa usando un riferimento ClawHub esplicito:

```bash
openclaw plugins install clawhub:your-org/stock-quotes
```

Durante la transizione al lancio, le specifiche semplici dei pacchetti npm continuano a essere installate da npm, ma
ClawHub è il canale preferito per l'individuazione e la distribuzione dei Plugin
OpenClaw. Consulta [Pubblicazione su ClawHub](/it/clawhub/publishing) per l'ambito del proprietario e
la revisione della versione.

## Risoluzione dei problemi

### `plugin entry not found: ./dist/index.js`

Il file del punto di ingresso selezionato non esiste. Esegui `npm run build`, quindi esegui nuovamente
`openclaw plugins build --entry ./dist/index.js` oppure
`openclaw plugins validate --entry ./dist/index.js`.

### `plugin entry does not expose defineToolPlugin metadata`

Il punto di ingresso non ha esportato un valore creato da `defineToolPlugin`. Verifica che
l'esportazione predefinita del modulo sia il risultato di `defineToolPlugin(...)` oppure passa il
punto di ingresso corretto con `--entry`.

### `openclaw.plugin.json generated metadata is stale`

Il manifesto non corrisponde più ai metadati del punto di ingresso. Esegui:

```bash
npm run build
openclaw plugins build --entry ./dist/index.js
```

Esegui il commit delle modifiche sia a `openclaw.plugin.json` sia a `package.json`.

### `package.json openclaw.extensions must include ./dist/index.js`

I metadati del pacchetto puntano a un punto di ingresso di runtime diverso. Esegui
`openclaw plugins build --entry ./dist/index.js` affinché il generatore allinei
i metadati del pacchetto al punto di ingresso che intendi distribuire.

### `Cannot find package 'typebox'`

Il Plugin compilato importa `typebox` durante il runtime. Mantienilo in `dependencies`,
reinstalla, ricompila ed esegui nuovamente la convalida.

### Lo strumento non compare dopo l'installazione

Controlla nell'ordine seguente:

1. `openclaw plugins inspect <plugin-id> --runtime`
2. `openclaw plugins validate --root <plugin-root> --entry ./dist/index.js`
3. `openclaw.plugin.json` contiene `contracts.tools` con i nomi degli strumenti previsti.
4. `package.json` contiene `openclaw.extensions: ["./dist/index.js"]`.
5. Il Gateway è stato riavviato o ricaricato dopo l'installazione del plugin.

## Vedi anche

- [Creazione di plugin](/it/plugins/building-plugins)
- [Punti di ingresso dei plugin](/it/plugins/sdk-entrypoints)
- [Sottopercorsi dell'SDK dei plugin](/it/plugins/sdk-subpaths)
- [Manifest del plugin](/it/plugins/manifest)
- [CLI dei plugin](/it/cli/plugins)
- [Pubblicazione su ClawHub](/it/clawhub/publishing)
