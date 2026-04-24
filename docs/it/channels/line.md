---
read_when:
    - Vuoi collegare OpenClaw a LINE
    - Hai bisogno della configurazione del Webhook LINE e delle credenziali
    - Vuoi opzioni di messaggio specifiche di LINE
summary: Configurazione, impostazione e utilizzo del Plugin LINE Messaging API
title: LINE
x-i18n:
    generated_at: "2026-04-24T08:30:11Z"
    model: gpt-5.4
    provider: openai
    source_hash: a8c3187486033ab01c243f1d44518cad2b28f744a9d0cde1de9117bd26452ed4
    source_path: channels/line.md
    workflow: 15
---

LINE si collega a OpenClaw tramite la LINE Messaging API. Il Plugin viene eseguito come ricevitore Webhook sul gateway e usa il tuo token di accesso al canale e il segreto del canale per l’autenticazione.

Stato: Plugin incluso. Sono supportati messaggi diretti, chat di gruppo, contenuti multimediali, posizioni, messaggi Flex, messaggi template e risposte rapide. Reazioni e thread non sono supportati.

## Plugin incluso

LINE viene distribuito come Plugin incluso nelle versioni attuali di OpenClaw, quindi le normali build pacchettizzate non richiedono un’installazione separata.

Se usi una build più vecchia o un’installazione personalizzata che esclude LINE, installalo manualmente:

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
5. Imposta l’URL del Webhook sul tuo endpoint gateway (HTTPS obbligatorio):

```
https://gateway-host/line/webhook
```

Il gateway risponde alla verifica del Webhook di LINE (GET) e agli eventi in ingresso (POST).
Se hai bisogno di un percorso personalizzato, imposta `channels.line.webhookPath` oppure
`channels.line.accounts.<id>.webhookPath` e aggiorna di conseguenza l’URL.

Nota sulla sicurezza:

- La verifica della firma LINE dipende dal body (HMAC sul body grezzo), quindi OpenClaw applica limiti rigidi sul body pre-auth e timeout prima della verifica.
- OpenClaw elabora gli eventi Webhook a partire dai byte grezzi della richiesta verificata. I valori `req.body` trasformati da middleware upstream vengono ignorati per preservare l’integrità della firma.

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

Variabili d’ambiente (solo account predefinito):

- `LINE_CHANNEL_ACCESS_TOKEN`
- `LINE_CHANNEL_SECRET`

File token/segreto:

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

I messaggi diretti usano per impostazione predefinita il pairing. I mittenti sconosciuti ricevono un codice di pairing e i loro messaggi vengono ignorati finché non vengono approvati.

```bash
openclaw pairing list line
openclaw pairing approve line <CODE>
```

Allowlist e policy:

- `channels.line.dmPolicy`: `pairing | allowlist | open | disabled`
- `channels.line.allowFrom`: ID utente LINE in allowlist per i DM
- `channels.line.groupPolicy`: `allowlist | open | disabled`
- `channels.line.groupAllowFrom`: ID utente LINE in allowlist per i gruppi
- Override per gruppo: `channels.line.groups.<groupId>.allowFrom`
- Nota di runtime: se `channels.line` manca completamente, il runtime usa come fallback `groupPolicy="allowlist"` per i controlli dei gruppi (anche se `channels.defaults.groupPolicy` è impostato).

Gli ID LINE sono sensibili a maiuscole e minuscole. Gli ID validi hanno questa forma:

- Utente: `U` + 32 caratteri esadecimali
- Gruppo: `C` + 32 caratteri esadecimali
- Stanza: `R` + 32 caratteri esadecimali

## Comportamento dei messaggi

- Il testo viene suddiviso in blocchi da 5000 caratteri.
- La formattazione Markdown viene rimossa; blocchi di codice e tabelle vengono convertiti in card Flex quando possibile.
- Le risposte in streaming vengono messe in buffer; LINE riceve blocchi completi con un’animazione di caricamento mentre l’agente lavora.
- I download dei media sono limitati da `channels.line.mediaMaxMb` (predefinito 10).

## Dati del canale (messaggi avanzati)

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

Il Plugin LINE include anche un comando `/card` per preset di messaggi Flex:

```
/card info "Welcome" "Thanks for joining!"
```

## Supporto ACP

LINE supporta i binding di conversazione ACP (Agent Communication Protocol):

- `/acp spawn <agent> --bind here` collega la chat LINE corrente a una sessione ACP senza creare un thread figlio.
- I binding ACP configurati e le sessioni ACP attive collegate alla conversazione funzionano su LINE come sugli altri canali di conversazione.

Vedi [Agenti ACP](/it/tools/acp-agents) per i dettagli.

## Media in uscita

Il Plugin LINE supporta l’invio di immagini, video e file audio tramite lo strumento di messaggistica dell’agente. I media vengono inviati tramite il percorso di consegna specifico di LINE con gestione appropriata di anteprima e tracciamento:

- **Immagini**: inviate come messaggi immagine LINE con generazione automatica dell’anteprima.
- **Video**: inviati con gestione esplicita di anteprima e content-type.
- **Audio**: inviati come messaggi audio LINE.

Gli URL dei media in uscita devono essere URL HTTPS pubblici. OpenClaw valida l’hostname di destinazione prima di passare l’URL a LINE e rifiuta destinazioni loopback, link-local e di rete privata.

Gli invii media generici usano come fallback il percorso esistente solo immagini quando un percorso specifico LINE non è disponibile.

## Risoluzione dei problemi

- **La verifica del Webhook fallisce:** assicurati che l’URL del Webhook usi HTTPS e che `channelSecret` corrisponda a quello nella console LINE.
- **Nessun evento in ingresso:** conferma che il percorso del Webhook corrisponda a `channels.line.webhookPath` e che il gateway sia raggiungibile da LINE.
- **Errori di download dei media:** aumenta `channels.line.mediaMaxMb` se i media superano il limite predefinito.

## Correlati

- [Panoramica dei canali](/it/channels) — tutti i canali supportati
- [Pairing](/it/channels/pairing) — autenticazione DM e flusso di pairing
- [Groups](/it/channels/groups) — comportamento delle chat di gruppo e gating delle menzioni
- [Channel Routing](/it/channels/channel-routing) — instradamento delle sessioni per i messaggi
- [Security](/it/gateway/security) — modello di accesso e hardening
