---
read_when:
    - Vuoi eseguire un turno dell'agente dagli script (con consegna facoltativa della risposta)
summary: Riferimento CLI per `openclaw agent` (invia un turno dell'agente tramite il Gateway)
title: Agente
x-i18n:
    generated_at: "2026-07-12T06:55:09Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 2e137c037a2fa58ac6534adbf1603218fc695e4c61e6c3118ce2c4ec6f1f2143
    source_path: cli/agent.md
    workflow: 16
---

# `openclaw agent`

Esegue un turno dell'agente tramite il Gateway. Se la richiesta al Gateway non riesce, ricorre all'agente incorporato; passa `--local` per forzare fin dall'inizio l'esecuzione incorporata.

Passa almeno un selettore di sessione: `--to`, `--session-key`, `--session-id` o `--agent`.

Correlato: [Strumento di invio dell'agente](/it/tools/agent-send)

## Opzioni

- `-m, --message <text>`: corpo del messaggio
- `--message-file <path>`: legge il corpo del messaggio da un file UTF-8
- `-t, --to <dest>`: destinatario usato per derivare la chiave di sessione
- `--session-key <key>`: chiave di sessione esplicita da usare per l'instradamento
- `--session-id <id>`: ID di sessione esplicito
- `--agent <id>`: ID dell'agente; sostituisce i binding di instradamento
- `--model <id>`: sostituzione del modello per questa esecuzione (`provider/model` o ID del modello)
- `--thinking <level>`: livello di ragionamento dell'agente (`off`, `minimal`, `low`, `medium`, `high`, oltre a livelli personalizzati supportati dal provider come `xhigh`, `adaptive` o `max`)
- `--verbose <on|off>`: mantiene il livello dettagliato per la sessione
- `--channel <channel>`: canale di consegna; ometti per usare il canale principale della sessione
- `--reply-to <target>`: sostituzione della destinazione di consegna
- `--reply-channel <channel>`: sostituzione del canale di consegna
- `--reply-account <id>`: sostituzione dell'account di consegna
- `--local`: esegue direttamente l'agente incorporato (dopo il precaricamento del registro dei Plugin)
- `--deliver`: invia la risposta al canale o alla destinazione selezionati
- `--timeout <seconds>`: sostituisce il timeout dell'agente (valore predefinito 600 o `agents.defaults.timeoutSeconds`); `0` disabilita il timeout
- `--json`: produce output JSON

## Esempi

```bash
openclaw agent --to +15555550123 --message "status update" --deliver
openclaw agent --agent ops --message "Summarize logs"
openclaw agent --agent ops --message-file ./task.md
openclaw agent --agent ops --model openai/gpt-5.4 --message "Summarize logs"
openclaw agent --session-key agent:ops:incident-42 --message "Summarize status"
openclaw agent --agent ops --session-key incident-42 --message "Summarize status"
openclaw agent --session-id 1234 --message "Summarize inbox" --thinking medium
openclaw agent --to +15555550123 --message "Trace logs" --verbose on --json
openclaw agent --agent ops --message "Generate report" --deliver --reply-channel slack --reply-to "#reports"
openclaw agent --agent ops --message "Run locally" --local
```

## Note

- Passa esattamente uno tra `--message` e `--message-file`. `--message-file` rimuove un BOM UTF-8 iniziale e conserva il contenuto su più righe; rifiuta i file che non sono UTF-8 validi.
- I comandi slash (ad esempio `/compact`) non possono essere eseguiti tramite `--message`. La CLI li rifiuta e rimanda invece al comando dedicato (`openclaw sessions compact <key>` per la Compaction).
- Le esecuzioni con `--local` e quelle di ripiego incorporate sono monouso: le risorse MCP local loopback incluse e le sessioni stdio Claude già attive aperte per l'esecuzione vengono terminate dopo la risposta, così le invocazioni tramite script non lasciano in esecuzione processi figlio locali. Le esecuzioni supportate dal Gateway mantengono invece le risorse MCP local loopback di proprietà del Gateway nel processo Gateway in esecuzione.
- Quando `--agent`, `--channel` e `--to` vengono usati insieme, l'instradamento della sessione segue il destinatario canonico del canale e `session.dmScope`. I canali con un'identità destinataria stabile esclusivamente in uscita usano una sessione di proprietà del provider, isolata dalla sessione principale dell'agente. `--reply-channel` e `--reply-account` influiscono solo sulla consegna.
- `--session-key` seleziona una chiave di sessione esplicita. Le chiavi con prefisso agente devono usare `agent:<agent-id>:<session-key>` e, quando sono specificati entrambi, `--agent` deve corrispondere all'ID agente della chiave. Le chiavi semplici non sentinella vengono associate a `--agent`, se specificato, oppure all'agente predefinito configurato; ad esempio, `--agent ops --session-key incident-42` instrada verso `agent:ops:incident-42`. Le chiavi letterali `global` e `unknown` restano senza ambito solo quando `--agent` non è specificato.
- `--json` riserva stdout alla risposta JSON; la diagnostica del Gateway, dei Plugin e del ripiego incorporato viene inviata a stderr, così gli script possono analizzare direttamente stdout.
- Il JSON del ripiego incorporato include `meta.transport: "embedded"` e `meta.fallbackFrom: "gateway"`, così gli script possono rilevare un'esecuzione di ripiego.
- Se il Gateway accetta un'esecuzione ma la CLI raggiunge il timeout in attesa della risposta finale, il ripiego incorporato usa un nuovo ID di sessione/esecuzione `gateway-fallback-*` e riporta `meta.fallbackReason: "gateway_timeout"` insieme ai campi della sessione di ripiego, anziché entrare in competizione con la trascrizione di proprietà del Gateway o sostituire silenziosamente la sessione originale.
- `SIGTERM`/`SIGINT` interrompono una richiesta in attesa supportata dal Gateway; se il Gateway ha già accettato l'esecuzione, prima di terminare la CLI invia anche `chat.abort` per l'ID di tale esecuzione. Le esecuzioni con `--local` e quelle di ripiego incorporate ricevono lo stesso segnale, ma non inviano `chat.abort`. Se la chiave interna di deduplicazione delle esecuzioni ha già un'esecuzione attiva per questa sessione, la risposta riporta `status: "in_flight"` e la CLI non JSON stampa un messaggio diagnostico su stderr anziché una risposta vuota. Per i wrapper cron/systemd esterni, mantieni un meccanismo di sicurezza per la terminazione forzata, come `timeout -k 60 600 openclaw agent ...`, affinché il supervisore possa recuperare il processo se l'arresto non riesce a completarsi.
- Quando questo comando attiva la rigenerazione di `models.json`, le credenziali del provider gestite da SecretRef vengono mantenute come marcatori non segreti (ad esempio nomi di variabili d'ambiente, `secretref-env:ENV_VAR_NAME` o `secretref-managed`), senza mai risolverle in testo in chiaro segreto. Le scritture dei marcatori provengono dallo snapshot attivo della configurazione sorgente, non dai valori segreti risolti in fase di esecuzione.

## Stato di consegna JSON

Con `--json --deliver`, la risposta JSON della CLI include `deliveryStatus` al livello principale, così gli script possono distinguere gli invii consegnati, soppressi, parziali e non riusciti:

```json
{
  "payloads": [{ "text": "Report ready", "mediaUrl": null }],
  "meta": { "durationMs": 1200 },
  "deliveryStatus": {
    "requested": true,
    "attempted": true,
    "status": "sent",
    "succeeded": true,
    "resultCount": 1
  }
}
```

Le risposte della CLI supportate dal Gateway conservano inoltre la struttura grezza del risultato del Gateway in `result.deliveryStatus`.

`deliveryStatus.status` può essere uno dei seguenti valori:

| Stato            | Significato                                                                                                                                                          |
| ---------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `sent`           | Consegna completata.                                                                                                                                                  |
| `suppressed`     | La consegna non è stata intenzionalmente inviata (ad esempio, un hook di invio dei messaggi l'ha annullata oppure non era presente alcun risultato visibile). Terminale, nessun nuovo tentativo. |
| `partial_failed` | Almeno un payload è stato inviato prima che un payload successivo non riuscisse.                                                                                      |
| `failed`         | Nessun invio persistente è stato completato oppure la verifica preliminare della consegna non è riuscita.                                                             |

Campi comuni:

- `requested`: sempre `true` quando l'oggetto è presente.
- `attempted`: `true` dopo l'esecuzione del percorso di invio persistente; `false` per gli errori della verifica preliminare o in assenza di payload visibili.
- `succeeded`: `true`, `false` o `"partial"`; `"partial"` è abbinato a `status: "partial_failed"`.
- `reason`: motivo in snake_case minuscolo proveniente dalla consegna persistente o dalla convalida preliminare. I valori noti includono `cancelled_by_message_sending_hook`, `no_visible_payload`, `no_visible_result`, `channel_resolved_to_internal`, `unknown_channel`, `invalid_delivery_target` e `no_delivery_target`; gli invii persistenti non riusciti possono inoltre indicare la fase non riuscita. Considera opachi i valori sconosciuti, poiché l'insieme può ampliarsi.
- `resultCount`: numero di risultati di invio del canale, quando disponibile.
- `sentBeforeError`: `true` quando, in caso di errore parziale, almeno un payload è stato inviato prima dell'errore.
- `error`: `true` per gli invii non riusciti o parzialmente non riusciti.
- `errorMessage`: presente solo quando è stato acquisito un messaggio di errore di consegna sottostante. Gli errori della verifica preliminare includono `error`/`reason`, ma non `errorMessage`.
- `payloadOutcomes`: risultati facoltativi per ogni payload con `index`, `status`, `reason`, `resultCount`, `error`, `stage`, `sentBeforeError` o metadati dell'hook, quando disponibili.

## Contenuti correlati

- [Riferimento della CLI](/it/cli)
- [Runtime dell'agente](/it/concepts/agent)
