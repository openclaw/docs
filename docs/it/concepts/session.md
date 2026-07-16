---
read_when:
    - Si desidera comprendere l'instradamento e l'isolamento delle sessioni
    - Si desidera configurare l'ambito dei messaggi diretti per configurazioni multiutente
    - Si stanno eseguendo il debug dei ripristini giornalieri o per inattività delle sessioni
summary: Come OpenClaw gestisce le sessioni di conversazione
title: Gestione delle sessioni
x-i18n:
    generated_at: "2026-07-16T14:10:15Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 8ec9e33b4d288fa12016092ab2201431631fc9cb77e6e9d4261d348d5a849f65
    source_path: concepts/session.md
    workflow: 16
---

OpenClaw instrada ogni messaggio in entrata verso una **sessione** in base alla sua
provenienza: messaggi diretti, chat di gruppo, processi Cron, ecc. L'intero stato della sessione è gestito dal
**Gateway**; i client dell'interfaccia utente interrogano il Gateway per ottenere i dati della sessione.

## Come vengono instradati i messaggi

| Origine          | Comportamento                  |
| --------------- | ------------------------- |
| Messaggi diretti | Sessione condivisa per impostazione predefinita |
| Chat di gruppo     | Isolata per gruppo        |
| Stanze/canali  | Isolata per stanza         |
| Processi Cron       | Nuova sessione a ogni esecuzione     |
| Webhook        | Isolata per hook         |

## Isolamento dei messaggi diretti

Per impostazione predefinita, tutti i messaggi diretti condividono una sessione per garantire la continuità, soluzione adatta alle
configurazioni con un solo utente.

<Warning>
Se più persone possono inviare messaggi all'agente, abilitare l'isolamento dei messaggi diretti. In caso contrario, tutti gli
utenti condividono lo stesso contesto di conversazione, quindi i messaggi privati di Alice sarebbero
visibili a Bob.
</Warning>

```json5
{
  session: {
    dmScope: "per-channel-peer", // isola per canale + mittente
  },
}
```

Opzioni di `session.dmScope`:

| Valore                      | Comportamento                                  |
| -------------------------- | ----------------------------------------- |
| `main` (predefinito)           | Tutti i messaggi diretti condividono una sessione                 |
| `per-peer`                 | Isola per mittente, tra canali diversi        |
| `per-channel-peer`         | Isola per canale + mittente (consigliato) |
| `per-account-channel-peer` | Isola per account + canale + mittente     |

<Tip>
Se la stessa persona entra in contatto da più canali, utilizzare
`session.identityLinks` per associare le sue identità a un unico ID peer canonico, in modo che
condividano una sessione.
</Tip>

### Ancoraggio dei canali collegati

I comandi di ancoraggio spostano il percorso di risposta della sessione corrente della chat diretta verso un altro
canale collegato senza avviare una nuova sessione. Consultare
[Ancoraggio dei canali](/it/concepts/channel-docking) per esempi, configurazione e
risoluzione dei problemi.

Verificare la configurazione con `openclaw security audit`.

## Ciclo di vita della sessione

Le sessioni vengono riutilizzate finché non scadono in base a `session.reset`:

- **Reimpostazione giornaliera** (`mode: "daily"` per impostazione predefinita) - nuova sessione a un'ora locale
  configurata (`session.reset.atHour`, valore predefinito `4`, 0-23) sull'host del Gateway. La validità
  giornaliera si basa sul momento in cui è iniziato l'`sessionId` corrente, non sulle successive
  scritture dei metadati.
- **Reimpostazione per inattività** (`mode: "idle"`) - nuova sessione dopo `session.reset.idleMinutes`
  di inattività. La validità per inattività si basa sull'ultima interazione effettiva
  dell'utente o del canale, quindi gli eventi di sistema Heartbeat, Cron ed exec non mantengono
  attiva la sessione.
- **Reimpostazione manuale** - digitare `/new` o `/reset` nella chat. `/new <model>`
  cambia anche il modello.

Quando sono configurate sia la reimpostazione giornaliera sia quella per inattività, prevale quella che scade per prima.
Le interazioni di Heartbeat, Cron, exec e di altri eventi di sistema possono scrivere metadati della sessione,
ma tali scritture non prolungano la validità della reimpostazione giornaliera o per inattività. Quando una reimpostazione
rinnova la sessione, le notifiche degli eventi di sistema in coda per la sessione precedente vengono
eliminate, in modo che gli aggiornamenti obsoleti in background non vengano anteposti al primo prompt della
nuova sessione.

Le sessioni con una sessione CLI attiva gestita dal provider non vengono interrotte dall'impostazione
giornaliera predefinita implicita. Utilizzare `/reset` o configurare esplicitamente `session.reset` quando tali
sessioni devono scadere in base a un timer.

Sostituire l'impostazione predefinita per tipo di chat o per canale:

```json5
{
  session: {
    reset: { mode: "daily", atHour: 4 },
    resetByType: {
      group: { mode: "idle", idleMinutes: 120 },
      thread: { mode: "daily", atHour: 6 },
    },
    resetByChannel: {
      discord: { mode: "idle", idleMinutes: 10080 },
    },
  },
}
```

`resetByType` supporta `direct` (alias legacy `dm`), `group` e `thread`.
Il valore legacy di primo livello `session.idleMinutes` continua a funzionare come alias di compatibilità per
un'impostazione predefinita in modalità inattività quando non è definito alcun blocco `session.reset`/`resetByType`.

## Dove risiede lo stato

- **Righe delle sessioni di runtime:** `~/.openclaw/agents/<agentId>/agent/openclaw-agent.sqlite`
- **File delle trascrizioni archiviate:** `~/.openclaw/agents/<agentId>/sessions/`
- **Origine della migrazione delle righe legacy:** `~/.openclaw/agents/<agentId>/sessions/sessions.json`

Le righe delle sessioni nel database SQLite di ciascun agente conservano timestamp distinti
del ciclo di vita:

- `sessionStartedAt`: momento in cui è iniziato l'`sessionId` corrente; viene utilizzato dalla reimpostazione giornaliera.
- `lastInteractionAt`: ultima interazione dell'utente o del canale che prolunga la durata per inattività.
- `updatedAt`: ultima modifica della riga nell'archivio; utile per elenchi ed eliminazioni, ma non
  determinante per la validità della reimpostazione giornaliera o per inattività.

Durante la migrazione da installazioni precedenti, l'avvio del Gateway e `openclaw doctor
--fix` importano automaticamente in SQLite le righe legacy `sessions.json` e la cronologia attiva delle trascrizioni JSONL.
Le righe prive di `sessionStartedAt` vengono risolte dall'intestazione della sessione
nella trascrizione JSONL legacy, quando disponibile. Se una riga precedente è priva anche
di `lastInteractionAt`, la validità per inattività utilizza come ripiego l'ora di inizio della sessione,
non le successive scritture amministrative. Utilizzare `openclaw doctor --session-sqlite inspect
--session-sqlite-all-agents` e la [Sequenza di migrazione di
Doctor](/it/cli/doctor#session-sqlite-migration) quando si desiderano prove esplicite
di ispezione o convalida.

## Manutenzione delle sessioni

OpenClaw limita nel tempo l'archiviazione delle sessioni tramite `session.maintenance`; di seguito sono riportati i valori
predefiniti:

```json5
{
  session: {
    maintenance: {
      mode: "enforce", // "enforce" applica la pulizia; "warn" genera solo un rapporto
      pruneAfter: "30d",
      maxEntries: 500,
    },
  },
}
```

Per limiti `maxEntries` adatti ad ambienti di produzione, le scritture del runtime del Gateway utilizzano un piccolo
buffer di soglia massima ed eseguono la pulizia in batch fino al limite configurato.
Le letture dell'archivio delle sessioni non eliminano né limitano le voci durante l'avvio del Gateway, quindi
l'avvio e le sessioni Cron isolate non sostengono il costo di una pulizia completa dell'archivio.
`openclaw sessions cleanup --enforce` applica immediatamente il limite.

Le sessioni di controllo delle esecuzioni del modello del Gateway hanno per impostazione predefinita una durata breve. Le righe corrispondenti a
`agent:*:explicit:model-run-<uuid>` utilizzano una conservazione fissa di `24h`, ma la pulizia è
vincolata alla pressione: rimuove le righe di controllo obsolete solo quando viene raggiunta la pressione
dovuta alla manutenzione o al limite delle voci di sessione e viene eseguita prima del più ampio limite
temporale per le voci obsolete e del limite delle voci. Le normali sessioni dirette, di gruppo, thread, Cron, hook, Heartbeat,
ACP e dei sotto-agenti non ereditano questa conservazione di 24h.

La manutenzione conserva i riferimenti durevoli alle conversazioni esterne, incluse le sessioni
di gruppo e le sessioni di chat circoscritte ai thread, consentendo comunque alle voci sintetiche di Cron,
hook, Heartbeat, ACP e dei sotto-agenti di scadere.

Se in precedenza era utilizzato l'isolamento dei messaggi diretti e in seguito `session.dmScope` è stato riportato a
`main`, visualizzare in anteprima le righe obsolete dei messaggi diretti indicizzate per peer con
`openclaw sessions cleanup --dry-run --fix-dm-scope`. L'applicazione dello stesso flag
ritira tali vecchie righe dei messaggi diretti e conserva le relative trascrizioni come archivi
eliminati.

Visualizzare in anteprima qualsiasi esecuzione di manutenzione con `openclaw sessions cleanup --dry-run`.

## Ispezione delle sessioni

| Comando                    | Mostra                                           |
| -------------------------- | ----------------------------------------------- |
| `openclaw status`          | Percorso dell'archivio delle sessioni e attività recente          |
| `openclaw sessions --json` | Tutte le sessioni (filtrare con `--active <minutes>`) |
| `/status` nella chat          | Utilizzo del contesto, modello e opzioni               |
| `/context list`            | Contenuto del prompt di sistema                    |

## Ulteriori letture

- [Ricerca nelle sessioni](/it/concepts/session-search) - ricerca full-text nelle trascrizioni precedenti
- [Eliminazione dei dati delle sessioni](/it/concepts/session-pruning) - riduzione dei risultati degli strumenti
- [Compaction](/it/concepts/compaction) - riepilogo delle conversazioni lunghe
- [Strumenti per le sessioni](/it/concepts/session-tool) - strumenti dell'agente per operazioni tra sessioni
- [Approfondimento sulla gestione delle sessioni](/it/reference/session-management-compaction) -
  schema dell'archivio, trascrizioni, criteri di invio, metadati di origine e configurazione avanzata
- [Multi-agente](/it/concepts/multi-agent) - instradamento e isolamento delle sessioni tra agenti
- [Attività in background](/it/automation/tasks) - come il lavoro separato crea record di attività con riferimenti alle sessioni
- [Instradamento dei canali](/it/channels/channel-routing) - come i messaggi in entrata vengono instradati verso le sessioni

## Contenuti correlati

- [Eliminazione dei dati delle sessioni](/it/concepts/session-pruning)
- [Strumenti per le sessioni](/it/concepts/session-tool)
- [Coda dei comandi](/it/concepts/queue)
