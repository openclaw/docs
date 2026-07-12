---
read_when:
    - Vuoi un'automazione basata sugli eventi per /new, /reset, /stop e gli eventi del ciclo di vita dell'agente
    - Vuoi creare, installare o eseguire il debug degli hook
summary: 'Hook: automazione basata su eventi per comandi ed eventi del ciclo di vita'
title: Hook
x-i18n:
    generated_at: "2026-07-12T06:47:45Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: ba09acf45cc09d4ce84b9dda36af2a720ccefbfaed23a1558dd36358ce56701a
    source_path: automation/hooks.md
    workflow: 16
---

Gli hook sono piccoli script eseguiti all'interno del Gateway quando si verificano eventi dell'agente: comandi come `/new`, `/reset`, `/stop`, Compaction della sessione, ciclo di vita del Gateway e flusso dei messaggi. Vengono individuati nelle directory e gestiti con `openclaw hooks`. Il Gateway carica gli hook interni solo dopo che gli hook sono stati abilitati o è stata configurata almeno una voce hook, un pacchetto di hook, un gestore legacy o una directory di hook aggiuntiva.

In OpenClaw esistono due tipi di hook:

- **Hook interni** (questa pagina): vengono eseguiti all'interno del Gateway quando si verificano eventi dell'agente.
- **Webhook**: endpoint HTTP esterni che consentono ad altri sistemi di attivare attività in OpenClaw. Vedere [Webhook](/it/automation/cron-jobs#webhooks).

Gli hook possono anche essere inclusi nei plugin. `openclaw hooks list` mostra sia gli hook autonomi sia quelli gestiti dai plugin (visualizzati come `plugin:<id>`).

## Scegliere l'interfaccia appropriata

OpenClaw dispone di diverse interfacce di estensione che sembrano simili ma risolvono problemi differenti:

| Se si desidera...                                                                                                                             | Usare...                                        | Motivo                                                                                                                      |
| --------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------- |
| Salvare un'istantanea con `/new`, registrare `/reset`, chiamare un'API esterna dopo `message:sent` o aggiungere automazioni generali operative | Hook interni (`HOOK.md`, questa pagina)         | Gli hook basati su file sono destinati agli effetti collaterali gestiti dall'operatore e all'automazione di comandi e ciclo di vita |
| Riscrivere prompt, bloccare strumenti, annullare messaggi in uscita o aggiungere middleware o criteri ordinati                                | Hook tipizzati dei plugin tramite `api.on(...)` | Gli hook tipizzati dispongono di contratti espliciti, priorità, regole di unione e semantica di blocco e annullamento       |
| Aggiungere esportazione di sola telemetria oppure osservabilità                                                                                | Eventi diagnostici                              | L'osservabilità usa un bus di eventi separato, non un'interfaccia hook per i criteri                                        |

Usare gli hook interni per automazioni che si comportano come una piccola integrazione installata. Usare gli hook tipizzati dei plugin quando è necessario controllare il ciclo di vita in fase di esecuzione.

## Avvio rapido

```bash
# Elenca gli hook disponibili
openclaw hooks list

# Abilita un hook
openclaw hooks enable session-memory

# Controlla lo stato degli hook
openclaw hooks check

# Ottieni informazioni dettagliate
openclaw hooks info session-memory
```

## Tipi di evento

Gli hook si registrano a una chiave specifica di questa tabella oppure al solo nome di una famiglia
(`command`, `session`, `agent`, `gateway`, `message`) per ricevere ogni azione
di tale famiglia. Il nucleo di OpenClaw non emette altri eventi, quindi qualsiasi altro nome è quasi
sempre un errore di battitura che lascia l'hook silenziosamente inattivo (solo un plugin che emette un
evento personalizzato potrebbe attivarlo). Il caricatore degli hook registra un avviso per tali nomi
(ad esempio `command:nwe`) e `openclaw hooks info <name>` li segnala, rendendo quindi
diagnosticabile un hook che non viene mai eseguito.

| Evento                   | Quando viene attivato                                                     |
| ------------------------ | ------------------------------------------------------------------------- |
| `command:new`            | Viene impartito il comando `/new`                                         |
| `command:reset`          | Viene impartito il comando `/reset`                                       |
| `command:stop`           | Viene impartito il comando `/stop`                                        |
| `command`                | Qualsiasi evento di comando (listener generale)                           |
| `session:compact:before` | Prima che la Compaction riepiloghi la cronologia                           |
| `session:compact:after`  | Al termine della Compaction                                                |
| `session:patch`          | Quando vengono modificate le proprietà della sessione                     |
| `agent:bootstrap`        | Prima dell'inserimento dei file di bootstrap dello spazio di lavoro       |
| `gateway:startup`        | Dopo l'avvio dei canali e il caricamento degli hook                       |
| `gateway:shutdown`       | Quando inizia l'arresto del Gateway                                       |
| `gateway:pre-restart`    | Prima di un riavvio previsto del Gateway                                  |
| `message:received`       | Messaggio in entrata da qualsiasi canale                                  |
| `message:transcribed`    | Al termine della trascrizione audio                                       |
| `message:preprocessed`   | Al termine, o dopo l'omissione, della pre-elaborazione di media e collegamenti |
| `message:sent`           | Tentativo di invio in uscita (`context.success` contiene il risultato)    |

## Scrittura degli hook

### Struttura di un hook

Ogni hook è una directory contenente due file:

```text
my-hook/
├── HOOK.md          # Metadati + documentazione
└── handler.ts       # Implementazione del gestore
```

Il file del gestore può essere `handler.ts`, `handler.js`, `index.ts` o `index.js`.

### Formato di HOOK.md

```markdown
---
name: my-hook
description: "Breve descrizione della funzione di questo hook"
metadata:
  { "openclaw": { "emoji": "🔗", "events": ["command:new"], "requires": { "bins": ["node"] } } }
---

# Il mio hook

La documentazione dettagliata va inserita qui.
```

**Campi dei metadati** (`metadata.openclaw`):

| Campo      | Descrizione                                                    |
| ---------- | -------------------------------------------------------------- |
| `emoji`    | Emoji visualizzata nella CLI                                   |
| `events`   | Array di eventi da ascoltare                                   |
| `export`   | Esportazione denominata da usare (valore predefinito: `"default"`) |
| `os`       | Piattaforme richieste (ad esempio `["darwin", "linux"]`)        |
| `requires` | Percorsi `bins`, `anyBins`, `env` o `config` richiesti          |
| `always`   | Ignora i controlli di idoneità (booleano)                       |
| `hookKey`  | Sostituzione della chiave di configurazione (valore predefinito: nome dell'hook) |
| `homepage` | URL della documentazione mostrato da `openclaw hooks info`      |
| `install`  | Metodi di installazione                                         |

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

Ogni evento include: `type`, `action`, `sessionKey`, `timestamp`, `messages` e `context` (dati specifici dell'evento). I contesti degli hook tipizzati dei plugin per gli hook di agente e strumenti possono includere anche `trace`, un contesto di traccia diagnostica di sola lettura compatibile con W3C che i plugin possono passare ai log strutturati per la correlazione OTEL.

Le stringhe aggiunte a `event.messages` vengono recapitate alla chat solo per
`command:new` e `command:reset` (instradate come risposta alla conversazione
di origine) e per `session:compact:before` / `session:compact:after`
(inviate come notifiche sullo stato della Compaction). Tutti gli altri eventi, inclusi
`command:stop`, `message:*`, `agent:bootstrap`, `session:patch` e
`gateway:*`, ignorano i messaggi aggiunti.

### Elementi principali del contesto degli eventi

**Eventi di comando** (`command:new`, `command:reset`): `context.sessionEntry`, `context.previousSessionEntry`, `context.commandSource`, `context.senderId`, `context.workspaceDir`, `context.cfg`.

**Eventi di comando** (`command:stop`): `context.sessionEntry`, `context.sessionId`, `context.commandSource`, `context.senderId`.

**Eventi di messaggio** (`message:received`): `context.from`, `context.content`, `context.channelId`, `context.metadata` (dati specifici del provider, inclusi `senderId`, `senderName`, `guildId`). Per i messaggi simili a comandi, `context.content` preferisce il corpo non vuoto del comando, quindi usa come ripiego il corpo grezzo in entrata e quello generico; non include arricchimenti riservati all'agente, come la cronologia del thread o i riepiloghi dei collegamenti.

**Eventi di messaggio** (`message:sent`): `context.to`, `context.content`, `context.success`, `context.channelId`, oltre a `context.error` quando l'invio non riesce.

**Eventi di messaggio** (`message:transcribed`): `context.transcript`, `context.from`, `context.channelId`, `context.mediaPath`.

**Eventi di messaggio** (`message:preprocessed`): `context.bodyForAgent` (corpo finale arricchito), `context.from`, `context.channelId`.

**Eventi di bootstrap** (`agent:bootstrap`): `context.bootstrapFiles` (array modificabile), `context.agentId`.

**Eventi di modifica della sessione** (`session:patch`): `context.sessionEntry`, `context.patch` (solo i campi modificati), `context.cfg`. Solo i client privilegiati possono attivare eventi di modifica; il contesto è un clone, pertanto i gestori non possono modificare la voce della sessione attiva.

**Eventi di Compaction**: `session:compact:before` include `messageCount`, `tokenCount`. `session:compact:after` aggiunge `compactedCount`, `summaryLength`, `tokensBefore`, `tokensAfter`.

`command:stop` rileva quando l'utente impartisce `/stop`; riguarda l'annullamento e il ciclo di vita
del comando, non è un punto di controllo per la finalizzazione dell'agente. I plugin che devono esaminare una
risposta finale naturale e chiedere all'agente un ulteriore passaggio devono invece usare l'hook tipizzato
del plugin `before_agent_finalize`. Vedere [Hook dei plugin](/it/plugins/hooks).

**Eventi del ciclo di vita del Gateway**: `gateway:shutdown` include `reason` e `restartExpectedMs` e viene attivato quando inizia l'arresto del Gateway. `gateway:pre-restart` include lo stesso contesto, ma viene attivato solo quando l'arresto fa parte di un riavvio previsto e viene fornito un valore finito di `restartExpectedMs`. Durante l'arresto, l'attesa per ciascun hook del ciclo di vita avviene secondo il principio del massimo sforzo ed è limitata, affinché l'arresto prosegua se un gestore si blocca. Il limite di attesa predefinito è di 5 secondi per `gateway:shutdown` e di 10 secondi per `gateway:pre-restart`.

Usare `gateway:pre-restart` per brevi notifiche di riavvio mentre i canali sono ancora disponibili:

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

Tra l'evento `gateway:shutdown` (o `gateway:pre-restart`) e il resto della sequenza di arresto, il Gateway attiva anche un hook tipizzato del plugin `session_end` per ogni sessione che era ancora attiva al momento dell'arresto del processo. Il valore `reason` dell'evento è `shutdown` per un normale arresto SIGTERM/SIGINT e `restart` quando la chiusura è stata pianificata nell'ambito di un riavvio previsto. Questo svuotamento è limitato, affinché un gestore `session_end` lento non possa bloccare l'uscita del processo; le sessioni già finalizzate tramite sostituzione, reimpostazione, eliminazione o Compaction vengono ignorate per evitare una doppia attivazione.

## Individuazione degli hook

Gli hook vengono individuati da quattro origini:

1. **Hook inclusi**: distribuiti con OpenClaw
2. **Hook dei plugin**: inclusi nei plugin installati; possono sostituire gli hook inclusi con lo stesso nome
3. **Hook gestiti**: `~/.openclaw/hooks/` (installati dall'utente e condivisi tra gli spazi di lavoro); possono sostituire gli hook inclusi e quelli dei plugin. Le directory aggiuntive definite in `hooks.internal.load.extraDirs` condividono questa precedenza.
4. **Hook dello spazio di lavoro**: `<workspace>/hooks/` (specifici dell'agente, disabilitati per impostazione predefinita finché non vengono abilitati esplicitamente)

Gli hook dello spazio di lavoro possono aggiungere nuovi nomi di hook, ma non possono sostituire hook inclusi, gestiti o forniti dai plugin con lo stesso nome.

All'avvio, il Gateway omette l'individuazione degli hook interni finché questi non vengono configurati. Abilitare un hook incluso o gestito con `openclaw hooks enable <name>`, installare un pacchetto di hook oppure impostare `hooks.internal.enabled=true` per effettuare l'attivazione. Quando viene abilitato un singolo hook denominato, il Gateway carica solo il gestore di quell'hook; `hooks.internal.enabled=true`, le directory di hook aggiuntive e i gestori legacy attivano l'individuazione estesa.

### Pacchetti di hook

I pacchetti di hook sono pacchetti npm che esportano hook tramite `openclaw.hooks` in `package.json`. Installare con:

```bash
openclaw plugins install <path-or-spec>
```

Le specifiche npm sono limitate al registro (nome del pacchetto + versione esatta o dist-tag facoltativi). Le specifiche Git/URL/file e gli intervalli semver vengono rifiutati. I precedenti comandi `openclaw hooks install` e `openclaw hooks update` sono alias deprecati di `openclaw plugins install` / `openclaw plugins update`.

## Hook inclusi

| Hook                  | Eventi                                            | Funzione                                                        |
| --------------------- | ------------------------------------------------- | --------------------------------------------------------------- |
| session-memory        | `command:new`, `command:reset`                    | Salva il contesto della sessione in `<workspace>/memory/`       |
| bootstrap-extra-files | `agent:bootstrap`                                 | Inserisce file di bootstrap aggiuntivi da pattern glob          |
| command-logger        | `command`                                         | Registra tutti i comandi in `~/.openclaw/logs/commands.log`     |
| compaction-notifier   | `session:compact:before`, `session:compact:after` | Invia avvisi visibili in chat all'inizio/fine della Compaction  |
| boot-md               | `gateway:startup`                                 | Esegue `BOOT.md` all'avvio del Gateway                          |

Abilita un qualsiasi hook incluso:

```bash
openclaw hooks enable <hook-name>
```

<a id="session-memory"></a>

### Dettagli di session-memory

Estrae gli ultimi messaggi dell'utente e dell'assistente (15 per impostazione predefinita, configurabili con `hooks.internal.entries.session-memory.messages`) e li salva in `<workspace>/memory/YYYY-MM-DD-HHMM.md` usando la data locale dell'host. L'acquisizione della memoria viene eseguita in background, in modo che le conferme di `/new` e `/reset` non subiscano ritardi dovuti alla lettura della trascrizione o alla generazione facoltativa dello slug. Imposta `hooks.internal.entries.session-memory.llmSlug: true` per generare slug descrittivi per i nomi dei file e, facoltativamente, imposta `hooks.internal.entries.session-memory.model` su un alias configurato come `sonnet`, un ID modello semplice del provider predefinito dell'agente oppure un riferimento `provider/model`. Quando `model` è omesso, la generazione dello slug usa il modello predefinito dell'agente e, se non è disponibile, ricorre a slug basati sul timestamp. Richiede che `workspace.dir` sia configurato.

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

`patterns` e `files` sono accettati come alias di `paths`. I percorsi vengono risolti relativamente allo spazio di lavoro e devono rimanere al suo interno. Vengono caricati solo i nomi di base di bootstrap riconosciuti (`AGENTS.md`, `SOUL.md`, `TOOLS.md`, `IDENTITY.md`, `USER.md`, `HEARTBEAT.md`, `BOOTSTRAP.md`, `MEMORY.md`).

<a id="command-logger"></a>

### Dettagli di command-logger

Registra ogni comando slash come una riga JSON (timestamp, azione, chiave di sessione, ID del mittente, origine) in `~/.openclaw/logs/commands.log`.

<a id="compaction-notifier"></a>

### Dettagli di compaction-notifier

Invia brevi messaggi di stato nella conversazione corrente quando OpenClaw inizia e termina la Compaction della trascrizione della sessione. Ciò rende meno ambigui i turni lunghi nelle interfacce di chat, perché l'utente può vedere che l'assistente sta riepilogando il contesto e continuerà dopo la Compaction.

<a id="boot-md"></a>

### Dettagli di boot-md

Esegue `BOOT.md` all'avvio del Gateway per ogni ambito agente configurato, se il file esiste nello spazio di lavoro risolto dell'agente.

## Hook dei Plugin

I Plugin possono registrare hook tipizzati tramite l'SDK dei Plugin per un'integrazione più profonda:
intercettare le chiamate agli strumenti, modificare i prompt, controllare il flusso dei messaggi e altro ancora.
Usa gli hook dei Plugin quando sono necessari `before_tool_call`, `before_agent_reply`,
`before_install` o altri hook del ciclo di vita interni al processo.

Gli hook interni gestiti dai Plugin sono diversi: partecipano al sistema generale di eventi
dei comandi e del ciclo di vita descritto in questa pagina e compaiono in `openclaw hooks list` come
`plugin:<id>`. Usali per gli effetti collaterali e la compatibilità con i pacchetti di hook, non
per middleware ordinati o controlli delle policy.

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

I valori di ambiente specifici per ogni hook soddisfano i controlli di idoneità `requires.env` dell'hook (insieme all'ambiente del processo) e i gestori possono leggerli dalla voce di configurazione dell'hook:

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

Directory aggiuntive degli hook:

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
Il formato di configurazione precedente basato sull'array `hooks.internal.handlers` è ancora supportato per la compatibilità con le versioni precedenti, ma i nuovi hook dovrebbero usare il sistema basato sul rilevamento.
</Note>

## Riferimento CLI

```bash
# Elenca tutti gli hook (aggiungi --eligible, --verbose o --json)
openclaw hooks list

# Mostra informazioni dettagliate su un hook
openclaw hooks info <hook-name>

# Mostra il riepilogo dell'idoneità
openclaw hooks check

# Abilita/disabilita
openclaw hooks enable <hook-name>
openclaw hooks disable <hook-name>
```

## Procedure consigliate

- **Mantieni veloci i gestori.** Gli hook vengono eseguiti durante l'elaborazione dei comandi. Avvia le operazioni pesanti senza attenderne il completamento con `void processInBackground(event)`.
- **Gestisci gli errori correttamente.** Racchiudi le operazioni rischiose in try/catch; non generare eccezioni, affinché gli altri gestori possano essere eseguiti.
- **Filtra tempestivamente gli eventi.** Termina immediatamente se il tipo o l'azione dell'evento non è pertinente.
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

Verifica la presenza di binari mancanti (PATH), variabili di ambiente, valori di configurazione o problemi di compatibilità con il sistema operativo.

### Hook non eseguito

1. Verifica che l'hook sia abilitato: `openclaw hooks list`
2. Riavvia il processo del Gateway per ricaricare gli hook.
3. Controlla i log del Gateway: `openclaw logs --follow | grep -i hook`

## Argomenti correlati

- [Riferimento CLI: hook](/it/cli/hooks)
- [Webhook](/it/automation/cron-jobs#webhooks)
- [Hook dei Plugin](/it/plugins/hooks) — hook del ciclo di vita dei Plugin interni al processo
- [Configurazione](/it/gateway/configuration-reference#hooks)
