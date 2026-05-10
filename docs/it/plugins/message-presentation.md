---
read_when:
    - Aggiunta o modifica del rendering di schede di messaggio, pulsanti o selettori
    - Creare un Plugin di canale che supporta messaggi in uscita avanzati
    - Modificare la presentazione dello strumento per i messaggi o le capacità di recapito
    - Risoluzione delle regressioni specifiche del fornitore nella resa di schede/blocchi/componenti
summary: Schede messaggio semantiche, pulsanti, menu di selezione, testo di fallback e indicazioni di consegna per i plugin di canale
title: Presentazione dei messaggi
x-i18n:
    generated_at: "2026-05-10T19:44:09Z"
    model: gpt-5.5
    provider: openai
    source_hash: e3b6fc82b5faaff50e8c58f2c68e14a6a1b30ccf1d8dba7da8164dbec5ebe1b0
    source_path: plugins/message-presentation.md
    workflow: 16
---

La presentazione dei messaggi è il contratto condiviso di OpenClaw per interfacce chat in uscita avanzate.
Consente ad agenti, comandi CLI, flussi di approvazione e plugin di descrivere
una volta l'intento del messaggio, mentre ciascun plugin di canale renderizza la migliore forma nativa possibile.

Usa la presentazione per un'interfaccia messaggio portabile:

- sezioni di testo
- piccolo testo di contesto/piè di pagina
- divisori
- pulsanti
- menu di selezione
- titolo e tono della scheda

Non aggiungere nuovi campi nativi del provider come Discord `components`, Slack
`blocks`, Telegram `buttons`, Teams `card` o Feishu `card` allo strumento di
messaggio condiviso. Questi sono output del renderer di proprietà del plugin di canale.

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

- `value` è un valore di azione dell'applicazione reinstradato attraverso il
  percorso di interazione esistente del canale quando il canale supporta controlli cliccabili.
- `url` è un pulsante link. Può esistere senza `value`.
- `label` è obbligatorio ed è usato anche nel fallback testuale.
- `style` è consultivo. I renderer devono mappare gli stili non supportati a un
  valore predefinito sicuro, non far fallire l'invio.

Semantica della selezione:

- `options[].value` è il valore dell'applicazione selezionato.
- `placeholder` è consultivo e può essere ignorato dai canali senza supporto
  nativo per le selezioni.
- Se un canale non supporta le selezioni, il testo di fallback elenca le etichette.

## Esempi di produttori

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

I plugin di canale dichiarano il supporto di rendering sul loro adapter in uscita:

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

I campi di capacità sono booleani intenzionalmente semplici. Descrivono ciò che il
renderer può rendere interattivo, non ogni limite della piattaforma nativa. I renderer restano
responsabili dei limiti specifici della piattaforma, come numero massimo di pulsanti, numero di blocchi e
dimensione della scheda.

## Flusso di rendering del core

Quando un `ReplyPayload` o un'azione messaggio include `presentation`, il core:

1. Normalizza il payload di presentazione.
2. Risolve l'adapter in uscita del canale di destinazione.
3. Legge `presentationCapabilities`.
4. Chiama `renderPresentation` quando l'adapter può renderizzare il payload.
5. Ripiega su testo conservativo quando l'adapter è assente o non può renderizzare.
6. Invia il payload risultante attraverso il normale percorso di consegna del canale.
7. Applica metadati di consegna come `delivery.pin` dopo il primo messaggio
   inviato con successo.

Il core possiede il comportamento di fallback così i produttori possono restare indipendenti dal canale. I plugin di
canale possiedono rendering nativo e gestione delle interazioni.

## Regole di degradazione

La presentazione deve essere sicura da inviare su canali limitati.

Il testo di fallback include:

- `title` come prima riga
- blocchi `text` come paragrafi normali
- blocchi `context` come righe di contesto compatte
- blocchi `divider` come separatore visivo
- etichette dei pulsanti, inclusi gli URL per i pulsanti link
- etichette delle opzioni di selezione

I controlli nativi non supportati devono degradare invece di far fallire l'intero invio.
Esempi:

- Telegram con pulsanti inline disabilitati invia il fallback testuale.
- Un canale senza supporto per le selezioni elenca le opzioni di selezione come testo.
- Un pulsante solo URL diventa un pulsante link nativo oppure una riga URL di fallback.
- I fallimenti opzionali di fissaggio non fanno fallire il messaggio consegnato.

L'eccezione principale è `delivery.pin.required: true`; se il fissaggio è richiesto come
obbligatorio e il canale non può fissare il messaggio inviato, la consegna segnala un fallimento.

## Mappatura dei provider

Renderer in bundle attuali:

| Canale          | Destinazione di rendering nativa     | Note                                                                                                                                                                       |
| --------------- | ------------------------------------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Discord         | Componenti e contenitori di componenti | Preserva `channelData.discord.components` legacy per i produttori di payload nativi del provider esistenti, ma i nuovi invii condivisi devono usare `presentation`.       |
| Slack           | Block Kit                            | Preserva `channelData.slack.blocks` legacy per i produttori di payload nativi del provider esistenti, ma i nuovi invii condivisi devono usare `presentation`.             |
| Telegram        | Testo più tastiere inline            | Pulsanti/selezioni richiedono capacità di pulsanti inline per la superficie di destinazione; altrimenti viene usato il fallback testuale.                                  |
| Mattermost      | Testo più props interattive          | Gli altri blocchi degradano a testo.                                                                                                                                       |
| Microsoft Teams | Adaptive Cards                       | Il testo `message` semplice è incluso con la scheda quando entrambi sono forniti.                                                                                          |
| Feishu          | Schede interattive                   | L'intestazione della scheda può usare `title`; il corpo evita di duplicare quel titolo.                                                                                    |
| Canali semplici | Fallback testuale                    | I canali senza renderer ricevono comunque output leggibile.                                                                                                                |

La compatibilità con payload nativi del provider è una facilitazione di transizione per i
produttori di risposte esistenti. Non è un motivo per aggiungere nuovi campi nativi condivisi.

## Presentazione vs InteractiveReply

`InteractiveReply` è il sottoinsieme interno precedente usato dagli helper di approvazione e interazione.
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
precedente:

```ts
import {
  interactiveReplyToPresentation,
  normalizeMessagePresentation,
  presentationToInteractiveControlsReply,
  presentationToInteractiveReply,
  renderMessagePresentationFallbackText,
} from "openclaw/plugin-sdk/interactive-runtime";
```

Il nuovo codice deve accettare o produrre direttamente `MessagePresentation`.

`presentationToInteractiveReply(...)` preserva il testo di presentazione visibile
mappando titolo, testo, contesto, pulsanti e selezioni nella forma precedente
`InteractiveReply`. I renderer di componenti che già disegnano nativamente blocchi titolo, testo,
contesto e divisore devono usare invece
`presentationToInteractiveControlsReply(...)`, quindi aggiungere solo i controlli
pulsante e selezione.

`renderMessagePresentationFallbackText(...)` restituisce una stringa vuota per i
blocchi di presentazione che non hanno fallback testuale, come una presentazione con solo divisore.
I trasporti che richiedono un corpo di invio non vuoto possono passare
`emptyFallback` per optare per un corpo minimo senza cambiare il contratto di fallback
predefinito.

## Fissaggio della consegna

Il fissaggio è comportamento di consegna, non presentazione. Usa `delivery.pin` invece dei
campi nativi del provider come `channelData.telegram.pin`.

Semantica:

- `pin: true` fissa il primo messaggio consegnato con successo.
- `pin.notify` è predefinito a `false`.
- `pin.required` è predefinito a `false`.
- I fallimenti opzionali di fissaggio degradano e lasciano intatto il messaggio inviato.
- I fallimenti di fissaggio obbligatori fanno fallire la consegna.
- I messaggi suddivisi in blocchi fissano il primo blocco consegnato, non il blocco finale.

Le azioni messaggio manuali `pin`, `unpin` e `pins` esistono ancora per i messaggi
esistenti in cui il provider supporta quelle operazioni.

## Checklist per autori di Plugin

- Dichiara `presentation` da `describeMessageTool(...)` quando il canale può
  renderizzare o degradare in sicurezza la presentazione semantica.
- Aggiungi `presentationCapabilities` all'adapter in uscita di runtime.
- Implementa `renderPresentation` nel codice di runtime, non nel codice di
  configurazione del Plugin del piano di controllo.
- Tieni le librerie UI native fuori dai percorsi caldi di configurazione/catalogo.
- Preserva i limiti della piattaforma nel renderer e nei test.
- Aggiungi test di fallback per pulsanti non supportati, selezioni, pulsanti URL, duplicazione
  titolo/testo e invii misti `message` più `presentation`.
- Aggiungi supporto al fissaggio della consegna tramite `deliveryCapabilities.pin` e
  `pinDeliveredMessage` solo quando il provider può fissare l'id del messaggio inviato.
- Non esporre nuovi campi scheda/blocco/componente/pulsante nativi del provider attraverso
  lo schema di azione messaggio condiviso.

## Documenti correlati

- [CLI messaggi](/it/cli/message)
- [Panoramica Plugin SDK](/it/plugins/sdk-overview)
- [Architettura Plugin](/it/plugins/architecture-internals#message-tool-schemas)
- [Piano di refactoring della presentazione dei canali](/it/plan/ui-channels)
