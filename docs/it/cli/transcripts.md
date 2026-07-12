---
read_when:
    - Vuoi leggere dal terminale i riepiloghi delle trascrizioni archiviate
    - Ti serve il percorso di un riepilogo Markdown delle trascrizioni
    - Stai eseguendo il debug della struttura di archiviazione delle trascrizioni principali
summary: Riferimento della CLI per `openclaw transcripts` (elencare, mostrare e individuare le trascrizioni archiviate)
title: CLI delle trascrizioni
x-i18n:
    generated_at: "2026-07-12T06:57:39Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: dde02e924339c64cf6acd5c4b6162785dcfccf4a1df2aac0d9d52d5306511579
    source_path: cli/transcripts.md
    workflow: 16
---

# `openclaw transcripts`

Strumento di ispezione in sola lettura per le trascrizioni scritte dallo strumento agente `transcripts`.
L'acquisizione, l'importazione e la riepilogazione vengono eseguite tramite tale strumento, non tramite questa CLI.

Gli artefatti si trovano nella directory di stato:

```text
$OPENCLAW_STATE_DIR/transcripts/YYYY-MM-DD/<session>/
  metadata.json
  transcript.jsonl
  summary.json
  summary.md
```

La directory di stato predefinita è `~/.openclaw`; è possibile sovrascriverla con `OPENCLAW_STATE_DIR`.
La directory della data deriva dall'ora di inizio della sessione; la directory della sessione è
uno slug sicuro per il file system derivato dall'id della sessione.

## Comandi

```bash
openclaw transcripts list
openclaw transcripts show <session>
openclaw transcripts show YYYY-MM-DD/<session>
openclaw transcripts path <session>
openclaw transcripts path YYYY-MM-DD/<session>
openclaw transcripts path <session> --dir
openclaw transcripts path <session> --metadata
openclaw transcripts path <session> --transcript
openclaw transcripts list --json
openclaw transcripts show <session> --json
openclaw transcripts path <session> --json
```

| Comando                       | Descrizione                                                   |
| ----------------------------- | ------------------------------------------------------------- |
| `list`                        | Elenca le sessioni archiviate.                                |
| `show <session>`              | Stampa il file `summary.md` archiviato.                        |
| `path <session>`              | Stampa il percorso di `summary.md`.                            |
| `path <session> --dir`        | Stampa la directory della sessione.                            |
| `path <session> --metadata`   | Stampa `metadata.json`.                                        |
| `path <session> --transcript` | Stampa `transcript.jsonl`.                                     |
| `--json`                      | Stampa un output leggibile dalla macchina (qualsiasi sottocomando). |

`<session>` accetta un id di sessione semplice oppure un selettore qualificato con la data
(`YYYY-MM-DD/<session>`). Utilizzare la forma qualificata quando lo stesso id di sessione
ricorre in più giorni, ad esempio `openclaw transcripts show
2026-05-22/standup`. Gli id di sessione predefiniti includono un timestamp e un suffisso
casuale; assegnare a una sessione un id fisso solo quando tale id è univoco nella giornata.

## Output

`list` stampa una riga separata da tabulazioni per ogni sessione: selettore, ora di inizio, titolo,
percorso del riepilogo.

```text
2026-05-22/standup  2026-05-22T09:00:00.000Z  Riunione settimanale  /Users/user/.openclaw/transcripts/2026-05-22/standup/summary.md
```

Il selettore è il valore più sicuro da passare nuovamente a `show` o `path`.

`list --json` restituisce oggetti con `sessionId`, `selector`, `date`, `title`,
`startedAt`, `stoppedAt`, `source`, `path`, `summaryPath`, `hasSummary`.

`show --json` restituisce i metadati della sessione archiviata, il selettore, la directory
della sessione, il percorso del riepilogo e il testo Markdown del riepilogo.

`path --json` restituisce il percorso selezionato e indica se il file esiste.

## Più sessioni al giorno

Le sessioni vengono raggruppate prima per data e poi per id di sessione. Dieci riunioni in un giorno diventano
dieci cartelle allo stesso livello:

```text
~/.openclaw/transcripts/2026-05-22/
  transcript-2026-05-22T09-00-00-000Z-a1b2c3d4/
  transcript-2026-05-22T10-30-00-000Z-b2c3d4e5/
  standup/
```

Utilizzare gli id generati per impostazione predefinita per l'automazione. Utilizzare un id fisso come `standup` solo
quando non verrà ripetuto nella stessa data.

## Riepiloghi mancanti

Le sessioni live scrivono `summary.md` quando la sessione termina; le trascrizioni importate
lo scrivono subito dopo l'importazione. Una sessione può comparire in `list` senza un
riepilogo mentre l'acquisizione è ancora attiva, se un provider ha generato un errore durante l'arresto oppure se
i metadati sono stati scritti prima dell'arrivo di qualsiasi intervento.

Utilizzare `path <session> --transcript` per esaminare la trascrizione grezza in sola aggiunta,
oppure eseguire l'azione `summarize` dello strumento `transcripts` per rigenerare il riepilogo
Markdown.

## Configurazione

L'acquisizione richiede l'adesione esplicita (le sorgenti live possono partecipare e registrare l'audio della riunione). Abilitarla
con:

```json
{
  "transcripts": {
    "enabled": true,
    "maxUtterances": 2000
  }
}
```

- `enabled` (valore predefinito `false`): attiva lo strumento.
- `maxUtterances` (valore predefinito `2000`, limitato all'intervallo 1-10000): dimensione del buffer degli interventi per
  sessione.

Configurare le sorgenti con avvio automatico tramite `transcripts.autoStart`. Ogni voce viene
abilitata quando è presente; omettere una voce per disabilitare la sorgente corrispondente. `discord-voice`
è la sorgente inclusa che supporta l'avvio automatico e richiede `guildId` e
`channelId`:

```json
{
  "transcripts": {
    "enabled": true,
    "autoStart": [
      {
        "providerId": "discord-voice",
        "guildId": "1234567890",
        "channelId": "2345678901"
      }
    ]
  }
}
```
