---
read_when:
    - Spiegare come si comporta lo steering mentre un agente usa gli strumenti
    - Modifica del comportamento della coda active-run o dell'integrazione dello steering runtime
    - Confronto dell'orientamento con le modalità di coda followup, collect e interrupt
summary: Come l’instradamento delle esecuzioni attive accoda i messaggi ai confini di runtime
title: Coda di guida
x-i18n:
    generated_at: "2026-06-27T17:27:28Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: b38d036d2a44af431653746e2d5918af0a8af471450f440479cf0a1acc86c9cd
    source_path: concepts/queue-steering.md
    workflow: 16
---

Quando arriva un prompt normale mentre un’esecuzione di sessione è già in streaming, OpenClaw
prova per impostazione predefinita a inviare quel prompt nel runtime attivo quando la modalità della coda
è `steer`. Per questo comportamento predefinito non sono richieste voci di configurazione
né direttive di coda. OpenClaw e l’harness app-server Codex nativo implementano i dettagli
di consegna in modo diverso.

## Confine del runtime

Lo steering non interrompe una chiamata a uno strumento già in esecuzione. OpenClaw controlla la presenza di
messaggi di steering in coda ai confini del modello:

1. L’assistente richiede chiamate a strumenti.
2. OpenClaw esegue il batch di chiamate a strumenti del messaggio corrente dell’assistente.
3. OpenClaw emette l’evento di fine turno.
4. OpenClaw svuota i messaggi di steering in coda.
5. OpenClaw aggiunge quei messaggi come messaggi utente prima della successiva chiamata LLM.

Questo mantiene i risultati degli strumenti associati al messaggio dell’assistente che li ha richiesti,
quindi consente alla successiva chiamata al modello di vedere l’input utente più recente.

L’harness app-server Codex nativo espone `turn/steer` invece della coda di steering
interna del runtime OpenClaw. OpenClaw raggruppa i prompt in coda per la finestra di quiete
configurata, quindi invia una singola richiesta `turn/steer` con tutto l’input utente raccolto
in ordine di arrivo.

I turni di revisione Codex e di Compaction manuale rifiutano lo steering nello stesso turno. Quando un
runtime non può accettare lo steering in modalità `steer`, OpenClaw attende che l’esecuzione
attiva termini prima di avviare il prompt.

Questa pagina spiega lo steering in modalità coda per i normali messaggi in ingresso quando la modalità
è `steer`. Se la modalità è `followup` o `collect`, i messaggi normali non entrano in
questo percorso di steering; attendono il completamento dell’esecuzione attiva. Per il comando esplicito
`/steer <message>`, vedi [Steer](/it/tools/steer).

## Modalità

| Modalità    | Comportamento durante l’esecuzione attiva              | Comportamento successivo                                                            |
| ----------- | ------------------------------------------------------ | ----------------------------------------------------------------------------------- |
| `steer`     | Indirizza il prompt nel runtime attivo quando possibile. | Attende il completamento dell’esecuzione attiva se lo steering non è disponibile.   |
| `followup`  | Non effettua steering.                                 | Esegue i messaggi in coda in seguito, dopo la fine dell’esecuzione attiva.          |
| `collect`   | Non effettua steering.                                 | Riunisce i messaggi compatibili in coda in un unico turno successivo dopo la finestra di debounce. |
| `interrupt` | Interrompe l’esecuzione attiva invece di indirizzarla. | Avvia il messaggio più recente dopo l’interruzione.                                 |

## Esempio di raffica

Se quattro utenti inviano messaggi mentre l’agente sta eseguendo una chiamata a uno strumento:

- Con il comportamento predefinito, il runtime attivo riceve tutti e quattro i messaggi in
  ordine di arrivo prima della sua successiva decisione del modello. OpenClaw li svuota al successivo confine del modello;
  Codex li riceve come un unico `turn/steer` raggruppato.
- Con `/queue collect`, OpenClaw non effettua steering. Attende la fine dell’esecuzione attiva,
  quindi crea un turno di followup con i messaggi compatibili in coda dopo la
  finestra di debounce.
- Con `/queue interrupt`, OpenClaw interrompe l’esecuzione attiva e avvia il messaggio più recente
  invece di effettuare steering.

## Ambito

Lo steering mira sempre all’esecuzione di sessione attiva corrente. Non crea una nuova
sessione, non modifica la policy degli strumenti dell’esecuzione attiva e non suddivide i messaggi per mittente. Nei
canali multiutente, i prompt in ingresso includono già il contesto del mittente e del percorso, quindi
la successiva chiamata al modello può vedere chi ha inviato ciascun messaggio.

Usa `followup` o `collect` quando vuoi che i messaggi vengano accodati per impostazione predefinita invece
di effettuare steering sull’esecuzione attiva. Usa `interrupt` quando il prompt più recente deve
sostituire l’esecuzione attiva.

## Debounce

`messages.queue.debounceMs` si applica alla consegna in coda `followup` e `collect`.
In modalità `steer` con l’harness Codex nativo, imposta anche la finestra di quiete
prima dell’invio del `turn/steer` raggruppato. Per OpenClaw, lo steering attivo in sé non usa
il timer di debounce perché OpenClaw raggruppa naturalmente i messaggi fino al successivo confine del modello.

## Correlati

- [Coda dei comandi](/it/concepts/queue)
- [Steer](/it/tools/steer)
- [Messaggi](/it/concepts/messages)
- [Ciclo dell’agente](/it/concepts/agent-loop)
