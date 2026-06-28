---
read_when:
    - Instradi le chat di gruppo verso agenti dedicati
    - Vuoi lavorare in parallelo senza che un'attività lunga blocchi ogni chat
    - Stai progettando una configurazione operativa multi-agente
sidebarTitle: Specialist lanes
status: active
summary: Esegui agenti specialisti in parallelo senza saturare la capacità condivisa del modello e degli strumenti
title: Percorsi specialistici paralleli
x-i18n:
    generated_at: "2026-05-10T19:32:35Z"
    model: gpt-5.5
    provider: openai
    source_hash: 8721056fbe08822ac92d4bc14c8c2b0977e93eaa58c2849f83b3c0f310992f93
    source_path: concepts/parallel-specialist-lanes.md
    workflow: 16
    postprocess_version: locale-links-v1
---

Le corsie specialistiche parallele consentono a un Gateway di indirizzare chat o stanze diverse ad agenti diversi, mantenendo rapida l'esperienza utente. Il punto è trattare il parallelismo come un problema di progettazione di risorse scarse, non semplicemente come "più agenti".

## Principi fondamentali

Una corsia specialistica migliora il throughput solo quando riduce la contesa sui colli di bottiglia reali:

- **Blocchi di sessione**: una sola esecuzione alla volta dovrebbe modificare una determinata sessione.
- **Capacità globale del modello**: tutte le esecuzioni di chat visibili condividono comunque i limiti del provider.
- **Capacità degli strumenti**: shell, browser, rete e lavoro sul repository possono essere più lenti del turno del modello stesso.
- **Budget di contesto**: trascrizioni lunghe rendono ogni turno futuro più lento e meno focalizzato.
- **Ambiguità di ownership**: agenti duplicati che fanno lo stesso lavoro sprecano capacità.

OpenClaw serializza già le esecuzioni per sessione e limita il parallelismo globale tramite la [coda dei comandi](/it/concepts/queue). Le corsie specialistiche aggiungono una policy sopra:
quale agente possiede quale lavoro, cosa resta in chat e cosa diventa lavoro in background.

## Rollout consigliato

### Fase 1: contratti di corsia + lavoro pesante in background

Assegna a ogni corsia un contratto scritto nel suo workspace e nel prompt di sistema:

- **Scopo**: il lavoro di cui questa corsia è responsabile.
- **Non obiettivi**: lavoro che dovrebbe passare ad altri invece di tentare.
- **Budget di chat**: le risposte rapide restano in chat; le attività lunghe dovrebbero ricevere un breve riscontro, poi essere eseguite in un sottoagente o task in background.
- **Regola di handoff**: quando un'altra corsia possiede il lavoro, indica dove dovrebbe andare e fornisci un riepilogo compatto di handoff.
- **Regola di rischio degli strumenti**: preferisci la superficie di strumenti più piccola che possa svolgere il lavoro.

Questa è la fase più economica e risolve la maggior parte degli intasamenti: un lavoro di coding non trasforma più la corsia di ricerca in melassa, e ogni chat mantiene pulito il proprio contesto.

### Fase 2: controlli di priorità e concorrenza

Regola la coda e la capacità del modello intorno al valore di business di ogni corsia:

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

Usa chat dirette/personali e agenti di produzione-ops per il lavoro ad alta priorità. Lascia che ricerca, stesura e coding in batch passino a task in background quando il sistema è occupato.

### Fase 3: coordinatore / controller del traffico

Aggiungi un piccolo pattern di coordinatore quando più corsie sono attive:

- Traccia i task attivi delle corsie e i proprietari.
- Rileva richieste duplicate tra gruppi.
- Instrada i riepiloghi di handoff tra corsie.
- Mostra solo blocchi, risultati completati e decisioni che l'umano deve prendere.

Non iniziare da qui. Un coordinatore senza contratti di corsia coordina solo caos.

## Template minimo di contratto di corsia

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

- [Routing multi-agente](/it/concepts/multi-agent)
- [Coda dei comandi](/it/concepts/queue)
- [Sottoagenti](/it/tools/subagents)
