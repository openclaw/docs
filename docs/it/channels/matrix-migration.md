---
read_when:
    - Aggiornamento di un'installazione Matrix esistente
    - Migrazione della cronologia Matrix crittografata e dello stato del dispositivo
summary: Come OpenClaw aggiorna direttamente il precedente Plugin Matrix, inclusi i limiti di ripristino dello stato cifrato e i passaggi di ripristino manuale.
title: Migrazione da Matrix
x-i18n:
    generated_at: "2026-04-30T08:37:53Z"
    model: gpt-5.5
    provider: openai
    source_hash: fff409eef1b7da7be4b63d8459a62b8365a04adf989f271a2f2c4aef46e90716
    source_path: channels/matrix-migration.md
    workflow: 16
---

Esegui l'upgrade dal Plugin pubblico `matrix` precedente all'implementazione attuale.

Per la maggior parte degli utenti, l'upgrade avviene in loco:

- il Plugin rimane `@openclaw/matrix`
- il canale rimane `matrix`
- la tua configurazione rimane sotto `channels.matrix`
- le credenziali memorizzate nella cache rimangono sotto `~/.openclaw/credentials/matrix/`
- lo stato di runtime rimane sotto `~/.openclaw/matrix/`

Non devi rinominare le chiavi di configurazione né reinstallare il Plugin con un nuovo nome.

## Cosa fa automaticamente la migrazione

Quando il Gateway si avvia, e quando esegui [`openclaw doctor --fix`](/it/gateway/doctor), OpenClaw prova a riparare automaticamente il vecchio stato Matrix.
Prima che qualsiasi passaggio di migrazione Matrix azionabile modifichi lo stato su disco, OpenClaw crea o riutilizza uno snapshot di ripristino mirato.

Quando usi `openclaw update`, l'attivazione esatta dipende da come è installato OpenClaw:

- le installazioni da sorgente eseguono `openclaw doctor --fix` durante il flusso di aggiornamento, poi riavviano il Gateway per impostazione predefinita
- le installazioni tramite gestore di pacchetti aggiornano il pacchetto, eseguono un passaggio doctor non interattivo, poi si affidano al riavvio predefinito del Gateway affinché l'avvio possa completare la migrazione Matrix
- se usi `openclaw update --no-restart`, la migrazione Matrix supportata dall'avvio viene rimandata fino a quando in seguito esegui `openclaw doctor --fix` e riavvii il Gateway

La migrazione automatica copre:

- la creazione o il riutilizzo di uno snapshot pre-migrazione sotto `~/Backups/openclaw-migrations/`
- il riutilizzo delle tue credenziali Matrix memorizzate nella cache
- il mantenimento della stessa selezione dell'account e della configurazione `channels.matrix`
- lo spostamento dello store di sincronizzazione Matrix piatto più vecchio nella posizione attuale con ambito account
- lo spostamento dello store crittografico Matrix piatto più vecchio nella posizione attuale con ambito account quando l'account di destinazione può essere risolto in modo sicuro
- l'estrazione di una chiave di decrittazione di backup delle chiavi stanza Matrix salvata in precedenza dal vecchio store crittografico rust, quando tale chiave esiste localmente
- il riutilizzo della radice di archiviazione con hash del token più completa esistente per lo stesso account Matrix, homeserver e utente quando il token di accesso cambia in seguito
- la scansione delle radici di archiviazione con hash del token adiacenti alla ricerca di metadati di ripristino dello stato crittografato in sospeso quando il token di accesso Matrix è cambiato ma l'identità account/dispositivo è rimasta la stessa
- il ripristino delle chiavi stanza sottoposte a backup nel nuovo store crittografico al successivo avvio Matrix

Dettagli dello snapshot:

- OpenClaw scrive un file marker in `~/.openclaw/matrix/migration-snapshot.json` dopo uno snapshot riuscito, così i passaggi successivi di avvio e riparazione possono riutilizzare lo stesso archivio.
- Questi snapshot automatici di migrazione Matrix eseguono il backup solo di configurazione + stato (`includeWorkspace: false`).
- Se Matrix ha solo uno stato di migrazione di avviso, per esempio perché `userId` o `accessToken` sono ancora mancanti, OpenClaw non crea ancora lo snapshot perché nessuna mutazione Matrix è azionabile.
- Se il passaggio dello snapshot non riesce, OpenClaw salta la migrazione Matrix per quell'esecuzione invece di modificare lo stato senza un punto di ripristino.

Informazioni sugli upgrade multi-account:

- lo store Matrix piatto più vecchio (`~/.openclaw/matrix/bot-storage.json` e `~/.openclaw/matrix/crypto/`) proveniva da un layout con un singolo store, quindi OpenClaw può migrarlo solo in una destinazione di account Matrix risolta
- gli store Matrix legacy già con ambito account vengono rilevati e preparati per ogni account Matrix configurato

## Cosa la migrazione non può fare automaticamente

Il Plugin Matrix pubblico precedente **non** creava automaticamente backup delle chiavi stanza Matrix. Manteneva lo stato crittografico locale e richiedeva la verifica del dispositivo, ma non garantiva che le tue chiavi stanza fossero sottoposte a backup sull'homeserver.

Questo significa che alcune installazioni crittografate possono essere migrate solo parzialmente.

OpenClaw non può recuperare automaticamente:

- chiavi stanza solo locali che non sono mai state sottoposte a backup
- stato crittografato quando l'account Matrix di destinazione non può ancora essere risolto perché `homeserver`, `userId` o `accessToken` non sono ancora disponibili
- la migrazione automatica di uno store Matrix piatto condiviso quando sono configurati più account Matrix ma `channels.matrix.defaultAccount` non è impostato
- installazioni del Plugin con percorso personalizzato fissate a un percorso di repository invece che al pacchetto Matrix standard
- una chiave di ripristino mancante quando il vecchio store aveva chiavi sottoposte a backup ma non conservava localmente la chiave di decrittazione

Ambito degli avvisi attuale:

- le installazioni del Plugin Matrix con percorso personalizzato vengono segnalate sia dall'avvio del Gateway sia da `openclaw doctor`

Se la tua vecchia installazione aveva cronologia crittografata solo locale che non è mai stata sottoposta a backup, alcuni messaggi crittografati più vecchi potrebbero rimanere illeggibili dopo l'upgrade.

## Flusso di upgrade consigliato

1. Aggiorna normalmente OpenClaw e il Plugin Matrix.
   Preferisci `openclaw update` semplice senza `--no-restart`, così l'avvio può completare subito la migrazione Matrix.
2. Esegui:

   ```bash
   openclaw doctor --fix
   ```

   Se Matrix ha lavoro di migrazione azionabile, doctor creerà o riutilizzerà prima lo snapshot pre-migrazione e stamperà il percorso dell'archivio.

3. Avvia o riavvia il Gateway.
4. Controlla lo stato attuale di verifica e backup:

   ```bash
   openclaw matrix verify status
   openclaw matrix verify backup status
   ```

5. Inserisci la chiave di ripristino per l'account Matrix che stai riparando in una variabile di ambiente specifica per l'account. Per un singolo account predefinito, `MATRIX_RECOVERY_KEY` va bene. Per più account, usa una variabile per account, per esempio `MATRIX_RECOVERY_KEY_ASSISTANT`, e aggiungi `--account assistant` al comando.

6. Se OpenClaw ti dice che è necessaria una chiave di ripristino, esegui il comando per l'account corrispondente:

   ```bash
   printf '%s\n' "$MATRIX_RECOVERY_KEY" | openclaw matrix verify backup restore --recovery-key-stdin
   printf '%s\n' "$MATRIX_RECOVERY_KEY_ASSISTANT" | openclaw matrix verify backup restore --recovery-key-stdin --account assistant
   ```

7. Se questo dispositivo è ancora non verificato, esegui il comando per l'account corrispondente:

   ```bash
   printf '%s\n' "$MATRIX_RECOVERY_KEY" | openclaw matrix verify device --recovery-key-stdin
   printf '%s\n' "$MATRIX_RECOVERY_KEY_ASSISTANT" | openclaw matrix verify device --recovery-key-stdin --account assistant
   ```

   Se la chiave di ripristino viene accettata e il backup è utilizzabile, ma `Cross-signing verified`
   è ancora `no`, completa l'autoverifica da un altro client Matrix:

   ```bash
   openclaw matrix verify self
   ```

   Accetta la richiesta in un altro client Matrix, confronta le emoji o i decimali,
   e digita `yes` solo quando corrispondono. Il comando termina correttamente solo
   dopo che `Cross-signing verified` diventa `yes`.

8. Se stai abbandonando intenzionalmente la vecchia cronologia non recuperabile e vuoi una nuova baseline di backup per i messaggi futuri, esegui:

   ```bash
   openclaw matrix verify backup reset --yes
   ```

9. Se non esiste ancora alcun backup delle chiavi lato server, creane uno per i ripristini futuri:

   ```bash
   openclaw matrix verify bootstrap
   ```

## Come funziona la migrazione crittografata

La migrazione crittografata è un processo in due fasi:

1. L'avvio o `openclaw doctor --fix` crea o riutilizza lo snapshot pre-migrazione se la migrazione crittografata è azionabile.
2. L'avvio o `openclaw doctor --fix` ispeziona il vecchio store crittografico Matrix tramite l'installazione attiva del Plugin Matrix.
3. Se viene trovata una chiave di decrittazione del backup, OpenClaw la scrive nel nuovo flusso della chiave di ripristino e contrassegna il ripristino delle chiavi stanza come in sospeso.
4. Al successivo avvio Matrix, OpenClaw ripristina automaticamente le chiavi stanza sottoposte a backup nel nuovo store crittografico.

Se il vecchio store segnala chiavi stanza che non sono mai state sottoposte a backup, OpenClaw avvisa invece di fingere che il ripristino sia riuscito.

## Messaggi comuni e cosa significano

### Messaggi di upgrade e rilevamento

`Matrix plugin upgraded in place.`

- Significato: il vecchio stato Matrix su disco è stato rilevato e migrato nel layout attuale.
- Cosa fare: nulla, a meno che lo stesso output includa anche avvisi.

`Matrix migration snapshot created before applying Matrix upgrades.`

- Significato: OpenClaw ha creato un archivio di ripristino prima di modificare lo stato Matrix.
- Cosa fare: conserva il percorso dell'archivio stampato finché non confermi che la migrazione è riuscita.

`Matrix migration snapshot reused before applying Matrix upgrades.`

- Significato: OpenClaw ha trovato un marker di snapshot di migrazione Matrix esistente e ha riutilizzato quell'archivio invece di creare un backup duplicato.
- Cosa fare: conserva il percorso dell'archivio stampato finché non confermi che la migrazione è riuscita.

`Legacy Matrix state detected at ... but channels.matrix is not configured yet.`

- Significato: esiste un vecchio stato Matrix, ma OpenClaw non può associarlo a un account Matrix attuale perché Matrix non è configurato.
- Cosa fare: configura `channels.matrix`, poi riesegui `openclaw doctor --fix` o riavvia il Gateway.

`Legacy Matrix state detected at ... but the new account-scoped target could not be resolved yet (need homeserver, userId, and access token for channels.matrix...).`

- Significato: OpenClaw ha trovato un vecchio stato, ma non può ancora determinare l'esatta radice account/dispositivo attuale.
- Cosa fare: avvia una volta il Gateway con un login Matrix funzionante, oppure riesegui `openclaw doctor --fix` dopo che le credenziali memorizzate nella cache esistono.

`Legacy Matrix state detected at ... but multiple Matrix accounts are configured and channels.matrix.defaultAccount is not set.`

- Significato: OpenClaw ha trovato uno store Matrix piatto condiviso, ma rifiuta di indovinare quale account Matrix nominato debba riceverlo.
- Cosa fare: imposta `channels.matrix.defaultAccount` sull'account previsto, poi riesegui `openclaw doctor --fix` o riavvia il Gateway.

`Matrix legacy sync store not migrated because the target already exists (...)`

- Significato: la nuova posizione con ambito account ha già uno store di sincronizzazione o crittografico, quindi OpenClaw non lo ha sovrascritto automaticamente.
- Cosa fare: verifica che l'account attuale sia quello corretto prima di rimuovere o spostare manualmente la destinazione in conflitto.

`Failed migrating Matrix legacy sync store (...)` o `Failed migrating Matrix legacy crypto store (...)`

- Significato: OpenClaw ha provato a spostare il vecchio stato Matrix ma l'operazione sul filesystem non è riuscita.
- Cosa fare: controlla i permessi del filesystem e lo stato del disco, poi riesegui `openclaw doctor --fix`.

`Legacy Matrix encrypted state detected at ... but channels.matrix is not configured yet.`

- Significato: OpenClaw ha trovato un vecchio store Matrix crittografato, ma non esiste una configurazione Matrix attuale a cui collegarlo.
- Cosa fare: configura `channels.matrix`, poi riesegui `openclaw doctor --fix` o riavvia il Gateway.

`Legacy Matrix encrypted state detected at ... but the account-scoped target could not be resolved yet (need homeserver, userId, and access token for channels.matrix...).`

- Significato: lo store crittografato esiste, ma OpenClaw non può decidere in modo sicuro a quale account/dispositivo attuale appartenga.
- Cosa fare: avvia una volta il Gateway con un login Matrix funzionante, oppure riesegui `openclaw doctor --fix` dopo che le credenziali memorizzate nella cache sono disponibili.

`Legacy Matrix encrypted state detected at ... but multiple Matrix accounts are configured and channels.matrix.defaultAccount is not set.`

- Significato: OpenClaw ha trovato uno store crittografico legacy piatto condiviso, ma rifiuta di indovinare quale account Matrix nominato debba riceverlo.
- Cosa fare: imposta `channels.matrix.defaultAccount` sull'account previsto, poi riesegui `openclaw doctor --fix` o riavvia il Gateway.

`Matrix migration warnings are present, but no on-disk Matrix mutation is actionable yet. No pre-migration snapshot was needed.`

- Significato: OpenClaw ha rilevato un vecchio stato Matrix, ma la migrazione è ancora bloccata da dati di identità o credenziali mancanti.
- Cosa fare: completa il login Matrix o la configurazione, poi riesegui `openclaw doctor --fix` o riavvia il Gateway.

`Legacy Matrix encrypted state was detected, but the Matrix plugin helper is unavailable. Install or repair @openclaw/matrix so OpenClaw can inspect the old rust crypto store before upgrading.`

- Significato: OpenClaw ha trovato un vecchio stato Matrix crittografato, ma non è riuscito a caricare l'entrypoint helper dal plugin Matrix che normalmente ispeziona quello store.
- Cosa fare: reinstalla o ripara il plugin Matrix (`openclaw plugins install @openclaw/matrix`, oppure `openclaw plugins install ./path/to/local/matrix-plugin` per un checkout del repository), quindi riesegui `openclaw doctor --fix` o riavvia il gateway.
- Se npm segnala il pacchetto Matrix di proprietà di OpenClaw come deprecato, usa il
  plugin incluso in una build OpenClaw pacchettizzata corrente oppure il percorso
  del checkout locale finché non viene pubblicato un pacchetto npm più recente.

`Matrix plugin helper path is unsafe: ... Reinstall @openclaw/matrix and try again.`

- Significato: OpenClaw ha trovato un percorso di file helper che esce dalla root del plugin o non supera i controlli dei confini del plugin, quindi ha rifiutato di importarlo.
- Cosa fare: reinstalla il plugin Matrix da un percorso attendibile, quindi riesegui `openclaw doctor --fix` o riavvia il gateway.

`- Failed creating a Matrix migration snapshot before repair: ...`

`- Skipping Matrix migration changes for now. Resolve the snapshot failure, then rerun "openclaw doctor --fix".`

- Significato: OpenClaw ha rifiutato di modificare lo stato Matrix perché non è riuscito prima a creare lo snapshot di ripristino.
- Cosa fare: risolvi l'errore di backup, quindi riesegui `openclaw doctor --fix` o riavvia il gateway.

`Failed migrating legacy Matrix client storage: ...`

- Significato: il fallback lato client Matrix ha trovato un vecchio storage piatto, ma lo spostamento non è riuscito. Ora OpenClaw interrompe quel fallback invece di avviarsi silenziosamente con uno store nuovo.
- Cosa fare: controlla i permessi o i conflitti del filesystem, mantieni intatto il vecchio stato e riprova dopo aver corretto l'errore.

`Matrix is installed from a custom path: ...`

- Significato: Matrix è vincolato a un'installazione da percorso, quindi gli aggiornamenti mainline non lo sostituiscono automaticamente con il pacchetto Matrix standard del repository.
- Cosa fare: reinstalla con `openclaw plugins install @openclaw/matrix` quando vuoi tornare al plugin Matrix predefinito.
- Se npm segnala il pacchetto Matrix di proprietà di OpenClaw come deprecato, usa il
  plugin incluso in una build OpenClaw pacchettizzata corrente finché non viene
  pubblicato un pacchetto npm più recente.

### Messaggi di ripristino dello stato crittografato

`matrix: restored X/Y room key(s) from legacy encrypted-state backup`

- Significato: le chiavi delle stanze salvate nel backup sono state ripristinate correttamente nel nuovo store crittografico.
- Cosa fare: di solito nulla.

`matrix: N legacy local-only room key(s) were never backed up and could not be restored automatically`

- Significato: alcune vecchie chiavi delle stanze esistevano solo nel vecchio store locale e non erano mai state caricate nel backup Matrix.
- Cosa fare: aspettati che parte della vecchia cronologia crittografata resti non disponibile, a meno che tu non possa recuperare manualmente quelle chiavi da un altro client verificato.

`Legacy Matrix encrypted state for account "..." has backed-up room keys, but no local backup decryption key was found. Ask the operator to run "openclaw matrix verify backup restore --recovery-key-stdin" after upgrade if they have the recovery key.`

- Significato: il backup esiste, ma OpenClaw non è riuscito a recuperare automaticamente la chiave di ripristino.
- Cosa fare: esegui `printf '%s\n' "$MATRIX_RECOVERY_KEY" | openclaw matrix verify backup restore --recovery-key-stdin`.

`Failed inspecting legacy Matrix encrypted state for account "..." (...): ...`

- Significato: OpenClaw ha trovato il vecchio store crittografato, ma non è riuscito a ispezionarlo in modo sufficientemente sicuro per preparare il ripristino.
- Cosa fare: riesegui `openclaw doctor --fix`. Se si ripete, mantieni intatta la directory del vecchio stato e recupera usando un altro client Matrix verificato più `printf '%s\n' "$MATRIX_RECOVERY_KEY" | openclaw matrix verify backup restore --recovery-key-stdin`.

`Legacy Matrix backup key was found for account "...", but .../recovery-key.json already contains a different recovery key. Leaving the existing file unchanged.`

- Significato: OpenClaw ha rilevato un conflitto tra chiavi di backup e ha rifiutato di sovrascrivere automaticamente il file della chiave di ripristino corrente.
- Cosa fare: verifica quale chiave di ripristino è corretta prima di ritentare qualsiasi comando di ripristino.

`Legacy Matrix encrypted state for account "..." cannot be fully converted automatically because the old rust crypto store does not expose all local room keys for export.`

- Significato: questo è il limite rigido del vecchio formato di storage.
- Cosa fare: le chiavi salvate nel backup possono comunque essere ripristinate, ma la cronologia crittografata solo locale potrebbe restare non disponibile.

`matrix: failed restoring room keys from legacy encrypted-state backup: ...`

- Significato: il nuovo plugin ha tentato il ripristino, ma Matrix ha restituito un errore.
- Cosa fare: esegui `openclaw matrix verify backup status`, quindi ritenta con `printf '%s\n' "$MATRIX_RECOVERY_KEY" | openclaw matrix verify backup restore --recovery-key-stdin` se necessario.

### Messaggi di ripristino manuale

`Backup key is not loaded on this device. Run 'openclaw matrix verify backup restore' to load it and restore old room keys.`

- Significato: OpenClaw sa che dovresti avere una chiave di backup, ma non è attiva su questo dispositivo.
- Cosa fare: esegui `openclaw matrix verify backup restore`, oppure imposta `MATRIX_RECOVERY_KEY` ed esegui `printf '%s\n' "$MATRIX_RECOVERY_KEY" | openclaw matrix verify backup restore --recovery-key-stdin` se necessario.

`Store a recovery key with 'openclaw matrix verify device --recovery-key-stdin', then run 'openclaw matrix verify backup restore'.`

- Significato: questo dispositivo al momento non ha la chiave di ripristino memorizzata.
- Cosa fare: imposta `MATRIX_RECOVERY_KEY`, esegui `printf '%s\n' "$MATRIX_RECOVERY_KEY" | openclaw matrix verify device --recovery-key-stdin`, quindi ripristina il backup.

`Backup key mismatch on this device. Re-run 'openclaw matrix verify device --recovery-key-stdin' with the matching recovery key.`

- Significato: la chiave memorizzata non corrisponde al backup Matrix attivo.
- Cosa fare: imposta `MATRIX_RECOVERY_KEY` sulla chiave corretta ed esegui `printf '%s\n' "$MATRIX_RECOVERY_KEY" | openclaw matrix verify device --recovery-key-stdin`.

Se accetti di perdere la vecchia cronologia crittografata non recuperabile, puoi invece reimpostare la
baseline del backup corrente con `openclaw matrix verify backup reset --yes`. Quando il
segreto di backup memorizzato è corrotto, quel reset può anche ricreare lo storage dei segreti in modo che la
nuova chiave di backup possa caricarsi correttamente dopo il riavvio.

`Backup trust chain is not verified on this device. Re-run 'openclaw matrix verify device --recovery-key-stdin'.`

- Significato: il backup esiste, ma questo dispositivo non considera ancora sufficientemente attendibile la catena di firma incrociata.
- Cosa fare: imposta `MATRIX_RECOVERY_KEY` ed esegui `printf '%s\n' "$MATRIX_RECOVERY_KEY" | openclaw matrix verify device --recovery-key-stdin`.

`Matrix recovery key is required`

- Significato: hai provato un passaggio di ripristino senza fornire una chiave di ripristino quando era richiesta.
- Cosa fare: riesegui il comando con `--recovery-key-stdin`, ad esempio `printf '%s\n' "$MATRIX_RECOVERY_KEY" | openclaw matrix verify device --recovery-key-stdin`.

`Invalid Matrix recovery key: ...`

- Significato: la chiave fornita non è stata analizzata correttamente o non corrispondeva al formato previsto.
- Cosa fare: riprova con la chiave di ripristino esatta dal tuo client Matrix o dal file della chiave di ripristino.

`Matrix recovery key was applied, but this device still lacks full Matrix identity trust.`

- Significato: OpenClaw è riuscito ad applicare la chiave di ripristino, ma Matrix non ha ancora
  stabilito la piena attendibilità dell'identità con firma incrociata per questo dispositivo. Controlla
  l'output del comando per `Recovery key accepted`, `Backup usable`,
  `Cross-signing verified` e `Device verified by owner`.
- Cosa fare: esegui `openclaw matrix verify self`, accetta la richiesta in un altro
  client Matrix, confronta il SAS e digita `yes` solo quando corrisponde. Il
  comando attende la piena attendibilità dell'identità Matrix prima di segnalare il successo. Usa
  `printf '%s\n' "$MATRIX_RECOVERY_KEY" | openclaw matrix verify bootstrap --recovery-key-stdin --force-reset-cross-signing`
  solo quando vuoi intenzionalmente sostituire l'identità di firma incrociata corrente.

`Matrix key backup is not active on this device after loading from secret storage.`

- Significato: lo storage dei segreti non ha prodotto una sessione di backup attiva su questo dispositivo.
- Cosa fare: verifica prima il dispositivo, quindi ricontrolla con `openclaw matrix verify backup status`.

`Matrix crypto backend cannot load backup keys from secret storage. Verify this device with 'openclaw matrix verify device --recovery-key-stdin' first.`

- Significato: questo dispositivo non può ripristinare dallo storage dei segreti finché la verifica del dispositivo non è completa.
- Cosa fare: esegui prima `printf '%s\n' "$MATRIX_RECOVERY_KEY" | openclaw matrix verify device --recovery-key-stdin`.

### Messaggi di installazione di plugin personalizzati

`Matrix is installed from a custom path that no longer exists: ...`

- Significato: il record di installazione del plugin punta a un percorso locale che non esiste più.
- Cosa fare: reinstalla con `openclaw plugins install @openclaw/matrix`, oppure, se stai eseguendo da un checkout del repository, `openclaw plugins install ./path/to/local/matrix-plugin`.
- Se npm segnala il pacchetto Matrix di proprietà di OpenClaw come deprecato, usa il
  plugin incluso in una build OpenClaw pacchettizzata corrente oppure il percorso
  del checkout locale finché non viene pubblicato un pacchetto npm più recente.

## Se la cronologia crittografata continua a non tornare

Esegui questi controlli nell'ordine:

```bash
openclaw matrix verify status --verbose
openclaw matrix verify backup status --verbose
printf '%s\n' "$MATRIX_RECOVERY_KEY" | openclaw matrix verify backup restore --recovery-key-stdin --verbose
```

Se il backup viene ripristinato correttamente ma in alcune vecchie stanze manca ancora la cronologia, probabilmente quelle chiavi mancanti non erano mai state salvate nel backup dal plugin precedente.

## Se vuoi ricominciare da capo per i messaggi futuri

Se accetti di perdere la vecchia cronologia crittografata non recuperabile e vuoi solo una baseline di backup pulita da qui in avanti, esegui questi comandi nell'ordine:

```bash
openclaw matrix verify backup reset --yes
openclaw matrix verify backup status --verbose
openclaw matrix verify status
```

Se dopo questo il dispositivo è ancora non verificato, completa la verifica dal tuo client Matrix confrontando gli emoji SAS o i codici decimali e confermando che corrispondono.

## Correlati

- [Matrix](/it/channels/matrix): configurazione del canale.
- [Regole push Matrix](/it/channels/matrix-push-rules): instradamento delle notifiche.
- [Doctor](/it/gateway/doctor): controllo di integrità e trigger di migrazione automatica.
- [Guida alla migrazione](/it/install/migrating): tutti i percorsi di migrazione (spostamenti di macchina, importazioni tra sistemi).
- [Plugin](/it/tools/plugin): installazione e registrazione dei plugin.
