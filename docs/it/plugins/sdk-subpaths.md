---
read_when:
    - Scegliere il sottopercorso plugin-sdk corretto per un'importazione di Plugin
    - Audit dei sottopercorsi dei Plugin in bundle e delle superfici helper
summary: 'Catalogo dei sottopercorsi del Plugin SDK: dove si trovano gli import, raggruppati per area'
title: Sottopercorsi dell'SDK Plugin
x-i18n:
    generated_at: "2026-07-04T10:44:25Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 2a77f70197aca279d44d2b9db62bf9f936594311bb46c3da682413c3fa1378e5
    source_path: plugins/sdk-subpaths.md
    workflow: 16
---

L'SDK dei plugin è esposto come un insieme di sottopercorsi pubblici ristretti sotto
`openclaw/plugin-sdk/`. Questa pagina cataloga i sottopercorsi comunemente usati raggruppati per
scopo. L'inventario generato degli entrypoint del compilatore si trova in
`scripts/lib/plugin-sdk-entrypoints.json`; le esportazioni del pacchetto sono il sottoinsieme pubblico
dopo aver sottratto i sottopercorsi di test/interni locali al repository elencati in
`scripts/lib/plugin-sdk-private-local-only-subpaths.json`. I maintainer possono verificare
il conteggio delle esportazioni pubbliche con `pnpm plugin-sdk:surface` e i sottopercorsi helper riservati
attivi con `pnpm plugins:boundary-report:summary`; le esportazioni helper riservate inutilizzate
fanno fallire il report CI invece di rimanere nell'SDK pubblico come
debito di compatibilità dormiente.

Per la guida alla creazione di plugin, consulta [Panoramica dell'SDK dei Plugin](/it/plugins/sdk-overview).

## Entry del Plugin

| Sottopercorso                  | Esportazioni chiave                                                                                                                                                    |
| ------------------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `plugin-sdk/plugin-entry`      | `definePluginEntry`                                                                                                                                                    |
| `plugin-sdk/core`              | `defineChannelPluginEntry`, `createChatChannelPlugin`, `createChannelPluginBase`, `defineSetupPluginEntry`, `buildChannelConfigSchema`, `buildJsonChannelConfigSchema` |
| `plugin-sdk/config-schema`     | `OpenClawSchema`                                                                                                                                                       |
| `plugin-sdk/provider-entry`    | `defineSingleProviderPluginEntry`                                                                                                                                      |
| `plugin-sdk/migration`         | Helper per elementi del provider di migrazione come `createMigrationItem`, costanti di motivo, marcatori di stato degli elementi, helper di redazione e `summarizeMigrationItems` |
| `plugin-sdk/migration-runtime` | Helper di migrazione runtime come `copyMigrationFileItem`, `resolvePlannedMigrationTargets`, `withCachedMigrationConfigRuntime` e `writeMigrationReport`            |
| `plugin-sdk/health`            | Registrazione, rilevamento, riparazione, selezione, gravità e tipi di finding per health-check di Doctor per consumer health in bundle                                               |

### Compatibilità deprecata e helper di test

I sottopercorsi deprecati rimangono esportati per i plugin meno recenti, ma il codice nuovo dovrebbe usare i
sottopercorsi SDK mirati qui sotto. L'elenco mantenuto è
`scripts/lib/plugin-sdk-deprecated-public-subpaths.json`; la CI rifiuta gli import di produzione in bundle
da esso. I barrel ampi come `compat`, `config-types`,
`infra-runtime`, `text-runtime` e `zod` sono solo per compatibilità. Importa `zod`
direttamente da `zod`.

I sottopercorsi degli helper di test di OpenClaw basati su Vitest sono solo locali al repository e non sono
più esportazioni del pacchetto: `agent-runtime-test-contracts`,
`channel-contract-testing`, `channel-target-testing`, `channel-test-helpers`,
`plugin-test-api`, `plugin-test-contracts`, `plugin-test-runtime`,
`provider-http-test-mocks`, `provider-test-contracts`, `test-env`,
`test-fixtures`, `test-node-mocks` e `testing`.

### Sottopercorsi helper riservati dei plugin in bundle

Questi sottopercorsi sono superfici di compatibilità di proprietà del plugin per il plugin in bundle
che ne è proprietario, non API SDK generali: `plugin-sdk/codex-mcp-projection` e
`plugin-sdk/codex-native-task-runtime`. Gli import delle estensioni tra proprietari sono bloccati
dalle protezioni del contratto del pacchetto.

<AccordionGroup>
  <Accordion title="Sottopercorsi dei canali">
    | Sottopercorso | Esportazioni principali |
    | --- | --- |
    | `plugin-sdk/channel-core` | `defineChannelPluginEntry`, `defineSetupPluginEntry`, `createChatChannelPlugin`, `createChannelPluginBase` |
    | `plugin-sdk/config-schema` | Esportazione dello schema Zod radice di `openclaw.json` (`OpenClawSchema`) |
    | `plugin-sdk/json-schema-runtime` | Helper di validazione JSON Schema con cache per schemi di proprietà dei plugin |
    | `plugin-sdk/channel-setup` | `createOptionalChannelSetupSurface`, `createOptionalChannelSetupAdapter`, `createOptionalChannelSetupWizard`, più `DEFAULT_ACCOUNT_ID`, `createTopLevelChannelDmPolicy`, `setSetupChannelEnabled`, `splitSetupEntries` |
    | `plugin-sdk/setup` | Helper condivisi per la procedura guidata di configurazione, traduttore di configurazione, prompt allowlist, builder dello stato di configurazione |
    | `plugin-sdk/setup-runtime` | `createSetupTranslator`, `createPatchedAccountSetupAdapter`, `createEnvPatchedAccountSetupAdapter`, `createSetupInputPresenceValidator`, `noteChannelLookupFailure`, `noteChannelLookupSummary`, `promptResolvedAllowFrom`, `splitSetupEntries`, `createAllowlistSetupWizardProxy`, `createDelegatedSetupWizardProxy` |
    | `plugin-sdk/setup-adapter-runtime` | Alias di compatibilità deprecato; usa `plugin-sdk/setup-runtime` |
    | `plugin-sdk/setup-tools` | `formatCliCommand`, `detectBinary`, `extractArchive`, `resolveBrewExecutable`, `formatDocsLink`, `CONFIG_DIR` |
    | `plugin-sdk/account-core` | Helper per configurazione multi-account e gate delle azioni, helper di fallback per l'account predefinito |
    | `plugin-sdk/account-id` | `DEFAULT_ACCOUNT_ID`, helper di normalizzazione dell'id account |
    | `plugin-sdk/account-resolution` | Helper per ricerca account e fallback predefinito |
    | `plugin-sdk/account-helpers` | Helper mirati per elenco account/azione account |
    | `plugin-sdk/access-groups` | Helper per analisi dell'allowlist dei gruppi di accesso e diagnostica dei gruppi redatta |
    | `plugin-sdk/channel-pairing` | `createChannelPairingController` |
    | `plugin-sdk/channel-reply-pipeline` | Facciata di compatibilità deprecata. Usa `plugin-sdk/channel-outbound`. |
    | `plugin-sdk/channel-config-helpers` | `createHybridChannelConfigAdapter`, `resolveChannelDmAccess`, `resolveChannelDmAllowFrom`, `resolveChannelDmPolicy`, `normalizeChannelDmPolicy`, `normalizeLegacyDmAliases` |
    | `plugin-sdk/channel-config-schema` | Primitive condivise dello schema di configurazione del canale più builder Zod e JSON/TypeBox diretti |
    | `plugin-sdk/bundled-channel-config-schema` | Schemi di configurazione dei canali OpenClaw inclusi solo per plugin inclusi mantenuti |
    | `plugin-sdk/chat-channel-ids` | `BUNDLED_CHAT_CHANNEL_IDS`, `BUNDLED_CHAT_CHANNEL_ENVELOPE_PREFIXES`, `ChatChannelId`. Id canonici dei canali chat inclusi/ufficiali più etichette/alias di formattazione per plugin che devono riconoscere testo con prefisso envelope senza codificare una propria tabella. |
    | `plugin-sdk/channel-config-schema-legacy` | Alias di compatibilità deprecato per gli schemi di configurazione dei canali inclusi |
    | `plugin-sdk/telegram-command-config` | Helper di normalizzazione/validazione dei comandi personalizzati Telegram con fallback del contratto incluso |
    | `plugin-sdk/command-gating` | Helper mirati per il gate di autorizzazione dei comandi |
    | `plugin-sdk/channel-policy` | `resolveChannelGroupRequireMention` |
    | `plugin-sdk/channel-ingress` | Facciata di compatibilità deprecata per ingresso canale di basso livello. I nuovi percorsi di ricezione dovrebbero usare `plugin-sdk/channel-ingress-runtime`. |
    | `plugin-sdk/channel-ingress-runtime` | Resolver runtime sperimentale di alto livello per ingresso canale e builder dei fatti di route per percorsi di ricezione canale migrati. Preferiscilo all'assemblaggio di allowlist effettive, allowlist di comandi e proiezioni legacy in ogni plugin. Vedi [API di ingresso canale](/it/plugins/sdk-channel-ingress). |
    | `plugin-sdk/channel-lifecycle` | Facciata di compatibilità deprecata. Usa `plugin-sdk/channel-outbound`. |
    | `plugin-sdk/channel-outbound` | Contratti del ciclo di vita dei messaggi più opzioni della pipeline di risposta, ricevute, anteprima live/streaming, helper del ciclo di vita, identità in uscita, pianificazione del payload, invii durevoli e helper del contesto di invio messaggi. Vedi [API in uscita del canale](/it/plugins/sdk-channel-outbound). |
    | `plugin-sdk/channel-message` | Alias di compatibilità deprecato per `plugin-sdk/channel-outbound` più facciate legacy di dispatch delle risposte. |
    | `plugin-sdk/channel-message-runtime` | Alias di compatibilità deprecato per `plugin-sdk/channel-outbound` più facciate legacy di dispatch delle risposte. |
    | `plugin-sdk/inbound-envelope` | Helper condivisi per route in ingresso e builder envelope |
    | `plugin-sdk/inbound-reply-dispatch` | Facciata di compatibilità deprecata. Usa `plugin-sdk/channel-inbound` per runner in ingresso e predicati di dispatch, e `plugin-sdk/channel-outbound` per helper di consegna messaggi. |
    | `plugin-sdk/messaging-targets` | Alias deprecato per l'analisi dei target; usa `plugin-sdk/channel-targets` |
    | `plugin-sdk/outbound-media` | Helper condivisi per caricamento dei media in uscita e stato dei media ospitati |
    | `plugin-sdk/outbound-send-deps` | Facciata di compatibilità deprecata. Usa `plugin-sdk/channel-outbound`. |
    | `plugin-sdk/outbound-runtime` | Facciata di compatibilità deprecata. Usa `plugin-sdk/channel-outbound`. |
    | `plugin-sdk/poll-runtime` | Helper mirati per normalizzazione dei sondaggi |
    | `plugin-sdk/thread-bindings-runtime` | Helper per ciclo di vita e adapter dei binding di thread |
    | `plugin-sdk/agent-media-payload` | Builder legacy del payload media dell'agente |
    | `plugin-sdk/conversation-runtime` | Helper per binding conversazione/thread, pairing e binding configurato |
    | `plugin-sdk/runtime-config-snapshot` | Helper per snapshot della configurazione runtime |
    | `plugin-sdk/runtime-group-policy` | Helper per risoluzione della policy di gruppo runtime |
    | `plugin-sdk/channel-status` | Helper condivisi per snapshot/riepilogo dello stato del canale |
    | `plugin-sdk/channel-config-primitives` | Primitive mirate dello schema di configurazione canale |
    | `plugin-sdk/channel-config-writes` | Helper di autorizzazione per scritture della configurazione canale |
    | `plugin-sdk/channel-plugin-common` | Esportazioni condivise del prelude dei plugin di canale |
    | `plugin-sdk/allowlist-config-edit` | Helper per modifica/lettura della configurazione allowlist |
    | `plugin-sdk/group-access` | Helper condivisi per decisioni di accesso ai gruppi |
    | `plugin-sdk/direct-dm`, `plugin-sdk/direct-dm-access` | Facciate di compatibilità deprecate. Usa `plugin-sdk/channel-inbound`. |
    | `plugin-sdk/direct-dm-guard-policy` | Helper mirati per la policy di guardia pre-crypto dei DM diretti |
    | `plugin-sdk/discord` | Facciata di compatibilità Discord deprecata per `@openclaw/discord@2026.3.13` pubblicato e compatibilità proprietario tracciata; i nuovi plugin dovrebbero usare sottopercorsi SDK di canale generici |
    | `plugin-sdk/telegram-account` | Facciata di compatibilità deprecata per la risoluzione account Telegram per compatibilità proprietario tracciata; i nuovi plugin dovrebbero usare helper runtime iniettati o sottopercorsi SDK di canale generici |
    | `plugin-sdk/zalouser` | Facciata di compatibilità Zalo Personal deprecata per pacchetti Lark/Zalo pubblicati che importano ancora l'autorizzazione dei comandi del mittente; i nuovi plugin dovrebbero usare `plugin-sdk/command-auth` |
    | `plugin-sdk/interactive-runtime` | Presentazione semantica dei messaggi, consegna e helper legacy per risposte interattive. Vedi [Presentazione dei messaggi](/it/plugins/message-presentation) |
    | `plugin-sdk/channel-inbound` | Helper condivisi in ingresso per classificazione degli eventi, costruzione del contesto, formattazione, radici, debounce, corrispondenza delle menzioni, policy delle menzioni e logging in ingresso |
    | `plugin-sdk/channel-inbound-debounce` | Helper mirati per debounce in ingresso |
    | `plugin-sdk/channel-mention-gating` | Helper mirati per policy delle menzioni, marker di menzione e testo di menzione senza la superficie runtime in ingresso più ampia |
    | `plugin-sdk/channel-envelope`, `plugin-sdk/channel-inbound-roots`, `plugin-sdk/channel-location`, `plugin-sdk/channel-logging` | Facciate di compatibilità deprecate. Usa `plugin-sdk/channel-inbound` o `plugin-sdk/channel-outbound`. |
    | `plugin-sdk/channel-pairing-paths` | Facciata di compatibilità deprecata. Usa `plugin-sdk/channel-pairing`. |
    | `plugin-sdk/channel-reply-options-runtime` | Facciata di compatibilità deprecata. Usa `plugin-sdk/channel-outbound`. |
    | `plugin-sdk/channel-streaming` | Facciata di compatibilità deprecata. Usa `plugin-sdk/channel-outbound`. |
    | `plugin-sdk/channel-send-result` | Tipi di risultato delle risposte |
    | `plugin-sdk/channel-actions` | Helper per azioni sui messaggi di canale, più helper deprecati per schema nativo mantenuti per compatibilità dei plugin |
    | `plugin-sdk/channel-route` | Helper condivisi per normalizzazione route, risoluzione target guidata dal parser, conversione in stringa degli id thread, chiavi route dedupe/compatte, tipi di target analizzati e helper di confronto route/target |
    | `plugin-sdk/channel-targets` | Helper di analisi dei target; i chiamanti che confrontano route dovrebbero usare `plugin-sdk/channel-route` |
    | `plugin-sdk/channel-contract` | Tipi di contratto canale |
    | `plugin-sdk/channel-feedback` | Cablaggio di feedback/reazioni |
    | `plugin-sdk/channel-secret-runtime` | Helper mirati per contratti dei segreti come `collectSimpleChannelFieldAssignments`, `getChannelSurface`, `pushAssignment` e tipi di target segreto |
  </Accordion>

Le famiglie di helper deprecate per canali restano disponibili solo per
compatibilità con plugin pubblicati. Il piano di rimozione è: mantenerle per
tutta la finestra di migrazione dei plugin esterni, mantenere i plugin del
repository/inclusi su `channel-inbound` e `channel-outbound`, quindi rimuovere
i sottopercorsi di compatibilità nella prossima pulizia major dell'SDK.
Questo si applica alle vecchie famiglie di messaggi/runtime del canale,
streaming del canale, accesso direct-DM, frammenti di helper in ingresso,
opzioni di risposta e pairing-path.

  <Accordion title="Sottopercorsi dei provider">
    | Sottopercorso | Esportazioni principali |
    | --- | --- |
    | `plugin-sdk/provider-entry` | `defineSingleProviderPluginEntry` |
    | `plugin-sdk/lmstudio` | Facade del provider LM Studio supportata per configurazione, rilevamento del catalogo e preparazione del modello a runtime |
    | `plugin-sdk/lmstudio-runtime` | Facade runtime LM Studio supportata per impostazioni predefinite del server locale, rilevamento dei modelli, intestazioni delle richieste e helper per i modelli caricati |
    | `plugin-sdk/provider-setup` | Helper curati per la configurazione di provider locali/self-hosted |
    | `plugin-sdk/self-hosted-provider-setup` | Helper mirati per la configurazione di provider self-hosted compatibili con OpenAI |
    | `plugin-sdk/cli-backend` | Impostazioni predefinite del backend CLI + costanti watchdog |
    | `plugin-sdk/provider-auth-runtime` | Helper runtime per la risoluzione delle chiavi API per i plugin provider |
    | `plugin-sdk/provider-oauth-runtime` | Tipi generici di callback OAuth per provider, rendering della pagina di callback, helper PKCE/stato, parsing dell'input di autorizzazione, helper per la scadenza dei token e helper di interruzione |
    | `plugin-sdk/provider-auth-api-key` | Helper per onboarding chiave API/scrittura profilo come `upsertApiKeyProfile` |
    | `plugin-sdk/provider-auth-result` | Builder standard del risultato di autenticazione OAuth |
    | `plugin-sdk/provider-env-vars` | Helper per la ricerca delle variabili d'ambiente di autenticazione dei provider |
    | `plugin-sdk/provider-auth` | `createProviderApiKeyAuthMethod`, `ensureApiKeyFromOptionEnvOrPrompt`, `upsertAuthProfile`, `upsertApiKeyProfile`, `writeOAuthCredentials`, helper di importazione autenticazione OpenAI Codex, esportazione di compatibilità deprecata `resolveOpenClawAgentDir` |
    | `plugin-sdk/provider-model-shared` | `ProviderReplayFamily`, `buildProviderReplayFamilyHooks`, `normalizeModelCompat`, builder condivisi per policy di replay, helper per endpoint provider e helper condivisi per la normalizzazione degli ID modello |
    | `plugin-sdk/provider-catalog-live-runtime` | Helper per cataloghi live dei modelli provider per rilevamento protetto in stile `/models`: `buildLiveModelProviderConfig`, `fetchLiveProviderModelRows`, `getCachedLiveProviderModelRows`, `fetchLiveProviderModelIds`, `LiveModelCatalogHttpError`, `clearLiveCatalogCacheForTests`, filtro degli ID modello, cache TTL e fallback statico |
    | `plugin-sdk/provider-catalog-runtime` | Hook runtime di ampliamento del catalogo provider e punti di integrazione del registro plugin-provider per test di contratto |
    | `plugin-sdk/provider-catalog-shared` | `findCatalogTemplate`, `buildSingleProviderApiKeyCatalog`, `buildManifestModelProviderConfig`, `supportsNativeStreamingUsageCompat`, `applyProviderNativeStreamingUsageCompat` |
    | `plugin-sdk/provider-http` | Helper generici per capacità HTTP/endpoint dei provider, errori HTTP dei provider e helper per moduli multipart di trascrizione audio |
    | `plugin-sdk/provider-web-fetch-contract` | Helper ristretti per contratto di configurazione/selezione web-fetch come `enablePluginInConfig` e `WebFetchProviderPlugin` |
    | `plugin-sdk/provider-web-fetch` | Helper di registrazione/cache dei provider web-fetch |
    | `plugin-sdk/provider-web-search-config-contract` | Helper ristretti per configurazione/credenziali web-search per provider che non richiedono il cablaggio di abilitazione del plugin |
    | `plugin-sdk/provider-web-search-contract` | Helper ristretti per contratto di configurazione/credenziali web-search come `createWebSearchProviderContractFields`, `enablePluginInConfig`, `resolveProviderWebSearchPluginConfig` e setter/getter delle credenziali con ambito |
    | `plugin-sdk/provider-web-search` | Helper di registrazione/cache/runtime dei provider web-search |
    | `plugin-sdk/embedding-providers` | Tipi generali di provider di embedding e helper di lettura, inclusi `EmbeddingProviderAdapter`, `getEmbeddingProvider(...)` e `listEmbeddingProviders(...)`; i plugin registrano i provider tramite `api.registerEmbeddingProvider(...)` in modo che la proprietà del manifest sia applicata |
    | `plugin-sdk/provider-tools` | `ProviderToolCompatFamily`, `buildProviderToolCompatFamilyHooks` e pulizia + diagnostica degli schemi DeepSeek/Gemini/OpenAI |
    | `plugin-sdk/provider-usage` | Tipi di snapshot dell'utilizzo dei provider, helper condivisi per il recupero dell'utilizzo e fetcher dei provider come `fetchClaudeUsage` |
    | `plugin-sdk/provider-stream` | `ProviderStreamFamily`, `buildProviderStreamFamilyHooks`, `composeProviderStreamWrappers`, tipi di wrapper di stream, compatibilità delle chiamate agli strumenti in testo semplice e helper wrapper condivisi Anthropic/Bedrock/DeepSeek V4/Google/Kilocode/Moonshot/OpenAI/OpenRouter/Z.A.I/MiniMax/Copilot |
    | `plugin-sdk/provider-stream-shared` | Helper pubblici condivisi per wrapper di stream dei provider, inclusi `composeProviderStreamWrappers`, `createOpenAICompatibleCompletionsThinkingOffWrapper`, `createPlainTextToolCallCompatWrapper`, `createPayloadPatchStreamWrapper`, `createToolStreamWrapper`, `normalizeOpenAICompatibleReasoningPayload`, `setQwenChatTemplateThinking` e utility di stream compatibili con Anthropic/DeepSeek/OpenAI |
    | `plugin-sdk/provider-transport-runtime` | Helper di trasporto nativo dei provider come fetch protetto, estrazione del testo dai risultati degli strumenti, trasformazioni dei messaggi di trasporto e stream scrivibili di eventi di trasporto |
    | `plugin-sdk/provider-onboard` | Helper per patch della configurazione di onboarding |
    | `plugin-sdk/global-singleton` | Helper singleton/mappa/cache locali al processo |
    | `plugin-sdk/group-activation` | Helper ristretti per modalità di attivazione dei gruppi e parsing dei comandi |
  </Accordion>

Gli snapshot di utilizzo dei provider normalmente riportano una o più `windows` di quota, ciascuna con
un'etichetta, la percentuale utilizzata e un'eventuale ora di ripristino. I provider che espongono testo di saldo o
stato account invece di finestre di quota ripristinabili devono restituire
`summary` con un array `windows` vuoto invece di fabbricare percentuali.
OpenClaw mostra quel testo di riepilogo nell'output di stato; usa `error` solo quando
l'endpoint di utilizzo non è riuscito o non ha restituito dati di utilizzo utilizzabili.

  <Accordion title="Sottopercorsi di autenticazione e sicurezza">
    | Sottopercorso | Esportazioni principali |
    | --- | --- |
    | `plugin-sdk/command-auth` | `resolveControlCommandGate`, helper del registro comandi inclusa la formattazione dinamica del menu degli argomenti, helper di autorizzazione del mittente |
    | `plugin-sdk/command-status` | Builder di messaggi di comando/aiuto come `buildCommandsMessagePaginated` e `buildHelpMessage` |
    | `plugin-sdk/approval-auth-runtime` | Helper per risoluzione dell'approvatore e autenticazione delle azioni nella stessa chat |
    | `plugin-sdk/approval-client-runtime` | Helper per profili/filtri di approvazione exec nativa |
    | `plugin-sdk/approval-delivery-runtime` | Adapter nativi per capacità/consegna delle approvazioni |
    | `plugin-sdk/approval-gateway-runtime` | Helper condiviso per la risoluzione del Gateway di approvazione |
    | `plugin-sdk/approval-handler-adapter-runtime` | Helper leggeri per il caricamento di adapter nativi di approvazione per entrypoint di canali ad alto traffico |
    | `plugin-sdk/approval-handler-runtime` | Helper runtime più ampi per gestori di approvazione; preferisci i punti di integrazione adapter/Gateway più ristretti quando bastano |
    | `plugin-sdk/approval-native-runtime` | Helper per target di approvazione nativa, associazione account, gate di route, fallback di inoltro e soppressione dei prompt exec nativi locali |
    | `plugin-sdk/approval-reaction-runtime` | Binding hardcoded delle reazioni di approvazione, payload dei prompt di reazione, store dei target di reazione, helper per testo di suggerimento delle reazioni ed esportazione di compatibilità per la soppressione dei prompt exec nativi locali |
    | `plugin-sdk/approval-reply-runtime` | Helper dei payload di risposta di approvazione exec/plugin |
    | `plugin-sdk/approval-runtime` | Helper dei payload di approvazione exec/plugin, helper di routing/runtime per approvazione nativa e helper di visualizzazione strutturata dell'approvazione come `formatApprovalDisplayPath` |
    | `plugin-sdk/reply-dedupe` | Helper ristretti per reset della deduplicazione delle risposte in ingresso |
    | `plugin-sdk/channel-contract-testing` | Helper ristretti per test di contratto dei canali senza il barrel di test ampio |
    | `plugin-sdk/command-auth-native` | Autenticazione nativa dei comandi, formattazione dinamica del menu degli argomenti e helper nativi per target di sessione |
    | `plugin-sdk/command-detection` | Helper condivisi per rilevamento dei comandi |
    | `plugin-sdk/command-primitives-runtime` | Predicati leggeri sul testo dei comandi per percorsi di canale ad alto traffico |
    | `plugin-sdk/command-surface` | Normalizzazione del corpo dei comandi e helper per la superficie dei comandi |
    | `plugin-sdk/allow-from` | `formatAllowFromLowercase` |
    | `plugin-sdk/provider-auth-login-flow-runtime` | Helper lazy per flussi di login di autenticazione provider per canale privato e abbinamento device-code della Web UI |
    | `plugin-sdk/channel-secret-runtime` | Helper ristretti per raccolta dei contratti dei segreti per superfici di segreti canale/plugin |
    | `plugin-sdk/secret-ref-runtime` | Helper ristretti di tipizzazione `coerceSecretRef` e SecretRef per parsing di contratti/configurazioni dei segreti |
    | `plugin-sdk/secret-provider-integration` | Manifest di integrazione provider SecretRef solo tipi e contratti preset per plugin che pubblicano preset di provider di segreti esterni |
    | `plugin-sdk/security-runtime` | Trust condiviso, gate DM, helper per file/percorsi limitati alla root inclusi scritture solo creazione, sostituzione atomica sincrona/asincrona dei file, scritture temporanee sibling, fallback di spostamento cross-device, helper per file-store privato, guardie sui symlink parent, contenuto esterno, redazione di testo sensibile, confronto di segreti a tempo costante e helper per raccolta di segreti |
    | `plugin-sdk/ssrf-policy` | Helper per allowlist host e policy SSRF per reti private |
    | `plugin-sdk/ssrf-dispatcher` | Helper ristretti per dispatcher bloccati senza l'ampia superficie runtime dell'infrastruttura |
    | `plugin-sdk/ssrf-runtime` | Dispatcher bloccati, fetch protetto da SSRF, errore SSRF e helper di policy SSRF |
    | `plugin-sdk/secret-input` | Helper per parsing dell'input dei segreti |
    | `plugin-sdk/webhook-ingress` | Helper per richieste/target Webhook e coercizione raw di websocket/body |
    | `plugin-sdk/webhook-request-guards` | Helper per dimensione/timeout del corpo richiesta |
  </Accordion>

  <Accordion title="Runtime and storage subpaths">
    | Sottopercorso | Esportazioni principali |
    | --- | --- |
    | `plugin-sdk/runtime` | Helper ampi per runtime/logging/backup/installazione Plugin |
    | `plugin-sdk/runtime-env` | Helper mirati per env di runtime, logger, timeout, retry e backoff |
    | `plugin-sdk/browser-config` | Facciata di configurazione browser supportata per profilo/default normalizzati, parsing degli URL CDP e helper di autenticazione per il controllo del browser |
    | `plugin-sdk/agent-harness-task-runtime` | Helper generici per ciclo di vita dei task e consegna del completamento per agenti basati su harness che usano un ambito task emesso dall'host |
    | `plugin-sdk/codex-mcp-projection` | Helper Codex bundled riservato per proiettare la configurazione server MCP dell'utente nella configurazione thread di Codex; non per Plugin di terze parti |
    | `plugin-sdk/codex-native-task-runtime` | Helper Codex bundled privato per cablaggio nativo del mirror/runtime dei task; non per Plugin di terze parti |
    | `plugin-sdk/channel-runtime-context` | Helper generici per registrazione e lookup del contesto di runtime dei canali |
    | `plugin-sdk/matrix` | Facciata di compatibilità Matrix deprecata per pacchetti canale di terze parti più vecchi; i nuovi Plugin dovrebbero importare direttamente `plugin-sdk/run-command` |
    | `plugin-sdk/mattermost` | Facciata di compatibilità Mattermost deprecata per pacchetti canale di terze parti più vecchi; i nuovi Plugin dovrebbero importare direttamente i sottopercorsi SDK generici |
    | `plugin-sdk/runtime-store` | `createPluginRuntimeStore` |
    | `plugin-sdk/plugin-runtime` | Helper condivisi per comandi/hook/http/interattivi dei Plugin |
    | `plugin-sdk/hook-runtime` | Helper condivisi per pipeline webhook/hook interni |
    | `plugin-sdk/lazy-runtime` | Helper per import/binding lazy del runtime come `createLazyRuntimeModule`, `createLazyRuntimeMethod` e `createLazyRuntimeSurface` |
    | `plugin-sdk/process-runtime` | Helper per exec di processo |
    | `plugin-sdk/cli-runtime` | Helper per formattazione CLI, attesa, versione, invocazione argomenti e gruppi di comandi lazy |
    | `plugin-sdk/qa-live-transport-scenarios` | ID di scenari QA del trasporto live condivisi, helper di copertura baseline e helper di selezione scenario |
    | `plugin-sdk/gateway-method-runtime` | Helper di dispatch dei metodi Gateway riservato per route HTTP dei Plugin che dichiarano `contracts.gatewayMethodDispatch: ["authenticated-request"]` |
    | `plugin-sdk/gateway-runtime` | Client Gateway, helper di avvio client pronto per event loop, RPC CLI del gateway, errori del protocollo gateway, risoluzione dell'host LAN pubblicizzato e helper di patch dello stato canale |
    | `plugin-sdk/config-contracts` | Superficie di configurazione mirata solo tipi per forme di configurazione Plugin come `OpenClawConfig` e tipi di configurazione canale/provider |
    | `plugin-sdk/plugin-config-runtime` | Helper di lookup della configurazione Plugin di runtime come `requireRuntimeConfig`, `resolvePluginConfigObject` e `resolveLivePluginConfigObject` |
    | `plugin-sdk/config-mutation` | Helper di mutazione transazionale della configurazione come `mutateConfigFile`, `replaceConfigFile` e `logConfigUpdated` |
    | `plugin-sdk/message-tool-delivery-hints` | Stringhe hint condivise per metadati di consegna message-tool |
    | `plugin-sdk/runtime-config-snapshot` | Helper per snapshot della configurazione del processo corrente come `getRuntimeConfig`, `getRuntimeConfigSnapshot` e setter di snapshot per test |
    | `plugin-sdk/telegram-command-config` | Normalizzazione di nome/descrizione dei comandi Telegram e controlli di duplicati/conflitti, anche quando la superficie del contratto Telegram bundled non è disponibile |
    | `plugin-sdk/text-autolink-runtime` | Rilevamento autolink dei riferimenti a file senza l'ampio barrel di testo |
    | `plugin-sdk/approval-reaction-runtime` | Binding hardcoded delle reazioni di approvazione, payload dei prompt di reazione, archivi dei target di reazione, helper di testo hint per reazioni ed esportazione di compatibilità per la soppressione del prompt exec nativo locale |
    | `plugin-sdk/approval-runtime` | Helper per approvazione exec/Plugin, builder di capacità di approvazione, helper auth/profilo, helper nativi di routing/runtime e formattazione strutturata del percorso di visualizzazione dell'approvazione |
    | `plugin-sdk/reply-runtime` | Helper condivisi di runtime inbound/risposta, suddivisione in chunk, dispatch, Heartbeat, pianificatore risposte |
    | `plugin-sdk/reply-dispatch-runtime` | Helper mirati per dispatch/finalizzazione delle risposte e label conversazione |
    | `plugin-sdk/reply-history` | Helper condivisi per cronologia risposte a finestra breve. Il nuovo codice message-turn dovrebbe usare `createChannelHistoryWindow`; gli helper map di livello inferiore restano solo esportazioni di compatibilità deprecate |
    | `plugin-sdk/reply-reference` | `createReplyReferencePlanner` |
    | `plugin-sdk/reply-chunking` | Helper mirati per suddivisione in chunk di testo/markdown |
    | `plugin-sdk/session-store-runtime` | Helper per workflow sessione (`getSessionEntry`, `listSessionEntries`, `patchSessionEntry`, `upsertSessionEntry`), letture limitate del testo recente del transcript utente/assistente per identità sessione, helper legacy per percorso archivio sessioni/chiave sessione, letture updated-at e helper di compatibilità solo transizione per intero archivio/percorso file |
    | `plugin-sdk/session-transcript-runtime` | Identità transcript, helper con ambito per target/lettura/scrittura, pubblicazione aggiornamenti, lock di scrittura e chiavi hit della memoria transcript |
    | `plugin-sdk/sqlite-runtime` | Helper mirati per schema agente SQLite, percorso e transazioni per runtime first-party |
    | `plugin-sdk/cron-store-runtime` | Helper per percorso/caricamento/salvataggio dell'archivio Cron |
    | `plugin-sdk/state-paths` | Helper per percorsi directory State/OAuth |
    | `plugin-sdk/plugin-state-runtime` | Tipi di stato keyed SQLite sidecar dei Plugin più setup centralizzato dei pragma di connessione e della manutenzione WAL per database di proprietà dei Plugin |
    | `plugin-sdk/routing` | Helper per binding route/chiave sessione/account come `resolveAgentRoute`, `buildAgentSessionKey` e `resolveDefaultAgentBoundAccountId` |
    | `plugin-sdk/status-helpers` | Helper condivisi per riepilogo stato canale/account, default dello stato runtime e metadati issue |
    | `plugin-sdk/target-resolver-runtime` | Helper condivisi per risoluzione target |
    | `plugin-sdk/string-normalization-runtime` | Helper per normalizzazione slug/stringhe |
    | `plugin-sdk/request-url` | Estrae URL stringa da input simili a fetch/request |
    | `plugin-sdk/run-command` | Runner di comandi temporizzato con risultati stdout/stderr normalizzati |
    | `plugin-sdk/param-readers` | Reader comuni per parametri tool/CLI |
    | `plugin-sdk/tool-plugin` | Definisce un semplice Plugin agent-tool tipizzato ed espone metadati statici per la generazione del manifest |
    | `plugin-sdk/tool-payload` | Estrae payload normalizzati da oggetti risultato tool |
    | `plugin-sdk/tool-send` | Estrae campi canonici del target di invio dagli argomenti tool |
    | `plugin-sdk/sandbox` | Tipi di backend sandbox e helper per comandi SSH/OpenShell, incluso preflight fail-fast dei comandi exec |
    | `plugin-sdk/temp-path` | Helper condivisi per percorsi di download temporanei e workspace temporanei sicuri privati |
    | `plugin-sdk/logging-core` | Helper per logger di sottosistema e redazione |
    | `plugin-sdk/markdown-table-runtime` | Helper per modalità tabella Markdown e conversione |
    | `plugin-sdk/model-session-runtime` | Helper per override di modello/sessione come `applyModelOverrideToSessionEntry` e `resolveAgentMaxConcurrent` |
    | `plugin-sdk/talk-config-runtime` | Helper per risoluzione della configurazione del provider talk |
    | `plugin-sdk/json-store` | Piccoli helper per lettura/scrittura dello stato JSON |
    | `plugin-sdk/json-unsafe-integers` | Helper di parsing JSON che preservano i letterali interi non sicuri come stringhe |
    | `plugin-sdk/file-lock` | Helper per file-lock rientranti |
    | `plugin-sdk/persistent-dedupe` | Helper per cache di dedupe basata su disco |
    | `plugin-sdk/acp-runtime` | Helper per runtime/sessione ACP e dispatch risposte |
    | `plugin-sdk/acp-runtime-backend` | Helper leggeri per registrazione backend ACP e dispatch risposte per Plugin caricati all'avvio |
    | `plugin-sdk/acp-binding-resolve-runtime` | Risoluzione binding ACP in sola lettura senza import del ciclo di vita di avvio |
    | `plugin-sdk/agent-config-primitives` | Primitive mirate per schema di configurazione del runtime agente |
    | `plugin-sdk/boolean-param` | Reader di parametri booleani loose |
    | `plugin-sdk/dangerous-name-runtime` | Helper di risoluzione per corrispondenza di nomi pericolosi |
    | `plugin-sdk/device-bootstrap` | Helper per bootstrap dispositivo e token di pairing |
    | `plugin-sdk/extension-shared` | Primitive helper condivise per canale passivo, stato e proxy ambient |
    | `plugin-sdk/models-provider-runtime` | Helper per risposte comando/provider `/models` |
    | `plugin-sdk/skill-commands-runtime` | Helper per elencare comandi Skill |
    | `plugin-sdk/native-command-registry` | Helper per registry/build/serializzazione di comandi nativi |
    | `plugin-sdk/agent-harness` | Superficie sperimentale per Plugin trusted per harness agente di basso livello: tipi harness, helper steer/abort per run attiva, helper bridge per tool OpenClaw, helper per policy tool runtime-plan, classificazione dell'esito terminale, helper di formattazione/dettaglio del progresso tool e utility per risultati dei tentativi |
    | `plugin-sdk/provider-zai-endpoint` | Facciata deprecata di rilevamento endpoint di proprietà del provider Z.AI; usa l'API pubblica del Plugin Z.AI |
    | `plugin-sdk/async-lock-runtime` | Helper per lock asincrono process-local per piccoli file di stato runtime |
    | `plugin-sdk/channel-activity-runtime` | Helper per telemetria attività canale |
    | `plugin-sdk/concurrency-runtime` | Helper per concorrenza limitata dei task asincroni |
    | `plugin-sdk/dedupe-runtime` | Helper per cache di dedupe in memoria e con backend persistente |
    | `plugin-sdk/delivery-queue-runtime` | Helper di drain delle consegne pendenti outbound |
    | `plugin-sdk/file-access-runtime` | Helper sicuri per percorsi di file locali e sorgenti media |
    | `plugin-sdk/heartbeat-runtime` | Helper per wake, eventi e visibilità di Heartbeat |
    | `plugin-sdk/number-runtime` | Helper per coercizione numerica |
    | `plugin-sdk/secure-random-runtime` | Helper sicuri per token/UUID |
    | `plugin-sdk/system-event-runtime` | Helper per coda eventi di sistema |
    | `plugin-sdk/transport-ready-runtime` | Helper di attesa della prontezza del trasporto |
    | `plugin-sdk/exec-approvals-runtime` | Helper per file di policy di approvazione exec senza l'ampio barrel infra-runtime |
    | `plugin-sdk/infra-runtime` | Shim di compatibilità deprecato; usa i sottopercorsi runtime mirati sopra |
    | `plugin-sdk/collection-runtime` | Piccoli helper per cache limitata |
    | `plugin-sdk/diagnostic-runtime` | Helper per flag diagnostici, eventi e trace-context |
    | `plugin-sdk/error-runtime` | Helper per grafo errori, formattazione, classificazione errori condivisa, `isApprovalNotFoundError` |
    | `plugin-sdk/fetch-runtime` | Helper per fetch wrappato, proxy, opzione EnvHttpProxyAgent e lookup pinned |
    | `plugin-sdk/runtime-fetch` | Fetch runtime consapevole del dispatcher senza import proxy/guarded-fetch |
    | `plugin-sdk/inline-image-data-url-runtime` | Helper per sanitizer di data URL di immagini inline e sniffing delle signature senza l'ampia superficie runtime media |
    | `plugin-sdk/response-limit-runtime` | Reader limitato del corpo risposta senza l'ampia superficie runtime media |
    | `plugin-sdk/session-binding-runtime` | Stato binding della conversazione corrente senza routing del binding configurato o archivi di pairing |
    | `plugin-sdk/session-store-runtime` | Helper per archivio sessioni senza ampie scritture/manutenzione della configurazione |
    | `plugin-sdk/sqlite-runtime` | Helper mirati per schema agente SQLite, percorso e transazioni senza controlli del ciclo di vita del database |
    | `plugin-sdk/context-visibility-runtime` | Risoluzione della visibilità del contesto e filtraggio del contesto supplementare senza ampi import di configurazione/sicurezza |
    | `plugin-sdk/string-coerce-runtime` | Helper mirati per coercizione e normalizzazione di record/stringhe primitive senza import markdown/logging |
    | `plugin-sdk/host-runtime` | Helper per normalizzazione di hostname e host SCP |
    | `plugin-sdk/retry-runtime` | Helper per configurazione retry e runner retry |
    | `plugin-sdk/agent-runtime` | Helper per directory/identità/workspace degli agenti, inclusi `resolveAgentDir`, `resolveDefaultAgentDir` ed esportazione di compatibilità deprecata `resolveOpenClawAgentDir` |
    | `plugin-sdk/directory-runtime` | Query/dedup di directory basate su configurazione |
    | `plugin-sdk/keyed-async-queue` | `KeyedAsyncQueue` |
  </Accordion>

  <Accordion title="Sottopercorsi di funzionalità e test">
    | Sottopercorso | Esportazioni principali |
    | --- | --- |
    | `plugin-sdk/media-runtime` | Helper condivisi per recuperare/trasformare/archiviare media, inclusi `saveRemoteMedia`, `saveResponseMedia`, `readRemoteMediaBuffer` e `fetchRemoteMedia` deprecato; preferisci gli helper di archiviazione prima delle letture del buffer quando un URL deve diventare un media OpenClaw |
    | `plugin-sdk/media-mime` | Normalizzazione MIME mirata, mappatura delle estensioni file, rilevamento MIME e helper per tipo di media |
    | `plugin-sdk/media-store` | Helper mirati per l'archivio media, come `saveMediaBuffer` e `saveMediaStream` |
    | `plugin-sdk/media-generation-runtime` | Helper condivisi per il failover della generazione di media, selezione dei candidati e messaggi per modelli mancanti |
    | `plugin-sdk/media-understanding` | Tipi di provider per la comprensione dei media più esportazioni di helper per immagini/audio/estrazione strutturata rivolti ai provider |
    | `plugin-sdk/text-chunking` | Helper per suddivisione/rendering di testo e markdown, conversione delle tabelle markdown, rimozione dei tag direttiva e utilità per testo sicuro |
    | `plugin-sdk/text-chunking` | Helper per la suddivisione del testo in uscita |
    | `plugin-sdk/speech` | Tipi di provider vocali più esportazioni rivolte ai provider per direttive, registro, validazione, builder TTS compatibile con OpenAI e helper vocali |
    | `plugin-sdk/speech-core` | Tipi condivisi di provider vocali, registro, direttiva, normalizzazione ed esportazioni di helper vocali |
    | `plugin-sdk/realtime-transcription` | Tipi di provider per trascrizione in tempo reale, helper di registro e helper condiviso per sessioni WebSocket |
    | `plugin-sdk/realtime-bootstrap-context` | Helper di bootstrap del profilo in tempo reale per l'iniezione limitata del contesto `IDENTITY.md`, `USER.md` e `SOUL.md` |
    | `plugin-sdk/realtime-voice` | Tipi di provider vocali in tempo reale, helper di registro e helper condivisi per il comportamento vocale in tempo reale, incluso il tracciamento dell'attività di output |
    | `plugin-sdk/image-generation` | Tipi di provider per generazione di immagini più helper per asset immagine/URL dati e builder di provider immagini compatibile con OpenAI |
    | `plugin-sdk/image-generation-core` | Tipi condivisi per generazione di immagini, failover, auth e helper di registro |
    | `plugin-sdk/music-generation` | Tipi di provider/richiesta/risultato per generazione musicale |
    | `plugin-sdk/music-generation-core` | Tipi condivisi per generazione musicale, helper di failover, ricerca provider e parsing di model-ref |
    | `plugin-sdk/video-generation` | Tipi di provider/richiesta/risultato per generazione video |
    | `plugin-sdk/video-generation-core` | Tipi condivisi per generazione video, helper di failover, ricerca provider e parsing di model-ref |
    | `plugin-sdk/transcripts` | Tipi condivisi di provider sorgente per trascrizioni, helper di registro, descrittori di sessione e metadati delle espressioni vocali |
    | `plugin-sdk/webhook-targets` | Registro dei target Webhook e helper di installazione delle route |
    | `plugin-sdk/webhook-path` | Alias di compatibilità deprecato; usa `plugin-sdk/webhook-ingress` |
    | `plugin-sdk/web-media` | Helper condivisi per il caricamento di media remoti/locali |
    | `plugin-sdk/zod` | Re-export di compatibilità deprecato; importa `zod` direttamente da `zod` |
    | `plugin-sdk/testing` | Barrel di compatibilità deprecato locale al repo per test OpenClaw legacy. I nuovi test del repo dovrebbero invece importare sottopercorsi di test locali mirati come `plugin-sdk/agent-runtime-test-contracts`, `plugin-sdk/plugin-test-runtime`, `plugin-sdk/channel-test-helpers`, `plugin-sdk/test-env` o `plugin-sdk/test-fixtures` |
    | `plugin-sdk/plugin-test-api` | Helper minimo locale al repo `createTestPluginApi` per test unitari di registrazione diretta dei plugin senza importare bridge helper di test del repo |
    | `plugin-sdk/agent-runtime-test-contracts` | Fixture di contratto dell'adapter runtime agente nativo, locali al repo, per test di auth, consegna, fallback, hook degli strumenti, overlay prompt, schema e proiezione delle trascrizioni |
    | `plugin-sdk/channel-test-helpers` | Helper di test locali al repo orientati ai canali per contratti generici di azioni/setup/stato, asserzioni su directory, ciclo di vita di avvio account, threading di send-config, mock runtime, problemi di stato, consegna in uscita e registrazione hook |
    | `plugin-sdk/channel-target-testing` | Suite condivisa locale al repo per casi di errore nella risoluzione dei target per test dei canali |
    | `plugin-sdk/plugin-test-contracts` | Helper locali al repo per contratti di pacchetto plugin, registrazione, artefatto pubblico, import diretto, API runtime ed effetti collaterali di importazione |
    | `plugin-sdk/provider-test-contracts` | Helper locali al repo per contratti di runtime provider, auth, discovery, onboard, catalogo, procedura guidata, funzionalità media, policy di replay, audio live STT in tempo reale, ricerca/recupero web e stream |
    | `plugin-sdk/provider-http-test-mocks` | Mock HTTP/auth Vitest opt-in locali al repo per test dei provider che esercitano `plugin-sdk/provider-http` |
    | `plugin-sdk/test-fixtures` | Fixture generiche locali al repo per cattura runtime CLI, contesto sandbox, writer di skill, messaggio agente, evento di sistema, ricaricamento modulo, percorso plugin bundled, testo terminale, suddivisione, token auth e casi tipizzati |
    | `plugin-sdk/test-node-mocks` | Helper mock mirati locali al repo per builtin Node da usare dentro le factory Vitest `vi.mock("node:*")` |
  </Accordion>

  <Accordion title="Sottopercorsi della memoria">
    | Sottopercorso | Esportazioni principali |
    | --- | --- |
    | `plugin-sdk/memory-core` | Superficie helper memory-core bundled per helper manager/config/file/CLI |
    | `plugin-sdk/memory-core-engine-runtime` | Facade runtime per indice/ricerca della memoria |
    | `plugin-sdk/memory-core-host-embedding-registry` | Helper leggeri per il registro dei provider di embedding della memoria |
    | `plugin-sdk/memory-core-host-engine-foundation` | Esportazioni del motore foundation dell'host memoria |
    | `plugin-sdk/memory-core-host-engine-embeddings` | Contratti di embedding dell'host memoria, accesso al registro, provider locale e helper generici batch/remoti. `registerMemoryEmbeddingProvider` su questa superficie è deprecato; usa l'API generica dei provider di embedding per nuovi provider. |
    | `plugin-sdk/memory-core-host-engine-qmd` | Esportazioni del motore QMD dell'host memoria |
    | `plugin-sdk/memory-core-host-engine-storage` | Esportazioni del motore storage dell'host memoria |
    | `plugin-sdk/memory-core-host-multimodal` | Helper multimodali dell'host memoria |
    | `plugin-sdk/memory-core-host-query` | Helper di query dell'host memoria |
    | `plugin-sdk/memory-core-host-secret` | Helper secret dell'host memoria |
    | `plugin-sdk/memory-core-host-events` | Alias di compatibilità deprecato; usa `plugin-sdk/memory-host-events` |
    | `plugin-sdk/memory-core-host-status` | Helper di stato dell'host memoria |
    | `plugin-sdk/memory-core-host-runtime-cli` | Helper runtime CLI dell'host memoria |
    | `plugin-sdk/memory-core-host-runtime-core` | Helper runtime core dell'host memoria |
    | `plugin-sdk/memory-core-host-runtime-files` | Helper file/runtime dell'host memoria |
    | `plugin-sdk/memory-host-core` | Alias indipendente dal vendor per helper runtime core dell'host memoria |
    | `plugin-sdk/memory-host-events` | Alias indipendente dal vendor per helper del journal eventi dell'host memoria |
    | `plugin-sdk/memory-host-files` | Alias di compatibilità deprecato; usa `plugin-sdk/memory-core-host-runtime-files` |
    | `plugin-sdk/memory-host-markdown` | Helper condivisi per markdown gestito per plugin adiacenti alla memoria |
    | `plugin-sdk/memory-host-search` | Facade runtime Active memory per l'accesso al search-manager |
    | `plugin-sdk/memory-host-status` | Alias di compatibilità deprecato; usa `plugin-sdk/memory-core-host-status` |
  </Accordion>

  <Accordion title="Sottopercorsi helper bundled riservati">
    I sottopercorsi SDK helper bundled riservati sono superfici ristrette specifiche del proprietario per il
    codice dei plugin bundled. Sono tracciati nell'inventario SDK affinché le build
    dei pacchetti e gli alias restino deterministici, ma non sono API generali
    per la creazione di plugin. I nuovi contratti host riutilizzabili dovrebbero usare sottopercorsi SDK generici
    come `plugin-sdk/gateway-runtime`, `plugin-sdk/security-runtime` e
    `plugin-sdk/plugin-config-runtime`.

    | Sottopercorso | Proprietario e scopo |
    | --- | --- |
    | `plugin-sdk/codex-mcp-projection` | Helper del plugin Codex bundled per proiettare la configurazione server MCP dell'utente nella configurazione thread app-server di Codex |
    | `plugin-sdk/codex-native-task-runtime` | Helper del plugin Codex bundled per rispecchiare i subagenti nativi dell'app-server Codex nello stato delle attività OpenClaw |

  </Accordion>
</AccordionGroup>

## Correlati

- [Panoramica SDK Plugin](/it/plugins/sdk-overview)
- [Configurazione SDK Plugin](/it/plugins/sdk-setup)
- [Creazione di plugin](/it/plugins/building-plugins)
