---
read_when:
    - Scegliere il sottopercorso plugin-sdk corretto per l'importazione di un Plugin
    - Verifica dei sottopercorsi dei plugin integrati e delle superfici helper
summary: 'Catalogo dei sottopercorsi del Plugin SDK: quali import risiedono dove, raggruppati per area'
title: Sottopercorsi del Plugin SDK
x-i18n:
    generated_at: "2026-07-01T20:23:19Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: d67ec0c9d837fa23a80abe46e5bab981e82e6c7a29cfbf84ff47a9eca5cc582f
    source_path: plugins/sdk-subpaths.md
    workflow: 16
---

L'SDK per Plugin è esposto come un insieme di sottopercorsi pubblici ristretti sotto
`openclaw/plugin-sdk/`. Questa pagina cataloga i sottopercorsi usati comunemente, raggruppati per
scopo. L'inventario generato degli entrypoint del compilatore si trova in
`scripts/lib/plugin-sdk-entrypoints.json`; gli export del pacchetto sono il sottoinsieme pubblico
dopo aver sottratto i sottopercorsi di test/interni locali al repo elencati in
`scripts/lib/plugin-sdk-private-local-only-subpaths.json`. I maintainer possono verificare
il conteggio degli export pubblici con `pnpm plugin-sdk:surface` e i sottopercorsi helper
riservati attivi con `pnpm plugins:boundary-report:summary`; gli export helper riservati
inutilizzati fanno fallire il report CI invece di restare nell'SDK pubblico come
debito di compatibilità dormiente.

Per la guida alla creazione di Plugin, consulta [Panoramica dell'SDK per Plugin](/it/plugins/sdk-overview).

## Ingresso del Plugin

| Sottopercorso                  | Export principali                                                                                                                                                      |
| ------------------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `plugin-sdk/plugin-entry`      | `definePluginEntry`                                                                                                                                                    |
| `plugin-sdk/core`              | `defineChannelPluginEntry`, `createChatChannelPlugin`, `createChannelPluginBase`, `defineSetupPluginEntry`, `buildChannelConfigSchema`, `buildJsonChannelConfigSchema` |
| `plugin-sdk/config-schema`     | `OpenClawSchema`                                                                                                                                                       |
| `plugin-sdk/provider-entry`    | `defineSingleProviderPluginEntry`                                                                                                                                      |
| `plugin-sdk/migration`         | Helper per elementi del provider di migrazione come `createMigrationItem`, costanti di motivo, marcatori di stato degli elementi, helper di redazione e `summarizeMigrationItems` |
| `plugin-sdk/migration-runtime` | Helper di migrazione runtime come `copyMigrationFileItem`, `withCachedMigrationConfigRuntime` e `writeMigrationReport`                                                |
| `plugin-sdk/health`            | Registrazione di controlli di integrità Doctor, rilevamento, riparazione, selezione, gravità e tipi di risultati per i consumer di integrità in bundle                 |

### Compatibilità deprecata e helper di test

I sottopercorsi deprecati restano esportati per i Plugin meno recenti, ma il nuovo codice dovrebbe usare i
sottopercorsi SDK mirati qui sotto. L'elenco mantenuto è
`scripts/lib/plugin-sdk-deprecated-public-subpaths.json`; la CI rifiuta gli import di produzione
in bundle da tale elenco. I barrel ampi come `compat`, `config-types`,
`infra-runtime`, `text-runtime` e `zod` sono solo per compatibilità. Importa `zod`
direttamente da `zod`.

I sottopercorsi degli helper di test di OpenClaw basati su Vitest sono solo locali al repo e non sono
più export del pacchetto: `agent-runtime-test-contracts`,
`channel-contract-testing`, `channel-target-testing`, `channel-test-helpers`,
`plugin-test-api`, `plugin-test-contracts`, `plugin-test-runtime`,
`provider-http-test-mocks`, `provider-test-contracts`, `test-env`,
`test-fixtures`, `test-node-mocks` e `testing`.

### Sottopercorsi helper riservati dei Plugin in bundle

Questi sottopercorsi sono superfici di compatibilità di proprietà del Plugin per il rispettivo Plugin
in bundle proprietario, non API SDK generali: `plugin-sdk/codex-mcp-projection` e
`plugin-sdk/codex-native-task-runtime`. Gli import di estensioni tra proprietari diversi sono bloccati
dalle protezioni del contratto di pacchetto.

<AccordionGroup>
  <Accordion title="Sottopercorsi dei canali">
    | Sottopercorso | Esportazioni principali |
    | --- | --- |
    | `plugin-sdk/channel-core` | `defineChannelPluginEntry`, `defineSetupPluginEntry`, `createChatChannelPlugin`, `createChannelPluginBase` |
    | `plugin-sdk/config-schema` | Esportazione dello schema Zod radice di `openclaw.json` (`OpenClawSchema`) |
    | `plugin-sdk/json-schema-runtime` | Funzione di supporto con cache per la validazione JSON Schema per schemi di proprietà del Plugin |
    | `plugin-sdk/channel-setup` | `createOptionalChannelSetupSurface`, `createOptionalChannelSetupAdapter`, `createOptionalChannelSetupWizard`, più `DEFAULT_ACCOUNT_ID`, `createTopLevelChannelDmPolicy`, `setSetupChannelEnabled`, `splitSetupEntries` |
    | `plugin-sdk/setup` | Funzioni di supporto condivise per la procedura guidata di configurazione, traduttore di configurazione, prompt per allowlist, costruttori dello stato di configurazione |
    | `plugin-sdk/setup-runtime` | `createSetupTranslator`, `createPatchedAccountSetupAdapter`, `createEnvPatchedAccountSetupAdapter`, `createSetupInputPresenceValidator`, `noteChannelLookupFailure`, `noteChannelLookupSummary`, `promptResolvedAllowFrom`, `splitSetupEntries`, `createAllowlistSetupWizardProxy`, `createDelegatedSetupWizardProxy` |
    | `plugin-sdk/setup-adapter-runtime` | Alias di compatibilità deprecato; usa `plugin-sdk/setup-runtime` |
    | `plugin-sdk/setup-tools` | `formatCliCommand`, `detectBinary`, `extractArchive`, `resolveBrewExecutable`, `formatDocsLink`, `CONFIG_DIR` |
    | `plugin-sdk/account-core` | Funzioni di supporto per configurazione multi-account e gate delle azioni, funzioni di supporto per ripiego sull’account predefinito |
    | `plugin-sdk/account-id` | `DEFAULT_ACCOUNT_ID`, funzioni di supporto per la normalizzazione degli ID account |
    | `plugin-sdk/account-resolution` | Funzioni di supporto per ricerca dell’account e ripiego predefinito |
    | `plugin-sdk/account-helpers` | Funzioni di supporto ristrette per elenco account e azioni account |
    | `plugin-sdk/access-groups` | Funzioni di supporto per parsing delle allowlist dei gruppi di accesso e diagnostica redatta dei gruppi |
    | `plugin-sdk/channel-pairing` | `createChannelPairingController` |
    | `plugin-sdk/channel-reply-pipeline` | Facciata di compatibilità deprecata. Usa `plugin-sdk/channel-outbound`. |
    | `plugin-sdk/channel-config-helpers` | `createHybridChannelConfigAdapter`, `resolveChannelDmAccess`, `resolveChannelDmAllowFrom`, `resolveChannelDmPolicy`, `normalizeChannelDmPolicy`, `normalizeLegacyDmAliases` |
    | `plugin-sdk/channel-config-schema` | Primitive condivise per lo schema di configurazione dei canali più costruttori Zod e JSON/TypeBox diretti |
    | `plugin-sdk/bundled-channel-config-schema` | Schemi di configurazione dei canali OpenClaw inclusi solo per i Plugin inclusi mantenuti |
    | `plugin-sdk/chat-channel-ids` | `BUNDLED_CHAT_CHANNEL_IDS`, `BUNDLED_CHAT_CHANNEL_ENVELOPE_PREFIXES`, `ChatChannelId`. ID canonici dei canali chat inclusi/ufficiali più etichette/alias del formattatore per i Plugin che devono riconoscere testo con prefisso di envelope senza codificare una propria tabella. |
    | `plugin-sdk/channel-config-schema-legacy` | Alias di compatibilità deprecato per gli schemi di configurazione dei canali inclusi |
    | `plugin-sdk/telegram-command-config` | Funzioni di supporto per normalizzazione/validazione dei comandi personalizzati Telegram con ripiego al contratto incluso |
    | `plugin-sdk/command-gating` | Funzioni di supporto ristrette per il gate di autorizzazione dei comandi |
    | `plugin-sdk/channel-policy` | `resolveChannelGroupRequireMention` |
    | `plugin-sdk/channel-ingress` | Facciata di compatibilità deprecata per ingresso canale di basso livello. I nuovi percorsi di ricezione dovrebbero usare `plugin-sdk/channel-ingress-runtime`. |
    | `plugin-sdk/channel-ingress-runtime` | Resolver runtime sperimentale di alto livello per ingresso canale e costruttori di fatti di route per percorsi di ricezione canale migrati. Preferiscilo all’assemblaggio di allowlist effettive, allowlist di comandi e proiezioni legacy in ogni Plugin. Vedi [API di ingresso canale](/it/plugins/sdk-channel-ingress). |
    | `plugin-sdk/channel-lifecycle` | Facciata di compatibilità deprecata. Usa `plugin-sdk/channel-outbound`. |
    | `plugin-sdk/channel-outbound` | Contratti del ciclo di vita dei messaggi più opzioni della pipeline di risposta, ricevute, anteprima/streaming live, funzioni di supporto del ciclo di vita, identità in uscita, pianificazione del payload, invii durevoli e funzioni di supporto per il contesto di invio messaggio. Vedi [API di uscita canale](/it/plugins/sdk-channel-outbound). |
    | `plugin-sdk/channel-message` | Alias di compatibilità deprecato per `plugin-sdk/channel-outbound` più facciate legacy di dispatch delle risposte. |
    | `plugin-sdk/channel-message-runtime` | Alias di compatibilità deprecato per `plugin-sdk/channel-outbound` più facciate legacy di dispatch delle risposte. |
    | `plugin-sdk/inbound-envelope` | Funzioni di supporto condivise per route in ingresso e costruttore di envelope |
    | `plugin-sdk/inbound-reply-dispatch` | Facciata di compatibilità deprecata. Usa `plugin-sdk/channel-inbound` per runner in ingresso e predicati di dispatch, e `plugin-sdk/channel-outbound` per funzioni di supporto alla consegna dei messaggi. |
    | `plugin-sdk/messaging-targets` | Alias deprecato per il parsing dei target; usa `plugin-sdk/channel-targets` |
    | `plugin-sdk/outbound-media` | Funzioni di supporto condivise per caricamento dei media in uscita e stato dei media ospitati |
    | `plugin-sdk/outbound-send-deps` | Facciata di compatibilità deprecata. Usa `plugin-sdk/channel-outbound`. |
    | `plugin-sdk/outbound-runtime` | Facciata di compatibilità deprecata. Usa `plugin-sdk/channel-outbound`. |
    | `plugin-sdk/poll-runtime` | Funzioni di supporto ristrette per la normalizzazione dei sondaggi |
    | `plugin-sdk/thread-bindings-runtime` | Ciclo di vita dei binding dei thread e funzioni di supporto per adapter |
    | `plugin-sdk/agent-media-payload` | Costruttore legacy del payload media dell’agente |
    | `plugin-sdk/conversation-runtime` | Binding di conversazione/thread, abbinamento e funzioni di supporto per binding configurati |
    | `plugin-sdk/runtime-config-snapshot` | Funzione di supporto per snapshot della configurazione runtime |
    | `plugin-sdk/runtime-group-policy` | Funzioni di supporto per la risoluzione delle policy di gruppo runtime |
    | `plugin-sdk/channel-status` | Funzioni di supporto condivise per snapshot/riepilogo dello stato del canale |
    | `plugin-sdk/channel-config-primitives` | Primitive ristrette dello schema di configurazione del canale |
    | `plugin-sdk/channel-config-writes` | Funzioni di supporto per autorizzazione delle scritture della configurazione del canale |
    | `plugin-sdk/channel-plugin-common` | Esportazioni condivise del preambolo del Plugin di canale |
    | `plugin-sdk/allowlist-config-edit` | Funzioni di supporto per modifica/lettura della configurazione allowlist |
    | `plugin-sdk/group-access` | Funzioni di supporto condivise per decisioni di accesso ai gruppi |
    | `plugin-sdk/direct-dm`, `plugin-sdk/direct-dm-access` | Facciate di compatibilità deprecate. Usa `plugin-sdk/channel-inbound`. |
    | `plugin-sdk/direct-dm-guard-policy` | Funzioni di supporto ristrette per policy di guardia pre-crittografia dei DM diretti |
    | `plugin-sdk/discord` | Facciata di compatibilità Discord deprecata per `@openclaw/discord@2026.3.13` pubblicato e compatibilità tracciata dell’owner; i nuovi Plugin dovrebbero usare i sottopercorsi generici dell’SDK dei canali |
    | `plugin-sdk/telegram-account` | Facciata di compatibilità deprecata per la risoluzione degli account Telegram per compatibilità tracciata dell’owner; i nuovi Plugin dovrebbero usare funzioni di supporto runtime iniettate o sottopercorsi generici dell’SDK dei canali |
    | `plugin-sdk/zalouser` | Facciata di compatibilità Zalo Personal deprecata per pacchetti Lark/Zalo pubblicati che importano ancora l’autorizzazione dei comandi del mittente; i nuovi Plugin dovrebbero usare `plugin-sdk/command-auth` |
    | `plugin-sdk/interactive-runtime` | Presentazione semantica dei messaggi, consegna e funzioni di supporto legacy per risposte interattive. Vedi [Presentazione dei messaggi](/it/plugins/message-presentation) |
    | `plugin-sdk/channel-inbound` | Funzioni di supporto condivise in ingresso per classificazione degli eventi, costruzione del contesto, formattazione, radici, debounce, corrispondenza delle menzioni, policy di menzione e logging in ingresso |
    | `plugin-sdk/channel-inbound-debounce` | Funzioni di supporto ristrette per debounce in ingresso |
    | `plugin-sdk/channel-mention-gating` | Funzioni di supporto ristrette per policy di menzione, marker di menzione e testo delle menzioni senza la superficie runtime in ingresso più ampia |
    | `plugin-sdk/channel-envelope`, `plugin-sdk/channel-inbound-roots`, `plugin-sdk/channel-location`, `plugin-sdk/channel-logging` | Facciate di compatibilità deprecate. Usa `plugin-sdk/channel-inbound` o `plugin-sdk/channel-outbound`. |
    | `plugin-sdk/channel-pairing-paths` | Facciata di compatibilità deprecata. Usa `plugin-sdk/channel-pairing`. |
    | `plugin-sdk/channel-reply-options-runtime` | Facciata di compatibilità deprecata. Usa `plugin-sdk/channel-outbound`. |
    | `plugin-sdk/channel-streaming` | Facciata di compatibilità deprecata. Usa `plugin-sdk/channel-outbound`. |
    | `plugin-sdk/channel-send-result` | Tipi del risultato di risposta |
    | `plugin-sdk/channel-actions` | Funzioni di supporto per azioni sui messaggi del canale, più funzioni di supporto deprecate per schemi nativi mantenute per compatibilità dei Plugin |
    | `plugin-sdk/channel-route` | Normalizzazione condivisa delle route, risoluzione dei target guidata dal parser, conversione in stringa degli ID thread, chiavi di route deduplicate/compatte, tipi di target parsati e funzioni di supporto per confronto route/target |
    | `plugin-sdk/channel-targets` | Funzioni di supporto per il parsing dei target; i chiamanti che confrontano route dovrebbero usare `plugin-sdk/channel-route` |
    | `plugin-sdk/channel-contract` | Tipi del contratto di canale |
    | `plugin-sdk/channel-feedback` | Collegamento di feedback/reazioni |
    | `plugin-sdk/channel-secret-runtime` | Funzioni di supporto ristrette per contratti di segreto come `collectSimpleChannelFieldAssignments`, `getChannelSurface`, `pushAssignment` e tipi di target segreti |
  </Accordion>

Le famiglie deprecate di funzioni di supporto per canali restano disponibili solo per
compatibilità con Plugin pubblicati. Il piano di rimozione è: mantenerle per tutta
la finestra di migrazione dei Plugin esterni, mantenere i Plugin del repository/inclusi
su `channel-inbound` e `channel-outbound`, quindi rimuovere i sottopercorsi di
compatibilità nella prossima pulizia principale dell’SDK. Questo si applica alle
vecchie famiglie di messaggi/runtime di canale, streaming di canale, accesso
direct-DM, frammenti di funzioni di supporto in ingresso, opzioni di risposta
e percorsi di abbinamento.

  <Accordion title="Sottopercorsi dei provider">
    | Sottopercorso | Esportazioni principali |
    | --- | --- |
    | `plugin-sdk/provider-entry` | `defineSingleProviderPluginEntry` |
    | `plugin-sdk/lmstudio` | Facade supportata del provider LM Studio per configurazione, rilevamento del catalogo e preparazione dei modelli in runtime |
    | `plugin-sdk/lmstudio-runtime` | Facade supportata del runtime LM Studio per impostazioni predefinite del server locale, rilevamento dei modelli, intestazioni delle richieste e helper per i modelli caricati |
    | `plugin-sdk/provider-setup` | Helper curati per la configurazione di provider locali/self-hosted |
    | `plugin-sdk/self-hosted-provider-setup` | Helper mirati per la configurazione di provider self-hosted compatibili con OpenAI |
    | `plugin-sdk/cli-backend` | Impostazioni predefinite del backend CLI + costanti watchdog |
    | `plugin-sdk/provider-auth-runtime` | Helper di runtime per la risoluzione delle chiavi API per i Plugin provider |
    | `plugin-sdk/provider-oauth-runtime` | Tipi generici di callback OAuth del provider, rendering della pagina di callback, helper PKCE/stato, parsing dell'input di autorizzazione, helper per la scadenza dei token e helper di interruzione |
    | `plugin-sdk/provider-auth-api-key` | Helper di onboarding/scrittura profilo per chiavi API, come `upsertApiKeyProfile` |
    | `plugin-sdk/provider-auth-result` | Builder standard del risultato di autenticazione OAuth |
    | `plugin-sdk/provider-env-vars` | Helper di ricerca delle variabili d'ambiente di autenticazione del provider |
    | `plugin-sdk/provider-auth` | `createProviderApiKeyAuthMethod`, `ensureApiKeyFromOptionEnvOrPrompt`, `upsertAuthProfile`, `upsertApiKeyProfile`, `writeOAuthCredentials`, helper di importazione dell'autenticazione OpenAI Codex, esportazione di compatibilità deprecata `resolveOpenClawAgentDir` |
    | `plugin-sdk/provider-model-shared` | `ProviderReplayFamily`, `buildProviderReplayFamilyHooks`, `normalizeModelCompat`, builder condivisi delle policy di replay, helper per endpoint dei provider e helper condivisi di normalizzazione degli ID modello |
    | `plugin-sdk/provider-catalog-live-runtime` | Helper del catalogo live dei modelli del provider per il rilevamento protetto in stile `/models`: `buildLiveModelProviderConfig`, `fetchLiveProviderModelRows`, `getCachedLiveProviderModelRows`, `fetchLiveProviderModelIds`, `LiveModelCatalogHttpError`, `clearLiveCatalogCacheForTests`, filtro degli ID modello, cache TTL e fallback statico |
    | `plugin-sdk/provider-catalog-runtime` | Hook di runtime per l'arricchimento del catalogo dei provider e punti di integrazione del registro Plugin-provider per i test di contratto |
    | `plugin-sdk/provider-catalog-shared` | `findCatalogTemplate`, `buildSingleProviderApiKeyCatalog`, `buildManifestModelProviderConfig`, `supportsNativeStreamingUsageCompat`, `applyProviderNativeStreamingUsageCompat` |
    | `plugin-sdk/provider-http` | Helper generici per capacità HTTP/endpoint dei provider, errori HTTP dei provider e helper per moduli multipart di trascrizione audio |
    | `plugin-sdk/provider-web-fetch-contract` | Helper ristretti per il contratto di configurazione/selezione del recupero web, come `enablePluginInConfig` e `WebFetchProviderPlugin` |
    | `plugin-sdk/provider-web-fetch` | Helper di registrazione/cache per provider di recupero web |
    | `plugin-sdk/provider-web-search-config-contract` | Helper ristretti di configurazione/credenziali per ricerca web per provider che non richiedono il cablaggio dell'abilitazione Plugin |
    | `plugin-sdk/provider-web-search-contract` | Helper ristretti per il contratto di configurazione/credenziali di ricerca web, come `createWebSearchProviderContractFields`, `enablePluginInConfig`, `resolveProviderWebSearchPluginConfig` e setter/getter di credenziali con ambito |
    | `plugin-sdk/provider-web-search` | Helper di registrazione/cache/runtime per provider di ricerca web |
    | `plugin-sdk/embedding-providers` | Tipi generali di provider di embedding e helper di lettura, inclusi `EmbeddingProviderAdapter`, `getEmbeddingProvider(...)` e `listEmbeddingProviders(...)`; i Plugin registrano i provider tramite `api.registerEmbeddingProvider(...)` così la proprietà del manifesto viene applicata |
    | `plugin-sdk/provider-tools` | `ProviderToolCompatFamily`, `buildProviderToolCompatFamilyHooks` e pulizia schema + diagnostica per DeepSeek/Gemini/OpenAI |
    | `plugin-sdk/provider-usage` | Tipi di snapshot d'uso del provider, helper condivisi per il recupero dell'uso e fetcher di provider come `fetchClaudeUsage` |
    | `plugin-sdk/provider-stream` | `ProviderStreamFamily`, `buildProviderStreamFamilyHooks`, `composeProviderStreamWrappers`, tipi di wrapper di stream, compatibilità per chiamate a strumenti in testo semplice e helper wrapper condivisi per Anthropic/Bedrock/DeepSeek V4/Google/Kilocode/Moonshot/OpenAI/OpenRouter/Z.A.I/MiniMax/Copilot |
    | `plugin-sdk/provider-stream-shared` | Helper wrapper pubblici e condivisi per stream dei provider, inclusi `composeProviderStreamWrappers`, `createOpenAICompatibleCompletionsThinkingOffWrapper`, `createPlainTextToolCallCompatWrapper`, `createPayloadPatchStreamWrapper`, `createToolStreamWrapper`, `normalizeOpenAICompatibleReasoningPayload`, `setQwenChatTemplateThinking` e utilità di stream compatibili con Anthropic/DeepSeek/OpenAI |
    | `plugin-sdk/provider-transport-runtime` | Helper di trasporto nativo del provider, come fetch protetto, estrazione del testo dai risultati degli strumenti, trasformazioni dei messaggi di trasporto e stream di eventi di trasporto scrivibili |
    | `plugin-sdk/provider-onboard` | Helper per patch della configurazione di onboarding |
    | `plugin-sdk/global-singleton` | Helper singleton/mappa/cache locali al processo |
    | `plugin-sdk/group-activation` | Helper ristretti per modalità di attivazione dei gruppi e parsing dei comandi |
  </Accordion>

Gli snapshot d'uso dei provider in genere riportano una o più `windows` di quota, ciascuna con
un'etichetta, la percentuale usata e un tempo di reset opzionale. I provider che espongono testo sul saldo o
sullo stato dell'account invece di finestre di quota reimpostabili dovrebbero restituire
`summary` con un array `windows` vuoto invece di inventare percentuali.
OpenClaw mostra quel testo di riepilogo nell'output di stato; usa `error` solo quando
l'endpoint d'uso non è riuscito o non ha restituito dati d'uso utilizzabili.

  <Accordion title="Sottopercorsi di autenticazione e sicurezza">
    | Sottopercorso | Esportazioni principali |
    | --- | --- |
    | `plugin-sdk/command-auth` | `resolveControlCommandGate`, helper del registro comandi inclusa la formattazione dinamica del menu degli argomenti, helper di autorizzazione del mittente |
    | `plugin-sdk/command-status` | Builder di messaggi di comando/aiuto, come `buildCommandsMessagePaginated` e `buildHelpMessage` |
    | `plugin-sdk/approval-auth-runtime` | Helper di risoluzione degli approvatori e di autenticazione delle azioni nella stessa chat |
    | `plugin-sdk/approval-client-runtime` | Helper per profili/filtri di approvazione exec nativi |
    | `plugin-sdk/approval-delivery-runtime` | Adattatori nativi di capacità/consegna delle approvazioni |
    | `plugin-sdk/approval-gateway-runtime` | Helper condiviso di risoluzione del Gateway di approvazione |
    | `plugin-sdk/approval-handler-adapter-runtime` | Helper leggeri di caricamento degli adattatori nativi di approvazione per entrypoint caldi dei canali |
    | `plugin-sdk/approval-handler-runtime` | Helper di runtime più ampi per gestori di approvazione; preferisci i punti di integrazione adattatore/Gateway più ristretti quando sono sufficienti |
    | `plugin-sdk/approval-native-runtime` | Helper nativi per destinazione di approvazione, associazione account, gate di instradamento, fallback di inoltro e soppressione dei prompt exec nativi locali |
    | `plugin-sdk/approval-reaction-runtime` | Binding hardcoded delle reazioni di approvazione, payload dei prompt di reazione, archivi delle destinazioni di reazione ed esportazione di compatibilità per la soppressione dei prompt exec nativi locali |
    | `plugin-sdk/approval-reply-runtime` | Helper per payload di risposta di approvazione exec/Plugin |
    | `plugin-sdk/approval-runtime` | Helper per payload di approvazione exec/Plugin, helper di instradamento/runtime delle approvazioni native e helper di visualizzazione strutturata delle approvazioni come `formatApprovalDisplayPath` |
    | `plugin-sdk/reply-dedupe` | Helper ristretti per reset della deduplicazione delle risposte in ingresso |
    | `plugin-sdk/channel-contract-testing` | Helper ristretti per test di contratto dei canali senza il barrel di test ampio |
    | `plugin-sdk/command-auth-native` | Autenticazione nativa dei comandi, formattazione dinamica del menu degli argomenti e helper nativi per destinazioni di sessione |
    | `plugin-sdk/command-detection` | Helper condivisi di rilevamento dei comandi |
    | `plugin-sdk/command-primitives-runtime` | Predicati leggeri sul testo dei comandi per percorsi caldi dei canali |
    | `plugin-sdk/command-surface` | Helper di normalizzazione del corpo comando e di superficie dei comandi |
    | `plugin-sdk/allow-from` | `formatAllowFromLowercase` |
    | `plugin-sdk/provider-auth-login-flow-runtime` | Helper lazy per il flusso di accesso all'autenticazione del provider per canali privati e abbinamento con codice dispositivo della Web UI |
    | `plugin-sdk/channel-secret-runtime` | Helper ristretti di raccolta dei contratti dei segreti per superfici di segreti di canale/Plugin |
    | `plugin-sdk/secret-ref-runtime` | Helper ristretti per `coerceSecretRef` e tipizzazione SecretRef per parsing di contratti/configurazioni dei segreti |
    | `plugin-sdk/secret-provider-integration` | Manifesto di integrazione provider SecretRef solo tipi e contratti dei preset per Plugin che pubblicano preset esterni di provider di segreti |
    | `plugin-sdk/security-runtime` | Helper condivisi per fiducia, gating dei DM, file/percorsi limitati alla root inclusi scritture solo create, sostituzione atomica sincrona/asincrona dei file, scritture temporanee tra sibling, fallback di spostamento tra dispositivi, helper per file-store privati, guardie sui parent symlink, contenuto esterno, redazione di testo sensibile, confronto di segreti a tempo costante e helper di raccolta dei segreti |
    | `plugin-sdk/ssrf-policy` | Helper per allowlist degli host e policy SSRF per reti private |
    | `plugin-sdk/ssrf-dispatcher` | Helper ristretti per dispatcher vincolato senza l'ampia superficie del runtime infrastrutturale |
    | `plugin-sdk/ssrf-runtime` | Dispatcher vincolato, fetch protetto da SSRF, errore SSRF e helper di policy SSRF |
    | `plugin-sdk/secret-input` | Helper di parsing dell'input dei segreti |
    | `plugin-sdk/webhook-ingress` | Helper per richieste/destinazioni Webhook e coercizione raw di websocket/body |
    | `plugin-sdk/webhook-request-guards` | Helper per dimensione/timeout del corpo richiesta |
  </Accordion>

  <Accordion title="Sottopercorsi di runtime e archiviazione">
    | Sottopercorso | Esportazioni chiave |
    | --- | --- |
    | `plugin-sdk/runtime` | Helper ampi per runtime, logging, backup e installazione dei plugin |
    | `plugin-sdk/runtime-env` | Helper mirati per ambiente runtime, logger, timeout, retry e backoff |
    | `plugin-sdk/browser-config` | Facade di configurazione browser supportata per profilo/default normalizzati, parsing degli URL CDP e helper di autenticazione per il controllo browser |
    | `plugin-sdk/agent-harness-task-runtime` | Helper generici per ciclo di vita dei task e consegna del completamento per agenti basati su harness che usano un ambito task emesso dall'host |
    | `plugin-sdk/codex-mcp-projection` | Helper Codex in bundle riservato per proiettare la configurazione server MCP utente nella configurazione thread di Codex; non per plugin di terze parti |
    | `plugin-sdk/codex-native-task-runtime` | Helper Codex in bundle privato per cablaggio runtime/mirror dei task nativi; non per plugin di terze parti |
    | `plugin-sdk/channel-runtime-context` | Helper generici di registrazione e lookup del runtime-context del canale |
    | `plugin-sdk/matrix` | Facade di compatibilità Matrix deprecata per pacchetti canale di terze parti più vecchi; i nuovi plugin dovrebbero importare direttamente `plugin-sdk/run-command` |
    | `plugin-sdk/mattermost` | Facade di compatibilità Mattermost deprecata per pacchetti canale di terze parti più vecchi; i nuovi plugin dovrebbero importare direttamente i sottopercorsi generici dell'SDK |
    | `plugin-sdk/runtime-store` | `createPluginRuntimeStore` |
    | `plugin-sdk/plugin-runtime` | Helper condivisi per comandi/hook/http/interattivi dei plugin |
    | `plugin-sdk/hook-runtime` | Helper condivisi per pipeline webhook/hook interni |
    | `plugin-sdk/lazy-runtime` | Helper di import/binding runtime lazy come `createLazyRuntimeModule`, `createLazyRuntimeMethod` e `createLazyRuntimeSurface` |
    | `plugin-sdk/process-runtime` | Helper di esecuzione processi |
    | `plugin-sdk/cli-runtime` | Helper CLI per formattazione, attesa, versione, invocazione argomenti e gruppi di comandi lazy |
    | `plugin-sdk/qa-live-transport-scenarios` | ID condivisi degli scenari QA di trasporto live, helper di copertura baseline e helper di selezione scenari |
    | `plugin-sdk/gateway-method-runtime` | Helper riservato di dispatch dei metodi Gateway per route HTTP di plugin che dichiarano `contracts.gatewayMethodDispatch: ["authenticated-request"]` |
    | `plugin-sdk/gateway-runtime` | Client Gateway, helper di avvio client pronto per l'event-loop, RPC CLI del gateway, errori del protocollo gateway, risoluzione dell'host LAN pubblicizzato e helper di patch dello stato canale |
    | `plugin-sdk/config-contracts` | Superficie di configurazione mirata solo di tipi per forme di configurazione dei plugin come `OpenClawConfig` e tipi di configurazione canale/provider |
    | `plugin-sdk/plugin-config-runtime` | Helper di lookup runtime della configurazione plugin come `requireRuntimeConfig`, `resolvePluginConfigObject` e `resolveLivePluginConfigObject` |
    | `plugin-sdk/config-mutation` | Helper di mutazione transazionale della configurazione come `mutateConfigFile`, `replaceConfigFile` e `logConfigUpdated` |
    | `plugin-sdk/message-tool-delivery-hints` | Stringhe condivise di suggerimento dei metadati di consegna message-tool |
    | `plugin-sdk/runtime-config-snapshot` | Helper di snapshot della configurazione del processo corrente come `getRuntimeConfig`, `getRuntimeConfigSnapshot` e setter di snapshot per test |
    | `plugin-sdk/telegram-command-config` | Normalizzazione nome/descrizione dei comandi Telegram e controlli duplicati/conflitti, anche quando la superficie del contratto Telegram in bundle non è disponibile |
    | `plugin-sdk/text-autolink-runtime` | Rilevamento autolink dei riferimenti file senza l'ampio barrel di testo |
    | `plugin-sdk/approval-reaction-runtime` | Binding hardcoded delle reazioni di approvazione, payload dei prompt di reazione, store dei target di reazione ed export di compatibilità per soppressione del prompt di exec nativo locale |
    | `plugin-sdk/approval-runtime` | Helper di approvazione exec/plugin, builder di capability di approvazione, helper auth/profilo, helper di routing/runtime nativi e formattazione del percorso di visualizzazione dell'approvazione strutturata |
    | `plugin-sdk/reply-runtime` | Helper condivisi runtime inbound/risposta, chunking, dispatch, Heartbeat, pianificatore risposte |
    | `plugin-sdk/reply-dispatch-runtime` | Helper mirati di dispatch/finalizzazione risposta ed etichette conversazione |
    | `plugin-sdk/reply-history` | Helper condivisi per cronologia risposte a finestra breve. Il nuovo codice message-turn dovrebbe usare `createChannelHistoryWindow`; gli helper map di livello inferiore rimangono solo export di compatibilità deprecati |
    | `plugin-sdk/reply-reference` | `createReplyReferencePlanner` |
    | `plugin-sdk/reply-chunking` | Helper mirati per chunking di testo/markdown |
    | `plugin-sdk/session-store-runtime` | Helper di workflow sessione (`getSessionEntry`, `listSessionEntries`, `patchSessionEntry`, `upsertSessionEntry`), letture delimitate di testo transcript utente/assistente recente per identità sessione, helper legacy per percorso store sessioni/chiave sessione, letture updated-at e helper di compatibilità dell'intero store/percorso file solo di transizione |
    | `plugin-sdk/session-transcript-runtime` | Identità transcript, helper con ambito per target/lettura/scrittura, pubblicazione aggiornamenti, lock di scrittura e chiavi di hit della memoria transcript |
    | `plugin-sdk/sqlite-runtime` | Helper mirati SQLite per schema agente, percorso e transazione per runtime first-party |
    | `plugin-sdk/cron-store-runtime` | Helper di percorso/caricamento/salvataggio dello store Cron |
    | `plugin-sdk/state-paths` | Helper di percorsi directory State/OAuth |
    | `plugin-sdk/plugin-state-runtime` | Tipi di stato keyed SQLite sidecar del Plugin più setup centralizzato dei pragma di connessione e manutenzione WAL per database posseduti dal plugin |
    | `plugin-sdk/routing` | Helper di binding route/chiave sessione/account come `resolveAgentRoute`, `buildAgentSessionKey` e `resolveDefaultAgentBoundAccountId` |
    | `plugin-sdk/status-helpers` | Helper condivisi di riepilogo stato canale/account, default runtime-state e helper metadati issue |
    | `plugin-sdk/target-resolver-runtime` | Helper condivisi di risoluzione target |
    | `plugin-sdk/string-normalization-runtime` | Helper di normalizzazione slug/stringhe |
    | `plugin-sdk/request-url` | Estrai URL stringa da input simili a fetch/request |
    | `plugin-sdk/run-command` | Runner di comandi temporizzato con risultati stdout/stderr normalizzati |
    | `plugin-sdk/param-readers` | Reader comuni di parametri tool/CLI |
    | `plugin-sdk/tool-plugin` | Definisci un semplice plugin agent-tool tipizzato ed esponi metadati statici per la generazione del manifest |
    | `plugin-sdk/tool-payload` | Estrai payload normalizzati da oggetti risultato dei tool |
    | `plugin-sdk/tool-send` | Estrai campi canonici del target di invio dagli argomenti del tool |
    | `plugin-sdk/sandbox` | Tipi di backend sandbox e helper di comandi SSH/OpenShell, incluso preflight fail-fast dei comandi exec |
    | `plugin-sdk/temp-path` | Helper condivisi per percorsi di download temporanei e workspace temporanei sicuri privati |
    | `plugin-sdk/logging-core` | Logger di sottosistema e helper di redazione |
    | `plugin-sdk/markdown-table-runtime` | Helper per modalità tabella Markdown e conversione |
    | `plugin-sdk/model-session-runtime` | Helper di override modello/sessione come `applyModelOverrideToSessionEntry` e `resolveAgentMaxConcurrent` |
    | `plugin-sdk/talk-config-runtime` | Helper di risoluzione della configurazione provider Talk |
    | `plugin-sdk/json-store` | Piccoli helper di lettura/scrittura stato JSON |
    | `plugin-sdk/json-unsafe-integers` | Helper di parsing JSON che preservano letterali interi non sicuri come stringhe |
    | `plugin-sdk/file-lock` | Helper di file-lock rientrante |
    | `plugin-sdk/persistent-dedupe` | Helper di cache dedupe con backing su disco |
    | `plugin-sdk/acp-runtime` | Helper ACP per runtime/sessione e dispatch risposte |
    | `plugin-sdk/acp-runtime-backend` | Helper leggeri ACP di registrazione backend e dispatch risposte per plugin caricati all'avvio |
    | `plugin-sdk/acp-binding-resolve-runtime` | Risoluzione binding ACP in sola lettura senza import di avvio del ciclo di vita |
    | `plugin-sdk/agent-config-primitives` | Primitive mirate di schema configurazione runtime agente |
    | `plugin-sdk/boolean-param` | Reader permissivo di parametri booleani |
    | `plugin-sdk/dangerous-name-runtime` | Helper di risoluzione matching dei nomi pericolosi |
    | `plugin-sdk/device-bootstrap` | Helper di bootstrap dispositivo e token di pairing |
    | `plugin-sdk/extension-shared` | Primitive helper condivise per canali passivi, stato e proxy ambientale |
    | `plugin-sdk/models-provider-runtime` | Helper di risposta comando/provider `/models` |
    | `plugin-sdk/skill-commands-runtime` | Helper di elenco dei comandi Skill |
    | `plugin-sdk/native-command-registry` | Helper di registro/build/serializzazione dei comandi nativi |
    | `plugin-sdk/agent-harness` | Superficie sperimentale trusted-plugin per harness agenti di basso livello: tipi harness, helper di steer/abort per run attivi, helper bridge tool OpenClaw, helper di policy tool runtime-plan, classificazione degli esiti terminali, helper di formattazione/dettaglio avanzamento tool e utilità per risultati dei tentativi |
    | `plugin-sdk/provider-zai-endpoint` | Facade deprecata di rilevamento endpoint posseduta dal provider Z.AI; usa l'API pubblica del plugin Z.AI |
    | `plugin-sdk/async-lock-runtime` | Helper di lock asincrono process-local per piccoli file di stato runtime |
    | `plugin-sdk/channel-activity-runtime` | Helper di telemetria attività canale |
    | `plugin-sdk/concurrency-runtime` | Helper di concorrenza task asincroni delimitata |
    | `plugin-sdk/dedupe-runtime` | Helper di cache dedupe in memoria |
    | `plugin-sdk/delivery-queue-runtime` | Helper di drain delle consegne in sospeso in uscita |
    | `plugin-sdk/file-access-runtime` | Helper di percorsi sicuri per file locali e media-source |
    | `plugin-sdk/heartbeat-runtime` | Helper di wake, evento e visibilità Heartbeat |
    | `plugin-sdk/number-runtime` | Helper di coercizione numerica |
    | `plugin-sdk/secure-random-runtime` | Helper per token/UUID sicuri |
    | `plugin-sdk/system-event-runtime` | Helper di coda eventi di sistema |
    | `plugin-sdk/transport-ready-runtime` | Helper di attesa prontezza trasporto |
    | `plugin-sdk/exec-approvals-runtime` | Helper di file policy per approvazione exec senza l'ampio barrel infra-runtime |
    | `plugin-sdk/infra-runtime` | Shim di compatibilità deprecato; usa i sottopercorsi runtime mirati sopra |
    | `plugin-sdk/collection-runtime` | Piccoli helper di cache delimitata |
    | `plugin-sdk/diagnostic-runtime` | Helper per flag diagnostici, eventi e trace-context |
    | `plugin-sdk/error-runtime` | Grafo errori, formattazione, helper condivisi di classificazione errori, `isApprovalNotFoundError` |
    | `plugin-sdk/fetch-runtime` | Fetch wrappato, proxy, opzione EnvHttpProxyAgent e helper di lookup pinned |
    | `plugin-sdk/runtime-fetch` | Fetch runtime consapevole del dispatcher senza import proxy/guarded-fetch |
    | `plugin-sdk/inline-image-data-url-runtime` | Sanitizer URL dati immagini inline e helper di sniffing firma senza l'ampia superficie runtime media |
    | `plugin-sdk/response-limit-runtime` | Reader delimitato del corpo risposta senza l'ampia superficie runtime media |
    | `plugin-sdk/session-binding-runtime` | Stato binding conversazione corrente senza routing di binding configurato o store di pairing |
    | `plugin-sdk/session-store-runtime` | Helper session-store senza import ampi di scritture/manutenzione configurazione |
    | `plugin-sdk/sqlite-runtime` | Helper mirati SQLite per schema agente, percorso e transazione senza controlli del ciclo di vita del database |
    | `plugin-sdk/context-visibility-runtime` | Risoluzione visibilità contesto e filtro contesto supplementare senza import ampi di configurazione/sicurezza |
    | `plugin-sdk/string-coerce-runtime` | Helper mirati di coercizione e normalizzazione record/stringa primitivi senza import markdown/logging |
    | `plugin-sdk/host-runtime` | Helper di normalizzazione hostname e host SCP |
    | `plugin-sdk/retry-runtime` | Helper di configurazione retry e runner retry |
    | `plugin-sdk/agent-runtime` | Helper per directory/identità/workspace agente, inclusi `resolveAgentDir`, `resolveDefaultAgentDir` ed export di compatibilità deprecato `resolveOpenClawAgentDir` |
    | `plugin-sdk/directory-runtime` | Query/dedup directory basati su configurazione |
    | `plugin-sdk/keyed-async-queue` | `KeyedAsyncQueue` |
  </Accordion>

  <Accordion title="Sottopercorsi di capacità e test">
    | Sottopercorso | Esportazioni principali |
    | --- | --- |
    | `plugin-sdk/media-runtime` | Helper condivisi per recupero/trasformazione/archiviazione dei media, inclusi `saveRemoteMedia`, `saveResponseMedia`, `readRemoteMediaBuffer` e il deprecato `fetchRemoteMedia`; preferisci gli helper di archiviazione prima delle letture del buffer quando un URL deve diventare un media OpenClaw |
    | `plugin-sdk/media-mime` | Normalizzazione MIME mirata, mappatura delle estensioni file, rilevamento MIME e helper per i tipi di media |
    | `plugin-sdk/media-store` | Helper mirati per l'archivio media, come `saveMediaBuffer` e `saveMediaStream` |
    | `plugin-sdk/media-generation-runtime` | Helper condivisi per il failover della generazione di media, selezione dei candidati e messaggistica per modelli mancanti |
    | `plugin-sdk/media-understanding` | Tipi di provider per la comprensione dei media più esportazioni di helper rivolti ai provider per immagini/audio/estrazione strutturata |
    | `plugin-sdk/text-chunking` | Helper per suddivisione/rendering di testo e markdown, conversione di tabelle markdown, rimozione di tag direttiva e utilità per testo sicuro |
    | `plugin-sdk/text-chunking` | Helper per la suddivisione del testo in uscita |
    | `plugin-sdk/speech` | Tipi di provider speech più esportazioni rivolte ai provider per direttive, registro, validazione, builder TTS compatibile con OpenAI e helper speech |
    | `plugin-sdk/speech-core` | Tipi di provider speech condivisi, registro, direttiva, normalizzazione ed esportazioni di helper speech |
    | `plugin-sdk/realtime-transcription` | Tipi di provider per trascrizione in tempo reale, helper di registro e helper condiviso per sessioni WebSocket |
    | `plugin-sdk/realtime-bootstrap-context` | Helper di bootstrap del profilo in tempo reale per l'iniezione limitata del contesto `IDENTITY.md`, `USER.md` e `SOUL.md` |
    | `plugin-sdk/realtime-voice` | Tipi di provider per voce in tempo reale, helper di registro e helper condivisi per il comportamento della voce in tempo reale, incluso il tracciamento dell'attività di output |
    | `plugin-sdk/image-generation` | Tipi di provider per generazione di immagini più helper per asset immagine/data URL e builder di provider immagini compatibile con OpenAI |
    | `plugin-sdk/image-generation-core` | Tipi condivisi per generazione di immagini, failover, autenticazione e helper di registro |
    | `plugin-sdk/music-generation` | Tipi di provider/richiesta/risultato per generazione di musica |
    | `plugin-sdk/music-generation-core` | Tipi condivisi per generazione di musica, helper di failover, ricerca provider e parsing dei riferimenti modello |
    | `plugin-sdk/video-generation` | Tipi di provider/richiesta/risultato per generazione di video |
    | `plugin-sdk/video-generation-core` | Tipi condivisi per generazione di video, helper di failover, ricerca provider e parsing dei riferimenti modello |
    | `plugin-sdk/transcripts` | Tipi condivisi di provider sorgente transcript, helper di registro, descrittori di sessione e metadati delle utterance |
    | `plugin-sdk/webhook-targets` | Registro dei target Webhook e helper per l'installazione delle route |
    | `plugin-sdk/webhook-path` | Alias di compatibilità deprecato; usa `plugin-sdk/webhook-ingress` |
    | `plugin-sdk/web-media` | Helper condivisi per il caricamento di media remoti/locali |
    | `plugin-sdk/zod` | Riesportazione di compatibilità deprecata; importa `zod` da `zod` direttamente |
    | `plugin-sdk/testing` | Barrel di compatibilità deprecato locale al repo per test OpenClaw legacy. I nuovi test del repo dovrebbero invece importare sottopercorsi di test locali mirati come `plugin-sdk/agent-runtime-test-contracts`, `plugin-sdk/plugin-test-runtime`, `plugin-sdk/channel-test-helpers`, `plugin-sdk/test-env` o `plugin-sdk/test-fixtures` |
    | `plugin-sdk/plugin-test-api` | Helper minimale `createTestPluginApi` locale al repo per test unitari di registrazione diretta dei Plugin senza importare bridge di helper di test del repo |
    | `plugin-sdk/agent-runtime-test-contracts` | Fixture di contratti adapter agent-runtime nativi locali al repo per test di autenticazione, consegna, fallback, hook strumenti, overlay prompt, schema e proiezione transcript |
    | `plugin-sdk/channel-test-helpers` | Helper di test orientati ai canali locali al repo per contratti generici di azioni/configurazione/stato, asserzioni su directory, ciclo di vita dell'avvio account, threading send-config, mock runtime, problemi di stato, consegna in uscita e registrazione hook |
    | `plugin-sdk/channel-target-testing` | Suite condivisa locale al repo di casi di errore per la risoluzione target nei test dei canali |
    | `plugin-sdk/plugin-test-contracts` | Helper locali al repo per contratti di pacchetto Plugin, registrazione, artefatto pubblico, importazione diretta, API runtime ed effetti collaterali di importazione |
    | `plugin-sdk/provider-test-contracts` | Helper locali al repo per contratti di runtime provider, autenticazione, discovery, onboarding, catalogo, wizard, capacità media, policy di replay, audio live STT in tempo reale, ricerca/fetch web e stream |
    | `plugin-sdk/provider-http-test-mocks` | Mock HTTP/autenticazione Vitest opt-in locali al repo per test dei provider che esercitano `plugin-sdk/provider-http` |
    | `plugin-sdk/test-fixtures` | Fixture generiche locali al repo per acquisizione runtime CLI, contesto sandbox, writer di skill, messaggio agente, evento di sistema, reload modulo, percorso Plugin bundled, terminal-text, chunking, token di autenticazione e casi tipizzati |
    | `plugin-sdk/test-node-mocks` | Helper mirati locali al repo per mock dei builtin Node da usare dentro factory Vitest `vi.mock("node:*")` |
  </Accordion>

  <Accordion title="Sottopercorsi di memoria">
    | Sottopercorso | Esportazioni principali |
    | --- | --- |
    | `plugin-sdk/memory-core` | Superficie helper memory-core bundled per helper di manager/config/file/CLI |
    | `plugin-sdk/memory-core-engine-runtime` | Facade runtime per indice/ricerca memoria |
    | `plugin-sdk/memory-core-host-embedding-registry` | Helper leggeri per registro dei provider embedding di memoria |
    | `plugin-sdk/memory-core-host-engine-foundation` | Esportazioni del motore foundation host memoria |
    | `plugin-sdk/memory-core-host-engine-embeddings` | Contratti embedding host memoria, accesso al registro, provider locale e helper generici batch/remoti. `registerMemoryEmbeddingProvider` su questa superficie è deprecato; usa l'API generica dei provider embedding per i nuovi provider. |
    | `plugin-sdk/memory-core-host-engine-qmd` | Esportazioni del motore QMD host memoria |
    | `plugin-sdk/memory-core-host-engine-storage` | Esportazioni del motore di storage host memoria |
    | `plugin-sdk/memory-core-host-multimodal` | Helper multimodali host memoria |
    | `plugin-sdk/memory-core-host-query` | Helper di query host memoria |
    | `plugin-sdk/memory-core-host-secret` | Helper secret host memoria |
    | `plugin-sdk/memory-core-host-events` | Alias di compatibilità deprecato; usa `plugin-sdk/memory-host-events` |
    | `plugin-sdk/memory-core-host-status` | Helper di stato host memoria |
    | `plugin-sdk/memory-core-host-runtime-cli` | Helper runtime CLI host memoria |
    | `plugin-sdk/memory-core-host-runtime-core` | Helper runtime core host memoria |
    | `plugin-sdk/memory-core-host-runtime-files` | Helper file/runtime host memoria |
    | `plugin-sdk/memory-host-core` | Alias indipendente dal vendor per helper runtime core host memoria |
    | `plugin-sdk/memory-host-events` | Alias indipendente dal vendor per helper del journal eventi host memoria |
    | `plugin-sdk/memory-host-files` | Alias di compatibilità deprecato; usa `plugin-sdk/memory-core-host-runtime-files` |
    | `plugin-sdk/memory-host-markdown` | Helper condivisi per managed-markdown per Plugin adiacenti alla memoria |
    | `plugin-sdk/memory-host-search` | Facade runtime Active Memory per accesso al search-manager |
    | `plugin-sdk/memory-host-status` | Alias di compatibilità deprecato; usa `plugin-sdk/memory-core-host-status` |
  </Accordion>

  <Accordion title="Sottopercorsi helper bundled riservati">
    I sottopercorsi SDK helper bundled riservati sono superfici ristrette specifiche del proprietario per
    il codice dei Plugin bundled. Sono tracciati nell'inventario SDK affinché le build
    dei pacchetti e gli alias restino deterministici, ma non sono API generali
    per l'authoring di Plugin. I nuovi contratti host riutilizzabili dovrebbero usare sottopercorsi SDK generici
    come `plugin-sdk/gateway-runtime`, `plugin-sdk/security-runtime` e
    `plugin-sdk/plugin-config-runtime`.

    | Sottopercorso | Proprietario e scopo |
    | --- | --- |
    | `plugin-sdk/codex-mcp-projection` | Helper del Plugin Codex bundled per proiettare la configurazione server MCP dell'utente nella configurazione thread app-server Codex |
    | `plugin-sdk/codex-native-task-runtime` | Helper del Plugin Codex bundled per rispecchiare i subagent nativi app-server Codex nello stato task OpenClaw |

  </Accordion>
</AccordionGroup>

## Correlati

- [Panoramica Plugin SDK](/it/plugins/sdk-overview)
- [Configurazione Plugin SDK](/it/plugins/sdk-setup)
- [Creare Plugin](/it/plugins/building-plugins)
