---
read_when:
    - Installare o configurare l'harness acpx per Claude Code / Codex / Gemini CLI
    - |-
      Abilitare il bridge MCP plugin-tools o OpenClaw-tools♀♀♀♀♀♀analysis to=functions.read numerusformcommentary to=functions.read  qq天天中彩票commentary  天天中彩票无法json
      {"path":"docs/.i18n/glossary.it.json","offset":1,"limit":200}
    - Configurare le modalità di permesso ACP
summary: 'Configurare gli agenti ACP: configurazione dell''harness acpx, setup del Plugin, permessi'
title: Agenti ACP — configurazione
x-i18n:
    generated_at: "2026-04-24T09:03:25Z"
    model: gpt-5.4
    provider: openai
    source_hash: 7f1b34217b0709c85173ca13d952e996676b73b7ac7b9db91a5069e19ff76013
    source_path: tools/acp-agents-setup.md
    workflow: 15
---

Per la panoramica, il runbook dell'operatore e i concetti, vedi [Agenti ACP](/it/tools/acp-agents).
Questa pagina copre la configurazione dell'harness acpx, il setup del Plugin per i bridge MCP e
la configurazione dei permessi.

## Supporto attuale dell'harness acpx

Alias attuali integrati dell'harness acpx:

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

Quando OpenClaw usa il backend acpx, preferisci questi valori per `agentId` a meno che la tua configurazione acpx non definisca alias agente personalizzati.
Se la tua installazione locale di Cursor espone ancora ACP come `agent acp`, sovrascrivi il comando dell'agente `cursor` nella tua configurazione acpx invece di cambiare il valore predefinito integrato.

L'uso diretto della CLI acpx può anche puntare ad adapter arbitrari tramite `--agent <command>`, ma questa via di fuga raw è una funzionalità della CLI acpx (non il normale percorso `agentId` di OpenClaw).

## Configurazione richiesta

Baseline core ACP:

```json5
{
  acp: {
    enabled: true,
    // Facoltativo. Il valore predefinito è true; imposta false per mettere in pausa il dispatch ACP mantenendo i controlli /acp.
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

La configurazione del thread binding è specifica dell'adapter di canale. Esempio per Discord:

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

Se lo spawn ACP legato al thread non funziona, verifica prima il flag di funzionalità dell'adapter:

- Discord: `channels.discord.threadBindings.spawnAcpSessions=true`

I binding alla conversazione corrente non richiedono la creazione di thread figli. Richiedono un contesto di conversazione attivo e un adapter di canale che esponga binding di conversazione ACP.

Vedi [Riferimento della configurazione](/it/gateway/configuration-reference).

## Setup del Plugin per il backend acpx

Le installazioni nuove forniscono il Plugin runtime `acpx` incluso abilitato per impostazione predefinita, quindi ACP
di solito funziona senza un passaggio manuale di installazione del Plugin.

Inizia con:

```text
/acp doctor
```

Se hai disabilitato `acpx`, lo hai negato tramite `plugins.allow` / `plugins.deny`, oppure vuoi
passare a un checkout locale di sviluppo, usa il percorso esplicito del Plugin:

```bash
openclaw plugins install acpx
openclaw config set plugins.entries.acpx.enabled true
```

Installazione da workspace locale durante lo sviluppo:

```bash
openclaw plugins install ./path/to/local/acpx-plugin
```

Poi verifica lo stato del backend:

```text
/acp doctor
```

### Configurazione del comando e della versione di acpx

Per impostazione predefinita, il Plugin `acpx` incluso usa il proprio binario locale fissato del Plugin (`node_modules/.bin/acpx` dentro il pacchetto del Plugin). All'avvio registra il backend come non pronto e un job in background verifica `acpx --version`; se il binario manca o non corrisponde, esegue `npm install --omit=dev --no-save acpx@<pinned>` e ricontrolla. Il gateway resta non bloccante per tutto il tempo.

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
- `expectedVersion: "any"` disabilita il controllo rigoroso della versione.
- I percorsi `command` personalizzati disabilitano l'auto-installazione locale del Plugin.

Vedi [Plugin](/it/tools/plugin).

### Installazione automatica delle dipendenze

Quando installi OpenClaw globalmente con `npm install -g openclaw`, le dipendenze runtime di acpx
(binari specifici della piattaforma) vengono installate automaticamente
tramite un hook postinstall. Se l'installazione automatica fallisce, il gateway si avvia comunque
normalmente e segnala la dipendenza mancante tramite `openclaw acp doctor`.

### Bridge MCP degli strumenti del Plugin

Per impostazione predefinita, le sessioni ACPX **non** espongono agli harness ACP gli strumenti registrati dai Plugin OpenClaw.

Se vuoi che agenti ACP come Codex o Claude Code possano chiamare strumenti di Plugin OpenClaw installati,
come memory recall/store, abilita il bridge dedicato:

```bash
openclaw config set plugins.entries.acpx.config.pluginToolsMcpBridge true
```

Cosa fa:

- Inietta un server MCP integrato chiamato `openclaw-plugin-tools` nel bootstrap
  della sessione ACPX.
- Espone gli strumenti dei Plugin già registrati dai Plugin OpenClaw installati e abilitati.
- Mantiene la funzionalità esplicita e disattivata per impostazione predefinita.

Note di sicurezza e fiducia:

- Questo amplia la superficie degli strumenti dell'harness ACP.
- Gli agenti ACP ottengono accesso solo agli strumenti dei Plugin già attivi nel gateway.
- Tratta questo come lo stesso confine di fiducia che consente a quei Plugin di eseguire codice in
  OpenClaw stesso.
- Controlla i Plugin installati prima di abilitarlo.

I `mcpServers` personalizzati continuano a funzionare come prima. Il bridge integrato plugin-tools è una
comodità opt-in aggiuntiva, non un sostituto della configurazione generica dei server MCP.

### Bridge MCP degli strumenti OpenClaw

Per impostazione predefinita, le sessioni ACPX **non** espongono tramite
MCP nemmeno gli strumenti integrati di OpenClaw. Abilita il bridge separato degli strumenti core quando un agente ACP ha bisogno di strumenti integrati selezionati, come `cron`:

```bash
openclaw config set plugins.entries.acpx.config.openClawToolsMcpBridge true
```

Cosa fa:

- Inietta un server MCP integrato chiamato `openclaw-tools` nel bootstrap
  della sessione ACPX.
- Espone strumenti integrati selezionati di OpenClaw. Il server iniziale espone `cron`.
- Mantiene l'esposizione degli strumenti core esplicita e disattivata per impostazione predefinita.

### Configurazione del timeout runtime

Il Plugin `acpx` incluso imposta per impostazione predefinita a 120 secondi il timeout dei
turni runtime embedded. Questo concede agli harness più lenti, come Gemini CLI, abbastanza tempo per completare
l'avvio e l'inizializzazione ACP. Sovrascrivilo se il tuo host ha bisogno di un limite runtime diverso:

```bash
openclaw config set plugins.entries.acpx.config.timeoutSeconds 180
```

Riavvia il gateway dopo aver cambiato questo valore.

### Configurazione dell'agente di probe dello stato

Il Plugin `acpx` incluso esegue una probe di un harness agente mentre decide se
il backend runtime embedded è pronto. Per impostazione predefinita usa `codex`. Se la tua distribuzione
usa un agente ACP predefinito diverso, imposta l'agente di probe sullo stesso id:

```bash
openclaw config set plugins.entries.acpx.config.probeAgent claude
```

Riavvia il gateway dopo aver cambiato questo valore.

## Configurazione dei permessi

Le sessioni ACP vengono eseguite in modalità non interattiva — non c'è alcun TTY per approvare o negare prompt di permesso per scrittura su file ed esecuzione di shell. Il Plugin acpx fornisce due chiavi di configurazione che controllano come vengono gestiti i permessi:

Questi permessi degli harness ACPX sono separati dalle approvazioni exec di OpenClaw e separati dai flag di bypass del vendor del backend CLI come Claude CLI `--permission-mode bypassPermissions`. ACPX `approve-all` è l'interruttore break-glass a livello di harness per le sessioni ACP.

### `permissionMode`

Controlla quali operazioni l'agente harness può eseguire senza prompt.

| Valore          | Comportamento                                             |
| --------------- | --------------------------------------------------------- |
| `approve-all`   | Approva automaticamente tutte le scritture su file e i comandi shell. |
| `approve-reads` | Approva automaticamente solo le letture; scritture ed exec richiedono prompt. |
| `deny-all`      | Nega tutti i prompt di permesso.                          |

### `nonInteractivePermissions`

Controlla cosa succede quando dovrebbe essere mostrato un prompt di permesso ma non è disponibile un TTY interattivo (che è sempre il caso per le sessioni ACP).

| Valore | Comportamento                                                          |
| ------ | ---------------------------------------------------------------------- |
| `fail` | Interrompe la sessione con `AcpRuntimeError`. **(predefinito)**        |
| `deny` | Nega silenziosamente il permesso e continua (degrado graduale).        |

### Configurazione

Imposta tramite la configurazione del Plugin:

```bash
openclaw config set plugins.entries.acpx.config.permissionMode approve-all
openclaw config set plugins.entries.acpx.config.nonInteractivePermissions fail
```

Riavvia il gateway dopo aver cambiato questi valori.

> **Importante:** OpenClaw attualmente ha come predefiniti `permissionMode=approve-reads` e `nonInteractivePermissions=fail`. Nelle sessioni ACP non interattive, qualsiasi scrittura o exec che attivi un prompt di permesso può fallire con `AcpRuntimeError: Permission prompt unavailable in non-interactive mode`.
>
> Se hai bisogno di limitare i permessi, imposta `nonInteractivePermissions` su `deny` così le sessioni degradano gradualmente invece di andare in crash.

## Correlati

- [Agenti ACP](/it/tools/acp-agents) — panoramica, runbook dell'operatore, concetti
- [Sotto-agenti](/it/tools/subagents)
- [Instradamento multi-agent](/it/concepts/multi-agent)
