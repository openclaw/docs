---
read_when:
    - Vuoi collegare OpenClaw a LINE
    - È necessaria la configurazione del Webhook LINE e delle credenziali
    - Vuoi opzioni di messaggio specifiche per LINE
summary: Installazione, configurazione e utilizzo del Plugin LINE Messaging API
title: RIGA
x-i18n:
    generated_at: "2026-05-10T19:22:11Z"
    model: gpt-5.5
    provider: openai
    source_hash: 7a11edbadda1ec99452eadc19a4557bb594f8b69ebb92314e2c3a0be325ab89d
    source_path: channels/line.md
    workflow: 16
---

LINE si connette a OpenClaw tramite la LINE Messaging API. Il plugin viene eseguito come ricevitore webhook sul gateway e usa il tuo channel access token + channel secret per l'autenticazione.

Stato: plugin scaricabile. Sono supportati messaggi diretti, chat di gruppo, media, posizioni, messaggi Flex, messaggi modello e risposte rapide. Reazioni e thread non sono supportati.

## Installazione

Installa LINE prima di configurare il canale:

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
2. Crea (o scegli) un Provider e aggiungi un canale **Messaging API**.
3. Copia il **Channel access token** e il **Channel secret** dalle impostazioni del canale.
4. Abilita **Use webhook** nelle impostazioni della Messaging API.
5. Imposta l'URL del webhook sull'endpoint del tuo gateway (HTTPS obbligatorio):

```
https://gateway-host/line/webhook
```

Il gateway risponde alla verifica webhook di LINE (GET) e agli eventi in ingresso (POST).
Se ti serve un percorso personalizzato, imposta `channels.line.webhookPath` o
`channels.line.accounts.<id>.webhookPath` e aggiorna l'URL di conseguenza.

Nota di sicurezza:

- La verifica della firma LINE dipende dal corpo (HMAC sul corpo raw), quindi OpenClaw applica limiti rigorosi del corpo prima dell'autenticazione e un timeout prima della verifica.
- OpenClaw elabora gli eventi webhook dai byte raw verificati della richiesta. I valori `req.body` trasformati da middleware upstream vengono ignorati per la sicurezza dell'integrità della firma.

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

Per impostazione predefinita, i messaggi diretti usano il pairing. I mittenti sconosciuti ricevono un codice di pairing e i loro messaggi vengono ignorati finché non sono approvati.

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
- I gruppi di accesso statici dei mittenti possono essere referenziati da `allowFrom`, `groupAllowFrom` e da `allowFrom` per gruppo con `accessGroup:<name>`.
- Nota di runtime: se `channels.line` manca completamente, il runtime ripiega su `groupPolicy="allowlist"` per i controlli sui gruppi (anche se `channels.defaults.groupPolicy` è impostato).

Gli ID LINE distinguono tra maiuscole e minuscole. Gli ID validi hanno questo formato:

- Utente: `U` + 32 caratteri esadecimali
- Gruppo: `C` + 32 caratteri esadecimali
- Stanza: `R` + 32 caratteri esadecimali

## Comportamento dei messaggi

- Il testo viene suddiviso in blocchi da 5000 caratteri.
- La formattazione Markdown viene rimossa; i blocchi di codice e le tabelle vengono convertiti in schede Flex quando possibile.
- Le risposte in streaming vengono bufferizzate; LINE riceve blocchi completi con un'animazione di caricamento mentre l'agente lavora.
- I download dei media sono limitati da `channels.line.mediaMaxMb` (predefinito 10).
- I media in ingresso vengono salvati in `~/.openclaw/media/inbound/` prima di essere passati all'agente, in modo coerente con l'archivio media condiviso usato dagli altri plugin di canale inclusi.

## Dati del canale (messaggi ricchi)

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

Il plugin LINE include anche un comando `/card` per i preset dei messaggi Flex:

```
/card info "Welcome" "Thanks for joining!"
```

## Supporto ACP

LINE supporta i binding di conversazione ACP (Agent Communication Protocol):

- `/acp spawn <agent> --bind here` associa la chat LINE corrente a una sessione ACP senza creare un thread figlio.
- I binding ACP configurati e le sessioni ACP attive associate alla conversazione funzionano su LINE come sugli altri canali di conversazione.

Vedi [agenti ACP](/it/tools/acp-agents) per i dettagli.

## Media in uscita

Il plugin LINE supporta l'invio di immagini, video e file audio tramite lo strumento messaggi dell'agente. I media vengono inviati tramite il percorso di consegna specifico di LINE con gestione appropriata di anteprima e tracciamento:

- **Immagini**: inviate come messaggi immagine LINE con generazione automatica dell'anteprima.
- **Video**: inviati con gestione esplicita di anteprima e tipo di contenuto.
- **Audio**: inviati come messaggi audio LINE.

Gli URL dei media in uscita devono essere URL HTTPS pubblici. OpenClaw convalida il nome host di destinazione prima di passare l'URL a LINE e rifiuta destinazioni loopback, link-local e di rete privata.

Gli invii di media generici ripiegano sulla route esistente solo per immagini quando non è disponibile un percorso specifico per LINE.

## Risoluzione dei problemi

- **La verifica webhook non riesce:** assicurati che l'URL del webhook sia HTTPS e che il `channelSecret` corrisponda alla console LINE.
- **Nessun evento in ingresso:** conferma che il percorso webhook corrisponda a `channels.line.webhookPath` e che il gateway sia raggiungibile da LINE.
- **Errori di download dei media:** aumenta `channels.line.mediaMaxMb` se i media superano il limite predefinito.

## Correlati

- [Panoramica dei canali](/it/channels) — tutti i canali supportati
- [Pairing](/it/channels/pairing) — autenticazione DM e flusso di pairing
- [Gruppi](/it/channels/groups) — comportamento delle chat di gruppo e gating delle menzioni
- [Instradamento dei canali](/it/channels/channel-routing) — instradamento delle sessioni per i messaggi
- [Sicurezza](/it/gateway/security) — modello di accesso e hardening
