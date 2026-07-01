---
read_when:
    - Choisir le bon sous-chemin plugin-sdk pour une importation de Plugin
    - Audit des sous-chemins des plugins groupés et des surfaces d’assistance
summary: 'Catalogue des sous-chemins du SDK Plugin : quels imports se trouvent où, regroupés par domaine'
title: Sous-chemins du SDK Plugin
x-i18n:
    generated_at: "2026-07-01T13:00:48Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 589b5581626e50ddb5056ff2aaa60a0af48b92e09c0ca5aa22e2dbf2aed736db
    source_path: plugins/sdk-subpaths.md
    workflow: 16
---

Le SDK de Plugin est exposé sous forme d’un ensemble de sous-chemins publics étroits sous
`openclaw/plugin-sdk/`. Cette page répertorie les sous-chemins couramment utilisés, regroupés par
objectif. L’inventaire généré des points d’entrée du compilateur se trouve dans
`scripts/lib/plugin-sdk-entrypoints.json`; les exports de package constituent le sous-ensemble public
après soustraction des sous-chemins de test/internes locaux au dépôt listés dans
`scripts/lib/plugin-sdk-private-local-only-subpaths.json`. Les mainteneurs peuvent auditer
le nombre d’exports publics avec `pnpm plugin-sdk:surface` et les sous-chemins d’assistants réservés
actifs avec `pnpm plugins:boundary-report:summary`; les exports d’assistants réservés inutilisés
font échouer le rapport CI au lieu de rester dans le SDK public comme dette de compatibilité
dormante.

Pour le guide de création de Plugins, consultez [Vue d’ensemble du SDK de Plugin](/fr/plugins/sdk-overview).

## Entrée de Plugin

| Sous-chemin                    | Exports clés                                                                                                                                                           |
| ------------------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `plugin-sdk/plugin-entry`      | `definePluginEntry`                                                                                                                                                    |
| `plugin-sdk/core`              | `defineChannelPluginEntry`, `createChatChannelPlugin`, `createChannelPluginBase`, `defineSetupPluginEntry`, `buildChannelConfigSchema`, `buildJsonChannelConfigSchema` |
| `plugin-sdk/config-schema`     | `OpenClawSchema`                                                                                                                                                       |
| `plugin-sdk/provider-entry`    | `defineSingleProviderPluginEntry`                                                                                                                                      |
| `plugin-sdk/migration`         | Assistants d’éléments de fournisseur de migration tels que `createMigrationItem`, constantes de motifs, marqueurs de statut d’élément, assistants de caviardage et `summarizeMigrationItems` |
| `plugin-sdk/migration-runtime` | Assistants de migration à l’exécution tels que `copyMigrationFileItem`, `withCachedMigrationConfigRuntime` et `writeMigrationReport`                                   |
| `plugin-sdk/health`            | Inscription de contrôles de santé Doctor, détection, réparation, sélection, gravité et types de résultats pour les consommateurs de santé groupés                       |

### Compatibilité obsolète et assistants de test

Les sous-chemins obsolètes restent exportés pour les anciens Plugins, mais le nouveau code doit utiliser les
sous-chemins SDK ciblés ci-dessous. La liste maintenue est
`scripts/lib/plugin-sdk-deprecated-public-subpaths.json`; la CI rejette les imports de production
groupés provenant de cette liste. Les barrels larges tels que `compat`, `config-types`,
`infra-runtime`, `text-runtime` et `zod` sont uniquement destinés à la compatibilité. Importez `zod`
directement depuis `zod`.

Les sous-chemins d’assistants de test d’OpenClaw adossés à Vitest sont uniquement locaux au dépôt et ne sont
plus des exports de package : `agent-runtime-test-contracts`,
`channel-contract-testing`, `channel-target-testing`, `channel-test-helpers`,
`plugin-test-api`, `plugin-test-contracts`, `plugin-test-runtime`,
`provider-http-test-mocks`, `provider-test-contracts`, `test-env`,
`test-fixtures`, `test-node-mocks` et `testing`.

### Sous-chemins d’assistants de Plugin groupé réservés

Ces sous-chemins sont des surfaces de compatibilité détenues par un Plugin pour leur Plugin groupé
propriétaire, pas des API SDK générales : `plugin-sdk/codex-mcp-projection` et
`plugin-sdk/codex-native-task-runtime`. Les imports d’extensions entre propriétaires sont bloqués
par les garde-fous du contrat de package.

<AccordionGroup>
  <Accordion title="Channel subpaths">
    | Sous-chemin | Exports principaux |
    | --- | --- |
    | `plugin-sdk/channel-core` | `defineChannelPluginEntry`, `defineSetupPluginEntry`, `createChatChannelPlugin`, `createChannelPluginBase` |
    | `plugin-sdk/config-schema` | Export du schéma Zod racine de `openclaw.json` (`OpenClawSchema`) |
    | `plugin-sdk/json-schema-runtime` | Assistant de validation JSON Schema mis en cache pour les schémas appartenant aux plugins |
    | `plugin-sdk/channel-setup` | `createOptionalChannelSetupSurface`, `createOptionalChannelSetupAdapter`, `createOptionalChannelSetupWizard`, plus `DEFAULT_ACCOUNT_ID`, `createTopLevelChannelDmPolicy`, `setSetupChannelEnabled`, `splitSetupEntries` |
    | `plugin-sdk/setup` | Assistants partagés pour l’assistant de configuration, traducteur de configuration, invites de liste d’autorisation, constructeurs d’état de configuration |
    | `plugin-sdk/setup-runtime` | `createSetupTranslator`, `createPatchedAccountSetupAdapter`, `createEnvPatchedAccountSetupAdapter`, `createSetupInputPresenceValidator`, `noteChannelLookupFailure`, `noteChannelLookupSummary`, `promptResolvedAllowFrom`, `splitSetupEntries`, `createAllowlistSetupWizardProxy`, `createDelegatedSetupWizardProxy` |
    | `plugin-sdk/setup-adapter-runtime` | Alias de compatibilité obsolète ; utilisez `plugin-sdk/setup-runtime` |
    | `plugin-sdk/setup-tools` | `formatCliCommand`, `detectBinary`, `extractArchive`, `resolveBrewExecutable`, `formatDocsLink`, `CONFIG_DIR` |
    | `plugin-sdk/account-core` | Assistants de configuration multi-comptes et de verrouillage des actions, assistants de repli vers le compte par défaut |
    | `plugin-sdk/account-id` | `DEFAULT_ACCOUNT_ID`, assistants de normalisation d’identifiant de compte |
    | `plugin-sdk/account-resolution` | Assistants de recherche de compte et de repli par défaut |
    | `plugin-sdk/account-helpers` | Assistants ciblés de liste de comptes et d’actions de compte |
    | `plugin-sdk/access-groups` | Assistants d’analyse de listes d’autorisation de groupes d’accès et de diagnostics de groupes expurgés |
    | `plugin-sdk/channel-pairing` | `createChannelPairingController` |
    | `plugin-sdk/channel-reply-pipeline` | Façade de compatibilité obsolète. Utilisez `plugin-sdk/channel-outbound`. |
    | `plugin-sdk/channel-config-helpers` | `createHybridChannelConfigAdapter`, `resolveChannelDmAccess`, `resolveChannelDmAllowFrom`, `resolveChannelDmPolicy`, `normalizeChannelDmPolicy`, `normalizeLegacyDmAliases` |
    | `plugin-sdk/channel-config-schema` | Primitives partagées de schéma de configuration de canal, plus constructeurs Zod et JSON/TypeBox directs |
    | `plugin-sdk/bundled-channel-config-schema` | Schémas de configuration des canaux OpenClaw intégrés pour les plugins intégrés maintenus uniquement |
    | `plugin-sdk/chat-channel-ids` | `BUNDLED_CHAT_CHANNEL_IDS`, `BUNDLED_CHAT_CHANNEL_ENVELOPE_PREFIXES`, `ChatChannelId`. Identifiants canoniques des canaux de discussion intégrés/officiels, plus libellés/alias de formatage pour les plugins qui doivent reconnaître le texte préfixé par enveloppe sans coder leur propre table en dur. |
    | `plugin-sdk/channel-config-schema-legacy` | Alias de compatibilité obsolète pour les schémas de configuration de canaux intégrés |
    | `plugin-sdk/telegram-command-config` | Assistants de normalisation/validation des commandes personnalisées Telegram avec repli vers le contrat intégré |
    | `plugin-sdk/command-gating` | Assistants ciblés de verrouillage d’autorisation des commandes |
    | `plugin-sdk/channel-policy` | `resolveChannelGroupRequireMention` |
    | `plugin-sdk/channel-ingress` | Façade de compatibilité obsolète pour l’entrée de canal de bas niveau. Les nouveaux chemins de réception doivent utiliser `plugin-sdk/channel-ingress-runtime`. |
    | `plugin-sdk/channel-ingress-runtime` | Résolveur expérimental de runtime d’entrée de canal de haut niveau et constructeurs de faits de route pour les chemins de réception de canal migrés. Préférez-le à l’assemblage des listes d’autorisation effectives, des listes d’autorisation de commandes et des projections héritées dans chaque plugin. Voir [API d’entrée de canal](/fr/plugins/sdk-channel-ingress). |
    | `plugin-sdk/channel-lifecycle` | Façade de compatibilité obsolète. Utilisez `plugin-sdk/channel-outbound`. |
    | `plugin-sdk/channel-outbound` | Contrats de cycle de vie des messages, plus options de pipeline de réponse, accusés de réception, aperçu/streaming en direct, assistants de cycle de vie, identité sortante, planification de charge utile, envois durables et assistants de contexte d’envoi de message. Voir [API de sortie de canal](/fr/plugins/sdk-channel-outbound). |
    | `plugin-sdk/channel-message` | Alias de compatibilité obsolète pour `plugin-sdk/channel-outbound`, plus façades héritées d’expédition de réponses. |
    | `plugin-sdk/channel-message-runtime` | Alias de compatibilité obsolète pour `plugin-sdk/channel-outbound`, plus façades héritées d’expédition de réponses. |
    | `plugin-sdk/inbound-envelope` | Assistants partagés de route entrante et de construction d’enveloppe |
    | `plugin-sdk/inbound-reply-dispatch` | Façade de compatibilité obsolète. Utilisez `plugin-sdk/channel-inbound` pour les exécuteurs entrants et les prédicats d’expédition, et `plugin-sdk/channel-outbound` pour les assistants de livraison de messages. |
    | `plugin-sdk/messaging-targets` | Alias obsolète d’analyse des cibles ; utilisez `plugin-sdk/channel-targets` |
    | `plugin-sdk/outbound-media` | Assistants partagés de chargement de médias sortants et d’état des médias hébergés |
    | `plugin-sdk/outbound-send-deps` | Façade de compatibilité obsolète. Utilisez `plugin-sdk/channel-outbound`. |
    | `plugin-sdk/outbound-runtime` | Façade de compatibilité obsolète. Utilisez `plugin-sdk/channel-outbound`. |
    | `plugin-sdk/poll-runtime` | Assistants ciblés de normalisation des sondages |
    | `plugin-sdk/thread-bindings-runtime` | Assistants de cycle de vie et d’adaptateur des liaisons de fils |
    | `plugin-sdk/agent-media-payload` | Constructeur hérité de charge utile multimédia d’agent |
    | `plugin-sdk/conversation-runtime` | Assistants de conversation/liaison de fil, d’appairage et de liaison configurée |
    | `plugin-sdk/runtime-config-snapshot` | Assistant d’instantané de configuration runtime |
    | `plugin-sdk/runtime-group-policy` | Assistants de résolution des stratégies de groupe au runtime |
    | `plugin-sdk/channel-status` | Assistants partagés d’instantané/résumé d’état de canal |
    | `plugin-sdk/channel-config-primitives` | Primitives ciblées de schéma de configuration de canal |
    | `plugin-sdk/channel-config-writes` | Assistants d’autorisation d’écriture de configuration de canal |
    | `plugin-sdk/channel-plugin-common` | Exports partagés de préambule de plugin de canal |
    | `plugin-sdk/allowlist-config-edit` | Assistants de modification/lecture de configuration de liste d’autorisation |
    | `plugin-sdk/group-access` | Assistants partagés de décision d’accès de groupe |
    | `plugin-sdk/direct-dm`, `plugin-sdk/direct-dm-access` | Façades de compatibilité obsolètes. Utilisez `plugin-sdk/channel-inbound`. |
    | `plugin-sdk/direct-dm-guard-policy` | Assistants ciblés de stratégie de garde des DM directs avant chiffrement |
    | `plugin-sdk/discord` | Façade de compatibilité Discord obsolète pour `@openclaw/discord@2026.3.13` publié et la compatibilité propriétaire suivie ; les nouveaux plugins doivent utiliser les sous-chemins génériques du SDK de canal |
    | `plugin-sdk/telegram-account` | Façade de compatibilité obsolète pour la résolution de comptes Telegram, destinée à la compatibilité propriétaire suivie ; les nouveaux plugins doivent utiliser les assistants de runtime injectés ou les sous-chemins génériques du SDK de canal |
    | `plugin-sdk/zalouser` | Façade de compatibilité obsolète Zalo Personal pour les paquets Lark/Zalo publiés qui importent encore l’autorisation de commande d’expéditeur ; les nouveaux plugins doivent utiliser `plugin-sdk/command-auth` |
    | `plugin-sdk/interactive-runtime` | Présentation sémantique des messages, livraison et assistants hérités de réponse interactive. Voir [Présentation des messages](/fr/plugins/message-presentation) |
    | `plugin-sdk/channel-inbound` | Assistants entrants partagés pour la classification des événements, la construction de contexte, le formatage, les racines, l’anti-rebond, la correspondance des mentions, la stratégie de mention et la journalisation entrante |
    | `plugin-sdk/channel-inbound-debounce` | Assistants ciblés d’anti-rebond entrant |
    | `plugin-sdk/channel-mention-gating` | Assistants ciblés de stratégie de mention, de marqueur de mention et de texte de mention sans la surface plus large du runtime entrant |
    | `plugin-sdk/channel-envelope`, `plugin-sdk/channel-inbound-roots`, `plugin-sdk/channel-location`, `plugin-sdk/channel-logging` | Façades de compatibilité obsolètes. Utilisez `plugin-sdk/channel-inbound` ou `plugin-sdk/channel-outbound`. |
    | `plugin-sdk/channel-pairing-paths` | Façade de compatibilité obsolète. Utilisez `plugin-sdk/channel-pairing`. |
    | `plugin-sdk/channel-reply-options-runtime` | Façade de compatibilité obsolète. Utilisez `plugin-sdk/channel-outbound`. |
    | `plugin-sdk/channel-streaming` | Façade de compatibilité obsolète. Utilisez `plugin-sdk/channel-outbound`. |
    | `plugin-sdk/channel-send-result` | Types de résultat de réponse |
    | `plugin-sdk/channel-actions` | Assistants d’actions de message de canal, plus assistants de schéma natif obsolètes conservés pour la compatibilité des plugins |
    | `plugin-sdk/channel-route` | Normalisation partagée des routes, résolution de cible pilotée par analyseur, conversion des identifiants de fil en chaînes, clés de route dédupliquées/compactes, types de cibles analysées et assistants de comparaison route/cible |
    | `plugin-sdk/channel-targets` | Assistants d’analyse de cible ; les appelants de comparaison de routes doivent utiliser `plugin-sdk/channel-route` |
    | `plugin-sdk/channel-contract` | Types de contrat de canal |
    | `plugin-sdk/channel-feedback` | Câblage des retours/réactions |
    | `plugin-sdk/channel-secret-runtime` | Assistants ciblés de contrat de secrets, tels que `collectSimpleChannelFieldAssignments`, `getChannelSurface`, `pushAssignment` et les types de cibles secrètes |
  </Accordion>

Les familles obsolètes d’assistants de canal restent disponibles uniquement pour la
compatibilité avec les plugins publiés. Le plan de suppression est le suivant :
les conserver pendant la fenêtre de migration des plugins externes, maintenir les
plugins du dépôt/intégrés sur `channel-inbound` et `channel-outbound`, puis
supprimer les sous-chemins de compatibilité lors du prochain grand nettoyage du
SDK. Cela s’applique aux anciennes familles message/runtime de canal, streaming
de canal, accès direct-DM, éclats d’assistants entrants, options de réponse et
chemins d’appairage.

  <Accordion title="Sous-chemins des fournisseurs">
    | Sous-chemin | Exports principaux |
    | --- | --- |
    | `plugin-sdk/provider-entry` | `defineSingleProviderPluginEntry` |
    | `plugin-sdk/lmstudio` | Façade de fournisseur LM Studio prise en charge pour la configuration, la découverte du catalogue et la préparation des modèles à l'exécution |
    | `plugin-sdk/lmstudio-runtime` | Façade d'exécution LM Studio prise en charge pour les valeurs par défaut du serveur local, la découverte des modèles, les en-têtes de requête et les helpers de modèles chargés |
    | `plugin-sdk/provider-setup` | Helpers de configuration organisés pour les fournisseurs locaux/auto-hébergés |
    | `plugin-sdk/self-hosted-provider-setup` | Helpers de configuration ciblés pour les fournisseurs auto-hébergés compatibles OpenAI |
    | `plugin-sdk/cli-backend` | Valeurs par défaut du backend CLI + constantes de watchdog |
    | `plugin-sdk/provider-auth-runtime` | Helpers de résolution des clés d'API à l'exécution pour les plugins de fournisseurs |
    | `plugin-sdk/provider-oauth-runtime` | Types génériques de rappel OAuth de fournisseur, rendu de page de rappel, helpers PKCE/état, analyse de l'entrée d'autorisation, helpers d'expiration de jeton et helpers d'abandon |
    | `plugin-sdk/provider-auth-api-key` | Helpers d'onboarding/decriture de profils de clés d'API tels que `upsertApiKeyProfile` |
    | `plugin-sdk/provider-auth-result` | Constructeur standard de résultat d'authentification OAuth |
    | `plugin-sdk/provider-env-vars` | Helpers de recherche des variables d'environnement d'authentification de fournisseur |
    | `plugin-sdk/provider-auth` | `createProviderApiKeyAuthMethod`, `ensureApiKeyFromOptionEnvOrPrompt`, `upsertAuthProfile`, `upsertApiKeyProfile`, `writeOAuthCredentials`, helpers d'import d'authentification OpenAI Codex, export de compatibilité obsolète `resolveOpenClawAgentDir` |
    | `plugin-sdk/provider-model-shared` | `ProviderReplayFamily`, `buildProviderReplayFamilyHooks`, `normalizeModelCompat`, constructeurs partagés de politiques de relecture, helpers de points de terminaison de fournisseur et helpers partagés de normalisation d'ID de modèle |
    | `plugin-sdk/provider-catalog-live-runtime` | Helpers de catalogue de modèles de fournisseur en direct pour la découverte protégée de style `/models` : `buildLiveModelProviderConfig`, `fetchLiveProviderModelRows`, `getCachedLiveProviderModelRows`, `fetchLiveProviderModelIds`, `LiveModelCatalogHttpError`, `clearLiveCatalogCacheForTests`, filtrage des ID de modèle, cache TTL et fallback statique |
    | `plugin-sdk/provider-catalog-runtime` | Hook d'exécution d'augmentation du catalogue de fournisseurs et coutures de registre plugin-fournisseur pour les tests de contrat |
    | `plugin-sdk/provider-catalog-shared` | `findCatalogTemplate`, `buildSingleProviderApiKeyCatalog`, `buildManifestModelProviderConfig`, `supportsNativeStreamingUsageCompat`, `applyProviderNativeStreamingUsageCompat` |
    | `plugin-sdk/provider-http` | Helpers génériques de capacités HTTP/point de terminaison de fournisseur, erreurs HTTP de fournisseur et helpers de formulaire multipart pour la transcription audio |
    | `plugin-sdk/provider-web-fetch-contract` | Helpers de contrat étroits de configuration/sélection web-fetch tels que `enablePluginInConfig` et `WebFetchProviderPlugin` |
    | `plugin-sdk/provider-web-fetch` | Helpers d'enregistrement/cache de fournisseur web-fetch |
    | `plugin-sdk/provider-web-search-config-contract` | Helpers étroits de configuration/identifiants web-search pour les fournisseurs qui n'ont pas besoin de câblage d'activation de plugin |
    | `plugin-sdk/provider-web-search-contract` | Helpers de contrat étroits de configuration/identifiants web-search tels que `createWebSearchProviderContractFields`, `enablePluginInConfig`, `resolveProviderWebSearchPluginConfig` et setters/getters d'identifiants à portée limitée |
    | `plugin-sdk/provider-web-search` | Helpers d'enregistrement/cache/exécution de fournisseur web-search |
    | `plugin-sdk/embedding-providers` | Types généraux de fournisseurs d'embeddings et helpers de lecture, notamment `EmbeddingProviderAdapter`, `getEmbeddingProvider(...)` et `listEmbeddingProviders(...)` ; les plugins enregistrent les fournisseurs via `api.registerEmbeddingProvider(...)` afin que la propriété du manifeste soit appliquée |
    | `plugin-sdk/provider-tools` | `ProviderToolCompatFamily`, `buildProviderToolCompatFamilyHooks` et nettoyage de schémas + diagnostics DeepSeek/Gemini/OpenAI |
    | `plugin-sdk/provider-usage` | Types d'instantanés d'utilisation des fournisseurs, helpers partagés de récupération d'utilisation et récupérateurs de fournisseurs tels que `fetchClaudeUsage` |
    | `plugin-sdk/provider-stream` | `ProviderStreamFamily`, `buildProviderStreamFamilyHooks`, `composeProviderStreamWrappers`, types de wrappers de flux, compatibilité des appels d'outils en texte brut et helpers partagés de wrappers Anthropic/Bedrock/DeepSeek V4/Google/Kilocode/Moonshot/OpenAI/OpenRouter/Z.A.I/MiniMax/Copilot |
    | `plugin-sdk/provider-stream-shared` | Helpers publics partagés de wrappers de flux de fournisseur, notamment `composeProviderStreamWrappers`, `createOpenAICompatibleCompletionsThinkingOffWrapper`, `createPlainTextToolCallCompatWrapper`, `createPayloadPatchStreamWrapper`, `createToolStreamWrapper`, `normalizeOpenAICompatibleReasoningPayload`, `setQwenChatTemplateThinking` et utilitaires de flux compatibles Anthropic/DeepSeek/OpenAI |
    | `plugin-sdk/provider-transport-runtime` | Helpers de transport natif de fournisseur tels que fetch protégé, extraction du texte des résultats d'outils, transformations des messages de transport et flux d'événements de transport inscriptibles |
    | `plugin-sdk/provider-onboard` | Helpers de correctifs de configuration d'onboarding |
    | `plugin-sdk/global-singleton` | Helpers de singleton/map/cache locaux au processus |
    | `plugin-sdk/group-activation` | Helpers étroits de mode d'activation de groupe et d'analyse de commandes |
  </Accordion>

Les instantanés d'utilisation des fournisseurs signalent normalement une ou plusieurs
`windows` de quota, chacune avec un libellé, un pourcentage utilisé et une heure de
réinitialisation facultative. Les fournisseurs qui exposent un solde ou un texte
d'état de compte au lieu de fenêtres de quota réinitialisables doivent renvoyer
`summary` avec un tableau `windows` vide plutôt que de fabriquer des pourcentages.
OpenClaw affiche ce texte de résumé dans la sortie d'état ; utilisez `error` uniquement lorsque le
point de terminaison d'utilisation a échoué ou n'a renvoyé aucune donnée d'utilisation exploitable.

  <Accordion title="Sous-chemins d'authentification et de sécurité">
    | Sous-chemin | Exports principaux |
    | --- | --- |
    | `plugin-sdk/command-auth` | `resolveControlCommandGate`, helpers de registre de commandes incluant le formatage dynamique des menus d'arguments, helpers d'autorisation de l'expéditeur |
    | `plugin-sdk/command-status` | Constructeurs de messages de commande/aide tels que `buildCommandsMessagePaginated` et `buildHelpMessage` |
    | `plugin-sdk/approval-auth-runtime` | Helpers de résolution des approbateurs et d'authentification d'action dans le même chat |
    | `plugin-sdk/approval-client-runtime` | Helpers de profil/filtre d'approbation native d'exec |
    | `plugin-sdk/approval-delivery-runtime` | Adaptateurs natifs de capacité/livraison d'approbation |
    | `plugin-sdk/approval-gateway-runtime` | Helper partagé de résolution du Gateway d'approbation |
    | `plugin-sdk/approval-handler-adapter-runtime` | Helpers légers de chargement d'adaptateurs d'approbation natifs pour les points d'entrée de canaux chauds |
    | `plugin-sdk/approval-handler-runtime` | Helpers d'exécution plus larges du gestionnaire d'approbation ; préférez les coutures d'adaptateur/Gateway plus étroites lorsqu'elles suffisent |
    | `plugin-sdk/approval-native-runtime` | Helpers natifs de cible d'approbation, liaison de compte, gate de routage, fallback de transfert et suppression de prompt d'exec natif local |
    | `plugin-sdk/approval-reaction-runtime` | Liaisons de réactions d'approbation codées en dur, payloads de prompts de réaction, magasins de cibles de réaction et export de compatibilité pour la suppression de prompt d'exec natif local |
    | `plugin-sdk/approval-reply-runtime` | Helpers de payload de réponse d'approbation exec/plugin |
    | `plugin-sdk/approval-runtime` | Helpers de payload d'approbation exec/plugin, helpers natifs de routage/exécution d'approbation et helpers d'affichage structuré d'approbation tels que `formatApprovalDisplayPath` |
    | `plugin-sdk/reply-dedupe` | Helpers étroits de réinitialisation de déduplication des réponses entrantes |
    | `plugin-sdk/channel-contract-testing` | Helpers étroits de tests de contrat de canal sans le large barrel de test |
    | `plugin-sdk/command-auth-native` | Authentification native des commandes, formatage dynamique des menus d'arguments et helpers natifs de cible de session |
    | `plugin-sdk/command-detection` | Helpers partagés de détection des commandes |
    | `plugin-sdk/command-primitives-runtime` | Prédicats légers de texte de commande pour les chemins de canaux chauds |
    | `plugin-sdk/command-surface` | Normalisation du corps des commandes et helpers de surface de commande |
    | `plugin-sdk/allow-from` | `formatAllowFromLowercase` |
    | `plugin-sdk/channel-secret-runtime` | Helpers étroits de collecte de contrats de secrets pour les surfaces de secrets de canal/plugin |
    | `plugin-sdk/secret-ref-runtime` | Helpers étroits `coerceSecretRef` et de typage SecretRef pour l'analyse de contrats/configuration de secrets |
    | `plugin-sdk/secret-provider-integration` | Manifeste d'intégration de fournisseur SecretRef uniquement typé et contrats de préréglages pour les plugins qui publient des préréglages de fournisseurs de secrets externes |
    | `plugin-sdk/security-runtime` | Helpers partagés de confiance, gating des DM, fichiers/chemins bornés par la racine incluant écritures en création seule, remplacement atomique de fichier synchrone/asynchrone, écritures temporaires voisines, fallback de déplacement entre périphériques, helpers de magasin de fichiers privé, gardes de parents de symlinks, contenu externe, rédaction de texte sensible, comparaison de secrets en temps constant et helpers de collecte de secrets |
    | `plugin-sdk/ssrf-policy` | Helpers de liste d'autorisation d'hôtes et de politique SSRF pour réseaux privés |
    | `plugin-sdk/ssrf-dispatcher` | Helpers étroits de répartiteur épinglé sans la large surface d'exécution d'infrastructure |
    | `plugin-sdk/ssrf-runtime` | Répartiteur épinglé, fetch protégé contre SSRF, erreur SSRF et helpers de politique SSRF |
    | `plugin-sdk/secret-input` | Helpers d'analyse des entrées de secrets |
    | `plugin-sdk/webhook-ingress` | Helpers de requête/cible Webhook et coercition brute de websocket/corps |
    | `plugin-sdk/webhook-request-guards` | Helpers de taille/timeout de corps de requête |
  </Accordion>

  <Accordion title="Sous-chemins d’exécution et de stockage">
    | Sous-chemin | Exports clés |
    | --- | --- |
    | `plugin-sdk/runtime` | Assistants étendus pour l’exécution, la journalisation, les sauvegardes et l’installation de Plugins |
    | `plugin-sdk/runtime-env` | Assistants ciblés pour l’environnement d’exécution, le journaliseur, les délais d’expiration, les nouvelles tentatives et la temporisation |
    | `plugin-sdk/browser-config` | Façade de configuration de navigateur prise en charge pour le profil et les valeurs par défaut normalisés, l’analyse des URL CDP et les assistants d’authentification du contrôle de navigateur |
    | `plugin-sdk/agent-harness-task-runtime` | Assistants génériques de cycle de vie des tâches et de remise d’achèvement pour les agents adossés à un harnais utilisant une portée de tâche émise par l’hôte |
    | `plugin-sdk/codex-mcp-projection` | Assistant Codex groupé réservé pour projeter la configuration de serveur MCP utilisateur dans la configuration de fil Codex ; non destiné aux Plugins tiers |
    | `plugin-sdk/codex-native-task-runtime` | Assistant Codex groupé privé pour le câblage du miroir et de l’exécution des tâches natives ; non destiné aux Plugins tiers |
    | `plugin-sdk/channel-runtime-context` | Assistants génériques d’enregistrement et de recherche du contexte d’exécution de canal |
    | `plugin-sdk/matrix` | Façade de compatibilité Matrix obsolète pour les anciens paquets de canaux tiers ; les nouveaux Plugins doivent importer directement `plugin-sdk/run-command` |
    | `plugin-sdk/mattermost` | Façade de compatibilité Mattermost obsolète pour les anciens paquets de canaux tiers ; les nouveaux Plugins doivent importer directement les sous-chemins génériques du SDK |
    | `plugin-sdk/runtime-store` | `createPluginRuntimeStore` |
    | `plugin-sdk/plugin-runtime` | Assistants partagés pour les commandes, hooks, HTTP et interactions de Plugin |
    | `plugin-sdk/hook-runtime` | Assistants partagés pour le pipeline de hooks Webhook et internes |
    | `plugin-sdk/lazy-runtime` | Assistants d’importation et de liaison paresseuses à l’exécution, tels que `createLazyRuntimeModule`, `createLazyRuntimeMethod` et `createLazyRuntimeSurface` |
    | `plugin-sdk/process-runtime` | Assistants d’exécution de processus |
    | `plugin-sdk/cli-runtime` | Assistants CLI de formatage, d’attente, de version, d’invocation par arguments et de groupes de commandes paresseux |
    | `plugin-sdk/qa-live-transport-scenarios` | Identifiants de scénarios d’assurance qualité de transport en direct partagés, assistants de couverture de référence et assistant de sélection de scénario |
    | `plugin-sdk/gateway-method-runtime` | Assistant réservé de répartition de méthodes Gateway pour les routes HTTP de Plugin qui déclarent `contracts.gatewayMethodDispatch: ["authenticated-request"]` |
    | `plugin-sdk/gateway-runtime` | Client Gateway, assistant de démarrage de client prêt pour la boucle d’événements, RPC CLI Gateway, erreurs de protocole Gateway, résolution de l’hôte LAN annoncé et assistants de correctifs d’état de canal |
    | `plugin-sdk/config-contracts` | Surface de configuration ciblée uniquement typée pour les formes de configuration de Plugin telles que `OpenClawConfig` et les types de configuration de canal ou de fournisseur |
    | `plugin-sdk/plugin-config-runtime` | Assistants de recherche de configuration de Plugin à l’exécution, tels que `requireRuntimeConfig`, `resolvePluginConfigObject` et `resolveLivePluginConfigObject` |
    | `plugin-sdk/config-mutation` | Assistants transactionnels de mutation de configuration, tels que `mutateConfigFile`, `replaceConfigFile` et `logConfigUpdated` |
    | `plugin-sdk/message-tool-delivery-hints` | Chaînes d’indication de métadonnées partagées pour la remise par outils de message |
    | `plugin-sdk/runtime-config-snapshot` | Assistants d’instantané de configuration du processus courant, tels que `getRuntimeConfig`, `getRuntimeConfigSnapshot` et les mutateurs d’instantané de test |
    | `plugin-sdk/telegram-command-config` | Normalisation des noms et descriptions de commandes Telegram et vérifications de doublons ou de conflits, même lorsque la surface de contrat Telegram groupée n’est pas disponible |
    | `plugin-sdk/text-autolink-runtime` | Détection de liens automatiques de références de fichiers sans le vaste module textuel |
    | `plugin-sdk/approval-reaction-runtime` | Liaisons codées en dur de réactions d’approbation, charges utiles d’invite de réaction, magasins de cibles de réaction et export de compatibilité pour la suppression locale de l’invite d’exécution native |
    | `plugin-sdk/approval-runtime` | Assistants d’approbation d’exécution et de Plugin, constructeurs de capacités d’approbation, assistants d’authentification et de profil, assistants de routage et d’exécution native, et formatage structuré du chemin d’affichage d’approbation |
    | `plugin-sdk/reply-runtime` | Assistants partagés d’exécution d’entrées et de réponses, découpage, répartition, Heartbeat, planificateur de réponses |
    | `plugin-sdk/reply-dispatch-runtime` | Assistants ciblés de répartition et de finalisation des réponses, et assistants d’étiquettes de conversation |
    | `plugin-sdk/reply-history` | Assistants partagés d’historique de réponses sur fenêtre courte. Le nouveau code de tour de message doit utiliser `createChannelHistoryWindow` ; les assistants de carte de plus bas niveau restent uniquement des exports de compatibilité obsolètes |
    | `plugin-sdk/reply-reference` | `createReplyReferencePlanner` |
    | `plugin-sdk/reply-chunking` | Assistants ciblés de découpage de texte et de Markdown |
    | `plugin-sdk/session-store-runtime` | Assistants de workflow de session (`getSessionEntry`, `listSessionEntries`, `patchSessionEntry`, `upsertSessionEntry`), lectures bornées du texte de transcription utilisateur/assistant récent par identité de session, anciens assistants de chemin de magasin de sessions et de clé de session, lectures de mise à jour, et assistants de compatibilité transitoires pour magasin entier et chemin de fichier |
    | `plugin-sdk/session-transcript-runtime` | Identité de transcription, assistants de cible/lecture/écriture avec portée, publication de mises à jour, verrous d’écriture et clés de correspondance en mémoire de transcription |
    | `plugin-sdk/sqlite-runtime` | Assistants ciblés de schéma d’agent SQLite, de chemin et de transaction pour l’exécution interne |
    | `plugin-sdk/cron-store-runtime` | Assistants de chemin, chargement et enregistrement du magasin Cron |
    | `plugin-sdk/state-paths` | Assistants de chemins de répertoires d’état et OAuth |
    | `plugin-sdk/plugin-state-runtime` | Types d’état clé dans SQLite sidecar de Plugin, plus configuration centralisée des pragmas de connexion et de la maintenance WAL pour les bases de données détenues par des Plugins |
    | `plugin-sdk/routing` | Assistants de liaison route/clé de session/compte, tels que `resolveAgentRoute`, `buildAgentSessionKey` et `resolveDefaultAgentBoundAccountId` |
    | `plugin-sdk/status-helpers` | Assistants partagés de résumé d’état de canal/compte, valeurs par défaut d’état d’exécution et assistants de métadonnées de problème |
    | `plugin-sdk/target-resolver-runtime` | Assistants partagés de résolution de cible |
    | `plugin-sdk/string-normalization-runtime` | Assistants de normalisation de slugs et de chaînes |
    | `plugin-sdk/request-url` | Extraction d’URL sous forme de chaînes depuis des entrées de type fetch/requête |
    | `plugin-sdk/run-command` | Exécuteur de commandes temporisé avec résultats stdout/stderr normalisés |
    | `plugin-sdk/param-readers` | Lecteurs courants de paramètres d’outil et de CLI |
    | `plugin-sdk/tool-plugin` | Définir un Plugin d’outil d’agent typé simple et exposer des métadonnées statiques pour la génération de manifeste |
    | `plugin-sdk/tool-payload` | Extraire des charges utiles normalisées depuis les objets de résultat d’outil |
    | `plugin-sdk/tool-send` | Extraire les champs canoniques de cible d’envoi depuis les arguments d’outil |
    | `plugin-sdk/sandbox` | Types de moteurs de bac à sable et assistants de commandes SSH/OpenShell, y compris la pré-vérification d’exécution de commande à échec rapide |
    | `plugin-sdk/temp-path` | Assistants partagés de chemins de téléchargement temporaire et espaces de travail temporaires sécurisés privés |
    | `plugin-sdk/logging-core` | Journaliseur de sous-système et assistants de caviardage |
    | `plugin-sdk/markdown-table-runtime` | Assistants de mode et de conversion de tableaux Markdown |
    | `plugin-sdk/model-session-runtime` | Assistants de remplacement de modèle/session, tels que `applyModelOverrideToSessionEntry` et `resolveAgentMaxConcurrent` |
    | `plugin-sdk/talk-config-runtime` | Assistants de résolution de configuration de fournisseur de conversation |
    | `plugin-sdk/json-store` | Petits assistants de lecture/écriture d’état JSON |
    | `plugin-sdk/json-unsafe-integers` | Assistants d’analyse JSON qui préservent les littéraux d’entiers non sûrs sous forme de chaînes |
    | `plugin-sdk/file-lock` | Assistants de verrouillage de fichier réentrant |
    | `plugin-sdk/persistent-dedupe` | Assistants de cache de déduplication adossé au disque |
    | `plugin-sdk/acp-runtime` | Assistants d’exécution/session ACP et de répartition de réponses |
    | `plugin-sdk/acp-runtime-backend` | Assistants légers d’enregistrement de backend ACP et de répartition de réponses pour les Plugins chargés au démarrage |
    | `plugin-sdk/acp-binding-resolve-runtime` | Résolution en lecture seule des liaisons ACP sans imports de démarrage du cycle de vie |
    | `plugin-sdk/agent-config-primitives` | Primitives ciblées de schéma de configuration d’exécution d’agent |
    | `plugin-sdk/boolean-param` | Lecteur souple de paramètres booléens |
    | `plugin-sdk/dangerous-name-runtime` | Assistants de résolution de correspondance de noms dangereux |
    | `plugin-sdk/device-bootstrap` | Assistants d’amorçage d’appareil et de jeton d’association |
    | `plugin-sdk/extension-shared` | Primitives partagées d’assistants de canal passif, d’état et de proxy ambiant |
    | `plugin-sdk/models-provider-runtime` | Assistants de réponse de commande/fournisseur `/models` |
    | `plugin-sdk/skill-commands-runtime` | Assistants de listage des commandes Skill |
    | `plugin-sdk/native-command-registry` | Assistants de registre, construction et sérialisation des commandes natives |
    | `plugin-sdk/agent-harness` | Surface expérimentale de Plugin approuvé pour les harnais d’agent de bas niveau : types de harnais, assistants de pilotage/abandon d’exécution active, assistants de passerelle d’outils OpenClaw, assistants de politique d’outils de plan d’exécution, classification de résultat terminal, assistants de formatage/détail de progression d’outil et utilitaires de résultat de tentative |
    | `plugin-sdk/provider-zai-endpoint` | Façade obsolète de détection de point de terminaison détenue par le fournisseur Z.AI ; utiliser l’API publique du Plugin Z.AI |
    | `plugin-sdk/async-lock-runtime` | Assistant de verrou asynchrone local au processus pour petits fichiers d’état d’exécution |
    | `plugin-sdk/channel-activity-runtime` | Assistant de télémétrie d’activité de canal |
    | `plugin-sdk/concurrency-runtime` | Assistant de concurrence bornée de tâches asynchrones |
    | `plugin-sdk/dedupe-runtime` | Assistants de cache de déduplication en mémoire |
    | `plugin-sdk/delivery-queue-runtime` | Assistant de vidage des remises sortantes en attente |
    | `plugin-sdk/file-access-runtime` | Assistants de chemins sûrs pour fichiers locaux et sources multimédias |
    | `plugin-sdk/heartbeat-runtime` | Assistants de réveil, d’événement et de visibilité Heartbeat |
    | `plugin-sdk/number-runtime` | Assistant de coercition numérique |
    | `plugin-sdk/secure-random-runtime` | Assistants de jetons sécurisés et d’UUID |
    | `plugin-sdk/system-event-runtime` | Assistants de file d’événements système |
    | `plugin-sdk/transport-ready-runtime` | Assistant d’attente de disponibilité du transport |
    | `plugin-sdk/exec-approvals-runtime` | Assistants de fichier de politique d’approbation d’exécution sans le vaste module infra-runtime |
    | `plugin-sdk/infra-runtime` | Adaptateur de compatibilité obsolète ; utiliser les sous-chemins d’exécution ciblés ci-dessus |
    | `plugin-sdk/collection-runtime` | Petits assistants de cache borné |
    | `plugin-sdk/diagnostic-runtime` | Assistants de drapeau de diagnostic, d’événement et de contexte de trace |
    | `plugin-sdk/error-runtime` | Graphe d’erreurs, formatage, assistants partagés de classification des erreurs, `isApprovalNotFoundError` |
    | `plugin-sdk/fetch-runtime` | Fetch enveloppé, proxy, option EnvHttpProxyAgent et assistants de recherche épinglée |
    | `plugin-sdk/runtime-fetch` | Fetch d’exécution conscient du répartiteur sans imports de proxy ni de fetch protégé |
    | `plugin-sdk/inline-image-data-url-runtime` | Assainisseur d’URL de données d’image en ligne et assistants de détection de signature sans la vaste surface d’exécution média |
    | `plugin-sdk/response-limit-runtime` | Lecteur borné de corps de réponse sans la vaste surface d’exécution média |
    | `plugin-sdk/session-binding-runtime` | État courant de liaison de conversation sans routage de liaison configuré ni magasins d’association |
    | `plugin-sdk/session-store-runtime` | Assistants de magasin de sessions sans vastes imports d’écritures ou de maintenance de configuration |
    | `plugin-sdk/sqlite-runtime` | Assistants ciblés de schéma d’agent SQLite, de chemin et de transaction sans contrôles de cycle de vie de base de données |
    | `plugin-sdk/context-visibility-runtime` | Résolution de visibilité du contexte et filtrage de contexte supplémentaire sans vastes imports de configuration/sécurité |
    | `plugin-sdk/string-coerce-runtime` | Assistants ciblés de coercition et de normalisation d’enregistrements primitifs/chaînes sans imports Markdown/journalisation |
    | `plugin-sdk/host-runtime` | Assistants de normalisation de nom d’hôte et d’hôte SCP |
    | `plugin-sdk/retry-runtime` | Assistants de configuration de nouvelles tentatives et d’exécution avec nouvelles tentatives |
    | `plugin-sdk/agent-runtime` | Assistants de répertoire, d’identité et d’espace de travail d’agent, y compris `resolveAgentDir`, `resolveDefaultAgentDir` et l’export de compatibilité obsolète `resolveOpenClawAgentDir` |
    | `plugin-sdk/directory-runtime` | Requête et déduplication de répertoire adossées à la configuration |
    | `plugin-sdk/keyed-async-queue` | `KeyedAsyncQueue` |
  </Accordion>

  <Accordion title="Sous-chemins de capacités et de tests">
    | Sous-chemin | Exports clés |
    | --- | --- |
    | `plugin-sdk/media-runtime` | Helpers partagés de récupération/transformation/stockage de médias, notamment `saveRemoteMedia`, `saveResponseMedia`, `readRemoteMediaBuffer` et `fetchRemoteMedia` obsolète ; privilégiez les helpers de stockage avant les lectures de tampons lorsqu’une URL doit devenir un média OpenClaw |
    | `plugin-sdk/media-mime` | Normalisation MIME ciblée, correspondance des extensions de fichiers, détection MIME et helpers de type de média |
    | `plugin-sdk/media-store` | Helpers ciblés de stockage de médias, tels que `saveMediaBuffer` et `saveMediaStream` |
    | `plugin-sdk/media-generation-runtime` | Helpers partagés de basculement pour la génération de médias, sélection des candidats et messages de modèle manquant |
    | `plugin-sdk/media-understanding` | Types de fournisseurs de compréhension des médias, plus exports de helpers image/audio/extraction structurée destinés aux fournisseurs |
    | `plugin-sdk/text-chunking` | Helpers de découpage/rendu de texte et de markdown, conversion de tableaux markdown, suppression des balises de directives et utilitaires de texte sûr |
    | `plugin-sdk/text-chunking` | Helper de découpage du texte sortant |
    | `plugin-sdk/speech` | Types de fournisseurs vocaux, plus exports de directives, registre, validation, générateur TTS compatible OpenAI et helpers vocaux destinés aux fournisseurs |
    | `plugin-sdk/speech-core` | Types partagés de fournisseurs vocaux, registre, directive, normalisation et exports de helpers vocaux |
    | `plugin-sdk/realtime-transcription` | Types de fournisseurs de transcription en temps réel, helpers de registre et helper partagé de session WebSocket |
    | `plugin-sdk/realtime-bootstrap-context` | Helper d’amorçage de profil en temps réel pour l’injection bornée de contexte `IDENTITY.md`, `USER.md` et `SOUL.md` |
    | `plugin-sdk/realtime-voice` | Types de fournisseurs vocaux en temps réel, helpers de registre et helpers partagés de comportement vocal en temps réel, y compris le suivi de l’activité de sortie |
    | `plugin-sdk/image-generation` | Types de fournisseurs de génération d’images, plus helpers d’URL de données/ressources image et générateur de fournisseur d’images compatible OpenAI |
    | `plugin-sdk/image-generation-core` | Types partagés de génération d’images, helpers de basculement, d’authentification et de registre |
    | `plugin-sdk/music-generation` | Types de fournisseur/requête/résultat de génération musicale |
    | `plugin-sdk/music-generation-core` | Types partagés de génération musicale, helpers de basculement, recherche de fournisseur et analyse de références de modèle |
    | `plugin-sdk/video-generation` | Types de fournisseur/requête/résultat de génération vidéo |
    | `plugin-sdk/video-generation-core` | Types partagés de génération vidéo, helpers de basculement, recherche de fournisseur et analyse de références de modèle |
    | `plugin-sdk/transcripts` | Types partagés de fournisseurs de sources de transcriptions, helpers de registre, descripteurs de session et métadonnées d’énoncé |
    | `plugin-sdk/webhook-targets` | Registre de cibles Webhook et helpers d’installation de routes |
    | `plugin-sdk/webhook-path` | Alias de compatibilité obsolète ; utilisez `plugin-sdk/webhook-ingress` |
    | `plugin-sdk/web-media` | Helpers partagés de chargement de médias distants/locaux |
    | `plugin-sdk/zod` | Réexport de compatibilité obsolète ; importez `zod` directement depuis `zod` |
    | `plugin-sdk/testing` | Barrel de compatibilité obsolète propre au dépôt pour les anciens tests OpenClaw. Les nouveaux tests du dépôt doivent plutôt importer des sous-chemins de test locaux ciblés, tels que `plugin-sdk/agent-runtime-test-contracts`, `plugin-sdk/plugin-test-runtime`, `plugin-sdk/channel-test-helpers`, `plugin-sdk/test-env` ou `plugin-sdk/test-fixtures` |
    | `plugin-sdk/plugin-test-api` | Helper minimal `createTestPluginApi` propre au dépôt pour les tests unitaires d’enregistrement direct de Plugin sans importer les passerelles de helpers de test du dépôt |
    | `plugin-sdk/agent-runtime-test-contracts` | Fixtures de contrat d’adaptateur natif agent-runtime propres au dépôt pour les tests d’authentification, livraison, repli, hooks d’outils, superposition de prompt, schéma et projection de transcription |
    | `plugin-sdk/channel-test-helpers` | Helpers de test orientés canal propres au dépôt pour les contrats génériques d’actions/configuration/statut, assertions de répertoire, cycle de vie du démarrage de compte, enfilage de configuration d’envoi, mocks d’exécution, problèmes de statut, livraison sortante et enregistrement de hooks |
    | `plugin-sdk/channel-target-testing` | Suite partagée propre au dépôt de cas d’erreur de résolution de cible pour les tests de canal |
    | `plugin-sdk/plugin-test-contracts` | Helpers de contrat propres au dépôt pour package Plugin, enregistrement, artefact public, import direct, API d’exécution et effets de bord d’importation |
    | `plugin-sdk/provider-test-contracts` | Helpers de contrat propres au dépôt pour exécution de fournisseur, authentification, découverte, intégration, catalogue, assistant, capacité média, politique de relecture, audio en direct STT temps réel, recherche/récupération web et flux |
    | `plugin-sdk/provider-http-test-mocks` | Mocks HTTP/auth Vitest optionnels propres au dépôt pour les tests de fournisseurs qui exercent `plugin-sdk/provider-http` |
    | `plugin-sdk/test-fixtures` | Fixtures génériques propres au dépôt pour capture d’exécution CLI, contexte sandbox, rédacteur de Skills, message d’agent, événement système, rechargement de module, chemin de Plugin groupé, texte de terminal, découpage, jeton d’authentification et cas typés |
    | `plugin-sdk/test-node-mocks` | Helpers ciblés propres au dépôt pour les mocks intégrés Node à utiliser dans les fabriques Vitest `vi.mock("node:*")` |
  </Accordion>

  <Accordion title="Sous-chemins mémoire">
    | Sous-chemin | Exports clés |
    | --- | --- |
    | `plugin-sdk/memory-core` | Surface groupée de helpers memory-core pour les helpers de gestionnaire/configuration/fichier/CLI |
    | `plugin-sdk/memory-core-engine-runtime` | Façade d’exécution d’indexation/recherche mémoire |
    | `plugin-sdk/memory-core-host-embedding-registry` | Helpers légers de registre de fournisseurs d’embeddings mémoire |
    | `plugin-sdk/memory-core-host-engine-foundation` | Exports du moteur de base de l’hôte mémoire |
    | `plugin-sdk/memory-core-host-engine-embeddings` | Contrats d’embedding de l’hôte mémoire, accès au registre, fournisseur local et helpers génériques de lots/distants. `registerMemoryEmbeddingProvider` sur cette surface est obsolète ; utilisez l’API générique de fournisseur d’embeddings pour les nouveaux fournisseurs. |
    | `plugin-sdk/memory-core-host-engine-qmd` | Exports du moteur QMD de l’hôte mémoire |
    | `plugin-sdk/memory-core-host-engine-storage` | Exports du moteur de stockage de l’hôte mémoire |
    | `plugin-sdk/memory-core-host-multimodal` | Helpers multimodaux de l’hôte mémoire |
    | `plugin-sdk/memory-core-host-query` | Helpers de requête de l’hôte mémoire |
    | `plugin-sdk/memory-core-host-secret` | Helpers de secret de l’hôte mémoire |
    | `plugin-sdk/memory-core-host-events` | Alias de compatibilité obsolète ; utilisez `plugin-sdk/memory-host-events` |
    | `plugin-sdk/memory-core-host-status` | Helpers de statut de l’hôte mémoire |
    | `plugin-sdk/memory-core-host-runtime-cli` | Helpers d’exécution CLI de l’hôte mémoire |
    | `plugin-sdk/memory-core-host-runtime-core` | Helpers d’exécution core de l’hôte mémoire |
    | `plugin-sdk/memory-core-host-runtime-files` | Helpers de fichiers/exécution de l’hôte mémoire |
    | `plugin-sdk/memory-host-core` | Alias neutre vis-à-vis des fournisseurs pour les helpers d’exécution core de l’hôte mémoire |
    | `plugin-sdk/memory-host-events` | Alias neutre vis-à-vis des fournisseurs pour les helpers de journal d’événements de l’hôte mémoire |
    | `plugin-sdk/memory-host-files` | Alias de compatibilité obsolète ; utilisez `plugin-sdk/memory-core-host-runtime-files` |
    | `plugin-sdk/memory-host-markdown` | Helpers partagés de markdown géré pour les plugins adjacents à la mémoire |
    | `plugin-sdk/memory-host-search` | Façade d’exécution Active Memory pour l’accès au gestionnaire de recherche |
    | `plugin-sdk/memory-host-status` | Alias de compatibilité obsolète ; utilisez `plugin-sdk/memory-core-host-status` |
  </Accordion>

  <Accordion title="Sous-chemins réservés aux helpers groupés">
    Les sous-chemins SDK réservés aux helpers groupés sont des surfaces ciblées
    propres au propriétaire pour le code de Plugin groupé. Ils sont suivis dans l’inventaire
    SDK afin que les builds de packages et les alias restent déterministes, mais ce ne sont
    pas des API générales de création de Plugin. Les nouveaux contrats d’hôte réutilisables
    doivent utiliser des sous-chemins SDK génériques tels que `plugin-sdk/gateway-runtime`,
    `plugin-sdk/security-runtime` et `plugin-sdk/plugin-config-runtime`.

    | Sous-chemin | Propriétaire et objectif |
    | --- | --- |
    | `plugin-sdk/codex-mcp-projection` | Helper du Plugin Codex groupé pour projeter la configuration du serveur MCP utilisateur dans la configuration de thread du serveur d’application Codex |
    | `plugin-sdk/codex-native-task-runtime` | Helper du Plugin Codex groupé pour refléter les sous-agents natifs du serveur d’application Codex dans l’état des tâches OpenClaw |

  </Accordion>
</AccordionGroup>

## Connexe

- [Vue d’ensemble du SDK Plugin](/fr/plugins/sdk-overview)
- [Configuration du SDK Plugin](/fr/plugins/sdk-setup)
- [Création de plugins](/fr/plugins/building-plugins)
