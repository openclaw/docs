---
read_when:
    - Lavorare sulle funzionalità del canale Discord
summary: Stato del supporto del bot Discord, funzionalità e configurazione
title: Discord
x-i18n:
    generated_at: "2026-04-30T08:36:46Z"
    model: gpt-5.5
    provider: openai
    source_hash: e9f31af2801e7faf6456d4452a5f43b0e42a067b86b7e562c308fa450a847356
    source_path: channels/discord.md
    workflow: 16
---

Pronto per DM e canali guild tramite il Gateway Discord ufficiale.

<CardGroup cols={3}>
  <Card title="Associazione" icon="link" href="/it/channels/pairing">
    I DM Discord usano per impostazione predefinita la modalità di associazione.
  </Card>
  <Card title="Comandi slash" icon="terminal" href="/it/tools/slash-commands">
    Comportamento nativo dei comandi e catalogo dei comandi.
  </Card>
  <Card title="Risoluzione dei problemi dei canali" icon="wrench" href="/it/channels/troubleshooting">
    Diagnostica cross-channel e flusso di riparazione.
  </Card>
</CardGroup>

## Configurazione rapida

Dovrai creare una nuova applicazione con un bot, aggiungere il bot al tuo server e associarlo a OpenClaw. Consigliamo di aggiungere il bot al tuo server privato. Se non ne hai ancora uno, [creane prima uno](https://support.discord.com/hc/en-us/articles/204849977-How-do-I-create-a-server) (scegli **Create My Own > For me and my friends**).

<Steps>
  <Step title="Crea un'applicazione Discord e un bot">
    Vai al [Portale per sviluppatori Discord](https://discord.com/developers/applications) e fai clic su **New Application**. Assegnale un nome come "OpenClaw".

    Fai clic su **Bot** nella barra laterale. Imposta **Username** con il nome che usi per il tuo agente OpenClaw.

  </Step>

  <Step title="Abilita gli intent privilegiati">
    Sempre nella pagina **Bot**, scorri verso il basso fino a **Privileged Gateway Intents** e abilita:

    - **Message Content Intent** (obbligatorio)
    - **Server Members Intent** (consigliato; obbligatorio per allowlist di ruoli e corrispondenza nome-ID)
    - **Presence Intent** (opzionale; necessario solo per gli aggiornamenti di presenza)

  </Step>

  <Step title="Copia il token del bot">
    Torna in alto nella pagina **Bot** e fai clic su **Reset Token**.

    <Note>
    Nonostante il nome, questo genera il tuo primo token: non viene "reimpostato" nulla.
    </Note>

    Copia il token e salvalo da qualche parte. Questo è il tuo **Bot Token** e ti servirà a breve.

  </Step>

  <Step title="Genera un URL di invito e aggiungi il bot al server">
    Fai clic su **OAuth2** nella barra laterale. Genererai un URL di invito con le autorizzazioni corrette per aggiungere il bot al server.

    Scorri verso il basso fino a **OAuth2 URL Generator** e abilita:

    - `bot`
    - `applications.commands`

    Sotto comparirà una sezione **Bot Permissions**. Abilita almeno:

    **General Permissions**
      - Visualizzare canali
    **Text Permissions**
      - Inviare messaggi
      - Leggere la cronologia dei messaggi
      - Incorporare link
      - Allegare file
      - Aggiungere reazioni (opzionale)

    Questo è il set di base per i normali canali di testo. Se prevedi di pubblicare nei thread Discord, inclusi flussi di lavoro di forum o canali multimediali che creano o continuano un thread, abilita anche **Send Messages in Threads**.
    Copia l'URL generato in basso, incollalo nel browser, seleziona il server e fai clic su **Continue** per connetterlo. Ora dovresti vedere il bot nel server Discord.

  </Step>

  <Step title="Abilita la Modalità sviluppatore e raccogli i tuoi ID">
    Torna nell'app Discord: devi abilitare la Modalità sviluppatore per poter copiare gli ID interni.

    1. Fai clic su **User Settings** (icona a ingranaggio accanto al tuo avatar) → **Advanced** → attiva **Developer Mode**
    2. Fai clic destro sull'**icona del server** nella barra laterale → **Copy Server ID**
    3. Fai clic destro sul **tuo avatar** → **Copy User ID**

    Salva il tuo **Server ID** e **User ID** insieme al Bot Token: li invierai tutti e tre a OpenClaw nel passaggio successivo.

  </Step>

  <Step title="Consenti DM dai membri del server">
    Perché l'associazione funzioni, Discord deve consentire al bot di inviarti DM. Fai clic destro sull'**icona del server** → **Privacy Settings** → attiva **Direct Messages**.

    Questo consente ai membri del server (inclusi i bot) di inviarti DM. Mantieni questa opzione abilitata se vuoi usare i DM Discord con OpenClaw. Se prevedi di usare solo canali guild, puoi disabilitare i DM dopo l'associazione.

  </Step>

  <Step title="Imposta il token del bot in modo sicuro (non inviarlo in chat)">
    Il token del bot Discord è un segreto (come una password). Impostalo sulla macchina che esegue OpenClaw prima di inviare messaggi al tuo agente.

```bash
export DISCORD_BOT_TOKEN="YOUR_BOT_TOKEN"
cat > discord.patch.json5 <<'JSON5'
{
  channels: {
    discord: {
      enabled: true,
      token: { source: "env", provider: "default", id: "DISCORD_BOT_TOKEN" },
    },
  },
}
JSON5
openclaw config patch --file ./discord.patch.json5 --dry-run
openclaw config patch --file ./discord.patch.json5
openclaw gateway
```

    Se OpenClaw è già in esecuzione come servizio in background, riavvialo tramite l'app Mac di OpenClaw oppure arrestando e riavviando il processo `openclaw gateway run`.
    Per installazioni come servizio gestito, esegui `openclaw gateway install` da una shell in cui `DISCORD_BOT_TOKEN` è presente, oppure salva la variabile in `~/.openclaw/.env`, così il servizio potrà risolvere l'env SecretRef dopo il riavvio.
    Se il tuo host è bloccato o limitato da Discord durante la ricerca dell'applicazione all'avvio, imposta l'ID applicazione/client Discord dal Portale per sviluppatori, così l'avvio potrà saltare quella chiamata REST. Usa `channels.discord.applicationId` per l'account predefinito, oppure `channels.discord.accounts.<accountId>.applicationId` quando esegui più bot Discord.

  </Step>

  <Step title="Configura OpenClaw e associa">

    <Tabs>
      <Tab title="Chiedi al tuo agente">
        Chatta con il tuo agente OpenClaw su qualunque canale esistente (ad es. Telegram) e comunicaglielo. Se Discord è il tuo primo canale, usa invece la scheda CLI / configurazione.

        > "Ho già impostato il token del mio bot Discord nella configurazione. Completa la configurazione di Discord con User ID `<user_id>` e Server ID `<server_id>`."
      </Tab>
      <Tab title="CLI / configurazione">
        Se preferisci la configurazione basata su file, imposta:

```json5
{
  channels: {
    discord: {
      enabled: true,
      token: {
        source: "env",
        provider: "default",
        id: "DISCORD_BOT_TOKEN",
      },
    },
  },
}
```

        Fallback env per l'account predefinito:

```bash
DISCORD_BOT_TOKEN=...
```

        Per configurazioni scriptate o remote, scrivi lo stesso blocco JSON5 con `openclaw config patch --file ./discord.patch.json5 --dry-run` e poi riesegui senza `--dry-run`. I valori `token` in testo normale sono supportati. Anche i valori SecretRef sono supportati per `channels.discord.token` tra provider env/file/exec. Vedi [Gestione dei segreti](/it/gateway/secrets).

        Per più bot Discord, mantieni ogni token del bot e ID applicazione nel rispettivo account. Un `channels.discord.applicationId` di primo livello viene ereditato dagli account, quindi impostalo lì solo quando ogni account deve usare lo stesso ID applicazione.

```json5
{
  channels: {
    discord: {
      enabled: true,
      accounts: {
        personal: {
          token: { source: "env", provider: "default", id: "DISCORD_PERSONAL_TOKEN" },
          applicationId: "111111111111111111",
        },
        work: {
          token: { source: "env", provider: "default", id: "DISCORD_WORK_TOKEN" },
          applicationId: "222222222222222222",
        },
      },
    },
  },
}
```

      </Tab>
    </Tabs>

  </Step>

  <Step title="Approva la prima associazione via DM">
    Attendi finché il Gateway è in esecuzione, poi invia un DM al bot in Discord. Risponderà con un codice di associazione.

    <Tabs>
      <Tab title="Chiedi al tuo agente">
        Invia il codice di associazione al tuo agente sul canale esistente:

        > "Approva questo codice di associazione Discord: `<CODE>`"
      </Tab>
      <Tab title="CLI">

```bash
openclaw pairing list discord
openclaw pairing approve discord <CODE>
```

      </Tab>
    </Tabs>

    I codici di associazione scadono dopo 1 ora.

    Ora dovresti poter chattare con il tuo agente in Discord via DM.

  </Step>
</Steps>

<Note>
La risoluzione del token è consapevole dell'account. I valori del token nella configurazione prevalgono sul fallback env. `DISCORD_BOT_TOKEN` viene usato solo per l'account predefinito.
Se due account Discord abilitati si risolvono nello stesso token del bot, OpenClaw avvia un solo monitor Gateway per quel token. Un token proveniente dalla configurazione prevale sul fallback env predefinito; altrimenti vince il primo account abilitato e l'account duplicato viene indicato come disabilitato.
Per chiamate outbound avanzate (azioni dello strumento messaggio/canale), un `token` esplicito per chiamata viene usato per quella chiamata. Questo si applica alle azioni di invio e lettura/sonda (per esempio read/search/fetch/thread/pins/permissions). Le impostazioni di policy/retry dell'account continuano a provenire dall'account selezionato nello snapshot runtime attivo.
</Note>

## Consigliato: configura uno spazio di lavoro guild

Una volta che i DM funzionano, puoi configurare il server Discord come uno spazio di lavoro completo in cui ogni canale ottiene la propria sessione agente con il proprio contesto. Questo è consigliato per server privati dove ci sei solo tu e il tuo bot.

<Steps>
  <Step title="Aggiungi il server alla allowlist guild">
    Questo consente al tuo agente di rispondere in qualsiasi canale del server, non solo nei DM.

    <Tabs>
      <Tab title="Chiedi al tuo agente">
        > "Aggiungi il mio Discord Server ID `<server_id>` alla allowlist guild"
      </Tab>
      <Tab title="Configurazione">

```json5
{
  channels: {
    discord: {
      groupPolicy: "allowlist",
      guilds: {
        YOUR_SERVER_ID: {
          requireMention: true,
          users: ["YOUR_USER_ID"],
        },
      },
    },
  },
}
```

      </Tab>
    </Tabs>

  </Step>

  <Step title="Consenti risposte senza @mention">
    Per impostazione predefinita, il tuo agente risponde nei canali guild solo quando viene @menzionato. Per un server privato, probabilmente vuoi che risponda a ogni messaggio.

    Nei canali guild, le normali risposte finali dell'assistente restano private per impostazione predefinita. L'output Discord visibile deve essere inviato esplicitamente con lo strumento `message`, così l'agente può restare in ascolto per impostazione predefinita e pubblicare solo quando decide che una risposta nel canale è utile.

    <Tabs>
      <Tab title="Chiedi al tuo agente">
        > "Consenti al mio agente di rispondere su questo server senza dover essere @menzionato"
      </Tab>
      <Tab title="Configurazione">
        Imposta `requireMention: false` nella configurazione guild:

```json5
{
  channels: {
    discord: {
      guilds: {
        YOUR_SERVER_ID: {
          requireMention: false,
        },
      },
    },
  },
}
```

        Per ripristinare le risposte finali automatiche legacy per stanze di gruppo/canale, imposta `messages.groupChat.visibleReplies: "automatic"`.

      </Tab>
    </Tabs>

  </Step>

  <Step title="Pianifica la memoria nei canali guild">
    Per impostazione predefinita, la memoria a lungo termine (MEMORY.md) viene caricata solo nelle sessioni DM. I canali guild non caricano automaticamente MEMORY.md.

    <Tabs>
      <Tab title="Chiedi al tuo agente">
        > "Quando pongo domande nei canali Discord, usa memory_search o memory_get se ti serve contesto a lungo termine da MEMORY.md."
      </Tab>
      <Tab title="Manuale">
        Se ti serve un contesto condiviso in ogni canale, inserisci le istruzioni stabili in `AGENTS.md` o `USER.md` (vengono iniettate in ogni sessione). Mantieni le note a lungo termine in `MEMORY.md` e accedivi su richiesta con gli strumenti di memoria.
      </Tab>
    </Tabs>

  </Step>
</Steps>

Ora crea alcuni canali sul tuo server Discord e inizia a chattare. Il tuo agente può vedere il nome del canale e ogni canale ottiene la propria sessione isolata, quindi puoi configurare `#coding`, `#home`, `#research` o qualunque cosa si adatti al tuo flusso di lavoro.

## Modello runtime

- Gateway possiede la connessione Discord.
- L'instradamento delle risposte è deterministico: le risposte in ingresso da Discord tornano a Discord.
- I metadati di guild/canale Discord vengono aggiunti al prompt del modello come contesto non attendibile, non come prefisso di risposta visibile all'utente. Se un modello ricopia quell'involucro, OpenClaw rimuove i metadati copiati dalle risposte in uscita e dal futuro contesto di riproduzione.
- Per impostazione predefinita (`session.dmScope=main`), le chat dirette condividono la sessione principale dell'agente (`agent:main:main`).
- I canali della guild sono chiavi di sessione isolate (`agent:<agentId>:discord:channel:<channelId>`).
- I DM di gruppo vengono ignorati per impostazione predefinita (`channels.discord.dm.groupEnabled=false`).
- I comandi slash nativi vengono eseguiti in sessioni di comando isolate (`agent:<agentId>:discord:slash:<userId>`), pur mantenendo `CommandTargetSessionKey` verso la sessione di conversazione instradata.
- La consegna degli annunci cron/heartbeat solo testo a Discord usa una sola volta la risposta finale visibile all'assistente. I payload multimediali e dei componenti strutturati restano multi-messaggio quando l'agente emette più payload consegnabili.

## Canali forum

I canali forum e media Discord accettano solo post nei thread. OpenClaw supporta due modi per crearli:

- Invia un messaggio al forum padre (`channel:<forumId>`) per creare automaticamente un thread. Il titolo del thread usa la prima riga non vuota del tuo messaggio.
- Usa `openclaw message thread create` per creare direttamente un thread. Non passare `--message-id` per i canali forum.

Esempio: invia al forum padre per creare un thread

```bash
openclaw message send --channel discord --target channel:<forumId> \
  --message "Topic title\nBody of the post"
```

Esempio: crea esplicitamente un thread forum

```bash
openclaw message thread create --channel discord --target channel:<forumId> \
  --thread-name "Topic title" --message "Body of the post"
```

I forum padre non accettano componenti Discord. Se ti servono componenti, invia al thread stesso (`channel:<threadId>`).

## Componenti interattivi

OpenClaw supporta contenitori Discord components v2 per i messaggi degli agenti. Usa lo strumento messaggio con un payload `components`. I risultati dell'interazione vengono instradati di nuovo all'agente come normali messaggi in ingresso e seguono le impostazioni Discord `replyToMode` esistenti.

Blocchi supportati:

- `text`, `section`, `separator`, `actions`, `media-gallery`, `file`
- Le righe di azioni consentono fino a 5 pulsanti o un singolo menu di selezione
- Tipi di selezione: `string`, `user`, `role`, `mentionable`, `channel`

Per impostazione predefinita, i componenti sono monouso. Imposta `components.reusable=true` per consentire l'uso ripetuto di pulsanti, selezioni e moduli fino alla scadenza.

Per limitare chi può fare clic su un pulsante, imposta `allowedUsers` su quel pulsante (ID utente Discord, tag o `*`). Quando configurato, gli utenti non corrispondenti ricevono un rifiuto effimero.

I comandi slash `/model` e `/models` aprono un selettore interattivo del modello con menu a discesa per provider, modello e runtime compatibile, più un passaggio di invio. `/models add` è deprecato e ora restituisce un messaggio di deprecazione invece di registrare modelli dalla chat. La risposta del selettore è effimera e solo l'utente che l'ha invocata può usarla.

Allegati file:

- I blocchi `file` devono puntare a un riferimento allegato (`attachment://<filename>`)
- Fornisci l'allegato tramite `media`/`path`/`filePath` (file singolo); usa `media-gallery` per più file
- Usa `filename` per sovrascrivere il nome di caricamento quando deve corrispondere al riferimento allegato

Moduli modali:

- Aggiungi `components.modal` con un massimo di 5 campi
- Tipi di campo: `text`, `checkbox`, `radio`, `select`, `role-select`, `user-select`
- OpenClaw aggiunge automaticamente un pulsante di attivazione

Esempio:

```json5
{
  channel: "discord",
  action: "send",
  to: "channel:123456789012345678",
  message: "Optional fallback text",
  components: {
    reusable: true,
    text: "Choose a path",
    blocks: [
      {
        type: "actions",
        buttons: [
          {
            label: "Approve",
            style: "success",
            allowedUsers: ["123456789012345678"],
          },
          { label: "Decline", style: "danger" },
        ],
      },
      {
        type: "actions",
        select: {
          type: "string",
          placeholder: "Pick an option",
          options: [
            { label: "Option A", value: "a" },
            { label: "Option B", value: "b" },
          ],
        },
      },
    ],
    modal: {
      title: "Details",
      triggerLabel: "Open form",
      fields: [
        { type: "text", label: "Requester" },
        {
          type: "select",
          label: "Priority",
          options: [
            { label: "Low", value: "low" },
            { label: "High", value: "high" },
          ],
        },
      ],
    },
  },
}
```

## Controllo degli accessi e instradamento

<Tabs>
  <Tab title="DM policy">
    `channels.discord.dmPolicy` controlla l'accesso ai DM. `channels.discord.allowFrom` è l'allowlist canonica dei DM.

    - `pairing` (predefinito)
    - `allowlist`
    - `open` (richiede che `channels.discord.allowFrom` includa `"*"`)
    - `disabled`

    Se la policy DM non è aperta, gli utenti sconosciuti vengono bloccati (o viene richiesto loro l'abbinamento in modalità `pairing`).

    Precedenza multi-account:

    - `channels.discord.accounts.default.allowFrom` si applica solo all'account `default`.
    - Per un account, `allowFrom` ha precedenza sul legacy `dm.allowFrom`.
    - Gli account denominati ereditano `channels.discord.allowFrom` quando il proprio `allowFrom` e il legacy `dm.allowFrom` non sono impostati.
    - Gli account denominati non ereditano `channels.discord.accounts.default.allowFrom`.

    I legacy `channels.discord.dm.policy` e `channels.discord.dm.allowFrom` vengono ancora letti per compatibilità. `openclaw doctor --fix` li migra a `dmPolicy` e `allowFrom` quando può farlo senza modificare l'accesso.

    Formato destinazione DM per la consegna:

    - `user:<id>`
    - menzione `<@id>`

    Gli ID numerici semplici vengono normalmente risolti come ID canale quando è attivo un canale predefinito, ma gli ID elencati nell'`allowFrom` DM effettivo dell'account vengono trattati come destinazioni DM utente per compatibilità.

  </Tab>

  <Tab title="Guild policy">
    La gestione delle guild è controllata da `channels.discord.groupPolicy`:

    - `open`
    - `allowlist`
    - `disabled`

    La baseline sicura quando esiste `channels.discord` è `allowlist`.

    Comportamento di `allowlist`:

    - la guild deve corrispondere a `channels.discord.guilds` (`id` preferito, slug accettato)
    - allowlist facoltative dei mittenti: `users` (ID stabili consigliati) e `roles` (solo ID ruolo); se una delle due è configurata, i mittenti sono consentiti quando corrispondono a `users` OPPURE `roles`
    - la corrispondenza diretta di nome/tag è disabilitata per impostazione predefinita; abilita `channels.discord.dangerouslyAllowNameMatching: true` solo come modalità di compatibilità di emergenza
    - nomi/tag sono supportati per `users`, ma gli ID sono più sicuri; `openclaw security audit` avvisa quando vengono usate voci nome/tag
    - se una guild ha `channels` configurato, i canali non elencati vengono negati
    - se una guild non ha un blocco `channels`, tutti i canali in quella guild in allowlist sono consentiti

    Esempio:

```json5
{
  channels: {
    discord: {
      groupPolicy: "allowlist",
      guilds: {
        "123456789012345678": {
          requireMention: true,
          ignoreOtherMentions: true,
          users: ["987654321098765432"],
          roles: ["123456789012345678"],
          channels: {
            general: { allow: true },
            help: { allow: true, requireMention: true },
          },
        },
      },
    },
  },
}
```

    Se imposti solo `DISCORD_BOT_TOKEN` e non crei un blocco `channels.discord`, il fallback runtime è `groupPolicy="allowlist"` (con un avviso nei log), anche se `channels.defaults.groupPolicy` è `open`.

  </Tab>

  <Tab title="Mentions and group DMs">
    I messaggi delle guild richiedono una menzione per impostazione predefinita.

    Il rilevamento delle menzioni include:

    - menzione esplicita del bot
    - pattern di menzione configurati (`agents.list[].groupChat.mentionPatterns`, fallback `messages.groupChat.mentionPatterns`)
    - comportamento implicito di risposta al bot nei casi supportati

    `requireMention` è configurato per guild/canale (`channels.discord.guilds...`).
    `ignoreOtherMentions` scarta facoltativamente i messaggi che menzionano un altro utente/ruolo ma non il bot (escludendo @everyone/@here).

    DM di gruppo:

    - predefinito: ignorati (`dm.groupEnabled=false`)
    - allowlist facoltativa tramite `dm.groupChannels` (ID canale o slug)

  </Tab>
</Tabs>

### Instradamento agenti basato sui ruoli

Usa `bindings[].match.roles` per instradare i membri delle guild Discord verso agenti diversi in base all'ID ruolo. I binding basati sui ruoli accettano solo ID ruolo e vengono valutati dopo i binding peer o parent-peer e prima dei binding solo guild. Se un binding imposta anche altri campi di corrispondenza (per esempio `peer` + `guildId` + `roles`), tutti i campi configurati devono corrispondere.

```json5
{
  bindings: [
    {
      agentId: "opus",
      match: {
        channel: "discord",
        guildId: "123456789012345678",
        roles: ["111111111111111111"],
      },
    },
    {
      agentId: "sonnet",
      match: {
        channel: "discord",
        guildId: "123456789012345678",
      },
    },
  ],
}
```

## Comandi nativi e autorizzazione dei comandi

- `commands.native` è impostato su `"auto"` per impostazione predefinita ed è abilitato per Discord.
- Override per canale: `channels.discord.commands.native`.
- `commands.native=false` cancella esplicitamente i comandi nativi Discord registrati in precedenza.
- L'autorizzazione dei comandi nativi usa le stesse allowlist/policy Discord della normale gestione dei messaggi.
- I comandi possono essere comunque visibili nell'interfaccia Discord per gli utenti non autorizzati; l'esecuzione continua ad applicare l'autorizzazione OpenClaw e restituisce "non autorizzato".

Vedi [Comandi slash](/it/tools/slash-commands) per catalogo e comportamento dei comandi.

Impostazioni predefinite dei comandi slash:

- `ephemeral: true`

## Dettagli delle funzionalità

<AccordionGroup>
  <Accordion title="Reply tags and native replies">
    Discord supporta tag di risposta nell'output dell'agente:

    - `[[reply_to_current]]`
    - `[[reply_to:<id>]]`

    Controllato da `channels.discord.replyToMode`:

    - `off` (predefinito)
    - `first`
    - `all`
    - `batched`

    Nota: `off` disabilita il threading implicito delle risposte. I tag espliciti `[[reply_to_*]]` vengono comunque rispettati.
    `first` allega sempre il riferimento di risposta nativa implicita al primo messaggio Discord in uscita del turno.
    `batched` allega il riferimento di risposta nativa implicita di Discord solo quando il turno in ingresso era un batch con debounce di più messaggi. Questo è utile quando vuoi risposte native principalmente per chat a raffica ambigue, non per ogni turno a messaggio singolo.

    Gli ID messaggio vengono esposti in contesto/cronologia così gli agenti possono indirizzarsi a messaggi specifici.

  </Accordion>

  <Accordion title="Live stream preview">
    OpenClaw può trasmettere risposte bozza inviando un messaggio temporaneo e modificandolo man mano che arriva il testo. `channels.discord.streaming` accetta `off` (predefinito) | `partial` | `block` | `progress`. `progress` si mappa a `partial` su Discord; `streamMode` è un alias legacy e viene migrato automaticamente.

    Il valore predefinito resta `off` perché le modifiche di anteprima Discord raggiungono rapidamente i limiti di frequenza quando più bot o Gateway condividono un account.

```json5
{
  channels: {
    discord: {
      streaming: "block",
      draftChunk: {
        minChars: 200,
        maxChars: 800,
        breakPreference: "paragraph",
      },
    },
  },
}
```

    - `partial` modifica un singolo messaggio di anteprima man mano che arrivano i token.
    - `block` emette blocchi di dimensione bozza (usa `draftChunk` per regolare dimensione e punti di interruzione, limitati a `textChunkLimit`).
    - Finali multimediali, di errore e di risposta esplicita annullano le modifiche di anteprima in sospeso.
    - `streaming.preview.toolProgress` (predefinito `true`) controlla se gli aggiornamenti di strumento/avanzamento riusano il messaggio di anteprima.

    Lo streaming dell'anteprima è solo testo; le risposte multimediali ripiegano sulla consegna normale. Quando lo streaming `block` è abilitato esplicitamente, OpenClaw salta lo stream di anteprima per evitare il doppio streaming.

  </Accordion>

  <Accordion title="History, context, and thread behavior">
    Contesto cronologia della guild:

    - `channels.discord.historyLimit` predefinito `20`
    - fallback: `messages.groupChat.historyLimit`
    - `0` disabilita

    Controlli cronologia DM:

    - `channels.discord.dmHistoryLimit`
    - `channels.discord.dms["<user_id>"].historyLimit`

    Comportamento dei thread:

    - I thread di Discord vengono instradati come sessioni di canale ed ereditano la configurazione del canale padre salvo override.
    - Le sessioni thread ereditano la selezione `/model` a livello di sessione del canale padre come fallback solo per il modello; le selezioni `/model` locali al thread hanno comunque la precedenza e la cronologia della trascrizione del padre non viene copiata, a meno che l'ereditarietà della trascrizione non sia abilitata.
    - `channels.discord.thread.inheritParent` (predefinito `false`) consente ai nuovi auto-thread di inizializzarsi dalla trascrizione del padre. Gli override per account si trovano in `channels.discord.accounts.<id>.thread.inheritParent`.
    - Le reazioni degli strumenti di messaggistica possono risolvere destinazioni DM `user:<id>`.
    - `guilds.<guild>.channels.<channel>.requireMention: false` viene preservato durante il fallback di attivazione nella fase di risposta.

    Gli argomenti dei canali vengono iniettati come contesto **non attendibile**. Le allowlist regolano chi può attivare l'agente, non costituiscono un confine completo di redazione del contesto supplementare.

  </Accordion>

  <Accordion title="Sessioni vincolate al thread per subagenti">
    Discord può associare un thread a una destinazione di sessione, così i messaggi successivi in quel thread continuano a essere instradati alla stessa sessione (incluse le sessioni dei subagenti).

    Comandi:

    - `/focus <target>` associa il thread corrente/nuovo a una destinazione di subagente/sessione
    - `/unfocus` rimuove l'associazione del thread corrente
    - `/agents` mostra le esecuzioni attive e lo stato dell'associazione
    - `/session idle <duration|off>` ispeziona/aggiorna l'auto-unfocus per inattività per le associazioni focalizzate
    - `/session max-age <duration|off>` ispeziona/aggiorna l'età massima rigida per le associazioni focalizzate

    Configurazione:

```json5
{
  session: {
    threadBindings: {
      enabled: true,
      idleHours: 24,
      maxAgeHours: 0,
    },
  },
  channels: {
    discord: {
      threadBindings: {
        enabled: true,
        idleHours: 24,
        maxAgeHours: 0,
        spawnSubagentSessions: false, // opt-in
      },
    },
  },
}
```

    Note:

    - `session.threadBindings.*` imposta i valori predefiniti globali.
    - `channels.discord.threadBindings.*` sovrascrive il comportamento di Discord.
    - `spawnSubagentSessions` deve essere true per creare/associare automaticamente thread per `sessions_spawn({ thread: true })`.
    - `spawnAcpSessions` deve essere true per creare/associare automaticamente thread per ACP (`/acp spawn ... --thread ...` o `sessions_spawn({ runtime: "acp", thread: true })`).
    - Se le associazioni dei thread sono disabilitate per un account, `/focus` e le operazioni correlate di associazione dei thread non sono disponibili.

    Vedi [Sub-agenti](/it/tools/subagents), [Agenti ACP](/it/tools/acp-agents) e [Riferimento di configurazione](/it/gateway/configuration-reference).

  </Accordion>

  <Accordion title="Associazioni persistenti dei canali ACP">
    Per workspace ACP stabili "always-on", configura associazioni ACP tipizzate di primo livello rivolte alle conversazioni Discord.

    Percorso di configurazione:

    - `bindings[]` con `type: "acp"` e `match.channel: "discord"`

    Esempio:

```json5
{
  agents: {
    list: [
      {
        id: "codex",
        runtime: {
          type: "acp",
          acp: {
            agent: "codex",
            backend: "acpx",
            mode: "persistent",
            cwd: "/workspace/openclaw",
          },
        },
      },
    ],
  },
  bindings: [
    {
      type: "acp",
      agentId: "codex",
      match: {
        channel: "discord",
        accountId: "default",
        peer: { kind: "channel", id: "222222222222222222" },
      },
      acp: { label: "codex-main" },
    },
  ],
  channels: {
    discord: {
      guilds: {
        "111111111111111111": {
          channels: {
            "222222222222222222": {
              requireMention: false,
            },
          },
        },
      },
    },
  },
}
```

    Note:

    - `/acp spawn codex --bind here` associa il canale o thread corrente sul posto e mantiene i messaggi futuri sulla stessa sessione ACP. I messaggi del thread ereditano l'associazione del canale padre.
    - In un canale o thread associato, `/new` e `/reset` reimpostano la stessa sessione ACP sul posto. Le associazioni temporanee dei thread possono sovrascrivere la risoluzione della destinazione mentre sono attive.
    - `spawnAcpSessions` è richiesto solo quando OpenClaw deve creare/associare un thread figlio tramite `--thread auto|here`.

    Vedi [Agenti ACP](/it/tools/acp-agents) per i dettagli sul comportamento delle associazioni.

  </Accordion>

  <Accordion title="Notifiche di reazione">
    Modalità di notifica delle reazioni per guild:

    - `off`
    - `own` (predefinito)
    - `all`
    - `allowlist` (usa `guilds.<id>.users`)

    Gli eventi di reazione vengono trasformati in eventi di sistema e allegati alla sessione Discord instradata.

  </Accordion>

  <Accordion title="Reazioni di conferma">
    `ackReaction` invia un'emoji di conferma mentre OpenClaw elabora un messaggio in ingresso.

    Ordine di risoluzione:

    - `channels.discord.accounts.<accountId>.ackReaction`
    - `channels.discord.ackReaction`
    - `messages.ackReaction`
    - fallback all'emoji dell'identità dell'agente (`agents.list[].identity.emoji`, altrimenti "👀")

    Note:

    - Discord accetta emoji Unicode o nomi di emoji personalizzate.
    - Usa `""` per disabilitare la reazione per un canale o account.

  </Accordion>

  <Accordion title="Scritture di configurazione">
    Le scritture di configurazione avviate dal canale sono abilitate per impostazione predefinita.

    Questo influisce sui flussi `/config set|unset` (quando le funzionalità di comando sono abilitate).

    Disabilita:

```json5
{
  channels: {
    discord: {
      configWrites: false,
    },
  },
}
```

  </Accordion>

  <Accordion title="Proxy del Gateway">
    Instrada il traffico WebSocket del Gateway Discord e le ricerche REST di avvio (ID applicazione + risoluzione allowlist) tramite un proxy HTTP(S) con `channels.discord.proxy`.

```json5
{
  channels: {
    discord: {
      proxy: "http://proxy.example:8080",
    },
  },
}
```

    Override per account:

```json5
{
  channels: {
    discord: {
      accounts: {
        primary: {
          proxy: "http://proxy.example:8080",
        },
      },
    },
  },
}
```

  </Accordion>

  <Accordion title="Supporto PluralKit">
    Abilita la risoluzione PluralKit per mappare i messaggi proxied all'identità del membro del sistema:

```json5
{
  channels: {
    discord: {
      pluralkit: {
        enabled: true,
        token: "pk_live_...", // optional; needed for private systems
      },
    },
  },
}
```

    Note:

    - le allowlist possono usare `pk:<memberId>`
    - i nomi visualizzati dei membri vengono abbinati per nome/slug solo quando `channels.discord.dangerouslyAllowNameMatching: true`
    - le ricerche usano l'ID del messaggio originale e sono vincolate a una finestra temporale
    - se la ricerca non riesce, i messaggi proxied vengono trattati come messaggi bot e scartati, a meno che `allowBots=true`

  </Accordion>

  <Accordion title="Configurazione della presenza">
    Gli aggiornamenti della presenza vengono applicati quando imposti un campo di stato o attività, oppure quando abiliti la presenza automatica.

    Esempio di solo stato:

```json5
{
  channels: {
    discord: {
      status: "idle",
    },
  },
}
```

    Esempio di attività (lo stato personalizzato è il tipo di attività predefinito):

```json5
{
  channels: {
    discord: {
      activity: "Focus time",
      activityType: 4,
    },
  },
}
```

    Esempio di streaming:

```json5
{
  channels: {
    discord: {
      activity: "Live coding",
      activityType: 1,
      activityUrl: "https://twitch.tv/openclaw",
    },
  },
}
```

    Mappa dei tipi di attività:

    - 0: In gioco
    - 1: In streaming (richiede `activityUrl`)
    - 2: In ascolto
    - 3: Guardando
    - 4: Personalizzata (usa il testo dell'attività come stato; l'emoji è facoltativa)
    - 5: In competizione

    Esempio di presenza automatica (segnale di salute del runtime):

```json5
{
  channels: {
    discord: {
      autoPresence: {
        enabled: true,
        intervalMs: 30000,
        minUpdateIntervalMs: 15000,
        exhaustedText: "token exhausted",
      },
    },
  },
}
```

    La presenza automatica mappa la disponibilità del runtime allo stato Discord: healthy => online, degraded o unknown => idle, exhausted o unavailable => dnd. Override di testo facoltativi:

    - `autoPresence.healthyText`
    - `autoPresence.degradedText`
    - `autoPresence.exhaustedText` (supporta il placeholder `{reason}`)

  </Accordion>

  <Accordion title="Approvazioni in Discord">
    Discord supporta la gestione delle approvazioni basata su pulsanti nei DM e può facoltativamente pubblicare prompt di approvazione nel canale di origine.

    Percorso di configurazione:

    - `channels.discord.execApprovals.enabled`
    - `channels.discord.execApprovals.approvers` (facoltativo; ripiega su `commands.ownerAllowFrom` quando possibile)
    - `channels.discord.execApprovals.target` (`dm` | `channel` | `both`, predefinito: `dm`)
    - `agentFilter`, `sessionFilter`, `cleanupAfterResolve`

    Discord abilita automaticamente le approvazioni exec native quando `enabled` non è impostato o è `"auto"` e almeno un approvatore può essere risolto, da `execApprovals.approvers` o da `commands.ownerAllowFrom`. Discord non deduce approvatori exec da `allowFrom` del canale, `dm.allowFrom` legacy o `defaultTo` dei messaggi diretti. Imposta `enabled: false` per disabilitare esplicitamente Discord come client di approvazione nativo.

    Per comandi di gruppo sensibili riservati al proprietario, come `/diagnostics` e `/export-trajectory`, OpenClaw invia prompt di approvazione e risultati finali privatamente. Prova prima il DM Discord quando il proprietario che invoca dispone di una route proprietario Discord; se non è disponibile, ripiega sulla prima route proprietario disponibile da `commands.ownerAllowFrom`, come Telegram.

    Quando `target` è `channel` o `both`, il prompt di approvazione è visibile nel canale. Solo gli approvatori risolti possono usare i pulsanti; gli altri utenti ricevono un diniego effimero. I prompt di approvazione includono il testo del comando, quindi abilita la consegna nel canale solo in canali attendibili. Se l'ID del canale non può essere derivato dalla chiave di sessione, OpenClaw ripiega sulla consegna via DM.

    Discord visualizza anche i pulsanti di approvazione condivisi usati da altri canali chat. L'adapter Discord nativo aggiunge principalmente routing DM degli approvatori e fanout sul canale.
    Quando questi pulsanti sono presenti, sono la UX di approvazione primaria; OpenClaw
    dovrebbe includere un comando manuale `/approve` solo quando il risultato dello strumento indica
    che le approvazioni chat non sono disponibili o che l'approvazione manuale è l'unico percorso.
    Se il runtime di approvazione nativo Discord non è attivo, OpenClaw mantiene visibile il
    prompt deterministico locale `/approve <id> <decision>`. Se il
    runtime è attivo ma una scheda nativa non può essere consegnata ad alcuna destinazione,
    OpenClaw invia un avviso di fallback nella stessa chat con il comando `/approve`
    esatto dell'approvazione in sospeso.

    L'autenticazione Gateway e la risoluzione delle approvazioni seguono il contratto client Gateway condiviso (gli ID `plugin:` vengono risolti tramite `plugin.approval.resolve`; gli altri ID tramite `exec.approval.resolve`). Le approvazioni scadono dopo 30 minuti per impostazione predefinita.

    Vedi [Approvazioni exec](/it/tools/exec-approvals).

  </Accordion>
</AccordionGroup>

## Strumenti e gate delle azioni

Le azioni sui messaggi Discord includono azioni di messaggistica, amministrazione del canale, moderazione, presenza e metadati.

Esempi principali:

- messaggistica: `sendMessage`, `readMessages`, `editMessage`, `deleteMessage`, `threadReply`
- reazioni: `react`, `reactions`, `emojiList`
- moderazione: `timeout`, `kick`, `ban`
- presenza: `setPresence`

L'azione `event-create` accetta un parametro facoltativo `image` (URL o percorso di file locale) per impostare l'immagine di copertina dell'evento pianificato.

I gate delle azioni si trovano in `channels.discord.actions.*`.

Comportamento predefinito dei gate:

| Gruppo di azioni                                                                                                                                                         | Predefinito  |
| ------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ------------ |
| reactions, messages, threads, pins, polls, search, memberInfo, roleInfo, channelInfo, channels, voiceStatus, events, stickers, emojiUploads, stickerUploads, permissions | abilitato    |
| roles                                                                                                                                                                    | disabilitato |
| moderation                                                                                                                                                               | disabilitato |
| presence                                                                                                                                                                 | disabilitato |

## UI dei componenti v2

OpenClaw usa i componenti Discord v2 per le approvazioni exec e i marcatori tra contesti. Le azioni dei messaggi Discord possono anche accettare `components` per UI personalizzata (avanzato; richiede la costruzione di un payload di componenti tramite lo strumento discord), mentre i vecchi `embeds` restano disponibili ma non sono consigliati.

- `channels.discord.ui.components.accentColor` imposta il colore di accento usato dai contenitori dei componenti Discord (hex).
- Impostalo per account con `channels.discord.accounts.<id>.ui.components.accentColor`.
- Gli `embeds` vengono ignorati quando sono presenti componenti v2.

Esempio:

```json5
{
  channels: {
    discord: {
      ui: {
        components: {
          accentColor: "#5865F2",
        },
      },
    },
  },
}
```

## Voce

Discord ha due superfici vocali distinte: **canali vocali** in tempo reale (conversazioni continue) e **allegati di messaggi vocali** (il formato con anteprima a forma d'onda). Il Gateway supporta entrambi.

### Canali vocali

Checklist di configurazione:

1. Abilita Message Content Intent nel Discord Developer Portal.
2. Abilita Server Members Intent quando vengono usate allowlist di ruoli/utenti.
3. Invita il bot con gli ambiti `bot` e `applications.commands`.
4. Concedi Connect, Speak, Send Messages e Read Message History nel canale vocale di destinazione.
5. Abilita i comandi nativi (`commands.native` o `channels.discord.commands.native`).
6. Configura `channels.discord.voice`.

Usa `/vc join|leave|status` per controllare le sessioni. Il comando usa l'agent predefinito dell'account e segue le stesse regole di allowlist e policy di gruppo degli altri comandi Discord.

```bash
/vc join channel:<voice-channel-id>
/vc status
/vc leave
```

Esempio di accesso automatico:

```json5
{
  channels: {
    discord: {
      voice: {
        enabled: true,
        model: "openai/gpt-5.4-mini",
        autoJoin: [
          {
            guildId: "123456789012345678",
            channelId: "234567890123456789",
          },
        ],
        daveEncryption: true,
        decryptionFailureTolerance: 24,
        tts: {
          provider: "openai",
          openai: { voice: "onyx" },
        },
      },
    },
  },
}
```

Note:

- `voice.tts` sovrascrive `messages.tts` solo per la riproduzione vocale.
- `voice.model` sovrascrive l'LLM usato solo per le risposte dei canali vocali Discord. Lascialo non impostato per ereditare il modello dell'agent instradato.
- STT usa `tools.media.audio`; `voice.model` non influisce sulla trascrizione.
- I turni di trascrizione vocale derivano lo stato owner da `allowFrom` di Discord (o `dm.allowFrom`); i parlanti non owner non possono accedere agli strumenti riservati all'owner (per esempio `gateway` e `cron`).
- La voce è abilitata per impostazione predefinita; imposta `channels.discord.voice.enabled=false` per disabilitare il runtime vocale e l'intent Gateway `GuildVoiceStates`.
- `channels.discord.intents.voiceStates` può sovrascrivere esplicitamente la sottoscrizione all'intent degli stati vocali. Lascialo non impostato affinché l'intent segua `voice.enabled`.
- `voice.daveEncryption` e `voice.decryptionFailureTolerance` vengono passati alle opzioni di join di `@discordjs/voice`.
- I valori predefiniti di `@discordjs/voice` sono `daveEncryption=true` e `decryptionFailureTolerance=24` se non impostati.
- OpenClaw monitora anche gli errori di decifratura in ricezione e recupera automaticamente uscendo e rientrando nel canale vocale dopo errori ripetuti in una finestra breve.
- Se i log di ricezione mostrano ripetutamente `DecryptionFailed(UnencryptedWhenPassthroughDisabled)` dopo l'aggiornamento, raccogli un report sulle dipendenze e i log. La linea `@discordjs/voice` inclusa contiene la correzione upstream del padding dalla PR discord.js #11449, che ha chiuso l'issue discord.js #11419.

Pipeline dei canali vocali:

- L'acquisizione PCM di Discord viene convertita in un file temporaneo WAV.
- `tools.media.audio` gestisce STT, per esempio `openai/gpt-4o-mini-transcribe`.
- La trascrizione viene inviata tramite il normale ingresso e routing Discord.
- `voice.model`, quando impostato, sovrascrive solo l'LLM di risposta per questo turno del canale vocale.
- `voice.tts` viene unito sopra `messages.tts`; l'audio risultante viene riprodotto nel canale in cui è stato effettuato il join.

Le credenziali vengono risolte per componente: autenticazione della route LLM per `voice.model`, autenticazione STT per `tools.media.audio` e autenticazione TTS per `messages.tts`/`voice.tts`.

### Messaggi vocali

I messaggi vocali Discord mostrano un'anteprima a forma d'onda e richiedono audio OGG/Opus. OpenClaw genera automaticamente la forma d'onda, ma richiede `ffmpeg` e `ffprobe` sull'host del Gateway per ispezionare e convertire.

- Fornisci un **percorso di file locale** (gli URL vengono rifiutati).
- Ometti il contenuto testuale (Discord rifiuta testo + messaggio vocale nello stesso payload).
- Qualsiasi formato audio è accettato; OpenClaw converte in OGG/Opus secondo necessità.

```bash
message(action="send", channel="discord", target="channel:123", path="/path/to/audio.mp3", asVoice=true)
```

## Risoluzione dei problemi

<AccordionGroup>
  <Accordion title="Intent non consentiti usati o il bot non vede messaggi della gilda">

    - abilita Message Content Intent
    - abilita Server Members Intent quando dipendi dalla risoluzione di utenti/membri
    - riavvia il Gateway dopo aver modificato gli intent

  </Accordion>

  <Accordion title="Messaggi della gilda bloccati in modo imprevisto">

    - verifica `groupPolicy`
    - verifica l'allowlist della gilda sotto `channels.discord.guilds`
    - se esiste la mappa `channels` della gilda, sono consentiti solo i canali elencati
    - verifica il comportamento di `requireMention` e i pattern di menzione

    Controlli utili:

```bash
openclaw doctor
openclaw channels status --probe
openclaw logs --follow
```

  </Accordion>

  <Accordion title="Require mention false ma ancora bloccato">
    Cause comuni:

    - `groupPolicy="allowlist"` senza allowlist di gilda/canale corrispondente
    - `requireMention` configurato nel posto sbagliato (deve stare sotto `channels.discord.guilds` o nella voce del canale)
    - mittente bloccato dall'allowlist `users` di gilda/canale

  </Accordion>

  <Accordion title="Turni Discord di lunga durata o risposte duplicate">

    Log tipici:

    - `Slow listener detected ...`
    - `stuck session: sessionKey=agent:...:discord:... state=processing ...`

    Manopole della coda del Gateway Discord:

    - account singolo: `channels.discord.eventQueue.listenerTimeout`
    - account multiplo: `channels.discord.accounts.<accountId>.eventQueue.listenerTimeout`
    - questo controlla solo il lavoro del listener del Gateway Discord, non la durata del turno dell'agent

    Discord non applica un timeout di proprietà del canale ai turni dell'agent in coda. I listener dei messaggi passano subito il controllo e le esecuzioni Discord in coda preservano l'ordinamento per sessione finché il ciclo di vita di sessione/strumento/runtime completa o interrompe il lavoro.

```json5
{
  channels: {
    discord: {
      accounts: {
        default: {
          eventQueue: {
            listenerTimeout: 120000,
          },
        },
      },
    },
  },
}
```

  </Accordion>

  <Accordion title="Avvisi di timeout nella ricerca dei metadati del Gateway">
    OpenClaw recupera i metadati Discord `/gateway/bot` prima della connessione. Gli errori transitori ripiegano sull'URL Gateway predefinito di Discord e sono limitati nei log.

    Manopole di timeout dei metadati:

    - account singolo: `channels.discord.gatewayInfoTimeoutMs`
    - account multiplo: `channels.discord.accounts.<accountId>.gatewayInfoTimeoutMs`
    - fallback env quando la configurazione non è impostata: `OPENCLAW_DISCORD_GATEWAY_INFO_TIMEOUT_MS`
    - predefinito: `30000` (30 secondi), massimo: `120000`

  </Accordion>

  <Accordion title="Mancate corrispondenze nell'audit dei permessi">
    I controlli dei permessi di `channels status --probe` funzionano solo per ID di canale numerici.

    Se usi chiavi slug, la corrispondenza runtime può comunque funzionare, ma la probe non può verificare completamente i permessi.

  </Accordion>

  <Accordion title="Problemi con DM e pairing">

    - DM disabilitato: `channels.discord.dm.enabled=false`
    - policy DM disabilitata: `channels.discord.dmPolicy="disabled"` (legacy: `channels.discord.dm.policy`)
    - approvazione di pairing in attesa in modalità `pairing`

  </Accordion>

  <Accordion title="Loop da bot a bot">
    Per impostazione predefinita i messaggi scritti da bot vengono ignorati.

    Se imposti `channels.discord.allowBots=true`, usa regole rigide di menzione e allowlist per evitare comportamenti di loop.
    Preferisci `channels.discord.allowBots="mentions"` per accettare solo messaggi dei bot che menzionano il bot.

  </Accordion>

  <Accordion title="STT vocale perde audio con DecryptionFailed(...)">

    - mantieni OpenClaw aggiornato (`openclaw update`) affinché sia presente la logica di recupero della ricezione vocale Discord
    - conferma `channels.discord.voice.daveEncryption=true` (predefinito)
    - parti da `channels.discord.voice.decryptionFailureTolerance=24` (predefinito upstream) e regola solo se necessario
    - osserva i log per:
      - `discord voice: DAVE decrypt failures detected`
      - `discord voice: repeated decrypt failures; attempting rejoin`
    - se gli errori continuano dopo il rientro automatico, raccogli i log e confrontali con la cronologia upstream della ricezione DAVE in [discord.js #11419](https://github.com/discordjs/discord.js/issues/11419) e [discord.js #11449](https://github.com/discordjs/discord.js/pull/11449)

  </Accordion>
</AccordionGroup>

## Riferimento di configurazione

Riferimento principale: [Riferimento di configurazione - Discord](/it/gateway/config-channels#discord).

<Accordion title="Campi Discord ad alto segnale">

- avvio/autenticazione: `enabled`, `token`, `accounts.*`, `allowBots`
- policy: `groupPolicy`, `dm.*`, `guilds.*`, `guilds.*.channels.*`
- comando: `commands.native`, `commands.useAccessGroups`, `configWrites`, `slashCommand.*`
- coda eventi: `eventQueue.listenerTimeout` (budget del listener), `eventQueue.maxQueueSize`, `eventQueue.maxConcurrency`
- metadati Gateway: `gatewayInfoTimeoutMs`
- risposta/cronologia: `replyToMode`, `historyLimit`, `dmHistoryLimit`, `dms.*.historyLimit`
- consegna: `textChunkLimit`, `chunkMode`, `maxLinesPerMessage`
- streaming: `streaming` (alias legacy: `streamMode`), `streaming.preview.toolProgress`, `draftChunk`, `blockStreaming`, `blockStreamingCoalesce`
- media/riprova: `mediaMaxMb` (limita gli upload Discord in uscita, predefinito `100MB`), `retry`
- azioni: `actions.*`
- presenza: `activity`, `status`, `activityType`, `activityUrl`
- UI: `ui.components.accentColor`
- funzionalità: `threadBindings`, `bindings[]` di primo livello (`type: "acp"`), `pluralkit`, `execApprovals`, `intents`, `agentComponents`, `heartbeat`, `responsePrefix`

</Accordion>

## Sicurezza e operazioni

- Tratta i token dei bot come segreti (`DISCORD_BOT_TOKEN` preferito in ambienti supervisionati).
- Concedi i permessi Discord con il privilegio minimo.
- Se distribuzione/stato dei comandi è obsoleto, riavvia il Gateway e ricontrolla con `openclaw channels status --probe`.

## Correlati

<CardGroup cols={2}>
  <Card title="Associazione" icon="link" href="/it/channels/pairing">
    Associa un utente Discord al Gateway.
  </Card>
  <Card title="Gruppi" icon="users" href="/it/channels/groups">
    Comportamento delle chat di gruppo e della lista consentita.
  </Card>
  <Card title="Routing dei canali" icon="route" href="/it/channels/channel-routing">
    Instrada i messaggi in ingresso agli agenti.
  </Card>
  <Card title="Sicurezza" icon="shield" href="/it/gateway/security">
    Modello di minaccia e rafforzamento.
  </Card>
  <Card title="Routing multi-agente" icon="sitemap" href="/it/concepts/multi-agent">
    Associa gilde e canali agli agenti.
  </Card>
  <Card title="Comandi slash" icon="terminal" href="/it/tools/slash-commands">
    Comportamento dei comandi nativi.
  </Card>
</CardGroup>
