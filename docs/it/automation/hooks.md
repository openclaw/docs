---
read_when:
    - Vuoi un'automazione basata su eventi per /new, /reset, /stop e gli eventi del ciclo di vita dell'agente
    - Vuoi creare, installare o eseguire il debug degli hook
summary: 'Hook: automazione basata sugli eventi per comandi ed eventi del ciclo di vita'
title: Agganci
x-i18n:
    generated_at: "2026-05-11T20:20:28Z"
    model: gpt-5.5
    provider: openai
    source_hash: 02f44dd117d52040ea1205521c6ecd4eb410510175e2312e2584a15e6df27d96
    source_path: automation/hooks.md
    workflow: 16
---

Gli hook sono piccoli script che vengono eseguiti quando accade qualcosa all’interno del Gateway. Possono essere rilevati dalle directory e ispezionati con `openclaw hooks`. Il Gateway carica gli hook interni solo dopo che abiliti gli hook o configuri almeno una voce di hook, un pacchetto di hook, un handler legacy o una directory di hook aggiuntiva.

In OpenClaw esistono due tipi di hook:

- **Hook interni** (questa pagina): vengono eseguiti all’interno del Gateway quando si attivano eventi dell’agente, come `/new`, `/reset`, `/stop` o eventi del ciclo di vita.
- **Webhook**: endpoint HTTP esterni che permettono ad altri sistemi di attivare lavoro in OpenClaw. Vedi [Webhook](/it/automation/cron-jobs#webhooks).

Gli hook possono anche essere inclusi nei Plugin. `openclaw hooks list` mostra sia gli hook autonomi sia gli hook gestiti dai Plugin.

## Avvio rapido

```bash
# List available hooks
openclaw hooks list

# Enable a hook
openclaw hooks enable session-memory

# Check hook status
openclaw hooks check

# Get detailed information
openclaw hooks info session-memory
```

## Tipi di evento

| Evento                   | Quando si attiva                                         |
| ------------------------ | -------------------------------------------------------- |
| `command:new`            | Comando `/new` emesso                                    |
| `command:reset`          | Comando `/reset` emesso                                  |
| `command:stop`           | Comando `/stop` emesso                                   |
| `command`                | Qualsiasi evento di comando (listener generale)          |
| `session:compact:before` | Prima che la Compaction riassuma la cronologia           |
| `session:compact:after`  | Dopo il completamento della Compaction                   |
| `session:patch`          | Quando le proprietà della sessione vengono modificate    |
| `agent:bootstrap`        | Prima che i file di bootstrap dell’area di lavoro vengano iniettati |
| `gateway:startup`        | Dopo l’avvio dei canali e il caricamento degli hook      |
| `gateway:shutdown`       | Quando inizia lo spegnimento del Gateway                 |
| `gateway:pre-restart`    | Prima di un riavvio previsto del Gateway                 |
| `message:received`       | Messaggio in ingresso da qualsiasi canale                |
| `message:transcribed`    | Dopo il completamento della trascrizione audio           |
| `message:preprocessed`   | Dopo il completamento o il salto della pre-elaborazione di media e link |
| `message:sent`           | Messaggio in uscita consegnato                           |

## Scrivere hook

### Struttura dell’hook

Ogni hook è una directory che contiene due file:

```
my-hook/
├── HOOK.md          # Metadata + documentation
└── handler.ts       # Handler implementation
```

### Formato di HOOK.md

```markdown
---
name: my-hook
description: "Short description of what this hook does"
metadata:
  { "openclaw": { "emoji": "🔗", "events": ["command:new"], "requires": { "bins": ["node"] } } }
---

# My Hook

Detailed documentation goes here.
```

**Campi dei metadati** (`metadata.openclaw`):

| Campo      | Descrizione                                          |
| ---------- | ---------------------------------------------------- |
| `emoji`    | Emoji visualizzata per la CLI                        |
| `events`   | Array di eventi da ascoltare                         |
| `export`   | Export nominato da usare (valore predefinito: `"default"`) |
| `os`       | Piattaforme richieste (ad es. `["darwin", "linux"]`) |
| `requires` | Percorsi `bins`, `anyBins`, `env` o `config` richiesti |
| `always`   | Ignora i controlli di idoneità (booleano)            |
| `install`  | Metodi di installazione                              |

### Implementazione dell’handler

```typescript
const handler = async (event) => {
  if (event.type !== "command" || event.action !== "new") {
    return;
  }

  console.log(`[my-hook] New command triggered`);
  // Your logic here

  // Optionally send message to user
  event.messages.push("Hook executed!");
};

export default handler;
```

Ogni evento include: `type`, `action`, `sessionKey`, `timestamp`, `messages` (push per inviare all’utente) e `context` (dati specifici dell’evento). I contesti degli hook dell’agente e degli strumenti Plugin possono includere anche `trace`, un contesto di traccia diagnostica di sola lettura compatibile con W3C che i Plugin possono passare ai log strutturati per la correlazione OTEL.

### Aspetti principali del contesto degli eventi

**Eventi di comando** (`command:new`, `command:reset`): `context.sessionEntry`, `context.previousSessionEntry`, `context.commandSource`, `context.workspaceDir`, `context.cfg`.

**Eventi di messaggio** (`message:received`): `context.from`, `context.content`, `context.channelId`, `context.metadata` (dati specifici del provider, inclusi `senderId`, `senderName`, `guildId`). `context.content` preferisce un corpo di comando non vuoto per i messaggi simili a comandi, poi ripiega sul corpo grezzo in ingresso e sul corpo generico; non include arricchimenti solo per l’agente, come la cronologia del thread o i riepiloghi dei link.

**Eventi di messaggio** (`message:sent`): `context.to`, `context.content`, `context.success`, `context.channelId`.

**Eventi di messaggio** (`message:transcribed`): `context.transcript`, `context.from`, `context.channelId`, `context.mediaPath`.

**Eventi di messaggio** (`message:preprocessed`): `context.bodyForAgent` (corpo finale arricchito), `context.from`, `context.channelId`.

**Eventi di bootstrap** (`agent:bootstrap`): `context.bootstrapFiles` (array modificabile), `context.agentId`.

**Eventi di patch della sessione** (`session:patch`): `context.sessionEntry`, `context.patch` (solo i campi modificati), `context.cfg`. Solo i client privilegiati possono attivare eventi di patch.

**Eventi di Compaction**: `session:compact:before` include `messageCount`, `tokenCount`. `session:compact:after` aggiunge `compactedCount`, `summaryLength`, `tokensBefore`, `tokensAfter`.

`command:stop` osserva l’utente che emette `/stop`; riguarda il ciclo di vita di annullamento/comando, non è un punto di controllo per la finalizzazione dell’agente. I Plugin che devono ispezionare una risposta finale naturale e chiedere all’agente un ulteriore passaggio devono usare invece l’hook Plugin tipizzato `before_agent_finalize`. Vedi [Hook Plugin](/it/plugins/hooks).

**Eventi del ciclo di vita del Gateway**: `gateway:shutdown` include `reason` e `restartExpectedMs` e si attiva quando inizia lo spegnimento del Gateway. `gateway:pre-restart` include lo stesso contesto, ma si attiva solo quando lo spegnimento fa parte di un riavvio previsto e viene fornito un valore finito di `restartExpectedMs`. Durante lo spegnimento, l’attesa di ogni hook del ciclo di vita è best-effort e limitata, così lo spegnimento continua se un handler si blocca.

Tra l’evento `gateway:shutdown` (o `gateway:pre-restart`) e il resto della sequenza di spegnimento, il Gateway attiva anche un hook Plugin tipizzato `session_end` per ogni sessione ancora attiva quando il processo si è fermato. Il valore `reason` dell’evento è `shutdown` per un arresto semplice SIGTERM/SIGINT e `restart` quando la chiusura è stata programmata come parte di un riavvio previsto. Questo svuotamento è limitato, così un handler `session_end` lento non può bloccare l’uscita del processo, e le sessioni già finalizzate tramite replace / reset / delete / Compaction vengono saltate per evitare doppie attivazioni.

## Rilevamento degli hook

Gli hook vengono rilevati da queste directory, in ordine crescente di precedenza di override:

1. **Hook inclusi**: distribuiti con OpenClaw
2. **Hook Plugin**: hook inclusi nei Plugin installati
3. **Hook gestiti**: `~/.openclaw/hooks/` (installati dall’utente, condivisi tra aree di lavoro). Le directory aggiuntive da `hooks.internal.load.extraDirs` condividono questa precedenza.
4. **Hook dell’area di lavoro**: `<workspace>/hooks/` (per agente, disabilitati per impostazione predefinita finché non vengono abilitati esplicitamente)

Gli hook dell’area di lavoro possono aggiungere nuovi nomi di hook, ma non possono sostituire hook inclusi, gestiti o forniti da Plugin con lo stesso nome.

Il Gateway salta il rilevamento degli hook interni all’avvio finché gli hook interni non sono configurati. Abilita un hook incluso o gestito con `openclaw hooks enable <name>`, installa un pacchetto di hook o imposta `hooks.internal.enabled=true` per aderire. Quando abiliti un singolo hook nominato, il Gateway carica solo l’handler di quell’hook; `hooks.internal.enabled=true`, le directory di hook aggiuntive e gli handler legacy aderiscono al rilevamento ampio.

### Pacchetti di hook

I pacchetti di hook sono pacchetti npm che esportano hook tramite `openclaw.hooks` in `package.json`. Installa con:

```bash
openclaw plugins install <path-or-spec>
```

Le specifiche npm sono solo da registry (nome del pacchetto + versione esatta opzionale o dist-tag). Le specifiche Git/URL/file e gli intervalli semver vengono rifiutati.

## Hook inclusi

| Hook                  | Eventi                                            | Cosa fa                                                      |
| --------------------- | ------------------------------------------------- | ------------------------------------------------------------ |
| session-memory        | `command:new`, `command:reset`                    | Salva il contesto della sessione in `<workspace>/memory/`    |
| bootstrap-extra-files | `agent:bootstrap`                                 | Inietta file di bootstrap aggiuntivi da pattern glob         |
| command-logger        | `command`                                         | Registra tutti i comandi in `~/.openclaw/logs/commands.log`  |
| compaction-notifier   | `session:compact:before`, `session:compact:after` | Invia avvisi visibili in chat quando la Compaction della sessione inizia/termina |
| boot-md               | `gateway:startup`                                 | Esegue `BOOT.md` all’avvio del Gateway                       |

Abilita qualsiasi hook incluso:

```bash
openclaw hooks enable <hook-name>
```

<a id="session-memory"></a>

### Dettagli di session-memory

Estrae gli ultimi 15 messaggi utente/assistente e li salva in `<workspace>/memory/YYYY-MM-DD-HHMM.md` usando la data locale dell’host. L’acquisizione della memoria viene eseguita in background, così gli acknowledgement di `/new` e `/reset` non vengono ritardati dalle letture della trascrizione o dalla generazione opzionale dello slug. Imposta `hooks.internal.entries.session-memory.llmSlug: true` per generare slug descrittivi dei nomi file con il modello configurato. Richiede che `workspace.dir` sia configurato.

<a id="bootstrap-extra-files"></a>

### Configurazione di bootstrap-extra-files

```json
{
  "hooks": {
    "internal": {
      "entries": {
        "bootstrap-extra-files": {
          "enabled": true,
          "paths": ["packages/*/AGENTS.md", "packages/*/TOOLS.md"]
        }
      }
    }
  }
}
```

I percorsi vengono risolti rispetto all’area di lavoro. Vengono caricati solo i nomi base di bootstrap riconosciuti (`AGENTS.md`, `SOUL.md`, `TOOLS.md`, `IDENTITY.md`, `USER.md`, `HEARTBEAT.md`, `BOOTSTRAP.md`, `MEMORY.md`).

<a id="command-logger"></a>

### Dettagli di command-logger

Registra ogni slash command in `~/.openclaw/logs/commands.log`.

<a id="compaction-notifier"></a>

### Dettagli di compaction-notifier

Invia brevi messaggi di stato nella conversazione corrente quando OpenClaw inizia e termina la compattazione della trascrizione della sessione. Questo rende i turni lunghi meno confusi sulle superfici di chat, perché l’utente può vedere che l’assistente sta riassumendo il contesto e continuerà dopo la Compaction.

<a id="boot-md"></a>

### Dettagli di boot-md

Esegue `BOOT.md` dall’area di lavoro attiva all’avvio del Gateway.

## Hook Plugin

I Plugin possono registrare hook tipizzati tramite il Plugin SDK per un’integrazione più profonda:
intercettare chiamate agli strumenti, modificare prompt, controllare il flusso dei messaggi e altro.
Usa gli hook Plugin quando hai bisogno di `before_tool_call`, `before_agent_reply`,
`before_install` o altri hook del ciclo di vita in-process.

Per il riferimento completo agli hook Plugin, vedi [Hook Plugin](/it/plugins/hooks).

## Configurazione

```json
{
  "hooks": {
    "internal": {
      "enabled": true,
      "entries": {
        "session-memory": { "enabled": true },
        "command-logger": { "enabled": false }
      }
    }
  }
}
```

Variabili d’ambiente per hook:

```json
{
  "hooks": {
    "internal": {
      "entries": {
        "my-hook": {
          "enabled": true,
          "env": { "MY_CUSTOM_VAR": "value" }
        }
      }
    }
  }
}
```

Directory di hook aggiuntive:

```json
{
  "hooks": {
    "internal": {
      "load": {
        "extraDirs": ["/path/to/more/hooks"]
      }
    }
  }
}
```

<Note>
Il formato di configurazione legacy dell'array `hooks.internal.handlers` è ancora supportato per la compatibilità con le versioni precedenti, ma i nuovi hook dovrebbero usare il sistema basato sul rilevamento.
</Note>

## Riferimento CLI

```bash
# List all hooks (add --eligible, --verbose, or --json)
openclaw hooks list

# Show detailed info about a hook
openclaw hooks info <hook-name>

# Show eligibility summary
openclaw hooks check

# Enable/disable
openclaw hooks enable <hook-name>
openclaw hooks disable <hook-name>
```

## Procedure consigliate

- **Mantieni gli handler veloci.** Gli hook vengono eseguiti durante l'elaborazione dei comandi. Avvia le attività pesanti in modalità fire-and-forget con `void processInBackground(event)`.
- **Gestisci gli errori in modo corretto.** Racchiudi le operazioni rischiose in try/catch; non generare eccezioni, così gli altri handler possono essere eseguiti.
- **Filtra gli eventi in anticipo.** Restituisci immediatamente se il tipo/azione dell'evento non è pertinente.
- **Usa chiavi evento specifiche.** Preferisci `"events": ["command:new"]` a `"events": ["command"]` per ridurre l'overhead.

## Risoluzione dei problemi

### Hook non rilevato

```bash
# Verify directory structure
ls -la ~/.openclaw/hooks/my-hook/
# Should show: HOOK.md, handler.ts

# List all discovered hooks
openclaw hooks list
```

### Hook non idoneo

```bash
openclaw hooks info my-hook
```

Controlla eventuali binari mancanti (PATH), variabili d'ambiente, valori di configurazione o compatibilità con il sistema operativo.

### Hook non eseguito

1. Verifica che l'hook sia abilitato: `openclaw hooks list`
2. Riavvia il processo gateway in modo che gli hook vengano ricaricati.
3. Controlla i log del Gateway: `./scripts/clawlog.sh | grep hook`

## Correlati

- [Riferimento CLI: hooks](/it/cli/hooks)
- [Webhook](/it/automation/cron-jobs#webhooks)
- [Hook dei plugin](/it/plugins/hooks) — hook del ciclo di vita dei plugin in-process
- [Configurazione](/it/gateway/configuration-reference#hooks)
