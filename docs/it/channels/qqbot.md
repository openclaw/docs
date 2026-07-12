---
read_when:
    - Vuoi connettere OpenClaw a QQ
    - Devi configurare le credenziali del bot QQ
    - Vuoi il supporto per le chat di gruppo o private di QQ Bot
summary: Configurazione, impostazioni e utilizzo di QQ Bot
title: Bot QQ
x-i18n:
    generated_at: "2026-07-12T06:51:42Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: e654d1a3e501ef825e857cf0fdd780401c6dc0012d729db0aa1ae72a8a6871ed
    source_path: channels/qqbot.md
    workflow: 16
---

QQ Bot si connette a OpenClaw tramite l'API ufficiale di QQ Bot (gateway WebSocket).
La chat privata C2C e le menzioni `@` nei gruppi sono i tipi di chat principali, con contenuti
multimediali avanzati (immagini, messaggi vocali, video, file). I messaggi nei canali delle gilde sono supportati
solo per testo e immagini tramite URL remoti; messaggi vocali, video, caricamenti di file e immagini
locali/Base64 non sono disponibili nei canali delle gilde. Reazioni e thread non sono
supportati in alcun contesto.

Stato: plugin ufficiale scaricabile.

## Installazione

```bash
openclaw plugins install @openclaw/qqbot
```

## Configurazione iniziale

1. Vai alla [Piattaforma aperta QQ](https://q.qq.com/) ed esegui la scansione del codice QR con QQ sul
   telefono per registrarti o accedere.
2. Fai clic su **Create Bot** per creare un nuovo bot QQ.
3. Individua **AppID** e **AppSecret** nella pagina delle impostazioni del bot e copiali.

<Note>
AppSecret non viene archiviato in testo normale. Se lasci la pagina senza salvarlo, dovrai generarne uno nuovo.
</Note>

4. Aggiungi il canale:

```bash
openclaw channels add --channel qqbot --token "AppID:AppSecret"
```

5. Riavvia il Gateway.

Configurazione interattiva:

```bash
openclaw channels add
```

La procedura guidata offre anche l'associazione tramite codice QR come alternativa all'inserimento manuale
di AppID/AppSecret: esegui la scansione del codice con l'app del telefono collegata al QQ Bot di destinazione per completare
l'associazione. OpenClaw salva le credenziali restituite nell'ambito di configurazione
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

Variabili d'ambiente dell'account predefinito (solo account di primo livello):

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

AppSecret SecretRef da variabile d'ambiente:

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
- `clientSecret` accetta una stringa in testo normale, un percorso di file (`clientSecretFile`)
  oppure un oggetto SecretRef strutturato.
- Le stringhe marcatore obsolete `secretref:...` / `secretref-env:...` vengono rifiutate per
  `clientSecret`; usa invece un oggetto SecretRef strutturato.

### Criteri di accesso

- `allowFrom` / `groupAllowFrom` determinano chi può comunicare con il bot nei contesti C2C /
  di gruppo. `dmPolicy` / `groupPolicy` (`open` | `allowlist` | `disabled`)
  controllano la modalità di applicazione. `dmPolicy` passa per impostazione predefinita a `allowlist` quando
  `allowFrom` contiene una voce concreta (non un carattere jolly), altrimenti usa `open`.
  `groupPolicy` passa per impostazione predefinita a `allowlist` quando `groupAllowFrom` o
  `allowFrom` contiene una voce concreta, altrimenti usa `open`.
- I comandi slash con "Autorizzazione: elenco consentiti" richiedono una voce esplicita senza caratteri jolly in
  `allowFrom` (o in `groupAllowFrom` per le invocazioni di gruppo), indipendentemente da
  `dmPolicy` / `groupPolicy`: consulta [Comandi slash](#slash-commands).

### Configurazione multi-account

Esegui più bot QQ in una singola istanza di OpenClaw:

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
isolati, identificati da `appId`. Le righe dei log sono contrassegnate con l'ID dell'account proprietario, in modo che
la diagnostica rimanga separabile quando esegui più bot sotto un unico Gateway.

Aggiungi un secondo bot tramite CLI:

```bash
openclaw channels add --channel qqbot --account bot2 --token "222222222:secret-of-bot-2"
```

### Chat di gruppo

Il supporto dei gruppi utilizza gli OpenID dei gruppi QQ, non i nomi visualizzati. Aggiungi il bot a un
gruppo, quindi menzionalo oppure configura il gruppo per funzionare senza menzione.

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

`groups["*"]` imposta i valori predefiniti per ogni gruppo; una voce concreta `groups.GROUP_OPENID`
sostituisce tali valori predefiniti per un singolo gruppo. Impostazioni dei gruppi:

| Campo                 | Valore predefinito | Descrizione                                                                                         |
| --------------------- | ------------------ | --------------------------------------------------------------------------------------------------- |
| `requireMention`      | `true`             | Richiede una menzione `@` prima che il bot risponda.                                                |
| `commandLevel`        | `all`              | Specifica quali comandi slash integrati possono essere eseguiti nel gruppo (vedi sotto).            |
| `ignoreOtherMentions` | `false`            | Ignora i messaggi che menzionano qualcun altro ma non il bot.                                       |
| `historyLimit`        | `50`               | Messaggi recenti senza menzioni conservati come contesto per il turno successivo con menzione. `0` disabilita la cronologia. |
| `tools`               | —                  | Consente o nega gli strumenti per l'intero gruppo.                                                  |
| `toolsBySender`       | —                  | Sostituzioni degli strumenti per mittente; consulta [Gruppi](/it/channels/groups#groupchannel-tool-restrictions-optional). |
| `name`                | prefisso openid    | Etichetta descrittiva usata nei log e nel contesto del gruppo.                                      |
| `prompt`              | valore predefinito integrato | Prompt di comportamento specifico del gruppo aggiunto al contesto dell'agente.             |

`commandLevel` accetta:

| Livello  | Comportamento                                                                                                                                 |
| -------- | --------------------------------------------------------------------------------------------------------------------------------------------- |
| `all`    | I comandi integrati esistenti rimangono disponibili. Alcuni rimangono nascosti nei menu, ma gli utenti autorizzati possono comunque eseguirli nel gruppo. |
| `safety` | `/help`, `/btw`, `/stop` rimangono visibili nel gruppo; i comandi sensibili (`/config`, `/tools`, `/bash`, ecc.) devono essere eseguiti nella chat privata. |
| `strict` | Sono consentiti solo i controlli della sessione di gruppo necessari per il funzionamento rigoroso. `/stop` continua a funzionare, così un mittente autorizzato può interrompere un'esecuzione attiva. |

Le vecchie voci `toolPolicy` di QQBot sono state ritirate. Esegui `openclaw doctor --fix` per migrarle a `tools`.

Le modalità di attivazione sono `mention` e `always`. `requireMention: true` corrisponde a
`mention`; `requireMention: false` corrisponde a `always`. Un'eventuale sostituzione dell'attivazione
a livello di sessione ha la precedenza sulla configurazione.

La coda in ingresso è separata per interlocutore. Gli interlocutori di gruppo hanno un limite di coda maggiore (50 rispetto a 20
per gli interlocutori diretti), espellono i messaggi generati dal bot prima di quelli umani quando è piena
e uniscono raffiche di normali messaggi di gruppo in un unico turno con attribuzione. I comandi slash
vengono eseguiti uno alla volta, indipendentemente da qualsiasi gruppo di messaggi unito.

### Voce (STT / TTS)

Il supporto STT e TTS offre una configurazione a due livelli con ripiego in base alla priorità:

| Impostazione | Specifica del Plugin                                    | Ripiego del framework          |
| ------------ | ------------------------------------------------------ | ------------------------------ |
| STT          | `channels.qqbot.stt`                                   | `tools.media.audio.models[0]` |
| TTS          | `channels.qqbot.tts`, `channels.qqbot.accounts.<id>.tts` | `messages.tts`               |

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

Imposta `enabled: false` su uno dei due per disabilitarlo. Le sostituzioni TTS a livello di account usano la
stessa struttura di `messages.tts` e vengono unite in profondità alla configurazione TTS del canale/globale.

Per impostazione predefinita, le richieste STT scadono dopo 60 secondi. Lo STT specifico del Plugin usa il valore sostitutivo
`models.providers.<id>.timeoutSeconds` selezionato. Lo STT audio del framework
usa `tools.media.audio.models[0].timeoutSeconds`, quindi
`tools.media.audio.timeoutSeconds` e infine il valore sostitutivo del fornitore selezionato.

Gli allegati vocali QQ in ingresso vengono esposti agli agenti come metadati multimediali audio,
mantenendo al contempo i file vocali non elaborati fuori da `MediaPaths` generico. `[[audio_as_voice]]`
in una risposta di testo semplice sintetizza il TTS e invia un messaggio vocale QQ nativo quando
il TTS è configurato.

Anche il comportamento di caricamento/transcodifica dell'audio in uscita può essere regolato con
`channels.qqbot.audioFormatPolicy`:

- `sttDirectFormats`
- `uploadDirectFormats`
- `transcodeEnabled`

## Formati di destinazione

| Formato                    | Descrizione         |
| -------------------------- | ------------------- |
| `qqbot:c2c:OPENID`         | Chat privata (C2C)  |
| `qqbot:group:GROUP_OPENID` | Chat di gruppo      |
| `qqbot:channel:CHANNEL_ID` | Canale della gilda  |

<Note>
Ogni bot dispone del proprio insieme di OpenID utente. Un OpenID ricevuto dal Bot A **non può** essere usato per inviare messaggi tramite il Bot B.
</Note>

## Comandi slash

Comandi integrati intercettati prima della coda dell'IA:

| Comando              | Autorizzazione    | Ambito            | Descrizione                                                                                  |
| -------------------- | ----------------- | ----------------- | -------------------------------------------------------------------------------------------- |
| `/bot-ping`          | —                 | qualsiasi         | Verifica della latenza                                                                       |
| `/bot-help`          | —                 | qualsiasi         | Elenca tutti i comandi                                                                       |
| `/bot-me`            | —                 | solo privato      | Mostra l'ID utente QQ (openid) del mittente per configurare `allowFrom` / `groupAllowFrom`    |
| `/bot-version`       | —                 | solo privato      | Mostra la versione del framework OpenClaw e quella del plugin                                 |
| `/bot-upgrade`       | —                 | solo privato      | Mostra il collegamento alla guida di aggiornamento di QQBot                                   |
| `/bot-approve`       | elenco consentiti | solo privato      | Gestisce la configurazione di approvazione dell'esecuzione dei comandi (on / off / always / reset / status) |
| `/bot-logs`          | elenco consentiti | solo privato      | Esporta i log recenti del gateway come file                                                   |
| `/bot-clear-storage` | elenco consentiti | solo privato      | Elimina i download memorizzati nella cache nella directory multimediale di QQBot              |
| `/bot-streaming`     | elenco consentiti | solo privato      | Attiva o disattiva le risposte in streaming C2C                                               |
| `/bot-group-allways` | elenco consentiti | solo privato      | Alterna la modalità di attivazione predefinita dei gruppi (menzione obbligatoria o sempre attiva) |

Aggiungi `?` a qualsiasi comando per ottenere informazioni sull'utilizzo (ad esempio `/bot-upgrade ?`).

I comandi con "Autorizzazione: elenco consentiti" richiedono inoltre che l'openid del mittente sia presente in un
elenco `allowFrom` esplicito e senza caratteri jolly (`groupAllowFrom` ha la precedenza per
i comandi impartiti dai gruppi, con ripiego su `allowFrom`). Un carattere jolly
`allowFrom: ["*"]` consente la chat ma non questi comandi. L'esecuzione di uno di essi
al di fuori della chat privata o senza autorizzazione restituisce un suggerimento anziché
ignorare silenziosamente il messaggio.

`/bot-me`, `/bot-version` e `/bot-upgrade` sono disponibili solo nelle chat private, ma non
richiedono l'elenco consentito: qualsiasi mittente C2C può eseguirli.

Quando le approvazioni di esecuzione di QQ Bot usano il fallback predefinito alla stessa chat, i clic sui
pulsanti nativi di approvazione seguono lo stesso elenco consentito esplicito dei comandi senza caratteri jolly. Per
concedere l'accesso alle sole approvazioni senza un accesso più ampio ai comandi, configura
`channels.qqbot.execApprovals.approvers`. Le approvazioni native di esecuzione sono abilitate per
impostazione predefinita.

## Contenuti multimediali e archiviazione

- I contenuti multimediali in entrata, in uscita e del bridge del Gateway condividono un'unica directory radice dei payload in
  `~/.openclaw/media/qqbot` (rispettando `OPENCLAW_HOME` quando impostata), così caricamenti,
  download e cache di transcodifica rimangono in un'unica directory protetta.
- La consegna di contenuti multimediali avanzati per destinazioni C2C e di gruppo passa attraverso un unico percorso `sendMedia`.
  I file locali e i buffer in memoria di almeno 5&nbsp;MiB usano gli endpoint
  di caricamento a blocchi di QQ; i payload più piccoli e le sorgenti con URL remoto/Base64 usano
  l'API di caricamento in un'unica operazione.
- Se un aggiornamento a caldo interrompe il Gateway prima che termini la scrittura di
  `openclaw.json`, il Plugin ripristina l'ultimo `appId` / `clientSecret` noto
  per quell'account da uno snapshot interno al successivo avvio (senza mai
  sovrascrivere una modifica intenzionale della configurazione), quindi non è
  necessario scansionare nuovamente il codice QR.

## Risoluzione dei problemi

- **Il Gateway non si avvia / nessun messaggio in entrata:** verifica che `appId` e
  `clientSecret` siano corretti e che il bot sia abilitato sulla QQ Open Platform.
  Una credenziale mancante viene segnalata come "QQBot non configurato (`appId` o
  `clientSecret` mancante)".
- **La configurazione con `--token-file` risulta ancora non configurata:** `--token-file` imposta solo
  l'AppSecret. `appId` deve comunque essere impostato nella configurazione o in `QQBOT_APP_ID`.
- **Le risposte di gruppo a raffica entrano in conflitto:** quando la coda di un interlocutore si riempie, la coda in entrata elimina
  i messaggi creati dai bot prima di quelli umani e riunisce
  le raffiche di normali messaggi di gruppo (non comandi) in un unico turno con attribuzione, quindi
  un flusso intenso di messaggi dei bot non dovrebbe impedire l'elaborazione dei messaggi umani.
- **I messaggi proattivi non arrivano:** QQ può bloccare i messaggi avviati dal bot se
  l'utente non ha interagito di recente.
- **La voce non viene trascritta:** assicurati che STT sia configurato e che il fornitore sia
  raggiungibile.

## Contenuti correlati

- [Associazione](/it/channels/pairing)
- [Gruppi](/it/channels/groups)
- [Risoluzione dei problemi dei canali](/it/channels/troubleshooting)
