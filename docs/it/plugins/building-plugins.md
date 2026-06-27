---
doc-schema-version: 1
read_when:
    - Vuoi creare un nuovo plugin OpenClaw
    - Ti serve una guida rapida per lo sviluppo di Plugin
    - Stai scegliendo tra la documentazione di canale, provider, backend CLI, strumento o hook
sidebarTitle: Getting Started
summary: Crea il tuo primo Plugin OpenClaw in pochi minuti
title: Creazione di plugin
x-i18n:
    generated_at: "2026-06-27T17:46:48Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 8991b9e857af76b4fecc15a5feb9bd6659af91a4b7518f59c83ca091dc7f705c
    source_path: plugins/building-plugins.md
    workflow: 16
---

I Plugin estendono OpenClaw senza modificare il core. Un Plugin può aggiungere un
canale di messaggistica, un provider di modelli, un backend CLI locale, uno
strumento agente, un hook, un provider multimediale o un'altra capacità di
proprietà del Plugin.

Non è necessario aggiungere un Plugin esterno al repository OpenClaw. Pubblica
il pacchetto su [ClawHub](/it/clawhub) e gli utenti lo installano con:

```bash
openclaw plugins install clawhub:<package-name>
```

Le specifiche di pacchetto bare continuano a essere installate da npm durante la
transizione di lancio. Usa il prefisso `clawhub:` quando vuoi la risoluzione di
ClawHub.

## Requisiti

- Usa Node 22.19 o versione successiva e un package manager come `npm` o `pnpm`.
- Conosci i moduli TypeScript ESM.
- Per lavorare su Plugin in-repo inclusi nel bundle, clona il repository ed esegui `pnpm install`.
  Lo sviluppo di Plugin da checkout sorgente usa solo pnpm perché OpenClaw carica
  i Plugin inclusi nel bundle dai pacchetti workspace `extensions/*`.

## Scegli la forma del Plugin

<CardGroup cols={2}>
  <Card title="Channel plugin" icon="messages-square" href="/it/plugins/sdk-channel-plugins">
    Collega OpenClaw a una piattaforma di messaggistica.
  </Card>
  <Card title="Provider plugin" icon="cpu" href="/it/plugins/sdk-provider-plugins">
    Aggiungi un provider di modelli, contenuti multimediali, ricerca, fetch, voce o realtime.
  </Card>
  <Card title="CLI backend plugin" icon="terminal" href="/it/plugins/cli-backend-plugins">
    Esegui una CLI AI locale tramite il fallback dei modelli OpenClaw.
  </Card>
  <Card title="Tool plugin" icon="wrench" href="/it/plugins/tool-plugins">
    Registra strumenti agente.
  </Card>
</CardGroup>

## Quickstart

Crea un Plugin strumento minimo registrando uno strumento agente obbligatorio. Questa è la
forma di Plugin utile più breve e mostra pacchetto, manifesto, entry point e
prova locale.

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

    I Plugin esterni pubblicati devono puntare le entry runtime a file JavaScript
    compilati. Consulta [entry point SDK](/it/plugins/sdk-entrypoints) per il contratto
    completo degli entry point.

    Ogni Plugin richiede un manifesto, anche quando non ha configurazione. Gli strumenti
    runtime devono comparire in `contracts.tools` così OpenClaw può scoprire la proprietà
    senza caricare anticipatamente ogni runtime Plugin. Imposta `activation.onStartup`
    intenzionalmente. Questo esempio si avvia all'avvio del Gateway.

    Anche le superfici Plugin considerate attendibili dall'host sono vincolate dal manifesto e richiedono
    un'abilitazione esplicita per i Plugin installati. Se un Plugin installato registra
    `api.registerAgentToolResultMiddleware(...)`, dichiara ogni runtime target in
    `contracts.agentToolResultMiddleware`. Se registra
    `api.registerTrustedToolPolicy(...)`, dichiara ogni ID di policy in
    `contracts.trustedToolPolicies`. Queste dichiarazioni mantengono allineate
    l'ispezione in fase di installazione e la registrazione runtime.

    Per ogni campo del manifesto, consulta [manifesto Plugin](/it/plugins/manifest).

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

    Usa `definePluginEntry` per i Plugin non canale. I Plugin canale usano
    `defineChannelPluginEntry`.

  </Step>

  <Step title="Test the runtime">
    Per un Plugin installato o esterno, ispeziona il runtime caricato:

    ```bash
    openclaw plugins inspect my-plugin --runtime --json
    ```

    Se il Plugin registra un comando CLI, esegui anche quel comando. Per esempio,
    un comando demo deve avere una prova di esecuzione come
    `openclaw demo-plugin ping`.

    Per un Plugin incluso nel bundle in questo repository, OpenClaw scopre i pacchetti
    Plugin da checkout sorgente dal workspace `extensions/*`. Esegui il test mirato
    più vicino:

    ```bash
    pnpm test -- extensions/my-plugin/
    pnpm check
    ```

  </Step>

  <Step title="Publish">
    Valida il pacchetto prima della pubblicazione:

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

## Registrazione degli strumenti

Gli strumenti possono essere obbligatori o facoltativi. Gli strumenti obbligatori sono sempre disponibili quando il
Plugin è abilitato. Gli strumenti facoltativi richiedono l'opt-in dell'utente.

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

Ogni strumento registrato con `api.registerTool(...)` deve essere dichiarato anche nel
manifesto del Plugin:

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

Gli strumenti facoltativi controllano se uno strumento viene esposto al modello. Usa
[richieste di autorizzazione Plugin](/it/plugins/plugin-permission-requests) quando uno strumento
o un hook deve chiedere approvazione dopo che il modello lo seleziona e prima che
l'azione venga eseguita.

Usa strumenti facoltativi per effetti collaterali, binari insoliti o capacità che
non devono essere esposte per impostazione predefinita. I nomi degli strumenti non devono entrare in conflitto con gli strumenti core;
i conflitti vengono ignorati e segnalati nella diagnostica dei Plugin. Le registrazioni
non valide, inclusi i descrittori di strumenti senza `parameters`, vengono ignorate e
segnalate allo stesso modo. Gli strumenti registrati sono funzioni tipizzate che il modello può chiamare
dopo il superamento dei controlli di policy e allowlist.

Le factory degli strumenti ricevono un oggetto contesto fornito dal runtime. Usa `ctx.activeModel`
quando uno strumento deve registrare, mostrare o adattarsi al modello attivo per il turno
corrente. L'oggetto può includere `provider`, `modelId` e `modelRef`. Trattalo come
metadati runtime informativi, non come un perimetro di sicurezza rispetto all'operatore
locale, al codice Plugin installato o a un runtime OpenClaw modificato. Gli strumenti locali
sensibili devono comunque richiedere un opt-in esplicito del Plugin o dell'operatore e fallire in modo chiuso
quando i metadati del modello attivo sono mancanti o non adatti.

Il manifesto dichiara proprietà e discovery; l'esecuzione chiama comunque
l'implementazione live dello strumento registrato. Mantieni `toolMetadata.<tool>.optional: true`
allineato con `api.registerTool(..., { optional: true })` così OpenClaw può evitare
di caricare quel runtime Plugin finché lo strumento non viene esplicitamente inserito nell'allowlist.

## Convenzioni di importazione

Importa da sottopercorsi SDK mirati:

```typescript
import { definePluginEntry } from "openclaw/plugin-sdk/plugin-entry";
import { createPluginRuntimeStore } from "openclaw/plugin-sdk/runtime-store";
```

Non importare dal barrel root deprecato:

```typescript
import { definePluginEntry } from "openclaw/plugin-sdk";
```

All'interno del pacchetto Plugin, usa file barrel locali come `api.ts` e
`runtime-api.ts` per gli import interni. Non importare il tuo Plugin tramite un
percorso SDK. Gli helper specifici del provider devono rimanere nel pacchetto provider, salvo che
il punto di integrazione sia davvero generico.

I metodi RPC Gateway personalizzati sono un entry point avanzato. Mantienili su un
prefisso specifico del Plugin; i namespace amministrativi core come `config.*`,
`exec.approvals.*`, `operator.admin.*`, `wizard.*` e `update.*` restano riservati
e si risolvono in `operator.admin`. Il bridge
`openclaw/plugin-sdk/gateway-method-runtime` è riservato alle route HTTP Plugin
che dichiarano `contracts.gatewayMethodDispatch: ["authenticated-request"]`.

Per la mappa completa degli import, consulta [panoramica SDK Plugin](/it/plugins/sdk-overview).

## Checklist pre-invio

<Check>**package.json** contiene metadati `openclaw` corretti</Check>
<Check>Il manifesto **openclaw.plugin.json** è presente e valido</Check>
<Check>L'entry point usa `defineChannelPluginEntry` o `definePluginEntry`</Check>
<Check>Tutti gli import usano percorsi mirati `plugin-sdk/<subpath>`</Check>
<Check>Gli import interni usano moduli locali, non auto-import SDK</Check>
<Check>I test passano (`pnpm test -- <bundled-plugin-root>/my-plugin/`)</Check>
<Check>`pnpm check` passa (Plugin in-repo)</Check>

## Test rispetto alle release beta

1. Monitora i tag di release GitHub su [openclaw/openclaw](https://github.com/openclaw/openclaw/releases) e iscriviti tramite `Watch` > `Releases`. I tag beta hanno un aspetto come `v2026.3.N-beta.1`. Puoi anche attivare le notifiche per l'account X ufficiale di OpenClaw [@openclaw](https://x.com/openclaw) per gli annunci di release.
2. Testa il tuo Plugin rispetto al tag beta non appena compare. La finestra prima della stabile è in genere di poche ore.
3. Pubblica nel thread del tuo Plugin nel canale Discord `plugin-forum` dopo il test, con `all good` oppure con ciò che si è rotto. Se non hai ancora un thread, creane uno.
4. Se qualcosa si rompe, apri o aggiorna una issue intitolata `Beta blocker: <plugin-name> - <summary>` e applica l'etichetta `beta-blocker`. Inserisci il link alla issue nel tuo thread.
5. Apri una PR verso `main` intitolata `fix(<plugin-id>): beta blocker - <summary>` e collega la issue sia nella PR sia nel tuo thread Discord. I contributor non possono etichettare le PR, quindi il titolo è il segnale lato PR per maintainer e automazione. I blocker con una PR vengono uniti; quelli senza potrebbero comunque essere rilasciati. I maintainer monitorano questi thread durante il beta testing.
6. Il silenzio significa verde. Se perdi la finestra, la tua correzione probabilmente arriverà nel ciclo successivo.

## Prossimi passi

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
    TTS, ricerca, subagente tramite api.runtime
  </Card>
  <Card title="Testing" icon="test-tubes" href="/it/plugins/sdk-testing">
    Utilità e pattern di test
  </Card>
  <Card title="Plugin Manifest" icon="file-json" href="/it/plugins/manifest">
    Riferimento completo dello schema del manifesto
  </Card>
</CardGroup>

## Correlati

- [Hook Plugin](/it/plugins/hooks)
- [Architettura Plugin](/it/plugins/architecture)
