---
read_when:
    - Stai creando un Plugin backend CLI di IA locale
    - Vuoi registrare un backend per riferimenti ai modelli come acme-cli/model
    - È necessario mappare una CLI di terze parti nell'esecutore di ripiego testuale di OpenClaw
sidebarTitle: CLI backend plugins
summary: Crea un Plugin che registra un backend CLI di IA locale
title: Creazione di Plugin backend per CLI
x-i18n:
    generated_at: "2026-05-07T13:22:46Z"
    model: gpt-5.5
    provider: openai
    source_hash: 9fcd604d35eb20d91350d5201236f22edfe7bb7e52eb19e89bceb8025dd3a29b
    source_path: plugins/cli-backend-plugins.md
    workflow: 16
---

I plugin backend CLI consentono a OpenClaw di chiamare una CLI AI locale come
backend di inferenza testuale. Il backend appare come prefisso provider nei riferimenti modello:

```text
acme-cli/acme-large
```

Usa un backend CLI quando l'integrazione upstream è già esposta come comando
locale, quando la CLI gestisce lo stato di login locale, oppure quando la CLI è
un fallback utile se i provider API non sono disponibili.

<Info>
  Se il servizio upstream espone una normale API modello HTTP, scrivi invece un
  [plugin provider](/it/plugins/sdk-provider-plugins). Se il runtime upstream
  gestisce sessioni agente complete, eventi tool, compaction o stato di task in
  background, usa un [agent harness](/it/plugins/sdk-agent-harness).
</Info>

## Cosa gestisce il plugin

Un plugin backend CLI ha tre contratti:

| Contratto             | File                   | Scopo                                                     |
| -------------------- | ---------------------- | --------------------------------------------------------- |
| Entry del package    | `package.json`         | Punta OpenClaw al modulo runtime del plugin               |
| Proprietà manifest   | `openclaw.plugin.json` | Dichiara l'id backend prima del caricamento del runtime   |
| Registrazione runtime | `index.ts`            | Chiama `api.registerCliBackend(...)` con i default comando |

Il manifest è metadato di discovery. Non esegue la CLI e non registra
comportamenti runtime. Il comportamento runtime inizia quando l'entry del plugin
chiama `api.registerCliBackend(...)`.

## Plugin backend minimale

<Steps>
  <Step title="Crea i metadati del package">
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

    I package pubblicati devono includere file runtime JavaScript compilati. Se
    la tua entry sorgente è `./src/index.ts`, aggiungi
    `openclaw.runtimeExtensions` che punta al peer JavaScript compilato. Vedi
    [Entry point](/it/plugins/sdk-entrypoints).

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

    `cliBackends` è l'elenco di proprietà runtime. Consente a OpenClaw di
    caricare automaticamente il plugin quando la configurazione o la selezione
    del modello menziona `acme-cli/...`.

    `setup.cliBackends` è la superficie di setup descriptor-first. Aggiungila
    quando discovery dei modelli, onboarding o stato devono riconoscere il
    backend senza caricare il runtime del plugin. Usa `requiresRuntime: false`
    solo quando quei descrittori statici sono sufficienti per il setup.

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

    L'id backend deve corrispondere alla voce `cliBackends` del manifest. La
    `config` registrata è solo il default; la configurazione utente sotto
    `agents.defaults.cliBackends.acme-cli` viene unita sopra di essa a runtime.

  </Step>
</Steps>

## Forma della configurazione

`CliBackendConfig` descrive come OpenClaw deve avviare e analizzare la CLI:

| Campo                                     | Uso                                                         |
| ----------------------------------------- | ----------------------------------------------------------- |
| `command`                                 | Nome binario o percorso comando assoluto                    |
| `args`                                    | Argv base per esecuzioni nuove                              |
| `resumeArgs`                              | Argv alternativo per sessioni riprese; supporta `{sessionId}` |
| `output` / `resumeOutput`                 | Parser: `json`, `jsonl` o `text`                            |
| `input`                                   | Trasporto prompt: `arg` o `stdin`                           |
| `modelArg`                                | Flag usato prima dell'id modello                            |
| `modelAliases`                            | Mappa gli id modello OpenClaw agli id nativi della CLI      |
| `sessionArg` / `sessionArgs`              | Come passare un id sessione                                 |
| `sessionMode`                             | `always`, `existing` o `none`                               |
| `sessionIdFields`                         | Campi JSON che OpenClaw legge dall'output della CLI         |
| `systemPromptArg` / `systemPromptFileArg` | Trasporto del prompt di sistema                             |
| `systemPromptWhen`                        | `first`, `always` o `never`                                 |
| `imageArg` / `imageMode`                  | Supporto percorso immagine                                  |
| `serialize`                               | Mantiene ordinate le esecuzioni dello stesso backend        |
| `reliability.watchdog`                    | Regolazione timeout senza output                            |

Preferisci la configurazione statica più piccola che corrisponde alla CLI.
Aggiungi callback del plugin solo per comportamenti che appartengono davvero al
backend.

## Hook backend avanzati

`CliBackendPlugin` può anche definire:

| Hook                               | Uso                                                    |
| ---------------------------------- | ------------------------------------------------------ |
| `normalizeConfig(config, context)` | Riscrive la configurazione utente legacy dopo il merge |
| `resolveExecutionArgs(ctx)`        | Aggiunge flag con ambito richiesta come il thinking effort |
| `prepareExecution(ctx)`            | Crea bridge temporanei di auth o configurazione prima dell'avvio |
| `transformSystemPrompt(ctx)`       | Applica una trasformazione finale del prompt di sistema specifica della CLI |
| `textTransforms`                   | Sostituzioni bidirezionali prompt/output               |
| `defaultAuthProfileId`             | Preferisce un profilo auth OpenClaw specifico          |
| `authEpochMode`                    | Decide come le modifiche auth invalidano le sessioni CLI archiviate |
| `nativeToolMode`                   | Dichiara se la CLI ha strumenti nativi sempre attivi   |
| `bundleMcp` / `bundleMcpMode`      | Abilita il bridge tool MCP loopback di OpenClaw        |

Mantieni questi hook di proprietà del provider. Non aggiungere branch specifici
della CLI al core quando un hook backend può esprimere il comportamento.

## Bridge tool MCP

I backend CLI non ricevono i tool OpenClaw per impostazione predefinita. Se la
CLI può consumare una configurazione MCP, abilitala esplicitamente:

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
| `gemini-system-settings` | CLI che leggono impostazioni MCP dalla propria directory impostazioni di sistema |

Abilita il bridge solo quando la CLI può effettivamente consumarlo. Se la CLI ha
un proprio layer tool integrato che non può essere disabilitato, imposta
`nativeToolMode: "always-on"` così OpenClaw può fallire chiuso quando un
chiamante richiede nessun tool nativo.

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

Documenta l'override minimo di cui gli utenti avranno probabilmente bisogno. Di
solito è solo `command` quando il binario è fuori da `PATH`.

## Verifica

Per i plugin bundled, aggiungi un test mirato intorno al builder e alla
registrazione setup, quindi esegui la lane di test mirata del plugin:

```bash
pnpm test extensions/acme-cli
```

Per plugin locali o installati, verifica discovery e un'esecuzione reale del
modello:

```bash
openclaw plugins inspect acme-cli --runtime --json
openclaw agent --message "reply exactly: backend ok" --model acme-cli/acme-large
```

Se il backend supporta immagini o MCP, aggiungi uno smoke live che provi quei
percorsi con la CLI reale. Non affidarti all'ispezione statica per prompt,
immagine, MCP o comportamento di ripresa sessione.

## Checklist

<Check>`package.json` ha `openclaw.extensions` e entry runtime compilate per i package pubblicati</Check>
<Check>`openclaw.plugin.json` dichiara `cliBackends` e `activation.onStartup` intenzionale</Check>
<Check>`setup.cliBackends` è presente quando setup/discovery dei modelli deve vedere il backend a freddo</Check>
<Check>`api.registerCliBackend(...)` usa lo stesso id backend del manifest</Check>
<Check>Gli override utente sotto `agents.defaults.cliBackends.<id>` continuano a prevalere</Check>
<Check>Le impostazioni sessione, prompt di sistema, immagine e parser output corrispondono al contratto reale della CLI</Check>
<Check>Test mirati e almeno uno smoke CLI live provano il percorso backend</Check>

## Correlati

- [Backend CLI](/it/gateway/cli-backends) - configurazione utente e comportamento runtime
- [Creare plugin](/it/plugins/building-plugins) - basi di package e manifest
- [Panoramica del Plugin SDK](/it/plugins/sdk-overview) - riferimento API di registrazione
- [Manifest del plugin](/it/plugins/manifest) - `cliBackends` e descrittori setup
- [Agent harness](/it/plugins/sdk-agent-harness) - runtime agente esterni completi
