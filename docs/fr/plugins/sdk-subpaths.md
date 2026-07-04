---
read_when:
    - Choisir le bon sous-chemin de plugin-sdk pour une importation de Plugin
    - Audit des sous-chemins des Plugins groupés et des surfaces d’assistance
summary: 'Catalogue des sous-chemins du SDK Plugin : quels imports se trouvent où, regroupés par zone'
title: Sous-chemins du SDK Plugin
x-i18n:
    generated_at: "2026-07-04T10:39:52Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 2a77f70197aca279d44d2b9db62bf9f936594311bb46c3da682413c3fa1378e5
    source_path: plugins/sdk-subpaths.md
    workflow: 16
---

Le SDK de Plugin est exposé sous forme d’un ensemble de sous-chemins publics étroits sous
`openclaw/plugin-sdk/`. Cette page recense les sous-chemins couramment utilisés, regroupés par
objectif. L’inventaire généré des points d’entrée du compilateur se trouve dans
`scripts/lib/plugin-sdk-entrypoints.json`; les exports du package correspondent au sous-ensemble public
après soustraction des sous-chemins de test/internes locaux au dépôt listés dans
`scripts/lib/plugin-sdk-private-local-only-subpaths.json`. Les mainteneurs peuvent auditer
le nombre d’exports publics avec `pnpm plugin-sdk:surface` et les sous-chemins actifs d’aides réservées
avec `pnpm plugins:boundary-report:summary`; les exports d’aides réservées inutilisés font échouer
le rapport CI au lieu de rester dans le SDK public comme une dette de compatibilité dormante.

Pour le guide de création de Plugins, consultez [Vue d’ensemble du SDK de Plugin](/fr/plugins/sdk-overview).

## Entrée de Plugin

| Sous-chemin                    | Exports clés                                                                                                                                                           |
| ------------------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `plugin-sdk/plugin-entry`      | `definePluginEntry`                                                                                                                                                    |
| `plugin-sdk/core`              | `defineChannelPluginEntry`, `createChatChannelPlugin`, `createChannelPluginBase`, `defineSetupPluginEntry`, `buildChannelConfigSchema`, `buildJsonChannelConfigSchema` |
| `plugin-sdk/config-schema`     | `OpenClawSchema`                                                                                                                                                       |
| `plugin-sdk/provider-entry`    | `defineSingleProviderPluginEntry`                                                                                                                                      |
| `plugin-sdk/migration`         | Aides d’éléments de fournisseur de migration comme `createMigrationItem`, constantes de raison, marqueurs d’état d’élément, aides de caviardage et `summarizeMigrationItems` |
| `plugin-sdk/migration-runtime` | Aides de migration à l’exécution comme `copyMigrationFileItem`, `resolvePlannedMigrationTargets`, `withCachedMigrationConfigRuntime` et `writeMigrationReport`          |
| `plugin-sdk/health`            | Types d’enregistrement, de détection, de réparation, de sélection, de gravité et de constat pour les contrôles de santé Doctor destinés aux consommateurs de santé groupés |

### Compatibilité obsolète et aides de test

Les sous-chemins obsolètes restent exportés pour les anciens Plugins, mais le nouveau code doit utiliser les
sous-chemins SDK ciblés ci-dessous. La liste maintenue est
`scripts/lib/plugin-sdk-deprecated-public-subpaths.json`; la CI rejette les imports de production groupés
qui en proviennent. Les barils larges comme `compat`, `config-types`,
`infra-runtime`, `text-runtime` et `zod` sont uniquement destinés à la compatibilité. Importez `zod`
directement depuis `zod`.

Les sous-chemins d’aides de test d’OpenClaw adossés à Vitest sont uniquement locaux au dépôt et ne sont
plus des exports de package : `agent-runtime-test-contracts`,
`channel-contract-testing`, `channel-target-testing`, `channel-test-helpers`,
`plugin-test-api`, `plugin-test-contracts`, `plugin-test-runtime`,
`provider-http-test-mocks`, `provider-test-contracts`, `test-env`,
`test-fixtures`, `test-node-mocks` et `testing`.

### Sous-chemins réservés d’aides de Plugin groupé

Ces sous-chemins sont des surfaces de compatibilité détenues par le Plugin pour leur Plugin groupé
propriétaire, et non des API SDK générales : `plugin-sdk/codex-mcp-projection` et
`plugin-sdk/codex-native-task-runtime`. Les imports d’extension entre propriétaires sont bloqués
par les garde-fous du contrat de package.

<AccordionGroup>
  <Accordion title="Sous-chemins de canal">
    | Sous-chemin | Exports clés |
    | --- | --- |
    | `plugin-sdk/channel-core` | `defineChannelPluginEntry`, `defineSetupPluginEntry`, `createChatChannelPlugin`, `createChannelPluginBase` |
    | `plugin-sdk/config-schema` | Export du schéma Zod racine de `openclaw.json` (`OpenClawSchema`) |
    | `plugin-sdk/json-schema-runtime` | Assistant de validation de schéma JSON mis en cache pour les schémas appartenant au plugin |
    | `plugin-sdk/channel-setup` | `createOptionalChannelSetupSurface`, `createOptionalChannelSetupAdapter`, `createOptionalChannelSetupWizard`, plus `DEFAULT_ACCOUNT_ID`, `createTopLevelChannelDmPolicy`, `setSetupChannelEnabled`, `splitSetupEntries` |
    | `plugin-sdk/setup` | Assistants partagés d'assistant de configuration, traducteur de configuration, invites de liste d'autorisation, constructeurs d'état de configuration |
    | `plugin-sdk/setup-runtime` | `createSetupTranslator`, `createPatchedAccountSetupAdapter`, `createEnvPatchedAccountSetupAdapter`, `createSetupInputPresenceValidator`, `noteChannelLookupFailure`, `noteChannelLookupSummary`, `promptResolvedAllowFrom`, `splitSetupEntries`, `createAllowlistSetupWizardProxy`, `createDelegatedSetupWizardProxy` |
    | `plugin-sdk/setup-adapter-runtime` | Alias de compatibilité obsolète ; utilisez `plugin-sdk/setup-runtime` |
    | `plugin-sdk/setup-tools` | `formatCliCommand`, `detectBinary`, `extractArchive`, `resolveBrewExecutable`, `formatDocsLink`, `CONFIG_DIR` |
    | `plugin-sdk/account-core` | Assistants de configuration multicomptes/de garde d'action, assistants de repli vers le compte par défaut |
    | `plugin-sdk/account-id` | `DEFAULT_ACCOUNT_ID`, assistants de normalisation d'identifiant de compte |
    | `plugin-sdk/account-resolution` | Assistants de recherche de compte et de repli par défaut |
    | `plugin-sdk/account-helpers` | Assistants restreints pour listes de comptes/actions de compte |
    | `plugin-sdk/access-groups` | Assistants d'analyse de liste d'autorisation de groupes d'accès et de diagnostics de groupes expurgés |
    | `plugin-sdk/channel-pairing` | `createChannelPairingController` |
    | `plugin-sdk/channel-reply-pipeline` | Façade de compatibilité obsolète. Utilisez `plugin-sdk/channel-outbound`. |
    | `plugin-sdk/channel-config-helpers` | `createHybridChannelConfigAdapter`, `resolveChannelDmAccess`, `resolveChannelDmAllowFrom`, `resolveChannelDmPolicy`, `normalizeChannelDmPolicy`, `normalizeLegacyDmAliases` |
    | `plugin-sdk/channel-config-schema` | Primitives partagées de schéma de configuration de canal, plus constructeurs Zod et JSON/TypeBox directs |
    | `plugin-sdk/bundled-channel-config-schema` | Schémas de configuration de canal OpenClaw groupés, uniquement pour les plugins groupés maintenus |
    | `plugin-sdk/chat-channel-ids` | `BUNDLED_CHAT_CHANNEL_IDS`, `BUNDLED_CHAT_CHANNEL_ENVELOPE_PREFIXES`, `ChatChannelId`. Identifiants canoniques des canaux de discussion groupés/officiels, plus libellés/alias de formatage pour les plugins qui doivent reconnaître du texte préfixé par une enveloppe sans coder leur propre table en dur. |
    | `plugin-sdk/channel-config-schema-legacy` | Alias de compatibilité obsolète pour les schémas de configuration de canal groupé |
    | `plugin-sdk/telegram-command-config` | Assistants de normalisation/validation de commandes personnalisées Telegram avec repli de contrat groupé |
    | `plugin-sdk/command-gating` | Assistants restreints de garde d'autorisation de commande |
    | `plugin-sdk/channel-policy` | `resolveChannelGroupRequireMention` |
    | `plugin-sdk/channel-ingress` | Façade de compatibilité obsolète pour l'entrée de canal de bas niveau. Les nouveaux chemins de réception doivent utiliser `plugin-sdk/channel-ingress-runtime`. |
    | `plugin-sdk/channel-ingress-runtime` | Résolveur expérimental d'environnement d'exécution d'entrée de canal de haut niveau et constructeurs de faits de routage pour les chemins de réception de canal migrés. Préférez-le à l'assemblage de listes d'autorisation effectives, de listes d'autorisation de commandes et de projections héritées dans chaque plugin. Voir [API d'entrée de canal](/fr/plugins/sdk-channel-ingress). |
    | `plugin-sdk/channel-lifecycle` | Façade de compatibilité obsolète. Utilisez `plugin-sdk/channel-outbound`. |
    | `plugin-sdk/channel-outbound` | Contrats de cycle de vie des messages, plus options de pipeline de réponse, accusés de réception, aperçu en direct/diffusion en continu, assistants de cycle de vie, identité sortante, planification de charge utile, envois durables et assistants de contexte d'envoi de message. Voir [API sortante de canal](/fr/plugins/sdk-channel-outbound). |
    | `plugin-sdk/channel-message` | Alias de compatibilité obsolète pour `plugin-sdk/channel-outbound`, plus façades héritées de distribution de réponses. |
    | `plugin-sdk/channel-message-runtime` | Alias de compatibilité obsolète pour `plugin-sdk/channel-outbound`, plus façades héritées de distribution de réponses. |
    | `plugin-sdk/inbound-envelope` | Assistants partagés de route entrante et de construction d'enveloppe |
    | `plugin-sdk/inbound-reply-dispatch` | Façade de compatibilité obsolète. Utilisez `plugin-sdk/channel-inbound` pour les exécutants entrants et les prédicats de distribution, et `plugin-sdk/channel-outbound` pour les assistants de livraison de messages. |
    | `plugin-sdk/messaging-targets` | Alias obsolète d'analyse de cible ; utilisez `plugin-sdk/channel-targets` |
    | `plugin-sdk/outbound-media` | Assistants partagés de chargement de médias sortants et d'état des médias hébergés |
    | `plugin-sdk/outbound-send-deps` | Façade de compatibilité obsolète. Utilisez `plugin-sdk/channel-outbound`. |
    | `plugin-sdk/outbound-runtime` | Façade de compatibilité obsolète. Utilisez `plugin-sdk/channel-outbound`. |
    | `plugin-sdk/poll-runtime` | Assistants restreints de normalisation de sondage |
    | `plugin-sdk/thread-bindings-runtime` | Assistants de cycle de vie et d'adaptateur de liaison de fil |
    | `plugin-sdk/agent-media-payload` | Constructeur hérité de charge utile média d'agent |
    | `plugin-sdk/conversation-runtime` | Assistants de liaison, d'association et de liaison configurée pour conversation/fil |
    | `plugin-sdk/runtime-config-snapshot` | Assistant d'instantané de configuration d'environnement d'exécution |
    | `plugin-sdk/runtime-group-policy` | Assistants de résolution de politique de groupe à l'exécution |
    | `plugin-sdk/channel-status` | Assistants partagés d'instantané/résumé d'état de canal |
    | `plugin-sdk/channel-config-primitives` | Primitives restreintes de schéma de configuration de canal |
    | `plugin-sdk/channel-config-writes` | Assistants d'autorisation d'écriture de configuration de canal |
    | `plugin-sdk/channel-plugin-common` | Exports partagés de préambule de plugin de canal |
    | `plugin-sdk/allowlist-config-edit` | Assistants de modification/lecture de configuration de liste d'autorisation |
    | `plugin-sdk/group-access` | Assistants partagés de décision d'accès de groupe |
    | `plugin-sdk/direct-dm`, `plugin-sdk/direct-dm-access` | Façades de compatibilité obsolètes. Utilisez `plugin-sdk/channel-inbound`. |
    | `plugin-sdk/direct-dm-guard-policy` | Assistants restreints de politique de garde pré-chiffrement des messages directs |
    | `plugin-sdk/discord` | Façade de compatibilité Discord obsolète pour `@openclaw/discord@2026.3.13` publié et la compatibilité suivie par le propriétaire ; les nouveaux plugins doivent utiliser les sous-chemins génériques du SDK de canal |
    | `plugin-sdk/telegram-account` | Façade de compatibilité obsolète de résolution de compte Telegram pour la compatibilité suivie par le propriétaire ; les nouveaux plugins doivent utiliser les assistants d'environnement d'exécution injectés ou les sous-chemins génériques du SDK de canal |
    | `plugin-sdk/zalouser` | Façade de compatibilité Zalo Personal obsolète pour les paquets Lark/Zalo publiés qui importent encore l'autorisation de commande d'expéditeur ; les nouveaux plugins doivent utiliser `plugin-sdk/command-auth` |
    | `plugin-sdk/interactive-runtime` | Assistants de présentation sémantique de message, de livraison et de réponse interactive héritée. Voir [Présentation des messages](/fr/plugins/message-presentation) |
    | `plugin-sdk/channel-inbound` | Assistants entrants partagés pour la classification d'événements, la construction de contexte, le formatage, les racines, l'anti-rebond, la correspondance de mentions, la politique de mentions et la journalisation entrante |
    | `plugin-sdk/channel-inbound-debounce` | Assistants restreints d'anti-rebond entrant |
    | `plugin-sdk/channel-mention-gating` | Assistants restreints de politique de mentions, de marqueur de mention et de texte de mention sans la surface plus large d'environnement d'exécution entrant |
    | `plugin-sdk/channel-envelope`, `plugin-sdk/channel-inbound-roots`, `plugin-sdk/channel-location`, `plugin-sdk/channel-logging` | Façades de compatibilité obsolètes. Utilisez `plugin-sdk/channel-inbound` ou `plugin-sdk/channel-outbound`. |
    | `plugin-sdk/channel-pairing-paths` | Façade de compatibilité obsolète. Utilisez `plugin-sdk/channel-pairing`. |
    | `plugin-sdk/channel-reply-options-runtime` | Façade de compatibilité obsolète. Utilisez `plugin-sdk/channel-outbound`. |
    | `plugin-sdk/channel-streaming` | Façade de compatibilité obsolète. Utilisez `plugin-sdk/channel-outbound`. |
    | `plugin-sdk/channel-send-result` | Types de résultat de réponse |
    | `plugin-sdk/channel-actions` | Assistants d'actions de message de canal, plus assistants de schéma natif obsolètes conservés pour la compatibilité des plugins |
    | `plugin-sdk/channel-route` | Normalisation de route partagée, résolution de cible pilotée par analyseur, conversion d'identifiant de fil en chaîne, clés de route dédupliquées/compactes, types de cibles analysées et assistants de comparaison route/cible |
    | `plugin-sdk/channel-targets` | Assistants d'analyse de cible ; les appelants de comparaison de routes doivent utiliser `plugin-sdk/channel-route` |
    | `plugin-sdk/channel-contract` | Types de contrat de canal |
    | `plugin-sdk/channel-feedback` | Câblage des retours/réactions |
    | `plugin-sdk/channel-secret-runtime` | Assistants restreints de contrat secret tels que `collectSimpleChannelFieldAssignments`, `getChannelSurface`, `pushAssignment` et types de cibles de secrets |
  </Accordion>

Les familles d'assistants de canal obsolètes restent disponibles uniquement pour
la compatibilité des plugins publiés. Le plan de suppression est le suivant :
les conserver pendant la fenêtre de migration des plugins externes, maintenir
les plugins du dépôt/groupés sur `channel-inbound` et `channel-outbound`, puis
supprimer les sous-chemins de compatibilité lors du prochain grand nettoyage du
SDK. Cela s'applique aux anciennes familles de message/environnement d'exécution
de canal, de diffusion en continu de canal, d'accès aux messages directs,
d'éclatement des assistants entrants, d'options de réponse et de chemins
d'association.

  <Accordion title="Sous-chemins des fournisseurs">
    | Sous-chemin | Exportations clés |
    | --- | --- |
    | `plugin-sdk/provider-entry` | `defineSingleProviderPluginEntry` |
    | `plugin-sdk/lmstudio` | Façade de fournisseur LM Studio prise en charge pour la configuration, la découverte du catalogue et la préparation des modèles à l’exécution |
    | `plugin-sdk/lmstudio-runtime` | Façade d’exécution LM Studio prise en charge pour les valeurs par défaut du serveur local, la découverte des modèles, les en-têtes de requête et les assistants de modèles chargés |
    | `plugin-sdk/provider-setup` | Assistants de configuration de fournisseurs locaux/auto-hébergés sélectionnés |
    | `plugin-sdk/self-hosted-provider-setup` | Assistants ciblés de configuration de fournisseurs auto-hébergés compatibles OpenAI |
    | `plugin-sdk/cli-backend` | Valeurs par défaut du backend CLI + constantes du watchdog |
    | `plugin-sdk/provider-auth-runtime` | Assistants de résolution des clés API à l’exécution pour les plugins de fournisseur |
    | `plugin-sdk/provider-oauth-runtime` | Types génériques de rappel OAuth de fournisseur, rendu de page de rappel, assistants PKCE/état, analyse des entrées d’autorisation, assistants d’expiration de jeton et assistants d’abandon |
    | `plugin-sdk/provider-auth-api-key` | Assistants d’intégration et d’écriture de profil par clé API, comme `upsertApiKeyProfile` |
    | `plugin-sdk/provider-auth-result` | Générateur standard de résultat d’authentification OAuth |
    | `plugin-sdk/provider-env-vars` | Assistants de recherche de variables d’environnement d’authentification de fournisseur |
    | `plugin-sdk/provider-auth` | `createProviderApiKeyAuthMethod`, `ensureApiKeyFromOptionEnvOrPrompt`, `upsertAuthProfile`, `upsertApiKeyProfile`, `writeOAuthCredentials`, assistants d’importation d’authentification OpenAI Codex, exportation de compatibilité obsolète `resolveOpenClawAgentDir` |
    | `plugin-sdk/provider-model-shared` | `ProviderReplayFamily`, `buildProviderReplayFamilyHooks`, `normalizeModelCompat`, générateurs partagés de politiques de replay, assistants de points de terminaison de fournisseur et assistants partagés de normalisation d’identifiants de modèle |
    | `plugin-sdk/provider-catalog-live-runtime` | Assistants de catalogue de modèles de fournisseurs en direct pour la découverte protégée de type `/models` : `buildLiveModelProviderConfig`, `fetchLiveProviderModelRows`, `getCachedLiveProviderModelRows`, `fetchLiveProviderModelIds`, `LiveModelCatalogHttpError`, `clearLiveCatalogCacheForTests`, filtrage des identifiants de modèle, cache TTL et repli statique |
    | `plugin-sdk/provider-catalog-runtime` | Hook d’exécution d’augmentation du catalogue de fournisseurs et jonctions du registre plugin-fournisseur pour les tests de contrat |
    | `plugin-sdk/provider-catalog-shared` | `findCatalogTemplate`, `buildSingleProviderApiKeyCatalog`, `buildManifestModelProviderConfig`, `supportsNativeStreamingUsageCompat`, `applyProviderNativeStreamingUsageCompat` |
    | `plugin-sdk/provider-http` | Assistants génériques de capacités HTTP/point de terminaison de fournisseur, erreurs HTTP de fournisseur et assistants de formulaire multipart pour la transcription audio |
    | `plugin-sdk/provider-web-fetch-contract` | Assistants ciblés de contrat de configuration/sélection web-fetch, comme `enablePluginInConfig` et `WebFetchProviderPlugin` |
    | `plugin-sdk/provider-web-fetch` | Assistants d’enregistrement/cache de fournisseur web-fetch |
    | `plugin-sdk/provider-web-search-config-contract` | Assistants ciblés de configuration/identifiants web-search pour les fournisseurs qui n’ont pas besoin de câblage d’activation de plugin |
    | `plugin-sdk/provider-web-search-contract` | Assistants ciblés de contrat de configuration/identifiants web-search, comme `createWebSearchProviderContractFields`, `enablePluginInConfig`, `resolveProviderWebSearchPluginConfig` et les setters/getters d’identifiants à portée définie |
    | `plugin-sdk/provider-web-search` | Assistants d’enregistrement/cache/exécution de fournisseur web-search |
    | `plugin-sdk/embedding-providers` | Types généraux de fournisseurs d’embeddings et assistants de lecture, notamment `EmbeddingProviderAdapter`, `getEmbeddingProvider(...)` et `listEmbeddingProviders(...)` ; les plugins enregistrent les fournisseurs via `api.registerEmbeddingProvider(...)` afin de garantir la propriété du manifeste |
    | `plugin-sdk/provider-tools` | `ProviderToolCompatFamily`, `buildProviderToolCompatFamilyHooks` et nettoyage de schéma + diagnostics DeepSeek/Gemini/OpenAI |
    | `plugin-sdk/provider-usage` | Types d’instantané d’utilisation de fournisseur, assistants partagés de récupération d’utilisation et récupérateurs de fournisseur comme `fetchClaudeUsage` |
    | `plugin-sdk/provider-stream` | `ProviderStreamFamily`, `buildProviderStreamFamilyHooks`, `composeProviderStreamWrappers`, types de wrappers de flux, compatibilité des appels d’outils en texte brut et assistants partagés de wrappers Anthropic/Bedrock/DeepSeek V4/Google/Kilocode/Moonshot/OpenAI/OpenRouter/Z.A.I/MiniMax/Copilot |
    | `plugin-sdk/provider-stream-shared` | Assistants publics partagés de wrappers de flux de fournisseur, notamment `composeProviderStreamWrappers`, `createOpenAICompatibleCompletionsThinkingOffWrapper`, `createPlainTextToolCallCompatWrapper`, `createPayloadPatchStreamWrapper`, `createToolStreamWrapper`, `normalizeOpenAICompatibleReasoningPayload`, `setQwenChatTemplateThinking` et utilitaires de flux compatibles Anthropic/DeepSeek/OpenAI |
    | `plugin-sdk/provider-transport-runtime` | Assistants de transport natif de fournisseur, comme la récupération protégée, l’extraction de texte de résultat d’outil, les transformations de messages de transport et les flux d’événements de transport inscriptibles |
    | `plugin-sdk/provider-onboard` | Assistants de correctifs de configuration d’intégration |
    | `plugin-sdk/global-singleton` | Assistants de singleton/map/cache locaux au processus |
    | `plugin-sdk/group-activation` | Assistants ciblés de mode d’activation de groupe et d’analyse de commande |
  </Accordion>

Les instantanés d’utilisation des fournisseurs signalent normalement une ou plusieurs `windows` de quota, chacune avec
un libellé, le pourcentage utilisé et une heure de réinitialisation facultative. Les fournisseurs qui exposent un solde ou
un texte d’état de compte plutôt que des fenêtres de quota réinitialisables doivent renvoyer
`summary` avec un tableau `windows` vide au lieu de fabriquer des pourcentages.
OpenClaw affiche ce texte de résumé dans la sortie d’état ; utilisez `error` uniquement lorsque le
point de terminaison d’utilisation a échoué ou n’a renvoyé aucune donnée d’utilisation exploitable.

  <Accordion title="Sous-chemins d’authentification et de sécurité">
    | Sous-chemin | Exportations clés |
    | --- | --- |
    | `plugin-sdk/command-auth` | `resolveControlCommandGate`, assistants de registre de commandes incluant le formatage de menu d’arguments dynamiques, assistants d’autorisation d’expéditeur |
    | `plugin-sdk/command-status` | Générateurs de messages de commande/aide, comme `buildCommandsMessagePaginated` et `buildHelpMessage` |
    | `plugin-sdk/approval-auth-runtime` | Assistants de résolution d’approbateur et d’authentification d’action dans la même discussion |
    | `plugin-sdk/approval-client-runtime` | Assistants de profil/filtre d’approbation d’exécution native |
    | `plugin-sdk/approval-delivery-runtime` | Adaptateurs natifs de capacité/livraison d’approbation |
    | `plugin-sdk/approval-gateway-runtime` | Assistant partagé de résolution de Gateway d’approbation |
    | `plugin-sdk/approval-handler-adapter-runtime` | Assistants légers de chargement d’adaptateur natif d’approbation pour les points d’entrée de canal critiques |
    | `plugin-sdk/approval-handler-runtime` | Assistants d’exécution plus larges de gestionnaire d’approbation ; privilégiez les jonctions plus ciblées d’adaptateur/Gateway lorsqu’elles suffisent |
    | `plugin-sdk/approval-native-runtime` | Assistants de cible d’approbation native, liaison de compte, porte de routage, repli de transfert et suppression d’invite d’exécution native locale |
    | `plugin-sdk/approval-reaction-runtime` | Liaisons de réactions d’approbation codées en dur, charges utiles d’invite de réaction, magasins de cibles de réaction, assistants de texte d’indice de réaction et exportation de compatibilité pour la suppression d’invite d’exécution native locale |
    | `plugin-sdk/approval-reply-runtime` | Assistants de charges utiles de réponse d’approbation d’exécution/plugin |
    | `plugin-sdk/approval-runtime` | Assistants de charges utiles d’approbation d’exécution/plugin, assistants de routage/exécution d’approbation native et assistants d’affichage structuré d’approbation, comme `formatApprovalDisplayPath` |
    | `plugin-sdk/reply-dedupe` | Assistants ciblés de réinitialisation de déduplication des réponses entrantes |
    | `plugin-sdk/channel-contract-testing` | Assistants ciblés de tests de contrat de canal sans le large barrel de test |
    | `plugin-sdk/command-auth-native` | Authentification de commande native, formatage de menu d’arguments dynamiques et assistants natifs de cible de session |
    | `plugin-sdk/command-detection` | Assistants partagés de détection de commandes |
    | `plugin-sdk/command-primitives-runtime` | Prédicats légers de texte de commande pour les chemins de canal critiques |
    | `plugin-sdk/command-surface` | Assistants de normalisation du corps de commande et de surface de commande |
    | `plugin-sdk/allow-from` | `formatAllowFromLowercase` |
    | `plugin-sdk/provider-auth-login-flow-runtime` | Assistants paresseux de flux de connexion d’authentification de fournisseur pour l’association par code d’appareil dans les canaux privés et l’interface Web |
    | `plugin-sdk/channel-secret-runtime` | Assistants ciblés de collecte de contrats de secrets pour les surfaces de secrets canal/plugin |
    | `plugin-sdk/secret-ref-runtime` | Assistants ciblés de typage `coerceSecretRef` et SecretRef pour l’analyse de contrat/configuration de secret |
    | `plugin-sdk/secret-provider-integration` | Manifeste d’intégration de fournisseur SecretRef uniquement au niveau des types et contrats de préréglages pour les plugins qui publient des préréglages externes de fournisseur de secrets |
    | `plugin-sdk/security-runtime` | Assistants partagés de confiance, filtrage des DM, fichiers/chemins bornés à la racine incluant les écritures en création seule, le remplacement atomique de fichier synchrone/asynchrone, les écritures temporaires sœurs, le repli de déplacement entre appareils, les assistants de stockage de fichiers privés, les protections de parents de liens symboliques, le contenu externe, la rédaction de texte sensible, la comparaison de secrets en temps constant et les assistants de collecte de secrets |
    | `plugin-sdk/ssrf-policy` | Assistants de liste d’autorisation d’hôtes et de politique SSRF pour réseaux privés |
    | `plugin-sdk/ssrf-dispatcher` | Assistants ciblés de dispatcher épinglé sans la large surface d’exécution d’infrastructure |
    | `plugin-sdk/ssrf-runtime` | Dispatcher épinglé, récupération protégée par SSRF, erreur SSRF et assistants de politique SSRF |
    | `plugin-sdk/secret-input` | Assistants d’analyse d’entrée de secret |
    | `plugin-sdk/webhook-ingress` | Assistants de requête/cible Webhook et coercition de websocket/corps brut |
    | `plugin-sdk/webhook-request-guards` | Assistants de taille de corps de requête/délai d’expiration |
  </Accordion>

  <Accordion title="Sous-chemins de runtime et de stockage">
    | Sous-chemin | Exportations clés |
    | --- | --- |
    | `plugin-sdk/runtime` | Utilitaires généraux de runtime, journalisation, sauvegarde et installation de plugins |
    | `plugin-sdk/runtime-env` | Utilitaires ciblés d’environnement de runtime, de journalisation, de délai d’expiration, de nouvelle tentative et de temporisation |
    | `plugin-sdk/browser-config` | Façade de configuration de navigateur prise en charge pour les profils/valeurs par défaut normalisés, l’analyse d’URL CDP et les utilitaires d’authentification de contrôle du navigateur |
    | `plugin-sdk/agent-harness-task-runtime` | Utilitaires génériques de cycle de vie de tâche et de remise d’achèvement pour les agents adossés à un harnais utilisant une portée de tâche émise par l’hôte |
    | `plugin-sdk/codex-mcp-projection` | Utilitaire Codex groupé réservé pour projeter la configuration de serveur MCP utilisateur dans la configuration de fil Codex ; non destiné aux plugins tiers |
    | `plugin-sdk/codex-native-task-runtime` | Utilitaire Codex groupé privé pour le câblage miroir/runtime des tâches natives ; non destiné aux plugins tiers |
    | `plugin-sdk/channel-runtime-context` | Utilitaires génériques d’inscription et de recherche de contexte de runtime de canal |
    | `plugin-sdk/matrix` | Façade de compatibilité Matrix obsolète pour les anciens paquets de canaux tiers ; les nouveaux plugins doivent importer directement `plugin-sdk/run-command` |
    | `plugin-sdk/mattermost` | Façade de compatibilité Mattermost obsolète pour les anciens paquets de canaux tiers ; les nouveaux plugins doivent importer directement les sous-chemins génériques du SDK |
    | `plugin-sdk/runtime-store` | `createPluginRuntimeStore` |
    | `plugin-sdk/plugin-runtime` | Utilitaires partagés de commandes, hooks, HTTP et interactions de plugin |
    | `plugin-sdk/hook-runtime` | Utilitaires partagés de pipeline de Webhook/hook interne |
    | `plugin-sdk/lazy-runtime` | Utilitaires d’importation et de liaison paresseuses du runtime, tels que `createLazyRuntimeModule`, `createLazyRuntimeMethod` et `createLazyRuntimeSurface` |
    | `plugin-sdk/process-runtime` | Utilitaires d’exécution de processus |
    | `plugin-sdk/cli-runtime` | Utilitaires CLI de mise en forme, d’attente, de version, d’invocation d’arguments et de groupes de commandes paresseux |
    | `plugin-sdk/qa-live-transport-scenarios` | Identifiants partagés de scénarios QA de transport en direct, utilitaires de couverture de référence et utilitaire de sélection de scénarios |
    | `plugin-sdk/gateway-method-runtime` | Utilitaire réservé de répartition de méthodes Gateway pour les routes HTTP de plugins qui déclarent `contracts.gatewayMethodDispatch: ["authenticated-request"]` |
    | `plugin-sdk/gateway-runtime` | Client Gateway, utilitaire de démarrage de client prêt pour la boucle d’événements, RPC CLI de Gateway, erreurs de protocole Gateway, résolution de l’hôte LAN annoncé et utilitaires de correctif de statut de canal |
    | `plugin-sdk/config-contracts` | Surface de configuration ciblée, uniquement de types, pour les formes de configuration de plugins comme `OpenClawConfig` et les types de configuration de canal/fournisseur |
    | `plugin-sdk/plugin-config-runtime` | Utilitaires de recherche de configuration de plugin au runtime, tels que `requireRuntimeConfig`, `resolvePluginConfigObject` et `resolveLivePluginConfigObject` |
    | `plugin-sdk/config-mutation` | Utilitaires transactionnels de mutation de configuration, tels que `mutateConfigFile`, `replaceConfigFile` et `logConfigUpdated` |
    | `plugin-sdk/message-tool-delivery-hints` | Chaînes partagées d’indices de métadonnées de remise des outils de message |
    | `plugin-sdk/runtime-config-snapshot` | Utilitaires d’instantané de configuration du processus courant, tels que `getRuntimeConfig`, `getRuntimeConfigSnapshot` et les setters d’instantané de test |
    | `plugin-sdk/telegram-command-config` | Normalisation des noms/descriptions de commandes Telegram et vérifications de doublons/conflits, même lorsque la surface de contrat Telegram groupée n’est pas disponible |
    | `plugin-sdk/text-autolink-runtime` | Détection d’autolien de références de fichiers sans le large barrel de texte |
    | `plugin-sdk/approval-reaction-runtime` | Liaisons codées en dur de réactions d’approbation, charges utiles d’invite de réaction, magasins de cibles de réaction, utilitaires de texte d’indice de réaction et export de compatibilité pour la suppression locale des invites d’exécution natives |
    | `plugin-sdk/approval-runtime` | Utilitaires d’approbation d’exécution/plugin, constructeurs de capacités d’approbation, utilitaires d’authentification/profil, utilitaires de routage/runtime natifs et mise en forme structurée des chemins d’affichage d’approbation |
    | `plugin-sdk/reply-runtime` | Utilitaires partagés de runtime entrant/réponse, découpage, répartition, Heartbeat, planificateur de réponses |
    | `plugin-sdk/reply-dispatch-runtime` | Utilitaires ciblés de répartition/finalisation de réponse et de libellés de conversation |
    | `plugin-sdk/reply-history` | Utilitaires partagés d’historique de réponses sur fenêtre courte. Le nouveau code de tour de message doit utiliser `createChannelHistoryWindow` ; les utilitaires de map de plus bas niveau restent uniquement des exports de compatibilité obsolètes |
    | `plugin-sdk/reply-reference` | `createReplyReferencePlanner` |
    | `plugin-sdk/reply-chunking` | Utilitaires ciblés de découpage de texte/Markdown |
    | `plugin-sdk/session-store-runtime` | Utilitaires de workflow de session (`getSessionEntry`, `listSessionEntries`, `patchSessionEntry`, `upsertSessionEntry`), lectures bornées de texte récent de transcription utilisateur/assistant par identité de session, utilitaires d’ancien chemin de magasin de sessions/clé de session, lectures de mise à jour et utilitaires de compatibilité transitoires de magasin complet/chemin de fichier |
    | `plugin-sdk/session-transcript-runtime` | Identité de transcription, utilitaires de cible/lecture/écriture à portée limitée, publication de mises à jour, verrous d’écriture et clés d’occurrences de mémoire de transcription |
    | `plugin-sdk/sqlite-runtime` | Utilitaires ciblés de schéma d’agent SQLite, de chemin et de transaction pour le runtime de première partie |
    | `plugin-sdk/cron-store-runtime` | Utilitaires de chemin/chargement/enregistrement du magasin Cron |
    | `plugin-sdk/state-paths` | Utilitaires de chemins de répertoires d’état/OAuth |
    | `plugin-sdk/plugin-state-runtime` | Types d’état indexé SQLite annexe de Plugin, plus configuration centralisée des pragmas de connexion et de maintenance WAL pour les bases de données appartenant aux plugins |
    | `plugin-sdk/routing` | Utilitaires de liaison route/clé de session/compte, tels que `resolveAgentRoute`, `buildAgentSessionKey` et `resolveDefaultAgentBoundAccountId` |
    | `plugin-sdk/status-helpers` | Utilitaires partagés de résumé de statut de canal/compte, valeurs par défaut d’état de runtime et utilitaires de métadonnées d’issue |
    | `plugin-sdk/target-resolver-runtime` | Utilitaires partagés de résolution de cible |
    | `plugin-sdk/string-normalization-runtime` | Utilitaires de normalisation de slugs/chaînes |
    | `plugin-sdk/request-url` | Extraction d’URL sous forme de chaînes depuis des entrées de type fetch/request |
    | `plugin-sdk/run-command` | Exécuteur de commandes temporisé avec résultats stdout/stderr normalisés |
    | `plugin-sdk/param-readers` | Lecteurs communs de paramètres d’outil/CLI |
    | `plugin-sdk/tool-plugin` | Définir un plugin d’outil d’agent typé simple et exposer des métadonnées statiques pour la génération de manifeste |
    | `plugin-sdk/tool-payload` | Extraire des charges utiles normalisées depuis des objets de résultat d’outil |
    | `plugin-sdk/tool-send` | Extraire les champs canoniques de cible d’envoi depuis les arguments d’outil |
    | `plugin-sdk/sandbox` | Types de backend de bac à sable et utilitaires de commandes SSH/OpenShell, y compris la prévalidation de commande d’exécution à échec rapide |
    | `plugin-sdk/temp-path` | Utilitaires partagés de chemins de téléchargement temporaire et espaces de travail temporaires sécurisés privés |
    | `plugin-sdk/logging-core` | Utilitaires de journalisation de sous-système et de masquage |
    | `plugin-sdk/markdown-table-runtime` | Utilitaires de mode de tableau Markdown et de conversion |
    | `plugin-sdk/model-session-runtime` | Utilitaires de substitution de modèle/session, tels que `applyModelOverrideToSessionEntry` et `resolveAgentMaxConcurrent` |
    | `plugin-sdk/talk-config-runtime` | Utilitaires de résolution de configuration de fournisseur Talk |
    | `plugin-sdk/json-store` | Petits utilitaires de lecture/écriture d’état JSON |
    | `plugin-sdk/json-unsafe-integers` | Utilitaires d’analyse JSON qui conservent les littéraux entiers non sûrs sous forme de chaînes |
    | `plugin-sdk/file-lock` | Utilitaires de verrouillage de fichier réentrant |
    | `plugin-sdk/persistent-dedupe` | Utilitaires de cache de déduplication adossé au disque |
    | `plugin-sdk/acp-runtime` | Utilitaires de runtime/session ACP et de répartition de réponses |
    | `plugin-sdk/acp-runtime-backend` | Utilitaires légers d’inscription de backend ACP et de répartition de réponses pour les plugins chargés au démarrage |
    | `plugin-sdk/acp-binding-resolve-runtime` | Résolution en lecture seule des liaisons ACP sans importations de démarrage du cycle de vie |
    | `plugin-sdk/agent-config-primitives` | Primitives ciblées de schéma de configuration de runtime d’agent |
    | `plugin-sdk/boolean-param` | Lecteur souple de paramètre booléen |
    | `plugin-sdk/dangerous-name-runtime` | Utilitaires de résolution de correspondance de noms dangereux |
    | `plugin-sdk/device-bootstrap` | Utilitaires d’amorçage d’appareil et de jeton d’appairage |
    | `plugin-sdk/extension-shared` | Primitives partagées de canal passif, de statut et d’utilitaire de proxy ambiant |
    | `plugin-sdk/models-provider-runtime` | Utilitaires de réponses de commande/fournisseur `/models` |
    | `plugin-sdk/skill-commands-runtime` | Utilitaires de listage de commandes de Skills |
    | `plugin-sdk/native-command-registry` | Utilitaires de registre/construction/sérialisation de commandes natives |
    | `plugin-sdk/agent-harness` | Surface expérimentale de plugin de confiance pour harnais d’agents bas niveau : types de harnais, utilitaires de pilotage/abandon d’exécution active, utilitaires de pont d’outils OpenClaw, utilitaires de politique d’outils de plan de runtime, classification des résultats terminaux, utilitaires de mise en forme/détail de progression d’outil et utilitaires de résultat de tentative |
    | `plugin-sdk/provider-zai-endpoint` | Façade obsolète de détection de point de terminaison appartenant au fournisseur Z.AI ; utiliser l’API publique du plugin Z.AI |
    | `plugin-sdk/async-lock-runtime` | Utilitaire de verrou asynchrone local au processus pour les petits fichiers d’état de runtime |
    | `plugin-sdk/channel-activity-runtime` | Utilitaire de télémétrie d’activité de canal |
    | `plugin-sdk/concurrency-runtime` | Utilitaire de concurrence bornée des tâches asynchrones |
    | `plugin-sdk/dedupe-runtime` | Utilitaires de cache de déduplication en mémoire et adossé à la persistance |
    | `plugin-sdk/delivery-queue-runtime` | Utilitaire de vidage des remises sortantes en attente |
    | `plugin-sdk/file-access-runtime` | Utilitaires sûrs de chemins de fichiers locaux et de sources média |
    | `plugin-sdk/heartbeat-runtime` | Utilitaires de réveil, d’événement et de visibilité Heartbeat |
    | `plugin-sdk/number-runtime` | Utilitaire de coercition numérique |
    | `plugin-sdk/secure-random-runtime` | Utilitaires de jetons/UUID sécurisés |
    | `plugin-sdk/system-event-runtime` | Utilitaires de file d’événements système |
    | `plugin-sdk/transport-ready-runtime` | Utilitaire d’attente de disponibilité du transport |
    | `plugin-sdk/exec-approvals-runtime` | Utilitaires de fichier de politique d’approbation d’exécution sans le large barrel infra-runtime |
    | `plugin-sdk/infra-runtime` | Shim de compatibilité obsolète ; utiliser les sous-chemins de runtime ciblés ci-dessus |
    | `plugin-sdk/collection-runtime` | Petits utilitaires de cache borné |
    | `plugin-sdk/diagnostic-runtime` | Utilitaires d’indicateur de diagnostic, d’événement et de contexte de trace |
    | `plugin-sdk/error-runtime` | Graphe d’erreurs, mise en forme, utilitaires partagés de classification d’erreurs, `isApprovalNotFoundError` |
    | `plugin-sdk/fetch-runtime` | Fetch encapsulé, proxy, option EnvHttpProxyAgent et utilitaires de recherche épinglée |
    | `plugin-sdk/runtime-fetch` | Fetch de runtime tenant compte du répartiteur sans importations de proxy/fetch protégé |
    | `plugin-sdk/inline-image-data-url-runtime` | Nettoyeur d’URL de données d’image en ligne et utilitaires de détection de signature sans la large surface de runtime média |
    | `plugin-sdk/response-limit-runtime` | Lecteur borné de corps de réponse sans la large surface de runtime média |
    | `plugin-sdk/session-binding-runtime` | État de liaison de conversation courant sans routage de liaison configuré ni magasins d’appairage |
    | `plugin-sdk/session-store-runtime` | Utilitaires de magasin de sessions sans larges importations d’écritures/maintenance de configuration |
    | `plugin-sdk/sqlite-runtime` | Utilitaires ciblés de schéma d’agent SQLite, de chemin et de transaction sans contrôles de cycle de vie de base de données |
    | `plugin-sdk/context-visibility-runtime` | Résolution de visibilité du contexte et filtrage du contexte supplémentaire sans larges importations de configuration/sécurité |
    | `plugin-sdk/string-coerce-runtime` | Utilitaires ciblés de coercition et de normalisation d’enregistrements/chaînes primitifs sans importations Markdown/journalisation |
    | `plugin-sdk/host-runtime` | Utilitaires de normalisation de noms d’hôte et d’hôtes SCP |
    | `plugin-sdk/retry-runtime` | Utilitaires de configuration de nouvelle tentative et d’exécution des nouvelles tentatives |
    | `plugin-sdk/agent-runtime` | Utilitaires de répertoire/identité/espace de travail d’agent, y compris `resolveAgentDir`, `resolveDefaultAgentDir` et l’export de compatibilité obsolète `resolveOpenClawAgentDir` |
    | `plugin-sdk/directory-runtime` | Requête/déduplication de répertoires adossées à la configuration |
    | `plugin-sdk/keyed-async-queue` | `KeyedAsyncQueue` |
  </Accordion>

  <Accordion title="Sous-chemins de capacités et de test">
    | Sous-chemin | Exports principaux |
    | --- | --- |
    | `plugin-sdk/media-runtime` | Assistants partagés de récupération/transformation/stockage de médias, notamment `saveRemoteMedia`, `saveResponseMedia`, `readRemoteMediaBuffer` et `fetchRemoteMedia` obsolète ; privilégiez les assistants de stockage avant les lectures de tampon lorsqu’une URL doit devenir un média OpenClaw |
    | `plugin-sdk/media-mime` | Normalisation MIME ciblée, correspondance des extensions de fichiers, détection MIME et assistants de type de média |
    | `plugin-sdk/media-store` | Assistants ciblés de stockage de médias tels que `saveMediaBuffer` et `saveMediaStream` |
    | `plugin-sdk/media-generation-runtime` | Assistants partagés de basculement pour la génération de médias, sélection de candidats et messages de modèle manquant |
    | `plugin-sdk/media-understanding` | Types de fournisseurs de compréhension multimédia, plus exports d’assistants image/audio/extraction structurée destinés aux fournisseurs |
    | `plugin-sdk/text-chunking` | Assistants de découpage/rendu de texte et de markdown, conversion de tableaux markdown, suppression de balises de directives et utilitaires de texte sûr |
    | `plugin-sdk/text-chunking` | Assistant de découpage du texte sortant |
    | `plugin-sdk/speech` | Types de fournisseurs de parole, plus exports destinés aux fournisseurs pour les directives, le registre, la validation, le constructeur TTS compatible OpenAI et les assistants de parole |
    | `plugin-sdk/speech-core` | Types partagés de fournisseurs de parole, registre, directives, normalisation et exports d’assistants de parole |
    | `plugin-sdk/realtime-transcription` | Types de fournisseurs de transcription en temps réel, assistants de registre et assistant partagé de session WebSocket |
    | `plugin-sdk/realtime-bootstrap-context` | Assistant d’amorçage de profil en temps réel pour l’injection bornée du contexte `IDENTITY.md`, `USER.md` et `SOUL.md` |
    | `plugin-sdk/realtime-voice` | Types de fournisseurs de voix en temps réel, assistants de registre et assistants partagés de comportement vocal en temps réel, notamment le suivi de l’activité de sortie |
    | `plugin-sdk/image-generation` | Types de fournisseurs de génération d’images, plus assistants d’URL d’asset/données d’image et constructeur de fournisseur d’images compatible OpenAI |
    | `plugin-sdk/image-generation-core` | Types partagés de génération d’images, basculement, authentification et assistants de registre |
    | `plugin-sdk/music-generation` | Types de fournisseurs/requêtes/résultats de génération musicale |
    | `plugin-sdk/music-generation-core` | Types partagés de génération musicale, assistants de basculement, recherche de fournisseur et analyse de référence de modèle |
    | `plugin-sdk/video-generation` | Types de fournisseurs/requêtes/résultats de génération vidéo |
    | `plugin-sdk/video-generation-core` | Types partagés de génération vidéo, assistants de basculement, recherche de fournisseur et analyse de référence de modèle |
    | `plugin-sdk/transcripts` | Types partagés de fournisseurs de sources de transcriptions, assistants de registre, descripteurs de session et métadonnées d’énoncé |
    | `plugin-sdk/webhook-targets` | Registre de cibles Webhook et assistants d’installation de routes |
    | `plugin-sdk/webhook-path` | Alias de compatibilité obsolète ; utilisez `plugin-sdk/webhook-ingress` |
    | `plugin-sdk/web-media` | Assistants partagés de chargement de médias distants/locaux |
    | `plugin-sdk/zod` | Réexport de compatibilité obsolète ; importez `zod` directement depuis `zod` |
    | `plugin-sdk/testing` | Barrel de compatibilité obsolète local au dépôt pour les anciens tests OpenClaw. Les nouveaux tests du dépôt doivent plutôt importer des sous-chemins de test locaux ciblés, tels que `plugin-sdk/agent-runtime-test-contracts`, `plugin-sdk/plugin-test-runtime`, `plugin-sdk/channel-test-helpers`, `plugin-sdk/test-env` ou `plugin-sdk/test-fixtures` |
    | `plugin-sdk/plugin-test-api` | Assistant minimal `createTestPluginApi` local au dépôt pour les tests unitaires d’enregistrement direct de plugin sans importer de passerelles d’assistants de test du dépôt |
    | `plugin-sdk/agent-runtime-test-contracts` | Jeux de données de contrat natifs, locaux au dépôt, pour adaptateur d’exécution d’agent, destinés aux tests d’authentification, livraison, basculement, hook d’outil, superposition de prompt, schéma et projection de transcription |
    | `plugin-sdk/channel-test-helpers` | Assistants de test orientés canal, locaux au dépôt, pour les contrats génériques d’actions/configuration/état, assertions de répertoire, cycle de vie de démarrage de compte, threading de configuration d’envoi, mocks d’exécution, problèmes d’état, livraison sortante et enregistrement de hooks |
    | `plugin-sdk/channel-target-testing` | Suite partagée, locale au dépôt, de cas d’erreur de résolution de cible pour les tests de canal |
    | `plugin-sdk/plugin-test-contracts` | Assistants de contrat locaux au dépôt pour package de plugin, enregistrement, artefact public, import direct, API d’exécution et effets de bord d’import |
    | `plugin-sdk/provider-test-contracts` | Assistants de contrat locaux au dépôt pour exécution de fournisseur, authentification, découverte, intégration, catalogue, assistant de configuration, capacité multimédia, politique de relecture, audio en direct STT en temps réel, recherche/récupération Web et flux |
    | `plugin-sdk/provider-http-test-mocks` | Mocks HTTP/auth Vitest optionnels, locaux au dépôt, pour les tests de fournisseurs qui exercent `plugin-sdk/provider-http` |
    | `plugin-sdk/test-fixtures` | Jeux de données génériques locaux au dépôt pour capture d’exécution CLI, contexte de sandbox, rédacteur de skill, message d’agent, événement système, rechargement de module, chemin de plugin groupé, texte de terminal, découpage, jeton d’authentification et cas typés |
    | `plugin-sdk/test-node-mocks` | Assistants ciblés, locaux au dépôt, de mocks des modules intégrés Node à utiliser dans les fabriques Vitest `vi.mock("node:*")` |
  </Accordion>

  <Accordion title="Sous-chemins de mémoire">
    | Sous-chemin | Exports principaux |
    | --- | --- |
    | `plugin-sdk/memory-core` | Surface d’assistants memory-core groupée pour les assistants de gestionnaire/configuration/fichier/CLI |
    | `plugin-sdk/memory-core-engine-runtime` | Façade d’exécution d’indexation/recherche mémoire |
    | `plugin-sdk/memory-core-host-embedding-registry` | Assistants légers de registre de fournisseurs d’embeddings mémoire |
    | `plugin-sdk/memory-core-host-engine-foundation` | Exports du moteur de fondation de l’hôte mémoire |
    | `plugin-sdk/memory-core-host-engine-embeddings` | Contrats d’embeddings de l’hôte mémoire, accès au registre, fournisseur local et assistants génériques de lots/distants. `registerMemoryEmbeddingProvider` sur cette surface est obsolète ; utilisez l’API générique de fournisseur d’embeddings pour les nouveaux fournisseurs. |
    | `plugin-sdk/memory-core-host-engine-qmd` | Exports du moteur QMD de l’hôte mémoire |
    | `plugin-sdk/memory-core-host-engine-storage` | Exports du moteur de stockage de l’hôte mémoire |
    | `plugin-sdk/memory-core-host-multimodal` | Assistants multimodaux de l’hôte mémoire |
    | `plugin-sdk/memory-core-host-query` | Assistants de requête de l’hôte mémoire |
    | `plugin-sdk/memory-core-host-secret` | Assistants de secrets de l’hôte mémoire |
    | `plugin-sdk/memory-core-host-events` | Alias de compatibilité obsolète ; utilisez `plugin-sdk/memory-host-events` |
    | `plugin-sdk/memory-core-host-status` | Assistants d’état de l’hôte mémoire |
    | `plugin-sdk/memory-core-host-runtime-cli` | Assistants d’exécution CLI de l’hôte mémoire |
    | `plugin-sdk/memory-core-host-runtime-core` | Assistants d’exécution du noyau de l’hôte mémoire |
    | `plugin-sdk/memory-core-host-runtime-files` | Assistants de fichiers/exécution de l’hôte mémoire |
    | `plugin-sdk/memory-host-core` | Alias indépendant du fournisseur pour les assistants d’exécution du noyau de l’hôte mémoire |
    | `plugin-sdk/memory-host-events` | Alias indépendant du fournisseur pour les assistants de journal d’événements de l’hôte mémoire |
    | `plugin-sdk/memory-host-files` | Alias de compatibilité obsolète ; utilisez `plugin-sdk/memory-core-host-runtime-files` |
    | `plugin-sdk/memory-host-markdown` | Assistants partagés de markdown géré pour les plugins adjacents à la mémoire |
    | `plugin-sdk/memory-host-search` | Façade d’exécution Active Memory pour l’accès au gestionnaire de recherche |
    | `plugin-sdk/memory-host-status` | Alias de compatibilité obsolète ; utilisez `plugin-sdk/memory-core-host-status` |
  </Accordion>

  <Accordion title="Sous-chemins réservés d’assistants groupés">
    Les sous-chemins SDK réservés d’assistants groupés sont des surfaces ciblées propres à un propriétaire pour
    le code de plugins groupés. Ils sont suivis dans l’inventaire du SDK afin que les builds
    de packages et les alias restent déterministes, mais ce ne sont pas des API générales
    de création de plugins. Les nouveaux contrats hôtes réutilisables doivent utiliser des sous-chemins SDK génériques
    tels que `plugin-sdk/gateway-runtime`, `plugin-sdk/security-runtime` et
    `plugin-sdk/plugin-config-runtime`.

    | Sous-chemin | Propriétaire et objectif |
    | --- | --- |
    | `plugin-sdk/codex-mcp-projection` | Assistant du plugin Codex groupé pour projeter la configuration de serveur MCP utilisateur dans la configuration de thread du serveur d’application Codex |
    | `plugin-sdk/codex-native-task-runtime` | Assistant du plugin Codex groupé pour refléter les sous-agents natifs du serveur d’application Codex dans l’état de tâche OpenClaw |

  </Accordion>
</AccordionGroup>

## Connexe

- [Vue d’ensemble du SDK Plugin](/fr/plugins/sdk-overview)
- [Configuration du SDK Plugin](/fr/plugins/sdk-setup)
- [Créer des plugins](/fr/plugins/building-plugins)
