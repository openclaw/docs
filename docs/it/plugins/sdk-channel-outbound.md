---
read_when:
    - Stai creando o rifattorizzando il percorso di invio di un plugin per un canale di messaggistica
    - Hai bisogno di una consegna affidabile della risposta finale, di ricevute, della finalizzazione dell’anteprima in tempo reale o di criteri per la conferma di ricezione
    - Stai eseguendo la migrazione da channel-message, channel-message-runtime o dagli helper legacy per l'invio delle risposte
summary: 'API del ciclo di vita dei messaggi in uscita per i plugin di canale: adattatori, ricevute, invii persistenti, anteprima in tempo reale e funzioni di supporto per la pipeline delle risposte'
title: API in uscita del canale
x-i18n:
    generated_at: "2026-07-12T07:21:03Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 6ab3c38a0c2ae7d46f318604328b5ffdd6f375005150f09698b299cbd06e2f22
    source_path: plugins/sdk-channel-outbound.md
    workflow: 16
---

I Plugin di canale espongono il comportamento dei messaggi in uscita da
`openclaw/plugin-sdk/channel-outbound`. Usa
`openclaw/plugin-sdk/channel-inbound` per l'orchestrazione di
ricezione/contesto/inoltro.

Il core gestisce accodamento, persistenza, criteri generici per i nuovi
tentativi, hook, ricevute e lo strumento `message` condiviso. Il Plugin gestisce
le chiamate native di invio/modifica/eliminazione, la normalizzazione della
destinazione, i thread della piattaforma, le citazioni selezionate, i flag di
notifica, lo stato dell'account e gli effetti collaterali specifici della
piattaforma.

## Adattatore

La maggior parte dei Plugin definisce un adattatore `message`:

```ts
import {
  defineChannelMessageAdapter,
  createMessageReceiptFromOutboundResults,
} from "openclaw/plugin-sdk/channel-outbound";

export const demoMessageAdapter = defineChannelMessageAdapter({
  id: "demo",
  durableFinal: {
    capabilities: {
      text: true,
      replyTo: true,
      thread: true,
      messageSendingHooks: true,
    },
  },
  send: {
    text: async ({ cfg, to, text, accountId, replyToId, threadId, signal }) => {
      const sent = await sendDemoMessage({
        cfg,
        to,
        text,
        accountId: accountId ?? undefined,
        replyToId: replyToId ?? undefined,
        threadId: threadId == null ? undefined : String(threadId),
        signal,
      });

      return {
        receipt: createMessageReceiptFromOutboundResults({
          results: [{ channel: "demo", messageId: sent.id, conversationId: to }],
          kind: "text",
          threadId: threadId == null ? undefined : String(threadId),
          replyToId: replyToId ?? undefined,
        }),
      };
    },
  },
});
```

Dichiara solo le funzionalità effettivamente preservate dal trasporto nativo.
Copri ogni funzionalità dichiarata di invio, ricevuta, anteprima in tempo reale
e conferma di ricezione con gli helper di contratto esportati da questo
sottopercorso.

## Sanitizzazione del testo normale

Usa `sanitizeForPlainText(...)` quando un adattatore in uscita deve convertire i
tag di formattazione HTML supportati in una sintassi testuale leggera. Per
impostazione predefinita vengono mantenuti i marcatori esistenti in stile chat
per grassetto e barrato. Passa `{ style: "markdown" }` solo quando il canale
analizza nuovamente il risultato come Markdown:

```ts
import { sanitizeForPlainText } from "openclaw/plugin-sdk/channel-outbound";

const chatText = sanitizeForPlainText(text);
const markdownText = sanitizeForPlainText(text, { style: "markdown" });
```

Lo stile Markdown usa `**bold**` e `~~strikethrough~~`; il corsivo e il codice
inline mantengono rispettivamente i marcatori `_italic_` e gli apici inversi in
entrambi gli stili. Seleziona lo stile al confine del canale anziché riscrivere
il testo dei marcatori dopo la sanitizzazione.

## Evidenza di consegna

Un `MessageReceipt` registra il risultato restituito da un adattatore di
canale. Gli identificatori concreti dei messaggi della piattaforma mostrano che
il percorso di invio della piattaforma ha accettato il messaggio; non dimostrano
che il dispositivo del destinatario lo abbia visualizzato o letto. Le ricevute
prive di identificatori dei messaggi della piattaforma sono solo metadati di
ricevuta locali. I canali con conferme di lettura o stato di consegna al
dispositivo devono registrare tali informazioni tramite un percorso separato
specifico del canale.

Se un adattatore di canale può dimostrare che un nuovo tentativo dopo un errore
non può duplicare un invio visibile al destinatario e che non è iniziata alcuna
chiamata in grado di finalizzare l'operazione, genera
`new PlatformMessageNotDispatchedError("...", { cause: error })` da
`openclaw/plugin-sdk/error-runtime`. Il core può quindi eliminare le evidenze
obsolete del tentativo di invio e riprovare in sicurezza l'intento accodato.
Solo l'adattatore responsabile del confine di inoltro finale può fare questa
asserzione. Non usare mai il marcatore dopo l'inizio di una chiamata di
finalizzazione/invio o quando questa restituisce un risultato ambiguo; una
marcatura errata può duplicare i messaggi.

## Adattatori in uscita esistenti

Se il canale dispone già di un adattatore `outbound` compatibile, ricava
l'adattatore di messaggio anziché duplicare il codice di invio:

```ts
import { createChannelMessageAdapterFromOutbound } from "openclaw/plugin-sdk/channel-outbound";

export const messageAdapter = createChannelMessageAdapterFromOutbound({
  id: "demo",
  outbound,
  durableFinal: {
    capabilities: {
      text: true,
      media: true,
    },
  },
});
```

## Invii persistenti

Anche gli helper di invio a runtime si trovano in `channel-outbound`:

- `sendDurableMessageBatch(...)`
- `withDurableMessageSendContext(...)`
- `deliverInboundReplyWithMessageSendContext(...)`
- helper per lo streaming delle bozze/l'avanzamento, come `resolveChannelDraftStreamingChunking(...)`

`sendDurableMessageBatch(...)` restituisce uno dei seguenti esiti espliciti:

| Esito            | Significato                                                                                       |
| ---------------- | ------------------------------------------------------------------------------------------------- |
| `sent`           | almeno un messaggio visibile della piattaforma è stato accettato dal percorso di invio            |
| `suppressed`     | nessun messaggio della piattaforma deve essere considerato mancante                               |
| `partial_failed` | almeno un messaggio è stato accettato prima dell'errore di un payload o effetto collaterale successivo |
| `failed`         | non è stata prodotta alcuna ricevuta della piattaforma                                            |

Usa `payloadOutcomes` quando un batch combina payload inviati, soppressi e non
riusciti. Non dedurre l'annullamento da parte di un hook da un risultato vuoto
del precedente sistema di consegna diretta.

## Ammissione della consegna differita

Usa `message.durableFinal.admitDeferredDelivery(...)` quando un account risolto
non può accettare in sicurezza la consegna in uscita o differita gestita dal
core. Il core chiama questo hook in modo sincrono prima dell'elaborazione in
tempo reale dei messaggi in uscita, inclusi i percorsi che ignorano la
persistenza della coda, e nuovamente prima di riprodurre un intento recuperato.
Il contesto include `cfg`, `channel`, `to`, `accountId` e una `phase` pari a
`live` o `recovery`.

Restituisci `{ status: "allowed" }` per continuare. Restituisci
`{ status: "permanent_rejection", reason }` quando la consegna non deve essere
persistita, inviata direttamente o riprodotta. Un rifiuto in tempo reale causa
un errore prima della creazione della coda, degli hook dei messaggi o delle
operazioni sulla piattaforma. Un rifiuto durante il recupero contrassegna come
non riuscito il record accodato e ignora riconciliazione e riproduzione.
L'omissione dell'hook equivale a un'autorizzazione.

L'hook è una decisione sincrona di ammissione, non un percorso di invio. Leggi
solo la configurazione o lo stato di runtime già caricati; non eseguire
operazioni di rete, sul file system o altre operazioni di I/O asincrone. I test
del contratto devono coprire entrambe le fasi ed entrambe le varianti di
risultato tramite `ChannelMessageDurableFinalAdapter` da
`openclaw/plugin-sdk/channel-outbound`.

## Inoltro per compatibilità

Componi l'inoltro delle risposte in ingresso tramite
`dispatchChannelInboundReply(...)` da `channel-inbound`. Mantieni la consegna
alla piattaforma nell'adattatore di consegna; usa `channel-outbound` per gli
adattatori di messaggio, gli invii persistenti, le ricevute, l'anteprima in
tempo reale e le opzioni della pipeline di risposta.
