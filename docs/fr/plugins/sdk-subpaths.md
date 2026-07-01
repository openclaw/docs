---
read_when:
    - Choisir le bon sous-chemin plugin-sdk pour une importation de plugin
    - Audit des sous-chemins de Plugins intégrés et des surfaces d’assistance
summary: 'Catalogue des sous-chemins du SDK Plugin : quels imports se trouvent où, regroupés par domaine'
title: Sous-chemins du Plugin SDK
x-i18n:
    generated_at: "2026-07-01T08:01:52Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 689af6c9c17eb6b3231c5f445d7de0af97d1a8a087bdbc26640851d4b11ada2b
    source_path: plugins/sdk-subpaths.md
    workflow: 16
---

Le SDK de Plugin est exposé sous la forme d’un ensemble de sous-chemins publics étroits sous
`openclaw/plugin-sdk/`. Cette page répertorie les sous-chemins couramment utilisés, regroupés par
objectif. L’inventaire généré des points d’entrée du compilateur se trouve dans
`scripts/lib/plugin-sdk-entrypoints.json` ; les exports du package constituent le sous-ensemble public
après soustraction des sous-chemins de test/internes locaux au dépôt listés dans
`scripts/lib/plugin-sdk-private-local-only-subpaths.json`. Les mainteneurs peuvent auditer
le nombre d’exports publics avec `pnpm plugin-sdk:surface` et les sous-chemins d’assistants réservés actifs
avec `pnpm plugins:boundary-report:summary` ; les exports d’assistants réservés inutilisés
font échouer le rapport CI au lieu de rester dans le SDK public comme
dette de compatibilité dormante.

Pour le guide de création de Plugin, consultez [Présentation du SDK de Plugin](/fr/plugins/sdk-overview).

## Entrée de Plugin

| Sous-chemin                    | Exports clés                                                                                                                                                           |
| ------------------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `plugin-sdk/plugin-entry`      | `definePluginEntry`                                                                                                                                                    |
| `plugin-sdk/core`              | `defineChannelPluginEntry`, `createChatChannelPlugin`, `createChannelPluginBase`, `defineSetupPluginEntry`, `buildChannelConfigSchema`, `buildJsonChannelConfigSchema` |
| `plugin-sdk/config-schema`     | `OpenClawSchema`                                                                                                                                                       |
| `plugin-sdk/provider-entry`    | `defineSingleProviderPluginEntry`                                                                                                                                      |
| `plugin-sdk/migration`         | Assistants d’éléments de fournisseur de migration tels que `createMigrationItem`, constantes de motif, marqueurs d’état d’élément, assistants de masquage et `summarizeMigrationItems` |
| `plugin-sdk/migration-runtime` | Assistants de migration à l’exécution tels que `copyMigrationFileItem`, `withCachedMigrationConfigRuntime` et `writeMigrationReport`                                  |
| `plugin-sdk/health`            | Types d’enregistrement de contrôles de santé doctor, de détection, de réparation, de sélection, de sévérité et de constats pour les consommateurs de santé groupés      |

### Assistants de compatibilité obsolètes et de test

Les sous-chemins obsolètes restent exportés pour les Plugins plus anciens, mais le nouveau code doit utiliser les
sous-chemins SDK ciblés ci-dessous. La liste maintenue est
`scripts/lib/plugin-sdk-deprecated-public-subpaths.json` ; la CI rejette les imports de production groupés
qui en proviennent. Les barrels larges tels que `compat`, `config-types`,
`infra-runtime`, `text-runtime` et `zod` servent uniquement à la compatibilité. Importez `zod`
directement depuis `zod`.

Les sous-chemins d’assistants de test d’OpenClaw adossés à Vitest sont uniquement locaux au dépôt et ne sont
plus des exports du package : `agent-runtime-test-contracts`,
`channel-contract-testing`, `channel-target-testing`, `channel-test-helpers`,
`plugin-test-api`, `plugin-test-contracts`, `plugin-test-runtime`,
`provider-http-test-mocks`, `provider-test-contracts`, `test-env`,
`test-fixtures`, `test-node-mocks` et `testing`.

### Sous-chemins d’assistants réservés de Plugins groupés

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
    | `plugin-sdk/json-schema-runtime` | Assistant de validation JSON Schema mis en cache pour les schémas appartenant aux Plugins |
    | `plugin-sdk/channel-setup` | `createOptionalChannelSetupSurface`, `createOptionalChannelSetupAdapter`, `createOptionalChannelSetupWizard`, plus `DEFAULT_ACCOUNT_ID`, `createTopLevelChannelDmPolicy`, `setSetupChannelEnabled`, `splitSetupEntries` |
    | `plugin-sdk/setup` | Assistants partagés de l’assistant de configuration, traducteur de configuration, invites de liste d’autorisation, constructeurs d’état de configuration |
    | `plugin-sdk/setup-runtime` | `createSetupTranslator`, `createPatchedAccountSetupAdapter`, `createEnvPatchedAccountSetupAdapter`, `createSetupInputPresenceValidator`, `noteChannelLookupFailure`, `noteChannelLookupSummary`, `promptResolvedAllowFrom`, `splitSetupEntries`, `createAllowlistSetupWizardProxy`, `createDelegatedSetupWizardProxy` |
    | `plugin-sdk/setup-adapter-runtime` | Alias de compatibilité obsolète ; utilisez `plugin-sdk/setup-runtime` |
    | `plugin-sdk/setup-tools` | `formatCliCommand`, `detectBinary`, `extractArchive`, `resolveBrewExecutable`, `formatDocsLink`, `CONFIG_DIR` |
    | `plugin-sdk/account-core` | Assistants de configuration multi-compte et de garde d’action, assistants de repli vers le compte par défaut |
    | `plugin-sdk/account-id` | `DEFAULT_ACCOUNT_ID`, assistants de normalisation d’identifiant de compte |
    | `plugin-sdk/account-resolution` | Assistants de recherche de compte et de repli par défaut |
    | `plugin-sdk/account-helpers` | Assistants ciblés de liste de comptes et d’actions de compte |
    | `plugin-sdk/access-groups` | Assistants d’analyse de liste d’autorisation de groupes d’accès et de diagnostics de groupes expurgés |
    | `plugin-sdk/channel-pairing` | `createChannelPairingController` |
    | `plugin-sdk/channel-reply-pipeline` | Façade de compatibilité obsolète. Utilisez `plugin-sdk/channel-outbound`. |
    | `plugin-sdk/channel-config-helpers` | `createHybridChannelConfigAdapter`, `resolveChannelDmAccess`, `resolveChannelDmAllowFrom`, `resolveChannelDmPolicy`, `normalizeChannelDmPolicy`, `normalizeLegacyDmAliases` |
    | `plugin-sdk/channel-config-schema` | Primitives partagées de schéma de configuration de canal, plus constructeurs Zod et JSON/TypeBox directs |
    | `plugin-sdk/bundled-channel-config-schema` | Schémas de configuration de canal OpenClaw intégrés, réservés aux Plugins intégrés maintenus |
    | `plugin-sdk/chat-channel-ids` | `BUNDLED_CHAT_CHANNEL_IDS`, `BUNDLED_CHAT_CHANNEL_ENVELOPE_PREFIXES`, `ChatChannelId`. Identifiants canoniques des canaux de chat intégrés/officiels, plus libellés/alias de formateur pour les Plugins qui doivent reconnaître le texte préfixé par enveloppe sans coder leur propre table en dur. |
    | `plugin-sdk/channel-config-schema-legacy` | Alias de compatibilité obsolète pour les schémas de configuration de canal intégré |
    | `plugin-sdk/telegram-command-config` | Assistants de normalisation/validation de commandes personnalisées Telegram avec repli sur contrat intégré |
    | `plugin-sdk/command-gating` | Assistants ciblés de garde d’autorisation de commandes |
    | `plugin-sdk/channel-policy` | `resolveChannelGroupRequireMention` |
    | `plugin-sdk/channel-ingress` | Façade de compatibilité obsolète d’entrée de canal bas niveau. Les nouveaux chemins de réception doivent utiliser `plugin-sdk/channel-ingress-runtime`. |
    | `plugin-sdk/channel-ingress-runtime` | Résolveur expérimental de runtime d’entrée de canal haut niveau et constructeurs de faits de routage pour les chemins de réception de canal migrés. Préférez-le à l’assemblage des listes d’autorisation effectives, des listes d’autorisation de commandes et des projections héritées dans chaque Plugin. Voir [API d’entrée de canal](/fr/plugins/sdk-channel-ingress). |
    | `plugin-sdk/channel-lifecycle` | Façade de compatibilité obsolète. Utilisez `plugin-sdk/channel-outbound`. |
    | `plugin-sdk/channel-outbound` | Contrats de cycle de vie des messages, plus options de pipeline de réponse, accusés de réception, aperçu en direct/streaming, assistants de cycle de vie, identité sortante, planification de charge utile, envois durables et assistants de contexte d’envoi de message. Voir [API de sortie de canal](/fr/plugins/sdk-channel-outbound). |
    | `plugin-sdk/channel-message` | Alias de compatibilité obsolète pour `plugin-sdk/channel-outbound`, plus façades héritées de répartition de réponses. |
    | `plugin-sdk/channel-message-runtime` | Alias de compatibilité obsolète pour `plugin-sdk/channel-outbound`, plus façades héritées de répartition de réponses. |
    | `plugin-sdk/inbound-envelope` | Assistants partagés de route entrante et de construction d’enveloppe |
    | `plugin-sdk/inbound-reply-dispatch` | Façade de compatibilité obsolète. Utilisez `plugin-sdk/channel-inbound` pour les exécutants entrants et les prédicats de répartition, et `plugin-sdk/channel-outbound` pour les assistants de livraison de messages. |
    | `plugin-sdk/messaging-targets` | Alias obsolète d’analyse de cible ; utilisez `plugin-sdk/channel-targets` |
    | `plugin-sdk/outbound-media` | Assistants partagés de chargement de médias sortants et d’état de médias hébergés |
    | `plugin-sdk/outbound-send-deps` | Façade de compatibilité obsolète. Utilisez `plugin-sdk/channel-outbound`. |
    | `plugin-sdk/outbound-runtime` | Façade de compatibilité obsolète. Utilisez `plugin-sdk/channel-outbound`. |
    | `plugin-sdk/poll-runtime` | Assistants ciblés de normalisation de sondage |
    | `plugin-sdk/thread-bindings-runtime` | Cycle de vie des liaisons de fil et assistants d’adaptateur |
    | `plugin-sdk/agent-media-payload` | Constructeur hérité de charge utile média d’agent |
    | `plugin-sdk/conversation-runtime` | Assistants de conversation/liaison de fil, d’appariement et de liaison configurée |
    | `plugin-sdk/runtime-config-snapshot` | Assistant d’instantané de configuration de runtime |
    | `plugin-sdk/runtime-group-policy` | Assistants de résolution de stratégie de groupe au runtime |
    | `plugin-sdk/channel-status` | Assistants partagés d’instantané/résumé d’état de canal |
    | `plugin-sdk/channel-config-primitives` | Primitives ciblées de schéma de configuration de canal |
    | `plugin-sdk/channel-config-writes` | Assistants d’autorisation d’écriture de configuration de canal |
    | `plugin-sdk/channel-plugin-common` | Exports partagés de préambule de Plugin de canal |
    | `plugin-sdk/allowlist-config-edit` | Assistants de modification/lecture de configuration de liste d’autorisation |
    | `plugin-sdk/group-access` | Assistants partagés de décision d’accès de groupe |
    | `plugin-sdk/direct-dm`, `plugin-sdk/direct-dm-access` | Façades de compatibilité obsolètes. Utilisez `plugin-sdk/channel-inbound`. |
    | `plugin-sdk/direct-dm-guard-policy` | Assistants ciblés de stratégie de garde de message direct pré-crypto |
    | `plugin-sdk/discord` | Façade de compatibilité Discord obsolète pour `@openclaw/discord@2026.3.13` publié et la compatibilité propriétaire suivie ; les nouveaux Plugins doivent utiliser les sous-chemins génériques du SDK de canal |
    | `plugin-sdk/telegram-account` | Façade de compatibilité obsolète de résolution de compte Telegram pour la compatibilité propriétaire suivie ; les nouveaux Plugins doivent utiliser les assistants de runtime injectés ou les sous-chemins génériques du SDK de canal |
    | `plugin-sdk/zalouser` | Façade de compatibilité obsolète Zalo Personal pour les packages Lark/Zalo publiés qui importent encore l’autorisation des commandes de l’expéditeur ; les nouveaux Plugins doivent utiliser `plugin-sdk/command-auth` |
    | `plugin-sdk/interactive-runtime` | Présentation sémantique des messages, livraison et assistants hérités de réponse interactive. Voir [Présentation des messages](/fr/plugins/message-presentation) |
    | `plugin-sdk/channel-inbound` | Assistants entrants partagés pour la classification d’événements, la construction de contexte, la mise en forme, les racines, l’anti-rebond, la correspondance de mentions, la stratégie de mention et la journalisation entrante |
    | `plugin-sdk/channel-inbound-debounce` | Assistants ciblés d’anti-rebond entrant |
    | `plugin-sdk/channel-mention-gating` | Assistants ciblés de stratégie de mention, de marqueur de mention et de texte de mention sans la surface plus large du runtime entrant |
    | `plugin-sdk/channel-envelope`, `plugin-sdk/channel-inbound-roots`, `plugin-sdk/channel-location`, `plugin-sdk/channel-logging` | Façades de compatibilité obsolètes. Utilisez `plugin-sdk/channel-inbound` ou `plugin-sdk/channel-outbound`. |
    | `plugin-sdk/channel-pairing-paths` | Façade de compatibilité obsolète. Utilisez `plugin-sdk/channel-pairing`. |
    | `plugin-sdk/channel-reply-options-runtime` | Façade de compatibilité obsolète. Utilisez `plugin-sdk/channel-outbound`. |
    | `plugin-sdk/channel-streaming` | Façade de compatibilité obsolète. Utilisez `plugin-sdk/channel-outbound`. |
    | `plugin-sdk/channel-send-result` | Types de résultat de réponse |
    | `plugin-sdk/channel-actions` | Assistants d’actions de message de canal, plus assistants de schéma natif obsolètes conservés pour la compatibilité des Plugins |
    | `plugin-sdk/channel-route` | Assistants partagés de normalisation de route, résolution de cible pilotée par analyseur, sérialisation d’identifiant de fil, clés de route de déduplication/compactes, types de cible analysée et comparaison route/cible |
    | `plugin-sdk/channel-targets` | Assistants d’analyse de cible ; les appelants de comparaison de routes doivent utiliser `plugin-sdk/channel-route` |
    | `plugin-sdk/channel-contract` | Types de contrat de canal |
    | `plugin-sdk/channel-feedback` | Câblage des retours/réactions |
    | `plugin-sdk/channel-secret-runtime` | Assistants ciblés de contrat de secret tels que `collectSimpleChannelFieldAssignments`, `getChannelSurface`, `pushAssignment` et types de cible secrète |
  </Accordion>

Les familles d’aides de canal obsolètes restent disponibles uniquement pour la compatibilité avec les Plugins publiés. Le plan de suppression est le suivant : les conserver pendant la fenêtre de migration des Plugins externes, maintenir les Plugins du dépôt/intégrés sur `channel-inbound` et `channel-outbound`, puis supprimer les sous-chemins de compatibilité lors du prochain grand nettoyage du SDK. Cela s’applique aux anciennes familles de message/runtime de canal, de streaming de canal, d’accès direct aux DM, de sous-famille d’aides entrantes, d’options de réponse et de chemins d’appairage.

  <Accordion title="Sous-chemins des fournisseurs">
    | Sous-chemin | Exportations clés |
    | --- | --- |
    | `plugin-sdk/provider-entry` | `defineSingleProviderPluginEntry` |
    | `plugin-sdk/lmstudio` | Façade de fournisseur LM Studio prise en charge pour la configuration, la découverte du catalogue et la préparation des modèles au runtime |
    | `plugin-sdk/lmstudio-runtime` | Façade runtime LM Studio prise en charge pour les valeurs par défaut du serveur local, la découverte des modèles, les en-têtes de requête et les helpers de modèles chargés |
    | `plugin-sdk/provider-setup` | Helpers sélectionnés de configuration de fournisseur local/auto-hébergé |
    | `plugin-sdk/self-hosted-provider-setup` | Helpers ciblés de configuration de fournisseur auto-hébergé compatible OpenAI |
    | `plugin-sdk/cli-backend` | Valeurs par défaut du backend CLI + constantes de watchdog |
    | `plugin-sdk/provider-auth-runtime` | Helpers de résolution de clé d’API au runtime pour les Plugins de fournisseur |
    | `plugin-sdk/provider-oauth-runtime` | Types génériques de rappel OAuth de fournisseur, rendu de page de rappel, helpers PKCE/état, analyse de l’entrée d’autorisation, helpers d’expiration de jeton et helpers d’abandon |
    | `plugin-sdk/provider-auth-api-key` | Helpers d’intégration/écriture de profil par clé d’API, comme `upsertApiKeyProfile` |
    | `plugin-sdk/provider-auth-result` | Constructeur standard de résultat d’authentification OAuth |
    | `plugin-sdk/provider-env-vars` | Helpers de recherche de variables d’environnement d’authentification de fournisseur |
    | `plugin-sdk/provider-auth` | `createProviderApiKeyAuthMethod`, `ensureApiKeyFromOptionEnvOrPrompt`, `upsertAuthProfile`, `upsertApiKeyProfile`, `writeOAuthCredentials`, helpers d’importation d’authentification OpenAI Codex, export de compatibilité obsolète `resolveOpenClawAgentDir` |
    | `plugin-sdk/provider-model-shared` | `ProviderReplayFamily`, `buildProviderReplayFamilyHooks`, `normalizeModelCompat`, constructeurs partagés de politique de replay, helpers de point de terminaison de fournisseur et helpers partagés de normalisation d’ID de modèle |
    | `plugin-sdk/provider-catalog-live-runtime` | Helpers de catalogue de modèles de fournisseur en direct pour la découverte protégée de type `/models` : `buildLiveModelProviderConfig`, `fetchLiveProviderModelRows`, `getCachedLiveProviderModelRows`, `fetchLiveProviderModelIds`, `LiveModelCatalogHttpError`, `clearLiveCatalogCacheForTests`, filtrage d’ID de modèle, cache TTL et repli statique |
    | `plugin-sdk/provider-catalog-runtime` | Hook runtime d’enrichissement de catalogue de fournisseur et coutures de registre plugin-fournisseur pour les tests de contrat |
    | `plugin-sdk/provider-catalog-shared` | `findCatalogTemplate`, `buildSingleProviderApiKeyCatalog`, `buildManifestModelProviderConfig`, `supportsNativeStreamingUsageCompat`, `applyProviderNativeStreamingUsageCompat` |
    | `plugin-sdk/provider-http` | Helpers génériques de capacité HTTP/point de terminaison de fournisseur, erreurs HTTP de fournisseur et helpers de formulaire multipart pour la transcription audio |
    | `plugin-sdk/provider-web-fetch-contract` | Helpers de contrat étroit de configuration/sélection de récupération web, comme `enablePluginInConfig` et `WebFetchProviderPlugin` |
    | `plugin-sdk/provider-web-fetch` | Helpers d’enregistrement/cache de fournisseur de récupération web |
    | `plugin-sdk/provider-web-search-config-contract` | Helpers étroits de configuration/identifiants de recherche web pour les fournisseurs qui n’ont pas besoin de câblage d’activation de Plugin |
    | `plugin-sdk/provider-web-search-contract` | Helpers étroits de contrat de configuration/identifiants de recherche web, comme `createWebSearchProviderContractFields`, `enablePluginInConfig`, `resolveProviderWebSearchPluginConfig` et les accesseurs/mutateurs d’identifiants à portée limitée |
    | `plugin-sdk/provider-web-search` | Helpers d’enregistrement/cache/runtime de fournisseur de recherche web |
    | `plugin-sdk/embedding-providers` | Types généraux de fournisseurs d’embeddings et helpers de lecture, notamment `EmbeddingProviderAdapter`, `getEmbeddingProvider(...)` et `listEmbeddingProviders(...)` ; les Plugins enregistrent les fournisseurs via `api.registerEmbeddingProvider(...)` afin que la propriété du manifeste soit appliquée |
    | `plugin-sdk/provider-tools` | `ProviderToolCompatFamily`, `buildProviderToolCompatFamilyHooks` et nettoyage de schémas + diagnostics DeepSeek/Gemini/OpenAI |
    | `plugin-sdk/provider-usage` | Types d’instantanés d’utilisation de fournisseur, helpers partagés de récupération de l’utilisation et récupérateurs de fournisseur comme `fetchClaudeUsage` |
    | `plugin-sdk/provider-stream` | `ProviderStreamFamily`, `buildProviderStreamFamilyHooks`, `composeProviderStreamWrappers`, types de wrappers de flux, compatibilité des appels d’outil en texte brut et helpers partagés de wrappers Anthropic/Bedrock/DeepSeek V4/Google/Kilocode/Moonshot/OpenAI/OpenRouter/Z.A.I/MiniMax/Copilot |
    | `plugin-sdk/provider-stream-shared` | Helpers publics partagés de wrappers de flux de fournisseur, notamment `composeProviderStreamWrappers`, `createOpenAICompatibleCompletionsThinkingOffWrapper`, `createPlainTextToolCallCompatWrapper`, `createPayloadPatchStreamWrapper`, `createToolStreamWrapper`, `normalizeOpenAICompatibleReasoningPayload`, `setQwenChatTemplateThinking` et utilitaires de flux compatibles Anthropic/DeepSeek/OpenAI |
    | `plugin-sdk/provider-transport-runtime` | Helpers de transport natif de fournisseur, comme la récupération protégée, l’extraction de texte de résultat d’outil, les transformations de messages de transport et les flux d’événements de transport inscriptibles |
    | `plugin-sdk/provider-onboard` | Helpers de correctif de configuration d’intégration |
    | `plugin-sdk/global-singleton` | Helpers de singleton/map/cache locaux au processus |
    | `plugin-sdk/group-activation` | Mode d’activation de groupe étroit et helpers d’analyse de commandes |
  </Accordion>

Les instantanés d’utilisation des fournisseurs signalent normalement une ou plusieurs `windows` de quota, chacune avec
un libellé, un pourcentage utilisé et une heure de réinitialisation facultative. Les fournisseurs qui exposent un solde ou
un texte d’état de compte au lieu de fenêtres de quota réinitialisables doivent renvoyer
`summary` avec un tableau `windows` vide plutôt que de fabriquer des pourcentages.
OpenClaw affiche ce texte de résumé dans la sortie d’état ; utilisez `error` uniquement lorsque
le point de terminaison d’utilisation a échoué ou n’a renvoyé aucune donnée d’utilisation exploitable.

  <Accordion title="Sous-chemins d’authentification et de sécurité">
    | Sous-chemin | Exportations clés |
    | --- | --- |
    | `plugin-sdk/command-auth` | `resolveControlCommandGate`, helpers de registre de commandes incluant le formatage dynamique des menus d’arguments, helpers d’autorisation de l’expéditeur |
    | `plugin-sdk/command-status` | Constructeurs de messages de commande/aide comme `buildCommandsMessagePaginated` et `buildHelpMessage` |
    | `plugin-sdk/approval-auth-runtime` | Résolution d’approbateur et helpers d’authentification d’action dans la même discussion |
    | `plugin-sdk/approval-client-runtime` | Helpers de profil/filtre d’approbation d’exécution native |
    | `plugin-sdk/approval-delivery-runtime` | Adaptateurs natifs de capacité/livraison d’approbation |
    | `plugin-sdk/approval-gateway-runtime` | Helper partagé de résolution de Gateway d’approbation |
    | `plugin-sdk/approval-handler-adapter-runtime` | Helpers légers de chargement d’adaptateur d’approbation natif pour les points d’entrée de canaux chauds |
    | `plugin-sdk/approval-handler-runtime` | Helpers runtime plus larges de gestionnaire d’approbation ; préférez les coutures plus étroites d’adaptateur/Gateway lorsqu’elles suffisent |
    | `plugin-sdk/approval-native-runtime` | Helpers de cible d’approbation native, liaison de compte, garde de route, repli de transfert et suppression d’invite locale d’exécution native |
    | `plugin-sdk/approval-reaction-runtime` | Liaisons de réactions d’approbation codées en dur, charges utiles d’invite de réaction, magasins de cibles de réaction et export de compatibilité pour la suppression d’invite locale d’exécution native |
    | `plugin-sdk/approval-reply-runtime` | Helpers de charges utiles de réponse d’approbation d’exécution/Plugin |
    | `plugin-sdk/approval-runtime` | Helpers de charges utiles d’approbation d’exécution/Plugin, helpers de routage/runtime d’approbation native et helpers d’affichage structuré d’approbation comme `formatApprovalDisplayPath` |
    | `plugin-sdk/reply-dedupe` | Helpers étroits de réinitialisation de déduplication de réponses entrantes |
    | `plugin-sdk/channel-contract-testing` | Helpers étroits de tests de contrat de canal sans le large barrel de test |
    | `plugin-sdk/command-auth-native` | Authentification native des commandes, formatage dynamique des menus d’arguments et helpers natifs de cible de session |
    | `plugin-sdk/command-detection` | Helpers partagés de détection de commandes |
    | `plugin-sdk/command-primitives-runtime` | Prédicats légers de texte de commande pour les chemins de canaux chauds |
    | `plugin-sdk/command-surface` | Normalisation du corps de commande et helpers de surface de commande |
    | `plugin-sdk/allow-from` | `formatAllowFromLowercase` |
    | `plugin-sdk/channel-secret-runtime` | Helpers étroits de collecte de contrats de secrets pour les surfaces de secrets de canal/Plugin |
    | `plugin-sdk/secret-ref-runtime` | Helpers étroits `coerceSecretRef` et de typage SecretRef pour l’analyse de contrat/configuration de secrets |
    | `plugin-sdk/secret-provider-integration` | Contrats de manifeste et de préréglages d’intégration de fournisseur SecretRef uniquement typés pour les Plugins qui publient des préréglages de fournisseurs de secrets externes |
    | `plugin-sdk/security-runtime` | Helpers partagés de confiance, filtrage des messages privés, fichiers/chemins bornés à la racine, incluant les écritures en création seule, remplacement atomique synchrone/asynchrone de fichiers, écritures temporaires voisines, repli de déplacement entre appareils, helpers de magasin de fichiers privé, gardes de parents de liens symboliques, contenu externe, masquage de texte sensible, comparaison de secrets en temps constant et helpers de collecte de secrets |
    | `plugin-sdk/ssrf-policy` | Helpers de liste d’autorisation d’hôtes et de politique SSRF de réseau privé |
    | `plugin-sdk/ssrf-dispatcher` | Helpers étroits de dispatcher épinglé sans la large surface runtime d’infrastructure |
    | `plugin-sdk/ssrf-runtime` | Dispatcher épinglé, récupération protégée contre la SSRF, erreur SSRF et helpers de politique SSRF |
    | `plugin-sdk/secret-input` | Helpers d’analyse d’entrée de secret |
    | `plugin-sdk/webhook-ingress` | Helpers de requête/cible de Webhook et coercition brute de websocket/corps |
    | `plugin-sdk/webhook-request-guards` | Helpers de taille/expiration du corps de requête |
  </Accordion>

  <Accordion title="Sous-chemins d’exécution et de stockage">
    | Sous-chemin | Exports clés |
    | --- | --- |
    | `plugin-sdk/runtime` | Assistants larges d’exécution, de journalisation, de sauvegarde et d’installation de plugins |
    | `plugin-sdk/runtime-env` | Assistants ciblés pour l’environnement d’exécution, le journaliseur, les délais d’expiration, les nouvelles tentatives et le backoff |
    | `plugin-sdk/browser-config` | Façade de configuration de navigateur prise en charge pour la normalisation des profils/valeurs par défaut, l’analyse des URL CDP et les assistants d’authentification du contrôle de navigateur |
    | `plugin-sdk/agent-harness-task-runtime` | Assistants génériques de cycle de vie des tâches et de livraison de complétion pour les agents adossés à un harnais utilisant une portée de tâche émise par l’hôte |
    | `plugin-sdk/codex-mcp-projection` | Assistant Codex groupé réservé pour projeter la configuration de serveur MCP de l’utilisateur dans la configuration de thread Codex ; non destiné aux plugins tiers |
    | `plugin-sdk/codex-native-task-runtime` | Assistant Codex groupé privé pour le câblage de miroir/exécution de tâche native ; non destiné aux plugins tiers |
    | `plugin-sdk/channel-runtime-context` | Assistants génériques d’enregistrement et de recherche de contexte d’exécution de canal |
    | `plugin-sdk/matrix` | Façade de compatibilité Matrix obsolète pour les anciens packages de canaux tiers ; les nouveaux plugins doivent importer directement `plugin-sdk/run-command` |
    | `plugin-sdk/mattermost` | Façade de compatibilité Mattermost obsolète pour les anciens packages de canaux tiers ; les nouveaux plugins doivent importer directement les sous-chemins génériques du SDK |
    | `plugin-sdk/runtime-store` | `createPluginRuntimeStore` |
    | `plugin-sdk/plugin-runtime` | Assistants partagés pour les commandes, hooks, HTTP et interactions de plugin |
    | `plugin-sdk/hook-runtime` | Assistants partagés de pipeline de Webhook/hook interne |
    | `plugin-sdk/lazy-runtime` | Assistants d’importation/liaison d’exécution différée tels que `createLazyRuntimeModule`, `createLazyRuntimeMethod` et `createLazyRuntimeSurface` |
    | `plugin-sdk/process-runtime` | Assistants d’exécution de processus |
    | `plugin-sdk/cli-runtime` | Assistants CLI de formatage, d’attente, de version, d’invocation d’arguments et de groupes de commandes différés |
    | `plugin-sdk/qa-live-transport-scenarios` | Identifiants partagés de scénarios QA de transport en direct, assistants de couverture de référence et assistant de sélection de scénarios |
    | `plugin-sdk/gateway-method-runtime` | Assistant réservé de dispatch de méthode Gateway pour les routes HTTP de plugin qui déclarent `contracts.gatewayMethodDispatch: ["authenticated-request"]` |
    | `plugin-sdk/gateway-runtime` | Client Gateway, assistant de démarrage de client prêt pour la boucle d’événements, RPC CLI de Gateway, erreurs de protocole Gateway et assistants de patch de statut de canal |
    | `plugin-sdk/config-contracts` | Surface de configuration ciblée, uniquement typée, pour les formes de configuration de plugin telles que `OpenClawConfig` et les types de configuration de canal/fournisseur |
    | `plugin-sdk/plugin-config-runtime` | Assistants de recherche de configuration de plugin à l’exécution tels que `requireRuntimeConfig`, `resolvePluginConfigObject` et `resolveLivePluginConfigObject` |
    | `plugin-sdk/config-mutation` | Assistants de mutation transactionnelle de configuration tels que `mutateConfigFile`, `replaceConfigFile` et `logConfigUpdated` |
    | `plugin-sdk/message-tool-delivery-hints` | Chaînes partagées d’indications de métadonnées de livraison d’outils de message |
    | `plugin-sdk/runtime-config-snapshot` | Assistants d’instantané de configuration du processus courant tels que `getRuntimeConfig`, `getRuntimeConfigSnapshot` et les setters d’instantané de test |
    | `plugin-sdk/telegram-command-config` | Normalisation des noms/descriptions de commandes Telegram et contrôles de doublons/conflits, même lorsque la surface de contrat Telegram groupée est indisponible |
    | `plugin-sdk/text-autolink-runtime` | Détection de liens automatiques de références de fichiers sans le large barrel de texte |
    | `plugin-sdk/approval-reaction-runtime` | Liaisons de réactions d’approbation codées en dur, charges utiles de prompts de réaction, magasins de cibles de réaction et export de compatibilité pour la suppression locale des prompts d’exécution native |
    | `plugin-sdk/approval-runtime` | Assistants d’approbation exec/plugin, constructeurs de capacités d’approbation, assistants d’authentification/profil, assistants de routage/exécution natifs et formatage structuré du chemin d’affichage d’approbation |
    | `plugin-sdk/reply-runtime` | Assistants partagés d’exécution d’entrées/réponses, découpage, dispatch, Heartbeat, planificateur de réponses |
    | `plugin-sdk/reply-dispatch-runtime` | Assistants ciblés de dispatch/finalisation de réponse et de libellé de conversation |
    | `plugin-sdk/reply-history` | Assistants partagés d’historique de réponses sur fenêtre courte. Le nouveau code de tours de message doit utiliser `createChannelHistoryWindow` ; les assistants de map de plus bas niveau restent uniquement des exports de compatibilité obsolètes |
    | `plugin-sdk/reply-reference` | `createReplyReferencePlanner` |
    | `plugin-sdk/reply-chunking` | Assistants ciblés de découpage texte/Markdown |
    | `plugin-sdk/session-store-runtime` | Assistants de workflow de session (`getSessionEntry`, `listSessionEntries`, `patchSessionEntry`, `upsertSessionEntry`), lectures bornées de texte de transcript utilisateur/assistant récent par identité de session, assistants d’ancien chemin de magasin de sessions/clé de session, lectures updated-at et assistants de compatibilité de transition uniquement pour magasin entier/chemin de fichier |
    | `plugin-sdk/session-transcript-runtime` | Identité de transcript, assistants ciblés de cible/lecture/écriture, publication de mises à jour, verrous d’écriture et clés de succès mémoire de transcript |
    | `plugin-sdk/sqlite-runtime` | Assistants ciblés de schéma d’agent SQLite, de chemin et de transaction pour l’exécution interne |
    | `plugin-sdk/cron-store-runtime` | Assistants de chemin/chargement/enregistrement du magasin Cron |
    | `plugin-sdk/state-paths` | Assistants de chemins de répertoire d’état/OAuth |
    | `plugin-sdk/plugin-state-runtime` | Types d’état clé SQLite sidecar de Plugin, plus pragma de connexion centralisé et configuration de maintenance WAL pour les bases de données appartenant aux plugins |
    | `plugin-sdk/routing` | Assistants de liaison de route/clé de session/compte tels que `resolveAgentRoute`, `buildAgentSessionKey` et `resolveDefaultAgentBoundAccountId` |
    | `plugin-sdk/status-helpers` | Assistants partagés de résumé de statut de canal/compte, valeurs par défaut d’état d’exécution et assistants de métadonnées d’issue |
    | `plugin-sdk/target-resolver-runtime` | Assistants partagés de résolution de cible |
    | `plugin-sdk/string-normalization-runtime` | Assistants de normalisation de slug/chaîne |
    | `plugin-sdk/request-url` | Extraire les URL sous forme de chaînes depuis des entrées de type fetch/request |
    | `plugin-sdk/run-command` | Exécuteur de commandes temporisé avec résultats stdout/stderr normalisés |
    | `plugin-sdk/param-readers` | Lecteurs courants de paramètres d’outil/CLI |
    | `plugin-sdk/tool-plugin` | Définir un plugin d’outil d’agent typé simple et exposer des métadonnées statiques pour la génération de manifeste |
    | `plugin-sdk/tool-payload` | Extraire les charges utiles normalisées depuis les objets de résultat d’outil |
    | `plugin-sdk/tool-send` | Extraire les champs canoniques de cible d’envoi depuis les arguments d’outil |
    | `plugin-sdk/sandbox` | Types de backend de sandbox et assistants de commandes SSH/OpenShell, y compris une prévalidation de commande exec à échec rapide |
    | `plugin-sdk/temp-path` | Assistants partagés de chemins de téléchargement temporaire et espaces de travail temporaires sécurisés privés |
    | `plugin-sdk/logging-core` | Journaliseur de sous-système et assistants de rédaction |
    | `plugin-sdk/markdown-table-runtime` | Assistants de mode et de conversion de tableaux Markdown |
    | `plugin-sdk/model-session-runtime` | Assistants de substitution modèle/session tels que `applyModelOverrideToSessionEntry` et `resolveAgentMaxConcurrent` |
    | `plugin-sdk/talk-config-runtime` | Assistants de résolution de configuration de fournisseur Talk |
    | `plugin-sdk/json-store` | Petits assistants de lecture/écriture d’état JSON |
    | `plugin-sdk/json-unsafe-integers` | Assistants d’analyse JSON qui préservent les littéraux entiers non sûrs sous forme de chaînes |
    | `plugin-sdk/file-lock` | Assistants de verrouillage de fichier réentrants |
    | `plugin-sdk/persistent-dedupe` | Assistants de cache de déduplication adossé au disque |
    | `plugin-sdk/acp-runtime` | Assistants d’exécution/session ACP et de dispatch de réponse |
    | `plugin-sdk/acp-runtime-backend` | Assistants légers d’enregistrement de backend ACP et de dispatch de réponse pour les plugins chargés au démarrage |
    | `plugin-sdk/acp-binding-resolve-runtime` | Résolution en lecture seule de liaison ACP sans importations de démarrage du cycle de vie |
    | `plugin-sdk/agent-config-primitives` | Primitives ciblées de schéma de configuration d’exécution d’agent |
    | `plugin-sdk/boolean-param` | Lecteur de paramètre booléen permissif |
    | `plugin-sdk/dangerous-name-runtime` | Assistants de résolution de correspondance de noms dangereux |
    | `plugin-sdk/device-bootstrap` | Assistants de bootstrap d’appareil et de jetons d’appairage |
    | `plugin-sdk/extension-shared` | Primitives partagées d’assistants de canal passif, de statut et de proxy ambiant |
    | `plugin-sdk/models-provider-runtime` | Assistants de réponse pour commande/fournisseur `/models` |
    | `plugin-sdk/skill-commands-runtime` | Assistants de listage des commandes de Skills |
    | `plugin-sdk/native-command-registry` | Assistants de registre/construction/sérialisation de commandes natives |
    | `plugin-sdk/agent-harness` | Surface expérimentale de plugin approuvé pour les harnais d’agents bas niveau : types de harnais, assistants de guidage/annulation d’exécution active, assistants de pont d’outils OpenClaw, assistants de politique d’outils de plan d’exécution, classification de résultat terminal, assistants de formatage/détail de progression d’outil et utilitaires de résultat de tentative |
    | `plugin-sdk/provider-zai-endpoint` | Façade obsolète de détection de point de terminaison appartenant au fournisseur Z.AI ; utilisez l’API publique du plugin Z.AI |
    | `plugin-sdk/async-lock-runtime` | Assistant de verrouillage async local au processus pour les petits fichiers d’état d’exécution |
    | `plugin-sdk/channel-activity-runtime` | Assistant de télémétrie d’activité de canal |
    | `plugin-sdk/concurrency-runtime` | Assistant de concurrence bornée de tâches async |
    | `plugin-sdk/dedupe-runtime` | Assistants de cache de déduplication en mémoire |
    | `plugin-sdk/delivery-queue-runtime` | Assistant de vidage des livraisons sortantes en attente |
    | `plugin-sdk/file-access-runtime` | Assistants sûrs de chemins de fichiers locaux et de sources média |
    | `plugin-sdk/heartbeat-runtime` | Assistants de réveil, d’événements et de visibilité Heartbeat |
    | `plugin-sdk/number-runtime` | Assistant de coercition numérique |
    | `plugin-sdk/secure-random-runtime` | Assistants de jetons/UUID sécurisés |
    | `plugin-sdk/system-event-runtime` | Assistants de file d’événements système |
    | `plugin-sdk/transport-ready-runtime` | Assistant d’attente de disponibilité du transport |
    | `plugin-sdk/exec-approvals-runtime` | Assistants de fichiers de politique d’approbation exec sans le large barrel infra-runtime |
    | `plugin-sdk/infra-runtime` | Shim de compatibilité obsolète ; utilisez les sous-chemins d’exécution ciblés ci-dessus |
    | `plugin-sdk/collection-runtime` | Petits assistants de cache borné |
    | `plugin-sdk/diagnostic-runtime` | Assistants d’indicateurs de diagnostic, d’événements et de contexte de trace |
    | `plugin-sdk/error-runtime` | Graphe d’erreurs, formatage, assistants partagés de classification d’erreurs, `isApprovalNotFoundError` |
    | `plugin-sdk/fetch-runtime` | Fetch encapsulé, proxy, option EnvHttpProxyAgent et assistants de lookup épinglé |
    | `plugin-sdk/runtime-fetch` | Fetch d’exécution compatible avec les dispatchers sans imports de proxy/guarded-fetch |
    | `plugin-sdk/inline-image-data-url-runtime` | Nettoyeur d’URL de données d’image inline et assistants de détection de signature sans la large surface d’exécution média |
    | `plugin-sdk/response-limit-runtime` | Lecteur borné de corps de réponse sans la large surface d’exécution média |
    | `plugin-sdk/session-binding-runtime` | État courant de liaison de conversation sans routage de liaison configuré ni magasins d’appairage |
    | `plugin-sdk/session-store-runtime` | Assistants de magasin de sessions sans imports larges d’écritures/maintenance de configuration |
    | `plugin-sdk/sqlite-runtime` | Assistants ciblés de schéma d’agent SQLite, de chemin et de transaction sans contrôles de cycle de vie de base de données |
    | `plugin-sdk/context-visibility-runtime` | Résolution de visibilité du contexte et filtrage de contexte supplémentaire sans imports larges de configuration/sécurité |
    | `plugin-sdk/string-coerce-runtime` | Assistants ciblés de coercition et normalisation de chaînes/enregistrements primitifs sans imports Markdown/journalisation |
    | `plugin-sdk/host-runtime` | Assistants de normalisation de nom d’hôte et d’hôte SCP |
    | `plugin-sdk/retry-runtime` | Assistants de configuration des nouvelles tentatives et d’exécuteur de nouvelles tentatives |
    | `plugin-sdk/agent-runtime` | Assistants de répertoire/identité/espace de travail d’agent, y compris `resolveAgentDir`, `resolveDefaultAgentDir` et l’export de compatibilité obsolète `resolveOpenClawAgentDir` |
    | `plugin-sdk/directory-runtime` | Requête/déduplication de répertoire adossée à la configuration |
    | `plugin-sdk/keyed-async-queue` | `KeyedAsyncQueue` |
  </Accordion>

  <Accordion title="Capability and testing subpaths">
    | Sous-chemin | Exports clés |
    | --- | --- |
    | `plugin-sdk/media-runtime` | Helpers partagés de récupération/transformation/stockage de médias, notamment `saveRemoteMedia`, `saveResponseMedia`, `readRemoteMediaBuffer` et `fetchRemoteMedia` obsolète ; privilégiez les helpers de stockage avant les lectures de tampon lorsqu’une URL doit devenir un média OpenClaw |
    | `plugin-sdk/media-mime` | Normalisation MIME ciblée, mappage des extensions de fichiers, détection MIME et helpers de type de média |
    | `plugin-sdk/media-store` | Helpers ciblés de stockage de médias, tels que `saveMediaBuffer` et `saveMediaStream` |
    | `plugin-sdk/media-generation-runtime` | Helpers partagés de basculement pour la génération de médias, sélection de candidats et messages de modèle manquant |
    | `plugin-sdk/media-understanding` | Types de fournisseurs de compréhension des médias, ainsi qu’exports de helpers d’image/audio/extraction structurée destinés aux fournisseurs |
    | `plugin-sdk/text-chunking` | Helpers de découpage/rendu de texte et de markdown, conversion de tableaux markdown, suppression de balises de directives et utilitaires de texte sûr |
    | `plugin-sdk/text-chunking` | Helper de découpage de texte sortant |
    | `plugin-sdk/speech` | Types de fournisseurs vocaux, ainsi qu’exports destinés aux fournisseurs pour les directives, le registre, la validation, le générateur TTS compatible OpenAI et les helpers vocaux |
    | `plugin-sdk/speech-core` | Types partagés de fournisseurs vocaux, registre, directives, normalisation et exports de helpers vocaux |
    | `plugin-sdk/realtime-transcription` | Types de fournisseurs de transcription en temps réel, helpers de registre et helper partagé de session WebSocket |
    | `plugin-sdk/realtime-bootstrap-context` | Helper d’amorçage de profil en temps réel pour l’injection de contexte bornée `IDENTITY.md`, `USER.md` et `SOUL.md` |
    | `plugin-sdk/realtime-voice` | Types de fournisseurs vocaux en temps réel, helpers de registre et helpers partagés de comportement vocal en temps réel, y compris le suivi de l’activité de sortie |
    | `plugin-sdk/image-generation` | Types de fournisseurs de génération d’images, helpers d’URL de données/ressources d’image et générateur de fournisseur d’images compatible OpenAI |
    | `plugin-sdk/image-generation-core` | Types partagés de génération d’images, helpers de basculement, d’authentification et de registre |
    | `plugin-sdk/music-generation` | Types de fournisseurs/requêtes/résultats de génération musicale |
    | `plugin-sdk/music-generation-core` | Types partagés de génération musicale, helpers de basculement, recherche de fournisseur et analyse de références de modèle |
    | `plugin-sdk/video-generation` | Types de fournisseurs/requêtes/résultats de génération vidéo |
    | `plugin-sdk/video-generation-core` | Types partagés de génération vidéo, helpers de basculement, recherche de fournisseur et analyse de références de modèle |
    | `plugin-sdk/transcripts` | Types partagés de fournisseurs de sources de transcriptions, helpers de registre, descripteurs de session et métadonnées d’énoncés |
    | `plugin-sdk/webhook-targets` | Registre de cibles Webhook et helpers d’installation de routes |
    | `plugin-sdk/webhook-path` | Alias de compatibilité obsolète ; utilisez `plugin-sdk/webhook-ingress` |
    | `plugin-sdk/web-media` | Helpers partagés de chargement de médias distants/locaux |
    | `plugin-sdk/zod` | Réexport de compatibilité obsolète ; importez `zod` directement depuis `zod` |
    | `plugin-sdk/testing` | Module d’export groupé de compatibilité obsolète local au dépôt pour les anciens tests OpenClaw. Les nouveaux tests du dépôt doivent plutôt importer des sous-chemins de test locaux ciblés, tels que `plugin-sdk/agent-runtime-test-contracts`, `plugin-sdk/plugin-test-runtime`, `plugin-sdk/channel-test-helpers`, `plugin-sdk/test-env` ou `plugin-sdk/test-fixtures` |
    | `plugin-sdk/plugin-test-api` | Helper minimal `createTestPluginApi` local au dépôt pour les tests unitaires d’enregistrement direct de plugins sans importer les passerelles de helpers de test du dépôt |
    | `plugin-sdk/agent-runtime-test-contracts` | Fixtures de contrat d’adaptateur agent-runtime natif locales au dépôt pour les tests d’authentification, de livraison, de fallback, de hook d’outil, de superposition de prompt, de schéma et de projection de transcription |
    | `plugin-sdk/channel-test-helpers` | Helpers de test orientés canal locaux au dépôt pour les contrats génériques d’actions/configuration/statut, assertions de répertoire, cycle de vie de démarrage de compte, enfilage de configuration d’envoi, mocks d’exécution, problèmes de statut, livraison sortante et enregistrement de hooks |
    | `plugin-sdk/channel-target-testing` | Suite partagée locale au dépôt de cas d’erreur de résolution de cible pour les tests de canaux |
    | `plugin-sdk/plugin-test-contracts` | Helpers de contrats locaux au dépôt pour le package Plugin, l’enregistrement, les artefacts publics, l’import direct, l’API d’exécution et les effets de bord d’import |
    | `plugin-sdk/provider-test-contracts` | Helpers de contrats locaux au dépôt pour l’exécution de fournisseur, l’authentification, la découverte, l’onboarding, le catalogue, l’assistant, les capacités médias, la politique de relecture, l’audio en direct STT temps réel, la recherche/récupération web et le flux |
    | `plugin-sdk/provider-http-test-mocks` | Mocks HTTP/auth Vitest optionnels locaux au dépôt pour les tests de fournisseurs qui exercent `plugin-sdk/provider-http` |
    | `plugin-sdk/test-fixtures` | Fixtures génériques locales au dépôt pour la capture d’exécution CLI, le contexte sandbox, l’écriture de skill, les messages d’agent, les événements système, le rechargement de module, le chemin de Plugin groupé, le texte de terminal, le découpage, les jetons d’authentification et les cas typés |
    | `plugin-sdk/test-node-mocks` | Helpers ciblés locaux au dépôt pour les mocks des modules intégrés Node à utiliser dans les factories Vitest `vi.mock("node:*")` |
  </Accordion>

  <Accordion title="Sous-chemins de mémoire">
    | Sous-chemin | Exportations clés |
    | --- | --- |
    | `plugin-sdk/memory-core` | Surface d’utilitaires memory-core intégrée pour les utilitaires de gestionnaire/configuration/fichier/CLI |
    | `plugin-sdk/memory-core-engine-runtime` | Façade d’exécution d’indexation/recherche de mémoire |
    | `plugin-sdk/memory-core-host-embedding-registry` | Utilitaires légers de registre des fournisseurs de plongements mémoire |
    | `plugin-sdk/memory-core-host-engine-foundation` | Exportations du moteur de fondation de l’hôte de mémoire |
    | `plugin-sdk/memory-core-host-engine-embeddings` | Contrats de plongements de l’hôte de mémoire, accès au registre, fournisseur local et utilitaires génériques de traitement par lots/distants. `registerMemoryEmbeddingProvider` sur cette surface est obsolète ; utilisez l’API générique de fournisseur de plongements pour les nouveaux fournisseurs. |
    | `plugin-sdk/memory-core-host-engine-qmd` | Exportations du moteur QMD de l’hôte de mémoire |
    | `plugin-sdk/memory-core-host-engine-storage` | Exportations du moteur de stockage de l’hôte de mémoire |
    | `plugin-sdk/memory-core-host-multimodal` | Utilitaires multimodaux de l’hôte de mémoire |
    | `plugin-sdk/memory-core-host-query` | Utilitaires de requête de l’hôte de mémoire |
    | `plugin-sdk/memory-core-host-secret` | Utilitaires de secrets de l’hôte de mémoire |
    | `plugin-sdk/memory-core-host-events` | Alias de compatibilité obsolète ; utilisez `plugin-sdk/memory-host-events` |
    | `plugin-sdk/memory-core-host-status` | Utilitaires de statut de l’hôte de mémoire |
    | `plugin-sdk/memory-core-host-runtime-cli` | Utilitaires d’exécution CLI de l’hôte de mémoire |
    | `plugin-sdk/memory-core-host-runtime-core` | Utilitaires d’exécution principaux de l’hôte de mémoire |
    | `plugin-sdk/memory-core-host-runtime-files` | Utilitaires de fichier/exécution de l’hôte de mémoire |
    | `plugin-sdk/memory-host-core` | Alias indépendant du fournisseur pour les utilitaires d’exécution principaux de l’hôte de mémoire |
    | `plugin-sdk/memory-host-events` | Alias indépendant du fournisseur pour les utilitaires de journal des événements de l’hôte de mémoire |
    | `plugin-sdk/memory-host-files` | Alias de compatibilité obsolète ; utilisez `plugin-sdk/memory-core-host-runtime-files` |
    | `plugin-sdk/memory-host-markdown` | Utilitaires partagés de Markdown géré pour les plugins adjacents à la mémoire |
    | `plugin-sdk/memory-host-search` | Façade d’exécution de mémoire active pour l’accès au gestionnaire de recherche |
    | `plugin-sdk/memory-host-status` | Alias de compatibilité obsolète ; utilisez `plugin-sdk/memory-core-host-status` |
  </Accordion>

  <Accordion title="Sous-chemins réservés des utilitaires intégrés">
    Les sous-chemins SDK réservés aux utilitaires intégrés sont des surfaces étroites propres aux propriétaires pour
    le code des plugins intégrés. Ils sont suivis dans l’inventaire du SDK afin que les builds de packages
    et les alias restent déterministes, mais ce ne sont pas des API générales
    de création de plugins. Les nouveaux contrats d’hôte réutilisables doivent utiliser des sous-chemins SDK génériques
    tels que `plugin-sdk/gateway-runtime`, `plugin-sdk/security-runtime` et
    `plugin-sdk/plugin-config-runtime`.

    | Sous-chemin | Propriétaire et objectif |
    | --- | --- |
    | `plugin-sdk/codex-mcp-projection` | Assistant de Plugin Codex intégré pour projeter la configuration du serveur MCP de l’utilisateur dans la configuration de thread du serveur d’application Codex |
    | `plugin-sdk/codex-native-task-runtime` | Assistant de Plugin Codex intégré pour refléter les sous-agents natifs du serveur d’application Codex dans l’état de tâche OpenClaw |

  </Accordion>
</AccordionGroup>

## Connexe

- [Présentation du SDK de Plugin](/fr/plugins/sdk-overview)
- [Configuration du SDK de Plugin](/fr/plugins/sdk-setup)
- [Création de Plugins](/fr/plugins/building-plugins)
