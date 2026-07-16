---
read_when:
    - Si desidera connettere OpenClaw a QQ
    - È necessario configurare le credenziali del bot QQ
    - Si desidera il supporto per chat di gruppo o private con QQ Bot
summary: Configurazione, impostazioni e utilizzo di QQ Bot
title: bot QQ
x-i18n:
    generated_at: "2026-07-16T13:52:35Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 71b0909e28e28d7f88e93b6f022f9aa2a4421d1381bb1ab4b706f381585ba476
    source_path: channels/qqbot.md
    workflow: 16
---

QQ Bot si connette a OpenClaw tramite l'API ufficiale di QQ Bot (Gateway WebSocket).
La chat privata C2C e le menzioni `@` nei gruppi sono i principali tipi di chat, con contenuti
multimediali avanzati (immagini, voce, video, file). I messaggi nei canali delle gilde sono supportati solo per
testo e immagini da URL remoti; voce, video, caricamenti di file e immagini
locali/Base64 non sono disponibili nei canali delle gilde. Reazioni e thread non sono
supportati in alcun contesto.

Stato: plugin ufficiale scaricabile.

## Installazione

```bash
openclaw plugins install @openclaw/qqbot
```

## Configurazione iniziale

1. Accedere alla [Piattaforma aperta QQ](https://q.qq.com/) e scansionare il codice QR con QQ sul
   telefono per registrarsi o accedere.
2. Fare clic su **Create Bot** per creare un nuovo bot QQ.
3. Individuare **AppID** e **AppSecret** nella pagina delle impostazioni del bot e copiarli.

<Note>
AppSecret non viene archiviato in testo non crittografato. Se si lascia la pagina senza salvarlo, sarà necessario generarne uno nuovo.
</Note>

4. Aggiungere il canale:

```bash
openclaw channels add --channel qqbot --token "AppID:AppSecret"
```

5. Riavviare il Gateway.

Configurazione interattiva:

```bash
openclaw channels add
```

La procedura guidata offre anche l'associazione tramite codice QR come alternativa all'inserimento manuale
di AppID/AppSecret: scansionare il codice con l'app per telefono associata al QQ Bot di destinazione per completare
l'associazione. OpenClaw conserva le credenziali restituite nell'ambito di configurazione
dell'account.

## Configurazione

Configurazione minima:

```json5
{
  channels: {
    qqbot: {
      enabled: true,
      appId: "YOUR_APP_ID",
      clientSecret: "YOUR_APP_SECRET",
    },
  },
}
```

Variabili di ambiente dell'account predefinito (solo account di primo livello):

- `QQBOT_APP_ID`
- `QQBOT_CLIENT_SECRET`

AppSecret basato su file:

```json5
{
  channels: {
    qqbot: {
      enabled: true,
      appId: "YOUR_APP_ID",
      clientSecretFile: "/path/to/qqbot-secret.txt",
    },
  },
}
```

AppSecret SecretRef da variabile di ambiente:

```json5
{
  channels: {
    qqbot: {
      enabled: true,
      appId: "YOUR_APP_ID",
      clientSecret: { source: "env", provider: "default", id: "QQBOT_CLIENT_SECRET" },
    },
  },
}
```

Note:

- `openclaw channels add --channel qqbot --token-file ...` imposta solo AppSecret;
  `appId` deve essere già impostato nella configurazione o in `QQBOT_APP_ID`.
- `clientSecret` accetta una stringa di testo non crittografato, un percorso di file (`clientSecretFile`)
  o un oggetto SecretRef strutturato.
- Le stringhe marcatore legacy `secretref:...` / `secretref-env:...` vengono rifiutate per
  `clientSecret`; utilizzare invece un oggetto SecretRef strutturato.

### Streaming

```json5
{
  channels: {
    qqbot: {
      streaming: {
        mode: "partial", // streaming a blocchi: "partial" (predefinito) oppure "off"
        nativeTransport: true, // usa l'API C2C stream_messages ufficiale di QQ per i messaggi diretti
      },
    },
  },
}
```

- `streaming.mode: "off"` disabilita lo streaming a blocchi per l'account.
- `streaming.nativeTransport: true` trasmette in streaming le risposte C2C (messaggi diretti) tramite
  l'API ufficiale `stream_messages` di QQ; le destinazioni di gruppo/canale non sono interessate.
- I valori scalari legacy `streaming: true|false` e la chiave `streaming.c2cStreamApi`
  vengono migrati a questa struttura tramite `openclaw doctor --fix`.
- `/bot-streaming on|off` attiva o disattiva la stessa configurazione da un messaggio diretto.

### Criteri di accesso

- `allowFrom` / `groupAllowFrom` determinano chi può comunicare con il bot nei contesti C2C /
  di gruppo. `dmPolicy` / `groupPolicy` (`open` | `allowlist` | `disabled`)
  controllano la modalità di applicazione. `dmPolicy` assume come valore predefinito `allowlist` quando
  `allowFrom` contiene una voce concreta (non jolly), altrimenti `open`.
  `groupPolicy` assume come valore predefinito `allowlist` quando `groupAllowFrom` o
  `allowFrom` contiene una voce concreta, altrimenti `open`.
- I comandi slash "Auth: allowlist" richiedono una voce esplicita non jolly in
  `allowFrom` (o in `groupAllowFrom` per le invocazioni di gruppo), indipendentemente da
  `dmPolicy` / `groupPolicy`; vedere [Comandi slash](#slash-commands).

### Configurazione con più account

Eseguire più bot QQ in un'unica istanza OpenClaw:

```json5
{
  channels: {
    qqbot: {
      enabled: true,
      appId: "111111111",
      clientSecret: "secret-of-bot-1",
      accounts: {
        bot2: {
          enabled: true,
          appId: "222222222",
          clientSecret: "secret-of-bot-2",
        },
      },
    },
  },
}
```

Ogni account dispone di una connessione WebSocket, un client API e una cache dei token
isolati, identificati da `appId`. Le righe di log sono contrassegnate con l'ID dell'account proprietario, affinché
la diagnostica resti separabile quando si eseguono più bot in un solo Gateway.

Aggiungere un secondo bot tramite CLI:

```bash
openclaw channels add --channel qqbot --account bot2 --token "222222222:secret-of-bot-2"
```

### Chat di gruppo

Il supporto dei gruppi utilizza gli OpenID dei gruppi QQ, non i nomi visualizzati. Aggiungere il bot a un
gruppo, quindi menzionarlo oppure configurare il gruppo affinché funzioni senza menzione.

```json5
{
  channels: {
    qqbot: {
      groupPolicy: "allowlist",
      groupAllowFrom: ["member_openid"],
      groups: {
        "*": {
          requireMention: true,
          commandLevel: "all",
          historyLimit: 50,
          tools: { deny: ["exec", "read", "write"] },
        },
        GROUP_OPENID: {
          name: "Release room",
          requireMention: false,
          ignoreOtherMentions: true,
          commandLevel: "safety",
          historyLimit: 20,
          prompt: "Keep replies short and operational.",
        },
      },
    },
  },
}
```

`groups["*"]` imposta i valori predefiniti per ogni gruppo; una voce `groups.GROUP_OPENID`
concreta sostituisce tali valori predefiniti per un gruppo. Impostazioni dei gruppi:

| Campo                 | Predefinito          | Descrizione                                                                                        |
| --------------------- | ---------------- | -------------------------------------------------------------------------------------------------- |
| `requireMention`      | `true`           | Richiede una menzione `@` prima che il bot risponda.                                                     |
| `commandLevel`        | `all`            | Quali comandi slash integrati possono essere eseguiti nel gruppo (vedere di seguito).                                    |
| `ignoreOtherMentions` | `false`          | Ignora i messaggi che menzionano qualcun altro ma non il bot.                                           |
| `historyLimit`        | `50`             | Messaggi recenti senza menzione conservati come contesto per il turno successivo con menzione. `0` disabilita la cronologia.     |
| `tools`               | —                | Consente/nega gli strumenti per l'intero gruppo.                                                              |
| `toolsBySender`       | —                | Sostituzioni degli strumenti per mittente; vedere [Gruppi](/it/channels/groups#groupchannel-tool-restrictions-optional). |
| `name`                | prefisso openid    | Etichetta descrittiva utilizzata nei log e nel contesto del gruppo.                                                     |
| `prompt`              | valore predefinito integrato | Prompt di comportamento per gruppo aggiunto al contesto dell'agente.                                           |

`commandLevel` accetta:

| Livello    | Comportamento                                                                                                                                      |
| -------- | --------------------------------------------------------------------------------------------------------------------------------------------- |
| `all`    | I comandi integrati esistenti restano disponibili. Alcuni rimangono nascosti nei menu, ma gli utenti autorizzati possono comunque eseguirli nel gruppo.                  |
| `safety` | `/help`, `/btw`, `/stop` restano visibili nel gruppo; i comandi sensibili (`/config`, `/tools`, `/bash` e così via) devono essere eseguiti in una chat privata.      |
| `strict` | Sono consentiti solo i controlli della sessione di gruppo necessari per un funzionamento rigoroso. `/stop` continua a funzionare affinché un mittente autorizzato possa interrompere un'esecuzione attiva. |

Le vecchie voci QQBot `toolPolicy` sono state ritirate. Eseguire `openclaw doctor --fix` per migrarle a `tools`.

Le modalità di attivazione sono `mention` e `always`. `requireMention: true` corrisponde a
`mention`; `requireMention: false` corrisponde a `always`. Un'eventuale sostituzione dell'attivazione
a livello di sessione prevale sulla configurazione.

La coda in ingresso è specifica per ciascun interlocutore. Gli interlocutori di gruppo dispongono di un limite di coda maggiore (50 rispetto a 20
per gli interlocutori diretti); quando la coda è piena, i messaggi creati dal bot vengono rimossi prima di quelli degli utenti
e le sequenze di normali messaggi di gruppo vengono unite in un unico turno con attribuzione. I comandi
slash vengono eseguiti uno alla volta, indipendentemente da qualsiasi batch unito.

### Voce (STT / TTS)

STT e TTS supportano una configurazione a due livelli con fallback prioritario:

| Impostazione | Specifica del plugin                                          | Fallback del framework            |
| ------- | -------------------------------------------------------- | ----------------------------- |
| STT     | `channels.qqbot.stt`                                     | `tools.media.audio.models[0]` |
| TTS     | `channels.qqbot.tts`, `channels.qqbot.accounts.<id>.tts` | `messages.tts`                |

```json5
{
  channels: {
    qqbot: {
      stt: {
        provider: "your-provider",
        model: "your-stt-model",
      },
      tts: {
        provider: "your-provider",
        model: "your-tts-model",
        voice: "your-voice",
      },
      accounts: {
        "qq-main": {
          tts: {
            providers: {
              openai: { voice: "shimmer" },
            },
          },
        },
      },
    },
  },
}
```

Impostare `enabled: false` su uno dei due per disabilitarlo. Le sostituzioni TTS a livello di account utilizzano la
stessa struttura di `messages.tts` e vengono unite in profondità alla configurazione TTS del canale/globale.

Per impostazione predefinita, le richieste STT scadono dopo 60 secondi. Lo STT specifico del plugin utilizza la
sostituzione `models.providers.<id>.timeoutSeconds` selezionata. Lo STT audio del framework
utilizza `tools.media.audio.models[0].timeoutSeconds`, quindi
`tools.media.audio.timeoutSeconds`, quindi la sostituzione del provider selezionato.

Gli allegati vocali QQ in ingresso vengono esposti agli agenti come metadati di contenuti audio,
mantenendo al contempo i file vocali grezzi fuori da `MediaPaths` generico. `[[audio_as_voice]]`
in una risposta di testo semplice sintetizza il TTS e invia un messaggio vocale QQ nativo quando
il TTS è configurato.

Il comportamento di caricamento/transcodifica dell'audio in uscita può essere regolato anche con
`channels.qqbot.audioFormatPolicy`:

- `sttDirectFormats`
- `uploadDirectFormats`
- `transcodeEnabled`

## Formati di destinazione

| Formato                     | Descrizione        |
| -------------------------- | ------------------ |
| `qqbot:c2c:OPENID`         | Chat privata (C2C) |
| `qqbot:group:GROUP_OPENID` | Chat di gruppo         |
| `qqbot:channel:CHANNEL_ID` | Canale della gilda      |

<Note>
Ogni bot dispone del proprio insieme di OpenID utente. Un OpenID ricevuto dal Bot A **non può** essere utilizzato per inviare messaggi tramite il Bot B.
</Note>

## Comandi slash

Comandi integrati intercettati prima della coda dell'IA:

| Comando              | Autorizzazione | Ambito        | Descrizione                                                                    |
| -------------------- | -------------- | ------------- | ------------------------------------------------------------------------------ |
| `/bot-ping`          | —         | qualsiasi          | Test di latenza                                                                   |
| `/bot-help`          | —         | qualsiasi          | Elenca tutti i comandi                                                              |
| `/bot-me`            | —         | solo privato | Mostra l'ID utente QQ del mittente (openid) per la configurazione di `allowFrom` / `groupAllowFrom` |
| `/bot-version`       | —         | solo privato | Mostra la versione del framework OpenClaw e la versione del plugin                         |
| `/bot-upgrade`       | —         | solo privato | Mostra il link alla guida per l'aggiornamento di QQBot                                              |
| `/bot-approve`       | elenco consentiti | solo privato | Gestisce la configurazione dell'approvazione per l'esecuzione dei comandi (attiva / disattiva / sempre / reimposta / stato)  |
| `/bot-logs`          | elenco consentiti | solo privato | Esporta i log recenti del Gateway come file                                           |
| `/bot-clear-storage` | elenco consentiti | solo privato | Elimina i download memorizzati nella cache nella directory multimediale di QQBot                        |
| `/bot-streaming`     | elenco consentiti | solo privato | Attiva o disattiva le risposte in streaming C2C                                                   |
| `/bot-group-allways` | elenco consentiti | solo privato | Attiva o disattiva la modalità predefinita di attivazione dei gruppi (menzione obbligatoria o sempre attiva)      |

Aggiungere `?` a qualsiasi comando per visualizzare la guida all'uso (ad esempio `/bot-upgrade ?`).

I comandi con "Autorizzazione: elenco consentiti" richiedono inoltre che l'openid del mittente sia incluso in un
elenco `allowFrom` esplicito senza caratteri jolly (`groupAllowFrom` ha la precedenza per i
comandi inviati dai gruppi, con ripiego su `allowFrom`). Il carattere jolly
`allowFrom: ["*"]` consente la chat, ma non questi comandi. Se uno di essi viene eseguito
al di fuori di una chat privata o senza autorizzazione, viene restituito un suggerimento anziché
ignorare silenziosamente il messaggio.

`/bot-me`, `/bot-version` e `/bot-upgrade` sono disponibili solo nelle chat private, ma non
richiedono l'elenco consentiti: possono essere eseguiti da qualsiasi mittente C2C.

Quando le approvazioni per l'esecuzione di QQ Bot utilizzano il ripiego predefinito sulla stessa chat, i clic sui pulsanti
di approvazione nativi seguono lo stesso elenco esplicito di comandi consentiti senza caratteri jolly. Per
concedere l'accesso alle sole approvazioni senza un accesso più ampio ai comandi, configurare
`channels.qqbot.execApprovals.approvers`. Le approvazioni native per l'esecuzione sono abilitate per
impostazione predefinita.

## Contenuti multimediali e archiviazione

- I contenuti multimediali in entrata, in uscita e del bridge del Gateway condividono un'unica radice dei payload in
  `~/.openclaw/media/qqbot` (rispettando `OPENCLAW_HOME` quando impostato), in modo che caricamenti,
  download e cache di transcodifica rimangano in un'unica directory protetta.
- La distribuzione di contenuti multimediali avanzati alle destinazioni C2C e di gruppo avviene tramite un unico percorso `sendMedia`.
  I file locali e i buffer in memoria di almeno 5&nbsp;MiB utilizzano gli endpoint di
  caricamento a blocchi di QQ; i payload più piccoli e le sorgenti URL remote/Base64 utilizzano
  l'API di caricamento in un'unica operazione.
- Se un aggiornamento a caldo interrompe il Gateway prima che termini la scrittura di
  `openclaw.json`, al successivo avvio il plugin ripristina l'ultimo `appId` / `clientSecret`
  noto per quell'account da uno snapshot interno (senza mai
  sovrascrivere una modifica intenzionale della configurazione), pertanto non è
  necessario scansionare nuovamente il codice QR.

## Risoluzione dei problemi

- **Il Gateway non si avvia / nessun messaggio in entrata:** verificare che `appId` e
  `clientSecret` siano corretti e che il bot sia abilitato sulla QQ Open Platform.
  Se manca una credenziale, viene visualizzato "QQBot non configurato (appId o
  clientSecret mancante)".
- **La configurazione con `--token-file` risulta ancora non completata:** `--token-file` imposta solo
  l'AppSecret. `appId` deve comunque essere impostato nella configurazione o in `QQBOT_APP_ID`.
- **Le risposte di gruppo a raffica entrano in conflitto:** quando la coda di un peer si riempie, la coda in entrata rimuove
  i messaggi generati dai bot prima di quelli umani e unisce
  le raffiche di normali messaggi di gruppo (non comandi) in un unico turno attribuito, pertanto
  un flusso intenso di messaggi dei bot non dovrebbe impedire l'elaborazione dei messaggi umani.
- **I messaggi proattivi non arrivano:** QQ potrebbe bloccare i messaggi avviati dal bot se
  l'utente non ha interagito di recente.
- **La voce non viene trascritta:** assicurarsi che l'STT sia configurato e che il provider sia
  raggiungibile.

## Contenuti correlati

- [Associazione](/it/channels/pairing)
- [Gruppi](/it/channels/groups)
- [Risoluzione dei problemi dei canali](/it/channels/troubleshooting)
