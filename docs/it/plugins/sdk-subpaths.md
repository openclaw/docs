---
read_when:
    - Scegliere il sottopercorso plugin-sdk corretto per un'importazione di Plugin
    - Verifica dei sottopercorsi dei Plugin integrati e delle superfici helper
summary: 'Catalogo dei sottopercorsi dell''SDK Plugin: quali import risiedono dove, raggruppati per area'
title: Sottopercorsi dell'SDK Plugin
x-i18n:
    generated_at: "2026-07-01T13:06:17Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 589b5581626e50ddb5056ff2aaa60a0af48b92e09c0ca5aa22e2dbf2aed736db
    source_path: plugins/sdk-subpaths.md
    workflow: 16
---

L'SDK dei Plugin è esposto come un insieme di sottopercorsi pubblici ristretti sotto
`openclaw/plugin-sdk/`. Questa pagina cataloga i sottopercorsi di uso comune raggruppati per
scopo. L'inventario generato degli entrypoint del compilatore si trova in
`scripts/lib/plugin-sdk-entrypoints.json`; gli export del pacchetto sono il sottoinsieme pubblico
dopo aver sottratto i sottopercorsi di test/interni locali al repository elencati in
`scripts/lib/plugin-sdk-private-local-only-subpaths.json`. I maintainer possono verificare
il conteggio degli export pubblici con `pnpm plugin-sdk:surface` e i sottopercorsi helper
riservati attivi con `pnpm plugins:boundary-report:summary`; gli export helper riservati
non utilizzati fanno fallire il report CI invece di restare nell'SDK pubblico come
debito di compatibilità dormiente.

Per la guida alla creazione di Plugin, consulta [Panoramica dell'SDK dei Plugin](/it/plugins/sdk-overview).

## Ingresso Plugin

| Sottopercorso                  | Export principali                                                                                                                                                      |
| ------------------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `plugin-sdk/plugin-entry`      | `definePluginEntry`                                                                                                                                                    |
| `plugin-sdk/core`              | `defineChannelPluginEntry`, `createChatChannelPlugin`, `createChannelPluginBase`, `defineSetupPluginEntry`, `buildChannelConfigSchema`, `buildJsonChannelConfigSchema` |
| `plugin-sdk/config-schema`     | `OpenClawSchema`                                                                                                                                                       |
| `plugin-sdk/provider-entry`    | `defineSingleProviderPluginEntry`                                                                                                                                      |
| `plugin-sdk/migration`         | Helper per elementi del provider di migrazione come `createMigrationItem`, costanti di motivo, marcatori di stato degli elementi, helper di redazione e `summarizeMigrationItems` |
| `plugin-sdk/migration-runtime` | Helper di migrazione runtime come `copyMigrationFileItem`, `withCachedMigrationConfigRuntime` e `writeMigrationReport`                                                |
| `plugin-sdk/health`            | Registrazione, rilevamento, riparazione, selezione, gravità e tipi di finding per i controlli di integrità di Doctor per i consumer di integrità in bundle              |

### Helper deprecati di compatibilità e test

I sottopercorsi deprecati restano esportati per i Plugin più vecchi, ma il nuovo codice dovrebbe usare
i sottopercorsi SDK mirati qui sotto. L'elenco mantenuto è
`scripts/lib/plugin-sdk-deprecated-public-subpaths.json`; la CI rifiuta gli import
di produzione in bundle da esso. Barrel ampi come `compat`, `config-types`,
`infra-runtime`, `text-runtime` e `zod` sono solo per compatibilità. Importa `zod`
direttamente da `zod`.

I sottopercorsi degli helper di test di OpenClaw basati su Vitest sono solo locali al repository e non sono
più export del pacchetto: `agent-runtime-test-contracts`,
`channel-contract-testing`, `channel-target-testing`, `channel-test-helpers`,
`plugin-test-api`, `plugin-test-contracts`, `plugin-test-runtime`,
`provider-http-test-mocks`, `provider-test-contracts`, `test-env`,
`test-fixtures`, `test-node-mocks` e `testing`.

### Sottopercorsi helper riservati dei Plugin in bundle

Questi sottopercorsi sono superfici di compatibilità possedute dal Plugin per il rispettivo
Plugin in bundle proprietario, non API SDK generali: `plugin-sdk/codex-mcp-projection` e
`plugin-sdk/codex-native-task-runtime`. Gli import tra estensioni di proprietari diversi sono bloccati
dalle garanzie del contratto del pacchetto.

<AccordionGroup>
  <Accordion title="Sottopercorsi dei canali">
    | Sottopercorso | Esportazioni principali |
    | --- | --- |
    | `plugin-sdk/channel-core` | `defineChannelPluginEntry`, `defineSetupPluginEntry`, `createChatChannelPlugin`, `createChannelPluginBase` |
    | `plugin-sdk/config-schema` | Esportazione dello schema Zod radice di `openclaw.json` (`OpenClawSchema`) |
    | `plugin-sdk/json-schema-runtime` | Helper di convalida JSON Schema con cache per schemi di proprietà del plugin |
    | `plugin-sdk/channel-setup` | `createOptionalChannelSetupSurface`, `createOptionalChannelSetupAdapter`, `createOptionalChannelSetupWizard`, più `DEFAULT_ACCOUNT_ID`, `createTopLevelChannelDmPolicy`, `setSetupChannelEnabled`, `splitSetupEntries` |
    | `plugin-sdk/setup` | Helper condivisi per la procedura guidata di configurazione, traduttore di configurazione, prompt allowlist, builder dello stato di configurazione |
    | `plugin-sdk/setup-runtime` | `createSetupTranslator`, `createPatchedAccountSetupAdapter`, `createEnvPatchedAccountSetupAdapter`, `createSetupInputPresenceValidator`, `noteChannelLookupFailure`, `noteChannelLookupSummary`, `promptResolvedAllowFrom`, `splitSetupEntries`, `createAllowlistSetupWizardProxy`, `createDelegatedSetupWizardProxy` |
    | `plugin-sdk/setup-adapter-runtime` | Alias di compatibilità deprecato; usa `plugin-sdk/setup-runtime` |
    | `plugin-sdk/setup-tools` | `formatCliCommand`, `detectBinary`, `extractArchive`, `resolveBrewExecutable`, `formatDocsLink`, `CONFIG_DIR` |
    | `plugin-sdk/account-core` | Helper per configurazione multi-account/gate delle azioni, helper di fallback dell'account predefinito |
    | `plugin-sdk/account-id` | `DEFAULT_ACCOUNT_ID`, helper di normalizzazione dell'ID account |
    | `plugin-sdk/account-resolution` | Helper di ricerca account + fallback predefinito |
    | `plugin-sdk/account-helpers` | Helper mirati per elenco account/azioni account |
    | `plugin-sdk/access-groups` | Helper per parsing dell'allowlist dei gruppi di accesso e diagnostica redatta dei gruppi |
    | `plugin-sdk/channel-pairing` | `createChannelPairingController` |
    | `plugin-sdk/channel-reply-pipeline` | Facciata di compatibilità deprecata. Usa `plugin-sdk/channel-outbound`. |
    | `plugin-sdk/channel-config-helpers` | `createHybridChannelConfigAdapter`, `resolveChannelDmAccess`, `resolveChannelDmAllowFrom`, `resolveChannelDmPolicy`, `normalizeChannelDmPolicy`, `normalizeLegacyDmAliases` |
    | `plugin-sdk/channel-config-schema` | Primitive condivise dello schema di configurazione del canale, più builder Zod e JSON/TypeBox diretti |
    | `plugin-sdk/bundled-channel-config-schema` | Schemi di configurazione dei canali OpenClaw in bundle solo per plugin in bundle mantenuti |
    | `plugin-sdk/chat-channel-ids` | `BUNDLED_CHAT_CHANNEL_IDS`, `BUNDLED_CHAT_CHANNEL_ENVELOPE_PREFIXES`, `ChatChannelId`. ID canonici dei canali chat in bundle/ufficiali più etichette/alias del formatter per plugin che devono riconoscere testo con prefisso envelope senza hardcodare una propria tabella. |
    | `plugin-sdk/channel-config-schema-legacy` | Alias di compatibilità deprecato per schemi di configurazione dei canali in bundle |
    | `plugin-sdk/telegram-command-config` | Helper di normalizzazione/convalida dei comandi personalizzati Telegram con fallback del contratto in bundle |
    | `plugin-sdk/command-gating` | Helper mirati per gate di autorizzazione dei comandi |
    | `plugin-sdk/channel-policy` | `resolveChannelGroupRequireMention` |
    | `plugin-sdk/channel-ingress` | Facciata deprecata di compatibilità di basso livello per l'ingresso dei canali. I nuovi percorsi di ricezione dovrebbero usare `plugin-sdk/channel-ingress-runtime`. |
    | `plugin-sdk/channel-ingress-runtime` | Resolver runtime sperimentale di alto livello per l'ingresso dei canali e builder dei fatti di routing per percorsi di ricezione dei canali migrati. Preferiscilo all'assemblaggio di allowlist effettive, allowlist dei comandi e proiezioni legacy in ogni plugin. Vedi [API di ingresso dei canali](/it/plugins/sdk-channel-ingress). |
    | `plugin-sdk/channel-lifecycle` | Facciata di compatibilità deprecata. Usa `plugin-sdk/channel-outbound`. |
    | `plugin-sdk/channel-outbound` | Contratti del ciclo di vita dei messaggi più opzioni della pipeline di risposta, ricevute, anteprima live/streaming, helper del ciclo di vita, identità in uscita, pianificazione dei payload, invii durevoli e helper del contesto di invio messaggi. Vedi [API in uscita dei canali](/it/plugins/sdk-channel-outbound). |
    | `plugin-sdk/channel-message` | Alias di compatibilità deprecato per `plugin-sdk/channel-outbound` più facciate legacy di dispatch delle risposte. |
    | `plugin-sdk/channel-message-runtime` | Alias di compatibilità deprecato per `plugin-sdk/channel-outbound` più facciate legacy di dispatch delle risposte. |
    | `plugin-sdk/inbound-envelope` | Helper condivisi per route in ingresso + builder envelope |
    | `plugin-sdk/inbound-reply-dispatch` | Facciata di compatibilità deprecata. Usa `plugin-sdk/channel-inbound` per runner in ingresso e predicati di dispatch, e `plugin-sdk/channel-outbound` per helper di consegna dei messaggi. |
    | `plugin-sdk/messaging-targets` | Alias deprecato per il parsing dei target; usa `plugin-sdk/channel-targets` |
    | `plugin-sdk/outbound-media` | Helper condivisi per caricamento dei media in uscita e stato dei media ospitati |
    | `plugin-sdk/outbound-send-deps` | Facciata di compatibilità deprecata. Usa `plugin-sdk/channel-outbound`. |
    | `plugin-sdk/outbound-runtime` | Facciata di compatibilità deprecata. Usa `plugin-sdk/channel-outbound`. |
    | `plugin-sdk/poll-runtime` | Helper mirati per la normalizzazione dei poll |
    | `plugin-sdk/thread-bindings-runtime` | Helper per ciclo di vita dei binding dei thread e adapter |
    | `plugin-sdk/agent-media-payload` | Builder legacy dei payload multimediali dell'agente |
    | `plugin-sdk/conversation-runtime` | Helper per conversazione/binding dei thread, pairing e binding configurati |
    | `plugin-sdk/runtime-config-snapshot` | Helper per snapshot della configurazione runtime |
    | `plugin-sdk/runtime-group-policy` | Helper per risoluzione delle policy di gruppo runtime |
    | `plugin-sdk/channel-status` | Helper condivisi per snapshot/riepilogo dello stato dei canali |
    | `plugin-sdk/channel-config-primitives` | Primitive mirate dello schema di configurazione dei canali |
    | `plugin-sdk/channel-config-writes` | Helper di autorizzazione per scrittura della configurazione dei canali |
    | `plugin-sdk/channel-plugin-common` | Esportazioni condivise del prelude dei plugin di canale |
    | `plugin-sdk/allowlist-config-edit` | Helper per modifica/lettura della configurazione allowlist |
    | `plugin-sdk/group-access` | Helper condivisi per decisioni di accesso ai gruppi |
    | `plugin-sdk/direct-dm`, `plugin-sdk/direct-dm-access` | Facciate di compatibilità deprecate. Usa `plugin-sdk/channel-inbound`. |
    | `plugin-sdk/direct-dm-guard-policy` | Helper mirati per la policy di guardia direct-DM pre-crypto |
    | `plugin-sdk/discord` | Facciata di compatibilità Discord deprecata per `@openclaw/discord@2026.3.13` pubblicato e compatibilità tracciata del proprietario; i nuovi plugin dovrebbero usare sottopercorsi generici dell'SDK dei canali |
    | `plugin-sdk/telegram-account` | Facciata di compatibilità deprecata per la risoluzione degli account Telegram per compatibilità tracciata del proprietario; i nuovi plugin dovrebbero usare helper runtime iniettati o sottopercorsi generici dell'SDK dei canali |
    | `plugin-sdk/zalouser` | Facciata di compatibilità deprecata Zalo Personal per pacchetti Lark/Zalo pubblicati che importano ancora l'autorizzazione dei comandi del mittente; i nuovi plugin dovrebbero usare `plugin-sdk/command-auth` |
    | `plugin-sdk/interactive-runtime` | Presentazione semantica dei messaggi, consegna e helper legacy per risposte interattive. Vedi [Presentazione dei messaggi](/it/plugins/message-presentation) |
    | `plugin-sdk/channel-inbound` | Helper condivisi in ingresso per classificazione degli eventi, costruzione del contesto, formattazione, radici, debounce, corrispondenza delle menzioni, policy delle menzioni e logging in ingresso |
    | `plugin-sdk/channel-inbound-debounce` | Helper mirati per debounce in ingresso |
    | `plugin-sdk/channel-mention-gating` | Helper mirati per policy delle menzioni, marcatore delle menzioni e testo delle menzioni senza la superficie più ampia del runtime in ingresso |
    | `plugin-sdk/channel-envelope`, `plugin-sdk/channel-inbound-roots`, `plugin-sdk/channel-location`, `plugin-sdk/channel-logging` | Facciate di compatibilità deprecate. Usa `plugin-sdk/channel-inbound` o `plugin-sdk/channel-outbound`. |
    | `plugin-sdk/channel-pairing-paths` | Facciata di compatibilità deprecata. Usa `plugin-sdk/channel-pairing`. |
    | `plugin-sdk/channel-reply-options-runtime` | Facciata di compatibilità deprecata. Usa `plugin-sdk/channel-outbound`. |
    | `plugin-sdk/channel-streaming` | Facciata di compatibilità deprecata. Usa `plugin-sdk/channel-outbound`. |
    | `plugin-sdk/channel-send-result` | Tipi dei risultati di risposta |
    | `plugin-sdk/channel-actions` | Helper per azioni sui messaggi dei canali, più helper deprecati dello schema nativo mantenuti per compatibilità dei plugin |
    | `plugin-sdk/channel-route` | Helper condivisi per normalizzazione delle route, risoluzione dei target guidata da parser, stringificazione degli ID thread, chiavi di route deduplicate/compatte, tipi di target parsati e confronto route/target |
    | `plugin-sdk/channel-targets` | Helper per parsing dei target; i chiamanti che confrontano route dovrebbero usare `plugin-sdk/channel-route` |
    | `plugin-sdk/channel-contract` | Tipi di contratto dei canali |
    | `plugin-sdk/channel-feedback` | Collegamento di feedback/reazioni |
    | `plugin-sdk/channel-secret-runtime` | Helper mirati per il contratto dei segreti, come `collectSimpleChannelFieldAssignments`, `getChannelSurface`, `pushAssignment` e tipi di target dei segreti |
  </Accordion>

Le famiglie deprecate di helper per i canali restano disponibili solo per la
compatibilità dei plugin pubblicati. Il piano di rimozione è: mantenerle per
tutta la finestra di migrazione dei plugin esterni, mantenere i plugin del repo/in
bundle su `channel-inbound` e `channel-outbound`, quindi rimuovere i sottopercorsi
di compatibilità nella prossima pulizia major dell'SDK. Questo si applica alle
vecchie famiglie di messaggi/runtime dei canali, streaming dei canali, accesso
direct-DM, frammenti di helper in ingresso, opzioni di risposta e pairing-path.

  <Accordion title="Sottopercorsi dei provider">
    | Sottopercorso | Esportazioni principali |
    | --- | --- |
    | `plugin-sdk/provider-entry` | `defineSingleProviderPluginEntry` |
    | `plugin-sdk/lmstudio` | Facciata del provider LM Studio supportata per configurazione, scoperta del catalogo e preparazione dei modelli a runtime |
    | `plugin-sdk/lmstudio-runtime` | Facciata runtime LM Studio supportata per impostazioni predefinite del server locale, scoperta dei modelli, intestazioni delle richieste e helper per i modelli caricati |
    | `plugin-sdk/provider-setup` | Helper curati per la configurazione di provider locali/self-hosted |
    | `plugin-sdk/self-hosted-provider-setup` | Helper mirati per la configurazione di provider self-hosted compatibili con OpenAI |
    | `plugin-sdk/cli-backend` | Impostazioni predefinite del backend CLI + costanti del watchdog |
    | `plugin-sdk/provider-auth-runtime` | Helper runtime per la risoluzione delle chiavi API per i Plugin provider |
    | `plugin-sdk/provider-oauth-runtime` | Tipi generici di callback OAuth per provider, rendering della pagina di callback, helper PKCE/stato, parsing dell'input di autorizzazione, helper per la scadenza dei token e helper di interruzione |
    | `plugin-sdk/provider-auth-api-key` | Helper per onboarding/scrittura del profilo tramite chiave API, come `upsertApiKeyProfile` |
    | `plugin-sdk/provider-auth-result` | Builder standard del risultato di autenticazione OAuth |
    | `plugin-sdk/provider-env-vars` | Helper di ricerca delle variabili d'ambiente per l'autenticazione del provider |
    | `plugin-sdk/provider-auth` | `createProviderApiKeyAuthMethod`, `ensureApiKeyFromOptionEnvOrPrompt`, `upsertAuthProfile`, `upsertApiKeyProfile`, `writeOAuthCredentials`, helper di importazione autenticazione OpenAI Codex, esportazione di compatibilità deprecata `resolveOpenClawAgentDir` |
    | `plugin-sdk/provider-model-shared` | `ProviderReplayFamily`, `buildProviderReplayFamilyHooks`, `normalizeModelCompat`, builder condivisi di policy di replay, helper per endpoint provider e helper condivisi per la normalizzazione degli ID modello |
    | `plugin-sdk/provider-catalog-live-runtime` | Helper del catalogo modelli provider live per la scoperta protetta in stile `/models`: `buildLiveModelProviderConfig`, `fetchLiveProviderModelRows`, `getCachedLiveProviderModelRows`, `fetchLiveProviderModelIds`, `LiveModelCatalogHttpError`, `clearLiveCatalogCacheForTests`, filtro degli ID modello, cache TTL e fallback statico |
    | `plugin-sdk/provider-catalog-runtime` | Hook runtime di augmentazione del catalogo provider e giunzioni del registro plugin-provider per test di contratto |
    | `plugin-sdk/provider-catalog-shared` | `findCatalogTemplate`, `buildSingleProviderApiKeyCatalog`, `buildManifestModelProviderConfig`, `supportsNativeStreamingUsageCompat`, `applyProviderNativeStreamingUsageCompat` |
    | `plugin-sdk/provider-http` | Helper generici per funzionalità HTTP/endpoint dei provider, errori HTTP dei provider e helper per moduli multipart di trascrizione audio |
    | `plugin-sdk/provider-web-fetch-contract` | Helper di contratto mirati per configurazione/selezione web-fetch, come `enablePluginInConfig` e `WebFetchProviderPlugin` |
    | `plugin-sdk/provider-web-fetch` | Helper di registrazione/cache dei provider web-fetch |
    | `plugin-sdk/provider-web-search-config-contract` | Helper mirati per configurazione/credenziali web-search per provider che non richiedono il cablaggio dell'abilitazione del Plugin |
    | `plugin-sdk/provider-web-search-contract` | Helper mirati di contratto per configurazione/credenziali web-search, come `createWebSearchProviderContractFields`, `enablePluginInConfig`, `resolveProviderWebSearchPluginConfig` e setter/getter di credenziali con ambito |
    | `plugin-sdk/provider-web-search` | Helper di registrazione/cache/runtime dei provider web-search |
    | `plugin-sdk/embedding-providers` | Tipi generali di provider di embedding e helper di lettura, inclusi `EmbeddingProviderAdapter`, `getEmbeddingProvider(...)` e `listEmbeddingProviders(...)`; i plugin registrano i provider tramite `api.registerEmbeddingProvider(...)` così viene applicata la proprietà del manifest |
    | `plugin-sdk/provider-tools` | `ProviderToolCompatFamily`, `buildProviderToolCompatFamilyHooks` e pulizia schema + diagnostica DeepSeek/Gemini/OpenAI |
    | `plugin-sdk/provider-usage` | Tipi di snapshot di utilizzo del provider, helper condivisi per il recupero dell'utilizzo e fetcher di provider come `fetchClaudeUsage` |
    | `plugin-sdk/provider-stream` | `ProviderStreamFamily`, `buildProviderStreamFamilyHooks`, `composeProviderStreamWrappers`, tipi wrapper di stream, compatibilità per chiamate tool in testo semplice e helper wrapper condivisi Anthropic/Bedrock/DeepSeek V4/Google/Kilocode/Moonshot/OpenAI/OpenRouter/Z.A.I/MiniMax/Copilot |
    | `plugin-sdk/provider-stream-shared` | Helper wrapper pubblici condivisi per stream provider, inclusi `composeProviderStreamWrappers`, `createOpenAICompatibleCompletionsThinkingOffWrapper`, `createPlainTextToolCallCompatWrapper`, `createPayloadPatchStreamWrapper`, `createToolStreamWrapper`, `normalizeOpenAICompatibleReasoningPayload`, `setQwenChatTemplateThinking` e utilità di stream compatibili con Anthropic/DeepSeek/OpenAI |
    | `plugin-sdk/provider-transport-runtime` | Helper di trasporto provider nativo, come fetch protetto, estrazione del testo dai risultati tool, trasformazioni dei messaggi di trasporto e stream di eventi di trasporto scrivibili |
    | `plugin-sdk/provider-onboard` | Helper per patch della configurazione di onboarding |
    | `plugin-sdk/global-singleton` | Helper singleton/map/cache locali al processo |
    | `plugin-sdk/group-activation` | Helper mirati per modalità di attivazione di gruppo e parsing dei comandi |
  </Accordion>

Gli snapshot di utilizzo dei provider di norma riportano una o più `windows` di quota, ciascuna con
un'etichetta, la percentuale usata e un orario di reset opzionale. I provider che espongono testo di saldo o
stato account invece di finestre di quota resettabili devono restituire
`summary` con un array `windows` vuoto invece di inventare percentuali.
OpenClaw mostra quel testo di riepilogo nell'output di stato; usa `error` solo quando
l'endpoint di utilizzo non è riuscito o non ha restituito dati di utilizzo utilizzabili.

  <Accordion title="Sottopercorsi di autenticazione e sicurezza">
    | Sottopercorso | Esportazioni principali |
    | --- | --- |
    | `plugin-sdk/command-auth` | `resolveControlCommandGate`, helper del registro comandi inclusa la formattazione dinamica del menu degli argomenti, helper di autorizzazione del mittente |
    | `plugin-sdk/command-status` | Builder di messaggi comandi/aiuto come `buildCommandsMessagePaginated` e `buildHelpMessage` |
    | `plugin-sdk/approval-auth-runtime` | Helper per la risoluzione degli approvatori e per l'autenticazione delle azioni nella stessa chat |
    | `plugin-sdk/approval-client-runtime` | Helper di profilo/filtro per approvazione exec nativa |
    | `plugin-sdk/approval-delivery-runtime` | Adattatori nativi di funzionalità/consegna per approvazioni |
    | `plugin-sdk/approval-gateway-runtime` | Helper condiviso di risoluzione del Gateway di approvazione |
    | `plugin-sdk/approval-handler-adapter-runtime` | Helper leggeri per il caricamento degli adattatori di approvazione nativi per entrypoint di canale hot |
    | `plugin-sdk/approval-handler-runtime` | Helper runtime più ampi per gestori di approvazione; preferisci le giunzioni adapter/gateway più mirate quando sono sufficienti |
    | `plugin-sdk/approval-native-runtime` | Helper per target di approvazione nativo, binding account, gate di routing, fallback di inoltro e soppressione del prompt exec nativo locale |
    | `plugin-sdk/approval-reaction-runtime` | Binding hardcoded delle reazioni di approvazione, payload dei prompt di reazione, store dei target di reazione ed esportazione di compatibilità per la soppressione del prompt exec nativo locale |
    | `plugin-sdk/approval-reply-runtime` | Helper per payload di risposta di approvazione exec/plugin |
    | `plugin-sdk/approval-runtime` | Helper per payload di approvazione exec/plugin, helper di routing/runtime per approvazione nativa e helper di visualizzazione strutturata dell'approvazione come `formatApprovalDisplayPath` |
    | `plugin-sdk/reply-dedupe` | Helper mirati per reset della deduplicazione delle risposte in ingresso |
    | `plugin-sdk/channel-contract-testing` | Helper mirati per test di contratto dei canali senza l'ampio barrel di testing |
    | `plugin-sdk/command-auth-native` | Autenticazione nativa dei comandi, formattazione dinamica del menu degli argomenti e helper nativi per target di sessione |
    | `plugin-sdk/command-detection` | Helper condivisi per il rilevamento dei comandi |
    | `plugin-sdk/command-primitives-runtime` | Predicati leggeri sul testo dei comandi per percorsi di canale hot |
    | `plugin-sdk/command-surface` | Normalizzazione del corpo dei comandi e helper della superficie dei comandi |
    | `plugin-sdk/allow-from` | `formatAllowFromLowercase` |
    | `plugin-sdk/channel-secret-runtime` | Helper mirati per la raccolta di contratti dei secret per superfici secret di canali/plugin |
    | `plugin-sdk/secret-ref-runtime` | Helper mirati per `coerceSecretRef` e tipizzazione SecretRef per parsing di contratti/configurazione dei secret |
    | `plugin-sdk/secret-provider-integration` | Contratti type-only di manifest e preset per integrazione provider SecretRef per plugin che pubblicano preset esterni di provider di secret |
    | `plugin-sdk/security-runtime` | Helper condivisi per attendibilità, gate dei DM, file/percorsi limitati alla root, incluse scritture solo in creazione, sostituzione atomica sync/async dei file, scritture temporanee sibling, fallback di spostamento cross-device, helper di file-store privato, guardie sui parent symlink, contenuto esterno, redazione di testo sensibile, confronto di secret a tempo costante e helper di raccolta dei secret |
    | `plugin-sdk/ssrf-policy` | Helper per allowlist degli host e policy SSRF per reti private |
    | `plugin-sdk/ssrf-dispatcher` | Helper mirati per dispatcher pinnato senza l'ampia superficie runtime infra |
    | `plugin-sdk/ssrf-runtime` | Dispatcher pinnato, fetch protetto da SSRF, errore SSRF e helper di policy SSRF |
    | `plugin-sdk/secret-input` | Helper per il parsing dell'input di secret |
    | `plugin-sdk/webhook-ingress` | Helper per richiesta/target Webhook e coercizione raw websocket/body |
    | `plugin-sdk/webhook-request-guards` | Helper per dimensione/timeout del corpo della richiesta |
  </Accordion>

  <Accordion title="Sottopercorsi runtime e archiviazione">
    | Sottopercorso | Esportazioni chiave |
    | --- | --- |
    | `plugin-sdk/runtime` | Helper ampi per runtime/logging/backup/installazione Plugin |
    | `plugin-sdk/runtime-env` | Helper mirati per env runtime, logger, timeout, retry e backoff |
    | `plugin-sdk/browser-config` | Facade di configurazione browser supportata per profilo/default normalizzati, parsing degli URL CDP e helper di autenticazione per il controllo del browser |
    | `plugin-sdk/agent-harness-task-runtime` | Helper generici per ciclo di vita del task e consegna del completamento per agenti basati su harness che usano un ambito task emesso dall'host |
    | `plugin-sdk/codex-mcp-projection` | Helper Codex bundled riservato per proiettare la configurazione server MCP dell'utente nella configurazione thread di Codex; non per Plugin di terze parti |
    | `plugin-sdk/codex-native-task-runtime` | Helper Codex bundled privato per cablaggio runtime/mirror di task nativi; non per Plugin di terze parti |
    | `plugin-sdk/channel-runtime-context` | Helper generici per registrazione e lookup del contesto runtime del canale |
    | `plugin-sdk/matrix` | Facade di compatibilità Matrix deprecata per pacchetti canale di terze parti meno recenti; i nuovi Plugin dovrebbero importare direttamente `plugin-sdk/run-command` |
    | `plugin-sdk/mattermost` | Facade di compatibilità Mattermost deprecata per pacchetti canale di terze parti meno recenti; i nuovi Plugin dovrebbero importare direttamente i sottopercorsi SDK generici |
    | `plugin-sdk/runtime-store` | `createPluginRuntimeStore` |
    | `plugin-sdk/plugin-runtime` | Helper condivisi per comandi/hook/http/interattivi dei Plugin |
    | `plugin-sdk/hook-runtime` | Helper condivisi per pipeline di hook webhook/interni |
    | `plugin-sdk/lazy-runtime` | Helper di import/binding lazy del runtime come `createLazyRuntimeModule`, `createLazyRuntimeMethod` e `createLazyRuntimeSurface` |
    | `plugin-sdk/process-runtime` | Helper per exec di processo |
    | `plugin-sdk/cli-runtime` | Helper CLI per formattazione, attesa, versione, invocazione argomenti e gruppi di comandi lazy |
    | `plugin-sdk/qa-live-transport-scenarios` | ID condivisi degli scenari QA di trasporto live, helper di copertura baseline e helper di selezione scenario |
    | `plugin-sdk/gateway-method-runtime` | Helper riservato di dispatch dei metodi Gateway per route HTTP dei Plugin che dichiarano `contracts.gatewayMethodDispatch: ["authenticated-request"]` |
    | `plugin-sdk/gateway-runtime` | Client Gateway, helper di avvio client pronto per event loop, RPC CLI del gateway, errori del protocollo gateway, risoluzione host LAN pubblicizzato e helper patch per stato canale |
    | `plugin-sdk/config-contracts` | Superficie config focalizzata solo sui tipi per shape di configurazione dei Plugin come `OpenClawConfig` e tipi config di canale/provider |
    | `plugin-sdk/plugin-config-runtime` | Helper di lookup runtime della configurazione Plugin come `requireRuntimeConfig`, `resolvePluginConfigObject` e `resolveLivePluginConfigObject` |
    | `plugin-sdk/config-mutation` | Helper di mutazione transazionale della config come `mutateConfigFile`, `replaceConfigFile` e `logConfigUpdated` |
    | `plugin-sdk/message-tool-delivery-hints` | Stringhe condivise di hint per metadati di consegna message-tool |
    | `plugin-sdk/runtime-config-snapshot` | Helper snapshot della config del processo corrente come `getRuntimeConfig`, `getRuntimeConfigSnapshot` e setter di snapshot per test |
    | `plugin-sdk/telegram-command-config` | Normalizzazione nome/descrizione dei comandi Telegram e controlli di duplicati/conflitti, anche quando la superficie contrattuale bundled di Telegram non è disponibile |
    | `plugin-sdk/text-autolink-runtime` | Rilevamento autolink dei riferimenti file senza l'ampio barrel testuale |
    | `plugin-sdk/approval-reaction-runtime` | Binding hardcoded delle reaction di approvazione, payload prompt di reaction, store target reaction ed esportazione di compatibilità per la soppressione del prompt exec nativo locale |
    | `plugin-sdk/approval-runtime` | Helper di approvazione exec/Plugin, builder di capability di approvazione, helper auth/profilo, helper runtime/routing nativi e formattazione strutturata del percorso di visualizzazione approvazione |
    | `plugin-sdk/reply-runtime` | Helper runtime condivisi per inbound/reply, chunking, dispatch, Heartbeat, planner di risposta |
    | `plugin-sdk/reply-dispatch-runtime` | Helper mirati per dispatch/finalizzazione delle risposte e label di conversazione |
    | `plugin-sdk/reply-history` | Helper condivisi per cronologia risposte a finestra breve. Il nuovo codice message-turn dovrebbe usare `createChannelHistoryWindow`; gli helper map di livello inferiore restano solo esportazioni di compatibilità deprecate |
    | `plugin-sdk/reply-reference` | `createReplyReferencePlanner` |
    | `plugin-sdk/reply-chunking` | Helper mirati per chunking testo/markdown |
    | `plugin-sdk/session-store-runtime` | Helper del flusso di lavoro sessione (`getSessionEntry`, `listSessionEntries`, `patchSessionEntry`, `upsertSessionEntry`), letture limitate di testo transcript recente utente/assistente per identità sessione, helper legacy per percorso store sessione/chiave sessione, letture updated-at e helper di compatibilità solo di transizione per intero store/percorso file |
    | `plugin-sdk/session-transcript-runtime` | Identità transcript, helper target/read/write con scope, pubblicazione aggiornamenti, lock di scrittura e chiavi hit della memoria transcript |
    | `plugin-sdk/sqlite-runtime` | Helper focalizzati SQLite per schema agente, percorso e transazioni per runtime first-party |
    | `plugin-sdk/cron-store-runtime` | Helper percorso/caricamento/salvataggio dello store Cron |
    | `plugin-sdk/state-paths` | Helper per percorsi dir State/OAuth |
    | `plugin-sdk/plugin-state-runtime` | Tipi di stato keyed SQLite sidecar dei Plugin più configurazione centralizzata del pragma di connessione e manutenzione WAL per database di proprietà del Plugin |
    | `plugin-sdk/routing` | Helper di binding route/chiave sessione/account come `resolveAgentRoute`, `buildAgentSessionKey` e `resolveDefaultAgentBoundAccountId` |
    | `plugin-sdk/status-helpers` | Helper condivisi di riepilogo stato canale/account, default dello stato runtime e helper metadati issue |
    | `plugin-sdk/target-resolver-runtime` | Helper condivisi per resolver target |
    | `plugin-sdk/string-normalization-runtime` | Helper di normalizzazione slug/stringa |
    | `plugin-sdk/request-url` | Estrai URL stringa da input fetch/simili a request |
    | `plugin-sdk/run-command` | Runner di comandi temporizzato con risultati stdout/stderr normalizzati |
    | `plugin-sdk/param-readers` | Lettori comuni di parametri tool/CLI |
    | `plugin-sdk/tool-plugin` | Definisci un semplice Plugin agent-tool tipizzato ed esponi metadati statici per generazione manifest |
    | `plugin-sdk/tool-payload` | Estrai payload normalizzati da oggetti risultato tool |
    | `plugin-sdk/tool-send` | Estrai campi target di invio canonici dagli argomenti tool |
    | `plugin-sdk/sandbox` | Tipi backend sandbox e helper per comandi SSH/OpenShell, inclusa preflight fail-fast del comando exec |
    | `plugin-sdk/temp-path` | Helper condivisi per percorsi temp-download e workspace temporanei sicuri privati |
    | `plugin-sdk/logging-core` | Logger di sottosistema e helper di redazione |
    | `plugin-sdk/markdown-table-runtime` | Modalità tabella Markdown e helper di conversione |
    | `plugin-sdk/model-session-runtime` | Helper di override modello/sessione come `applyModelOverrideToSessionEntry` e `resolveAgentMaxConcurrent` |
    | `plugin-sdk/talk-config-runtime` | Helper di risoluzione config provider Talk |
    | `plugin-sdk/json-store` | Piccoli helper di lettura/scrittura stato JSON |
    | `plugin-sdk/json-unsafe-integers` | Helper di parsing JSON che preservano i letterali interi non sicuri come stringhe |
    | `plugin-sdk/file-lock` | Helper di file-lock rientranti |
    | `plugin-sdk/persistent-dedupe` | Helper cache dedupe persistita su disco |
    | `plugin-sdk/acp-runtime` | Helper runtime/sessione ACP e reply-dispatch |
    | `plugin-sdk/acp-runtime-backend` | Helper leggeri per registrazione backend ACP e reply-dispatch per Plugin caricati all'avvio |
    | `plugin-sdk/acp-binding-resolve-runtime` | Risoluzione binding ACP in sola lettura senza import di startup del ciclo di vita |
    | `plugin-sdk/agent-config-primitives` | Primitive mirate dello schema di configurazione runtime agente |
    | `plugin-sdk/boolean-param` | Lettore permissivo di parametro booleano |
    | `plugin-sdk/dangerous-name-runtime` | Helper di risoluzione matching dangerous-name |
    | `plugin-sdk/device-bootstrap` | Helper per bootstrap dispositivo e token di pairing |
    | `plugin-sdk/extension-shared` | Primitive condivise per canali passivi, stato e helper proxy ambient |
    | `plugin-sdk/models-provider-runtime` | Helper di risposta per comando/provider `/models` |
    | `plugin-sdk/skill-commands-runtime` | Helper di elenco comandi Skill |
    | `plugin-sdk/native-command-registry` | Helper di registro/build/serializzazione comandi nativi |
    | `plugin-sdk/agent-harness` | Superficie sperimentale per Plugin fidati per harness agente di basso livello: tipi harness, helper steer/abort per esecuzione attiva, helper bridge tool OpenClaw, helper di policy tool runtime-plan, classificazione esito terminale, helper di formattazione/dettaglio progresso tool e utility risultato tentativo |
    | `plugin-sdk/provider-zai-endpoint` | Facade deprecata di rilevamento endpoint di proprietà del provider Z.AI; usa l'API pubblica del Plugin Z.AI |
    | `plugin-sdk/async-lock-runtime` | Helper lock async locale al processo per piccoli file di stato runtime |
    | `plugin-sdk/channel-activity-runtime` | Helper di telemetria attività canale |
    | `plugin-sdk/concurrency-runtime` | Helper di concorrenza task async limitata |
    | `plugin-sdk/dedupe-runtime` | Helper cache dedupe in memoria |
    | `plugin-sdk/delivery-queue-runtime` | Helper di drain della consegna pendente in uscita |
    | `plugin-sdk/file-access-runtime` | Helper sicuri per percorsi file locali e sorgenti media |
    | `plugin-sdk/heartbeat-runtime` | Helper di wake, evento e visibilità Heartbeat |
    | `plugin-sdk/number-runtime` | Helper di coercizione numerica |
    | `plugin-sdk/secure-random-runtime` | Helper token/UUID sicuri |
    | `plugin-sdk/system-event-runtime` | Helper coda eventi di sistema |
    | `plugin-sdk/transport-ready-runtime` | Helper di attesa prontezza trasporto |
    | `plugin-sdk/exec-approvals-runtime` | Helper file policy di approvazione exec senza l'ampio barrel infra-runtime |
    | `plugin-sdk/infra-runtime` | Shim di compatibilità deprecato; usa i sottopercorsi runtime focalizzati sopra |
    | `plugin-sdk/collection-runtime` | Piccoli helper cache limitata |
    | `plugin-sdk/diagnostic-runtime` | Helper flag diagnostici, eventi e trace-context |
    | `plugin-sdk/error-runtime` | Grafo errori, formattazione, helper condivisi di classificazione errori, `isApprovalNotFoundError` |
    | `plugin-sdk/fetch-runtime` | Fetch wrappato, proxy, opzione EnvHttpProxyAgent e helper di lookup pinned |
    | `plugin-sdk/runtime-fetch` | Fetch runtime consapevole del dispatcher senza import proxy/guarded-fetch |
    | `plugin-sdk/inline-image-data-url-runtime` | Sanitizer URL dati immagine inline e helper di sniffing firma senza l'ampia superficie runtime media |
    | `plugin-sdk/response-limit-runtime` | Lettore limitato del corpo risposta senza l'ampia superficie runtime media |
    | `plugin-sdk/session-binding-runtime` | Stato binding conversazione corrente senza routing binding configurato o store di pairing |
    | `plugin-sdk/session-store-runtime` | Helper session-store senza import ampi di scrittura/manutenzione config |
    | `plugin-sdk/sqlite-runtime` | Helper focalizzati SQLite per schema agente, percorso e transazioni senza controlli del ciclo di vita database |
    | `plugin-sdk/context-visibility-runtime` | Risoluzione visibilità contesto e filtro contesto supplementare senza import ampi di config/security |
    | `plugin-sdk/string-coerce-runtime` | Helper mirati per coercizione e normalizzazione di record primitivi/stringhe senza import markdown/logging |
    | `plugin-sdk/host-runtime` | Helper di normalizzazione hostname e host SCP |
    | `plugin-sdk/retry-runtime` | Helper di config retry e runner retry |
    | `plugin-sdk/agent-runtime` | Helper dir/identità/workspace agente, inclusi `resolveAgentDir`, `resolveDefaultAgentDir` ed esportazione di compatibilità deprecata `resolveOpenClawAgentDir` |
    | `plugin-sdk/directory-runtime` | Query/dedup directory basate su config |
    | `plugin-sdk/keyed-async-queue` | `KeyedAsyncQueue` |
  </Accordion>

  <Accordion title="Sottopercorsi di capacità e test">
    | Sottopercorso | Esportazioni principali |
    | --- | --- |
    | `plugin-sdk/media-runtime` | Helper condivisi per recupero/trasformazione/archiviazione dei media, inclusi `saveRemoteMedia`, `saveResponseMedia`, `readRemoteMediaBuffer` e il deprecato `fetchRemoteMedia`; preferisci gli helper di archiviazione prima delle letture del buffer quando un URL deve diventare un media OpenClaw |
    | `plugin-sdk/media-mime` | Normalizzazione MIME mirata, mappatura delle estensioni file, rilevamento MIME e helper per tipi di media |
    | `plugin-sdk/media-store` | Helper mirati per lo store dei media, come `saveMediaBuffer` e `saveMediaStream` |
    | `plugin-sdk/media-generation-runtime` | Helper condivisi per il failover della generazione di media, selezione dei candidati e messaggistica per modelli mancanti |
    | `plugin-sdk/media-understanding` | Tipi di provider per la comprensione dei media più esportazioni di helper per provider per immagini/audio/estrazione strutturata |
    | `plugin-sdk/text-chunking` | Helper per suddivisione/rendering di testo e Markdown, conversione di tabelle Markdown, rimozione dei tag direttiva e utilità per testo sicuro |
    | `plugin-sdk/text-chunking` | Helper per la suddivisione del testo in uscita |
    | `plugin-sdk/speech` | Tipi di provider vocali più esportazioni di helper per provider per direttive, registro, validazione, builder TTS compatibile con OpenAI e voce |
    | `plugin-sdk/speech-core` | Tipi di provider vocali condivisi, registro, direttiva, normalizzazione ed esportazioni di helper vocali |
    | `plugin-sdk/realtime-transcription` | Tipi di provider di trascrizione in tempo reale, helper del registro e helper condiviso per sessioni WebSocket |
    | `plugin-sdk/realtime-bootstrap-context` | Helper di bootstrap del profilo in tempo reale per iniezione di contesto delimitata di `IDENTITY.md`, `USER.md` e `SOUL.md` |
    | `plugin-sdk/realtime-voice` | Tipi di provider vocali in tempo reale, helper del registro e helper condivisi per il comportamento vocale in tempo reale, incluso il tracciamento dell'attività di output |
    | `plugin-sdk/image-generation` | Tipi di provider di generazione immagini più helper per asset immagine/data URL e il builder di provider di immagini compatibile con OpenAI |
    | `plugin-sdk/image-generation-core` | Tipi condivisi di generazione immagini, failover, autenticazione e helper del registro |
    | `plugin-sdk/music-generation` | Tipi di provider/richiesta/risultato per la generazione musicale |
    | `plugin-sdk/music-generation-core` | Tipi condivisi di generazione musicale, helper di failover, ricerca provider e parsing model-ref |
    | `plugin-sdk/video-generation` | Tipi di provider/richiesta/risultato per la generazione video |
    | `plugin-sdk/video-generation-core` | Tipi condivisi di generazione video, helper di failover, ricerca provider e parsing model-ref |
    | `plugin-sdk/transcripts` | Tipi di provider di origine dei transcript condivisi, helper del registro, descrittori di sessione e metadati degli enunciati |
    | `plugin-sdk/webhook-targets` | Registro dei target Webhook e helper di installazione delle route |
    | `plugin-sdk/webhook-path` | Alias di compatibilità deprecato; usa `plugin-sdk/webhook-ingress` |
    | `plugin-sdk/web-media` | Helper condivisi per il caricamento di media remoti/locali |
    | `plugin-sdk/zod` | Riesportazione di compatibilità deprecata; importa `zod` direttamente da `zod` |
    | `plugin-sdk/testing` | Barrel di compatibilità deprecato locale del repo per test OpenClaw legacy. I nuovi test del repo dovrebbero invece importare sottopercorsi di test locali mirati come `plugin-sdk/agent-runtime-test-contracts`, `plugin-sdk/plugin-test-runtime`, `plugin-sdk/channel-test-helpers`, `plugin-sdk/test-env` o `plugin-sdk/test-fixtures` |
    | `plugin-sdk/plugin-test-api` | Helper minimo `createTestPluginApi` locale del repo per test unitari di registrazione diretta dei plugin senza importare bridge degli helper di test del repo |
    | `plugin-sdk/agent-runtime-test-contracts` | Fixture di contratto native locali del repo per adapter agent-runtime per test di autenticazione, recapito, fallback, hook degli strumenti, overlay prompt, schema e proiezione transcript |
    | `plugin-sdk/channel-test-helpers` | Helper di test locali del repo orientati ai canali per contratti generici di azioni/setup/stato, asserzioni su directory, ciclo di vita dell'avvio account, threading della configurazione di invio, mock runtime, problemi di stato, recapito in uscita e registrazione degli hook |
    | `plugin-sdk/channel-target-testing` | Suite condivisa locale del repo per casi di errore di risoluzione dei target per test dei canali |
    | `plugin-sdk/plugin-test-contracts` | Helper di contratto locali del repo per pacchetto Plugin, registrazione, artefatto pubblico, importazione diretta, API runtime ed effetti collaterali dell'importazione |
    | `plugin-sdk/provider-test-contracts` | Helper di contratto locali del repo per runtime provider, autenticazione, discovery, onboarding, catalogo, wizard, capacità media, criterio di replay, audio live STT in tempo reale, ricerca/recupero web e stream |
    | `plugin-sdk/provider-http-test-mocks` | Mock HTTP/autenticazione Vitest opt-in locali del repo per test dei provider che esercitano `plugin-sdk/provider-http` |
    | `plugin-sdk/test-fixtures` | Fixture generiche locali del repo per acquisizione runtime CLI, contesto sandbox, writer di skill, messaggio agente, evento di sistema, ricaricamento moduli, percorso Plugin in bundle, testo terminale, suddivisione, token di autenticazione e casi tipizzati |
    | `plugin-sdk/test-node-mocks` | Helper mirati locali del repo per mock dei builtin Node da usare all'interno di factory Vitest `vi.mock("node:*")` |
  </Accordion>

  <Accordion title="Sottopercorsi della memoria">
    | Sottopercorso | Esportazioni principali |
    | --- | --- |
    | `plugin-sdk/memory-core` | Superficie di helper memory-core in bundle per helper di manager/config/file/CLI |
    | `plugin-sdk/memory-core-engine-runtime` | Facciata runtime di indicizzazione/ricerca della memoria |
    | `plugin-sdk/memory-core-host-embedding-registry` | Helper leggeri del registro dei provider di embedding della memoria |
    | `plugin-sdk/memory-core-host-engine-foundation` | Esportazioni del motore foundation dell'host memoria |
    | `plugin-sdk/memory-core-host-engine-embeddings` | Contratti di embedding dell'host memoria, accesso al registro, provider locale e helper generici batch/remoti. `registerMemoryEmbeddingProvider` su questa superficie è deprecato; usa l'API generica dei provider di embedding per i nuovi provider. |
    | `plugin-sdk/memory-core-host-engine-qmd` | Esportazioni del motore QMD dell'host memoria |
    | `plugin-sdk/memory-core-host-engine-storage` | Esportazioni del motore di archiviazione dell'host memoria |
    | `plugin-sdk/memory-core-host-multimodal` | Helper multimodali dell'host memoria |
    | `plugin-sdk/memory-core-host-query` | Helper di query dell'host memoria |
    | `plugin-sdk/memory-core-host-secret` | Helper dei segreti dell'host memoria |
    | `plugin-sdk/memory-core-host-events` | Alias di compatibilità deprecato; usa `plugin-sdk/memory-host-events` |
    | `plugin-sdk/memory-core-host-status` | Helper di stato dell'host memoria |
    | `plugin-sdk/memory-core-host-runtime-cli` | Helper runtime CLI dell'host memoria |
    | `plugin-sdk/memory-core-host-runtime-core` | Helper runtime core dell'host memoria |
    | `plugin-sdk/memory-core-host-runtime-files` | Helper file/runtime dell'host memoria |
    | `plugin-sdk/memory-host-core` | Alias vendor-neutral per gli helper runtime core dell'host memoria |
    | `plugin-sdk/memory-host-events` | Alias vendor-neutral per gli helper del registro eventi dell'host memoria |
    | `plugin-sdk/memory-host-files` | Alias di compatibilità deprecato; usa `plugin-sdk/memory-core-host-runtime-files` |
    | `plugin-sdk/memory-host-markdown` | Helper Markdown gestito condivisi per plugin adiacenti alla memoria |
    | `plugin-sdk/memory-host-search` | Facciata runtime Active Memory per accesso search-manager |
    | `plugin-sdk/memory-host-status` | Alias di compatibilità deprecato; usa `plugin-sdk/memory-core-host-status` |
  </Accordion>

  <Accordion title="Sottopercorsi riservati per helper in bundle">
    I sottopercorsi SDK riservati per helper in bundle sono superfici mirate specifiche del proprietario per
    il codice Plugin in bundle. Sono tracciati nell'inventario SDK affinché le build dei pacchetti
    e gli alias restino deterministici, ma non sono API generali
    per la creazione di plugin. I nuovi contratti host riutilizzabili dovrebbero usare sottopercorsi SDK generici
    come `plugin-sdk/gateway-runtime`, `plugin-sdk/security-runtime` e
    `plugin-sdk/plugin-config-runtime`.

    | Sottopercorso | Proprietario e scopo |
    | --- | --- |
    | `plugin-sdk/codex-mcp-projection` | Helper del Plugin Codex in bundle per proiettare la configurazione del server MCP utente nella configurazione del thread app-server Codex |
    | `plugin-sdk/codex-native-task-runtime` | Helper del Plugin Codex in bundle per rispecchiare i subagenti nativi dell'app-server Codex nello stato attività OpenClaw |

  </Accordion>
</AccordionGroup>

## Correlati

- [Panoramica dell'SDK Plugin](/it/plugins/sdk-overview)
- [Configurazione dell'SDK Plugin](/it/plugins/sdk-setup)
- [Creazione di plugin](/it/plugins/building-plugins)
