---
read_when:
    - Viene visualizzato l'avviso OPENCLAW_PLUGIN_SDK_COMPAT_DEPRECATED
    - Visualizzi l'avviso OPENCLAW_EXTENSION_API_DEPRECATED
    - Hai usato api.registerEmbeddedExtensionFactory prima di OpenClaw 2026.4.25
    - Stai aggiornando un plugin alla moderna architettura dei plugin
    - Mantieni un Plugin OpenClaw esterno
sidebarTitle: Migrate to SDK
summary: Migra dal livello di retrocompatibilità legacy al moderno SDK Plugin
title: Migrazione del Plugin SDK
x-i18n:
    generated_at: "2026-04-30T09:05:27Z"
    model: gpt-5.5
    provider: openai
    source_hash: 00a1f95a33c50d5c69d7b4768858289365bf29ed069abb3f29218e03c597b4c6
    source_path: plugins/sdk-migration.md
    workflow: 16
---

OpenClaw è passato da un ampio livello di compatibilità all'indietro a una moderna architettura plugin
con import mirati e documentati. Se il tuo plugin è stato creato prima
della nuova architettura, questa guida ti aiuta a migrare.

## Cosa cambia

Il vecchio sistema di plugin forniva due superfici molto aperte che consentivano ai plugin di importare
tutto ciò di cui avevano bisogno da un singolo punto di ingresso:

- **`openclaw/plugin-sdk/compat`** — un singolo import che riesportava decine di
  helper. È stato introdotto per mantenere funzionanti i vecchi plugin basati su hook mentre veniva
  costruita la nuova architettura plugin.
- **`openclaw/plugin-sdk/infra-runtime`** — un ampio barrel di helper runtime che
  mescolava eventi di sistema, stato Heartbeat, code di consegna, helper fetch/proxy,
  helper per file, tipi di approvazione e utilità non correlate.
- **`openclaw/plugin-sdk/config-runtime`** — un ampio barrel di compatibilità della configurazione
  che contiene ancora helper deprecati di caricamento/scrittura diretti durante la finestra di migrazione.
- **`openclaw/extension-api`** — un bridge che dava ai plugin accesso diretto a
  helper lato host come l'agent runner incorporato.
- **`api.registerEmbeddedExtensionFactory(...)`** — un hook di estensione in bundle rimosso, solo per Pi,
  che poteva osservare eventi dell'embedded-runner come
  `tool_result`.

Le ampie superfici di import sono ora **deprecate**. Funzionano ancora a runtime,
ma i nuovi plugin non devono usarle, e i plugin esistenti dovrebbero migrare prima
che la prossima major release le rimuova. L'API di registrazione della factory
di estensione incorporata solo per Pi è stata rimossa; usa invece il middleware dei risultati degli strumenti.

OpenClaw non rimuove né reinterpreta comportamenti plugin documentati nello stesso
cambiamento che introduce una sostituzione. Le modifiche incompatibili al contratto devono prima passare
attraverso un adattatore di compatibilità, diagnostica, documentazione e una finestra di deprecazione.
Questo vale per import SDK, campi del manifest, API di configurazione, hook e comportamento di registrazione
runtime.

<Warning>
  Il livello di compatibilità all'indietro sarà rimosso in una futura major release.
  I plugin che importano ancora da queste superfici si romperanno quando ciò accadrà.
  Le registrazioni di factory di estensioni incorporate solo per Pi non vengono già più caricate.
</Warning>

## Perché è cambiato

Il vecchio approccio causava problemi:

- **Avvio lento** — importare un helper caricava decine di moduli non correlati
- **Dipendenze circolari** — le riesportazioni ampie rendevano facile creare cicli di import
- **Superficie API poco chiara** — non c'era modo di capire quali export fossero stabili e quali interni

Il moderno SDK plugin risolve questo problema: ogni percorso di import (`openclaw/plugin-sdk/\<subpath\>`)
è un modulo piccolo e autonomo con uno scopo chiaro e un contratto documentato.

Anche le seam di comodità legacy dei provider per i canali in bundle sono state rimosse.
Le seam helper con brand di canale erano scorciatoie private del mono-repo, non contratti plugin
stabili. Usa invece sottopercorsi SDK generici e mirati. All'interno del workspace dei plugin in bundle,
mantieni gli helper di proprietà del provider nel suo `api.ts` o
`runtime-api.ts`.

Esempi attuali di provider in bundle:

- Anthropic mantiene helper di stream specifici per Claude nella propria seam `api.ts` /
  `contract-api.ts`
- OpenAI mantiene builder di provider, helper per il modello predefinito e builder di provider
  realtime nel proprio `api.ts`
- OpenRouter mantiene builder di provider e helper di onboarding/configurazione nel proprio
  `api.ts`

## Policy di compatibilità

Per i plugin esterni, il lavoro di compatibilità segue questo ordine:

1. aggiungere il nuovo contratto
2. mantenere il vecchio comportamento collegato tramite un adattatore di compatibilità
3. emettere una diagnostica o un avviso che nomina il vecchio percorso e la sostituzione
4. coprire entrambi i percorsi nei test
5. documentare la deprecazione e il percorso di migrazione
6. rimuovere solo dopo la finestra di migrazione annunciata, di solito in una major release

I maintainer possono verificare la coda di migrazione attuale con
`pnpm plugins:boundary-report`. Usa `pnpm plugins:boundary-report:summary` per
conteggi compatti, `--owner <id>` per un plugin o proprietario di compatibilità, e
`pnpm plugins:boundary-report:ci` quando un gate CI deve fallire su record di compatibilità
scaduti, import SDK riservati tra proprietari, o sottopercorsi SDK riservati inutilizzati.
Il report raggruppa i record di compatibilità deprecati per data di rimozione, conta i riferimenti
locali in codice/documentazione, evidenzia import SDK riservati tra proprietari, e riepiloga il bridge SDK
privato del memory-host in modo che la pulizia della compatibilità resti esplicita invece di
basarsi su ricerche ad hoc. I sottopercorsi SDK riservati devono avere utilizzo del proprietario tracciato;
gli export di helper riservati inutilizzati dovrebbero essere rimossi dall'SDK pubblico.

Se un campo del manifest è ancora accettato, gli autori di plugin possono continuare a usarlo finché
la documentazione e la diagnostica non indicano diversamente. Il nuovo codice dovrebbe preferire la sostituzione
documentata, ma i plugin esistenti non dovrebbero rompersi durante normali release minori.

## Come migrare

<Steps>
  <Step title="Migrare gli helper runtime di caricamento/scrittura della configurazione">
    I plugin in bundle dovrebbero smettere di chiamare direttamente
    `api.runtime.config.loadConfig()` e
    `api.runtime.config.writeConfigFile(...)`. Preferisci la configurazione che era
    già stata passata nel percorso di chiamata attivo. Gli handler a lunga vita che necessitano dello
    snapshot corrente del processo possono usare `api.runtime.config.current()`. Gli strumenti agente a lunga vita
    dovrebbero usare `ctx.getRuntimeConfig()` del contesto dello strumento dentro
    `execute`, così uno strumento creato prima di una scrittura della configurazione vede comunque la configurazione
    runtime aggiornata.

    Le scritture di configurazione devono passare attraverso gli helper transazionali e scegliere una
    policy post-scrittura:

    ```typescript
    await api.runtime.config.mutateConfigFile({
      afterWrite: { mode: "auto" },
      mutate(draft) {
        draft.plugins ??= {};
      },
    });
    ```

    Usa `afterWrite: { mode: "restart", reason: "..." }` quando il chiamante sa
    che la modifica richiede un riavvio pulito del Gateway, e
    `afterWrite: { mode: "none", reason: "..." }` solo quando il chiamante possiede il
    follow-up e vuole deliberatamente sopprimere il pianificatore di reload.
    I risultati della mutazione includono un riepilogo `followUp` tipizzato per test e logging;
    il Gateway resta responsabile dell'applicazione o della pianificazione del riavvio.
    `loadConfig` e `writeConfigFile` restano come helper di compatibilità deprecati
    per plugin esterni durante la finestra di migrazione e avvisano una sola volta con
    il codice di compatibilità `runtime-config-load-write`. I plugin in bundle e il codice runtime
    del repo sono protetti da guardrail dello scanner in
    `pnpm check:deprecated-internal-config-api` e
    `pnpm check:no-runtime-action-load-config`: il nuovo utilizzo in plugin di produzione
    fallisce direttamente, le scritture dirette della configurazione falliscono, i metodi server del Gateway devono usare
    lo snapshot runtime della richiesta, gli helper runtime di invio/azione/client del canale
    devono ricevere la configurazione dal loro boundary, e i moduli runtime a lunga vita hanno
    zero chiamate ambientali `loadConfig()` consentite.

    Il nuovo codice plugin dovrebbe anche evitare di importare l'ampio barrel di compatibilità
    `openclaw/plugin-sdk/config-runtime`. Usa il sottopercorso SDK mirato che corrisponde al compito:

    | Necessità | Import |
    | --- | --- |
    | Tipi di configurazione come `OpenClawConfig` | `openclaw/plugin-sdk/config-types` |
    | Asserzioni su configurazione già caricata e lookup della configurazione di ingresso plugin | `openclaw/plugin-sdk/plugin-config-runtime` |
    | Letture dello snapshot runtime corrente | `openclaw/plugin-sdk/runtime-config-snapshot` |
    | Scritture della configurazione | `openclaw/plugin-sdk/config-mutation` |
    | Helper dello store di sessione | `openclaw/plugin-sdk/session-store-runtime` |
    | Configurazione di tabelle Markdown | `openclaw/plugin-sdk/markdown-table-runtime` |
    | Helper runtime della policy di gruppo | `openclaw/plugin-sdk/runtime-group-policy` |
    | Risoluzione dell'input segreto | `openclaw/plugin-sdk/secret-input-runtime` |
    | Override di modello/sessione | `openclaw/plugin-sdk/model-session-runtime` |

    I plugin in bundle e i loro test sono protetti dallo scanner contro l'ampio
    barrel, così import e mock restano locali al comportamento di cui hanno bisogno. L'ampio
    barrel esiste ancora per la compatibilità esterna, ma il nuovo codice non dovrebbe
    dipendere da esso.

  </Step>

  <Step title="Migrare le estensioni Pi dei risultati degli strumenti al middleware">
    I plugin in bundle devono sostituire gli handler dei risultati degli strumenti
    `api.registerEmbeddedExtensionFactory(...)` solo per Pi con
    middleware indipendente dal runtime.

    ```typescript
    // Pi and Codex runtime dynamic tools
    api.registerAgentToolResultMiddleware(async (event) => {
      return compactToolResult(event);
    }, {
      runtimes: ["pi", "codex"],
    });
    ```

    Aggiorna contemporaneamente il manifest del plugin:

    ```json
    {
      "contracts": {
        "agentToolResultMiddleware": ["pi", "codex"]
      }
    }
    ```

    I plugin esterni non possono registrare middleware dei risultati degli strumenti perché può
    riscrivere l'output di strumenti ad alta fiducia prima che il modello lo veda.

  </Step>

  <Step title="Migrare gli handler nativi di approvazione ai fatti di capability">
    I plugin di canale con supporto alle approvazioni ora espongono il comportamento nativo di approvazione tramite
    `approvalCapability.nativeRuntime` più il registro condiviso del contesto runtime.

    Modifiche principali:

    - Sostituisci `approvalCapability.handler.loadRuntime(...)` con
      `approvalCapability.nativeRuntime`
    - Sposta auth/consegna specifiche per approvazioni dal wiring legacy `plugin.auth` /
      `plugin.approvals` a `approvalCapability`
    - `ChannelPlugin.approvals` è stato rimosso dal contratto pubblico dei channel-plugin;
      sposta i campi delivery/native/render su `approvalCapability`
    - `plugin.auth` resta solo per i flussi di login/logout del canale; gli hook auth
      di approvazione lì non vengono più letti dal core
    - Registra oggetti runtime di proprietà del canale come client, token o app Bolt
      tramite `openclaw/plugin-sdk/channel-runtime-context`
    - Non inviare avvisi di reindirizzamento di proprietà del plugin dagli handler nativi di approvazione;
      ora il core possiede gli avvisi di instradamento altrove dai risultati effettivi di consegna
    - Quando passi `channelRuntime` a `createChannelManager(...)`, fornisci una
      superficie reale `createPluginRuntime().channel`. Gli stub parziali vengono rifiutati.

    Vedi `/plugins/sdk-channel-plugins` per il layout attuale della capability di approvazione.

  </Step>

  <Step title="Verificare il comportamento di fallback dei wrapper Windows">
    Se il tuo plugin usa `openclaw/plugin-sdk/windows-spawn`, i wrapper Windows
    `.cmd`/`.bat` non risolti ora falliscono in modo chiuso, a meno che tu non passi esplicitamente
    `allowShellFallback: true`.

    ```typescript
    // Before
    const program = applyWindowsSpawnProgramPolicy({ candidate });

    // After
    const program = applyWindowsSpawnProgramPolicy({
      candidate,
      // Only set this for trusted compatibility callers that intentionally
      // accept shell-mediated fallback.
      allowShellFallback: true,
    });
    ```

    Se il tuo chiamante non si basa intenzionalmente sul fallback della shell, non impostare
    `allowShellFallback` e gestisci invece l'errore generato.

  </Step>

  <Step title="Trovare gli import deprecati">
    Cerca nel tuo plugin import da una delle superfici deprecate:

    ```bash
    grep -r "plugin-sdk/compat" my-plugin/
    grep -r "plugin-sdk/infra-runtime" my-plugin/
    grep -r "plugin-sdk/config-runtime" my-plugin/
    grep -r "openclaw/extension-api" my-plugin/
    ```

  </Step>

  <Step title="Sostituire con import mirati">
    Ogni export dalla vecchia superficie mappa a uno specifico percorso di import moderno:

    ```typescript
    // Before (deprecated backwards-compatibility layer)
    import {
      createChannelReplyPipeline,
      createPluginRuntimeStore,
      resolveControlCommandGate,
    } from "openclaw/plugin-sdk/compat";

    // After (modern focused imports)
    import { createChannelReplyPipeline } from "openclaw/plugin-sdk/channel-reply-pipeline";
    import { createPluginRuntimeStore } from "openclaw/plugin-sdk/runtime-store";
    import { resolveControlCommandGate } from "openclaw/plugin-sdk/command-auth";
    ```

    Per gli helper lato host, usa il runtime plugin iniettato invece di importare
    direttamente:

    ```typescript
    // Before (deprecated extension-api bridge)
    import { runEmbeddedPiAgent } from "openclaw/extension-api";
    const result = await runEmbeddedPiAgent({ sessionId, prompt });

    // After (injected runtime)
    const result = await api.runtime.agent.runEmbeddedPiAgent({ sessionId, prompt });
    ```

    Lo stesso schema si applica agli altri helper bridge legacy:

    | Importazione precedente | Equivalente moderno |
    | --- | --- |
    | `resolveAgentDir` | `api.runtime.agent.resolveAgentDir` |
    | `resolveAgentWorkspaceDir` | `api.runtime.agent.resolveAgentWorkspaceDir` |
    | `resolveAgentIdentity` | `api.runtime.agent.resolveAgentIdentity` |
    | `resolveThinkingDefault` | `api.runtime.agent.resolveThinkingDefault` |
    | `resolveAgentTimeoutMs` | `api.runtime.agent.resolveAgentTimeoutMs` |
    | `ensureAgentWorkspace` | `api.runtime.agent.ensureAgentWorkspace` |
    | helper dello store delle sessioni | `api.runtime.agent.session.*` |

  </Step>

  <Step title="Sostituisci le importazioni infra-runtime ampie">
    `openclaw/plugin-sdk/infra-runtime` esiste ancora per la compatibilità
    esterna, ma il nuovo codice deve importare la superficie di helper mirata di
    cui ha effettivamente bisogno:

    | Esigenza | Importazione |
    | --- | --- |
    | Helper della coda degli eventi di sistema | `openclaw/plugin-sdk/system-event-runtime` |
    | Helper per eventi Heartbeat e visibilità | `openclaw/plugin-sdk/heartbeat-runtime` |
    | Svuotamento della coda di consegna in sospeso | `openclaw/plugin-sdk/delivery-queue-runtime` |
    | Telemetria dell'attività del canale | `openclaw/plugin-sdk/channel-activity-runtime` |
    | Cache di deduplicazione in memoria | `openclaw/plugin-sdk/dedupe-runtime` |
    | Helper sicuri per percorsi di file/media locali | `openclaw/plugin-sdk/file-access-runtime` |
    | Recupero sensibile al dispatcher | `openclaw/plugin-sdk/runtime-fetch` |
    | Helper per proxy e recupero protetto | `openclaw/plugin-sdk/fetch-runtime` |
    | Tipi di policy del dispatcher SSRF | `openclaw/plugin-sdk/ssrf-dispatcher` |
    | Tipi per richiesta/risoluzione di approvazione | `openclaw/plugin-sdk/approval-runtime` |
    | Helper per payload e comandi di risposta di approvazione | `openclaw/plugin-sdk/approval-reply-runtime` |
    | Helper per la formattazione degli errori | `openclaw/plugin-sdk/error-runtime` |
    | Attese di prontezza del trasporto | `openclaw/plugin-sdk/transport-ready-runtime` |
    | Helper per token sicuri | `openclaw/plugin-sdk/secure-random-runtime` |
    | Concorrenza limitata dei task asincroni | `openclaw/plugin-sdk/concurrency-runtime` |
    | Coercizione numerica | `openclaw/plugin-sdk/number-runtime` |
    | Lock asincrono locale al processo | `openclaw/plugin-sdk/async-lock-runtime` |
    | Lock sui file | `openclaw/plugin-sdk/file-lock` |

    I plugin in bundle sono protetti dallo scanner contro `infra-runtime`,
    quindi il codice del repository non può regredire al barrel ampio.

  </Step>

  <Step title="Migra gli helper delle route dei canali">
    Il nuovo codice per le route dei canali deve usare `openclaw/plugin-sdk/channel-route`.
    I nomi precedenti di route-key e comparable-target restano alias di
    compatibilità durante la finestra di migrazione, ma i nuovi plugin devono
    usare i nomi di route che descrivono direttamente il comportamento:

    | Helper precedente | Helper moderno |
    | --- | --- |
    | `channelRouteIdentityKey(...)` | `channelRouteDedupeKey(...)` |
    | `channelRouteKey(...)` | `channelRouteCompactKey(...)` |
    | `ComparableChannelTarget` | `ChannelRouteParsedTarget` |
    | `resolveComparableTargetForChannel(...)` | `resolveRouteTargetForChannel(...)` |
    | `resolveComparableTargetForLoadedChannel(...)` | `resolveRouteTargetForLoadedChannel(...)` |
    | `comparableChannelTargetsMatch(...)` | `channelRouteTargetsMatchExact(...)` |
    | `comparableChannelTargetsShareRoute(...)` | `channelRouteTargetsShareConversation(...)` |

    Gli helper di route moderni normalizzano `{ channel, to, accountId, threadId }`
    in modo coerente tra approvazioni native, soppressione delle risposte,
    deduplicazione in ingresso, consegna Cron e instradamento delle sessioni. Se
    il tuo plugin possiede una grammatica dei target personalizzata, usa
    `resolveChannelRouteTargetWithParser(...)` per adattare quel parser allo
    stesso contratto del target di route.

  </Step>

  <Step title="Compila e testa">
    ```bash
    pnpm build
    pnpm test -- my-plugin/
    ```
  </Step>
</Steps>

## Riferimento ai percorsi di importazione

  <Accordion title="Common import path table">
  | Percorso di importazione | Scopo | Esportazioni principali |
  | --- | --- | --- |
  | `plugin-sdk/plugin-entry` | Helper canonico per l'entrypoint del plugin | `definePluginEntry` |
  | `plugin-sdk/core` | Riesportazione ombrello legacy per definizioni/builder di entrypoint dei canali | `defineChannelPluginEntry`, `createChatChannelPlugin` |
  | `plugin-sdk/config-schema` | Esportazione dello schema di configurazione radice | `OpenClawSchema` |
  | `plugin-sdk/provider-entry` | Helper per entrypoint a provider singolo | `defineSingleProviderPluginEntry` |
  | `plugin-sdk/channel-core` | Definizioni e builder mirati per entrypoint di canale | `defineChannelPluginEntry`, `defineSetupPluginEntry`, `createChatChannelPlugin`, `createChannelPluginBase` |
  | `plugin-sdk/setup` | Helper condivisi per la procedura guidata di configurazione | Prompt di allowlist, builder dello stato di configurazione |
  | `plugin-sdk/setup-runtime` | Helper runtime per la fase di configurazione | Adapter di patch per configurazione sicuri per l'importazione, helper per note di lookup, `promptResolvedAllowFrom`, `splitSetupEntries`, proxy di configurazione delegati |
  | `plugin-sdk/setup-adapter-runtime` | Helper per adapter di configurazione | `createEnvPatchedAccountSetupAdapter` |
  | `plugin-sdk/setup-tools` | Helper per strumenti di configurazione | `formatCliCommand`, `detectBinary`, `extractArchive`, `resolveBrewExecutable`, `formatDocsLink`, `CONFIG_DIR` |
  | `plugin-sdk/account-core` | Helper multi-account | Helper per elenco account/configurazione/action-gate |
  | `plugin-sdk/account-id` | Helper per ID account | `DEFAULT_ACCOUNT_ID`, normalizzazione dell'ID account |
  | `plugin-sdk/account-resolution` | Helper di lookup account | Helper per lookup account + fallback predefinito |
  | `plugin-sdk/account-helpers` | Helper mirati per account | Helper per elenco account/azione account |
  | `plugin-sdk/channel-setup` | Adapter per procedura guidata di configurazione | `createOptionalChannelSetupSurface`, `createOptionalChannelSetupAdapter`, `createOptionalChannelSetupWizard`, più `DEFAULT_ACCOUNT_ID`, `createTopLevelChannelDmPolicy`, `setSetupChannelEnabled`, `splitSetupEntries` |
  | `plugin-sdk/channel-pairing` | Primitive di associazione DM | `createChannelPairingController` |
  | `plugin-sdk/channel-reply-pipeline` | Cablaggio di prefisso risposta, digitazione e consegna origine | `createChannelReplyPipeline`, `resolveChannelSourceReplyDeliveryMode` |
  | `plugin-sdk/channel-config-helpers` | Factory di adapter di configurazione e helper per accesso DM | `createHybridChannelConfigAdapter`, `resolveChannelDmAccess`, `resolveChannelDmAllowFrom`, `resolveChannelDmPolicy`, `normalizeChannelDmPolicy`, `normalizeLegacyDmAliases` |
  | `plugin-sdk/channel-config-schema` | Builder di schema di configurazione | Solo primitive condivise dello schema di configurazione canale e builder generico |
  | `plugin-sdk/bundled-channel-config-schema` | Schemi di configurazione in bundle | Solo plugin in bundle mantenuti da OpenClaw; i nuovi plugin devono definire schemi locali al plugin |
  | `plugin-sdk/channel-config-schema-legacy` | Schemi di configurazione in bundle deprecati | Solo alias di compatibilità; usa `plugin-sdk/bundled-channel-config-schema` per i plugin in bundle mantenuti |
  | `plugin-sdk/telegram-command-config` | Helper di configurazione comandi Telegram | Normalizzazione del nome comando, rifinitura della descrizione, validazione di duplicati/conflitti |
  | `plugin-sdk/channel-policy` | Risoluzione policy gruppo/DM | `resolveChannelGroupRequireMention` |
  | `plugin-sdk/channel-lifecycle` | Helper per stato account e ciclo di vita dello stream bozza | `createAccountStatusSink`, helper di finalizzazione anteprima bozza |
  | `plugin-sdk/inbound-envelope` | Helper per busta in ingresso | Helper condivisi per route + builder di busta |
  | `plugin-sdk/inbound-reply-dispatch` | Helper per risposte in ingresso | Helper condivisi di registrazione e dispatch |
  | `plugin-sdk/messaging-targets` | Parsing dei target di messaggistica | Helper di parsing/matching dei target |
  | `plugin-sdk/outbound-media` | Helper per media in uscita | Caricamento condiviso dei media in uscita |
  | `plugin-sdk/outbound-send-deps` | Helper per dipendenze di invio in uscita | Lookup leggero `resolveOutboundSendDep` senza importare l'intero runtime in uscita |
  | `plugin-sdk/outbound-runtime` | Helper runtime in uscita | Helper per consegna in uscita, delegato identità/invio, sessione, formattazione e pianificazione payload |
  | `plugin-sdk/thread-bindings-runtime` | Helper per associazioni thread | Ciclo di vita delle associazioni thread e helper adapter |
  | `plugin-sdk/agent-media-payload` | Helper legacy per payload media | Builder del payload media agente per layout di campi legacy |
  | `plugin-sdk/channel-runtime` | Shim di compatibilità deprecato | Solo utility runtime canale legacy |
  | `plugin-sdk/channel-send-result` | Tipi del risultato di invio | Tipi del risultato di risposta |
  | `plugin-sdk/runtime-store` | Archiviazione persistente del plugin | `createPluginRuntimeStore` |
  | `plugin-sdk/runtime` | Helper runtime ampi | Helper runtime/logging/backup/installazione plugin |
  | `plugin-sdk/runtime-env` | Helper env runtime mirati | Helper per logger/env runtime, timeout, retry e backoff |
  | `plugin-sdk/plugin-runtime` | Helper runtime condivisi del plugin | Helper per comandi/hook/http/interattività del plugin |
  | `plugin-sdk/hook-runtime` | Helper pipeline hook | Helper condivisi per pipeline Webhook/hook interni |
  | `plugin-sdk/lazy-runtime` | Helper runtime lazy | `createLazyRuntimeModule`, `createLazyRuntimeMethod`, `createLazyRuntimeMethodBinder`, `createLazyRuntimeNamedExport`, `createLazyRuntimeSurface` |
  | `plugin-sdk/process-runtime` | Helper di processo | Helper exec condivisi |
  | `plugin-sdk/cli-runtime` | Helper runtime CLI | Formattazione comandi, attese, helper versione |
  | `plugin-sdk/gateway-runtime` | Helper Gateway | Client Gateway, helper di avvio pronto per event loop e helper di patch dello stato canale |
  | `plugin-sdk/config-runtime` | Shim di compatibilità configurazione deprecato | Preferisci `config-types`, `plugin-config-runtime`, `runtime-config-snapshot` e `config-mutation` |
  | `plugin-sdk/telegram-command-config` | Helper comandi Telegram | Helper di validazione comandi Telegram stabili in fallback quando la superficie del contratto Telegram in bundle non è disponibile |
  | `plugin-sdk/approval-runtime` | Helper prompt di approvazione | Payload di approvazione exec/plugin, helper capacità/profilo di approvazione, helper routing/runtime di approvazione nativa e formattazione del percorso di visualizzazione strutturata dell'approvazione |
  | `plugin-sdk/approval-auth-runtime` | Helper auth approvazione | Risoluzione approvatore, auth azione nella stessa chat |
  | `plugin-sdk/approval-client-runtime` | Helper client approvazione | Helper profilo/filtro approvazione exec nativa |
  | `plugin-sdk/approval-delivery-runtime` | Helper consegna approvazione | Adapter capacità/consegna di approvazione nativa |
  | `plugin-sdk/approval-gateway-runtime` | Helper Gateway approvazione | Helper condiviso di risoluzione Gateway approvazione |
  | `plugin-sdk/approval-handler-adapter-runtime` | Helper adapter approvazione | Helper leggeri di caricamento adapter approvazione nativa per entrypoint canale caldi |
  | `plugin-sdk/approval-handler-runtime` | Helper handler approvazione | Helper runtime più ampi per handler approvazione; preferisci i seam adapter/Gateway più mirati quando bastano |
  | `plugin-sdk/approval-native-runtime` | Helper target approvazione | Helper di associazione target/account di approvazione nativa |
  | `plugin-sdk/approval-reply-runtime` | Helper risposta approvazione | Helper payload di risposta approvazione exec/plugin |
  | `plugin-sdk/channel-runtime-context` | Helper contesto runtime canale | Helper generici register/get/watch per contesto runtime canale |
  | `plugin-sdk/security-runtime` | Helper sicurezza | Helper condivisi per trust, gating DM, contenuti esterni e raccolta segreti |
  | `plugin-sdk/ssrf-policy` | Helper policy SSRF | Helper per allowlist host e policy di rete privata |
  | `plugin-sdk/ssrf-runtime` | Helper runtime SSRF | Helper per dispatcher con pinning, fetch protetto, policy SSRF |
  | `plugin-sdk/system-event-runtime` | Helper eventi di sistema | `enqueueSystemEvent`, `peekSystemEventEntries` |
  | `plugin-sdk/heartbeat-runtime` | Helper Heartbeat | Helper eventi Heartbeat e visibilità |
  | `plugin-sdk/delivery-queue-runtime` | Helper coda di consegna | `drainPendingDeliveries` |
  | `plugin-sdk/channel-activity-runtime` | Helper attività canale | `recordChannelActivity` |
  | `plugin-sdk/dedupe-runtime` | Helper dedupe | Cache dedupe in memoria |
  | `plugin-sdk/file-access-runtime` | Helper accesso file | Helper sicuri per percorsi file/media locali |
  | `plugin-sdk/transport-ready-runtime` | Helper prontezza trasporto | `waitForTransportReady` |
  | `plugin-sdk/collection-runtime` | Helper cache limitata | `pruneMapToMaxSize` |
  | `plugin-sdk/diagnostic-runtime` | Helper gating diagnostico | `isDiagnosticFlagEnabled`, `isDiagnosticsEnabled` |
  | `plugin-sdk/error-runtime` | Helper formattazione errori | `formatUncaughtError`, `isApprovalNotFoundError`, helper grafo errori |
  | `plugin-sdk/fetch-runtime` | Helper fetch/proxy wrappati | `resolveFetch`, helper proxy, helper opzioni EnvHttpProxyAgent |
  | `plugin-sdk/host-runtime` | Helper normalizzazione host | `normalizeHostname`, `normalizeScpRemoteHost` |
  | `plugin-sdk/retry-runtime` | Helper retry | `RetryConfig`, `retryAsync`, runner di policy |
  | `plugin-sdk/allow-from` | Formattazione allowlist | `formatAllowFromLowercase` |
  | `plugin-sdk/allowlist-resolution` | Mapping input allowlist | `mapAllowlistResolutionInputs` |
  | `plugin-sdk/command-auth` | Gating comandi e helper superficie comandi | `resolveControlCommandGate`, helper autorizzazione mittente, helper registro comandi inclusa la formattazione menu argomenti dinamici |
  | `plugin-sdk/command-status` | Renderer stato/aiuto comandi | `buildCommandsMessage`, `buildCommandsMessagePaginated`, `buildHelpMessage` |
  | `plugin-sdk/secret-input` | Parsing input segreti | Helper input segreti |
  | `plugin-sdk/webhook-ingress` | Helper richiesta Webhook | Utility target Webhook |
  | `plugin-sdk/webhook-request-guards` | Helper guard corpo Webhook | Helper lettura/limite corpo richiesta |
  | `plugin-sdk/reply-runtime` | Runtime risposta condiviso | Dispatch in ingresso, Heartbeat, planner risposta, chunking |
  | `plugin-sdk/reply-dispatch-runtime` | Helper mirati dispatch risposta | Finalizzazione, dispatch provider e helper etichetta conversazione |
  | `plugin-sdk/reply-history` | Helper cronologia risposte | `buildHistoryContext`, `buildPendingHistoryContextFromMap`, `recordPendingHistoryEntry`, `clearHistoryEntriesIfEnabled` |
  | `plugin-sdk/reply-reference` | Pianificazione riferimento risposta | `createReplyReferencePlanner` |
  | `plugin-sdk/reply-chunking` | Helper chunk risposta | Helper chunking testo/markdown |
  | `plugin-sdk/session-store-runtime` | Helper store sessione | Helper percorso store + aggiornato-il |
  | `plugin-sdk/state-paths` | Helper percorsi stato | Helper directory stato e OAuth |
  | `plugin-sdk/routing` | Helper routing/chiave sessione | `resolveAgentRoute`, `buildAgentSessionKey`, `resolveDefaultAgentBoundAccountId`, helper normalizzazione chiave sessione |
  | `plugin-sdk/status-helpers` | Helper stato canale | Builder riepilogo stato canale/account, default stato runtime, helper metadati issue |
  | `plugin-sdk/target-resolver-runtime` | Helper resolver target | Helper condivisi resolver target |
  | `plugin-sdk/string-normalization-runtime` | Helper normalizzazione stringhe | Helper normalizzazione slug/stringhe |
  | `plugin-sdk/request-url` | Helper URL richiesta | Estrae URL stringa da input simili a richieste |
  | `plugin-sdk/run-command` | Helper comando temporizzato | Runner comando temporizzato con stdout/stderr normalizzati |
  | `plugin-sdk/param-readers` | Lettori parametri | Lettori parametri comuni per tool/CLI |
  | `plugin-sdk/tool-payload` | Estrazione del payload dello strumento | Estrae payload normalizzati dagli oggetti risultato degli strumenti |
  | `plugin-sdk/tool-send` | Estrazione dell'invio dello strumento | Estrae i campi canonici della destinazione di invio dagli argomenti dello strumento |
  | `plugin-sdk/temp-path` | Helper per percorsi temporanei | Helper condivisi per i percorsi di download temporanei |
  | `plugin-sdk/logging-core` | Helper di logging | Helper per logger di sottosistema e redazione |
  | `plugin-sdk/markdown-table-runtime` | Helper per tabelle Markdown | Helper per la modalità tabella Markdown |
  | `plugin-sdk/reply-payload` | Tipi di risposta ai messaggi | Tipi di payload di risposta |
  | `plugin-sdk/provider-setup` | Helper curati per la configurazione di provider locali/self-hosted | Helper di rilevamento/configurazione per provider self-hosted |
  | `plugin-sdk/self-hosted-provider-setup` | Helper mirati per la configurazione di provider self-hosted compatibili con OpenAI | Stessi helper di rilevamento/configurazione per provider self-hosted |
  | `plugin-sdk/provider-auth-runtime` | Helper di autenticazione runtime per provider | Helper runtime per la risoluzione delle chiavi API |
  | `plugin-sdk/provider-auth-api-key` | Helper di configurazione della chiave API del provider | Helper per onboarding/scrittura profilo della chiave API |
  | `plugin-sdk/provider-auth-result` | Helper per risultato di autenticazione del provider | Builder standard per risultati di autenticazione OAuth |
  | `plugin-sdk/provider-auth-login` | Helper per accesso interattivo del provider | Helper condivisi per l'accesso interattivo |
  | `plugin-sdk/provider-selection-runtime` | Helper di selezione del provider | Selezione del provider configurato o automatica e unione della configurazione grezza del provider |
  | `plugin-sdk/provider-env-vars` | Helper per variabili d'ambiente del provider | Helper di ricerca delle variabili d'ambiente di autenticazione del provider |
  | `plugin-sdk/provider-model-shared` | Helper condivisi per modello/replay del provider | `ProviderReplayFamily`, `buildProviderReplayFamilyHooks`, `normalizeModelCompat`, builder condivisi per criteri di replay, helper per endpoint del provider e helper di normalizzazione degli ID modello |
  | `plugin-sdk/provider-catalog-shared` | Helper condivisi per catalogo provider | `findCatalogTemplate`, `buildSingleProviderApiKeyCatalog`, `buildManifestModelProviderConfig`, `supportsNativeStreamingUsageCompat`, `applyProviderNativeStreamingUsageCompat` |
  | `plugin-sdk/provider-onboard` | Patch di onboarding del provider | Helper di configurazione dell'onboarding |
  | `plugin-sdk/provider-http` | Helper HTTP per provider | Helper generici per capacità HTTP/endpoint del provider, inclusi helper per moduli multipart di trascrizione audio |
  | `plugin-sdk/provider-web-fetch` | Helper web-fetch per provider | Helper di registrazione/cache del provider web-fetch |
  | `plugin-sdk/provider-web-search-config-contract` | Helper di configurazione web-search per provider | Helper mirati di configurazione/credenziali web-search per provider che non richiedono cablaggio di abilitazione del plugin |
  | `plugin-sdk/provider-web-search-contract` | Helper del contratto web-search per provider | Helper mirati del contratto di configurazione/credenziali web-search, come `createWebSearchProviderContractFields`, `enablePluginInConfig`, `resolveProviderWebSearchPluginConfig` e setter/getter di credenziali con ambito |
  | `plugin-sdk/provider-web-search` | Helper web-search per provider | Helper di registrazione/cache/runtime del provider web-search |
  | `plugin-sdk/provider-tools` | Helper di compatibilità strumenti/schema per provider | `ProviderToolCompatFamily`, `buildProviderToolCompatFamilyHooks`, pulizia schema Gemini + diagnostica e helper di compatibilità xAI come `resolveXaiModelCompatPatch` / `applyXaiModelCompat` |
  | `plugin-sdk/provider-usage` | Helper di utilizzo del provider | `fetchClaudeUsage`, `fetchGeminiUsage`, `fetchGithubCopilotUsage` e altri helper di utilizzo del provider |
  | `plugin-sdk/provider-stream` | Helper wrapper di stream per provider | `ProviderStreamFamily`, `buildProviderStreamFamilyHooks`, `composeProviderStreamWrappers`, tipi di wrapper di stream e helper wrapper condivisi per Anthropic/Bedrock/DeepSeek V4/Google/Kilocode/Moonshot/OpenAI/OpenRouter/Z.A.I/MiniMax/Copilot |
  | `plugin-sdk/provider-transport-runtime` | Helper di trasporto del provider | Helper di trasporto nativi del provider, come fetch protetto, trasformazioni dei messaggi di trasporto e stream di eventi di trasporto scrivibili |
  | `plugin-sdk/keyed-async-queue` | Coda asincrona ordinata | `KeyedAsyncQueue` |
  | `plugin-sdk/media-runtime` | Helper multimediali condivisi | Helper per recupero/trasformazione/archiviazione di media, rilevamento delle dimensioni video basato su ffprobe e builder di payload multimediali |
  | `plugin-sdk/media-generation-runtime` | Helper condivisi di generazione media | Helper condivisi di failover, selezione dei candidati e messaggi per modelli mancanti per la generazione di immagini/video/musica |
  | `plugin-sdk/media-understanding` | Helper di comprensione dei media | Tipi di provider per comprensione dei media più esportazioni di helper per immagini/audio rivolte ai provider |
  | `plugin-sdk/text-runtime` | Helper di testo condivisi | Rimozione del testo visibile all'assistente, helper di rendering/suddivisione/tabelle Markdown, helper di redazione, helper per tag direttiva, utilità per testo sicuro e helper correlati per testo/logging |
  | `plugin-sdk/text-chunking` | Helper di suddivisione del testo | Helper per la suddivisione del testo in uscita |
  | `plugin-sdk/speech` | Helper speech | Tipi di provider speech più helper rivolti ai provider per direttive, registro e validazione, e builder TTS compatibile con OpenAI |
  | `plugin-sdk/speech-core` | Core speech condiviso | Tipi di provider speech, registro, direttive, normalizzazione |
  | `plugin-sdk/realtime-transcription` | Helper per trascrizione in tempo reale | Tipi di provider, helper di registro e helper condiviso per sessione WebSocket |
  | `plugin-sdk/realtime-voice` | Helper per voce in tempo reale | Tipi di provider, helper di registro/risoluzione e helper per sessioni bridge |
  | `plugin-sdk/image-generation` | Helper di generazione immagini | Tipi di provider per generazione immagini più helper per asset immagine/data URL e builder del provider di immagini compatibile con OpenAI |
  | `plugin-sdk/image-generation-core` | Core condiviso di generazione immagini | Tipi di generazione immagini, failover, autenticazione e helper di registro |
  | `plugin-sdk/music-generation` | Helper di generazione musica | Tipi di provider/richiesta/risultato per generazione musica |
  | `plugin-sdk/music-generation-core` | Core condiviso di generazione musica | Tipi di generazione musica, helper di failover, lookup del provider e parsing dei riferimenti modello |
  | `plugin-sdk/video-generation` | Helper di generazione video | Tipi di provider/richiesta/risultato per generazione video |
  | `plugin-sdk/video-generation-core` | Core condiviso di generazione video | Tipi di generazione video, helper di failover, lookup del provider e parsing dei riferimenti modello |
  | `plugin-sdk/interactive-runtime` | Helper per risposte interattive | Normalizzazione/riduzione del payload di risposta interattiva |
  | `plugin-sdk/channel-config-primitives` | Primitive di configurazione canale | Primitive mirate per schema di configurazione canale |
  | `plugin-sdk/channel-config-writes` | Helper di scrittura della configurazione canale | Helper di autorizzazione per scrittura della configurazione canale |
  | `plugin-sdk/channel-plugin-common` | Preludio canale condiviso | Esportazioni condivise del preludio per plugin canale |
  | `plugin-sdk/channel-status` | Helper di stato canale | Helper condivisi per snapshot/riepilogo dello stato canale |
  | `plugin-sdk/allowlist-config-edit` | Helper di configurazione allowlist | Helper di modifica/lettura della configurazione allowlist |
  | `plugin-sdk/group-access` | Helper di accesso gruppo | Helper condivisi per decisioni di accesso gruppo |
  | `plugin-sdk/direct-dm` | Helper Direct-DM | Helper condivisi di autenticazione/protezione Direct-DM |
  | `plugin-sdk/extension-shared` | Helper di estensione condivisi | Primitive helper per canale passivo/stato e proxy ambient |
  | `plugin-sdk/webhook-targets` | Helper per destinazioni Webhook | Registro delle destinazioni Webhook e helper di installazione route |
  | `plugin-sdk/webhook-path` | Helper per percorsi Webhook | Helper di normalizzazione dei percorsi Webhook |
  | `plugin-sdk/web-media` | Helper web media condivisi | Helper di caricamento media remoti/locali |
  | `plugin-sdk/zod` | Riesportazione Zod | `zod` riesportato per i consumer del plugin SDK |
  | `plugin-sdk/memory-core` | Helper memory-core integrati | Superficie helper per gestore/configurazione/file/CLI della memoria |
  | `plugin-sdk/memory-core-engine-runtime` | Facciata runtime del motore memoria | Facciata runtime di indice/ricerca della memoria |
  | `plugin-sdk/memory-core-host-engine-foundation` | Motore foundation host della memoria | Esportazioni del motore foundation host della memoria |
  | `plugin-sdk/memory-core-host-engine-embeddings` | Motore embedding host della memoria | Contratti di embedding memoria, accesso al registro, provider locale e helper generici batch/remoti; i provider remoti concreti risiedono nei rispettivi plugin proprietari |
  | `plugin-sdk/memory-core-host-engine-qmd` | Motore QMD host della memoria | Esportazioni del motore QMD host della memoria |
  | `plugin-sdk/memory-core-host-engine-storage` | Motore storage host della memoria | Esportazioni del motore storage host della memoria |
  | `plugin-sdk/memory-core-host-multimodal` | Helper multimodali host della memoria | Helper multimodali host della memoria |
  | `plugin-sdk/memory-core-host-query` | Helper di query host della memoria | Helper di query host della memoria |
  | `plugin-sdk/memory-core-host-secret` | Helper segreti host della memoria | Helper segreti host della memoria |
  | `plugin-sdk/memory-core-host-events` | Helper del journal eventi host della memoria | Helper del journal eventi host della memoria |
  | `plugin-sdk/memory-core-host-status` | Helper di stato host della memoria | Helper di stato host della memoria |
  | `plugin-sdk/memory-core-host-runtime-cli` | Runtime CLI host della memoria | Helper runtime CLI host della memoria |
  | `plugin-sdk/memory-core-host-runtime-core` | Runtime core host della memoria | Helper runtime core host della memoria |
  | `plugin-sdk/memory-core-host-runtime-files` | Helper file/runtime host della memoria | Helper file/runtime host della memoria |
  | `plugin-sdk/memory-host-core` | Alias runtime core host della memoria | Alias neutrale rispetto al vendor per helper runtime core host della memoria |
  | `plugin-sdk/memory-host-events` | Alias journal eventi host della memoria | Alias neutrale rispetto al vendor per helper del journal eventi host della memoria |
  | `plugin-sdk/memory-host-files` | Alias file/runtime host della memoria | Alias neutrale rispetto al vendor per helper file/runtime host della memoria |
  | `plugin-sdk/memory-host-markdown` | Helper Markdown gestiti | Helper condivisi per Markdown gestito per plugin adiacenti alla memoria |
  | `plugin-sdk/memory-host-search` | Facciata di ricerca Active Memory | Facciata runtime lazy del gestore di ricerca Active Memory |
  | `plugin-sdk/memory-host-status` | Alias stato host della memoria | Alias neutrale rispetto al vendor per helper di stato host della memoria |
  | `plugin-sdk/testing` | Utilità di test | Barrel legacy di ampia compatibilità; preferire sottopercorsi di test mirati come `plugin-sdk/plugin-test-runtime`, `plugin-sdk/channel-test-helpers`, `plugin-sdk/channel-target-testing`, `plugin-sdk/test-env` e `plugin-sdk/test-fixtures` |
</Accordion>

Questa tabella è intenzionalmente il sottoinsieme comune per la migrazione, non l’intera superficie dell’SDK. L’elenco completo di oltre 200 entrypoint si trova in
`scripts/lib/plugin-sdk-entrypoints.json`.

Le seam helper riservate ai Plugin in bundle sono state ritirate dalla mappa di export dell’SDK pubblico, eccetto le facade di compatibilità documentate esplicitamente, come lo shim deprecato `plugin-sdk/discord` mantenuto per il pacchetto pubblicato
`@openclaw/discord@2026.3.13`. Gli helper specifici del proprietario vivono dentro il pacchetto Plugin proprietario; il comportamento condiviso dell’host dovrebbe passare attraverso contratti SDK generici come `plugin-sdk/gateway-runtime`, `plugin-sdk/security-runtime` e `plugin-sdk/plugin-config-runtime`.

Usa l’import più ristretto che corrisponde al compito. Se non riesci a trovare un export, controlla il sorgente in `src/plugin-sdk/` o chiedi ai maintainer quale contratto generico dovrebbe possederlo.

## Deprecazioni attive

Deprecazioni più ristrette che si applicano all’intero SDK dei Plugin, al contratto dei provider, alla superficie runtime e al manifest. Ognuna funziona ancora oggi ma verrà rimossa in una futura release major. La voce sotto ogni elemento mappa la vecchia API al suo sostituto canonico.

<AccordionGroup>
  <Accordion title="builder di aiuto command-auth → command-status">
    **Vecchio (`openclaw/plugin-sdk/command-auth`)**: `buildCommandsMessage`,
    `buildCommandsMessagePaginated`, `buildHelpMessage`.

    **Nuovo (`openclaw/plugin-sdk/command-status`)**: stesse firme, stessi
    export — importati solo dal sottopercorso più ristretto. `command-auth`
    li riesporta come stub di compatibilità.

    ```typescript
    // Before
    import { buildHelpMessage } from "openclaw/plugin-sdk/command-auth";

    // After
    import { buildHelpMessage } from "openclaw/plugin-sdk/command-status";
    ```

  </Accordion>

  <Accordion title="helper di gating delle menzioni → resolveInboundMentionDecision">
    **Vecchio**: `resolveInboundMentionRequirement({ facts, policy })` e
    `shouldDropInboundForMention(...)` da
    `openclaw/plugin-sdk/channel-inbound` o
    `openclaw/plugin-sdk/channel-mention-gating`.

    **Nuovo**: `resolveInboundMentionDecision({ facts, policy })` — restituisce un
    singolo oggetto di decisione invece di due chiamate separate.

    I Plugin di canale downstream (Slack, Discord, Matrix, MS Teams) sono già
    passati al nuovo modello.

  </Accordion>

  <Accordion title="shim del runtime di canale e helper delle azioni di canale">
    `openclaw/plugin-sdk/channel-runtime` è uno shim di compatibilità per Plugin di canale meno recenti. Non importarlo dal nuovo codice; usa
    `openclaw/plugin-sdk/channel-runtime-context` per registrare oggetti runtime.

    Gli helper `channelActions*` in `openclaw/plugin-sdk/channel-actions` sono
    deprecati insieme agli export di canale grezzi "actions". Esponi invece le capacità
    tramite la superficie semantica `presentation`: i Plugin di canale
    dichiarano cosa renderizzano (schede, pulsanti, selettori) invece di quali nomi
    di azione grezzi accettano.

  </Accordion>

  <Accordion title="helper tool() del provider di ricerca web → createTool() sul Plugin">
    **Vecchio**: factory `tool()` da `openclaw/plugin-sdk/provider-web-search`.

    **Nuovo**: implementa `createTool(...)` direttamente sul Plugin provider.
    OpenClaw non ha più bisogno dell’helper SDK per registrare il wrapper del tool.

  </Accordion>

  <Accordion title="envelope di canale in testo semplice → BodyForAgent">
    **Vecchio**: `formatInboundEnvelope(...)` (e
    `ChannelMessageForAgent.channelEnvelope`) per creare un envelope di prompt
    piatto in testo semplice dai messaggi di canale in ingresso.

    **Nuovo**: `BodyForAgent` più blocchi strutturati di contesto utente. I
    Plugin di canale allegano metadati di routing (thread, argomento, risposta a, reazioni) come
    campi tipizzati invece di concatenarli in una stringa di prompt. L’helper
    `formatAgentEnvelope(...)` è ancora supportato per envelope sintetizzati
    rivolti all’assistente, ma gli envelope in ingresso in testo semplice sono in
    dismissione.

    Aree interessate: `inbound_claim`, `message_received` e qualsiasi Plugin
    di canale personalizzato che post-elaborava il testo `channelEnvelope`.

  </Accordion>

  <Accordion title="tipi di discovery provider → tipi di catalogo provider">
    Quattro alias di tipo per la discovery sono ora wrapper sottili sui
    tipi dell’era del catalogo:

    | Vecchio alias             | Nuovo tipo                |
    | ------------------------- | ------------------------- |
    | `ProviderDiscoveryOrder`  | `ProviderCatalogOrder`    |
    | `ProviderDiscoveryContext`| `ProviderCatalogContext`  |
    | `ProviderDiscoveryResult` | `ProviderCatalogResult`   |
    | `ProviderPluginDiscovery` | `ProviderPluginCatalog`   |

    Inoltre il vecchio contenitore statico `ProviderCapabilities`: i Plugin
    provider dovrebbero usare hook provider espliciti come `buildReplayPolicy`,
    `normalizeToolSchemas` e `wrapStreamFn` invece di un oggetto statico.

  </Accordion>

  <Accordion title="hook della policy di ragionamento → resolveThinkingProfile">
    **Vecchio** (tre hook separati su `ProviderThinkingPolicy`):
    `isBinaryThinking(ctx)`, `supportsXHighThinking(ctx)` e
    `resolveDefaultThinkingLevel(ctx)`.

    **Nuovo**: un singolo `resolveThinkingProfile(ctx)` che restituisce un
    `ProviderThinkingProfile` con l’`id` canonico, `label` opzionale e
    lista dei livelli ordinata per rango. OpenClaw esegue automaticamente il downgrade dei valori
    memorizzati obsoleti in base al rango del profilo.

    Implementa un hook invece di tre. Gli hook legacy continuano a funzionare durante
    la finestra di deprecazione, ma non vengono composti con il risultato del profilo.

  </Accordion>

  <Accordion title="fallback del provider OAuth esterno → contracts.externalAuthProviders">
    **Vecchio**: implementare `resolveExternalOAuthProfiles(...)` senza
    dichiarare il provider nel manifest del Plugin.

    **Nuovo**: dichiara `contracts.externalAuthProviders` nel manifest del Plugin
    **e** implementa `resolveExternalAuthProfiles(...)`. Il vecchio percorso "auth
    fallback" emette un avviso a runtime e verrà rimosso.

    ```json
    {
      "contracts": {
        "externalAuthProviders": ["anthropic", "openai"]
      }
    }
    ```

  </Accordion>

  <Accordion title="lookup delle env-var del provider → setup.providers[].envVars">
    Campo manifest **vecchio**: `providerAuthEnvVars: { anthropic: ["ANTHROPIC_API_KEY"] }`.

    **Nuovo**: replica lo stesso lookup delle env-var in `setup.providers[].envVars`
    nel manifest. Questo consolida i metadati env di setup/status in un unico
    punto ed evita di avviare il runtime del Plugin solo per rispondere ai lookup
    delle env-var.

    `providerAuthEnvVars` rimane supportato tramite un adapter di compatibilità
    finché la finestra di deprecazione non si chiude.

  </Accordion>

  <Accordion title="registrazione del Plugin di memoria → registerMemoryCapability">
    **Vecchio**: tre chiamate separate —
    `api.registerMemoryPromptSection(...)`,
    `api.registerMemoryFlushPlan(...)`,
    `api.registerMemoryRuntime(...)`.

    **Nuovo**: una chiamata sull’API memory-state —
    `registerMemoryCapability(pluginId, { promptBuilder, flushPlanResolver, runtime })`.

    Stessi slot, una sola chiamata di registrazione. Gli helper di memoria additivi
    (`registerMemoryPromptSupplement`, `registerMemoryCorpusSupplement`,
    `registerMemoryEmbeddingProvider`) non sono interessati.

  </Accordion>

  <Accordion title="tipi dei messaggi di sessione subagent rinominati">
    Due alias di tipo legacy ancora esportati da `src/plugins/runtime/types.ts`:

    | Vecchio                       | Nuovo                           |
    | ----------------------------- | ------------------------------- |
    | `SubagentReadSessionParams`   | `SubagentGetSessionMessagesParams` |
    | `SubagentReadSessionResult`   | `SubagentGetSessionMessagesResult` |

    Il metodo runtime `readSession` è deprecato a favore di
    `getSessionMessages`. Stessa firma; il vecchio metodo inoltra la chiamata al
    nuovo.

  </Accordion>

  <Accordion title="runtime.tasks.flow → runtime.tasks.managedFlows">
    **Vecchio**: `runtime.tasks.flow` (singolare) restituiva un accessor live per task-flow.

    **Nuovo**: `runtime.tasks.managedFlows` mantiene il runtime di mutazione TaskFlow
    gestito per i Plugin che creano, aggiornano, annullano o eseguono task figlio da un
    flow. Usa `runtime.tasks.flows` quando il Plugin ha bisogno solo di letture basate su DTO.

    ```typescript
    // Before
    const flow = api.runtime.tasks.flow.fromToolContext(ctx);
    // After
    const flow = api.runtime.tasks.managedFlows.fromToolContext(ctx);
    ```

  </Accordion>

  <Accordion title="factory di estensioni incorporate → middleware agent tool-result">
    Trattato sopra in "Come migrare → Migrare le estensioni Pi tool-result a
    middleware". Incluso qui per completezza: il percorso rimosso solo per Pi
    `api.registerEmbeddedExtensionFactory(...)` viene sostituito da
    `api.registerAgentToolResultMiddleware(...)` con una lista runtime esplicita
    in `contracts.agentToolResultMiddleware`.
  </Accordion>

  <Accordion title="alias OpenClawSchemaType → OpenClawConfig">
    `OpenClawSchemaType` riesportato da `openclaw/plugin-sdk` ora è un
    alias di una riga per `OpenClawConfig`. Preferisci il nome canonico.

    ```typescript
    // Before
    import type { OpenClawSchemaType } from "openclaw/plugin-sdk";
    // After
    import type { OpenClawConfig } from "openclaw/plugin-sdk/config-schema";
    ```

  </Accordion>
</AccordionGroup>

<Note>
Le deprecazioni a livello di estensione (dentro i Plugin di canale/provider in bundle sotto
`extensions/`) sono tracciate dentro i rispettivi barrel `api.ts` e `runtime-api.ts`.
Non influenzano i contratti dei Plugin di terze parti e non sono elencate
qui. Se consumi direttamente il barrel locale di un Plugin in bundle, leggi i
commenti di deprecazione in quel barrel prima di aggiornare.
</Note>

## Tempistica di rimozione

| Quando                 | Cosa succede                                                            |
| ---------------------- | ----------------------------------------------------------------------- |
| **Ora**                | Le superfici deprecate emettono avvisi a runtime                        |
| **Prossima release major** | Le superfici deprecate verranno rimosse; i Plugin che le usano ancora falliranno |

Tutti i Plugin core sono già stati migrati. I Plugin esterni dovrebbero migrare
prima della prossima release major.

## Sopprimere temporaneamente gli avvisi

Imposta queste variabili d’ambiente mentre lavori alla migrazione:

```bash
OPENCLAW_SUPPRESS_PLUGIN_SDK_COMPAT_WARNING=1 openclaw gateway run
OPENCLAW_SUPPRESS_EXTENSION_API_WARNING=1 openclaw gateway run
```

Questa è una via di fuga temporanea, non una soluzione permanente.

## Correlati

- [Per iniziare](/it/plugins/building-plugins) — crea il tuo primo Plugin
- [Panoramica dell’SDK](/it/plugins/sdk-overview) — riferimento completo agli import dei sottopercorsi
- [Plugin di canale](/it/plugins/sdk-channel-plugins) — creare Plugin di canale
- [Plugin provider](/it/plugins/sdk-provider-plugins) — creare Plugin provider
- [Interni dei Plugin](/it/plugins/architecture) — approfondimento sull’architettura
- [Manifest del Plugin](/it/plugins/manifest) — riferimento dello schema del manifest
