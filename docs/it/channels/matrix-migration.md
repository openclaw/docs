---
read_when:
    - Aggiornamento di un'installazione Matrix esistente
    - Migrazione della cronologia Matrix crittografata e dello stato del dispositivo
summary: Come OpenClaw aggiorna in loco il Plugin Matrix precedente, inclusi i limiti di ripristino dello stato crittografato e i passaggi di ripristino manuale.
title: Migrazione di Matrix
x-i18n:
    generated_at: "2026-06-27T17:11:45Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 796d27aa3f08388b78e005d5e93ee4a04bc9ae9bb1f214b83c3ba19165042755
    source_path: channels/matrix-migration.md
    workflow: 16
---

Esegui l'upgrade dal precedente plugin pubblico `matrix` all'implementazione attuale.

Per la maggior parte degli utenti, l'upgrade avviene sul posto:

- il plugin resta `@openclaw/matrix`
- il canale resta `matrix`
- la tua configurazione resta sotto `channels.matrix`
- le credenziali nella cache restano sotto `~/.openclaw/credentials/matrix/`
- lo stato di runtime resta sotto `~/.openclaw/matrix/`

Non devi rinominare le chiavi di configurazione né reinstallare il plugin con un nuovo nome.
Il pacchetto root `openclaw` non include più codice di runtime Matrix o dipendenze Matrix SDK. Se `openclaw channels status` mostra che Matrix è configurato ma il plugin manca dopo un aggiornamento, esegui `openclaw doctor --fix` oppure `openclaw plugins install @openclaw/matrix`; non installare pacchetti Matrix SDK nel pacchetto root OpenClaw.

## Cosa fa automaticamente la migrazione

Quando il gateway si avvia, e quando esegui [`openclaw doctor --fix`](/it/gateway/doctor), OpenClaw prova a riparare automaticamente il vecchio stato Matrix.
Prima che qualsiasi passaggio di migrazione Matrix eseguibile modifichi lo stato su disco, OpenClaw crea o riusa uno snapshot di ripristino mirato.

Quando usi `openclaw update`, il trigger esatto dipende da come è installato OpenClaw:

- le installazioni da sorgente eseguono `openclaw doctor --fix` durante il flusso di aggiornamento, poi riavviano il gateway per impostazione predefinita
- le installazioni tramite gestore di pacchetti aggiornano il pacchetto, eseguono un passaggio doctor non interattivo, poi si affidano al riavvio predefinito del gateway così l'avvio può completare la migrazione Matrix
- se usi `openclaw update --no-restart`, la migrazione Matrix supportata dall'avvio viene rimandata finché non esegui in seguito `openclaw doctor --fix` e riavvii il gateway

La migrazione automatica copre:

- la creazione o il riuso di uno snapshot pre-migrazione sotto `~/Backups/openclaw-migrations/`
- il riuso delle credenziali Matrix nella cache
- il mantenimento della stessa selezione dell'account e della configurazione `channels.matrix`
- lo spostamento dell'archivio di sincronizzazione Matrix piatto più vecchio nella posizione attuale con ambito account
- lo spostamento dell'archivio crittografico Matrix piatto più vecchio nella posizione attuale con ambito account quando l'account di destinazione può essere risolto in modo sicuro
- l'estrazione di una chiave di decifratura per backup delle chiavi stanza Matrix salvata in precedenza dal vecchio archivio crittografico Rust, quando quella chiave esiste localmente
- il riuso della root di archiviazione con hash del token più completa esistente per lo stesso account Matrix, homeserver e utente quando il token di accesso cambia in seguito
- la scansione delle root di archiviazione sorelle con hash del token per metadati di ripristino dello stato cifrato in sospeso quando il token di accesso Matrix è cambiato ma l'identità dell'account/dispositivo è rimasta la stessa
- il ripristino delle chiavi stanza salvate in backup nel nuovo archivio crittografico al successivo avvio di Matrix

Dettagli dello snapshot:

- OpenClaw scrive un file marker in `~/.openclaw/matrix/migration-snapshot.json` dopo uno snapshot riuscito, così i passaggi successivi di avvio e riparazione possono riusare lo stesso archivio.
- Questi snapshot automatici di migrazione Matrix eseguono il backup solo di configurazione + stato (`includeWorkspace: false`).
- Se Matrix ha solo stato di migrazione con avvisi, per esempio perché `userId` o `accessToken` manca ancora, OpenClaw non crea ancora lo snapshot perché nessuna mutazione Matrix è eseguibile.
- Se il passaggio di snapshot non riesce, OpenClaw salta la migrazione Matrix per quell'esecuzione invece di modificare lo stato senza un punto di ripristino.

Informazioni sugli upgrade multi-account:

- l'archivio Matrix piatto più vecchio (`~/.openclaw/matrix/bot-storage.json` e `~/.openclaw/matrix/crypto/`) proveniva da un layout a singolo archivio, quindi OpenClaw può migrarlo solo in una destinazione account Matrix risolta
- gli archivi Matrix legacy già con ambito account vengono rilevati e preparati per ogni account Matrix configurato

## Cosa non può fare automaticamente la migrazione

Il precedente plugin pubblico Matrix **non** creava automaticamente backup delle chiavi stanza Matrix. Manteneva lo stato crittografico locale e richiedeva la verifica del dispositivo, ma non garantiva che le chiavi stanza fossero salvate in backup sull'homeserver.

Questo significa che alcune installazioni cifrate possono essere migrate solo parzialmente.

OpenClaw non può recuperare automaticamente:

- chiavi stanza solo locali che non sono mai state salvate in backup
- stato cifrato quando l'account Matrix di destinazione non può ancora essere risolto perché `homeserver`, `userId` o `accessToken` non sono ancora disponibili
- migrazione automatica di un archivio Matrix piatto condiviso quando sono configurati più account Matrix ma `channels.matrix.defaultAccount` non è impostato
- installazioni del plugin con percorso personalizzato bloccate su un percorso repo invece del pacchetto Matrix standard
- una chiave di ripristino mancante quando il vecchio archivio aveva chiavi salvate in backup ma non conservava localmente la chiave di decifratura

Ambito attuale degli avvisi:

- le installazioni del plugin Matrix con percorso personalizzato vengono segnalate sia dall'avvio del gateway sia da `openclaw doctor`

Se la tua vecchia installazione aveva cronologia cifrata solo locale che non è mai stata salvata in backup, alcuni vecchi messaggi cifrati potrebbero restare illeggibili dopo l'upgrade.

## Flusso di upgrade consigliato

1. Aggiorna normalmente OpenClaw e il plugin Matrix.
   Preferisci `openclaw update` semplice senza `--no-restart` così l'avvio può completare subito la migrazione Matrix.
2. Esegui:

   ```bash
   openclaw doctor --fix
   ```

   Se Matrix ha lavoro di migrazione eseguibile, doctor creerà o riuserà prima lo snapshot pre-migrazione e stamperà il percorso dell'archivio.

3. Avvia o riavvia il gateway.
4. Controlla lo stato attuale di verifica e backup:

   ```bash
   openclaw matrix verify status
   openclaw matrix verify backup status
   ```

5. Inserisci la chiave di ripristino per l'account Matrix che stai riparando in una variabile d'ambiente specifica per account. Per un singolo account predefinito, `MATRIX_RECOVERY_KEY` va bene. Per più account, usa una variabile per account, per esempio `MATRIX_RECOVERY_KEY_ASSISTANT`, e aggiungi `--account assistant` al comando.

6. Se OpenClaw ti dice che serve una chiave di ripristino, esegui il comando per l'account corrispondente:

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

   Accetta la richiesta in un altro client Matrix, confronta emoji o decimali,
   e digita `yes` solo quando corrispondono. Il comando termina con successo solo
   dopo che `Cross-signing verified` diventa `yes`.

8. Se stai abbandonando intenzionalmente la vecchia cronologia irrecuperabile e vuoi una nuova baseline di backup per i messaggi futuri, esegui:

   ```bash
   openclaw matrix verify backup reset --yes
   ```

9. Se non esiste ancora un backup delle chiavi lato server, creane uno per i ripristini futuri:

   ```bash
   openclaw matrix verify bootstrap
   ```

## Come funziona la migrazione cifrata

La migrazione cifrata è un processo in due fasi:

1. L'avvio o `openclaw doctor --fix` crea o riusa lo snapshot pre-migrazione se la migrazione cifrata è eseguibile.
2. L'avvio o `openclaw doctor --fix` ispeziona il vecchio archivio crittografico Matrix tramite l'installazione attiva del plugin Matrix.
3. Se viene trovata una chiave di decifratura del backup, OpenClaw la scrive nel nuovo flusso della chiave di ripristino e contrassegna il ripristino delle chiavi stanza come in sospeso.
4. Al successivo avvio di Matrix, OpenClaw ripristina automaticamente le chiavi stanza salvate in backup nel nuovo archivio crittografico.

Se il vecchio archivio segnala chiavi stanza che non sono mai state salvate in backup, OpenClaw mostra un avviso invece di fingere che il ripristino sia riuscito.

## Messaggi comuni e cosa significano

### Messaggi di upgrade e rilevamento

`Matrix plugin upgraded in place.`

- Significato: il vecchio stato Matrix su disco è stato rilevato e migrato nel layout attuale.
- Cosa fare: nulla, a meno che lo stesso output includa anche avvisi.

`Matrix migration snapshot created before applying Matrix upgrades.`

- Significato: OpenClaw ha creato un archivio di ripristino prima di modificare lo stato Matrix.
- Cosa fare: conserva il percorso dell'archivio stampato finché non confermi che la migrazione è riuscita.

`Matrix migration snapshot reused before applying Matrix upgrades.`

- Significato: OpenClaw ha trovato un marker di snapshot di migrazione Matrix esistente e ha riusato quell'archivio invece di creare un backup duplicato.
- Cosa fare: conserva il percorso dell'archivio stampato finché non confermi che la migrazione è riuscita.

`Legacy Matrix state detected at ... but channels.matrix is not configured yet.`

- Significato: esiste un vecchio stato Matrix, ma OpenClaw non può mapparlo a un account Matrix attuale perché Matrix non è configurato.
- Cosa fare: configura `channels.matrix`, poi riesegui `openclaw doctor --fix` o riavvia il gateway.

`Legacy Matrix state detected at ... but the new account-scoped target could not be resolved yet (need homeserver, userId, and access token for channels.matrix...).`

- Significato: OpenClaw ha trovato vecchio stato, ma non riesce ancora a determinare la root esatta dell'account/dispositivo attuale.
- Cosa fare: avvia una volta il gateway con un login Matrix funzionante, oppure riesegui `openclaw doctor --fix` dopo che esistono credenziali nella cache.

`Legacy Matrix state detected at ... but multiple Matrix accounts are configured and channels.matrix.defaultAccount is not set.`

- Significato: OpenClaw ha trovato un archivio Matrix piatto condiviso, ma rifiuta di indovinare quale account Matrix nominato dovrebbe riceverlo.
- Cosa fare: imposta `channels.matrix.defaultAccount` sull'account previsto, poi riesegui `openclaw doctor --fix` o riavvia il gateway.

`Matrix legacy sync store not migrated because the target already exists (...)`

- Significato: la nuova posizione con ambito account ha già un archivio di sincronizzazione o crittografico, quindi OpenClaw non lo ha sovrascritto automaticamente.
- Cosa fare: verifica che l'account attuale sia quello corretto prima di rimuovere o spostare manualmente la destinazione in conflitto.

`Failed migrating Matrix legacy sync store (...)` o `Failed migrating Matrix legacy crypto store (...)`

- Significato: OpenClaw ha provato a spostare il vecchio stato Matrix ma l'operazione sul filesystem non è riuscita.
- Cosa fare: controlla i permessi del filesystem e lo stato del disco, poi riesegui `openclaw doctor --fix`.

`Legacy Matrix encrypted state detected at ... but channels.matrix is not configured yet.`

- Significato: OpenClaw ha trovato un vecchio archivio Matrix cifrato, ma non esiste una configurazione Matrix attuale a cui collegarlo.
- Cosa fare: configura `channels.matrix`, poi riesegui `openclaw doctor --fix` o riavvia il gateway.

`Legacy Matrix encrypted state detected at ... but the account-scoped target could not be resolved yet (need homeserver, userId, and access token for channels.matrix...).`

- Significato: l'archivio cifrato esiste, ma OpenClaw non può decidere in sicurezza a quale account/dispositivo attuale appartiene.
- Cosa fare: avvia una volta il gateway con un login Matrix funzionante, oppure riesegui `openclaw doctor --fix` dopo che le credenziali nella cache sono disponibili.

`Legacy Matrix encrypted state detected at ... but multiple Matrix accounts are configured and channels.matrix.defaultAccount is not set.`

- Significato: OpenClaw ha trovato un archivio crittografico legacy piatto condiviso, ma rifiuta di indovinare quale account Matrix nominato dovrebbe riceverlo.
- Cosa fare: imposta `channels.matrix.defaultAccount` sull'account previsto, poi riesegui `openclaw doctor --fix` o riavvia il gateway.

`Matrix migration warnings are present, but no on-disk Matrix mutation is actionable yet. No pre-migration snapshot was needed.`

- Significato: OpenClaw ha rilevato vecchio stato Matrix, ma la migrazione è ancora bloccata da dati di identità o credenziali mancanti.
- Cosa fare: completa il login Matrix o la configurazione, poi riesegui `openclaw doctor --fix` o riavvia il gateway.

`Legacy Matrix encrypted state was detected, but the Matrix plugin helper is unavailable. Install or repair @openclaw/matrix so OpenClaw can inspect the old rust crypto store before upgrading.`

- Significato: OpenClaw ha trovato un vecchio stato Matrix crittografato, ma non ha potuto caricare l'entrypoint helper dal Plugin Matrix che normalmente ispeziona quello store.
- Cosa fare: reinstalla o ripara il Plugin Matrix (`openclaw plugins install @openclaw/matrix`, oppure `openclaw plugins install ./path/to/local/matrix-plugin` per un checkout del repository), quindi riesegui `openclaw doctor --fix` o riavvia il Gateway.

`Matrix plugin helper path is unsafe: ... Reinstall @openclaw/matrix and try again.`

- Significato: OpenClaw ha trovato un percorso di file helper che esce dalla root del Plugin o non supera i controlli dei confini del Plugin, quindi ha rifiutato di importarlo.
- Cosa fare: reinstalla il Plugin Matrix da un percorso attendibile, quindi riesegui `openclaw doctor --fix` o riavvia il Gateway.

`- Failed creating a Matrix migration snapshot before repair: ...`

`- Skipping Matrix migration changes for now. Resolve the snapshot failure, then rerun "openclaw doctor --fix".`

- Significato: OpenClaw ha rifiutato di modificare lo stato Matrix perché non ha potuto creare prima lo snapshot di recupero.
- Cosa fare: risolvi l'errore di backup, quindi riesegui `openclaw doctor --fix` o riavvia il Gateway.

`Failed migrating legacy Matrix client storage: ...`

- Significato: il fallback lato client Matrix ha trovato un vecchio storage piatto, ma lo spostamento non è riuscito. OpenClaw ora interrompe quel fallback invece di avviarsi silenziosamente con uno store nuovo.
- Cosa fare: controlla permessi o conflitti del filesystem, mantieni intatto il vecchio stato e riprova dopo aver corretto l'errore.

`Matrix is installed from a custom path: ...`

- Significato: Matrix è fissato a un'installazione da percorso, quindi gli aggiornamenti mainline non lo sostituiscono automaticamente con il pacchetto Matrix standard del repository.
- Cosa fare: reinstalla con `openclaw plugins install @openclaw/matrix` quando vuoi tornare al Plugin Matrix predefinito.

### Messaggi di recupero dello stato crittografato

`matrix: restored X/Y room key(s) from legacy encrypted-state backup`

- Significato: le chiavi delle stanze salvate nel backup sono state ripristinate correttamente nel nuovo store crittografico.
- Cosa fare: di solito nulla.

`matrix: N legacy local-only room key(s) were never backed up and could not be restored automatically`

- Significato: alcune vecchie chiavi delle stanze esistevano solo nel vecchio store locale e non erano mai state caricate nel backup Matrix.
- Cosa fare: aspettati che una parte della vecchia cronologia crittografata resti non disponibile, a meno che tu non possa recuperare manualmente quelle chiavi da un altro client verificato.

`Legacy Matrix encrypted state for account "..." has backed-up room keys, but no local backup decryption key was found. Ask the operator to run "openclaw matrix verify backup restore --recovery-key-stdin" after upgrade if they have the recovery key.`

- Significato: il backup esiste, ma OpenClaw non ha potuto recuperare automaticamente la chiave di recupero.
- Cosa fare: esegui `printf '%s\n' "$MATRIX_RECOVERY_KEY" | openclaw matrix verify backup restore --recovery-key-stdin`.

`Failed inspecting legacy Matrix encrypted state for account "..." (...): ...`

- Significato: OpenClaw ha trovato il vecchio store crittografato, ma non ha potuto ispezionarlo in modo abbastanza sicuro da preparare il recupero.
- Cosa fare: riesegui `openclaw doctor --fix`. Se si ripete, mantieni intatta la vecchia directory di stato e recupera usando un altro client Matrix verificato più `printf '%s\n' "$MATRIX_RECOVERY_KEY" | openclaw matrix verify backup restore --recovery-key-stdin`.

`Legacy Matrix backup key was found for account "...", but .../recovery-key.json already contains a different recovery key. Leaving the existing file unchanged.`

- Significato: OpenClaw ha rilevato un conflitto della chiave di backup e ha rifiutato di sovrascrivere automaticamente il file recovery-key corrente.
- Cosa fare: verifica quale chiave di recupero è corretta prima di riprovare qualsiasi comando di ripristino.

`Legacy Matrix encrypted state for account "..." cannot be fully converted automatically because the old rust crypto store does not expose all local room keys for export.`

- Significato: questo è il limite rigido del vecchio formato di storage.
- Cosa fare: le chiavi salvate nel backup possono ancora essere ripristinate, ma la cronologia crittografata solo locale potrebbe restare non disponibile.

`matrix: failed restoring room keys from legacy encrypted-state backup: ...`

- Significato: il nuovo Plugin ha tentato il ripristino, ma Matrix ha restituito un errore.
- Cosa fare: esegui `openclaw matrix verify backup status`, quindi riprova con `printf '%s\n' "$MATRIX_RECOVERY_KEY" | openclaw matrix verify backup restore --recovery-key-stdin` se necessario.

### Messaggi di recupero manuale

`Backup key is not loaded on this device. Run 'openclaw matrix verify backup restore' to load it and restore old room keys.`

- Significato: OpenClaw sa che dovresti avere una chiave di backup, ma non è attiva su questo dispositivo.
- Cosa fare: esegui `openclaw matrix verify backup restore`, oppure imposta `MATRIX_RECOVERY_KEY` ed esegui `printf '%s\n' "$MATRIX_RECOVERY_KEY" | openclaw matrix verify backup restore --recovery-key-stdin` se necessario.

`Store a recovery key with 'openclaw matrix verify device --recovery-key-stdin', then run 'openclaw matrix verify backup restore'.`

- Significato: questo dispositivo al momento non ha la chiave di recupero memorizzata.
- Cosa fare: imposta `MATRIX_RECOVERY_KEY`, esegui `printf '%s\n' "$MATRIX_RECOVERY_KEY" | openclaw matrix verify device --recovery-key-stdin`, quindi ripristina il backup.

`Backup key mismatch on this device. Re-run 'openclaw matrix verify device --recovery-key-stdin' with the matching recovery key.`

- Significato: la chiave memorizzata non corrisponde al backup Matrix attivo.
- Cosa fare: imposta `MATRIX_RECOVERY_KEY` sulla chiave corretta ed esegui `printf '%s\n' "$MATRIX_RECOVERY_KEY" | openclaw matrix verify device --recovery-key-stdin`.

Se accetti di perdere la vecchia cronologia crittografata non recuperabile, puoi invece reimpostare la
baseline del backup corrente con `openclaw matrix verify backup reset --yes`. Quando il
segreto di backup memorizzato è danneggiato, quella reimpostazione può anche ricreare lo storage dei segreti in modo che la
nuova chiave di backup possa caricarsi correttamente dopo il riavvio.

`Backup trust chain is not verified on this device. Re-run 'openclaw matrix verify device --recovery-key-stdin'.`

- Significato: il backup esiste, ma questo dispositivo non considera ancora abbastanza attendibile la catena di cross-signing.
- Cosa fare: imposta `MATRIX_RECOVERY_KEY` ed esegui `printf '%s\n' "$MATRIX_RECOVERY_KEY" | openclaw matrix verify device --recovery-key-stdin`.

`Matrix recovery key is required`

- Significato: hai tentato un passaggio di recupero senza fornire una chiave di recupero quando era richiesta.
- Cosa fare: riesegui il comando con `--recovery-key-stdin`, per esempio `printf '%s\n' "$MATRIX_RECOVERY_KEY" | openclaw matrix verify device --recovery-key-stdin`.

`Invalid Matrix recovery key: ...`

- Significato: la chiave fornita non ha potuto essere analizzata o non corrispondeva al formato previsto.
- Cosa fare: riprova con la chiave di recupero esatta dal tuo client Matrix o dal file recovery-key.

`Matrix recovery key was applied, but this device still lacks full Matrix identity trust.`

- Significato: OpenClaw ha potuto applicare la chiave di recupero, ma Matrix non ha ancora
  stabilito una fiducia completa dell'identità con cross-signing per questo dispositivo. Controlla l'output del
  comando per `Recovery key accepted`, `Backup usable`,
  `Cross-signing verified` e `Device verified by owner`.
- Cosa fare: esegui `openclaw matrix verify self`, accetta la richiesta in un altro
  client Matrix, confronta il SAS e digita `yes` solo quando corrisponde. Il
  comando attende la fiducia completa dell'identità Matrix prima di segnalare il successo. Usa
  `printf '%s\n' "$MATRIX_RECOVERY_KEY" | openclaw matrix verify bootstrap --recovery-key-stdin --force-reset-cross-signing`
  solo quando vuoi intenzionalmente sostituire l'identità di cross-signing corrente.

`Matrix key backup is not active on this device after loading from secret storage.`

- Significato: lo storage dei segreti non ha prodotto una sessione di backup attiva su questo dispositivo.
- Cosa fare: verifica prima il dispositivo, quindi ricontrolla con `openclaw matrix verify backup status`.

`Matrix crypto backend cannot load backup keys from secret storage. Verify this device with 'openclaw matrix verify device --recovery-key-stdin' first.`

- Significato: questo dispositivo non può ripristinare dallo storage dei segreti finché la verifica del dispositivo non è completa.
- Cosa fare: esegui prima `printf '%s\n' "$MATRIX_RECOVERY_KEY" | openclaw matrix verify device --recovery-key-stdin`.

### Messaggi di installazione di Plugin personalizzati

`Matrix is installed from a custom path that no longer exists: ...`

- Significato: il tuo record di installazione del Plugin punta a un percorso locale che non esiste più.
- Cosa fare: reinstalla con `openclaw plugins install @openclaw/matrix`, oppure, se stai eseguendo da un checkout del repository, `openclaw plugins install ./path/to/local/matrix-plugin`.

## Se la cronologia crittografata continua a non tornare

Esegui questi controlli in ordine:

```bash
openclaw matrix verify status --verbose
openclaw matrix verify backup status --verbose
printf '%s\n' "$MATRIX_RECOVERY_KEY" | openclaw matrix verify backup restore --recovery-key-stdin --verbose
```

Se il backup viene ripristinato correttamente ma in alcune vecchie stanze manca ancora la cronologia, quelle chiavi mancanti probabilmente non erano mai state salvate nel backup dal Plugin precedente.

## Se vuoi ricominciare da zero per i messaggi futuri

Se accetti di perdere la vecchia cronologia crittografata non recuperabile e vuoi solo una baseline di backup pulita da ora in poi, esegui questi comandi in ordine:

```bash
openclaw matrix verify backup reset --yes
openclaw matrix verify backup status --verbose
openclaw matrix verify status
```

Se dopo questo il dispositivo è ancora non verificato, completa la verifica dal tuo client Matrix confrontando le emoji SAS o i codici decimali e confermando che corrispondono.

## Correlati

- [Matrix](/it/channels/matrix): configurazione del canale.
- [Regole push Matrix](/it/channels/matrix-push-rules): routing delle notifiche.
- [Doctor](/it/gateway/doctor): controllo di integrità e trigger di migrazione automatica.
- [Guida alla migrazione](/it/install/migrating): tutti i percorsi di migrazione (spostamenti di macchina, importazioni tra sistemi).
- [Plugins](/it/tools/plugin): installazione e registrazione dei Plugin.
