---
read_when:
    - Choisir le bon sous-chemin plugin-sdk pour un import de plugin
    - Auditer les sous-chemins de plugins bundled et les surfaces utilitaires
summary: 'Catalogue des sous-chemins du SDK Plugin : où se trouvent les imports, regroupés par domaine'
title: Sous-chemins du SDK Plugin
x-i18n:
    generated_at: "2026-04-25T13:54:39Z"
    model: gpt-5.4
    provider: openai
    source_hash: 0f2e655d660a37030c53826b8ff156ac1897ecd3e753c1b0b43c75d456e2dfba
    source_path: plugins/sdk-subpaths.md
    workflow: 15
---

  Le SDK Plugin est exposé comme un ensemble de sous-chemins étroits sous `openclaw/plugin-sdk/`.
  Cette page catalogue les sous-chemins couramment utilisés, regroupés par usage. La liste complète
  générée de plus de 200 sous-chemins se trouve dans `scripts/lib/plugin-sdk-entrypoints.json` ;
  les sous-chemins utilitaires réservés aux plugins bundled y apparaissent mais sont des détails
  d’implémentation sauf si une page de documentation les met explicitement en avant.

  Pour le guide de création de plugins, voir [Aperçu du SDK Plugin](/fr/plugins/sdk-overview).

  ## Entrée de plugin

  | Sous-chemin                | Exports clés                                                                                                                            |
  | -------------------------- | --------------------------------------------------------------------------------------------------------------------------------------- |
  | `plugin-sdk/plugin-entry`  | `definePluginEntry`                                                                                                                     |
  | `plugin-sdk/core`          | `defineChannelPluginEntry`, `createChatChannelPlugin`, `createChannelPluginBase`, `defineSetupPluginEntry`, `buildChannelConfigSchema` |
  | `plugin-sdk/config-schema` | `OpenClawSchema`                                                                                                                        |
  | `plugin-sdk/provider-entry` | `defineSingleProviderPluginEntry`                                                                                                      |

  <AccordionGroup>
  <Accordion title="Sous-chemins de canal">
    | Sous-chemin | Exports clés |
    | --- | --- |
    | `plugin-sdk/channel-core` | `defineChannelPluginEntry`, `defineSetupPluginEntry`, `createChatChannelPlugin`, `createChannelPluginBase` |
    | `plugin-sdk/config-schema` | Export du schéma Zod racine `openclaw.json` (`OpenClawSchema`) |
    | `plugin-sdk/channel-setup` | `createOptionalChannelSetupSurface`, `createOptionalChannelSetupAdapter`, `createOptionalChannelSetupWizard`, ainsi que `DEFAULT_ACCOUNT_ID`, `createTopLevelChannelDmPolicy`, `setSetupChannelEnabled`, `splitSetupEntries` |
    | `plugin-sdk/setup` | Helpers partagés d’assistant de configuration, invites de liste d’autorisation, constructeurs d’état de configuration |
    | `plugin-sdk/setup-runtime` | `createPatchedAccountSetupAdapter`, `createEnvPatchedAccountSetupAdapter`, `createSetupInputPresenceValidator`, `noteChannelLookupFailure`, `noteChannelLookupSummary`, `promptResolvedAllowFrom`, `splitSetupEntries`, `createAllowlistSetupWizardProxy`, `createDelegatedSetupWizardProxy` |
    | `plugin-sdk/setup-adapter-runtime` | `createEnvPatchedAccountSetupAdapter` |
    | `plugin-sdk/setup-tools` | `formatCliCommand`, `detectBinary`, `extractArchive`, `resolveBrewExecutable`, `formatDocsLink`, `CONFIG_DIR` |
    | `plugin-sdk/account-core` | Helpers de configuration multi-comptes / portes d’action, helpers de repli de compte par défaut |
    | `plugin-sdk/account-id` | `DEFAULT_ACCOUNT_ID`, helpers de normalisation d’identifiant de compte |
    | `plugin-sdk/account-resolution` | Helpers de recherche de compte + repli par défaut |
    | `plugin-sdk/account-helpers` | Helpers étroits de liste de comptes / actions de compte |
    | `plugin-sdk/channel-pairing` | `createChannelPairingController` |
    | `plugin-sdk/channel-reply-pipeline` | `createChannelReplyPipeline` |
    | `plugin-sdk/channel-config-helpers` | `createHybridChannelConfigAdapter` |
    | `plugin-sdk/channel-config-schema` | Types de schéma de configuration de canal |
    | `plugin-sdk/telegram-command-config` | Helpers de normalisation/validation des commandes personnalisées Telegram avec repli de contrat bundled |
    | `plugin-sdk/command-gating` | Helpers étroits de contrôle d’autorisation des commandes |
    | `plugin-sdk/channel-policy` | `resolveChannelGroupRequireMention` |
    | `plugin-sdk/channel-lifecycle` | `createAccountStatusSink`, helpers de cycle de vie/finalisation des flux de brouillon |
    | `plugin-sdk/inbound-envelope` | Helpers partagés de routage entrant + construction d’enveloppe |
    | `plugin-sdk/inbound-reply-dispatch` | Helpers partagés d’enregistrement et de dispatch entrant |
    | `plugin-sdk/messaging-targets` | Helpers d’analyse/correspondance des cibles |
    | `plugin-sdk/outbound-media` | Helpers partagés de chargement de médias sortants |
    | `plugin-sdk/outbound-runtime` | Helpers de livraison sortante, identité, délégué d’envoi, session, formatage et planification de charges utiles |
    | `plugin-sdk/poll-runtime` | Helpers étroits de normalisation de sondage |
    | `plugin-sdk/thread-bindings-runtime` | Helpers de cycle de vie et d’adaptateur de bindings de fil |
    | `plugin-sdk/agent-media-payload` | Constructeur hérité de charge utile média d’agent |
    | `plugin-sdk/conversation-runtime` | Helpers de binding de conversation/fil, d’appairage et de binding configuré |
    | `plugin-sdk/runtime-config-snapshot` | Helper d’instantané de configuration runtime |
    | `plugin-sdk/runtime-group-policy` | Helpers de résolution de politique de groupe runtime |
    | `plugin-sdk/channel-status` | Helpers partagés d’instantané/résumé d’état de canal |
    | `plugin-sdk/channel-config-primitives` | Primitives étroites de schéma de configuration de canal |
    | `plugin-sdk/channel-config-writes` | Helpers d’autorisation d’écriture de configuration de canal |
    | `plugin-sdk/channel-plugin-common` | Exports de prélude partagés de plugin de canal |
    | `plugin-sdk/allowlist-config-edit` | Helpers de lecture/modification de configuration de liste d’autorisation |
    | `plugin-sdk/group-access` | Helpers partagés de décision d’accès aux groupes |
    | `plugin-sdk/direct-dm` | Helpers partagés d’auth/guard pour messages privés directs |
    | `plugin-sdk/interactive-runtime` | Présentation sémantique des messages, livraison et helpers hérités de réponses interactives. Voir [Présentation des messages](/fr/plugins/message-presentation) |
    | `plugin-sdk/channel-inbound` | Barrel de compatibilité pour le debounce entrant, la correspondance de mention, les helpers de politique de mention et les helpers d’enveloppe |
    | `plugin-sdk/channel-inbound-debounce` | Helpers étroits de debounce entrant |
    | `plugin-sdk/channel-mention-gating` | Helpers étroits de politique de mention et de texte de mention sans la surface runtime entrante plus large |
    | `plugin-sdk/channel-envelope` | Helpers étroits de formatage d’enveloppe entrante |
    | `plugin-sdk/channel-location` | Helpers de contexte et de formatage de localisation de canal |
    | `plugin-sdk/channel-logging` | Helpers de journalisation de canal pour les abandons entrants et les échecs de typing/ack |
    | `plugin-sdk/channel-send-result` | Types de résultat de réponse |
    | `plugin-sdk/channel-actions` | Helpers d’action de message de canal, plus helpers de schéma natif obsolètes conservés pour la compatibilité des plugins |
    | `plugin-sdk/channel-targets` | Helpers d’analyse/correspondance des cibles |
    | `plugin-sdk/channel-contract` | Types de contrat de canal |
    | `plugin-sdk/channel-feedback` | Câblage des retours/réactions |
    | `plugin-sdk/channel-secret-runtime` | Helpers étroits de contrat de secret comme `collectSimpleChannelFieldAssignments`, `getChannelSurface`, `pushAssignment`, et types de cibles de secret |
  </Accordion>

  <Accordion title="Sous-chemins de fournisseur">
    | Sous-chemin | Exports clés |
    | --- | --- |
    | `plugin-sdk/provider-entry` | `defineSingleProviderPluginEntry` |
    | `plugin-sdk/provider-setup` | Helpers de configuration sélectionnés pour fournisseurs locaux/autohébergés |
    | `plugin-sdk/self-hosted-provider-setup` | Helpers ciblés de configuration de fournisseur autohébergé compatible OpenAI |
    | `plugin-sdk/cli-backend` | Valeurs par défaut de backend CLI + constantes watchdog |
    | `plugin-sdk/provider-auth-runtime` | Helpers runtime de résolution de clé API pour plugins de fournisseur |
    | `plugin-sdk/provider-auth-api-key` | Helpers d’onboarding/écriture de profil de clé API comme `upsertApiKeyProfile` |
    | `plugin-sdk/provider-auth-result` | Constructeur standard de résultat d’auth OAuth |
    | `plugin-sdk/provider-auth-login` | Helpers partagés de connexion interactive pour plugins de fournisseur |
    | `plugin-sdk/provider-env-vars` | Helpers de recherche de variables d’environnement d’auth de fournisseur |
    | `plugin-sdk/provider-auth` | `createProviderApiKeyAuthMethod`, `ensureApiKeyFromOptionEnvOrPrompt`, `upsertAuthProfile`, `upsertApiKeyProfile`, `writeOAuthCredentials` |
    | `plugin-sdk/provider-model-shared` | `ProviderReplayFamily`, `buildProviderReplayFamilyHooks`, `normalizeModelCompat`, constructeurs partagés de politique de relecture, helpers de point de terminaison fournisseur et helpers de normalisation d’identifiants de modèle comme `normalizeNativeXaiModelId` |
    | `plugin-sdk/provider-catalog-shared` | `findCatalogTemplate`, `buildSingleProviderApiKeyCatalog`, `supportsNativeStreamingUsageCompat`, `applyProviderNativeStreamingUsageCompat` |
    | `plugin-sdk/provider-http` | Helpers génériques de capacités HTTP/point de terminaison de fournisseur, erreurs HTTP de fournisseur et helpers de formulaire multipart pour transcription audio |
    | `plugin-sdk/provider-web-fetch-contract` | Helpers étroits de contrat de configuration/sélection web-fetch comme `enablePluginInConfig` et `WebFetchProviderPlugin` |
    | `plugin-sdk/provider-web-fetch` | Helpers d’enregistrement/cache de fournisseur web-fetch |
    | `plugin-sdk/provider-web-search-config-contract` | Helpers étroits de configuration/identifiants web-search pour les fournisseurs qui n’ont pas besoin du câblage d’activation de plugin |
    | `plugin-sdk/provider-web-search-contract` | Helpers étroits de contrat de configuration/identifiants web-search comme `createWebSearchProviderContractFields`, `enablePluginInConfig`, `resolveProviderWebSearchPluginConfig`, et setters/getters d’identifiants à portée |
    | `plugin-sdk/provider-web-search` | Helpers d’enregistrement/cache/runtime de fournisseur web-search |
    | `plugin-sdk/provider-tools` | `ProviderToolCompatFamily`, `buildProviderToolCompatFamilyHooks`, nettoyage de schéma Gemini + diagnostics, et helpers de compatibilité xAI comme `resolveXaiModelCompatPatch` / `applyXaiModelCompat` |
    | `plugin-sdk/provider-usage` | `fetchClaudeUsage` et similaires |
    | `plugin-sdk/provider-stream` | `ProviderStreamFamily`, `buildProviderStreamFamilyHooks`, `composeProviderStreamWrappers`, types d’enveloppe stream, et helpers partagés d’enveloppe Anthropic/Bedrock/Google/Kilocode/Moonshot/OpenAI/OpenRouter/Z.A.I/MiniMax/Copilot |
    | `plugin-sdk/provider-transport-runtime` | Helpers de transport natif de fournisseur comme fetch protégé, transformations de messages de transport et flux d’événements de transport inscriptibles |
    | `plugin-sdk/provider-onboard` | Helpers de patch de configuration d’onboarding |
    | `plugin-sdk/global-singleton` | Helpers de singleton/map/cache locaux au processus |
    | `plugin-sdk/group-activation` | Helpers étroits de mode d’activation de groupe et d’analyse de commandes |
  </Accordion>

  <Accordion title="Sous-chemins d’authentification et de sécurité">
    | Sous-chemin | Exports clés |
    | --- | --- |
    | `plugin-sdk/command-auth` | `resolveControlCommandGate`, helpers de registre de commandes incluant le formatage dynamique des menus d’arguments, helpers d’autorisation d’expéditeur |
    | `plugin-sdk/command-status` | Constructeurs de messages de commande/aide tels que `buildCommandsMessagePaginated` et `buildHelpMessage` |
    | `plugin-sdk/approval-auth-runtime` | Helpers de résolution des approbateurs et d’auth d’action dans la même conversation |
    | `plugin-sdk/approval-client-runtime` | Helpers de profil/filtre d’approbation Exec natifs |
    | `plugin-sdk/approval-delivery-runtime` | Adaptateurs natifs de capacité/livraison d’approbation |
    | `plugin-sdk/approval-gateway-runtime` | Helper partagé de résolution de passerelle d’approbation |
    | `plugin-sdk/approval-handler-adapter-runtime` | Helpers légers de chargement d’adaptateur d’approbation native pour points d’entrée de canaux chauds |
    | `plugin-sdk/approval-handler-runtime` | Helpers runtime plus larges de gestionnaire d’approbation ; préférez les surfaces plus étroites adapter/gateway lorsqu’elles suffisent |
    | `plugin-sdk/approval-native-runtime` | Helpers natifs de cible d’approbation + binding de compte |
    | `plugin-sdk/approval-reply-runtime` | Helpers de charge utile de réponse d’approbation Exec/plugin |
    | `plugin-sdk/approval-runtime` | Helpers de charge utile d’approbation Exec/plugin, helpers runtime/routage d’approbation native, et helpers d’affichage structuré d’approbation comme `formatApprovalDisplayPath` |
    | `plugin-sdk/reply-dedupe` | Helpers étroits de réinitialisation de déduplication de réponses entrantes |
    | `plugin-sdk/channel-contract-testing` | Helpers étroits de test de contrat de canal sans le large barrel de test |
    | `plugin-sdk/command-auth-native` | Auth de commande native, formatage dynamique des menus d’arguments, et helpers natifs de cible de session |
    | `plugin-sdk/command-detection` | Helpers partagés de détection de commandes |
    | `plugin-sdk/command-primitives-runtime` | Prédicats légers de texte de commande pour chemins de canal chauds |
    | `plugin-sdk/command-surface` | Helpers de normalisation du corps de commande et de surface de commande |
    | `plugin-sdk/allow-from` | `formatAllowFromLowercase` |
    | `plugin-sdk/channel-secret-runtime` | Helpers étroits de collecte de contrats de secrets pour surfaces de secrets de canal/plugin |
    | `plugin-sdk/secret-ref-runtime` | Helpers étroits `coerceSecretRef` et de typage SecretRef pour l’analyse de contrats de secrets/configuration |
    | `plugin-sdk/security-runtime` | Helpers partagés de confiance, contrôle DM, contenu externe et collecte de secrets |
    | `plugin-sdk/ssrf-policy` | Helpers de politique SSRF de liste d’autorisation d’hôte et de réseau privé |
    | `plugin-sdk/ssrf-dispatcher` | Helpers étroits de dispatcher épinglé sans la large surface runtime d’infrastructure |
    | `plugin-sdk/ssrf-runtime` | Helpers de dispatcher épinglé, fetch protégé contre SSRF et politique SSRF |
    | `plugin-sdk/secret-input` | Helpers d’analyse d’entrée secrète |
    | `plugin-sdk/webhook-ingress` | Helpers de requête/cible Webhook |
    | `plugin-sdk/webhook-request-guards` | Helpers de taille de corps de requête / délai d’expiration |
  </Accordion>

  <Accordion title="Sous-chemins de runtime et de stockage">
    | Sous-chemin | Exports clés |
    | --- | --- |
    | `plugin-sdk/runtime` | Helpers larges de runtime/journalisation/sauvegarde/installation de plugin |
    | `plugin-sdk/runtime-env` | Helpers étroits d’environnement runtime, logger, timeout, retry et backoff |
    | `plugin-sdk/channel-runtime-context` | Helpers génériques d’enregistrement et de recherche du contexte runtime de canal |
    | `plugin-sdk/runtime-store` | `createPluginRuntimeStore` |
    | `plugin-sdk/plugin-runtime` | Helpers partagés de plugin pour commande/hook/http/interactif |
    | `plugin-sdk/hook-runtime` | Helpers partagés de pipeline de Hook interne/webhook |
    | `plugin-sdk/lazy-runtime` | Helpers de chargement/import paresseux runtime tels que `createLazyRuntimeModule`, `createLazyRuntimeMethod` et `createLazyRuntimeSurface` |
    | `plugin-sdk/process-runtime` | Helpers d’exécution de processus |
    | `plugin-sdk/cli-runtime` | Helpers de formatage CLI, attente, version, invocation avec arguments et groupes de commandes paresseux |
    | `plugin-sdk/gateway-runtime` | Helpers de client Gateway et de patch de statut de canal |
    | `plugin-sdk/config-runtime` | Helpers de chargement/écriture de configuration et de recherche de configuration de plugin |
    | `plugin-sdk/telegram-command-config` | Normalisation du nom/de la description de commande Telegram et vérifications de doublons/conflits, même lorsque la surface de contrat Telegram bundled est indisponible |
    | `plugin-sdk/text-autolink-runtime` | Détection d’autolien de référence de fichier sans le large barrel text-runtime |
    | `plugin-sdk/approval-runtime` | Helpers d’approbation Exec/plugin, constructeurs de capacités d’approbation, helpers d’auth/profil, helpers runtime/routage natifs et formatage structuré du chemin d’affichage d’approbation |
    | `plugin-sdk/reply-runtime` | Helpers partagés de runtime entrant/réponse, segmentation, dispatch, Heartbeat, planificateur de réponse |
    | `plugin-sdk/reply-dispatch-runtime` | Helpers étroits de dispatch/finalisation de réponse et de libellé de conversation |
    | `plugin-sdk/reply-history` | Helpers partagés d’historique de réponse sur courte fenêtre tels que `buildHistoryContext`, `recordPendingHistoryEntry` et `clearHistoryEntriesIfEnabled` |
    | `plugin-sdk/reply-reference` | `createReplyReferencePlanner` |
    | `plugin-sdk/reply-chunking` | Helpers étroits de segmentation texte/Markdown |
    | `plugin-sdk/session-store-runtime` | Helpers de chemin de stockage de session + `updated-at` |
    | `plugin-sdk/state-paths` | Helpers de chemin de répertoire state/OAuth |
    | `plugin-sdk/routing` | Helpers de route / clé de session / binding de compte tels que `resolveAgentRoute`, `buildAgentSessionKey` et `resolveDefaultAgentBoundAccountId` |
    | `plugin-sdk/status-helpers` | Helpers partagés de résumé de statut de canal/compte, valeurs par défaut d’état runtime et helpers de métadonnées de problème |
    | `plugin-sdk/target-resolver-runtime` | Helpers partagés de résolution de cible |
    | `plugin-sdk/string-normalization-runtime` | Helpers de normalisation slug/chaîne |
    | `plugin-sdk/request-url` | Extraire des URL chaîne depuis des entrées de type fetch/request |
    | `plugin-sdk/run-command` | Exécuteur de commandes temporisé avec résultats stdout/stderr normalisés |
    | `plugin-sdk/param-readers` | Lecteurs communs de paramètres d’outil/CLI |
    | `plugin-sdk/tool-payload` | Extraire des charges utiles normalisées depuis des objets résultat d’outil |
    | `plugin-sdk/tool-send` | Extraire les champs cibles canoniques d’envoi depuis les arguments d’outil |
    | `plugin-sdk/temp-path` | Helpers partagés de chemin temporaire de téléchargement |
    | `plugin-sdk/logging-core` | Helpers de logger de sous-système et d’expurgation |
    | `plugin-sdk/markdown-table-runtime` | Helpers de mode et de conversion de tableaux Markdown |
    | `plugin-sdk/json-store` | Petits helpers de lecture/écriture d’état JSON |
    | `plugin-sdk/file-lock` | Helpers de verrouillage de fichier réentrant |
    | `plugin-sdk/persistent-dedupe` | Helpers de cache de déduplication adossé au disque |
    | `plugin-sdk/acp-runtime` | Helpers ACP de runtime/session et de dispatch de réponse |
    | `plugin-sdk/acp-binding-resolve-runtime` | Résolution de binding ACP en lecture seule sans imports de démarrage du cycle de vie |
    | `plugin-sdk/agent-config-primitives` | Primitives étroites de schéma de configuration runtime d’agent |
    | `plugin-sdk/boolean-param` | Lecteur souple de paramètre booléen |
    | `plugin-sdk/dangerous-name-runtime` | Helpers de résolution de correspondance de nom dangereux |
    | `plugin-sdk/device-bootstrap` | Helpers de bootstrap d’appareil et de jeton d’appairage |
    | `plugin-sdk/extension-shared` | Primitives utilitaires partagées de canal passif, statut et proxy ambiant |
    | `plugin-sdk/models-provider-runtime` | Helpers de réponse `/models` commande/fournisseur |
    | `plugin-sdk/skill-commands-runtime` | Helpers de listing de commandes Skills |
    | `plugin-sdk/native-command-registry` | Helpers de registre/build/sérialisation de commandes natives |
    | `plugin-sdk/agent-harness` | Surface expérimentale de confiance pour plugins de harnais d’agent de bas niveau : types de harnais, helpers de pilotage/abandon d’exécution active, helpers de pont d’outils OpenClaw, helpers de formatage/détail de progression d’outil, et utilitaires de résultat de tentative |
    | `plugin-sdk/provider-zai-endpoint` | Helpers de détection de point de terminaison Z.A.I |
    | `plugin-sdk/infra-runtime` | Helpers d’événement système / Heartbeat |
    | `plugin-sdk/collection-runtime` | Petits helpers de cache borné |
    | `plugin-sdk/diagnostic-runtime` | Helpers de drapeau et d’événement de diagnostic |
    | `plugin-sdk/error-runtime` | Graphe d’erreurs, formatage, helpers partagés de classification d’erreurs, `isApprovalNotFoundError` |
    | `plugin-sdk/fetch-runtime` | Helpers de fetch encapsulé, proxy et recherche épinglée |
    | `plugin-sdk/runtime-fetch` | Fetch runtime conscient du dispatcher sans imports de proxy/fetch protégé |
    | `plugin-sdk/response-limit-runtime` | Lecteur borné de corps de réponse sans la large surface media-runtime |
    | `plugin-sdk/session-binding-runtime` | État de binding de conversation courante sans routage de binding configuré ni stockages d’appairage |
    | `plugin-sdk/session-store-runtime` | Helpers de lecture du stockage de session sans imports larges d’écriture/maintenance de configuration |
    | `plugin-sdk/context-visibility-runtime` | Résolution de visibilité de contexte et filtrage de contexte supplémentaire sans imports larges de configuration/sécurité |
    | `plugin-sdk/string-coerce-runtime` | Helpers étroits de coercition/normalisation d’enregistrement primitif/chaîne sans imports Markdown/journalisation |
    | `plugin-sdk/host-runtime` | Helpers de normalisation de nom d’hôte et d’hôte SCP |
    | `plugin-sdk/retry-runtime` | Helpers de configuration de retry et d’exécuteur retry |
    | `plugin-sdk/agent-runtime` | Helpers de répertoire/identité/workspace d’agent |
    | `plugin-sdk/directory-runtime` | Requête/déduplication de répertoire adossée à la configuration |
    | `plugin-sdk/keyed-async-queue` | `KeyedAsyncQueue` |
  </Accordion>

  <Accordion title="Sous-chemins de capacité et de test">
    | Sous-chemin | Exports clés |
    | --- | --- |
    | `plugin-sdk/media-runtime` | Helpers partagés de récupération/transform/store de médias ainsi que constructeurs de charges utiles média |
    | `plugin-sdk/media-store` | Helpers étroits de stockage média tels que `saveMediaBuffer` |
    | `plugin-sdk/media-generation-runtime` | Helpers partagés de failover de génération média, sélection de candidats et messages de modèle manquant |
    | `plugin-sdk/media-understanding` | Types de fournisseur de compréhension média plus exports de helpers image/audio orientés fournisseur |
    | `plugin-sdk/text-runtime` | Helpers partagés de texte/Markdown/journalisation tels que suppression de texte visible par l’assistant, helpers de rendu/segmentation/tableau Markdown, helpers d’expurgation, helpers de balises directives, et utilitaires de texte sûr |
    | `plugin-sdk/text-chunking` | Helper de segmentation de texte sortant |
    | `plugin-sdk/speech` | Types de fournisseur de parole plus exports de helpers de directive, registre, validation et parole orientés fournisseur |
    | `plugin-sdk/speech-core` | Exports partagés de types de fournisseur de parole, registre, directive, normalisation et helpers de parole |
    | `plugin-sdk/realtime-transcription` | Types de fournisseur de transcription temps réel, helpers de registre et helper partagé de session WebSocket |
    | `plugin-sdk/realtime-voice` | Types de fournisseur de voix temps réel et helpers de registre |
    | `plugin-sdk/image-generation` | Types de fournisseur de génération d’image |
    | `plugin-sdk/image-generation-core` | Helpers partagés de types, failover, auth et registre de génération d’image |
    | `plugin-sdk/music-generation` | Types de fournisseur / requête / résultat de génération de musique |
    | `plugin-sdk/music-generation-core` | Types partagés de génération de musique, helpers de failover, recherche de fournisseur et analyse de référence de modèle |
    | `plugin-sdk/video-generation` | Types de fournisseur / requête / résultat de génération de vidéo |
    | `plugin-sdk/video-generation-core` | Types partagés de génération de vidéo, helpers de failover, recherche de fournisseur et analyse de référence de modèle |
    | `plugin-sdk/webhook-targets` | Registre de cibles Webhook et helpers d’installation de routes |
    | `plugin-sdk/webhook-path` | Helpers de normalisation de chemin Webhook |
    | `plugin-sdk/web-media` | Helpers partagés de chargement de médias distants/locaux |
    | `plugin-sdk/zod` | `zod` réexporté pour les consommateurs du SDK Plugin |
    | `plugin-sdk/testing` | `installCommonResolveTargetErrorCases`, `shouldAckReaction` |
  </Accordion>

  <Accordion title="Sous-chemins memory">
    | Sous-chemin | Exports clés |
    | --- | --- |
    | `plugin-sdk/memory-core` | Surface utilitaire bundled memory-core pour helpers de gestionnaire/configuration/fichier/CLI |
    | `plugin-sdk/memory-core-engine-runtime` | Façade runtime d’indexation/recherche memory |
    | `plugin-sdk/memory-core-host-engine-foundation` | Exports du moteur de fondation de l’hôte memory |
    | `plugin-sdk/memory-core-host-engine-embeddings` | Contrats d’embeddings de l’hôte memory, accès au registre, fournisseur local et helpers génériques batch/distants |
    | `plugin-sdk/memory-core-host-engine-qmd` | Exports du moteur QMD de l’hôte memory |
    | `plugin-sdk/memory-core-host-engine-storage` | Exports du moteur de stockage de l’hôte memory |
    | `plugin-sdk/memory-core-host-multimodal` | Helpers multimodaux de l’hôte memory |
    | `plugin-sdk/memory-core-host-query` | Helpers de requête de l’hôte memory |
    | `plugin-sdk/memory-core-host-secret` | Helpers de secrets de l’hôte memory |
    | `plugin-sdk/memory-core-host-events` | Helpers de journal d’événements de l’hôte memory |
    | `plugin-sdk/memory-core-host-status` | Helpers d’état de l’hôte memory |
    | `plugin-sdk/memory-core-host-runtime-cli` | Helpers runtime CLI de l’hôte memory |
    | `plugin-sdk/memory-core-host-runtime-core` | Helpers runtime core de l’hôte memory |
    | `plugin-sdk/memory-core-host-runtime-files` | Helpers de fichiers/runtime de l’hôte memory |
    | `plugin-sdk/memory-host-core` | Alias neutre vis-à-vis du fournisseur pour les helpers runtime core de l’hôte memory |
    | `plugin-sdk/memory-host-events` | Alias neutre vis-à-vis du fournisseur pour les helpers de journal d’événements de l’hôte memory |
    | `plugin-sdk/memory-host-files` | Alias neutre vis-à-vis du fournisseur pour les helpers de fichiers/runtime de l’hôte memory |
    | `plugin-sdk/memory-host-markdown` | Helpers partagés de Markdown géré pour les plugins adjacents à memory |
    | `plugin-sdk/memory-host-search` | Façade runtime Active Memory pour l’accès au gestionnaire de recherche |
    | `plugin-sdk/memory-host-status` | Alias neutre vis-à-vis du fournisseur pour les helpers d’état de l’hôte memory |
    | `plugin-sdk/memory-lancedb` | Surface utilitaire bundled memory-lancedb |
  </Accordion>

  <Accordion title="Sous-chemins utilitaires bundled réservés">
    | Famille | Sous-chemins actuels | Usage prévu |
    | --- | --- | --- |
    | Browser | `plugin-sdk/browser-cdp`, `plugin-sdk/browser-config-runtime`, `plugin-sdk/browser-config-support`, `plugin-sdk/browser-control-auth`, `plugin-sdk/browser-node-runtime`, `plugin-sdk/browser-profiles`, `plugin-sdk/browser-security-runtime`, `plugin-sdk/browser-setup-tools`, `plugin-sdk/browser-support` | Helpers de prise en charge du Plugin browser bundled. `browser-profiles` exporte `resolveBrowserConfig`, `resolveProfile`, `ResolvedBrowserConfig`, `ResolvedBrowserProfile` et `ResolvedBrowserTabCleanupConfig` pour la forme normalisée `browser.tabCleanup`. `browser-support` reste le barrel de compatibilité. |
    | Matrix | `plugin-sdk/matrix`, `plugin-sdk/matrix-helper`, `plugin-sdk/matrix-runtime-heavy`, `plugin-sdk/matrix-runtime-shared`, `plugin-sdk/matrix-runtime-surface`, `plugin-sdk/matrix-surface`, `plugin-sdk/matrix-thread-bindings` | Surface utilitaire/runtime Matrix bundled |
    | Line | `plugin-sdk/line`, `plugin-sdk/line-core`, `plugin-sdk/line-runtime`, `plugin-sdk/line-surface` | Surface utilitaire/runtime LINE bundled |
    | IRC | `plugin-sdk/irc`, `plugin-sdk/irc-surface` | Surface utilitaire IRC bundled |
    | Helpers spécifiques aux canaux | `plugin-sdk/googlechat`, `plugin-sdk/zalouser`, `plugin-sdk/bluebubbles`, `plugin-sdk/bluebubbles-policy`, `plugin-sdk/mattermost`, `plugin-sdk/mattermost-policy`, `plugin-sdk/feishu-conversation`, `plugin-sdk/msteams`, `plugin-sdk/nextcloud-talk`, `plugin-sdk/nostr`, `plugin-sdk/tlon`, `plugin-sdk/twitch` | Jonctions bundled de compatibilité / helpers de canal |
    | Helpers spécifiques à l’auth/plugin | `plugin-sdk/github-copilot-login`, `plugin-sdk/github-copilot-token`, `plugin-sdk/diagnostics-otel`, `plugin-sdk/diffs`, `plugin-sdk/llm-task`, `plugin-sdk/thread-ownership`, `plugin-sdk/voice-call` | Jonctions bundled de fonctionnalités/plugins ; `plugin-sdk/github-copilot-token` exporte actuellement `DEFAULT_COPILOT_API_BASE_URL`, `deriveCopilotApiBaseUrlFromToken` et `resolveCopilotApiToken` |
  </Accordion>
</AccordionGroup>

## Liens associés

- [Aperçu du SDK Plugin](/fr/plugins/sdk-overview)
- [Configuration du SDK Plugin](/fr/plugins/sdk-setup)
- [Créer des plugins](/fr/plugins/building-plugins)
