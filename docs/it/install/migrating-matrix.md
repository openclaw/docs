---
read_when:
    - Aggiornamento di un'installazione Matrix esistente
    - Migrazione della cronologia Matrix crittografata e dello stato del dispositivo
summary: Come OpenClaw aggiorna in-place il precedente Plugin Matrix, inclusi i limiti di recupero dello stato crittografato e i passaggi di recupero manuale.
title: Migrazione Matrix
x-i18n:
    generated_at: "2026-04-24T08:47:23Z"
    model: gpt-5.4
    provider: openai
    source_hash: e8210f5fbe476148736417eec29dfb5e27c132c6a0bb80753ce254129c14da4f
    source_path: install/migrating-matrix.md
    workflow: 15
---

Questa pagina tratta gli aggiornamenti dal precedente Plugin pubblico `matrix` all'implementazione attuale.

Per la maggior parte degli utenti, l'aggiornamento avviene in place:

- il Plugin resta `@openclaw/matrix`
- il canale resta `matrix`
- la tua configurazione resta sotto `channels.matrix`
- le credenziali in cache restano sotto `~/.openclaw/credentials/matrix/`
- lo stato runtime resta sotto `~/.openclaw/matrix/`

Non devi rinominare chiavi di configurazione né reinstallare il Plugin con un nuovo nome.

## Cosa fa automaticamente la migrazione

Quando il gateway si avvia, e quando esegui [`openclaw doctor --fix`](/it/gateway/doctor), OpenClaw prova a riparare automaticamente il vecchio stato Matrix.
Prima che qualsiasi passaggio azionabile di migrazione Matrix modifichi lo stato su disco, OpenClaw crea o riusa uno snapshot di ripristino mirato.

Quando usi `openclaw update`, il trigger esatto dipende da come è installato OpenClaw:

- le installazioni da sorgente eseguono `openclaw doctor --fix` durante il flusso di aggiornamento, poi riavviano il gateway per impostazione predefinita
- le installazioni da package manager aggiornano il pacchetto, eseguono un passaggio doctor non interattivo, poi si affidano al riavvio predefinito del gateway affinché l'avvio completi la migrazione Matrix
- se usi `openclaw update --no-restart`, la migrazione Matrix supportata dall'avvio viene rimandata finché non esegui in seguito `openclaw doctor --fix` e riavvii il gateway

La migrazione automatica copre:

- creazione o riuso di uno snapshot pre-migrazione sotto `~/Backups/openclaw-migrations/`
- riuso delle tue credenziali Matrix in cache
- mantenimento della stessa selezione account e della configurazione `channels.matrix`
- spostamento del più vecchio archivio sync Matrix flat nella posizione attuale con ambito account
- spostamento del più vecchio archivio crypto Matrix flat nella posizione attuale con ambito account quando l'account di destinazione può essere risolto in sicurezza
- estrazione di una chiave di decrittazione di backup delle chiavi delle stanze Matrix salvata in precedenza dal vecchio archivio crypto rust, quando quella chiave esiste localmente
- riuso della radice di storage del token-hash esistente più completa per lo stesso account Matrix, homeserver e utente quando l'access token cambia in seguito
- scansione delle radici sibling di storage del token-hash per metadati in sospeso di ripristino dello stato crittografato quando l'access token Matrix è cambiato ma l'identità account/dispositivo è rimasta la stessa
- ripristino delle chiavi delle stanze sottoposte a backup nel nuovo archivio crypto al successivo avvio Matrix

Dettagli dello snapshot:

- OpenClaw scrive un file marker in `~/.openclaw/matrix/migration-snapshot.json` dopo uno snapshot riuscito, così i passaggi successivi di avvio e riparazione possono riutilizzare lo stesso archivio.
- Questi snapshot automatici di migrazione Matrix eseguono il backup solo di configurazione + stato (`includeWorkspace: false`).
- Se Matrix ha solo stato di migrazione di tipo warning-only, ad esempio perché `userId` o `accessToken` sono ancora mancanti, OpenClaw non crea ancora lo snapshot perché nessuna mutazione Matrix è azionabile.
- Se il passaggio di snapshot fallisce, OpenClaw salta la migrazione Matrix per quell'esecuzione invece di modificare lo stato senza un punto di recupero.

Informazioni sugli aggiornamenti multi-account:

- il più vecchio archivio Matrix flat (`~/.openclaw/matrix/bot-storage.json` e `~/.openclaw/matrix/crypto/`) proveniva da un layout a singolo archivio, quindi OpenClaw può migrarlo solo verso una destinazione account Matrix risolta
- gli archivi Matrix legacy già con ambito account vengono rilevati e preparati per ogni account Matrix configurato

## Cosa la migrazione non può fare automaticamente

Il precedente Plugin pubblico Matrix **non** creava automaticamente backup delle chiavi delle stanze Matrix. Manteneva lo stato crypto locale e richiedeva la verifica del dispositivo, ma non garantiva che le chiavi delle stanze venissero sottoposte a backup sull'homeserver.

Questo significa che alcune installazioni crittografate possono essere migrate solo parzialmente.

OpenClaw non può recuperare automaticamente:

- chiavi delle stanze solo locali che non sono mai state sottoposte a backup
- stato crittografato quando l'account Matrix di destinazione non può ancora essere risolto perché `homeserver`, `userId` o `accessToken` sono ancora indisponibili
- migrazione automatica di un archivio Matrix flat condiviso quando sono configurati più account Matrix ma `channels.matrix.defaultAccount` non è impostato
- installazioni con percorso Plugin personalizzato bloccate su un percorso repository invece del pacchetto Matrix standard
- una recovery key mancante quando il vecchio archivio aveva chiavi sottoposte a backup ma non manteneva localmente la chiave di decrittazione

Ambito attuale degli avvisi:

- le installazioni Matrix con percorso Plugin personalizzato vengono segnalate sia dall'avvio del gateway sia da `openclaw doctor`

Se la tua vecchia installazione aveva cronologia crittografata solo locale che non è mai stata sottoposta a backup, alcuni messaggi crittografati più vecchi potrebbero restare illeggibili dopo l'aggiornamento.

## Flusso di aggiornamento consigliato

1. Aggiorna normalmente OpenClaw e il Plugin Matrix.
   Preferisci `openclaw update` semplice senza `--no-restart`, così l'avvio può completare immediatamente la migrazione Matrix.
2. Esegui:

   ```bash
   openclaw doctor --fix
   ```

   Se Matrix ha lavoro di migrazione azionabile, doctor creerà o riuserà prima lo snapshot pre-migrazione e stamperà il percorso dell'archivio.

3. Avvia o riavvia il gateway.
4. Controlla lo stato corrente di verifica e backup:

   ```bash
   openclaw matrix verify status
   openclaw matrix verify backup status
   ```

5. Se OpenClaw ti dice che è necessaria una recovery key, esegui:

   ```bash
   openclaw matrix verify backup restore --recovery-key "<your-recovery-key>"
   ```

6. Se questo dispositivo non è ancora verificato, esegui:

   ```bash
   openclaw matrix verify device "<your-recovery-key>"
   ```

7. Se stai intenzionalmente abbandonando la vecchia cronologia non recuperabile e vuoi una baseline di backup nuova per i messaggi futuri, esegui:

   ```bash
   openclaw matrix verify backup reset --yes
   ```

8. Se non esiste ancora alcun backup delle chiavi lato server, creane uno per i recuperi futuri:

   ```bash
   openclaw matrix verify bootstrap
   ```

## Come funziona la migrazione crittografata

La migrazione crittografata è un processo in due fasi:

1. L'avvio o `openclaw doctor --fix` crea o riusa lo snapshot pre-migrazione se la migrazione crittografata è azionabile.
2. L'avvio o `openclaw doctor --fix` ispeziona il vecchio archivio crypto Matrix tramite l'installazione attiva del Plugin Matrix.
3. Se viene trovata una chiave di decrittazione del backup, OpenClaw la scrive nel nuovo flusso della recovery key e contrassegna il ripristino della room-key come in sospeso.
4. Al successivo avvio Matrix, OpenClaw ripristina automaticamente nel nuovo archivio crypto le chiavi delle stanze sottoposte a backup.

Se il vecchio archivio segnala chiavi delle stanze che non sono mai state sottoposte a backup, OpenClaw avvisa invece di fingere che il recupero sia riuscito.

## Messaggi comuni e loro significato

### Messaggi di aggiornamento e rilevamento

`Matrix plugin upgraded in place.`

- Significato: il vecchio stato Matrix su disco è stato rilevato e migrato nel layout attuale.
- Cosa fare: nulla, a meno che lo stesso output non includa anche avvisi.

`Matrix migration snapshot created before applying Matrix upgrades.`

- Significato: OpenClaw ha creato un archivio di recupero prima di modificare lo stato Matrix.
- Cosa fare: conserva il percorso dell'archivio stampato finché non confermi che la migrazione è riuscita.

`Matrix migration snapshot reused before applying Matrix upgrades.`

- Significato: OpenClaw ha trovato un marker di snapshot di migrazione Matrix esistente e ha riutilizzato quell'archivio invece di creare un backup duplicato.
- Cosa fare: conserva il percorso dell'archivio stampato finché non confermi che la migrazione è riuscita.

`Legacy Matrix state detected at ... but channels.matrix is not configured yet.`

- Significato: esiste vecchio stato Matrix, ma OpenClaw non può mapparlo a un account Matrix corrente perché Matrix non è configurato.
- Cosa fare: configura `channels.matrix`, poi riesegui `openclaw doctor --fix` o riavvia il gateway.

`Legacy Matrix state detected at ... but the new account-scoped target could not be resolved yet (need homeserver, userId, and access token for channels.matrix...).`

- Significato: OpenClaw ha trovato il vecchio stato, ma non riesce ancora a determinare l'esatta radice corrente account/dispositivo.
- Cosa fare: avvia il gateway una volta con un login Matrix funzionante, oppure riesegui `openclaw doctor --fix` dopo che esistono credenziali in cache.

`Legacy Matrix state detected at ... but multiple Matrix accounts are configured and channels.matrix.defaultAccount is not set.`

- Significato: OpenClaw ha trovato un archivio Matrix flat condiviso, ma si rifiuta di indovinare quale account Matrix nominato debba riceverlo.
- Cosa fare: imposta `channels.matrix.defaultAccount` sull'account desiderato, poi riesegui `openclaw doctor --fix` o riavvia il gateway.

`Matrix legacy sync store not migrated because the target already exists (...)`

- Significato: la posizione attuale con ambito account ha già un archivio sync o crypto, quindi OpenClaw non l'ha sovrascritta automaticamente.
- Cosa fare: verifica che l'account corrente sia quello corretto prima di rimuovere o spostare manualmente la destinazione in conflitto.

`Failed migrating Matrix legacy sync store (...)` oppure `Failed migrating Matrix legacy crypto store (...)`

- Significato: OpenClaw ha provato a spostare il vecchio stato Matrix ma l'operazione sul filesystem è fallita.
- Cosa fare: ispeziona permessi del filesystem e stato del disco, poi riesegui `openclaw doctor --fix`.

`Legacy Matrix encrypted state detected at ... but channels.matrix is not configured yet.`

- Significato: OpenClaw ha trovato un vecchio archivio Matrix crittografato, ma non esiste una configurazione Matrix attuale a cui collegarlo.
- Cosa fare: configura `channels.matrix`, poi riesegui `openclaw doctor --fix` o riavvia il gateway.

`Legacy Matrix encrypted state detected at ... but the account-scoped target could not be resolved yet (need homeserver, userId, and access token for channels.matrix...).`

- Significato: l'archivio crittografato esiste, ma OpenClaw non può decidere in sicurezza a quale account/dispositivo corrente appartiene.
- Cosa fare: avvia il gateway una volta con un login Matrix funzionante, oppure riesegui `openclaw doctor --fix` dopo che le credenziali in cache sono disponibili.

`Legacy Matrix encrypted state detected at ... but multiple Matrix accounts are configured and channels.matrix.defaultAccount is not set.`

- Significato: OpenClaw ha trovato un archivio crypto legacy flat condiviso, ma si rifiuta di indovinare quale account Matrix nominato debba riceverlo.
- Cosa fare: imposta `channels.matrix.defaultAccount` sull'account desiderato, poi riesegui `openclaw doctor --fix` o riavvia il gateway.

`Matrix migration warnings are present, but no on-disk Matrix mutation is actionable yet. No pre-migration snapshot was needed.`

- Significato: OpenClaw ha rilevato vecchio stato Matrix, ma la migrazione è ancora bloccata da dati mancanti di identità o credenziali.
- Cosa fare: completa il login Matrix o la configurazione, poi riesegui `openclaw doctor --fix` o riavvia il gateway.

`Legacy Matrix encrypted state was detected, but the Matrix plugin helper is unavailable. Install or repair @openclaw/matrix so OpenClaw can inspect the old rust crypto store before upgrading.`

- Significato: OpenClaw ha trovato vecchio stato Matrix crittografato, ma non ha potuto caricare l'helper entrypoint dal Plugin Matrix che normalmente ispeziona quell'archivio.
- Cosa fare: reinstalla o ripara il Plugin Matrix (`openclaw plugins install @openclaw/matrix`, oppure `openclaw plugins install ./path/to/local/matrix-plugin` per un checkout del repository), poi riesegui `openclaw doctor --fix` o riavvia il gateway.

`Matrix plugin helper path is unsafe: ... Reinstall @openclaw/matrix and try again.`

- Significato: OpenClaw ha trovato un percorso file helper che esce dalla root del Plugin o non supera i controlli del confine del Plugin, quindi si è rifiutato di importarlo.
- Cosa fare: reinstalla il Plugin Matrix da un percorso attendibile, poi riesegui `openclaw doctor --fix` o riavvia il gateway.

`- Failed creating a Matrix migration snapshot before repair: ...`

`- Skipping Matrix migration changes for now. Resolve the snapshot failure, then rerun "openclaw doctor --fix".`

- Significato: OpenClaw si è rifiutato di modificare lo stato Matrix perché non è riuscito prima a creare lo snapshot di recupero.
- Cosa fare: risolvi l'errore di backup, poi riesegui `openclaw doctor --fix` o riavvia il gateway.

`Failed migrating legacy Matrix client storage: ...`

- Significato: il fallback lato client Matrix ha trovato vecchio storage flat, ma lo spostamento è fallito. OpenClaw ora interrompe quel fallback invece di avviarsi silenziosamente con un archivio nuovo.
- Cosa fare: ispeziona i permessi del filesystem o i conflitti, mantieni intatto il vecchio stato e riprova dopo aver corretto l'errore.

`Matrix is installed from a custom path: ...`

- Significato: Matrix è bloccato su un'installazione da percorso personalizzato, quindi gli aggiornamenti mainline non lo sostituiscono automaticamente con il pacchetto Matrix standard del repository.
- Cosa fare: reinstalla con `openclaw plugins install @openclaw/matrix` quando vuoi tornare al Plugin Matrix predefinito.

### Messaggi di recupero dello stato crittografato

`matrix: restored X/Y room key(s) from legacy encrypted-state backup`

- Significato: le chiavi delle stanze sottoposte a backup sono state ripristinate con successo nel nuovo archivio crypto.
- Cosa fare: di solito nulla.

`matrix: N legacy local-only room key(s) were never backed up and could not be restored automatically`

- Significato: alcune vecchie chiavi delle stanze esistevano solo nel vecchio archivio locale e non erano mai state caricate nel backup Matrix.
- Cosa fare: aspettati che parte della vecchia cronologia crittografata resti non disponibile, a meno che tu non possa recuperare manualmente quelle chiavi da un altro client verificato.

`Legacy Matrix encrypted state for account "..." has backed-up room keys, but no local backup decryption key was found. Ask the operator to run "openclaw matrix verify backup restore --recovery-key <key>" after upgrade if they have the recovery key.`

- Significato: il backup esiste, ma OpenClaw non è riuscito a recuperare automaticamente la recovery key.
- Cosa fare: esegui `openclaw matrix verify backup restore --recovery-key "<your-recovery-key>"`.

`Failed inspecting legacy Matrix encrypted state for account "..." (...): ...`

- Significato: OpenClaw ha trovato il vecchio archivio crittografato, ma non è riuscito a ispezionarlo in modo abbastanza sicuro da preparare il recupero.
- Cosa fare: riesegui `openclaw doctor --fix`. Se si ripete, mantieni intatta la vecchia directory di stato e recupera usando un altro client Matrix verificato più `openclaw matrix verify backup restore --recovery-key "<your-recovery-key>"`.

`Legacy Matrix backup key was found for account "...", but .../recovery-key.json already contains a different recovery key. Leaving the existing file unchanged.`

- Significato: OpenClaw ha rilevato un conflitto di backup key e si è rifiutato di sovrascrivere automaticamente il file recovery-key corrente.
- Cosa fare: verifica quale recovery key è corretta prima di ritentare qualsiasi comando di ripristino.

`Legacy Matrix encrypted state for account "..." cannot be fully converted automatically because the old rust crypto store does not expose all local room keys for export.`

- Significato: questo è il limite rigido del vecchio formato di archiviazione.
- Cosa fare: le chiavi sottoposte a backup possono comunque essere ripristinate, ma la cronologia crittografata solo locale potrebbe restare non disponibile.

`matrix: failed restoring room keys from legacy encrypted-state backup: ...`

- Significato: il nuovo Plugin ha tentato il ripristino ma Matrix ha restituito un errore.
- Cosa fare: esegui `openclaw matrix verify backup status`, poi ritenta con `openclaw matrix verify backup restore --recovery-key "<your-recovery-key>"` se necessario.

### Messaggi di recupero manuale

`Backup key is not loaded on this device. Run 'openclaw matrix verify backup restore' to load it and restore old room keys.`

- Significato: OpenClaw sa che dovresti avere una backup key, ma non è attiva su questo dispositivo.
- Cosa fare: esegui `openclaw matrix verify backup restore`, oppure passa `--recovery-key` se necessario.

`Store a recovery key with 'openclaw matrix verify device <key>', then run 'openclaw matrix verify backup restore'.`

- Significato: questo dispositivo attualmente non ha la recovery key memorizzata.
- Cosa fare: verifica prima il dispositivo con la tua recovery key, poi ripristina il backup.

`Backup key mismatch on this device. Re-run 'openclaw matrix verify device <key>' with the matching recovery key.`

- Significato: la chiave memorizzata non corrisponde al backup Matrix attivo.
- Cosa fare: riesegui `openclaw matrix verify device "<your-recovery-key>"` con la chiave corretta.

Se accetti di perdere la vecchia cronologia crittografata non recuperabile, puoi invece reimpostare la
baseline del backup corrente con `openclaw matrix verify backup reset --yes`. Quando il
secret di backup memorizzato è danneggiato, quel reset può anche ricreare il secret storage così la
nuova backup key può caricarsi correttamente dopo il riavvio.

`Backup trust chain is not verified on this device. Re-run 'openclaw matrix verify device <key>'.`

- Significato: il backup esiste, ma questo dispositivo non si fida ancora abbastanza della catena di cross-signing.
- Cosa fare: riesegui `openclaw matrix verify device "<your-recovery-key>"`.

`Matrix recovery key is required`

- Significato: hai provato un passaggio di recupero senza fornire una recovery key quando era richiesta.
- Cosa fare: riesegui il comando con la tua recovery key.

`Invalid Matrix recovery key: ...`

- Significato: la chiave fornita non può essere analizzata o non corrisponde al formato previsto.
- Cosa fare: riprova con l'esatta recovery key dal tuo client Matrix o dal file recovery-key.

`Matrix device is still unverified after applying recovery key. Verify your recovery key and ensure cross-signing is available.`

- Significato: la chiave è stata applicata, ma il dispositivo non è comunque riuscito a completare la verifica.
- Cosa fare: conferma di aver usato la chiave corretta e che il cross-signing sia disponibile sull'account, poi riprova.

`Matrix key backup is not active on this device after loading from secret storage.`

- Significato: il secret storage non ha prodotto una sessione di backup attiva su questo dispositivo.
- Cosa fare: verifica prima il dispositivo, poi ricontrolla con `openclaw matrix verify backup status`.

`Matrix crypto backend cannot load backup keys from secret storage. Verify this device with 'openclaw matrix verify device <key>' first.`

- Significato: questo dispositivo non può ripristinare dal secret storage finché la verifica del dispositivo non è completa.
- Cosa fare: esegui prima `openclaw matrix verify device "<your-recovery-key>"`.

### Messaggi relativi all'installazione del Plugin personalizzato

`Matrix is installed from a custom path that no longer exists: ...`

- Significato: il record di installazione del Plugin punta a un percorso locale che non esiste più.
- Cosa fare: reinstalla con `openclaw plugins install @openclaw/matrix`, oppure, se stai eseguendo da un checkout del repository, `openclaw plugins install ./path/to/local/matrix-plugin`.

## Se la cronologia crittografata ancora non torna

Esegui questi controlli in ordine:

```bash
openclaw matrix verify status --verbose
openclaw matrix verify backup status --verbose
openclaw matrix verify backup restore --recovery-key "<your-recovery-key>" --verbose
```

Se il backup viene ripristinato correttamente ma ad alcune vecchie stanze manca ancora la cronologia, probabilmente quelle chiavi mancanti non erano mai state sottoposte a backup dal Plugin precedente.

## Se vuoi ricominciare da zero per i messaggi futuri

Se accetti di perdere la vecchia cronologia crittografata non recuperabile e vuoi solo una baseline di backup pulita per il futuro, esegui questi comandi in ordine:

```bash
openclaw matrix verify backup reset --yes
openclaw matrix verify backup status --verbose
openclaw matrix verify status
```

Se dopo questo il dispositivo non è ancora verificato, completa la verifica dal tuo client Matrix confrontando le emoji SAS o i codici decimali e confermando che corrispondano.

## Pagine correlate

- [Matrix](/it/channels/matrix)
- [Doctor](/it/gateway/doctor)
- [Migrating](/it/install/migrating)
- [Plugins](/it/tools/plugin)
