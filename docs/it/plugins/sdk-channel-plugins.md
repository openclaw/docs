---
read_when:
    - Stai creando un nuovo Plugin canale di messaggistica
    - Vuoi collegare OpenClaw a una piattaforma di messaggistica
    - Devi comprendere la superficie dell'adapter ChannelPlugin
sidebarTitle: Channel Plugins
summary: Guida passo passo alla creazione di un Plugin canale di messaggistica per OpenClaw
title: Creazione di Plugin canale
x-i18n:
    generated_at: "2026-04-25T13:52:44Z"
    model: gpt-5.4
    provider: openai
    source_hash: 0a466decff828bdce1d9d3e85127867b88f43c6eca25aa97306f8bd0df39f3a9
    source_path: plugins/sdk-channel-plugins.md
    workflow: 15
---

Questa guida illustra la creazione di un Plugin canale che collega OpenClaw a una
piattaforma di messaggistica. Alla fine avrai un canale funzionante con sicurezza DM,
pairing, threading delle risposte e messaggistica in uscita.

<Info>
  Se non hai mai creato prima un Plugin OpenClaw, leggi prima
  [Getting Started](/it/plugins/building-plugins) per la struttura di base del pacchetto
  e la configurazione del manifest.
</Info>

## Come funzionano i Plugin canale

I Plugin canale non hanno bisogno dei propri strumenti send/edit/react. OpenClaw mantiene un
unico strumento `message` condiviso nel core. Il tuo Plugin possiede:

- **Config** — risoluzione dell'account e setup wizard
- **Security** — policy DM e allowlist
- **Pairing** — flusso di approvazione DM
- **Session grammar** — come gli id di conversazione specifici del provider vengono mappati a chat base, id thread e fallback parent
- **Outbound** — invio di testo, media e sondaggi alla piattaforma
- **Threading** — come vengono inserite nei thread le risposte
- **Heartbeat typing** — segnali facoltativi typing/busy per le destinazioni di consegna Heartbeat

Il core possiede lo strumento message condiviso, il wiring dei prompt, la forma esterna della chiave di sessione,
la gestione generica di `:thread:` e il dispatch.

Se il tuo canale supporta indicatori di digitazione al di fuori delle risposte in ingresso, esponi
`heartbeat.sendTyping(...)` sul Plugin canale. Il core lo chiama con la destinazione di consegna heartbeat
risolta prima dell'inizio dell'esecuzione del modello heartbeat e usa il ciclo di vita condiviso di keepalive/cleanup della digitazione. Aggiungi `heartbeat.clearTyping(...)`
quando la piattaforma richiede un segnale di stop esplicito.

Se il tuo canale aggiunge parametri dello strumento message che trasportano sorgenti media, esponi quei
nomi di parametro tramite `describeMessageTool(...).mediaSourceParams`. Il core usa questo elenco esplicito
per la normalizzazione dei percorsi sandbox e la policy di accesso ai media in uscita, così i Plugin
non hanno bisogno di casi speciali nel core condiviso per parametri specifici del provider relativi ad avatar, allegati o immagini di copertina.
Preferisci restituire una mappa indicizzata per azione come
`{ "set-profile": ["avatarUrl", "avatarPath"] }` in modo che azioni non correlate non
ereditino gli argomenti media di un'altra azione. Un array flat continua comunque a funzionare per parametri che sono intenzionalmente condivisi tra ogni azione esposta.

Se la tua piattaforma memorizza scope extra dentro gli id di conversazione, mantieni quel parsing
nel Plugin con `messaging.resolveSessionConversation(...)`. Questo è l'hook canonico
per mappare `rawId` all'id di conversazione base, all'id thread facoltativo,
a `baseConversationId` esplicito e a eventuali `parentConversationCandidates`.
Quando restituisci `parentConversationCandidates`, mantienili ordinati dal
parent più specifico a quello più ampio/conversazione base.

I Plugin bundled che hanno bisogno dello stesso parsing prima che il registro dei canali venga avviato
possono anche esporre un file top-level `session-key-api.ts` con un'export
`resolveSessionConversation(...)` corrispondente. Il core usa questa superficie sicura per il bootstrap
solo quando il registro Plugin runtime non è ancora disponibile.

`messaging.resolveParentConversationCandidates(...)` resta disponibile come fallback di compatibilità legacy quando un Plugin ha bisogno solo di fallback parent sopra l'id generico/raw. Se esistono entrambi gli hook, il core usa prima
`resolveSessionConversation(...).parentConversationCandidates` e fa fallback a `resolveParentConversationCandidates(...)` solo quando l'hook canonico li omette.

## Approvazioni e capability del canale

La maggior parte dei Plugin canale non ha bisogno di codice specifico per le approvazioni.

- Il core possiede `/approve` nella stessa chat, i payload condivisi dei pulsanti di approvazione e la consegna generica di fallback.
- Preferisci un unico oggetto `approvalCapability` sul Plugin canale quando il canale ha bisogno di comportamento specifico per le approvazioni.
- `ChannelPlugin.approvals` è stato rimosso. Inserisci in `approvalCapability` i fatti di consegna/approvazione nativa/rendering/auth.
- `plugin.auth` serve solo per login/logout; il core non legge più hook auth di approvazione da quell'oggetto.
- `approvalCapability.authorizeActorAction` e `approvalCapability.getActionAvailabilityState` sono il seam canonico per l'auth delle approvazioni.
- Usa `approvalCapability.getActionAvailabilityState` per la disponibilità auth delle approvazioni nella stessa chat.
- Se il tuo canale espone approvazioni exec native, usa `approvalCapability.getExecInitiatingSurfaceState` per lo stato della superficie di avvio/client nativo quando differisce dall'auth di approvazione nella stessa chat. Il core usa questo hook specifico di exec per distinguere `enabled` da `disabled`, decidere se il canale iniziante supporta approvazioni exec native e includere il canale nelle indicazioni di fallback del client nativo. `createApproverRestrictedNativeApprovalCapability(...)` compila questo caso comune.
- Usa `outbound.shouldSuppressLocalPayloadPrompt` o `outbound.beforeDeliverPayload` per comportamenti specifici del canale nel ciclo di vita del payload, come nascondere prompt locali di approvazione duplicati o inviare indicatori di digitazione prima della consegna.
- Usa `approvalCapability.delivery` solo per il routing di approvazioni native o per la soppressione del fallback.
- Usa `approvalCapability.nativeRuntime` per i fatti di approvazione nativa posseduti dal canale. Mantienilo lazy negli hot entrypoint del canale con `createLazyChannelApprovalNativeRuntimeAdapter(...)`, che può importare il tuo modulo runtime on demand pur consentendo al core di assemblare il ciclo di vita dell'approvazione.
- Usa `approvalCapability.render` solo quando un canale ha davvero bisogno di payload di approvazione personalizzati invece del renderer condiviso.
- Usa `approvalCapability.describeExecApprovalSetup` quando il canale vuole che la risposta del percorso disabilitato spieghi le esatte manopole di configurazione necessarie per abilitare le approvazioni exec native. L'hook riceve `{ channel, channelLabel, accountId }`; i canali con account con nome dovrebbero mostrare percorsi con ambito account come `channels.<channel>.accounts.<id>.execApprovals.*` invece dei predefiniti top-level.
- Se un canale può inferire identità DM stabili simili a owner dalla configurazione esistente, usa `createResolvedApproverActionAuthAdapter` da `openclaw/plugin-sdk/approval-runtime` per limitare `/approve` nella stessa chat senza aggiungere logica core specifica per le approvazioni.
- Se un canale ha bisogno di consegna di approvazioni native, mantieni il codice del canale focalizzato sulla normalizzazione del target più i fatti di trasporto/presentazione. Usa `createChannelExecApprovalProfile`, `createChannelNativeOriginTargetResolver`, `createChannelApproverDmTargetResolver` e `createApproverRestrictedNativeApprovalCapability` da `openclaw/plugin-sdk/approval-runtime`. Metti i fatti specifici del canale dietro `approvalCapability.nativeRuntime`, idealmente tramite `createChannelApprovalNativeRuntimeAdapter(...)` o `createLazyChannelApprovalNativeRuntimeAdapter(...)`, in modo che il core possa assemblare l'handler e possedere filtering delle richieste, routing, dedupe, expiry, subscription del gateway e avvisi di routed-elsewhere. `nativeRuntime` è suddiviso in alcuni seam più piccoli:
- `availability` — se l'account è configurato e se una richiesta deve essere gestita
- `presentation` — mappa il view model condiviso dell'approvazione in payload nativi pending/resolved/expired o azioni finali
- `transport` — prepara i target più invia/aggiorna/elimina i messaggi di approvazione nativa
- `interactions` — hook facoltativi bind/unbind/clear-action per pulsanti o reazioni native
- `observe` — hook facoltativi per la diagnostica della consegna
- Se il canale ha bisogno di oggetti posseduti dal runtime come un client, token, app Bolt o ricevitore webhook, registrali tramite `openclaw/plugin-sdk/channel-runtime-context`. Il registro runtime-context generico consente al core di avviare handler guidati dalle capability dallo stato di startup del canale senza aggiungere glue wrapper specifico per le approvazioni.
- Ricorri a `createChannelApprovalHandler` o `createChannelNativeApprovalRuntime` di livello più basso solo quando il seam guidato dalle capability non è ancora abbastanza espressivo.
- I canali di approvazione nativa devono instradare sia `accountId` sia `approvalKind` attraverso questi helper. `accountId` mantiene la policy di approvazione multi-account limitata al giusto account bot, e `approvalKind` rende disponibile al canale il comportamento di approvazione exec vs Plugin senza branch hardcoded nel core.
- Il core ora possiede anche gli avvisi di reroute delle approvazioni. I Plugin canale non dovrebbero inviare i propri messaggi di follow-up tipo "approval went to DMs / another channel" da `createChannelNativeApprovalRuntime`; invece, esponi un routing accurato origin + approver-DM tramite gli helper condivisi di approval capability e lascia che il core aggreghi le consegne effettive prima di pubblicare qualsiasi avviso nella chat iniziante.
- Preserva end-to-end il tipo di id dell'approvazione consegnata. I client nativi non dovrebbero
  indovinare o riscrivere il routing di approvazione exec vs Plugin dallo stato locale del canale.
- Diversi tipi di approvazione possono intenzionalmente esporre superfici native diverse.
  Esempi bundled attuali:
  - Slack mantiene disponibile il routing di approvazione nativa sia per gli id exec sia per quelli Plugin.
  - Matrix mantiene lo stesso routing nativo DM/canale e la stessa UX a reazioni per le approvazioni exec
    e Plugin, pur consentendo comunque che l'auth differisca per tipo di approvazione.
- `createApproverRestrictedNativeApprovalAdapter` esiste ancora come wrapper di compatibilità, ma il nuovo codice dovrebbe preferire il builder di capability ed esporre `approvalCapability` sul Plugin.

Per gli hot entrypoint del canale, preferisci i subpath runtime più stretti quando hai bisogno solo
di una parte di quella famiglia:

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
`openclaw/plugin-sdk/reply-chunking` quando non ti serve la superficie umbrella più ampia.

Per il setup in particolare:

- `openclaw/plugin-sdk/setup-runtime` copre gli helper di setup sicuri per il runtime:
  adapter di patch del setup import-safe (`createPatchedAccountSetupAdapter`,
  `createEnvPatchedAccountSetupAdapter`,
  `createSetupInputPresenceValidator`), output di lookup-note,
  `promptResolvedAllowFrom`, `splitSetupEntries` e i builder di
  setup-proxy delegato
- `openclaw/plugin-sdk/setup-adapter-runtime` è il seam stretto dell'adapter env-aware
  per `createEnvPatchedAccountSetupAdapter`
- `openclaw/plugin-sdk/channel-setup` copre i builder di setup per installazione facoltativa
  più alcune primitive setup-safe:
  `createOptionalChannelSetupSurface`, `createOptionalChannelSetupAdapter`,

Se il tuo canale supporta setup o auth guidati dall'env e i flussi generici di startup/config
devono conoscere quei nomi env prima del caricamento del runtime, dichiarali nel
manifest del Plugin con `channelEnvVars`. Mantieni `envVars` del runtime del canale o
costanti locali solo per il testo rivolto agli operatori.

Se il tuo canale può comparire in `status`, `channels list`, `channels status` o nelle scansioni SecretRef prima dell'avvio del runtime del Plugin, aggiungi `openclaw.setupEntry` in
`package.json`. Quell'entrypoint deve essere sicuro da importare nei percorsi comando in sola lettura e deve restituire i metadati del canale, l'adapter di configurazione setup-safe, lo status adapter e i metadati target secret del canale necessari per quei riepiloghi. Non avviare client, listener o runtime di trasporto dal setup entry.

Mantieni stretto anche il percorso di import del main channel entry. Il rilevamento può valutare
l'entry e il modulo del Plugin canale per registrare capability senza attivare
il canale. File come `channel-plugin-api.ts` dovrebbero esportare l'oggetto del plugin canale senza importare setup wizard, client di trasporto, listener socket, launcher di sottoprocessi o moduli di avvio del servizio. Metti questi pezzi runtime in moduli caricati da `registerFull(...)`, setter runtime o adapter lazy di capability.

`createOptionalChannelSetupWizard`, `DEFAULT_ACCOUNT_ID`,
`createTopLevelChannelDmPolicy`, `setSetupChannelEnabled` e
`splitSetupEntries`

- usa il seam più ampio `openclaw/plugin-sdk/setup` solo quando hai bisogno anche degli helper condivisi più pesanti di setup/config come
  `moveSingleAccountChannelSectionToDefaultAccount(...)`

Se il tuo canale vuole solo pubblicizzare "installa prima questo Plugin" nelle
superfici di setup, preferisci `createOptionalChannelSetupSurface(...)`. L'adapter/wizard generato
fallisce in modalità fail-closed sulle scritture di configurazione e sulla finalizzazione, e riusa
lo stesso messaggio di installazione richiesta in validazione, finalize e testo del link alla documentazione.

Per altri hot path del canale, preferisci gli helper stretti alle superfici legacy più ampie:

- `openclaw/plugin-sdk/account-core`,
  `openclaw/plugin-sdk/account-id`,
  `openclaw/plugin-sdk/account-resolution` e
  `openclaw/plugin-sdk/account-helpers` per la configurazione multi-account e
  il fallback dell'account predefinito
- `openclaw/plugin-sdk/inbound-envelope` e
  `openclaw/plugin-sdk/inbound-reply-dispatch` per il wiring di route/envelope inbound e
  record-and-dispatch
- `openclaw/plugin-sdk/messaging-targets` per il parsing/matching dei target
- `openclaw/plugin-sdk/outbound-media` e
  `openclaw/plugin-sdk/outbound-runtime` per il caricamento dei media più i delegati
  identity/send outbound e la pianificazione del payload
- `buildThreadAwareOutboundSessionRoute(...)` da
  `openclaw/plugin-sdk/channel-core` quando un percorso outbound deve preservare un
  `replyToId`/`threadId` esplicito o recuperare la sessione corrente `:thread:`
  dopo che la chiave di sessione base continua a corrispondere. I Plugin provider possono sovrascrivere
  precedenza, comportamento del suffisso e normalizzazione dell'id thread quando la loro piattaforma
  ha semantiche native di consegna thread.
- `openclaw/plugin-sdk/thread-bindings-runtime` per il ciclo di vita dei thread-binding
  e la registrazione degli adapter
- `openclaw/plugin-sdk/agent-media-payload` solo quando è ancora richiesto un layout legacy dei campi payload agente/media
- `openclaw/plugin-sdk/telegram-command-config` per la normalizzazione dei comandi personalizzati Telegram,
  la validazione di duplicati/conflitti e un contratto di configurazione dei comandi stabile per il fallback

I canali solo-auth di solito possono fermarsi al percorso predefinito: il core gestisce le approvazioni e il Plugin espone solo capability outbound/auth. I canali con approvazione nativa come Matrix, Slack, Telegram e trasporti chat personalizzati dovrebbero usare gli helper nativi condivisi invece di implementare in proprio il ciclo di vita delle approvazioni.

## Policy delle menzioni in ingresso

Mantieni la gestione delle menzioni in ingresso divisa in due livelli:

- raccolta delle evidenze posseduta dal Plugin
- valutazione condivisa della policy

Usa `openclaw/plugin-sdk/channel-mention-gating` per le decisioni sulla mention-policy.
Usa `openclaw/plugin-sdk/channel-inbound` solo quando ti serve il barrel helper
inbound più ampio.

Buoni candidati per la logica locale del Plugin:

- rilevamento risposta-al-bot
- rilevamento citazione-del-bot
- controlli di partecipazione al thread
- esclusioni di messaggi di servizio/sistema
- cache native della piattaforma necessarie per dimostrare la partecipazione del bot

Buoni candidati per l'helper condiviso:

- `requireMention`
- risultato di menzione esplicita
- allowlist di menzione implicita
- bypass dei comandi
- decisione finale di skip

Flusso preferito:

1. Calcola i fatti locali delle menzioni.
2. Passa quei fatti a `resolveInboundMentionDecision({ facts, policy })`.
3. Usa `decision.effectiveWasMentioned`, `decision.shouldBypassMention` e `decision.shouldSkip` nel tuo gate inbound.

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
i Plugin canale bundled che già dipendono dall'iniezione runtime:

- `buildMentionRegexes`
- `matchesMentionPatterns`
- `matchesMentionWithExplicit`
- `implicitMentionKindWhen`
- `resolveInboundMentionDecision`

Se hai bisogno solo di `implicitMentionKindWhen` e
`resolveInboundMentionDecision`, importa da
`openclaw/plugin-sdk/channel-mention-gating` per evitare di caricare helper runtime
inbound non correlati.

I vecchi helper `resolveMentionGating*` restano su
`openclaw/plugin-sdk/channel-inbound` solo come export di compatibilità. Il nuovo codice
dovrebbe usare `resolveInboundMentionDecision({ facts, policy })`.

## Procedura

<Steps>
  <a id="step-1-package-and-manifest"></a>
  <Step title="Pacchetto e manifest">
    Crea i file standard del Plugin. Il campo `channel` in `package.json` è
    ciò che rende questo un Plugin canale. Per l'intera superficie dei metadati di pacchetto,
    vedi [Plugin Setup and Config](/it/plugins/sdk-setup#openclaw-channel):

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
          "blurb": "Collega OpenClaw a Acme Chat."
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
      "description": "Plugin canale Acme Chat",
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
              "label": "Token del bot",
              "sensitive": true
            }
          }
        }
      }
    }
    ```
    </CodeGroup>

    `configSchema` convalida `plugins.entries.acme-chat.config`. Usalo per
    impostazioni possedute dal Plugin che non sono la configurazione account del canale. `channelConfigs`
    convalida `channels.acme-chat` ed è la sorgente cold-path usata da schema di configurazione,
    setup e superfici UI prima del caricamento del runtime del Plugin.

  </Step>

  <Step title="Crea l'oggetto del plugin canale">
    L'interfaccia `ChannelPlugin` ha molte superfici adapter facoltative. Parti dal
    minimo — `id` e `setup` — e aggiungi adapter quando ne hai bisogno.

    Crea `src/channel.ts`:

    ```typescript src/channel.ts
    import {
      createChatChannelPlugin,
      createChannelPluginBase,
    } from "openclaw/plugin-sdk/channel-core";
    import type { OpenClawConfig } from "openclaw/plugin-sdk/channel-core";
    import { acmeChatApi } from "./client.js"; // il tuo client API della piattaforma

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

      // Sicurezza DM: chi può inviare messaggi al bot
      security: {
        dm: {
          channelKey: "acme-chat",
          resolvePolicy: (account) => account.dmPolicy,
          resolveAllowFrom: (account) => account.allowFrom,
          defaultPolicy: "allowlist",
        },
      },

      // Pairing: flusso di approvazione per nuovi contatti DM
      pairing: {
        text: {
          idLabel: "Username Acme Chat",
          message: "Invia questo codice per verificare la tua identità:",
          notify: async ({ target, code }) => {
            await acmeChatApi.sendDm(target, `Codice di pairing: ${code}`);
          },
        },
      },

      // Threading: come vengono consegnate le risposte
      threading: { topLevelReplyToMode: "reply" },

      // Outbound: invio dei messaggi alla piattaforma
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
      Invece di implementare manualmente interfacce adapter di basso livello, passi
      opzioni dichiarative e il builder le compone:

      | Opzione | Cosa collega |
      | --- | --- |
      | `security.dm` | Resolver di sicurezza DM con ambito dai campi di configurazione |
      | `pairing.text` | Flusso di pairing DM basato su testo con scambio di codice |
      | `threading` | Resolver della modalità reply-to (fissa, con ambito account o personalizzata) |
      | `outbound.attachedResults` | Funzioni di invio che restituiscono metadati del risultato (ID messaggio) |

      Puoi anche passare oggetti adapter raw invece delle opzioni dichiarative
      se hai bisogno di controllo completo.

      Gli adapter outbound raw possono definire una funzione `chunker(text, limit, ctx)`.
      L'oggetto facoltativo `ctx.formatting` trasporta decisioni di formattazione al momento della consegna
      come `maxLinesPerMessage`; applicalo prima dell'invio in modo che threading delle risposte
      e confini dei chunk vengano risolti una sola volta dalla consegna outbound condivisa.
      I contesti di invio includono anche `replyToIdSource` (`implicit` o `explicit`)
      quando è stato risolto un target di risposta nativo, così gli helper payload possono preservare
      tag di risposta espliciti senza consumare uno slot di risposta implicito monouso.
    </Accordion>

  </Step>

  <Step title="Collega l'entry point">
    Crea `index.ts`:

    ```typescript index.ts
    import { defineChannelPluginEntry } from "openclaw/plugin-sdk/channel-core";
    import { acmeChatPlugin } from "./src/channel.js";

    export default defineChannelPluginEntry({
      id: "acme-chat",
      name: "Acme Chat",
      description: "Plugin canale Acme Chat",
      plugin: acmeChatPlugin,
      registerCliMetadata(api) {
        api.registerCli(
          ({ program }) => {
            program
              .command("acme-chat")
              .description("Gestione Acme Chat");
          },
          {
            descriptors: [
              {
                name: "acme-chat",
                description: "Gestione Acme Chat",
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

    Inserisci i descrittori CLI posseduti dal canale in `registerCliMetadata(...)` in modo che OpenClaw
    possa mostrarli nell'help root senza attivare il runtime completo del canale,
    mentre i normali caricamenti completi continuano a rilevare gli stessi descrittori per la reale
    registrazione dei comandi. Mantieni `registerFull(...)` per il lavoro solo runtime.
    Se `registerFull(...)` registra metodi RPC del gateway, usa un
    prefisso specifico del Plugin. I namespace admin core (`config.*`,
    `exec.approvals.*`, `wizard.*`, `update.*`) restano riservati e si
    risolvono sempre in `operator.admin`.
    `defineChannelPluginEntry` gestisce automaticamente la suddivisione della modalità di registrazione. Vedi
    [Entry Points](/it/plugins/sdk-entrypoints#definechannelpluginentry) per tutte le
    opzioni.

  </Step>

  <Step title="Aggiungi una setup entry">
    Crea `setup-entry.ts` per il caricamento leggero durante l'onboarding:

    ```typescript setup-entry.ts
    import { defineSetupPluginEntry } from "openclaw/plugin-sdk/channel-core";
    import { acmeChatPlugin } from "./src/channel.js";

    export default defineSetupPluginEntry(acmeChatPlugin);
    ```

    OpenClaw carica questo invece dell'entry completa quando il canale è disabilitato
    o non configurato. In questo modo evita di importare codice runtime pesante durante i flussi di setup.
    Vedi [Setup and Config](/it/plugins/sdk-setup#setup-entry) per i dettagli.

    I canali bundled del workspace che separano gli export setup-safe in moduli
    sidecar possono usare `defineBundledChannelSetupEntry(...)` da
    `openclaw/plugin-sdk/channel-entry-contract` quando hanno bisogno anche di un
    setter runtime esplicito al momento del setup.

  </Step>

  <Step title="Gestisci i messaggi in ingresso">
    Il tuo Plugin deve ricevere messaggi dalla piattaforma e inoltrarli a
    OpenClaw. Il pattern tipico è un webhook che verifica la richiesta e la
    inoltra tramite l'handler inbound del tuo canale:

    ```typescript
    registerFull(api) {
      api.registerHttpRoute({
        path: "/acme-chat/webhook",
        auth: "plugin", // auth gestita dal plugin (verifica tu le firme)
        handler: async (req, res) => {
          const event = parseWebhookPayload(req);

          // Il tuo handler inbound inoltra il messaggio a OpenClaw.
          // Il wiring esatto dipende dall'SDK della tua piattaforma —
          // vedi un esempio reale nel pacchetto Plugin bundled Microsoft Teams o Google Chat.
          await handleAcmeChatInbound(api, event);

          res.statusCode = 200;
          res.end("ok");
          return true;
        },
      });
    }
    ```

    <Note>
      La gestione dei messaggi in ingresso è specifica del canale. Ogni Plugin canale possiede
      la propria pipeline inbound. Guarda i Plugin canale bundled
      (ad esempio il pacchetto Plugin Microsoft Teams o Google Chat) per pattern reali.
    </Note>

  </Step>

<a id="step-6-test"></a>
<Step title="Test">
Scrivi test colocati in `src/channel.test.ts`:

    ```typescript src/channel.test.ts
    import { describe, it, expect } from "vitest";
    import { acmeChatPlugin } from "./channel.js";

    describe("plugin acme-chat", () => {
      it("risolve l'account dalla configurazione", () => {
        const cfg = {
          channels: {
            "acme-chat": { token: "test-token", allowFrom: ["user1"] },
          },
        } as any;
        const account = acmeChatPlugin.setup!.resolveAccount(cfg, undefined);
        expect(account.token).toBe("test-token");
      });

      it("ispeziona l'account senza materializzare i secret", () => {
        const cfg = {
          channels: { "acme-chat": { token: "test-token" } },
        } as any;
        const result = acmeChatPlugin.setup!.inspectAccount!(cfg, undefined);
        expect(result.configured).toBe(true);
        expect(result.tokenStatus).toBe("available");
      });

      it("segnala la configurazione mancante", () => {
        const cfg = { channels: {} } as any;
        const result = acmeChatPlugin.setup!.inspectAccount!(cfg, undefined);
        expect(result.configured).toBe(false);
      });
    });
    ```

    ```bash
    pnpm test -- <bundled-plugin-root>/acme-chat/
    ```

    Per helper di test condivisi, vedi [Testing](/it/plugins/sdk-testing).

</Step>
</Steps>

## Struttura dei file

```
<bundled-plugin-root>/acme-chat/
├── package.json              # metadati openclaw.channel
├── openclaw.plugin.json      # Manifest con schema di configurazione
├── index.ts                  # defineChannelPluginEntry
├── setup-entry.ts            # defineSetupPluginEntry
├── api.ts                    # Export pubblici (facoltativo)
├── runtime-api.ts            # Export runtime interni (facoltativo)
└── src/
    ├── channel.ts            # ChannelPlugin tramite createChatChannelPlugin
    ├── channel.test.ts       # Test
    ├── client.ts             # Client API della piattaforma
    └── runtime.ts            # Store runtime (se necessario)
```

## Argomenti avanzati

<CardGroup cols={2}>
  <Card title="Opzioni di threading" icon="git-branch" href="/it/plugins/sdk-entrypoints#registration-mode">
    Modalità reply fisse, con ambito account o personalizzate
  </Card>
  <Card title="Integrazione dello strumento message" icon="puzzle" href="/it/plugins/architecture#channel-plugins-and-the-shared-message-tool">
    describeMessageTool e discovery delle azioni
  </Card>
  <Card title="Risoluzione del target" icon="crosshair" href="/it/plugins/architecture-internals#channel-target-resolution">
    inferTargetChatType, looksLikeId, resolveTarget
  </Card>
  <Card title="Helper runtime" icon="settings" href="/it/plugins/sdk-runtime">
    TTS, STT, media, subagent tramite api.runtime
  </Card>
</CardGroup>

<Note>
Esistono ancora alcuni seam helper bundled per la manutenzione e la
compatibilità dei Plugin bundled. Non sono il pattern consigliato per nuovi Plugin canale;
preferisci i subpath generici channel/setup/reply/runtime dalla superficie SDK
comune, a meno che tu non stia mantenendo direttamente quella famiglia di Plugin bundled.
</Note>

## Passaggi successivi

- [Provider Plugins](/it/plugins/sdk-provider-plugins) — se il tuo Plugin fornisce anche modelli
- [SDK Overview](/it/plugins/sdk-overview) — riferimento completo degli import subpath
- [SDK Testing](/it/plugins/sdk-testing) — utilità di test e contract test
- [Plugin Manifest](/it/plugins/manifest) — schema completo del manifest

## Correlati

- [Plugin SDK setup](/it/plugins/sdk-setup)
- [Building plugins](/it/plugins/building-plugins)
- [Agent harness plugins](/it/plugins/sdk-agent-harness)
