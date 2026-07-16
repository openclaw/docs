---
read_when:
    - Si desidera connettere OpenClaw a LINE
    - È necessario configurare il Webhook e le credenziali di LINE
    - Si desiderano opzioni per i messaggi specifiche di LINE
summary: Configurazione, impostazioni e utilizzo del plugin LINE Messaging API
title: LINE
x-i18n:
    generated_at: "2026-07-16T13:59:51Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 31004467bc227b3a4e18168d1aa8b7f60d59e58994aeb890ac257beb2dbe8449
    source_path: channels/line.md
    workflow: 16
---

LINE si connette a OpenClaw tramite la LINE Messaging API. Il plugin viene eseguito come ricevitore webhook
sul Gateway e utilizza il token di accesso al canale + il segreto del canale per
l'autenticazione.

Stato: plugin ufficiale, installato separatamente. Sono supportati messaggi diretti, chat di gruppo, contenuti multimediali,
posizioni, messaggi Flex, messaggi modello e risposte rapide.
Le reazioni e i thread non sono supportati.

## Installazione

Installare LINE prima di configurare il canale:

```bash
openclaw plugins install @openclaw/line
```

Checkout locale (durante l'esecuzione da un repository git):

```bash
openclaw plugins install ./path/to/local/line-plugin
```

## Configurazione iniziale

1. Creare un account LINE Developers e aprire la Console:
   [https://developers.line.biz/console/](https://developers.line.biz/console/)
2. Creare (o selezionare) un Provider e aggiungere un canale **Messaging API**.
3. Copiare **Channel access token** e **Channel secret** dalle impostazioni del canale.
4. Abilitare **Use webhook** nelle impostazioni della Messaging API.
5. Impostare l'URL del webhook sull'endpoint del gateway (HTTPS obbligatorio):

```text
https://gateway-host/line/webhook
```

Il Gateway risponde alla verifica del webhook di LINE (GET) e conferma immediatamente gli eventi
in entrata firmati (POST) dopo la convalida della firma e del payload; l'elaborazione
dell'agente prosegue in modo asincrono.
Se è necessario un percorso personalizzato, impostare `channels.line.webhookPath` o
`channels.line.accounts.<id>.webhookPath` e aggiornare l'URL di conseguenza.

Note sulla sicurezza:

- La verifica della firma LINE dipende dal corpo (HMAC sul corpo non elaborato), quindi OpenClaw applica un limite rigoroso al corpo prima dell'autenticazione (64 KB) e un timeout di lettura prima della verifica.
- OpenClaw elabora gli eventi webhook dai byte verificati della richiesta non elaborata. I valori `req.body` trasformati dal middleware a monte vengono ignorati per garantire l'integrità della firma.

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

Configurazione dei messaggi diretti pubblici:

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

`tokenFile` e `secretFile` devono puntare a file regolari. I collegamenti simbolici vengono rifiutati.
I valori di configurazione incorporati hanno la precedenza sui file; le variabili di ambiente costituiscono l'ultima alternativa per l'account predefinito.

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

Per impostazione predefinita, i messaggi diretti richiedono l'associazione. I mittenti sconosciuti ricevono un codice di associazione e i loro
messaggi vengono ignorati fino all'approvazione:

```bash
openclaw pairing list line
openclaw pairing approve line <CODE>
```

Elenchi consentiti e criteri:

- `channels.line.dmPolicy`: `pairing | allowlist | open | disabled` (valore predefinito `pairing`)
- `channels.line.allowFrom`: ID utente LINE consentiti per i messaggi diretti; `dmPolicy: "open"` richiede `["*"]`
- `channels.line.groupPolicy`: `allowlist | open | disabled` (valore predefinito `allowlist`)
- `channels.line.groupAllowFrom`: ID utente LINE consentiti per i gruppi; le voci `allowFrom` dei messaggi diretti non ammettono i mittenti dei gruppi
- Override per gruppo: `channels.line.groups.<groupId>.allowFrom` (oltre a `enabled`, `requireMention`, `systemPrompt`, `skills`). Con
  `groupPolicy: "allowlist"`, impostare `groupAllowFrom` o il valore per gruppo `allowFrom`; un elenco consentito del gruppo vuoto blocca i messaggi del gruppo anche quando i messaggi diretti sono aperti.
- È possibile fare riferimento ai gruppi statici di accesso dei mittenti da `allowFrom`, `groupAllowFrom` e dal valore per gruppo `allowFrom` con `accessGroup:<name>`; vedere [Gruppi di accesso](/it/channels/access-groups).
- Nota sull'esecuzione: se `channels.line` è completamente assente, in fase di esecuzione viene usato `groupPolicy="allowlist"` come alternativa per i controlli dei gruppi (anche se `channels.defaults.groupPolicy` è impostato).

Gli ID LINE distinguono tra maiuscole e minuscole. Gli ID validi hanno il seguente aspetto:

- Utente: `U` + 32 caratteri esadecimali
- Gruppo: `C` + 32 caratteri esadecimali
- Stanza: `R` + 32 caratteri esadecimali

## Comportamento dei messaggi

- Il testo viene suddiviso in blocchi di 5000 caratteri.
- La formattazione Markdown viene rimossa; i blocchi di codice e le tabelle vengono convertiti in schede Flex
  quando possibile.
- Le risposte in streaming vengono memorizzate nel buffer; LINE riceve blocchi completi con un'animazione di caricamento
  mentre l'agente lavora.
- I download dei contenuti multimediali sono limitati da `channels.line.mediaMaxMb` (valore predefinito 10).
- I contenuti multimediali in entrata vengono salvati in `~/.openclaw/media/inbound/` prima di essere passati
  all'agente, in linea con l'archivio multimediale condiviso utilizzato dagli altri plugin di canale.

## Dati del canale (messaggi avanzati)

Utilizzare `channelData.line` per inviare risposte rapide, posizioni, schede Flex o messaggi
modello.

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

Il plugin LINE include anche un comando `/card` per le preimpostazioni dei messaggi Flex:

```text
/card info "Benvenuto" "Grazie per esserti unito!"
```

## Supporto ACP

LINE supporta le associazioni delle conversazioni ACP (Agent Communication Protocol):

- `/acp spawn <agent> --bind here` associa la chat LINE corrente a una sessione ACP senza creare un thread secondario.
- Le associazioni ACP configurate e le sessioni ACP attive associate alla conversazione funzionano su LINE come sugli altri canali di conversazione.

Per i dettagli, vedere [Agenti ACP](/it/tools/acp-agents).

## Contenuti multimediali in uscita

Il plugin LINE invia immagini, video e audio tramite lo strumento per i messaggi dell'agente:

- **Immagini**: inviate come messaggi immagine LINE; per impostazione predefinita, l'immagine di anteprima corrisponde all'URL del contenuto multimediale.
- **Video**: richiedono un'immagine di anteprima; impostare `channelData.line.previewImageUrl` su un URL di immagine.
- **Audio**: inviato come messaggi audio LINE; la durata predefinita è di 60 secondi, a meno che non sia impostato `channelData.line.durationMs`.

Il tipo di contenuto multimediale viene ricavato da `channelData.line.mediaKind`, se impostato; altrimenti viene dedotto
dalle altre opzioni LINE o dal suffisso del file nell'URL, usando l'immagine come alternativa.

Gli URL dei contenuti multimediali in uscita devono essere URL HTTPS pubblici di massimo 2000 caratteri. OpenClaw
convalida il nome host di destinazione prima di fornire l'URL a LINE e rifiuta le destinazioni loopback,
link-local e della rete privata.

Gli invii generici di contenuti multimediali senza opzioni specifiche per LINE utilizzano il percorso delle immagini.

## Risoluzione dei problemi

- **La verifica del webhook non riesce:** assicurarsi che l'URL del webhook utilizzi HTTPS e che
  `channelSecret` corrisponda alla console LINE.
- **Nessun evento in entrata:** verificare che il percorso del webhook corrisponda a `channels.line.webhookPath`
  e che il gateway sia raggiungibile da LINE.
- **Errori di download dei contenuti multimediali:** aumentare `channels.line.mediaMaxMb` se i contenuti multimediali superano il
  limite predefinito.

## Contenuti correlati

- [Panoramica dei canali](/it/channels) — tutti i canali supportati
- [Associazione](/it/channels/pairing) — autenticazione dei messaggi diretti e flusso di associazione
- [Gruppi](/it/channels/groups) — comportamento delle chat di gruppo e controllo delle menzioni
- [Instradamento dei canali](/it/channels/channel-routing) — instradamento delle sessioni per i messaggi
- [Sicurezza](/it/gateway/security) — modello di accesso e rafforzamento
