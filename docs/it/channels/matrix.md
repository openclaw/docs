---
read_when:
    - Configurare Matrix in OpenClaw
    - Configurare E2EE e la verifica di Matrix
summary: Stato del supporto, configurazione iniziale ed esempi di configurazione di Matrix
title: Matrix
x-i18n:
    generated_at: "2026-04-24T08:30:16Z"
    model: gpt-5.4
    provider: openai
    source_hash: bf25a6f64ed310f33b72517ccd1526876e27caae240e9fa837a86ca2c392ab25
    source_path: channels/matrix.md
    workflow: 15
---

Matrix è un Plugin canale incluso per OpenClaw.
Usa il pacchetto ufficiale `matrix-js-sdk` e supporta messaggi diretti, stanze, thread, media, reazioni, sondaggi, posizione ed E2EE.

## Plugin incluso

Matrix è incluso come Plugin nelle attuali release di OpenClaw, quindi le normali
build pacchettizzate non richiedono un'installazione separata.

Se usi una build più vecchia o un'installazione personalizzata che esclude Matrix, installalo
manualmente:

Installa da npm:

```bash
openclaw plugins install @openclaw/matrix
```

Installa da un checkout locale:

```bash
openclaw plugins install ./path/to/local/matrix-plugin
```

Consulta [Plugins](/it/tools/plugin) per il comportamento dei Plugin e le regole di installazione.

## Configurazione

1. Assicurati che il Plugin Matrix sia disponibile.
   - Le attuali release pacchettizzate di OpenClaw lo includono già.
   - Le installazioni vecchie/personalizzate possono aggiungerlo manualmente con i comandi sopra.
2. Crea un account Matrix sul tuo homeserver.
3. Configura `channels.matrix` con:
   - `homeserver` + `accessToken`, oppure
   - `homeserver` + `userId` + `password`.
4. Riavvia il Gateway.
5. Avvia un messaggio diretto con il bot o invitalo in una stanza.
   - I nuovi inviti Matrix funzionano solo quando `channels.matrix.autoJoin` li consente.

Percorsi di configurazione interattiva:

```bash
openclaw channels add
openclaw configure --section channels
```

La procedura guidata di Matrix chiede:

- URL dell'homeserver
- metodo di autenticazione: access token o password
- ID utente (solo autenticazione con password)
- nome del dispositivo facoltativo
- se abilitare E2EE
- se configurare l'accesso alle stanze e l'unione automatica agli inviti

Comportamenti chiave della procedura guidata:

- Se le variabili d'ambiente di autenticazione Matrix esistono già e quell'account non ha già l'autenticazione salvata nella configurazione, la procedura guidata offre una scorciatoia env per mantenere l'autenticazione nelle variabili d'ambiente.
- I nomi account vengono normalizzati nell'ID account. Per esempio, `Ops Bot` diventa `ops-bot`.
- Le voci di allowlist dei messaggi diretti accettano direttamente `@user:server`; i nomi visualizzati funzionano solo quando la ricerca live nella directory trova una singola corrispondenza esatta.
- Le voci di allowlist delle stanze accettano direttamente ID stanza e alias. Preferisci `!room:server` o `#alias:server`; i nomi non risolti vengono ignorati a runtime dalla risoluzione della allowlist.
- Nella modalità allowlist per l'unione automatica agli inviti, usa solo destinazioni di invito stabili: `!roomId:server`, `#alias:server` o `*`. I semplici nomi delle stanze vengono rifiutati.
- Per risolvere i nomi delle stanze prima di salvare, usa `openclaw channels resolve --channel matrix "Project Room"`.

<Warning>
`channels.matrix.autoJoin` è impostato su `off` per impostazione predefinita.

Se lo lasci non impostato, il bot non entrerà nelle stanze invitate o nei nuovi inviti in stile DM, quindi non apparirà nei nuovi gruppi o nei DM con invito a meno che tu non entri prima manualmente.

Imposta `autoJoin: "allowlist"` insieme a `autoJoinAllowlist` per limitare quali inviti accetta, oppure imposta `autoJoin: "always"` se vuoi che accetti ogni invito.

In modalità `allowlist`, `autoJoinAllowlist` accetta solo `!roomId:server`, `#alias:server` o `*`.
</Warning>

Esempio di allowlist:

```json5
{
  channels: {
    matrix: {
      autoJoin: "allowlist",
      autoJoinAllowlist: ["!ops:example.org", "#support:example.org"],
      groups: {
        "!ops:example.org": {
          requireMention: true,
        },
      },
    },
  },
}
```

Unisciti a ogni invito:

```json5
{
  channels: {
    matrix: {
      autoJoin: "always",
    },
  },
}
```

Configurazione minima basata su token:

```json5
{
  channels: {
    matrix: {
      enabled: true,
      homeserver: "https://matrix.example.org",
      accessToken: "syt_xxx",
      dm: { policy: "pairing" },
    },
  },
}
```

Configurazione basata su password (il token viene memorizzato nella cache dopo l'accesso):

```json5
{
  channels: {
    matrix: {
      enabled: true,
      homeserver: "https://matrix.example.org",
      userId: "@bot:example.org",
      password: "replace-me", // pragma: allowlist secret
      deviceName: "OpenClaw Gateway",
    },
  },
}
```

Matrix memorizza le credenziali in cache in `~/.openclaw/credentials/matrix/`.
L'account predefinito usa `credentials.json`; gli account con nome usano `credentials-<account>.json`.
Quando lì esistono credenziali in cache, OpenClaw considera Matrix configurato per setup, doctor e rilevamento dello stato del canale anche se l'autenticazione corrente non è impostata direttamente nella configurazione.

Equivalenti tramite variabili d'ambiente (usati quando la chiave di configurazione non è impostata):

- `MATRIX_HOMESERVER`
- `MATRIX_ACCESS_TOKEN`
- `MATRIX_USER_ID`
- `MATRIX_PASSWORD`
- `MATRIX_DEVICE_ID`
- `MATRIX_DEVICE_NAME`

Per gli account non predefiniti, usa variabili d'ambiente con ambito account:

- `MATRIX_<ACCOUNT_ID>_HOMESERVER`
- `MATRIX_<ACCOUNT_ID>_ACCESS_TOKEN`
- `MATRIX_<ACCOUNT_ID>_USER_ID`
- `MATRIX_<ACCOUNT_ID>_PASSWORD`
- `MATRIX_<ACCOUNT_ID>_DEVICE_ID`
- `MATRIX_<ACCOUNT_ID>_DEVICE_NAME`

Esempio per l'account `ops`:

- `MATRIX_OPS_HOMESERVER`
- `MATRIX_OPS_ACCESS_TOKEN`

Per l'ID account normalizzato `ops-bot`, usa:

- `MATRIX_OPS_X2D_BOT_HOMESERVER`
- `MATRIX_OPS_X2D_BOT_ACCESS_TOKEN`

Matrix esegue l'escape della punteggiatura negli ID account per evitare collisioni nelle variabili d'ambiente con ambito.
Per esempio, `-` diventa `_X2D_`, quindi `ops-prod` diventa `MATRIX_OPS_X2D_PROD_*`.

La procedura guidata interattiva offre la scorciatoia con variabile d'ambiente solo quando quelle variabili d'ambiente di autenticazione sono già presenti e l'account selezionato non ha già l'autenticazione Matrix salvata nella configurazione.

`MATRIX_HOMESERVER` non può essere impostata da un `.env` del workspace; consulta [File `.env` del workspace](/it/gateway/security).

## Esempio di configurazione

Questa è una configurazione di base pratica con pairing dei DM, allowlist delle stanze ed E2EE abilitato:

```json5
{
  channels: {
    matrix: {
      enabled: true,
      homeserver: "https://matrix.example.org",
      accessToken: "syt_xxx",
      encryption: true,

      dm: {
        policy: "pairing",
        sessionScope: "per-room",
        threadReplies: "off",
      },

      groupPolicy: "allowlist",
      groupAllowFrom: ["@admin:example.org"],
      groups: {
        "!roomid:example.org": {
          requireMention: true,
        },
      },

      autoJoin: "allowlist",
      autoJoinAllowlist: ["!roomid:example.org"],
      threadReplies: "inbound",
      replyToMode: "off",
      streaming: "partial",
    },
  },
}
```

`autoJoin` si applica a tutti gli inviti Matrix, inclusi gli inviti in stile DM. OpenClaw non può classificare in modo affidabile
una stanza invitata come DM o gruppo al momento dell'invito, quindi tutti gli inviti passano prima da `autoJoin`.
`dm.policy` si applica dopo che il bot è entrato e la stanza è stata classificata come DM.

## Anteprime in streaming

Lo streaming delle risposte Matrix è opt-in.

Imposta `channels.matrix.streaming` su `"partial"` quando vuoi che OpenClaw invii una singola risposta
di anteprima live, modifichi tale anteprima sul posto mentre il modello genera testo e poi la finalizzi quando
la risposta è completa:

```json5
{
  channels: {
    matrix: {
      streaming: "partial",
    },
  },
}
```

- `streaming: "off"` è il valore predefinito. OpenClaw attende la risposta finale e la invia una sola volta.
- `streaming: "partial"` crea un messaggio di anteprima modificabile per il blocco corrente dell'assistente usando normali messaggi di testo Matrix. Questo preserva il comportamento legacy di Matrix di notifica prima sull'anteprima, quindi i client standard potrebbero notificare sul primo testo di anteprima in streaming invece che sul blocco completato.
- `streaming: "quiet"` crea un'anteprima silenziosa modificabile per il blocco corrente dell'assistente. Usalo solo se configuri anche le regole push dei destinatari per le modifiche finalizzate dell'anteprima.
- `blockStreaming: true` abilita messaggi di avanzamento Matrix separati. Con lo streaming delle anteprime abilitato, Matrix mantiene la bozza live per il blocco corrente e conserva i blocchi completati come messaggi separati.
- Quando lo streaming delle anteprime è attivo e `blockStreaming` è disattivato, Matrix modifica la bozza live sul posto e finalizza quello stesso evento quando il blocco o il turno termina.
- Se l'anteprima non entra più in un singolo evento Matrix, OpenClaw interrompe lo streaming dell'anteprima e torna alla normale consegna finale.
- Le risposte multimediali inviano comunque normalmente gli allegati. Se un'anteprima obsoleta non può più essere riutilizzata in sicurezza, OpenClaw la redige prima di inviare la risposta multimediale finale.
- Le modifiche delle anteprime comportano chiamate extra alle API Matrix. Lascia disattivato lo streaming se vuoi il comportamento più conservativo possibile rispetto ai limiti di frequenza.

`blockStreaming` non abilita da solo le bozze di anteprima.
Usa `streaming: "partial"` o `streaming: "quiet"` per le modifiche dell'anteprima; poi aggiungi `blockStreaming: true` solo se vuoi anche che i blocchi completati dell'assistente restino visibili come messaggi di avanzamento separati.

Se hai bisogno delle notifiche standard di Matrix senza regole push personalizzate, usa `streaming: "partial"` per il comportamento con anteprima iniziale oppure lascia `streaming` disattivato per la consegna solo finale. Con `streaming: "off"`:

- `blockStreaming: true` invia ogni blocco completato come normale messaggio Matrix con notifica.
- `blockStreaming: false` invia solo la risposta finale completata come normale messaggio Matrix con notifica.

### Regole push self-hosted per anteprime silenziose finalizzate

Lo streaming silenzioso (`streaming: "quiet"`) notifica i destinatari solo una volta finalizzato un blocco o un turno — una regola push per utente deve corrispondere al marcatore di anteprima finalizzata. Consulta [Regole push Matrix per anteprime silenziose](/it/channels/matrix-push-rules) per la configurazione completa (token del destinatario, controllo del pusher, installazione della regola, note per homeserver specifici).

## Stanze bot-to-bot

Per impostazione predefinita, i messaggi Matrix provenienti da altri account Matrix OpenClaw configurati vengono ignorati.

Usa `allowBots` quando vuoi intenzionalmente traffico Matrix tra agenti:

```json5
{
  channels: {
    matrix: {
      allowBots: "mentions", // true | "mentions"
      groups: {
        "!roomid:example.org": {
          requireMention: true,
        },
      },
    },
  },
}
```

- `allowBots: true` accetta messaggi da altri account bot Matrix configurati in stanze consentite e DM.
- `allowBots: "mentions"` accetta quei messaggi solo quando menzionano visibilmente questo bot nelle stanze. I DM restano comunque consentiti.
- `groups.<room>.allowBots` sostituisce l'impostazione a livello di account per una stanza specifica.
- OpenClaw continua a ignorare i messaggi provenienti dallo stesso ID utente Matrix per evitare loop di autorisposta.
- Matrix qui non espone un flag bot nativo; OpenClaw tratta "scritto da bot" come "inviato da un altro account Matrix configurato su questo Gateway OpenClaw".

Usa allowlist rigorose delle stanze e requisiti di menzione quando abiliti traffico bot-to-bot in stanze condivise.

## Crittografia e verifica

Nelle stanze crittografate (E2EE), gli eventi immagine in uscita usano `thumbnail_file` così le anteprime delle immagini vengono cifrate insieme all'allegato completo. Le stanze non crittografate usano ancora il semplice `thumbnail_url`. Non è necessaria alcuna configurazione — il Plugin rileva automaticamente lo stato E2EE.

Abilita la crittografia:

```json5
{
  channels: {
    matrix: {
      enabled: true,
      homeserver: "https://matrix.example.org",
      accessToken: "syt_xxx",
      encryption: true,
      dm: { policy: "pairing" },
    },
  },
}
```

Comandi di verifica (tutti accettano `--verbose` per la diagnostica e `--json` per output leggibile da macchina):

| Comando                                                       | Scopo                                                                               |
| ------------------------------------------------------------- | ----------------------------------------------------------------------------------- |
| `openclaw matrix verify status`                               | Controllare lo stato della cross-signing e della verifica del dispositivo           |
| `openclaw matrix verify status --include-recovery-key --json` | Includere la chiave di ripristino memorizzata                                       |
| `openclaw matrix verify bootstrap`                            | Inizializzare cross-signing e verifica (vedi sotto)                                 |
| `openclaw matrix verify bootstrap --force-reset-cross-signing` | Scartare l'identità corrente di cross-signing e crearne una nuova                  |
| `openclaw matrix verify device "<recovery-key>"`              | Verificare questo dispositivo con una chiave di ripristino                          |
| `openclaw matrix verify backup status`                        | Controllare lo stato del backup delle chiavi delle stanze                           |
| `openclaw matrix verify backup restore`                       | Ripristinare le chiavi delle stanze dal backup del server                           |
| `openclaw matrix verify backup reset --yes`                   | Eliminare il backup corrente e creare una nuova baseline (può ricreare l'archiviazione dei segreti) |

Nelle configurazioni multi-account, i comandi CLI Matrix usano l'account predefinito implicito di Matrix a meno che tu non passi `--account <id>`.
Se configuri più account con nome, imposta prima `channels.matrix.defaultAccount`, altrimenti quelle operazioni CLI implicite si fermeranno e ti chiederanno di scegliere esplicitamente un account.
Usa `--account` ogni volta che vuoi che le operazioni di verifica o del dispositivo puntino esplicitamente a un account con nome:

```bash
openclaw matrix verify status --account assistant
openclaw matrix verify backup restore --account assistant
openclaw matrix devices list --account assistant
```

Quando la crittografia è disabilitata o non disponibile per un account con nome, gli avvisi Matrix e gli errori di verifica puntano alla chiave di configurazione di quell'account, per esempio `channels.matrix.accounts.assistant.encryption`.

<AccordionGroup>
  <Accordion title="Cosa significa verificato">
    OpenClaw considera un dispositivo verificato solo quando la tua identità di cross-signing lo firma. `verify status --verbose` espone tre segnali di attendibilità:

    - `Locally trusted`: attendibile solo da questo client
    - `Cross-signing verified`: l'SDK segnala la verifica tramite cross-signing
    - `Signed by owner`: firmato dalla tua stessa chiave self-signing

    `Verified by owner` diventa `yes` solo quando è presente cross-signing o firma del proprietario. La sola attendibilità locale non è sufficiente.

  </Accordion>

  <Accordion title="Cosa fa bootstrap">
    `verify bootstrap` è il comando di riparazione e configurazione per gli account crittografati. In ordine, esegue:

    - inizializza l'archiviazione dei segreti, riutilizzando una chiave di ripristino esistente quando possibile
    - inizializza cross-signing e carica le chiavi pubbliche di cross-signing mancanti
    - contrassegna e firma con cross-signing il dispositivo corrente
    - crea un backup lato server delle chiavi della stanza se non ne esiste già uno

    Se l'homeserver richiede UIA per caricare le chiavi di cross-signing, OpenClaw prova prima senza autenticazione, poi `m.login.dummy`, poi `m.login.password` (richiede `channels.matrix.password`). Usa `--force-reset-cross-signing` solo quando vuoi intenzionalmente scartare l'identità corrente.

  </Accordion>

  <Accordion title="Nuova baseline di backup">
    Se vuoi mantenere funzionanti i futuri messaggi crittografati e accettare la perdita della cronologia vecchia non recuperabile:

```bash
openclaw matrix verify backup reset --yes
openclaw matrix verify backup status --verbose
openclaw matrix verify status
```

    Aggiungi `--account <id>` per puntare a un account con nome. Questo può anche ricreare l'archiviazione dei segreti se il segreto del backup corrente non può essere caricato in sicurezza.

  </Accordion>

  <Accordion title="Comportamento all'avvio">
    Con `encryption: true`, `startupVerification` è impostato per default su `"if-unverified"`. All'avvio, un dispositivo non verificato richiede l'autoverifica in un altro client Matrix, saltando i duplicati e applicando un cooldown. Regola questo comportamento con `startupVerificationCooldownHours` o disattivalo con `startupVerification: "off"`.

    All'avvio viene anche eseguito un passaggio conservativo di bootstrap crittografico che riutilizza l'attuale archiviazione dei segreti e l'identità di cross-signing. Se lo stato del bootstrap è danneggiato, OpenClaw tenta una riparazione protetta anche senza `channels.matrix.password`; se l'homeserver richiede password UIA, all'avvio viene registrato un avviso e il comportamento resta non fatale. I dispositivi già firmati dal proprietario vengono preservati.

    Consulta [Migrazione di Matrix](/it/install/migrating-matrix) per il flusso completo di aggiornamento.

  </Accordion>

  <Accordion title="Avvisi di verifica">
    Matrix pubblica gli avvisi sul ciclo di vita della verifica nella rigida stanza DM di verifica come messaggi `m.notice`: richiesta, pronto (con indicazioni "Verifica tramite emoji"), avvio/completamento e dettagli SAS (emoji/decimali) quando disponibili.

    Le richieste in entrata da un altro client Matrix vengono tracciate e accettate automaticamente. Per l'autoverifica, OpenClaw avvia automaticamente il flusso SAS e conferma il proprio lato una volta che la verifica con emoji è disponibile — devi comunque confrontare e confermare "Corrispondono" nel tuo client Matrix.

    Gli avvisi di sistema della verifica non vengono inoltrati alla pipeline di chat dell'agente.

  </Accordion>

  <Accordion title="Igiene dei dispositivi">
    I vecchi dispositivi gestiti da OpenClaw possono accumularsi. Elencali e rimuovili:

```bash
openclaw matrix devices list
openclaw matrix devices prune-stale
```

  </Accordion>

  <Accordion title="Archivio crittografico">
    Matrix E2EE usa il percorso crittografico Rust ufficiale di `matrix-js-sdk` con `fake-indexeddb` come shim IndexedDB. Lo stato crittografico persiste in `crypto-idb-snapshot.json` (permessi file restrittivi).

    Lo stato runtime crittografato si trova in `~/.openclaw/matrix/accounts/<account>/<homeserver>__<user>/<token-hash>/` e include l'archivio di sincronizzazione, l'archivio crittografico, la chiave di ripristino, lo snapshot IDB, i binding dei thread e lo stato della verifica all'avvio. Quando il token cambia ma l'identità dell'account resta la stessa, OpenClaw riutilizza la migliore root esistente così lo stato precedente rimane visibile.

  </Accordion>
</AccordionGroup>

## Gestione del profilo

Aggiorna il profilo self Matrix per l'account selezionato con:

```bash
openclaw matrix profile set --name "OpenClaw Assistant"
openclaw matrix profile set --avatar-url https://cdn.example.org/avatar.png
```

Aggiungi `--account <id>` quando vuoi puntare esplicitamente a un account Matrix con nome.

Matrix accetta direttamente URL avatar `mxc://`. Quando passi un URL avatar `http://` o `https://`, OpenClaw lo carica prima su Matrix e memorizza l'URL `mxc://` risolto in `channels.matrix.avatarUrl` (o nell'override dell'account selezionato).

## Thread

Matrix supporta thread Matrix nativi sia per le risposte automatiche sia per gli invii tramite strumenti di messaggistica.

- `dm.sessionScope: "per-user"` (predefinito) mantiene il routing dei DM Matrix con ambito mittente, così più stanze DM possono condividere una sessione quando si risolvono allo stesso peer.
- `dm.sessionScope: "per-room"` isola ogni stanza DM Matrix nella propria chiave di sessione continuando a usare i normali controlli di autenticazione e allowlist dei DM.
- I binding espliciti delle conversazioni Matrix continuano ad avere la precedenza su `dm.sessionScope`, quindi stanze e thread associati mantengono la sessione di destinazione scelta.
- `threadReplies: "off"` mantiene le risposte al livello superiore e lascia i messaggi in thread in entrata sulla sessione padre.
- `threadReplies: "inbound"` risponde dentro un thread solo quando il messaggio in entrata era già in quel thread.
- `threadReplies: "always"` mantiene le risposte della stanza in un thread radicato nel messaggio attivante e instrada quella conversazione attraverso la sessione con ambito thread corrispondente a partire dal primo messaggio attivante.
- `dm.threadReplies` sostituisce l'impostazione di livello superiore solo per i DM. Per esempio, puoi mantenere isolati i thread delle stanze lasciando piatti i DM.
- I messaggi in thread in entrata includono il messaggio radice del thread come contesto aggiuntivo per l'agente.
- Gli invii tramite strumenti di messaggistica ereditano automaticamente il thread Matrix corrente quando la destinazione è la stessa stanza, o lo stesso target utente DM, a meno che non venga fornito un `threadId` esplicito.
- Il riutilizzo del target utente DM nella stessa sessione si attiva solo quando i metadati della sessione corrente dimostrano lo stesso peer DM sullo stesso account Matrix; altrimenti OpenClaw ripiega sul normale routing con ambito utente.
- Quando OpenClaw vede una stanza DM Matrix entrare in conflitto con un'altra stanza DM sulla stessa sessione DM Matrix condivisa, pubblica un `m.notice` una tantum in quella stanza con la via di fuga `/focus` quando i binding dei thread sono abilitati e con l'indicazione `dm.sessionScope`.
- I binding runtime dei thread sono supportati per Matrix. `/focus`, `/unfocus`, `/agents`, `/session idle`, `/session max-age` e `/acp spawn` associato a thread funzionano nelle stanze e nei DM Matrix.
- `/focus` a livello superiore in una stanza/DM Matrix crea un nuovo thread Matrix e lo associa alla sessione di destinazione quando `threadBindings.spawnSubagentSessions=true`.
- Eseguire `/focus` o `/acp spawn --thread here` all'interno di un thread Matrix esistente associa invece quel thread corrente.

## Binding delle conversazioni ACP

Le stanze, i DM e i thread Matrix esistenti possono essere trasformati in workspace ACP durevoli senza cambiare la superficie di chat.

Flusso rapido per l'operatore:

- Esegui `/acp spawn codex --bind here` dentro il DM Matrix, la stanza o il thread esistente che vuoi continuare a usare.
- In un DM o stanza Matrix di livello superiore, il DM/stanza corrente resta la superficie di chat e i messaggi futuri vengono instradati alla sessione ACP generata.
- All'interno di un thread Matrix esistente, `--bind here` associa quel thread corrente sul posto.
- `/new` e `/reset` reimpostano sul posto la stessa sessione ACP associata.
- `/acp close` chiude la sessione ACP e rimuove l'associazione.

Note:

- `--bind here` non crea un thread Matrix figlio.
- `threadBindings.spawnAcpSessions` è richiesto solo per `/acp spawn --thread auto|here`, quando OpenClaw deve creare o associare un thread Matrix figlio.

### Configurazione dei binding dei thread

Matrix eredita i valori predefiniti globali da `session.threadBindings` e supporta anche override per canale:

- `threadBindings.enabled`
- `threadBindings.idleHours`
- `threadBindings.maxAgeHours`
- `threadBindings.spawnSubagentSessions`
- `threadBindings.spawnAcpSessions`

I flag di avvio associati a thread Matrix sono opt-in:

- Imposta `threadBindings.spawnSubagentSessions: true` per consentire a `/focus` di livello superiore di creare e associare nuovi thread Matrix.
- Imposta `threadBindings.spawnAcpSessions: true` per consentire a `/acp spawn --thread auto|here` di associare sessioni ACP ai thread Matrix.

## Reazioni

Matrix supporta azioni di reazione in uscita, notifiche di reazione in entrata e reazioni di conferma in entrata.

- Gli strumenti di reazione in uscita sono regolati da `channels["matrix"].actions.reactions`.
- `react` aggiunge una reazione a uno specifico evento Matrix.
- `reactions` elenca il riepilogo corrente delle reazioni per uno specifico evento Matrix.
- `emoji=""` rimuove le reazioni dell'account bot su quell'evento.
- `remove: true` rimuove solo la specifica reazione emoji dall'account bot.

L'ambito delle reazioni di conferma viene risolto in questo ordine standard di OpenClaw:

- `channels["matrix"].accounts.<accountId>.ackReaction`
- `channels["matrix"].ackReaction`
- `messages.ackReaction`
- fallback all'emoji di identità dell'agente

L'ambito delle reazioni di conferma viene risolto in questo ordine:

- `channels["matrix"].accounts.<accountId>.ackReactionScope`
- `channels["matrix"].ackReactionScope`
- `messages.ackReactionScope`

La modalità di notifica delle reazioni viene risolta in questo ordine:

- `channels["matrix"].accounts.<accountId>.reactionNotifications`
- `channels["matrix"].reactionNotifications`
- predefinito: `own`

Comportamento:

- `reactionNotifications: "own"` inoltra gli eventi `m.reaction` aggiunti quando puntano a messaggi Matrix scritti dal bot.
- `reactionNotifications: "off"` disattiva gli eventi di sistema delle reazioni.
- Le rimozioni delle reazioni non vengono sintetizzate in eventi di sistema perché Matrix le espone come redazioni, non come rimozioni standalone di `m.reaction`.

## Contesto della cronologia

- `channels.matrix.historyLimit` controlla quanti messaggi recenti della stanza vengono inclusi come `InboundHistory` quando un messaggio di una stanza Matrix attiva l'agente. Ripiega su `messages.groupChat.historyLimit`; se entrambi non sono impostati, il valore predefinito effettivo è `0`. Imposta `0` per disattivarlo.
- La cronologia delle stanze Matrix è limitata alla stanza. I DM continuano a usare la normale cronologia della sessione.
- La cronologia delle stanze Matrix è solo pending: OpenClaw memorizza temporaneamente i messaggi della stanza che non hanno ancora attivato una risposta, poi acquisisce un'istantanea di quella finestra quando arriva una menzione o un altro trigger.
- Il messaggio trigger corrente non è incluso in `InboundHistory`; resta nel corpo principale in ingresso per quel turno.
- I retry dello stesso evento Matrix riutilizzano l'istantanea originale della cronologia invece di scorrere in avanti verso messaggi più recenti della stanza.

## Visibilità del contesto

Matrix supporta il controllo condiviso `contextVisibility` per il contesto supplementare della stanza, come testo di risposta recuperato, radici dei thread e cronologia pending.

- `contextVisibility: "all"` è il valore predefinito. Il contesto supplementare viene mantenuto così come ricevuto.
- `contextVisibility: "allowlist"` filtra il contesto supplementare in base ai mittenti consentiti dai controlli attivi di allowlist della stanza/utente.
- `contextVisibility: "allowlist_quote"` si comporta come `allowlist`, ma mantiene comunque una risposta esplicitamente citata.

Questa impostazione influisce sulla visibilità del contesto supplementare, non sul fatto che il messaggio in ingresso stesso possa attivare una risposta.
L'autorizzazione del trigger continua a derivare da `groupPolicy`, `groups`, `groupAllowFrom` e dalle impostazioni dei criteri DM.

## Criteri per DM e stanze

```json5
{
  channels: {
    matrix: {
      dm: {
        policy: "allowlist",
        allowFrom: ["@admin:example.org"],
        threadReplies: "off",
      },
      groupPolicy: "allowlist",
      groupAllowFrom: ["@admin:example.org"],
      groups: {
        "!roomid:example.org": {
          requireMention: true,
        },
      },
    },
  },
}
```

Consulta [Gruppi](/it/channels/groups) per il comportamento di gating tramite menzioni e della allowlist.

Esempio di pairing per i DM Matrix:

```bash
openclaw pairing list matrix
openclaw pairing approve matrix <CODE>
```

Se un utente Matrix non approvato continua a scriverti prima dell'approvazione, OpenClaw riutilizza lo stesso codice di pairing in sospeso e può inviare di nuovo una risposta di promemoria dopo un breve cooldown invece di generarne uno nuovo.

Consulta [Pairing](/it/channels/pairing) per il flusso condiviso di pairing dei DM e il layout di archiviazione.

## Riparazione diretta della stanza

Se lo stato dei messaggi diretti non è sincronizzato, OpenClaw può finire con mapping `m.direct` obsoleti che puntano a vecchie stanze singole invece che al DM attivo. Ispeziona il mapping corrente per un peer con:

```bash
openclaw matrix direct inspect --user-id @alice:example.org
```

Riparalo con:

```bash
openclaw matrix direct repair --user-id @alice:example.org
```

Il flusso di riparazione:

- preferisce un DM stretto 1:1 già mappato in `m.direct`
- ripiega su qualsiasi DM stretto 1:1 attualmente unito con quell'utente
- crea una nuova stanza diretta e riscrive `m.direct` se non esiste alcun DM sano

Il flusso di riparazione non elimina automaticamente le vecchie stanze. Si limita a selezionare il DM sano e aggiornare il mapping così i nuovi invii Matrix, gli avvisi di verifica e gli altri flussi di messaggi diretti tornano a puntare alla stanza corretta.

## Approvazioni exec

Matrix può agire come client di approvazione nativo per un account Matrix. I controlli nativi
di instradamento DM/canale restano comunque nella configurazione delle approvazioni exec:

- `channels.matrix.execApprovals.enabled`
- `channels.matrix.execApprovals.approvers` (facoltativo; ripiega su `channels.matrix.dm.allowFrom`)
- `channels.matrix.execApprovals.target` (`dm` | `channel` | `both`, predefinito: `dm`)
- `channels.matrix.execApprovals.agentFilter`
- `channels.matrix.execApprovals.sessionFilter`

Gli approvatori devono essere ID utente Matrix come `@owner:example.org`. Matrix abilita automaticamente le approvazioni native quando `enabled` non è impostato oppure è `"auto"` e almeno un approvatore può essere risolto. Le approvazioni exec usano prima `execApprovals.approvers` e possono ripiegare su `channels.matrix.dm.allowFrom`. Le approvazioni dei Plugin si autorizzano tramite `channels.matrix.dm.allowFrom`. Imposta `enabled: false` per disabilitare esplicitamente Matrix come client di approvazione nativo. Altrimenti, le richieste di approvazione ripiegano su altri percorsi di approvazione configurati o sui criteri di fallback delle approvazioni.

L'instradamento nativo di Matrix supporta entrambi i tipi di approvazione:

- `channels.matrix.execApprovals.*` controlla la modalità nativa di fanout DM/canale per i prompt di approvazione Matrix.
- Le approvazioni exec usano l'insieme di approvatori exec da `execApprovals.approvers` o `channels.matrix.dm.allowFrom`.
- Le approvazioni dei Plugin usano la allowlist DM Matrix da `channels.matrix.dm.allowFrom`.
- Le scorciatoie di reazione Matrix e gli aggiornamenti dei messaggi si applicano sia alle approvazioni exec sia a quelle dei Plugin.

Regole di consegna:

- `target: "dm"` invia i prompt di approvazione ai DM degli approvatori
- `target: "channel"` rimanda il prompt alla stanza o al DM Matrix di origine
- `target: "both"` invia ai DM degli approvatori e alla stanza o al DM Matrix di origine

I prompt di approvazione Matrix inizializzano scorciatoie di reazione sul messaggio di approvazione primario:

- `✅` = consenti una volta
- `❌` = nega
- `♾️` = consenti sempre quando tale decisione è permessa dai criteri exec effettivi

Gli approvatori possono reagire a quel messaggio o usare i comandi slash di fallback: `/approve <id> allow-once`, `/approve <id> allow-always` oppure `/approve <id> deny`.

Solo gli approvatori risolti possono approvare o negare. Per le approvazioni exec, la consegna nel canale include il testo del comando, quindi abilita `channel` o `both` solo nelle stanze attendibili.

Override per account:

- `channels.matrix.accounts.<account>.execApprovals`

Documentazione correlata: [Approvazioni exec](/it/tools/exec-approvals)

## Comandi slash

I comandi slash di Matrix (per esempio `/new`, `/reset`, `/model`) funzionano direttamente nei DM. Nelle stanze, OpenClaw riconosce anche i comandi slash preceduti dalla menzione Matrix del bot stesso, quindi `@bot:server /new` attiva il percorso dei comandi senza richiedere una regex di menzione personalizzata. Questo mantiene il bot reattivo ai post in stile stanza `@mention /command` che Element e client simili emettono quando un utente completa con Tab il bot prima di digitare il comando.

Le regole di autorizzazione continuano ad applicarsi: i mittenti dei comandi devono soddisfare i criteri DM o della stanza in termini di allowlist/proprietario proprio come per i messaggi normali.

## Multi-account

```json5
{
  channels: {
    matrix: {
      enabled: true,
      defaultAccount: "assistant",
      dm: { policy: "pairing" },
      accounts: {
        assistant: {
          homeserver: "https://matrix.example.org",
          accessToken: "syt_assistant_xxx",
          encryption: true,
        },
        alerts: {
          homeserver: "https://matrix.example.org",
          accessToken: "syt_alerts_xxx",
          dm: {
            policy: "allowlist",
            allowFrom: ["@ops:example.org"],
            threadReplies: "off",
          },
        },
      },
    },
  },
}
```

I valori di livello superiore `channels.matrix` agiscono come predefiniti per gli account con nome, a meno che un account non li sovrascriva.
Puoi assegnare le voci di stanza ereditate a un solo account Matrix con `groups.<room>.account`.
Le voci senza `account` restano condivise tra tutti gli account Matrix e le voci con `account: "default"` continuano a funzionare quando l'account predefinito è configurato direttamente al livello superiore `channels.matrix.*`.
I predefiniti di autenticazione condivisi parziali non creano da soli un account predefinito implicito separato. OpenClaw sintetizza l'account `default` di livello superiore solo quando quel predefinito ha autenticazione aggiornata (`homeserver` più `accessToken`, oppure `homeserver` più `userId` e `password`); gli account con nome possono comunque restare rilevabili da `homeserver` più `userId` quando le credenziali in cache soddisfano l'autenticazione in un secondo momento.
Se Matrix ha già esattamente un account con nome, oppure `defaultAccount` punta a una chiave di account con nome esistente, la promozione di riparazione/setup da account singolo a multi-account preserva quell'account invece di creare una nuova voce `accounts.default`. Solo le chiavi di autenticazione/bootstrap Matrix vengono spostate in quell'account promosso; le chiavi condivise dei criteri di consegna restano al livello superiore.
Imposta `defaultAccount` quando vuoi che OpenClaw preferisca un account Matrix con nome per instradamento implicito, probing e operazioni CLI.
Se sono configurati più account Matrix e un ID account è `default`, OpenClaw usa implicitamente quell'account anche quando `defaultAccount` non è impostato.
Se configuri più account con nome, imposta `defaultAccount` o passa `--account <id>` per i comandi CLI che dipendono dalla selezione implicita dell'account.
Passa `--account <id>` a `openclaw matrix verify ...` e `openclaw matrix devices ...` quando vuoi sovrascrivere quella selezione implicita per un singolo comando.

Consulta [Riferimento di configurazione](/it/gateway/config-channels#multi-account-all-channels) per il modello multi-account condiviso.

## Homeserver privati/LAN

Per impostazione predefinita, OpenClaw blocca gli homeserver Matrix privati/interni per protezione SSRF, a meno che tu
non scelga esplicitamente di abilitarli per account.

Se il tuo homeserver gira su localhost, un IP LAN/Tailscale o un hostname interno, abilita
`network.dangerouslyAllowPrivateNetwork` per quell'account Matrix:

```json5
{
  channels: {
    matrix: {
      homeserver: "http://matrix-synapse:8008",
      network: {
        dangerouslyAllowPrivateNetwork: true,
      },
      accessToken: "syt_internal_xxx",
    },
  },
}
```

Esempio di configurazione CLI:

```bash
openclaw matrix account add \
  --account ops \
  --homeserver http://matrix-synapse:8008 \
  --allow-private-network \
  --access-token syt_ops_xxx
```

Questa scelta esplicita consente solo destinazioni private/interne attendibili. Gli homeserver pubblici in chiaro come
`http://matrix.example.org:8008` restano bloccati. Preferisci `https://` quando possibile.

## Instradamento del traffico Matrix tramite proxy

Se il tuo deployment Matrix richiede un proxy HTTP(S) in uscita esplicito, imposta `channels.matrix.proxy`:

```json5
{
  channels: {
    matrix: {
      homeserver: "https://matrix.example.org",
      accessToken: "syt_bot_xxx",
      proxy: "http://127.0.0.1:7890",
    },
  },
}
```

Gli account con nome possono sovrascrivere il valore predefinito di livello superiore con `channels.matrix.accounts.<id>.proxy`.
OpenClaw usa la stessa impostazione proxy sia per il traffico runtime Matrix sia per i probe di stato dell'account.

## Risoluzione della destinazione

Matrix accetta queste forme di destinazione ovunque OpenClaw ti chieda una stanza o un utente di destinazione:

- Utenti: `@user:server`, `user:@user:server` oppure `matrix:user:@user:server`
- Stanze: `!room:server`, `room:!room:server` oppure `matrix:room:!room:server`
- Alias: `#alias:server`, `channel:#alias:server` oppure `matrix:channel:#alias:server`

La ricerca live nella directory usa l'account Matrix connesso:

- Le ricerche utente interrogano la directory utenti Matrix su quell'homeserver.
- Le ricerche stanza accettano direttamente ID stanza e alias espliciti, poi ripiegano sulla ricerca dei nomi delle stanze unite per quell'account.
- La ricerca per nome delle stanze unite è best-effort. Se un nome stanza non può essere risolto in un ID o alias, viene ignorato dalla risoluzione runtime della allowlist.

## Riferimento di configurazione

- `enabled`: abilita o disabilita il canale.
- `name`: etichetta facoltativa per l'account.
- `defaultAccount`: ID account preferito quando sono configurati più account Matrix.
- `homeserver`: URL dell'homeserver, per esempio `https://matrix.example.org`.
- `network.dangerouslyAllowPrivateNetwork`: consente a questo account Matrix di connettersi a homeserver privati/interni. Abilitalo quando l'homeserver si risolve in `localhost`, un IP LAN/Tailscale o un host interno come `matrix-synapse`.
- `proxy`: URL facoltativo di proxy HTTP(S) per il traffico Matrix. Gli account con nome possono sovrascrivere il valore predefinito di livello superiore con il proprio `proxy`.
- `userId`: ID utente Matrix completo, per esempio `@bot:example.org`.
- `accessToken`: token di accesso per l'autenticazione basata su token. Sono supportati valori in chiaro e valori SecretRef per `channels.matrix.accessToken` e `channels.matrix.accounts.<id>.accessToken` nei provider env/file/exec. Consulta [Gestione dei segreti](/it/gateway/secrets).
- `password`: password per l'accesso basato su password. Sono supportati valori in chiaro e valori SecretRef.
- `deviceId`: ID dispositivo Matrix esplicito.
- `deviceName`: nome visualizzato del dispositivo per l'accesso con password.
- `avatarUrl`: URL dell'avatar self memorizzato per la sincronizzazione del profilo e gli aggiornamenti `profile set`.
- `initialSyncLimit`: numero massimo di eventi recuperati durante la sincronizzazione iniziale all'avvio.
- `encryption`: abilita E2EE.
- `allowlistOnly`: quando è `true`, aggiorna il criterio delle stanze `open` a `allowlist` e forza tutti i criteri DM attivi tranne `disabled` (inclusi `pairing` e `open`) a `allowlist`. Non influisce sui criteri `disabled`.
- `allowBots`: consente messaggi da altri account Matrix OpenClaw configurati (`true` o `"mentions"`).
- `groupPolicy`: `open`, `allowlist` o `disabled`.
- `contextVisibility`: modalità di visibilità del contesto supplementare della stanza (`all`, `allowlist`, `allowlist_quote`).
- `groupAllowFrom`: allowlist di ID utente per il traffico delle stanze. Gli ID utente Matrix completi sono i più sicuri; le corrispondenze esatte nella directory vengono risolte all'avvio e quando la allowlist cambia mentre il monitor è in esecuzione. I nomi non risolti vengono ignorati.
- `historyLimit`: numero massimo di messaggi della stanza da includere come contesto della cronologia di gruppo. Ripiega su `messages.groupChat.historyLimit`; se entrambi non sono impostati, il valore predefinito effettivo è `0`. Imposta `0` per disattivarlo.
- `replyToMode`: `off`, `first`, `all` o `batched`.
- `markdown`: configurazione facoltativa del rendering Markdown per il testo Matrix in uscita.
- `streaming`: `off` (predefinito), `"partial"`, `"quiet"`, `true` o `false`. `"partial"` e `true` abilitano aggiornamenti delle bozze con anteprima iniziale usando normali messaggi di testo Matrix. `"quiet"` usa avvisi di anteprima senza notifica per configurazioni self-hosted con regole push. `false` equivale a `"off"`.
- `blockStreaming`: `true` abilita messaggi di avanzamento separati per i blocchi completati dell'assistente mentre è attivo lo streaming della bozza di anteprima.
- `threadReplies`: `off`, `inbound` o `always`.
- `threadBindings`: override per canale per instradamento e ciclo di vita delle sessioni associate ai thread.
- `startupVerification`: modalità automatica di richiesta di autoverifica all'avvio (`if-unverified`, `off`).
- `startupVerificationCooldownHours`: cooldown prima di ritentare le richieste automatiche di verifica all'avvio.
- `textChunkLimit`: dimensione dei blocchi dei messaggi in uscita in caratteri (si applica quando `chunkMode` è `length`).
- `chunkMode`: `length` divide i messaggi in base al numero di caratteri; `newline` li divide ai confini di riga.
- `responsePrefix`: stringa facoltativa anteposta a tutte le risposte in uscita per questo canale.
- `ackReaction`: override facoltativo della reazione di conferma per questo canale/account.
- `ackReactionScope`: override facoltativo dell'ambito della reazione di conferma (`group-mentions`, `group-all`, `direct`, `all`, `none`, `off`).
- `reactionNotifications`: modalità di notifica delle reazioni in entrata (`own`, `off`).
- `mediaMaxMb`: limite dimensionale dei media in MB per invii in uscita e elaborazione dei media in entrata.
- `autoJoin`: criterio di unione automatica agli inviti (`always`, `allowlist`, `off`). Predefinito: `off`. Si applica a tutti gli inviti Matrix, inclusi quelli in stile DM.
- `autoJoinAllowlist`: stanze/alias consentiti quando `autoJoin` è `allowlist`. Le voci alias vengono risolte in ID stanza durante la gestione dell'invito; OpenClaw non si fida dello stato alias dichiarato dalla stanza invitata.
- `dm`: blocco dei criteri DM (`enabled`, `policy`, `allowFrom`, `sessionScope`, `threadReplies`).
- `dm.policy`: controlla l'accesso DM dopo che OpenClaw è entrato nella stanza e l'ha classificata come DM. Non modifica il fatto che un invito venga unito automaticamente.
- `dm.allowFrom`: allowlist di ID utente per il traffico DM. Gli ID utente Matrix completi sono i più sicuri; le corrispondenze esatte nella directory vengono risolte all'avvio e quando la allowlist cambia mentre il monitor è in esecuzione. I nomi non risolti vengono ignorati.
- `dm.sessionScope`: `per-user` (predefinito) o `per-room`. Usa `per-room` quando vuoi che ogni stanza DM Matrix mantenga un contesto separato anche se il peer è lo stesso.
- `dm.threadReplies`: override dei criteri thread solo per DM (`off`, `inbound`, `always`). Sovrascrive l'impostazione `threadReplies` di livello superiore sia per il posizionamento delle risposte sia per l'isolamento della sessione nei DM.
- `execApprovals`: consegna nativa Matrix delle approvazioni exec (`enabled`, `approvers`, `target`, `agentFilter`, `sessionFilter`).
- `execApprovals.approvers`: ID utente Matrix autorizzati ad approvare richieste exec. Facoltativo quando `dm.allowFrom` identifica già gli approvatori.
- `execApprovals.target`: `dm | channel | both` (predefinito: `dm`).
- `accounts`: override con nome per account. I valori di livello superiore `channels.matrix` agiscono come predefiniti per queste voci.
- `groups`: mappa dei criteri per stanza. Preferisci ID stanza o alias; i nomi stanza non risolti vengono ignorati a runtime. L'identità sessione/gruppo usa l'ID stanza stabile dopo la risoluzione.
- `groups.<room>.account`: limita una voce di stanza ereditata a uno specifico account Matrix nelle configurazioni multi-account.
- `groups.<room>.allowBots`: override a livello di stanza per mittenti bot configurati (`true` o `"mentions"`).
- `groups.<room>.users`: allowlist dei mittenti per stanza.
- `groups.<room>.tools`: override per stanza di autorizzazione/blocco degli strumenti.
- `groups.<room>.autoReply`: override a livello di stanza del gating tramite menzione. `true` disabilita i requisiti di menzione per quella stanza; `false` li forza nuovamente.
- `groups.<room>.skills`: filtro Skills facoltativo a livello di stanza.
- `groups.<room>.systemPrompt`: frammento facoltativo di prompt di sistema a livello di stanza.
- `rooms`: alias legacy di `groups`.
- `actions`: gating per azione degli strumenti (`messages`, `reactions`, `pins`, `profile`, `memberInfo`, `channelInfo`, `verification`).

## Correlati

- [Panoramica dei canali](/it/channels) — tutti i canali supportati
- [Pairing](/it/channels/pairing) — autenticazione DM e flusso di pairing
- [Gruppi](/it/channels/groups) — comportamento della chat di gruppo e gating tramite menzione
- [Instradamento dei canali](/it/channels/channel-routing) — instradamento della sessione per i messaggi
- [Sicurezza](/it/gateway/security) — modello di accesso e hardening
