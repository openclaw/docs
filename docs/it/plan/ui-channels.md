---
read_when:
    - Refactoring della UI dei messaggi del canale, dei payload interattivi o dei renderer nativi del canale
    - Modificare le capacità degli strumenti di messaggistica, i suggerimenti di recapito o i marcatori cross-context
    - Debug del fanout di importazione di Discord Carbon o della lazy initialization del runtime del Plugin del canale
summary: Disaccoppiare la presentazione semantica dei messaggi dai renderer UI nativi dei canali.
title: Piano di refactor della presentazione dei canali
x-i18n:
    generated_at: "2026-04-24T08:49:14Z"
    model: gpt-5.4
    provider: openai
    source_hash: f983c4d14580e8a66744c7e5f23dd9846c11e926181a8441d60f346cec6d1eea
    source_path: plan/ui-channels.md
    workflow: 15
---

## Stato

Implementato per l'agente condiviso, la CLI, la capacità del Plugin e le superfici di recapito in uscita:

- `ReplyPayload.presentation` trasporta la UI semantica del messaggio.
- `ReplyPayload.delivery.pin` trasporta le richieste di pin del messaggio inviato.
- Le azioni di messaggistica condivise espongono `presentation`, `delivery` e `pin` invece di `components`, `blocks`, `buttons` o `card` nativi del provider.
- Il core renderizza o degrada automaticamente la presentazione tramite le capacità in uscita dichiarate dal Plugin.
- I renderer di Discord, Slack, Telegram, Mattermost, MS Teams e Feishu consumano il contratto generico.
- Il codice del control plane del canale Discord non importa più contenitori UI supportati da Carbon.

La documentazione canonica ora si trova in [Message Presentation](/it/plugins/message-presentation).
Mantieni questo piano come contesto storico di implementazione; aggiorna la guida canonica
per cambiamenti di contratto, renderer o comportamento di fallback.

## Problema

La UI dei canali è attualmente divisa su più superfici incompatibili:

- Il core possiede un hook di renderer cross-context con forma Discord tramite `buildCrossContextComponents`.
- `channel.ts` di Discord può importare UI native Carbon tramite `DiscordUiContainer`, che porta dipendenze UI runtime nel control plane del Plugin del canale.
- L'agente e la CLI espongono vie di fuga native del payload come `components` di Discord, `blocks` di Slack, `buttons` di Telegram o Mattermost e `card` di Teams o Feishu.
- `ReplyPayload.channelData` trasporta sia suggerimenti di trasporto sia envelope UI native.
- Il modello generico `interactive` esiste, ma è più stretto dei layout più ricchi già usati da Discord, Slack, Teams, Feishu, LINE, Telegram e Mattermost.

Questo rende il core consapevole delle forme UI native, indebolisce la lazy initialization del runtime del Plugin e offre agli agenti troppi modi specifici del provider per esprimere la stessa intenzione del messaggio.

## Obiettivi

- Il core decide la migliore presentazione semantica per un messaggio a partire dalle capacità dichiarate.
- Le estensioni dichiarano capacità e renderizzano la presentazione semantica nei payload di trasporto nativi.
- La Web Control UI resta separata dalla UI nativa della chat.
- I payload nativi dei canali non sono esposti tramite l'agente condiviso o la superficie di messaggistica della CLI.
- Le funzionalità di presentazione non supportate degradano automaticamente alla migliore rappresentazione testuale.
- Il comportamento di recapito, come il pin di un messaggio inviato, è metadato di recapito generico, non presentazione.

## Non obiettivi

- Nessun shim di compatibilità retroattiva per `buildCrossContextComponents`.
- Nessuna via di fuga nativa pubblica per `components`, `blocks`, `buttons` o `card`.
- Nessuna importazione core di librerie UI native del canale.
- Nessun seam SDK specifico del provider per i canali inclusi.

## Modello di destinazione

Aggiungi un campo `presentation` posseduto dal core a `ReplyPayload`.

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

- Il blocco testuale `interactive` si mappa a `presentation.blocks[].type = "text"`.
- Il blocco pulsanti `interactive` si mappa a `presentation.blocks[].type = "buttons"`.
- Il blocco select `interactive` si mappa a `presentation.blocks[].type = "select"`.

Gli schemi esterni di agente e CLI ora usano `presentation`; `interactive` resta un helper interno legacy di parser/rendering per i produttori di risposte esistenti.

## Metadati di recapito

Aggiungi un campo `delivery` posseduto dal core per il comportamento di invio che non è UI.

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

- `delivery.pin = true` significa fissare il primo messaggio consegnato con successo.
- `notify` ha come predefinito `false`.
- `required` ha come predefinito `false`; canali non supportati o pinning fallito degradano automaticamente continuando il recapito.
- Le azioni manuali di messaggio `pin`, `unpin` e `list-pins` restano per i messaggi esistenti.

L'attuale binding ACP dei topic Telegram dovrebbe passare da `channelData.telegram.pin = true` a `delivery.pin = true`.

## Contratto delle capacità runtime

Aggiungi hook di rendering della presentazione e del recapito all'adapter runtime in uscita, non al Plugin del canale del control plane.

```ts
type ChannelPresentationCapabilities = {
  supported: boolean;
  buttons?: boolean;
  selects?: boolean;
  context?: boolean;
  divider?: boolean;
  tones?: MessagePresentationTone[];
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

- Risolve il canale di destinazione e il runtime adapter.
- Chiede le capacità di presentazione.
- Degrada i blocchi non supportati prima del rendering.
- Chiama `renderPresentation`.
- Se non esiste un renderer, converte la presentazione in fallback testuale.
- Dopo un invio riuscito, chiama `pinDeliveredMessage` quando `delivery.pin` è richiesto e supportato.

## Mappatura dei canali

Discord:

- Renderizza `presentation` in components v2 e contenitori Carbon in moduli solo runtime.
- Mantieni gli helper del colore accento in moduli leggeri.
- Rimuovi le importazioni `DiscordUiContainer` dal codice del control plane del Plugin del canale.

Slack:

- Renderizza `presentation` in Block Kit.
- Rimuovi l'input `blocks` da agente e CLI.

Telegram:

- Renderizza testo, context e divider come testo.
- Renderizza actions e select come tastiere inline quando configurato e consentito per la superficie di destinazione.
- Usa il fallback testuale quando i pulsanti inline sono disabilitati.
- Sposta il pinning del topic ACP in `delivery.pin`.

Mattermost:

- Renderizza le actions come pulsanti interattivi quando configurato.
- Renderizza gli altri blocchi come fallback testuale.

MS Teams:

- Renderizza `presentation` in Adaptive Cards.
- Mantieni le azioni manuali `pin`/`unpin`/`list-pins`.
- Implementa facoltativamente `pinDeliveredMessage` se il supporto Graph è affidabile per la conversazione di destinazione.

Feishu:

- Renderizza `presentation` in schede interattive.
- Mantieni le azioni manuali `pin`/`unpin`/`list-pins`.
- Implementa facoltativamente `pinDeliveredMessage` per il pinning dei messaggi inviati se il comportamento dell'API è affidabile.

LINE:

- Renderizza `presentation` in messaggi Flex o template dove possibile.
- Usa il fallback al testo per i blocchi non supportati.
- Rimuovi i payload UI LINE da `channelData`.

Canali semplici o limitati:

- Convertono la presentazione in testo con formattazione conservativa.

## Passaggi del refactor

1. Riapplica la correzione di release di Discord che separa `ui-colors.ts` dalla UI supportata da Carbon e rimuove `DiscordUiContainer` da `extensions/discord/src/channel.ts`.
2. Aggiungi `presentation` e `delivery` a `ReplyPayload`, normalizzazione dei payload in uscita, riepiloghi di recapito e payload degli hook.
3. Aggiungi schema `MessagePresentation` e helper di parsing in un sottopercorso stretto SDK/runtime.
4. Sostituisci le capacità di messaggio `buttons`, `cards`, `components` e `blocks` con capacità di presentazione semantica.
5. Aggiungi hook runtime dell'adapter in uscita per rendering della presentazione e pinning del recapito.
6. Sostituisci la costruzione dei componenti cross-context con `buildCrossContextPresentation`.
7. Elimina `src/infra/outbound/channel-adapters.ts` e rimuovi `buildCrossContextComponents` dai tipi del Plugin del canale.
8. Modifica `maybeApplyCrossContextMarker` in modo che alleghi `presentation` invece di parametri nativi.
9. Aggiorna i percorsi di invio plugin-dispatch in modo che consumino solo presentazione semantica e metadati di recapito.
10. Rimuovi i parametri di payload nativi di agente e CLI: `components`, `blocks`, `buttons` e `card`.
11. Rimuovi gli helper SDK che creano schemi di strumenti di messaggistica nativi, sostituendoli con helper di schema della presentazione.
12. Rimuovi gli envelope UI/native da `channelData`; mantieni solo i metadati di trasporto finché ogni campo rimanente non sarà stato rivisto.
13. Migra i renderer di Discord, Slack, Telegram, Mattermost, MS Teams, Feishu e LINE.
14. Aggiorna la documentazione per CLI dei messaggi, pagine dei canali, Plugin SDK e cookbook delle capacità.
15. Esegui profiling del fanout delle importazioni per Discord e gli entrypoint dei canali interessati.

I passaggi 1-11 e 13-14 sono implementati in questo refactor per i contratti dell'agente condiviso, della CLI, delle capacità del Plugin e dell'adapter in uscita. Il passaggio 12 resta un cleanup pass interno più profondo per gli envelope di trasporto `channelData` privati del provider. Il passaggio 15 resta una validazione successiva se vogliamo numeri quantificati sul fanout delle importazioni oltre al controllo di tipo/test.

## Test

Aggiungi o aggiorna:

- Test di normalizzazione della presentazione.
- Test di auto-degrado della presentazione per blocchi non supportati.
- Test dei marcatori cross-context per i percorsi plugin-dispatch e di recapito core.
- Test della matrice di rendering dei canali per Discord, Slack, Telegram, Mattermost, MS Teams, Feishu, LINE e fallback testuale.
- Test dello schema degli strumenti di messaggio che dimostrino che i campi nativi sono stati rimossi.
- Test CLI che dimostrino che i flag nativi sono stati rimossi.
- Regressione sulla lazy initialization dell'entrypoint di Discord che copra Carbon.
- Test di delivery pin che coprano Telegram e il fallback generico.

## Domande aperte

- `delivery.pin` dovrebbe essere implementato per Discord, Slack, MS Teams e Feishu nel primo passaggio, oppure inizialmente solo per Telegram?
- `delivery` dovrebbe eventualmente assorbire campi esistenti come `replyToId`, `replyToCurrent`, `silent` e `audioAsVoice`, oppure restare focalizzato sui comportamenti post-invio?
- La presentazione dovrebbe supportare direttamente immagini o riferimenti a file, oppure per ora i media dovrebbero restare separati dal layout UI?

## Correlati

- [Panoramica dei canali](/it/channels)
- [Message Presentation](/it/plugins/message-presentation)
