---
read_when:
    - Vuoi connettere OpenClaw a QQ
    - Devi configurare le credenziali del bot QQ
    - Vuoi il supporto per chat di gruppo o privata di QQ Bot
summary: Configurazione, config e utilizzo del bot QQ
title: Bot QQ
x-i18n:
    generated_at: "2026-06-27T17:12:50Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: eb452e331ce196d1517af2f87a5187cb4b2cb53aee2bbff47cbdf73e2b3e7dee
    source_path: channels/qqbot.md
    workflow: 16
---

QQ Bot si connette a OpenClaw tramite l'API ufficiale di QQ Bot (Gateway WebSocket). Il
Plugin supporta chat private C2C, @messaggi di gruppo e messaggi nei canali guild con
media avanzati (immagini, voce, video, file).

Stato: Plugin scaricabile. Messaggi diretti, chat di gruppo, canali guild e
media sono supportati. Reazioni e thread non sono supportati.

## Installazione

Installa QQ Bot prima della configurazione:

```bash
openclaw plugins install @openclaw/qqbot
```

## Configurazione

1. Vai alla [QQ Open Platform](https://q.qq.com/) e scansiona il codice QR con il tuo
   QQ sul telefono per registrarti / accedere.
2. Fai clic su **Create Bot** per creare un nuovo bot QQ.
3. Trova **AppID** e **AppSecret** nella pagina delle impostazioni del bot e copiali.

> AppSecret non viene memorizzato in testo normale: se lasci la pagina senza salvarlo,
> dovrai generarne uno nuovo.

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

Variabili env dell'account predefinito:

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

AppSecret SecretRef env:

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

- Il fallback env si applica solo all'account QQ Bot predefinito.
- `openclaw channels add --channel qqbot --token-file ...` fornisce solo
  AppSecret; AppID deve essere già impostato nella configurazione o in `QQBOT_APP_ID`.
- `clientSecret` accetta anche input SecretRef, non solo una stringa in testo normale.
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

Ogni account avvia la propria connessione WebSocket e mantiene una cache dei
token indipendente (isolata da `appId`).

Aggiungi un secondo bot tramite CLI:

```bash
openclaw channels add --channel qqbot --account bot2 --token "222222222:secret-of-bot-2"
```

### Chat di gruppo

Il supporto di QQ Bot per le chat di gruppo usa gli OpenID dei gruppi QQ, non i nomi visualizzati. Aggiungi il bot
a un gruppo, poi menzionalo o configura il gruppo per funzionare senza una menzione.

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

`groups["*"]` imposta i valori predefiniti per ogni gruppo, e una voce concreta
`groups.GROUP_OPENID` sovrascrive quei valori predefiniti per un gruppo. Le
impostazioni di gruppo includono:

- `requireMention`: richiede una @mention prima che il bot risponda. Predefinito: `true`.
- `commandLevel`: controlla quali comandi slash integrati possono essere eseguiti nei gruppi.
  Predefinito: `all`, che preserva il comportamento di gruppo QQBot preesistente quando
  l'impostazione viene omessa.
- `ignoreOtherMentions`: scarta i messaggi che menzionano qualcun altro ma non il bot.
- `historyLimit`: conserva i messaggi di gruppo recenti senza menzione come contesto per il successivo turno menzionato. Imposta `0` per disabilitare.
- `tools`: consenti/nega strumenti per l'intero gruppo.
- `toolsBySender`: sovrascritture degli strumenti di gruppo per mittente; vedi [Gruppi](/it/channels/groups#groupchannel-tool-restrictions-optional).
- `name`: etichetta descrittiva usata nei log e nel contesto del gruppo.
- `prompt`: prompt di comportamento per gruppo aggiunto al contesto dell'agente.

`commandLevel` accetta:

- `all`: mantiene disponibili come prima i comandi integrati riconosciuti. Alcuni comandi possono
  restare nascosti dai menu, ma gli utenti autorizzati possono comunque eseguirli nel gruppo.
- `safety`: consente comandi di collaborazione comuni come `/help`, `/btw` e
  `/stop`; chiede agli utenti di eseguire comandi sensibili come `/config`, `/tools` e
  `/bash` in chat privata.
- `strict`: consente solo i controlli della sessione di gruppo necessari per il funzionamento
  rigoroso del gruppo. `/stop` resta comunque urgente, così un mittente autorizzato può interrompere
  un'esecuzione attiva.

Le vecchie voci `toolPolicy` di QQBot sono ritirate. Esegui `openclaw doctor --fix` per migrarle a `tools`.

Le modalità di attivazione sono `mention` e `always`. `requireMention: true` mappa a
`mention`; `requireMention: false` mappa a `always`. Una sovrascrittura di attivazione
a livello di sessione, quando presente, prevale sulla configurazione.

La coda in ingresso è per peer. I peer di gruppo ottengono un limite di coda più ampio, mantengono i
messaggi umani prima delle conversazioni generate dal bot quando è piena e uniscono raffiche di normali
messaggi di gruppo in un unico turno attribuito. I comandi slash vengono comunque eseguiti uno alla volta.

### Voce (STT / TTS)

Il supporto STT e TTS usa una configurazione a due livelli con fallback a priorità:

| Impostazione | Specifica del Plugin                                      | Fallback del framework        |
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

Imposta `enabled: false` su uno dei due per disabilitarlo.
Le sovrascritture TTS a livello di account usano la stessa forma di `messages.tts` e fanno deep-merge
sopra la configurazione TTS del canale/globale.

Gli allegati vocali QQ in ingresso vengono esposti agli agenti come metadati di media audio, mantenendo
al contempo i file vocali grezzi fuori da `MediaPaths` generici. Le risposte in testo normale
`[[audio_as_voice]]` sintetizzano TTS e inviano un messaggio vocale QQ nativo quando TTS è
configurato.

Il comportamento di caricamento/transcodifica audio in uscita può essere regolato anche con
`channels.qqbot.audioFormatPolicy`:

- `sttDirectFormats`
- `uploadDirectFormats`
- `transcodeEnabled`

## Formati di destinazione

| Formato                    | Descrizione        |
| -------------------------- | ------------------ |
| `qqbot:c2c:OPENID`         | Chat privata (C2C) |
| `qqbot:group:GROUP_OPENID` | Chat di gruppo     |
| `qqbot:channel:CHANNEL_ID` | Canale guild       |

> Ogni bot ha il proprio insieme di OpenID utente. Un OpenID ricevuto dal Bot A **non può**
> essere usato per inviare messaggi tramite il Bot B.

## Comandi slash

Comandi integrati intercettati prima della coda AI:

| Comando        | Descrizione                                                                                            |
| -------------- | ------------------------------------------------------------------------------------------------------ |
| `/bot-ping`    | Test di latenza                                                                                        |
| `/bot-version` | Mostra la versione del framework OpenClaw                                                              |
| `/bot-help`    | Elenca tutti i comandi                                                                                 |
| `/bot-me`      | Mostra l'ID utente QQ del mittente (openid) per configurare `allowFrom`/`groupAllowFrom`               |
| `/bot-upgrade` | Mostra il link alla guida di aggiornamento QQBot                                                       |
| `/bot-logs`    | Esporta i log recenti del gateway come file                                                            |
| `/bot-approve` | Approva un'azione QQ Bot in sospeso (ad esempio, confermare un caricamento C2C o di gruppo) tramite il flusso nativo. |

Aggiungi `?` a qualsiasi comando per ottenere aiuto sull'uso (ad esempio `/bot-upgrade ?`).

I comandi amministrativi (`/bot-me`, `/bot-upgrade`, `/bot-logs`, `/bot-clear-storage`, `/bot-streaming`, `/bot-approve`) sono solo per messaggi diretti e richiedono l'openid del mittente in un elenco `allowFrom` esplicito senza wildcard. Un wildcard `allowFrom: ["*"]` consente la chat ma non concede accesso ai comandi amministrativi. I messaggi di gruppo vengono confrontati prima con `groupAllowFrom` e ripiegano su `allowFrom`. L'esecuzione di un comando amministrativo in un gruppo restituisce un suggerimento invece di scartarlo silenziosamente.

Quando le approvazioni exec di QQ Bot usano il fallback predefinito nella stessa chat, i clic sui
pulsanti di approvazione nativi seguono la stessa allowlist di comandi esplicita senza wildcard. Per concedere
accesso solo alle approvazioni senza un accesso più ampio ai comandi, configura
`channels.qqbot.execApprovals.approvers`.

## Architettura del motore

QQ Bot viene fornito come motore autonomo all'interno del Plugin:

- Ogni account possiede uno stack di risorse isolato (connessione WebSocket, client API, cache dei token, radice di archiviazione dei media) indicizzato da `appId`. Gli account non condividono mai stato in ingresso/in uscita.
- Il logger multi-account etichetta le righe di log con l'account proprietario, così la diagnostica resta separabile quando esegui diversi bot sotto un unico gateway.
- I percorsi in ingresso, in uscita e del bridge gateway condividono una singola radice dei payload media sotto `~/.openclaw/media`, così caricamenti, download e cache di transcodifica finiscono sotto una directory protetta invece che in un albero per sottosistema.
- La consegna di media avanzati passa attraverso un unico percorso `sendMedia` per destinazioni C2C e di gruppo. I file locali e i buffer sopra la soglia dei file grandi usano gli endpoint di caricamento a blocchi di QQ, mentre i payload più piccoli usano l'API media one-shot.
- Le credenziali possono essere sottoposte a backup e ripristinate come parte degli snapshot standard delle credenziali OpenClaw; il motore ricollega lo stack di risorse di ogni account al ripristino senza richiedere una nuova coppia di codici QR.

## Onboarding con codice QR

In alternativa all'incollare manualmente `AppID:AppSecret`, il motore supporta un flusso di onboarding con codice QR per collegare un QQ Bot a OpenClaw:

1. Esegui il percorso di configurazione di QQ Bot (ad esempio `openclaw channels add --channel qqbot`) e scegli il flusso con codice QR quando richiesto.
2. Scansiona il codice QR generato con l'app del telefono collegata al QQ Bot di destinazione.
3. Approva l'abbinamento sul telefono. OpenClaw salva le credenziali restituite in `credentials/` nell'ambito dell'account corretto.

I prompt di approvazione generati dal bot stesso (ad esempio, flussi "consentire questa azione?" esposti dall'API QQ Bot) emergono come prompt OpenClaw nativi che puoi accettare con `/bot-approve` invece di rispondere tramite il client QQ grezzo.

## Risoluzione dei problemi

- **Il bot risponde "gone to Mars":** credenziali non configurate o Gateway non avviato.
- **Nessun messaggio in ingresso:** verifica che `appId` e `clientSecret` siano corretti e che il
  bot sia abilitato sulla QQ Open Platform.
- **Auto-risposte ripetute:** OpenClaw registra gli indici di riferimento in uscita di QQ come
  creati dal bot e ignora gli eventi in ingresso il cui `msgIdx` corrente corrisponde allo
  stesso account del bot. Questo evita cicli di eco della piattaforma, consentendo comunque agli utenti
  di citare o rispondere ai messaggi precedenti del bot.
- **La configurazione con `--token-file` risulta ancora non configurata:** `--token-file` imposta solo
  l'AppSecret. Devi comunque avere `appId` nella configurazione o `QQBOT_APP_ID`.
- **I messaggi proattivi non arrivano:** QQ potrebbe intercettare i messaggi avviati dal bot se
  l'utente non ha interagito di recente.
- **Voce non trascritta:** assicurati che STT sia configurato e che il provider sia raggiungibile.

## Correlati

- [Abbinamento](/it/channels/pairing)
- [Gruppi](/it/channels/groups)
- [Risoluzione dei problemi dei canali](/it/channels/troubleshooting)
