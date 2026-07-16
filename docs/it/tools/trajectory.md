---
read_when:
    - Debug del motivo per cui un agente ha risposto, ha avuto esito negativo o ha chiamato gli strumenti in un determinato modo
    - Esportazione di un pacchetto di supporto per una sessione OpenClaw
    - Analisi del contesto del prompt, delle chiamate agli strumenti, degli errori di runtime o dei metadati di utilizzo
    - Disabilitazione dell'acquisizione delle traiettorie
summary: Esportare bundle di traiettorie oscurati per il debug di una sessione agente OpenClaw
title: Bundle di traiettorie
x-i18n:
    generated_at: "2026-07-16T15:03:21Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 7fc494732b6239ad4ea58dca3920a47cb7433c680e7566855dd265c986b55e74
    source_path: tools/trajectory.md
    workflow: 16
---

La cattura della traiettoria è il registratore di volo per sessione di OpenClaw. Registra una
sequenza temporale strutturata per ogni esecuzione dell'agente, quindi `/export-trajectory` comprime la
sessione corrente in un pacchetto di supporto con dati sensibili oscurati che include:

- Il prompt, il prompt di sistema e gli strumenti inviati al modello
- I messaggi della trascrizione e le chiamate agli strumenti che hanno portato a una risposta
- Se l'esecuzione è scaduta, è stata interrotta, sottoposta a Compaction o ha riscontrato un errore del provider
- Il modello, i plugin, le Skills e le impostazioni di runtime attivi
- I metadati di utilizzo e della cache dei prompt restituiti dal provider

Per un rapporto di supporto generale del Gateway, iniziare invece con
[`/diagnostics`](/it/gateway/diagnostics#chat-command); raccoglie il
pacchetto del Gateway depurato e, per le sessioni dell'harness OpenAI Codex, può inviare feedback su Codex
a OpenAI previa approvazione. Usare `/export-trajectory` quando serve la
sequenza temporale dettagliata di prompt, strumenti e trascrizione per sessione.

## Avvio rapido

Inviare nella sessione attiva (alias `/trajectory`):

```text
/export-trajectory
```

OpenClaw scrive il pacchetto nell'area di lavoro:

```text
.openclaw/trajectory-exports/openclaw-trajectory-<session>-<timestamp>/
```

Passare il nome di una directory di output relativa per sostituirla:

```text
/export-trajectory bug-1234
```

Il nome viene risolto all'interno di `.openclaw/trajectory-exports/`. I percorsi assoluti e i percorsi
`~` vengono rifiutati.

I pacchetti di traiettoria possono contenere prompt, messaggi del modello, schemi degli strumenti, risultati degli strumenti,
eventi di runtime e percorsi locali, quindi il comando di chat passa sempre
attraverso l'approvazione di exec. Approvare l'esportazione una sola volta quando si intende creare il
pacchetto; non usare l'autorizzazione globale. Nelle chat di gruppo, OpenClaw invia privatamente al proprietario la richiesta di approvazione
e il risultato dell'esportazione, anziché pubblicare i dettagli della traiettoria
nella stanza condivisa.

Per l'ispezione locale o i flussi di lavoro di supporto, eseguire direttamente il comando CLI
sottostante:

```bash
openclaw sessions export-trajectory --session-key "agent:main:telegram:direct:123" --workspace .
```

Altri flag: `--output <path>` (nome della directory all'interno di
`.openclaw/trajectory-exports`), `--store <path>` (sostituzione dell'archivio delle sessioni),
`--agent <id>` (ID agente per la risoluzione dell'archivio), `--json` (output strutturato).

## Accesso

L'esportazione della traiettoria è un comando riservato al proprietario. Il mittente deve superare i normali controlli di
autorizzazione dei comandi e il controllo del proprietario per il canale.

## Dati registrati

La cattura della traiettoria è attiva per impostazione predefinita per le esecuzioni degli agenti OpenClaw.

Gli eventi di runtime includono:

- `session.started`
- `trace.metadata`
- `context.compiled`
- `prompt.submitted`
- `model.fallback_step`, inclusi il modello di origine, il modello successivo, il motivo e i dettagli dell'errore, la posizione nella catena e se la catena è avanzata, ha avuto esito positivo o si è esaurita
- `model.completed`
- `trace.artifacts`
- `session.ended`

Gli eventi della trascrizione vengono ricostruiti dal ramo attivo della sessione: messaggi
dell'utente, messaggi dell'assistente, chiamate agli strumenti, risultati degli strumenti, Compaction, cambiamenti del
modello, etichette e voci di sessione personalizzate.

Gli eventi vengono scritti come JSON Lines con questo indicatore di schema:

```json
{
  "traceSchema": "openclaw-trajectory",
  "schemaVersion": 1
}
```

## File del pacchetto

| File                  | Contenuto                                                                                       |
| --------------------- | ---------------------------------------------------------------------------------------------- |
| `manifest.json`       | Schema del pacchetto, file di origine, conteggi degli eventi ed elenco dei file generati                             |
| `events.jsonl`        | Sequenza temporale ordinata del runtime e della trascrizione                                                        |
| `session-branch.json` | Ramo attivo della trascrizione e intestazione della sessione con dati sensibili oscurati                                           |
| `metadata.json`       | Versione di OpenClaw, sistema operativo/runtime, modello, istantanea della configurazione, plugin, Skills e metadati dei prompt     |
| `artifacts.json`      | Stato finale, errori, utilizzo, cache dei prompt, conteggio delle Compaction, testo dell'assistente e metadati degli strumenti |
| `prompts.json`        | Prompt inviati e dettagli selezionati sulla composizione dei prompt                                         |
| `system-prompt.txt`   | Ultimo prompt di sistema compilato, se acquisito                                                   |
| `tools.json`          | Definizioni degli strumenti inviate al modello, se acquisite                                              |

`manifest.json` elenca i file presenti in un determinato pacchetto; alcuni file vengono
omessi quando la sessione non ha acquisito i dati di runtime corrispondenti.

## Archiviazione della cattura

Gli eventi di runtime della traiettoria vengono archiviati insieme alla sessione nel database SQLite
per agente. L'esportazione di una traiettoria genera un pacchetto di supporto JSONL con dati sensibili oscurati;
la cattura del runtime attiva non è un file collaterale JSONL adiacente alla sessione.

I file precedenti `.trajectory.jsonl` e `.trajectory-path.json` possono ancora comparire
da versioni meno recenti o da esportazioni esplicite in file del formato precedente. La manutenzione delle sessioni considera
tali file come elementi da eliminare; la cattura attiva scrive righe nel database.

## Disattivazione della cattura

```bash
export OPENCLAW_TRAJECTORY=0
```

Questa impostazione disattiva la cattura della traiettoria di runtime prima di avviare OpenClaw.
`/export-trajectory` può comunque esportare il ramo della trascrizione, ma potrebbero mancare
dati disponibili solo durante il runtime, come il contesto compilato, gli artefatti del provider e i metadati dei
prompt.

## Regolazione del timeout di scaricamento

OpenClaw scarica le righe della traiettoria di runtime durante la pulizia dell'agente. Il timeout di
pulizia predefinito è 10,000 ms. Su dischi lenti o archivi di grandi dimensioni, impostare
`OPENCLAW_TRAJECTORY_FLUSH_TIMEOUT_MS` prima di avviare OpenClaw:

```bash
export OPENCLAW_TRAJECTORY_FLUSH_TIMEOUT_MS=30000
```

Questa impostazione controlla quando OpenClaw registra un timeout `openclaw-trajectory-flush` e
prosegue; non modifica i limiti di dimensione della traiettoria. Per regolare tutti i passaggi di
pulizia dell'agente che non specificano un timeout esplicito, impostare
`OPENCLAW_AGENT_CLEANUP_TIMEOUT_MS`.

## Privacy e limiti

I pacchetti di traiettoria sono destinati al supporto e al debug, non alla pubblicazione. OpenClaw
oscura i valori sensibili prima di scrivere i file di esportazione:

- credenziali e campi noti dei payload simili a segreti
- dati delle immagini
- percorsi dello stato locale
- percorsi dell'area di lavoro, sostituiti con `$WORKSPACE_DIR`
- percorsi della directory home, quando rilevati

L'esportatore limita anche la dimensione dell'input:

- cattura del runtime: la cattura attiva è una finestra mobile limitata a 10 MiB, che elimina gli eventi meno recenti per fare spazio a quelli nuovi; l'esportazione accetta file collaterali di runtime precedenti esistenti fino a 50 MiB
- file di sessione: 50 MiB
- eventi di runtime per esportazione: 200,000
- eventi esportati totali: 250,000
- le singole righe degli eventi di runtime vengono troncate oltre 256 KiB

Esaminare i pacchetti prima di condividerli all'esterno del proprio team. L'oscuramento viene applicato con il massimo impegno,
ma non può riconoscere ogni segreto specifico dell'applicazione.

## Risoluzione dei problemi

Se l'esportazione non contiene eventi di runtime:

- verificare che OpenClaw sia stato avviato senza `OPENCLAW_TRAJECTORY=0`
- eseguire un altro messaggio nella sessione, quindi esportare di nuovo
- esaminare `manifest.json` per `runtimeEventCount`

Se il comando rifiuta il percorso di output:

- usare un nome relativo come `bug-1234`
- non passare `/tmp/...` o `~/...`
- mantenere l'esportazione all'interno di `.openclaw/trajectory-exports/`

Se l'esportazione non riesce a causa di un errore di dimensione, la sessione o il file collaterale ha superato i
limiti di sicurezza dell'esportazione indicati sopra. Avviare una nuova sessione o esportare una
riproduzione più piccola.

## Argomenti correlati

- [Differenze](/it/tools/diffs)
- [Gestione delle sessioni](/it/concepts/session)
- [Strumento exec](/it/tools/exec)
