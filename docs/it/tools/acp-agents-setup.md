---
read_when:
    - Installazione o configurazione dell'harness acpx per Claude Code / Codex / Gemini CLI
    - Abilitare il ponte MCP plugin-tools o OpenClaw-tools
    - Configurazione delle modalità di autorizzazione ACP
summary: 'Configurazione degli agenti ACP: configurazione dell''harness acpx, configurazione del Plugin, autorizzazioni'
title: Agenti ACP — configurazione
x-i18n:
    generated_at: "2026-04-30T09:14:25Z"
    model: gpt-5.5
    provider: openai
    source_hash: 75b2667739311c8a7a8355967a801e7e3dde85c788b8051444f9c29c3289093b
    source_path: tools/acp-agents-setup.md
    workflow: 16
---

Per la panoramica, il runbook dell’operatore e i concetti, vedi [agenti ACP](/it/tools/acp-agents).

Le sezioni seguenti coprono la configurazione dell’harness acpx, la configurazione dei Plugin per i bridge MCP e la configurazione delle autorizzazioni.

Usa questa pagina solo quando stai configurando il percorso ACP/acpx. Per la configurazione del runtime app-server nativo di Codex, usa [Harness Codex](/it/plugins/codex-harness). Per le chiavi API OpenAI o la configurazione del provider di modelli OAuth di Codex, usa
[OpenAI](/it/providers/openai).

Codex ha due percorsi OpenClaw:

| Percorso                   | Configurazione/comando                                  | Pagina di configurazione                |
| -------------------------- | ------------------------------------------------------ | --------------------------------------- |
| App-server Codex nativo    | `/codex ...`, `agentRuntime.id: "codex"`               | [Harness Codex](/it/plugins/codex-harness) |
| Adattatore ACP Codex esplicito | `/acp spawn codex`, `runtime: "acp", agentId: "codex"` | Questa pagina                           |

Preferisci il percorso nativo, a meno che non ti serva esplicitamente il comportamento ACP/acpx.

## Supporto harness acpx (attuale)

Alias harness integrati acpx attuali:

- `claude`
- `codex`
- `copilot`
- `cursor` (Cursor CLI: `cursor-agent acp`)
- `droid`
- `gemini`
- `iflow`
- `kilocode`
- `kimi`
- `kiro`
- `openclaw`
- `opencode`
- `pi`
- `qwen`

Quando OpenClaw usa il backend acpx, preferisci questi valori per `agentId`, a meno che la tua configurazione acpx non definisca alias agente personalizzati.
Se la tua installazione locale di Cursor espone ancora ACP come `agent acp`, sostituisci il comando dell’agente `cursor` nella configurazione acpx invece di modificare il valore predefinito integrato.

L’uso diretto della CLI acpx può anche puntare ad adattatori arbitrari tramite `--agent <command>`, ma quella via di fuga grezza è una funzionalità della CLI acpx (non il normale percorso OpenClaw `agentId`).

Il controllo del modello dipende dalle capacità dell’adattatore. I riferimenti modello ACP di Codex vengono normalizzati da OpenClaw prima dell’avvio. Gli altri harness richiedono ACP `models` più il supporto di `session/set_model`; se un harness non espone né quella capacità ACP né un proprio flag di modello all’avvio, OpenClaw/acpx non può forzare una selezione del modello.

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
      "pi",
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

La configurazione del binding dei thread è specifica dell’adattatore di canale. Esempio per Discord:

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
        spawnAcpSessions: true,
      },
    },
  },
}
```

Se lo spawn ACP vincolato al thread non funziona, verifica prima il flag di funzionalità dell’adattatore:

- Discord: `channels.discord.threadBindings.spawnAcpSessions=true`

I binding della conversazione corrente non richiedono la creazione di thread figli. Richiedono un contesto di conversazione attivo e un adattatore di canale che esponga i binding di conversazione ACP.

Vedi [Riferimento configurazione](/it/gateway/configuration-reference).

## Configurazione dei Plugin per il backend acpx

Le installazioni nuove includono il Plugin runtime `acpx` in bundle abilitato per impostazione predefinita, quindi ACP di solito funziona senza un passaggio manuale di installazione del Plugin.

Inizia con:

```text
/acp doctor
```

Se hai disabilitato `acpx`, lo hai negato tramite `plugins.allow` / `plugins.deny`, oppure vuoi passare a un checkout di sviluppo locale, usa il percorso Plugin esplicito:

```bash
openclaw plugins install acpx
openclaw config set plugins.entries.acpx.enabled true
```

Installazione dell’area di lavoro locale durante lo sviluppo:

```bash
openclaw plugins install ./path/to/local/acpx-plugin
```

Poi verifica lo stato del backend:

```text
/acp doctor
```

### Configurazione del comando e della versione acpx

Per impostazione predefinita, il Plugin `acpx` in bundle registra il backend ACP incorporato senza avviare un agente ACP durante l’avvio del Gateway. Esegui `/acp doctor` per un probe live esplicito. Imposta `OPENCLAW_ACPX_RUNTIME_STARTUP_PROBE=1` solo quando hai bisogno che il Gateway sondi l’agente configurato all’avvio.

Sostituisci il comando o la versione nella configurazione del Plugin:

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

- `command` accetta un percorso assoluto, un percorso relativo (risolto dall’area di lavoro OpenClaw) o un nome di comando.
- `expectedVersion: "any"` disabilita la corrispondenza rigorosa della versione.
- I percorsi `command` personalizzati disabilitano l’installazione automatica locale del Plugin.

Vedi [Plugin](/it/tools/plugin).

### Installazione automatica delle dipendenze

Quando installi OpenClaw globalmente con `npm install -g openclaw`, le dipendenze runtime acpx (binari specifici della piattaforma) vengono installate automaticamente tramite un hook postinstall. Se l’installazione automatica non riesce, il Gateway si avvia comunque normalmente e segnala la dipendenza mancante tramite `openclaw acp doctor`.

### Bridge MCP degli strumenti Plugin

Per impostazione predefinita, le sessioni ACPX **non** espongono all’harness ACP gli strumenti registrati dai Plugin OpenClaw.

Se vuoi che agenti ACP come Codex o Claude Code chiamino strumenti dei Plugin OpenClaw installati, come il richiamo/archiviazione della memoria, abilita il bridge dedicato:

```bash
openclaw config set plugins.entries.acpx.config.pluginToolsMcpBridge true
```

Cosa fa:

- Inietta un server MCP integrato chiamato `openclaw-plugin-tools` nel bootstrap della sessione ACPX.
- Espone gli strumenti dei Plugin già registrati dai Plugin OpenClaw installati e abilitati.
- Mantiene la funzionalità esplicita e disattivata per impostazione predefinita.

Note su sicurezza e attendibilità:

- Questo amplia la superficie degli strumenti dell’harness ACP.
- Gli agenti ACP ottengono accesso solo agli strumenti Plugin già attivi nel Gateway.
- Trattalo come lo stesso confine di attendibilità del consentire a quei Plugin di essere eseguiti in OpenClaw stesso.
- Esamina i Plugin installati prima di abilitarlo.

I `mcpServers` personalizzati continuano a funzionare come prima. Il bridge integrato degli strumenti Plugin è una comodità aggiuntiva opt-in, non un sostituto della configurazione generica dei server MCP.

### Bridge MCP degli strumenti OpenClaw

Per impostazione predefinita, le sessioni ACPX inoltre **non** espongono gli strumenti OpenClaw integrati tramite MCP. Abilita il bridge separato degli strumenti core quando un agente ACP necessita di strumenti integrati selezionati come `cron`:

```bash
openclaw config set plugins.entries.acpx.config.openClawToolsMcpBridge true
```

Cosa fa:

- Inietta un server MCP integrato chiamato `openclaw-tools` nel bootstrap della sessione ACPX.
- Espone strumenti OpenClaw integrati selezionati. Il server iniziale espone `cron`.
- Mantiene l’esposizione degli strumenti core esplicita e disattivata per impostazione predefinita.

### Configurazione del timeout runtime

Il Plugin `acpx` in bundle imposta per impostazione predefinita i turni runtime incorporati su un timeout di 120 secondi. Questo dà agli harness più lenti, come Gemini CLI, tempo sufficiente per completare l’avvio e l’inizializzazione ACP. Sostituiscilo se il tuo host necessita di un limite runtime diverso:

```bash
openclaw config set plugins.entries.acpx.config.timeoutSeconds 180
```

Riavvia il Gateway dopo aver modificato questo valore.

### Configurazione dell’agente di probe di integrità

Quando `/acp doctor` o il probe di avvio opt-in controlla il backend, il Plugin `acpx` in bundle sonda un agente harness. Se `acp.allowedAgents` è impostato, per impostazione predefinita usa il primo agente consentito; altrimenti usa `codex`. Se il tuo deployment necessita di un agente ACP diverso per i controlli di integrità, imposta esplicitamente l’agente di probe:

```bash
openclaw config set plugins.entries.acpx.config.probeAgent claude
```

Riavvia il Gateway dopo aver modificato questo valore.

## Configurazione delle autorizzazioni

Le sessioni ACP vengono eseguite in modo non interattivo: non c’è alcun TTY per approvare o negare prompt di autorizzazione per scrittura su file ed esecuzione shell. Il Plugin acpx fornisce due chiavi di configurazione che controllano come vengono gestite le autorizzazioni:

Queste autorizzazioni harness ACPX sono separate dalle approvazioni exec di OpenClaw e separate dai flag di bypass dei vendor backend CLI come Claude CLI `--permission-mode bypassPermissions`. ACPX `approve-all` è l’interruttore di emergenza a livello di harness per le sessioni ACP.

### `permissionMode`

Controlla quali operazioni l’agente harness può eseguire senza prompt.

| Valore          | Comportamento                                            |
| --------------- | -------------------------------------------------------- |
| `approve-all`   | Approva automaticamente tutte le scritture su file e i comandi shell. |
| `approve-reads` | Approva automaticamente solo le letture; scritture ed exec richiedono prompt. |
| `deny-all`      | Nega tutti i prompt di autorizzazione.                   |

### `nonInteractivePermissions`

Controlla cosa succede quando verrebbe mostrato un prompt di autorizzazione ma non è disponibile alcun TTY interattivo (che è sempre il caso per le sessioni ACP).

| Valore | Comportamento                                                   |
| ------ | ---------------------------------------------------------------- |
| `fail` | Interrompe la sessione con `AcpRuntimeError`. **(predefinito)** |
| `deny` | Nega silenziosamente l’autorizzazione e continua (degradazione controllata). |

### Configurazione

Imposta tramite configurazione del Plugin:

```bash
openclaw config set plugins.entries.acpx.config.permissionMode approve-all
openclaw config set plugins.entries.acpx.config.nonInteractivePermissions fail
```

Riavvia il Gateway dopo aver modificato questi valori.

<Warning>
OpenClaw usa per impostazione predefinita `permissionMode=approve-reads` e `nonInteractivePermissions=fail`. Nelle sessioni ACP non interattive, qualsiasi scrittura o exec che attiva un prompt di autorizzazione può fallire con `AcpRuntimeError: Permission prompt unavailable in non-interactive mode`.

Se devi limitare le autorizzazioni, imposta `nonInteractivePermissions` su `deny` in modo che le sessioni degradino in modo controllato invece di arrestarsi in modo anomalo.
</Warning>

## Correlati

- [Agenti ACP](/it/tools/acp-agents) — panoramica, runbook dell’operatore, concetti
- [Sottoagenti](/it/tools/subagents)
- [Instradamento multi-agente](/it/concepts/multi-agent)
