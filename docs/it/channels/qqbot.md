---
read_when:
    - Vuoi connettere OpenClaw a QQ
    - È necessario configurare le credenziali di QQ Bot
    - Vuoi il supporto per chat di gruppo o private di QQ Bot
summary: Installazione, configurazione e utilizzo di QQ Bot
title: bot QQ
x-i18n:
    generated_at: "2026-05-02T08:16:33Z"
    model: gpt-5.5
    provider: openai
    source_hash: 7d37dd5846ecf07b1e3e8729faa23877780abdd40577b8dab61ea1ac9399885a
    source_path: channels/qqbot.md
    workflow: 16
---

QQ Bot si connette a OpenClaw tramite l'API ufficiale QQ Bot (Gateway WebSocket). Il
plugin supporta chat private C2C, @messaggi di gruppo e messaggi nei canali di gilda con
rich media (immagini, voce, video, file).

Stato: plugin scaricabile. Messaggi diretti, chat di gruppo, canali di gilda e
media sono supportati. Reazioni e thread non sono supportati.

## Installazione

Installa QQ Bot prima della configurazione:

```bash
openclaw plugins install @openclaw/qqbot
```

## Configurazione iniziale

1. Vai alla [QQ Open Platform](https://q.qq.com/) e scansiona il codice QR con il tuo
   QQ del telefono per registrarti / accedere.
2. Fai clic su **Create Bot** per creare un nuovo bot QQ.
3. Trova **AppID** e **AppSecret** nella pagina delle impostazioni del bot e copiali.

> AppSecret non viene archiviato in testo normale: se lasci la pagina senza salvarlo,
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

Note:

- Il fallback dell'ambiente si applica solo all'account QQ Bot predefinito.
- `openclaw channels add --channel qqbot --token-file ...` fornisce solo
  l'AppSecret; l'AppID deve essere già impostato nella configurazione o in `QQBOT_APP_ID`.
- `clientSecret` accetta anche input SecretRef, non solo una stringa in testo normale.

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
indipendente (isolata tramite `appId`).

Aggiungi un secondo bot tramite CLI:

```bash
openclaw channels add --channel qqbot --account bot2 --token "222222222:secret-of-bot-2"
```

### Chat di gruppo

Il supporto per le chat di gruppo di QQ Bot usa gli OpenID dei gruppi QQ, non i nomi visualizzati. Aggiungi il bot
a un gruppo, quindi menzionalo o configura il gruppo per funzionare senza menzione.

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
`groups.GROUP_OPENID` sovrascrive quei valori predefiniti per un gruppo. Le
impostazioni dei gruppi includono:

- `requireMention`: richiede una @menzione prima che il bot risponda. Predefinito: `true`.
- `ignoreOtherMentions`: elimina i messaggi che menzionano qualcun altro ma non il bot.
- `historyLimit`: conserva i messaggi di gruppo recenti senza menzione come contesto per il prossimo turno con menzione. Imposta `0` per disabilitare.
- `toolPolicy`: `full`, `restricted` o `none` per strumenti con ambito di gruppo.
- `name`: etichetta descrittiva usata nei log e nel contesto del gruppo.
- `prompt`: prompt di comportamento per gruppo aggiunto al contesto dell'agente.

Le modalità di attivazione sono `mention` e `always`. `requireMention: true` corrisponde a
`mention`; `requireMention: false` corrisponde a `always`. Un override di attivazione a livello di sessione,
quando presente, prevale sulla configurazione.

La coda in ingresso è per peer. I peer di gruppo ottengono un limite di coda più grande, mantengono i
messaggi umani davanti al chiacchiericcio scritto dal bot quando la coda è piena, e uniscono raffiche di normali
messaggi di gruppo in un unico turno attribuito. I comandi slash continuano a essere eseguiti uno alla volta.

### Voce (STT / TTS)

Il supporto STT e TTS usa una configurazione a due livelli con fallback prioritario:

| Impostazione | Specifico del plugin                                      | Fallback del framework        |
| ------------ | ---------------------------------------------------------- | ----------------------------- |
| STT          | `channels.qqbot.stt`                                       | `tools.media.audio.models[0]` |
| TTS          | `channels.qqbot.tts`, `channels.qqbot.accounts.<id>.tts`   | `messages.tts`                |

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
        qq-main: {
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
Gli override TTS a livello di account usano la stessa forma di `messages.tts` e fanno un merge profondo
sulla configurazione TTS del canale/globale.

Gli allegati vocali QQ in ingresso sono esposti agli agenti come metadati di media audio mantenendo
i file vocali grezzi fuori dai `MediaPaths` generici. Le risposte di testo normale `[[audio_as_voice]]`
sintetizzano TTS e inviano un messaggio vocale QQ nativo quando TTS è
configurato.

Il comportamento di caricamento/transcodifica dell'audio in uscita può essere regolato anche con
`channels.qqbot.audioFormatPolicy`:

- `sttDirectFormats`
- `uploadDirectFormats`
- `transcodeEnabled`

## Formati di destinazione

| Formato                    | Descrizione        |
| -------------------------- | ------------------ |
| `qqbot:c2c:OPENID`         | Chat privata (C2C) |
| `qqbot:group:GROUP_OPENID` | Chat di gruppo     |
| `qqbot:channel:CHANNEL_ID` | Canale di gilda    |

> Ogni bot ha il proprio insieme di OpenID utente. Un OpenID ricevuto dal Bot A **non può**
> essere usato per inviare messaggi tramite il Bot B.

## Comandi slash

Comandi integrati intercettati prima della coda AI:

| Comando        | Descrizione                                                                                                   |
| -------------- | ------------------------------------------------------------------------------------------------------------- |
| `/bot-ping`    | Test di latenza                                                                                               |
| `/bot-version` | Mostra la versione del framework OpenClaw                                                                      |
| `/bot-help`    | Elenca tutti i comandi                                                                                        |
| `/bot-me`      | Mostra l'ID utente QQ (openid) del mittente per la configurazione di `allowFrom`/`groupAllowFrom`             |
| `/bot-upgrade` | Mostra il link alla guida di aggiornamento QQBot                                                              |
| `/bot-logs`    | Esporta i log recenti del gateway come file                                                                   |
| `/bot-approve` | Approva un'azione QQ Bot in sospeso (per esempio, confermando un caricamento C2C o di gruppo) tramite il flusso nativo. |

Aggiungi `?` a qualsiasi comando per ottenere aiuto sull'uso (per esempio `/bot-upgrade ?`).

I comandi amministratore (`/bot-me`, `/bot-upgrade`, `/bot-logs`, `/bot-clear-storage`, `/bot-streaming`, `/bot-approve`) sono solo per messaggi diretti e richiedono l'openid del mittente in una lista esplicita `allowFrom` non wildcard. Un wildcard `allowFrom: ["*"]` permette la chat ma non concede accesso ai comandi amministratore. I messaggi di gruppo vengono confrontati prima con `groupAllowFrom` e ricadono su `allowFrom`. Eseguire un comando amministratore in un gruppo restituisce un suggerimento invece di eliminarlo silenziosamente.

## Architettura del motore

QQ Bot viene distribuito come motore autonomo all'interno del plugin:

- Ogni account possiede uno stack di risorse isolato (connessione WebSocket, client API, cache token, radice di archiviazione media) indicizzato da `appId`. Gli account non condividono mai lo stato in ingresso/in uscita.
- Il logger multi-account etichetta le righe di log con l'account proprietario così la diagnostica resta separabile quando esegui più bot sotto un gateway.
- I percorsi in ingresso, in uscita e del bridge gateway condividono una singola radice di payload media sotto `~/.openclaw/media`, quindi caricamenti, download e cache di transcodifica finiscono sotto una directory protetta invece che in un albero per sottosistema.
- La consegna dei rich media passa attraverso un unico percorso `sendMedia` per destinazioni C2C e di gruppo. I file locali e i buffer sopra la soglia dei file grandi usano gli endpoint di caricamento a blocchi di QQ, mentre i payload più piccoli usano l'API media one-shot.
- Le credenziali possono essere sottoposte a backup e ripristinate come parte degli snapshot standard delle credenziali OpenClaw; il motore riaggancia lo stack di risorse di ogni account al ripristino senza richiedere un nuovo abbinamento con codice QR.

## Onboarding con codice QR

Come alternativa all'incollare manualmente `AppID:AppSecret`, il motore supporta un flusso di onboarding con codice QR per collegare un QQ Bot a OpenClaw:

1. Esegui il percorso di configurazione di QQ Bot (per esempio `openclaw channels add --channel qqbot`) e scegli il flusso con codice QR quando richiesto.
2. Scansiona il codice QR generato con l'app del telefono associata al QQ Bot di destinazione.
3. Approva l'abbinamento sul telefono. OpenClaw mantiene le credenziali restituite in `credentials/` sotto l'ambito account corretto.

I prompt di approvazione generati dal bot stesso (per esempio, flussi "consentire questa azione?" esposti dall'API QQ Bot) emergono come prompt nativi OpenClaw che puoi accettare con `/bot-approve` invece di rispondere tramite il client QQ grezzo.

## Risoluzione dei problemi

- **Il bot risponde "gone to Mars":** credenziali non configurate o Gateway non avviato.
- **Nessun messaggio in ingresso:** verifica che `appId` e `clientSecret` siano corretti, e che il
  bot sia abilitato sulla QQ Open Platform.
- **Autorisposte ripetute:** OpenClaw registra gli indici di riferimento in uscita QQ come
  scritti dal bot e ignora gli eventi in ingresso il cui `msgIdx` corrente corrisponde allo
  stesso account bot. Questo previene cicli di eco della piattaforma consentendo comunque agli utenti
  di citare o rispondere a messaggi precedenti del bot.
- **La configurazione con `--token-file` appare ancora non configurata:** `--token-file` imposta solo
  l'AppSecret. Ti serve ancora `appId` nella configurazione o `QQBOT_APP_ID`.
- **Messaggi proattivi non ricevuti:** QQ potrebbe intercettare i messaggi avviati dal bot se
  l'utente non ha interagito di recente.
- **Voce non trascritta:** assicurati che STT sia configurato e che il provider sia raggiungibile.

## Correlati

- [Abbinamento](/it/channels/pairing)
- [Gruppi](/it/channels/groups)
- [Risoluzione dei problemi del canale](/it/channels/troubleshooting)
