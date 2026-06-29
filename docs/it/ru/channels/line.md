---
read_when:
    - Vuoi collegare OpenClaw a LINE
    - È necessario configurare il Webhook LINE e le credenziali
    - Sono necessari parametri dei messaggi specifici per LINE
summary: Installazione, configurazione e utilizzo del Plugin LINE Messaging API
title: LINE
x-i18n:
    generated_at: "2026-06-28T22:33:35Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 9a6c76ea64b92b76dd2f6ab0d9fff7eb316e1940ba660d65262307796b5a6abc
    source_path: ru/channels/line.md
    workflow: 16
---

LINE si collega a OpenClaw tramite la LINE Messaging API. Il Plugin funziona come ricevitore webhook
sul gateway e usa il tuo channel access token + channel secret per
l'autenticazione.

Stato: Plugin caricabile. Sono supportati messaggi privati, chat di gruppo, media, posizioni, Flex
messages, template messages e risposte rapide. Reazioni e thread
non sono supportati.

## Installazione

Installa LINE prima di configurare il canale:

```bash
openclaw plugins install @openclaw/line
```

Copia di lavoro locale (quando esegui da un repository git):

```bash
openclaw plugins install ./path/to/local/line-plugin
```

## Configurazione

1. Crea un account LINE Developers e apri la Console:
   [https://developers.line.biz/console/](https://developers.line.biz/console/)
2. Crea (o seleziona) un Provider e aggiungi un canale **Messaging API**.
3. Copia **Channel access token** e **Channel secret** dalle impostazioni del canale.
4. Abilita **Use webhook** nelle impostazioni della Messaging API.
5. Imposta l'URL webhook per il tuo endpoint gateway (HTTPS obbligatorio):

```
https://gateway-host/line/webhook
```

Il Gateway risponde alla verifica webhook di LINE (GET) e conferma gli eventi
in ingresso firmati (POST) subito dopo la verifica della firma e del payload; l'elaborazione
da parte dell'agente continua in modo asincrono.
Se ti serve un percorso personalizzato, imposta `channels.line.webhookPath` oppure
`channels.line.accounts.<id>.webhookPath` e aggiorna l'URL di conseguenza.

Nota di sicurezza:

- La verifica della firma LINE dipende dal corpo della richiesta (HMAC sul corpo non elaborato), quindi OpenClaw applica limiti rigorosi alla dimensione del corpo e un timeout prima dell'autenticazione prima della verifica.
- OpenClaw elabora gli eventi webhook dai byte non elaborati verificati della richiesta. I valori `req.body` trasformati da middleware a monte vengono ignorati per preservare l'integrità della firma.

## Configurazione

Configurazione minima:

```json5
{
  channels: {
    line: {
      enabled: true,
      channelAccessToken: "LINE_CHANNEL_ACCESS_TOKEN",
      channelSecret: "LINE_CHANNEL_SECRET",
      dmPolicy: "pairing",
    },
  },
}
```

Configurazione dei messaggi privati aperti:

```json5
{
  channels: {
    line: {
      enabled: true,
      channelAccessToken: "LINE_CHANNEL_ACCESS_TOKEN",
      channelSecret: "LINE_CHANNEL_SECRET",
      dmPolicy: "open",
      allowFrom: ["*"],
    },
  },
}
```

Variabili d'ambiente (solo account predefinito):

- `LINE_CHANNEL_ACCESS_TOKEN`
- `LINE_CHANNEL_SECRET`

File di token/segreto:

```json5
{
  channels: {
    line: {
      tokenFile: "/path/to/line-token.txt",
      secretFile: "/path/to/line-secret.txt",
    },
  },
}
```

`tokenFile` e `secretFile` devono puntare a file normali. I link simbolici vengono rifiutati.

Più account:

```json5
{
  channels: {
    line: {
      accounts: {
        marketing: {
          channelAccessToken: "...",
          channelSecret: "...",
          webhookPath: "/line/marketing",
        },
      },
    },
  },
}
```

## Controllo degli accessi

I messaggi privati richiedono l'associazione per impostazione predefinita. I mittenti sconosciuti ricevono un codice di associazione, e i loro
messaggi vengono ignorati fino all'approvazione.

```bash
openclaw pairing list line
openclaw pairing approve line <CODE>
```

Elenchi di autorizzazioni e criteri:

- `channels.line.dmPolicy`: `pairing | allowlist | open | disabled`
- `channels.line.allowFrom`: ID utente LINE consentiti per i messaggi privati; `dmPolicy: "open"` richiede `["*"]`
- `channels.line.groupPolicy`: `allowlist | open | disabled`
- `channels.line.groupAllowFrom`: ID utente LINE consentiti per i gruppi
- Override per singoli gruppi: `channels.line.groups.<groupId>.allowFrom`
- I gruppi di accesso statici dei mittenti possono essere referenziati da `allowFrom`, `groupAllowFrom` e dal `allowFrom` di gruppo tramite `accessGroup:<name>`.
- Nota sul runtime: se `channels.line` è completamente assente, il runtime torna a `groupPolicy="allowlist"` per i controlli sui gruppi (anche se è impostato `channels.defaults.groupPolicy`).

Gli ID LINE distinguono tra maiuscole e minuscole. Gli ID validi hanno questo formato:

- Utente: `U` + 32 caratteri esadecimali
- Gruppo: `C` + 32 caratteri esadecimali
- Stanza: `R` + 32 caratteri esadecimali

## Comportamento dei messaggi

- Il testo viene suddiviso in frammenti da 5000 caratteri.
- La formattazione Markdown viene rimossa; i blocchi di codice e le tabelle vengono convertiti, quando possibile, in Flex
  cards.
- Le risposte in streaming vengono memorizzate nel buffer; LINE riceve frammenti completi con animazione di caricamento
  mentre l'agente è in esecuzione.
- Il download dei media è limitato da `channels.line.mediaMaxMb` (10 per impostazione predefinita).
- I media in ingresso vengono salvati in `~/.openclaw/media/inbound/` prima di essere passati
  all'agente, in linea con l'archiviazione condivisa dei media usata dagli altri Plugin
  di canali integrati.

## Dati del canale (messaggi avanzati)

Usa `channelData.line` per inviare risposte rapide, posizioni, Flex cards o template
messages.

```json5
{
  text: "Here you go",
  channelData: {
    line: {
      quickReplies: ["Status", "Help"],
      location: {
        title: "Office",
        address: "123 Main St",
        latitude: 35.681236,
        longitude: 139.767125,
      },
      flexMessage: {
        altText: "Status card",
        contents: {
          /* Flex payload */
        },
      },
      templateMessage: {
        type: "confirm",
        text: "Proceed?",
        confirmLabel: "Yes",
        confirmData: "yes",
        cancelLabel: "No",
        cancelData: "no",
      },
    },
  },
}
```

Il Plugin LINE include anche il comando `/card` per preset di Flex messages:

```
/card info "Welcome" "Thanks for joining!"
```

## Supporto ACP

LINE supporta i collegamenti delle conversazioni ACP (Agent Communication Protocol):

- `/acp spawn <agent> --bind here` collega la chat LINE corrente a una sessione ACP senza creare un thread figlio.
- I collegamenti ACP configurati e le sessioni ACP attive collegate a una conversazione funzionano in LINE come negli altri canali di conversazione.

Vedi [agenti ACP](/it/tools/acp-agents) per i dettagli.

## Media in uscita

Il Plugin LINE supporta l'invio di immagini, video e file audio tramite lo strumento di messaggistica dell'agente. I media vengono inviati tramite un percorso di consegna specifico per LINE con gestione appropriata dell'anteprima e del tracciamento:

- **Immagini**: inviate come messaggi immagine LINE con generazione automatica dell'anteprima.
- **Video**: inviati con gestione esplicita dell'anteprima e del tipo di contenuto.
- **Audio**: inviato come messaggi audio LINE.

Gli URL dei media in uscita devono essere URL HTTPS pubblici. OpenClaw verifica il nome host di destinazione prima di passare l'URL a LINE e rifiuta local loopback, link-local e destinazioni in reti private.

Gli invii generici di media tornano al percorso esistente solo per immagini quando il percorso specifico per LINE non è disponibile.

## Risoluzione dei problemi

- **La verifica webhook non riesce:** assicurati che l'URL webhook usi HTTPS e
  che `channelSecret` corrisponda alla LINE console.
- **Nessun evento in ingresso:** conferma che il percorso webhook corrisponda a `channels.line.webhookPath`
  e che il gateway sia accessibile da LINE.
- **Errori di download dei media:** aumenta `channels.line.mediaMaxMb` se il media supera
  il limite predefinito.

## Vedi anche

- [Panoramica dei canali](/it/channels) — tutti i canali supportati
- [Associazione](/it/channels/pairing) — autenticazione dei messaggi privati e flusso di associazione
- [Gruppi](/it/channels/groups) — comportamento delle chat di gruppo e limitazione tramite menzioni
- [Instradamento dei canali](/it/channels/channel-routing) — instradamento delle sessioni per i messaggi
- [Sicurezza](/it/gateway/security) — modello di accesso e rafforzamento della protezione
