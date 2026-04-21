---
read_when:
    - Vuoi capire l'auto-Compaction e `/compact`
    - Stai eseguendo il debug di sessioni lunghe che raggiungono i limiti di contesto
summary: Come OpenClaw riassume le conversazioni lunghe per restare entro i limiti del modello
title: Compaction
x-i18n:
    generated_at: "2026-04-21T08:22:10Z"
    model: gpt-5.4
    provider: openai
    source_hash: 382e4a879e65199bd98d7476bff556571e09344a21e909862a34e6029db6d765
    source_path: concepts/compaction.md
    workflow: 15
---

# Compaction

Ogni modello ha una finestra di contesto, ovvero il numero massimo di token che può elaborare.
Quando una conversazione si avvicina a quel limite, OpenClaw esegue la **Compaction** dei messaggi più vecchi
in un riepilogo, così la chat può continuare.

## Come funziona

1. I turni più vecchi della conversazione vengono riassunti in una voce compatta.
2. Il riepilogo viene salvato nella trascrizione della sessione.
3. I messaggi recenti vengono mantenuti intatti.

Quando OpenClaw suddivide la cronologia in blocchi di Compaction, mantiene le chiamate
agli strumenti dell'assistente abbinate alle rispettive voci `toolResult`. Se un punto
di divisione cade all'interno di un blocco di strumenti, OpenClaw sposta il confine in modo
che la coppia resti unita e che la coda corrente non riassunta venga preservata.

L'intera cronologia della conversazione resta su disco. La Compaction cambia solo ciò che il
modello vede al turno successivo.

## Auto-Compaction

L'auto-Compaction è attiva per impostazione predefinita. Viene eseguita quando la sessione si avvicina al limite
di contesto, o quando il modello restituisce un errore di overflow del contesto (in quel caso
OpenClaw esegue la Compaction e riprova). Le firme tipiche di overflow includono
`request_too_large`, `context length exceeded`, `input exceeds the maximum
number of tokens`, `input token count exceeds the maximum number of input
tokens`, `input is too long for the model` e `ollama error: context length
exceeded`.

<Info>
Prima di eseguire la Compaction, OpenClaw ricorda automaticamente all'agente di salvare note importanti
nei file di [memory](/it/concepts/memory). Questo previene la perdita di contesto.
</Info>

Usa l'impostazione `agents.defaults.compaction` nel tuo `openclaw.json` per configurare il comportamento della Compaction (modalità, token di destinazione, ecc.).
Il riepilogo della Compaction preserva per impostazione predefinita gli identificatori opachi (`identifierPolicy: "strict"`). Puoi modificarlo con `identifierPolicy: "off"` oppure fornire testo personalizzato con `identifierPolicy: "custom"` e `identifierInstructions`.

Puoi facoltativamente specificare un modello diverso per il riepilogo della Compaction tramite `agents.defaults.compaction.model`. Questo è utile quando il tuo modello principale è locale o di piccole dimensioni e vuoi che i riepiloghi di Compaction siano prodotti da un modello più capace. L'override accetta qualsiasi stringa `provider/model-id`:

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

Questo funziona anche con modelli locali, per esempio un secondo modello Ollama dedicato al riepilogo o uno specialista della Compaction fine-tuned:

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

Se non impostato, la Compaction usa il modello principale dell'agente.

## Provider di Compaction collegabili

I Plugin possono registrare un provider di Compaction personalizzato tramite `registerCompactionProvider()` sull'API del plugin. Quando un provider è registrato e configurato, OpenClaw gli delega il riepilogo invece di usare la pipeline LLM integrata.

Per usare un provider registrato, imposta l'id del provider nella tua configurazione:

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

Impostare un `provider` forza automaticamente `mode: "safeguard"`. I provider ricevono le stesse istruzioni di Compaction e lo stesso criterio di preservazione degli identificatori del percorso integrato, e OpenClaw continua comunque a preservare il contesto del suffisso dei turni recenti e dei turni divisi dopo l'output del provider. Se il provider fallisce o restituisce un risultato vuoto, OpenClaw torna al riepilogo LLM integrato.

## Auto-Compaction (attiva per impostazione predefinita)

Quando una sessione si avvicina o supera la finestra di contesto del modello, OpenClaw attiva l'auto-Compaction e può riprovare la richiesta originale usando il contesto compattato.

Vedrai:

- `🧹 Auto-compaction complete` in modalità verbose
- `/status` che mostra `🧹 Compactions: <count>`

Prima della Compaction, OpenClaw può eseguire un turno di **flush silenzioso della memory** per memorizzare
note persistenti su disco. Vedi [Memory](/it/concepts/memory) per dettagli e configurazione.

## Compaction manuale

Digita `/compact` in qualsiasi chat per forzare una Compaction. Aggiungi istruzioni per guidare
il riepilogo:

```
/compact Focus on the API design decisions
```

## Uso di un modello diverso

Per impostazione predefinita, la Compaction usa il modello principale del tuo agente. Puoi usare un modello più
capace per ottenere riepiloghi migliori:

```json5
{
  agents: {
    defaults: {
      compaction: {
        model: "openrouter/anthropic/claude-sonnet-4-6",
      },
    },
  },
}
```

## Notifiche di Compaction

Per impostazione predefinita, la Compaction viene eseguita in modo silenzioso. Per mostrare brevi notifiche quando la Compaction
inizia e quando completa, abilita `notifyUser`:

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

Quando è abilitato, l'utente vede brevi messaggi di stato durante ogni esecuzione della Compaction
(ad esempio, "Compacting context..." e "Compaction complete").

## Compaction vs pruning

|                  | Compaction                   | Pruning                               |
| ---------------- | ---------------------------- | ------------------------------------- |
| **Cosa fa**      | Riassume la conversazione più vecchia | Riduce i vecchi risultati degli strumenti |
| **Salvato?**     | Sì (nella trascrizione della sessione) | No (solo in memoria, per richiesta)   |
| **Ambito**       | Intera conversazione         | Solo risultati degli strumenti        |

Il [pruning della sessione](/it/concepts/session-pruning) è un complemento più leggero che
riduce l'output degli strumenti senza riassumere.

## Risoluzione dei problemi

**Compaction troppo frequente?** La finestra di contesto del modello potrebbe essere piccola, oppure gli output
degli strumenti potrebbero essere grandi. Prova ad abilitare il
[pruning della sessione](/it/concepts/session-pruning).

**Il contesto sembra datato dopo la Compaction?** Usa `/compact Focus on <topic>` per
guidare il riepilogo, oppure abilita il [flush della memory](/it/concepts/memory) affinché le note
sopravvivano.

**Hai bisogno di ripartire da zero?** `/new` avvia una nuova sessione senza eseguire la Compaction.

Per la configurazione avanzata (token riservati, preservazione degli identificatori, motori di
contesto personalizzati, Compaction lato server OpenAI), vedi
l'[Approfondimento sulla gestione delle sessioni](/it/reference/session-management-compaction).

## Correlati

- [Sessione](/it/concepts/session) — gestione e ciclo di vita della sessione
- [Pruning della sessione](/it/concepts/session-pruning) — riduzione dei risultati degli strumenti
- [Contesto](/it/concepts/context) — come viene costruito il contesto per i turni dell'agente
- [Hook](/it/automation/hooks) — hook del ciclo di vita della Compaction (before_compaction, after_compaction)
