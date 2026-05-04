---
read_when:
    - Debug del motivo per cui un agente ha risposto, ha fallito o ha chiamato strumenti in un certo modo
    - Esportazione di un pacchetto di supporto per una sessione OpenClaw
    - Analisi del contesto del prompt, delle chiamate agli strumenti, degli errori di runtime o dei metadati di utilizzo
    - Disabilitare o spostare l'acquisizione delle traiettorie
summary: Esporta bundle di traiettorie con dati oscurati per eseguire il debug di una sessione di agente OpenClaw
title: Pacchetti di traiettorie
x-i18n:
    generated_at: "2026-05-04T09:37:27Z"
    model: gpt-5.5
    provider: openai
    source_hash: b8b1256e52d27185a48ceddaf7937b4f37ad6d57d075fea0d0b6d3abb871f1d8
    source_path: tools/trajectory.md
    workflow: 16
---

La cattura della traiettoria è il registratore di volo per sessione di OpenClaw. Registra una
timeline strutturata per ogni esecuzione dell'agente, quindi `/export-trajectory` impacchetta la
sessione corrente in un bundle di supporto redatto.

Usala quando devi rispondere a domande come:

- Quale prompt, prompt di sistema e strumenti sono stati inviati al modello?
- Quali messaggi di trascrizione e chiamate agli strumenti hanno portato a questa risposta?
- L'esecuzione è scaduta, si è interrotta, è stata compattata o ha riscontrato un errore del provider?
- Quale modello, plugin, Skills e impostazioni di runtime erano attivi?
- Quali metadati di utilizzo e della cache dei prompt ha restituito il provider?

Se stai inviando un report di supporto ampio per un problema del Gateway live, inizia con
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

OpenClaw scrive il bundle sotto l'area di lavoro:

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
attraverso l'approvazione exec ogni volta. Approva l'esportazione una volta quando intendi
creare il bundle; non usare allow-all. Nelle chat di gruppo, OpenClaw invia il
prompt di approvazione e il risultato dell'esportazione al proprietario in privato invece di pubblicare i
dettagli della traiettoria nella stanza condivisa.

Per l'ispezione locale o i flussi di supporto, puoi anche eseguire direttamente il percorso
del comando approvato:

```bash
openclaw sessions export-trajectory --session-key "agent:main:telegram:direct:123" --workspace .
```

## Accesso

L'esportazione della traiettoria è un comando del proprietario. Il mittente deve superare i normali controlli di
autorizzazione dei comandi e i controlli del proprietario per il canale.

## Cosa viene registrato

La cattura della traiettoria è attiva per impostazione predefinita per le esecuzioni degli agenti OpenClaw.

Gli eventi di runtime includono:

- `session.started`
- `trace.metadata`
- `context.compiled`
- `prompt.submitted`
- `model.fallback_step`, inclusi il modello di origine, il modello successivo, motivo/dettaglio dell'errore, posizione nella catena e se il fallback è avanzato, riuscito o ha esaurito la catena
- `model.completed`
- `trace.artifacts`
- `session.ended`

Gli eventi di trascrizione vengono anche ricostruiti dal ramo di sessione attivo:

- messaggi utente
- messaggi dell'assistente
- chiamate agli strumenti
- risultati degli strumenti
- compattazioni
- cambiamenti di modello
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

| File                  | Contenuti                                                                                       |
| --------------------- | ---------------------------------------------------------------------------------------------- |
| `manifest.json`       | Schema del bundle, file sorgente, conteggi degli eventi ed elenco dei file generati             |
| `events.jsonl`        | Timeline ordinata di runtime e trascrizione                                                     |
| `session-branch.json` | Ramo di trascrizione attivo redatto e intestazione della sessione                               |
| `metadata.json`       | Versione OpenClaw, sistema operativo/runtime, modello, snapshot della configurazione, plugin, Skills e metadati dei prompt |
| `artifacts.json`      | Stato finale, errori, utilizzo, cache dei prompt, conteggio delle compattazioni, testo dell'assistente e metadati degli strumenti |
| `prompts.json`        | Prompt inviati e dettagli selezionati di costruzione dei prompt                                 |
| `system-prompt.txt`   | Ultimo prompt di sistema compilato, quando catturato                                            |
| `tools.json`          | Definizioni degli strumenti inviate al modello, quando catturate                                |

`manifest.json` elenca i file presenti in quel bundle. Alcuni file vengono omessi
quando la sessione non ha catturato i dati di runtime corrispondenti.

## Posizione di cattura

Per impostazione predefinita, gli eventi di traiettoria runtime vengono scritti accanto al file di sessione:

```text
<session>.trajectory.jsonl
```

OpenClaw scrive anche un file puntatore best-effort accanto alla sessione:

```text
<session>.trajectory-path.json
```

Imposta `OPENCLAW_TRAJECTORY_DIR` per archiviare i sidecar di traiettoria runtime in una
directory dedicata:

```bash
export OPENCLAW_TRAJECTORY_DIR=/var/lib/openclaw/trajectories
```

Quando questa variabile è impostata, OpenClaw scrive un file JSONL per ogni id di sessione in quella
directory.

La manutenzione delle sessioni rimuove i sidecar di traiettoria quando la voce della sessione proprietaria
viene eliminata, limitata o espulsa dal budget su disco delle sessioni. I file di runtime fuori
dalla directory delle sessioni vengono rimossi solo quando il target del puntatore dimostra ancora di
appartenere a quella sessione.

## Disabilitare la cattura

Imposta `OPENCLAW_TRAJECTORY=0` prima di avviare OpenClaw:

```bash
export OPENCLAW_TRAJECTORY=0
```

Questo disabilita la cattura della traiettoria runtime. `/export-trajectory` può comunque esportare
il ramo di trascrizione, ma i file solo runtime come il contesto compilato,
gli artefatti del provider e i metadati dei prompt potrebbero mancare.

## Privacy e limiti

I bundle di traiettoria sono progettati per supporto e debug, non per la pubblicazione pubblica.
OpenClaw redige i valori sensibili prima di scrivere i file di esportazione:

- credenziali e campi payload noti simili a segreti
- dati immagine
- percorsi di stato locali
- percorsi dell'area di lavoro, sostituiti con `$WORKSPACE_DIR`
- percorsi della home directory, quando rilevati

L'esportatore limita anche la dimensione dell'input:

- file sidecar di runtime: la cattura live si ferma a 10 MiB e registra un evento di troncamento quando rimane spazio; l'esportazione accetta sidecar di runtime esistenti fino a 50 MiB
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
- esegui un altro messaggio nella sessione, quindi esporta di nuovo
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
