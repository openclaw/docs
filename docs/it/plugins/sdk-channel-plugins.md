---
read_when:
    - Stai creando un nuovo plugin canale di messaggistica
    - Vuoi collegare OpenClaw a una piattaforma di messaggistica
    - Devi comprendere la superficie dell'adapter ChannelPlugin
sidebarTitle: Channel Plugins
summary: Guida passo passo alla creazione di un plugin canale di messaggistica per OpenClaw
title: Creazione di plugin canale
x-i18n:
    generated_at: "2026-04-07T08:15:16Z"
    model: gpt-5.4
    provider: openai
    source_hash: 0aab6cc835b292c62e33c52ad0c35f989fb1a5b225511e8bdc2972feb3c64f09
    source_path: plugins/sdk-channel-plugins.md
    workflow: 15
---

# Creazione di plugin canale

Questa guida illustra come creare un plugin canale che colleghi OpenClaw a una
piattaforma di messaggistica. Alla fine avrai un canale funzionante con sicurezza DM,
pairing, threading delle risposte e messaggistica in uscita.

<Info>
  Se non hai mai creato prima alcun plugin OpenClaw, leggi prima
  [Getting Started](/it/plugins/building-plugins) per la struttura di base del
  pacchetto e la configurazione del manifest.
</Info>

## Come funzionano i plugin canale

I plugin canale non hanno bisogno dei propri strumenti send/edit/react. OpenClaw mantiene un
unico strumento `message` condiviso nel core. Il tuo plugin gestisce:

- **Config** — risoluzione degli account e procedura guidata di configurazione
- **Security** — policy DM e allowlist
- **Pairing** — flusso di approvazione DM
- **Session grammar** — come gli ID conversazione specifici del provider vengono mappati alle chat di base, agli ID thread e ai fallback parent
- **Outbound** — invio di testo, media e sondaggi alla piattaforma
- **Threading** — come vengono organizzate in thread le risposte

Il core gestisce lo strumento messaggio condiviso, il wiring del prompt, la forma esterna della chiave di sessione,
la gestione generica di `:thread:` e il dispatch.

Se la tua piattaforma memorizza uno scope aggiuntivo dentro gli ID conversazione, mantieni quel parsing
nel plugin con `messaging.resolveSessionConversation(...)`. Questo è l'hook
canonico per mappare `rawId` all'ID conversazione di base, all'ID thread facoltativo,
a un `baseConversationId` esplicito e a qualsiasi `parentConversationCandidates`.
Quando restituisci `parentConversationCandidates`, mantienili ordinati dal
parent più ristretto a quello più ampio/conversazione di base.

I plugin inclusi che richiedono lo stesso parsing prima che il registro dei canali venga avviato
possono anche esporre un file `session-key-api.ts` di livello superiore con una
export `resolveSessionConversation(...)` corrispondente. Il core usa questa superficie
sicura per il bootstrap solo quando il registro runtime dei plugin non è ancora disponibile.

`messaging.resolveParentConversationCandidates(...)` resta disponibile come
fallback legacy di compatibilità quando un plugin ha bisogno solo di fallback parent
oltre all'ID generico/raw. Se esistono entrambi gli hook, il core usa prima
`resolveSessionConversation(...).parentConversationCandidates` e ricade su
`resolveParentConversationCandidates(...)` solo quando l'hook canonico li
omette.

## Approvazioni e capacità del canale

La maggior parte dei plugin canale non richiede codice specifico per le approvazioni.

- Il core gestisce `/approve` nella stessa chat, i payload condivisi dei pulsanti di approvazione e la consegna generica di fallback.
- Preferisci un singolo oggetto `approvalCapability` nel plugin canale quando il canale richiede comportamento specifico per le approvazioni.
- `approvalCapability.authorizeActorAction` e `approvalCapability.getActionAvailabilityState` sono la seam canonica di autenticazione delle approvazioni.
- Se il tuo canale espone approvazioni exec native, implementa `approvalCapability.getActionAvailabilityState` anche quando il trasporto nativo si trova interamente sotto `approvalCapability.native`. Il core usa quell'hook di disponibilità per distinguere `enabled` da `disabled`, decidere se il canale di avvio supporta approvazioni native e includere il canale nella guida di fallback per client nativi.
- Usa `outbound.shouldSuppressLocalPayloadPrompt` o `outbound.beforeDeliverPayload` per comportamenti del ciclo di vita del payload specifici del canale, come nascondere prompt locali di approvazione duplicati o inviare indicatori di digitazione prima della consegna.
- Usa `approvalCapability.delivery` solo per instradamento nativo delle approvazioni o soppressione del fallback.
- Usa `approvalCapability.render` solo quando un canale ha realmente bisogno di payload di approvazione personalizzati invece del renderer condiviso.
- Usa `approvalCapability.describeExecApprovalSetup` quando il canale vuole che la risposta del percorso disabilitato spieghi gli esatti controlli di configurazione necessari per abilitare le approvazioni exec native. L'hook riceve `{ channel, channelLabel, accountId }`; i canali con account con nome dovrebbero renderizzare percorsi con ambito account come `channels.<channel>.accounts.<id>.execApprovals.*` invece dei default di livello superiore.
- Se un canale può dedurre identità DM stabili simili al proprietario dalla configurazione esistente, usa `createResolvedApproverActionAuthAdapter` da `openclaw/plugin-sdk/approval-runtime` per limitare `/approve` nella stessa chat senza aggiungere logica specifica per le approvazioni nel core.
- Se un canale richiede consegna nativa delle approvazioni, mantieni il codice del canale focalizzato sulla normalizzazione delle destinazioni e sugli hook di trasporto. Usa `createChannelExecApprovalProfile`, `createChannelNativeOriginTargetResolver`, `createChannelApproverDmTargetResolver`, `createApproverRestrictedNativeApprovalCapability` e `createChannelNativeApprovalRuntime` da `openclaw/plugin-sdk/approval-runtime` così il core gestisce filtraggio delle richieste, instradamento, deduplica, scadenza e sottoscrizione del gateway.
- I canali di approvazione nativi devono instradare sia `accountId` sia `approvalKind` tramite quegli helper. `accountId` mantiene la policy di approvazione multi-account nell'ambito dell'account bot corretto, e `approvalKind` mantiene disponibile al canale il comportamento exec rispetto a quello delle approvazioni plugin senza branch codificati nel core.
- Preserva da un capo all'altro il tipo di ID di approvazione consegnato. I client nativi non devono
  dedurre o riscrivere l'instradamento exec rispetto a quello delle approvazioni plugin dallo stato locale del canale.
- Tipi diversi di approvazione possono intenzionalmente esporre superfici native diverse.
  Esempi attuali inclusi:
  - Slack mantiene disponibile l'instradamento nativo delle approvazioni sia per ID exec sia per ID plugin.
  - Matrix mantiene l'instradamento nativo DM/canale solo per le approvazioni exec e lascia
    le approvazioni plugin sul percorso condiviso `/approve` nella stessa chat.
- `createApproverRestrictedNativeApprovalAdapter` esiste ancora come wrapper di compatibilità, ma il nuovo codice dovrebbe preferire il builder di capability ed esporre `approvalCapability` nel plugin.

Per entrypoint dei canali ad accesso frequente, preferisci i sotto-percorsi runtime più ristretti quando ti serve solo
una parte di quella famiglia:

- `openclaw/plugin-sdk/approval-auth-runtime`
- `openclaw/plugin-sdk/approval-client-runtime`
- `openclaw/plugin-sdk/approval-delivery-runtime`
- `openclaw/plugin-sdk/approval-native-runtime`
- `openclaw/plugin-sdk/approval-reply-runtime`

Allo stesso modo, preferisci `openclaw/plugin-sdk/setup-runtime`,
`openclaw/plugin-sdk/setup-adapter-runtime`,
`openclaw/plugin-sdk/reply-runtime`,
`openclaw/plugin-sdk/reply-dispatch-runtime`,
`openclaw/plugin-sdk/reply-reference` e
`openclaw/plugin-sdk/reply-chunking` quando non ti serve la più ampia
superficie ombrello.

In particolare per la configurazione iniziale:

- `openclaw/plugin-sdk/setup-runtime` copre gli helper di configurazione iniziale sicuri a runtime:
  adapter di patch di configurazione sicuri all'import (`createPatchedAccountSetupAdapter`,
  `createEnvPatchedAccountSetupAdapter`,
  `createSetupInputPresenceValidator`), output di note di lookup,
  `promptResolvedAllowFrom`, `splitSetupEntries` e i builder
  di proxy di configurazione iniziale delegata
- `openclaw/plugin-sdk/setup-adapter-runtime` è la seam adapter ristretta consapevole dell'env
  per `createEnvPatchedAccountSetupAdapter`
- `openclaw/plugin-sdk/channel-setup` copre i builder di configurazione iniziale
  con installazione opzionale più alcune primitive sicure per la configurazione:
  `createOptionalChannelSetupSurface`, `createOptionalChannelSetupAdapter`,

Se il tuo canale supporta configurazione iniziale o autenticazione guidate da env e i flussi generici di avvio/configurazione
devono conoscere quei nomi env prima del caricamento runtime, dichiarali nel
manifest del plugin con `channelEnvVars`. Mantieni `envVars` runtime del canale o le costanti locali
solo per il testo rivolto agli operatori.
`createOptionalChannelSetupWizard`, `DEFAULT_ACCOUNT_ID`,
`createTopLevelChannelDmPolicy`, `setSetupChannelEnabled` e
`splitSetupEntries`

- usa la seam più ampia `openclaw/plugin-sdk/setup` solo quando ti servono anche gli
  helper condivisi di configurazione/setup più pesanti come
  `moveSingleAccountChannelSectionToDefaultAccount(...)`

Se il tuo canale vuole solo pubblicizzare "installa prima questo plugin" nelle superfici di configurazione iniziale,
preferisci `createOptionalChannelSetupSurface(...)`. L'adapter/procedura guidata generato fallisce in chiusura
sulle scritture di configurazione e sulla finalizzazione, e riutilizza
lo stesso messaggio di installazione richiesta tra validazione, finalizzazione e testo
con link alla documentazione.

Per altri percorsi canale ad accesso frequente, preferisci gli helper ristretti invece delle
superfici legacy più ampie:

- `openclaw/plugin-sdk/account-core`,
  `openclaw/plugin-sdk/account-id`,
  `openclaw/plugin-sdk/account-resolution` e
  `openclaw/plugin-sdk/account-helpers` per configurazione multi-account e
  fallback dell'account predefinito
- `openclaw/plugin-sdk/inbound-envelope` e
  `openclaw/plugin-sdk/inbound-reply-dispatch` per route/envelope in ingresso e
  wiring di registrazione e dispatch
- `openclaw/plugin-sdk/messaging-targets` per parsing/corrispondenza delle destinazioni
- `openclaw/plugin-sdk/outbound-media` e
  `openclaw/plugin-sdk/outbound-runtime` per caricamento media più delegate
  di identità/invio in uscita
- `openclaw/plugin-sdk/thread-bindings-runtime` per ciclo di vita dei binding thread
  e registrazione dell'adapter
- `openclaw/plugin-sdk/agent-media-payload` solo quando è ancora richiesto
  un layout legacy dei campi di payload agent/media
- `openclaw/plugin-sdk/telegram-command-config` per normalizzazione di comandi personalizzati Telegram,
  validazione di duplicati/conflitti e un contratto di configurazione dei comandi
  stabile rispetto al fallback

I canali solo-auth possono di solito fermarsi al percorso predefinito: il core gestisce le approvazioni e il plugin espone solo capability outbound/auth. I canali con approvazioni native come Matrix, Slack, Telegram e trasporti chat personalizzati dovrebbero usare gli helper nativi condivisi invece di implementare da soli il ciclo di vita delle approvazioni.

## Policy di menzione in ingresso

Mantieni la gestione delle menzioni in ingresso suddivisa in due livelli:

- raccolta delle evidenze gestita dal plugin
- valutazione della policy condivisa

Usa `openclaw/plugin-sdk/channel-inbound` per il livello condiviso.

Casi appropriati per la logica locale del plugin:

- rilevamento di risposta al bot
- rilevamento di citazione del bot
- controlli di partecipazione al thread
- esclusioni di messaggi di servizio/sistema
- cache native della piattaforma necessarie per dimostrare la partecipazione del bot

Casi appropriati per l'helper condiviso:

- `requireMention`
- risultato di menzione esplicita
- allowlist di menzione implicita
- bypass del comando
- decisione finale di skip

Flusso preferito:

1. Calcola i fatti locali della menzione.
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
i plugin canale inclusi che già dipendono dall'iniezione runtime:

- `buildMentionRegexes`
- `matchesMentionPatterns`
- `matchesMentionWithExplicit`
- `implicitMentionKindWhen`
- `resolveInboundMentionDecision`

I vecchi helper `resolveMentionGating*` restano su
`openclaw/plugin-sdk/channel-inbound` solo come export di compatibilità. Il nuovo codice
dovrebbe usare `resolveInboundMentionDecision({ facts, policy })`.

## Procedura guidata

<Steps>
  <a id="step-1-package-and-manifest"></a>
  <Step title="Pacchetto e manifest">
    Crea i file standard del plugin. Il campo `channel` in `package.json` è
    ciò che rende questo un plugin canale. Per la superficie completa dei metadati del pacchetto,
    vedi [Plugin Setup and Config](/it/plugins/sdk-setup#openclawchannel):

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
      "description": "Plugin canale Acme Chat",
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

  <Step title="Crea l'oggetto plugin canale">
    L'interfaccia `ChannelPlugin` ha molte superfici adapter facoltative. Parti dal
    minimo indispensabile — `id` e `setup` — e aggiungi adapter quando ti servono.

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
      Invece di implementare manualmente interfacce adapter di basso livello,
      passi opzioni dichiarative e il builder le compone:

      | Opzione | Cosa collega |
      | --- | --- |
      | `security.dm` | Resolver di sicurezza DM con ambito dalla configurazione |
      | `pairing.text` | Flusso di pairing DM basato su testo con scambio di codice |
      | `threading` | Resolver della modalità di risposta (fissa, con ambito account o personalizzata) |
      | `outbound.attachedResults` | Funzioni di invio che restituiscono metadati del risultato (ID messaggio) |

      Puoi anche passare oggetti adapter grezzi invece delle opzioni dichiarative
      se ti serve il pieno controllo.
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

    Inserisci i descrittori CLI gestiti dal canale in `registerCliMetadata(...)` così OpenClaw
    può mostrarli nell'help root senza attivare il runtime completo del canale,
    mentre i normali caricamenti completi continuano a raccogliere gli stessi descrittori per la registrazione
    reale dei comandi. Mantieni `registerFull(...)` per il lavoro solo runtime.
    Se `registerFull(...)` registra metodi RPC del gateway, usa un prefisso
    specifico del plugin. I namespace admin del core (`config.*`,
    `exec.approvals.*`, `wizard.*`, `update.*`) restano riservati e si
    risolvono sempre in `operator.admin`.
    `defineChannelPluginEntry` gestisce automaticamente la separazione delle modalità di registrazione. Vedi
    [Entry Points](/it/plugins/sdk-entrypoints#definechannelpluginentry) per tutte le
    opzioni.

  </Step>

  <Step title="Aggiungi una setup entry">
    Crea `setup-entry.ts` per un caricamento leggero durante l'onboarding:

    ```typescript setup-entry.ts
    import { defineSetupPluginEntry } from "openclaw/plugin-sdk/channel-core";
    import { acmeChatPlugin } from "./src/channel.js";

    export default defineSetupPluginEntry(acmeChatPlugin);
    ```

    OpenClaw carica questo invece della entry completa quando il canale è disabilitato
    o non configurato. Evita di trascinare codice runtime pesante durante i flussi di configurazione iniziale.
    Vedi [Setup and Config](/it/plugins/sdk-setup#setup-entry) per i dettagli.

  </Step>

  <Step title="Gestisci i messaggi in ingresso">
    Il tuo plugin deve ricevere messaggi dalla piattaforma e inoltrarli a
    OpenClaw. Il modello tipico è un webhook che verifica la richiesta e
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
      La gestione dei messaggi in ingresso è specifica del canale. Ogni plugin canale gestisce
      la propria pipeline inbound. Guarda i plugin canale inclusi
      (ad esempio il pacchetto plugin Microsoft Teams o Google Chat) per pattern reali.
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
├── api.ts                    # export pubblici (facoltativo)
├── runtime-api.ts            # export runtime interni (facoltativo)
└── src/
    ├── channel.ts            # ChannelPlugin tramite createChatChannelPlugin
    ├── channel.test.ts       # Test
    ├── client.ts             # Client API della piattaforma
    └── runtime.ts            # Store runtime (se necessario)
```

## Argomenti avanzati

<CardGroup cols={2}>
  <Card title="Opzioni di threading" icon="git-branch" href="/it/plugins/sdk-entrypoints#registration-mode">
    Modalità di risposta fisse, con ambito account o personalizzate
  </Card>
  <Card title="Integrazione dello strumento messaggio" icon="puzzle" href="/it/plugins/architecture#channel-plugins-and-the-shared-message-tool">
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
Esistono ancora alcune seam helper incluse per manutenzione e
compatibilità dei plugin inclusi. Non sono il pattern consigliato per i nuovi plugin canale;
preferisci i sotto-percorsi generici channel/setup/reply/runtime dalla superficie SDK
comune, a meno che tu non stia mantenendo direttamente quella famiglia di plugin inclusi.
</Note>

## Passaggi successivi

- [Provider Plugins](/it/plugins/sdk-provider-plugins) — se il tuo plugin fornisce anche modelli
- [SDK Overview](/it/plugins/sdk-overview) — riferimento completo agli import dei sotto-percorsi
- [SDK Testing](/it/plugins/sdk-testing) — utilità di test e test di contratto
- [Plugin Manifest](/it/plugins/manifest) — schema completo del manifest
