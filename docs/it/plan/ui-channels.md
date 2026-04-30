---
read_when:
    - Ristrutturazione dell'interfaccia utente dei messaggi dei canali, dei carichi utili interattivi o dei renderizzatori nativi dei canali
    - Modifica delle capacità dello strumento per i messaggi, dei suggerimenti di consegna o dei marcatori tra contesti
    - Risoluzione dei problemi del fan-out delle importazioni di Carbon in Discord o dell'inizializzazione differita del runtime del Plugin di canale
summary: Disaccoppia la presentazione semantica dei messaggi dai renderer dell'interfaccia utente nativa del canale.
title: Piano di refactoring della presentazione del canale
x-i18n:
    generated_at: "2026-04-30T09:00:46Z"
    model: gpt-5.5
    provider: openai
    source_hash: 5608e7806a2a20e73ee82f1b1f0fcbbb4c865232df984d3d98b91e5b721998f5
    source_path: plan/ui-channels.md
    workflow: 16
---

## Stato

Implementato per l’agente condiviso, la CLI, le capacità dei plugin e le superfici di recapito in uscita:

- `ReplyPayload.presentation` trasporta l’interfaccia semantica dei messaggi.
- `ReplyPayload.delivery.pin` trasporta le richieste di fissaggio dei messaggi inviati.
- Le azioni di messaggistica condivise espongono `presentation`, `delivery` e `pin` invece di `components`, `blocks`, `buttons` o `card` nativi del provider.
- Il core renderizza o degrada automaticamente la presentazione tramite le capacità in uscita dichiarate dal plugin.
- I renderer di Discord, Slack, Telegram, Mattermost, MS Teams e Feishu consumano il contratto generico.
- Il codice del control plane del canale Discord non importa più contenitori UI basati su Carbon.

La documentazione canonica ora si trova in [Presentazione dei messaggi](/it/plugins/message-presentation).
Mantieni questo piano come contesto storico dell’implementazione; aggiorna la guida canonica
per modifiche al contratto, al renderer o al comportamento di fallback.

## Problema

L’interfaccia dei canali è attualmente divisa tra diverse superfici incompatibili:

- Il core possiede un hook di rendering cross-context modellato su Discord tramite `buildCrossContextComponents`.
- `channel.ts` di Discord può importare l’interfaccia nativa Carbon tramite `DiscordUiContainer`, che porta dipendenze UI runtime nel control plane del plugin del canale.
- L’agente e la CLI espongono vie di fuga per payload nativi come `components` di Discord, `blocks` di Slack, `buttons` di Telegram o Mattermost e `card` di Teams o Feishu.
- `ReplyPayload.channelData` trasporta sia suggerimenti di trasporto sia envelope UI nativi.
- Il modello generico `interactive` esiste, ma è più ristretto dei layout più ricchi già usati da Discord, Slack, Teams, Feishu, LINE, Telegram e Mattermost.

Questo rende il core consapevole delle forme UI native, indebolisce la pigrizia runtime dei plugin e offre agli agenti troppi modi specifici per provider per esprimere lo stesso intento del messaggio.

## Obiettivi

- Il core decide la migliore presentazione semantica per un messaggio in base alle capacità dichiarate.
- Le estensioni dichiarano capacità e renderizzano la presentazione semantica in payload di trasporto nativi.
- La Web Control UI resta separata dall’interfaccia nativa della chat.
- I payload nativi dei canali non sono esposti tramite la superficie di messaggistica condivisa dell’agente o della CLI.
- Le funzionalità di presentazione non supportate degradano automaticamente alla migliore rappresentazione testuale.
- Il comportamento di recapito, come fissare un messaggio inviato, è metadato generico di recapito, non presentazione.

## Non obiettivi

- Nessuno shim di compatibilità all’indietro per `buildCrossContextComponents`.
- Nessuna via di fuga nativa pubblica per `components`, `blocks`, `buttons` o `card`.
- Nessuna importazione core di librerie UI native dei canali.
- Nessun seam SDK specifico per provider per i canali inclusi.

## Modello target

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

- Il blocco di testo `interactive` viene mappato a `presentation.blocks[].type = "text"`.
- Il blocco di pulsanti `interactive` viene mappato a `presentation.blocks[].type = "buttons"`.
- Il blocco di selezione `interactive` viene mappato a `presentation.blocks[].type = "select"`.

Gli schemi esterni dell’agente e della CLI ora usano `presentation`; `interactive` resta un helper interno legacy di parsing/rendering per i produttori di risposte esistenti.

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

- `delivery.pin = true` significa fissare il primo messaggio recapitato con successo.
- `notify` ha valore predefinito `false`.
- `required` ha valore predefinito `false`; i canali non supportati o il fissaggio non riuscito degradano automaticamente continuando il recapito.
- Le azioni manuali di messaggistica `pin`, `unpin` e `list-pins` restano per i messaggi esistenti.

L’attuale associazione del topic ACP di Telegram dovrebbe passare da `channelData.telegram.pin = true` a `delivery.pin = true`.

## Contratto di capacità runtime

Aggiungi hook di rendering per presentazione e recapito all’adapter runtime in uscita, non al plugin del canale del control plane.

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

- Risolvi il canale di destinazione e l’adapter runtime.
- Richiedi le capacità di presentazione.
- Degrada i blocchi non supportati prima del rendering.
- Chiama `renderPresentation`.
- Se non esiste alcun renderer, converti la presentazione in fallback testuale.
- Dopo un invio riuscito, chiama `pinDeliveredMessage` quando `delivery.pin` è richiesto e supportato.

## Mappatura dei canali

Discord:

- Renderizza `presentation` in componenti v2 e contenitori Carbon in moduli solo runtime.
- Mantieni gli helper dei colori di accento in moduli leggeri.
- Rimuovi le importazioni di `DiscordUiContainer` dal codice del control plane del plugin del canale.

Slack:

- Renderizza `presentation` in Block Kit.
- Rimuovi l’input `blocks` di agente e CLI.

Telegram:

- Renderizza testo, contesto e divisori come testo.
- Renderizza azioni e selezione come tastiere inline quando configurato e consentito per la superficie di destinazione.
- Usa il fallback testuale quando i pulsanti inline sono disabilitati.
- Sposta il fissaggio del topic ACP in `delivery.pin`.

Mattermost:

- Renderizza le azioni come pulsanti interattivi quando configurato.
- Renderizza gli altri blocchi come fallback testuale.

MS Teams:

- Renderizza `presentation` in Adaptive Cards.
- Mantieni le azioni manuali pin/unpin/list-pins.
- Implementa opzionalmente `pinDeliveredMessage` se il supporto Graph è affidabile per la conversazione di destinazione.

Feishu:

- Renderizza `presentation` in schede interattive.
- Mantieni le azioni manuali pin/unpin/list-pins.
- Implementa opzionalmente `pinDeliveredMessage` per il fissaggio dei messaggi inviati se il comportamento dell’API è affidabile.

LINE:

- Renderizza `presentation` in messaggi Flex o template dove possibile.
- Ripiega sul testo per i blocchi non supportati.
- Rimuovi i payload UI di LINE da `channelData`.

Canali semplici o limitati:

- Converti la presentazione in testo con formattazione conservativa.

## Passaggi di refactor

1. Riapplica la correzione di rilascio Discord che separa `ui-colors.ts` dall’interfaccia basata su Carbon e rimuove `DiscordUiContainer` da `extensions/discord/src/channel.ts`.
2. Aggiungi `presentation` e `delivery` a `ReplyPayload`, alla normalizzazione dei payload in uscita, ai riepiloghi di recapito e ai payload degli hook.
3. Aggiungi lo schema `MessagePresentation` e gli helper di parsing in un sotto-percorso SDK/runtime ristretto.
4. Sostituisci le capacità dei messaggi `buttons`, `cards`, `components` e `blocks` con capacità di presentazione semantica.
5. Aggiungi hook dell’adapter runtime in uscita per rendering della presentazione e fissaggio del recapito.
6. Sostituisci la costruzione dei componenti cross-context con `buildCrossContextPresentation`.
7. Elimina `src/infra/outbound/channel-adapters.ts` e rimuovi `buildCrossContextComponents` dai tipi dei plugin dei canali.
8. Modifica `maybeApplyCrossContextMarker` per allegare `presentation` invece dei parametri nativi.
9. Aggiorna i percorsi di invio di plugin-dispatch per consumare solo presentazione semantica e metadati di recapito.
10. Rimuovi i parametri di payload nativi di agente e CLI: `components`, `blocks`, `buttons` e `card`.
11. Rimuovi gli helper SDK che creano schemi nativi degli strumenti di messaggistica, sostituendoli con helper dello schema di presentazione.
12. Rimuovi envelope UI/nativi da `channelData`; mantieni solo i metadati di trasporto finché ogni campo rimanente non viene revisionato.
13. Migra i renderer di Discord, Slack, Telegram, Mattermost, MS Teams, Feishu e LINE.
14. Aggiorna la documentazione per la CLI dei messaggi, le pagine dei canali, l’SDK dei plugin e il ricettario delle capacità.
15. Esegui la profilazione del fanout delle importazioni per Discord e gli entrypoint dei canali interessati.

I passaggi 1-11 e 13-14 sono implementati in questo refactor per i contratti dell’agente condiviso, della CLI, delle capacità dei plugin e degli adapter in uscita. Il passaggio 12 resta un intervento di pulizia interna più profondo per gli envelope di trasporto `channelData` privati dei provider. Il passaggio 15 resta una validazione di follow-up se vogliamo numeri quantificati sul fanout delle importazioni oltre al gate di tipi/test.

## Test

Aggiungi o aggiorna:

- Test di normalizzazione della presentazione.
- Test di degradazione automatica della presentazione per blocchi non supportati.
- Test del marcatore cross-context per plugin dispatch e percorsi di recapito core.
- Test della matrice di rendering dei canali per Discord, Slack, Telegram, Mattermost, MS Teams, Feishu, LINE e fallback testuale.
- Test dello schema degli strumenti di messaggistica che dimostrino la rimozione dei campi nativi.
- Test della CLI che dimostrino la rimozione dei flag nativi.
- Regressione sulla pigrizia delle importazioni dell’entrypoint Discord relativa a Carbon.
- Test di fissaggio del recapito per Telegram e fallback generico.

## Questioni aperte

- `delivery.pin` dovrebbe essere implementato per Discord, Slack, MS Teams e Feishu nel primo passaggio, o inizialmente solo per Telegram?
- `delivery` dovrebbe infine assorbire campi esistenti come `replyToId`, `replyToCurrent`, `silent` e `audioAsVoice`, o restare focalizzato sui comportamenti post-invio?
- La presentazione dovrebbe supportare direttamente immagini o riferimenti a file, oppure per ora i media dovrebbero restare separati dal layout UI?

## Correlati

- [Panoramica dei canali](/it/channels)
- [Presentazione dei messaggi](/it/plugins/message-presentation)
