---
read_when:
    - Vuoi eseguire un turno dell'agente da script (con recapito facoltativo della risposta)
summary: Riferimento CLI per `openclaw agent` (invia un turno dell'agente tramite il Gateway)
title: Agente
x-i18n:
    generated_at: "2026-06-27T17:17:55Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: be2aad94ba288d14b4b18086dae54eb10c1cd0a6c7b27a836d07f39200e651d8
    source_path: cli/agent.md
    workflow: 16
---

# `openclaw agent`

Esegue un turno dell’agente tramite il Gateway (usa `--local` per la modalità incorporata).
Usa `--agent <id>` per puntare direttamente a un agente configurato.

Passa almeno un selettore di sessione:

- `--to <dest>`
- `--session-key <key>`
- `--session-id <id>`
- `--agent <id>`

Correlato:

- Strumento di invio agente: [Invio agente](/it/tools/agent-send)

## Opzioni

- `-m, --message <text>`: corpo del messaggio
- `--message-file <path>`: legge il corpo del messaggio da un file UTF-8
- `-t, --to <dest>`: destinatario usato per derivare la chiave di sessione
- `--session-key <key>`: chiave di sessione esplicita da usare per il routing
- `--session-id <id>`: id di sessione esplicito
- `--agent <id>`: id dell’agente; sostituisce i binding di routing
- `--model <id>`: override del modello per questa esecuzione (`provider/model` o id modello)
- `--thinking <level>`: livello di ragionamento dell’agente (`off`, `minimal`, `low`, `medium`, `high`, più livelli personalizzati supportati dal provider come `xhigh`, `adaptive` o `max`)
- `--verbose <on|off>`: mantiene il livello verboso per la sessione
- `--channel <channel>`: canale di consegna; ometti per usare il canale principale della sessione
- `--reply-to <target>`: override della destinazione di consegna
- `--reply-channel <channel>`: override del canale di consegna
- `--reply-account <id>`: override dell’account di consegna
- `--local`: esegue direttamente l’agente incorporato (dopo il precaricamento del registro dei Plugin)
- `--deliver`: invia la risposta al canale/destinazione selezionato
- `--timeout <seconds>`: override del timeout dell’agente (valore predefinito 600 o valore di configurazione)
- `--json`: emette JSON

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

- Passa esattamente uno tra `--message` e `--message-file`. `--message-file` conserva il contenuto multilinea del file dopo aver rimosso un BOM UTF-8 opzionale e rifiuta i file che non sono UTF-8 valido.
- La modalità Gateway ripiega sull’agente incorporato quando la richiesta al Gateway non riesce. Usa `--local` per forzare subito l’esecuzione incorporata.
- `--local` precarica comunque prima il registro dei Plugin, quindi provider, strumenti e canali forniti dai Plugin restano disponibili durante le esecuzioni incorporate.
- `--local` e le esecuzioni di fallback incorporate sono trattate come esecuzioni una tantum. Le risorse MCP loopback in bundle e le sessioni stdio Claude calde aperte per quel processo locale vengono ritirate dopo la risposta, quindi le invocazioni da script non mantengono in vita processi figli locali.
- Le esecuzioni supportate dal Gateway lasciano le risorse MCP loopback di proprietà del Gateway sotto il processo Gateway in esecuzione; i client meno recenti possono ancora inviare il flag storico di cleanup, ma il Gateway lo accetta come no-op di compatibilità.
- `--channel`, `--reply-channel` e `--reply-account` influenzano la consegna della risposta, non il routing della sessione.
- `--session-key` seleziona una chiave di sessione esplicita. Le chiavi con prefisso agente devono usare `agent:<agent-id>:<session-key>` e `--agent` deve corrispondere all’id agente della chiave quando entrambi sono forniti. Le chiavi nude non sentinella sono nello scope di `--agent` quando fornito, oppure dell’agente predefinito configurato altrimenti; ad esempio, `--agent ops --session-key incident-42` instrada verso `agent:ops:incident-42`. I letterali `global` e `unknown` restano senza scope solo quando non viene fornito `--agent`; in quel caso, il fallback incorporato e la proprietà dello store usano l’agente predefinito configurato.
- `--json` mantiene stdout riservato alla risposta JSON. Le diagnostiche di Gateway, Plugin e fallback incorporato vengono instradate a stderr, così gli script possono analizzare direttamente stdout.
- Il JSON del fallback incorporato include `meta.transport: "embedded"` e `meta.fallbackFrom: "gateway"`, così gli script possono distinguere le esecuzioni di fallback dalle esecuzioni Gateway.
- Se il Gateway accetta un’esecuzione agente ma la CLI va in timeout in attesa della risposta finale, il fallback incorporato usa una nuova sessione/id esecuzione esplicita `gateway-fallback-*` e riporta `meta.fallbackReason: "gateway_timeout"` più i campi sessione del fallback. Questo evita di competere con il lock della trascrizione di proprietà del Gateway o di sostituire silenziosamente la sessione di conversazione instradata originale.
- Per le esecuzioni supportate dal Gateway, `SIGTERM` e `SIGINT` interrompono la richiesta CLI in attesa. Se il Gateway ha già accettato l’esecuzione, la CLI invia anche `chat.abort` per quell’id esecuzione accettato prima di uscire. Le esecuzioni locali `--local` e le esecuzioni di fallback incorporate ricevono lo stesso segnale di interruzione, ma non inviano `chat.abort`. Se un `--run-id` duplicato raggiunge il Gateway mentre l’esecuzione agente originale è ancora attiva, la risposta duplicata riporta `status: "in_flight"` e la CLI non JSON stampa una diagnostica stderr invece di una risposta vuota. Per wrapper esterni cron/systemd, mantieni un backstop esterno di terminazione forzata come `timeout -k 60 600 openclaw agent ...`, così il supervisore può comunque recuperare il processo se lo spegnimento non riesce a svuotarlo.
- Quando questo comando attiva la rigenerazione di `models.json`, le credenziali provider gestite da SecretRef vengono mantenute come marcatori non segreti (ad esempio nomi di variabili env, `secretref-env:ENV_VAR_NAME` o `secretref-managed`), non come testo in chiaro dei segreti risolti.
- Le scritture dei marcatori sono autoritative rispetto alla sorgente: OpenClaw mantiene i marcatori dallo snapshot della configurazione sorgente attiva, non dai valori segreti runtime risolti.

## Stato di consegna JSON

Quando viene usato `--json --deliver`, la risposta JSON della CLI può includere `deliveryStatus` di primo livello, così gli script possono distinguere invii consegnati, soppressi, parziali e non riusciti:

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

`deliveryStatus.status` è uno tra `sent`, `suppressed`, `partial_failed` o `failed`. `suppressed` significa che la consegna non è stata inviata intenzionalmente, ad esempio perché un hook di invio messaggi l’ha annullata o perché non c’era alcun risultato visibile; è comunque un esito terminale senza retry. `partial_failed` significa che almeno un payload è stato inviato prima che un payload successivo non riuscisse. `failed` significa che nessun invio durevole è stato completato o che il preflight della consegna non è riuscito.

Le risposte CLI supportate dal Gateway conservano anche la forma grezza del risultato Gateway, dove lo stesso oggetto è disponibile in `result.deliveryStatus`.

Campi comuni:

- `requested`: sempre `true` quando l’oggetto è presente.
- `attempted`: `true` dopo l’esecuzione del percorso di invio durevole; `false` per errori di preflight o assenza di payload visibili.
- `succeeded`: `true`, `false` o `"partial"`; `"partial"` si abbina a `status: "partial_failed"`.
- `reason`: una motivazione snake-case minuscola dalla consegna durevole o dalla validazione preflight. Le motivazioni note includono `cancelled_by_message_sending_hook`, `no_visible_payload`, `no_visible_result`, `channel_resolved_to_internal`, `unknown_channel`, `invalid_delivery_target` e `no_delivery_target`; gli invii durevoli non riusciti possono anche riportare la fase non riuscita. Tratta i valori sconosciuti come opachi perché l’insieme può espandersi.
- `resultCount`: numero di risultati di invio del canale quando disponibile.
- `sentBeforeError`: `true` quando un errore parziale ha inviato almeno un payload prima dell’errore.
- `error`: booleano `true` per invii non riusciti o parzialmente non riusciti.
- `errorMessage`: incluso solo quando viene acquisito un messaggio di errore di consegna sottostante. Gli errori di preflight riportano `error` e `reason`, ma nessun `errorMessage`.
- `payloadOutcomes`: risultati opzionali per payload con `index`, `status`, `reason`, `resultCount`, `error`, `stage`, `sentBeforeError` o metadati hook quando disponibili.

## Correlati

- [Riferimento CLI](/it/cli)
- [Runtime agente](/it/concepts/agent)
