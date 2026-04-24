---
read_when:
    - |-
      Eseguire il debug del motivo per cui un agente ha risposto, fallito o chiamato strumenti in un certo modoે to=final code```
      Eseguire il debug del motivo per cui un agente ha risposto, fallito o chiamato strumenti in un certo modo
      ```
    - |-
      Esportare un bundle di supporto per una sessione OpenClaw【อ่านข้อความเต็ม to=final code```
      Esportare un bundle di supporto per una sessione OpenClaw
      ```
    - |-
      Indagare contesto del prompt, chiamate agli strumenti, errori runtime o metadati di utilizzo	RTLU to=final code```
      Indagare contesto del prompt, chiamate agli strumenti, errori runtime o metadati di utilizzo
      ```
    - |-
      Disabilitare o spostare l’acquisizione della traiettoria to=final code```
      Disabilitare o spostare l’acquisizione della traiettoria
      ```
summary: Esportare bundle di traiettoria redatti per il debug di una sessione agente OpenClaw
title: Bundle di traiettoria
x-i18n:
    generated_at: "2026-04-24T09:08:43Z"
    model: gpt-5.4
    provider: openai
    source_hash: be799691e0c3375efd24e3bec9ce8f9ab22f01a0f8a9ce4288b7e6e952c29da4
    source_path: tools/trajectory.md
    workflow: 15
---

L’acquisizione della traiettoria è il registratore di volo per-sessione di OpenClaw. Registra una
timeline strutturata per ogni esecuzione dell’agente, poi `/export-trajectory` impacchetta la
sessione corrente in un bundle di supporto redatto.

Usalo quando devi rispondere a domande come:

- Quale prompt, prompt di sistema e strumenti sono stati inviati al modello?
- Quali messaggi di trascrizione e chiamate agli strumenti hanno portato a questa risposta?
- L’esecuzione è andata in timeout, è stata interrotta, compattata o ha incontrato un errore del provider?
- Quali modello, Plugin, Skills e impostazioni runtime erano attivi?
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

Puoi scegliere un nome relativo per la directory di output:

```text
/export-trajectory bug-1234
```

Il percorso personalizzato viene risolto dentro `.openclaw/trajectory-exports/`. I
percorsi assoluti e i percorsi `~` vengono rifiutati.

## Accesso

L’esportazione della traiettoria è un comando del proprietario. Il mittente deve superare i normali controlli
di autorizzazione dei comandi e i controlli del proprietario per il canale.

## Cosa viene registrato

L’acquisizione della traiettoria è attiva per impostazione predefinita per le esecuzioni dell’agente OpenClaw.

Gli eventi runtime includono:

- `session.started`
- `trace.metadata`
- `context.compiled`
- `prompt.submitted`
- `model.completed`
- `trace.artifacts`
- `session.ended`

Anche gli eventi della trascrizione vengono ricostruiti dal branch attivo della sessione:

- messaggi utente
- messaggi dell’assistente
- chiamate agli strumenti
- risultati degli strumenti
- Compaction
- cambi di modello
- etichette e voci di sessione personalizzate

Gli eventi vengono scritti come JSON Lines con questo marker di schema:

```json
{
  "traceSchema": "openclaw-trajectory",
  "schemaVersion": 1
}
```

## File del bundle

Un bundle esportato può contenere:

| File                 | Contenuto                                                                                      |
| -------------------- | ---------------------------------------------------------------------------------------------- |
| `manifest.json`      | Schema del bundle, file sorgente, conteggi degli eventi ed elenco dei file generati            |
| `events.jsonl`       | Timeline ordinata di runtime e trascrizione                                                    |
| `session-branch.json`| Branch attivo della trascrizione redatto e intestazione della sessione                         |
| `metadata.json`      | Versione OpenClaw, OS/runtime, modello, snapshot della configurazione, Plugin, Skills e metadati del prompt |
| `artifacts.json`     | Stato finale, errori, utilizzo, prompt cache, conteggio Compaction, testo dell’assistente e metadati degli strumenti |
| `prompts.json`       | Prompt inviati e dettagli selezionati della costruzione del prompt                             |
| `system-prompt.txt`  | Ultimo prompt di sistema compilato, quando acquisito                                           |
| `tools.json`         | Definizioni degli strumenti inviate al modello, quando acquisite                               |

`manifest.json` elenca i file presenti in quel bundle. Alcuni file vengono omessi
quando la sessione non ha acquisito i dati runtime corrispondenti.

## Posizione dell’acquisizione

Per impostazione predefinita, gli eventi della traiettoria runtime vengono scritti accanto al file di sessione:

```text
<session>.trajectory.jsonl
```

OpenClaw scrive anche un file pointer best-effort accanto alla sessione:

```text
<session>.trajectory-path.json
```

Imposta `OPENCLAW_TRAJECTORY_DIR` per memorizzare i sidecar della traiettoria runtime in una
directory dedicata:

```bash
export OPENCLAW_TRAJECTORY_DIR=/var/lib/openclaw/trajectories
```

Quando questa variabile è impostata, OpenClaw scrive in quella directory un file JSONL per ogni session id.

## Disabilitare l’acquisizione

Imposta `OPENCLAW_TRAJECTORY=0` prima di avviare OpenClaw:

```bash
export OPENCLAW_TRAJECTORY=0
```

Questo disabilita l’acquisizione della traiettoria runtime. `/export-trajectory` può comunque esportare
il branch della trascrizione, ma i file solo-runtime come contesto compilato,
artefatti del provider e metadati del prompt potrebbero mancare.

## Privacy e limiti

I bundle di traiettoria sono pensati per supporto e debug, non per pubblicazione pubblica.
OpenClaw redige i valori sensibili prima di scrivere i file di esportazione:

- credenziali e campi payload noti simili a segreti
- dati immagine
- percorsi di stato locali
- percorsi del workspace, sostituiti con `$WORKSPACE_DIR`
- percorsi della home directory, quando rilevati

L’esportatore limita anche la dimensione dell’input:

- file sidecar runtime: 50 MiB
- file di sessione: 50 MiB
- eventi runtime: 200.000
- totale eventi esportati: 250.000
- le singole righe evento runtime vengono troncate sopra 256 KiB

Controlla i bundle prima di condividerli fuori dal tuo team. La redazione è best-effort
e non può conoscere ogni segreto specifico dell’applicazione.

## Risoluzione dei problemi

Se l’esportazione non contiene eventi runtime:

- conferma che OpenClaw sia stato avviato senza `OPENCLAW_TRAJECTORY=0`
- controlla se `OPENCLAW_TRAJECTORY_DIR` punta a una directory scrivibile
- esegui un altro messaggio nella sessione, poi esporta di nuovo
- ispeziona `manifest.json` per `runtimeEventCount`

Se il comando rifiuta il percorso di output:

- usa un nome relativo come `bug-1234`
- non passare `/tmp/...` oppure `~/...`
- mantieni l’esportazione dentro `.openclaw/trajectory-exports/`

Se l’esportazione fallisce con un errore di dimensione, la sessione o il sidecar hanno superato i
limiti di sicurezza dell’esportazione. Avvia una nuova sessione oppure esporta una riproduzione più piccola.

## Correlati

- [Diff](/it/tools/diffs)
- [Gestione delle sessioni](/it/concepts/session)
- [Strumento Exec](/it/tools/exec)
