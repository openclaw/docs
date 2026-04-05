---
read_when:
    - Vuoi un'automazione basata su eventi per /new, /reset, /stop ed eventi del ciclo di vita dell'agente
    - Vuoi creare, installare o eseguire il debug degli hook
summary: 'Hooks: automazione basata su eventi per comandi ed eventi del ciclo di vita'
title: Hooks
x-i18n:
    generated_at: "2026-04-05T13:42:09Z"
    model: gpt-5.4
    provider: openai
    source_hash: 66eb75bb2b3b2ad229bf3da24fdb0fe021ed08f812fd1d13c69b3bd9df0218e5
    source_path: automation/hooks.md
    workflow: 15
---

# Hooks

Gli hook sono piccoli script che vengono eseguiti quando accade qualcosa all'interno del Gateway. Vengono individuati automaticamente dalle directory e possono essere ispezionati con `openclaw hooks`.

In OpenClaw esistono due tipi di hook:

- **Hook interni** (questa pagina): vengono eseguiti all'interno del Gateway quando si attivano eventi dell'agente, come `/new`, `/reset`, `/stop` o eventi del ciclo di vita.
- **Webhook**: endpoint HTTP esterni che consentono ad altri sistemi di attivare lavoro in OpenClaw. Vedi [Webhooks](/automation/cron-jobs#webhooks).

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

| Evento                   | Quando si attiva                                 |
| ------------------------ | ------------------------------------------------ |
| `command:new`            | Comando `/new` emesso                            |
| `command:reset`          | Comando `/reset` emesso                          |
| `command:stop`           | Comando `/stop` emesso                           |
| `command`                | Qualsiasi evento di comando (listener generale)  |
| `session:compact:before` | Prima che la compattazione riassuma la cronologia |
| `session:compact:after`  | Dopo il completamento della compattazione        |
| `session:patch`          | Quando vengono modificate le proprietà della sessione |
| `agent:bootstrap`        | Prima che i file bootstrap del workspace vengano inseriti |
| `gateway:startup`        | Dopo l'avvio dei canali e il caricamento degli hook |
| `message:received`       | Messaggio in ingresso da qualsiasi canale        |
| `message:transcribed`    | Dopo il completamento della trascrizione audio   |
| `message:preprocessed`   | Dopo il completamento di tutta l'elaborazione di media e link |
| `message:sent`           | Messaggio in uscita consegnato                   |

## Scrittura degli hook

### Struttura di un hook

Ogni hook è una directory che contiene due file:

```
my-hook/
├── HOOK.md          # Metadati + documentazione
└── handler.ts       # Implementazione dell'handler
```

### Formato di HOOK.md

```markdown
---
name: my-hook
description: "Breve descrizione di ciò che fa questo hook"
metadata:
  { "openclaw": { "emoji": "🔗", "events": ["command:new"], "requires": { "bins": ["node"] } } }
---

# My Hook

La documentazione dettagliata va qui.
```

**Campi dei metadati** (`metadata.openclaw`):

| Campo      | Descrizione                                          |
| ---------- | ---------------------------------------------------- |
| `emoji`    | Emoji visualizzata per la CLI                        |
| `events`   | Array di eventi da ascoltare                         |
| `export`   | Export nominato da usare (predefinito: `"default"`)  |
| `os`       | Piattaforme richieste (ad es. `["darwin", "linux"]`) |
| `requires` | `bins`, `anyBins`, `env` o percorsi `config` richiesti |
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

Ogni evento include: `type`, `action`, `sessionKey`, `timestamp`, `messages` (usa push per inviare all'utente) e `context` (dati specifici dell'evento).

### Punti salienti del contesto evento

**Eventi di comando** (`command:new`, `command:reset`): `context.sessionEntry`, `context.previousSessionEntry`, `context.commandSource`, `context.workspaceDir`, `context.cfg`.

**Eventi di messaggio** (`message:received`): `context.from`, `context.content`, `context.channelId`, `context.metadata` (dati specifici del provider inclusi `senderId`, `senderName`, `guildId`).

**Eventi di messaggio** (`message:sent`): `context.to`, `context.content`, `context.success`, `context.channelId`.

**Eventi di messaggio** (`message:transcribed`): `context.transcript`, `context.from`, `context.channelId`, `context.mediaPath`.

**Eventi di messaggio** (`message:preprocessed`): `context.bodyForAgent` (corpo finale arricchito), `context.from`, `context.channelId`.

**Eventi bootstrap** (`agent:bootstrap`): `context.bootstrapFiles` (array modificabile), `context.agentId`.

**Eventi patch della sessione** (`session:patch`): `context.sessionEntry`, `context.patch` (solo i campi modificati), `context.cfg`. Solo i client con privilegi possono attivare eventi patch.

**Eventi di compattazione**: `session:compact:before` include `messageCount`, `tokenCount`. `session:compact:after` aggiunge `compactedCount`, `summaryLength`, `tokensBefore`, `tokensAfter`.

## Individuazione degli hook

Gli hook vengono individuati da queste directory, in ordine di precedenza crescente per la sovrascrittura:

1. **Hook inclusi**: distribuiti con OpenClaw
2. **Hook dei plugin**: hook inclusi nei plugin installati
3. **Hook gestiti**: `~/.openclaw/hooks/` (installati dall'utente, condivisi tra workspace). Le directory extra da `hooks.internal.load.extraDirs` condividono questa precedenza.
4. **Hook del workspace**: `<workspace>/hooks/` (per agente, disabilitati per impostazione predefinita finché non vengono abilitati esplicitamente)

Gli hook del workspace possono aggiungere nuovi nomi di hook, ma non possono sovrascrivere hook inclusi, gestiti o forniti da plugin con lo stesso nome.

### Pacchetti di hook

I pacchetti di hook sono pacchetti npm che esportano hook tramite `openclaw.hooks` in `package.json`. Installa con:

```bash
openclaw plugins install <path-or-spec>
```

Le specifiche npm sono solo di registro (nome pacchetto + versione esatta facoltativa o dist-tag). Le specifiche Git/URL/file e gli intervalli semver vengono rifiutati.

## Hook inclusi

| Hook                  | Eventi                         | Cosa fa                                               |
| --------------------- | ------------------------------ | ----------------------------------------------------- |
| session-memory        | `command:new`, `command:reset` | Salva il contesto della sessione in `<workspace>/memory/` |
| bootstrap-extra-files | `agent:bootstrap`              | Inserisce file bootstrap aggiuntivi da pattern glob   |
| command-logger        | `command`                      | Registra tutti i comandi in `~/.openclaw/logs/commands.log` |
| boot-md               | `gateway:startup`              | Esegue `BOOT.md` all'avvio del gateway                |

Abilita qualsiasi hook incluso:

```bash
openclaw hooks enable <hook-name>
```

### Dettagli di session-memory

Estrae gli ultimi 15 messaggi utente/assistente, genera uno slug descrittivo per il nome file tramite LLM e salva in `<workspace>/memory/YYYY-MM-DD-slug.md`. Richiede che `workspace.dir` sia configurato.

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

I percorsi vengono risolti in modo relativo al workspace. Vengono caricati solo i nomi base bootstrap riconosciuti (`AGENTS.md`, `SOUL.md`, `TOOLS.md`, `IDENTITY.md`, `USER.md`, `HEARTBEAT.md`, `BOOTSTRAP.md`, `MEMORY.md`).

## Hook dei plugin

I plugin possono registrare hook tramite il Plugin SDK per un'integrazione più profonda: intercettazione delle chiamate agli strumenti, modifica dei prompt, controllo del flusso dei messaggi e altro ancora. Il Plugin SDK espone 28 hook che coprono risoluzione del modello, ciclo di vita dell'agente, flusso dei messaggi, esecuzione degli strumenti, coordinamento dei subagenti e ciclo di vita del gateway.

Per il riferimento completo degli hook dei plugin, inclusi `before_tool_call`, `before_agent_reply`, `before_install` e tutti gli altri hook dei plugin, vedi [Plugin Architecture](/plugins/architecture#provider-runtime-hooks).

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

Directory hook extra:

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
Il formato di configurazione legacy con array `hooks.internal.handlers` è ancora supportato per retrocompatibilità, ma i nuovi hook dovrebbero usare il sistema basato sull'individuazione.
</Note>

## Riferimento CLI

```bash
# Elenca tutti gli hook (aggiungi --eligible, --verbose, o --json)
openclaw hooks list

# Mostra informazioni dettagliate su un hook
openclaw hooks info <hook-name>

# Mostra un riepilogo di idoneità
openclaw hooks check

# Abilita/disabilita
openclaw hooks enable <hook-name>
openclaw hooks disable <hook-name>
```

## Buone pratiche

- **Mantieni gli handler rapidi.** Gli hook vengono eseguiti durante l'elaborazione dei comandi. Avvia lavori pesanti in modalità fire-and-forget con `void processInBackground(event)`.
- **Gestisci gli errori con eleganza.** Racchiudi le operazioni rischiose in try/catch; non lanciare eccezioni così gli altri handler possono continuare a essere eseguiti.
- **Filtra subito gli eventi.** Restituisci immediatamente se il tipo/azione dell'evento non è rilevante.
- **Usa chiavi evento specifiche.** Preferisci `"events": ["command:new"]` rispetto a `"events": ["command"]` per ridurre l'overhead.

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

Controlla la presenza di binari mancanti (PATH), variabili d'ambiente, valori di configurazione o compatibilità del sistema operativo.

### Hook non in esecuzione

1. Verifica che l'hook sia abilitato: `openclaw hooks list`
2. Riavvia il processo gateway in modo che gli hook vengano ricaricati.
3. Controlla i log del gateway: `./scripts/clawlog.sh | grep hook`

## Correlati

- [Riferimento CLI: hooks](/cli/hooks)
- [Webhooks](/automation/cron-jobs#webhooks)
- [Plugin Architecture](/plugins/architecture#provider-runtime-hooks) — riferimento completo degli hook dei plugin
- [Configuration](/gateway/configuration-reference#hooks)
