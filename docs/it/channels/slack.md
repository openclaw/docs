---
read_when:
    - Configurazione di Slack o debug della modalità socket/HTTP di Slack
summary: Configurazione di Slack e comportamento di runtime (Socket Mode + HTTP Events API)
title: Slack
x-i18n:
    generated_at: "2026-04-05T13:46:31Z"
    model: gpt-5.4
    provider: openai
    source_hash: efb37e1f04e1ac8ac3786c36ffc20013dacdc654bfa61e7f6e8df89c4902d2ab
    source_path: channels/slack.md
    workflow: 15
---

# Slack

Stato: pronto per la produzione per DM + canali tramite integrazioni dell'app Slack. La modalità predefinita è Socket Mode; è supportata anche la modalità HTTP Events API.

<CardGroup cols={3}>
  <Card title="Abbinamento" icon="link" href="/it/channels/pairing">
    Le DM di Slack usano per impostazione predefinita la modalità di abbinamento.
  </Card>
  <Card title="Comandi slash" icon="terminal" href="/tools/slash-commands">
    Comportamento nativo dei comandi e catalogo dei comandi.
  </Card>
  <Card title="Risoluzione dei problemi del canale" icon="wrench" href="/channels/troubleshooting">
    Diagnostica tra canali e procedure di riparazione.
  </Card>
</CardGroup>

## Configurazione rapida

<Tabs>
  <Tab title="Socket Mode (predefinita)">
    <Steps>
      <Step title="Crea l'app Slack e i token">
        Nelle impostazioni dell'app Slack:

        - abilita **Socket Mode**
        - crea **App Token** (`xapp-...`) con `connections:write`
        - installa l'app e copia **Bot Token** (`xoxb-...`)
      </Step>

      <Step title="Configura OpenClaw">

```json5
{
  channels: {
    slack: {
      enabled: true,
      mode: "socket",
      appToken: "xapp-...",
      botToken: "xoxb-...",
    },
  },
}
```

        Fallback env (solo account predefinito):

```bash
SLACK_APP_TOKEN=xapp-...
SLACK_BOT_TOKEN=xoxb-...
```

      </Step>

      <Step title="Iscriviti agli eventi dell'app">
        Iscrivi gli eventi bot per:

        - `app_mention`
        - `message.channels`, `message.groups`, `message.im`, `message.mpim`
        - `reaction_added`, `reaction_removed`
        - `member_joined_channel`, `member_left_channel`
        - `channel_rename`
        - `pin_added`, `pin_removed`

        Abilita anche App Home **Messages Tab** per le DM.
      </Step>

      <Step title="Avvia il gateway">

```bash
openclaw gateway
```

      </Step>
    </Steps>

  </Tab>

  <Tab title="Modalità HTTP Events API">
    <Steps>
      <Step title="Configura l'app Slack per HTTP">

        - imposta la modalità su HTTP (`channels.slack.mode="http"`)
        - copia il **Signing Secret** di Slack
        - imposta l'URL di richiesta di Event Subscriptions + Interactivity + comando Slash sullo stesso percorso webhook (predefinito `/slack/events`)

      </Step>

      <Step title="Configura la modalità HTTP di OpenClaw">

```json5
{
  channels: {
    slack: {
      enabled: true,
      mode: "http",
      botToken: "xoxb-...",
      signingSecret: "your-signing-secret",
      webhookPath: "/slack/events",
    },
  },
}
```

      </Step>

      <Step title="Usa percorsi webhook univoci per HTTP multi-account">
        La modalità HTTP per account è supportata.

        Assegna a ciascun account un `webhookPath` distinto in modo che le registrazioni non entrino in conflitto.
      </Step>
    </Steps>

  </Tab>
</Tabs>

## Checklist del manifest e degli scope

<AccordionGroup>
  <Accordion title="Esempio di manifest dell'app Slack" defaultOpen>

```json
{
  "display_information": {
    "name": "OpenClaw",
    "description": "Slack connector for OpenClaw"
  },
  "features": {
    "bot_user": {
      "display_name": "OpenClaw",
      "always_online": true
    },
    "app_home": {
      "messages_tab_enabled": true,
      "messages_tab_read_only_enabled": false
    },
    "slash_commands": [
      {
        "command": "/openclaw",
        "description": "Send a message to OpenClaw",
        "should_escape": false
      }
    ]
  },
  "oauth_config": {
    "scopes": {
      "bot": [
        "app_mentions:read",
        "assistant:write",
        "channels:history",
        "channels:read",
        "chat:write",
        "commands",
        "emoji:read",
        "files:read",
        "files:write",
        "groups:history",
        "groups:read",
        "im:history",
        "im:read",
        "im:write",
        "mpim:history",
        "mpim:read",
        "mpim:write",
        "pins:read",
        "pins:write",
        "reactions:read",
        "reactions:write",
        "users:read"
      ]
    }
  },
  "settings": {
    "socket_mode_enabled": true,
    "event_subscriptions": {
      "bot_events": [
        "app_mention",
        "channel_rename",
        "member_joined_channel",
        "member_left_channel",
        "message.channels",
        "message.groups",
        "message.im",
        "message.mpim",
        "pin_added",
        "pin_removed",
        "reaction_added",
        "reaction_removed"
      ]
    }
  }
}
```

  </Accordion>

  <Accordion title="Scope facoltativi del token utente (operazioni di lettura)">
    Se configuri `channels.slack.userToken`, gli scope di lettura tipici sono:

    - `channels:history`, `groups:history`, `im:history`, `mpim:history`
    - `channels:read`, `groups:read`, `im:read`, `mpim:read`
    - `users:read`
    - `reactions:read`
    - `pins:read`
    - `emoji:read`
    - `search:read` (se dipendi dalle letture della ricerca Slack)

  </Accordion>
</AccordionGroup>

## Modello dei token

- `botToken` + `appToken` sono richiesti per Socket Mode.
- La modalità HTTP richiede `botToken` + `signingSecret`.
- `botToken`, `appToken`, `signingSecret` e `userToken` accettano stringhe in chiaro
  o oggetti SecretRef.
- I token di configurazione hanno la precedenza sul fallback env.
- Il fallback env `SLACK_BOT_TOKEN` / `SLACK_APP_TOKEN` si applica solo all'account predefinito.
- `userToken` (`xoxp-...`) è solo di configurazione (nessun fallback env) e usa per impostazione predefinita il comportamento di sola lettura (`userTokenReadOnly: true`).
- Facoltativo: aggiungi `chat:write.customize` se vuoi che i messaggi in uscita usino l'identità dell'agente attivo (campi `username` e icona personalizzati). `icon_emoji` usa la sintassi `:emoji_name:`.

Comportamento dell'istantanea di stato:

- L'ispezione dell'account Slack tiene traccia dei campi `*Source` e `*Status`
  per credenziale (`botToken`, `appToken`, `signingSecret`, `userToken`).
- Lo stato è `available`, `configured_unavailable` o `missing`.
- `configured_unavailable` significa che l'account è configurato tramite SecretRef
  o un'altra origine di segreti non inline, ma il percorso di comando/runtime
  corrente non ha potuto risolvere il valore effettivo.
- In modalità HTTP, è incluso `signingSecretStatus`; in Socket Mode, la
  coppia richiesta è `botTokenStatus` + `appTokenStatus`.

<Tip>
Per azioni/letture di directory, il token utente può essere preferito quando configurato. Per le scritture, il token bot rimane preferito; le scritture con token utente sono consentite solo quando `userTokenReadOnly: false` e il token bot non è disponibile.
</Tip>

## Azioni e controlli

Le azioni Slack sono controllate da `channels.slack.actions.*`.

Gruppi di azioni disponibili negli strumenti Slack correnti:

| Gruppo     | Predefinito |
| ---------- | ----------- |
| messages   | abilitato |
| reactions  | abilitato |
| pins       | abilitato |
| memberInfo | abilitato |
| emojiList  | abilitato |

Le azioni correnti dei messaggi Slack includono `send`, `upload-file`, `download-file`, `read`, `edit`, `delete`, `pin`, `unpin`, `list-pins`, `member-info` ed `emoji-list`.

## Controllo degli accessi e instradamento

<Tabs>
  <Tab title="Criteri DM">
    `channels.slack.dmPolicy` controlla l'accesso alle DM (legacy: `channels.slack.dm.policy`):

    - `pairing` (predefinito)
    - `allowlist`
    - `open` (richiede che `channels.slack.allowFrom` includa `"*"`; legacy: `channels.slack.dm.allowFrom`)
    - `disabled`

    Flag DM:

    - `dm.enabled` (predefinito true)
    - `channels.slack.allowFrom` (preferito)
    - `dm.allowFrom` (legacy)
    - `dm.groupEnabled` (DM di gruppo predefinite su false)
    - `dm.groupChannels` (allowlist MPIM facoltativa)

    Precedenza multi-account:

    - `channels.slack.accounts.default.allowFrom` si applica solo all'account `default`.
    - Gli account con nome ereditano `channels.slack.allowFrom` quando il proprio `allowFrom` non è impostato.
    - Gli account con nome non ereditano `channels.slack.accounts.default.allowFrom`.

    L'abbinamento nelle DM usa `openclaw pairing approve slack <code>`.

  </Tab>

  <Tab title="Criteri canale">
    `channels.slack.groupPolicy` controlla la gestione dei canali:

    - `open`
    - `allowlist`
    - `disabled`

    L'allowlist dei canali si trova sotto `channels.slack.channels` e dovrebbe usare ID canale stabili.

    Nota di runtime: se `channels.slack` è completamente assente (configurazione solo env), il runtime usa `groupPolicy="allowlist"` e registra un avviso (anche se `channels.defaults.groupPolicy` è impostato).

    Risoluzione nome/ID:

    - le voci dell'allowlist dei canali e dell'allowlist DM vengono risolte all'avvio quando l'accesso al token lo consente
    - le voci irrisolte del nome canale vengono mantenute come configurate ma ignorate per l'instradamento per impostazione predefinita
    - l'autorizzazione in ingresso e l'instradamento dei canali usano per impostazione predefinita prima gli ID; la corrispondenza diretta di username/slug richiede `channels.slack.dangerouslyAllowNameMatching: true`

  </Tab>

  <Tab title="Menzioni e utenti del canale">
    I messaggi del canale sono limitati dalle menzioni per impostazione predefinita.

    Origini delle menzioni:

    - menzione esplicita dell'app (`<@botId>`)
    - pattern regex di menzione (`agents.list[].groupChat.mentionPatterns`, fallback `messages.groupChat.mentionPatterns`)
    - comportamento implicito di risposta in thread al bot

    Controlli per canale (`channels.slack.channels.<id>`; nomi solo tramite risoluzione all'avvio o `dangerouslyAllowNameMatching`):

    - `requireMention`
    - `users` (allowlist)
    - `allowBots`
    - `skills`
    - `systemPrompt`
    - `tools`, `toolsBySender`
    - formato della chiave `toolsBySender`: `id:`, `e164:`, `username:`, `name:` o wildcard `"*"`
      (le chiavi legacy senza prefisso continuano a essere mappate solo a `id:`)

  </Tab>
</Tabs>

## Threading, sessioni e tag di risposta

- Le DM vengono instradate come `direct`; i canali come `channel`; gli MPIM come `group`.
- Con il valore predefinito `session.dmScope=main`, le DM di Slack confluiscono nella sessione principale dell'agente.
- Sessioni canale: `agent:<agentId>:slack:channel:<channelId>`.
- Le risposte nei thread possono creare suffissi di sessione del thread (`:thread:<threadTs>`) quando applicabile.
- Il valore predefinito di `channels.slack.thread.historyScope` è `thread`; il valore predefinito di `thread.inheritParent` è `false`.
- `channels.slack.thread.initialHistoryLimit` controlla quanti messaggi esistenti del thread vengono recuperati quando inizia una nuova sessione thread (predefinito `20`; imposta `0` per disabilitare).

Controlli del threading delle risposte:

- `channels.slack.replyToMode`: `off|first|all` (predefinito `off`)
- `channels.slack.replyToModeByChatType`: per `direct|group|channel`
- fallback legacy per chat dirette: `channels.slack.dm.replyToMode`

Sono supportati tag di risposta manuali:

- `[[reply_to_current]]`
- `[[reply_to:<id>]]`

Nota: `replyToMode="off"` disabilita **tutto** il threading delle risposte in Slack, inclusi i tag espliciti `[[reply_to_*]]`. Questo è diverso da Telegram, dove i tag espliciti vengono comunque rispettati in modalità `"off"`. La differenza riflette i modelli di threading delle piattaforme: i thread di Slack nascondono i messaggi dal canale, mentre le risposte di Telegram restano visibili nel flusso principale della chat.

## Reazioni di conferma

`ackReaction` invia un'emoji di conferma mentre OpenClaw elabora un messaggio in ingresso.

Ordine di risoluzione:

- `channels.slack.accounts.<accountId>.ackReaction`
- `channels.slack.ackReaction`
- `messages.ackReaction`
- fallback all'emoji dell'identità dell'agente (`agents.list[].identity.emoji`, altrimenti "👀")

Note:

- Slack si aspetta shortcode (ad esempio `"eyes"`).
- Usa `""` per disabilitare la reazione per l'account Slack o globalmente.

## Streaming del testo

`channels.slack.streaming` controlla il comportamento dell'anteprima live:

- `off`: disabilita lo streaming dell'anteprima live.
- `partial` (predefinito): sostituisce il testo di anteprima con l'output parziale più recente.
- `block`: aggiunge aggiornamenti di anteprima in blocchi.
- `progress`: mostra un testo di stato di avanzamento durante la generazione, quindi invia il testo finale.

`channels.slack.nativeStreaming` controlla lo streaming di testo nativo di Slack quando `streaming` è `partial` (predefinito: `true`).

- Perché lo streaming di testo nativo venga visualizzato, deve essere disponibile un thread di risposta. La selezione del thread continua comunque a seguire `replyToMode`. Senza di esso, viene usata la normale anteprima bozza.
- I contenuti multimediali e i payload non testuali tornano alla consegna normale.
- Se lo streaming fallisce a metà risposta, OpenClaw torna alla consegna normale per i payload rimanenti.

Usa l'anteprima bozza invece dello streaming di testo nativo di Slack:

```json5
{
  channels: {
    slack: {
      streaming: "partial",
      nativeStreaming: false,
    },
  },
}
```

Chiavi legacy:

- `channels.slack.streamMode` (`replace | status_final | append`) viene migrato automaticamente a `channels.slack.streaming`.
- il booleano `channels.slack.streaming` viene migrato automaticamente a `channels.slack.nativeStreaming`.

## Fallback della reazione di digitazione

`typingReaction` aggiunge una reazione temporanea al messaggio Slack in ingresso mentre OpenClaw elabora una risposta, quindi la rimuove quando l'esecuzione termina. Questo è particolarmente utile al di fuori delle risposte nei thread, che usano un indicatore di stato predefinito "sta scrivendo...".

Ordine di risoluzione:

- `channels.slack.accounts.<accountId>.typingReaction`
- `channels.slack.typingReaction`

Note:

- Slack si aspetta shortcode (ad esempio `"hourglass_flowing_sand"`).
- La reazione è best-effort e la pulizia viene tentata automaticamente dopo la risposta o dopo il completamento del percorso di errore.

## Media, suddivisione e consegna

<AccordionGroup>
  <Accordion title="Allegati in ingresso">
    Gli allegati dei file Slack vengono scaricati da URL privati ospitati da Slack (flusso di richiesta autenticato tramite token) e scritti nell'archivio media quando il recupero riesce e i limiti di dimensione lo consentono.

    Il limite di dimensione in ingresso in runtime è per impostazione predefinita `20MB`, a meno che non venga sostituito da `channels.slack.mediaMaxMb`.

  </Accordion>

  <Accordion title="Testo e file in uscita">
    - i blocchi di testo usano `channels.slack.textChunkLimit` (predefinito 4000)
    - `channels.slack.chunkMode="newline"` abilita la suddivisione con priorità ai paragrafi
    - gli invii di file usano le API di upload di Slack e possono includere risposte in thread (`thread_ts`)
    - il limite dei media in uscita segue `channels.slack.mediaMaxMb` quando configurato; altrimenti gli invii del canale usano i valori predefiniti del tipo MIME dalla pipeline media
  </Accordion>

  <Accordion title="Destinazioni di consegna">
    Destinazioni esplicite preferite:

    - `user:<id>` per le DM
    - `channel:<id>` per i canali

    Le DM di Slack vengono aperte tramite le API di conversazione di Slack quando si invia a destinazioni utente.

  </Accordion>
</AccordionGroup>

## Comandi e comportamento slash

- La modalità automatica dei comandi nativi è **disattivata** per Slack (`commands.native: "auto"` non abilita i comandi nativi di Slack).
- Abilita gli handler dei comandi Slack nativi con `channels.slack.commands.native: true` (o globale `commands.native: true`).
- Quando i comandi nativi sono abilitati, registra i comandi slash corrispondenti in Slack (nomi `/<command>`), con un'eccezione:
  - registra `/agentstatus` per il comando di stato (Slack riserva `/status`)
- Se i comandi nativi non sono abilitati, puoi eseguire un singolo comando slash configurato tramite `channels.slack.slashCommand`.
- I menu argomenti nativi ora adattano la propria strategia di rendering:
  - fino a 5 opzioni: blocchi di pulsanti
  - 6-100 opzioni: menu di selezione statico
  - più di 100 opzioni: selezione esterna con filtro asincrono delle opzioni quando sono disponibili gli handler delle opzioni di interattività
  - se i valori delle opzioni codificati superano i limiti di Slack, il flusso torna ai pulsanti
- Per payload di opzioni lunghi, i menu degli argomenti dei comandi slash usano una finestra di conferma prima di inviare un valore selezionato.

Impostazioni predefinite del comando slash:

- `enabled: false`
- `name: "openclaw"`
- `sessionPrefix: "slack:slash"`
- `ephemeral: true`

Le sessioni slash usano chiavi isolate:

- `agent:<agentId>:slack:slash:<userId>`

e continuano comunque a instradare l'esecuzione del comando rispetto alla sessione della conversazione di destinazione (`CommandTargetSessionKey`).

## Risposte interattive

Slack può visualizzare controlli di risposta interattivi creati dall'agente, ma questa funzionalità è disabilitata per impostazione predefinita.

Abilitala globalmente:

```json5
{
  channels: {
    slack: {
      capabilities: {
        interactiveReplies: true,
      },
    },
  },
}
```

Oppure abilitala solo per un account Slack:

```json5
{
  channels: {
    slack: {
      accounts: {
        ops: {
          capabilities: {
            interactiveReplies: true,
          },
        },
      },
    },
  },
}
```

Quando è abilitata, gli agenti possono emettere direttive di risposta solo per Slack:

- `[[slack_buttons: Approve:approve, Reject:reject]]`
- `[[slack_select: Choose a target | Canary:canary, Production:production]]`

Queste direttive vengono compilate in Slack Block Kit e instradano clic o selezioni attraverso il percorso esistente degli eventi di interazione Slack.

Note:

- Questa è un'interfaccia specifica di Slack. Gli altri canali non traducono le direttive Slack Block Kit nei propri sistemi di pulsanti.
- I valori di callback interattivi sono token opachi generati da OpenClaw, non valori grezzi creati dall'agente.
- Se i blocchi interattivi generati superano i limiti di Slack Block Kit, OpenClaw torna alla risposta testuale originale invece di inviare un payload blocks non valido.

## Approvazioni exec in Slack

Slack può agire come client di approvazione nativo con pulsanti e interazioni interattive, invece di tornare alla Web UI o al terminale.

- Le approvazioni exec usano `channels.slack.execApprovals.*` per l'instradamento nativo DM/canale.
- Le approvazioni dei plugin possono comunque essere risolte tramite la stessa superficie di pulsanti nativa di Slack quando la richiesta arriva già in Slack e il tipo di id approvazione è `plugin:`.
- L'autorizzazione degli approvatori continua a essere applicata: solo gli utenti identificati come approvatori possono approvare o negare richieste tramite Slack.

Questo usa la stessa superficie condivisa di pulsanti di approvazione degli altri canali. Quando `interactivity` è abilitato nelle impostazioni della tua app Slack, i prompt di approvazione vengono visualizzati come pulsanti Block Kit direttamente nella conversazione.
Quando questi pulsanti sono presenti, rappresentano l'esperienza utente primaria per l'approvazione; OpenClaw
dovrebbe includere un comando manuale `/approve` solo quando il risultato dello strumento indica che le
approvazioni in chat non sono disponibili o che l'approvazione manuale è l'unico percorso.

Percorso di configurazione:

- `channels.slack.execApprovals.enabled`
- `channels.slack.execApprovals.approvers` (facoltativo; usa `commands.ownerAllowFrom` come fallback quando possibile)
- `channels.slack.execApprovals.target` (`dm` | `channel` | `both`, predefinito: `dm`)
- `agentFilter`, `sessionFilter`

Slack abilita automaticamente le approvazioni exec native quando `enabled` non è impostato o è `"auto"` e viene risolto almeno un
approvatore. Imposta `enabled: false` per disabilitare esplicitamente Slack come client di approvazione nativo.
Imposta `enabled: true` per forzare le approvazioni native quando gli approvatori vengono risolti.

Comportamento predefinito senza configurazione esplicita delle approvazioni exec di Slack:

```json5
{
  commands: {
    ownerAllowFrom: ["slack:U12345678"],
  },
}
```

La configurazione esplicita nativa di Slack è necessaria solo quando vuoi sostituire gli approvatori, aggiungere filtri o
scegliere la consegna nella chat di origine:

```json5
{
  channels: {
    slack: {
      execApprovals: {
        enabled: true,
        approvers: ["U12345678"],
        target: "both",
      },
    },
  },
}
```

L'inoltro condiviso `approvals.exec` è separato. Usalo solo quando i prompt di approvazione exec devono anche
essere instradati ad altre chat o a destinazioni esplicite fuori banda. Anche l'inoltro condiviso `approvals.plugin` è
separato; i pulsanti nativi di Slack possono comunque risolvere le approvazioni dei plugin quando tali richieste arrivano già
in Slack.

Lo stesso `/approve` nella stessa chat funziona anche nei canali e nelle DM di Slack che supportano già i comandi. Vedi [Approvazioni exec](/tools/exec-approvals) per il modello completo di inoltro delle approvazioni.

## Eventi e comportamento operativo

- Le modifiche/eliminazioni dei messaggi e le trasmissioni di thread vengono mappate in eventi di sistema.
- Gli eventi di aggiunta/rimozione delle reazioni vengono mappati in eventi di sistema.
- Gli eventi di entrata/uscita dei membri, creazione/rinomina del canale e aggiunta/rimozione dei pin vengono mappati in eventi di sistema.
- `channel_id_changed` può migrare le chiavi di configurazione del canale quando `configWrites` è abilitato.
- I metadati di topic/purpose del canale vengono trattati come contesto non attendibile e possono essere iniettati nel contesto di instradamento.
- Il thread starter e il seeding iniziale del contesto della cronologia del thread vengono filtrati dalle allowlist dei mittenti configurate quando applicabile.
- Le azioni dei blocchi e le interazioni modali emettono eventi di sistema strutturati `Slack interaction: ...` con campi payload avanzati:
  - azioni dei blocchi: valori selezionati, etichette, valori dei selettori e metadati `workflow_*`
  - eventi modali `view_submission` e `view_closed` con metadati del canale instradati e input del modulo

## Riferimenti alla configurazione

Riferimento principale:

- [Riferimento della configurazione - Slack](/gateway/configuration-reference#slack)

  Campi Slack ad alto segnale:
  - modalità/autenticazione: `mode`, `botToken`, `appToken`, `signingSecret`, `webhookPath`, `accounts.*`
  - accesso DM: `dm.enabled`, `dmPolicy`, `allowFrom` (legacy: `dm.policy`, `dm.allowFrom`), `dm.groupEnabled`, `dm.groupChannels`
  - interruttore di compatibilità: `dangerouslyAllowNameMatching` (solo emergenza; tienilo disattivato se non necessario)
  - accesso ai canali: `groupPolicy`, `channels.*`, `channels.*.users`, `channels.*.requireMention`
  - threading/cronologia: `replyToMode`, `replyToModeByChatType`, `thread.*`, `historyLimit`, `dmHistoryLimit`, `dms.*.historyLimit`
  - consegna: `textChunkLimit`, `chunkMode`, `mediaMaxMb`, `streaming`, `nativeStreaming`
  - operazioni/funzionalità: `configWrites`, `commands.native`, `slashCommand.*`, `actions.*`, `userToken`, `userTokenReadOnly`

## Risoluzione dei problemi

<AccordionGroup>
  <Accordion title="Nessuna risposta nei canali">
    Controlla, nell'ordine:

    - `groupPolicy`
    - allowlist dei canali (`channels.slack.channels`)
    - `requireMention`
    - allowlist `users` per canale

    Comandi utili:

```bash
openclaw channels status --probe
openclaw logs --follow
openclaw doctor
```

  </Accordion>

  <Accordion title="Messaggi DM ignorati">
    Controlla:

    - `channels.slack.dm.enabled`
    - `channels.slack.dmPolicy` (o legacy `channels.slack.dm.policy`)
    - approvazioni di abbinamento / voci allowlist

```bash
openclaw pairing list slack
```

  </Accordion>

  <Accordion title="La modalità socket non si connette">
    Convalida i token bot + app e l'abilitazione di Socket Mode nelle impostazioni dell'app Slack.

    Se `openclaw channels status --probe --json` mostra `botTokenStatus` o
    `appTokenStatus: "configured_unavailable"`, l'account Slack è
    configurato ma il runtime corrente non ha potuto risolvere il valore
    supportato da SecretRef.

  </Accordion>

  <Accordion title="La modalità HTTP non riceve eventi">
    Convalida:

    - signing secret
    - percorso webhook
    - URL di richiesta Slack (Events + Interactivity + Slash Commands)
    - `webhookPath` univoco per ogni account HTTP

    Se `signingSecretStatus: "configured_unavailable"` appare nelle
    istantanee dell'account, l'account HTTP è configurato ma il runtime corrente non ha potuto
    risolvere il signing secret supportato da SecretRef.

  </Accordion>

  <Accordion title="I comandi nativi/slash non si attivano">
    Verifica se intendevi usare:

    - modalità comandi nativi (`channels.slack.commands.native: true`) con i corrispondenti comandi slash registrati in Slack
    - oppure modalità comando slash singolo (`channels.slack.slashCommand.enabled: true`)

    Controlla anche `commands.useAccessGroups` e le allowlist di canali/utenti.

  </Accordion>
</AccordionGroup>

## Correlati

- [Abbinamento](/it/channels/pairing)
- [Gruppi](/it/channels/groups)
- [Sicurezza](/gateway/security)
- [Instradamento dei canali](/it/channels/channel-routing)
- [Risoluzione dei problemi](/channels/troubleshooting)
- [Configurazione](/gateway/configuration)
- [Comandi slash](/tools/slash-commands)
