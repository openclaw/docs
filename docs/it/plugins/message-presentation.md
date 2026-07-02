---
read_when:
    - Aggiunta o modifica del rendering di schede messaggio, pulsanti o selezioni
    - Creazione di un Plugin di canale che supporta messaggi in uscita avanzati
    - Modifica della presentazione degli strumenti di messaggistica o delle capacità di recapito
    - Debugging delle regressioni di rendering di card/blocchi/componenti specifiche del provider
summary: Schede messaggio semantiche, pulsanti, selezioni, testo di fallback e suggerimenti di recapito per i Plugin di canale
title: Presentazione dei messaggi
x-i18n:
    generated_at: "2026-07-02T22:35:31Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 5acb03b2aabcfefe4935440a3f799876afb3e9ee8c166704987f93f3667e68dd
    source_path: plugins/message-presentation.md
    workflow: 16
---

La presentazione dei messaggi è il contratto condiviso di OpenClaw per un'interfaccia utente di chat in uscita avanzata.
Permette ad agenti, comandi CLI, flussi di approvazione e plugin di descrivere l'intento del messaggio
una sola volta, mentre ogni plugin di canale renderizza la migliore forma nativa possibile.

Usa la presentazione per un'interfaccia utente di messaggio portabile:

- sezioni di testo
- piccolo testo di contesto/piè di pagina
- divisori
- pulsanti
- menu di selezione
- titolo e tono della scheda

Non aggiungere al tool di messaggistica condiviso nuovi campi nativi del provider come Discord `components`, Slack
`blocks`, Telegram `buttons`, Teams `card` o Feishu `card`.
Questi sono output del renderer di proprietà del plugin di canale.

## Contratto

Gli autori dei plugin importano il contratto pubblico da:

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

- `action.type: "command"` esegue un comando slash nativo tramite il percorso dei comandi
  del core. Usalo per pulsanti e menu di comandi integrati.
- `action.type: "callback"` trasporta dati opachi del plugin tramite il percorso di
  interazione del canale. I plugin di canale non devono reinterpretare i dati di callback come comandi
  slash.
- `value` è il valore di callback opaco legacy. I nuovi controlli dovrebbero usare `action`
  così i plugin di canale possono mappare comandi e callback senza indovinare dal testo.
- `url` è un pulsante link. Può esistere senza `value`.
- `webApp` descrive un pulsante di web app nativo del canale. Telegram lo renderizza
  come `web_app` e lo supporta solo nelle chat private. `web_app` è ancora
  accettato nei payload JSON permissivi per compatibilità, ma i produttori TypeScript
  dovrebbero usare `webApp`.
- `label` è obbligatorio ed è usato anche nel fallback testuale.
- `style` è indicativo. I renderer dovrebbero mappare gli stili non supportati a un valore predefinito
  sicuro, non far fallire l'invio.
- `priority` è opzionale. Quando un canale dichiara limiti per le azioni e i controlli
  devono essere scartati, il core mantiene prima i pulsanti con priorità più alta e preserva
  l'ordine originale tra pulsanti con pari priorità. Quando tutti i controlli rientrano, viene preservato
  l'ordine definito dall'autore.
- `disabled` è opzionale. I canali devono aderire esplicitamente con `supportsDisabled`; altrimenti
  il core degrada il controllo disabilitato a testo di fallback non interattivo.
- `reusable` è opzionale. I canali che supportano callback native riutilizzabili possono
  mantenere l'azione disponibile dopo un'interazione riuscita. Usalo per
  azioni ripetibili o idempotenti come aggiornare, ispezionare o mostrare altri dettagli;
  lascialo non impostato per normali approvazioni una tantum e azioni distruttive.

Semantica delle selezioni:

- `options[].action` ha lo stesso significato comando/callback di `action` del pulsante.
- `options[].value` è il valore applicativo selezionato legacy.
- `placeholder` è indicativo e può essere ignorato dai canali senza supporto nativo
  per le selezioni.
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

I plugin di canale dichiarano il supporto al rendering sul proprio adattatore in uscita:

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

I booleani di capacità descrivono ciò che il renderer può rendere interattivo. I `limits`
opzionali descrivono l'involucro generico che il core può adattare prima di chiamare il
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
restano comunque proprietari della validazione finale specifica del provider e del clipping per conteggio dei blocchi
nativi, dimensione della scheda, limiti degli URL e particolarità del provider che non possono essere espresse nel
contratto generico. Se i limiti rimuovono ogni controllo da un blocco, il core mantiene
le etichette come testo di contesto non interattivo, così il messaggio consegnato ha comunque un
fallback visibile.

## Flusso di rendering del core

Quando un `ReplyPayload` o un'azione di messaggio include `presentation`, il core:

1. Normalizza il payload di presentazione.
2. Risolve l'adattatore in uscita del canale di destinazione.
3. Legge `presentationCapabilities`.
4. Applica limiti generici di capacità come numero di azioni, lunghezza delle etichette e
   numero di opzioni di selezione quando l'adattatore li dichiara.
5. Chiama `renderPresentation` quando l'adattatore può renderizzare il payload.
6. Ripiega su testo conservativo quando l'adattatore è assente o non può renderizzare.
7. Invia il payload risultante tramite il normale percorso di consegna del canale.
8. Applica metadati di consegna come `delivery.pin` dopo il primo messaggio inviato
   con successo.

Il core possiede il comportamento di fallback così i produttori possono restare indipendenti dal canale. I plugin
di canale possiedono il rendering nativo e la gestione delle interazioni.

## Regole di degradazione

La presentazione deve poter essere inviata in sicurezza su canali limitati.

Il testo di fallback include:

- `title` come prima riga
- blocchi `text` come normali paragrafi
- blocchi `context` come righe di contesto compatte
- blocchi `divider` come separatore visivo
- etichette dei pulsanti, inclusi gli URL per i pulsanti link
- etichette delle opzioni di selezione

### Visibilità del fallback dei valori dei pulsanti

Quando un canale non può renderizzare controlli interattivi, i valori di pulsanti e selezioni
ripiegano su testo semplice. Il comportamento di fallback preserva l'usabilità mantenendo
privati i dati di callback opachi:

- Le azioni di tipo **`command`** vengono renderizzate come `label: \`command\`` così gli utenti possono
  copiare il comando ed eseguirlo manualmente nell'input del canale.
- Le azioni di tipo **`callback`** e i campi **`value`** legacy vengono renderizzati solo con
  l'etichetta. Il valore di callback opaco non viene esposto nel testo di fallback.
- I pulsanti **`url` / `webApp`** renderizzano il testo dell'URL accanto all'etichetta del pulsante,
  poiché l'URL è visibile all'utente.
- Le **opzioni di selezione** vengono renderizzate solo con l'etichetta. Il valore dell'opzione sottostante non viene
  esposto nel testo di fallback.

Gli adattatori di canale che aggiungono indicazioni per comandi manuali nella loro interfaccia di fallback (ad es.
istruzioni per commenti su documenti Feishu) devono derivare il controllo di presenza del comando
dagli stessi blocchi di presentazione usati dal renderer di fallback, così il
testo di guida appare solo quando viene effettivamente mostrato un comando manuale.

I controlli nativi non supportati dovrebbero degradare invece di far fallire l'intero invio.
Esempi:

- Telegram con pulsanti inline disabilitati invia il fallback testuale.
- Un canale senza supporto per le selezioni elenca le opzioni di selezione come testo.
- Un pulsante solo URL diventa un pulsante link nativo oppure una riga URL di fallback.
- I fallimenti opzionali del fissaggio non fanno fallire il messaggio consegnato.

L'eccezione principale è `delivery.pin.required: true`; se il fissaggio è richiesto come
obbligatorio e il canale non può fissare il messaggio inviato, la consegna segnala un fallimento.

## Mapping dei provider

Renderer in bundle attuali:

| Canale          | Destinazione di rendering nativa    | Note                                                                                                                                              |
| --------------- | ----------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------- |
| Discord         | Componenti e contenitori di componenti | Conserva il vecchio `channelData.discord.components` per i produttori esistenti di payload nativi del provider, ma i nuovi invii condivisi devono usare `presentation`. |
| Slack           | Block Kit                           | Conserva il vecchio `channelData.slack.blocks` per i produttori esistenti di payload nativi del provider, ma i nuovi invii condivisi devono usare `presentation`.       |
| Telegram        | Testo più tastiere inline           | Pulsanti/selezioni richiedono la funzionalità di pulsante inline per la superficie di destinazione; in caso contrario viene usato il fallback testuale. |
| Mattermost      | Testo più proprietà interattive     | Gli altri blocchi degradano a testo.                                                                                                              |
| Microsoft Teams | Adaptive Cards                      | Il testo semplice `message` viene incluso con la scheda quando sono forniti entrambi.                                                             |
| Feishu          | Schede interattive                  | L'intestazione della scheda può usare `title`; il corpo evita di duplicare quel titolo.                                                           |
| Canali semplici | Fallback testuale                   | I canali senza renderer ricevono comunque un output leggibile.                                                                                    |

La compatibilità dei payload nativi del provider è un supporto di transizione per i produttori esistenti di
risposte. Non è un motivo per aggiungere nuovi campi nativi condivisi.

## Presentation vs InteractiveReply

`InteractiveReply` è il vecchio sottoinsieme interno usato dagli helper di approvazione e interazione.
Supporta:

- testo
- pulsanti
- selezioni

`MessagePresentation` è il contratto canonico di invio condiviso. Aggiunge:

- titolo
- tono
- contesto
- divisore
- pulsanti solo URL
- metadati di consegna generici tramite `ReplyPayload.delivery`

Usa gli helper da `openclaw/plugin-sdk/interactive-runtime` quando colleghi codice
più vecchio:
__OC_I18N_900011__
Il nuovo codice deve accettare o produrre direttamente `MessagePresentation`. I payload
`interactive` esistenti sono un sottoinsieme deprecato di `presentation`; il supporto
runtime rimane per i produttori più vecchi.

I vecchi tipi `InteractiveReply*` e gli helper di conversione sono contrassegnati come
`@deprecated` nell'SDK:

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
`presentationToInteractiveControlsReply(...)` rimangono disponibili come bridge di renderer
per le vecchie implementazioni di canale. Il nuovo codice produttore non deve chiamarli;
invia `presentation` e lascia che l'adattamento core/canale gestisca il rendering.

Anche gli helper di approvazione hanno sostituti presentation-first:

- usa `buildApprovalPresentationFromActionDescriptors(...)` invece di
  `buildApprovalInteractiveReplyFromActionDescriptors(...)`
- usa `buildApprovalPresentation(...)` invece di
  `buildApprovalInteractiveReply(...)`
- usa `buildExecApprovalPresentation(...)` invece di
  `buildExecApprovalInteractiveReply(...)`

`renderMessagePresentationFallbackText(...)` restituisce una stringa vuota per
blocchi di presentazione che non hanno un fallback testuale, come una presentazione
solo con divisore. I trasporti che richiedono un corpo di invio non vuoto possono passare
`emptyFallback` per optare per un corpo minimo senza modificare il contratto di fallback
predefinito.

## Pin di consegna

Il pinning è un comportamento di consegna, non di presentazione. Usa `delivery.pin` invece di
campi nativi del provider come `channelData.telegram.pin`.

Semantica:

- `pin: true` fissa il primo messaggio consegnato correttamente.
- `pin.notify` ha come valore predefinito `false`.
- `pin.required` ha come valore predefinito `false`.
- I fallimenti di pin opzionali degradano e lasciano intatto il messaggio inviato.
- I fallimenti di pin obbligatori fanno fallire la consegna.
- I messaggi suddivisi in chunk fissano il primo chunk consegnato, non il chunk finale.

Le azioni messaggio manuali `pin`, `unpin` e `pins` esistono ancora per i messaggi
esistenti dove il provider supporta tali operazioni.

## Checklist per autori di Plugin

- Dichiara `presentation` da `describeMessageTool(...)` quando il canale può
  renderizzare o degradare in sicurezza la presentazione semantica.
- Aggiungi `presentationCapabilities` all'adapter runtime in uscita.
- Implementa `renderPresentation` nel codice runtime, non nel codice di configurazione del Plugin
  del piano di controllo.
- Tieni le librerie UI native fuori dai percorsi critici di setup/catalogo.
- Dichiara i limiti di funzionalità generici su `presentationCapabilities.limits` quando
  sono noti.
- Preserva i limiti finali della piattaforma nel renderer e nei test.
- Aggiungi test di fallback per pulsanti non supportati, selezioni, pulsanti URL, duplicazione titolo/testo
  e invii misti con `message` più `presentation`.
- Aggiungi il supporto al pin di consegna tramite `deliveryCapabilities.pin` e
  `pinDeliveredMessage` solo quando il provider può fissare l'id del messaggio inviato.
- Non esporre nuovi campi scheda/blocco/componente/pulsante nativi del provider tramite
  lo schema condiviso delle azioni messaggio.

## Documenti correlati

- [CLI dei messaggi](/it/cli/message)
- [Panoramica dell'SDK Plugin](/it/plugins/sdk-overview)
- [Architettura dei Plugin](/it/plugins/architecture-internals#message-tool-schemas)
- [Piano di refactor della presentazione dei canali](/it/plan/ui-channels)
