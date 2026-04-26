---
read_when:
    - Choisir le bon sous-chemin de plugin-sdk pour un import de Plugin
    - Audit des sous-chemins de bundled-plugin et des surfaces d’assistance
summary: 'Catalogue des sous-chemins du SDK Plugin : où se trouvent les imports, regroupés par domaine'
title: sous-chemins du SDK du Plugin
x-i18n:
    generated_at: "2026-04-26T11:36:42Z"
    model: gpt-5.4
    provider: openai
    source_hash: fcb49ee51301b79985d43470cd8c149c858e79d685908605317de253121d4736
    source_path: plugins/sdk-subpaths.md
    workflow: 15
---

  Le SDK du Plugin est exposé sous la forme d’un ensemble de sous-chemins étroits sous `openclaw/plugin-sdk/`.
  Cette page répertorie les sous-chemins les plus couramment utilisés, regroupés par usage. La liste complète générée de plus de 200 sous-chemins se trouve dans `scripts/lib/plugin-sdk-entrypoints.json` ;
  les sous-chemins d’assistance réservés à bundled-plugin y figurent, mais relèvent des
  détails d’implémentation, sauf si une page de documentation les met explicitement en avant.

  Pour le guide de création de Plugin, consultez [Vue d’ensemble du SDK du Plugin](/fr/plugins/sdk-overview).

  ## Entrée du Plugin

  | Sous-chemin                | Exportations principales                                                                                                               |
  | -------------------------- | -------------------------------------------------------------------------------------------------------------------------------------- |
  | `plugin-sdk/plugin-entry`   | `definePluginEntry`                                                                                                                    |
  | `plugin-sdk/core`           | `defineChannelPluginEntry`, `createChatChannelPlugin`, `createChannelPluginBase`, `defineSetupPluginEntry`, `buildChannelConfigSchema` |
  | `plugin-sdk/config-schema`  | `OpenClawSchema`                                                                                                                       |
  | `plugin-sdk/provider-entry` | `defineSingleProviderPluginEntry`                                                                                                      |

  <AccordionGroup>
  <Accordion title="Sous-chemins de canal">
    | Sous-chemin | Exportations principales |
    | --- | --- |
    | `plugin-sdk/channel-core` | `defineChannelPluginEntry`, `defineSetupPluginEntry`, `createChatChannelPlugin`, `createChannelPluginBase` |
    | `plugin-sdk/config-schema` | Exportation du schéma Zod racine de `openclaw.json` (`OpenClawSchema`) |
    | `plugin-sdk/channel-setup` | `createOptionalChannelSetupSurface`, `createOptionalChannelSetupAdapter`, `createOptionalChannelSetupWizard`, ainsi que `DEFAULT_ACCOUNT_ID`, `createTopLevelChannelDmPolicy`, `setSetupChannelEnabled`, `splitSetupEntries` |
    | `plugin-sdk/setup` | Assistants partagés pour l’assistant de configuration, invites d’allowlist, constructeurs d’état de configuration |
    | `plugin-sdk/setup-runtime` | `createPatchedAccountSetupAdapter`, `createEnvPatchedAccountSetupAdapter`, `createSetupInputPresenceValidator`, `noteChannelLookupFailure`, `noteChannelLookupSummary`, `promptResolvedAllowFrom`, `splitSetupEntries`, `createAllowlistSetupWizardProxy`, `createDelegatedSetupWizardProxy` |
    | `plugin-sdk/setup-adapter-runtime` | `createEnvPatchedAccountSetupAdapter` |
    | `plugin-sdk/setup-tools` | `formatCliCommand`, `detectBinary`, `extractArchive`, `resolveBrewExecutable`, `formatDocsLink`, `CONFIG_DIR` |
    | `plugin-sdk/account-core` | Assistants de configuration multi-comptes / de garde de l’action, assistants de repli du compte par défaut |
    | `plugin-sdk/account-id` | `DEFAULT_ACCOUNT_ID`, assistants de normalisation des identifiants de compte |
    | `plugin-sdk/account-resolution` | Recherche de compte + assistants de repli par défaut |
    | `plugin-sdk/account-helpers` | Assistants étroits pour la liste des comptes / les actions de compte |
    | `plugin-sdk/channel-pairing` | `createChannelPairingController` |
    | `plugin-sdk/channel-reply-pipeline` | `createChannelReplyPipeline` |
    | `plugin-sdk/channel-config-helpers` | `createHybridChannelConfigAdapter` |
    | `plugin-sdk/channel-config-schema` | Types de schéma de configuration du canal |
    | `plugin-sdk/telegram-command-config` | Assistants de normalisation / validation des commandes personnalisées Telegram avec repli bundled-contract |
    | `plugin-sdk/command-gating` | Assistants étroits de garde d’autorisation des commandes |
    | `plugin-sdk/channel-policy` | `resolveChannelGroupRequireMention` |
    | `plugin-sdk/channel-lifecycle` | `createAccountStatusSink`, assistants de cycle de vie / finalisation du flux brouillon |
    | `plugin-sdk/inbound-envelope` | Assistants partagés de routage entrant + de construction d’enveloppe |
    | `plugin-sdk/inbound-reply-dispatch` | Assistants partagés d’enregistrement et d’envoi entrant |
    | `plugin-sdk/messaging-targets` | Assistants d’analyse / de correspondance des cibles |
    | `plugin-sdk/outbound-media` | Assistants partagés de chargement des médias sortants |
    | `plugin-sdk/outbound-send-deps` | Recherche légère des dépendances d’envoi sortant pour les adaptateurs de canal |
    | `plugin-sdk/outbound-runtime` | Assistants pour la livraison sortante, l’identité, le délégué d’envoi, la session, le formatage et la planification de charge utile |
    | `plugin-sdk/poll-runtime` | Assistants étroits de normalisation des sondages |
    | `plugin-sdk/thread-bindings-runtime` | Assistants de cycle de vie et d’adaptateur pour les liaisons de fil |
    | `plugin-sdk/agent-media-payload` | Constructeur hérité de charge utile média d’agent |
    | `plugin-sdk/conversation-runtime` | Assistants pour la liaison de conversation / fil, l’appairage et la liaison configurée |
    | `plugin-sdk/runtime-config-snapshot` | Assistant d’instantané de configuration d’exécution |
    | `plugin-sdk/runtime-group-policy` | Assistants de résolution de stratégie de groupe à l’exécution |
    | `plugin-sdk/channel-status` | Assistants partagés d’instantané / de résumé de l’état du canal |
    | `plugin-sdk/channel-config-primitives` | Primitives étroites de schéma de configuration du canal |
    | `plugin-sdk/channel-config-writes` | Assistants d’autorisation d’écriture de configuration du canal |
    | `plugin-sdk/channel-plugin-common` | Exportations de prélude partagées pour les plugins de canal |
    | `plugin-sdk/allowlist-config-edit` | Assistants de lecture / modification de la configuration d’allowlist |
    | `plugin-sdk/group-access` | Assistants partagés de décision d’accès au groupe |
    | `plugin-sdk/direct-dm` | Assistants partagés d’authentification / de protection des messages privés directs |
    | `plugin-sdk/interactive-runtime` | Présentation sémantique des messages, livraison et assistants hérités de réponse interactive. Voir [Présentation des messages](/fr/plugins/message-presentation) |
    | `plugin-sdk/channel-inbound` | Barrel de compatibilité pour les assistants de debounce entrant, de correspondance de mention, de stratégie de mention et d’enveloppe |
    | `plugin-sdk/channel-inbound-debounce` | Assistants étroits de debounce entrant |
    | `plugin-sdk/channel-mention-gating` | Assistants étroits de stratégie de mention et de texte de mention sans la surface d’exécution entrante plus large |
    | `plugin-sdk/channel-envelope` | Assistants étroits de formatage d’enveloppe entrante |
    | `plugin-sdk/channel-location` | Assistants de contexte et de formatage de l’emplacement du canal |
    | `plugin-sdk/channel-logging` | Assistants de journalisation du canal pour les abandons entrants et les échecs de saisie / d’accusé de réception |
    | `plugin-sdk/channel-send-result` | Types de résultat de réponse |
    | `plugin-sdk/channel-actions` | Assistants d’action sur les messages du canal, ainsi que des assistants de schéma natif obsolètes conservés pour la compatibilité des plugins |
    | `plugin-sdk/channel-targets` | Assistants d’analyse / de correspondance des cibles |
    | `plugin-sdk/channel-contract` | Types de contrat de canal |
    | `plugin-sdk/channel-feedback` | Câblage des retours / réactions |
    | `plugin-sdk/channel-secret-runtime` | Assistants étroits de contrat secret comme `collectSimpleChannelFieldAssignments`, `getChannelSurface`, `pushAssignment`, ainsi que les types de cible secrète |
  </Accordion>

  <Accordion title="Sous-chemins de fournisseur">
    | Sous-chemin | Exportations principales |
    | --- | --- |
    | `plugin-sdk/provider-entry` | `defineSingleProviderPluginEntry` |
    | `plugin-sdk/provider-setup` | Assistants organisés de configuration de fournisseur local / auto-hébergé |
    | `plugin-sdk/self-hosted-provider-setup` | Assistants ciblés de configuration de fournisseur auto-hébergé compatible OpenAI |
    | `plugin-sdk/cli-backend` | Valeurs par défaut du backend CLI + constantes de watchdog |
    | `plugin-sdk/provider-auth-runtime` | Assistants de résolution de clé API à l’exécution pour les plugins de fournisseur |
    | `plugin-sdk/provider-auth-api-key` | Assistants d’intégration / d’écriture de profil de clé API tels que `upsertApiKeyProfile` |
    | `plugin-sdk/provider-auth-result` | Constructeur standard de résultat d’authentification OAuth |
    | `plugin-sdk/provider-auth-login` | Assistants partagés de connexion interactive pour les plugins de fournisseur |
    | `plugin-sdk/provider-env-vars` | Assistants de recherche des variables d’environnement d’authentification du fournisseur |
    | `plugin-sdk/provider-auth` | `createProviderApiKeyAuthMethod`, `ensureApiKeyFromOptionEnvOrPrompt`, `upsertAuthProfile`, `upsertApiKeyProfile`, `writeOAuthCredentials` |
    | `plugin-sdk/provider-model-shared` | `ProviderReplayFamily`, `buildProviderReplayFamilyHooks`, `normalizeModelCompat`, constructeurs partagés de stratégie de replay, assistants de point de terminaison du fournisseur et assistants de normalisation d’identifiant de modèle tels que `normalizeNativeXaiModelId` |
    | `plugin-sdk/provider-catalog-shared` | `findCatalogTemplate`, `buildSingleProviderApiKeyCatalog`, `supportsNativeStreamingUsageCompat`, `applyProviderNativeStreamingUsageCompat` |
    | `plugin-sdk/provider-http` | Assistants génériques de capacité HTTP / de point de terminaison du fournisseur, erreurs HTTP du fournisseur, et assistants de formulaire multipart pour la transcription audio |
    | `plugin-sdk/provider-web-fetch-contract` | Assistants étroits de contrat de configuration / de sélection web-fetch comme `enablePluginInConfig` et `WebFetchProviderPlugin` |
    | `plugin-sdk/provider-web-fetch` | Assistants d’enregistrement / de cache du fournisseur web-fetch |
    | `plugin-sdk/provider-web-search-config-contract` | Assistants étroits de configuration / d’identifiants web-search pour les fournisseurs qui n’ont pas besoin du câblage d’activation de plugin |
    | `plugin-sdk/provider-web-search-contract` | Assistants étroits de contrat de configuration / d’identifiants web-search comme `createWebSearchProviderContractFields`, `enablePluginInConfig`, `resolveProviderWebSearchPluginConfig`, ainsi que les accesseurs / mutateurs d’identifiants à portée limitée |
    | `plugin-sdk/provider-web-search` | Assistants d’enregistrement / de cache / d’exécution du fournisseur web-search |
    | `plugin-sdk/provider-tools` | `ProviderToolCompatFamily`, `buildProviderToolCompatFamilyHooks`, nettoyage + diagnostics du schéma Gemini, et assistants de compatibilité xAI tels que `resolveXaiModelCompatPatch` / `applyXaiModelCompat` |
    | `plugin-sdk/provider-usage` | `fetchClaudeUsage` et assimilés |
    | `plugin-sdk/provider-stream` | `ProviderStreamFamily`, `buildProviderStreamFamilyHooks`, `composeProviderStreamWrappers`, types d’enveloppes de flux, et assistants d’enveloppes partagés Anthropic / Bedrock / DeepSeek V4 / Google / Kilocode / Moonshot / OpenAI / OpenRouter / Z.A.I / MiniMax / Copilot |
    | `plugin-sdk/provider-transport-runtime` | Assistants natifs de transport du fournisseur comme le fetch protégé, les transformations de messages de transport et les flux d’événements de transport inscriptibles |
    | `plugin-sdk/provider-onboard` | Assistants de patch de configuration d’intégration |
    | `plugin-sdk/global-singleton` | Assistants de singleton / map / cache locaux au processus |
    | `plugin-sdk/group-activation` | Assistants étroits de mode d’activation de groupe et d’analyse des commandes |
  </Accordion>

  <Accordion title="Sous-chemins d’authentification et de sécurité">
    | Sous-chemin | Exportations principales |
    | --- | --- |
    | `plugin-sdk/command-auth` | `resolveControlCommandGate`, assistants du registre de commandes, y compris le formatage dynamique du menu d’arguments, assistants d’autorisation de l’expéditeur |
    | `plugin-sdk/command-status` | Constructeurs de messages de commande / d’aide tels que `buildCommandsMessagePaginated` et `buildHelpMessage` |
    | `plugin-sdk/approval-auth-runtime` | Assistants de résolution de l’approbateur et d’authentification d’action dans le même chat |
    | `plugin-sdk/approval-client-runtime` | Assistants natifs de profil / filtre d’approbation d’exécution |
    | `plugin-sdk/approval-delivery-runtime` | Adaptateurs natifs de capacité / livraison d’approbation |
    | `plugin-sdk/approval-gateway-runtime` | Assistant partagé de résolution de Gateway d’approbation |
    | `plugin-sdk/approval-handler-adapter-runtime` | Assistants légers de chargement d’adaptateur d’approbation native pour les points d’entrée de canaux critiques |
    | `plugin-sdk/approval-handler-runtime` | Assistants d’exécution du gestionnaire d’approbation plus larges ; préférez les interfaces adaptateur / Gateway plus étroites lorsqu’elles suffisent |
    | `plugin-sdk/approval-native-runtime` | Assistants natifs de cible d’approbation + de liaison de compte |
    | `plugin-sdk/approval-reply-runtime` | Assistants de charge utile de réponse d’approbation d’exécution / de Plugin |
    | `plugin-sdk/approval-runtime` | Assistants de charge utile d’approbation d’exécution / de Plugin, assistants natifs de routage / d’exécution d’approbation, et assistants d’affichage structuré d’approbation tels que `formatApprovalDisplayPath` |
    | `plugin-sdk/reply-dedupe` | Assistants étroits de réinitialisation de déduplication des réponses entrantes |
    | `plugin-sdk/channel-contract-testing` | Assistants étroits de test du contrat de canal sans le barrel de test étendu |
    | `plugin-sdk/command-auth-native` | Authentification native des commandes, formatage dynamique du menu d’arguments et assistants natifs de cible de session |
    | `plugin-sdk/command-detection` | Assistants partagés de détection de commandes |
    | `plugin-sdk/command-primitives-runtime` | Prédicats légers de texte de commande pour les chemins critiques de canal |
    | `plugin-sdk/command-surface` | Assistants de normalisation du corps de commande et de surface de commande |
    | `plugin-sdk/allow-from` | `formatAllowFromLowercase` |
    | `plugin-sdk/channel-secret-runtime` | Assistants étroits de collecte de contrat secret pour les surfaces secrètes de canal / de Plugin |
    | `plugin-sdk/secret-ref-runtime` | Assistants étroits `coerceSecretRef` et de typage `SecretRef` pour l’analyse du contrat secret / de la configuration |
    | `plugin-sdk/security-runtime` | Assistants partagés de confiance, de filtrage des messages privés directs, de contenu externe et de collecte des secrets |
    | `plugin-sdk/ssrf-policy` | Assistants de stratégie SSRF pour l’allowlist d’hôtes et le réseau privé |
    | `plugin-sdk/ssrf-dispatcher` | Assistants étroits de dispatcher épinglé sans la surface d’exécution infra étendue |
    | `plugin-sdk/ssrf-runtime` | Assistants de dispatcher épinglé, de fetch protégé contre les SSRF et de stratégie SSRF |
    | `plugin-sdk/secret-input` | Assistants d’analyse des entrées secrètes |
    | `plugin-sdk/webhook-ingress` | Assistants de requête / de cible Webhook |
    | `plugin-sdk/webhook-request-guards` | Assistants de taille de corps de requête / de délai d’expiration |
  </Accordion>

  <Accordion title="Sous-chemins d’exécution et de stockage">
    | Sous-chemin | Exportations principales |
    | --- | --- |
    | `plugin-sdk/runtime` | Assistants étendus d’exécution / journalisation / sauvegarde / installation de Plugin |
    | `plugin-sdk/runtime-env` | Assistants étroits d’environnement d’exécution, de logger, de délai d’expiration, de retry et de backoff |
    | `plugin-sdk/channel-runtime-context` | Assistants génériques d’enregistrement et de recherche du contexte d’exécution de canal |
    | `plugin-sdk/runtime-store` | `createPluginRuntimeStore` |
    | `plugin-sdk/plugin-runtime` | Assistants partagés de commande / hook / HTTP / interaction pour Plugin |
    | `plugin-sdk/hook-runtime` | Assistants partagés de pipeline de Webhook / hook interne |
    | `plugin-sdk/lazy-runtime` | Assistants d’importation / de liaison d’exécution paresseuse tels que `createLazyRuntimeModule`, `createLazyRuntimeMethod` et `createLazyRuntimeSurface` |
    | `plugin-sdk/process-runtime` | Assistants d’exécution de processus |
    | `plugin-sdk/cli-runtime` | Assistants de formatage CLI, d’attente, de version, d’invocation d’arguments et de groupes de commandes paresseux |
    | `plugin-sdk/gateway-runtime` | Assistants de client Gateway et de correctifs d’état de canal |
    | `plugin-sdk/config-runtime` | Assistants de chargement / écriture de configuration et assistants de recherche de configuration de Plugin |
    | `plugin-sdk/telegram-command-config` | Normalisation des noms / descriptions de commandes Telegram et vérifications des doublons / conflits, même lorsque la surface contractuelle Telegram groupée n’est pas disponible |
    | `plugin-sdk/text-autolink-runtime` | Détection des liens automatiques de référence de fichier sans le barrel `text-runtime` étendu |
    | `plugin-sdk/approval-runtime` | Assistants d’approbation d’exécution / de Plugin, constructeurs de capacités d’approbation, assistants d’authentification / de profil, assistants natifs de routage / d’exécution, et formatage du chemin d’affichage structuré d’approbation |
    | `plugin-sdk/reply-runtime` | Assistants partagés d’exécution entrante / de réponse, fragmentation, envoi, Heartbeat, planificateur de réponse |
    | `plugin-sdk/reply-dispatch-runtime` | Assistants étroits d’envoi / finalisation des réponses et d’étiquettes de conversation |
    | `plugin-sdk/reply-history` | Assistants partagés d’historique des réponses sur courte fenêtre tels que `buildHistoryContext`, `recordPendingHistoryEntry` et `clearHistoryEntriesIfEnabled` |
    | `plugin-sdk/reply-reference` | `createReplyReferencePlanner` |
    | `plugin-sdk/reply-chunking` | Assistants étroits de fragmentation de texte / Markdown |
    | `plugin-sdk/session-store-runtime` | Assistants de chemin du magasin de sessions + `updated-at` |
    | `plugin-sdk/state-paths` | Assistants de chemin pour les répertoires d’état / OAuth |
    | `plugin-sdk/routing` | Assistants de route / clé de session / liaison de compte tels que `resolveAgentRoute`, `buildAgentSessionKey` et `resolveDefaultAgentBoundAccountId` |
    | `plugin-sdk/status-helpers` | Assistants partagés de résumé d’état de canal / de compte, valeurs par défaut de l’état d’exécution et assistants de métadonnées de problème |
    | `plugin-sdk/target-resolver-runtime` | Assistants partagés de résolution de cible |
    | `plugin-sdk/string-normalization-runtime` | Assistants de normalisation de slug / chaîne |
    | `plugin-sdk/request-url` | Extraire des URL sous forme de chaîne à partir d’entrées de type fetch / request |
    | `plugin-sdk/run-command` | Exécuteur de commande temporisé avec résultats `stdout` / `stderr` normalisés |
    | `plugin-sdk/param-readers` | Lecteurs communs de paramètres d’outil / CLI |
    | `plugin-sdk/tool-payload` | Extraire des charges utiles normalisées à partir d’objets de résultat d’outil |
    | `plugin-sdk/tool-send` | Extraire les champs de cible d’envoi canoniques à partir des arguments d’outil |
    | `plugin-sdk/temp-path` | Assistants partagés de chemin de téléchargement temporaire |
    | `plugin-sdk/logging-core` | Assistants de logger de sous-système et de masquage |
    | `plugin-sdk/markdown-table-runtime` | Assistants de mode et de conversion de tableaux Markdown |
    | `plugin-sdk/json-store` | Petits assistants de lecture / écriture d’état JSON |
    | `plugin-sdk/file-lock` | Assistants de verrouillage de fichier réentrant |
    | `plugin-sdk/persistent-dedupe` | Assistants de cache de déduplication persisté sur disque |
    | `plugin-sdk/acp-runtime` | Assistants d’exécution / de session ACP et d’envoi de réponses |
    | `plugin-sdk/acp-binding-resolve-runtime` | Résolution en lecture seule de liaison ACP sans imports de démarrage du cycle de vie |
    | `plugin-sdk/agent-config-primitives` | Primitives étroites de schéma de configuration d’exécution de l’agent |
    | `plugin-sdk/boolean-param` | Lecteur souple de paramètre booléen |
    | `plugin-sdk/dangerous-name-runtime` | Assistants de résolution de correspondance de noms dangereux |
    | `plugin-sdk/device-bootstrap` | Assistants d’initialisation d’appareil et de jeton d’appairage |
    | `plugin-sdk/extension-shared` | Primitives d’assistance partagées pour canal passif, état et proxy ambiant |
    | `plugin-sdk/models-provider-runtime` | Assistants de réponse de fournisseur / commande `/models` |
    | `plugin-sdk/skill-commands-runtime` | Assistants de listage des commandes Skills |
    | `plugin-sdk/native-command-registry` | Assistants natifs de registre / construction / sérialisation de commandes |
    | `plugin-sdk/agent-harness` | Surface expérimentale de Plugin de confiance pour des harnais d’agent bas niveau : types de harnais, assistants de pilotage / interruption des exécutions actives, assistants de pont d’outils OpenClaw, assistants de stratégie d’outils du plan d’exécution, classification des résultats terminaux, assistants de formatage / de détail de progression des outils et utilitaires de résultat de tentative |
    | `plugin-sdk/provider-zai-endpoint` | Assistants de détection de point de terminaison Z.AI |
    | `plugin-sdk/infra-runtime` | Assistants d’événements système / Heartbeat |
    | `plugin-sdk/collection-runtime` | Petits assistants de cache borné |
    | `plugin-sdk/diagnostic-runtime` | Assistants de drapeaux et d’événements de diagnostic |
    | `plugin-sdk/error-runtime` | Assistants de graphe d’erreurs, de formatage, de classification partagée des erreurs, `isApprovalNotFoundError` |
    | `plugin-sdk/fetch-runtime` | Assistants de fetch enveloppé, de proxy et de recherche épinglée |
    | `plugin-sdk/runtime-fetch` | Fetch d’exécution tenant compte du dispatcher sans imports de proxy / fetch protégé |
    | `plugin-sdk/response-limit-runtime` | Lecteur borné de corps de réponse sans la surface d’exécution média étendue |
    | `plugin-sdk/session-binding-runtime` | État actuel de liaison de conversation sans routage de liaison configurée ni magasins d’appairage |
    | `plugin-sdk/session-store-runtime` | Assistants de lecture du magasin de sessions sans imports étendus d’écriture / maintenance de configuration |
    | `plugin-sdk/context-visibility-runtime` | Résolution de la visibilité du contexte et filtrage du contexte supplémentaire sans imports étendus de configuration / sécurité |
    | `plugin-sdk/string-coerce-runtime` | Assistants étroits de coercition et de normalisation de chaîne / enregistrement primitif sans imports Markdown / journalisation |
    | `plugin-sdk/host-runtime` | Assistants de normalisation de nom d’hôte et d’hôte SCP |
    | `plugin-sdk/retry-runtime` | Assistants de configuration de retry et d’exécuteur de retry |
    | `plugin-sdk/agent-runtime` | Assistants de répertoire / identité / espace de travail de l’agent |
    | `plugin-sdk/directory-runtime` | Requête / déduplication de répertoire adossée à la configuration |
    | `plugin-sdk/keyed-async-queue` | `KeyedAsyncQueue` |
  </Accordion>

  <Accordion title="Sous-chemins de capacités et de test">
    | Sous-chemin | Exportations principales |
    | --- | --- |
    | `plugin-sdk/media-runtime` | Assistants partagés de récupération / transformation / stockage des médias, ainsi que constructeurs de charges utiles média |
    | `plugin-sdk/media-store` | Assistants étroits de stockage média tels que `saveMediaBuffer` |
    | `plugin-sdk/media-generation-runtime` | Assistants partagés de basculement pour la génération de médias, sélection de candidats et messages de modèle manquant |
    | `plugin-sdk/media-understanding` | Types de fournisseur de compréhension média, ainsi qu’exportations d’assistance image / audio orientées fournisseur |
    | `plugin-sdk/text-runtime` | Assistants partagés de texte / Markdown / journalisation tels que la suppression du texte visible par l’assistant, les assistants de rendu / fragmentation / tableaux Markdown, les assistants de masquage, les assistants de balises de directive et les utilitaires de texte sûr |
    | `plugin-sdk/text-chunking` | Assistant de fragmentation de texte sortant |
    | `plugin-sdk/speech` | Types de fournisseur de parole, ainsi qu’exportations d’assistance orientées fournisseur pour les directives, le registre, la validation et la parole |
    | `plugin-sdk/speech-core` | Exportations partagées d’assistance pour les types de fournisseur de parole, le registre, les directives, la normalisation et la parole |
    | `plugin-sdk/realtime-transcription` | Types de fournisseur de transcription en temps réel, assistants de registre et assistant partagé de session WebSocket |
    | `plugin-sdk/realtime-voice` | Types de fournisseur de voix en temps réel et assistants de registre |
    | `plugin-sdk/image-generation` | Types de fournisseur de génération d’image |
    | `plugin-sdk/image-generation-core` | Assistants partagés de types de génération d’image, de basculement, d’authentification et de registre |
    | `plugin-sdk/music-generation` | Types de fournisseur / requête / résultat de génération musicale |
    | `plugin-sdk/music-generation-core` | Assistants partagés de types de génération musicale, de basculement, de recherche de fournisseur et d’analyse de `model-ref` |
    | `plugin-sdk/video-generation` | Types de fournisseur / requête / résultat de génération vidéo |
    | `plugin-sdk/video-generation-core` | Assistants partagés de types de génération vidéo, de basculement, de recherche de fournisseur et d’analyse de `model-ref` |
    | `plugin-sdk/webhook-targets` | Assistants de registre de cibles Webhook et d’installation de routes |
    | `plugin-sdk/webhook-path` | Assistants de normalisation de chemin Webhook |
    | `plugin-sdk/web-media` | Assistants partagés de chargement de médias distants / locaux |
    | `plugin-sdk/zod` | `zod` réexporté pour les consommateurs du SDK du Plugin |
    | `plugin-sdk/testing` | `installCommonResolveTargetErrorCases`, `shouldAckReaction` |
  </Accordion>

  <Accordion title="Sous-chemins de mémoire">
    | Sous-chemin | Exportations principales |
    | --- | --- |
    | `plugin-sdk/memory-core` | Surface d’assistance `memory-core` groupée pour les assistants de gestionnaire / configuration / fichiers / CLI |
    | `plugin-sdk/memory-core-engine-runtime` | Façade d’exécution d’indexation / recherche mémoire |
    | `plugin-sdk/memory-core-host-engine-foundation` | Exportations du moteur de fondation de l’hôte mémoire |
    | `plugin-sdk/memory-core-host-engine-embeddings` | Contrats d’embeddings de l’hôte mémoire, accès au registre, fournisseur local et assistants génériques de lot / à distance |
    | `plugin-sdk/memory-core-host-engine-qmd` | Exportations du moteur QMD de l’hôte mémoire |
    | `plugin-sdk/memory-core-host-engine-storage` | Exportations du moteur de stockage de l’hôte mémoire |
    | `plugin-sdk/memory-core-host-multimodal` | Assistants multimodaux de l’hôte mémoire |
    | `plugin-sdk/memory-core-host-query` | Assistants de requête de l’hôte mémoire |
    | `plugin-sdk/memory-core-host-secret` | Assistants de secret de l’hôte mémoire |
    | `plugin-sdk/memory-core-host-events` | Assistants de journal d’événements de l’hôte mémoire |
    | `plugin-sdk/memory-core-host-status` | Assistants d’état de l’hôte mémoire |
    | `plugin-sdk/memory-core-host-runtime-cli` | Assistants d’exécution CLI de l’hôte mémoire |
    | `plugin-sdk/memory-core-host-runtime-core` | Assistants d’exécution cœur de l’hôte mémoire |
    | `plugin-sdk/memory-core-host-runtime-files` | Assistants de fichiers / d’exécution de l’hôte mémoire |
    | `plugin-sdk/memory-host-core` | Alias neutre vis-à-vis du fournisseur pour les assistants d’exécution cœur de l’hôte mémoire |
    | `plugin-sdk/memory-host-events` | Alias neutre vis-à-vis du fournisseur pour les assistants de journal d’événements de l’hôte mémoire |
    | `plugin-sdk/memory-host-files` | Alias neutre vis-à-vis du fournisseur pour les assistants de fichiers / d’exécution de l’hôte mémoire |
    | `plugin-sdk/memory-host-markdown` | Assistants partagés de Markdown géré pour les plugins liés à la mémoire |
    | `plugin-sdk/memory-host-search` | Façade d’exécution Active Memory pour l’accès au gestionnaire de recherche |
    | `plugin-sdk/memory-host-status` | Alias neutre vis-à-vis du fournisseur pour les assistants d’état de l’hôte mémoire |
    | `plugin-sdk/memory-lancedb` | Surface d’assistance `memory-lancedb` groupée |
  </Accordion>

  <Accordion title="Sous-chemins d’assistance groupée réservés">
    | Famille | Sous-chemins actuels | Utilisation prévue |
    | --- | --- | --- |
    | Browser | `plugin-sdk/browser-cdp`, `plugin-sdk/browser-config-runtime`, `plugin-sdk/browser-config-support`, `plugin-sdk/browser-control-auth`, `plugin-sdk/browser-node-runtime`, `plugin-sdk/browser-profiles`, `plugin-sdk/browser-security-runtime`, `plugin-sdk/browser-setup-tools`, `plugin-sdk/browser-support` | Assistants de support du plugin Browser groupé. `browser-profiles` exporte `resolveBrowserConfig`, `resolveProfile`, `ResolvedBrowserConfig`, `ResolvedBrowserProfile` et `ResolvedBrowserTabCleanupConfig` pour la forme normalisée `browser.tabCleanup`. `browser-support` reste le barrel de compatibilité. |
    | Matrix | `plugin-sdk/matrix`, `plugin-sdk/matrix-helper`, `plugin-sdk/matrix-runtime-heavy`, `plugin-sdk/matrix-runtime-shared`, `plugin-sdk/matrix-runtime-surface`, `plugin-sdk/matrix-surface`, `plugin-sdk/matrix-thread-bindings` | Surface d’assistance / d’exécution Matrix groupée |
    | Line | `plugin-sdk/line`, `plugin-sdk/line-core`, `plugin-sdk/line-runtime`, `plugin-sdk/line-surface` | Surface d’assistance / d’exécution LINE groupée |
    | IRC | `plugin-sdk/irc`, `plugin-sdk/irc-surface` | Surface d’assistance IRC groupée |
    | Assistants spécifiques aux canaux | `plugin-sdk/googlechat`, `plugin-sdk/zalouser`, `plugin-sdk/bluebubbles`, `plugin-sdk/bluebubbles-policy`, `plugin-sdk/mattermost`, `plugin-sdk/mattermost-policy`, `plugin-sdk/feishu-conversation`, `plugin-sdk/msteams`, `plugin-sdk/nextcloud-talk`, `plugin-sdk/nostr`, `plugin-sdk/tlon`, `plugin-sdk/twitch` | Interfaces de compatibilité / d’assistance de canaux groupées |
    | Assistants spécifiques à l’authentification / au Plugin | `plugin-sdk/github-copilot-login`, `plugin-sdk/github-copilot-token`, `plugin-sdk/diagnostics-otel`, `plugin-sdk/diagnostics-prometheus`, `plugin-sdk/diffs`, `plugin-sdk/llm-task`, `plugin-sdk/thread-ownership`, `plugin-sdk/voice-call` | Interfaces d’assistance de fonctionnalité / de Plugin groupées ; `plugin-sdk/github-copilot-token` exporte actuellement `DEFAULT_COPILOT_API_BASE_URL`, `deriveCopilotApiBaseUrlFromToken` et `resolveCopilotApiToken` |
  </Accordion>
</AccordionGroup>

## Lié

- [Vue d’ensemble du SDK du Plugin](/fr/plugins/sdk-overview)
- [Configuration du SDK du Plugin](/fr/plugins/sdk-setup)
- [Créer des plugins](/fr/plugins/building-plugins)
