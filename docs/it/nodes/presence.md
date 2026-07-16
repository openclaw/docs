---
read_when:
    - Si desidera che OpenClaw identifichi il Mac attivo
    - Si sta eseguendo il debug dell'attività dell'ultimo input o della selezione del Node attivo
    - Si desidera comprendere l'instradamento delle notifiche di connessione dei Node
summary: Rileva il Mac usato più di recente e instrada lì gli avvisi del Node
title: Presenza attiva al computer
x-i18n:
    generated_at: "2026-07-16T14:33:25Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 2a4ec4607e1e4ef8d989d3c4ece0ee6e0730908a1df76ff52c1898b4307d979b
    source_path: nodes/presence.md
    workflow: 16
---

La presenza attiva del computer indica al Gateway quale Node macOS connesso ha ricevuto
l'input fisico più recente dal mouse o dalla tastiera. OpenClaw utilizza questo segnale per
contrassegnare un Mac come `active`, fornire all'agente un'indicazione stabile del Node attivo e instradare
gli avvisi di connessione dei Node al computer presso il quale è più probabile che l'utente sia presente.

Questa funzionalità è distinta dalla [presenza di sistema](/it/concepts/presence), che rappresenta l'elenco in tempo reale
dei client del Gateway, e dai beacon permanenti `node.presence.alive`, che
registrano l'ultima riattivazione di un Node mobile senza considerarlo connesso.

## Requisiti

- L'app OpenClaw per macOS è associata e connessa in modalità Node.
- L'autorizzazione **Accessibility** è concessa all'app OpenClaw firmata.
- Per gli avvisi di connessione, è concessa anche l'autorizzazione **Notifications** e il
  Node Mac espone `system.notify`.

La segnalazione dell'attività è attualmente implementata dal Node macOS nativo. Gli host Node iOS,
Android, watchOS e headless possono segnalare la connessione o lo stato
dell'ultima attività in background, ma non concorrono alla designazione di computer attivo.

## Verificare il computer attivo

1. Nell'app macOS, aprire **Settings -> Permissions** e concedere
   **Accessibility** nelle impostazioni di sistema di macOS.
2. Verificare che il Node Mac sia connesso:

   ```bash
   openclaw nodes status --connected
   ```

3. Muovere il mouse o premere un tasto su quel Mac, quindi eseguire:

   ```bash
   openclaw nodes status
   openclaw nodes describe --node <node-id-or-name>
   ```

Il Mac idoneo con l'attività più recente è contrassegnato come `active`. L'output dello stato mostra il tempo
trascorso dall'ultimo input; `describe` espone `active`, `lastActiveAtMs` e `presenceUpdatedAtMs`.
L'attività viene intenzionalmente aggregata, pertanto dopo una segnalazione recente la visualizzazione può impiegare fino a circa 15
secondi per riflettere un altro input.

## Come l'attività diventa presenza

Il reporter macOS campiona ogni due secondi l'orologio di inattività del sistema HID. Invia
una segnalazione quando la connessione di un Node diventa pronta, quindi segnala le nuove attività fisiche
non più di una volta ogni 15 secondi. Durante l'inattività, invia un keepalive
ogni tre minuti. La durata dell'inattività è limitata a 30 giorni, affinché un campione molto vecchio
non possa avanzare nel tempo e diventare erroneamente quello del computer più recente.

Il Gateway accetta l'attività soltanto quando tutte queste condizioni sono soddisfatte:

- l'evento appartiene alla connessione autenticata corrente per quell'ID Node;
- il Node dispone dell'autorizzazione effettiva `accessibility: true`;
- il payload contiene un valore intero limitato `idleSeconds`.

Il Gateway sottrae `idleSeconds` dal proprio tempo di osservazione per ricavare
`lastActiveAtMs`. Non considera mai attendibile un timestamp dell'orologio di sistema fornito dal Node. Tra
i Mac idonei connessi, prevale il valore `lastActiveAtMs` più recente; in caso di parità, viene utilizzato l'aggiornamento di presenza
più recente.

La presenza è locale al processo e vincolata alla connessione. La disconnessione della sessione
corrente, la sua sostituzione con un'altra sessione che utilizza lo stesso ID Node o la revoca
di Accessibility cancella lo stato di attività di quel Node e ricalcola il Mac attivo.

## Privacy e contesto del modello

OpenClaw invia la durata dell'inattività, non il contenuto degli input. Non invia i valori dei tasti,
le coordinate del mouse, i nomi delle applicazioni, i titoli delle finestre o gli eventi di input non elaborati. Il
reporter macOS legge lo stato HID dell'hardware, pertanto gli eventi sintetici di controllo del computer
non fanno apparire un Mac automatizzato come il computer utilizzato fisicamente.

L'attività continua non crea eventi di sistema visibili al modello. La riga dinamica
di runtime contiene soltanto l'ID Node autenticato:

```text
active_node=<node-id>
```

I timestamp esatti e i nomi visualizzati controllati dai Node non vengono inseriti nel prompt, per
evitare la prompt injection e le variazioni della cache. Quando l'agente necessita di dettagli aggiornati,
lo strumento `nodes` può invece leggere `node.list` o `node.describe`.

## Come vengono instradati gli avvisi di connessione

Dopo che un Node completa l'handshake con il Gateway, OpenClaw attende 750 millisecondi affinché
il Mac in fase di connessione possa inviare il primo campione di attività. Quindi prova a utilizzare il
Mac connesso in grado di inviare notifiche con l'attività più recente.

- Se la consegna primaria riesce, nessun altro Mac riceve l'avviso.
- Se non è disponibile alcun Mac attivo o la consegna primaria non riesce, OpenClaw attende cinque
  secondi e prova tutti gli altri Mac connessi che espongono `system.notify`.
- Un avviso di riconnessione per lo stesso Node viene soppresso per cinque minuti dopo un
  effettivo tentativo di consegna, evitando che l'instabilità della riconnessione produca una
  raffica di notifiche.

Gli avvisi sono vincolati alle connessioni esatte dei Node. Una sessione di origine disconnessa
o sostituita non può completare un vecchio avviso pianificato, mentre una connessione di destinazione
sostitutiva può comunque partecipare alla consegna di fallback.

## Risoluzione dei problemi

| Sintomo                                   | Verifica                                                                                                                                                                |
| ----------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Nessuna riga è contrassegnata come `active`                 | Verificare che sia connesso un Node macOS nativo e che `openclaw nodes describe --node <id>` mostri `permissions.accessibility: true`.                                          |
| Il Mac errato rimane attivo              | Utilizzare fisicamente quel Mac, attendere la finestra di aggregazione, quindi eseguire nuovamente `openclaw nodes status`. Le azioni sintetiche di controllo del computer non vengono considerate.                        |
| I dati dell'ultimo input scompaiono                | Verificare se il Mac si è disconnesso, se la sua sessione Node è stata sostituita o se Accessibility è stata revocata. Ciascuna condizione cancella intenzionalmente l'attività.                       |
| L'avviso viene visualizzato su più Mac         | La consegna primaria non era disponibile o non è riuscita, quindi è stato eseguito il fallback ritardato. Verificare che il Mac attivo sia connesso, consenta le notifiche ed esponga `system.notify`. |
| L'agente non menziona il Mac attivo | Avviare un nuovo turno dopo una variazione dell'attività. L'indicazione di runtime è stabile e compatta; utilizzare lo strumento `nodes` per ottenere i metadati correnti esatti.                                    |

Per il ripristino di TCC, consultare [autorizzazioni macOS](/it/platforms/mac/permissions). Per gli errori
di connessione e dei comandi dei Node, consultare [Risoluzione dei problemi dei Node](/it/nodes/troubleshooting).

## Contenuti correlati

- [Node](/it/nodes)
- [CLI dei Node](/it/cli/nodes)
- [Presenza di sistema](/it/concepts/presence)
- [Protocollo del Gateway](/it/gateway/protocol#presence)
- [App macOS](/it/platforms/macos)
