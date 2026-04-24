---
read_when:
    - Stai creando un nuovo Plugin di canale di messaggistica
    - Vuoi collegare OpenClaw a una piattaforma di messaggistica
    - Devi capire la superficie dell’adattatore ChannelPlugin
sidebarTitle: Channel Plugins
summary: Guida passo passo per creare un Plugin di canale di messaggistica per OpenClaw
title: Creare Plugin di canale
x-i18n:
    generated_at: "2026-04-24T08:52:59Z"
    model: gpt-5.4
    provider: openai
    source_hash: e08340e7984b4aa5307c4ba126b396a80fa8dcb3d6f72561f643806a8034fb88
    source_path: plugins/sdk-channel-plugins.md
    workflow: 15
---

Questa guida spiega passo dopo passo come creare un Plugin di canale che collega OpenClaw a una
piattaforma di messaggistica. Alla fine avrai un canale funzionante con sicurezza DM,
pairing, threading delle risposte e messaggistica in uscita.

<Info>
  Se non hai mai creato prima un Plugin OpenClaw, leggi prima
  [Per iniziare](/it/plugins/building-plugins) per la struttura base del pacchetto
  e la configurazione del manifest.
</Info>

## Come funzionano i Plugin di canale

I Plugin di canale non hanno bisogno di strumenti propri per send/edit/react. OpenClaw mantiene un
unico strumento `message` condiviso nel core. Il tuo Plugin possiede:

- **Configurazione** — risoluzione degli account e procedura guidata di setup
- **Sicurezza** — policy DM e allowlist
- **Pairing** — flusso di approvazione DM
- **Grammatica della sessione** — come gli ID di conversazione specifici del provider vengono mappati a chat base, ID thread e fallback ai genitori
- **Uscita** — invio di testo, media e sondaggi alla piattaforma
- **Threading** — come vengono infilate le risposte nei thread
- **Heartbeat typing** — segnali opzionali di digitazione/occupato per le destinazioni di consegna Heartbeat

Il core possiede lo strumento message condiviso, il wiring del prompt, la forma esterna della session-key,
il bookkeeping generico `:thread:` e il dispatch.

Se il tuo canale supporta indicatori di digitazione fuori dalle risposte in ingresso, esponi
`heartbeat.sendTyping(...)` sul Plugin di canale. Il core lo chiama con la destinazione di consegna
Heartbeat risolta prima che inizi l’esecuzione del modello Heartbeat e usa il ciclo di vita
condiviso di keepalive/cleanup della digitazione. Aggiungi `heartbeat.clearTyping(...)`
quando la piattaforma richiede un segnale esplicito di arresto.

Se il tuo canale aggiunge parametri dello strumento message che trasportano sorgenti media, esponi quei
nomi di parametro tramite `describeMessageTool(...).mediaSourceParams`. Il core usa
quell’elenco esplicito per la normalizzazione dei percorsi sandbox e la policy di accesso ai media in uscita,
così i Plugin non hanno bisogno di casi speciali nel core condiviso per parametri specifici del provider come
avatar, allegato o cover image.
Preferisci restituire una mappa indicizzata per azione come
`{ "set-profile": ["avatarUrl", "avatarPath"] }` così azioni non correlate non ereditano
gli argomenti media di un’altra azione. Un array piatto continua comunque a funzionare per parametri
intenzionalmente condivisi tra tutte le azioni esposte.

Se la tua piattaforma memorizza scope aggiuntivo dentro gli ID di conversazione, mantieni quel parsing
nel Plugin con `messaging.resolveSessionConversation(...)`. Questo è l’hook canonico per mappare
`rawId` all’ID di conversazione base, all’ID thread opzionale, a `baseConversationId` esplicito e a eventuali `parentConversationCandidates`.
Quando restituisci `parentConversationCandidates`, mantienili ordinati dal genitore più stretto
alla conversazione più ampia/base.

I Plugin inclusi che hanno bisogno dello stesso parsing prima dell’avvio del registro canali
possono anche esporre un file top-level `session-key-api.ts` con un export
`resolveSessionConversation(...)` corrispondente. Il core usa quella superficie sicura per il bootstrap
solo quando il registro Plugin runtime non è ancora disponibile.

`messaging.resolveParentConversationCandidates(...)` resta disponibile come fallback di compatibilità legacy quando un Plugin ha bisogno solo di fallback ai genitori sopra l’ID generico/raw. Se entrambi gli hook esistono, il core usa prima
`resolveSessionConversation(...).parentConversationCandidates` e usa come fallback `resolveParentConversationCandidates(...)` solo quando l’hook canonico li omette.

## Approvazioni e capacità del canale

La maggior parte dei Plugin di canale non ha bisogno di codice specifico per le approvazioni.

- Il core possiede `/approve` nella stessa chat, payload condivisi dei pulsanti di approvazione e consegna di fallback generica.
- Preferisci un singolo oggetto `approvalCapability` sul Plugin di canale quando il canale ha bisogno di comportamento specifico per le approvazioni.
- `ChannelPlugin.approvals` è stato rimosso. Inserisci fatti di consegna/nativo/render/autenticazione delle approvazioni in `approvalCapability`.
- `plugin.auth` è solo login/logout; il core non legge più hook di autenticazione delle approvazioni da quell’oggetto.
- `approvalCapability.authorizeActorAction` e `approvalCapability.getActionAvailabilityState` sono la seam canonica per l’autenticazione delle approvazioni.
- Usa `approvalCapability.getActionAvailabilityState` per la disponibilità dell’autenticazione delle approvazioni nella stessa chat.
- Se il tuo canale espone approvazioni exec native, usa `approvalCapability.getExecInitiatingSurfaceState` per lo stato initiating-surface/client nativo quando differisce dall’autenticazione delle approvazioni nella stessa chat. Il core usa quell’hook specifico exec per distinguere `enabled` vs `disabled`, decidere se il canale di origine supporta approvazioni exec native e includere il canale nelle indicazioni di fallback del client nativo. `createApproverRestrictedNativeApprovalCapability(...)` lo compila per il caso comune.
- Usa `outbound.shouldSuppressLocalPayloadPrompt` oppure `outbound.beforeDeliverPayload` per comportamento del ciclo di vita del payload specifico del canale, come nascondere prompt di approvazione locali duplicati o inviare indicatori di digitazione prima della consegna.
- Usa `approvalCapability.delivery` solo per instradamento di approvazioni native o soppressione del fallback.
- Usa `approvalCapability.nativeRuntime` per fatti di approvazione nativa posseduti dal canale. Mantienilo lazy sugli entrypoint caldi del canale con `createLazyChannelApprovalNativeRuntimeAdapter(...)`, che può importare il tuo modulo runtime su richiesta pur lasciando al core l’assemblaggio del ciclo di vita di approvazione.
- Usa `approvalCapability.render` solo quando un canale ha davvero bisogno di payload di approvazione personalizzati invece del renderer condiviso.
- Usa `approvalCapability.describeExecApprovalSetup` quando il canale vuole che la risposta del percorso disabilitato spieghi le esatte manopole di configurazione necessarie per abilitare le approvazioni exec native. L’hook riceve `{ channel, channelLabel, accountId }`; i canali con account nominati dovrebbero renderizzare percorsi con scope account come `channels.<channel>.accounts.<id>.execApprovals.*` invece dei valori predefiniti top-level.
- Se un canale può dedurre identità DM stabili simili al proprietario dalla configurazione esistente, usa `createResolvedApproverActionAuthAdapter` da `openclaw/plugin-sdk/approval-runtime` per limitare `/approve` nella stessa chat senza aggiungere logica core specifica per le approvazioni.
- Se un canale ha bisogno della consegna di approvazioni native, mantieni il codice del canale focalizzato su normalizzazione della destinazione più fatti di trasporto/presentazione. Usa `createChannelExecApprovalProfile`, `createChannelNativeOriginTargetResolver`, `createChannelApproverDmTargetResolver` e `createApproverRestrictedNativeApprovalCapability` da `openclaw/plugin-sdk/approval-runtime`. Metti i fatti specifici del canale dietro `approvalCapability.nativeRuntime`, idealmente tramite `createChannelApprovalNativeRuntimeAdapter(...)` oppure `createLazyChannelApprovalNativeRuntimeAdapter(...)`, così il core può assemblare l’handler e possedere filtro richieste, instradamento, deduplica, scadenza, sottoscrizione al gateway e notifiche routed-elsewhere. `nativeRuntime` è diviso in alcune seam più piccole:
- `availability` — se l’account è configurato e se una richiesta deve essere gestita
- `presentation` — mappa il view model condiviso di approvazione in payload nativi pending/resolved/expired o azioni finali
- `transport` — prepara le destinazioni più invio/aggiornamento/eliminazione dei messaggi di approvazione nativi
- `interactions` — hook opzionali bind/unbind/clear-action per pulsanti o reazioni native
- `observe` — hook opzionali per diagnostica di consegna
- Se il canale ha bisogno di oggetti posseduti dal runtime come client, token, app Bolt o ricevitore Webhook, registrali tramite `openclaw/plugin-sdk/channel-runtime-context`. Il registro generico del contesto runtime permette al core di inizializzare handler guidati dalle capacità a partire dallo stato di avvio del canale senza aggiungere glue wrapper specifico per le approvazioni.
- Ricorri ai più bassi livelli `createChannelApprovalHandler` oppure `createChannelNativeApprovalRuntime` solo quando la seam guidata dalle capacità non è ancora sufficientemente espressiva.
- I canali di approvazione nativa devono instradare sia `accountId` sia `approvalKind` attraverso quegli helper. `accountId` mantiene la policy di approvazione multi-account limitata al giusto account bot, e `approvalKind` mantiene disponibile al canale il comportamento di approvazione exec vs Plugin senza branch hardcoded nel core.
- Il core ora possiede anche le notifiche di reroute delle approvazioni. I Plugin di canale non dovrebbero inviare propri messaggi di follow-up “l’approvazione è andata ai DM / a un altro canale” da `createChannelNativeApprovalRuntime`; invece devono esporre con precisione l’instradamento origine + DM approvatore tramite gli helper condivisi della capacità di approvazione e lasciare che il core aggreghi le consegne effettive prima di pubblicare qualsiasi notifica nella chat di origine.
- Preserva end-to-end il tipo di ID di approvazione consegnato. I client nativi non dovrebbero
  dedurre o riscrivere l’instradamento di approvazione exec vs Plugin dallo stato locale del canale.
- Diversi tipi di approvazione possono intenzionalmente esporre superfici native diverse.
  Esempi inclusi attuali:
  - Slack mantiene disponibile l’instradamento nativo delle approvazioni sia per ID exec sia per ID Plugin.
  - Matrix mantiene lo stesso instradamento DM/canale nativo e la stessa UX a reazione per approvazioni exec
    e Plugin, pur consentendo all’autenticazione di differire per tipo di approvazione.
- `createApproverRestrictedNativeApprovalAdapter` esiste ancora come wrapper di compatibilità, ma il nuovo codice dovrebbe preferire il builder di capacità ed esporre `approvalCapability` sul Plugin.

Per entrypoint caldi del canale, preferisci i sottopercorsi runtime più stretti quando ti
serve solo una parte di quella famiglia:

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

Per il setup in particolare:

- `openclaw/plugin-sdk/setup-runtime` copre gli helper di setup sicuri per il runtime:
  adattatori patch di setup sicuri all’importazione (`createPatchedAccountSetupAdapter`,
  `createEnvPatchedAccountSetupAdapter`,
  `createSetupInputPresenceValidator`), output delle note di lookup,
  `promptResolvedAllowFrom`, `splitSetupEntries` e i builder di
  setup-proxy delegati
- `openclaw/plugin-sdk/setup-adapter-runtime` è la seam stretta env-aware
  per `createEnvPatchedAccountSetupAdapter`
- `openclaw/plugin-sdk/channel-setup` copre i builder di setup con installazione opzionale
  più alcuni primitivi sicuri per il setup:
  `createOptionalChannelSetupSurface`, `createOptionalChannelSetupAdapter`,

Se il tuo canale supporta setup o autenticazione guidati da env e i flussi generici di avvio/configurazione
devono conoscere quei nomi env prima del caricamento del runtime, dichiarali nel
manifest del Plugin con `channelEnvVars`. Mantieni `envVars` del runtime del canale o costanti locali solo per il testo rivolto agli operatori.

Se il tuo canale può comparire in `status`, `channels list`, `channels status` o nelle scansioni SecretRef prima che inizi il runtime del Plugin, aggiungi `openclaw.setupEntry` in
`package.json`. Quel punto di ingresso dovrebbe essere sicuro da importare nei percorsi di comando in sola lettura e dovrebbe restituire i metadati del canale, l’adattatore di configurazione sicuro per il setup, l’adattatore di stato e i metadati del target dei segreti del canale necessari a quei riepiloghi. Non avviare client, listener o runtime di trasporto dal setup entry.

`createOptionalChannelSetupWizard`, `DEFAULT_ACCOUNT_ID`,
`createTopLevelChannelDmPolicy`, `setSetupChannelEnabled` e
`splitSetupEntries`

- usa la seam più ampia `openclaw/plugin-sdk/setup` solo quando ti servono anche gli
  helper condivisi di setup/configurazione più pesanti come
  `moveSingleAccountChannelSectionToDefaultAccount(...)`

Se il tuo canale vuole solo pubblicizzare “installa prima questo Plugin” nelle
superfici di setup, preferisci `createOptionalChannelSetupSurface(...)`. L’adattatore/wizard
generato fallisce in modalità fail-closed su scritture di configurazione e finalizzazione, e riutilizza
lo stesso messaggio “installazione richiesta” in validazione, finalize e testo del link
alla documentazione.

Per altri percorsi caldi del canale, preferisci gli helper stretti alle superfici legacy più ampie:

- `openclaw/plugin-sdk/account-core`,
  `openclaw/plugin-sdk/account-id`,
  `openclaw/plugin-sdk/account-resolution` e
  `openclaw/plugin-sdk/account-helpers` per configurazione multi-account e
  fallback dell’account predefinito
- `openclaw/plugin-sdk/inbound-envelope` e
  `openclaw/plugin-sdk/inbound-reply-dispatch` per instradamento/envelope in ingresso e
  wiring di record-and-dispatch
- `openclaw/plugin-sdk/messaging-targets` per parsing/matching delle destinazioni
- `openclaw/plugin-sdk/outbound-media` e
  `openclaw/plugin-sdk/outbound-runtime` per caricamento dei media più
  deleghe di identità/invio in uscita e pianificazione dei payload
- `buildThreadAwareOutboundSessionRoute(...)` da
  `openclaw/plugin-sdk/channel-core` quando una route in uscita deve preservare un
  `replyToId`/`threadId` esplicito o recuperare la sessione corrente `:thread:`
  dopo che la session key base continua comunque a corrispondere. I Plugin provider possono sostituire
  precedenza, comportamento del suffisso e normalizzazione dell’ID thread quando la loro piattaforma
  ha semantica nativa di consegna thread.
- `openclaw/plugin-sdk/thread-bindings-runtime` per il ciclo di vita dei thread-binding
  e la registrazione degli adattatori
- `openclaw/plugin-sdk/agent-media-payload` solo quando è ancora richiesto un layout legacy dei campi payload agente/media
- `openclaw/plugin-sdk/telegram-command-config` per normalizzazione dei comandi personalizzati Telegram,
  validazione di duplicati/conflitti e un contratto di configurazione dei comandi stabile in fallback

I canali solo-auth in genere possono fermarsi al percorso predefinito: il core gestisce le approvazioni e il Plugin espone soltanto capacità outbound/auth. I canali di approvazione nativa come Matrix, Slack, Telegram e trasporti chat personalizzati dovrebbero usare gli helper nativi condivisi invece di costruire da soli il proprio ciclo di vita di approvazione.

## Policy delle menzioni in ingresso

Mantieni la gestione delle menzioni in ingresso divisa in due livelli:

- raccolta delle evidenze posseduta dal Plugin
- valutazione della policy condivisa

Usa `openclaw/plugin-sdk/channel-mention-gating` per le decisioni di mention-policy.
Usa `openclaw/plugin-sdk/channel-inbound` solo quando ti serve il barrel helper
più ampio per l’inbound.

Buoni casi d’uso per logica locale al Plugin:

- rilevamento della risposta al bot
- rilevamento della citazione del bot
- controlli di partecipazione al thread
- esclusioni di messaggi di servizio/sistema
- cache native della piattaforma necessarie a dimostrare la partecipazione del bot

Buoni casi d’uso per l’helper condiviso:

- `requireMention`
- risultato di menzione esplicita
- allowlist di menzione implicita
- bypass dei comandi
- decisione finale di skip

Flusso preferito:

1. Calcola i fatti locali di menzione.
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
i Plugin di canale inclusi che già dipendono dall’iniezione runtime:

- `buildMentionRegexes`
- `matchesMentionPatterns`
- `matchesMentionWithExplicit`
- `implicitMentionKindWhen`
- `resolveInboundMentionDecision`

Se ti servono solo `implicitMentionKindWhen` e
`resolveInboundMentionDecision`, importa da
`openclaw/plugin-sdk/channel-mention-gating` per evitare di caricare helper runtime inbound non correlati.

I vecchi helper `resolveMentionGating*` restano su
`openclaw/plugin-sdk/channel-inbound` solo come esportazioni di compatibilità. Il nuovo codice
dovrebbe usare `resolveInboundMentionDecision({ facts, policy })`.

## Procedura guidata

<Steps>
  <a id="step-1-package-and-manifest"></a>
  <Step title="Pacchetto e manifest">
    Crea i file standard del Plugin. Il campo `channel` in `package.json` è
    ciò che rende questo un Plugin di canale. Per la superficie completa dei metadati del pacchetto,
    vedi [Configurazione Plugin e Config](/it/plugins/sdk-setup#openclaw-channel):

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

  <Step title="Costruisci l’oggetto Plugin di canale">
    L’interfaccia `ChannelPlugin` ha molte superfici adattatore opzionali. Inizia con
    il minimo — `id` e `setup` — e aggiungi adattatori quando ne hai bisogno.

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
          idLabel: "Acme Chat username",
          message: "Send this code to verify your identity:",
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

      | Opzione | Che cosa collega |
      | --- | --- |
      | `security.dm` | Resolver di sicurezza DM con scope dai campi di configurazione |
      | `pairing.text` | Flusso pairing DM basato su testo con scambio di codice |
      | `threading` | Resolver della modalità reply-to (fissa, con scope account, o personalizzata) |
      | `outbound.attachedResults` | Funzioni di invio che restituiscono metadati di risultato (ID messaggio) |

      Puoi anche passare oggetti adattatore grezzi invece delle opzioni dichiarative
      se hai bisogno di pieno controllo.
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

    Metti i descrittori CLI posseduti dal canale in `registerCliMetadata(...)` così OpenClaw
    può mostrarli nell’help root senza attivare il runtime completo del canale,
    mentre i normali full load raccolgono comunque gli stessi descrittori per la registrazione reale dei comandi. Mantieni `registerFull(...)` per lavoro solo runtime.
    Se `registerFull(...)` registra metodi RPC del gateway, usa un
    prefisso specifico del Plugin. Gli spazi dei nomi admin del core (`config.*`,
    `exec.approvals.*`, `wizard.*`, `update.*`) restano riservati e si
    risolvono sempre in `operator.admin`.
    `defineChannelPluginEntry` gestisce automaticamente la separazione delle modalità di registrazione. Vedi
    [Entry Points](/it/plugins/sdk-entrypoints#definechannelpluginentry) per tutte le
    opzioni.

  </Step>

  <Step title="Aggiungi una setup entry">
    Crea `setup-entry.ts` per un caricamento leggero durante l’onboarding:

    ```typescript setup-entry.ts
    import { defineSetupPluginEntry } from "openclaw/plugin-sdk/channel-core";
    import { acmeChatPlugin } from "./src/channel.js";

    export default defineSetupPluginEntry(acmeChatPlugin);
    ```

    OpenClaw carica questo invece dell’entry completa quando il canale è disabilitato
    o non configurato. Evita di trascinare codice runtime pesante durante i flussi di setup.
    Vedi [Setup e Config](/it/plugins/sdk-setup#setup-entry) per i dettagli.

    I canali workspace inclusi che dividono le esportazioni sicure per il setup in moduli
    sidecar possono usare `defineBundledChannelSetupEntry(...)` da
    `openclaw/plugin-sdk/channel-entry-contract` quando hanno anche bisogno di un
    setter runtime esplicito al tempo di setup.

  </Step>

  <Step title="Gestisci i messaggi in ingresso">
    Il tuo Plugin deve ricevere messaggi dalla piattaforma e inoltrarli a
    OpenClaw. Il pattern tipico è un Webhook che verifica la richiesta e
    la inoltra tramite l’handler inbound del tuo canale:

    ```typescript
    registerFull(api) {
      api.registerHttpRoute({
        path: "/acme-chat/webhook",
        auth: "plugin", // autenticazione gestita dal Plugin (verifica tu stesso le firme)
        handler: async (req, res) => {
          const event = parseWebhookPayload(req);

          // Il tuo handler inbound invia il messaggio a OpenClaw.
          // Il wiring esatto dipende dal tuo SDK di piattaforma —
          // vedi un esempio reale nel pacchetto Plugin incluso Microsoft Teams o Google Chat.
          await handleAcmeChatInbound(api, event);

          res.statusCode = 200;
          res.end("ok");
          return true;
        },
      });
    }
    ```

    <Note>
      La gestione dei messaggi in ingresso è specifica del canale. Ogni Plugin di canale possiede
      la propria pipeline inbound. Guarda i Plugin di canale inclusi
      (per esempio il pacchetto Plugin Microsoft Teams o Google Chat) per pattern reali.
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
├── api.ts                    # esportazioni pubbliche (opzionale)
├── runtime-api.ts            # esportazioni runtime interne (opzionale)
└── src/
    ├── channel.ts            # ChannelPlugin tramite createChatChannelPlugin
    ├── channel.test.ts       # Test
    ├── client.ts             # Client API della piattaforma
    └── runtime.ts            # Archivio runtime (se necessario)
```

## Argomenti avanzati

<CardGroup cols={2}>
  <Card title="Opzioni di threading" icon="git-branch" href="/it/plugins/sdk-entrypoints#registration-mode">
    Modalità di risposta fisse, con scope account o personalizzate
  </Card>
  <Card title="Integrazione dello strumento message" icon="puzzle" href="/it/plugins/architecture#channel-plugins-and-the-shared-message-tool">
    describeMessageTool e discovery delle azioni
  </Card>
  <Card title="Risoluzione delle destinazioni" icon="crosshair" href="/it/plugins/architecture-internals#channel-target-resolution">
    inferTargetChatType, looksLikeId, resolveTarget
  </Card>
  <Card title="Helper runtime" icon="settings" href="/it/plugins/sdk-runtime">
    TTS, STT, media, subagent tramite api.runtime
  </Card>
</CardGroup>

<Note>
Alcune seam helper incluse esistono ancora per manutenzione dei Plugin inclusi e
compatibilità. Non sono il pattern consigliato per nuovi Plugin di canale;
preferisci i sottopercorsi generici channel/setup/reply/runtime dalla superficie
SDK comune, a meno che tu non stia mantenendo direttamente quella famiglia di Plugin inclusi.
</Note>

## Prossimi passi

- [Plugin Provider](/it/plugins/sdk-provider-plugins) — se il tuo Plugin fornisce anche modelli
- [Panoramica SDK](/it/plugins/sdk-overview) — riferimento completo dei sottopercorsi di importazione
- [SDK Testing](/it/plugins/sdk-testing) — utility di test e test di contratto
- [Manifest Plugin](/it/plugins/manifest) — schema completo del manifest

## Correlati

- [Configurazione SDK Plugin](/it/plugins/sdk-setup)
- [Creare Plugin](/it/plugins/building-plugins)
- [Plugin agent harness](/it/plugins/sdk-agent-harness)
