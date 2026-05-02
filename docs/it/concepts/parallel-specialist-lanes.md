---
read_when:
    - Instradi le chat di gruppo verso agenti dedicati
    - Vuoi svolgere il lavoro in parallelo senza che una lunga attività blocchi ogni chat
    - Stai progettando una configurazione operativa multi-agente
sidebarTitle: Specialist lanes
status: active
summary: Esegui agenti specialistici in parallelo senza saturare la capacità condivisa del modello e degli strumenti
title: Percorsi specialistici paralleli
x-i18n:
    generated_at: "2026-05-02T20:44:19Z"
    model: gpt-5.5
    provider: openai
    source_hash: b09f10ce4fbd79954a7196fbedb23f9b3f34b459b98eb7a5480f7eeb0bb6be98
    source_path: concepts/parallel-specialist-lanes.md
    workflow: 16
---

Le lane specialistiche parallele consentono a un Gateway di instradare chat o stanze diverse verso
agenti diversi, mantenendo rapida l'esperienza utente. Il trucco è trattare il
parallelismo come un problema di progettazione con risorse scarse, non solo come "più agenti".

## Principi fondamentali

Una lane specialistica migliora il throughput solo quando riduce la contesa per i
veri colli di bottiglia:

- **Blocchi di sessione**: una sola esecuzione dovrebbe modificare una determinata sessione alla volta.
- **Capacità globale del modello**: tutte le esecuzioni di chat visibili condividono comunque i limiti del provider.
- **Capacità degli strumenti**: shell, browser, rete e lavoro sul repository possono essere più lenti
  del turno del modello stesso.
- **Budget di contesto**: transcript lunghi rendono ogni turno futuro più lento e meno
  focalizzato.
- **Ambiguità di proprietà**: agenti duplicati che svolgono lo stesso lavoro sprecano capacità.

OpenClaw serializza già le esecuzioni per sessione e limita il parallelismo globale tramite
la [coda dei comandi](/it/concepts/queue). Le lane specialistiche aggiungono policy sopra:
quale agente possiede quale lavoro, cosa resta in chat e cosa diventa lavoro
in background.

## Rollout consigliato

### Fase 1: contratti di lane + lavoro pesante in background

Assegna a ogni lane un contratto scritto nel suo workspace e nel prompt di sistema:

- **Scopo**: il lavoro di cui questa lane è proprietaria.
- **Non obiettivi**: lavoro che dovrebbe passare ad altri invece di tentare.
- **Budget di chat**: le risposte rapide restano in chat; le attività lunghe dovrebbero confermare
  brevemente, quindi eseguirsi in un sub-agente o task in background.
- **Regola di handoff**: quando un'altra lane possiede il lavoro, indicare dove dovrebbe andare e
  fornire un riepilogo compatto per l'handoff.
- **Regola sul rischio degli strumenti**: preferire la superficie di strumenti più piccola in grado di svolgere il lavoro.

Questa è la fase più economica e risolve la maggior parte degli intasamenti: un lavoro di coding non
trasforma più la lane di ricerca in melassa, e ogni chat mantiene pulito il proprio contesto.

### Fase 2: controlli di priorità e concorrenza

Configura coda e capacità del modello in base al valore aziendale di ogni lane:

```json5
{
  agents: {
    defaults: {
      maxConcurrent: 4,
      subagents: { maxConcurrent: 8 },
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

Usa chat dirette/personali e agenti per operazioni di produzione per il lavoro ad alta priorità. Lascia che
ricerca, stesura e coding batch passino a task in background quando il sistema è
occupato.

### Fase 3: coordinatore / controller del traffico

Aggiungi un piccolo pattern di coordinamento quando più lane sono attive:

- Tieni traccia dei task e dei proprietari delle lane attive.
- Rileva richieste duplicate tra gruppi.
- Instrada i riepiloghi di handoff tra lane.
- Mostra solo blocker, risultati completati e decisioni che la persona deve prendere.

Non iniziare da qui. Un coordinatore senza contratti di lane coordina solo il caos.

## Template minimo di contratto di lane

```md
# Lane contract

## Owns

- <job this lane is responsible for>

## Does not own

- <work to hand off>

## Chat budget

- Answer quick questions directly.
- For multi-step, slow, or tool-heavy work: acknowledge briefly, spawn/background
  the work, then return the result when complete.

## Handoff

If another lane owns the request, reply with:

- target lane
- objective
- relevant context
- exact next action

## Tool posture

Use the smallest tool surface that can complete the task. Avoid broad shell or
network work unless this lane explicitly owns it.
```

## Correlati

- [Instradamento multi-agente](/it/concepts/multi-agent)
- [Coda dei comandi](/it/concepts/queue)
- [Sub-agenti](/it/tools/subagents)
