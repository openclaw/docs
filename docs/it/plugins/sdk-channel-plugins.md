---
read_when:
    - Stai creando un nuovo Plugin per canale di messaggistica
    - Vuoi collegare OpenClaw a una piattaforma di messaggistica
    - È necessario comprendere l'interfaccia dell'adattatore ChannelPlugin
sidebarTitle: Channel Plugins
summary: Guida passo passo alla creazione di un Plugin per canale di messaggistica per OpenClaw
title: Creazione di Plugin di canale
x-i18n:
    generated_at: "2026-04-30T09:04:48Z"
    model: gpt-5.5
    provider: openai
    source_hash: 068cd797f7761efa54f4fdeb7cb4aa784ceace959f1af12bc549c16ed2776b72
    source_path: plugins/sdk-channel-plugins.md
    workflow: 16
---

Questa guida illustra la creazione di un plugin di canale che collega OpenClaw a una
piattaforma di messaggistica. Alla fine avrai un canale funzionante con sicurezza dei DM,
abbinamento, threading delle risposte e messaggistica in uscita.

<Info>
  Se non hai mai creato un plugin OpenClaw prima, leggi prima
  [Guida introduttiva](/it/plugins/building-plugins) per la struttura di base del pacchetto
  e la configurazione del manifest.
</Info>

## Come funzionano i plugin di canale

I plugin di canale non hanno bisogno di strumenti propri per inviare/modificare/reagire. OpenClaw mantiene uno
strumento `message` condiviso nel core. Il tuo plugin gestisce:

- **Config** — risoluzione dell'account e procedura guidata di configurazione
- **Sicurezza** — criteri DM e allowlist
- **Abbinamento** — flusso di approvazione tramite DM
- **Grammatica della sessione** — come gli id conversazione specifici del provider si mappano su chat di base, id thread e fallback del padre
- **In uscita** — invio di testo, media e sondaggi alla piattaforma
- **Threading** — come le risposte vengono organizzate in thread
- **Digitazione Heartbeat** — segnali facoltativi di digitazione/occupato per le destinazioni di consegna Heartbeat

Il core gestisce lo strumento messaggi condiviso, il collegamento dei prompt, la forma esterna della chiave di sessione,
la contabilità generica `:thread:` e il dispatch.

Se il tuo canale supporta indicatori di digitazione al di fuori delle risposte in ingresso, esponi
`heartbeat.sendTyping(...)` sul plugin di canale. Il core lo chiama con la
destinazione di consegna Heartbeat risolta prima dell'avvio dell'esecuzione del modello Heartbeat e
usa il ciclo di vita condiviso di keepalive/pulizia della digitazione. Aggiungi `heartbeat.clearTyping(...)`
quando la piattaforma richiede un segnale di stop esplicito.

Se il tuo canale aggiunge parametri allo strumento messaggi che trasportano sorgenti media, esponi quei
nomi di parametri tramite `describeMessageTool(...).mediaSourceParams`. Il core usa
quell'elenco esplicito per la normalizzazione dei percorsi della sandbox e per la policy di accesso ai media in uscita,
quindi i plugin non hanno bisogno di casi speciali nel core condiviso per parametri
avatar, allegato o immagine di copertina specifici del provider.
Preferisci restituire una mappa indicizzata per azione, come
`{ "set-profile": ["avatarUrl", "avatarPath"] }`, così le azioni non correlate non
ereditano gli argomenti media di un'altra azione. Un array piatto funziona comunque per i parametri che
sono condivisi intenzionalmente tra tutte le azioni esposte.

Se la tua piattaforma memorizza ambito extra dentro gli id conversazione, mantieni quel parsing
nel plugin con `messaging.resolveSessionConversation(...)`. Questo è l'hook
canonico per mappare `rawId` sull'id conversazione di base, id thread facoltativo,
`baseConversationId` esplicito e qualunque `parentConversationCandidates`.
Quando restituisci `parentConversationCandidates`, tienili ordinati dal padre più
specifico alla conversazione più ampia/di base.

Usa `openclaw/plugin-sdk/channel-route` quando il codice del plugin deve normalizzare
campi simili a route, confrontare un thread figlio con la sua route padre o costruire una
chiave di deduplica stabile da `{ channel, to, accountId, threadId }`. L'helper
normalizza gli id thread numerici nello stesso modo del core, quindi i plugin dovrebbero preferirlo
a confronti ad hoc con `String(threadId)`.
I plugin con grammatica di target specifica del provider possono iniettare il proprio parser in
`resolveChannelRouteTargetWithParser(...)` e ottenere comunque la stessa forma del target route
e la stessa semantica di fallback del thread usate dal core.

I plugin inclusi che hanno bisogno dello stesso parsing prima dell'avvio del registro dei canali
possono anche esporre un file `session-key-api.ts` di primo livello con un export
`resolveSessionConversation(...)` corrispondente. Il core usa questa superficie sicura per il bootstrap
solo quando il registro runtime dei plugin non è ancora disponibile.

`messaging.resolveParentConversationCandidates(...)` resta disponibile come
fallback di compatibilità legacy quando un plugin ha bisogno solo di fallback del padre sopra
l'id generico/raw. Se esistono entrambi gli hook, il core usa prima
`resolveSessionConversation(...).parentConversationCandidates` e ricorre a
`resolveParentConversationCandidates(...)` solo quando l'hook canonico
li omette.

## Approvazioni e capacità del canale

La maggior parte dei plugin di canale non ha bisogno di codice specifico per le approvazioni.

- Il core gestisce `/approve` nella stessa chat, i payload dei pulsanti di approvazione condivisi e la consegna fallback generica.
- Preferisci un singolo oggetto `approvalCapability` sul plugin di canale quando il canale richiede comportamento specifico per le approvazioni.
- `ChannelPlugin.approvals` è rimosso. Metti fatti di consegna/native/render/auth delle approvazioni su `approvalCapability`.
- `plugin.auth` è solo login/logout; il core non legge più hook auth di approvazione da quell'oggetto.
- `approvalCapability.authorizeActorAction` e `approvalCapability.getActionAvailabilityState` sono il punto di integrazione canonico per l'auth delle approvazioni.
- Usa `approvalCapability.getActionAvailabilityState` per la disponibilità dell'auth di approvazione nella stessa chat.
- Se il tuo canale espone approvazioni exec native, usa `approvalCapability.getExecInitiatingSurfaceState` per lo stato della superficie di avvio/client nativo quando differisce dall'auth di approvazione nella stessa chat. Il core usa quell'hook specifico di exec per distinguere `enabled` da `disabled`, decidere se il canale di avvio supporta approvazioni exec native e includere il canale nella guida al fallback del client nativo. `createApproverRestrictedNativeApprovalCapability(...)` lo compila per il caso comune.
- Usa `outbound.shouldSuppressLocalPayloadPrompt` o `outbound.beforeDeliverPayload` per comportamenti del ciclo di vita dei payload specifici del canale, come nascondere prompt di approvazione locali duplicati o inviare indicatori di digitazione prima della consegna.
- Usa `approvalCapability.delivery` solo per routing di approvazione nativa o soppressione del fallback.
- Usa `approvalCapability.nativeRuntime` per fatti di approvazione nativa gestiti dal canale. Mantienilo lazy sui punti di ingresso caldi del canale con `createLazyChannelApprovalNativeRuntimeAdapter(...)`, che può importare il tuo modulo runtime su richiesta permettendo comunque al core di assemblare il ciclo di vita dell'approvazione.
- Usa `approvalCapability.render` solo quando un canale ha davvero bisogno di payload di approvazione personalizzati invece del renderer condiviso.
- Usa `approvalCapability.describeExecApprovalSetup` quando il canale vuole che la risposta del percorso disabilitato spieghi le manopole di configurazione esatte necessarie per abilitare le approvazioni exec native. L'hook riceve `{ channel, channelLabel, accountId }`; i canali con account nominati dovrebbero renderizzare percorsi con ambito account come `channels.<channel>.accounts.<id>.execApprovals.*` invece dei default di primo livello.
- Se un canale può inferire identità DM stabili simili a proprietari dalla configurazione esistente, usa `createResolvedApproverActionAuthAdapter` da `openclaw/plugin-sdk/approval-runtime` per limitare `/approve` nella stessa chat senza aggiungere logica core specifica per le approvazioni.
- Se un canale ha bisogno di consegna di approvazione nativa, mantieni il codice del canale concentrato sulla normalizzazione del target più i fatti di trasporto/presentazione. Usa `createChannelExecApprovalProfile`, `createChannelNativeOriginTargetResolver`, `createChannelApproverDmTargetResolver` e `createApproverRestrictedNativeApprovalCapability` da `openclaw/plugin-sdk/approval-runtime`. Metti i fatti specifici del canale dietro `approvalCapability.nativeRuntime`, idealmente tramite `createChannelApprovalNativeRuntimeAdapter(...)` o `createLazyChannelApprovalNativeRuntimeAdapter(...)`, così il core può assemblare l'handler e gestire filtro delle richieste, routing, deduplica, scadenza, sottoscrizione al Gateway e notifiche di instradamento altrove. `nativeRuntime` è suddiviso in alcuni punti di integrazione più piccoli:
- `createChannelNativeOriginTargetResolver` usa per impostazione predefinita il matcher channel-route condiviso per i target `{ to, accountId, threadId }`. Passa `targetsMatch` solo quando un canale ha regole di equivalenza specifiche del provider, come il matching del prefisso timestamp di Slack.
- Passa `normalizeTargetForMatch` a `createChannelNativeOriginTargetResolver` quando il canale deve canonicalizzare gli id provider prima che vengano eseguiti il matcher route predefinito o una callback `targetsMatch` personalizzata, preservando il target originale per la consegna. Usa `normalizeTarget` solo quando il target di consegna risolto stesso deve essere canonicalizzato.
- `availability` — se l'account è configurato e se una richiesta deve essere gestita
- `presentation` — mappa il modello di vista di approvazione condiviso in payload nativi pending/resolved/expired o azioni finali
- `transport` — prepara i target e invia/aggiorna/elimina messaggi di approvazione nativi
- `interactions` — hook facoltativi di bind/unbind/clear-action per pulsanti o reazioni native
- `observe` — hook facoltativi di diagnostica della consegna
- Se il canale richiede oggetti posseduti dal runtime come un client, token, app Bolt o ricevitore Webhook, registrali tramite `openclaw/plugin-sdk/channel-runtime-context`. Il registro generico del contesto runtime permette al core di avviare handler guidati da capacità dallo stato di avvio del canale senza aggiungere collante wrapper specifico per le approvazioni.
- Ricorri ai più bassi livelli `createChannelApprovalHandler` o `createChannelNativeApprovalRuntime` solo quando il punto di integrazione guidato da capacità non è ancora sufficientemente espressivo.
- I canali di approvazione nativa devono instradare sia `accountId` sia `approvalKind` attraverso quegli helper. `accountId` mantiene la policy di approvazione multi-account limitata all'account bot corretto, e `approvalKind` mantiene disponibile al canale il comportamento delle approvazioni exec rispetto a plugin senza branch hardcoded nel core.
- Ora il core gestisce anche le notifiche di reindirizzamento delle approvazioni. I plugin di canale non dovrebbero inviare propri messaggi di follow-up "approval went to DMs / another channel" da `createChannelNativeApprovalRuntime`; invece, esponi routing accurato origine + DM approvatore tramite gli helper condivisi della capacità di approvazione e lascia che il core aggreghi le consegne effettive prima di pubblicare qualunque notifica nella chat di avvio.
- Preserva il tipo dell'id approvazione consegnato end-to-end. I client nativi non dovrebbero
  indovinare o riscrivere il routing di approvazione exec rispetto a plugin dallo stato locale del canale.
- Tipi di approvazione diversi possono esporre intenzionalmente superfici native diverse.
  Esempi inclusi attuali:
  - Slack mantiene disponibile il routing di approvazione nativa sia per id exec sia per id plugin.
  - Matrix mantiene lo stesso routing nativo DM/canale e la stessa UX a reazioni per approvazioni exec
    e plugin, lasciando comunque che l'auth differisca in base al tipo di approvazione.
- `createApproverRestrictedNativeApprovalAdapter` esiste ancora come wrapper di compatibilità, ma il nuovo codice dovrebbe preferire il builder di capacità ed esporre `approvalCapability` sul plugin.

Per i punti di ingresso caldi del canale, preferisci i sottopercorsi runtime più stretti quando ti serve solo
una parte di quella famiglia:

- `openclaw/plugin-sdk/approval-auth-runtime`
- `openclaw/plugin-sdk/approval-client-runtime`
- `openclaw/plugin-sdk/approval-delivery-runtime`
- `openclaw/plugin-sdk/approval-gateway-runtime`
- `openclaw/plugin-sdk/approval-handler-adapter-runtime`
- `openclaw/plugin-sdk/approval-handler-runtime`
- `openclaw/plugin-sdk/approval-native-runtime`
- `openclaw/plugin-sdk/approval-reply-runtime`
- `openclaw/plugin-sdk/channel-runtime-context`

Allo stesso modo, preferisci `openclaw/plugin-sdk/setup-runtime`,
`openclaw/plugin-sdk/setup-adapter-runtime`,
`openclaw/plugin-sdk/reply-runtime`,
`openclaw/plugin-sdk/reply-dispatch-runtime`,
`openclaw/plugin-sdk/reply-reference` e
`openclaw/plugin-sdk/reply-chunking` quando non hai bisogno della superficie
ombrello più ampia.

Per la configurazione nello specifico:

- `openclaw/plugin-sdk/setup-runtime` copre gli helper di configurazione sicuri per il runtime:
  adattatori di patch configurazione import-safe (`createPatchedAccountSetupAdapter`,
  `createEnvPatchedAccountSetupAdapter`,
  `createSetupInputPresenceValidator`), output delle note di lookup,
  `promptResolvedAllowFrom`, `splitSetupEntries` e i builder delegati
  del proxy di configurazione
- `openclaw/plugin-sdk/setup-adapter-runtime` è il punto di integrazione adattatore
  stretto e consapevole dell'ambiente per `createEnvPatchedAccountSetupAdapter`
- `openclaw/plugin-sdk/channel-setup` copre i builder di configurazione
  per installazione facoltativa più alcune primitive sicure per la configurazione:
  `createOptionalChannelSetupSurface`, `createOptionalChannelSetupAdapter`,

Se il tuo canale supporta configurazione o auth guidate dall'ambiente e i flussi generici di avvio/configurazione
devono conoscere quei nomi env prima del caricamento del runtime, dichiarali nel
manifest del plugin con `channelEnvVars`. Mantieni `envVars` del runtime del canale o costanti locali
solo per testo rivolto agli operatori.

Se il tuo canale può apparire in `status`, `channels list`, `channels status` o nelle scansioni SecretRef prima dell'avvio del runtime del Plugin, aggiungi `openclaw.setupEntry` in `package.json`. Quell'entrypoint deve essere sicuro da importare nei percorsi dei comandi in sola lettura e deve restituire i metadati del canale, l'adattatore di configurazione sicuro per il setup, l'adattatore di stato e i metadati dei target dei segreti del canale necessari per quei riepiloghi. Non avviare client, listener o runtime di trasporto dall'entry di setup.

Mantieni stretto anche il percorso di importazione dell'entry principale del canale. La discovery può valutare l'entry e il modulo del Plugin di canale per registrare le capability senza attivare il canale. File come `channel-plugin-api.ts` devono esportare l'oggetto Plugin di canale senza importare procedure guidate di setup, client di trasporto, listener socket, launcher di subprocessi o moduli di avvio servizi. Metti quei pezzi di runtime in moduli caricati da `registerFull(...)`, setter di runtime o adattatori di capability lazy.

`createOptionalChannelSetupWizard`, `DEFAULT_ACCOUNT_ID`,
`createTopLevelChannelDmPolicy`, `setSetupChannelEnabled` e
`splitSetupEntries`

- usa il seam più ampio `openclaw/plugin-sdk/setup` solo quando hai bisogno anche degli helper condivisi di setup/configurazione più pesanti, come
  `moveSingleAccountChannelSectionToDefaultAccount(...)`

Se il tuo canale vuole solo pubblicizzare "installa prima questo Plugin" nelle superfici di setup, preferisci `createOptionalChannelSetupSurface(...)`. L'adattatore/procedura guidata generati falliscono in modo chiuso su scritture di configurazione e finalizzazione, e riutilizzano lo stesso messaggio di installazione richiesta nella validazione, nella finalizzazione e nel testo del link alla documentazione.

Per altri percorsi caldi del canale, preferisci gli helper stretti rispetto alle superfici legacy più ampie:

- `openclaw/plugin-sdk/account-core`,
  `openclaw/plugin-sdk/account-id`,
  `openclaw/plugin-sdk/account-resolution` e
  `openclaw/plugin-sdk/account-helpers` per configurazione multi-account e fallback dell'account predefinito
- `openclaw/plugin-sdk/inbound-envelope` e
  `openclaw/plugin-sdk/inbound-reply-dispatch` per route/envelope in ingresso e cablaggio record-and-dispatch
- `openclaw/plugin-sdk/messaging-targets` per parsing/matching dei target
- `openclaw/plugin-sdk/outbound-media` e
  `openclaw/plugin-sdk/outbound-runtime` per caricamento media più delegati di identità/invio in uscita e pianificazione payload
- `buildThreadAwareOutboundSessionRoute(...)` da
  `openclaw/plugin-sdk/channel-core` quando una route in uscita deve preservare un `replyToId`/`threadId` esplicito o recuperare la sessione `:thread:` corrente dopo che la chiave di sessione base corrisponde ancora. I Plugin provider possono sovrascrivere precedenza, comportamento dei suffissi e normalizzazione degli ID thread quando la loro piattaforma ha semantiche native di consegna dei thread.
- `openclaw/plugin-sdk/thread-bindings-runtime` per ciclo di vita dei binding thread e registrazione degli adattatori
- `openclaw/plugin-sdk/agent-media-payload` solo quando è ancora richiesto un layout legacy dei campi payload agente/media
- `openclaw/plugin-sdk/telegram-command-config` per normalizzazione dei comandi personalizzati Telegram, validazione di duplicati/conflitti e un contratto di configurazione comandi stabile in fallback

I canali solo auth possono di solito fermarsi al percorso predefinito: il core gestisce le approvazioni e il Plugin espone soltanto capability outbound/auth. I canali di approvazione nativi come Matrix, Slack, Telegram e trasporti chat personalizzati devono usare gli helper nativi condivisi invece di implementare un proprio ciclo di vita delle approvazioni.

## Criterio per le menzioni in ingresso

Mantieni la gestione delle menzioni in ingresso divisa in due livelli:

- raccolta di evidenze di proprietà del Plugin
- valutazione del criterio condiviso

Usa `openclaw/plugin-sdk/channel-mention-gating` per le decisioni sul criterio delle menzioni.
Usa `openclaw/plugin-sdk/channel-inbound` solo quando hai bisogno del barrel più ampio degli helper in ingresso.

Adatto alla logica locale del Plugin:

- rilevamento di risposta-al-bot
- rilevamento di bot citato
- controlli di partecipazione al thread
- esclusioni di messaggi di servizio/sistema
- cache native della piattaforma necessarie per provare la partecipazione del bot

Adatto all'helper condiviso:

- `requireMention`
- risultato di menzione esplicita
- allowlist di menzioni implicite
- bypass dei comandi
- decisione finale di skip

Flusso preferito:

1. Calcola i fatti locali sulle menzioni.
2. Passa quei fatti a `resolveInboundMentionDecision({ facts, policy })`.
3. Usa `decision.effectiveWasMentioned`, `decision.shouldBypassMention` e `decision.shouldSkip` nel tuo gate in ingresso.

```typescript
import {
  implicitMentionKindWhen,
  matchesMentionWithExplicit,
  resolveInboundMentionDecision,
} from "openclaw/plugin-sdk/channel-inbound";

const mentionMatch = matchesMentionWithExplicit(text, {
  mentionRegexes,
  mentionPatterns,
});

const facts = {
  canDetectMention: true,
  wasMentioned: mentionMatch.matched,
  hasAnyMention: mentionMatch.hasExplicitMention,
  implicitMentionKinds: [
    ...implicitMentionKindWhen("reply_to_bot", isReplyToBot),
    ...implicitMentionKindWhen("quoted_bot", isQuoteOfBot),
  ],
};

const decision = resolveInboundMentionDecision({
  facts,
  policy: {
    isGroup,
    requireMention,
    allowedImplicitMentionKinds: requireExplicitMention ? [] : ["reply_to_bot", "quoted_bot"],
    allowTextCommands,
    hasControlCommand,
    commandAuthorized,
  },
});

if (decision.shouldSkip) return;
```

`api.runtime.channel.mentions` espone gli stessi helper condivisi per le menzioni per i Plugin di canale bundled che dipendono già dall'iniezione runtime:

- `buildMentionRegexes`
- `matchesMentionPatterns`
- `matchesMentionWithExplicit`
- `implicitMentionKindWhen`
- `resolveInboundMentionDecision`

Se ti servono solo `implicitMentionKindWhen` e
`resolveInboundMentionDecision`, importa da
`openclaw/plugin-sdk/channel-mention-gating` per evitare di caricare helper di runtime in ingresso non correlati.

Gli helper più vecchi `resolveMentionGating*` rimangono su
`openclaw/plugin-sdk/channel-inbound` solo come export di compatibilità. Il nuovo codice deve usare `resolveInboundMentionDecision({ facts, policy })`.

## Procedura dettagliata

<Steps>
  <a id="step-1-package-and-manifest"></a>
  <Step title="Pacchetto e manifest">
    Crea i file standard del Plugin. Il campo `channel` in `package.json` è ciò che rende questo un Plugin di canale. Per la superficie completa dei metadati del pacchetto, vedi [Setup e configurazione del Plugin](/it/plugins/sdk-setup#openclaw-channel):

    <CodeGroup>
    ```json package.json
    {
      "name": "@myorg/openclaw-acme-chat",
      "version": "1.0.0",
      "type": "module",
      "openclaw": {
        "extensions": ["./index.ts"],
        "setupEntry": "./setup-entry.ts",
        "channel": {
          "id": "acme-chat",
          "label": "Acme Chat",
          "blurb": "Connect OpenClaw to Acme Chat."
        }
      }
    }
    ```

    ```json openclaw.plugin.json
    {
      "id": "acme-chat",
      "kind": "channel",
      "channels": ["acme-chat"],
      "name": "Acme Chat",
      "description": "Acme Chat channel plugin",
      "configSchema": {
        "type": "object",
        "additionalProperties": false,
        "properties": {}
      },
      "channelConfigs": {
        "acme-chat": {
          "schema": {
            "type": "object",
            "additionalProperties": false,
            "properties": {
              "token": { "type": "string" },
              "allowFrom": {
                "type": "array",
                "items": { "type": "string" }
              }
            }
          },
          "uiHints": {
            "token": {
              "label": "Bot token",
              "sensitive": true
            }
          }
        }
      }
    }
    ```
    </CodeGroup>

    `configSchema` valida `plugins.entries.acme-chat.config`. Usalo per le impostazioni di proprietà del Plugin che non sono la configurazione dell'account canale. `channelConfigs`
    valida `channels.acme-chat` ed è la sorgente cold-path usata da schema di configurazione, setup e superfici UI prima del caricamento del runtime del Plugin.

  </Step>

  <Step title="Costruisci l'oggetto Plugin di canale">
    L'interfaccia `ChannelPlugin` ha molte superfici adattatore opzionali. Inizia dal minimo — `id` e `setup` — e aggiungi adattatori man mano che ti servono.

    Crea `src/channel.ts`:

    ```typescript src/channel.ts
    import {
      createChatChannelPlugin,
      createChannelPluginBase,
    } from "openclaw/plugin-sdk/channel-core";
    import type { OpenClawConfig } from "openclaw/plugin-sdk/channel-core";
    import { acmeChatApi } from "./client.js"; // your platform API client

    type ResolvedAccount = {
      accountId: string | null;
      token: string;
      allowFrom: string[];
      dmPolicy: string | undefined;
    };

    function resolveAccount(
      cfg: OpenClawConfig,
      accountId?: string | null,
    ): ResolvedAccount {
      const section = (cfg.channels as Record<string, any>)?.["acme-chat"];
      const token = section?.token;
      if (!token) throw new Error("acme-chat: token is required");
      return {
        accountId: accountId ?? null,
        token,
        allowFrom: section?.allowFrom ?? [],
        dmPolicy: section?.dmSecurity,
      };
    }

    export const acmeChatPlugin = createChatChannelPlugin<ResolvedAccount>({
      base: createChannelPluginBase({
        id: "acme-chat",
        setup: {
          resolveAccount,
          inspectAccount(cfg, accountId) {
            const section =
              (cfg.channels as Record<string, any>)?.["acme-chat"];
            return {
              enabled: Boolean(section?.token),
              configured: Boolean(section?.token),
              tokenStatus: section?.token ? "available" : "missing",
            };
          },
        },
      }),

      // DM security: who can message the bot
      security: {
        dm: {
          channelKey: "acme-chat",
          resolvePolicy: (account) => account.dmPolicy,
          resolveAllowFrom: (account) => account.allowFrom,
          defaultPolicy: "allowlist",
        },
      },

      // Pairing: approval flow for new DM contacts
      pairing: {
        text: {
          idLabel: "Acme Chat username",
          message: "Send this code to verify your identity:",
          notify: async ({ target, code }) => {
            await acmeChatApi.sendDm(target, `Pairing code: ${code}`);
          },
        },
      },

      // Threading: how replies are delivered
      threading: { topLevelReplyToMode: "reply" },

      // Outbound: send messages to the platform
      outbound: {
        attachedResults: {
          sendText: async (params) => {
            const result = await acmeChatApi.sendMessage(
              params.to,
              params.text,
            );
            return { messageId: result.id };
          },
        },
        base: {
          sendMedia: async (params) => {
            await acmeChatApi.sendFile(params.to, params.filePath);
          },
        },
      },
    });
    ```

    Per i canali che accettano sia chiavi DM canoniche di primo livello sia chiavi annidate legacy, usa gli helper da `plugin-sdk/channel-config-helpers`: `resolveChannelDmAccess`, `resolveChannelDmPolicy`, `resolveChannelDmAllowFrom` e `normalizeChannelDmPolicy` mantengono i valori locali dell'account davanti ai valori root ereditati. Abbina lo stesso resolver alla riparazione doctor tramite `normalizeLegacyDmAliases` così runtime e migrazione leggono lo stesso contratto.

    <Accordion title="Cosa fa per te createChatChannelPlugin">
      Invece di implementare manualmente interfacce adattatore di basso livello, passi opzioni dichiarative e il builder le compone:

      | Opzione | Cosa collega |
      | --- | --- |
      | `security.dm` | Resolver di sicurezza DM con scope dai campi di configurazione |
      | `pairing.text` | Flusso di pairing DM testuale con scambio di codice |
      | `threading` | Resolver della modalità reply-to (fissa, con scope sull'account o personalizzata) |
      | `outbound.attachedResults` | Funzioni di invio che restituiscono metadati risultato (ID messaggio) |

      Puoi anche passare oggetti adattatore grezzi invece delle opzioni dichiarative se hai bisogno di controllo completo.

      Raw outbound adapters possono definire una funzione `chunker(text, limit, ctx)`.
      L'opzionale `ctx.formatting` contiene le decisioni di formattazione al momento della consegna
      come `maxLinesPerMessage`; applicalo prima dell'invio, così i thread delle risposte
      e i confini dei chunk vengono risolti una sola volta dalla consegna outbound condivisa.
      I contesti di invio includono anche `replyToIdSource` (`implicit` o `explicit`)
      quando è stato risolto un target di risposta nativo, così gli helper del payload possono preservare
      i tag di risposta espliciti senza consumare uno slot di risposta implicito monouso.
    </Accordion>

  </Step>

  <Step title="Collega il punto di ingresso">
    Crea `index.ts`:

    ```typescript index.ts
    import { defineChannelPluginEntry } from "openclaw/plugin-sdk/channel-core";
    import { acmeChatPlugin } from "./src/channel.js";

    export default defineChannelPluginEntry({
      id: "acme-chat",
      name: "Acme Chat",
      description: "Acme Chat channel plugin",
      plugin: acmeChatPlugin,
      registerCliMetadata(api) {
        api.registerCli(
          ({ program }) => {
            program
              .command("acme-chat")
              .description("Acme Chat management");
          },
          {
            descriptors: [
              {
                name: "acme-chat",
                description: "Acme Chat management",
                hasSubcommands: false,
              },
            ],
          },
        );
      },
      registerFull(api) {
        api.registerGatewayMethod(/* ... */);
      },
    });
    ```

    Inserisci i descrittori CLI di proprietà del canale in `registerCliMetadata(...)` così OpenClaw
    può mostrarli nell'help radice senza attivare il runtime completo del canale,
    mentre i normali caricamenti completi acquisiscono comunque gli stessi descrittori per la registrazione
    effettiva dei comandi. Mantieni `registerFull(...)` per il lavoro solo runtime.
    Se `registerFull(...)` registra metodi RPC del Gateway, usa un
    prefisso specifico del plugin. Gli spazi dei nomi di amministrazione core (`config.*`,
    `exec.approvals.*`, `wizard.*`, `update.*`) restano riservati e si risolvono sempre
    in `operator.admin`.
    `defineChannelPluginEntry` gestisce automaticamente la divisione della modalità di registrazione. Consulta
    [Punti di ingresso](/it/plugins/sdk-entrypoints#definechannelpluginentry) per tutte
    le opzioni.

  </Step>

  <Step title="Aggiungi una voce di configurazione">
    Crea `setup-entry.ts` per il caricamento leggero durante l'onboarding:

    ```typescript setup-entry.ts
    import { defineSetupPluginEntry } from "openclaw/plugin-sdk/channel-core";
    import { acmeChatPlugin } from "./src/channel.js";

    export default defineSetupPluginEntry(acmeChatPlugin);
    ```

    OpenClaw carica questa voce al posto di quella completa quando il canale è disabilitato
    o non configurato. Evita di includere codice runtime pesante durante i flussi di configurazione.
    Consulta [Configurazione e setup](/it/plugins/sdk-setup#setup-entry) per i dettagli.

    I canali del workspace inclusi nel bundle che separano gli export sicuri per la configurazione in moduli
    sidecar possono usare `defineBundledChannelSetupEntry(...)` da
    `openclaw/plugin-sdk/channel-entry-contract` quando necessitano anche di un
    setter runtime esplicito al momento della configurazione.

  </Step>

  <Step title="Gestisci i messaggi in ingresso">
    Il tuo plugin deve ricevere messaggi dalla piattaforma e inoltrarli a
    OpenClaw. Lo schema tipico è un webhook che verifica la richiesta e
    la instrada tramite l'handler inbound del tuo canale:

    ```typescript
    registerFull(api) {
      api.registerHttpRoute({
        path: "/acme-chat/webhook",
        auth: "plugin", // plugin-managed auth (verify signatures yourself)
        handler: async (req, res) => {
          const event = parseWebhookPayload(req);

          // Your inbound handler dispatches the message to OpenClaw.
          // The exact wiring depends on your platform SDK —
          // see a real example in the bundled Microsoft Teams or Google Chat plugin package.
          await handleAcmeChatInbound(api, event);

          res.statusCode = 200;
          res.end("ok");
          return true;
        },
      });
    }
    ```

    <Note>
      La gestione dei messaggi in ingresso è specifica del canale. Ogni plugin di canale possiede
      la propria pipeline inbound. Guarda i plugin di canale inclusi nel bundle
      (per esempio il pacchetto plugin Microsoft Teams o Google Chat) per schemi reali.
    </Note>

  </Step>

<a id="step-6-test"></a>
<Step title="Test">
Scrivi test colocati in `src/channel.test.ts`:

    ```typescript src/channel.test.ts
    import { describe, it, expect } from "vitest";
    import { acmeChatPlugin } from "./channel.js";

    describe("acme-chat plugin", () => {
      it("resolves account from config", () => {
        const cfg = {
          channels: {
            "acme-chat": { token: "test-token", allowFrom: ["user1"] },
          },
        } as any;
        const account = acmeChatPlugin.setup!.resolveAccount(cfg, undefined);
        expect(account.token).toBe("test-token");
      });

      it("inspects account without materializing secrets", () => {
        const cfg = {
          channels: { "acme-chat": { token: "test-token" } },
        } as any;
        const result = acmeChatPlugin.setup!.inspectAccount!(cfg, undefined);
        expect(result.configured).toBe(true);
        expect(result.tokenStatus).toBe("available");
      });

      it("reports missing config", () => {
        const cfg = { channels: {} } as any;
        const result = acmeChatPlugin.setup!.inspectAccount!(cfg, undefined);
        expect(result.configured).toBe(false);
      });
    });
    ```

    ```bash
    pnpm test -- <bundled-plugin-root>/acme-chat/
    ```

    Per gli helper di test condivisi, consulta [Testing](/it/plugins/sdk-testing).

</Step>
</Steps>

## Struttura dei file

```
<bundled-plugin-root>/acme-chat/
├── package.json              # openclaw.channel metadata
├── openclaw.plugin.json      # Manifest with config schema
├── index.ts                  # defineChannelPluginEntry
├── setup-entry.ts            # defineSetupPluginEntry
├── api.ts                    # Public exports (optional)
├── runtime-api.ts            # Internal runtime exports (optional)
└── src/
    ├── channel.ts            # ChannelPlugin via createChatChannelPlugin
    ├── channel.test.ts       # Tests
    ├── client.ts             # Platform API client
    └── runtime.ts            # Runtime store (if needed)
```

## Argomenti avanzati

<CardGroup cols={2}>
  <Card title="Opzioni di threading" icon="git-branch" href="/it/plugins/sdk-entrypoints#registration-mode">
    Modalità di risposta fisse, con ambito account o personalizzate
  </Card>
  <Card title="Integrazione degli strumenti di messaggistica" icon="puzzle" href="/it/plugins/architecture#channel-plugins-and-the-shared-message-tool">
    describeMessageTool e individuazione delle azioni
  </Card>
  <Card title="Risoluzione del target" icon="crosshair" href="/it/plugins/architecture-internals#channel-target-resolution">
    inferTargetChatType, looksLikeId, resolveTarget
  </Card>
  <Card title="Helper runtime" icon="settings" href="/it/plugins/sdk-runtime">
    TTS, STT, media, subagent tramite api.runtime
  </Card>
  <Card title="Kernel dei turni del canale" icon="bolt" href="/it/plugins/sdk-channel-turn">
    Ciclo di vita inbound condiviso del turno: acquisisci, risolvi, registra, instrada, finalizza
  </Card>
</CardGroup>

<Note>
Alcuni seam helper inclusi nel bundle esistono ancora per la manutenzione dei plugin inclusi nel bundle e
la compatibilità. Non sono lo schema consigliato per nuovi plugin di canale;
preferisci i sottopercorsi generici channel/setup/reply/runtime dalla superficie SDK comune,
a meno che tu non stia mantenendo direttamente quella famiglia di plugin inclusi nel bundle.
</Note>

## Passaggi successivi

- [Plugin provider](/it/plugins/sdk-provider-plugins) — se il tuo plugin fornisce anche modelli
- [Panoramica dell'SDK](/it/plugins/sdk-overview) — riferimento completo agli import dei sottopercorsi
- [Test dell'SDK](/it/plugins/sdk-testing) — utilità di test e test di contratto
- [Manifest del plugin](/it/plugins/manifest) — schema completo del manifest

## Correlati

- [Configurazione del Plugin SDK](/it/plugins/sdk-setup)
- [Creazione di plugin](/it/plugins/building-plugins)
- [Plugin per harness di agenti](/it/plugins/sdk-agent-harness)
