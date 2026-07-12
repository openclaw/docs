---
read_when:
    - Installazione o configurazione dell'harness acpx per Claude Code / Codex / Gemini CLI
    - Abilitazione del bridge MCP plugin-tools o OpenClaw-tools
    - Configurazione delle modalità di autorizzazione ACP
summary: 'Configurazione degli agenti ACP: configurazione dell''harness acpx, configurazione del plugin, autorizzazioni'
title: Agenti ACP — configurazione
x-i18n:
    generated_at: "2026-07-12T07:31:04Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 6a654c7513df0bd54dc69eecc45a408df76c852bcf1d9e932b960f4944fa4239
    source_path: tools/acp-agents-setup.md
    workflow: 16
---

Per una panoramica, il manuale operativo e i concetti, consulta [Agenti ACP](/it/tools/acp-agents).

Questa pagina descrive la configurazione dell'harness acpx, la configurazione dei plugin per i bridge MCP e la configurazione delle autorizzazioni.

Usa questa pagina solo quando configuri il percorso ACP/acpx. Per la configurazione del runtime app-server nativo di Codex, usa [Harness Codex](/it/plugins/codex-harness). Per le chiavi API OpenAI o la configurazione del provider di modelli OAuth di Codex, usa [OpenAI](/it/providers/openai).

Codex dispone di due percorsi OpenClaw:

| Percorso                   | Configurazione/comando                                  | Pagina di configurazione                |
| -------------------------- | ------------------------------------------------------ | --------------------------------------- |
| App-server nativo di Codex | `/codex ...`, riferimenti agente `openai/gpt-*`        | [Harness Codex](/it/plugins/codex-harness) |
| Adattatore ACP Codex esplicito | `/acp spawn codex`, `runtime: "acp", agentId: "codex"` | Questa pagina                           |

Preferisci il percorso nativo, a meno che non ti serva esplicitamente il comportamento ACP/acpx.

## Supporto dell'harness acpx (attuale)

Alias dell'harness acpx integrati (dalla dipendenza `acpx` bloccata):

| Alias        | Incapsula                                                                                                       |
| ------------ | --------------------------------------------------------------------------------------------------------------- |
| `claude`     | [Claude Code](https://claude.ai/code)                                                                           |
| `codex`      | [Codex CLI](https://codex.openai.com)                                                                           |
| `copilot`    | [GitHub Copilot CLI](https://docs.github.com/copilot/how-tos/copilot-chat/use-copilot-chat-in-the-command-line) |
| `cursor`     | [Cursor CLI](https://cursor.com/docs/cli/acp) (`cursor-agent acp`)                                              |
| `droid`      | [Factory Droid](https://www.factory.ai)                                                                         |
| `fast-agent` | [fast-agent](https://fast-agent.ai)                                                                             |
| `gemini`     | [Gemini CLI](https://github.com/google/gemini-cli)                                                              |
| `iflow`      | [iFlow CLI](https://github.com/iflow-ai/iflow-cli)                                                              |
| `kilocode`   | [Kilocode](https://kilocode.ai)                                                                                 |
| `kimi`       | [Kimi CLI](https://github.com/MoonshotAI/kimi-cli)                                                              |
| `kiro`       | [Kiro CLI](https://kiro.dev)                                                                                    |
| `mux`        | [Mux](https://mux.coder.com)                                                                                    |
| `opencode`   | [OpenCode](https://opencode.ai)                                                                                 |
| `openclaw`   | Bridge ACP di OpenClaw (`openclaw acp` nativo)                                                                  |
| `pi`         | [Agente di programmazione Pi](https://github.com/mariozechner/pi)                                               |
| `qoder`      | [Qoder CLI](https://docs.qoder.com/cli/acp)                                                                     |
| `qwen`       | [Qwen Code](https://github.com/QwenLM/qwen-code)                                                                |
| `trae`       | [Trae CLI](https://docs.trae.cn/cli)                                                                            |

Anche `factory-droid` e `factorydroid` vengono risolti nell'adattatore `droid` integrato.

Quando OpenClaw usa il backend acpx, preferisci questi valori per `agentId`, a meno che la configurazione acpx non definisca alias agente personalizzati.
Se l'installazione locale di Cursor espone ancora ACP come `agent acp`, sostituisci il comando dell'agente `cursor` nella configurazione acpx invece di modificare il valore predefinito integrato.

L'uso diretto della CLI acpx può anche indirizzare adattatori arbitrari tramite `--agent <command>`, ma questa via di fuga non elaborata è una funzionalità della CLI acpx, non il normale percorso `agentId` di OpenClaw.

Il controllo del modello dipende dalle funzionalità dell'adattatore. I riferimenti ai modelli ACP di Codex vengono normalizzati da OpenClaw prima dell'avvio. Gli altri harness richiedono la funzionalità ACP `models` insieme al supporto di `session/set_model`; se un harness non espone né tale funzionalità ACP né un proprio flag del modello all'avvio, OpenClaw/acpx non può imporre la selezione di un modello.

## Configurazione obbligatoria

Configurazione di base di ACP:

```json5
{
  acp: {
    enabled: true,
    // Facoltativo. Il valore predefinito è true; impostalo su false per sospendere l'invio ACP mantenendo i controlli /acp.
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
      "qwen",
    ],
    maxConcurrentSessions: 8,
    stream: {
      // I valori predefiniti sono coalesceIdleMs: 350, maxChunkChars: 1800; qui sono mostrati esplicitamente.
      coalesceIdleMs: 350,
      maxChunkChars: 1800,
    },
    runtime: {
      ttlMinutes: 120,
    },
  },
}
```

La configurazione dell'associazione ai thread è specifica dell'adattatore del canale. Esempio per Discord:

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
        // Il valore predefinito è già true; qui è mostrato esplicitamente.
        spawnSessions: true,
      },
    },
  },
}
```

Se la generazione ACP associata al thread non funziona, verifica prima il flag della funzionalità dell'adattatore:

- Discord: `channels.discord.threadBindings.spawnSessions=true`

Le associazioni alla conversazione corrente non richiedono la creazione di un thread figlio. Richiedono un contesto di conversazione attivo e un adattatore del canale che esponga le associazioni di conversazione ACP.

Consulta il [Riferimento alla configurazione](/it/gateway/configuration-reference).

## Configurazione del plugin per il backend acpx

Le installazioni da pacchetto usano il plugin di runtime ufficiale `@openclaw/acpx` per ACP.
Installalo e abilitalo prima di utilizzare le sessioni dell'harness ACP:

```bash
openclaw plugins install @openclaw/acpx
openclaw config set plugins.entries.acpx.enabled true
```

I checkout del codice sorgente possono anche usare il plugin dell'area di lavoro locale dopo `pnpm install`.

Inizia con:

```text
/acp doctor
```

Se hai disabilitato `acpx`, lo hai negato tramite `plugins.allow` / `plugins.deny` o vuoi tornare al plugin da pacchetto, usa il percorso esplicito del pacchetto:

```bash
openclaw plugins install @openclaw/acpx
openclaw config set plugins.entries.acpx.enabled true
```

Installazione dall'area di lavoro locale durante lo sviluppo:

```bash
openclaw plugins install ./path/to/local/acpx-plugin
```

Quindi verifica lo stato del backend:

```text
/acp doctor
```

### Verifica di avvio del runtime acpx

Il plugin `acpx` incorpora direttamente il runtime ACP (senza un file binario `acpx` separato né una versione da configurare). Per impostazione predefinita, registra il backend incorporato durante l'avvio del Gateway e attende una verifica di avvio prima del segnale `ready` del gateway. Imposta `OPENCLAW_ACPX_RUNTIME_STARTUP_PROBE=0` o `OPENCLAW_SKIP_ACPX_RUNTIME_PROBE=1` solo per script o ambienti che mantengono intenzionalmente disabilitata la verifica di avvio. Esegui `/acp doctor` per una verifica esplicita su richiesta.

Sostituisci il comando di un singolo agente ACP con argomenti strutturati quando un percorso o il valore di un flag deve rimanere un singolo token argv:

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

- `agents.<id>.command` è l'eseguibile o la stringa di comando esistente per tale agente ACP.
- `agents.<id>.args` è facoltativo. Ogni elemento dell'array viene racchiuso tra virgolette per la shell prima che OpenClaw lo trasmetta attraverso il registro corrente delle stringhe di comando acpx.

Consulta [Plugin](/it/tools/plugin).

### Download automatico degli adattatori

`acpx` scarica automaticamente gli adattatori ACP, ad esempio i bridge ACP di Claude e Codex, tramite `npx` al primo utilizzo. Non è necessario installare manualmente i pacchetti degli adattatori e non esiste un passaggio post-installazione separato per OpenClaw stesso. Se il download o l'avvio di un adattatore non riesce, `/acp doctor` segnala l'errore.

### Bridge MCP per gli strumenti dei plugin

Per impostazione predefinita, le sessioni ACPX **non** espongono all'harness ACP gli strumenti registrati dai plugin OpenClaw.

Se vuoi che gli agenti ACP come Codex o Claude Code richiamino gli strumenti dei plugin OpenClaw installati, ad esempio per recuperare o memorizzare dati in memoria, abilita il bridge dedicato:

```bash
openclaw config set plugins.entries.acpx.config.pluginToolsMcpBridge true
```

Effetti:

- Inserisce un server MCP integrato denominato `openclaw-plugin-tools` nell'avvio delle sessioni ACPX.
- Espone gli strumenti dei plugin già registrati dai plugin OpenClaw installati e abilitati.
- Mantiene la funzionalità esplicita e disabilitata per impostazione predefinita.

Note sulla sicurezza e sull'attendibilità:

- Questa opzione amplia la superficie degli strumenti dell'harness ACP.
- Gli agenti ACP ottengono accesso solo agli strumenti dei plugin già attivi nel gateway.
- Considerala parte dello stesso confine di attendibilità che si applica all'esecuzione di tali plugin in OpenClaw.
- Esamina i plugin installati prima di abilitarla.

I valori `mcpServers` personalizzati continuano a funzionare come prima. Il bridge integrato per gli strumenti dei plugin è un'ulteriore comodità facoltativa, non un sostituto della configurazione generica dei server MCP.

### Bridge MCP per gli strumenti OpenClaw

Per impostazione predefinita, le sessioni ACPX **non** espongono tramite MCP neanche gli strumenti OpenClaw integrati. Abilita il bridge separato per gli strumenti principali quando un agente ACP necessita di strumenti integrati selezionati, come `cron`:

```bash
openclaw config set plugins.entries.acpx.config.openClawToolsMcpBridge true
```

Effetti:

- Inserisce un server MCP integrato denominato `openclaw-tools` nell'avvio delle sessioni ACPX.
- Espone strumenti OpenClaw integrati selezionati. Il server iniziale espone `cron`.
- Mantiene esplicita l'esposizione degli strumenti principali e la disabilita per impostazione predefinita.

### Configurazione del timeout delle operazioni di runtime

Per impostazione predefinita, il plugin `acpx` concede 120 secondi alle operazioni di avvio e controllo del runtime incorporato. In questo modo gli harness più lenti, come Gemini CLI, dispongono del tempo sufficiente per completare l'avvio e l'inizializzazione di ACP. Modifica il valore se l'host richiede un limite operativo diverso:

```bash
openclaw config set plugins.entries.acpx.config.timeoutSeconds 180
```

I turni del runtime usano i timeout agente/esecuzione di OpenClaw, incluso `/acp timeout`.
`sessions_spawn` non accetta sostituzioni del timeout per singola chiamata; il percorso per l'operatore è `agents.defaults.subagents.runTimeoutSeconds`. Riavvia il gateway dopo aver modificato `timeoutSeconds`.

### Configurazione dell'agente per la verifica dello stato

Quando `/acp doctor` o la verifica di avvio controlla il backend, il plugin `acpx` incluso verifica un agente dell'harness. Se `acp.allowedAgents` è impostato, viene usato per impostazione predefinita il primo agente consentito; in caso contrario, il valore predefinito è `codex`. Se la distribuzione richiede un agente ACP diverso per le verifiche dello stato, imposta esplicitamente l'agente di verifica:

```bash
openclaw config set plugins.entries.acpx.config.probeAgent claude
```

Riavvia il gateway dopo aver modificato questo valore.

## Configurazione delle autorizzazioni

Le sessioni ACP vengono eseguite in modo non interattivo: non è disponibile una TTY per approvare o negare le richieste di autorizzazione alla scrittura dei file e all'esecuzione dei comandi della shell. Il plugin acpx fornisce due chiavi di configurazione che determinano la gestione delle autorizzazioni:

Queste autorizzazioni dell'harness ACPX sono distinte dalle approvazioni di esecuzione di OpenClaw e dai flag di esclusione del fornitore del backend CLI, come `--permission-mode bypassPermissions` della CLI di Claude. `approve-all` di ACPX è l'interruttore di emergenza a livello di harness per le sessioni ACP.

Per un confronto più ampio tra `tools.exec.mode` di OpenClaw, le approvazioni di Codex Guardian e le autorizzazioni dell'harness ACPX, consulta [Modalità di autorizzazione](/it/tools/permission-modes).

### `permissionMode`

Controlla quali operazioni l'agente dell'harness può eseguire senza richiedere conferma.

| Valore          | Comportamento                                                                          |
| --------------- | -------------------------------------------------------------------------------------- |
| `approve-all`   | Approva automaticamente tutte le scritture di file e i comandi della shell.            |
| `approve-reads` | Approva automaticamente solo le letture; scritture ed esecuzioni richiedono conferma. |
| `deny-all`      | Nega tutte le richieste di autorizzazione.                                              |

### `nonInteractivePermissions`

Controlla cosa accade quando dovrebbe essere mostrata una richiesta di autorizzazione ma non è disponibile alcuna TTY interattiva (come avviene sempre per le sessioni ACP).

| Valore | Comportamento                                                                           |
| ------ | --------------------------------------------------------------------------------------- |
| `fail` | Interrompe la sessione con `PermissionPromptUnavailableError`. **(impostazione predefinita)** |
| `deny` | Nega silenziosamente l'autorizzazione e prosegue (degradazione controllata).             |

### Configurazione

Imposta tramite la configurazione del Plugin:

```bash
openclaw config set plugins.entries.acpx.config.permissionMode approve-all
openclaw config set plugins.entries.acpx.config.nonInteractivePermissions fail
```

Riavvia il Gateway dopo aver modificato questi valori.

<Warning>
Le impostazioni predefinite di OpenClaw sono `permissionMode=approve-reads` e `nonInteractivePermissions=fail`. Nelle sessioni ACP non interattive, qualsiasi scrittura o esecuzione che attivi una richiesta di autorizzazione può non riuscire con `PermissionPromptUnavailableError: Permission prompt unavailable in non-interactive mode`.

Se devi limitare le autorizzazioni, imposta `nonInteractivePermissions` su `deny` affinché le sessioni subiscano una degradazione controllata anziché arrestarsi in modo anomalo.
</Warning>

## Contenuti correlati

- [Agenti ACP](/it/tools/acp-agents) — panoramica, manuale operativo, concetti
- [Sottoagenti](/it/tools/subagents)
- [Instradamento multi-agente](/it/concepts/multi-agent)
