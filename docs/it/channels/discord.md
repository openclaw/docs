---
read_when:
    - Lavorare sulle funzionalità del canale Discord
summary: Stato del supporto del bot Discord, funzionalità e configurazione
title: Discord
x-i18n:
    generated_at: "2026-06-28T20:40:56Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 91bda14cfdd7bf5045413d97c56936ea7150b396e0e7ecd4ac300e1a811377cb
    source_path: channels/discord.md
    workflow: 16
---

Pronto per DM e canali guild tramite il Gateway ufficiale di Discord.

<CardGroup cols={3}>
  <Card title="Associazione" icon="link" href="/it/channels/pairing">
    I DM di Discord usano per impostazione predefinita la modalità di associazione.
  </Card>
  <Card title="Comandi slash" icon="terminal" href="/it/tools/slash-commands">
    Comportamento dei comandi nativi e catalogo dei comandi.
  </Card>
  <Card title="Risoluzione dei problemi dei canali" icon="wrench" href="/it/channels/troubleshooting">
    Diagnostica e flusso di riparazione tra canali.
  </Card>
</CardGroup>

## Configurazione rapida

Dovrai creare una nuova applicazione con un bot, aggiungere il bot al tuo server e associarlo a OpenClaw. Ti consigliamo di aggiungere il bot al tuo server privato. Se non ne hai ancora uno, [creane prima uno](https://support.discord.com/hc/en-us/articles/204849977-How-do-I-create-a-server) (scegli **Create My Own > For me and my friends**).

<Steps>
  <Step title="Crea un'applicazione e un bot Discord">
    Vai al [Discord Developer Portal](https://discord.com/developers/applications) e fai clic su **New Application**. Dagli un nome come "OpenClaw".

    Fai clic su **Bot** nella barra laterale. Imposta **Username** sul nome che usi per il tuo agente OpenClaw.

  </Step>

  <Step title="Abilita gli intent privilegiati">
    Sempre nella pagina **Bot**, scorri fino a **Privileged Gateway Intents** e abilita:

    - **Message Content Intent** (obbligatorio)
    - **Server Members Intent** (consigliato; obbligatorio per le allowlist dei ruoli e la corrispondenza nome-ID)
    - **Presence Intent** (facoltativo; necessario solo per gli aggiornamenti di presenza)

  </Step>

  <Step title="Copia il token del bot">
    Torna in alto nella pagina **Bot** e fai clic su **Reset Token**.

    <Note>
    Nonostante il nome, questo genera il tuo primo token — nulla viene "reimpostato".
    </Note>

    Copia il token e salvalo da qualche parte. Questo è il tuo **Bot Token** e ti servirà tra poco.

  </Step>

  <Step title="Genera un URL di invito e aggiungi il bot al tuo server">
    Fai clic su **OAuth2** nella barra laterale. Genererai un URL di invito con le autorizzazioni corrette per aggiungere il bot al tuo server.

    Scorri fino a **OAuth2 URL Generator** e abilita:

    - `bot`
    - `applications.commands`

    Sotto comparirà una sezione **Bot Permissions**. Abilita almeno:

    **General Permissions**
      - Visualizzare i canali
    **Text Permissions**
      - Inviare messaggi
      - Leggere la cronologia dei messaggi
      - Incorporare link
      - Allegare file
      - Aggiungere reazioni (facoltativo)

    Questo è il set di base per i normali canali di testo. Se prevedi di pubblicare nei thread Discord, inclusi i flussi di lavoro dei canali forum o media che creano o continuano un thread, abilita anche **Send Messages in Threads**.
    Copia l'URL generato in basso, incollalo nel browser, seleziona il tuo server e fai clic su **Continue** per connetterlo. Ora dovresti vedere il tuo bot nel server Discord.

  </Step>

  <Step title="Abilita la Modalità sviluppatore e raccogli i tuoi ID">
    Tornando nell'app Discord, devi abilitare la Modalità sviluppatore per poter copiare gli ID interni.

    1. Fai clic su **User Settings** (icona a forma di ingranaggio accanto al tuo avatar) → scorri fino a **Developer** nella barra laterale → attiva **Developer Mode**

        *(Nota: nell'app mobile Discord, Developer Mode si trova in **App Settings** → **Advanced**)*

    2. Fai clic con il tasto destro sull'**icona del server** nella barra laterale → **Copy Server ID**
    3. Fai clic con il tasto destro sul **tuo avatar** → **Copy User ID**

    Salva il tuo **Server ID** e il tuo **User ID** insieme al Bot Token — invierai tutti e tre a OpenClaw nel passaggio successivo.

  </Step>

  <Step title="Consenti i DM dai membri del server">
    Perché l'associazione funzioni, Discord deve consentire al bot di inviarti DM. Fai clic con il tasto destro sull'**icona del server** → **Privacy Settings** → attiva **Direct Messages**.

    Questo consente ai membri del server (inclusi i bot) di inviarti DM. Tienilo abilitato se vuoi usare i DM di Discord con OpenClaw. Se prevedi di usare solo canali guild, puoi disabilitare i DM dopo l'associazione.

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
    Per le installazioni come servizio gestito, esegui `openclaw gateway install` da una shell in cui `DISCORD_BOT_TOKEN` è presente, oppure memorizza la variabile in `~/.openclaw/.env`, così il servizio potrà risolvere il SecretRef env dopo il riavvio.
    Se il tuo host è bloccato o soggetto a rate limit dalla ricerca dell'applicazione all'avvio di Discord, imposta l'ID applicazione/client Discord dal Developer Portal così l'avvio potrà saltare quella chiamata REST. Usa `channels.discord.applicationId` per l'account predefinito, oppure `channels.discord.accounts.<accountId>.applicationId` quando esegui più bot Discord.

  </Step>

  <Step title="Configura OpenClaw e associa">

    <Tabs>
      <Tab title="Chiedi al tuo agente">
        Chatta con il tuo agente OpenClaw su qualsiasi canale esistente (ad esempio Telegram) e comunicaglielo. Se Discord è il tuo primo canale, usa invece la scheda CLI / configurazione.

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

        Per configurazioni via script o remote, scrivi lo stesso blocco JSON5 con `openclaw config patch --file ./discord.patch.json5 --dry-run` e poi riesegui senza `--dry-run`. I valori `token` in testo normale sono supportati. I valori SecretRef sono supportati anche per `channels.discord.token` tra provider env/file/exec. Vedi [Gestione dei segreti](/it/gateway/secrets).

        Per più bot Discord, mantieni ogni token del bot e ID applicazione sotto il rispettivo account. Un `channels.discord.applicationId` di primo livello viene ereditato dagli account, quindi impostalo lì solo quando ogni account deve usare lo stesso ID applicazione.

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

  <Step title="Approva la prima associazione DM">
    Attendi che il gateway sia in esecuzione, poi invia un DM al tuo bot su Discord. Risponderà con un codice di associazione.

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

    Ora dovresti poter chattare con il tuo agente in Discord tramite DM.

  </Step>
</Steps>

<Note>
La risoluzione dei token è consapevole dell'account. I valori dei token nella configurazione prevalgono sul fallback env. `DISCORD_BOT_TOKEN` viene usato solo per l'account predefinito.
Se due account Discord abilitati si risolvono nello stesso token del bot, OpenClaw avvia un solo monitor del Gateway per quel token. Un token proveniente dalla configurazione prevale sul fallback env predefinito; altrimenti vince il primo account abilitato e l'account duplicato viene segnalato come disabilitato.
Per chiamate in uscita avanzate (strumento messaggio/azioni di canale), viene usato un `token` esplicito per chiamata. Questo si applica alle azioni di invio e di lettura/probe (ad esempio read/search/fetch/thread/pins/permissions). Le impostazioni di policy/riprova dell'account provengono comunque dall'account selezionato nello snapshot runtime attivo.
</Note>

## Consigliato: configura uno spazio di lavoro guild

Una volta che i DM funzionano, puoi configurare il tuo server Discord come spazio di lavoro completo, in cui ogni canale riceve la propria sessione agente con il proprio contesto. Questo è consigliato per server privati dove ci siete solo tu e il tuo bot.

<Steps>
  <Step title="Aggiungi il tuo server alla allowlist guild">
    Questo consente al tuo agente di rispondere in qualsiasi canale sul tuo server, non solo nei DM.

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

    Nei canali guild, le risposte normali vengono pubblicate automaticamente per impostazione predefinita. Per stanze condivise sempre attive, abilita `messages.groupChat.visibleReplies: "message_tool"` così l'agente può restare in ascolto e pubblicare solo quando decide che una risposta nel canale è utile. Funziona al meglio con modelli di ultima generazione affidabili con gli strumenti, come GPT 5.5. Gli eventi ambientali della stanza restano silenziosi a meno che lo strumento non invii. Vedi [Eventi ambientali della stanza](/it/channels/ambient-room-events) per la configurazione completa della modalità in ascolto.

    Se Discord mostra la digitazione e i log mostrano l'uso di token ma nessun messaggio pubblicato, controlla se il turno era configurato come evento ambientale della stanza o se aveva abilitato le risposte visibili tramite strumento messaggio.

    <Tabs>
      <Tab title="Chiedi al tuo agente">
        > "Consenti al mio agente di rispondere su questo server senza dover essere @menzionato"
      </Tab>
      <Tab title="Configurazione">
        Imposta `requireMention: false` nella configurazione della tua guild:

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

        Per richiedere invii tramite strumento messaggio per risposte visibili di gruppo/canale, imposta `messages.groupChat.visibleReplies: "message_tool"`.

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
        Se hai bisogno di contesto condiviso in ogni canale, inserisci le istruzioni stabili in `AGENTS.md` o `USER.md` (vengono iniettate in ogni sessione). Mantieni le note a lungo termine in `MEMORY.md` e accedivi su richiesta con gli strumenti di memoria.
      </Tab>
    </Tabs>

  </Step>
</Steps>

Ora crea alcuni canali sul tuo server Discord e inizia a chattare. Il tuo agente può vedere il nome del canale, e ogni canale riceve la propria sessione isolata — quindi puoi configurare `#coding`, `#home`, `#research` o qualsiasi cosa si adatti al tuo flusso di lavoro.

## Modello runtime

- Il Gateway possiede la connessione Discord.
- Il routing delle risposte è deterministico: le risposte in ingresso da Discord tornano a Discord.
- I metadati di server/canale Discord vengono aggiunti al prompt del modello come contesto non attendibile, non come prefisso di risposta visibile all'utente. Se un modello copia quell'involucro nella risposta, OpenClaw rimuove i metadati copiati dalle risposte in uscita e dal contesto di replay futuro.
- Per impostazione predefinita (`session.dmScope=main`), le chat dirette condividono la sessione principale dell'agente (`agent:main:main`).
- I canali del server sono chiavi di sessione isolate (`agent:<agentId>:discord:channel:<channelId>`).
- I DM di gruppo vengono ignorati per impostazione predefinita (`channels.discord.dm.groupEnabled=false`).
- I comandi slash nativi vengono eseguiti in sessioni di comando isolate (`agent:<agentId>:discord:slash:<userId>`), pur mantenendo `CommandTargetSessionKey` verso la sessione di conversazione instradata.
- La consegna degli annunci di cron/heartbeat solo testuali a Discord usa una sola volta la risposta finale visibile all'assistente. I payload multimediali e dei componenti strutturati restano in più messaggi quando l'agente emette più payload consegnabili.

## Canali forum

I canali forum e media di Discord accettano solo post in thread. OpenClaw supporta due modi per crearli:

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

I forum padre non accettano componenti Discord. Se hai bisogno di componenti, invia al thread stesso (`channel:<threadId>`).

## Componenti interattivi

OpenClaw supporta contenitori di componenti Discord v2 per i messaggi degli agenti. Usa lo strumento messaggi con un payload `components`. I risultati delle interazioni vengono instradati di nuovo all'agente come normali messaggi in ingresso e seguono le impostazioni Discord `replyToMode` esistenti.

Blocchi supportati:

- `text`, `section`, `separator`, `actions`, `media-gallery`, `file`
- Le righe di azioni consentono fino a 5 pulsanti o un singolo menu di selezione
- Tipi di selezione: `string`, `user`, `role`, `mentionable`, `channel`

Per impostazione predefinita, i componenti sono monouso. Imposta `components.reusable=true` per consentire l'uso ripetuto di pulsanti, selezioni e moduli fino alla loro scadenza.

Per limitare chi può fare clic su un pulsante, imposta `allowedUsers` su quel pulsante (ID utente Discord, tag o `*`). Quando è configurato, gli utenti non corrispondenti ricevono un rifiuto effimero.

I callback dei componenti scadono dopo 30 minuti per impostazione predefinita. Imposta `channels.discord.agentComponents.ttlMs` per modificare la durata del registro dei callback per l'account Discord predefinito, oppure `channels.discord.accounts.<accountId>.agentComponents.ttlMs` per sovrascrivere un account in una configurazione multi-account. Il valore è in millisecondi, deve essere un intero positivo ed è limitato a `86400000` (24 ore). TTL più lunghi sono utili per flussi di lavoro di revisione o approvazione che richiedono che i pulsanti restino utilizzabili, ma estendono anche la finestra in cui un vecchio messaggio Discord può ancora attivare un'azione. Preferisci il TTL più breve adatto al flusso di lavoro e mantieni il valore predefinito quando callback obsoleti sarebbero sorprendenti.

I comandi slash `/model` e `/models` aprono un selettore interattivo di modelli con menu a discesa per provider, modello e runtime compatibile, più un passaggio Invia. `/models add` è deprecato e ora restituisce un messaggio di deprecazione invece di registrare modelli dalla chat. La risposta del selettore è effimera e solo l'utente che l'ha invocata può usarla. I menu di selezione di Discord sono limitati a 25 opzioni, quindi aggiungi voci `provider/*` a `agents.defaults.models` quando vuoi che il selettore mostri modelli scoperti dinamicamente solo per provider selezionati come `openai` o `vllm`.

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
  <Tab title="Policy DM">
    `channels.discord.dmPolicy` controlla l'accesso ai DM. `channels.discord.allowFrom` è l'allowlist DM canonica.

    - `pairing` (predefinito)
    - `allowlist`
    - `open` (richiede che `channels.discord.allowFrom` includa `"*"`)
    - `disabled`

    Se la policy DM non è aperta, gli utenti sconosciuti vengono bloccati (o invitati ad associare l'account in modalità `pairing`).

    Precedenza multi-account:

    - `channels.discord.accounts.default.allowFrom` si applica solo all'account `default`.
    - Per un account, `allowFrom` ha precedenza sul vecchio `dm.allowFrom`.
    - Gli account denominati ereditano `channels.discord.allowFrom` quando il proprio `allowFrom` e il vecchio `dm.allowFrom` non sono impostati.
    - Gli account denominati non ereditano `channels.discord.accounts.default.allowFrom`.

    Le vecchie chiavi `channels.discord.dm.policy` e `channels.discord.dm.allowFrom` vengono ancora lette per compatibilità. `openclaw doctor --fix` le migra a `dmPolicy` e `allowFrom` quando può farlo senza modificare l'accesso.

    Formato del target DM per la consegna:

    - `user:<id>`
    - menzione `<@id>`

    Gli ID numerici semplici normalmente vengono risolti come ID canale quando è attivo un canale predefinito, ma gli ID elencati nell'`allowFrom` DM effettivo dell'account sono trattati come target DM utente per compatibilità.

  </Tab>

  <Tab title="Gruppi di accesso">
    I DM Discord e l'autorizzazione dei comandi testuali possono usare voci dinamiche `accessGroup:<name>` in `channels.discord.allowFrom`.

    I nomi dei gruppi di accesso sono condivisi tra i canali di messaggistica. Usa `type: "message.senders"` per un gruppo statico i cui membri sono espressi nella normale sintassi `allowFrom` di ciascun canale, oppure `type: "discord.channelAudience"` quando il pubblico corrente `ViewChannel` di un canale Discord deve definire dinamicamente l'appartenenza. Il comportamento condiviso dei gruppi di accesso è documentato qui: [Gruppi di accesso](/it/channels/access-groups).

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

    Un canale testuale Discord non ha un elenco membri separato. `type: "discord.channelAudience"` modella l'appartenenza così: il mittente del DM è membro del server configurato e ha attualmente il permesso effettivo `ViewChannel` sul canale configurato dopo l'applicazione di ruoli e sovrascritture del canale.

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

    Le ricerche falliscono in modo chiuso. Se Discord restituisce `Missing Access`, la ricerca del membro fallisce o il canale appartiene a un server diverso, il mittente del DM viene trattato come non autorizzato.

    Abilita il **Server Members Intent** del Discord Developer Portal per il bot quando usi gruppi di accesso basati sul pubblico del canale. I DM non includono lo stato di membro del server, quindi OpenClaw risolve il membro tramite Discord REST al momento dell'autorizzazione.

  </Tab>

  <Tab title="Policy server">
    La gestione dei server è controllata da `channels.discord.groupPolicy`:

    - `open`
    - `allowlist`
    - `disabled`

    La baseline sicura quando `channels.discord` esiste è `allowlist`.

    Comportamento di `allowlist`:

    - il server deve corrispondere a `channels.discord.guilds` (`id` preferito, slug accettato)
    - allowlist facoltative dei mittenti: `users` (ID stabili consigliati) e `roles` (solo ID ruolo); se una delle due è configurata, i mittenti sono consentiti quando corrispondono a `users` O `roles`
    - la corrispondenza diretta per nome/tag è disabilitata per impostazione predefinita; abilita `channels.discord.dangerouslyAllowNameMatching: true` solo come modalità di compatibilità di emergenza
    - nomi/tag sono supportati per `users`, ma gli ID sono più sicuri; `openclaw security audit` avvisa quando vengono usate voci nome/tag
    - se un server ha `channels` configurato, i canali non elencati vengono negati
    - se un server non ha un blocco `channels`, tutti i canali in quel server incluso nell'allowlist sono consentiti

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

    Se imposti solo `DISCORD_BOT_TOKEN` e non crei un blocco `channels.discord`, il fallback del runtime è `groupPolicy="allowlist"` (con un avviso nei log), anche se `channels.defaults.groupPolicy` è `open`.

  </Tab>

  <Tab title="Menzioni e DM di gruppo">
    I messaggi dei server sono filtrati per menzione per impostazione predefinita.

    Il rilevamento delle menzioni include:

    - menzione esplicita del bot
    - pattern di menzione configurati (`agents.list[].groupChat.mentionPatterns`, fallback `messages.groupChat.mentionPatterns`)
    - comportamento implicito di risposta al bot nei casi supportati

    Quando scrivi messaggi Discord in uscita, usa la sintassi di menzione canonica: `<@USER_ID>` per gli utenti, `<#CHANNEL_ID>` per i canali e `<@&ROLE_ID>` per i ruoli. Non usare la vecchia forma di menzione nickname `<@!USER_ID>`.

    `requireMention` è configurato per server/canale (`channels.discord.guilds...`).
    `ignoreOtherMentions` scarta facoltativamente i messaggi che menzionano un altro utente/ruolo ma non il bot (esclusi @everyone/@here).

    DM di gruppo:

    - predefinito: ignorati (`dm.groupEnabled=false`)
    - allowlist facoltativa tramite `dm.groupChannels` (ID canale o slug)

  </Tab>
</Tabs>

### Routing degli agenti basato sui ruoli

Usa `bindings[].match.roles` per indirizzare i membri di una gilda Discord ad agenti diversi in base all'ID del ruolo. I binding basati sui ruoli accettano solo ID di ruolo e vengono valutati dopo i binding peer o parent-peer e prima dei binding solo gilda. Se un binding imposta anche altri campi di corrispondenza (per esempio `peer` + `guildId` + `roles`), tutti i campi configurati devono corrispondere.

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

- `commands.native` ha valore predefinito `"auto"` ed è abilitato per Discord.
- Override per canale: `channels.discord.commands.native`.
- `commands.native=false` salta la registrazione e la pulizia degli slash command Discord durante l'avvio. I comandi registrati in precedenza possono rimanere visibili in Discord finché non li rimuovi dall'app Discord.
- L'autorizzazione dei comandi nativi usa le stesse allowlist/policy Discord della normale gestione dei messaggi.
- I comandi possono essere ancora visibili nell'interfaccia utente di Discord per utenti non autorizzati; l'esecuzione applica comunque l'autorizzazione OpenClaw e restituisce "non autorizzato".

Vedi [Slash command](/it/tools/slash-commands) per il catalogo e il comportamento dei comandi.

Impostazioni predefinite degli slash command:

- `ephemeral: true`

## Dettagli della funzionalità

<AccordionGroup>
  <Accordion title="Tag di risposta e risposte native">
    Discord supporta tag di risposta nell'output dell'agente:

    - `[[reply_to_current]]`
    - `[[reply_to:<id>]]`

    Controllato da `channels.discord.replyToMode`:

    - `off` (predefinito)
    - `first`
    - `all`
    - `batched`

    Nota: `off` disabilita il threading implicito delle risposte. I tag espliciti `[[reply_to_*]]` vengono comunque rispettati.
    `first` collega sempre il riferimento di risposta nativa implicita al primo messaggio Discord in uscita per il turno.
    `batched` collega il riferimento di risposta nativa implicita di Discord solo quando
    l'evento in ingresso era un batch con debounce di più messaggi. Questo è utile
    quando vuoi risposte native soprattutto per chat a raffica ambigue, non per ogni
    turno con un singolo messaggio.

    Gli ID dei messaggi sono esposti nel contesto/nella cronologia, così gli agenti possono indirizzarsi a messaggi specifici.

  </Accordion>

  <Accordion title="Anteprime dei link">
    Discord genera per impostazione predefinita embed ricchi per i link URL. OpenClaw sopprime per impostazione predefinita questi embed generati sui messaggi Discord in uscita, quindi gli URL inviati dagli agenti restano link semplici salvo attivazione esplicita:

```json5
{
  channels: {
    discord: {
      suppressEmbeds: false,
    },
  },
}
```

    Imposta `channels.discord.accounts.<id>.suppressEmbeds` per sovrascrivere un account. Anche gli invii tramite strumento messaggio dell'agente possono passare `suppressEmbeds: false` per un singolo messaggio. I payload Discord espliciti `embeds` non sono soppressi dall'impostazione predefinita delle anteprime dei link.

  </Accordion>

  <Accordion title="Anteprima dello stream live">
    OpenClaw può trasmettere risposte in bozza inviando un messaggio temporaneo e modificandolo man mano che arriva il testo. `channels.discord.streaming` accetta `off` | `partial` | `block` | `progress` (predefinito). `progress` mantiene una bozza di stato modificabile e la aggiorna con l'avanzamento degli strumenti fino alla consegna finale; l'etichetta iniziale condivisa è una riga scorrevole, quindi scompare come il resto quando appare abbastanza lavoro. `streamMode` è un alias legacy del runtime. Esegui `openclaw doctor --fix` per riscrivere la configurazione persistente sulla chiave canonica.

    Imposta `channels.discord.streaming.mode` su `off` per disabilitare le modifiche dell'anteprima Discord. Se lo streaming a blocchi Discord è abilitato esplicitamente, OpenClaw salta lo stream di anteprima per evitare un doppio streaming.

```json5
{
  channels: {
    discord: {
      streaming: {
        mode: "progress",
        progress: {
          label: "auto",
          maxLines: 8,
          maxLineChars: 120,
          toolProgress: true,
          commentary: false,
        },
      },
    },
  },
}
```

    - `partial` modifica un singolo messaggio di anteprima man mano che arrivano i token.
    - `block` emette blocchi di dimensione bozza (usa `draftChunk` per regolare dimensione e punti di interruzione, limitati a `textChunkLimit`).
    - Le risposte finali con media, errore e risposta esplicita annullano le modifiche di anteprima in sospeso.
    - `streaming.preview.toolProgress` (predefinito `true`) controlla se gli aggiornamenti di strumenti/avanzamento riutilizzano il messaggio di anteprima.
    - Le righe di strumenti/avanzamento vengono rese come emoji compatta + titolo + dettaglio quando disponibili, per esempio `🛠️ Bash: run tests` o `🔎 Web Search: for "query"`.
    - `streaming.progress.commentary` (predefinito `false`) abilita il testo di commento/preambolo dell'assistente nella bozza temporanea di avanzamento. Il commento viene ripulito prima della visualizzazione, resta transitorio e non modifica la consegna della risposta finale.
    - `streaming.progress.maxLineChars` controlla il budget di anteprima dell'avanzamento per riga. Il testo è abbreviato ai confini delle parole; i dettagli di comandi e percorsi mantengono suffissi utili.
    - `streaming.preview.commandText` / `streaming.progress.commandText` controlla i dettagli di comando/esecuzione nelle righe di avanzamento compatte: `raw` (predefinito) o `status` (solo etichetta dello strumento).

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

    Lo streaming dell'anteprima è solo testuale; le risposte con media ricadono sulla consegna normale. Quando lo streaming `block` è abilitato esplicitamente, OpenClaw salta lo stream di anteprima per evitare un doppio streaming.

  </Accordion>

  <Accordion title="Cronologia, contesto e comportamento dei thread">
    Contesto della cronologia della gilda:

    - `channels.discord.historyLimit` predefinito `20`
    - fallback: `messages.groupChat.historyLimit`
    - `0` disabilita

    Controlli della cronologia DM:

    - `channels.discord.dmHistoryLimit`
    - `channels.discord.dms["<user_id>"].historyLimit`

    Comportamento dei thread:

    - I thread Discord vengono instradati come sessioni di canale ed ereditano la configurazione del canale padre salvo override.
    - Le sessioni thread ereditano la selezione `/model` a livello di sessione del canale padre come fallback solo modello; le selezioni `/model` locali al thread hanno comunque la precedenza e la cronologia della trascrizione del padre non viene copiata salvo abilitazione dell'ereditarietà della trascrizione.
    - `channels.discord.thread.inheritParent` (predefinito `false`) abilita i nuovi auto-thread all'inizializzazione dalla trascrizione del padre. Gli override per account si trovano sotto `channels.discord.accounts.<id>.thread.inheritParent`.
    - Le reazioni dello strumento messaggio possono risolvere destinazioni DM `user:<id>`.
    - `guilds.<guild>.channels.<channel>.requireMention: false` viene preservato durante il fallback di attivazione nella fase di risposta.

    Gli argomenti dei canali vengono inseriti come contesto **non attendibile**. Le allowlist regolano chi può attivare l'agente, non un confine completo di redazione del contesto supplementare.

  </Accordion>

  <Accordion title="Sessioni vincolate a thread per subagenti">
    Discord può associare un thread a una destinazione di sessione, così i messaggi successivi in quel thread continuano a essere instradati alla stessa sessione (incluse le sessioni dei subagenti).

    Comandi:

    - `/focus <target>` associa il thread corrente/nuovo a una destinazione subagente/sessione
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
    - `defaultSpawnContext` controlla il contesto nativo del subagente per gli spawn vincolati a thread. Predefinito: `"fork"`.
    - Le chiavi deprecate `spawnSubagentSessions`/`spawnAcpSessions` vengono migrate da `openclaw doctor --fix`.
    - Se le associazioni dei thread sono disabilitate per un account, `/focus` e le operazioni correlate di associazione dei thread non sono disponibili.

    Vedi [Sub-agenti](/it/tools/subagents), [Agenti ACP](/it/tools/acp-agents) e [Riferimento di configurazione](/it/gateway/configuration-reference).

  </Accordion>

  <Accordion title="Binding persistenti dei canali ACP">
    Per workspace ACP stabili "sempre attivi", configura binding ACP tipizzati di primo livello che puntano a conversazioni Discord.

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

    - `/acp spawn codex --bind here` associa il canale o thread corrente in loco e mantiene i messaggi futuri sulla stessa sessione ACP. I messaggi dei thread ereditano il binding del canale padre.
    - In un canale o thread associato, `/new` e `/reset` reimpostano la stessa sessione ACP in loco. Le associazioni temporanee dei thread possono sovrascrivere la risoluzione della destinazione mentre sono attive.
    - `spawnSessions` governa la creazione/associazione di thread figli tramite `--thread auto|here`.

    Vedi [Agenti ACP](/it/tools/acp-agents) per i dettagli sul comportamento dei binding.

  </Accordion>

  <Accordion title="Notifiche di reazione">
    Modalità di notifica delle reazioni per gilda:

    - `off`
    - `own` (predefinito)
    - `all`
    - `allowlist` (usa `guilds.<id>.users`)

    Gli eventi di reazione vengono trasformati in eventi di sistema e allegati alla sessione Discord instradata.

  </Accordion>

  <Accordion title="Reazioni di ack">
    `ackReaction` invia un'emoji di conferma mentre OpenClaw elabora un messaggio in ingresso.

    Ordine di risoluzione:

    - `channels.discord.accounts.<accountId>.ackReaction`
    - `channels.discord.ackReaction`
    - `messages.ackReaction`
    - fallback emoji dell'identità dell'agente (`agents.list[].identity.emoji`, altrimenti "👀")

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
    Abilita la risoluzione PluralKit per mappare i messaggi proxy all'identità del membro del sistema:

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
    - se la ricerca non riesce, i messaggi inoltrati tramite proxy vengono trattati come messaggi di bot e scartati, a meno che `allowBots=true`

  </Accordion>

  <Accordion title="Outbound mention aliases">
    Usa `mentionAliases` quando gli agenti richiedono menzioni in uscita deterministiche per utenti Discord noti. Le chiavi sono handle senza la `@` iniziale; i valori sono ID utente Discord. Gli handle sconosciuti, `@everyone`, `@here` e le menzioni all'interno di code span Markdown restano invariati.

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
    Gli aggiornamenti di presenza vengono applicati quando imposti un campo di stato o attività, oppure quando abiliti la presenza automatica.

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

    La presenza automatica mappa la disponibilità del runtime allo stato Discord: integro => online, degradato o sconosciuto => inattivo, esaurito o non disponibile => dnd. Override di testo facoltativi:

    - `autoPresence.healthyText`
    - `autoPresence.degradedText`
    - `autoPresence.exhaustedText` (supporta il placeholder `{reason}`)

  </Accordion>

  <Accordion title="Approvals in Discord">
    Discord supporta la gestione delle approvazioni basata su pulsanti nei DM e può facoltativamente pubblicare richieste di approvazione nel canale di origine.

    Percorso di configurazione:

    - `channels.discord.execApprovals.enabled`
    - `channels.discord.execApprovals.approvers` (facoltativo; ripiega su `commands.ownerAllowFrom` quando possibile)
    - `channels.discord.execApprovals.target` (`dm` | `channel` | `both`, predefinito: `dm`)
    - `agentFilter`, `sessionFilter`, `cleanupAfterResolve`

    Discord abilita automaticamente le approvazioni exec native quando `enabled` non è impostato o è `"auto"` e almeno un approvatore può essere risolto, da `execApprovals.approvers` o da `commands.ownerAllowFrom`. Discord non deduce gli approvatori exec da `allowFrom` del canale, da `dm.allowFrom` legacy o da `defaultTo` dei messaggi diretti. Imposta `enabled: false` per disabilitare esplicitamente Discord come client di approvazione nativo.

    Per comandi di gruppo sensibili riservati al proprietario, come `/diagnostics` e `/export-trajectory`, OpenClaw invia le richieste di approvazione e i risultati finali in privato. Prova prima il DM Discord quando il proprietario che invoca il comando ha una route proprietario Discord; se non è disponibile, ripiega sulla prima route proprietario disponibile da `commands.ownerAllowFrom`, come Telegram.

    Quando `target` è `channel` o `both`, la richiesta di approvazione è visibile nel canale. Solo gli approvatori risolti possono usare i pulsanti; gli altri utenti ricevono un rifiuto effimero. Le richieste di approvazione includono il testo del comando, quindi abilita la consegna nel canale solo in canali attendibili. Se l'ID del canale non può essere derivato dalla chiave di sessione, OpenClaw ripiega sulla consegna tramite DM.

    Discord visualizza anche i pulsanti di approvazione condivisi usati da altri canali chat. L'adapter Discord nativo aggiunge principalmente l'instradamento DM degli approvatori e la distribuzione al canale.
    Quando questi pulsanti sono presenti, sono la UX di approvazione principale; OpenClaw
    dovrebbe includere un comando manuale `/approve` solo quando il risultato dello strumento indica che
    le approvazioni in chat non sono disponibili o che l'approvazione manuale è l'unico percorso.
    Se il runtime di approvazione nativo Discord non è attivo, OpenClaw mantiene visibile il
    prompt locale deterministico `/approve <id> <decision>`. Se il
    runtime è attivo ma una scheda nativa non può essere consegnata ad alcun target,
    OpenClaw invia un avviso di fallback nella stessa chat con il comando `/approve`
    esatto dall'approvazione in sospeso.

    L'autenticazione del Gateway e la risoluzione delle approvazioni seguono il contratto condiviso del client Gateway (gli ID `plugin:` vengono risolti tramite `plugin.approval.resolve`; gli altri ID tramite `exec.approval.resolve`). Le approvazioni scadono dopo 30 minuti per impostazione predefinita.

    Vedi [Approvazioni Exec](/it/tools/exec-approvals).

  </Accordion>
</AccordionGroup>

## Strumenti e gate delle azioni

Le azioni dei messaggi Discord includono azioni di messaggistica, amministrazione dei canali, moderazione, presenza e metadati.

Esempi principali:

- messaggistica: `sendMessage`, `readMessages`, `editMessage`, `deleteMessage`, `threadReply`
- reazioni: `react`, `reactions`, `emojiList`
- moderazione: `timeout`, `kick`, `ban`
- presenza: `setPresence`

L'azione `event-create` accetta un parametro facoltativo `image` (URL o percorso di file locale) per impostare l'immagine di copertina dell'evento programmato.

I gate delle azioni si trovano in `channels.discord.actions.*`.

Comportamento predefinito dei gate:

| Gruppo di azioni                                                                                                                                                         | Predefinito  |
| ------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ------------ |
| reactions, messages, threads, pins, polls, search, memberInfo, roleInfo, channelInfo, channels, voiceStatus, events, stickers, emojiUploads, stickerUploads, permissions | abilitato    |
| roles                                                                                                                                                                    | disabilitato |
| moderation                                                                                                                                                               | disabilitato |
| presence                                                                                                                                                                 | disabilitato |

## UI dei componenti v2

OpenClaw usa i componenti v2 di Discord per le approvazioni exec e i marcatori tra contesti. Le azioni dei messaggi Discord possono anche accettare `components` per UI personalizzate (avanzato; richiede la costruzione di un payload di componente tramite lo strumento discord), mentre gli `embeds` legacy restano disponibili ma non sono consigliati.

- `channels.discord.ui.components.accentColor` imposta il colore di accento usato dai contenitori dei componenti Discord (esadecimale).
- Impostalo per account con `channels.discord.accounts.<id>.ui.components.accentColor`.
- `channels.discord.agentComponents.ttlMs` controlla per quanto tempo i callback dei componenti Discord inviati restano registrati (predefinito `1800000`, massimo `86400000`). Impostalo per account con `channels.discord.accounts.<id>.agentComponents.ttlMs`.
- Gli `embeds` vengono ignorati quando sono presenti componenti v2.
- Le anteprime URL semplici vengono soppresse per impostazione predefinita. Imposta `suppressEmbeds: false` su un'azione di messaggio quando un singolo link in uscita deve espandersi.

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

Discord ha due superfici vocali distinte: **canali vocali** in tempo reale (conversazioni continue) e **allegati di messaggi vocali** (il formato con anteprima della forma d'onda). Il gateway supporta entrambe.

### Canali vocali

Checklist di configurazione:

1. Abilita Message Content Intent nel Portale per sviluppatori Discord.
2. Abilita Server Members Intent quando vengono usate liste di autorizzazione per ruoli/utenti.
3. Invita il bot con gli scope `bot` e `applications.commands`.
4. Concedi Connect, Speak, Send Messages e Read Message History nel canale vocale di destinazione.
5. Abilita i comandi nativi (`commands.native` o `channels.discord.commands.native`).
6. Configura `channels.discord.voice`.

Usa `/vc join|leave|status` per controllare le sessioni. Il comando usa l'agente predefinito dell'account e segue le stesse regole di allowlist e policy di gruppo degli altri comandi Discord.

```bash
/vc join channel:<voice-channel-id>
/vc status
/vc leave
```

Per ispezionare le autorizzazioni effettive del bot prima dell'accesso, esegui:

```bash
openclaw channels capabilities --channel discord --target channel:<voice-channel-id>
```

Esempio di accesso automatico:

```json5
{
  channels: {
    discord: {
      voice: {
        enabled: true,
        model: "openai/gpt-5.5",
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
          speakerVoice: "cedar",
        },
      },
    },
  },
}
```

Note:

- `voice.tts` sostituisce `messages.tts` solo per la riproduzione vocale `stt-tts`. Le modalità realtime usano `voice.realtime.speakerVoice`.
- `voice.mode` controlla il percorso della conversazione. Il valore predefinito è `agent-proxy`: un front end vocale realtime gestisce tempi dei turni, interruzioni e riproduzione, delega il lavoro sostanziale all'agente OpenClaw instradato tramite `openclaw_agent_consult` e tratta il risultato come un prompt Discord digitato da quello speaker. `stt-tts` mantiene il flusso batch precedente con STT più TTS. `bidi` consente al modello realtime di conversare direttamente esponendo al tempo stesso `openclaw_agent_consult` per il cervello OpenClaw.
- `voice.agentSession` controlla quale conversazione OpenClaw riceve i turni vocali. Lascialo non impostato per la sessione propria del canale vocale, oppure imposta `{ mode: "target", target: "channel:<text-channel-id>" }` per fare in modo che il canale vocale agisca come estensione microfono/speaker di una sessione esistente di un canale di testo Discord, come `#maintainers`.
- `voice.model` sostituisce il cervello dell'agente OpenClaw per le risposte vocali Discord e le consultazioni realtime. Lascialo non impostato per ereditare il modello dell'agente instradato. È separato da `voice.realtime.model`.
- `voice.followUsers` consente al bot di unirsi, spostarsi e lasciare la voce Discord con utenti selezionati. Vedi [Seguire utenti in voce](#follow-users-in-voice) per regole di comportamento ed esempi.
- `agent-proxy` instrada il parlato tramite `discord-voice`, che conserva la normale autorizzazione di proprietario/strumento per lo speaker e la sessione di destinazione, ma nasconde lo strumento `tts` dell'agente perché la voce Discord possiede la riproduzione. Per impostazione predefinita, `agent-proxy` concede alla consultazione accesso completo agli strumenti equivalente al proprietario per gli speaker proprietari (`voice.realtime.toolPolicy: "owner"`) e preferisce fortemente consultare l'agente OpenClaw prima di risposte sostanziali (`voice.realtime.consultPolicy: "always"`). In quella modalità predefinita `always`, il livello realtime non pronuncia automaticamente riempitivi prima della risposta della consultazione; acquisisce e trascrive il parlato, quindi pronuncia la risposta OpenClaw instradata. Se più risposte di consultazione forzata terminano mentre Discord sta ancora riproducendo la prima risposta, le successive risposte di parlato esatto vengono accodate fino a quando la riproduzione diventa inattiva, invece di sostituire il parlato a metà frase.
- In modalità `stt-tts`, STT usa `tools.media.audio`; `voice.model` non influisce sulla trascrizione.
- Nelle modalità realtime, `voice.realtime.provider`, `voice.realtime.model` e `voice.realtime.speakerVoice` configurano la sessione audio realtime. Per OpenAI Realtime 2 più il cervello Codex, usa `voice.realtime.model: "gpt-realtime-2"` e `voice.model: "openai/gpt-5.5"`.
- Le modalità vocali realtime includono per impostazione predefinita piccoli file profilo `IDENTITY.md`, `USER.md` e `SOUL.md` nelle istruzioni del provider realtime, così i turni diretti rapidi mantengono la stessa identità, il grounding dell'utente e la persona dell'agente OpenClaw instradato. Imposta `voice.realtime.bootstrapContextFiles` su un sottoinsieme per personalizzare questo comportamento, oppure su `[]` per disabilitarlo. I file di bootstrap realtime supportati sono limitati a quei file profilo; `AGENTS.md` resta nel normale contesto dell'agente. Il contesto profilo inserito non sostituisce `openclaw_agent_consult` per il lavoro nello spazio di lavoro, i fatti correnti, la ricerca in memoria o le azioni supportate da strumenti.
- In modalità realtime OpenAI `agent-proxy`, imposta `voice.realtime.requireWakeName: true` per mantenere silenziosa la voce realtime Discord finché una trascrizione non inizia o termina con un nome di attivazione. I nomi di attivazione configurati devono essere di una o due parole. Se `voice.realtime.wakeNames` non è impostato, OpenClaw usa il `name` dell'agente instradato più `OpenClaw`, ripiegando sull'id dell'agente più `OpenClaw`. Il gating tramite nome di attivazione disabilita la risposta automatica del provider realtime, instrada i turni accettati attraverso il percorso di consultazione dell'agente OpenClaw e fornisce un breve riconoscimento parlato quando un nome di attivazione iniziale viene riconosciuto dalla trascrizione parziale prima dell'arrivo della trascrizione finale.
- Il provider realtime OpenAI accetta i nomi evento correnti di Realtime 2 e gli alias legacy compatibili con Codex per eventi di audio di output e trascrizione, così gli snapshot dei provider compatibili possono divergere senza perdere l'audio dell'assistente.
- `voice.realtime.bargeIn` controlla se gli eventi di avvio speaker di Discord interrompono la riproduzione realtime attiva. Se non impostato, segue l'impostazione di interruzione dell'audio di input del provider realtime.
- `voice.realtime.minBargeInAudioEndMs` controlla la durata minima della riproduzione dell'assistente prima che un barge-in realtime OpenAI tronchi l'audio. Valore predefinito: `250`. Imposta `0` per l'interruzione immediata in stanze con poco eco, oppure aumentalo per configurazioni speaker con molto eco.
- Per una voce OpenAI sulla riproduzione Discord, imposta `voice.tts.provider: "openai"` e scegli una voce di sintesi vocale sotto `voice.tts.providers.openai.speakerVoice`. `cedar` è una buona scelta dal suono maschile sull'attuale modello TTS OpenAI.
- Le sostituzioni `systemPrompt` Discord per canale si applicano ai turni di trascrizione vocale per quel canale vocale.
- I turni di trascrizione vocale derivano lo stato di proprietario da `allowFrom` di Discord (o `dm.allowFrom`) per comandi protetti dal proprietario e azioni di canale. La visibilità degli strumenti dell'agente segue la policy degli strumenti configurata per la sessione instradata.
- La voce Discord è opzionale per le configurazioni solo testo; imposta `channels.discord.voice.enabled=true` (oppure mantieni un blocco `channels.discord.voice` esistente) per abilitare i comandi `/vc`, il runtime vocale e l'intent Gateway `GuildVoiceStates`.
- `channels.discord.intents.voiceStates` può sostituire esplicitamente la sottoscrizione all'intent dello stato vocale. Lascialo non impostato perché l'intent segua l'abilitazione vocale effettiva.
- Se `voice.autoJoin` ha più voci per la stessa guild, OpenClaw si unisce all'ultimo canale configurato per quella guild.
- `voice.allowedChannels` è una allowlist di residenza opzionale. Lasciala non impostata per consentire `/vc join` in qualsiasi canale vocale Discord autorizzato. Quando è impostata, `/vc join`, l'auto-join all'avvio e gli spostamenti dello stato vocale del bot sono limitati alle voci `{ guildId, channelId }` elencate. Impostala su un array vuoto per negare tutti gli accessi vocali Discord. Se Discord sposta il bot fuori dalla allowlist, OpenClaw lascia quel canale e si ricongiunge alla destinazione auto-join configurata quando disponibile.
- `voice.daveEncryption` e `voice.decryptionFailureTolerance` vengono passati alle opzioni di join di `@discordjs/voice`.
- I valori predefiniti di `@discordjs/voice` sono `daveEncryption=true` e `decryptionFailureTolerance=24` se non impostati.
- OpenClaw usa il codec `libopus-wasm` incluso per la ricezione vocale Discord e la riproduzione PCM raw realtime. Include una build WebAssembly libopus fissata e non richiede addon opus nativi.
- `voice.connectTimeoutMs` controlla l'attesa iniziale `Ready` di `@discordjs/voice` per `/vc join` e i tentativi di auto-join. Valore predefinito: `30000`.
- `voice.reconnectGraceMs` controlla per quanto tempo OpenClaw attende che una sessione vocale disconnessa inizi a riconnettersi prima di distruggerla. Valore predefinito: `15000`.
- In modalità `stt-tts`, la riproduzione vocale non si ferma solo perché un altro utente inizia a parlare. Per evitare cicli di feedback, OpenClaw ignora la nuova acquisizione vocale mentre TTS è in riproduzione; parla dopo la fine della riproduzione per il turno successivo. Le modalità realtime inoltrano gli avvii speaker come segnali di barge-in al provider realtime.
- Nelle modalità realtime, l'eco dagli speaker in un microfono aperto può sembrare un barge-in e interrompere la riproduzione. Per stanze Discord con molto eco, imposta `voice.realtime.providers.openai.interruptResponseOnInputAudio: false` per impedire a OpenAI di interrompere automaticamente sull'audio di input. Aggiungi `voice.realtime.bargeIn: true` se vuoi comunque che gli eventi di avvio speaker di Discord interrompano la riproduzione attiva. Il bridge realtime OpenAI ignora i troncamenti di riproduzione più brevi di `voice.realtime.minBargeInAudioEndMs` come probabile eco/rumore e li registra come saltati invece di cancellare la riproduzione Discord.
- `voice.captureSilenceGraceMs` controlla per quanto tempo OpenClaw attende dopo che Discord segnala che uno speaker ha smesso di parlare prima di finalizzare quel segmento audio per STT. Valore predefinito: `2000`; aumentalo se Discord divide pause normali in trascrizioni parziali frammentate.
- Quando ElevenLabs è il provider TTS selezionato, la riproduzione vocale Discord usa TTS in streaming e parte dallo stream di risposta del provider. I provider senza supporto streaming ripiegano sul percorso con file temporaneo sintetizzato.
- OpenClaw osserva anche gli errori di decrittazione in ricezione e si ripristina automaticamente lasciando e rientrando nel canale vocale dopo errori ripetuti in una breve finestra.
- Se i log di ricezione mostrano ripetutamente `DecryptionFailed(UnencryptedWhenPassthroughDisabled)` dopo l'aggiornamento, raccogli un report delle dipendenze e i log. La linea `@discordjs/voice` inclusa comprende la correzione upstream del padding dalla PR discord.js #11449, che ha chiuso l'issue discord.js #11419.
- Gli eventi di ricezione `The operation was aborted` sono previsti quando OpenClaw finalizza un segmento speaker acquisito; sono diagnostica dettagliata, non avvisi.
- I log vocali Discord dettagliati includono un'anteprima limitata su una riga della trascrizione STT per ogni segmento speaker accettato, così il debug mostra sia il lato utente sia il lato risposta dell'agente senza scaricare testo di trascrizione non limitato.
- In modalità `agent-proxy`, il fallback di consultazione forzata salta frammenti di trascrizione probabilmente incompleti, come testo che termina con `...` o connettori finali come `and`, oltre a chiusure palesemente non azionabili come “be right back” o “bye”. I log mostrano `forced agent consult skipped reason=...` quando questo impedisce una risposta accodata obsoleta.

### Seguire utenti in voce

Usa `voice.followUsers` quando vuoi che il bot vocale Discord resti con uno o più utenti Discord noti invece di unirsi a un canale fisso all'avvio o aspettare `/vc join`.

```json5
{
  channels: {
    discord: {
      voice: {
        enabled: true,
        followUsersEnabled: true,
        followUsers: ["discord:123456789012345678"],
        allowedChannels: [
          {
            guildId: "123456789012345678",
            channelId: "234567890123456789",
          },
        ],
      },
    },
  },
}
```

Comportamento:

- `followUsers` accetta ID utente Discord raw e valori `discord:<id>`. OpenClaw normalizza entrambe le forme prima di confrontare gli eventi di stato vocale.
- `followUsersEnabled` ha valore predefinito `true` quando `followUsers` è configurato. Impostalo su `false` per mantenere l'elenco salvato ma fermare il follow vocale automatico.
- Quando un utente seguito entra in un canale vocale consentito, OpenClaw entra in quel canale. Quando l'utente si sposta, OpenClaw si sposta con lui. Quando l'utente seguito attivo si disconnette, OpenClaw esce.
- Se più utenti seguiti sono nella stessa guild e l'utente seguito attivo esce, OpenClaw si sposta nel canale di un altro utente seguito tracciato prima di lasciare la guild. Se diversi utenti seguiti si spostano contemporaneamente, vince l'evento di stato vocale osservato più recente.
- `allowedChannels` continua ad applicarsi. Un utente seguito in un canale non consentito viene ignorato, e una sessione posseduta dal follow si sposta su un altro utente seguito o esce.
- OpenClaw riconcilia gli eventi di stato vocale persi all'avvio e a intervalli limitati. La riconciliazione campiona le guild configurate e limita le ricerche REST per esecuzione, quindi elenchi `followUsers` molto grandi possono richiedere più di un intervallo per convergere.
- Se Discord o un admin sposta il bot mentre sta seguendo un utente, OpenClaw ricostruisce la sessione vocale e preserva la proprietà del follow quando la destinazione è consentita. Se il bot viene spostato fuori da `allowedChannels`, OpenClaw esce e si ricongiunge alla destinazione configurata quando ne esiste una.
- Il ripristino della ricezione DAVE può uscire e rientrare nello stesso canale dopo errori di decrittazione ripetuti. Le sessioni possedute dal follow mantengono la loro proprietà del follow attraverso quel percorso di ripristino, quindi una successiva disconnessione dell'utente seguito lascia comunque il canale.

Scegli tra le modalità di join:

- Usa `followUsers` per configurazioni personali o da operatore in cui il bot dovrebbe essere automaticamente in voce quando lo sei tu.
- Usa `autoJoin` per bot di stanze fisse che dovrebbero essere presenti anche quando nessun utente tracciato è in voce.
- Usa `/vc join` per join una tantum o stanze in cui la presenza vocale automatica sarebbe sorprendente.

Codec vocale Discord:

- I log di ricezione vocale mostrano `discord voice: opus decoder: libopus-wasm`.
- La riproduzione Realtime codifica PCM stereo grezzo a 48 kHz in Opus con lo stesso pacchetto `libopus-wasm` incluso prima di passare i pacchetti a `@discordjs/voice`.
- La riproduzione da file e stream del provider transcodifica in PCM stereo grezzo a 48 kHz con ffmpeg, poi usa `libopus-wasm` per lo stream di pacchetti Opus inviato a Discord.

Pipeline STT più TTS:

- La cattura PCM di Discord viene convertita in un file temporaneo WAV.
- `tools.media.audio` gestisce STT, per esempio `openai/gpt-4o-mini-transcribe`.
- La trascrizione viene inviata tramite ingresso e routing Discord mentre il LLM di risposta viene eseguito con una policy di output vocale che nasconde lo strumento agente `tts` e richiede testo restituito, perché la voce Discord possiede la riproduzione TTS finale.
- `voice.model`, quando impostato, sovrascrive solo il LLM di risposta per questo turno del canale vocale.
- `voice.tts` viene unito sopra `messages.tts`; i provider con supporto allo streaming alimentano direttamente il player, altrimenti il file audio risultante viene riprodotto nel canale unito.

Esempio di sessione canale vocale agent-proxy predefinita:

```json5
{
  channels: {
    discord: {
      voice: {
        enabled: true,
        model: "openai/gpt-5.5",
        followUsersEnabled: true,
        followUsers: ["123456789012345678"],
        realtime: {
          provider: "openai",
          model: "gpt-realtime-2",
          speakerVoice: "cedar",
        },
      },
    },
  },
}
```

Senza un blocco `voice.agentSession`, ogni canale vocale ottiene la propria sessione OpenClaw instradata. Per esempio, `/vc join channel:234567890123456789` parla con la sessione per quel canale vocale Discord. Il modello realtime è solo il front end vocale; le richieste sostanziali vengono passate all'agente OpenClaw configurato. Se il modello realtime produce una trascrizione finale senza chiamare lo strumento di consultazione, OpenClaw forza la consultazione come fallback, così l'impostazione predefinita si comporta comunque come una conversazione con l'agente.

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
          providers: {
            openai: {
              model: "gpt-4o-mini-tts",
              speakerVoice: "cedar",
            },
          },
        },
      },
    },
  },
}
```

Esempio bidi Realtime:

```json5
{
  channels: {
    discord: {
      voice: {
        enabled: true,
        mode: "bidi",
        model: "openai/gpt-5.5",
        realtime: {
          provider: "openai",
          model: "gpt-realtime-2",
          speakerVoice: "cedar",
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
        model: "openai/gpt-5.5",
        agentSession: {
          mode: "target",
          target: "channel:123456789012345678",
        },
        realtime: {
          provider: "openai",
          model: "gpt-realtime-2",
          speakerVoice: "cedar",
        },
      },
    },
  },
}
```

In modalità `agent-proxy` il bot entra nel canale vocale configurato, ma i turni dell'agente OpenClaw usano la sessione e l'agente instradati normali del canale di destinazione. La sessione vocale realtime pronuncia di nuovo il risultato restituito nel canale vocale. L'agente supervisore può comunque usare i normali strumenti di messaggistica secondo la propria policy degli strumenti, incluso l'invio di un messaggio Discord separato se è l'azione corretta.

Mentre è attiva un'esecuzione OpenClaw delegata, le nuove trascrizioni vocali Discord vengono trattate come controllo dell'esecuzione live prima di avviare un altro turno dell'agente. Frasi come "status", "cancel that", "use the smaller fix" o "when you're done also check tests" vengono classificate come stato, annullamento, orientamento o input di follow-up per la sessione attiva. Gli esiti di stato, annullamento, orientamento accettato e follow-up vengono pronunciati di nuovo nel canale vocale, così il chiamante sa se OpenClaw ha gestito la richiesta.

Forme di destinazione utili:

- `target: "channel:123456789012345678"` instrada tramite una sessione di canale testuale Discord.
- `target: "123456789012345678"` viene trattato come destinazione di canale.
- `target: "dm:123456789012345678"` o `target: "user:123456789012345678"` instrada tramite quella sessione di messaggio diretto.

Esempio OpenAI Realtime con molto eco:

```json5
{
  channels: {
    discord: {
      voice: {
        enabled: true,
        mode: "bidi",
        model: "openai/gpt-5.5",
        realtime: {
          provider: "openai",
          model: "gpt-realtime-2",
          speakerVoice: "cedar",
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

Usalo quando il modello sente la propria riproduzione Discord tramite un microfono aperto, ma vuoi comunque interromperlo parlando. OpenClaw impedisce a OpenAI di interrompere automaticamente sull'audio di input grezzo, mentre `bargeIn: true` consente agli eventi di avvio parlante Discord e all'audio di un parlante già attivo di annullare le risposte realtime attive prima che il turno catturato successivo raggiunga OpenAI. I segnali di barge-in molto precoci con `audioEndMs` sotto `minBargeInAudioEndMs` vengono trattati come probabile eco/rumore e ignorati, così il modello non si interrompe al primo frame di riproduzione.

Log vocali attesi:

- All'ingresso: `discord voice: joining ... voiceSession=... supervisorSession=... agentSessionMode=... voiceModel=... realtimeModel=...`
- All'avvio realtime: `discord voice: realtime bridge starting ... autoRespond=false interruptResponse=false bargeIn=false minBargeInAudioEndMs=...`
- Sull'audio del parlante: `discord voice: realtime speaker turn opened ...`, `discord voice: realtime input audio started ... outputAudioMs=... outputActive=...` e `discord voice: realtime speaker turn closed ... chunks=... discordBytes=... realtimeBytes=... interruptedPlayback=...`
- Sul parlato obsoleto saltato: `discord voice: realtime forced agent consult skipped reason=incomplete-transcript ...` o `reason=non-actionable-closing ...`
- Al completamento della risposta realtime: `discord voice: realtime audio playback finishing reason=response.done ... audioMs=... chunks=...`
- All'arresto/reset della riproduzione: `discord voice: realtime audio playback stopped reason=... audioMs=... elapsedMs=... chunks=...`
- Sulla consultazione realtime: `discord voice: realtime consult requested ... voiceSession=... supervisorSession=... question=...`
- Sulla risposta dell'agente: `discord voice: agent turn answer ...`
- Sul parlato esatto accodato: `discord voice: realtime exact speech queued ... queued=... outputAudioMs=... outputActive=...`, seguito da `discord voice: realtime exact speech dequeued reason=player-idle ...`
- Sul rilevamento del barge-in: `discord voice: realtime barge-in detected source=speaker-start ...` o `discord voice: realtime barge-in detected source=active-speaker-audio ...`, seguito da `discord voice: realtime barge-in requested reason=... outputAudioMs=... outputActive=...`
- Sull'interruzione realtime: `discord voice: realtime model interrupt requested client:response.cancel reason=barge-in`, seguito da `discord voice: realtime model audio truncated client:conversation.item.truncate reason=barge-in audioEndMs=...` oppure `discord voice: realtime model interrupt confirmed server:response.done status=cancelled ...`
- Su eco/rumore ignorato: `discord voice: realtime model interrupt ignored client:conversation.item.truncate.skipped reason=barge-in audioEndMs=0 minAudioEndMs=250`
- Sul barge-in disabilitato: `discord voice: realtime capture ignored during playback (barge-in disabled) ...`
- Sulla riproduzione inattiva: `discord voice: realtime barge-in ignored reason=... outputActive=false ... playbackChunks=0`

Per eseguire il debug dell'audio troncato, leggi i log vocali realtime come una timeline:

1. `realtime audio playback started` significa che Discord ha iniziato a riprodurre l'audio dell'assistente. Il bridge inizia a contare da questo punto i chunk di output dell'assistente, i byte PCM Discord, i byte realtime del provider e la durata dell'audio sintetizzato.
2. `realtime speaker turn opened` indica che un parlante Discord è diventato attivo. Se la riproduzione è già attiva e `bargeIn` è abilitato, può essere seguito da `barge-in detected source=speaker-start`.
3. `realtime input audio started` indica il primo frame audio effettivo ricevuto per quel turno del parlante. `outputActive=true` o un `outputAudioMs` diverso da zero qui significa che il microfono sta inviando input mentre la riproduzione dell'assistente è ancora attiva.
4. `barge-in detected source=active-speaker-audio` significa che OpenClaw ha visto audio live del parlante mentre la riproduzione dell'assistente era attiva. Questo è utile per distinguere una vera interruzione da un evento Discord di avvio parlante senza audio utile.
5. `barge-in requested reason=...` significa che OpenClaw ha chiesto al provider realtime di annullare o troncare la risposta attiva. Include `outputAudioMs`, `outputActive` e `playbackChunks`, così puoi vedere quanto audio dell'assistente era stato effettivamente riprodotto prima dell'interruzione.
6. `realtime audio playback stopped reason=...` è il punto di reset della riproduzione Discord locale. Il motivo indica chi ha fermato la riproduzione: `barge-in`, `player-idle`, `provider-clear-audio`, `forced-agent-consult`, `stream-close` o `session-close`.
7. `realtime speaker turn closed` riepiloga il turno di input catturato. `chunks=0` o `hasAudio=false` significa che il turno del parlante si è aperto, ma nessun audio utilizzabile ha raggiunto il bridge realtime. `interruptedPlayback=true` significa che quel turno di input si è sovrapposto all'output dell'assistente e ha attivato la logica di barge-in.

Campi utili:

- `outputAudioMs`: durata dell'audio dell'assistente generata dal provider realtime prima della riga di log.
- `audioMs`: durata dell'audio dell'assistente contata da OpenClaw prima dell'arresto della riproduzione.
- `elapsedMs`: tempo di orologio tra apertura e chiusura dello stream di riproduzione o del turno del parlante.
- `discordBytes`: byte PCM stereo a 48 kHz inviati alla voce Discord o ricevuti da essa.
- `realtimeBytes`: byte PCM nel formato del provider inviati al provider realtime o ricevuti da esso.
- `playbackChunks`: chunk audio dell'assistente inoltrati a Discord per la risposta attiva.
- `sinceLastAudioMs`: intervallo tra l'ultimo frame audio del parlante catturato e la chiusura del turno del parlante.

Pattern comuni:

- Un'interruzione immediata con `source=active-speaker-audio`, `outputAudioMs` basso e lo stesso utente vicino di solito indica eco degli altoparlanti che entra nel microfono. Aumenta `voice.realtime.minBargeInAudioEndMs`, abbassa il volume degli altoparlanti, usa cuffie o imposta `voice.realtime.providers.openai.interruptResponseOnInputAudio: false`.
- `source=speaker-start` seguito da `speaker turn closed ... hasAudio=false` significa che Discord ha segnalato l'avvio di un parlante, ma nessun audio ha raggiunto OpenClaw. Può trattarsi di un evento vocale Discord transitorio, comportamento del noise gate o un client che attiva brevemente il microfono.
- `audio playback stopped reason=stream-close` senza un barge-in vicino o `provider-clear-audio` significa che lo stream di riproduzione Discord locale è terminato in modo imprevisto. Controlla i log precedenti del provider e del player Discord.
- `capture ignored during playback (barge-in disabled)` significa che OpenClaw ha scartato intenzionalmente l'input mentre l'audio dell'assistente era attivo. Abilita `voice.realtime.bargeIn` se vuoi che il parlato interrompa la riproduzione.
- `barge-in ignored ... outputActive=false` significa che Discord o il VAD del provider ha segnalato parlato, ma OpenClaw non aveva riproduzione attiva da interrompere. Questo non dovrebbe troncare l'audio.

Le credenziali vengono risolte per componente: autenticazione della route LLM per `voice.model`, autenticazione STT per `tools.media.audio`, autenticazione TTS per `messages.tts`/`voice.tts` e autenticazione del provider realtime per `voice.realtime.providers` o per la normale configurazione di autenticazione del provider.

### Messaggi vocali

I messaggi vocali Discord mostrano un'anteprima della forma d'onda e richiedono audio OGG/Opus. OpenClaw genera automaticamente la forma d'onda, ma richiede `ffmpeg` e `ffprobe` sull'host Gateway per ispezionare e convertire.

- Fornisci un **percorso file locale** (gli URL vengono rifiutati).
- Ometti il contenuto testuale (Discord rifiuta testo + messaggio vocale nello stesso payload).
- È accettato qualsiasi formato audio; OpenClaw converte in OGG/Opus secondo necessità.

```bash
message(action="send", channel="discord", target="channel:123", path="/path/to/audio.mp3", asVoice=true)
```

## Risoluzione dei problemi

<AccordionGroup>
  <Accordion title="Intent non consentiti usati o il bot non vede messaggi della guild">

    - abilita Message Content Intent
    - abilita Server Members Intent quando dipendi dalla risoluzione di utenti/membri
    - riavvia il gateway dopo aver modificato gli intent

  </Accordion>

  <Accordion title="Messaggi della guild bloccati inaspettatamente">

    - verifica `groupPolicy`
    - verifica l'allowlist delle guild in `channels.discord.guilds`
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
    - `requireMention` configurato nel posto sbagliato (deve essere sotto `channels.discord.guilds` o nella voce del canale)
    - mittente bloccato dall'allowlist `users` della guild/del canale

  </Accordion>

  <Accordion title="Turn Discord lunghi o risposte duplicate">

    Log tipici:

    - `Slow listener detected ...`
    - `stuck session: sessionKey=agent:...:discord:... state=processing ...`

    Manopole della coda del gateway Discord:

    - account singolo: `channels.discord.eventQueue.listenerTimeout`
    - account multiplo: `channels.discord.accounts.<accountId>.eventQueue.listenerTimeout`
    - controlla solo il lavoro del listener del gateway Discord, non la durata del turn dell'agente

    Discord non applica un timeout di proprietà del canale ai turn agente in coda. I listener dei messaggi passano il lavoro immediatamente e le esecuzioni Discord in coda preservano l'ordine per sessione finché il ciclo di vita di sessione/strumento/runtime completa o interrompe il lavoro.

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
    OpenClaw recupera i metadati Discord `/gateway/bot` prima di connettersi. Gli errori transitori ripiegano sull'URL del gateway predefinito di Discord e sono limitati nei log.

    Manopole del timeout dei metadati:

    - account singolo: `channels.discord.gatewayInfoTimeoutMs`
    - account multiplo: `channels.discord.accounts.<accountId>.gatewayInfoTimeoutMs`
    - fallback env quando la config non è impostata: `OPENCLAW_DISCORD_GATEWAY_INFO_TIMEOUT_MS`
    - predefinito: `30000` (30 secondi), max: `120000`

  </Accordion>

  <Accordion title="Riavvii per timeout READY del Gateway">
    OpenClaw attende l'evento `READY` del gateway Discord durante l'avvio e dopo le riconnessioni del runtime. Le configurazioni multi-account con avvio scaglionato possono richiedere una finestra READY di avvio più lunga del valore predefinito.

    Manopole del timeout READY:

    - avvio account singolo: `channels.discord.gatewayReadyTimeoutMs`
    - avvio account multiplo: `channels.discord.accounts.<accountId>.gatewayReadyTimeoutMs`
    - fallback env di avvio quando la config non è impostata: `OPENCLAW_DISCORD_READY_TIMEOUT_MS`
    - predefinito di avvio: `15000` (15 secondi), max: `120000`
    - runtime account singolo: `channels.discord.gatewayRuntimeReadyTimeoutMs`
    - runtime account multiplo: `channels.discord.accounts.<accountId>.gatewayRuntimeReadyTimeoutMs`
    - fallback env del runtime quando la config non è impostata: `OPENCLAW_DISCORD_RUNTIME_READY_TIMEOUT_MS`
    - predefinito del runtime: `30000` (30 secondi), max: `120000`

  </Accordion>

  <Accordion title="Discordanze nell'audit delle autorizzazioni">
    I controlli delle autorizzazioni di `channels status --probe` funzionano solo per ID canale numerici.

    Se usi chiavi slug, la corrispondenza runtime può comunque funzionare, ma il probe non può verificare completamente le autorizzazioni.

  </Accordion>

  <Accordion title="Problemi di DM e associazione">

    - DM disabilitati: `channels.discord.dm.enabled=false`
    - policy DM disabilitata: `channels.discord.dmPolicy="disabled"` (legacy: `channels.discord.dm.policy`)
    - approvazione di associazione in attesa in modalità `pairing`

  </Accordion>

  <Accordion title="Loop da bot a bot">
    Per impostazione predefinita, i messaggi creati dai bot vengono ignorati.

    Se imposti `channels.discord.allowBots=true`, usa regole di menzione e allowlist rigorose per evitare comportamenti di loop.
    Preferisci `channels.discord.allowBots="mentions"` per accettare solo messaggi di bot che menzionano il bot.

    OpenClaw include anche la [protezione dai loop dei bot](/it/channels/bot-loop-protection) condivisa. Ogni volta che `allowBots` consente ai messaggi creati dai bot di raggiungere il dispatch, Discord mappa l'evento in ingresso in fatti `(account, channel, bot pair)` e la guardia generica della coppia sopprime la coppia dopo che supera il budget di eventi configurato. La guardia impedisce loop incontrollati tra due bot che in precedenza dovevano essere fermati dai rate limit di Discord; non influisce sui deployment con un solo bot o sulle risposte bot una tantum che restano sotto il budget.

    Impostazioni predefinite (attive quando `allowBots` è impostato):

    - `maxEventsPerWindow: 20` -- la coppia di bot può scambiare 20 messaggi nella finestra scorrevole
    - `windowSeconds: 60` -- lunghezza della finestra scorrevole
    - `cooldownSeconds: 60` -- una volta superato il budget, ogni messaggio aggiuntivo da bot a bot in entrambe le direzioni viene scartato per un minuto

    Configura una volta il valore predefinito condiviso sotto `channels.defaults.botLoopProtection`, quindi sovrascrivi Discord quando un flusso legittimo richiede più margine. La precedenza è:

    - `channels.discord.accounts.<account>.botLoopProtection`
    - `channels.discord.botLoopProtection`
    - `channels.defaults.botLoopProtection`
    - impostazioni predefinite integrate

    Discord usa le chiavi generiche `maxEventsPerWindow`, `windowSeconds` e `cooldownSeconds`.

```json5
{
  channels: {
    defaults: {
      botLoopProtection: {
        maxEventsPerWindow: 20,
        windowSeconds: 60,
        cooldownSeconds: 60,
      },
    },
    discord: {
      // Optional Discord-wide override. Account blocks override individual
      // fields and inherit omitted fields from here.
      botLoopProtection: {
        maxEventsPerWindow: 4,
      },
      accounts: {
        mantis: {
          // Mantis listens to other bots only when they mention her.
          allowBots: "mentions",
        },
        molty: {
          // Molty listens to all bot-authored Discord messages.
          allowBots: true,
          mentionAliases: {
            // Lets Molty write a Mantis Discord mention with the configured user id.
            Mantis: "MANTIS_DISCORD_USER_ID",
          },
          botLoopProtection: {
            // Allow up to five messages per minute before suppressing the pair.
            maxEventsPerWindow: 5,
            windowSeconds: 60,
            cooldownSeconds: 90,
          },
        },
      },
    },
  },
}
```

  </Accordion>

  <Accordion title="STT vocale scartato con DecryptionFailed(...)">

    - mantieni OpenClaw aggiornato (`openclaw update`) in modo che sia presente la logica di recupero della ricezione vocale Discord
    - conferma `channels.discord.voice.daveEncryption=true` (predefinito)
    - parti da `channels.discord.voice.decryptionFailureTolerance=24` (predefinito upstream) e regola solo se necessario
    - monitora i log per:
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
- gateway: `gatewayInfoTimeoutMs`, `gatewayReadyTimeoutMs`, `gatewayRuntimeReadyTimeoutMs`
- risposta/cronologia: `replyToMode`, `historyLimit`, `dmHistoryLimit`, `dms.*.historyLimit`
- consegna: `textChunkLimit`, `chunkMode`, `maxLinesPerMessage`
- streaming: `streaming` (alias legacy: `streamMode`), `streaming.preview.toolProgress`, `draftChunk`, `blockStreaming`, `blockStreamingCoalesce`
- media/riprova: `mediaMaxMb` (limita gli upload Discord in uscita, predefinito `100MB`), `retry`
- azioni: `actions.*`
- presenza: `activity`, `status`, `activityType`, `activityUrl`
- UI: `ui.components.accentColor`
- funzionalità: `threadBindings`, `bindings[]` di primo livello (`type: "acp"`), `pluralkit`, `execApprovals`, `intents`, `agentComponents.enabled`, `agentComponents.ttlMs`, `heartbeat`, `responsePrefix`

</Accordion>

## Sicurezza e operazioni

- Tratta i token bot come segreti (`DISCORD_BOT_TOKEN` preferito negli ambienti supervisionati).
- Concedi autorizzazioni Discord con privilegi minimi.
- Se il deployment/lo stato dei comandi è obsoleto, riavvia il gateway e ricontrolla con `openclaw channels status --probe`.

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
    Mappa guild e canali agli agenti.
  </Card>
  <Card title="Comandi slash" icon="terminal" href="/it/tools/slash-commands">
    Comportamento dei comandi nativi.
  </Card>
</CardGroup>
