---
read_when:
    - Desideri l'automazione basata su eventi per /new, /reset, /stop e gli eventi del ciclo di vita degli agenti
    - Vuoi creare, installare o eseguire il debug degli hook
summary: 'Hooks: automazione basata su eventi per comandi ed eventi del ciclo di vita'
title: Agganci
x-i18n:
    generated_at: "2026-06-27T17:09:16Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 0259739b0547ba4826b540d392c6d6b72c6bec24fd50d5e297817694fd728438
    source_path: automation/hooks.md
    workflow: 16
---

Gli hook sono piccoli script che vengono eseguiti quando accade qualcosa all'interno del Gateway. Possono essere scoperti da directory e ispezionati con `openclaw hooks`. Il Gateway carica gli hook interni solo dopo che abiliti gli hook o configuri almeno una voce hook, un pacchetto di hook, un gestore legacy o una directory di hook aggiuntiva.

In OpenClaw esistono due tipi di hook:

- **Hook interni** (questa pagina): vengono eseguiti all'interno del Gateway quando si attivano eventi degli agenti, come `/new`, `/reset`, `/stop` o eventi del ciclo di vita.
- **Webhook**: endpoint HTTP esterni che consentono ad altri sistemi di attivare lavoro in OpenClaw. Vedi [Webhook](/it/automation/cron-jobs#webhooks).

Gli hook possono anche essere inclusi nei plugin. `openclaw hooks list` mostra sia gli hook autonomi sia gli hook gestiti dai plugin.

## Scegli la superficie corretta

OpenClaw ha diverse superfici di estensione che sembrano simili ma risolvono problemi diversi:

| Se vuoi...                                                                                                                    | Usa...                                  | Perché                                                                                                      |
| ----------------------------------------------------------------------------------------------------------------------------- | --------------------------------------- | ---------------------------------------------------------------------------------------------------------- |
| Salvare uno snapshot su `/new`, registrare `/reset`, chiamare un'API esterna dopo `message:sent` o aggiungere automazione operativa grossolana | Hook interni (`HOOK.md`, questa pagina) | Gli hook basati su file sono pensati per effetti collaterali gestiti dall'operatore e automazione di comandi/ciclo di vita |
| Riscrivere prompt, bloccare strumenti, annullare messaggi in uscita o aggiungere middleware/policy ordinati                  | Hook tipizzati dei plugin tramite `api.on(...)` | Gli hook tipizzati hanno contratti espliciti, priorità, regole di merge e semantica di blocco/annullamento |
| Aggiungere esportazione solo di telemetria od osservabilità                                                                    | Eventi diagnostici                      | L'osservabilità è un bus di eventi separato, non una superficie di hook per policy                         |

Usa gli hook interni quando vuoi un'automazione che si comporti come una piccola integrazione installata. Usa gli hook tipizzati dei plugin quando hai bisogno di controllo del ciclo di vita runtime.

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
| ------------------------ | --------------------------------------------------------- |
| `command:new`            | Comando `/new` emesso                                     |
| `command:reset`          | Comando `/reset` emesso                                   |
| `command:stop`           | Comando `/stop` emesso                                    |
| `command`                | Qualsiasi evento di comando (listener generale)           |
| `session:compact:before` | Prima che Compaction riepiloghi la cronologia             |
| `session:compact:after`  | Dopo il completamento di Compaction                       |
| `session:patch`          | Quando le proprietà della sessione vengono modificate     |
| `agent:bootstrap`        | Prima che i file di bootstrap dell'area di lavoro vengano iniettati |
| `gateway:startup`        | Dopo l'avvio dei canali e il caricamento degli hook        |
| `gateway:shutdown`       | Quando inizia l'arresto del Gateway                       |
| `gateway:pre-restart`    | Prima di un riavvio previsto del Gateway                  |
| `message:received`       | Messaggio in ingresso da qualsiasi canale                 |
| `message:transcribed`    | Dopo il completamento della trascrizione audio            |
| `message:preprocessed`   | Dopo il completamento o il salto della pre-elaborazione di media e link |
| `message:sent`           | Messaggio in uscita consegnato                            |

## Scrivere hook

### Struttura degli hook

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

| Campo      | Descrizione                                           |
| ---------- | ----------------------------------------------------- |
| `emoji`    | Emoji visualizzata per la CLI                         |
| `events`   | Array di eventi da ascoltare                          |
| `export`   | Export denominato da usare (predefinito: `"default"`) |
| `os`       | Piattaforme richieste (ad es. `["darwin", "linux"]`)  |
| `requires` | Percorsi `bins`, `anyBins`, `env` o `config` richiesti |
| `always`   | Ignora i controlli di idoneità (booleano)             |
| `install`  | Metodi di installazione                               |

### Implementazione del gestore

```typescript
const handler = async (event) => {
  if (event.type !== "command" || event.action !== "new") {
    return;
  }

  console.log(`[my-hook] New command triggered`);
  // Your logic here

  // Optionally send a reply on replyable surfaces
  event.messages.push("Hook executed!");
};

export default handler;
```

Ogni evento include: `type`, `action`, `sessionKey`, `timestamp`, `messages` (inserisci qui le risposte solo sulle superfici che supportano risposta) e `context` (dati specifici dell'evento). I contesti degli hook degli agenti e degli strumenti dei plugin possono anche includere `trace`, un contesto di traccia diagnostica di sola lettura compatibile con W3C che i plugin possono passare nei log strutturati per la correlazione OTEL.

`event.messages` viene consegnato automaticamente solo sulle superfici che supportano risposta, come
`command:*` e `message:received`. Gli eventi solo del ciclo di vita, come
`agent:bootstrap`, `session:*`, `gateway:*` o `message:sent`, non hanno un
canale di risposta e ignorano i messaggi inseriti.

### Punti salienti del contesto degli eventi

**Eventi di comando** (`command:new`, `command:reset`): `context.sessionEntry`, `context.previousSessionEntry`, `context.commandSource`, `context.workspaceDir`, `context.cfg`.

**Eventi di messaggio** (`message:received`): `context.from`, `context.content`, `context.channelId`, `context.metadata` (dati specifici del provider inclusi `senderId`, `senderName`, `guildId`). `context.content` preferisce un corpo comando non vuoto per messaggi simili a comandi, poi ripiega sul corpo in ingresso grezzo e sul corpo generico; non include arricchimenti solo per l'agente, come cronologia del thread o riepiloghi dei link.

**Eventi di messaggio** (`message:sent`): `context.to`, `context.content`, `context.success`, `context.channelId`.

**Eventi di messaggio** (`message:transcribed`): `context.transcript`, `context.from`, `context.channelId`, `context.mediaPath`.

**Eventi di messaggio** (`message:preprocessed`): `context.bodyForAgent` (corpo arricchito finale), `context.from`, `context.channelId`.

**Eventi di bootstrap** (`agent:bootstrap`): `context.bootstrapFiles` (array mutabile), `context.agentId`.

**Eventi di patch della sessione** (`session:patch`): `context.sessionEntry`, `context.patch` (solo campi modificati), `context.cfg`. Solo i client privilegiati possono attivare eventi di patch.

**Eventi di Compaction**: `session:compact:before` include `messageCount`, `tokenCount`. `session:compact:after` aggiunge `compactedCount`, `summaryLength`, `tokensBefore`, `tokensAfter`.

`command:stop` osserva l'utente che emette `/stop`; è ciclo di vita di annullamento/comando,
non un gate di finalizzazione dell'agente. I plugin che devono ispezionare una
risposta finale naturale e chiedere all'agente un ulteriore passaggio dovrebbero invece usare l'hook tipizzato
del plugin `before_agent_finalize`. Vedi [Hook dei plugin](/it/plugins/hooks).

**Eventi del ciclo di vita del Gateway**: `gateway:shutdown` include `reason` e `restartExpectedMs` e si attiva quando inizia l'arresto del Gateway. `gateway:pre-restart` include lo stesso contesto ma si attiva solo quando l'arresto fa parte di un riavvio previsto e viene fornito un valore finito di `restartExpectedMs`. Durante l'arresto, ogni attesa di un hook del ciclo di vita è best-effort e limitata, così l'arresto continua se un gestore si blocca. Il budget di attesa predefinito è 5 secondi per `gateway:shutdown` e 10 secondi per `gateway:pre-restart`.

Usa `gateway:pre-restart` per brevi avvisi di riavvio mentre i canali sono ancora disponibili:

```typescript
import { execFile } from "node:child_process";
import { promisify } from "node:util";

const execFileAsync = promisify(execFile);

export default async function handler(event) {
  if (event.type !== "gateway" || event.action !== "pre-restart") {
    return;
  }

  const restartInSeconds = Math.ceil(event.context.restartExpectedMs / 1000);
  await execFileAsync("openclaw", [
    "system",
    "event",
    "--mode",
    "now",
    "--text",
    `Gateway restarting in ~${restartInSeconds}s (${event.context.reason}). Checkpoint now.`,
  ]);
}
```

Tra l'evento `gateway:shutdown` (o `gateway:pre-restart`) e il resto della sequenza di arresto, il gateway attiva anche un hook tipizzato del plugin `session_end` per ogni sessione ancora attiva quando il processo si è fermato. Il `reason` dell'evento è `shutdown` per un normale arresto SIGTERM/SIGINT e `restart` quando la chiusura è stata pianificata come parte di un riavvio previsto. Questo svuotamento è limitato, così un gestore `session_end` lento non può bloccare l'uscita del processo, e le sessioni già finalizzate tramite sostituzione / reset / eliminazione / Compaction vengono saltate per evitare una doppia attivazione.

## Scoperta degli hook

Gli hook vengono scoperti da queste directory, in ordine crescente di precedenza di override:

1. **Hook inclusi**: distribuiti con OpenClaw
2. **Hook dei plugin**: hook inclusi nei plugin installati
3. **Hook gestiti**: `~/.openclaw/hooks/` (installati dall'utente, condivisi tra aree di lavoro). Le directory aggiuntive da `hooks.internal.load.extraDirs` condividono questa precedenza.
4. **Hook dell'area di lavoro**: `<workspace>/hooks/` (per agente, disabilitati per impostazione predefinita finché non vengono abilitati esplicitamente)

Gli hook dell'area di lavoro possono aggiungere nuovi nomi di hook ma non possono sovrascrivere hook inclusi, gestiti o forniti da plugin con lo stesso nome.

Il Gateway salta la scoperta degli hook interni all'avvio finché gli hook interni non sono configurati. Abilita un hook incluso o gestito con `openclaw hooks enable <name>`, installa un pacchetto di hook oppure imposta `hooks.internal.enabled=true` per abilitarli. Quando abiliti un singolo hook denominato, il Gateway carica solo il gestore di quell'hook; `hooks.internal.enabled=true`, le directory di hook aggiuntive e i gestori legacy abilitano la scoperta ampia.

### Pacchetti di hook

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
| compaction-notifier   | `session:compact:before`, `session:compact:after` | Invia avvisi chat visibili quando la compattazione della sessione inizia/termina |
| boot-md               | `gateway:startup`                                 | Esegue `BOOT.md` all'avvio del gateway                         |

Abilita qualsiasi hook incluso:

```bash
openclaw hooks enable <hook-name>
```

<a id="session-memory"></a>

### dettagli di session-memory

Estrae gli ultimi 15 messaggi di utente/assistente e li salva in `<workspace>/memory/YYYY-MM-DD-HHMM.md` usando la data locale dell'host. L'acquisizione della memoria viene eseguita in background, quindi le conferme di `/new` e `/reset` non vengono ritardate dalla lettura della trascrizione o dalla generazione opzionale dello slug. Imposta `hooks.internal.entries.session-memory.llmSlug: true` per generare slug descrittivi per i nomi file con il modello configurato. Richiede che `workspace.dir` sia configurato.

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

I percorsi vengono risolti rispetto al workspace. Vengono caricati solo i basename di bootstrap riconosciuti (`AGENTS.md`, `SOUL.md`, `TOOLS.md`, `IDENTITY.md`, `USER.md`, `HEARTBEAT.md`, `BOOTSTRAP.md`, `MEMORY.md`).

<a id="command-logger"></a>

### dettagli di command-logger

Registra ogni comando slash in `~/.openclaw/logs/commands.log`.

<a id="compaction-notifier"></a>

### dettagli di compaction-notifier

Invia brevi messaggi di stato nella conversazione corrente quando OpenClaw inizia e termina la compattazione della trascrizione della sessione. Questo rende i turni lunghi meno confusi sulle superfici chat, perché l'utente può vedere che l'assistente sta riassumendo il contesto e continuerà dopo la Compaction.

<a id="boot-md"></a>

### dettagli di boot-md

Esegue `BOOT.md` dal workspace attivo quando il gateway si avvia.

## Hook dei Plugin

I Plugin possono registrare hook tipizzati tramite il Plugin SDK per un'integrazione più profonda:
intercettare chiamate agli strumenti, modificare prompt, controllare il flusso dei messaggi e altro ancora.
Usa gli hook dei plugin quando ti servono `before_tool_call`, `before_agent_reply`,
`before_install` o altri hook del ciclo di vita in-process.

Gli hook interni gestiti dai Plugin sono diversi: partecipano al sistema di eventi
generali di comando/ciclo di vita di questa pagina e compaiono in `openclaw hooks list` come
`plugin:<id>`. Usali per effetti collaterali e compatibilità con i pacchetti di hook, non
per middleware ordinato o gate di policy.

Per il riferimento completo sugli hook dei plugin, vedi [Hook dei Plugin](/it/plugins/hooks).

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
Il formato di configurazione legacy dell'array `hooks.internal.handlers` è ancora supportato per compatibilità all'indietro, ma i nuovi hook dovrebbero usare il sistema basato su discovery.
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

- **Mantieni gli handler veloci.** Gli hook vengono eseguiti durante l'elaborazione dei comandi. Avvia il lavoro pesante in modalità fire-and-forget con `void processInBackground(event)`.
- **Gestisci gli errori con eleganza.** Avvolgi le operazioni rischiose in try/catch; non lanciare eccezioni, così gli altri handler possono essere eseguiti.
- **Filtra gli eventi in anticipo.** Ritorna immediatamente se il tipo/l'azione dell'evento non è rilevante.
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

Controlla binari mancanti (PATH), variabili di ambiente, valori di configurazione o compatibilità con il sistema operativo.

### Hook non eseguito

1. Verifica che l'hook sia abilitato: `openclaw hooks list`
2. Riavvia il processo gateway in modo che gli hook vengano ricaricati.
3. Controlla i log del gateway: `./scripts/clawlog.sh | grep hook`

## Correlati

- [Riferimento CLI: hooks](/it/cli/hooks)
- [Webhook](/it/automation/cron-jobs#webhooks)
- [Hook dei Plugin](/it/plugins/hooks) — hook del ciclo di vita dei plugin in-process
- [Configurazione](/it/gateway/configuration-reference#hooks)
