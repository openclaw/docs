---
read_when:
    - Installazione o configurazione dell’ambiente acpx per Claude Code / Codex / Gemini CLI
    - Abilitazione del bridge MCP plugin-tools o OpenClaw-tools
    - Configurazione delle modalità di autorizzazione ACP
summary: 'Configurazione degli agenti ACP: configurazione dell''harness acpx, configurazione del Plugin, autorizzazioni'
title: Agenti ACP — configurazione
x-i18n:
    generated_at: "2026-05-11T20:36:30Z"
    model: gpt-5.5
    provider: openai
    source_hash: 68515dc3c97e511dbbf257131e24f8e4de36b1eb47ff717ae1cc5b4980e85cdf
    source_path: tools/acp-agents-setup.md
    workflow: 16
---

Per la panoramica, il runbook dell’operatore e i concetti, consulta [agenti ACP](/it/tools/acp-agents).

Le sezioni seguenti coprono la configurazione dell’harness acpx, la configurazione del plugin per i bridge MCP e la configurazione delle autorizzazioni.

Usa questa pagina solo quando configuri il percorso ACP/acpx. Per la configurazione del runtime app-server nativo di Codex, usa [harness Codex](/it/plugins/codex-harness). Per le chiavi API OpenAI o la configurazione del provider di modelli OAuth di Codex, usa
[OpenAI](/it/providers/openai).

Codex ha due percorsi OpenClaw:

| Percorso                    | Configurazione/comando                                 | Pagina di configurazione                 |
| --------------------------- | ------------------------------------------------------ | ---------------------------------------- |
| App-server Codex nativo     | `/codex ...`, riferimenti agente `openai/gpt-*`        | [harness Codex](/it/plugins/codex-harness)  |
| Adattatore ACP Codex esplicito | `/acp spawn codex`, `runtime: "acp", agentId: "codex"` | Questa pagina                            |

Preferisci il percorso nativo, a meno che tu non abbia esplicitamente bisogno del comportamento ACP/acpx.

## Supporto dell’harness acpx (attuale)

Alias degli harness integrati acpx attuali:

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
Se la tua installazione locale di Cursor espone ancora ACP come `agent acp`, sovrascrivi il comando dell’agente `cursor` nella tua configurazione acpx invece di modificare il valore predefinito integrato.

L’uso diretto della CLI acpx può anche puntare ad adattatori arbitrari tramite `--agent <command>`, ma questa via di fuga grezza è una funzionalità della CLI acpx (non il normale percorso `agentId` di OpenClaw).

Il controllo del modello dipende dalle capacità dell’adattatore. I riferimenti modello ACP di Codex vengono normalizzati da OpenClaw prima dell’avvio. Gli altri harness richiedono ACP `models` più il supporto `session/set_model`; se un harness non espone né quella capacità ACP né un proprio flag di modello all’avvio, OpenClaw/acpx non può forzare una selezione del modello.

## Configurazione richiesta

Baseline ACP principale:

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
        spawnSessions: true,
      },
    },
  },
}
```

Se lo spawn ACP associato al thread non funziona, verifica prima il flag della funzionalità dell’adattatore:

- Discord: `channels.discord.threadBindings.spawnSessions=true`

I binding della conversazione corrente non richiedono la creazione di thread figli. Richiedono un contesto di conversazione attivo e un adattatore di canale che esponga binding di conversazione ACP.

Consulta [Riferimento configurazione](/it/gateway/configuration-reference).

## Configurazione del plugin per il backend acpx

Le installazioni pacchettizzate usano il plugin runtime ufficiale `@openclaw/acpx` per ACP.
Installalo e abilitalo prima di usare sessioni harness ACP:

```bash
openclaw plugins install @openclaw/acpx
openclaw config set plugins.entries.acpx.enabled true
```

I checkout dei sorgenti possono anche usare il plugin workspace locale dopo `pnpm install`.

Inizia con:

```text
/acp doctor
```

Se hai disabilitato `acpx`, lo hai negato tramite `plugins.allow` / `plugins.deny` o vuoi tornare al plugin pacchettizzato, usa il percorso del pacchetto esplicito:

```bash
openclaw plugins install @openclaw/acpx
openclaw config set plugins.entries.acpx.enabled true
```

Installazione del workspace locale durante lo sviluppo:

```bash
openclaw plugins install ./path/to/local/acpx-plugin
```

Poi verifica lo stato del backend:

```text
/acp doctor
```

### Configurazione del comando e della versione acpx

Per impostazione predefinita, il plugin `acpx` sonda il backend ACP incorporato durante l’avvio del Gateway e attende quella sonda prima del segnale `ready` del gateway. Imposta
`OPENCLAW_ACPX_RUNTIME_STARTUP_PROBE=0` per saltare la sonda di avvio e registrare invece il backend in modo lazy. Esegui `/acp doctor` per una sonda esplicita on-demand.

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
- I percorsi `command` personalizzati disabilitano l’installazione automatica locale al plugin.

Sovrascrivi il comando di un singolo agente ACP con argomenti strutturati quando un percorso o un valore di flag deve rimanere un singolo token argv:

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

- `agents.<id>.command` è l’eseguibile o la stringa di comando esistente per quell’agente ACP.
- `agents.<id>.args` è opzionale. Ogni elemento dell’array viene sottoposto a quoting shell prima che OpenClaw lo passi attraverso il registro di stringhe comando acpx corrente.

Consulta [Plugin](/it/tools/plugin).

### Installazione automatica delle dipendenze

Quando installi OpenClaw globalmente con `npm install -g openclaw`, le dipendenze runtime acpx (binari specifici della piattaforma) vengono installate automaticamente tramite un hook postinstall. Se l’installazione automatica non riesce, il gateway si avvia comunque normalmente e segnala la dipendenza mancante tramite `openclaw acp doctor`.

### Bridge MCP per gli strumenti dei plugin

Per impostazione predefinita, le sessioni ACPX **non** espongono gli strumenti registrati dai plugin OpenClaw all’harness ACP.

Se vuoi che agenti ACP come Codex o Claude Code chiamino strumenti dei plugin OpenClaw installati, come richiamo/archiviazione della memoria, abilita il bridge dedicato:

```bash
openclaw config set plugins.entries.acpx.config.pluginToolsMcpBridge true
```

Cosa fa:

- Inietta un server MCP integrato chiamato `openclaw-plugin-tools` nel bootstrap della sessione ACPX.
- Espone gli strumenti dei plugin già registrati dai plugin OpenClaw installati e abilitati.
- Mantiene la funzionalità esplicita e disattivata per impostazione predefinita.

Note su sicurezza e fiducia:

- Questo amplia la superficie degli strumenti dell’harness ACP.
- Gli agenti ACP ottengono accesso solo agli strumenti dei plugin già attivi nel gateway.
- Trattalo come lo stesso confine di fiducia che consente a quei plugin di eseguire in OpenClaw stesso.
- Esamina i plugin installati prima di abilitarlo.

I `mcpServers` personalizzati continuano a funzionare come prima. Il bridge integrato degli strumenti dei plugin è un’ulteriore comodità opt-in, non un sostituto della configurazione generica dei server MCP.

### Bridge MCP per gli strumenti OpenClaw

Per impostazione predefinita, anche le sessioni ACPX **non** espongono gli strumenti OpenClaw integrati tramite MCP. Abilita il bridge separato degli strumenti core quando un agente ACP ha bisogno di strumenti integrati selezionati come `cron`:

```bash
openclaw config set plugins.entries.acpx.config.openClawToolsMcpBridge true
```

Cosa fa:

- Inietta un server MCP integrato chiamato `openclaw-tools` nel bootstrap della sessione ACPX.
- Espone strumenti OpenClaw integrati selezionati. Il server iniziale espone `cron`.
- Mantiene l’esposizione degli strumenti core esplicita e disattivata per impostazione predefinita.

### Configurazione del timeout runtime

Il plugin `acpx` imposta per impostazione predefinita un timeout di 120 secondi per i turni del runtime incorporato. Questo concede agli harness più lenti, come Gemini CLI, tempo sufficiente per completare l’avvio e l’inizializzazione ACP. Sovrascrivilo se il tuo host richiede un limite runtime diverso:

```bash
openclaw config set plugins.entries.acpx.config.timeoutSeconds 180
```

Riavvia il gateway dopo aver modificato questo valore.

### Configurazione dell’agente per la sonda di stato

Quando `/acp doctor` o la sonda di avvio controlla il backend, il plugin `acpx` incluso sonda un agente harness. Se `acp.allowedAgents` è impostato, il valore predefinito è il primo agente consentito; altrimenti il valore predefinito è `codex`. Se il tuo deployment richiede un agente ACP diverso per i controlli di stato, imposta esplicitamente l’agente della sonda:

```bash
openclaw config set plugins.entries.acpx.config.probeAgent claude
```

Riavvia il gateway dopo aver modificato questo valore.

## Configurazione delle autorizzazioni

Le sessioni ACP vengono eseguite in modo non interattivo: non c’è alcun TTY per approvare o negare prompt di autorizzazione per scrittura file ed esecuzione shell. Il plugin acpx fornisce due chiavi di configurazione che controllano come vengono gestite le autorizzazioni:

Queste autorizzazioni degli harness ACPX sono separate dalle approvazioni exec di OpenClaw e separate dai flag di bypass dei vendor del backend CLI, come `--permission-mode bypassPermissions` di Claude CLI. ACPX `approve-all` è l’interruttore di emergenza a livello harness per le sessioni ACP.

### `permissionMode`

Controlla quali operazioni l’agente harness può eseguire senza prompt.

| Valore          | Comportamento                                           |
| --------------- | ------------------------------------------------------- |
| `approve-all`   | Approva automaticamente tutte le scritture file e i comandi shell. |
| `approve-reads` | Approva automaticamente solo le letture; scritture ed exec richiedono prompt. |
| `deny-all`      | Nega tutti i prompt di autorizzazione.                  |

### `nonInteractivePermissions`

Controlla cosa accade quando verrebbe mostrato un prompt di autorizzazione ma non è disponibile alcun TTY interattivo (che è sempre il caso per le sessioni ACP).

| Valore | Comportamento                                                     |
| ------ | ----------------------------------------------------------------- |
| `fail` | Interrompe la sessione con `AcpRuntimeError`. **(predefinito)**   |
| `deny` | Nega silenziosamente l’autorizzazione e continua (degradazione graduale). |

### Configurazione

Imposta tramite configurazione del plugin:

```bash
openclaw config set plugins.entries.acpx.config.permissionMode approve-all
openclaw config set plugins.entries.acpx.config.nonInteractivePermissions fail
```

Riavvia il gateway dopo aver modificato questi valori.

<Warning>
OpenClaw usa per impostazione predefinita `permissionMode=approve-reads` e `nonInteractivePermissions=fail`. Nelle sessioni ACP non interattive, qualsiasi scrittura o exec che attivi un prompt di autorizzazione può fallire con `AcpRuntimeError: Permission prompt unavailable in non-interactive mode`.

Se devi limitare le autorizzazioni, imposta `nonInteractivePermissions` su `deny` in modo che le sessioni degradino gradualmente invece di bloccarsi.
</Warning>

## Correlati

- [agenti ACP](/it/tools/acp-agents) — panoramica, runbook dell’operatore, concetti
- [Sub-agenti](/it/tools/subagents)
- [Routing multi-agente](/it/concepts/multi-agent)
