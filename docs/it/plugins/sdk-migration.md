---
read_when:
    - Vedi l'avviso OPENCLAW_PLUGIN_SDK_COMPAT_DEPRECATED
    - Vedi l'avviso OPENCLAW_EXTENSION_API_DEPRECATED
    - Hai usato `api.registerEmbeddedExtensionFactory` prima di OpenClaw 2026.4.25
    - Stai aggiornando un Plugin all'architettura moderna dei Plugin
    - Gestisci un Plugin OpenClaw esterno
sidebarTitle: Migrate to SDK
summary: Migrare dal layer legacy di retrocompatibilità al moderno SDK dei Plugin
title: Migrazione all'SDK dei Plugin
x-i18n:
    generated_at: "2026-04-25T18:21:22Z"
    model: gpt-5.4
    provider: openai
    source_hash: c7ab0369fc6e43961a41cff882b0c05653a6a1e3f919ef8a3620c868c16c02ce
    source_path: plugins/sdk-migration.md
    workflow: 15
---

OpenClaw è passato da un ampio layer di retrocompatibilità a una moderna
architettura dei Plugin con import mirati e documentati. Se il tuo Plugin è stato creato prima
della nuova architettura, questa guida ti aiuta a migrare.

## Cosa sta cambiando

Il vecchio sistema dei Plugin forniva due superfici molto ampie che permettevano ai Plugin di importare
qualsiasi cosa servisse da un singolo punto di ingresso:

- **`openclaw/plugin-sdk/compat`** — un singolo import che riesportava decine di
  helper. È stato introdotto per mantenere funzionanti i vecchi Plugin basati su hook mentre la
  nuova architettura dei Plugin veniva sviluppata.
- **`openclaw/extension-api`** — un bridge che dava ai Plugin accesso diretto a
  helper lato host come l'embedded agent runner.
- **`api.registerEmbeddedExtensionFactory(...)`** — un hook rimosso per estensioni bundled solo Pi
  che poteva osservare eventi dell'embedded runner come
  `tool_result`.

Le superfici di import ampie sono ora **deprecate**. Continuano a funzionare a runtime,
ma i nuovi Plugin non devono usarle e i Plugin esistenti dovrebbero migrare prima
che la prossima major release le rimuova. L'API di registrazione della embedded extension factory
solo Pi è stata rimossa; usa invece il middleware dei risultati degli strumenti.

OpenClaw non rimuove né reinterpreta il comportamento documentato dei Plugin nella stessa
modifica che introduce un sostituto. Le modifiche breaking del contratto devono prima passare
attraverso un adapter di compatibilità, diagnostica, documentazione e una finestra di deprecazione.
Questo vale per gli import dell'SDK, i campi del manifest, le API di setup, gli hook e il comportamento
di registrazione a runtime.

<Warning>
  Il layer di retrocompatibilità sarà rimosso in una futura major release.
  I Plugin che importano ancora da queste superfici smetteranno di funzionare quando accadrà.
  Le registrazioni di embedded extension factory solo Pi non vengono già più caricate.
</Warning>

## Perché è cambiato

Il vecchio approccio causava problemi:

- **Avvio lento** — importare un helper caricava decine di moduli non correlati
- **Dipendenze circolari** — le riesportazioni ampie rendevano facile creare cicli di import
- **Superficie API poco chiara** — non c'era modo di capire quali export fossero stabili e quali interni

Il moderno SDK dei Plugin risolve questo problema: ogni percorso di import (`openclaw/plugin-sdk/\<subpath\>`)
è un modulo piccolo e autosufficiente con uno scopo chiaro e un contratto documentato.

Anche le seam di convenienza legacy dei provider per i canali bundled sono state rimosse. Import
come `openclaw/plugin-sdk/slack`, `openclaw/plugin-sdk/discord`,
`openclaw/plugin-sdk/signal`, `openclaw/plugin-sdk/whatsapp`,
seam di helper marchiati per canale e
`openclaw/plugin-sdk/telegram-core` erano scorciatoie private del mono-repo, non
contratti stabili per i Plugin. Usa invece subpath generici e stretti dell'SDK. All'interno del
workspace del Plugin bundled, mantieni gli helper di proprietà del provider nel file
`api.ts` o `runtime-api.ts` di quel Plugin.

Esempi attuali di provider bundled:

- Anthropic mantiene gli helper di stream specifici di Claude nella propria seam `api.ts` /
  `contract-api.ts`
- OpenAI mantiene i builder dei provider, gli helper del modello predefinito e i builder del provider
  realtime nel proprio `api.ts`
- OpenRouter mantiene il provider builder e gli helper di onboarding/configurazione nel proprio
  `api.ts`

## Policy di compatibilità

Per i Plugin esterni, il lavoro di compatibilità segue questo ordine:

1. aggiungere il nuovo contratto
2. mantenere il vecchio comportamento instradato attraverso un adapter di compatibilità
3. emettere una diagnostica o un avviso che indichi il vecchio percorso e il sostituto
4. coprire entrambi i percorsi nei test
5. documentare la deprecazione e il percorso di migrazione
6. rimuovere solo dopo la finestra di migrazione annunciata, di solito in una major release

Se un campo del manifest è ancora accettato, gli autori dei Plugin possono continuare a usarlo finché
la documentazione e la diagnostica non indicano diversamente. Il nuovo codice dovrebbe preferire
il sostituto documentato, ma i Plugin esistenti non dovrebbero rompersi durante normali
minor release.

## Come migrare

<Steps>
  <Step title="Migrare le estensioni Pi tool-result al middleware">
    I Plugin bundled devono sostituire gli handler `api.registerEmbeddedExtensionFactory(...)`
    dei risultati degli strumenti solo Pi con middleware neutrali rispetto al runtime.

    ```typescript
    // Pi and Codex runtime dynamic tools
    api.registerAgentToolResultMiddleware(async (event) => {
      return compactToolResult(event);
    }, {
      runtimes: ["pi", "codex"],
    });
    ```

    Aggiorna contemporaneamente il manifest del Plugin:

    ```json
    {
      "contracts": {
        "agentToolResultMiddleware": ["pi", "codex"]
      }
    }
    ```

    I Plugin esterni non possono registrare middleware dei risultati degli strumenti perché possono
    riscrivere output degli strumenti ad alta fiducia prima che il modello li veda.

  </Step>

  <Step title="Migrare gli handler approval-native ai fatti di capability">
    I Plugin di canale con capability di approvazione ora espongono il comportamento nativo di approvazione tramite
    `approvalCapability.nativeRuntime` più il registro condiviso del contesto runtime.

    Modifiche principali:

    - Sostituisci `approvalCapability.handler.loadRuntime(...)` con
      `approvalCapability.nativeRuntime`
    - Sposta l'autenticazione/consegna specifica dell'approvazione fuori dal wiring legacy `plugin.auth` /
      `plugin.approvals` e dentro `approvalCapability`
    - `ChannelPlugin.approvals` è stato rimosso dal contratto pubblico
      del Plugin di canale; sposta i campi delivery/native/render in `approvalCapability`
    - `plugin.auth` rimane solo per i flussi di login/logout del canale; gli hook di auth
      per l'approvazione lì non vengono più letti dal core
    - Registra oggetti runtime di proprietà del canale come client, token o app
      Bolt tramite `openclaw/plugin-sdk/channel-runtime-context`
    - Non inviare avvisi di reroute di proprietà del Plugin dagli handler nativi di approvazione;
      il core ora gestisce gli avvisi routed-elsewhere a partire dai risultati reali di consegna
    - Quando passi `channelRuntime` in `createChannelManager(...)`, fornisci una
      vera superficie `createPluginRuntime().channel`. Gli stub parziali vengono rifiutati.

    Vedi `/plugins/sdk-channel-plugins` per l'attuale layout della capability di approvazione.

  </Step>

  <Step title="Verificare il comportamento di fallback del wrapper Windows">
    Se il tuo Plugin usa `openclaw/plugin-sdk/windows-spawn`, i wrapper Windows
    `.cmd`/`.bat` non risolti ora falliscono in modo chiuso a meno che tu non passi esplicitamente
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
    `allowShellFallback` e gestisci invece l'errore sollevato.

  </Step>

  <Step title="Trovare gli import deprecati">
    Cerca nel tuo Plugin gli import da una delle due superfici deprecate:

    ```bash
    grep -r "plugin-sdk/compat" my-plugin/
    grep -r "openclaw/extension-api" my-plugin/
    ```

  </Step>

  <Step title="Sostituire con import mirati">
    Ogni export della vecchia superficie corrisponde a uno specifico percorso di import moderno:

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

    Per gli helper lato host, usa il runtime del Plugin iniettato invece di importare
    direttamente:

    ```typescript
    // Before (deprecated extension-api bridge)
    import { runEmbeddedPiAgent } from "openclaw/extension-api";
    const result = await runEmbeddedPiAgent({ sessionId, prompt });

    // After (injected runtime)
    const result = await api.runtime.agent.runEmbeddedPiAgent({ sessionId, prompt });
    ```

    Lo stesso schema si applica ad altri helper del bridge legacy:

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

  <Step title="Compilare e testare">
    ```bash
    pnpm build
    pnpm test -- my-plugin/
    ```
  </Step>
</Steps>

## Riferimento dei percorsi di import

  <Accordion title="Tabella comune dei percorsi di import">
  | Percorso di import | Scopo | Export principali |
  | --- | --- | --- |
  | `plugin-sdk/plugin-entry` | Helper canonico per l'entry del Plugin | `definePluginEntry` |
  | `plugin-sdk/core` | Riesportazione legacy ombrello per definizioni/builder di entry del canale | `defineChannelPluginEntry`, `createChatChannelPlugin` |
  | `plugin-sdk/config-schema` | Export dello schema di configurazione root | `OpenClawSchema` |
  | `plugin-sdk/provider-entry` | Helper di entry per provider singolo | `defineSingleProviderPluginEntry` |
  | `plugin-sdk/channel-core` | Definizioni e builder mirati per l'entry del canale | `defineChannelPluginEntry`, `defineSetupPluginEntry`, `createChatChannelPlugin`, `createChannelPluginBase` |
  | `plugin-sdk/setup` | Helper condivisi per il setup wizard | Prompt allowlist, builder dello stato di setup |
  | `plugin-sdk/setup-runtime` | Helper runtime per il setup | Adapter sicuri da importare per patch di setup, helper per note di lookup, `promptResolvedAllowFrom`, `splitSetupEntries`, proxy di setup delegati |
  | `plugin-sdk/setup-adapter-runtime` | Helper per gli adapter di setup | `createEnvPatchedAccountSetupAdapter` |
  | `plugin-sdk/setup-tools` | Helper di tooling per il setup | `formatCliCommand`, `detectBinary`, `extractArchive`, `resolveBrewExecutable`, `formatDocsLink`, `CONFIG_DIR` |
  | `plugin-sdk/account-core` | Helper per account multipli | Helper per elenco account/config/action-gate |
  | `plugin-sdk/account-id` | Helper per account-id | `DEFAULT_ACCOUNT_ID`, normalizzazione di account-id |
  | `plugin-sdk/account-resolution` | Helper di lookup account | Helper per lookup account + fallback predefinito |
  | `plugin-sdk/account-helpers` | Helper di account mirati | Helper per elenco account/azioni account |
  | `plugin-sdk/channel-setup` | Adapter del setup wizard | `createOptionalChannelSetupSurface`, `createOptionalChannelSetupAdapter`, `createOptionalChannelSetupWizard`, più `DEFAULT_ACCOUNT_ID`, `createTopLevelChannelDmPolicy`, `setSetupChannelEnabled`, `splitSetupEntries` |
  | `plugin-sdk/channel-pairing` | Primitive per pairing DM | `createChannelPairingController` |
  | `plugin-sdk/channel-reply-pipeline` | Wiring di prefisso risposta + digitazione | `createChannelReplyPipeline` |
  | `plugin-sdk/channel-config-helpers` | Factory di adapter di configurazione | `createHybridChannelConfigAdapter` |
  | `plugin-sdk/channel-config-schema` | Builder di schema di configurazione | Primitive condivise di schema di configurazione del canale; gli export di schema con nome del canale bundled sono solo compatibilità legacy |
  | `plugin-sdk/telegram-command-config` | Helper di configurazione dei comandi Telegram | Normalizzazione del nome del comando, trimming della descrizione, validazione di duplicati/conflitti |
  | `plugin-sdk/channel-policy` | Risoluzione delle policy gruppo/DM | `resolveChannelGroupRequireMention` |
  | `plugin-sdk/channel-lifecycle` | Helper per stato account e ciclo di vita dello stream di bozze | `createAccountStatusSink`, helper di finalizzazione dell'anteprima bozza |
  | `plugin-sdk/inbound-envelope` | Helper per envelope in entrata | Helper condivisi per routing + costruzione envelope |
  | `plugin-sdk/inbound-reply-dispatch` | Helper per risposte in entrata | Helper condivisi per registrazione e dispatch |
  | `plugin-sdk/messaging-targets` | Parsing dei target di messaggistica | Helper per parsing/matching dei target |
  | `plugin-sdk/outbound-media` | Helper per media in uscita | Caricamento condiviso dei media in uscita |
  | `plugin-sdk/outbound-runtime` | Helper runtime in uscita | Helper per consegna in uscita, delegato identità/invio, sessione, formattazione e pianificazione del payload |
  | `plugin-sdk/thread-bindings-runtime` | Helper per thread-binding | Helper per ciclo di vita del thread-binding e adapter |
  | `plugin-sdk/agent-media-payload` | Helper legacy per media payload | Builder del media payload dell'agente per layout legacy dei campi |
  | `plugin-sdk/channel-runtime` | Shim di compatibilità deprecato | Solo utility legacy del runtime del canale |
  | `plugin-sdk/channel-send-result` | Tipi del risultato di invio | Tipi del risultato della risposta |
  | `plugin-sdk/runtime-store` | Storage persistente del Plugin | `createPluginRuntimeStore` |
  | `plugin-sdk/runtime` | Helper runtime ampi | Helper per runtime/logging/backup/installazione Plugin |
  | `plugin-sdk/runtime-env` | Helper mirati per runtime env | Logger/runtime env, timeout, retry e helper di backoff |
  | `plugin-sdk/plugin-runtime` | Helper runtime condivisi del Plugin | Helper per comandi/hook/http/interattivi del Plugin |
  | `plugin-sdk/hook-runtime` | Helper per pipeline di hook | Helper condivisi per pipeline di hook Webhook/interni |
  | `plugin-sdk/lazy-runtime` | Helper per runtime lazy | `createLazyRuntimeModule`, `createLazyRuntimeMethod`, `createLazyRuntimeMethodBinder`, `createLazyRuntimeNamedExport`, `createLazyRuntimeSurface` |
  | `plugin-sdk/process-runtime` | Helper di processo | Helper condivisi per exec |
  | `plugin-sdk/cli-runtime` | Helper runtime CLI | Formattazione dei comandi, attese, helper di versione |
  | `plugin-sdk/gateway-runtime` | Helper del Gateway | Client del Gateway e helper di patch dello stato del canale |
  | `plugin-sdk/config-runtime` | Helper di configurazione | Helper per caricamento/scrittura della configurazione |
  | `plugin-sdk/telegram-command-config` | Helper per comandi Telegram | Helper di validazione dei comandi Telegram stabili in fallback quando la superficie di contratto del Telegram bundled non è disponibile |
  | `plugin-sdk/approval-runtime` | Helper per prompt di approvazione | Payload di approvazione exec/Plugin, helper di capability/profile di approvazione, helper di routing/runtime di approvazione nativa e formattazione del percorso di visualizzazione strutturata dell'approvazione |
  | `plugin-sdk/approval-auth-runtime` | Helper di auth per l'approvazione | Risoluzione dell'approvatore, auth di azione nella stessa chat |
  | `plugin-sdk/approval-client-runtime` | Helper client per l'approvazione | Helper per profilo/filtro di approvazione exec nativa |
  | `plugin-sdk/approval-delivery-runtime` | Helper di consegna per l'approvazione | Adapter di capability/consegna dell'approvazione nativa |
  | `plugin-sdk/approval-gateway-runtime` | Helper del Gateway per l'approvazione | Helper condiviso di risoluzione del Gateway per l'approvazione |
  | `plugin-sdk/approval-handler-adapter-runtime` | Helper di adapter per l'approvazione | Helper leggeri di caricamento di adapter di approvazione nativa per entrypoint caldi del canale |
  | `plugin-sdk/approval-handler-runtime` | Helper di handler per l'approvazione | Helper runtime più ampi per handler di approvazione; preferisci le seam più strette adapter/gateway quando bastano |
  | `plugin-sdk/approval-native-runtime` | Helper per target di approvazione | Helper nativi per target/account binding di approvazione |
  | `plugin-sdk/approval-reply-runtime` | Helper per risposte di approvazione | Helper per payload di risposta di approvazione exec/Plugin |
  | `plugin-sdk/channel-runtime-context` | Helper per il runtime-context del canale | Helper generici per register/get/watch del runtime-context del canale |
  | `plugin-sdk/security-runtime` | Helper di sicurezza | Helper condivisi per trust, gating DM, contenuto esterno e raccolta segreti |
  | `plugin-sdk/ssrf-policy` | Helper di policy SSRF | Helper per allowlist host e policy rete privata |
  | `plugin-sdk/ssrf-runtime` | Helper runtime SSRF | Helper per pinned-dispatcher, fetch protetto, policy SSRF |
  | `plugin-sdk/collection-runtime` | Helper per cache limitata | `pruneMapToMaxSize` |
  | `plugin-sdk/diagnostic-runtime` | Helper di gating diagnostico | `isDiagnosticFlagEnabled`, `isDiagnosticsEnabled` |
  | `plugin-sdk/error-runtime` | Helper per formattazione degli errori | `formatUncaughtError`, `isApprovalNotFoundError`, helper per grafo degli errori |
  | `plugin-sdk/fetch-runtime` | Helper per fetch/proxy wrappati | `resolveFetch`, helper per proxy |
  | `plugin-sdk/host-runtime` | Helper di normalizzazione host | `normalizeHostname`, `normalizeScpRemoteHost` |
  | `plugin-sdk/retry-runtime` | Helper di retry | `RetryConfig`, `retryAsync`, runner di policy |
  | `plugin-sdk/allow-from` | Formattazione allowlist | `formatAllowFromLowercase` |
  | `plugin-sdk/allowlist-resolution` | Mappatura input allowlist | `mapAllowlistResolutionInputs` |
  | `plugin-sdk/command-auth` | Helper per gating dei comandi e superficie dei comandi | `resolveControlCommandGate`, helper di autorizzazione del mittente, helper del registro dei comandi inclusa la formattazione del menu argomenti dinamici |
  | `plugin-sdk/command-status` | Renderer di stato/help dei comandi | `buildCommandsMessage`, `buildCommandsMessagePaginated`, `buildHelpMessage` |
  | `plugin-sdk/secret-input` | Parsing input dei segreti | Helper per input dei segreti |
  | `plugin-sdk/webhook-ingress` | Helper per richieste Webhook | Utility per target Webhook |
  | `plugin-sdk/webhook-request-guards` | Helper guard del body Webhook | Helper per lettura/limite del body della richiesta |
  | `plugin-sdk/reply-runtime` | Runtime condiviso per le risposte | Dispatch in entrata, Heartbeat, pianificatore delle risposte, chunking |
  | `plugin-sdk/reply-dispatch-runtime` | Helper mirati di dispatch delle risposte | Helper per finalize, provider dispatch ed etichette della conversazione |
  | `plugin-sdk/reply-history` | Helper per cronologia delle risposte | `buildHistoryContext`, `buildPendingHistoryContextFromMap`, `recordPendingHistoryEntry`, `clearHistoryEntriesIfEnabled` |
  | `plugin-sdk/reply-reference` | Pianificazione dei riferimenti di risposta | `createReplyReferencePlanner` |
  | `plugin-sdk/reply-chunking` | Helper per chunk delle risposte | Helper per chunking di testo/Markdown |
  | `plugin-sdk/session-store-runtime` | Helper del session store | Helper per percorso dello store + updated-at |
  | `plugin-sdk/state-paths` | Helper per percorsi di stato | Helper per directory di stato e OAuth |
  | `plugin-sdk/routing` | Helper di routing/session-key | `resolveAgentRoute`, `buildAgentSessionKey`, `resolveDefaultAgentBoundAccountId`, helper di normalizzazione della session-key |
  | `plugin-sdk/status-helpers` | Helper di stato del canale | Builder di riepilogo dello stato di canale/account, valori predefiniti dello stato runtime, helper di metadati issue |
  | `plugin-sdk/target-resolver-runtime` | Helper di risoluzione target | Helper condivisi per risoluzione target |
  | `plugin-sdk/string-normalization-runtime` | Helper di normalizzazione stringhe | Helper per normalizzazione slug/stringhe |
  | `plugin-sdk/request-url` | Helper per URL della richiesta | Estrazione di URL stringa da input simili a richieste |
  | `plugin-sdk/run-command` | Helper per comandi temporizzati | Runner di comandi temporizzati con stdout/stderr normalizzati |
  | `plugin-sdk/param-readers` | Lettori di parametri | Lettori comuni di parametri per tool/CLI |
  | `plugin-sdk/tool-payload` | Estrazione del payload dei tool | Estrae payload normalizzati da oggetti risultato dei tool |
  | `plugin-sdk/tool-send` | Estrazione send dei tool | Estrae campi canonici del target di invio dagli argomenti del tool |
  | `plugin-sdk/temp-path` | Helper per percorsi temporanei | Helper condivisi per percorsi di download temporaneo |
  | `plugin-sdk/logging-core` | Helper di logging | Logger di sottosistema e helper di redazione |
  | `plugin-sdk/markdown-table-runtime` | Helper per tabelle Markdown | Helper per modalità tabella Markdown |
  | `plugin-sdk/reply-payload` | Tipi di risposta dei messaggi | Tipi del payload di risposta |
  | `plugin-sdk/provider-setup` | Helper curati di setup per provider locali/self-hosted | Helper di discovery/configurazione per provider self-hosted |
  | `plugin-sdk/self-hosted-provider-setup` | Helper mirati di setup per provider self-hosted compatibili OpenAI | Gli stessi helper di discovery/configurazione per provider self-hosted |
  | `plugin-sdk/provider-auth-runtime` | Helper di auth runtime del provider | Helper di risoluzione runtime delle API key |
  | `plugin-sdk/provider-auth-api-key` | Helper di setup della API key del provider | Helper di onboarding/scrittura del profilo API key |
  | `plugin-sdk/provider-auth-result` | Helper del risultato auth del provider | Builder standard del risultato auth OAuth |
  | `plugin-sdk/provider-auth-login` | Helper di login interattivo del provider | Helper condivisi per login interattivo |
  | `plugin-sdk/provider-selection-runtime` | Helper di selezione del provider | Selezione del provider configurato-o-automatico e merge della configurazione grezza del provider |
  | `plugin-sdk/provider-env-vars` | Helper per env var del provider | Helper di lookup delle env var di auth del provider |
  | `plugin-sdk/provider-model-shared` | Helper condivisi per modello/replay del provider | `ProviderReplayFamily`, `buildProviderReplayFamilyHooks`, `normalizeModelCompat`, builder condivisi di policy replay, helper per endpoint del provider e helper di normalizzazione del model-id |
  | `plugin-sdk/provider-catalog-shared` | Helper condivisi per catalogo del provider | `findCatalogTemplate`, `buildSingleProviderApiKeyCatalog`, `supportsNativeStreamingUsageCompat`, `applyProviderNativeStreamingUsageCompat` |
  | `plugin-sdk/provider-onboard` | Patch di onboarding del provider | Helper di configurazione dell'onboarding |
  | `plugin-sdk/provider-http` | Helper HTTP del provider | Helper generici per HTTP/capability dell'endpoint del provider, inclusi helper multipart form per la trascrizione audio |
  | `plugin-sdk/provider-web-fetch` | Helper web-fetch del provider | Helper di registrazione/cache del provider web-fetch |
  | `plugin-sdk/provider-web-search-config-contract` | Helper di configurazione web-search del provider | Helper mirati di configurazione/credenziali web-search per provider che non necessitano del wiring di abilitazione del Plugin |
  | `plugin-sdk/provider-web-search-contract` | Helper di contratto web-search del provider | Helper mirati di contratto di configurazione/credenziali web-search come `createWebSearchProviderContractFields`, `enablePluginInConfig`, `resolveProviderWebSearchPluginConfig` e setter/getter di credenziali con scope |
  | `plugin-sdk/provider-web-search` | Helper web-search del provider | Helper di registrazione/cache/runtime del provider web-search |
  | `plugin-sdk/provider-tools` | Helper di compatibilità tool/schema del provider | `ProviderToolCompatFamily`, `buildProviderToolCompatFamilyHooks`, pulizia dello schema Gemini + diagnostica e helper di compatibilità xAI come `resolveXaiModelCompatPatch` / `applyXaiModelCompat` |
  | `plugin-sdk/provider-usage` | Helper di utilizzo del provider | `fetchClaudeUsage`, `fetchGeminiUsage`, `fetchGithubCopilotUsage` e altri helper di utilizzo del provider |
  | `plugin-sdk/provider-stream` | Helper wrapper di stream del provider | `ProviderStreamFamily`, `buildProviderStreamFamilyHooks`, `composeProviderStreamWrappers`, tipi di wrapper di stream e helper wrapper condivisi per Anthropic/Bedrock/DeepSeek V4/Google/Kilocode/Moonshot/OpenAI/OpenRouter/Z.A.I/MiniMax/Copilot |
  | `plugin-sdk/provider-transport-runtime` | Helper di trasporto del provider | Helper di trasporto nativi del provider come fetch protetto, trasformazioni dei messaggi di trasporto e stream di eventi di trasporto scrivibili |
  | `plugin-sdk/keyed-async-queue` | Coda asincrona ordinata | `KeyedAsyncQueue` |
  | `plugin-sdk/media-runtime` | Helper media condivisi | Helper per fetch/trasformazione/store dei media più builder del media payload |
  | `plugin-sdk/media-generation-runtime` | Helper condivisi per generazione media | Helper condivisi di failover, selezione dei candidati e messaggistica per modelli mancanti per la generazione di immagini/video/musica |
  | `plugin-sdk/media-understanding` | Helper di comprensione dei media | Tipi provider di comprensione dei media più export di helper lato provider per immagini/audio |
  | `plugin-sdk/text-runtime` | Helper di testo condivisi | Rimozione del testo visibile all'assistente, helper per render/chunking/tabella Markdown, helper di redazione, helper per tag di direttiva, utility per testo sicuro e relativi helper di testo/logging |
  | `plugin-sdk/text-chunking` | Helper per chunking del testo | Helper per chunking del testo in uscita |
  | `plugin-sdk/speech` | Helper speech | Tipi provider speech più helper lato provider per direttive, registro e validazione |
  | `plugin-sdk/speech-core` | Core speech condiviso | Tipi provider speech, registro, direttive, normalizzazione |
  | `plugin-sdk/realtime-transcription` | Helper per trascrizione realtime | Tipi provider, helper di registro e helper condiviso di sessione WebSocket |
  | `plugin-sdk/realtime-voice` | Helper per voce realtime | Tipi provider, helper di registro/risoluzione e helper di sessione bridge |
  | `plugin-sdk/image-generation-core` | Core condiviso per generazione immagini | Tipi per generazione immagini, failover, auth e helper di registro |
  | `plugin-sdk/music-generation` | Helper per generazione musicale | Tipi provider/richiesta/risultato per generazione musicale |
  | `plugin-sdk/music-generation-core` | Core condiviso per generazione musicale | Tipi per generazione musicale, helper di failover, lookup del provider e parsing del model-ref |
  | `plugin-sdk/video-generation` | Helper per generazione video | Tipi provider/richiesta/risultato per generazione video |
  | `plugin-sdk/video-generation-core` | Core condiviso per generazione video | Tipi per generazione video, helper di failover, lookup del provider e parsing del model-ref |
  | `plugin-sdk/interactive-runtime` | Helper per risposte interattive | Normalizzazione/riduzione del payload di risposta interattiva |
  | `plugin-sdk/channel-config-primitives` | Primitive di configurazione del canale | Primitive mirate di channel config-schema |
  | `plugin-sdk/channel-config-writes` | Helper per scrittura della configurazione del canale | Helper di autorizzazione per la scrittura della configurazione del canale |
  | `plugin-sdk/channel-plugin-common` | Prelude condiviso del canale | Export condivisi del prelude del Plugin di canale |
  | `plugin-sdk/channel-status` | Helper di stato del canale | Helper condivisi per snapshot/riepilogo dello stato del canale |
  | `plugin-sdk/allowlist-config-edit` | Helper di configurazione allowlist | Helper per modifica/lettura della configurazione allowlist |
  | `plugin-sdk/group-access` | Helper di accesso al gruppo | Helper condivisi per decisioni di accesso al gruppo |
  | `plugin-sdk/direct-dm` | Helper per DM diretti | Helper condivisi di auth/guard per DM diretti |
  | `plugin-sdk/extension-shared` | Helper condivisi per estensioni | Primitive helper per canale/stato passivo e proxy ambient |
  | `plugin-sdk/webhook-targets` | Helper per target Webhook | Registro dei target Webhook e helper di installazione delle route |
  | `plugin-sdk/webhook-path` | Helper per percorso Webhook | Helper di normalizzazione del percorso Webhook |
  | `plugin-sdk/web-media` | Helper media web condivisi | Helper per caricamento di media remoti/locali |
  | `plugin-sdk/zod` | Riesportazione di Zod | `zod` riesportato per i consumer del Plugin SDK |
  | `plugin-sdk/memory-core` | Helper bundled di memory-core | Superficie helper per memory manager/config/file/CLI |
  | `plugin-sdk/memory-core-engine-runtime` | Facade runtime del motore memory | Facade runtime per indice/ricerca della memoria |
  | `plugin-sdk/memory-core-host-engine-foundation` | Motore foundation host della memoria | Export del motore foundation host della memoria |
  | `plugin-sdk/memory-core-host-engine-embeddings` | Motore embedding host della memoria | Contratti di embedding della memoria, accesso al registro, provider locale e helper generici batch/remoti; i provider remoti concreti si trovano nei Plugin che li possiedono |
  | `plugin-sdk/memory-core-host-engine-qmd` | Motore QMD host della memoria | Export del motore QMD host della memoria |
  | `plugin-sdk/memory-core-host-engine-storage` | Motore storage host della memoria | Export del motore storage host della memoria |
  | `plugin-sdk/memory-core-host-multimodal` | Helper multimodali host della memoria | Helper multimodali host della memoria |
  | `plugin-sdk/memory-core-host-query` | Helper di query host della memoria | Helper di query host della memoria |
  | `plugin-sdk/memory-core-host-secret` | Helper dei segreti host della memoria | Helper dei segreti host della memoria |
  | `plugin-sdk/memory-core-host-events` | Helper del journal eventi host della memoria | Helper del journal eventi host della memoria |
  | `plugin-sdk/memory-core-host-status` | Helper di stato host della memoria | Helper di stato host della memoria |
  | `plugin-sdk/memory-core-host-runtime-cli` | Runtime CLI host della memoria | Helper runtime CLI host della memoria |
  | `plugin-sdk/memory-core-host-runtime-core` | Runtime core host della memoria | Helper runtime core host della memoria |
  | `plugin-sdk/memory-core-host-runtime-files` | Helper file/runtime host della memoria | Helper file/runtime host della memoria |
  | `plugin-sdk/memory-host-core` | Alias runtime core host della memoria | Alias neutrale rispetto al vendor per gli helper runtime core host della memoria |
  | `plugin-sdk/memory-host-events` | Alias journal eventi host della memoria | Alias neutrale rispetto al vendor per gli helper del journal eventi host della memoria |
  | `plugin-sdk/memory-host-files` | Alias file/runtime host della memoria | Alias neutrale rispetto al vendor per gli helper file/runtime host della memoria |
  | `plugin-sdk/memory-host-markdown` | Helper Markdown gestiti | Helper condivisi per Markdown gestito per Plugin adiacenti alla memoria |
  | `plugin-sdk/memory-host-search` | Facade di ricerca Active Memory | Facade runtime lazy del search-manager di Active Memory |
  | `plugin-sdk/memory-host-status` | Alias di stato host della memoria | Alias neutrale rispetto al vendor per gli helper di stato host della memoria |
  | `plugin-sdk/memory-lancedb` | Helper bundled di memory-lancedb | Superficie helper di memory-lancedb |
  | `plugin-sdk/testing` | Utility di test | Helper e mock di test |
</Accordion>

Questa tabella è intenzionalmente il sottoinsieme comune di migrazione, non l'intera
superficie dell'SDK. L'elenco completo di oltre 200 entrypoint si trova in
`scripts/lib/plugin-sdk-entrypoints.json`.

Quell'elenco include ancora alcune seam helper di Plugin bundled come
`plugin-sdk/feishu`, `plugin-sdk/feishu-setup`, `plugin-sdk/zalo`,
`plugin-sdk/zalo-setup` e `plugin-sdk/matrix*`. Queste restano esportate per la
manutenzione e la compatibilità dei Plugin bundled, ma sono intenzionalmente
omesse dalla tabella comune di migrazione e non sono il target raccomandato per
nuovo codice Plugin.

La stessa regola si applica ad altre famiglie di helper bundled come:

- helper di supporto browser: `plugin-sdk/browser-cdp`, `plugin-sdk/browser-config-runtime`, `plugin-sdk/browser-config-support`, `plugin-sdk/browser-control-auth`, `plugin-sdk/browser-node-runtime`, `plugin-sdk/browser-profiles`, `plugin-sdk/browser-security-runtime`, `plugin-sdk/browser-setup-tools`, `plugin-sdk/browser-support`
- Matrix: `plugin-sdk/matrix*`
- LINE: `plugin-sdk/line*`
- IRC: `plugin-sdk/irc*`
- superfici helper/Plugin bundled come `plugin-sdk/googlechat`,
  `plugin-sdk/zalouser`, `plugin-sdk/bluebubbles*`,
  `plugin-sdk/mattermost*`, `plugin-sdk/msteams`,
  `plugin-sdk/nextcloud-talk`, `plugin-sdk/nostr`, `plugin-sdk/tlon`,
  `plugin-sdk/twitch`,
  `plugin-sdk/github-copilot-login`, `plugin-sdk/github-copilot-token`,
  `plugin-sdk/diagnostics-otel`, `plugin-sdk/diffs`, `plugin-sdk/llm-task`,
  `plugin-sdk/thread-ownership` e `plugin-sdk/voice-call`

`plugin-sdk/github-copilot-token` espone attualmente la superficie ristretta di
helper per token `DEFAULT_COPILOT_API_BASE_URL`,
`deriveCopilotApiBaseUrlFromToken` e `resolveCopilotApiToken`.

Usa l'import più ristretto che corrisponde al compito. Se non riesci a trovare un export,
controlla il sorgente in `src/plugin-sdk/` oppure chiedi in Discord.

## Deprecazioni attive

Deprecazioni più ristrette che si applicano in tutto il Plugin SDK, al contratto del provider,
alla superficie runtime e al manifest. Ognuna funziona ancora oggi ma sarà rimossa
in una futura major release. La voce sotto ogni elemento mappa la vecchia API al suo
sostituto canonico.

<AccordionGroup>
  <Accordion title="builder di help di command-auth → command-status">
    **Vecchio (`openclaw/plugin-sdk/command-auth`)**: `buildCommandsMessage`,
    `buildCommandsMessagePaginated`, `buildHelpMessage`.

    **Nuovo (`openclaw/plugin-sdk/command-status`)**: stesse firme, stessi
    export — solo importati dal subpath più ristretto. `command-auth`
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
    singolo oggetto decisione invece di due chiamate separate.

    I Plugin di canale downstream (Slack, Discord, Matrix, Microsoft Teams) sono già
    passati a questo approccio.

  </Accordion>

  <Accordion title="shim del runtime del canale e helper delle azioni del canale">
    `openclaw/plugin-sdk/channel-runtime` è uno shim di compatibilità per Plugin di
    canale meno recenti. Non importarlo nel nuovo codice; usa
    `openclaw/plugin-sdk/channel-runtime-context` per registrare oggetti runtime.

    Gli helper `channelActions*` in `openclaw/plugin-sdk/channel-actions` sono
    deprecati insieme agli export grezzi del canale relativi alle "actions". Esponi invece le capability
    tramite la superficie semantica `presentation` — i Plugin di canale
    dichiarano cosa renderizzano (card, pulsanti, select) invece di quali nomi grezzi
    di action accettano.

  </Accordion>

  <Accordion title="helper tool() del provider di ricerca web → createTool() nel Plugin">
    **Vecchio**: factory `tool()` da `openclaw/plugin-sdk/provider-web-search`.

    **Nuovo**: implementa `createTool(...)` direttamente nel Plugin del provider.
    OpenClaw non ha più bisogno dell'helper SDK per registrare il wrapper del tool.

  </Accordion>

  <Accordion title="envelope di canale in testo semplice → BodyForAgent">
    **Vecchio**: `formatInboundEnvelope(...)` (e
    `ChannelMessageForAgent.channelEnvelope`) per costruire un envelope di prompt piatto in testo semplice
    a partire dai messaggi di canale in entrata.

    **Nuovo**: `BodyForAgent` più blocchi strutturati di contesto utente. I Plugin di
    canale allegano i metadati di routing (thread, topic, reply-to, reazioni) come
    campi tipizzati invece di concatenarli in una stringa di prompt. L'helper
    `formatAgentEnvelope(...)` è ancora supportato per envelope sintetizzati
    rivolti all'assistente, ma gli envelope in entrata in testo semplice stanno per essere eliminati.

    Aree interessate: `inbound_claim`, `message_received` e qualsiasi
    Plugin di canale personalizzato che effettuava post-processing del testo `channelEnvelope`.

  </Accordion>

  <Accordion title="tipi di discovery del provider → tipi di catalogo del provider">
    Quattro alias di tipo per la discovery sono ora wrapper sottili sui
    tipi dell'era del catalogo:

    | Vecchio alias                 | Nuovo tipo                  |
    | ----------------------------- | --------------------------- |
    | `ProviderDiscoveryOrder`  | `ProviderCatalogOrder`    |
    | `ProviderDiscoveryContext`| `ProviderCatalogContext`  |
    | `ProviderDiscoveryResult` | `ProviderCatalogResult`   |
    | `ProviderPluginDiscovery` | `ProviderPluginCatalog`   |

    In più, il bag statico legacy `ProviderCapabilities` — i Plugin provider
    dovrebbero allegare i fatti di capability tramite il contratto runtime del provider
    invece che tramite un oggetto statico.

  </Accordion>

  <Accordion title="hook della thinking policy → resolveThinkingProfile">
    **Vecchio** (tre hook separati su `ProviderThinkingPolicy`):
    `isBinaryThinking(ctx)`, `supportsXHighThinking(ctx)` e
    `resolveDefaultThinkingLevel(ctx)`.

    **Nuovo**: un singolo `resolveThinkingProfile(ctx)` che restituisce un
    `ProviderThinkingProfile` con l'`id` canonico, `label` facoltativa e
    lista ordinata dei livelli. OpenClaw declassa automaticamente i valori memorizzati obsoleti in base
    al rango del profilo.

    Implementa un hook invece di tre. Gli hook legacy continuano a funzionare durante
    la finestra di deprecazione ma non vengono composti con il risultato del profilo.

  </Accordion>

  <Accordion title="fallback del provider OAuth esterno → contracts.externalAuthProviders">
    **Vecchio**: implementare `resolveExternalOAuthProfiles(...)` senza
    dichiarare il provider nel manifest del Plugin.

    **Nuovo**: dichiara `contracts.externalAuthProviders` nel manifest del Plugin
    **e** implementa `resolveExternalAuthProfiles(...)`. Il vecchio percorso di
    "auth fallback" emette un avviso a runtime e verrà rimosso.

    ```json
    {
      "contracts": {
        "externalAuthProviders": ["anthropic", "openai"]
      }
    }
    ```

  </Accordion>

  <Accordion title="lookup env-var del provider → setup.providers[].envVars">
    **Vecchio** campo del manifest: `providerAuthEnvVars: { anthropic: ["ANTHROPIC_API_KEY"] }`.

    **Nuovo**: rispecchia la stessa ricerca di env-var in `setup.providers[].envVars`
    nel manifest. Questo consolida i metadati env di setup/stato in un unico
    posto ed evita di avviare il runtime del Plugin solo per rispondere alle
    ricerche di env-var.

    `providerAuthEnvVars` resta supportato tramite un adapter di compatibilità
    finché la finestra di deprecazione non si chiude.

  </Accordion>

  <Accordion title="registrazione Plugin di memoria → registerMemoryCapability">
    **Vecchio**: tre chiamate separate —
    `api.registerMemoryPromptSection(...)`,
    `api.registerMemoryFlushPlan(...)`,
    `api.registerMemoryRuntime(...)`.

    **Nuovo**: una chiamata sull'API memory-state —
    `registerMemoryCapability(pluginId, { promptBuilder, flushPlanResolver, runtime })`.

    Stessi slot, singola chiamata di registrazione. Gli helper additivi della memoria
    (`registerMemoryPromptSupplement`, `registerMemoryCorpusSupplement`,
    `registerMemoryEmbeddingProvider`) non sono interessati.

  </Accordion>

  <Accordion title="tipi dei messaggi della sessione subagent rinominati">
    Due alias di tipo legacy sono ancora esportati da `src/plugins/runtime/types.ts`:

    | Vecchio                           | Nuovo                             |
    | --------------------------------- | --------------------------------- |
    | `SubagentReadSessionParams`   | `SubagentGetSessionMessagesParams` |
    | `SubagentReadSessionResult`   | `SubagentGetSessionMessagesResult` |

    Il metodo runtime `readSession` è deprecato a favore di
    `getSessionMessages`. Stessa firma; il vecchio metodo inoltra la chiamata al
    nuovo.

  </Accordion>

  <Accordion title="runtime.tasks.flow → runtime.tasks.flows">
    **Vecchio**: `runtime.tasks.flow` (singolare) restituiva un accessor live di TaskFlow.

    **Nuovo**: `runtime.tasks.flows` (plurale) restituisce accesso a TaskFlow basato su DTO,
    che è sicuro da importare e non richiede il caricamento dell'intero runtime dei task.

    ```typescript
    // Before
    const flow = api.runtime.tasks.flow(ctx);
    // After
    const flows = api.runtime.tasks.flows(ctx);
    ```

  </Accordion>

  <Accordion title="embedded extension factory → middleware dei risultati degli strumenti dell'agente">
    Trattato sopra in "Come migrare → Migrare le estensioni Pi tool-result al
    middleware". Incluso qui per completezza: il percorso rimosso solo Pi
    `api.registerEmbeddedExtensionFactory(...)` viene sostituito da
    `api.registerAgentToolResultMiddleware(...)` con un elenco esplicito di runtime
    in `contracts.agentToolResultMiddleware`.
  </Accordion>

  <Accordion title="alias OpenClawSchemaType → OpenClawConfig">
    `OpenClawSchemaType` riesportato da `openclaw/plugin-sdk` è ora un
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
Le deprecazioni a livello di estensione (all'interno dei Plugin di canale/provider bundled sotto
`extensions/`) sono tracciate all'interno dei rispettivi barrel `api.ts` e `runtime-api.ts`.
Non influenzano i contratti dei Plugin di terze parti e non sono elencate
qui. Se consumi direttamente il barrel locale di un Plugin bundled, leggi i
commenti di deprecazione in quel barrel prima di aggiornare.
</Note>

## Cronologia di rimozione

| Quando                   | Cosa succede                                                            |
| ------------------------ | ----------------------------------------------------------------------- |
| **Ora**                  | Le superfici deprecate emettono avvisi a runtime                        |
| **Prossima major release** | Le superfici deprecate saranno rimosse; i Plugin che le usano ancora falliranno |

Tutti i Plugin core sono già stati migrati. I Plugin esterni dovrebbero migrare
prima della prossima major release.

## Sopprimere temporaneamente gli avvisi

Imposta queste variabili d'ambiente mentre lavori alla migrazione:

```bash
OPENCLAW_SUPPRESS_PLUGIN_SDK_COMPAT_WARNING=1 openclaw gateway run
OPENCLAW_SUPPRESS_EXTENSION_API_WARNING=1 openclaw gateway run
```

Questa è una via di fuga temporanea, non una soluzione permanente.

## Correlati

- [Getting Started](/it/plugins/building-plugins) — crea il tuo primo Plugin
- [SDK Overview](/it/plugins/sdk-overview) — riferimento completo degli import per subpath
- [Channel Plugins](/it/plugins/sdk-channel-plugins) — creazione di Plugin di canale
- [Provider Plugins](/it/plugins/sdk-provider-plugins) — creazione di Plugin provider
- [Plugin Internals](/it/plugins/architecture) — approfondimento sull'architettura
- [Plugin Manifest](/it/plugins/manifest) — riferimento dello schema del manifest
