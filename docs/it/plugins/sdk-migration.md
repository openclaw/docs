---
read_when:
    - Vedi l'avviso OPENCLAW_PLUGIN_SDK_COMPAT_DEPRECATED
    - Vedi l'avviso OPENCLAW_EXTENSION_API_DEPRECATED
    - Stai aggiornando un plugin alla moderna architettura dei plugin
    - Mantieni un plugin OpenClaw esterno
sidebarTitle: Migrate to SDK
summary: Migra dal layer legacy di compatibilità retroattiva al moderno Plugin SDK
title: Migrazione del Plugin SDK
x-i18n:
    generated_at: "2026-04-24T08:53:23Z"
    model: gpt-5.4
    provider: openai
    source_hash: d1612fbdc0e472a0ba1ae310ceeca9c672afa5a7eba77637b94726ef1fedee87
    source_path: plugins/sdk-migration.md
    workflow: 15
---

OpenClaw è passato da un ampio layer di compatibilità retroattiva a una moderna architettura di plugin
con import focalizzati e documentati. Se il tuo plugin è stato creato prima
della nuova architettura, questa guida ti aiuta nella migrazione.

## Cosa sta cambiando

Il vecchio sistema di plugin forniva due superfici molto aperte che permettevano ai plugin di importare
qualsiasi cosa servisse da un singolo punto di ingresso:

- **`openclaw/plugin-sdk/compat`** — un singolo import che riesportava decine di
  helper. Era stato introdotto per mantenere funzionanti i plugin più vecchi basati su hook mentre veniva costruita la
  nuova architettura dei plugin.
- **`openclaw/extension-api`** — un bridge che dava ai plugin accesso diretto a
  helper lato host come l'embedded agent runner.

Entrambe le superfici sono ora **deprecate**. Funzionano ancora a runtime, ma i nuovi
plugin non devono usarle e i plugin esistenti dovrebbero migrare prima che la prossima major release le rimuova.

OpenClaw non rimuove né reinterpreta il comportamento documentato dei plugin nello stesso
cambiamento che introduce un sostituto. Le modifiche di contratto breaking devono prima passare
attraverso un adapter di compatibilità, diagnostica, documentazione e una finestra di deprecazione.
Questo vale per import SDK, campi del manifest, API di setup, hook e comportamento di registrazione a runtime.

<Warning>
  Il layer di compatibilità retroattiva verrà rimosso in una futura major release.
  I plugin che continuano a importare da queste superfici smetteranno di funzionare quando accadrà.
</Warning>

## Perché è cambiato

Il vecchio approccio causava problemi:

- **Avvio lento** — importare un helper caricava decine di moduli non correlati
- **Dipendenze circolari** — riesportazioni ampie rendevano facile creare cicli di import
- **Superficie API poco chiara** — nessun modo per capire quali export fossero stabili e quali interni

Il moderno Plugin SDK risolve questo problema: ogni percorso di import (`openclaw/plugin-sdk/\<subpath\>`)
è un modulo piccolo e autosufficiente con uno scopo chiaro e un contratto documentato.

Anche i seam di convenienza legacy dei provider per i canali bundled non esistono più. Import
come `openclaw/plugin-sdk/slack`, `openclaw/plugin-sdk/discord`,
`openclaw/plugin-sdk/signal`, `openclaw/plugin-sdk/whatsapp`,
seam helper branded per canale e
`openclaw/plugin-sdk/telegram-core` erano scorciatoie private del mono-repo, non
contratti plugin stabili. Usa invece subpath SDK generici e stretti. All'interno dello
spazio di lavoro del plugin bundled, mantieni gli helper posseduti dal provider nel `api.ts` o `runtime-api.ts` di quel plugin.

Esempi attuali di provider bundled:

- Anthropic mantiene gli helper di stream specifici di Claude nel proprio seam `api.ts` /
  `contract-api.ts`
- OpenAI mantiene builder di provider, helper di modello predefinito e builder del provider realtime
  nel proprio `api.ts`
- OpenRouter mantiene il builder del provider e helper di onboarding/config nel proprio
  `api.ts`

## Politica di compatibilità

Per i plugin esterni, il lavoro di compatibilità segue questo ordine:

1. aggiungere il nuovo contratto
2. mantenere il vecchio comportamento collegato tramite un adapter di compatibilità
3. emettere una diagnostica o un avviso che indichi il vecchio percorso e il sostituto
4. coprire entrambi i percorsi nei test
5. documentare la deprecazione e il percorso di migrazione
6. rimuovere solo dopo la finestra di migrazione annunciata, di solito in una major release

Se un campo del manifest è ancora accettato, gli autori dei plugin possono continuare a usarlo finché
documentazione e diagnostica non dicono il contrario. Il nuovo codice dovrebbe preferire il sostituto documentato, ma i plugin esistenti non dovrebbero rompersi durante normali minor release.

## Come migrare

<Steps>
  <Step title="Migra i gestori approval-native verso i capability fact">
    I plugin di canale con capacità di approvazione ora espongono il comportamento di approvazione nativo tramite
    `approvalCapability.nativeRuntime` più il registro condiviso del contesto runtime.

    Cambiamenti principali:

    - Sostituisci `approvalCapability.handler.loadRuntime(...)` con
      `approvalCapability.nativeRuntime`
    - Sposta auth/consegna specifiche dell'approvazione dal wiring legacy `plugin.auth` /
      `plugin.approvals` a `approvalCapability`
    - `ChannelPlugin.approvals` è stato rimosso dal contratto pubblico dei plugin
      di canale; sposta i campi delivery/native/render su `approvalCapability`
    - `plugin.auth` resta per i flussi di login/logout del canale soltanto; gli hook
      auth di approvazione lì non vengono più letti dal core
    - Registra oggetti runtime posseduti dal canale come client, token o Bolt
      app tramite `openclaw/plugin-sdk/channel-runtime-context`
    - Non inviare avvisi di reroute posseduti dal plugin dai gestori di approvazione nativi;
      il core ora possiede gli avvisi di instradamento altrove dai risultati reali di consegna
    - Quando passi `channelRuntime` a `createChannelManager(...)`, fornisci una
      reale superficie `createPluginRuntime().channel`. Stub parziali vengono rifiutati.

    Vedi `/plugins/sdk-channel-plugins` per l'attuale layout della capability di approvazione.

  </Step>

  <Step title="Verifica il comportamento di fallback dei wrapper Windows">
    Se il tuo plugin usa `openclaw/plugin-sdk/windows-spawn`, i wrapper Windows
    `.cmd`/`.bat` non risolti ora falliscono in modalità fail-closed a meno che tu non passi esplicitamente
    `allowShellFallback: true`.

    ```typescript
    // Prima
    const program = applyWindowsSpawnProgramPolicy({ candidate });

    // Dopo
    const program = applyWindowsSpawnProgramPolicy({
      candidate,
      // Impostalo solo per chiamanti di compatibilità fidati che
      // accettano intenzionalmente il fallback mediato dalla shell.
      allowShellFallback: true,
    });
    ```

    Se il tuo chiamante non dipende intenzionalmente dal fallback shell, non impostare
    `allowShellFallback` e gestisci invece l'errore generato.

  </Step>

  <Step title="Trova gli import deprecati">
    Cerca nel tuo plugin gli import da una delle due superfici deprecate:

    ```bash
    grep -r "plugin-sdk/compat" my-plugin/
    grep -r "openclaw/extension-api" my-plugin/
    ```

  </Step>

  <Step title="Sostituisci con import focalizzati">
    Ogni export dalla vecchia superficie corrisponde a uno specifico percorso di import moderno:

    ```typescript
    // Prima (layer di compatibilità retroattiva deprecato)
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

    Lo stesso modello si applica ad altri helper del bridge legacy:

    | Vecchio import | Equivalente moderno |
    | --- | --- |
    | `resolveAgentDir` | `api.runtime.agent.resolveAgentDir` |
    | `resolveAgentWorkspaceDir` | `api.runtime.agent.resolveAgentWorkspaceDir` |
    | `resolveAgentIdentity` | `api.runtime.agent.resolveAgentIdentity` |
    | `resolveThinkingDefault` | `api.runtime.agent.resolveThinkingDefault` |
    | `resolveAgentTimeoutMs` | `api.runtime.agent.resolveAgentTimeoutMs` |
    | `ensureAgentWorkspace` | `api.runtime.agent.ensureAgentWorkspace` |
    | helper dello store di sessione | `api.runtime.agent.session.*` |

  </Step>

  <Step title="Build e test">
    ```bash
    pnpm build
    pnpm test -- my-plugin/
    ```
  </Step>
</Steps>

## Riferimento dei percorsi di importazione

  <Accordion title="Tabella comune dei percorsi di importazione">
  | Percorso di importazione | Scopo | Export principali |
  | --- | --- | --- |
  | `plugin-sdk/plugin-entry` | Helper canonico di entry del plugin | `definePluginEntry` |
  | `plugin-sdk/core` | Riesportazione legacy ombrello per definizioni/builder di entry del canale | `defineChannelPluginEntry`, `createChatChannelPlugin` |
  | `plugin-sdk/config-schema` | Export dello schema di configurazione radice | `OpenClawSchema` |
  | `plugin-sdk/provider-entry` | Helper di entry per provider singolo | `defineSingleProviderPluginEntry` |
  | `plugin-sdk/channel-core` | Definizioni e builder focalizzati di entry del canale | `defineChannelPluginEntry`, `defineSetupPluginEntry`, `createChatChannelPlugin`, `createChannelPluginBase` |
  | `plugin-sdk/setup` | Helper condivisi del wizard di setup | Prompt di allowlist, builder di stato setup |
  | `plugin-sdk/setup-runtime` | Helper runtime al tempo di setup | Adapter di patch setup import-safe, helper di lookup note, `promptResolvedAllowFrom`, `splitSetupEntries`, proxy di setup delegato |
  | `plugin-sdk/setup-adapter-runtime` | Helper dell'adapter di setup | `createEnvPatchedAccountSetupAdapter` |
  | `plugin-sdk/setup-tools` | Helper di tooling per il setup | `formatCliCommand`, `detectBinary`, `extractArchive`, `resolveBrewExecutable`, `formatDocsLink`, `CONFIG_DIR` |
  | `plugin-sdk/account-core` | Helper multi-account | Helper di account list/config/action-gate |
  | `plugin-sdk/account-id` | Helper account-id | `DEFAULT_ACCOUNT_ID`, normalizzazione account-id |
  | `plugin-sdk/account-resolution` | Helper di lookup account | Helper di lookup account + default-fallback |
  | `plugin-sdk/account-helpers` | Helper account stretti | Helper di account list/account-action |
  | `plugin-sdk/channel-setup` | Adapter del wizard di setup | `createOptionalChannelSetupSurface`, `createOptionalChannelSetupAdapter`, `createOptionalChannelSetupWizard`, più `DEFAULT_ACCOUNT_ID`, `createTopLevelChannelDmPolicy`, `setSetupChannelEnabled`, `splitSetupEntries` |
  | `plugin-sdk/channel-pairing` | Primitive di pairing DM | `createChannelPairingController` |
  | `plugin-sdk/channel-reply-pipeline` | Wiring di prefisso risposta + typing | `createChannelReplyPipeline` |
  | `plugin-sdk/channel-config-helpers` | Factory di adapter di configurazione | `createHybridChannelConfigAdapter` |
  | `plugin-sdk/channel-config-schema` | Builder di schema di configurazione | Tipi di schema di configurazione del canale |
  | `plugin-sdk/telegram-command-config` | Helper di configurazione dei comandi Telegram | Normalizzazione del nome del comando, trimming della descrizione, validazione di duplicati/conflitti |
  | `plugin-sdk/channel-policy` | Risoluzione del criterio gruppo/DM | `resolveChannelGroupRequireMention` |
  | `plugin-sdk/channel-lifecycle` | Helper di stato account e ciclo di vita del draft stream | `createAccountStatusSink`, helper di finalizzazione dell'anteprima draft |
  | `plugin-sdk/inbound-envelope` | Helper di inbound envelope | Helper condivisi di route + builder di envelope |
  | `plugin-sdk/inbound-reply-dispatch` | Helper di risposta in ingresso | Helper condivisi di record-and-dispatch |
  | `plugin-sdk/messaging-targets` | Parsing delle destinazioni di messaggistica | Helper di parsing/matching delle destinazioni |
  | `plugin-sdk/outbound-media` | Helper dei media in uscita | Caricamento condiviso dei media in uscita |
  | `plugin-sdk/outbound-runtime` | Helper runtime in uscita | Helper di identità/delegato di invio in uscita e pianificazione del payload |
  | `plugin-sdk/thread-bindings-runtime` | Helper di thread-binding | Helper di ciclo di vita e adapter del thread-binding |
  | `plugin-sdk/agent-media-payload` | Helper legacy del payload media | Builder del payload media dell'agente per layout di campi legacy |
  | `plugin-sdk/channel-runtime` | Shim di compatibilità deprecato | Solo utility legacy di runtime del canale |
  | `plugin-sdk/channel-send-result` | Tipi di risultato dell'invio | Tipi di risultato della risposta |
  | `plugin-sdk/runtime-store` | Storage persistente del plugin | `createPluginRuntimeStore` |
  | `plugin-sdk/runtime` | Helper runtime ampi | Helper di runtime/logging/backup/installazione plugin |
  | `plugin-sdk/runtime-env` | Helper stretti dell'env runtime | Helper di logger/runtime env, timeout, retry e backoff |
  | `plugin-sdk/plugin-runtime` | Helper condivisi di runtime del plugin | Helper di comandi/hook/http/interattivi del plugin |
  | `plugin-sdk/hook-runtime` | Helper della pipeline hook | Helper condivisi della pipeline webhook/hook interni |
  | `plugin-sdk/lazy-runtime` | Helper di lazy runtime | `createLazyRuntimeModule`, `createLazyRuntimeMethod`, `createLazyRuntimeMethodBinder`, `createLazyRuntimeNamedExport`, `createLazyRuntimeSurface` |
  | `plugin-sdk/process-runtime` | Helper di processo | Helper exec condivisi |
  | `plugin-sdk/cli-runtime` | Helper runtime della CLI | Formattazione comandi, wait, helper di versione |
  | `plugin-sdk/gateway-runtime` | Helper del Gateway | Helper del client Gateway e patch di stato del canale |
  | `plugin-sdk/config-runtime` | Helper di configurazione | Helper di caricamento/scrittura config |
  | `plugin-sdk/telegram-command-config` | Helper dei comandi Telegram | Helper di validazione dei comandi Telegram stabili in fallback quando la superficie contrattuale del Telegram bundled non è disponibile |
  | `plugin-sdk/approval-runtime` | Helper dei prompt di approvazione | Helper di payload di approvazione exec/plugin, approval capability/profile, helper di routing/runtime di approvazione nativa |
  | `plugin-sdk/approval-auth-runtime` | Helper auth di approvazione | Risoluzione dell'approvatore, auth dell'azione same-chat |
  | `plugin-sdk/approval-client-runtime` | Helper client di approvazione | Helper di profilo/filtro di approvazione exec nativa |
  | `plugin-sdk/approval-delivery-runtime` | Helper di consegna dell'approvazione | Adapter di delivery/capability di approvazione nativa |
  | `plugin-sdk/approval-gateway-runtime` | Helper gateway di approvazione | Helper condiviso di risoluzione gateway dell'approvazione |
  | `plugin-sdk/approval-handler-adapter-runtime` | Helper dell'adapter del gestore di approvazione | Helper leggeri di caricamento dell'adapter di approvazione nativa per hot channel entrypoint |
  | `plugin-sdk/approval-handler-runtime` | Helper del gestore di approvazione | Helper runtime più ampi del gestore di approvazione; preferisci i seam più stretti adapter/gateway quando bastano |
  | `plugin-sdk/approval-native-runtime` | Helper del target di approvazione | Helper di binding target/account di approvazione nativa |
  | `plugin-sdk/approval-reply-runtime` | Helper di risposta dell'approvazione | Helper di payload della risposta di approvazione exec/plugin |
  | `plugin-sdk/channel-runtime-context` | Helper del runtime-context del canale | Helper generici di register/get/watch del runtime-context del canale |
  | `plugin-sdk/security-runtime` | Helper di sicurezza | Helper condivisi di trust, controllo DM, contenuto esterno e raccolta di secret |
  | `plugin-sdk/ssrf-policy` | Helper del criterio SSRF | Helper di allowlist host e criterio di rete privata |
  | `plugin-sdk/ssrf-runtime` | Helper runtime SSRF | Helper di pinned-dispatcher, guarded fetch e criterio SSRF |
  | `plugin-sdk/collection-runtime` | Helper di cache limitata | `pruneMapToMaxSize` |
  | `plugin-sdk/diagnostic-runtime` | Helper di gating diagnostico | `isDiagnosticFlagEnabled`, `isDiagnosticsEnabled` |
  | `plugin-sdk/error-runtime` | Helper di formattazione errori | `formatUncaughtError`, `isApprovalNotFoundError`, helper del grafo errori |
  | `plugin-sdk/fetch-runtime` | Helper wrapped fetch/proxy | `resolveFetch`, helper proxy |
  | `plugin-sdk/host-runtime` | Helper di normalizzazione host | `normalizeHostname`, `normalizeScpRemoteHost` |
  | `plugin-sdk/retry-runtime` | Helper di retry | `RetryConfig`, `retryAsync`, runner di policy |
  | `plugin-sdk/allow-from` | Formattazione allowlist | `formatAllowFromLowercase` |
  | `plugin-sdk/allowlist-resolution` | Mapping dell'input allowlist | `mapAllowlistResolutionInputs` |
  | `plugin-sdk/command-auth` | Gating dei comandi e helper della superficie dei comandi | `resolveControlCommandGate`, helper di autorizzazione del mittente, helper di registro dei comandi |
  | `plugin-sdk/command-status` | Renderer di stato/help dei comandi | `buildCommandsMessage`, `buildCommandsMessagePaginated`, `buildHelpMessage` |
  | `plugin-sdk/secret-input` | Parsing dell'input secret | Helper dell'input secret |
  | `plugin-sdk/webhook-ingress` | Helper della richiesta webhook | Utility della destinazione webhook |
  | `plugin-sdk/webhook-request-guards` | Helper di guardia del body webhook | Helper di lettura/limite del body della richiesta |
  | `plugin-sdk/reply-runtime` | Runtime condiviso della risposta | Dispatch in ingresso, Heartbeat, planner della risposta, chunking |
  | `plugin-sdk/reply-dispatch-runtime` | Helper stretti di dispatch della risposta | Helper di finalize + dispatch del provider |
  | `plugin-sdk/reply-history` | Helper della cronologia della risposta | `buildHistoryContext`, `buildPendingHistoryContextFromMap`, `recordPendingHistoryEntry`, `clearHistoryEntriesIfEnabled` |
  | `plugin-sdk/reply-reference` | Pianificazione del riferimento della risposta | `createReplyReferencePlanner` |
  | `plugin-sdk/reply-chunking` | Helper dei chunk della risposta | Helper di chunking di testo/markdown |
  | `plugin-sdk/session-store-runtime` | Helper dello store di sessione | Helper di percorso dello store + updated-at |
  | `plugin-sdk/state-paths` | Helper dei percorsi di stato | Helper della directory di stato e OAuth |
  | `plugin-sdk/routing` | Helper di instradamento/session-key | `resolveAgentRoute`, `buildAgentSessionKey`, `resolveDefaultAgentBoundAccountId`, helper di normalizzazione della session-key |
  | `plugin-sdk/status-helpers` | Helper di stato del canale | Builder di riepilogo di stato canale/account, valori predefiniti dello stato runtime, helper di metadati dei problemi |
  | `plugin-sdk/target-resolver-runtime` | Helper del resolver della destinazione | Helper condivisi del resolver della destinazione |
  | `plugin-sdk/string-normalization-runtime` | Helper di normalizzazione stringhe | Helper di normalizzazione slug/string |
  | `plugin-sdk/request-url` | Helper dell'URL della richiesta | Estrae URL stringa da input simili a richiesta |
  | `plugin-sdk/run-command` | Helper di comandi temporizzati | Runner di comandi temporizzati con stdout/stderr normalizzati |
  | `plugin-sdk/param-readers` | Lettori di parametri | Lettori di parametri comuni di strumenti/CLI |
  | `plugin-sdk/tool-payload` | Estrazione del payload dello strumento | Estrae payload normalizzati da oggetti di risultato dello strumento |
  | `plugin-sdk/tool-send` | Estrazione dell'invio dello strumento | Estrae campi canonici della destinazione di invio dagli argomenti dello strumento |
  | `plugin-sdk/temp-path` | Helper del percorso temporaneo | Helper condivisi del percorso di download temporaneo |
  | `plugin-sdk/logging-core` | Helper di logging | Logger di sottosistema e helper di redazione |
  | `plugin-sdk/markdown-table-runtime` | Helper delle tabelle Markdown | Helper della modalità tabella Markdown |
  | `plugin-sdk/reply-payload` | Tipi di risposta dei messaggi | Tipi di payload della risposta |
  | `plugin-sdk/provider-setup` | Helper curati di setup del provider locale/self-hosted | Helper di discovery/config del provider self-hosted |
  | `plugin-sdk/self-hosted-provider-setup` | Helper focalizzati di setup del provider self-hosted compatibile OpenAI | Gli stessi helper di discovery/config del provider self-hosted |
  | `plugin-sdk/provider-auth-runtime` | Helper auth runtime del provider | Helper di risoluzione runtime della chiave API |
  | `plugin-sdk/provider-auth-api-key` | Helper di setup della chiave API del provider | Helper di onboarding/scrittura del profilo della chiave API |
  | `plugin-sdk/provider-auth-result` | Helper del risultato auth del provider | Builder standard del risultato auth OAuth |
  | `plugin-sdk/provider-auth-login` | Helper di login interattivo del provider | Helper condivisi di login interattivo |
  | `plugin-sdk/provider-selection-runtime` | Helper di selezione del provider | Selezione del provider configurato-o-auto e merge della configurazione raw del provider |
  | `plugin-sdk/provider-env-vars` | Helper delle variabili env del provider | Helper di lookup delle variabili env auth del provider |
  | `plugin-sdk/provider-model-shared` | Helper condivisi di modello/replay del provider | `ProviderReplayFamily`, `buildProviderReplayFamilyHooks`, `normalizeModelCompat`, builder condivisi della replay-policy, helper dell'endpoint del provider e helper di normalizzazione del model-id |
  | `plugin-sdk/provider-catalog-shared` | Helper condivisi del catalogo provider | `findCatalogTemplate`, `buildSingleProviderApiKeyCatalog`, `supportsNativeStreamingUsageCompat`, `applyProviderNativeStreamingUsageCompat` |
| `plugin-sdk/provider-onboard` | Patch di onboarding del provider | Helper di configurazione dell'onboarding |
| `plugin-sdk/provider-http` | Helper HTTP del provider | Helper generici di capacità HTTP/endpoint del provider, inclusi helper multipart form per la trascrizione audio |
| `plugin-sdk/provider-web-fetch` | Helper del web-fetch del provider | Helper di registrazione/cache del provider web-fetch |
| `plugin-sdk/provider-web-search-config-contract` | Helper di configurazione della ricerca web del provider | Helper stretti di configurazione/credenziali per la ricerca web per provider che non necessitano del wiring di abilitazione del plugin |
| `plugin-sdk/provider-web-search-contract` | Helper di contratto della ricerca web del provider | Helper stretti di contratto di configurazione/credenziali della ricerca web come `createWebSearchProviderContractFields`, `enablePluginInConfig`, `resolveProviderWebSearchPluginConfig` e setter/getter di credenziali con scope |
| `plugin-sdk/provider-web-search` | Helper della ricerca web del provider | Helper di registrazione/cache/runtime del provider di ricerca web |
| `plugin-sdk/provider-tools` | Helper di compatibilità di strumenti/schema del provider | `ProviderToolCompatFamily`, `buildProviderToolCompatFamilyHooks`, pulizia schema Gemini + diagnostica, e helper di compatibilità xAI come `resolveXaiModelCompatPatch` / `applyXaiModelCompat` |
| `plugin-sdk/provider-usage` | Helper di utilizzo del provider | `fetchClaudeUsage`, `fetchGeminiUsage`, `fetchGithubCopilotUsage` e altri helper di utilizzo del provider |
| `plugin-sdk/provider-stream` | Helper wrapper di stream del provider | `ProviderStreamFamily`, `buildProviderStreamFamilyHooks`, `composeProviderStreamWrappers`, tipi di stream wrapper e helper wrapper condivisi per Anthropic/Bedrock/Google/Kilocode/Moonshot/OpenAI/OpenRouter/Z.A.I/MiniMax/Copilot |
| `plugin-sdk/provider-transport-runtime` | Helper di trasporto del provider | Helper nativi di trasporto del provider come guarded fetch, trasformazioni dei messaggi di trasporto e stream di eventi di trasporto scrivibili |
| `plugin-sdk/keyed-async-queue` | Coda async ordinata | `KeyedAsyncQueue` |
| `plugin-sdk/media-runtime` | Helper media condivisi | Helper di fetch/transform/store dei media più builder del payload media |
| `plugin-sdk/media-generation-runtime` | Helper condivisi di generazione media | Helper condivisi di failover, selezione dei candidati e messaggistica per modelli mancanti per generazione di immagini/video/musica |
| `plugin-sdk/media-understanding` | Helper di comprensione dei media | Tipi di provider per la comprensione dei media più export helper image/audio orientati al provider |
| `plugin-sdk/text-runtime` | Helper testo condivisi | Rimozione del testo visibile all'assistente, helper di render/chunking/tabella Markdown, helper di redazione, helper dei tag direttiva, utility di testo sicuro e helper correlati di testo/logging |
| `plugin-sdk/text-chunking` | Helper di chunking del testo | Helper di chunking del testo in uscita |
| `plugin-sdk/speech` | Helper speech | Tipi di provider speech più helper orientati al provider per direttive, registro e validazione |
| `plugin-sdk/speech-core` | Core speech condiviso | Tipi di provider speech, registro, direttive, normalizzazione |
| `plugin-sdk/realtime-transcription` | Helper di trascrizione realtime | Tipi di provider, helper di registro e helper condiviso di sessione WebSocket |
| `plugin-sdk/realtime-voice` | Helper voce realtime | Tipi di provider, helper di registro/risoluzione e helper di sessione bridge |
| `plugin-sdk/image-generation-core` | Core condiviso di generazione immagini | Tipi di generazione immagini, failover, auth e helper di registro |
| `plugin-sdk/music-generation` | Helper di generazione musicale | Tipi di provider/richiesta/risultato per la generazione musicale |
| `plugin-sdk/music-generation-core` | Core condiviso di generazione musicale | Tipi di generazione musicale, helper di failover, lookup del provider e parsing del model-ref |
| `plugin-sdk/video-generation` | Helper di generazione video | Tipi di provider/richiesta/risultato per la generazione video |
| `plugin-sdk/video-generation-core` | Core condiviso di generazione video | Tipi di generazione video, helper di failover, lookup del provider e parsing del model-ref |
| `plugin-sdk/interactive-runtime` | Helper di risposta interattiva | Normalizzazione/riduzione del payload di risposta interattiva |
| `plugin-sdk/channel-config-primitives` | Primitive di configurazione del canale | Primitive strette di config-schema del canale |
| `plugin-sdk/channel-config-writes` | Helper di scrittura della configurazione del canale | Helper di autorizzazione alla scrittura della configurazione del canale |
| `plugin-sdk/channel-plugin-common` | Prelude condiviso del canale | Export condivisi del prelude del plugin di canale |
| `plugin-sdk/channel-status` | Helper di stato del canale | Helper condivisi di snapshot/riepilogo dello stato del canale |
| `plugin-sdk/allowlist-config-edit` | Helper di configurazione dell'allowlist | Helper di modifica/lettura della configurazione dell'allowlist |
| `plugin-sdk/group-access` | Helper di accesso ai gruppi | Helper condivisi di decisione sull'accesso ai gruppi |
| `plugin-sdk/direct-dm` | Helper direct-DM | Helper condivisi di auth/guard per DM diretti |
| `plugin-sdk/extension-shared` | Helper condivisi dell'estensione | Primitive helper di canale/status passivo e proxy ambient |
| `plugin-sdk/webhook-targets` | Helper delle destinazioni webhook | Registro delle destinazioni webhook e helper di installazione route |
| `plugin-sdk/webhook-path` | Helper del percorso webhook | Helper di normalizzazione del percorso webhook |
| `plugin-sdk/web-media` | Helper condivisi dei media web | Helper di caricamento media remoti/locali |
| `plugin-sdk/zod` | Riesportazione Zod | `zod` riesportato per i consumer del Plugin SDK |
| `plugin-sdk/memory-core` | Helper bundled di memory-core | Superficie helper di memory manager/config/file/CLI |
| `plugin-sdk/memory-core-engine-runtime` | Facciata runtime del motore di memoria | Facciata runtime di index/search della memoria |
| `plugin-sdk/memory-core-host-engine-foundation` | Motore foundation host della memoria | Export del motore foundation host della memoria |
| `plugin-sdk/memory-core-host-engine-embeddings` | Motore embedding host della memoria | Contratti di embedding della memoria, accesso al registro, provider locale e helper generici batch/remoti; i provider remoti concreti vivono nei plugin proprietari |
| `plugin-sdk/memory-core-host-engine-qmd` | Motore QMD host della memoria | Export del motore QMD host della memoria |
| `plugin-sdk/memory-core-host-engine-storage` | Motore storage host della memoria | Export del motore storage host della memoria |
| `plugin-sdk/memory-core-host-multimodal` | Helper multimodali host della memoria | Helper multimodali host della memoria |
| `plugin-sdk/memory-core-host-query` | Helper query host della memoria | Helper query host della memoria |
| `plugin-sdk/memory-core-host-secret` | Helper secret host della memoria | Helper secret host della memoria |
| `plugin-sdk/memory-core-host-events` | Helper del journal eventi host della memoria | Helper del journal eventi host della memoria |
| `plugin-sdk/memory-core-host-status` | Helper di stato host della memoria | Helper di stato host della memoria |
| `plugin-sdk/memory-core-host-runtime-cli` | Runtime CLI host della memoria | Helper runtime CLI host della memoria |
| `plugin-sdk/memory-core-host-runtime-core` | Runtime core host della memoria | Helper runtime core host della memoria |
| `plugin-sdk/memory-core-host-runtime-files` | Helper file/runtime host della memoria | Helper file/runtime host della memoria |
| `plugin-sdk/memory-host-core` | Alias runtime core host della memoria | Alias vendor-neutral per helper runtime core host della memoria |
| `plugin-sdk/memory-host-events` | Alias journal eventi host della memoria | Alias vendor-neutral per helper del journal eventi host della memoria |
| `plugin-sdk/memory-host-files` | Alias file/runtime host della memoria | Alias vendor-neutral per helper file/runtime host della memoria |
| `plugin-sdk/memory-host-markdown` | Helper Markdown gestito | Helper condivisi di managed-markdown per plugin adiacenti alla memoria |
| `plugin-sdk/memory-host-search` | Facciata di ricerca della memoria attiva | Facciata runtime lazy del search-manager della memoria attiva |
| `plugin-sdk/memory-host-status` | Alias stato host della memoria | Alias vendor-neutral per helper di stato host della memoria |
| `plugin-sdk/memory-lancedb` | Helper bundled di memory-lancedb | Superficie helper di memory-lancedb |
| `plugin-sdk/testing` | Utility di test | Helper di test e mock |
</Accordion>

Questa tabella è intenzionalmente il sottoinsieme comune di migrazione, non l'intera
superficie SDK. L'elenco completo di oltre 200 entrypoint si trova in
`scripts/lib/plugin-sdk-entrypoints.json`.

Quell'elenco include ancora alcuni seam helper di plugin bundled come
`plugin-sdk/feishu`, `plugin-sdk/feishu-setup`, `plugin-sdk/zalo`,
`plugin-sdk/zalo-setup` e `plugin-sdk/matrix*`. Questi restano esportati per
manutenzione dei plugin bundled e compatibilità, ma sono intenzionalmente
omessi dalla tabella comune di migrazione e non sono la destinazione consigliata per
nuovo codice di plugin.

La stessa regola si applica ad altre famiglie di helper bundled come:

- helper di supporto browser: `plugin-sdk/browser-cdp`, `plugin-sdk/browser-config-runtime`, `plugin-sdk/browser-config-support`, `plugin-sdk/browser-control-auth`, `plugin-sdk/browser-node-runtime`, `plugin-sdk/browser-profiles`, `plugin-sdk/browser-security-runtime`, `plugin-sdk/browser-setup-tools`, `plugin-sdk/browser-support`
- Matrix: `plugin-sdk/matrix*`
- LINE: `plugin-sdk/line*`
- IRC: `plugin-sdk/irc*`
- superfici helper/plugin bundled come `plugin-sdk/googlechat`,
  `plugin-sdk/zalouser`, `plugin-sdk/bluebubbles*`,
  `plugin-sdk/mattermost*`, `plugin-sdk/msteams`,
  `plugin-sdk/nextcloud-talk`, `plugin-sdk/nostr`, `plugin-sdk/tlon`,
  `plugin-sdk/twitch`,
  `plugin-sdk/github-copilot-login`, `plugin-sdk/github-copilot-token`,
  `plugin-sdk/diagnostics-otel`, `plugin-sdk/diffs`, `plugin-sdk/llm-task`,
  `plugin-sdk/thread-ownership` e `plugin-sdk/voice-call`

`plugin-sdk/github-copilot-token` attualmente espone la superficie stretta degli helper token
`DEFAULT_COPILOT_API_BASE_URL`,
`deriveCopilotApiBaseUrlFromToken` e `resolveCopilotApiToken`.

Usa l'import più stretto che corrisponde al lavoro. Se non riesci a trovare un export,
controlla il sorgente in `src/plugin-sdk/` oppure chiedi su Discord.

## Timeline di rimozione

| Quando                 | Cosa succede                                                           |
| ---------------------- | ---------------------------------------------------------------------- |
| **Ora**                | Le superfici deprecate emettono avvisi a runtime                       |
| **Prossima major release** | Le superfici deprecate verranno rimosse; i plugin che le usano ancora falliranno |

Tutti i plugin core sono già stati migrati. I plugin esterni dovrebbero migrare
prima della prossima major release.

## Sopprimere temporaneamente gli avvisi

Imposta queste variabili di ambiente mentre lavori alla migrazione:

```bash
OPENCLAW_SUPPRESS_PLUGIN_SDK_COMPAT_WARNING=1 openclaw gateway run
OPENCLAW_SUPPRESS_EXTENSION_API_WARNING=1 openclaw gateway run
```

Questo è un escape hatch temporaneo, non una soluzione permanente.

## Correlati

- [Per iniziare](/it/plugins/building-plugins) — crea il tuo primo plugin
- [Panoramica SDK](/it/plugins/sdk-overview) — riferimento completo agli import per subpath
- [Plugin di canale](/it/plugins/sdk-channel-plugins) — creare plugin di canale
- [Plugin provider](/it/plugins/sdk-provider-plugins) — creare plugin provider
- [Interni dei plugin](/it/plugins/architecture) — approfondimento architetturale
- [Manifest del plugin](/it/plugins/manifest) — riferimento dello schema del manifest
