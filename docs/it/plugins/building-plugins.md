---
doc-schema-version: 1
read_when:
    - Si desidera creare un nuovo plugin OpenClaw
    - Serve una guida rapida per lo sviluppo di plugin
    - Si sta scegliendo tra la documentazione relativa a canali, provider, backend CLI, strumenti o hook
sidebarTitle: Getting Started
summary: Crea il tuo primo plugin OpenClaw in pochi minuti
title: Creazione di Plugin
x-i18n:
    generated_at: "2026-07-16T14:35:50Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 0d64d455c260f4aa85affc6160233a91c45237f17a6a87cb35e2c2a77f2e3cc1
    source_path: plugins/building-plugins.md
    workflow: 16
---

I Plugin estendono OpenClaw senza modificare il core. Un Plugin può aggiungere un
canale di messaggistica, un provider di modelli, un backend CLI locale, uno strumento dell'agente, un hook, un provider multimediale
o un'altra funzionalità di proprietà del Plugin.

Non è necessario aggiungere un Plugin esterno al repository OpenClaw. Pubblicare
il pacchetto su [ClawHub](/clawhub); gli utenti lo installano con:

```bash
openclaw plugins install clawhub:<package-name>
```

Durante la transizione del lancio, le specifiche dei pacchetti senza prefisso vengono ancora installate da npm. Usare il
prefisso `clawhub:` quando si desidera la risoluzione tramite ClawHub.

## Requisiti

- Node 22.22.3+, Node 24.15+ o Node 25.9+ e `npm` o `pnpm`.
- Moduli TypeScript ESM.
- Per lavorare sui Plugin inclusi nel repository, clonare il repository ed eseguire `pnpm install`.
  Lo sviluppo dei Plugin dal checkout dei sorgenti supporta solo pnpm perché OpenClaw rileva
  i Plugin inclusi dai pacchetti dell'area di lavoro `extensions/*`.

## Scegliere la struttura del Plugin

<CardGroup cols={2}>
  <Card title="Plugin per canali" icon="messages-square" href="/it/plugins/sdk-channel-plugins">
    Connettere OpenClaw a una piattaforma di messaggistica.
  </Card>
  <Card title="Plugin provider" icon="cpu" href="/it/plugins/sdk-provider-plugins">
    Aggiungere un provider di modelli, contenuti multimediali, ricerca, recupero, sintesi vocale o comunicazione in tempo reale.
  </Card>
  <Card title="Plugin backend CLI" icon="terminal" href="/it/plugins/cli-backend-plugins">
    Eseguire una CLI di IA locale tramite il fallback dei modelli OpenClaw.
  </Card>
  <Card title="Plugin per strumenti" icon="wrench" href="/it/plugins/tool-plugins">
    Registrare gli strumenti dell'agente.
  </Card>
</CardGroup>

## Avvio rapido

Creare un Plugin per strumenti minimale registrando un solo strumento obbligatorio dell'agente. Questa è la
struttura di Plugin utile più semplice e comprende il pacchetto, il manifesto, il punto di ingresso e
la verifica locale.

<Steps>
  <Step title="Creare i metadati del pacchetto">
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

    I Plugin esterni pubblicati devono indirizzare le voci di runtime ai file JavaScript
    compilati. Consultare [Punti di ingresso dell'SDK](/it/plugins/sdk-entrypoints) per il contratto completo dei
    punti di ingresso.

    Ogni Plugin necessita di un manifesto, anche in assenza di configurazione. Gli strumenti di runtime devono
    comparire in `contracts.tools` affinché OpenClaw possa rilevarne la proprietà senza
    caricare preventivamente ogni runtime dei Plugin. Impostare `activation.onStartup`
    intenzionalmente; questo esempio viene caricato all'avvio del Gateway.

    Anche le superfici dei Plugin considerate attendibili dall'host sono controllate dal manifesto e richiedono una
    dichiarazione esplicita per i Plugin installati: `api.registerAgentToolResultMiddleware(...)`
    richiede che ogni runtime di destinazione sia elencato in `contracts.agentToolResultMiddleware`,
    mentre `api.registerTrustedToolPolicy(...)` richiede ogni ID di criterio in
    `contracts.trustedToolPolicies`. Queste dichiarazioni mantengono allineate
    l'ispezione al momento dell'installazione e la registrazione in fase di runtime.

    Per tutti i campi del manifesto, consultare [Manifesto del Plugin](/it/plugins/manifest).

  </Step>

  <Step title="Registrare lo strumento">
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

    Usare `definePluginEntry` per i Plugin non destinati ai canali. I Plugin per canali usano invece
    `defineChannelPluginEntry` da `openclaw/plugin-sdk/core`.

  </Step>

  <Step title="Testare il runtime">
    Per un Plugin installato o esterno, esaminare il runtime caricato:

    ```bash
    openclaw plugins inspect my-plugin --runtime --json
    ```

    Se il Plugin registra un comando CLI, eseguire anche tale comando e verificarne
    l'output, ad esempio `openclaw demo-plugin ping`.

    Per un Plugin incluso in questo repository, OpenClaw rileva i pacchetti dei Plugin
    dal checkout dei sorgenti nell'area di lavoro `extensions/*`. Eseguire il test mirato
    più pertinente:

    ```bash
    pnpm test extensions/my-plugin/
    pnpm check
    ```

  </Step>

  <Step title="Testare l'installazione del pacchetto">
    Prima di pubblicare un Plugin pronto per essere distribuito come pacchetto, testare la stessa modalità di installazione che
    riceveranno gli utenti. Aggiungere innanzitutto un passaggio di compilazione, indirizzare le voci di runtime come
    `openclaw.extensions` al JavaScript compilato, ad esempio `./dist/index.js`, e assicurarsi
    che `npm pack` includa tale output `dist/`. Le voci dei sorgenti TypeScript sono
    destinate esclusivamente ai checkout dei sorgenti e ai percorsi di sviluppo locale.

    Quindi creare il pacchetto del Plugin e installare il tarball con `npm-pack:`:

    ```bash
    npm pack --pack-destination /tmp
    openclaw plugins install npm-pack:/tmp/<plugin-package>.tgz --force
    openclaw plugins inspect my-plugin --runtime --json
    ```

    `npm-pack:` usa il progetto npm per singolo Plugin gestito da OpenClaw, quindi rileva
    gli errori nelle dipendenze di runtime che i test dal checkout dei sorgenti possono nascondere. Dimostra
    la struttura del pacchetto e delle dipendenze, non l'attendibilità ufficiale collegata al catalogo.
    Le importazioni di runtime devono trovarsi in `dependencies` o `optionalDependencies`;
    le dipendenze presenti soltanto in `devDependencies` non verranno installate per il
    progetto di runtime gestito.

    Non usare l'installazione diretta da archivio o percorso come verifica finale del comportamento
    ufficiale o privilegiato di un Plugin. I sorgenti diretti sono utili per il debug locale, ma
    non dimostrano lo stesso percorso delle dipendenze delle installazioni tramite npm o ClawHub. Se
    il Plugin si basa sullo stato di Plugin ufficiale attendibile, aggiungere una seconda verifica
    tramite un'installazione ufficiale supportata dal catalogo o un percorso di pacchetto pubblicato che
    registri l'attendibilità ufficiale. Consultare
    [Risoluzione delle dipendenze dei Plugin](/it/plugins/dependency-resolution) per
    i dettagli sulla radice di installazione e sulla proprietà delle dipendenze.

  </Step>

  <Step title="Pubblicare">
    Convalidare il pacchetto prima della pubblicazione:

    ```bash
    clawhub package publish your-org/your-plugin --dry-run
    clawhub package publish your-org/your-plugin
    ```

    I frammenti canonici dei pacchetti ClawHub si trovano in `docs/snippets/plugin-publish/`.

  </Step>

  <Step title="Installare">
    Installare il pacchetto pubblicato tramite ClawHub:

    ```bash
    openclaw plugins install clawhub:your-org/your-plugin
    ```

  </Step>
</Steps>

<a id="registering-agent-tools"></a>

## Registrazione degli strumenti

Gli strumenti possono essere obbligatori o facoltativi. Gli strumenti obbligatori sono sempre disponibili quando il
Plugin è abilitato. Gli strumenti facoltativi richiedono il consenso esplicito dell'utente prima che OpenClaw
carichi il runtime del Plugin proprietario.

Le factory degli strumenti ricevono un contesto di runtime attendibile, che include `deliveryContext`,
`nativeChannelId` per la conversazione attiva sulla piattaforma, quando disponibile, e
`requesterSenderId`.

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

Gli utenti forniscono il consenso tramite `tools.allow`:

```json5
{
  tools: { allow: ["workflow_tool"] }, // or ["my-plugin"] for every tool from one plugin
}
```

Gli strumenti facoltativi controllano se uno strumento viene esposto al modello. Usare le
[richieste di autorizzazione dei Plugin](/it/plugins/plugin-permission-requests) quando uno strumento
o un hook deve richiedere l'approvazione dopo che il modello lo ha selezionato e prima
dell'esecuzione dell'azione.

Usare strumenti facoltativi per gli effetti collaterali, i file binari insoliti o le funzionalità che
non devono essere esposte per impostazione predefinita. I nomi degli strumenti non devono entrare in conflitto con quelli degli strumenti
del core; i conflitti vengono ignorati e segnalati nella diagnostica dei Plugin. Le registrazioni
non valide vengono ignorate e segnalate allo stesso modo: un `name` non vuoto mancante,
un `execute` che non è una funzione o un descrittore di strumento privo di un oggetto `parameters`.

Le factory degli strumenti ricevono un oggetto di contesto fornito dal runtime. Usare `ctx.activeModel`
quando uno strumento deve registrare, mostrare o adattarsi al modello attivo per il turno
corrente; può includere `provider`, `modelId` e `modelRef`. Considerarlo
un metadato informativo di runtime, non un confine di sicurezza rispetto all'operatore
locale, al codice dei Plugin installati o a un runtime OpenClaw modificato. Gli strumenti
locali sensibili devono comunque richiedere il consenso esplicito del Plugin o dell'operatore e
interrompersi in sicurezza quando i metadati del modello attivo sono mancanti o inadeguati.

Il manifesto dichiara la proprietà e il rilevamento; l'esecuzione richiama comunque l'implementazione
dello strumento registrato e attivo. Mantenere `toolMetadata.<tool>.optional: true`
allineato con `api.registerTool(..., { optional: true })` affinché OpenClaw possa evitare
di caricare il runtime di tale Plugin finché lo strumento non viene esplicitamente inserito nell'elenco consentito.

## Convenzioni di importazione

Importare da sottopercorsi specifici dell'SDK:

```typescript
import { definePluginEntry } from "openclaw/plugin-sdk/plugin-entry";
import { createPluginRuntimeStore } from "openclaw/plugin-sdk/runtime-store";
```

Non importare dal barrel radice deprecato:

```typescript
import { definePluginEntry } from "openclaw/plugin-sdk";
```

All'interno del pacchetto del Plugin, usare file barrel locali come `api.ts` e
`runtime-api.ts` per le importazioni interne. Non importare il proprio Plugin tramite un
percorso dell'SDK. Gli helper specifici dei provider devono rimanere nel pacchetto del provider, a meno che
l'interfaccia non sia realmente generica.

I metodi RPC personalizzati del Gateway costituiscono un punto di ingresso avanzato. Mantenerli su un
prefisso specifico del Plugin; gli spazi dei nomi amministrativi del core come `config.*`,
`exec.approvals.*`, `operator.admin.*`, `wizard.*` e `update.*` rimangono riservati
e vengono risolti in `operator.admin`. Il bridge
`openclaw/plugin-sdk/gateway-method-runtime` è riservato alle route HTTP dei Plugin
che dichiarano `contracts.gatewayMethodDispatch: ["authenticated-request"]`.

Per la mappa completa delle importazioni, consultare [Panoramica dell'SDK per Plugin](/it/plugins/sdk-overview).

## Elenco di controllo prima dell'invio

<Check>**package.json** contiene i metadati `openclaw` corretti</Check>
<Check>Il manifesto **openclaw.plugin.json** è presente e valido</Check>
<Check>Il punto di ingresso usa `defineChannelPluginEntry` o `definePluginEntry`</Check>
<Check>Tutte le importazioni usano percorsi `plugin-sdk/<subpath>` specifici</Check>
<Check>Le importazioni interne usano moduli locali, non autoimportazioni dell'SDK</Check>
<Check>I test vengono superati (`pnpm test <bundled-plugin-root>/my-plugin/`)</Check>
<Check>`pnpm check` viene superato (Plugin nel repository)</Check>

## Test con le versioni beta

1. Monitora le release di [openclaw/openclaw](https://github.com/openclaw/openclaw/releases) (`Watch` > `Releases`). I tag beta hanno un formato simile a `v2026.3.N-beta.1`. È inoltre possibile seguire [@openclaw](https://x.com/openclaw) su X per gli annunci delle release.
2. Testa il proprio Plugin con il tag beta non appena viene pubblicato. La finestra che precede la versione stabile è in genere di sole poche ore.
3. Dopo il test, pubblica un messaggio nel thread del proprio Plugin nel canale Discord `plugin-forum` ([discord.gg/clawd](https://discord.gg/clawd)), indicando `all good` oppure ciò che non ha funzionato. Se non esiste ancora un thread, creane uno.
4. Se qualcosa non funziona, apri o aggiorna una segnalazione intitolata `Beta blocker: <plugin-name> - <summary>` e applica l'etichetta `beta-blocker`. Inserisci il link alla segnalazione nel proprio thread.
5. Apri una PR per `main` intitolata `fix(<plugin-id>): beta blocker - <summary>` e inserisci il link alla segnalazione sia nella PR sia nel proprio thread Discord. I contributori non possono applicare etichette alle PR, quindi il titolo costituisce il segnale lato PR per i maintainer e l'automazione. I problemi bloccanti con una PR vengono risolti tramite merge; quelli senza PR potrebbero comunque essere inclusi nella release.
6. Il silenzio indica che è tutto a posto. Se non si interviene entro questa finestra, in genere la correzione viene inclusa nel ciclo successivo.

## Passaggi successivi

<CardGroup cols={2}>
  <Card title="Plugin per canali" icon="messages-square" href="/it/plugins/sdk-channel-plugins">
    Crea un Plugin per un canale di messaggistica
  </Card>
  <Card title="Plugin per provider" icon="cpu" href="/it/plugins/sdk-provider-plugins">
    Crea un Plugin per un provider di modelli
  </Card>
  <Card title="Plugin per backend CLI" icon="terminal" href="/it/plugins/cli-backend-plugins">
    Registra un backend CLI locale per l'IA
  </Card>
  <Card title="Panoramica dell'SDK" icon="book-open" href="/it/plugins/sdk-overview">
    Riferimento per la mappa delle importazioni e l'API di registrazione
  </Card>
  <Card title="Helper di runtime" icon="settings" href="/it/plugins/sdk-runtime">
    TTS, ricerca e sottoagente tramite api.runtime
  </Card>
  <Card title="Test" icon="test-tubes" href="/it/plugins/sdk-testing">
    Utilità e modelli per i test
  </Card>
  <Card title="Manifest del Plugin" icon="file-json" href="/it/plugins/manifest">
    Riferimento completo dello schema del manifest
  </Card>
</CardGroup>

## Contenuti correlati

- [Hook dei Plugin](/it/plugins/hooks)
- [Architettura dei Plugin](/it/plugins/architecture)
