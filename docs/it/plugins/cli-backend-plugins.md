---
read_when:
    - Stai creando un plugin backend CLI di IA locale
    - Vuoi registrare un backend per riferimenti a modelli come acme-cli/model
    - Devi integrare una CLI di terze parti nel runner di fallback testuale di OpenClaw
sidebarTitle: CLI backend plugins
summary: Crea un plugin che registri un backend CLI di IA locale
title: Creazione di Plugin per backend CLI
x-i18n:
    generated_at: "2026-07-12T07:13:18Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 6448cdac02a03e5fdf0d802a54189998d97c08769b1b85c8d9963301fa2c5b79
    source_path: plugins/cli-backend-plugins.md
    workflow: 16
---

I plugin di backend CLI consentono a OpenClaw di chiamare una CLI di IA locale come backend di inferenza
testuale. Il backend appare come prefisso del provider nei riferimenti ai modelli:

```text
acme-cli/acme-large
```

Usa un backend CLI quando l'integrazione upstream è già esposta come comando
locale, quando la CLI gestisce lo stato di accesso locale oppure come soluzione di ripiego quando i
provider API non sono disponibili.

<Info>
  Se il servizio upstream espone una normale API HTTP per modelli, crea invece un
  [plugin provider](/it/plugins/sdk-provider-plugins). Se il runtime upstream
  gestisce sessioni complete dell'agente, eventi degli strumenti, Compaction o lo stato delle attività
  in background, usa un [harness per agenti](/it/plugins/sdk-agent-harness).
</Info>

## Responsabilità del plugin

Un plugin di backend CLI ha tre contratti:

| Contratto             | File                   | Scopo                                                     |
| --------------------- | ---------------------- | --------------------------------------------------------- |
| Punto di ingresso del pacchetto | `package.json`         | Indica a OpenClaw il modulo runtime del plugin             |
| Titolarità nel manifesto | `openclaw.plugin.json` | Dichiara l'ID del backend prima del caricamento del runtime |
| Registrazione nel runtime | `index.ts`             | Chiama `api.registerCliBackend(...)` con i valori predefiniti del comando |

Il manifesto contiene metadati di rilevamento: non esegue la CLI né registra
il comportamento del runtime. Il comportamento del runtime inizia quando il punto di ingresso del plugin chiama
`api.registerCliBackend(...)`.

## Plugin di backend minimo

<Steps>
  <Step title="Crea i metadati del pacchetto">
    ```json package.json
    {
      "name": "@acme/openclaw-acme-cli",
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
      },
      "dependencies": {
        "openclaw": "^2026.3.24"
      },
      "devDependencies": {
        "typescript": "^5.9.0"
      }
    }
    ```

    I pacchetti pubblicati devono includere file runtime JavaScript compilati. Se il punto di ingresso
    del codice sorgente è `./src/index.ts`, aggiungi `openclaw.runtimeExtensions` che faccia riferimento al
    corrispondente file JavaScript compilato. Consulta [Punti di ingresso](/it/plugins/sdk-entrypoints).

  </Step>

  <Step title="Dichiara la titolarità del backend">
    ```json openclaw.plugin.json
    {
      "id": "acme-cli",
      "name": "Acme CLI",
      "description": "Run Acme's local AI CLI through OpenClaw",
      "cliBackends": ["acme-cli"],
      "setup": {
        "cliBackends": ["acme-cli"],
        "requiresRuntime": false
      },
      "activation": {
        "onStartup": false
      },
      "configSchema": {
        "type": "object",
        "additionalProperties": false
      }
    }
    ```

    `cliBackends` è l'elenco di titolarità del runtime; consente a OpenClaw di caricare automaticamente il
    plugin quando la configurazione o la selezione del modello menziona `acme-cli/...`.

    `setup.cliBackends` è la superficie di configurazione basata prima di tutto sui descrittori. Aggiungila quando
    il rilevamento dei modelli, la procedura iniziale o lo stato devono riconoscere il backend
    senza caricare il runtime del plugin. Usa `requiresRuntime: false` solo quando
    questi descrittori statici sono sufficienti per la configurazione.

  </Step>

  <Step title="Registra il backend">
    ```typescript index.ts
    import { definePluginEntry } from "openclaw/plugin-sdk/plugin-entry";
    import {
      CLI_FRESH_WATCHDOG_DEFAULTS,
      CLI_RESUME_WATCHDOG_DEFAULTS,
      type CliBackendPlugin,
    } from "openclaw/plugin-sdk/cli-backend";

    function buildAcmeCliBackend(): CliBackendPlugin {
      return {
        id: "acme-cli",
        liveTest: {
          defaultModelRef: "acme-cli/acme-large",
          defaultImageProbe: false,
          defaultMcpProbe: false,
          docker: {
            npmPackage: "@acme/acme-cli",
            binaryName: "acme",
          },
        },
        config: {
          command: "acme",
          args: ["chat", "--json"],
          output: "json",
          input: "stdin",
          modelArg: "--model",
          sessionArg: "--session",
          sessionMode: "existing",
          sessionIdFields: ["session_id", "conversation_id"],
          systemPromptFileArg: "--system-file",
          systemPromptWhen: "first",
          imageArg: "--image",
          imageMode: "repeat",
          reliability: {
            watchdog: {
              fresh: { ...CLI_FRESH_WATCHDOG_DEFAULTS },
              resume: { ...CLI_RESUME_WATCHDOG_DEFAULTS },
            },
          },
          serialize: true,
        },
      };
    }

    export default definePluginEntry({
      id: "acme-cli",
      name: "Acme CLI",
      description: "Run Acme's local AI CLI through OpenClaw",
      register(api) {
        api.registerCliBackend(buildAcmeCliBackend());
      },
    });
    ```

    L'ID del backend deve corrispondere alla voce `cliBackends` del manifesto. La
    `config` registrata è solo quella predefinita; la configurazione utente in
    `agents.defaults.cliBackends.acme-cli` viene unita a essa durante l'esecuzione e ha la precedenza.

  </Step>
</Steps>

## Struttura della configurazione

`CliBackendConfig` descrive come OpenClaw deve avviare e analizzare la CLI:

| Campo                                                     | Uso                                                                                |
| --------------------------------------------------------- | ---------------------------------------------------------------------------------- |
| `command`                                                 | Nome del binario o percorso assoluto del comando                                   |
| `args`                                                    | Argomenti argv di base per nuove esecuzioni                                        |
| `resumeArgs`                                              | Argomenti argv alternativi per sessioni riprese; supporta `{sessionId}`             |
| `output` / `resumeOutput`                                 | Analizzatore: `json`, `jsonl` o `text`                                             |
| `jsonlDialect`                                            | Dialetto degli eventi JSONL: `claude-stream-json` o `gemini-stream-json`           |
| `liveSession`                                             | Modalità di processo CLI di lunga durata (`claude-stdio`)                          |
| `input`                                                   | Trasporto del prompt: `arg` o `stdin`                                              |
| `maxPromptArgChars`                                       | Lunghezza massima del prompt per la modalità `arg` prima di ricorrere a stdin       |
| `env` / `clearEnv`                                        | Variabili d'ambiente aggiuntive da inserire o nomi da rimuovere prima dell'avvio   |
| `modelArg`                                                | Flag usato prima dell'ID del modello                                               |
| `modelAliases`                                            | Associa gli ID modello di OpenClaw agli ID nativi della CLI                        |
| `sessionArg` / `sessionArgs`                              | Modalità di passaggio dell'ID di sessione                                          |
| `sessionMode`                                             | `always`, `existing` o `none`                                                      |
| `sessionIdFields`                                         | Campi JSON che OpenClaw legge dall'output della CLI                                |
| `systemPromptArg` / `systemPromptFileArg`                 | Trasporto del prompt di sistema                                                    |
| `systemPromptFileConfigArg` / `systemPromptFileConfigKey` | Trasporto dell'override di configurazione per un file del prompt di sistema, ad esempio `-c` |
| `systemPromptMode`                                        | `append` o `replace`                                                               |
| `systemPromptWhen`                                        | `first`, `always` o `never`                                                        |
| `imageArg` / `imageMode`                                  | Flag del percorso immagine e modalità di passaggio di più immagini (`repeat` o `list`) |
| `imagePathScope`                                          | Posizione dei file immagine preparati prima del passaggio: `temp` o `workspace`    |
| `serialize`                                               | Mantiene ordinate le esecuzioni dello stesso backend                              |
| `reseedFromRawTranscriptWhenUncompacted`                  | Abilita il reinserimento limitato della trascrizione grezza prima della Compaction per reimpostazioni sicure delle sessioni |
| `reliability.outputLimits`                                | Numero massimo di caratteri/righe JSONL grezzi conservati per una singola interazione CLI in tempo reale (backend con sessione attiva) |
| `reliability.watchdog`                                    | Regolazione del timeout in assenza di output, separata per esecuzioni nuove e riprese |

Preferisci la configurazione statica più piccola che corrisponde alla CLI. Aggiungi callback al plugin
solo per comportamenti che appartengono realmente al backend.

## Hook avanzati del backend

`CliBackendPlugin` può inoltre definire:

| Hook                               | Uso                                                                          |
| ---------------------------------- | ---------------------------------------------------------------------------- |
| `normalizeConfig(config, context)` | Riscrive la configurazione utente precedente dopo l'unione                    |
| `resolveExecutionArgs(ctx)`        | Aggiunge flag specifici della richiesta, come l'intensità di ragionamento o l'isolamento delle domande secondarie |
| `prepareExecution(ctx)`            | Crea ponti temporanei di autenticazione o configurazione prima dell'avvio     |
| `transformSystemPrompt(ctx)`       | Applica una trasformazione finale del prompt di sistema specifica della CLI  |
| `textTransforms`                   | Sostituzioni bidirezionali di prompt/output                                   |
| `defaultAuthProfileId`             | Preferisce un profilo di autenticazione OpenClaw specifico                    |
| `authEpochMode`                    | Decide in che modo le modifiche all'autenticazione invalidano le sessioni CLI memorizzate |
| `nativeToolMode`                   | Dichiara se gli strumenti nativi sono assenti, sempre attivi o selezionabili dall'host |
| `sideQuestionToolMode`             | Dichiara gli strumenti nativi disabilitati per le domande secondarie `/btw`   |
| `bundleMcp` / `bundleMcpMode`      | Abilita il ponte agli strumenti MCP tramite local loopback di OpenClaw        |
| `ownsNativeCompaction`             | Il backend gestisce la propria Compaction; OpenClaw la demanda                |
| `runtimeArtifact`                  | Vincola un launcher di script al relativo albero completo del pacchetto incluso |

Mantieni questi hook di proprietà del provider. Non aggiungere diramazioni specifiche della CLI al core quando
un hook del backend può esprimere il comportamento.

`runtimeArtifact` appartiene al plugin e non può essere sovrascritto dall'utente. Viene consultato
solo quando un'interazione di inferenza in tempo reale crea o riconvalida un'autorità verificata per la configurazione;
le normali esecuzioni della CLI non lo richiedono. Un backend privo di questa dichiarazione non può
creare un'autorità verificata per la configurazione della CLI. Una dichiarazione `bundled-package-tree` indica
l'esatto proprietario di `package.json` e richiede che il punto di ingresso del pacchetto sia il
comando. OpenClaw calcola l'hash dell'intero albero delimitato del pacchetto installato, incluse
le dipendenze annidate, e interrompe l'operazione in modo sicuro in presenza di collegamenti simbolici di reindirizzamento,
launcher esterni al pacchetto dichiarato, dichiarazioni di dipendenze esterne
obbligatorie, alberi troppo grandi e script sconosciuti. Dichiara questa opzione solo quando tale
albero contiene l'implementazione completa dell'inferenza; le integrazioni facoltative con strumenti
non rendono sicuro un grafo di implementazione esterno.

Se lo stesso backend distribuisce anche un eseguibile nativo autonomo, elenca i relativi
nomi di base canonici in `nativeExecutableNames`. Gli altri comandi nativi restano
non verificati anche quando un utente sovrascrive il comando del backend.

`ctx.executionMode` è `"agent"` per i turni normali e `"side-question"` per le
chiamate effimere `/btw`. Usalo quando la CLI richiede flag monouso diversi,
ad esempio per disabilitare gli strumenti nativi, la persistenza della sessione
o il comportamento di ripresa per BTW. Se un backend normalmente ha
`nativeToolMode: "always-on"` ma i relativi argv per le domande secondarie
disabilitano tali strumenti in modo affidabile, imposta anche
`sideQuestionToolMode: "disabled"`; altrimenti OpenClaw applica una chiusura
sicura quando BTW richiede un'esecuzione della CLI senza strumenti.

Imposta `nativeToolMode: "selectable"` solo quando `resolveExecutionArgs` può
disabilitare ogni strumento nativo del backend per una singola esecuzione. Per
queste esecuzioni con restrizioni, `ctx.toolAvailability.native` è una tupla
vuota e `ctx.toolAvailability.mcp` è l'esatto elenco consentito MCP isolato
dall'host. L'hook deve sostituire i flag degli strumenti in conflitto e
restituire argv che applichi entrambi i valori; OpenClaw lo chiama una volta con
l'argv finale di una nuova esecuzione o di una ripresa e applica una chiusura
sicura quando il backend non può far rispettare la restrizione. I nomi MCP in
questo contesto possono essere approvati automaticamente in sicurezza solo
perché l'host ha già limitato la configurazione MCP generata a tali server e
strumenti.

### `ownsNativeCompaction`: disattivare la Compaction di OpenClaw

Se il tuo backend esegue un agente che compatta la **propria** trascrizione,
imposta `ownsNativeCompaction: true` affinché il riepilogatore di salvaguardia
di OpenClaw non venga mai eseguito sulle sue sessioni: il ciclo di vita della
Compaction della CLI non esegue alcuna operazione e il turno procede.
`claude-cli` lo dichiara perché Claude Code esegue internamente la Compaction
senza un endpoint dell'harness. Le sessioni con harness nativo, come Codex,
continuano invece a essere instradate al relativo endpoint di Compaction
dell'harness.

**Dichiaralo solo quando sono soddisfatte tutte le condizioni seguenti**,
altrimenti una sessione differita che supera il limite può rimanere oltre il
limite o diventare obsoleta (OpenClaw non la recupera più):

- il backend compatta o limita in modo affidabile la propria trascrizione
  quando si avvicina al limite della finestra;
- mantiene una sessione ripristinabile affinché lo stato compattato persista
  tra i turni (ad esempio `--resume` / `--session-id`);
- non è una sessione di Compaction con harness nativo: le sessioni
  corrispondenti a `agentHarnessId` vengono invece instradate all'endpoint
  dell'harness.

## Ponte per strumenti MCP

Per impostazione predefinita, i backend CLI non ricevono gli strumenti di
OpenClaw. Se la CLI può utilizzare una configurazione MCP, abilitala
esplicitamente:

```typescript
return {
  id: "acme-cli",
  bundleMcp: true,
  bundleMcpMode: "codex-config-overrides",
  config: {
    command: "acme",
    args: ["chat", "--json"],
    output: "json",
  },
};
```

Modalità del ponte supportate:

| Modalità                 | Utilizzo                                                          |
| ------------------------ | ----------------------------------------------------------------- |
| `claude-config-file`     | CLI che accettano un file di configurazione MCP                   |
| `codex-config-overrides` | CLI che accettano sostituzioni della configurazione negli argv    |
| `gemini-system-settings` | CLI che leggono le impostazioni MCP dalla directory di sistema delle impostazioni |

Abilita il ponte solo quando la CLI può effettivamente utilizzarlo. Se la CLI
dispone di un proprio livello di strumenti integrato che non può essere
disabilitato, imposta `nativeToolMode: "always-on"` affinché OpenClaw possa
applicare una chiusura sicura quando un chiamante richiede l'assenza di
strumenti nativi. Se può disabilitare tutti gli strumenti nativi per ogni
esecuzione, usa `"selectable"` con il contratto `resolveExecutionArgs`
descritto sopra.

## Configurazione utente

Gli utenti possono sostituire qualsiasi valore predefinito del backend:

```json5
{
  agents: {
    defaults: {
      cliBackends: {
        "acme-cli": {
          command: "/opt/acme/bin/acme",
          args: ["chat", "--json", "--profile", "work"],
          modelAliases: {
            large: "acme-large-2026",
          },
        },
      },
      model: {
        primary: "openai/gpt-5.6-sol",
        fallbacks: ["acme-cli/large"],
      },
    },
  },
}
```

Documenta la sostituzione minima di cui gli utenti avranno probabilmente
bisogno, in genere solo `command` quando il file binario si trova al di fuori
di `PATH`.

## Verifica

Per i plugin inclusi, aggiungi un test mirato per il builder e la registrazione
della configurazione, quindi esegui il percorso di test mirato del plugin:

```bash
pnpm test extensions/acme-cli
```

Per i plugin locali o installati, verifica il rilevamento e un'esecuzione reale
del modello:

```bash
openclaw plugins inspect acme-cli --runtime --json
openclaw agent --message "reply exactly: backend ok" --model acme-cli/acme-large
```

Se il backend supporta immagini o MCP, aggiungi uno smoke test reale che
dimostri tali percorsi con la CLI effettiva. Non affidarti all'ispezione statica
per il comportamento relativo a prompt, immagini, MCP o ripresa della
sessione.

## Elenco di controllo

<Check>`package.json` contiene `openclaw.extensions` e voci di runtime compilate per i pacchetti pubblicati</Check>
<Check>`openclaw.plugin.json` dichiara `cliBackends` e un valore intenzionale per `activation.onStartup`</Check>
<Check>`setup.cliBackends` è presente quando la configurazione o il rilevamento dei modelli devono individuare il backend prima dell'avvio</Check>
<Check>`api.registerCliBackend(...)` usa lo stesso ID del backend del manifesto</Check>
<Check>Le sostituzioni dell'utente in `agents.defaults.cliBackends.<id>` continuano ad avere la precedenza</Check>
<Check>Le impostazioni della sessione, del prompt di sistema, delle immagini e del parser dell'output corrispondono al contratto reale della CLI</Check>
<Check>I test mirati e almeno uno smoke test reale della CLI dimostrano il funzionamento del percorso del backend</Check>

## Contenuti correlati

- [Backend CLI](/it/gateway/cli-backends) - configurazione utente e comportamento in fase di esecuzione
- [Creazione di plugin](/it/plugins/building-plugins) - nozioni di base su pacchetti e manifesti
- [Panoramica dell'SDK dei plugin](/it/plugins/sdk-overview) - riferimento dell'API di registrazione
- [Manifesto del plugin](/it/plugins/manifest) - `cliBackends` e descrittori di configurazione
- [Harness dell'agente](/it/plugins/sdk-agent-harness) - runtime completi per agenti esterni
