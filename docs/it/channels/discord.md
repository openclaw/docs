---
read_when:
    - Lavorare sulle funzionalità del canale Discord
summary: Stato del supporto, funzionalità e configurazione del bot Discord
title: Discord
x-i18n:
    generated_at: "2026-05-07T13:13:08Z"
    model: gpt-5.5
    provider: openai
    source_hash: 805a093452b7af1c844919cdf776d898c6fd39f63f1bf363967dd471842eebd5
    source_path: channels/discord.md
    workflow: 16
---

Pronto per DM e canali di gilda tramite il Gateway Discord ufficiale.

<CardGroup cols={3}>
  <Card title="Abbinamento" icon="link" href="/it/channels/pairing">
    I DM di Discord usano per impostazione predefinita la modalità di abbinamento.
  </Card>
  <Card title="Comandi slash" icon="terminal" href="/it/tools/slash-commands">
    Comportamento nativo dei comandi e catalogo dei comandi.
  </Card>
  <Card title="Risoluzione dei problemi dei canali" icon="wrench" href="/it/channels/troubleshooting">
    Diagnostica multi-canale e flusso di riparazione.
  </Card>
</CardGroup>

## Configurazione rapida

Dovrai creare una nuova applicazione con un bot, aggiungere il bot al tuo server e abbinarlo a OpenClaw. Consigliamo di aggiungere il bot al tuo server privato. Se non ne hai ancora uno, [creane prima uno](https://support.discord.com/hc/en-us/articles/204849977-How-do-I-create-a-server) (scegli **Create My Own > For me and my friends**).

<Steps>
  <Step title="Crea un'applicazione Discord e un bot">
    Vai al [Discord Developer Portal](https://discord.com/developers/applications) e fai clic su **New Application**. Dagli un nome come "OpenClaw".

    Fai clic su **Bot** nella barra laterale. Imposta **Username** sul nome che usi per il tuo agente OpenClaw.

  </Step>

  <Step title="Abilita gli intent privilegiati">
    Sempre nella pagina **Bot**, scorri verso il basso fino a **Privileged Gateway Intents** e abilita:

    - **Message Content Intent** (obbligatorio)
    - **Server Members Intent** (consigliato; obbligatorio per allowlist dei ruoli e corrispondenza nome-ID)
    - **Presence Intent** (facoltativo; necessario solo per gli aggiornamenti di presenza)

  </Step>

  <Step title="Copia il token del bot">
    Scorri di nuovo verso l'alto nella pagina **Bot** e fai clic su **Reset Token**.

    <Note>
    Nonostante il nome, questo genera il tuo primo token: non viene "reimpostato" nulla.
    </Note>

    Copia il token e salvalo da qualche parte. Questo è il tuo **Bot Token** e ti servirà tra poco.

  </Step>

  <Step title="Genera un URL di invito e aggiungi il bot al tuo server">
    Fai clic su **OAuth2** nella barra laterale. Genererai un URL di invito con le autorizzazioni corrette per aggiungere il bot al tuo server.

    Scorri verso il basso fino a **OAuth2 URL Generator** e abilita:

    - `bot`
    - `applications.commands`

    Sotto comparirà una sezione **Bot Permissions**. Abilita almeno:

    **General Permissions**
      - View Channels
    **Text Permissions**
      - Send Messages
      - Read Message History
      - Embed Links
      - Attach Files
      - Add Reactions (facoltativo)

    Questo è l'insieme di base per i normali canali di testo. Se prevedi di pubblicare nei thread di Discord, inclusi flussi di lavoro di canali forum o multimediali che creano o continuano un thread, abilita anche **Send Messages in Threads**.
    Copia l'URL generato in fondo, incollalo nel browser, seleziona il tuo server e fai clic su **Continue** per connettere. Ora dovresti vedere il tuo bot nel server Discord.

  </Step>

  <Step title="Abilita la Modalità sviluppatore e raccogli i tuoi ID">
    Nell'app Discord, devi abilitare la Modalità sviluppatore per poter copiare gli ID interni.

    1. Fai clic su **User Settings** (icona a forma di ingranaggio accanto al tuo avatar) → **Advanced** → attiva **Developer Mode**
    2. Fai clic con il pulsante destro sulla tua **icona del server** nella barra laterale → **Copy Server ID**
    3. Fai clic con il pulsante destro sul tuo **avatar** → **Copy User ID**

    Salva il tuo **Server ID** e il tuo **User ID** insieme al Bot Token: invierai tutti e tre a OpenClaw nel passaggio successivo.

  </Step>

  <Step title="Consenti i DM dai membri del server">
    Per far funzionare l'abbinamento, Discord deve consentire al tuo bot di inviarti DM. Fai clic con il pulsante destro sulla tua **icona del server** → **Privacy Settings** → attiva **Direct Messages**.

    Questo permette ai membri del server (inclusi i bot) di inviarti DM. Mantieni questa opzione abilitata se vuoi usare i DM di Discord con OpenClaw. Se prevedi di usare solo i canali di gilda, puoi disabilitare i DM dopo l'abbinamento.

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

    Se OpenClaw è già in esecuzione come servizio in background, riavvialo tramite l'app OpenClaw per Mac oppure arrestando e riavviando il processo `openclaw gateway run`.
    Per le installazioni come servizio gestito, esegui `openclaw gateway install` da una shell in cui `DISCORD_BOT_TOKEN` è presente, oppure memorizza la variabile in `~/.openclaw/.env`, così il servizio può risolvere il SecretRef dell'env dopo il riavvio.
    Se il tuo host è bloccato o soggetto a limiti di frequenza dalla ricerca dell'applicazione all'avvio di Discord, imposta l'ID applicazione/client Discord dal Developer Portal così l'avvio può saltare quella chiamata REST. Usa `channels.discord.applicationId` per l'account predefinito, oppure `channels.discord.accounts.<accountId>.applicationId` quando esegui più bot Discord.

  </Step>

  <Step title="Configura OpenClaw ed esegui l'abbinamento">

    <Tabs>
      <Tab title="Chiedi al tuo agente">
        Chatta con il tuo agente OpenClaw su qualsiasi canale esistente (ad es. Telegram) e comunicaglielo. Se Discord è il tuo primo canale, usa invece la scheda CLI / config.

        > "Ho già impostato il token del mio bot Discord nella configurazione. Completa la configurazione di Discord con User ID `<user_id>` e Server ID `<server_id>`."
      </Tab>
      <Tab title="CLI / config">
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

        Per configurazioni tramite script o remote, scrivi lo stesso blocco JSON5 con `openclaw config patch --file ./discord.patch.json5 --dry-run` e poi riesegui senza `--dry-run`. I valori `token` in testo normale sono supportati. Anche i valori SecretRef sono supportati per `channels.discord.token` tra provider env/file/exec. Vedi [Gestione dei segreti](/it/gateway/secrets).

        Per più bot Discord, tieni ogni token bot e ID applicazione sotto il relativo account. Un `channels.discord.applicationId` di primo livello viene ereditato dagli account, quindi impostalo lì solo quando ogni account deve usare lo stesso ID applicazione.

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

  <Step title="Approva il primo abbinamento DM">
    Attendi che il Gateway sia in esecuzione, quindi invia un DM al tuo bot in Discord. Risponderà con un codice di abbinamento.

    <Tabs>
      <Tab title="Chiedi al tuo agente">
        Invia il codice di abbinamento al tuo agente sul tuo canale esistente:

        > "Approva questo codice di abbinamento Discord: `<CODE>`"
      </Tab>
      <Tab title="CLI">

```bash
openclaw pairing list discord
openclaw pairing approve discord <CODE>
```

      </Tab>
    </Tabs>

    I codici di abbinamento scadono dopo 1 ora.

    Ora dovresti poter chattare con il tuo agente in Discord tramite DM.

  </Step>
</Steps>

<Note>
La risoluzione del token è consapevole dell'account. I valori token della configurazione prevalgono sul fallback env. `DISCORD_BOT_TOKEN` viene usato solo per l'account predefinito.
Se due account Discord abilitati risolvono allo stesso token bot, OpenClaw avvia un solo monitor del Gateway per quel token. Un token proveniente dalla configurazione prevale sul fallback env predefinito; altrimenti vince il primo account abilitato e l'account duplicato viene segnalato come disabilitato.
Per le chiamate in uscita avanzate (azioni dello strumento messaggio/canale), viene usato un `token` esplicito per chiamata. Questo si applica alle azioni di invio e di tipo lettura/prova (ad esempio read/search/fetch/thread/pins/permissions). Le impostazioni di policy/riprova dell'account provengono comunque dall'account selezionato nello snapshot runtime attivo.
</Note>

## Consigliato: configura uno spazio di lavoro di gilda

Una volta che i DM funzionano, puoi configurare il tuo server Discord come spazio di lavoro completo in cui ogni canale ottiene la propria sessione agente con il proprio contesto. Questo è consigliato per server privati in cui ci siete solo tu e il tuo bot.

<Steps>
  <Step title="Aggiungi il tuo server all'allowlist della gilda">
    Questo permette al tuo agente di rispondere in qualsiasi canale del tuo server, non solo nei DM.

    <Tabs>
      <Tab title="Chiedi al tuo agente">
        > "Aggiungi il mio Server ID Discord `<server_id>` all'allowlist della gilda"
      </Tab>
      <Tab title="Config">

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

  <Step title="Consenti risposte senza @menzione">
    Per impostazione predefinita, il tuo agente risponde nei canali di gilda solo quando viene @menzionato. Per un server privato, probabilmente vuoi che risponda a ogni messaggio.

    Nei canali di gilda, le normali risposte finali dell'assistente restano private per impostazione predefinita. L'output Discord visibile deve essere inviato esplicitamente con lo strumento `message`, così l'agente può restare in ascolto per impostazione predefinita e pubblicare solo quando decide che una risposta nel canale è utile.

    Questo significa che il modello selezionato deve chiamare gli strumenti in modo affidabile. Se Discord mostra che sta digitando e i log mostrano l'uso di token ma non viene pubblicato alcun messaggio, controlla il log della sessione per testo dell'assistente con `didSendViaMessagingTool: false`. Significa che il modello ha prodotto una risposta finale privata invece di chiamare `message(action=send)`. Passa a un modello più forte nella chiamata agli strumenti, oppure usa la configurazione sotto per ripristinare le risposte finali automatiche legacy.

    <Tabs>
      <Tab title="Chiedi al tuo agente">
        > "Consenti al mio agente di rispondere su questo server senza dover essere @menzionato"
      </Tab>
      <Tab title="Config">
        Imposta `requireMention: false` nella configurazione della gilda:

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

        Per ripristinare le risposte finali automatiche legacy per stanze gruppo/canale, imposta `messages.groupChat.visibleReplies: "automatic"`.

      </Tab>
    </Tabs>

  </Step>

  <Step title="Pianifica la memoria nei canali di gilda">
    Per impostazione predefinita, la memoria a lungo termine (MEMORY.md) viene caricata solo nelle sessioni DM. I canali di gilda non caricano automaticamente MEMORY.md.

    <Tabs>
      <Tab title="Chiedi al tuo agente">
        > "Quando faccio domande nei canali Discord, usa memory_search o memory_get se ti serve contesto a lungo termine da MEMORY.md."
      </Tab>
      <Tab title="Manuale">
        Se ti serve contesto condiviso in ogni canale, inserisci le istruzioni stabili in `AGENTS.md` o `USER.md` (vengono iniettate in ogni sessione). Mantieni le note a lungo termine in `MEMORY.md` e accedivi su richiesta con gli strumenti di memoria.
      </Tab>
    </Tabs>

  </Step>
</Steps>

Ora crea alcuni canali sul tuo server Discord e inizia a chattare. Il tuo agente può vedere il nome del canale e ogni canale ottiene la propria sessione isolata, quindi puoi configurare `#coding`, `#home`, `#research` o qualunque cosa si adatti al tuo flusso di lavoro.

## Modello runtime

- Gateway gestisce la connessione Discord.
- L'instradamento delle risposte è deterministico: le risposte in ingresso da Discord tornano a Discord.
- I metadati di guild/canale Discord vengono aggiunti al prompt del modello come contesto non attendibile, non come prefisso di risposta visibile all'utente. Se un modello copia quell'involucro nella risposta, OpenClaw rimuove i metadati copiati dalle risposte in uscita e dal contesto di riproduzione futuro.
- Per impostazione predefinita (`session.dmScope=main`), le chat dirette condividono la sessione principale dell'agente (`agent:main:main`).
- I canali delle guild sono chiavi di sessione isolate (`agent:<agentId>:discord:channel:<channelId>`).
- I DM di gruppo vengono ignorati per impostazione predefinita (`channels.discord.dm.groupEnabled=false`).
- I comandi slash nativi vengono eseguiti in sessioni di comando isolate (`agent:<agentId>:discord:slash:<userId>`), pur continuando a trasportare `CommandTargetSessionKey` verso la sessione di conversazione instradata.
- La consegna degli annunci cron/heartbeat solo testo a Discord usa una sola volta la risposta finale visibile all'assistente. I payload multimediali e dei componenti strutturati rimangono multi-messaggio quando l'agente emette più payload consegnabili.

## Canali forum

I canali forum e media di Discord accettano solo post in thread. OpenClaw supporta due modi per crearli:

- Invia un messaggio al forum padre (`channel:<forumId>`) per creare automaticamente un thread. Il titolo del thread usa la prima riga non vuota del messaggio.
- Usa `openclaw message thread create` per creare direttamente un thread. Non passare `--message-id` per i canali forum.

Esempio: invio al forum padre per creare un thread

```bash
openclaw message send --channel discord --target channel:<forumId> \
  --message "Topic title\nBody of the post"
```

Esempio: creazione esplicita di un thread forum

```bash
openclaw message thread create --channel discord --target channel:<forumId> \
  --thread-name "Topic title" --message "Body of the post"
```

I forum padre non accettano componenti Discord. Se ti servono componenti, invia al thread stesso (`channel:<threadId>`).

## Componenti interattivi

OpenClaw supporta contenitori di componenti Discord v2 per i messaggi dell'agente. Usa lo strumento di messaggistica con un payload `components`. I risultati delle interazioni vengono instradati di nuovo all'agente come normali messaggi in ingresso e seguono le impostazioni Discord `replyToMode` esistenti.

Blocchi supportati:

- `text`, `section`, `separator`, `actions`, `media-gallery`, `file`
- Le righe di azioni consentono fino a 5 pulsanti o un singolo menu di selezione
- Tipi di selezione: `string`, `user`, `role`, `mentionable`, `channel`

Per impostazione predefinita, i componenti sono monouso. Imposta `components.reusable=true` per consentire l'uso ripetuto di pulsanti, selezioni e moduli fino alla loro scadenza.

Per limitare chi può fare clic su un pulsante, imposta `allowedUsers` su quel pulsante (ID utente Discord, tag o `*`). Quando configurato, gli utenti non corrispondenti ricevono un rifiuto effimero.

I comandi slash `/model` e `/models` aprono un selettore interattivo di modelli con menu a discesa per provider, modello e runtime compatibile, più un passaggio di invio. `/models add` è deprecato e ora restituisce un messaggio di deprecazione invece di registrare modelli dalla chat. La risposta del selettore è effimera e solo l'utente che l'ha invocata può usarla.

Allegati file:

- I blocchi `file` devono puntare a un riferimento di allegato (`attachment://<filename>`)
- Fornisci l'allegato tramite `media`/`path`/`filePath` (singolo file); usa `media-gallery` per più file
- Usa `filename` per sovrascrivere il nome di caricamento quando deve corrispondere al riferimento dell'allegato

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
    `channels.discord.dmPolicy` controlla l'accesso ai DM. `channels.discord.allowFrom` è la allowlist canonica dei DM.

    - `pairing` (predefinito)
    - `allowlist`
    - `open` (richiede che `channels.discord.allowFrom` includa `"*"`)
    - `disabled`

    Se la policy DM non è aperta, gli utenti sconosciuti vengono bloccati (o invitati ad effettuare il pairing in modalità `pairing`).

    Precedenza multi-account:

    - `channels.discord.accounts.default.allowFrom` si applica solo all'account `default`.
    - Per un account, `allowFrom` ha la precedenza sul vecchio `dm.allowFrom`.
    - Gli account denominati ereditano `channels.discord.allowFrom` quando il proprio `allowFrom` e il vecchio `dm.allowFrom` non sono impostati.
    - Gli account denominati non ereditano `channels.discord.accounts.default.allowFrom`.

    Le vecchie opzioni `channels.discord.dm.policy` e `channels.discord.dm.allowFrom` vengono ancora lette per compatibilità. `openclaw doctor --fix` le migra a `dmPolicy` e `allowFrom` quando può farlo senza modificare l'accesso.

    Formato target DM per la consegna:

    - `user:<id>`
    - menzione `<@id>`

    Gli ID numerici semplici normalmente vengono risolti come ID canale quando è attivo un canale predefinito, ma gli ID elencati nell'`allowFrom` DM effettivo dell'account vengono trattati come target DM utente per compatibilità.

  </Tab>

  <Tab title="DM access groups">
    I DM Discord possono usare voci dinamiche `accessGroup:<name>` in `channels.discord.allowFrom`.

    I nomi dei gruppi di accesso sono condivisi tra i canali di messaggistica. Usa `type: "message.senders"` per un gruppo statico i cui membri sono espressi nella normale sintassi `allowFrom` di ciascun canale, oppure `type: "discord.channelAudience"` quando l'audience `ViewChannel` corrente di un canale Discord deve definire dinamicamente l'appartenenza. Il comportamento condiviso dei gruppi di accesso è documentato qui: [Gruppi di accesso](/it/channels/access-groups).

```json5
{
  accessGroups: {
    operators: {
      type: "message.senders",
      members: {
        "*": ["global-owner-id"],
        discord: ["discord:123456789012345678"],
        telegram: ["987654321"],
      },
    },
  },
  channels: {
    discord: {
      dmPolicy: "allowlist",
      allowFrom: ["accessGroup:operators"],
    },
  },
}
```

    Un canale testuale Discord non ha un elenco membri separato. `type: "discord.channelAudience"` modella l'appartenenza così: il mittente del DM è membro della guild configurata e al momento dispone dell'autorizzazione effettiva `ViewChannel` sul canale configurato dopo l'applicazione delle sovrascritture di ruolo e canale.

    Esempio: consenti a chiunque possa vedere `#maintainers` di inviare DM al bot, mantenendo i DM chiusi a tutti gli altri.

```json5
{
  accessGroups: {
    maintainers: {
      type: "discord.channelAudience",
      guildId: "1456350064065904867",
      channelId: "1456744319972282449",
      membership: "canViewChannel",
    },
  },
  channels: {
    discord: {
      dmPolicy: "allowlist",
      allowFrom: ["accessGroup:maintainers"],
    },
  },
}
```

    Puoi combinare voci dinamiche e statiche:

```json5
{
  accessGroups: {
    maintainers: {
      type: "discord.channelAudience",
      guildId: "1456350064065904867",
      channelId: "1456744319972282449",
    },
  },
  channels: {
    discord: {
      dmPolicy: "allowlist",
      allowFrom: ["accessGroup:maintainers", "discord:123456789012345678"],
    },
  },
}
```

    Le ricerche falliscono in modo chiuso. Se Discord restituisce `Missing Access`, la ricerca del membro fallisce oppure il canale appartiene a una guild diversa, il mittente del DM viene trattato come non autorizzato.

    Abilita **Server Members Intent** del Discord Developer Portal per il bot quando usi gruppi di accesso basati sull'audience del canale. I DM non includono lo stato di membro della guild, quindi OpenClaw risolve il membro tramite Discord REST al momento dell'autorizzazione.

  </Tab>

  <Tab title="Guild policy">
    La gestione delle guild è controllata da `channels.discord.groupPolicy`:

    - `open`
    - `allowlist`
    - `disabled`

    La baseline sicura quando `channels.discord` esiste è `allowlist`.

    Comportamento di `allowlist`:

    - la guild deve corrispondere a `channels.discord.guilds` (`id` preferito, slug accettato)
    - allowlist opzionali dei mittenti: `users` (ID stabili consigliati) e `roles` (solo ID ruolo); se una delle due è configurata, i mittenti sono consentiti quando corrispondono a `users` OPPURE `roles`
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
    I messaggi delle guild sono vincolati alle menzioni per impostazione predefinita.

    Il rilevamento delle menzioni include:

    - menzione esplicita del bot
    - pattern di menzione configurati (`agents.list[].groupChat.mentionPatterns`, fallback `messages.groupChat.mentionPatterns`)
    - comportamento implicito di risposta al bot nei casi supportati

    Quando scrivi messaggi Discord in uscita, usa la sintassi canonica delle menzioni: `<@USER_ID>` per gli utenti, `<#CHANNEL_ID>` per i canali e `<@&ROLE_ID>` per i ruoli. Non usare la forma legacy di menzione nickname `<@!USER_ID>`.

    `requireMention` è configurato per guild/canale (`channels.discord.guilds...`).
    `ignoreOtherMentions` scarta opzionalmente i messaggi che menzionano un altro utente/ruolo ma non il bot (esclusi @everyone/@here).

    DM di gruppo:

    - predefinito: ignorati (`dm.groupEnabled=false`)
    - allowlist opzionale tramite `dm.groupChannels` (ID canale o slug)

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

- `commands.native` è impostato per impostazione predefinita su `"auto"` ed è abilitato per Discord.
- Override per canale: `channels.discord.commands.native`.
- `commands.native=false` salta la registrazione e la pulizia degli slash command di Discord durante l'avvio. I comandi registrati in precedenza possono rimanere visibili in Discord finché non li rimuovi dall'app Discord.
- L'autenticazione dei comandi nativi usa le stesse allowlist/policy di Discord della normale gestione dei messaggi.
- I comandi possono comunque essere visibili nell'interfaccia utente di Discord per utenti non autorizzati; l'esecuzione applica comunque l'autenticazione OpenClaw e restituisce "non autorizzato".

Consulta [Slash command](/it/tools/slash-commands) per catalogo e comportamento dei comandi.

Impostazioni predefinite degli slash command:

- `ephemeral: true`

## Dettagli della funzionalità

<AccordionGroup>
  <Accordion title="Tag di risposta e risposte native">
    Discord supporta i tag di risposta nell'output dell'agente:

    - `[[reply_to_current]]`
    - `[[reply_to:<id>]]`

    Controllato da `channels.discord.replyToMode`:

    - `off` (predefinito)
    - `first`
    - `all`
    - `batched`

    Nota: `off` disabilita il threading implicito delle risposte. I tag espliciti `[[reply_to_*]]` vengono comunque rispettati.
    `first` allega sempre il riferimento di risposta nativa implicita al primo messaggio Discord in uscita per il turno.
    `batched` allega il riferimento di risposta nativa implicita di Discord solo quando il
    turno in ingresso era un batch con debounce di più messaggi. Questo è utile
    quando vuoi risposte native principalmente per chat a raffica ambigue, non per ogni
    turno con singolo messaggio.

    Gli ID dei messaggi vengono esposti nel contesto/nella cronologia, così gli agenti possono puntare a messaggi specifici.

  </Accordion>

  <Accordion title="Anteprima dello streaming live">
    OpenClaw può trasmettere in streaming bozze di risposta inviando un messaggio temporaneo e modificandolo man mano che arriva il testo. `channels.discord.streaming` accetta `off` | `partial` | `block` | `progress` (predefinito). `progress` mantiene una bozza di stato modificabile e la aggiorna con l'avanzamento degli strumenti fino alla consegna finale; `streamMode` è un alias runtime legacy. Esegui `openclaw doctor --fix` per riscrivere la configurazione persistita nella chiave canonica.

    Imposta `channels.discord.streaming.mode` su `off` per disabilitare le modifiche di anteprima Discord. Se lo streaming a blocchi Discord è abilitato esplicitamente, OpenClaw salta lo stream di anteprima per evitare il doppio streaming.

```json5
{
  channels: {
    discord: {
      streaming: {
        mode: "progress",
        progress: {
          label: "auto",
          maxLines: 8,
          toolProgress: true,
        },
      },
    },
  },
}
```

    - `partial` modifica un singolo messaggio di anteprima man mano che arrivano i token.
    - `block` emette blocchi delle dimensioni di una bozza (usa `draftChunk` per regolare dimensione e punti di interruzione, limitati a `textChunkLimit`).
    - I finali con media, errore e risposta esplicita annullano le modifiche di anteprima in sospeso.
    - `streaming.preview.toolProgress` (predefinito `true`) controlla se gli aggiornamenti di strumenti/avanzamento riutilizzano il messaggio di anteprima.
    - `streaming.preview.commandText` / `streaming.progress.commandText` controlla il dettaglio di comandi/esecuzioni nelle righe di avanzamento compatte: `raw` (predefinito) o `status` (solo etichetta dello strumento).

    Nascondi il testo grezzo di comando/esecuzione mantenendo le righe di avanzamento compatte:

    ```json
    {
      "channels": {
        "discord": {
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

    Lo streaming di anteprima è solo testo; le risposte con media ricadono sulla consegna normale. Quando lo streaming `block` è abilitato esplicitamente, OpenClaw salta lo stream di anteprima per evitare il doppio streaming.

  </Accordion>

  <Accordion title="Cronologia, contesto e comportamento dei thread">
    Contesto della cronologia della guild:

    - `channels.discord.historyLimit` predefinito `20`
    - fallback: `messages.groupChat.historyLimit`
    - `0` disabilita

    Controlli della cronologia DM:

    - `channels.discord.dmHistoryLimit`
    - `channels.discord.dms["<user_id>"].historyLimit`

    Comportamento dei thread:

    - I thread Discord vengono instradati come sessioni di canale ed ereditano la configurazione del canale padre salvo override.
    - Le sessioni dei thread ereditano la selezione `/model` a livello di sessione del canale padre come fallback solo modello; le selezioni `/model` locali al thread hanno comunque la precedenza e la cronologia della trascrizione padre non viene copiata salvo che l'ereditarietà della trascrizione sia abilitata.
    - `channels.discord.thread.inheritParent` (predefinito `false`) abilita i nuovi thread automatici al seed dalla trascrizione padre. Gli override per account si trovano sotto `channels.discord.accounts.<id>.thread.inheritParent`.
    - Le reazioni dello strumento messaggi possono risolvere target DM `user:<id>`.
    - `guilds.<guild>.channels.<channel>.requireMention: false` viene preservato durante il fallback di attivazione in fase di risposta.

    Gli argomenti dei canali vengono iniettati come contesto **non attendibile**. Le allowlist limitano chi può attivare l'agente, non sono un confine completo di redazione del contesto supplementare.

  </Accordion>

  <Accordion title="Sessioni vincolate al thread per subagenti">
    Discord può associare un thread a un target di sessione così che i messaggi successivi in quel thread continuino a essere instradati alla stessa sessione (incluse le sessioni dei subagenti).

    Comandi:

    - `/focus <target>` associa il thread corrente/nuovo a un target subagente/sessione
    - `/unfocus` rimuove l'associazione del thread corrente
    - `/agents` mostra esecuzioni attive e stato dell'associazione
    - `/session idle <duration|off>` ispeziona/aggiorna l'auto-unfocus per inattività delle associazioni focalizzate
    - `/session max-age <duration|off>` ispeziona/aggiorna l'età massima assoluta delle associazioni focalizzate

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
        spawnSessions: true,
        defaultSpawnContext: "fork",
      },
    },
  },
}
```

    Note:

    - `session.threadBindings.*` imposta i valori predefiniti globali.
    - `channels.discord.threadBindings.*` sovrascrive il comportamento di Discord.
    - `spawnSessions` controlla la creazione/associazione automatica dei thread per `sessions_spawn({ thread: true })` e gli spawn di thread ACP. Predefinito: `true`.
    - `defaultSpawnContext` controlla il contesto nativo dei subagenti per gli spawn vincolati al thread. Predefinito: `"fork"`.
    - Le chiavi deprecate `spawnSubagentSessions`/`spawnAcpSessions` vengono migrate da `openclaw doctor --fix`.
    - Se le associazioni dei thread sono disabilitate per un account, `/focus` e le operazioni correlate di associazione dei thread non sono disponibili.

    Consulta [Sub-agenti](/it/tools/subagents), [Agenti ACP](/it/tools/acp-agents) e [Riferimento configurazione](/it/gateway/configuration-reference).

  </Accordion>

  <Accordion title="Associazioni persistenti dei canali ACP">
    Per workspace ACP stabili "sempre attivi", configura associazioni ACP tipizzate di primo livello che puntano a conversazioni Discord.

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
    - In un canale o thread associato, `/new` e `/reset` reimpostano la stessa sessione ACP sul posto. Le associazioni temporanee dei thread possono sovrascrivere la risoluzione del target mentre sono attive.
    - `spawnSessions` controlla la creazione/associazione dei thread figlio tramite `--thread auto|here`.

    Consulta [Agenti ACP](/it/tools/acp-agents) per i dettagli sul comportamento delle associazioni.

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
    - fallback emoji dell'identità agente (`agents.list[].identity.emoji`, altrimenti "👀")

    Note:

    - Discord accetta emoji unicode o nomi di emoji personalizzate.
    - Usa `""` per disabilitare la reazione per un canale o account.

  </Accordion>

  <Accordion title="Scritture di configurazione">
    Le scritture di configurazione avviate dal canale sono abilitate per impostazione predefinita.

    Questo influisce sui flussi `/config set|unset` (quando le funzionalità dei comandi sono abilitate).

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

  <Accordion title="Proxy Gateway">
    Instrada il traffico WebSocket del Gateway Discord e le ricerche REST di avvio (ID applicazione + risoluzione allowlist) attraverso un proxy HTTP(S) con `channels.discord.proxy`.

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
    Abilita la risoluzione PluralKit per mappare i messaggi proxy all'identità del membro di sistema:

```json5
{
  channels: {
    discord: {
      pluralkit: {
        enabled: true,
        token: "pk_live_...", // facoltativo; necessario per sistemi privati
      },
    },
  },
}
```

    Note:

    - le allowlist possono usare `pk:<memberId>`
    - i nomi visualizzati dei membri vengono abbinati per nome/slug solo quando `channels.discord.dangerouslyAllowNameMatching: true`
    - le ricerche usano l'ID del messaggio originale e sono vincolate a una finestra temporale
    - se la ricerca fallisce, i messaggi proxy vengono trattati come messaggi bot e scartati salvo che `allowBots=true`

  </Accordion>

  <Accordion title="Alias delle menzioni in uscita">
    Usa `mentionAliases` quando gli agenti hanno bisogno di menzioni in uscita deterministiche per utenti Discord noti. Le chiavi sono handle senza la `@` iniziale; i valori sono ID utente Discord. Gli handle sconosciuti, `@everyone`, `@here` e le menzioni all'interno di code span Markdown vengono lasciati invariati.

```json5
{
  channels: {
    discord: {
      mentionAliases: {
        Vladislava: "123456789012345678",
      },
      accounts: {
        ops: {
          mentionAliases: {
            OpsLead: "234567890123456789",
          },
        },
      },
    },
  },
}
```

  </Accordion>

  <Accordion title="Configurazione della presenza">
    Gli aggiornamenti della presenza vengono applicati quando imposti un campo di stato o attività, oppure quando abiliti la presenza automatica.

    Esempio solo stato:

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
    - 1: Streaming (richiede `activityUrl`)
    - 2: In ascolto
    - 3: Guardando
    - 4: Personalizzato (usa il testo dell'attività come stato; l'emoji è facoltativa)
    - 5: In competizione

    Esempio di presenza automatica (segnale di salute runtime):

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

    La presenza automatica mappa la disponibilità runtime allo stato Discord: integro => online, degradato o sconosciuto => inattivo, esaurito o non disponibile => dnd. Override di testo opzionali:

    - `autoPresence.healthyText`
    - `autoPresence.degradedText`
    - `autoPresence.exhaustedText` (supporta il segnaposto `{reason}`)

  </Accordion>

  <Accordion title="Approvazioni in Discord">
    Discord supporta la gestione delle approvazioni tramite pulsanti nei DM e può facoltativamente pubblicare richieste di approvazione nel canale di origine.

    Percorso di configurazione:

    - `channels.discord.execApprovals.enabled`
    - `channels.discord.execApprovals.approvers` (opzionale; ricade su `commands.ownerAllowFrom` quando possibile)
    - `channels.discord.execApprovals.target` (`dm` | `channel` | `both`, predefinito: `dm`)
    - `agentFilter`, `sessionFilter`, `cleanupAfterResolve`

    Discord abilita automaticamente le approvazioni exec native quando `enabled` non è impostato o è `"auto"` e può essere risolto almeno un approvatore, da `execApprovals.approvers` oppure da `commands.ownerAllowFrom`. Discord non deduce gli approvatori exec da `allowFrom` del canale, dal `dm.allowFrom` legacy o dal `defaultTo` dei messaggi diretti. Imposta `enabled: false` per disabilitare esplicitamente Discord come client di approvazione nativo.

    Per comandi di gruppo sensibili riservati agli owner, come `/diagnostics` e `/export-trajectory`, OpenClaw invia richieste di approvazione e risultati finali in privato. Prova prima il DM Discord quando l'owner che invoca il comando ha una route owner Discord; se non è disponibile, ricade sulla prima route owner disponibile da `commands.ownerAllowFrom`, come Telegram.

    Quando `target` è `channel` o `both`, la richiesta di approvazione è visibile nel canale. Solo gli approvatori risolti possono usare i pulsanti; gli altri utenti ricevono un rifiuto effimero. Le richieste di approvazione includono il testo del comando, quindi abilita la consegna nel canale solo in canali attendibili. Se l'ID del canale non può essere derivato dalla chiave di sessione, OpenClaw ricade sulla consegna tramite DM.

    Discord visualizza anche i pulsanti di approvazione condivisi usati da altri canali chat. L'adapter Discord nativo aggiunge principalmente il routing DM degli approvatori e il fanout sul canale.
    Quando questi pulsanti sono presenti, costituiscono la UX di approvazione principale; OpenClaw
    deve includere un comando manuale `/approve` solo quando il risultato del tool indica che
    le approvazioni via chat non sono disponibili o che l'approvazione manuale è l'unico percorso.
    Se il runtime di approvazione nativo Discord non è attivo, OpenClaw mantiene visibile la
    richiesta deterministica locale `/approve <id> <decision>`. Se il
    runtime è attivo ma una scheda nativa non può essere consegnata ad alcun target,
    OpenClaw invia un avviso di fallback nella stessa chat con il comando `/approve`
    esatto dell'approvazione in sospeso.

    L'autenticazione Gateway e la risoluzione delle approvazioni seguono il contratto condiviso del client Gateway (gli ID `plugin:` si risolvono tramite `plugin.approval.resolve`; gli altri ID tramite `exec.approval.resolve`). Le approvazioni scadono dopo 30 minuti per impostazione predefinita.

    Vedi [Approvazioni exec](/it/tools/exec-approvals).

  </Accordion>
</AccordionGroup>

## Tool e gate delle azioni

Le azioni dei messaggi Discord includono messaggistica, amministrazione dei canali, moderazione, presenza e azioni sui metadati.

Esempi principali:

- messaggistica: `sendMessage`, `readMessages`, `editMessage`, `deleteMessage`, `threadReply`
- reazioni: `react`, `reactions`, `emojiList`
- moderazione: `timeout`, `kick`, `ban`
- presenza: `setPresence`

L'azione `event-create` accetta un parametro opzionale `image` (URL o percorso di file locale) per impostare l'immagine di copertina dell'evento programmato.

I gate delle azioni si trovano sotto `channels.discord.actions.*`.

Comportamento predefinito dei gate:

| Gruppo di azioni                                                                                                                                                         | Predefinito |
| ------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ----------- |
| reactions, messages, threads, pins, polls, search, memberInfo, roleInfo, channelInfo, channels, voiceStatus, events, stickers, emojiUploads, stickerUploads, permissions | abilitato   |
| roles                                                                                                                                                                    | disabilitato |
| moderation                                                                                                                                                               | disabilitato |
| presence                                                                                                                                                                 | disabilitato |

## UI Components v2

OpenClaw usa Discord components v2 per le approvazioni exec e i marcatori tra contesti. Le azioni dei messaggi Discord possono anche accettare `components` per UI personalizzate (avanzato; richiede la costruzione di un payload componente tramite il tool discord), mentre gli `embeds` legacy restano disponibili ma non sono consigliati.

- `channels.discord.ui.components.accentColor` imposta il colore di accento usato dai contenitori dei componenti Discord (hex).
- Impostalo per account con `channels.discord.accounts.<id>.ui.components.accentColor`.
- Gli `embeds` vengono ignorati quando sono presenti components v2.

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

Discord ha due superfici vocali distinte: **canali vocali** in tempo reale (conversazioni continue) e **allegati di messaggi vocali** (il formato di anteprima con forma d'onda). Il gateway supporta entrambi.

### Canali vocali

Checklist di configurazione:

1. Abilita Message Content Intent nel Discord Developer Portal.
2. Abilita Server Members Intent quando vengono usate allowlist di ruoli/utenti.
3. Invita il bot con gli scope `bot` e `applications.commands`.
4. Concedi Connect, Speak, Send Messages e Read Message History nel canale vocale target.
5. Abilita i comandi nativi (`commands.native` o `channels.discord.commands.native`).
6. Configura `channels.discord.voice`.

Usa `/vc join|leave|status` per controllare le sessioni. Il comando usa l'agent predefinito dell'account e segue le stesse regole di allowlist e policy di gruppo degli altri comandi Discord.

```bash
/vc join channel:<voice-channel-id>
/vc status
/vc leave
```

Per ispezionare i permessi effettivi del bot prima di entrare, esegui:

```bash
openclaw channels capabilities --channel discord --target channel:<voice-channel-id>
```

Esempio di ingresso automatico:

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
        connectTimeoutMs: 30000,
        reconnectGraceMs: 15000,
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
- `voice.model` sovrascrive l'LLM usato solo per le risposte nei canali vocali Discord. Lascialo non impostato per ereditare il modello dell'agent instradato.
- STT usa `tools.media.audio`; `voice.model` non influisce sulla trascrizione.
- Gli override Discord `systemPrompt` per canale si applicano ai turni della trascrizione vocale per quel canale vocale.
- I turni della trascrizione vocale derivano lo stato owner da `allowFrom` di Discord (o `dm.allowFrom`); gli speaker non owner non possono accedere ai tool riservati agli owner (per esempio `gateway` e `cron`).
- La voce Discord è opt-in per configurazioni solo testo; imposta `channels.discord.voice.enabled=true` (o mantieni un blocco `channels.discord.voice` esistente) per abilitare i comandi `/vc`, il runtime vocale e l'intent Gateway `GuildVoiceStates`.
- `channels.discord.intents.voiceStates` può sovrascrivere esplicitamente la sottoscrizione all'intent degli stati vocali. Lascialo non impostato affinché l'intent segua l'abilitazione vocale effettiva.
- `voice.daveEncryption` e `voice.decryptionFailureTolerance` vengono passati alle opzioni di join di `@discordjs/voice`.
- I valori predefiniti di `@discordjs/voice` sono `daveEncryption=true` e `decryptionFailureTolerance=24` se non impostati.
- `voice.connectTimeoutMs` controlla l'attesa iniziale Ready di `@discordjs/voice` per `/vc join` e i tentativi di ingresso automatico. Predefinito: `30000`.
- `voice.reconnectGraceMs` controlla per quanto tempo OpenClaw attende che una sessione vocale disconnessa inizi a riconnettersi prima di distruggerla. Predefinito: `15000`.
- La riproduzione vocale non si ferma solo perché un altro utente inizia a parlare. Per evitare loop di feedback, OpenClaw ignora la nuova cattura vocale mentre TTS è in riproduzione; parla dopo la fine della riproduzione per il turno successivo.
- `voice.captureSilenceGraceMs` controlla per quanto tempo OpenClaw attende dopo che Discord segnala che uno speaker ha smesso di parlare prima di finalizzare quel segmento audio per STT. Predefinito: `2500`; aumentalo se Discord divide pause normali in trascrizioni parziali frammentate.
- Quando ElevenLabs è il provider TTS selezionato, la riproduzione vocale Discord usa TTS in streaming e parte dallo stream di risposta del provider. I provider senza supporto allo streaming ricadono sul percorso del file temporaneo sintetizzato.
- OpenClaw monitora anche i fallimenti di decrittazione in ricezione e si ripristina automaticamente uscendo e rientrando nel canale vocale dopo fallimenti ripetuti in una breve finestra.
- Se i log di ricezione mostrano ripetutamente `DecryptionFailed(UnencryptedWhenPassthroughDisabled)` dopo l'aggiornamento, raccogli un report delle dipendenze e i log. La linea `@discordjs/voice` inclusa contiene la correzione upstream del padding dalla PR discord.js #11449, che ha chiuso l'issue discord.js #11419.
- Gli eventi di ricezione `The operation was aborted` sono attesi quando OpenClaw finalizza un segmento speaker catturato; sono diagnostiche verbose, non avvisi.

Pipeline del canale vocale:

- La cattura PCM Discord viene convertita in un file temporaneo WAV.
- `tools.media.audio` gestisce STT, per esempio `openai/gpt-4o-mini-transcribe`.
- La trascrizione viene inviata attraverso l'ingresso e il routing Discord mentre l'LLM di risposta viene eseguito con una policy di output vocale che nasconde il tool `tts` dell'agent e richiede testo restituito, perché la voce Discord possiede la riproduzione TTS finale.
- `voice.model`, quando impostato, sovrascrive solo l'LLM di risposta per questo turno del canale vocale.
- `voice.tts` viene unito sopra `messages.tts`; i provider con capacità di streaming alimentano direttamente il player, altrimenti il file audio risultante viene riprodotto nel canale unito.

Le credenziali vengono risolte per componente: autenticazione della route LLM per `voice.model`, autenticazione STT per `tools.media.audio` e autenticazione TTS per `messages.tts`/`voice.tts`.

### Messaggi vocali

I messaggi vocali Discord mostrano un'anteprima con forma d'onda e richiedono audio OGG/Opus. OpenClaw genera automaticamente la forma d'onda, ma richiede `ffmpeg` e `ffprobe` sull'host gateway per ispezionare e convertire.

- Fornisci un **percorso di file locale** (gli URL vengono rifiutati).
- Ometti il contenuto testuale (Discord rifiuta testo + messaggio vocale nello stesso payload).
- Qualsiasi formato audio è accettato; OpenClaw converte in OGG/Opus se necessario.

```bash
message(action="send", channel="discord", target="channel:123", path="/path/to/audio.mp3", asVoice=true)
```

## Risoluzione dei problemi

<AccordionGroup>
  <Accordion title="Usati intent non consentiti oppure il bot non vede messaggi guild">

    - abilita Message Content Intent
    - abilita Server Members Intent quando dipendi dalla risoluzione di utenti/membri
    - riavvia il gateway dopo aver modificato gli intent

  </Accordion>

  <Accordion title="Messaggi guild bloccati in modo imprevisto">

    - verifica `groupPolicy`
    - verifica la allowlist guild sotto `channels.discord.guilds`
    - se esiste la mappa `channels` della guild, sono consentiti solo i canali elencati
    - verifica il comportamento di `requireMention` e i pattern di menzione

    Controlli utili:

```bash
openclaw doctor
openclaw channels status --probe
openclaw logs --follow
```

  </Accordion>

  <Accordion title="Require mention falso ma ancora bloccato">
    Cause comuni:

    - `groupPolicy="allowlist"` senza una allowlist di guild/canale corrispondente
    - `requireMention` configurato nel posto sbagliato (deve essere sotto `channels.discord.guilds` o nella voce del canale)
    - mittente bloccato dalla allowlist `users` della guild/del canale

  </Accordion>

  <Accordion title="Turn Discord a lunga esecuzione o risposte duplicate">

    Log tipici:

    - `Slow listener detected ...`
    - `stuck session: sessionKey=agent:...:discord:... state=processing ...`

    Manopole della coda del Gateway Discord:

    - account singolo: `channels.discord.eventQueue.listenerTimeout`
    - account multiplo: `channels.discord.accounts.<accountId>.eventQueue.listenerTimeout`
    - questo controlla solo il lavoro del listener del Gateway Discord, non la durata del turn dell'agente

    Discord non applica un timeout di proprietà del canale ai turn degli agenti in coda. I listener dei messaggi passano immediatamente il lavoro, e le esecuzioni Discord in coda preservano l'ordinamento per sessione finché il ciclo di vita della sessione/dello strumento/del runtime completa o interrompe il lavoro.

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

  <Accordion title="Avvisi di timeout della ricerca dei metadati del Gateway">
    OpenClaw recupera i metadati Discord `/gateway/bot` prima di connettersi. Gli errori transitori ripiegano sull'URL Gateway predefinito di Discord e sono soggetti a limite di frequenza nei log.

    Manopole del timeout dei metadati:

    - account singolo: `channels.discord.gatewayInfoTimeoutMs`
    - account multiplo: `channels.discord.accounts.<accountId>.gatewayInfoTimeoutMs`
    - fallback env quando la configurazione non è impostata: `OPENCLAW_DISCORD_GATEWAY_INFO_TIMEOUT_MS`
    - predefinito: `30000` (30 secondi), massimo: `120000`

  </Accordion>

  <Accordion title="Riavvii per timeout READY del Gateway">
    OpenClaw attende l'evento `READY` del Gateway Discord durante l'avvio e dopo le riconnessioni del runtime. Le configurazioni multi-account con avvio scaglionato possono richiedere una finestra READY di avvio più lunga del valore predefinito.

    Manopole del timeout READY:

    - avvio account singolo: `channels.discord.gatewayReadyTimeoutMs`
    - avvio account multiplo: `channels.discord.accounts.<accountId>.gatewayReadyTimeoutMs`
    - fallback env di avvio quando la configurazione non è impostata: `OPENCLAW_DISCORD_READY_TIMEOUT_MS`
    - predefinito di avvio: `15000` (15 secondi), massimo: `120000`
    - runtime account singolo: `channels.discord.gatewayRuntimeReadyTimeoutMs`
    - runtime account multiplo: `channels.discord.accounts.<accountId>.gatewayRuntimeReadyTimeoutMs`
    - fallback env del runtime quando la configurazione non è impostata: `OPENCLAW_DISCORD_RUNTIME_READY_TIMEOUT_MS`
    - predefinito del runtime: `30000` (30 secondi), massimo: `120000`

  </Accordion>

  <Accordion title="Disallineamenti nell'audit delle autorizzazioni">
    I controlli delle autorizzazioni di `channels status --probe` funzionano solo con ID canale numerici.

    Se usi chiavi slug, la corrispondenza a runtime può comunque funzionare, ma il probe non può verificare completamente le autorizzazioni.

  </Accordion>

  <Accordion title="Problemi di DM e associazione">

    - DM disabilitati: `channels.discord.dm.enabled=false`
    - policy DM disabilitata: `channels.discord.dmPolicy="disabled"` (legacy: `channels.discord.dm.policy`)
    - in attesa dell'approvazione dell'associazione in modalità `pairing`

  </Accordion>

  <Accordion title="Loop da bot a bot">
    Per impostazione predefinita, i messaggi scritti da bot vengono ignorati.

    Se imposti `channels.discord.allowBots=true`, usa regole rigorose di menzione e allowlist per evitare comportamenti a loop.
    Preferisci `channels.discord.allowBots="mentions"` per accettare solo i messaggi dei bot che menzionano il bot.

```json5
{
  channels: {
    discord: {
      accounts: {
        mantis: {
          // Mantis listens to other bots only when they mention her.
          allowBots: "mentions",
        },
        molty: {
          // Molty listens to all bot-authored Discord messages.
          allowBots: true,
          mentionAliases: {
            // Lets Molty write "@Mantis" and send a real Discord mention.
            Mantis: "MANTIS_DISCORD_USER_ID",
          },
        },
      },
    },
  },
}
```

  </Accordion>

  <Accordion title="Perdite di STT vocale con DecryptionFailed(...)">

    - mantieni OpenClaw aggiornato (`openclaw update`) così la logica di recupero della ricezione vocale Discord è presente
    - conferma `channels.discord.voice.daveEncryption=true` (predefinito)
    - parti da `channels.discord.voice.decryptionFailureTolerance=24` (predefinito upstream) e regola solo se necessario
    - osserva i log per:
      - `discord voice: DAVE decrypt failures detected`
      - `discord voice: repeated decrypt failures; attempting rejoin`
    - se gli errori continuano dopo il rientro automatico, raccogli i log e confrontali con la cronologia di ricezione DAVE upstream in [discord.js #11419](https://github.com/discordjs/discord.js/issues/11419) e [discord.js #11449](https://github.com/discordjs/discord.js/pull/11449)

  </Accordion>
</AccordionGroup>

## Riferimento di configurazione

Riferimento principale: [Riferimento di configurazione - Discord](/it/gateway/config-channels#discord).

<Accordion title="Campi Discord ad alto segnale">

- avvio/auth: `enabled`, `token`, `accounts.*`, `allowBots`
- policy: `groupPolicy`, `dm.*`, `guilds.*`, `guilds.*.channels.*`
- comando: `commands.native`, `commands.useAccessGroups`, `configWrites`, `slashCommand.*`
- coda eventi: `eventQueue.listenerTimeout` (budget del listener), `eventQueue.maxQueueSize`, `eventQueue.maxConcurrency`
- Gateway: `gatewayInfoTimeoutMs`, `gatewayReadyTimeoutMs`, `gatewayRuntimeReadyTimeoutMs`
- risposta/cronologia: `replyToMode`, `historyLimit`, `dmHistoryLimit`, `dms.*.historyLimit`
- recapito: `textChunkLimit`, `chunkMode`, `maxLinesPerMessage`
- streaming: `streaming` (alias legacy: `streamMode`), `streaming.preview.toolProgress`, `draftChunk`, `blockStreaming`, `blockStreamingCoalesce`
- media/tentativi: `mediaMaxMb` (limita i caricamenti Discord in uscita, predefinito `100MB`), `retry`
- azioni: `actions.*`
- presenza: `activity`, `status`, `activityType`, `activityUrl`
- UI: `ui.components.accentColor`
- funzionalità: `threadBindings`, `bindings[]` di primo livello (`type: "acp"`), `pluralkit`, `execApprovals`, `intents`, `agentComponents`, `heartbeat`, `responsePrefix`

</Accordion>

## Sicurezza e operazioni

- Tratta i token dei bot come segreti (`DISCORD_BOT_TOKEN` preferito negli ambienti supervisionati).
- Concedi autorizzazioni Discord con privilegi minimi.
- Se lo stato/distribuzione dei comandi è obsoleto, riavvia il Gateway e ricontrolla con `openclaw channels status --probe`.

## Correlati

<CardGroup cols={2}>
  <Card title="Associazione" icon="link" href="/it/channels/pairing">
    Associa un utente Discord al Gateway.
  </Card>
  <Card title="Gruppi" icon="users" href="/it/channels/groups">
    Chat di gruppo e comportamento della allowlist.
  </Card>
  <Card title="Instradamento dei canali" icon="route" href="/it/channels/channel-routing">
    Instrada i messaggi in ingresso agli agenti.
  </Card>
  <Card title="Sicurezza" icon="shield" href="/it/gateway/security">
    Modello delle minacce e hardening.
  </Card>
  <Card title="Instradamento multi-agente" icon="sitemap" href="/it/concepts/multi-agent">
    Mappa guild e canali agli agenti.
  </Card>
  <Card title="Comandi slash" icon="terminal" href="/it/tools/slash-commands">
    Comportamento dei comandi nativi.
  </Card>
</CardGroup>
