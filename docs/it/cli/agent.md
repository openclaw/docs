---
read_when:
    - Vuoi eseguire un turno dell'agente da script (con consegna facoltativa della risposta)
summary: Riferimento CLI per `openclaw agent` (invia un turno dell'agente tramite il Gateway)
title: agente
x-i18n:
    generated_at: "2026-04-23T08:25:49Z"
    model: gpt-5.4
    provider: openai
    source_hash: 4ba3181d74e9a8d6d607ee62b18e1e6fd693e64e7789e6b29b7f7b1ccb7b69d0
    source_path: cli/agent.md
    workflow: 15
---

# `openclaw agent`

Esegui un turno dell'agente tramite il Gateway (usa `--local` per la modalità incorporata).
Usa `--agent <id>` per indirizzare direttamente un agente configurato.

Passa almeno un selettore di sessione:

- `--to <dest>`
- `--session-id <id>`
- `--agent <id>`

Correlati:

- Strumento di invio agente: [Invio agente](/it/tools/agent-send)

## Opzioni

- `-m, --message <text>`: corpo del messaggio obbligatorio
- `-t, --to <dest>`: destinatario usato per derivare la chiave della sessione
- `--session-id <id>`: id sessione esplicito
- `--agent <id>`: id agente; sovrascrive i binding di instradamento
- `--thinking <level>`: livello di ragionamento dell'agente (`off`, `minimal`, `low`, `medium`, `high`, più livelli personalizzati supportati dal provider come `xhigh`, `adaptive` o `max`)
- `--verbose <on|off>`: persiste il livello verbose per la sessione
- `--channel <channel>`: canale di consegna; omettilo per usare il canale principale della sessione
- `--reply-to <target>`: sovrascrittura della destinazione di consegna
- `--reply-channel <channel>`: sovrascrittura del canale di consegna
- `--reply-account <id>`: sovrascrittura dell'account di consegna
- `--local`: esegue direttamente l'agente incorporato (dopo il precaricamento del registro plugin)
- `--deliver`: invia la risposta al canale/destinazione selezionato
- `--timeout <seconds>`: sovrascrive il timeout dell'agente (predefinito 600 o valore di configurazione)
- `--json`: output JSON

## Esempi

```bash
openclaw agent --to +15555550123 --message "status update" --deliver
openclaw agent --agent ops --message "Summarize logs"
openclaw agent --session-id 1234 --message "Summarize inbox" --thinking medium
openclaw agent --to +15555550123 --message "Trace logs" --verbose on --json
openclaw agent --agent ops --message "Generate report" --deliver --reply-channel slack --reply-to "#reports"
openclaw agent --agent ops --message "Run locally" --local
```

## Note

- La modalità Gateway usa come fallback l'agente incorporato quando la richiesta al Gateway fallisce. Usa `--local` per forzare subito l'esecuzione incorporata.
- `--local` precarica comunque prima il registro plugin, quindi provider, strumenti e canali forniti dai plugin restano disponibili durante le esecuzioni incorporate.
- `--channel`, `--reply-channel` e `--reply-account` influenzano la consegna della risposta, non l'instradamento della sessione.
- Quando questo comando attiva la rigenerazione di `models.json`, le credenziali del provider gestite da SecretRef vengono persistite come marcatori non segreti (ad esempio nomi di variabili d'ambiente, `secretref-env:ENV_VAR_NAME` o `secretref-managed`), non come testo in chiaro dei segreti risolti.
- Le scritture dei marcatori sono autorevoli rispetto alla fonte: OpenClaw persiste i marcatori dall'istantanea della configurazione sorgente attiva, non dai valori segreti risolti a runtime.
