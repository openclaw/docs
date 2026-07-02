---
read_when:
    - Lavorare sulle funzionalità di Telegram o sui webhook
summary: Stato del supporto del bot Telegram, funzionalità e configurazione
title: Telegram
x-i18n:
    generated_at: "2026-07-02T17:38:18Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 3b9fc8030adf0525b8b0680fc9ca344cd2c1ba2164b2a4acdb805c7076603bea
    source_path: channels/telegram.md
    workflow: 16
---

Pronto per la produzione per DM e gruppi bot tramite grammY. Il long polling è la modalità predefinita; la modalità webhook è opzionale.

<CardGroup cols={3}>
  <Card title="Pairing" icon="link" href="/it/channels/pairing">
    La policy DM predefinita per Telegram è il pairing.
  </Card>
  <Card title="Risoluzione dei problemi dei canali" icon="wrench" href="/it/channels/troubleshooting">
    Diagnostica cross-channel e playbook di riparazione.
  </Card>
  <Card title="Configurazione del Gateway" icon="settings" href="/it/gateway/configuration">
    Pattern ed esempi completi di configurazione dei canali.
  </Card>
</CardGroup>

## Configurazione rapida

<Steps>
  <Step title="Crea il token del bot in BotFather">
    Apri Telegram e chatta con **@BotFather** (verifica che l'handle sia esattamente `@BotFather`).

    Esegui `/newbot`, segui le istruzioni e salva il token.

  </Step>

  <Step title="Configura token e policy DM">

```json5
{
  channels: {
    telegram: {
      enabled: true,
      botToken: "123:abc",
      dmPolicy: "pairing",
      groups: { "*": { requireMention: true } },
    },
  },
}
```

    Fallback env: `TELEGRAM_BOT_TOKEN=...` (solo account predefinito).
    Telegram **non** usa `openclaw channels login telegram`; configura il token in config/env, quindi avvia il gateway.

  </Step>

  <Step title="Avvia il gateway e approva il primo DM">

```bash
openclaw gateway
openclaw pairing list telegram
openclaw pairing approve telegram <CODE>
```

    I codici di pairing scadono dopo 1 ora.

  </Step>

  <Step title="Aggiungi il bot a un gruppo">
    Aggiungi il bot al tuo gruppo, quindi recupera entrambi gli ID necessari per l'accesso al gruppo:

    - il tuo ID utente Telegram, usato in `allowFrom` / `groupAllowFrom`
    - l'ID della chat del gruppo Telegram, usato come chiave sotto `channels.telegram.groups`

    Per la configurazione iniziale, recupera l'ID della chat del gruppo da `openclaw logs --follow`, da un bot per ID inoltrati o da Bot API `getUpdates`. Dopo che il gruppo è stato consentito, `/whoami@<bot_username>` può confermare gli ID utente e gruppo.

    Gli ID dei supergruppi Telegram negativi che iniziano con `-100` sono ID di chat di gruppo. Inseriscili sotto `channels.telegram.groups`, non sotto `groupAllowFrom`.

  </Step>
</Steps>

<Note>
L'ordine di risoluzione del token è consapevole dell'account. In pratica, i valori di configurazione prevalgono sul fallback env, e `TELEGRAM_BOT_TOKEN` si applica solo all'account predefinito.
Dopo un avvio riuscito, OpenClaw memorizza nella cache l'identità del bot nella directory di stato per un massimo di 24 ore, così i riavvii possono evitare una chiamata Telegram `getMe` aggiuntiva; la modifica o la rimozione del token cancella quella cache.
</Note>

## Impostazioni lato Telegram

<AccordionGroup>
  <Accordion title="Modalità privacy e visibilità nei gruppi">
    I bot Telegram usano per impostazione predefinita la **Modalità Privacy**, che limita quali messaggi di gruppo ricevono.

    Se il bot deve vedere tutti i messaggi di gruppo, puoi:

    - disabilitare la modalità privacy tramite `/setprivacy`, oppure
    - rendere il bot amministratore del gruppo.

    Quando cambi la modalità privacy, rimuovi e aggiungi di nuovo il bot in ogni gruppo, così Telegram applica la modifica.

  </Accordion>

  <Accordion title="Autorizzazioni del gruppo">
    Lo stato di amministratore è controllato nelle impostazioni del gruppo Telegram.

    I bot amministratori ricevono tutti i messaggi di gruppo, utile per comportamenti di gruppo sempre attivi.

  </Accordion>

  <Accordion title="Opzioni utili di BotFather">

    - `/setjoingroups` per consentire/negare l'aggiunta ai gruppi
    - `/setprivacy` per il comportamento di visibilità nei gruppi

  </Accordion>
</AccordionGroup>

## Controllo accessi e attivazione

### Identità del bot nei gruppi

Nei gruppi Telegram e negli argomenti dei forum, una menzione esplicita dell'handle del bot configurato (per esempio `@my_bot`) viene trattata come indirizzata all'agente OpenClaw selezionato, anche quando il nome della persona dell'agente differisce dal nome utente Telegram. La policy di silenzio del gruppo si applica comunque al traffico di gruppo non correlato, ma l'handle del bot in sé non è considerato "qualcun altro".

<Tabs>
  <Tab title="Policy DM">
    `channels.telegram.dmPolicy` controlla l'accesso ai messaggi diretti:

    - `pairing` (predefinito)
    - `allowlist` (richiede almeno un ID mittente in `allowFrom`)
    - `open` (richiede che `allowFrom` includa `"*"`)
    - `disabled`

    `dmPolicy: "open"` con `allowFrom: ["*"]` consente a qualsiasi account Telegram che trova o indovina il nome utente del bot di comandare il bot. Usalo solo per bot intenzionalmente pubblici con strumenti strettamente limitati; i bot con un solo proprietario dovrebbero usare `allowlist` con ID utente numerici.

    `channels.telegram.allowFrom` accetta ID utente Telegram numerici. I prefissi `telegram:` / `tg:` sono accettati e normalizzati.
    Nelle configurazioni multi-account, un `channels.telegram.allowFrom` restrittivo a livello superiore è trattato come un confine di sicurezza: le voci `allowFrom: ["*"]` a livello account non rendono pubblico quell'account a meno che l'allowlist effettiva dell'account contenga ancora un wildcard esplicito dopo il merge.
    `dmPolicy: "allowlist"` con `allowFrom` vuoto blocca tutti i DM ed è rifiutato dalla validazione della configurazione.
    La configurazione richiede solo ID utente numerici.
    Se hai aggiornato e la tua configurazione contiene voci allowlist `@username`, esegui `openclaw doctor --fix` per risolverle (best-effort; richiede un token bot Telegram).
    Se in precedenza facevi affidamento su file allowlist del pairing store, `openclaw doctor --fix` può recuperare le voci in `channels.telegram.allowFrom` nei flussi allowlist (per esempio quando `dmPolicy: "allowlist"` non ha ancora ID espliciti).

    Per i bot con un solo proprietario, preferisci `dmPolicy: "allowlist"` con ID numerici espliciti in `allowFrom` per mantenere la policy di accesso durevole nella configurazione (invece di dipendere da precedenti approvazioni di pairing).

    Confusione comune: l'approvazione del pairing DM non significa "questo mittente è autorizzato ovunque".
    Il pairing concede accesso ai DM. Se non esiste ancora un proprietario dei comandi, il primo pairing approvato imposta anche `commands.ownerAllowFrom`, così i comandi riservati al proprietario e le approvazioni exec hanno un account operatore esplicito.
    L'autorizzazione dei mittenti nei gruppi proviene comunque da allowlist di configurazione esplicite.
    Se vuoi "sono autorizzato una volta e funzionano sia DM sia comandi di gruppo", inserisci il tuo ID utente Telegram numerico in `channels.telegram.allowFrom`; per i comandi riservati al proprietario, assicurati che `commands.ownerAllowFrom` contenga `telegram:<your user id>`.

    ### Trovare il tuo ID utente Telegram

    Più sicuro (nessun bot di terze parti):

    1. Invia un DM al tuo bot.
    2. Esegui `openclaw logs --follow`.
    3. Leggi `from.id`.

    Metodo ufficiale Bot API:

```bash
curl "https://api.telegram.org/bot<bot_token>/getUpdates"
```

    Metodo di terze parti (meno privato): `@userinfobot` o `@getidsbot`.

  </Tab>

  <Tab title="Policy di gruppo e allowlist">
    Due controlli si applicano insieme:

    1. **Quali gruppi sono consentiti** (`channels.telegram.groups`)
       - nessuna configurazione `groups`:
         - con `groupPolicy: "open"`: qualsiasi gruppo può superare i controlli sugli ID gruppo
         - con `groupPolicy: "allowlist"` (predefinito): i gruppi sono bloccati finché non aggiungi voci `groups` (o `"*"`)
       - `groups` configurato: agisce da allowlist (ID espliciti o `"*"`)

    2. **Quali mittenti sono consentiti nei gruppi** (`channels.telegram.groupPolicy`)
       - `open`
       - `allowlist` (predefinito)
       - `disabled`

    `groupAllowFrom` è usato per filtrare i mittenti nei gruppi. Se non impostato, Telegram ricade su `allowFrom`.
    Le voci `groupAllowFrom` dovrebbero essere ID utente Telegram numerici (i prefissi `telegram:` / `tg:` sono normalizzati).
    Non inserire ID di chat di gruppi o supergruppi Telegram in `groupAllowFrom`. Gli ID chat negativi appartengono a `channels.telegram.groups`.
    Le voci non numeriche sono ignorate per l'autorizzazione dei mittenti.
    Confine di sicurezza (`2026.2.25+`): l'autenticazione dei mittenti nei gruppi **non** eredita le approvazioni del pairing store DM.
    Il pairing resta solo per i DM. Per i gruppi, imposta `groupAllowFrom` o `allowFrom` per gruppo/per argomento.
    Se `groupAllowFrom` non è impostato, Telegram ricade su `allowFrom` di configurazione, non sul pairing store.
    Pattern pratico per bot con un solo proprietario: imposta il tuo ID utente in `channels.telegram.allowFrom`, lascia `groupAllowFrom` non impostato e consenti i gruppi di destinazione sotto `channels.telegram.groups`.
    Nota runtime: se `channels.telegram` manca completamente, il runtime usa per impostazione predefinita `groupPolicy="allowlist"` fail-closed, a meno che `channels.defaults.groupPolicy` sia impostato esplicitamente.

    Configurazione di gruppo solo proprietario:

```json5
{
  channels: {
    telegram: {
      enabled: true,
      dmPolicy: "pairing",
      allowFrom: ["<YOUR_TELEGRAM_USER_ID>"],
      groupPolicy: "allowlist",
      groups: {
        "<GROUP_CHAT_ID>": {
          requireMention: true,
        },
      },
    },
  },
}
```

    Provalo dal gruppo con `@<bot_username> ping`. I messaggi di gruppo semplici non attivano il bot mentre `requireMention: true`.

    Esempio: consenti qualsiasi membro in un gruppo specifico:

```json5
{
  channels: {
    telegram: {
      groups: {
        "-1001234567890": {
          groupPolicy: "open",
          requireMention: false,
        },
      },
    },
  },
}
```

    Esempio: consenti solo utenti specifici dentro un gruppo specifico:

```json5
{
  channels: {
    telegram: {
      groups: {
        "-1001234567890": {
          requireMention: true,
          allowFrom: ["8734062810", "745123456"],
        },
      },
    },
  },
}
```

    <Warning>
      Errore comune: `groupAllowFrom` non è una allowlist di gruppi Telegram.

      - Inserisci gli ID chat negativi di gruppi o supergruppi Telegram come `-1001234567890` sotto `channels.telegram.groups`.
      - Inserisci gli ID utente Telegram come `8734062810` sotto `groupAllowFrom` quando vuoi limitare quali persone dentro un gruppo consentito possono attivare il bot.
      - Usa `groupAllowFrom: ["*"]` solo quando vuoi che qualsiasi membro di un gruppo consentito possa parlare con il bot.

    </Warning>

  </Tab>

  <Tab title="Comportamento delle menzioni">
    Le risposte nei gruppi richiedono una menzione per impostazione predefinita.

    La menzione può provenire da:

    - menzione nativa `@botusername`, oppure
    - pattern di menzione in:
      - `agents.list[].groupChat.mentionPatterns`
      - `messages.groupChat.mentionPatterns`

    Toggle di comando a livello sessione:

    - `/activation always`
    - `/activation mention`

    Questi aggiornano solo lo stato della sessione. Usa la configurazione per la persistenza.

    Esempio di configurazione persistente:

```json5
{
  channels: {
    telegram: {
      groups: {
        "*": { requireMention: false },
      },
    },
  },
}
```

    Il contesto della cronologia di gruppo è sempre attivo per i gruppi ed è limitato da
    `historyLimit`. Imposta `channels.telegram.historyLimit: 0` per disabilitare la
    finestra di cronologia dei gruppi Telegram. La chiave ritirata `includeGroupHistoryContext`
    viene rimossa da `openclaw doctor --fix`.

    Recuperare l'ID della chat del gruppo:

    - inoltra un messaggio del gruppo a `@userinfobot` / `@getidsbot`
    - oppure leggi `chat.id` da `openclaw logs --follow`
    - oppure ispeziona Bot API `getUpdates`
    - dopo che il gruppo è consentito, esegui `/whoami@<bot_username>` se i comandi nativi sono abilitati

  </Tab>
</Tabs>

## Comportamento runtime

- Telegram è di proprietà del processo Gateway.
- Il routing è deterministico: le risposte in ingresso di Telegram tornano a Telegram (il modello non sceglie i canali).
- I messaggi in ingresso vengono normalizzati nell'envelope condiviso del canale con metadati di risposta, placeholder multimediali e contesto persistito della catena di risposte per le risposte Telegram osservate dal Gateway.
- Le sessioni di gruppo sono isolate per ID gruppo. Gli argomenti del forum aggiungono `:topic:<threadId>` per mantenere isolati gli argomenti.
- I messaggi DM possono includere `message_thread_id`; OpenClaw lo preserva per le risposte. Le sessioni degli argomenti DM si separano solo quando Telegram `getMe` riporta `has_topics_enabled: true` per il bot; altrimenti i DM restano nella sessione piatta.
- Il long polling usa grammY runner con sequenziamento per chat/per thread. La concorrenza complessiva del sink del runner usa `agents.defaults.maxConcurrent`.
- L'avvio multi-account limita le sonde Telegram `getMe` concorrenti, così grandi flotte di bot non distribuiscono contemporaneamente la sonda di ogni account.
- Il long polling è protetto all'interno di ciascun processo Gateway, così un solo poller attivo può usare un token bot alla volta. Se vedi ancora conflitti `getUpdates` 409, è probabile che un altro Gateway OpenClaw, script o poller esterno stia usando lo stesso token.
- I riavvii del watchdog del long polling si attivano per impostazione predefinita dopo 120 secondi senza liveness `getUpdates` completata. Aumenta `channels.telegram.pollingStallThresholdMs` solo se il tuo deployment vede ancora falsi riavvii per polling bloccato durante lavori di lunga durata. Il valore è in millisecondi ed è consentito da `30000` a `600000`; sono supportate override per account.
- Telegram Bot API non supporta le conferme di lettura (`sendReadReceipts` non si applica).

<Note>
  `channels.telegram.dm.threadReplies` e `channels.telegram.direct.<chatId>.threadReplies` sono stati rimossi. Esegui `openclaw doctor --fix` dopo l'aggiornamento se la tua configurazione contiene ancora quelle chiavi. Il routing degli argomenti DM ora segue la capability del bot da Telegram `getMe.has_topics_enabled`, controllata dalla modalità threaded di BotFather: i bot con argomenti abilitati usano sessioni DM con ambito thread quando Telegram invia `message_thread_id`; gli altri DM restano nella sessione piatta.
</Note>

## Riferimento funzionalità

<AccordionGroup>
  <Accordion title="Anteprima live stream (modifiche ai messaggi)">
    OpenClaw può trasmettere risposte parziali in tempo reale:

    - chat dirette: messaggio di anteprima + `editMessageText`
    - gruppi/argomenti: messaggio di anteprima + `editMessageText`

    Requisito:

    - `channels.telegram.streaming` è `off | partial | block | progress` (predefinito: `partial`)
    - le brevi anteprime iniziali della risposta vengono debounce-ate, poi materializzate dopo un ritardo limitato se l'esecuzione è ancora attiva
    - `progress` mantiene una bozza di stato modificabile per l'avanzamento degli strumenti, mostra l'etichetta di stato stabile quando l'attività di risposta arriva prima dell'avanzamento dello strumento, la cancella al completamento e invia la risposta finale come messaggio normale
    - `streaming.preview.toolProgress` controlla se gli aggiornamenti di strumenti/avanzamento riutilizzano lo stesso messaggio di anteprima modificato (predefinito: `true` quando lo streaming di anteprima è attivo)
    - `streaming.preview.commandText` controlla i dettagli comando/exec dentro quelle righe di avanzamento strumenti: `raw` (predefinito, preserva il comportamento rilasciato) o `status` (solo etichetta dello strumento)
    - `streaming.progress.commentary` (predefinito: `false`) abilita testo di commento/preambolo dell'assistente nella bozza temporanea di avanzamento
    - `channels.telegram.streamMode` legacy, valori booleani `streaming` e chiavi native di anteprima bozza ritirate vengono rilevati; esegui `openclaw doctor --fix` per migrarli alla configurazione di streaming corrente

    Gli aggiornamenti di anteprima dell'avanzamento strumenti sono le brevi righe di stato mostrate mentre gli strumenti sono in esecuzione, ad esempio esecuzione di comandi, letture di file, aggiornamenti di pianificazione, riepiloghi di patch o testo di preambolo/commento Codex in modalità app-server Codex. Telegram li mantiene abilitati per impostazione predefinita per corrispondere al comportamento OpenClaw rilasciato da `v2026.4.22` e versioni successive.

    Per mantenere l'anteprima modificata per il testo della risposta ma nascondere le righe di avanzamento strumenti, imposta:

    ```json
    {
      "channels": {
        "telegram": {
          "streaming": {
            "mode": "partial",
            "preview": {
              "toolProgress": false
            }
          }
        }
      }
    }
    ```

    Per mantenere visibile l'avanzamento strumenti ma nascondere il testo comando/exec, imposta:

    ```json
    {
      "channels": {
        "telegram": {
          "streaming": {
            "mode": "partial",
            "preview": {
              "commandText": "status"
            }
          }
        }
      }
    }
    ```

    Usa la modalità `progress` quando vuoi un avanzamento strumenti visibile senza modificare la risposta finale nello stesso messaggio. Inserisci la policy del testo comando sotto `streaming.progress`:

    ```json
    {
      "channels": {
        "telegram": {
          "streaming": {
            "mode": "progress",
            "progress": {
              "toolProgress": true,
              "commandText": "status"
            }
          }
        }
      }
    }
    ```

    Usa `streaming.mode: "off"` solo quando vuoi consegna solo finale: le modifiche alle anteprime Telegram sono disabilitate e il chatter generico di strumenti/avanzamento viene soppresso invece di essere inviato come messaggi di stato autonomi. Le richieste di approvazione, i payload multimediali e gli errori continuano a passare dalla normale consegna finale. Usa `streaming.preview.toolProgress: false` quando vuoi solo mantenere le modifiche all'anteprima della risposta nascondendo le righe di stato dell'avanzamento strumenti.

    <Note>
      Le risposte a citazioni selezionate di Telegram sono l'eccezione. Quando `replyToMode` è `"first"`, `"all"` o `"batched"` e il messaggio in ingresso include testo di citazione selezionato, OpenClaw invia la risposta finale tramite il percorso nativo di risposta con citazione di Telegram invece di modificare l'anteprima della risposta, quindi `streaming.preview.toolProgress` non può mostrare le brevi righe di stato per quel turno. Le risposte al messaggio corrente senza testo di citazione selezionato mantengono comunque lo streaming di anteprima. Imposta `replyToMode: "off"` quando la visibilità dell'avanzamento strumenti conta più delle risposte native con citazione, oppure imposta `streaming.preview.toolProgress: false` per riconoscere il compromesso.
    </Note>

    Per risposte solo testo:

    - anteprime brevi DM/gruppo/argomento: OpenClaw mantiene lo stesso messaggio di anteprima ed esegue la modifica finale sul posto
    - i finali di testo lunghi che si dividono in più messaggi Telegram riutilizzano l'anteprima esistente come primo blocco finale quando possibile, poi inviano solo i blocchi rimanenti
    - i finali in modalità progress cancellano la bozza di stato e usano la normale consegna finale invece di modificare la bozza nella risposta
    - se la modifica finale fallisce prima che il testo completato sia confermato, OpenClaw usa la normale consegna finale e pulisce l'anteprima obsoleta

    Per risposte complesse (ad esempio payload multimediali), OpenClaw ripiega sulla normale consegna finale e poi pulisce il messaggio di anteprima.

    Lo streaming di anteprima è separato dallo streaming a blocchi. Quando lo streaming a blocchi è abilitato esplicitamente per Telegram, OpenClaw salta lo streaming di anteprima per evitare doppio streaming.

    Comportamento dello stream di ragionamento:

    - `/reasoning stream` usa il percorso di anteprima del ragionamento di un canale supportato; su Telegram, trasmette il ragionamento nell'anteprima live durante la generazione
    - l'anteprima del ragionamento viene eliminata dopo la consegna finale; usa `/reasoning on` quando il ragionamento deve restare visibile
    - la risposta finale viene inviata senza testo di ragionamento

  </Accordion>

  <Accordion title="Formattazione dei messaggi avanzata">
    Il testo in uscita usa per impostazione predefinita messaggi HTML Telegram standard, così le risposte restano leggibili nei client Telegram attuali. Questa modalità di compatibilità supporta grassetto, corsivo, link, codice, spoiler e citazioni normali, ma non blocchi solo rich di Bot API 10.1 come tabelle native, dettagli, rich media e formule.

    Imposta `channels.telegram.richMessages: true` per abilitare i messaggi rich di Bot API 10.1:

```json5
{
  channels: {
    telegram: {
      richMessages: true,
    },
  },
}
```

    Quando abilitato:

    - All'agente viene comunicato che i messaggi rich di Telegram sono disponibili per questo bot/account.
    - Il testo Markdown viene renderizzato tramite la Markdown IR di OpenClaw e inviato come HTML rich Telegram.
    - I payload HTML rich espliciti preservano i tag Bot API 10.1 supportati, come intestazioni, tabelle, dettagli, rich media e formule.
    - Le didascalie dei media continuano a usare le didascalie HTML di Telegram perché i messaggi rich non sostituiscono le didascalie.

    Questo tiene il testo del modello lontano dai sigilli Rich Markdown di Telegram, così valute come `$400-600K` non vengono interpretate come matematica. Il testo rich lungo viene diviso automaticamente tra i limiti di testo rich e blocchi rich di Telegram. Le tabelle oltre il limite di colonne di Telegram vengono inviate come blocchi di codice.

    Predefinito: disattivato per compatibilità con i client. I messaggi rich richiedono client Telegram compatibili; alcuni client Desktop, Web, Android e di terze parti attuali visualizzano i messaggi rich accettati come non supportati. Mantieni questa opzione disabilitata a meno che ogni client usato con il bot possa renderizzarli. `/status` mostra se la sessione Telegram corrente ha i messaggi rich attivati o disattivati.

    Le anteprime dei link sono abilitate per impostazione predefinita. `channels.telegram.linkPreview: false` salta il rilevamento automatico delle entità per il testo rich.

  </Accordion>

  <Accordion title="Comandi nativi e comandi personalizzati">
    La registrazione del menu dei comandi Telegram viene gestita all'avvio con `setMyCommands`.

    Valori predefiniti dei comandi nativi:

    - `commands.native: "auto"` abilita i comandi nativi per Telegram

    Aggiungi voci di menu per comandi personalizzati:

```json5
{
  channels: {
    telegram: {
      customCommands: [
        { command: "backup", description: "Backup Git" },
        { command: "generate", description: "Crea un'immagine" },
      ],
    },
  },
}
```

    Regole:

    - i nomi vengono normalizzati (rimuove `/` iniziale, minuscole)
    - pattern valido: `a-z`, `0-9`, `_`, lunghezza `1..32`
    - i comandi personalizzati non possono sovrascrivere i comandi nativi
    - conflitti/duplicati vengono saltati e registrati nei log

    Note:

    - i comandi personalizzati sono solo voci di menu; non implementano automaticamente un comportamento
    - i comandi plugin/skill possono comunque funzionare quando digitati anche se non mostrati nel menu Telegram

    Se i comandi nativi sono disabilitati, quelli integrati vengono rimossi. I comandi personalizzati/plugin possono comunque registrarsi se configurati.

    Errori di configurazione comuni:

    - `setMyCommands failed` con `BOT_COMMANDS_TOO_MUCH` significa che il menu Telegram è ancora andato in overflow dopo il trimming; riduci i comandi plugin/skill/personalizzati o disabilita `channels.telegram.commands.native`.
    - `deleteWebhook`, `deleteMyCommands` o `setMyCommands` che falliscono con `404: Not Found` mentre i comandi curl diretti di Bot API funzionano possono indicare che `channels.telegram.apiRoot` è stato impostato sull'endpoint completo `/bot<TOKEN>`. `apiRoot` deve essere solo la radice Bot API, e `openclaw doctor --fix` rimuove un `/bot<TOKEN>` finale accidentale.
    - `getMe returned 401` significa che Telegram ha rifiutato il token bot configurato. Aggiorna `botToken`, `tokenFile` o `TELEGRAM_BOT_TOKEN` con il token BotFather corrente; OpenClaw si ferma prima del polling, quindi questo non viene segnalato come errore di cleanup Webhook.
    - `setMyCommands failed` con errori di rete/fetch di solito significa che DNS/HTTPS in uscita verso `api.telegram.org` è bloccato.

    ### Comandi di associazione dispositivo (plugin `device-pair`)

    Quando il plugin `device-pair` è installato:

    1. `/pair` genera codice di configurazione
    2. incolla il codice nell'app iOS
    3. `/pair pending` elenca le richieste in sospeso (inclusi ruolo/ambiti)
    4. approva la richiesta:
       - `/pair approve <requestId>` per approvazione esplicita
       - `/pair approve` quando c'è una sola richiesta in sospeso
       - `/pair approve latest` per la più recente

    Il codice di configurazione porta un token bootstrap di breve durata. Il bootstrap con codice di configurazione integrato è solo node: la prima connessione crea una richiesta node in sospeso e, dopo l'approvazione, il Gateway restituisce un token node duraturo con `scopes: []`. Non restituisce un token operatore passato; l'accesso operatore richiede una distinta associazione operatore approvata o un flusso token.

    Se un dispositivo riprova con dettagli di autenticazione modificati (ad esempio ruolo/ambiti/chiave pubblica), la richiesta in sospeso precedente viene sostituita e la nuova richiesta usa un `requestId` diverso. Esegui di nuovo `/pair pending` prima di approvare.

    Maggiori dettagli: [Abbinamento](/it/channels/pairing#pair-via-telegram-recommended-for-ios).

  </Accordion>

  <Accordion title="Pulsanti inline">
    Configura l'ambito della tastiera inline:

```json5
{
  channels: {
    telegram: {
      capabilities: {
        inlineButtons: "allowlist",
      },
    },
  },
}
```

    Override per account:

```json5
{
  channels: {
    telegram: {
      accounts: {
        main: {
          capabilities: {
            inlineButtons: "allowlist",
          },
        },
      },
    },
  },
}
```

    Ambiti:

    - `off`
    - `dm`
    - `group`
    - `all`
    - `allowlist` (predefinito)

    Il valore legacy `capabilities: ["inlineButtons"]` viene mappato a `inlineButtons: "all"`.

    Esempio di azione messaggio:

```json5
{
  action: "send",
  channel: "telegram",
  to: "123456789",
  message: "Choose an option:",
  buttons: [
    [
      { text: "Yes", callback_data: "yes" },
      { text: "No", callback_data: "no" },
    ],
    [{ text: "Cancel", callback_data: "cancel" }],
  ],
}
```

    Esempio di pulsante Mini App:

```json5
{
  action: "send",
  channel: "telegram",
  to: "123456789",
  message: "Open app:",
  presentation: {
    blocks: [
      {
        type: "buttons",
        buttons: [{ label: "Launch", web_app: { url: "https://example.com/app" } }],
      },
    ],
  },
}
```

    I pulsanti `web_app` di Telegram funzionano solo nelle chat private tra un utente e il
    bot.

    I clic di callback non rivendicati da un gestore interattivo di Plugin registrato
    vengono passati all'agente come testo:
    `callback_data: <value>`

  </Accordion>

  <Accordion title="Azioni messaggio Telegram per agenti e automazione">
    Le azioni strumento Telegram includono:

    - `sendMessage` (`to`, `content`, `mediaUrl` opzionale, `replyToMessageId`, `messageThreadId`)
    - `react` (`chatId`, `messageId`, `emoji`)
    - `deleteMessage` (`chatId`, `messageId`)
    - `editMessage` (`chatId`, `messageId`, `content` o `caption`, pulsanti inline `presentation` opzionali; le modifiche solo ai pulsanti aggiornano il markup di risposta)
    - `createForumTopic` (`chatId`, `name`, `iconColor` opzionale, `iconCustomEmojiId`)

    Le azioni messaggio del canale espongono alias ergonomici (`send`, `react`, `delete`, `edit`, `sticker`, `sticker-search`, `topic-create`).

    Controlli di gating:

    - `channels.telegram.actions.sendMessage`
    - `channels.telegram.actions.deleteMessage`
    - `channels.telegram.actions.reactions`
    - `channels.telegram.actions.sticker` (predefinito: disabilitato)

    Nota: `edit` e `topic-create` sono attualmente abilitati per impostazione predefinita e non hanno opzioni `channels.telegram.actions.*` separate.
    Gli invii runtime usano lo snapshot attivo di configurazione/segreti (avvio/ricaricamento), quindi i percorsi di azione non eseguono una nuova risoluzione SecretRef ad hoc per ogni invio.

    Semantica di rimozione delle reazioni: [/tools/reactions](/it/tools/reactions)

  </Accordion>

  <Accordion title="Tag di thread delle risposte">
    Telegram supporta tag espliciti per i thread delle risposte nell'output generato:

    - `[[reply_to_current]]` risponde al messaggio che ha attivato l'azione
    - `[[reply_to:<id>]]` risponde a un ID messaggio Telegram specifico

    `channels.telegram.replyToMode` controlla la gestione:

    - `off` (predefinito)
    - `first`
    - `all`

    Quando i thread delle risposte sono abilitati e il testo o la didascalia Telegram originale è disponibile, OpenClaw include automaticamente un estratto di citazione nativo di Telegram. Telegram limita il testo delle citazioni native a 1024 unità di codice UTF-16, quindi i messaggi più lunghi vengono citati dall'inizio e ripiegano su una risposta semplice se Telegram rifiuta la citazione.

    Nota: `off` disabilita i thread impliciti delle risposte. I tag espliciti `[[reply_to_*]]` vengono comunque rispettati.

  </Accordion>

  <Accordion title="Argomenti del forum e comportamento dei thread">
    Supergruppi forum:

    - le chiavi di sessione degli argomenti aggiungono `:topic:<threadId>`
    - le risposte e la digitazione sono indirizzate al thread dell'argomento
    - percorso di configurazione degli argomenti:
      `channels.telegram.groups.<chatId>.topics.<threadId>`

    Caso speciale dell'argomento generale (`threadId=1`):

    - gli invii di messaggi omettono `message_thread_id` (Telegram rifiuta `sendMessage(...thread_id=1)`)
    - le azioni di digitazione includono comunque `message_thread_id`

    Ereditarietà degli argomenti: le voci degli argomenti ereditano le impostazioni del gruppo salvo override (`requireMention`, `allowFrom`, `skills`, `systemPrompt`, `enabled`, `groupPolicy`).
    `agentId` è solo dell'argomento e non eredita dai valori predefiniti del gruppo.
    `topics."*"` imposta i valori predefiniti per ogni argomento in quel gruppo; gli ID argomento esatti prevalgono comunque su `"*"`.

    **Instradamento agente per argomento**: ogni argomento può essere instradato a un agente diverso impostando `agentId` nella configurazione dell'argomento. Questo assegna a ogni argomento il proprio workspace, la propria memoria e la propria sessione isolati. Esempio:

    ```json5
    {
      channels: {
        telegram: {
          groups: {
            "-1001234567890": {
              topics: {
                "1": { agentId: "main" },      // Argomento generale → agente main
                "3": { agentId: "zu" },        // Argomento dev → agente zu
                "5": { agentId: "coder" }      // Revisione del codice → agente coder
              }
            }
          }
        }
      }
    }
    ```

    Ogni argomento ha quindi la propria chiave di sessione: `agent:zu:telegram:group:-1001234567890:topic:3`

    **Associazione persistente dell'argomento ACP**: gli argomenti del forum possono fissare le sessioni dell'harness ACP tramite associazioni ACP tipizzate di primo livello (`bindings[]` con `type: "acp"` e `match.channel: "telegram"`, `peer.kind: "group"` e un ID qualificato per argomento come `-1001234567890:topic:42`). Attualmente limitato agli argomenti del forum in gruppi/supergruppi. Vedi [Agenti ACP](/it/tools/acp-agents).

    **Spawn ACP vincolato al thread dalla chat**: `/acp spawn <agent> --thread here|auto` associa l'argomento corrente a una nuova sessione ACP; i follow-up vengono instradati direttamente lì. OpenClaw fissa la conferma dello spawn nell'argomento. Richiede che `channels.telegram.threadBindings.spawnSessions` resti abilitato (predefinito: `true`).

    Il contesto del template espone `MessageThreadId` e `IsForum`. Le chat DM con `message_thread_id` mantengono i metadati di risposta; usano chiavi di sessione consapevoli del thread solo quando Telegram `getMe` segnala `has_topics_enabled: true` per il bot.
    Gli override precedenti `dm.threadReplies` e `direct.*.threadReplies` sono stati ritirati intenzionalmente; usa la modalità con thread di BotFather come unica fonte di verità ed esegui `openclaw doctor --fix` per rimuovere le chiavi di configurazione obsolete.

  </Accordion>

  <Accordion title="Audio, video e sticker">
    ### Messaggi audio

    Telegram distingue note vocali e file audio.

    - predefinito: comportamento da file audio
    - tag `[[audio_as_voice]]` nella risposta dell'agente per forzare l'invio come nota vocale
    - le trascrizioni delle note vocali in ingresso sono incorniciate come testo generato dalla macchina,
      non attendibile nel contesto dell'agente; il rilevamento delle menzioni usa comunque la trascrizione grezza
      quindi i messaggi vocali soggetti a gating per menzione continuano a funzionare.

    Esempio di azione messaggio:

```json5
{
  action: "send",
  channel: "telegram",
  to: "123456789",
  media: "https://example.com/voice.ogg",
  asVoice: true,
}
```

    ### Messaggi video

    Telegram distingue i file video dalle note video.

    Esempio di azione del messaggio:

```json5
{
  action: "send",
  channel: "telegram",
  to: "123456789",
  media: "https://example.com/video.mp4",
  asVideoNote: true,
}
```

    Le note video non supportano le didascalie; il testo del messaggio fornito viene inviato separatamente.

    ### Adesivi

    Gestione degli adesivi in ingresso:

    - WEBP statico: scaricato ed elaborato (segnaposto `<media:sticker>`)
    - TGS animato: ignorato
    - WEBM video: ignorato

    Campi di contesto degli adesivi:

    - `Sticker.emoji`
    - `Sticker.setName`
    - `Sticker.fileId`
    - `Sticker.fileUniqueId`
    - `Sticker.cachedDescription`

    Le descrizioni degli adesivi vengono memorizzate nella cache nello stato SQLite del Plugin di OpenClaw per ridurre le chiamate ripetute alla visione.

    Abilita le azioni per gli adesivi:

```json5
{
  channels: {
    telegram: {
      actions: {
        sticker: true,
      },
    },
  },
}
```

    Azione di invio adesivo:

```json5
{
  action: "sticker",
  channel: "telegram",
  to: "123456789",
  fileId: "CAACAgIAAxkBAAI...",
}
```

    Cerca adesivi nella cache:

```json5
{
  action: "sticker-search",
  channel: "telegram",
  query: "cat waving",
  limit: 5,
}
```

  </Accordion>

  <Accordion title="Notifiche di reazione">
    Le reazioni di Telegram arrivano come aggiornamenti `message_reaction` (separati dai payload dei messaggi).

    Quando abilitate, OpenClaw mette in coda eventi di sistema come:

    - `Telegram reaction added: 👍 by Alice (@alice) on msg 42`

    Configurazione:

    - `channels.telegram.reactionNotifications`: `off | own | all` (predefinito: `own`)
    - `channels.telegram.reactionLevel`: `off | ack | minimal | extensive` (predefinito: `minimal`)

    Note:

    - `own` indica solo le reazioni degli utenti ai messaggi inviati dal bot (al meglio tramite la cache dei messaggi inviati).
    - Gli eventi di reazione rispettano comunque i controlli di accesso di Telegram (`dmPolicy`, `allowFrom`, `groupPolicy`, `groupAllowFrom`); i mittenti non autorizzati vengono scartati.
    - Telegram non fornisce ID di thread negli aggiornamenti delle reazioni.
      - i gruppi non forum vengono instradati alla sessione della chat di gruppo
      - i gruppi forum vengono instradati alla sessione dell'argomento generale del gruppo (`:topic:1`), non all'argomento esatto di origine

    `allowed_updates` per polling/Webhook include automaticamente `message_reaction`.

  </Accordion>

  <Accordion title="Reazioni di conferma">
    `ackReaction` invia un'emoji di conferma mentre OpenClaw sta elaborando un messaggio in ingresso. `ackReactionScope` decide *quando* quell'emoji viene effettivamente inviata.

    **Ordine di risoluzione dell'emoji (`ackReaction`):**

    - `channels.telegram.accounts.<accountId>.ackReaction`
    - `channels.telegram.ackReaction`
    - `messages.ackReaction`
    - fallback all'emoji dell'identità dell'agente (`agents.list[].identity.emoji`, altrimenti "👀")

    Note:

    - Telegram si aspetta emoji unicode (ad esempio "👀").
    - Usa `""` per disabilitare la reazione per un canale o un account.

    **Ambito (`messages.ackReactionScope`):**

    Il provider Telegram legge l'ambito da `messages.ackReactionScope` (predefinito `"group-mentions"`). Oggi non esiste una sostituzione a livello di account Telegram o di canale Telegram.

    Valori: `"all"` (DM + gruppi), `"direct"` (solo DM), `"group-all"` (ogni messaggio di gruppo, nessun DM), `"group-mentions"` (gruppi quando il bot viene menzionato; **nessun DM** — questo è il valore predefinito), `"off"` / `"none"` (disabilitato).

    <Note>
    L'ambito predefinito (`"group-mentions"`) non attiva reazioni di conferma nei messaggi diretti. Per ottenere una reazione di conferma sui DM Telegram in ingresso, imposta `messages.ackReactionScope` su `"direct"` o `"all"`. Il valore viene letto all'avvio del provider Telegram, quindi è necessario riavviare il Gateway affinché la modifica abbia effetto.
    </Note>

  </Accordion>

  <Accordion title="Scritture di configurazione da eventi e comandi Telegram">
    Le scritture della configurazione del canale sono abilitate per impostazione predefinita (`configWrites !== false`).

    Le scritture attivate da Telegram includono:

    - eventi di migrazione dei gruppi (`migrate_to_chat_id`) per aggiornare `channels.telegram.groups`
    - `/config set` e `/config unset` (richiede l'abilitazione dei comandi)

    Disabilita:

```json5
{
  channels: {
    telegram: {
      configWrites: false,
    },
  },
}
```

  </Accordion>

  <Accordion title="Polling lungo rispetto a Webhook">
    Il valore predefinito è il polling lungo. Per la modalità Webhook imposta `channels.telegram.webhookUrl` e `channels.telegram.webhookSecret`; opzionali `webhookPath`, `webhookHost`, `webhookPort` (valori predefiniti `/telegram-webhook`, `127.0.0.1`, `8787`).

    In modalità polling lungo, OpenClaw conserva il proprio indicatore di riavvio solo dopo che un aggiornamento viene distribuito correttamente. Se un gestore fallisce, quell'aggiornamento resta ritentabile nello stesso processo e non viene scritto come completato per la deduplicazione al riavvio.

    Il listener locale si associa a `127.0.0.1:8787`. Per l'ingresso pubblico, metti un proxy inverso davanti alla porta locale oppure imposta intenzionalmente `webhookHost: "0.0.0.0"`.

    La modalità Webhook convalida le protezioni della richiesta, il token segreto di Telegram e il corpo JSON prima di restituire `200` a Telegram.
    OpenClaw elabora quindi l'aggiornamento in modo asincrono tramite le stesse corsie bot per chat/per argomento usate dal polling lungo, quindi i turni lenti dell'agente non trattengono l'ACK di consegna di Telegram.

  </Accordion>

  <Accordion title="Limiti, tentativi e destinazioni CLI">
    - Il valore predefinito di `channels.telegram.textChunkLimit` è 4000.
    - `channels.telegram.chunkMode="newline"` preferisce i confini di paragrafo (righe vuote) prima della divisione per lunghezza.
    - `channels.telegram.mediaMaxMb` (predefinito 100) limita la dimensione dei media Telegram in ingresso e in uscita.
    - `channels.telegram.mediaGroupFlushMs` (predefinito 500) controlla per quanto tempo gli album/gruppi media Telegram vengono memorizzati nel buffer prima che OpenClaw li invii come un unico messaggio in ingresso. Aumentalo se le parti dell'album arrivano in ritardo; diminuiscilo per ridurre la latenza delle risposte agli album.
    - `channels.telegram.timeoutSeconds` sovrascrive il timeout del client API Telegram (se non impostato, si applica il valore predefinito di grammY). I client bot limitano i valori configurati al di sotto della protezione di 60 secondi per le richieste di testo/typing in uscita, così grammY non interrompe la consegna della risposta visibile prima che la protezione del trasporto e il fallback di OpenClaw possano intervenire. Il long polling usa comunque una protezione di 45 secondi per la richiesta `getUpdates`, così i poll inattivi non vengono abbandonati indefinitamente.
    - `channels.telegram.pollingStallThresholdMs` ha valore predefinito `120000`; regolalo tra `30000` e `600000` solo per riavvii da stallo di polling falsi positivi.
    - la cronologia del contesto di gruppo usa `channels.telegram.historyLimit` o `messages.groupChat.historyLimit` (predefinito 50); `0` la disabilita.
    - il contesto supplementare di risposta/citazione/inoltro viene normalizzato in una singola finestra di contesto conversazione selezionata quando il gateway ha osservato i messaggi padre; la cache dei messaggi osservati risiede nello stato Plugin SQLite di OpenClaw, e `openclaw doctor --fix` importa i sidecar legacy. Telegram include negli aggiornamenti solo un singolo `reply_to_message` superficiale, quindi le catene più vecchie della cache sono limitate al payload di aggiornamento corrente di Telegram.
    - le allowlist di Telegram controllano principalmente chi può attivare l'agente, non un confine completo di oscuramento del contesto supplementare.
    - Controlli della cronologia DM:
      - `channels.telegram.dmHistoryLimit`
      - `channels.telegram.dms["<user_id>"].historyLimit`
    - la configurazione `channels.telegram.retry` si applica agli helper di invio Telegram (CLI/strumenti/azioni) per errori API in uscita recuperabili. Anche la consegna della risposta finale in ingresso usa un tentativo di safe-send limitato per errori Telegram precedenti alla connessione, ma non ritenta envelope di rete ambigui successivi all'invio che potrebbero duplicare messaggi visibili.

    Le destinazioni di invio CLI e degli strumenti di messaggistica possono essere ID chat numerici, username o una destinazione topic forum:

```bash
openclaw message send --channel telegram --target 123456789 --message "hi"
openclaw message send --channel telegram --target @name --message "hi"
openclaw message send --channel telegram --target -1001234567890:topic:42 --message "hi topic"
```

    I poll Telegram usano `openclaw message poll` e supportano i topic forum:

```bash
openclaw message poll --channel telegram --target 123456789 \
  --poll-question "Ship it?" --poll-option "Yes" --poll-option "No"
openclaw message poll --channel telegram --target -1001234567890:topic:42 \
  --poll-question "Pick a time" --poll-option "10am" --poll-option "2pm" \
  --poll-duration-seconds 300 --poll-public
```

    Flag poll solo per Telegram:

    - `--poll-duration-seconds` (5-600)
    - `--poll-anonymous`
    - `--poll-public`
    - `--thread-id` per topic forum (oppure usa una destinazione `:topic:`)

    L'invio Telegram supporta anche:

    - `--presentation` con blocchi `buttons` per tastiere inline quando `channels.telegram.capabilities.inlineButtons` lo consente
    - `--pin` o `--delivery '{"pin":true}'` per richiedere la consegna fissata quando il bot può fissare messaggi in quella chat
    - `--force-document` per inviare immagini, GIF e video in uscita come documenti invece che come caricamenti di foto compresse, media animati o video

    Controllo azioni:

    - `channels.telegram.actions.sendMessage=false` disabilita i messaggi Telegram in uscita, inclusi i poll
    - `channels.telegram.actions.poll=false` disabilita la creazione di poll Telegram lasciando abilitati gli invii regolari

  </Accordion>

  <Accordion title="Approvazioni exec in Telegram">
    Telegram supporta le approvazioni exec nei DM degli approvatori e può facoltativamente pubblicare prompt nella chat o nel topic di origine. Gli approvatori devono essere ID utente Telegram numerici.

    Percorso di configurazione:

    - `channels.telegram.execApprovals.enabled` (si abilita automaticamente quando almeno un approvatore è risolvibile)
    - `channels.telegram.execApprovals.approvers` (ripiega sugli ID proprietario numerici da `commands.ownerAllowFrom`)
    - `channels.telegram.execApprovals.target`: `dm` (predefinito) | `channel` | `both`
    - `agentFilter`, `sessionFilter`

    `channels.telegram.allowFrom`, `groupAllowFrom` e `defaultTo` controllano chi può parlare con il bot e dove invia le risposte normali. Non rendono qualcuno un approvatore exec. Il primo abbinamento DM approvato inizializza `commands.ownerAllowFrom` quando non esiste ancora alcun proprietario dei comandi, così la configurazione con un solo proprietario funziona comunque senza duplicare ID sotto `execApprovals.approvers`.

    La consegna nel canale mostra il testo del comando nella chat; abilita `channel` o `both` solo in gruppi/topic fidati. Quando il prompt arriva in un topic forum, OpenClaw preserva il topic per il prompt di approvazione e il follow-up. Le approvazioni exec scadono dopo 30 minuti per impostazione predefinita.

    I pulsanti di approvazione inline richiedono anche che `channels.telegram.capabilities.inlineButtons` consenta la superficie di destinazione (`dm`, `group` o `all`). Gli ID approvazione con prefisso `plugin:` si risolvono tramite le approvazioni Plugin; gli altri si risolvono prima tramite le approvazioni exec.

    Vedi [Approvazioni exec](/it/tools/exec-approvals).

  </Accordion>
</AccordionGroup>

## Controlli delle risposte di errore

Quando l'agente incontra un errore di consegna o del provider, la policy degli errori controlla se i messaggi di errore vengono inviati alla chat Telegram:

| Chiave                              | Valori                     | Predefinito     | Descrizione                                                                                                                                                                                                 |
| ----------------------------------- | -------------------------- | --------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `channels.telegram.errorPolicy`     | `always`, `once`, `silent` | `always`        | `always` — invia ogni messaggio di errore alla chat. `once` — invia ogni messaggio di errore univoco una volta per finestra di cooldown (sopprime errori identici ripetuti). `silent` — non invia mai messaggi di errore alla chat. |
| `channels.telegram.errorCooldownMs` | numero (ms)                | `14400000` (4h) | Finestra di cooldown per la policy `once`. Dopo l'invio di un errore, lo stesso messaggio di errore viene soppresso finché questo intervallo non scade. Previene spam di errori durante interruzioni del servizio. |

Sono supportate sovrascritture per account, gruppo e topic (stessa ereditarietà delle altre chiavi di configurazione Telegram).

```json5
{
  channels: {
    telegram: {
      errorPolicy: "always",
      errorCooldownMs: 120000,
      groups: {
        "-1001234567890": {
          errorPolicy: "silent", // suppress errors in this group
        },
      },
    },
  },
}
```

## Risoluzione dei problemi

<AccordionGroup>
  <Accordion title="Il bot non risponde ai messaggi di gruppo senza menzione">

    - Se `requireMention=false`, la modalità privacy di Telegram deve consentire visibilità completa.
      - BotFather: `/setprivacy` -> Disable
      - poi rimuovi e aggiungi di nuovo il bot al gruppo
    - `openclaw channels status` avvisa quando la configurazione si aspetta messaggi di gruppo senza menzione.
    - `openclaw channels status --probe` può controllare ID gruppo numerici espliciti; il wildcard `"*"` non può essere verificato per appartenenza.
    - test rapido della sessione: `/activation always`.

  </Accordion>

  <Accordion title="Il bot non vede affatto i messaggi di gruppo">

    - quando `channels.telegram.groups` esiste, il gruppo deve essere elencato (o includere `"*"`)
    - verifica l'appartenenza del bot al gruppo
    - esamina i log: `openclaw logs --follow` per i motivi di skip

  </Accordion>

  <Accordion title="I comandi funzionano parzialmente o non funzionano affatto">

    - autorizza la tua identità mittente (abbinamento e/o `allowFrom` numerico)
    - l'autorizzazione dei comandi si applica comunque anche quando la policy del gruppo è `open`
    - `setMyCommands failed` con `BOT_COMMANDS_TOO_MUCH` significa che il menu nativo ha troppe voci; riduci comandi Plugin/skill/personalizzati o disabilita i menu nativi
    - le chiamate di avvio `deleteMyCommands` / `setMyCommands` e le chiamate di typing `sendChatAction` sono limitate e ritentate una volta tramite il fallback del trasporto di Telegram in caso di timeout della richiesta. Errori persistenti di rete/fetch di solito indicano problemi di raggiungibilità DNS/HTTPS verso `api.telegram.org`

  </Accordion>

  <Accordion title="L'avvio segnala token non autorizzato">

    - `getMe returned 401` è un errore di autenticazione Telegram per il token bot configurato.
    - Copia di nuovo o rigenera il token bot in BotFather, poi aggiorna `channels.telegram.botToken`, `channels.telegram.tokenFile`, `channels.telegram.accounts.<id>.botToken` o `TELEGRAM_BOT_TOKEN` per l'account predefinito.
    - Anche `deleteWebhook 401 Unauthorized` durante l'avvio è un errore di autenticazione; trattarlo come "nessun webhook esiste" rinvierebbe soltanto lo stesso errore da token non valido alle chiamate API successive.

  </Accordion>

  <Accordion title="Instabilità di polling o rete">

    - Node 22+ + fetch/proxy personalizzato può attivare un comportamento di abort immediato se i tipi AbortSignal non corrispondono.
    - Alcuni host risolvono prima `api.telegram.org` in IPv6; un egress IPv6 non funzionante può causare errori intermittenti dell'API Telegram.
    - Se i log includono `TypeError: fetch failed` o `Network request for 'getUpdates' failed!`, OpenClaw ora li ritenta come errori di rete recuperabili.
    - Durante l'avvio del polling, OpenClaw riusa per grammY il probe `getMe` riuscito dell'avvio, così il runner non ha bisogno di un secondo `getMe` prima del primo `getUpdates`.
    - Se `deleteWebhook` fallisce con un errore di rete transitorio durante l'avvio del polling, OpenClaw prosegue nel long polling invece di effettuare un'altra chiamata pre-poll al control plane. Un webhook ancora attivo emerge come conflitto di `getUpdates`; OpenClaw ricostruisce quindi il trasporto Telegram e ritenta la pulizia del webhook.
    - Se i socket Telegram vengono riciclati con una cadenza fissa breve, controlla se `channels.telegram.timeoutSeconds` è basso; i client bot limitano i valori configurati al di sotto delle protezioni per le richieste in uscita e `getUpdates`, ma le versioni precedenti potevano interrompere ogni poll o risposta quando questo era impostato al di sotto di tali protezioni.
    - Se i log includono `Polling stall detected`, OpenClaw riavvia il polling e ricostruisce il trasporto Telegram dopo 120 secondi senza liveness di long-poll completata per impostazione predefinita.
    - `openclaw channels status --probe` e `openclaw doctor` avvisano quando un account in polling in esecuzione non ha completato `getUpdates` dopo il periodo di grazia dell'avvio, quando un account webhook in esecuzione non ha completato `setWebhook` dopo il periodo di grazia dell'avvio, o quando l'ultima attività riuscita del trasporto di polling è obsoleta.
    - Aumenta `channels.telegram.pollingStallThresholdMs` solo quando le chiamate `getUpdates` di lunga durata sono sane ma il tuo host segnala comunque falsi riavvii da stallo di polling. Stalli persistenti di solito indicano problemi di proxy, DNS, IPv6 o egress TLS tra l'host e `api.telegram.org`.
    - Telegram rispetta anche le variabili env proxy del processo per il trasporto Bot API, incluse `HTTP_PROXY`, `HTTPS_PROXY`, `ALL_PROXY` e le loro varianti minuscole. `NO_PROXY` / `no_proxy` può comunque bypassare `api.telegram.org`.
    - Se il proxy gestito da OpenClaw è configurato tramite `OPENCLAW_PROXY_URL` per un ambiente di servizio e non è presente alcuna variabile env proxy standard, Telegram usa quell'URL anche per il trasporto Bot API.
    - Su host VPS con egress/TLS diretto instabile, instrada le chiamate API Telegram tramite `channels.telegram.proxy`:

```yaml
channels:
  telegram:
    proxy: socks5://<user>:<password>@proxy-host:1080
```

    - Node 22+ imposta per impostazione predefinita `autoSelectFamily=true` (tranne WSL2). L'ordine dei risultati DNS di Telegram rispetta `OPENCLAW_TELEGRAM_DNS_RESULT_ORDER`, poi `channels.telegram.network.dnsResultOrder`, poi il valore predefinito del processo, come `NODE_OPTIONS=--dns-result-order=ipv4first`; se nessuno si applica, Node 22+ ripiega su `ipv4first`.
    - Se il tuo host è WSL2 o funziona esplicitamente meglio con un comportamento solo IPv4, forza la selezione della famiglia:

```yaml
channels:
  telegram:
    network:
      autoSelectFamily: false
```

    - Le risposte dell'intervallo benchmark RFC 2544 (`198.18.0.0/15`) sono già consentite
      per impostazione predefinita per i download di media Telegram. Se una fake-IP o un
      proxy trasparente attendibile riscrive `api.telegram.org` verso qualche altro
      indirizzo privato/interno/a uso speciale durante i download di media, puoi attivare
      il bypass solo per Telegram:

```yaml
channels:
  telegram:
    network:
      dangerouslyAllowPrivateNetwork: true
```

    - La stessa opzione è disponibile per account in
      `channels.telegram.accounts.<accountId>.network.dangerouslyAllowPrivateNetwork`.
    - Se il tuo proxy risolve gli host dei media Telegram in `198.18.x.x`, lascia prima
      disattivato il flag pericoloso. I media Telegram consentono già per impostazione
      predefinita l'intervallo benchmark RFC 2544.

    <Warning>
      `channels.telegram.network.dangerouslyAllowPrivateNetwork` indebolisce le protezioni SSRF
      dei media Telegram. Usalo solo per ambienti proxy attendibili controllati dall'operatore,
      come il routing fake-IP di Clash, Mihomo o Surge, quando sintetizzano risposte private
      o a uso speciale al di fuori dell'intervallo benchmark RFC 2544. Lascialo disattivato
      per il normale accesso Telegram da internet pubblico.
    </Warning>

    - Override di ambiente (temporanei):
      - `OPENCLAW_TELEGRAM_DISABLE_AUTO_SELECT_FAMILY=1`
      - `OPENCLAW_TELEGRAM_ENABLE_AUTO_SELECT_FAMILY=1`
      - `OPENCLAW_TELEGRAM_DNS_RESULT_ORDER=ipv4first`
    - Convalida le risposte DNS:

```bash
dig +short api.telegram.org A
dig +short api.telegram.org AAAA
```

  </Accordion>
</AccordionGroup>

Altro aiuto: [Risoluzione dei problemi dei canali](/it/channels/troubleshooting).

## Riferimento di configurazione

Riferimento principale: [Riferimento di configurazione - Telegram](/it/gateway/config-channels#telegram).

<Accordion title="High-signal Telegram fields">

- avvio/autenticazione: `enabled`, `botToken`, `tokenFile`, `accounts.*` (`tokenFile` deve puntare a un file regolare; i symlink vengono rifiutati)
- controllo degli accessi: `dmPolicy`, `allowFrom`, `groupPolicy`, `groupAllowFrom`, `groups`, `groups.*.topics.*`, `bindings[]` di primo livello (`type: "acp"`)
- impostazioni predefinite degli argomenti: `groups.<chatId>.topics."*"` si applica agli argomenti forum non corrispondenti; gli ID argomento esatti lo sovrascrivono
- approvazioni exec: `execApprovals`, `accounts.*.execApprovals`
- comando/menu: `commands.native`, `commands.nativeSkills`, `customCommands`
- thread/risposte: `replyToMode`
- streaming: `streaming` (anteprima), `streaming.preview.toolProgress`, `blockStreaming`
- formattazione/consegna: `textChunkLimit`, `chunkMode`, `richMessages`, `linkPreview`, `responsePrefix`
- media/rete: `mediaMaxMb`, `mediaGroupFlushMs`, `timeoutSeconds`, `pollingStallThresholdMs`, `retry`, `network.autoSelectFamily`, `network.dangerouslyAllowPrivateNetwork`, `proxy`
- root API personalizzata: `apiRoot` (solo root Bot API; non includere `/bot<TOKEN>`)
- Webhook: `webhookUrl`, `webhookSecret`, `webhookPath`, `webhookHost`
- azioni/funzionalità: `capabilities.inlineButtons`, `actions.sendMessage|editMessage|deleteMessage|reactions|sticker`
- reazioni: `reactionNotifications`, `reactionLevel`
- errori: `errorPolicy`, `errorCooldownMs`
- scritture/cronologia: `configWrites`, `historyLimit`, `dmHistoryLimit`, `dms.*.historyLimit`

</Accordion>

<Note>
Precedenza multi-account: quando sono configurati due o più ID account, imposta `channels.telegram.defaultAccount` (o includi `channels.telegram.accounts.default`) per rendere esplicito l'instradamento predefinito. Altrimenti OpenClaw ripiega sul primo ID account normalizzato e `openclaw doctor` avvisa. Gli account denominati ereditano `channels.telegram.allowFrom` / `groupAllowFrom`, ma non i valori `accounts.default.*`.
</Note>

## Correlati

<CardGroup cols={2}>
  <Card title="Pairing" icon="link" href="/it/channels/pairing">
    Associa un utente Telegram al Gateway.
  </Card>
  <Card title="Groups" icon="users" href="/it/channels/groups">
    Comportamento allowlist di gruppi e argomenti.
  </Card>
  <Card title="Channel routing" icon="route" href="/it/channels/channel-routing">
    Instrada i messaggi in ingresso agli agenti.
  </Card>
  <Card title="Security" icon="shield" href="/it/gateway/security">
    Modello delle minacce e hardening.
  </Card>
  <Card title="Multi-agent routing" icon="sitemap" href="/it/concepts/multi-agent">
    Mappa gruppi e argomenti agli agenti.
  </Card>
  <Card title="Troubleshooting" icon="wrench" href="/it/channels/troubleshooting">
    Diagnostica cross-channel.
  </Card>
</CardGroup>
