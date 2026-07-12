---
read_when:
    - Sviluppo delle funzionalità del canale Discord
summary: Configurazione del bot Discord, chiavi di configurazione, componenti, voce e risoluzione dei problemi
title: Discord
x-i18n:
    generated_at: "2026-07-12T06:48:59Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 1ae3682462003a04e57acbdc98a3713e5ef83f89384b7f3b79633c344855b715
    source_path: channels/discord.md
    workflow: 16
---

OpenClaw si connette a Discord come bot tramite il Gateway ufficiale di Discord. Sono supportati i messaggi diretti e i canali dei server.

<CardGroup cols={3}>
  <Card title="Associazione" icon="link" href="/it/channels/pairing">
    Per impostazione predefinita, i messaggi diretti di Discord usano la modalità di associazione.
  </Card>
  <Card title="Comandi slash" icon="terminal" href="/it/tools/slash-commands">
    Comportamento dei comandi nativi e catalogo dei comandi.
  </Card>
  <Card title="Risoluzione dei problemi dei canali" icon="wrench" href="/it/channels/troubleshooting">
    Diagnostica tra canali e procedura di riparazione.
  </Card>
</CardGroup>

## Configurazione rapida

Crea un'applicazione Discord con un bot, aggiungi il bot al tuo server e associalo a OpenClaw. Se possibile, usa un server privato; se necessario, [creane prima uno](https://support.discord.com/hc/en-us/articles/204849977-How-do-I-create-a-server) (**Create My Own > For me and my friends**).

<Steps>
  <Step title="Crea un'applicazione Discord e un bot">
    Nel [Discord Developer Portal](https://discord.com/developers/applications), fai clic su **New Application** e assegnale un nome (ad esempio "OpenClaw").

    Apri **Bot** nella barra laterale e imposta **Username** sul nome del tuo agente.

  </Step>

  <Step title="Abilita gli intenti privilegiati">
    Sempre nella pagina **Bot**, sotto **Privileged Gateway Intents**, abilita:

    - **Message Content Intent** (obbligatorio)
    - **Server Members Intent** (consigliato; obbligatorio per gli elenchi di ruoli consentiti, la corrispondenza tra nomi e ID e i gruppi di accesso al pubblico dei canali)
    - **Presence Intent** (facoltativo; solo per gli aggiornamenti di presenza)

  </Step>

  <Step title="Copia il token del bot">
    Nella pagina **Bot**, fai clic su **Reset Token** e copia il token.

    <Note>
    Nonostante il nome, questa operazione genera il tuo primo token: non viene "reimpostato" nulla.
    </Note>

  </Step>

  <Step title="Genera un URL di invito e aggiungi il bot al server">
    Apri **OAuth2** nella barra laterale. In **OAuth2 URL Generator**, abilita gli ambiti:

    - `bot`
    - `applications.commands`

    Nella sezione **Bot Permissions** visualizzata, abilita almeno:

    **General Permissions**
      - View Channels

    **Text Permissions**
      - Send Messages
      - Read Message History
      - Embed Links
      - Attach Files
      - Add Reactions (facoltativo)

    Questa è la configurazione di base per i normali canali di testo. Se il bot pubblicherà nelle discussioni, inclusi i flussi di lavoro dei canali forum o multimediali che creano o continuano una discussione, abilita anche **Send Messages in Threads**.

    Copia l'URL generato, aprilo in un browser, seleziona il tuo server e fai clic su **Continue**. Il bot dovrebbe ora essere visibile nel server.

  </Step>

  <Step title="Abilita la modalità sviluppatore e raccogli gli ID">
    Nell'app Discord, abilita la modalità sviluppatore per poter copiare gli ID:

    1. **User Settings** (icona a forma di ingranaggio) → **Developer** → attiva **Developer Mode**
       *(su dispositivo mobile: **App Settings** → **Advanced**)*
    2. Fai clic con il pulsante destro sull'**icona del server** → **Copy Server ID**
    3. Fai clic con il pulsante destro sul **tuo avatar** → **Copy User ID**

    Conserva l'ID del server e l'ID utente insieme al token del bot; nel passaggio successivo ti serviranno tutti e tre.

  </Step>

  <Step title="Consenti i messaggi diretti dai membri del server">
    Affinché l'associazione funzioni, Discord deve consentire al bot di inviarti messaggi diretti. Fai clic con il pulsante destro sull'**icona del server** → **Privacy Settings** → attiva **Direct Messages**.

    Mantieni questa opzione attiva se usi i messaggi diretti di Discord con OpenClaw. Se usi solo i canali del server, puoi disabilitarla dopo l'associazione.

  </Step>

  <Step title="Imposta il token del bot in modo sicuro (non inviarlo in chat)">
    Il token del bot è un segreto. Impostalo sulla macchina che esegue OpenClaw prima di inviare messaggi al tuo agente:

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
    Per le installazioni come servizio gestito, esegui `openclaw gateway install` da una shell in cui è impostata `DISCORD_BOT_TOKEN`, oppure archivia la variabile in `~/.openclaw/.env` affinché il servizio possa risolvere il SecretRef dell'ambiente dopo il riavvio.
    Se il tuo host è bloccato o soggetto a limitazione della frequenza dalla ricerca dell'applicazione eseguita da Discord all'avvio, imposta l'ID applicazione/client dal Developer Portal in modo che l'avvio possa ignorare tale chiamata REST: `channels.discord.applicationId` per l'account predefinito oppure `channels.discord.accounts.<accountId>.applicationId` per ciascun bot.

  </Step>

  <Step title="Configura OpenClaw ed esegui l'associazione">

    <Tabs>
      <Tab title="Chiedi al tuo agente">
        Avvia una chat con il tuo agente OpenClaw su un canale esistente (ad esempio Telegram) e comunicaglielo. Se Discord è il tuo primo canale, usa invece la scheda CLI / configurazione.

        > "Ho già impostato il token del mio bot Discord nella configurazione. Completa la configurazione di Discord con l'ID utente `<user_id>` e l'ID server `<server_id>`."
      </Tab>
      <Tab title="CLI / configurazione">
        Configurazione basata su file:

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

        Variabile di ambiente di riserva per l'account predefinito:

```bash
DISCORD_BOT_TOKEN=...
```

        Per la configurazione tramite script o da remoto, scrivi lo stesso blocco JSON5 con `openclaw config patch --file ./discord.patch.json5 --dry-run`, quindi eseguilo nuovamente senza `--dry-run`. Sono supportate anche le stringhe `token` in testo normale e i valori SecretRef per `channels.discord.token` tramite i provider env/file/exec. Consulta [Gestione dei segreti](/it/gateway/secrets).

        Per più bot Discord, conserva il token e l'ID applicazione di ciascun bot nel relativo account. Il valore di primo livello `channels.discord.applicationId` viene ereditato dagli account, quindi impostalo in quella posizione solo quando tutti gli account usano lo stesso ID applicazione.

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

  <Step title="Approva la prima associazione tramite messaggio diretto">
    Quando il Gateway è in esecuzione, invia un messaggio diretto al bot su Discord. Il bot risponde con un codice di associazione.

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

    I codici di associazione scadono dopo 1 ora. Dopo l'approvazione, puoi chattare con il tuo agente tramite un messaggio diretto di Discord.

  </Step>
</Steps>

<Note>
La risoluzione dei token tiene conto dell'account. I valori dei token nella configurazione hanno la precedenza sulla variabile di ambiente di riserva e `DISCORD_BOT_TOKEN` viene usata solo per l'account predefinito.
Se due account Discord abilitati vengono risolti nello stesso token del bot, OpenClaw avvia un solo monitor del Gateway per tale token: un token proveniente dalla configurazione ha la precedenza sulla variabile di ambiente di riserva; in caso contrario, ha la precedenza il primo account abilitato e l'account duplicato viene segnalato come disabilitato con il motivo `duplicate bot token`.
Per le chiamate in uscita avanzate (strumento per i messaggi/azioni dei canali), viene usato un `token` esplicito specifico per la chiamata. Questo vale per le azioni di invio e per quelle di lettura/verifica (lettura/ricerca/recupero/discussione/messaggi fissati/autorizzazioni). Le impostazioni dei criteri e dei nuovi tentativi dell'account provengono comunque dall'account selezionato nell'istantanea di runtime attiva.
</Note>

## Consigliato: configura uno spazio di lavoro nel server

Quando i messaggi diretti funzionano, puoi trasformare il server in uno spazio di lavoro completo in cui ogni canale dispone di una propria sessione dell'agente con un contesto dedicato. Questa soluzione è consigliata per i server privati in cui sono presenti solo tu e il tuo bot.

<Steps>
  <Step title="Aggiungi il server all'elenco dei server consentiti">
    In questo modo, il tuo agente può rispondere in qualsiasi canale del server, non solo nei messaggi diretti.

    <Tabs>
      <Tab title="Chiedi al tuo agente">
        > "Aggiungi il mio ID server Discord `<server_id>` all'elenco dei server consentiti"
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

  <Step title="Consenti le risposte senza @menzione">
    Per impostazione predefinita, l'agente risponde nei canali del server solo quando viene @menzionato. In un server privato, probabilmente vorrai che risponda a ogni messaggio.

    Nei canali del server, per impostazione predefinita le normali risposte vengono pubblicate automaticamente. Per le stanze condivise sempre attive, abilita `messages.groupChat.visibleReplies: "message_tool"` affinché l'agente possa rimanere in ascolto e pubblicare solo quando ritiene utile una risposta nel canale. Questa modalità funziona meglio con modelli di ultima generazione affidabili nell'uso degli strumenti, come GPT-5.6 Sol. Gli eventi ambientali della stanza rimangono silenziosi, a meno che lo strumento non invii un messaggio. Consulta [Eventi ambientali delle stanze](/it/channels/ambient-room-events) per la configurazione completa della modalità di ascolto.

    Se Discord mostra l'indicatore di digitazione e i registri indicano l'utilizzo di token, ma non viene pubblicato alcun messaggio, verifica se il turno è stato configurato come evento ambientale della stanza o se sono state abilitate le risposte visibili tramite lo strumento per i messaggi.

    <Tabs>
      <Tab title="Chiedi al tuo agente">
        > "Consenti al mio agente di rispondere in questo server senza dover essere @menzionato"
      </Tab>
      <Tab title="Configurazione">
        Imposta `requireMention: false` nella configurazione del server:

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

        Per richiedere l'invio tramite lo strumento per i messaggi per le risposte visibili di gruppo o nei canali, imposta `messages.groupChat.visibleReplies: "message_tool"`.

      </Tab>
    </Tabs>

  </Step>

  <Step title="Pianifica l'uso della memoria nei canali del server">
    La memoria a lungo termine (MEMORY.md) viene caricata automaticamente solo nelle sessioni dei messaggi diretti; i canali del server non la caricano.

    <Tabs>
      <Tab title="Chiedi al tuo agente">
        > "Quando pongo domande nei canali Discord, usa memory_search o memory_get se ti serve il contesto a lungo termine di MEMORY.md."
      </Tab>
      <Tab title="Manuale">
        Per condividere il contesto in ogni canale, inserisci le istruzioni stabili in `AGENTS.md` o `USER.md` (iniettate in ogni sessione). Conserva le note a lungo termine in `MEMORY.md` e accedivi quando necessario con gli strumenti di memoria.
      </Tab>
    </Tabs>

  </Step>
</Steps>

Ora crea i canali e inizia a chattare. L'agente vede il nome del canale e ogni canale costituisce una sessione isolata: configura `#coding`, `#home`, `#research` o qualsiasi altra suddivisione adatta al tuo flusso di lavoro.

## Modello di runtime

- Il Gateway gestisce la connessione a Discord.
- L'instradamento delle risposte è deterministico: le risposte ai messaggi in ingresso da Discord vengono inviate nuovamente a Discord.
- I metadati del server/canale Discord vengono aggiunti al prompt del modello come contesto non attendibile, non come prefisso visibile all'utente nella risposta. Se un modello ricopia tale involucro, OpenClaw rimuove i metadati copiati dalle risposte in uscita e dal contesto delle riproduzioni future.
- Per impostazione predefinita (`session.dmScope=main`), le chat dirette condividono la sessione principale dell'agente (`agent:main:main`).
- I canali del server usano chiavi di sessione isolate (`agent:<agentId>:discord:channel:<channelId>`).
- I messaggi diretti di gruppo vengono ignorati per impostazione predefinita (`channels.discord.dm.groupEnabled=false`).
- I comandi slash nativi vengono eseguiti in sessioni di comando isolate (`agent:<agentId>:discord:slash:<userId>`), pur continuando a trasmettere `CommandTargetSessionKey` alla sessione di conversazione instradata.
- La consegna su Discord degli annunci Cron/Heartbeat di solo testo viene ridotta alla risposta finale visibile dell'assistente, inviata una sola volta. I contenuti multimediali e i payload dei componenti strutturati rimangono composti da più messaggi quando l'agente produce più payload consegnabili.

## Canali forum

I canali forum e multimediali di Discord accettano solo post nelle discussioni. OpenClaw supporta due modalità per crearli:

- Invia un messaggio al canale principale del forum (`channel:<forumId>`) per creare automaticamente una discussione. Il titolo della discussione è la prima riga non vuota del messaggio (troncata al limite di 100 caratteri imposto da Discord per il nome della discussione).
- Usa `openclaw message thread create` per creare direttamente una discussione. Non passare `--message-id` per i canali forum.

Invia al canale principale del forum per creare una discussione:

```bash
openclaw message send --channel discord --target channel:<forumId> \
  --message "Topic title\nBody of the post"
```

Crea esplicitamente una discussione nel forum:

```bash
openclaw message thread create --channel discord --target channel:<forumId> \
  --thread-name "Topic title" --message "Body of the post"
```

I canali principali dei forum non accettano componenti Discord. Se hai bisogno di componenti, inviali alla discussione stessa (`channel:<threadId>`).

## Componenti interattivi

OpenClaw supporta i contenitori dei componenti Discord v2 per i messaggi dell'agente. Usa lo strumento per i messaggi con un payload `components`. I risultati delle interazioni vengono reindirizzati all'agente come normali messaggi in entrata e rispettano le impostazioni Discord `replyToMode` esistenti.

Blocchi supportati:

- `text`, `section`, `separator`, `actions`, `media-gallery`, `file`
- Le righe di azioni consentono fino a 5 pulsanti oppure un singolo menu di selezione
- Tipi di selezione: `string`, `user`, `role`, `mentionable`, `channel`

Per impostazione predefinita, i componenti possono essere usati una sola volta. Imposta `components.reusable=true` per consentire l'uso ripetuto di pulsanti, selezioni e moduli fino alla scadenza.

Per limitare chi può fare clic su un pulsante, imposta `allowedUsers` su quel pulsante (ID utente Discord, tag oppure `*`). Gli utenti non corrispondenti ricevono un rifiuto effimero.

Per impostazione predefinita, le callback dei componenti scadono dopo 30 minuti. Imposta `channels.discord.agentComponents.ttlMs` per modificare la durata del registro delle callback per l'account predefinito oppure `channels.discord.accounts.<accountId>.agentComponents.ttlMs` per ciascun account. Il valore è espresso in millisecondi, deve essere un numero intero positivo ed è limitato a `86400000` (24 ore). Durate più lunghe sono adatte ai flussi di revisione e approvazione che richiedono pulsanti utilizzabili più a lungo, ma estendono il periodo durante il quale un vecchio messaggio Discord può ancora attivare un'azione. Preferisci la durata più breve adatta allo scopo e mantieni quella predefinita quando callback obsolete potrebbero risultare inattese.

I comandi slash `/model` e `/models` aprono un selettore interattivo del modello con menu a discesa per provider, modello e runtime compatibili, seguito da un passaggio Submit. `/models add` è deprecato e restituisce un messaggio di deprecazione invece di registrare modelli dalla chat. La risposta del selettore è effimera e può essere usata solo dall'utente che l'ha richiamato. I menu di selezione Discord sono limitati a 25 opzioni, quindi aggiungi voci `provider/*` a `agents.defaults.models` quando vuoi che il selettore mostri i modelli rilevati dinamicamente solo per provider selezionati, come `openai` o `vllm`.

Allegati:

- I blocchi `file` devono fare riferimento a un allegato (`attachment://<filename>`)
- Fornisci l'allegato tramite `media`/`path`/`filePath` (file singolo); usa `media-gallery` per più file
- Usa `filename` per sovrascrivere il nome del caricamento quando deve corrispondere al riferimento dell'allegato

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
    `channels.discord.dmPolicy` controlla l'accesso ai messaggi diretti. `channels.discord.allowFrom` è l'elenco consentiti canonico per i messaggi diretti.

    - `pairing` (predefinito)
    - `allowlist` (richiede almeno un mittente in `allowFrom`)
    - `open` (richiede che `channels.discord.allowFrom` includa `"*"`)
    - `disabled`

    Se il criterio per i messaggi diretti non è aperto, gli utenti sconosciuti vengono bloccati (oppure invitati ad associarsi in modalità `pairing`).

    Precedenza con più account:

    - `channels.discord.accounts.default.allowFrom` si applica solo all'account `default`.
    - Per un account, `allowFrom` ha la precedenza sul precedente `dm.allowFrom`.
    - Gli account denominati ereditano `channels.discord.allowFrom` quando i rispettivi `allowFrom` e il precedente `dm.allowFrom` non sono impostati.
    - Gli account denominati non ereditano `channels.discord.accounts.default.allowFrom`.

    I precedenti `channels.discord.dm.policy` e `channels.discord.dm.allowFrom` vengono ancora letti per compatibilità. `openclaw doctor --fix` li migra a `dmPolicy` e `allowFrom` quando può farlo senza modificare l'accesso.

    Formato della destinazione dei messaggi diretti per la consegna:

    - `user:<id>`
    - menzione `<@id>`

    Gli ID numerici senza prefisso vengono normalmente risolti come ID di canale quando è attivo un canale predefinito, ma gli ID presenti nell'elenco `allowFrom` effettivo dei messaggi diretti dell'account vengono trattati come destinazioni utente per compatibilità.

  </Tab>

  <Tab title="Access groups">
    I messaggi diretti Discord e l'autorizzazione dei comandi testuali possono usare voci dinamiche `accessGroup:<name>` in `channels.discord.allowFrom`.

    I nomi dei gruppi di accesso sono condivisi tra i canali di messaggistica. Usa `type: "message.senders"` per un gruppo statico i cui membri sono espressi con la normale sintassi `allowFrom` di ciascun canale oppure `type: "discord.channelAudience"` quando l'insieme corrente di utenti con accesso `ViewChannel` a un canale Discord deve definire dinamicamente l'appartenenza. Comportamento condiviso dei gruppi di accesso: [Gruppi di accesso](/it/channels/access-groups).

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

    Un canale testuale Discord non dispone di un elenco separato dei membri. `type: "discord.channelAudience"` modella l'appartenenza in questo modo: il mittente del messaggio diretto è membro del server configurato e dispone attualmente dell'autorizzazione effettiva `ViewChannel` sul canale configurato, dopo l'applicazione delle sovrascritture dei ruoli e del canale.

    Esempio: consenti a chiunque possa vedere `#maintainers` di inviare messaggi diretti al bot, mantenendoli bloccati per tutti gli altri.

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

    Le ricerche negano l'accesso in caso di errore. Se Discord restituisce `Missing Access`, la ricerca del membro non riesce oppure il canale appartiene a un server diverso, il mittente del messaggio diretto viene considerato non autorizzato.

    Abilita **Server Members Intent** nel Discord Developer Portal quando usi gruppi di accesso basati sugli utenti con accesso al canale. I messaggi diretti non includono lo stato di appartenenza al server, quindi OpenClaw risolve il membro tramite l'API REST di Discord al momento dell'autorizzazione.

  </Tab>

  <Tab title="Guild policy">
    La gestione dei server è controllata da `channels.discord.groupPolicy`:

    - `open`
    - `allowlist`
    - `disabled`

    La configurazione di base sicura quando esiste `channels.discord` è `allowlist`.

    Comportamento di `allowlist`:

    - il server deve corrispondere a `channels.discord.guilds` (ID preferito, slug accettato)
    - elenchi consentiti facoltativi per i mittenti: `users` (sono consigliati ID stabili) e `roles` (solo ID dei ruoli); se uno dei due è configurato, i mittenti sono autorizzati quando corrispondono a `users` OPPURE `roles`
    - la corrispondenza diretta per nome/tag è disabilitata per impostazione predefinita; abilita `channels.discord.dangerouslyAllowNameMatching: true` solo come modalità di compatibilità di emergenza
    - nomi/tag sono supportati per `users`, ma gli ID sono più sicuri; `openclaw security audit` avvisa quando vengono usate voci con nome/tag
    - se per un server è configurato `channels`, i canali non elencati vengono rifiutati
    - se un server non dispone di un blocco `channels`, sono consentiti tutti i canali di quel server presente nell'elenco consentiti

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
            general: { enabled: true },
            help: { enabled: true, requireMention: true },
          },
        },
      },
    },
  },
}
```

    La precedente chiave per canale `allow` viene migrata a `enabled` da `openclaw doctor --fix`.

    Se imposti solo `DISCORD_BOT_TOKEN` e non crei un blocco `channels.discord`, il comportamento di ripiego del runtime è `groupPolicy="allowlist"` (con un avviso nei registri), anche se `channels.defaults.groupPolicy` è `open`.

  </Tab>

  <Tab title="Mentions and group DMs">
    Per impostazione predefinita, i messaggi dei server richiedono una menzione.

    Il rilevamento delle menzioni include:

    - menzione esplicita del bot
    - modelli di menzione configurati (`agents.list[].groupChat.mentionPatterns`, con ripiego su `messages.groupChat.mentionPatterns`)
    - comportamento implicito di risposta al bot nei casi supportati

    Quando scrivi messaggi Discord in uscita, usa la sintassi canonica per le menzioni: `<@USER_ID>` per gli utenti, `<#CHANNEL_ID>` per i canali e `<@&ROLE_ID>` per i ruoli. Non usare il precedente formato di menzione tramite soprannome `<@!USER_ID>`.

    `requireMention` viene configurato per server/canale (`channels.discord.guilds...`).
    `ignoreOtherMentions` elimina facoltativamente i messaggi che menzionano un altro utente/ruolo ma non il bot (esclusi @everyone/@here).

    Messaggi diretti di gruppo:

    - impostazione predefinita: ignorati (`dm.groupEnabled=false`)
    - elenco consentiti facoltativo tramite `dm.groupChannels` (ID o slug dei canali)

  </Tab>
</Tabs>

### Instradamento degli agenti basato sui ruoli

Usa `bindings[].match.roles` per instradare i membri dei server Discord verso agenti diversi in base all'ID del ruolo. Le associazioni basate sui ruoli accettano solo ID di ruolo e vengono valutate dopo le associazioni tra interlocutori o interlocutori principali e prima delle associazioni basate esclusivamente sul server. Se un'associazione imposta anche altri campi di corrispondenza (ad esempio `peer` + `guildId` + `roles`), tutti i campi configurati devono corrispondere.

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

- `commands.native` usa `"auto"` per impostazione predefinita ed è abilitato per Discord.
- Sostituzione per singolo canale: `channels.discord.commands.native`.
- `commands.native=false` evita la registrazione e la pulizia dei comandi slash di Discord durante l'avvio. I comandi registrati in precedenza potrebbero rimanere visibili in Discord finché non vengono rimossi dall'app Discord.
- L'autorizzazione dei comandi nativi usa gli stessi elenchi consentiti e le stesse policy di Discord usati per la normale gestione dei messaggi.
- I comandi potrebbero comunque essere visibili nell'interfaccia di Discord agli utenti non autorizzati; durante l'esecuzione viene applicata l'autorizzazione di OpenClaw e viene restituita la risposta "non autorizzato".
- Impostazioni predefinite dei comandi slash: `ephemeral: true` (`channels.discord.slashCommand.ephemeral`).

Consulta [Comandi slash](/it/tools/slash-commands) per il catalogo e il comportamento dei comandi.

## Dettagli delle funzionalità

<AccordionGroup>
  <Accordion title="Tag di risposta e risposte native">
    Discord supporta i tag di risposta nell'output dell'agente:

    - `[[reply_to_current]]`
    - `[[reply_to:<id>]]`

    Il comportamento è controllato da `channels.discord.replyToMode`:

    - `off` (predefinito): nessuna organizzazione implicita delle risposte in thread; i tag espliciti `[[reply_to_*]]` vengono comunque rispettati
    - `first`: associa il riferimento implicito della risposta nativa al primo messaggio Discord in uscita del turno
    - `all`: lo associa a ogni messaggio in uscita
    - `batched`: lo associa solo quando l'evento in ingresso era un batch con debounce di più messaggi; utile quando si desiderano risposte native principalmente per chat ambigue con messaggi a raffica, anziché per ogni turno con un singolo messaggio

    Gli ID dei messaggi vengono inclusi nel contesto e nella cronologia, in modo che gli agenti possano indirizzare messaggi specifici.

  </Accordion>

  <Accordion title="Anteprime dei link">
    Per impostazione predefinita, Discord genera incorporamenti dettagliati per gli URL. OpenClaw elimina per impostazione predefinita tali incorporamenti generati nei messaggi Discord in uscita, quindi gli URL inviati dall'agente rimangono link semplici, a meno che non si abiliti esplicitamente questa funzionalità:

```json5
{
  channels: {
    discord: {
      suppressEmbeds: false,
    },
  },
}
```

    Imposta `channels.discord.accounts.<id>.suppressEmbeds` per sostituire il comportamento di un account. Gli invii effettuati tramite lo strumento messaggi dell'agente possono anche passare `suppressEmbeds: false` per un singolo messaggio. I payload `embeds` espliciti di Discord non vengono eliminati dall'impostazione predefinita delle anteprime dei link.

  </Accordion>

  <Accordion title="Anteprima del flusso in tempo reale">
    OpenClaw può trasmettere in streaming le bozze delle risposte inviando un messaggio temporaneo e modificandolo man mano che arriva il testo. `channels.discord.streaming.mode` accetta `off` | `partial` | `block` | `progress` (predefinito quando non è impostata alcuna chiave `streaming` o la chiave legacy `streamMode`). `streamMode` è un alias legacy; esegui `openclaw doctor --fix` per riscrivere la configurazione persistente nella struttura annidata canonica `streaming`.

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

    - `off` disabilita le modifiche dell'anteprima di Discord.
    - `partial` modifica un singolo messaggio di anteprima man mano che arrivano i token.
    - `block` emette blocchi delle dimensioni di una bozza; regola dimensioni e punti di interruzione con `streaming.preview.chunk` (`minChars`, `maxChars`, `breakPreference`), con limiti imposti da `textChunkLimit`. Quando lo streaming a blocchi è abilitato esplicitamente, OpenClaw omette il flusso di anteprima per evitare un doppio streaming.
    - `progress` mantiene un'unica bozza di stato modificabile e la aggiorna con l'avanzamento degli strumenti fino alla consegna finale; l'etichetta iniziale condivisa è una riga scorrevole, quindi scompare scorrendo come il resto quando vengono visualizzate abbastanza attività.
    - I risultati finali con contenuti multimediali, errori e risposte esplicite annullano le modifiche dell'anteprima in sospeso.
    - `streaming.preview.toolProgress` (predefinito `true`) controlla se gli aggiornamenti degli strumenti e dell'avanzamento riutilizzano il messaggio di anteprima.
    - Le righe relative agli strumenti e all'avanzamento vengono visualizzate in forma compatta con emoji, titolo e dettagli, quando disponibili, ad esempio `🛠️ Bash: esegui i test` o `🔎 Ricerca web: per "query"`.
    - `streaming.progress.commentary` (predefinito `false`) abilita il testo di commento o preambolo dell'assistente nella bozza temporanea di avanzamento. Il commento viene ripulito prima della visualizzazione, rimane temporaneo e non modifica la consegna della risposta finale.
    - `streaming.progress.maxLineChars` controlla il limite per riga dell'anteprima di avanzamento. Il testo discorsivo viene abbreviato rispettando i confini delle parole; i dettagli relativi a comandi e percorsi mantengono i suffissi utili.
    - `streaming.preview.commandText` / `streaming.progress.commandText` controlla i dettagli dei comandi e delle esecuzioni nelle righe compatte di avanzamento: `raw` (predefinito) o `status` (solo l'etichetta dello strumento).

    Nascondi il testo non elaborato dei comandi e delle esecuzioni mantenendo le righe compatte di avanzamento:

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

    Lo streaming dell'anteprima supporta solo il testo; per le risposte multimediali viene usata la consegna normale.

  </Accordion>

  <Accordion title="Cronologia, contesto e comportamento dei thread">
    Contesto della cronologia del server:

    - `channels.discord.historyLimit`, valore predefinito `20`
    - ripiego: `messages.groupChat.historyLimit`
    - `0` disabilita la funzionalità

    Controlli della cronologia dei messaggi diretti:

    - `channels.discord.dmHistoryLimit`
    - `channels.discord.dms["<user_id>"].historyLimit`

    Comportamento dei thread:

    - I thread di Discord vengono instradati come sessioni di canale ed ereditano la configurazione del canale principale, salvo sostituzioni.
    - Le sessioni dei thread ereditano la selezione `/model` a livello di sessione del canale principale solo come ripiego per il modello; le selezioni `/model` locali del thread hanno la precedenza e la cronologia della trascrizione principale non viene copiata, a meno che non sia abilitata l'ereditarietà della trascrizione.
    - `channels.discord.thread.inheritParent` (predefinito `false`) abilita per i nuovi thread automatici l'inizializzazione dalla trascrizione principale. Sostituzione per singolo account: `channels.discord.accounts.<id>.thread.inheritParent`.
    - Le reazioni dello strumento messaggi possono risolvere destinazioni di messaggi diretti `user:<id>`.
    - `guilds.<guild>.channels.<channel>.requireMention: false` viene mantenuto durante il ripiego dell'attivazione nella fase di risposta.

    Gli argomenti dei canali vengono inseriti come contesto **non attendibile**. Gli elenchi consentiti stabiliscono chi può attivare l'agente, ma non costituiscono un confine completo per l'oscuramento del contesto supplementare.

  </Accordion>

  <Accordion title="Sessioni associate ai thread per i sottoagenti">
    Discord può associare un thread a una destinazione di sessione, in modo che i messaggi successivi nel thread continuino a essere instradati alla stessa sessione, incluse le sessioni dei sottoagenti.

    Comandi:

    - `/focus <target>` associa il thread corrente o nuovo a una destinazione di sottoagente o sessione
    - `/unfocus` rimuove l'associazione del thread corrente
    - `/agents` mostra le esecuzioni attive e lo stato delle associazioni
    - `/session idle <duration|off>` esamina o aggiorna la rimozione automatica dell'associazione dopo un periodo di inattività per le associazioni con stato attivo
    - `/session max-age <duration|off>` esamina o aggiorna la durata massima assoluta per le associazioni con stato attivo

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

    - `session.threadBindings.*` imposta i valori predefiniti globali; `channels.discord.threadBindings.*` sostituisce il comportamento di Discord.
    - `spawnSessions` controlla la creazione e l'associazione automatiche dei thread per `sessions_spawn({ thread: true })` e per le generazioni di thread ACP. Valore predefinito: `true`.
    - `defaultSpawnContext` controlla il contesto nativo del sottoagente per le generazioni associate ai thread. Valore predefinito: `"fork"`.
    - Le chiavi deprecate `spawnSubagentSessions`/`spawnAcpSessions` vengono migrate da `openclaw doctor --fix`.
    - Se le associazioni dei thread sono disabilitate per un account, `/focus` e le relative operazioni di associazione dei thread non sono disponibili.

    Consulta [Sottoagenti](/it/tools/subagents), [Agenti ACP](/it/tools/acp-agents) e [Riferimento della configurazione](/it/gateway/configuration-reference).

  </Accordion>

  <Accordion title="Associazioni persistenti dei canali ACP">
    Per spazi di lavoro ACP stabili e sempre attivi, configura associazioni ACP tipizzate di primo livello destinate alle conversazioni Discord.

    Percorso di configurazione: `bindings[]` con `type: "acp"` e `match.channel: "discord"`.

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

    - `/acp spawn codex --bind here` associa direttamente il canale o il thread corrente e mantiene i messaggi futuri nella stessa sessione ACP. I messaggi del thread ereditano l'associazione del canale principale.
    - In un canale o thread associato, `/new` e `/reset` reimpostano direttamente la stessa sessione ACP. Le associazioni temporanee dei thread possono sostituire la risoluzione della destinazione mentre sono attive.
    - `spawnSessions` controlla la creazione e l'associazione dei thread secondari tramite `--thread auto|here`.

    Consulta [Agenti ACP](/it/tools/acp-agents) per i dettagli sul comportamento delle associazioni.

  </Accordion>

  <Accordion title="Notifiche delle reazioni">
    Modalità di notifica delle reazioni per singolo server (`guilds.<id>.reactionNotifications`):

    - `off`
    - `own` (predefinito)
    - `all`
    - `allowlist` (usa `guilds.<id>.users`)

    Gli eventi di reazione vengono convertiti in eventi di sistema e associati alla sessione Discord instradata.

  </Accordion>

  <Accordion title="Reazioni di conferma">
    `ackReaction` invia un'emoji di conferma mentre OpenClaw elabora un messaggio in ingresso.

    Ordine di risoluzione:

    - `channels.discord.accounts.<accountId>.ackReaction`
    - `channels.discord.ackReaction`
    - `messages.ackReaction`
    - ripiego sull'emoji dell'identità dell'agente (`agents.list[].identity.emoji`, altrimenti "👀")

    Note:

    - Discord accetta emoji Unicode o nomi di emoji personalizzate.
    - Usa `""` per disabilitare la reazione per un canale o un account.

    **Ambito (`messages.ackReactionScope`):**

    Valori: `"all"` (messaggi diretti + gruppi, inclusi gli eventi ambientali delle stanze), `"direct"` (solo messaggi diretti), `"group-all"` (ogni messaggio di gruppo, esclusi gli eventi ambientali delle stanze; nessun messaggio diretto), `"group-mentions"` (gruppi quando viene menzionato il bot; **nessun messaggio diretto**, valore predefinito), `"off"` / `"none"` (disabilitato).

    <Note>
    L'ambito predefinito (`"group-mentions"`) non attiva reazioni di conferma nei messaggi diretti o negli eventi ambientali delle stanze. Per ottenere una reazione di conferma sui messaggi diretti Discord in ingresso e sugli eventi delle stanze silenziose, imposta `messages.ackReactionScope` su `"all"`.
    </Note>

  </Accordion>

  <Accordion title="Scrittura della configurazione">
    Le scritture della configurazione avviate dal canale sono abilitate per impostazione predefinita. Questo influisce sui flussi `/config set|unset`, quando le funzionalità dei comandi sono abilitate.

    Per disabilitarle:

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
    Instrada il traffico WebSocket del Gateway Discord e le richieste REST di avvio (ID applicazione + risoluzione dell'elenco consentito) tramite un proxy HTTP(S) con `channels.discord.proxy`.
    L'uso del proxy per il WebSocket del Gateway Discord è esplicito; le connessioni WebSocket non ereditano le variabili d'ambiente del proxy del processo Gateway. Le richieste REST di avvio usano questo proxy quando `channels.discord.proxy` è configurato.

```json5
{
  channels: {
    discord: {
      proxy: "http://proxy.example:8080",
    },
  },
}
```

    Sostituzione per singolo account:

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

  <Accordion title="Supporto per PluralKit">
    Abilita la risoluzione PluralKit per associare i messaggi inviati tramite proxy all'identità del membro del sistema:

```json5
{
  channels: {
    discord: {
      pluralkit: {
        enabled: true,
        token: "pk_live_...", // facoltativo; necessario per i sistemi privati
      },
    },
  },
}
```

    Note:

    - le liste di elementi consentiti possono usare `pk:<memberId>`
    - i nomi visualizzati dei membri vengono confrontati per nome/slug solo quando `channels.discord.dangerouslyAllowNameMatching: true`
    - le ricerche interrogano l'API PluralKit con l'ID del messaggio originale
    - se la ricerca non riesce, i messaggi inoltrati tramite proxy vengono trattati come messaggi di bot e scartati, a meno che `allowBots` non ne consenta il passaggio

  </Accordion>

  <Accordion title="Alias delle menzioni in uscita">
    Usa `mentionAliases` quando gli agenti necessitano di menzioni in uscita deterministiche per utenti Discord noti. Le chiavi sono handle senza la `@` iniziale; i valori sono ID utente Discord. Gli handle sconosciuti, `@everyone`, `@here` e le menzioni all'interno di frammenti di codice Markdown rimangono invariati.

```json5
{
  channels: {
    discord: {
      mentionAliases: {
        SupportLead: "123456789012345678",
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
    Gli aggiornamenti della presenza vengono applicati quando imposti un campo di stato o attività oppure quando abiliti la presenza automatica.

    Solo stato:

```json5
{
  channels: {
    discord: {
      status: "idle",
    },
  },
}
```

    Attività (lo stato personalizzato è il tipo di attività predefinito quando è impostato `activity`):

```json5
{
  channels: {
    discord: {
      activity: "Tempo di concentrazione",
      activityType: 4,
    },
  },
}
```

    Streaming:

```json5
{
  channels: {
    discord: {
      activity: "Programmazione in diretta",
      activityType: 1,
      activityUrl: "https://twitch.tv/openclaw",
    },
  },
}
```

    Mappa dei tipi di attività:

    - 0: In gioco
    - 1: In streaming (richiede `activityUrl`; `activityUrl` richiede a sua volta `activityType: 1`)
    - 2: In ascolto
    - 3: In visione
    - 4: Personalizzata (usa il testo dell'attività come stato; l'emoji è facoltativa)
    - 5: In competizione

    Presenza automatica (segnale di integrità del runtime):

```json5
{
  channels: {
    discord: {
      autoPresence: {
        enabled: true,
        intervalMs: 30000,
        minUpdateIntervalMs: 15000,
        exhaustedText: "token esaurito",
      },
    },
  },
}
```

    La presenza automatica associa la disponibilità del runtime allo stato Discord: integro => online, degradato o sconosciuto => inattivo, esaurito o non disponibile => non disturbare. Valori predefiniti: `intervalMs` 30000, `minUpdateIntervalMs` 15000 (deve essere minore o uguale a `intervalMs`). Sostituzioni facoltative del testo:

    - `autoPresence.healthyText`
    - `autoPresence.degradedText`
    - `autoPresence.exhaustedText` (supporta il segnaposto `{reason}`)

  </Accordion>

  <Accordion title="Approvazioni in Discord">
    Discord supporta la gestione delle approvazioni tramite pulsanti nei messaggi diretti e può facoltativamente pubblicare le richieste di approvazione nel canale di origine.

    Percorso di configurazione:

    - `channels.discord.execApprovals.enabled`
    - `channels.discord.execApprovals.approvers` (facoltativo; quando possibile, usa come ripiego `commands.ownerAllowFrom`)
    - `channels.discord.execApprovals.target` (`dm` | `channel` | `both`, valore predefinito: `dm`)
    - `agentFilter`, `sessionFilter`, `cleanupAfterResolve`

    Discord abilita automaticamente le approvazioni native delle esecuzioni quando `enabled` non è impostato o è `"auto"` ed è possibile determinare almeno un approvatore, da `execApprovals.approvers` oppure da `commands.ownerAllowFrom`. Discord non deduce gli approvatori delle esecuzioni da `allowFrom` del canale, dal precedente `dm.allowFrom` o da `defaultTo` dei messaggi diretti. Imposta `enabled: false` per disabilitare esplicitamente Discord come client di approvazione nativo.

    Per i comandi di gruppo sensibili riservati al proprietario, come `/diagnostics` e `/export-trajectory`, OpenClaw invia privatamente le richieste di approvazione e i risultati finali. Tenta prima di usare un messaggio diretto Discord quando il proprietario che ha invocato il comando dispone di una route proprietario Discord; altrimenti usa come ripiego la prima route proprietario disponibile in `commands.ownerAllowFrom`, ad esempio Telegram.

    Quando `target` è `channel` o `both`, la richiesta di approvazione è visibile nel canale. Solo gli approvatori determinati possono usare i pulsanti; gli altri utenti ricevono un rifiuto effimero. Le richieste di approvazione includono il testo del comando, quindi abilita l'invio nel canale solo nei canali attendibili. Se non è possibile ricavare l'ID del canale dalla chiave di sessione, OpenClaw usa come ripiego l'invio tramite messaggio diretto.

    Discord visualizza i pulsanti di approvazione condivisi usati dagli altri canali di chat; l'adattatore Discord nativo aggiunge principalmente l'instradamento dei messaggi diretti agli approvatori e la distribuzione nei canali. Quando questi pulsanti sono presenti, costituiscono l'esperienza utente principale per l'approvazione; OpenClaw deve includere un comando manuale `/approve` solo quando il risultato dello strumento indica che le approvazioni via chat non sono disponibili o che l'approvazione manuale è l'unico percorso. Se il runtime nativo delle approvazioni Discord non è attivo, OpenClaw mantiene visibile la richiesta locale deterministica `/approve <id> <decision>`. Se il runtime è attivo ma non è possibile recapitare una scheda nativa ad alcuna destinazione, OpenClaw invia nella stessa chat un avviso di ripiego con il comando `/approve` esatto dell'approvazione in sospeso.

    L'autenticazione del Gateway e la risoluzione delle approvazioni seguono il contratto condiviso del client Gateway (gli ID `plugin:` vengono risolti tramite `plugin.approval.resolve`; gli altri ID tramite `exec.approval.resolve`). Per impostazione predefinita, le approvazioni scadono dopo 30 minuti.

    Consulta [Approvazioni delle esecuzioni](/it/tools/exec-approvals).

  </Accordion>
</AccordionGroup>

## Strumenti e controlli delle azioni

Le azioni dei messaggi Discord comprendono messaggistica, amministrazione dei canali, moderazione, presenza e metadati.

Esempi principali:

- messaggistica: `sendMessage`, `readMessages`, `editMessage`, `deleteMessage`, `threadReply`
- reazioni: `react`, `reactions`, `emojiList`
- moderazione: `timeout`, `kick`, `ban`
- presenza: `setPresence`

L'azione `event-create` accetta un parametro facoltativo `image` (URL o percorso di un file locale) per impostare l'immagine di copertina dell'evento programmato.

I controlli delle azioni si trovano in `channels.discord.actions.*`.

Comportamento predefinito dei controlli:

| Gruppo di azioni                                                                                                                                                         | Valore predefinito |
| ------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ------------------ |
| reactions, messages, threads, pins, polls, search, memberInfo, roleInfo, channelInfo, channels, voiceStatus, events, stickers, emojiUploads, stickerUploads, permissions | abilitato          |
| roles                                                                                                                                                                    | disabilitato       |
| moderation                                                                                                                                                               | disabilitato       |
| presence                                                                                                                                                                 | disabilitato       |

## Interfaccia utente Components v2

OpenClaw usa Components v2 di Discord per le approvazioni delle esecuzioni e gli indicatori tra contesti. Le azioni dei messaggi Discord possono anche accettare `components` per un'interfaccia utente personalizzata (funzionalità avanzata; richiede la creazione di un payload di componenti tramite lo strumento Discord), mentre i precedenti `embeds` rimangono disponibili ma non sono consigliati.

- `channels.discord.ui.components.accentColor` imposta il colore di accento usato dai contenitori dei componenti Discord (esadecimale). Per account: `channels.discord.accounts.<id>.ui.components.accentColor`.
- `channels.discord.agentComponents.ttlMs` controlla per quanto tempo le callback dei componenti Discord inviati rimangono registrate (valore predefinito `1800000`, massimo `86400000`). Per account: `channels.discord.accounts.<id>.agentComponents.ttlMs`.
- Gli `embeds` vengono ignorati quando sono presenti Components v2.
- Le anteprime degli URL semplici vengono soppresse per impostazione predefinita. Imposta `suppressEmbeds: false` in un'azione di messaggio quando deve essere espanso un singolo collegamento in uscita.

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

Discord dispone di due superfici vocali distinte: i **canali vocali** in tempo reale (conversazioni continue) e gli **allegati di messaggi vocali** (il formato di anteprima con forma d'onda). Il Gateway supporta entrambe.

### Canali vocali

Elenco di controllo per la configurazione:

1. Abilita Message Content Intent nel Discord Developer Portal.
2. Abilita Server Members Intent quando vengono usate liste di ruoli/utenti consentiti.
3. Invita il bot con gli ambiti `bot` e `applications.commands`.
4. Concedi Connect, Speak, Send Messages e Read Message History nel canale vocale di destinazione.
5. Abilita i comandi nativi (`commands.native` o `channels.discord.commands.native`).
6. Configura `channels.discord.voice`.

Usa `/vc join|leave|status` per controllare le sessioni. Il comando usa l'agente predefinito dell'account e segue le stesse regole relative alle liste di elementi consentiti e ai criteri di gruppo degli altri comandi Discord.

```bash
/vc join channel:<voice-channel-id>
/vc status
/vc leave
```

Per verificare le autorizzazioni effettive del bot prima dell'accesso:

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
        model: "openai/gpt-5.6-sol",
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
          model: "gpt-realtime-2.1",
          speakerVoice: "cedar",
        },
      },
    },
  },
}
```

Note:

- La voce di Discord è facoltativa per le configurazioni di solo testo; imposta `channels.discord.voice.enabled=true` (oppure mantieni un blocco `channels.discord.voice` esistente) per abilitare i comandi `/vc`, il runtime vocale e l'intent Gateway `GuildVoiceStates`. `channels.discord.intents.voiceStates` può sostituire esplicitamente la sottoscrizione all'intent; lascialo non impostato per seguire l'abilitazione vocale effettiva.
- `voice.mode` controlla il percorso della conversazione. Il valore predefinito è `agent-proxy`: un front-end vocale in tempo reale gestisce la temporizzazione dei turni, le interruzioni e la riproduzione, delega il lavoro sostanziale all'agente OpenClaw instradato tramite `openclaw_agent_consult` e tratta il risultato come un prompt Discord digitato da quell'interlocutore. `stt-tts` mantiene il precedente flusso STT in batch più TTS. `bidi` consente al modello in tempo reale di conversare direttamente, esponendo al contempo `openclaw_agent_consult` per il cervello OpenClaw.
- `voice.agentSession` controlla quale conversazione OpenClaw riceve i turni vocali. Lascialo non impostato per usare la sessione propria del canale vocale, oppure imposta `{ mode: "target", target: "channel:<text-channel-id>" }` affinché il canale vocale agisca come estensione microfono/altoparlante della sessione di un canale di testo Discord esistente, come `#maintainers`.
- `voice.model` sostituisce il cervello dell'agente OpenClaw per le risposte vocali Discord e le consultazioni in tempo reale. Lascialo non impostato per ereditare il modello dell'agente instradato. È distinto da `voice.realtime.model`.
- `voice.followUsers` consente al bot di entrare, spostarsi e uscire dai canali vocali Discord insieme agli utenti selezionati. Consulta [Seguire gli utenti nei canali vocali](#follow-users-in-voice).
- `agent-proxy` instrada il parlato tramite `discord-voice`, che conserva la normale autorizzazione del proprietario e degli strumenti per l'interlocutore e la sessione di destinazione, ma nasconde lo strumento `tts` dell'agente perché la riproduzione è gestita dalla voce Discord. Per impostazione predefinita, `agent-proxy` concede alla consultazione un accesso agli strumenti completo ed equivalente a quello del proprietario per gli interlocutori proprietari (`voice.realtime.toolPolicy: "owner"`) e privilegia fortemente la consultazione dell'agente OpenClaw prima delle risposte sostanziali (`voice.realtime.consultPolicy: "always"`). In questa modalità `always` predefinita, il livello in tempo reale non pronuncia automaticamente frasi riempitive prima della risposta della consultazione; acquisisce e trascrive il parlato, quindi pronuncia la risposta OpenClaw instradata. Se più risposte di consultazioni forzate terminano mentre Discord sta ancora riproducendo la prima risposta, le successive risposte con parlato esatto vengono accodate fino a quando la riproduzione non è inattiva, anziché sostituire il parlato a metà frase.
- In modalità `stt-tts`, STT usa `tools.media.audio`; `voice.model` non influisce sulla trascrizione.
- Nelle modalità in tempo reale, `voice.realtime.provider`, `voice.realtime.model` e `voice.realtime.speakerVoice` configurano la sessione audio in tempo reale. Per OpenAI Realtime 2.1 con il cervello Codex, usa `voice.realtime.model: "gpt-realtime-2.1"` e `voice.model: "openai/gpt-5.6-sol"`.
- Per impostazione predefinita, le modalità vocali in tempo reale includono piccoli file di profilo `IDENTITY.md`, `USER.md` e `SOUL.md` nelle istruzioni del fornitore in tempo reale, affinché i turni diretti rapidi mantengano la stessa identità, lo stesso ancoraggio all'utente e la stessa persona dell'agente OpenClaw instradato. Imposta `voice.realtime.bootstrapContextFiles` su un sottoinsieme per personalizzare questo comportamento, oppure su `[]` per disabilitarlo. Sono supportati solo questi file di profilo; `AGENTS.md` rimane nel normale contesto dell'agente. Il contesto di profilo inserito non sostituisce `openclaw_agent_consult` per il lavoro nell'area di lavoro, i fatti correnti, la ricerca nella memoria o le azioni supportate da strumenti.
- Nella modalità in tempo reale `agent-proxy` di OpenAI, imposta `voice.realtime.requireWakeName: true` per mantenere silenziosa la voce Discord in tempo reale finché una trascrizione non inizia o termina con un nome di attivazione. I nomi di attivazione configurati devono essere composti da una o due parole. Se `voice.realtime.wakeNames` non è impostato, OpenClaw usa il `name` dell'agente instradato più `OpenClaw`, ripiegando sull'ID dell'agente più `OpenClaw`. Il controllo tramite nome di attivazione disabilita la risposta automatica del fornitore in tempo reale, instrada i turni accettati attraverso il percorso di consultazione dell'agente OpenClaw e fornisce un breve riscontro vocale quando un nome di attivazione iniziale viene riconosciuto dalla trascrizione parziale prima dell'arrivo della trascrizione finale.
- Il fornitore in tempo reale OpenAI accetta i nomi degli eventi Realtime 2 correnti e gli alias legacy compatibili con Codex per gli eventi dell'audio di output e della trascrizione, consentendo alle istantanee compatibili del fornitore di divergere senza perdere l'audio dell'assistente.
- `voice.realtime.bargeIn` controlla se gli eventi di inizio parlato di un interlocutore Discord interrompono la riproduzione in tempo reale attiva. Se non impostato, segue l'impostazione di interruzione tramite audio di input del fornitore in tempo reale.
- `voice.realtime.minBargeInAudioEndMs` controlla la durata minima della riproduzione dell'assistente prima che un'interruzione in tempo reale OpenAI tronchi l'audio. Valore predefinito: `250`. Imposta `0` per l'interruzione immediata in ambienti con poco eco, oppure aumenta il valore per configurazioni con altoparlanti soggette a forte eco.
- `voice.tts` sostituisce `messages.tts` solo per la riproduzione vocale `stt-tts`; le modalità in tempo reale usano invece `voice.realtime.speakerVoice`. Per una voce OpenAI nella riproduzione Discord, imposta `voice.tts.provider: "openai"` e scegli una voce di sintesi vocale in `voice.tts.providers.openai.speakerVoice`. `cedar` è una valida scelta dal timbro maschile con l'attuale modello TTS di OpenAI.
- Le sostituzioni `systemPrompt` Discord specifiche per canale si applicano ai turni delle trascrizioni vocali di quel canale vocale.
- I turni delle trascrizioni vocali derivano lo stato di proprietario da `allowFrom` (o `dm.allowFrom`) di Discord per i comandi e le azioni del canale riservati al proprietario. La visibilità degli strumenti dell'agente segue la politica degli strumenti configurata per la sessione instradata.
- Se `voice.autoJoin` contiene più voci per lo stesso server, OpenClaw entra nell'ultimo canale configurato per quel server.
- `voice.allowedChannels` è una lista consentita facoltativa per la permanenza. Lascialo non impostato per consentire a `/vc join` di entrare in qualsiasi canale vocale Discord autorizzato. Quando è impostato, `/vc join`, l'ingresso automatico all'avvio e gli spostamenti dello stato vocale del bot sono limitati alle voci `{ guildId, channelId }` elencate. Impostalo su un array vuoto per impedire tutti gli ingressi nei canali vocali Discord. Se Discord sposta il bot al di fuori della lista consentita, OpenClaw lascia quel canale e rientra nella destinazione di ingresso automatico configurata, se disponibile.
- `voice.daveEncryption` e `voice.decryptionFailureTolerance` vengono passati alle opzioni di ingresso di `@discordjs/voice`; i valori predefiniti a monte sono `daveEncryption=true` e `decryptionFailureTolerance=24`.
- OpenClaw usa il codec `libopus-wasm` incluso per la ricezione vocale Discord e la riproduzione PCM grezza in tempo reale. Include una build WebAssembly di libopus con versione bloccata e non richiede componenti aggiuntivi opus nativi.
- `voice.connectTimeoutMs` controlla l'attesa iniziale dello stato Ready di `@discordjs/voice` per `/vc join` e i tentativi di ingresso automatico. Valore predefinito: `30000`.
- `voice.reconnectGraceMs` controlla per quanto tempo OpenClaw attende che una sessione vocale disconnessa inizi a riconnettersi prima di eliminarla. Valore predefinito: `15000`.
- In modalità `stt-tts`, la riproduzione vocale non si interrompe solo perché un altro utente inizia a parlare. Per evitare cicli di feedback, OpenClaw ignora le nuove acquisizioni vocali durante la riproduzione TTS; per il turno successivo, parla al termine della riproduzione. Le modalità in tempo reale inoltrano gli inizi del parlato come segnali di interruzione al fornitore in tempo reale.
- Nelle modalità in tempo reale, l'eco degli altoparlanti captato da un microfono aperto può essere interpretato come un'interruzione e fermare la riproduzione. Per le stanze Discord con forte eco, imposta `voice.realtime.providers.openai.interruptResponseOnInputAudio: false` per impedire a OpenAI di interrompersi automaticamente in presenza di audio di input. Aggiungi `voice.realtime.bargeIn: true` se vuoi comunque che gli eventi di inizio parlato di Discord interrompano la riproduzione attiva. Il bridge in tempo reale OpenAI ignora i troncamenti della riproduzione più brevi di `voice.realtime.minBargeInAudioEndMs`, considerandoli probabile eco o rumore, e li registra come ignorati anziché cancellare la riproduzione Discord.
- `voice.captureSilenceGraceMs` controlla per quanto tempo OpenClaw attende dopo che Discord segnala che un interlocutore ha smesso di parlare, prima di finalizzare quel segmento audio per STT. Valore predefinito: `2000`; aumentalo se Discord suddivide le pause normali in trascrizioni parziali frammentarie.
- Quando ElevenLabs è il fornitore TTS selezionato, la riproduzione vocale Discord usa il TTS in streaming e inizia dal flusso di risposta del fornitore. I fornitori senza supporto per lo streaming ripiegano sul percorso del file temporaneo sintetizzato.
- OpenClaw monitora gli errori di decrittazione in ricezione e si ripristina automaticamente uscendo e rientrando nel canale vocale dopo errori ripetuti in un breve intervallo.
- Se, dopo un aggiornamento, i registri di ricezione mostrano ripetutamente `DecryptionFailed(UnencryptedWhenPassthroughDisabled)`, raccogli un rapporto sulle dipendenze e i registri. La versione inclusa di `@discordjs/voice` comprende la correzione a monte del padding dalla PR #11449 di discord.js, che ha chiuso il problema #11419 di discord.js.
- Gli eventi di ricezione `The operation was aborted` sono previsti quando OpenClaw finalizza un segmento acquisito dell'interlocutore; sono informazioni diagnostiche dettagliate, non avvisi.
- I registri vocali dettagliati di Discord includono un'anteprima delimitata su una riga della trascrizione STT per ogni segmento accettato dell'interlocutore, così il debug mostra sia il lato dell'utente sia quello della risposta dell'agente senza riversare testo di trascrizione senza limiti.
- In modalità `agent-proxy`, il ripiego della consultazione forzata ignora i frammenti di trascrizione probabilmente incompleti, come il testo che termina con `...` o con un connettivo finale come "e", oltre alle ovvie chiusure che non richiedono azioni, come "torno subito" o "ciao". I registri mostrano `forced agent consult skipped reason=...` quando ciò impedisce una risposta obsoleta in coda.

### Seguire gli utenti nei canali vocali

Usa `voice.followUsers` quando vuoi che il bot vocale Discord rimanga con uno o più utenti Discord noti, anziché entrare in un canale fisso all'avvio o attendere `/vc join`.

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

- `followUsers` accetta ID utente Discord grezzi e valori `discord:<id>`. OpenClaw normalizza entrambe le forme prima di confrontare gli eventi dello stato vocale.
- `followUsersEnabled` assume come valore predefinito `true` quando `followUsers` è configurato. Impostalo su `false` per conservare l'elenco salvato ma interrompere il seguito vocale automatico.
- Quando un utente seguito entra in un canale vocale consentito, OpenClaw entra in quel canale. Quando l'utente si sposta, OpenClaw si sposta con lui. Quando l'utente seguito attivo si disconnette, OpenClaw esce.
- Se più utenti seguiti si trovano nello stesso server e l'utente seguito attivo esce, OpenClaw si sposta nel canale di un altro utente seguito monitorato prima di lasciare il server. Se più utenti seguiti si spostano contemporaneamente, prevale l'ultimo evento dello stato vocale osservato.
- `allowedChannels` continua ad applicarsi. Un utente seguito in un canale non consentito viene ignorato e una sessione appartenente alla funzione di seguito si sposta presso un altro utente seguito oppure esce.
- OpenClaw riconcilia gli eventi dello stato vocale persi all'avvio e a intervalli limitati. La riconciliazione campiona i server configurati e limita le ricerche REST per esecuzione, quindi elenchi `followUsers` molto grandi potrebbero richiedere più di un intervallo per convergere.
- Se Discord o un amministratore sposta il bot mentre sta seguendo un utente, OpenClaw ricrea la sessione vocale e conserva la titolarità del seguito quando la destinazione è consentita. Se il bot viene spostato al di fuori di `allowedChannels`, OpenClaw esce e rientra nella destinazione configurata, se esiste.
- Il ripristino della ricezione DAVE può uscire e rientrare nello stesso canale dopo ripetuti errori di decrittazione. Le sessioni appartenenti alla funzione di seguito mantengono tale titolarità durante questo percorso di ripristino, quindi una successiva disconnessione dell'utente seguito provoca comunque l'uscita dal canale.

Scegli tra le modalità di ingresso:

- Usa `followUsers` per configurazioni personali o operative in cui il bot deve trovarsi automaticamente nel canale vocale quando ci sei tu.
- Usa `autoJoin` per bot destinati a stanze fisse, che devono essere presenti anche quando nessun utente monitorato si trova in un canale vocale.
- Usa `/vc join` per ingressi occasionali o stanze in cui una presenza vocale automatica sarebbe inattesa.

Codec vocale Discord:

- I registri di ricezione vocale mostrano `discord voice: opus decoder: libopus-wasm`.
- La riproduzione in tempo reale codifica il PCM stereo grezzo a 48 kHz in Opus con lo stesso pacchetto `libopus-wasm` incluso, prima di consegnare i pacchetti a `@discordjs/voice`.
- La riproduzione da file e da flusso del fornitore transcodifica in PCM stereo grezzo a 48 kHz con ffmpeg, quindi usa `libopus-wasm` per il flusso di pacchetti Opus inviato a Discord.

Pipeline STT più TTS:

- L'acquisizione PCM di Discord viene convertita in un file WAV temporaneo.
- `tools.media.audio` gestisce la conversione da voce a testo, ad esempio `openai/gpt-4o-mini-transcribe`.
- La trascrizione viene inviata attraverso l'ingresso e l'instradamento di Discord mentre il modello linguistico di risposta viene eseguito con una politica di output vocale che nasconde lo strumento `tts` dell'agente e richiede la restituzione di testo, poiché la voce Discord gestisce la riproduzione finale della sintesi vocale.
- `voice.model`, quando impostato, sostituisce solo il modello linguistico di risposta per questo turno del canale vocale.
- `voice.tts` viene sovrapposto a `messages.tts`; i provider che supportano lo streaming alimentano direttamente il lettore, altrimenti il file audio risultante viene riprodotto nel canale a cui il bot si è unito.

Esempio di sessione del canale vocale con proxy dell'agente predefinito:

```json5
{
  channels: {
    discord: {
      voice: {
        enabled: true,
        model: "openai/gpt-5.6-sol",
        followUsersEnabled: true,
        followUsers: ["123456789012345678"],
        realtime: {
          provider: "openai",
          model: "gpt-realtime-2.1",
          speakerVoice: "cedar",
        },
      },
    },
  },
}
```

Senza un blocco `voice.agentSession`, ogni canale vocale dispone di una propria sessione OpenClaw instradata. Ad esempio, `/vc join channel:234567890123456789` comunica con la sessione di quel canale vocale Discord. Il modello in tempo reale costituisce soltanto l'interfaccia vocale; le richieste sostanziali vengono passate all'agente OpenClaw configurato. Se il modello in tempo reale produce una trascrizione finale senza chiamare lo strumento di consultazione, OpenClaw forza la consultazione come ripiego, affinché il comportamento predefinito rimanga equivalente a parlare con l'agente.

Esempio di riconoscimento vocale più sintesi vocale precedente:

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

Esempio bidirezionale in tempo reale:

```json5
{
  channels: {
    discord: {
      voice: {
        enabled: true,
        mode: "bidi",
        model: "openai/gpt-5.6-sol",
        realtime: {
          provider: "openai",
          model: "gpt-realtime-2.1",
          speakerVoice: "cedar",
          toolPolicy: "safe-read-only",
          consultPolicy: "always",
        },
      },
    },
  },
}
```

Voce come estensione della sessione di un canale Discord esistente:

```json5
{
  channels: {
    discord: {
      voice: {
        enabled: true,
        mode: "agent-proxy",
        model: "openai/gpt-5.6-sol",
        agentSession: {
          mode: "target",
          target: "channel:123456789012345678",
        },
        realtime: {
          provider: "openai",
          model: "gpt-realtime-2.1",
          speakerVoice: "cedar",
        },
      },
    },
  },
}
```

In modalità `agent-proxy`, il bot si unisce al canale vocale configurato, ma i turni dell'agente OpenClaw utilizzano l'agente e la normale sessione instradata del canale di destinazione. La sessione vocale in tempo reale pronuncia il risultato restituito nel canale vocale. L'agente supervisore può comunque utilizzare i normali strumenti di messaggistica in base alla propria politica degli strumenti, compreso l'invio di un messaggio Discord separato se questa è l'azione appropriata.

Mentre è attiva un'esecuzione OpenClaw delegata, le nuove trascrizioni vocali di Discord vengono trattate come controllo in tempo reale dell'esecuzione prima di avviare un altro turno dell'agente. Frasi come "stato", "annulla", "usa la correzione più piccola" o "quando hai finito controlla anche i test" vengono classificate come input di stato, annullamento, guida o follow-up per la sessione attiva. Gli esiti relativi a stato, annullamento, guida accettata e follow-up vengono pronunciati nel canale vocale, in modo che il chiamante sappia se OpenClaw ha gestito la richiesta.

Forme di destinazione utili:

- `target: "channel:123456789012345678"` instrada attraverso la sessione di un canale testuale Discord.
- `target: "123456789012345678"` viene considerato come destinazione di un canale.
- `target: "dm:123456789012345678"` o `target: "user:123456789012345678"` instrada attraverso la sessione di messaggistica diretta corrispondente.

Esempio di OpenAI Realtime con forte presenza di eco:

```json5
{
  channels: {
    discord: {
      voice: {
        enabled: true,
        mode: "bidi",
        model: "openai/gpt-5.6-sol",
        realtime: {
          provider: "openai",
          model: "gpt-realtime-2.1",
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

Utilizzare questa configurazione quando il modello sente la propria riproduzione Discord attraverso un microfono aperto, ma si desidera comunque interromperlo parlando. OpenClaw impedisce a OpenAI di interrompersi automaticamente sull'audio di ingresso grezzo, mentre `bargeIn: true` consente agli eventi di inizio intervento di Discord e all'audio di un interlocutore già attivo di annullare le risposte in tempo reale attive prima che il turno acquisito successivo raggiunga OpenAI. I segnali di interruzione molto precoci con `audioEndMs` inferiore a `minBargeInAudioEndMs` vengono considerati probabile eco o rumore e ignorati, affinché il modello non si interrompa al primo fotogramma di riproduzione.

Log vocali previsti:

- All'ingresso: `discord voice: joining ... voiceSession=... supervisorSession=... agentSessionMode=... voiceModel=... realtimeModel=...`
- All'avvio in tempo reale: `discord voice: realtime bridge starting ... autoRespond=false interruptResponse=false bargeIn=false minBargeInAudioEndMs=...`
- Sull'audio dell'interlocutore: `discord voice: realtime speaker turn opened ...`, `discord voice: realtime input audio started ... outputAudioMs=... outputActive=...` e `discord voice: realtime speaker turn closed ... chunks=... discordBytes=... realtimeBytes=... interruptedPlayback=...`
- Quando viene ignorato un parlato obsoleto: `discord voice: realtime forced agent consult skipped reason=incomplete-transcript ...` o `reason=non-actionable-closing ...`
- Al completamento della risposta in tempo reale: `discord voice: realtime audio playback finishing reason=response.done ... audioMs=... chunks=...`
- All'arresto o alla reimpostazione della riproduzione: `discord voice: realtime audio playback stopped reason=... audioMs=... elapsedMs=... chunks=...`
- Alla consultazione in tempo reale: `discord voice: realtime consult requested ... voiceSession=... supervisorSession=... question=...`
- Alla risposta dell'agente: `discord voice: agent turn answer ...`
- Quando viene accodato il parlato esatto: `discord voice: realtime exact speech queued ... queued=... outputAudioMs=... outputActive=...`, seguito da `discord voice: realtime exact speech dequeued reason=player-idle ...`
- Al rilevamento dell'interruzione: `discord voice: realtime barge-in detected source=speaker-start ...` o `discord voice: realtime barge-in detected source=active-speaker-audio ...`, seguito da `discord voice: realtime barge-in requested reason=... outputAudioMs=... outputActive=...`
- All'interruzione in tempo reale: `discord voice: realtime model interrupt requested client:response.cancel reason=barge-in`, seguito da `discord voice: realtime model audio truncated client:conversation.item.truncate reason=barge-in audioEndMs=...` oppure `discord voice: realtime model interrupt confirmed server:response.done status=cancelled ...`
- Quando vengono ignorati eco o rumore: `discord voice: realtime model interrupt ignored client:conversation.item.truncate.skipped reason=barge-in audioEndMs=0 minAudioEndMs=250`
- Quando l'interruzione è disabilitata: `discord voice: realtime capture ignored during playback (barge-in disabled) ...`
- Durante la riproduzione inattiva: `discord voice: realtime barge-in ignored reason=... outputActive=false ... playbackChunks=0`

Per eseguire il debug dell'audio interrotto, leggere i log vocali in tempo reale come una sequenza cronologica:

1. `realtime audio playback started` indica che Discord ha iniziato a riprodurre l'audio dell'assistente. Da questo momento, il bridge inizia a contare i segmenti di output dell'assistente, i byte PCM di Discord, i byte in tempo reale del provider e la durata dell'audio sintetizzato.
2. `realtime speaker turn opened` indica che un interlocutore Discord è diventato attivo. Se la riproduzione è già attiva e `bargeIn` è abilitato, può essere seguito da `barge-in detected source=speaker-start`.
3. `realtime input audio started` indica il primo fotogramma audio effettivo ricevuto per il turno di quell'interlocutore. `outputActive=true` o un valore `outputAudioMs` diverso da zero indica che il microfono sta inviando input mentre la riproduzione dell'assistente è ancora attiva.
4. `barge-in detected source=active-speaker-audio` indica che OpenClaw ha rilevato audio in tempo reale dell'interlocutore mentre era attiva la riproduzione dell'assistente. Ciò è utile per distinguere un'interruzione reale da un evento di inizio intervento di Discord privo di audio utile.
5. `barge-in requested reason=...` indica che OpenClaw ha chiesto al provider in tempo reale di annullare o troncare la risposta attiva. Include `outputAudioMs`, `outputActive` e `playbackChunks`, consentendo di vedere quanto audio dell'assistente fosse stato effettivamente riprodotto prima dell'interruzione.
6. `realtime audio playback stopped reason=...` è il punto di reimpostazione della riproduzione locale di Discord. Il motivo indica chi ha arrestato la riproduzione: `barge-in`, `player-idle`, `provider-clear-audio`, `forced-agent-consult`, `stream-close` o `session-close`.
7. `realtime speaker turn closed` riepiloga il turno di input acquisito. `chunks=0` o `hasAudio=false` indica che il turno dell'interlocutore è stato aperto, ma nessun audio utilizzabile ha raggiunto il bridge in tempo reale. `interruptedPlayback=true` indica che quel turno di input si è sovrapposto all'output dell'assistente e ha attivato la logica di interruzione.

Campi utili:

- `outputAudioMs`: durata dell'audio dell'assistente generato dal provider in tempo reale prima della riga di log.
- `audioMs`: durata dell'audio dell'assistente conteggiata da OpenClaw prima dell'arresto della riproduzione.
- `elapsedMs`: tempo trascorso effettivo tra l'apertura e la chiusura del flusso di riproduzione o del turno dell'interlocutore.
- `discordBytes`: byte PCM stereo a 48 kHz inviati alla voce Discord o ricevuti da essa.
- `realtimeBytes`: byte PCM nel formato del provider inviati al provider in tempo reale o ricevuti da esso.
- `playbackChunks`: segmenti audio dell'assistente inoltrati a Discord per la risposta attiva.
- `sinceLastAudioMs`: intervallo tra l'ultimo fotogramma audio acquisito dell'interlocutore e la chiusura del suo turno.

Schemi comuni:

- Un'interruzione immediata con `source=active-speaker-audio`, un valore `outputAudioMs` ridotto e lo stesso utente nelle vicinanze indica generalmente che l'eco degli altoparlanti entra nel microfono. Aumentare `voice.realtime.minBargeInAudioEndMs`, ridurre il volume degli altoparlanti, utilizzare cuffie oppure impostare `voice.realtime.providers.openai.interruptResponseOnInputAudio: false`.
- `source=speaker-start` seguito da `speaker turn closed ... hasAudio=false` indica che Discord ha segnalato l'inizio di un intervento, ma nessun audio ha raggiunto OpenClaw. Può trattarsi di un evento vocale transitorio di Discord, del comportamento della soglia del rumore o di un client che attiva brevemente il microfono.
- `audio playback stopped reason=stream-close` senza un'interruzione o un evento `provider-clear-audio` nelle vicinanze indica che il flusso di riproduzione locale di Discord è terminato inaspettatamente. Controllare i log precedenti del provider e del lettore Discord.
- `capture ignored during playback (barge-in disabled)` indica che OpenClaw ha intenzionalmente scartato l'input mentre l'audio dell'assistente era attivo. Abilitare `voice.realtime.bargeIn` se si desidera che il parlato interrompa la riproduzione.
- `barge-in ignored ... outputActive=false` indica che Discord o il rilevamento dell'attività vocale del provider ha segnalato del parlato, ma OpenClaw non disponeva di una riproduzione attiva da interrompere. Ciò non dovrebbe interrompere l'audio.

Le credenziali vengono risolte separatamente per ciascun componente: autenticazione dell'instradamento del modello linguistico per `voice.model`, autenticazione del riconoscimento vocale per `tools.media.audio`, autenticazione della sintesi vocale per `messages.tts`/`voice.tts` e autenticazione del provider in tempo reale per `voice.realtime.providers` o per la normale configurazione di autenticazione del provider.

### Messaggi vocali

I messaggi vocali Discord mostrano un'anteprima della forma d'onda e richiedono audio OGG/Opus. OpenClaw genera automaticamente la forma d'onda, ma necessita di `ffmpeg` e `ffprobe` sull'host del Gateway per eseguire l'analisi e la conversione.

- Fornire un **percorso di file locale** (gli URL vengono rifiutati).
- Omettere il contenuto testuale (Discord rifiuta testo e messaggio vocale nello stesso payload).
- È accettato qualsiasi formato audio; OpenClaw lo converte in OGG/Opus secondo necessità.

```bash
message(action="send", channel="discord", target="channel:123", path="/path/to/audio.mp3", asVoice=true)
```

## Risoluzione dei problemi

<AccordionGroup>
  <Accordion title="Sono stati usati intenti non consentiti oppure il bot non vede i messaggi del server">

    - abilita Message Content Intent
    - abilita Server Members Intent quando dipendi dalla risoluzione di utenti/membri
    - riavvia il Gateway dopo aver modificato gli intent

  </Accordion>

  <Accordion title="Guild messages blocked unexpectedly">

    - verifica `groupPolicy`
    - verifica l'elenco consentiti delle gilde in `channels.discord.guilds`
    - se esiste una mappa `channels` per una gilda, sono consentiti solo i canali elencati
    - verifica il comportamento di `requireMention` e i modelli di menzione

    Controlli utili:

```bash
openclaw doctor
openclaw channels status --probe
openclaw logs --follow
```

  </Accordion>

  <Accordion title="Require mention false but still blocked">
    Cause comuni:

    - `groupPolicy="allowlist"` senza un elenco consentiti corrispondente per gilda/canale
    - `requireMention` configurato nella posizione errata (deve trovarsi in `channels.discord.guilds` o in una voce di canale)
    - mittente bloccato dall'elenco consentiti `users` della gilda/del canale

  </Accordion>

  <Accordion title="Long-running Discord turns or duplicate replies">

    Log tipici:

    - `Slow listener detected ...`
    - `stuck session: sessionKey=agent:...:discord:... state=processing ...`

    Parametri della coda del Gateway Discord:

    - account singolo: `channels.discord.eventQueue.listenerTimeout`
    - account multipli: `channels.discord.accounts.<accountId>.eventQueue.listenerTimeout`
    - questo controlla solo il lavoro del listener del Gateway Discord, non la durata del turno dell'agente

    Discord non applica un timeout gestito dal canale ai turni dell'agente in coda. I listener dei messaggi trasferiscono immediatamente il lavoro e le esecuzioni Discord in coda mantengono l'ordine per sessione finché il ciclo di vita della sessione, dello strumento o del runtime non completa o interrompe il lavoro.

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
    Prima di connettersi, OpenClaw recupera i metadati Discord `/gateway/bot`. In caso di errori temporanei, usa come fallback l'URL predefinito del Gateway Discord e limita la frequenza dei log.

    Parametri del timeout dei metadati:

    - account singolo: `channels.discord.gatewayInfoTimeoutMs`
    - account multipli: `channels.discord.accounts.<accountId>.gatewayInfoTimeoutMs`
    - fallback tramite variabile d'ambiente quando la configurazione non è impostata: `OPENCLAW_DISCORD_GATEWAY_INFO_TIMEOUT_MS`
    - valore predefinito: `30000` (30 secondi), massimo: `120000`

  </Accordion>

  <Accordion title="Gateway READY timeout restarts">
    OpenClaw attende l'evento `READY` del Gateway Discord durante l'avvio e dopo le riconnessioni del runtime. Le configurazioni con più account e avvio scaglionato possono richiedere una finestra READY di avvio più lunga rispetto al valore predefinito.

    Parametri del timeout READY:

    - avvio con account singolo: `channels.discord.gatewayReadyTimeoutMs`
    - avvio con account multipli: `channels.discord.accounts.<accountId>.gatewayReadyTimeoutMs`
    - fallback di avvio tramite variabile d'ambiente quando la configurazione non è impostata: `OPENCLAW_DISCORD_READY_TIMEOUT_MS`
    - valore predefinito all'avvio: `15000` (15 secondi), massimo: `120000`
    - runtime con account singolo: `channels.discord.gatewayRuntimeReadyTimeoutMs`
    - runtime con account multipli: `channels.discord.accounts.<accountId>.gatewayRuntimeReadyTimeoutMs`
    - fallback del runtime tramite variabile d'ambiente quando la configurazione non è impostata: `OPENCLAW_DISCORD_RUNTIME_READY_TIMEOUT_MS`
    - valore predefinito del runtime: `30000` (30 secondi), massimo: `120000`

  </Accordion>

  <Accordion title="Permissions audit mismatches">
    I controlli delle autorizzazioni di `channels status --probe` funzionano solo con ID canale numerici.

    Se utilizzi chiavi slug, la corrispondenza durante l'esecuzione può comunque funzionare, ma la verifica non può controllare completamente le autorizzazioni.

  </Accordion>

  <Accordion title="DM and pairing issues">

    - messaggi diretti disabilitati: `channels.discord.dm.enabled=false`
    - criterio dei messaggi diretti disabilitato: `channels.discord.dmPolicy="disabled"` (legacy: `channels.discord.dm.policy`)
    - approvazione dell'associazione in attesa in modalità `pairing`

  </Accordion>

  <Accordion title="Bot to bot loops">
    Per impostazione predefinita, i messaggi creati dai bot vengono ignorati.

    Se imposti `channels.discord.allowBots=true`, utilizza regole rigide per le menzioni e gli elenchi consentiti per evitare cicli.
    Preferisci `channels.discord.allowBots="mentions"` per accettare solo i messaggi dei bot che menzionano il bot.

    OpenClaw include anche una [protezione condivisa dai cicli tra bot](/it/channels/bot-loop-protection). Ogni volta che `allowBots` consente ai messaggi creati dai bot di raggiungere l'inoltro, Discord associa l'evento in ingresso ai dati `(account, channel, bot pair)` e il controllo generico della coppia la sospende dopo che supera il budget di eventi configurato. Il controllo impedisce i cicli incontrollati tra due bot che in precedenza dovevano essere arrestati dai limiti di frequenza di Discord; non influisce sulle distribuzioni con un solo bot né sulle risposte isolate dei bot che rimangono entro il budget.

    Impostazioni predefinite (attive quando è impostato `allowBots`):

    - `maxEventsPerWindow: 20` -- la coppia di bot può scambiarsi 20 messaggi nella finestra mobile
    - `windowSeconds: 60` -- durata della finestra mobile
    - `cooldownSeconds: 60` -- una volta superato il budget, ogni ulteriore messaggio tra bot in entrambe le direzioni viene scartato per un minuto

    Configura una sola volta il valore predefinito condiviso in `channels.defaults.botLoopProtection`, quindi applica un override per Discord quando un flusso di lavoro legittimo richiede un margine maggiore. L'ordine di precedenza è:

    - `channels.discord.accounts.<account>.botLoopProtection`
    - `channels.discord.botLoopProtection`
    - `channels.defaults.botLoopProtection`
    - valori predefiniti integrati

    Discord utilizza le chiavi generiche `maxEventsPerWindow`, `windowSeconds` e `cooldownSeconds`.

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
        alpha: {
          // Alpha listens to other bots only when they mention it.
          allowBots: "mentions",
        },
        bravo: {
          // Bravo listens to all bot-authored Discord messages.
          allowBots: true,
          mentionAliases: {
            // Lets Bravo write an Alpha Discord mention with the configured user id.
            Alpha: "ALPHA_DISCORD_USER_ID",
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

  <Accordion title="Voice STT drops with DecryptionFailed(...)">

    - mantieni OpenClaw aggiornato (`openclaw update`) per disporre della logica di ripristino della ricezione vocale di Discord
    - verifica che `channels.discord.voice.daveEncryption=true` (valore predefinito)
    - parti da `channels.discord.voice.decryptionFailureTolerance=24` (valore predefinito a monte) e regolalo solo se necessario
    - controlla nei log:
      - `discord voice: DAVE decrypt failures detected`
      - `discord voice: repeated decrypt failures; attempting rejoin`
    - se gli errori continuano dopo la riconnessione automatica, raccogli i log e confrontali con la cronologia a monte della ricezione DAVE in [discord.js #11419](https://github.com/discordjs/discord.js/issues/11419) e [discord.js #11449](https://github.com/discordjs/discord.js/pull/11449)

  </Accordion>
</AccordionGroup>

## Riferimento della configurazione

Riferimento principale: [Riferimento della configurazione - Discord](/it/gateway/config-channels#discord).

<Accordion title="High-signal Discord fields">

- avvio/autenticazione: `enabled`, `token`, `applicationId`, `accounts.*`, `allowBots`
- criteri: `groupPolicy`, `dmPolicy`, `allowFrom`, `dm.*`, `guilds.*`, `guilds.*.channels.*`
- comandi: `commands.native`, `commands.useAccessGroups` (globale), `configWrites`, `slashCommand.ephemeral`
- coda degli eventi: `eventQueue.listenerTimeout` (budget del listener, valore predefinito `120000`), `eventQueue.maxQueueSize` (valore predefinito `10000`), `eventQueue.maxConcurrency` (valore predefinito `50`)
- Gateway: `proxy`, `gatewayInfoTimeoutMs`, `gatewayReadyTimeoutMs`, `gatewayRuntimeReadyTimeoutMs`
- risposte/cronologia: `replyToMode`, `historyLimit`, `dmHistoryLimit`, `dms.*.historyLimit`
- recapito: `textChunkLimit` (valore predefinito `2000`), `maxLinesPerMessage` (valore predefinito `17`)
- streaming: `streaming.mode`, `streaming.chunkMode`, `streaming.preview.*`, `streaming.progress.*`, `streaming.block.*` (le chiavi piatte legacy `streamMode`, `draftChunk`, `blockStreaming`, `blockStreamingCoalesce`, `chunkMode` vengono migrate in `streaming.*` da `openclaw doctor --fix`)
- contenuti multimediali/nuovi tentativi: `mediaMaxMb` (limita i caricamenti Discord in uscita, valore predefinito `100`), `retry`
- azioni: `actions.*`
- presenza: `activity`, `status`, `activityType`, `activityUrl`, `autoPresence.*`
- interfaccia utente: `ui.components.accentColor`
- funzionalità: `threadBindings`, `bindings[]` di primo livello (`type: "acp"`), `pluralkit`, `execApprovals`, `intents`, `agentComponents.enabled`, `agentComponents.ttlMs`, `heartbeat`, `responsePrefix`

</Accordion>

## Sicurezza e operazioni

- Tratta i token dei bot come segreti (`DISCORD_BOT_TOKEN` è preferibile negli ambienti supervisionati).
- Concedi a Discord autorizzazioni con privilegi minimi.
- Se la distribuzione o lo stato dei comandi non è aggiornato, riavvia il Gateway e ricontrolla con `openclaw channels status --probe`.

## Argomenti correlati

<CardGroup cols={2}>
  <Card title="Pairing" icon="link" href="/it/channels/pairing">
    Associa un utente Discord al Gateway.
  </Card>
  <Card title="Groups" icon="users" href="/it/channels/groups">
    Comportamento delle chat di gruppo e degli elenchi consentiti.
  </Card>
  <Card title="Channel routing" icon="route" href="/it/channels/channel-routing">
    Instrada i messaggi in ingresso agli agenti.
  </Card>
  <Card title="Security" icon="shield" href="/it/gateway/security">
    Modello delle minacce e rafforzamento della sicurezza.
  </Card>
  <Card title="Multi-agent routing" icon="sitemap" href="/it/concepts/multi-agent">
    Associa gilde e canali agli agenti.
  </Card>
  <Card title="Slash commands" icon="terminal" href="/it/tools/slash-commands">
    Comportamento dei comandi nativi.
  </Card>
</CardGroup>
