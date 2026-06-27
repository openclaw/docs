---
read_when:
    - Choisir le bon sous-chemin plugin-sdk pour une importation de Plugin
    - Audit des sous-chemins des plugins intégrés et des surfaces d’assistance
summary: 'Catalogue des sous-chemins du Plugin SDK : quels imports se trouvent où, regroupés par domaine'
title: Sous-chemins du SDK Plugin
x-i18n:
    generated_at: "2026-06-27T18:00:06Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: c120877dfcc2ddc17237f1ea1a6eb6daf38dcf714ae6446f59ee06e0ef0dfdcc
    source_path: plugins/sdk-subpaths.md
    workflow: 16
---

Le SDK de Plugin est exposé sous forme d’un ensemble de sous-chemins publics étroits sous
`openclaw/plugin-sdk/`. Cette page répertorie les sous-chemins couramment utilisés, regroupés par
objectif. L’inventaire des points d’entrée de compilateur générés se trouve dans
`scripts/lib/plugin-sdk-entrypoints.json`; les exports de paquet constituent le sous-ensemble public
après exclusion des sous-chemins de test/internes locaux au dépôt listés dans
`scripts/lib/plugin-sdk-private-local-only-subpaths.json`. Les mainteneurs peuvent auditer
le nombre d’exports publics avec `pnpm plugin-sdk:surface` et les sous-chemins d’assistants réservés
actifs avec `pnpm plugins:boundary-report:summary`; les exports d’assistants réservés inutilisés
font échouer le rapport CI au lieu de rester dans le SDK public comme
dette de compatibilité dormante.

Pour le guide de création de Plugin, consultez [Vue d’ensemble du SDK de Plugin](/fr/plugins/sdk-overview).

## Entrée de Plugin

| Sous-chemin                    | Exports clés                                                                                                                                                           |
| ------------------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `plugin-sdk/plugin-entry`      | `definePluginEntry`                                                                                                                                                    |
| `plugin-sdk/core`              | `defineChannelPluginEntry`, `createChatChannelPlugin`, `createChannelPluginBase`, `defineSetupPluginEntry`, `buildChannelConfigSchema`, `buildJsonChannelConfigSchema` |
| `plugin-sdk/config-schema`     | `OpenClawSchema`                                                                                                                                                       |
| `plugin-sdk/provider-entry`    | `defineSingleProviderPluginEntry`                                                                                                                                      |
| `plugin-sdk/migration`         | Assistants d’éléments de fournisseur de migration comme `createMigrationItem`, constantes de raison, marqueurs de statut d’élément, assistants de caviardage et `summarizeMigrationItems` |
| `plugin-sdk/migration-runtime` | Assistants de migration à l’exécution comme `copyMigrationFileItem`, `withCachedMigrationConfigRuntime` et `writeMigrationReport`                                      |
| `plugin-sdk/health`            | Types d’enregistrement, détection, réparation, sélection, gravité et constat de vérification d’état Doctor pour les consommateurs d’état groupés                         |

### Assistants de test et de compatibilité obsolètes

Les sous-chemins obsolètes restent exportés pour les anciens Plugins, mais le nouveau code doit utiliser les
sous-chemins SDK ciblés ci-dessous. La liste maintenue est
`scripts/lib/plugin-sdk-deprecated-public-subpaths.json`; la CI rejette les imports de production
groupés qui en proviennent. Les barrels larges comme `compat`, `config-types`,
`infra-runtime`, `text-runtime` et `zod` servent uniquement à la compatibilité. Importez `zod`
directement depuis `zod`.

Les sous-chemins d’assistants de test d’OpenClaw basés sur Vitest sont uniquement locaux au dépôt et ne sont
plus des exports de paquet : `agent-runtime-test-contracts`,
`channel-contract-testing`, `channel-target-testing`, `channel-test-helpers`,
`plugin-test-api`, `plugin-test-contracts`, `plugin-test-runtime`,
`provider-http-test-mocks`, `provider-test-contracts`, `test-env`,
`test-fixtures`, `test-node-mocks` et `testing`.

### Sous-chemins d’assistants de Plugin groupé réservés

Ces sous-chemins sont des surfaces de compatibilité détenues par le Plugin pour leur Plugin groupé
propriétaire, et non des API SDK générales : `plugin-sdk/codex-mcp-projection` et
`plugin-sdk/codex-native-task-runtime`. Les imports d’extension entre propriétaires sont bloqués
par les garde-fous du contrat de paquet.

<AccordionGroup>
  <Accordion title="Sous-chemins de canal">
    | Sous-chemin | Exports clés |
    | --- | --- |
    | `plugin-sdk/channel-core` | `defineChannelPluginEntry`, `defineSetupPluginEntry`, `createChatChannelPlugin`, `createChannelPluginBase` |
    | `plugin-sdk/config-schema` | Export du schéma Zod racine `openclaw.json` (`OpenClawSchema`) |
    | `plugin-sdk/json-schema-runtime` | Assistant de validation JSON Schema mis en cache pour les schémas appartenant aux plugins |
    | `plugin-sdk/channel-setup` | `createOptionalChannelSetupSurface`, `createOptionalChannelSetupAdapter`, `createOptionalChannelSetupWizard`, plus `DEFAULT_ACCOUNT_ID`, `createTopLevelChannelDmPolicy`, `setSetupChannelEnabled`, `splitSetupEntries` |
    | `plugin-sdk/setup` | Assistants partagés de l’assistant de configuration, traducteur de configuration, invites de liste d’autorisation, générateurs d’état de configuration |
    | `plugin-sdk/setup-runtime` | `createSetupTranslator`, `createPatchedAccountSetupAdapter`, `createEnvPatchedAccountSetupAdapter`, `createSetupInputPresenceValidator`, `noteChannelLookupFailure`, `noteChannelLookupSummary`, `promptResolvedAllowFrom`, `splitSetupEntries`, `createAllowlistSetupWizardProxy`, `createDelegatedSetupWizardProxy` |
    | `plugin-sdk/setup-adapter-runtime` | Alias de compatibilité obsolète ; utilisez `plugin-sdk/setup-runtime` |
    | `plugin-sdk/setup-tools` | `formatCliCommand`, `detectBinary`, `extractArchive`, `resolveBrewExecutable`, `formatDocsLink`, `CONFIG_DIR` |
    | `plugin-sdk/account-core` | Assistants de configuration multi-compte/de barrière d’action, assistants de repli vers le compte par défaut |
    | `plugin-sdk/account-id` | `DEFAULT_ACCOUNT_ID`, assistants de normalisation des identifiants de compte |
    | `plugin-sdk/account-resolution` | Assistants de recherche de compte et de repli par défaut |
    | `plugin-sdk/account-helpers` | Assistants ciblés de liste de comptes/d’action de compte |
    | `plugin-sdk/access-groups` | Assistants d’analyse de liste d’autorisation de groupes d’accès et de diagnostics de groupes expurgés |
    | `plugin-sdk/channel-pairing` | `createChannelPairingController` |
    | `plugin-sdk/channel-reply-pipeline` | Façade de compatibilité obsolète. Utilisez `plugin-sdk/channel-outbound`. |
    | `plugin-sdk/channel-config-helpers` | `createHybridChannelConfigAdapter`, `resolveChannelDmAccess`, `resolveChannelDmAllowFrom`, `resolveChannelDmPolicy`, `normalizeChannelDmPolicy`, `normalizeLegacyDmAliases` |
    | `plugin-sdk/channel-config-schema` | Primitives partagées de schéma de configuration de canal, plus générateurs Zod et JSON/TypeBox directs |
    | `plugin-sdk/bundled-channel-config-schema` | Schémas de configuration de canal OpenClaw groupés, uniquement pour les plugins groupés maintenus |
    | `plugin-sdk/chat-channel-ids` | `BUNDLED_CHAT_CHANNEL_IDS`, `BUNDLED_CHAT_CHANNEL_ENVELOPE_PREFIXES`, `ChatChannelId`. Identifiants canoniques des canaux de chat groupés/officiels, plus libellés/alias de formateur pour les plugins qui doivent reconnaître du texte préfixé par une enveloppe sans coder en dur leur propre table. |
    | `plugin-sdk/channel-config-schema-legacy` | Alias de compatibilité obsolète pour les schémas de configuration de canal groupé |
    | `plugin-sdk/telegram-command-config` | Assistants de normalisation/validation des commandes personnalisées Telegram avec repli de contrat groupé |
    | `plugin-sdk/command-gating` | Assistants ciblés de barrière d’autorisation de commande |
    | `plugin-sdk/channel-policy` | `resolveChannelGroupRequireMention` |
    | `plugin-sdk/channel-ingress` | Façade de compatibilité obsolète d’entrée de canal bas niveau. Les nouveaux chemins de réception doivent utiliser `plugin-sdk/channel-ingress-runtime`. |
    | `plugin-sdk/channel-ingress-runtime` | Résolveur expérimental haut niveau d’exécution d’entrée de canal et générateurs de faits de route pour les chemins de réception de canal migrés. Préférez-le à l’assemblage des listes d’autorisation effectives, des listes d’autorisation de commandes et des projections héritées dans chaque plugin. Voir [API d’entrée de canal](/fr/plugins/sdk-channel-ingress). |
    | `plugin-sdk/channel-lifecycle` | Façade de compatibilité obsolète. Utilisez `plugin-sdk/channel-outbound`. |
    | `plugin-sdk/channel-outbound` | Contrats de cycle de vie des messages, plus options de pipeline de réponse, accusés de réception, aperçu en direct/streaming, assistants de cycle de vie, identité sortante, planification de charge utile, envois durables et assistants de contexte d’envoi de message. Voir [API de sortie de canal](/fr/plugins/sdk-channel-outbound). |
    | `plugin-sdk/channel-message` | Alias de compatibilité obsolète pour `plugin-sdk/channel-outbound`, plus façades héritées de distribution de réponses. |
    | `plugin-sdk/channel-message-runtime` | Alias de compatibilité obsolète pour `plugin-sdk/channel-outbound`, plus façades héritées de distribution de réponses. |
    | `plugin-sdk/inbound-envelope` | Assistants partagés de route entrante et de génération d’enveloppe |
    | `plugin-sdk/inbound-reply-dispatch` | Façade de compatibilité obsolète. Utilisez `plugin-sdk/channel-inbound` pour les exécuteurs entrants et les prédicats de distribution, et `plugin-sdk/channel-outbound` pour les assistants de livraison de messages. |
    | `plugin-sdk/messaging-targets` | Alias obsolète d’analyse des cibles ; utilisez `plugin-sdk/channel-targets` |
    | `plugin-sdk/outbound-media` | Assistants partagés de chargement de médias sortants et d’état de médias hébergés |
    | `plugin-sdk/outbound-send-deps` | Façade de compatibilité obsolète. Utilisez `plugin-sdk/channel-outbound`. |
    | `plugin-sdk/outbound-runtime` | Façade de compatibilité obsolète. Utilisez `plugin-sdk/channel-outbound`. |
    | `plugin-sdk/poll-runtime` | Assistants ciblés de normalisation de sondage |
    | `plugin-sdk/thread-bindings-runtime` | Assistants de cycle de vie et d’adaptateur des liaisons de fil |
    | `plugin-sdk/agent-media-payload` | Générateur hérité de charge utile média d’agent |
    | `plugin-sdk/conversation-runtime` | Assistants de conversation/liaison de fil, d’appairage et de liaison configurée |
    | `plugin-sdk/runtime-config-snapshot` | Assistant d’instantané de configuration d’exécution |
    | `plugin-sdk/runtime-group-policy` | Assistants de résolution de stratégie de groupe à l’exécution |
    | `plugin-sdk/channel-status` | Assistants partagés d’instantané/résumé d’état de canal |
    | `plugin-sdk/channel-config-primitives` | Primitives ciblées de schéma de configuration de canal |
    | `plugin-sdk/channel-config-writes` | Assistants d’autorisation d’écriture de configuration de canal |
    | `plugin-sdk/channel-plugin-common` | Exports partagés de préambule de plugin de canal |
    | `plugin-sdk/allowlist-config-edit` | Assistants de modification/lecture de configuration de liste d’autorisation |
    | `plugin-sdk/group-access` | Assistants partagés de décision d’accès de groupe |
    | `plugin-sdk/direct-dm`, `plugin-sdk/direct-dm-access` | Façades de compatibilité obsolètes. Utilisez `plugin-sdk/channel-inbound`. |
    | `plugin-sdk/direct-dm-guard-policy` | Assistants ciblés de stratégie de garde direct-DM pré-chiffrement |
    | `plugin-sdk/discord` | Façade de compatibilité Discord obsolète pour `@openclaw/discord@2026.3.13` publié et compatibilité propriétaire suivie ; les nouveaux plugins doivent utiliser les sous-chemins SDK de canal génériques |
    | `plugin-sdk/telegram-account` | Façade de compatibilité obsolète de résolution de compte Telegram pour compatibilité propriétaire suivie ; les nouveaux plugins doivent utiliser les assistants d’exécution injectés ou les sous-chemins SDK de canal génériques |
    | `plugin-sdk/zalouser` | Façade de compatibilité Zalo Personal obsolète pour les packages Lark/Zalo publiés qui importent encore l’autorisation des commandes d’expéditeur ; les nouveaux plugins doivent utiliser `plugin-sdk/command-auth` |
    | `plugin-sdk/interactive-runtime` | Présentation sémantique des messages, livraison et assistants hérités de réponse interactive. Voir [Présentation des messages](/fr/plugins/message-presentation) |
    | `plugin-sdk/channel-inbound` | Assistants entrants partagés pour la classification d’événements, la construction de contexte, le formatage, les racines, l’anti-rebond, la correspondance des mentions, la stratégie de mention et la journalisation entrante |
    | `plugin-sdk/channel-inbound-debounce` | Assistants ciblés d’anti-rebond entrant |
    | `plugin-sdk/channel-mention-gating` | Assistants ciblés de stratégie de mention, marqueur de mention et texte de mention sans la surface plus large d’exécution entrante |
    | `plugin-sdk/channel-envelope`, `plugin-sdk/channel-inbound-roots`, `plugin-sdk/channel-location`, `plugin-sdk/channel-logging` | Façades de compatibilité obsolètes. Utilisez `plugin-sdk/channel-inbound` ou `plugin-sdk/channel-outbound`. |
    | `plugin-sdk/channel-pairing-paths` | Façade de compatibilité obsolète. Utilisez `plugin-sdk/channel-pairing`. |
    | `plugin-sdk/channel-reply-options-runtime` | Façade de compatibilité obsolète. Utilisez `plugin-sdk/channel-outbound`. |
    | `plugin-sdk/channel-streaming` | Façade de compatibilité obsolète. Utilisez `plugin-sdk/channel-outbound`. |
    | `plugin-sdk/channel-send-result` | Types de résultat de réponse |
    | `plugin-sdk/channel-actions` | Assistants d’action de message de canal, plus assistants de schéma natif obsolètes conservés pour la compatibilité des plugins |
    | `plugin-sdk/channel-route` | Assistants partagés de normalisation de route, résolution de cible pilotée par analyseur, conversion d’ID de fil en chaîne, clés de route dédupliquées/compactes, types de cibles analysées et comparaison route/cible |
    | `plugin-sdk/channel-targets` | Assistants d’analyse de cible ; les appelants de comparaison de route doivent utiliser `plugin-sdk/channel-route` |
    | `plugin-sdk/channel-contract` | Types de contrat de canal |
    | `plugin-sdk/channel-feedback` | Câblage de retours/réactions |
    | `plugin-sdk/channel-secret-runtime` | Assistants ciblés de contrat de secret tels que `collectSimpleChannelFieldAssignments`, `getChannelSurface`, `pushAssignment` et types de cibles de secret |
  </Accordion>

Les familles obsolètes d’assistants de canal restent disponibles uniquement pour la
compatibilité des plugins publiés. Le plan de suppression est le suivant :
les conserver pendant la fenêtre de migration des plugins externes, garder les
plugins du dépôt/groupés sur `channel-inbound` et `channel-outbound`, puis
supprimer les sous-chemins de compatibilité lors du prochain grand nettoyage
du SDK. Cela s’applique aux anciennes familles de messages/exécution de canal,
de streaming de canal, d’accès direct-DM, de fragmentation des assistants
entrants, d’options de réponse et de chemins d’appairage.

  <Accordion title="Sous-chemins des fournisseurs">
    | Sous-chemin | Exports clés |
    | --- | --- |
    | `plugin-sdk/provider-entry` | `defineSingleProviderPluginEntry` |
    | `plugin-sdk/lmstudio` | Façade de fournisseur LM Studio prise en charge pour la configuration, la découverte du catalogue et la préparation des modèles à l’exécution |
    | `plugin-sdk/lmstudio-runtime` | Façade d’exécution LM Studio prise en charge pour les valeurs par défaut du serveur local, la découverte des modèles, les en-têtes de requête et les assistants de modèles chargés |
    | `plugin-sdk/provider-setup` | Assistants sélectionnés de configuration de fournisseurs locaux/auto-hébergés |
    | `plugin-sdk/self-hosted-provider-setup` | Assistants ciblés de configuration de fournisseurs auto-hébergés compatibles avec OpenAI |
    | `plugin-sdk/cli-backend` | Valeurs par défaut du backend CLI + constantes du chien de garde |
    | `plugin-sdk/provider-auth-runtime` | Assistants d’exécution de résolution de clé d’API pour les Plugins de fournisseurs |
    | `plugin-sdk/provider-oauth-runtime` | Types génériques de rappel OAuth de fournisseur, rendu de page de rappel, assistants PKCE/état, analyse des entrées d’autorisation, assistants d’expiration des jetons et assistants d’abandon |
    | `plugin-sdk/provider-auth-api-key` | Assistants d’intégration/d’écriture de profil de clé d’API, comme `upsertApiKeyProfile` |
    | `plugin-sdk/provider-auth-result` | Générateur standard de résultat d’authentification OAuth |
    | `plugin-sdk/provider-env-vars` | Assistants de recherche de variables d’environnement d’authentification de fournisseur |
    | `plugin-sdk/provider-auth` | `createProviderApiKeyAuthMethod`, `ensureApiKeyFromOptionEnvOrPrompt`, `upsertAuthProfile`, `upsertApiKeyProfile`, `writeOAuthCredentials`, assistants d’importation d’authentification OpenAI Codex, export de compatibilité obsolète `resolveOpenClawAgentDir` |
    | `plugin-sdk/provider-model-shared` | `ProviderReplayFamily`, `buildProviderReplayFamilyHooks`, `normalizeModelCompat`, générateurs partagés de politiques de relecture, assistants de points de terminaison de fournisseur et assistants partagés de normalisation d’identifiants de modèle |
    | `plugin-sdk/provider-catalog-live-runtime` | Assistants de catalogue de modèles de fournisseur en direct pour la découverte gardée de type `/models` : `buildLiveModelProviderConfig`, `fetchLiveProviderModelRows`, `getCachedLiveProviderModelRows`, `fetchLiveProviderModelIds`, `LiveModelCatalogHttpError`, `clearLiveCatalogCacheForTests`, filtrage des identifiants de modèle, cache TTL et repli statique |
    | `plugin-sdk/provider-catalog-runtime` | Hook d’exécution d’augmentation du catalogue de fournisseurs et seams de registre Plugin-fournisseur pour les tests de contrat |
    | `plugin-sdk/provider-catalog-shared` | `findCatalogTemplate`, `buildSingleProviderApiKeyCatalog`, `buildManifestModelProviderConfig`, `supportsNativeStreamingUsageCompat`, `applyProviderNativeStreamingUsageCompat` |
    | `plugin-sdk/provider-http` | Assistants génériques de capacités HTTP/point de terminaison de fournisseur, erreurs HTTP de fournisseur et assistants de formulaire multipart pour la transcription audio |
    | `plugin-sdk/provider-web-fetch-contract` | Assistants de contrat étroit de configuration/sélection de récupération web, comme `enablePluginInConfig` et `WebFetchProviderPlugin` |
    | `plugin-sdk/provider-web-fetch` | Assistants d’inscription/cache de fournisseur de récupération web |
    | `plugin-sdk/provider-web-search-config-contract` | Assistants étroits de configuration/identifiants de recherche web pour les fournisseurs qui n’ont pas besoin du câblage d’activation du Plugin |
    | `plugin-sdk/provider-web-search-contract` | Assistants étroits de contrat de configuration/identifiants de recherche web, comme `createWebSearchProviderContractFields`, `enablePluginInConfig`, `resolveProviderWebSearchPluginConfig`, et accesseurs/mutateurs d’identifiants à portée limitée |
    | `plugin-sdk/provider-web-search` | Assistants d’inscription/cache/exécution de fournisseur de recherche web |
    | `plugin-sdk/embedding-providers` | Types généraux de fournisseurs d’embeddings et assistants de lecture, notamment `EmbeddingProviderAdapter`, `getEmbeddingProvider(...)` et `listEmbeddingProviders(...)` ; les Plugins enregistrent les fournisseurs via `api.registerEmbeddingProvider(...)` afin que la propriété du manifeste soit appliquée |
    | `plugin-sdk/provider-tools` | `ProviderToolCompatFamily`, `buildProviderToolCompatFamilyHooks`, et nettoyage de schéma + diagnostics DeepSeek/Gemini/OpenAI |
    | `plugin-sdk/provider-usage` | Types d’instantanés d’utilisation des fournisseurs, assistants partagés de récupération d’utilisation et récupérateurs de fournisseurs comme `fetchClaudeUsage` |
    | `plugin-sdk/provider-stream` | `ProviderStreamFamily`, `buildProviderStreamFamilyHooks`, `composeProviderStreamWrappers`, types d’enveloppes de flux, compatibilité d’appels d’outils en texte brut et assistants partagés d’enveloppes Anthropic/Bedrock/DeepSeek V4/Google/Kilocode/Moonshot/OpenAI/OpenRouter/Z.A.I/MiniMax/Copilot |
    | `plugin-sdk/provider-stream-shared` | Assistants publics partagés d’enveloppes de flux de fournisseur, notamment `composeProviderStreamWrappers`, `createOpenAICompatibleCompletionsThinkingOffWrapper`, `createPlainTextToolCallCompatWrapper`, `createPayloadPatchStreamWrapper`, `createToolStreamWrapper`, `normalizeOpenAICompatibleReasoningPayload`, `setQwenChatTemplateThinking`, et utilitaires de flux Anthropic/DeepSeek/compatibles OpenAI |
    | `plugin-sdk/provider-transport-runtime` | Assistants de transport natif de fournisseur, comme la récupération gardée, les transformations de messages de transport et les flux d’événements de transport inscriptibles |
    | `plugin-sdk/provider-onboard` | Assistants de correctif de configuration d’intégration |
    | `plugin-sdk/global-singleton` | Assistants singleton/map/cache locaux au processus |
    | `plugin-sdk/group-activation` | Assistants étroits de mode d’activation de groupe et d’analyse de commandes |
  </Accordion>

Les instantanés d’utilisation des fournisseurs signalent normalement une ou plusieurs `windows` de quota, chacune avec
un libellé, un pourcentage utilisé et une heure de réinitialisation facultative. Les fournisseurs qui exposent un texte de solde ou
d’état de compte au lieu de fenêtres de quota réinitialisables doivent renvoyer
`summary` avec un tableau `windows` vide plutôt que de fabriquer des pourcentages.
OpenClaw affiche ce texte de résumé dans la sortie d’état ; utilisez `error` uniquement lorsque le
point de terminaison d’utilisation a échoué ou n’a renvoyé aucune donnée d’utilisation exploitable.

  <Accordion title="Sous-chemins d’authentification et de sécurité">
    | Sous-chemin | Exports clés |
    | --- | --- |
    | `plugin-sdk/command-auth` | `resolveControlCommandGate`, assistants de registre de commandes incluant la mise en forme dynamique du menu d’arguments, assistants d’autorisation de l’expéditeur |
    | `plugin-sdk/command-status` | Générateurs de messages de commandes/aide, comme `buildCommandsMessagePaginated` et `buildHelpMessage` |
    | `plugin-sdk/approval-auth-runtime` | Assistants de résolution d’approbateur et d’authentification d’actions dans la même discussion |
    | `plugin-sdk/approval-client-runtime` | Assistants de profil/filtre d’approbation exec native |
    | `plugin-sdk/approval-delivery-runtime` | Adaptateurs natifs de capacité/livraison d’approbation |
    | `plugin-sdk/approval-gateway-runtime` | Assistant partagé de résolution du Gateway d’approbation |
    | `plugin-sdk/approval-handler-adapter-runtime` | Assistants légers de chargement d’adaptateurs d’approbation native pour les points d’entrée de canaux à chaud |
    | `plugin-sdk/approval-handler-runtime` | Assistants d’exécution plus larges de gestionnaire d’approbation ; privilégiez les seams d’adaptateur/Gateway plus étroits lorsqu’ils suffisent |
    | `plugin-sdk/approval-native-runtime` | Assistants de cible d’approbation native, liaison de compte, garde de route, repli de transfert et suppression locale d’invite exec native |
    | `plugin-sdk/approval-reaction-runtime` | Liaisons codées en dur de réactions d’approbation, charges utiles d’invite de réaction, magasins de cibles de réaction et export de compatibilité pour la suppression locale d’invite exec native |
    | `plugin-sdk/approval-reply-runtime` | Assistants de charges utiles de réponse d’approbation exec/Plugin |
    | `plugin-sdk/approval-runtime` | Assistants de charges utiles d’approbation exec/Plugin, assistants de routage/exécution d’approbation native et assistants d’affichage structuré d’approbation, comme `formatApprovalDisplayPath` |
    | `plugin-sdk/reply-dedupe` | Assistants étroits de réinitialisation de déduplication des réponses entrantes |
    | `plugin-sdk/channel-contract-testing` | Assistants étroits de tests de contrat de canal sans le large barrel de test |
    | `plugin-sdk/command-auth-native` | Authentification de commandes natives, mise en forme dynamique du menu d’arguments et assistants natifs de cible de session |
    | `plugin-sdk/command-detection` | Assistants partagés de détection de commandes |
    | `plugin-sdk/command-primitives-runtime` | Prédicats légers de texte de commande pour les chemins de canaux à chaud |
    | `plugin-sdk/command-surface` | Normalisation du corps de commande et assistants de surface de commande |
    | `plugin-sdk/allow-from` | `formatAllowFromLowercase` |
    | `plugin-sdk/channel-secret-runtime` | Assistants étroits de collecte de contrats de secrets pour les surfaces de secrets de canal/Plugin |
    | `plugin-sdk/secret-ref-runtime` | Assistants étroits `coerceSecretRef` et de typage SecretRef pour l’analyse de contrats de secrets/configuration |
    | `plugin-sdk/secret-provider-integration` | Contrats de manifeste d’intégration de fournisseur SecretRef et de préréglages uniquement typés pour les Plugins qui publient des préréglages de fournisseurs de secrets externes |
    | `plugin-sdk/security-runtime` | Assistants partagés de confiance, de garde DM, de fichiers/chemins bornés à la racine incluant les écritures de création uniquement, le remplacement atomique de fichiers sync/async, les écritures temporaires sœurs, le repli de déplacement inter-périphériques, les assistants de magasin de fichiers privés, les gardes de parents de liens symboliques, le contenu externe, la rédaction de texte sensible, la comparaison de secrets en temps constant et les assistants de collecte de secrets |
    | `plugin-sdk/ssrf-policy` | Assistants de liste d’autorisation d’hôtes et de politique SSRF de réseau privé |
    | `plugin-sdk/ssrf-dispatcher` | Assistants étroits de répartiteur épinglé sans la large surface d’exécution d’infrastructure |
    | `plugin-sdk/ssrf-runtime` | Répartiteur épinglé, récupération gardée SSRF, erreur SSRF et assistants de politique SSRF |
    | `plugin-sdk/secret-input` | Assistants d’analyse d’entrée secrète |
    | `plugin-sdk/webhook-ingress` | Assistants de requête/cible Webhook et coercition de websocket/corps brut |
    | `plugin-sdk/webhook-request-guards` | Assistants de taille/timeout de corps de requête |
  </Accordion>

  <Accordion title="Sous-chemins de runtime et de stockage">
    | Sous-chemin | Exports clés |
    | --- | --- |
    | `plugin-sdk/runtime` | Aides générales de runtime, journalisation, sauvegarde et installation de plugins |
    | `plugin-sdk/runtime-env` | Aides ciblées pour l’environnement de runtime, le journaliseur, les délais d’expiration, les nouvelles tentatives et le backoff |
    | `plugin-sdk/browser-config` | Façade de configuration de navigateur prise en charge pour les profils/valeurs par défaut normalisés, l’analyse des URL CDP et les aides d’authentification de contrôle du navigateur |
    | `plugin-sdk/agent-harness-task-runtime` | Aides génériques de cycle de vie des tâches et de livraison de l’achèvement pour les agents adossés à un harnais utilisant un périmètre de tâche émis par l’hôte |
    | `plugin-sdk/codex-mcp-projection` | Aide Codex intégrée réservée pour projeter la configuration de serveur MCP utilisateur dans la configuration de fil Codex ; non destinée aux plugins tiers |
    | `plugin-sdk/codex-native-task-runtime` | Aide Codex intégrée privée pour le câblage de miroir/runtime de tâche native ; non destinée aux plugins tiers |
    | `plugin-sdk/channel-runtime-context` | Aides génériques d’inscription et de recherche de contexte de runtime de canal |
    | `plugin-sdk/matrix` | Façade de compatibilité Matrix obsolète pour les anciens packages de canaux tiers ; les nouveaux plugins doivent importer directement `plugin-sdk/run-command` |
    | `plugin-sdk/mattermost` | Façade de compatibilité Mattermost obsolète pour les anciens packages de canaux tiers ; les nouveaux plugins doivent importer directement les sous-chemins génériques du SDK |
    | `plugin-sdk/runtime-store` | `createPluginRuntimeStore` |
    | `plugin-sdk/plugin-runtime` | Aides partagées de commandes, hooks, HTTP et interactions de plugins |
    | `plugin-sdk/hook-runtime` | Aides partagées de pipeline de hooks Webhook/internes |
    | `plugin-sdk/lazy-runtime` | Aides d’importation et de liaison différées de runtime telles que `createLazyRuntimeModule`, `createLazyRuntimeMethod` et `createLazyRuntimeSurface` |
    | `plugin-sdk/process-runtime` | Aides d’exécution de processus |
    | `plugin-sdk/cli-runtime` | Aides CLI de formatage, d’attente, de version, d’invocation d’arguments et de groupes de commandes différés |
    | `plugin-sdk/qa-live-transport-scenarios` | Identifiants partagés de scénarios d’AQ de transport en direct, aides de couverture de référence et aide de sélection de scénario |
    | `plugin-sdk/gateway-method-runtime` | Aide réservée de dispatch de méthode Gateway pour les routes HTTP de plugins qui déclarent `contracts.gatewayMethodDispatch: ["authenticated-request"]` |
    | `plugin-sdk/gateway-runtime` | Client Gateway, aide de démarrage de client prêt pour la boucle d’événements, RPC CLI du Gateway, erreurs du protocole Gateway et aides de correctifs d’état de canal |
    | `plugin-sdk/config-contracts` | Surface de configuration ciblée et uniquement typée pour les formes de configuration de plugins telles que `OpenClawConfig` et les types de configuration de canal/fournisseur |
    | `plugin-sdk/plugin-config-runtime` | Aides de recherche de configuration de Plugin au runtime telles que `requireRuntimeConfig`, `resolvePluginConfigObject` et `resolveLivePluginConfigObject` |
    | `plugin-sdk/config-mutation` | Aides de mutation transactionnelle de configuration telles que `mutateConfigFile`, `replaceConfigFile` et `logConfigUpdated` |
    | `plugin-sdk/message-tool-delivery-hints` | Chaînes partagées d’indices de métadonnées de livraison d’outils de message |
    | `plugin-sdk/runtime-config-snapshot` | Aides d’instantané de configuration du processus actuel telles que `getRuntimeConfig`, `getRuntimeConfigSnapshot` et les setters d’instantané de test |
    | `plugin-sdk/telegram-command-config` | Normalisation des noms/descriptions de commandes Telegram et vérifications des doublons/conflits, même lorsque la surface de contrat Telegram intégrée est indisponible |
    | `plugin-sdk/text-autolink-runtime` | Détection de liens automatiques de références de fichiers sans le barrel texte général |
    | `plugin-sdk/approval-reaction-runtime` | Liaisons codées en dur des réactions d’approbation, charges utiles d’invite de réaction, magasins de cibles de réaction et export de compatibilité pour la suppression locale des invites d’exécution natives |
    | `plugin-sdk/approval-runtime` | Aides d’approbation d’exécution/de Plugin, constructeurs de capacités d’approbation, aides d’authentification/profil, aides de routage/runtime natif et formatage structuré des chemins d’affichage d’approbation |
    | `plugin-sdk/reply-runtime` | Aides partagées de runtime entrant/réponse, découpage en fragments, dispatch, Heartbeat, planificateur de réponses |
    | `plugin-sdk/reply-dispatch-runtime` | Aides ciblées de dispatch/finalisation de réponse et de libellés de conversation |
    | `plugin-sdk/reply-history` | Aides partagées d’historique de réponses à fenêtre courte. Le nouveau code de tours de message doit utiliser `createChannelHistoryWindow` ; les aides de map de plus bas niveau restent uniquement des exports de compatibilité obsolètes |
    | `plugin-sdk/reply-reference` | `createReplyReferencePlanner` |
    | `plugin-sdk/reply-chunking` | Aides ciblées de découpage de texte/Markdown |
    | `plugin-sdk/session-store-runtime` | Aides de flux de travail de session (`getSessionEntry`, `listSessionEntries`, `patchSessionEntry`, `upsertSessionEntry`), lectures bornées de texte récent de transcription utilisateur/assistant par identité de session, aides héritées de chemin de magasin de sessions/clé de session, lectures updated-at et aides de compatibilité transitoires de magasin entier/chemin de fichier |
    | `plugin-sdk/session-transcript-runtime` | Identité de transcription, aides ciblées de cible/lecture/écriture, publication de mises à jour, verrous d’écriture et clés de correspondance de mémoire de transcription |
    | `plugin-sdk/sqlite-runtime` | Aides ciblées de schéma d’agent SQLite, de chemin et de transaction pour le runtime interne |
    | `plugin-sdk/cron-store-runtime` | Aides de chemin/chargement/enregistrement du magasin Cron |
    | `plugin-sdk/state-paths` | Aides de chemins de répertoires d’état/OAuth |
    | `plugin-sdk/plugin-state-runtime` | Types d’état à clés SQLite sidecar de Plugin, plus configuration centralisée des pragmas de connexion et de maintenance WAL pour les bases de données appartenant aux plugins |
    | `plugin-sdk/routing` | Aides de liaison de route/clé de session/compte telles que `resolveAgentRoute`, `buildAgentSessionKey` et `resolveDefaultAgentBoundAccountId` |
    | `plugin-sdk/status-helpers` | Aides partagées de résumé d’état de canal/compte, valeurs par défaut d’état de runtime et aides de métadonnées d’issue |
    | `plugin-sdk/target-resolver-runtime` | Aides partagées de résolution de cible |
    | `plugin-sdk/string-normalization-runtime` | Aides de normalisation de slug/chaîne |
    | `plugin-sdk/request-url` | Extraire des URL sous forme de chaînes depuis des entrées de type fetch/request |
    | `plugin-sdk/run-command` | Lanceur de commandes temporisé avec résultats stdout/stderr normalisés |
    | `plugin-sdk/param-readers` | Lecteurs courants de paramètres d’outils/CLI |
    | `plugin-sdk/tool-plugin` | Définir un Plugin d’outil d’agent typé simple et exposer des métadonnées statiques pour la génération de manifeste |
    | `plugin-sdk/tool-payload` | Extraire des charges utiles normalisées depuis des objets de résultat d’outil |
    | `plugin-sdk/tool-send` | Extraire les champs de cible d’envoi canoniques depuis les arguments d’outil |
    | `plugin-sdk/sandbox` | Types de backends de sandbox et aides de commandes SSH/OpenShell, y compris une prévalidation de commande d’exécution à échec rapide |
    | `plugin-sdk/temp-path` | Aides partagées de chemins de téléchargement temporaire et espaces de travail temporaires sécurisés privés |
    | `plugin-sdk/logging-core` | Journaliseur de sous-système et aides de caviardage |
    | `plugin-sdk/markdown-table-runtime` | Aides de mode et de conversion de tables Markdown |
    | `plugin-sdk/model-session-runtime` | Aides de remplacement de modèle/session telles que `applyModelOverrideToSessionEntry` et `resolveAgentMaxConcurrent` |
    | `plugin-sdk/talk-config-runtime` | Aides de résolution de configuration de fournisseur de conversation |
    | `plugin-sdk/json-store` | Petites aides de lecture/écriture d’état JSON |
    | `plugin-sdk/json-unsafe-integers` | Aides d’analyse JSON qui préservent les littéraux d’entiers non sûrs sous forme de chaînes |
    | `plugin-sdk/file-lock` | Aides de verrouillage de fichiers réentrantes |
    | `plugin-sdk/persistent-dedupe` | Aides de cache de déduplication adossé au disque |
    | `plugin-sdk/acp-runtime` | Aides de runtime/session ACP et de dispatch de réponse |
    | `plugin-sdk/acp-runtime-backend` | Aides légères d’inscription de backend ACP et de dispatch de réponse pour les plugins chargés au démarrage |
    | `plugin-sdk/acp-binding-resolve-runtime` | Résolution en lecture seule des liaisons ACP sans importations de démarrage du cycle de vie |
    | `plugin-sdk/agent-config-primitives` | Primitives ciblées de schéma de configuration de runtime d’agent |
    | `plugin-sdk/boolean-param` | Lecteur souple de paramètres booléens |
    | `plugin-sdk/dangerous-name-runtime` | Aides de résolution de correspondance de noms dangereux |
    | `plugin-sdk/device-bootstrap` | Aides d’amorçage d’appareil et de jetons d’association |
    | `plugin-sdk/extension-shared` | Primitives partagées d’aides de canal passif, d’état et de proxy ambiant |
    | `plugin-sdk/models-provider-runtime` | Aides de réponses pour la commande/le fournisseur `/models` |
    | `plugin-sdk/skill-commands-runtime` | Aides de listage des commandes de Skills |
    | `plugin-sdk/native-command-registry` | Aides de registre/construction/sérialisation de commandes natives |
    | `plugin-sdk/agent-harness` | Surface expérimentale de Plugin de confiance pour harnais d’agents de bas niveau : types de harnais, aides de pilotage/abandon de run actif, aides de pont d’outils OpenClaw, aides de politique d’outils de plan de runtime, classification des résultats terminaux, aides de formatage/détail de progression d’outils et utilitaires de résultat de tentative |
    | `plugin-sdk/provider-zai-endpoint` | Façade obsolète de détection de point de terminaison appartenant au fournisseur Z.AI ; utilisez l’API publique du Plugin Z.AI |
    | `plugin-sdk/async-lock-runtime` | Aide de verrou asynchrone local au processus pour les petits fichiers d’état de runtime |
    | `plugin-sdk/channel-activity-runtime` | Aide de télémétrie d’activité de canal |
    | `plugin-sdk/concurrency-runtime` | Aide de concurrence bornée des tâches asynchrones |
    | `plugin-sdk/dedupe-runtime` | Aides de cache de déduplication en mémoire |
    | `plugin-sdk/delivery-queue-runtime` | Aide de vidage des livraisons sortantes en attente |
    | `plugin-sdk/file-access-runtime` | Aides sûres de chemins de fichiers locaux et de sources média |
    | `plugin-sdk/heartbeat-runtime` | Aides de réveil, d’événement et de visibilité Heartbeat |
    | `plugin-sdk/number-runtime` | Aide de coercition numérique |
    | `plugin-sdk/secure-random-runtime` | Aides de jetons/UUID sécurisés |
    | `plugin-sdk/system-event-runtime` | Aides de file d’événements système |
    | `plugin-sdk/transport-ready-runtime` | Aide d’attente de disponibilité du transport |
    | `plugin-sdk/exec-approvals-runtime` | Aides de fichiers de politique d’approbation d’exécution sans le barrel infra-runtime général |
    | `plugin-sdk/infra-runtime` | Shim de compatibilité obsolète ; utilisez les sous-chemins de runtime ciblés ci-dessus |
    | `plugin-sdk/collection-runtime` | Petites aides de cache borné |
    | `plugin-sdk/diagnostic-runtime` | Aides d’indicateurs de diagnostic, d’événements et de contexte de trace |
    | `plugin-sdk/error-runtime` | Graphe d’erreurs, formatage, aides partagées de classification d’erreurs, `isApprovalNotFoundError` |
    | `plugin-sdk/fetch-runtime` | Fetch enveloppé, proxy, option EnvHttpProxyAgent et aides de recherche épinglée |
    | `plugin-sdk/runtime-fetch` | Fetch de runtime compatible dispatcher sans importations de proxy/fetch protégé |
    | `plugin-sdk/inline-image-data-url-runtime` | Désinfecteur d’URL de données d’image inline et aides de détection de signature sans la surface générale de runtime média |
    | `plugin-sdk/response-limit-runtime` | Lecteur borné de corps de réponse sans la surface générale de runtime média |
    | `plugin-sdk/session-binding-runtime` | État actuel de liaison de conversation sans routage de liaison configuré ni magasins d’association |
    | `plugin-sdk/session-store-runtime` | Aides de magasin de sessions sans importations générales d’écritures/maintenance de configuration |
    | `plugin-sdk/sqlite-runtime` | Aides ciblées de schéma d’agent SQLite, de chemin et de transaction sans contrôles du cycle de vie de base de données |
    | `plugin-sdk/context-visibility-runtime` | Résolution de visibilité du contexte et filtrage du contexte supplémentaire sans importations générales de configuration/sécurité |
    | `plugin-sdk/string-coerce-runtime` | Aides ciblées de coercition et de normalisation d’enregistrements primitifs/chaînes sans importations Markdown/journalisation |
    | `plugin-sdk/host-runtime` | Aides de normalisation de noms d’hôte et d’hôte SCP |
    | `plugin-sdk/retry-runtime` | Aides de configuration des nouvelles tentatives et d’exécuteur de nouvelles tentatives |
    | `plugin-sdk/agent-runtime` | Aides de répertoire/identité/espace de travail d’agent, y compris `resolveAgentDir`, `resolveDefaultAgentDir` et l’export de compatibilité obsolète `resolveOpenClawAgentDir` |
    | `plugin-sdk/directory-runtime` | Requête/déduplication de répertoire adossée à la configuration |
    | `plugin-sdk/keyed-async-queue` | `KeyedAsyncQueue` |
  </Accordion>

  <Accordion title="Sous-chemins de capacité et de test">
    | Sous-chemin | Exportations clés |
    | --- | --- |
    | `plugin-sdk/media-runtime` | Assistants partagés de récupération/transformation/stockage de médias, notamment `saveRemoteMedia`, `saveResponseMedia`, `readRemoteMediaBuffer` et `fetchRemoteMedia`, obsolète ; privilégiez les assistants de stockage avant les lectures de tampon lorsqu’une URL doit devenir un média OpenClaw |
    | `plugin-sdk/media-mime` | Normalisation MIME étroite, mappage des extensions de fichier, détection MIME et assistants de type de média |
    | `plugin-sdk/media-store` | Assistants de stockage de médias étroits tels que `saveMediaBuffer` et `saveMediaStream` |
    | `plugin-sdk/media-generation-runtime` | Assistants partagés de basculement de génération de médias, sélection de candidats et messages de modèle manquant |
    | `plugin-sdk/media-understanding` | Types de fournisseurs de compréhension des médias, plus exportations d’assistants image/audio/extraction structurée destinées aux fournisseurs |
    | `plugin-sdk/text-chunking` | Assistants de découpage/rendu de texte et de markdown, conversion de tableaux markdown, suppression de balises de directive et utilitaires de texte sûr |
    | `plugin-sdk/text-chunking` | Assistant de découpage du texte sortant |
    | `plugin-sdk/speech` | Types de fournisseurs vocaux, plus exportations destinées aux fournisseurs pour les directives, le registre, la validation, le générateur TTS compatible OpenAI et les assistants vocaux |
    | `plugin-sdk/speech-core` | Types partagés de fournisseurs vocaux, registre, directive, normalisation et exportations d’assistants vocaux |
    | `plugin-sdk/realtime-transcription` | Types de fournisseurs de transcription en temps réel, assistants de registre et assistant partagé de session WebSocket |
    | `plugin-sdk/realtime-bootstrap-context` | Assistant d’amorçage de profil en temps réel pour l’injection bornée du contexte `IDENTITY.md`, `USER.md` et `SOUL.md` |
    | `plugin-sdk/realtime-voice` | Types de fournisseurs vocaux en temps réel, assistants de registre et assistants partagés de comportement vocal en temps réel, y compris le suivi de l’activité de sortie |
    | `plugin-sdk/image-generation` | Types de fournisseurs de génération d’images, plus assistants d’URL de données/ressources d’image et générateur de fournisseur d’images compatible OpenAI |
    | `plugin-sdk/image-generation-core` | Types partagés de génération d’images, basculement, auth et assistants de registre |
    | `plugin-sdk/music-generation` | Types de fournisseurs/requêtes/résultats de génération de musique |
    | `plugin-sdk/music-generation-core` | Types partagés de génération de musique, assistants de basculement, recherche de fournisseur et analyse de références de modèle |
    | `plugin-sdk/video-generation` | Types de fournisseurs/requêtes/résultats de génération vidéo |
    | `plugin-sdk/video-generation-core` | Types partagés de génération vidéo, assistants de basculement, recherche de fournisseur et analyse de références de modèle |
    | `plugin-sdk/transcripts` | Types partagés de fournisseurs de sources de transcriptions, assistants de registre, descripteurs de session et métadonnées d’énoncé |
    | `plugin-sdk/webhook-targets` | Registre de cibles Webhook et assistants d’installation de routes |
    | `plugin-sdk/webhook-path` | Alias de compatibilité obsolète ; utilisez `plugin-sdk/webhook-ingress` |
    | `plugin-sdk/web-media` | Assistants partagés de chargement de médias distants/locaux |
    | `plugin-sdk/zod` | Réexportation de compatibilité obsolète ; importez `zod` depuis `zod` directement |
    | `plugin-sdk/testing` | Barrel de compatibilité obsolète propre au dépôt pour les anciens tests OpenClaw. Les nouveaux tests du dépôt doivent plutôt importer des sous-chemins de test locaux ciblés tels que `plugin-sdk/agent-runtime-test-contracts`, `plugin-sdk/plugin-test-runtime`, `plugin-sdk/channel-test-helpers`, `plugin-sdk/test-env` ou `plugin-sdk/test-fixtures` |
    | `plugin-sdk/plugin-test-api` | Assistant minimal `createTestPluginApi` propre au dépôt pour les tests unitaires d’enregistrement direct de Plugin sans importer de ponts d’assistants de test du dépôt |
    | `plugin-sdk/agent-runtime-test-contracts` | Fixtures de contrat d’adaptateur agent-runtime natif propres au dépôt pour les tests d’auth, de livraison, de basculement, de hooks d’outils, de superposition de prompts, de schéma et de projection de transcript |
    | `plugin-sdk/channel-test-helpers` | Assistants de test propres au dépôt orientés canal pour les contrats génériques d’actions/configuration/statut, les assertions de répertoire, le cycle de vie de démarrage de compte, l’enfilage de configuration d’envoi, les mocks de runtime, les problèmes de statut, la livraison sortante et l’enregistrement de hooks |
    | `plugin-sdk/channel-target-testing` | Suite partagée propre au dépôt de cas d’erreur de résolution de cible pour les tests de canal |
    | `plugin-sdk/plugin-test-contracts` | Assistants propres au dépôt pour les contrats de package de Plugin, d’enregistrement, d’artefact public, d’import direct, d’API runtime et d’effet de bord d’import |
    | `plugin-sdk/provider-test-contracts` | Assistants propres au dépôt pour les contrats de runtime fournisseur, auth, découverte, onboard, catalogue, assistant, capacité média, politique de relecture, audio live STT en temps réel, recherche/récupération web et flux |
    | `plugin-sdk/provider-http-test-mocks` | Mocks HTTP/auth Vitest opt-in propres au dépôt pour les tests de fournisseur qui exercent `plugin-sdk/provider-http` |
    | `plugin-sdk/test-fixtures` | Fixtures génériques propres au dépôt pour capture de runtime CLI, contexte de bac à sable, rédacteur de skill, message d’agent, événement système, rechargement de module, chemin de Plugin groupé, texte de terminal, découpage, jeton d’auth et cas typés |
    | `plugin-sdk/test-node-mocks` | Assistants ciblés de mocks des modules intégrés Node propres au dépôt pour utilisation dans les fabriques Vitest `vi.mock("node:*")` |
  </Accordion>

  <Accordion title="Sous-chemins de mémoire">
    | Sous-chemin | Exportations clés |
    | --- | --- |
    | `plugin-sdk/memory-core` | Surface d’assistants memory-core groupée pour les assistants de gestionnaire/configuration/fichier/CLI |
    | `plugin-sdk/memory-core-engine-runtime` | Façade runtime d’indexation/recherche de mémoire |
    | `plugin-sdk/memory-core-host-embedding-registry` | Assistants légers de registre de fournisseurs d’embeddings mémoire |
    | `plugin-sdk/memory-core-host-engine-foundation` | Exportations du moteur de fondation de l’hôte mémoire |
    | `plugin-sdk/memory-core-host-engine-embeddings` | Contrats d’embeddings de l’hôte mémoire, accès au registre, fournisseur local et assistants génériques par lot/distants. `registerMemoryEmbeddingProvider` sur cette surface est obsolète ; utilisez l’API générique de fournisseur d’embeddings pour les nouveaux fournisseurs. |
    | `plugin-sdk/memory-core-host-engine-qmd` | Exportations du moteur QMD de l’hôte mémoire |
    | `plugin-sdk/memory-core-host-engine-storage` | Exportations du moteur de stockage de l’hôte mémoire |
    | `plugin-sdk/memory-core-host-multimodal` | Assistants multimodaux de l’hôte mémoire |
    | `plugin-sdk/memory-core-host-query` | Assistants de requête de l’hôte mémoire |
    | `plugin-sdk/memory-core-host-secret` | Assistants de secrets de l’hôte mémoire |
    | `plugin-sdk/memory-core-host-events` | Alias de compatibilité obsolète ; utilisez `plugin-sdk/memory-host-events` |
    | `plugin-sdk/memory-core-host-status` | Assistants de statut de l’hôte mémoire |
    | `plugin-sdk/memory-core-host-runtime-cli` | Assistants de runtime CLI de l’hôte mémoire |
    | `plugin-sdk/memory-core-host-runtime-core` | Assistants de runtime cœur de l’hôte mémoire |
    | `plugin-sdk/memory-core-host-runtime-files` | Assistants de fichiers/runtime de l’hôte mémoire |
    | `plugin-sdk/memory-host-core` | Alias indépendant du fournisseur pour les assistants de runtime cœur de l’hôte mémoire |
    | `plugin-sdk/memory-host-events` | Alias indépendant du fournisseur pour les assistants de journal d’événements de l’hôte mémoire |
    | `plugin-sdk/memory-host-files` | Alias de compatibilité obsolète ; utilisez `plugin-sdk/memory-core-host-runtime-files` |
    | `plugin-sdk/memory-host-markdown` | Assistants partagés de markdown géré pour les plugins adjacents à la mémoire |
    | `plugin-sdk/memory-host-search` | Façade runtime de mémoire active pour l’accès au gestionnaire de recherche |
    | `plugin-sdk/memory-host-status` | Alias de compatibilité obsolète ; utilisez `plugin-sdk/memory-core-host-status` |
  </Accordion>

  <Accordion title="Sous-chemins réservés d’assistants groupés">
    Les sous-chemins SDK réservés d’assistants groupés sont des surfaces étroites propres aux propriétaires pour
    le code des plugins groupés. Ils sont suivis dans l’inventaire SDK afin que les builds de packages
    et la création d’alias restent déterministes, mais ce ne sont pas des API générales
    de création de plugins. Les nouveaux contrats d’hôte réutilisables doivent utiliser des sous-chemins SDK génériques
    tels que `plugin-sdk/gateway-runtime`, `plugin-sdk/security-runtime` et
    `plugin-sdk/plugin-config-runtime`.

    | Sous-chemin | Propriétaire et objectif |
    | --- | --- |
    | `plugin-sdk/codex-mcp-projection` | Assistant du Plugin Codex groupé pour projeter la configuration de serveur MCP utilisateur dans la configuration de thread app-server Codex |
    | `plugin-sdk/codex-native-task-runtime` | Assistant du Plugin Codex groupé pour refléter les sous-agents natifs app-server Codex dans l’état de tâche OpenClaw |

  </Accordion>
</AccordionGroup>

## Connexe

- [Vue d’ensemble du SDK Plugin](/fr/plugins/sdk-overview)
- [Configuration du SDK Plugin](/fr/plugins/sdk-setup)
- [Création de plugins](/fr/plugins/building-plugins)
