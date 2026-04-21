---
read_when:
    - Stai creando un nuovo plugin di canale di messaggistica
    - Vuoi collegare OpenClaw a una piattaforma di messaggistica
    - Devi comprendere la superficie dell'adattatore `ChannelPlugin`
sidebarTitle: Channel Plugins
summary: Guida passo passo per creare un plugin di canale di messaggistica per OpenClaw
title: Creazione di plugin di canale
x-i18n:
    generated_at: "2026-04-21T19:20:45Z"
    model: gpt-5.4
    provider: openai
    source_hash: 35cae55c13b69f2219bd2f9bd3ee2f7d8c4075bd87f0be11c35a0fddb070fe1e
    source_path: plugins/sdk-channel-plugins.md
    workflow: 15
---

# Creazione di plugin di canale

Questa guida illustra come creare un plugin di canale che colleghi OpenClaw a una
piattaforma di messaggistica. Alla fine avrai un canale funzionante con sicurezza DM,
abbinamento, threading delle risposte e messaggistica in uscita.

<Info>
  Se non hai mai creato prima alcun plugin OpenClaw, leggi prima
  [Per iniziare](/it/plugins/building-plugins) per la struttura di base del
  pacchetto e la configurazione del manifest.
</Info>

## Come funzionano i plugin di canale

I plugin di canale non hanno bisogno di propri strumenti send/edit/react. OpenClaw mantiene un
unico strumento `message` condiviso nel core. Il tuo plugin gestisce:

- **Configurazione** — risoluzione dell'account e procedura guidata di configurazione
- **Sicurezza** — policy DM ed elenchi di autorizzazione
- **Abbinamento** — flusso di approvazione DM
- **Grammatica di sessione** — come gli id di conversazione specifici del provider vengono mappati a chat di base, id di thread e fallback del genitore
- **In uscita** — invio di testo, media e sondaggi alla piattaforma
- **Threading** — come vengono organizzate le risposte in thread

Il core gestisce lo strumento message condiviso, il cablaggio del prompt, la forma esterna della chiave di sessione,
la gestione generica di `:thread:` e il dispatch.

Se il tuo canale aggiunge parametri dello strumento message che trasportano sorgenti multimediali, esponi quei
nomi di parametro tramite `describeMessageTool(...).mediaSourceParams`. Il core usa
questo elenco esplicito per la normalizzazione dei percorsi nel sandbox e per la
policy di accesso ai media in uscita, quindi i plugin non hanno bisogno di casi speciali del core condiviso per
parametri specifici del provider come avatar, allegati o immagini di copertina.
Preferisci restituire una mappa indicizzata per azione come
`{ "set-profile": ["avatarUrl", "avatarPath"] }` così le azioni non correlate non
ereditano gli argomenti media di un'altra azione. Un array piatto continua a funzionare per parametri che
sono intenzionalmente condivisi tra ogni azione esposta.

Se la tua piattaforma memorizza uno scope aggiuntivo negli id di conversazione, mantieni quel parsing
nel plugin con `messaging.resolveSessionConversation(...)`. Questo è l'hook canonico per
mappare `rawId` all'id della conversazione di base, all'id di thread opzionale,
a `baseConversationId` esplicito e a eventuali `parentConversationCandidates`.
Quando restituisci `parentConversationCandidates`, mantienili ordinati dal
genitore più specifico a quello più ampio/conversazione di base.

I plugin inclusi che hanno bisogno dello stesso parsing prima che venga avviato il registro dei canali
possono anche esporre un file `session-key-api.ts` di primo livello con una
export `resolveSessionConversation(...)` corrispondente. Il core usa questa superficie sicura per il bootstrap
solo quando il registro dei plugin runtime non è ancora disponibile.

`messaging.resolveParentConversationCandidates(...)` resta disponibile come fallback
legacy di compatibilità quando un plugin ha bisogno solo di fallback del genitore
sopra l'id generico/raw. Se entrambi gli hook esistono, il core usa
prima `resolveSessionConversation(...).parentConversationCandidates` e ricorre a
`resolveParentConversationCandidates(...)` solo quando l'hook canonico li
omette.

## Approvazioni e capacità del canale

La maggior parte dei plugin di canale non ha bisogno di codice specifico per le approvazioni.

- Il core gestisce `/approve` nella stessa chat, i payload condivisi dei pulsanti di approvazione e il recapito fallback generico.
- Preferisci un singolo oggetto `approvalCapability` nel plugin di canale quando il canale richiede un comportamento specifico per le approvazioni.
- `ChannelPlugin.approvals` è stato rimosso. Inserisci i fatti di recapito/rendering/auth delle approvazioni in `approvalCapability`.
- `plugin.auth` è solo per login/logout; il core non legge più gli hook auth delle approvazioni da quell'oggetto.
- `approvalCapability.authorizeActorAction` e `approvalCapability.getActionAvailabilityState` sono la seam canonica per l'auth delle approvazioni.
- Usa `approvalCapability.getActionAvailabilityState` per la disponibilità dell'auth delle approvazioni nella stessa chat.
- Se il tuo canale espone approvazioni exec native, usa `approvalCapability.getExecInitiatingSurfaceState` per lo stato initiating-surface/native-client quando differisce dall'auth delle approvazioni nella stessa chat. Il core usa questo hook specifico per exec per distinguere `enabled` da `disabled`, decidere se il canale di origine supporta approvazioni exec native e includere il canale nelle indicazioni fallback del client nativo. `createApproverRestrictedNativeApprovalCapability(...)` lo compila per il caso comune.
- Usa `outbound.shouldSuppressLocalPayloadPrompt` o `outbound.beforeDeliverPayload` per il comportamento specifico del canale nel ciclo di vita del payload, come nascondere prompt locali di approvazione duplicati o inviare indicatori di digitazione prima del recapito.
- Usa `approvalCapability.delivery` solo per l'instradamento delle approvazioni native o per la soppressione del fallback.
- Usa `approvalCapability.nativeRuntime` per i fatti delle approvazioni native gestiti dal canale. Mantienilo lazy nei punti di ingresso caldi del canale con `createLazyChannelApprovalNativeRuntimeAdapter(...)`, che può importare il tuo modulo runtime su richiesta permettendo comunque al core di assemblare il ciclo di vita delle approvazioni.
- Usa `approvalCapability.render` solo quando un canale ha davvero bisogno di payload di approvazione personalizzati invece del renderer condiviso.
- Usa `approvalCapability.describeExecApprovalSetup` quando il canale vuole che la risposta nel percorso disabilitato spieghi le esatte manopole di configurazione necessarie per abilitare le approvazioni exec native. L'hook riceve `{ channel, channelLabel, accountId }`; i canali con account denominati dovrebbero rendere percorsi con scope per account come `channels.<channel>.accounts.<id>.execApprovals.*` invece di impostazioni predefinite di primo livello.
- Se un canale può dedurre identità DM stabili simili al proprietario dalla configurazione esistente, usa `createResolvedApproverActionAuthAdapter` da `openclaw/plugin-sdk/approval-runtime` per limitare `/approve` nella stessa chat senza aggiungere logica del core specifica per le approvazioni.
- Se un canale ha bisogno del recapito di approvazioni native, mantieni il codice del canale focalizzato sulla normalizzazione della destinazione più i fatti di trasporto/presentazione. Usa `createChannelExecApprovalProfile`, `createChannelNativeOriginTargetResolver`, `createChannelApproverDmTargetResolver` e `createApproverRestrictedNativeApprovalCapability` da `openclaw/plugin-sdk/approval-runtime`. Inserisci i fatti specifici del canale dietro `approvalCapability.nativeRuntime`, idealmente tramite `createChannelApprovalNativeRuntimeAdapter(...)` o `createLazyChannelApprovalNativeRuntimeAdapter(...)`, così il core può assemblare l'handler e gestire il filtraggio delle richieste, l'instradamento, la deduplicazione, la scadenza, la sottoscrizione al Gateway e gli avvisi di instradamento altrove. `nativeRuntime` è suddiviso in alcune seam più piccole:
- `availability` — se l'account è configurato e se una richiesta deve essere gestita
- `presentation` — mappa il view model condiviso delle approvazioni in payload nativi pending/resolved/expired o azioni finali
- `transport` — prepara le destinazioni più invio/aggiornamento/eliminazione dei messaggi di approvazione nativi
- `interactions` — hook opzionali bind/unbind/clear-action per pulsanti o reazioni native
- `observe` — hook opzionali per la diagnostica del recapito
- Se il canale ha bisogno di oggetti gestiti dal runtime come un client, token, app Bolt o ricevitore Webhook, registrali tramite `openclaw/plugin-sdk/channel-runtime-context`. Il registro generico del contesto runtime permette al core di avviare handler guidati dalle capacità dallo stato di avvio del canale senza aggiungere glue wrapper specifico per le approvazioni.
- Ricorri a `createChannelApprovalHandler` o `createChannelNativeApprovalRuntime` di livello più basso solo quando la seam guidata dalle capacità non è ancora sufficientemente espressiva.
- I canali di approvazione nativa devono instradare sia `accountId` sia `approvalKind` attraverso questi helper. `accountId` mantiene la policy di approvazione multi-account limitata al giusto account bot, e `approvalKind` mantiene disponibile al canale il comportamento di approvazione exec vs plugin senza rami codificati nel core.
- Il core ora gestisce anche gli avvisi di reinstradamento delle approvazioni. I plugin di canale non dovrebbero inviare propri messaggi di follow-up "l'approvazione è andata ai DM / a un altro canale" da `createChannelNativeApprovalRuntime`; invece, esponi un instradamento accurato dell'origine + DM dell'approvatore tramite gli helper condivisi delle capacità di approvazione e lascia che il core aggreghi i recapiti effettivi prima di pubblicare qualsiasi avviso nella chat che ha avviato la richiesta.
- Preserva end-to-end il tipo di id dell'approvazione recapitata. I client nativi non dovrebbero
  dedurre o riscrivere l'instradamento dell'approvazione exec vs plugin dallo stato locale del canale.
- Tipi diversi di approvazione possono esporre intenzionalmente superfici native differenti.
  Esempi inclusi attuali:
  - Slack mantiene disponibile l'instradamento delle approvazioni native sia per gli id exec sia per quelli plugin.
  - Matrix mantiene lo stesso instradamento DM/canale nativo e la stessa UX a reazioni per le approvazioni exec
    e plugin, pur consentendo comunque che l'auth differisca in base al tipo di approvazione.
- `createApproverRestrictedNativeApprovalAdapter` esiste ancora come wrapper di compatibilità, ma il nuovo codice dovrebbe preferire il builder di capacità ed esporre `approvalCapability` nel plugin.

Per i punti di ingresso caldi del canale, preferisci i sotto-percorsi runtime più stretti quando ti serve solo
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
`openclaw/plugin-sdk/reply-chunking` quando non ti serve la
superficie ombrello più ampia.

Per la configurazione nello specifico:

- `openclaw/plugin-sdk/setup-runtime` copre gli helper di configurazione sicuri per il runtime:
  adattatori patch di configurazione sicuri all'importazione (`createPatchedAccountSetupAdapter`,
  `createEnvPatchedAccountSetupAdapter`,
  `createSetupInputPresenceValidator`), output delle note di lookup,
  `promptResolvedAllowFrom`, `splitSetupEntries` e i builder
  delegati di setup-proxy
- `openclaw/plugin-sdk/setup-adapter-runtime` è la seam stretta dell'adattatore
  sensibile all'env per `createEnvPatchedAccountSetupAdapter`
- `openclaw/plugin-sdk/channel-setup` copre i builder di configurazione a installazione opzionale
  più alcune primitive sicure per la configurazione:
  `createOptionalChannelSetupSurface`, `createOptionalChannelSetupAdapter`,

Se il tuo canale supporta configurazione o auth guidati dall'env e i flussi generici
di avvio/configurazione devono conoscere questi nomi env prima che il runtime venga caricato,
dichiarali nel manifest del plugin con `channelEnvVars`. Mantieni `envVars` del runtime del canale o
costanti locali solo per il testo rivolto agli operatori.

Se il tuo canale può comparire in `status`, `channels list`, `channels status` o nelle scansioni SecretRef prima che il runtime del plugin si avvii, aggiungi `openclaw.setupEntry` in
`package.json`. Quel punto di ingresso dovrebbe essere sicuro da importare nei percorsi di comando in sola lettura
e dovrebbe restituire i metadati del canale, l'adattatore di configurazione sicuro per il setup, l'adattatore di stato e i metadati della destinazione segreta del canale necessari per quei riepiloghi. Non
avviare client, listener o runtime di trasporto dal setup entry.

`createOptionalChannelSetupWizard`, `DEFAULT_ACCOUNT_ID`,
`createTopLevelChannelDmPolicy`, `setSetupChannelEnabled` e
`splitSetupEntries`

- usa la seam più ampia `openclaw/plugin-sdk/setup` solo quando ti servono anche gli
  helper condivisi più pesanti di setup/configurazione come
  `moveSingleAccountChannelSectionToDefaultAccount(...)`

Se il tuo canale vuole solo pubblicizzare "installa prima questo plugin" nelle
superfici di configurazione, preferisci `createOptionalChannelSetupSurface(...)`. L'adattatore/procedura guidata generato
fallisce in modo chiuso sulle scritture di configurazione e sulla finalizzazione e riutilizza
lo stesso messaggio di installazione richiesta tra validazione, finalize e testo del link alla documentazione.

Per altri percorsi caldi del canale, preferisci gli helper stretti rispetto alle
superfici legacy più ampie:

- `openclaw/plugin-sdk/account-core`,
  `openclaw/plugin-sdk/account-id`,
  `openclaw/plugin-sdk/account-resolution` e
  `openclaw/plugin-sdk/account-helpers` per la configurazione multi-account e
  il fallback dell'account predefinito
- `openclaw/plugin-sdk/inbound-envelope` e
  `openclaw/plugin-sdk/inbound-reply-dispatch` per route/envelope in ingresso e
  il cablaggio record-and-dispatch
- `openclaw/plugin-sdk/messaging-targets` per parsing/matching delle destinazioni
- `openclaw/plugin-sdk/outbound-media` e
  `openclaw/plugin-sdk/outbound-runtime` per il caricamento dei media più i delegati di
  identità/invio in uscita e la pianificazione del payload
- `openclaw/plugin-sdk/thread-bindings-runtime` per il ciclo di vita dei binding dei thread
  e la registrazione dell'adattatore
- `openclaw/plugin-sdk/agent-media-payload` solo quando è ancora richiesto un layout di campo
  legacy del payload agent/media
- `openclaw/plugin-sdk/telegram-command-config` per la normalizzazione dei comandi personalizzati di Telegram,
  la validazione di duplicati/conflitti e un contratto di configurazione dei comandi
  stabile in fallback

I canali solo auth di solito possono fermarsi al percorso predefinito: il core gestisce le approvazioni e il plugin espone solo capacità outbound/auth. I canali con approvazioni native come Matrix, Slack, Telegram e trasporti chat personalizzati dovrebbero usare gli helper nativi condivisi invece di implementare da soli il ciclo di vita delle approvazioni.

## Policy delle menzioni in ingresso

Mantieni la gestione delle menzioni in ingresso suddivisa in due livelli:

- raccolta delle evidenze gestita dal plugin
- valutazione della policy condivisa

Usa `openclaw/plugin-sdk/channel-mention-gating` per le decisioni della policy sulle menzioni.
Usa `openclaw/plugin-sdk/channel-inbound` solo quando ti serve il barrel
più ampio degli helper inbound.

Buoni candidati per la logica locale del plugin:

- rilevamento delle risposte al bot
- rilevamento delle citazioni del bot
- controlli di partecipazione al thread
- esclusioni di messaggi di servizio/sistema
- cache native della piattaforma necessarie per dimostrare la partecipazione del bot

Buoni candidati per l'helper condiviso:

- `requireMention`
- risultato di menzione esplicita
- allowlist di menzione implicita
- bypass dei comandi
- decisione finale di skip

Flusso consigliato:

1. Calcola i fatti locali sulle menzioni.
2. Passa questi fatti a `resolveInboundMentionDecision({ facts, policy })`.
3. Usa `decision.effectiveWasMentioned`, `decision.shouldBypassMention` e `decision.shouldSkip` nel gate inbound.

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

`api.runtime.channel.mentions` espone gli stessi helper condivisi per le menzioni per
i plugin di canale inclusi che dipendono già dall'iniezione runtime:

- `buildMentionRegexes`
- `matchesMentionPatterns`
- `matchesMentionWithExplicit`
- `implicitMentionKindWhen`
- `resolveInboundMentionDecision`

Se ti servono solo `implicitMentionKindWhen` e
`resolveInboundMentionDecision`, importa da
`openclaw/plugin-sdk/channel-mention-gating` per evitare di caricare helper runtime
inbound non correlati.

I vecchi helper `resolveMentionGating*` restano in
`openclaw/plugin-sdk/channel-inbound` solo come export di compatibilità. Il nuovo codice
dovrebbe usare `resolveInboundMentionDecision({ facts, policy })`.

## Procedura guidata

<Steps>
  <a id="step-1-package-and-manifest"></a>
  <Step title="Pacchetto e manifest">
    Crea i file standard del plugin. Il campo `channel` in `package.json` è
    ciò che rende questo un plugin di canale. Per la superficie completa dei metadati del pacchetto,
    vedi [Setup e configurazione del plugin](/it/plugins/sdk-setup#openclaw-channel):

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
        "properties": {
          "acme-chat": {
            "type": "object",
            "properties": {
              "token": { "type": "string" },
              "allowFrom": {
                "type": "array",
                "items": { "type": "string" }
              }
            }
          }
        }
      }
    }
    ```
    </CodeGroup>

  </Step>

  <Step title="Crea l'oggetto plugin di canale">
    L'interfaccia `ChannelPlugin` ha molte superfici adattatore opzionali. Inizia con
    il minimo — `id` e `setup` — e aggiungi adattatori secondo necessità.

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

    <Accordion title="Cosa fa per te createChatChannelPlugin">
      Invece di implementare manualmente interfacce adattatore di basso livello, passi
      opzioni dichiarative e il builder le compone:

      | Opzione | Cosa collega |
      | --- | --- |
      | `security.dm` | Resolver della sicurezza DM con scope dai campi di configurazione |
      | `pairing.text` | Flusso di abbinamento DM basato su testo con scambio di codice |
      | `threading` | Resolver della modalità reply-to (fisso, con scope per account o personalizzato) |
      | `outbound.attachedResults` | Funzioni di invio che restituiscono metadati del risultato (ID messaggi) |

      Puoi anche passare oggetti adattatore grezzi invece delle opzioni dichiarative
      se hai bisogno del pieno controllo.
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

    Inserisci i descrittori CLI gestiti dal canale in `registerCliMetadata(...)` così OpenClaw
    può mostrarli nell'help root senza attivare il runtime completo del canale,
    mentre i normali caricamenti completi continuano a acquisire gli stessi descrittori per la registrazione reale dei comandi.
    Mantieni `registerFull(...)` per il lavoro solo runtime.
    Se `registerFull(...)` registra metodi RPC Gateway, usa un
    prefisso specifico del plugin. Gli spazi dei nomi admin del core (`config.*`,
    `exec.approvals.*`, `wizard.*`, `update.*`) restano riservati e si
    risolvono sempre in `operator.admin`.
    `defineChannelPluginEntry` gestisce automaticamente la suddivisione delle modalità di registrazione. Vedi
    [Punti di ingresso](/it/plugins/sdk-entrypoints#definechannelpluginentry) per tutte le
    opzioni.

  </Step>

  <Step title="Aggiungi una setup entry">
    Crea `setup-entry.ts` per un caricamento leggero durante l'onboarding:

    ```typescript setup-entry.ts
    import { defineSetupPluginEntry } from "openclaw/plugin-sdk/channel-core";
    import { acmeChatPlugin } from "./src/channel.js";

    export default defineSetupPluginEntry(acmeChatPlugin);
    ```

    OpenClaw carica questo invece dell'entry completa quando il canale è disabilitato
    o non configurato. Evita di caricare codice runtime pesante durante i flussi di configurazione.
    Vedi [Setup e configurazione](/it/plugins/sdk-setup#setup-entry) per i dettagli.

    I canali workspace inclusi che suddividono le export sicure per il setup in moduli
    sidecar possono usare `defineBundledChannelSetupEntry(...)` da
    `openclaw/plugin-sdk/channel-entry-contract` quando hanno anche bisogno di un
    setter runtime esplicito al momento del setup.

  </Step>

  <Step title="Gestisci i messaggi in ingresso">
    Il tuo plugin deve ricevere messaggi dalla piattaforma e inoltrarli a
    OpenClaw. Il pattern tipico è un Webhook che verifica la richiesta e
    la invia tramite l'handler inbound del tuo canale:

    ```typescript
    registerFull(api) {
      api.registerHttpRoute({
        path: "/acme-chat/webhook",
        auth: "plugin", // auth gestita dal plugin (verifica tu stesso le firme)
        handler: async (req, res) => {
          const event = parseWebhookPayload(req);

          // Il tuo handler inbound invia il messaggio a OpenClaw.
          // Il collegamento esatto dipende dall'SDK della tua piattaforma —
          // vedi un esempio reale nel pacchetto plugin incluso per Microsoft Teams o Google Chat.
          await handleAcmeChatInbound(api, event);

          res.statusCode = 200;
          res.end("ok");
          return true;
        },
      });
    }
    ```

    <Note>
      La gestione dei messaggi in ingresso è specifica del canale. Ogni plugin di canale gestisce
      la propria pipeline inbound. Guarda i plugin di canale inclusi
      (per esempio il pacchetto plugin di Microsoft Teams o Google Chat) per pattern reali.
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

    Per gli helper di test condivisi, vedi [Testing](/it/plugins/sdk-testing).

  </Step>
</Steps>

## Struttura dei file

```
<bundled-plugin-root>/acme-chat/
├── package.json              # metadati openclaw.channel
├── openclaw.plugin.json      # Manifest con schema di configurazione
├── index.ts                  # defineChannelPluginEntry
├── setup-entry.ts            # defineSetupPluginEntry
├── api.ts                    # export pubbliche (facoltativo)
├── runtime-api.ts            # export runtime interne (facoltativo)
└── src/
    ├── channel.ts            # ChannelPlugin tramite createChatChannelPlugin
    ├── channel.test.ts       # Test
    ├── client.ts             # client API della piattaforma
    └── runtime.ts            # store runtime (se necessario)
```

## Argomenti avanzati

<CardGroup cols={2}>
  <Card title="Opzioni di threading" icon="git-branch" href="/it/plugins/sdk-entrypoints#registration-mode">
    Modalità di risposta fisse, con scope per account o personalizzate
  </Card>
  <Card title="Integrazione dello strumento message" icon="puzzle" href="/it/plugins/architecture#channel-plugins-and-the-shared-message-tool">
    describeMessageTool e discovery delle azioni
  </Card>
  <Card title="Risoluzione della destinazione" icon="crosshair" href="/it/plugins/architecture#channel-target-resolution">
    inferTargetChatType, looksLikeId, resolveTarget
  </Card>
  <Card title="Helper runtime" icon="settings" href="/it/plugins/sdk-runtime">
    TTS, STT, media, subagent tramite api.runtime
  </Card>
</CardGroup>

<Note>
Alcune seam helper incluse esistono ancora per manutenzione e
compatibilità dei plugin inclusi. Non sono il pattern consigliato per i nuovi plugin di canale;
preferisci i sotto-percorsi generici channel/setup/reply/runtime della superficie
SDK comune, a meno che tu non stia mantenendo direttamente quella famiglia di plugin inclusi.
</Note>

## Passaggi successivi

- [Plugin provider](/it/plugins/sdk-provider-plugins) — se il tuo plugin fornisce anche modelli
- [Panoramica dell'SDK](/it/plugins/sdk-overview) — riferimento completo agli import dei sotto-percorsi
- [Test dell'SDK](/it/plugins/sdk-testing) — utility di test e test di contratto
- [Manifest del plugin](/it/plugins/manifest) — schema completo del manifest
