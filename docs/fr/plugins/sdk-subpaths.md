---
read_when:
    - Choisir le bon sous-chemin de plugin-sdk pour une importation de Plugin
    - Audit des sous-chemins de bundled-plugin et des surfaces d’assistance
summary: 'Catalogue des sous-chemins du Plugin SDK : où se trouvent quelles importations, regroupées par domaine'
title: Sous-chemins du Plugin SDK
x-i18n:
    generated_at: "2026-04-24T08:57:07Z"
    model: gpt-5.4
    provider: openai
    source_hash: 20b923e392b3ec65cfc958ccc7452b52d82bc372ae57cc9becad74a5085ed71b
    source_path: plugins/sdk-subpaths.md
    workflow: 15
---

  Le Plugin SDK est exposé comme un ensemble de sous-chemins étroits sous `openclaw/plugin-sdk/`.
  Cette page répertorie les sous-chemins couramment utilisés, regroupés par usage. La liste complète générée
  de plus de 200 sous-chemins se trouve dans `scripts/lib/plugin-sdk-entrypoints.json` ;
  les sous-chemins d’assistance réservés à bundled-plugin y apparaissent, mais sont des détails
  d’implémentation, sauf si une page de documentation les met explicitement en avant.

  Pour le guide de création de Plugin, voir [vue d’ensemble du Plugin SDK](/fr/plugins/sdk-overview).

  ## Entrée de Plugin

  | Sous-chemin                | Exportations clés                                                                                                                      |
  | -------------------------- | -------------------------------------------------------------------------------------------------------------------------------------- |
  | `plugin-sdk/plugin-entry`   | `definePluginEntry`                                                                                                                    |
  | `plugin-sdk/core`           | `defineChannelPluginEntry`, `createChatChannelPlugin`, `createChannelPluginBase`, `defineSetupPluginEntry`, `buildChannelConfigSchema` |
  | `plugin-sdk/config-schema`  | `OpenClawSchema`                                                                                                                       |
  | `plugin-sdk/provider-entry` | `defineSingleProviderPluginEntry`                                                                                                      |

  <AccordionGroup>
  <Accordion title="Sous-chemins de canal">
    | Sous-chemin | Exportations clés |
    | --- | --- |
    | `plugin-sdk/channel-core` | `defineChannelPluginEntry`, `defineSetupPluginEntry`, `createChatChannelPlugin`, `createChannelPluginBase` |
    | `plugin-sdk/config-schema` | Exportation du schéma Zod racine `openclaw.json` (`OpenClawSchema`) |
    | `plugin-sdk/channel-setup` | `createOptionalChannelSetupSurface`, `createOptionalChannelSetupAdapter`, `createOptionalChannelSetupWizard`, ainsi que `DEFAULT_ACCOUNT_ID`, `createTopLevelChannelDmPolicy`, `setSetupChannelEnabled`, `splitSetupEntries` |
    | `plugin-sdk/setup` | Assistants partagés pour l’assistant de configuration, invites de liste d’autorisation, constructeurs d’état de configuration |
    | `plugin-sdk/setup-runtime` | `createPatchedAccountSetupAdapter`, `createEnvPatchedAccountSetupAdapter`, `createSetupInputPresenceValidator`, `noteChannelLookupFailure`, `noteChannelLookupSummary`, `promptResolvedAllowFrom`, `splitSetupEntries`, `createAllowlistSetupWizardProxy`, `createDelegatedSetupWizardProxy` |
    | `plugin-sdk/setup-adapter-runtime` | `createEnvPatchedAccountSetupAdapter` |
    | `plugin-sdk/setup-tools` | `formatCliCommand`, `detectBinary`, `extractArchive`, `resolveBrewExecutable`, `formatDocsLink`, `CONFIG_DIR` |
    | `plugin-sdk/account-core` | Assistants de configuration multi-compte/contrôle d’actions, assistants de repli vers le compte par défaut |
    | `plugin-sdk/account-id` | `DEFAULT_ACCOUNT_ID`, assistants de normalisation d’identifiant de compte |
    | `plugin-sdk/account-resolution` | Assistants de recherche de compte + repli par défaut |
    | `plugin-sdk/account-helpers` | Assistants ciblés pour les listes de comptes et les actions sur les comptes |
    | `plugin-sdk/channel-pairing` | `createChannelPairingController` |
    | `plugin-sdk/channel-reply-pipeline` | `createChannelReplyPipeline` |
    | `plugin-sdk/channel-config-helpers` | `createHybridChannelConfigAdapter` |
    | `plugin-sdk/channel-config-schema` | Types de schéma de configuration de canal |
    | `plugin-sdk/telegram-command-config` | Assistants de normalisation/validation des commandes personnalisées Telegram avec repli vers le contrat bundled |
    | `plugin-sdk/command-gating` | Assistants ciblés de contrôle d’autorisation des commandes |
    | `plugin-sdk/channel-policy` | `resolveChannelGroupRequireMention` |
    | `plugin-sdk/channel-lifecycle` | `createAccountStatusSink`, assistants de cycle de vie/finalisation des flux de brouillons |
    | `plugin-sdk/inbound-envelope` | Assistants partagés pour les routes entrantes + la construction d’enveloppes |
    | `plugin-sdk/inbound-reply-dispatch` | Assistants partagés pour l’enregistrement et la distribution des réponses entrantes |
    | `plugin-sdk/messaging-targets` | Assistants d’analyse/correspondance des cibles |
    | `plugin-sdk/outbound-media` | Assistants partagés de chargement des médias sortants |
    | `plugin-sdk/outbound-runtime` | Assistants pour l’identité sortante, le délégué d’envoi et la planification de charge utile |
    | `plugin-sdk/poll-runtime` | Assistants ciblés de normalisation des sondages |
    | `plugin-sdk/thread-bindings-runtime` | Assistants pour le cycle de vie des liaisons de fils et les adaptateurs |
    | `plugin-sdk/agent-media-payload` | Constructeur hérité de charge utile média d’agent |
    | `plugin-sdk/conversation-runtime` | Assistants pour les liaisons de conversation/fil, l’appairage et les liaisons configurées |
    | `plugin-sdk/runtime-config-snapshot` | Assistant d’instantané de configuration d’exécution |
    | `plugin-sdk/runtime-group-policy` | Assistants de résolution de politique de groupe à l’exécution |
    | `plugin-sdk/channel-status` | Assistants partagés d’instantané/résumé de l’état du canal |
    | `plugin-sdk/channel-config-primitives` | Primitives ciblées de schéma de configuration de canal |
    | `plugin-sdk/channel-config-writes` | Assistants d’autorisation d’écriture de configuration de canal |
    | `plugin-sdk/channel-plugin-common` | Exportations de prélude partagées pour Plugin de canal |
    | `plugin-sdk/allowlist-config-edit` | Assistants de lecture/modification de configuration de liste d’autorisation |
    | `plugin-sdk/group-access` | Assistants partagés de décision d’accès de groupe |
    | `plugin-sdk/direct-dm` | Assistants partagés d’authentification/garde-fou pour messages directs |
    | `plugin-sdk/interactive-runtime` | Assistants pour la présentation sémantique des messages, la livraison et les réponses interactives héritées. Voir [Présentation des messages](/fr/plugins/message-presentation) |
    | `plugin-sdk/channel-inbound` | Barrel de compatibilité pour l’anti-rebond entrant, la correspondance de mention, les assistants de politique de mention et les assistants d’enveloppe |
    | `plugin-sdk/channel-inbound-debounce` | Assistants ciblés d’anti-rebond entrant |
    | `plugin-sdk/channel-mention-gating` | Assistants ciblés pour la politique de mention et le texte de mention, sans la surface d’exécution entrante plus large |
    | `plugin-sdk/channel-envelope` | Assistants ciblés de formatage des enveloppes entrantes |
    | `plugin-sdk/channel-location` | Assistants de contexte et de formatage d’emplacement du canal |
    | `plugin-sdk/channel-logging` | Assistants de journalisation de canal pour les abandons entrants et les échecs de saisie/accusé de réception |
    | `plugin-sdk/channel-send-result` | Types de résultat de réponse |
    | `plugin-sdk/channel-actions` | Assistants d’actions sur les messages de canal, ainsi que des assistants de schéma natif obsolètes conservés pour la compatibilité des Plugin |
    | `plugin-sdk/channel-targets` | Assistants d’analyse/correspondance des cibles |
    | `plugin-sdk/channel-contract` | Types de contrat de canal |
    | `plugin-sdk/channel-feedback` | Câblage des retours/réactions |
    | `plugin-sdk/channel-secret-runtime` | Assistants ciblés de contrat de secret tels que `collectSimpleChannelFieldAssignments`, `getChannelSurface`, `pushAssignment` et les types de cible de secret |
  </Accordion>

  <Accordion title="Sous-chemins de fournisseur">
    | Sous-chemin | Exportations clés |
    | --- | --- |
    | `plugin-sdk/provider-entry` | `defineSingleProviderPluginEntry` |
    | `plugin-sdk/provider-setup` | Assistants de configuration sélectionnés pour les fournisseurs locaux/autohébergés |
    | `plugin-sdk/self-hosted-provider-setup` | Assistants ciblés de configuration de fournisseur autohébergé compatible OpenAI |
    | `plugin-sdk/cli-backend` | Valeurs par défaut du backend CLI + constantes de surveillance |
    | `plugin-sdk/provider-auth-runtime` | Assistants d’exécution pour la résolution des clés API pour les Plugin de fournisseur |
    | `plugin-sdk/provider-auth-api-key` | Assistants d’intégration/écriture de profil de clé API tels que `upsertApiKeyProfile` |
    | `plugin-sdk/provider-auth-result` | Constructeur standard de résultat d’authentification OAuth |
    | `plugin-sdk/provider-auth-login` | Assistants partagés de connexion interactive pour les Plugin de fournisseur |
    | `plugin-sdk/provider-env-vars` | Assistants de recherche des variables d’environnement d’authentification du fournisseur |
    | `plugin-sdk/provider-auth` | `createProviderApiKeyAuthMethod`, `ensureApiKeyFromOptionEnvOrPrompt`, `upsertAuthProfile`, `upsertApiKeyProfile`, `writeOAuthCredentials` |
    | `plugin-sdk/provider-model-shared` | `ProviderReplayFamily`, `buildProviderReplayFamilyHooks`, `normalizeModelCompat`, constructeurs partagés de politique de relecture, assistants d’endpoint fournisseur, et assistants de normalisation d’identifiant de modèle tels que `normalizeNativeXaiModelId` |
    | `plugin-sdk/provider-catalog-shared` | `findCatalogTemplate`, `buildSingleProviderApiKeyCatalog`, `supportsNativeStreamingUsageCompat`, `applyProviderNativeStreamingUsageCompat` |
    | `plugin-sdk/provider-http` | Assistants génériques de capacité HTTP/endpoint fournisseur, y compris les assistants de formulaire multipart pour la transcription audio |
    | `plugin-sdk/provider-web-fetch-contract` | Assistants ciblés de contrat de configuration/sélection web-fetch tels que `enablePluginInConfig` et `WebFetchProviderPlugin` |
    | `plugin-sdk/provider-web-fetch` | Assistants d’enregistrement/cache pour les fournisseurs web-fetch |
    | `plugin-sdk/provider-web-search-config-contract` | Assistants ciblés de configuration/identifiants web-search pour les fournisseurs qui n’ont pas besoin du câblage d’activation de Plugin |
    | `plugin-sdk/provider-web-search-contract` | Assistants ciblés de contrat de configuration/identifiants web-search tels que `createWebSearchProviderContractFields`, `enablePluginInConfig`, `resolveProviderWebSearchPluginConfig` et des accesseurs/mutateurs d’identifiants à portée limitée |
    | `plugin-sdk/provider-web-search` | Assistants d’enregistrement/cache/exécution pour les fournisseurs web-search |
    | `plugin-sdk/provider-tools` | `ProviderToolCompatFamily`, `buildProviderToolCompatFamilyHooks`, nettoyage de schéma Gemini + diagnostics, et assistants de compatibilité xAI tels que `resolveXaiModelCompatPatch` / `applyXaiModelCompat` |
    | `plugin-sdk/provider-usage` | `fetchClaudeUsage` et similaires |
    | `plugin-sdk/provider-stream` | `ProviderStreamFamily`, `buildProviderStreamFamilyHooks`, `composeProviderStreamWrappers`, types d’enveloppes de flux, et assistants d’enveloppes partagés pour Anthropic/Bedrock/Google/Kilocode/Moonshot/OpenAI/OpenRouter/Z.A.I/MiniMax/Copilot |
    | `plugin-sdk/provider-transport-runtime` | Assistants de transport natif fournisseur tels que fetch protégé, transformations de messages de transport et flux d’événements de transport inscriptibles |
    | `plugin-sdk/provider-onboard` | Assistants de correctif de configuration d’intégration |
    | `plugin-sdk/global-singleton` | Assistants de singleton/map/cache locaux au processus |
    | `plugin-sdk/group-activation` | Assistants ciblés pour le mode d’activation de groupe et l’analyse des commandes |
  </Accordion>

  <Accordion title="Sous-chemins d’authentification et de sécurité">
    | Sous-chemin | Exportations clés |
    | --- | --- |
    | `plugin-sdk/command-auth` | `resolveControlCommandGate`, assistants de registre de commandes, assistants d’autorisation d’expéditeur |
    | `plugin-sdk/command-status` | Constructeurs de messages de commande/d’aide tels que `buildCommandsMessagePaginated` et `buildHelpMessage` |
    | `plugin-sdk/approval-auth-runtime` | Résolution de l’approbateur et assistants d’authentification d’action dans le même chat |
    | `plugin-sdk/approval-client-runtime` | Assistants de profil/filtre d’approbation d’exécution native |
    | `plugin-sdk/approval-delivery-runtime` | Adaptateurs natifs de capacité/livraison d’approbation |
    | `plugin-sdk/approval-gateway-runtime` | Assistant partagé de résolution de Gateway d’approbation |
    | `plugin-sdk/approval-handler-adapter-runtime` | Assistants légers de chargement d’adaptateur d’approbation native pour les points d’entrée de canal à chaud |
    | `plugin-sdk/approval-handler-runtime` | Assistants d’exécution plus larges pour le gestionnaire d’approbation ; préférez les interfaces plus étroites d’adaptateur/Gateway lorsqu’elles suffisent |
    | `plugin-sdk/approval-native-runtime` | Assistants de cible d’approbation native + liaison de compte |
    | `plugin-sdk/approval-reply-runtime` | Assistants de charge utile de réponse d’approbation exec/Plugin |
    | `plugin-sdk/reply-dedupe` | Assistants étroits de réinitialisation de déduplication des réponses entrantes |
    | `plugin-sdk/channel-contract-testing` | Assistants étroits de test de contrat de canal sans le barrel de test étendu |
    | `plugin-sdk/command-auth-native` | Authentification de commande native + assistants natifs de cible de session |
    | `plugin-sdk/command-detection` | Assistants partagés de détection de commande |
    | `plugin-sdk/command-primitives-runtime` | Prédicats légers sur le texte de commande pour les chemins de canal à chaud |
    | `plugin-sdk/command-surface` | Normalisation du corps de commande et assistants de surface de commande |
    | `plugin-sdk/allow-from` | `formatAllowFromLowercase` |
    | `plugin-sdk/channel-secret-runtime` | Assistants étroits de collecte de contrat de secret pour les surfaces de secret de canal/Plugin |
    | `plugin-sdk/secret-ref-runtime` | Assistants étroits `coerceSecretRef` et de typage SecretRef pour l’analyse du contrat de secret/de la configuration |
    | `plugin-sdk/security-runtime` | Assistants partagés de confiance, filtrage DM, contenu externe et collecte de secrets |
    | `plugin-sdk/ssrf-policy` | Assistants de politique SSRF pour liste d’autorisation d’hôtes et réseau privé |
    | `plugin-sdk/ssrf-dispatcher` | Assistants étroits de répartiteur épinglé sans la large surface d’exécution d’infrastructure |
    | `plugin-sdk/ssrf-runtime` | Répartiteur épinglé, fetch protégé contre SSRF et assistants de politique SSRF |
    | `plugin-sdk/secret-input` | Assistants d’analyse des entrées secrètes |
    | `plugin-sdk/webhook-ingress` | Assistants de requête/cible Webhook |
    | `plugin-sdk/webhook-request-guards` | Assistants de taille du corps de requête/délai d’expiration |
  </Accordion>

  <Accordion title="Sous-chemins d’exécution et de stockage">
    | Sous-chemin | Exportations clés |
    | --- | --- |
    | `plugin-sdk/runtime` | Assistants étendus d’exécution/journalisation/sauvegarde/installation de Plugin |
    | `plugin-sdk/runtime-env` | Assistants étroits d’environnement d’exécution, journaliseur, délai d’expiration, nouvelle tentative et backoff |
    | `plugin-sdk/channel-runtime-context` | Assistants génériques d’enregistrement et de recherche de contexte d’exécution de canal |
    | `plugin-sdk/runtime-store` | `createPluginRuntimeStore` |
    | `plugin-sdk/plugin-runtime` | Assistants partagés de commande/hook/http/interaction pour Plugin |
    | `plugin-sdk/hook-runtime` | Assistants partagés de pipeline de Webhook/hook interne |
    | `plugin-sdk/lazy-runtime` | Assistants d’importation/liaison différée à l’exécution tels que `createLazyRuntimeModule`, `createLazyRuntimeMethod` et `createLazyRuntimeSurface` |
    | `plugin-sdk/process-runtime` | Assistants d’exécution de processus |
    | `plugin-sdk/cli-runtime` | Assistants de formatage, d’attente et de version CLI |
    | `plugin-sdk/gateway-runtime` | Assistants de client Gateway et de correctif d’état de canal |
    | `plugin-sdk/config-runtime` | Assistants de chargement/écriture de configuration et assistants de recherche de configuration de Plugin |
    | `plugin-sdk/telegram-command-config` | Normalisation du nom/de la description des commandes Telegram et vérifications de doublons/conflits, même lorsque la surface de contrat Telegram bundled n’est pas disponible |
    | `plugin-sdk/text-autolink-runtime` | Détection d’autoliens de références de fichiers sans le large barrel text-runtime |
    | `plugin-sdk/approval-runtime` | Assistants d’approbation exec/Plugin, constructeurs de capacité d’approbation, assistants d’authentification/profil, assistants natifs de routage/exécution |
    | `plugin-sdk/reply-runtime` | Assistants partagés d’exécution entrante/de réponse, segmentation, distribution, Heartbeat, planificateur de réponse |
    | `plugin-sdk/reply-dispatch-runtime` | Assistants étroits de distribution/finalisation de réponse et d’étiquette de conversation |
    | `plugin-sdk/reply-history` | Assistants partagés d’historique des réponses sur courte fenêtre tels que `buildHistoryContext`, `recordPendingHistoryEntry` et `clearHistoryEntriesIfEnabled` |
    | `plugin-sdk/reply-reference` | `createReplyReferencePlanner` |
    | `plugin-sdk/reply-chunking` | Assistants étroits de segmentation de texte/Markdown |
    | `plugin-sdk/session-store-runtime` | Assistants de chemin de magasin de session + date de mise à jour |
    | `plugin-sdk/state-paths` | Assistants de chemins de répertoires d’état/OAuth |
    | `plugin-sdk/routing` | Assistants de liaison route/clé de session/compte tels que `resolveAgentRoute`, `buildAgentSessionKey` et `resolveDefaultAgentBoundAccountId` |
    | `plugin-sdk/status-helpers` | Assistants partagés de résumé d’état canal/compte, valeurs par défaut d’état d’exécution et assistants de métadonnées de problème |
    | `plugin-sdk/target-resolver-runtime` | Assistants partagés de résolution de cible |
    | `plugin-sdk/string-normalization-runtime` | Assistants de normalisation de slug/chaîne |
    | `plugin-sdk/request-url` | Extraire des URL sous forme de chaîne à partir d’entrées de type fetch/request |
    | `plugin-sdk/run-command` | Exécuteur de commande temporisé avec résultats `stdout`/`stderr` normalisés |
    | `plugin-sdk/param-readers` | Lecteurs communs de paramètres d’outil/CLI |
    | `plugin-sdk/tool-payload` | Extraire des charges utiles normalisées à partir d’objets de résultat d’outil |
    | `plugin-sdk/tool-send` | Extraire les champs cibles d’envoi canoniques à partir des arguments d’outil |
    | `plugin-sdk/temp-path` | Assistants partagés de chemins temporaires de téléchargement |
    | `plugin-sdk/logging-core` | Assistants de journaliseur de sous-système et de masquage |
    | `plugin-sdk/markdown-table-runtime` | Assistants de mode de tableau Markdown et de conversion |
    | `plugin-sdk/json-store` | Petits assistants de lecture/écriture d’état JSON |
    | `plugin-sdk/file-lock` | Assistants de verrou de fichier réentrant |
    | `plugin-sdk/persistent-dedupe` | Assistants de cache de déduplication adossé au disque |
    | `plugin-sdk/acp-runtime` | Assistants d’exécution/session ACP et de distribution de réponse |
    | `plugin-sdk/acp-binding-resolve-runtime` | Résolution en lecture seule des liaisons ACP sans importations de démarrage du cycle de vie |
    | `plugin-sdk/agent-config-primitives` | Primitives étroites de schéma de configuration d’exécution d’agent |
    | `plugin-sdk/boolean-param` | Lecteur permissif de paramètre booléen |
    | `plugin-sdk/dangerous-name-runtime` | Assistants de résolution de correspondance de noms dangereux |
    | `plugin-sdk/device-bootstrap` | Assistants d’initialisation d’appareil et de jeton d’appairage |
    | `plugin-sdk/extension-shared` | Primitives d’assistance partagées pour canal passif, état et proxy ambiant |
    | `plugin-sdk/models-provider-runtime` | Assistants de réponse de fournisseur/commande `/models` |
    | `plugin-sdk/skill-commands-runtime` | Assistants de listage des commandes Skills |
    | `plugin-sdk/native-command-registry` | Assistants natifs de registre/construction/sérialisation de commandes |
    | `plugin-sdk/agent-harness` | Surface expérimentale de Plugin de confiance pour harnais d’agent de bas niveau : types de harnais, assistants de pilotage/abandon d’exécution active, assistants de pont d’outil OpenClaw, assistants de formatage/détail de progression d’outil et utilitaires de résultat de tentative |
    | `plugin-sdk/provider-zai-endpoint` | Assistants de détection d’endpoint Z.A.I |
    | `plugin-sdk/infra-runtime` | Assistants d’événement système/Heartbeat |
    | `plugin-sdk/collection-runtime` | Petits assistants de cache borné |
    | `plugin-sdk/diagnostic-runtime` | Assistants d’indicateur et d’événement de diagnostic |
    | `plugin-sdk/error-runtime` | Graphe d’erreurs, formatage, assistants partagés de classification des erreurs, `isApprovalNotFoundError` |
    | `plugin-sdk/fetch-runtime` | Assistants de fetch encapsulé, proxy et recherche épinglée |
    | `plugin-sdk/runtime-fetch` | Fetch d’exécution tenant compte du répartiteur, sans importations de proxy/fetch protégé |
    | `plugin-sdk/response-limit-runtime` | Lecteur borné de corps de réponse sans la large surface d’exécution média |
    | `plugin-sdk/session-binding-runtime` | État actuel de liaison de conversation sans routage de liaison configurée ni magasins d’appairage |
    | `plugin-sdk/session-store-runtime` | Assistants de lecture du magasin de session sans importations étendues d’écriture/maintenance de configuration |
    | `plugin-sdk/context-visibility-runtime` | Résolution de visibilité du contexte et filtrage du contexte supplémentaire sans importations étendues de configuration/sécurité |
    | `plugin-sdk/string-coerce-runtime` | Assistants étroits de conversion/normalisation de chaîne et d’enregistrement primitif, sans importations Markdown/journalisation |
    | `plugin-sdk/host-runtime` | Assistants de normalisation de nom d’hôte et d’hôte SCP |
    | `plugin-sdk/retry-runtime` | Assistants de configuration et d’exécuteur de nouvelle tentative |
    | `plugin-sdk/agent-runtime` | Assistants de répertoire/identité/espace de travail d’agent |
    | `plugin-sdk/directory-runtime` | Requête/déduplication de répertoire adossée à la configuration |
    | `plugin-sdk/keyed-async-queue` | `KeyedAsyncQueue` |
  </Accordion>

  <Accordion title="Sous-chemins de capacités et de test">
    | Sous-chemin | Exportations clés |
    | --- | --- |
    | `plugin-sdk/media-runtime` | Assistants partagés de récupération/transformation/stockage de médias, plus constructeurs de charge utile média |
    | `plugin-sdk/media-store` | Assistants étroits de magasin média tels que `saveMediaBuffer` |
    | `plugin-sdk/media-generation-runtime` | Assistants partagés de bascule de génération de média, sélection de candidats et messages de modèle manquant |
    | `plugin-sdk/media-understanding` | Types de fournisseur de compréhension de média, plus exportations d’assistants image/audio destinés aux fournisseurs |
    | `plugin-sdk/text-runtime` | Assistants partagés de texte/Markdown/journalisation tels que suppression du texte visible par l’assistant, assistants de rendu/segmentation/tableau Markdown, assistants de masquage, assistants de balises de directive et utilitaires de texte sûr |
    | `plugin-sdk/text-chunking` | Assistant de segmentation de texte sortant |
    | `plugin-sdk/speech` | Types de fournisseur de parole, plus assistants de directive, registre et validation destinés aux fournisseurs |
    | `plugin-sdk/speech-core` | Assistants partagés de types de fournisseur de parole, registre, directive et normalisation |
    | `plugin-sdk/realtime-transcription` | Types de fournisseur de transcription en temps réel, assistants de registre et assistant partagé de session WebSocket |
    | `plugin-sdk/realtime-voice` | Types de fournisseur de voix en temps réel et assistants de registre |
    | `plugin-sdk/image-generation` | Types de fournisseur de génération d’image |
    | `plugin-sdk/image-generation-core` | Assistants partagés de types de génération d’image, bascule, authentification et registre |
    | `plugin-sdk/music-generation` | Types de fournisseur/requête/résultat de génération musicale |
    | `plugin-sdk/music-generation-core` | Assistants partagés de types de génération musicale, assistants de bascule, recherche de fournisseur et analyse de référence de modèle |
    | `plugin-sdk/video-generation` | Types de fournisseur/requête/résultat de génération vidéo |
    | `plugin-sdk/video-generation-core` | Assistants partagés de types de génération vidéo, assistants de bascule, recherche de fournisseur et analyse de référence de modèle |
    | `plugin-sdk/webhook-targets` | Registre de cibles Webhook et assistants d’installation de route |
    | `plugin-sdk/webhook-path` | Assistants de normalisation de chemin Webhook |
    | `plugin-sdk/web-media` | Assistants partagés de chargement de médias distants/locaux |
    | `plugin-sdk/zod` | `zod` réexporté pour les consommateurs du Plugin SDK |
    | `plugin-sdk/testing` | `installCommonResolveTargetErrorCases`, `shouldAckReaction` |
  </Accordion>

  <Accordion title="Sous-chemins de mémoire">
    | Sous-chemin | Exportations clés |
    | --- | --- |
    | `plugin-sdk/memory-core` | Surface d’assistance `memory-core` bundled pour les assistants de gestionnaire/configuration/fichier/CLI |
    | `plugin-sdk/memory-core-engine-runtime` | Façade d’exécution d’indexation/recherche mémoire |
    | `plugin-sdk/memory-core-host-engine-foundation` | Exportations du moteur de base de l’hôte mémoire |
    | `plugin-sdk/memory-core-host-engine-embeddings` | Contrats d’embeddings de l’hôte mémoire, accès au registre, fournisseur local et assistants génériques de lot/distant |
    | `plugin-sdk/memory-core-host-engine-qmd` | Exportations du moteur QMD de l’hôte mémoire |
    | `plugin-sdk/memory-core-host-engine-storage` | Exportations du moteur de stockage de l’hôte mémoire |
    | `plugin-sdk/memory-core-host-multimodal` | Assistants multimodaux de l’hôte mémoire |
    | `plugin-sdk/memory-core-host-query` | Assistants de requête de l’hôte mémoire |
    | `plugin-sdk/memory-core-host-secret` | Assistants de secret de l’hôte mémoire |
    | `plugin-sdk/memory-core-host-events` | Assistants de journal d’événements de l’hôte mémoire |
    | `plugin-sdk/memory-core-host-status` | Assistants d’état de l’hôte mémoire |
    | `plugin-sdk/memory-core-host-runtime-cli` | Assistants d’exécution CLI de l’hôte mémoire |
    | `plugin-sdk/memory-core-host-runtime-core` | Assistants d’exécution cœur de l’hôte mémoire |
    | `plugin-sdk/memory-core-host-runtime-files` | Assistants de fichier/exécution de l’hôte mémoire |
    | `plugin-sdk/memory-host-core` | Alias neutre vis-à-vis du fournisseur pour les assistants d’exécution cœur de l’hôte mémoire |
    | `plugin-sdk/memory-host-events` | Alias neutre vis-à-vis du fournisseur pour les assistants de journal d’événements de l’hôte mémoire |
    | `plugin-sdk/memory-host-files` | Alias neutre vis-à-vis du fournisseur pour les assistants de fichier/exécution de l’hôte mémoire |
    | `plugin-sdk/memory-host-markdown` | Assistants partagés de Markdown géré pour les Plugins proches de la mémoire |
    | `plugin-sdk/memory-host-search` | Façade d’exécution de Active Memory pour l’accès au gestionnaire de recherche |
    | `plugin-sdk/memory-host-status` | Alias neutre vis-à-vis du fournisseur pour les assistants d’état de l’hôte mémoire |
    | `plugin-sdk/memory-lancedb` | Surface d’assistance `memory-lancedb` bundled |
  </Accordion>

  <Accordion title="Sous-chemins d’assistance bundled réservés">
    | Famille | Sous-chemins actuels | Utilisation prévue |
    | --- | --- | --- |
    | Navigateur | `plugin-sdk/browser-cdp`, `plugin-sdk/browser-config-runtime`, `plugin-sdk/browser-config-support`, `plugin-sdk/browser-control-auth`, `plugin-sdk/browser-node-runtime`, `plugin-sdk/browser-profiles`, `plugin-sdk/browser-security-runtime`, `plugin-sdk/browser-setup-tools`, `plugin-sdk/browser-support` | Assistants de prise en charge du Plugin navigateur bundled (`browser-support` reste le barrel de compatibilité) |
    | Matrix | `plugin-sdk/matrix`, `plugin-sdk/matrix-helper`, `plugin-sdk/matrix-runtime-heavy`, `plugin-sdk/matrix-runtime-shared`, `plugin-sdk/matrix-runtime-surface`, `plugin-sdk/matrix-surface`, `plugin-sdk/matrix-thread-bindings` | Surface d’assistance/d’exécution Matrix bundled |
    | Line | `plugin-sdk/line`, `plugin-sdk/line-core`, `plugin-sdk/line-runtime`, `plugin-sdk/line-surface` | Surface d’assistance/d’exécution LINE bundled |
    | IRC | `plugin-sdk/irc`, `plugin-sdk/irc-surface` | Surface d’assistance IRC bundled |
    | Assistants spécifiques aux canaux | `plugin-sdk/googlechat`, `plugin-sdk/zalouser`, `plugin-sdk/bluebubbles`, `plugin-sdk/bluebubbles-policy`, `plugin-sdk/mattermost`, `plugin-sdk/mattermost-policy`, `plugin-sdk/feishu-conversation`, `plugin-sdk/msteams`, `plugin-sdk/nextcloud-talk`, `plugin-sdk/nostr`, `plugin-sdk/tlon`, `plugin-sdk/twitch` | Interfaces de compatibilité/d’assistance bundled pour canaux |
    | Assistants spécifiques à l’authentification/aux Plugins | `plugin-sdk/github-copilot-login`, `plugin-sdk/github-copilot-token`, `plugin-sdk/diagnostics-otel`, `plugin-sdk/diffs`, `plugin-sdk/llm-task`, `plugin-sdk/thread-ownership`, `plugin-sdk/voice-call` | Interfaces d’assistance bundled pour fonctionnalités/Plugins ; `plugin-sdk/github-copilot-token` exporte actuellement `DEFAULT_COPILOT_API_BASE_URL`, `deriveCopilotApiBaseUrlFromToken` et `resolveCopilotApiToken` |
  </Accordion>
</AccordionGroup>

## Liens associés

- [vue d’ensemble du Plugin SDK](/fr/plugins/sdk-overview)
- [configuration du Plugin SDK](/fr/plugins/sdk-setup)
- [Créer des Plugins](/fr/plugins/building-plugins)
