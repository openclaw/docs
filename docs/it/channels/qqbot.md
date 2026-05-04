---
read_when:
    - Vuoi connettere OpenClaw a QQ
    - È necessario configurare le credenziali di QQ Bot
    - Vuoi il supporto per chat di gruppo o private di QQ Bot
summary: Installazione, configurazione e utilizzo di QQ Bot
title: bot di QQ
x-i18n:
    generated_at: "2026-05-04T02:21:56Z"
    model: gpt-5.5
    provider: openai
    source_hash: e17fa0da2f6939ed28cac5f13b3e37e6c63b87a10250ff213f7a86685a6141d6
    source_path: channels/qqbot.md
    workflow: 16
---

QQ Bot si connette a OpenClaw tramite l'API ufficiale QQ Bot (gateway WebSocket). Il
Plugin supporta chat private C2C, @messaggi di gruppo e messaggi nei canali guild con
contenuti multimediali avanzati (immagini, voce, video, file).

Stato: Plugin scaricabile. Sono supportati messaggi diretti, chat di gruppo, canali guild e
contenuti multimediali. Reazioni e thread non sono supportati.

## Installazione

Installa QQ Bot prima della configurazione:

```bash
openclaw plugins install @openclaw/qqbot
```

## Configurazione iniziale

1. Vai alla [QQ Open Platform](https://q.qq.com/) e scansiona il codice QR con il tuo
   QQ sul telefono per registrarti / accedere.
2. Fai clic su **Create Bot** per creare un nuovo bot QQ.
3. Trova **AppID** e **AppSecret** nella pagina delle impostazioni del bot e copiali.

> AppSecret non viene archiviato in chiaro: se lasci la pagina senza salvarlo,
> dovrai rigenerarne uno nuovo.

4. Aggiungi il canale:

```bash
openclaw channels add --channel qqbot --token "AppID:AppSecret"
```

5. Riavvia il Gateway.

Percorsi di configurazione interattiva:

```bash
openclaw channels add
openclaw configure --section channels
```

## Configurare

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

Variabili d'ambiente per l'account predefinito:

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

AppSecret Env SecretRef:

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

- Il fallback Env si applica solo all'account QQ Bot predefinito.
- `openclaw channels add --channel qqbot --token-file ...` fornisce solo
  l'AppSecret; l'AppID deve essere già impostato nella configurazione o in `QQBOT_APP_ID`.
- `clientSecret` accetta anche input SecretRef, non solo una stringa in chiaro.
- Le stringhe marcatore legacy `secretref:/...` non sono valori `clientSecret` validi;
  usa oggetti SecretRef strutturati come nell'esempio sopra.

### Configurazione multi-account

Esegui più bot QQ sotto una singola istanza OpenClaw:

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

Ogni account avvia la propria connessione WebSocket e mantiene una cache token
indipendente (isolata da `appId`).

Aggiungi un secondo bot tramite CLI:

```bash
openclaw channels add --channel qqbot --account bot2 --token "222222222:secret-of-bot-2"
```

### Chat di gruppo

Il supporto alle chat di gruppo di QQ Bot usa gli OpenID dei gruppi QQ, non i nomi visualizzati. Aggiungi il bot
a un gruppo, quindi menzionalo o configura il gruppo per funzionare senza una menzione.

```json5
{
  channels: {
    qqbot: {
      groupPolicy: "allowlist",
      groupAllowFrom: ["member_openid"],
      groups: {
        "*": {
          requireMention: true,
          historyLimit: 50,
          toolPolicy: "restricted",
        },
        GROUP_OPENID: {
          name: "Release room",
          requireMention: false,
          ignoreOtherMentions: true,
          historyLimit: 20,
          prompt: "Keep replies short and operational.",
        },
      },
    },
  },
}
```

`groups["*"]` imposta i valori predefiniti per ogni gruppo, e una voce concreta
`groups.GROUP_OPENID` sovrascrive quei valori predefiniti per un gruppo. Le impostazioni
di gruppo includono:

- `requireMention`: richiede una @menzione prima che il bot risponda. Predefinito: `true`.
- `ignoreOtherMentions`: scarta i messaggi che menzionano qualcun altro ma non il bot.
- `historyLimit`: conserva i messaggi recenti di gruppo senza menzione come contesto per il turno successivo con menzione. Imposta `0` per disabilitare.
- `toolPolicy`: `full`, `restricted` o `none` per gli strumenti con ambito di gruppo.
- `name`: etichetta descrittiva usata nei log e nel contesto del gruppo.
- `prompt`: prompt di comportamento per gruppo aggiunto al contesto dell'agente.

Le modalità di attivazione sono `mention` e `always`. `requireMention: true` corrisponde a
`mention`; `requireMention: false` corrisponde a `always`. Un override di attivazione
a livello di sessione, quando presente, prevale sulla configurazione.

La coda in ingresso è per peer. I peer di gruppo hanno un limite di coda più alto, mantengono i messaggi
umani prima delle conversazioni generate dal bot quando la coda è piena, e uniscono raffiche di normali
messaggi di gruppo in un unico turno attribuito. I comandi slash vengono comunque eseguiti uno alla volta.

### Voce (STT / TTS)

Il supporto STT e TTS usa una configurazione a due livelli con fallback prioritario:

| Impostazione | Specifico del Plugin                                      | Fallback del framework        |
| ------------ | --------------------------------------------------------- | ----------------------------- |
| STT          | `channels.qqbot.stt`                                      | `tools.media.audio.models[0]` |
| TTS          | `channels.qqbot.tts`, `channels.qqbot.accounts.<id>.tts` | `messages.tts`                |

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

Imposta `enabled: false` su uno dei due per disabilitarlo.
Gli override TTS a livello di account usano la stessa forma di `messages.tts` ed eseguono un deep-merge
sulla configurazione TTS del canale/globale.

Gli allegati vocali QQ in ingresso vengono esposti agli agenti come metadati multimediali audio, mantenendo
i file vocali grezzi fuori dai `MediaPaths` generici. Le risposte in testo semplice `[[audio_as_voice]]`
sintetizzano TTS e inviano un messaggio vocale QQ nativo quando TTS è configurato.

Il comportamento di upload/transcodifica audio in uscita può essere regolato anche con
`channels.qqbot.audioFormatPolicy`:

- `sttDirectFormats`
- `uploadDirectFormats`
- `transcodeEnabled`

## Formati di destinazione

| Formato                   | Descrizione        |
| ------------------------- | ------------------ |
| `qqbot:c2c:OPENID`        | Chat privata (C2C) |
| `qqbot:group:GROUP_OPENID` | Chat di gruppo     |
| `qqbot:channel:CHANNEL_ID` | Canale guild       |

> Ogni bot ha il proprio insieme di OpenID utente. Un OpenID ricevuto dal Bot A **non può**
> essere usato per inviare messaggi tramite il Bot B.

## Comandi slash

Comandi integrati intercettati prima della coda IA:

| Comando        | Descrizione                                                                                                          |
| -------------- | -------------------------------------------------------------------------------------------------------------------- |
| `/bot-ping`    | Test di latenza                                                                                                      |
| `/bot-version` | Mostra la versione del framework OpenClaw                                                                            |
| `/bot-help`    | Elenca tutti i comandi                                                                                               |
| `/bot-me`      | Mostra l'ID utente QQ (openid) del mittente per la configurazione di `allowFrom`/`groupAllowFrom`                    |
| `/bot-upgrade` | Mostra il link alla guida di aggiornamento di QQBot                                                                  |
| `/bot-logs`    | Esporta i log recenti del gateway come file                                                                          |
| `/bot-approve` | Approva un'azione QQ Bot in sospeso (ad esempio, la conferma di un upload C2C o di gruppo) tramite il flusso nativo. |

Aggiungi `?` a qualsiasi comando per ottenere aiuto sull'uso (ad esempio `/bot-upgrade ?`).

I comandi amministratore (`/bot-me`, `/bot-upgrade`, `/bot-logs`, `/bot-clear-storage`, `/bot-streaming`, `/bot-approve`) sono disponibili solo nei messaggi diretti e richiedono l'openid del mittente in un elenco `allowFrom` esplicito e senza wildcard. Una wildcard `allowFrom: ["*"]` consente la chat ma non concede l'accesso ai comandi amministratore. I messaggi di gruppo vengono confrontati prima con `groupAllowFrom` e poi ripiegano su `allowFrom`. L'esecuzione di un comando amministratore in un gruppo restituisce un suggerimento invece di scartarlo silenziosamente.

## Architettura del motore

QQ Bot viene fornito come motore autonomo all'interno del Plugin:

- Ogni account possiede uno stack di risorse isolato (connessione WebSocket, client API, cache token, root di archiviazione media) indicizzato da `appId`. Gli account non condividono mai stato in ingresso/in uscita.
- Il logger multi-account contrassegna le righe di log con l'account proprietario, così la diagnostica resta separabile quando esegui più bot sotto un solo gateway.
- I percorsi in ingresso, in uscita e bridge del gateway condividono una singola root del payload multimediale sotto `~/.openclaw/media`, quindi upload, download e cache di transcodifica finiscono sotto un'unica directory protetta invece che in un albero per sottosistema.
- La consegna di contenuti multimediali avanzati passa attraverso un unico percorso `sendMedia` per destinazioni C2C e di gruppo. I file locali e i buffer sopra la soglia per file grandi usano gli endpoint di upload a blocchi di QQ, mentre i payload più piccoli usano l'API media one-shot.
- Le credenziali possono essere salvate e ripristinate come parte degli snapshot standard delle credenziali OpenClaw; il motore ricollega lo stack di risorse di ogni account al ripristino senza richiedere una nuova coppia tramite codice QR.

## Onboarding con codice QR

Come alternativa all'incollare manualmente `AppID:AppSecret`, il motore supporta un flusso di onboarding con codice QR per collegare un QQ Bot a OpenClaw:

1. Esegui il percorso di configurazione di QQ Bot (ad esempio `openclaw channels add --channel qqbot`) e scegli il flusso con codice QR quando richiesto.
2. Scansiona il codice QR generato con l'app del telefono associata al QQ Bot di destinazione.
3. Approva l'abbinamento sul telefono. OpenClaw persiste le credenziali restituite in `credentials/` sotto l'ambito dell'account corretto.

I prompt di approvazione generati dal bot stesso (ad esempio, i flussi "consentire questa azione?" esposti dall'API QQ Bot) vengono mostrati come prompt OpenClaw nativi che puoi accettare con `/bot-approve` invece di rispondere tramite il client QQ grezzo.

## Risoluzione dei problemi

- **Il bot risponde "gone to Mars":** credenziali non configurate o Gateway non avviato.
- **Nessun messaggio in ingresso:** verifica che `appId` e `clientSecret` siano corretti, e che il
  bot sia abilitato nella QQ Open Platform.
- **Autorisposte ripetute:** OpenClaw registra gli indici ref in uscita di QQ come
  generati dal bot e ignora gli eventi in ingresso il cui `msgIdx` corrente corrisponde allo
  stesso account bot. Questo previene loop di eco della piattaforma consentendo comunque agli utenti
  di citare o rispondere a messaggi precedenti del bot.
- **La configurazione con `--token-file` risulta ancora non configurata:** `--token-file` imposta solo
  l'AppSecret. Ti serve comunque `appId` nella configurazione o in `QQBOT_APP_ID`.
- **I messaggi proattivi non arrivano:** QQ potrebbe intercettare i messaggi avviati dal bot se
  l'utente non ha interagito di recente.
- **La voce non viene trascritta:** assicurati che STT sia configurato e che il provider sia raggiungibile.

## Correlati

- [Abbinamento](/it/channels/pairing)
- [Gruppi](/it/channels/groups)
- [Risoluzione dei problemi dei canali](/it/channels/troubleshooting)
