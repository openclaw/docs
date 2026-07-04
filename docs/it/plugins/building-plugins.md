---
doc-schema-version: 1
read_when:
    - Vuoi creare un nuovo Plugin OpenClaw
    - Ti serve una guida rapida per lo sviluppo di Plugin
    - Stai scegliendo tra documentazione su canale, provider, backend CLI, strumento o hook
sidebarTitle: Getting Started
summary: Crea il tuo primo Plugin OpenClaw in pochi minuti
title: Creare Plugin
x-i18n:
    generated_at: "2026-07-04T15:22:54Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: e4bceff518e0b2b3b06573a96edb2af65bbe8662d049323045cd1c80fc6f328f
    source_path: plugins/building-plugins.md
    workflow: 16
---

I Plugin estendono OpenClaw senza modificare il core. Un Plugin può aggiungere un canale di messaggistica, un provider di modelli, un backend CLI locale, uno strumento agente, un hook, un provider multimediale o un'altra funzionalità di proprietà del Plugin.

Non è necessario aggiungere un Plugin esterno al repository OpenClaw. Pubblica il pacchetto su [ClawHub](/it/clawhub) e gli utenti lo installano con:

```bash
openclaw plugins install clawhub:<package-name>
```

Le specifiche di pacchetto semplici continuano a installare da npm durante il passaggio del lancio. Usa il prefisso `clawhub:` quando vuoi la risoluzione ClawHub.

## Requisiti

- Usa Node 22.19+, Node 23.11+ o Node 24+ e un package manager come `npm` o `pnpm`.
- Familiarità con i moduli TypeScript ESM.
- Per lavorare su Plugin in bundle nel repository, clona il repository ed esegui `pnpm install`.
  Lo sviluppo di Plugin da checkout del sorgente è solo pnpm perché OpenClaw carica i Plugin in bundle dai pacchetti workspace `extensions/*`.

## Scegli la forma del Plugin

<CardGroup cols={2}>
  <Card title="Plugin di canale" icon="messages-square" href="/it/plugins/sdk-channel-plugins">
    Collega OpenClaw a una piattaforma di messaggistica.
  </Card>
  <Card title="Plugin provider" icon="cpu" href="/it/plugins/sdk-provider-plugins">
    Aggiungi un provider di modelli, media, ricerca, fetch, voce o realtime.
  </Card>
  <Card title="Plugin backend CLI" icon="terminal" href="/it/plugins/cli-backend-plugins">
    Esegui una CLI AI locale tramite il fallback del modello OpenClaw.
  </Card>
  <Card title="Plugin strumento" icon="wrench" href="/it/plugins/tool-plugins">
    Registra strumenti agente.
  </Card>
</CardGroup>

## Avvio rapido

Crea un Plugin strumento minimo registrando uno strumento agente obbligatorio. Questa è la forma di Plugin utile più breve e mostra il pacchetto, il manifest, l'entry point e la prova locale.

<Steps>
  <Step title="Crea i metadati del pacchetto">
    <CodeGroup>

```json package.json
{
  "name": "@myorg/openclaw-my-plugin",
  "version": "1.0.0",
  "type": "module",
  "dependencies": {
    "typebox": "1.1.39"
  },
  "peerDependencies": {
    "openclaw": ">=2026.3.24-beta.2"
  },
  "openclaw": {
    "extensions": ["./index.ts"],
    "compat": {
      "pluginApi": ">=2026.3.24-beta.2",
      "minGatewayVersion": "2026.3.24-beta.2"
    },
    "build": {
      "openclawVersion": "2026.3.24-beta.2",
      "pluginSdkVersion": "2026.3.24-beta.2"
    }
  }
}
```

```json openclaw.plugin.json
{
  "id": "my-plugin",
  "name": "My Plugin",
  "description": "Adds a custom tool to OpenClaw",
  "contracts": {
    "tools": ["my_tool"]
  },
  "activation": {
    "onStartup": true
  },
  "configSchema": {
    "type": "object",
    "additionalProperties": false
  }
}
```

    </CodeGroup>

    I Plugin esterni pubblicati devono puntare le voci runtime ai file JavaScript compilati. Vedi [entry point SDK](/it/plugins/sdk-entrypoints) per il contratto completo degli entry point.

    Ogni Plugin ha bisogno di un manifest, anche quando non ha configurazione. Gli strumenti runtime devono comparire in `contracts.tools` in modo che OpenClaw possa scoprire la proprietà senza caricare con entusiasmo ogni runtime di Plugin. Imposta `activation.onStartup` intenzionalmente. Questo esempio si avvia all'avvio del Gateway.

    Anche le superfici Plugin considerate attendibili dall'host sono controllate dal manifest e richiedono l'abilitazione esplicita per i Plugin installati. Se un Plugin installato registra `api.registerAgentToolResultMiddleware(...)`, dichiara ogni runtime di destinazione in `contracts.agentToolResultMiddleware`. Se registra `api.registerTrustedToolPolicy(...)`, dichiara ogni ID di policy in `contracts.trustedToolPolicies`. Queste dichiarazioni mantengono allineate l'ispezione in fase di installazione e la registrazione runtime.

    Per ogni campo del manifest, vedi [manifest del Plugin](/it/plugins/manifest).

  </Step>

  <Step title="Registra lo strumento">
    ```typescript index.ts
    import { Type } from "typebox";
    import { definePluginEntry } from "openclaw/plugin-sdk/plugin-entry";

    export default definePluginEntry({
      id: "my-plugin",
      name: "My Plugin",
      description: "Adds a custom tool to OpenClaw",
      register(api) {
        api.registerTool({
          name: "my_tool",
          description: "Echo one input value",
          parameters: Type.Object({ input: Type.String() }),
          async execute(_id, params) {
            return {
              content: [{ type: "text", text: `Got: ${params.input}` }],
            };
          },
        });
      },
    });
    ```

    Usa `definePluginEntry` per i Plugin non di canale. I Plugin di canale usano `defineChannelPluginEntry`.

  </Step>

  <Step title="Testa il runtime">
    Per un Plugin installato o esterno, ispeziona il runtime caricato:

    ```bash
    openclaw plugins inspect my-plugin --runtime --json
    ```

    Se il Plugin registra un comando CLI, esegui anche quel comando. Ad esempio, un comando demo dovrebbe avere una prova di esecuzione come `openclaw demo-plugin ping`.

    Per un Plugin in bundle in questo repository, OpenClaw scopre i pacchetti Plugin da checkout del sorgente dal workspace `extensions/*`. Esegui il test mirato più vicino:

    ```bash
    pnpm test -- extensions/my-plugin/
    pnpm check
    ```

  </Step>

  <Step title="Testa l'installazione del pacchetto">
    Prima di pubblicare un Plugin pronto come pacchetto, testa la stessa forma di installazione che avranno gli utenti. Prima aggiungi uno step di build, punta le voci runtime come `openclaw.extensions` a JavaScript compilato come `./dist/index.js` e assicurati che `npm pack` includa quell'output `dist/`. Le voci sorgente TypeScript servono solo per checkout del sorgente e percorsi di sviluppo locali.

    Quindi impacchetta il Plugin e installa il tarball con `npm-pack:`:

    ```bash
    npm pack --pack-destination /tmp
    openclaw plugins install npm-pack:/tmp/<plugin-package>.tgz --force
    openclaw plugins inspect my-plugin --runtime --json
    ```

    `npm-pack:` usa il progetto npm per-Plugin gestito da OpenClaw, quindi intercetta errori nelle dipendenze runtime che i test da checkout del sorgente possono nascondere. Dimostra la forma del pacchetto e delle dipendenze, non la fiducia ufficiale collegata al catalogo. Gli import runtime devono essere in `dependencies` o `optionalDependencies`; le dipendenze lasciate solo in `devDependencies` non verranno installate per il progetto runtime gestito.

    Non usare un'installazione da archivio/percorso grezza come prova finale per il comportamento ufficiale o privilegiato di un Plugin. I sorgenti grezzi sono utili per il debug locale, ma non dimostrano lo stesso percorso delle dipendenze delle installazioni npm o ClawHub. Se il tuo Plugin dipende dallo stato attendibile di Plugin ufficiale, aggiungi una seconda prova tramite un'installazione ufficiale supportata da catalogo o un percorso di pacchetto pubblicato che registra la fiducia ufficiale. Vedi [risoluzione delle dipendenze del Plugin](/it/plugins/dependency-resolution) per dettagli su radice di installazione e proprietà delle dipendenze.

  </Step>

  <Step title="Pubblica">
    Valida il pacchetto prima della pubblicazione:

    ```bash
    clawhub package publish your-org/your-plugin --dry-run
    clawhub package publish your-org/your-plugin
    ```

    Gli snippet canonici di ClawHub si trovano in `docs/snippets/plugin-publish/`.

  </Step>

  <Step title="Installa">
    Installa il pacchetto pubblicato tramite ClawHub:

    ```bash
    openclaw plugins install clawhub:your-org/your-plugin
    ```

  </Step>
</Steps>

<a id="registering-agent-tools"></a>

## Registrazione degli strumenti

Gli strumenti possono essere obbligatori o opzionali. Gli strumenti obbligatori sono sempre disponibili quando il Plugin è abilitato. Gli strumenti opzionali richiedono l'opt-in dell'utente.

```typescript
register(api) {
  api.registerTool(
    {
      name: "workflow_tool",
      description: "Run a workflow",
      parameters: Type.Object({ pipeline: Type.String() }),
      async execute(_id, params) {
        return { content: [{ type: "text", text: params.pipeline }] };
      },
    },
    { optional: true },
  );
}
```

Ogni strumento registrato con `api.registerTool(...)` deve anche essere dichiarato nel manifest del Plugin:

```json
{
  "contracts": {
    "tools": ["workflow_tool"]
  },
  "toolMetadata": {
    "workflow_tool": {
      "optional": true
    }
  }
}
```

Gli utenti effettuano l'opt-in con `tools.allow`:

```json5
{
  tools: { allow: ["workflow_tool"] }, // or ["my-plugin"] for all tools from one plugin
}
```

Gli strumenti opzionali controllano se uno strumento viene esposto al modello. Usa le [richieste di autorizzazione del Plugin](/it/plugins/plugin-permission-requests) quando uno strumento o un hook deve chiedere approvazione dopo che il modello lo seleziona e prima che l'azione venga eseguita.

Usa strumenti opzionali per effetti collaterali, binari insoliti o funzionalità che non devono essere esposte per impostazione predefinita. I nomi degli strumenti non devono entrare in conflitto con gli strumenti core; i conflitti vengono ignorati e segnalati nella diagnostica del Plugin. Le registrazioni malformate, inclusi descrittori di strumenti senza `parameters`, vengono ignorate e segnalate nello stesso modo. Gli strumenti registrati sono funzioni tipizzate che il modello può chiamare dopo il superamento dei controlli di policy e allowlist.

Le factory degli strumenti ricevono un oggetto di contesto fornito dal runtime. Usa `ctx.activeModel` quando uno strumento deve registrare, mostrare o adattarsi al modello attivo per il turno corrente. L'oggetto può includere `provider`, `modelId` e `modelRef`. Trattalo come metadati runtime informativi, non come un confine di sicurezza contro l'operatore locale, il codice dei Plugin installati o un runtime OpenClaw modificato. Gli strumenti locali sensibili devono comunque richiedere un opt-in esplicito del Plugin o dell'operatore e fallire in modo chiuso quando i metadati del modello attivo mancano o non sono adatti.

Il manifest dichiara proprietà e discovery; l'esecuzione chiama comunque l'implementazione live dello strumento registrato. Mantieni `toolMetadata.<tool>.optional: true` allineato con `api.registerTool(..., { optional: true })` in modo che OpenClaw possa evitare di caricare quel runtime di Plugin finché lo strumento non viene esplicitamente inserito nell'allowlist.

## Convenzioni di importazione

Importa dai sottopercorsi SDK focalizzati:

```typescript
import { definePluginEntry } from "openclaw/plugin-sdk/plugin-entry";
import { createPluginRuntimeStore } from "openclaw/plugin-sdk/runtime-store";
```

Non importare dal barrel radice deprecato:

```typescript
import { definePluginEntry } from "openclaw/plugin-sdk";
```

All'interno del tuo pacchetto Plugin, usa file barrel locali come `api.ts` e `runtime-api.ts` per gli import interni. Non importare il tuo Plugin tramite un percorso SDK. Gli helper specifici del provider devono restare nel pacchetto provider, a meno che il punto di raccordo non sia davvero generico.

I metodi RPC Gateway personalizzati sono un entry point avanzato. Mantienili su un prefisso specifico del Plugin; gli spazi dei nomi di amministrazione core come `config.*`, `exec.approvals.*`, `operator.admin.*`, `wizard.*` e `update.*` restano riservati e si risolvono in `operator.admin`. Il bridge `openclaw/plugin-sdk/gateway-method-runtime` è riservato alle route HTTP dei Plugin che dichiarano `contracts.gatewayMethodDispatch: ["authenticated-request"]`.

Per la mappa completa degli import, vedi [panoramica Plugin SDK](/it/plugins/sdk-overview).

## Checklist prima dell'invio

<Check>**package.json** ha metadati `openclaw` corretti</Check>
<Check>Il manifest **openclaw.plugin.json** è presente e valido</Check>
<Check>L'entry point usa `defineChannelPluginEntry` o `definePluginEntry`</Check>
<Check>Tutti gli import usano percorsi focalizzati `plugin-sdk/<subpath>`</Check>
<Check>Gli import interni usano moduli locali, non auto-import SDK</Check>
<Check>I test passano (`pnpm test -- <bundled-plugin-root>/my-plugin/`)</Check>
<Check>`pnpm check` passa (Plugin nel repository)</Check>

## Testa rispetto alle release beta

1. Controlla i tag di rilascio GitHub su [openclaw/openclaw](https://github.com/openclaw/openclaw/releases) e iscriviti tramite `Watch` > `Releases`. I tag beta hanno un formato simile a `v2026.3.N-beta.1`. Puoi anche attivare le notifiche per l'account X ufficiale di OpenClaw [@openclaw](https://x.com/openclaw) per gli annunci di rilascio.
2. Testa il tuo plugin rispetto al tag beta non appena compare. La finestra prima della versione stabile di solito dura solo poche ore.
3. Pubblica nel thread del tuo plugin nel canale Discord `plugin-forum` dopo il test, indicando `all good` oppure cosa si è rotto. Se non hai ancora un thread, creane uno.
4. Se qualcosa si rompe, apri o aggiorna una issue intitolata `Beta blocker: <plugin-name> - <summary>` e applica l'etichetta `beta-blocker`. Inserisci il link della issue nel tuo thread.
5. Apri una PR verso `main` intitolata `fix(<plugin-id>): beta blocker - <summary>` e collega la issue sia nella PR sia nel tuo thread Discord. I contributori non possono etichettare le PR, quindi il titolo è il segnale lato PR per maintainer e automazione. I blocker con una PR vengono uniti; i blocker senza PR potrebbero comunque essere rilasciati. I maintainer monitorano questi thread durante il beta testing.
6. Il silenzio significa verde. Se perdi la finestra, è probabile che la tua correzione arrivi nel ciclo successivo.

## Passaggi successivi

<CardGroup cols={2}>
  <Card title="Channel Plugins" icon="messages-square" href="/it/plugins/sdk-channel-plugins">
    Crea un plugin per canali di messaggistica
  </Card>
  <Card title="Provider Plugins" icon="cpu" href="/it/plugins/sdk-provider-plugins">
    Crea un plugin provider di modelli
  </Card>
  <Card title="CLI Backend Plugins" icon="terminal" href="/it/plugins/cli-backend-plugins">
    Registra un backend CLI AI locale
  </Card>
  <Card title="SDK Overview" icon="book-open" href="/it/plugins/sdk-overview">
    Riferimento alla mappa di importazione e all'API di registrazione
  </Card>
  <Card title="Runtime Helpers" icon="settings" href="/it/plugins/sdk-runtime">
    TTS, ricerca, subagent tramite api.runtime
  </Card>
  <Card title="Testing" icon="test-tubes" href="/it/plugins/sdk-testing">
    Utilità e pattern di test
  </Card>
  <Card title="Plugin Manifest" icon="file-json" href="/it/plugins/manifest">
    Riferimento completo allo schema del manifest
  </Card>
</CardGroup>

## Correlati

- [Hook dei Plugin](/it/plugins/hooks)
- [Architettura dei Plugin](/it/plugins/architecture)
