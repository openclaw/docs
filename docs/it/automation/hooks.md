---
read_when:
    - Vuoi un'automazione basata sugli eventi per /new, /reset, /stop e gli eventi del ciclo di vita degli agenti
    - Vuoi creare, installare o eseguire il debug degli hook
summary: 'Agganci: automazione basata su eventi per comandi ed eventi del ciclo di vita'
title: Agganci
x-i18n:
    generated_at: "2026-04-30T08:35:57Z"
    model: gpt-5.5
    provider: openai
    source_hash: a6c567ab79fbff8228d174816e9fb4613f0544ea15a99b5917190a4066af0f57
    source_path: automation/hooks.md
    workflow: 16
---

Gli hook sono piccoli script che vengono eseguiti quando accade qualcosa dentro il Gateway. Possono essere rilevati dalle directory e ispezionati con `openclaw hooks`. Il Gateway carica gli hook interni solo dopo che abiliti gli hook o configuri almeno una voce hook, un pacchetto di hook, un handler legacy o una directory hook aggiuntiva.

In OpenClaw esistono due tipi di hook:

- **Hook interni** (questa pagina): vengono eseguiti dentro il Gateway quando si attivano eventi dell'agente, come `/new`, `/reset`, `/stop` o eventi del ciclo di vita.
- **Webhook**: endpoint HTTP esterni che permettono ad altri sistemi di avviare attività in OpenClaw. Vedi [Webhook](/it/automation/cron-jobs#webhooks).

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

| Evento                   | Quando viene attivato                                      |
| ------------------------ | ---------------------------------------------------------- |
| `command:new`            | Comando `/new` emesso                                      |
| `command:reset`          | Comando `/reset` emesso                                    |
| `command:stop`           | Comando `/stop` emesso                                     |
| `command`                | Qualsiasi evento di comando (listener generale)            |
| `session:compact:before` | Prima che la compaction riassuma la cronologia             |
| `session:compact:after`  | Dopo il completamento della compaction                     |
| `session:patch`          | Quando le proprietà della sessione vengono modificate      |
| `agent:bootstrap`        | Prima che i file di bootstrap dell'area di lavoro vengano inseriti |
| `gateway:startup`        | Dopo l'avvio dei canali e il caricamento degli hook        |
| `gateway:shutdown`       | Quando inizia l'arresto del Gateway                        |
| `gateway:pre-restart`    | Prima di un riavvio previsto del Gateway                   |
| `message:received`       | Messaggio in ingresso da qualsiasi canale                  |
| `message:transcribed`    | Dopo il completamento della trascrizione audio             |
| `message:preprocessed`   | Dopo il completamento o il salto della pre-elaborazione di media e link |
| `message:sent`           | Messaggio in uscita consegnato                             |

## Scrivere hook

### Struttura dell'hook

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
| `export`   | Export nominato da usare (predefinito: `"default"`)  |
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

Ogni evento include: `type`, `action`, `sessionKey`, `timestamp`, `messages` (push per inviare all'utente) e `context` (dati specifici dell'evento). I contesti degli hook dei Plugin di agente e strumenti possono includere anche `trace`, un contesto di traccia diagnostica di sola lettura compatibile con W3C che i Plugin possono passare nei log strutturati per la correlazione OTEL.

### Punti principali del contesto degli eventi

**Eventi di comando** (`command:new`, `command:reset`): `context.sessionEntry`, `context.previousSessionEntry`, `context.commandSource`, `context.workspaceDir`, `context.cfg`.

**Eventi messaggio** (`message:received`): `context.from`, `context.content`, `context.channelId`, `context.metadata` (dati specifici del provider inclusi `senderId`, `senderName`, `guildId`).

**Eventi messaggio** (`message:sent`): `context.to`, `context.content`, `context.success`, `context.channelId`.

**Eventi messaggio** (`message:transcribed`): `context.transcript`, `context.from`, `context.channelId`, `context.mediaPath`.

**Eventi messaggio** (`message:preprocessed`): `context.bodyForAgent` (corpo finale arricchito), `context.from`, `context.channelId`.

**Eventi di bootstrap** (`agent:bootstrap`): `context.bootstrapFiles` (array mutabile), `context.agentId`.

**Eventi di patch della sessione** (`session:patch`): `context.sessionEntry`, `context.patch` (solo i campi modificati), `context.cfg`. Solo i client privilegiati possono attivare eventi di patch.

**Eventi di compaction**: `session:compact:before` include `messageCount`, `tokenCount`. `session:compact:after` aggiunge `compactedCount`, `summaryLength`, `tokensBefore`, `tokensAfter`.

`command:stop` osserva l'utente che emette `/stop`; è il ciclo di vita di annullamento/comando, non un gate di finalizzazione dell'agente. I Plugin che devono ispezionare una risposta finale naturale e chiedere all'agente un passaggio aggiuntivo dovrebbero invece usare l'hook Plugin tipizzato `before_agent_finalize`. Vedi [Hook dei Plugin](/it/plugins/hooks).

**Eventi del ciclo di vita del Gateway**: `gateway:shutdown` include `reason` e `restartExpectedMs` e viene attivato quando inizia l'arresto del Gateway. `gateway:pre-restart` include lo stesso contesto ma viene attivato solo quando l'arresto fa parte di un riavvio previsto e viene fornito un valore finito di `restartExpectedMs`. Durante l'arresto, l'attesa di ogni hook del ciclo di vita è best effort e limitata, così l'arresto continua se un handler si blocca.

## Rilevamento degli hook

Gli hook vengono rilevati da queste directory, in ordine crescente di precedenza di override:

1. **Hook inclusi**: forniti con OpenClaw
2. **Hook dei Plugin**: hook inclusi nei Plugin installati
3. **Hook gestiti**: `~/.openclaw/hooks/` (installati dall'utente, condivisi tra aree di lavoro). Le directory aggiuntive da `hooks.internal.load.extraDirs` condividono questa precedenza.
4. **Hook dell'area di lavoro**: `<workspace>/hooks/` (per agente, disabilitati per impostazione predefinita finché non vengono abilitati esplicitamente)

Gli hook dell'area di lavoro possono aggiungere nuovi nomi di hook ma non possono sovrascrivere hook inclusi, gestiti o forniti dai Plugin con lo stesso nome.

Il Gateway salta il rilevamento degli hook interni all'avvio finché gli hook interni non sono configurati. Abilita un hook incluso o gestito con `openclaw hooks enable <name>`, installa un pacchetto di hook oppure imposta `hooks.internal.enabled=true` per aderire. Quando abiliti un hook nominato, il Gateway carica solo l'handler di quell'hook; `hooks.internal.enabled=true`, le directory hook aggiuntive e gli handler legacy aderiscono al rilevamento ampio.

### Pacchetti di hook

I pacchetti di hook sono pacchetti npm che esportano hook tramite `openclaw.hooks` in `package.json`. Installa con:

```bash
openclaw plugins install <path-or-spec>
```

Le specifiche npm sono solo da registro (nome del pacchetto + versione esatta opzionale o dist-tag). Specifiche Git/URL/file e intervalli semver vengono rifiutati.

## Hook inclusi

| Hook                  | Eventi                         | Cosa fa                                               |
| --------------------- | ------------------------------ | ----------------------------------------------------- |
| session-memory        | `command:new`, `command:reset` | Salva il contesto della sessione in `<workspace>/memory/` |
| bootstrap-extra-files | `agent:bootstrap`              | Inserisce file di bootstrap aggiuntivi da pattern glob |
| command-logger        | `command`                      | Registra tutti i comandi in `~/.openclaw/logs/commands.log` |
| boot-md               | `gateway:startup`              | Esegue `BOOT.md` all'avvio del Gateway                |

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

I percorsi vengono risolti rispetto all'area di lavoro. Vengono caricati solo i nomi base di bootstrap riconosciuti (`AGENTS.md`, `SOUL.md`, `TOOLS.md`, `IDENTITY.md`, `USER.md`, `HEARTBEAT.md`, `BOOTSTRAP.md`, `MEMORY.md`).

<a id="command-logger"></a>

### Dettagli di command-logger

Registra ogni comando slash in `~/.openclaw/logs/commands.log`.

<a id="boot-md"></a>

### Dettagli di boot-md

Esegue `BOOT.md` dall'area di lavoro attiva quando il Gateway si avvia.

## Hook dei Plugin

I Plugin possono registrare hook tipizzati tramite il Plugin SDK per un'integrazione più profonda:
intercettare chiamate agli strumenti, modificare prompt, controllare il flusso dei messaggi e altro.
Usa gli hook dei Plugin quando hai bisogno di `before_tool_call`, `before_agent_reply`,
`before_install` o altri hook del ciclo di vita in-process.

Per il riferimento completo degli hook dei Plugin, vedi [Hook dei Plugin](/it/plugins/hooks).

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

Variabili di ambiente per hook:

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
Il formato di configurazione legacy dell'array `hooks.internal.handlers` è ancora supportato per compatibilità con le versioni precedenti, ma i nuovi hook dovrebbero usare il sistema basato sul rilevamento.
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

- **Mantieni veloci gli handler.** Gli hook vengono eseguiti durante l'elaborazione dei comandi. Esegui il lavoro pesante in modalità fire-and-forget con `void processInBackground(event)`.
- **Gestisci gli errori con eleganza.** Avvolgi le operazioni rischiose in try/catch; non generare eccezioni, così gli altri handler possono essere eseguiti.
- **Filtra gli eventi subito.** Ritorna immediatamente se il tipo/azione dell'evento non è rilevante.
- **Usa chiavi evento specifiche.** Preferisci `"events": ["command:new"]` rispetto a `"events": ["command"]` per ridurre l'overhead.

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

Controlla binari mancanti (PATH), variabili di ambiente, valori di configurazione o compatibilità del sistema operativo.

### Hook non eseguito

1. Verifica che l'hook sia abilitato: `openclaw hooks list`
2. Riavvia il processo Gateway in modo che gli hook vengano ricaricati.
3. Controlla i log del Gateway: `./scripts/clawlog.sh | grep hook`

## Correlati

- [Riferimento CLI: hook](/it/cli/hooks)
- [Webhook](/it/automation/cron-jobs#webhooks)
- [Hook dei Plugin](/it/plugins/hooks) — hook del ciclo di vita dei Plugin in-process
- [Configurazione](/it/gateway/configuration-reference#hooks)
