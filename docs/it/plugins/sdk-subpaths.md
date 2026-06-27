---
read_when:
    - Scegliere il sottopercorso plugin-sdk corretto per un'importazione di Plugin
    - Controllo dei sottopercorsi dei Plugin inclusi e delle superfici helper
summary: 'Catalogo dei sottopercorsi del Plugin SDK: quali importazioni si trovano dove, raggruppate per area'
title: Sottopercorsi Plugin SDK
x-i18n:
    generated_at: "2026-06-27T18:02:13Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: c120877dfcc2ddc17237f1ea1a6eb6daf38dcf714ae6446f59ee06e0ef0dfdcc
    source_path: plugins/sdk-subpaths.md
    workflow: 16
---

L'SDK dei Plugin è esposto come un insieme di sottopercorsi pubblici ristretti sotto
`openclaw/plugin-sdk/`. Questa pagina cataloga i sottopercorsi usati comunemente, raggruppati per
scopo. L'inventario generato degli entrypoint del compilatore si trova in
`scripts/lib/plugin-sdk-entrypoints.json`; le esportazioni del pacchetto sono il sottoinsieme pubblico
dopo aver sottratto i sottopercorsi locali al repo per test/interni elencati in
`scripts/lib/plugin-sdk-private-local-only-subpaths.json`. I manutentori possono verificare
il conteggio delle esportazioni pubbliche con `pnpm plugin-sdk:surface` e i sottopercorsi helper
riservati attivi con `pnpm plugins:boundary-report:summary`; le esportazioni helper riservate
inutilizzate fanno fallire il report CI invece di rimanere nell'SDK pubblico come
debito di compatibilità dormiente.

Per la guida alla creazione di Plugin, consulta [Panoramica dell'SDK dei Plugin](/it/plugins/sdk-overview).

## Ingresso del Plugin

| Sottopercorso                  | Esportazioni chiave                                                                                                                                                    |
| ------------------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `plugin-sdk/plugin-entry`      | `definePluginEntry`                                                                                                                                                    |
| `plugin-sdk/core`              | `defineChannelPluginEntry`, `createChatChannelPlugin`, `createChannelPluginBase`, `defineSetupPluginEntry`, `buildChannelConfigSchema`, `buildJsonChannelConfigSchema` |
| `plugin-sdk/config-schema`     | `OpenClawSchema`                                                                                                                                                       |
| `plugin-sdk/provider-entry`    | `defineSingleProviderPluginEntry`                                                                                                                                      |
| `plugin-sdk/migration`         | Helper per elementi del provider di migrazione come `createMigrationItem`, costanti dei motivi, marcatori di stato degli elementi, helper di redazione e `summarizeMigrationItems` |
| `plugin-sdk/migration-runtime` | Helper di migrazione runtime come `copyMigrationFileItem`, `withCachedMigrationConfigRuntime` e `writeMigrationReport`                                                |
| `plugin-sdk/health`            | Registrazione, rilevamento, riparazione, selezione, severità e tipi di risultati dei controlli di integrità Doctor per i consumer di integrità in bundle               |

### Helper di compatibilità e test deprecati

I sottopercorsi deprecati restano esportati per i Plugin meno recenti, ma il nuovo codice dovrebbe usare i
sottopercorsi SDK mirati qui sotto. L'elenco mantenuto è
`scripts/lib/plugin-sdk-deprecated-public-subpaths.json`; la CI rifiuta le
importazioni di produzione in bundle da questo elenco. I barrel ampi come `compat`, `config-types`,
`infra-runtime`, `text-runtime` e `zod` sono solo per compatibilità. Importa `zod`
direttamente da `zod`.

I sottopercorsi degli helper di test di OpenClaw basati su Vitest sono solo locali al repo e non sono
più esportazioni del pacchetto: `agent-runtime-test-contracts`,
`channel-contract-testing`, `channel-target-testing`, `channel-test-helpers`,
`plugin-test-api`, `plugin-test-contracts`, `plugin-test-runtime`,
`provider-http-test-mocks`, `provider-test-contracts`, `test-env`,
`test-fixtures`, `test-node-mocks` e `testing`.

### Sottopercorsi helper riservati dei Plugin in bundle

Questi sottopercorsi sono superfici di compatibilità di proprietà del Plugin per il rispettivo Plugin
in bundle proprietario, non API SDK generali: `plugin-sdk/codex-mcp-projection` e
`plugin-sdk/codex-native-task-runtime`. Le importazioni di estensioni tra proprietari sono bloccate
dai guardrail del contratto del pacchetto.

  <AccordionGroup>
  <Accordion title="Channel subpaths">
    | Sottopercorso | Esportazioni principali |
    | --- | --- |
    | `plugin-sdk/channel-core` | `defineChannelPluginEntry`, `defineSetupPluginEntry`, `createChatChannelPlugin`, `createChannelPluginBase` |
    | `plugin-sdk/config-schema` | Esportazione dello schema Zod radice di `openclaw.json` (`OpenClawSchema`) |
    | `plugin-sdk/json-schema-runtime` | Helper di validazione JSON Schema con cache per schemi di proprietà del plugin |
    | `plugin-sdk/channel-setup` | `createOptionalChannelSetupSurface`, `createOptionalChannelSetupAdapter`, `createOptionalChannelSetupWizard`, più `DEFAULT_ACCOUNT_ID`, `createTopLevelChannelDmPolicy`, `setSetupChannelEnabled`, `splitSetupEntries` |
    | `plugin-sdk/setup` | Helper condivisi per la procedura guidata di configurazione, traduttore di configurazione, prompt di allowlist, builder dello stato di configurazione |
    | `plugin-sdk/setup-runtime` | `createSetupTranslator`, `createPatchedAccountSetupAdapter`, `createEnvPatchedAccountSetupAdapter`, `createSetupInputPresenceValidator`, `noteChannelLookupFailure`, `noteChannelLookupSummary`, `promptResolvedAllowFrom`, `splitSetupEntries`, `createAllowlistSetupWizardProxy`, `createDelegatedSetupWizardProxy` |
    | `plugin-sdk/setup-adapter-runtime` | Alias di compatibilità deprecato; usa `plugin-sdk/setup-runtime` |
    | `plugin-sdk/setup-tools` | `formatCliCommand`, `detectBinary`, `extractArchive`, `resolveBrewExecutable`, `formatDocsLink`, `CONFIG_DIR` |
    | `plugin-sdk/account-core` | Helper per configurazione multi-account/gate di azione, helper di fallback per account predefinito |
    | `plugin-sdk/account-id` | `DEFAULT_ACCOUNT_ID`, helper di normalizzazione dell'ID account |
    | `plugin-sdk/account-resolution` | Helper di ricerca account + fallback predefinito |
    | `plugin-sdk/account-helpers` | Helper ristretti per elenchi di account/azioni account |
    | `plugin-sdk/access-groups` | Helper per parsing della allowlist dei gruppi di accesso e diagnostica redatta dei gruppi |
    | `plugin-sdk/channel-pairing` | `createChannelPairingController` |
    | `plugin-sdk/channel-reply-pipeline` | Facciata di compatibilità deprecata. Usa `plugin-sdk/channel-outbound`. |
    | `plugin-sdk/channel-config-helpers` | `createHybridChannelConfigAdapter`, `resolveChannelDmAccess`, `resolveChannelDmAllowFrom`, `resolveChannelDmPolicy`, `normalizeChannelDmPolicy`, `normalizeLegacyDmAliases` |
    | `plugin-sdk/channel-config-schema` | Primitive condivise dello schema di configurazione dei canali più builder Zod e JSON/TypeBox diretti |
    | `plugin-sdk/bundled-channel-config-schema` | Schemi di configurazione dei canali OpenClaw in bundle solo per plugin in bundle mantenuti |
    | `plugin-sdk/chat-channel-ids` | `BUNDLED_CHAT_CHANNEL_IDS`, `BUNDLED_CHAT_CHANNEL_ENVELOPE_PREFIXES`, `ChatChannelId`. ID canonici dei canali chat in bundle/ufficiali più etichette/alias del formatter per plugin che devono riconoscere testo con prefisso envelope senza codificare rigidamente la propria tabella. |
    | `plugin-sdk/channel-config-schema-legacy` | Alias di compatibilità deprecato per gli schemi di configurazione dei canali in bundle |
    | `plugin-sdk/telegram-command-config` | Helper di normalizzazione/validazione dei comandi personalizzati Telegram con fallback del contratto in bundle |
    | `plugin-sdk/command-gating` | Helper ristretti per gate di autorizzazione dei comandi |
    | `plugin-sdk/channel-policy` | `resolveChannelGroupRequireMention` |
    | `plugin-sdk/channel-ingress` | Facciata deprecata di compatibilità per ingress dei canali di basso livello. I nuovi percorsi di ricezione dovrebbero usare `plugin-sdk/channel-ingress-runtime`. |
    | `plugin-sdk/channel-ingress-runtime` | Resolver runtime sperimentale di alto livello per ingress dei canali e builder di fatti di route per percorsi di ricezione dei canali migrati. Preferiscilo all'assemblaggio di allowlist effettive, allowlist di comandi e proiezioni legacy in ogni plugin. Vedi [API di ingress dei canali](/it/plugins/sdk-channel-ingress). |
    | `plugin-sdk/channel-lifecycle` | Facciata di compatibilità deprecata. Usa `plugin-sdk/channel-outbound`. |
    | `plugin-sdk/channel-outbound` | Contratti del ciclo di vita dei messaggi più opzioni della pipeline di risposta, ricevute, anteprima live/streaming, helper del ciclo di vita, identità outbound, pianificazione del payload, invii durevoli e helper del contesto di invio messaggi. Vedi [API outbound dei canali](/it/plugins/sdk-channel-outbound). |
    | `plugin-sdk/channel-message` | Alias di compatibilità deprecato per `plugin-sdk/channel-outbound` più facciate legacy per dispatch delle risposte. |
    | `plugin-sdk/channel-message-runtime` | Alias di compatibilità deprecato per `plugin-sdk/channel-outbound` più facciate legacy per dispatch delle risposte. |
    | `plugin-sdk/inbound-envelope` | Helper condivisi per route inbound + builder envelope |
    | `plugin-sdk/inbound-reply-dispatch` | Facciata di compatibilità deprecata. Usa `plugin-sdk/channel-inbound` per runner inbound e predicati di dispatch, e `plugin-sdk/channel-outbound` per helper di consegna dei messaggi. |
    | `plugin-sdk/messaging-targets` | Alias deprecato per il parsing dei target; usa `plugin-sdk/channel-targets` |
    | `plugin-sdk/outbound-media` | Helper condivisi per caricamento dei media outbound e stato dei media ospitati |
    | `plugin-sdk/outbound-send-deps` | Facciata di compatibilità deprecata. Usa `plugin-sdk/channel-outbound`. |
    | `plugin-sdk/outbound-runtime` | Facciata di compatibilità deprecata. Usa `plugin-sdk/channel-outbound`. |
    | `plugin-sdk/poll-runtime` | Helper ristretti per normalizzazione dei sondaggi |
    | `plugin-sdk/thread-bindings-runtime` | Helper per ciclo di vita e adapter dei binding dei thread |
    | `plugin-sdk/agent-media-payload` | Builder legacy del payload media dell'agente |
    | `plugin-sdk/conversation-runtime` | Helper per binding conversazione/thread, pairing e binding configurati |
    | `plugin-sdk/runtime-config-snapshot` | Helper per snapshot della configurazione runtime |
    | `plugin-sdk/runtime-group-policy` | Helper per risoluzione delle policy dei gruppi runtime |
    | `plugin-sdk/channel-status` | Helper condivisi per snapshot/riepilogo dello stato dei canali |
    | `plugin-sdk/channel-config-primitives` | Primitive ristrette dello schema di configurazione dei canali |
    | `plugin-sdk/channel-config-writes` | Helper di autorizzazione alla scrittura della configurazione dei canali |
    | `plugin-sdk/channel-plugin-common` | Esportazioni condivise del prelude dei plugin canale |
    | `plugin-sdk/allowlist-config-edit` | Helper per modifica/lettura della configurazione allowlist |
    | `plugin-sdk/group-access` | Helper condivisi per decisioni di accesso ai gruppi |
    | `plugin-sdk/direct-dm`, `plugin-sdk/direct-dm-access` | Facciate di compatibilità deprecate. Usa `plugin-sdk/channel-inbound`. |
    | `plugin-sdk/direct-dm-guard-policy` | Helper ristretti per policy di guardia direct-DM pre-crypto |
    | `plugin-sdk/discord` | Facciata deprecata di compatibilità Discord per `@openclaw/discord@2026.3.13` pubblicato e compatibilità del proprietario tracciata; i nuovi plugin dovrebbero usare sottopercorsi generici dell'SDK dei canali |
    | `plugin-sdk/telegram-account` | Facciata deprecata di compatibilità per risoluzione degli account Telegram per compatibilità del proprietario tracciata; i nuovi plugin dovrebbero usare helper runtime iniettati o sottopercorsi generici dell'SDK dei canali |
    | `plugin-sdk/zalouser` | Facciata deprecata di compatibilità Zalo Personal per pacchetti Lark/Zalo pubblicati che importano ancora l'autorizzazione dei comandi del mittente; i nuovi plugin dovrebbero usare `plugin-sdk/command-auth` |
    | `plugin-sdk/interactive-runtime` | Presentazione semantica dei messaggi, consegna e helper legacy per risposte interattive. Vedi [Presentazione dei messaggi](/it/plugins/message-presentation) |
    | `plugin-sdk/channel-inbound` | Helper inbound condivisi per classificazione eventi, costruzione del contesto, formattazione, root, debounce, corrispondenza delle menzioni, policy delle menzioni e logging inbound |
    | `plugin-sdk/channel-inbound-debounce` | Helper ristretti per debounce inbound |
    | `plugin-sdk/channel-mention-gating` | Helper ristretti per policy delle menzioni, marker di menzione e testo delle menzioni senza la superficie più ampia del runtime inbound |
    | `plugin-sdk/channel-envelope`, `plugin-sdk/channel-inbound-roots`, `plugin-sdk/channel-location`, `plugin-sdk/channel-logging` | Facciate di compatibilità deprecate. Usa `plugin-sdk/channel-inbound` o `plugin-sdk/channel-outbound`. |
    | `plugin-sdk/channel-pairing-paths` | Facciata di compatibilità deprecata. Usa `plugin-sdk/channel-pairing`. |
    | `plugin-sdk/channel-reply-options-runtime` | Facciata di compatibilità deprecata. Usa `plugin-sdk/channel-outbound`. |
    | `plugin-sdk/channel-streaming` | Facciata di compatibilità deprecata. Usa `plugin-sdk/channel-outbound`. |
    | `plugin-sdk/channel-send-result` | Tipi di risultato della risposta |
    | `plugin-sdk/channel-actions` | Helper per azioni sui messaggi dei canali, più helper deprecati per schemi nativi mantenuti per compatibilità dei plugin |
    | `plugin-sdk/channel-route` | Helper condivisi per normalizzazione delle route, risoluzione dei target guidata da parser, stringificazione degli ID thread, chiavi route dedupe/compatte, tipi di target analizzati e confronto route/target |
    | `plugin-sdk/channel-targets` | Helper per parsing dei target; i chiamanti del confronto route dovrebbero usare `plugin-sdk/channel-route` |
    | `plugin-sdk/channel-contract` | Tipi del contratto dei canali |
    | `plugin-sdk/channel-feedback` | Cablaggio di feedback/reazioni |
    | `plugin-sdk/channel-secret-runtime` | Helper ristretti per contratti secret come `collectSimpleChannelFieldAssignments`, `getChannelSurface`, `pushAssignment` e tipi di target secret |
  </Accordion>

Le famiglie di helper di canale deprecate restano disponibili solo per la
compatibilità dei plugin pubblicati. Il piano di rimozione è: mantenerle per
tutta la finestra di migrazione dei plugin esterni, mantenere i plugin del repo/in bundle su `channel-inbound` e
`channel-outbound`, quindi rimuovere i sottopercorsi di compatibilità nella successiva pulizia major
dell'SDK. Questo si applica alle vecchie famiglie di messaggi/runtime di canale, streaming di canale, accesso
direct-DM, ramificazione degli helper in ingresso, reply-options
e pairing-path.

  <Accordion title="Provider subpaths">
    | Sottopercorso | Esportazioni principali |
    | --- | --- |
    | `plugin-sdk/provider-entry` | `defineSingleProviderPluginEntry` |
    | `plugin-sdk/lmstudio` | Facade del provider LM Studio supportata per configurazione, individuazione del catalogo e preparazione del modello runtime |
    | `plugin-sdk/lmstudio-runtime` | Facade runtime LM Studio supportata per impostazioni predefinite del server locale, individuazione dei modelli, intestazioni delle richieste e helper per i modelli caricati |
    | `plugin-sdk/provider-setup` | Helper selezionati per la configurazione di provider locali/autogestiti |
    | `plugin-sdk/self-hosted-provider-setup` | Helper mirati per la configurazione di provider autogestiti compatibili con OpenAI |
    | `plugin-sdk/cli-backend` | Impostazioni predefinite del backend CLI + costanti watchdog |
    | `plugin-sdk/provider-auth-runtime` | Helper runtime per la risoluzione delle chiavi API per i Plugin provider |
    | `plugin-sdk/provider-oauth-runtime` | Tipi generici di callback OAuth del provider, rendering della pagina di callback, helper PKCE/stato, parsing dell'input di autorizzazione, helper di scadenza dei token e helper di interruzione |
    | `plugin-sdk/provider-auth-api-key` | Helper di onboarding/scrittura profilo per chiavi API, come `upsertApiKeyProfile` |
    | `plugin-sdk/provider-auth-result` | Builder standard del risultato di autenticazione OAuth |
    | `plugin-sdk/provider-env-vars` | Helper di ricerca delle variabili d'ambiente per l'autenticazione del provider |
    | `plugin-sdk/provider-auth` | `createProviderApiKeyAuthMethod`, `ensureApiKeyFromOptionEnvOrPrompt`, `upsertAuthProfile`, `upsertApiKeyProfile`, `writeOAuthCredentials`, helper di importazione autenticazione OpenAI Codex, esportazione di compatibilità deprecata `resolveOpenClawAgentDir` |
    | `plugin-sdk/provider-model-shared` | `ProviderReplayFamily`, `buildProviderReplayFamilyHooks`, `normalizeModelCompat`, builder condivisi di policy di replay, helper per endpoint provider e helper condivisi di normalizzazione degli ID modello |
    | `plugin-sdk/provider-catalog-live-runtime` | Helper del catalogo modelli provider live per individuazione protetta in stile `/models`: `buildLiveModelProviderConfig`, `fetchLiveProviderModelRows`, `getCachedLiveProviderModelRows`, `fetchLiveProviderModelIds`, `LiveModelCatalogHttpError`, `clearLiveCatalogCacheForTests`, filtro degli ID modello, cache TTL e fallback statico |
    | `plugin-sdk/provider-catalog-runtime` | Hook runtime di aumento del catalogo provider e punti di integrazione del registro Plugin-provider per test di contratto |
    | `plugin-sdk/provider-catalog-shared` | `findCatalogTemplate`, `buildSingleProviderApiKeyCatalog`, `buildManifestModelProviderConfig`, `supportsNativeStreamingUsageCompat`, `applyProviderNativeStreamingUsageCompat` |
    | `plugin-sdk/provider-http` | Helper generici per capacità HTTP/endpoint del provider, errori HTTP del provider e helper per moduli multipart di trascrizione audio |
    | `plugin-sdk/provider-web-fetch-contract` | Helper di contratto ristretti per configurazione/selezione web-fetch, come `enablePluginInConfig` e `WebFetchProviderPlugin` |
    | `plugin-sdk/provider-web-fetch` | Helper di registrazione/cache del provider web-fetch |
    | `plugin-sdk/provider-web-search-config-contract` | Helper ristretti di configurazione/credenziali web-search per provider che non richiedono cablaggio di abilitazione Plugin |
    | `plugin-sdk/provider-web-search-contract` | Helper ristretti di contratto configurazione/credenziali web-search, come `createWebSearchProviderContractFields`, `enablePluginInConfig`, `resolveProviderWebSearchPluginConfig` e setter/getter di credenziali con ambito |
    | `plugin-sdk/provider-web-search` | Helper di registrazione/cache/runtime del provider web-search |
    | `plugin-sdk/embedding-providers` | Tipi generali di provider di embedding e helper di lettura, inclusi `EmbeddingProviderAdapter`, `getEmbeddingProvider(...)` e `listEmbeddingProviders(...)`; i Plugin registrano i provider tramite `api.registerEmbeddingProvider(...)` in modo da applicare la proprietà del manifest |
    | `plugin-sdk/provider-tools` | `ProviderToolCompatFamily`, `buildProviderToolCompatFamilyHooks` e pulizia schema + diagnostica DeepSeek/Gemini/OpenAI |
    | `plugin-sdk/provider-usage` | Tipi di snapshot di utilizzo del provider, helper condivisi di recupero utilizzo e fetcher provider come `fetchClaudeUsage` |
    | `plugin-sdk/provider-stream` | `ProviderStreamFamily`, `buildProviderStreamFamilyHooks`, `composeProviderStreamWrappers`, tipi di wrapper stream, compatibilità per chiamate a strumenti in testo semplice e helper wrapper condivisi Anthropic/Bedrock/DeepSeek V4/Google/Kilocode/Moonshot/OpenAI/OpenRouter/Z.A.I/MiniMax/Copilot |
    | `plugin-sdk/provider-stream-shared` | Helper pubblici condivisi per wrapper stream del provider, inclusi `composeProviderStreamWrappers`, `createOpenAICompatibleCompletionsThinkingOffWrapper`, `createPlainTextToolCallCompatWrapper`, `createPayloadPatchStreamWrapper`, `createToolStreamWrapper`, `normalizeOpenAICompatibleReasoningPayload`, `setQwenChatTemplateThinking` e utility stream compatibili con Anthropic/DeepSeek/OpenAI |
    | `plugin-sdk/provider-transport-runtime` | Helper di trasporto provider nativi, come fetch protetto, trasformazioni dei messaggi di trasporto e stream di eventi di trasporto scrivibili |
    | `plugin-sdk/provider-onboard` | Helper di patch della configurazione di onboarding |
    | `plugin-sdk/global-singleton` | Helper di singleton/mappa/cache locali al processo |
    | `plugin-sdk/group-activation` | Helper ristretti per modalità di attivazione dei gruppi e parsing dei comandi |
  </Accordion>

Gli snapshot di utilizzo dei provider normalmente riportano una o più `windows` di quota, ciascuna con
un'etichetta, la percentuale usata e un orario di reimpostazione opzionale. I provider che espongono testo di saldo o
stato dell'account invece di finestre di quota reimpostabili dovrebbero restituire
`summary` con un array `windows` vuoto, invece di inventare percentuali.
OpenClaw mostra quel testo di riepilogo nell'output di stato; usa `error` solo quando
l'endpoint di utilizzo non è riuscito o non ha restituito dati di utilizzo utilizzabili.

  <Accordion title="Auth and security subpaths">
    | Sottopercorso | Esportazioni principali |
    | --- | --- |
    | `plugin-sdk/command-auth` | `resolveControlCommandGate`, helper del registro comandi inclusa la formattazione dinamica dei menu degli argomenti, helper di autorizzazione mittente |
    | `plugin-sdk/command-status` | Builder di messaggi comando/aiuto come `buildCommandsMessagePaginated` e `buildHelpMessage` |
    | `plugin-sdk/approval-auth-runtime` | Risoluzione dell'approvatore e helper di autenticazione azioni nella stessa chat |
    | `plugin-sdk/approval-client-runtime` | Helper nativi per profili/filtri di approvazione exec |
    | `plugin-sdk/approval-delivery-runtime` | Adattatori nativi di capacità/consegna approvazione |
    | `plugin-sdk/approval-gateway-runtime` | Helper condiviso di risoluzione Gateway approvazione |
    | `plugin-sdk/approval-handler-adapter-runtime` | Helper leggeri di caricamento adattatori nativi di approvazione per entrypoint di canali hot |
    | `plugin-sdk/approval-handler-runtime` | Helper runtime più ampi per gestori di approvazione; preferisci i punti di integrazione adapter/Gateway più ristretti quando sono sufficienti |
    | `plugin-sdk/approval-native-runtime` | Helper nativi per target di approvazione, associazione account, route-gate, fallback di inoltro e soppressione prompt exec nativo locale |
    | `plugin-sdk/approval-reaction-runtime` | Binding hardcoded delle reazioni di approvazione, payload dei prompt di reazione, store dei target di reazione ed esportazione di compatibilità per la soppressione del prompt exec nativo locale |
    | `plugin-sdk/approval-reply-runtime` | Helper payload di risposta approvazione exec/Plugin |
    | `plugin-sdk/approval-runtime` | Helper payload di approvazione exec/Plugin, helper runtime/routing approvazione nativa e helper di visualizzazione approvazione strutturata come `formatApprovalDisplayPath` |
    | `plugin-sdk/reply-dedupe` | Helper ristretti di reset dedupe delle risposte in ingresso |
    | `plugin-sdk/channel-contract-testing` | Helper ristretti per test di contratto dei canali senza il barrel di testing ampio |
    | `plugin-sdk/command-auth-native` | Autenticazione nativa dei comandi, formattazione dinamica dei menu degli argomenti e helper nativi per target di sessione |
    | `plugin-sdk/command-detection` | Helper condivisi di rilevamento comandi |
    | `plugin-sdk/command-primitives-runtime` | Predicati leggeri sul testo dei comandi per percorsi hot dei canali |
    | `plugin-sdk/command-surface` | Normalizzazione del corpo dei comandi e helper della superficie comandi |
    | `plugin-sdk/allow-from` | `formatAllowFromLowercase` |
    | `plugin-sdk/channel-secret-runtime` | Helper ristretti di raccolta contratti dei segreti per superfici di segreti canale/Plugin |
    | `plugin-sdk/secret-ref-runtime` | Helper ristretti di tipizzazione `coerceSecretRef` e SecretRef per parsing di contratti/configurazioni dei segreti |
    | `plugin-sdk/secret-provider-integration` | Manifest di integrazione provider SecretRef solo tipi e contratti preset per Plugin che pubblicano preset di provider di segreti esterni |
    | `plugin-sdk/security-runtime` | Helper condivisi per fiducia, gating DM, file/percorsi limitati alla root, incluse scritture solo in creazione, sostituzione atomica di file sync/async, scritture temporanee sibling, fallback per spostamenti cross-device, helper di file-store privato, guardie sui symlink parent, contenuti esterni, redazione di testo sensibile, confronto di segreti in tempo costante e helper di raccolta segreti |
    | `plugin-sdk/ssrf-policy` | Helper di allowlist host e policy SSRF per reti private |
    | `plugin-sdk/ssrf-dispatcher` | Helper ristretti per pinned-dispatcher senza la superficie runtime infrastrutturale ampia |
    | `plugin-sdk/ssrf-runtime` | Pinned-dispatcher, fetch protetto da SSRF, errore SSRF e helper di policy SSRF |
    | `plugin-sdk/secret-input` | Helper di parsing input segreti |
    | `plugin-sdk/webhook-ingress` | Helper di richiesta/target Webhook e coercizione raw websocket/body |
    | `plugin-sdk/webhook-request-guards` | Helper per dimensione/timeout del corpo richiesta |
  </Accordion>

  <Accordion title="Sottopercorsi di runtime e archiviazione">
    | Sottopercorso | Esportazioni principali |
    | --- | --- |
    | `plugin-sdk/runtime` | Helper generali per runtime/logging/backup/installazione di Plugin |
    | `plugin-sdk/runtime-env` | Helper mirati per env di runtime, logger, timeout, retry e backoff |
    | `plugin-sdk/browser-config` | Facade di configurazione browser supportata per profilo/default normalizzati, parsing degli URL CDP e helper di autenticazione per il controllo del browser |
    | `plugin-sdk/agent-harness-task-runtime` | Helper generici per ciclo di vita delle attività e consegna del completamento per agenti supportati da harness che usano un ambito attività emesso dall'host |
    | `plugin-sdk/codex-mcp-projection` | Helper Codex incluso riservato per proiettare la configurazione del server MCP utente nella configurazione del thread Codex; non per Plugin di terze parti |
    | `plugin-sdk/codex-native-task-runtime` | Helper Codex incluso privato per mirror di attività native/cablaggio runtime; non per Plugin di terze parti |
    | `plugin-sdk/channel-runtime-context` | Helper generici per registrazione e lookup del contesto runtime del canale |
    | `plugin-sdk/matrix` | Facade di compatibilità Matrix deprecata per pacchetti di canale di terze parti più vecchi; i nuovi Plugin dovrebbero importare direttamente `plugin-sdk/run-command` |
    | `plugin-sdk/mattermost` | Facade di compatibilità Mattermost deprecata per pacchetti di canale di terze parti più vecchi; i nuovi Plugin dovrebbero importare direttamente i sottopercorsi SDK generici |
    | `plugin-sdk/runtime-store` | `createPluginRuntimeStore` |
    | `plugin-sdk/plugin-runtime` | Helper condivisi per comandi/hook/http/interattività dei Plugin |
    | `plugin-sdk/hook-runtime` | Helper condivisi per pipeline di hook Webhook/interni |
    | `plugin-sdk/lazy-runtime` | Helper per import/binding runtime lazy come `createLazyRuntimeModule`, `createLazyRuntimeMethod` e `createLazyRuntimeSurface` |
    | `plugin-sdk/process-runtime` | Helper di exec processo |
    | `plugin-sdk/cli-runtime` | Helper CLI per formattazione, attesa, versione, invocazione argomenti e gruppi di comandi lazy |
    | `plugin-sdk/qa-live-transport-scenarios` | ID condivisi di scenari QA di trasporto live, helper per copertura baseline e helper per selezione scenari |
    | `plugin-sdk/gateway-method-runtime` | Helper riservato per dispatch dei metodi Gateway per route HTTP dei Plugin che dichiarano `contracts.gatewayMethodDispatch: ["authenticated-request"]` |
    | `plugin-sdk/gateway-runtime` | Client Gateway, helper di avvio client pronto per event loop, RPC CLI Gateway, errori del protocollo Gateway e helper per patch dello stato canale |
    | `plugin-sdk/config-contracts` | Superficie config mirata solo per tipi per forme di configurazione dei Plugin come `OpenClawConfig` e tipi di configurazione canale/provider |
    | `plugin-sdk/plugin-config-runtime` | Helper di lookup runtime per configurazione Plugin come `requireRuntimeConfig`, `resolvePluginConfigObject` e `resolveLivePluginConfigObject` |
    | `plugin-sdk/config-mutation` | Helper di mutazione config transazionale come `mutateConfigFile`, `replaceConfigFile` e `logConfigUpdated` |
    | `plugin-sdk/message-tool-delivery-hints` | Stringhe condivise di hint metadati per consegna message-tool |
    | `plugin-sdk/runtime-config-snapshot` | Helper per snapshot della configurazione del processo corrente come `getRuntimeConfig`, `getRuntimeConfigSnapshot` e setter di snapshot per test |
    | `plugin-sdk/telegram-command-config` | Normalizzazione nome/descrizione dei comandi Telegram e controlli di duplicati/conflitti, anche quando la superficie del contratto Telegram inclusa non è disponibile |
    | `plugin-sdk/text-autolink-runtime` | Rilevamento autolink dei riferimenti file senza l'ampio barrel di testo |
    | `plugin-sdk/approval-reaction-runtime` | Binding hardcoded delle reazioni di approvazione, payload dei prompt di reazione, store dei target di reazione ed esportazione di compatibilità per la soppressione del prompt exec nativo locale |
    | `plugin-sdk/approval-runtime` | Helper per approvazione exec/Plugin, builder di capability di approvazione, helper auth/profilo, helper di routing/runtime nativo e formattazione strutturata del percorso di visualizzazione dell'approvazione |
    | `plugin-sdk/reply-runtime` | Helper condivisi di runtime inbound/risposta, chunking, dispatch, Heartbeat, pianificatore di risposta |
    | `plugin-sdk/reply-dispatch-runtime` | Helper mirati per dispatch/finalize della risposta e label conversazione |
    | `plugin-sdk/reply-history` | Helper condivisi per cronologia risposte a finestra breve. Il nuovo codice message-turn dovrebbe usare `createChannelHistoryWindow`; gli helper map di livello inferiore restano solo esportazioni di compatibilità deprecate |
    | `plugin-sdk/reply-reference` | `createReplyReferencePlanner` |
    | `plugin-sdk/reply-chunking` | Helper mirati per chunking testo/markdown |
    | `plugin-sdk/session-store-runtime` | Helper per workflow di sessione (`getSessionEntry`, `listSessionEntries`, `patchSessionEntry`, `upsertSessionEntry`), letture limitate di testo transcript recente utente/assistant per identità sessione, helper legacy per percorso store sessioni/chiave sessione, letture updated-at e helper di compatibilità solo transitori per store intero/percorso file |
    | `plugin-sdk/session-transcript-runtime` | Identità transcript, helper target/read/write con ambito, pubblicazione aggiornamenti, lock di scrittura e chiavi di hit memoria transcript |
    | `plugin-sdk/sqlite-runtime` | Helper mirati per schema agente SQLite, percorso e transazioni per runtime first-party |
    | `plugin-sdk/cron-store-runtime` | Helper per percorso/caricamento/salvataggio dello store Cron |
    | `plugin-sdk/state-paths` | Helper per percorsi dir State/OAuth |
    | `plugin-sdk/plugin-state-runtime` | Tipi di stato keyed SQLite sidecar per Plugin, più setup centralizzato di pragma connessione e manutenzione WAL per database di proprietà dei Plugin |
    | `plugin-sdk/routing` | Helper per route/chiave sessione/binding account come `resolveAgentRoute`, `buildAgentSessionKey` e `resolveDefaultAgentBoundAccountId` |
    | `plugin-sdk/status-helpers` | Helper condivisi per riepilogo stato canale/account, default dello stato runtime e helper metadati issue |
    | `plugin-sdk/target-resolver-runtime` | Helper condivisi per risolutore target |
    | `plugin-sdk/string-normalization-runtime` | Helper di normalizzazione slug/stringhe |
    | `plugin-sdk/request-url` | Estrae URL stringa da input simili a fetch/request |
    | `plugin-sdk/run-command` | Runner di comandi temporizzato con risultati stdout/stderr normalizzati |
    | `plugin-sdk/param-readers` | Reader comuni per parametri tool/CLI |
    | `plugin-sdk/tool-plugin` | Definisce un semplice Plugin agent-tool tipizzato ed espone metadati statici per la generazione del manifest |
    | `plugin-sdk/tool-payload` | Estrae payload normalizzati da oggetti risultato tool |
    | `plugin-sdk/tool-send` | Estrae campi target di invio canonici dagli argomenti tool |
    | `plugin-sdk/sandbox` | Tipi backend sandbox e helper per comandi SSH/OpenShell, incluso preflight fail-fast dei comandi exec |
    | `plugin-sdk/temp-path` | Helper condivisi per percorsi temp-download e workspace temporanei sicuri privati |
    | `plugin-sdk/logging-core` | Logger di sottosistema e helper di redazione |
    | `plugin-sdk/markdown-table-runtime` | Helper per modalità tabella Markdown e conversione |
    | `plugin-sdk/model-session-runtime` | Helper per override modello/sessione come `applyModelOverrideToSessionEntry` e `resolveAgentMaxConcurrent` |
    | `plugin-sdk/talk-config-runtime` | Helper per risoluzione configurazione provider Talk |
    | `plugin-sdk/json-store` | Piccoli helper di lettura/scrittura stato JSON |
    | `plugin-sdk/json-unsafe-integers` | Helper di parsing JSON che preservano i letterali interi non sicuri come stringhe |
    | `plugin-sdk/file-lock` | Helper file-lock rientranti |
    | `plugin-sdk/persistent-dedupe` | Helper per cache dedupe supportata da disco |
    | `plugin-sdk/acp-runtime` | Helper ACP per runtime/sessione e dispatch risposte |
    | `plugin-sdk/acp-runtime-backend` | Helper leggeri per registrazione backend ACP e dispatch risposte per Plugin caricati all'avvio |
    | `plugin-sdk/acp-binding-resolve-runtime` | Risoluzione binding ACP in sola lettura senza import di avvio lifecycle |
    | `plugin-sdk/agent-config-primitives` | Primitive mirate dello schema di configurazione runtime agente |
    | `plugin-sdk/boolean-param` | Reader permissivo di parametri booleani |
    | `plugin-sdk/dangerous-name-runtime` | Helper per risoluzione matching di nomi pericolosi |
    | `plugin-sdk/device-bootstrap` | Helper per bootstrap dispositivo e token di pairing |
    | `plugin-sdk/extension-shared` | Primitive helper condivise per canali passivi, stato e proxy ambient |
    | `plugin-sdk/models-provider-runtime` | Helper per risposte comando/provider `/models` |
    | `plugin-sdk/skill-commands-runtime` | Helper per elenco comandi Skill |
    | `plugin-sdk/native-command-registry` | Helper per registro/build/serializzazione di comandi nativi |
    | `plugin-sdk/agent-harness` | Superficie sperimentale trusted-plugin per harness agente di basso livello: tipi harness, helper per steer/abort di active-run, helper bridge tool OpenClaw, helper policy tool runtime-plan, classificazione esito terminale, helper di formattazione/dettaglio avanzamento tool e utilità risultato tentativo |
    | `plugin-sdk/provider-zai-endpoint` | Facade deprecata di rilevamento endpoint di proprietà del provider Z.AI; usa l'API pubblica del Plugin Z.AI |
    | `plugin-sdk/async-lock-runtime` | Helper di lock async process-local per piccoli file di stato runtime |
    | `plugin-sdk/channel-activity-runtime` | Helper di telemetria attività canale |
    | `plugin-sdk/concurrency-runtime` | Helper di concorrenza task async limitata |
    | `plugin-sdk/dedupe-runtime` | Helper per cache dedupe in memoria |
    | `plugin-sdk/delivery-queue-runtime` | Helper per drain delle consegne pending in uscita |
    | `plugin-sdk/file-access-runtime` | Helper sicuri per percorsi file locali e sorgenti media |
    | `plugin-sdk/heartbeat-runtime` | Helper di wake, evento e visibilità Heartbeat |
    | `plugin-sdk/number-runtime` | Helper di coercizione numerica |
    | `plugin-sdk/secure-random-runtime` | Helper per token/UUID sicuri |
    | `plugin-sdk/system-event-runtime` | Helper per coda eventi di sistema |
    | `plugin-sdk/transport-ready-runtime` | Helper di attesa prontezza trasporto |
    | `plugin-sdk/exec-approvals-runtime` | Helper per file policy di approvazione exec senza l'ampio barrel infra-runtime |
    | `plugin-sdk/infra-runtime` | Shim di compatibilità deprecato; usa i sottopercorsi runtime mirati sopra |
    | `plugin-sdk/collection-runtime` | Piccoli helper per cache limitate |
    | `plugin-sdk/diagnostic-runtime` | Helper per flag diagnostici, eventi e trace-context |
    | `plugin-sdk/error-runtime` | Grafo errori, formattazione, helper condivisi di classificazione errori, `isApprovalNotFoundError` |
    | `plugin-sdk/fetch-runtime` | Fetch wrappato, proxy, opzione EnvHttpProxyAgent e helper di lookup pinned |
    | `plugin-sdk/runtime-fetch` | Fetch runtime consapevole del dispatcher senza import proxy/guarded-fetch |
    | `plugin-sdk/inline-image-data-url-runtime` | Sanitizzatore URL dati immagine inline e helper di sniffing firma senza l'ampia superficie runtime media |
    | `plugin-sdk/response-limit-runtime` | Reader limitato del corpo risposta senza l'ampia superficie runtime media |
    | `plugin-sdk/session-binding-runtime` | Stato binding conversazione corrente senza routing binding configurato o store di pairing |
    | `plugin-sdk/session-store-runtime` | Helper session-store senza import ampi per scritture/manutenzione config |
    | `plugin-sdk/sqlite-runtime` | Helper mirati per schema agente SQLite, percorso e transazioni senza controlli del lifecycle database |
    | `plugin-sdk/context-visibility-runtime` | Risoluzione visibilità contesto e filtraggio contesto supplementare senza import ampi config/security |
    | `plugin-sdk/string-coerce-runtime` | Helper mirati di coercizione e normalizzazione record primitivi/stringhe senza import markdown/logging |
    | `plugin-sdk/host-runtime` | Helper di normalizzazione hostname e host SCP |
    | `plugin-sdk/retry-runtime` | Helper per configurazione retry e runner retry |
    | `plugin-sdk/agent-runtime` | Helper per dir/identità/workspace agente, inclusi `resolveAgentDir`, `resolveDefaultAgentDir` ed esportazione di compatibilità deprecata `resolveOpenClawAgentDir` |
    | `plugin-sdk/directory-runtime` | Query/dedup directory supportata da config |
    | `plugin-sdk/keyed-async-queue` | `KeyedAsyncQueue` |
  </Accordion>

  <Accordion title="Sottopercorsi di funzionalità e test">
    | Sottopercorso | Esportazioni principali |
    | --- | --- |
    | `plugin-sdk/media-runtime` | Helper condivisi per recuperare/trasformare/archiviare media, inclusi `saveRemoteMedia`, `saveResponseMedia`, `readRemoteMediaBuffer` e il deprecato `fetchRemoteMedia`; preferisci gli helper di archiviazione prima delle letture del buffer quando un URL deve diventare un media OpenClaw |
    | `plugin-sdk/media-mime` | Normalizzazione MIME mirata, mappatura delle estensioni file, rilevamento MIME e helper per il tipo di media |
    | `plugin-sdk/media-store` | Helper mirati per l’archivio media, come `saveMediaBuffer` e `saveMediaStream` |
    | `plugin-sdk/media-generation-runtime` | Helper condivisi per il failover della generazione di media, selezione dei candidati e messaggi per modelli mancanti |
    | `plugin-sdk/media-understanding` | Tipi di provider per la comprensione dei media più esportazioni di helper rivolti ai provider per immagini/audio/estrazione strutturata |
    | `plugin-sdk/text-chunking` | Helper per suddivisione/rendering di testo e markdown, conversione di tabelle markdown, rimozione di tag direttiva e utilità per testo sicuro |
    | `plugin-sdk/text-chunking` | Helper per la suddivisione del testo in uscita |
    | `plugin-sdk/speech` | Tipi di provider vocale più esportazioni di direttive, registro, validazione, builder TTS compatibile con OpenAI e helper vocali rivolti ai provider |
    | `plugin-sdk/speech-core` | Tipi condivisi di provider vocale, registro, direttive, normalizzazione ed esportazioni di helper vocali |
    | `plugin-sdk/realtime-transcription` | Tipi di provider per trascrizione in tempo reale, helper di registro e helper condiviso per sessioni WebSocket |
    | `plugin-sdk/realtime-bootstrap-context` | Helper di bootstrap del profilo in tempo reale per l’iniezione limitata del contesto `IDENTITY.md`, `USER.md` e `SOUL.md` |
    | `plugin-sdk/realtime-voice` | Tipi di provider vocale in tempo reale, helper di registro e helper condivisi per il comportamento vocale in tempo reale, incluso il tracciamento dell’attività di output |
    | `plugin-sdk/image-generation` | Tipi di provider per generazione di immagini più helper per asset immagine/URL dati e il builder di provider immagine compatibile con OpenAI |
    | `plugin-sdk/image-generation-core` | Tipi condivisi per la generazione di immagini, failover, autenticazione e helper di registro |
    | `plugin-sdk/music-generation` | Tipi di provider/richiesta/risultato per la generazione musicale |
    | `plugin-sdk/music-generation-core` | Tipi condivisi per la generazione musicale, helper di failover, ricerca provider e parsing dei riferimenti modello |
    | `plugin-sdk/video-generation` | Tipi di provider/richiesta/risultato per la generazione video |
    | `plugin-sdk/video-generation-core` | Tipi condivisi per la generazione video, helper di failover, ricerca provider e parsing dei riferimenti modello |
    | `plugin-sdk/transcripts` | Tipi condivisi di provider sorgente per transcript, helper di registro, descrittori di sessione e metadati delle enunciazioni |
    | `plugin-sdk/webhook-targets` | Registro dei target Webhook e helper di installazione delle route |
    | `plugin-sdk/webhook-path` | Alias di compatibilità deprecato; usa `plugin-sdk/webhook-ingress` |
    | `plugin-sdk/web-media` | Helper condivisi per il caricamento di media remoti/locali |
    | `plugin-sdk/zod` | Riesportazione di compatibilità deprecata; importa `zod` direttamente da `zod` |
    | `plugin-sdk/testing` | Barrel di compatibilità deprecato locale al repo per test OpenClaw legacy. I nuovi test del repo dovrebbero invece importare sottopercorsi di test locali mirati come `plugin-sdk/agent-runtime-test-contracts`, `plugin-sdk/plugin-test-runtime`, `plugin-sdk/channel-test-helpers`, `plugin-sdk/test-env` o `plugin-sdk/test-fixtures` |
    | `plugin-sdk/plugin-test-api` | Helper minimale `createTestPluginApi` locale al repo per test unitari di registrazione diretta dei Plugin senza importare bridge di helper di test del repo |
    | `plugin-sdk/agent-runtime-test-contracts` | Fixture di contratto native locali al repo per adapter agent-runtime per test di autenticazione, consegna, fallback, hook degli strumenti, overlay del prompt, schema e proiezione dei transcript |
    | `plugin-sdk/channel-test-helpers` | Helper di test orientati ai canali locali al repo per contratti generici di azioni/setup/stato, asserzioni su directory, ciclo di vita dell’avvio account, threading della configurazione di invio, mock runtime, problemi di stato, consegna in uscita e registrazione degli hook |
    | `plugin-sdk/channel-target-testing` | Suite condivisa locale al repo per casi di errore della risoluzione dei target nei test dei canali |
    | `plugin-sdk/plugin-test-contracts` | Helper di contratto locali al repo per pacchetti Plugin, registrazione, artefatti pubblici, importazione diretta, API runtime ed effetti collaterali dell’importazione |
    | `plugin-sdk/provider-test-contracts` | Helper di contratto locali al repo per runtime provider, autenticazione, discovery, onboard, catalogo, procedura guidata, capacità media, policy di replay, audio live STT in tempo reale, ricerca/recupero web e stream |
    | `plugin-sdk/provider-http-test-mocks` | Mock HTTP/autenticazione Vitest opt-in locali al repo per test di provider che esercitano `plugin-sdk/provider-http` |
    | `plugin-sdk/test-fixtures` | Fixture generiche locali al repo per acquisizione runtime CLI, contesto sandbox, writer di Skills, messaggi agente, eventi di sistema, reload dei moduli, percorso dei Plugin in bundle, testo terminale, suddivisione, token di autenticazione e casi tipizzati |
    | `plugin-sdk/test-node-mocks` | Helper mirati locali al repo per mock dei builtin Node da usare dentro factory Vitest `vi.mock("node:*")` |
  </Accordion>

  <Accordion title="Sottopercorsi memoria">
    | Sottopercorso | Esportazioni principali |
    | --- | --- |
    | `plugin-sdk/memory-core` | Superficie di helper memory-core in bundle per helper di manager/config/file/CLI |
    | `plugin-sdk/memory-core-engine-runtime` | Facciata runtime per indice/ricerca della memoria |
    | `plugin-sdk/memory-core-host-embedding-registry` | Helper leggeri per il registro dei provider di embedding della memoria |
    | `plugin-sdk/memory-core-host-engine-foundation` | Esportazioni del motore foundation host della memoria |
    | `plugin-sdk/memory-core-host-engine-embeddings` | Contratti di embedding host della memoria, accesso al registro, provider locale e helper generici batch/remoti. `registerMemoryEmbeddingProvider` su questa superficie è deprecato; usa l’API generica dei provider di embedding per nuovi provider. |
    | `plugin-sdk/memory-core-host-engine-qmd` | Esportazioni del motore QMD host della memoria |
    | `plugin-sdk/memory-core-host-engine-storage` | Esportazioni del motore di storage host della memoria |
    | `plugin-sdk/memory-core-host-multimodal` | Helper multimodali host della memoria |
    | `plugin-sdk/memory-core-host-query` | Helper di query host della memoria |
    | `plugin-sdk/memory-core-host-secret` | Helper per segreti host della memoria |
    | `plugin-sdk/memory-core-host-events` | Alias di compatibilità deprecato; usa `plugin-sdk/memory-host-events` |
    | `plugin-sdk/memory-core-host-status` | Helper di stato host della memoria |
    | `plugin-sdk/memory-core-host-runtime-cli` | Helper runtime CLI host della memoria |
    | `plugin-sdk/memory-core-host-runtime-core` | Helper runtime core host della memoria |
    | `plugin-sdk/memory-core-host-runtime-files` | Helper file/runtime host della memoria |
    | `plugin-sdk/memory-host-core` | Alias vendor-neutral per gli helper runtime core host della memoria |
    | `plugin-sdk/memory-host-events` | Alias vendor-neutral per gli helper del journal eventi host della memoria |
    | `plugin-sdk/memory-host-files` | Alias di compatibilità deprecato; usa `plugin-sdk/memory-core-host-runtime-files` |
    | `plugin-sdk/memory-host-markdown` | Helper condivisi di markdown gestito per Plugin adiacenti alla memoria |
    | `plugin-sdk/memory-host-search` | Facciata runtime Active Memory per accesso al search-manager |
    | `plugin-sdk/memory-host-status` | Alias di compatibilità deprecato; usa `plugin-sdk/memory-core-host-status` |
  </Accordion>

  <Accordion title="Sottopercorsi riservati per helper in bundle">
    I sottopercorsi SDK riservati agli helper in bundle sono superfici mirate e specifiche del proprietario per
    codice di Plugin in bundle. Sono tracciati nell’inventario SDK affinché build dei pacchetti
    e aliasing restino deterministici, ma non sono API generiche per
    creare Plugin. I nuovi contratti host riutilizzabili dovrebbero usare sottopercorsi SDK generici
    come `plugin-sdk/gateway-runtime`, `plugin-sdk/security-runtime` e
    `plugin-sdk/plugin-config-runtime`.

    | Sottopercorso | Proprietario e scopo |
    | --- | --- |
    | `plugin-sdk/codex-mcp-projection` | Helper del Plugin Codex in bundle per proiettare la configurazione server MCP dell’utente nella configurazione thread dell’app-server Codex |
    | `plugin-sdk/codex-native-task-runtime` | Helper del Plugin Codex in bundle per rispecchiare i subagenti nativi dell’app-server Codex nello stato delle attività OpenClaw |

  </Accordion>
</AccordionGroup>

## Correlati

- [Panoramica dell’SDK Plugin](/it/plugins/sdk-overview)
- [Setup dell’SDK Plugin](/it/plugins/sdk-setup)
- [Creare Plugin](/it/plugins/building-plugins)
