---
read_when:
    - Aggiunta o modifica del rendering di schede messaggio, pulsanti o menu di selezione
    - Creazione di un Plugin di canale che supporta messaggi in uscita avanzati
    - Modificare la presentazione dello strumento per i messaggi o le capacità di recapito
    - Debug delle regressioni nel rendering di schede/blocchi/componenti specifici del provider
summary: Schede di messaggio semantiche, pulsanti, menu di selezione, testo di fallback e suggerimenti di consegna per i Plugin di canale
title: Presentazione dei messaggi
x-i18n:
    generated_at: "2026-04-30T09:04:13Z"
    model: gpt-5.5
    provider: openai
    source_hash: 23ef0eab890ee174c1433f72e84932a84a481f2bcf4b69bc793a2660ec94b10c
    source_path: plugins/message-presentation.md
    workflow: 16
---

La presentazione dei messaggi è il contratto condiviso di OpenClaw per un'interfaccia chat in uscita ricca.
Consente ad agenti, comandi CLI, flussi di approvazione e plugin di descrivere una sola volta
l'intento del messaggio, mentre ogni plugin di canale esegue il rendering nella migliore forma nativa possibile.

Usa la presentazione per un'interfaccia messaggio portabile:

- sezioni di testo
- piccolo testo di contesto/piè di pagina
- divisori
- pulsanti
- menu di selezione
- titolo e tono della scheda

Non aggiungere al tool messaggio condiviso nuovi campi nativi del provider come Discord `components`, Slack
`blocks`, Telegram `buttons`, Teams `card` o Feishu `card`. Questi sono output del renderer di proprietà del plugin di canale.

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

- `value` è un valore di azione dell'applicazione reinstradato tramite il percorso di interazione
  esistente del canale quando il canale supporta controlli cliccabili.
- `url` è un pulsante link. Può esistere senza `value`.
- `label` è obbligatorio e viene usato anche nel fallback testuale.
- `style` è indicativo. I renderer dovrebbero mappare gli stili non supportati su un valore
  predefinito sicuro, non far fallire l'invio.

Semantica della selezione:

- `options[].value` è il valore dell'applicazione selezionato.
- `placeholder` è indicativo e può essere ignorato dai canali senza supporto nativo
  per la selezione.
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

Invio da CLI:

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

I campi di capability sono intenzionalmente semplici booleani. Descrivono cosa il
renderer può rendere interattivo, non ogni limite della piattaforma nativa. I renderer restano
responsabili dei limiti specifici della piattaforma, come numero massimo di pulsanti, numero di blocchi e
dimensione della scheda.

## Flusso di rendering core

Quando un `ReplyPayload` o un'azione messaggio include `presentation`, il core:

1. Normalizza il payload di presentazione.
2. Risolve l'adattatore in uscita del canale di destinazione.
3. Legge `presentationCapabilities`.
4. Chiama `renderPresentation` quando l'adattatore può eseguire il rendering del payload.
5. Ripiega su testo prudente quando l'adattatore è assente o non può eseguire il rendering.
6. Invia il payload risultante tramite il normale percorso di consegna del canale.
7. Applica i metadati di consegna come `delivery.pin` dopo il primo messaggio
   inviato con successo.

Il core possiede il comportamento di fallback, così i produttori possono restare agnostici rispetto al canale. I plugin di canale
possiedono rendering nativo e gestione delle interazioni.

## Regole di degradazione

La presentazione deve essere sicura da inviare su canali limitati.

Il testo di fallback include:

- `title` come prima riga
- blocchi `text` come normali paragrafi
- blocchi `context` come righe di contesto compatte
- blocchi `divider` come separatore visivo
- etichette dei pulsanti, inclusi gli URL per i pulsanti link
- etichette delle opzioni di selezione

I controlli nativi non supportati dovrebbero degradare invece di far fallire l'intero invio.
Esempi:

- Telegram con pulsanti inline disabilitati invia il fallback testuale.
- Un canale senza supporto alla selezione elenca le opzioni di selezione come testo.
- Un pulsante solo URL diventa un pulsante link nativo o una riga URL di fallback.
- Gli errori di fissaggio opzionale non fanno fallire il messaggio consegnato.

L'eccezione principale è `delivery.pin.required: true`; se il fissaggio è richiesto come
obbligatorio e il canale non può fissare il messaggio inviato, la consegna segnala un errore.

## Mappatura provider

Renderer in bundle attuali:

| Canale          | Target di rendering nativo          | Note                                                                                                                                             |
| --------------- | ----------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------- |
| Discord         | Componenti e contenitori di componenti | Preserva `channelData.discord.components` legacy per i produttori esistenti di payload nativi del provider, ma i nuovi invii condivisi dovrebbero usare `presentation`. |
| Slack           | Block Kit                           | Preserva `channelData.slack.blocks` legacy per i produttori esistenti di payload nativi del provider, ma i nuovi invii condivisi dovrebbero usare `presentation`.       |
| Telegram        | Testo più tastiere inline           | Pulsanti/selezioni richiedono la capability dei pulsanti inline per la superficie di destinazione; altrimenti viene usato il fallback testuale.                                         |
| Mattermost      | Testo più proprietà interattive     | Gli altri blocchi degradano a testo.                                                                                                                     |
| Microsoft Teams | Adaptive Cards                      | Il testo semplice `message` viene incluso con la scheda quando sono forniti entrambi.                                                                            |
| Feishu          | Schede interattive                  | L'intestazione della scheda può usare `title`; il corpo evita di duplicare quel titolo.                                                                                  |
| Canali semplici | Fallback testuale                   | I canali senza renderer ricevono comunque un output leggibile.                                                                                            |

La compatibilità dei payload nativi del provider è una facilitazione di transizione per i produttori
di risposte esistenti. Non è un motivo per aggiungere nuovi campi nativi condivisi.

## Presentazione rispetto a InteractiveReply

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

```ts
import {
  interactiveReplyToPresentation,
  normalizeMessagePresentation,
  presentationToInteractiveReply,
  renderMessagePresentationFallbackText,
} from "openclaw/plugin-sdk/interactive-runtime";
```

Il nuovo codice dovrebbe accettare o produrre direttamente `MessagePresentation`.

## Fissaggio della consegna

Il fissaggio è un comportamento di consegna, non di presentazione. Usa `delivery.pin` invece di
campi nativi del provider come `channelData.telegram.pin`.

Semantica:

- `pin: true` fissa il primo messaggio consegnato con successo.
- `pin.notify` ha valore predefinito `false`.
- `pin.required` ha valore predefinito `false`.
- Gli errori di fissaggio opzionale degradano e lasciano intatto il messaggio inviato.
- Gli errori di fissaggio obbligatorio fanno fallire la consegna.
- I messaggi suddivisi in chunk fissano il primo chunk consegnato, non il chunk finale.

Le azioni messaggio manuali `pin`, `unpin` e `pins` esistono ancora per messaggi
esistenti dove il provider supporta tali operazioni.

## Checklist per autori di Plugin

- Dichiara `presentation` da `describeMessageTool(...)` quando il canale può
  eseguire il rendering o degradare in sicurezza la presentazione semantica.
- Aggiungi `presentationCapabilities` all'adattatore in uscita del runtime.
- Implementa `renderPresentation` nel codice runtime, non nel codice di configurazione
  del Plugin del piano di controllo.
- Tieni le librerie UI native fuori dai percorsi critici di setup/catalogo.
- Preserva i limiti della piattaforma nel renderer e nei test.
- Aggiungi test di fallback per pulsanti non supportati, selezioni, pulsanti URL, duplicazione titolo/testo
  e invii misti `message` più `presentation`.
- Aggiungi il supporto al fissaggio della consegna tramite `deliveryCapabilities.pin` e
  `pinDeliveredMessage` solo quando il provider può fissare l'id del messaggio inviato.
- Non esporre nuovi campi scheda/blocco/componente/pulsante nativi del provider tramite
  lo schema dell'azione messaggio condivisa.

## Documenti correlati

- [CLI messaggi](/it/cli/message)
- [Panoramica SDK Plugin](/it/plugins/sdk-overview)
- [Architettura dei Plugin](/it/plugins/architecture-internals#message-tool-schemas)
- [Piano di refactoring della presentazione dei canali](/it/plan/ui-channels)
