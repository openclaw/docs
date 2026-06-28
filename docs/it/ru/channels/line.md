---
read_when:
    - Vuoi connettere OpenClaw a LINE
    - È necessario configurare il Webhook LINE e le credenziali
    - Ti servono parametri dei messaggi specifici per LINE
summary: Installazione, configurazione e utilizzo del Plugin LINE Messaging API
title: LINE
x-i18n:
    generated_at: "2026-06-28T20:45:15Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 9a6c76ea64b92b76dd2f6ab0d9fff7eb316e1940ba660d65262307796b5a6abc
    source_path: ru/channels/line.md
    workflow: 16
---

LINE si connette a OpenClaw tramite LINE Messaging API. Il Plugin funziona come ricevitore webhook
sul Gateway e usa il tuo channel access token + channel secret per
l'autenticazione.

Stato: Plugin caricabile. Sono supportati messaggi diretti, chat di gruppo, contenuti multimediali, posizioni, Flex
messages, template messages e risposte rapide. Reazioni e thread
non sono supportati.

## Installazione

Installa LINE prima di configurare il canale:

```bash
openclaw plugins install @openclaw/line
```

Copia di lavoro locale (quando eseguita da un repository git):

```bash
openclaw plugins install ./path/to/local/line-plugin
```

## Configurazione

1. Crea un account LINE Developers e apri la Console:
   [https://developers.line.biz/console/](https://developers.line.biz/console/)
2. Crea (o seleziona) un Provider e aggiungi un canale **Messaging API**.
3. Copia **Channel access token** e **Channel secret** dalle impostazioni del canale.
4. Abilita **Use webhook** nelle impostazioni Messaging API.
5. Imposta l'URL webhook per il tuo endpoint Gateway (HTTPS richiesto):

```
https://gateway-host/line/webhook
```

Il Gateway risponde alla verifica webhook di LINE (GET) e conferma gli eventi
in ingresso firmati (POST) subito dopo la verifica della firma e del payload; l'elaborazione
da parte dell'agente continua in modo asincrono.
Se serve un percorso personalizzato, imposta `channels.line.webhookPath` oppure
`channels.line.accounts.<id>.webhookPath` e aggiorna l'URL di conseguenza.

Nota sulla sicurezza:

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

Configurazione dei messaggi diretti aperti:

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

Variabili di ambiente (solo account predefinito):

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

`tokenFile` e `secretFile` devono puntare a file regolari. I link simbolici vengono rifiutati.

Account multipli:

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

Per impostazione predefinita i messaggi diretti richiedono l'abbinamento. I mittenti sconosciuti ricevono un codice di abbinamento e i loro
messaggi vengono ignorati fino all'approvazione.

```bash
openclaw pairing list line
openclaw pairing approve line <CODE>
```

Elenchi di autorizzazioni e criteri:

- `channels.line.dmPolicy`: `pairing | allowlist | open | disabled`
- `channels.line.allowFrom`: ID utente LINE consentiti per i messaggi diretti; `dmPolicy: "open"` richiede `["*"]`
- `channels.line.groupPolicy`: `allowlist | open | disabled`
- `channels.line.groupAllowFrom`: ID utente LINE consentiti per i gruppi
- Override per singoli gruppi: `channels.line.groups.<groupId>.allowFrom`
- I gruppi statici di accesso dei mittenti possono essere referenziati da `allowFrom`, `groupAllowFrom` e dal `allowFrom` di gruppo tramite `accessGroup:<name>`.
- Nota sul runtime: se `channels.line` è completamente assente, il runtime torna a `groupPolicy="allowlist"` per i controlli sui gruppi (anche se `channels.defaults.groupPolicy` è impostato).

Gli ID LINE distinguono maiuscole e minuscole. Gli ID validi hanno questo formato:

- Utente: `U` + 32 caratteri esadecimali
- Gruppo: `C` + 32 caratteri esadecimali
- Stanza: `R` + 32 caratteri esadecimali

## Comportamento dei messaggi

- Il testo viene suddiviso in blocchi da 5000 caratteri.
- La formattazione Markdown viene rimossa; blocchi di codice e tabelle vengono convertiti, quando possibile, in Flex
  cards.
- Le risposte in streaming vengono bufferizzate; LINE riceve blocchi completi con un'animazione di caricamento
  mentre l'agente lavora.
- Il download dei media è limitato da `channels.line.mediaMaxMb` (predefinito 10).
- I media in ingresso vengono salvati in `~/.openclaw/media/inbound/` prima di essere passati
  all'agente, in linea con l'archiviazione multimediale comune usata dagli altri Plugin
  di canale integrati.

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

Il Plugin LINE include anche il comando `/card` per i preset di Flex messages:

```
/card info "Welcome" "Thanks for joining!"
```

## Supporto ACP

LINE supporta i binding delle conversazioni ACP (Agent Communication Protocol):

- `/acp spawn <agent> --bind here` associa la chat LINE corrente a una sessione ACP senza creare un thread figlio.
- I binding ACP configurati e le sessioni ACP attive associate a una conversazione funzionano in LINE come negli altri canali di conversazione.

Consulta [agenti ACP](/it/tools/acp-agents) per i dettagli.

## Media in uscita

Il Plugin LINE supporta l'invio di immagini, video e file audio tramite lo strumento di messaggistica dell'agente. I media vengono inviati tramite il percorso di consegna specifico di LINE con gestione appropriata di anteprima e tracciamento:

- **Immagini**: inviate come messaggi immagine LINE con generazione automatica dell'anteprima.
- **Video**: inviati con gestione esplicita dell'anteprima e del tipo di contenuto.
- **Audio**: inviati come messaggi audio LINE.

Gli URL dei media in uscita devono essere URL HTTPS pubblici. OpenClaw verifica il nome host di destinazione prima di passare l'URL a LINE e rifiuta local loopback, link-local e destinazioni in reti private.

Gli invii multimediali generici ricorrono al percorso esistente solo per le immagini quando il percorso specifico di LINE non è disponibile.

## Risoluzione dei problemi

- **La verifica webhook non riesce:** assicurati che l'URL webhook usi HTTPS e
  che `channelSecret` corrisponda alla LINE console.
- **Nessun evento in ingresso:** conferma che il percorso webhook corrisponda a `channels.line.webhookPath`
  e che il Gateway sia raggiungibile da LINE.
- **Errori di download dei media:** aumenta `channels.line.mediaMaxMb` se i media superano
  il limite predefinito.

## Vedi anche

- [Panoramica dei canali](/it/channels) — tutti i canali supportati
- [Abbinamento](/it/channels/pairing) — autenticazione dei messaggi diretti e flusso di abbinamento
- [Gruppi](/it/channels/groups) — comportamento delle chat di gruppo e limitazione per menzioni
- [Instradamento dei canali](/it/channels/channel-routing) — instradamento delle sessioni per i messaggi
- [Sicurezza](/it/gateway/security) — modello di accesso e rafforzamento della protezione
