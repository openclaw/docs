---
read_when:
    - Uso di /steer o /tell mentre un agente è già in esecuzione
    - Confronto tra le modalità /steer e /queue
    - Decidere se guidare l'esecuzione corrente o una sessione ACP
sidebarTitle: Steer
summary: Guidare un'esecuzione attiva senza cambiare la modalità della coda
title: Orientare
x-i18n:
    generated_at: "2026-06-27T18:23:36Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 2e73f3f2fd938ee9dbdd14d183abe7f8676dbc7bb7382e6ad2c1fd41034fa09c
    source_path: tools/steer.md
    workflow: 16
---

`/steer` prova innanzitutto a inviare istruzioni a un'esecuzione già attiva. È pensato per i momenti in cui vuoi
"adattare questa esecuzione mentre è ancora in corso". Se il runtime corrente
non può accettare steering, OpenClaw invia invece il messaggio come un prompt normale
anziché scartarlo.

## Sessione corrente

Usa `/steer` di primo livello per mirare all'esecuzione attiva della sessione corrente:

```text
/steer prefer the smaller patch and keep the tests focused
/tell summarize before making the next tool call
```

Comportamento:

- Mira solo all'esecuzione attiva della sessione corrente.
- Funziona indipendentemente dalla modalità `/queue` della sessione.
- Avvia un turno normale con lo stesso messaggio quando la sessione è inattiva o
  l'esecuzione attiva non può accettare steering.
- Usa il percorso di steering del runtime attivo, quindi il modello vede le istruzioni al
  successivo limite di runtime supportato.

## Steering e coda

`/queue steer` fa sì che i normali messaggi in ingresso provino a guidare l'esecuzione attiva quando
arrivano mentre un'esecuzione è attiva. `/steer <message>` è un comando esplicito
che prova a iniettare il messaggio di quel comando nell'esecuzione attiva al successivo
limite di runtime supportato, indipendentemente dall'impostazione `/queue` memorizzata. Quando
quell'iniezione non è disponibile, il prefisso del comando viene rimosso e `<message>`
continua come un prompt normale.

Usa:

- `/steer <message>` quando vuoi guidare subito l'esecuzione attiva.
- `/queue steer` quando vuoi che i futuri messaggi normali guidino per impostazione predefinita
  le esecuzioni attive.
- `/queue collect` o `/queue followup` quando i futuri messaggi normali devono attendere
  un turno successivo invece di guidare l'esecuzione attiva.
- `/queue interrupt` quando il messaggio più recente deve sostituire l'esecuzione attiva
  invece di guidarla.

Per le modalità di coda e i limiti di steering, vedi [Coda dei comandi](/it/concepts/queue) e
[Coda di steering](/it/concepts/queue-steering).

## Sub-agent

`/steer` di primo livello mira all'esecuzione attiva della sessione corrente. I sub-agent riferiscono
alla loro sessione padre/richiedente; `/subagents` serve solo per la visibilità.

## Sessioni ACP

Usa `/acp steer` quando la destinazione è una sessione harness ACP:

```text
/acp steer --session agent:main:acp:codex tighten the repro
```

Vedi [Agenti ACP](/it/tools/acp-agents) per la selezione delle sessioni ACP e il comportamento del runtime.

## Correlati

- [Comandi slash](/it/tools/slash-commands)
- [Coda dei comandi](/it/concepts/queue)
- [Coda di steering](/it/concepts/queue-steering)
- [Sub-agent](/it/tools/subagents)
