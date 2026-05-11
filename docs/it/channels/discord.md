---
read_when:
    - Lavorare sulle funzionalità del canale Discord
summary: Stato del supporto per bot Discord, funzionalità e configurazione
title: Discord
x-i18n:
    generated_at: "2026-05-11T20:20:16Z"
    model: gpt-5.5
    provider: openai
    source_hash: 70107cf53c44f80e42f99f670aacf6eed8b77d839c05bccc853cd91a7273e5aa
    source_path: channels/discord.md
    workflow: 16
---

Pronto per DM e canali guild tramite il Gateway ufficiale di Discord.

<CardGroup cols={3}>
  <Card title="Abbinamento" icon="link" href="/it/channels/pairing">
    I DM di Discord usano per impostazione predefinita la modalità di abbinamento.
  </Card>
  <Card title="Comandi slash" icon="terminal" href="/it/tools/slash-commands">
    Comportamento nativo dei comandi e catalogo dei comandi.
  </Card>
  <Card title="Risoluzione dei problemi del canale" icon="wrench" href="/it/channels/troubleshooting">
    Diagnostica tra canali e flusso di riparazione.
  </Card>
</CardGroup>

## Configurazione rapida

Dovrai creare una nuova applicazione con un bot, aggiungere il bot al tuo server e abbinarlo a OpenClaw. Consigliamo di aggiungere il bot al tuo server privato. Se non ne hai ancora uno, [creane prima uno](https://support.discord.com/hc/en-us/articles/204849977-How-do-I-create-a-server) (scegli **Create My Own > For me and my friends**).

<Steps>
  <Step title="Crea un'applicazione Discord e un bot">
    Vai al [Discord Developer Portal](https://discord.com/developers/applications) e fai clic su **New Application**. Assegnagli un nome come "OpenClaw".

    Fai clic su **Bot** nella barra laterale. Imposta **Username** su qualunque nome usi per il tuo agente OpenClaw.

  </Step>

  <Step title="Abilita gli intent privilegiati">
    Sempre nella pagina **Bot**, scorri verso il basso fino a **Privileged Gateway Intents** e abilita:

    - **Message Content Intent** (obbligatorio)
    - **Server Members Intent** (consigliato; obbligatorio per le allowlist dei ruoli e la corrispondenza nome-ID)
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

    **Autorizzazioni generali**
      - Visualizzare canali
    **Autorizzazioni testo**
      - Inviare messaggi
      - Leggere la cronologia dei messaggi
      - Incorporare link
      - Allegare file
      - Aggiungere reazioni (facoltativo)

    Questo è l'insieme di base per i normali canali di testo. Se prevedi di pubblicare nei thread di Discord, inclusi i flussi di lavoro dei canali forum o media che creano o continuano un thread, abilita anche **Send Messages in Threads**.
    Copia l'URL generato in fondo, incollalo nel browser, seleziona il tuo server e fai clic su **Continue** per connetterti. Ora dovresti vedere il bot nel server Discord.

  </Step>

  <Step title="Abilita la modalità sviluppatore e raccogli i tuoi ID">
    Tornando nell'app Discord, devi abilitare la modalità sviluppatore per poter copiare gli ID interni.

    1. Fai clic su **User Settings** (icona a forma di ingranaggio accanto al tuo avatar) → **Advanced** → attiva **Developer Mode**
    2. Fai clic con il pulsante destro sull'**icona del server** nella barra laterale → **Copy Server ID**
    3. Fai clic con il pulsante destro sul **tuo avatar** → **Copy User ID**

    Salva il tuo **Server ID** e **User ID** insieme al tuo Bot Token: invierai tutti e tre a OpenClaw nel passaggio successivo.

  </Step>

  <Step title="Consenti i DM dai membri del server">
    Affinché l'abbinamento funzioni, Discord deve consentire al bot di inviarti DM. Fai clic con il pulsante destro sull'**icona del server** → **Privacy Settings** → attiva **Direct Messages**.

    Questo permette ai membri del server (inclusi i bot) di inviarti DM. Mantieni questa opzione abilitata se vuoi usare i DM di Discord con OpenClaw. Se prevedi di usare solo canali guild, puoi disabilitare i DM dopo l'abbinamento.

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
    Per le installazioni come servizio gestito, esegui `openclaw gateway install` da una shell in cui `DISCORD_BOT_TOKEN` è presente, oppure memorizza la variabile in `~/.openclaw/.env`, in modo che il servizio possa risolvere il SecretRef env dopo il riavvio.
    Se il tuo host è bloccato o limitato dalla ricerca dell'applicazione all'avvio di Discord, imposta l'ID applicazione/client Discord dal Developer Portal in modo che l'avvio possa saltare quella chiamata REST. Usa `channels.discord.applicationId` per l'account predefinito, oppure `channels.discord.accounts.<accountId>.applicationId` quando esegui più bot Discord.

  </Step>

  <Step title="Configura OpenClaw e abbina">

    <Tabs>
      <Tab title="Chiedi al tuo agente">
        Chatta con il tuo agente OpenClaw su qualsiasi canale esistente (ad esempio Telegram) e comunicaglielo. Se Discord è il tuo primo canale, usa invece la scheda CLI / configurazione.

        > "Ho già impostato il token del bot Discord nella configurazione. Completa la configurazione di Discord con User ID `<user_id>` e Server ID `<server_id>`."
      </Tab>
      <Tab title="CLI / configurazione">
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

        Per configurazioni scriptate o remote, scrivi lo stesso blocco JSON5 con `openclaw config patch --file ./discord.patch.json5 --dry-run` e poi riesegui senza `--dry-run`. I valori `token` in testo normale sono supportati. Anche i valori SecretRef sono supportati per `channels.discord.token` tra provider env/file/exec. Vedi [Gestione dei segreti](/it/gateway/secrets).

        Per più bot Discord, tieni ogni token del bot e ID applicazione sotto il relativo account. Un `channels.discord.applicationId` di livello superiore viene ereditato dagli account, quindi impostalo lì solo quando ogni account deve usare lo stesso ID applicazione.

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
    Attendi che il gateway sia in esecuzione, poi invia un DM al tuo bot in Discord. Risponderà con un codice di abbinamento.

    <Tabs>
      <Tab title="Chiedi al tuo agente">
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

    Ora dovresti poter chattare con il tuo agente in Discord tramite DM.

  </Step>
</Steps>

<Note>
La risoluzione dei token è consapevole dell'account. I valori token della configurazione prevalgono sul fallback env. `DISCORD_BOT_TOKEN` viene usato solo per l'account predefinito.
Se due account Discord abilitati risolvono allo stesso token del bot, OpenClaw avvia un solo monitor gateway per quel token. Un token proveniente dalla configurazione prevale sul fallback env predefinito; altrimenti vince il primo account abilitato e l'account duplicato viene segnalato come disabilitato.
Per chiamate in uscita avanzate (strumento messaggi/azioni del canale), per quella chiamata viene usato un `token` esplicito per chiamata. Questo si applica alle azioni di invio e lettura/sonda (ad esempio lettura/ricerca/recupero/thread/pin/autorizzazioni). Le impostazioni di policy/retry dell'account provengono comunque dall'account selezionato nello snapshot di runtime attivo.
</Note>

## Consigliato: configura uno spazio di lavoro guild

Una volta che i DM funzionano, puoi configurare il tuo server Discord come spazio di lavoro completo in cui ogni canale ottiene la propria sessione agente con il proprio contesto. Questo è consigliato per server privati in cui ci siete solo tu e il tuo bot.

<Steps>
  <Step title="Aggiungi il tuo server alla allowlist guild">
    Questo abilita il tuo agente a rispondere in qualsiasi canale sul tuo server, non solo nei DM.

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

  <Step title="Consenti risposte senza @menzione">
    Per impostazione predefinita, il tuo agente risponde nei canali guild solo quando viene @menzionato. Per un server privato, probabilmente vuoi che risponda a ogni messaggio.

    Nei canali guild, le normali risposte finali dell'assistente restano private per impostazione predefinita. L'output Discord visibile deve essere inviato esplicitamente con lo strumento `message`, così l'agente può restare in ascolto per impostazione predefinita e pubblicare solo quando decide che una risposta nel canale è utile.

    Ciò significa che il modello selezionato deve chiamare gli strumenti in modo affidabile. Se Discord mostra la digitazione e i log mostrano l'uso dei token ma nessun messaggio pubblicato, controlla nel log della sessione se c'è testo dell'assistente con `didSendViaMessagingTool: false`. Questo significa che il modello ha prodotto una risposta finale privata invece di chiamare `message(action=send)`. Passa a un modello più efficace nella chiamata degli strumenti, oppure usa la configurazione sotto per ripristinare le risposte finali automatiche legacy.

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

        Per ripristinare le risposte finali automatiche legacy per le stanze di gruppo/canale, imposta `messages.groupChat.visibleReplies: "automatic"`.

      </Tab>
    </Tabs>

  </Step>

  <Step title="Pianifica la memoria nei canali guild">
    Per impostazione predefinita, la memoria a lungo termine (MEMORY.md) viene caricata solo nelle sessioni DM. I canali guild non caricano automaticamente MEMORY.md.

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

Ora crea alcuni canali sul tuo server Discord e inizia a chattare. Il tuo agente può vedere il nome del canale e ogni canale ottiene la propria sessione isolata: così puoi configurare `#coding`, `#home`, `#research` o qualunque cosa si adatti al tuo flusso di lavoro.

## Modello di runtime

- Gateway possiede la connessione Discord.
- L'instradamento delle risposte è deterministico: le risposte in ingresso da Discord tornano a Discord.
- I metadati di guild/canale Discord vengono aggiunti al prompt del modello come contesto non attendibile, non come prefisso di risposta visibile all'utente. Se un modello copia nuovamente quell'involucro, OpenClaw rimuove i metadati copiati dalle risposte in uscita e dal futuro contesto di replay.
- Per impostazione predefinita (`session.dmScope=main`), le chat dirette condividono la sessione principale dell'agente (`agent:main:main`).
- I canali guild sono chiavi di sessione isolate (`agent:<agentId>:discord:channel:<channelId>`).
- I DM di gruppo sono ignorati per impostazione predefinita (`channels.discord.dm.groupEnabled=false`).
- I comandi slash nativi vengono eseguiti in sessioni di comando isolate (`agent:<agentId>:discord:slash:<userId>`), pur continuando a portare `CommandTargetSessionKey` alla sessione di conversazione instradata.
- La consegna degli annunci cron/heartbeat solo testo a Discord usa una sola volta la risposta finale visibile all'assistente. I payload multimediali e dei componenti strutturati restano multi-messaggio quando l'agente emette più payload consegnabili.

## Canali forum

I canali forum e media di Discord accettano solo post nei thread. OpenClaw supporta due modi per crearli:

- Invia un messaggio al forum padre (`channel:<forumId>`) per creare automaticamente un thread. Il titolo del thread usa la prima riga non vuota del messaggio.
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

OpenClaw supporta contenitori di componenti Discord v2 per i messaggi degli agenti. Usa lo strumento messaggi con un payload `components`. I risultati delle interazioni vengono instradati all'agente come normali messaggi in ingresso e seguono le impostazioni Discord `replyToMode` esistenti.

Blocchi supportati:

- `text`, `section`, `separator`, `actions`, `media-gallery`, `file`
- Le righe di azione consentono fino a 5 pulsanti o un singolo menu di selezione
- Tipi di selezione: `string`, `user`, `role`, `mentionable`, `channel`

Per impostazione predefinita, i componenti sono monouso. Imposta `components.reusable=true` per consentire a pulsanti, selezioni e moduli di essere usati più volte fino alla scadenza.

Per limitare chi può fare clic su un pulsante, imposta `allowedUsers` su quel pulsante (ID utente Discord, tag o `*`). Quando configurato, gli utenti non corrispondenti ricevono un rifiuto effimero.

I comandi slash `/model` e `/models` aprono un selettore interattivo del modello con menu a discesa per provider, modello e runtime compatibile, più un passaggio Invia. `/models add` è deprecato e ora restituisce un messaggio di deprecazione invece di registrare modelli dalla chat. La risposta del selettore è effimera e solo l'utente che l'ha invocata può usarla. I menu di selezione Discord sono limitati a 25 opzioni, quindi aggiungi voci `provider/*` a `agents.defaults.models` quando vuoi che il selettore mostri modelli rilevati dinamicamente solo per provider selezionati come `openai-codex` o `vllm`.

Allegati file:

- I blocchi `file` devono puntare a un riferimento di allegato (`attachment://<filename>`)
- Fornisci l'allegato tramite `media`/`path`/`filePath` (file singolo); usa `media-gallery` per più file
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
  <Tab title="Criterio DM">
    `channels.discord.dmPolicy` controlla l'accesso ai DM. `channels.discord.allowFrom` è la allowlist DM canonica.

    - `pairing` (predefinito)
    - `allowlist`
    - `open` (richiede che `channels.discord.allowFrom` includa `"*"`)
    - `disabled`

    Se il criterio DM non è aperto, gli utenti sconosciuti vengono bloccati (o invitati ad associare l'account in modalità `pairing`).

    Precedenza multi-account:

    - `channels.discord.accounts.default.allowFrom` si applica solo all'account `default`.
    - Per un account, `allowFrom` ha precedenza sul legacy `dm.allowFrom`.
    - Gli account con nome ereditano `channels.discord.allowFrom` quando i propri `allowFrom` e il legacy `dm.allowFrom` non sono impostati.
    - Gli account con nome non ereditano `channels.discord.accounts.default.allowFrom`.

    I legacy `channels.discord.dm.policy` e `channels.discord.dm.allowFrom` vengono ancora letti per compatibilità. `openclaw doctor --fix` li migra a `dmPolicy` e `allowFrom` quando può farlo senza modificare l'accesso.

    Formato target DM per la consegna:

    - `user:<id>`
    - menzione `<@id>`

    Gli ID numerici semplici normalmente vengono risolti come ID canale quando è attivo un valore predefinito di canale, ma gli ID elencati nel DM `allowFrom` effettivo dell'account vengono trattati come target DM utente per compatibilità.

  </Tab>

  <Tab title="Gruppi di accesso">
    I DM Discord e l'autorizzazione dei comandi testuali possono usare voci dinamiche `accessGroup:<name>` in `channels.discord.allowFrom`.

    I nomi dei gruppi di accesso sono condivisi tra i canali di messaggistica. Usa `type: "message.senders"` per un gruppo statico i cui membri sono espressi nella normale sintassi `allowFrom` di ciascun canale, oppure `type: "discord.channelAudience"` quando il pubblico `ViewChannel` corrente di un canale Discord deve definire dinamicamente l'appartenenza. Il comportamento condiviso dei gruppi di accesso è documentato qui: [Gruppi di accesso](/it/channels/access-groups).

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

    Un canale testuale Discord non ha un elenco membri separato. `type: "discord.channelAudience"` modella l'appartenenza così: il mittente DM è membro della guild configurata e attualmente dispone dell'autorizzazione effettiva `ViewChannel` sul canale configurato dopo l'applicazione dei ruoli e delle sovrascritture del canale.

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

    Le ricerche falliscono chiuse. Se Discord restituisce `Missing Access`, la ricerca del membro fallisce, o il canale appartiene a una guild diversa, il mittente DM viene trattato come non autorizzato.

    Abilita **Server Members Intent** nel Discord Developer Portal per il bot quando usi gruppi di accesso basati sul pubblico del canale. I DM non includono lo stato dei membri della guild, quindi OpenClaw risolve il membro tramite Discord REST al momento dell'autorizzazione.

  </Tab>

  <Tab title="Criterio guild">
    La gestione delle guild è controllata da `channels.discord.groupPolicy`:

    - `open`
    - `allowlist`
    - `disabled`

    La baseline sicura quando esiste `channels.discord` è `allowlist`.

    Comportamento di `allowlist`:

    - la guild deve corrispondere a `channels.discord.guilds` (`id` preferito, slug accettato)
    - allowlist opzionali dei mittenti: `users` (ID stabili consigliati) e `roles` (solo ID ruolo); se una delle due è configurata, i mittenti sono consentiti quando corrispondono a `users` O `roles`
    - la corrispondenza diretta per nome/tag è disabilitata per impostazione predefinita; abilita `channels.discord.dangerouslyAllowNameMatching: true` solo come modalità di compatibilità di emergenza
    - nomi/tag sono supportati per `users`, ma gli ID sono più sicuri; `openclaw security audit` avvisa quando vengono usate voci nome/tag
    - se una guild ha `channels` configurato, i canali non elencati vengono negati
    - se una guild non ha un blocco `channels`, tutti i canali in quella guild allowlisted sono consentiti

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

  <Tab title="Menzioni e DM di gruppo">
    I messaggi delle guild richiedono una menzione per impostazione predefinita.

    Il rilevamento delle menzioni include:

    - menzione esplicita del bot
    - pattern di menzione configurati (`agents.list[].groupChat.mentionPatterns`, fallback `messages.groupChat.mentionPatterns`)
    - comportamento implicito di risposta al bot nei casi supportati

    Quando scrivi messaggi Discord in uscita, usa la sintassi canonica delle menzioni: `<@USER_ID>` per gli utenti, `<#CHANNEL_ID>` per i canali e `<@&ROLE_ID>` per i ruoli. Non usare la forma legacy di menzione nickname `<@!USER_ID>`.

    `requireMention` è configurato per guild/canale (`channels.discord.guilds...`).
    `ignoreOtherMentions` elimina facoltativamente i messaggi che menzionano un altro utente/ruolo ma non il bot (esclusi @everyone/@here).

    DM di gruppo:

    - predefinito: ignorati (`dm.groupEnabled=false`)
    - allowlist opzionale tramite `dm.groupChannels` (ID canale o slug)

  </Tab>
</Tabs>

### Instradamento degli agenti basato sui ruoli

Usa `bindings[].match.roles` per instradare i membri della guild Discord ad agenti diversi in base all'ID ruolo. I binding basati sui ruoli accettano solo ID ruolo e vengono valutati dopo i binding peer o parent-peer e prima dei binding solo guild. Se un binding imposta anche altri campi di corrispondenza (per esempio `peer` + `guildId` + `roles`), tutti i campi configurati devono corrispondere.

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
- L'autorizzazione dei comandi nativi usa le stesse allowlist/policy di Discord della normale gestione dei messaggi.
- I comandi possono comunque essere visibili nell'interfaccia utente di Discord per gli utenti non autorizzati; l'esecuzione applica comunque l'autorizzazione di OpenClaw e restituisce "non autorizzato".

Vedi [Comandi slash](/it/tools/slash-commands) per il catalogo e il comportamento dei comandi.

Impostazioni predefinite dei comandi slash:

- `ephemeral: true`

## Dettagli della funzionalità

<AccordionGroup>
  <Accordion title="Reply tags and native replies">
    Discord supporta i tag di risposta nell'output dell'agente:

    - `[[reply_to_current]]`
    - `[[reply_to:<id>]]`

    Controllati da `channels.discord.replyToMode`:

    - `off` (predefinito)
    - `first`
    - `all`
    - `batched`

    Nota: `off` disabilita il threading implicito delle risposte. I tag espliciti `[[reply_to_*]]` sono comunque rispettati.
    `first` collega sempre il riferimento implicito di risposta nativa al primo messaggio Discord in uscita per il turno.
    `batched` collega il riferimento implicito di risposta nativa di Discord solo quando il
    turno in ingresso era un batch sottoposto a debounce di più messaggi. Questo è utile
    quando vuoi risposte native soprattutto per chat a raffica ambigue, non per ogni
    turno con singolo messaggio.

    Gli ID dei messaggi vengono esposti in contesto/cronologia così gli agenti possono indirizzare messaggi specifici.

  </Accordion>

  <Accordion title="Live stream preview">
    OpenClaw può trasmettere risposte in bozza inviando un messaggio temporaneo e modificandolo man mano che arriva il testo. `channels.discord.streaming` accetta `off` | `partial` | `block` | `progress` (predefinito). `progress` mantiene una bozza di stato modificabile e la aggiorna con l'avanzamento degli strumenti fino alla consegna finale; l'etichetta iniziale condivisa è una riga scorrevole, quindi scorre via come il resto quando compare abbastanza lavoro. `streamMode` è un alias runtime legacy. Esegui `openclaw doctor --fix` per riscrivere la configurazione persistita con la chiave canonica.

    Imposta `channels.discord.streaming.mode` su `off` per disabilitare le modifiche di anteprima di Discord. Se lo streaming a blocchi di Discord è abilitato esplicitamente, OpenClaw salta il flusso di anteprima per evitare il doppio streaming.

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
    - I messaggi finali con media, errore e risposta esplicita annullano le modifiche di anteprima in sospeso.
    - `streaming.preview.toolProgress` (predefinito `true`) controlla se gli aggiornamenti di strumenti/avanzamento riutilizzano il messaggio di anteprima.
    - Le righe strumenti/avanzamento vengono renderizzate come emoji compatta + titolo + dettaglio quando disponibili, per esempio `🛠️ Bash: run tests` o `🔎 Web Search: for "query"`.
    - `streaming.preview.commandText` / `streaming.progress.commandText` controlla il dettaglio comando/esecuzione nelle righe di avanzamento compatte: `raw` (predefinito) o `status` (solo etichetta dello strumento).

    Nascondi il testo grezzo comando/esecuzione mantenendo le righe di avanzamento compatte:

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

    Lo streaming di anteprima è solo testuale; le risposte con media ricadono sulla consegna normale. Quando lo streaming `block` è abilitato esplicitamente, OpenClaw salta il flusso di anteprima per evitare il doppio streaming.

  </Accordion>

  <Accordion title="History, context, and thread behavior">
    Contesto della cronologia del server:

    - `channels.discord.historyLimit` predefinito `20`
    - fallback: `messages.groupChat.historyLimit`
    - `0` disabilita

    Controlli della cronologia dei DM:

    - `channels.discord.dmHistoryLimit`
    - `channels.discord.dms["<user_id>"].historyLimit`

    Comportamento dei thread:

    - I thread Discord vengono instradati come sessioni di canale ed ereditano la configurazione del canale padre se non sovrascritta.
    - Le sessioni thread ereditano la selezione `/model` a livello di sessione del canale padre come fallback solo per il modello; le selezioni `/model` locali al thread hanno comunque la precedenza e la cronologia della trascrizione del padre non viene copiata a meno che l'ereditarietà della trascrizione sia abilitata.
    - `channels.discord.thread.inheritParent` (predefinito `false`) attiva per i nuovi thread automatici il seeding dalla trascrizione padre. Gli override per account si trovano sotto `channels.discord.accounts.<id>.thread.inheritParent`.
    - Le reazioni dello strumento messaggi possono risolvere destinazioni DM `user:<id>`.
    - `guilds.<guild>.channels.<channel>.requireMention: false` viene preservato durante il fallback di attivazione in fase di risposta.

    Gli argomenti dei canali vengono inseriti come contesto **non attendibile**. Le allowlist regolano chi può attivare l'agente, non un confine completo di oscuramento del contesto supplementare.

  </Accordion>

  <Accordion title="Thread-bound sessions for subagents">
    Discord può associare un thread a una destinazione di sessione così i messaggi successivi in quel thread continuano a essere instradati alla stessa sessione (incluse le sessioni dei sottoagenti).

    Comandi:

    - `/focus <target>` associa il thread corrente/nuovo a una destinazione di sottoagente/sessione
    - `/unfocus` rimuove l'associazione del thread corrente
    - `/agents` mostra esecuzioni attive e stato dell'associazione
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
    - `spawnSessions` controlla la creazione/associazione automatica di thread per `sessions_spawn({ thread: true })` e gli spawn di thread ACP. Predefinito: `true`.
    - `defaultSpawnContext` controlla il contesto nativo dei sottoagenti per gli spawn associati a thread. Predefinito: `"fork"`.
    - Le chiavi deprecate `spawnSubagentSessions`/`spawnAcpSessions` vengono migrate da `openclaw doctor --fix`.
    - Se le associazioni dei thread sono disabilitate per un account, `/focus` e le operazioni correlate di associazione dei thread non sono disponibili.

    Vedi [Sottoagenti](/it/tools/subagents), [Agenti ACP](/it/tools/acp-agents) e [Riferimento di configurazione](/it/gateway/configuration-reference).

  </Accordion>

  <Accordion title="Persistent ACP channel bindings">
    Per workspace ACP stabili "always-on", configura associazioni ACP tipizzate di primo livello mirate a conversazioni Discord.

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
    - `spawnSessions` regola la creazione/associazione dei thread figli tramite `--thread auto|here`.

    Vedi [Agenti ACP](/it/tools/acp-agents) per i dettagli sul comportamento delle associazioni.

  </Accordion>

  <Accordion title="Reaction notifications">
    Modalità di notifica delle reazioni per server:

    - `off`
    - `own` (predefinito)
    - `all`
    - `allowlist` (usa `guilds.<id>.users`)

    Gli eventi di reazione vengono trasformati in eventi di sistema e allegati alla sessione Discord instradata.

  </Accordion>

  <Accordion title="Ack reactions">
    `ackReaction` invia un'emoji di conferma mentre OpenClaw elabora un messaggio in ingresso.

    Ordine di risoluzione:

    - `channels.discord.accounts.<accountId>.ackReaction`
    - `channels.discord.ackReaction`
    - `messages.ackReaction`
    - fallback all'emoji dell'identità dell'agente (`agents.list[].identity.emoji`, altrimenti "👀")

    Note:

    - Discord accetta emoji unicode o nomi di emoji personalizzate.
    - Usa `""` per disabilitare la reazione per un canale o account.

  </Accordion>

  <Accordion title="Config writes">
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

  <Accordion title="Gateway proxy">
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

  <Accordion title="PluralKit support">
    Abilita la risoluzione PluralKit per mappare i messaggi con proxy all'identità del membro del sistema:

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
    - se la ricerca fallisce, i messaggi con proxy vengono trattati come messaggi bot e scartati a meno che `allowBots=true`

  </Accordion>

  <Accordion title="Outbound mention aliases">
    Usa `mentionAliases` quando gli agenti hanno bisogno di menzioni in uscita deterministiche per utenti Discord noti. Le chiavi sono handle senza la `@` iniziale; i valori sono ID utente Discord. Handle sconosciuti, `@everyone`, `@here` e menzioni all'interno di code span Markdown vengono lasciati invariati.

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

  <Accordion title="Presence configuration">
    Gli aggiornamenti di presenza vengono applicati quando imposti un campo stato o attività, oppure quando abiliti la presenza automatica.

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
    - 3: In visione
    - 4: Personalizzata (usa il testo dell'attività come stato; l'emoji è facoltativa)
    - 5: In competizione

    Esempio di presenza automatica (segnale di integrità del runtime):

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

    La presenza automatica mappa la disponibilità del runtime allo stato Discord: sano => online, degradato o sconosciuto => inattivo, esaurito o non disponibile => dnd. Sostituzioni di testo facoltative:

    - `autoPresence.healthyText`
    - `autoPresence.degradedText`
    - `autoPresence.exhaustedText` (supporta il segnaposto `{reason}`)

  </Accordion>

  <Accordion title="Approvals in Discord">
    Discord supporta la gestione delle approvazioni basata su pulsanti nei DM e può facoltativamente pubblicare richieste di approvazione nel canale di origine.

    Percorso di configurazione:

    - `channels.discord.execApprovals.enabled`
    - `channels.discord.execApprovals.approvers` (facoltativo; ricorre a `commands.ownerAllowFrom` quando possibile)
    - `channels.discord.execApprovals.target` (`dm` | `channel` | `both`, predefinito: `dm`)
    - `agentFilter`, `sessionFilter`, `cleanupAfterResolve`

    Discord abilita automaticamente le approvazioni exec native quando `enabled` non è impostato o è `"auto"` e almeno un approvatore può essere risolto, da `execApprovals.approvers` oppure da `commands.ownerAllowFrom`. Discord non deduce gli approvatori exec da `allowFrom` del canale, dal vecchio `dm.allowFrom` o da `defaultTo` dei messaggi diretti. Imposta `enabled: false` per disabilitare esplicitamente Discord come client di approvazione nativo.

    Per comandi di gruppo sensibili riservati al proprietario, come `/diagnostics` e `/export-trajectory`, OpenClaw invia privatamente le richieste di approvazione e i risultati finali. Prova prima il DM Discord quando il proprietario che invoca il comando ha una route proprietario Discord; se non è disponibile, ricorre alla prima route proprietario disponibile da `commands.ownerAllowFrom`, come Telegram.

    Quando `target` è `channel` o `both`, la richiesta di approvazione è visibile nel canale. Solo gli approvatori risolti possono usare i pulsanti; gli altri utenti ricevono un rifiuto effimero. Le richieste di approvazione includono il testo del comando, quindi abilita la consegna nel canale solo in canali attendibili. Se l'ID del canale non può essere derivato dalla chiave di sessione, OpenClaw ricorre alla consegna tramite DM.

    Discord renderizza anche i pulsanti di approvazione condivisi usati dagli altri canali chat. L'adattatore nativo Discord aggiunge principalmente il routing DM degli approvatori e il fanout sui canali.
    Quando questi pulsanti sono presenti, sono la UX di approvazione principale; OpenClaw
    dovrebbe includere un comando manuale `/approve` solo quando il risultato dello strumento indica
    che le approvazioni via chat non sono disponibili o che l'approvazione manuale è l'unico percorso.
    Se il runtime di approvazione nativo Discord non è attivo, OpenClaw mantiene visibile
    la richiesta deterministica locale `/approve <id> <decision>`. Se il
    runtime è attivo ma una scheda nativa non può essere consegnata ad alcuna destinazione,
    OpenClaw invia nello stesso chat un avviso di fallback con il comando `/approve`
    esatto dall'approvazione in sospeso.

    L'autenticazione Gateway e la risoluzione delle approvazioni seguono il contratto client Gateway condiviso (gli ID `plugin:` si risolvono tramite `plugin.approval.resolve`; gli altri ID tramite `exec.approval.resolve`). Le approvazioni scadono dopo 30 minuti per impostazione predefinita.

    Vedi [Approvazioni exec](/it/tools/exec-approvals).

  </Accordion>
</AccordionGroup>

## Strumenti e gate delle azioni

Le azioni sui messaggi Discord includono azioni di messaggistica, amministrazione dei canali, moderazione, presenza e metadati.

Esempi principali:

- messaggistica: `sendMessage`, `readMessages`, `editMessage`, `deleteMessage`, `threadReply`
- reazioni: `react`, `reactions`, `emojiList`
- moderazione: `timeout`, `kick`, `ban`
- presenza: `setPresence`

L'azione `event-create` accetta un parametro facoltativo `image` (URL o percorso di file locale) per impostare l'immagine di copertina dell'evento programmato.

I gate delle azioni si trovano sotto `channels.discord.actions.*`.

Comportamento predefinito dei gate:

| Gruppo di azioni                                                                                                                                                         | Predefinito |
| ------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ----------- |
| reazioni, messaggi, thread, pin, sondaggi, ricerca, informazioni membro, informazioni ruolo, informazioni canale, canali, stato voce, eventi, sticker, caricamenti emoji, caricamenti sticker, autorizzazioni | abilitato   |
| ruoli                                                                                                                                                                    | disabilitato |
| moderazione                                                                                                                                                              | disabilitato |
| presenza                                                                                                                                                                 | disabilitato |

## UI Components v2

OpenClaw usa Discord components v2 per le approvazioni exec e i marcatori tra contesti. Le azioni sui messaggi Discord possono anche accettare `components` per UI personalizzate (avanzato; richiede la costruzione di un payload componente tramite lo strumento Discord), mentre i vecchi `embeds` restano disponibili ma non sono consigliati.

- `channels.discord.ui.components.accentColor` imposta il colore di accento usato dai contenitori dei componenti Discord (hex).
- Imposta per account con `channels.discord.accounts.<id>.ui.components.accentColor`.
- `embeds` viene ignorato quando sono presenti components v2.

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

Discord ha due superfici voce distinte: **canali vocali** in tempo reale (conversazioni continue) e **allegati di messaggi vocali** (il formato di anteprima a forma d'onda). Il gateway supporta entrambe.

### Canali vocali

Checklist di configurazione:

1. Abilita Message Content Intent nel Discord Developer Portal.
2. Abilita Server Members Intent quando si usano allowlist di ruoli/utenti.
3. Invita il bot con gli scope `bot` e `applications.commands`.
4. Concedi Connect, Speak, Send Messages e Read Message History nel canale vocale di destinazione.
5. Abilita i comandi nativi (`commands.native` o `channels.discord.commands.native`).
6. Configura `channels.discord.voice`.

Usa `/vc join|leave|status` per controllare le sessioni. Il comando usa l'agente predefinito dell'account e segue le stesse regole di allowlist e criteri di gruppo degli altri comandi Discord.

```bash
/vc join channel:<voice-channel-id>
/vc status
/vc leave
```

Per ispezionare le autorizzazioni effettive del bot prima di entrare, esegui:

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
        model: "openai-codex/gpt-5.5",
        autoJoin: [
          {
            guildId: "123456789012345678",
            channelId: "234567890123456789",
          },
        ],
        allowedChannels: [
          {
            guildId: "123456789012345678",
            channelId: "234567890123456789",
          },
        ],
        daveEncryption: true,
        decryptionFailureTolerance: 24,
        connectTimeoutMs: 30000,
        reconnectGraceMs: 15000,
        realtime: {
          provider: "openai",
          model: "gpt-realtime-2",
          voice: "cedar",
        },
      },
    },
  },
}
```

Note:

- `voice.tts` sovrascrive `messages.tts` solo per la riproduzione vocale `stt-tts`. Le modalità realtime usano `voice.realtime.voice`.
- `voice.mode` controlla il percorso della conversazione. Il valore predefinito è `agent-proxy`: un front end vocale realtime gestisce la temporizzazione dei turni, l'interruzione e la riproduzione, delega il lavoro sostanziale all'agente OpenClaw instradato tramite `openclaw_agent_consult` e tratta il risultato come un prompt Discord digitato da quello speaker. `stt-tts` mantiene il flusso batch STT più TTS precedente. `bidi` consente al modello realtime di conversare direttamente, esponendo al contempo `openclaw_agent_consult` per il cervello OpenClaw.
- `voice.agentSession` controlla quale conversazione OpenClaw riceve i turni vocali. Lascialo non impostato per la sessione propria del canale vocale, oppure imposta `{ mode: "target", target: "channel:<text-channel-id>" }` per fare in modo che il canale vocale agisca come estensione microfono/speaker di una sessione esistente di canale testuale Discord, come `#maintainers`.
- `voice.model` sovrascrive il cervello dell'agente OpenClaw per le risposte vocali Discord e le consultazioni realtime. Lascialo non impostato per ereditare il modello dell'agente instradato. È separato da `voice.realtime.model`.
- `agent-proxy` instrada il parlato tramite `discord-voice`, che preserva la normale autorizzazione owner/tool per lo speaker e la sessione di destinazione, ma nasconde lo strumento `tts` dell'agente perché la voce Discord possiede la riproduzione. Per impostazione predefinita, `agent-proxy` concede alla consultazione l'accesso completo agli strumenti equivalente a quello dell'owner per gli speaker owner (`voice.realtime.toolPolicy: "owner"`) e preferisce fortemente consultare l'agente OpenClaw prima delle risposte sostanziali (`voice.realtime.consultPolicy: "always"`). In quella modalità predefinita `always`, il livello realtime non pronuncia automaticamente riempitivi prima della risposta della consultazione; cattura e trascrive il parlato, poi pronuncia la risposta OpenClaw instradata. Se più risposte di consultazione forzata terminano mentre Discord sta ancora riproducendo la prima risposta, le risposte successive con parlato esatto vengono messe in coda finché la riproduzione non è inattiva, invece di sostituire il parlato a metà frase.
- In modalità `stt-tts`, STT usa `tools.media.audio`; `voice.model` non influisce sulla trascrizione.
- Nelle modalità realtime, `voice.realtime.provider`, `voice.realtime.model` e `voice.realtime.voice` configurano la sessione audio realtime. Per OpenAI Realtime 2 più il cervello Codex, usa `voice.realtime.model: "gpt-realtime-2"` e `voice.model: "openai-codex/gpt-5.5"`.
- Il provider realtime OpenAI accetta i nomi evento Realtime 2 correnti e gli alias legacy compatibili con Codex per gli eventi di audio in uscita e trascrizione, così gli snapshot dei provider compatibili possono divergere senza perdere l'audio dell'assistente.
- `voice.realtime.bargeIn` controlla se gli eventi di avvio dello speaker Discord interrompono la riproduzione realtime attiva. Se non impostato, segue l'impostazione di interruzione dell'audio in ingresso del provider realtime.
- `voice.realtime.minBargeInAudioEndMs` controlla la durata minima della riproduzione dell'assistente prima che un barge-in realtime OpenAI tronchi l'audio. Predefinito: `250`. Imposta `0` per l'interruzione immediata in stanze con poco eco, oppure aumentalo per configurazioni con speaker molto soggette a eco.
- Per una voce OpenAI sulla riproduzione Discord, imposta `voice.tts.provider: "openai"` e scegli una voce Text-to-speech in `voice.tts.openai.voice` o `voice.tts.providers.openai.voice`. `cedar` è una buona scelta dal suono maschile sull'attuale modello TTS OpenAI.
- Le sovrascritture `systemPrompt` Discord per canale si applicano ai turni di trascrizione vocale per quel canale vocale.
- I turni di trascrizione vocale derivano lo stato di owner da `allowFrom` di Discord (o `dm.allowFrom`); gli speaker non-owner non possono accedere agli strumenti riservati agli owner (per esempio `gateway` e `cron`).
- La voce Discord è opt-in per le configurazioni solo testo; imposta `channels.discord.voice.enabled=true` (oppure mantieni un blocco `channels.discord.voice` esistente) per abilitare i comandi `/vc`, il runtime vocale e l'intent Gateway `GuildVoiceStates`.
- `channels.discord.intents.voiceStates` può sovrascrivere esplicitamente la sottoscrizione all'intent degli stati vocali. Lascialo non impostato affinché l'intent segua l'abilitazione vocale effettiva.
- Se `voice.autoJoin` ha più voci per la stessa guild, OpenClaw entra nell'ultimo canale configurato per quella guild.
- `voice.allowedChannels` è una allowlist di residenza opzionale. Lasciala non impostata per consentire `/vc join` in qualsiasi canale vocale Discord autorizzato. Quando è impostata, `/vc join`, l'auto-join all'avvio e gli spostamenti dello stato vocale del bot sono limitati alle voci `{ guildId, channelId }` elencate. Impostala su un array vuoto per negare tutti gli ingressi vocali Discord. Se Discord sposta il bot fuori dalla allowlist, OpenClaw lascia quel canale e rientra nel target auto-join configurato quando ne è disponibile uno.
- `voice.daveEncryption` e `voice.decryptionFailureTolerance` vengono passati alle opzioni di join di `@discordjs/voice`.
- I valori predefiniti di `@discordjs/voice` sono `daveEncryption=true` e `decryptionFailureTolerance=24` se non impostati.
- OpenClaw usa per impostazione predefinita il decoder pure-JS `opusscript` per la ricezione vocale Discord. Il pacchetto nativo opzionale `@discordjs/opus` viene ignorato dalla policy di installazione pnpm del repo, così le installazioni normali, le lane Docker e i test non correlati non compilano un addon nativo. Gli host dedicati alle prestazioni vocali possono optare per l'uso di `OPENCLAW_DISCORD_OPUS_DECODER=native` dopo aver installato l'addon nativo.
- `voice.connectTimeoutMs` controlla l'attesa iniziale `@discordjs/voice` Ready per i tentativi `/vc join` e auto-join. Predefinito: `30000`.
- `voice.reconnectGraceMs` controlla per quanto tempo OpenClaw attende che una sessione vocale disconnessa inizi a riconnettersi prima di distruggerla. Predefinito: `15000`.
- In modalità `stt-tts`, la riproduzione vocale non si ferma solo perché un altro utente inizia a parlare. Per evitare loop di feedback, OpenClaw ignora la nuova cattura vocale mentre TTS è in riproduzione; parla dopo la fine della riproduzione per il turno successivo. Le modalità realtime inoltrano gli avvii degli speaker come segnali di barge-in al provider realtime.
- Nelle modalità realtime, l'eco dagli speaker verso un microfono aperto può sembrare un barge-in e interrompere la riproduzione. Per stanze Discord con molto eco, imposta `voice.realtime.providers.openai.interruptResponseOnInputAudio: false` per impedire a OpenAI di interrompersi automaticamente sull'audio in ingresso. Aggiungi `voice.realtime.bargeIn: true` se vuoi comunque che gli eventi di avvio speaker Discord interrompano la riproduzione attiva. Il bridge realtime OpenAI ignora i troncamenti di riproduzione più brevi di `voice.realtime.minBargeInAudioEndMs` come probabile eco/rumore e li registra come saltati invece di cancellare la riproduzione Discord.
- `voice.captureSilenceGraceMs` controlla per quanto tempo OpenClaw attende dopo che Discord segnala che uno speaker ha smesso di parlare prima di finalizzare quel segmento audio per STT. Predefinito: `2500`; aumentalo se Discord spezza le pause normali in trascrizioni parziali frammentate.
- Quando ElevenLabs è il provider TTS selezionato, la riproduzione vocale Discord usa TTS in streaming e parte dallo stream di risposta del provider. I provider senza supporto streaming ripiegano sul percorso del file temporaneo sintetizzato.
- OpenClaw monitora anche gli errori di decrittazione in ricezione e recupera automaticamente lasciando/rientrando nel canale vocale dopo errori ripetuti in una finestra breve.
- Se i log di ricezione mostrano ripetutamente `DecryptionFailed(UnencryptedWhenPassthroughDisabled)` dopo un aggiornamento, raccogli un report delle dipendenze e i log. La linea `@discordjs/voice` inclusa comprende la correzione upstream del padding dalla PR discord.js #11449, che ha chiuso l'issue discord.js #11419.
- Gli eventi di ricezione `The operation was aborted` sono previsti quando OpenClaw finalizza un segmento di speaker catturato; sono diagnostica dettagliata, non avvisi.
- I log vocali dettagliati di Discord includono un'anteprima limitata su una riga della trascrizione STT per ogni segmento di speaker accettato, così il debug mostra sia il lato utente sia il lato della risposta dell'agente senza riversare testo di trascrizione illimitato.
- In modalità `agent-proxy`, il fallback della consultazione forzata salta frammenti di trascrizione probabilmente incompleti, come testo che termina con `...` o un connettore finale come `and`, oltre a chiusure chiaramente non operative come “torno subito” o “ciao”. I log mostrano `forced agent consult skipped reason=...` quando questo impedisce una risposta in coda obsoleta.

Configurazione opus nativa per checkout sorgente:

```bash
pnpm install
mise exec node@22 -- pnpm discord:opus:install
```

Usa Node 22 per il gateway quando vuoi l'addon nativo precompilato upstream per macOS arm64. Se usi un altro runtime Node, l'installer opt-in potrebbe richiedere una toolchain locale `node-gyp` per la build da sorgente.

Dopo aver installato l'addon nativo, avvia il Gateway con:

```bash
OPENCLAW_DISCORD_OPUS_DECODER=native pnpm gateway:watch
```

I log vocali dettagliati dovrebbero mostrare `discord voice: opus decoder: @discordjs/opus`. Senza l'opt-in tramite env, oppure se l'addon nativo manca o non può essere caricato sull'host, OpenClaw registra `discord voice: opus decoder: opusscript` e continua a ricevere voce tramite il fallback pure-JS.

Pipeline STT più TTS:

- La cattura PCM Discord viene convertita in un file temporaneo WAV.
- `tools.media.audio` gestisce STT, per esempio `openai/gpt-4o-mini-transcribe`.
- La trascrizione viene inviata tramite l'ingresso e il routing Discord mentre l'LLM di risposta viene eseguito con una policy di output vocale che nasconde lo strumento `tts` dell'agente e richiede testo restituito, perché la voce Discord possiede la riproduzione TTS finale.
- `voice.model`, quando impostato, sovrascrive solo l'LLM di risposta per questo turno del canale vocale.
- `voice.tts` viene unito sopra `messages.tts`; i provider con capacità di streaming alimentano direttamente il player, altrimenti il file audio risultante viene riprodotto nel canale in cui si è entrati.

Esempio di sessione del canale vocale agent-proxy predefinita:

```json5
{
  channels: {
    discord: {
      voice: {
        enabled: true,
        model: "openai-codex/gpt-5.5",
        realtime: {
          provider: "openai",
          model: "gpt-realtime-2",
          voice: "cedar",
        },
      },
    },
  },
}
```

Senza un blocco `voice.agentSession`, ogni canale vocale ottiene la propria sessione OpenClaw instradata. Per esempio, `/vc join channel:234567890123456789` parla alla sessione di quel canale vocale Discord. Il modello realtime è solo il front end vocale; le richieste sostanziali vengono passate all'agente OpenClaw configurato. Se il modello realtime produce una trascrizione finale senza chiamare lo strumento di consultazione, OpenClaw forza la consultazione come fallback, così l'impostazione predefinita continua a comportarsi come parlare con l'agente.

Esempio legacy STT più TTS:

```json5
{
  channels: {
    discord: {
      voice: {
        enabled: true,
        mode: "stt-tts",
        model: "openai/gpt-5.4-mini",
        tts: {
          provider: "openai",
          openai: {
            model: "gpt-4o-mini-tts",
            voice: "cedar",
          },
        },
      },
    },
  },
}
```

Esempio bidi realtime:

```json5
{
  channels: {
    discord: {
      voice: {
        enabled: true,
        mode: "bidi",
        model: "openai-codex/gpt-5.5",
        realtime: {
          provider: "openai",
          model: "gpt-realtime-2",
          voice: "cedar",
          toolPolicy: "safe-read-only",
          consultPolicy: "always",
        },
      },
    },
  },
}
```

Voce come estensione di una sessione di canale Discord esistente:

```json5
{
  channels: {
    discord: {
      voice: {
        enabled: true,
        mode: "agent-proxy",
        model: "openai-codex/gpt-5.5",
        agentSession: {
          mode: "target",
          target: "channel:123456789012345678",
        },
        realtime: {
          provider: "openai",
          model: "gpt-realtime-2",
          voice: "cedar",
        },
      },
    },
  },
}
```

In modalità `agent-proxy` il bot entra nel canale vocale configurato, ma i turni dell'agente OpenClaw usano la sessione e l'agente normalmente instradati del canale di destinazione. La sessione vocale realtime pronuncia il risultato restituito nel canale vocale. L'agente supervisore può comunque usare i normali strumenti di messaggistica in base alla sua policy degli strumenti, incluso l'invio di un messaggio Discord separato se è l'azione corretta.

Forme di destinazione utili:

- `target: "channel:123456789012345678"` instrada tramite una sessione di canale testuale Discord.
- `target: "123456789012345678"` viene trattato come target di canale.
- `target: "dm:123456789012345678"` o `target: "user:123456789012345678"` instrada tramite quella sessione di messaggi diretti.

Esempio OpenAI Realtime con molto eco:

```json5
{
  channels: {
    discord: {
      voice: {
        enabled: true,
        mode: "bidi",
        model: "openai-codex/gpt-5.5",
        realtime: {
          provider: "openai",
          model: "gpt-realtime-2",
          voice: "cedar",
          bargeIn: true,
          minBargeInAudioEndMs: 500,
          consultPolicy: "always",
          providers: {
            openai: {
              interruptResponseOnInputAudio: false,
            },
          },
        },
      },
    },
  },
}
```

Usalo quando il modello sente la propria riproduzione Discord tramite un microfono aperto, ma vuoi comunque interromperlo parlando. OpenClaw impedisce a OpenAI di interrompere automaticamente sull'audio di input grezzo, mentre `bargeIn: true` consente agli eventi di avvio dello speaker Discord e all'audio dello speaker già attivo di annullare le risposte realtime attive prima che il turno acquisito successivo raggiunga OpenAI. I segnali di barge-in molto precoci con `audioEndMs` inferiore a `minBargeInAudioEndMs` sono trattati come probabile eco/rumore e ignorati, così il modello non si interrompe al primo frame di riproduzione.

Log vocali attesi:

- All'ingresso: `discord voice: joining ... voiceSession=... supervisorSession=... agentSessionMode=... voiceModel=... realtimeModel=...`
- All'avvio realtime: `discord voice: realtime bridge starting ... autoRespond=false interruptResponse=false bargeIn=false minBargeInAudioEndMs=...`
- Sull'audio dello speaker: `discord voice: realtime speaker turn opened ...`, `discord voice: realtime input audio started ... outputAudioMs=... outputActive=...` e `discord voice: realtime speaker turn closed ... chunks=... discordBytes=... realtimeBytes=... interruptedPlayback=...`
- Sul parlato obsoleto saltato: `discord voice: realtime forced agent consult skipped reason=incomplete-transcript ...` o `reason=non-actionable-closing ...`
- Al completamento della risposta realtime: `discord voice: realtime audio playback finishing reason=response.done ... audioMs=... chunks=...`
- All'arresto/ripristino della riproduzione: `discord voice: realtime audio playback stopped reason=... audioMs=... elapsedMs=... chunks=...`
- Sulla consultazione realtime: `discord voice: realtime consult requested ... voiceSession=... supervisorSession=... question=...`
- Alla risposta dell'agente: `discord voice: agent turn answer ...`
- Sul parlato esatto accodato: `discord voice: realtime exact speech queued ... queued=... outputAudioMs=... outputActive=...`, seguito da `discord voice: realtime exact speech dequeued reason=player-idle ...`
- Sul rilevamento del barge-in: `discord voice: realtime barge-in detected source=speaker-start ...` o `discord voice: realtime barge-in detected source=active-speaker-audio ...`, seguito da `discord voice: realtime barge-in requested reason=... outputAudioMs=... outputActive=...`
- Sull'interruzione realtime: `discord voice: realtime model interrupt requested client:response.cancel reason=barge-in`, seguito da `discord voice: realtime model audio truncated client:conversation.item.truncate reason=barge-in audioEndMs=...` oppure `discord voice: realtime model interrupt confirmed server:response.done status=cancelled ...`
- Su eco/rumore ignorati: `discord voice: realtime model interrupt ignored client:conversation.item.truncate.skipped reason=barge-in audioEndMs=0 minAudioEndMs=250`
- Sul barge-in disabilitato: `discord voice: realtime capture ignored during playback (barge-in disabled) ...`
- Sulla riproduzione inattiva: `discord voice: realtime barge-in ignored reason=... outputActive=false ... playbackChunks=0`

Per eseguire il debug dell'audio interrotto, leggi i log vocali realtime come una sequenza temporale:

1. `realtime audio playback started` significa che Discord ha iniziato a riprodurre l'audio dell'assistente. Da questo punto il bridge inizia a contare i chunk di output dell'assistente, i byte PCM di Discord, i byte realtime del provider e la durata dell'audio sintetizzato.
2. `realtime speaker turn opened` indica che uno speaker Discord è diventato attivo. Se la riproduzione è già attiva e `bargeIn` è abilitato, può essere seguito da `barge-in detected source=speaker-start`.
3. `realtime input audio started` indica il primo frame audio effettivo ricevuto per quel turno dello speaker. `outputActive=true` o un `outputAudioMs` diverso da zero qui significa che il microfono sta inviando input mentre la riproduzione dell'assistente è ancora attiva.
4. `barge-in detected source=active-speaker-audio` significa che OpenClaw ha rilevato audio live dello speaker mentre la riproduzione dell'assistente era attiva. Questo è utile per distinguere un'interruzione reale da un evento di avvio speaker Discord senza audio utile.
5. `barge-in requested reason=...` significa che OpenClaw ha chiesto al provider realtime di annullare o troncare la risposta attiva. Include `outputAudioMs`, `outputActive` e `playbackChunks` così puoi vedere quanto audio dell'assistente era stato effettivamente riprodotto prima dell'interruzione.
6. `realtime audio playback stopped reason=...` è il punto di reset della riproduzione Discord locale. Il motivo indica chi ha fermato la riproduzione: `barge-in`, `player-idle`, `provider-clear-audio`, `forced-agent-consult`, `stream-close` o `session-close`.
7. `realtime speaker turn closed` riepiloga il turno di input acquisito. `chunks=0` o `hasAudio=false` significa che il turno dello speaker si è aperto ma nessun audio utilizzabile ha raggiunto il bridge realtime. `interruptedPlayback=true` significa che quel turno di input si è sovrapposto all'output dell'assistente e ha attivato la logica di barge-in.

Campi utili:

- `outputAudioMs`: durata dell'audio dell'assistente generato dal provider realtime prima della riga di log.
- `audioMs`: durata dell'audio dell'assistente conteggiata da OpenClaw prima dell'arresto della riproduzione.
- `elapsedMs`: tempo di orologio tra apertura e chiusura dello stream di riproduzione o del turno dello speaker.
- `discordBytes`: byte PCM stereo a 48 kHz inviati a o ricevuti dalla voce Discord.
- `realtimeBytes`: byte PCM nel formato del provider inviati a o ricevuti dal provider realtime.
- `playbackChunks`: chunk audio dell'assistente inoltrati a Discord per la risposta attiva.
- `sinceLastAudioMs`: intervallo tra l'ultimo frame audio dello speaker acquisito e la chiusura del turno dello speaker.

Schemi comuni:

- Interruzione immediata con `source=active-speaker-audio`, `outputAudioMs` basso e lo stesso utente nelle vicinanze di solito indica eco degli altoparlanti che entra nel microfono. Aumenta `voice.realtime.minBargeInAudioEndMs`, abbassa il volume degli altoparlanti, usa cuffie o imposta `voice.realtime.providers.openai.interruptResponseOnInputAudio: false`.
- `source=speaker-start` seguito da `speaker turn closed ... hasAudio=false` significa che Discord ha segnalato l'avvio di uno speaker, ma nessun audio ha raggiunto OpenClaw. Può trattarsi di un evento vocale Discord transitorio, del comportamento del noise gate o di un client che attiva brevemente il microfono.
- `audio playback stopped reason=stream-close` senza un barge-in vicino o `provider-clear-audio` significa che lo stream di riproduzione Discord locale è terminato inaspettatamente. Controlla i log precedenti del provider e del player Discord.
- `capture ignored during playback (barge-in disabled)` significa che OpenClaw ha scartato intenzionalmente l'input mentre l'audio dell'assistente era attivo. Abilita `voice.realtime.bargeIn` se vuoi che il parlato interrompa la riproduzione.
- `barge-in ignored ... outputActive=false` significa che Discord o il VAD del provider ha segnalato parlato, ma OpenClaw non aveva alcuna riproduzione attiva da interrompere. Questo non dovrebbe interrompere l'audio.

Le credenziali vengono risolte per componente: autenticazione della route LLM per `voice.model`, autenticazione STT per `tools.media.audio`, autenticazione TTS per `messages.tts`/`voice.tts` e autenticazione del provider realtime per `voice.realtime.providers` o la normale configurazione di autenticazione del provider.

### Messaggi vocali

I messaggi vocali Discord mostrano un'anteprima della forma d'onda e richiedono audio OGG/Opus. OpenClaw genera automaticamente la forma d'onda, ma richiede `ffmpeg` e `ffprobe` sull'host del Gateway per analizzare e convertire.

- Fornisci un **percorso file locale** (gli URL vengono rifiutati).
- Ometti il contenuto testuale (Discord rifiuta testo + messaggio vocale nello stesso payload).
- È accettato qualsiasi formato audio; OpenClaw converte in OGG/Opus secondo necessità.

```bash
message(action="send", channel="discord", target="channel:123", path="/path/to/audio.mp3", asVoice=true)
```

## Risoluzione dei problemi

<AccordionGroup>
  <Accordion title="Used disallowed intents or bot sees no guild messages">

    - abilita Message Content Intent
    - abilita Server Members Intent quando dipendi dalla risoluzione di utente/membro
    - riavvia il Gateway dopo aver modificato gli intent

  </Accordion>

  <Accordion title="Guild messages blocked unexpectedly">

    - verifica `groupPolicy`
    - verifica l'allowlist della guild in `channels.discord.guilds`
    - se esiste la mappa `channels` della guild, sono consentiti solo i canali elencati
    - verifica il comportamento di `requireMention` e i pattern di menzione

    Controlli utili:

```bash
openclaw doctor
openclaw channels status --probe
openclaw logs --follow
```

  </Accordion>

  <Accordion title="Require mention false but still blocked">
    Cause comuni:

    - `groupPolicy="allowlist"` senza una allowlist di guild/canale corrispondente
    - `requireMention` configurato nel posto sbagliato (deve essere sotto `channels.discord.guilds` o nella voce del canale)
    - mittente bloccato dalla allowlist `users` della guild/del canale

  </Accordion>

  <Accordion title="Long-running Discord turns or duplicate replies">

    Log tipici:

    - `Slow listener detected ...`
    - `stuck session: sessionKey=agent:...:discord:... state=processing ...`

    Manopole della coda del Gateway Discord:

    - account singolo: `channels.discord.eventQueue.listenerTimeout`
    - multi-account: `channels.discord.accounts.<accountId>.eventQueue.listenerTimeout`
    - questo controlla solo il lavoro del listener del Gateway Discord, non la durata del turno dell'agente

    Discord non applica un timeout di proprietà del canale ai turni agente accodati. I listener dei messaggi passano il controllo immediatamente e le esecuzioni Discord accodate preservano l'ordinamento per sessione finché il ciclo di vita di sessione/strumento/runtime completa o interrompe il lavoro.

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

  <Accordion title="Gateway metadata lookup timeout warnings">
    OpenClaw recupera i metadati Discord `/gateway/bot` prima di connettersi. Gli errori transitori ripiegano sull'URL Gateway predefinito di Discord e sono limitati nella frequenza nei log.

    Manopole di timeout dei metadati:

    - account singolo: `channels.discord.gatewayInfoTimeoutMs`
    - multi-account: `channels.discord.accounts.<accountId>.gatewayInfoTimeoutMs`
    - fallback env quando la configurazione non è impostata: `OPENCLAW_DISCORD_GATEWAY_INFO_TIMEOUT_MS`
    - predefinito: `30000` (30 secondi), max: `120000`

  </Accordion>

  <Accordion title="Gateway READY timeout restarts">
    OpenClaw attende l'evento `READY` del Gateway Discord durante l'avvio e dopo le riconnessioni runtime. Le configurazioni multi-account con scaglionamento all'avvio possono richiedere una finestra READY di avvio più lunga rispetto al valore predefinito.

    Manopole di timeout READY:

    - avvio account singolo: `channels.discord.gatewayReadyTimeoutMs`
    - avvio multi-account: `channels.discord.accounts.<accountId>.gatewayReadyTimeoutMs`
    - fallback env di avvio quando la configurazione non è impostata: `OPENCLAW_DISCORD_READY_TIMEOUT_MS`
    - predefinito di avvio: `15000` (15 secondi), max: `120000`
    - runtime account singolo: `channels.discord.gatewayRuntimeReadyTimeoutMs`
    - runtime multi-account: `channels.discord.accounts.<accountId>.gatewayRuntimeReadyTimeoutMs`
    - fallback env runtime quando la configurazione non è impostata: `OPENCLAW_DISCORD_RUNTIME_READY_TIMEOUT_MS`
    - predefinito runtime: `30000` (30 secondi), max: `120000`

  </Accordion>

  <Accordion title="Permissions audit mismatches">
    I controlli dei permessi di `channels status --probe` funzionano solo per ID canale numerici.

    Se usi chiavi slug, la corrispondenza runtime può comunque funzionare, ma il probe non può verificare completamente i permessi.

  </Accordion>

  <Accordion title="DM and pairing issues">

    - DM disabilitati: `channels.discord.dm.enabled=false`
    - policy DM disabilitata: `channels.discord.dmPolicy="disabled"` (legacy: `channels.discord.dm.policy`)
    - approvazione di abbinamento in attesa in modalità `pairing`

  </Accordion>

  <Accordion title="Bot to bot loops">
    Per impostazione predefinita, i messaggi creati dai bot vengono ignorati.

    Se imposti `channels.discord.allowBots=true`, usa regole rigorose per le menzioni e le allowlist per evitare comportamenti a ciclo.
    Preferisci `channels.discord.allowBots="mentions"` per accettare solo messaggi di bot che menzionano il bot.

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

  <Accordion title="Cali dell'STT vocale con DecryptionFailed(...)">

    - mantieni OpenClaw aggiornato (`openclaw update`) in modo che la logica di recupero della ricezione vocale Discord sia presente
    - conferma `channels.discord.voice.daveEncryption=true` (predefinito)
    - parti da `channels.discord.voice.decryptionFailureTolerance=24` (predefinito upstream) e regola solo se necessario
    - controlla nei log:
      - `discord voice: DAVE decrypt failures detected`
      - `discord voice: repeated decrypt failures; attempting rejoin`
    - se gli errori continuano dopo il rientro automatico, raccogli i log e confrontali con la cronologia di ricezione DAVE upstream in [discord.js #11419](https://github.com/discordjs/discord.js/issues/11419) e [discord.js #11449](https://github.com/discordjs/discord.js/pull/11449)

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
- funzionalità: `threadBindings`, `bindings[]` di primo livello (`type: "acp"`), `pluralkit`, `execApprovals`, `intents`, `agentComponents`, `heartbeat`, `responsePrefix`

</Accordion>

## Sicurezza e operazioni

- Tratta i token dei bot come segreti (`DISCORD_BOT_TOKEN` preferito negli ambienti supervisionati).
- Concedi autorizzazioni Discord con privilegi minimi.
- Se la distribuzione/lo stato dei comandi è obsoleto, riavvia il gateway e ricontrolla con `openclaw channels status --probe`.

## Correlati

<CardGroup cols={2}>
  <Card title="Abbinamento" icon="link" href="/it/channels/pairing">
    Abbina un utente Discord al gateway.
  </Card>
  <Card title="Gruppi" icon="users" href="/it/channels/groups">
    Comportamento delle chat di gruppo e delle allowlist.
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
