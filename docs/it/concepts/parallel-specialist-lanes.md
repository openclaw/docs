---
read_when:
    - Instradi le chat di gruppo verso agenti dedicati
    - Vuoi lavorare in parallelo senza che una singola attività lunga blocchi tutte le chat
    - Stai progettando una configurazione operativa multi-agente
sidebarTitle: Specialist lanes
status: active
summary: Esegui agenti specialisti in parallelo senza saturare la capacità condivisa del modello e degli strumenti
title: Percorsi specialistici paralleli
x-i18n:
    generated_at: "2026-07-12T06:59:57Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 09852b6cf5a790e98fb5e0805b0df57b2f3719b1387ecfacfb4973bb6841abb4
    source_path: concepts/parallel-specialist-lanes.md
    workflow: 16
---

Le corsie specialistiche parallele consentono a un Gateway di instradare chat o stanze diverse verso agenti diversi, mantenendo rapida l'esperienza utente. Considera il parallelismo come un problema di progettazione legato a risorse limitate, non semplicemente come "più agenti".

## Principi fondamentali

Una corsia specialistica migliora la capacità di elaborazione solo quando riduce la contesa per i veri colli di bottiglia:

- **Blocchi di sessione**: una sola esecuzione alla volta deve modificare una determinata sessione.
- **Capacità globale del modello**: tutte le esecuzioni di chat visibili continuano a condividere i limiti del provider.
- **Capacità degli strumenti**: le operazioni su shell, browser, rete e repository possono essere più lente del turno del modello stesso.
- **Budget del contesto**: trascrizioni lunghe rendono ogni turno futuro più lento e meno focalizzato.
- **Ambiguità della responsabilità**: agenti duplicati che svolgono lo stesso lavoro sprecano capacità.

OpenClaw serializza già le esecuzioni per sessione e limita il parallelismo globale tramite la [coda dei comandi](/it/concepts/queue). Le corsie specialistiche aggiungono un livello di criteri: quale agente è responsabile di quale lavoro, cosa rimane nella chat e cosa diventa un'attività in background.

## Implementazione graduale consigliata

### Fase 1: contratti delle corsie e lavoro pesante in background

Fornisci a ogni corsia un contratto scritto nel relativo spazio di lavoro e nel prompt di sistema:

- **Scopo**: il lavoro di cui è responsabile questa corsia.
- **Obiettivi esclusi**: il lavoro che deve delegare anziché tentare di svolgere.
- **Budget della chat**: le risposte rapide rimangono nella chat; per le attività lunghe, invia una breve conferma, quindi eseguile in un sotto-agente o in un'attività in background.
- **Regola di passaggio**: quando il lavoro è di competenza di un'altra corsia, indica dove deve essere inoltrato e fornisci un riepilogo sintetico per il passaggio.
- **Regola sui rischi degli strumenti**: preferisci il set minimo di strumenti in grado di svolgere il lavoro.

Questa è la fase meno costosa e risolve la maggior parte degli intasamenti: un'attività di programmazione non trasforma più la corsia di ricerca in una lumaca e ogni chat mantiene pulito il proprio contesto.

### Fase 2: controlli di priorità e concorrenza

Configura la capacità della coda e del modello in base al valore aziendale di ciascuna corsia:

```json5
{
  agents: {
    defaults: {
      maxConcurrent: 4,
      subagents: { maxConcurrent: 8, delegationMode: "prefer" },
    },
  },
  messages: {
    queue: {
      mode: "collect",
      debounceMs: 1000,
      cap: 20,
      drop: "summarize",
    },
  },
}
```

Usa le chat dirette/personali e gli agenti per le operazioni di produzione per il lavoro ad alta priorità. Quando il sistema è occupato, sposta la ricerca, la redazione e la programmazione in batch nelle attività in background.

### Fase 3: coordinatore / controllore del traffico

Aggiungi un semplice modello di coordinamento quando sono attive più corsie:

- Tieni traccia delle attività e dei responsabili delle corsie attive.
- Rileva le richieste duplicate tra i gruppi.
- Instrada tra le corsie i riepiloghi per il passaggio.
- Mostra solo gli impedimenti, i risultati completati e le decisioni che deve prendere la persona.

Non iniziare da qui. Un coordinatore senza contratti delle corsie si limita a coordinare il caos.

## Modello minimo di contratto per una corsia

```md
# Contratto della corsia

## Responsabilità

- <attività di cui è responsabile questa corsia>

## Esclusioni

- <lavoro da delegare>

## Budget della chat

- Rispondi direttamente alle domande rapide.
- Per lavori articolati in più passaggi, lenti o che richiedono molti strumenti: invia una breve conferma, avvia/esegui in background
  il lavoro, quindi restituisci il risultato al completamento.

## Passaggio

Se la richiesta è di competenza di un'altra corsia, rispondi indicando:

- corsia di destinazione
- obiettivo
- contesto pertinente
- prossima azione esatta

## Approccio agli strumenti

Usa il set minimo di strumenti in grado di completare l'attività. Evita operazioni estese su shell o
rete, a meno che questa corsia non ne sia esplicitamente responsabile.
```

## Argomenti correlati

- [Instradamento multi-agente](/it/concepts/multi-agent)
- [Coda dei comandi](/it/concepts/queue)
- [Sotto-agenti](/it/tools/subagents)
