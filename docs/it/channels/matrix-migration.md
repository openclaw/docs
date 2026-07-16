---
read_when:
    - Aggiornamento di un'installazione Matrix esistente
    - Migrazione della cronologia Matrix crittografata e dello stato del dispositivo
summary: Come OpenClaw aggiorna sul posto il precedente plugin Matrix, inclusi i limiti di recupero dello stato crittografato e i passaggi per il recupero manuale.
title: Migrazione di Matrix
x-i18n:
    generated_at: "2026-07-16T13:59:24Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 33d5ac134338c8032ca1507ceee6eade2d37b3c86f0045fb883304ad208cd5e5
    source_path: channels/matrix-migration.md
    workflow: 16
---

Esegui l'upgrade dal precedente plugin pubblico `matrix` all'implementazione attuale.

Per la maggior parte degli utenti, l'upgrade è già predisposto:

- il plugin rimane `@openclaw/matrix`
- il canale rimane `matrix`
- la configurazione rimane in `channels.matrix`
- le credenziali memorizzate nella cache rimangono in `~/.openclaw/credentials/matrix/`
- lo stato di runtime rimane in `~/.openclaw/matrix/`

Non è necessario rinominare le chiavi di configurazione né reinstallare il plugin con un nuovo nome.
Il pacchetto `openclaw` radice non include più il codice di runtime di Matrix né le dipendenze
dell'SDK Matrix. Se `openclaw channels status` indica che Matrix è configurato ma il
plugin non è installato, eseguire `openclaw doctor --fix` oppure
`openclaw plugins install @openclaw/matrix`; non installare i pacchetti dell'SDK Matrix
nel pacchetto OpenClaw radice.

## Operazioni eseguite automaticamente dalla migrazione

La migrazione di Matrix viene eseguita quando si avvia [`openclaw doctor --fix`](/it/gateway/doctor) e, come soluzione di ripiego, quando il client Matrix si avvia e trova ancora uno stato sidecar basato su file accanto al relativo archivio SQLite.

La migrazione automatica comprende:

- il riutilizzo delle credenziali Matrix memorizzate nella cache
- il mantenimento della stessa selezione dell'account e della configurazione `channels.matrix`
- l'importazione dello stato sidecar basato su file (cache di sincronizzazione `bot-storage.json`, `recovery-key.json`, `legacy-crypto-migration.json`, snapshot IndexedDB) nello stato SQLite di Matrix; i file migrati vengono archiviati con il suffisso `.migrated`
- il riutilizzo della radice di archiviazione degli hash dei token esistente più completa per lo stesso account Matrix, homeserver, utente e dispositivo quando il token di accesso cambia successivamente

## Upgrade da versioni di OpenClaw precedenti alla 2026.4

Le versioni fino alla serie 2026.6 migravano anche il layout Matrix piatto originale
con archivio singolo (`~/.openclaw/matrix/bot-storage.json` più
`~/.openclaw/matrix/crypto/`) e preparavano il recupero dello stato crittografato dal
vecchio archivio crittografico Rust. Le versioni attuali non includono più tale migrazione.

Se si esegue l'upgrade di un'installazione che utilizza ancora il layout piatto, occorre prima
passare a una versione della serie 2026.6, eseguire `openclaw doctor --fix` e avviare il Gateway
una volta, affinché vengano migrati l'archivio piatto e le eventuali chiavi delle stanze recuperabili. Quindi eseguire
l'aggiornamento alla versione più recente.

Il precedente plugin pubblico Matrix **non** creava automaticamente backup delle chiavi delle stanze Matrix. Se la vecchia installazione conteneva una cronologia crittografata solo locale di cui non era mai stato eseguito il backup, alcuni messaggi crittografati meno recenti potrebbero rimanere illeggibili dopo l'upgrade, indipendentemente dal percorso di migrazione.

## Procedura di upgrade consigliata

1. Aggiornare normalmente OpenClaw e il plugin Matrix.
2. Eseguire:

   ```bash
   openclaw doctor --fix
   ```

3. Avviare o riavviare il Gateway.
4. Controllare lo stato attuale della verifica e del backup:

   ```bash
   openclaw matrix verify status
   openclaw matrix verify backup status
   ```

5. Inserire la chiave di recupero dell'account Matrix da riparare in una variabile d'ambiente specifica per l'account. Per un singolo account predefinito, `MATRIX_RECOVERY_KEY` è adeguata. Per più account, utilizzare una variabile per ciascun account, ad esempio `MATRIX_RECOVERY_KEY_ASSISTANT`, e aggiungere `--account assistant` al comando.

6. Se OpenClaw segnala che è necessaria una chiave di recupero, eseguire il comando per l'account corrispondente:

   ```bash
   printf '%s\n' "$MATRIX_RECOVERY_KEY" | openclaw matrix verify backup restore --recovery-key-stdin
   printf '%s\n' "$MATRIX_RECOVERY_KEY_ASSISTANT" | openclaw matrix verify backup restore --recovery-key-stdin --account assistant
   ```

7. Se questo dispositivo non è ancora verificato, eseguire il comando per l'account corrispondente:

   ```bash
   printf '%s\n' "$MATRIX_RECOVERY_KEY" | openclaw matrix verify device --recovery-key-stdin
   printf '%s\n' "$MATRIX_RECOVERY_KEY_ASSISTANT" | openclaw matrix verify device --recovery-key-stdin --account assistant
   ```

   Se la chiave di recupero viene accettata e il backup è utilizzabile, ma `Cross-signing verified`
   è ancora `no`, completare l'autoverifica da un altro client Matrix:

   ```bash
   openclaw matrix verify self
   ```

   Accettare la richiesta in un altro client Matrix, confrontare le emoji o i numeri decimali
   e digitare `yes` solo se corrispondono. Il comando attende che l'identità Matrix
   sia considerata completamente attendibile prima di segnalare l'esito positivo.

8. Se si intende rinunciare alla vecchia cronologia non recuperabile e si desidera una nuova base di backup per i messaggi futuri, eseguire:

   ```bash
   openclaw matrix verify backup reset --yes
   ```

   Aggiungere `--rotate-recovery-key` solo se la vecchia chiave di recupero non deve più consentire di sbloccare il nuovo backup.

9. Se non esiste ancora alcun backup delle chiavi lato server, crearne uno per i recuperi futuri:

   ```bash
   openclaw matrix verify bootstrap
   ```

## Messaggi comuni e relativo significato

`Failed migrating legacy Matrix client storage: ...`

- Significato: la soluzione di ripiego lato client Matrix ha trovato uno stato sidecar basato su file, ma l'importazione in SQLite non è riuscita. OpenClaw annulla gli spostamenti completati e interrompe tale procedura di ripiego, anziché avviarsi silenziosamente con un nuovo archivio.
- Operazione da eseguire: controllare le autorizzazioni o i conflitti del file system, mantenere intatto il vecchio stato e riprovare dopo aver corretto l'errore.

`Matrix is installed from a custom path: ...`

- Significato: Matrix è vincolato a un'installazione da percorso, pertanto gli aggiornamenti della linea principale non lo sostituiscono automaticamente con il pacchetto Matrix predefinito.
- Operazione da eseguire: reinstallare con `openclaw plugins install @openclaw/matrix` per tornare al plugin Matrix predefinito.

`Matrix is installed from a custom path that no longer exists: ...`

- Significato: il record di installazione del plugin punta a un percorso locale che non esiste più.
- Operazione da eseguire: reinstallare con `openclaw plugins install @openclaw/matrix` oppure, se l'esecuzione avviene da un checkout del repository, con `openclaw plugins install ./path/to/local/matrix-plugin`. Anche `openclaw doctor --fix` può rimuovere i riferimenti obsoleti al plugin Matrix.

### Messaggi relativi al recupero manuale

`openclaw matrix verify status` e `openclaw matrix verify backup status` visualizzano una riga `Backup issue:` insieme alle indicazioni `Next steps:` quando il backup delle chiavi delle stanze non è integro su questo dispositivo:

| Problema del backup                                                   | Significato                                        | Correzione                                                                                                                                 |
| --------------------------------------------------------------------- | -------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------- |
| `no room-key backup exists on the homeserver`                         | non è presente nulla da ripristinare               | `openclaw matrix verify bootstrap` per creare un backup delle chiavi delle stanze                                                          |
| `backup decryption key is not loaded on this device`                  | la chiave esiste, ma qui non è attiva              | `openclaw matrix verify backup restore`; se la chiave continua a non caricarsi, fornire la chiave di recupero tramite pipe con `--recovery-key-stdin` |
| `backup decryption key could not be loaded from secret storage (...)` | il caricamento dell'archivio dei segreti non è riuscito o non è supportato | fornire la chiave di recupero tramite pipe: `printf '%s\n' "$MATRIX_RECOVERY_KEY" \| openclaw matrix verify backup restore --recovery-key-stdin`              |
| `backup key mismatch (...)`                                           | la chiave archiviata non corrisponde al backup attivo sul server | eseguire nuovamente `verify backup restore --recovery-key-stdin` con la chiave del backup attivo sul server oppure `verify backup reset --yes` per una nuova base |
| `backup signature chain is not trusted by this device`                | il dispositivo non considera ancora attendibile la catena di firma incrociata | `verify device --recovery-key-stdin`, quindi `verify self` da un altro client verificato se l'attendibilità è ancora incompleta          |
| `backup exists but is not active on this device`                      | backup presente sul server, sessione locale inattiva | verificare prima il dispositivo, quindi ricontrollare con `openclaw matrix verify backup status`                                              |
| `backup trust state could not be fully determined`                    | la diagnostica non ha fornito risultati conclusivi | `openclaw matrix verify status --verbose`                                                                                                         |

Altri errori di recupero:

`Matrix recovery key is required`

- Significato: è stato tentato un passaggio di recupero senza fornire una chiave di recupero quando era richiesta.
- Operazione da eseguire: eseguire nuovamente il comando con `--recovery-key-stdin`, ad esempio `printf '%s\n' "$MATRIX_RECOVERY_KEY" | openclaw matrix verify device --recovery-key-stdin`.

`Invalid Matrix recovery key: ...`

- Significato: non è stato possibile analizzare la chiave fornita oppure il relativo formato non corrispondeva a quello previsto.
- Operazione da eseguire: riprovare con la chiave di recupero esatta ottenuta dal client Matrix o dall'esportazione della chiave di recupero.

`Matrix recovery key was applied, but this device still lacks full Matrix identity trust.`

- Significato: la chiave di recupero ha sbloccato materiale di backup utilizzabile, ma Matrix non ha ancora stabilito la completa attendibilità dell'identità con firma incrociata per questo dispositivo. Controllare nell'output del comando `Recovery key accepted`, `Backup usable`, `Cross-signing verified` e `Device verified by owner`.
- Operazione da eseguire: eseguire `openclaw matrix verify self`, accettare la richiesta in un altro client Matrix, confrontare il SAS e digitare `yes` solo se corrisponde. Utilizzare `printf '%s\n' "$MATRIX_RECOVERY_KEY" | openclaw matrix verify bootstrap --recovery-key-stdin --force-reset-cross-signing` solo se si intende sostituire l'identità di firma incrociata attuale.

Se si accetta di perdere la vecchia cronologia crittografata non recuperabile, è possibile invece reimpostare la
base di backup attuale con `openclaw matrix verify backup reset --yes`. Quando il
segreto del backup archiviato è danneggiato, tale reimpostazione ripara anche l'archivio dei segreti, affinché
la nuova chiave di backup possa essere caricata correttamente dopo il riavvio.

## Se la cronologia crittografata continua a non essere ripristinata

Eseguire questi controlli nell'ordine indicato:

```bash
openclaw matrix verify status --verbose
openclaw matrix verify backup status --verbose
printf '%s\n' "$MATRIX_RECOVERY_KEY" | openclaw matrix verify backup restore --recovery-key-stdin --verbose
```

Se il backup viene ripristinato correttamente ma in alcune vecchie stanze manca ancora la cronologia, è probabile che il precedente plugin non abbia mai eseguito il backup delle chiavi mancanti.

## Se si desidera ripartire da zero per i messaggi futuri

Se si accetta di perdere la vecchia cronologia crittografata non recuperabile e si desidera soltanto una base di backup pulita per il futuro, eseguire questi comandi nell'ordine indicato:

```bash
openclaw matrix verify backup reset --yes
openclaw matrix verify backup status --verbose
openclaw matrix verify status
```

Se, dopo questa operazione, il dispositivo non è ancora verificato, completare la verifica dal client Matrix confrontando le emoji SAS o i codici decimali e confermando che corrispondano.

## Argomenti correlati

- [Matrix](/it/channels/matrix): configurazione del canale.
- [Regole push di Matrix](/it/channels/matrix-push-rules): instradamento delle notifiche.
- [Doctor](/it/gateway/doctor): controllo dello stato e attivazione della migrazione automatica.
- [Guida alla migrazione](/it/install/migrating): tutti i percorsi di migrazione (spostamenti tra macchine, importazioni tra sistemi).
- [Plugin](/it/tools/plugin): installazione e registrazione dei plugin.
