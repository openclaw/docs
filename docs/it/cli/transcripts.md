---
read_when:
    - Vuoi leggere i riepiloghi delle trascrizioni archiviate dal terminale
    - Ti serve il percorso di un riepilogo markdown delle trascrizioni
    - Stai eseguendo il debug del layout di archiviazione delle trascrizioni del nucleo
summary: Riferimento CLI per `openclaw transcripts` (elencare, mostrare e individuare le trascrizioni archiviate)
title: CLI delle trascrizioni
x-i18n:
    generated_at: "2026-06-27T17:22:44Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: ae6010cfb4e051182f1c48d0d728b30d054542e1e7983ff15a2432840193f9c0
    source_path: cli/transcripts.md
    workflow: 16
---

# `openclaw transcripts`

Ispeziona le trascrizioni scritte dallo strumento core `transcripts` di OpenClaw. Questa CLI è
di sola lettura; acquisizione, importazione e riepilogo sono gestiti dallo strumento dell'agente e
dalle sorgenti di avvio automatico configurate.

Usa la CLI quando vuoi trovare le note di ieri, aprire il file Markdown in
un editor, passare una trascrizione a un altro strumento o eseguire il debug di dove una sessione è finita su
disco. Non avvia né interrompe l'acquisizione.

Gli artefatti si trovano nella directory di stato di OpenClaw:

```text
$OPENCLAW_STATE_DIR/transcripts/YYYY-MM-DD/<session>/
  metadata.json
  transcript.jsonl
  summary.json
  summary.md
```

La directory di stato predefinita è `~/.openclaw`; imposta `OPENCLAW_STATE_DIR` per usarne una
diversa. La directory della data deriva dall'ora di avvio della sessione, e la
directory della sessione è un segmento filesystem sicuro derivato dall'ID della sessione.

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

- `list`: elenca le sessioni memorizzate, il selettore qualificato per data, l'ora di avvio, il titolo e il percorso di `summary.md`.
- `show <session>`: stampa il `summary.md` memorizzato.
- `path <session>`: stampa il percorso di `summary.md`.
- `path <session> --dir`: stampa la directory della sessione.
- `path <session> --metadata`: stampa `metadata.json`.
- `path <session> --transcript`: stampa `transcript.jsonl`.
- `--json`: stampa output leggibile dalla macchina.

Quando un ID sessione leggibile dall'utente si ripete su più giorni, usa il selettore qualificato per data
da `list`, ad esempio `openclaw transcripts show 2026-05-22/standup`.
Gli ID sessione predefiniti includono un timestamp e un suffisso casuale; configura ID sessione fissi
solo quando sono univoci all'interno della giornata.

## Output

`list` stampa una sessione per riga:

```text
2026-05-22/standup  2026-05-22T09:00:00.000Z  Weekly standup  /Users/alex/.openclaw/transcripts/2026-05-22/standup/summary.md
```

L'output è separato da tabulazioni. Le colonne sono selettore, ora di avvio, titolo e
percorso del riepilogo. Il selettore è il valore più sicuro da passare di nuovo a `show` o `path`.

`list --json` stampa oggetti con:

- `sessionId`
- `selector`
- `date`
- `title`
- `startedAt`
- `stoppedAt`
- `source`
- `path`
- `summaryPath`
- `hasSummary`

`show --json` restituisce i metadati della sessione memorizzati, il selettore, la directory della sessione,
il percorso del riepilogo e il testo Markdown del riepilogo. `path --json` restituisce il percorso selezionato
e indica se quel file esiste.

## Molte riunioni al giorno

Transcripts raggruppa le sessioni per data, poi per ID sessione. Dieci riunioni in un
giorno diventano dieci cartelle sorelle:

```text
~/.openclaw/transcripts/2026-05-22/
  transcript-2026-05-22T09-00-00-000Z-a1b2c3d4/
  transcript-2026-05-22T10-30-00-000Z-b2c3d4e5/
  standup/
```

Usa gli ID generati predefiniti per la maggior parte delle automazioni. Usa un ID fisso come `standup`
solo quando lo stesso ID non verrà usato due volte nella stessa data.

## Riepiloghi mancanti

Le sessioni live scrivono `summary.md` quando la sessione si interrompe. Le trascrizioni importate
scrivono `summary.md` immediatamente dopo l'importazione. Una sessione può comunque comparire in
`list` senza riepilogo quando l'acquisizione è attiva, un provider ha avuto un errore durante l'interruzione,
o i metadati sono stati scritti prima che arrivasse qualsiasi enunciato.

Usa `path <session> --transcript` per ispezionare la trascrizione append-only, e usa
l'azione `summarize` dello strumento `transcripts` per rigenerare il riepilogo Markdown.

## Configurazione

L'acquisizione delle trascrizioni è facoltativa perché le sorgenti live possono unirsi e registrare
l'audio delle riunioni. Abilita lo strumento con `transcripts.enabled` al livello superiore:

```json
{
  "transcripts": {
    "enabled": true,
    "maxUtterances": 2000
  }
}
```

Configura le sorgenti di avvio automatico con `transcripts.autoStart` in `openclaw.json`.
Ogni voce viene abilitata quando è presente; ometti una voce per disabilitare quella sorgente.

```json
{
  "transcripts": {
    "enabled": true,
    "autoStart": [
      {
        "providerId": "discord-voice",
        "guildId": "1234567890",
        "channelId": "2345678901"
      },
      {
        "providerId": "slack-huddle",
        "accountId": "workspace",
        "channelId": "C123"
      }
    ]
  }
}
```
