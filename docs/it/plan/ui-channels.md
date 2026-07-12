---
read_when:
    - Refactoring dell'interfaccia utente dei messaggi dei canali, dei payload interattivi o dei renderer nativi dei canali
    - Modifica delle funzionalità dello strumento per i messaggi, delle indicazioni di consegna o dei marcatori tra contesti
    - Debug del fanout delle importazioni Carbon di Discord o del caricamento differito del runtime del plugin di canale
summary: Disaccoppia la presentazione semantica dei messaggi dai renderer dell'interfaccia utente nativa del canale.
title: Piano di refactoring della presentazione dei canali
x-i18n:
    generated_at: "2026-07-12T07:10:55Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 6b0f0c4f64e0c503209ac0a5b763b1b5483bf8d55a28ceacffbbcd1337d4371e
    source_path: plan/ui-channels.md
    workflow: 16
---

## Stato

Implementato per le superfici condivise dell'agente, della CLI, delle funzionalità dei plugin e della consegna in uscita:

- `ReplyPayload.presentation` trasporta l'interfaccia semantica dei messaggi.
- `ReplyPayload.delivery.pin` trasporta le richieste di fissaggio dei messaggi inviati.
- Le azioni condivise sui messaggi espongono `presentation`, `delivery` e `pin` anziché `components`, `blocks`, `buttons` o `card` nativi del provider.
- Il core esegue il rendering della presentazione o ne applica automaticamente il degrado tramite le funzionalità in uscita dichiarate dal plugin.
- I renderer di Discord, Slack, Telegram, Mattermost, MS Teams e Feishu utilizzano il contratto generico.
- Il codice del piano di controllo del canale Discord non importa più contenitori dell'interfaccia basati su Carbon.

La documentazione canonica è ora disponibile in [Presentazione dei messaggi](/it/plugins/message-presentation).
Conservare questo piano come contesto storico dell'implementazione; aggiornare la guida canonica
in caso di modifiche al contratto, al renderer o al comportamento di ripiego.

## Problema

L'interfaccia dei canali è attualmente suddivisa tra diverse superfici incompatibili:

- Il core gestisce un hook di rendering tra contesti modellato su Discord tramite `buildCrossContextComponents`.
- `channel.ts` di Discord può importare l'interfaccia nativa Carbon tramite `DiscordUiContainer`, introducendo dipendenze di runtime dell'interfaccia nel piano di controllo del plugin del canale.
- L'agente e la CLI espongono vie di fuga per payload nativi, come `components` di Discord, `blocks` di Slack, `buttons` di Telegram o Mattermost e `card` di Teams o Feishu.
- `ReplyPayload.channelData` trasporta sia indicazioni di trasporto sia contenitori dell'interfaccia nativa.
- Il modello generico `interactive` esiste, ma è più limitato dei layout più ricchi già utilizzati da Discord, Slack, Teams, Feishu, LINE, Telegram e Mattermost.

Ciò rende il core consapevole delle strutture dell'interfaccia nativa, indebolisce il caricamento differito del runtime dei plugin e offre agli agenti troppi modi specifici dei provider per esprimere lo stesso intento del messaggio.

## Obiettivi

- Il core determina la migliore presentazione semantica per un messaggio in base alle funzionalità dichiarate.
- Le estensioni dichiarano le funzionalità ed eseguono il rendering della presentazione semantica nei payload di trasporto nativi.
- L'interfaccia Web Control rimane separata dall'interfaccia nativa delle chat.
- I payload nativi dei canali non vengono esposti tramite la superficie condivisa dei messaggi dell'agente o della CLI.
- Le funzionalità di presentazione non supportate vengono automaticamente degradate alla migliore rappresentazione testuale.
- Il comportamento di consegna, come il fissaggio di un messaggio inviato, è costituito da metadati generici di consegna, non dalla presentazione.

## Non obiettivi

- Nessuno shim di compatibilità con le versioni precedenti per `buildCrossContextComponents`.
- Nessuna via di fuga nativa pubblica per `components`, `blocks`, `buttons` o `card`.
- Nessuna importazione nel core di librerie dell'interfaccia native dei canali.
- Nessuna interfaccia SDK specifica del provider per i canali inclusi.

## Modello di destinazione

Aggiungere a `ReplyPayload` un campo `presentation` gestito dal core.

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

Durante la migrazione, `interactive` diventa un sottoinsieme di `presentation`:

- Il blocco di testo `interactive` viene mappato a `presentation.blocks[].type = "text"`.
- Il blocco di pulsanti `interactive` viene mappato a `presentation.blocks[].type = "buttons"`.
- Il blocco di selezione `interactive` viene mappato a `presentation.blocks[].type = "select"`.

Gli schemi esterni dell'agente e della CLI ora utilizzano `presentation`; `interactive` rimane un helper interno legacy per l'analisi e il rendering dei produttori di risposte esistenti.
L'API pubblica rivolta ai produttori considera `interactive` deprecato. Il supporto
di runtime rimane affinché gli helper di approvazione esistenti e i plugin meno recenti continuino a
funzionare, mentre il nuovo codice emette `presentation`.

## Metadati di consegna

Aggiungere un campo `delivery` gestito dal core per il comportamento di invio che non riguarda l'interfaccia.

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

- `delivery.pin = true` indica di fissare il primo messaggio consegnato correttamente.
- Il valore predefinito di `notify` è `false`.
- Il valore predefinito di `required` è `false`; i canali non supportati o gli errori di fissaggio vengono automaticamente gestiti proseguendo la consegna.
- Le azioni manuali sui messaggi `pin`, `unpin` e `list-pins` rimangono disponibili per i messaggi esistenti.

L'associazione attuale degli argomenti ACP di Telegram deve passare da `channelData.telegram.pin = true` a `delivery.pin = true`.

## Contratto delle funzionalità di runtime

Aggiungere hook per il rendering della presentazione e della consegna all'adattatore di runtime in uscita, non al plugin del canale nel piano di controllo.

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

- Risolvere il canale di destinazione e l'adattatore di runtime.
- Richiedere le funzionalità di presentazione.
- Degradare i blocchi non supportati e applicare i limiti generici delle funzionalità prima
  del rendering.
- Chiamare `renderPresentation`.
- Se non esiste alcun renderer, convertire la presentazione in una rappresentazione testuale di ripiego.
- Dopo un invio riuscito, chiamare `pinDeliveredMessage` quando `delivery.pin` è richiesto e supportato.

## Mappatura dei canali

Discord:

- Eseguire il rendering di `presentation` in componenti v2 e contenitori Carbon nei moduli esclusivamente di runtime.
- Mantenere gli helper per i colori di accento in moduli leggeri.
- Rimuovere le importazioni di `DiscordUiContainer` dal codice del piano di controllo del plugin del canale.

Slack:

- Eseguire il rendering di `presentation` in Block Kit.
- Rimuovere l'input `blocks` dall'agente e dalla CLI.

Telegram:

- Eseguire il rendering di testo, contesto e divisori come testo.
- Eseguire il rendering delle azioni e della selezione come tastiere inline quando configurate e consentite per la superficie di destinazione.
- Utilizzare la rappresentazione testuale di ripiego quando i pulsanti inline sono disabilitati.
- Spostare il fissaggio degli argomenti ACP in `delivery.pin`.

Mattermost:

- Eseguire il rendering delle azioni come pulsanti interattivi quando configurato.
- Eseguire il rendering degli altri blocchi come rappresentazione testuale di ripiego.

MS Teams:

- Eseguire il rendering di `presentation` in Adaptive Cards.
- Mantenere le azioni manuali `pin`/`unpin`/`list-pins`.
- Implementare facoltativamente `pinDeliveredMessage` se il supporto di Graph è affidabile per la conversazione di destinazione.

Feishu:

- Eseguire il rendering di `presentation` in schede interattive.
- Mantenere le azioni manuali `pin`/`unpin`/`list-pins`.
- Implementare facoltativamente `pinDeliveredMessage` per il fissaggio dei messaggi inviati se il comportamento dell'API è affidabile.

LINE:

- Eseguire il rendering di `presentation` in messaggi Flex o basati su modelli, ove possibile.
- Utilizzare una rappresentazione testuale di ripiego per i blocchi non supportati.
- Rimuovere i payload dell'interfaccia LINE da `channelData`.

Canali semplici o limitati:

- Convertire la presentazione in testo con una formattazione prudente.

## Passaggi di refactoring

1. Riapplicare la correzione della versione Discord che separa `ui-colors.ts` dall'interfaccia basata su Carbon e rimuove `DiscordUiContainer` da `extensions/discord/src/channel.ts`.
2. Aggiungere `presentation` e `delivery` a `ReplyPayload`, alla normalizzazione dei payload in uscita, ai riepiloghi di consegna e ai payload degli hook.
3. Aggiungere lo schema `MessagePresentation` e gli helper di analisi in un sottopercorso SDK/runtime circoscritto.
4. Sostituire le funzionalità dei messaggi `buttons`, `cards`, `components` e `blocks` con funzionalità di presentazione semantiche.
5. Aggiungere hook dell'adattatore di runtime in uscita per il rendering della presentazione e il fissaggio alla consegna.
6. Sostituire la costruzione di componenti tra contesti con `buildCrossContextPresentation`.
7. Eliminare `src/infra/outbound/channel-adapters.ts` e rimuovere `buildCrossContextComponents` dai tipi del plugin del canale.
8. Modificare `maybeApplyCrossContextMarker` affinché alleghi `presentation` anziché parametri nativi.
9. Aggiornare i percorsi di invio della distribuzione ai plugin affinché utilizzino esclusivamente la presentazione semantica e i metadati di consegna.
10. Rimuovere i parametri dei payload nativi dell'agente e della CLI: `components`, `blocks`, `buttons` e `card`.
11. Rimuovere gli helper SDK che creano schemi nativi degli strumenti per i messaggi, sostituendoli con helper dello schema di presentazione.
12. Rimuovere i contenitori dell'interfaccia nativa da `channelData`; mantenere solo i metadati di trasporto finché ciascun campo rimanente non sarà stato esaminato.
13. Migrare i renderer di Discord, Slack, Telegram, Mattermost, MS Teams, Feishu e LINE.
14. Aggiornare la documentazione per la CLI dei messaggi, le pagine dei canali, l'SDK dei plugin e il ricettario delle funzionalità.
15. Eseguire la profilazione della propagazione delle importazioni per Discord e per i punti di ingresso dei canali interessati.

I passaggi 1-11 e 13-14 sono implementati in questo refactoring per i contratti condivisi dell'agente, della CLI, delle funzionalità dei plugin e degli adattatori in uscita. Il passaggio 12 rimane un intervento interno di pulizia più approfondito per i contenitori di trasporto `channelData` privati dei provider. Il passaggio 15 rimane una convalida successiva qualora si desiderino dati quantitativi sulla propagazione delle importazioni oltre il controllo di tipi e test.

## Test

Aggiungere o aggiornare:

- Test di normalizzazione della presentazione.
- Test del degrado automatico della presentazione per i blocchi non supportati.
- Test dei marcatori tra contesti per la distribuzione ai plugin e i percorsi di consegna del core.
- Test della matrice di rendering dei canali per Discord, Slack, Telegram, Mattermost, MS Teams, Feishu, LINE e la rappresentazione testuale di ripiego.
- Test dello schema degli strumenti per i messaggi che dimostrino la rimozione dei campi nativi.
- Test della CLI che dimostrino la rimozione dei flag nativi.
- Regressione del caricamento differito delle importazioni del punto di ingresso Discord relativa a Carbon.
- Test del fissaggio alla consegna per Telegram e per il ripiego generico.

## Questioni aperte

- `delivery.pin` deve essere implementato per Discord, Slack, MS Teams e Feishu nella prima fase oppure inizialmente solo per Telegram?
- In futuro `delivery` deve assorbire campi esistenti come `replyToId`, `replyToCurrent`, `silent` e `audioAsVoice`, oppure rimanere incentrato sui comportamenti successivi all'invio?
- La presentazione deve supportare direttamente immagini o riferimenti a file oppure, per il momento, i contenuti multimediali devono rimanere separati dal layout dell'interfaccia?

## Contenuti correlati

- [Panoramica dei canali](/it/channels)
- [Presentazione dei messaggi](/it/plugins/message-presentation)
