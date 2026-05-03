---
read_when:
    - Lavorare sulle funzionalità del canale Discord
summary: Stato del supporto del bot Discord, funzionalità e configurazione
title: Discord
x-i18n:
    generated_at: "2026-05-03T21:27:20Z"
    model: gpt-5.5
    provider: openai
    source_hash: 3a38cb3c8e25c1f3d6b7ddfc35a0445dc264be74d74b08d0051528b462b743a3
    source_path: channels/discord.md
    workflow: 16
---

Pronto per messaggi diretti e canali di gilda tramite il Gateway ufficiale di Discord.

<CardGroup cols={3}>
  <Card title="Pairing" icon="link" href="/it/channels/pairing">
    I messaggi diretti di Discord usano per impostazione predefinita la modalita di abbinamento.
  </Card>
  <Card title="Slash commands" icon="terminal" href="/it/tools/slash-commands">
    Comportamento nativo dei comandi e catalogo dei comandi.
  </Card>
  <Card title="Channel troubleshooting" icon="wrench" href="/it/channels/troubleshooting">
    Diagnostica tra canali e flusso di riparazione.
  </Card>
</CardGroup>

## Configurazione rapida

Dovrai creare una nuova applicazione con un bot, aggiungere il bot al tuo server e abbinarlo a OpenClaw. Ti consigliamo di aggiungere il bot al tuo server privato. Se non ne hai ancora uno, [creane prima uno](https://support.discord.com/hc/en-us/articles/204849977-How-do-I-create-a-server) (scegli **Create My Own > For me and my friends**).

<Steps>
  <Step title="Create a Discord application and bot">
    Vai al [Portale sviluppatori Discord](https://discord.com/developers/applications) e fai clic su **New Application**. Dagli un nome come "OpenClaw".

    Fai clic su **Bot** nella barra laterale. Imposta **Username** su come chiami il tuo agente OpenClaw.

  </Step>

  <Step title="Enable privileged intents">
    Sempre nella pagina **Bot**, scorri verso il basso fino a **Privileged Gateway Intents** e abilita:

    - **Message Content Intent** (obbligatorio)
    - **Server Members Intent** (consigliato; obbligatorio per allowlist dei ruoli e corrispondenza nome-ID)
    - **Presence Intent** (facoltativo; necessario solo per gli aggiornamenti di presenza)

  </Step>

  <Step title="Copy your bot token">
    Scorri di nuovo verso l'alto nella pagina **Bot** e fai clic su **Reset Token**.

    <Note>
    Nonostante il nome, questo genera il tuo primo token: non viene "reimpostato" nulla.
    </Note>

    Copia il token e salvalo da qualche parte. Questo e il tuo **Bot Token** e ti servira tra poco.

  </Step>

  <Step title="Generate an invite URL and add the bot to your server">
    Fai clic su **OAuth2** nella barra laterale. Genererai un URL di invito con le autorizzazioni corrette per aggiungere il bot al tuo server.

    Scorri verso il basso fino a **OAuth2 URL Generator** e abilita:

    - `bot`
    - `applications.commands`

    Sotto apparira una sezione **Bot Permissions**. Abilita almeno:

    **General Permissions**
      - View Channels
    **Text Permissions**
      - Send Messages
      - Read Message History
      - Embed Links
      - Attach Files
      - Add Reactions (facoltativo)

    Questo e l'insieme di base per i normali canali di testo. Se prevedi di pubblicare nei thread Discord, inclusi i flussi di lavoro dei canali forum o multimediali che creano o continuano un thread, abilita anche **Send Messages in Threads**.
    Copia l'URL generato in basso, incollalo nel browser, seleziona il tuo server e fai clic su **Continue** per connetterti. Ora dovresti vedere il tuo bot nel server Discord.

  </Step>

  <Step title="Enable Developer Mode and collect your IDs">
    Tornando nell'app Discord, devi abilitare la Modalita sviluppatore per poter copiare gli ID interni.

    1. Fai clic su **User Settings** (icona a ingranaggio accanto al tuo avatar) -> **Advanced** -> attiva **Developer Mode**
    2. Fai clic con il pulsante destro sull'**icona del server** nella barra laterale -> **Copy Server ID**
    3. Fai clic con il pulsante destro sul **tuo avatar** -> **Copy User ID**

    Salva il tuo **Server ID** e **User ID** insieme al tuo Bot Token: invierai tutti e tre a OpenClaw nel passaggio successivo.

  </Step>

  <Step title="Allow DMs from server members">
    Perche l'abbinamento funzioni, Discord deve consentire al tuo bot di inviarti messaggi diretti. Fai clic con il pulsante destro sull'**icona del server** -> **Privacy Settings** -> attiva **Direct Messages**.

    Questo consente ai membri del server (inclusi i bot) di inviarti messaggi diretti. Mantieni questa opzione abilitata se vuoi usare i messaggi diretti di Discord con OpenClaw. Se prevedi di usare solo canali di gilda, puoi disabilitare i messaggi diretti dopo l'abbinamento.

  </Step>

  <Step title="Set your bot token securely (do not send it in chat)">
    Il token del bot Discord e un segreto (come una password). Impostalo sulla macchina che esegue OpenClaw prima di inviare messaggi al tuo agente.

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

    Se OpenClaw e gia in esecuzione come servizio in background, riavvialo tramite l'app Mac di OpenClaw oppure arrestando e riavviando il processo `openclaw gateway run`.
    Per le installazioni come servizio gestito, esegui `openclaw gateway install` da una shell in cui `DISCORD_BOT_TOKEN` e presente, oppure salva la variabile in `~/.openclaw/.env`, cosi il servizio potra risolvere il SecretRef env dopo il riavvio.
    Se il tuo host e bloccato o limitato nella frequenza dalla ricerca dell'applicazione all'avvio di Discord, imposta l'ID applicazione/client Discord dal Portale sviluppatori cosi l'avvio puo saltare quella chiamata REST. Usa `channels.discord.applicationId` per l'account predefinito, oppure `channels.discord.accounts.<accountId>.applicationId` quando esegui piu bot Discord.

  </Step>

  <Step title="Configure OpenClaw and pair">

    <Tabs>
      <Tab title="Ask your agent">
        Chatta con il tuo agente OpenClaw su qualsiasi canale esistente (ad esempio Telegram) e comunicaglielo. Se Discord e il tuo primo canale, usa invece la scheda CLI / config.

        > "Ho gia impostato il token del mio bot Discord nella configurazione. Completa la configurazione di Discord con User ID `<user_id>` e Server ID `<server_id>`."
      </Tab>
      <Tab title="CLI / config">
        Se preferisci una configurazione basata su file, imposta:

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

        Per una configurazione tramite script o remota, scrivi lo stesso blocco JSON5 con `openclaw config patch --file ./discord.patch.json5 --dry-run` e poi riesegui senza `--dry-run`. I valori `token` in testo normale sono supportati. Sono supportati anche i valori SecretRef per `channels.discord.token` nei provider env/file/exec. Consulta [Gestione dei segreti](/it/gateway/secrets).

        Per piu bot Discord, mantieni il token e l'ID applicazione di ciascun bot nel relativo account. Un `channels.discord.applicationId` di primo livello viene ereditato dagli account, quindi impostalo li solo quando ogni account deve usare lo stesso ID applicazione.

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

  <Step title="Approve first DM pairing">
    Attendi che il Gateway sia in esecuzione, poi invia un messaggio diretto al tuo bot in Discord. Rispondera con un codice di abbinamento.

    <Tabs>
      <Tab title="Ask your agent">
        Invia il codice di abbinamento al tuo agente sul canale esistente:

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

    Ora dovresti poter chattare con il tuo agente in Discord tramite messaggio diretto.

  </Step>
</Steps>

<Note>
La risoluzione del token e consapevole dell'account. I valori token della configurazione prevalgono sul fallback env. `DISCORD_BOT_TOKEN` viene usato solo per l'account predefinito.
Se due account Discord abilitati risolvono lo stesso token bot, OpenClaw avvia un solo monitor Gateway per quel token. Un token proveniente dalla configurazione prevale sul fallback env predefinito; altrimenti vince il primo account abilitato e l'account duplicato viene segnalato come disabilitato.
Per chiamate in uscita avanzate (strumento messaggio/azioni di canale), per quella chiamata viene usato un `token` esplicito per chiamata. Questo vale per azioni di invio e azioni in stile lettura/sondaggio (ad esempio lettura/ricerca/recupero/thread/pin/autorizzazioni). Le impostazioni di policy/riprova dell'account continuano a provenire dall'account selezionato nello snapshot runtime attivo.
</Note>

## Consigliato: configura un workspace di gilda

Quando i messaggi diretti funzionano, puoi configurare il tuo server Discord come workspace completo in cui ogni canale ottiene la propria sessione agente con il proprio contesto. Questo e consigliato per server privati in cui ci siete solo tu e il tuo bot.

<Steps>
  <Step title="Add your server to the guild allowlist">
    Questo consente al tuo agente di rispondere in qualsiasi canale del tuo server, non solo nei messaggi diretti.

    <Tabs>
      <Tab title="Ask your agent">
        > "Aggiungi il mio Server ID Discord `<server_id>` alla allowlist delle gilde"
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

  <Step title="Allow responses without @mention">
    Per impostazione predefinita, il tuo agente risponde nei canali di gilda solo quando viene menzionato con @. Per un server privato, probabilmente vuoi che risponda a ogni messaggio.

    Nei canali di gilda, le normali risposte finali dell'assistente restano private per impostazione predefinita. L'output visibile su Discord deve essere inviato esplicitamente con lo strumento `message`, cosi l'agente puo restare in ascolto per impostazione predefinita e pubblicare solo quando decide che una risposta nel canale e utile.

    <Tabs>
      <Tab title="Ask your agent">
        > "Consenti al mio agente di rispondere su questo server senza dover essere menzionato con @"
      </Tab>
      <Tab title="Config">
        Imposta `requireMention: false` nella configurazione della tua gilda:

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

  <Step title="Plan for memory in guild channels">
    Per impostazione predefinita, la memoria a lungo termine (MEMORY.md) viene caricata solo nelle sessioni di messaggi diretti. I canali di gilda non caricano automaticamente MEMORY.md.

    <Tabs>
      <Tab title="Ask your agent">
        > "Quando faccio domande nei canali Discord, usa memory_search o memory_get se ti serve contesto a lungo termine da MEMORY.md."
      </Tab>
      <Tab title="Manual">
        Se hai bisogno di contesto condiviso in ogni canale, inserisci le istruzioni stabili in `AGENTS.md` o `USER.md` (vengono iniettate per ogni sessione). Tieni le note a lungo termine in `MEMORY.md` e accedi a esse su richiesta con gli strumenti di memoria.
      </Tab>
    </Tabs>

  </Step>
</Steps>

Ora crea alcuni canali sul tuo server Discord e inizia a chattare. Il tuo agente puo vedere il nome del canale e ogni canale ottiene la propria sessione isolata, quindi puoi configurare `#coding`, `#home`, `#research` o qualsiasi altra cosa si adatti al tuo flusso di lavoro.

## Modello runtime

- Gateway possiede la connessione Discord.
- Il routing delle risposte è deterministico: le risposte in ingresso da Discord tornano a Discord.
- I metadati di guild/canale Discord vengono aggiunti al prompt del modello come contesto non attendibile, non come prefisso di risposta visibile all'utente. Se un modello copia nuovamente quell'involucro, OpenClaw rimuove i metadati copiati dalle risposte in uscita e dal futuro contesto di replay.
- Per impostazione predefinita (`session.dmScope=main`), le chat dirette condividono la sessione principale dell'agente (`agent:main:main`).
- I canali guild sono chiavi di sessione isolate (`agent:<agentId>:discord:channel:<channelId>`).
- I DM di gruppo sono ignorati per impostazione predefinita (`channels.discord.dm.groupEnabled=false`).
- I comandi slash nativi vengono eseguiti in sessioni di comando isolate (`agent:<agentId>:discord:slash:<userId>`), pur continuando a trasportare `CommandTargetSessionKey` verso la sessione di conversazione instradata.
- La consegna degli annunci cron/heartbeat solo testuali a Discord usa una volta la risposta finale visibile all'assistente. I payload multimediali e dei componenti strutturati restano multi-messaggio quando l'agente emette più payload consegnabili.

## Canali forum

I canali forum e multimediali di Discord accettano solo post in thread. OpenClaw supporta due modi per crearli:

- Invia un messaggio al forum padre (`channel:<forumId>`) per creare automaticamente un thread. Il titolo del thread usa la prima riga non vuota del tuo messaggio.
- Usa `openclaw message thread create` per creare direttamente un thread. Non passare `--message-id` per i canali forum.

Esempio: inviare al forum padre per creare un thread

```bash
openclaw message send --channel discord --target channel:<forumId> \
  --message "Topic title\nBody of the post"
```

Esempio: creare esplicitamente un thread forum

```bash
openclaw message thread create --channel discord --target channel:<forumId> \
  --thread-name "Topic title" --message "Body of the post"
```

I forum padre non accettano componenti Discord. Se ti servono componenti, invia al thread stesso (`channel:<threadId>`).

## Componenti interattivi

OpenClaw supporta i contenitori componenti Discord v2 per i messaggi degli agenti. Usa lo strumento messaggi con un payload `components`. I risultati delle interazioni vengono instradati di nuovo all'agente come normali messaggi in ingresso e seguono le impostazioni Discord `replyToMode` esistenti.

Blocchi supportati:

- `text`, `section`, `separator`, `actions`, `media-gallery`, `file`
- Le righe di azioni consentono fino a 5 pulsanti o un singolo menu di selezione
- Tipi di selezione: `string`, `user`, `role`, `mentionable`, `channel`

Per impostazione predefinita, i componenti sono monouso. Imposta `components.reusable=true` per consentire a pulsanti, selezioni e moduli di essere usati più volte finché non scadono.

Per limitare chi può fare clic su un pulsante, imposta `allowedUsers` su quel pulsante (ID utente Discord, tag o `*`). Quando configurato, gli utenti non corrispondenti ricevono un rifiuto effimero.

I comandi slash `/model` e `/models` aprono un selettore di modelli interattivo con menu a discesa per provider, modello e runtime compatibile, più un passaggio Invia. `/models add` è deprecato e ora restituisce un messaggio di deprecazione invece di registrare modelli dalla chat. La risposta del selettore è effimera e può essere usata solo dall'utente che l'ha invocata.

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

## Controllo degli accessi e routing

<Tabs>
  <Tab title="DM policy">
    `channels.discord.dmPolicy` controlla l'accesso ai DM. `channels.discord.allowFrom` è la allowlist canonica dei DM.

    - `pairing` (predefinito)
    - `allowlist`
    - `open` (richiede che `channels.discord.allowFrom` includa `"*"`)
    - `disabled`

    Se la policy DM non è aperta, gli utenti sconosciuti vengono bloccati (o invitati ad associare l'account in modalità `pairing`).

    Precedenza multi-account:

    - `channels.discord.accounts.default.allowFrom` si applica solo all'account `default`.
    - Per un account, `allowFrom` ha precedenza sul precedente `dm.allowFrom`.
    - Gli account con nome ereditano `channels.discord.allowFrom` quando il proprio `allowFrom` e il precedente `dm.allowFrom` non sono impostati.
    - Gli account con nome non ereditano `channels.discord.accounts.default.allowFrom`.

    Le impostazioni precedenti `channels.discord.dm.policy` e `channels.discord.dm.allowFrom` vengono ancora lette per compatibilità. `openclaw doctor --fix` le migra a `dmPolicy` e `allowFrom` quando può farlo senza modificare l'accesso.

    Formato di destinazione DM per la consegna:

    - `user:<id>`
    - Menzione `<@id>`

    Gli ID numerici semplici normalmente vengono risolti come ID canale quando è attivo un canale predefinito, ma gli ID elencati nell'effettivo `allowFrom` DM dell'account sono trattati come destinazioni DM utente per compatibilità.

  </Tab>

  <Tab title="DM access groups">
    I DM Discord possono usare voci dinamiche `accessGroup:<name>` in `channels.discord.allowFrom`.

    I nomi dei gruppi di accesso sono condivisi tra i canali messaggi. Usa `type: "message.senders"` per un gruppo statico i cui membri sono espressi nella normale sintassi `allowFrom` di ciascun canale, oppure `type: "discord.channelAudience"` quando l'attuale pubblico `ViewChannel` di un canale Discord deve definire dinamicamente l'appartenenza. Il comportamento condiviso dei gruppi di accesso è documentato qui: [Gruppi di accesso](/it/channels/access-groups).

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

    Un canale di testo Discord non ha un elenco membri separato. `type: "discord.channelAudience"` modella l'appartenenza così: il mittente del DM è membro della guild configurata e dispone attualmente dell'autorizzazione effettiva `ViewChannel` sul canale configurato dopo l'applicazione dei ruoli e delle sovrascritture del canale.

    Esempio: consentire a chiunque possa vedere `#maintainers` di inviare DM al bot, mantenendo i DM chiusi a tutti gli altri.

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

    Le ricerche falliscono in modo chiuso. Se Discord restituisce `Missing Access`, la ricerca del membro fallisce o il canale appartiene a una guild diversa, il mittente del DM viene trattato come non autorizzato.

    Abilita il **Server Members Intent** del Portale sviluppatori Discord per il bot quando usi gruppi di accesso basati sul pubblico del canale. I DM non includono lo stato membro della guild, quindi OpenClaw risolve il membro tramite Discord REST al momento dell'autorizzazione.

  </Tab>

  <Tab title="Guild policy">
    La gestione delle guild è controllata da `channels.discord.groupPolicy`:

    - `open`
    - `allowlist`
    - `disabled`

    La baseline sicura quando `channels.discord` esiste è `allowlist`.

    Comportamento di `allowlist`:

    - la guild deve corrispondere a `channels.discord.guilds` (`id` preferito, slug accettato)
    - allowlist mittenti opzionali: `users` (ID stabili consigliati) e `roles` (solo ID ruolo); se una delle due è configurata, i mittenti sono consentiti quando corrispondono a `users` OPPURE `roles`
    - la corrispondenza diretta per nome/tag è disabilitata per impostazione predefinita; abilita `channels.discord.dangerouslyAllowNameMatching: true` solo come modalità di compatibilità di emergenza
    - nomi/tag sono supportati per `users`, ma gli ID sono più sicuri; `openclaw security audit` avvisa quando vengono usate voci nome/tag
    - se una guild ha `channels` configurato, i canali non elencati vengono negati
    - se una guild non ha un blocco `channels`, tutti i canali in quella guild inclusa nella allowlist sono consentiti

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

    Se imposti solo `DISCORD_BOT_TOKEN` e non crei un blocco `channels.discord`, il fallback di runtime è `groupPolicy="allowlist"` (con un avviso nei log), anche se `channels.defaults.groupPolicy` è `open`.

  </Tab>

  <Tab title="Mentions and group DMs">
    I messaggi della guild sono filtrati tramite menzione per impostazione predefinita.

    Il rilevamento delle menzioni include:

    - menzione esplicita del bot
    - pattern di menzione configurati (`agents.list[].groupChat.mentionPatterns`, fallback `messages.groupChat.mentionPatterns`)
    - comportamento implicito di risposta al bot nei casi supportati

    Quando scrivi messaggi Discord in uscita, usa la sintassi canonica delle menzioni: `<@USER_ID>` per gli utenti, `<#CHANNEL_ID>` per i canali e `<@&ROLE_ID>` per i ruoli. Non usare la forma precedente di menzione nickname `<@!USER_ID>`.

    `requireMention` è configurato per guild/canale (`channels.discord.guilds...`).
    `ignoreOtherMentions` facoltativamente elimina i messaggi che menzionano un altro utente/ruolo ma non il bot (esclusi @everyone/@here).

    DM di gruppo:

    - predefinito: ignorati (`dm.groupEnabled=false`)
    - allowlist opzionale tramite `dm.groupChannels` (ID canale o slug)

  </Tab>
</Tabs>

### Routing agenti basato sui ruoli

Usa `bindings[].match.roles` per instradare i membri delle guild Discord ad agenti diversi in base all'ID ruolo. I binding basati sui ruoli accettano solo ID ruolo e vengono valutati dopo i binding peer o parent-peer e prima dei binding solo guild. Se un binding imposta anche altri campi di corrispondenza (per esempio `peer` + `guildId` + `roles`), tutti i campi configurati devono corrispondere.

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

## Comandi nativi e autenticazione dei comandi

- `commands.native` ha come valore predefinito `"auto"` ed è abilitato per Discord.
- Override per canale: `channels.discord.commands.native`.
- `commands.native=false` salta la registrazione e la pulizia dei comandi slash di Discord durante l'avvio. I comandi registrati in precedenza possono rimanere visibili in Discord finché non li rimuovi dall'app Discord.
- L'autenticazione dei comandi nativi usa le stesse allowlist/policy di Discord della normale gestione dei messaggi.
- I comandi possono essere ancora visibili nell'interfaccia di Discord per utenti non autorizzati; l'esecuzione applica comunque l'autenticazione di OpenClaw e restituisce "not authorized".

Consulta [Comandi slash](/it/tools/slash-commands) per il catalogo e il comportamento dei comandi.

Impostazioni predefinite dei comandi slash:

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

    Nota: `off` disabilita il threading implicito delle risposte. I tag espliciti `[[reply_to_*]]` sono comunque rispettati.
    `first` allega sempre il riferimento implicito di risposta nativa al primo messaggio Discord in uscita per il turno.
    `batched` allega il riferimento implicito di risposta nativa di Discord solo quando il
    turno in ingresso era un batch con debounce di più messaggi. Questo è utile
    quando vuoi risposte native principalmente per chat a raffica ambigue, non per ogni
    turno con singolo messaggio.

    Gli ID dei messaggi vengono esposti nel contesto/nella cronologia, così gli agenti possono indirizzare messaggi specifici.

  </Accordion>

  <Accordion title="Anteprima dello stream live">
    OpenClaw può trasmettere risposte in bozza inviando un messaggio temporaneo e modificandolo man mano che arriva il testo. `channels.discord.streaming` accetta `off` (predefinito) | `partial` | `block` | `progress`. `progress` mantiene una bozza di stato modificabile e la aggiorna con l'avanzamento degli strumenti fino alla consegna finale; `streamMode` è un alias legacy e viene migrato automaticamente.

    Il valore predefinito resta `off` perché le modifiche di anteprima di Discord raggiungono rapidamente i limiti di frequenza quando più bot o gateway condividono un account.

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
    - `block` emette blocchi delle dimensioni di una bozza (usa `draftChunk` per regolare dimensioni e punti di interruzione, vincolati a `textChunkLimit`).
    - Finali con contenuti multimediali, errori e risposte esplicite annullano le modifiche di anteprima in sospeso.
    - `streaming.preview.toolProgress` (predefinito `true`) controlla se gli aggiornamenti di strumenti/avanzamento riutilizzano il messaggio di anteprima.

    Lo streaming dell'anteprima è solo testuale; le risposte multimediali usano la consegna normale come fallback. Quando lo streaming `block` è abilitato esplicitamente, OpenClaw salta lo stream di anteprima per evitare il doppio streaming.

  </Accordion>

  <Accordion title="Cronologia, contesto e comportamento dei thread">
    Contesto della cronologia del server:

    - `channels.discord.historyLimit` predefinito `20`
    - fallback: `messages.groupChat.historyLimit`
    - `0` disabilita

    Controlli della cronologia dei DM:

    - `channels.discord.dmHistoryLimit`
    - `channels.discord.dms["<user_id>"].historyLimit`

    Comportamento dei thread:

    - I thread Discord vengono instradati come sessioni di canale ed ereditano la configurazione del canale padre, salvo override.
    - Le sessioni dei thread ereditano la selezione `/model` a livello di sessione del canale padre come fallback solo per il modello; le selezioni `/model` locali al thread hanno comunque la precedenza e la cronologia della trascrizione del padre non viene copiata a meno che l'ereditarietà della trascrizione sia abilitata.
    - `channels.discord.thread.inheritParent` (predefinito `false`) consente ai nuovi auto-thread di inizializzarsi dalla trascrizione padre. Gli override per account si trovano in `channels.discord.accounts.<id>.thread.inheritParent`.
    - Le reazioni dello strumento messaggi possono risolvere destinazioni DM `user:<id>`.
    - `guilds.<guild>.channels.<channel>.requireMention: false` viene preservato durante il fallback di attivazione della fase di risposta.

    Gli argomenti dei canali vengono inseriti come contesto **non attendibile**. Le allowlist controllano chi può attivare l'agente, non costituiscono un confine completo di redazione del contesto supplementare.

  </Accordion>

  <Accordion title="Sessioni vincolate al thread per subagenti">
    Discord può associare un thread a una destinazione di sessione, così i messaggi successivi in quel thread continuano a essere instradati alla stessa sessione (incluse le sessioni dei subagenti).

    Comandi:

    - `/focus <target>` associa il thread corrente/nuovo a una destinazione di subagente/sessione
    - `/unfocus` rimuove l'associazione del thread corrente
    - `/agents` mostra le esecuzioni attive e lo stato delle associazioni
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
    - Se le associazioni dei thread sono disabilitate per un account, `/focus` e le relative operazioni di associazione dei thread non sono disponibili.

    Consulta [Sub-agenti](/it/tools/subagents), [Agenti ACP](/it/tools/acp-agents) e [Riferimento alla configurazione](/it/gateway/configuration-reference).

  </Accordion>

  <Accordion title="Associazioni persistenti dei canali ACP">
    Per workspace ACP stabili e "sempre attivi", configura associazioni ACP tipizzate di primo livello che puntano a conversazioni Discord.

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
    - In un canale o thread associato, `/new` e `/reset` reimpostano sul posto la stessa sessione ACP. Le associazioni temporanee dei thread possono sovrascrivere la risoluzione della destinazione mentre sono attive.
    - `spawnSessions` controlla la creazione/associazione di thread figli tramite `--thread auto|here`.

    Consulta [Agenti ACP](/it/tools/acp-agents) per i dettagli sul comportamento delle associazioni.

  </Accordion>

  <Accordion title="Notifiche di reazione">
    Modalità di notifica delle reazioni per server:

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
    - fallback sull'emoji dell'identità dell'agente (`agents.list[].identity.emoji`, altrimenti "👀")

    Note:

    - Discord accetta emoji Unicode o nomi di emoji personalizzate.
    - Usa `""` per disabilitare la reazione per un canale o un account.

  </Accordion>

  <Accordion title="Scritture di configurazione">
    Le scritture di configurazione avviate dal canale sono abilitate per impostazione predefinita.

    Questo riguarda i flussi `/config set|unset` (quando le funzionalità di comando sono abilitate).

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
    Instrada il traffico WebSocket del gateway Discord e le ricerche REST di avvio (ID applicazione + risoluzione allowlist) attraverso un proxy HTTP(S) con `channels.discord.proxy`.

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
    Abilita la risoluzione PluralKit per mappare i messaggi tramite proxy all'identità del membro di sistema:

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
    - i nomi visualizzati dei membri vengono confrontati per nome/slug solo quando `channels.discord.dangerouslyAllowNameMatching: true`
    - le ricerche usano l'ID del messaggio originale e sono vincolate a una finestra temporale
    - se la ricerca non riesce, i messaggi tramite proxy vengono trattati come messaggi bot e scartati, a meno che `allowBots=true`

  </Accordion>

  <Accordion title="Alias delle menzioni in uscita">
    Usa `mentionAliases` quando gli agenti hanno bisogno di menzioni in uscita deterministiche per utenti Discord noti. Le chiavi sono handle senza la `@` iniziale; i valori sono ID utente Discord. Handle sconosciuti, `@everyone`, `@here` e menzioni dentro span di codice Markdown restano invariati.

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
    Gli aggiornamenti della presenza vengono applicati quando imposti uno stato o un campo attività, oppure quando abiliti la presenza automatica.

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

    - 0: In riproduzione
    - 1: Streaming (richiede `activityUrl`)
    - 2: In ascolto
    - 3: In visione
    - 4: Personalizzato (usa il testo dell'attività come stato; l'emoji è opzionale)
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

    La presenza automatica mappa la disponibilità del runtime allo stato Discord: integro => online, degradato o sconosciuto => inattivo, esaurito o non disponibile => non disturbare. Override testuali opzionali:

    - `autoPresence.healthyText`
    - `autoPresence.degradedText`
    - `autoPresence.exhaustedText` (supporta il placeholder `{reason}`)

  </Accordion>

  <Accordion title="Approvazioni in Discord">
    Discord supporta la gestione delle approvazioni basata su pulsanti nei DM e può facoltativamente pubblicare richieste di approvazione nel canale di origine.

    Percorso di configurazione:

    - `channels.discord.execApprovals.enabled`
    - `channels.discord.execApprovals.approvers` (facoltativo; ripiega su `commands.ownerAllowFrom` quando possibile)
    - `channels.discord.execApprovals.target` (`dm` | `channel` | `both`, predefinito: `dm`)
    - `agentFilter`, `sessionFilter`, `cleanupAfterResolve`

    Discord abilita automaticamente le approvazioni exec native quando `enabled` non è impostato oppure è `"auto"` e almeno un approvatore può essere risolto, da `execApprovals.approvers` oppure da `commands.ownerAllowFrom`. Discord non deduce gli approvatori exec da `allowFrom` del canale, da `dm.allowFrom` legacy o da `defaultTo` dei messaggi diretti. Imposta `enabled: false` per disabilitare esplicitamente Discord come client di approvazione nativo.

    Per comandi di gruppo sensibili riservati al proprietario, come `/diagnostics` e `/export-trajectory`, OpenClaw invia le richieste di approvazione e i risultati finali in privato. Prova prima il DM Discord quando il proprietario che invoca il comando ha una rotta proprietario Discord; se non è disponibile, ripiega sulla prima rotta proprietario disponibile da `commands.ownerAllowFrom`, come Telegram.

    Quando `target` è `channel` o `both`, la richiesta di approvazione è visibile nel canale. Solo gli approvatori risolti possono usare i pulsanti; gli altri utenti ricevono un rifiuto effimero. Le richieste di approvazione includono il testo del comando, quindi abilita la consegna nel canale solo in canali attendibili. Se l'ID del canale non può essere derivato dalla chiave di sessione, OpenClaw ripiega sulla consegna via DM.

    Discord esegue anche il rendering dei pulsanti di approvazione condivisi usati dagli altri canali chat. L'adapter Discord nativo aggiunge principalmente il routing DM degli approvatori e la distribuzione ai canali.
    Quando questi pulsanti sono presenti, sono la UX di approvazione principale; OpenClaw
    dovrebbe includere un comando manuale `/approve` solo quando il risultato dello strumento indica
    che le approvazioni via chat non sono disponibili o che l'approvazione manuale è l'unico percorso.
    Se il runtime di approvazione nativo di Discord non è attivo, OpenClaw mantiene visibile
    la richiesta locale deterministica `/approve <id> <decision>`. Se il
    runtime è attivo ma non è possibile consegnare una scheda nativa a nessun target,
    OpenClaw invia un avviso di fallback nella stessa chat con il comando `/approve`
    esatto dall'approvazione in sospeso.

    L'autenticazione Gateway e la risoluzione delle approvazioni seguono il contratto client Gateway condiviso (gli ID `plugin:` vengono risolti tramite `plugin.approval.resolve`; gli altri ID tramite `exec.approval.resolve`). Le approvazioni scadono dopo 30 minuti per impostazione predefinita.

    Vedi [Approvazioni exec](/it/tools/exec-approvals).

  </Accordion>
</AccordionGroup>

## Strumenti e gate di azione

Le azioni sui messaggi Discord includono azioni di messaggistica, amministrazione dei canali, moderazione, presenza e metadati.

Esempi principali:

- messaggistica: `sendMessage`, `readMessages`, `editMessage`, `deleteMessage`, `threadReply`
- reazioni: `react`, `reactions`, `emojiList`
- moderazione: `timeout`, `kick`, `ban`
- presenza: `setPresence`

L'azione `event-create` accetta un parametro facoltativo `image` (URL o percorso file locale) per impostare l'immagine di copertina dell'evento programmato.

I gate di azione si trovano sotto `channels.discord.actions.*`.

Comportamento predefinito dei gate:

| Gruppo di azioni                                                                                                                                                         | Predefinito |
| ------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ----------- |
| reactions, messages, threads, pins, polls, search, memberInfo, roleInfo, channelInfo, channels, voiceStatus, events, stickers, emojiUploads, stickerUploads, permissions | abilitato   |
| roles                                                                                                                                                                    | disabilitato |
| moderation                                                                                                                                                               | disabilitato |
| presence                                                                                                                                                                 | disabilitato |

## UI Components v2

OpenClaw usa i componenti Discord v2 per le approvazioni exec e i marcatori tra contesti. Le azioni sui messaggi Discord possono anche accettare `components` per UI personalizzate (avanzato; richiede la costruzione di un payload componente tramite lo strumento discord), mentre gli `embeds` legacy restano disponibili ma non sono consigliati.

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

Discord ha due superfici vocali distinte: i **canali vocali** in tempo reale (conversazioni continue) e gli **allegati di messaggi vocali** (il formato di anteprima con forma d'onda). Il Gateway supporta entrambe.

### Canali vocali

Checklist di configurazione:

1. Abilita Message Content Intent nel Discord Developer Portal.
2. Abilita Server Members Intent quando vengono usate allowlist di ruoli/utenti.
3. Invita il bot con gli ambiti `bot` e `applications.commands`.
4. Concedi Connect, Speak, Send Messages e Read Message History nel canale vocale di destinazione.
5. Abilita i comandi nativi (`commands.native` o `channels.discord.commands.native`).
6. Configura `channels.discord.voice`.

Usa `/vc join|leave|status` per controllare le sessioni. Il comando usa l'agente predefinito dell'account e segue le stesse regole di allowlist e policy di gruppo degli altri comandi Discord.

```bash
/vc join channel:<voice-channel-id>
/vc status
/vc leave
```

Esempio di join automatico:

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
- `voice.model` sovrascrive l'LLM usato solo per le risposte del canale vocale Discord. Lascialo non impostato per ereditare il modello dell'agente instradato.
- STT usa `tools.media.audio`; `voice.model` non influisce sulla trascrizione.
- Gli override `systemPrompt` Discord per canale si applicano ai turni di trascrizione vocale per quel canale vocale.
- I turni di trascrizione vocale derivano lo stato di proprietario da `allowFrom` di Discord (o `dm.allowFrom`); i parlanti non proprietari non possono accedere agli strumenti riservati al proprietario (per esempio `gateway` e `cron`).
- La voce Discord è opt-in per configurazioni solo testo; imposta `channels.discord.voice.enabled=true` (oppure mantieni un blocco `channels.discord.voice` esistente) per abilitare i comandi `/vc`, il runtime vocale e l'intent Gateway `GuildVoiceStates`.
- `channels.discord.intents.voiceStates` può sovrascrivere esplicitamente la sottoscrizione all'intent degli stati vocali. Lascialo non impostato perché l'intent segua l'abilitazione vocale effettiva.
- `voice.daveEncryption` e `voice.decryptionFailureTolerance` vengono passati alle opzioni di join di `@discordjs/voice`.
- I valori predefiniti di `@discordjs/voice` sono `daveEncryption=true` e `decryptionFailureTolerance=24` se non impostati.
- `voice.connectTimeoutMs` controlla l'attesa Ready iniziale di `@discordjs/voice` per `/vc join` e i tentativi di join automatico. Predefinito: `30000`.
- `voice.reconnectGraceMs` controlla per quanto tempo OpenClaw attende che una sessione vocale disconnessa inizi a riconnettersi prima di distruggerla. Predefinito: `15000`.
- OpenClaw osserva anche gli errori di decrittazione in ricezione e recupera automaticamente uscendo dal canale vocale e rientrando dopo errori ripetuti in una finestra breve.
- Se i log di ricezione mostrano ripetutamente `DecryptionFailed(UnencryptedWhenPassthroughDisabled)` dopo l'aggiornamento, raccogli un report delle dipendenze e i log. La linea `@discordjs/voice` inclusa comprende la correzione upstream del padding dalla PR discord.js #11449, che ha chiuso l'issue discord.js #11419.

Pipeline del canale vocale:

- La cattura PCM di Discord viene convertita in un file temporaneo WAV.
- `tools.media.audio` gestisce STT, per esempio `openai/gpt-4o-mini-transcribe`.
- La trascrizione viene inviata attraverso l'ingresso e il routing Discord mentre l'LLM di risposta viene eseguito con una policy di output vocale che nasconde lo strumento `tts` dell'agente e richiede testo restituito, perché la voce Discord possiede la riproduzione TTS finale.
- `voice.model`, quando impostato, sovrascrive solo l'LLM di risposta per questo turno del canale vocale.
- `voice.tts` viene unito sopra `messages.tts`; l'audio risultante viene riprodotto nel canale collegato.

Le credenziali vengono risolte per componente: auth della rotta LLM per `voice.model`, auth STT per `tools.media.audio` e auth TTS per `messages.tts`/`voice.tts`.

### Messaggi vocali

I messaggi vocali Discord mostrano un'anteprima della forma d'onda e richiedono audio OGG/Opus. OpenClaw genera automaticamente la forma d'onda, ma richiede `ffmpeg` e `ffprobe` sull'host Gateway per ispezionare e convertire.

- Fornisci un **percorso file locale** (gli URL vengono rifiutati).
- Ometti il contenuto testuale (Discord rifiuta testo + messaggio vocale nello stesso payload).
- È accettato qualsiasi formato audio; OpenClaw converte in OGG/Opus se necessario.

```bash
message(action="send", channel="discord", target="channel:123", path="/path/to/audio.mp3", asVoice=true)
```

## Risoluzione dei problemi

<AccordionGroup>
  <Accordion title="Intent non consentiti usati o il bot non vede messaggi della guild">

    - abilita Message Content Intent
    - abilita Server Members Intent quando dipendi dalla risoluzione di utenti/membri
    - riavvia il Gateway dopo aver modificato gli intent

  </Accordion>

  <Accordion title="Messaggi della guild bloccati inaspettatamente">

    - verifica `groupPolicy`
    - verifica l'allowlist della guild sotto `channels.discord.guilds`
    - se esiste la mappa `channels` della guild, sono consentiti solo i canali elencati
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

    - `groupPolicy="allowlist"` senza allowlist di guild/canale corrispondente
    - `requireMention` configurato nel punto sbagliato (deve trovarsi sotto `channels.discord.guilds` o nella voce del canale)
    - mittente bloccato dall'allowlist `users` di guild/canale

  </Accordion>

  <Accordion title="Turni Discord lunghi o risposte duplicate">

    Log tipici:

    - `Slow listener detected ...`
    - `stuck session: sessionKey=agent:...:discord:... state=processing ...`

    Manopole della coda Gateway Discord:

    - account singolo: `channels.discord.eventQueue.listenerTimeout`
    - multi-account: `channels.discord.accounts.<accountId>.eventQueue.listenerTimeout`
    - questo controlla solo il lavoro dei listener del Gateway Discord, non la durata del turno dell'agente

    Discord non applica un timeout di proprietà del canale ai turni agente in coda. I listener dei messaggi passano il controllo immediatamente, e le esecuzioni Discord in coda preservano l'ordine per sessione finché il ciclo di vita di sessione/strumento/runtime completa o interrompe il lavoro.

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

  <Accordion title="Avvisi di timeout nella ricerca dei metadati Gateway">
    OpenClaw recupera i metadati Discord `/gateway/bot` prima di connettersi. Gli errori transitori ripiegano sull'URL Gateway predefinito di Discord e sono limitati nei log.

    Manopole di timeout dei metadati:

    - account singolo: `channels.discord.gatewayInfoTimeoutMs`
    - multi-account: `channels.discord.accounts.<accountId>.gatewayInfoTimeoutMs`
    - fallback env quando la configurazione non è impostata: `OPENCLAW_DISCORD_GATEWAY_INFO_TIMEOUT_MS`
    - predefinito: `30000` (30 secondi), max: `120000`

  </Accordion>

  <Accordion title="Riavvii per timeout READY del Gateway">
    OpenClaw attende l'evento `READY` del gateway di Discord durante l'avvio e dopo le riconnessioni runtime. Le configurazioni multi-account con avvio scaglionato possono richiedere una finestra READY di avvio più lunga di quella predefinita.

    Controlli del timeout READY:

    - avvio con account singolo: `channels.discord.gatewayReadyTimeoutMs`
    - avvio multi-account: `channels.discord.accounts.<accountId>.gatewayReadyTimeoutMs`
    - fallback env di avvio quando la configurazione non è impostata: `OPENCLAW_DISCORD_READY_TIMEOUT_MS`
    - valore predefinito di avvio: `15000` (15 secondi), massimo: `120000`
    - runtime con account singolo: `channels.discord.gatewayRuntimeReadyTimeoutMs`
    - runtime multi-account: `channels.discord.accounts.<accountId>.gatewayRuntimeReadyTimeoutMs`
    - fallback env runtime quando la configurazione non è impostata: `OPENCLAW_DISCORD_RUNTIME_READY_TIMEOUT_MS`
    - valore predefinito runtime: `30000` (30 secondi), massimo: `120000`

  </Accordion>

  <Accordion title="Disallineamenti nell'audit dei permessi">
    I controlli dei permessi di `channels status --probe` funzionano solo per ID di canale numerici.

    Se usi chiavi slug, la corrispondenza runtime può comunque funzionare, ma probe non può verificare completamente i permessi.

  </Accordion>

  <Accordion title="Problemi di DM e associazione">

    - DM disabilitati: `channels.discord.dm.enabled=false`
    - criterio DM disabilitato: `channels.discord.dmPolicy="disabled"` (legacy: `channels.discord.dm.policy`)
    - in attesa dell'approvazione dell'associazione in modalità `pairing`

  </Accordion>

  <Accordion title="Loop da bot a bot">
    Per impostazione predefinita, i messaggi creati da bot vengono ignorati.

    Se imposti `channels.discord.allowBots=true`, usa regole rigorose di menzione e allowlist per evitare comportamenti di loop.
    Preferisci `channels.discord.allowBots="mentions"` per accettare solo i messaggi dei bot che menzionano il bot.

```json5
{
  channels: {
    discord: {
      accounts: {
        mantis: {
          // Mantis ascolta gli altri bot solo quando la menzionano.
          allowBots: "mentions",
        },
        molty: {
          // Molty ascolta tutti i messaggi Discord creati da bot.
          allowBots: true,
          mentionAliases: {
            // Consente a Molty di scrivere "@Mantis" e inviare una vera menzione Discord.
            Mantis: "MANTIS_DISCORD_USER_ID",
          },
        },
      },
    },
  },
}
```

  </Accordion>

  <Accordion title="Cali di STT vocale con DecryptionFailed(...)">

    - mantieni OpenClaw aggiornato (`openclaw update`) in modo che sia presente la logica di recupero della ricezione vocale di Discord
    - conferma `channels.discord.voice.daveEncryption=true` (predefinito)
    - parti da `channels.discord.voice.decryptionFailureTolerance=24` (valore predefinito upstream) e regola solo se necessario
    - controlla nei log:
      - `discord voice: DAVE decrypt failures detected`
      - `discord voice: repeated decrypt failures; attempting rejoin`
    - se gli errori continuano dopo il rientro automatico, raccogli i log e confrontali con la cronologia upstream della ricezione DAVE in [discord.js #11419](https://github.com/discordjs/discord.js/issues/11419) e [discord.js #11449](https://github.com/discordjs/discord.js/pull/11449)

  </Accordion>
</AccordionGroup>

## Riferimento di configurazione

Riferimento principale: [Riferimento di configurazione - Discord](/it/gateway/config-channels#discord).

<Accordion title="Campi Discord ad alto segnale">

- avvio/autenticazione: `enabled`, `token`, `accounts.*`, `allowBots`
- criterio: `groupPolicy`, `dm.*`, `guilds.*`, `guilds.*.channels.*`
- comando: `commands.native`, `commands.useAccessGroups`, `configWrites`, `slashCommand.*`
- coda eventi: `eventQueue.listenerTimeout` (budget del listener), `eventQueue.maxQueueSize`, `eventQueue.maxConcurrency`
- gateway: `gatewayInfoTimeoutMs`, `gatewayReadyTimeoutMs`, `gatewayRuntimeReadyTimeoutMs`
- risposta/cronologia: `replyToMode`, `historyLimit`, `dmHistoryLimit`, `dms.*.historyLimit`
- consegna: `textChunkLimit`, `chunkMode`, `maxLinesPerMessage`
- streaming: `streaming` (alias legacy: `streamMode`), `streaming.preview.toolProgress`, `draftChunk`, `blockStreaming`, `blockStreamingCoalesce`
- media/riprova: `mediaMaxMb` (limita i caricamenti Discord in uscita, predefinito `100MB`), `retry`
- azioni: `actions.*`
- presenza: `activity`, `status`, `activityType`, `activityUrl`
- UI: `ui.components.accentColor`
- funzionalità: `threadBindings`, `bindings[]` di livello superiore (`type: "acp"`), `pluralkit`, `execApprovals`, `intents`, `agentComponents`, `heartbeat`, `responsePrefix`

</Accordion>

## Sicurezza e operazioni

- Tratta i token dei bot come segreti (`DISCORD_BOT_TOKEN` preferito negli ambienti supervisionati).
- Concedi i permessi Discord minimi necessari.
- Se lo stato/distribuzione dei comandi è obsoleto, riavvia il gateway e ricontrolla con `openclaw channels status --probe`.

## Correlati

<CardGroup cols={2}>
  <Card title="Associazione" icon="link" href="/it/channels/pairing">
    Associa un utente Discord al gateway.
  </Card>
  <Card title="Gruppi" icon="users" href="/it/channels/groups">
    Comportamento di chat di gruppo e allowlist.
  </Card>
  <Card title="Routing dei canali" icon="route" href="/it/channels/channel-routing">
    Instrada i messaggi in ingresso agli agenti.
  </Card>
  <Card title="Sicurezza" icon="shield" href="/it/gateway/security">
    Modello di minaccia e hardening.
  </Card>
  <Card title="Routing multi-agente" icon="sitemap" href="/it/concepts/multi-agent">
    Associa guild e canali agli agenti.
  </Card>
  <Card title="Comandi slash" icon="terminal" href="/it/tools/slash-commands">
    Comportamento dei comandi nativi.
  </Card>
</CardGroup>
