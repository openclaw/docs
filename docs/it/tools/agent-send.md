---
read_when:
    - Vuoi attivare esecuzioni dell'agente da script o dalla riga di comando
    - Devi inviare le risposte dell'agente a un canale di chat in modo programmatico
summary: Esegui turni agente dalla CLI e, facoltativamente, recapita le risposte ai canali
title: Invio agente
x-i18n:
    generated_at: "2026-06-27T18:17:41Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 25026258a5a47c87fbf99689de5ea16d827b11af07bc5ce4f6c3e2bda6466b46
    source_path: tools/agent-send.md
    workflow: 16
---

`openclaw agent` esegue un singolo turno dell'agente dalla riga di comando senza richiedere
un messaggio di chat in ingresso. Usalo per workflow con script, test e
consegna programmatica.

## Avvio rapido

<Steps>
  <Step title="Esegui un semplice turno dell'agente">
    ```bash
    openclaw agent --agent main --message "What is the weather today?"
    ```

    Questo invia il messaggio tramite il Gateway e stampa la risposta.

  </Step>

  <Step title="Invia un prompt multilinea da un file">
    ```bash
    openclaw agent --agent ops --message-file ./task.md
    ```

    Questo legge un file UTF-8 valido come corpo del messaggio dell'agente.

  </Step>

  <Step title="Indirizza a un agente o una sessione specifici">
    ```bash
    # Target a specific agent
    openclaw agent --agent ops --message "Summarize logs"

    # Target a phone number (derives session key)
    openclaw agent --to +15555550123 --message "Status update"

    # Reuse an existing session
    openclaw agent --session-id abc123 --message "Continue the task"

    # Target an exact session key
    openclaw agent --session-key agent:ops:incident-42 --message "Summarize status"
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

## Opzioni

| Opzione                       | Descrizione                                                 |
| ----------------------------- | ----------------------------------------------------------- |
| `--message \<text\>`          | Messaggio inline da inviare                                 |
| `--message-file \<path\>`     | Legge il messaggio da un file UTF-8 valido                  |
| `--to \<dest\>`               | Deriva la chiave di sessione da una destinazione (telefono, id chat) |
| `--session-key \<key\>`       | Usa una chiave di sessione esplicita                        |
| `--agent \<id\>`              | Indirizza a un agente configurato (usa la sua sessione `main`) |
| `--session-id \<id\>`         | Riutilizza una sessione esistente tramite id                |
| `--local`                     | Forza il runtime incorporato locale (salta il Gateway)      |
| `--deliver`                   | Invia la risposta a un canale di chat                       |
| `--channel \<name\>`          | Canale di consegna (whatsapp, telegram, discord, slack, ecc.) |
| `--reply-to \<target\>`       | Override della destinazione di consegna                     |
| `--reply-channel \<name\>`    | Override del canale di consegna                             |
| `--reply-account \<id\>`      | Override dell'id dell'account di consegna                   |
| `--thinking \<level\>`        | Imposta il livello di ragionamento per il profilo modello selezionato |
| `--verbose \<on\|full\|off\>` | Imposta il livello di verbosità                             |
| `--timeout \<seconds\>`       | Esegue l'override del timeout dell'agente                   |
| `--json`                      | Produce JSON strutturato                                    |

## Comportamento

- Per impostazione predefinita, la CLI passa **tramite il Gateway**. Aggiungi `--local` per forzare il
  runtime incorporato sulla macchina corrente.
- Passa esattamente uno tra `--message` e `--message-file`. I messaggi da file preservano
  il contenuto multilinea dopo la rimozione di un BOM UTF-8 opzionale.
- Se il Gateway non è raggiungibile, la CLI **ripiega** sull'esecuzione incorporata locale.
- Selezione della sessione: `--to` deriva la chiave di sessione (le destinazioni gruppo/canale
  preservano l'isolamento; le chat dirette convergono su `main`).
- `--session-key` seleziona una chiave esplicita. Le chiavi con prefisso agente devono usare
  `agent:<agent-id>:<session-key>` e `--agent` deve corrispondere a quell'id agente quando
  entrambi sono forniti. Le chiavi bare non sentinel vengono collocate nell'ambito di `--agent` quando
  fornito; per esempio, `--agent ops --session-key incident-42` instrada a
  `agent:ops:incident-42`. Senza `--agent`, le chiavi bare non sentinel vengono collocate nell'ambito
  dell'agente predefinito configurato. I letterali `global` e `unknown` restano
  senza ambito solo quando non viene fornito `--agent`; in quel caso, il fallback incorporato
  e la proprietà dello store usano l'agente predefinito configurato.
- Le opzioni di ragionamento e verbosità persistono nello store della sessione.
- Output: testo semplice per impostazione predefinita, oppure `--json` per payload + metadati strutturati.
- Con `--json --deliver`, il JSON include lo stato di consegna per invii
  inviati, soppressi, parziali e non riusciti. Vedi
  [stato di consegna JSON](/it/cli/agent#json-delivery-status).

## Esempi

```bash
# Simple turn with JSON output
openclaw agent --to +15555550123 --message "Trace logs" --verbose on --json

# Turn with thinking level
openclaw agent --session-id 1234 --message "Summarize inbox" --thinking medium

# Multiline prompt from a file
openclaw agent --agent ops --message-file ./task.md

# Exact session key
openclaw agent --session-key agent:ops:incident-42 --message "Summarize status"

# Legacy key scoped to an agent
openclaw agent --agent ops --session-key incident-42 --message "Summarize status"

# Deliver to a different channel than the session
openclaw agent --agent ops --message "Alert" --deliver --reply-channel telegram --reply-to "@admin"
```

## Correlati

<CardGroup cols={2}>
  <Card title="Riferimento CLI dell'agente" href="/it/cli/agent" icon="terminal">
    Riferimento completo alle opzioni e ai flag di `openclaw agent`.
  </Card>
  <Card title="Sottoagenti" href="/it/tools/subagents" icon="users">
    Avvio di sottoagenti in background.
  </Card>
  <Card title="Sessioni" href="/it/concepts/session" icon="comments">
    Come funzionano le chiavi di sessione e come `--to`, `--agent` e `--session-id` le risolvono.
  </Card>
  <Card title="Comandi slash" href="/it/tools/slash-commands" icon="slash">
    Catalogo di comandi nativi usato all'interno delle sessioni dell'agente.
  </Card>
</CardGroup>
