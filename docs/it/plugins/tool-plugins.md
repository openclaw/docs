---
read_when:
    - Si desidera creare un semplice plugin OpenClaw che aggiunga soltanto strumenti per agenti
    - Si desidera usare defineToolPlugin anziché scrivere manualmente i metadati del manifesto del Plugin
    - È necessario creare la struttura di base, generare, convalidare, testare o pubblicare un plugin composto esclusivamente da strumenti
sidebarTitle: Tool Plugins
summary: Crea semplici strumenti tipizzati per agenti con defineToolPlugin e openclaw plugins init/build/validate
title: Plugin per strumenti
x-i18n:
    generated_at: "2026-07-16T14:50:12Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: fb9187e1d8aed88eee5c99dcdce89f70cd0d4f930b97aaac2ff868037d63adc1
    source_path: plugins/tool-plugins.md
    workflow: 16
---

`defineToolPlugin` crea un plugin che aggiunge solo strumenti richiamabili dall'agente: nessun
canale, provider di modelli, hook, servizio o backend di configurazione. Genera i
metadati del manifest necessari a OpenClaw per individuare gli strumenti senza caricare il codice
runtime del plugin.

Per plugin di provider, canale, hook, servizio o con funzionalità miste, iniziare invece da
[Creazione di plugin](/it/plugins/building-plugins), [Plugin di canale](/it/plugins/sdk-channel-plugins)
o [Plugin di provider](/it/plugins/sdk-provider-plugins).

## Requisiti

- Node 22.22.3+, Node 24.15+ o Node 25.9+.
- Output del pacchetto TypeScript ESM.
- `typebox` in `dependencies` (non solo `devDependencies`: il plugin generato
  lo importa in fase di runtime).
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

`plugins init` genera la struttura di base:

| File                   | Scopo                                                              |
| ---------------------- | ------------------------------------------------------------------ |
| `src/index.ts`         | Punto di ingresso `defineToolPlugin` con uno strumento `echo` |
| `src/index.test.ts`    | Test dei metadati che verifica l'elenco degli strumenti             |
| `tsconfig.json`        | Output TypeScript NodeNext in `dist/`                   |
| `vitest.config.ts`     | Configurazione Vitest per `src/**/*.test.ts`                        |
| `package.json`         | Script, dipendenze runtime, `openclaw.extensions: ["./dist/index.js"]`                     |
| `openclaw.plugin.json` | Metadati del manifest generati per lo strumento iniziale            |

`npm run plugin:build` esegue `npm run build` (tsc), quindi
`openclaw plugins build --entry ./dist/index.js`. `npm run plugin:validate`
ricompila ed esegue `openclaw plugins validate --entry ./dist/index.js`.
Una convalida riuscita stampa:

```text
Il plugin stock-quotes è valido.
```

Opzioni di `openclaw plugins init <id>`:

| Flag                 | Valore predefinito       | Effetto                                      |
| -------------------- | ------------------------ | -------------------------------------------- |
| `--directory <path>` | `<id>`             | Directory di output                          |
| `--name <name>`      | `<id>` con iniziali maiuscole | Nome visualizzato              |
| `--type <type>`      | `tool`             | Tipo di struttura: `tool` o `provider` |
| `--force`            | disattivato              | Sovrascrive una directory di output esistente |

## Scrivere uno strumento

`defineToolPlugin` accetta l'identità del plugin, uno schema di configurazione facoltativo e un
elenco statico di strumenti. I tipi dei parametri e della configurazione vengono dedotti dagli
schemi TypeBox.

```typescript
import { Type } from "typebox";
import { defineToolPlugin } from "openclaw/plugin-sdk/tool-plugin";

export default defineToolPlugin({
  id: "stock-quotes",
  name: "Stock Quotes",
  description: "Recupera istantanee delle quotazioni azionarie.",
  configSchema: Type.Object({
    apiKey: Type.Optional(Type.String({ description: "Chiave API delle quotazioni." })),
    baseUrl: Type.Optional(Type.String({ description: "URL di base dell'API delle quotazioni." })),
  }),
  tools: (tool) => [
    tool({
      name: "stock_quote",
      label: "Quotazione azionaria",
      description: "Recupera un'istantanea della quotazione azionaria.",
      parameters: Type.Object({
        symbol: Type.String({ description: "Simbolo ticker, ad esempio OPEN." }),
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

I nomi degli strumenti costituiscono l'API stabile. Scegliere nomi univoci, in minuscolo e
abbastanza specifici da evitare collisioni con gli strumenti principali o con altri plugin.

## Strumenti facoltativi e factory

Impostare `optional: true` quando gli utenti devono inserire esplicitamente lo strumento nell'elenco consentito prima che
venga inviato a un modello. `openclaw plugins build` scrive la voce del manifest
`toolMetadata.<tool>.optional` corrispondente, affinché OpenClaw possa rilevare che lo
strumento è facoltativo senza caricare il codice runtime del plugin.

```typescript
tool({
  name: "workflow_run",
  description: "Esegue un flusso di lavoro esterno.",
  parameters: Type.Object({ goal: Type.String() }),
  optional: true,
  execute: ({ goal }) => ({ queued: true, goal }),
});
```

Usare `factory` quando uno strumento necessita del contesto runtime degli strumenti prima di poter essere
creato, per escluderlo da un'esecuzione specifica, esaminare lo stato della sandbox o associare
helper runtime. I metadati rimangono statici anche se lo strumento concreto viene creato
in fase di runtime.

```typescript
tool({
  name: "local_workflow",
  description: "Esegue un flusso di lavoro locale al di fuori delle sessioni in sandbox.",
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

Le factory dichiarano comunque in anticipo un nome fisso per lo strumento. Usare direttamente `definePluginEntry`
quando il plugin calcola dinamicamente i nomi degli strumenti o combina gli strumenti
con hook, servizi, provider o comandi.

## Valori restituiti

`defineToolPlugin` racchiude i valori restituiti semplici nel formato dei risultati degli strumenti
di OpenClaw:

- Restituire una stringa quando il modello deve visualizzare esattamente quel testo.
- Restituire un valore compatibile con JSON quando si desidera che il modello visualizzi JSON formattato
  e che OpenClaw conservi il valore originale in `details`.

```typescript
tool({
  name: "echo_text",
  description: "Ripete il testo di input.",
  parameters: Type.Object({
    input: Type.String(),
  }),
  execute: ({ input }) => input,
});
```

```typescript
tool({
  name: "echo_json",
  description: "Ripete l'input come JSON strutturato.",
  parameters: Type.Object({
    input: Type.String(),
  }),
  execute: ({ input }) => ({ input, length: input.length }),
});
```

Usare uno strumento factory quando è necessario un `AgentToolResult` personalizzato o si desidera riutilizzare
un'implementazione `api.registerTool` esistente.

## Configurazione

`configSchema` è facoltativo. Se viene omesso, OpenClaw applica uno schema rigoroso per oggetti vuoti;
il manifest generato include comunque `configSchema`.

```typescript
export default defineToolPlugin({
  id: "no-config-tools",
  name: "Strumenti senza configurazione",
  description: "Aggiunge strumenti che non richiedono configurazione.",
  tools: () => [],
});
```

Con un `configSchema`, il secondo argomento `execute` viene tipizzato a partire da esso:

```typescript
const configSchema = Type.Object({
  apiKey: Type.String(),
});

export default defineToolPlugin({
  id: "configured-tools",
  name: "Strumenti configurati",
  description: "Aggiunge strumenti configurati.",
  configSchema,
  tools: (tool) => [
    tool({
      name: "configured_ping",
      description: "Verifica se la configurazione è disponibile.",
      parameters: Type.Object({}),
      execute: (_params, config) => ({ hasKey: config.apiKey.length > 0 }),
    }),
  ],
});
```

OpenClaw legge la configurazione del plugin dalla voce del plugin nella configurazione del Gateway. Non
inserire segreti direttamente nel codice sorgente o negli esempi della documentazione; usare la configurazione, le variabili
d'ambiente o i SecretRef in base al modello di sicurezza del plugin.

## Metadati generati

OpenClaw deve leggere il manifest del plugin prima di importare il codice runtime del plugin.
`defineToolPlugin` espone metadati statici a questo scopo e
`openclaw plugins build` li scrive nel pacchetto. Eseguire nuovamente il generatore dopo
aver modificato l'ID, il nome, la descrizione, lo schema di configurazione, l'attivazione o i nomi degli strumenti
del plugin:

```bash
npm run build
openclaw plugins build --entry ./dist/index.js
```

Manifest generato per un plugin con un solo strumento:

```json
{
  "id": "stock-quotes",
  "name": "Stock Quotes",
  "description": "Recupera istantanee delle quotazioni azionarie.",
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

`contracts.tools` è il contratto di individuazione fondamentale: indica a OpenClaw quale
plugin è proprietario di ciascuno strumento senza caricare il runtime di ogni plugin installato. Un
manifest obsoleto può impedire l'individuazione di uno strumento oppure attribuire un errore
di registrazione al plugin sbagliato.

## Metadati del pacchetto

`openclaw plugins build` allinea inoltre `package.json` al punto di ingresso runtime
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

Distribuire JavaScript compilato (`./dist/index.js`), non un punto di ingresso sorgente TypeScript.
I punti di ingresso sorgente funzionano solo per lo sviluppo locale nell'area di lavoro.

## Convalidare nella CI

`plugins build --check` non riesce, senza riscrivere i file, quando i metadati generati
sono obsoleti:

```bash
npm run build
openclaw plugins build --entry ./dist/index.js --check
openclaw plugins validate --entry ./dist/index.js
npm test
```

`plugins validate` verifica che:

- `openclaw.plugin.json` esista e superi il normale caricatore del manifest.
- Il punto di ingresso corrente esporti i metadati `defineToolPlugin`.
- I campi del manifest generato corrispondano ai metadati del punto di ingresso.
- `contracts.tools` corrisponda ai nomi degli strumenti dichiarati.
- `package.json` indirizzi `openclaw.extensions` al punto di ingresso runtime selezionato.

## Installare ed esaminare localmente

Da un checkout OpenClaw separato o da una CLI installata, installare il percorso del pacchetto:

```bash
openclaw plugins install ./stock-quotes
openclaw plugins inspect stock-quotes --runtime
```

Per un test rapido del pacchetto, creare prima il pacchetto e installare il tarball:

```bash
npm pack
openclaw plugins install npm-pack:./openclaw-plugin-stock-quotes-0.1.0.tgz
openclaw plugins inspect stock-quotes --runtime --json
```

Dopo l'installazione, riavviare o ricaricare il Gateway e chiedere all'agente di usare lo
strumento. Se lo strumento non è visibile, esaminare il runtime del plugin e il catalogo degli
strumenti effettivo prima di modificare il codice (vedere [Risoluzione dei problemi](#troubleshooting)).

## Pubblicazione

Pubblicare tramite ClawHub quando il pacchetto è pronto. `clawhub package publish`
accetta una sorgente: una cartella locale, un repository GitHub (`owner/repo[@ref]`) o un
URL di tarball.

```bash
clawhub package publish ./stock-quotes --dry-run
clawhub package publish ./stock-quotes
```

Installare con un localizzatore ClawHub esplicito:

```bash
openclaw plugins install clawhub:your-org/stock-quotes
```

Le specifiche semplici dei pacchetti npm continuano a essere installate da npm durante la transizione del lancio, ma
ClawHub è la superficie preferita per individuare e distribuire i plugin
OpenClaw. Vedere [Pubblicazione su ClawHub](/it/clawhub/publishing) per l'ambito del proprietario e
la revisione della versione.

## Risoluzione dei problemi

### `plugin entry not found: ./dist/index.js`

Il file del punto di ingresso selezionato non esiste. Eseguire `npm run build`, quindi eseguire nuovamente
`openclaw plugins build --entry ./dist/index.js` o
`openclaw plugins validate --entry ./dist/index.js`.

### `plugin entry does not expose defineToolPlugin metadata`

Il punto di ingresso non ha esportato un valore creato da `defineToolPlugin`. Verificare che
l'esportazione predefinita del modulo sia il risultato di `defineToolPlugin(...)`, oppure specificare il
punto di ingresso corretto con `--entry`.

### `openclaw.plugin.json generated metadata is stale`

Il manifest non corrisponde più ai metadati del punto di ingresso. Eseguire:

```bash
npm run build
openclaw plugins build --entry ./dist/index.js
```

Eseguire il commit delle modifiche sia a `openclaw.plugin.json` sia a `package.json`.

### `package.json openclaw.extensions must include ./dist/index.js`

I metadati del pacchetto puntano a un punto di ingresso runtime diverso. Eseguire
`openclaw plugins build --entry ./dist/index.js` affinché il generatore allinei
i metadati del pacchetto al punto di ingresso che si intende distribuire.

### `Cannot find package 'typebox'`

Il plugin compilato importa `typebox` in fase di runtime. Mantenerlo in `dependencies`,
reinstallare, ricompilare ed eseguire nuovamente la convalida.

### Lo strumento non compare dopo l'installazione

Verificare quanto segue nell'ordine:

1. `openclaw plugins inspect <plugin-id> --runtime`
2. `openclaw plugins validate --root <plugin-root> --entry ./dist/index.js`
3. `openclaw.plugin.json` contiene `contracts.tools` con i nomi degli strumenti previsti.
4. `package.json` contiene `openclaw.extensions: ["./dist/index.js"]`.
5. Il Gateway è stato riavviato o ricaricato dopo l'installazione del Plugin.

## Vedere anche

- [Creazione di Plugin](/it/plugins/building-plugins)
- [Punti di ingresso dei Plugin](/it/plugins/sdk-entrypoints)
- [Sottopercorsi dell'SDK dei Plugin](/it/plugins/sdk-subpaths)
- [Manifest del Plugin](/it/plugins/manifest)
- [CLI dei Plugin](/it/cli/plugins)
- [Pubblicazione su ClawHub](/it/clawhub/publishing)
