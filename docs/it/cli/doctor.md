---
read_when:
    - Si riscontrano problemi di connettività/autenticazione e si desiderano procedure guidate per risolverli
    - Hai effettuato un aggiornamento e vuoi una verifica di correttezza di base
summary: Riferimento CLI per `openclaw doctor` (controlli di integrità + riparazioni guidate)
title: Diagnostica
x-i18n:
    generated_at: "2026-07-16T14:06:41Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 322af63f52a3d864e46da332353ca921a4462e13fa849986d936524759f80ccc
    source_path: cli/doctor.md
    workflow: 16
---

# `openclaw doctor`

Controlli di integrità e correzioni rapide per Gateway, canali, plugin, Skills, instradamento dei modelli, stato locale e migrazioni della configurazione. Utilizzarlo ogni volta che qualcosa non si comporta come previsto e si desidera che un singolo comando spieghi il problema.

Correlati:

- Risoluzione dei problemi: [Risoluzione dei problemi](/it/gateway/troubleshooting)
- Controllo di sicurezza: [Sicurezza](/it/gateway/security)

## Modalità operative

Doctor dispone di cinque modalità operative:

| Modalità operativa       | Comando                                   | Comportamento                                                                                                  |
| ------------------------ | ----------------------------------------- | -------------------------------------------------------------------------------------------------------------- |
| Ispezione                | `openclaw doctor`                         | Controlli rivolti agli utenti e richieste guidate.                                                             |
| Riparazione              | `openclaw doctor --fix`                   | Applica le riparazioni supportate, richiedendo conferma salvo quando la riparazione non interattiva è sicura.   |
| Lint                     | `openclaw doctor --lint`                  | Risultati strutturati in sola lettura per CI, controlli preliminari e criteri di revisione.                     |
| Manutenzione SQLite condivisa | `openclaw doctor --state-sqlite compact`  | Esegue esplicitamente checkpoint, Compaction e verifica del DB canonico dello stato condiviso.                 |
| Migrazione SQLite delle sessioni | `openclaw doctor --session-sqlite <mode>` | Ispeziona, importa, convalida, compatta, recupera o ripristina lo stato delle sessioni.                         |

Preferire `--lint` quando l'automazione richiede un risultato stabile. Preferire `--fix` quando un operatore umano desidera che doctor modifichi la configurazione o lo stato.

## Esempi

```bash
openclaw doctor
openclaw doctor --lint
openclaw doctor --lint --json
openclaw doctor --lint --severity-min warning
openclaw doctor --lint --all
openclaw doctor --lint --allow-exec
openclaw doctor --deep
openclaw doctor --fix
openclaw doctor --fix --non-interactive
openclaw doctor --generate-gateway-token
openclaw doctor --post-upgrade
openclaw doctor --post-upgrade --json
openclaw doctor --state-sqlite compact
openclaw doctor --state-sqlite compact --json
openclaw doctor --session-sqlite inspect --session-sqlite-all-agents
openclaw doctor --session-sqlite dry-run --session-sqlite-agent main --json
openclaw doctor --session-sqlite import --session-sqlite-all-agents
openclaw doctor --session-sqlite validate --session-sqlite-all-agents --json
openclaw doctor --session-sqlite compact --session-sqlite-all-agents
openclaw doctor --session-sqlite recover --github-issue
openclaw doctor --session-sqlite restore --session-sqlite-all-agents
```

Per le autorizzazioni specifiche dei canali, utilizzare le verifiche dei canali anziché `doctor`:

```bash
openclaw channels capabilities --channel discord --target channel:<channel-id>
openclaw channels status --probe
```

`channels capabilities` segnala le autorizzazioni effettive del bot per una specifica destinazione del canale. `channels status --probe` controlla tutti i canali configurati e le destinazioni di accesso vocale automatico.

## Opzioni

| Opzione                         | Effetto                                                                                                                                                                                           |
| ------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `--no-workspace-suggestions`    | Disabilita i suggerimenti per la memoria e la ricerca nell'area di lavoro.                                                                                                                        |
| `--yes`                         | Accetta le impostazioni predefinite senza richiedere conferma.                                                                                                                                    |
| `--repair` / `--fix`            | Applica le riparazioni consigliate non relative ai servizi senza richiedere conferma (`--fix` è un alias). Le installazioni o riscritture del servizio Gateway richiedono comunque una conferma interattiva o comandi `gateway` espliciti. |
| `--force`                       | Applica riparazioni invasive, inclusa la sovrascrittura della configurazione personalizzata dei servizi.                                                                                          |
| `--non-interactive`             | Esegue senza richieste di conferma; solo migrazioni sicure e riparazioni non relative ai servizi.                                                                                                 |
| `--generate-gateway-token`      | Genera e configura un token del Gateway.                                                                                                                                                          |
| `--allow-exec`                  | Consente a doctor di eseguire i SecretRef `exec` configurati durante la verifica dei segreti.                                                                                         |
| `--deep`                        | Analizza i servizi di sistema alla ricerca di installazioni aggiuntive del Gateway; segnala i recenti passaggi di consegne dei riavvii del supervisore del Gateway.                                |
| `--lint`                        | Esegue controlli di integrità modernizzati in modalità di sola lettura ed emette risultati diagnostici.                                                                                           |
| `--post-upgrade`                | Esegue verifiche di compatibilità dei plugin successive all'aggiornamento; i risultati vengono inviati a stdout; codice di uscita 1 se è presente un risultato di livello errore.                  |
| `--state-sqlite <mode>`         | Esegue la manutenzione SQLite esplicita dello stato condiviso. L'unica modalità è `compact`.                                                                                              |
| `--session-sqlite <mode>`       | Esegue la modalità di migrazione SQLite mirata delle sessioni: `inspect`, `dry-run`, `import`, `validate`, `compact`, `recover` o `restore`. |
| `--session-sqlite-store <path>` | Con `--session-sqlite`: seleziona un percorso dell'archivio `sessions.json` precedente.                                                                                                        |
| `--session-sqlite-agent <id>`   | Con `--session-sqlite`: seleziona un agente configurato.                                                                                                                                          |
| `--session-sqlite-all-agents`   | Con `--session-sqlite`: seleziona gli archivi degli agenti configurati e rilevati.                                                                                                                |
| `--github-issue`                | Con `--session-sqlite recover`: prepara una segnalazione di problema anonimizzata per openclaw/openclaw; doctor la crea con `gh` dopo `--yes` o una conferma interattiva.          |
| `--json`                        | Con `--lint`: risultati JSON. Con `--post-upgrade`: `{ probesRun, findings }`. Con `--state-sqlite` o `--session-sqlite`: il rapporto di manutenzione in formato JSON.                         |
| `--severity-min <level>`        | Con `--lint`: omette i risultati inferiori a `info`, `warning` o `error`.                                                                                |
| `--all`                         | Con `--lint`: esegue tutti i controlli registrati, inclusi quelli facoltativi esclusi dal gruppo predefinito.                                                                            |
| `--skip <id>`                   | Con `--lint`: ignora un ID di controllo. Ripetibile.                                                                                                                                    |
| `--only <id>`                   | Con `--lint`: esegue solo gli ID di controllo specificati. Ripetibile.                                                                                                                  |

`--severity-min`, `--all`, `--only` e `--skip` sono accettati solo insieme a `--lint`; `--json` è accettato con `--lint`, `--post-upgrade`, `--state-sqlite` e `--session-sqlite`.

## Modalità lint

`openclaw doctor --lint` è in sola lettura: nessuna richiesta di conferma, nessuna riparazione, nessuna riscrittura della configurazione o dello stato.

```bash
openclaw doctor --lint
openclaw doctor --lint --severity-min warning
openclaw doctor --lint --json
openclaw doctor --lint --all
openclaw doctor --lint --allow-exec
openclaw doctor --lint --only core/doctor/gateway-config --json
openclaw doctor --lint --only core/doctor/local-audio-acceleration --severity-min info
```

L'output destinato agli utenti è compatto:

```text
doctor --lint: eseguiti 6 controlli, 1 risultato
  [warning] core/doctor/gateway-config gateway.mode - gateway.mode non è impostato; l'avvio del Gateway verrà bloccato.
    correzione: eseguire `openclaw configure` e impostare la modalità del Gateway (local/remote), oppure `openclaw config set gateway.mode local`.
```

L'output JSON è l'interfaccia per gli script:

```json
{
  "ok": false,
  "checksRun": 5,
  "checksSkipped": 0,
  "findings": [
    {
      "checkId": "core/doctor/gateway-config",
      "severity": "warning",
      "message": "gateway.mode non è impostato; l'avvio del Gateway verrà bloccato.",
      "path": "gateway.mode",
      "fixHint": "Eseguire `openclaw configure` e impostare la modalità del Gateway (local/remote), oppure `openclaw config set gateway.mode local`."
    }
  ]
}
```

Codici di uscita:

| Codice | Significato                                                                  |
| ------ | ---------------------------------------------------------------------------- |
| `0`  | Nessun risultato pari o superiore alla soglia di gravità selezionata.        |
| `1`  | Almeno un risultato raggiunge la soglia selezionata.                          |
| `2`  | Errore del comando o di runtime prima che sia possibile produrre i risultati del lint. |

`--severity-min` determina sia quali risultati vengono visualizzati sia la soglia di uscita: `openclaw doctor --lint --severity-min error` può non visualizzare nulla e terminare con `0` anche quando esistono risultati `info`/`warning` di gravità inferiore.

`--all` determina quali controlli vengono selezionati prima del filtro per gravità. L'esecuzione lint predefinita esclude i controlli approfonditi, storici o con maggiori probabilità di rilevare residui precedenti riparabili; utilizzare `--all` per l'inventario completo. `--only <id>` è il selettore più preciso e può eseguire qualsiasi controllo registrato tramite ID.

`core/doctor/local-audio-acceleration` segnala il comando STT locale selezionato automaticamente, le prove distinte del backend disponibile/richiesto/osservato e l'ordine delle alternative senza caricare un modello vocale. Emette un risultato informativo, quindi includere `--severity-min info` per visualizzarlo.

## Controlli di integrità strutturati

I moderni controlli di doctor utilizzano un piccolo contratto suddiviso:

```ts
detect(ctx, scope?) -> HealthFinding[]
repair?(ctx, findings) -> HealthRepairResult
```

`detect()` alimenta `doctor --lint`. `repair()` è facoltativo e viene eseguito solo con `doctor --fix` / `doctor --repair`. I controlli non ancora migrati a questa struttura utilizzano ancora il flusso di contributi precedente di doctor.

I contesti di riparazione possono contenere richieste `dryRun`/`diff`; i risultati delle riparazioni possono restituire `diffs` strutturati (modifiche alla configurazione o ai file) e `effects` (effetti collaterali relativi a servizi, processi, pacchetti, stato o altro), consentendo ai controlli convertiti di evolvere verso `doctor --fix --dry-run` senza spostare la pianificazione delle modifiche in `detect()`.

`repair()` segnala `status: "repaired" | "skipped" | "failed"` (l'assenza dello stato indica `repaired`). Quando la riparazione restituisce `skipped` o `failed`, doctor segnala il motivo e ignora la convalida per quel controllo. Dopo una riparazione riuscita, doctor esegue nuovamente `detect()` limitandolo ai risultati riparati; se il risultato è ancora presente, doctor segnala un avviso di riparazione anziché considerare la modifica completata.

Un risultato include:

| Campo             | Scopo                                                |
| ----------------- | ------------------------------------------------------ |
| `checkId`         | ID stabile per i filtri di esclusione/selezione e le allowlist CI.     |
| `severity`        | `info`, `warning` o `error`.                         |
| `message`         | Descrizione del problema leggibile dagli utenti.                      |
| `path`            | Configurazione, file o percorso logico, quando disponibile.          |
| `line` / `column` | Posizione nel sorgente, quando disponibile.                        |
| `ocPath`          | Indirizzo `oc://` preciso, quando un controllo può indicarne uno. |
| `fixHint`         | Azione suggerita all'operatore o riepilogo della riparazione.           |

I controlli doctor modernizzati del core restano associati al contributo doctor ordinato che gestisce il relativo comportamento `doctor` / `doctor --fix` per gli utenti. Il registro condiviso e strutturato dello stato di integrità è il punto di estensione: i controlli integrati e quelli supportati dai plugin vengono eseguiti dopo i controlli doctor del core, una volta registrati dal pacchetto proprietario nel percorso di comando attivo. `openclaw/plugin-sdk/health` espone lo stesso contratto agli autori di plugin.

## Selezione dei controlli

```bash
openclaw doctor --lint --only core/doctor/gateway-config --json
openclaw doctor --lint --skip core/doctor/skills-readiness
openclaw doctor --lint --all --skip core/doctor/session-locks
```

`--only` e `--skip` accettano gli ID completi dei controlli e possono essere ripetuti. Se un ID `--only` non è registrato, non viene eseguito alcun controllo per tale ID; usare `checksRun`/`checksSkipped` nell'output per verificare che un gate mirato selezioni i controlli previsti.

## Modalità post-aggiornamento

`openclaw doctor --post-upgrade` esegue verifiche di compatibilità dei plugin da concatenare dopo una build o un aggiornamento. I risultati vengono inviati a stdout; il codice di uscita è 1 se un risultato contiene `level: "error"`. Aggiungere `--json` per ottenere un contenitore leggibile dalle macchine (`{ probesRun, findings }`), adatto alla CI, alla skill della community `fork-upgrade` e ad altri strumenti di smoke test post-aggiornamento. Se l'indice dei plugin installati è mancante o non valido, la modalità JSON emette comunque il contenitore con un risultato di errore `plugin.index_unavailable`.

L'avvio dell'immagine del container costituisce un'eccezione al consueto flusso "eseguire doctor dopo
l'aggiornamento". Quando `openclaw gateway run` viene avviato con una nuova versione di OpenClaw,
esegue riparazioni sicure dello stato e dei plugin prima di dichiararsi pronto. Se la riparazione non può
terminare in sicurezza, l'avvio si interrompe e indica di eseguire una volta la stessa immagine con
`openclaw doctor --fix` sullo stesso stato/configurazione montato prima di riavviare
normalmente il container.

## Compaction SQLite dello stato condiviso

`openclaw doctor --state-sqlite compact` è una manutenzione offline esplicita per
il database canonico dello stato condiviso in
`<state-dir>/state/openclaw.sqlite`. Non accetta un percorso di database
arbitrario, non viene mai richiamato dal normale funzionamento del Gateway e non fa parte di
`openclaw doctor --fix`. Il comando acquisisce lo stesso blocco di proprietà dello stato usato
all'avvio del Gateway e lo mantiene durante la convalida, il checkpoint, `VACUUM` e
i controlli finali di integrità. Si rifiuta di essere eseguito mentre un Gateway o un altro
comando di manutenzione SQLite detiene tale blocco. Il blocco dello stato rimane attivo quando
`OPENCLAW_ALLOW_MULTI_GATEWAY=1` ignora il singleton Gateway per configurazione, quindi una
shell dell'operatore non deve ereditare l'ambiente del servizio Gateway affinché la
manutenzione possa rilevarlo.

Arrestare il Gateway e creare prima un backup verificato:

```bash
openclaw gateway stop
openclaw backup create --verify
openclaw doctor --state-sqlite compact --json
openclaw gateway start
```

Il comando:

1. Richiede un file normale nel percorso canonico dello stato condiviso. Un database
   mancante viene segnalato come `skipped` e l'esecuzione termina correttamente.
2. Convalida la versione dello schema attualmente supportata e
   `schema_meta.role = "global"` prima di eseguire il checkpoint o modificare il file.
3. Richiede un `wal_checkpoint(TRUNCATE)` non occupato. Arrestare ogni processo OpenClaw
   ancora in esecuzione e riprovare se il checkpoint è occupato.
4. Imposta `auto_vacuum` su `INCREMENTAL`, esegue un `VACUUM` completo ed esegue
   nuovamente il checkpoint.
5. Esegue `quick_check`, `integrity_check` e `foreign_key_check`, quindi
   riapplica le autorizzazioni riservate al proprietario al database e ai file sidecar SQLite.

L'output JSON segnala le dimensioni del database e del WAL, le pagine della freelist, la dimensione delle pagine e
il valore `auto_vacuum` prima e dopo la Compaction, oltre ai byte recuperati e ai
risultati `quick_check` e `integrity_check`. `foreign_key_check` viene applicato
in modalità fail-closed e non dispone di un campo separato per l'esito positivo. SQLite segnala `auto_vacuum` come
`0` per nessuna, `1` per completa e `2` per incrementale.

La Compaction non riesce senza apportare modifiche quando lo schema è obsoleto, più recente della
build OpenClaw in esecuzione o appartiene a un database di un agente. Eseguire prima
`openclaw doctor --fix` per uno schema dello stato condiviso obsoleto. Ripristinare un
backup compatibile oppure aggiornare OpenClaw per uno schema più recente.

## Migrazione SQLite delle sessioni

OpenClaw importa automaticamente le righe delle sessioni legacy e la cronologia delle trascrizioni nel database
SQLite di ciascun agente durante l'avvio del Gateway e durante
`openclaw doctor --fix`. `openclaw doctor --session-sqlite <mode>` è lo
strumento mirato di ispezione e convalida per tale migrazione. Le righe delle sessioni del runtime
corrente si trovano in
`~/.openclaw/agents/<agentId>/agent/openclaw-agent.sqlite`. I file
`sessions.json` legacy sono origini della migrazione. I file JSONL delle trascrizioni attive vengono
importati e archiviati fuori dalla directory delle sessioni attive dopo
un'importazione riuscita; i file JSONL nel livello di archivio restano artefatti di supporto, non
fallback del runtime.

Modalità:

| Modalità       | Comportamento                                                                                                               |
| ---------- | ---------------------------------------------------------------------------------------------------------------------- |
| `inspect`  | Legge i conteggi legacy e SQLite, oltre ai file JSONL non referenziati, senza eseguire l'importazione.                                       |
| `dry-run`  | Analizza le voci legacy e i file JSONL delle trascrizioni, conta le righe importabili e segnala i problemi senza scrivere righe SQLite. |
| `import`   | Importa le voci legacy e gli eventi delle trascrizioni in SQLite per le destinazioni selezionate.                                      |
| `validate` | Confronta le origini legacy selezionate con le righe SQLite e i conteggi degli eventi delle trascrizioni.                                   |
| `compact`  | Esegue il checkpoint e VACUUM sui database SQLite degli agenti selezionati per recuperare le pagine libere dopo eliminazioni consistenti o la pulizia dell'archivio.    |
| `recover`  | Ripristina l'ultima esecuzione di migrazione non riuscita, ne convalida le destinazioni e prepara una segnalazione GitHub sanitizzata.            |
| `restore`  | Ripristina gli artefatti delle trascrizioni archiviati dai manifesti di migrazione registrati senza eliminare i dati SQLite.                  |

Selettori:

- Predefinito: l'archivio dell'agente predefinito configurato, quando il relativo file di archivio legacy esiste.
- `--session-sqlite-agent <id>`: un agente configurato.
- `--session-sqlite-all-agents`: gli archivi degli agenti configurati più quelli rilevati.
- `--session-sqlite-store <path>`: un percorso legacy `sessions.json` esplicito.

Sequenza di ispezione manuale:

```bash
openclaw doctor --session-sqlite inspect --session-sqlite-all-agents
openclaw doctor --session-sqlite dry-run --session-sqlite-all-agents --json
openclaw doctor --session-sqlite import --session-sqlite-all-agents
openclaw doctor --session-sqlite validate --session-sqlite-all-agents --json
openclaw doctor --session-sqlite compact --session-sqlite-all-agents
openclaw doctor --session-sqlite recover --github-issue
```

Eseguire il backup della directory di stato di OpenClaw prima di eseguire `import` su un'installazione con
una cronologia importante. `validate` termina con un codice diverso da zero quando una voce legacy selezionata è
assente da SQLite, un ID di sessione è diverso o il conteggio degli eventi di una trascrizione è diverso.
Quando si usa `--session-sqlite-store <path>`, verificare che il resoconto contenga il
numero previsto di destinazioni; un percorso di archivio esplicito inesistente non seleziona alcuna destinazione.

Le eliminazioni SQLite recuperano prima le pagine all'interno del database; non necessariamente
riducono immediatamente il file del database. Dopo aver eliminato o archiviato trascrizioni di grandi dimensioni,
eseguire `openclaw doctor --session-sqlite compact --session-sqlite-all-agents`
per effettuare il checkpoint dei file WAL, eseguire `VACUUM` e segnalare le dimensioni del database e del WAL
prima e dopo. La Compaction richiede un file normale con lo schema corrente dell'agente, i
metadati persistenti del proprietario dell'agente selezionato e nessun handle aperto nel processo
doctor. Le modalità distruttive `import`, `compact`, `recover` e `restore`
mantengono lo stesso blocco di proprietà dello stato usato all'avvio del Gateway per l'intera operazione;
`inspect`, `dry-run` e `validate` restano di sola lettura e non lo acquisiscono. Arrestare
prima il Gateway. Le modalità distruttive non riescono anziché entrare in conflitto con scritture attive o
con un altro comando di manutenzione. Una destinazione distruttiva `--session-sqlite-store`
deve trovarsi nella directory di stato attiva; impostare `OPENCLAW_STATE_DIR` sulla
directory di stato proprietaria dell'archivio prima di eseguire la manutenzione di un'altra installazione.
Le destinazioni con hard link esistenti vengono rifiutate perché un altro percorso può condividere lo
stesso inode del database fuori dalla directory di stato bloccata. Gli stessi controlli di proprietà
coprono i file sidecar WAL, di memoria condivisa e del journal di rollback di SQLite.

Ogni importazione scrive un manifesto in
`~/.openclaw/session-sqlite-migration-runs/` prima di spostare gli artefatti delle trascrizioni
nell'archivio. Se all'avvio viene segnalata una migrazione SQLite delle sessioni non riuscita dopo lo
spostamento degli artefatti, eseguire il ripristino:

```bash
openclaw doctor --session-sqlite recover --github-issue
```

Il ripristino seleziona il manifesto più recente di una migrazione non riuscita, ripristina solo gli
artefatti archiviati indicati dal manifesto, convalida le destinazioni interessate, aggiorna i
resoconti sanitizzati `.failure.md` e `.failure.json` e prepara il corpo di una segnalazione GitHub
che esclude il contenuto delle trascrizioni, l'ambiente non elaborato, i segreti e una
configurazione senza limiti. Quando non esiste un manifesto di migrazione non riuscita ma il database SQLite
di un agente selezionato è danneggiato, non è un database oppure presenta file sidecar del journal senza un
database principale, il ripristino copia l'insieme completo dei file in una directory temporanea
di ispezione. SQLite può eseguire il rollback di un hot journal valido in tale copia eliminabile
prima dell'esecuzione di `quick_check`, `integrity_check` e `foreign_key_check`, mentre i
file forensi originali restano invariati. I controlli di integrità non riusciti o i
file sidecar orfani conservano i file DB, WAL, SHM e del journal di rollback rinominando
l'intero insieme rilevato con un unico suffisso `.corrupt-<timestamp>`. Un errore di ridenominazione
intercettato ripristina i file già spostati prima di segnalare l'errore, evitando che un
insieme di file recuperabile venga suddiviso senza alcuna indicazione. Arrestare il Gateway prima del ripristino;
copiare o rinominare un insieme di file SQLite in modifica attiva non è sicuro e produce
comportamenti diversi tra i sistemi operativi. Con `--github-issue --yes`, doctor usa
la CLI GitHub per creare la segnalazione in `openclaw/openclaw`; senza conferma,
scrive il resoconto di supporto locale e stampa un URL precompilato per la segnalazione.

`restore` resta l'operazione di annullamento di livello inferiore. Usa i record
`sourcePath -> archivePath` del manifesto, riporta gli artefatti archiviati nel percorso originale solo quando
quest'ultimo non esiste, segnala i conflitti quando entrambi i percorsi esistono e lascia
il database SQLite al suo posto.

### Downgrade dopo la migrazione SQLite delle sessioni

Prima di avviare una versione precedente di OpenClaw basata su file, ripristinare gli
artefatti legacy archiviati delle trascrizioni:

```bash
openclaw doctor --session-sqlite restore --session-sqlite-all-agents
```

Le versioni precedenti leggevano le voci `sessions.json` e i percorsi `sessionFile` registrati
in tali voci. Dopo la migrazione a SQLite, le importazioni riuscite spostano le trascrizioni JSONL
attive in `session-sqlite-import-archive/`, pertanto il runtime precedente non può
vedere tale cronologia finché il ripristino non riporta gli artefatti registrati nel manifesto nei
percorsi originali.

Il ripristino non elimina i dati SQLite. Le sessioni create dopo il passaggio a SQLite
esistono solo in SQLite e non appariranno nel runtime precedente. Se in seguito
si esegue nuovamente l'aggiornamento, utilizzare la normale sequenza di convalida della migrazione indicata sopra affinché OpenClaw possa
confrontare gli artefatti legacy ripristinati con le righe SQLite prima dell'importazione.

## Note

- In modalità Nix (`OPENCLAW_NIX_MODE=1`), i controlli di doctor in sola lettura continuano a funzionare, ma `doctor --fix`, `doctor --repair`, `doctor --yes` e `doctor --generate-gateway-token` sono disabilitati perché `openclaw.json` è immutabile. Modificare invece il sorgente Nix per questa installazione; per nix-openclaw, utilizzare la [Guida rapida](https://github.com/openclaw/nix-openclaw#quick-start) incentrata sull'agente.
- I prompt interattivi (correzioni del portachiavi/OAuth e così via) vengono eseguiti solo quando stdin è un TTY e `--non-interactive` **non** è impostato. Le esecuzioni headless (cron, Telegram, senza terminale) ignorano i prompt.
- Le esecuzioni non interattive di `doctor` evitano il caricamento anticipato dei Plugin, affinché i controlli di integrità headless rimangano rapidi. Le sessioni interattive continuano a caricare le superfici dei Plugin necessarie al flusso legacy di controllo dell'integrità e riparazione.
- `--lint` è più rigoroso di `--non-interactive`: è sempre in sola lettura, non mostra mai prompt e non applica mai migrazioni sicure. Utilizzare `doctor --fix` o `doctor --repair` quando si desidera che doctor apporti modifiche.
- Per impostazione predefinita, doctor non esegue i SecretRef `exec` durante il controllo dei segreti. Utilizzare `--allow-exec` (con o senza `--lint`) solo quando si desidera intenzionalmente che doctor esegua i resolver di segreti configurati.
- Qualsiasi scrittura della configurazione (inclusa una riparazione `--fix`) ruota un backup in `~/.openclaw/openclaw.json.bak` (con un anello numerato `.bak.1`..`.bak.4`). `--fix` elimina inoltre le chiavi di configurazione sconosciute segnalate dalla convalida dello schema, elencando ogni rimozione; questa operazione viene omessa mentre è in corso un aggiornamento, affinché lo stato dell'aggiornamento scritto parzialmente non venga rimosso prima del completamento della relativa migrazione.
- Impostare `OPENCLAW_SERVICE_REPAIR_POLICY=external` quando un altro supervisore gestisce il ciclo di vita del Gateway. Doctor continua a segnalare lo stato del Gateway/servizio e applica le riparazioni non relative al servizio, ma ignora l'installazione, l'avvio, il riavvio e il bootstrap del servizio, nonché la pulizia del servizio legacy.
- Su Linux, doctor ignora le unità systemd aggiuntive inattive simili al Gateway e, durante la riparazione, non riscrive i metadati di comando/entrypoint per un servizio Gateway systemd in esecuzione. Arrestare prima il servizio oppure utilizzare `openclaw gateway install --force` per sostituire il programma di avvio attivo.
- `doctor --fix --non-interactive` segnala definizioni del servizio Gateway mancanti o obsolete, ma non le installa né le riscrive al di fuori della modalità di riparazione dell'aggiornamento. Eseguire `openclaw gateway install` per un servizio mancante oppure `openclaw gateway install --force` per sostituire il programma di avvio.
- I controlli di integrità dello stato rilevano i file di trascrizione orfani nella directory delle sessioni. La loro archiviazione come `.deleted.<timestamp>` richiede una conferma interattiva; `--fix`, `--yes` e le esecuzioni headless li lasciano nella posizione corrente.
- Doctor analizza `~/.openclaw/cron/jobs.json` (o `cron.store`) per individuare formati legacy dei processi cron e li riscrive prima di importare le righe canoniche in SQLite.
- Doctor segnala i processi cron con un'override esplicita `payload.model`, inclusi i conteggi per spazio dei nomi del provider e le discrepanze rispetto a `agents.defaults.model`, affinché i processi pianificati che non ereditano il modello predefinito siano visibili durante le indagini su autenticazione o fatturazione.
- Doctor segnala i processi cron ancora contrassegnati come in corso (`state.runningAtMs`), che possono essere mostrati da `openclaw cron list` come `running`. Questo controllo è in sola lettura: se nessun Gateway sta attualmente eseguendo un processo contrassegnato, al successivo avvio il servizio cron registra l'esecuzione interrotta e rimuove il contrassegno.
- Su Linux, doctor avvisa quando la crontab dell'utente esegue ancora il componente legacy non più mantenuto `~/.openclaw/bin/ensure-whatsapp.sh`, che può segnalare erroneamente `Gateway inactive` quando cron non dispone dell'ambiente del bus utente systemd.
- Quando WhatsApp è abilitato, doctor verifica la presenza di un ciclo degli eventi del Gateway degradato con client `openclaw-tui` locali ancora in esecuzione. `doctor --fix` arresta solo i client TUI locali verificati, affinché le risposte di WhatsApp non vengano accodate dietro cicli di aggiornamento TUI obsoleti.
- Doctor riscrive i riferimenti ai modelli legacy `codex/*` e `openai-codex/*` come riferimenti canonici `openai/*` nei modelli primari, nei fallback, negli elenchi consentiti dei modelli, nei modelli di generazione di immagini/video, negli override di Heartbeat/subagente/Compaction, negli hook, negli override dei modelli dei canali, nei payload cron e nei pin obsoleti delle route di sessioni/trascrizioni. `--fix` unisce inoltre, quando è sicuro, la configurazione legacy `models.providers.codex` e `models.providers.openai-codex`, migra i profili di autenticazione legacy `openai-codex:*` e le voci `auth.order.openai-codex` in `openai:*`, sposta l'intento Codex nelle voci `agentRuntime.id: "codex"` con ambito provider/modello, rimuove i pin di runtime obsoleti relativi all'intero agente o alla sessione e mantiene i riferimenti degli agenti OpenAI riparati sull'instradamento dell'autenticazione Codex anziché sull'autenticazione diretta tramite chiave API OpenAI.
- Doctor segnala gli elenchi `auth.order.<provider>` non vuoti i cui profili di riferimento sono tutti scomparsi mentre esistono credenziali compatibili archiviate. `doctor --fix` elimina solo tali override obsoleti, ripristinando la selezione automatica delle credenziali per agente; gli ordini esplicitamente vuoti, gli elenchi parzialmente validi e gli ordini privi di credenziali compatibili archiviate rimangono invariati. Se un archivio di autenticazione SQLite attivo è illeggibile o non valido, doctor spiega perché ha ignorato questa riparazione. Riavviare un Gateway in esecuzione prima di ricontrollare lo stato dell'autenticazione se la relativa modalità di ricaricamento della configurazione non applica automaticamente la scrittura.
- Doctor elimina lo stato legacy di staging delle dipendenze dei Plugin delle versioni precedenti di OpenClaw e ricollega il pacchetto host `openclaw` per i Plugin npm gestiti che lo dichiarano come dipendenza peer. Ripara inoltre i Plugin scaricabili mancanti a cui fa riferimento la configurazione (`plugins.entries`, canali configurati, impostazioni configurate del provider/di ricerca, runtime degli agenti configurati). Durante gli aggiornamenti dei pacchetti, doctor ignora la riparazione dei Plugin tramite il gestore pacchetti finché la sostituzione del pacchetto non è completa; eseguire nuovamente `openclaw doctor --fix` in seguito se un Plugin configurato necessita ancora di ripristino. Se un download non riesce, doctor segnala l'errore di installazione e conserva la voce del Plugin configurato per il successivo tentativo di riparazione.
- Doctor ripara la configurazione obsoleta dei Plugin rimuovendo gli ID dei Plugin mancanti da `plugins.allow`/`plugins.deny`/`plugins.entries`, nonché la configurazione dei canali non più valida corrispondente, le destinazioni Heartbeat e gli override dei modelli dei canali, quando il rilevamento dei Plugin funziona correttamente.
- Doctor mette in quarantena la configurazione non valida dei Plugin disabilitando la voce `plugins.entries.<id>` interessata e rimuovendone il payload `config` non valido. L'avvio del Gateway ignora già solo tale Plugin non valido, consentendo agli altri Plugin e canali di continuare a funzionare.
- Doctor rimuove il componente ritirato `plugins.entries.codex.config.codexDynamicToolsProfile`; l'app-server Codex mantiene sempre nativi gli strumenti dell'area di lavoro nativi di Codex.
- Doctor migra automaticamente la configurazione Talk piatta legacy (`talk.voiceId`, `talk.modelId` e simili) in `talk.provider` + `talk.providers.<provider>`. Le esecuzioni ripetute di `doctor --fix` non segnalano/applicano più la normalizzazione Talk quando l'unica differenza è l'ordine delle chiavi dell'oggetto.
- Doctor include un controllo dell'idoneità della ricerca in memoria e può consigliare `openclaw configure --section model` quando mancano le credenziali per gli embedding.
- Doctor avvisa quando non è configurato alcun proprietario dei comandi. Il proprietario dei comandi è l'account dell'operatore umano autorizzato a eseguire comandi riservati al proprietario e ad approvare azioni pericolose. L'associazione tramite DM consente soltanto di comunicare con il bot; se un mittente è stato approvato prima che esistesse il bootstrap del primo proprietario, impostare esplicitamente `commands.ownerAllowFrom`.
- Doctor segnala una nota informativa quando sono configurati agenti in modalità Codex e nella home Codex dell'operatore sono presenti risorse personali della CLI Codex. Gli avvii locali dell'app-server Codex utilizzano home isolate per agente; se necessario, installare prima il Plugin Codex, quindi utilizzare `openclaw migrate plan codex` per inventariare le risorse da promuovere deliberatamente.
- Doctor avvisa quando le Skills consentite per l'agente predefinito non sono disponibili nell'ambiente di runtime corrente (binari, variabili d'ambiente, configurazione o requisiti del sistema operativo mancanti). `doctor --fix` può disabilitare tali Skills non disponibili mediante `skills.entries.<skill>.enabled=false`; se si desidera mantenere attiva la skill, installare/configurare invece il requisito mancante.
- Se la modalità sandbox è abilitata ma Docker non è disponibile, doctor segnala un avviso ad alta rilevanza con le azioni correttive (`install Docker` o `openclaw config set agents.defaults.sandbox.mode off`).
- Se sono presenti file del registro sandbox o directory di shard legacy (`~/.openclaw/sandbox/containers.json`, `~/.openclaw/sandbox/browsers.json`, `~/.openclaw/sandbox/containers/` o `~/.openclaw/sandbox/browsers/`), doctor li segnala; `--fix` migra le voci valide in SQLite e mette in quarantena i file legacy non validi.
- Se `gateway.auth.token`/`gateway.auth.password` sono gestiti tramite SecretRef e non sono disponibili nel percorso del comando corrente, doctor segnala un avviso in sola lettura e non scrive credenziali di fallback in testo normale. Per i SecretRef basati su exec, doctor ignora l'esecuzione a meno che non sia presente `--allow-exec`.
- Se l'ispezione dei SecretRef dei canali non riesce in un percorso di correzione, doctor prosegue e segnala un avviso anziché terminare anticipatamente.
- Dopo le migrazioni della directory dello stato, doctor avvisa quando gli account Telegram o Discord predefiniti abilitati dipendono dal fallback tramite variabile d'ambiente e `TELEGRAM_BOT_TOKEN` o `DISCORD_BOT_TOKEN` non è disponibile per il processo doctor.
- La risoluzione automatica del nome utente `allowFrom` di Telegram (`doctor --fix`) richiede un token Telegram risolvibile nel percorso del comando corrente. Se l'ispezione del token non è disponibile, doctor segnala un avviso e ignora la risoluzione automatica per tale esecuzione.

## macOS: override dell'ambiente `launchctl`

Se in precedenza è stato eseguito `launchctl setenv OPENCLAW_GATEWAY_TOKEN ...` (o `...PASSWORD`), tale valore sostituisce il file di configurazione e può causare errori persistenti di "non autorizzato".

```bash
launchctl getenv OPENCLAW_GATEWAY_TOKEN
launchctl getenv OPENCLAW_GATEWAY_PASSWORD

launchctl unsetenv OPENCLAW_GATEWAY_TOKEN
launchctl unsetenv OPENCLAW_GATEWAY_PASSWORD
```

## Correlati

- [Riferimento CLI](/it/cli)
- [Doctor del Gateway](/it/gateway/doctor)
