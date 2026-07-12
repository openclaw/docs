---
read_when:
    - Spiegazione del comportamento di steer mentre un agente utilizza gli strumenti
    - Modifica del comportamento della coda delle esecuzioni attive o dell'integrazione del controllo del runtime
    - Confronto della modalità steering con le modalità di coda followup, collect e interrupt
summary: Come l'indirizzamento delle esecuzioni attive accoda i messaggi ai confini del runtime
title: Coda di indirizzamento
x-i18n:
    generated_at: "2026-07-12T07:00:19Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: a73311661b40d65d254b3e6af0406965fcde9eb76d2628c1958920453aad1cbc
    source_path: concepts/queue-steering.md
    workflow: 16
---

Quando arriva un prompt normale mentre l'esecuzione di una sessione è già in streaming e la modalità della coda è `steer` (impostazione predefinita, non richiede configurazione), OpenClaw tenta di inviare il prompt al runtime attivo. OpenClaw e l'harness nativo dell'app-server Codex implementano i dettagli di consegna in modo diverso.

Questa pagina descrive l'instradamento tramite la modalità della coda per i normali messaggi in ingresso in modalità `steer`. In modalità `followup` o `collect`, i messaggi normali non seguono questo percorso e attendono il completamento dell'esecuzione attiva. Per il comando esplicito `/steer <message>`, consulta [Instradamento](/it/tools/steer).

## Confine del runtime

L'instradamento non interrompe una chiamata a uno strumento già in esecuzione. OpenClaw verifica la presenza di messaggi di instradamento in coda in corrispondenza dei confini del modello:

1. L'assistente richiede chiamate agli strumenti.
2. OpenClaw esegue il batch di chiamate agli strumenti del messaggio corrente dell'assistente.
3. OpenClaw emette l'evento di fine turno.
4. OpenClaw preleva i messaggi di instradamento in coda.
5. OpenClaw aggiunge tali messaggi come messaggi utente prima della successiva chiamata all'LLM.

In questo modo, i risultati degli strumenti rimangono associati al messaggio dell'assistente che li ha richiesti e la chiamata successiva al modello può vedere l'input utente più recente.

L'harness nativo dell'app-server Codex espone `turn/steer` anziché la coda di instradamento interna del runtime di OpenClaw. OpenClaw raggruppa i prompt in coda durante la finestra di inattività configurata, quindi invia una singola richiesta `turn/steer` con tutti gli input utente raccolti, nell'ordine di arrivo.

I turni di revisione e di Compaction manuale di Codex rifiutano l'instradamento nello stesso turno. Quando un runtime non può accettare l'instradamento in modalità `steer`, OpenClaw attende il completamento dell'esecuzione attiva prima di avviare il prompt.

## Modalità

| Modalità    | Comportamento durante l'esecuzione attiva                       | Comportamento successivo                                                                            |
| ----------- | ---------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------- |
| `steer`     | Inoltra il prompt al runtime attivo quando possibile.             | Attende il completamento dell'esecuzione attiva se l'instradamento non è disponibile.                |
| `followup`  | Non esegue l'instradamento.                                       | Esegue successivamente i messaggi in coda al termine dell'esecuzione attiva.                          |
| `collect`   | Non esegue l'instradamento.                                       | Riunisce i messaggi compatibili in coda in un unico turno successivo dopo la finestra di debounce.    |
| `interrupt` | Interrompe l'esecuzione attiva anziché instradarvi il prompt.      | Avvia il messaggio più recente dopo l'interruzione.                                                   |

## Esempio di raffica

Se quattro utenti inviano messaggi mentre l'agente sta eseguendo una chiamata a uno strumento:

- Con il comportamento predefinito, il runtime attivo riceve tutti e quattro i messaggi nell'ordine di arrivo prima della successiva decisione del modello. OpenClaw li preleva al confine successivo del modello; Codex li riceve come un unico `turn/steer` raggruppato.
- Con `/queue collect`, OpenClaw non esegue l'instradamento. Attende il termine dell'esecuzione attiva, quindi crea un turno di continuazione con i messaggi compatibili in coda dopo la finestra di debounce.
- Con `/queue interrupt`, OpenClaw interrompe l'esecuzione attiva e avvia il messaggio più recente anziché eseguire l'instradamento.

## Ambito

L'instradamento è sempre diretto all'esecuzione attiva della sessione corrente. Non crea una nuova sessione, non modifica i criteri di utilizzo degli strumenti dell'esecuzione attiva e non separa i messaggi per mittente. Nei canali multiutente, i prompt in ingresso includono già il contesto del mittente e del percorso, quindi la chiamata successiva al modello può vedere chi ha inviato ciascun messaggio.

Usa `followup` o `collect` quando vuoi che, per impostazione predefinita, i messaggi vengano accodati anziché instradati all'esecuzione attiva. Usa `interrupt` quando il prompt più recente deve sostituire l'esecuzione attiva.

## Debounce

`messages.queue.debounceMs` si applica alla consegna dei messaggi `followup` e `collect` in coda. In modalità `steer` con l'harness nativo di Codex, imposta anche la finestra di inattività prima dell'invio del `turn/steer` raggruppato. Per OpenClaw, l'instradamento attivo non utilizza il timer di debounce, perché OpenClaw raggruppa naturalmente i messaggi fino al confine successivo del modello.

## Contenuti correlati

- [Coda dei comandi](/it/concepts/queue)
- [Instradamento](/it/tools/steer)
- [Messaggi](/it/concepts/messages)
- [Ciclo dell'agente](/it/concepts/agent-loop)
