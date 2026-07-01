---
read_when:
    - Scegliere il sottopercorso plugin-sdk corretto per un'importazione del plugin
    - Verifica dei sottopercorsi dei Plugin in bundle e delle superfici helper
summary: 'Catalogo dei sottopercorsi del Plugin SDK: quali import vivono dove, raggruppati per area'
title: Sottopercorsi del Plugin SDK
x-i18n:
    generated_at: "2026-07-01T08:08:26Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 689af6c9c17eb6b3231c5f445d7de0af97d1a8a087bdbc26640851d4b11ada2b
    source_path: plugins/sdk-subpaths.md
    workflow: 16
---

L'SDK Plugin è esposto come un insieme di sottopercorsi pubblici ristretti sotto
`openclaw/plugin-sdk/`. Questa pagina cataloga i sottopercorsi usati comunemente, raggruppati per
scopo. L'inventario generato dei punti di ingresso del compilatore si trova in
`scripts/lib/plugin-sdk-entrypoints.json`; le esportazioni del pacchetto sono il sottoinsieme pubblico
dopo aver sottratto i sottopercorsi di test/interni locali al repo elencati in
`scripts/lib/plugin-sdk-private-local-only-subpaths.json`. I manutentori possono verificare
il conteggio delle esportazioni pubbliche con `pnpm plugin-sdk:surface` e i sottopercorsi
helper riservati attivi con `pnpm plugins:boundary-report:summary`; le esportazioni
helper riservate inutilizzate fanno fallire il report CI invece di restare nell'SDK pubblico come
debito di compatibilità dormiente.

Per la guida alla creazione di Plugin, consulta [Panoramica dell'SDK Plugin](/it/plugins/sdk-overview).

## Punto di ingresso Plugin

| Sottopercorso                  | Esportazioni principali                                                                                                                                                 |
| ------------------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `plugin-sdk/plugin-entry`      | `definePluginEntry`                                                                                                                                                    |
| `plugin-sdk/core`              | `defineChannelPluginEntry`, `createChatChannelPlugin`, `createChannelPluginBase`, `defineSetupPluginEntry`, `buildChannelConfigSchema`, `buildJsonChannelConfigSchema` |
| `plugin-sdk/config-schema`     | `OpenClawSchema`                                                                                                                                                       |
| `plugin-sdk/provider-entry`    | `defineSingleProviderPluginEntry`                                                                                                                                      |
| `plugin-sdk/migration`         | Helper per elementi del provider di migrazione come `createMigrationItem`, costanti dei motivi, marker di stato degli elementi, helper di redazione e `summarizeMigrationItems` |
| `plugin-sdk/migration-runtime` | Helper di migrazione runtime come `copyMigrationFileItem`, `withCachedMigrationConfigRuntime` e `writeMigrationReport`                                                  |
| `plugin-sdk/health`            | Registrazione, rilevamento, riparazione, selezione, gravità e tipi di finding dei controlli di integrità Doctor per i consumer di integrità in bundle                  |

### Compatibilità deprecata e helper di test

I sottopercorsi deprecati restano esportati per i Plugin meno recenti, ma il nuovo codice dovrebbe usare i
sottopercorsi SDK mirati qui sotto. L'elenco mantenuto è
`scripts/lib/plugin-sdk-deprecated-public-subpaths.json`; la CI rifiuta le
importazioni di produzione in bundle da esso. I barrel ampi come `compat`, `config-types`,
`infra-runtime`, `text-runtime` e `zod` servono solo per compatibilità. Importa `zod`
direttamente da `zod`.

I sottopercorsi helper di test di OpenClaw basati su Vitest sono solo locali al repo e non sono
più esportazioni del pacchetto: `agent-runtime-test-contracts`,
`channel-contract-testing`, `channel-target-testing`, `channel-test-helpers`,
`plugin-test-api`, `plugin-test-contracts`, `plugin-test-runtime`,
`provider-http-test-mocks`, `provider-test-contracts`, `test-env`,
`test-fixtures`, `test-node-mocks` e `testing`.

### Sottopercorsi helper riservati dei Plugin in bundle

Questi sottopercorsi sono superfici di compatibilità di proprietà dei Plugin per il rispettivo
Plugin in bundle proprietario, non API SDK generali: `plugin-sdk/codex-mcp-projection` e
`plugin-sdk/codex-native-task-runtime`. Le importazioni di estensioni tra proprietari diversi sono bloccate
dalle protezioni del contratto del pacchetto.

<AccordionGroup>
  <Accordion title="Sottopercorsi dei canali">
    | Sottopercorso | Esportazioni principali |
    | --- | --- |
    | `plugin-sdk/channel-core` | `defineChannelPluginEntry`, `defineSetupPluginEntry`, `createChatChannelPlugin`, `createChannelPluginBase` |
    | `plugin-sdk/config-schema` | Esportazione dello schema Zod radice di `openclaw.json` (`OpenClawSchema`) |
    | `plugin-sdk/json-schema-runtime` | Helper di convalida JSON Schema con cache per schemi di proprietà dei plugin |
    | `plugin-sdk/channel-setup` | `createOptionalChannelSetupSurface`, `createOptionalChannelSetupAdapter`, `createOptionalChannelSetupWizard`, più `DEFAULT_ACCOUNT_ID`, `createTopLevelChannelDmPolicy`, `setSetupChannelEnabled`, `splitSetupEntries` |
    | `plugin-sdk/setup` | Helper condivisi per la procedura guidata di configurazione, traduttore di configurazione, prompt allowlist, builder dello stato di configurazione |
    | `plugin-sdk/setup-runtime` | `createSetupTranslator`, `createPatchedAccountSetupAdapter`, `createEnvPatchedAccountSetupAdapter`, `createSetupInputPresenceValidator`, `noteChannelLookupFailure`, `noteChannelLookupSummary`, `promptResolvedAllowFrom`, `splitSetupEntries`, `createAllowlistSetupWizardProxy`, `createDelegatedSetupWizardProxy` |
    | `plugin-sdk/setup-adapter-runtime` | Alias di compatibilità deprecato; usa `plugin-sdk/setup-runtime` |
    | `plugin-sdk/setup-tools` | `formatCliCommand`, `detectBinary`, `extractArchive`, `resolveBrewExecutable`, `formatDocsLink`, `CONFIG_DIR` |
    | `plugin-sdk/account-core` | Helper per configurazione multi-account/action-gate, helper di fallback dell'account predefinito |
    | `plugin-sdk/account-id` | `DEFAULT_ACCOUNT_ID`, helper di normalizzazione dell'ID account |
    | `plugin-sdk/account-resolution` | Helper di ricerca account + fallback predefinito |
    | `plugin-sdk/account-helpers` | Helper ristretti per elenco account/azione account |
    | `plugin-sdk/access-groups` | Helper per parsing dell'allowlist dei gruppi di accesso e diagnostica redatta dei gruppi |
    | `plugin-sdk/channel-pairing` | `createChannelPairingController` |
    | `plugin-sdk/channel-reply-pipeline` | Facciata di compatibilità deprecata. Usa `plugin-sdk/channel-outbound`. |
    | `plugin-sdk/channel-config-helpers` | `createHybridChannelConfigAdapter`, `resolveChannelDmAccess`, `resolveChannelDmAllowFrom`, `resolveChannelDmPolicy`, `normalizeChannelDmPolicy`, `normalizeLegacyDmAliases` |
    | `plugin-sdk/channel-config-schema` | Primitive condivise dello schema di configurazione del canale più builder Zod e JSON/TypeBox diretti |
    | `plugin-sdk/bundled-channel-config-schema` | Schemi di configurazione dei canali OpenClaw in bundle solo per plugin in bundle mantenuti |
    | `plugin-sdk/chat-channel-ids` | `BUNDLED_CHAT_CHANNEL_IDS`, `BUNDLED_CHAT_CHANNEL_ENVELOPE_PREFIXES`, `ChatChannelId`. ID canonici dei canali chat in bundle/ufficiali più etichette/alias del formatter per plugin che devono riconoscere testo con prefisso envelope senza hardcodare la propria tabella. |
    | `plugin-sdk/channel-config-schema-legacy` | Alias di compatibilità deprecato per gli schemi di configurazione dei canali in bundle |
    | `plugin-sdk/telegram-command-config` | Helper di normalizzazione/convalida dei comandi personalizzati Telegram con fallback del contratto in bundle |
    | `plugin-sdk/command-gating` | Helper ristretti del gate di autorizzazione dei comandi |
    | `plugin-sdk/channel-policy` | `resolveChannelGroupRequireMention` |
    | `plugin-sdk/channel-ingress` | Facciata di compatibilità deprecata per l'ingresso di canale di basso livello. I nuovi percorsi di ricezione dovrebbero usare `plugin-sdk/channel-ingress-runtime`. |
    | `plugin-sdk/channel-ingress-runtime` | Resolver runtime sperimentale di alto livello per l'ingresso di canale e builder di fatti di route per percorsi di ricezione canale migrati. Preferiscilo all'assemblaggio di allowlist effettive, allowlist dei comandi e proiezioni legacy in ciascun plugin. Vedi [API di ingresso canale](/it/plugins/sdk-channel-ingress). |
    | `plugin-sdk/channel-lifecycle` | Facciata di compatibilità deprecata. Usa `plugin-sdk/channel-outbound`. |
    | `plugin-sdk/channel-outbound` | Contratti del ciclo di vita dei messaggi più opzioni della pipeline di risposta, ricevute, anteprima/streaming live, helper del ciclo di vita, identità in uscita, pianificazione del payload, invii durevoli e helper del contesto di invio messaggi. Vedi [API in uscita del canale](/it/plugins/sdk-channel-outbound). |
    | `plugin-sdk/channel-message` | Alias di compatibilità deprecato per `plugin-sdk/channel-outbound` più facciate legacy di dispatch delle risposte. |
    | `plugin-sdk/channel-message-runtime` | Alias di compatibilità deprecato per `plugin-sdk/channel-outbound` più facciate legacy di dispatch delle risposte. |
    | `plugin-sdk/inbound-envelope` | Helper condivisi per route in ingresso + builder di envelope |
    | `plugin-sdk/inbound-reply-dispatch` | Facciata di compatibilità deprecata. Usa `plugin-sdk/channel-inbound` per runner in ingresso e predicati di dispatch, e `plugin-sdk/channel-outbound` per helper di consegna dei messaggi. |
    | `plugin-sdk/messaging-targets` | Alias di parsing target deprecato; usa `plugin-sdk/channel-targets` |
    | `plugin-sdk/outbound-media` | Helper condivisi per il caricamento di media in uscita e stato dei media ospitati |
    | `plugin-sdk/outbound-send-deps` | Facciata di compatibilità deprecata. Usa `plugin-sdk/channel-outbound`. |
    | `plugin-sdk/outbound-runtime` | Facciata di compatibilità deprecata. Usa `plugin-sdk/channel-outbound`. |
    | `plugin-sdk/poll-runtime` | Helper ristretti di normalizzazione dei poll |
    | `plugin-sdk/thread-bindings-runtime` | Helper per ciclo di vita e adapter dei binding dei thread |
    | `plugin-sdk/agent-media-payload` | Builder legacy del payload media dell'agente |
    | `plugin-sdk/conversation-runtime` | Helper per binding conversazione/thread, pairing e binding configurati |
    | `plugin-sdk/runtime-config-snapshot` | Helper per snapshot della configurazione runtime |
    | `plugin-sdk/runtime-group-policy` | Helper di risoluzione delle policy di gruppo runtime |
    | `plugin-sdk/channel-status` | Helper condivisi per snapshot/riepilogo dello stato del canale |
    | `plugin-sdk/channel-config-primitives` | Primitive ristrette dello schema di configurazione canale |
    | `plugin-sdk/channel-config-writes` | Helper di autorizzazione per scrittura della configurazione canale |
    | `plugin-sdk/channel-plugin-common` | Esportazioni condivise del prelude dei plugin di canale |
    | `plugin-sdk/allowlist-config-edit` | Helper di modifica/lettura della configurazione allowlist |
    | `plugin-sdk/group-access` | Helper condivisi per decisioni di accesso ai gruppi |
    | `plugin-sdk/direct-dm`, `plugin-sdk/direct-dm-access` | Facciate di compatibilità deprecate. Usa `plugin-sdk/channel-inbound`. |
    | `plugin-sdk/direct-dm-guard-policy` | Helper ristretti della policy di guardia direct-DM pre-crypto |
    | `plugin-sdk/discord` | Facciata di compatibilità Discord deprecata per `@openclaw/discord@2026.3.13` pubblicato e compatibilità del proprietario tracciata; i nuovi plugin dovrebbero usare sottopercorsi generici dell'SDK dei canali |
    | `plugin-sdk/telegram-account` | Facciata di compatibilità deprecata per la risoluzione degli account Telegram per compatibilità del proprietario tracciata; i nuovi plugin dovrebbero usare helper runtime iniettati o sottopercorsi generici dell'SDK dei canali |
    | `plugin-sdk/zalouser` | Facciata di compatibilità deprecata per Zalo Personal per pacchetti Lark/Zalo pubblicati che importano ancora l'autorizzazione dei comandi mittente; i nuovi plugin dovrebbero usare `plugin-sdk/command-auth` |
    | `plugin-sdk/interactive-runtime` | Presentazione, consegna e helper legacy per risposte interattive dei messaggi semantici. Vedi [Presentazione dei messaggi](/it/plugins/message-presentation) |
    | `plugin-sdk/channel-inbound` | Helper condivisi in ingresso per classificazione eventi, costruzione del contesto, formattazione, radici, debounce, corrispondenza menzioni, policy di menzione e logging in ingresso |
    | `plugin-sdk/channel-inbound-debounce` | Helper ristretti di debounce in ingresso |
    | `plugin-sdk/channel-mention-gating` | Helper ristretti per policy di menzione, marker di menzione e testo di menzione senza la superficie più ampia del runtime in ingresso |
    | `plugin-sdk/channel-envelope`, `plugin-sdk/channel-inbound-roots`, `plugin-sdk/channel-location`, `plugin-sdk/channel-logging` | Facciate di compatibilità deprecate. Usa `plugin-sdk/channel-inbound` o `plugin-sdk/channel-outbound`. |
    | `plugin-sdk/channel-pairing-paths` | Facciata di compatibilità deprecata. Usa `plugin-sdk/channel-pairing`. |
    | `plugin-sdk/channel-reply-options-runtime` | Facciata di compatibilità deprecata. Usa `plugin-sdk/channel-outbound`. |
    | `plugin-sdk/channel-streaming` | Facciata di compatibilità deprecata. Usa `plugin-sdk/channel-outbound`. |
    | `plugin-sdk/channel-send-result` | Tipi di risultato delle risposte |
    | `plugin-sdk/channel-actions` | Helper per azioni dei messaggi di canale, più helper deprecati dello schema nativo mantenuti per compatibilità dei plugin |
    | `plugin-sdk/channel-route` | Helper condivisi per normalizzazione route, risoluzione target guidata dal parser, stringificazione thread-id, chiavi route deduplicate/compatte, tipi di target parsati e confronto route/target |
    | `plugin-sdk/channel-targets` | Helper di parsing target; i chiamanti del confronto route dovrebbero usare `plugin-sdk/channel-route` |
    | `plugin-sdk/channel-contract` | Tipi di contratto del canale |
    | `plugin-sdk/channel-feedback` | Cablaggio feedback/reazioni |
    | `plugin-sdk/channel-secret-runtime` | Helper ristretti per contratti dei segreti come `collectSimpleChannelFieldAssignments`, `getChannelSurface`, `pushAssignment` e tipi di target segreto |
  </Accordion>

Le famiglie deprecate di helper dei canali restano disponibili solo per
compatibilità con i plugin pubblicati. Il piano di rimozione è: mantenerle per tutta la finestra di migrazione dei plugin esterni, mantenere i plugin del repo/in bundle su `channel-inbound` e
`channel-outbound`, quindi rimuovere i sottopercorsi di compatibilità nella prossima pulizia major
dell'SDK. Questo si applica alle vecchie famiglie di messaggi/runtime dei canali, streaming dei canali, accesso direct-DM, frammentazione degli helper in ingresso, opzioni di risposta
e percorsi di pairing.

  <Accordion title="Provider subpaths">
    | Sottopercorso | Esportazioni principali |
    | --- | --- |
    | `plugin-sdk/provider-entry` | `defineSingleProviderPluginEntry` |
    | `plugin-sdk/lmstudio` | Facciata provider LM Studio supportata per configurazione, scoperta del catalogo e preparazione dei modelli a runtime |
    | `plugin-sdk/lmstudio-runtime` | Facciata runtime LM Studio supportata per impostazioni predefinite del server locale, scoperta dei modelli, intestazioni delle richieste e helper per i modelli caricati |
    | `plugin-sdk/provider-setup` | Helper selezionati per la configurazione di provider locali/self-hosted |
    | `plugin-sdk/self-hosted-provider-setup` | Helper mirati per la configurazione di provider self-hosted compatibili con OpenAI |
    | `plugin-sdk/cli-backend` | Impostazioni predefinite del backend CLI + costanti watchdog |
    | `plugin-sdk/provider-auth-runtime` | Helper runtime per la risoluzione delle chiavi API per i plugin provider |
    | `plugin-sdk/provider-oauth-runtime` | Tipi generici di callback OAuth per provider, rendering della pagina di callback, helper PKCE/stato, parsing dell'input di autorizzazione, helper per scadenza dei token e helper di interruzione |
    | `plugin-sdk/provider-auth-api-key` | Helper per onboarding/scrittura profilo con chiave API, come `upsertApiKeyProfile` |
    | `plugin-sdk/provider-auth-result` | Builder standard del risultato di autenticazione OAuth |
    | `plugin-sdk/provider-env-vars` | Helper di ricerca delle variabili d'ambiente per l'autenticazione dei provider |
    | `plugin-sdk/provider-auth` | `createProviderApiKeyAuthMethod`, `ensureApiKeyFromOptionEnvOrPrompt`, `upsertAuthProfile`, `upsertApiKeyProfile`, `writeOAuthCredentials`, helper di importazione autenticazione OpenAI Codex, esportazione di compatibilità deprecata `resolveOpenClawAgentDir` |
    | `plugin-sdk/provider-model-shared` | `ProviderReplayFamily`, `buildProviderReplayFamilyHooks`, `normalizeModelCompat`, builder condivisi per policy di replay, helper per endpoint provider e helper condivisi di normalizzazione degli ID modello |
    | `plugin-sdk/provider-catalog-live-runtime` | Helper del catalogo modelli provider live per scoperta protetta in stile `/models`: `buildLiveModelProviderConfig`, `fetchLiveProviderModelRows`, `getCachedLiveProviderModelRows`, `fetchLiveProviderModelIds`, `LiveModelCatalogHttpError`, `clearLiveCatalogCacheForTests`, filtro degli ID modello, cache TTL e fallback statico |
    | `plugin-sdk/provider-catalog-runtime` | Hook runtime di arricchimento del catalogo provider e giunti del registro plugin-provider per test di contratto |
    | `plugin-sdk/provider-catalog-shared` | `findCatalogTemplate`, `buildSingleProviderApiKeyCatalog`, `buildManifestModelProviderConfig`, `supportsNativeStreamingUsageCompat`, `applyProviderNativeStreamingUsageCompat` |
    | `plugin-sdk/provider-http` | Helper generici per capacità HTTP/endpoint dei provider, errori HTTP dei provider e helper per moduli multipart di trascrizione audio |
    | `plugin-sdk/provider-web-fetch-contract` | Helper di contratto mirati per configurazione/selezione web-fetch, come `enablePluginInConfig` e `WebFetchProviderPlugin` |
    | `plugin-sdk/provider-web-fetch` | Helper di registrazione/cache per provider web-fetch |
    | `plugin-sdk/provider-web-search-config-contract` | Helper mirati di configurazione/credenziali web-search per provider che non richiedono cablaggio di abilitazione plugin |
    | `plugin-sdk/provider-web-search-contract` | Helper mirati di contratto configurazione/credenziali web-search, come `createWebSearchProviderContractFields`, `enablePluginInConfig`, `resolveProviderWebSearchPluginConfig` e setter/getter di credenziali con ambito |
    | `plugin-sdk/provider-web-search` | Helper di registrazione/cache/runtime per provider web-search |
    | `plugin-sdk/embedding-providers` | Tipi generali di provider embedding e helper di lettura, inclusi `EmbeddingProviderAdapter`, `getEmbeddingProvider(...)` e `listEmbeddingProviders(...)`; i plugin registrano i provider tramite `api.registerEmbeddingProvider(...)` così la proprietà del manifest è applicata |
    | `plugin-sdk/provider-tools` | `ProviderToolCompatFamily`, `buildProviderToolCompatFamilyHooks` e pulizia schema + diagnostica DeepSeek/Gemini/OpenAI |
    | `plugin-sdk/provider-usage` | Tipi di snapshot di utilizzo provider, helper condivisi di recupero utilizzo e fetcher provider come `fetchClaudeUsage` |
    | `plugin-sdk/provider-stream` | `ProviderStreamFamily`, `buildProviderStreamFamilyHooks`, `composeProviderStreamWrappers`, tipi di wrapper stream, compatibilità per chiamate tool in testo semplice e helper wrapper condivisi Anthropic/Bedrock/DeepSeek V4/Google/Kilocode/Moonshot/OpenAI/OpenRouter/Z.A.I/MiniMax/Copilot |
    | `plugin-sdk/provider-stream-shared` | Helper pubblici condivisi per wrapper di stream provider, inclusi `composeProviderStreamWrappers`, `createOpenAICompatibleCompletionsThinkingOffWrapper`, `createPlainTextToolCallCompatWrapper`, `createPayloadPatchStreamWrapper`, `createToolStreamWrapper`, `normalizeOpenAICompatibleReasoningPayload`, `setQwenChatTemplateThinking` e utilità di stream compatibili con Anthropic/DeepSeek/OpenAI |
    | `plugin-sdk/provider-transport-runtime` | Helper nativi di trasporto provider, come fetch protetto, estrazione del testo dei risultati tool, trasformazioni dei messaggi di trasporto e stream di eventi di trasporto scrivibili |
    | `plugin-sdk/provider-onboard` | Helper di patch della configurazione di onboarding |
    | `plugin-sdk/global-singleton` | Helper singleton/map/cache locali al processo |
    | `plugin-sdk/group-activation` | Helper mirati per modalità di attivazione gruppo e parsing dei comandi |
  </Accordion>

Gli snapshot di utilizzo provider normalmente riportano una o più `windows` di quota, ciascuna con
un'etichetta, la percentuale usata e un orario di ripristino opzionale. I provider che espongono testo di saldo o
stato account invece di finestre di quota ripristinabili dovrebbero restituire
`summary` con un array `windows` vuoto, invece di inventare percentuali.
OpenClaw mostra quel testo riepilogativo nell'output di stato; usa `error` solo quando
l'endpoint di utilizzo non è riuscito o non ha restituito dati di utilizzo utilizzabili.

  <Accordion title="Auth and security subpaths">
    | Sottopercorso | Esportazioni principali |
    | --- | --- |
    | `plugin-sdk/command-auth` | `resolveControlCommandGate`, helper del registro comandi inclusa la formattazione dinamica del menu argomenti, helper di autorizzazione mittente |
    | `plugin-sdk/command-status` | Builder di messaggi comando/aiuto come `buildCommandsMessagePaginated` e `buildHelpMessage` |
    | `plugin-sdk/approval-auth-runtime` | Helper per risoluzione approvatore e autenticazione azione nella stessa chat |
    | `plugin-sdk/approval-client-runtime` | Helper nativi per profilo/filtro di approvazione exec |
    | `plugin-sdk/approval-delivery-runtime` | Adattatori nativi di capacità/consegna approvazione |
    | `plugin-sdk/approval-gateway-runtime` | Helper condiviso di risoluzione Gateway approvazione |
    | `plugin-sdk/approval-handler-adapter-runtime` | Helper leggeri di caricamento adattatori nativi di approvazione per entrypoint di canale hot |
    | `plugin-sdk/approval-handler-runtime` | Helper runtime più ampi per gestori di approvazione; preferisci i giunti adattatore/Gateway più mirati quando bastano |
    | `plugin-sdk/approval-native-runtime` | Helper nativi per target di approvazione, associazione account, gate di routing, fallback di inoltro e soppressione del prompt exec nativo locale |
    | `plugin-sdk/approval-reaction-runtime` | Binding hardcoded di reazione approvazione, payload prompt di reazione, archivi target reazione ed esportazione di compatibilità per la soppressione del prompt exec nativo locale |
    | `plugin-sdk/approval-reply-runtime` | Helper per payload di risposta approvazione exec/plugin |
    | `plugin-sdk/approval-runtime` | Helper per payload di approvazione exec/plugin, helper di routing/runtime approvazione nativa e helper di visualizzazione approvazione strutturata come `formatApprovalDisplayPath` |
    | `plugin-sdk/reply-dedupe` | Helper mirati di reset deduplicazione risposte in ingresso |
    | `plugin-sdk/channel-contract-testing` | Helper mirati per test di contratto canale senza l'ampio barrel di testing |
    | `plugin-sdk/command-auth-native` | Autenticazione comandi nativa, formattazione dinamica del menu argomenti e helper nativi per target sessione |
    | `plugin-sdk/command-detection` | Helper condivisi di rilevamento comandi |
    | `plugin-sdk/command-primitives-runtime` | Predicati leggeri sul testo dei comandi per percorsi canale hot |
    | `plugin-sdk/command-surface` | Normalizzazione del corpo comando e helper per superficie comandi |
    | `plugin-sdk/allow-from` | `formatAllowFromLowercase` |
    | `plugin-sdk/channel-secret-runtime` | Helper mirati di raccolta contratto segreti per superfici segrete di canale/plugin |
    | `plugin-sdk/secret-ref-runtime` | Helper mirati per `coerceSecretRef` e tipizzazione SecretRef per parsing contratto/configurazione segreti |
    | `plugin-sdk/secret-provider-integration` | Manifest di integrazione provider SecretRef solo tipi e contratti preset per plugin che pubblicano preset esterni di provider segreti |
    | `plugin-sdk/security-runtime` | Helper condivisi per fiducia, gating DM, file/percorsi vincolati alla root inclusi scritture solo creazione, sostituzione atomica file sync/async, scritture temporanee sibling, fallback di spostamento cross-device, helper privati di file-store, guardie sui genitori di symlink, contenuto esterno, oscuramento testo sensibile, confronto segreti a tempo costante e helper di raccolta segreti |
    | `plugin-sdk/ssrf-policy` | Helper per allowlist host e policy SSRF di rete privata |
    | `plugin-sdk/ssrf-dispatcher` | Helper mirati pinned-dispatcher senza l'ampia superficie runtime infra |
    | `plugin-sdk/ssrf-runtime` | Pinned-dispatcher, fetch protetto da SSRF, errore SSRF e helper di policy SSRF |
    | `plugin-sdk/secret-input` | Helper di parsing input segreto |
    | `plugin-sdk/webhook-ingress` | Helper per richiesta/target Webhook e coercizione raw websocket/body |
    | `plugin-sdk/webhook-request-guards` | Helper per dimensione/timeout del corpo richiesta |
  </Accordion>

  <Accordion title="Sottopercorsi di runtime e archiviazione">
    | Sottopercorso | Esportazioni principali |
    | --- | --- |
    | `plugin-sdk/runtime` | Funzioni di supporto ampie per runtime/logging/backup/installazione dei Plugin |
    | `plugin-sdk/runtime-env` | Funzioni di supporto mirate per ambiente runtime, logger, timeout, tentativi e backoff |
    | `plugin-sdk/browser-config` | Facciata supportata per la configurazione del browser per profilo/predefiniti normalizzati, analisi URL CDP e funzioni di supporto per autenticazione di controllo browser |
    | `plugin-sdk/agent-harness-task-runtime` | Funzioni di supporto generiche per ciclo di vita delle attività e consegna del completamento per agenti basati su harness che usano un ambito attività emesso dall'host |
    | `plugin-sdk/codex-mcp-projection` | Funzione di supporto Codex in bundle riservata per proiettare la configurazione dei server MCP utente nella configurazione dei thread Codex; non per Plugin di terze parti |
    | `plugin-sdk/codex-native-task-runtime` | Funzione di supporto Codex in bundle privata per collegamenti di runtime/mirror attività nativi; non per Plugin di terze parti |
    | `plugin-sdk/channel-runtime-context` | Funzioni di supporto generiche per registrazione e ricerca del contesto runtime dei canali |
    | `plugin-sdk/matrix` | Facciata di compatibilità Matrix deprecata per pacchetti canale di terze parti più vecchi; i nuovi Plugin dovrebbero importare direttamente `plugin-sdk/run-command` |
    | `plugin-sdk/mattermost` | Facciata di compatibilità Mattermost deprecata per pacchetti canale di terze parti più vecchi; i nuovi Plugin dovrebbero importare direttamente sottopercorsi SDK generici |
    | `plugin-sdk/runtime-store` | `createPluginRuntimeStore` |
    | `plugin-sdk/plugin-runtime` | Funzioni di supporto condivise per comandi/hook/http/interattività dei Plugin |
    | `plugin-sdk/hook-runtime` | Funzioni di supporto condivise per pipeline di hook Webhook/interni |
    | `plugin-sdk/lazy-runtime` | Funzioni di supporto per import/binding runtime differiti come `createLazyRuntimeModule`, `createLazyRuntimeMethod` e `createLazyRuntimeSurface` |
    | `plugin-sdk/process-runtime` | Funzioni di supporto per esecuzione processi |
    | `plugin-sdk/cli-runtime` | Funzioni di supporto per formattazione CLI, attesa, versione, invocazione argomenti e gruppi di comandi differiti |
    | `plugin-sdk/qa-live-transport-scenarios` | ID condivisi degli scenari QA per trasporto live, funzioni di supporto per copertura baseline e funzione di supporto per selezione degli scenari |
    | `plugin-sdk/gateway-method-runtime` | Funzione di supporto riservata per dispatch dei metodi Gateway per route HTTP dei Plugin che dichiarano `contracts.gatewayMethodDispatch: ["authenticated-request"]` |
    | `plugin-sdk/gateway-runtime` | Client Gateway, funzione di supporto per avvio client pronto per event loop, RPC CLI Gateway, errori protocollo Gateway e funzioni di supporto per patch dello stato canale |
    | `plugin-sdk/config-contracts` | Superficie di configurazione mirata solo tipi per forme di configurazione dei Plugin come `OpenClawConfig` e tipi di configurazione canale/provider |
    | `plugin-sdk/plugin-config-runtime` | Funzioni di supporto per ricerca runtime della configurazione dei Plugin come `requireRuntimeConfig`, `resolvePluginConfigObject` e `resolveLivePluginConfigObject` |
    | `plugin-sdk/config-mutation` | Funzioni di supporto per mutazione transazionale della configurazione come `mutateConfigFile`, `replaceConfigFile` e `logConfigUpdated` |
    | `plugin-sdk/message-tool-delivery-hints` | Stringhe condivise di suggerimento metadati per consegna message-tool |
    | `plugin-sdk/runtime-config-snapshot` | Funzioni di supporto per snapshot della configurazione del processo corrente come `getRuntimeConfig`, `getRuntimeConfigSnapshot` e setter di snapshot per test |
    | `plugin-sdk/telegram-command-config` | Normalizzazione nome/descrizione dei comandi Telegram e controlli duplicati/conflitti, anche quando la superficie del contratto Telegram in bundle non è disponibile |
    | `plugin-sdk/text-autolink-runtime` | Rilevamento autolink di riferimenti file senza il barrel testuale ampio |
    | `plugin-sdk/approval-reaction-runtime` | Binding hardcoded delle reazioni di approvazione, payload dei prompt di reazione, archivi dei target di reazione ed esportazione di compatibilità per soppressione prompt exec nativo locale |
    | `plugin-sdk/approval-runtime` | Funzioni di supporto per approvazione exec/Plugin, builder di capacità di approvazione, funzioni di supporto auth/profilo, routing/runtime nativi e formattazione dei percorsi di visualizzazione approvazione strutturata |
    | `plugin-sdk/reply-runtime` | Funzioni di supporto runtime condivise inbound/risposta, suddivisione in chunk, dispatch, Heartbeat, pianificatore risposte |
    | `plugin-sdk/reply-dispatch-runtime` | Funzioni di supporto mirate per dispatch/finalizzazione risposte e label conversazione |
    | `plugin-sdk/reply-history` | Funzioni di supporto condivise per cronologia risposte a finestra breve. Il nuovo codice dei turni messaggio dovrebbe usare `createChannelHistoryWindow`; le funzioni di supporto map di livello inferiore restano solo esportazioni di compatibilità deprecate |
    | `plugin-sdk/reply-reference` | `createReplyReferencePlanner` |
    | `plugin-sdk/reply-chunking` | Funzioni di supporto mirate per suddivisione in chunk di testo/markdown |
    | `plugin-sdk/session-store-runtime` | Funzioni di supporto per workflow di sessione (`getSessionEntry`, `listSessionEntries`, `patchSessionEntry`, `upsertSessionEntry`), letture limitate del testo trascritto recente utente/assistente per identità sessione, funzioni di supporto legacy per percorso archivio sessioni/chiave sessione, letture updated-at e funzioni di supporto di compatibilità di transizione solo per intero archivio/percorso file |
    | `plugin-sdk/session-transcript-runtime` | Identità trascrizione, funzioni di supporto target/read/write con ambito, pubblicazione aggiornamenti, lock di scrittura e chiavi hit della memoria trascrizione |
    | `plugin-sdk/sqlite-runtime` | Funzioni di supporto SQLite mirate per schema agente, percorso e transazioni per runtime first-party |
    | `plugin-sdk/cron-store-runtime` | Funzioni di supporto per percorso/caricamento/salvataggio archivio Cron |
    | `plugin-sdk/state-paths` | Funzioni di supporto per percorsi directory stato/OAuth |
    | `plugin-sdk/plugin-state-runtime` | Tipi di stato con chiave SQLite sidecar dei Plugin più configurazione centralizzata per pragma di connessione e manutenzione WAL per database di proprietà dei Plugin |
    | `plugin-sdk/routing` | Funzioni di supporto per route/chiave sessione/binding account come `resolveAgentRoute`, `buildAgentSessionKey` e `resolveDefaultAgentBoundAccountId` |
    | `plugin-sdk/status-helpers` | Funzioni di supporto condivise per riepilogo stato canale/account, predefiniti dello stato runtime e metadati issue |
    | `plugin-sdk/target-resolver-runtime` | Funzioni di supporto condivise per risolutore target |
    | `plugin-sdk/string-normalization-runtime` | Funzioni di supporto per normalizzazione slug/stringhe |
    | `plugin-sdk/request-url` | Estrae URL stringa da input simili a fetch/request |
    | `plugin-sdk/run-command` | Esecutore di comandi temporizzato con risultati stdout/stderr normalizzati |
    | `plugin-sdk/param-readers` | Lettori parametri comuni per tool/CLI |
    | `plugin-sdk/tool-plugin` | Definisce un semplice Plugin agent-tool tipizzato ed espone metadati statici per la generazione del manifest |
    | `plugin-sdk/tool-payload` | Estrae payload normalizzati dagli oggetti risultato dei tool |
    | `plugin-sdk/tool-send` | Estrae campi target di invio canonici dagli argomenti dei tool |
    | `plugin-sdk/sandbox` | Tipi backend sandbox e funzioni di supporto per comandi SSH/OpenShell, inclusa preflight fail-fast del comando exec |
    | `plugin-sdk/temp-path` | Funzioni di supporto condivise per percorsi di download temporanei e workspace temporanei sicuri privati |
    | `plugin-sdk/logging-core` | Logger di sottosistema e funzioni di supporto per redazione |
    | `plugin-sdk/markdown-table-runtime` | Funzioni di supporto per modalità tabella Markdown e conversione |
    | `plugin-sdk/model-session-runtime` | Funzioni di supporto per override modello/sessione come `applyModelOverrideToSessionEntry` e `resolveAgentMaxConcurrent` |
    | `plugin-sdk/talk-config-runtime` | Funzioni di supporto per risoluzione configurazione provider Talk |
    | `plugin-sdk/json-store` | Piccole funzioni di supporto per lettura/scrittura stato JSON |
    | `plugin-sdk/json-unsafe-integers` | Funzioni di supporto per parsing JSON che preservano letterali interi non sicuri come stringhe |
    | `plugin-sdk/file-lock` | Funzioni di supporto per file-lock rientranti |
    | `plugin-sdk/persistent-dedupe` | Funzioni di supporto per cache di dedupe persistita su disco |
    | `plugin-sdk/acp-runtime` | Funzioni di supporto per runtime/sessione ACP e dispatch risposte |
    | `plugin-sdk/acp-runtime-backend` | Funzioni di supporto leggere per registrazione backend ACP e dispatch risposte per Plugin caricati all'avvio |
    | `plugin-sdk/acp-binding-resolve-runtime` | Risoluzione binding ACP in sola lettura senza import di avvio lifecycle |
    | `plugin-sdk/agent-config-primitives` | Primitive mirate per schema di configurazione runtime agente |
    | `plugin-sdk/boolean-param` | Lettore parametri booleani permissivo |
    | `plugin-sdk/dangerous-name-runtime` | Funzioni di supporto per risoluzione matching di nomi pericolosi |
    | `plugin-sdk/device-bootstrap` | Funzioni di supporto per bootstrap dispositivo e token di abbinamento |
    | `plugin-sdk/extension-shared` | Primitive condivise di supporto per canali passivi, stato e proxy ambientale |
    | `plugin-sdk/models-provider-runtime` | Funzioni di supporto per risposte comando/provider `/models` |
    | `plugin-sdk/skill-commands-runtime` | Funzioni di supporto per elenco comandi Skills |
    | `plugin-sdk/native-command-registry` | Funzioni di supporto per registro/build/serializzazione comandi nativi |
    | `plugin-sdk/agent-harness` | Superficie sperimentale per Plugin attendibili per harness agente di basso livello: tipi harness, funzioni di supporto steer/abort per active-run, funzioni di supporto bridge tool OpenClaw, funzioni di supporto policy tool del piano runtime, classificazione esito terminale, funzioni di supporto per formattazione/dettaglio avanzamento tool e utilità risultato tentativo |
    | `plugin-sdk/provider-zai-endpoint` | Facciata deprecata di rilevamento endpoint di proprietà del provider Z.AI; usa l'API pubblica del Plugin Z.AI |
    | `plugin-sdk/async-lock-runtime` | Funzione di supporto lock asincrono locale al processo per piccoli file di stato runtime |
    | `plugin-sdk/channel-activity-runtime` | Funzione di supporto per telemetria attività canale |
    | `plugin-sdk/concurrency-runtime` | Funzione di supporto per concorrenza limitata di attività asincrone |
    | `plugin-sdk/dedupe-runtime` | Funzioni di supporto per cache dedupe in memoria |
    | `plugin-sdk/delivery-queue-runtime` | Funzione di supporto per svuotamento consegne in uscita pendenti |
    | `plugin-sdk/file-access-runtime` | Funzioni di supporto sicure per percorsi file locali e sorgenti multimediali |
    | `plugin-sdk/heartbeat-runtime` | Funzioni di supporto per wake, evento e visibilità Heartbeat |
    | `plugin-sdk/number-runtime` | Funzione di supporto per coercizione numerica |
    | `plugin-sdk/secure-random-runtime` | Funzioni di supporto per token/UUID sicuri |
    | `plugin-sdk/system-event-runtime` | Funzioni di supporto per coda eventi di sistema |
    | `plugin-sdk/transport-ready-runtime` | Funzione di supporto per attesa readiness del trasporto |
    | `plugin-sdk/exec-approvals-runtime` | Funzioni di supporto per file policy approvazioni exec senza il barrel infra-runtime ampio |
    | `plugin-sdk/infra-runtime` | Shim di compatibilità deprecato; usa i sottopercorsi runtime mirati sopra |
    | `plugin-sdk/collection-runtime` | Piccole funzioni di supporto per cache limitate |
    | `plugin-sdk/diagnostic-runtime` | Funzioni di supporto per flag diagnostici, eventi e contesto di traccia |
    | `plugin-sdk/error-runtime` | Grafo errori, formattazione, funzioni di supporto condivise per classificazione errori, `isApprovalNotFoundError` |
    | `plugin-sdk/fetch-runtime` | Fetch wrappato, proxy, opzione EnvHttpProxyAgent e funzioni di supporto per lookup fissato |
    | `plugin-sdk/runtime-fetch` | Fetch runtime consapevole del dispatcher senza import proxy/guarded-fetch |
    | `plugin-sdk/inline-image-data-url-runtime` | Sanitizzatore URL dati immagine inline e funzioni di supporto per sniffing firma senza la superficie runtime media ampia |
    | `plugin-sdk/response-limit-runtime` | Lettore limitato del corpo risposta senza la superficie runtime media ampia |
    | `plugin-sdk/session-binding-runtime` | Stato binding conversazione corrente senza routing binding configurato o archivi pairing |
    | `plugin-sdk/session-store-runtime` | Funzioni di supporto per session-store senza import ampi di scritture/manutenzione configurazione |
    | `plugin-sdk/sqlite-runtime` | Funzioni di supporto SQLite mirate per schema agente, percorso e transazioni senza controlli del ciclo di vita database |
    | `plugin-sdk/context-visibility-runtime` | Risoluzione visibilità contesto e filtraggio contesto supplementare senza import ampi di configurazione/sicurezza |
    | `plugin-sdk/string-coerce-runtime` | Funzioni di supporto mirate per coercizione e normalizzazione di record primitivi/stringhe senza import markdown/logging |
    | `plugin-sdk/host-runtime` | Funzioni di supporto per normalizzazione hostname e host SCP |
    | `plugin-sdk/retry-runtime` | Funzioni di supporto per configurazione retry ed esecutore retry |
    | `plugin-sdk/agent-runtime` | Funzioni di supporto per directory/identità/workspace agente, incluse `resolveAgentDir`, `resolveDefaultAgentDir` ed esportazione di compatibilità deprecata `resolveOpenClawAgentDir` |
    | `plugin-sdk/directory-runtime` | Query/dedup directory basata su configurazione |
    | `plugin-sdk/keyed-async-queue` | `KeyedAsyncQueue` |
  </Accordion>

  <Accordion title="Sottopercorsi di funzionalità e test">
    | Sottopercorso | Esportazioni principali |
    | --- | --- |
    | `plugin-sdk/media-runtime` | Helper condivisi per recuperare/trasformare/archiviare media, inclusi `saveRemoteMedia`, `saveResponseMedia`, `readRemoteMediaBuffer` e il deprecato `fetchRemoteMedia`; preferisci gli helper di archiviazione prima delle letture del buffer quando un URL deve diventare un media OpenClaw |
    | `plugin-sdk/media-mime` | Normalizzazione MIME mirata, mappatura delle estensioni file, rilevamento MIME e helper per il tipo di media |
    | `plugin-sdk/media-store` | Helper mirati per l'archivio media, come `saveMediaBuffer` e `saveMediaStream` |
    | `plugin-sdk/media-generation-runtime` | Helper condivisi per il failover della generazione di media, selezione dei candidati e messaggistica per modelli mancanti |
    | `plugin-sdk/media-understanding` | Tipi di provider per la comprensione dei media più esportazioni di helper rivolti ai provider per immagini/audio/estrazione strutturata |
    | `plugin-sdk/text-chunking` | Helper per suddivisione/rendering di testo e markdown, conversione di tabelle markdown, rimozione di tag direttiva e utilità per testo sicuro |
    | `plugin-sdk/text-chunking` | Helper per la suddivisione del testo in uscita |
    | `plugin-sdk/speech` | Tipi di provider speech più esportazioni rivolte ai provider per direttive, registro, validazione, builder TTS compatibile con OpenAI e helper speech |
    | `plugin-sdk/speech-core` | Tipi di provider speech condivisi, registro, direttiva, normalizzazione ed esportazioni di helper speech |
    | `plugin-sdk/realtime-transcription` | Tipi di provider per trascrizione in tempo reale, helper di registro e helper condiviso per sessioni WebSocket |
    | `plugin-sdk/realtime-bootstrap-context` | Helper di bootstrap del profilo in tempo reale per l'iniezione delimitata del contesto `IDENTITY.md`, `USER.md` e `SOUL.md` |
    | `plugin-sdk/realtime-voice` | Tipi di provider voce in tempo reale, helper di registro e helper condivisi per il comportamento voce in tempo reale, incluso il tracciamento dell'attività di output |
    | `plugin-sdk/image-generation` | Tipi di provider per generazione di immagini più helper per asset immagine/data URL e il builder di provider immagini compatibile con OpenAI |
    | `plugin-sdk/image-generation-core` | Tipi condivisi di generazione immagini, failover, auth e helper di registro |
    | `plugin-sdk/music-generation` | Tipi di provider/richiesta/risultato per generazione musicale |
    | `plugin-sdk/music-generation-core` | Tipi condivisi di generazione musicale, helper di failover, ricerca provider e parsing di model-ref |
    | `plugin-sdk/video-generation` | Tipi di provider/richiesta/risultato per generazione video |
    | `plugin-sdk/video-generation-core` | Tipi condivisi di generazione video, helper di failover, ricerca provider e parsing di model-ref |
    | `plugin-sdk/transcripts` | Tipi condivisi di provider sorgente per trascrizioni, helper di registro, descrittori di sessione e metadati degli enunciati |
    | `plugin-sdk/webhook-targets` | Registro dei target Webhook e helper per l'installazione delle route |
    | `plugin-sdk/webhook-path` | Alias di compatibilità deprecato; usa `plugin-sdk/webhook-ingress` |
    | `plugin-sdk/web-media` | Helper condivisi per il caricamento di media remoti/locali |
    | `plugin-sdk/zod` | Riesportazione di compatibilità deprecata; importa `zod` direttamente da `zod` |
    | `plugin-sdk/testing` | Barrel di compatibilità deprecato locale al repo per test OpenClaw legacy. I nuovi test del repo dovrebbero invece importare sottopercorsi di test locali focalizzati, come `plugin-sdk/agent-runtime-test-contracts`, `plugin-sdk/plugin-test-runtime`, `plugin-sdk/channel-test-helpers`, `plugin-sdk/test-env` o `plugin-sdk/test-fixtures` |
    | `plugin-sdk/plugin-test-api` | Helper minimo `createTestPluginApi` locale al repo per test unitari di registrazione diretta dei plugin senza importare bridge degli helper di test del repo |
    | `plugin-sdk/agent-runtime-test-contracts` | Fixture dei contratti dell'adapter agent-runtime nativo locale al repo per test di auth, consegna, fallback, tool-hook, prompt-overlay, schema e proiezione della trascrizione |
    | `plugin-sdk/channel-test-helpers` | Helper di test orientati ai canali, locali al repo, per contratti generici di azioni/setup/stato, asserzioni di directory, ciclo di vita dell'avvio account, threading della configurazione di invio, mock runtime, problemi di stato, consegna in uscita e registrazione hook |
    | `plugin-sdk/channel-target-testing` | Suite condivisa locale al repo per casi di errore nella risoluzione dei target per test dei canali |
    | `plugin-sdk/plugin-test-contracts` | Helper locali al repo per contratti su pacchetto plugin, registrazione, artefatto pubblico, import diretto, API runtime ed effetti collaterali dell'import |
    | `plugin-sdk/provider-test-contracts` | Helper locali al repo per contratti su runtime provider, auth, discovery, onboarding, catalogo, wizard, funzionalità media, policy di replay, audio live STT in tempo reale, web-search/fetch e stream |
    | `plugin-sdk/provider-http-test-mocks` | Mock HTTP/auth Vitest opt-in locali al repo per test provider che esercitano `plugin-sdk/provider-http` |
    | `plugin-sdk/test-fixtures` | Fixture generiche locali al repo per cattura runtime CLI, contesto sandbox, writer di skill, agent-message, system-event, ricaricamento moduli, percorso plugin integrato, terminal-text, chunking, auth-token e casi tipizzati |
    | `plugin-sdk/test-node-mocks` | Helper di mock mirati per builtin Node, locali al repo, da usare dentro factory Vitest `vi.mock("node:*")` |
  </Accordion>

  <Accordion title="Sottopercorsi della memoria">
    | Sottopercorso | Esportazioni principali |
    | --- | --- |
    | `plugin-sdk/memory-core` | Superficie di helper memory-core integrata per helper manager/config/file/CLI |
    | `plugin-sdk/memory-core-engine-runtime` | Facciata runtime per indice/ricerca della memoria |
    | `plugin-sdk/memory-core-host-embedding-registry` | Helper leggeri per il registro dei provider di embedding della memoria |
    | `plugin-sdk/memory-core-host-engine-foundation` | Esportazioni del motore foundation dell'host memoria |
    | `plugin-sdk/memory-core-host-engine-embeddings` | Contratti di embedding dell'host memoria, accesso al registro, provider locale e helper generici batch/remoti. `registerMemoryEmbeddingProvider` su questa superficie è deprecato; usa l'API generica dei provider di embedding per i nuovi provider. |
    | `plugin-sdk/memory-core-host-engine-qmd` | Esportazioni del motore QMD dell'host memoria |
    | `plugin-sdk/memory-core-host-engine-storage` | Esportazioni del motore di archiviazione dell'host memoria |
    | `plugin-sdk/memory-core-host-multimodal` | Helper multimodali dell'host memoria |
    | `plugin-sdk/memory-core-host-query` | Helper di query dell'host memoria |
    | `plugin-sdk/memory-core-host-secret` | Helper per segreti dell'host memoria |
    | `plugin-sdk/memory-core-host-events` | Alias di compatibilità deprecato; usa `plugin-sdk/memory-host-events` |
    | `plugin-sdk/memory-core-host-status` | Helper di stato dell'host memoria |
    | `plugin-sdk/memory-core-host-runtime-cli` | Helper runtime CLI dell'host memoria |
    | `plugin-sdk/memory-core-host-runtime-core` | Helper runtime core dell'host memoria |
    | `plugin-sdk/memory-core-host-runtime-files` | Helper file/runtime dell'host memoria |
    | `plugin-sdk/memory-host-core` | Alias indipendente dal vendor per gli helper runtime core dell'host memoria |
    | `plugin-sdk/memory-host-events` | Alias indipendente dal vendor per gli helper del journal eventi dell'host memoria |
    | `plugin-sdk/memory-host-files` | Alias di compatibilità deprecato; usa `plugin-sdk/memory-core-host-runtime-files` |
    | `plugin-sdk/memory-host-markdown` | Helper condivisi per markdown gestito per plugin adiacenti alla memoria |
    | `plugin-sdk/memory-host-search` | Facciata runtime Active Memory per l'accesso al gestore di ricerca |
    | `plugin-sdk/memory-host-status` | Alias di compatibilità deprecato; usa `plugin-sdk/memory-core-host-status` |
  </Accordion>

  <Accordion title="Sottopercorsi helper integrati riservati">
    I sottopercorsi SDK helper integrati riservati sono superfici ristrette specifiche del proprietario per
    codice di plugin integrato. Sono tracciati nell'inventario SDK affinché le build
    dei pacchetti e gli alias restino deterministici, ma non sono API generali
    per la creazione di plugin. I nuovi contratti host riutilizzabili dovrebbero usare sottopercorsi SDK generici
    come `plugin-sdk/gateway-runtime`, `plugin-sdk/security-runtime` e
    `plugin-sdk/plugin-config-runtime`.

    | Sottopercorso | Proprietario e scopo |
    | --- | --- |
    | `plugin-sdk/codex-mcp-projection` | Helper del plugin Codex integrato per proiettare la configurazione server MCP dell'utente nella configurazione thread dell'app-server Codex |
    | `plugin-sdk/codex-native-task-runtime` | Helper del plugin Codex integrato per rispecchiare i subagenti nativi dell'app-server Codex nello stato delle attività OpenClaw |

  </Accordion>
</AccordionGroup>

## Correlati

- [Panoramica Plugin SDK](/it/plugins/sdk-overview)
- [Configurazione Plugin SDK](/it/plugins/sdk-setup)
- [Creare plugin](/it/plugins/building-plugins)
