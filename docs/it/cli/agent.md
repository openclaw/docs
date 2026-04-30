---
read_when:
    - Vuoi eseguire un turno dell'agente dagli script (facoltativamente inviare la risposta)
summary: Riferimento CLI per `openclaw agent` (invia un turno dell'agente tramite il Gateway)
title: Agente
x-i18n:
    generated_at: "2026-04-30T08:41:30Z"
    model: gpt-5.5
    provider: openai
    source_hash: b77668949040933c5281f2f183e48cc2593d09252470483b9ae38dcffd13d071
    source_path: cli/agent.md
    workflow: 16
---

# `openclaw agent`

Esegui un turno agente tramite il Gateway (usa `--local` per la modalità incorporata).
Usa `--agent <id>` per indirizzare direttamente un agente configurato.

Passa almeno un selettore di sessione:

- `--to <dest>`
- `--session-id <id>`
- `--agent <id>`

Correlati:

- Strumento di invio agente: [Invio agente](/it/tools/agent-send)

## Opzioni

- `-m, --message <text>`: corpo del messaggio obbligatorio
- `-t, --to <dest>`: destinatario usato per derivare la chiave di sessione
- `--session-id <id>`: id sessione esplicito
- `--agent <id>`: id agente; sostituisce i binding di routing
- `--model <id>`: override del modello per questa esecuzione (`provider/model` o id modello)
- `--thinking <level>`: livello di ragionamento dell'agente (`off`, `minimal`, `low`, `medium`, `high`, più livelli personalizzati supportati dal provider come `xhigh`, `adaptive` o `max`)
- `--verbose <on|off>`: mantieni il livello verboso per la sessione
- `--channel <channel>`: canale di consegna; ometti per usare il canale principale della sessione
- `--reply-to <target>`: override della destinazione di consegna
- `--reply-channel <channel>`: override del canale di consegna
- `--reply-account <id>`: override dell'account di consegna
- `--local`: esegui direttamente l'agente incorporato (dopo il preload del registro dei plugin)
- `--deliver`: invia la risposta al canale/destinazione selezionato
- `--timeout <seconds>`: override del timeout dell'agente (predefinito 600 o valore di configurazione)
- `--json`: genera JSON

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
- `--local` precarica comunque prima il registro dei plugin, quindi provider, strumenti e canali forniti dai plugin restano disponibili durante le esecuzioni incorporate.
- `--local` e le esecuzioni di fallback incorporato sono trattate come esecuzioni one-shot. Le risorse MCP loopback incluse e le sessioni Claude stdio calde aperte per quel processo locale vengono ritirate dopo la risposta, quindi le invocazioni da script non mantengono attivi processi figli locali.
- Le esecuzioni basate sul Gateway lasciano le risorse MCP loopback di proprietà del Gateway sotto il processo Gateway in esecuzione; i client più vecchi possono ancora inviare lo storico flag di pulizia, ma il Gateway lo accetta come no-op di compatibilità.
- `--channel`, `--reply-channel` e `--reply-account` influenzano la consegna della risposta, non il routing della sessione.
- `--json` mantiene stdout riservato alla risposta JSON. Le diagnostiche di Gateway, plugin e fallback incorporato vengono instradate a stderr, così gli script possono analizzare direttamente stdout.
- Il JSON del fallback incorporato include `meta.transport: "embedded"` e `meta.fallbackFrom: "gateway"`, così gli script possono distinguere le esecuzioni di fallback dalle esecuzioni Gateway.
- Se il Gateway accetta un'esecuzione agente ma la CLI va in timeout mentre attende la risposta finale, il fallback incorporato usa un nuovo id esplicito di sessione/esecuzione `gateway-fallback-*` e riporta `meta.fallbackReason: "gateway_timeout"` più i campi della sessione di fallback. Questo evita di entrare in competizione con il blocco della trascrizione di proprietà del Gateway o di sostituire silenziosamente la sessione di conversazione instradata originale.
- Quando questo comando attiva la rigenerazione di `models.json`, le credenziali dei provider gestite da SecretRef vengono mantenute come marcatori non segreti (per esempio nomi di variabili env, `secretref-env:ENV_VAR_NAME` o `secretref-managed`), non come testo in chiaro del segreto risolto.
- Le scritture dei marcatori sono autorevoli rispetto alla sorgente: OpenClaw mantiene i marcatori dallo snapshot della configurazione sorgente attiva, non dai valori segreti runtime risolti.

## Correlati

- [Riferimento CLI](/it/cli)
- [Runtime agente](/it/concepts/agent)
