---
read_when:
    - Vuoi un'automazione basata su eventi per /new, /reset, /stop e gli eventi del ciclo di vita dell'agente
    - Vuoi creare, installare o eseguire il debug degli hook
summary: 'Hook: automazione basata su eventi per comandi ed eventi del ciclo di vita'
title: Agganci
x-i18n:
    generated_at: "2026-05-03T21:27:30Z"
    model: gpt-5.5
    provider: openai
    source_hash: 15f0d120ccf7314a991da5d66e65e5c78375222a846ba01d7a04ddfe1f02cb32
    source_path: automation/hooks.md
    workflow: 16
---

Gli hook sono piccoli script che vengono eseguiti quando accade qualcosa all'interno del Gateway. Possono essere individuati dalle directory e ispezionati con `openclaw hooks`. Il Gateway carica gli hook interni solo dopo che hai abilitato gli hook o configurato almeno una voce hook, un pacchetto hook, un handler legacy o una directory hook aggiuntiva.

In OpenClaw esistono due tipi di hook:

- **Hook interni** (questa pagina): vengono eseguiti all'interno del Gateway quando si attivano eventi dell'agente, come `/new`, `/reset`, `/stop` o eventi del ciclo di vita.
- **Webhook**: endpoint HTTP esterni che consentono ad altri sistemi di avviare attività in OpenClaw. Vedi [Webhook](/it/automation/cron-jobs#webhooks).

Gli hook possono anche essere inclusi nei plugin. `openclaw hooks list` mostra sia gli hook autonomi sia gli hook gestiti dai plugin.

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
| `session:compact:before` | Prima che la compaction riassuma la cronologia           |
| `session:compact:after`  | Dopo il completamento della compaction                   |
| `session:patch`          | Quando le proprietà della sessione vengono modificate    |
| `agent:bootstrap`        | Prima dell'iniezione dei file di bootstrap del workspace |
| `gateway:startup`        | Dopo l'avvio dei canali e il caricamento degli hook      |
| `gateway:shutdown`       | Quando inizia l'arresto del gateway                      |
| `gateway:pre-restart`    | Prima di un riavvio previsto del gateway                 |
| `message:received`       | Messaggio in ingresso da qualsiasi canale                |
| `message:transcribed`    | Dopo il completamento della trascrizione audio           |
| `message:preprocessed`   | Dopo il completamento o il salto della pre-elaborazione di media e link |
| `message:sent`           | Messaggio in uscita consegnato                           |

## Scrivere hook

### Struttura degli hook

Ogni hook è una directory che contiene due file:

```
my-hook/
├── HOOK.md          # Metadata + documentation
└── handler.ts       # Handler implementation
```

### Formato HOOK.md

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
| `export`   | Export nominato da usare (predefinito: `"default"`) |
| `os`       | Piattaforme richieste (ad es. `["darwin", "linux"]`) |
| `requires` | Percorsi `bins`, `anyBins`, `env` o `config` richiesti |
| `always`   | Ignora i controlli di idoneità (booleano)            |
| `install`  | Metodi di installazione                              |

### Implementazione dell'handler

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

Ogni evento include: `type`, `action`, `sessionKey`, `timestamp`, `messages` (push per inviare all'utente) e `context` (dati specifici dell'evento). I contesti degli hook per agenti e plugin degli strumenti possono includere anche `trace`, un contesto di traccia diagnostica di sola lettura compatibile con W3C che i plugin possono passare nei log strutturati per la correlazione OTEL.

### Elementi principali del contesto degli eventi

**Eventi di comando** (`command:new`, `command:reset`): `context.sessionEntry`, `context.previousSessionEntry`, `context.commandSource`, `context.workspaceDir`, `context.cfg`.

**Eventi di messaggio** (`message:received`): `context.from`, `context.content`, `context.channelId`, `context.metadata` (dati specifici del provider inclusi `senderId`, `senderName`, `guildId`). `context.content` preferisce un corpo comando non vuoto per i messaggi simili a comandi, poi ripiega sul corpo in ingresso grezzo e sul corpo generico; non include arricchimenti solo per l'agente come cronologia del thread o riepiloghi dei link.

**Eventi di messaggio** (`message:sent`): `context.to`, `context.content`, `context.success`, `context.channelId`.

**Eventi di messaggio** (`message:transcribed`): `context.transcript`, `context.from`, `context.channelId`, `context.mediaPath`.

**Eventi di messaggio** (`message:preprocessed`): `context.bodyForAgent` (corpo arricchito finale), `context.from`, `context.channelId`.

**Eventi di bootstrap** (`agent:bootstrap`): `context.bootstrapFiles` (array mutabile), `context.agentId`.

**Eventi di patch della sessione** (`session:patch`): `context.sessionEntry`, `context.patch` (solo campi modificati), `context.cfg`. Solo i client privilegiati possono attivare eventi di patch.

**Eventi di Compaction**: `session:compact:before` include `messageCount`, `tokenCount`. `session:compact:after` aggiunge `compactedCount`, `summaryLength`, `tokensBefore`, `tokensAfter`.

`command:stop` osserva l'utente che emette `/stop`; riguarda il ciclo di vita dell'annullamento/comando, non è un gate di finalizzazione dell'agente. I plugin che devono ispezionare una risposta finale naturale e chiedere all'agente un ulteriore passaggio devono invece usare l'hook tipizzato del plugin `before_agent_finalize`. Vedi [Hook dei plugin](/it/plugins/hooks).

**Eventi del ciclo di vita del Gateway**: `gateway:shutdown` include `reason` e `restartExpectedMs` e si attiva quando inizia l'arresto del gateway. `gateway:pre-restart` include lo stesso contesto ma si attiva solo quando l'arresto fa parte di un riavvio previsto e viene fornito un valore finito di `restartExpectedMs`. Durante l'arresto, l'attesa di ogni hook del ciclo di vita è best-effort e limitata, così l'arresto continua se un handler si blocca.

## Rilevamento degli hook

Gli hook vengono individuati da queste directory, in ordine di precedenza crescente per l'override:

1. **Hook inclusi**: distribuiti con OpenClaw
2. **Hook dei plugin**: hook inclusi nei plugin installati
3. **Hook gestiti**: `~/.openclaw/hooks/` (installati dall'utente, condivisi tra workspace). Le directory aggiuntive da `hooks.internal.load.extraDirs` condividono questa precedenza.
4. **Hook del workspace**: `<workspace>/hooks/` (per agente, disabilitati per impostazione predefinita finché non vengono abilitati esplicitamente)

Gli hook del workspace possono aggiungere nuovi nomi di hook ma non possono sovrascrivere hook inclusi, gestiti o forniti da plugin con lo stesso nome.

Il Gateway salta il rilevamento degli hook interni all'avvio finché gli hook interni non sono configurati. Abilita un hook incluso o gestito con `openclaw hooks enable <name>`, installa un pacchetto hook oppure imposta `hooks.internal.enabled=true` per aderire. Quando abiliti un singolo hook nominato, il Gateway carica solo l'handler di quell'hook; `hooks.internal.enabled=true`, le directory hook aggiuntive e gli handler legacy aderiscono al rilevamento ampio.

### Pacchetti hook

I pacchetti hook sono pacchetti npm che esportano hook tramite `openclaw.hooks` in `package.json`. Installa con:

```bash
openclaw plugins install <path-or-spec>
```

Le specifiche npm sono solo da registry (nome pacchetto + versione esatta opzionale o dist-tag). Le specifiche Git/URL/file e gli intervalli semver vengono rifiutati.

## Hook inclusi

| Hook                  | Eventi                                            | Cosa fa                                                        |
| --------------------- | ------------------------------------------------- | -------------------------------------------------------------- |
| session-memory        | `command:new`, `command:reset`                    | Salva il contesto della sessione in `<workspace>/memory/`      |
| bootstrap-extra-files | `agent:bootstrap`                                 | Inietta file di bootstrap aggiuntivi da pattern glob           |
| command-logger        | `command`                                         | Registra tutti i comandi in `~/.openclaw/logs/commands.log`    |
| compaction-notifier   | `session:compact:before`, `session:compact:after` | Invia notifiche chat visibili quando la compaction della sessione inizia/termina |
| boot-md               | `gateway:startup`                                 | Esegue `BOOT.md` all'avvio del gateway                         |

Abilita qualsiasi hook incluso:

```bash
openclaw hooks enable <hook-name>
```

<a id="session-memory"></a>

### Dettagli di session-memory

Estrae gli ultimi 15 messaggi utente/assistente, genera uno slug descrittivo per il nome file tramite LLM e salva in `<workspace>/memory/YYYY-MM-DD-slug.md` usando la data locale dell'host. Richiede che `workspace.dir` sia configurato.

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

I percorsi si risolvono rispetto al workspace. Vengono caricati solo i basename di bootstrap riconosciuti (`AGENTS.md`, `SOUL.md`, `TOOLS.md`, `IDENTITY.md`, `USER.md`, `HEARTBEAT.md`, `BOOTSTRAP.md`, `MEMORY.md`).

<a id="command-logger"></a>

### Dettagli di command-logger

Registra ogni comando slash in `~/.openclaw/logs/commands.log`.

<a id="compaction-notifier"></a>

### Dettagli di compaction-notifier

Invia brevi messaggi di stato nella conversazione corrente quando OpenClaw inizia e termina la compaction della trascrizione della sessione. Questo rende i turni lunghi meno confusi sulle superfici di chat, perché l'utente può vedere che l'assistente sta riassumendo il contesto e continuerà dopo la compaction.

<a id="boot-md"></a>

### Dettagli di boot-md

Esegue `BOOT.md` dal workspace attivo all'avvio del gateway.

## Hook dei plugin

I plugin possono registrare hook tipizzati tramite il Plugin SDK per un'integrazione più profonda:
intercettare chiamate agli strumenti, modificare prompt, controllare il flusso dei messaggi e altro ancora.
Usa gli hook dei plugin quando hai bisogno di `before_tool_call`, `before_agent_reply`,
`before_install` o altri hook del ciclo di vita in-process.

Per il riferimento completo degli hook dei plugin, vedi [Hook dei plugin](/it/plugins/hooks).

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

Variabili d'ambiente per hook:

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

Directory hook aggiuntive:

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
Il formato di configurazione legacy dell'array `hooks.internal.handlers` è ancora supportato per compatibilità all'indietro, ma i nuovi hook devono usare il sistema basato sul rilevamento.
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

## Migliori pratiche

- **Mantieni rapidi i gestori.** Gli hook vengono eseguiti durante l'elaborazione dei comandi. Avvia il lavoro pesante senza attendere con `void processInBackground(event)`.
- **Gestisci gli errori in modo controllato.** Racchiudi le operazioni rischiose in try/catch; non generare eccezioni, così gli altri gestori possono essere eseguiti.
- **Filtra gli eventi in anticipo.** Ritorna immediatamente se il tipo/azione dell'evento non è pertinente.
- **Usa chiavi evento specifiche.** Preferisci `"events": ["command:new"]` a `"events": ["command"]` per ridurre il sovraccarico.

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

Controlla binari mancanti (PATH), variabili d'ambiente, valori di configurazione o compatibilità con il sistema operativo.

### Hook non in esecuzione

1. Verifica che l'hook sia abilitato: `openclaw hooks list`
2. Riavvia il processo Gateway in modo che gli hook vengano ricaricati.
3. Controlla i log del Gateway: `./scripts/clawlog.sh | grep hook`

## Correlati

- [Riferimento CLI: hook](/it/cli/hooks)
- [Webhook](/it/automation/cron-jobs#webhooks)
- [Hook dei Plugin](/it/plugins/hooks) — hook del ciclo di vita dei Plugin in-process
- [Configurazione](/it/gateway/configuration-reference#hooks)
