---
read_when:
    - Vuoi attivare esecuzioni dell'agente da script o dalla riga di comando
    - Hai bisogno di recapitare in modo programmatico le risposte dell'agente a un canale di chat
summary: Esegui turni dell'agente dalla CLI e, facoltativamente, recapita le risposte ai canali
title: Agent Send
x-i18n:
    generated_at: "2026-04-05T14:05:18Z"
    model: gpt-5.4
    provider: openai
    source_hash: 42ea2977e89fb28d2afd07e5f6b1560ad627aea8b72fde36d8e324215c710afc
    source_path: tools/agent-send.md
    workflow: 15
---

# Agent Send

`openclaw agent` esegue un singolo turno dell'agente dalla riga di comando senza richiedere
un messaggio di chat in ingresso. Usalo per flussi di lavoro con script, test e
recapito programmatico.

## Avvio rapido

<Steps>
  <Step title="Esegui un semplice turno dell'agente">
    ```bash
    openclaw agent --message "What is the weather today?"
    ```

    Questo invia il messaggio tramite il Gateway e stampa la risposta.

  </Step>

  <Step title="Scegli come destinazione un agente o una sessione specifici">
    ```bash
    # Scegli come destinazione un agente specifico
    openclaw agent --agent ops --message "Summarize logs"

    # Scegli come destinazione un numero di telefono (deriva la chiave di sessione)
    openclaw agent --to +15555550123 --message "Status update"

    # Riutilizza una sessione esistente
    openclaw agent --session-id abc123 --message "Continue the task"
    ```

  </Step>

  <Step title="Recapita la risposta a un canale">
    ```bash
    # Recapita a WhatsApp (canale predefinito)
    openclaw agent --to +15555550123 --message "Report ready" --deliver

    # Recapita a Slack
    openclaw agent --agent ops --message "Generate report" \
      --deliver --reply-channel slack --reply-to "#reports"
    ```

  </Step>
</Steps>

## Flag

| Flag                          | Descrizione                                                 |
| ----------------------------- | ----------------------------------------------------------- |
| `--message \<text\>`          | Messaggio da inviare (obbligatorio)                         |
| `--to \<dest\>`               | Deriva la chiave di sessione da una destinazione (telefono, id chat) |
| `--agent \<id\>`              | Sceglie come destinazione un agente configurato (usa la sua sessione `main`) |
| `--session-id \<id\>`         | Riutilizza una sessione esistente tramite id                |
| `--local`                     | Forza il runtime incorporato locale (salta il Gateway)      |
| `--deliver`                   | Invia la risposta a un canale di chat                       |
| `--channel \<name\>`          | Canale di recapito (whatsapp, telegram, discord, slack, ecc.) |
| `--reply-to \<target\>`       | Override della destinazione di recapito                     |
| `--reply-channel \<name\>`    | Override del canale di recapito                             |
| `--reply-account \<id\>`      | Override dell'id account di recapito                        |
| `--thinking \<level\>`        | Imposta il livello di thinking (off, minimal, low, medium, high, xhigh) |
| `--verbose \<on\|full\|off\>` | Imposta il livello di dettaglio                             |
| `--timeout \<seconds\>`       | Sostituisce il timeout dell'agente                          |
| `--json`                      | Produce JSON strutturato                                    |

## Comportamento

- Per impostazione predefinita, la CLI passa **attraverso il Gateway**. Aggiungi `--local` per forzare
  il runtime incorporato sulla macchina corrente.
- Se il Gateway non è raggiungibile, la CLI **ripiega** sull'esecuzione incorporata locale.
- Selezione della sessione: `--to` deriva la chiave di sessione (le destinazioni di gruppo/canale
  preservano l'isolamento; le chat dirette confluiscono in `main`).
- I flag thinking e verbose persistono nell'archivio delle sessioni.
- Output: testo semplice per impostazione predefinita, oppure `--json` per payload strutturato + metadati.

## Esempi

```bash
# Turno semplice con output JSON
openclaw agent --to +15555550123 --message "Trace logs" --verbose on --json

# Turno con livello di thinking
openclaw agent --session-id 1234 --message "Summarize inbox" --thinking medium

# Recapita a un canale diverso dalla sessione
openclaw agent --agent ops --message "Alert" --deliver --reply-channel telegram --reply-to "@admin"
```

## Correlati

- [Riferimento CLI dell'agente](/cli/agent)
- [Sotto-agenti](/tools/subagents) — avvio in background di sotto-agenti
- [Sessioni](/it/concepts/session) — come funzionano le chiavi di sessione
