---
read_when:
    - Vuoi connettere OpenClaw a LINE
    - È necessario configurare il Webhook e le credenziali di LINE
    - Vuoi opzioni per i messaggi specifiche di LINE
summary: Configurazione, impostazioni e utilizzo del plugin LINE Messaging API
title: LINE
x-i18n:
    generated_at: "2026-07-12T06:49:49Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: ee5931c2bfca4a67a8b390f300907cd31a074988b10c6c0540444cff0bfde334
    source_path: channels/line.md
    workflow: 16
---

LINE si connette a OpenClaw tramite la LINE Messaging API. Il Plugin opera come ricevitore Webhook sul Gateway e utilizza il token di accesso al canale e il segreto del canale per l'autenticazione.

Stato: Plugin ufficiale, installato separatamente. Sono supportati messaggi diretti, chat di gruppo, contenuti multimediali, posizioni, messaggi Flex, messaggi modello e risposte rapide. Reazioni e thread non sono supportati.

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
2. Crea (o seleziona) un Provider e aggiungi un canale **Messaging API**.
3. Copia **Channel access token** e **Channel secret** dalle impostazioni del canale.
4. Abilita **Use webhook** nelle impostazioni della Messaging API.
5. Imposta l'URL del Webhook sull'endpoint del Gateway (HTTPS obbligatorio):

```text
https://gateway-host/line/webhook
```

Il Gateway risponde alla verifica del Webhook di LINE (GET) e conferma immediatamente gli eventi in ingresso firmati (POST) dopo la convalida della firma e del payload; l'elaborazione da parte dell'agente prosegue in modo asincrono.
Se hai bisogno di un percorso personalizzato, imposta `channels.line.webhookPath` oppure `channels.line.accounts.<id>.webhookPath` e aggiorna l'URL di conseguenza.

Note sulla sicurezza:

- La verifica della firma LINE dipende dal corpo della richiesta (HMAC sul corpo non elaborato), quindi OpenClaw applica un limite rigoroso al corpo prima dell'autenticazione (64 KB) e un timeout di lettura prima della verifica.
- OpenClaw elabora gli eventi Webhook a partire dai byte verificati della richiesta non elaborata. I valori `req.body` trasformati dal middleware a monte vengono ignorati per garantire l'integrità della firma.

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

Configurazione per messaggi diretti pubblici:

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

File del token e del segreto:

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

`tokenFile` e `secretFile` devono puntare a file regolari. I collegamenti simbolici vengono rifiutati.
I valori di configurazione incorporati hanno la precedenza sui file; le variabili d'ambiente costituiscono l'ultima opzione di ripiego per l'account predefinito.

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

Per impostazione predefinita, i messaggi diretti richiedono l'associazione. I mittenti sconosciuti ricevono un codice di associazione e i loro messaggi vengono ignorati fino all'approvazione:

```bash
openclaw pairing list line
openclaw pairing approve line <CODE>
```

Elenchi consentiti e criteri:

- `channels.line.dmPolicy`: `pairing | allowlist | open | disabled` (valore predefinito: `pairing`)
- `channels.line.allowFrom`: ID utente LINE inclusi nell'elenco consentito per i messaggi diretti; `dmPolicy: "open"` richiede `["*"]`
- `channels.line.groupPolicy`: `allowlist | open | disabled` (valore predefinito: `allowlist`)
- `channels.line.groupAllowFrom`: ID utente LINE inclusi nell'elenco consentito per i gruppi
- Sostituzioni per singolo gruppo: `channels.line.groups.<groupId>.allowFrom` (oltre a `enabled`, `requireMention`, `systemPrompt`, `skills`)
- È possibile fare riferimento ai gruppi statici di accesso dei mittenti da `allowFrom`, `groupAllowFrom` e dal valore `allowFrom` di ogni gruppo mediante `accessGroup:<name>`; consulta [Gruppi di accesso](/it/channels/access-groups).
- Nota sull'esecuzione: se `channels.line` è completamente assente, durante i controlli sui gruppi l'esecuzione usa come ripiego `groupPolicy="allowlist"` (anche se è impostato `channels.defaults.groupPolicy`).

Gli ID LINE distinguono tra maiuscole e minuscole. Gli ID validi hanno il seguente formato:

- Utente: `U` + 32 caratteri esadecimali
- Gruppo: `C` + 32 caratteri esadecimali
- Stanza: `R` + 32 caratteri esadecimali

## Comportamento dei messaggi

- Il testo viene suddiviso in blocchi di 5000 caratteri.
- La formattazione Markdown viene rimossa; quando possibile, i blocchi di codice e le tabelle vengono convertiti in schede Flex.
- Le risposte in streaming vengono memorizzate nel buffer; LINE riceve blocchi completi con un'animazione di caricamento mentre l'agente lavora.
- I download dei contenuti multimediali sono limitati da `channels.line.mediaMaxMb` (valore predefinito: 10).
- I contenuti multimediali in ingresso vengono salvati in `~/.openclaw/media/inbound/` prima di essere passati all'agente, in linea con l'archivio multimediale condiviso utilizzato dagli altri Plugin di canale.

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
        contents: {/* Flex payload */},
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

Il Plugin LINE include anche un comando `/card` per le preimpostazioni dei messaggi Flex:

```text
/card info "Welcome" "Thanks for joining!"
```

## Supporto ACP

LINE supporta le associazioni delle conversazioni ACP (Agent Communication Protocol):

- `/acp spawn <agent> --bind here` associa la chat LINE corrente a una sessione ACP senza creare un thread secondario.
- Le associazioni ACP configurate e le sessioni ACP attive associate alle conversazioni funzionano su LINE come sugli altri canali di conversazione.

Per maggiori dettagli, consulta [Agenti ACP](/it/tools/acp-agents).

## Contenuti multimediali in uscita

Il Plugin LINE invia immagini, video e audio tramite lo strumento per i messaggi dell'agente:

- **Immagini**: inviate come messaggi immagine LINE; per impostazione predefinita, l'immagine di anteprima usa l'URL del contenuto multimediale.
- **Video**: richiedono un'immagine di anteprima; imposta `channelData.line.previewImageUrl` su un URL di un'immagine.
- **Audio**: inviato come messaggi audio LINE; la durata predefinita è di 60 secondi, a meno che non sia impostato `channelData.line.durationMs`.

Quando è impostato, il tipo di contenuto multimediale viene ricavato da `channelData.line.mediaKind`; altrimenti viene dedotto dalle altre opzioni LINE o dal suffisso del file nell'URL, usando l'immagine come ripiego.

Gli URL dei contenuti multimediali in uscita devono essere URL HTTPS pubblici di massimo 2000 caratteri. OpenClaw convalida il nome host di destinazione prima di passare l'URL a LINE e rifiuta destinazioni local loopback, link-local e appartenenti a reti private.

Gli invii generici di contenuti multimediali senza opzioni specifiche per LINE utilizzano il percorso delle immagini.

## Risoluzione dei problemi

- **La verifica del Webhook non riesce:** assicurati che l'URL del Webhook utilizzi HTTPS e che `channelSecret` corrisponda a quello nella Console LINE.
- **Nessun evento in ingresso:** verifica che il percorso del Webhook corrisponda a `channels.line.webhookPath` e che il Gateway sia raggiungibile da LINE.
- **Errori durante il download dei contenuti multimediali:** aumenta `channels.line.mediaMaxMb` se i contenuti multimediali superano il limite predefinito.

## Argomenti correlati

- [Panoramica dei canali](/it/channels) — tutti i canali supportati
- [Associazione](/it/channels/pairing) — autenticazione dei messaggi diretti e flusso di associazione
- [Gruppi](/it/channels/groups) — comportamento delle chat di gruppo e controllo delle menzioni
- [Instradamento dei canali](/it/channels/channel-routing) — instradamento delle sessioni per i messaggi
- [Sicurezza](/it/gateway/security) — modello di accesso e rafforzamento della sicurezza
