---
read_when:
    - Vuoi connettere OpenClaw a LINE
    - È necessaria la configurazione del Webhook LINE e delle credenziali
    - Vuoi opzioni di messaggio specifiche per LINE
summary: Setup, configurazione e utilizzo del Plugin LINE Messaging API
title: LINE
x-i18n:
    generated_at: "2026-06-28T22:33:26Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: d54b6740c3403d8fb2e815d969d891973d88c2e2ff43e9de7642c1c81d36e090
    source_path: hi/channels/line.md
    workflow: 16
---

LINE si collega a OpenClaw tramite LINE Messaging API. Il Plugin viene eseguito come ricevitore Webhook sul Gateway e usa il tuo channel access token + channel secret per l'autenticazione.

Stato: Plugin scaricabile. Sono supportati messaggi diretti, chat di gruppo, contenuti multimediali, posizioni, messaggi Flex, messaggi template e risposte rapide. Reactions e thread non sono supportati.

## Installare

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
4. Abilita **Use webhook** nelle impostazioni Messaging API.
5. Imposta il Webhook URL sul tuo endpoint Gateway (HTTPS è obbligatorio):

```
https://gateway-host/line/webhook
```

Il Gateway risponde alla verifica Webhook (GET) di LINE e accetta gli eventi inbound firmati (POST) subito dopo la validazione della firma e del payload; l'elaborazione dell'agent continua in modo asincrono.
Se ti serve un percorso personalizzato, imposta `channels.line.webhookPath` o
`channels.line.accounts.<id>.webhookPath` e aggiorna l'URL di conseguenza.

Nota di sicurezza:

- La verifica della firma LINE dipende dal body (HMAC sul raw body), quindi OpenClaw applica limiti rigorosi pre-auth sul body e timeout prima della verifica.
- OpenClaw elabora gli eventi Webhook dai byte raw verificati della richiesta. Per la sicurezza dell'integrità della firma, i valori `req.body` trasformati dal middleware upstream vengono ignorati.

## Configurare

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

Configurazione DM pubblici:

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

## Controllo accessi

I messaggi diretti usano pairing per impostazione predefinita. I mittenti sconosciuti ricevono un codice di pairing e i loro messaggi vengono ignorati finché non sono approvati.

```bash
openclaw pairing list line
openclaw pairing approve line <CODE>
```

Allowlist e policy:

- `channels.line.dmPolicy`: `pairing | allowlist | open | disabled`
- `channels.line.allowFrom`: ID utente LINE consentiti per i DM; per `dmPolicy: "open"` è richiesto `["*"]`
- `channels.line.groupPolicy`: `allowlist | open | disabled`
- `channels.line.groupAllowFrom`: ID utente LINE consentiti per i gruppi
- Override per gruppo: `channels.line.groups.<groupId>.allowFrom`
- I gruppi statici di accesso mittente possono essere referenziati da `allowFrom`, `groupAllowFrom` e `allowFrom` per gruppo con `accessGroup:<name>`.
- Nota runtime: se `channels.line` manca completamente, il runtime usa `groupPolicy="allowlist"` come fallback per i controlli di gruppo (anche se `channels.defaults.groupPolicy` è impostato).

Gli ID LINE distinguono maiuscole e minuscole. Gli ID validi hanno questo aspetto:

- Utente: `U` + 32 caratteri esadecimali
- Gruppo: `C` + 32 caratteri esadecimali
- Stanza: `R` + 32 caratteri esadecimali

## Comportamento dei messaggi

- Il testo viene diviso in chunk da 5000 caratteri.
- La formattazione Markdown viene rimossa; code block e tabelle vengono convertiti in card Flex quando possibile.
- Le risposte in streaming vengono bufferizzate; LINE riceve chunk completi con un'animazione di caricamento mentre l'agent lavora.
- I download dei media sono limitati da `channels.line.mediaMaxMb` (predefinito 10).
- I media inbound vengono salvati sotto `~/.openclaw/media/inbound/` prima di essere passati all'agent,
  in linea con lo store multimediale condiviso usato dagli altri Plugin di canale bundled.

## Dati canale (messaggi ricchi)

Usa `channelData.line` per inviare risposte rapide, posizioni, card Flex o messaggi template.

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
- I binding ACP configurati e le sessioni ACP attive associate a una conversazione funzionano su LINE come sugli altri canali di conversazione.

Per i dettagli, consulta [agent ACP](/it/tools/acp-agents).

## Media in uscita

Il Plugin LINE supporta l'invio di immagini, video e file audio tramite lo strumento messaggi dell'agent. I media vengono inviati tramite il percorso di consegna specifico di LINE con gestione appropriata di anteprima e tracciamento:

- **Immagini**: vengono inviate come messaggi immagine LINE con generazione automatica dell'anteprima.
- **Video**: vengono inviati con gestione esplicita di anteprima e content-type.
- **Audio**: viene inviato come messaggio audio LINE.

Gli URL dei media in uscita devono essere URL HTTPS pubblici. OpenClaw valida l'hostname di destinazione prima di consegnare l'URL a LINE e rifiuta destinazioni loopback, link-local e di rete privata.

Gli invii multimediali generici usano come fallback il percorso esistente solo per immagini quando il percorso specifico di LINE non è disponibile.

## Risoluzione problemi

- **Verifica Webhook non riuscita:** assicurati che il Webhook URL sia HTTPS e che
  `channelSecret` corrisponda alla console LINE.
- **Nessun evento inbound:** verifica che il percorso Webhook corrisponda a `channels.line.webhookPath`
  e che il Gateway sia raggiungibile da LINE.
- **Errori di download media:** se il media supera il limite predefinito, aumenta `channels.line.mediaMaxMb`.

## Correlati

- [Panoramica canali](/it/channels) — tutti i canali supportati
- [Pairing](/it/channels/pairing) — autenticazione DM e flusso di pairing
- [Gruppi](/it/channels/groups) — comportamento delle chat di gruppo e gating delle menzioni
- [Routing canale](/it/channels/channel-routing) — routing delle sessioni per i messaggi
- [Sicurezza](/it/gateway/security) — modello di accesso e hardening
