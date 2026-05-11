---
read_when:
    - Vuoi capire la compattazione automatica e /compact
    - Stai eseguendo il debug di sessioni lunghe che raggiungono i limiti di contesto
summary: Come OpenClaw riassume le conversazioni lunghe per rimanere entro i limiti del modello
title: Compaction
x-i18n:
    generated_at: "2026-05-11T20:26:38Z"
    model: gpt-5.5
    provider: openai
    source_hash: edef60498a1e91405bd42d5e6eb4883719487f6d6f40936c4168e8bc5f40a39a
    source_path: concepts/compaction.md
    workflow: 16
---

Ogni modello ha una finestra di contesto: il numero massimo di token che può elaborare. Quando una conversazione si avvicina a quel limite, OpenClaw **compatta** i messaggi più vecchi in un riepilogo, così la chat può continuare.

## Come funziona

1. I turni più vecchi della conversazione vengono riassunti in una voce compatta.
2. Il riepilogo viene salvato nella trascrizione della sessione.
3. I messaggi recenti vengono mantenuti intatti.

Quando OpenClaw divide la cronologia in blocchi di compattazione, mantiene le chiamate agli strumenti dell'assistente abbinate alle corrispondenti voci `toolResult`. Se un punto di divisione cade all'interno di un blocco strumento, OpenClaw sposta il limite in modo che la coppia resti unita e che la coda corrente non riassunta venga preservata.

La cronologia completa della conversazione resta su disco. La compattazione cambia solo ciò che il modello vede al turno successivo.

## Auto-compattazione

L'auto-compattazione è attiva per impostazione predefinita. Viene eseguita quando la sessione si avvicina al limite di contesto, oppure quando il modello restituisce un errore di superamento del contesto (nel qual caso OpenClaw compatta e riprova).

Vedrai:

- `embedded run auto-compaction start` / `complete` nei normali log del Gateway.
- `🧹 Auto-compaction complete` in modalità dettagliata.
- `/status` che mostra `🧹 Compactions: <count>`.

<Info>
Prima di compattare, OpenClaw ricorda automaticamente all'agente di salvare le note importanti nei file di [memoria](/it/concepts/memory). Questo impedisce la perdita di contesto.
</Info>

<AccordionGroup>
  <Accordion title="Firme di overflow riconosciute">
    OpenClaw rileva il superamento del contesto da questi pattern di errore dei provider:

    - `request_too_large`
    - `context length exceeded`
    - `input exceeds the maximum number of tokens`
    - `input token count exceeds the maximum number of input tokens`
    - `input is too long for the model`
    - `ollama error: context length exceeded`

  </Accordion>
</AccordionGroup>

## Compattazione manuale

Digita `/compact` in qualsiasi chat per forzare una compattazione. Aggiungi istruzioni per guidare il riepilogo:

```
/compact Focus on the API design decisions
```

Quando `agents.defaults.compaction.keepRecentTokens` è impostato, la compattazione manuale rispetta quel punto di taglio Pi e mantiene la coda recente nel contesto ricostruito. Senza un budget esplicito da mantenere, la compattazione manuale si comporta come un checkpoint rigido e continua solo dal nuovo riepilogo.

## Configurazione

Configura la compattazione sotto `agents.defaults.compaction` nel tuo `openclaw.json`. Le opzioni più comuni sono elencate di seguito; per il riferimento completo, consulta [Approfondimento sulla gestione della sessione](/it/reference/session-management-compaction).

### Usare un modello diverso

Per impostazione predefinita, la compattazione usa il modello principale dell'agente. Imposta `agents.defaults.compaction.model` per delegare il riepilogo a un modello più capace o specializzato. L'override accetta qualsiasi stringa `provider/model-id`:

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

Funziona anche con modelli locali, per esempio un secondo modello Ollama dedicato al riepilogo:

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

Quando non è impostata, la compattazione inizia con il modello attivo della sessione. Se il riepilogo non riesce con un errore del provider idoneo al fallback del modello, OpenClaw riprova quel tentativo di compattazione tramite la catena di fallback dei modelli esistente della sessione. La scelta di fallback è temporanea e non viene riscritta nello stato della sessione. Un override esplicito `agents.defaults.compaction.model` resta esatto e non eredita la catena di fallback della sessione.

### Preservazione degli identificatori

Il riepilogo della compattazione preserva per impostazione predefinita gli identificatori opachi (`identifierPolicy: "strict"`). Esegui l'override con `identifierPolicy: "off"` per disabilitarlo, oppure con `identifierPolicy: "custom"` più `identifierInstructions` per istruzioni personalizzate.

### Protezione byte della trascrizione attiva

Quando `agents.defaults.compaction.maxActiveTranscriptBytes` è impostato, OpenClaw attiva la normale compattazione locale prima di un'esecuzione se il JSONL attivo raggiunge quella dimensione. È utile per sessioni di lunga durata in cui la gestione del contesto lato provider può mantenere sano il contesto del modello mentre la trascrizione locale continua a crescere. Non divide i byte JSONL grezzi; chiede alla normale pipeline di compattazione di creare un riepilogo semantico.

<Warning>
La protezione byte richiede `truncateAfterCompaction: true`. Senza rotazione della trascrizione, il file attivo non si ridurrebbe e la protezione resta inattiva.
</Warning>

### Trascrizioni successive

Quando `agents.defaults.compaction.truncateAfterCompaction` è abilitato, OpenClaw non riscrive la trascrizione esistente sul posto. Crea una nuova trascrizione successiva attiva dal riepilogo della compattazione, dallo stato preservato e dalla coda non riassunta, quindi mantiene il JSONL precedente come origine del checkpoint archiviato.
Le trascrizioni successive eliminano anche i turni utente lunghi esattamente duplicati che arrivano
all'interno di una breve finestra di ripetizione, così le tempeste di retry del canale non vengono portate nella
trascrizione attiva successiva dopo la compattazione.

I checkpoint pre-compattazione vengono conservati solo finché restano sotto il limite di dimensione
dei checkpoint di OpenClaw; le trascrizioni attive sovradimensionate vengono comunque compattate, ma OpenClaw
salta il grande snapshot di debug invece di raddoppiare l'uso del disco.

### Avvisi di compattazione

Per impostazione predefinita, la compattazione viene eseguita in silenzio. Imposta `notifyUser` per mostrare brevi messaggi di stato quando la compattazione inizia e termina:

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

Prima della compattazione, OpenClaw può eseguire un turno di **flush silenzioso della memoria** per archiviare note durevoli su disco. Imposta `agents.defaults.compaction.memoryFlush.model` quando questo turno di manutenzione deve usare un modello locale invece del modello della conversazione attiva:

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

L'override del modello di flush della memoria è esatto e non eredita la catena di fallback della sessione attiva. Consulta [Memoria](/it/concepts/memory) per dettagli e configurazione.

## Provider di compattazione collegabili

I Plugin possono registrare un provider di compattazione personalizzato tramite `registerCompactionProvider()` sull'API del Plugin. Quando un provider è registrato e configurato, OpenClaw delega il riepilogo a esso invece che alla pipeline LLM integrata.

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

L'impostazione di un `provider` forza automaticamente `mode: "safeguard"`. I provider ricevono le stesse istruzioni di compattazione e la stessa policy di preservazione degli identificatori del percorso integrato, e OpenClaw preserva comunque il contesto del suffisso dei turni recenti e dei turni divisi dopo l'output del provider.

<Note>
Se il provider fallisce o restituisce un risultato vuoto, OpenClaw ripiega sul riepilogo LLM integrato.
</Note>

## Compattazione e pruning

|                  | Compattazione                    | Pruning                          |
| ---------------- | ----------------------------- | -------------------------------- |
| **Cosa fa** | Riassume la conversazione più vecchia | Taglia i vecchi risultati degli strumenti           |
| **Salvato?**       | Sì (nella trascrizione della sessione)   | No (solo in memoria, per richiesta) |
| **Ambito**        | Intera conversazione           | Solo risultati degli strumenti                |

Il [pruning della sessione](/it/concepts/session-pruning) è un complemento più leggero che taglia l'output degli strumenti senza riassumerlo.

## Risoluzione dei problemi

**Compattazione troppo frequente?** La finestra di contesto del modello potrebbe essere piccola, oppure gli output degli strumenti potrebbero essere grandi. Prova ad abilitare il [pruning della sessione](/it/concepts/session-pruning).

**Il contesto sembra obsoleto dopo la compattazione?** Usa `/compact Focus on <topic>` per guidare il riepilogo, oppure abilita il [flush della memoria](/it/concepts/memory) affinché le note sopravvivano.

**Serve una tabula rasa?** `/new` avvia una nuova sessione senza compattare.

Per la configurazione avanzata (token di riserva, preservazione degli identificatori, motori di contesto personalizzati, compattazione lato server di OpenAI), consulta l'[Approfondimento sulla gestione della sessione](/it/reference/session-management-compaction).

## Correlati

- [Sessione](/it/concepts/session): gestione e ciclo di vita della sessione.
- [Pruning della sessione](/it/concepts/session-pruning): taglio dei risultati degli strumenti.
- [Contesto](/it/concepts/context): come viene costruito il contesto per i turni dell'agente.
- [Hook](/it/automation/hooks): hook del ciclo di vita della compattazione (`before_compaction`, `after_compaction`).
