---
read_when:
    - Refactoring dell'interfaccia utente dei messaggi di canale, dei payload interattivi o dei renderer nativi dei canali
    - Modifica delle capacità degli strumenti di messaggistica, dei suggerimenti di recapito o dei marcatori tra contesti
    - Debug del fanout dell’importazione Discord Carbon o della pigrizia di runtime del Plugin di canale
summary: Disaccoppia la presentazione semantica dei messaggi dai renderer dell'interfaccia utente nativa dei canali.
title: Piano di refactoring della presentazione dei canali
x-i18n:
    generated_at: "2026-06-27T17:43:58Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 6b0f0c4f64e0c503209ac0a5b763b1b5483bf8d55a28ceacffbbcd1337d4371e
    source_path: plan/ui-channels.md
    workflow: 16
---

## Stato

Implementato per le superfici dell’agente condiviso, della CLI, delle capacità dei Plugin e della consegna in uscita:

- `ReplyPayload.presentation` trasporta l’interfaccia semantica dei messaggi.
- `ReplyPayload.delivery.pin` trasporta le richieste di fissare i messaggi inviati.
- Le azioni di messaggio condivise espongono `presentation`, `delivery` e `pin` invece di `components`, `blocks`, `buttons` o `card` nativi del provider.
- Il core renderizza o degrada automaticamente la presentazione tramite le capacità in uscita dichiarate dai Plugin.
- I renderer di Discord, Slack, Telegram, Mattermost, MS Teams e Feishu consumano il contratto generico.
- Il codice del piano di controllo del canale Discord non importa più contenitori UI basati su Carbon.

La documentazione canonica ora si trova in [Presentazione dei messaggi](/it/plugins/message-presentation).
Mantieni questo piano come contesto storico di implementazione; aggiorna la guida canonica
per modifiche al contratto, al renderer o al comportamento di fallback.

## Problema

L’interfaccia dei canali è attualmente divisa tra diverse superfici incompatibili:

- Il core possiede un hook di rendering cross-context con forma Discord tramite `buildCrossContextComponents`.
- `channel.ts` di Discord può importare l’interfaccia Carbon nativa tramite `DiscordUiContainer`, che porta dipendenze UI di runtime nel piano di controllo del Plugin del canale.
- L’agente e la CLI espongono vie di fuga per payload nativi come `components` di Discord, `blocks` di Slack, `buttons` di Telegram o Mattermost, e `card` di Teams o Feishu.
- `ReplyPayload.channelData` trasporta sia suggerimenti di trasporto sia envelope UI native.
- Il modello generico `interactive` esiste, ma è più limitato dei layout più ricchi già usati da Discord, Slack, Teams, Feishu, LINE, Telegram e Mattermost.

Questo rende il core consapevole delle forme UI native, indebolisce la pigrizia del runtime dei Plugin e offre agli agenti troppi modi specifici per provider di esprimere la stessa intenzione di messaggio.

## Obiettivi

- Il core decide la migliore presentazione semantica per un messaggio in base alle capacità dichiarate.
- Le estensioni dichiarano capacità e renderizzano la presentazione semantica in payload di trasporto nativi.
- La Web Control UI resta separata dall’interfaccia nativa della chat.
- I payload nativi dei canali non sono esposti tramite la superficie dei messaggi dell’agente condiviso o della CLI.
- Le funzionalità di presentazione non supportate degradano automaticamente alla migliore rappresentazione testuale.
- Il comportamento di consegna, come fissare un messaggio inviato, è metadato generico di consegna, non presentazione.

## Non obiettivi

- Nessuno shim di retrocompatibilità per `buildCrossContextComponents`.
- Nessuna via di fuga nativa pubblica per `components`, `blocks`, `buttons` o `card`.
- Nessuna importazione core di librerie UI native dei canali.
- Nessuna giuntura SDK specifica per provider per i canali inclusi.

## Modello di destinazione

Aggiungere un campo `presentation` posseduto dal core a `ReplyPayload`.

```ts
type MessagePresentationTone = "neutral" | "info" | "success" | "warning" | "danger";

type MessagePresentation = {
  tone?: MessagePresentationTone;
  title?: string;
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
```

`interactive` diventa un sottoinsieme di `presentation` durante la migrazione:

- Il blocco di testo `interactive` viene mappato a `presentation.blocks[].type = "text"`.
- Il blocco di pulsanti `interactive` viene mappato a `presentation.blocks[].type = "buttons"`.
- Il blocco di selezione `interactive` viene mappato a `presentation.blocks[].type = "select"`.

Gli schemi esterni di agente e CLI ora usano `presentation`; `interactive` resta un helper interno legacy di parsing/rendering per i produttori di risposte esistenti.
L’API pubblica rivolta ai produttori tratta `interactive` come deprecato. Il supporto runtime
rimane affinché gli helper di approvazione esistenti e i Plugin più vecchi continuino a
funzionare mentre il nuovo codice emette `presentation`.

## Metadati di consegna

Aggiungere un campo `delivery` posseduto dal core per il comportamento di invio che non riguarda la UI.

```ts
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

Semantica:

- `delivery.pin = true` significa fissare il primo messaggio consegnato correttamente.
- `notify` ha valore predefinito `false`.
- `required` ha valore predefinito `false`; canali non supportati o fissaggio non riuscito degradano automaticamente continuando la consegna.
- Le azioni manuali di messaggio `pin`, `unpin` e `list-pins` restano per i messaggi esistenti.

L’attuale associazione dell’argomento ACP di Telegram deve passare da `channelData.telegram.pin = true` a `delivery.pin = true`.

## Contratto delle capacità runtime

Aggiungere hook di rendering della presentazione e della consegna all’adapter runtime in uscita, non al Plugin del canale del piano di controllo.

```ts
type ChannelPresentationCapabilities = {
  supported: boolean;
  buttons?: boolean;
  selects?: boolean;
  context?: boolean;
  divider?: boolean;
  tones?: MessagePresentationTone[];
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

type ChannelDeliveryCapabilities = {
  pinSentMessage?: boolean;
};

type ChannelOutboundAdapter = {
  presentationCapabilities?: ChannelPresentationCapabilities;

  renderPresentation?: (params: {
    payload: ReplyPayload;
    presentation: MessagePresentation;
    ctx: ChannelOutboundSendContext;
  }) => ReplyPayload | null;

  deliveryCapabilities?: ChannelDeliveryCapabilities;

  pinDeliveredMessage?: (params: {
    cfg: OpenClawConfig;
    accountId?: string | null;
    to: string;
    threadId?: string | number | null;
    messageId: string;
    notify: boolean;
  }) => Promise<void>;
};
```

Comportamento del core:

- Risolvere il canale di destinazione e l’adapter runtime.
- Richiedere le capacità di presentazione.
- Degradare i blocchi non supportati e applicare limiti generici delle capacità prima del
  rendering.
- Chiamare `renderPresentation`.
- Se non esiste alcun renderer, convertire la presentazione in fallback testuale.
- Dopo un invio riuscito, chiamare `pinDeliveredMessage` quando `delivery.pin` è richiesto e supportato.

## Mappatura dei canali

Discord:

- Renderizzare `presentation` in componenti v2 e contenitori Carbon in moduli solo runtime.
- Mantenere gli helper per i colori di accento in moduli leggeri.
- Rimuovere le importazioni di `DiscordUiContainer` dal codice del piano di controllo del Plugin del canale.

Slack:

- Renderizzare `presentation` in Block Kit.
- Rimuovere l’input `blocks` da agente e CLI.

Telegram:

- Renderizzare testo, contesto e divisori come testo.
- Renderizzare azioni e selezione come tastiere inline quando configurato e consentito per la superficie di destinazione.
- Usare il fallback testuale quando i pulsanti inline sono disabilitati.
- Spostare il fissaggio degli argomenti ACP in `delivery.pin`.

Mattermost:

- Renderizzare le azioni come pulsanti interattivi quando configurato.
- Renderizzare gli altri blocchi come fallback testuale.

MS Teams:

- Renderizzare `presentation` in Adaptive Cards.
- Mantenere le azioni manuali pin/unpin/list-pins.
- Implementare facoltativamente `pinDeliveredMessage` se il supporto Graph è affidabile per la conversazione di destinazione.

Feishu:

- Renderizzare `presentation` in schede interattive.
- Mantenere le azioni manuali pin/unpin/list-pins.
- Implementare facoltativamente `pinDeliveredMessage` per fissare i messaggi inviati se il comportamento dell’API è affidabile.

LINE:

- Renderizzare `presentation` in messaggi Flex o template dove possibile.
- Ripiegare sul testo per i blocchi non supportati.
- Rimuovere i payload UI di LINE da `channelData`.

Canali semplici o limitati:

- Convertire la presentazione in testo con formattazione conservativa.

## Passaggi di refactor

1. Riapplicare la correzione di rilascio di Discord che separa `ui-colors.ts` dalla UI basata su Carbon e rimuove `DiscordUiContainer` da `extensions/discord/src/channel.ts`.
2. Aggiungere `presentation` e `delivery` a `ReplyPayload`, alla normalizzazione dei payload in uscita, ai riepiloghi di consegna e ai payload degli hook.
3. Aggiungere lo schema `MessagePresentation` e gli helper di parser in un sottopercorso SDK/runtime ristretto.
4. Sostituire le capacità dei messaggi `buttons`, `cards`, `components` e `blocks` con capacità di presentazione semantiche.
5. Aggiungere hook dell’adapter runtime in uscita per il rendering della presentazione e il fissaggio della consegna.
6. Sostituire la costruzione dei componenti cross-context con `buildCrossContextPresentation`.
7. Eliminare `src/infra/outbound/channel-adapters.ts` e rimuovere `buildCrossContextComponents` dai tipi del Plugin del canale.
8. Modificare `maybeApplyCrossContextMarker` per allegare `presentation` invece di parametri nativi.
9. Aggiornare i percorsi di invio di plugin-dispatch affinché consumino solo presentazione semantica e metadati di consegna.
10. Rimuovere i parametri nativi dei payload di agente e CLI: `components`, `blocks`, `buttons` e `card`.
11. Rimuovere gli helper SDK che creano schemi di strumenti di messaggio nativi, sostituendoli con helper dello schema di presentazione.
12. Rimuovere gli envelope UI/nativi da `channelData`; mantenere solo metadati di trasporto finché ogni campo rimanente non viene revisionato.
13. Migrare i renderer di Discord, Slack, Telegram, Mattermost, MS Teams, Feishu e LINE.
14. Aggiornare la documentazione per CLI dei messaggi, pagine dei canali, SDK dei Plugin e ricettario delle capacità.
15. Eseguire il profiling del fanout delle importazioni per Discord e gli entrypoint dei canali interessati.

I passaggi 1-11 e 13-14 sono implementati in questo refactor per i contratti dell’agente condiviso, della CLI, delle capacità dei Plugin e dell’adapter in uscita. Il passaggio 12 resta un intervento di pulizia interna più profondo per gli envelope di trasporto `channelData` privati dei provider. Il passaggio 15 resta una validazione di follow-up se vogliamo numeri quantificati sul fanout delle importazioni oltre al gate di tipi/test.

## Test

Aggiungere o aggiornare:

- Test di normalizzazione della presentazione.
- Test di degradazione automatica della presentazione per blocchi non supportati.
- Test dei marker cross-context per plugin dispatch e percorsi di consegna core.
- Test di matrice di rendering dei canali per Discord, Slack, Telegram, Mattermost, MS Teams, Feishu, LINE e fallback testuale.
- Test degli schemi degli strumenti di messaggio che dimostrino che i campi nativi sono stati rimossi.
- Test CLI che dimostrino che i flag nativi sono stati rimossi.
- Regressione della pigrizia delle importazioni dell’entrypoint Discord che copre Carbon.
- Test del fissaggio di consegna che coprano Telegram e fallback generico.

## Domande aperte

- `delivery.pin` dovrebbe essere implementato per Discord, Slack, MS Teams e Feishu nel primo passaggio, oppure solo per Telegram inizialmente?
- `delivery` dovrebbe infine assorbire campi esistenti come `replyToId`, `replyToCurrent`, `silent` e `audioAsVoice`, oppure restare focalizzato sui comportamenti post-invio?
- La presentazione dovrebbe supportare direttamente immagini o riferimenti a file, oppure i media dovrebbero restare separati dal layout UI per ora?

## Correlati

- [Panoramica dei canali](/it/channels)
- [Presentazione dei messaggi](/it/plugins/message-presentation)
