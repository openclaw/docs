---
read_when:
    - Sviluppo di funzionalità o Webhook per Telegram
summary: Stato del supporto, funzionalità e configurazione del bot Telegram
title: Telegram
x-i18n:
    generated_at: "2026-07-16T14:05:12Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 51c155afeb147b92a55f181be269ce13c4fd6b609a94d680cd7e091cd4a7c236
    source_path: channels/telegram.md
    workflow: 16
---

Pronto per la produzione per messaggi diretti ai bot e gruppi tramite grammY. Il long polling è il trasporto predefinito; la modalità Webhook è facoltativa.

<CardGroup cols={3}>
  <Card title="Associazione" icon="link" href="/it/channels/pairing">
    Il criterio predefinito per i messaggi diretti di Telegram è l'associazione.
  </Card>
  <Card title="Risoluzione dei problemi dei canali" icon="wrench" href="/it/channels/troubleshooting">
    Diagnostica multicanale e procedure di riparazione.
  </Card>
  <Card title="Configurazione del Gateway" icon="settings" href="/it/gateway/configuration">
    Schemi ed esempi completi di configurazione dei canali.
  </Card>
</CardGroup>

## Configurazione rapida

<Steps>
  <Step title="Creare il token del bot in BotFather">
    Entrambe le procedure generano un token da incollare in OpenClaw; scegliere una delle due:

    - **Procedura tramite chat**: aprire Telegram, avviare una chat con **@BotFather** (verificare che l'handle sia esattamente `@BotFather`), eseguire `/newbot`, seguire le istruzioni e salvare il token.
    - **Procedura tramite web**: aprire l'[app web di BotFather](https://t.me/BotFather?startapp), che funziona in ogni client Telegram, incluso [web.telegram.org](https://web.telegram.org), creare il bot nell'interfaccia e copiarne il token.

  </Step>

  <Step title="Configurare il token e il criterio per i messaggi diretti">

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

    Variabile d'ambiente di riserva: `TELEGRAM_BOT_TOKEN` (solo per l'account predefinito; gli account denominati devono usare `botToken` o `tokenFile`).
    Telegram **non** usa `openclaw channels login telegram`; impostare il token nella configurazione o nell'ambiente, quindi avviare il Gateway.

  </Step>

  <Step title="Avviare il Gateway e approvare il primo messaggio diretto">

```bash
openclaw gateway
openclaw pairing list telegram
openclaw pairing approve telegram <CODE>
```

    I codici di associazione scadono dopo 1 ora.

  </Step>

  <Step title="Aggiungere il bot a un gruppo">
    Aggiungere il bot al gruppo, quindi ottenere i due ID necessari per l'accesso al gruppo:

    - il proprio ID utente Telegram, per `allowFrom` / `groupAllowFrom`
    - l'ID della chat di gruppo Telegram, come chiave in `channels.telegram.groups`

    Ottenere l'ID della chat di gruppo da `openclaw logs --follow`, da un bot che identifica i messaggi inoltrati o da `getUpdates` della Bot API. Dopo aver autorizzato il gruppo, `/whoami@<bot_username>` conferma gli ID dell'utente e del gruppo.

    Gli ID negativi dei supergruppi che iniziano con `-100` sono ID di chat di gruppo. Vanno inseriti in `channels.telegram.groups`, non in `groupAllowFrom`.

  </Step>
</Steps>

<Note>
La risoluzione del token tiene conto dell'account: `tokenFile` ha la precedenza su `botToken`, che a sua volta ha la precedenza sull'ambiente; la configurazione prevale sempre su `TELEGRAM_BOT_TOKEN` (che viene risolto solo per l'account predefinito). Dopo un avvio riuscito, OpenClaw memorizza nella cache l'identità del bot per un massimo di 24 ore, così i riavvii evitano una chiamata aggiuntiva a `getMe`; la modifica o la rimozione del token cancella tale cache.
</Note>

## Impostazioni lato Telegram

<AccordionGroup>
  <Accordion title="Modalità privacy e visibilità nei gruppi">
    Per impostazione predefinita, i bot Telegram usano la **Privacy Mode**, che limita i messaggi di gruppo ricevuti.

    Per visualizzare tutti i messaggi di gruppo:

    - disabilitare la modalità privacy tramite `/setprivacy`, oppure
    - rendere il bot amministratore del gruppo.

    Dopo aver modificato la modalità privacy, rimuovere e aggiungere nuovamente il bot in ogni gruppo affinché Telegram applichi la modifica.

  </Accordion>

  <Accordion title="Autorizzazioni del gruppo">
    Lo stato di amministratore viene gestito nelle impostazioni del gruppo Telegram. I bot amministratori ricevono tutti i messaggi di gruppo, funzione utile per un comportamento sempre attivo nei gruppi.
  </Accordion>

  <Accordion title="Opzioni utili di BotFather">

    - `/setjoingroups` — consentire o impedire l'aggiunta ai gruppi
    - `/setprivacy` — comportamento della visibilità nei gruppi

    Le stesse impostazioni sono disponibili nell'[app web di BotFather](https://t.me/BotFather?startapp) se si preferisce un'interfaccia ai comandi di chat.

  </Accordion>
</AccordionGroup>

## Mini App della dashboard

Eseguire `/dashboard` in un messaggio diretto con il bot per aprire la dashboard di OpenClaw all'interno di Telegram.

Requisiti:

- `gateway.tailscale.mode: "serve"` o `"funnel"` per l'URL HTTPS pubblicato della Mini App.
- L'ID utente numerico di Telegram deve essere incluso nell'elenco `allowFrom` effettivo dell'account selezionato oppure in `commands.ownerAllowFrom`.
- Usare un messaggio diretto. Nei gruppi, `/dashboard` risponde con `open this in a DM with the bot` e non invia alcun pulsante.
- Installazioni Docker: le modalità Serve/Funnel richiedono che il Gateway si associ all'interfaccia di loopback accanto a `tailscaled`, requisito che la rete bridge con porte pubblicate non può soddisfare. Eseguire il contenitore del Gateway con `network_mode: host` e montare nel contenitore il socket `tailscaled` dell'host (`/var/run/tailscale`) insieme alla CLI `tailscale`.

La Mini App è un percorso v1 riservato a Tailscale e non supporta l'iframe di Telegram Web.

## Controllo degli accessi e attivazione

### Identità del bot nei gruppi

Nei gruppi e negli argomenti dei forum, una menzione esplicita dell'handle del bot configurato (ad esempio `@my_bot`) si rivolge all'agente OpenClaw selezionato, anche quando il nome del profilo dell'agente è diverso dal nome utente Telegram. Il criterio di silenzio nei gruppi continua ad applicarsi al traffico non correlato, ma l'handle del bot non viene mai considerato come riferito a «qualcun altro».

<Tabs>
  <Tab title="Criterio per i messaggi diretti">
    `channels.telegram.dmPolicy` controlla l'accesso ai messaggi diretti:

    - `pairing` (predefinito)
    - `allowlist` (richiede almeno un ID mittente in `allowFrom`)
    - `open` (richiede che `allowFrom` includa `"*"`)
    - `disabled`

    `dmPolicy: "open"` con `allowFrom: ["*"]` consente a qualsiasi account Telegram che trovi o indovini il nome utente del bot di impartirgli comandi. Usarlo solo per bot intenzionalmente pubblici con strumenti fortemente limitati; i bot con un solo proprietario dovrebbero usare `allowlist` con ID utente numerici.

    `channels.telegram.allowFrom` accetta ID utente Telegram numerici. I prefissi `telegram:` / `tg:` vengono accettati e normalizzati.
    Nelle configurazioni con più account, un `channels.telegram.allowFrom` restrittivo di primo livello costituisce un limite di sicurezza: un `allowFrom: ["*"]` a livello di account non rende pubblico tale account, a meno che l'elenco di autorizzazione effettivo risultante dall'unione non contenga ancora un carattere jolly esplicito.
    `dmPolicy: "allowlist"` con `allowFrom` vuoto blocca tutti i messaggi diretti e viene rifiutato dalla convalida della configurazione.
    La configurazione richiede solo ID utente numerici. Se la configurazione contiene voci dell'elenco di autorizzazione `@username` provenienti da una configurazione precedente, eseguire `openclaw doctor --fix` per risolverle in ID numerici (secondo le possibilità; richiede un token bot di Telegram).
    Se in precedenza si faceva affidamento sui file dell'elenco di autorizzazione dell'archivio delle associazioni, `openclaw doctor --fix` può recuperare le voci in `channels.telegram.allowFrom` per le procedure basate sull'elenco di autorizzazione (ad esempio quando `dmPolicy: "allowlist"` non contiene ancora ID espliciti).

    Per i bot con un solo proprietario, è preferibile usare `dmPolicy: "allowlist"` con ID numerici `allowFrom` espliciti anziché dipendere dalle precedenti approvazioni di associazione.

    Errore comune: l'approvazione dell'associazione per i messaggi diretti non significa che «questo mittente è autorizzato ovunque». L'associazione concede esclusivamente l'accesso ai messaggi diretti. Se non esiste ancora un proprietario dei comandi, la prima associazione approvata imposta anche `commands.ownerAllowFrom`, assegnando ai comandi riservati al proprietario e alle approvazioni di esecuzione un account operatore esplicito. L'autorizzazione dei mittenti nei gruppi deriva comunque dagli elenchi di autorizzazione espliciti nella configurazione.
    Per essere autorizzati sia per i messaggi diretti sia per i comandi di gruppo con un'unica identità: inserire il proprio ID utente Telegram numerico in `channels.telegram.allowFrom` e, per i comandi riservati al proprietario, assicurarsi che `commands.ownerAllowFrom` contenga `telegram:<your user id>`.

    ### Individuazione del proprio ID utente Telegram

    Metodo più sicuro (senza bot di terze parti): inviare un messaggio diretto al proprio bot, eseguire `openclaw logs --follow` e leggere `from.id`.

    Metodo ufficiale tramite Bot API:

```bash
curl "https://api.telegram.org/bot<bot_token>/getUpdates"
```

    Servizi di terze parti (meno riservati): `@userinfobot` o `@getidsbot`.

  </Tab>

  <Tab title="Criterio dei gruppi ed elenchi di autorizzazione">
    Si applicano insieme due controlli:

    1. **Quali gruppi sono autorizzati** (`channels.telegram.groups`)
       - senza configurazione `groups`, `groupPolicy: "open"`: qualsiasi gruppo supera i controlli dell'ID del gruppo
       - senza configurazione `groups`, `groupPolicy: "allowlist"` (predefinito): tutti i gruppi sono bloccati finché non vengono aggiunte voci `groups` (o `"*"`)
       - `groups` configurato: funge da elenco di autorizzazione (ID espliciti o `"*"`)

    2. **Quali mittenti sono autorizzati nei gruppi** (`channels.telegram.groupPolicy`)
       - `open` / `allowlist` (predefinito) / `disabled`

    `groupAllowFrom` filtra i mittenti dei gruppi; se non è impostato, Telegram ricorre a `allowFrom` (non all'archivio delle associazioni: l'autorizzazione dei mittenti dei gruppi non eredita mai le approvazioni dell'archivio delle associazioni per i messaggi diretti, un limite di sicurezza a partire da `2026.2.25`).
    Le voci `groupAllowFrom` devono essere ID utente Telegram numerici (i prefissi `telegram:` / `tg:` vengono normalizzati); le voci non numeriche vengono ignorate. Non inserire qui ID di chat di gruppi o supergruppi: gli ID di chat negativi vanno inseriti in `channels.telegram.groups`.
    Schema pratico per i bot con un solo proprietario: impostare il proprio ID utente in `channels.telegram.allowFrom`, lasciare `groupAllowFrom` non impostato e autorizzare i gruppi desiderati in `channels.telegram.groups`.
    Se `channels.telegram` è completamente assente dalla configurazione, in fase di esecuzione viene applicato il valore predefinito `groupPolicy="allowlist"`, che nega l'accesso in caso di dubbio, a meno che `channels.defaults.groupPolicy` non sia impostato esplicitamente.

    Configurazione del gruppo riservata al proprietario:

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

    Eseguire una prova dal gruppo con `@<bot_username> ping`. I normali messaggi di gruppo non attivano il bot finché `requireMention: true`.

    Autorizzare qualsiasi membro di uno specifico gruppo:

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

    Autorizzare solo utenti specifici all'interno di uno specifico gruppo:

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
      Errore comune: `groupAllowFrom` non è un elenco di autorizzazione dei gruppi.

      - Gli ID negativi delle chat di gruppi o supergruppi Telegram (`-1001234567890`) vanno inseriti in `channels.telegram.groups`.
      - Gli ID utente Telegram (`8734062810`) vanno inseriti in `groupAllowFrom` per limitare le persone che possono attivare il bot all'interno di un gruppo autorizzato.
      - Usare `groupAllowFrom: ["*"]` solo per consentire a qualsiasi membro di un gruppo autorizzato di comunicare con il bot.

    </Warning>

  </Tab>

  <Tab title="Comportamento delle menzioni">
    Per impostazione predefinita, le risposte nei gruppi richiedono una menzione. Una menzione può provenire da:

    - una menzione nativa `@botusername`, oppure
    - uno schema di menzione in `agents.list[].groupChat.mentionPatterns` o `messages.groupChat.mentionPatterns`

    Opzioni a livello di sessione (solo stato, non persistenti): `/activation always`, `/activation mention`. Per la persistenza, usare la configurazione:

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

    Il contesto della cronologia del gruppo è sempre attivo ed è limitato da `historyLimit`. Impostare `channels.telegram.historyLimit: 0` per disabilitare la finestra della cronologia del gruppo. `openclaw doctor --fix` rimuove la chiave ritirata `includeGroupHistoryContext`.

    Per ottenere l'ID della chat di gruppo: inoltrare un messaggio del gruppo a `@userinfobot` / `@getidsbot`, leggere `chat.id` da `openclaw logs --follow`, esaminare `getUpdates` della Bot API oppure, dopo aver autorizzato il gruppo, eseguire `/whoami@<bot_username>`.

  </Tab>
</Tabs>

## Comportamento in fase di esecuzione

- Telegram viene eseguito all'interno del processo del gateway.
- L'instradamento è deterministico: le risposte ai messaggi Telegram in ingresso tornano su Telegram (il modello non sceglie i canali).
- I messaggi in ingresso vengono normalizzati nell'involucro condiviso del canale con metadati di risposta, segnaposto multimediali e contesto persistente della catena di risposte per le risposte osservate dal gateway.
- Le sessioni di gruppo sono isolate in base all'ID del gruppo. Gli argomenti del forum aggiungono `:topic:<threadId>`.
- I messaggi diretti possono contenere `message_thread_id`; OpenClaw lo conserva per le risposte. Le sessioni degli argomenti nei messaggi diretti vengono separate solo quando Telegram `getMe` segnala `has_topics_enabled: true` per il bot; altrimenti, i messaggi diretti rimangono nella sessione non suddivisa.
- Il long polling usa il runner grammY con sequenziamento per chat/per thread. La concorrenza del sink del runner usa `agents.defaults.maxConcurrent`.
- L'avvio con più account limita le sonde `getMe` simultanee, in modo che le flotte di bot di grandi dimensioni non avviino contemporaneamente le sonde per ogni account.
- Ogni processo del gateway protegge il long polling affinché un solo poller attivo alla volta possa usare un token del bot. Conflitti 409 persistenti di `getUpdates` indicano che un altro gateway OpenClaw, script o poller esterno sta usando lo stesso token.
- Per impostazione predefinita, il watchdog del polling si riavvia dopo 120 secondi senza un completamento di `getUpdates` che ne confermi l'operatività. Aumentare `channels.telegram.pollingStallThresholdMs` (30000-600000, con supporto per override per account) solo se la distribuzione rileva falsi riavvii per blocco del polling durante operazioni di lunga durata.
- L'API Bot di Telegram non supporta le conferme di lettura (`sendReadReceipts` non si applica).

<Note>
  `channels.telegram.dm.threadReplies` e `channels.telegram.direct.<chatId>.threadReplies` sono stati rimossi. Eseguire `openclaw doctor --fix` dopo l'aggiornamento se la configurazione contiene ancora queste chiavi. L'instradamento degli argomenti dei messaggi diretti ora segue Telegram `getMe.has_topics_enabled` (controllato dalla modalità con thread di BotFather): i bot con argomenti abilitati usano sessioni dei messaggi diretti con ambito di thread quando Telegram invia `message_thread_id`; gli altri messaggi diretti rimangono nella sessione non suddivisa.
</Note>

## Riferimento delle funzionalità

<AccordionGroup>
  <Accordion title="Anteprima del flusso in tempo reale (modifiche dei messaggi)">
    OpenClaw trasmette le risposte parziali in tempo reale nelle chat dirette, nei gruppi e negli argomenti: invia un messaggio di anteprima, quindi esegue ripetutamente `editMessageText`, finalizzandolo sul posto.

    - `channels.telegram.streaming` è `off | partial | block | progress` (predefinito: `partial`)
    - le brevi anteprime iniziali della risposta vengono sottoposte a debounce e quindi materializzate dopo un ritardo limitato se l'esecuzione è ancora attiva
    - `progress` mantiene una singola bozza di stato modificabile per l'avanzamento degli strumenti, mostra l'etichetta di stato stabile quando l'attività della risposta arriva prima dell'avanzamento degli strumenti, la cancella al completamento e invia la risposta finale come messaggio normale
    - `streaming.preview.toolProgress` controlla se gli aggiornamenti degli strumenti/dell'avanzamento riutilizzano lo stesso messaggio di anteprima modificato (predefinito: `true` quando il flusso di anteprima è attivo)
    - `streaming.preview.commandText` controlla i dettagli di comando/esecuzione all'interno di tali righe: `raw` (predefinito) o `status` (solo l'etichetta dello strumento)
    - `streaming.progress.commentary` (predefinito: `false`) abilita il testo di commento/preambolo dell'assistente nella bozza temporanea di avanzamento
    - vengono rilevati il valore legacy `channels.telegram.streamMode`, i valori booleani `streaming` e le chiavi ritirate dell'anteprima nativa delle bozze; eseguire `openclaw doctor --fix` per migrarli

    Le righe di avanzamento degli strumenti sono i brevi aggiornamenti di stato mostrati durante l'esecuzione degli strumenti (esecuzione di comandi, lettura di file, aggiornamenti della pianificazione, riepiloghi delle patch, preambolo/commento di Codex in modalità app-server). Telegram le mantiene attive per impostazione predefinita (in linea con il comportamento rilasciato da `v2026.4.22`+).

    Mantenere le modifiche dell'anteprima della risposta ma nascondere le righe di avanzamento degli strumenti:

    ```json
    {
      "channels": {
        "telegram": {
          "streaming": {
            "mode": "partial",
            "preview": { "toolProgress": false }
          }
        }
      }
    }
    ```

    Mantenere visibile l'avanzamento degli strumenti ma nascondere il testo di comando/esecuzione:

    ```json
    {
      "channels": {
        "telegram": {
          "streaming": {
            "mode": "partial",
            "preview": { "commandText": "status" }
          }
        }
      }
    }
    ```

    La modalità `progress` mostra l'avanzamento degli strumenti senza modificare la risposta finale in quel messaggio. Inserire il criterio del testo dei comandi sotto `streaming.progress`:

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

    `streaming.mode: "off"` disabilita le modifiche dell'anteprima e sopprime i messaggi generici relativi agli strumenti/all'avanzamento anziché inviarli come messaggi di stato autonomi; le richieste di approvazione, i contenuti multimediali e gli errori continuano a essere instradati tramite la normale consegna finale. `streaming.preview.toolProgress: false` mantiene solo le modifiche dell'anteprima della risposta.

    <Note>
      Le risposte a citazioni selezionate costituiscono l'eccezione. Quando `replyToMode` è `first`, `all` o `batched` e il messaggio in ingresso contiene il testo di una citazione selezionata, OpenClaw invia la risposta finale tramite il percorso nativo di Telegram per le risposte alle citazioni anziché modificare l'anteprima della risposta, quindi `streaming.preview.toolProgress` non può mostrare righe di stato in quel turno. Le risposte al messaggio corrente senza testo di citazione selezionato continuano a essere trasmesse in streaming. Impostare `replyToMode: "off"` quando la visibilità dell'avanzamento degli strumenti è più importante delle risposte native alle citazioni, oppure `streaming.preview.toolProgress: false` per accettare tale compromesso.
    </Note>

    Per le risposte di solo testo: le anteprime brevi ricevono la modifica finale sul posto; le risposte finali lunghe suddivise in più messaggi riutilizzano l'anteprima come primo frammento e quindi inviano solo il resto; le risposte finali in modalità di avanzamento cancellano la bozza di stato e usano la normale consegna finale; se la modifica finale non riesce prima che il completamento sia confermato, OpenClaw ripiega sulla normale consegna finale e rimuove l'anteprima obsoleta. Per le risposte complesse (payload multimediali), OpenClaw ripiega sempre sulla normale consegna finale e rimuove l'anteprima.

    Il flusso di anteprima e il flusso a blocchi si escludono a vicenda: quando il flusso a blocchi è abilitato esplicitamente, OpenClaw salta il flusso di anteprima per evitare una doppia trasmissione.

    Ragionamento: `/reasoning stream` trasmette il ragionamento nell'anteprima in tempo reale durante la generazione, quindi elimina l'anteprima del ragionamento dopo la consegna finale (usare `/reasoning on` per mantenerla visibile). La risposta finale viene inviata senza il testo del ragionamento.

  </Accordion>

  <Accordion title="Formattazione avanzata dei messaggi">
    Per impostazione predefinita, il testo in uscita usa messaggi HTML standard di Telegram, leggibili nei client attuali: grassetto, corsivo, collegamenti, codice, spoiler, citazioni, non blocchi avanzati esclusivi dell'API Bot 10.2 (tabelle native, dettagli, contenuti multimediali avanzati, formule).

    Abilitare i messaggi avanzati dell'API Bot 10.2:

```json5
{
  channels: {
    telegram: {
      richMessages: true,
    },
  },
}
```

    Quando sono abilitati: l'agente viene informato che i messaggi avanzati sono disponibili per questo bot/account (con il contratto di creazione supportato per Markdown e isole HTML); il testo Markdown viene reso tramite l'IR Markdown di OpenClaw come blocchi avanzati tipizzati dell'API Bot 10.2 (intestazioni, tabelle, dettagli, elenchi di controllo, contenuti multimediali avanzati, formule, mappe, collage); le didascalie dei contenuti multimediali continuano a usare le didascalie HTML di Telegram (i messaggi avanzati non sostituiscono le didascalie, che hanno un limite di 1024 caratteri).

    Ciò evita che il testo del modello contenga i simboli speciali del Markdown avanzato di Telegram, in modo che le valute come `$400-600K` non vengano interpretate come formule matematiche. Il testo avanzato lungo viene suddiviso automaticamente entro i limiti di Telegram. Le tabelle che superano il limite di 20 colonne ripiegano su un blocco di codice.

    Impostazione predefinita: disattivata, per la compatibilità con i client; alcuni client Desktop, Web, Android e di terze parti attuali mostrano come non supportati i messaggi avanzati accettati. Lasciare questa opzione disattivata a meno che tutti i client usati con il bot siano in grado di visualizzarli. `/status` indica se i messaggi avanzati sono attivi o disattivi per la sessione corrente.

    Le anteprime dei collegamenti sono attive per impostazione predefinita. `channels.telegram.linkPreview: false` disabilita il rilevamento automatico delle entità per il testo avanzato.

  </Accordion>

  <Accordion title="Comandi nativi e comandi personalizzati">
    Il menu dei comandi di Telegram viene registrato all'avvio con `setMyCommands`. `commands.native: "auto"` abilita i comandi nativi per Telegram.

    Aggiungere voci personalizzate al menu dei comandi:

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

    Regole: i nomi vengono normalizzati (rimozione del prefisso `/`, conversione in minuscolo); schema valido `a-z`, `0-9`, `_`, lunghezza 1-32; i comandi personalizzati non possono sostituire quelli nativi; i conflitti/duplicati vengono ignorati e registrati.

    I comandi personalizzati sono solo voci di menu: non implementano automaticamente il comportamento. I comandi di Plugin/Skills possono comunque funzionare quando vengono digitati, anche se non sono visualizzati nel menu di Telegram. Se i comandi nativi sono disabilitati, quelli integrati vengono rimossi; i comandi personalizzati/di Plugin possono comunque essere registrati se configurati.

    Errori comuni di configurazione:

    - `setMyCommands failed` con `BOT_COMMANDS_TOO_MUCH` dopo un nuovo tentativo di riduzione indica che il menu supera ancora il limite; ridurre i comandi di Plugin/Skills/personalizzati oppure disabilitare `channels.telegram.commands.native`.
    - Se `deleteWebhook`, `deleteMyCommands` o `setMyCommands` non riesce con `404: Not Found`, mentre i comandi curl diretti dell'API Bot funzionano, in genere significa che `channels.telegram.apiRoot` è stato impostato sull'endpoint completo `/bot<TOKEN>`. `apiRoot` deve essere solo la radice dell'API Bot; `openclaw doctor --fix` rimuove un `/bot<TOKEN>` finale accidentale.
    - `getMe returned 401` significa che Telegram ha rifiutato il token del bot configurato. Aggiornare `botToken`, `tokenFile` o `TELEGRAM_BOT_TOKEN` (account predefinito) con il token BotFather corrente; OpenClaw si arresta prima del polling, quindi ciò non viene segnalato come errore di pulizia del Webhook.
    - `setMyCommands failed` con errori di rete/recupero indica generalmente che il DNS/HTTPS in uscita verso `api.telegram.org` è bloccato.

    ### Comandi di associazione del dispositivo (Plugin `device-pair`)

    Quando è installato:

    1. `/pair` genera un codice di configurazione
    2. incollare il codice nell'app iOS
    3. `/pair pending` elenca le richieste in sospeso (inclusi ruolo/ambiti)
    4. approvare: `/pair approve <requestId>`, `/pair approve` (unica richiesta in sospeso) o `/pair approve latest`

    Se un dispositivo riprova con dettagli di autenticazione modificati (ruolo, ambiti, chiave pubblica), la richiesta precedente in sospeso viene sostituita da un nuovo `requestId`; eseguire nuovamente `/pair pending` prima dell'approvazione.

    Ulteriori dettagli: [Associazione](/it/channels/pairing#pair-via-telegram).

  </Accordion>

  <Accordion title="Pulsanti incorporati">
    Configurare l'ambito della tastiera incorporata:

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

    Ambiti: `off`, `dm`, `group`, `all`, `allowlist` (predefinito). Il valore legacy `capabilities: ["inlineButtons"]` viene mappato a `"all"`.

    Esempio di azione del messaggio:

```json5
{
  action: "send",
  channel: "telegram",
  to: "123456789",
  message: "Scegli un'opzione:",
  buttons: [
    [
      { text: "Sì", callback_data: "yes" },
      { text: "No", callback_data: "no" },
    ],
    [{ text: "Annulla", callback_data: "cancel" }],
  ],
}
```

    Esempio di pulsante Mini App:

```json5
{
  action: "send",
  channel: "telegram",
  to: "123456789",
  message: "Apri l'app:",
  presentation: {
    blocks: [
      {
        type: "buttons",
        buttons: [{ label: "Avvia", web_app: { url: "https://example.com/app" } }],
      },
    ],
  },
}
```

    I pulsanti `web_app` funzionano solo nelle chat private tra un utente e il bot.

    I clic sui callback non acquisiti da un gestore interattivo di Plugin registrato vengono passati all'agente come testo: `callback_data: <value>`.

  </Accordion>

  <Accordion title="Azioni sui messaggi Telegram per agenti e automazione">
    Azioni:

    - `sendMessage` (`to`, `content`, `mediaUrl` facoltativo, `replyToMessageId`, `messageThreadId`)
    - `react` (`chatId`, `messageId`, `emoji`)
    - `deleteMessage` (`chatId`, `messageId`)
    - `editMessage` (`chatId`, `messageId`, `content` o `caption`, pulsanti incorporati `presentation` facoltativi; le modifiche dei soli pulsanti aggiornano il markup della risposta)
    - `createForumTopic` (`chatId`, `name`, `iconColor` facoltativo, `iconCustomEmojiId`)

    Alias ergonomici: `send`, `react`, `delete`, `edit`, `sticker`, `sticker-search`, `topic-create`.

    Controllo di abilitazione: `channels.telegram.actions.sendMessage`, `deleteMessage`, `reactions`, `sticker` (impostazione predefinita: disabilitata). `edit`, `createForumTopic` e `editForumTopic` sono abilitati per impostazione predefinita senza un'opzione dedicata.
    Gli invii in fase di esecuzione usano lo snapshot attivo di configurazione/segreti acquisito all'avvio o al ricaricamento, quindi i percorsi delle azioni non risolvono nuovamente i valori `SecretRef` per ogni invio.

    Semantica della rimozione delle reazioni: [/tools/reactions](/it/tools/reactions).

  </Accordion>

  <Accordion title="Tag per le risposte in thread">
    Tag espliciti per le risposte in thread nell'output generato:

    - `[[reply_to_current]]` — risponde al messaggio che ha attivato l'azione
    - `[[reply_to:<id>]]` — risponde a un ID messaggio specifico

    `channels.telegram.replyToMode`: `off` (impostazione predefinita), `first`, `all`.

    Quando le risposte in thread sono abilitate e il testo o la didascalia originale è disponibile, OpenClaw aggiunge automaticamente un estratto citato nativo. Telegram limita il testo delle citazioni native a 1024 unità di codice UTF-16; per i messaggi più lunghi viene citata la parte iniziale e si ricorre a una risposta semplice se Telegram rifiuta la citazione.

    `off` disabilita soltanto le risposte implicite in thread; i tag espliciti `[[reply_to_*]]` vengono comunque rispettati.

  </Accordion>

  <Accordion title="Argomenti dei forum e comportamento dei thread">
    Supergruppi con forum: alle chiavi di sessione degli argomenti viene aggiunto `:topic:<threadId>`; le risposte e l'indicatore di digitazione sono indirizzati al thread dell'argomento; il percorso di configurazione dell'argomento è `channels.telegram.groups.<chatId>.topics.<threadId>`.

    L'argomento generale (`threadId=1`) è un caso speciale: gli invii di messaggi omettono `message_thread_id` (Telegram rifiuta `sendMessage(...thread_id=1)` con "thread not found"), ma le azioni di digitazione includono comunque `message_thread_id` (empiricamente necessario affinché venga visualizzato l'indicatore di digitazione).

    Le voci degli argomenti ereditano le impostazioni del gruppo, salvo sostituzione (`requireMention`, `allowFrom`, `skills`, `systemPrompt`, `enabled`, `groupPolicy`). `agentId` è specifico dell'argomento e non eredita i valori predefiniti del gruppo. `topics."*"` imposta i valori predefiniti per ogni argomento del gruppo; gli ID esatti degli argomenti hanno comunque la precedenza su `"*"`.

    **Instradamento dell'agente per argomento**: ogni argomento può essere instradato a un agente diverso tramite `agentId` nella configurazione dell'argomento, ottenendo uno spazio di lavoro, una memoria e una sessione propri:

    ```json5
    {
      channels: {
        telegram: {
          groups: {
            "-1001234567890": {
              topics: {
                "1": { agentId: "main" },      // Argomento generale -> agente principale
                "3": { agentId: "zu" },        // Argomento sviluppo -> agente zu
                "5": { agentId: "coder" }      // Revisione del codice -> agente coder
              }
            }
          }
        }
      }
    }
    ```

    Ogni argomento dispone quindi di una propria chiave di sessione, ad esempio `agent:zu:telegram:group:-1001234567890:topic:3`.

    **Associazione persistente dell'argomento ACP**: gli argomenti dei forum possono fissare le sessioni dell'infrastruttura ACP tramite associazioni tipizzate di primo livello (`bindings[]` con `type: "acp"`, `match.channel: "telegram"`, `peer.kind: "group"` e un ID qualificato dall'argomento come `-1001234567890:topic:42`). Attualmente l'ambito è limitato agli argomenti dei forum nei gruppi/supergruppi. Consultare [Agenti ACP](/it/tools/acp-agents).

    **Avvio ACP associato al thread dalla chat**: `/acp spawn <agent> --thread here|auto` associa l'argomento corrente a una nuova sessione ACP; i messaggi successivi vengono instradati direttamente a tale sessione e OpenClaw fissa la conferma dell'avvio nell'argomento. Richiede `channels.telegram.threadBindings.spawnSessions` (impostazione predefinita: `true`).

    Il contesto del modello espone `MessageThreadId` e `IsForum`. Le chat con messaggi diretti che usano `message_thread_id` conservano i metadati della risposta, ma usano chiavi di sessione compatibili con i thread solo quando `getMe` di Telegram restituisce `has_topics_enabled: true`.
    Le sostituzioni ritirate `dm.threadReplies` e `direct.*.threadReplies` sono state rimosse; la modalità thread di BotFather è l'unica fonte attendibile. Eseguire `openclaw doctor --fix` per rimuovere le chiavi di configurazione obsolete.

  </Accordion>

  <Accordion title="Audio, video e adesivi">
    ### Messaggi audio

    Telegram distingue i messaggi vocali dai file audio. Impostazione predefinita: comportamento da file audio; inserire il tag `[[audio_as_voice]]` nella risposta dell'agente per forzare l'invio come messaggio vocale. Le trascrizioni dei messaggi vocali in entrata vengono presentate nel contesto dell'agente come testo generato automaticamente e non attendibile, ma il rilevamento delle menzioni continua a usare la trascrizione non elaborata, affinché i messaggi vocali soggetti al requisito di menzione continuino a funzionare.

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

    Telegram distingue i file video dai videomessaggi. I videomessaggi non supportano didascalie; il testo del messaggio fornito viene inviato separatamente.

```json5
{
  action: "send",
  channel: "telegram",
  to: "123456789",
  media: "https://example.com/video.mp4",
  asVideoNote: true,
}
```

    ### Posizioni e luoghi

    Usare l'azione `send` esistente con un unico oggetto autonomo `location`. Le coordinate inviano un segnaposto nativo; aggiungendo sia `name` sia `address` viene inviata una scheda nativa del luogo. Gli invii di posizioni non possono essere combinati con testo del messaggio o contenuti multimediali.

```json5
{
  action: "send",
  channel: "telegram",
  to: "123456789",
  location: {
    latitude: 48.858844,
    longitude: 2.294351,
    accuracy: 12,
    name: "Eiffel Tower",
    address: "Champ de Mars, Paris",
  },
}
```

    ### Adesivi

    In entrata: i file WEBP statici vengono scaricati ed elaborati (segnaposto `<media:sticker>`); i file TGS animati e WEBM video vengono ignorati.

    Campi del contesto degli adesivi: `Sticker.emoji`, `Sticker.setName`, `Sticker.fileId`, `Sticker.fileUniqueId`, `Sticker.cachedDescription`. Le descrizioni vengono memorizzate nella cache dello stato SQLite del Plugin OpenClaw per ridurre le chiamate ripetute al sistema di visione.

    Abilitare le azioni per gli adesivi:

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

    Invio:

```json5
{
  action: "sticker",
  channel: "telegram",
  to: "123456789",
  fileId: "CAACAgIAAxkBAAI...",
}
```

    Ricerca negli adesivi memorizzati nella cache:

```json5
{
  action: "sticker-search",
  channel: "telegram",
  query: "cat waving",
  limit: 5,
}
```

  </Accordion>

  <Accordion title="Notifiche delle reazioni">
    Le reazioni di Telegram arrivano come aggiornamenti `message_reaction`, separati dai payload dei messaggi. Quando sono abilitate, OpenClaw accoda eventi di sistema come `Telegram reaction added: 👍 by Alice (@alice) on msg 42`.

    - `channels.telegram.reactionNotifications`: `off | own | all` (impostazione predefinita: `own`)
    - `channels.telegram.reactionLevel`: `off | ack | minimal | extensive` (impostazione predefinita: `minimal`)

    `own` indica soltanto le reazioni degli utenti ai messaggi inviati dal bot (con la massima affidabilità possibile tramite una cache dei messaggi inviati). Gli eventi di reazione rispettano comunque i controlli di accesso di Telegram (`dmPolicy`, `allowFrom`, `groupPolicy`, `groupAllowFrom`); i mittenti non autorizzati vengono ignorati.

    Telegram non fornisce gli ID dei thread negli aggiornamenti delle reazioni: i gruppi senza forum vengono instradati alla sessione della chat di gruppo; i gruppi con forum vengono instradati alla sessione dell'argomento generale (`:topic:1`), non all'esatto argomento di origine.

    `allowed_updates` per polling/Webhook include automaticamente `message_reaction`.

  </Accordion>

  <Accordion title="Reazioni di conferma">
    `ackReaction` invia un'emoji di conferma mentre OpenClaw elabora un messaggio in entrata. `messages.ackReactionScope` stabilisce *quando* viene inviata.

    **Ordine di risoluzione dell'emoji:**

    - `channels.telegram.accounts.<accountId>.ackReaction`
    - `channels.telegram.ackReaction`
    - `messages.ackReaction`
    - emoji di riserva dell'identità dell'agente (`agents.list[].identity.emoji`, altrimenti "👀")

    Telegram richiede un'emoji Unicode (ad esempio "👀"); usare `""` per disabilitare la reazione per un canale o un account.

    **Ambito (`messages.ackReactionScope`, valore predefinito `"group-mentions"`; attualmente nessuna sostituzione a livello di account Telegram o canale Telegram):**

    `all` (messaggi diretti + gruppi, inclusi gli eventi ambientali delle stanze), `direct` (solo messaggi diretti), `group-all` (ogni messaggio di gruppo tranne gli eventi ambientali delle stanze, nessun messaggio diretto), `group-mentions` (gruppi quando viene menzionato il bot; **nessun messaggio diretto** — valore predefinito), `off` / `none` (disabilitato).

    <Note>
    L'ambito predefinito (`group-mentions`) non attiva reazioni di conferma nei messaggi diretti o negli eventi ambientali delle stanze. Usare `direct` o `all` per i messaggi diretti; solo `all` conferma gli eventi ambientali delle stanze. Questo valore viene letto all'avvio del provider Telegram, quindi è necessario riavviare il Gateway affinché la modifica abbia effetto.
    </Note>

  </Accordion>

  <Accordion title="Scritture della configurazione da eventi e comandi Telegram">
    Le scritture della configurazione del canale sono abilitate per impostazione predefinita (`configWrites !== false`). Le scritture attivate da Telegram includono gli eventi di migrazione dei gruppi (`migrate_to_chat_id`, aggiorna `channels.telegram.groups`) e `/config set` / `/config unset` (richiede l'abilitazione del comando).

    Disabilitazione:

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

  <Accordion title="Polling prolungato e Webhook">
    L'impostazione predefinita è il polling prolungato. Per la modalità Webhook, impostare `channels.telegram.webhookUrl` e `channels.telegram.webhookSecret`; facoltativi: `webhookPath` (valore predefinito `/telegram-webhook`), `webhookHost` (valore predefinito `127.0.0.1`), `webhookPort` (valore predefinito `8787`), `webhookCertPath` (certificato autofirmato in formato PEM per configurazioni con IP diretto o senza dominio).

    In modalità polling prolungato, OpenClaw rende persistente il proprio indicatore di riavvio soltanto dopo che un aggiornamento è stato inoltrato correttamente; se un gestore non riesce a elaborarlo, l'aggiornamento rimane ripetibile nello stesso processo anziché essere contrassegnato come completato.

    Il listener locale si associa per impostazione predefinita a `127.0.0.1:8787`. Per l'ingresso pubblico, collocare un proxy inverso davanti alla porta locale oppure impostare intenzionalmente `webhookHost: "0.0.0.0"`.

    La modalità Webhook convalida le protezioni della richiesta, il token segreto di Telegram e il corpo JSON, quindi registra l'aggiornamento nella coda di ingresso persistente prima di restituire un `200` vuoto. L'acquisizione persistente completata include `x-openclaw-delivery-accepted: durable`; le risposte relative a integrità, instradamento, autenticazione, convalida ed errori di archiviazione omettono questa intestazione. I proxy inversi e i controller degli host possono richiedere l'intestazione per distinguere l'acquisizione da parte di OpenClaw da un generico `200` vuoto, senza dedurre l'accettazione dai tempi di risposta.

    OpenClaw elabora quindi l'aggiornamento in modo asincrono attraverso le stesse corsie del bot per chat/argomento usate dal polling prolungato, in modo che le operazioni lente dell'agente non ritardino l'ACK di consegna di Telegram.

  </Accordion>

  <Accordion title="Limiti, nuovi tentativi e destinazioni CLI">
    - `channels.telegram.textChunkLimit` valore predefinito 4000; `streaming.chunkMode="newline"` preferisce i confini tra paragrafi (righe vuote) prima della suddivisione per lunghezza.
    - `channels.telegram.mediaMaxMb` (valore predefinito 100) limita le dimensioni dei contenuti multimediali in entrata e in uscita.
    - `channels.telegram.mediaGroupFlushMs` (valore predefinito 500, intervallo 10-60000) controlla per quanto tempo gli album/gruppi multimediali vengono memorizzati nel buffer prima che OpenClaw li inoltri come un unico messaggio in entrata. Aumentarlo se le parti dell'album arrivano in ritardo; diminuirlo per ridurre la latenza della risposta all'album.
    - `channels.telegram.timeoutSeconds` sostituisce il timeout del client API (se non impostato, si applica il valore predefinito di grammY). I client bot limitano i valori configurati inferiori al limite di 60 secondi per le richieste di testo/digitazione in uscita, affinché grammY non interrompa la consegna della risposta visibile prima che possano intervenire il limite del trasporto di OpenClaw e il meccanismo di ripiego. Il long polling continua a usare un limite di 45 secondi per le richieste `getUpdates`, affinché i polling inattivi non vengano abbandonati indefinitamente.
    - `channels.telegram.pollingStallThresholdMs` ha come valore predefinito 120000; regolarlo tra 30000 e 600000 solo in caso di riavvii dovuti a falsi positivi di blocco del polling.
    - la cronologia del contesto di gruppo usa `channels.telegram.historyLimit` o `messages.groupChat.historyLimit` (valore predefinito 50); `0` la disabilita.
    - il contesto supplementare di risposta/citazione/inoltro viene normalizzato in un'unica finestra di contesto della conversazione selezionata quando il Gateway ha osservato i messaggi principali; la cache dei messaggi osservati risiede nello stato del Plugin SQLite di OpenClaw e `openclaw doctor --fix` importa i file complementari legacy. Telegram include un solo `reply_to_message` superficiale per aggiornamento, pertanto le catene più vecchie della cache sono limitate a tale payload.
    - le liste di autorizzazione di Telegram determinano principalmente chi può attivare l'agente, non costituiscono un limite completo di oscuramento del contesto supplementare.
    - cronologia dei messaggi diretti: `channels.telegram.dmHistoryLimit`, `channels.telegram.dms["<user_id>"].historyLimit`.
    - `channels.telegram.retry` si applica agli strumenti ausiliari di invio di Telegram (CLI/strumenti/azioni) per gli errori recuperabili dell'API in uscita. La consegna della risposta finale in entrata usa un nuovo tentativo di invio sicuro limitato per gli errori precedenti alla connessione, ma non ripete le richieste in caso di risposte di rete ambigue successive all'invio, che potrebbero duplicare i messaggi visibili.

    Le destinazioni di invio della CLI e dello strumento per i messaggi accettano un ID chat numerico, un nome utente o la destinazione di un argomento del forum:

```bash
openclaw message send --channel telegram --target 123456789 --message "hi"
openclaw message send --channel telegram --target @name --message "hi"
openclaw message send --channel telegram --target -1001234567890:topic:42 --message "hi topic"
```

    I sondaggi usano `openclaw message poll` e supportano gli argomenti del forum:

```bash
openclaw message poll --channel telegram --target 123456789 \
  --poll-question "Ship it?" --poll-option "Yes" --poll-option "No"
openclaw message poll --channel telegram --target -1001234567890:topic:42 \
  --poll-question "Pick a time" --poll-option "10am" --poll-option "2pm" \
  --poll-duration-seconds 300 --poll-public
```

    Opzioni dei sondaggi esclusive di Telegram: `--poll-duration-seconds` (5-600), `--poll-anonymous`, `--poll-public`, `--thread-id` (o una destinazione `:topic:`). `--poll-option` viene ripetuto 2-12 volte (limite delle opzioni di Telegram).

    L'invio tramite Telegram supporta anche `--presentation` con blocchi `buttons` per le tastiere incorporate (quando `channels.telegram.capabilities.inlineButtons` lo consente), `--pin` o `--delivery '{"pin":true}'` per richiedere la consegna fissata quando il bot può fissare messaggi nella chat e `--force-document` per inviare immagini, GIF e video in uscita come documenti anziché come caricamenti compressi, animati o video.

    Controllo delle azioni: `channels.telegram.actions.sendMessage=false` disabilita tutti i messaggi in uscita, inclusi i sondaggi; `channels.telegram.actions.poll=false` disabilita la creazione di sondaggi lasciando abilitati gli invii normali.

  </Accordion>

  <Accordion title="Approvazioni dell'esecuzione in Telegram">
    Telegram supporta le approvazioni dell'esecuzione nei messaggi diretti degli approvatori e può facoltativamente pubblicare le richieste nella chat o nell'argomento di origine. Gli approvatori devono essere ID utente Telegram numerici.

    - `channels.telegram.execApprovals.enabled` (`"auto"` abilita la funzionalità quando è possibile determinare almeno un approvatore)
    - `channels.telegram.execApprovals.approvers` (in alternativa usa gli ID numerici dei proprietari da `commands.ownerAllowFrom`)
    - `channels.telegram.execApprovals.target`: `dm` (valore predefinito) | `channel` | `both`
    - `agentFilter`, `sessionFilter`

    `channels.telegram.allowFrom`, `groupAllowFrom` e `defaultTo` controllano chi può comunicare con il bot e dove vengono inviate le risposte normali; non rendono un utente approvatore dell'esecuzione. Il primo abbinamento tramite messaggio diretto approvato inizializza `commands.ownerAllowFrom` quando non esiste ancora un proprietario dei comandi, consentendo alle configurazioni con un solo proprietario di funzionare senza duplicare gli ID in `execApprovals.approvers`.

    La consegna nel canale mostra il testo del comando nella chat; abilitare `channel` o `both` solo in gruppi/argomenti attendibili. Quando la richiesta arriva in un argomento del forum, OpenClaw conserva l'argomento per la richiesta di approvazione e il relativo seguito. Per impostazione predefinita, le approvazioni dell'esecuzione scadono dopo 30 minuti.

    I pulsanti di approvazione incorporati richiedono inoltre che `channels.telegram.capabilities.inlineButtons` consenta la superficie di destinazione (`dm`, `group` o `all`). Gli ID di approvazione con prefisso `plugin:` vengono risolti tramite le approvazioni del Plugin; gli altri vengono prima risolti tramite le approvazioni dell'esecuzione.

    Consultare [Approvazioni dell'esecuzione](/it/tools/exec-approvals).

  </Accordion>
</AccordionGroup>

## Controlli delle risposte di errore

Quando l'agente rileva un errore di consegna o del provider, i criteri di gestione degli errori determinano se i messaggi di errore raggiungono la chat Telegram:

| Chiave                                 | Valori                     | Valore predefinito         | Descrizione                                                                                                                                                                                              |
| ----------------------------------- | -------------------------- | --------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `channels.telegram.errorPolicy`     | `always`, `once`, `silent` | `always`        | `always` invia ogni messaggio di errore alla chat. `once` invia ogni messaggio di errore distinto una volta per finestra di attesa (sopprime gli errori identici ripetuti). `silent` non invia mai messaggi di errore alla chat. |
| `channels.telegram.errorCooldownMs` | numero (ms)                | `14400000` (4h) | Finestra di attesa per il criterio `once`. Dopo l'invio di un errore, lo stesso messaggio viene soppresso fino alla scadenza di questo intervallo. Impedisce l'invio massiccio di errori durante le interruzioni del servizio.                                           |

Sono supportate sostituzioni per account, gruppo e argomento (con la stessa ereditarietà delle altre chiavi di configurazione di Telegram).

```json5
{
  channels: {
    telegram: {
      errorPolicy: "always",
      errorCooldownMs: 120000,
      groups: {
        "-1001234567890": {
          errorPolicy: "silent", // sopprime gli errori in questo gruppo
        },
      },
    },
  },
}
```

## Risoluzione dei problemi

<AccordionGroup>
  <Accordion title="Il bot non risponde ai messaggi di gruppo senza menzione">

    - Se `requireMention=false`, la modalità privacy di Telegram deve consentire la visibilità completa: BotFather `/setprivacy` -> Disable, quindi rimuovere e aggiungere nuovamente il bot al gruppo.
    - `openclaw channels status` avvisa quando la configurazione prevede messaggi di gruppo senza menzione.
    - `openclaw channels status --probe` verifica gli ID numerici espliciti dei gruppi; non è possibile controllare l'appartenenza per il carattere jolly `"*"`.
    - Test rapido della sessione: `/activation always`.

  </Accordion>

  <Accordion title="Il bot non rileva alcun messaggio di gruppo">

    - Quando `channels.telegram.groups` esiste, il gruppo deve essere elencato (oppure deve includere `"*"`).
    - Verificare che il bot appartenga al gruppo.
    - Esaminare `openclaw logs --follow` per conoscere i motivi per cui i messaggi vengono ignorati.

  </Accordion>

  <Accordion title="I comandi funzionano solo parzialmente o non funzionano affatto">

    - Autorizzare l'identità del mittente (abbinamento e/o `allowFrom` numerico); l'autorizzazione dei comandi continua ad applicarsi anche quando il criterio del gruppo è `open`.
    - `setMyCommands failed` con `BOT_COMMANDS_TOO_MUCH` indica che il menu nativo contiene troppe voci; ridurre i comandi di Plugin/Skills/personalizzati oppure disabilitare i menu nativi.
    - Le chiamate di avvio `deleteMyCommands` / `setMyCommands` e le chiamate di digitazione `sendChatAction` sono limitate e, in caso di timeout della richiesta, vengono ripetute una volta tramite il trasporto di ripiego di Telegram. Gli errori persistenti di rete/recupero indicano generalmente che il DNS/HTTPS verso `api.telegram.org` non è raggiungibile.

  </Accordion>

  <Accordion title="All'avvio viene segnalato un token non autorizzato">

    - `getMe returned 401` è un errore di autenticazione di Telegram relativo al token del bot configurato. Copiare nuovamente o rigenerare il token in BotFather, quindi aggiornare `channels.telegram.botToken`, `tokenFile`, `accounts.<id>.botToken` o `TELEGRAM_BOT_TOKEN` (account predefinito).
    - `deleteWebhook 401 Unauthorized` durante l'avvio è anch'esso un errore di autenticazione; considerarlo come «nessun Webhook esistente» rimanderebbe semplicemente lo stesso errore di token non valido a una chiamata API successiva.

  </Accordion>

  <Accordion title="Instabilità del polling o della rete">

    - Node 22+ con un recupero/proxy personalizzato può causare un'interruzione immediata se i tipi `AbortSignal` non corrispondono.
    - Alcuni host risolvono prima `api.telegram.org` in IPv6; un'uscita IPv6 non funzionante causa errori intermittenti dell'API.
    - I registri contenenti `TypeError: fetch failed` o `Network request for 'getUpdates' failed!` vengono ritentati come errori di rete recuperabili.
    - Durante l'avvio del polling, OpenClaw riutilizza per grammY il controllo `getMe` riuscito all'avvio, affinché l'esecutore non debba eseguire un secondo `getMe` prima del primo `getUpdates`.
    - Se `deleteWebhook` non riesce a causa di un errore di rete transitorio durante l'avvio del polling, OpenClaw procede con il long polling invece di effettuare un'altra chiamata al piano di controllo precedente al polling. Un Webhook ancora attivo emerge quindi come conflitto `getUpdates`; OpenClaw ricrea il trasporto e ripete la pulizia del Webhook.
    - Se i socket di Telegram vengono riciclati con una breve cadenza fissa, verificare la presenza di un valore `channels.telegram.timeoutSeconds` basso: i client bot limitano i valori configurati al di sotto dei limiti delle richieste in uscita e `getUpdates`, ma le versioni precedenti potevano interrompere ogni polling o risposta quando questo valore era impostato al di sotto di tali limiti.
    - `Polling stall detected` nei registri indica che OpenClaw riavvia il polling e ricrea il trasporto dopo 120 secondi senza un completamento del controllo di attività del long polling, per impostazione predefinita.
    - `openclaw channels status --probe` e `openclaw doctor` avvisano quando un account di polling in esecuzione non ha completato `getUpdates` dopo il periodo di tolleranza iniziale, un account Webhook in esecuzione non ha completato `setWebhook` dopo il periodo di tolleranza iniziale oppure l'ultima attività riuscita del trasporto di polling è obsoleta.
    - Aumentare `channels.telegram.pollingStallThresholdMs` solo quando le chiamate `getUpdates` di lunga durata funzionano correttamente, ma l'host continua a segnalare falsi riavvii per blocco del polling. I blocchi persistenti indicano generalmente problemi di uscita relativi a proxy, DNS, IPv6 o TLS verso `api.telegram.org`.
    - Telegram rispetta le variabili di ambiente proxy del processo per il trasporto dell'API Bot: `HTTP_PROXY`, `HTTPS_PROXY`, `ALL_PROXY` e le varianti in minuscolo. `NO_PROXY` / `no_proxy` possono comunque ignorare `api.telegram.org`.
    - Se `OPENCLAW_PROXY_URL` è impostato per un ambiente di servizio e non è presente alcuna variabile di ambiente proxy standard, Telegram usa tale URL anche per il trasporto dell'API Bot.
    - Sugli host VPS con uscita diretta/TLS instabile, instradare le chiamate API di Telegram attraverso un proxy:

```yaml
channels:
  telegram:
    proxy: socks5://<user>:<password>@proxy-host:1080
```

    - Node 22+ utilizza per impostazione predefinita `autoSelectFamily=true` (tranne su WSL2). L'ordine dei risultati DNS di Telegram rispetta `OPENCLAW_TELEGRAM_DNS_RESULT_ORDER`, quindi `channels.telegram.network.dnsResultOrder`, infine l'impostazione predefinita del processo (ad esempio `NODE_OPTIONS=--dns-result-order=ipv4first`), con ripiego su `ipv4first` in Node 22+ se nessuna opzione è applicabile.
    - Su WSL2, o quando il comportamento solo IPv4 funziona meglio, forzare la selezione della famiglia:

```yaml
channels:
  telegram:
    network:
      autoSelectFamily: false
```

    - Le risposte nell'intervallo di benchmark RFC 2544 (`198.18.0.0/15`) sono già consentite per impostazione predefinita per i download multimediali di Telegram. Se un proxy fake-IP o trasparente attendibile riscrive `api.telegram.org` in un altro indirizzo privato/interno/a uso speciale durante i download multimediali, abilitare esplicitamente l'esclusione limitata a Telegram:

```yaml
channels:
  telegram:
    network:
      dangerouslyAllowPrivateNetwork: true
```

    - La stessa abilitazione esplicita è disponibile per ogni account in `channels.telegram.accounts.<accountId>.network.dangerouslyAllowPrivateNetwork`.
    - Se il proxy risolve gli host multimediali di Telegram in `198.18.x.x`, lasciare inizialmente disattivato il flag pericoloso: tale intervallo è già consentito per impostazione predefinita.

    <Warning>
      `channels.telegram.network.dangerouslyAllowPrivateNetwork` indebolisce le protezioni SSRF per i contenuti multimediali di Telegram. Utilizzarlo solo in ambienti proxy attendibili controllati dall'operatore (routing fake-IP di Clash, Mihomo, Surge) che generano risposte private o a uso speciale al di fuori dell'intervallo di benchmark RFC 2544. Lasciarlo disattivato per il normale accesso a Telegram tramite Internet pubblico.
    </Warning>

    - Sostituzioni temporanee tramite variabili d'ambiente: `OPENCLAW_TELEGRAM_DISABLE_AUTO_SELECT_FAMILY=1`, `OPENCLAW_TELEGRAM_ENABLE_AUTO_SELECT_FAMILY=1`, `OPENCLAW_TELEGRAM_DNS_RESULT_ORDER=ipv4first`.
    - Convalidare le risposte DNS:

```bash
dig +short api.telegram.org A
dig +short api.telegram.org AAAA
```

  </Accordion>
</AccordionGroup>

Ulteriore assistenza: [Risoluzione dei problemi dei canali](/it/channels/troubleshooting).

## Riferimento per la configurazione

Riferimento principale: [Riferimento per la configurazione - Telegram](/it/gateway/config-channels#telegram).

<Accordion title="Campi Telegram più significativi">

- avvio/autenticazione: `enabled`, `botToken`, `tokenFile` (deve essere un file normale; i collegamenti simbolici vengono rifiutati), `accounts.*`
- controllo degli accessi: `dmPolicy`, `allowFrom`, `groupPolicy`, `groupAllowFrom`, `groups`, `groups.*.topics.*`, `bindings[]` di primo livello (`type: "acp"`)
- impostazioni predefinite degli argomenti: `groups.<chatId>.topics."*"` si applica agli argomenti del forum senza corrispondenza; gli ID esatti degli argomenti hanno la precedenza
- approvazioni di esecuzione: `execApprovals`, `accounts.*.execApprovals`
- comandi/menu: `commands.native`, `commands.nativeSkills`, `customCommands`
- thread/risposte: `replyToMode`, `threadBindings`
- streaming: `streaming` (modalità `off | partial | block | progress`), `streaming.preview.toolProgress`
- formattazione/consegna: `textChunkLimit`, `streaming.chunkMode`, `richMessages`, `markdown.tables` (`off | bullets | code | block`), `linkPreview`, `responsePrefix`
- contenuti multimediali/rete: `mediaMaxMb`, `mediaGroupFlushMs`, `timeoutSeconds`, `pollingStallThresholdMs`, `retry`, `network.autoSelectFamily`, `network.dangerouslyAllowPrivateNetwork`, `proxy`
- radice API personalizzata: `apiRoot` (solo radice della Bot API; non includere `/bot<TOKEN>`), `trustedLocalFileRoots` (radici assolute `file_path` della Bot API ospitata autonomamente)
- Webhook: `webhookUrl`, `webhookSecret`, `webhookPath`, `webhookHost`, `webhookPort`, `webhookCertPath`
- azioni/funzionalità: `capabilities.inlineButtons`, `actions.sendMessage|editMessage|deleteMessage|reactions|sticker|createForumTopic|editForumTopic`
- reazioni: `reactionNotifications`, `reactionLevel`
- errori: `errorPolicy`, `errorCooldownMs`, `silentErrorReplies`
- scritture/cronologia: `configWrites`, `historyLimit`, `dmHistoryLimit`, `dms.*.historyLimit`

</Accordion>

<Note>
Precedenza tra più account: quando sono configurati due o più ID account, impostare `channels.telegram.defaultAccount` (oppure includere `channels.telegram.accounts.default`) per rendere esplicito l'instradamento predefinito. In caso contrario, OpenClaw ricorre al primo ID account normalizzato e `openclaw doctor` genera un avviso. Gli account denominati ereditano `channels.telegram.allowFrom` / `groupAllowFrom`, ma non i valori di `accounts.default.*`.
</Note>

## Contenuti correlati

<CardGroup cols={2}>
  <Card title="Associazione" icon="link" href="/it/channels/pairing">
    Associare un utente Telegram al Gateway.
  </Card>
  <Card title="Gruppi" icon="users" href="/it/channels/groups">
    Comportamento dell'elenco consentiti per gruppi e argomenti.
  </Card>
  <Card title="Instradamento dei canali" icon="route" href="/it/channels/channel-routing">
    Instradare i messaggi in entrata agli agenti.
  </Card>
  <Card title="Sicurezza" icon="shield" href="/it/gateway/security">
    Modello delle minacce e protezione avanzata.
  </Card>
  <Card title="Instradamento multi-agente" icon="sitemap" href="/it/concepts/multi-agent">
    Associare gruppi e argomenti agli agenti.
  </Card>
  <Card title="Risoluzione dei problemi" icon="wrench" href="/it/channels/troubleshooting">
    Diagnostica tra canali.
  </Card>
</CardGroup>
