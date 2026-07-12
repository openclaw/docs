---
doc-schema-version: 1
read_when:
    - Vuoi creare un nuovo plugin OpenClaw
    - Hai bisogno di una guida introduttiva per lo sviluppo di Plugin
    - Stai scegliendo tra la documentazione relativa a canali, provider, backend CLI, strumenti o hook
sidebarTitle: Getting Started
summary: Crea il tuo primo plugin OpenClaw in pochi minuti
title: Creazione di plugin
x-i18n:
    generated_at: "2026-07-12T07:14:42Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 99ef2f22f8ae55614d835bc4309881ce264ab1a2287ac08af328e0b311d8fd9a
    source_path: plugins/building-plugins.md
    workflow: 16
---

I Plugin estendono OpenClaw senza modificare il core. Un Plugin può aggiungere un
canale di messaggistica, un provider di modelli, un backend CLI locale, uno strumento
per agenti, un hook, un provider multimediale o un'altra funzionalità gestita dal Plugin.

Non è necessario aggiungere un Plugin esterno al repository di OpenClaw. Pubblica
il pacchetto su [ClawHub](/clawhub) e gli utenti lo installeranno con:

```bash
openclaw plugins install clawhub:<package-name>
```

Durante la transizione al lancio, le specifiche dei pacchetti senza prefisso continuano a essere installate da npm. Usa il
prefisso `clawhub:` quando vuoi la risoluzione tramite ClawHub.

## Requisiti

- Node 22.19+, Node 23.11+ o Node 24+ e `npm` o `pnpm`.
- Moduli ESM TypeScript.
- Per lavorare su un Plugin incluso nel repository, clona il repository ed esegui `pnpm install`.
  Lo sviluppo di Plugin da un checkout del codice sorgente supporta solo pnpm, perché OpenClaw rileva
  i Plugin inclusi dai pacchetti dell'area di lavoro `extensions/*`.

## Scegli la struttura del Plugin

<CardGroup cols={2}>
  <Card title="Plugin per canali" icon="messages-square" href="/it/plugins/sdk-channel-plugins">
    Collega OpenClaw a una piattaforma di messaggistica.
  </Card>
  <Card title="Plugin per provider" icon="cpu" href="/it/plugins/sdk-provider-plugins">
    Aggiungi un provider di modelli, contenuti multimediali, ricerca, recupero, sintesi vocale o comunicazione in tempo reale.
  </Card>
  <Card title="Plugin per backend CLI" icon="terminal" href="/it/plugins/cli-backend-plugins">
    Esegui una CLI IA locale tramite il fallback dei modelli di OpenClaw.
  </Card>
  <Card title="Plugin per strumenti" icon="wrench" href="/it/plugins/tool-plugins">
    Registra strumenti per agenti.
  </Card>
</CardGroup>

## Guida rapida

Crea un Plugin per strumenti minimale registrando un unico strumento obbligatorio per agenti. Questa è la
struttura di Plugin utile più breve e comprende pacchetto, manifesto, punto di ingresso e
verifica locale.

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

    I Plugin esterni pubblicati devono indirizzare i punti di ingresso del runtime verso file JavaScript
    compilati. Consulta [Punti di ingresso dell'SDK](/it/plugins/sdk-entrypoints) per il contratto completo dei
    punti di ingresso.

    Ogni Plugin richiede un manifesto, anche in assenza di configurazione. Gli strumenti del runtime devono
    essere presenti in `contracts.tools`, affinché OpenClaw possa individuarne la titolarità senza
    caricare preventivamente il runtime di ogni Plugin. Imposta `activation.onStartup`
    consapevolmente; questo esempio viene caricato all'avvio del Gateway.

    Anche le superfici dei Plugin considerate attendibili dall'host sono soggette al manifesto e richiedono una
    dichiarazione esplicita per i Plugin installati: `api.registerAgentToolResultMiddleware(...)`
    richiede che ogni runtime di destinazione sia elencato in `contracts.agentToolResultMiddleware`,
    mentre `api.registerTrustedToolPolicy(...)` richiede che ogni identificativo di criterio sia presente in
    `contracts.trustedToolPolicies`. Queste dichiarazioni mantengono allineate l'ispezione
    durante l'installazione e la registrazione nel runtime.

    Per tutti i campi del manifesto, consulta [Manifesto del Plugin](/it/plugins/manifest).

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

    Usa `definePluginEntry` per i Plugin non destinati ai canali. I Plugin per canali usano invece
    `defineChannelPluginEntry` da `openclaw/plugin-sdk/core`.

  </Step>

  <Step title="Verifica il runtime">
    Per un Plugin installato o esterno, esamina il runtime caricato:

    ```bash
    openclaw plugins inspect my-plugin --runtime --json
    ```

    Se il Plugin registra un comando CLI, esegui anche tale comando e verificane
    l'output, ad esempio `openclaw demo-plugin ping`.

    Per un Plugin incluso in questo repository, OpenClaw rileva i pacchetti dei Plugin
    nel checkout del codice sorgente dall'area di lavoro `extensions/*`. Esegui il test mirato
    più pertinente:

    ```bash
    pnpm test extensions/my-plugin/
    pnpm check
    ```

  </Step>

  <Step title="Verifica l'installazione del pacchetto">
    Prima di pubblicare un Plugin pronto per essere distribuito come pacchetto, verifica la stessa modalità di installazione che
    riceveranno gli utenti. Aggiungi innanzitutto un passaggio di compilazione, indirizza le voci del runtime, come
    `openclaw.extensions`, verso file JavaScript compilati, ad esempio `./dist/index.js`, e assicurati
    che `npm pack` includa l'output `dist/`. Le voci del codice sorgente TypeScript sono
    destinate esclusivamente ai checkout del codice sorgente e ai percorsi di sviluppo locale.

    Quindi crea il pacchetto del Plugin e installa il tarball con `npm-pack:`:

    ```bash
    npm pack --pack-destination /tmp
    openclaw plugins install npm-pack:/tmp/<plugin-package>.tgz --force
    openclaw plugins inspect my-plugin --runtime --json
    ```

    `npm-pack:` utilizza il progetto npm per Plugin gestito da OpenClaw, quindi rileva
    gli errori nelle dipendenze del runtime che i test sul checkout del codice sorgente possono nascondere. Verifica
    la struttura del pacchetto e delle dipendenze, non l'attendibilità ufficiale collegata al catalogo.
    Le importazioni del runtime devono trovarsi in `dependencies` o `optionalDependencies`;
    le dipendenze lasciate esclusivamente in `devDependencies` non verranno installate nel
    progetto runtime gestito.

    Non utilizzare un'installazione da archivio/percorso non elaborata come prova finale del comportamento di Plugin ufficiali o
    con privilegi. I sorgenti non elaborati sono utili per il debug locale, ma
    non dimostrano lo stesso percorso delle dipendenze delle installazioni tramite npm o ClawHub. Se
    il Plugin si basa sullo stato attendibile di Plugin ufficiale, aggiungi una seconda prova
    tramite un'installazione ufficiale supportata da catalogo o un percorso di pacchetto pubblicato che
    registri l'attendibilità ufficiale. Consulta
    [Risoluzione delle dipendenze dei Plugin](/it/plugins/dependency-resolution) per
    i dettagli sulla radice di installazione e sulla proprietà delle dipendenze.

  </Step>

  <Step title="Pubblicazione">
    Convalida il pacchetto prima della pubblicazione:

    ```bash
    clawhub package publish your-org/your-plugin --dry-run
    clawhub package publish your-org/your-plugin
    ```

    Gli snippet canonici dei pacchetti ClawHub si trovano in `docs/snippets/plugin-publish/`.

  </Step>

  <Step title="Installazione">
    Installa il pacchetto pubblicato tramite ClawHub:

    ```bash
    openclaw plugins install clawhub:your-org/your-plugin
    ```

  </Step>
</Steps>

<a id="registering-agent-tools"></a>

## Registrazione degli strumenti

Gli strumenti possono essere obbligatori o facoltativi. Gli strumenti obbligatori sono sempre disponibili quando il
Plugin è abilitato. Gli strumenti facoltativi richiedono l'adesione esplicita dell'utente prima che OpenClaw
carichi il runtime del Plugin proprietario.

Le factory degli strumenti ricevono un contesto di runtime attendibile, incluso `deliveryContext`,
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
manifest del Plugin:

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

Gli utenti forniscono l'adesione tramite `tools.allow`:

```json5
{
  tools: { allow: ["workflow_tool"] }, // or ["my-plugin"] for every tool from one plugin
}
```

Gli strumenti facoltativi determinano se uno strumento viene esposto al modello. Utilizza le
[richieste di autorizzazione dei Plugin](/it/plugins/plugin-permission-requests) quando uno strumento
o un hook deve richiedere l'approvazione dopo che il modello lo ha selezionato e prima
che l'azione venga eseguita.

Utilizza strumenti facoltativi per effetti collaterali, binari insoliti o funzionalità che
non devono essere esposte per impostazione predefinita. I nomi degli strumenti non devono entrare in conflitto con i nomi degli strumenti
principali; i conflitti vengono ignorati e segnalati nella diagnostica dei Plugin. Le
registrazioni non valide vengono ignorate e segnalate allo stesso modo: un `name` non vuoto
mancante, un `execute` che non è una funzione o un descrittore dello strumento privo di un oggetto
`parameters`.

Le factory degli strumenti ricevono un oggetto di contesto fornito dal runtime. Utilizza `ctx.activeModel`
quando uno strumento deve registrare, visualizzare o adattarsi al modello attivo per il turno
corrente; può includere `provider`, `modelId` e `modelRef`. Consideralo
un metadato informativo del runtime, non un confine di sicurezza nei confronti dell'operatore
locale, del codice dei Plugin installati o di un runtime OpenClaw modificato. Gli strumenti locali
sensibili devono comunque richiedere un'adesione esplicita del Plugin o dell'operatore e
operare in modalità fail-closed quando i metadati del modello attivo sono mancanti o inadeguati.

Il manifest dichiara la proprietà e l'individuazione; l'esecuzione richiama comunque l'implementazione
registrata e attiva dello strumento. Mantieni `toolMetadata.<tool>.optional: true`
allineato con `api.registerTool(..., { optional: true })` affinché OpenClaw possa evitare
di caricare il runtime del Plugin finché lo strumento non viene aggiunto esplicitamente all'elenco degli elementi consentiti.

## Convenzioni di importazione

Importa dai sottopercorsi specifici dell'SDK:

```typescript
import { definePluginEntry } from "openclaw/plugin-sdk/plugin-entry";
import { createPluginRuntimeStore } from "openclaw/plugin-sdk/runtime-store";
```

Non importare dal barrel radice deprecato:

```typescript
import { definePluginEntry } from "openclaw/plugin-sdk";
```

Nel pacchetto del Plugin, utilizza file barrel locali come `api.ts` e
`runtime-api.ts` per le importazioni interne. Non importare il Plugin stesso tramite un
percorso SDK. Gli helper specifici del provider devono rimanere nel pacchetto del provider, a meno che
l'interfaccia non sia realmente generica.

I metodi RPC personalizzati del Gateway costituiscono un punto di ingresso avanzato. Mantienili in un
prefisso specifico del Plugin; gli spazi dei nomi amministrativi principali come `config.*`,
`exec.approvals.*`, `operator.admin.*`, `wizard.*` e `update.*` restano riservati
e vengono risolti in `operator.admin`. Il bridge
`openclaw/plugin-sdk/gateway-method-runtime` è riservato alle route HTTP dei Plugin
che dichiarano `contracts.gatewayMethodDispatch: ["authenticated-request"]`.

Per la mappa completa delle importazioni, consulta la [panoramica dell'SDK dei Plugin](/it/plugins/sdk-overview).

## Elenco di controllo prima dell'invio

<Check>**package.json** contiene i metadati `openclaw` corretti</Check>
<Check>Il manifest **openclaw.plugin.json** è presente e valido</Check>
<Check>Il punto di ingresso utilizza `defineChannelPluginEntry` o `definePluginEntry`</Check>
<Check>Tutte le importazioni utilizzano percorsi specifici `plugin-sdk/<subpath>`</Check>
<Check>Le importazioni interne utilizzano moduli locali, non auto-importazioni dell'SDK</Check>
<Check>I test vengono superati (`pnpm test <bundled-plugin-root>/my-plugin/`)</Check>
<Check>`pnpm check` viene superato (Plugin interni al repository)</Check>

## Test con le versioni beta

1. Segui le release di [openclaw/openclaw](https://github.com/openclaw/openclaw/releases) (`Watch` > `Releases`). I tag beta hanno un formato simile a `v2026.3.N-beta.1`. Puoi anche seguire [@openclaw](https://x.com/openclaw) su X per gli annunci delle release.
2. Testa il tuo plugin con il tag beta non appena viene pubblicato. La finestra temporale prima della versione stabile è solitamente di poche ore.
3. Dopo il test, pubblica un messaggio nel thread del tuo plugin nel canale Discord `plugin-forum` ([discord.gg/clawd](https://discord.gg/clawd)), indicando `all good` oppure descrivendo ciò che non funziona. Crea un thread se non ne hai ancora uno.
4. Se qualcosa non funziona, apri o aggiorna un issue intitolato `Beta blocker: <plugin-name> - <summary>` e applica l'etichetta `beta-blocker`. Inserisci il link all'issue nel tuo thread.
5. Apri una PR verso `main` intitolata `fix(<plugin-id>): beta blocker - <summary>` e inserisci il link all'issue sia nella PR sia nel tuo thread Discord. I collaboratori non possono assegnare etichette alle PR, quindi il titolo funge da segnale sul lato PR per i manutentori e l'automazione. I problemi bloccanti con una PR vengono risolti tramite merge; quelli senza PR potrebbero essere inclusi comunque nella release.
6. Il silenzio equivale a un esito positivo. Se non rispetti la finestra temporale, la correzione verrà solitamente inclusa nel ciclo successivo.

## Passaggi successivi

<CardGroup cols={2}>
  <Card title="Plugin per canali" icon="messages-square" href="/it/plugins/sdk-channel-plugins">
    Crea un plugin per un canale di messaggistica
  </Card>
  <Card title="Plugin per provider" icon="cpu" href="/it/plugins/sdk-provider-plugins">
    Crea un plugin per un provider di modelli
  </Card>
  <Card title="Plugin backend per CLI" icon="terminal" href="/it/plugins/cli-backend-plugins">
    Registra un backend CLI locale per l'IA
  </Card>
  <Card title="Panoramica dell'SDK" icon="book-open" href="/it/plugins/sdk-overview">
    Riferimento della mappa delle importazioni e dell'API di registrazione
  </Card>
  <Card title="Helper di runtime" icon="settings" href="/it/plugins/sdk-runtime">
    TTS, ricerca e sottoagenti tramite api.runtime
  </Card>
  <Card title="Test" icon="test-tubes" href="/it/plugins/sdk-testing">
    Utilità e pattern per i test
  </Card>
  <Card title="Manifest del plugin" icon="file-json" href="/it/plugins/manifest">
    Riferimento completo dello schema del manifest
  </Card>
</CardGroup>

## Contenuti correlati

- [Hook dei plugin](/it/plugins/hooks)
- [Architettura dei plugin](/it/plugins/architecture)
