---
read_when:
    - Spiegazione del comportamento di steer mentre un agente usa strumenti
    - Modifica del comportamento della coda active-run o dell'integrazione dell'indirizzamento a runtime
    - Confronto tra le modalità steer, queue, collect e followup
summary: Come l'instradamento delle esecuzioni attive mette in coda i messaggi ai confini del runtime
title: Coda di orientamento
x-i18n:
    generated_at: "2026-04-30T08:48:48Z"
    model: gpt-5.5
    provider: openai
    source_hash: 560390c8c26bcce95e0137f4336ad6e62bc3e2344cb15fd12ca3cfe4a85a8acc
    source_path: concepts/queue-steering.md
    workflow: 16
---

Quando arriva un messaggio mentre l'esecuzione di una sessione è già in streaming, OpenClaw può
inviare quel messaggio al runtime attivo invece di avviare un'altra esecuzione per
la stessa sessione. Le modalità pubbliche sono neutrali rispetto al runtime; Pi e l'harness
app-server nativo di Codex implementano i dettagli di consegna in modo diverso.

## Confine del runtime

Lo steering non interrompe una chiamata a uno strumento già in esecuzione. Pi verifica la presenza di
messaggi di steering in coda ai confini del modello:

1. L'assistente richiede chiamate a strumenti.
2. Pi esegue il batch di chiamate a strumenti del messaggio dell'assistente corrente.
3. Pi emette l'evento di fine turno.
4. Pi svuota i messaggi di steering in coda.
5. Pi aggiunge quei messaggi come messaggi utente prima della chiamata LLM successiva.

Questo mantiene i risultati degli strumenti associati al messaggio dell'assistente che li ha richiesti,
poi consente alla chiamata del modello successiva di vedere l'input utente più recente.

L'harness app-server nativo di Codex espone `turn/steer` invece della
coda di steering interna di Pi. OpenClaw adatta le stesse modalità anche lì:

- `steer` raggruppa i messaggi in coda per la finestra di quiete configurata, poi invia una
  singola richiesta `turn/steer` con tutto l'input utente raccolto in ordine di arrivo.
- `queue` mantiene la forma serializzata legacy inviando richieste `turn/steer`
  separate.
- `followup`, `collect`, `steer-backlog` e `interrupt` restano comportamenti di coda
  gestiti da OpenClaw intorno al turno Codex attivo.

I turni di revisione Codex e di Compaction manuale rifiutano lo steering nello stesso turno. Quando un
runtime non può accettare lo steering, OpenClaw ripiega sulla coda di followup dove
quella modalità lo consente.

## Modalità

| Modalità        | Comportamento durante l'esecuzione attiva                                                                                     | Comportamento dei followup successivi                                                |
| --------------- | ---------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------- |
| `steer`         | Inietta tutti i messaggi di steering in coda insieme al successivo confine del runtime. È l'impostazione predefinita.         | Ripiega sul followup solo quando lo steering non è disponibile.                     |
| `queue`         | Steering legacy uno alla volta. Pi inietta un messaggio in coda per confine del modello; Codex invia richieste `turn/steer` separate. | Ripiega sul followup solo quando lo steering non è disponibile.                     |
| `steer-backlog` | Stesso comportamento di steering durante l'esecuzione attiva di `steer`.                                                     | Mantiene anche lo stesso messaggio per un turno di followup successivo.             |
| `followup`      | Non applica steering all'esecuzione corrente.                                                                                | Esegue i messaggi in coda in seguito.                                               |
| `collect`       | Non applica steering all'esecuzione corrente.                                                                                | Riunisce i messaggi compatibili in coda in un unico turno successivo dopo la finestra di debounce. |
| `interrupt`     | Interrompe l'esecuzione attiva, poi avvia il messaggio più recente.                                                          | Nessuno.                                                                            |

## Esempio di burst

Se quattro utenti inviano messaggi mentre l'agente sta eseguendo una chiamata a uno strumento:

- `steer`: il runtime attivo riceve tutti e quattro i messaggi in ordine di arrivo prima
  della sua decisione del modello successiva. Pi li svuota al successivo confine del modello; Codex
  li riceve come un unico `turn/steer` raggruppato.
- `queue`: steering serializzato legacy. Pi inietta un messaggio in coda alla volta;
  Codex riceve richieste `turn/steer` separate.
- `collect`: OpenClaw attende la fine dell'esecuzione attiva, poi crea un turno di followup
  con i messaggi compatibili in coda dopo la finestra di debounce.

## Ambito

Lo steering punta sempre all'esecuzione della sessione attiva corrente. Non crea una nuova
sessione, non modifica la policy degli strumenti dell'esecuzione attiva e non divide i messaggi per mittente. Nei
canali multiutente, i prompt in ingresso includono già il contesto di mittente e routing, quindi
la chiamata del modello successiva può vedere chi ha inviato ciascun messaggio.

Usa `collect` quando vuoi che OpenClaw crei un turno di followup successivo che possa
riunire messaggi compatibili e preservare la policy di eliminazione della coda di followup. Usa
`queue` solo quando ti serve il vecchio comportamento di steering uno alla volta.

## Debounce

`messages.queue.debounceMs` si applica alla consegna dei followup, inclusi `collect`,
`followup`, `steer-backlog` e il fallback di `steer` quando lo steering durante l'esecuzione attiva non è
disponibile. Per Pi, `steer` attivo in sé non usa il timer di debounce perché
Pi raggruppa naturalmente i messaggi fino al successivo confine del modello. Per l'harness
Codex nativo, OpenClaw usa lo stesso valore di debounce come finestra di quiete prima di
inviare il `turn/steer` raggruppato.

## Correlati

- [Coda dei comandi](/it/concepts/queue)
- [Messaggi](/it/concepts/messages)
- [Ciclo dell'agente](/it/concepts/agent-loop)
