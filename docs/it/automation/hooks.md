---
read_when:
    - Vuoi un'automazione guidata da eventi per `/new`, `/reset`, `/stop` e gli eventi del ciclo di vita dell'agente
    - Vuoi creare, installare o eseguire il debug degli hook
summary: 'Hook: automazione guidata da eventi per i comandi e gli eventi del ciclo di vita'
title: Hook
x-i18n:
    generated_at: "2026-04-21T08:21:16Z"
    model: gpt-5.4
    provider: openai
    source_hash: 5269c3ca3a45d23d79232e041c0980ecaab93fd6f0f1e39e0b2a76cb4c8b5c8b
    source_path: automation/hooks.md
    workflow: 15
---

# Hook

Gli hook sono piccoli script che vengono eseguiti quando accade qualcosa all'interno del Gateway. Possono essere individuati dalle directory e ispezionati con `openclaw hooks`. Il Gateway carica gli hook interni solo dopo che hai abilitato gli hook o configurato almeno una voce di hook, un pacchetto di hook, un handler legacy o una directory di hook aggiuntiva.

Esistono due tipi di hook in OpenClaw:

- **Hook interni** (questa pagina): vengono eseguiti all'interno del Gateway quando si attivano eventi dell'agente, come `/new`, `/reset`, `/stop` o eventi del ciclo di vita.
- **Webhook**: endpoint HTTP esterni che consentono ad altri sistemi di attivare operazioni in OpenClaw. Vedi [Webhook](/it/automation/cron-jobs#webhooks).

Gli hook possono anche essere inclusi nei plugin. `openclaw hooks list` mostra sia gli hook standalone sia quelli gestiti dai plugin.

## Guida rapida

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

| Evento                   | Quando si attiva                                |
| ------------------------ | ----------------------------------------------- |
| `command:new`            | Comando `/new` emesso                           |
| `command:reset`          | Comando `/reset` emesso                         |
| `command:stop`           | Comando `/stop` emesso                          |
| `command`                | Qualsiasi evento di comando (listener generale) |
| `session:compact:before` | Prima che Compaction riepiloghi la cronologia   |
| `session:compact:after`  | Dopo il completamento di Compaction             |
| `session:patch`          | Quando le proprietà della sessione vengono modificate |
| `agent:bootstrap`        | Prima che i file bootstrap del workspace vengano inseriti |
| `gateway:startup`        | Dopo l'avvio dei canali e il caricamento degli hook |
| `message:received`       | Messaggio in entrata da qualsiasi canale        |
| `message:transcribed`    | Dopo il completamento della trascrizione audio  |
| `message:preprocessed`   | Dopo il completamento di tutta la comprensione di contenuti multimediali e link |
| `message:sent`           | Messaggio in uscita consegnato                  |

## Scrivere hook

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
description: "Breve descrizione di cosa fa questo hook"
metadata:
  { "openclaw": { "emoji": "🔗", "events": ["command:new"], "requires": { "bins": ["node"] } } }
---

# My Hook

Qui va la documentazione dettagliata.
```

**Campi dei metadati** (`metadata.openclaw`):

| Campo      | Descrizione                                              |
| ---------- | -------------------------------------------------------- |
| `emoji`    | Emoji mostrata per la CLI                                |
| `events`   | Array di eventi da ascoltare                             |
| `export`   | Export nominato da usare (predefinito: `"default"`)      |
| `os`       | Piattaforme richieste (ad es. `["darwin", "linux"]`)     |
| `requires` | `bins`, `anyBins`, `env` o percorsi `config` richiesti   |
| `always`   | Bypassa i controlli di idoneità (boolean)                |
| `install`  | Metodi di installazione                                  |

### Implementazione dell'handler

```typescript
const handler = async (event) => {
  if (event.type !== "command" || event.action !== "new") {
    return;
  }

  console.log(`[my-hook] New command triggered`);
  // La tua logica qui

  // Facoltativamente invia un messaggio all'utente
  event.messages.push("Hook executed!");
};

export default handler;
```

Ogni evento include: `type`, `action`, `sessionKey`, `timestamp`, `messages` (usa push per inviare all'utente) e `context` (dati specifici dell'evento).

### Punti principali del contesto evento

**Eventi di comando** (`command:new`, `command:reset`): `context.sessionEntry`, `context.previousSessionEntry`, `context.commandSource`, `context.workspaceDir`, `context.cfg`.

**Eventi di messaggio** (`message:received`): `context.from`, `context.content`, `context.channelId`, `context.metadata` (dati specifici del provider inclusi `senderId`, `senderName`, `guildId`).

**Eventi di messaggio** (`message:sent`): `context.to`, `context.content`, `context.success`, `context.channelId`.

**Eventi di messaggio** (`message:transcribed`): `context.transcript`, `context.from`, `context.channelId`, `context.mediaPath`.

**Eventi di messaggio** (`message:preprocessed`): `context.bodyForAgent` (corpo finale arricchito), `context.from`, `context.channelId`.

**Eventi bootstrap** (`agent:bootstrap`): `context.bootstrapFiles` (array mutabile), `context.agentId`.

**Eventi di patch della sessione** (`session:patch`): `context.sessionEntry`, `context.patch` (solo i campi modificati), `context.cfg`. Solo i client con privilegi possono attivare eventi patch.

**Eventi di Compaction**: `session:compact:before` include `messageCount`, `tokenCount`. `session:compact:after` aggiunge `compactedCount`, `summaryLength`, `tokensBefore`, `tokensAfter`.

## Individuazione degli hook

Gli hook vengono individuati da queste directory, in ordine di precedenza crescente per la sovrascrittura:

1. **Hook inclusi**: distribuiti con OpenClaw
2. **Hook dei plugin**: hook inclusi nei plugin installati
3. **Hook gestiti**: `~/.openclaw/hooks/` (installati dall'utente, condivisi tra workspace). Le directory aggiuntive da `hooks.internal.load.extraDirs` condividono questa precedenza.
4. **Hook del workspace**: `<workspace>/hooks/` (per agente, disabilitati per impostazione predefinita finché non vengono abilitati esplicitamente)

Gli hook del workspace possono aggiungere nuovi nomi di hook ma non possono sovrascrivere hook inclusi, gestiti o forniti da plugin con lo stesso nome.

Il Gateway salta l'individuazione degli hook interni all'avvio finché gli hook interni non sono configurati. Abilita un hook incluso o gestito con `openclaw hooks enable <name>`, installa un pacchetto di hook oppure imposta `hooks.internal.enabled=true` per aderire esplicitamente. Quando abiliti un singolo hook nominato, il Gateway carica solo l'handler di quell'hook; `hooks.internal.enabled=true`, le directory di hook aggiuntive e gli handler legacy attivano l'individuazione estesa.

### Pacchetti di hook

I pacchetti di hook sono pacchetti npm che esportano hook tramite `openclaw.hooks` in `package.json`. Installa con:

```bash
openclaw plugins install <path-or-spec>
```

Le specifiche npm sono solo registry-only (nome del pacchetto + versione esatta opzionale o dist-tag). Le specifiche Git/URL/file e gli intervalli semver vengono rifiutati.

## Hook inclusi

| Hook                  | Eventi                         | Cosa fa                                               |
| --------------------- | ------------------------------ | ----------------------------------------------------- |
| session-memory        | `command:new`, `command:reset` | Salva il contesto della sessione in `<workspace>/memory/` |
| bootstrap-extra-files | `agent:bootstrap`              | Inserisce file bootstrap aggiuntivi da pattern glob   |
| command-logger        | `command`                      | Registra tutti i comandi in `~/.openclaw/logs/commands.log` |
| boot-md               | `gateway:startup`              | Esegue `BOOT.md` quando il gateway si avvia           |

Abilita qualsiasi hook incluso:

```bash
openclaw hooks enable <hook-name>
```

<a id="session-memory"></a>

### Dettagli di session-memory

Estrae gli ultimi 15 messaggi utente/assistant, genera uno slug descrittivo per il nome file tramite LLM e lo salva in `<workspace>/memory/YYYY-MM-DD-slug.md`. Richiede che `workspace.dir` sia configurato.

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

I percorsi vengono risolti relativamente al workspace. Vengono caricati solo i nomi base bootstrap riconosciuti (`AGENTS.md`, `SOUL.md`, `TOOLS.md`, `IDENTITY.md`, `USER.md`, `HEARTBEAT.md`, `BOOTSTRAP.md`, `MEMORY.md`).

<a id="command-logger"></a>

### Dettagli di command-logger

Registra ogni slash command in `~/.openclaw/logs/commands.log`.

<a id="boot-md"></a>

### Dettagli di boot-md

Esegue `BOOT.md` dal workspace attivo quando il gateway si avvia.

## Hook dei plugin

I plugin possono registrare hook tramite il Plugin SDK per un'integrazione più profonda: intercettare chiamate agli strumenti, modificare prompt, controllare il flusso dei messaggi e altro ancora. Il Plugin SDK espone 28 hook che coprono la risoluzione del modello, il ciclo di vita dell'agente, il flusso dei messaggi, l'esecuzione degli strumenti, il coordinamento dei subagent e il ciclo di vita del gateway.

Per il riferimento completo degli hook dei plugin, inclusi `before_tool_call`, `before_agent_reply`, `before_install` e tutti gli altri hook dei plugin, vedi [Plugin Architecture](/it/plugins/architecture#provider-runtime-hooks).

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
Il formato di configurazione legacy `hooks.internal.handlers` come array è ancora supportato per retrocompatibilità, ma i nuovi hook dovrebbero usare il sistema basato sull'individuazione.
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

- **Mantieni gli handler veloci.** Gli hook vengono eseguiti durante l'elaborazione dei comandi. Per attività pesanti usa modalità fire-and-forget con `void processInBackground(event)`.
- **Gestisci gli errori con attenzione.** Inserisci le operazioni rischiose in try/catch; non lanciare eccezioni così gli altri handler possono essere eseguiti.
- **Filtra presto gli eventi.** Restituisci immediatamente se il tipo/azione dell'evento non è pertinente.
- **Usa chiavi evento specifiche.** Preferisci `"events": ["command:new"]` a `"events": ["command"]` per ridurre l'overhead.

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

Controlla eventuali binari mancanti (PATH), variabili d'ambiente, valori di configurazione o compatibilità con il sistema operativo.

### Hook non eseguito

1. Verifica che l'hook sia abilitato: `openclaw hooks list`
2. Riavvia il processo gateway in modo che gli hook vengano ricaricati.
3. Controlla i log del gateway: `./scripts/clawlog.sh | grep hook`

## Correlati

- [Riferimento CLI: hooks](/cli/hooks)
- [Webhook](/it/automation/cron-jobs#webhooks)
- [Plugin Architecture](/it/plugins/architecture#provider-runtime-hooks) — riferimento completo degli hook dei plugin
- [Configurazione](/it/gateway/configuration-reference#hooks)
