---
read_when:
    - Analisi del motivo per cui un agente ha risposto, ha fallito o ha chiamato gli strumenti in un determinato modo
    - Esportazione di un pacchetto di supporto per una sessione OpenClaw
    - Analisi del contesto del prompt, delle chiamate agli strumenti, degli errori di runtime o dei metadati di utilizzo
    - Disabilitare o spostare l'acquisizione della traiettoria
summary: Esporta bundle di traiettorie oscurati per il debug di una sessione dell'agente OpenClaw
title: Pacchetti di traiettorie
x-i18n:
    generated_at: "2026-04-30T09:18:27Z"
    model: gpt-5.5
    provider: openai
    source_hash: 8dad01b3662d5e75b7626eb7ed3c3ac2dce4e3a7db2ba5952d7086c721151d1f
    source_path: tools/trajectory.md
    workflow: 16
---

La cattura della traiettoria è il registratore di volo per sessione di OpenClaw. Registra una
timeline strutturata per ogni esecuzione dell’agente, quindi `/export-trajectory` confeziona la
sessione corrente in un bundle di supporto redatto.

Usala quando devi rispondere a domande come:

- Quali prompt, prompt di sistema e strumenti sono stati inviati al modello?
- Quali messaggi della trascrizione e chiamate agli strumenti hanno portato a questa risposta?
- L’esecuzione è andata in timeout, è stata interrotta, ha eseguito una compaction o ha incontrato un errore del provider?
- Quali modello, plugin, Skills e impostazioni di runtime erano attivi?
- Quali metadati di utilizzo e della cache dei prompt ha restituito il provider?

Se stai aprendo una segnalazione di supporto ampia per un problema live del Gateway, inizia con
[`/diagnostics`](/it/gateway/diagnostics#chat-command). Diagnostics raccoglie il
bundle sanitizzato del Gateway e, per le sessioni dell’harness OpenAI Codex, può anche inviare
feedback Codex ai server OpenAI dopo l’approvazione. Usa `/export-trajectory` quando
ti serve nello specifico la timeline dettagliata per sessione di prompt, strumenti e trascrizione.

## Avvio rapido

Invia questo nella sessione attiva:

```text
/export-trajectory
```

Alias:

```text
/trajectory
```

OpenClaw scrive il bundle sotto il workspace:

```text
.openclaw/trajectory-exports/openclaw-trajectory-<session>-<timestamp>/
```

Puoi scegliere il nome di una directory di output relativa:

```text
/export-trajectory bug-1234
```

Il percorso personalizzato viene risolto dentro `.openclaw/trajectory-exports/`. I percorsi assoluti
e i percorsi `~` vengono rifiutati.

I bundle di traiettoria possono contenere prompt, messaggi del modello, schemi degli strumenti, risultati degli strumenti,
eventi di runtime e percorsi locali. Il comando slash della chat passa quindi
attraverso l’approvazione exec ogni volta. Approva l’esportazione una sola volta quando intendi
creare il bundle; non usare allow-all. Nelle chat di gruppo, OpenClaw invia il
prompt di approvazione e il risultato dell’esportazione al proprietario in privato invece di pubblicare i
dettagli della traiettoria nella stanza condivisa.

Per l’ispezione locale o i flussi di supporto, puoi anche eseguire direttamente il percorso del comando
approvato:

```bash
openclaw sessions export-trajectory --session-key "agent:main:telegram:direct:123" --workspace .
```

## Accesso

L’esportazione della traiettoria è un comando del proprietario. Il mittente deve superare i normali controlli di
autorizzazione dei comandi e i controlli del proprietario per il canale.

## Cosa viene registrato

La cattura della traiettoria è attiva per impostazione predefinita per le esecuzioni degli agenti OpenClaw.

Gli eventi di runtime includono:

- `session.started`
- `trace.metadata`
- `context.compiled`
- `prompt.submitted`
- `model.fallback_step`, inclusi il modello sorgente, il modello successivo, motivo/dettaglio dell’errore, posizione nella catena e se il fallback è avanzato, riuscito o ha esaurito la catena
- `model.completed`
- `trace.artifacts`
- `session.ended`

Anche gli eventi della trascrizione vengono ricostruiti dal branch di sessione attivo:

- messaggi utente
- messaggi dell’assistente
- chiamate agli strumenti
- risultati degli strumenti
- compaction
- modifiche del modello
- etichette e voci di sessione personalizzate

Gli eventi sono scritti come JSON Lines con questo marker di schema:

```json
{
  "traceSchema": "openclaw-trajectory",
  "schemaVersion": 1
}
```

## File del bundle

Un bundle esportato può contenere:

| File                  | Contenuti                                                                                       |
| --------------------- | ---------------------------------------------------------------------------------------------- |
| `manifest.json`       | Schema del bundle, file sorgente, conteggi degli eventi ed elenco dei file generati            |
| `events.jsonl`        | Timeline ordinata di runtime e trascrizione                                                     |
| `session-branch.json` | Branch della trascrizione attiva redatto e intestazione della sessione                          |
| `metadata.json`       | Versione di OpenClaw, OS/runtime, modello, snapshot di configurazione, plugin, Skills e metadati dei prompt |
| `artifacts.json`      | Stato finale, errori, utilizzo, cache dei prompt, conteggio delle compaction, testo dell’assistente e metadati degli strumenti |
| `prompts.json`        | Prompt inviati e dettagli selezionati di costruzione dei prompt                                 |
| `system-prompt.txt`   | Ultimo prompt di sistema compilato, quando catturato                                            |
| `tools.json`          | Definizioni degli strumenti inviate al modello, quando catturate                                |

`manifest.json` elenca i file presenti in quel bundle. Alcuni file vengono omessi
quando la sessione non ha catturato i dati di runtime corrispondenti.

## Posizione della cattura

Per impostazione predefinita, gli eventi di traiettoria di runtime vengono scritti accanto al file di sessione:

```text
<session>.trajectory.jsonl
```

OpenClaw scrive anche un file puntatore best-effort accanto alla sessione:

```text
<session>.trajectory-path.json
```

Imposta `OPENCLAW_TRAJECTORY_DIR` per archiviare i sidecar di traiettoria di runtime in una
directory dedicata:

```bash
export OPENCLAW_TRAJECTORY_DIR=/var/lib/openclaw/trajectories
```

Quando questa variabile è impostata, OpenClaw scrive un file JSONL per ogni id di sessione in quella
directory.

La manutenzione delle sessioni rimuove i sidecar di traiettoria quando la voce della sessione proprietaria
viene eliminata, limitata o espulsa dal budget disco delle sessioni. I file di runtime fuori
dalla directory delle sessioni vengono rimossi solo quando il target del puntatore dimostra ancora che
appartiene a quella sessione.

## Disabilitare la cattura

Imposta `OPENCLAW_TRAJECTORY=0` prima di avviare OpenClaw:

```bash
export OPENCLAW_TRAJECTORY=0
```

Questo disabilita la cattura della traiettoria di runtime. `/export-trajectory` può comunque esportare
il branch della trascrizione, ma i file solo di runtime come il contesto compilato,
gli artefatti del provider e i metadati dei prompt potrebbero mancare.

## Privacy e limiti

I bundle di traiettoria sono progettati per supporto e debug, non per la pubblicazione pubblica.
OpenClaw redige i valori sensibili prima di scrivere i file di esportazione:

- credenziali e campi di payload noti simili a segreti
- dati immagine
- percorsi dello stato locale
- percorsi del workspace, sostituiti con `$WORKSPACE_DIR`
- percorsi della home directory, quando rilevati

L’esportatore limita anche la dimensione dell’input:

- file sidecar di runtime: 50 MiB
- file di sessione: 50 MiB
- eventi di runtime: 200.000
- eventi esportati totali: 250.000
- le singole righe degli eventi di runtime vengono troncate oltre 256 KiB

Rivedi i bundle prima di condividerli fuori dal tuo team. La redazione è best-effort
e non può conoscere ogni segreto specifico dell’applicazione.

## Risoluzione dei problemi

Se l’esportazione non contiene eventi di runtime:

- conferma che OpenClaw sia stato avviato senza `OPENCLAW_TRAJECTORY=0`
- controlla se `OPENCLAW_TRAJECTORY_DIR` punta a una directory scrivibile
- esegui un altro messaggio nella sessione, quindi esporta di nuovo
- ispeziona `manifest.json` per `runtimeEventCount`

Se il comando rifiuta il percorso di output:

- usa un nome relativo come `bug-1234`
- non passare `/tmp/...` o `~/...`
- mantieni l’esportazione dentro `.openclaw/trajectory-exports/`

Se l’esportazione fallisce con un errore di dimensione, la sessione o il sidecar ha superato i
limiti di sicurezza dell’esportazione. Avvia una nuova sessione o esporta una riproduzione più piccola.

## Correlati

- [Diff](/it/tools/diffs)
- [Gestione delle sessioni](/it/concepts/session)
- [Strumento exec](/it/tools/exec)
