---
read_when:
    - Stai creando un nuovo plugin di canale di messaggistica
    - Vuoi collegare OpenClaw a una piattaforma di messaggistica
    - Devi comprendere la superficie dell'adattatore ChannelPlugin
sidebarTitle: Channel Plugins
summary: Guida passo passo per creare un plugin di canale di messaggistica per OpenClaw
title: Creare plugin di canale
x-i18n:
    generated_at: "2026-04-21T08:25:50Z"
    model: gpt-5.4
    provider: openai
    source_hash: 569394aeefa0231ae3157a13406f91c97fe7eeff2b62df0d35a893f1ad4d5d05
    source_path: plugins/sdk-channel-plugins.md
    workflow: 15
---

# Creare plugin di canale

Questa guida illustra come creare un plugin di canale che collega OpenClaw a una
piattaforma di messaggistica. Alla fine avrai un canale funzionante con sicurezza DM,
pairing, threading delle risposte e messaggistica in uscita.

<Info>
  Se non hai mai creato prima alcun plugin OpenClaw, leggi prima
  [Getting Started](/it/plugins/building-plugins) per la struttura di base del pacchetto
  e la configurazione del manifest.
</Info>

## Come funzionano i plugin di canale

I plugin di canale non hanno bisogno di propri strumenti send/edit/react. OpenClaw mantiene un unico
strumento `message` condiviso nel core. Il tuo plugin possiede:

- **Config** — risoluzione dell'account e procedura guidata di configurazione
- **Security** — policy DM e allowlist
- **Pairing** — flusso di approvazione DM
- **Session grammar** — come gli id di conversazione specifici del provider vengono mappati a chat di base, id di thread e fallback del parent
- **Outbound** — invio di testo, media e sondaggi alla piattaforma
- **Threading** — come vengono raggruppate le risposte

Il core possiede lo strumento message condiviso, il wiring dei prompt, la forma esterna della session-key,
la contabilità generica `:thread:` e il dispatch.

Se il tuo canale aggiunge parametri dello strumento message che trasportano sorgenti media, esponi questi
nomi di parametro tramite `describeMessageTool(...).mediaSourceParams`. Il core usa
questo elenco esplicito per la normalizzazione dei percorsi sandbox e la policy
di accesso ai media in uscita, così i plugin non hanno bisogno di casi speciali nel core condiviso per parametri
specifici del provider come avatar, allegati o immagini di copertina.
Preferisci restituire una mappa indicizzata per azione come
`{ "set-profile": ["avatarUrl", "avatarPath"] }` così azioni non correlate non
ereditano gli argomenti media di un'altra azione. Un array piatto continua comunque a funzionare per parametri
che sono intenzionalmente condivisi da ogni azione esposta.

Se la tua piattaforma memorizza scope extra negli id di conversazione, mantieni quel parsing
nel plugin con `messaging.resolveSessionConversation(...)`. Questo è l'hook
canonico per mappare `rawId` all'id della conversazione base, all'id di thread facoltativo,
a `baseConversationId` esplicito e a eventuali `parentConversationCandidates`.
Quando restituisci `parentConversationCandidates`, mantienili ordinati dal
parent più stretto a quello più ampio/conversazione base.

I plugin inclusi che necessitano dello stesso parsing prima che il registro dei canali venga avviato
possono anche esporre un file `session-key-api.ts` di primo livello con un export
`resolveSessionConversation(...)` corrispondente. Il core usa questa superficie sicura in fase di bootstrap
solo quando il registro runtime dei plugin non è ancora disponibile.

`messaging.resolveParentConversationCandidates(...)` resta disponibile come fallback
compatibile legacy quando un plugin ha bisogno solo di fallback parent sopra l'id generico/raw.
Se esistono entrambi gli hook, il core usa prima
`resolveSessionConversation(...).parentConversationCandidates` e ricade su
`resolveParentConversationCandidates(...)` solo quando l'hook canonico
li omette.

## Approvazioni e capacità del canale

La maggior parte dei plugin di canale non necessita di codice specifico per le approvazioni.

- Il core possiede `/approve` nella stessa chat, i payload condivisi dei pulsanti di approvazione e il recapito generico di fallback.
- Preferisci un singolo oggetto `approvalCapability` nel plugin di canale quando il canale richiede un comportamento specifico per le approvazioni.
- `ChannelPlugin.approvals` è stato rimosso. Inserisci dati di recapito/approvazione nativa/render/auth in `approvalCapability`.
- `plugin.auth` è solo per login/logout; il core non legge più da quell'oggetto hook auth di approvazione.
- `approvalCapability.authorizeActorAction` e `approvalCapability.getActionAvailabilityState` sono la seam canonica per l'auth delle approvazioni.
- Usa `approvalCapability.getActionAvailabilityState` per la disponibilità dell'auth di approvazione nella stessa chat.
- Se il tuo canale espone approvazioni native di exec, usa `approvalCapability.getExecInitiatingSurfaceState` per lo stato della superficie di avvio/client nativo quando differisce dall'auth di approvazione nella stessa chat. Il core usa questo hook specifico di exec per distinguere `enabled` da `disabled`, decidere se il canale di avvio supporta approvazioni native di exec e includere il canale nelle indicazioni di fallback del client nativo. `createApproverRestrictedNativeApprovalCapability(...)` lo compila per il caso comune.
- Usa `outbound.shouldSuppressLocalPayloadPrompt` o `outbound.beforeDeliverPayload` per comportamenti specifici del canale nel lifecycle del payload, come nascondere prompt locali di approvazione duplicati o inviare indicatori di digitazione prima del recapito.
- Usa `approvalCapability.delivery` solo per routing di approvazione nativa o soppressione del fallback.
- Usa `approvalCapability.nativeRuntime` per dati di approvazione nativa di proprietà del canale. Mantienilo lazy negli entrypoint caldi del canale con `createLazyChannelApprovalNativeRuntimeAdapter(...)`, che può importare il modulo runtime su richiesta permettendo comunque al core di assemblare il lifecycle di approvazione.
- Usa `approvalCapability.render` solo quando un canale ha davvero bisogno di payload di approvazione personalizzati invece del renderer condiviso.
- Usa `approvalCapability.describeExecApprovalSetup` quando il canale vuole che la risposta nel percorso disabilitato spieghi le esatte chiavi di configurazione necessarie per abilitare le approvazioni native di exec. L'hook riceve `{ channel, channelLabel, accountId }`; i canali con account nominati dovrebbero rendere percorsi scoped all'account come `channels.<channel>.accounts.<id>.execApprovals.*` invece dei default di primo livello.
- Se un canale può inferire identità DM stabili simili a owner dalla configurazione esistente, usa `createResolvedApproverActionAuthAdapter` da `openclaw/plugin-sdk/approval-runtime` per limitare `/approve` nella stessa chat senza aggiungere logica core specifica per le approvazioni.
- Se un canale necessita di recapito nativo delle approvazioni, mantieni il codice del canale focalizzato su normalizzazione del target più dati di trasporto/presentazione. Usa `createChannelExecApprovalProfile`, `createChannelNativeOriginTargetResolver`, `createChannelApproverDmTargetResolver` e `createApproverRestrictedNativeApprovalCapability` da `openclaw/plugin-sdk/approval-runtime`. Metti i dati specifici del canale dietro `approvalCapability.nativeRuntime`, idealmente tramite `createChannelApprovalNativeRuntimeAdapter(...)` o `createLazyChannelApprovalNativeRuntimeAdapter(...)`, così il core può assemblare l'handler e possedere filtro delle richieste, routing, deduplica, scadenza, sottoscrizione gateway e avvisi di inoltro altrove. `nativeRuntime` è suddiviso in alcune seam più piccole:
- `availability` — se l'account è configurato e se una richiesta deve essere gestita
- `presentation` — mappa il view model condiviso delle approvazioni in payload nativi pending/resolved/expired o azioni finali
- `transport` — prepara i target più invio/aggiornamento/eliminazione dei messaggi nativi di approvazione
- `interactions` — hook facoltativi bind/unbind/clear-action per pulsanti o reazioni native
- `observe` — hook facoltativi per diagnostica del recapito
- Se il canale richiede oggetti posseduti a runtime come un client, token, app Bolt o ricevitore Webhook, registrali tramite `openclaw/plugin-sdk/channel-runtime-context`. Il registro generico runtime-context consente al core di avviare handler guidati dalle capacità a partire dallo stato di avvio del canale senza aggiungere colla wrapper specifica per le approvazioni.
- Ricorri ai livelli più bassi `createChannelApprovalHandler` o `createChannelNativeApprovalRuntime` solo quando la seam guidata dalle capacità non è ancora sufficientemente espressiva.
- I canali di approvazione nativa devono instradare sia `accountId` sia `approvalKind` tramite questi helper. `accountId` mantiene la policy di approvazione multi-account limitata al corretto account bot, e `approvalKind` mantiene disponibile al canale il comportamento di approvazione exec vs plugin senza rami hardcoded nel core.
- Il core ora possiede anche gli avvisi di reroute delle approvazioni. I plugin di canale non dovrebbero inviare propri messaggi di follow-up del tipo "l'approvazione è andata nei DM / in un altro canale" da `createChannelNativeApprovalRuntime`; invece, esponi routing accurato origin + DM dell'approvatore tramite gli helper condivisi di approval capability e lascia che il core aggreghi i recapiti effettivi prima di pubblicare eventuali avvisi di ritorno nella chat di avvio.
- Preserva end-to-end il tipo di id di approvazione consegnato. I client nativi non dovrebbero
  dedurre o riscrivere il routing di approvazione exec vs plugin dallo stato locale del canale.
- Diversi tipi di approvazione possono intenzionalmente esporre diverse superfici native.
  Esempi inclusi attuali:
  - Slack mantiene disponibile il routing nativo delle approvazioni sia per id exec sia plugin.
  - Matrix mantiene lo stesso routing DM/canale nativo e la stessa UX a reazioni per approvazioni exec
    e plugin, pur consentendo che l'auth differisca in base al tipo di approvazione.
- `createApproverRestrictedNativeApprovalAdapter` esiste ancora come wrapper di compatibilità, ma il nuovo codice dovrebbe preferire il builder di capability ed esporre `approvalCapability` nel plugin.

Per entrypoint caldi del canale, preferisci i sotto-percorsi runtime più stretti quando ti serve solo
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
`openclaw/plugin-sdk/reply-chunking` quando non ti serve la superficie ombrello più ampia.

Per la configurazione in particolare:

- `openclaw/plugin-sdk/setup-runtime` copre gli helper di setup sicuri a runtime:
  adapter di patch di setup import-safe (`createPatchedAccountSetupAdapter`,
  `createEnvPatchedAccountSetupAdapter`,
  `createSetupInputPresenceValidator`), output di note di lookup,
  `promptResolvedAllowFrom`, `splitSetupEntries` e i builder
  delegated setup-proxy
- `openclaw/plugin-sdk/setup-adapter-runtime` è la seam adapter ristretta, sensibile all'env,
  per `createEnvPatchedAccountSetupAdapter`
- `openclaw/plugin-sdk/channel-setup` copre i builder di setup per installazione opzionale
  più alcuni primitive safe per il setup:
  `createOptionalChannelSetupSurface`, `createOptionalChannelSetupAdapter`,

Se il tuo canale supporta setup o auth guidati da env e i flussi generici di startup/config
devono conoscere quei nomi env prima del caricamento runtime, dichiarali nel
manifest del plugin con `channelEnvVars`. Mantieni `envVars` del runtime del canale o costanti locali
solo per il testo rivolto agli operatori.
`createOptionalChannelSetupWizard`, `DEFAULT_ACCOUNT_ID`,
`createTopLevelChannelDmPolicy`, `setSetupChannelEnabled` e
`splitSetupEntries`

- usa la seam più ampia `openclaw/plugin-sdk/setup` solo quando hai anche bisogno degli helper
  condivisi di setup/config più pesanti come
  `moveSingleAccountChannelSectionToDefaultAccount(...)`

Se il tuo canale vuole solo pubblicizzare "installa prima questo plugin" nelle
superfici di setup, preferisci `createOptionalChannelSetupSurface(...)`. L'adapter/la procedura guidata generati falliscono in modo chiuso sulle scritture di configurazione e sulla finalizzazione, e riusano
lo stesso messaggio di installazione richiesta in validazione, finalize e testo del link alla documentazione.

Per altri percorsi caldi del canale, preferisci gli helper ristretti alle superfici legacy più ampie:

- `openclaw/plugin-sdk/account-core`,
  `openclaw/plugin-sdk/account-id`,
  `openclaw/plugin-sdk/account-resolution` e
  `openclaw/plugin-sdk/account-helpers` per configurazione multi-account e
  fallback all'account predefinito
- `openclaw/plugin-sdk/inbound-envelope` e
  `openclaw/plugin-sdk/inbound-reply-dispatch` per route/envelope inbound e
  wiring di record-and-dispatch
- `openclaw/plugin-sdk/messaging-targets` per parsing/matching dei target
- `openclaw/plugin-sdk/outbound-media` e
  `openclaw/plugin-sdk/outbound-runtime` per caricamento media più delegati
  identity/send outbound e pianificazione del payload
- `openclaw/plugin-sdk/thread-bindings-runtime` per lifecycle dei thread-binding
  e registrazione dell'adapter
- `openclaw/plugin-sdk/agent-media-payload` solo quando è ancora richiesto un layout di campo legacy
  agent/media payload
- `openclaw/plugin-sdk/telegram-command-config` per normalizzazione dei comandi personalizzati di Telegram, validazione di duplicati/conflitti e un contratto di configurazione dei comandi stabile rispetto ai fallback

I canali solo auth di solito possono fermarsi al percorso predefinito: il core gestisce le approvazioni e il plugin espone solo le capacità outbound/auth. I canali con approvazione nativa come Matrix, Slack, Telegram e trasporti chat personalizzati dovrebbero usare gli helper nativi condivisi invece di implementare da soli il lifecycle delle approvazioni.

## Policy delle menzioni in entrata

Mantieni la gestione delle menzioni in entrata suddivisa in due livelli:

- raccolta delle evidenze di proprietà del plugin
- valutazione della policy condivisa

Usa `openclaw/plugin-sdk/channel-mention-gating` per le decisioni sulla policy delle menzioni.
Usa `openclaw/plugin-sdk/channel-inbound` solo quando ti serve il barrel
più ampio degli helper inbound.

Buoni casi per la logica locale del plugin:

- rilevamento di reply-to-bot
- rilevamento di quoted-bot
- controlli di partecipazione al thread
- esclusioni di messaggi di servizio/sistema
- cache native della piattaforma necessarie per dimostrare la partecipazione del bot

Buoni casi per l'helper condiviso:

- `requireMention`
- risultato esplicito della menzione
- allowlist di menzioni implicite
- bypass dei comandi
- decisione finale di skip

Flusso consigliato:

1. Calcola i dati locali sulle menzioni.
2. Passa questi dati in `resolveInboundMentionDecision({ facts, policy })`.
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

I vecchi helper `resolveMentionGating*` restano su
`openclaw/plugin-sdk/channel-inbound` solo come export di compatibilità. Il nuovo codice
dovrebbe usare `resolveInboundMentionDecision({ facts, policy })`.

## Procedura dettagliata

<Steps>
  <a id="step-1-package-and-manifest"></a>
  <Step title="Pacchetto e manifest">
    Crea i file standard del plugin. Il campo `channel` in `package.json` è
    ciò che rende questo un plugin di canale. Per la superficie completa dei metadati del pacchetto,
    vedi [Setup e Config del plugin](/it/plugins/sdk-setup#openclaw-channel):

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
          "blurb": "Collega OpenClaw ad Acme Chat."
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
      "description": "Plugin di canale Acme Chat",
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
    L'interfaccia `ChannelPlugin` ha molte superfici adapter facoltative. Inizia con
    il minimo — `id` e `setup` — e aggiungi adapter man mano che ti servono.

    Crea `src/channel.ts`:

    ```typescript src/channel.ts
    import {
      createChatChannelPlugin,
      createChannelPluginBase,
    } from "openclaw/plugin-sdk/channel-core";
    import type { OpenClawConfig } from "openclaw/plugin-sdk/channel-core";
    import { acmeChatApi } from "./client.js"; // client API della tua piattaforma

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
          idLabel: "Nome utente Acme Chat",
          message: "Invia questo codice per verificare la tua identità:",
          notify: async ({ target, code }) => {
            await acmeChatApi.sendDm(target, `Pairing code: ${code}`);
          },
        },
      },

      // Threading: come vengono recapitate le risposte
      threading: { topLevelReplyToMode: "reply" },

      // Outbound: invia messaggi alla piattaforma
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
      | `security.dm` | Resolver di sicurezza DM con scope dalla configurazione |
      | `pairing.text` | Flusso di pairing DM basato su testo con scambio di codice |
      | `threading` | Resolver della modalità reply-to (fissa, con scope account o personalizzata) |
      | `outbound.attachedResults` | Funzioni di invio che restituiscono metadati del risultato (ID messaggio) |

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
      description: "Plugin di canale Acme Chat",
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

    Inserisci i descrittori CLI di proprietà del canale in `registerCliMetadata(...)` così OpenClaw
    può mostrarli nell'help root senza attivare il runtime completo del canale,
    mentre i normali caricamenti completi continueranno a raccogliere gli stessi descrittori per la vera registrazione
    dei comandi. Mantieni `registerFull(...)` per il lavoro solo runtime.
    Se `registerFull(...)` registra metodi RPC del gateway, usa un
    prefisso specifico del plugin. I namespace admin del core (`config.*`,
    `exec.approvals.*`, `wizard.*`, `update.*`) restano riservati e si
    risolvono sempre in `operator.admin`.
    `defineChannelPluginEntry` gestisce automaticamente la suddivisione per modalità di registrazione. Vedi
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

    OpenClaw carica questo invece dell'entry completa quando il canale è disabilitato
    o non configurato. Evita di trascinare codice runtime pesante durante i flussi di setup.
    Vedi [Setup e Config](/it/plugins/sdk-setup#setup-entry) per i dettagli.

    I canali workspace inclusi che suddividono gli export sicuri per il setup in moduli
    sidecar possono usare `defineBundledChannelSetupEntry(...)` da
    `openclaw/plugin-sdk/channel-entry-contract` quando hanno anche bisogno di un
    setter runtime esplicito al momento del setup.

  </Step>

  <Step title="Gestisci i messaggi in entrata">
    Il tuo plugin deve ricevere i messaggi dalla piattaforma e inoltrarli a
    OpenClaw. Il pattern tipico è un Webhook che verifica la richiesta e
    la instrada tramite l'handler inbound del tuo canale:

    ```typescript
    registerFull(api) {
      api.registerHttpRoute({
        path: "/acme-chat/webhook",
        auth: "plugin", // auth gestita dal plugin (verifica tu stesso le firme)
        handler: async (req, res) => {
          const event = parseWebhookPayload(req);

          // Il tuo handler inbound instrada il messaggio verso OpenClaw.
          // Il wiring esatto dipende dall'SDK della tua piattaforma —
          // vedi un esempio reale nel pacchetto plugin incluso Microsoft Teams o Google Chat.
          await handleAcmeChatInbound(api, event);

          res.statusCode = 200;
          res.end("ok");
          return true;
        },
      });
    }
    ```

    <Note>
      La gestione dei messaggi in entrata è specifica del canale. Ogni plugin di canale possiede
      la propria pipeline inbound. Guarda i plugin di canale inclusi
      (ad esempio il pacchetto plugin Microsoft Teams o Google Chat) per pattern reali.
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
    Modalità reply fisse, con scope account o personalizzate
  </Card>
  <Card title="Integrazione dello strumento message" icon="puzzle" href="/it/plugins/architecture#channel-plugins-and-the-shared-message-tool">
    describeMessageTool e individuazione delle azioni
  </Card>
  <Card title="Risoluzione del target" icon="crosshair" href="/it/plugins/architecture#channel-target-resolution">
    inferTargetChatType, looksLikeId, resolveTarget
  </Card>
  <Card title="Helper runtime" icon="settings" href="/it/plugins/sdk-runtime">
    TTS, STT, media, subagent tramite api.runtime
  </Card>
</CardGroup>

<Note>
Alcune seam helper incluse esistono ancora per manutenzione e
compatibilità dei plugin inclusi. Non sono il pattern consigliato per i nuovi plugin di canale;
preferisci i sotto-percorsi generici channel/setup/reply/runtime dalla superficie comune dell'SDK
a meno che tu non stia mantenendo direttamente quella famiglia di plugin inclusi.
</Note>

## Passaggi successivi

- [Plugin provider](/it/plugins/sdk-provider-plugins) — se il tuo plugin fornisce anche modelli
- [Panoramica SDK](/it/plugins/sdk-overview) — riferimento completo agli import dei sotto-percorsi
- [SDK Testing](/it/plugins/sdk-testing) — utility di test e test di contratto
- [Manifest del plugin](/it/plugins/manifest) — schema completo del manifest
