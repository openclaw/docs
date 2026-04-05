---
read_when:
    - Vuoi connettere OpenClaw a LINE
    - Hai bisogno della configurazione di webhook e credenziali LINE
    - Vuoi opzioni di messaggio specifiche per LINE
summary: Configurazione, setup e utilizzo del plugin LINE Messaging API
title: LINE
x-i18n:
    generated_at: "2026-04-05T13:43:14Z"
    model: gpt-5.4
    provider: openai
    source_hash: b4782b2aa3e8654505d7f1fd6fc112adf125b5010fc84d655d033688ded37414
    source_path: channels/line.md
    workflow: 15
---

# LINE

LINE si connette a OpenClaw tramite la LINE Messaging API. Il plugin viene eseguito come ricevitore di webhook
sul gateway e usa il tuo channel access token e channel secret per
l'autenticazione.

Stato: plugin incluso. Sono supportati messaggi diretti, chat di gruppo, contenuti multimediali, posizioni, messaggi Flex,
messaggi template e risposte rapide. Reazioni e thread
non sono supportati.

## Plugin incluso

LINE è fornito come plugin incluso nelle attuali release di OpenClaw, quindi le normali
build pacchettizzate non richiedono un'installazione separata.

Se usi una build più vecchia o un'installazione personalizzata che esclude LINE, installalo
manualmente:

```bash
openclaw plugins install @openclaw/line
```

Checkout locale (quando esegui da un repository git):

```bash
openclaw plugins install ./path/to/local/line-plugin
```

## Configurazione iniziale

1. Crea un account LINE Developers e apri la Console:
   [https://developers.line.biz/console/](https://developers.line.biz/console/)
2. Crea (o seleziona) un Provider e aggiungi un canale **Messaging API**.
3. Copia il **Channel access token** e il **Channel secret** dalle impostazioni del canale.
4. Abilita **Use webhook** nelle impostazioni della Messaging API.
5. Imposta l'URL del webhook sull'endpoint del tuo gateway (HTTPS obbligatorio):

```
https://gateway-host/line/webhook
```

Il gateway risponde alla verifica del webhook di LINE (GET) e agli eventi in ingresso (POST).
Se hai bisogno di un percorso personalizzato, imposta `channels.line.webhookPath` oppure
`channels.line.accounts.<id>.webhookPath` e aggiorna l'URL di conseguenza.

Nota di sicurezza:

- La verifica della firma LINE dipende dal body (HMAC sul body grezzo), quindi OpenClaw applica limiti rigorosi sul body pre-auth e timeout prima della verifica.
- OpenClaw elabora gli eventi webhook a partire dai byte grezzi verificati della richiesta. I valori `req.body` trasformati dal middleware a monte vengono ignorati per garantire l'integrità della firma.

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

I messaggi diretti usano per impostazione predefinita il pairing. I mittenti sconosciuti ricevono un codice di pairing e i loro
messaggi vengono ignorati finché non vengono approvati.

```bash
openclaw pairing list line
openclaw pairing approve line <CODE>
```

Allowlist e policy:

- `channels.line.dmPolicy`: `pairing | allowlist | open | disabled`
- `channels.line.allowFrom`: ID utente LINE autorizzati per i DM
- `channels.line.groupPolicy`: `allowlist | open | disabled`
- `channels.line.groupAllowFrom`: ID utente LINE autorizzati per i gruppi
- Override per gruppo: `channels.line.groups.<groupId>.allowFrom`
- Nota di runtime: se `channels.line` è completamente assente, il runtime usa `groupPolicy="allowlist"` come fallback per i controlli di gruppo (anche se `channels.defaults.groupPolicy` è impostato).

Gli ID LINE distinguono tra maiuscole e minuscole. Gli ID validi hanno questo aspetto:

- Utente: `U` + 32 caratteri esadecimali
- Gruppo: `C` + 32 caratteri esadecimali
- Room: `R` + 32 caratteri esadecimali

## Comportamento dei messaggi

- Il testo viene suddiviso in blocchi da 5000 caratteri.
- La formattazione Markdown viene rimossa; i blocchi di codice e le tabelle vengono convertiti in card Flex
  quando possibile.
- Le risposte in streaming vengono messe in buffer; LINE riceve blocchi completi con un'animazione
  di caricamento mentre l'agente lavora.
- I download multimediali sono limitati da `channels.line.mediaMaxMb` (predefinito 10).

## Dati del canale (messaggi avanzati)

Usa `channelData.line` per inviare risposte rapide, posizioni, card Flex o messaggi
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

Il plugin LINE include anche un comando `/card` per preset di messaggi Flex:

```
/card info "Welcome" "Thanks for joining!"
```

## Supporto ACP

LINE supporta i binding di conversazione ACP (Agent Communication Protocol):

- `/acp spawn <agent> --bind here` collega la chat LINE corrente a una sessione ACP senza creare un thread figlio.
- I binding ACP configurati e le sessioni ACP attive collegate alla conversazione funzionano su LINE come sugli altri canali di conversazione.

Vedi [Agenti ACP](/tools/acp-agents) per i dettagli.

## Contenuti multimediali in uscita

Il plugin LINE supporta l'invio di immagini, video e file audio tramite lo strumento di messaggistica dell'agente. I contenuti multimediali vengono inviati tramite il percorso di consegna specifico per LINE con gestione appropriata di anteprima e tracciamento:

- **Immagini**: inviate come messaggi immagine LINE con generazione automatica dell'anteprima.
- **Video**: inviati con gestione esplicita di anteprima e content-type.
- **Audio**: inviati come messaggi audio LINE.

Gli invii multimediali generici usano come fallback il percorso esistente solo per immagini quando un percorso specifico per LINE non è disponibile.

## Risoluzione dei problemi

- **La verifica del webhook fallisce:** assicurati che l'URL del webhook usi HTTPS e che il
  `channelSecret` corrisponda a quello nella console LINE.
- **Nessun evento in ingresso:** conferma che il percorso del webhook corrisponda a `channels.line.webhookPath`
  e che il gateway sia raggiungibile da LINE.
- **Errori nel download dei contenuti multimediali:** aumenta `channels.line.mediaMaxMb` se i contenuti superano il
  limite predefinito.

## Correlati

- [Panoramica dei canali](/channels) — tutti i canali supportati
- [Pairing](/channels/pairing) — autenticazione DM e flusso di pairing
- [Gruppi](/channels/groups) — comportamento delle chat di gruppo e gating delle menzioni
- [Instradamento dei canali](/channels/channel-routing) — instradamento della sessione per i messaggi
- [Sicurezza](/gateway/security) — modello di accesso e hardening
