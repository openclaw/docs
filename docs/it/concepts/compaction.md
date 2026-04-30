---
read_when:
    - Vuoi comprendere la Compaction automatica e /compact
    - Stai eseguendo il debug di sessioni lunghe che raggiungono i limiti di contesto
summary: Come OpenClaw riassume le conversazioni lunghe per rimanere entro i limiti del modello
title: Compaction
x-i18n:
    generated_at: "2026-04-30T08:46:06Z"
    model: gpt-5.5
    provider: openai
    source_hash: 9beac513a8226a7dd107cdc3a7bfd7550d87e98648004c80487db968c57742d4
    source_path: concepts/compaction.md
    workflow: 16
---

Ogni modello ha una finestra di contesto: il numero massimo di token che può elaborare. Quando una conversazione si avvicina a quel limite, OpenClaw **compatta** i messaggi precedenti in un riepilogo, così la chat può continuare.

## Come funziona

1. I turni precedenti della conversazione vengono riassunti in una voce compatta.
2. Il riepilogo viene salvato nella trascrizione della sessione.
3. I messaggi recenti vengono mantenuti intatti.

Quando OpenClaw divide la cronologia in blocchi di Compaction, mantiene le chiamate agli strumenti dell'assistente abbinate alle voci `toolResult` corrispondenti. Se un punto di divisione cade all'interno di un blocco di strumenti, OpenClaw sposta il confine in modo che la coppia resti insieme e la coda corrente non riassunta venga preservata.

La cronologia completa della conversazione resta su disco. La Compaction modifica solo ciò che il modello vede al turno successivo.

## Compaction automatica

La Compaction automatica è attiva per impostazione predefinita. Viene eseguita quando la sessione si avvicina al limite di contesto, oppure quando il modello restituisce un errore di overflow del contesto (in tal caso OpenClaw compatta e riprova).

Vedrai:

- `🧹 Auto-compaction complete` in modalità dettagliata.
- `/status` che mostra `🧹 Compactions: <count>`.

<Info>
Prima di compattare, OpenClaw ricorda automaticamente all'agente di salvare le note importanti nei file di [memoria](/it/concepts/memory). Questo evita la perdita di contesto.
</Info>

<AccordionGroup>
  <Accordion title="Firme di overflow riconosciute">
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

Quando `agents.defaults.compaction.keepRecentTokens` è impostato, la Compaction manuale rispetta quel punto di taglio Pi e mantiene la coda recente nel contesto ricostruito. Senza un budget di mantenimento esplicito, la Compaction manuale si comporta come un checkpoint rigido e continua solo dal nuovo riepilogo.

## Configurazione

Configura la Compaction sotto `agents.defaults.compaction` nel tuo `openclaw.json`. Le opzioni più comuni sono elencate sotto; per il riferimento completo, vedi [Approfondimento sulla gestione delle sessioni](/it/reference/session-management-compaction).

### Usare un modello diverso

Per impostazione predefinita, la Compaction usa il modello principale dell'agente. Imposta `agents.defaults.compaction.model` per delegare la sintesi a un modello più capace o specializzato. L'override accetta qualsiasi stringa `provider/model-id`:

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

Funziona anche con modelli locali, per esempio un secondo modello Ollama dedicato alla sintesi:

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

Quando non è impostato, la Compaction usa il modello principale dell'agente.

### Conservazione degli identificatori

La sintesi della Compaction conserva per impostazione predefinita gli identificatori opachi (`identifierPolicy: "strict"`). Esegui l'override con `identifierPolicy: "off"` per disabilitarla, oppure con `identifierPolicy: "custom"` più `identifierInstructions` per indicazioni personalizzate.

### Guardia sui byte della trascrizione attiva

Quando `agents.defaults.compaction.maxActiveTranscriptBytes` è impostato, OpenClaw attiva la normale Compaction locale prima di un'esecuzione se il JSONL attivo raggiunge quella dimensione. Questo è utile per sessioni di lunga durata in cui la gestione del contesto lato provider può mantenere sano il contesto del modello mentre la trascrizione locale continua a crescere. Non divide i byte JSONL grezzi; chiede alla normale pipeline di Compaction di creare un riepilogo semantico.

<Warning>
La guardia sui byte richiede `truncateAfterCompaction: true`. Senza rotazione della trascrizione, il file attivo non si ridurrebbe e la guardia resterebbe inattiva.
</Warning>

### Trascrizioni successive

Quando `agents.defaults.compaction.truncateAfterCompaction` è abilitato, OpenClaw non riscrive sul posto la trascrizione esistente. Crea una nuova trascrizione attiva successiva dal riepilogo della Compaction, dallo stato preservato e dalla coda non riassunta, poi mantiene il JSONL precedente come origine del checkpoint archiviato.
Le trascrizioni successive eliminano anche i turni utente lunghi duplicati esatti che arrivano
all'interno di una breve finestra di ritentativo, così le tempeste di ritentativi del canale non vengono trasferite nella
trascrizione attiva successiva dopo la Compaction.

I checkpoint precedenti alla Compaction vengono mantenuti solo finché restano sotto il limite di dimensione dei
checkpoint di OpenClaw; le trascrizioni attive sovradimensionate vengono comunque compattate, ma OpenClaw
salta il grande snapshot di debug invece di raddoppiare l'uso del disco.

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

Prima della Compaction, OpenClaw può eseguire un turno di **flush silenzioso della memoria** per archiviare su disco note durevoli. Imposta `agents.defaults.compaction.memoryFlush.model` quando questo turno di manutenzione deve usare un modello locale invece del modello attivo della conversazione:

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

I Plugin possono registrare un provider di Compaction personalizzato tramite `registerCompactionProvider()` sull'API del Plugin. Quando un provider è registrato e configurato, OpenClaw delega la sintesi a esso invece che alla pipeline LLM integrata.

Per usare un provider registrato, imposta il suo id nella tua configurazione:

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

L'impostazione di un `provider` forza automaticamente `mode: "safeguard"`. I provider ricevono le stesse istruzioni di Compaction e la stessa policy di conservazione degli identificatori del percorso integrato, e OpenClaw preserva comunque il contesto di suffisso dei turni recenti e dei turni divisi dopo l'output del provider.

<Note>
Se il provider non riesce o restituisce un risultato vuoto, OpenClaw ripiega sulla sintesi LLM integrata.
</Note>

## Compaction e pruning

|                  | Compaction                    | Pruning                          |
| ---------------- | ----------------------------- | -------------------------------- |
| **Cosa fa** | Riassume la conversazione precedente | Tronca i vecchi risultati degli strumenti           |
| **Salvato?**       | Sì (nella trascrizione della sessione)   | No (solo in memoria, per richiesta) |
| **Ambito**        | Intera conversazione           | Solo risultati degli strumenti                |

Il [pruning della sessione](/it/concepts/session-pruning) è un complemento più leggero che tronca l'output degli strumenti senza riassumere.

## Risoluzione dei problemi

**Compaction troppo frequente?** La finestra di contesto del modello potrebbe essere piccola, oppure gli output degli strumenti potrebbero essere grandi. Prova ad abilitare il [pruning della sessione](/it/concepts/session-pruning).

**Il contesto sembra stantio dopo la Compaction?** Usa `/compact Focus on <topic>` per guidare il riepilogo, oppure abilita il [flush della memoria](/it/concepts/memory) così le note sopravvivono.

**Serve una tabula rasa?** `/new` avvia una nuova sessione senza compattare.

Per la configurazione avanzata (token di riserva, conservazione degli identificatori, motori di contesto personalizzati, Compaction lato server OpenAI), vedi l'[Approfondimento sulla gestione delle sessioni](/it/reference/session-management-compaction).

## Correlati

- [Sessione](/it/concepts/session): gestione e ciclo di vita della sessione.
- [Pruning della sessione](/it/concepts/session-pruning): troncamento dei risultati degli strumenti.
- [Contesto](/it/concepts/context): come viene costruito il contesto per i turni dell'agente.
- [Hook](/it/automation/hooks): hook del ciclo di vita della Compaction (`before_compaction`, `after_compaction`).
