---
read_when:
    - Stai creando un nuovo plugin di canale di messaggistica
    - Vuoi collegare OpenClaw a una piattaforma di messaggistica
    - Hai bisogno di comprendere la superficie dell'adattatore ChannelPlugin
sidebarTitle: Channel Plugins
summary: Guida passo passo per creare un plugin di canale di messaggistica per OpenClaw
title: Creazione di plugin di canale
x-i18n:
    generated_at: "2026-04-05T14:00:09Z"
    model: gpt-5.4
    provider: openai
    source_hash: 68a6ad2c75549db8ce54f7e22ca9850d7ed68c5cd651c9bb41c9f73769f48aba
    source_path: plugins/sdk-channel-plugins.md
    workflow: 15
---

# Creazione di plugin di canale

Questa guida illustra come creare un plugin di canale che collega OpenClaw a una
piattaforma di messaggistica. Alla fine avrai un canale funzionante con sicurezza DM,
pairing, threading delle risposte e messaggistica in uscita.

<Info>
  Se non hai mai creato prima un plugin OpenClaw, leggi prima
  [Per iniziare](/plugins/building-plugins) per la struttura di base del pacchetto
  e la configurazione del manifest.
</Info>

## Come funzionano i plugin di canale

I plugin di canale non hanno bisogno di propri strumenti send/edit/react. OpenClaw mantiene un unico
strumento `message` condiviso nel core. Il tuo plugin gestisce:

- **Configurazione** — risoluzione degli account e procedura guidata di configurazione
- **Sicurezza** — policy DM e allowlist
- **Pairing** — flusso di approvazione DM
- **Grammatica della sessione** — come gli id di conversazione specifici del provider si mappano su chat di base, id thread e fallback parent
- **Uscita** — invio di testo, media e sondaggi alla piattaforma
- **Threading** — come vengono organizzate le risposte in thread

Il core gestisce lo strumento message condiviso, il wiring del prompt, la forma esterna della chiave di sessione,
la contabilità generica `:thread:` e il dispatch.

Se la tua piattaforma memorizza ambiti aggiuntivi all'interno degli id di conversazione, mantieni quel parsing
nel plugin con `messaging.resolveSessionConversation(...)`. Questo è l'hook canonico per mappare
`rawId` all'id di conversazione di base, all'id thread facoltativo, a `baseConversationId` esplicito
e a qualsiasi `parentConversationCandidates`.
Quando restituisci `parentConversationCandidates`, mantienili ordinati dal parent più ristretto alla conversazione di base/più ampia.

I plugin inclusi che necessitano dello stesso parsing prima dell'avvio del registro dei canali
possono anche esporre un file `session-key-api.ts` di primo livello con un export
`resolveSessionConversation(...)` corrispondente. Il core usa questa superficie sicura per il bootstrap
solo quando il registro dei plugin runtime non è ancora disponibile.

`messaging.resolveParentConversationCandidates(...)` resta disponibile come fallback di compatibilità legacy quando un plugin ha bisogno solo di fallback parent oltre all'id generico/raw. Se entrambi gli hook esistono, il core usa prima
`resolveSessionConversation(...).parentConversationCandidates` e ricorre a `resolveParentConversationCandidates(...)` solo quando l'hook canonico li omette.

## Approvazioni e capacità del canale

La maggior parte dei plugin di canale non richiede codice specifico per le approvazioni.

- Il core gestisce `/approve` nella stessa chat, i payload condivisi dei pulsanti di approvazione e la consegna generica di fallback.
- Preferisci un unico oggetto `approvalCapability` nel plugin di canale quando il canale ha bisogno di comportamento specifico per le approvazioni.
- `approvalCapability.authorizeActorAction` e `approvalCapability.getActionAvailabilityState` sono il seam canonico per l'autorizzazione delle approvazioni.
- Usa `outbound.shouldSuppressLocalPayloadPrompt` o `outbound.beforeDeliverPayload` per comportamenti del ciclo di vita del payload specifici del canale, come nascondere prompt di approvazione locali duplicati o inviare indicatori di digitazione prima della consegna.
- Usa `approvalCapability.delivery` solo per instradamento nativo delle approvazioni o soppressione del fallback.
- Usa `approvalCapability.render` solo quando un canale ha realmente bisogno di payload di approvazione personalizzati invece del renderer condiviso.
- Se un canale può dedurre identità DM stabili simili al proprietario dalla configurazione esistente, usa `createResolvedApproverActionAuthAdapter` da `openclaw/plugin-sdk/approval-runtime` per limitare `/approve` nella stessa chat senza aggiungere logica core specifica per le approvazioni.
- Se un canale ha bisogno della consegna nativa delle approvazioni, mantieni il codice del canale focalizzato sulla normalizzazione della destinazione e sugli hook di trasporto. Usa `createChannelExecApprovalProfile`, `createChannelNativeOriginTargetResolver`, `createChannelApproverDmTargetResolver`, `createApproverRestrictedNativeApprovalCapability` e `createChannelNativeApprovalRuntime` da `openclaw/plugin-sdk/approval-runtime` in modo che il core gestisca filtraggio delle richieste, instradamento, deduplica, scadenza e sottoscrizione al gateway.
- I canali con approvazione nativa devono instradare sia `accountId` sia `approvalKind` attraverso quegli helper. `accountId` mantiene l'ambito corretto della policy di approvazione multi-account per l'account bot giusto, e `approvalKind` mantiene disponibile al canale il comportamento di approvazione exec rispetto a plugin senza rami hardcoded nel core.
- Preserva end-to-end il tipo di id di approvazione consegnato. I client nativi non devono
  dedurre o riscrivere l'instradamento delle approvazioni exec rispetto a plugin dallo stato locale del canale.
- Tipi diversi di approvazione possono intenzionalmente esporre superfici native diverse.
  Esempi attuali inclusi:
  - Slack mantiene disponibile l'instradamento di approvazione nativa sia per id exec sia per id plugin.
  - Matrix mantiene l'instradamento DM/canale nativo solo per le approvazioni exec e lascia
    le approvazioni plugin sul percorso condiviso `/approve` nella stessa chat.
- `createApproverRestrictedNativeApprovalAdapter` esiste ancora come wrapper di compatibilità, ma il nuovo codice dovrebbe preferire il builder di capacità ed esporre `approvalCapability` nel plugin.

Per gli entrypoint hot del canale, preferisci i sottopercorsi runtime più stretti quando hai bisogno solo di una parte di quella famiglia:

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
`openclaw/plugin-sdk/reply-chunking` quando non hai bisogno della superficie ombrello più ampia.

Per la configurazione in particolare:

- `openclaw/plugin-sdk/setup-runtime` copre gli helper di configurazione sicuri per il runtime:
  adattatori di patch import-safe (`createPatchedAccountSetupAdapter`,
  `createEnvPatchedAccountSetupAdapter`,
  `createSetupInputPresenceValidator`), output delle note di lookup,
  `promptResolvedAllowFrom`, `splitSetupEntries` e i builder
  di setup-proxy delegati
- `openclaw/plugin-sdk/setup-adapter-runtime` è il seam stretto con consapevolezza dell'env
  per `createEnvPatchedAccountSetupAdapter`
- `openclaw/plugin-sdk/channel-setup` copre i builder di configurazione per installazione facoltativa
  più alcuni primitivi sicuri per la configurazione:
  `createOptionalChannelSetupSurface`, `createOptionalChannelSetupAdapter`,
  `createOptionalChannelSetupWizard`, `DEFAULT_ACCOUNT_ID`,
  `createTopLevelChannelDmPolicy`, `setSetupChannelEnabled` e
  `splitSetupEntries`
- usa il seam più ampio `openclaw/plugin-sdk/setup` solo quando ti servono anche
  gli helper condivisi più pesanti per setup/configurazione come
  `moveSingleAccountChannelSectionToDefaultAccount(...)`

Se il tuo canale vuole solo pubblicizzare "installa prima questo plugin" nelle superfici di configurazione,
preferisci `createOptionalChannelSetupSurface(...)`. L'adattatore/la procedura guidata generati falliscono in modo chiuso sulle scritture di configurazione e sulla finalizzazione e riutilizzano lo stesso messaggio di installazione richiesta tra convalida, finalize e testo del link alla documentazione.

Per altri percorsi hot del canale, preferisci gli helper stretti rispetto alle superfici legacy più ampie:

- `openclaw/plugin-sdk/account-core`,
  `openclaw/plugin-sdk/account-id`,
  `openclaw/plugin-sdk/account-resolution` e
  `openclaw/plugin-sdk/account-helpers` per configurazione multi-account e
  fallback dell'account predefinito
- `openclaw/plugin-sdk/inbound-envelope` e
  `openclaw/plugin-sdk/inbound-reply-dispatch` per route/envelope in ingresso e
  wiring di record-and-dispatch
- `openclaw/plugin-sdk/messaging-targets` per parsing/matching delle destinazioni
- `openclaw/plugin-sdk/outbound-media` e
  `openclaw/plugin-sdk/outbound-runtime` per caricamento dei media più delegati di identità/invio in uscita
- `openclaw/plugin-sdk/thread-bindings-runtime` per il ciclo di vita dei thread binding
  e la registrazione dell'adattatore
- `openclaw/plugin-sdk/agent-media-payload` solo quando è ancora richiesto un layout legacy dei campi del payload agent/media
- `openclaw/plugin-sdk/telegram-command-config` per normalizzazione dei comandi personalizzati di Telegram, convalida di duplicati/conflitti e contratto di configurazione dei comandi stabile rispetto al fallback

I canali solo auth di solito possono fermarsi al percorso predefinito: il core gestisce le approvazioni e il plugin espone soltanto capacità outbound/auth. I canali con approvazione nativa come Matrix, Slack, Telegram e i trasporti chat personalizzati dovrebbero usare gli helper nativi condivisi invece di creare da soli il proprio ciclo di vita delle approvazioni.

## Procedura guidata

<Steps>
  <a id="step-1-package-and-manifest"></a>
  <Step title="Pacchetto e manifest">
    Crea i file standard del plugin. Il campo `channel` in `package.json` è
    ciò che rende questo un plugin di canale. Per la superficie completa dei metadati di pacchetto,
    vedi [Configurazione e setup del plugin](/plugins/sdk-setup#openclawchannel):

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
    L'interfaccia `ChannelPlugin` ha molte superfici adattatore facoltative. Inizia con
    il minimo indispensabile — `id` e `setup` — e aggiungi adattatori secondo necessità.

    Crea `src/channel.ts`:

    ```typescript src/channel.ts
    import {
      createChatChannelPlugin,
      createChannelPluginBase,
    } from "openclaw/plugin-sdk/channel-core";
    import type { OpenClawConfig } from "openclaw/plugin-sdk/channel-core";
    import { acmeChatApi } from "./client.js"; // il client API della tua piattaforma

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

      // Threading: come vengono consegnate le risposte
      threading: { topLevelReplyToMode: "reply" },

      // Uscita: invia messaggi alla piattaforma
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
      | `security.dm` | Resolver di sicurezza DM con ambito definito dai campi di configurazione |
      | `pairing.text` | Flusso di pairing DM basato su testo con scambio di codice |
      | `threading` | Resolver della modalità reply-to (fissa, con ambito account o personalizzata) |
      | `outbound.attachedResults` | Funzioni di invio che restituiscono metadati del risultato (id messaggio) |

      Puoi anche passare oggetti adattatore grezzi invece delle opzioni dichiarative
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
    mentre i normali caricamenti completi continuano a rilevare gli stessi descrittori per la vera registrazione dei comandi. Mantieni `registerFull(...)` per il lavoro solo runtime.
    Se `registerFull(...)` registra metodi RPC del gateway, usa un
    prefisso specifico del plugin. I namespace admin core (`config.*`,
    `exec.approvals.*`, `wizard.*`, `update.*`) restano riservati e vengono sempre
    risolti in `operator.admin`.
    `defineChannelPluginEntry` gestisce automaticamente la suddivisione per modalità di registrazione. Vedi
    [Entry point](/plugins/sdk-entrypoints#definechannelpluginentry) per tutte le
    opzioni.

  </Step>

  <Step title="Aggiungi un'entry di setup">
    Crea `setup-entry.ts` per un caricamento leggero durante l'onboarding:

    ```typescript setup-entry.ts
    import { defineSetupPluginEntry } from "openclaw/plugin-sdk/channel-core";
    import { acmeChatPlugin } from "./src/channel.js";

    export default defineSetupPluginEntry(acmeChatPlugin);
    ```

    OpenClaw carica questo invece dell'entry completa quando il canale è disabilitato
    o non configurato. Evita di caricare codice runtime pesante durante i flussi di configurazione.
    Vedi [Setup e configurazione](/plugins/sdk-setup#setup-entry) per i dettagli.

  </Step>

  <Step title="Gestisci i messaggi in ingresso">
    Il tuo plugin deve ricevere i messaggi dalla piattaforma e inoltrarli a
    OpenClaw. Il modello tipico è un webhook che verifica la richiesta e
    la inoltra tramite l'handler inbound del tuo canale:

    ```typescript
    registerFull(api) {
      api.registerHttpRoute({
        path: "/acme-chat/webhook",
        auth: "plugin", // auth gestita dal plugin (verifica tu stesso le firme)
        handler: async (req, res) => {
          const event = parseWebhookPayload(req);

          // Il tuo handler inbound inoltra il messaggio a OpenClaw.
          // Il wiring esatto dipende dal tuo SDK della piattaforma —
          // vedi un esempio reale nel pacchetto plugin Microsoft Teams o Google Chat incluso.
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

      it("ispeziona l'account senza materializzare segreti", () => {
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

    Per gli helper di test condivisi, vedi [Testing](/plugins/sdk-testing).

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
  <Card title="Opzioni di threading" icon="git-branch" href="/plugins/sdk-entrypoints#registration-mode">
    Modalità di risposta fisse, con ambito account o personalizzate
  </Card>
  <Card title="Integrazione dello strumento message" icon="puzzle" href="/plugins/architecture#channel-plugins-and-the-shared-message-tool">
    describeMessageTool e discovery delle azioni
  </Card>
  <Card title="Risoluzione della destinazione" icon="crosshair" href="/plugins/architecture#channel-target-resolution">
    inferTargetChatType, looksLikeId, resolveTarget
  </Card>
  <Card title="Helper runtime" icon="settings" href="/plugins/sdk-runtime">
    TTS, STT, media, sottoagente tramite api.runtime
  </Card>
</CardGroup>

<Note>
Esistono ancora alcuni seam helper inclusi per la manutenzione dei plugin inclusi e per
compatibilità. Non sono il modello consigliato per i nuovi plugin di canale;
preferisci i sottopercorsi generici channel/setup/reply/runtime dalla superficie SDK
comune, a meno che tu non stia mantenendo direttamente quella famiglia di plugin inclusi.
</Note>

## Passaggi successivi

- [Plugin provider](/plugins/sdk-provider-plugins) — se il tuo plugin fornisce anche modelli
- [Panoramica SDK](/plugins/sdk-overview) — riferimento completo agli import dei sottopercorsi
- [SDK Testing](/plugins/sdk-testing) — utilità di test e test di contratto
- [Manifest del plugin](/plugins/manifest) — schema completo del manifest
