---
read_when:
    - Si sta verificando il passaggio dello storage SQLite del Percorso 3 su un Gateway attivo
    - È necessario distinguere le divergenze JSONL legacy previste dagli errori di runtime
    - Si sta creando o revisionando l'harness E2E live di SQLite basato su agenti
summary: Progettazione della verifica live del Gateway per il passaggio della sessione/trascrizione di Path 3 a SQLite
title: Harness E2E SQLite live del percorso 3
x-i18n:
    generated_at: "2026-07-16T14:58:29Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 2749bf47cb4967bc80a5ed37a12f2a553f3b388ed8cd90cfb3217e1b5e8afae9
    source_path: reference/path3-live-sqlite-e2e-harness.md
    workflow: 16
---

Il framework E2E SQLite live del Percorso 3 dimostra che il Gateway utilizza SQLite come
archivio canonico delle sessioni e delle trascrizioni, mentre i file JSONL legacy rimangono
input per la migrazione o materiale di archivio. È un framework di verifica per i manutentori, non un
normale strumento diagnostico per gli utenti.

Dopo che un Gateway ha elaborato traffico successivo alla migrazione, la parità con i file JSONL legacy non è
più un segnale valido dello stato di integrità del runtime. Un Gateway migrato correttamente può avere
righe di trascrizione SQLite che differiscono dai conteggi JSONL legacy, perché i nuovi turni
devono aggiornare solo SQLite. Il framework live deve quindi misurare il comportamento del Gateway,
le variazioni delle righe SQLite, la quiescenza dei file legacy e lo stato dei log a ogni
passaggio.

## Struttura del comando

Il comando live previsto è:

```bash
node scripts/path3-live-sqlite-e2e.mjs \
  --url http://127.0.0.1:18789 \
  --agent main \
  --session-key agent:main:path3-live-e2e:<timestamp> \
  --json
```

Il comando si connette a un Gateway già in esecuzione. Non avvia, arresta,
importa né riesegue la migrazione, a meno che in seguito non venga aggiunta una modalità di migrazione
esplicita. Una variante per CI o ambiente locale isolato può usare
`test/helpers/openclaw-test-instance.ts`, ma il percorso di verifica live deve ispezionare
il Gateway effettivo dell'operatore e il relativo database SQLite reale per agente.

## Verifica isolata della CLI compilata

Il runner di verifica della CLI compilata inizializza un archivio di sessioni legacy isolato, avvia il
Gateway ricompilato e dimostra che all'avvio le sessioni legacy attive vengono importate in
SQLite prima che inizino le letture del runtime. Non deve eseguire `openclaw doctor --fix`
prima del primo avvio del Gateway, perché ciò verificherebbe il percorso di migrazione manuale
anziché il percorso di aggiornamento ricevuto dagli utenti al primo avvio dopo il passaggio.

Dopo l'importazione all'avvio, la verifica isolata può eseguire
`openclaw doctor --session-sqlite inspect` e
`openclaw doctor --session-sqlite validate` come evidenza diagnostica. Questi
comandi doctor non sono il meccanismo di migrazione per la verifica dell'aggiornamento all'avvio.
Scenari separati di importazione tramite doctor devono inizializzare file di trascrizione legacy insieme ai
file sidecar delle traiettorie e verificare che doctor archivi tali artefatti mentre SQLite
rimane canonico.

## Controlli preliminari

I controlli preliminari raccolgono una baseline e terminano con errore prima di inviare un turno di verifica se il
Gateway non è utilizzabile:

- `GET /health` e lo stato approfondito del Gateway devono indicare un Gateway
  in esecuzione e raggiungibile.
- Le versioni della CLI e del Gateway devono corrispondere al branch sottoposto a test.
- Il framework registra un cursore di log per il file di log attivo del Gateway.
- Il framework registra i conteggi delle tabelle SQLite per agente per `sessions`,
  `session_entries`, `transcript_events`, `transcript_event_identities` e
  `session_routes`.
- Il framework registra `mtime`, `size` e l'esistenza dei file legacy
  `sessions.json`, dei file JSONL referenziati e dei possibili percorsi JSONL
  della sessione di verifica.
- `lsof -p <gateway-pid>` deve mostrare handle SQLite DB/WAL/SHM e nessun handle attivo
  `.jsonl` o `sessions.json`.

`openclaw doctor --session-sqlite validate` è solo informativo in modalità live.
Dopo il traffico successivo al passaggio, può segnalare una divergenza prevista rispetto ai file legacy. Il
framework deve usare l'output di doctor per la classificazione e l'inventario della migrazione,
non come criterio di superamento o fallimento del runtime.

## Scenario guidato dall'agente

Lo scenario live usa una chiave di sessione dedicata alla verifica e controlla il Gateway
tramite percorsi RPC pubblici ove possibile. Un singolo turno dell'agente dovrebbe essere sufficiente per
esercitare la persistenza ordinaria, ma la verifica completa deve coprire i punti di integrazione
3.1b che in precedenza richiedevano controlli live individuali:

- Turno di chat ordinario: creare o riutilizzare la sessione di verifica, inviare un prompt reale
  all'agente, attendere il risultato finale dell'assistente e verificare `chat.history` o
  una proiezione equivalente del Gateway.
- Identità della trascrizione: verificare che lo stesso marcatore compaia nella cronologia del Gateway e nelle
  righe della trascrizione SQLite, incluse le righe con identità stabile degli eventi, se presenti.
- Funzioni di accesso ai metadati delle sessioni: leggere la sessione di verifica e le sessioni live
  esistenti selezionate tramite le funzioni di accesso del Gateway/alle sessioni e confrontarle con le righe SQLite.
- Proiezione della modifica della sessione: applicare una modifica reversibile ai metadati del modello/della sessione nella
  sessione di verifica, quindi verificare che la riga proiettata e la risposta del Gateway corrispondano.
- Ciclo di vita del checkpoint di Compaction: elencare, creare un branch e ripristinare un checkpoint solo
  nella sessione di verifica o in una sessione fixture sintetica creata dal framework.
- Ripristino dopo il riavvio: eseguire il percorso sicuro del marcatore di ripristino su una sessione di verifica
  controllata o su un'istanza di test isolata; la modalità live può eseguire questo passaggio solo quando
  l'insieme delle sessioni di destinazione è esplicito e reversibile.
- Ciclo di vita della pulizia: eliminare o reimpostare la sessione di verifica, quindi verificare le righe
  del ciclo di vita SQLite e lo stato archiviato della trascrizione.

I punti di integrazione specifici del trasporto che non possono essere esercitati in sicurezza sul Gateway live
dell'operatore, come l'ingresso tramite WhatsApp o chiamate vocali, devono usare sonde del runtime
a livello del proprietario basate sullo stesso contratto SQLite, anziché simulare il trasporto esterno.

## Asserzioni per passaggio

Ogni passaggio acquisisce un'istantanea dello stato precedente e successivo e scrive un record strutturato
dell'asserzione:

- I conteggi delle righe SQLite avanzano solo dove previsto.
- Le righe del runtime delle traiettorie avanzano per le sessioni di verifica supportate da marcatori che registrano
  eventi del runtime.
- La riga della sessione di verifica presenta i valori previsti per `session_id`, stato, timestamp,
  metadati e righe di instradamento.
- La proiezione della cronologia/sessione del Gateway corrisponde alla parte finale della trascrizione SQLite.
- Non viene creato né modificato alcun file JSONL della sessione di verifica.
- Non viene creato alcun file sidecar `.trajectory.jsonl`, `.trajectory-path.json` o
  `trajectory/<session>.jsonl` derivato dal marcatore per la sessione di verifica.
- I file JSONL legacy esistenti e `sessions.json` rimangono invariati, a meno che il
  passaggio non sia esplicitamente un'operazione di migrazione offline o di archiviazione.
- Il processo del Gateway non apre handle `.jsonl` o `sessions.json`.
- I log dal cursore precedente non contengono `ERROR`, `FATAL`, `SQLITE_`,
  `no such column`, indisponibilità dell'archivio delle sessioni, errore del ripristino dopo il riavvio o
  avvisi di riconciliazione delle trascrizioni, a meno che lo scenario non li includa esplicitamente nell'elenco consentito.

L'analisi dei log fa parte del contratto di superamento/fallimento. Un Gateway che risponde ai controlli
di integrità ma emette errori dello schema SQLite o ripetuti errori di riconciliazione delle trascrizioni
non è considerato valido per il Percorso 3.

## Artefatto di evidenza

Il framework deve scrivere l'evidenza in `.artifacts/path3-live-e2e/<timestamp>/`
e mantenerla fuori da git:

- `summary.json`: argomenti del comando, versione del Gateway, risultato, asserzione non riuscita e
  percorsi degli artefatti.
- `sqlite-before.json` e `sqlite-after.json`: conteggi delle righe e righe di verifica
  selezionate.
- `legacy-files.json`: esistenza dei file legacy, `mtime`, dimensione e indicazione dell'eventuale
  modifica di ciascun file.
- `gateway-log-scan.json`: intervallo del cursore, righe di log corrispondenti e decisioni
  sull'elenco consentito.
- `events.jsonl`: osservazioni ordinate per passaggio, adatte ai commenti di verifica della PR.

La verifica della PR deve riepilogare questi artefatti anziché incollare trascrizioni
complete o contenuti di messaggi privati.

## Regole di sicurezza

- La modalità live non deve mai reimportare i file JSONL legacy mentre il Gateway è in esecuzione.
- La modalità live non deve modificare sessioni diverse da quella di verifica, salvo sonde di riparazione
  reversibili ed esplicitamente selezionate.
- Qualsiasi passaggio distruttivo o di migrazione estesa richiede un nuovo backup del
  database SQLite interessato e della directory delle sessioni legacy.
- I backup devono essere limitati al database dell'agente/directory delle sessioni interessati e riutilizzati
  durante una singola esecuzione di verifica per evitare una crescita illimitata dello spazio su disco.
- Il passaggio di pulizia non deve lasciare alcuna sessione di verifica, file JSONL di verifica o file legacy
  modificato, a meno che il chiamante non specifichi `--keep-artifacts`.

## Risultato positivo

Un'esecuzione live riuscita significa che il Gateway ha accettato un flusso di sessione reale guidato dall'agente,
che tutto lo stato canonico osservato si trovava in SQLite, che i file del runtime legacy sono rimasti
quiescenti e che lo stato dei log è rimasto privo di errori durante l'intervallo misurato. Non significa
che la parità con i file JSONL legacy rimanga integra dopo il traffico live; la divergenza live è prevista
quando SQLite diventa l'archivio canonico.
