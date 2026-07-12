---
read_when:
    - Uso di /steer o /tell mentre un agente è già in esecuzione
    - Confronto tra le modalità /steer e /queue
    - Decidere se reindirizzare l'esecuzione corrente o una sessione ACP
sidebarTitle: Steer
summary: Indirizzare un'esecuzione attiva senza modificare la modalità della coda
title: Guida
x-i18n:
    generated_at: "2026-07-12T07:38:50Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 2e73f3f2fd938ee9dbdd14d183abe7f8676dbc7bb7382e6ad2c1fd41034fa09c
    source_path: tools/steer.md
    workflow: 16
---

`/steer` tenta innanzitutto di inviare indicazioni a un'esecuzione già attiva. Serve nei momenti in cui si desidera
"modificare questa esecuzione mentre è ancora in corso". Se il runtime corrente
non può accettare indicazioni, OpenClaw invia invece il messaggio come un normale prompt,
senza eliminarlo.

## Sessione corrente

Usa `/steer` al livello principale per indirizzare l'esecuzione attiva della sessione corrente:

```text
/steer prefer the smaller patch and keep the tests focused
/tell summarize before making the next tool call
```

Comportamento:

- Indirizza esclusivamente l'esecuzione attiva della sessione corrente.
- Funziona indipendentemente dalla modalità `/queue` della sessione.
- Avvia un normale turno con lo stesso messaggio quando la sessione è inattiva o
  l'esecuzione attiva non può accettare indicazioni.
- Usa il percorso di steering del runtime attivo, così il modello riceve le indicazioni al
  successivo punto di interruzione supportato dal runtime.

## Steering e coda

`/queue steer` fa sì che i normali messaggi in arrivo tentino di fornire indicazioni all'esecuzione attiva quando
arrivano mentre un'esecuzione è in corso. `/steer <message>` è un comando esplicito
che tenta di inserire il messaggio del comando nell'esecuzione attiva al successivo
punto di interruzione supportato dal runtime, indipendentemente dall'impostazione `/queue` memorizzata. Quando
tale inserimento non è disponibile, il prefisso del comando viene rimosso e `<message>`
prosegue come un normale prompt.

Usa:

- `/steer <message>` quando vuoi fornire subito indicazioni all'esecuzione attiva.
- `/queue steer` quando vuoi che, per impostazione predefinita, i futuri messaggi normali forniscano indicazioni alle esecuzioni attive.
- `/queue collect` o `/queue followup` quando i futuri messaggi normali devono attendere
  un turno successivo invece di fornire indicazioni all'esecuzione attiva.
- `/queue interrupt` quando il messaggio più recente deve sostituire l'esecuzione attiva
  invece di fornirle indicazioni.

Per le modalità della coda e i punti di interruzione dello steering, consulta [Coda dei comandi](/it/concepts/queue) e
[Coda di steering](/it/concepts/queue-steering).

## Agenti secondari

`/steer` al livello principale indirizza l'esecuzione attiva della sessione corrente. Gli agenti secondari inviano i risultati
alla sessione padre/richiedente; `/subagents` serve solo per la visibilità.

## Sessioni ACP

Usa `/acp steer` quando la destinazione è una sessione dell'harness ACP:

```text
/acp steer --session agent:main:acp:codex tighten the repro
```

Consulta [Agenti ACP](/it/tools/acp-agents) per la selezione delle sessioni ACP e il comportamento del
runtime.

## Contenuti correlati

- [Comandi slash](/it/tools/slash-commands)
- [Coda dei comandi](/it/concepts/queue)
- [Coda di steering](/it/concepts/queue-steering)
- [Agenti secondari](/it/tools/subagents)
