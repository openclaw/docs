---
read_when:
    - Vuoi attivare esecuzioni dell'agente da script o dalla riga di comando
    - Devi inviare le risposte dell'agente a un canale di chat in modo programmatico
summary: Esegui turni dell'agente dalla CLI e, facoltativamente, recapita le risposte ai canali
title: Invio dell'agente
x-i18n:
    generated_at: "2026-05-10T19:52:58Z"
    model: gpt-5.5
    provider: openai
    source_hash: a2e1b05414312321e7136867bb8b998754d4a46289cc02764eb61d83f7239af1
    source_path: tools/agent-send.md
    workflow: 16
---

`openclaw agent` esegue un singolo turno dell'agente dalla riga di comando senza richiedere
un messaggio di chat in ingresso. Usalo per workflow con script, test e
consegna programmatica.

## Avvio rapido

<Steps>
  <Step title="Run a simple agent turn">
    ```bash
    openclaw agent --message "What is the weather today?"
    ```

    Questo invia il messaggio tramite il Gateway e stampa la risposta.

  </Step>

  <Step title="Target a specific agent or session">
    ```bash
    # Target a specific agent
    openclaw agent --agent ops --message "Summarize logs"

    # Target a phone number (derives session key)
    openclaw agent --to +15555550123 --message "Status update"

    # Reuse an existing session
    openclaw agent --session-id abc123 --message "Continue the task"
    ```

  </Step>

  <Step title="Deliver the reply to a channel">
    ```bash
    # Deliver to WhatsApp (default channel)
    openclaw agent --to +15555550123 --message "Report ready" --deliver

    # Deliver to Slack
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
| `--agent \<id\>`              | Indirizza un agente configurato (usa la sua sessione `main`) |
| `--session-id \<id\>`         | Riutilizza una sessione esistente per id                    |
| `--local`                     | Forza il runtime incorporato locale (salta il Gateway)      |
| `--deliver`                   | Invia la risposta a un canale di chat                       |
| `--channel \<name\>`          | Canale di consegna (whatsapp, telegram, discord, slack, ecc.) |
| `--reply-to \<target\>`       | Override della destinazione di consegna                     |
| `--reply-channel \<name\>`    | Override del canale di consegna                             |
| `--reply-account \<id\>`      | Override dell'id account di consegna                        |
| `--thinking \<level\>`        | Imposta il livello di ragionamento per il profilo modello selezionato |
| `--verbose \<on\|full\|off\>` | Imposta il livello di verbosità                             |
| `--timeout \<seconds\>`       | Override del timeout dell'agente                            |
| `--json`                      | Restituisce JSON strutturato                                |

## Comportamento

- Per impostazione predefinita, la CLI passa **tramite il Gateway**. Aggiungi `--local` per forzare il
  runtime incorporato sulla macchina corrente.
- Se il Gateway non è raggiungibile, la CLI **ripiega** sull'esecuzione incorporata locale.
- Selezione della sessione: `--to` deriva la chiave di sessione (i target di gruppo/canale
  preservano l'isolamento; le chat dirette convergono su `main`).
- I flag di ragionamento e verbosità persistono nello store delle sessioni.
- Output: testo normale per impostazione predefinita, oppure `--json` per payload + metadati strutturati.
- Con `--json --deliver`, il JSON include lo stato di consegna per invii
  riusciti, soppressi, parziali e non riusciti. Vedi
  [stato di consegna JSON](/it/cli/agent#json-delivery-status).

## Esempi

```bash
# Simple turn with JSON output
openclaw agent --to +15555550123 --message "Trace logs" --verbose on --json

# Turn with thinking level
openclaw agent --session-id 1234 --message "Summarize inbox" --thinking medium

# Deliver to a different channel than the session
openclaw agent --agent ops --message "Alert" --deliver --reply-channel telegram --reply-to "@admin"
```

## Correlati

<CardGroup cols={2}>
  <Card title="Agent CLI reference" href="/it/cli/agent" icon="terminal">
    Riferimento completo per flag e opzioni di `openclaw agent`.
  </Card>
  <Card title="Sub-agents" href="/it/tools/subagents" icon="users">
    Avvio di sotto-agenti in background.
  </Card>
  <Card title="Sessions" href="/it/concepts/session" icon="comments">
    Come funzionano le chiavi di sessione e come `--to`, `--agent` e `--session-id` le risolvono.
  </Card>
  <Card title="Slash commands" href="/it/tools/slash-commands" icon="slash">
    Catalogo dei comandi nativi usati nelle sessioni degli agenti.
  </Card>
</CardGroup>
