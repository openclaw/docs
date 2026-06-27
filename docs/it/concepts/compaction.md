---
read_when:
    - Vuoi capire la compattazione automatica e /compact
    - Stai eseguendo il debug di sessioni lunghe che raggiungono i limiti di contesto
summary: Come OpenClaw riassume conversazioni lunghe per restare entro i limiti del modello
title: Compaction
x-i18n:
    generated_at: "2026-06-27T17:24:12Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 71c1665055574622926a4f13ee82b97f1c45e679a895db78da983919c0a5458f
    source_path: concepts/compaction.md
    workflow: 16
---

Ogni modello ha una finestra di contesto: il numero massimo di token che può elaborare. Quando una conversazione si avvicina a quel limite, OpenClaw esegue la **Compaction** dei messaggi meno recenti in un riepilogo, così la chat può continuare.

## Come funziona

1. I turni meno recenti della conversazione vengono riassunti in una voce compatta.
2. Il riepilogo viene salvato nella trascrizione della sessione.
3. I messaggi recenti vengono mantenuti intatti.

Quando OpenClaw suddivide la cronologia in blocchi di Compaction, mantiene le chiamate agli strumenti dell'assistente abbinate alle rispettive voci `toolResult`. Se un punto di divisione cade all'interno di un blocco strumento, OpenClaw sposta il confine in modo che la coppia resti insieme e la coda corrente non riassunta venga preservata.

La cronologia completa della conversazione resta su disco. La Compaction cambia solo ciò che il modello vede al turno successivo.

## Compaction automatica

La Compaction automatica è attiva per impostazione predefinita. Viene eseguita quando la sessione si avvicina al limite di contesto, oppure quando il modello restituisce un errore di overflow del contesto (in tal caso OpenClaw esegue la Compaction e riprova).

Vedrai:

- `embedded run auto-compaction start` / `complete` nei normali log del Gateway.
- `🧹 Auto-compaction complete` in modalità dettagliata.
- `/status` che mostra `🧹 Compactions: <count>`.

<Info>
Prima della Compaction, OpenClaw ricorda automaticamente all'agente di salvare le note importanti nei file di [memoria](/it/concepts/memory). Questo previene la perdita di contesto.
</Info>

<AccordionGroup>
  <Accordion title="Recognized overflow signatures">
    OpenClaw rileva l'overflow del contesto da questi pattern di errore dei provider:

    - `request_too_large`
    - `context length exceeded`
    - `input exceeds the maximum number of tokens`
    - `input token count exceeds the maximum number of input tokens`
    - `input is too long for the model`
    - `ollama error: context length exceeded`

  </Accordion>
</AccordionGroup>

## Compaction manuale

Digita `/compact` in qualsiasi chat per forzare una Compaction. Aggiungi istruzioni per guidare il riepilogo:

```
/compact Focus on the API design decisions
```

Quando `agents.defaults.compaction.keepRecentTokens` è impostato, la Compaction manuale rispetta quel punto di taglio di OpenClaw e mantiene la coda recente nel contesto ricostruito. Senza un budget di mantenimento esplicito, la Compaction manuale si comporta come un checkpoint rigido e continua solo dal nuovo riepilogo.

## Configurazione

Configura la Compaction sotto `agents.defaults.compaction` nel tuo `openclaw.json`. Le opzioni più comuni sono elencate di seguito; per il riferimento completo, vedi [Approfondimento sulla gestione della sessione](/it/reference/session-management-compaction).

### Usare un modello diverso

Per impostazione predefinita, la Compaction usa il modello principale dell'agente. Imposta `agents.defaults.compaction.model` per delegare la sintesi a un modello più capace o specializzato. L'override accetta una stringa `provider/model-id` o un alias semplice configurato sotto `agents.defaults.models`:

```json
{
  "agents": {
    "defaults": {
      "compaction": {
        "model": "openrouter/anthropic/claude-sonnet-4-6"
      }
    }
  }
}
```

Gli alias semplici configurati vengono risolti nel rispettivo provider e modello canonici prima dell'avvio della Compaction. Se un valore semplice corrisponde sia a un alias sia a un ID modello letterale configurato, vince l'ID modello letterale. Un valore semplice senza corrispondenza resta un ID modello sul provider attivo.

Funziona anche con modelli locali, ad esempio un secondo modello Ollama dedicato alla sintesi:

```json
{
  "agents": {
    "defaults": {
      "compaction": {
        "model": "ollama/llama3.1:8b"
      }
    }
  }
}
```

Quando non è impostata, la Compaction parte dal modello della sessione attiva. Se la sintesi fallisce con un errore del provider idoneo al fallback del modello, OpenClaw ritenta quel tentativo di Compaction tramite la catena di fallback dei modelli esistente della sessione. La scelta di fallback è temporanea e non viene riscritta nello stato della sessione. Un override esplicito `agents.defaults.compaction.model` resta esatto e non eredita la catena di fallback della sessione.

### Preservazione degli identificatori

La sintesi della Compaction preserva per impostazione predefinita gli identificatori opachi (`identifierPolicy: "strict"`). Esegui l'override con `identifierPolicy: "off"` per disabilitarla, oppure con `identifierPolicy: "custom"` più `identifierInstructions` per indicazioni personalizzate.

### Protezione dei byte della trascrizione attiva

Quando `agents.defaults.compaction.maxActiveTranscriptBytes` è impostato, OpenClaw attiva la normale Compaction locale prima di un'esecuzione se il JSONL attivo raggiunge quella dimensione. Questo è utile per sessioni di lunga durata in cui la gestione del contesto lato provider può mantenere sano il contesto del modello mentre la trascrizione locale continua a crescere. Non divide i byte JSONL grezzi; chiede alla normale pipeline di Compaction di creare un riepilogo semantico.

<Warning>
La protezione dei byte richiede `truncateAfterCompaction: true`. Senza rotazione della trascrizione, il file attivo non si ridurrebbe e la protezione resterebbe inattiva.
</Warning>

### Trascrizioni successive

Quando `agents.defaults.compaction.truncateAfterCompaction` è abilitato, OpenClaw non riscrive sul posto la trascrizione esistente. Crea una nuova trascrizione successiva attiva dal riepilogo della Compaction, dallo stato preservato e dalla coda non riassunta, quindi registra metadati di checkpoint che indirizzano i flussi di branch/ripristino verso quel successore compattato.
Le trascrizioni successive eliminano anche i turni utente lunghi esattamente duplicati che arrivano
entro una breve finestra di ritentativo, così le tempeste di retry del canale non vengono portate nella
successiva trascrizione attiva dopo la Compaction.

OpenClaw non scrive più copie separate `.checkpoint.*.jsonl` per le nuove
Compaction. I file checkpoint legacy esistenti possono ancora essere usati finché referenziati
e vengono eliminati dalla normale pulizia della sessione.

### Avvisi di Compaction

Per impostazione predefinita, la Compaction viene eseguita silenziosamente. Imposta `notifyUser` per mostrare brevi messaggi di stato quando la Compaction inizia e si completa:

```json5
{
  agents: {
    defaults: {
      compaction: {
        notifyUser: true,
      },
    },
  },
}
```

### Flush della memoria

Prima della Compaction, OpenClaw può eseguire un turno di **flush silenzioso della memoria** per archiviare note durevoli su disco. Imposta `agents.defaults.compaction.memoryFlush.model` quando questo turno di housekeeping deve usare un modello locale invece del modello della conversazione attiva:

```json
{
  "agents": {
    "defaults": {
      "compaction": {
        "memoryFlush": {
          "model": "ollama/qwen3:8b"
        }
      }
    }
  }
}
```

L'override del modello di flush della memoria è esatto e non eredita la catena di fallback della sessione attiva. Vedi [Memoria](/it/concepts/memory) per dettagli e configurazione.

## Provider di Compaction collegabili

I Plugin possono registrare un provider di Compaction personalizzato tramite `registerCompactionProvider()` nell'API del Plugin. Quando un provider è registrato e configurato, OpenClaw delega la sintesi a esso invece che alla pipeline LLM integrata.

Per usare un provider registrato, imposta il suo ID nella configurazione:

```json
{
  "agents": {
    "defaults": {
      "compaction": {
        "provider": "my-provider"
      }
    }
  }
}
```

Impostare un `provider` forza automaticamente `mode: "safeguard"`. I provider ricevono le stesse istruzioni di Compaction e la stessa policy di preservazione degli identificatori del percorso integrato, e OpenClaw preserva comunque il contesto di suffisso dei turni recenti e dei turni divisi dopo l'output del provider.

<Note>
Se il provider fallisce o restituisce un risultato vuoto, OpenClaw ripiega sulla sintesi LLM integrata.
</Note>

## Compaction e pruning

|                  | Compaction                              | Pruning                                      |
| ---------------- | --------------------------------------- | -------------------------------------------- |
| **Cosa fa**      | Riassume la conversazione meno recente  | Taglia i vecchi risultati degli strumenti    |
| **Salvato?**     | Sì (nella trascrizione della sessione)  | No (solo in memoria, per richiesta)          |
| **Ambito**       | Intera conversazione                    | Solo risultati degli strumenti               |

Il [pruning della sessione](/it/concepts/session-pruning) è un complemento più leggero che taglia l'output degli strumenti senza riassumerlo.

## Risoluzione dei problemi

**La Compaction avviene troppo spesso?** La finestra di contesto del modello potrebbe essere piccola, oppure gli output degli strumenti potrebbero essere grandi. Prova ad abilitare il [pruning della sessione](/it/concepts/session-pruning).

**Il contesto sembra obsoleto dopo la Compaction?** Usa `/compact Focus on <topic>` per guidare il riepilogo, oppure abilita il [flush della memoria](/it/concepts/memory) così le note sopravvivono.

**Serve una situazione pulita?** `/new` avvia una nuova sessione senza eseguire la Compaction.

Per la configurazione avanzata (token di riserva, preservazione degli identificatori, motori di contesto personalizzati, Compaction lato server OpenAI), vedi l'[approfondimento sulla gestione della sessione](/it/reference/session-management-compaction).

## Correlati

- [Sessione](/it/concepts/session): gestione e ciclo di vita della sessione.
- [Pruning della sessione](/it/concepts/session-pruning): taglio dei risultati degli strumenti.
- [Contesto](/it/concepts/context): come viene costruito il contesto per i turni dell'agente.
- [Hook](/it/automation/hooks): hook del ciclo di vita della Compaction (`before_compaction`, `after_compaction`).
