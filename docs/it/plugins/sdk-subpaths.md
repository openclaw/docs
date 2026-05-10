---
read_when:
    - Scegliere il sottopercorso plugin-sdk corretto per un import di Plugin
    - Verifica dei sottopercorsi dei Plugin in bundle e delle interfacce di supporto
summary: 'Catalogo dei sottopercorsi dell''SDK Plugin: dove si trovano le importazioni, raggruppate per area'
title: Sottopercorsi dell'SDK Plugin
x-i18n:
    generated_at: "2026-05-10T19:47:10Z"
    model: gpt-5.5
    provider: openai
    source_hash: ddcb1223ce9f749e57e866cc0ed3329a1aeeb5d90d00568b5942f7f779086f1f
    source_path: plugins/sdk-subpaths.md
    workflow: 16
---

L’SDK dei Plugin è esposto come un insieme di sottopercorsi pubblici ristretti sotto
`openclaw/plugin-sdk/`. Questa pagina cataloga i sottopercorsi comunemente usati, raggruppati per
scopo. L’inventario generato degli entrypoint del compilatore si trova in
`scripts/lib/plugin-sdk-entrypoints.json`; le esportazioni del pacchetto sono il sottoinsieme pubblico
dopo aver sottratto i sottopercorsi locali al repository per test/interni elencati in
`scripts/lib/plugin-sdk-private-local-only-subpaths.json`. I maintainer possono verificare
il numero di esportazioni pubbliche con `pnpm plugin-sdk:surface` e i sottopercorsi helper
riservati attivi con `pnpm plugins:boundary-report:summary`; le esportazioni helper riservate
non usate fanno fallire il report CI invece di restare nell’SDK pubblico come
debito di compatibilità dormiente.

Per la guida alla creazione di Plugin, consulta [Panoramica dell’SDK dei Plugin](/it/plugins/sdk-overview).

## Entry del Plugin

| Sottopercorso                  | Esportazioni principali                                                                                                                                                            |
| ------------------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `plugin-sdk/plugin-entry`      | `definePluginEntry`                                                                                                                                                    |
| `plugin-sdk/core`              | `defineChannelPluginEntry`, `createChatChannelPlugin`, `createChannelPluginBase`, `defineSetupPluginEntry`, `buildChannelConfigSchema`, `buildJsonChannelConfigSchema` |
| `plugin-sdk/config-schema`     | `OpenClawSchema`                                                                                                                                                       |
| `plugin-sdk/provider-entry`    | `defineSingleProviderPluginEntry`                                                                                                                                      |
| `plugin-sdk/migration`         | Helper per elementi del provider di migrazione come `createMigrationItem`, costanti dei motivi, marcatori di stato degli elementi, helper di redazione e `summarizeMigrationItems`                 |
| `plugin-sdk/migration-runtime` | Helper di migrazione a runtime come `copyMigrationFileItem`, `withCachedMigrationConfigRuntime` e `writeMigrationReport`                                              |

### Compatibilità e helper di test deprecati

Questi sottopercorsi rimangono esportazioni del pacchetto per Plugin meno recenti e suite di test di OpenClaw,
ma il nuovo codice non dovrebbe aggiungere import da essi: `agent-runtime-test-contracts`,
`channel-contract-testing`, `channel-target-testing`, `channel-test-helpers`,
`plugin-test-api`, `plugin-test-contracts`, `provider-http-test-mocks`,
`provider-test-contracts`, `test-env`, `test-fixtures`, `test-node-mocks`,
`testing`, `channel-runtime`, `compat`, `config-types`, `infra-runtime`,
`text-runtime` e `zod`. Nel nuovo codice dei Plugin importa `zod` direttamente da `zod`.
`plugin-test-runtime` è ancora un sottopercorso helper di test mirato attivo.

### Sottopercorsi pubblici deprecati inutilizzati

Questi sottopercorsi pubblici esistevano da almeno un mese e attualmente non hanno
import di produzione da estensioni in bundle. Restano importabili per compatibilità,
ma il nuovo codice dei Plugin dovrebbe invece usare sottopercorsi SDK mirati e attivamente consumati:
`agent-config-primitives`, `channel-config-schema-legacy`,
`channel-reply-pipeline`, `channel-runtime`, `channel-secret-runtime`,
`command-auth`, `compat`, `config-runtime`, `config-schema`, `discord`,
`group-access`, `infra-runtime`, `matrix`, `mattermost`,
`media-generation-runtime-shared`, `memory-core-engine-runtime`,
`memory-core-host-multimodal`, `memory-core-host-query`,
`music-generation-core`, `self-hosted-provider-setup`, `telegram-account`,
`telegram-command-config` e `zalouser`.

### Sottopercorsi pubblici rari deprecati

Anche i sottopercorsi pubblici attualmente usati solo da uno o due proprietari di Plugin in bundle sono
deprecati per il nuovo codice dei Plugin. Rimangono esportazioni del pacchetto per compatibilità,
ma il nuovo codice dovrebbe preferire interfacce SDK condivise attivamente o API di pacchetti
di proprietà del Plugin. I maintainer tracciano l’insieme esatto in
`scripts/lib/plugin-sdk-deprecated-public-subpaths.json` e il budget corrente
con `pnpm plugin-sdk:surface`.

### Barrel ampi deprecati

Questi barrel ampi di riesportazione restano compilabili per il sorgente di OpenClaw e
i controlli di compatibilità, ma il nuovo codice dovrebbe preferire sottopercorsi SDK mirati:
`agent-runtime`, `channel-lifecycle`, `channel-runtime`, `cli-runtime`,
`compat`, `config-types`, `conversation-runtime`, `hook-runtime`,
`infra-runtime`, `media-runtime`, `plugin-runtime`, `security-runtime` e
`text-runtime`. `channel-runtime`, `compat`, `config-types`, `infra-runtime`
e `text-runtime` rimangono esportazioni del pacchetto solo per retrocompatibilità; usa
invece sottopercorsi channel/runtime mirati, `config-contracts`, `string-coerce-runtime`,
`text-chunking`, `text-utility-runtime` e `logging-core`.

  <AccordionGroup>
  <Accordion title="Channel subpaths">
    | Sottopercorso | Esportazioni principali |
    | --- | --- |
    | `plugin-sdk/channel-core` | `defineChannelPluginEntry`, `defineSetupPluginEntry`, `createChatChannelPlugin`, `createChannelPluginBase` |
    | `plugin-sdk/config-schema` | Esportazione dello schema Zod radice di `openclaw.json` (`OpenClawSchema`) |
    | `plugin-sdk/json-schema-runtime` | Helper di convalida JSON Schema memorizzato nella cache per schemi di proprietà del plugin |
    | `plugin-sdk/channel-setup` | `createOptionalChannelSetupSurface`, `createOptionalChannelSetupAdapter`, `createOptionalChannelSetupWizard`, più `DEFAULT_ACCOUNT_ID`, `createTopLevelChannelDmPolicy`, `setSetupChannelEnabled`, `splitSetupEntries` |
    | `plugin-sdk/setup` | Helper condivisi della procedura guidata di configurazione, prompt allowlist, builder dello stato di configurazione |
    | `plugin-sdk/setup-runtime` | `createPatchedAccountSetupAdapter`, `createEnvPatchedAccountSetupAdapter`, `createSetupInputPresenceValidator`, `noteChannelLookupFailure`, `noteChannelLookupSummary`, `promptResolvedAllowFrom`, `splitSetupEntries`, `createAllowlistSetupWizardProxy`, `createDelegatedSetupWizardProxy` |
    | `plugin-sdk/setup-adapter-runtime` | Alias di compatibilità deprecato; usa `plugin-sdk/setup-runtime` |
    | `plugin-sdk/setup-tools` | `formatCliCommand`, `detectBinary`, `extractArchive`, `resolveBrewExecutable`, `formatDocsLink`, `CONFIG_DIR` |
    | `plugin-sdk/account-core` | Helper per configurazione multi-account/action-gate, helper di fallback dell'account predefinito |
    | `plugin-sdk/account-id` | `DEFAULT_ACCOUNT_ID`, helper di normalizzazione degli ID account |
    | `plugin-sdk/account-resolution` | Helper di ricerca account e fallback predefinito |
    | `plugin-sdk/account-helpers` | Helper mirati per elenco account/azione account |
    | `plugin-sdk/access-groups` | Helper di parsing dell'allowlist dei gruppi di accesso e diagnostica redatta dei gruppi |
    | `plugin-sdk/channel-pairing` | `createChannelPairingController` |
    | `plugin-sdk/channel-reply-pipeline` | Helper legacy per la pipeline di risposta. Il nuovo codice della pipeline di risposta dei canali deve usare `createChannelMessageReplyPipeline` e `resolveChannelMessageSourceReplyDeliveryMode` da `plugin-sdk/channel-message`. |
    | `plugin-sdk/channel-config-helpers` | `createHybridChannelConfigAdapter`, `resolveChannelDmAccess`, `resolveChannelDmAllowFrom`, `resolveChannelDmPolicy`, `normalizeChannelDmPolicy`, `normalizeLegacyDmAliases` |
    | `plugin-sdk/channel-config-schema` | Primitive condivise dello schema di configurazione del canale più builder Zod e JSON/TypeBox diretti |
    | `plugin-sdk/bundled-channel-config-schema` | Schemi di configurazione dei canali OpenClaw in bundle solo per i plugin in bundle mantenuti |
    | `plugin-sdk/channel-config-schema-legacy` | Alias di compatibilità deprecato per gli schemi di configurazione dei canali in bundle |
    | `plugin-sdk/telegram-command-config` | Helper di normalizzazione/convalida dei comandi personalizzati di Telegram con fallback del contratto in bundle |
    | `plugin-sdk/command-gating` | Helper mirati per il gate di autorizzazione dei comandi |
    | `plugin-sdk/channel-policy` | `resolveChannelGroupRequireMention` |
    | `plugin-sdk/channel-ingress` | Facciata di compatibilità deprecata per l'ingresso canale di basso livello. I nuovi percorsi di ricezione devono usare `plugin-sdk/channel-ingress-runtime`. |
    | `plugin-sdk/channel-ingress-runtime` | Resolver runtime sperimentale di alto livello per l'ingresso canale e builder di fatti di route per percorsi di ricezione canale migrati. Preferiscilo all'assemblaggio di allowlist effettive, allowlist dei comandi e proiezioni legacy in ogni plugin. Vedi [API di ingresso canale](/it/plugins/sdk-channel-ingress). |
    | `plugin-sdk/channel-lifecycle` | `createAccountStatusSink`, `createChannelRunQueue` e helper legacy del ciclo di vita dello stream bozza. Il nuovo codice di finalizzazione dell'anteprima deve usare `plugin-sdk/channel-message`. |
    | `plugin-sdk/channel-message` | Helper leggeri del contratto del ciclo di vita dei messaggi come `defineChannelMessageAdapter`, `createChannelMessageAdapterFromOutbound`, `createChannelMessageReplyPipeline`, `createReplyPrefixContext`, `resolveChannelMessageSourceReplyDeliveryMode`, derivazione della capability durable-final, helper di prova capability per capability di invio/ricevuta/effetto collaterale, `MessageReceiveContext`, prove della policy di ack in ricezione, `defineFinalizableLivePreviewAdapter`, `deliverWithFinalizableLivePreviewAdapter`, prove di capability live-preview e live-finalizer, stato di recupero durevole, `RenderedMessageBatch`, tipi di ricevuta messaggio e helper per ID ricevuta. Vedi [API dei messaggi canale](/it/plugins/sdk-channel-message). Le facciate legacy di dispatch delle risposte sono solo compatibilità deprecata. |
    | `plugin-sdk/channel-message-runtime` | Helper runtime di consegna che possono caricare la consegna in uscita, inclusi `deliverInboundReplyWithMessageSendContext`, `sendDurableMessageBatch` e `withDurableMessageSendContext`. I bridge deprecati di dispatch delle risposte restano importabili solo per dispatcher di compatibilità. Usare dai moduli runtime di monitor/invio, non dai file di bootstrap plugin hot. |
    | `plugin-sdk/inbound-envelope` | Helper condivisi per route in ingresso e builder envelope |
    | `plugin-sdk/inbound-reply-dispatch` | Helper legacy condivisi per registrazione e dispatch in ingresso, predicati di dispatch visibile/finale e compatibilità deprecata `deliverDurableInboundReplyPayload` per dispatcher canale preparati. Il nuovo codice di ricezione/dispatch canale deve importare helper runtime del ciclo di vita da `plugin-sdk/channel-message-runtime`. |
    | `plugin-sdk/messaging-targets` | Helper di parsing/corrispondenza target |
    | `plugin-sdk/outbound-media` | Helper condivisi di caricamento media in uscita |
    | `plugin-sdk/outbound-send-deps` | Ricerca leggera delle dipendenze di invio in uscita per adapter canale |
    | `plugin-sdk/outbound-runtime` | Helper per identità in uscita, delegato di invio, sessione, formattazione e pianificazione payload. Gli helper di consegna diretta come `deliverOutboundPayloads` sono substrato di compatibilità deprecato; usa `plugin-sdk/channel-message-runtime` per i nuovi percorsi di invio. |
    | `plugin-sdk/poll-runtime` | Helper mirati di normalizzazione dei poll |
    | `plugin-sdk/thread-bindings-runtime` | Helper per ciclo di vita e adapter dei binding thread |
    | `plugin-sdk/agent-media-payload` | Builder legacy del payload media agente |
    | `plugin-sdk/conversation-runtime` | Helper di binding conversazione/thread, abbinamento e binding configurato |
    | `plugin-sdk/runtime-config-snapshot` | Helper snapshot della configurazione runtime |
    | `plugin-sdk/runtime-group-policy` | Helper di risoluzione della policy gruppi runtime |
    | `plugin-sdk/channel-status` | Helper condivisi per snapshot/riepilogo dello stato canale |
    | `plugin-sdk/channel-config-primitives` | Primitive mirate dello schema di configurazione canale |
    | `plugin-sdk/channel-config-writes` | Helper di autorizzazione alla scrittura della configurazione canale |
    | `plugin-sdk/channel-plugin-common` | Esportazioni prelude condivise dei plugin canale |
    | `plugin-sdk/allowlist-config-edit` | Helper di modifica/lettura della configurazione allowlist |
    | `plugin-sdk/group-access` | Helper condivisi per decisioni di accesso gruppi |
    | `plugin-sdk/direct-dm` | Helper condivisi di autenticazione/guardia per DM diretto |
    | `plugin-sdk/discord` | Facciata di compatibilità Discord deprecata per `@openclaw/discord@2026.3.13` pubblicato e compatibilità del proprietario tracciata; i nuovi plugin devono usare i sottopercorsi generici dell'SDK canale |
    | `plugin-sdk/telegram-account` | Facciata di compatibilità deprecata per la risoluzione account Telegram per compatibilità del proprietario tracciata; i nuovi plugin devono usare helper runtime iniettati o sottopercorsi generici dell'SDK canale |
    | `plugin-sdk/zalouser` | Facciata di compatibilità deprecata Zalo Personal per pacchetti Lark/Zalo pubblicati che importano ancora l'autorizzazione dei comandi del mittente; i nuovi plugin devono usare `plugin-sdk/command-auth` |
    | `plugin-sdk/interactive-runtime` | Helper per presentazione semantica dei messaggi, consegna e risposta interattiva legacy. Vedi [Presentazione dei messaggi](/it/plugins/message-presentation) |
    | `plugin-sdk/channel-inbound` | Barrel di compatibilità per debounce in ingresso, corrispondenza menzioni, helper di policy menzioni e helper envelope |
    | `plugin-sdk/channel-inbound-debounce` | Helper mirati di debounce in ingresso |
    | `plugin-sdk/channel-mention-gating` | Helper mirati per policy menzioni, marker menzione e testo menzione senza la superficie runtime in ingresso più ampia |
    | `plugin-sdk/channel-envelope` | Helper mirati di formattazione envelope in ingresso |
    | `plugin-sdk/channel-location` | Helper per contesto posizione canale e formattazione |
    | `plugin-sdk/channel-logging` | Helper di logging canale per scarti in ingresso e fallimenti di typing/ack |
    | `plugin-sdk/channel-send-result` | Tipi di risultato risposta |
    | `plugin-sdk/channel-actions` | Helper per azioni messaggio canale, più helper deprecati dello schema nativo mantenuti per compatibilità plugin |
    | `plugin-sdk/channel-route` | Helper condivisi di normalizzazione route, risoluzione target guidata da parser, stringificazione thread-id, chiavi route dedupe/compatte, tipi di target analizzati e helper di confronto route/target |
    | `plugin-sdk/channel-targets` | Helper di parsing target; i chiamanti del confronto route devono usare `plugin-sdk/channel-route` |
    | `plugin-sdk/channel-contract` | Tipi di contratto canale |
    | `plugin-sdk/channel-feedback` | Wiring di feedback/reazioni |
    | `plugin-sdk/channel-secret-runtime` | Helper mirati del contratto segreti come `collectSimpleChannelFieldAssignments`, `getChannelSurface`, `pushAssignment` e tipi di target segreto |
  </Accordion>

  <Accordion title="Sottopercorsi del provider">
    | Sottopercorso | Export principali |
    | --- | --- |
    | `plugin-sdk/provider-entry` | `defineSingleProviderPluginEntry` |
    | `plugin-sdk/lmstudio` | Facade provider LM Studio supportata per configurazione, individuazione del catalogo e preparazione dei modelli a runtime |
    | `plugin-sdk/lmstudio-runtime` | Facade runtime LM Studio supportata per impostazioni predefinite del server locale, individuazione dei modelli, intestazioni di richiesta e helper per modelli caricati |
    | `plugin-sdk/provider-setup` | Helper curati per la configurazione di provider locali/self-hosted |
    | `plugin-sdk/self-hosted-provider-setup` | Helper mirati per la configurazione di provider self-hosted compatibili con OpenAI |
    | `plugin-sdk/cli-backend` | Impostazioni predefinite del backend CLI + costanti del watchdog |
    | `plugin-sdk/provider-auth-runtime` | Helper runtime per la risoluzione delle chiavi API per i Plugin provider |
    | `plugin-sdk/provider-auth-api-key` | Helper di onboarding/scrittura profilo per chiavi API, come `upsertApiKeyProfile` |
    | `plugin-sdk/provider-auth-result` | Builder standard del risultato di autenticazione OAuth |
    | `plugin-sdk/provider-env-vars` | Helper per la ricerca delle variabili d'ambiente di autenticazione del provider |
    | `plugin-sdk/provider-auth` | `createProviderApiKeyAuthMethod`, `ensureApiKeyFromOptionEnvOrPrompt`, `upsertAuthProfile`, `upsertApiKeyProfile`, `writeOAuthCredentials`, export di compatibilità deprecato `resolveOpenClawAgentDir` |
    | `plugin-sdk/provider-model-shared` | `ProviderReplayFamily`, `buildProviderReplayFamilyHooks`, `normalizeModelCompat`, builder condivisi di criteri di replay, helper per endpoint provider e helper condivisi di normalizzazione degli ID modello |
    | `plugin-sdk/provider-catalog-runtime` | Hook runtime di arricchimento del catalogo provider e punti di integrazione del registro Plugin-provider per test di contratto |
    | `plugin-sdk/provider-catalog-shared` | `findCatalogTemplate`, `buildSingleProviderApiKeyCatalog`, `buildManifestModelProviderConfig`, `supportsNativeStreamingUsageCompat`, `applyProviderNativeStreamingUsageCompat` |
    | `plugin-sdk/provider-http` | Helper generici per funzionalità HTTP/endpoint del provider, errori HTTP del provider e helper per form multipart di trascrizione audio |
    | `plugin-sdk/provider-web-fetch-contract` | Helper ristretti per contratto di configurazione/selezione web-fetch, come `enablePluginInConfig` e `WebFetchProviderPlugin` |
    | `plugin-sdk/provider-web-fetch` | Helper di registrazione/cache per provider web-fetch |
    | `plugin-sdk/provider-web-search-config-contract` | Helper ristretti per configurazione/credenziali web-search per provider che non richiedono cablaggio di abilitazione Plugin |
    | `plugin-sdk/provider-web-search-contract` | Helper ristretti per contratto di configurazione/credenziali web-search, come `createWebSearchProviderContractFields`, `enablePluginInConfig`, `resolveProviderWebSearchPluginConfig` e setter/getter di credenziali con ambito |
    | `plugin-sdk/provider-web-search` | Helper runtime/registrazione/cache per provider web-search |
    | `plugin-sdk/provider-tools` | `ProviderToolCompatFamily`, `buildProviderToolCompatFamilyHooks` e pulizia schema Gemini + diagnostica |
    | `plugin-sdk/provider-usage` | `fetchClaudeUsage` e simili |
    | `plugin-sdk/provider-stream` | `ProviderStreamFamily`, `buildProviderStreamFamilyHooks`, `composeProviderStreamWrappers`, tipi di wrapper di stream e helper wrapper condivisi Anthropic/Bedrock/DeepSeek V4/Google/Kilocode/Moonshot/OpenAI/OpenRouter/Z.A.I/MiniMax/Copilot |
    | `plugin-sdk/provider-transport-runtime` | Helper di trasporto provider nativi, come fetch protetto, trasformazioni dei messaggi di trasporto e stream di eventi di trasporto scrivibili |
    | `plugin-sdk/provider-onboard` | Helper di patch per configurazione di onboarding |
    | `plugin-sdk/global-singleton` | Helper singleton/map/cache locali al processo |
    | `plugin-sdk/group-activation` | Helper ristretti per modalità di attivazione gruppo e parsing dei comandi |
  </Accordion>

  <Accordion title="Sottopercorsi di autenticazione e sicurezza">
    | Sottopercorso | Export principali |
    | --- | --- |
    | `plugin-sdk/command-auth` | `resolveControlCommandGate`, helper del registro comandi inclusa la formattazione dinamica del menu argomenti, helper per autorizzazione del mittente |
    | `plugin-sdk/command-status` | Builder di messaggi comando/aiuto, come `buildCommandsMessagePaginated` e `buildHelpMessage` |
    | `plugin-sdk/approval-auth-runtime` | Helper per risoluzione degli approvatori e autenticazione azioni nella stessa chat |
    | `plugin-sdk/approval-client-runtime` | Helper nativi per profili/filtri di approvazione exec |
    | `plugin-sdk/approval-delivery-runtime` | Adattatori nativi per funzionalità/consegna delle approvazioni |
    | `plugin-sdk/approval-gateway-runtime` | Helper condiviso di risoluzione Gateway approvazioni |
    | `plugin-sdk/approval-handler-adapter-runtime` | Helper leggeri per caricamento adattatori di approvazione nativi per entrypoint di canale hot |
    | `plugin-sdk/approval-handler-runtime` | Helper runtime più ampi per gestori di approvazione; preferire i punti di integrazione adattatore/Gateway più ristretti quando sono sufficienti |
    | `plugin-sdk/approval-native-runtime` | Helper nativi per target approvazione + associazione account |
    | `plugin-sdk/approval-reply-runtime` | Helper payload di risposta approvazione exec/Plugin |
    | `plugin-sdk/approval-runtime` | Helper payload di approvazione exec/Plugin, helper di routing/runtime per approvazione nativa e helper di visualizzazione strutturata dell'approvazione, come `formatApprovalDisplayPath` |
    | `plugin-sdk/reply-dedupe` | Helper ristretti per reimpostazione deduplicazione delle risposte in ingresso |
    | `plugin-sdk/channel-contract-testing` | Helper ristretti per test del contratto di canale senza il barrel di test ampio |
    | `plugin-sdk/command-auth-native` | Autenticazione nativa dei comandi, formattazione dinamica del menu argomenti e helper nativi per target di sessione |
    | `plugin-sdk/command-detection` | Helper condivisi per rilevamento dei comandi |
    | `plugin-sdk/command-primitives-runtime` | Predicati leggeri sul testo dei comandi per percorsi di canale hot |
    | `plugin-sdk/command-surface` | Normalizzazione del corpo comando e helper per superficie comandi |
    | `plugin-sdk/allow-from` | `formatAllowFromLowercase` |
    | `plugin-sdk/channel-secret-runtime` | Helper ristretti per raccolta del contratto dei segreti per superfici di segreti canale/Plugin |
    | `plugin-sdk/secret-ref-runtime` | Helper ristretti `coerceSecretRef` e tipizzazione SecretRef per parsing contratto segreti/configurazione |
    | `plugin-sdk/security-runtime` | Helper condivisi per trust, gating DM, file/percorsi limitati alla root inclusi scritture solo creazione, sostituzione atomica di file sync/async, scritture temporanee sibling, fallback di spostamento cross-device, helper per file-store privato, guardie parent symlink, contenuti esterni, redazione di testo sensibile, confronto segreti a tempo costante e helper per raccolta segreti |
    | `plugin-sdk/ssrf-policy` | Helper per allowlist host e criteri SSRF per reti private |
    | `plugin-sdk/ssrf-dispatcher` | Helper ristretti per dispatcher con pin senza l'ampia superficie runtime infrastrutturale |
    | `plugin-sdk/ssrf-runtime` | Dispatcher con pin, fetch protetto da SSRF, errore SSRF e helper per criteri SSRF |
    | `plugin-sdk/secret-input` | Helper per parsing input segreto |
    | `plugin-sdk/webhook-ingress` | Helper Webhook per richiesta/target e coercizione raw websocket/body |
    | `plugin-sdk/webhook-request-guards` | Helper per dimensione/timeout del corpo richiesta |
  </Accordion>

  <Accordion title="Sottopercorsi di runtime e archiviazione">
    | Sottopercorso | Esportazioni principali |
    | --- | --- |
    | `plugin-sdk/runtime` | Helper generali per runtime/logging/backup/installazione di plugin |
    | `plugin-sdk/runtime-env` | Helper mirati per ambiente runtime, logger, timeout, tentativi e backoff |
    | `plugin-sdk/browser-config` | Facciata di configurazione browser supportata per profilo/impostazioni predefinite normalizzati, parsing degli URL CDP e helper di autenticazione per il controllo del browser |
    | `plugin-sdk/channel-runtime-context` | Helper generici per registrazione e ricerca del contesto runtime dei canali |
    | `plugin-sdk/matrix` | Facciata di compatibilità Matrix deprecata per pacchetti di canali di terze parti più vecchi; i nuovi plugin devono importare direttamente `plugin-sdk/run-command` |
    | `plugin-sdk/mattermost` | Facciata di compatibilità Mattermost deprecata per pacchetti di canali di terze parti più vecchi; i nuovi plugin devono importare direttamente i sottopercorsi generici dell'SDK |
    | `plugin-sdk/runtime-store` | `createPluginRuntimeStore` |
    | `plugin-sdk/plugin-runtime` | Helper condivisi per comandi/hook/http/interattività dei plugin |
    | `plugin-sdk/hook-runtime` | Helper condivisi per pipeline di hook webhook/interni |
    | `plugin-sdk/lazy-runtime` | Helper per import/binding runtime lazy come `createLazyRuntimeModule`, `createLazyRuntimeMethod` e `createLazyRuntimeSurface` |
    | `plugin-sdk/process-runtime` | Helper per esecuzione di processi |
    | `plugin-sdk/cli-runtime` | Helper per formattazione CLI, attesa, versione, invocazione di argomenti e gruppi di comandi lazy |
    | `plugin-sdk/gateway-runtime` | Client Gateway, helper di avvio client pronto per l'event loop, RPC CLI del Gateway, errori del protocollo Gateway e helper per patch dello stato dei canali |
    | `plugin-sdk/config-contracts` | Superficie di configurazione mirata e solo tipi per forme di configurazione dei plugin come `OpenClawConfig` e tipi di configurazione di canali/provider |
    | `plugin-sdk/plugin-config-runtime` | Helper runtime per ricerca della configurazione dei plugin come `requireRuntimeConfig`, `resolvePluginConfigObject` e `resolveLivePluginConfigObject` |
    | `plugin-sdk/config-mutation` | Helper transazionali per mutazione della configurazione come `mutateConfigFile`, `replaceConfigFile` e `logConfigUpdated` |
    | `plugin-sdk/runtime-config-snapshot` | Helper per snapshot della configurazione del processo corrente come `getRuntimeConfig`, `getRuntimeConfigSnapshot` e setter di snapshot per test |
    | `plugin-sdk/telegram-command-config` | Normalizzazione di nome/descrizione dei comandi Telegram e controlli di duplicati/conflitti, anche quando la superficie del contratto Telegram incluso non è disponibile |
    | `plugin-sdk/text-autolink-runtime` | Rilevamento di autolink per riferimenti a file senza il barrel di testo generale |
    | `plugin-sdk/approval-runtime` | Helper di approvazione per esecuzione/plugin, builder di capability di approvazione, helper auth/profilo, helper di routing/runtime nativi e formattazione strutturata dei percorsi di visualizzazione delle approvazioni |
    | `plugin-sdk/reply-runtime` | Helper runtime condivisi per inbound/risposte, chunking, dispatch, Heartbeat, pianificatore di risposte |
    | `plugin-sdk/reply-dispatch-runtime` | Helper mirati per dispatch/finalizzazione delle risposte e per etichette delle conversazioni |
    | `plugin-sdk/reply-history` | Helper condivisi per cronologia risposte a finestra breve e marcatori come `buildHistoryContext`, `HISTORY_CONTEXT_MARKER`, `recordPendingHistoryEntry` e `clearHistoryEntriesIfEnabled` |
    | `plugin-sdk/reply-reference` | `createReplyReferencePlanner` |
    | `plugin-sdk/reply-chunking` | Helper mirati per chunking di testo/markdown |
    | `plugin-sdk/session-store-runtime` | Helper per percorso dello store sessioni, chiave sessione, updated-at e mutazioni dello store |
    | `plugin-sdk/cron-store-runtime` | Helper per percorso/caricamento/salvataggio dello store Cron |
    | `plugin-sdk/state-paths` | Helper per percorsi di directory State/OAuth |
    | `plugin-sdk/routing` | Helper per route/chiave sessione/binding account come `resolveAgentRoute`, `buildAgentSessionKey` e `resolveDefaultAgentBoundAccountId` |
    | `plugin-sdk/status-helpers` | Helper condivisi per riepilogo stato canale/account, valori predefiniti dello stato runtime e helper per metadati delle issue |
    | `plugin-sdk/target-resolver-runtime` | Helper condivisi per resolver dei target |
    | `plugin-sdk/string-normalization-runtime` | Helper per normalizzazione di slug/stringhe |
    | `plugin-sdk/request-url` | Estrae URL stringa da input simili a fetch/request |
    | `plugin-sdk/run-command` | Runner di comandi temporizzato con risultati stdout/stderr normalizzati |
    | `plugin-sdk/param-readers` | Reader comuni per parametri di strumenti/CLI |
    | `plugin-sdk/tool-payload` | Estrae payload normalizzati da oggetti risultato degli strumenti |
    | `plugin-sdk/tool-send` | Estrae campi canonici del target di invio dagli argomenti dello strumento |
    | `plugin-sdk/temp-path` | Helper condivisi per percorsi di download temporanei e workspace temporanei privati e sicuri |
    | `plugin-sdk/logging-core` | Logger di sottosistema e helper di redazione |
    | `plugin-sdk/markdown-table-runtime` | Helper per modalità tabella Markdown e conversione |
    | `plugin-sdk/model-session-runtime` | Helper per override di modello/sessione come `applyModelOverrideToSessionEntry` e `resolveAgentMaxConcurrent` |
    | `plugin-sdk/talk-config-runtime` | Helper per risoluzione della configurazione del provider Talk |
    | `plugin-sdk/json-store` | Piccoli helper per lettura/scrittura di stato JSON |
    | `plugin-sdk/file-lock` | Helper per file-lock rientrante |
    | `plugin-sdk/persistent-dedupe` | Helper per cache di deduplicazione persistita su disco |
    | `plugin-sdk/acp-runtime` | Helper per runtime/sessione ACP e dispatch delle risposte |
    | `plugin-sdk/acp-runtime-backend` | Helper leggeri per registrazione backend ACP e dispatch delle risposte per plugin caricati all'avvio |
    | `plugin-sdk/acp-binding-resolve-runtime` | Risoluzione binding ACP in sola lettura senza import di avvio del ciclo di vita |
    | `plugin-sdk/agent-config-primitives` | Primitive mirate per schema di configurazione runtime degli agenti |
    | `plugin-sdk/boolean-param` | Reader permissivo per parametri booleani |
    | `plugin-sdk/dangerous-name-runtime` | Helper per risoluzione del matching di nomi pericolosi |
    | `plugin-sdk/device-bootstrap` | Helper per bootstrap del dispositivo e token di pairing |
    | `plugin-sdk/extension-shared` | Primitive helper condivise per canale passivo, stato e proxy ambient |
    | `plugin-sdk/models-provider-runtime` | Helper per risposte di comando/provider `/models` |
    | `plugin-sdk/skill-commands-runtime` | Helper per elenco dei comandi Skill |
    | `plugin-sdk/native-command-registry` | Helper per registry/build/serializzazione dei comandi nativi |
    | `plugin-sdk/agent-harness` | Superficie sperimentale per plugin attendibili per harness agenti di basso livello: tipi di harness, helper per steering/interruzione dell'esecuzione attiva, helper bridge degli strumenti OpenClaw, helper di policy degli strumenti per piani runtime, classificazione esiti del terminale, helper per formattazione/dettaglio dell'avanzamento strumenti e utility per risultati dei tentativi |
    | `plugin-sdk/provider-zai-endpoint` | Facciata deprecata per rilevamento endpoint di proprietà del provider Z.AI; usare l'API pubblica del plugin Z.AI |
    | `plugin-sdk/async-lock-runtime` | Helper per lock asincrono locale al processo per piccoli file di stato runtime |
    | `plugin-sdk/channel-activity-runtime` | Helper per telemetria attività canale |
    | `plugin-sdk/concurrency-runtime` | Helper per concorrenza limitata di attività asincrone |
    | `plugin-sdk/dedupe-runtime` | Helper per cache di deduplicazione in memoria |
    | `plugin-sdk/delivery-queue-runtime` | Helper per drain delle consegne in uscita in sospeso |
    | `plugin-sdk/file-access-runtime` | Helper sicuri per percorsi di file locali e fonti multimediali |
    | `plugin-sdk/heartbeat-runtime` | Helper per risveglio, evento e visibilità Heartbeat |
    | `plugin-sdk/number-runtime` | Helper per coercizione numerica |
    | `plugin-sdk/secure-random-runtime` | Helper per token/UUID sicuri |
    | `plugin-sdk/system-event-runtime` | Helper per coda degli eventi di sistema |
    | `plugin-sdk/transport-ready-runtime` | Helper di attesa della prontezza del transport |
    | `plugin-sdk/infra-runtime` | Shim di compatibilità deprecato; usare i sottopercorsi runtime mirati sopra |
    | `plugin-sdk/collection-runtime` | Piccoli helper per cache limitate |
    | `plugin-sdk/diagnostic-runtime` | Helper per flag diagnostici, eventi e contesto di trace |
    | `plugin-sdk/error-runtime` | Helper per grafo degli errori, formattazione e classificazione condivisa degli errori, `isApprovalNotFoundError` |
    | `plugin-sdk/fetch-runtime` | Fetch wrappato, proxy, opzione EnvHttpProxyAgent e helper per lookup vincolati |
    | `plugin-sdk/runtime-fetch` | Fetch runtime consapevole del dispatcher senza import di proxy/guarded-fetch |
    | `plugin-sdk/response-limit-runtime` | Reader limitato del body della risposta senza la superficie runtime multimediale generale |
    | `plugin-sdk/session-binding-runtime` | Stato di binding della conversazione corrente senza routing del binding configurato o store di pairing |
    | `plugin-sdk/session-store-runtime` | Helper per store sessioni senza import generali di scritture/manutenzione della configurazione |
    | `plugin-sdk/context-visibility-runtime` | Risoluzione della visibilità del contesto e filtro del contesto supplementare senza import generali di configurazione/sicurezza |
    | `plugin-sdk/string-coerce-runtime` | Helper mirati per coercizione e normalizzazione di record/stringhe primitive senza import di markdown/logging |
    | `plugin-sdk/host-runtime` | Helper per normalizzazione di hostname e host SCP |
    | `plugin-sdk/retry-runtime` | Helper per configurazione dei tentativi e runner di tentativi |
    | `plugin-sdk/agent-runtime` | Helper per directory/identità/workspace degli agenti, incluse esportazioni di compatibilità `resolveAgentDir`, `resolveDefaultAgentDir` e `resolveOpenClawAgentDir` deprecata |
    | `plugin-sdk/directory-runtime` | Query/deduplicazione di directory basata su configurazione |
    | `plugin-sdk/keyed-async-queue` | `KeyedAsyncQueue` |
  </Accordion>

  <Accordion title="Sottopercorsi di funzionalità e test">
    | Sottopercorso | Esportazioni chiave |
    | --- | --- |
    | `plugin-sdk/media-runtime` | Helper condivisi per recupero/trasformazione/archiviazione dei media, rilevamento delle dimensioni video basato su ffprobe e builder di payload multimediali |
    | `plugin-sdk/media-mime` | Normalizzazione MIME ristretta, mappatura delle estensioni dei file, rilevamento MIME e helper per il tipo di media |
    | `plugin-sdk/media-store` | Helper ristretti per l'archiviazione dei media, come `saveMediaBuffer` |
    | `plugin-sdk/media-generation-runtime` | Helper condivisi per failover della generazione multimediale, selezione dei candidati e messaggistica per modelli mancanti |
    | `plugin-sdk/media-understanding` | Tipi di provider per la comprensione dei media più esportazioni di helper immagine/audio rivolte ai provider |
    | `plugin-sdk/text-chunking` | Helper per suddivisione/rendering di testo e markdown, conversione di tabelle markdown, rimozione di tag direttiva e utility per testo sicuro |
    | `plugin-sdk/text-chunking` | Helper per la suddivisione del testo in uscita |
    | `plugin-sdk/speech` | Tipi di provider vocali più esportazioni rivolte ai provider per direttive, registro, validazione, builder TTS compatibile con OpenAI e helper vocali |
    | `plugin-sdk/speech-core` | Tipi condivisi di provider vocali, registro, direttiva, normalizzazione ed esportazioni di helper vocali |
    | `plugin-sdk/realtime-transcription` | Tipi di provider per trascrizione in tempo reale, helper di registro e helper condiviso per sessioni WebSocket |
    | `plugin-sdk/realtime-voice` | Tipi di provider vocali in tempo reale e helper di registro |
    | `plugin-sdk/image-generation` | Tipi di provider per generazione di immagini più helper per asset immagine/data URL e builder di provider immagine compatibile con OpenAI |
    | `plugin-sdk/image-generation-core` | Tipi condivisi per generazione di immagini, failover, autenticazione e helper di registro |
    | `plugin-sdk/music-generation` | Tipi di provider/richiesta/risultato per generazione musicale |
    | `plugin-sdk/music-generation-core` | Tipi condivisi per generazione musicale, helper di failover, ricerca provider e parsing di model-ref |
    | `plugin-sdk/video-generation` | Tipi di provider/richiesta/risultato per generazione video |
    | `plugin-sdk/video-generation-core` | Tipi condivisi per generazione video, helper di failover, ricerca provider e parsing di model-ref |
    | `plugin-sdk/webhook-targets` | Registro dei target Webhook e helper di installazione delle route |
    | `plugin-sdk/webhook-path` | Alias di compatibilità deprecato; usa `plugin-sdk/webhook-ingress` |
    | `plugin-sdk/web-media` | Helper condivisi per il caricamento di media remoti/locali |
    | `plugin-sdk/zod` | Riesportazione di compatibilità deprecata; importa `zod` direttamente da `zod` |
    | `plugin-sdk/testing` | Barrel di compatibilità deprecato locale al repository per test OpenClaw legacy. I nuovi test del repository dovrebbero invece importare sottopercorsi di test locali mirati, come `plugin-sdk/agent-runtime-test-contracts`, `plugin-sdk/plugin-test-runtime`, `plugin-sdk/channel-test-helpers`, `plugin-sdk/test-env` o `plugin-sdk/test-fixtures` |
    | `plugin-sdk/plugin-test-api` | Helper minimale locale al repository `createTestPluginApi` per test unitari di registrazione diretta dei plugin senza importare bridge di helper di test del repository |
    | `plugin-sdk/agent-runtime-test-contracts` | Fixture locali al repository per contratti dell'adapter agent-runtime nativo per test di autenticazione, consegna, fallback, tool-hook, prompt-overlay, schema e proiezione del transcript |
    | `plugin-sdk/channel-test-helpers` | Helper di test locali al repository orientati ai canali per contratti generici di azioni/configurazione/stato, asserzioni di directory, ciclo di vita di avvio account, threading send-config, mock runtime, problemi di stato, consegna in uscita e registrazione hook |
    | `plugin-sdk/channel-target-testing` | Suite condivisa locale al repository per casi di errore di risoluzione target nei test dei canali |
    | `plugin-sdk/plugin-test-contracts` | Helper locali al repository per contratti di pacchetto plugin, registrazione, artefatti pubblici, import diretti, API runtime ed effetti collaterali di importazione |
    | `plugin-sdk/provider-test-contracts` | Helper locali al repository per contratti di runtime provider, autenticazione, discovery, onboarding, catalogo, wizard, funzionalità multimediali, policy di replay, audio live STT in tempo reale, ricerca/fetch web e stream |
    | `plugin-sdk/provider-http-test-mocks` | Mock HTTP/autenticazione Vitest opzionali locali al repository per test di provider che esercitano `plugin-sdk/provider-http` |
    | `plugin-sdk/test-fixtures` | Fixture generiche locali al repository per cattura runtime CLI, contesto sandbox, writer di skill, messaggi agente, eventi di sistema, ricaricamento moduli, percorso plugin in bundle, testo terminale, suddivisione in chunk, token di autenticazione e casi tipizzati |
    | `plugin-sdk/test-node-mocks` | Helper di mock mirati per builtin Node locali al repository da usare dentro factory Vitest `vi.mock("node:*")` |
  </Accordion>

  <Accordion title="Sottopercorsi di memoria">
    | Sottopercorso | Esportazioni chiave |
    | --- | --- |
    | `plugin-sdk/memory-core` | Superficie di helper memory-core in bundle per helper di manager/config/file/CLI |
    | `plugin-sdk/memory-core-engine-runtime` | Facade runtime per indice/ricerca memoria |
    | `plugin-sdk/memory-core-host-engine-foundation` | Esportazioni del motore foundation dell'host di memoria |
    | `plugin-sdk/memory-core-host-engine-embeddings` | Contratti di embedding dell'host di memoria, accesso al registro, provider locale e helper generici batch/remoti |
    | `plugin-sdk/memory-core-host-engine-qmd` | Esportazioni del motore QMD dell'host di memoria |
    | `plugin-sdk/memory-core-host-engine-storage` | Esportazioni del motore di archiviazione dell'host di memoria |
    | `plugin-sdk/memory-core-host-multimodal` | Helper multimodali dell'host di memoria |
    | `plugin-sdk/memory-core-host-query` | Helper di query dell'host di memoria |
    | `plugin-sdk/memory-core-host-secret` | Helper per segreti dell'host di memoria |
    | `plugin-sdk/memory-core-host-events` | Alias di compatibilità deprecato; usa `plugin-sdk/memory-host-events` |
    | `plugin-sdk/memory-core-host-status` | Helper di stato dell'host di memoria |
    | `plugin-sdk/memory-core-host-runtime-cli` | Helper runtime CLI dell'host di memoria |
    | `plugin-sdk/memory-core-host-runtime-core` | Helper runtime core dell'host di memoria |
    | `plugin-sdk/memory-core-host-runtime-files` | Helper file/runtime dell'host di memoria |
    | `plugin-sdk/memory-host-core` | Alias vendor-neutral per helper runtime core dell'host di memoria |
    | `plugin-sdk/memory-host-events` | Alias vendor-neutral per helper del journal eventi dell'host di memoria |
    | `plugin-sdk/memory-host-files` | Alias di compatibilità deprecato; usa `plugin-sdk/memory-core-host-runtime-files` |
    | `plugin-sdk/memory-host-markdown` | Helper managed-markdown condivisi per plugin adiacenti alla memoria |
    | `plugin-sdk/memory-host-search` | Facade runtime della memoria attiva per l'accesso al gestore di ricerca |
    | `plugin-sdk/memory-host-status` | Alias di compatibilità deprecato; usa `plugin-sdk/memory-core-host-status` |
  </Accordion>

  <Accordion title="Sottopercorsi riservati per helper in bundle">
    Al momento non ci sono sottopercorsi SDK riservati per helper in bundle. Gli
    helper specifici del proprietario vivono dentro il pacchetto plugin proprietario,
    mentre i contratti host riutilizzabili usano sottopercorsi SDK generici come
    `plugin-sdk/gateway-runtime`,
    `plugin-sdk/security-runtime` e `plugin-sdk/plugin-config-runtime`.
  </Accordion>
</AccordionGroup>

## Correlati

- [Panoramica del Plugin SDK](/it/plugins/sdk-overview)
- [Configurazione del Plugin SDK](/it/plugins/sdk-setup)
- [Creazione di plugin](/it/plugins/building-plugins)
