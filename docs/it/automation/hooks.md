---
read_when:
    - Vuoi un'automazione basata su eventi per /new, /reset, /stop e per gli eventi del ciclo di vita dell'agente
    - Vuoi creare, installare o risolvere problemi degli hook
summary: 'Hook: automazione guidata dagli eventi per comandi ed eventi del ciclo di vita'
title: Agganci
x-i18n:
    generated_at: "2026-05-05T08:25:48Z"
    model: gpt-5.5
    provider: openai
    source_hash: 321eb7a583d5e8c90d2c2026f6e1cf46cd207bef52213774b469a8d46b993967
    source_path: automation/hooks.md
    workflow: 16
---

Gli hook sono piccoli script che vengono eseguiti quando accade qualcosa all'interno del Gateway. Possono essere scoperti da directory e ispezionati con `openclaw hooks`. Il Gateway carica gli hook interni solo dopo che hai abilitato gli hook o configurato almeno una voce hook, un pacchetto hook, un gestore legacy o una directory hook aggiuntiva.

In OpenClaw esistono due tipi di hook:

- **Hook interni** (questa pagina): vengono eseguiti all'interno del Gateway quando si attivano eventi degli agenti, come `/new`, `/reset`, `/stop` o eventi del ciclo di vita.
- **Webhook**: endpoint HTTP esterni che consentono ad altri sistemi di attivare lavoro in OpenClaw. Vedi [Webhook](/it/automation/cron-jobs#webhooks).

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

| Evento                   | Quando si attiva                                          |
| ------------------------ | ---------------------------------------------------------- |
| `command:new`            | Comando `/new` emesso                                     |
| `command:reset`          | Comando `/reset` emesso                                   |
| `command:stop`           | Comando `/stop` emesso                                    |
| `command`                | Qualsiasi evento comando (listener generale)              |
| `session:compact:before` | Prima che la Compaction riassuma la cronologia             |
| `session:compact:after`  | Dopo il completamento della Compaction                     |
| `session:patch`          | Quando le proprietà della sessione vengono modificate      |
| `agent:bootstrap`        | Prima che vengano inseriti i file di bootstrap dell'area di lavoro |
| `gateway:startup`        | Dopo l'avvio dei canali e il caricamento degli hook        |
| `gateway:shutdown`       | Quando inizia l'arresto del Gateway                        |
| `gateway:pre-restart`    | Prima di un riavvio previsto del Gateway                   |
| `message:received`       | Messaggio in ingresso da qualsiasi canale                  |
| `message:transcribed`    | Dopo il completamento della trascrizione audio             |
| `message:preprocessed`   | Dopo il completamento o il salto della preelaborazione di contenuti multimediali e link |
| `message:sent`           | Messaggio in uscita consegnato                             |

## Scrivere hook

### Struttura degli hook

Ogni hook è una directory contenente due file:

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
| `export`   | Export denominato da usare (predefinito: `"default"`) |
| `os`       | Piattaforme richieste (ad es. `["darwin", "linux"]`) |
| `requires` | Percorsi `bins`, `anyBins`, `env` o `config` richiesti |
| `always`   | Ignora i controlli di idoneità (booleano)            |
| `install`  | Metodi di installazione                              |

### Implementazione del gestore

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

Ogni evento include: `type`, `action`, `sessionKey`, `timestamp`, `messages` (push per inviare all'utente) e `context` (dati specifici dell'evento). I contesti degli hook per agenti e strumenti Plugin possono includere anche `trace`, un contesto di traccia diagnostica di sola lettura compatibile con W3C che i Plugin possono passare nei log strutturati per la correlazione OTEL.

### Punti principali del contesto degli eventi

**Eventi comando** (`command:new`, `command:reset`): `context.sessionEntry`, `context.previousSessionEntry`, `context.commandSource`, `context.workspaceDir`, `context.cfg`.

**Eventi messaggio** (`message:received`): `context.from`, `context.content`, `context.channelId`, `context.metadata` (dati specifici del provider, inclusi `senderId`, `senderName`, `guildId`). `context.content` preferisce un corpo comando non vuoto per i messaggi simili a comandi, quindi ripiega sul corpo in ingresso grezzo e sul corpo generico; non include arricchimenti riservati all'agente, come cronologia del thread o riepiloghi dei link.

**Eventi messaggio** (`message:sent`): `context.to`, `context.content`, `context.success`, `context.channelId`.

**Eventi messaggio** (`message:transcribed`): `context.transcript`, `context.from`, `context.channelId`, `context.mediaPath`.

**Eventi messaggio** (`message:preprocessed`): `context.bodyForAgent` (corpo arricchito finale), `context.from`, `context.channelId`.

**Eventi di bootstrap** (`agent:bootstrap`): `context.bootstrapFiles` (array mutabile), `context.agentId`.

**Eventi patch di sessione** (`session:patch`): `context.sessionEntry`, `context.patch` (solo campi modificati), `context.cfg`. Solo i client privilegiati possono attivare eventi patch.

**Eventi Compaction**: `session:compact:before` include `messageCount`, `tokenCount`. `session:compact:after` aggiunge `compactedCount`, `summaryLength`, `tokensBefore`, `tokensAfter`.

`command:stop` osserva l'utente che emette `/stop`; è un ciclo di vita di annullamento/comando, non un gate di finalizzazione dell'agente. I Plugin che devono ispezionare una risposta finale naturale e chiedere all'agente un ulteriore passaggio dovrebbero usare invece l'hook Plugin tipizzato `before_agent_finalize`. Vedi [Hook dei Plugin](/it/plugins/hooks).

**Eventi del ciclo di vita del Gateway**: `gateway:shutdown` include `reason` e `restartExpectedMs` e si attiva quando inizia l'arresto del Gateway. `gateway:pre-restart` include lo stesso contesto, ma si attiva solo quando l'arresto fa parte di un riavvio previsto e viene fornito un valore finito di `restartExpectedMs`. Durante l'arresto, l'attesa di ogni hook del ciclo di vita è best effort e limitata, così l'arresto continua se un gestore si blocca.

## Scoperta degli hook

Gli hook vengono scoperti da queste directory, in ordine di precedenza di override crescente:

1. **Hook inclusi**: distribuiti con OpenClaw
2. **Hook Plugin**: hook inclusi nei Plugin installati
3. **Hook gestiti**: `~/.openclaw/hooks/` (installati dall'utente, condivisi tra le aree di lavoro). Le directory aggiuntive da `hooks.internal.load.extraDirs` condividono questa precedenza.
4. **Hook dell'area di lavoro**: `<workspace>/hooks/` (per agente, disabilitati per impostazione predefinita finché non vengono abilitati esplicitamente)

Gli hook dell'area di lavoro possono aggiungere nuovi nomi di hook, ma non possono sovrascrivere hook inclusi, gestiti o forniti da Plugin con lo stesso nome.

Il Gateway salta la scoperta degli hook interni all'avvio finché gli hook interni non sono configurati. Abilita un hook incluso o gestito con `openclaw hooks enable <name>`, installa un pacchetto hook oppure imposta `hooks.internal.enabled=true` per aderire esplicitamente. Quando abiliti un hook denominato, il Gateway carica solo il gestore di quell'hook; `hooks.internal.enabled=true`, le directory hook aggiuntive e i gestori legacy abilitano la scoperta ampia.

### Pacchetti hook

I pacchetti di hook sono pacchetti npm che esportano hook tramite `openclaw.hooks` in `package.json`. Installa con:

```bash
openclaw plugins install <path-or-spec>
```

Le specifiche npm sono solo da registry (nome del pacchetto + versione esatta opzionale o dist-tag). Le specifiche Git/URL/file e gli intervalli semver vengono rifiutati.

## Hook inclusi

| Hook                  | Eventi                                            | Cosa fa                                                        |
| --------------------- | ------------------------------------------------- | -------------------------------------------------------------- |
| session-memory        | `command:new`, `command:reset`                    | Salva il contesto della sessione in `<workspace>/memory/`      |
| bootstrap-extra-files | `agent:bootstrap`                                 | Inietta file di bootstrap aggiuntivi da pattern glob           |
| command-logger        | `command`                                         | Registra tutti i comandi in `~/.openclaw/logs/commands.log`    |
| compaction-notifier   | `session:compact:before`, `session:compact:after` | Invia avvisi di chat visibili quando la Compaction della sessione inizia/termina |
| boot-md               | `gateway:startup`                                 | Esegue `BOOT.md` quando il Gateway si avvia                    |

Abilita qualsiasi hook incluso:

```bash
openclaw hooks enable <hook-name>
```

<a id="session-memory"></a>

### dettagli di session-memory

Estrae gli ultimi 15 messaggi utente/assistente e li salva in `<workspace>/memory/YYYY-MM-DD-HHMM.md` usando la data locale dell'host. L'acquisizione della memoria viene eseguita in background, quindi le conferme di `/new` e `/reset` non sono ritardate dalla lettura della trascrizione o dalla generazione opzionale dello slug. Imposta `hooks.internal.entries.session-memory.llmSlug: true` per generare slug descrittivi per i nomi dei file con il modello configurato. Richiede che `workspace.dir` sia configurato.

<a id="bootstrap-extra-files"></a>

### configurazione di bootstrap-extra-files

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

I percorsi vengono risolti rispetto al workspace. Vengono caricati solo i nomi base di bootstrap riconosciuti (`AGENTS.md`, `SOUL.md`, `TOOLS.md`, `IDENTITY.md`, `USER.md`, `HEARTBEAT.md`, `BOOTSTRAP.md`, `MEMORY.md`).

<a id="command-logger"></a>

### dettagli di command-logger

Registra ogni comando slash in `~/.openclaw/logs/commands.log`.

<a id="compaction-notifier"></a>

### dettagli di compaction-notifier

Invia brevi messaggi di stato nella conversazione corrente quando OpenClaw inizia e termina la Compaction della trascrizione della sessione. Questo rende i turni lunghi meno confusi nelle superfici di chat, perché l'utente può vedere che l'assistente sta riepilogando il contesto e continuerà dopo la Compaction.

<a id="boot-md"></a>

### dettagli di boot-md

Esegue `BOOT.md` dal workspace attivo quando il Gateway si avvia.

## Hook dei Plugin

I Plugin possono registrare hook tipizzati tramite il Plugin SDK per un'integrazione più profonda:
intercettare chiamate agli strumenti, modificare prompt, controllare il flusso dei messaggi e altro.
Usa gli hook dei Plugin quando ti servono `before_tool_call`, `before_agent_reply`,
`before_install` o altri hook del ciclo di vita in-process.

Per il riferimento completo sugli hook dei Plugin, consulta [Hook dei Plugin](/it/plugins/hooks).

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
Il formato di configurazione legacy dell'array `hooks.internal.handlers` è ancora supportato per compatibilità all'indietro, ma i nuovi hook dovrebbero usare il sistema basato sulla discovery.
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

## Best practice

- **Mantieni i gestori veloci.** Gli hook vengono eseguiti durante l'elaborazione dei comandi. Esegui le operazioni pesanti senza attenderle con `void processInBackground(event)`.
- **Gestisci gli errori con eleganza.** Racchiudi le operazioni rischiose in try/catch; non generare eccezioni, così gli altri gestori possono essere eseguiti.
- **Filtra gli eventi in anticipo.** Restituisci immediatamente se il tipo/l'azione dell'evento non è rilevante.
- **Usa chiavi evento specifiche.** Preferisci `"events": ["command:new"]` a `"events": ["command"]` per ridurre il sovraccarico.

## Risoluzione dei problemi

### Hook non rilevato

```bash
# Verifica la struttura della directory
ls -la ~/.openclaw/hooks/my-hook/
# Dovrebbe mostrare: HOOK.md, handler.ts

# Elenca tutti gli hook rilevati
openclaw hooks list
```

### Hook non idoneo

```bash
openclaw hooks info my-hook
```

Verifica la presenza di binari mancanti (PATH), variabili d'ambiente, valori di configurazione o compatibilità con il sistema operativo.

### Hook non in esecuzione

1. Verifica che l'hook sia abilitato: `openclaw hooks list`
2. Riavvia il processo del gateway in modo che gli hook vengano ricaricati.
3. Controlla i log del gateway: `./scripts/clawlog.sh | grep hook`

## Correlati

- [Riferimento CLI: hook](/it/cli/hooks)
- [Webhook](/it/automation/cron-jobs#webhooks)
- [Hook dei Plugin](/it/plugins/hooks) — hook del ciclo di vita dei plugin in-process
- [Configurazione](/it/gateway/configuration-reference#hooks)
