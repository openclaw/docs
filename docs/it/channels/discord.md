---
read_when:
    - Lavorare sulle funzionalità del canale Discord
summary: Stato del supporto del bot Discord, capacità e configurazione
title: Discord
x-i18n:
    generated_at: "2026-04-23T13:57:56Z"
    model: gpt-5.4
    provider: openai
    source_hash: 1160a0b221bc3251722a81c00c65ee7c2001efce345248727f1f3c8580a0e953
    source_path: channels/discord.md
    workflow: 15
---

# Discord (API Bot)

Stato: pronto per DM e canali guild tramite il gateway Discord ufficiale.

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

Dovrai creare una nuova applicazione con un bot, aggiungere il bot al tuo server e abbinarlo a OpenClaw. Ti consigliamo di aggiungere il bot al tuo server privato. Se non ne hai ancora uno, [creane prima uno](https://support.discord.com/hc/en-us/articles/204849977-How-do-I-create-a-server) (scegli **Create My Own > For me and my friends**).

<Steps>
  <Step title="Crea un'applicazione Discord e un bot">
    Vai al [Discord Developer Portal](https://discord.com/developers/applications) e fai clic su **New Application**. Assegnale un nome come "OpenClaw".

    Fai clic su **Bot** nella barra laterale. Imposta **Username** su come chiami il tuo agente OpenClaw.

  </Step>

  <Step title="Abilita gli intent privilegiati">
    Sempre nella pagina **Bot**, scorri fino a **Privileged Gateway Intents** e abilita:

    - **Message Content Intent** (obbligatorio)
    - **Server Members Intent** (consigliato; obbligatorio per le allowlist dei ruoli e l'abbinamento da nome a ID)
    - **Presence Intent** (facoltativo; necessario solo per gli aggiornamenti di presenza)

  </Step>

  <Step title="Copia il token del tuo bot">
    Torna in alto nella pagina **Bot** e fai clic su **Reset Token**.

    <Note>
    Nonostante il nome, questo genera il tuo primo token — non viene “reimpostato” nulla.
    </Note>

    Copia il token e salvalo da qualche parte. Questo è il tuo **Bot Token** e ti servirà tra poco.

  </Step>

  <Step title="Genera un URL di invito e aggiungi il bot al tuo server">
    Fai clic su **OAuth2** nella barra laterale. Genererai un URL di invito con le autorizzazioni corrette per aggiungere il bot al tuo server.

    Scorri fino a **OAuth2 URL Generator** e abilita:

    - `bot`
    - `applications.commands`

    Sotto apparirà una sezione **Bot Permissions**. Abilita almeno:

    **General Permissions**
      - View Channels
    **Text Permissions**
      - Send Messages
      - Read Message History
      - Embed Links
      - Attach Files
      - Add Reactions (facoltativo)

    Questo è l'insieme di base per i normali canali di testo. Se prevedi di pubblicare nei thread Discord, inclusi i flussi di lavoro dei canali forum o media che creano o continuano un thread, abilita anche **Send Messages in Threads**.
    Copia l'URL generato in fondo, incollalo nel browser, seleziona il tuo server e fai clic su **Continue** per collegarti. Ora dovresti vedere il tuo bot nel server Discord.

  </Step>

  <Step title="Abilita la modalità sviluppatore e raccogli i tuoi ID">
    Tornato nell'app Discord, devi abilitare la modalità sviluppatore per poter copiare gli ID interni.

    1. Fai clic su **User Settings** (icona dell'ingranaggio accanto al tuo avatar) → **Advanced** → attiva **Developer Mode**
    2. Fai clic con il pulsante destro sull'**icona del server** nella barra laterale → **Copy Server ID**
    3. Fai clic con il pulsante destro sul tuo **avatar** → **Copy User ID**

    Salva **Server ID** e **User ID** insieme al tuo Bot Token — invierai tutti e tre a OpenClaw nel passaggio successivo.

  </Step>

  <Step title="Consenti i DM dai membri del server">
    Perché l'abbinamento funzioni, Discord deve consentire al tuo bot di inviarti DM. Fai clic con il pulsante destro sull'**icona del server** → **Privacy Settings** → attiva **Direct Messages**.

    Questo consente ai membri del server (inclusi i bot) di inviarti DM. Mantieni questa opzione abilitata se vuoi usare i DM di Discord con OpenClaw. Se prevedi di usare solo i canali guild, puoi disabilitare i DM dopo l'abbinamento.

  </Step>

  <Step title="Imposta in modo sicuro il token del tuo bot (non inviarlo in chat)">
    Il token del tuo bot Discord è un segreto (come una password). Impostalo sulla macchina che esegue OpenClaw prima di inviare messaggi al tuo agente.

```bash
export DISCORD_BOT_TOKEN="YOUR_BOT_TOKEN"
openclaw config set channels.discord.token --ref-provider default --ref-source env --ref-id DISCORD_BOT_TOKEN --dry-run
openclaw config set channels.discord.token --ref-provider default --ref-source env --ref-id DISCORD_BOT_TOKEN
openclaw config set channels.discord.enabled true --strict-json
openclaw gateway
```

    Se OpenClaw è già in esecuzione come servizio in background, riavvialo tramite l'app Mac di OpenClaw oppure arrestando e riavviando il processo `openclaw gateway run`.

  </Step>

  <Step title="Configura OpenClaw ed esegui l'abbinamento">

    <Tabs>
      <Tab title="Chiedi al tuo agente">
        Scrivi al tuo agente OpenClaw su un qualsiasi canale esistente (ad esempio Telegram) e diglielo. Se Discord è il tuo primo canale, usa invece la scheda CLI / config.

        > "Ho già impostato il token del mio bot Discord nella configurazione. Per favore completa la configurazione di Discord con User ID `<user_id>` e Server ID `<server_id>`."
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

        I valori `token` in testo semplice sono supportati. Sono supportati anche i valori SecretRef per `channels.discord.token` tramite provider env/file/exec. Vedi [Secrets Management](/it/gateway/secrets).

      </Tab>
    </Tabs>

  </Step>

  <Step title="Approva il primo abbinamento DM">
    Attendi che il gateway sia in esecuzione, quindi invia un DM al tuo bot in Discord. Risponderà con un codice di abbinamento.

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
La risoluzione del token tiene conto dell'account. I valori del token nella configurazione hanno la precedenza sul fallback env. `DISCORD_BOT_TOKEN` viene usato solo per l'account predefinito.
Per le chiamate avanzate in uscita (strumento messaggi/azioni del canale), un `token` esplicito per chiamata viene usato per quella chiamata. Questo vale per le azioni di invio e di lettura/sonda (ad esempio read/search/fetch/thread/pins/permissions). Le impostazioni di policy/account e retry continuano comunque a provenire dall'account selezionato nello snapshot di runtime attivo.
</Note>

## Consigliato: configura un workspace guild

Una volta che i DM funzionano, puoi configurare il tuo server Discord come workspace completo in cui ogni canale ottiene la propria sessione agente con il proprio contesto. Questo è consigliato per i server privati in cui ci siete solo tu e il tuo bot.

<Steps>
  <Step title="Aggiungi il tuo server alla allowlist delle guild">
    Questo consente al tuo agente di rispondere in qualsiasi canale del tuo server, non solo nei DM.

    <Tabs>
      <Tab title="Chiedi al tuo agente">
        > "Aggiungi il mio Server ID Discord `<server_id>` alla allowlist delle guild"
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

  <Step title="Consenti risposte senza @mention">
    Per impostazione predefinita, il tuo agente risponde nei canali guild solo quando viene @menzionato. Per un server privato, probabilmente vorrai che risponda a ogni messaggio.

    <Tabs>
      <Tab title="Chiedi al tuo agente">
        > "Consenti al mio agente di rispondere su questo server senza dover essere @menzionato"
      </Tab>
      <Tab title="Config">
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
        Se hai bisogno di contesto condiviso in ogni canale, inserisci le istruzioni stabili in `AGENTS.md` o `USER.md` (vengono iniettati in ogni sessione). Mantieni le note a lungo termine in `MEMORY.md` e accedivi su richiesta con gli strumenti di memoria.
      </Tab>
    </Tabs>

  </Step>
</Steps>

Ora crea alcuni canali sul tuo server Discord e inizia a chattare. Il tuo agente può vedere il nome del canale e ogni canale ottiene la propria sessione isolata — così puoi configurare `#coding`, `#home`, `#research` o qualsiasi altra cosa si adatti al tuo flusso di lavoro.

## Modello di runtime

- Il Gateway gestisce la connessione Discord.
- L'instradamento delle risposte è deterministico: i messaggi in ingresso da Discord rispondono di nuovo su Discord.
- Per impostazione predefinita (`session.dmScope=main`), le chat dirette condividono la sessione principale dell'agente (`agent:main:main`).
- I canali guild sono chiavi di sessione isolate (`agent:<agentId>:discord:channel:<channelId>`).
- I DM di gruppo vengono ignorati per impostazione predefinita (`channels.discord.dm.groupEnabled=false`).
- I comandi slash nativi vengono eseguiti in sessioni di comando isolate (`agent:<agentId>:discord:slash:<userId>`), pur trasportando `CommandTargetSessionKey` verso la sessione di conversazione instradata.

## Canali forum

I canali forum e media di Discord accettano solo post in thread. OpenClaw supporta due modi per crearli:

- Invia un messaggio al padre forum (`channel:<forumId>`) per creare automaticamente un thread. Il titolo del thread usa la prima riga non vuota del tuo messaggio.
- Usa `openclaw message thread create` per creare direttamente un thread. Non passare `--message-id` per i canali forum.

Esempio: invia al padre forum per creare un thread

```bash
openclaw message send --channel discord --target channel:<forumId> \
  --message "Titolo dell'argomento\nCorpo del post"
```

Esempio: crea esplicitamente un thread del forum

```bash
openclaw message thread create --channel discord --target channel:<forumId> \
  --thread-name "Titolo dell'argomento" --message "Corpo del post"
```

I padri forum non accettano componenti Discord. Se hai bisogno di componenti, invia al thread stesso (`channel:<threadId>`).

## Componenti interattivi

OpenClaw supporta i contenitori components v2 di Discord per i messaggi dell'agente. Usa lo strumento messaggi con un payload `components`. I risultati delle interazioni vengono instradati di nuovo all'agente come normali messaggi in ingresso e seguono le impostazioni Discord `replyToMode` esistenti.

Blocchi supportati:

- `text`, `section`, `separator`, `actions`, `media-gallery`, `file`
- Le righe di azione consentono fino a 5 pulsanti o un singolo menu di selezione
- Tipi di selezione: `string`, `user`, `role`, `mentionable`, `channel`

Per impostazione predefinita, i componenti sono monouso. Imposta `components.reusable=true` per consentire che pulsanti, selettori e moduli vengano usati più volte fino alla loro scadenza.

Per limitare chi può fare clic su un pulsante, imposta `allowedUsers` su quel pulsante (ID utente Discord, tag o `*`). Quando configurato, gli utenti non corrispondenti ricevono un rifiuto effimero.

I comandi slash `/model` e `/models` aprono un selettore di modelli interattivo con menu a discesa per provider e modello più un passaggio Submit. A meno che `commands.modelsWrite=false`, `/models add` supporta anche l'aggiunta di una nuova voce provider/modello dalla chat e i modelli appena aggiunti compaiono senza riavviare il gateway. La risposta del selettore è effimera e solo l'utente che lo invoca può usarla.

Allegati file:

- I blocchi `file` devono puntare a un riferimento allegato (`attachment://<filename>`)
- Fornisci l'allegato tramite `media`/`path`/`filePath` (file singolo); usa `media-gallery` per più file
- Usa `filename` per sovrascrivere il nome di caricamento quando deve corrispondere al riferimento allegato

Moduli modali:

- Aggiungi `components.modal` con fino a 5 campi
- Tipi di campo: `text`, `checkbox`, `radio`, `select`, `role-select`, `user-select`
- OpenClaw aggiunge automaticamente un pulsante di attivazione

Esempio:

```json5
{
  channel: "discord",
  action: "send",
  to: "channel:123456789012345678",
  message: "Testo di fallback facoltativo",
  components: {
    reusable: true,
    text: "Scegli un percorso",
    blocks: [
      {
        type: "actions",
        buttons: [
          {
            label: "Approva",
            style: "success",
            allowedUsers: ["123456789012345678"],
          },
          { label: "Rifiuta", style: "danger" },
        ],
      },
      {
        type: "actions",
        select: {
          type: "string",
          placeholder: "Scegli un'opzione",
          options: [
            { label: "Opzione A", value: "a" },
            { label: "Opzione B", value: "b" },
          ],
        },
      },
    ],
    modal: {
      title: "Dettagli",
      triggerLabel: "Apri modulo",
      fields: [
        { type: "text", label: "Richiedente" },
        {
          type: "select",
          label: "Priorità",
          options: [
            { label: "Bassa", value: "low" },
            { label: "Alta", value: "high" },
          ],
        },
      ],
    },
  },
}
```

## Controllo degli accessi e instradamento

<Tabs>
  <Tab title="Policy DM">
    `channels.discord.dmPolicy` controlla l'accesso ai DM (legacy: `channels.discord.dm.policy`):

    - `pairing` (predefinito)
    - `allowlist`
    - `open` (richiede che `channels.discord.allowFrom` includa `"*"`; legacy: `channels.discord.dm.allowFrom`)
    - `disabled`

    Se la policy DM non è open, gli utenti sconosciuti vengono bloccati (oppure viene richiesto l'abbinamento in modalità `pairing`).

    Precedenza multi-account:

    - `channels.discord.accounts.default.allowFrom` si applica solo all'account `default`.
    - Gli account con nome ereditano `channels.discord.allowFrom` quando il proprio `allowFrom` non è impostato.
    - Gli account con nome non ereditano `channels.discord.accounts.default.allowFrom`.

    Formato del target DM per la consegna:

    - `user:<id>`
    - menzione `<@id>`

    Gli ID numerici semplici sono ambigui e vengono rifiutati a meno che non sia fornito un tipo di target utente/canale esplicito.

  </Tab>

  <Tab title="Policy guild">
    La gestione delle guild è controllata da `channels.discord.groupPolicy`:

    - `open`
    - `allowlist`
    - `disabled`

    La baseline sicura quando esiste `channels.discord` è `allowlist`.

    Comportamento di `allowlist`:

    - la guild deve corrispondere a `channels.discord.guilds` (`id` preferito, slug accettato)
    - allowlist facoltative del mittente: `users` (consigliati ID stabili) e `roles` (solo ID di ruolo); se una delle due è configurata, i mittenti sono consentiti quando corrispondono a `users` O `roles`
    - la corrispondenza diretta nome/tag è disabilitata per impostazione predefinita; abilita `channels.discord.dangerouslyAllowNameMatching: true` solo come modalità di compatibilità di emergenza
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

    Se imposti solo `DISCORD_BOT_TOKEN` e non crei un blocco `channels.discord`, il fallback di runtime è `groupPolicy="allowlist"` (con un avviso nei log), anche se `channels.defaults.groupPolicy` è `open`.

  </Tab>

  <Tab title="Menzioni e DM di gruppo">
    I messaggi guild sono vincolati alle menzioni per impostazione predefinita.

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

### Instradamento dell'agente basato sui ruoli

Usa `bindings[].match.roles` per instradare i membri delle guild Discord a diversi agenti in base all'ID del ruolo. I binding basati sui ruoli accettano solo ID di ruolo e vengono valutati dopo i binding peer o parent-peer e prima dei binding solo-guild. Se un binding imposta anche altri campi di corrispondenza (ad esempio `peer` + `guildId` + `roles`), tutti i campi configurati devono corrispondere.

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

## Configurazione del Developer Portal

<AccordionGroup>
  <Accordion title="Crea app e bot">

    1. Discord Developer Portal -> **Applications** -> **New Application**
    2. **Bot** -> **Add Bot**
    3. Copia il token del bot

  </Accordion>

  <Accordion title="Intent privilegiati">
    In **Bot -> Privileged Gateway Intents**, abilita:

    - Message Content Intent
    - Server Members Intent (consigliato)

    Presence Intent è facoltativo ed è richiesto solo se vuoi ricevere aggiornamenti di presenza. L'impostazione della presenza del bot (`setPresence`) non richiede l'abilitazione degli aggiornamenti di presenza per i membri.

  </Accordion>

  <Accordion title="Scope OAuth e autorizzazioni di base">
    Generatore URL OAuth:

    - scope: `bot`, `applications.commands`

    Autorizzazioni di base tipiche:

    **General Permissions**
      - View Channels
    **Text Permissions**
      - Send Messages
      - Read Message History
      - Embed Links
      - Attach Files
      - Add Reactions (facoltativo)

    Questo è l'insieme di base per i normali canali di testo. Se prevedi di pubblicare nei thread Discord, inclusi i flussi di lavoro dei canali forum o media che creano o continuano un thread, abilita anche **Send Messages in Threads**.
    Evita `Administrator` a meno che non sia esplicitamente necessario.

  </Accordion>

  <Accordion title="Copia gli ID">
    Abilita la modalità sviluppatore di Discord, quindi copia:

    - ID server
    - ID canale
    - ID utente

    Preferisci gli ID numerici nella configurazione OpenClaw per audit e probe affidabili.

  </Accordion>
</AccordionGroup>

## Comandi nativi e autenticazione dei comandi

- `commands.native` è predefinito su `"auto"` ed è abilitato per Discord.
- Override per canale: `channels.discord.commands.native`.
- `commands.native=false` cancella esplicitamente i comandi nativi Discord registrati in precedenza.
- L'autenticazione dei comandi nativi usa le stesse allowlist/policy Discord della normale gestione dei messaggi.
- I comandi possono comunque essere visibili nell'interfaccia Discord agli utenti non autorizzati; l'esecuzione continua comunque ad applicare l'autorizzazione OpenClaw e restituisce "non autorizzato".

Vedi [Slash commands](/it/tools/slash-commands) per il catalogo dei comandi e il comportamento.

Impostazioni predefinite dei comandi slash:

- `ephemeral: true`

## Dettagli delle funzionalità

<AccordionGroup>
  <Accordion title="Tag di risposta e risposte native">
    Discord supporta i tag di risposta nell'output dell'agente:

    - `[[reply_to_current]]`
    - `[[reply_to:<id>]]`

    Controllati da `channels.discord.replyToMode`:

    - `off` (predefinito)
    - `first`
    - `all`
    - `batched`

    Nota: `off` disabilita il threading implicito delle risposte. I tag espliciti `[[reply_to_*]]` vengono comunque rispettati.
    `first` allega sempre il riferimento implicito di risposta nativa al primo messaggio Discord in uscita del turno.
    `batched` allega il riferimento implicito di risposta nativa di Discord solo quando il turno in ingresso era un batch con debounce di più messaggi. Questo è utile quando vuoi risposte native soprattutto per chat ambigue e concitate, non per ogni singolo turno con un solo messaggio.

    Gli ID dei messaggi vengono esposti nel contesto/nella cronologia così che gli agenti possano indirizzare messaggi specifici.

  </Accordion>

  <Accordion title="Anteprima dello stream live">
    OpenClaw può trasmettere bozze di risposta inviando un messaggio temporaneo e modificandolo man mano che arriva il testo. `channels.discord.streaming` accetta `off` (predefinito) | `partial` | `block` | `progress`. `progress` viene mappato a `partial` su Discord; `streamMode` è un alias legacy e viene migrato automaticamente.

    Il valore predefinito resta `off` perché le modifiche di anteprima su Discord raggiungono rapidamente i limiti di velocità quando più bot o gateway condividono un account.

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
    - `block` emette blocchi grandi quanto una bozza (usa `draftChunk` per regolare dimensione e punti di interruzione, limitati a `textChunkLimit`).
    - Media, errori e finali con risposta esplicita annullano le modifiche di anteprima in sospeso.
    - `streaming.preview.toolProgress` (predefinito `true`) controlla se gli aggiornamenti di strumenti/progresso riutilizzano il messaggio di anteprima.

    Lo streaming di anteprima è solo testuale; le risposte media tornano alla consegna normale. Quando lo streaming `block` è esplicitamente abilitato, OpenClaw salta lo stream di anteprima per evitare un doppio streaming.

  </Accordion>

  <Accordion title="Cronologia, contesto e comportamento dei thread">
    Contesto della cronologia guild:

    - `channels.discord.historyLimit` predefinito `20`
    - fallback: `messages.groupChat.historyLimit`
    - `0` disabilita

    Controlli della cronologia DM:

    - `channels.discord.dmHistoryLimit`
    - `channels.discord.dms["<user_id>"].historyLimit`

    Comportamento dei thread:

    - I thread Discord vengono instradati come sessioni di canale ed ereditano la configurazione del canale padre se non sovrascritta.
    - `channels.discord.thread.inheritParent` (predefinito `false`) fa sì che i nuovi thread automatici ereditino il transcript del padre. Gli override per account si trovano sotto `channels.discord.accounts.<id>.thread.inheritParent`.
    - Le reazioni dello strumento messaggi possono risolvere target DM `user:<id>`.
    - `guilds.<guild>.channels.<channel>.requireMention: false` viene preservato durante il fallback di attivazione nella fase di risposta.

    Gli argomenti del canale vengono iniettati come contesto **non attendibile**. Le allowlist regolano chi può attivare l'agente, non un confine completo di redazione del contesto supplementare.

  </Accordion>

  <Accordion title="Sessioni vincolate al thread per i sottoagenti">
    Discord può associare un thread a un target di sessione in modo che i messaggi successivi in quel thread continuino a essere instradati verso la stessa sessione (incluse le sessioni di sottoagenti).

    Comandi:

    - `/focus <target>` associa il thread corrente/nuovo a un target di sottoagente/sessione
    - `/unfocus` rimuove l'associazione del thread corrente
    - `/agents` mostra le esecuzioni attive e lo stato dell'associazione
    - `/session idle <duration|off>` controlla/aggiorna la rimozione automatica dell'associazione per inattività per i binding focalizzati
    - `/session max-age <duration|off>` controlla/aggiorna l'età massima rigida per i binding focalizzati

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
    - `spawnSubagentSessions` deve essere `true` per creare/associare automaticamente thread per `sessions_spawn({ thread: true })`.
    - `spawnAcpSessions` deve essere `true` per creare/associare automaticamente thread per ACP (`/acp spawn ... --thread ...` o `sessions_spawn({ runtime: "acp", thread: true })`).
    - Se i thread binding sono disabilitati per un account, `/focus` e le relative operazioni di thread binding non sono disponibili.

    Vedi [Sub-agents](/it/tools/subagents), [ACP Agents](/it/tools/acp-agents) e [Configuration Reference](/it/gateway/configuration-reference).

  </Accordion>

  <Accordion title="Binding persistenti dei canali ACP">
    Per workspace ACP stabili “sempre attivi”, configura binding ACP tipizzati di livello superiore indirizzati alle conversazioni Discord.

    Percorso config:

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

    - `/acp spawn codex --bind here` associa il canale o thread corrente sul posto e mantiene i messaggi futuri sulla stessa sessione ACP. I messaggi del thread ereditano il binding del canale padre.
    - In un canale o thread associato, `/new` e `/reset` reimpostano la stessa sessione ACP sul posto. I binding temporanei del thread possono sovrascrivere la risoluzione del target mentre sono attivi.
    - `spawnAcpSessions` è richiesto solo quando OpenClaw deve creare/associare un thread figlio tramite `--thread auto|here`.

    Vedi [ACP Agents](/it/tools/acp-agents) per i dettagli sul comportamento dei binding.

  </Accordion>

  <Accordion title="Notifiche delle reazioni">
    Modalità di notifica delle reazioni per guild:

    - `off`
    - `own` (predefinito)
    - `all`
    - `allowlist` (usa `guilds.<id>.users`)

    Gli eventi di reazione vengono trasformati in eventi di sistema e allegati alla sessione Discord instradata.

  </Accordion>

  <Accordion title="Reazioni di conferma">
    `ackReaction` invia un'emoji di conferma mentre OpenClaw sta elaborando un messaggio in ingresso.

    Ordine di risoluzione:

    - `channels.discord.accounts.<accountId>.ackReaction`
    - `channels.discord.ackReaction`
    - `messages.ackReaction`
    - fallback emoji identità agente (`agents.list[].identity.emoji`, altrimenti "👀")

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
    Instrada il traffico WebSocket del gateway Discord e le ricerche REST all'avvio (ID applicazione + risoluzione allowlist) tramite un proxy HTTP(S) con `channels.discord.proxy`.

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
        token: "pk_live_...", // facoltativo; necessario per sistemi privati
      },
    },
  },
}
```

    Note:

    - le allowlist possono usare `pk:<memberId>`
    - i nomi visualizzati dei membri vengono confrontati per nome/slug solo quando `channels.discord.dangerouslyAllowNameMatching: true`
    - le ricerche usano l'ID messaggio originale e sono vincolate a una finestra temporale
    - se la ricerca fallisce, i messaggi proxy vengono trattati come messaggi del bot e scartati a meno che `allowBots=true`

  </Accordion>

  <Accordion title="Configurazione della presenza">
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

    Esempio attività (lo stato personalizzato è il tipo di attività predefinito):

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

    Esempio streaming:

```json5
{
  channels: {
    discord: {
      activity: "Coding live",
      activityType: 1,
      activityUrl: "https://twitch.tv/openclaw",
    },
  },
}
```

    Mappa dei tipi di attività:

    - 0: Giocando
    - 1: In streaming (richiede `activityUrl`)
    - 2: In ascolto
    - 3: Guardando
    - 4: Personalizzata (usa il testo dell'attività come stato; l'emoji è facoltativa)
    - 5: Competendo

    Esempio di presenza automatica (segnale di salute del runtime):

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

    La presenza automatica mappa la disponibilità del runtime allo stato Discord: sano => online, degradato o sconosciuto => idle, esaurito o non disponibile => dnd. Override testuali facoltativi:

    - `autoPresence.healthyText`
    - `autoPresence.degradedText`
    - `autoPresence.exhaustedText` (supporta il segnaposto `{reason}`)

  </Accordion>

  <Accordion title="Approvazioni in Discord">
    Discord supporta la gestione delle approvazioni basata su pulsanti nei DM e può facoltativamente pubblicare i prompt di approvazione nel canale di origine.

    Percorso config:

    - `channels.discord.execApprovals.enabled`
    - `channels.discord.execApprovals.approvers` (facoltativo; usa `commands.ownerAllowFrom` come fallback quando possibile)
    - `channels.discord.execApprovals.target` (`dm` | `channel` | `both`, predefinito: `dm`)
    - `agentFilter`, `sessionFilter`, `cleanupAfterResolve`

    Discord abilita automaticamente le approvazioni exec native quando `enabled` non è impostato o è `"auto"` e può essere risolto almeno un approvatore, da `execApprovals.approvers` oppure da `commands.ownerAllowFrom`. Discord non deduce gli approvatori exec da `allowFrom` del canale, da `dm.allowFrom` legacy o da `defaultTo` dei messaggi diretti. Imposta `enabled: false` per disabilitare esplicitamente Discord come client di approvazione nativo.

    Quando `target` è `channel` o `both`, il prompt di approvazione è visibile nel canale. Solo gli approvatori risolti possono usare i pulsanti; gli altri utenti ricevono un rifiuto effimero. I prompt di approvazione includono il testo del comando, quindi abilita la consegna nel canale solo nei canali attendibili. Se l'ID del canale non può essere derivato dalla chiave di sessione, OpenClaw torna alla consegna tramite DM.

    Discord renderizza anche i pulsanti di approvazione condivisi usati da altri canali di chat. L'adapter nativo Discord aggiunge principalmente l'instradamento DM degli approvatori e il fanout del canale.
    Quando questi pulsanti sono presenti, rappresentano l'esperienza utente di approvazione principale; OpenClaw dovrebbe includere un comando manuale `/approve` solo quando il risultato dello strumento indica che le approvazioni in chat non sono disponibili o che l'approvazione manuale è l'unico percorso.

    L'autenticazione Gateway e la risoluzione delle approvazioni seguono il contratto client Gateway condiviso (`plugin:` IDs vengono risolti tramite `plugin.approval.resolve`; gli altri ID tramite `exec.approval.resolve`). Le approvazioni scadono dopo 30 minuti per impostazione predefinita.

    Vedi [Exec approvals](/it/tools/exec-approvals).

  </Accordion>
</AccordionGroup>

## Strumenti e gate delle azioni

Le azioni dei messaggi Discord includono messaggistica, amministrazione dei canali, moderazione, presenza e azioni sui metadati.

Esempi principali:

- messaggistica: `sendMessage`, `readMessages`, `editMessage`, `deleteMessage`, `threadReply`
- reazioni: `react`, `reactions`, `emojiList`
- moderazione: `timeout`, `kick`, `ban`
- presenza: `setPresence`

L'azione `event-create` accetta un parametro `image` facoltativo (URL o percorso di file locale) per impostare l'immagine di copertina dell'evento pianificato.

I gate delle azioni si trovano sotto `channels.discord.actions.*`.

Comportamento predefinito dei gate:

| Gruppo di azioni                                                                                                                                                         | Predefinito |
| ------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ----------- |
| reactions, messages, threads, pins, polls, search, memberInfo, roleInfo, channelInfo, channels, voiceStatus, events, stickers, emojiUploads, stickerUploads, permissions | abilitato   |
| roles                                                                                                                                                                    | disabilitato |
| moderation                                                                                                                                                               | disabilitato |
| presence                                                                                                                                                                 | disabilitato |

## UI Components v2

OpenClaw usa i components v2 di Discord per le approvazioni exec e i marcatori cross-context. Le azioni dei messaggi Discord possono anche accettare `components` per UI personalizzate (avanzato; richiede la costruzione di un payload di componenti tramite lo strumento Discord), mentre i `embeds` legacy restano disponibili ma non sono consigliati.

- `channels.discord.ui.components.accentColor` imposta il colore di accento usato dai contenitori dei componenti Discord (hex).
- Imposta per account con `channels.discord.accounts.<id>.ui.components.accentColor`.
- `embeds` vengono ignorati quando sono presenti components v2.

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

Discord ha due superfici vocali distinte: i **canali vocali** realtime (conversazioni continue) e gli **allegati di messaggi vocali** (il formato con anteprima waveform). Il gateway supporta entrambi.

### Canali vocali

Requisiti:

- Abilita i comandi nativi (`commands.native` o `channels.discord.commands.native`).
- Configura `channels.discord.voice`.
- Il bot necessita dei permessi Connect + Speak nel canale vocale di destinazione.

Usa `/vc join|leave|status` per controllare le sessioni. Il comando usa l'agente predefinito dell'account e segue le stesse regole di allowlist e group policy degli altri comandi Discord.

Esempio di join automatico:

```json5
{
  channels: {
    discord: {
      voice: {
        enabled: true,
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
          openai: { voice: "alloy" },
        },
      },
    },
  },
}
```

Note:

- `voice.tts` sovrascrive `messages.tts` solo per la riproduzione vocale.
- I turni di trascrizione vocale derivano lo stato di owner da Discord `allowFrom` (o `dm.allowFrom`); gli speaker non owner non possono accedere agli strumenti riservati all'owner (ad esempio `gateway` e `cron`).
- La voce è abilitata per impostazione predefinita; imposta `channels.discord.voice.enabled=false` per disabilitarla.
- `voice.daveEncryption` e `voice.decryptionFailureTolerance` vengono passati alle opzioni di join di `@discordjs/voice`.
- I valori predefiniti di `@discordjs/voice` sono `daveEncryption=true` e `decryptionFailureTolerance=24` se non impostati.
- OpenClaw monitora anche gli errori di decrittazione in ricezione e si ripristina automaticamente uscendo/rientrando nel canale vocale dopo errori ripetuti in una breve finestra temporale.
- Se i log di ricezione mostrano ripetutamente `DecryptionFailed(UnencryptedWhenPassthroughDisabled)`, potrebbe trattarsi del bug di ricezione upstream di `@discordjs/voice` tracciato in [discord.js #11419](https://github.com/discordjs/discord.js/issues/11419).

### Messaggi vocali

I messaggi vocali Discord mostrano un'anteprima waveform e richiedono audio OGG/Opus. OpenClaw genera automaticamente la waveform, ma richiede `ffmpeg` e `ffprobe` sull'host del gateway per ispezionare e convertire.

- Fornisci un **percorso di file locale** (gli URL vengono rifiutati).
- Ometti il contenuto di testo (Discord rifiuta testo + messaggio vocale nello stesso payload).
- Qualsiasi formato audio è accettato; OpenClaw converte in OGG/Opus se necessario.

```bash
message(action="send", channel="discord", target="channel:123", path="/path/to/audio.mp3", asVoice=true)
```

## Risoluzione dei problemi

<AccordionGroup>
  <Accordion title="Usati intent non consentiti oppure il bot non vede messaggi guild">

    - abilita Message Content Intent
    - abilita Server Members Intent quando dipendi dalla risoluzione utente/membro
    - riavvia il gateway dopo aver modificato gli intent

  </Accordion>

  <Accordion title="Messaggi guild bloccati in modo imprevisto">

    - verifica `groupPolicy`
    - verifica la allowlist della guild sotto `channels.discord.guilds`
    - se esiste la mappa `channels` della guild, sono consentiti solo i canali elencati
    - verifica il comportamento di `requireMention` e i pattern di menzione

    Controlli utili:

```bash
openclaw doctor
openclaw channels status --probe
openclaw logs --follow
```

  </Accordion>

  <Accordion title="Require mention impostato su false ma ancora bloccato">
    Cause comuni:

    - `groupPolicy="allowlist"` senza una allowlist guild/canale corrispondente
    - `requireMention` configurato nel posto sbagliato (deve essere sotto `channels.discord.guilds` o nella voce del canale)
    - mittente bloccato dalla allowlist `users` della guild/del canale

  </Accordion>

  <Accordion title="Gli handler a lunga esecuzione vanno in timeout o duplicano le risposte">

    Log tipici:

    - `Listener DiscordMessageListener timed out after 30000ms for event MESSAGE_CREATE`
    - `Slow listener detected ...`
    - `discord inbound worker timed out after ...`

    Parametro del budget del listener:

    - account singolo: `channels.discord.eventQueue.listenerTimeout`
    - multi-account: `channels.discord.accounts.<accountId>.eventQueue.listenerTimeout`

    Parametro del timeout di esecuzione del worker:

    - account singolo: `channels.discord.inboundWorker.runTimeoutMs`
    - multi-account: `channels.discord.accounts.<accountId>.inboundWorker.runTimeoutMs`
    - predefinito: `1800000` (30 minuti); imposta `0` per disabilitare

    Baseline consigliata:

```json5
{
  channels: {
    discord: {
      accounts: {
        default: {
          eventQueue: {
            listenerTimeout: 120000,
          },
          inboundWorker: {
            runTimeoutMs: 1800000,
          },
        },
      },
    },
  },
}
```

    Usa `eventQueue.listenerTimeout` per setup lenti del listener e `inboundWorker.runTimeoutMs`
    solo se vuoi una valvola di sicurezza separata per i turni agente in coda.

  </Accordion>

  <Accordion title="Mancate corrispondenze nell'audit dei permessi">
    I controlli dei permessi di `channels status --probe` funzionano solo per ID canale numerici.

    Se usi chiavi slug, la corrispondenza a runtime può comunque funzionare, ma il probe non può verificare completamente i permessi.

  </Accordion>

  <Accordion title="Problemi con DM e abbinamento">

    - DM disabilitati: `channels.discord.dm.enabled=false`
    - policy DM disabilitata: `channels.discord.dmPolicy="disabled"` (legacy: `channels.discord.dm.policy`)
    - in attesa di approvazione dell'abbinamento in modalità `pairing`

  </Accordion>

  <Accordion title="Loop bot-to-bot">
    Per impostazione predefinita, i messaggi creati dai bot vengono ignorati.

    Se imposti `channels.discord.allowBots=true`, usa regole rigide di menzione e allowlist per evitare comportamenti a loop.
    Preferisci `channels.discord.allowBots="mentions"` per accettare solo i messaggi dei bot che menzionano il bot.

  </Accordion>

  <Accordion title="La STT vocale perde dati con DecryptionFailed(...)">

    - mantieni OpenClaw aggiornato (`openclaw update`) così che sia presente la logica di recupero della ricezione vocale Discord
    - conferma `channels.discord.voice.daveEncryption=true` (predefinito)
    - parti da `channels.discord.voice.decryptionFailureTolerance=24` (predefinito upstream) e regola solo se necessario
    - osserva i log per:
      - `discord voice: DAVE decrypt failures detected`
      - `discord voice: repeated decrypt failures; attempting rejoin`
    - se i problemi continuano dopo il rejoin automatico, raccogli i log e confrontali con [discord.js #11419](https://github.com/discordjs/discord.js/issues/11419)

  </Accordion>
</AccordionGroup>

## Riferimenti alla configurazione

Riferimento principale:

- [Configuration reference - Discord](/it/gateway/configuration-reference#discord)

Campi Discord ad alto segnale:

- avvio/autenticazione: `enabled`, `token`, `accounts.*`, `allowBots`
- policy: `groupPolicy`, `dm.*`, `guilds.*`, `guilds.*.channels.*`
- comando: `commands.native`, `commands.useAccessGroups`, `configWrites`, `slashCommand.*`
- coda eventi: `eventQueue.listenerTimeout` (budget del listener), `eventQueue.maxQueueSize`, `eventQueue.maxConcurrency`
- worker inbound: `inboundWorker.runTimeoutMs`
- risposta/cronologia: `replyToMode`, `historyLimit`, `dmHistoryLimit`, `dms.*.historyLimit`
- consegna: `textChunkLimit`, `chunkMode`, `maxLinesPerMessage`
- streaming: `streaming` (alias legacy: `streamMode`), `streaming.preview.toolProgress`, `draftChunk`, `blockStreaming`, `blockStreamingCoalesce`
- media/retry: `mediaMaxMb`, `retry`
  - `mediaMaxMb` limita gli upload Discord in uscita (predefinito: `100MB`)
- azioni: `actions.*`
- presenza: `activity`, `status`, `activityType`, `activityUrl`
- UI: `ui.components.accentColor`
- funzionalità: `threadBindings`, `bindings[]` di livello superiore (`type: "acp"`), `pluralkit`, `execApprovals`, `intents`, `agentComponents`, `heartbeat`, `responsePrefix`

## Sicurezza e operazioni

- Tratta i token bot come segreti (`DISCORD_BOT_TOKEN` preferito negli ambienti supervisionati).
- Concedi i permessi Discord minimi necessari.
- Se il deploy/stato dei comandi è obsoleto, riavvia il gateway e ricontrolla con `openclaw channels status --probe`.

## Correlati

- [Pairing](/it/channels/pairing)
- [Groups](/it/channels/groups)
- [Channel routing](/it/channels/channel-routing)
- [Security](/it/gateway/security)
- [Multi-agent routing](/it/concepts/multi-agent)
- [Troubleshooting](/it/channels/troubleshooting)
- [Slash commands](/it/tools/slash-commands)
