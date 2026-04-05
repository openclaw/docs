---
read_when:
    - Vuoi eseguire un turno dell'agente dagli script (facoltativamente consegnando la risposta)
summary: Riferimento CLI per `openclaw agent` (invia un turno dell'agente tramite il Gateway)
title: agent
x-i18n:
    generated_at: "2026-04-05T13:46:40Z"
    model: gpt-5.4
    provider: openai
    source_hash: 0627f943bc7f3556318008f76dc6150788cf06927dccdc7d2681acb98f257d56
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

- Strumento di invio dell'agente: [Agent send](/tools/agent-send)

## Opzioni

- `-m, --message <text>`: corpo del messaggio richiesto
- `-t, --to <dest>`: destinatario usato per derivare la chiave della sessione
- `--session-id <id>`: ID sessione esplicito
- `--agent <id>`: ID agente; sovrascrive i binding di instradamento
- `--thinking <off|minimal|low|medium|high|xhigh>`: livello di pensiero dell'agente
- `--verbose <on|off>`: rende persistente il livello verbose per la sessione
- `--channel <channel>`: canale di consegna; omettilo per usare il canale della sessione principale
- `--reply-to <target>`: override della destinazione di consegna
- `--reply-channel <channel>`: override del canale di consegna
- `--reply-account <id>`: override dell'account di consegna
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

- La modalità Gateway torna all'agente incorporato quando la richiesta Gateway non riesce. Usa `--local` per forzare l'esecuzione incorporata fin dall'inizio.
- `--local` precarica comunque prima il registro plugin, così provider, strumenti e canali forniti dai plugin restano disponibili durante le esecuzioni incorporate.
- `--channel`, `--reply-channel` e `--reply-account` influenzano la consegna della risposta, non l'instradamento della sessione.
- Quando questo comando attiva la rigenerazione di `models.json`, le credenziali dei provider gestite da SecretRef vengono rese persistenti come marcatori non segreti (ad esempio nomi di variabili env, `secretref-env:ENV_VAR_NAME` o `secretref-managed`), non come testo in chiaro dei segreti risolti.
- Le scritture dei marcatori sono autorevoli rispetto alla sorgente: OpenClaw rende persistenti i marcatori dall'istantanea attiva della configurazione sorgente, non dai valori segreti risolti a runtime.
