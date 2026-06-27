---
read_when:
    - Debug del motivo per cui un agente ha risposto, ha avuto esito negativo o ha chiamato strumenti in un certo modo
    - Esportazione di un bundle di supporto per una sessione OpenClaw
    - Indagine su contesto del prompt, chiamate agli strumenti, errori di runtime o metadati di utilizzo
    - Disabilitare o spostare l'acquisizione della traiettoria
summary: Esporta bundle di traiettorie redatti per il debug di una sessione agente OpenClaw
title: Bundle di traiettorie
x-i18n:
    generated_at: "2026-06-27T18:24:42Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: bf48616c29a1055f26d39a88869c025db7e6261b13dcaa0cd35be438c6a86a88
    source_path: tools/trajectory.md
    workflow: 16
---

L'acquisizione della traiettoria è il registratore di volo per sessione di OpenClaw. Registra una
timeline strutturata per ogni esecuzione dell'agente, poi `/export-trajectory` confeziona la
sessione corrente in un bundle di supporto redatto.

Usala quando devi rispondere a domande come:

- Quale prompt, prompt di sistema e quali strumenti sono stati inviati al modello?
- Quali messaggi di trascrizione e chiamate agli strumenti hanno portato a questa risposta?
- L'esecuzione è andata in timeout, è stata interrotta, ha eseguito una compattazione o ha incontrato un errore del provider?
- Quale modello, quali plugin, Skills e impostazioni di runtime erano attivi?
- Quali metadati di utilizzo e di prompt-cache ha restituito il provider?

Se stai inviando una segnalazione di supporto ampia per un problema live del Gateway, inizia con
[`/diagnostics`](/it/gateway/diagnostics#chat-command). Diagnostics raccoglie il
bundle Gateway sanificato e, per le sessioni dell'harness OpenAI Codex, può anche inviare
feedback Codex ai server OpenAI dopo l'approvazione. Usa `/export-trajectory` quando
ti serve specificamente la timeline dettagliata per sessione di prompt, strumenti e trascrizione.

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

Puoi scegliere un nome di directory di output relativo:

```text
/export-trajectory bug-1234
```

Il percorso personalizzato viene risolto dentro `.openclaw/trajectory-exports/`. I percorsi
assoluti e i percorsi `~` vengono rifiutati.

I bundle di traiettoria possono contenere prompt, messaggi del modello, schemi degli strumenti, risultati degli strumenti,
eventi di runtime e percorsi locali. Il comando slash della chat quindi passa
ogni volta attraverso l'approvazione exec. Approva l'esportazione una volta quando intendi
creare il bundle; non usare allow-all. Nelle chat di gruppo, OpenClaw invia il
prompt di approvazione e il risultato dell'esportazione al proprietario in privato invece di pubblicare i
dettagli della traiettoria nella stanza condivisa.

Per l'ispezione locale o i workflow di supporto, puoi anche eseguire direttamente il percorso del comando
approvato:

```bash
openclaw sessions export-trajectory --session-key "agent:main:telegram:direct:123" --workspace .
```

## Accesso

L'esportazione della traiettoria è un comando del proprietario. Il mittente deve superare i normali controlli di
autorizzazione dei comandi e i controlli del proprietario per il canale.

## Cosa viene registrato

L'acquisizione della traiettoria è attiva per impostazione predefinita per le esecuzioni degli agenti OpenClaw.

Gli eventi di runtime includono:

- `session.started`
- `trace.metadata`
- `context.compiled`
- `prompt.submitted`
- `model.fallback_step`, inclusi il modello sorgente, il modello successivo, motivo/dettaglio dell'errore, posizione nella catena e se il fallback è avanzato, riuscito o ha esaurito la catena
- `model.completed`
- `trace.artifacts`
- `session.ended`

Gli eventi di trascrizione vengono anche ricostruiti dal ramo di sessione attivo:

- messaggi utente
- messaggi assistant
- chiamate agli strumenti
- risultati degli strumenti
- compattazioni
- modifiche del modello
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

| File                  | Contenuti                                                                                       |
| --------------------- | ---------------------------------------------------------------------------------------------- |
| `manifest.json`       | Schema del bundle, file sorgente, conteggi degli eventi ed elenco dei file generato             |
| `events.jsonl`        | Timeline ordinata di runtime e trascrizione                                                     |
| `session-branch.json` | Ramo di trascrizione attivo redatto e intestazione della sessione                               |
| `metadata.json`       | Versione di OpenClaw, OS/runtime, modello, snapshot della configurazione, plugin, Skills e metadati dei prompt |
| `artifacts.json`      | Stato finale, errori, utilizzo, cache dei prompt, conteggio delle compattazioni, testo assistant e metadati degli strumenti |
| `prompts.json`        | Prompt inviati e dettagli selezionati di costruzione dei prompt                                 |
| `system-prompt.txt`   | Ultimo prompt di sistema compilato, quando acquisito                                            |
| `tools.json`          | Definizioni degli strumenti inviate al modello, quando acquisite                                |

`manifest.json` elenca i file presenti in quel bundle. Alcuni file vengono omessi
quando la sessione non ha acquisito i dati di runtime corrispondenti.

## Posizione dell'acquisizione

Per impostazione predefinita, gli eventi della traiettoria di runtime vengono scritti accanto al file di sessione:

```text
<session>.trajectory.jsonl
```

OpenClaw scrive anche un file puntatore best-effort accanto alla sessione:

```text
<session>.trajectory-path.json
```

Imposta `OPENCLAW_TRAJECTORY_DIR` per archiviare i sidecar della traiettoria di runtime in una
directory dedicata:

```bash
export OPENCLAW_TRAJECTORY_DIR=/var/lib/openclaw/trajectories
```

Quando questa variabile è impostata, OpenClaw scrive un file JSONL per ogni id sessione in quella
directory.

La manutenzione delle sessioni rimuove i sidecar di traiettoria quando la voce di sessione proprietaria
viene eliminata, limitata o espulsa dal budget disco delle sessioni. I file di runtime fuori
dalla directory delle sessioni vengono rimossi solo quando la destinazione del puntatore dimostra ancora di
appartenere a quella sessione.

## Disattivare l'acquisizione

Imposta `OPENCLAW_TRAJECTORY=0` prima di avviare OpenClaw:

```bash
export OPENCLAW_TRAJECTORY=0
```

Questo disattiva l'acquisizione della traiettoria di runtime. `/export-trajectory` può comunque esportare
il ramo di trascrizione, ma i file solo runtime come contesto compilato,
artefatti del provider e metadati dei prompt potrebbero mancare.

## Regolare il timeout di flush

OpenClaw esegue il flush dei sidecar della traiettoria di runtime durante la pulizia dell'agente. Il timeout di
pulizia predefinito è 10.000 ms. Su dischi lenti o store grandi, imposta
`OPENCLAW_TRAJECTORY_FLUSH_TIMEOUT_MS` prima di avviare OpenClaw:

```bash
export OPENCLAW_TRAJECTORY_FLUSH_TIMEOUT_MS=30000
```

Questo controlla quando OpenClaw registra un timeout `openclaw-trajectory-flush` e continua.
Non modifica i limiti di dimensione della traiettoria. Per regolare tutti i passaggi di pulizia dell'agente
che non passano un timeout esplicito, imposta `OPENCLAW_AGENT_CLEANUP_TIMEOUT_MS`.

## Privacy e limiti

I bundle di traiettoria sono progettati per supporto e debug, non per la pubblicazione pubblica.
OpenClaw redige i valori sensibili prima di scrivere i file di esportazione:

- credenziali e campi payload noti simili a segreti
- dati immagine
- percorsi di stato locali
- percorsi del workspace, sostituiti con `$WORKSPACE_DIR`
- percorsi della home directory, quando rilevati

L'esportatore limita anche la dimensione dell'input:

- file sidecar di runtime: l'acquisizione live si interrompe a 10 MiB e registra un evento di troncamento quando rimane spazio; l'esportazione accetta sidecar di runtime esistenti fino a 50 MiB
- file di sessione: 50 MiB
- eventi di runtime: 200.000
- eventi esportati totali: 250.000
- le singole righe degli eventi di runtime vengono troncate sopra 256 KiB

Rivedi i bundle prima di condividerli fuori dal tuo team. La redazione è best-effort
e non può conoscere ogni segreto specifico dell'applicazione.

## Risoluzione dei problemi

Se l'esportazione non ha eventi di runtime:

- conferma che OpenClaw sia stato avviato senza `OPENCLAW_TRAJECTORY=0`
- controlla se `OPENCLAW_TRAJECTORY_DIR` punta a una directory scrivibile
- esegui un altro messaggio nella sessione, poi esporta di nuovo
- ispeziona `manifest.json` per `runtimeEventCount`

Se il comando rifiuta il percorso di output:

- usa un nome relativo come `bug-1234`
- non passare `/tmp/...` o `~/...`
- mantieni l'esportazione dentro `.openclaw/trajectory-exports/`

Se l'esportazione fallisce con un errore di dimensione, la sessione o il sidecar ha superato i
limiti di sicurezza dell'esportazione. Avvia una nuova sessione o esporta una riproduzione più piccola.

## Correlati

- [Diff](/it/tools/diffs)
- [Gestione delle sessioni](/it/concepts/session)
- [Strumento exec](/it/tools/exec)
