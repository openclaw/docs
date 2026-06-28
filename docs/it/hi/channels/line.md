---
read_when:
    - Vuoi connettere OpenClaw a LINE
    - È necessaria la configurazione di LINE Webhook + credenziali
    - Vuoi opzioni di messaggio specifiche per LINE
summary: Configurazione, configurazione e utilizzo del Plugin LINE Messaging API
title: LINE
x-i18n:
    generated_at: "2026-06-28T20:43:24Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: d54b6740c3403d8fb2e815d969d891973d88c2e2ff43e9de7642c1c81d36e090
    source_path: hi/channels/line.md
    workflow: 16
---

LINE si collega a OpenClaw tramite LINE Messaging API. Il Plugin viene eseguito sul Gateway come ricevitore Webhook
e usa il tuo channel access token + channel secret per l'autenticazione.

Stato: Plugin scaricabile. Sono supportati messaggi diretti, chat di gruppo, media, posizioni, messaggi Flex,
messaggi template e risposte rapide. Reazioni e thread
non sono supportati.

## Installa

Installa LINE prima di configurare il canale:

```bash
openclaw plugins install @openclaw/line
```

Checkout locale (quando esegui da un repo git):

```bash
openclaw plugins install ./path/to/local/line-plugin
```

## Configurazione

1. Crea un account LINE Developers e apri la Console:
   [https://developers.line.biz/console/](https://developers.line.biz/console/)
2. Crea (o seleziona) un Provider e aggiungi un canale **Messaging API**.
3. Copia **Channel access token** e **Channel secret** dalle impostazioni del canale.
4. Abilita **Use webhook** nelle impostazioni di Messaging API.
5. Imposta il Webhook URL sull'endpoint del tuo Gateway (HTTPS è obbligatorio):

```
https://gateway-host/line/webhook
```

Il Gateway risponde alla verifica Webhook di LINE (GET) e accetta gli eventi inbound firmati (POST) subito dopo la validazione di firma e payload; l'elaborazione dell'agent
continua in modo asincrono.
Se ti serve un percorso personalizzato, imposta `channels.line.webhookPath` o
`channels.line.accounts.<id>.webhookPath` e aggiorna l'URL di conseguenza.

Nota di sicurezza:

- La verifica della firma LINE dipende dal body (HMAC sul raw body), quindi OpenClaw applica limiti rigidi pre-auth sul body e timeout prima della verifica.
- OpenClaw elabora gli eventi Webhook dai byte raw verificati della richiesta. Per la sicurezza dell'integrità della firma, i valori `req.body` trasformati da middleware upstream vengono ignorati.

## Configura

Config minima:

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

Config DM pubblica:

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

File token/secret:

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

`tokenFile` e `secretFile` devono puntare a file regolari. I symlink vengono rifiutati.

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

I messaggi diretti usano pairing per impostazione predefinita. I mittenti sconosciuti ricevono un codice di pairing e i loro
messaggi vengono ignorati finché non vengono approvati.

```bash
openclaw pairing list line
openclaw pairing approve line <CODE>
```

Allowlist e criteri:

- `channels.line.dmPolicy`: `pairing | allowlist | open | disabled`
- `channels.line.allowFrom`: ID utente LINE allowlisted per i DM; per `dmPolicy: "open"` è necessario `["*"]`
- `channels.line.groupPolicy`: `allowlist | open | disabled`
- `channels.line.groupAllowFrom`: ID utente LINE allowlisted per i gruppi
- Override per gruppo: `channels.line.groups.<groupId>.allowFrom`
- I gruppi di accesso statici dei mittenti possono essere referenziati da `allowFrom`, `groupAllowFrom` e `allowFrom` per gruppo con `accessGroup:<name>`.
- Nota runtime: se `channels.line` manca completamente, il runtime ripiega su `groupPolicy="allowlist"` per i controlli di gruppo (anche se `channels.defaults.groupPolicy` è impostato).

Gli ID LINE distinguono tra maiuscole e minuscole. Gli ID validi hanno questo aspetto:

- Utente: `U` + 32 caratteri esadecimali
- Gruppo: `C` + 32 caratteri esadecimali
- Room: `R` + 32 caratteri esadecimali

## Comportamento dei messaggi

- Il testo viene suddiviso in chunk da 5000 caratteri.
- La formattazione Markdown viene rimossa; code block e tabelle vengono convertiti in schede Flex
  quando possibile.
- Le risposte in streaming vengono bufferizzate; mentre l'agent lavora, LINE riceve chunk completi
  con animazione di caricamento.
- I download dei media sono limitati da `channels.line.mediaMaxMb` (predefinito 10).
- I media inbound vengono salvati in `~/.openclaw/media/inbound/` prima di essere passati all'agent,
  in linea con lo store media condiviso usato dagli altri Plugin
  di canale bundled.

## Dati del canale (messaggi ricchi)

Usa `channelData.line` per inviare risposte rapide, posizioni, schede Flex o messaggi
template.

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

Il Plugin LINE fornisce anche il comando `/card` per i preset dei messaggi Flex:

```
/card info "Welcome" "Thanks for joining!"
```

## Supporto ACP

LINE supporta i binding di conversazione ACP (Agent Communication Protocol):

- `/acp spawn <agent> --bind here` associa la chat LINE corrente alla sessione ACP senza creare un thread figlio.
- I binding ACP configurati e le sessioni ACP attive associate a conversazioni funzionano su LINE come sugli altri canali di conversazione.

Per i dettagli, consulta [agent ACP](/it/tools/acp-agents).

## Media in uscita

Il Plugin LINE supporta l'invio di immagini, video e file audio tramite lo strumento messaggi dell'agent. I media vengono inviati tramite un percorso di consegna specifico per LINE con gestione appropriata di anteprima e tracking:

- **Immagini**: vengono inviate come messaggi immagine LINE con generazione automatica dell'anteprima.
- **Video**: vengono inviati con gestione esplicita dell'anteprima e del content-type.
- **Audio**: viene inviato come messaggi audio LINE.

Gli URL dei media in uscita devono essere URL HTTPS pubblici. OpenClaw valida l'hostname di destinazione prima di consegnare l'URL a LINE e rifiuta destinazioni loopback, link-local e private-network.

Gli invii media generici ripiegano sul percorso esistente solo per immagini quando il percorso specifico di LINE non è disponibile.

## Risoluzione dei problemi

- **La verifica del Webhook non riesce:** assicurati che il Webhook URL sia HTTPS e che
  `channelSecret` corrisponda alla console LINE.
- **Nessun evento inbound:** conferma che il percorso Webhook corrisponda a `channels.line.webhookPath`
  e che il Gateway sia raggiungibile da LINE.
- **Errori di download dei media:** se i media superano il limite predefinito, aumenta `channels.line.mediaMaxMb`.

## Correlati

- [Panoramica dei canali](/it/channels) — tutti i canali supportati
- [Pairing](/it/channels/pairing) — autenticazione DM e flusso di pairing
- [Gruppi](/it/channels/groups) — comportamento delle chat di gruppo e gate sulle menzioni
- [Instradamento canale](/it/channels/channel-routing) — instradamento delle sessioni per i messaggi
- [Sicurezza](/it/gateway/security) — modello di accesso e hardening
