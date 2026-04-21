---
read_when:
    - Vedi l'avviso OPENCLAW_PLUGIN_SDK_COMPAT_DEPRECATED
    - Vedi l'avviso OPENCLAW_EXTENSION_API_DEPRECATED
    - Stai aggiornando un plugin alla moderna architettura dei plugin
    - Gestisci un plugin OpenClaw esterno
sidebarTitle: Migrate to SDK
summary: Migrare dal layer legacy di retrocompatibilità al moderno SDK dei plugin
title: Migrazione dell'SDK dei plugin
x-i18n:
    generated_at: "2026-04-21T08:26:06Z"
    model: gpt-5.4
    provider: openai
    source_hash: d3d2ea9a8cc869b943ad774ac0ddb8828b80ce86432ece7b9aeed4f1edb30859
    source_path: plugins/sdk-migration.md
    workflow: 15
---

# Migrazione dell'SDK dei plugin

OpenClaw è passato da un ampio layer di retrocompatibilità a una moderna
architettura dei plugin con import focalizzati e documentati. Se il tuo plugin è stato creato prima
della nuova architettura, questa guida ti aiuta a migrare.

## Cosa sta cambiando

Il vecchio sistema dei plugin forniva due superfici molto ampie che permettevano ai plugin di importare
qualsiasi cosa servisse da un singolo punto di ingresso:

- **`openclaw/plugin-sdk/compat`** — un singolo import che riesportava decine di
  helper. È stato introdotto per mantenere funzionanti i plugin più vecchi basati su hook mentre veniva costruita la
  nuova architettura dei plugin.
- **`openclaw/extension-api`** — un bridge che dava ai plugin accesso diretto a
  helper lato host come il runner incorporato dell'agent.

Entrambe le superfici sono ora **deprecate**. Continuano a funzionare a runtime, ma i nuovi
plugin non devono usarle e i plugin esistenti dovrebbero migrare prima che la prossima
major release le rimuova.

<Warning>
  Il layer di retrocompatibilità verrà rimosso in una futura major release.
  I plugin che importano ancora da queste superfici smetteranno di funzionare quando ciò accadrà.
</Warning>

## Perché questo è cambiato

Il vecchio approccio causava problemi:

- **Avvio lento** — importare un helper caricava decine di moduli non correlati
- **Dipendenze circolari** — le riesportazioni ampie rendevano facile creare cicli di import
- **Superficie API poco chiara** — non c'era modo di capire quali export fossero stabili e quali interni

Il moderno SDK dei plugin risolve questo: ogni percorso di import (`openclaw/plugin-sdk/\<subpath\>`)
è un modulo piccolo e autonomo con uno scopo chiaro e un contratto documentato.

Sono state rimosse anche le convenience seam legacy dei provider per i canali inclusi. Import
come `openclaw/plugin-sdk/slack`, `openclaw/plugin-sdk/discord`,
`openclaw/plugin-sdk/signal`, `openclaw/plugin-sdk/whatsapp`,
le helper seam brandizzate per canale e
`openclaw/plugin-sdk/telegram-core` erano scorciatoie private del mono-repo, non
contratti plugin stabili. Usa invece subpath generici e mirati dell'SDK. All'interno dello
workspace del plugin incluso, mantieni gli helper di proprietà del provider nel `api.ts` o `runtime-api.ts`
del plugin stesso.

Esempi attuali di provider inclusi:

- Anthropic mantiene gli helper di stream specifici di Claude nel proprio seam `api.ts` /
  `contract-api.ts`
- OpenAI mantiene i builder del provider, gli helper del modello predefinito e i builder del provider realtime
  nel proprio `api.ts`
- OpenRouter mantiene il builder del provider e gli helper di onboarding/configurazione nel proprio
  `api.ts`

## Come migrare

<Steps>
  <Step title="Migrare gli handler approval-native ai capability fact">
    I plugin di canale con supporto approval ora espongono il comportamento di approvazione nativo tramite
    `approvalCapability.nativeRuntime` più il registry condiviso del contesto runtime.

    Cambiamenti principali:

    - Sostituisci `approvalCapability.handler.loadRuntime(...)` con
      `approvalCapability.nativeRuntime`
    - Sposta autenticazione/consegna specifiche dell'approvazione dal wiring legacy `plugin.auth` /
      `plugin.approvals` a `approvalCapability`
    - `ChannelPlugin.approvals` è stato rimosso dal contratto pubblico
      del plugin di canale; sposta i campi delivery/native/render in `approvalCapability`
    - `plugin.auth` resta per i flussi login/logout del canale soltanto; gli hook auth
      dell'approvazione lì non vengono più letti dal core
    - Registra oggetti runtime di proprietà del canale come client, token o app
      Bolt tramite `openclaw/plugin-sdk/channel-runtime-context`
    - Non inviare avvisi di reroute di proprietà del plugin dagli handler di approvazione nativi;
      il core ora gestisce gli avvisi instradati altrove a partire dai risultati effettivi della consegna
    - Quando passi `channelRuntime` in `createChannelManager(...)`, fornisci una
      vera superficie `createPluginRuntime().channel`. Gli stub parziali vengono rifiutati.

    Vedi `/plugins/sdk-channel-plugins` per il layout corrente della capability di approvazione.

  </Step>

  <Step title="Verificare il comportamento di fallback del wrapper Windows">
    Se il tuo plugin usa `openclaw/plugin-sdk/windows-spawn`, i wrapper Windows
    `.cmd`/`.bat` non risolti ora falliscono in modo chiuso a meno che tu non passi esplicitamente `allowShellFallback: true`.

    ```typescript
    // Prima
    const program = applyWindowsSpawnProgramPolicy({ candidate });

    // Dopo
    const program = applyWindowsSpawnProgramPolicy({
      candidate,
      // Imposta questo solo per chiamanti di compatibilità attendibili che
      // accettano intenzionalmente il fallback mediato dalla shell.
      allowShellFallback: true,
    });
    ```

    Se il chiamante non dipende intenzionalmente dal fallback della shell, non impostare
    `allowShellFallback` e gestisci invece l'errore generato.

  </Step>

  <Step title="Trovare gli import deprecati">
    Cerca nel tuo plugin gli import da una delle due superfici deprecate:

    ```bash
    grep -r "plugin-sdk/compat" my-plugin/
    grep -r "openclaw/extension-api" my-plugin/
    ```

  </Step>

  <Step title="Sostituire con import focalizzati">
    Ogni export della vecchia superficie corrisponde a uno specifico percorso di import moderno:

    ```typescript
    // Prima (layer di retrocompatibilità deprecato)
    import {
      createChannelReplyPipeline,
      createPluginRuntimeStore,
      resolveControlCommandGate,
    } from "openclaw/plugin-sdk/compat";

    // Dopo (import moderni focalizzati)
    import { createChannelReplyPipeline } from "openclaw/plugin-sdk/channel-reply-pipeline";
    import { createPluginRuntimeStore } from "openclaw/plugin-sdk/runtime-store";
    import { resolveControlCommandGate } from "openclaw/plugin-sdk/command-auth";
    ```

    Per gli helper lato host, usa il runtime del plugin iniettato invece di importare
    direttamente:

    ```typescript
    // Prima (bridge extension-api deprecato)
    import { runEmbeddedPiAgent } from "openclaw/extension-api";
    const result = await runEmbeddedPiAgent({ sessionId, prompt });

    // Dopo (runtime iniettato)
    const result = await api.runtime.agent.runEmbeddedPiAgent({ sessionId, prompt });
    ```

    Lo stesso schema si applica agli altri helper bridge legacy:

    | Vecchio import | Equivalente moderno |
    | --- | --- |
    | `resolveAgentDir` | `api.runtime.agent.resolveAgentDir` |
    | `resolveAgentWorkspaceDir` | `api.runtime.agent.resolveAgentWorkspaceDir` |
    | `resolveAgentIdentity` | `api.runtime.agent.resolveAgentIdentity` |
    | `resolveThinkingDefault` | `api.runtime.agent.resolveThinkingDefault` |
    | `resolveAgentTimeoutMs` | `api.runtime.agent.resolveAgentTimeoutMs` |
    | `ensureAgentWorkspace` | `api.runtime.agent.ensureAgentWorkspace` |
    | helper del session store | `api.runtime.agent.session.*` |

  </Step>

  <Step title="Build e test">
    ```bash
    pnpm build
    pnpm test -- my-plugin/
    ```
  </Step>
</Steps>

## Riferimento dei percorsi di import

  <Accordion title="Tabella comune dei percorsi di import">
  | Import path | Scopo | Export principali |
  | --- | --- | --- |
  | `plugin-sdk/plugin-entry` | Helper canonico per il punto di ingresso del plugin | `definePluginEntry` |
  | `plugin-sdk/core` | Riesportazione legacy umbrella per definizioni/builder del punto di ingresso del canale | `defineChannelPluginEntry`, `createChatChannelPlugin` |
  | `plugin-sdk/config-schema` | Export dello schema di configurazione root | `OpenClawSchema` |
  | `plugin-sdk/provider-entry` | Helper per punto di ingresso provider singolo | `defineSingleProviderPluginEntry` |
  | `plugin-sdk/channel-core` | Definizioni e builder focalizzati per il punto di ingresso del canale | `defineChannelPluginEntry`, `defineSetupPluginEntry`, `createChatChannelPlugin`, `createChannelPluginBase` |
  | `plugin-sdk/setup` | Helper condivisi per la procedura guidata di configurazione iniziale | Prompt allowlist, builder dello stato di configurazione iniziale |
  | `plugin-sdk/setup-runtime` | Helper runtime per la fase di configurazione iniziale | Adattatori patch di configurazione iniziale import-safe, helper per note di lookup, `promptResolvedAllowFrom`, `splitSetupEntries`, proxy di configurazione iniziale delegata |
  | `plugin-sdk/setup-adapter-runtime` | Helper per adattatori di configurazione iniziale | `createEnvPatchedAccountSetupAdapter` |
  | `plugin-sdk/setup-tools` | Helper tool per la configurazione iniziale | `formatCliCommand`, `detectBinary`, `extractArchive`, `resolveBrewExecutable`, `formatDocsLink`, `CONFIG_DIR` |
  | `plugin-sdk/account-core` | Helper multi-account | Helper per elenco account/config/action-gate |
  | `plugin-sdk/account-id` | Helper per account-id | `DEFAULT_ACCOUNT_ID`, normalizzazione dell'account-id |
  | `plugin-sdk/account-resolution` | Helper per lookup account | Helper per lookup account + fallback al predefinito |
  | `plugin-sdk/account-helpers` | Helper account mirati | Helper per elenco account/azioni account |
  | `plugin-sdk/channel-setup` | Adattatori della procedura guidata di configurazione iniziale | `createOptionalChannelSetupSurface`, `createOptionalChannelSetupAdapter`, `createOptionalChannelSetupWizard`, più `DEFAULT_ACCOUNT_ID`, `createTopLevelChannelDmPolicy`, `setSetupChannelEnabled`, `splitSetupEntries` |
  | `plugin-sdk/channel-pairing` | Primitive di pairing DM | `createChannelPairingController` |
  | `plugin-sdk/channel-reply-pipeline` | Wiring di prefisso risposta + digitazione | `createChannelReplyPipeline` |
  | `plugin-sdk/channel-config-helpers` | Factory di adattatori config | `createHybridChannelConfigAdapter` |
  | `plugin-sdk/channel-config-schema` | Builder di schema config | Tipi di schema di configurazione del canale |
  | `plugin-sdk/telegram-command-config` | Helper di configurazione dei comandi Telegram | Normalizzazione del nome comando, trim della descrizione, validazione di duplicati/conflitti |
  | `plugin-sdk/channel-policy` | Risoluzione della policy gruppo/DM | `resolveChannelGroupRequireMention` |
  | `plugin-sdk/channel-lifecycle` | Tracciamento dello stato account | `createAccountStatusSink` |
  | `plugin-sdk/inbound-envelope` | Helper per inbound envelope | Helper condivisi per route + builder envelope |
  | `plugin-sdk/inbound-reply-dispatch` | Helper per risposte in ingresso | Helper condivisi per registrazione e dispatch |
  | `plugin-sdk/messaging-targets` | Parsing dei target di messaggistica | Helper per parsing/matching dei target |
  | `plugin-sdk/outbound-media` | Helper per media in uscita | Caricamento condiviso dei media in uscita |
  | `plugin-sdk/outbound-runtime` | Helper runtime per l'uscita | Helper per identità/delega di invio in uscita e pianificazione payload |
  | `plugin-sdk/thread-bindings-runtime` | Helper per binding dei thread | Helper per ciclo di vita e adattatori dei binding dei thread |
  | `plugin-sdk/agent-media-payload` | Helper legacy per payload media | Builder del payload media dell'agent per layout legacy dei campi |
  | `plugin-sdk/channel-runtime` | Shim di compatibilità deprecato | Solo utility legacy per runtime del canale |
  | `plugin-sdk/channel-send-result` | Tipi di risultato invio | Tipi di risultato della risposta |
  | `plugin-sdk/runtime-store` | Archiviazione persistente del plugin | `createPluginRuntimeStore` |
  | `plugin-sdk/runtime` | Helper runtime ampi | Helper per runtime/logging/backup/installazione plugin |
  | `plugin-sdk/runtime-env` | Helper runtime env mirati | Logger/runtime env, timeout, retry e helper di backoff |
  | `plugin-sdk/plugin-runtime` | Helper runtime condivisi del plugin | Helper per comandi/hook/http/interattivi del plugin |
  | `plugin-sdk/hook-runtime` | Helper per pipeline di hook | Helper condivisi per pipeline di webhook/hook interni |
  | `plugin-sdk/lazy-runtime` | Helper runtime lazy | `createLazyRuntimeModule`, `createLazyRuntimeMethod`, `createLazyRuntimeMethodBinder`, `createLazyRuntimeNamedExport`, `createLazyRuntimeSurface` |
  | `plugin-sdk/process-runtime` | Helper di processo | Helper condivisi per exec |
  | `plugin-sdk/cli-runtime` | Helper runtime CLI | Formattazione comandi, attese, helper di versione |
  | `plugin-sdk/gateway-runtime` | Helper Gateway | Helper per client Gateway e patch dello stato del canale |
  | `plugin-sdk/config-runtime` | Helper di configurazione | Helper per caricare/scrivere la configurazione |
  | `plugin-sdk/telegram-command-config` | Helper per comandi Telegram | Helper di validazione dei comandi Telegram stabili in fallback quando la superficie contrattuale del bundle Telegram non è disponibile |
  | `plugin-sdk/approval-runtime` | Helper per prompt di approvazione | Payload exec/plugin approval, helper per capability/profili di approvazione, helper runtime/instradamento delle approvazioni native |
  | `plugin-sdk/approval-auth-runtime` | Helper auth per approvazione | Risoluzione degli approvatori, auth di azioni nella stessa chat |
  | `plugin-sdk/approval-client-runtime` | Helper client per approvazione | Helper per profili/filtri di approvazione exec nativa |
  | `plugin-sdk/approval-delivery-runtime` | Helper di consegna per approvazione | Adattatori di delivery/capability dell'approvazione nativa |
  | `plugin-sdk/approval-gateway-runtime` | Helper Gateway per approvazione | Helper condiviso per la risoluzione Gateway dell'approvazione |
  | `plugin-sdk/approval-handler-adapter-runtime` | Helper adattatore per approvazione | Helper leggeri per il caricamento dell'adattatore di approvazione nativa per punti di ingresso hot del canale |
  | `plugin-sdk/approval-handler-runtime` | Helper handler per approvazione | Helper runtime più ampi per handler di approvazione; preferisci seam adattatore/Gateway più mirate quando sono sufficienti |
  | `plugin-sdk/approval-native-runtime` | Helper target per approvazione | Helper per target di approvazione nativa/binding account |
  | `plugin-sdk/approval-reply-runtime` | Helper di risposta per approvazione | Helper payload di risposta per exec/plugin approval |
  | `plugin-sdk/channel-runtime-context` | Helper per contesto runtime del canale | Helper generici per register/get/watch del contesto runtime del canale |
  | `plugin-sdk/security-runtime` | Helper di sicurezza | Helper condivisi per trust, gating DM, contenuti esterni e raccolta segreti |
  | `plugin-sdk/ssrf-policy` | Helper di policy SSRF | Helper per allowlist host e policy di rete privata |
  | `plugin-sdk/ssrf-runtime` | Helper runtime SSRF | Helper per pinned-dispatcher, fetch protetto, policy SSRF |
  | `plugin-sdk/collection-runtime` | Helper di cache limitata | `pruneMapToMaxSize` |
  | `plugin-sdk/diagnostic-runtime` | Helper di gating diagnostico | `isDiagnosticFlagEnabled`, `isDiagnosticsEnabled` |
  | `plugin-sdk/error-runtime` | Helper di formattazione errori | `formatUncaughtError`, `isApprovalNotFoundError`, helper per il grafo degli errori |
  | `plugin-sdk/fetch-runtime` | Helper per fetch/proxy wrappati | `resolveFetch`, helper proxy |
  | `plugin-sdk/host-runtime` | Helper di normalizzazione host | `normalizeHostname`, `normalizeScpRemoteHost` |
  | `plugin-sdk/retry-runtime` | Helper retry | `RetryConfig`, `retryAsync`, runner di policy |
  | `plugin-sdk/allow-from` | Formattazione allowlist | `formatAllowFromLowercase` |
  | `plugin-sdk/allowlist-resolution` | Mappatura input allowlist | `mapAllowlistResolutionInputs` |
  | `plugin-sdk/command-auth` | Gating dei comandi e helper della superficie comandi | `resolveControlCommandGate`, helper per autorizzazione mittente, helper del registry dei comandi |
  | `plugin-sdk/command-status` | Renderer di stato/help dei comandi | `buildCommandsMessage`, `buildCommandsMessagePaginated`, `buildHelpMessage` |
  | `plugin-sdk/secret-input` | Parsing input segreti | Helper per input segreti |
  | `plugin-sdk/webhook-ingress` | Helper per richieste Webhook | Utility per target Webhook |
  | `plugin-sdk/webhook-request-guards` | Helper guard per body Webhook | Helper per lettura/limite del body della richiesta |
  | `plugin-sdk/reply-runtime` | Runtime condiviso della risposta | Dispatch in ingresso, Heartbeat, pianificatore della risposta, chunking |
  | `plugin-sdk/reply-dispatch-runtime` | Helper mirati per dispatch della risposta | Helper per finalize + dispatch del provider |
  | `plugin-sdk/reply-history` | Helper della cronologia delle risposte | `buildHistoryContext`, `buildPendingHistoryContextFromMap`, `recordPendingHistoryEntry`, `clearHistoryEntriesIfEnabled` |
  | `plugin-sdk/reply-reference` | Pianificazione dei riferimenti di risposta | `createReplyReferencePlanner` |
  | `plugin-sdk/reply-chunking` | Helper di chunking della risposta | Helper di chunking testo/Markdown |
  | `plugin-sdk/session-store-runtime` | Helper del session store | Helper per percorso store + updated-at |
  | `plugin-sdk/state-paths` | Helper dei percorsi di stato | Helper per directory di stato e OAuth |
  | `plugin-sdk/routing` | Helper per instradamento/session-key | `resolveAgentRoute`, `buildAgentSessionKey`, `resolveDefaultAgentBoundAccountId`, helper di normalizzazione della session-key |
  | `plugin-sdk/status-helpers` | Helper di stato del canale | Builder del riepilogo dello stato canale/account, valori predefiniti dello stato runtime, helper per metadati dei problemi |
  | `plugin-sdk/target-resolver-runtime` | Helper per risoluzione target | Helper condivisi per la risoluzione del target |
  | `plugin-sdk/string-normalization-runtime` | Helper di normalizzazione stringhe | Helper di normalizzazione slug/stringhe |
  | `plugin-sdk/request-url` | Helper URL richiesta | Estrai URL stringa da input simili a richieste |
  | `plugin-sdk/run-command` | Helper per comandi temporizzati | Runner di comandi temporizzati con stdout/stderr normalizzati |
  | `plugin-sdk/param-readers` | Lettori di parametri | Lettori comuni di parametri tool/CLI |
  | `plugin-sdk/tool-payload` | Estrazione del payload tool | Estrai payload normalizzati dagli oggetti risultato dei tool |
  | `plugin-sdk/tool-send` | Estrazione dell'invio tool | Estrai campi target di invio canonici dagli argomenti del tool |
  | `plugin-sdk/temp-path` | Helper dei percorsi temporanei | Helper condivisi per i percorsi di download temporanei |
  | `plugin-sdk/logging-core` | Helper di logging | Logger di sottosistema e helper di redazione |
  | `plugin-sdk/markdown-table-runtime` | Helper per tabelle Markdown | Helper per modalità tabella Markdown |
  | `plugin-sdk/reply-payload` | Tipi di risposta del messaggio | Tipi di payload della risposta |
  | `plugin-sdk/provider-setup` | Helper curati per la configurazione di provider locali/self-hosted | Helper per rilevamento/configurazione di provider self-hosted |
  | `plugin-sdk/self-hosted-provider-setup` | Helper focalizzati per la configurazione di provider self-hosted compatibili OpenAI | Gli stessi helper per rilevamento/configurazione di provider self-hosted |
  | `plugin-sdk/provider-auth-runtime` | Helper auth runtime del provider | Helper per la risoluzione runtime delle API key |
  | `plugin-sdk/provider-auth-api-key` | Helper per configurazione API key del provider | Helper per onboarding/scrittura profilo delle API key |
  | `plugin-sdk/provider-auth-result` | Helper per risultato auth del provider | Builder standard del risultato auth OAuth |
  | `plugin-sdk/provider-auth-login` | Helper per login interattivo del provider | Helper condivisi per login interattivo |
  | `plugin-sdk/provider-env-vars` | Helper per env var del provider | Helper per lookup delle env var auth del provider |
  | `plugin-sdk/provider-model-shared` | Helper condivisi per modello/replay del provider | `ProviderReplayFamily`, `buildProviderReplayFamilyHooks`, `normalizeModelCompat`, builder condivisi della replay-policy, helper per endpoint del provider e helper di normalizzazione del model-id |
  | `plugin-sdk/provider-catalog-shared` | Helper condivisi per il catalogo dei provider | `findCatalogTemplate`, `buildSingleProviderApiKeyCatalog`, `supportsNativeStreamingUsageCompat`, `applyProviderNativeStreamingUsageCompat` |
  | `plugin-sdk/provider-onboard` | Patch di onboarding del provider | Helper di configurazione dell'onboarding |
  | `plugin-sdk/provider-http` | Helper HTTP del provider | Helper generici per HTTP/capacità degli endpoint del provider |
  | `plugin-sdk/provider-web-fetch` | Helper web-fetch del provider | Helper per registrazione/cache del provider web-fetch |
  | `plugin-sdk/provider-web-search-config-contract` | Helper di configurazione per la ricerca web del provider | Helper mirati di configurazione/credenziali per la ricerca web per provider che non richiedono il wiring di abilitazione del plugin |
  | `plugin-sdk/provider-web-search-contract` | Helper di contratto per la ricerca web del provider | Helper mirati di contratto per configurazione/credenziali della ricerca web come `createWebSearchProviderContractFields`, `enablePluginInConfig`, `resolveProviderWebSearchPluginConfig` e setter/getter di credenziali con ambito |
  | `plugin-sdk/provider-web-search` | Helper per la ricerca web del provider | Helper per registrazione/cache/runtime del provider di ricerca web |
  | `plugin-sdk/provider-tools` | Helper di compatibilità tool/schema del provider | `ProviderToolCompatFamily`, `buildProviderToolCompatFamilyHooks`, pulizia dello schema Gemini + diagnostica e helper di compatibilità xAI come `resolveXaiModelCompatPatch` / `applyXaiModelCompat` |
  | `plugin-sdk/provider-usage` | Helper di utilizzo del provider | `fetchClaudeUsage`, `fetchGeminiUsage`, `fetchGithubCopilotUsage` e altri helper di utilizzo del provider |
  | `plugin-sdk/provider-stream` | Helper wrapper dello stream del provider | `ProviderStreamFamily`, `buildProviderStreamFamilyHooks`, `composeProviderStreamWrappers`, tipi di wrapper dello stream e helper wrapper condivisi per Anthropic/Bedrock/Google/Kilocode/Moonshot/OpenAI/OpenRouter/Z.A.I/MiniMax/Copilot |
  | `plugin-sdk/provider-transport-runtime` | Helper di trasporto del provider | Helper nativi di trasporto del provider come fetch protetto, trasformazioni dei messaggi di trasporto e stream di eventi di trasporto scrivibili |
  | `plugin-sdk/keyed-async-queue` | Coda asincrona ordinata | `KeyedAsyncQueue` |
  | `plugin-sdk/media-runtime` | Helper condivisi per i media | Helper per fetch/trasformazione/store dei media più builder di payload media |
  | `plugin-sdk/media-generation-runtime` | Helper condivisi per la generazione di media | Helper condivisi per failover, selezione dei candidati e messaggistica per modelli mancanti per generazione di immagini/video/musica |
  | `plugin-sdk/media-understanding` | Helper per la comprensione dei media | Tipi provider per la comprensione dei media più export helper lato provider per immagini/audio |
  | `plugin-sdk/text-runtime` | Helper condivisi per il testo | Rimozione del testo visibile all'assistant, helper di rendering/chunking/tabella Markdown, helper di redazione, helper per tag di direttiva, utility di testo sicuro e helper correlati di testo/logging |
  | `plugin-sdk/text-chunking` | Helper di chunking del testo | Helper di chunking del testo in uscita |
  | `plugin-sdk/speech` | Helper per speech | Tipi di provider speech più helper lato provider per direttive, registry e validazione |
  | `plugin-sdk/speech-core` | Core speech condiviso | Tipi di provider speech, registry, direttive, normalizzazione |
  | `plugin-sdk/realtime-transcription` | Helper per trascrizione realtime | Tipi di provider e helper del registry |
  | `plugin-sdk/realtime-voice` | Helper per voce realtime | Tipi di provider e helper del registry |
  | `plugin-sdk/image-generation-core` | Core condiviso per la generazione di immagini | Tipi, failover, auth e helper del registry per la generazione di immagini |
  | `plugin-sdk/music-generation` | Helper per la generazione musicale | Tipi provider/richiesta/risultato per la generazione musicale |
  | `plugin-sdk/music-generation-core` | Core condiviso per la generazione musicale | Tipi per la generazione musicale, helper di failover, lookup del provider e parsing del model-ref |
  | `plugin-sdk/video-generation` | Helper per la generazione video | Tipi provider/richiesta/risultato per la generazione video |
  | `plugin-sdk/video-generation-core` | Core condiviso per la generazione video | Tipi per la generazione video, helper di failover, lookup del provider e parsing del model-ref |
  | `plugin-sdk/interactive-runtime` | Helper per risposte interattive | Normalizzazione/riduzione del payload delle risposte interattive |
  | `plugin-sdk/channel-config-primitives` | Primitive di configurazione del canale | Primitive mirate dello schema di configurazione del canale |
  | `plugin-sdk/channel-config-writes` | Helper per la scrittura della configurazione del canale | Helper di autorizzazione per la scrittura della configurazione del canale |
  | `plugin-sdk/channel-plugin-common` | Preludio condiviso del canale | Export condivisi del preludio del plugin di canale |
  | `plugin-sdk/channel-status` | Helper di stato del canale | Helper condivisi per snapshot/riepilogo dello stato del canale |
  | `plugin-sdk/allowlist-config-edit` | Helper di configurazione della allowlist | Helper per lettura/modifica della configurazione della allowlist |
  | `plugin-sdk/group-access` | Helper di accesso al gruppo | Helper condivisi per le decisioni di accesso al gruppo |
  | `plugin-sdk/direct-dm` | Helper per Direct-DM | Helper condivisi di auth/guard per Direct-DM |
  | `plugin-sdk/extension-shared` | Helper condivisi delle extension | Primitive helper per canale passivo/stato e proxy ambient |
  | `plugin-sdk/webhook-targets` | Helper per target Webhook | Registry dei target Webhook e helper di installazione delle route |
  | `plugin-sdk/webhook-path` | Helper per percorsi Webhook | Helper di normalizzazione del percorso Webhook |
  | `plugin-sdk/web-media` | Helper condivisi per web media | Helper di caricamento media remoti/locali |
  | `plugin-sdk/zod` | Riesportazione di zod | `zod` riesportato per i consumer dell'SDK dei plugin |
  | `plugin-sdk/memory-core` | Helper inclusi per memory-core | Superficie helper per gestore/configurazione/file/CLI della memory |
  | `plugin-sdk/memory-core-engine-runtime` | Facciata runtime del motore memory | Facciata runtime per indice/ricerca della memory |
  | `plugin-sdk/memory-core-host-engine-foundation` | Motore foundation host della memory | Export del motore foundation host della memory |
  | `plugin-sdk/memory-core-host-engine-embeddings` | Motore embeddings host della memory | Contratti embeddings della memory, accesso al registry, provider locale e helper generici batch/remoti; i provider remoti concreti si trovano nei rispettivi plugin proprietari |
  | `plugin-sdk/memory-core-host-engine-qmd` | Motore QMD host della memory | Export del motore QMD host della memory |
  | `plugin-sdk/memory-core-host-engine-storage` | Motore storage host della memory | Export del motore storage host della memory |
  | `plugin-sdk/memory-core-host-multimodal` | Helper multimodali host della memory | Helper multimodali host della memory |
  | `plugin-sdk/memory-core-host-query` | Helper di query host della memory | Helper di query host della memory |
  | `plugin-sdk/memory-core-host-secret` | Helper di secret host della memory | Helper di secret host della memory |
  | `plugin-sdk/memory-core-host-events` | Helper del journal eventi host della memory | Helper del journal eventi host della memory |
  | `plugin-sdk/memory-core-host-status` | Helper di stato host della memory | Helper di stato host della memory |
  | `plugin-sdk/memory-core-host-runtime-cli` | Runtime CLI host della memory | Helper runtime CLI host della memory |
  | `plugin-sdk/memory-core-host-runtime-core` | Runtime core host della memory | Helper runtime core host della memory |
  | `plugin-sdk/memory-core-host-runtime-files` | Helper file/runtime host della memory | Helper file/runtime host della memory |
  | `plugin-sdk/memory-host-core` | Alias runtime core host della memory | Alias vendor-neutral per gli helper runtime core host della memory |
  | `plugin-sdk/memory-host-events` | Alias journal eventi host della memory | Alias vendor-neutral per gli helper del journal eventi host della memory |
  | `plugin-sdk/memory-host-files` | Alias file/runtime host della memory | Alias vendor-neutral per gli helper file/runtime host della memory |
  | `plugin-sdk/memory-host-markdown` | Helper per Markdown gestito | Helper condivisi per Markdown gestito per plugin adiacenti alla memory |
  | `plugin-sdk/memory-host-search` | Facciata di ricerca Active Memory | Facciata runtime lazy del gestore di ricerca Active Memory |
  | `plugin-sdk/memory-host-status` | Alias stato host della memory | Alias vendor-neutral per gli helper di stato host della memory |
  | `plugin-sdk/memory-lancedb` | Helper inclusi per memory-lancedb | Superficie helper di memory-lancedb |
  | `plugin-sdk/testing` | Utility di test | Helper di test e mock |
</Accordion>

Questa tabella è intenzionalmente il sottoinsieme comune per la migrazione, non l'intera
superficie dell'SDK. L'elenco completo di oltre 200 entrypoint si trova in
`scripts/lib/plugin-sdk-entrypoints.json`.

Quell'elenco include ancora alcune helper seam di plugin inclusi come
`plugin-sdk/feishu`, `plugin-sdk/feishu-setup`, `plugin-sdk/zalo`,
`plugin-sdk/zalo-setup` e `plugin-sdk/matrix*`. Questi restano esportati per
manutenzione e compatibilità dei plugin inclusi, ma sono intenzionalmente
omessi dalla tabella comune di migrazione e non sono il target consigliato per
il nuovo codice dei plugin.

La stessa regola si applica ad altre famiglie di helper inclusi come:

- helper di supporto browser: `plugin-sdk/browser-cdp`, `plugin-sdk/browser-config-runtime`, `plugin-sdk/browser-config-support`, `plugin-sdk/browser-control-auth`, `plugin-sdk/browser-node-runtime`, `plugin-sdk/browser-profiles`, `plugin-sdk/browser-security-runtime`, `plugin-sdk/browser-setup-tools`, `plugin-sdk/browser-support`
- Matrix: `plugin-sdk/matrix*`
- LINE: `plugin-sdk/line*`
- IRC: `plugin-sdk/irc*`
- superfici di helper/plugin inclusi come `plugin-sdk/googlechat`,
  `plugin-sdk/zalouser`, `plugin-sdk/bluebubbles*`,
  `plugin-sdk/mattermost*`, `plugin-sdk/msteams`,
  `plugin-sdk/nextcloud-talk`, `plugin-sdk/nostr`, `plugin-sdk/tlon`,
  `plugin-sdk/twitch`,
  `plugin-sdk/github-copilot-login`, `plugin-sdk/github-copilot-token`,
  `plugin-sdk/diagnostics-otel`, `plugin-sdk/diffs`, `plugin-sdk/llm-task`,
  `plugin-sdk/thread-ownership` e `plugin-sdk/voice-call`

`plugin-sdk/github-copilot-token` espone attualmente la superficie mirata di helper token
`DEFAULT_COPILOT_API_BASE_URL`,
`deriveCopilotApiBaseUrlFromToken` e `resolveCopilotApiToken`.

Usa l'import più mirato che corrisponde al lavoro da svolgere. Se non riesci a trovare un export,
controlla il sorgente in `src/plugin-sdk/` oppure chiedi su Discord.

## Timeline di rimozione

| Quando                 | Cosa succede                                                            |
| ---------------------- | ----------------------------------------------------------------------- |
| **Ora**                | Le superfici deprecate emettono avvisi a runtime                        |
| **Prossima major release** | Le superfici deprecate verranno rimosse; i plugin che le usano ancora smetteranno di funzionare |

Tutti i plugin core sono già stati migrati. I plugin esterni dovrebbero migrare
prima della prossima major release.

## Soppressione temporanea degli avvisi

Imposta queste variabili d'ambiente mentre lavori alla migrazione:

```bash
OPENCLAW_SUPPRESS_PLUGIN_SDK_COMPAT_WARNING=1 openclaw gateway run
OPENCLAW_SUPPRESS_EXTENSION_API_WARNING=1 openclaw gateway run
```

Questa è una via di fuga temporanea, non una soluzione permanente.

## Correlati

- [Getting Started](/it/plugins/building-plugins) — crea il tuo primo plugin
- [SDK Overview](/it/plugins/sdk-overview) — riferimento completo degli import per subpath
- [Channel Plugins](/it/plugins/sdk-channel-plugins) — creazione di plugin di canale
- [Provider Plugins](/it/plugins/sdk-provider-plugins) — creazione di plugin provider
- [Plugin Internals](/it/plugins/architecture) — approfondimento sull'architettura
- [Plugin Manifest](/it/plugins/manifest) — riferimento dello schema del manifest
