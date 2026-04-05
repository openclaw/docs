---
read_when:
    - Vedi l'avviso OPENCLAW_PLUGIN_SDK_COMPAT_DEPRECATED
    - Vedi l'avviso OPENCLAW_EXTENSION_API_DEPRECATED
    - Stai aggiornando un plugin alla moderna architettura dei plugin
    - Mantieni un plugin OpenClaw esterno
sidebarTitle: Migrate to SDK
summary: Migrare dal layer legacy di retrocompatibilità al moderno plugin SDK
title: Migrazione del Plugin SDK
x-i18n:
    generated_at: "2026-04-05T14:00:44Z"
    model: gpt-5.4
    provider: openai
    source_hash: c420b8d7de17aee16c5aa67e3a88da5750f0d84b07dd541f061081080e081196
    source_path: plugins/sdk-migration.md
    workflow: 15
---

# Migrazione del Plugin SDK

OpenClaw è passato da un ampio layer di retrocompatibilità a una moderna
architettura dei plugin con import mirati e documentati. Se il tuo plugin è stato creato prima
della nuova architettura, questa guida ti aiuta a migrare.

## Cosa sta cambiando

Il vecchio sistema dei plugin forniva due superfici molto aperte che permettevano ai plugin di importare
qualsiasi cosa servisse da un singolo punto di ingresso:

- **`openclaw/plugin-sdk/compat`** — un singolo import che riesportava decine di
  helper. È stato introdotto per mantenere funzionanti i plugin hook-based più vecchi mentre la
  nuova architettura dei plugin veniva costruita.
- **`openclaw/extension-api`** — un bridge che dava ai plugin accesso diretto a
  helper lato host come l'embedded agent runner.

Entrambe le superfici sono ora **deprecate**. Continuano a funzionare a runtime, ma i nuovi
plugin non devono usarle e quelli esistenti dovrebbero migrare prima che la prossima
major release le rimuova.

<Warning>
  Il layer di retrocompatibilità verrà rimosso in una futura major release.
  I plugin che importano ancora da queste superfici si romperanno quando ciò accadrà.
</Warning>

## Perché è cambiato

Il vecchio approccio causava problemi:

- **Avvio lento** — importare un helper caricava decine di moduli non correlati
- **Dipendenze circolari** — le riesportazioni ampie rendevano facile creare cicli di import
- **Superficie API poco chiara** — nessun modo per distinguere quali export fossero stabili rispetto a quelli interni

Il moderno Plugin SDK risolve questo problema: ogni percorso di import (`openclaw/plugin-sdk/\<subpath\>`)
è un modulo piccolo e autosufficiente con uno scopo chiaro e un contratto documentato.

Anche le seam legacy di comodo per i provider dei canali inclusi non esistono più. Import
come `openclaw/plugin-sdk/slack`, `openclaw/plugin-sdk/discord`,
`openclaw/plugin-sdk/signal`, `openclaw/plugin-sdk/whatsapp`,
seam helper con marchio del canale e
`openclaw/plugin-sdk/telegram-core` erano scorciatoie private del mono-repo, non
contratti stabili per i plugin. Usa invece subpath generici e ristretti del SDK. All'interno del
workspace dei plugin inclusi, mantieni gli helper di proprietà del provider in `api.ts` o `runtime-api.ts`
del plugin stesso.

Esempi attuali di provider inclusi:

- Anthropic mantiene helper di stream specifici per Claude nelle proprie seam `api.ts` /
  `contract-api.ts`
- OpenAI mantiene builder di provider, helper per i modelli predefiniti e builder di provider realtime
  nel proprio `api.ts`
- OpenRouter mantiene il builder del provider e gli helper di onboarding/configurazione nel proprio
  `api.ts`

## Come migrare

<Steps>
  <Step title="Controlla il comportamento di fallback del wrapper Windows">
    Se il tuo plugin usa `openclaw/plugin-sdk/windows-spawn`, i wrapper Windows
    `.cmd`/`.bat` non risolti ora falliscono in modo chiuso a meno che tu non passi esplicitamente
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

    Se il tuo chiamante non si basa intenzionalmente sul fallback della shell, non impostare
    `allowShellFallback` e gestisci invece l'errore generato.

  </Step>

  <Step title="Trova gli import deprecati">
    Cerca nel tuo plugin gli import da una delle due superfici deprecate:

    ```bash
    grep -r "plugin-sdk/compat" my-plugin/
    grep -r "openclaw/extension-api" my-plugin/
    ```

  </Step>

  <Step title="Sostituiscili con import mirati">
    Ogni export della vecchia superficie corrisponde a uno specifico percorso di import moderno:

    ```typescript
    // Prima (layer di retrocompatibilità deprecato)
    import {
      createChannelReplyPipeline,
      createPluginRuntimeStore,
      resolveControlCommandGate,
    } from "openclaw/plugin-sdk/compat";

    // Dopo (import moderni e mirati)
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

    Lo stesso schema si applica ad altri helper legacy del bridge:

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

  <Step title="Compila e testa">
    ```bash
    pnpm build
    pnpm test -- my-plugin/
    ```
  </Step>
</Steps>

## Riferimento dei percorsi di import

<Accordion title="Tabella comune dei percorsi di import">
  | Percorso di import | Scopo | Export chiave |
  | --- | --- | --- |
  | `plugin-sdk/plugin-entry` | Helper canonico di entry del plugin | `definePluginEntry` |
  | `plugin-sdk/core` | Riesportazione legacy ombrello per definizioni/builder di entry di canale | `defineChannelPluginEntry`, `createChatChannelPlugin` |
  | `plugin-sdk/config-schema` | Export dello schema di configurazione root | `OpenClawSchema` |
  | `plugin-sdk/provider-entry` | Helper di entry per provider singolo | `defineSingleProviderPluginEntry` |
  | `plugin-sdk/channel-core` | Definizioni e builder mirati per le entry di canale | `defineChannelPluginEntry`, `defineSetupPluginEntry`, `createChatChannelPlugin`, `createChannelPluginBase` |
  | `plugin-sdk/setup` | Helper condivisi per la procedura guidata di setup | Prompt allowlist, builder dello stato di setup |
  | `plugin-sdk/setup-runtime` | Helper runtime per il setup | Adapter di patch setup import-safe, helper per note di lookup, `promptResolvedAllowFrom`, `splitSetupEntries`, proxy di setup delegati |
  | `plugin-sdk/setup-adapter-runtime` | Helper per adapter di setup | `createEnvPatchedAccountSetupAdapter` |
  | `plugin-sdk/setup-tools` | Helper di tooling per il setup | `formatCliCommand`, `detectBinary`, `extractArchive`, `resolveBrewExecutable`, `formatDocsLink`, `CONFIG_DIR` |
  | `plugin-sdk/account-core` | Helper per account multipli | Helper per elenco/configurazione/account-action-gate |
  | `plugin-sdk/account-id` | Helper per ID account | `DEFAULT_ACCOUNT_ID`, normalizzazione dell'ID account |
  | `plugin-sdk/account-resolution` | Helper di lookup account | Helper per lookup account + fallback al predefinito |
  | `plugin-sdk/account-helpers` | Helper account ristretti | Helper per elenco account/account-action |
  | `plugin-sdk/channel-setup` | Adapter per la procedura guidata di setup | `createOptionalChannelSetupSurface`, `createOptionalChannelSetupAdapter`, `createOptionalChannelSetupWizard`, più `DEFAULT_ACCOUNT_ID`, `createTopLevelChannelDmPolicy`, `setSetupChannelEnabled`, `splitSetupEntries` |
  | `plugin-sdk/channel-pairing` | Primitive di pairing DM | `createChannelPairingController` |
  | `plugin-sdk/channel-reply-pipeline` | Wiring di prefisso risposta + typing | `createChannelReplyPipeline` |
  | `plugin-sdk/channel-config-helpers` | Factory per adapter di configurazione | `createHybridChannelConfigAdapter` |
  | `plugin-sdk/channel-config-schema` | Builder dello schema di configurazione | Tipi di schema di configurazione del canale |
  | `plugin-sdk/telegram-command-config` | Helper di configurazione dei comandi Telegram | Normalizzazione del nome comando, trim della descrizione, validazione di duplicati/conflitti |
  | `plugin-sdk/channel-policy` | Risoluzione delle policy gruppo/DM | `resolveChannelGroupRequireMention` |
  | `plugin-sdk/channel-lifecycle` | Tracciamento dello stato dell'account | `createAccountStatusSink` |
  | `plugin-sdk/inbound-envelope` | Helper per inbound envelope | Helper condivisi per route + envelope builder |
  | `plugin-sdk/inbound-reply-dispatch` | Helper per le risposte in ingresso | Helper condivisi per record-and-dispatch |
  | `plugin-sdk/messaging-targets` | Parsing dei target di messaggistica | Helper per parsing/matching dei target |
  | `plugin-sdk/outbound-media` | Helper per media in uscita | Caricamento condiviso dei media in uscita |
  | `plugin-sdk/outbound-runtime` | Helper runtime per l'uscita | Helper per identità/delegati di invio in uscita |
  | `plugin-sdk/thread-bindings-runtime` | Helper per thread-binding | Lifecycle dei thread-binding e helper per adapter |
  | `plugin-sdk/agent-media-payload` | Helper legacy per media payload | Builder del media payload dell'agente per layout legacy dei campi |
  | `plugin-sdk/channel-runtime` | Shim di compatibilità deprecato | Solo utility runtime legacy del canale |
  | `plugin-sdk/channel-send-result` | Tipi del risultato di invio | Tipi del risultato della risposta |
  | `plugin-sdk/runtime-store` | Storage persistente del plugin | `createPluginRuntimeStore` |
  | `plugin-sdk/runtime` | Helper runtime ampi | Helper runtime/logging/backup/installazione plugin |
  | `plugin-sdk/runtime-env` | Helper mirati per l'ambiente runtime | Logger/runtime env, timeout, retry e helper di backoff |
  | `plugin-sdk/plugin-runtime` | Helper runtime condivisi del plugin | Helper per comandi/hook/http/interattivi del plugin |
  | `plugin-sdk/hook-runtime` | Helper per la pipeline degli hook | Helper condivisi per la pipeline di webhook/hook interni |
  | `plugin-sdk/lazy-runtime` | Helper lazy runtime | `createLazyRuntimeModule`, `createLazyRuntimeMethod`, `createLazyRuntimeMethodBinder`, `createLazyRuntimeNamedExport`, `createLazyRuntimeSurface` |
  | `plugin-sdk/process-runtime` | Helper per i processi | Helper condivisi per exec |
  | `plugin-sdk/cli-runtime` | Helper runtime della CLI | Formattazione dei comandi, attese, helper di versione |
  | `plugin-sdk/gateway-runtime` | Helper per il Gateway | Client Gateway e helper di patch per channel-status |
  | `plugin-sdk/config-runtime` | Helper di configurazione | Helper per caricamento/scrittura della configurazione |
  | `plugin-sdk/telegram-command-config` | Helper per i comandi Telegram | Helper di validazione dei comandi Telegram stabili in fallback quando la superficie del contratto Telegram incluso non è disponibile |
  | `plugin-sdk/approval-runtime` | Helper per i prompt di approvazione | Payload di approvazione exec/plugin, helper per capability/profile di approvazione, helper runtime/routing per approvazioni native |
  | `plugin-sdk/approval-auth-runtime` | Helper auth per le approvazioni | Risoluzione dell'approvatore, auth per azioni nella stessa chat |
  | `plugin-sdk/approval-client-runtime` | Helper client per le approvazioni | Helper di profilo/filtro per approvazione exec nativa |
  | `plugin-sdk/approval-delivery-runtime` | Helper di delivery per le approvazioni | Adapter di capability/delivery per approvazioni native |
  | `plugin-sdk/approval-native-runtime` | Helper per i target di approvazione | Helper per binding target/account delle approvazioni native |
  | `plugin-sdk/approval-reply-runtime` | Helper per le risposte di approvazione | Helper per payload di risposta di approvazione exec/plugin |
  | `plugin-sdk/security-runtime` | Helper di sicurezza | Helper condivisi per trust, gating DM, contenuti esterni e raccolta di segreti |
  | `plugin-sdk/ssrf-policy` | Helper per la policy SSRF | Helper per allowlist host e policy di rete privata |
  | `plugin-sdk/ssrf-runtime` | Helper runtime SSRF | Dispatcher pinned, fetch protetto, helper di policy SSRF |
  | `plugin-sdk/collection-runtime` | Helper per cache limitata | `pruneMapToMaxSize` |
  | `plugin-sdk/diagnostic-runtime` | Helper per gating diagnostico | `isDiagnosticFlagEnabled`, `isDiagnosticsEnabled` |
  | `plugin-sdk/error-runtime` | Helper di formattazione degli errori | `formatUncaughtError`, `isApprovalNotFoundError`, helper per grafi di errore |
  | `plugin-sdk/fetch-runtime` | Helper per fetch/proxy wrapped | `resolveFetch`, helper proxy |
  | `plugin-sdk/host-runtime` | Helper di normalizzazione host | `normalizeHostname`, `normalizeScpRemoteHost` |
  | `plugin-sdk/retry-runtime` | Helper di retry | `RetryConfig`, `retryAsync`, runner di policy |
  | `plugin-sdk/allow-from` | Formattazione dell'allowlist | `formatAllowFromLowercase` |
  | `plugin-sdk/allowlist-resolution` | Mapping dell'input allowlist | `mapAllowlistResolutionInputs` |
  | `plugin-sdk/command-auth` | Gating dei comandi e helper per la superficie dei comandi | `resolveControlCommandGate`, helper di autorizzazione del mittente, helper del registro comandi |
  | `plugin-sdk/secret-input` | Parsing dell'input segreto | Helper per input segreti |
  | `plugin-sdk/webhook-ingress` | Helper per richieste webhook | Utility per i target webhook |
  | `plugin-sdk/webhook-request-guards` | Helper guard per il body dei webhook | Helper per lettura/limite del body della richiesta |
  | `plugin-sdk/reply-runtime` | Runtime condiviso della risposta | Dispatch in ingresso, heartbeat, reply planner, chunking |
  | `plugin-sdk/reply-dispatch-runtime` | Helper mirati per il dispatch della risposta | Helper per finalize + provider dispatch |
  | `plugin-sdk/reply-history` | Helper per la cronologia delle risposte | `buildHistoryContext`, `buildPendingHistoryContextFromMap`, `recordPendingHistoryEntry`, `clearHistoryEntriesIfEnabled` |
  | `plugin-sdk/reply-reference` | Pianificazione dei riferimenti di risposta | `createReplyReferencePlanner` |
  | `plugin-sdk/reply-chunking` | Helper per chunk delle risposte | Helper per chunking di testo/markdown |
  | `plugin-sdk/session-store-runtime` | Helper per il session store | Helper per percorso store + updated-at |
  | `plugin-sdk/state-paths` | Helper per i percorsi di stato | Helper per directory di stato e OAuth |
  | `plugin-sdk/routing` | Helper per routing/session-key | `resolveAgentRoute`, `buildAgentSessionKey`, `resolveDefaultAgentBoundAccountId`, helper di normalizzazione della session-key |
  | `plugin-sdk/status-helpers` | Helper per lo stato del canale | Builder di riepilogo stato canale/account, valori predefiniti dello stato runtime, helper di metadati dei problemi |
  | `plugin-sdk/target-resolver-runtime` | Helper per il target resolver | Helper condivisi per target resolver |
  | `plugin-sdk/string-normalization-runtime` | Helper per la normalizzazione delle stringhe | Helper per normalizzazione slug/stringhe |
  | `plugin-sdk/request-url` | Helper per gli URL di richiesta | Estrai URL stringa da input simili a richieste |
  | `plugin-sdk/run-command` | Helper per comandi temporizzati | Runner di comandi temporizzati con stdout/stderr normalizzati |
  | `plugin-sdk/param-readers` | Reader di parametri | Reader comuni di parametri tool/CLI |
  | `plugin-sdk/tool-send` | Estrazione dell'invio del tool | Estrai campi canonici del target di invio dagli argomenti del tool |
  | `plugin-sdk/temp-path` | Helper per percorsi temporanei | Helper condivisi per il percorso temporaneo di download |
  | `plugin-sdk/logging-core` | Helper di logging | Logger del sottosistema e helper di redaction |
  | `plugin-sdk/markdown-table-runtime` | Helper per tabelle Markdown | Helper per la modalità delle tabelle Markdown |
  | `plugin-sdk/reply-payload` | Tipi per risposta ai messaggi | Tipi di payload della risposta |
  | `plugin-sdk/provider-setup` | Helper curati per setup di provider locali/self-hosted | Helper per discovery/configurazione di provider self-hosted |
  | `plugin-sdk/self-hosted-provider-setup` | Helper mirati per setup di provider self-hosted compatibili OpenAI | Gli stessi helper per discovery/configurazione di provider self-hosted |
  | `plugin-sdk/provider-auth-runtime` | Helper runtime di autenticazione provider | Helper runtime per la risoluzione della chiave API |
  | `plugin-sdk/provider-auth-api-key` | Helper di setup per chiavi API del provider | Helper per onboarding/scrittura del profilo della chiave API |
  | `plugin-sdk/provider-auth-result` | Helper per auth-result del provider | Builder standard del risultato di autenticazione OAuth |
  | `plugin-sdk/provider-auth-login` | Helper per login interattivo del provider | Helper condivisi per il login interattivo |
  | `plugin-sdk/provider-env-vars` | Helper per env var del provider | Helper per il lookup delle env var di autenticazione del provider |
  | `plugin-sdk/provider-model-shared` | Helper condivisi per modello/replay del provider | `ProviderReplayFamily`, `buildProviderReplayFamilyHooks`, `normalizeModelCompat`, builder condivisi di replay-policy, helper per endpoint del provider e helper di normalizzazione dell'ID modello |
  | `plugin-sdk/provider-catalog-shared` | Helper condivisi per il catalogo dei provider | `findCatalogTemplate`, `buildSingleProviderApiKeyCatalog`, `supportsNativeStreamingUsageCompat`, `applyProviderNativeStreamingUsageCompat` |
  | `plugin-sdk/provider-onboard` | Patch di onboarding del provider | Helper per la configurazione dell'onboarding |
  | `plugin-sdk/provider-http` | Helper HTTP del provider | Helper generici per HTTP/capability dell'endpoint del provider |
  | `plugin-sdk/provider-web-fetch` | Helper web-fetch del provider | Helper per registrazione/cache del provider web-fetch |
  | `plugin-sdk/provider-web-search` | Helper web-search del provider | Helper per registrazione/cache/configurazione del provider web-search |
  | `plugin-sdk/provider-tools` | Helper di compatibilità tool/schema del provider | `ProviderToolCompatFamily`, `buildProviderToolCompatFamilyHooks`, pulizia dello schema Gemini + diagnostica e helper di compatibilità xAI come `resolveXaiModelCompatPatch` / `applyXaiModelCompat` |
  | `plugin-sdk/provider-usage` | Helper per usage del provider | `fetchClaudeUsage`, `fetchGeminiUsage`, `fetchGithubCopilotUsage` e altri helper per usage del provider |
  | `plugin-sdk/provider-stream` | Helper wrapper per stream del provider | `ProviderStreamFamily`, `buildProviderStreamFamilyHooks`, `composeProviderStreamWrappers`, tipi wrapper degli stream e helper wrapper condivisi per Anthropic/Bedrock/Google/Kilocode/Moonshot/OpenAI/OpenRouter/Z.A.I/MiniMax/Copilot |
  | `plugin-sdk/keyed-async-queue` | Coda async ordinata | `KeyedAsyncQueue` |
  | `plugin-sdk/media-runtime` | Helper condivisi per media | Helper per fetch/transform/store dei media più builder dei media payload |
  | `plugin-sdk/media-understanding` | Helper per la comprensione dei media | Tipi di provider per comprensione dei media più export di helper lato provider per immagini/audio |
  | `plugin-sdk/text-runtime` | Helper condivisi per testo | Rimozione di testo visibile all'assistente, helper per render/chunking/tabella Markdown, helper di redaction, helper per directive-tag, utility per testo sicuro e helper correlati per testo/logging |
  | `plugin-sdk/text-chunking` | Helper per chunking del testo | Helper per il chunking del testo in uscita |
  | `plugin-sdk/speech` | Helper per speech | Tipi di provider speech più helper lato provider per directive, registry e validazione |
  | `plugin-sdk/speech-core` | Core speech condiviso | Tipi di provider speech, registry, directive, normalizzazione |
  | `plugin-sdk/realtime-transcription` | Helper per trascrizione realtime | Tipi di provider e helper del registry |
  | `plugin-sdk/realtime-voice` | Helper per la voce realtime | Tipi di provider e helper del registry |
  | `plugin-sdk/image-generation-core` | Core condiviso per generazione immagini | Tipi per generazione immagini, failover, autenticazione e helper del registry |
  | `plugin-sdk/video-generation` | Helper per la generazione video | Tipi provider/richiesta/risultato per generazione video |
  | `plugin-sdk/video-generation-core` | Core condiviso per generazione video | Tipi per generazione video, helper di failover, lookup del provider e parsing di model-ref |
  | `plugin-sdk/interactive-runtime` | Helper per risposte interattive | Normalizzazione/riduzione del payload delle risposte interattive |
  | `plugin-sdk/channel-config-primitives` | Primitive di configurazione del canale | Primitive ristrette per lo schema di configurazione del canale |
  | `plugin-sdk/channel-config-writes` | Helper per la scrittura della configurazione del canale | Helper di autorizzazione per la scrittura della configurazione del canale |
  | `plugin-sdk/channel-plugin-common` | Preludio condiviso del canale | Export condivisi del preludio del plugin di canale |
  | `plugin-sdk/channel-status` | Helper per lo stato del canale | Helper condivisi per snapshot/riepilogo dello stato del canale |
  | `plugin-sdk/allowlist-config-edit` | Helper di configurazione allowlist | Helper per leggere/modificare la configurazione dell'allowlist |
  | `plugin-sdk/group-access` | Helper per l'accesso di gruppo | Helper condivisi per le decisioni di accesso di gruppo |
  | `plugin-sdk/direct-dm` | Helper per direct-DM | Helper condivisi per auth/guard dei direct-DM |
  | `plugin-sdk/extension-shared` | Helper condivisi delle estensioni | Primitive helper per canale/status passivi |
  | `plugin-sdk/webhook-targets` | Helper per i target webhook | Registry dei target webhook e helper per installazione delle route |
  | `plugin-sdk/webhook-path` | Helper per il percorso webhook | Helper per la normalizzazione del percorso webhook |
  | `plugin-sdk/web-media` | Helper condivisi per web media | Helper per caricamento di media remoti/locali |
  | `plugin-sdk/zod` | Riesportazione di Zod | Riesportazione di `zod` per i consumatori del Plugin SDK |
  | `plugin-sdk/memory-core` | Helper inclusi di memory-core | Superficie helper per manager/configurazione/file/CLI della memoria |
  | `plugin-sdk/memory-core-engine-runtime` | Facade runtime del motore di memoria | Facade runtime di index/search della memoria |
  | `plugin-sdk/memory-core-host-engine-foundation` | Motore foundation host della memoria | Export del motore foundation host della memoria |
  | `plugin-sdk/memory-core-host-engine-embeddings` | Motore embeddings host della memoria | Export del motore embeddings host della memoria |
  | `plugin-sdk/memory-core-host-engine-qmd` | Motore QMD host della memoria | Export del motore QMD host della memoria |
  | `plugin-sdk/memory-core-host-engine-storage` | Motore storage host della memoria | Export del motore storage host della memoria |
  | `plugin-sdk/memory-core-host-multimodal` | Helper multimodali host della memoria | Helper multimodali host della memoria |
  | `plugin-sdk/memory-core-host-query` | Helper query host della memoria | Helper query host della memoria |
  | `plugin-sdk/memory-core-host-secret` | Helper segreti host della memoria | Helper segreti host della memoria |
  | `plugin-sdk/memory-core-host-status` | Helper stato host della memoria | Helper stato host della memoria |
  | `plugin-sdk/memory-core-host-runtime-cli` | Runtime CLI host della memoria | Helper runtime CLI host della memoria |
  | `plugin-sdk/memory-core-host-runtime-core` | Runtime core host della memoria | Helper runtime core host della memoria |
  | `plugin-sdk/memory-core-host-runtime-files` | Helper file/runtime host della memoria | Helper file/runtime host della memoria |
  | `plugin-sdk/memory-lancedb` | Helper inclusi di memory-lancedb | Superficie helper di memory-lancedb |
  | `plugin-sdk/testing` | Utility di test | Helper e mock di test |
</Accordion>

Questa tabella è intenzionalmente il sottoinsieme comune per la migrazione, non l'intera
superficie del SDK. L'elenco completo di oltre 200 entrypoint si trova in
`scripts/lib/plugin-sdk-entrypoints.json`.

Quell'elenco include ancora alcune seam helper dei plugin inclusi come
`plugin-sdk/feishu`, `plugin-sdk/feishu-setup`, `plugin-sdk/zalo`,
`plugin-sdk/zalo-setup` e `plugin-sdk/matrix*`. Queste restano esportate per
la manutenzione e la compatibilità dei plugin inclusi, ma sono intenzionalmente
omesse dalla tabella comune di migrazione e non sono la destinazione consigliata per
nuovo codice plugin.

La stessa regola si applica ad altre famiglie di helper inclusi come:

- helper di supporto browser: `plugin-sdk/browser-config-support`, `plugin-sdk/browser-support`
- Matrix: `plugin-sdk/matrix*`
- LINE: `plugin-sdk/line*`
- IRC: `plugin-sdk/irc*`
- superfici helper/plugin incluse come `plugin-sdk/googlechat`,
  `plugin-sdk/zalouser`, `plugin-sdk/bluebubbles*`,
  `plugin-sdk/mattermost*`, `plugin-sdk/msteams`,
  `plugin-sdk/nextcloud-talk`, `plugin-sdk/nostr`, `plugin-sdk/tlon`,
  `plugin-sdk/twitch`,
  `plugin-sdk/github-copilot-login`, `plugin-sdk/github-copilot-token`,
  `plugin-sdk/diagnostics-otel`, `plugin-sdk/diffs`, `plugin-sdk/llm-task`,
  `plugin-sdk/thread-ownership` e `plugin-sdk/voice-call`

`plugin-sdk/github-copilot-token` espone attualmente la superficie ristretta di helper per token
`DEFAULT_COPILOT_API_BASE_URL`,
`deriveCopilotApiBaseUrlFromToken` e `resolveCopilotApiToken`.

Usa l'import più ristretto che corrisponde al lavoro da fare. Se non riesci a trovare un export,
controlla il sorgente in `src/plugin-sdk/` oppure chiedi su Discord.

## Timeline di rimozione

| Quando                  | Cosa succede                                                          |
| ----------------------- | --------------------------------------------------------------------- |
| **Ora**                 | Le superfici deprecate emettono avvisi a runtime                      |
| **Prossima major release** | Le superfici deprecate verranno rimosse; i plugin che le usano ancora falliranno |

Tutti i plugin core sono già stati migrati. I plugin esterni dovrebbero migrare
prima della prossima major release.

## Sopprimere temporaneamente gli avvisi

Imposta queste variabili d'ambiente mentre lavori alla migrazione:

```bash
OPENCLAW_SUPPRESS_PLUGIN_SDK_COMPAT_WARNING=1 openclaw gateway run
OPENCLAW_SUPPRESS_EXTENSION_API_WARNING=1 openclaw gateway run
```

Questa è una via di fuga temporanea, non una soluzione permanente.

## Correlati

- [Getting Started](/plugins/building-plugins) — crea il tuo primo plugin
- [SDK Overview](/plugins/sdk-overview) — riferimento completo per gli import dei subpath
- [Channel Plugins](/plugins/sdk-channel-plugins) — creare plugin di canale
- [Provider Plugins](/plugins/sdk-provider-plugins) — creare plugin provider
- [Plugin Internals](/plugins/architecture) — approfondimento sull'architettura
- [Plugin Manifest](/plugins/manifest) — riferimento dello schema del manifest
