---
read_when:
    - Stai creando un plugin backend CLI AI locale
    - Vuoi registrare un backend per riferimenti di modello come acme-cli/model
    - Devi mappare una CLI di terze parti nel runner di fallback testuale di OpenClaw
sidebarTitle: CLI backend plugins
summary: Crea un plugin che registra un backend CLI AI locale
title: Creazione di Plugin backend CLI
x-i18n:
    generated_at: "2026-06-27T17:47:04Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: d91c2b712a821005303c6cbb0ccbd8f263c8c30c5dbd6ed05b842c47c63f0542
    source_path: plugins/cli-backend-plugins.md
    workflow: 16
---

I Plugin backend CLI consentono a OpenClaw di chiamare una CLI AI locale come backend
di inferenza testuale. Il backend appare come prefisso provider nei riferimenti modello:

```text
acme-cli/acme-large
```

Usa un backend CLI quando l'integrazione upstream è già esposta come comando
locale, quando la CLI possiede lo stato di accesso locale, oppure quando la CLI è
un fallback utile se i provider API non sono disponibili.

<Info>
  Se il servizio upstream espone una normale API modello HTTP, scrivi invece un
  [Plugin provider](/it/plugins/sdk-provider-plugins). Se il runtime upstream
  possiede sessioni agente complete, eventi degli strumenti, Compaction o stato
  delle attività in background, usa un [harness agente](/it/plugins/sdk-agent-harness).
</Info>

## Di cosa è responsabile il Plugin

Un Plugin backend CLI ha tre contratti:

| Contratto             | File                   | Scopo                                                     |
| -------------------- | ---------------------- | --------------------------------------------------------- |
| Entry point pacchetto | `package.json`         | Indica a OpenClaw il modulo runtime del Plugin            |
| Proprietà manifest   | `openclaw.plugin.json` | Dichiara l'id del backend prima del caricamento runtime   |
| Registrazione runtime | `index.ts`             | Chiama `api.registerCliBackend(...)` con i default comando |

Il manifest è metadati di discovery. Non esegue la CLI e non registra
comportamenti runtime. Il comportamento runtime inizia quando l'entry point del
Plugin chiama `api.registerCliBackend(...)`.

## Plugin backend minimale

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

    I pacchetti pubblicati devono includere file runtime JavaScript compilati. Se
    l'entry point sorgente è `./src/index.ts`, aggiungi `openclaw.runtimeExtensions`
    che punti al peer JavaScript compilato. Vedi [Entry point](/it/plugins/sdk-entrypoints).

  </Step>

  <Step title="Dichiara la proprietà del backend">
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

    `cliBackends` è l'elenco di proprietà runtime. Consente a OpenClaw di caricare
    automaticamente il Plugin quando la configurazione o la selezione del modello
    menziona `acme-cli/...`.

    `setup.cliBackends` è la superficie di configurazione descriptor-first.
    Aggiungila quando discovery dei modelli, onboarding o stato devono riconoscere
    il backend senza caricare il runtime del Plugin. Usa `requiresRuntime: false`
    solo quando quei descrittori statici sono sufficienti per la configurazione.

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

    L'id del backend deve corrispondere alla voce `cliBackends` del manifest. La
    `config` registrata è solo il default; la configurazione utente in
    `agents.defaults.cliBackends.acme-cli` viene sovrapposta a runtime.

  </Step>
</Steps>

## Forma della configurazione

`CliBackendConfig` descrive come OpenClaw deve avviare e analizzare la CLI:

| Campo                                     | Uso                                                         |
| ----------------------------------------- | ----------------------------------------------------------- |
| `command`                                 | Nome del binario o percorso comando assoluto                |
| `args`                                    | Argv di base per esecuzioni nuove                           |
| `resumeArgs`                              | Argv alternativo per sessioni riprese; supporta `{sessionId}` |
| `output` / `resumeOutput`                 | Parser: `json`, `jsonl` o `text`                            |
| `input`                                   | Trasporto prompt: `arg` o `stdin`                           |
| `modelArg`                                | Flag usato prima dell'id modello                            |
| `modelAliases`                            | Mappa gli id modello OpenClaw a id nativi della CLI         |
| `sessionArg` / `sessionArgs`              | Come passare un id sessione                                 |
| `sessionMode`                             | `always`, `existing` o `none`                               |
| `sessionIdFields`                         | Campi JSON che OpenClaw legge dall'output della CLI         |
| `systemPromptArg` / `systemPromptFileArg` | Trasporto del prompt di sistema                             |
| `systemPromptWhen`                        | `first`, `always` o `never`                                 |
| `imageArg` / `imageMode`                  | Supporto per percorsi immagine                              |
| `serialize`                               | Mantiene ordinate le esecuzioni dello stesso backend        |
| `reliability.watchdog`                    | Configurazione fine del timeout senza output                |

Preferisci la configurazione statica più piccola che corrisponde alla CLI.
Aggiungi callback del Plugin solo per comportamenti che appartengono davvero al
backend.

## Hook backend avanzati

`CliBackendPlugin` può anche definire:

| Hook                               | Uso                                                                         |
| ---------------------------------- | --------------------------------------------------------------------------- |
| `normalizeConfig(config, context)` | Riscrive la configurazione utente legacy dopo il merge                      |
| `resolveExecutionArgs(ctx)`        | Aggiunge flag specifici della richiesta, come thinking effort o isolamento delle domande laterali |
| `prepareExecution(ctx)`            | Crea bridge temporanei di autenticazione o configurazione prima dell'avvio  |
| `transformSystemPrompt(ctx)`       | Applica una trasformazione finale del prompt di sistema specifica della CLI |
| `textTransforms`                   | Sostituzioni bidirezionali prompt/output                                    |
| `defaultAuthProfileId`             | Preferisce uno specifico profilo di autenticazione OpenClaw                 |
| `authEpochMode`                    | Decide come i cambiamenti di autenticazione invalidano le sessioni CLI archiviate |
| `nativeToolMode`                   | Dichiara se la CLI ha strumenti nativi sempre attivi                        |
| `sideQuestionToolMode`             | Dichiara strumenti nativi disabilitati per domande laterali `/btw`          |
| `bundleMcp` / `bundleMcpMode`      | Aderisce al bridge strumenti MCP local loopback di OpenClaw                 |
| `ownsNativeCompaction`             | Il backend possiede la propria Compaction - OpenClaw si ritira              |

Mantieni questi hook di proprietà del provider. Non aggiungere ramificazioni
specifiche della CLI al core quando un hook backend può esprimere il
comportamento.

`ctx.executionMode` è `"agent"` per turni normali e `"side-question"` per chiamate
effimere `/btw`. Usalo quando la CLI richiede flag monouso diversi, come
disabilitare strumenti nativi, persistenza della sessione o comportamento di
ripresa per BTW. Se un backend normalmente ha `nativeToolMode: "always-on"` ma il
suo argv per domande laterali disabilita in modo affidabile quegli strumenti,
imposta anche `sideQuestionToolMode: "disabled"`; altrimenti OpenClaw fallisce in
modo chiuso quando BTW richiede un'esecuzione CLI senza strumenti.

### `ownsNativeCompaction`: disattivare la Compaction di OpenClaw

Se il tuo backend esegue un agente che compatta il **proprio** transcript, imposta
`ownsNativeCompaction: true` così il summarizer di salvaguardia di OpenClaw non viene mai eseguito sulle sue
sessioni - il ciclo di vita della Compaction CLI restituisce un no-op e il turno procede. `claude-cli`
lo dichiara perché Claude Code compatta internamente senza endpoint harness. Le sessioni
native-harness come Codex continuano invece a essere instradate al loro endpoint di Compaction harness.

**Dichiaralo solo quando tutte le condizioni seguenti sono vere**, altrimenti una sessione oltre budget rinviata può
restare oltre budget / diventare obsoleta (OpenClaw non la recupera più):

- il backend compatta o limita in modo affidabile il proprio transcript quando si avvicina alla sua finestra;
- persiste una sessione riprendibile così lo stato compattato sopravvive ai turni
  (ad es. `--resume` / `--session-id`);
- non è una sessione di Compaction native-harness - le sessioni corrispondenti a `agentHarnessId`
  vengono invece instradate all'endpoint harness.

## Bridge strumenti MCP

I backend CLI non ricevono gli strumenti OpenClaw per default. Se la CLI può
consumare una configurazione MCP, aderiscici esplicitamente:

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

Le modalità bridge supportate sono:

| Modalità                 | Uso                                                              |
| ------------------------ | ---------------------------------------------------------------- |
| `claude-config-file`     | CLI che accettano un file di configurazione MCP                  |
| `codex-config-overrides` | CLI che accettano override di configurazione su argv             |
| `gemini-system-settings` | CLI che leggono impostazioni MCP dalla loro directory delle impostazioni di sistema |

Abilita il bridge solo quando la CLI può effettivamente consumarlo. Se la CLI ha
un proprio livello di strumenti integrato che non può essere disabilitato,
imposta `nativeToolMode: "always-on"` così OpenClaw può fallire in modo chiuso
quando un chiamante richiede nessuno strumento nativo.

## Configurazione utente

Gli utenti possono sovrascrivere qualsiasi default del backend:

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
        primary: "openai/gpt-5.5",
        fallbacks: ["acme-cli/large"],
      },
    },
  },
}
```

Documenta l'override minimo di cui gli utenti probabilmente avranno bisogno. Di
solito è solo `command` quando il binario è fuori da `PATH`.

## Verifica

Per i plugin in bundle, aggiungi un test mirato attorno al builder e alla registrazione
di setup, quindi esegui la lane di test mirata del plugin:

```bash
pnpm test extensions/acme-cli
```

Per i plugin locali o installati, verifica la discovery e una reale esecuzione del modello:

```bash
openclaw plugins inspect acme-cli --runtime --json
openclaw agent --message "reply exactly: backend ok" --model acme-cli/acme-large
```

Se il backend supporta immagini o MCP, aggiungi uno smoke test live che provi quei percorsi
con la CLI reale. Non affidarti all'ispezione statica per il comportamento di prompt,
immagini, MCP o ripresa della sessione.

## Checklist

<Check>`package.json` contiene `openclaw.extensions` e voci runtime compilate per i pacchetti pubblicati</Check>
<Check>`openclaw.plugin.json` dichiara `cliBackends` e `activation.onStartup` intenzionale</Check>
<Check>`setup.cliBackends` è presente quando setup/discovery dei modelli deve vedere il backend a freddo</Check>
<Check>`api.registerCliBackend(...)` usa lo stesso ID del backend del manifest</Check>
<Check>Le override utente sotto `agents.defaults.cliBackends.<id>` hanno ancora la precedenza</Check>
<Check>Le impostazioni di sessione, prompt di sistema, immagini e parser dell'output corrispondono al contratto reale della CLI</Check>
<Check>I test mirati e almeno uno smoke test live della CLI provano il percorso del backend</Check>

## Correlati

- [Backend CLI](/it/gateway/cli-backends) - configurazione utente e comportamento runtime
- [Creare plugin](/it/plugins/building-plugins) - basi di pacchetto e manifest
- [Panoramica del Plugin SDK](/it/plugins/sdk-overview) - riferimento API di registrazione
- [Manifest del plugin](/it/plugins/manifest) - `cliBackends` e descrittori di setup
- [Harness dell'agente](/it/plugins/sdk-agent-harness) - runtime completi per agenti esterni
