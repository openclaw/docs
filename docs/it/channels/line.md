---
read_when:
    - Vuoi collegare OpenClaw a LINE
    - Serve la configurazione del Webhook LINE e delle credenziali
    - Vuoi opzioni di messaggistica specifiche per LINE
summary: Installazione, configurazione e utilizzo del Plugin LINE Messaging API
title: RIGA
x-i18n:
    generated_at: "2026-05-06T08:40:48Z"
    model: gpt-5.5
    provider: openai
    source_hash: d9d2880bd27e11b72b51ad8a1e8c9e9d41adb51622edf890554594b90d24cd8d
    source_path: channels/line.md
    workflow: 16
---

LINE si connette a OpenClaw tramite la LINE Messaging API. Il Plugin viene eseguito come ricevitore webhook sul gateway e usa il token di accesso del canale + il segreto del canale per l'autenticazione.

Stato: Plugin scaricabile. Sono supportati messaggi diretti, chat di gruppo, contenuti multimediali, posizioni, messaggi Flex, messaggi template e risposte rapide. Reazioni e thread non sono supportati.

## Installazione

Installa LINE prima di configurare il canale:

```bash
openclaw plugins install @openclaw/line
```

Checkout locale (quando l'esecuzione avviene da un repository git):

```bash
openclaw plugins install ./path/to/local/line-plugin
```

## Configurazione iniziale

1. Crea un account LINE Developers e apri la Console:
   [https://developers.line.biz/console/](https://developers.line.biz/console/)
2. Crea (o scegli) un Provider e aggiungi un canale **Messaging API**.
3. Copia il **Channel access token** e il **Channel secret** dalle impostazioni del canale.
4. Abilita **Use webhook** nelle impostazioni della Messaging API.
5. Imposta l'URL del webhook sull'endpoint del tuo gateway (HTTPS richiesto):

```
https://gateway-host/line/webhook
```

Il gateway risponde alla verifica webhook di LINE (GET) e agli eventi in ingresso (POST).
Se ti serve un percorso personalizzato, imposta `channels.line.webhookPath` o
`channels.line.accounts.<id>.webhookPath` e aggiorna l'URL di conseguenza.

Nota di sicurezza:

- La verifica della firma LINE dipende dal corpo (HMAC sul corpo grezzo), quindi OpenClaw applica limiti del corpo pre-autenticazione rigorosi e un timeout prima della verifica.
- OpenClaw elabora gli eventi webhook dai byte grezzi della richiesta verificata. I valori `req.body` trasformati da middleware upstream vengono ignorati per sicurezza dell'integrità della firma.

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

Configurazione DM pubblica:

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

I messaggi diretti usano per impostazione predefinita l'associazione. I mittenti sconosciuti ricevono un codice di associazione e i loro
messaggi vengono ignorati finché non vengono approvati.

```bash
openclaw pairing list line
openclaw pairing approve line <CODE>
```

Allowlist e criteri:

- `channels.line.dmPolicy`: `pairing | allowlist | open | disabled`
- `channels.line.allowFrom`: ID utente LINE consentiti per i DM; `dmPolicy: "open"` richiede `["*"]`
- `channels.line.groupPolicy`: `allowlist | open | disabled`
- `channels.line.groupAllowFrom`: ID utente LINE consentiti per i gruppi
- Override per gruppo: `channels.line.groups.<groupId>.allowFrom`
- Nota runtime: se `channels.line` manca completamente, il runtime ripiega su `groupPolicy="allowlist"` per i controlli sui gruppi (anche se `channels.defaults.groupPolicy` è impostato).

Gli ID LINE distinguono tra maiuscole e minuscole. Gli ID validi hanno questo formato:

- Utente: `U` + 32 caratteri esadecimali
- Gruppo: `C` + 32 caratteri esadecimali
- Stanza: `R` + 32 caratteri esadecimali

## Comportamento dei messaggi

- Il testo viene suddiviso in blocchi da 5000 caratteri.
- La formattazione Markdown viene rimossa; i blocchi di codice e le tabelle vengono convertiti in schede Flex
  quando possibile.
- Le risposte in streaming vengono memorizzate in buffer; LINE riceve blocchi completi con un'animazione di caricamento
  mentre l'agente lavora.
- I download multimediali sono limitati da `channels.line.mediaMaxMb` (predefinito 10).
- I contenuti multimediali in ingresso vengono salvati in `~/.openclaw/media/inbound/` prima di essere passati
  all'agente, in linea con l'archivio multimediale condiviso usato dagli altri Plugin di canale in bundle.

## Dati del canale (messaggi avanzati)

Usa `channelData.line` per inviare risposte rapide, posizioni, schede Flex o messaggi template.

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

Il Plugin LINE include anche un comando `/card` per i preset dei messaggi Flex:

```
/card info "Welcome" "Thanks for joining!"
```

## Supporto ACP

LINE supporta i binding di conversazione ACP (Agent Communication Protocol):

- `/acp spawn <agent> --bind here` associa la chat LINE corrente a una sessione ACP senza creare un thread figlio.
- I binding ACP configurati e le sessioni ACP attive vincolate alla conversazione funzionano su LINE come sugli altri canali di conversazione.

Vedi [agenti ACP](/it/tools/acp-agents) per i dettagli.

## Contenuti multimediali in uscita

Il Plugin LINE supporta l'invio di immagini, video e file audio tramite lo strumento messaggi dell'agente. I contenuti multimediali vengono inviati tramite il percorso di consegna specifico di LINE con gestione appropriata di anteprima e tracciamento:

- **Immagini**: inviate come messaggi immagine LINE con generazione automatica dell'anteprima.
- **Video**: inviati con gestione esplicita di anteprima e tipo di contenuto.
- **Audio**: inviati come messaggi audio LINE.

Gli URL dei contenuti multimediali in uscita devono essere URL HTTPS pubblici. OpenClaw convalida il nome host di destinazione prima di passare l'URL a LINE e rifiuta destinazioni loopback, link-local e di rete privata.

Gli invii multimediali generici ripiegano sul percorso esistente solo immagini quando non è disponibile un percorso specifico di LINE.

## Risoluzione dei problemi

- **La verifica del webhook non riesce:** assicurati che l'URL del webhook sia HTTPS e che
  `channelSecret` corrisponda alla console LINE.
- **Nessun evento in ingresso:** conferma che il percorso del webhook corrisponda a `channels.line.webhookPath`
  e che il gateway sia raggiungibile da LINE.
- **Errori di download multimediale:** aumenta `channels.line.mediaMaxMb` se il contenuto multimediale supera il
  limite predefinito.

## Correlati

- [Panoramica dei canali](/it/channels) — tutti i canali supportati
- [Associazione](/it/channels/pairing) — autenticazione DM e flusso di associazione
- [Gruppi](/it/channels/groups) — comportamento delle chat di gruppo e gating delle menzioni
- [Instradamento dei canali](/it/channels/channel-routing) — instradamento delle sessioni per i messaggi
- [Sicurezza](/it/gateway/security) — modello di accesso e hardening
