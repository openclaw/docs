---
read_when:
    - Aggiungere o modificare il rendering di schede messaggio, pulsanti o selezioni
    - Creazione di un Plugin di canale che supporta messaggi in uscita avanzati
    - Modificare la presentazione degli strumenti di messaggistica o le capacità di consegna
    - Debug delle regressioni di rendering di schede/blocchi/componenti specifiche del provider
summary: Schede di messaggio semantiche, pulsanti, menu di selezione, testo di fallback e indicazioni di consegna per i Plugin di canale
title: Presentazione dei messaggi
x-i18n:
    generated_at: "2026-06-27T17:51:57Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 9fc5eca9dfe637fbdd56dcb473a68540035f8b990eab8cf139a4e27711536f57
    source_path: plugins/message-presentation.md
    workflow: 16
---

La presentazione dei messaggi è il contratto condiviso di OpenClaw per UI di chat in uscita avanzate.
Consente ad agenti, comandi CLI, flussi di approvazione e plugin di descrivere una sola volta
l'intento del messaggio, mentre ogni plugin di canale esegue il rendering della migliore forma nativa possibile.

Usa la presentazione per UI di messaggi portabili:

- sezioni di testo
- piccolo testo di contesto/piè di pagina
- divisori
- pulsanti
- menu di selezione
- titolo e tono della scheda

Non aggiungere nuovi campi nativi del provider come Discord `components`, Slack
`blocks`, Telegram `buttons`, Teams `card` o Feishu `card` allo strumento
messaggi condiviso. Questi sono output del renderer di proprietà del plugin di canale.

## Contratto

Gli autori di plugin importano il contratto pubblico da:

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

type MessagePresentationAction =
  | { type: "command"; command: string }
  | { type: "callback"; value: string };

type MessagePresentationButton = {
  label: string;
  action?: MessagePresentationAction;
  /** Legacy callback value. Prefer action for new controls. */
  value?: string;
  url?: string;
  webApp?: { url: string };
  /** @deprecated Use webApp. Accepted for legacy JSON payloads only. */
  web_app?: { url: string };
  priority?: number;
  disabled?: boolean;
  reusable?: boolean;
  style?: "primary" | "secondary" | "success" | "danger";
};

type MessagePresentationOption = {
  label: string;
  action?: MessagePresentationAction;
  /** Legacy callback value. Prefer action for new controls. */
  value?: string;
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

- `action.type: "command"` esegue un comando slash nativo tramite il percorso dei
  comandi del core. Usalo per pulsanti e menu dei comandi integrati.
- `action.type: "callback"` trasporta dati opachi del plugin tramite il percorso
  di interazione del canale. I plugin di canale non devono reinterpretare i dati di callback come
  comandi slash.
- `value` è il valore di callback opaco legacy. I nuovi controlli devono usare `action`
  così i plugin di canale possono mappare comandi e callback senza dedurli dal testo.
- `url` è un pulsante di collegamento. Può esistere senza `value`.
- `webApp` descrive un pulsante web app nativo del canale. Telegram ne esegue il rendering
  come `web_app` e lo supporta solo nelle chat private. `web_app` è ancora
  accettato nei payload JSON permissivi per compatibilità, ma i produttori TypeScript
  devono usare `webApp`.
- `label` è obbligatorio ed è usato anche nel fallback testuale.
- `style` è indicativo. I renderer devono mappare gli stili non supportati a un valore predefinito
  sicuro, non far fallire l'invio.
- `priority` è facoltativo. Quando un canale dichiara limiti sulle azioni e i controlli
  devono essere eliminati, il core conserva prima i pulsanti con priorità più alta e preserva
  l'ordine originale tra pulsanti con pari priorità. Quando tutti i controlli rientrano nei limiti,
  l'ordine definito dall'autore viene preservato.
- `disabled` è facoltativo. I canali devono aderire esplicitamente con `supportsDisabled`; altrimenti
  il core degrada il controllo disabilitato a testo di fallback non interattivo.
- `reusable` è facoltativo. I canali che supportano callback native riutilizzabili possono
  mantenere l'azione disponibile dopo un'interazione riuscita. Usalo per
  azioni ripetibili o idempotenti come aggiornare, ispezionare o mostrare più dettagli;
  lascialo non impostato per normali approvazioni monouso e azioni distruttive.

Semantica della selezione:

- `options[].action` ha lo stesso significato comando/callback di `action` del pulsante.
- `options[].value` è il valore applicativo selezionato legacy.
- `placeholder` è indicativo e può essere ignorato dai canali senza supporto di selezione
  nativo.
- Se un canale non supporta le selezioni, il testo di fallback elenca le etichette.

## Esempi di produttore

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

Pulsante di collegamento solo URL:

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

Pulsante Telegram Mini App:

```json
{
  "blocks": [
    {
      "type": "buttons",
      "buttons": [{ "label": "Launch", "web_app": { "url": "https://example.com/app" } }]
    }
  ]
}
```

Menu di selezione:

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

Consegna fissata:

```bash
openclaw message send --channel telegram \
  --target -1001234567890 \
  --message "Topic opened" \
  --pin
```

Consegna fissata con JSON esplicito:

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

I plugin di canale dichiarano il supporto al rendering sul proprio adapter in uscita:

```ts
const adapter: ChannelOutboundAdapter = {
  deliveryMode: "direct",
  presentationCapabilities: {
    supported: true,
    buttons: true,
    selects: true,
    context: true,
    divider: true,
    limits: {
      actions: {
        maxActions: 25,
        maxActionsPerRow: 5,
        maxRows: 5,
        maxLabelLength: 80,
        maxValueBytes: 100,
        supportsStyles: true,
        supportsDisabled: false,
      },
      selects: {
        maxOptions: 25,
        maxLabelLength: 100,
        maxValueBytes: 100,
      },
      text: {
        maxLength: 2000,
        encoding: "characters",
        markdownDialect: "discord-markdown",
      },
    },
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

I booleani di capability descrivono ciò che il renderer può rendere interattivo. I `limits`
facoltativi descrivono l'involucro generico che il core può adattare prima di chiamare il
renderer:

```ts
type ChannelPresentationCapabilities = {
  supported?: boolean;
  buttons?: boolean;
  selects?: boolean;
  context?: boolean;
  divider?: boolean;
  limits?: {
    actions?: {
      maxActions?: number;
      maxActionsPerRow?: number;
      maxRows?: number;
      maxLabelLength?: number;
      maxValueBytes?: number;
      supportsStyles?: boolean;
      supportsDisabled?: boolean;
      supportsLayoutHints?: boolean;
    };
    selects?: {
      maxOptions?: number;
      maxLabelLength?: number;
      maxValueBytes?: number;
    };
    text?: {
      maxLength?: number;
      encoding?: "characters" | "utf8-bytes" | "utf16-units";
      markdownDialect?: "plain" | "markdown" | "html" | "slack-mrkdwn" | "discord-markdown";
      supportsEdit?: boolean;
    };
  };
};
```

Il core applica limiti generici ai controlli semantici prima del rendering. I renderer
possiedono comunque la validazione finale specifica del provider e il ritaglio per il conteggio
dei blocchi nativi, la dimensione della scheda, i limiti URL e le particolarità del provider che non possono essere espresse nel
contratto generico. Se i limiti rimuovono ogni controllo da un blocco, il core conserva
le etichette come testo di contesto non interattivo, così il messaggio consegnato ha comunque un
fallback visibile.

## Flusso di rendering del core

Quando un `ReplyPayload` o un'azione di messaggio include `presentation`, il core:

1. Normalizza il payload di presentazione.
2. Risolve l'adapter in uscita del canale di destinazione.
3. Legge `presentationCapabilities`.
4. Applica limiti generici di capability come numero di azioni, lunghezza delle etichette e
   numero di opzioni di selezione quando l'adapter li dichiara.
5. Chiama `renderPresentation` quando l'adapter può eseguire il rendering del payload.
6. Ripiega su testo conservativo quando l'adapter è assente o non può eseguire il rendering.
7. Invia il payload risultante tramite il normale percorso di consegna del canale.
8. Applica metadati di consegna come `delivery.pin` dopo il primo messaggio
   inviato con successo.

Il core possiede il comportamento di fallback, così i produttori possono restare agnostici rispetto al canale. I plugin di canale
possiedono il rendering nativo e la gestione delle interazioni.

## Regole di degradazione

La presentazione deve essere sicura da inviare su canali limitati.

Il testo di fallback include:

- `title` come prima riga
- blocchi `text` come paragrafi normali
- blocchi `context` come righe di contesto compatte
- blocchi `divider` come separatore visivo
- etichette dei pulsanti, inclusi gli URL per i pulsanti di collegamento
- etichette delle opzioni di selezione

I controlli nativi non supportati devono degradare invece di far fallire l'intero invio.
Esempi:

- Telegram con pulsanti inline disabilitati invia il fallback testuale.
- Un canale senza supporto di selezione elenca le opzioni di selezione come testo.
- Un pulsante solo URL diventa un pulsante di collegamento nativo oppure una riga URL di fallback.
- Gli errori facoltativi di fissaggio non fanno fallire il messaggio consegnato.

L'eccezione principale è `delivery.pin.required: true`; se il fissaggio è richiesto come
obbligatorio e il canale non può fissare il messaggio inviato, la consegna segnala un errore.

## Mappatura dei provider

Renderer attuali inclusi nel bundle:

| Canale          | Destinazione di rendering nativa    | Note                                                                                                                                              |
| --------------- | ----------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------- |
| Discord         | Components e contenitori component  | Preserva i `channelData.discord.components` legacy per i produttori di payload nativi del provider esistenti, ma i nuovi invii condivisi devono usare `presentation`. |
| Slack           | Block Kit                           | Preserva i `channelData.slack.blocks` legacy per i produttori di payload nativi del provider esistenti, ma i nuovi invii condivisi devono usare `presentation`.       |
| Telegram        | Testo più tastiere inline           | Pulsanti/selezioni richiedono la capability dei pulsanti inline per la superficie di destinazione; altrimenti viene usato il fallback testuale.    |
| Mattermost      | Testo più proprietà interattive     | Gli altri blocchi degradano a testo.                                                                                                              |
| Microsoft Teams | Adaptive Cards                      | Il testo semplice `message` è incluso con la scheda quando sono forniti entrambi.                                                                  |
| Feishu          | Schede interattive                  | L'intestazione della scheda può usare `title`; il corpo evita di duplicare quel titolo.                                                            |
| Canali semplici | Fallback testuale                   | I canali senza renderer ricevono comunque output leggibile.                                                                                       |

La compatibilità dei payload nativi del provider è una facilitazione di transizione per i produttori di risposte esistenti. Non è un motivo per aggiungere nuovi campi nativi condivisi.

## Presentazione vs InteractiveReply

`InteractiveReply` è il sottoinsieme interno precedente usato dagli helper di approvazione e interazione. Supporta:

- text
- buttons
- selects

`MessagePresentation` è il contratto di invio condiviso canonico. Aggiunge:

- title
- tone
- context
- divider
- pulsanti solo URL
- metadati generici di recapito tramite `ReplyPayload.delivery`

Usa gli helper da `openclaw/plugin-sdk/interactive-runtime` quando colleghi codice precedente:

```ts
import {
  adaptMessagePresentationForChannel,
  applyPresentationActionLimits,
  interactiveReplyToPresentation,
  normalizeMessagePresentation,
  presentationPageSize,
  presentationToInteractiveControlsReply,
  presentationToInteractiveReply,
  renderMessagePresentationFallbackText,
} from "openclaw/plugin-sdk/interactive-runtime";
```

Il nuovo codice dovrebbe accettare o produrre direttamente `MessagePresentation`. I payload `interactive` esistenti sono un sottoinsieme deprecato di `presentation`; il supporto runtime rimane per i produttori precedenti.

I tipi legacy `InteractiveReply*` e gli helper di conversione sono contrassegnati come `@deprecated` nell'SDK:

- `InteractiveReply`, `InteractiveReplyBlock`, `InteractiveReplyButton`,
  `InteractiveReplyOption`, `InteractiveReplySelectBlock` e
  `InteractiveReplyTextBlock`
- `normalizeInteractiveReply(...)`
- `hasInteractiveReplyBlocks(...)`
- `interactiveReplyToPresentation(...)`
- `presentationToInteractiveReply(...)`
- `presentationToInteractiveControlsReply(...)`
- `resolveInteractiveTextFallback(...)`
- `reduceInteractiveReply(...)`

`presentationToInteractiveReply(...)` e
`presentationToInteractiveControlsReply(...)` restano disponibili come bridge di rendering per le implementazioni legacy dei canali. Il nuovo codice produttore non dovrebbe chiamarli; invia `presentation` e lascia che l'adattamento core/canale gestisca il rendering.

Anche gli helper di approvazione hanno sostituzioni orientate prima alla presentazione:

- usa `buildApprovalPresentationFromActionDescriptors(...)` invece di
  `buildApprovalInteractiveReplyFromActionDescriptors(...)`
- usa `buildApprovalPresentation(...)` invece di
  `buildApprovalInteractiveReply(...)`
- usa `buildExecApprovalPresentation(...)` invece di
  `buildExecApprovalInteractiveReply(...)`

`renderMessagePresentationFallbackText(...)` restituisce una stringa vuota per i blocchi di presentazione che non hanno fallback testuale, ad esempio una presentazione composta solo da un divisore. I trasporti che richiedono un corpo di invio non vuoto possono passare `emptyFallback` per optare per un corpo minimo senza modificare il contratto di fallback predefinito.

## Pin di recapito

Il pinning è un comportamento di recapito, non di presentazione. Usa `delivery.pin` invece di campi nativi del provider come `channelData.telegram.pin`.

Semantica:

- `pin: true` fissa il primo messaggio recapitato correttamente.
- `pin.notify` ha valore predefinito `false`.
- `pin.required` ha valore predefinito `false`.
- Gli errori di pin facoltativi degradano il comportamento e lasciano intatto il messaggio inviato.
- Gli errori di pin obbligatori fanno fallire il recapito.
- I messaggi suddivisi in chunk fissano il primo chunk recapitato, non il chunk finale.

Le azioni messaggio manuali `pin`, `unpin` e `pins` esistono ancora per i messaggi esistenti quando il provider supporta queste operazioni.

## Checklist per autori di Plugin

- Dichiara `presentation` da `describeMessageTool(...)` quando il canale può renderizzare o degradare in modo sicuro la presentazione semantica.
- Aggiungi `presentationCapabilities` all'adapter outbound runtime.
- Implementa `renderPresentation` nel codice runtime, non nel codice di configurazione del Plugin del piano di controllo.
- Tieni le librerie UI native fuori dai percorsi caldi di setup/catalogo.
- Dichiara i limiti generici di capacità su `presentationCapabilities.limits` quando sono noti.
- Preserva i limiti finali della piattaforma nel renderer e nei test.
- Aggiungi test di fallback per pulsanti non supportati, select, pulsanti URL, duplicazione di titolo/testo e invii misti `message` più `presentation`.
- Aggiungi supporto al pin di recapito tramite `deliveryCapabilities.pin` e
  `pinDeliveredMessage` solo quando il provider può fissare l'id del messaggio inviato.
- Non esporre nuovi campi card/block/component/button nativi del provider tramite lo schema condiviso delle azioni messaggio.

## Documenti correlati

- [CLI dei messaggi](/it/cli/message)
- [Panoramica dell'SDK Plugin](/it/plugins/sdk-overview)
- [Architettura dei Plugin](/it/plugins/architecture-internals#message-tool-schemas)
- [Piano di refactor della presentazione dei canali](/it/plan/ui-channels)
