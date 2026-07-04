---
doc-schema-version: 1
read_when:
    - Vuoi creare un nuovo plugin OpenClaw
    - Ti serve una guida rapida per lo sviluppo di Plugin
    - Stai scegliendo tra la documentazione di canale, provider, backend CLI, strumento o hook
sidebarTitle: Getting Started
summary: Crea il tuo primo Plugin OpenClaw in pochi minuti
title: Creazione di Plugin
x-i18n:
    generated_at: "2026-07-04T10:44:37Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 2b5ad271e6a985c3bc8a5a39cfd540af1d8566178fb235fca0e29e4cee083148
    source_path: plugins/building-plugins.md
    workflow: 16
---

I Plugin estendono OpenClaw senza modificare il core. Un Plugin può aggiungere un canale di messaggistica, un provider di modelli, un backend CLI locale, uno strumento per agenti, un hook, un provider multimediale o un'altra funzionalità di proprietà del Plugin.

Non devi aggiungere un Plugin esterno al repository OpenClaw. Pubblica il pacchetto su [ClawHub](/it/clawhub) e gli utenti lo installano con:

```bash
openclaw plugins install clawhub:<package-name>
```

Le specifiche dei pacchetti senza prefisso continuano a installare da npm durante la transizione del lancio. Usa il prefisso `clawhub:` quando vuoi la risoluzione tramite ClawHub.

## Requisiti

- Usa Node 22.19+, Node 23.11+ o Node 24+ e un gestore di pacchetti come `npm` o `pnpm`.
- Acquisisci familiarità con i moduli TypeScript ESM.
- Per il lavoro su Plugin in-repo inclusi, clona il repository ed esegui `pnpm install`.
  Lo sviluppo di Plugin da checkout del sorgente è solo pnpm perché OpenClaw carica i Plugin inclusi dai pacchetti workspace `extensions/*`.

## Scegli la forma del Plugin

<CardGroup cols={2}>
  <Card title="Channel plugin" icon="messages-square" href="/it/plugins/sdk-channel-plugins">
    Collega OpenClaw a una piattaforma di messaggistica.
  </Card>
  <Card title="Provider plugin" icon="cpu" href="/it/plugins/sdk-provider-plugins">
    Aggiungi un provider di modelli, media, ricerca, fetch, voce o realtime.
  </Card>
  <Card title="CLI backend plugin" icon="terminal" href="/it/plugins/cli-backend-plugins">
    Esegui una CLI AI locale tramite il fallback dei modelli OpenClaw.
  </Card>
  <Card title="Tool plugin" icon="wrench" href="/it/plugins/tool-plugins">
    Registra strumenti per agenti.
  </Card>
</CardGroup>

## Avvio rapido

Crea un Plugin di strumenti minimale registrando uno strumento agente obbligatorio. Questa è la forma di Plugin utile più breve e mostra pacchetto, manifest, entry point e prova locale.

<Steps>
  <Step title="Create package metadata">
    <CodeGroup>

```json package.json
{
  "name": "@myorg/openclaw-my-plugin",
  "version": "1.0.0",
  "type": "module",
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

    I Plugin esterni pubblicati devono puntare le voci runtime a file JavaScript compilati. Consulta [entry point SDK](/it/plugins/sdk-entrypoints) per il contratto completo degli entry point.

    Ogni Plugin richiede un manifest, anche quando non ha configurazione. Gli strumenti runtime devono comparire in `contracts.tools` così OpenClaw può scoprire la proprietà senza caricare anticipatamente ogni runtime di Plugin. Imposta `activation.onStartup` intenzionalmente. Questo esempio si avvia all'avvio del Gateway.

    Anche le superfici di Plugin attendibili dall'host sono controllate dal manifest e richiedono l'abilitazione esplicita per i Plugin installati. Se un Plugin installato registra `api.registerAgentToolResultMiddleware(...)`, dichiara ogni runtime di destinazione in `contracts.agentToolResultMiddleware`. Se registra `api.registerTrustedToolPolicy(...)`, dichiara ogni ID di policy in `contracts.trustedToolPolicies`. Queste dichiarazioni mantengono allineate l'ispezione al momento dell'installazione e la registrazione runtime.

    Per ogni campo del manifest, consulta [manifest del Plugin](/it/plugins/manifest).

  </Step>

  <Step title="Register the tool">
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

  <Step title="Test the runtime">
    Per un Plugin installato o esterno, ispeziona il runtime caricato:

    ```bash
    openclaw plugins inspect my-plugin --runtime --json
    ```

    Se il Plugin registra un comando CLI, esegui anche quel comando. Per esempio, un comando demo dovrebbe avere una prova di esecuzione come `openclaw demo-plugin ping`.

    Per un Plugin incluso in questo repository, OpenClaw scopre i pacchetti Plugin da checkout del sorgente dal workspace `extensions/*`. Esegui il test mirato più vicino:

    ```bash
    pnpm test -- extensions/my-plugin/
    pnpm check
    ```

  </Step>

  <Step title="Publish">
    Convalida il pacchetto prima della pubblicazione:

    ```bash
    clawhub package publish your-org/your-plugin --dry-run
    clawhub package publish your-org/your-plugin
    ```

    Gli snippet canonici di ClawHub si trovano in `docs/snippets/plugin-publish/`.

  </Step>

  <Step title="Install">
    Installa il pacchetto pubblicato tramite ClawHub:

    ```bash
    openclaw plugins install clawhub:your-org/your-plugin
    ```

  </Step>
</Steps>

<a id="registering-agent-tools"></a>

## Registrare strumenti

Gli strumenti possono essere obbligatori o facoltativi. Gli strumenti obbligatori sono sempre disponibili quando il Plugin è abilitato. Gli strumenti facoltativi richiedono l'adesione dell'utente.

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

Ogni strumento registrato con `api.registerTool(...)` deve essere dichiarato anche nel manifest del Plugin:

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

Gli utenti aderiscono con `tools.allow`:

```json5
{
  tools: { allow: ["workflow_tool"] }, // or ["my-plugin"] for all tools from one plugin
}
```

Gli strumenti facoltativi controllano se uno strumento viene esposto al modello. Usa le [richieste di autorizzazione dei Plugin](/it/plugins/plugin-permission-requests) quando uno strumento o un hook deve chiedere approvazione dopo che il modello lo seleziona e prima che l'azione venga eseguita.

Usa strumenti facoltativi per effetti collaterali, binari insoliti o funzionalità che non dovrebbero essere esposte per impostazione predefinita. I nomi degli strumenti non devono entrare in conflitto con gli strumenti core; i conflitti vengono saltati e segnalati nella diagnostica dei Plugin. Le registrazioni malformate, inclusi i descrittori di strumenti senza `parameters`, vengono saltate e segnalate allo stesso modo. Gli strumenti registrati sono funzioni tipizzate che il modello può chiamare dopo il superamento dei controlli di policy e allowlist.

Le factory degli strumenti ricevono un oggetto contesto fornito dal runtime. Usa `ctx.activeModel` quando uno strumento deve registrare, mostrare o adattarsi al modello attivo per il turno corrente. L'oggetto può includere `provider`, `modelId` e `modelRef`. Trattalo come metadati runtime informativi, non come un confine di sicurezza rispetto all'operatore locale, al codice del Plugin installato o a un runtime OpenClaw modificato. Gli strumenti locali sensibili dovrebbero comunque richiedere un'adesione esplicita del Plugin o dell'operatore e fallire in modo chiuso quando i metadati del modello attivo sono mancanti o non adatti.

Il manifest dichiara proprietà e scoperta; l'esecuzione chiama comunque l'implementazione live dello strumento registrato. Mantieni `toolMetadata.<tool>.optional: true` allineato con `api.registerTool(..., { optional: true })` così OpenClaw può evitare di caricare quel runtime di Plugin finché lo strumento non viene esplicitamente inserito nell'allowlist.

## Convenzioni di import

Importa dai sottopercorsi SDK mirati:

```typescript
import { definePluginEntry } from "openclaw/plugin-sdk/plugin-entry";
import { createPluginRuntimeStore } from "openclaw/plugin-sdk/runtime-store";
```

Non importare dal barrel root deprecato:

```typescript
import { definePluginEntry } from "openclaw/plugin-sdk";
```

All'interno del tuo pacchetto Plugin, usa file barrel locali come `api.ts` e `runtime-api.ts` per gli import interni. Non importare il tuo Plugin tramite un percorso SDK. Gli helper specifici del provider devono restare nel pacchetto del provider a meno che l'interfaccia non sia davvero generica.

I metodi RPC Gateway personalizzati sono un entry point avanzato. Mantienili su un prefisso specifico del Plugin; i namespace di amministrazione core come `config.*`, `exec.approvals.*`, `operator.admin.*`, `wizard.*` e `update.*` restano riservati e si risolvono in `operator.admin`. Il bridge `openclaw/plugin-sdk/gateway-method-runtime` è riservato alle route HTTP dei Plugin che dichiarano `contracts.gatewayMethodDispatch: ["authenticated-request"]`.

Per la mappa completa degli import, consulta la [panoramica SDK dei Plugin](/it/plugins/sdk-overview).

## Checklist prima dell'invio

<Check>**package.json** contiene i metadati `openclaw` corretti</Check>
<Check>Il manifest **openclaw.plugin.json** è presente e valido</Check>
<Check>L'entry point usa `defineChannelPluginEntry` o `definePluginEntry`</Check>
<Check>Tutti gli import usano percorsi mirati `plugin-sdk/<subpath>`</Check>
<Check>Gli import interni usano moduli locali, non auto-import SDK</Check>
<Check>I test passano (`pnpm test -- <bundled-plugin-root>/my-plugin/`)</Check>
<Check>`pnpm check` passa (Plugin in-repo)</Check>

## Testare rispetto alle release beta

1. Monitora i tag di release GitHub su [openclaw/openclaw](https://github.com/openclaw/openclaw/releases) e iscriviti tramite `Watch` > `Releases`. I tag beta hanno un formato simile a `v2026.3.N-beta.1`. Puoi anche attivare le notifiche per l'account X ufficiale di OpenClaw [@openclaw](https://x.com/openclaw) per gli annunci di release.
2. Testa il tuo Plugin rispetto al tag beta appena appare. La finestra prima della stabile è in genere di poche ore.
3. Pubblica nel thread del tuo Plugin nel canale Discord `plugin-forum` dopo il test con `all good` oppure con ciò che si è rotto. Se non hai ancora un thread, creane uno.
4. Se qualcosa si rompe, apri o aggiorna una issue intitolata `Beta blocker: <plugin-name> - <summary>` e applica l'etichetta `beta-blocker`. Inserisci il link della issue nel tuo thread.
5. Apri una PR verso `main` intitolata `fix(<plugin-id>): beta blocker - <summary>` e collega la issue sia nella PR sia nel tuo thread Discord. I contributori non possono etichettare le PR, quindi il titolo è il segnale lato PR per manutentori e automazione. I blocker con una PR vengono uniti; quelli senza potrebbero comunque essere rilasciati. I manutentori monitorano questi thread durante i test beta.
6. Il silenzio significa verde. Se perdi la finestra, la tua correzione probabilmente arriva nel ciclo successivo.

## Passaggi successivi

<CardGroup cols={2}>
  <Card title="Channel Plugins" icon="messages-square" href="/it/plugins/sdk-channel-plugins">
    Crea un Plugin di canale di messaggistica
  </Card>
  <Card title="Provider Plugins" icon="cpu" href="/it/plugins/sdk-provider-plugins">
    Crea un Plugin provider di modelli
  </Card>
  <Card title="CLI Backend Plugins" icon="terminal" href="/it/plugins/cli-backend-plugins">
    Registra un backend CLI AI locale
  </Card>
  <Card title="SDK Overview" icon="book-open" href="/it/plugins/sdk-overview">
    Mappa degli import e riferimento API di registrazione
  </Card>
  <Card title="Runtime Helpers" icon="settings" href="/it/plugins/sdk-runtime">
    TTS, ricerca, subagent tramite api.runtime
  </Card>
  <Card title="Testing" icon="test-tubes" href="/it/plugins/sdk-testing">
    Utilità e pattern di test
  </Card>
  <Card title="Plugin Manifest" icon="file-json" href="/it/plugins/manifest">
    Riferimento completo dello schema del manifest
  </Card>
</CardGroup>

## Correlati

- [Hook dei Plugin](/it/plugins/hooks)
- [Architettura dei Plugin](/it/plugins/architecture)
