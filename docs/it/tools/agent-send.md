---
read_when:
    - Vuoi avviare esecuzioni dell'agente da script o dalla riga di comando
    - Devi inviare programmaticamente le risposte dell'agente a un canale di chat
summary: Esegui i turni dell'agente dalla CLI e, facoltativamente, invia le risposte ai canali
title: Invio dell’agente
x-i18n:
    generated_at: "2026-07-12T07:35:34Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 23ad57735bd43a2bba5add571e9572da0fbe7b516a70515c674e1ababaab081a
    source_path: tools/agent-send.md
    workflow: 16
---

`openclaw agent` esegue un singolo turno dell'agente dalla riga di comando senza un
messaggio di chat in entrata. Usalo per flussi di lavoro con script, test e
consegna programmatica. Riferimento completo su flag e comportamento:
[Riferimento della CLI dell'agente](/it/cli/agent).

## Avvio rapido

<Steps>
  <Step title="Esegui un semplice turno dell'agente">
    ```bash
    openclaw agent --agent main --message "What is the weather today?"
    ```

    Invia il messaggio tramite il Gateway e stampa la risposta.

  </Step>

  <Step title="Invia un prompt su più righe da un file">
    ```bash
    openclaw agent --agent ops --message-file ./task.md
    ```

    Legge un file UTF-8 valido come corpo del messaggio dell'agente.

  </Step>

  <Step title="Specifica un agente o una sessione">
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

## Flag

| Flag                        | Descrizione                                                          |
| --------------------------- | -------------------------------------------------------------------- |
| `--message <text>`          | Messaggio in linea da inviare                                        |
| `--message-file <path>`     | Legge il messaggio da un file UTF-8 valido                           |
| `--to <dest>`               | Deriva la chiave di sessione da una destinazione (telefono, ID chat) |
| `--session-key <key>`       | Usa una chiave di sessione esplicita                                 |
| `--agent <id>`              | Specifica un agente configurato (usa la sua sessione `main`)         |
| `--session-id <id>`         | Riutilizza una sessione esistente tramite ID                         |
| `--model <id>`              | Sostituisce il modello per questa esecuzione (`provider/model` o ID modello) |
| `--local`                   | Forza il runtime incorporato locale (ignora il Gateway)              |
| `--deliver`                 | Invia la risposta a un canale di chat                                |
| `--channel <name>`          | Canale di consegna; con `--agent` + `--to`, si applica anche all'ambito dei messaggi diretti |
| `--reply-to <target>`       | Sostituisce la destinazione di consegna                              |
| `--reply-channel <name>`    | Sostituisce il canale di consegna                                    |
| `--reply-account <id>`      | Sostituisce l'ID dell'account di consegna                            |
| `--thinking <level>`        | Imposta il livello di ragionamento per il profilo del modello selezionato |
| `--verbose <on\|full\|off>` | Mantiene il livello di verbosità per la sessione (`full` registra anche l'output degli strumenti) |
| `--timeout <seconds>`       | Sostituisce il timeout dell'agente (valore predefinito: 600 o valore di configurazione) |
| `--json`                    | Produce JSON strutturato                                             |

## Comportamento

- Per impostazione predefinita, la CLI passa **attraverso il Gateway**. Aggiungi `--local` per forzare il
  runtime incorporato sulla macchina corrente.
- Passa esattamente uno tra `--message` e `--message-file`. I messaggi da file conservano
  il contenuto su più righe dopo la rimozione di un BOM UTF-8 facoltativo.
- Se la richiesta al Gateway non riesce, la CLI **ripiega** sull'esecuzione
  incorporata locale; in caso di timeout del Gateway, ripiega usando una nuova sessione anziché eseguire
  in parallelo con la trascrizione originale.
- Selezione della sessione: `--to` deriva la chiave di sessione (le destinazioni di
  gruppo/canale mantengono l'isolamento; le chat dirette confluiscono in `main`). Quando `--agent`,
  `--channel` e `--to` sono usati insieme, l'instradamento segue il destinatario canonico
  del canale e `session.dmScope`. Le identità stabili utilizzate solo per l'invio usano una
  sessione gestita dal provider, isolata dalla sessione principale dell'agente.
- `--session-key` seleziona una chiave esplicita. Le chiavi con prefisso dell'agente devono usare
  `agent:<agent-id>:<session-key>` e, quando sono specificati entrambi, `--agent` deve corrispondere
  a tale ID agente. Le chiavi semplici che non sono sentinelle vengono associate a `--agent`, se
  specificato; ad esempio, `--agent ops --session-key incident-42` viene instradato a
  `agent:ops:incident-42`. Senza `--agent`, le chiavi semplici che non sono sentinelle vengono associate
  all'agente predefinito configurato. I valori letterali `global` e `unknown` rimangono
  senza ambito solo quando `--agent` non è specificato; il percorso di ripiego incorporato
  risolve tali sessioni sentinella nell'agente predefinito configurato.
- `--reply-channel` e `--reply-account` influiscono solo sulla consegna.
- I flag di ragionamento e verbosità vengono mantenuti nell'archivio della sessione.
- Output: testo normale per impostazione predefinita oppure `--json` per payload strutturato e metadati.
- Con `--json --deliver`, il JSON include lo stato di consegna per gli invii
  effettuati, soppressi, parziali e non riusciti. Consulta
  [Stato di consegna JSON](/it/cli/agent#json-delivery-status).

## Esempi

```bash
# Simple turn with JSON output
openclaw agent --to +15555550123 --message "Trace logs" --verbose on --json

# Turn with a model override
openclaw agent --agent ops --model openai/gpt-5.4 --message "Summarize logs"

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

## Argomenti correlati

<CardGroup cols={2}>
  <Card title="Riferimento della CLI dell'agente" href="/it/cli/agent" icon="terminal">
    Riferimento completo dei flag e delle opzioni di `openclaw agent`.
  </Card>
  <Card title="Sottoagenti" href="/it/tools/subagents" icon="users">
    Avvio di sottoagenti in background.
  </Card>
  <Card title="Sessioni" href="/it/concepts/session" icon="comments">
    Funzionamento delle chiavi di sessione e modalità con cui `--to`, `--agent` e `--session-id` le risolvono.
  </Card>
  <Card title="Comandi slash" href="/it/tools/slash-commands" icon="slash">
    Catalogo dei comandi nativi utilizzati nelle sessioni dell'agente.
  </Card>
</CardGroup>
