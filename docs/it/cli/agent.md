---
read_when:
    - Vuoi eseguire un turno dell'agente da script (con consegna facoltativa della risposta)
summary: Riferimento CLI per `openclaw agent` (invia un turno dell'agente tramite il Gateway)
title: Agente
x-i18n:
    generated_at: "2026-05-10T19:27:15Z"
    model: gpt-5.5
    provider: openai
    source_hash: ae5c2f895cadf70a6253e49a3c7c698a04840a24231076cf8ef5bab340162f52
    source_path: cli/agent.md
    workflow: 16
---

# `openclaw agent`

Esegui un turno dell'agente tramite il Gateway (usa `--local` per l'esecuzione incorporata).
Usa `--agent <id>` per indirizzare direttamente un agente configurato.

Passa almeno un selettore di sessione:

- `--to <dest>`
- `--session-id <id>`
- `--agent <id>`

Correlato:

- Strumento di invio agente: [Invio agente](/it/tools/agent-send)

## Opzioni

- `-m, --message <text>`: corpo del messaggio obbligatorio
- `-t, --to <dest>`: destinatario usato per derivare la chiave di sessione
- `--session-id <id>`: id sessione esplicito
- `--agent <id>`: id agente; sovrascrive i binding di instradamento
- `--model <id>`: override del modello per questa esecuzione (`provider/model` o id modello)
- `--thinking <level>`: livello di ragionamento dell'agente (`off`, `minimal`, `low`, `medium`, `high`, più livelli personalizzati supportati dal provider come `xhigh`, `adaptive` o `max`)
- `--verbose <on|off>`: persiste il livello verboso per la sessione
- `--channel <channel>`: canale di consegna; ometti per usare il canale principale della sessione
- `--reply-to <target>`: override della destinazione di consegna
- `--reply-channel <channel>`: override del canale di consegna
- `--reply-account <id>`: override dell'account di consegna
- `--local`: esegue direttamente l'agente incorporato (dopo il precaricamento del registro Plugin)
- `--deliver`: invia la risposta al canale/destinazione selezionati
- `--timeout <seconds>`: override del timeout dell'agente (predefinito 600 o valore di configurazione)
- `--json`: output JSON

## Esempi

```bash
openclaw agent --to +15555550123 --message "status update" --deliver
openclaw agent --agent ops --message "Summarize logs"
openclaw agent --agent ops --model openai/gpt-5.4 --message "Summarize logs"
openclaw agent --session-id 1234 --message "Summarize inbox" --thinking medium
openclaw agent --to +15555550123 --message "Trace logs" --verbose on --json
openclaw agent --agent ops --message "Generate report" --deliver --reply-channel slack --reply-to "#reports"
openclaw agent --agent ops --message "Run locally" --local
```

## Note

- La modalità Gateway ripiega sull'agente incorporato quando la richiesta al Gateway non riesce. Usa `--local` per forzare subito l'esecuzione incorporata.
- `--local` precarica comunque prima il registro Plugin, quindi provider, strumenti e canali forniti dai Plugin restano disponibili durante le esecuzioni incorporate.
- `--local` e le esecuzioni di fallback incorporato sono trattate come esecuzioni singole. Le risorse MCP loopback in bundle e le sessioni stdio Claude calde aperte per quel processo locale vengono ritirate dopo la risposta, quindi le invocazioni da script non mantengono in vita processi figli locali.
- Le esecuzioni supportate dal Gateway lasciano le risorse MCP loopback di proprietà del Gateway sotto il processo Gateway in esecuzione; i client meno recenti possono ancora inviare il flag storico di pulizia, ma il Gateway lo accetta come no-op di compatibilità.
- `--channel`, `--reply-channel` e `--reply-account` influenzano la consegna della risposta, non l'instradamento della sessione.
- `--json` mantiene stdout riservato alla risposta JSON. Le diagnostiche del Gateway, dei Plugin e del fallback incorporato vengono instradate a stderr, così gli script possono analizzare direttamente stdout.
- Il JSON del fallback incorporato include `meta.transport: "embedded"` e `meta.fallbackFrom: "gateway"` così gli script possono distinguere le esecuzioni di fallback dalle esecuzioni Gateway.
- Se il Gateway accetta un'esecuzione agente ma la CLI va in timeout in attesa della risposta finale, il fallback incorporato usa un nuovo id sessione/esecuzione esplicito `gateway-fallback-*` e riporta `meta.fallbackReason: "gateway_timeout"` più i campi della sessione di fallback. Questo evita corse sul lock della trascrizione di proprietà del Gateway o la sostituzione silenziosa della sessione di conversazione instradata originale.
- Quando questo comando attiva la rigenerazione di `models.json`, le credenziali provider gestite da SecretRef vengono persistite come marcatori non segreti (per esempio nomi di variabili d'ambiente, `secretref-env:ENV_VAR_NAME` o `secretref-managed`), non come testo segreto risolto.
- Le scritture dei marcatori sono autorevoli rispetto alla sorgente: OpenClaw persiste i marcatori dallo snapshot della configurazione sorgente attiva, non dai valori segreti di runtime risolti.

## Stato di consegna JSON

Quando si usa `--json --deliver`, la risposta JSON della CLI può includere `deliveryStatus` di primo livello, così gli script possono distinguere invii consegnati, soppressi, parziali e non riusciti:

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

`deliveryStatus.status` è uno tra `sent`, `suppressed`, `partial_failed` o `failed`. `suppressed` significa che la consegna non è stata inviata intenzionalmente, per esempio perché un hook di invio messaggi l'ha annullata o perché non c'era alcun risultato visibile; è comunque un esito terminale senza nuovo tentativo. `partial_failed` significa che almeno un payload è stato inviato prima che un payload successivo non riuscisse. `failed` significa che nessun invio durevole è stato completato oppure che il preflight della consegna non è riuscito.

Anche le risposte CLI supportate dal Gateway preservano la forma grezza del risultato del Gateway, dove lo stesso oggetto è disponibile in `result.deliveryStatus`.

Campi comuni:

- `requested`: sempre `true` quando l'oggetto è presente.
- `attempted`: `true` dopo l'esecuzione del percorso di invio durevole; `false` per errori di preflight o assenza di payload visibili.
- `succeeded`: `true`, `false` o `"partial"`; `"partial"` si abbina a `status: "partial_failed"`.
- `reason`: un motivo in snake-case minuscolo proveniente dalla consegna durevole o dalla validazione di preflight. I motivi noti includono `cancelled_by_message_sending_hook`, `no_visible_payload`, `no_visible_result`, `channel_resolved_to_internal`, `unknown_channel`, `invalid_delivery_target` e `no_delivery_target`; gli invii durevoli non riusciti possono anche riportare la fase non riuscita. Tratta i valori sconosciuti come opachi perché l'insieme può espandersi.
- `resultCount`: numero di risultati di invio del canale quando disponibile.
- `sentBeforeError`: `true` quando un errore parziale ha inviato almeno un payload prima dell'errore.
- `error`: booleano `true` per invii non riusciti o parzialmente non riusciti.
- `errorMessage`: incluso solo quando viene acquisito un messaggio di errore di consegna sottostante. Gli errori di preflight contengono `error` e `reason` ma nessun `errorMessage`.
- `payloadOutcomes`: risultati opzionali per payload con `index`, `status`, `reason`, `resultCount`, `error`, `stage`, `sentBeforeError` o metadati dell'hook quando disponibili.

## Correlati

- [Riferimento CLI](/it/cli)
- [Runtime agente](/it/concepts/agent)
