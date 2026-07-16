---
read_when:
    - Installazione o configurazione dell'harness acpx per Claude Code / Codex / Gemini CLI
    - Abilitazione del bridge MCP plugin-tools o OpenClaw-tools
    - Configurazione delle modalità di autorizzazione ACP
summary: 'Configurazione degli agenti ACP: configurazione dell''harness acpx, configurazione dei plugin, autorizzazioni'
title: Agenti ACP — configurazione
x-i18n:
    generated_at: "2026-07-16T15:00:16Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 437c7b9ddeeb28aa68e6ef14cf64a32cd1a9d28cd1cdb1a597a5e8bd6c45c5ae
    source_path: tools/acp-agents-setup.md
    workflow: 16
---

Per la panoramica, il runbook operativo e i concetti, consultare [Agenti ACP](/it/tools/acp-agents).

Questa pagina illustra la configurazione dell'harness acpx, la configurazione del plugin per i bridge MCP e la configurazione delle autorizzazioni.

Usare questa pagina solo per configurare il percorso ACP/acpx. Per la configurazione del runtime app-server nativo di Codex, usare [Harness Codex](/it/plugins/codex-harness). Per
le chiavi API OpenAI o la configurazione del provider di modelli tramite OAuth di Codex, usare
[OpenAI](/it/providers/openai).

Codex dispone di due percorsi OpenClaw:

| Percorso                   | Configurazione/comando                                 | Pagina di configurazione                |
| -------------------------- | ------------------------------------------------------ | --------------------------------------- |
| App-server nativo di Codex | `/codex ...`, riferimenti agente `openai/gpt-*`         | [Harness Codex](/it/plugins/codex-harness) |
| Adattatore ACP Codex esplicito | `/acp spawn codex`, `runtime: "acp", agentId: "codex"` | Questa pagina                           |

Preferire il percorso nativo, a meno che non sia esplicitamente necessario il comportamento ACP/acpx.

## Supporto dell'harness acpx (attuale)

Alias integrati dell'harness acpx (dalla dipendenza `acpx` con versione bloccata):

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

Anche `factory-droid` e `factorydroid` vengono risolti nell'adattatore integrato `droid`.

Quando OpenClaw usa il backend acpx, preferire questi valori per `agentId`, a meno che la configurazione acpx non definisca alias agente personalizzati.
Se l'installazione locale di Cursor espone ancora ACP come `agent acp`, sostituire il comando agente `cursor` nella configurazione acpx anziché modificare il valore predefinito integrato.

L'uso diretto della CLI acpx può anche indirizzare adattatori arbitrari tramite `--agent <command>`, ma questa via di fuga non elaborata è una funzionalità della CLI acpx, non il normale percorso OpenClaw `agentId`.

Il controllo del modello dipende dalle capacità dell'adattatore. I riferimenti ai modelli ACP di Codex vengono
normalizzati da OpenClaw prima dell'avvio. Gli altri harness richiedono il supporto di ACP `models` e
`session/set_model`; se un harness non espone né tale capacità ACP
né un proprio flag del modello all'avvio, OpenClaw/acpx non può imporre la selezione di un modello.

## Configurazione obbligatoria

Configurazione di base di ACP core:

```json5
{
  acp: {
    enabled: true,
    // Facoltativo. Il valore predefinito è true; impostarlo su false per sospendere l'invio ACP mantenendo i controlli /acp.
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

Se la creazione ACP associata a un thread non funziona, verificare prima il flag della funzionalità dell'adattatore:

- Discord: `channels.discord.threadBindings.spawnSessions=true`

Le associazioni alla conversazione corrente non richiedono la creazione di thread secondari. Richiedono un contesto di conversazione attivo e un adattatore di canale che esponga le associazioni alle conversazioni ACP.

Consultare il [Riferimento di configurazione](/it/gateway/configuration-reference).

## Configurazione del plugin per il backend acpx

Le installazioni distribuite come pacchetto usano il plugin runtime ufficiale `@openclaw/acpx` per ACP.
Installarlo e abilitarlo prima di usare le sessioni dell'harness ACP:

```bash
openclaw plugins install @openclaw/acpx
openclaw config set plugins.entries.acpx.enabled true
```

I checkout del codice sorgente possono anche usare il plugin dell'area di lavoro locale dopo `pnpm install`.

Iniziare con:

```text
/acp doctor
```

Se `acpx` è stato disabilitato, negato tramite `plugins.allow` / `plugins.deny`, oppure si desidera
tornare al plugin distribuito come pacchetto, usare il percorso esplicito del pacchetto:

```bash
openclaw plugins install @openclaw/acpx
openclaw config set plugins.entries.acpx.enabled true
```

Installazione dell'area di lavoro locale durante lo sviluppo:

```bash
openclaw plugins install ./path/to/local/acpx-plugin
```

Verificare quindi lo stato del backend:

```text
/acp doctor
```

### Sonda di avvio del runtime acpx

Il plugin `acpx` incorpora direttamente il runtime ACP (senza alcun eseguibile `acpx` separato né
versione da configurare). Per impostazione predefinita, registra il backend incorporato durante
l'avvio del Gateway e attende una sonda di avvio prima del segnale `ready`
del Gateway. Impostare `OPENCLAW_ACPX_RUNTIME_STARTUP_PROBE=0` o
`OPENCLAW_SKIP_ACPX_RUNTIME_PROBE=1` solo per script o ambienti che
mantengono intenzionalmente disabilitata la sonda di avvio. Eseguire `/acp doctor` per una sonda esplicita
su richiesta.

Sostituire il comando di un singolo agente ACP con argomenti strutturati quando un percorso
o il valore di un flag deve rimanere un singolo token argv:

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
- `agents.<id>.args` è facoltativo. Ogni elemento dell'array viene racchiuso tra virgolette per la shell prima che OpenClaw lo passi attraverso il registro corrente delle stringhe di comando acpx.

Consultare [Plugin](/it/tools/plugin).

### Download automatico degli adattatori

`acpx` scarica automaticamente gli adattatori ACP, ad esempio i bridge ACP di Claude e Codex,
tramite `npx` al primo utilizzo. Non è necessario installare manualmente i pacchetti degli adattatori
e non esiste un passaggio postinstall separato per OpenClaw stesso. Se il download o l'avvio
di un adattatore non riesce, `/acp doctor` segnala l'errore.

### Bridge MCP per gli strumenti dei plugin

Per impostazione predefinita, le sessioni ACPX **non** espongono all'harness ACP gli strumenti registrati
dai plugin OpenClaw.

Per consentire agli agenti ACP, come Codex o Claude Code, di chiamare gli strumenti
dei plugin OpenClaw installati, come il recupero o l'archiviazione della memoria, abilitare il bridge dedicato:

```bash
openclaw config set plugins.entries.acpx.config.pluginToolsMcpBridge true
```

Funzionamento:

- Inserisce un server MCP integrato denominato `openclaw-plugin-tools` nella procedura di avvio
  della sessione ACPX.
- Espone gli strumenti dei plugin già registrati dai plugin OpenClaw installati
  e abilitati.
- Trasmette l'identità della sessione ACP attiva alle factory degli strumenti dei plugin, affinché
  gli strumenti con ambito agente rimangano nello spazio dei nomi di tale agente.
- Mantiene la funzionalità esplicita e disabilitata per impostazione predefinita.

Note sulla sicurezza e sull'attendibilità:

- Questa opzione amplia la superficie degli strumenti dell'harness ACP.
- Gli agenti ACP ottengono accesso solo agli strumenti dei plugin già attivi nel Gateway.
- Considerare questo limite di attendibilità equivalente a consentire a tali plugin di essere eseguiti
  all'interno di OpenClaw stesso.
- Esaminare i plugin installati prima di abilitarla.

I `mcpServers` personalizzati continuano a funzionare come in precedenza. Il bridge integrato per gli strumenti dei plugin è
una funzionalità aggiuntiva facoltativa, non un sostituto della configurazione generica dei server MCP.

### Bridge MCP per gli strumenti OpenClaw

Per impostazione predefinita, le sessioni ACPX **non** espongono tramite MCP neppure gli strumenti integrati
di OpenClaw. Abilitare il bridge separato per gli strumenti core quando un agente ACP necessita di strumenti
integrati selezionati, come `cron`:

```bash
openclaw config set plugins.entries.acpx.config.openClawToolsMcpBridge true
```

Funzionamento:

- Inserisce un server MCP integrato denominato `openclaw-tools` nella procedura di avvio
  della sessione ACPX.
- Espone strumenti integrati selezionati di OpenClaw. Il server iniziale espone `cron`.
- Mantiene esplicita e disabilitata per impostazione predefinita l'esposizione degli strumenti core.

### Configurazione del timeout delle operazioni del runtime

Il plugin `acpx` concede per impostazione predefinita 120
secondi alle operazioni di avvio e controllo del runtime incorporato. Ciò concede agli harness più lenti, come Gemini CLI, tempo sufficiente
per completare l'avvio e l'inizializzazione di ACP. Sostituire questo valore se l'host richiede un
limite operativo diverso:

```bash
openclaw config set plugins.entries.acpx.config.timeoutSeconds 180
```

I turni del runtime usano i timeout di agente/esecuzione di OpenClaw, incluso `/acp timeout`.
`sessions_spawn` non accetta sostituzioni del timeout per singola chiamata; il percorso per l'operatore
è `agents.defaults.subagents.runTimeoutSeconds`. Riavviare il Gateway dopo
aver modificato `timeoutSeconds`.

### Configurazione dell'agente per la sonda di integrità

Quando `/acp doctor` o la sonda di avvio verifica il backend, il plugin `acpx`
incluso esamina un agente dell'harness. Se `acp.allowedAgents` è impostato, il valore predefinito è
il primo agente consentito; altrimenti, il valore predefinito è `codex`. Se la distribuzione
richiede un agente ACP diverso per i controlli di integrità, impostare esplicitamente l'agente della sonda:

```bash
openclaw config set plugins.entries.acpx.config.probeAgent claude
```

Riavviare il Gateway dopo aver modificato questo valore.

## Configurazione delle autorizzazioni

Le sessioni ACP vengono eseguite in modo non interattivo: non è disponibile alcun TTY per approvare o negare le richieste di autorizzazione per la scrittura di file e l'esecuzione di comandi shell. Il Plugin acpx fornisce due chiavi di configurazione che controllano la gestione delle autorizzazioni:

Queste autorizzazioni dell'harness ACPX sono separate dalle approvazioni di esecuzione di OpenClaw e dai flag di bypass dei fornitori del backend CLI, come Claude CLI `--permission-mode bypassPermissions`. ACPX `approve-all` è l'interruttore di emergenza a livello di harness per le sessioni ACP.

Per un confronto più ampio tra `tools.exec.mode` di OpenClaw, le approvazioni di Codex Guardian
e le autorizzazioni dell'harness ACPX, vedere
[Modalità di autorizzazione](/it/tools/permission-modes).

### `permissionMode`

Controlla quali operazioni l'agente dell'harness può eseguire senza richiedere conferma.

| Valore           | Comportamento                                                  |
| --------------- | --------------------------------------------------------- |
| `approve-all`   | Approva automaticamente tutte le scritture di file e i comandi shell.          |
| `approve-reads` | Approva automaticamente solo le letture; le scritture e le esecuzioni richiedono conferma. |
| `deny-all`      | Nega tutte le richieste di autorizzazione.                              |

### `nonInteractivePermissions`

Controlla cosa accade quando dovrebbe essere mostrata una richiesta di autorizzazione ma non è disponibile alcun TTY interattivo (come avviene sempre per le sessioni ACP).

| Valore  | Comportamento                                                                 |
| ------ | ------------------------------------------------------------------------ |
| `fail` | Interrompe la sessione con `PermissionPromptUnavailableError`. **(predefinito)** |
| `deny` | Nega silenziosamente l'autorizzazione e prosegue (degradazione controllata).        |

### Configurazione

Impostare tramite la configurazione del Plugin:

```bash
openclaw config set plugins.entries.acpx.config.permissionMode approve-all
openclaw config set plugins.entries.acpx.config.nonInteractivePermissions fail
```

Riavviare il Gateway dopo aver modificato questi valori.

<Warning>
I valori predefiniti di OpenClaw sono `permissionMode=approve-reads` e `nonInteractivePermissions=fail`. Nelle sessioni ACP non interattive, qualsiasi scrittura o esecuzione che attivi una richiesta di autorizzazione può non riuscire con `PermissionPromptUnavailableError: Permission prompt unavailable in non-interactive mode`.

Se è necessario limitare le autorizzazioni, impostare `nonInteractivePermissions` su `deny`, in modo che le sessioni adottino una degradazione controllata anziché arrestarsi in modo anomalo.
</Warning>

## Correlati

- [Agenti ACP](/it/tools/acp-agents) — panoramica, runbook per gli operatori, concetti
- [Sottoagenti](/it/tools/subagents)
- [Instradamento multi-agente](/it/concepts/multi-agent)
