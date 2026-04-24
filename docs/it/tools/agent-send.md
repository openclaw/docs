---
read_when:
    - Vuoi attivare esecuzioni dell'agente da script o dalla riga di comando
    - Hai bisogno di consegnare programmaticamente le risposte dell'agente a un canale di chat
summary: Eseguire turni dell'agente dalla CLI e, facoltativamente, consegnare le risposte ai canali
title: Agent send
x-i18n:
    generated_at: "2026-04-24T09:03:42Z"
    model: gpt-5.4
    provider: openai
    source_hash: 8f29ab906ed8179b265138ee27312c8f4b318d09b73ad61843fca6809c32bd31
    source_path: tools/agent-send.md
    workflow: 15
---

`openclaw agent` esegue un singolo turno dell'agente dalla riga di comando senza bisogno
di un messaggio di chat in ingresso. Usalo per flussi di lavoro scriptati, test e
consegna programmatica.

## Avvio rapido

<Steps>
  <Step title="Esegui un semplice turno dell'agente">
    ```bash
    openclaw agent --message "What is the weather today?"
    ```

    Questo invia il messaggio tramite il Gateway e stampa la risposta.

  </Step>

  <Step title="Punta a un agente o a una sessione specifici">
    ```bash
    # Punta a un agente specifico
    openclaw agent --agent ops --message "Summarize logs"

    # Punta a un numero di telefono (deriva la chiave di sessione)
    openclaw agent --to +15555550123 --message "Status update"

    # Riutilizza una sessione esistente
    openclaw agent --session-id abc123 --message "Continue the task"
    ```

  </Step>

  <Step title="Consegna la risposta a un canale">
    ```bash
    # Consegna a WhatsApp (canale predefinito)
    openclaw agent --to +15555550123 --message "Report ready" --deliver

    # Consegna a Slack
    openclaw agent --agent ops --message "Generate report" \
      --deliver --reply-channel slack --reply-to "#reports"
    ```

  </Step>
</Steps>

## Flag

| Flag                          | Descrizione                                                 |
| ----------------------------- | ----------------------------------------------------------- |
| `--message \<text\>`          | Messaggio da inviare (obbligatorio)                         |
| `--to \<dest\>`               | Deriva la chiave di sessione da una destinazione (telefono, chat id) |
| `--agent \<id\>`              | Punta a un agente configurato (usa la sua sessione `main`)  |
| `--session-id \<id\>`         | Riutilizza una sessione esistente tramite ID                |
| `--local`                     | Forza il runtime embedded locale (salta il Gateway)         |
| `--deliver`                   | Invia la risposta a un canale di chat                       |
| `--channel \<name\>`          | Canale di consegna (whatsapp, telegram, discord, slack, ecc.) |
| `--reply-to \<target\>`       | Override della destinazione di consegna                     |
| `--reply-channel \<name\>`    | Override del canale di consegna                             |
| `--reply-account \<id\>`      | Override dell'ID account di consegna                        |
| `--thinking \<level\>`        | Imposta il livello di thinking per il profilo modello selezionato |
| `--verbose \<on\|full\|off\>` | Imposta il livello verbose                                  |
| `--timeout \<seconds\>`       | Sovrascrive il timeout dell'agente                          |
| `--json`                      | Output JSON strutturato                                     |

## Comportamento

- Per impostazione predefinita, la CLI passa **attraverso il Gateway**. Aggiungi `--local` per forzare il
  runtime embedded sulla macchina corrente.
- Se il Gateway non è raggiungibile, la CLI **ripiega** sull'esecuzione embedded locale.
- Selezione della sessione: `--to` deriva la chiave di sessione (le destinazioni di gruppo/canale
  preservano l'isolamento; le chat dirette collassano in `main`).
- I flag thinking e verbose persistono nel negozio della sessione.
- Output: testo semplice per default, oppure `--json` per payload + metadati strutturati.

## Esempi

```bash
# Turno semplice con output JSON
openclaw agent --to +15555550123 --message "Trace logs" --verbose on --json

# Turno con livello di thinking
openclaw agent --session-id 1234 --message "Summarize inbox" --thinking medium

# Consegna a un canale diverso dalla sessione
openclaw agent --agent ops --message "Alert" --deliver --reply-channel telegram --reply-to "@admin"
```

## Correlati

- [Riferimento CLI Agent](/it/cli/agent)
- [Sottoagenti](/it/tools/subagents) — avvio di sottoagenti in background
- [Sessioni](/it/concepts/session) — come funzionano le chiavi di sessione
