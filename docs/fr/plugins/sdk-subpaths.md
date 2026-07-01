---
read_when:
    - Choisir le bon sous-chemin plugin-sdk pour un import de Plugin
    - Audit des sous-chemins de Plugins intégrés et des surfaces d’assistance
summary: 'Catalogue des sous-chemins du SDK Plugin : quels imports se trouvent où, regroupés par domaine'
title: Sous-chemins du SDK Plugin
x-i18n:
    generated_at: "2026-07-01T20:19:14Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: d67ec0c9d837fa23a80abe46e5bab981e82e6c7a29cfbf84ff47a9eca5cc582f
    source_path: plugins/sdk-subpaths.md
    workflow: 16
---

Le SDK de Plugin est exposé comme un ensemble de sous-chemins publics étroits sous
`openclaw/plugin-sdk/`. Cette page répertorie les sous-chemins couramment utilisés, regroupés par
objectif. L’inventaire généré des points d’entrée du compilateur se trouve dans
`scripts/lib/plugin-sdk-entrypoints.json`; les exportations de paquet constituent le sous-ensemble public
après soustraction des sous-chemins de test/internes locaux au dépôt listés dans
`scripts/lib/plugin-sdk-private-local-only-subpaths.json`. Les mainteneurs peuvent auditer
le nombre d’exportations publiques avec `pnpm plugin-sdk:surface` et les sous-chemins
d’aides réservés actifs avec `pnpm plugins:boundary-report:summary`; les exportations
d’aides réservées inutilisées font échouer le rapport CI au lieu de rester dans le SDK public comme
dette de compatibilité dormante.

Pour le guide de création de Plugins, consultez [Présentation du SDK de Plugin](/fr/plugins/sdk-overview).

## Entrée de Plugin

| Sous-chemin                    | Exportations clés                                                                                                                                                      |
| ------------------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `plugin-sdk/plugin-entry`      | `definePluginEntry`                                                                                                                                                    |
| `plugin-sdk/core`              | `defineChannelPluginEntry`, `createChatChannelPlugin`, `createChannelPluginBase`, `defineSetupPluginEntry`, `buildChannelConfigSchema`, `buildJsonChannelConfigSchema` |
| `plugin-sdk/config-schema`     | `OpenClawSchema`                                                                                                                                                       |
| `plugin-sdk/provider-entry`    | `defineSingleProviderPluginEntry`                                                                                                                                      |
| `plugin-sdk/migration`         | Aides d’éléments de fournisseur de migration telles que `createMigrationItem`, constantes de raison, marqueurs d’état d’élément, aides de caviardage et `summarizeMigrationItems` |
| `plugin-sdk/migration-runtime` | Aides de migration à l’exécution telles que `copyMigrationFileItem`, `withCachedMigrationConfigRuntime` et `writeMigrationReport`                                      |
| `plugin-sdk/health`            | Inscription, détection, réparation, sélection, sévérité et types de constats des contrôles de santé Doctor pour les consommateurs de santé intégrés                     |

### Compatibilité obsolète et aides de test

Les sous-chemins obsolètes restent exportés pour les Plugins plus anciens, mais le nouveau code doit utiliser les
sous-chemins ciblés du SDK ci-dessous. La liste maintenue est
`scripts/lib/plugin-sdk-deprecated-public-subpaths.json`; la CI rejette les importations de production
intégrées qui en proviennent. Les barrels larges tels que `compat`, `config-types`,
`infra-runtime`, `text-runtime` et `zod` sont réservés à la compatibilité. Importez `zod`
directement depuis `zod`.

Les sous-chemins d’aides de test d’OpenClaw basés sur Vitest sont uniquement locaux au dépôt et ne sont
plus des exportations de paquet : `agent-runtime-test-contracts`,
`channel-contract-testing`, `channel-target-testing`, `channel-test-helpers`,
`plugin-test-api`, `plugin-test-contracts`, `plugin-test-runtime`,
`provider-http-test-mocks`, `provider-test-contracts`, `test-env`,
`test-fixtures`, `test-node-mocks` et `testing`.

### Sous-chemins d’aides réservés aux Plugins intégrés

Ces sous-chemins sont des surfaces de compatibilité détenues par les Plugins pour leur Plugin intégré
propriétaire, et non des API générales du SDK : `plugin-sdk/codex-mcp-projection` et
`plugin-sdk/codex-native-task-runtime`. Les importations d’extensions entre propriétaires sont bloquées
par les garde-fous du contrat de paquet.

<AccordionGroup>
  <Accordion title="Sous-chemins de canal">
    | Sous-chemin | Exports clés |
    | --- | --- |
    | `plugin-sdk/channel-core` | `defineChannelPluginEntry`, `defineSetupPluginEntry`, `createChatChannelPlugin`, `createChannelPluginBase` |
    | `plugin-sdk/config-schema` | Export du schéma Zod racine `openclaw.json` (`OpenClawSchema`) |
    | `plugin-sdk/json-schema-runtime` | Fonction d’aide à la validation JSON Schema mise en cache pour les schémas détenus par le plugin |
    | `plugin-sdk/channel-setup` | `createOptionalChannelSetupSurface`, `createOptionalChannelSetupAdapter`, `createOptionalChannelSetupWizard`, plus `DEFAULT_ACCOUNT_ID`, `createTopLevelChannelDmPolicy`, `setSetupChannelEnabled`, `splitSetupEntries` |
    | `plugin-sdk/setup` | Fonctions d’aide partagées pour l’assistant de configuration, traducteur de configuration, invites de liste d’autorisation, constructeurs de statut de configuration |
    | `plugin-sdk/setup-runtime` | `createSetupTranslator`, `createPatchedAccountSetupAdapter`, `createEnvPatchedAccountSetupAdapter`, `createSetupInputPresenceValidator`, `noteChannelLookupFailure`, `noteChannelLookupSummary`, `promptResolvedAllowFrom`, `splitSetupEntries`, `createAllowlistSetupWizardProxy`, `createDelegatedSetupWizardProxy` |
    | `plugin-sdk/setup-adapter-runtime` | Alias de compatibilité obsolète ; utilisez `plugin-sdk/setup-runtime` |
    | `plugin-sdk/setup-tools` | `formatCliCommand`, `detectBinary`, `extractArchive`, `resolveBrewExecutable`, `formatDocsLink`, `CONFIG_DIR` |
    | `plugin-sdk/account-core` | Fonctions d’aide pour la configuration multi-comptes et la porte d’action, fonctions d’aide de repli vers le compte par défaut |
    | `plugin-sdk/account-id` | `DEFAULT_ACCOUNT_ID`, fonctions d’aide à la normalisation d’identifiant de compte |
    | `plugin-sdk/account-resolution` | Fonctions d’aide à la recherche de compte et au repli par défaut |
    | `plugin-sdk/account-helpers` | Fonctions d’aide ciblées pour les listes de comptes et les actions de compte |
    | `plugin-sdk/access-groups` | Fonctions d’aide à l’analyse des listes d’autorisation de groupes d’accès et aux diagnostics de groupes expurgés |
    | `plugin-sdk/channel-pairing` | `createChannelPairingController` |
    | `plugin-sdk/channel-reply-pipeline` | Façade de compatibilité obsolète. Utilisez `plugin-sdk/channel-outbound`. |
    | `plugin-sdk/channel-config-helpers` | `createHybridChannelConfigAdapter`, `resolveChannelDmAccess`, `resolveChannelDmAllowFrom`, `resolveChannelDmPolicy`, `normalizeChannelDmPolicy`, `normalizeLegacyDmAliases` |
    | `plugin-sdk/channel-config-schema` | Primitives partagées de schéma de configuration de canal, plus constructeurs Zod et JSON/TypeBox directs |
    | `plugin-sdk/bundled-channel-config-schema` | Schémas de configuration de canal OpenClaw groupés, uniquement pour les plugins groupés maintenus |
    | `plugin-sdk/chat-channel-ids` | `BUNDLED_CHAT_CHANNEL_IDS`, `BUNDLED_CHAT_CHANNEL_ENVELOPE_PREFIXES`, `ChatChannelId`. Identifiants canoniques de canaux de discussion groupés/officiels, plus libellés/alias de formateur pour les plugins qui doivent reconnaître du texte préfixé par une enveloppe sans coder en dur leur propre table. |
    | `plugin-sdk/channel-config-schema-legacy` | Alias de compatibilité obsolète pour les schémas de configuration de canal groupés |
    | `plugin-sdk/telegram-command-config` | Fonctions d’aide à la normalisation/validation des commandes personnalisées Telegram avec repli sur le contrat groupé |
    | `plugin-sdk/command-gating` | Fonctions d’aide ciblées pour la porte d’autorisation des commandes |
    | `plugin-sdk/channel-policy` | `resolveChannelGroupRequireMention` |
    | `plugin-sdk/channel-ingress` | Façade de compatibilité obsolète pour l’entrée de canal bas niveau. Les nouveaux chemins de réception doivent utiliser `plugin-sdk/channel-ingress-runtime`. |
    | `plugin-sdk/channel-ingress-runtime` | Résolveur expérimental de runtime d’entrée de canal haut niveau et constructeurs de faits de routage pour les chemins de réception de canal migrés. Préférez-le à l’assemblage des listes d’autorisation effectives, listes d’autorisation de commandes et projections héritées dans chaque plugin. Voir [API d’entrée de canal](/fr/plugins/sdk-channel-ingress). |
    | `plugin-sdk/channel-lifecycle` | Façade de compatibilité obsolète. Utilisez `plugin-sdk/channel-outbound`. |
    | `plugin-sdk/channel-outbound` | Contrats de cycle de vie des messages, plus options de pipeline de réponse, reçus, aperçu/streaming en direct, fonctions d’aide au cycle de vie, identité sortante, planification des payloads, envois durables et fonctions d’aide au contexte d’envoi de message. Voir [API sortante de canal](/fr/plugins/sdk-channel-outbound). |
    | `plugin-sdk/channel-message` | Alias de compatibilité obsolète pour `plugin-sdk/channel-outbound`, plus façades héritées de distribution des réponses. |
    | `plugin-sdk/channel-message-runtime` | Alias de compatibilité obsolète pour `plugin-sdk/channel-outbound`, plus façades héritées de distribution des réponses. |
    | `plugin-sdk/inbound-envelope` | Fonctions d’aide partagées pour la route entrante et la construction d’enveloppes |
    | `plugin-sdk/inbound-reply-dispatch` | Façade de compatibilité obsolète. Utilisez `plugin-sdk/channel-inbound` pour les exécuteurs entrants et les prédicats de distribution, et `plugin-sdk/channel-outbound` pour les fonctions d’aide à la livraison des messages. |
    | `plugin-sdk/messaging-targets` | Alias obsolète d’analyse des cibles ; utilisez `plugin-sdk/channel-targets` |
    | `plugin-sdk/outbound-media` | Fonctions d’aide partagées pour le chargement des médias sortants et l’état des médias hébergés |
    | `plugin-sdk/outbound-send-deps` | Façade de compatibilité obsolète. Utilisez `plugin-sdk/channel-outbound`. |
    | `plugin-sdk/outbound-runtime` | Façade de compatibilité obsolète. Utilisez `plugin-sdk/channel-outbound`. |
    | `plugin-sdk/poll-runtime` | Fonctions d’aide ciblées pour la normalisation des sondages |
    | `plugin-sdk/thread-bindings-runtime` | Fonctions d’aide au cycle de vie et aux adaptateurs des liaisons de fils |
    | `plugin-sdk/agent-media-payload` | Constructeur hérité de payload média d’agent |
    | `plugin-sdk/conversation-runtime` | Fonctions d’aide pour les liaisons de conversation/fil, l’appariement et les liaisons configurées |
    | `plugin-sdk/runtime-config-snapshot` | Fonction d’aide à l’instantané de configuration du runtime |
    | `plugin-sdk/runtime-group-policy` | Fonctions d’aide à la résolution des politiques de groupe du runtime |
    | `plugin-sdk/channel-status` | Fonctions d’aide partagées pour les instantanés/résumés de statut de canal |
    | `plugin-sdk/channel-config-primitives` | Primitives ciblées de schéma de configuration de canal |
    | `plugin-sdk/channel-config-writes` | Fonctions d’aide à l’autorisation des écritures de configuration de canal |
    | `plugin-sdk/channel-plugin-common` | Exports partagés du préambule des plugins de canal |
    | `plugin-sdk/allowlist-config-edit` | Fonctions d’aide à la lecture/modification de la configuration de liste d’autorisation |
    | `plugin-sdk/group-access` | Fonctions d’aide partagées pour les décisions d’accès aux groupes |
    | `plugin-sdk/direct-dm`, `plugin-sdk/direct-dm-access` | Façades de compatibilité obsolètes. Utilisez `plugin-sdk/channel-inbound`. |
    | `plugin-sdk/direct-dm-guard-policy` | Fonctions d’aide ciblées pour la politique de garde direct-DM pré-crypto |
    | `plugin-sdk/discord` | Façade de compatibilité Discord obsolète pour `@openclaw/discord@2026.3.13` publié et la compatibilité suivie côté propriétaire ; les nouveaux plugins doivent utiliser les sous-chemins SDK de canal génériques |
    | `plugin-sdk/telegram-account` | Façade de compatibilité obsolète de résolution de compte Telegram pour la compatibilité suivie côté propriétaire ; les nouveaux plugins doivent utiliser les fonctions d’aide injectées du runtime ou les sous-chemins SDK de canal génériques |
    | `plugin-sdk/zalouser` | Façade de compatibilité Zalo Personal obsolète pour les paquets Lark/Zalo publiés qui importent encore l’autorisation des commandes d’expéditeur ; les nouveaux plugins doivent utiliser `plugin-sdk/command-auth` |
    | `plugin-sdk/interactive-runtime` | Présentation, livraison et fonctions d’aide héritées pour les réponses interactives de messages sémantiques. Voir [Présentation des messages](/fr/plugins/message-presentation) |
    | `plugin-sdk/channel-inbound` | Fonctions d’aide entrantes partagées pour la classification d’événements, la construction de contexte, le formatage, les racines, le debounce, la correspondance de mentions, la politique de mention et la journalisation entrante |
    | `plugin-sdk/channel-inbound-debounce` | Fonctions d’aide ciblées pour le debounce entrant |
    | `plugin-sdk/channel-mention-gating` | Fonctions d’aide ciblées pour la politique de mention, les marqueurs de mention et le texte de mention, sans la surface plus large du runtime entrant |
    | `plugin-sdk/channel-envelope`, `plugin-sdk/channel-inbound-roots`, `plugin-sdk/channel-location`, `plugin-sdk/channel-logging` | Façades de compatibilité obsolètes. Utilisez `plugin-sdk/channel-inbound` ou `plugin-sdk/channel-outbound`. |
    | `plugin-sdk/channel-pairing-paths` | Façade de compatibilité obsolète. Utilisez `plugin-sdk/channel-pairing`. |
    | `plugin-sdk/channel-reply-options-runtime` | Façade de compatibilité obsolète. Utilisez `plugin-sdk/channel-outbound`. |
    | `plugin-sdk/channel-streaming` | Façade de compatibilité obsolète. Utilisez `plugin-sdk/channel-outbound`. |
    | `plugin-sdk/channel-send-result` | Types de résultat de réponse |
    | `plugin-sdk/channel-actions` | Fonctions d’aide aux actions de message de canal, plus fonctions d’aide de schéma natif obsolètes conservées pour la compatibilité des plugins |
    | `plugin-sdk/channel-route` | Fonctions d’aide partagées pour la normalisation des routes, la résolution de cibles pilotée par analyseur, la conversion d’identifiants de fil en chaînes, les clés de route dédupliquées/compactes, les types de cible analysée et la comparaison de routes/cibles |
    | `plugin-sdk/channel-targets` | Fonctions d’aide à l’analyse des cibles ; les appelants de comparaison de routes doivent utiliser `plugin-sdk/channel-route` |
    | `plugin-sdk/channel-contract` | Types de contrat de canal |
    | `plugin-sdk/channel-feedback` | Câblage des retours/réactions |
    | `plugin-sdk/channel-secret-runtime` | Fonctions d’aide ciblées pour le contrat de secrets, comme `collectSimpleChannelFieldAssignments`, `getChannelSurface`, `pushAssignment` et les types de cible de secret |
  </Accordion>

Les familles obsolètes de fonctions d’aide de canal restent disponibles
uniquement pour la compatibilité avec les plugins publiés. Le plan de
suppression est le suivant : les conserver pendant la fenêtre de migration
des plugins externes, maintenir les plugins du dépôt/groupés sur
`channel-inbound` et `channel-outbound`, puis supprimer les sous-chemins de
compatibilité lors du prochain grand nettoyage du SDK. Cela s’applique aux
anciennes familles message/runtime de canal, streaming de canal, accès
direct-DM, éclatement des fonctions d’aide entrantes, options de réponse
et chemins d’appariement.

  <Accordion title="Sous-chemins des fournisseurs">
    | Sous-chemin | Exports clés |
    | --- | --- |
    | `plugin-sdk/provider-entry` | `defineSingleProviderPluginEntry` |
    | `plugin-sdk/lmstudio` | Façade de fournisseur LM Studio prise en charge pour la configuration, la découverte du catalogue et la préparation des modèles à l’exécution |
    | `plugin-sdk/lmstudio-runtime` | Façade d’exécution LM Studio prise en charge pour les valeurs par défaut du serveur local, la découverte des modèles, les en-têtes de requête et les helpers de modèles chargés |
    | `plugin-sdk/provider-setup` | Helpers sélectionnés de configuration de fournisseurs locaux/auto-hébergés |
    | `plugin-sdk/self-hosted-provider-setup` | Helpers ciblés de configuration de fournisseurs auto-hébergés compatibles avec OpenAI |
    | `plugin-sdk/cli-backend` | Valeurs par défaut du backend CLI + constantes de watchdog |
    | `plugin-sdk/provider-auth-runtime` | Helpers de résolution de clés d’API à l’exécution pour les plugins de fournisseur |
    | `plugin-sdk/provider-oauth-runtime` | Types génériques de rappel OAuth de fournisseur, rendu de page de rappel, helpers PKCE/état, analyse des entrées d’autorisation, helpers d’expiration des jetons et helpers d’abandon |
    | `plugin-sdk/provider-auth-api-key` | Helpers d’intégration/decriture de profil par clé d’API, comme `upsertApiKeyProfile` |
    | `plugin-sdk/provider-auth-result` | Générateur standard de résultat d’authentification OAuth |
    | `plugin-sdk/provider-env-vars` | Helpers de recherche des variables d’environnement d’authentification de fournisseur |
    | `plugin-sdk/provider-auth` | `createProviderApiKeyAuthMethod`, `ensureApiKeyFromOptionEnvOrPrompt`, `upsertAuthProfile`, `upsertApiKeyProfile`, `writeOAuthCredentials`, helpers d’import d’authentification OpenAI Codex, export de compatibilité obsolète `resolveOpenClawAgentDir` |
    | `plugin-sdk/provider-model-shared` | `ProviderReplayFamily`, `buildProviderReplayFamilyHooks`, `normalizeModelCompat`, générateurs partagés de politiques de replay, helpers de points de terminaison de fournisseur et helpers partagés de normalisation d’ID de modèle |
    | `plugin-sdk/provider-catalog-live-runtime` | Helpers de catalogue de modèles de fournisseur en direct pour la découverte protégée de type `/models` : `buildLiveModelProviderConfig`, `fetchLiveProviderModelRows`, `getCachedLiveProviderModelRows`, `fetchLiveProviderModelIds`, `LiveModelCatalogHttpError`, `clearLiveCatalogCacheForTests`, filtrage des ID de modèle, cache TTL et fallback statique |
    | `plugin-sdk/provider-catalog-runtime` | Hook d’exécution d’augmentation du catalogue de fournisseurs et jonctions de registre plugin-fournisseur pour les tests de contrat |
    | `plugin-sdk/provider-catalog-shared` | `findCatalogTemplate`, `buildSingleProviderApiKeyCatalog`, `buildManifestModelProviderConfig`, `supportsNativeStreamingUsageCompat`, `applyProviderNativeStreamingUsageCompat` |
    | `plugin-sdk/provider-http` | Helpers génériques de capacités HTTP/points de terminaison de fournisseur, erreurs HTTP de fournisseur et helpers de formulaire multipart de transcription audio |
    | `plugin-sdk/provider-web-fetch-contract` | Helpers ciblés de contrat de configuration/sélection web-fetch, comme `enablePluginInConfig` et `WebFetchProviderPlugin` |
    | `plugin-sdk/provider-web-fetch` | Helpers d’enregistrement/cache de fournisseur web-fetch |
    | `plugin-sdk/provider-web-search-config-contract` | Helpers ciblés de configuration/identifiants web-search pour les fournisseurs qui n’ont pas besoin de câblage d’activation de Plugin |
    | `plugin-sdk/provider-web-search-contract` | Helpers ciblés de contrat de configuration/identifiants web-search, comme `createWebSearchProviderContractFields`, `enablePluginInConfig`, `resolveProviderWebSearchPluginConfig` et accesseurs scoped d’identifiants |
    | `plugin-sdk/provider-web-search` | Helpers d’enregistrement/cache/exécution de fournisseur web-search |
    | `plugin-sdk/embedding-providers` | Types généraux de fournisseurs d’embeddings et helpers de lecture, notamment `EmbeddingProviderAdapter`, `getEmbeddingProvider(...)` et `listEmbeddingProviders(...)` ; les plugins enregistrent les fournisseurs via `api.registerEmbeddingProvider(...)` afin que la propriété du manifeste soit appliquée |
    | `plugin-sdk/provider-tools` | `ProviderToolCompatFamily`, `buildProviderToolCompatFamilyHooks` et nettoyage de schéma + diagnostics DeepSeek/Gemini/OpenAI |
    | `plugin-sdk/provider-usage` | Types d’instantanés d’utilisation de fournisseur, helpers partagés de récupération d’utilisation et récupérateurs de fournisseur comme `fetchClaudeUsage` |
    | `plugin-sdk/provider-stream` | `ProviderStreamFamily`, `buildProviderStreamFamilyHooks`, `composeProviderStreamWrappers`, types de wrappers de flux, compatibilité des appels d’outils en texte brut et helpers de wrappers partagés Anthropic/Bedrock/DeepSeek V4/Google/Kilocode/Moonshot/OpenAI/OpenRouter/Z.A.I/MiniMax/Copilot |
    | `plugin-sdk/provider-stream-shared` | Helpers publics partagés de wrappers de flux de fournisseur, notamment `composeProviderStreamWrappers`, `createOpenAICompatibleCompletionsThinkingOffWrapper`, `createPlainTextToolCallCompatWrapper`, `createPayloadPatchStreamWrapper`, `createToolStreamWrapper`, `normalizeOpenAICompatibleReasoningPayload`, `setQwenChatTemplateThinking` et utilitaires de flux compatibles Anthropic/DeepSeek/OpenAI |
    | `plugin-sdk/provider-transport-runtime` | Helpers de transport natif de fournisseur, comme la récupération protégée, l’extraction du texte des résultats d’outils, les transformations de messages de transport et les flux d’événements de transport inscriptibles |
    | `plugin-sdk/provider-onboard` | Helpers de correctifs de configuration d’intégration |
    | `plugin-sdk/global-singleton` | Helpers de singletons/maps/caches locaux au processus |
    | `plugin-sdk/group-activation` | Helpers ciblés de mode d’activation de groupe et d’analyse de commandes |
  </Accordion>

Les instantanés d’utilisation des fournisseurs signalent normalement une ou plusieurs `windows` de quota, chacune avec
un libellé, un pourcentage utilisé et une heure de réinitialisation facultative. Les fournisseurs qui exposent du texte de solde ou
d’état de compte au lieu de fenêtres de quota réinitialisables doivent renvoyer
`summary` avec un tableau `windows` vide plutôt que de fabriquer des pourcentages.
OpenClaw affiche ce texte de résumé dans la sortie d’état ; utilisez `error` uniquement lorsque
le point de terminaison d’utilisation a échoué ou n’a renvoyé aucune donnée d’utilisation exploitable.

  <Accordion title="Sous-chemins d’authentification et de sécurité">
    | Sous-chemin | Exports clés |
    | --- | --- |
    | `plugin-sdk/command-auth` | `resolveControlCommandGate`, helpers de registre de commandes incluant la mise en forme dynamique des menus d’arguments, helpers d’autorisation de l’expéditeur |
    | `plugin-sdk/command-status` | Générateurs de messages de commande/aide, comme `buildCommandsMessagePaginated` et `buildHelpMessage` |
    | `plugin-sdk/approval-auth-runtime` | Helpers de résolution d’approbateur et d’authentification d’action dans le même chat |
    | `plugin-sdk/approval-client-runtime` | Helpers de profils/filtres d’approbation d’exécution native |
    | `plugin-sdk/approval-delivery-runtime` | Adaptateurs natifs de capacité/livraison d’approbation |
    | `plugin-sdk/approval-gateway-runtime` | Helper partagé de résolution du Gateway d’approbation |
    | `plugin-sdk/approval-handler-adapter-runtime` | Helpers légers de chargement d’adaptateur d’approbation native pour les points d’entrée de canal à chaud |
    | `plugin-sdk/approval-handler-runtime` | Helpers d’exécution plus larges pour les gestionnaires d’approbation ; préférez les jonctions adaptateur/Gateway plus ciblées lorsqu’elles suffisent |
    | `plugin-sdk/approval-native-runtime` | Helpers de cible d’approbation native, liaison de compte, garde de route, fallback de transfert et suppression de prompt d’exécution native locale |
    | `plugin-sdk/approval-reaction-runtime` | Liaisons de réactions d’approbation codées en dur, charges utiles de prompt de réaction, magasins de cibles de réaction et export de compatibilité pour la suppression de prompt d’exécution native locale |
    | `plugin-sdk/approval-reply-runtime` | Helpers de charges utiles de réponse d’approbation d’exécution/Plugin |
    | `plugin-sdk/approval-runtime` | Helpers de charges utiles d’approbation d’exécution/Plugin, helpers de routage/exécution d’approbation native et helpers d’affichage structuré d’approbation comme `formatApprovalDisplayPath` |
    | `plugin-sdk/reply-dedupe` | Helpers ciblés de réinitialisation de déduplication des réponses entrantes |
    | `plugin-sdk/channel-contract-testing` | Helpers ciblés de tests de contrat de canal sans le large barrel de test |
    | `plugin-sdk/command-auth-native` | Authentification de commande native, mise en forme dynamique des menus d’arguments et helpers natifs de cible de session |
    | `plugin-sdk/command-detection` | Helpers partagés de détection de commandes |
    | `plugin-sdk/command-primitives-runtime` | Prédicats légers de texte de commande pour les chemins de canal à chaud |
    | `plugin-sdk/command-surface` | Normalisation du corps de commande et helpers de surface de commande |
    | `plugin-sdk/allow-from` | `formatAllowFromLowercase` |
    | `plugin-sdk/provider-auth-login-flow-runtime` | Helpers paresseux de flux de connexion d’authentification de fournisseur pour l’association par code d’appareil entre canal privé et interface Web |
    | `plugin-sdk/channel-secret-runtime` | Helpers ciblés de collecte de contrats de secrets pour les surfaces de secrets de canal/Plugin |
    | `plugin-sdk/secret-ref-runtime` | Helpers ciblés de typage `coerceSecretRef` et SecretRef pour l’analyse de contrats de secrets/configuration |
    | `plugin-sdk/secret-provider-integration` | Manifeste d’intégration de fournisseur SecretRef en types uniquement et contrats de préréglages pour les plugins qui publient des préréglages de fournisseurs de secrets externes |
    | `plugin-sdk/security-runtime` | Helpers partagés de confiance, filtrage des DM, fichiers/chemins bornés à la racine incluant les écritures en création seule, le remplacement atomique de fichiers synchrone/asynchrone, les écritures temporaires voisines, le fallback de déplacement entre appareils, les helpers de stockage de fichiers privés, les protections de parents de liens symboliques, le contenu externe, la rédaction de texte sensible, la comparaison de secrets en temps constant et les helpers de collecte de secrets |
    | `plugin-sdk/ssrf-policy` | Helpers de liste d’autorisation d’hôtes et de politique SSRF de réseau privé |
    | `plugin-sdk/ssrf-dispatcher` | Helpers ciblés de dispatcher épinglé sans la large surface d’exécution d’infrastructure |
    | `plugin-sdk/ssrf-runtime` | Dispatcher épinglé, récupération protégée contre la SSRF, erreur SSRF et helpers de politique SSRF |
    | `plugin-sdk/secret-input` | Helpers d’analyse de saisie de secret |
    | `plugin-sdk/webhook-ingress` | Helpers de requête/cible Webhook et coercition brute websocket/corps |
    | `plugin-sdk/webhook-request-guards` | Helpers de taille/timeout de corps de requête |
  </Accordion>

  <Accordion title="Sous-chemins de runtime et de stockage">
    | Sous-chemin | Exports clés |
    | --- | --- |
    | `plugin-sdk/runtime` | Assistants généraux de runtime, journalisation, sauvegarde et installation de plugins |
    | `plugin-sdk/runtime-env` | Assistants ciblés pour l’environnement de runtime, le journaliseur, les délais d’expiration, les nouvelles tentatives et le backoff |
    | `plugin-sdk/browser-config` | Façade de configuration de navigateur prise en charge pour les profils/valeurs par défaut normalisés, l’analyse des URL CDP et les assistants d’authentification de contrôle du navigateur |
    | `plugin-sdk/agent-harness-task-runtime` | Assistants génériques de cycle de vie des tâches et de livraison de complétion pour les agents appuyés par un harness utilisant une portée de tâche émise par l’hôte |
    | `plugin-sdk/codex-mcp-projection` | Assistant Codex groupé réservé pour projeter la configuration de serveur MCP utilisateur dans la configuration de thread Codex ; pas pour les plugins tiers |
    | `plugin-sdk/codex-native-task-runtime` | Assistant Codex groupé privé pour le câblage du miroir/runtime de tâche native ; pas pour les plugins tiers |
    | `plugin-sdk/channel-runtime-context` | Assistants génériques d’enregistrement et de recherche de contexte de runtime de canal |
    | `plugin-sdk/matrix` | Façade de compatibilité Matrix obsolète pour les anciens packages de canal tiers ; les nouveaux plugins doivent importer `plugin-sdk/run-command` directement |
    | `plugin-sdk/mattermost` | Façade de compatibilité Mattermost obsolète pour les anciens packages de canal tiers ; les nouveaux plugins doivent importer directement les sous-chemins génériques du SDK |
    | `plugin-sdk/runtime-store` | `createPluginRuntimeStore` |
    | `plugin-sdk/plugin-runtime` | Assistants partagés pour commandes, hooks, HTTP et interactions de plugin |
    | `plugin-sdk/hook-runtime` | Assistants partagés de pipeline de webhook/hook interne |
    | `plugin-sdk/lazy-runtime` | Assistants d’importation/liaison paresseuse de runtime tels que `createLazyRuntimeModule`, `createLazyRuntimeMethod` et `createLazyRuntimeSurface` |
    | `plugin-sdk/process-runtime` | Assistants d’exécution de processus |
    | `plugin-sdk/cli-runtime` | Assistants de formatage CLI, attente, version, invocation d’arguments et groupes de commandes paresseux |
    | `plugin-sdk/qa-live-transport-scenarios` | Identifiants partagés de scénarios QA de transport en direct, assistants de couverture de référence et assistant de sélection de scénario |
    | `plugin-sdk/gateway-method-runtime` | Assistant réservé de dispatch de méthode Gateway pour les routes HTTP de plugin qui déclarent `contracts.gatewayMethodDispatch: ["authenticated-request"]` |
    | `plugin-sdk/gateway-runtime` | Client Gateway, assistant de démarrage de client prêt pour la boucle d’événements, RPC CLI Gateway, erreurs de protocole Gateway, résolution de l’hôte LAN annoncé et assistants de correctif d’état de canal |
    | `plugin-sdk/config-contracts` | Surface de configuration ciblée, uniquement typée, pour les formes de configuration de plugin telles que `OpenClawConfig` et les types de configuration de canal/fournisseur |
    | `plugin-sdk/plugin-config-runtime` | Assistants de recherche de configuration de plugin à l’exécution tels que `requireRuntimeConfig`, `resolvePluginConfigObject` et `resolveLivePluginConfigObject` |
    | `plugin-sdk/config-mutation` | Assistants de mutation transactionnelle de configuration tels que `mutateConfigFile`, `replaceConfigFile` et `logConfigUpdated` |
    | `plugin-sdk/message-tool-delivery-hints` | Chaînes partagées d’indices de métadonnées de livraison d’outils de message |
    | `plugin-sdk/runtime-config-snapshot` | Assistants d’instantané de configuration du processus courant tels que `getRuntimeConfig`, `getRuntimeConfigSnapshot` et les setters d’instantané de test |
    | `plugin-sdk/telegram-command-config` | Normalisation des noms/descriptions de commandes Telegram et vérifications de doublons/conflits, même lorsque la surface de contrat Telegram groupée est indisponible |
    | `plugin-sdk/text-autolink-runtime` | Détection d’autolien de référence de fichier sans le barrel texte général |
    | `plugin-sdk/approval-reaction-runtime` | Liaisons codées en dur de réactions d’approbation, charges utiles d’invite de réaction, magasins de cibles de réaction et export de compatibilité pour la suppression locale de l’invite d’exécution native |
    | `plugin-sdk/approval-runtime` | Assistants d’approbation exec/plugin, constructeurs de capacités d’approbation, assistants d’authentification/profil, assistants de routage/runtime natifs et formatage du chemin d’affichage d’approbation structurée |
    | `plugin-sdk/reply-runtime` | Assistants partagés de runtime entrant/réponse, découpage, dispatch, Heartbeat, planificateur de réponse |
    | `plugin-sdk/reply-dispatch-runtime` | Assistants ciblés de dispatch/finalisation de réponse et d’étiquettes de conversation |
    | `plugin-sdk/reply-history` | Assistants partagés d’historique de réponse à fenêtre courte. Le nouveau code de tour de message doit utiliser `createChannelHistoryWindow` ; les assistants de map de plus bas niveau restent uniquement des exports de compatibilité obsolètes |
    | `plugin-sdk/reply-reference` | `createReplyReferencePlanner` |
    | `plugin-sdk/reply-chunking` | Assistants ciblés de découpage texte/markdown |
    | `plugin-sdk/session-store-runtime` | Assistants de workflow de session (`getSessionEntry`, `listSessionEntries`, `patchSessionEntry`, `upsertSessionEntry`), lectures bornées du texte récent de transcript utilisateur/assistant par identité de session, assistants de chemin de magasin de session hérité/clé de session, lectures updated-at et assistants de compatibilité transitoires pour magasin entier/chemin de fichier |
    | `plugin-sdk/session-transcript-runtime` | Identité de transcript, assistants de cible/lecture/écriture scopés, publication de mises à jour, verrous d’écriture et clés de correspondance mémoire de transcript |
    | `plugin-sdk/sqlite-runtime` | Assistants ciblés de schéma d’agent SQLite, chemin et transaction pour le runtime propriétaire |
    | `plugin-sdk/cron-store-runtime` | Assistants de chemin/chargement/enregistrement du magasin Cron |
    | `plugin-sdk/state-paths` | Assistants de chemins de répertoire d’état/OAuth |
    | `plugin-sdk/plugin-state-runtime` | Types d’état clé SQLite sidecar de plugin, avec pragma de connexion centralisé et configuration de maintenance WAL pour les bases de données détenues par le plugin |
    | `plugin-sdk/routing` | Assistants de liaison route/clé de session/compte tels que `resolveAgentRoute`, `buildAgentSessionKey` et `resolveDefaultAgentBoundAccountId` |
    | `plugin-sdk/status-helpers` | Assistants partagés de résumé d’état de canal/compte, valeurs par défaut d’état de runtime et assistants de métadonnées de ticket |
    | `plugin-sdk/target-resolver-runtime` | Assistants partagés de résolution de cible |
    | `plugin-sdk/string-normalization-runtime` | Assistants de normalisation de slug/chaîne |
    | `plugin-sdk/request-url` | Extraction d’URL chaîne depuis des entrées de type fetch/request |
    | `plugin-sdk/run-command` | Lanceur de commandes temporisé avec résultats stdout/stderr normalisés |
    | `plugin-sdk/param-readers` | Lecteurs de paramètres courants pour outils/CLI |
    | `plugin-sdk/tool-plugin` | Définir un plugin d’outil d’agent typé simple et exposer des métadonnées statiques pour la génération de manifeste |
    | `plugin-sdk/tool-payload` | Extraction de charges utiles normalisées depuis des objets de résultat d’outil |
    | `plugin-sdk/tool-send` | Extraction des champs canoniques de cible d’envoi depuis les arguments d’outil |
    | `plugin-sdk/sandbox` | Types de backend de bac à sable et assistants de commandes SSH/OpenShell, y compris le précontrôle de commande exec à échec rapide |
    | `plugin-sdk/temp-path` | Assistants partagés de chemins de téléchargement temporaire et espaces de travail temporaires sécurisés privés |
    | `plugin-sdk/logging-core` | Journaliseur de sous-système et assistants de masquage |
    | `plugin-sdk/markdown-table-runtime` | Assistants de mode tableau Markdown et de conversion |
    | `plugin-sdk/model-session-runtime` | Assistants de substitution modèle/session tels que `applyModelOverrideToSessionEntry` et `resolveAgentMaxConcurrent` |
    | `plugin-sdk/talk-config-runtime` | Assistants de résolution de configuration de fournisseur Talk |
    | `plugin-sdk/json-store` | Petits assistants de lecture/écriture d’état JSON |
    | `plugin-sdk/json-unsafe-integers` | Assistants d’analyse JSON qui préservent les littéraux entiers non sûrs sous forme de chaînes |
    | `plugin-sdk/file-lock` | Assistants de verrou de fichier réentrant |
    | `plugin-sdk/persistent-dedupe` | Assistants de cache de déduplication adossé au disque |
    | `plugin-sdk/acp-runtime` | Assistants de runtime/session ACP et de dispatch de réponse |
    | `plugin-sdk/acp-runtime-backend` | Assistants légers d’enregistrement de backend ACP et de dispatch de réponse pour les plugins chargés au démarrage |
    | `plugin-sdk/acp-binding-resolve-runtime` | Résolution de liaison ACP en lecture seule sans importations de démarrage de cycle de vie |
    | `plugin-sdk/agent-config-primitives` | Primitives ciblées de schéma de configuration du runtime d’agent |
    | `plugin-sdk/boolean-param` | Lecteur permissif de paramètre booléen |
    | `plugin-sdk/dangerous-name-runtime` | Assistants de résolution de correspondance de noms dangereux |
    | `plugin-sdk/device-bootstrap` | Assistants d’amorçage d’appareil et de jeton d’appairage |
    | `plugin-sdk/extension-shared` | Primitives partagées d’assistants pour canal passif, état et proxy ambiant |
    | `plugin-sdk/models-provider-runtime` | Assistants de réponse pour commande/fournisseur `/models` |
    | `plugin-sdk/skill-commands-runtime` | Assistants de liste de commandes Skill |
    | `plugin-sdk/native-command-registry` | Assistants de registre/construction/sérialisation de commandes natives |
    | `plugin-sdk/agent-harness` | Surface expérimentale de plugin approuvé pour harnesses d’agent de bas niveau : types de harness, assistants de pilotage/abandon d’exécution active, assistants de pont d’outils OpenClaw, assistants de stratégie d’outils de plan de runtime, classification des résultats terminaux, assistants de formatage/détail de progression d’outil et utilitaires de résultat de tentative |
    | `plugin-sdk/provider-zai-endpoint` | Façade obsolète de détection d’endpoint détenue par le fournisseur Z.AI ; utilisez l’API publique du plugin Z.AI |
    | `plugin-sdk/async-lock-runtime` | Assistant de verrou asynchrone local au processus pour les petits fichiers d’état de runtime |
    | `plugin-sdk/channel-activity-runtime` | Assistant de télémétrie d’activité de canal |
    | `plugin-sdk/concurrency-runtime` | Assistant de concurrence de tâches asynchrones bornée |
    | `plugin-sdk/dedupe-runtime` | Assistants de cache de déduplication en mémoire |
    | `plugin-sdk/delivery-queue-runtime` | Assistant de vidange des livraisons sortantes en attente |
    | `plugin-sdk/file-access-runtime` | Assistants de chemins sûrs pour fichiers locaux et sources média |
    | `plugin-sdk/heartbeat-runtime` | Assistants de réveil, événement et visibilité Heartbeat |
    | `plugin-sdk/number-runtime` | Assistant de coercition numérique |
    | `plugin-sdk/secure-random-runtime` | Assistants de jeton/UUID sécurisés |
    | `plugin-sdk/system-event-runtime` | Assistants de file d’événements système |
    | `plugin-sdk/transport-ready-runtime` | Assistant d’attente de disponibilité du transport |
    | `plugin-sdk/exec-approvals-runtime` | Assistants de fichier de stratégie d’approbation exec sans le barrel infra-runtime général |
    | `plugin-sdk/infra-runtime` | Shim de compatibilité obsolète ; utilisez les sous-chemins de runtime ciblés ci-dessus |
    | `plugin-sdk/collection-runtime` | Petits assistants de cache borné |
    | `plugin-sdk/diagnostic-runtime` | Assistants d’indicateur de diagnostic, événement et contexte de trace |
    | `plugin-sdk/error-runtime` | Graphe d’erreurs, formatage, assistants partagés de classification d’erreurs, `isApprovalNotFoundError` |
    | `plugin-sdk/fetch-runtime` | Fetch enveloppé, proxy, option EnvHttpProxyAgent et assistants de recherche épinglée |
    | `plugin-sdk/runtime-fetch` | Fetch de runtime compatible dispatcher sans importations de proxy/guarded-fetch |
    | `plugin-sdk/inline-image-data-url-runtime` | Nettoyeur d’URL de données d’image inline et assistants de détection de signature sans la surface générale de runtime média |
    | `plugin-sdk/response-limit-runtime` | Lecteur borné de corps de réponse sans la surface générale de runtime média |
    | `plugin-sdk/session-binding-runtime` | État de liaison de conversation courant sans routage de liaison configuré ni magasins d’appairage |
    | `plugin-sdk/session-store-runtime` | Assistants de magasin de session sans importations générales d’écritures/maintenance de configuration |
    | `plugin-sdk/sqlite-runtime` | Assistants ciblés de schéma d’agent SQLite, chemin et transaction sans contrôles de cycle de vie de base de données |
    | `plugin-sdk/context-visibility-runtime` | Résolution de visibilité du contexte et filtrage de contexte supplémentaire sans importations générales de configuration/sécurité |
    | `plugin-sdk/string-coerce-runtime` | Assistants ciblés de coercition et normalisation de primitive, enregistrement et chaîne sans importations markdown/journalisation |
    | `plugin-sdk/host-runtime` | Assistants de normalisation de nom d’hôte et d’hôte SCP |
    | `plugin-sdk/retry-runtime` | Assistants de configuration de nouvelle tentative et lanceur de nouvelles tentatives |
    | `plugin-sdk/agent-runtime` | Assistants de répertoire, identité et espace de travail d’agent, y compris `resolveAgentDir`, `resolveDefaultAgentDir` et l’export de compatibilité obsolète `resolveOpenClawAgentDir` |
    | `plugin-sdk/directory-runtime` | Requête/déduplication de répertoire adossée à la configuration |
    | `plugin-sdk/keyed-async-queue` | `KeyedAsyncQueue` |
  </Accordion>

  <Accordion title="Sous-chemins de capacités et de test">
    | Sous-chemin | Exports clés |
    | --- | --- |
    | `plugin-sdk/media-runtime` | Assistants partagés de récupération/transformation/stockage de médias, notamment `saveRemoteMedia`, `saveResponseMedia`, `readRemoteMediaBuffer` et `fetchRemoteMedia` obsolète ; privilégiez les assistants de stockage avant les lectures de tampon lorsqu’une URL doit devenir un média OpenClaw |
    | `plugin-sdk/media-mime` | Normalisation MIME ciblée, mappage des extensions de fichier, détection MIME et assistants de type de média |
    | `plugin-sdk/media-store` | Assistants ciblés de stockage de médias, tels que `saveMediaBuffer` et `saveMediaStream` |
    | `plugin-sdk/media-generation-runtime` | Assistants partagés de basculement pour la génération de médias, sélection de candidats et messages de modèle manquant |
    | `plugin-sdk/media-understanding` | Types de fournisseurs de compréhension des médias, ainsi que exports d’assistants image/audio/extraction structurée destinés aux fournisseurs |
    | `plugin-sdk/text-chunking` | Assistants de découpage/rendu de texte et de markdown, conversion de tableaux markdown, suppression de balises de directive et utilitaires de texte sécurisé |
    | `plugin-sdk/text-chunking` | Assistant de découpage du texte sortant |
    | `plugin-sdk/speech` | Types de fournisseurs vocaux, ainsi que exports de directive, registre, validation, constructeur TTS compatible OpenAI et assistants vocaux destinés aux fournisseurs |
    | `plugin-sdk/speech-core` | Types partagés de fournisseurs vocaux, registre, directive, normalisation et exports d’assistants vocaux |
    | `plugin-sdk/realtime-transcription` | Types de fournisseurs de transcription en temps réel, assistants de registre et assistant partagé de session WebSocket |
    | `plugin-sdk/realtime-bootstrap-context` | Assistant d’amorçage de profil en temps réel pour l’injection bornée du contexte `IDENTITY.md`, `USER.md` et `SOUL.md` |
    | `plugin-sdk/realtime-voice` | Types de fournisseurs vocaux en temps réel, assistants de registre et assistants partagés de comportement vocal en temps réel, y compris le suivi de l’activité de sortie |
    | `plugin-sdk/image-generation` | Types de fournisseurs de génération d’images, ainsi qu’assistants d’asset image/URL de données et constructeur de fournisseur d’images compatible OpenAI |
    | `plugin-sdk/image-generation-core` | Types partagés de génération d’images, basculement, auth et assistants de registre |
    | `plugin-sdk/music-generation` | Types de fournisseurs/requêtes/résultats de génération musicale |
    | `plugin-sdk/music-generation-core` | Types partagés de génération musicale, assistants de basculement, recherche de fournisseur et analyse de référence de modèle |
    | `plugin-sdk/video-generation` | Types de fournisseurs/requêtes/résultats de génération vidéo |
    | `plugin-sdk/video-generation-core` | Types partagés de génération vidéo, assistants de basculement, recherche de fournisseur et analyse de référence de modèle |
    | `plugin-sdk/transcripts` | Types partagés de fournisseurs de sources de transcriptions, assistants de registre, descripteurs de session et métadonnées d’énoncé |
    | `plugin-sdk/webhook-targets` | Registre de cibles Webhook et assistants d’installation de routes |
    | `plugin-sdk/webhook-path` | Alias de compatibilité obsolète ; utilisez `plugin-sdk/webhook-ingress` |
    | `plugin-sdk/web-media` | Assistants partagés de chargement de médias distants/locaux |
    | `plugin-sdk/zod` | Réexport de compatibilité obsolète ; importez `zod` depuis `zod` directement |
    | `plugin-sdk/testing` | Barrel de compatibilité obsolète local au dépôt pour les anciens tests OpenClaw. Les nouveaux tests du dépôt doivent plutôt importer des sous-chemins de test locaux ciblés, tels que `plugin-sdk/agent-runtime-test-contracts`, `plugin-sdk/plugin-test-runtime`, `plugin-sdk/channel-test-helpers`, `plugin-sdk/test-env` ou `plugin-sdk/test-fixtures` |
    | `plugin-sdk/plugin-test-api` | Assistant minimal `createTestPluginApi` local au dépôt pour les tests unitaires d’enregistrement direct de Plugin sans importer de ponts d’assistants de test du dépôt |
    | `plugin-sdk/agent-runtime-test-contracts` | Fixtures de contrat d’adaptateur agent-runtime natif locales au dépôt pour les tests d’auth, de livraison, de basculement, de hook d’outil, de superposition de prompt, de schéma et de projection de transcription |
    | `plugin-sdk/channel-test-helpers` | Assistants de test orientés canal locaux au dépôt pour les contrats génériques d’actions/configuration/état, assertions de répertoire, cycle de vie du démarrage de compte, threading de configuration d’envoi, mocks runtime, problèmes d’état, livraison sortante et enregistrement de hooks |
    | `plugin-sdk/channel-target-testing` | Suite partagée locale au dépôt de cas d’erreur de résolution de cible pour les tests de canal |
    | `plugin-sdk/plugin-test-contracts` | Assistants locaux au dépôt pour les contrats de package Plugin, enregistrement, artefact public, import direct, API runtime et effet de bord d’import |
    | `plugin-sdk/provider-test-contracts` | Assistants locaux au dépôt pour les contrats de runtime fournisseur, auth, découverte, onboard, catalogue, assistant, capacité média, politique de relecture, audio en direct STT temps réel, recherche/récupération web et flux |
    | `plugin-sdk/provider-http-test-mocks` | Mocks HTTP/auth Vitest opt-in locaux au dépôt pour les tests de fournisseur qui exercent `plugin-sdk/provider-http` |
    | `plugin-sdk/test-fixtures` | Fixtures locales génériques au dépôt pour capture de runtime CLI, contexte sandbox, rédacteur de skill, message d’agent, événement système, rechargement de module, chemin de Plugin groupé, texte de terminal, découpage, jeton d’auth et cas typé |
    | `plugin-sdk/test-node-mocks` | Assistants ciblés locaux au dépôt pour les mocks Node intégrés à utiliser dans les factories Vitest `vi.mock("node:*")` |
  </Accordion>

  <Accordion title="Sous-chemins de mémoire">
    | Sous-chemin | Exports clés |
    | --- | --- |
    | `plugin-sdk/memory-core` | Surface d’assistants memory-core groupée pour les assistants de gestionnaire/configuration/fichier/CLI |
    | `plugin-sdk/memory-core-engine-runtime` | Façade runtime d’index/recherche mémoire |
    | `plugin-sdk/memory-core-host-embedding-registry` | Assistants légers de registre de fournisseurs d’embeddings mémoire |
    | `plugin-sdk/memory-core-host-engine-foundation` | Exports du moteur de fondation de l’hôte mémoire |
    | `plugin-sdk/memory-core-host-engine-embeddings` | Contrats d’embeddings de l’hôte mémoire, accès au registre, fournisseur local et assistants génériques batch/distants. `registerMemoryEmbeddingProvider` sur cette surface est obsolète ; utilisez l’API générique de fournisseur d’embeddings pour les nouveaux fournisseurs. |
    | `plugin-sdk/memory-core-host-engine-qmd` | Exports du moteur QMD de l’hôte mémoire |
    | `plugin-sdk/memory-core-host-engine-storage` | Exports du moteur de stockage de l’hôte mémoire |
    | `plugin-sdk/memory-core-host-multimodal` | Assistants multimodaux de l’hôte mémoire |
    | `plugin-sdk/memory-core-host-query` | Assistants de requête de l’hôte mémoire |
    | `plugin-sdk/memory-core-host-secret` | Assistants de secrets de l’hôte mémoire |
    | `plugin-sdk/memory-core-host-events` | Alias de compatibilité obsolète ; utilisez `plugin-sdk/memory-host-events` |
    | `plugin-sdk/memory-core-host-status` | Assistants d’état de l’hôte mémoire |
    | `plugin-sdk/memory-core-host-runtime-cli` | Assistants de runtime CLI de l’hôte mémoire |
    | `plugin-sdk/memory-core-host-runtime-core` | Assistants de runtime cœur de l’hôte mémoire |
    | `plugin-sdk/memory-core-host-runtime-files` | Assistants de fichiers/runtime de l’hôte mémoire |
    | `plugin-sdk/memory-host-core` | Alias indépendant du fournisseur pour les assistants de runtime cœur de l’hôte mémoire |
    | `plugin-sdk/memory-host-events` | Alias indépendant du fournisseur pour les assistants de journal d’événements de l’hôte mémoire |
    | `plugin-sdk/memory-host-files` | Alias de compatibilité obsolète ; utilisez `plugin-sdk/memory-core-host-runtime-files` |
    | `plugin-sdk/memory-host-markdown` | Assistants markdown géré partagés pour les plugins adjacents à la mémoire |
    | `plugin-sdk/memory-host-search` | Façade runtime de mémoire active pour l’accès au gestionnaire de recherche |
    | `plugin-sdk/memory-host-status` | Alias de compatibilité obsolète ; utilisez `plugin-sdk/memory-core-host-status` |
  </Accordion>

  <Accordion title="Sous-chemins réservés d’assistants groupés">
    Les sous-chemins SDK réservés d’assistants groupés sont des surfaces ciblées, propres à leur propriétaire, pour le code de Plugin groupé. Ils sont suivis dans l’inventaire du SDK afin que les builds de package et les alias restent déterministes, mais ce ne sont pas des API générales de création de Plugin. Les nouveaux contrats d’hôte réutilisables doivent utiliser des sous-chemins SDK génériques tels que `plugin-sdk/gateway-runtime`, `plugin-sdk/security-runtime` et `plugin-sdk/plugin-config-runtime`.

    | Sous-chemin | Propriétaire et objectif |
    | --- | --- |
    | `plugin-sdk/codex-mcp-projection` | Assistant du Plugin Codex groupé pour projeter la configuration des serveurs MCP utilisateur dans la configuration de thread app-server Codex |
    | `plugin-sdk/codex-native-task-runtime` | Assistant du Plugin Codex groupé pour refléter les sous-agents natifs app-server Codex dans l’état des tâches OpenClaw |

  </Accordion>
</AccordionGroup>

## Voir aussi

- [Vue d’ensemble du SDK Plugin](/fr/plugins/sdk-overview)
- [Configuration du SDK Plugin](/fr/plugins/sdk-setup)
- [Créer des plugins](/fr/plugins/building-plugins)
