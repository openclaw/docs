---
read_when:
    - Vuoi comprendere la compattazione automatica e `/compact`
    - Si stanno eseguendo il debug di sessioni lunghe che raggiungono i limiti del contesto
summary: Come OpenClaw riassume le conversazioni lunghe per rispettare i limiti del modello
title: Compaction
x-i18n:
    generated_at: "2026-07-16T14:17:47Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: f00fb0cf59184ef450f1fc4d39a21a40ee4e8327d872766bca7f3642c0145514
    source_path: concepts/compaction.md
    workflow: 16
---

Ogni modello dispone di una finestra di contesto: il numero massimo di token che può elaborare. Quando una conversazione si avvicina a tale limite, OpenClaw **compatta** i messaggi meno recenti in un riepilogo, consentendo alla chat di continuare.

## Come funziona

1. I turni meno recenti della conversazione vengono riassunti in una voce compatta.
2. Il riepilogo viene salvato nella trascrizione della sessione.
3. I messaggi recenti vengono mantenuti intatti.

OpenClaw mantiene le chiamate agli strumenti dell'assistente abbinate alle corrispondenti voci `toolResult` quando sceglie un punto di suddivisione per la compattazione. Se il punto ricade all'interno di un blocco di strumenti, OpenClaw sposta il confine affinché la coppia rimanga unita e la parte finale corrente non riepilogata venga preservata.

La cronologia completa della conversazione rimane sul disco. La Compaction modifica soltanto ciò che il modello vede nel turno successivo.

<Note>
Per le nuove configurazioni, il valore predefinito di `agents.defaults.compaction.mode` è `"safeguard"` (misure di protezione più rigorose, verifiche della qualità dei riepiloghi). Impostare esplicitamente `mode: "default"` per disattivarlo.
</Note>

## Compattazione automatica

La compattazione automatica è attiva per impostazione predefinita. Viene eseguita quando la sessione si avvicina al limite di contesto o quando il modello restituisce un errore di superamento del contesto (nel qual caso OpenClaw compatta e riprova).

Verranno visualizzati:

- `embedded run auto-compaction start` / `complete` nei normali log del Gateway.
- `🧹 Auto-compaction complete` in modalità dettagliata.
- `/status` che mostra `🧹 Compactions: <count>`.

<Info>
Prima della compattazione, OpenClaw ricorda automaticamente all'agente di salvare le note importanti nei file di [memoria](/it/concepts/memory). Ciò evita la perdita di contesto.
</Info>

<AccordionGroup>
  <Accordion title="Schemi di errore di superamento riconosciuti da OpenClaw">
    OpenClaw riconosce decine di stringhe di errore di superamento specifiche dei provider (Anthropic, OpenAI, Bedrock, Gemini, Ollama, OpenRouter e altri). Esempi comuni:

    - `request_too_large`
    - `context length exceeded`
    - `input exceeds the maximum number of tokens`
    - `input token count exceeds the maximum number of input tokens` (Bedrock)
    - `input is too long for the model`
    - `ollama error: context length exceeded`

  </Accordion>
</AccordionGroup>

## Compattazione manuale

Digitare `/compact` in qualsiasi chat per forzare una compattazione. Aggiungere istruzioni per orientare il riepilogo:

```text
/compact Concentrati sulle decisioni di progettazione dell'API
```

Quando `agents.defaults.compaction.keepRecentTokens` è impostato (valore predefinito: 20,000), la compattazione manuale rispetta tale punto di taglio e mantiene la parte finale recente nel contesto ricostruito. Senza un budget esplicito per il mantenimento, la compattazione manuale si comporta come un checkpoint rigido e prosegue soltanto dal nuovo riepilogo.

## Configurazione

Configurare la compattazione in `agents.defaults.compaction` nel proprio `openclaw.json`. Le opzioni più comuni sono elencate di seguito; per il riferimento completo, consultare l'[approfondimento sulla gestione delle sessioni](/it/reference/session-management-compaction).

### Utilizzo di un modello diverso

Per impostazione predefinita, la compattazione utilizza il modello principale dell'agente. Impostare `agents.defaults.compaction.model` per delegare il riepilogo a un modello più capace o specializzato. La sostituzione accetta una stringa `provider/model-id` o un semplice alias configurato in `agents.defaults.models`:

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

Prima dell'inizio della compattazione, i semplici alias configurati vengono risolti nel relativo provider e modello canonici. Se un valore semplice corrisponde sia a un alias sia a un ID modello letterale configurato, prevale l'ID modello letterale. Un valore semplice senza corrispondenza rimane un ID modello del provider attivo.

Ciò funziona anche con i modelli locali, ad esempio un secondo modello Ollama dedicato al riepilogo:

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

Quando non è impostato, la compattazione inizia con il modello della sessione attiva. Se il riepilogo non riesce a causa di un errore del provider idoneo al fallback del modello, OpenClaw riprova il tentativo di compattazione tramite la catena di fallback dei modelli già esistente della sessione. La scelta di fallback è temporanea e non viene riscritta nello stato della sessione. Una sostituzione esplicita `agents.defaults.compaction.model` rimane esatta e non eredita la catena di fallback della sessione.

### Conservazione degli identificatori

Per impostazione predefinita, il riepilogo della compattazione preserva gli identificatori opachi (`identifierPolicy: "strict"`). Per disabilitare questa funzione, sostituire l'impostazione con `identifierPolicy: "off"`; per indicazioni personalizzate, usare `identifierPolicy: "custom"` insieme a `identifierInstructions`.

### Limite di byte della trascrizione attiva

Quando `agents.defaults.compaction.maxActiveTranscriptBytes` è impostato, OpenClaw
attiva la normale compattazione locale prima di un'esecuzione se la cronologia della trascrizione raggiunge
tale dimensione. Ciò è utile per le sessioni di lunga durata in cui la gestione
del contesto lato provider può mantenere integro il contesto del modello mentre la cronologia persistente
della trascrizione continua a crescere. Non suddivide i byte non elaborati; richiede alla normale pipeline
di compattazione di creare un riepilogo semantico.

<Warning>
Il limite di byte si applica alla cronologia della trascrizione SQLite attiva. Gli artefatti
checkpoint JSONL legacy non costituiscono la destinazione attiva della compattazione.
</Warning>

### Trascrizioni successive

Quando `agents.defaults.compaction.truncateAfterCompaction` è abilitato, OpenClaw non riscrive la trascrizione esistente sul posto. Crea una nuova trascrizione successiva attiva a partire dal riepilogo della compattazione, dallo stato preservato e dalla parte finale non riepilogata, quindi registra i metadati del checkpoint che indirizzano i flussi di ramificazione/ripristino a tale trascrizione successiva compattata.
Le trascrizioni successive eliminano inoltre i turni utente lunghi esattamente duplicati che arrivano
entro un breve intervallo di ripetizione, affinché le raffiche di tentativi del canale non vengano trasferite
nella successiva trascrizione attiva dopo la compattazione.

OpenClaw non scrive più copie `.checkpoint.*.jsonl` separate per le nuove
compattazioni. I file checkpoint legacy esistenti possono continuare a essere utilizzati finché sono referenziati
e vengono eliminati dalla normale pulizia delle sessioni.

### Notifiche di compattazione

Per impostazione predefinita, la compattazione viene eseguita senza notifiche. Impostare `notifyUser` per mostrare brevi messaggi di stato all'inizio e al completamento della compattazione e per visualizzare un avviso di funzionamento degradato quando un salvataggio della memoria precedente alla compattazione esaurisce i tentativi, ma la risposta prosegue comunque:

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

### Salvataggio della memoria

Prima della compattazione, OpenClaw può eseguire un turno di **salvataggio silenzioso della memoria** per archiviare sul disco note persistenti. Impostare `agents.defaults.compaction.memoryFlush.model` quando questo turno di manutenzione deve utilizzare un modello locale anziché il modello della conversazione attiva:

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

La sostituzione del modello per il salvataggio della memoria è esatta e non eredita la catena di fallback della sessione attiva. Per dettagli e configurazione, consultare [Memoria](/it/concepts/memory).

## Provider di compattazione collegabili

I Plugin possono registrare un provider di compattazione personalizzato tramite `registerCompactionProvider()` nell'API del Plugin. Quando un provider è registrato e configurato, OpenClaw gli delega il riepilogo anziché utilizzare la pipeline LLM integrata.

Per utilizzare un provider registrato, impostarne l'ID nella configurazione:

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

L'impostazione di un `provider` forza automaticamente `mode: "safeguard"`. I provider ricevono le stesse istruzioni di compattazione e la stessa politica di conservazione degli identificatori del percorso integrato; inoltre, dopo l'output del provider, OpenClaw continua a preservare il contesto finale dei turni recenti e dei turni suddivisi.

<Note>
Se il provider non riesce o restituisce un risultato vuoto, OpenClaw ricorre al riepilogo LLM integrato.
</Note>

## Compaction e potatura a confronto

|                  | Compaction                              | Potatura                                  |
| ---------------- | --------------------------------------- | ----------------------------------------- |
| **Cosa fa**      | Riassume la conversazione meno recente | Tronca i risultati meno recenti degli strumenti |
| **Salvata?**     | Sì (nella trascrizione della sessione) | No (solo in memoria, per ogni richiesta)  |
| **Ambito**       | Intera conversazione                   | Solo i risultati degli strumenti          |

La [potatura della sessione](/it/concepts/session-pruning) è un complemento più leggero che tronca l'output degli strumenti senza riepilogarlo.

## Risoluzione dei problemi

**La compattazione avviene troppo spesso?** La finestra di contesto del modello potrebbe essere ridotta oppure gli output degli strumenti potrebbero essere grandi. Provare ad abilitare la [potatura della sessione](/it/concepts/session-pruning).

**Il contesto sembra obsoleto dopo la compattazione?** Usare `/compact Focus on <topic>` per orientare il riepilogo oppure abilitare il [salvataggio della memoria](/it/concepts/memory) affinché le note vengano preservate.

**Serve ripartire da zero?** `/new` avvia una nuova sessione senza eseguire la compattazione.

Per la configurazione avanzata (token riservati, conservazione degli identificatori, motori di contesto personalizzati, compattazione lato server di OpenAI), consultare l'[approfondimento sulla gestione delle sessioni](/it/reference/session-management-compaction).

## Argomenti correlati

- [Sessione](/it/concepts/session): gestione e ciclo di vita delle sessioni.
- [Potatura della sessione](/it/concepts/session-pruning): troncamento dei risultati degli strumenti.
- [Contesto](/it/concepts/context): come viene creato il contesto per i turni dell'agente.
- [Hook](/it/automation/hooks): hook del ciclo di vita della compattazione (`before_compaction`, `after_compaction`).
