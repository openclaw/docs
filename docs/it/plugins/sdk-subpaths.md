---
read_when:
    - Scelta del sottopercorso plugin-sdk corretto per l'importazione di un plugin
    - Verifica dei sottopercorsi dei Plugin inclusi e delle interfacce degli helper
summary: 'Catalogo dei sottopercorsi dell''SDK dei Plugin: quali import si trovano dove, raggruppati per area'
title: Sottopercorsi dell'SDK dei Plugin
x-i18n:
    generated_at: "2026-07-16T14:52:25Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 937b616d7a95c250f7ff328ea3faa12143272722ffa638f50214fdd72ef5f225
    source_path: plugins/sdk-subpaths.md
    workflow: 16
---

Il Plugin SDK è esposto come un insieme di sottopercorsi pubblici specifici in
`openclaw/plugin-sdk/`. Questa pagina cataloga i sottopercorsi di uso comune raggruppati per
scopo. Tre file definiscono la superficie:

- `scripts/lib/plugin-sdk-entrypoints.json`: l'inventario mantenuto degli entrypoint
  compilati dalla build.
- `scripts/lib/plugin-sdk-private-local-only-subpaths.json`: sottopercorsi interni e di test
  locali al repository. Le esportazioni del pacchetto corrispondono all'inventario meno questo elenco.
- `src/plugin-sdk/entrypoints.ts`: metadati di classificazione per i
  sottopercorsi deprecati, gli helper riservati inclusi nel bundle, le facade incluse nel bundle supportate e
  le superfici pubbliche di proprietà dei plugin.

I manutentori verificano il conteggio delle esportazioni pubbliche con `pnpm plugin-sdk:surface` e
i sottopercorsi attivi degli helper riservati con `pnpm plugins:boundary-report:summary`;
le esportazioni inutilizzate degli helper riservati causano il fallimento del report CI anziché restare
nell'SDK pubblico come debito di compatibilità inattivo.

Per la guida alla creazione di plugin, consultare la [panoramica del Plugin SDK](/it/plugins/sdk-overview).

## Entry del plugin

| Sottopercorso                  | Esportazioni principali                                                                                                                                                                                  |
| ------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `plugin-sdk/plugin-entry`      | `definePluginEntry`                                                                                                                                                                                     |
| `plugin-sdk/core`              | `defineChannelPluginEntry`, `createChatChannelPlugin`, `createChannelPluginBase`, `defineSetupPluginEntry`, `buildChannelConfigSchema`, `buildJsonChannelConfigSchema`, `resolveTailscalePublishedHost` |
| `plugin-sdk/provider-entry`    | `defineSingleProviderPluginEntry`                                                                                                                                                                       |
| `plugin-sdk/migration`         | Helper per gli elementi del provider di migrazione, come `createMigrationItem`, costanti dei motivi, marcatori di stato degli elementi, helper di oscuramento e `summarizeMigrationItems`                                                  |
| `plugin-sdk/migration-runtime` | Helper per la migrazione in fase di esecuzione, come `copyMigrationFileItem`, `resolvePlannedMigrationTargets`, `withCachedMigrationConfigRuntime` e `writeMigrationReport`                                             |
| `plugin-sdk/health`            | Registrazione dei controlli di integrità di Doctor, rilevamento, riparazione, selezione, gravità e tipi di risultati per i consumer di integrità inclusi nel bundle                                                                                |
| `plugin-sdk/config-schema`     | Deprecato. Schema Zod `openclaw.json` radice (`OpenClawSchema`); definire invece schemi locali al plugin e convalidarli con `plugin-sdk/json-schema-runtime`                                                  |

### Helper deprecati per compatibilità e test

I sottopercorsi deprecati restano esportati per i plugin meno recenti, ma il nuovo codice dovrebbe usare i
sottopercorsi specifici dell'SDK riportati di seguito. L'elenco mantenuto è
`scripts/lib/plugin-sdk-deprecated-public-subpaths.json`; la CI rifiuta le
importazioni di produzione incluse nel bundle provenienti da tale elenco. I barrel generici, come `plugin-sdk/compat`,
`plugin-sdk/config-types`, `plugin-sdk/infra-runtime` e
`plugin-sdk/text-runtime`, servono esclusivamente per la compatibilità, mentre `plugin-sdk/zod` è una
riesportazione di compatibilità: importare `zod` direttamente da `zod`. Analogamente, i barrel di dominio
generici `plugin-sdk/agent-runtime`, `plugin-sdk/channel-lifecycle`,
`plugin-sdk/channel-runtime`, `plugin-sdk/cli-runtime`,
`plugin-sdk/conversation-runtime`, `plugin-sdk/hook-runtime`,
`plugin-sdk/media-runtime`, `plugin-sdk/plugin-runtime` e
`plugin-sdk/security-runtime` sono deprecati in favore di
sottopercorsi specifici.

I sottopercorsi degli helper di test di OpenClaw basati su Vitest sono esclusivamente locali al repository e non sono
più esportazioni del pacchetto: `agent-runtime-test-contracts`,
`channel-contract-testing`, `channel-target-testing`, `channel-test-helpers`,
`plugin-state-test-runtime`, `plugin-test-api`, `plugin-test-contracts`,
`plugin-test-runtime`, `provider-http-test-mocks`, `provider-test-contracts`,
`reply-payload-testing`, `sqlite-runtime-testing`, `test-env`, `test-fixtures`,
`test-node-mocks` e `testing`. Anche le superfici private degli helper inclusi nel bundle
`ssrf-runtime-internal` e `codex-native-task-runtime` sono esclusivamente locali al
repository.

### Sottopercorsi riservati degli helper dei plugin inclusi nel bundle

`plugin-sdk/codex-mcp-projection` è l'unico sottopercorso riservato: una superficie di
compatibilità di proprietà del plugin per il plugin Codex incluso nel bundle, non un'API generica dell'SDK.
Le importazioni tra plugin con proprietari diversi sono bloccate dai vincoli del contratto del pacchetto e
la CI non riesce quando un sottopercorso riservato non viene più importato.
`plugin-sdk/codex-native-task-runtime` è esclusivamente locale al repository e non è
un'esportazione del pacchetto.

`src/plugin-sdk/entrypoints.ts` tiene inoltre traccia delle facade incluse nel bundle supportate, ovvero entrypoint dell'SDK
supportati dal rispettivo plugin incluso nel bundle finché non saranno sostituiti da contratti
generici: `plugin-sdk/discord`, `plugin-sdk/lmstudio`, `plugin-sdk/lmstudio-runtime`,
`plugin-sdk/matrix`, `plugin-sdk/mattermost`,
`plugin-sdk/memory-core-engine-runtime`, `plugin-sdk/provider-zai-endpoint`,
`plugin-sdk/qa-runner-runtime`, `plugin-sdk/telegram-account`,
`plugin-sdk/tts-runtime` e `plugin-sdk/zalouser`. Molti di questi sono inoltre
deprecati per il nuovo codice; consultare le note relative a ciascuna riga riportate di seguito.

  <AccordionGroup>
  <Accordion title="Sottopercorsi dei canali">
    | Sottopercorso | Esportazioni principali |
    | --- | --- |
    | `plugin-sdk/channel-core` | `defineChannelPluginEntry`, `defineSetupPluginEntry`, `createChatChannelPlugin`, `createChannelPluginBase`, `createChannelConfigUiHints` |
    | `plugin-sdk/json-schema-runtime` | Helper di convalida JSON Schema con cache per gli schemi di proprietà dei plugin |
    | `plugin-sdk/channel-setup` | `createOptionalChannelSetupSurface`, `createOptionalChannelSetupAdapter`, `createOptionalChannelSetupWizard`, oltre a `DEFAULT_ACCOUNT_ID`, `createTopLevelChannelDmPolicy`, `setSetupChannelEnabled`, `splitSetupEntries` |
    | `plugin-sdk/setup` | Helper condivisi per la procedura guidata di configurazione, traduttore della configurazione, prompt per le liste di elementi consentiti, generatori dello stato di configurazione |
    | `plugin-sdk/setup-runtime` | `createSetupTranslator`, `createPatchedAccountSetupAdapter`, `createEnvPatchedAccountSetupAdapter`, `createSetupInputPresenceValidator`, `noteChannelLookupFailure`, `noteChannelLookupSummary`, `promptResolvedAllowFrom`, `splitSetupEntries`, `createAllowlistSetupWizardProxy`, `createDelegatedSetupWizardProxy` |
    | `plugin-sdk/setup-adapter-runtime` | Alias di compatibilità deprecato; usare `plugin-sdk/setup-runtime` |
    | `plugin-sdk/setup-tools` | `formatCliCommand`, `detectBinary`, `extractArchive`, `resolveBrewExecutable`, `formatDocsLink`, `CONFIG_DIR` |
    | `plugin-sdk/account-core` | Helper per la configurazione multi-account e il controllo delle azioni, helper per il fallback sull'account predefinito |
    | `plugin-sdk/account-id` | `DEFAULT_ACCOUNT_ID`, helper per la normalizzazione degli ID account |
    | `plugin-sdk/account-resolution` | Helper per la ricerca degli account e il fallback predefinito |
    | `plugin-sdk/account-helpers` | Helper mirati per l'elenco degli account e le azioni sugli account |
    | `plugin-sdk/access-groups` | Helper per l'analisi delle liste di gruppi di accesso consentiti e per la diagnostica dei gruppi con dati oscurati |
    | `plugin-sdk/channel-pairing` | `createChannelPairingController` |
    | `plugin-sdk/channel-reply-pipeline` | Facciata di compatibilità deprecata. Usare `plugin-sdk/channel-outbound`. |
    | `plugin-sdk/channel-config-helpers` | `createHybridChannelConfigAdapter`, `resolveChannelDmAccess`, `resolveChannelDmAllowFrom`, `resolveChannelDmPolicy`, `normalizeChannelDmPolicy`, `normalizeLegacyDmAliases` |
    | `plugin-sdk/channel-config-schema` | Primitive condivise per gli schemi di configurazione dei canali, oltre a Zod e generatori diretti JSON/TypeBox |
    | `plugin-sdk/bundled-channel-config-schema` | Schemi di configurazione dei canali OpenClaw integrati, riservati ai plugin integrati e mantenuti |
    | `plugin-sdk/chat-channel-ids` | `BUNDLED_CHAT_CHANNEL_IDS`, `BUNDLED_CHAT_CHANNEL_ENVELOPE_PREFIXES`, `ChatChannelId`. ID canonici dei canali di chat integrati/ufficiali, oltre a etichette e alias del formattatore per i plugin che devono riconoscere il testo con prefisso dell'envelope senza codificare direttamente una propria tabella. |
    | `plugin-sdk/channel-config-schema-legacy` | Alias di compatibilità deprecato per gli schemi di configurazione dei canali integrati |
    | `plugin-sdk/telegram-command-config` | Normalizzazione deprecata dei nomi e delle descrizioni dei comandi Telegram e controlli di duplicati/conflitti; nel nuovo codice dei plugin, usare la gestione locale al plugin della configurazione dei comandi |
    | `plugin-sdk/command-gating` | Helper mirati per il controllo dell'autorizzazione dei comandi |
    | `plugin-sdk/channel-policy` | `resolveChannelGroupRequireMention` |
    | `plugin-sdk/channel-ingress-runtime` | Risolutore runtime sperimentale di alto livello per l'ingresso dei canali e generatori dei dati di routing per i percorsi di ricezione dei canali migrati. Preferirlo all'assemblaggio, in ciascun plugin, delle liste effettive di elementi consentiti, delle liste di comandi consentiti e delle proiezioni legacy. Vedere [API di ingresso dei canali](/it/plugins/sdk-channel-ingress). |
    | `plugin-sdk/channel-lifecycle` | Facciata di compatibilità deprecata. Usare `plugin-sdk/channel-outbound`. |
    | `plugin-sdk/channel-outbound` | Contratti per il ciclo di vita dei messaggi, oltre a opzioni della pipeline di risposta, ricevute, anteprima in tempo reale/streaming, helper per il ciclo di vita, identità in uscita, pianificazione dei payload, invii durevoli e helper per il contesto di invio dei messaggi. Vedere [API di uscita dei canali](/it/plugins/sdk-channel-outbound). |
    | `plugin-sdk/channel-message` | Alias di compatibilità deprecato per `plugin-sdk/channel-outbound`. |
    | `plugin-sdk/channel-message-runtime` | Alias di compatibilità deprecato per `plugin-sdk/channel-outbound`. |
    | `plugin-sdk/inbound-envelope` | Helper condivisi per la generazione di route in ingresso ed envelope |
    | `plugin-sdk/inbound-reply-dispatch` | Facciata di compatibilità deprecata. Usare `plugin-sdk/channel-inbound` per gli esecutori in ingresso e i predicati di invio e `plugin-sdk/channel-outbound` per gli helper di consegna dei messaggi. |
    | `plugin-sdk/messaging-targets` | Alias deprecato per l'analisi delle destinazioni; usare `plugin-sdk/channel-targets` |
    | `plugin-sdk/outbound-media` | Helper condivisi per il caricamento dei contenuti multimediali in uscita e per lo stato dei contenuti multimediali ospitati |
    | `plugin-sdk/outbound-send-deps` | Facciata di compatibilità deprecata. Usare `plugin-sdk/channel-outbound`. |
    | `plugin-sdk/outbound-runtime` | Facciata di compatibilità deprecata. Usare `plugin-sdk/channel-outbound`. |
    | `plugin-sdk/poll-runtime` | Helper mirati per la normalizzazione dei sondaggi |
    | `plugin-sdk/thread-bindings-runtime` | Ciclo di vita dell'associazione dei thread e helper per gli adattatori |
    | `plugin-sdk/agent-media-payload` | Radici e caricatori dei payload multimediali degli agenti |
    | `plugin-sdk/conversation-runtime` | Barrel ampio deprecato per l'associazione di conversazioni/thread, l'abbinamento e gli helper per le associazioni configurate; preferire sottopercorsi mirati per le associazioni, come `plugin-sdk/thread-bindings-runtime` e `plugin-sdk/session-binding-runtime` |
    | `plugin-sdk/runtime-group-policy` | Helper per la risoluzione runtime dei criteri di gruppo |
    | `plugin-sdk/channel-status` | Helper condivisi per istantanee e riepiloghi dello stato dei canali |
    | `plugin-sdk/channel-config-primitives` | Primitive mirate per gli schemi di configurazione dei canali |
    | `plugin-sdk/channel-config-writes` | Helper per l'autorizzazione alla scrittura della configurazione dei canali |
    | `plugin-sdk/channel-plugin-common` | Esportazioni condivise del preambolo dei plugin dei canali |
    | `plugin-sdk/allowlist-config-edit` | Helper per la modifica e la lettura della configurazione delle liste di elementi consentiti |
    | `plugin-sdk/group-access` | Helper deprecati per le decisioni sull'accesso ai gruppi; usare `resolveChannelMessageIngress` da `plugin-sdk/channel-ingress-runtime` |
    | `plugin-sdk/direct-dm`, `plugin-sdk/direct-dm-access` | Facciate di compatibilità deprecate. Usare `plugin-sdk/channel-inbound`. |
    | `plugin-sdk/direct-dm-guard-policy` | Helper mirati per i criteri di controllo pre-crittografia dei messaggi diretti |
    | `plugin-sdk/discord` | Facciata di compatibilità Discord deprecata per `@openclaw/discord@2026.3.13` pubblicato e per la compatibilità monitorata dal proprietario; i nuovi plugin devono usare i sottopercorsi generici dell'SDK dei canali |
    | `plugin-sdk/telegram-account` | Facciata di compatibilità deprecata per la risoluzione degli account Telegram, destinata alla compatibilità monitorata dal proprietario; i nuovi plugin devono usare gli helper runtime iniettati o i sottopercorsi generici dell'SDK dei canali |
    | `plugin-sdk/zalouser` | Facciata di compatibilità Zalo Personal deprecata per i pacchetti Lark/Zalo pubblicati che importano ancora l'autorizzazione dei comandi del mittente; i nuovi plugin devono usare i sottopercorsi generici dell'SDK dei canali |
    | `plugin-sdk/interactive-runtime` | Helper per la presentazione semantica e la consegna dei messaggi e per le risposte interattive legacy. Vedere [Presentazione dei messaggi](/it/plugins/message-presentation) |
    | `plugin-sdk/channel-inbound` | Helper condivisi in ingresso per la classificazione degli eventi, la creazione del contesto, la formattazione, le radici, il debounce, la corrispondenza delle menzioni, i criteri per le menzioni e la registrazione degli eventi in ingresso |
    | `plugin-sdk/channel-inbound-debounce` | Helper mirati per il debounce in ingresso |
    | `plugin-sdk/channel-mention-gating` | Helper mirati per i criteri delle menzioni, gli indicatori di menzione e il testo delle menzioni, senza la superficie runtime in ingresso più ampia |
    | `plugin-sdk/channel-envelope`, `plugin-sdk/channel-inbound-roots`, `plugin-sdk/channel-location`, `plugin-sdk/channel-logging` | Facciate di compatibilità deprecate. Usare `plugin-sdk/channel-inbound` o `plugin-sdk/channel-outbound`. |
    | `plugin-sdk/channel-pairing-paths` | Facciata di compatibilità deprecata. Usare `plugin-sdk/channel-pairing`. |
    | `plugin-sdk/channel-reply-options-runtime` | Facciata di compatibilità deprecata. Usare `plugin-sdk/channel-outbound`. |
    | `plugin-sdk/channel-streaming` | Facciata di compatibilità deprecata. Usare `plugin-sdk/channel-outbound`. |
    | `plugin-sdk/channel-send-result` | Tipi dei risultati delle risposte |
    | `plugin-sdk/channel-actions` | Helper per le azioni sui messaggi dei canali, oltre a helper deprecati per gli schemi nativi mantenuti per la compatibilità dei plugin |
    | `plugin-sdk/channel-route` | Normalizzazione condivisa delle route, risoluzione delle destinazioni basata su parser, conversione degli ID dei thread in stringhe, chiavi di route deduplicate/compatte, tipi delle destinazioni analizzate e helper per il confronto di route/destinazioni |
    | `plugin-sdk/channel-targets` | Helper per l'analisi delle destinazioni; i chiamanti che confrontano le route devono usare `plugin-sdk/channel-route` |
    | `plugin-sdk/channel-contract` | Tipi di contratto dei canali |
    | `plugin-sdk/channel-feedback` | Collegamento di feedback/reazioni |
  </Accordion>

Le famiglie di helper per i canali deprecate restano disponibili solo per la
compatibilità con i plugin pubblicati. Il piano di rimozione è il seguente:
mantenerle per l'intera finestra di migrazione dei plugin esterni, mantenere i
plugin del repository/inclusi su `channel-inbound` e
`channel-outbound`, quindi rimuovere i sottopercorsi di compatibilità nella
prossima importante revisione dell'SDK. Ciò si applica alle precedenti famiglie
di messaggistica/runtime dei canali, streaming dei canali, accesso diretto ai
messaggi privati, helper frammentari per i messaggi in ingresso, opzioni di
risposta e percorsi di associazione.

  <Accordion title="Sottopercorsi dei provider">
    | Sottopercorso | Esportazioni principali |
    | --- | --- |
    | `plugin-sdk/provider-entry` | `defineSingleProviderPluginEntry` |
    | `plugin-sdk/lmstudio` | Facciata del provider LM Studio supportata per configurazione, rilevamento del catalogo e preparazione dei modelli in fase di esecuzione |
    | `plugin-sdk/lmstudio-runtime` | Facciata runtime LM Studio supportata per impostazioni predefinite del server locale, rilevamento dei modelli, intestazioni delle richieste e helper per i modelli caricati |
    | `plugin-sdk/provider-setup` | Helper selezionati per la configurazione di provider locali/self-hosted |
    | `plugin-sdk/self-hosted-provider-setup` | Helper deprecati per la configurazione self-hosted compatibile con OpenAI; usare `plugin-sdk/provider-setup` o gli helper di configurazione di proprietà del plugin |
    | `plugin-sdk/cli-backend` | Impostazioni predefinite del backend CLI + costanti del watchdog |
    | `plugin-sdk/provider-auth-runtime` | Helper runtime per l'autenticazione dei provider: flusso OAuth con loopback, scambio di token, persistenza dell'autenticazione e risoluzione della chiave API |
    | `plugin-sdk/provider-oauth-runtime` | Tipi generici di callback OAuth dei provider, rendering della pagina di callback, helper PKCE/stato, analisi dell'input di autorizzazione, helper per la scadenza dei token e helper di interruzione |
    | `plugin-sdk/provider-auth-api-key` | Helper per l'onboarding tramite chiave API e la scrittura dei profili, come `upsertApiKeyProfile` |
    | `plugin-sdk/provider-auth-result` | Generatore standard del risultato di autenticazione OAuth |
    | `plugin-sdk/provider-env-vars` | Helper per la ricerca delle variabili d'ambiente di autenticazione dei provider |
    | `plugin-sdk/provider-auth` | `createProviderApiKeyAuthMethod`, `ensureApiKeyFromOptionEnvOrPrompt`, `upsertAuthProfile`, `upsertApiKeyProfile`, `writeOAuthCredentials`, helper per l'importazione dell'autenticazione OpenAI Codex, esportazione di compatibilità deprecata `resolveOpenClawAgentDir` |
    | `plugin-sdk/provider-model-shared` | `ProviderReplayFamily`, `buildProviderReplayFamilyHooks`, `normalizeModelCompat`, generatori condivisi di criteri di riproduzione, helper per gli endpoint dei provider e helper condivisi per la normalizzazione degli ID dei modelli |
    | `plugin-sdk/provider-catalog-live-runtime` | Helper per il catalogo dei modelli dei provider live, destinati al rilevamento protetto in stile `/models`: `buildLiveModelProviderConfig`, `fetchLiveProviderModelRows`, `getCachedLiveProviderModelRows`, `fetchLiveProviderModelIds`, `LiveModelCatalogHttpError`, `clearLiveCatalogCacheForTests`, filtraggio degli ID dei modelli, cache TTL e fallback statico |
    | `plugin-sdk/provider-catalog-runtime` | Hook runtime per l'integrazione del catalogo dei provider e punti di integrazione del registro dei provider dei plugin per i test dei contratti |
    | `plugin-sdk/provider-catalog-shared` | `findCatalogTemplate`, `buildSingleProviderApiKeyCatalog`, `buildManifestModelProviderConfig`, `supportsNativeStreamingUsageCompat`, `applyProviderNativeStreamingUsageCompat` |
    | `plugin-sdk/provider-http` | Helper generici per le funzionalità HTTP/endpoint dei provider, errori HTTP dei provider e helper per moduli multipart di trascrizione audio |
    | `plugin-sdk/provider-web-fetch-contract` | Helper per il contratto circoscritto di configurazione/selezione del recupero web, come `enablePluginInConfig` e `WebFetchProviderPlugin` |
    | `plugin-sdk/provider-web-fetch` | Helper per registrazione/cache dei provider di recupero web |
    | `plugin-sdk/provider-web-search-config-contract` | Helper circoscritti per configurazione/credenziali della ricerca web destinati ai provider che non richiedono il collegamento per l'abilitazione del plugin |
    | `plugin-sdk/provider-web-search-contract` | Helper per il contratto circoscritto di configurazione/credenziali della ricerca web, come `createWebSearchProviderContractFields`, `enablePluginInConfig`, `resolveProviderWebSearchPluginConfig` e setter/getter delle credenziali con ambito definito |
    | `plugin-sdk/provider-web-search` | Helper per registrazione/cache/runtime dei provider di ricerca web |
    | `plugin-sdk/embedding-providers` | Tipi generali dei provider di embedding e helper di lettura, inclusi `EmbeddingProviderAdapter`, `getEmbeddingProvider(...)` e `listEmbeddingProviders(...)`; i plugin registrano i provider tramite `api.registerEmbeddingProvider(...)` affinché venga applicata la proprietà del manifest |
    | `plugin-sdk/provider-tools` | `ProviderToolCompatFamily`, `buildProviderToolCompatFamilyHooks` e pulizia degli schemi + diagnostica per DeepSeek/Gemini/OpenAI |
    | `plugin-sdk/provider-usage` | Tipi di snapshot dell'utilizzo dei provider, helper condivisi per il recupero dell'utilizzo e funzioni di recupero dei provider come `fetchClaudeUsage` |
    | `plugin-sdk/provider-stream` | `ProviderStreamFamily`, `buildProviderStreamFamilyHooks`, `composeProviderStreamWrappers`, tipi di wrapper dei flussi, compatibilità delle chiamate agli strumenti in testo normale e helper condivisi per i wrapper Anthropic/Google/Kilocode/MiniMax/Moonshot/OpenAI/OpenRouter/Z.AI |
    | `plugin-sdk/provider-stream-shared` | Helper pubblici condivisi per i wrapper dei flussi dei provider, inclusi `composeProviderStreamWrappers`, `createOpenAICompatibleCompletionsThinkingOffWrapper`, `createPlainTextToolCallCompatWrapper`, `createPayloadPatchStreamWrapper`, `createToolStreamWrapper`, `normalizeOpenAICompatibleReasoningPayload`, `setQwenChatTemplateThinking` e utilità per flussi compatibili con Anthropic/DeepSeek/OpenAI |
    | `plugin-sdk/provider-transport-runtime` | Helper per il trasporto nativo dei provider, come recupero protetto, estrazione del testo dai risultati degli strumenti, trasformazioni dei messaggi di trasporto e flussi scrivibili di eventi di trasporto |
    | `plugin-sdk/provider-onboard` | Helper per l'applicazione di patch alla configurazione di onboarding |
    | `plugin-sdk/global-singleton` | Helper per singleton/mappe/cache locali al processo |
    | `plugin-sdk/group-activation` | Helper circoscritti per la modalità di attivazione dei gruppi e l'analisi dei comandi |
  </Accordion>

Gli snapshot dell'utilizzo dei provider normalmente riportano una o più `windows` di quota, ciascuna con
un'etichetta, la percentuale utilizzata e un'ora di reimpostazione facoltativa. I provider che espongono il saldo o
il testo sullo stato dell'account anziché finestre di quota reimpostabili devono restituire
`summary` con un array `windows` vuoto, anziché inventare percentuali.
OpenClaw visualizza tale testo di riepilogo nell'output di stato; usare `error` solo quando
l'endpoint di utilizzo non è riuscito o non ha restituito dati di utilizzo utilizzabili.

  <Accordion title="Sottopercorsi di autenticazione e sicurezza">
    | Sottopercorso | Esportazioni principali |
    | --- | --- |
    | `plugin-sdk/command-auth` | Superficie generale deprecata per l'autorizzazione dei comandi (`resolveControlCommandGate`, helper del registro dei comandi, inclusa la formattazione dinamica del menu degli argomenti, helper per l'autorizzazione dei mittenti); usare l'autorizzazione all'ingresso/runtime del canale o gli helper per lo stato dei comandi |
    | `plugin-sdk/command-status` | Generatori di messaggi di comando/aiuto, come `buildCommandsMessagePaginated` e `buildHelpMessage` |
    | `plugin-sdk/approval-auth-runtime` | Helper per la risoluzione degli approvatori e l'autenticazione delle azioni nella stessa chat |
    | `plugin-sdk/approval-client-runtime` | Helper per profili/filtri di approvazione dell'esecuzione nativa |
    | `plugin-sdk/approval-delivery-runtime` | Adattatori per funzionalità/consegna dell'approvazione nativa |
    | `plugin-sdk/approval-gateway-runtime` | Risolutore condiviso del Gateway di approvazione |
    | `plugin-sdk/approval-reference-runtime` | Helper deterministico per localizzatori durevoli destinato ai callback di approvazione limitati dal trasporto |
    | `plugin-sdk/approval-handler-adapter-runtime` | Helper leggeri per il caricamento degli adattatori di approvazione nativa destinati agli entrypoint di canale critici |
    | `plugin-sdk/approval-handler-runtime` | Helper runtime più generali per i gestori di approvazione; preferire i punti di integrazione più circoscritti per adattatori/Gateway quando sono sufficienti |
    | `plugin-sdk/approval-native-runtime` | Helper per destinazione dell'approvazione nativa, associazione dell'account, controllo delle route, fallback di inoltro e soppressione locale del prompt di esecuzione nativa |
    | `plugin-sdk/approval-reaction-runtime` | Associazioni hardcoded delle reazioni di approvazione, payload dei prompt di reazione, archivi delle destinazioni delle reazioni, helper per il testo dei suggerimenti sulle reazioni ed esportazione di compatibilità per la soppressione locale del prompt di esecuzione nativa |
    | `plugin-sdk/approval-reply-runtime` | Helper per i payload delle risposte di approvazione di esecuzione/plugin |
    | `plugin-sdk/approval-runtime` | Helper per i payload di approvazione di esecuzione/plugin, generatori delle funzionalità di approvazione, helper per autenticazione/profili di approvazione, helper per routing/runtime dell'approvazione nativa e helper per la visualizzazione strutturata delle approvazioni, come `formatApprovalDisplayPath` |
    | `plugin-sdk/reply-dedupe` | Helper circoscritti deprecati per la reimpostazione della deduplicazione delle risposte in entrata |
    | `plugin-sdk/command-auth-native` | Autenticazione dei comandi nativi, formattazione dinamica del menu degli argomenti e helper nativi per la destinazione delle sessioni |
    | `plugin-sdk/command-detection` | Helper condivisi per il rilevamento dei comandi |
    | `plugin-sdk/command-primitives-runtime` | Predicati leggeri per il testo dei comandi destinati ai percorsi di canale critici |
    | `plugin-sdk/command-surface` | Helper per la normalizzazione del corpo dei comandi e la superficie dei comandi |
    | `plugin-sdk/allow-from` | `formatAllowFromLowercase` |
    | `plugin-sdk/provider-auth-login-flow-runtime` | Helper per il caricamento differito del flusso di accesso all'autenticazione del provider, destinati all'associazione tramite codice dispositivo nei canali privati e nell'interfaccia web |
    | `plugin-sdk/channel-secret-runtime` | Superficie generale deprecata del contratto dei segreti (`collectSimpleChannelFieldAssignments`, `getChannelSurface`, `pushAssignment`, tipi di destinazione dei segreti); preferire i sottopercorsi specifici riportati di seguito |
    | `plugin-sdk/channel-secret-basic-runtime` | Esportazioni circoscritte del contratto dei segreti e generatori del registro delle destinazioni per le superfici dei segreti di canali/plugin non TTS |
    | `plugin-sdk/channel-secret-tts-runtime` | Helper circoscritti per l'assegnazione dei segreti TTS dei canali annidati |
    | `plugin-sdk/secret-ref-runtime` | Tipizzazione, risoluzione e ricerca del percorso della destinazione del piano circoscritte per SecretRef, destinate all'analisi del contratto dei segreti/della configurazione |
    | `plugin-sdk/secret-provider-integration` | Contratti di manifest e preimpostazioni, solo per tipi, per l'integrazione dei provider SecretRef destinati ai plugin che pubblicano preimpostazioni di provider di segreti esterni |
    | `plugin-sdk/security-runtime` | Barrel generale deprecato per attendibilità, controllo dei DM, helper per file/percorsi limitati alla radice, incluse scritture di sola creazione, sostituzione atomica sincrona/asincrona dei file, scritture temporanee adiacenti, fallback per spostamenti tra dispositivi, helper per archivi di file privati, protezioni per i genitori dei collegamenti simbolici, contenuti esterni, oscuramento del testo sensibile, confronto dei segreti a tempo costante e helper per la raccolta dei segreti; preferire sottopercorsi specifici per sicurezza/SSRF/segreti |
    | `plugin-sdk/ssrf-policy` | Helper per l'elenco consentito degli host e i criteri SSRF per reti private |
    | `plugin-sdk/ssrf-dispatcher` | Helper circoscritti per dispatcher vincolati senza la superficie runtime infrastrutturale generale |
    | `plugin-sdk/ssrf-runtime` | Helper per dispatcher vincolati, recupero protetto da SSRF, errori SSRF e criteri SSRF |
    | `plugin-sdk/secret-input` | Helper per l'analisi dell'input dei segreti |
    | `plugin-sdk/webhook-ingress` | Helper per richieste/destinazioni Webhook e coercizione di websocket/corpi non elaborati |
    | `plugin-sdk/webhook-request-guards` | Helper per dimensioni/timeout del corpo delle richieste e `runDetachedWebhookWork` per l'elaborazione monitorata successiva all'ack |
  </Accordion>

  <Accordion title="Sottopercorsi di runtime e archiviazione">
    | Sottopercorso | Esportazioni principali |
    | --- | --- |
    | `plugin-sdk/runtime` | Helper per runtime, registrazione, backup, avvisi sui percorsi di installazione dei plugin e processi |
    | `plugin-sdk/runtime-env` | Helper mirati per ambiente di runtime, logger, timeout, nuovi tentativi e backoff |
    | `plugin-sdk/browser-config` | Facciata supportata per la configurazione del browser, destinata a profili e valori predefiniti normalizzati, analisi degli URL CDP e helper per l'autenticazione del controllo del browser |
    | `plugin-sdk/agent-harness-task-runtime` | Helper generici per il ciclo di vita delle attività e la consegna del completamento per agenti basati su harness che usano un ambito attività emesso dall'host |
    | `plugin-sdk/codex-mcp-projection` | Helper Codex integrato riservato per proiettare la configurazione dei server MCP dell'utente nella configurazione dei thread Codex; non destinato ai plugin di terze parti |
    | `plugin-sdk/codex-native-task-runtime` | Helper Codex integrato locale al repository per il collegamento nativo del mirror delle attività e del runtime; non è un'esportazione del pacchetto |
    | `plugin-sdk/channel-runtime-context` | Helper generici per registrare e cercare il contesto di runtime dei canali |
    | `plugin-sdk/matrix` | Facciata di compatibilità Matrix deprecata per i pacchetti di canali di terze parti meno recenti; i nuovi plugin devono importare direttamente `plugin-sdk/run-command` |
    | `plugin-sdk/mattermost` | Facciata di compatibilità Mattermost deprecata per i pacchetti di canali di terze parti meno recenti; i nuovi plugin devono importare direttamente sottopercorsi generici dell'SDK |
    | `plugin-sdk/runtime-store` | `createPluginRuntimeStore` |
    | `plugin-sdk/plugin-runtime` | Barrel generale deprecato per helper di comandi, hook, HTTP e interazione dei plugin; preferire sottopercorsi mirati del runtime dei plugin |
    | `plugin-sdk/hook-runtime` | Barrel generale deprecato per helper della pipeline di webhook e hook interni; preferire sottopercorsi mirati del runtime di hook e plugin |
    | `plugin-sdk/lazy-runtime` | Helper per l'importazione e il binding differiti del runtime, come `createLazyRuntimeModule`, `createLazyRuntimeMethod` e `createLazyRuntimeSurface` |
    | `plugin-sdk/process-runtime` | Helper per l'esecuzione dei processi |
    | `plugin-sdk/node-host` | Helper per la risoluzione degli eseguibili sull'host Node e la ripresa PTY |
    | `plugin-sdk/cli-runtime` | Barrel generale deprecato per formattazione della CLI, attesa, versione, invocazione degli argomenti e helper differiti dei gruppi di comandi; preferire sottopercorsi mirati di CLI e runtime |
    | `plugin-sdk/qa-runner-runtime` | Facciata supportata che espone gli scenari di QA dei plugin tramite la superficie dei comandi della CLI |
    | `plugin-sdk/tts-runtime` | Facciata supportata per gli schemi di configurazione e gli helper di runtime della sintesi vocale |
    | `plugin-sdk/gateway-method-runtime` | Helper riservato per l'inoltro dei metodi del Gateway per le route HTTP dei plugin che dichiarano `contracts.gatewayMethodDispatch: ["authenticated-request"]` |
    | `plugin-sdk/gateway-runtime` | Client del Gateway, helper di avvio del client pronto per il ciclo degli eventi, RPC della CLI del Gateway, errori del protocollo del Gateway, risoluzione dell'host LAN pubblicizzato e helper per le patch dello stato dei canali |
    | `plugin-sdk/config-contracts` | Superficie di configurazione mirata di soli tipi per forme di configurazione dei plugin come `OpenClawConfig` e tipi di configurazione di canali e provider |
    | `plugin-sdk/plugin-config-runtime` | Helper di runtime per la configurazione dei plugin, come `mergeDeep`, `requireRuntimeConfig`, `resolvePluginConfigObject` e `resolveLivePluginConfigObject` |
    | `plugin-sdk/config-mutation` | Helper per la modifica transazionale della configurazione, come `mutateConfigFile`, `replaceConfigFile` e `logConfigUpdated` |
    | `plugin-sdk/message-tool-delivery-hints` | Stringhe condivise di suggerimento per i metadati di consegna degli strumenti di messaggistica |
    | `plugin-sdk/runtime-config-snapshot` | Helper per l'istantanea della configurazione del processo corrente, come `getRuntimeConfig`, `getRuntimeConfigSnapshot` e setter delle istantanee di test |
    | `plugin-sdk/text-autolink-runtime` | Rilevamento dei collegamenti automatici ai riferimenti ai file senza il barrel generale del testo |
    | `plugin-sdk/reply-runtime` | Helper di runtime condivisi per messaggi in entrata e risposte, suddivisione in blocchi, inoltro, Heartbeat e pianificatore delle risposte |
    | `plugin-sdk/reply-dispatch-runtime` | Helper mirati per inoltro e finalizzazione delle risposte e per le etichette delle conversazioni |
    | `plugin-sdk/reply-history` | Helper condivisi per la cronologia delle risposte in una breve finestra. Il nuovo codice dei turni di messaggio deve usare `createChannelHistoryWindow`; gli helper di basso livello per le mappe restano esclusivamente esportazioni di compatibilità deprecate |
    | `plugin-sdk/reply-reference` | `createReplyReferencePlanner` |
    | `plugin-sdk/reply-chunking` | Helper mirati per la suddivisione in blocchi di testo e Markdown |
    | `plugin-sdk/session-store-runtime` | Helper per il flusso di lavoro delle sessioni (`getSessionEntry`, `listSessionEntries`, `patchSessionEntry`, `upsertSessionEntry`), helper per riparazione e ciclo di vita (`deleteSessionEntry`, `cleanupSessionLifecycleArtifacts`, `resolveSessionStoreBackupPaths`), helper per i marcatori dei valori transitori `sessionFile`, letture limitate del testo recente delle trascrizioni di utente e assistente in base all'identità della sessione, helper per il percorso dell'archivio delle sessioni e la chiave di sessione e letture della data di aggiornamento, senza importazioni generali per scrittura o manutenzione della configurazione |
    | `plugin-sdk/session-transcript-runtime` | Identità delle trascrizioni, helper con ambito per destinazione, lettura e scrittura, proiezione delle voci dei messaggi visibili, pubblicazione degli aggiornamenti, blocchi di scrittura e chiavi dei riscontri nella memoria delle trascrizioni |
    | `plugin-sdk/sqlite-runtime` | Helper SQLite mirati per schema, percorso e transazioni degli agenti per il runtime proprietario, senza controlli del ciclo di vita del database |
    | `plugin-sdk/cron-store-runtime` | Helper per percorso, caricamento e salvataggio dell'archivio Cron |
    | `plugin-sdk/state-paths` | Helper per i percorsi delle directory di stato e OAuth |
    | `plugin-sdk/plugin-state-runtime` | Tipi di stato con chiave SQLite nei processi sidecar dei plugin, più helper centralizzati per i pragma di connessione, la manutenzione WAL verificata e le migrazioni atomiche dello schema STRICT per i database di proprietà dei plugin |
    | `plugin-sdk/routing` | Helper per il binding di route, chiavi di sessione e account, come `resolveAgentRoute`, `buildAgentSessionKey` e `resolveDefaultAgentBoundAccountId` |
    | `plugin-sdk/status-helpers` | Helper condivisi per il riepilogo dello stato di canali e account, valori predefiniti dello stato di runtime e metadati dei problemi |
    | `plugin-sdk/target-resolver-runtime` | Helper condivisi per la risoluzione delle destinazioni |
    | `plugin-sdk/string-normalization-runtime` | Helper per la normalizzazione di slug e stringhe |
    | `plugin-sdk/request-url` | Estrazione degli URL in formato stringa da input simili a fetch o request |
    | `plugin-sdk/run-command` | Esecutore temporizzato di comandi con risultati stdout/stderr normalizzati |
    | `plugin-sdk/param-readers` | Lettori comuni dei parametri di strumenti e CLI |
    | `plugin-sdk/tool-plugin` | Definizione di un semplice plugin tipizzato per gli strumenti degli agenti ed esposizione di metadati statici per la generazione del manifest |
    | `plugin-sdk/tool-payload` | Estrazione dei payload normalizzati dagli oggetti risultato degli strumenti |
    | `plugin-sdk/tool-send` | Estrazione dei campi canonici della destinazione di invio dagli argomenti degli strumenti |
    | `plugin-sdk/sandbox` | Tipi di backend sandbox e helper per comandi SSH/OpenShell, inclusa la verifica preliminare con arresto immediato dei comandi di esecuzione |
    | `plugin-sdk/temp-path` | Helper condivisi per i percorsi dei download temporanei e spazi di lavoro temporanei privati e sicuri |
    | `plugin-sdk/logging-core` | Helper per logger di sottosistema e oscuramento |
    | `plugin-sdk/markdown-table-runtime` | Helper per modalità e conversione delle tabelle Markdown |
    | `plugin-sdk/model-session-runtime` | Helper per la sostituzione di modello e sessione, come `applyModelOverrideToSessionEntry` e `resolveAgentMaxConcurrent` |
    | `plugin-sdk/talk-config-runtime` | Helper per la risoluzione della configurazione del provider di conversazione |
    | `plugin-sdk/json-store` | Piccoli helper per lettura e scrittura dello stato JSON |
    | `plugin-sdk/json-unsafe-integers` | Helper di analisi JSON che preservano come stringhe i valori letterali interi non sicuri |
    | `plugin-sdk/file-lock` | Helper rientranti per il blocco dei file |
    | `plugin-sdk/persistent-dedupe` | Helper per la cache di deduplicazione basata su disco |
    | `plugin-sdk/acp-runtime` | Helper per runtime, sessioni e inoltro delle risposte ACP |
    | `plugin-sdk/acp-runtime-backend` | Helper leggeri per la registrazione del backend ACP e l'inoltro delle risposte per i plugin caricati all'avvio |
    | `plugin-sdk/acp-binding-resolve-runtime` | Risoluzione in sola lettura dei binding ACP senza importazioni per l'avvio del ciclo di vita |
    | `plugin-sdk/agent-config-primitives` | Primitive deprecate dello schema di configurazione del runtime degli agenti; importare le primitive dello schema da una superficie mantenuta di proprietà del plugin |
    | `plugin-sdk/boolean-param` | Lettore permissivo di parametri booleani |
    | `plugin-sdk/dangerous-name-runtime` | Helper per la risoluzione delle corrispondenze con nomi pericolosi |
    | `plugin-sdk/device-bootstrap` | Helper per il bootstrap dei dispositivi e i token di associazione, incluso `BOOTSTRAP_HANDOFF_OPERATOR_SCOPES` |
    | `plugin-sdk/extension-shared` | Primitive helper condivise per canali passivi, stato e proxy ambientale |
    | `plugin-sdk/models-provider-runtime` | Helper per le risposte di comandi e provider `/models` |
    | `plugin-sdk/skill-commands-runtime` | Helper per l'elenco dei comandi delle Skill |
    | `plugin-sdk/native-command-registry` | Helper per il registro, la compilazione e la serializzazione dei comandi nativi |
    | `plugin-sdk/agent-harness` | Superficie sperimentale per plugin attendibili destinata agli harness di basso livello degli agenti: tipi di harness, helper per guidare e interrompere le esecuzioni attive, helper del bridge degli strumenti OpenClaw, helper per i criteri degli strumenti del piano di runtime, classificazione dei risultati del terminale, helper per formattazione e dettagli dell'avanzamento degli strumenti e utilità per i risultati dei tentativi |
    | `plugin-sdk/provider-zai-endpoint` | Facciata deprecata di proprietà del provider Z.AI per il rilevamento degli endpoint; usare l'API pubblica del plugin Z.AI |
    | `plugin-sdk/async-lock-runtime` | Helper di blocco asincrono locale al processo per piccoli file di stato del runtime |
    | `plugin-sdk/channel-activity-runtime` | Helper di telemetria dell'attività dei canali |
    | `plugin-sdk/concurrency-runtime` | Helper per la concorrenza limitata delle attività asincrone |
    | `plugin-sdk/dedupe-runtime` | Helper per cache di deduplicazione in memoria e con persistenza |
    | `plugin-sdk/delivery-queue-runtime` | Helper per lo svuotamento delle consegne in uscita in sospeso |
    | `plugin-sdk/file-access-runtime` | Helper sicuri per i percorsi di file locali e sorgenti multimediali |
    | `plugin-sdk/heartbeat-runtime` | Helper per risveglio, eventi e visibilità di Heartbeat |
    | `plugin-sdk/expect-runtime` | Helper di asserzione dei valori obbligatori per invarianti di runtime dimostrabili |
    | `plugin-sdk/number-runtime` | Helper per la coercizione numerica |
    | `plugin-sdk/secure-random-runtime` | Helper sicuri per token e UUID |
    | `plugin-sdk/system-event-runtime` | Helper per la coda degli eventi di sistema |
    | `plugin-sdk/transport-ready-runtime` | Helper di attesa della disponibilità del trasporto |
    | `plugin-sdk/exec-approvals-runtime` | Helper per i file dei criteri di approvazione dell'esecuzione senza il barrel generale del runtime dell'infrastruttura |
    | `plugin-sdk/infra-runtime` | Shim di compatibilità deprecato; usare i sottopercorsi mirati del runtime indicati sopra |
    | `plugin-sdk/collection-runtime` | Piccoli helper per cache limitate |
    | `plugin-sdk/diagnostic-runtime` | Helper per flag diagnostici, eventi e contesti di traccia |
    | `plugin-sdk/error-runtime` | Helper per il grafo degli errori, la formattazione e la classificazione condivisa degli errori, `PlatformMessageNotDispatchedError`, `isApprovalNotFoundError` |
    | `plugin-sdk/fetch-runtime` | Helper per fetch con wrapper, proxy, opzioni EnvHttpProxyAgent e ricerche bloccate |
    | `plugin-sdk/runtime-fetch` | Fetch di runtime consapevole del dispatcher senza importazioni di proxy o fetch protetto |
    | `plugin-sdk/inline-image-data-url-runtime` | Helper per la sanificazione degli URL di dati immagine incorporati e il rilevamento delle firme senza la superficie generale del runtime multimediale |
    | `plugin-sdk/response-limit-runtime` | Lettori del corpo delle risposte con limiti di byte, inattività e scadenza senza la superficie generale del runtime multimediale |
    | `plugin-sdk/session-binding-runtime` | Stato del binding della conversazione corrente senza routing dei binding configurati né archivi di associazione |
    | `plugin-sdk/context-visibility-runtime` | Risoluzione della visibilità del contesto e filtraggio del contesto supplementare senza importazioni generali di configurazione o sicurezza |
    | `plugin-sdk/string-coerce-runtime` | Helper primitivi mirati per coercizione e normalizzazione di record e stringhe senza importazioni di Markdown o registrazione |
    | `plugin-sdk/html-entity-runtime` | Decodifica in un singolo passaggio delle entità HTML5 terminate da punto e virgola senza utilità generali per il testo |
    | `plugin-sdk/text-utility-runtime` | Helper di basso livello per testo e percorsi, inclusa l'escape HTML di cinque entità |
    | `plugin-sdk/widget-html` | Rilevamento di documenti completi, convalida delle dimensioni ed errori di input degli strumenti per widget HTML autonomi |
    | `plugin-sdk/host-runtime` | Helper per la normalizzazione dei nomi host e degli host SCP |
    | `plugin-sdk/retry-runtime` | Helper per la configurazione e l'esecuzione dei nuovi tentativi |
    | `plugin-sdk/agent-runtime` | Barrel generale deprecato per helper di directory, identità e spazi di lavoro degli agenti, inclusi `resolveAgentDir`, `resolveDefaultAgentDir` e l'esportazione di compatibilità deprecata `resolveOpenClawAgentDir`; preferire sottopercorsi mirati per agenti e runtime |
    | `plugin-sdk/directory-runtime` | Interrogazione e deduplicazione delle directory basate sulla configurazione |
    | `plugin-sdk/keyed-async-queue` | `KeyedAsyncQueue` |
  </Accordion>

  <Accordion title="Sottopercorsi per funzionalità e test">
    | Sottopercorso | Esportazioni principali |
    | --- | --- |
    | `plugin-sdk/media-runtime` | Barrel multimediale ampio deprecato che include `saveRemoteMedia`, `saveResponseMedia`, `readRemoteMediaBuffer` e il deprecato `fetchRemoteMedia`; preferire `plugin-sdk/media-store`, `plugin-sdk/media-mime`, `plugin-sdk/outbound-media` e i sottopercorsi di runtime delle funzionalità, nonché gli helper dello store prima delle letture del buffer quando un URL deve diventare un contenuto multimediale di OpenClaw |
    | `plugin-sdk/media-mime` | Helper mirati per la normalizzazione MIME, la mappatura delle estensioni di file, il rilevamento MIME e il tipo di contenuto multimediale |
    | `plugin-sdk/media-store` | Helper mirati per lo store multimediale, come `saveMediaBuffer` e `saveMediaStream` |
    | `plugin-sdk/media-generation-runtime` | Helper condivisi per il failover della generazione multimediale, la selezione dei candidati e i messaggi relativi ai modelli mancanti |
    | `plugin-sdk/media-understanding` | Tipi di provider per la comprensione dei contenuti multimediali ed esportazioni di helper rivolti ai provider per immagini, audio ed estrazione strutturata |
    | `plugin-sdk/text-chunking` | Suddivisione in intervalli del testo in uscita con conservazione degli offset, suddivisione e rendering del Markdown, tokenizzazione dei tag HTML consapevole delle virgolette, conversione delle tabelle Markdown, rimozione dei tag direttiva e utilità per testo sicuro |
    | `plugin-sdk/speech` | Tipi di provider vocali ed esportazioni rivolte ai provider per direttive, registro, convalida, generatore TTS compatibile con OpenAI e helper vocali |
    | `plugin-sdk/speech-core` | Tipi di provider vocali condivisi ed esportazioni per registro, direttive, normalizzazione e helper vocali |
    | `plugin-sdk/realtime-transcription` | Tipi di provider per la trascrizione in tempo reale, helper del registro e helper condiviso per le sessioni WebSocket |
    | `plugin-sdk/realtime-bootstrap-context` | Helper di bootstrap del profilo in tempo reale per l'iniezione limitata del contesto `IDENTITY.md`, `USER.md` e `SOUL.md` |
    | `plugin-sdk/realtime-voice` | Tipi di provider vocali in tempo reale, helper del registro e helper condivisi per il comportamento vocale in tempo reale, incluso il monitoraggio dell'attività di output |
    | `plugin-sdk/image-generation` | Tipi di provider per la generazione di immagini, helper per risorse immagine e URL di dati e generatore di provider di immagini compatibile con OpenAI |
    | `plugin-sdk/image-generation-core` | Tipi condivisi per la generazione di immagini e helper per failover, autenticazione e registro |
    | `plugin-sdk/music-generation` | Tipi di provider, richiesta e risultato per la generazione musicale |
    | `plugin-sdk/music-generation-core` | Tipi condivisi deprecati per la generazione musicale, helper di failover, ricerca del provider e analisi dei riferimenti ai modelli; preferire le superfici dei provider musicali di proprietà dei Plugin |
    | `plugin-sdk/video-generation` | Tipi di provider, richiesta e risultato per la generazione video |
    | `plugin-sdk/video-generation-core` | Tipi condivisi per la generazione video, helper di failover, ricerca del provider e analisi dei riferimenti ai modelli |
    | `plugin-sdk/transcripts` | Tipi condivisi di provider delle sorgenti delle trascrizioni, helper del registro, descrittori di sessione e metadati degli enunciati |
    | `plugin-sdk/webhook-targets` | Registro delle destinazioni Webhook e helper per l'installazione delle route |
    | `plugin-sdk/webhook-path` | Alias di compatibilità deprecato; usare `plugin-sdk/webhook-ingress` |
    | `plugin-sdk/web-media` | Helper condivisi per il caricamento di contenuti multimediali remoti/locali |
    | `plugin-sdk/zod` | Riesportazione di compatibilità deprecata; importare `zod` direttamente da `zod` |
    | `plugin-sdk/plugin-test-api` | Helper minimo `createTestPluginApi` locale al repository per test unitari di registrazione diretta dei Plugin senza importare bridge degli helper di test del repository |
    | `plugin-sdk/agent-runtime-test-contracts` | Fixture locali al repository per il contratto dell'adattatore nativo del runtime dell'agente, destinate ai test di autenticazione, consegna, fallback, hook degli strumenti, overlay dei prompt, schema e proiezione delle trascrizioni |
    | `plugin-sdk/channel-test-helpers` | Helper di test locali al repository e orientati ai canali per contratti generici di azioni/configurazione/stato, asserzioni sulle directory, ciclo di vita di avvio degli account, propagazione della configurazione di invio, mock del runtime, problemi di stato, consegna in uscita e registrazione degli hook |
    | `plugin-sdk/channel-target-testing` | Suite locale al repository e condivisa di casi di errore nella risoluzione delle destinazioni per i test dei canali |
    | `plugin-sdk/channel-contract-testing` | Helper locali al repository per test mirati dei contratti dei canali, senza l'ampio barrel di test |
    | `plugin-sdk/plugin-test-contracts` | Helper locali al repository per contratti relativi a pacchetti Plugin, registrazione, artefatti pubblici, importazione diretta, API di runtime ed effetti collaterali delle importazioni |
    | `plugin-sdk/plugin-state-test-runtime` | Helper di test locali al repository per lo store dello stato dei Plugin, la coda di ingresso e il database dello stato |
    | `plugin-sdk/provider-test-contracts` | Helper locali al repository per contratti relativi a runtime dei provider, autenticazione, rilevamento, onboarding, catalogo, procedura guidata, funzionalità multimediali, criteri di riproduzione, audio dal vivo STT in tempo reale, ricerca/recupero web e streaming |
    | `plugin-sdk/provider-http-test-mocks` | Mock HTTP/autenticazione Vitest locali al repository e ad attivazione esplicita per i test dei provider che esercitano `plugin-sdk/provider-http` |
    | `plugin-sdk/reply-payload-testing` | Helper locali al repository per associare metadati alle fixture dei payload di risposta |
    | `plugin-sdk/sqlite-runtime-testing` | Helper locali al repository per il ciclo di vita SQLite nei test proprietari |
    | `plugin-sdk/test-fixtures` | Fixture locali al repository per acquisizione generica del runtime CLI, contesto sandbox, writer delle skill, messaggi dell'agente, eventi di sistema, ricaricamento dei moduli, percorso dei Plugin inclusi, testo del terminale, suddivisione in segmenti, token di autenticazione e casi tipizzati |
    | `plugin-sdk/test-node-mocks` | Helper locali al repository per mock mirati dei moduli integrati di Node, da usare nelle factory Vitest `vi.mock("node:*")` |
  </Accordion>

  <Accordion title="Sottopercorsi della memoria">
    | Sottopercorso | Esportazioni principali |
    | --- | --- |
    | `plugin-sdk/memory-core` | Alias di compatibilità deprecato; usare `plugin-sdk/memory-host-core` |
    | `plugin-sdk/memory-core-engine-runtime` | Facciata deprecata del runtime di indicizzazione/ricerca della memoria; preferire i sottopercorsi dell'host di memoria indipendenti dal fornitore |
    | `plugin-sdk/memory-core-host-embedding-registry` | Helper leggeri per il registro dei provider di embedding della memoria |
    | `plugin-sdk/memory-core-host-engine-foundation` | Esportazioni del motore di base dell'host di memoria |
    | `plugin-sdk/memory-core-host-engine-embeddings` | Contratti di embedding dell'host di memoria, accesso al registro, provider locale e helper generici per elaborazione in batch/remota. `registerMemoryEmbeddingProvider` su questa superficie è deprecato; per i nuovi provider usare l'API generica dei provider di embedding. |
    | `plugin-sdk/memory-core-host-engine-qmd` | Esportazioni del motore QMD dell'host di memoria |
    | `plugin-sdk/memory-core-host-engine-storage` | Esportazioni del motore di archiviazione dell'host di memoria |
    | `plugin-sdk/memory-core-host-multimodal` | Helper multimodali deprecati dell'host di memoria; preferire i sottopercorsi dell'host di memoria indipendenti dal fornitore |
    | `plugin-sdk/memory-core-host-query` | Helper di query deprecati dell'host di memoria; preferire i sottopercorsi dell'host di memoria indipendenti dal fornitore |
    | `plugin-sdk/memory-core-host-secret` | Helper per i segreti dell'host di memoria |
    | `plugin-sdk/memory-core-host-events` | Alias di compatibilità deprecato; usare `plugin-sdk/memory-host-events` |
    | `plugin-sdk/memory-core-host-status` | Helper di stato dell'host di memoria |
    | `plugin-sdk/memory-core-host-runtime-cli` | Helper del runtime CLI dell'host di memoria |
    | `plugin-sdk/memory-core-host-runtime-core` | Helper del runtime principale dell'host di memoria |
    | `plugin-sdk/memory-core-host-runtime-files` | Helper di file/runtime dell'host di memoria |
    | `plugin-sdk/memory-host-core` | Alias indipendente dal fornitore per gli helper del runtime principale dell'host di memoria |
    | `plugin-sdk/memory-host-events` | Alias indipendente dal fornitore per gli helper del registro eventi dell'host di memoria |
    | `plugin-sdk/memory-host-files` | Alias di compatibilità deprecato; usare `plugin-sdk/memory-core-host-runtime-files` |
    | `plugin-sdk/memory-host-markdown` | Helper condivisi per Markdown gestito destinati ai Plugin adiacenti alla memoria |
    | `plugin-sdk/memory-host-search` | Facciata del runtime Active Memory per l'accesso al gestore di ricerca |
    | `plugin-sdk/memory-host-status` | Alias di compatibilità deprecato; usare `plugin-sdk/memory-core-host-status` |
  </Accordion>

  <Accordion title="Sottopercorsi riservati degli helper inclusi">
    I sottopercorsi SDK riservati degli helper inclusi sono superfici mirate e specifiche del proprietario per
    il codice dei Plugin inclusi. Sono registrati nell'inventario dell'SDK affinché le build
    dei pacchetti e gli alias rimangano deterministici, ma non sono API generiche per
    la creazione di Plugin. I nuovi contratti host riutilizzabili devono usare sottopercorsi SDK generici
    come `plugin-sdk/gateway-runtime`, `plugin-sdk/ssrf-runtime` e
    `plugin-sdk/plugin-config-runtime`.

    | Sottopercorso | Proprietario e scopo |
    | --- | --- |
    | `plugin-sdk/codex-mcp-projection` | Helper del Plugin Codex incluso per proiettare la configurazione del server MCP dell'utente nella configurazione dei thread dell'app server Codex (esportazione del pacchetto riservata) |
    | `plugin-sdk/codex-native-task-runtime` | Helper del Plugin Codex incluso per replicare i subagenti nativi dell'app server Codex nello stato delle attività di OpenClaw (solo locale al repository, non un'esportazione del pacchetto) |

  </Accordion>
</AccordionGroup>

## Correlati

- [Panoramica dell'SDK dei Plugin](/it/plugins/sdk-overview)
- [Configurazione dell'SDK dei Plugin](/it/plugins/sdk-setup)
- [Creazione di Plugin](/it/plugins/building-plugins)
