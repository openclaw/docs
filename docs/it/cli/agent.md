---
read_when:
    - Vuoi eseguire un turno dell'agente da script (facoltativamente consegnando la risposta)
summary: Riferimento CLI per `openclaw agent` (invia un turno dell'agente tramite il Gateway)
title: Agente
x-i18n:
    generated_at: "2026-04-24T08:32:35Z"
    model: gpt-5.4
    provider: openai
    source_hash: c4d57b8e368891a0010b053a7504d6313ad2233b5f5f43b34be1f9aa92caa86c
    source_path: cli/agent.md
    workflow: 15
---

# `openclaw agent`

Esegui un turno dell'agente tramite il Gateway (usa `--local` per la modalità embedded).
Usa `--agent <id>` per puntare direttamente a un agente configurato.

Passa almeno un selettore di sessione:

- `--to <dest>`
- `--session-id <id>`
- `--agent <id>`

Correlato:

- Strumento di invio agente: [Agent send](/it/tools/agent-send)

## Opzioni

- `-m, --message <text>`: corpo del messaggio obbligatorio
- `-t, --to <dest>`: destinatario usato per derivare la chiave di sessione
- `--session-id <id>`: ID sessione esplicito
- `--agent <id>`: ID agente; sovrascrive i binding di instradamento
- `--thinking <level>`: livello di ragionamento dell'agente (`off`, `minimal`, `low`, `medium`, `high`, più livelli personalizzati supportati dal provider come `xhigh`, `adaptive` o `max`)
- `--verbose <on|off>`: persiste il livello verbose per la sessione
- `--channel <channel>`: canale di consegna; omettilo per usare il canale della sessione principale
- `--reply-to <target>`: override della destinazione di consegna
- `--reply-channel <channel>`: override del canale di consegna
- `--reply-account <id>`: override dell'account di consegna
- `--local`: esegue direttamente l'agente embedded (dopo il preload del registro Plugin)
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

- La modalità Gateway ripiega sull'agente embedded quando la richiesta al Gateway non riesce. Usa `--local` per forzare subito l'esecuzione embedded.
- `--local` precarica comunque prima il registro Plugin, così provider, strumenti e canali forniti dai Plugin restano disponibili durante le esecuzioni embedded.
- `--channel`, `--reply-channel` e `--reply-account` influiscono sulla consegna della risposta, non sull'instradamento della sessione.
- Quando questo comando attiva la rigenerazione di `models.json`, le credenziali del provider gestite tramite SecretRef vengono mantenute come marcatori non segreti (per esempio nomi di variabili d'ambiente, `secretref-env:ENV_VAR_NAME` o `secretref-managed`), non come testo in chiaro dei segreti risolti.
- Le scritture dei marcatori sono autorevoli rispetto alla sorgente: OpenClaw mantiene i marcatori dall'istantanea attiva della configurazione sorgente, non dai valori segreti risolti a runtime.

## Correlati

- [Riferimento CLI](/it/cli)
- [Runtime dell'agente](/it/concepts/agent)
