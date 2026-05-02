---
read_when:
    - Installazione o configurazione dell'ambiente di esecuzione acpx per Claude Code / Codex / Gemini CLI
    - Abilitare il ponte MCP plugin-tools o OpenClaw-tools
    - Configurazione delle modalità di autorizzazione ACP
summary: 'Configurazione degli agenti ACP: configurazione dell''harness acpx, configurazione del Plugin, autorizzazioni'
title: Agenti ACP — configurazione
x-i18n:
    generated_at: "2026-05-02T08:34:43Z"
    model: gpt-5.5
    provider: openai
    source_hash: 92a53744f13ad4301d40c04dd28bbc28ca9d0a21070c20ddbda55ae9f6673001
    source_path: tools/acp-agents-setup.md
    workflow: 16
---

Per la panoramica, il runbook dell'operatore e i concetti, vedi [agenti ACP](/it/tools/acp-agents).

Le sezioni seguenti trattano la configurazione dell'harness acpx, la configurazione del plugin per i bridge MCP e la configurazione delle autorizzazioni.

Usa questa pagina solo quando configuri il percorso ACP/acpx. Per la configurazione runtime nativa dell'app-server Codex, usa [harness Codex](/it/plugins/codex-harness). Per le chiavi API OpenAI o la configurazione del provider di modelli OAuth Codex, usa [OpenAI](/it/providers/openai).

Codex ha due percorsi OpenClaw:

| Percorso                   | Configurazione/comando                                  | Pagina di configurazione                |
| -------------------------- | ------------------------------------------------------ | --------------------------------------- |
| App-server Codex nativo    | `/codex ...`, `agentRuntime.id: "codex"`               | [harness Codex](/it/plugins/codex-harness) |
| Adattatore Codex ACP esplicito | `/acp spawn codex`, `runtime: "acp", agentId: "codex"` | Questa pagina                           |

Preferisci il percorso nativo salvo che tu abbia esplicitamente bisogno del comportamento ACP/acpx.

## Supporto harness acpx (attuale)

Alias harness integrati attuali di acpx:

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

Quando OpenClaw usa il backend acpx, preferisci questi valori per `agentId` salvo che la tua configurazione acpx definisca alias agente personalizzati.
Se la tua installazione locale di Cursor espone ancora ACP come `agent acp`, sovrascrivi il comando dell'agente `cursor` nella tua configurazione acpx invece di cambiare il valore predefinito integrato.

L'uso diretto della CLI acpx può anche puntare ad adattatori arbitrari tramite `--agent <command>`, ma quella via di fuga grezza è una funzionalità della CLI acpx (non il normale percorso `agentId` di OpenClaw).

Il controllo del modello dipende dalle capacità dell'adattatore. I riferimenti modello ACP di Codex vengono normalizzati da OpenClaw prima dell'avvio. Altri harness richiedono ACP `models` più supporto `session/set_model`; se un harness non espone né quella capacità ACP né un proprio flag di modello all'avvio, OpenClaw/acpx non può forzare una selezione del modello.

## Configurazione richiesta

Base ACP principale:

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

La configurazione del binding dei thread è specifica dell'adattatore del canale. Esempio per Discord:

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

I binding della conversazione corrente non richiedono la creazione di thread figli. Richiedono un contesto di conversazione attivo e un adattatore di canale che esponga binding di conversazione ACP.

Vedi [Riferimento configurazione](/it/gateway/configuration-reference).

## Configurazione del plugin per il backend acpx

Le installazioni pacchettizzate usano il plugin runtime ufficiale `@openclaw/acpx` per ACP.
Installalo e abilitalo prima di usare le sessioni harness ACP:

```bash
openclaw plugins install @openclaw/acpx
openclaw config set plugins.entries.acpx.enabled true
```

I checkout sorgente possono anche usare il plugin workspace locale dopo `pnpm install`.

Inizia con:

```text
/acp doctor
```

Se hai disabilitato `acpx`, lo hai negato tramite `plugins.allow` / `plugins.deny`, o vuoi tornare al plugin pacchettizzato, usa il percorso pacchetto esplicito:

```bash
openclaw plugins install @openclaw/acpx
openclaw config set plugins.entries.acpx.enabled true
```

Installazione workspace locale durante lo sviluppo:

```bash
openclaw plugins install ./path/to/local/acpx-plugin
```

Poi verifica lo stato del backend:

```text
/acp doctor
```

### Configurazione del comando e della versione acpx

Per impostazione predefinita, il plugin `acpx` registra il backend ACP incorporato senza avviare un agente ACP durante l'avvio del Gateway. Esegui `/acp doctor` per una sonda live esplicita. Imposta `OPENCLAW_ACPX_RUNTIME_STARTUP_PROBE=1` solo quando hai bisogno che il Gateway sondi l'agente configurato all'avvio.

Sovrascrivi il comando o la versione nella configurazione del plugin:

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
- I percorsi `command` personalizzati disabilitano l'installazione automatica locale del plugin.

Vedi [Plugin](/it/tools/plugin).

### Installazione automatica delle dipendenze

Quando installi OpenClaw globalmente con `npm install -g openclaw`, le dipendenze runtime di acpx (binari specifici per piattaforma) vengono installate automaticamente tramite un hook postinstall. Se l'installazione automatica fallisce, il gateway si avvia comunque normalmente e segnala la dipendenza mancante tramite `openclaw acp doctor`.

### Bridge MCP per gli strumenti plugin

Per impostazione predefinita, le sessioni ACPX **non** espongono gli strumenti registrati dai plugin OpenClaw all'harness ACP.

Se vuoi che agenti ACP come Codex o Claude Code chiamino strumenti plugin OpenClaw installati, come richiamo/archiviazione della memoria, abilita il bridge dedicato:

```bash
openclaw config set plugins.entries.acpx.config.pluginToolsMcpBridge true
```

Cosa fa:

- Inietta un server MCP integrato chiamato `openclaw-plugin-tools` nel bootstrap della sessione ACPX.
- Espone gli strumenti plugin già registrati dai plugin OpenClaw installati e abilitati.
- Mantiene la funzionalità esplicita e disattivata per impostazione predefinita.

Note su sicurezza e fiducia:

- Questo amplia la superficie degli strumenti dell'harness ACP.
- Gli agenti ACP ottengono accesso solo agli strumenti plugin già attivi nel gateway.
- Trattalo come lo stesso confine di fiducia che consente a quei plugin di eseguire in OpenClaw stesso.
- Rivedi i plugin installati prima di abilitarlo.

I `mcpServers` personalizzati continuano a funzionare come prima. Il bridge plugin-tools integrato è una comodità aggiuntiva facoltativa, non un sostituto della configurazione generica dei server MCP.

### Bridge MCP per gli strumenti OpenClaw

Per impostazione predefinita, le sessioni ACPX inoltre **non** espongono gli strumenti OpenClaw integrati tramite MCP. Abilita il bridge core-tools separato quando un agente ACP necessita di strumenti integrati selezionati come `cron`:

```bash
openclaw config set plugins.entries.acpx.config.openClawToolsMcpBridge true
```

Cosa fa:

- Inietta un server MCP integrato chiamato `openclaw-tools` nel bootstrap della sessione ACPX.
- Espone strumenti OpenClaw integrati selezionati. Il server iniziale espone `cron`.
- Mantiene l'esposizione degli strumenti core esplicita e disattivata per impostazione predefinita.

### Configurazione del timeout runtime

Il plugin `acpx` imposta per impostazione predefinita un timeout di 120 secondi per i turni runtime incorporati. Questo dà agli harness più lenti come Gemini CLI abbastanza tempo per completare l'avvio e l'inizializzazione ACP. Sovrascrivilo se il tuo host richiede un limite runtime diverso:

```bash
openclaw config set plugins.entries.acpx.config.timeoutSeconds 180
```

Riavvia il gateway dopo aver cambiato questo valore.

### Configurazione dell'agente della sonda di integrità

Quando `/acp doctor` o la sonda di avvio facoltativa controlla il backend, il plugin `acpx` incluso sonda un agente harness. Se `acp.allowedAgents` è impostato, usa per impostazione predefinita il primo agente consentito; altrimenti usa `codex`. Se il tuo deployment richiede un agente ACP diverso per i controlli di integrità, imposta esplicitamente l'agente della sonda:

```bash
openclaw config set plugins.entries.acpx.config.probeAgent claude
```

Riavvia il gateway dopo aver cambiato questo valore.

## Configurazione delle autorizzazioni

Le sessioni ACP vengono eseguite in modo non interattivo: non esiste una TTY per approvare o negare prompt di autorizzazione per scrittura file ed esecuzione shell. Il plugin acpx fornisce due chiavi di configurazione che controllano come vengono gestite le autorizzazioni:

Queste autorizzazioni harness ACPX sono separate dalle approvazioni exec di OpenClaw e separate dai flag di bypass dei vendor backend CLI, come Claude CLI `--permission-mode bypassPermissions`. ACPX `approve-all` è l'interruttore di emergenza a livello harness per le sessioni ACP.

### `permissionMode`

Controlla quali operazioni l'agente harness può eseguire senza prompt.

| Valore          | Comportamento                                             |
| --------------- | --------------------------------------------------------- |
| `approve-all`   | Approva automaticamente tutte le scritture file e i comandi shell. |
| `approve-reads` | Approva automaticamente solo le letture; scritture ed exec richiedono prompt. |
| `deny-all`      | Nega tutti i prompt di autorizzazione.                    |

### `nonInteractivePermissions`

Controlla cosa succede quando verrebbe mostrato un prompt di autorizzazione ma non è disponibile alcuna TTY interattiva (che è sempre il caso per le sessioni ACP).

| Valore | Comportamento                                                     |
| ------ | ----------------------------------------------------------------- |
| `fail` | Interrompe la sessione con `AcpRuntimeError`. **(predefinito)**   |
| `deny` | Nega silenziosamente l'autorizzazione e continua (degradazione graduale). |

### Configurazione

Imposta tramite configurazione del plugin:

```bash
openclaw config set plugins.entries.acpx.config.permissionMode approve-all
openclaw config set plugins.entries.acpx.config.nonInteractivePermissions fail
```

Riavvia il gateway dopo aver cambiato questi valori.

<Warning>
OpenClaw usa per impostazione predefinita `permissionMode=approve-reads` e `nonInteractivePermissions=fail`. Nelle sessioni ACP non interattive, qualsiasi scrittura o exec che attiva un prompt di autorizzazione può fallire con `AcpRuntimeError: Permission prompt unavailable in non-interactive mode`.

Se hai bisogno di limitare le autorizzazioni, imposta `nonInteractivePermissions` su `deny` in modo che le sessioni degradino gradualmente invece di bloccarsi.
</Warning>

## Correlati

- [agenti ACP](/it/tools/acp-agents) — panoramica, runbook dell'operatore, concetti
- [Sub-agenti](/it/tools/subagents)
- [Routing multi-agente](/it/concepts/multi-agent)
