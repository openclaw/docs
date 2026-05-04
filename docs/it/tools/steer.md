---
read_when:
    - Utilizzo di /steer o /tell mentre un agente è già in esecuzione
    - Confronto tra /steer e /queue steer
    - Decidere se guidare l'esecuzione corrente, un sotto-agente o una sessione ACP
sidebarTitle: Steer
summary: Guida un'esecuzione attiva senza cambiare la modalità della coda
title: Indirizza
x-i18n:
    generated_at: "2026-05-04T07:09:19Z"
    model: gpt-5.5
    provider: openai
    source_hash: 71e1c80c0eea86d5c3c29513d3ed0675c04779fc9c6ee3b8a76c4bedaa264d22
    source_path: tools/steer.md
    workflow: 16
---

`/steer` invia indicazioni a un'esecuzione già attiva. Serve per i momenti in cui si vuole "adattare questa
esecuzione mentre sta ancora lavorando", non per avviare un nuovo turno.

## Sessione corrente

Usa `/steer` di primo livello per indirizzare l'esecuzione attiva della sessione corrente:

```text
/steer prefer the smaller patch and keep the tests focused
/tell summarize before making the next tool call
```

Comportamento:

- Indirizza solo l'esecuzione attiva della sessione corrente.
- Funziona indipendentemente dalla modalità `/queue` della sessione.
- Non avvia una nuova esecuzione quando la sessione è inattiva.
- Risponde con un avviso quando non c'è alcuna esecuzione attiva da indirizzare.
- Usa il percorso di indirizzamento del runtime attivo, quindi il modello vede le indicazioni al
  successivo confine del runtime supportato.

## Steer e coda

`/queue steer` cambia il comportamento dei normali messaggi in ingresso quando arrivano
mentre un'esecuzione è attiva. `/steer <message>` è un comando esplicito che prova a
iniettare il messaggio di quel comando nell'esecuzione attiva al successivo confine del runtime
supportato, indipendentemente dall'impostazione `/queue` salvata.

Usa:

- `/steer <message>` quando vuoi guidare subito l'esecuzione attiva.
- `/queue steer` quando vuoi che i futuri messaggi normali guidino le esecuzioni attive per
  impostazione predefinita.
- `/queue collect` o `/queue followup` quando i nuovi messaggi devono attendere un
  turno successivo invece di guidare l'esecuzione attiva.

Per le modalità di coda e il comportamento di fallback, consulta [Coda dei comandi](/it/concepts/queue) e
[Coda di indirizzamento](/it/concepts/queue-steering).

## Sotto-agenti

Usa `/subagents steer` quando la destinazione è un'esecuzione figlia:

```text
/subagents steer 2 focus only on the API surface
```

`/steer` di primo livello non seleziona un sotto-agente per id o indice di elenco. Indirizza sempre
l'esecuzione attiva della sessione corrente. Consulta [Sotto-agenti](/it/tools/subagents) per
id, etichette e comandi di controllo dei sotto-agenti.

## Sessioni ACP

Usa `/acp steer` quando la destinazione è una sessione harness ACP:

```text
/acp steer --session agent:main:acp:codex tighten the repro
```

Consulta [Agenti ACP](/it/tools/acp-agents) per la selezione delle sessioni ACP e il comportamento del
runtime.

## Correlati

- [Comandi slash](/it/tools/slash-commands)
- [Coda dei comandi](/it/concepts/queue)
- [Coda di indirizzamento](/it/concepts/queue-steering)
- [Sotto-agenti](/it/tools/subagents)
