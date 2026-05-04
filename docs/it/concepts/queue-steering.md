---
read_when:
    - Spiegazione di come si comporta l'orientamento mentre un agente usa gli strumenti
    - Modifica del comportamento della coda delle esecuzioni attive o dell'integrazione del controllo del runtime
    - Confronto tra le modalità steer, queue, collect e followup
summary: Come il controllo delle esecuzioni attive accoda i messaggi ai confini del runtime
title: Coda di indirizzamento
x-i18n:
    generated_at: "2026-05-04T02:23:53Z"
    model: gpt-5.5
    provider: openai
    source_hash: c8df35b127ae0c1e1b3b684a1f63ce33874eb3d0b7bf9d0df7cb9dfce093090a
    source_path: concepts/queue-steering.md
    workflow: 16
---

Quando arriva un messaggio mentre l'esecuzione di una sessione è già in streaming, OpenClaw può
inviare quel messaggio nel runtime attivo invece di avviare un'altra esecuzione per
la stessa sessione. Le modalità pubbliche sono neutrali rispetto al runtime; Pi e l'harness
app-server nativo di Codex implementano i dettagli di consegna in modo diverso.

## Confine del runtime

Lo steering non interrompe una chiamata a strumento già in esecuzione. Pi verifica la presenza di
messaggi di steering in coda ai confini del modello:

1. L'assistente richiede chiamate a strumenti.
2. Pi esegue il batch di chiamate a strumenti del messaggio corrente dell'assistente.
3. Pi emette l'evento di fine turno.
4. Pi svuota i messaggi di steering in coda.
5. Pi aggiunge quei messaggi come messaggi utente prima della chiamata LLM successiva.

Questo mantiene i risultati degli strumenti associati al messaggio dell'assistente che li ha richiesti,
poi permette alla chiamata al modello successiva di vedere l'input utente più recente.

L'harness app-server nativo di Codex espone `turn/steer` invece della
coda di steering interna di Pi. OpenClaw adatta le stesse modalità in quel contesto:

- `steer` raggruppa i messaggi in coda per la finestra di quiete configurata, poi invia una
  singola richiesta `turn/steer` con tutto l'input utente raccolto in ordine di arrivo.
- `queue` mantiene la forma serializzata precedente inviando richieste `turn/steer`
  separate.
- `followup`, `collect`, `steer-backlog` e `interrupt` restano comportamenti di coda
  gestiti da OpenClaw attorno al turno Codex attivo.

I turni di revisione Codex e di Compaction manuale rifiutano lo steering nello stesso turno. Quando un
runtime non può accettare lo steering, OpenClaw ripiega sulla coda di follow-up quando
quella modalità lo consente.

Questa pagina spiega lo steering in modalità coda per i normali messaggi in ingresso. Per il
comando esplicito `/steer <message>`, vedi [Steer](/tools/steer).

## Modalità

| Modalità        | Comportamento durante l'esecuzione attiva                                                                                       | Comportamento follow-up successivo                                                    |
| --------------- | ------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------- |
| `steer`         | Inserisce insieme tutti i messaggi di steering in coda al successivo confine del runtime. È il valore predefinito.              | Ripiega sul follow-up solo quando lo steering non è disponibile.                      |
| `queue`         | Steering precedente uno alla volta. Pi inserisce un messaggio in coda per ogni confine del modello; Codex invia richieste `turn/steer` separate. | Ripiega sul follow-up solo quando lo steering non è disponibile.                      |
| `steer-backlog` | Stesso comportamento di steering durante l'esecuzione attiva di `steer`.                                                        | Mantiene anche lo stesso messaggio per un turno di follow-up successivo.              |
| `followup`      | Non applica steering all'esecuzione corrente.                                                                                   | Esegue i messaggi in coda in seguito.                                                 |
| `collect`       | Non applica steering all'esecuzione corrente.                                                                                   | Unisce i messaggi in coda compatibili in un unico turno successivo dopo la finestra di debounce. |
| `interrupt`     | Interrompe l'esecuzione attiva, poi avvia il messaggio più recente.                                                             | Nessuno.                                                                              |

## Esempio di burst

Se quattro utenti inviano messaggi mentre l'agente sta eseguendo una chiamata a strumento:

- `steer`: il runtime attivo riceve tutti e quattro i messaggi in ordine di arrivo prima
  della sua successiva decisione del modello. Pi li svuota al successivo confine del modello; Codex
  li riceve come un unico `turn/steer` raggruppato.
- `queue`: steering serializzato precedente. Pi inserisce un messaggio in coda alla volta;
  Codex riceve richieste `turn/steer` separate.
- `collect`: OpenClaw attende la fine dell'esecuzione attiva, poi crea un turno di follow-up
  con i messaggi in coda compatibili dopo la finestra di debounce.

## Ambito

Lo steering prende sempre di mira l'esecuzione della sessione attiva corrente. Non crea una nuova
sessione, non modifica la policy degli strumenti dell'esecuzione attiva e non suddivide i messaggi per mittente. Nei
canali multiutente, i prompt in ingresso includono già il contesto di mittente e instradamento, quindi
la chiamata al modello successiva può vedere chi ha inviato ciascun messaggio.

Usa `collect` quando vuoi che OpenClaw costruisca un turno di follow-up successivo che possa
unire messaggi compatibili e preservare la policy di eliminazione della coda di follow-up. Usa
`queue` solo quando ti serve il comportamento di steering precedente, uno alla volta.

## Debounce

`messages.queue.debounceMs` si applica alla consegna di follow-up, inclusi `collect`,
`followup`, `steer-backlog` e il fallback di `steer` quando lo steering durante l'esecuzione attiva non è
disponibile. Per Pi, `steer` attivo non usa il timer di debounce perché
Pi raggruppa naturalmente i messaggi fino al successivo confine del modello. Per l'harness
Codex nativo, OpenClaw usa lo stesso valore di debounce della finestra di quiete prima di
inviare il `turn/steer` raggruppato.

## Correlati

- [Coda dei comandi](/it/concepts/queue)
- [Steer](/tools/steer)
- [Messaggi](/it/concepts/messages)
- [Loop dell'agente](/it/concepts/agent-loop)
