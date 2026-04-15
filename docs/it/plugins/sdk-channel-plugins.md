---
read_when:
    - Stai creando un nuovo Plugin di canale di messaggistica
    - Vuoi collegare OpenClaw a una piattaforma di messaggistica
    - Devi comprendere la superficie dell'adapter `ChannelPlugin`
sidebarTitle: Channel Plugins
summary: Guida passo passo alla creazione di un Plugin di canale di messaggistica per OpenClaw
title: Creazione di Plugin di canale
x-i18n:
    generated_at: "2026-04-15T19:41:38Z"
    model: gpt-5.4
    provider: openai
    source_hash: 80e47e61d1e47738361692522b79aff276544446c58a7b41afe5296635dfad4b
    source_path: plugins/sdk-channel-plugins.md
    workflow: 15
---

# Creazione di Plugin di canale

Questa guida illustra come creare un Plugin di canale che colleghi OpenClaw a una
piattaforma di messaggistica. Alla fine avrai un canale funzionante con sicurezza
dei DM, pairing, threading delle risposte e messaggistica in uscita.

<Info>
  Se non hai mai creato prima alcun Plugin OpenClaw, leggi prima
  [Getting Started](/it/plugins/building-plugins) per la struttura di base del
  pacchetto e la configurazione del manifest.
</Info>

## Come funzionano i Plugin di canale

I Plugin di canale non hanno bisogno dei propri strumenti di invio/modifica/reazione. OpenClaw mantiene un unico strumento `message` condiviso nel core. Il tuo plugin gestisce:

- **Config** — risoluzione dell'account e procedura guidata di configurazione
- **Security** — policy dei DM e allowlist
- **Pairing** — flusso di approvazione dei DM
- **Session grammar** — come gli id di conversazione specifici del provider vengono mappati a chat di base, id di thread e fallback del parent
- **Outbound** — invio di testo, contenuti multimediali e sondaggi alla piattaforma
- **Threading** — come vengono organizzate in thread le risposte

Il core gestisce lo strumento message condiviso, il wiring del prompt, la forma
esterna della chiave di sessione, la gestione generica `:thread:` e il dispatch.

Se il tuo canale aggiunge parametri dello strumento message che trasportano fonti multimediali, esponi quei
nomi di parametri tramite `describeMessageTool(...).mediaSourceParams`. Il core usa
questo elenco esplicito per la normalizzazione dei percorsi sandbox e la policy di
accesso ai media in uscita, quindi i plugin non hanno bisogno di casi speciali
nel core condiviso per parametri specifici del provider come avatar,
allegati o immagini di copertina.
Preferisci restituire una mappa indicizzata per azione come
`{ "set-profile": ["avatarUrl", "avatarPath"] }` in modo che azioni non correlate non
ereditino gli argomenti multimediali di un'altra azione. Un array flat continua a funzionare per i parametri che
sono intenzionalmente condivisi tra ogni azione esposta.

Se la tua piattaforma memorizza uno scope aggiuntivo negli id di conversazione, mantieni quel parsing
nel plugin con `messaging.resolveSessionConversation(...)`. Questo è l'hook canonico
per mappare `rawId` all'id di conversazione di base, all'id di thread facoltativo,
a `baseConversationId` esplicito e a eventuali `parentConversationCandidates`.
Quando restituisci `parentConversationCandidates`, mantienili ordinati dal
parent più specifico a quello più ampio/conversazione di base.

I Plugin inclusi che necessitano dello stesso parsing prima che il registro dei canali si avvii
possono anche esporre un file `session-key-api.ts` di primo livello con un export
`resolveSessionConversation(...)` corrispondente. Il core usa questa superficie
sicura per il bootstrap solo quando il registro runtime dei plugin non è ancora disponibile.

`messaging.resolveParentConversationCandidates(...)` rimane disponibile come
fallback di compatibilità legacy quando un plugin ha bisogno solo di fallback del parent
sopra l'id generico/raw. Se esistono entrambi gli hook, il core usa prima
`resolveSessionConversation(...).parentConversationCandidates` e ricorre a
`resolveParentConversationCandidates(...)` solo quando l'hook canonico li omette.

## Approvazioni e capacità del canale

La maggior parte dei Plugin di canale non richiede codice specifico per le approvazioni.

- Il core gestisce `/approve` nella stessa chat, i payload condivisi dei pulsanti di approvazione e la consegna di fallback generica.
- Preferisci un singolo oggetto `approvalCapability` nel plugin quando il canale richiede un comportamento specifico per l'approvazione.
- `ChannelPlugin.approvals` è stato rimosso. Inserisci fatti di consegna/approvazione nativa/rendering/autenticazione in `approvalCapability`.
- `plugin.auth` è solo per login/logout; il core non legge più gli hook di autenticazione per l'approvazione da quell'oggetto.
- `approvalCapability.authorizeActorAction` e `approvalCapability.getActionAvailabilityState` sono la seam canonica per l'autenticazione delle approvazioni.
- Usa `approvalCapability.getActionAvailabilityState` per la disponibilità dell'autenticazione delle approvazioni nella stessa chat.
- Se il tuo canale espone approvazioni exec native, usa `approvalCapability.getExecInitiatingSurfaceState` per lo stato della superficie di avvio/client nativo quando differisce dall'autenticazione delle approvazioni nella stessa chat. Il core usa questo hook specifico per exec per distinguere `enabled` da `disabled`, decidere se il canale di avvio supporta approvazioni exec native e includere il canale nelle indicazioni di fallback del client nativo. `createApproverRestrictedNativeApprovalCapability(...)` lo compila per il caso comune.
- Usa `outbound.shouldSuppressLocalPayloadPrompt` o `outbound.beforeDeliverPayload` per comportamenti del ciclo di vita del payload specifici del canale, come nascondere prompt locali di approvazione duplicati o inviare indicatori di digitazione prima della consegna.
- Usa `approvalCapability.delivery` solo per il routing delle approvazioni native o la soppressione del fallback.
- Usa `approvalCapability.nativeRuntime` per i fatti sulle approvazioni native posseduti dal canale. Mantienilo lazy sugli entrypoint hot del canale con `createLazyChannelApprovalNativeRuntimeAdapter(...)`, che può importare il tuo modulo runtime on demand consentendo comunque al core di assemblare il ciclo di vita dell'approvazione.
- Usa `approvalCapability.render` solo quando un canale ha davvero bisogno di payload di approvazione personalizzati invece del renderer condiviso.
- Usa `approvalCapability.describeExecApprovalSetup` quando il canale vuole che la risposta nel percorso disabilitato spieghi le esatte manopole di configurazione necessarie per abilitare le approvazioni exec native. L'hook riceve `{ channel, channelLabel, accountId }`; i canali con account nominali dovrebbero renderizzare percorsi con scope account come `channels.<channel>.accounts.<id>.execApprovals.*` invece dei valori predefiniti di livello superiore.
- Se un canale può dedurre identità DM stabili simili al proprietario dalla configurazione esistente, usa `createResolvedApproverActionAuthAdapter` da `openclaw/plugin-sdk/approval-runtime` per limitare `/approve` nella stessa chat senza aggiungere logica core specifica per l'approvazione.
- Se un canale ha bisogno della consegna di approvazioni native, mantieni il codice del canale focalizzato sulla normalizzazione della destinazione più i fatti di trasporto/presentazione. Usa `createChannelExecApprovalProfile`, `createChannelNativeOriginTargetResolver`, `createChannelApproverDmTargetResolver` e `createApproverRestrictedNativeApprovalCapability` da `openclaw/plugin-sdk/approval-runtime`. Inserisci i fatti specifici del canale dietro `approvalCapability.nativeRuntime`, idealmente tramite `createChannelApprovalNativeRuntimeAdapter(...)` o `createLazyChannelApprovalNativeRuntimeAdapter(...)`, così il core può assemblare l'handler e gestire filtraggio delle richieste, routing, deduplica, scadenza, sottoscrizione al gateway e avvisi di instradamento altrove. `nativeRuntime` è suddiviso in alcune seam più piccole:
- `availability` — se l'account è configurato e se una richiesta deve essere gestita
- `presentation` — mappa il view model condiviso dell'approvazione in payload nativi pending/resolved/expired o azioni finali
- `transport` — prepara le destinazioni più invia/aggiorna/elimina i messaggi di approvazione nativi
- `interactions` — hook facoltativi di bind/unbind/clear-action per pulsanti o reaction native
- `observe` — hook facoltativi di diagnostica della consegna
- Se il canale necessita di oggetti posseduti dal runtime come un client, token, app Bolt o ricevitore Webhook, registrali tramite `openclaw/plugin-sdk/channel-runtime-context`. Il registro generico del contesto runtime consente al core di avviare handler guidati dalle capacità dallo stato di avvio del canale senza aggiungere glue wrapper specifico per le approvazioni.
- Ricorri a `createChannelApprovalHandler` o `createChannelNativeApprovalRuntime` di livello più basso solo quando la seam guidata dalle capacità non è ancora sufficientemente espressiva.
- I canali con approvazioni native devono instradare sia `accountId` sia `approvalKind` tramite questi helper. `accountId` mantiene la policy di approvazione multi-account limitata al giusto account bot, e `approvalKind` mantiene disponibile al canale il comportamento di approvazione exec vs plugin senza branch hardcoded nel core.
- Il core ora gestisce anche gli avvisi di reindirizzamento delle approvazioni. I Plugin di canale non dovrebbero inviare i propri messaggi di follow-up del tipo "l'approvazione è andata ai DM / a un altro canale" da `createChannelNativeApprovalRuntime`; invece, esponi un routing accurato origine + DM dell'approvatore tramite gli helper condivisi delle capacità di approvazione e lascia che il core aggreghi le consegne effettive prima di pubblicare qualsiasi avviso nella chat di avvio.
- Preserva end-to-end il tipo di id di approvazione consegnato. I client nativi non dovrebbero
  dedurre o riscrivere il routing dell'approvazione exec vs plugin dallo stato locale del canale.
- Tipi diversi di approvazione possono intenzionalmente esporre superfici native diverse.
  Esempi inclusi attuali:
  - Slack mantiene disponibile il routing nativo delle approvazioni sia per gli id exec sia per quelli plugin.
  - Matrix mantiene lo stesso routing nativo DM/canale e la stessa UX a reaction per le approvazioni exec
    e plugin, pur consentendo comunque che l'autenticazione differisca per tipo di approvazione.
- `createApproverRestrictedNativeApprovalAdapter` esiste ancora come wrapper di compatibilità, ma il nuovo codice dovrebbe preferire il builder di capacità ed esporre `approvalCapability` sul plugin.

Per gli entrypoint hot del canale, preferisci i sottopercorsi runtime più stretti quando ti serve soltanto
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
`openclaw/plugin-sdk/reply-chunking` quando non ti serve la superficie
ombrello più ampia.

Per la configurazione nello specifico:

- `openclaw/plugin-sdk/setup-runtime` copre gli helper di configurazione sicuri per il runtime:
  adapter di patch della configurazione sicuri per l'import (`createPatchedAccountSetupAdapter`,
  `createEnvPatchedAccountSetupAdapter`,
  `createSetupInputPresenceValidator`), output delle note di lookup,
  `promptResolvedAllowFrom`, `splitSetupEntries` e i builder
  del proxy di configurazione delegata
- `openclaw/plugin-sdk/setup-adapter-runtime` è la seam stretta dell'adapter
  env-aware per `createEnvPatchedAccountSetupAdapter`
- `openclaw/plugin-sdk/channel-setup` copre i builder di configurazione con installazione facoltativa
  più alcune primitive sicure per la configurazione:
  `createOptionalChannelSetupSurface`, `createOptionalChannelSetupAdapter`,

Se il tuo canale supporta configurazione o autenticazione guidate da env e i flussi generici di avvio/configurazione
devono conoscere quei nomi di env prima che il runtime venga caricato, dichiarali nel
manifest del plugin con `channelEnvVars`. Mantieni `envVars` del runtime del canale o
costanti locali solo per il testo rivolto agli operatori.
`createOptionalChannelSetupWizard`, `DEFAULT_ACCOUNT_ID`,
`createTopLevelChannelDmPolicy`, `setSetupChannelEnabled` e
`splitSetupEntries`

- usa la seam più ampia `openclaw/plugin-sdk/setup` solo quando ti servono anche
  gli helper condivisi di configurazione/config più pesanti, come
  `moveSingleAccountChannelSectionToDefaultAccount(...)`

Se il tuo canale vuole solo pubblicizzare "installa prima questo plugin" nelle
superfici di configurazione, preferisci `createOptionalChannelSetupSurface(...)`. L'
adapter/procedura guidata generato fallisce in modo chiuso sulle scritture di configurazione e sulla finalizzazione, e riutilizza
lo stesso messaggio di installazione richiesta in validazione, finalizzazione e testo
del link alla documentazione.

Per altri percorsi hot del canale, preferisci gli helper stretti rispetto alle superfici
legacy più ampie:

- `openclaw/plugin-sdk/account-core`,
  `openclaw/plugin-sdk/account-id`,
  `openclaw/plugin-sdk/account-resolution` e
  `openclaw/plugin-sdk/account-helpers` per la configurazione multi-account e
  il fallback dell'account predefinito
- `openclaw/plugin-sdk/inbound-envelope` e
  `openclaw/plugin-sdk/inbound-reply-dispatch` per il wiring di route/envelope in ingresso e
  record-and-dispatch
- `openclaw/plugin-sdk/messaging-targets` per il parsing/matching delle destinazioni
- `openclaw/plugin-sdk/outbound-media` e
  `openclaw/plugin-sdk/outbound-runtime` per il caricamento dei media più i
  delegati di identità/invio in uscita
- `openclaw/plugin-sdk/thread-bindings-runtime` per il ciclo di vita dei binding dei thread
  e la registrazione dell'adapter
- `openclaw/plugin-sdk/agent-media-payload` solo quando è ancora richiesto un layout legacy dei campi
  del payload agent/media
- `openclaw/plugin-sdk/telegram-command-config` per la normalizzazione dei comandi personalizzati di Telegram, la validazione di duplicati/conflitti e un contratto di configurazione dei comandi stabile in fallback

I canali solo auth di solito possono fermarsi al percorso predefinito: il core gestisce le approvazioni e il plugin espone solo le capacità outbound/auth. I canali con approvazioni native come Matrix, Slack, Telegram e i trasporti chat personalizzati dovrebbero usare gli helper nativi condivisi invece di implementare da soli il ciclo di vita delle approvazioni.

## Policy delle mention in ingresso

Mantieni la gestione delle mention in ingresso suddivisa in due livelli:

- raccolta delle evidenze gestita dal plugin
- valutazione della policy condivisa

Usa `openclaw/plugin-sdk/channel-inbound` per il livello condiviso.

Buoni casi d'uso per la logica locale del plugin:

- rilevamento di risposta al bot
- rilevamento di citazione del bot
- controlli di partecipazione al thread
- esclusioni di messaggi di servizio/sistema
- cache native della piattaforma necessarie per dimostrare la partecipazione del bot

Buoni casi d'uso per l'helper condiviso:

- `requireMention`
- risultato di mention esplicita
- allowlist di mention implicite
- bypass dei comandi
- decisione finale di skip

Flusso consigliato:

1. Calcola i fatti locali sulle mention.
2. Passa questi fatti a `resolveInboundMentionDecision({ facts, policy })`.
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

`api.runtime.channel.mentions` espone gli stessi helper condivisi per le mention per
i Plugin di canale inclusi che dipendono già dall'iniezione runtime:

- `buildMentionRegexes`
- `matchesMentionPatterns`
- `matchesMentionWithExplicit`
- `implicitMentionKindWhen`
- `resolveInboundMentionDecision`

I vecchi helper `resolveMentionGating*` restano in
`openclaw/plugin-sdk/channel-inbound` solo come export di compatibilità. Il nuovo codice
dovrebbe usare `resolveInboundMentionDecision({ facts, policy })`.

## Procedura dettagliata

<Steps>
  <a id="step-1-package-and-manifest"></a>
  <Step title="Pacchetto e manifest">
    Crea i file standard del plugin. Il campo `channel` in `package.json` è
    ciò che rende questo un Plugin di canale. Per la superficie completa dei
    metadati del pacchetto, vedi [Plugin Setup and Config](/it/plugins/sdk-setup#openclaw-channel):

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

  <Step title="Crea l'oggetto del Plugin di canale">
    L'interfaccia `ChannelPlugin` ha molte superfici adapter facoltative. Inizia con
    il minimo — `id` e `setup` — e aggiungi adapter secondo necessità.

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

    <Accordion title="Che cosa fa `createChatChannelPlugin` per te">
      Invece di implementare manualmente interfacce adapter di basso livello, passi
      opzioni dichiarative e il builder le compone:

      | Option | What it wires |
      | --- | --- |
      | `security.dm` | Scoped DM security resolver from config fields |
      | `pairing.text` | Text-based DM pairing flow with code exchange |
      | `threading` | Reply-to-mode resolver (fixed, account-scoped, or custom) |
      | `outbound.attachedResults` | Send functions that return result metadata (message IDs) |

      Puoi anche passare oggetti adapter grezzi invece delle opzioni dichiarative
      se hai bisogno del pieno controllo.
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

    Inserisci i descrittori CLI posseduti dal canale in `registerCliMetadata(...)` così OpenClaw
    può mostrarli nell'help root senza attivare il runtime completo del canale,
    mentre i normali caricamenti completi continueranno a recuperare gli stessi descrittori per la reale
    registrazione dei comandi. Mantieni `registerFull(...)` per il lavoro solo runtime.
    Se `registerFull(...)` registra metodi RPC del gateway, usa un
    prefisso specifico del plugin. Gli spazi dei nomi admin del core (`config.*`,
    `exec.approvals.*`, `wizard.*`, `update.*`) restano riservati e
    vengono sempre risolti in `operator.admin`.
    `defineChannelPluginEntry` gestisce automaticamente la suddivisione tra modalità di registrazione. Vedi
    [Entry Points](/it/plugins/sdk-entrypoints#definechannelpluginentry) per tutte le
    opzioni.

  </Step>

  <Step title="Aggiungi un setup entry">
    Crea `setup-entry.ts` per un caricamento leggero durante l'onboarding:

    ```typescript setup-entry.ts
    import { defineSetupPluginEntry } from "openclaw/plugin-sdk/channel-core";
    import { acmeChatPlugin } from "./src/channel.js";

    export default defineSetupPluginEntry(acmeChatPlugin);
    ```

    OpenClaw carica questo invece dell'entry completo quando il canale è disabilitato
    o non configurato. In questo modo evita di caricare codice runtime pesante durante i flussi di configurazione.
    Vedi [Setup and Config](/it/plugins/sdk-setup#setup-entry) per i dettagli.

    I canali workspace inclusi che suddividono gli export sicuri per la configurazione in moduli
    sidecar possono usare `defineBundledChannelSetupEntry(...)` da
    `openclaw/plugin-sdk/channel-entry-contract` quando hanno bisogno anche di un
    setter runtime esplicito in fase di configurazione.

  </Step>

  <Step title="Gestisci i messaggi in ingresso">
    Il tuo plugin deve ricevere i messaggi dalla piattaforma e inoltrarli a
    OpenClaw. Il pattern tipico è un Webhook che verifica la richiesta e
    la invia tramite l'handler inbound del tuo canale:

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
      La gestione dei messaggi in ingresso è specifica del canale. Ogni Plugin di canale gestisce
      la propria pipeline inbound. Guarda i Plugin di canale inclusi
      (per esempio il pacchetto plugin Microsoft Teams o Google Chat) per pattern reali.
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
    Modalità di risposta fisse, con scope account o personalizzate
  </Card>
  <Card title="Integrazione dello strumento message" icon="puzzle" href="/it/plugins/architecture#channel-plugins-and-the-shared-message-tool">
    describeMessageTool e individuazione delle azioni
  </Card>
  <Card title="Risoluzione della destinazione" icon="crosshair" href="/it/plugins/architecture#channel-target-resolution">
    inferTargetChatType, looksLikeId, resolveTarget
  </Card>
  <Card title="Helper runtime" icon="settings" href="/it/plugins/sdk-runtime">
    TTS, STT, media, subagent tramite api.runtime
  </Card>
</CardGroup>

<Note>
Alcune seam di helper inclusi esistono ancora per la manutenzione dei Plugin inclusi e
per la compatibilità. Non sono il pattern consigliato per i nuovi Plugin di canale;
preferisci i sottopercorsi generici channel/setup/reply/runtime dalla superficie comune
dell'SDK, a meno che tu non stia mantenendo direttamente quella famiglia di Plugin inclusi.
</Note>

## Passaggi successivi

- [Provider Plugins](/it/plugins/sdk-provider-plugins) — se il tuo plugin fornisce anche modelli
- [SDK Overview](/it/plugins/sdk-overview) — riferimento completo agli import dei sottopercorsi
- [SDK Testing](/it/plugins/sdk-testing) — utility di test e test di contratto
- [Plugin Manifest](/it/plugins/manifest) — schema completo del manifest
