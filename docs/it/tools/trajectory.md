---
read_when:
    - Fare debug del motivo per cui un agente ha risposto, fallito o chiamato strumenti in un certo modo
    - Esportare un bundle di supporto per una sessione OpenClaw
    - Analizzare contesto del prompt, chiamate agli strumenti, errori runtime o metadati di utilizzo
    - Disabilitare o spostare la cattura della traiettoria
summary: Esportare bundle di traiettoria redatti per il debug di una sessione agente OpenClaw
title: Bundle di traiettoria
x-i18n:
    generated_at: "2026-04-23T08:37:57Z"
    model: gpt-5.4
    provider: openai
    source_hash: 18f18c9b0a57fcc85624ae8592778447f61ffbd2aa455f8f92893955af744b23
    source_path: tools/trajectory.md
    workflow: 15
---

# Bundle di traiettoria

La cattura della traiettoria è il flight recorder per sessione di OpenClaw. Registra una
timeline strutturata per ogni esecuzione dell'agente, poi `/export-trajectory` impacchetta la
sessione corrente in un bundle di supporto redatto.

Usalo quando devi rispondere a domande come:

- Quale prompt, prompt di sistema e strumenti sono stati inviati al modello?
- Quali messaggi della trascrizione e chiamate agli strumenti hanno portato a questa risposta?
- L'esecuzione è andata in timeout, è stata interrotta, ha fatto Compaction o ha incontrato un errore del provider?
- Quali modello, plugin, Skills e impostazioni runtime erano attivi?
- Quali metadati di utilizzo e prompt-cache ha restituito il provider?

## Avvio rapido

Invia questo nella sessione attiva:

```text
/export-trajectory
```

Alias:

```text
/trajectory
```

OpenClaw scrive il bundle nel workspace:

```text
.openclaw/trajectory-exports/openclaw-trajectory-<session>-<timestamp>/
```

Puoi scegliere un nome di directory di output relativo:

```text
/export-trajectory bug-1234
```

Il percorso personalizzato viene risolto dentro `.openclaw/trajectory-exports/`. I
percorsi assoluti e i percorsi `~` vengono rifiutati.

## Accesso

L'export della traiettoria è un comando del proprietario. Il mittente deve superare i normali controlli
di autorizzazione del comando e i controlli del proprietario per il canale.

## Cosa viene registrato

La cattura della traiettoria è attiva per impostazione predefinita per le esecuzioni degli agenti OpenClaw.

Gli eventi runtime includono:

- `session.started`
- `trace.metadata`
- `context.compiled`
- `prompt.submitted`
- `model.completed`
- `trace.artifacts`
- `session.ended`

Gli eventi della trascrizione vengono anche ricostruiti dal branch della sessione attiva:

- messaggi utente
- messaggi dell'assistente
- chiamate agli strumenti
- risultati degli strumenti
- Compaction
- cambi di modello
- etichette e voci di sessione personalizzate

Gli eventi vengono scritti come JSON Lines con questo marcatore di schema:

```json
{
  "traceSchema": "openclaw-trajectory",
  "schemaVersion": 1
}
```

## File del bundle

Un bundle esportato può contenere:

| File                  | Contenuto                                                                                      |
| --------------------- | ---------------------------------------------------------------------------------------------- |
| `manifest.json`       | Schema del bundle, file sorgente, conteggio eventi ed elenco dei file generati                |
| `events.jsonl`        | Timeline ordinata di runtime e trascrizione                                                    |
| `session-branch.json` | Branch attivo della trascrizione redatto e header della sessione                               |
| `metadata.json`       | Versione OpenClaw, OS/runtime, modello, snapshot della config, plugin, Skills e metadati del prompt |
| `artifacts.json`      | Stato finale, errori, utilizzo, prompt cache, conteggio Compaction, testo dell'assistente e metadati degli strumenti |
| `prompts.json`        | Prompt inviati e dettagli selezionati della costruzione del prompt                             |
| `system-prompt.txt`   | Ultimo prompt di sistema compilato, quando catturato                                           |
| `tools.json`          | Definizioni degli strumenti inviate al modello, quando catturate                              |

`manifest.json` elenca i file presenti in quel bundle. Alcuni file vengono omessi
quando la sessione non ha catturato i corrispondenti dati runtime.

## Posizione della cattura

Per impostazione predefinita, gli eventi runtime della traiettoria vengono scritti accanto al file della sessione:

```text
<session>.trajectory.jsonl
```

OpenClaw scrive anche un file puntatore best-effort accanto alla sessione:

```text
<session>.trajectory-path.json
```

Imposta `OPENCLAW_TRAJECTORY_DIR` per memorizzare i sidecar runtime della traiettoria in una
directory dedicata:

```bash
export OPENCLAW_TRAJECTORY_DIR=/var/lib/openclaw/trajectories
```

Quando questa variabile è impostata, OpenClaw scrive un file JSONL per ogni id sessione in quella
directory.

## Disabilitare la cattura

Imposta `OPENCLAW_TRAJECTORY=0` prima di avviare OpenClaw:

```bash
export OPENCLAW_TRAJECTORY=0
```

Questo disabilita la cattura runtime della traiettoria. `/export-trajectory` può comunque esportare
il branch della trascrizione, ma i file solo runtime come contesto compilato,
artefatti del provider e metadati del prompt potrebbero mancare.

## Privacy e limiti

I bundle di traiettoria sono progettati per supporto e debug, non per pubblicazione pubblica.
OpenClaw redige i valori sensibili prima di scrivere i file di export:

- credenziali e campi di payload noti simili a secret
- dati immagine
- percorsi dello stato locale
- percorsi del workspace, sostituiti con `$WORKSPACE_DIR`
- percorsi della home directory, quando rilevati

L'exporter limita anche la dimensione dell'input:

- file sidecar runtime: 50 MiB
- file di sessione: 50 MiB
- eventi runtime: 200.000
- eventi totali esportati: 250.000
- le singole righe degli eventi runtime vengono troncate oltre 256 KiB

Rivedi i bundle prima di condividerli fuori dal tuo team. La redazione è best-effort
e non può conoscere ogni secret specifico dell'applicazione.

## Risoluzione dei problemi

Se l'export non ha eventi runtime:

- conferma che OpenClaw sia stato avviato senza `OPENCLAW_TRAJECTORY=0`
- controlla se `OPENCLAW_TRAJECTORY_DIR` punta a una directory scrivibile
- esegui un altro messaggio nella sessione, poi esporta di nuovo
- ispeziona `manifest.json` per `runtimeEventCount`

Se il comando rifiuta il percorso di output:

- usa un nome relativo come `bug-1234`
- non passare `/tmp/...` o `~/...`
- mantieni l'export dentro `.openclaw/trajectory-exports/`

Se l'export fallisce con un errore di dimensione, la sessione o il sidecar ha superato i
limiti di sicurezza dell'export. Avvia una nuova sessione o esporta una riproduzione più piccola.
