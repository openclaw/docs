---
read_when:
    - Estensione di qa-lab o qa-channel
    - Aggiunta di scenari QA supportati dal repository
    - Creazione di automazione QA più realistica attorno alla dashboard del Gateway
summary: Struttura privata dell'automazione QA per qa-lab, qa-channel, scenari inizializzati e report di protocollo
title: Automazione QA E2E
x-i18n:
    generated_at: "2026-04-07T08:12:23Z"
    model: gpt-5.4
    provider: openai
    source_hash: 113e89d8d3ee8ef3058d95b9aea9a1c2335b07794446be2d231c0faeb044b23b
    source_path: concepts/qa-e2e-automation.md
    workflow: 15
---

# Automazione QA E2E

Lo stack QA privato è pensato per mettere alla prova OpenClaw in modo più realistico,
seguendo la forma dei canali, rispetto a quanto possa fare un singolo test unitario.

Componenti attuali:

- `extensions/qa-channel`: canale di messaggi sintetico con superfici per DM, canale, thread,
  reazioni, modifica ed eliminazione.
- `extensions/qa-lab`: interfaccia di debug e bus QA per osservare la trascrizione,
  iniettare messaggi in ingresso ed esportare un report Markdown.
- `qa/`: risorse iniziali supportate dal repository per l'attività di avvio e gli
  scenari QA di base.

L'attuale flusso dell'operatore QA è un sito QA a due pannelli:

- Sinistra: dashboard del Gateway (Control UI) con l'agente.
- Destra: QA Lab, che mostra la trascrizione in stile Slack e il piano dello scenario.

Eseguilo con:

```bash
pnpm qa:lab:up
```

Questo compila il sito QA, avvia la corsia gateway basata su Docker ed espone la
pagina QA Lab dove un operatore o un ciclo di automazione può assegnare all'agente una
missione QA, osservare il comportamento reale del canale e registrare cosa ha funzionato, cosa è fallito o
cosa è rimasto bloccato.

## Risorse iniziali supportate dal repository

Le risorse iniziali si trovano in `qa/`:

- `qa/QA_KICKOFF_TASK.md`
- `qa/seed-scenarios.json`

Queste sono intenzionalmente mantenute in git così che il piano QA sia visibile sia agli esseri umani sia all'
agente. L'elenco di base dovrebbe rimanere abbastanza ampio da coprire:

- chat DM e nei canali
- comportamento dei thread
- ciclo di vita delle azioni sui messaggi
- callback cron
- richiamo della memoria
- cambio di modello
- passaggio ai subagenti
- lettura del repository e della documentazione
- una piccola attività di build come Lobster Invaders

## Reportistica

`qa-lab` esporta un report di protocollo Markdown dalla timeline osservata del bus.
Il report dovrebbe rispondere a:

- Cosa ha funzionato
- Cosa è fallito
- Cosa è rimasto bloccato
- Quali scenari di follow-up vale la pena aggiungere

## Documentazione correlata

- [Testing](/it/help/testing)
- [QA Channel](/it/channels/qa-channel)
- [Dashboard](/web/dashboard)
