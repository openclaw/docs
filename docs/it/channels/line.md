---
read_when:
    - Vuoi collegare OpenClaw a LINE
    - È necessaria la configurazione del Webhook e delle credenziali LINE
    - Vuoi opzioni di messaggio specifiche per LINE
summary: Configurazione iniziale, configurazione e utilizzo del Plugin LINE Messaging API
title: RIGA
x-i18n:
    generated_at: "2026-04-30T08:38:01Z"
    model: gpt-5.5
    provider: openai
    source_hash: e9f06d882f1e8d2a758e50459fadefd77796a68c28f63bef5790eb1b540c17d1
    source_path: channels/line.md
    workflow: 16
---

LINE si connette a OpenClaw tramite la LINE Messaging API. Il Plugin viene eseguito come ricevitore Webhook sul Gateway e usa il token di accesso al canale + il segreto del canale per l'autenticazione.

Stato: Plugin in bundle. Sono supportati messaggi diretti, chat di gruppo, media, posizioni, messaggi Flex, messaggi modello e risposte rapide. Reazioni e thread non sono supportati.

## Plugin in bundle

LINE viene distribuito come Plugin in bundle nelle versioni attuali di OpenClaw, quindi le normali build pacchettizzate non richiedono un'installazione separata.

Se usi una build precedente o un'installazione personalizzata che esclude LINE, installa un pacchetto npm aggiornato quando viene pubblicato:

```bash
openclaw plugins install @openclaw/line
```

Se npm segnala che il pacchetto di proprietà di OpenClaw è deprecato o mancante, usa una build pacchettizzata aggiornata di OpenClaw o un checkout locale finché il treno dei pacchetti npm non si riallinea.

Checkout locale (quando esegui da un repository git):

```bash
openclaw plugins install ./path/to/local/line-plugin
```

## Configurazione iniziale

1. Crea un account LINE Developers e apri la Console:
   [https://developers.line.biz/console/](https://developers.line.biz/console/)
2. Crea (o scegli) un Provider e aggiungi un canale **Messaging API**.
3. Copia il **Channel access token** e il **Channel secret** dalle impostazioni del canale.
4. Abilita **Use webhook** nelle impostazioni della Messaging API.
5. Imposta l'URL del Webhook sull'endpoint del tuo Gateway (HTTPS richiesto):

```
https://gateway-host/line/webhook
```

Il Gateway risponde alla verifica Webhook di LINE (GET) e agli eventi in ingresso (POST).
Se ti serve un percorso personalizzato, imposta `channels.line.webhookPath` o
`channels.line.accounts.<id>.webhookPath` e aggiorna l'URL di conseguenza.

Nota di sicurezza:

- La verifica della firma LINE dipende dal corpo (HMAC sul corpo grezzo), quindi OpenClaw applica limiti rigorosi del corpo prima dell'autenticazione e un timeout prima della verifica.
- OpenClaw elabora gli eventi Webhook dai byte grezzi verificati della richiesta. I valori `req.body` trasformati da middleware upstream vengono ignorati per la sicurezza dell'integrità della firma.

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

Variabili env (solo account predefinito):

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

I messaggi diretti usano l'abbinamento per impostazione predefinita. I mittenti sconosciuti ricevono un codice di abbinamento e i loro messaggi vengono ignorati finché non vengono approvati.

```bash
openclaw pairing list line
openclaw pairing approve line <CODE>
```

Allowlist e criteri:

- `channels.line.dmPolicy`: `pairing | allowlist | open | disabled`
- `channels.line.allowFrom`: ID utente LINE consentiti per i DM
- `channels.line.groupPolicy`: `allowlist | open | disabled`
- `channels.line.groupAllowFrom`: ID utente LINE consentiti per i gruppi
- Override per gruppo: `channels.line.groups.<groupId>.allowFrom`
- Nota di runtime: se `channels.line` è completamente assente, il runtime ripiega su `groupPolicy="allowlist"` per i controlli dei gruppi (anche se `channels.defaults.groupPolicy` è impostato).

Gli ID LINE distinguono tra maiuscole e minuscole. Gli ID validi hanno questo aspetto:

- Utente: `U` + 32 caratteri esadecimali
- Gruppo: `C` + 32 caratteri esadecimali
- Stanza: `R` + 32 caratteri esadecimali

## Comportamento dei messaggi

- Il testo viene suddiviso in blocchi di 5000 caratteri.
- La formattazione Markdown viene rimossa; blocchi di codice e tabelle vengono convertiti in schede Flex quando possibile.
- Le risposte in streaming vengono bufferizzate; LINE riceve blocchi completi con un'animazione di caricamento mentre l'agente lavora.
- I download dei media sono limitati da `channels.line.mediaMaxMb` (predefinito 10).
- I media in ingresso vengono salvati in `~/.openclaw/media/inbound/` prima di essere passati all'agente, in linea con l'archivio media condiviso usato dagli altri Plugin di canale in bundle.

## Dati del canale (messaggi avanzati)

Usa `channelData.line` per inviare risposte rapide, posizioni, schede Flex o messaggi modello.

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

- `/acp spawn <agent> --bind here` associa la chat LINE corrente a una sessione ACP senza creare un thread figlio.
- I binding ACP configurati e le sessioni ACP attive associate alla conversazione funzionano su LINE come sugli altri canali di conversazione.

Vedi [agenti ACP](/it/tools/acp-agents) per i dettagli.

## Media in uscita

Il Plugin LINE supporta l'invio di immagini, video e file audio tramite lo strumento di messaggistica dell'agente. I media vengono inviati tramite il percorso di consegna specifico di LINE con gestione appropriata di anteprima e tracciamento:

- **Immagini**: inviate come messaggi immagine LINE con generazione automatica dell'anteprima.
- **Video**: inviati con gestione esplicita dell'anteprima e del tipo di contenuto.
- **Audio**: inviati come messaggi audio LINE.

Gli URL dei media in uscita devono essere URL HTTPS pubblici. OpenClaw convalida il nome host di destinazione prima di passare l'URL a LINE e rifiuta destinazioni local loopback, link-local e di rete privata.

Gli invii generici di media ripiegano sul percorso esistente per sole immagini quando un percorso specifico di LINE non è disponibile.

## Risoluzione dei problemi

- **La verifica del Webhook non riesce:** assicurati che l'URL del Webhook sia HTTPS e che il `channelSecret` corrisponda alla console LINE.
- **Nessun evento in ingresso:** verifica che il percorso del Webhook corrisponda a `channels.line.webhookPath` e che il Gateway sia raggiungibile da LINE.
- **Errori di download dei media:** aumenta `channels.line.mediaMaxMb` se i media superano il limite predefinito.

## Correlati

- [Panoramica dei canali](/it/channels) — tutti i canali supportati
- [Abbinamento](/it/channels/pairing) — autenticazione DM e flusso di abbinamento
- [Gruppi](/it/channels/groups) — comportamento delle chat di gruppo e filtro delle menzioni
- [Instradamento dei canali](/it/channels/channel-routing) — instradamento delle sessioni per i messaggi
- [Sicurezza](/it/gateway/security) — modello di accesso e hardening
