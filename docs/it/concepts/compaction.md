---
read_when:
    - Vuoi capire la compattazione automatica e /compact
    - Stai eseguendo il debug di sessioni lunghe che raggiungono i limiti di contesto
summary: Come OpenClaw riassume le conversazioni lunghe per restare entro i limiti del modello
title: Compattazione
x-i18n:
    generated_at: "2026-04-05T13:49:20Z"
    model: gpt-5.4
    provider: openai
    source_hash: 4c6dbd6ebdcd5f918805aafdc153925efef3e130faa3fab3c630832e938219fc
    source_path: concepts/compaction.md
    workflow: 15
---

# Compattazione

Ogni modello ha una finestra di contesto, ovvero il numero massimo di token che può elaborare.
Quando una conversazione si avvicina a quel limite, OpenClaw **compatta** i messaggi
più vecchi in un riepilogo così che la chat possa continuare.

## Come funziona

1. I turni più vecchi della conversazione vengono riassunti in una voce compatta.
2. Il riepilogo viene salvato nella trascrizione della sessione.
3. I messaggi recenti vengono mantenuti intatti.

Quando OpenClaw divide la cronologia in blocchi di compattazione, mantiene le chiamate
agli strumenti dell'assistente abbinate alle rispettive voci `toolResult`. Se un punto di divisione cade
all'interno di un blocco di strumenti, OpenClaw sposta il confine in modo che la coppia resti unita e
la coda corrente non riassunta venga preservata.

L'intera cronologia della conversazione resta sul disco. La compattazione cambia solo ciò che il
modello vede nel turno successivo.

## Compattazione automatica

La compattazione automatica è attiva per impostazione predefinita. Viene eseguita quando la sessione si avvicina al
limite di contesto, oppure quando il modello restituisce un errore di overflow del contesto (in tal caso
OpenClaw compatta e riprova). Le firme di overflow tipiche includono
`request_too_large`, `context length exceeded`, `input exceeds the maximum
number of tokens`, `input token count exceeds the maximum number of input
tokens`, `input is too long for the model` e `ollama error: context length
exceeded`.

<Info>
Prima di compattare, OpenClaw ricorda automaticamente all'agente di salvare le note importanti nei file di
[memory](/concepts/memory). Questo evita la perdita di contesto.
</Info>

## Compattazione manuale

Digita `/compact` in qualsiasi chat per forzare una compattazione. Aggiungi istruzioni per guidare
il riepilogo:

```
/compact Concentrati sulle decisioni di progettazione dell'API
```

## Usare un modello diverso

Per impostazione predefinita, la compattazione usa il modello principale del tuo agente. Puoi usare un modello più
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

## Avviso di avvio della compattazione

Per impostazione predefinita, la compattazione viene eseguita in modo silenzioso. Per mostrare un breve avviso quando la compattazione
inizia, abilita `notifyUser`:

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

Quando è abilitato, l'utente vede un breve messaggio (ad esempio, "Compattazione del
contesto...") all'inizio di ogni esecuzione della compattazione.

## Compattazione vs pruning

|                  | Compattazione                 | Pruning                         |
| ---------------- | ----------------------------- | -------------------------------- |
| **Cosa fa**      | Riassume la conversazione più vecchia | Riduce i vecchi risultati degli strumenti |
| **Salvato?**     | Sì (nella trascrizione della sessione) | No (solo in memoria, per richiesta) |
| **Ambito**       | Intera conversazione          | Solo risultati degli strumenti   |

Il [pruning della sessione](/concepts/session-pruning) è un complemento più leggero che
riduce l'output degli strumenti senza riassumere.

## Risoluzione dei problemi

**Compattazione troppo frequente?** La finestra di contesto del modello potrebbe essere piccola, oppure gli output
degli strumenti potrebbero essere grandi. Prova ad abilitare il
[pruning della sessione](/concepts/session-pruning).

**Il contesto sembra obsoleto dopo la compattazione?** Usa `/compact Concentrati su <argomento>` per
guidare il riepilogo, oppure abilita il [memory flush](/concepts/memory) così che le note
sopravvivano.

**Hai bisogno di ripartire da zero?** `/new` avvia una nuova sessione senza compattare.

Per la configurazione avanzata (token riservati, preservazione degli identificatori, motori di
contesto personalizzati, compattazione lato server OpenAI), vedi la
[Analisi approfondita della gestione delle sessioni](/reference/session-management-compaction).

## Correlati

- [Sessione](/concepts/session) — gestione e ciclo di vita della sessione
- [Pruning della sessione](/concepts/session-pruning) — riduzione dei risultati degli strumenti
- [Contesto](/concepts/context) — come viene costruito il contesto per i turni dell'agente
- [Hook](/it/automation/hooks) — hook del ciclo di vita della compattazione (before_compaction, after_compaction)
