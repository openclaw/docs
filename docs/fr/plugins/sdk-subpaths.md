---
read_when:
    - Choisir le sous-chemin plugin-sdk approprié pour l’importation d’un plugin
    - Audit des sous-chemins des plugins intégrés et des surfaces d’assistance
summary: 'Catalogue des sous-chemins du SDK de Plugin : répartition des importations par domaine'
title: Sous-chemins du SDK de Plugin
x-i18n:
    generated_at: "2026-07-12T15:48:02Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 15
    provider: openai
    source_hash: d4ad11615c889a6a692c243f321612050388a647975b2075376e7c787df933ff
    source_path: plugins/sdk-subpaths.md
    workflow: 16
---

Le SDK de plugins est exposé sous la forme d’un ensemble de sous-chemins publics ciblés sous
`openclaw/plugin-sdk/`. Cette page répertorie les sous-chemins couramment utilisés, regroupés par
objectif. Trois fichiers définissent cette surface :

- `scripts/lib/plugin-sdk-entrypoints.json` : l’inventaire maintenu des points d’entrée
  compilés par le processus de build.
- `scripts/lib/plugin-sdk-private-local-only-subpaths.json` : les sous-chemins de test/internes
  propres au dépôt. Les exports du package correspondent à l’inventaire moins cette liste.
- `src/plugin-sdk/entrypoints.ts` : les métadonnées de classification des sous-chemins
  obsolètes, des utilitaires réservés aux plugins intégrés, des façades intégrées prises en charge et
  des surfaces publiques appartenant aux plugins.

Les mainteneurs vérifient le nombre d’exports publics avec `pnpm plugin-sdk:surface` et
les sous-chemins actifs des utilitaires réservés avec `pnpm plugins:boundary-report:summary` ;
les exports d’utilitaires réservés inutilisés font échouer le rapport de CI au lieu de rester dans le
SDK public comme dette de compatibilité dormante.

Pour le guide de création de plugins, consultez [Présentation du SDK de plugins](/fr/plugins/sdk-overview).

## Point d’entrée du plugin

| Sous-chemin                     | Principaux exports                                                                                                                                                                                       |
| ------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `plugin-sdk/plugin-entry`      | `definePluginEntry`                                                                                                                                                                                     |
| `plugin-sdk/core`              | `defineChannelPluginEntry`, `createChatChannelPlugin`, `createChannelPluginBase`, `defineSetupPluginEntry`, `buildChannelConfigSchema`, `buildJsonChannelConfigSchema`, `resolveTailscalePublishedHost` |
| `plugin-sdk/provider-entry`    | `defineSingleProviderPluginEntry`                                                                                                                                                                       |
| `plugin-sdk/migration`         | Utilitaires d’éléments de fournisseur de migration tels que `createMigrationItem`, constantes de motifs, marqueurs d’état des éléments, utilitaires de masquage et `summarizeMigrationItems`             |
| `plugin-sdk/migration-runtime` | Utilitaires de migration à l’exécution tels que `copyMigrationFileItem`, `resolvePlannedMigrationTargets`, `withCachedMigrationConfigRuntime` et `writeMigrationReport`                                |
| `plugin-sdk/health`            | Types d’enregistrement, de détection, de réparation, de sélection, de gravité et de résultats des contrôles d’intégrité Doctor pour les consommateurs d’intégrité intégrés                              |
| `plugin-sdk/config-schema`     | Obsolète. Schéma Zod racine de `openclaw.json` (`OpenClawSchema`) ; définissez plutôt des schémas locaux au plugin et validez-les avec `plugin-sdk/json-schema-runtime`                                 |

### Utilitaires de compatibilité et de test obsolètes

Les sous-chemins obsolètes restent exportés pour les anciens plugins, mais le nouveau code doit utiliser les
sous-chemins ciblés du SDK ci-dessous. La liste maintenue se trouve dans
`scripts/lib/plugin-sdk-deprecated-public-subpaths.json` ; la CI rejette les
imports de production des plugins intégrés provenant de cette liste. Les points d’export généraux tels que `plugin-sdk/compat`,
`plugin-sdk/config-types`, `plugin-sdk/infra-runtime` et
`plugin-sdk/text-runtime` servent uniquement à la compatibilité, tandis que `plugin-sdk/zod` est une
réexportation de compatibilité : importez `zod` directement depuis `zod`. Les points d’export généraux
par domaine `plugin-sdk/agent-runtime`, `plugin-sdk/channel-lifecycle`,
`plugin-sdk/channel-runtime`, `plugin-sdk/cli-runtime`,
`plugin-sdk/conversation-runtime`, `plugin-sdk/hook-runtime`,
`plugin-sdk/media-runtime`, `plugin-sdk/plugin-runtime` et
`plugin-sdk/security-runtime` sont eux aussi obsolètes au profit de
sous-chemins ciblés.

Les sous-chemins d’utilitaires de test d’OpenClaw basés sur Vitest sont réservés au dépôt et ne sont
plus exportés par le package : `agent-runtime-test-contracts`,
`channel-contract-testing`, `channel-target-testing`, `channel-test-helpers`,
`plugin-state-test-runtime`, `plugin-test-api`, `plugin-test-contracts`,
`plugin-test-runtime`, `provider-http-test-mocks`, `provider-test-contracts`,
`reply-payload-testing`, `sqlite-runtime-testing`, `test-env`, `test-fixtures`,
`test-node-mocks` et `testing`. Les surfaces privées d’utilitaires intégrés
`ssrf-runtime-internal` et `codex-native-task-runtime` sont également réservées au
dépôt.

### Sous-chemins réservés aux utilitaires des plugins intégrés

`plugin-sdk/codex-mcp-projection` est le seul sous-chemin réservé : une surface de
compatibilité appartenant au plugin Codex intégré, et non une API générale du SDK.
Les imports de plugins entre propriétaires distincts sont bloqués par les garde-fous du contrat du package, et
la CI échoue lorsqu’un sous-chemin réservé cesse d’être importé.
`plugin-sdk/codex-native-task-runtime` est réservé au dépôt et n’est pas un
export du package.

`src/plugin-sdk/entrypoints.ts` répertorie également les façades intégrées prises en charge, des points
d’entrée du SDK fournis par leur plugin intégré jusqu’à ce que des contrats génériques les
remplacent : `plugin-sdk/discord`, `plugin-sdk/lmstudio`, `plugin-sdk/lmstudio-runtime`,
`plugin-sdk/matrix`, `plugin-sdk/mattermost`,
`plugin-sdk/memory-core-engine-runtime`, `plugin-sdk/provider-zai-endpoint`,
`plugin-sdk/qa-runner-runtime`, `plugin-sdk/telegram-account`,
`plugin-sdk/tts-runtime` et `plugin-sdk/zalouser`. Plusieurs d’entre eux sont également
obsolètes pour le nouveau code ; consultez les remarques de chaque ligne ci-dessous.

  <AccordionGroup>
  <Accordion title="Sous-chemins des canaux">
    | Sous-chemin | Principales exportations |
    | --- | --- |
    | `plugin-sdk/channel-core` | `defineChannelPluginEntry`, `defineSetupPluginEntry`, `createChatChannelPlugin`, `createChannelPluginBase` |
    | `plugin-sdk/json-schema-runtime` | Utilitaire de validation JSON Schema avec mise en cache pour les schémas appartenant aux plugins |
    | `plugin-sdk/channel-setup` | `createOptionalChannelSetupSurface`, `createOptionalChannelSetupAdapter`, `createOptionalChannelSetupWizard`, ainsi que `DEFAULT_ACCOUNT_ID`, `createTopLevelChannelDmPolicy`, `setSetupChannelEnabled`, `splitSetupEntries` |
    | `plugin-sdk/setup` | Utilitaires partagés de l’assistant de configuration, traducteur de configuration, invites de liste d’autorisation, générateurs d’état de configuration |
    | `plugin-sdk/setup-runtime` | `createSetupTranslator`, `createPatchedAccountSetupAdapter`, `createEnvPatchedAccountSetupAdapter`, `createSetupInputPresenceValidator`, `noteChannelLookupFailure`, `noteChannelLookupSummary`, `promptResolvedAllowFrom`, `splitSetupEntries`, `createAllowlistSetupWizardProxy`, `createDelegatedSetupWizardProxy` |
    | `plugin-sdk/setup-adapter-runtime` | Alias de compatibilité obsolète ; utilisez `plugin-sdk/setup-runtime` |
    | `plugin-sdk/setup-tools` | `formatCliCommand`, `detectBinary`, `extractArchive`, `resolveBrewExecutable`, `formatDocsLink`, `CONFIG_DIR` |
    | `plugin-sdk/account-core` | Utilitaires de configuration multicomptes et de contrôle des actions, utilitaires de repli sur le compte par défaut |
    | `plugin-sdk/account-id` | `DEFAULT_ACCOUNT_ID`, utilitaires de normalisation des identifiants de compte |
    | `plugin-sdk/account-resolution` | Utilitaires de recherche de compte et de repli sur le compte par défaut |
    | `plugin-sdk/account-helpers` | Utilitaires ciblés de liste de comptes et d’actions sur les comptes |
    | `plugin-sdk/access-groups` | Utilitaires d’analyse des listes d’autorisation de groupes d’accès et de diagnostic expurgé des groupes |
    | `plugin-sdk/channel-pairing` | `createChannelPairingController` |
    | `plugin-sdk/channel-reply-pipeline` | Façade de compatibilité obsolète. Utilisez `plugin-sdk/channel-outbound`. |
    | `plugin-sdk/channel-config-helpers` | `createHybridChannelConfigAdapter`, `resolveChannelDmAccess`, `resolveChannelDmAllowFrom`, `resolveChannelDmPolicy`, `normalizeChannelDmPolicy`, `normalizeLegacyDmAliases` |
    | `plugin-sdk/channel-config-schema` | Primitives partagées de schéma de configuration des canaux, ainsi que générateurs Zod et JSON/TypeBox directs |
    | `plugin-sdk/bundled-channel-config-schema` | Schémas de configuration des canaux OpenClaw intégrés, réservés aux plugins intégrés maintenus |
    | `plugin-sdk/chat-channel-ids` | `BUNDLED_CHAT_CHANNEL_IDS`, `BUNDLED_CHAT_CHANNEL_ENVELOPE_PREFIXES`, `ChatChannelId`. Identifiants canoniques des canaux de discussion intégrés/officiels, ainsi que libellés et alias de formatage pour les plugins devant reconnaître du texte préfixé par une enveloppe sans coder en dur leur propre table. |
    | `plugin-sdk/channel-config-schema-legacy` | Alias de compatibilité obsolète pour les schémas de configuration des canaux intégrés |
    | `plugin-sdk/telegram-command-config` | Normalisation obsolète des noms et descriptions de commandes Telegram, et vérification des doublons et conflits ; utilisez une gestion locale au plugin de la configuration des commandes dans le nouveau code de plugin |
    | `plugin-sdk/command-gating` | Utilitaires ciblés de contrôle d’autorisation des commandes |
    | `plugin-sdk/channel-policy` | `resolveChannelGroupRequireMention` |
    | `plugin-sdk/channel-ingress` | Surface de compatibilité de bas niveau pour l’entrée des canaux. Les nouveaux chemins de réception doivent utiliser `plugin-sdk/channel-ingress-runtime`. |
    | `plugin-sdk/channel-ingress-runtime` | Résolveur expérimental de haut niveau pour l’environnement d’exécution d’entrée des canaux et générateurs de données de routage pour les chemins de réception de canaux migrés. Préférez-le à l’assemblage, dans chaque plugin, des listes d’autorisation effectives, des listes d’autorisation de commandes et des projections héritées. Consultez [API d’entrée des canaux](/fr/plugins/sdk-channel-ingress). |
    | `plugin-sdk/channel-lifecycle` | Façade de compatibilité obsolète. Utilisez `plugin-sdk/channel-outbound`. |
    | `plugin-sdk/channel-outbound` | Contrats de cycle de vie des messages, ainsi qu’options du pipeline de réponse, accusés de réception, aperçu en direct/diffusion en continu, utilitaires de cycle de vie, identité sortante, planification des charges utiles, envois durables et utilitaires de contexte d’envoi de messages. Consultez [API de sortie des canaux](/fr/plugins/sdk-channel-outbound). |
    | `plugin-sdk/channel-message` | Alias de compatibilité obsolète pour `plugin-sdk/channel-outbound`, ainsi que façades héritées de distribution des réponses. |
    | `plugin-sdk/channel-message-runtime` | Alias de compatibilité obsolète pour `plugin-sdk/channel-outbound`, ainsi que façades héritées de distribution des réponses. |
    | `plugin-sdk/inbound-envelope` | Utilitaires partagés de génération de routes entrantes et d’enveloppes |
    | `plugin-sdk/inbound-reply-dispatch` | Façade de compatibilité obsolète. Utilisez `plugin-sdk/channel-inbound` pour les exécuteurs entrants et les prédicats de distribution, et `plugin-sdk/channel-outbound` pour les utilitaires de livraison des messages. |
    | `plugin-sdk/messaging-targets` | Alias obsolète d’analyse des cibles ; utilisez `plugin-sdk/channel-targets` |
    | `plugin-sdk/outbound-media` | Utilitaires partagés de chargement des médias sortants et de gestion de l’état des médias hébergés |
    | `plugin-sdk/outbound-send-deps` | Façade de compatibilité obsolète. Utilisez `plugin-sdk/channel-outbound`. |
    | `plugin-sdk/outbound-runtime` | Façade de compatibilité obsolète. Utilisez `plugin-sdk/channel-outbound`. |
    | `plugin-sdk/poll-runtime` | Utilitaires ciblés de normalisation des sondages |
    | `plugin-sdk/thread-bindings-runtime` | Utilitaires de cycle de vie et d’adaptation des liaisons de fils de discussion |
    | `plugin-sdk/agent-media-payload` | Racines et chargeurs des charges utiles multimédias des agents |
    | `plugin-sdk/conversation-runtime` | Point d’exportation général obsolète pour les liaisons de conversations/fils de discussion, l’appairage et les utilitaires de liaisons configurées ; préférez des sous-chemins de liaison ciblés tels que `plugin-sdk/thread-bindings-runtime` et `plugin-sdk/session-binding-runtime` |
    | `plugin-sdk/runtime-group-policy` | Utilitaires de résolution de la politique de groupe à l’exécution |
    | `plugin-sdk/channel-status` | Utilitaires partagés d’instantané et de résumé de l’état des canaux |
    | `plugin-sdk/channel-config-primitives` | Primitives ciblées de schéma de configuration des canaux |
    | `plugin-sdk/channel-config-writes` | Utilitaires d’autorisation d’écriture dans la configuration des canaux |
    | `plugin-sdk/channel-plugin-common` | Exportations partagées du préambule des plugins de canal |
    | `plugin-sdk/allowlist-config-edit` | Utilitaires de modification et de lecture de la configuration des listes d’autorisation |
    | `plugin-sdk/group-access` | Utilitaires obsolètes de décision d’accès aux groupes ; utilisez `resolveChannelMessageIngress` depuis `plugin-sdk/channel-ingress-runtime` |
    | `plugin-sdk/direct-dm`, `plugin-sdk/direct-dm-access` | Façades de compatibilité obsolètes. Utilisez `plugin-sdk/channel-inbound`. |
    | `plugin-sdk/direct-dm-guard-policy` | Utilitaires ciblés de politique de contrôle des messages privés directs avant chiffrement |
    | `plugin-sdk/discord` | Façade de compatibilité Discord obsolète pour la version publiée `@openclaw/discord@2026.3.13` et la compatibilité suivie par le propriétaire ; les nouveaux plugins doivent utiliser les sous-chemins génériques du SDK de canal |
    | `plugin-sdk/telegram-account` | Façade obsolète de compatibilité de résolution des comptes Telegram pour la compatibilité suivie par le propriétaire ; les nouveaux plugins doivent utiliser les utilitaires d’environnement d’exécution injectés ou les sous-chemins génériques du SDK de canal |
    | `plugin-sdk/zalouser` | Façade obsolète de compatibilité Zalo Personal pour les paquets Lark/Zalo publiés qui importent encore l’autorisation des commandes d’expéditeur ; les nouveaux plugins doivent utiliser les sous-chemins génériques du SDK de canal |
    | `plugin-sdk/interactive-runtime` | Présentation sémantique des messages, livraison et utilitaires hérités de réponse interactive. Consultez [Présentation des messages](/fr/plugins/message-presentation) |
    | `plugin-sdk/channel-inbound` | Utilitaires entrants partagés pour la classification des événements, la génération du contexte, le formatage, les racines, l’anti-rebond, la détection des mentions, la politique de mention et la journalisation des entrées |
    | `plugin-sdk/channel-inbound-debounce` | Utilitaires ciblés d’anti-rebond des entrées |
    | `plugin-sdk/channel-mention-gating` | Utilitaires ciblés de politique de mention, de marqueurs de mention et de texte de mention, sans la surface plus large de l’environnement d’exécution entrant |
    | `plugin-sdk/channel-envelope`, `plugin-sdk/channel-inbound-roots`, `plugin-sdk/channel-location`, `plugin-sdk/channel-logging` | Façades de compatibilité obsolètes. Utilisez `plugin-sdk/channel-inbound` ou `plugin-sdk/channel-outbound`. |
    | `plugin-sdk/channel-pairing-paths` | Façade de compatibilité obsolète. Utilisez `plugin-sdk/channel-pairing`. |
    | `plugin-sdk/channel-reply-options-runtime` | Façade de compatibilité obsolète. Utilisez `plugin-sdk/channel-outbound`. |
    | `plugin-sdk/channel-streaming` | Façade de compatibilité obsolète. Utilisez `plugin-sdk/channel-outbound`. |
    | `plugin-sdk/channel-send-result` | Types de résultats de réponse |
    | `plugin-sdk/channel-actions` | Utilitaires d’actions sur les messages des canaux, ainsi que générateurs obsolètes de schémas natifs conservés pour la compatibilité des plugins |
    | `plugin-sdk/channel-route` | Normalisation partagée des routes, résolution des cibles pilotée par l’analyseur, conversion des identifiants de fils de discussion en chaînes, clés de route dédupliquées/compactes, types de cibles analysées et utilitaires de comparaison des routes/cibles |
    | `plugin-sdk/channel-targets` | Utilitaires d’analyse des cibles ; les appelants comparant les routes doivent utiliser `plugin-sdk/channel-route` |
    | `plugin-sdk/channel-contract` | Types de contrats des canaux |
    | `plugin-sdk/channel-feedback` | Câblage des retours/réactions |
  </Accordion>

Les anciennes familles d’assistants de canal restent disponibles uniquement pour
assurer la compatibilité avec les plugins publiés. Le plan de suppression est le
suivant : les conserver pendant la période de migration des plugins externes,
maintenir les plugins du dépôt et les plugins intégrés sur `channel-inbound` et
`channel-outbound`, puis supprimer les sous-chemins de compatibilité lors du prochain
nettoyage majeur du SDK. Cela s’applique aux anciennes familles de messages et
d’exécution de canal, de diffusion en continu de canal, d’accès direct aux messages
privés, d’assistants entrants fragmentés, d’options de réponse et de chemins
d’appairage.

  <Accordion title="Sous-chemins des fournisseurs">
    | Sous-chemin | Principaux exports |
    | --- | --- |
    | `plugin-sdk/provider-entry` | `defineSingleProviderPluginEntry` |
    | `plugin-sdk/lmstudio` | Façade de fournisseur LM Studio prise en charge pour la configuration, la découverte du catalogue et la préparation des modèles à l’exécution |
    | `plugin-sdk/lmstudio-runtime` | Façade d’exécution LM Studio prise en charge pour les valeurs par défaut du serveur local, la découverte des modèles, les en-têtes de requête et les utilitaires de modèles chargés |
    | `plugin-sdk/provider-setup` | Utilitaires sélectionnés de configuration de fournisseurs locaux/auto-hébergés |
    | `plugin-sdk/self-hosted-provider-setup` | Utilitaires obsolètes de configuration auto-hébergée compatible avec OpenAI ; utilisez `plugin-sdk/provider-setup` ou les utilitaires de configuration appartenant au plugin |
    | `plugin-sdk/cli-backend` | Valeurs par défaut du backend CLI + constantes du chien de garde |
    | `plugin-sdk/provider-auth-runtime` | Utilitaires d’exécution pour l’authentification des fournisseurs : flux de rebouclage OAuth, échange de jetons, persistance de l’authentification et résolution des clés API |
    | `plugin-sdk/provider-oauth-runtime` | Types génériques de rappel OAuth des fournisseurs, rendu de la page de rappel, utilitaires PKCE/état, analyse des entrées d’autorisation, utilitaires d’expiration des jetons et utilitaires d’abandon |
    | `plugin-sdk/provider-auth-api-key` | Utilitaires d’intégration et d’écriture de profil pour les clés API, tels que `upsertApiKeyProfile` |
    | `plugin-sdk/provider-auth-result` | Générateur standard de résultat d’authentification OAuth |
    | `plugin-sdk/provider-env-vars` | Utilitaires de recherche des variables d’environnement d’authentification des fournisseurs |
    | `plugin-sdk/provider-auth` | `createProviderApiKeyAuthMethod`, `ensureApiKeyFromOptionEnvOrPrompt`, `upsertAuthProfile`, `upsertApiKeyProfile`, `writeOAuthCredentials`, utilitaires d’importation de l’authentification OpenAI Codex, export de compatibilité obsolète `resolveOpenClawAgentDir` |
    | `plugin-sdk/provider-model-shared` | `ProviderReplayFamily`, `buildProviderReplayFamilyHooks`, `normalizeModelCompat`, générateurs partagés de politiques de réexécution, utilitaires de points de terminaison de fournisseurs et utilitaires partagés de normalisation des identifiants de modèles |
    | `plugin-sdk/provider-catalog-live-runtime` | Utilitaires de catalogue de modèles de fournisseurs en direct pour une découverte protégée de type `/models` : `buildLiveModelProviderConfig`, `fetchLiveProviderModelRows`, `getCachedLiveProviderModelRows`, `fetchLiveProviderModelIds`, `LiveModelCatalogHttpError`, `clearLiveCatalogCacheForTests`, filtrage des identifiants de modèles, cache TTL et solution de repli statique |
    | `plugin-sdk/provider-catalog-runtime` | Hook d’exécution d’enrichissement du catalogue des fournisseurs et interfaces de registre des fournisseurs de plugins pour les tests de contrat |
    | `plugin-sdk/provider-catalog-shared` | `findCatalogTemplate`, `buildSingleProviderApiKeyCatalog`, `buildManifestModelProviderConfig`, `supportsNativeStreamingUsageCompat`, `applyProviderNativeStreamingUsageCompat` |
    | `plugin-sdk/provider-http` | Utilitaires génériques de capacité HTTP/point de terminaison des fournisseurs, erreurs HTTP des fournisseurs et utilitaires de formulaire multipart pour la transcription audio |
    | `plugin-sdk/provider-web-fetch-contract` | Utilitaires de contrat restreint pour la configuration/sélection de récupération Web, tels que `enablePluginInConfig` et `WebFetchProviderPlugin` |
    | `plugin-sdk/provider-web-fetch` | Utilitaires d’enregistrement et de cache des fournisseurs de récupération Web |
    | `plugin-sdk/provider-web-search-config-contract` | Utilitaires restreints de configuration et d’identifiants de recherche Web pour les fournisseurs qui ne nécessitent pas de câblage d’activation du plugin |
    | `plugin-sdk/provider-web-search-contract` | Utilitaires de contrat restreint pour la configuration et les identifiants de recherche Web, tels que `createWebSearchProviderContractFields`, `enablePluginInConfig`, `resolveProviderWebSearchPluginConfig`, ainsi que les accesseurs en lecture et en écriture d’identifiants à portée limitée |
    | `plugin-sdk/provider-web-search` | Utilitaires d’enregistrement, de cache et d’exécution des fournisseurs de recherche Web |
    | `plugin-sdk/embedding-providers` | Types généraux de fournisseurs d’embeddings et utilitaires de lecture, notamment `EmbeddingProviderAdapter`, `getEmbeddingProvider(...)` et `listEmbeddingProviders(...)` ; les plugins enregistrent les fournisseurs via `api.registerEmbeddingProvider(...)` afin de garantir la propriété du manifeste |
    | `plugin-sdk/provider-tools` | `ProviderToolCompatFamily`, `buildProviderToolCompatFamilyHooks`, ainsi que nettoyage des schémas et diagnostics pour DeepSeek/Gemini/OpenAI |
    | `plugin-sdk/provider-usage` | Types d’instantanés d’utilisation des fournisseurs, utilitaires partagés de récupération de l’utilisation et récupérateurs propres aux fournisseurs, tels que `fetchClaudeUsage` |
    | `plugin-sdk/provider-stream` | `ProviderStreamFamily`, `buildProviderStreamFamilyHooks`, `composeProviderStreamWrappers`, types d’enveloppes de flux, compatibilité des appels d’outils en texte brut et utilitaires partagés d’enveloppes Anthropic/Google/Kilocode/MiniMax/Moonshot/OpenAI/OpenRouter/Z.AI |
    | `plugin-sdk/provider-stream-shared` | Utilitaires publics partagés d’enveloppes de flux de fournisseurs, notamment `composeProviderStreamWrappers`, `createOpenAICompatibleCompletionsThinkingOffWrapper`, `createPlainTextToolCallCompatWrapper`, `createPayloadPatchStreamWrapper`, `createToolStreamWrapper`, `normalizeOpenAICompatibleReasoningPayload`, `setQwenChatTemplateThinking`, ainsi que des utilitaires de flux compatibles avec Anthropic/DeepSeek/OpenAI |
    | `plugin-sdk/provider-transport-runtime` | Utilitaires de transport natif des fournisseurs, tels que la récupération protégée, l’extraction du texte des résultats d’outils, les transformations des messages de transport et les flux d’événements de transport accessibles en écriture |
    | `plugin-sdk/provider-onboard` | Utilitaires de modification de la configuration d’intégration |
    | `plugin-sdk/global-singleton` | Utilitaires de singleton, de table de correspondance et de cache locaux au processus |
    | `plugin-sdk/group-activation` | Utilitaires restreints de mode d’activation des groupes et d’analyse des commandes |
  </Accordion>

Les instantanés d’utilisation des fournisseurs indiquent normalement une ou plusieurs
`windows` de quota, chacune avec un libellé, un pourcentage utilisé et une heure
de réinitialisation facultative. Les fournisseurs qui exposent un solde ou un
texte d’état du compte plutôt que des fenêtres de quota réinitialisables doivent
renvoyer `summary` avec un tableau `windows` vide au lieu d’inventer des
pourcentages. OpenClaw affiche ce texte récapitulatif dans la sortie d’état ;
utilisez `error` uniquement lorsque le point de terminaison d’utilisation a
échoué ou n’a renvoyé aucune donnée d’utilisation exploitable.

  <Accordion title="Sous-chemins d’authentification et de sécurité">
    | Sous-chemin | Principaux exports |
    | --- | --- |
    | `plugin-sdk/command-auth` | Surface étendue obsolète d’autorisation des commandes (`resolveControlCommandGate`, utilitaires de registre des commandes, y compris la mise en forme dynamique des menus d’arguments, utilitaires d’autorisation des expéditeurs) ; utilisez l’autorisation d’entrée/d’exécution des canaux ou les utilitaires d’état des commandes |
    | `plugin-sdk/command-status` | Générateurs de messages de commande/d’aide, tels que `buildCommandsMessagePaginated` et `buildHelpMessage` |
    | `plugin-sdk/approval-auth-runtime` | Résolution des approbateurs et utilitaires d’authentification des actions dans une même discussion |
    | `plugin-sdk/approval-client-runtime` | Utilitaires natifs de profil et de filtre d’approbation d’exécution |
    | `plugin-sdk/approval-delivery-runtime` | Adaptateurs natifs de capacité et de remise des approbations |
    | `plugin-sdk/approval-gateway-runtime` | Résolveur partagé du Gateway d’approbation |
    | `plugin-sdk/approval-reference-runtime` | Utilitaire de localisation durable et déterministe pour les rappels d’approbation limités par le transport |
    | `plugin-sdk/approval-handler-adapter-runtime` | Utilitaires légers de chargement des adaptateurs natifs d’approbation pour les points d’entrée de canaux critiques |
    | `plugin-sdk/approval-handler-runtime` | Utilitaires d’exécution plus étendus pour les gestionnaires d’approbation ; privilégiez les interfaces plus restreintes d’adaptateur/Gateway lorsqu’elles suffisent |
    | `plugin-sdk/approval-native-runtime` | Utilitaires natifs de cible d’approbation, d’association de compte, de contrôle des routes, de solution de repli pour le transfert et de suppression locale des invites natives d’exécution |
    | `plugin-sdk/approval-reaction-runtime` | Associations codées en dur des réactions d’approbation, charges utiles des invites de réaction, magasins de cibles de réaction, utilitaires de texte d’indication des réactions et export de compatibilité pour la suppression locale des invites natives d’exécution |
    | `plugin-sdk/approval-reply-runtime` | Utilitaires de charge utile des réponses d’approbation d’exécution/de plugin |
    | `plugin-sdk/approval-runtime` | Utilitaires de charge utile d’approbation d’exécution/de plugin, générateurs de capacités d’approbation, utilitaires d’authentification/de profil d’approbation, utilitaires natifs de routage/d’exécution des approbations et utilitaires structurés d’affichage des approbations, tels que `formatApprovalDisplayPath` |
    | `plugin-sdk/reply-dedupe` | Utilitaires restreints obsolètes de réinitialisation de la déduplication des réponses entrantes |
    | `plugin-sdk/command-auth-native` | Authentification native des commandes, mise en forme dynamique des menus d’arguments et utilitaires natifs de ciblage des sessions |
    | `plugin-sdk/command-detection` | Utilitaires partagés de détection des commandes |
    | `plugin-sdk/command-primitives-runtime` | Prédicats légers sur le texte des commandes pour les chemins critiques des canaux |
    | `plugin-sdk/command-surface` | Normalisation du corps des commandes et utilitaires de surface des commandes |
    | `plugin-sdk/allow-from` | `formatAllowFromLowercase` |
    | `plugin-sdk/provider-auth-login-flow-runtime` | Utilitaires différés du flux de connexion d’authentification des fournisseurs pour l’association par code d’appareil dans les canaux privés et l’interface Web |
    | `plugin-sdk/channel-secret-runtime` | Surface étendue obsolète du contrat de secrets (`collectSimpleChannelFieldAssignments`, `getChannelSurface`, `pushAssignment`, types de cibles de secrets) ; privilégiez les sous-chemins spécialisés ci-dessous |
    | `plugin-sdk/channel-secret-basic-runtime` | Exports restreints du contrat de secrets pour les surfaces de secrets des canaux/plugins sans TTS |
    | `plugin-sdk/channel-secret-tts-runtime` | Utilitaires restreints d’affectation imbriquée des secrets TTS des canaux |
    | `plugin-sdk/secret-ref-runtime` | Typage, résolution et recherche de chemin de cible de plan restreints pour SecretRef dans l’analyse des contrats de secrets/configurations |
    | `plugin-sdk/secret-provider-integration` | Manifeste d’intégration de fournisseur SecretRef et contrats de préréglages limités aux types pour les plugins qui publient des préréglages de fournisseurs de secrets externes |
    | `plugin-sdk/security-runtime` | Barrel étendu obsolète pour la confiance, le contrôle des messages privés, les utilitaires de fichiers/chemins confinés à la racine, notamment les écritures en création uniquement, le remplacement atomique synchrone/asynchrone des fichiers, les écritures temporaires adjacentes, la solution de repli pour les déplacements entre appareils, les utilitaires de magasin de fichiers privés, les protections contre les parents symboliques, le contenu externe, la rédaction de texte sensible, la comparaison de secrets en temps constant et les utilitaires de collecte de secrets ; privilégiez les sous-chemins spécialisés de sécurité/SSRF/secrets |
    | `plugin-sdk/ssrf-policy` | Utilitaires de liste d’autorisation des hôtes et de politique SSRF pour les réseaux privés |
    | `plugin-sdk/ssrf-dispatcher` | Utilitaires restreints de répartiteur épinglé sans la surface étendue d’exécution de l’infrastructure |
    | `plugin-sdk/ssrf-runtime` | Utilitaires de répartiteur épinglé, de récupération protégée contre les SSRF, d’erreur SSRF et de politique SSRF |
    | `plugin-sdk/secret-input` | Utilitaires d’analyse des entrées de secrets |
    | `plugin-sdk/webhook-ingress` | Utilitaires de requêtes/cibles Webhook et coercition brute des WebSockets/corps |
    | `plugin-sdk/webhook-request-guards` | Utilitaires de taille et de délai d’expiration du corps des requêtes |
  </Accordion>

  <Accordion title="Runtime and storage subpaths">
    | Sous-chemin | Principales exportations |
    | --- | --- |
    | `plugin-sdk/runtime` | Utilitaires d’exécution, de journalisation et de sauvegarde, avertissements relatifs aux chemins d’installation des plugins et utilitaires de processus |
    | `plugin-sdk/runtime-env` | Utilitaires ciblés pour l’environnement d’exécution, le journaliseur, les délais d’expiration, les nouvelles tentatives et le délai progressif |
    | `plugin-sdk/browser-config` | Façade de configuration de navigateur prise en charge pour la normalisation des profils et des valeurs par défaut, l’analyse des URL CDP et les utilitaires d’authentification du contrôle du navigateur |
    | `plugin-sdk/agent-harness-task-runtime` | Utilitaires génériques de cycle de vie des tâches et de transmission de leur achèvement pour les agents adossés à un harnais et utilisant une portée de tâche fournie par l’hôte |
    | `plugin-sdk/codex-mcp-projection` | Utilitaire Codex intégré réservé à la projection de la configuration des serveurs MCP utilisateur dans la configuration des threads Codex ; non destiné aux plugins tiers |
    | `plugin-sdk/codex-native-task-runtime` | Utilitaire Codex intégré local au dépôt pour le câblage natif du miroir de tâches et de l’environnement d’exécution ; non exporté par le paquet |
    | `plugin-sdk/channel-runtime-context` | Utilitaires génériques d’enregistrement et de recherche du contexte d’exécution des canaux |
    | `plugin-sdk/matrix` | Façade de compatibilité Matrix obsolète pour les anciens paquets de canaux tiers ; les nouveaux plugins doivent importer directement `plugin-sdk/run-command` |
    | `plugin-sdk/mattermost` | Façade de compatibilité Mattermost obsolète pour les anciens paquets de canaux tiers ; les nouveaux plugins doivent importer directement les sous-chemins génériques du SDK |
    | `plugin-sdk/runtime-store` | `createPluginRuntimeStore` |
    | `plugin-sdk/plugin-runtime` | Point d’exportation général obsolète pour les utilitaires de commandes, de hooks, HTTP et interactifs des plugins ; privilégiez les sous-chemins ciblés de l’environnement d’exécution des plugins |
    | `plugin-sdk/hook-runtime` | Point d’exportation général obsolète pour les utilitaires du pipeline de webhooks et de hooks internes ; privilégiez les sous-chemins ciblés des hooks et de l’environnement d’exécution des plugins |
    | `plugin-sdk/lazy-runtime` | Utilitaires d’importation et de liaison différées de l’environnement d’exécution, tels que `createLazyRuntimeModule`, `createLazyRuntimeMethod` et `createLazyRuntimeSurface` |
    | `plugin-sdk/process-runtime` | Utilitaires d’exécution de processus |
    | `plugin-sdk/cli-runtime` | Point d’exportation général obsolète pour le formatage de la CLI, l’attente, les versions, l’invocation d’arguments et les utilitaires de groupes de commandes différés ; privilégiez les sous-chemins ciblés de la CLI et de l’environnement d’exécution |
    | `plugin-sdk/qa-live-transport-scenarios` | Identifiants partagés de scénarios d’assurance qualité du transport en direct, utilitaires de couverture de référence et utilitaire de sélection des scénarios |
    | `plugin-sdk/qa-runner-runtime` | Façade prise en charge exposant les scénarios d’assurance qualité des plugins via l’interface de commandes de la CLI |
    | `plugin-sdk/tts-runtime` | Façade prise en charge pour les schémas de configuration de synthèse vocale et les utilitaires d’exécution |
    | `plugin-sdk/gateway-method-runtime` | Utilitaire réservé de répartition des méthodes du Gateway pour les routes HTTP des plugins qui déclarent `contracts.gatewayMethodDispatch: ["authenticated-request"]` |
    | `plugin-sdk/gateway-runtime` | Client Gateway, utilitaire de démarrage du client lorsque la boucle d’événements est prête, RPC de la CLI du Gateway, erreurs du protocole du Gateway, résolution de l’hôte LAN annoncé et utilitaires de mise à jour partielle de l’état des canaux |
    | `plugin-sdk/config-contracts` | Interface de configuration ciblée limitée aux types pour les structures de configuration des plugins, telles que `OpenClawConfig`, ainsi que les types de configuration des canaux et fournisseurs |
    | `plugin-sdk/plugin-config-runtime` | Utilitaires de recherche de la configuration des plugins à l’exécution, tels que `requireRuntimeConfig`, `resolvePluginConfigObject` et `resolveLivePluginConfigObject` |
    | `plugin-sdk/config-mutation` | Utilitaires transactionnels de modification de la configuration, tels que `mutateConfigFile`, `replaceConfigFile` et `logConfigUpdated` |
    | `plugin-sdk/message-tool-delivery-hints` | Chaînes partagées d’indication des métadonnées de livraison des outils de messagerie |
    | `plugin-sdk/runtime-config-snapshot` | Utilitaires d’instantané de la configuration du processus actuel, tels que `getRuntimeConfig`, `getRuntimeConfigSnapshot`, ainsi que les fonctions de définition d’instantanés de test |
    | `plugin-sdk/text-autolink-runtime` | Détection de liens automatiques pour les références de fichiers sans le point d’exportation général du texte |
    | `plugin-sdk/reply-runtime` | Utilitaires d’exécution partagés pour les messages entrants et les réponses, segmentation, répartition, Heartbeat et planificateur de réponses |
    | `plugin-sdk/reply-dispatch-runtime` | Utilitaires ciblés de répartition et de finalisation des réponses, ainsi que de libellé des conversations |
    | `plugin-sdk/reply-history` | Utilitaires partagés d’historique des réponses sur une courte fenêtre. Le nouveau code de tour de message doit utiliser `createChannelHistoryWindow` ; les utilitaires de bas niveau pour les tables de correspondance restent uniquement des exportations de compatibilité obsolètes |
    | `plugin-sdk/reply-reference` | `createReplyReferencePlanner` |
    | `plugin-sdk/reply-chunking` | Utilitaires ciblés de segmentation du texte et du Markdown |
    | `plugin-sdk/session-store-runtime` | Utilitaires de flux de travail des sessions (`getSessionEntry`, `listSessionEntries`, `patchSessionEntry`, `upsertSessionEntry`), utilitaires de réparation et de cycle de vie (`deleteSessionEntry`, `cleanupSessionLifecycleArtifacts`, `resolveSessionStoreBackupPaths`), utilitaires de marqueurs pour les valeurs transitoires `sessionFile`, lectures bornées du texte récent des transcriptions utilisateur/assistant par identité de session, utilitaires de chemin du magasin de sessions et de clé de session, et lectures de la date de mise à jour, sans importations générales d’écriture ou de maintenance de la configuration |
    | `plugin-sdk/session-transcript-runtime` | Identité des transcriptions, utilitaires ciblés de destination, de lecture et d’écriture, projection des entrées de messages visibles, publication des mises à jour, verrous d’écriture et clés de correspondance en mémoire des transcriptions |
    | `plugin-sdk/sqlite-runtime` | Utilitaires SQLite ciblés pour le schéma des agents, les chemins et les transactions de l’environnement d’exécution propriétaire, sans commandes de cycle de vie de la base de données |
    | `plugin-sdk/cron-store-runtime` | Utilitaires de chemin, de chargement et d’enregistrement du magasin Cron |
    | `plugin-sdk/state-paths` | Utilitaires de chemin des répertoires d’état et OAuth |
    | `plugin-sdk/plugin-state-runtime` | Types d’état indexé SQLite des processus auxiliaires de plugins, ainsi que configuration centralisée des pragmas de connexion et de la maintenance WAL pour les bases de données appartenant aux plugins |
    | `plugin-sdk/routing` | Utilitaires de liaison des routes, des clés de session et des comptes, tels que `resolveAgentRoute`, `buildAgentSessionKey` et `resolveDefaultAgentBoundAccountId` |
    | `plugin-sdk/status-helpers` | Utilitaires partagés de synthèse de l’état des canaux et des comptes, valeurs par défaut de l’état d’exécution et utilitaires de métadonnées des problèmes |
    | `plugin-sdk/target-resolver-runtime` | Utilitaires partagés de résolution des destinations |
    | `plugin-sdk/string-normalization-runtime` | Utilitaires de normalisation des slugs et des chaînes |
    | `plugin-sdk/request-url` | Extraction des URL sous forme de chaînes à partir d’entrées semblables à des opérations de récupération ou à des requêtes |
    | `plugin-sdk/run-command` | Exécuteur de commandes temporisé avec résultats stdout/stderr normalisés |
    | `plugin-sdk/param-readers` | Lecteurs communs de paramètres d’outils et de la CLI |
    | `plugin-sdk/tool-plugin` | Définition d’un plugin d’outil d’agent simple et typé, et exposition de métadonnées statiques pour la génération du manifeste |
    | `plugin-sdk/tool-payload` | Extraction de charges utiles normalisées à partir des objets de résultat des outils |
    | `plugin-sdk/tool-send` | Extraction des champs canoniques de destination d’envoi à partir des arguments des outils |
    | `plugin-sdk/sandbox` | Types de moteurs de bac à sable et utilitaires de commandes SSH/OpenShell, y compris la vérification préalable des commandes d’exécution avec arrêt immédiat en cas d’échec |
    | `plugin-sdk/temp-path` | Utilitaires partagés de chemins de téléchargement temporaires et espaces de travail temporaires privés et sécurisés |
    | `plugin-sdk/logging-core` | Journaliseur de sous-système et utilitaires de masquage |
    | `plugin-sdk/markdown-table-runtime` | Mode des tableaux Markdown et utilitaires de conversion |
    | `plugin-sdk/model-session-runtime` | Utilitaires de remplacement du modèle et de la session, tels que `applyModelOverrideToSessionEntry` et `resolveAgentMaxConcurrent` |
    | `plugin-sdk/talk-config-runtime` | Utilitaires de résolution de la configuration du fournisseur de conversation |
    | `plugin-sdk/json-store` | Petits utilitaires de lecture et d’écriture d’état JSON |
    | `plugin-sdk/json-unsafe-integers` | Utilitaires d’analyse JSON qui conservent sous forme de chaînes les littéraux entiers non sûrs |
    | `plugin-sdk/file-lock` | Utilitaires de verrouillage de fichiers réentrants |
    | `plugin-sdk/persistent-dedupe` | Utilitaires de cache de déduplication adossé au disque |
    | `plugin-sdk/acp-runtime` | Utilitaires d’exécution et de session ACP, ainsi que de répartition des réponses |
    | `plugin-sdk/acp-runtime-backend` | Utilitaires légers d’enregistrement des moteurs ACP et de répartition des réponses pour les plugins chargés au démarrage |
    | `plugin-sdk/acp-binding-resolve-runtime` | Résolution en lecture seule des liaisons ACP sans importations du démarrage du cycle de vie |
    | `plugin-sdk/agent-config-primitives` | Primitives obsolètes du schéma de configuration de l’environnement d’exécution des agents ; importez les primitives de schéma depuis une interface maintenue appartenant à un plugin |
    | `plugin-sdk/boolean-param` | Lecteur permissif de paramètres booléens |
    | `plugin-sdk/dangerous-name-runtime` | Utilitaires de résolution des correspondances de noms dangereux |
    | `plugin-sdk/device-bootstrap` | Utilitaires d’amorçage et de jetons d’appairage des appareils, y compris `BOOTSTRAP_HANDOFF_OPERATOR_SCOPES` |
    | `plugin-sdk/extension-shared` | Primitives d’utilitaires partagées pour les canaux passifs, l’état et les proxys ambiants |
    | `plugin-sdk/models-provider-runtime` | Utilitaires de réponses de commande et de fournisseur `/models` |
    | `plugin-sdk/skill-commands-runtime` | Utilitaires de liste des commandes de Skills |
    | `plugin-sdk/native-command-registry` | Utilitaires de registre, de construction et de sérialisation des commandes natives |
    | `plugin-sdk/agent-harness` | Interface expérimentale pour plugins de confiance destinée aux harnais d’agents de bas niveau : types de harnais, utilitaires de pilotage et d’abandon des exécutions actives, utilitaires de pont d’outils OpenClaw, utilitaires de politique d’outils du plan d’exécution, classification du résultat terminal, utilitaires de formatage et de détail de la progression des outils, et utilitaires de résultats des tentatives |
    | `plugin-sdk/provider-zai-endpoint` | Façade obsolète de détection des points de terminaison appartenant au fournisseur Z.AI ; utilisez l’API publique du plugin Z.AI |
    | `plugin-sdk/async-lock-runtime` | Utilitaire de verrouillage asynchrone local au processus pour les petits fichiers d’état de l’environnement d’exécution |
    | `plugin-sdk/channel-activity-runtime` | Utilitaire de télémétrie de l’activité des canaux |
    | `plugin-sdk/concurrency-runtime` | Utilitaire de concurrence bornée des tâches asynchrones |
    | `plugin-sdk/dedupe-runtime` | Utilitaires de cache de déduplication en mémoire et adossé à un stockage persistant |
    | `plugin-sdk/delivery-queue-runtime` | Utilitaire de vidage des livraisons sortantes en attente |
    | `plugin-sdk/file-access-runtime` | Utilitaires sécurisés de chemins de fichiers locaux et de sources multimédias |
    | `plugin-sdk/heartbeat-runtime` | Utilitaires de réveil, d’événements et de visibilité du Heartbeat |
    | `plugin-sdk/expect-runtime` | Utilitaire d’assertion de valeur requise pour les invariants d’exécution démontrables |
    | `plugin-sdk/number-runtime` | Utilitaire de coercition numérique |
    | `plugin-sdk/secure-random-runtime` | Utilitaires sécurisés de jetons et d’UUID |
    | `plugin-sdk/system-event-runtime` | Utilitaires de file d’attente des événements système |
    | `plugin-sdk/transport-ready-runtime` | Utilitaire d’attente de la disponibilité du transport |
    | `plugin-sdk/exec-approvals-runtime` | Utilitaires de fichiers de politique d’approbation des exécutions sans le point d’exportation général de l’environnement d’exécution de l’infrastructure |
    | `plugin-sdk/infra-runtime` | Couche de compatibilité obsolète ; utilisez les sous-chemins ciblés de l’environnement d’exécution ci-dessus |
    | `plugin-sdk/collection-runtime` | Petits utilitaires de cache borné |
    | `plugin-sdk/diagnostic-runtime` | Utilitaires d’indicateurs de diagnostic, d’événements et de contexte de traçage |
    | `plugin-sdk/error-runtime` | Graphe d’erreurs, formatage, utilitaires partagés de classification des erreurs, `PlatformMessageNotDispatchedError`, `isApprovalNotFoundError` |
    | `plugin-sdk/fetch-runtime` | Utilitaires de récupération encapsulée, de proxy, d’options EnvHttpProxyAgent et de résolution épinglée |
    | `plugin-sdk/runtime-fetch` | Récupération à l’exécution tenant compte du répartiteur sans importations de proxy ni de récupération protégée |
    | `plugin-sdk/inline-image-data-url-runtime` | Utilitaires d’assainissement des URL de données d’images intégrées et de détection des signatures sans l’interface générale de l’environnement d’exécution multimédia |
    | `plugin-sdk/response-limit-runtime` | Lecteur borné du corps des réponses sans l’interface générale de l’environnement d’exécution multimédia |
    | `plugin-sdk/session-binding-runtime` | État actuel de liaison de la conversation sans routage des liaisons configurées ni magasins d’appairage |
    | `plugin-sdk/context-visibility-runtime` | Résolution de la visibilité du contexte et filtrage du contexte supplémentaire sans importations générales de configuration ou de sécurité |
    | `plugin-sdk/string-coerce-runtime` | Utilitaires ciblés de coercition et de normalisation primitives des enregistrements et des chaînes sans importations Markdown ou de journalisation |
    | `plugin-sdk/host-runtime` | Utilitaires de normalisation des noms d’hôte et des hôtes SCP |
    | `plugin-sdk/retry-runtime` | Utilitaires de configuration et d’exécution des nouvelles tentatives |
    | `plugin-sdk/agent-runtime` | Point d’exportation général obsolète pour les utilitaires de répertoire, d’identité et d’espace de travail des agents, notamment `resolveAgentDir`, `resolveDefaultAgentDir` et l’exportation de compatibilité obsolète `resolveOpenClawAgentDir` ; privilégiez les sous-chemins ciblés des agents et de l’environnement d’exécution |
    | `plugin-sdk/directory-runtime` | Requête/déduplication d’annuaire basée sur la configuration |
    | `plugin-sdk/keyed-async-queue` | `KeyedAsyncQueue` |
  </Accordion>

  <Accordion title="Sous-chemins des fonctionnalités et des tests">
    | Sous-chemin | Principales exportations |
    | --- | --- |
    | `plugin-sdk/media-runtime` | Point d’exportation général obsolète pour les médias, comprenant `saveRemoteMedia`, `saveResponseMedia`, `readRemoteMediaBuffer` et la fonction obsolète `fetchRemoteMedia` ; préférez `plugin-sdk/media-store`, `plugin-sdk/media-mime`, `plugin-sdk/outbound-media` et les sous-chemins d’exécution des fonctionnalités, et privilégiez les fonctions d’assistance du magasin avant la lecture des tampons lorsqu’une URL doit devenir un média OpenClaw |
    | `plugin-sdk/media-mime` | Fonctions d’assistance ciblées pour la normalisation MIME, la mise en correspondance des extensions de fichiers, la détection MIME et les types de médias |
    | `plugin-sdk/media-store` | Fonctions d’assistance ciblées pour le magasin de médias, telles que `saveMediaBuffer` et `saveMediaStream` |
    | `plugin-sdk/media-generation-runtime` | Fonctions d’assistance partagées pour le basculement de génération de médias, la sélection des candidats et les messages relatifs aux modèles manquants |
    | `plugin-sdk/media-understanding` | Types de fournisseurs de compréhension des médias, ainsi que les exportations de fonctions d’assistance destinées aux fournisseurs pour les images, l’audio et l’extraction structurée |
    | `plugin-sdk/text-chunking` | Fonctions d’assistance pour le découpage et le rendu des textes et du Markdown sortants, la conversion des tableaux Markdown, la suppression des balises de directive et les utilitaires de texte sécurisé |
    | `plugin-sdk/speech` | Types de fournisseurs vocaux, ainsi que les exportations destinées aux fournisseurs pour les directives, le registre, la validation, le générateur TTS compatible avec OpenAI et les fonctions d’assistance vocales |
    | `plugin-sdk/speech-core` | Types partagés de fournisseurs vocaux, registre, directives, normalisation et exportations de fonctions d’assistance vocales |
    | `plugin-sdk/realtime-transcription` | Types de fournisseurs de transcription en temps réel, fonctions d’assistance du registre et fonction d’assistance partagée pour les sessions WebSocket |
    | `plugin-sdk/realtime-bootstrap-context` | Fonction d’assistance d’amorçage des profils en temps réel pour l’injection limitée du contexte de `IDENTITY.md`, `USER.md` et `SOUL.md` |
    | `plugin-sdk/realtime-voice` | Types de fournisseurs vocaux en temps réel, fonctions d’assistance du registre et fonctions d’assistance partagées pour le comportement vocal en temps réel, notamment le suivi de l’activité de sortie |
    | `plugin-sdk/image-generation` | Types de fournisseurs de génération d’images, fonctions d’assistance pour les ressources d’image et les URL de données, ainsi que le générateur de fournisseur d’images compatible avec OpenAI |
    | `plugin-sdk/image-generation-core` | Types partagés de génération d’images, fonctions d’assistance pour le basculement, l’authentification et le registre |
    | `plugin-sdk/music-generation` | Types de fournisseurs, de requêtes et de résultats pour la génération musicale |
    | `plugin-sdk/music-generation-core` | Types partagés obsolètes de génération musicale, fonctions d’assistance pour le basculement, recherche de fournisseurs et analyse des références de modèles ; préférez les surfaces de fournisseurs musicaux appartenant aux Plugins |
    | `plugin-sdk/video-generation` | Types de fournisseurs, de requêtes et de résultats pour la génération vidéo |
    | `plugin-sdk/video-generation-core` | Types partagés de génération vidéo, fonctions d’assistance pour le basculement, recherche de fournisseurs et analyse des références de modèles |
    | `plugin-sdk/transcripts` | Types partagés de fournisseurs de sources de transcriptions, fonctions d’assistance du registre, descripteurs de sessions et métadonnées des énoncés |
    | `plugin-sdk/webhook-targets` | Registre de cibles Webhook et fonctions d’assistance pour l’installation des routes |
    | `plugin-sdk/webhook-path` | Alias de compatibilité obsolète ; utilisez `plugin-sdk/webhook-ingress` |
    | `plugin-sdk/web-media` | Fonctions d’assistance partagées pour le chargement de médias distants et locaux |
    | `plugin-sdk/zod` | Réexportation de compatibilité obsolète ; importez directement `zod` depuis `zod` |
    | `plugin-sdk/testing` | Point d’exportation de compatibilité obsolète local au dépôt pour les anciens tests OpenClaw. Les nouveaux tests du dépôt doivent plutôt importer des sous-chemins de test locaux ciblés, tels que `plugin-sdk/agent-runtime-test-contracts`, `plugin-sdk/plugin-test-runtime`, `plugin-sdk/channel-test-helpers`, `plugin-sdk/test-env` ou `plugin-sdk/test-fixtures` |
    | `plugin-sdk/plugin-test-api` | Fonction d’assistance minimale `createTestPluginApi`, locale au dépôt, pour les tests unitaires d’enregistrement direct des Plugins sans importer les passerelles de fonctions d’assistance de test du dépôt |
    | `plugin-sdk/agent-runtime-test-contracts` | Jeux de données de test, locaux au dépôt, pour les contrats des adaptateurs natifs d’exécution d’agent concernant l’authentification, la livraison, le repli, les hooks d’outils, la superposition des prompts, les schémas et les tests de projection des transcriptions |
    | `plugin-sdk/channel-test-helpers` | Fonctions d’assistance de test orientées canaux, locales au dépôt, pour les contrats génériques d’actions, de configuration et d’état, les assertions d’annuaire, le cycle de vie du démarrage des comptes, la propagation de la configuration d’envoi, les simulations d’exécution, les problèmes d’état, la livraison sortante et l’enregistrement des hooks |
    | `plugin-sdk/channel-target-testing` | Suite partagée, locale au dépôt, de cas d’erreur de résolution des cibles pour les tests de canaux |
    | `plugin-sdk/channel-contract-testing` | Fonctions d’assistance ciblées, locales au dépôt, pour les tests de contrats de canaux, sans le point d’exportation général de test |
    | `plugin-sdk/plugin-test-contracts` | Fonctions d’assistance, locales au dépôt, pour les contrats relatifs aux paquets de Plugins, à l’enregistrement, aux artefacts publics, aux importations directes, à l’API d’exécution et aux effets secondaires des importations |
    | `plugin-sdk/plugin-state-test-runtime` | Fonctions d’assistance de test, locales au dépôt, pour le magasin d’état des Plugins, la file d’attente d’entrée et la base de données d’état |
    | `plugin-sdk/provider-test-contracts` | Fonctions d’assistance, locales au dépôt, pour les contrats d’exécution des fournisseurs, d’authentification, de découverte, d’intégration, de catalogue, d’assistant, de fonctionnalité multimédia, de politique de relecture, de reconnaissance vocale en temps réel avec audio en direct, de recherche et de récupération Web, et de flux |
    | `plugin-sdk/provider-http-test-mocks` | Simulations Vitest HTTP/d’authentification facultatives, locales au dépôt, pour les tests de fournisseurs qui utilisent `plugin-sdk/provider-http` |
    | `plugin-sdk/reply-payload-testing` | Fonctions d’assistance, locales au dépôt, pour joindre des métadonnées aux jeux de données de test des charges utiles de réponse |
    | `plugin-sdk/sqlite-runtime-testing` | Fonctions d’assistance, locales au dépôt, pour le cycle de vie de SQLite dans les tests internes |
    | `plugin-sdk/test-fixtures` | Jeux de données de test génériques, locaux au dépôt, pour la capture de l’exécution de la CLI, le contexte de bac à sable, l’écriture de Skills, les messages d’agent, les événements système, le rechargement des modules, les chemins des Plugins intégrés, le texte du terminal, le découpage, les jetons d’authentification et les cas typés |
    | `plugin-sdk/test-node-mocks` | Fonctions d’assistance ciblées, locales au dépôt, pour simuler les modules intégrés de Node dans les fabriques Vitest `vi.mock("node:*")` |
  </Accordion>

  <Accordion title="Sous-chemins de mémoire">
    | Sous-chemin | Principales exportations |
    | --- | --- |
    | `plugin-sdk/memory-core` | Alias de compatibilité obsolète ; utilisez `plugin-sdk/memory-host-core` |
    | `plugin-sdk/memory-core-engine-runtime` | Façade d’exécution obsolète pour l’indexation et la recherche en mémoire ; préférez les sous-chemins d’hôte de mémoire indépendants des fournisseurs |
    | `plugin-sdk/memory-core-host-embedding-registry` | Fonctions d’assistance légères pour le registre des fournisseurs de plongements de mémoire |
    | `plugin-sdk/memory-core-host-engine-foundation` | Exportations du moteur fondamental de l’hôte de mémoire |
    | `plugin-sdk/memory-core-host-engine-embeddings` | Contrats de plongements de l’hôte de mémoire, accès au registre, fournisseur local et fonctions d’assistance génériques pour les traitements par lots et distants. `registerMemoryEmbeddingProvider` est obsolète sur cette surface ; utilisez l’API générique des fournisseurs de plongements pour les nouveaux fournisseurs. |
    | `plugin-sdk/memory-core-host-engine-qmd` | Exportations du moteur QMD de l’hôte de mémoire |
    | `plugin-sdk/memory-core-host-engine-storage` | Exportations du moteur de stockage de l’hôte de mémoire |
    | `plugin-sdk/memory-core-host-multimodal` | Fonctions d’assistance multimodales obsolètes de l’hôte de mémoire ; préférez les sous-chemins d’hôte de mémoire indépendants des fournisseurs |
    | `plugin-sdk/memory-core-host-query` | Fonctions d’assistance obsolètes pour les requêtes de l’hôte de mémoire ; préférez les sous-chemins d’hôte de mémoire indépendants des fournisseurs |
    | `plugin-sdk/memory-core-host-secret` | Fonctions d’assistance pour les secrets de l’hôte de mémoire |
    | `plugin-sdk/memory-core-host-events` | Alias de compatibilité obsolète ; utilisez `plugin-sdk/memory-host-events` |
    | `plugin-sdk/memory-core-host-status` | Fonctions d’assistance pour l’état de l’hôte de mémoire |
    | `plugin-sdk/memory-core-host-runtime-cli` | Fonctions d’assistance pour l’exécution CLI de l’hôte de mémoire |
    | `plugin-sdk/memory-core-host-runtime-core` | Fonctions d’assistance pour l’exécution principale de l’hôte de mémoire |
    | `plugin-sdk/memory-core-host-runtime-files` | Fonctions d’assistance pour les fichiers et l’exécution de l’hôte de mémoire |
    | `plugin-sdk/memory-host-core` | Alias indépendant des fournisseurs pour les fonctions d’assistance de l’exécution principale de l’hôte de mémoire |
    | `plugin-sdk/memory-host-events` | Alias indépendant des fournisseurs pour les fonctions d’assistance du journal des événements de l’hôte de mémoire |
    | `plugin-sdk/memory-host-files` | Alias de compatibilité obsolète ; utilisez `plugin-sdk/memory-core-host-runtime-files` |
    | `plugin-sdk/memory-host-markdown` | Fonctions d’assistance partagées pour le Markdown géré, destinées aux Plugins liés à la mémoire |
    | `plugin-sdk/memory-host-search` | Façade d’exécution d’Active Memory pour accéder au gestionnaire de recherche |
    | `plugin-sdk/memory-host-status` | Alias de compatibilité obsolète ; utilisez `plugin-sdk/memory-core-host-status` |
  </Accordion>

  <Accordion title="Sous-chemins réservés aux fonctions d’assistance intégrées">
    Les sous-chemins du SDK réservés aux fonctions d’assistance intégrées sont des surfaces ciblées propres à leurs responsables, destinées au
    code des Plugins intégrés. Ils sont répertoriés dans l’inventaire du SDK afin que la
    compilation des paquets et la création d’alias restent déterministes, mais ils ne constituent pas des API générales de
    création de Plugins. Les nouveaux contrats d’hôte réutilisables doivent employer des sous-chemins génériques du SDK,
    tels que `plugin-sdk/gateway-runtime`, `plugin-sdk/ssrf-runtime` et
    `plugin-sdk/plugin-config-runtime`.

    | Sous-chemin | Responsable et objectif |
    | --- | --- |
    | `plugin-sdk/codex-mcp-projection` | Fonction d’assistance du Plugin Codex intégré pour projeter la configuration utilisateur des serveurs MCP dans la configuration des fils de discussion du serveur d’application Codex (exportation de paquet réservée) |
    | `plugin-sdk/codex-native-task-runtime` | Fonction d’assistance du Plugin Codex intégré pour répliquer les sous-agents natifs du serveur d’application Codex dans l’état des tâches OpenClaw (uniquement locale au dépôt, sans exportation de paquet) |

  </Accordion>
</AccordionGroup>

## Pages connexes

- [Présentation du SDK de Plugin](/fr/plugins/sdk-overview)
- [Configuration du SDK de Plugin](/fr/plugins/sdk-setup)
- [Création de Plugins](/fr/plugins/building-plugins)
