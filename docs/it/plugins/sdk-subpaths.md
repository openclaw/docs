---
read_when:
    - Scegliere il sottopercorso plugin-sdk corretto per un import di Plugin
    - Audit dei sottopercorsi dei Plugin inclusi e delle superfici helper
summary: 'Catalogo dei sottopercorsi dell''SDK dei Plugin: dove si trovano le importazioni, raggruppate per area'
title: Sottopercorsi dell'SDK del Plugin
x-i18n:
    generated_at: "2026-05-11T20:33:41Z"
    model: gpt-5.5
    provider: openai
    source_hash: c2ef3c37e00ca59a567e55b3b47962803e43514d6791d8fda75c7bfeffb1e142
    source_path: plugins/sdk-subpaths.md
    workflow: 16
---

L'SDK dei Plugin è esposto come un insieme di sottopercorsi pubblici mirati sotto
`openclaw/plugin-sdk/`. Questa pagina cataloga i sottopercorsi usati più spesso, raggruppati per
scopo. L'inventario generato degli entrypoint del compilatore si trova in
`scripts/lib/plugin-sdk-entrypoints.json`; le esportazioni del pacchetto sono il sottoinsieme pubblico
dopo aver sottratto i sottopercorsi di test/interni locali al repository elencati in
`scripts/lib/plugin-sdk-private-local-only-subpaths.json`. I maintainer possono verificare
il conteggio delle esportazioni pubbliche con `pnpm plugin-sdk:surface` e i sottopercorsi helper
riservati attivi con `pnpm plugins:boundary-report:summary`; le esportazioni helper riservate
non usate fanno fallire il report CI invece di restare nell'SDK pubblico come
debito di compatibilità inattivo.

Per la guida alla creazione di Plugin, consulta [Panoramica dell'SDK Plugin](/it/plugins/sdk-overview).

## Entry del Plugin

| Sottopercorso                  | Esportazioni principali                                                                                                                                                 |
| ------------------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `plugin-sdk/plugin-entry`      | `definePluginEntry`                                                                                                                                                    |
| `plugin-sdk/core`              | `defineChannelPluginEntry`, `createChatChannelPlugin`, `createChannelPluginBase`, `defineSetupPluginEntry`, `buildChannelConfigSchema`, `buildJsonChannelConfigSchema` |
| `plugin-sdk/config-schema`     | `OpenClawSchema`                                                                                                                                                       |
| `plugin-sdk/provider-entry`    | `defineSingleProviderPluginEntry`                                                                                                                                      |
| `plugin-sdk/migration`         | Helper per gli elementi del provider di migrazione come `createMigrationItem`, costanti di motivo, marcatori di stato degli elementi, helper di redazione e `summarizeMigrationItems` |
| `plugin-sdk/migration-runtime` | Helper di migrazione runtime come `copyMigrationFileItem`, `withCachedMigrationConfigRuntime` e `writeMigrationReport`                                                 |

### Compatibilità deprecata e helper di test

Questi sottopercorsi restano esportazioni del pacchetto per Plugin più vecchi e suite di test OpenClaw,
ma il nuovo codice non dovrebbe aggiungere importazioni da essi: `agent-runtime-test-contracts`,
`channel-contract-testing`, `channel-target-testing`, `channel-test-helpers`,
`plugin-test-api`, `plugin-test-contracts`, `provider-http-test-mocks`,
`provider-test-contracts`, `test-env`, `test-fixtures`, `test-node-mocks`,
`testing`, `channel-runtime`, `compat`, `config-types`, `infra-runtime`,
`text-runtime` e `zod`. Nel nuovo codice dei Plugin importa `zod` direttamente da `zod`.
`plugin-test-runtime` è ancora un sottopercorso helper di test mirato e attivo.

### Sottopercorsi pubblici deprecati non usati

Questi sottopercorsi pubblici esistono da almeno un mese e al momento non hanno
importazioni di produzione da estensioni incluse. Restano importabili per compatibilità,
ma il nuovo codice dei Plugin dovrebbe invece usare sottopercorsi SDK mirati e consumati attivamente:
`agent-config-primitives`, `channel-config-schema-legacy`,
`channel-reply-pipeline`, `channel-runtime`, `channel-secret-runtime`,
`command-auth`, `compat`, `config-runtime`, `config-schema`, `discord`,
`group-access`, `infra-runtime`, `matrix`, `mattermost`,
`media-generation-runtime-shared`, `memory-core-engine-runtime`,
`memory-core-host-multimodal`, `memory-core-host-query`,
`music-generation-core`, `self-hosted-provider-setup`, `telegram-account`,
`telegram-command-config` e `zalouser`.

### Sottopercorsi pubblici rari deprecati

Anche i sottopercorsi pubblici attualmente usati da solo uno o due proprietari di Plugin inclusi sono
deprecati per il nuovo codice dei Plugin. Restano esportazioni del pacchetto per compatibilità,
ma il nuovo codice dovrebbe preferire interfacce SDK condivise attivamente o API di pacchetti
di proprietà del Plugin. I maintainer tracciano l'insieme esatto in
`scripts/lib/plugin-sdk-deprecated-public-subpaths.json` e il budget corrente
con `pnpm plugin-sdk:surface`.

### Barrel ampi deprecati

Questi ampi barrel di riesportazione restano compilabili per il sorgente OpenClaw e
i controlli di compatibilità, ma il nuovo codice dovrebbe preferire sottopercorsi SDK mirati:
`agent-runtime`, `channel-lifecycle`, `channel-runtime`, `cli-runtime`,
`compat`, `config-types`, `conversation-runtime`, `hook-runtime`,
`infra-runtime`, `media-runtime`, `plugin-runtime`, `security-runtime` e
`text-runtime`. `channel-runtime`, `compat`, `config-types`, `infra-runtime`
e `text-runtime` restano esportazioni del pacchetto solo per compatibilità all'indietro; usa invece
sottopercorsi channel/runtime mirati, `config-contracts`, `string-coerce-runtime`,
`text-chunking`, `text-utility-runtime` e `logging-core`.

  <AccordionGroup>
  <Accordion title="Channel subpaths">
    | Sottopercorso | Esportazioni chiave |
    | --- | --- |
    | `plugin-sdk/channel-core` | `defineChannelPluginEntry`, `defineSetupPluginEntry`, `createChatChannelPlugin`, `createChannelPluginBase` |
    | `plugin-sdk/config-schema` | Esportazione dello schema Zod `openclaw.json` radice (`OpenClawSchema`) |
    | `plugin-sdk/json-schema-runtime` | Helper di validazione JSON Schema memorizzato nella cache per schemi di proprietà del plugin |
    | `plugin-sdk/channel-setup` | `createOptionalChannelSetupSurface`, `createOptionalChannelSetupAdapter`, `createOptionalChannelSetupWizard`, più `DEFAULT_ACCOUNT_ID`, `createTopLevelChannelDmPolicy`, `setSetupChannelEnabled`, `splitSetupEntries` |
    | `plugin-sdk/setup` | Helper condivisi per la procedura guidata di configurazione, prompt di allowlist, builder dello stato di configurazione |
    | `plugin-sdk/setup-runtime` | `createPatchedAccountSetupAdapter`, `createEnvPatchedAccountSetupAdapter`, `createSetupInputPresenceValidator`, `noteChannelLookupFailure`, `noteChannelLookupSummary`, `promptResolvedAllowFrom`, `splitSetupEntries`, `createAllowlistSetupWizardProxy`, `createDelegatedSetupWizardProxy` |
    | `plugin-sdk/setup-adapter-runtime` | Alias di compatibilità deprecato; usa `plugin-sdk/setup-runtime` |
    | `plugin-sdk/setup-tools` | `formatCliCommand`, `detectBinary`, `extractArchive`, `resolveBrewExecutable`, `formatDocsLink`, `CONFIG_DIR` |
    | `plugin-sdk/account-core` | Helper per configurazione multi-account/action-gate, helper di fallback dell'account predefinito |
    | `plugin-sdk/account-id` | `DEFAULT_ACCOUNT_ID`, helper di normalizzazione degli ID account |
    | `plugin-sdk/account-resolution` | Helper di ricerca account + fallback predefinito |
    | `plugin-sdk/account-helpers` | Helper ristretti per elenchi account/azioni account |
    | `plugin-sdk/access-groups` | Helper per l'analisi delle allowlist dei gruppi di accesso e diagnostica dei gruppi con redazione |
    | `plugin-sdk/channel-pairing` | `createChannelPairingController` |
    | `plugin-sdk/channel-reply-pipeline` | Helper legacy per la pipeline delle risposte. Il nuovo codice della pipeline di risposta del canale dovrebbe usare `createChannelMessageReplyPipeline` e `resolveChannelMessageSourceReplyDeliveryMode` da `plugin-sdk/channel-message`. |
    | `plugin-sdk/channel-config-helpers` | `createHybridChannelConfigAdapter`, `resolveChannelDmAccess`, `resolveChannelDmAllowFrom`, `resolveChannelDmPolicy`, `normalizeChannelDmPolicy`, `normalizeLegacyDmAliases` |
    | `plugin-sdk/channel-config-schema` | Primitive condivise dello schema di configurazione del canale più builder Zod e JSON/TypeBox diretti |
    | `plugin-sdk/bundled-channel-config-schema` | Schemi di configurazione dei canali OpenClaw inclusi solo per plugin inclusi mantenuti |
    | `plugin-sdk/channel-config-schema-legacy` | Alias di compatibilità deprecato per gli schemi di configurazione dei canali inclusi |
    | `plugin-sdk/telegram-command-config` | Helper di normalizzazione/validazione dei comandi personalizzati Telegram con fallback al contratto incluso |
    | `plugin-sdk/command-gating` | Helper ristretti del gate di autorizzazione dei comandi |
    | `plugin-sdk/channel-policy` | `resolveChannelGroupRequireMention` |
    | `plugin-sdk/channel-ingress` | Facciata di compatibilità deprecata per l'ingress di canale di basso livello. I nuovi percorsi di ricezione dovrebbero usare `plugin-sdk/channel-ingress-runtime`. |
    | `plugin-sdk/channel-ingress-runtime` | Resolver sperimentale di runtime per ingress di canale di alto livello e builder dei fatti di route per percorsi di ricezione dei canali migrati. Preferiscilo all'assemblaggio di allowlist effettive, allowlist di comandi e proiezioni legacy in ogni plugin. Vedi [API di ingress dei canali](/it/plugins/sdk-channel-ingress). |
    | `plugin-sdk/channel-lifecycle` | `createAccountStatusSink`, `createChannelRunQueue` e helper legacy del ciclo di vita degli stream di bozze. Il nuovo codice di finalizzazione dell'anteprima dovrebbe usare `plugin-sdk/channel-message`. |
    | `plugin-sdk/channel-message` | Helper economici del contratto del ciclo di vita dei messaggi come `defineChannelMessageAdapter`, `createChannelMessageAdapterFromOutbound`, `createChannelMessageReplyPipeline`, `createReplyPrefixContext`, `resolveChannelMessageSourceReplyDeliveryMode`, derivazione della capability durable-final, helper di prova delle capability per capability di invio/ricevuta/effetto collaterale, `MessageReceiveContext`, prove della policy di ack in ricezione, `defineFinalizableLivePreviewAdapter`, `deliverWithFinalizableLivePreviewAdapter`, prove delle capability live-preview e live-finalizer, stato di recupero durevole, `RenderedMessageBatch`, tipi di ricevuta dei messaggi e helper degli ID ricevuta. Vedi [API dei messaggi di canale](/it/plugins/sdk-channel-message). Le facciate legacy di dispatch delle risposte sono deprecate e restano solo per compatibilità. |
    | `plugin-sdk/channel-message-runtime` | Helper di consegna runtime che possono caricare la consegna in uscita, inclusi `deliverInboundReplyWithMessageSendContext`, `sendDurableMessageBatch` e `withDurableMessageSendContext`. I bridge deprecati di dispatch delle risposte restano importabili solo per dispatcher di compatibilità. Usali dai moduli runtime di monitoraggio/invio, non dai file di bootstrap dei plugin nei percorsi caldi. |
    | `plugin-sdk/inbound-envelope` | Helper condivisi per route in ingresso + builder di envelope |
    | `plugin-sdk/inbound-reply-dispatch` | Helper legacy condivisi per registrazione e dispatch in ingresso, predicati di dispatch visibile/finale e compatibilità deprecata `deliverDurableInboundReplyPayload` per dispatcher di canale preparati. Il nuovo codice di ricezione/dispatch dei canali dovrebbe importare gli helper del ciclo di vita runtime da `plugin-sdk/channel-message-runtime`. |
    | `plugin-sdk/messaging-targets` | Helper di analisi/matching dei target |
    | `plugin-sdk/outbound-media` | Helper condivisi per il caricamento dei media in uscita |
    | `plugin-sdk/outbound-send-deps` | Ricerca leggera delle dipendenze di invio in uscita per adattatori di canale |
    | `plugin-sdk/outbound-runtime` | Helper per identità in uscita, delegato di invio, sessione, formattazione e pianificazione del payload. Gli helper di consegna diretta come `deliverOutboundPayloads` sono substrato di compatibilità deprecato; usa `plugin-sdk/channel-message-runtime` per i nuovi percorsi di invio. |
    | `plugin-sdk/poll-runtime` | Helper ristretti di normalizzazione dei sondaggi |
    | `plugin-sdk/thread-bindings-runtime` | Helper del ciclo di vita e degli adattatori per il binding dei thread |
    | `plugin-sdk/agent-media-payload` | Builder legacy del payload multimediale dell'agente |
    | `plugin-sdk/conversation-runtime` | Helper per binding, associazione e binding configurati di conversazioni/thread |
    | `plugin-sdk/runtime-config-snapshot` | Helper per snapshot della configurazione runtime |
    | `plugin-sdk/runtime-group-policy` | Helper runtime per la risoluzione delle policy di gruppo |
    | `plugin-sdk/channel-status` | Helper condivisi per snapshot/riepilogo dello stato del canale |
    | `plugin-sdk/channel-config-primitives` | Primitive ristrette dello schema di configurazione del canale |
    | `plugin-sdk/channel-config-writes` | Helper di autorizzazione alla scrittura della configurazione del canale |
    | `plugin-sdk/channel-plugin-common` | Esportazioni condivise del prelude dei plugin di canale |
    | `plugin-sdk/allowlist-config-edit` | Helper di modifica/lettura della configurazione allowlist |
    | `plugin-sdk/group-access` | Helper condivisi per decisioni di accesso ai gruppi |
    | `plugin-sdk/direct-dm` | Helper condivisi di autenticazione/guardia per DM diretti |
    | `plugin-sdk/discord` | Facciata di compatibilità Discord deprecata per `@openclaw/discord@2026.3.13` pubblicato e compatibilità proprietaria tracciata; i nuovi plugin dovrebbero usare i sottopercorsi SDK di canale generici |
    | `plugin-sdk/telegram-account` | Facciata di compatibilità deprecata per la risoluzione degli account Telegram per compatibilità proprietaria tracciata; i nuovi plugin dovrebbero usare helper runtime iniettati o sottopercorsi SDK di canale generici |
    | `plugin-sdk/zalouser` | Facciata di compatibilità Zalo Personal deprecata per pacchetti Lark/Zalo pubblicati che importano ancora l'autorizzazione dei comandi del mittente; i nuovi plugin dovrebbero usare `plugin-sdk/command-auth` |
    | `plugin-sdk/interactive-runtime` | Helper per presentazione semantica dei messaggi, consegna e risposte interattive legacy. Vedi [Presentazione dei messaggi](/it/plugins/message-presentation) |
    | `plugin-sdk/channel-inbound` | Barrel di compatibilità per debounce in ingresso, matching delle menzioni, helper delle policy di menzione e helper di envelope |
    | `plugin-sdk/channel-inbound-debounce` | Helper ristretti per debounce in ingresso |
    | `plugin-sdk/channel-mention-gating` | Helper ristretti per policy di menzione, marcatore di menzione e testo di menzione senza la più ampia superficie runtime in ingresso |
    | `plugin-sdk/channel-envelope` | Helper ristretti per la formattazione degli envelope in ingresso |
    | `plugin-sdk/channel-location` | Helper per contesto e formattazione della posizione del canale |
    | `plugin-sdk/channel-logging` | Helper di logging del canale per scarti in ingresso ed errori di digitazione/ack |
    | `plugin-sdk/channel-send-result` | Tipi dei risultati di risposta |
    | `plugin-sdk/channel-actions` | Helper per azioni sui messaggi di canale, più helper dello schema nativo deprecati mantenuti per compatibilità dei plugin |
    | `plugin-sdk/channel-route` | Helper condivisi per normalizzazione delle route, risoluzione dei target guidata da parser, conversione degli ID thread in stringa, chiavi di route deduplicate/compatte, tipi di target analizzati e confronto route/target |
    | `plugin-sdk/channel-targets` | Helper di analisi dei target; i chiamanti del confronto delle route dovrebbero usare `plugin-sdk/channel-route` |
    | `plugin-sdk/channel-contract` | Tipi di contratto dei canali |
    | `plugin-sdk/channel-feedback` | Cablaggio di feedback/reazioni |
    | `plugin-sdk/channel-secret-runtime` | Helper ristretti per contratti dei segreti come `collectSimpleChannelFieldAssignments`, `getChannelSurface`, `pushAssignment` e tipi di target segreti |
  </Accordion>

  <Accordion title="Sottopercorsi dei provider">
    | Sottopercorso | Esportazioni principali |
    | --- | --- |
    | `plugin-sdk/provider-entry` | `defineSingleProviderPluginEntry` |
    | `plugin-sdk/lmstudio` | Facade del provider LM Studio supportata per configurazione, individuazione del catalogo e preparazione dei modelli a runtime |
    | `plugin-sdk/lmstudio-runtime` | Facade runtime LM Studio supportata per impostazioni predefinite del server locale, individuazione dei modelli, intestazioni delle richieste e helper per modelli caricati |
    | `plugin-sdk/provider-setup` | Helper curati per la configurazione di provider locali/self-hosted |
    | `plugin-sdk/self-hosted-provider-setup` | Helper mirati per la configurazione di provider self-hosted compatibili con OpenAI |
    | `plugin-sdk/cli-backend` | Impostazioni predefinite del backend CLI + costanti del watchdog |
    | `plugin-sdk/provider-auth-runtime` | Helper runtime per la risoluzione delle chiavi API per i Plugin provider |
    | `plugin-sdk/provider-auth-api-key` | Helper per onboarding/scrittura profilo della chiave API, come `upsertApiKeyProfile` |
    | `plugin-sdk/provider-auth-result` | Builder standard del risultato di autenticazione OAuth |
    | `plugin-sdk/provider-env-vars` | Helper di ricerca delle variabili d'ambiente per l'autenticazione del provider |
    | `plugin-sdk/provider-auth` | `createProviderApiKeyAuthMethod`, `ensureApiKeyFromOptionEnvOrPrompt`, `upsertAuthProfile`, `upsertApiKeyProfile`, `writeOAuthCredentials`, esportazione di compatibilità deprecata `resolveOpenClawAgentDir` |
    | `plugin-sdk/provider-model-shared` | `ProviderReplayFamily`, `buildProviderReplayFamilyHooks`, `normalizeModelCompat`, builder condivisi di criteri di replay, helper per endpoint dei provider e helper condivisi di normalizzazione degli ID modello |
    | `plugin-sdk/provider-catalog-runtime` | Hook runtime di arricchimento del catalogo provider e giunzioni del registro plugin-provider per test di contratto |
    | `plugin-sdk/provider-catalog-shared` | `findCatalogTemplate`, `buildSingleProviderApiKeyCatalog`, `buildManifestModelProviderConfig`, `supportsNativeStreamingUsageCompat`, `applyProviderNativeStreamingUsageCompat` |
    | `plugin-sdk/provider-http` | Helper generici per capacità HTTP/endpoint dei provider, errori HTTP dei provider e helper per form multipart di trascrizione audio |
    | `plugin-sdk/provider-web-fetch-contract` | Helper mirati per contratti di configurazione/selezione del web-fetch, come `enablePluginInConfig` e `WebFetchProviderPlugin` |
    | `plugin-sdk/provider-web-fetch` | Helper di registrazione/cache dei provider web-fetch |
    | `plugin-sdk/provider-web-search-config-contract` | Helper mirati per configurazione/credenziali web-search per provider che non necessitano del collegamento di abilitazione plugin |
    | `plugin-sdk/provider-web-search-contract` | Helper mirati per contratti di configurazione/credenziali web-search, come `createWebSearchProviderContractFields`, `enablePluginInConfig`, `resolveProviderWebSearchPluginConfig` e setter/getter di credenziali con ambito |
    | `plugin-sdk/provider-web-search` | Helper di registrazione/cache/runtime dei provider web-search |
    | `plugin-sdk/provider-tools` | `ProviderToolCompatFamily`, `buildProviderToolCompatFamilyHooks` e pulizia schema + diagnostica Gemini |
    | `plugin-sdk/provider-usage` | `fetchClaudeUsage` e simili |
    | `plugin-sdk/provider-stream` | `ProviderStreamFamily`, `buildProviderStreamFamilyHooks`, `composeProviderStreamWrappers`, tipi di wrapper di stream e helper condivisi per wrapper Anthropic/Bedrock/DeepSeek V4/Google/Kilocode/Moonshot/OpenAI/OpenRouter/Z.A.I/MiniMax/Copilot |
    | `plugin-sdk/provider-transport-runtime` | Helper di trasporto provider nativo, come fetch protetto, trasformazioni dei messaggi di trasporto e stream di eventi di trasporto scrivibili |
    | `plugin-sdk/provider-onboard` | Helper per patch della configurazione di onboarding |
    | `plugin-sdk/global-singleton` | Helper singleton/map/cache locali al processo |
    | `plugin-sdk/group-activation` | Helper mirati per modalità di attivazione gruppo e parsing dei comandi |
  </Accordion>

  <Accordion title="Sottopercorsi di autenticazione e sicurezza">
    | Sottopercorso | Esportazioni principali |
    | --- | --- |
    | `plugin-sdk/command-auth` | `resolveControlCommandGate`, helper del registro comandi inclusa la formattazione dinamica del menu argomenti, helper di autorizzazione del mittente |
    | `plugin-sdk/command-status` | Builder di messaggi comandi/guida, come `buildCommandsMessagePaginated` e `buildHelpMessage` |
    | `plugin-sdk/approval-auth-runtime` | Risoluzione degli approvatori e helper di autenticazione azione nella stessa chat |
    | `plugin-sdk/approval-client-runtime` | Helper per profilo/filtro di approvazione exec nativa |
    | `plugin-sdk/approval-delivery-runtime` | Adattatori nativi per capacità/consegna di approvazione |
    | `plugin-sdk/approval-gateway-runtime` | Helper condiviso per risoluzione del Gateway di approvazione |
    | `plugin-sdk/approval-handler-adapter-runtime` | Helper leggeri per il caricamento di adattatori di approvazione nativi per entrypoint di canali hot |
    | `plugin-sdk/approval-handler-runtime` | Helper runtime più ampi per gestori di approvazione; preferire le giunzioni adapter/gateway più mirate quando sono sufficienti |
    | `plugin-sdk/approval-native-runtime` | Helper per target di approvazione nativo + binding account |
    | `plugin-sdk/approval-reply-runtime` | Helper per payload di risposta di approvazione exec/plugin |
    | `plugin-sdk/approval-runtime` | Helper per payload di approvazione exec/plugin, helper di routing/runtime per approvazione nativa e helper di visualizzazione strutturata dell'approvazione, come `formatApprovalDisplayPath` |
    | `plugin-sdk/reply-dedupe` | Helper mirati per reset della deduplicazione delle risposte in ingresso |
    | `plugin-sdk/channel-contract-testing` | Helper mirati per test di contratto dei canali senza il barrel di testing ampio |
    | `plugin-sdk/command-auth-native` | Autenticazione nativa dei comandi, formattazione dinamica del menu argomenti e helper nativi per target di sessione |
    | `plugin-sdk/command-detection` | Helper condivisi per rilevamento dei comandi |
    | `plugin-sdk/command-primitives-runtime` | Predicati leggeri per testo dei comandi per percorsi hot dei canali |
    | `plugin-sdk/command-surface` | Normalizzazione del corpo del comando e helper per superficie dei comandi |
    | `plugin-sdk/allow-from` | `formatAllowFromLowercase` |
    | `plugin-sdk/channel-secret-runtime` | Helper mirati per raccolta di contratti segreto per superfici segreto di canale/plugin |
    | `plugin-sdk/secret-ref-runtime` | Helper mirati per tipizzazione `coerceSecretRef` e SecretRef per parsing di contratti/configurazioni segreto |
    | `plugin-sdk/security-runtime` | Helper condivisi per attendibilità, gating DM, file/percorsi limitati alla root, inclusi scritture solo in creazione, sostituzione atomica di file sync/async, scritture temporanee sibling, fallback di spostamento cross-device, helper privati per file-store, guardie dei genitori symlink, contenuto esterno, oscuramento di testo sensibile, confronto di segreti a tempo costante e helper di raccolta segreti |
    | `plugin-sdk/ssrf-policy` | Helper per allowlist host e criteri SSRF per reti private |
    | `plugin-sdk/ssrf-dispatcher` | Helper mirati per dispatcher vincolato senza l'ampia superficie runtime dell'infrastruttura |
    | `plugin-sdk/ssrf-runtime` | Dispatcher vincolato, fetch protetto da SSRF, errore SSRF e helper per criteri SSRF |
    | `plugin-sdk/secret-input` | Helper per parsing dell'input segreto |
    | `plugin-sdk/webhook-ingress` | Helper per richieste/target Webhook e coercizione grezza websocket/body |
    | `plugin-sdk/webhook-request-guards` | Helper per dimensione/timeout del corpo della richiesta |
  </Accordion>

  <Accordion title="Sottopercorsi di runtime e archiviazione">
    | Sottopercorso | Esportazioni chiave |
    | --- | --- |
    | `plugin-sdk/runtime` | Helper generali di runtime/logging/backup/installazione Plugin |
    | `plugin-sdk/runtime-env` | Helper mirati per ambiente di runtime, logger, timeout, retry e backoff |
    | `plugin-sdk/browser-config` | Facciata di configurazione browser supportata per profilo/predefiniti normalizzati, parsing URL CDP e helper di autenticazione per il controllo del browser |
    | `plugin-sdk/channel-runtime-context` | Helper generici per registrazione e lookup del contesto di runtime del canale |
    | `plugin-sdk/matrix` | Facciata di compatibilità Matrix deprecata per pacchetti canale di terze parti meno recenti; i nuovi plugin dovrebbero importare direttamente `plugin-sdk/run-command` |
    | `plugin-sdk/mattermost` | Facciata di compatibilità Mattermost deprecata per pacchetti canale di terze parti meno recenti; i nuovi plugin dovrebbero importare direttamente i sottopercorsi SDK generici |
    | `plugin-sdk/runtime-store` | `createPluginRuntimeStore` |
    | `plugin-sdk/plugin-runtime` | Helper condivisi per comandi/hook/http/interattivi dei plugin |
    | `plugin-sdk/hook-runtime` | Helper condivisi per pipeline di webhook/hook interni |
    | `plugin-sdk/lazy-runtime` | Helper di import/binding runtime lazy come `createLazyRuntimeModule`, `createLazyRuntimeMethod` e `createLazyRuntimeSurface` |
    | `plugin-sdk/process-runtime` | Helper di esecuzione processo |
    | `plugin-sdk/cli-runtime` | Helper CLI per formattazione, attesa, versione, invocazione argomenti e gruppi di comandi lazy |
    | `plugin-sdk/gateway-runtime` | Client Gateway, helper di avvio client pronto per event loop, RPC CLI Gateway, errori del protocollo Gateway e helper patch per stato canale |
    | `plugin-sdk/config-contracts` | Superficie config mirata solo tipi per forme di config plugin come `OpenClawConfig` e tipi di config canale/provider |
    | `plugin-sdk/plugin-config-runtime` | Helper di lookup runtime per config plugin come `requireRuntimeConfig`, `resolvePluginConfigObject` e `resolveLivePluginConfigObject` |
    | `plugin-sdk/config-mutation` | Helper di mutazione config transazionale come `mutateConfigFile`, `replaceConfigFile` e `logConfigUpdated` |
    | `plugin-sdk/runtime-config-snapshot` | Helper snapshot della config del processo corrente come `getRuntimeConfig`, `getRuntimeConfigSnapshot` e setter di snapshot per test |
    | `plugin-sdk/telegram-command-config` | Normalizzazione di nome/descrizione comando Telegram e controlli duplicati/conflitti, anche quando la superficie del contratto Telegram in bundle non è disponibile |
    | `plugin-sdk/text-autolink-runtime` | Rilevamento autolink di riferimenti file senza il barrel di testo generale |
    | `plugin-sdk/approval-runtime` | Helper di approvazione exec/plugin, builder per capacità di approvazione, helper auth/profilo, helper nativi di routing/runtime e formattazione del percorso di visualizzazione approvazione strutturata |
    | `plugin-sdk/reply-runtime` | Helper condivisi runtime inbound/risposta, suddivisione in chunk, dispatch, Heartbeat, pianificatore risposte |
    | `plugin-sdk/reply-dispatch-runtime` | Helper mirati per dispatch/finalizzazione risposte ed etichette conversazione |
    | `plugin-sdk/reply-history` | Helper condivisi per cronologia risposte a finestra breve e marker come `buildHistoryContext`, `HISTORY_CONTEXT_MARKER`, `recordPendingHistoryEntry` e `clearHistoryEntriesIfEnabled` |
    | `plugin-sdk/reply-reference` | `createReplyReferencePlanner` |
    | `plugin-sdk/reply-chunking` | Helper mirati per suddivisione in chunk di testo/markdown |
    | `plugin-sdk/session-store-runtime` | Helper per percorso session store, chiave sessione, updated-at e mutazione store |
    | `plugin-sdk/cron-store-runtime` | Helper per percorso/caricamento/salvataggio store Cron |
    | `plugin-sdk/state-paths` | Helper per percorsi directory State/OAuth |
    | `plugin-sdk/routing` | Helper di binding route/chiave sessione/account come `resolveAgentRoute`, `buildAgentSessionKey` e `resolveDefaultAgentBoundAccountId` |
    | `plugin-sdk/status-helpers` | Helper condivisi per riepilogo stato canale/account, predefiniti dello stato runtime e helper metadati issue |
    | `plugin-sdk/target-resolver-runtime` | Helper condivisi per resolver target |
    | `plugin-sdk/string-normalization-runtime` | Helper di normalizzazione slug/stringhe |
    | `plugin-sdk/request-url` | Estrae URL stringa da input simili a fetch/request |
    | `plugin-sdk/run-command` | Runner di comandi temporizzato con risultati stdout/stderr normalizzati |
    | `plugin-sdk/param-readers` | Reader comuni per parametri tool/CLI |
    | `plugin-sdk/tool-payload` | Estrae payload normalizzati dagli oggetti risultato dei tool |
    | `plugin-sdk/tool-send` | Estrae i campi canonici del target di invio dagli argomenti tool |
    | `plugin-sdk/temp-path` | Helper condivisi per percorsi di download temporanei e workspace temporanei privati sicuri |
    | `plugin-sdk/logging-core` | Helper per logger di sottosistema e redazione |
    | `plugin-sdk/markdown-table-runtime` | Helper per modalità tabella Markdown e conversione |
    | `plugin-sdk/model-session-runtime` | Helper per override modello/sessione come `applyModelOverrideToSessionEntry` e `resolveAgentMaxConcurrent` |
    | `plugin-sdk/talk-config-runtime` | Helper di risoluzione config provider Talk |
    | `plugin-sdk/json-store` | Piccoli helper per lettura/scrittura stato JSON |
    | `plugin-sdk/file-lock` | Helper re-entrant per file lock |
    | `plugin-sdk/persistent-dedupe` | Helper cache dedupe persistita su disco |
    | `plugin-sdk/acp-runtime` | Helper runtime/sessione ACP e dispatch risposte |
    | `plugin-sdk/acp-runtime-backend` | Helper leggeri per registrazione backend ACP e dispatch risposte per plugin caricati all'avvio |
    | `plugin-sdk/acp-binding-resolve-runtime` | Risoluzione binding ACP in sola lettura senza import di avvio lifecycle |
    | `plugin-sdk/agent-config-primitives` | Primitive mirate per schema config runtime agente |
    | `plugin-sdk/boolean-param` | Reader permissivo per parametri booleani |
    | `plugin-sdk/dangerous-name-runtime` | Helper di risoluzione matching per nomi pericolosi |
    | `plugin-sdk/device-bootstrap` | Helper per bootstrap dispositivo e token di pairing |
    | `plugin-sdk/extension-shared` | Primitive helper condivise per canale passivo, stato e proxy ambientale |
    | `plugin-sdk/models-provider-runtime` | Helper per risposta comando/provider `/models` |
    | `plugin-sdk/skill-commands-runtime` | Helper per elenco comandi Skill |
    | `plugin-sdk/native-command-registry` | Helper per registro/build/serializzazione comandi nativi |
    | `plugin-sdk/agent-harness` | Superficie sperimentale per plugin attendibili per harness agente di basso livello: tipi harness, helper steer/abort per active-run, helper bridge tool OpenClaw, helper policy tool per piano runtime, classificazione outcome terminale, helper di formattazione/dettaglio avanzamento tool e utilità risultato tentativo |
    | `plugin-sdk/provider-zai-endpoint` | Facciata deprecata di rilevamento endpoint di proprietà del provider Z.AI; usa l'API pubblica del plugin Z.AI |
    | `plugin-sdk/async-lock-runtime` | Helper di lock async locale al processo per piccoli file di stato runtime |
    | `plugin-sdk/channel-activity-runtime` | Helper di telemetria attività canale |
    | `plugin-sdk/concurrency-runtime` | Helper di concorrenza attività async limitata |
    | `plugin-sdk/dedupe-runtime` | Helper cache dedupe in memoria |
    | `plugin-sdk/delivery-queue-runtime` | Helper di svuotamento consegne in sospeso in uscita |
    | `plugin-sdk/file-access-runtime` | Helper sicuri per percorsi di file locali e sorgenti media |
    | `plugin-sdk/heartbeat-runtime` | Helper per risveglio, evento e visibilità Heartbeat |
    | `plugin-sdk/number-runtime` | Helper di coercizione numerica |
    | `plugin-sdk/secure-random-runtime` | Helper per token/UUID sicuri |
    | `plugin-sdk/system-event-runtime` | Helper per coda eventi di sistema |
    | `plugin-sdk/transport-ready-runtime` | Helper di attesa prontezza trasporto |
    | `plugin-sdk/infra-runtime` | Shim di compatibilità deprecato; usa i sottopercorsi runtime mirati sopra |
    | `plugin-sdk/collection-runtime` | Piccoli helper cache limitata |
    | `plugin-sdk/diagnostic-runtime` | Helper per flag diagnostici, eventi e trace-context |
    | `plugin-sdk/error-runtime` | Helper condivisi per grafo errori, formattazione e classificazione errori, `isApprovalNotFoundError` |
    | `plugin-sdk/fetch-runtime` | Helper per fetch wrappato, proxy, opzione EnvHttpProxyAgent e lookup fissato |
    | `plugin-sdk/runtime-fetch` | Fetch runtime consapevole del dispatcher senza import proxy/guarded-fetch |
    | `plugin-sdk/response-limit-runtime` | Reader limitato per body risposta senza la superficie runtime media generale |
    | `plugin-sdk/session-binding-runtime` | Stato binding della conversazione corrente senza routing binding configurato o store di pairing |
    | `plugin-sdk/session-store-runtime` | Helper session-store senza import generali di scrittura/manutenzione config |
    | `plugin-sdk/context-visibility-runtime` | Risoluzione visibilità contesto e filtro contesto supplementare senza import generali config/sicurezza |
    | `plugin-sdk/string-coerce-runtime` | Helper mirati per coercizione e normalizzazione di record primitivi/stringhe senza import markdown/logging |
    | `plugin-sdk/host-runtime` | Helper di normalizzazione hostname e host SCP |
    | `plugin-sdk/retry-runtime` | Helper di config retry e runner retry |
    | `plugin-sdk/agent-runtime` | Helper per directory/identità/workspace agente, inclusi `resolveAgentDir`, `resolveDefaultAgentDir` ed export di compatibilità deprecato `resolveOpenClawAgentDir` |
    | `plugin-sdk/directory-runtime` | Query/dedup directory basata su config |
    | `plugin-sdk/keyed-async-queue` | `KeyedAsyncQueue` |
  </Accordion>

  <Accordion title="Sottopercorsi di funzionalità e test">
    | Sottopercorso | Esportazioni principali |
    | --- | --- |
    | `plugin-sdk/media-runtime` | Helper condivisi per recupero/trasformazione/archiviazione dei media, rilevamento delle dimensioni video basato su ffprobe e builder di payload multimediali |
    | `plugin-sdk/media-mime` | Normalizzazione MIME mirata, mappatura delle estensioni file, rilevamento MIME e helper per il tipo di media |
    | `plugin-sdk/media-store` | Helper mirati per lo store multimediale come `saveMediaBuffer` |
    | `plugin-sdk/media-generation-runtime` | Helper condivisi di failover per la generazione di media, selezione dei candidati e messaggistica per modelli mancanti |
    | `plugin-sdk/media-understanding` | Tipi di provider per la comprensione dei media più esportazioni di helper per immagini/audio/estrazione strutturata rivolte ai provider |
    | `plugin-sdk/text-chunking` | Helper per suddivisione/rendering di testo e markdown, conversione di tabelle markdown, rimozione di tag direttiva e utilità per testo sicuro |
    | `plugin-sdk/text-chunking` | Helper per la suddivisione del testo in uscita |
    | `plugin-sdk/speech` | Tipi di provider speech più esportazioni di helper per direttive, registro, validazione, builder TTS compatibile con OpenAI e speech rivolte ai provider |
    | `plugin-sdk/speech-core` | Esportazioni condivise di tipi di provider speech, registro, direttive, normalizzazione e helper speech |
    | `plugin-sdk/realtime-transcription` | Tipi di provider per trascrizione in tempo reale, helper di registro e helper condiviso per sessioni WebSocket |
    | `plugin-sdk/realtime-voice` | Tipi di provider vocali in tempo reale e helper di registro |
    | `plugin-sdk/image-generation` | Tipi di provider per generazione di immagini più helper per asset immagine/data URL e builder di provider immagini compatibile con OpenAI |
    | `plugin-sdk/image-generation-core` | Helper condivisi per tipi, failover, auth e registro di generazione immagini |
    | `plugin-sdk/music-generation` | Tipi per provider/richiesta/risultato di generazione musicale |
    | `plugin-sdk/music-generation-core` | Tipi condivisi di generazione musicale, helper di failover, lookup dei provider e parsing dei riferimenti modello |
    | `plugin-sdk/video-generation` | Tipi per provider/richiesta/risultato di generazione video |
    | `plugin-sdk/video-generation-core` | Tipi condivisi di generazione video, helper di failover, lookup dei provider e parsing dei riferimenti modello |
    | `plugin-sdk/webhook-targets` | Registro delle destinazioni Webhook e helper di installazione delle route |
    | `plugin-sdk/webhook-path` | Alias di compatibilità deprecato; usa `plugin-sdk/webhook-ingress` |
    | `plugin-sdk/web-media` | Helper condivisi per il caricamento di media remoti/locali |
    | `plugin-sdk/zod` | Riesportazione di compatibilità deprecata; importa `zod` direttamente da `zod` |
    | `plugin-sdk/testing` | Barrel di compatibilità deprecato repo-local per test OpenClaw legacy. I nuovi test del repository dovrebbero invece importare sottopercorsi di test locali mirati come `plugin-sdk/agent-runtime-test-contracts`, `plugin-sdk/plugin-test-runtime`, `plugin-sdk/channel-test-helpers`, `plugin-sdk/test-env` o `plugin-sdk/test-fixtures` |
    | `plugin-sdk/plugin-test-api` | Helper repo-local minimale `createTestPluginApi` per test unitari di registrazione diretta dei plugin senza importare bridge di helper di test del repository |
    | `plugin-sdk/agent-runtime-test-contracts` | Fixture repo-local native per contratti di adapter agent-runtime per test di auth, consegna, fallback, hook degli strumenti, overlay dei prompt, schema e proiezione della trascrizione |
    | `plugin-sdk/channel-test-helpers` | Helper di test repo-local orientati ai canali per contratti generici di azioni/setup/stato, asserzioni sulle directory, ciclo di vita di avvio account, threading send-config, mock runtime, problemi di stato, consegna in uscita e registrazione degli hook |
    | `plugin-sdk/channel-target-testing` | Suite repo-local condivisa di casi di errore di risoluzione della destinazione per test dei canali |
    | `plugin-sdk/plugin-test-contracts` | Helper repo-local per contratti di pacchetto plugin, registrazione, artefatti pubblici, importazione diretta, API runtime ed effetti collaterali di importazione |
    | `plugin-sdk/provider-test-contracts` | Helper repo-local per contratti di runtime provider, auth, discovery, onboarding, catalogo, wizard, funzionalità multimediali, policy di replay, audio live STT in tempo reale, ricerca/fetch web e stream |
    | `plugin-sdk/provider-http-test-mocks` | Mock HTTP/auth Vitest repo-local opzionali per test dei provider che esercitano `plugin-sdk/provider-http` |
    | `plugin-sdk/test-fixtures` | Fixture repo-local generiche per acquisizione runtime CLI, contesto sandbox, writer di skill, messaggi agente, eventi di sistema, ricaricamento moduli, percorso del plugin bundled, testo terminale, chunking, token auth e casi tipizzati |
    | `plugin-sdk/test-node-mocks` | Helper mirati repo-local per mock dei builtin Node da usare nelle factory Vitest `vi.mock("node:*")` |
  </Accordion>

  <Accordion title="Sottopercorsi di memoria">
    | Sottopercorso | Esportazioni principali |
    | --- | --- |
    | `plugin-sdk/memory-core` | Superficie helper memory-core bundled per helper di manager/config/file/CLI |
    | `plugin-sdk/memory-core-engine-runtime` | Facade runtime di indicizzazione/ricerca memoria |
    | `plugin-sdk/memory-core-host-engine-foundation` | Esportazioni dell'engine foundation host della memoria |
    | `plugin-sdk/memory-core-host-engine-embeddings` | Contratti di embedding host della memoria, accesso al registro, provider locale e helper generici batch/remoti |
    | `plugin-sdk/memory-core-host-engine-qmd` | Esportazioni dell'engine QMD host della memoria |
    | `plugin-sdk/memory-core-host-engine-storage` | Esportazioni dell'engine storage host della memoria |
    | `plugin-sdk/memory-core-host-multimodal` | Helper multimodali host della memoria |
    | `plugin-sdk/memory-core-host-query` | Helper di query host della memoria |
    | `plugin-sdk/memory-core-host-secret` | Helper secret host della memoria |
    | `plugin-sdk/memory-core-host-events` | Alias di compatibilità deprecato; usa `plugin-sdk/memory-host-events` |
    | `plugin-sdk/memory-core-host-status` | Helper di stato host della memoria |
    | `plugin-sdk/memory-core-host-runtime-cli` | Helper runtime CLI host della memoria |
    | `plugin-sdk/memory-core-host-runtime-core` | Helper runtime core host della memoria |
    | `plugin-sdk/memory-core-host-runtime-files` | Helper file/runtime host della memoria |
    | `plugin-sdk/memory-host-core` | Alias vendor-neutral per gli helper runtime core host della memoria |
    | `plugin-sdk/memory-host-events` | Alias vendor-neutral per gli helper del journal eventi host della memoria |
    | `plugin-sdk/memory-host-files` | Alias di compatibilità deprecato; usa `plugin-sdk/memory-core-host-runtime-files` |
    | `plugin-sdk/memory-host-markdown` | Helper managed-markdown condivisi per plugin adiacenti alla memoria |
    | `plugin-sdk/memory-host-search` | Facade runtime Active Memory per l'accesso al search-manager |
    | `plugin-sdk/memory-host-status` | Alias di compatibilità deprecato; usa `plugin-sdk/memory-core-host-status` |
  </Accordion>

  <Accordion title="Sottopercorsi riservati degli helper bundled">
    Al momento non esistono sottopercorsi SDK riservati per helper bundled. Gli
    helper specifici del proprietario risiedono nel pacchetto del plugin proprietario, mentre i contratti host riutilizzabili
    usano sottopercorsi SDK generici come `plugin-sdk/gateway-runtime`,
    `plugin-sdk/security-runtime` e `plugin-sdk/plugin-config-runtime`.
  </Accordion>
</AccordionGroup>

## Correlati

- [Panoramica del Plugin SDK](/it/plugins/sdk-overview)
- [Configurazione del Plugin SDK](/it/plugins/sdk-setup)
- [Creare plugin](/it/plugins/building-plugins)
