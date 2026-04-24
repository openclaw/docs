---
read_when:
    - Aggiunta o modifica del rendering di schede di messaggio, pulsanti o select
    - Creazione di un Plugin di canale che supporta messaggi in uscita avanzati
    - Modifica della presentazione del message tool o delle capability di consegna
    - Debug di regressioni specifiche del provider nel rendering di schede/blocchi/componenti
summary: Schede di messaggio semantiche, pulsanti, select, testo di fallback e suggerimenti di consegna per i Plugin dei canali
title: Presentazione dei messaggi
x-i18n:
    generated_at: "2026-04-24T08:52:37Z"
    model: gpt-5.4
    provider: openai
    source_hash: 1c8c3903101310de330017b34bc2f0d641f4c8ea2b80a30532736b4409716510
    source_path: plugins/message-presentation.md
    workflow: 15
---

La presentazione dei messaggi è il contratto condiviso di OpenClaw per interfacce chat avanzate in uscita.
Permette ad agenti, comandi CLI, flussi di approvazione e Plugin di descrivere una sola volta
l'intento del messaggio, mentre ogni Plugin di canale rende la migliore forma nativa possibile.

Usa presentation per una UI portabile dei messaggi:

- sezioni di testo
- piccolo testo di contesto/footer
- divisori
- pulsanti
- menu select
- titolo e tono della scheda

Non aggiungere nuovi campi nativi del provider condivisi come Discord `components`, Slack
`blocks`, Telegram `buttons`, Teams `card` o Feishu `card` al message tool condiviso.
Questi sono output di rendering gestiti dal Plugin di canale.

## Contratto

Gli autori di Plugin importano il contratto pubblico da:

```ts
import type {
  MessagePresentation,
  ReplyPayloadDelivery,
} from "openclaw/plugin-sdk/interactive-runtime";
```

Forma:

```ts
type MessagePresentation = {
  title?: string;
  tone?: "neutral" | "info" | "success" | "warning" | "danger";
  blocks: MessagePresentationBlock[];
};

type MessagePresentationBlock =
  | { type: "text"; text: string }
  | { type: "context"; text: string }
  | { type: "divider" }
  | { type: "buttons"; buttons: MessagePresentationButton[] }
  | { type: "select"; placeholder?: string; options: MessagePresentationOption[] };

type MessagePresentationButton = {
  label: string;
  value?: string;
  url?: string;
  style?: "primary" | "secondary" | "success" | "danger";
};

type MessagePresentationOption = {
  label: string;
  value: string;
};

type ReplyPayloadDelivery = {
  pin?:
    | boolean
    | {
        enabled: boolean;
        notify?: boolean;
        required?: boolean;
      };
};
```

Semantica dei pulsanti:

- `value` è un valore di azione applicativa reinstradato attraverso il
  percorso di interazione esistente del canale quando il canale supporta controlli cliccabili.
- `url` è un pulsante link. Può esistere senza `value`.
- `label` è obbligatorio ed è usato anche nel fallback testuale.
- `style` è indicativo. I renderer dovrebbero mappare gli stili non supportati a un valore
  predefinito sicuro, non far fallire l'invio.

Semantica dei select:

- `options[].value` è il valore applicativo selezionato.
- `placeholder` è indicativo e può essere ignorato dai canali senza supporto nativo
  per select.
- Se un canale non supporta i select, il testo di fallback elenca le etichette.

## Esempi di producer

Scheda semplice:

```json
{
  "title": "Deploy approval",
  "tone": "warning",
  "blocks": [
    { "type": "text", "text": "Canary is ready to promote." },
    { "type": "context", "text": "Build 1234, staging passed." },
    {
      "type": "buttons",
      "buttons": [
        { "label": "Approve", "value": "deploy:approve", "style": "success" },
        { "label": "Decline", "value": "deploy:decline", "style": "danger" }
      ]
    }
  ]
}
```

Pulsante link solo URL:

```json
{
  "blocks": [
    { "type": "text", "text": "Release notes are ready." },
    {
      "type": "buttons",
      "buttons": [{ "label": "Open notes", "url": "https://example.com/release" }]
    }
  ]
}
```

Menu select:

```json
{
  "title": "Choose environment",
  "blocks": [
    {
      "type": "select",
      "placeholder": "Environment",
      "options": [
        { "label": "Canary", "value": "env:canary" },
        { "label": "Production", "value": "env:prod" }
      ]
    }
  ]
}
```

Invio CLI:

```bash
openclaw message send --channel slack \
  --target channel:C123 \
  --message "Deploy approval" \
  --presentation '{"title":"Deploy approval","tone":"warning","blocks":[{"type":"text","text":"Canary is ready."},{"type":"buttons","buttons":[{"label":"Approve","value":"deploy:approve","style":"success"},{"label":"Decline","value":"deploy:decline","style":"danger"}]}]}'
```

Consegna con pin:

```bash
openclaw message send --channel telegram \
  --target -1001234567890 \
  --message "Topic opened" \
  --pin
```

Consegna con pin con JSON esplicito:

```json
{
  "pin": {
    "enabled": true,
    "notify": true,
    "required": false
  }
}
```

## Contratto del renderer

I Plugin di canale dichiarano il supporto al rendering sul loro adapter outbound:

```ts
const adapter: ChannelOutboundAdapter = {
  deliveryMode: "direct",
  presentationCapabilities: {
    supported: true,
    buttons: true,
    selects: true,
    context: true,
    divider: true,
  },
  deliveryCapabilities: {
    pin: true,
  },
  renderPresentation({ payload, presentation, ctx }) {
    return renderNativePayload(payload, presentation, ctx);
  },
  async pinDeliveredMessage({ target, messageId, pin }) {
    await pinNativeMessage(target, messageId, { notify: pin.notify === true });
  },
};
```

I campi delle capability sono volutamente semplici booleani. Descrivono ciò che il
renderer può rendere interattivo, non ogni limite nativo della piattaforma. I renderer gestiscono comunque
i limiti specifici della piattaforma come numero massimo di pulsanti, numero di blocchi e
dimensione della scheda.

## Flusso di rendering core

Quando un `ReplyPayload` o un'azione di messaggio include `presentation`, il core:

1. Normalizza il payload presentation.
2. Risolve l'adapter outbound del canale di destinazione.
3. Legge `presentationCapabilities`.
4. Chiama `renderPresentation` quando l'adapter può rendere il payload.
5. Usa come fallback testo conservativo quando l'adapter è assente o non può rendere.
6. Invia il payload risultante attraverso il normale percorso di consegna del canale.
7. Applica metadati di consegna come `delivery.pin` dopo il primo messaggio
   inviato con successo.

Il core gestisce il comportamento di fallback così i producer possono restare agnostici rispetto al canale. I
Plugin di canale gestiscono il rendering nativo e la gestione delle interazioni.

## Regole di degradazione

La presentation deve essere sicura da inviare anche su canali limitati.

Il testo di fallback include:

- `title` come prima riga
- blocchi `text` come paragrafi normali
- blocchi `context` come righe di contesto compatte
- blocchi `divider` come separatore visivo
- etichette dei pulsanti, inclusi gli URL per i pulsanti link
- etichette delle opzioni select

I controlli nativi non supportati dovrebbero degradare invece di far fallire l'intero invio.
Esempi:

- Telegram con pulsanti inline disabilitati invia il fallback testuale.
- Un canale senza supporto select elenca le opzioni select come testo.
- Un pulsante solo URL diventa un pulsante link nativo oppure una riga URL di fallback.
- I fallimenti facoltativi del pin non fanno fallire il messaggio consegnato.

L'eccezione principale è `delivery.pin.required: true`; se il pin è richiesto come
obbligatorio e il canale non può fissare il messaggio inviato, la consegna riporta un errore.

## Mappatura dei provider

Renderer integrati attuali:

| Canale         | Destinazione di rendering nativa     | Note                                                                                                                                             |
| -------------- | ------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------ |
| Discord        | Components e contenitori component   | Mantiene il legacy `channelData.discord.components` per i producer esistenti di payload nativi del provider, ma i nuovi invii condivisi dovrebbero usare `presentation`. |
| Slack          | Block Kit                            | Mantiene il legacy `channelData.slack.blocks` per i producer esistenti di payload nativi del provider, ma i nuovi invii condivisi dovrebbero usare `presentation`.       |
| Telegram       | Testo più tastiere inline            | Pulsanti/select richiedono capability di pulsanti inline per la superficie di destinazione; altrimenti viene usato il fallback testuale.        |
| Mattermost     | Testo più props interattive          | Gli altri blocchi degradano in testo.                                                                                                            |
| Microsoft Teams | Adaptive Cards                      | Il testo semplice `message` viene incluso con la scheda quando sono forniti entrambi.                                                            |
| Feishu         | Schede interattive                   | L'header della scheda può usare `title`; il corpo evita di duplicare quel titolo.                                                                |
| Canali plain   | Fallback testuale                    | Anche i canali senza renderer ricevono comunque output leggibile.                                                                                |

La compatibilità con payload nativi del provider è un'agevolazione transitoria per i
producer di risposte esistenti. Non è un motivo per aggiungere nuovi campi nativi condivisi.

## Presentation vs InteractiveReply

`InteractiveReply` è il sottoinsieme interno più vecchio usato dagli helper di approvazione e interazione. Supporta:

- testo
- pulsanti
- select

`MessagePresentation` è il contratto canonico condiviso di invio. Aggiunge:

- title
- tone
- context
- divider
- pulsanti solo URL
- metadati di consegna generici tramite `ReplyPayload.delivery`

Usa gli helper di `openclaw/plugin-sdk/interactive-runtime` quando fai bridging di
codice più vecchio:

```ts
import {
  interactiveReplyToPresentation,
  normalizeMessagePresentation,
  presentationToInteractiveReply,
  renderMessagePresentationFallbackText,
} from "openclaw/plugin-sdk/interactive-runtime";
```

Il nuovo codice dovrebbe accettare o produrre direttamente `MessagePresentation`.

## Delivery Pin

Il pin è comportamento di consegna, non presentation. Usa `delivery.pin` invece di
campi nativi del provider come `channelData.telegram.pin`.

Semantica:

- `pin: true` fissa il primo messaggio consegnato con successo.
- `pin.notify` è predefinito `false`.
- `pin.required` è predefinito `false`.
- I fallimenti facoltativi del pin degradano e lasciano intatto il messaggio inviato.
- I fallimenti obbligatori del pin fanno fallire la consegna.
- I messaggi suddivisi in chunk fissano il primo chunk consegnato, non quello finale.

Le azioni manuali `pin`, `unpin` e `pins` sul messaggio esistono ancora per i
messaggi esistenti, quando il provider supporta tali operazioni.

## Checklist per gli autori di Plugin

- Dichiara `presentation` da `describeMessageTool(...)` quando il canale può
  rendere o degradare in sicurezza la presentation semantica.
- Aggiungi `presentationCapabilities` all'adapter outbound runtime.
- Implementa `renderPresentation` nel codice runtime, non nel codice
  di setup del Plugin sul control plane.
- Tieni le librerie UI native fuori dai percorsi caldi di setup/catalogo.
- Mantieni nel renderer e nei test i limiti della piattaforma.
- Aggiungi test di fallback per pulsanti non supportati, select, pulsanti URL, duplicazione title/text e invii misti `message` più `presentation`.
- Aggiungi il supporto al delivery pin tramite `deliveryCapabilities.pin` e
  `pinDeliveredMessage` solo quando il provider può fissare l'id del messaggio inviato.
- Non esporre nuovi campi nativi del provider per schede/blocchi/componenti/pulsanti attraverso
  lo schema condiviso dell'azione di messaggio.

## Documentazione correlata

- [Message CLI](/it/cli/message)
- [Plugin SDK Overview](/it/plugins/sdk-overview)
- [Plugin Architecture](/it/plugins/architecture-internals#message-tool-schemas)
- [Channel Presentation Refactor Plan](/it/plan/ui-channels)
