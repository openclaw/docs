---
read_when:
    - Vuoi un'automazione basata su eventi per `/new`, `/reset`, `/stop` e gli eventi del ciclo di vita dell'agente
    - Vuoi creare, installare o eseguire il debug degli hook
summary: 'Hook: automazione basata su eventi per comandi ed eventi del ciclo di vita'
title: Hook
x-i18n:
    generated_at: "2026-04-24T08:28:53Z"
    model: gpt-5.4
    provider: openai
    source_hash: 4e6246f25272208d9a9ff2f186bcd3a463c78ea24b833f0259174d0f7f0cbea6
    source_path: automation/hooks.md
    workflow: 15
---

Gli hook sono piccoli script che vengono eseguiti quando accade qualcosa all'interno del Gateway. Possono essere individuati dalle directory e ispezionati con `openclaw hooks`. Il Gateway carica gli hook interni solo dopo che hai abilitato gli hook o configurato almeno una voce di hook, un pacchetto di hook, un gestore legacy o una directory di hook aggiuntiva.

Esistono due tipi di hook in OpenClaw:

- **Hook interni** (questa pagina): vengono eseguiti all'interno del Gateway quando si attivano eventi dell'agente, come `/new`, `/reset`, `/stop` o eventi del ciclo di vita.
- **Webhook**: endpoint HTTP esterni che consentono ad altri sistemi di attivare attività in OpenClaw. Vedi [Webhook](/it/automation/cron-jobs#webhooks).

Gli hook possono anche essere inclusi nei plugin. `openclaw hooks list` mostra sia gli hook standalone sia quelli gestiti dai plugin.

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

| Evento                   | Quando si attiva                               |
| ------------------------ | ---------------------------------------------- |
| `command:new`            | Comando `/new` emesso                          |
| `command:reset`          | Comando `/reset` emesso                        |
| `command:stop`           | Comando `/stop` emesso                         |
| `command`                | Qualsiasi evento di comando (listener generale) |
| `session:compact:before` | Prima che Compaction riassuma la cronologia    |
| `session:compact:after`  | Dopo il completamento di Compaction            |
| `session:patch`          | Quando le proprietà della sessione vengono modificate |
| `agent:bootstrap`        | Prima che i file bootstrap dello spazio di lavoro vengano inseriti |
| `gateway:startup`        | Dopo l'avvio dei canali e il caricamento degli hook |
| `message:received`       | Messaggio in ingresso da qualsiasi canale      |
| `message:transcribed`    | Dopo il completamento della trascrizione audio |
| `message:preprocessed`   | Dopo il completamento dell'elaborazione di tutti i media e dei link |
| `message:sent`           | Messaggio in uscita consegnato                 |

## Scrittura degli hook

### Struttura di un hook

Ogni hook è una directory che contiene due file:

```
my-hook/
├── HOOK.md          # Metadati + documentazione
└── handler.ts       # Implementazione del gestore
```

### Formato di HOOK.md

```markdown
---
name: my-hook
description: "Breve descrizione di cosa fa questo hook"
metadata:
  { "openclaw": { "emoji": "🔗", "events": ["command:new"], "requires": { "bins": ["node"] } } }
---

# My Hook

La documentazione dettagliata va qui.
```

**Campi dei metadati** (`metadata.openclaw`):

| Campo      | Descrizione                                          |
| ---------- | ---------------------------------------------------- |
| `emoji`    | Emoji visualizzata nella CLI                         |
| `events`   | Array di eventi da ascoltare                         |
| `export`   | Export nominato da usare (predefinito: `"default"`) |
| `os`       | Piattaforme richieste (ad es. `["darwin", "linux"]`) |
| `requires` | `bins`, `anyBins`, `env` o percorsi `config` richiesti |
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

Ogni evento include: `type`, `action`, `sessionKey`, `timestamp`, `messages` (aggiungi elementi per inviarli all'utente) e `context` (dati specifici dell'evento). I contesti degli hook dei plugin di agente e strumenti possono anche includere `trace`, un contesto diagnostico di traccia in sola lettura compatibile con W3C che i plugin possono passare nei log strutturati per la correlazione OTEL.

### Punti salienti del contesto evento

**Eventi di comando** (`command:new`, `command:reset`): `context.sessionEntry`, `context.previousSessionEntry`, `context.commandSource`, `context.workspaceDir`, `context.cfg`.

**Eventi di messaggio** (`message:received`): `context.from`, `context.content`, `context.channelId`, `context.metadata` (dati specifici del provider inclusi `senderId`, `senderName`, `guildId`).

**Eventi di messaggio** (`message:sent`): `context.to`, `context.content`, `context.success`, `context.channelId`.

**Eventi di messaggio** (`message:transcribed`): `context.transcript`, `context.from`, `context.channelId`, `context.mediaPath`.

**Eventi di messaggio** (`message:preprocessed`): `context.bodyForAgent` (corpo finale arricchito), `context.from`, `context.channelId`.

**Eventi bootstrap** (`agent:bootstrap`): `context.bootstrapFiles` (array modificabile), `context.agentId`.

**Eventi patch di sessione** (`session:patch`): `context.sessionEntry`, `context.patch` (solo i campi modificati), `context.cfg`. Solo i client privilegiati possono attivare eventi di patch.

**Eventi di Compaction**: `session:compact:before` include `messageCount`, `tokenCount`. `session:compact:after` aggiunge `compactedCount`, `summaryLength`, `tokensBefore`, `tokensAfter`.

## Individuazione degli hook

Gli hook vengono individuati da queste directory, in ordine di precedenza crescente per l'override:

1. **Hook inclusi**: distribuiti con OpenClaw
2. **Hook dei plugin**: hook inclusi nei plugin installati
3. **Hook gestiti**: `~/.openclaw/hooks/` (installati dall'utente, condivisi tra gli spazi di lavoro). Le directory aggiuntive da `hooks.internal.load.extraDirs` condividono questa precedenza.
4. **Hook dello spazio di lavoro**: `<workspace>/hooks/` (per agente, disabilitati per impostazione predefinita finché non vengono abilitati esplicitamente)

Gli hook dello spazio di lavoro possono aggiungere nuovi nomi di hook ma non possono sovrascrivere hook inclusi, gestiti o forniti da plugin con lo stesso nome.

Il Gateway salta l'individuazione degli hook interni all'avvio finché gli hook interni non sono configurati. Abilita un hook incluso o gestito con `openclaw hooks enable <name>`, installa un pacchetto di hook oppure imposta `hooks.internal.enabled=true` per aderire esplicitamente. Quando abiliti un hook nominato, il Gateway carica solo il gestore di quell'hook; `hooks.internal.enabled=true`, le directory di hook aggiuntive e i gestori legacy attivano l'individuazione estesa.

### Pacchetti di hook

I pacchetti di hook sono pacchetti npm che esportano hook tramite `openclaw.hooks` in `package.json`. Installa con:

```bash
openclaw plugins install <path-or-spec>
```

Le specifiche npm sono solo da registro (nome del pacchetto + versione esatta facoltativa o dist-tag). Le specifiche Git/URL/file e gli intervalli semver vengono rifiutati.

## Hook inclusi

| Hook                  | Eventi                         | Cosa fa                                                |
| --------------------- | ------------------------------ | ------------------------------------------------------ |
| session-memory        | `command:new`, `command:reset` | Salva il contesto della sessione in `<workspace>/memory/` |
| bootstrap-extra-files | `agent:bootstrap`              | Inserisce file bootstrap aggiuntivi da pattern glob    |
| command-logger        | `command`                      | Registra tutti i comandi in `~/.openclaw/logs/commands.log` |
| boot-md               | `gateway:startup`              | Esegue `BOOT.md` quando il gateway si avvia            |

Abilita qualsiasi hook incluso:

```bash
openclaw hooks enable <hook-name>
```

<a id="session-memory"></a>

### Dettagli di session-memory

Estrae gli ultimi 15 messaggi utente/assistente, genera uno slug descrittivo del nome file tramite LLM e lo salva in `<workspace>/memory/YYYY-MM-DD-slug.md`. Richiede che `workspace.dir` sia configurato.

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

I percorsi vengono risolti relativamente allo spazio di lavoro. Vengono caricati solo i nomi base bootstrap riconosciuti (`AGENTS.md`, `SOUL.md`, `TOOLS.md`, `IDENTITY.md`, `USER.md`, `HEARTBEAT.md`, `BOOTSTRAP.md`, `MEMORY.md`).

<a id="command-logger"></a>

### Dettagli di command-logger

Registra ogni comando slash in `~/.openclaw/logs/commands.log`.

<a id="boot-md"></a>

### Dettagli di boot-md

Esegue `BOOT.md` dallo spazio di lavoro attivo quando il gateway si avvia.

## Hook dei plugin

I plugin possono registrare hook tramite il Plugin SDK per un'integrazione più profonda: intercettare chiamate agli strumenti, modificare prompt, controllare il flusso dei messaggi e altro ancora. Il Plugin SDK espone 28 hook che coprono la risoluzione del modello, il ciclo di vita dell'agente, il flusso dei messaggi, l'esecuzione degli strumenti, il coordinamento dei sottoagenti e il ciclo di vita del gateway.

Per il riferimento completo agli hook dei plugin, inclusi `before_tool_call`, `before_agent_reply`, `before_install` e tutti gli altri hook dei plugin, vedi [Plugin Architecture](/it/plugins/architecture-internals#provider-runtime-hooks).

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
Il formato legacy di configurazione dell'array `hooks.internal.handlers` è ancora supportato per compatibilità retroattiva, ma i nuovi hook dovrebbero usare il sistema di individuazione basato sulle directory.
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

## Best practice

- **Mantieni i gestori veloci.** Gli hook vengono eseguiti durante l'elaborazione dei comandi. Avvia in background il lavoro pesante con `void processInBackground(event)`.
- **Gestisci gli errori con eleganza.** Racchiudi le operazioni rischiose in try/catch; non lanciare eccezioni così gli altri gestori possono continuare a essere eseguiti.
- **Filtra subito gli eventi.** Restituisci immediatamente se il tipo/azione dell'evento non è pertinente.
- **Usa chiavi evento specifiche.** Preferisci `"events": ["command:new"]` a `"events": ["command"]` per ridurre il sovraccarico.

## Risoluzione dei problemi

### Hook non individuato

```bash
# Verifica la struttura della directory
ls -la ~/.openclaw/hooks/my-hook/
# Dovrebbe mostrare: HOOK.md, handler.ts

# Elenca tutti gli hook individuati
openclaw hooks list
```

### Hook non idoneo

```bash
openclaw hooks info my-hook
```

Controlla binari mancanti (PATH), variabili di ambiente, valori di configurazione o compatibilità con il sistema operativo.

### Hook non in esecuzione

1. Verifica che l'hook sia abilitato: `openclaw hooks list`
2. Riavvia il processo del gateway in modo che gli hook vengano ricaricati.
3. Controlla i log del gateway: `./scripts/clawlog.sh | grep hook`

## Correlati

- [Riferimento CLI: hook](/it/cli/hooks)
- [Webhook](/it/automation/cron-jobs#webhooks)
- [Plugin Architecture](/it/plugins/architecture-internals#provider-runtime-hooks) — riferimento completo agli hook dei plugin
- [Configurazione](/it/gateway/configuration-reference#hooks)
