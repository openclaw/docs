---
read_when:
    - Installazione o configurazione dell'harness acpx per Claude Code / Codex / Gemini CLI
    - Abilitazione del bridge MCP plugin-tools o OpenClaw-tools
    - Configurazione delle modalità di autorizzazione ACP
summary: 'Configurazione degli agenti ACP: configurazione dell''harness acpx, configurazione del Plugin, autorizzazioni'
title: Agenti ACP — configurazione
x-i18n:
    generated_at: "2026-06-27T18:17:28Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: c56a4d3bfae71a5c91dffe7121cae6a5ae96d276d0c598251d48a60b5ffee5e5
    source_path: tools/acp-agents-setup.md
    workflow: 16
---

Per la panoramica, il runbook dell'operatore e i concetti, vedi [agenti ACP](/it/tools/acp-agents).

Le sezioni seguenti trattano la configurazione dell'harness acpx, la configurazione dei Plugin per i bridge MCP e la configurazione delle autorizzazioni.

Usa questa pagina solo quando stai configurando la route ACP/acpx. Per la configurazione nativa dell'ambiente di esecuzione app-server di Codex, usa [harness Codex](/it/plugins/codex-harness). Per le chiavi API OpenAI o la configurazione del provider di modelli Codex OAuth, usa [OpenAI](/it/providers/openai).

Codex ha due route OpenClaw:

| Route                      | Configurazione/comando                                  | Pagina di configurazione                 |
| -------------------------- | ------------------------------------------------------ | ---------------------------------------- |
| app-server Codex nativo    | `/codex ...`, riferimenti agente `openai/gpt-*`        | [harness Codex](/it/plugins/codex-harness)  |
| Adattatore Codex ACP esplicito | `/acp spawn codex`, `runtime: "acp", agentId: "codex"` | Questa pagina                            |

Preferisci la route nativa, a meno che tu non abbia esplicitamente bisogno del comportamento ACP/acpx.

## Supporto dell'harness acpx (attuale)

Alias harness integrati acpx attuali:

- `claude`
- `codex`
- `copilot`
- `cursor` (CLI Cursor: `cursor-agent acp`)
- `droid`
- `gemini`
- `iflow`
- `kilocode`
- `kimi`
- `kiro`
- `openclaw`
- `opencode`
- `qwen`

Quando OpenClaw usa il backend acpx, preferisci questi valori per `agentId`, a meno che la tua configurazione acpx non definisca alias agente personalizzati.
Se la tua installazione locale di Cursor espone ancora ACP come `agent acp`, sovrascrivi il comando dell'agente `cursor` nella tua configurazione acpx invece di modificare il valore predefinito integrato.

L'uso diretto della CLI acpx può anche indirizzare adattatori arbitrari tramite `--agent <command>`, ma quella via di uscita grezza è una funzionalità della CLI acpx (non il normale percorso `agentId` di OpenClaw).

Il controllo del modello dipende dalle capacità dell'adattatore. I riferimenti modello ACP di Codex vengono normalizzati da OpenClaw prima dell'avvio. Altri harness richiedono i `models` ACP più il supporto `session/set_model`; se un harness non espone né quella capacità ACP né il proprio flag modello di avvio, OpenClaw/acpx non può forzare una selezione del modello.

## Configurazione richiesta

Baseline ACP di base:

```json5
{
  acp: {
    enabled: true,
    // Optional. Default is true; set false to pause ACP dispatch while keeping /acp controls.
    dispatch: { enabled: true },
    backend: "acpx",
    defaultAgent: "codex",
    allowedAgents: [
      "claude",
      "codex",
      "copilot",
      "cursor",
      "droid",
      "gemini",
      "iflow",
      "kilocode",
      "kimi",
      "kiro",
      "openclaw",
      "opencode",
      "openclaw",
      "qwen",
    ],
    maxConcurrentSessions: 8,
    stream: {
      coalesceIdleMs: 300,
      maxChunkChars: 1200,
    },
    runtime: {
      ttlMinutes: 120,
    },
  },
}
```

La configurazione del binding dei thread è specifica dell'adattatore di canale. Esempio per Discord:

```json5
{
  session: {
    threadBindings: {
      enabled: true,
      idleHours: 24,
      maxAgeHours: 0,
    },
  },
  channels: {
    discord: {
      threadBindings: {
        enabled: true,
        spawnSessions: true,
      },
    },
  },
}
```

Se lo spawn ACP vincolato al thread non funziona, verifica prima il flag di funzionalità dell'adattatore:

- Discord: `channels.discord.threadBindings.spawnSessions=true`

I binding della conversazione corrente non richiedono la creazione di thread figlio. Richiedono un contesto di conversazione attivo e un adattatore di canale che esponga i binding di conversazione ACP.

Vedi [Riferimento di configurazione](/it/gateway/configuration-reference).

## Configurazione dei Plugin per il backend acpx

Le installazioni pacchettizzate usano il Plugin runtime ufficiale `@openclaw/acpx` per ACP.
Installalo e abilitalo prima di usare le sessioni harness ACP:

```bash
openclaw plugins install @openclaw/acpx
openclaw config set plugins.entries.acpx.enabled true
```

I checkout sorgente possono anche usare il Plugin workspace locale dopo `pnpm install`.

Inizia con:

```text
/acp doctor
```

Se hai disabilitato `acpx`, lo hai negato tramite `plugins.allow` / `plugins.deny`, o vuoi tornare al Plugin pacchettizzato, usa il percorso pacchetto esplicito:

```bash
openclaw plugins install @openclaw/acpx
openclaw config set plugins.entries.acpx.enabled true
```

Installazione workspace locale durante lo sviluppo:

```bash
openclaw plugins install ./path/to/local/acpx-plugin
```

Quindi verifica lo stato del backend:

```text
/acp doctor
```

### Configurazione del comando e della versione acpx

Per impostazione predefinita, il Plugin `acpx` registra il backend ACP incorporato durante l'avvio del Gateway e attende la sonda di avvio del runtime incorporato prima del segnale `ready` del gateway. Imposta `OPENCLAW_ACPX_RUNTIME_STARTUP_PROBE=0` o `OPENCLAW_SKIP_ACPX_RUNTIME_PROBE=1` solo per script o ambienti che mantengono intenzionalmente disabilitata la sonda di avvio. Esegui `/acp doctor` per una sonda esplicita su richiesta.

Sovrascrivi il comando o la versione nella configurazione del Plugin:

```json
{
  "plugins": {
    "entries": {
      "acpx": {
        "enabled": true,
        "config": {
          "command": "../acpx/dist/cli.js",
          "expectedVersion": "any"
        }
      }
    }
  }
}
```

- `command` accetta un percorso assoluto, un percorso relativo (risolto dal workspace OpenClaw) o un nome comando.
- `expectedVersion: "any"` disabilita la corrispondenza rigorosa della versione.
- I percorsi `command` personalizzati disabilitano l'installazione automatica locale al Plugin.

Sovrascrivi il comando di un singolo agente ACP con argomenti strutturati quando un percorso o un valore flag deve rimanere un singolo token argv:

```json
{
  "plugins": {
    "entries": {
      "acpx": {
        "enabled": true,
        "config": {
          "agents": {
            "claude": {
              "command": "node",
              "args": ["/path/to/custom adapter.mjs", "--verbose"]
            }
          }
        }
      }
    }
  }
}
```

- `agents.<id>.command` è l'eseguibile o la stringa comando esistente per quell'agente ACP.
- `agents.<id>.args` è facoltativo. Ogni elemento dell'array viene quotato per la shell prima che OpenClaw lo passi attraverso il registro corrente delle stringhe comando acpx.

Vedi [Plugin](/it/tools/plugin).

### Installazione automatica delle dipendenze

Quando installi OpenClaw globalmente con `npm install -g openclaw`, le dipendenze runtime acpx (binari specifici della piattaforma) vengono installate automaticamente tramite un hook postinstall. Se l'installazione automatica non riesce, il gateway si avvia comunque normalmente e segnala la dipendenza mancante tramite `openclaw acp doctor`.

### Bridge MCP degli strumenti Plugin

Per impostazione predefinita, le sessioni ACPX **non** espongono gli strumenti registrati dai Plugin OpenClaw all'harness ACP.

Se vuoi che agenti ACP come Codex o Claude Code chiamino strumenti Plugin OpenClaw installati, come richiamo/archiviazione della memoria, abilita il bridge dedicato:

```bash
openclaw config set plugins.entries.acpx.config.pluginToolsMcpBridge true
```

Cosa fa:

- Inietta un server MCP integrato denominato `openclaw-plugin-tools` nel bootstrap della sessione ACPX.
- Espone gli strumenti Plugin già registrati dai Plugin OpenClaw installati e abilitati.
- Mantiene la funzionalità esplicita e disabilitata per impostazione predefinita.

Note su sicurezza e fiducia:

- Questo amplia la superficie degli strumenti dell'harness ACP.
- Gli agenti ACP ottengono accesso solo agli strumenti Plugin già attivi nel gateway.
- Consideralo lo stesso confine di fiducia di consentire a quei Plugin di essere eseguiti in OpenClaw stesso.
- Esamina i Plugin installati prima di abilitarlo.

I `mcpServers` personalizzati continuano a funzionare come prima. Il bridge integrato degli strumenti Plugin è una comodità aggiuntiva opt-in, non un sostituto della configurazione generica dei server MCP.

### Bridge MCP degli strumenti OpenClaw

Per impostazione predefinita, le sessioni ACPX inoltre **non** espongono gli strumenti OpenClaw integrati tramite MCP. Abilita il bridge separato degli strumenti core quando un agente ACP ha bisogno di strumenti integrati selezionati come `cron`:

```bash
openclaw config set plugins.entries.acpx.config.openClawToolsMcpBridge true
```

Cosa fa:

- Inietta un server MCP integrato denominato `openclaw-tools` nel bootstrap della sessione ACPX.
- Espone strumenti OpenClaw integrati selezionati. Il server iniziale espone `cron`.
- Mantiene l'esposizione degli strumenti core esplicita e disabilitata per impostazione predefinita.

### Configurazione del timeout delle operazioni runtime

Il Plugin `acpx` concede per impostazione predefinita 120 secondi alle operazioni di avvio e controllo del runtime incorporato. Questo dà ad harness più lenti, come Gemini CLI, abbastanza tempo per completare l'avvio e l'inizializzazione ACP. Sovrascrivilo se il tuo host necessita di un limite operativo diverso:

```bash
openclaw config set plugins.entries.acpx.config.timeoutSeconds 180
```

I turni runtime usano i timeout agente/esecuzione di OpenClaw, incluso `/acp timeout`.
`sessions_spawn` non accetta override del timeout per chiamata. Riavvia il gateway dopo aver modificato questo valore.

### Configurazione dell'agente per la sonda di stato

Quando `/acp doctor` o la sonda di avvio controlla il backend, il Plugin `acpx` incluso esegue la sonda su un agente harness. Se `acp.allowedAgents` è impostato, usa per impostazione predefinita il primo agente consentito; altrimenti usa per impostazione predefinita `codex`. Se la tua distribuzione richiede un agente ACP diverso per i controlli di stato, imposta esplicitamente l'agente della sonda:

```bash
openclaw config set plugins.entries.acpx.config.probeAgent claude
```

Riavvia il gateway dopo aver modificato questo valore.

## Configurazione delle autorizzazioni

Le sessioni ACP vengono eseguite in modo non interattivo: non c'è una TTY per approvare o negare prompt di autorizzazione per scrittura su file ed esecuzione shell. Il Plugin acpx fornisce due chiavi di configurazione che controllano come vengono gestite le autorizzazioni:

Queste autorizzazioni harness ACPX sono separate dalle approvazioni exec di OpenClaw e separate dai flag di bypass dei fornitori backend CLI, come Claude CLI `--permission-mode bypassPermissions`. ACPX `approve-all` è l'interruttore di emergenza a livello harness per le sessioni ACP.

Per il confronto più ampio tra `tools.exec.mode` di OpenClaw, le approvazioni Codex Guardian e le autorizzazioni harness ACPX, vedi [Modalità di autorizzazione](/it/tools/permission-modes).

### `permissionMode`

Controlla quali operazioni l'agente harness può eseguire senza prompt.

| Valore          | Comportamento                                             |
| --------------- | ---------------------------------------------------------- |
| `approve-all`   | Approva automaticamente tutte le scritture su file e i comandi shell. |
| `approve-reads` | Approva automaticamente solo le letture; scritture ed exec richiedono prompt. |
| `deny-all`      | Nega tutti i prompt di autorizzazione.                     |

### `nonInteractivePermissions`

Controlla cosa accade quando verrebbe mostrato un prompt di autorizzazione ma non è disponibile alcuna TTY interattiva (che è sempre il caso per le sessioni ACP).

| Valore | Comportamento                                                   |
| ------ | ---------------------------------------------------------------- |
| `fail` | Interrompe la sessione con `AcpRuntimeError`. **(predefinito)**  |
| `deny` | Nega silenziosamente l'autorizzazione e continua (degradazione graduale). |

### Configurazione

Imposta tramite configurazione del Plugin:

```bash
openclaw config set plugins.entries.acpx.config.permissionMode approve-all
openclaw config set plugins.entries.acpx.config.nonInteractivePermissions fail
```

Riavvia il gateway dopo aver modificato questi valori.

<Warning>
OpenClaw usa per impostazione predefinita `permissionMode=approve-reads` e `nonInteractivePermissions=fail`. Nelle sessioni ACP non interattive, qualsiasi scrittura o exec che attiva un prompt di autorizzazione può fallire con `AcpRuntimeError: Permission prompt unavailable in non-interactive mode`.

Se devi limitare le autorizzazioni, imposta `nonInteractivePermissions` su `deny` affinché le sessioni degradino gradualmente invece di arrestarsi in modo anomalo.
</Warning>

## Correlati

- [agenti ACP](/it/tools/acp-agents) — panoramica, runbook dell'operatore, concetti
- [Sotto-agenti](/it/tools/subagents)
- [Routing multi-agente](/it/concepts/multi-agent)
