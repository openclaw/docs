---
read_when:
    - Vuoi attivare esecuzioni dell'agente da script o dalla riga di comando
    - È necessario recapitare programmaticamente le risposte degli agenti a un canale di chat
summary: Esegui i turni dell'agente dalla CLI e, facoltativamente, recapita le risposte ai canali
title: Invio dell’agente
x-i18n:
    generated_at: "2026-05-06T09:09:54Z"
    model: gpt-5.5
    provider: openai
    source_hash: 1339ebd74e2349669942ff93f200b53a69ad05f2186d6ff76437c779f312a291
    source_path: tools/agent-send.md
    workflow: 16
---

`openclaw agent` esegue un singolo turno agente dalla riga di comando senza bisogno
di un messaggio di chat in ingresso. Usalo per workflow con script, test e
consegna programmatica.

## Avvio rapido

<Steps>
  <Step title="Esegui un semplice turno agente">
    ```bash
    openclaw agent --message "What is the weather today?"
    ```

    Questo invia il messaggio tramite il Gateway e stampa la risposta.

  </Step>

  <Step title="Indirizza a un agente o a una sessione specifica">
    ```bash
    # Target a specific agent
    openclaw agent --agent ops --message "Summarize logs"

    # Target a phone number (derives session key)
    openclaw agent --to +15555550123 --message "Status update"

    # Reuse an existing session
    openclaw agent --session-id abc123 --message "Continue the task"
    ```

  </Step>

  <Step title="Consegna la risposta a un canale">
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
| `--to \<dest\>`               | Deriva la chiave di sessione da una destinazione (telefono, chat id) |
| `--agent \<id\>`              | Indirizza a un agente configurato (usa la sua sessione `main`) |
| `--session-id \<id\>`         | Riutilizza una sessione esistente per id                    |
| `--local`                     | Forza il runtime incorporato locale (salta il Gateway)      |
| `--deliver`                   | Invia la risposta a un canale di chat                       |
| `--channel \<name\>`          | Canale di consegna (whatsapp, telegram, discord, slack, ecc.) |
| `--reply-to \<target\>`       | Override della destinazione di consegna                     |
| `--reply-channel \<name\>`    | Override del canale di consegna                             |
| `--reply-account \<id\>`      | Override dell'id dell'account di consegna                   |
| `--thinking \<level\>`        | Imposta il livello di ragionamento per il profilo modello selezionato |
| `--verbose \<on\|full\|off\>` | Imposta il livello verbose                                  |
| `--timeout \<seconds\>`       | Override del timeout dell'agente                            |
| `--json`                      | Restituisce JSON strutturato                                |

## Comportamento

- Per impostazione predefinita, la CLI passa **tramite il Gateway**. Aggiungi `--local` per forzare il
  runtime incorporato sulla macchina corrente.
- Se il Gateway non è raggiungibile, la CLI **ripiega** sull'esecuzione incorporata locale.
- Selezione della sessione: `--to` deriva la chiave di sessione (i target di gruppo/canale
  preservano l'isolamento; le chat dirette convergono su `main`).
- I flag thinking e verbose persistono nell'archivio delle sessioni.
- Output: testo semplice per impostazione predefinita, oppure `--json` per payload strutturato + metadati.

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
  <Card title="Riferimento CLI agente" href="/it/cli/agent" icon="terminal">
    Riferimento completo a flag e opzioni di `openclaw agent`.
  </Card>
  <Card title="Sotto-agenti" href="/it/tools/subagents" icon="users">
    Creazione di sotto-agenti in background.
  </Card>
  <Card title="Sessioni" href="/it/concepts/session" icon="comments">
    Come funzionano le chiavi di sessione e come `--to`, `--agent` e `--session-id` le risolvono.
  </Card>
  <Card title="Comandi slash" href="/it/tools/slash-commands" icon="slash">
    Catalogo comandi nativo usato nelle sessioni agente.
  </Card>
</CardGroup>
