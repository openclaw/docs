---
read_when:
    - Choisir le bon sous-chemin de plugin-sdk pour l’importation d’un plugin
    - Audit des sous-chemins des plugins intégrés et des interfaces d’assistance
summary: 'Catalogue des sous-chemins du SDK de Plugin : emplacement des importations, regroupées par domaine'
title: Sous-chemins du SDK de Plugin
x-i18n:
    generated_at: "2026-07-16T13:36:52Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 937b616d7a95c250f7ff328ea3faa12143272722ffa638f50214fdd72ef5f225
    source_path: plugins/sdk-subpaths.md
    workflow: 16
---

Le SDK de Plugin est exposé sous la forme d’un ensemble de sous-chemins publics ciblés sous
`openclaw/plugin-sdk/`. Cette page répertorie les sous-chemins couramment utilisés, regroupés par
fonction. Trois fichiers définissent la surface :

- `scripts/lib/plugin-sdk-entrypoints.json` : l’inventaire maintenu des points d’entrée
  que la compilation compile.
- `scripts/lib/plugin-sdk-private-local-only-subpaths.json` : les sous-chemins
  de test/internes propres au dépôt. Les exportations du paquet correspondent à l’inventaire moins cette liste.
- `src/plugin-sdk/entrypoints.ts` : les métadonnées de classification des
  sous-chemins obsolètes, des assistants groupés réservés, des façades groupées prises en charge et
  des surfaces publiques appartenant aux plugins.

Les mainteneurs auditent le nombre d’exportations publiques avec `pnpm plugin-sdk:surface` et
les sous-chemins actifs des assistants réservés avec `pnpm plugins:boundary-report:summary` ;
les exportations inutilisées d’assistants réservés font échouer le rapport de CI au lieu de rester dans le
SDK public comme dette de compatibilité dormante.

Pour le guide de création de plugins, consultez [Présentation du SDK de Plugin](/fr/plugins/sdk-overview).

## Point d’entrée du Plugin

| Sous-chemin                     | Exportations principales                                                                                                                                                                                  |
| ------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `plugin-sdk/plugin-entry`      | `definePluginEntry`                                                                                                                                                                                     |
| `plugin-sdk/core`              | `defineChannelPluginEntry`, `createChatChannelPlugin`, `createChannelPluginBase`, `defineSetupPluginEntry`, `buildChannelConfigSchema`, `buildJsonChannelConfigSchema`, `resolveTailscalePublishedHost` |
| `plugin-sdk/provider-entry`    | `defineSingleProviderPluginEntry`                                                                                                                                                                       |
| `plugin-sdk/migration`         | Assistants pour les éléments des fournisseurs de migration, tels que `createMigrationItem`, constantes de motifs, marqueurs d’état des éléments, assistants de caviardage et `summarizeMigrationItems`                                                  |
| `plugin-sdk/migration-runtime` | Assistants de migration d’exécution, tels que `copyMigrationFileItem`, `resolvePlannedMigrationTargets`, `withCachedMigrationConfigRuntime` et `writeMigrationReport`                                             |
| `plugin-sdk/health`            | Enregistrement des contrôles d’intégrité de Doctor, détection, réparation, sélection, sévérité et types de constat pour les consommateurs d’intégrité groupés                                                                                |
| `plugin-sdk/config-schema`     | Obsolète. Schéma Zod racine `openclaw.json` (`OpenClawSchema`) ; définissez plutôt des schémas locaux au Plugin et validez-les avec `plugin-sdk/json-schema-runtime`                                                  |

### Assistants de compatibilité et de test obsolètes

Les sous-chemins obsolètes restent exportés pour les anciens plugins, mais le nouveau code doit utiliser les
sous-chemins ciblés du SDK ci-dessous. La liste maintenue est
`scripts/lib/plugin-sdk-deprecated-public-subpaths.json` ; la CI rejette les
importations de production groupées provenant de cette liste. Les barils généraux tels que `plugin-sdk/compat`,
`plugin-sdk/config-types`, `plugin-sdk/infra-runtime` et
`plugin-sdk/text-runtime` servent uniquement à la compatibilité, et `plugin-sdk/zod` est une
réexportation de compatibilité : importez `zod` directement depuis `zod`. Les barils
généraux de domaine `plugin-sdk/agent-runtime`, `plugin-sdk/channel-lifecycle`,
`plugin-sdk/channel-runtime`, `plugin-sdk/cli-runtime`,
`plugin-sdk/conversation-runtime`, `plugin-sdk/hook-runtime`,
`plugin-sdk/media-runtime`, `plugin-sdk/plugin-runtime` et
`plugin-sdk/security-runtime` sont également obsolètes au profit de
sous-chemins ciblés.

Les sous-chemins des assistants de test d’OpenClaw basés sur Vitest sont réservés au dépôt et ne sont
plus exportés par le paquet : `agent-runtime-test-contracts`,
`channel-contract-testing`, `channel-target-testing`, `channel-test-helpers`,
`plugin-state-test-runtime`, `plugin-test-api`, `plugin-test-contracts`,
`plugin-test-runtime`, `provider-http-test-mocks`, `provider-test-contracts`,
`reply-payload-testing`, `sqlite-runtime-testing`, `test-env`, `test-fixtures`,
`test-node-mocks` et `testing`. Les surfaces privées des assistants groupés
`ssrf-runtime-internal` et `codex-native-task-runtime` sont également réservées
au dépôt.

### Sous-chemins réservés des assistants de plugins groupés

`plugin-sdk/codex-mcp-projection` est le seul sous-chemin réservé : une surface de
compatibilité appartenant au Plugin pour le Plugin Codex groupé, et non une API générale du SDK.
Les importations de plugins entre propriétaires sont bloquées par les garde-fous du contrat du paquet, et
la CI échoue lorsqu’un sous-chemin réservé cesse d’être importé.
`plugin-sdk/codex-native-task-runtime` est réservé au dépôt et n’est pas une
exportation du paquet.

`src/plugin-sdk/entrypoints.ts` répertorie également les façades groupées prises en charge, des points d’entrée du SDK
soutenus par leur Plugin groupé jusqu’à ce que des contrats génériques les remplacent :
`plugin-sdk/discord`, `plugin-sdk/lmstudio`, `plugin-sdk/lmstudio-runtime`,
`plugin-sdk/matrix`, `plugin-sdk/mattermost`,
`plugin-sdk/memory-core-engine-runtime`, `plugin-sdk/provider-zai-endpoint`,
`plugin-sdk/qa-runner-runtime`, `plugin-sdk/telegram-account`,
`plugin-sdk/tts-runtime` et `plugin-sdk/zalouser`. Plusieurs d’entre eux sont également
obsolètes pour le nouveau code ; consultez les notes de chaque ligne ci-dessous.

<AccordionGroup>
  <Accordion title="Sous-chemins des canaux">
    | Sous-chemin | Principaux exports |
    | --- | --- |
    | `plugin-sdk/channel-core` | `defineChannelPluginEntry`, `defineSetupPluginEntry`, `createChatChannelPlugin`, `createChannelPluginBase`, `createChannelConfigUiHints` |
    | `plugin-sdk/json-schema-runtime` | Utilitaire de validation de schéma JSON mis en cache pour les schémas appartenant aux plugins |
    | `plugin-sdk/channel-setup` | `createOptionalChannelSetupSurface`, `createOptionalChannelSetupAdapter`, `createOptionalChannelSetupWizard`, ainsi que `DEFAULT_ACCOUNT_ID`, `createTopLevelChannelDmPolicy`, `setSetupChannelEnabled`, `splitSetupEntries` |
    | `plugin-sdk/setup` | Utilitaires partagés de l’assistant de configuration, traducteur de configuration, invites de liste d’autorisation, générateurs d’état de configuration |
    | `plugin-sdk/setup-runtime` | `createSetupTranslator`, `createPatchedAccountSetupAdapter`, `createEnvPatchedAccountSetupAdapter`, `createSetupInputPresenceValidator`, `noteChannelLookupFailure`, `noteChannelLookupSummary`, `promptResolvedAllowFrom`, `splitSetupEntries`, `createAllowlistSetupWizardProxy`, `createDelegatedSetupWizardProxy` |
    | `plugin-sdk/setup-adapter-runtime` | Alias de compatibilité obsolète ; utilisez `plugin-sdk/setup-runtime` |
    | `plugin-sdk/setup-tools` | `formatCliCommand`, `detectBinary`, `extractArchive`, `resolveBrewExecutable`, `formatDocsLink`, `CONFIG_DIR` |
    | `plugin-sdk/account-core` | Utilitaires de configuration multicomptes et de contrôle des actions, utilitaires de repli vers le compte par défaut |
    | `plugin-sdk/account-id` | `DEFAULT_ACCOUNT_ID`, utilitaires de normalisation des identifiants de compte |
    | `plugin-sdk/account-resolution` | Utilitaires de recherche de compte et de repli vers la valeur par défaut |
    | `plugin-sdk/account-helpers` | Utilitaires ciblés de liste de comptes et d’actions sur les comptes |
    | `plugin-sdk/access-groups` | Utilitaires d’analyse des listes d’autorisation des groupes d’accès et de diagnostic expurgé des groupes |
    | `plugin-sdk/channel-pairing` | `createChannelPairingController` |
    | `plugin-sdk/channel-reply-pipeline` | Façade de compatibilité obsolète. Utilisez `plugin-sdk/channel-outbound`. |
    | `plugin-sdk/channel-config-helpers` | `createHybridChannelConfigAdapter`, `resolveChannelDmAccess`, `resolveChannelDmAllowFrom`, `resolveChannelDmPolicy`, `normalizeChannelDmPolicy`, `normalizeLegacyDmAliases` |
    | `plugin-sdk/channel-config-schema` | Primitives partagées de schéma de configuration des canaux, ainsi que générateurs Zod et JSON/TypeBox directs |
    | `plugin-sdk/bundled-channel-config-schema` | Schémas de configuration des canaux OpenClaw intégrés, réservés aux plugins intégrés maintenus |
    | `plugin-sdk/chat-channel-ids` | `BUNDLED_CHAT_CHANNEL_IDS`, `BUNDLED_CHAT_CHANNEL_ENVELOPE_PREFIXES`, `ChatChannelId`. Identifiants canoniques des canaux de discussion intégrés/officiels, ainsi que libellés et alias de formatage pour les plugins qui doivent reconnaître du texte préfixé par une enveloppe sans coder leur propre table en dur. |
    | `plugin-sdk/channel-config-schema-legacy` | Alias de compatibilité obsolète pour les schémas de configuration des canaux intégrés |
    | `plugin-sdk/telegram-command-config` | Normalisation obsolète des noms et descriptions de commandes Telegram, ainsi que vérifications des doublons et conflits ; utilisez la gestion locale au plugin de la configuration des commandes dans le nouveau code de plugin |
    | `plugin-sdk/command-gating` | Utilitaires ciblés de contrôle d’autorisation des commandes |
    | `plugin-sdk/channel-policy` | `resolveChannelGroupRequireMention` |
    | `plugin-sdk/channel-ingress-runtime` | Résolveur expérimental de haut niveau pour l’environnement d’exécution d’entrée des canaux et générateurs de faits de routage pour les chemins de réception de canal migrés. Préférez-le à l’assemblage, dans chaque plugin, des listes d’autorisation effectives, des listes d’autorisation de commandes et des projections héritées. Consultez [API d’entrée des canaux](/fr/plugins/sdk-channel-ingress). |
    | `plugin-sdk/channel-lifecycle` | Façade de compatibilité obsolète. Utilisez `plugin-sdk/channel-outbound`. |
    | `plugin-sdk/channel-outbound` | Contrats de cycle de vie des messages, ainsi qu’options du pipeline de réponse, accusés de réception, aperçu en direct/diffusion en continu, utilitaires de cycle de vie, identité sortante, planification des charges utiles, envois durables et utilitaires de contexte d’envoi de message. Consultez [API de sortie des canaux](/fr/plugins/sdk-channel-outbound). |
    | `plugin-sdk/channel-message` | Alias de compatibilité obsolète pour `plugin-sdk/channel-outbound`. |
    | `plugin-sdk/channel-message-runtime` | Alias de compatibilité obsolète pour `plugin-sdk/channel-outbound`. |
    | `plugin-sdk/inbound-envelope` | Utilitaires partagés de routage entrant et de génération d’enveloppes |
    | `plugin-sdk/inbound-reply-dispatch` | Façade de compatibilité obsolète. Utilisez `plugin-sdk/channel-inbound` pour les exécuteurs entrants et les prédicats de distribution, et `plugin-sdk/channel-outbound` pour les utilitaires de remise des messages. |
    | `plugin-sdk/messaging-targets` | Alias obsolète d’analyse des cibles ; utilisez `plugin-sdk/channel-targets` |
    | `plugin-sdk/outbound-media` | Utilitaires partagés de chargement des médias sortants et de gestion de l’état des médias hébergés |
    | `plugin-sdk/outbound-send-deps` | Façade de compatibilité obsolète. Utilisez `plugin-sdk/channel-outbound`. |
    | `plugin-sdk/outbound-runtime` | Façade de compatibilité obsolète. Utilisez `plugin-sdk/channel-outbound`. |
    | `plugin-sdk/poll-runtime` | Utilitaires ciblés de normalisation des sondages |
    | `plugin-sdk/thread-bindings-runtime` | Utilitaires de cycle de vie et d’adaptation pour la liaison des fils de discussion |
    | `plugin-sdk/agent-media-payload` | Racines et chargeurs des charges utiles multimédias des agents |
    | `plugin-sdk/conversation-runtime` | Point d’exportation général obsolète pour la liaison des conversations/fils de discussion, l’appairage et les utilitaires de liaison configurée ; préférez des sous-chemins de liaison ciblés tels que `plugin-sdk/thread-bindings-runtime` et `plugin-sdk/session-binding-runtime` |
    | `plugin-sdk/runtime-group-policy` | Utilitaires de résolution des politiques de groupe à l’exécution |
    | `plugin-sdk/channel-status` | Utilitaires partagés d’instantané et de résumé de l’état des canaux |
    | `plugin-sdk/channel-config-primitives` | Primitives ciblées de schéma de configuration des canaux |
    | `plugin-sdk/channel-config-writes` | Utilitaires d’autorisation d’écriture de la configuration des canaux |
    | `plugin-sdk/channel-plugin-common` | Exports partagés du prélude des plugins de canal |
    | `plugin-sdk/allowlist-config-edit` | Utilitaires de modification et de lecture de la configuration des listes d’autorisation |
    | `plugin-sdk/group-access` | Utilitaires obsolètes de décision d’accès aux groupes ; utilisez `resolveChannelMessageIngress` depuis `plugin-sdk/channel-ingress-runtime` |
    | `plugin-sdk/direct-dm`, `plugin-sdk/direct-dm-access` | Façades de compatibilité obsolètes. Utilisez `plugin-sdk/channel-inbound`. |
    | `plugin-sdk/direct-dm-guard-policy` | Utilitaires ciblés de politique de protection précryptographique des messages directs |
    | `plugin-sdk/discord` | Façade de compatibilité Discord obsolète pour `@openclaw/discord@2026.3.13` publié et la compatibilité suivie par le propriétaire ; les nouveaux plugins doivent utiliser les sous-chemins génériques du SDK de canal |
    | `plugin-sdk/telegram-account` | Façade de compatibilité obsolète de résolution des comptes Telegram pour la compatibilité suivie par le propriétaire ; les nouveaux plugins doivent utiliser les utilitaires d’exécution injectés ou les sous-chemins génériques du SDK de canal |
    | `plugin-sdk/zalouser` | Façade de compatibilité Zalo Personal obsolète pour les paquets Lark/Zalo publiés qui importent encore l’autorisation des commandes de l’expéditeur ; les nouveaux plugins doivent utiliser les sous-chemins génériques du SDK de canal |
    | `plugin-sdk/interactive-runtime` | Utilitaires de présentation sémantique des messages, de remise et de réponse interactive héritée. Consultez [Présentation des messages](/fr/plugins/message-presentation) |
    | `plugin-sdk/channel-inbound` | Utilitaires entrants partagés pour la classification des événements, la création du contexte, le formatage, les racines, l’anti-rebond, la détection des mentions, la politique de mention et la journalisation des entrées |
    | `plugin-sdk/channel-inbound-debounce` | Utilitaires ciblés d’anti-rebond des entrées |
    | `plugin-sdk/channel-mention-gating` | Utilitaires ciblés de politique de mention, de marqueur de mention et de texte de mention, sans la surface plus large de l’environnement d’exécution entrant |
    | `plugin-sdk/channel-envelope`, `plugin-sdk/channel-inbound-roots`, `plugin-sdk/channel-location`, `plugin-sdk/channel-logging` | Façades de compatibilité obsolètes. Utilisez `plugin-sdk/channel-inbound` ou `plugin-sdk/channel-outbound`. |
    | `plugin-sdk/channel-pairing-paths` | Façade de compatibilité obsolète. Utilisez `plugin-sdk/channel-pairing`. |
    | `plugin-sdk/channel-reply-options-runtime` | Façade de compatibilité obsolète. Utilisez `plugin-sdk/channel-outbound`. |
    | `plugin-sdk/channel-streaming` | Façade de compatibilité obsolète. Utilisez `plugin-sdk/channel-outbound`. |
    | `plugin-sdk/channel-send-result` | Types de résultats de réponse |
    | `plugin-sdk/channel-actions` | Utilitaires d’actions sur les messages des canaux, ainsi que générateurs de schémas natifs obsolètes conservés pour la compatibilité des plugins |
    | `plugin-sdk/channel-route` | Normalisation partagée des routes, résolution des cibles pilotée par l’analyseur, conversion des identifiants de fil de discussion en chaînes, clés de route dédupliquées/compactes, types de cibles analysées et utilitaires de comparaison des routes/cibles |
    | `plugin-sdk/channel-targets` | Utilitaires d’analyse des cibles ; les appelants qui comparent les routes doivent utiliser `plugin-sdk/channel-route` |
    | `plugin-sdk/channel-contract` | Types de contrats des canaux |
    | `plugin-sdk/channel-feedback` | Câblage des retours et réactions |
  </Accordion>

Les familles obsolètes d’utilitaires de canal restent disponibles uniquement pour
assurer la compatibilité des plugins publiés. Le plan de suppression est le suivant :
les conserver pendant la période de migration des plugins externes, maintenir les
plugins du dépôt/intégrés sur `channel-inbound` et `channel-outbound`, puis
supprimer les sous-chemins de compatibilité lors du prochain nettoyage majeur du
SDK. Cela s’applique aux anciennes familles de messages et d’environnement
d’exécution des canaux, de diffusion en continu des canaux, d’accès aux messages
directs, de fragments d’utilitaires entrants, d’options de réponse et de chemins
d’appairage.

  <Accordion title="Sous-chemins des fournisseurs">
    | Sous-chemin | Principales exportations |
    | --- | --- |
    | `plugin-sdk/provider-entry` | `defineSingleProviderPluginEntry` |
    | `plugin-sdk/lmstudio` | Façade de fournisseur LM Studio prise en charge pour la configuration, la découverte du catalogue et la préparation des modèles d’exécution |
    | `plugin-sdk/lmstudio-runtime` | Façade d’exécution LM Studio prise en charge pour les valeurs par défaut du serveur local, la découverte des modèles, les en-têtes de requête et les utilitaires pour les modèles chargés |
    | `plugin-sdk/provider-setup` | Utilitaires de configuration sélectionnés pour les fournisseurs locaux ou auto-hébergés |
    | `plugin-sdk/self-hosted-provider-setup` | Utilitaires de configuration auto-hébergée compatibles avec OpenAI obsolètes ; utilisez `plugin-sdk/provider-setup` ou les utilitaires de configuration appartenant au plugin |
    | `plugin-sdk/cli-backend` | Valeurs par défaut du backend CLI et constantes du dispositif de surveillance |
    | `plugin-sdk/provider-auth-runtime` | Utilitaires d’exécution pour l’authentification des fournisseurs : flux de bouclage OAuth, échange de jetons, persistance de l’authentification et résolution des clés d’API |
    | `plugin-sdk/provider-oauth-runtime` | Types génériques de rappel OAuth des fournisseurs, rendu de la page de rappel, utilitaires PKCE/d’état, analyse de l’entrée d’autorisation, utilitaires d’expiration des jetons et utilitaires d’abandon |
    | `plugin-sdk/provider-auth-api-key` | Utilitaires d’intégration par clé d’API et d’écriture de profil, tels que `upsertApiKeyProfile` |
    | `plugin-sdk/provider-auth-result` | Générateur standard de résultat d’authentification OAuth |
    | `plugin-sdk/provider-env-vars` | Utilitaires de recherche des variables d’environnement d’authentification des fournisseurs |
    | `plugin-sdk/provider-auth` | `createProviderApiKeyAuthMethod`, `ensureApiKeyFromOptionEnvOrPrompt`, `upsertAuthProfile`, `upsertApiKeyProfile`, `writeOAuthCredentials`, utilitaires d’importation de l’authentification OpenAI Codex, exportation de compatibilité `resolveOpenClawAgentDir` obsolète |
    | `plugin-sdk/provider-model-shared` | `ProviderReplayFamily`, `buildProviderReplayFamilyHooks`, `normalizeModelCompat`, générateurs partagés de politiques de réexécution, utilitaires de points de terminaison de fournisseurs et utilitaires partagés de normalisation des identifiants de modèles |
    | `plugin-sdk/provider-catalog-live-runtime` | Utilitaires de catalogue de modèles de fournisseurs en direct pour une découverte protégée de type `/models` : `buildLiveModelProviderConfig`, `fetchLiveProviderModelRows`, `getCachedLiveProviderModelRows`, `fetchLiveProviderModelIds`, `LiveModelCatalogHttpError`, `clearLiveCatalogCacheForTests`, filtrage des identifiants de modèles, cache TTL et solution de repli statique |
    | `plugin-sdk/provider-catalog-runtime` | Point d’extension d’exécution pour l’enrichissement du catalogue des fournisseurs et interfaces de registre des fournisseurs de plugins pour les tests de contrat |
    | `plugin-sdk/provider-catalog-shared` | `findCatalogTemplate`, `buildSingleProviderApiKeyCatalog`, `buildManifestModelProviderConfig`, `supportsNativeStreamingUsageCompat`, `applyProviderNativeStreamingUsageCompat` |
    | `plugin-sdk/provider-http` | Utilitaires génériques de capacités HTTP/de points de terminaison des fournisseurs, erreurs HTTP des fournisseurs et utilitaires de formulaires multipartites pour la transcription audio |
    | `plugin-sdk/provider-web-fetch-contract` | Utilitaires de contrat restreints pour la configuration et la sélection de récupération Web, tels que `enablePluginInConfig` et `WebFetchProviderPlugin` |
    | `plugin-sdk/provider-web-fetch` | Utilitaires d’enregistrement et de cache des fournisseurs de récupération Web |
    | `plugin-sdk/provider-web-search-config-contract` | Utilitaires restreints de configuration et d’identifiants pour la recherche Web destinés aux fournisseurs qui ne nécessitent pas de câblage d’activation du plugin |
    | `plugin-sdk/provider-web-search-contract` | Utilitaires de contrat restreints pour la configuration et les identifiants de recherche Web, tels que `createWebSearchProviderContractFields`, `enablePluginInConfig`, `resolveProviderWebSearchPluginConfig`, ainsi que des accesseurs et mutateurs d’identifiants à portée limitée |
    | `plugin-sdk/provider-web-search` | Utilitaires d’enregistrement, de cache et d’exécution des fournisseurs de recherche Web |
    | `plugin-sdk/embedding-providers` | Types généraux de fournisseurs d’incorporations et utilitaires de lecture, notamment `EmbeddingProviderAdapter`, `getEmbeddingProvider(...)` et `listEmbeddingProviders(...)` ; les plugins enregistrent les fournisseurs par l’intermédiaire de `api.registerEmbeddingProvider(...)` afin d’assurer le respect de la propriété du manifeste |
    | `plugin-sdk/provider-tools` | `ProviderToolCompatFamily`, `buildProviderToolCompatFamilyHooks`, ainsi que nettoyage des schémas et diagnostics pour DeepSeek/Gemini/OpenAI |
    | `plugin-sdk/provider-usage` | Types d’instantanés d’utilisation des fournisseurs, utilitaires partagés de récupération de l’utilisation et récupérateurs propres aux fournisseurs, tels que `fetchClaudeUsage` |
    | `plugin-sdk/provider-stream` | `ProviderStreamFamily`, `buildProviderStreamFamilyHooks`, `composeProviderStreamWrappers`, types d’enveloppes de flux, compatibilité des appels d’outils en texte brut et utilitaires partagés d’enveloppes Anthropic/Google/Kilocode/MiniMax/Moonshot/OpenAI/OpenRouter/Z.AI |
    | `plugin-sdk/provider-stream-shared` | Utilitaires publics partagés d’enveloppes de flux des fournisseurs, notamment `composeProviderStreamWrappers`, `createOpenAICompatibleCompletionsThinkingOffWrapper`, `createPlainTextToolCallCompatWrapper`, `createPayloadPatchStreamWrapper`, `createToolStreamWrapper`, `normalizeOpenAICompatibleReasoningPayload`, `setQwenChatTemplateThinking`, ainsi que les utilitaires de flux compatibles avec Anthropic/DeepSeek/OpenAI |
    | `plugin-sdk/provider-transport-runtime` | Utilitaires de transport natifs des fournisseurs, tels que la récupération protégée, l’extraction du texte des résultats d’outils, les transformations des messages de transport et les flux d’événements de transport accessibles en écriture |
    | `plugin-sdk/provider-onboard` | Utilitaires de mise à jour partielle de la configuration d’intégration |
    | `plugin-sdk/global-singleton` | Utilitaires de singleton, de table de correspondance et de cache locaux au processus |
    | `plugin-sdk/group-activation` | Utilitaires restreints pour le mode d’activation des groupes et l’analyse des commandes |
  </Accordion>

Les instantanés d’utilisation des fournisseurs indiquent normalement un ou plusieurs `windows` de quota, chacun avec
un libellé, un pourcentage utilisé et une heure facultative de réinitialisation. Les fournisseurs qui exposent un solde ou
un texte d’état du compte au lieu de fenêtres de quota réinitialisables doivent renvoyer
`summary` avec un tableau `windows` vide plutôt que d’inventer des pourcentages.
OpenClaw affiche ce texte récapitulatif dans la sortie d’état ; utilisez `error` uniquement lorsque le
point de terminaison d’utilisation a échoué ou n’a renvoyé aucune donnée d’utilisation exploitable.

  <Accordion title="Sous-chemins d’authentification et de sécurité">
    | Sous-chemin | Principales exportations |
    | --- | --- |
    | `plugin-sdk/command-auth` | Surface étendue d’autorisation des commandes obsolète (`resolveControlCommandGate`, utilitaires du registre de commandes, notamment le formatage dynamique du menu des arguments, utilitaires d’autorisation des expéditeurs) ; utilisez l’autorisation à l’entrée du canal ou à l’exécution, ou les utilitaires d’état des commandes |
    | `plugin-sdk/command-status` | Générateurs de messages de commande et d’aide, tels que `buildCommandsMessagePaginated` et `buildHelpMessage` |
    | `plugin-sdk/approval-auth-runtime` | Utilitaires de résolution des approbateurs et d’authentification des actions dans la même discussion |
    | `plugin-sdk/approval-client-runtime` | Utilitaires natifs de profils et de filtres d’approbation d’exécution |
    | `plugin-sdk/approval-delivery-runtime` | Adaptateurs natifs de capacité et de remise des approbations |
    | `plugin-sdk/approval-gateway-runtime` | Résolveur partagé du Gateway d’approbation |
    | `plugin-sdk/approval-reference-runtime` | Utilitaire déterministe de localisation durable pour les rappels d’approbation limités par le transport |
    | `plugin-sdk/approval-handler-adapter-runtime` | Utilitaires légers de chargement des adaptateurs d’approbation natifs pour les points d’entrée critiques des canaux |
    | `plugin-sdk/approval-handler-runtime` | Utilitaires d’exécution plus étendus pour les gestionnaires d’approbation ; privilégiez les interfaces plus restreintes d’adaptateur et de Gateway lorsqu’elles suffisent |
    | `plugin-sdk/approval-native-runtime` | Utilitaires natifs pour les cibles d’approbation, la liaison des comptes, le contrôle des routes, le transfert de repli et la suppression des invites locales d’approbation d’exécution native |
    | `plugin-sdk/approval-reaction-runtime` | Liaisons codées en dur des réactions d’approbation, charges utiles des invites de réaction, magasins de cibles de réaction, utilitaires de texte d’indication des réactions et exportation de compatibilité pour la suppression des invites locales d’approbation d’exécution native |
    | `plugin-sdk/approval-reply-runtime` | Utilitaires de charges utiles de réponse aux approbations d’exécution et de plugin |
    | `plugin-sdk/approval-runtime` | Utilitaires de charges utiles d’approbation d’exécution et de plugin, générateurs de capacités d’approbation, utilitaires d’authentification et de profils d’approbation, utilitaires natifs de routage et d’exécution des approbations, et utilitaires d’affichage structuré des approbations, tels que `formatApprovalDisplayPath` |
    | `plugin-sdk/reply-dedupe` | Utilitaires restreints et obsolètes de réinitialisation de la déduplication des réponses entrantes |
    | `plugin-sdk/command-auth-native` | Authentification native des commandes, formatage dynamique du menu des arguments et utilitaires natifs de ciblage des sessions |
    | `plugin-sdk/command-detection` | Utilitaires partagés de détection des commandes |
    | `plugin-sdk/command-primitives-runtime` | Prédicats légers sur le texte des commandes pour les chemins critiques des canaux |
    | `plugin-sdk/command-surface` | Utilitaires de normalisation du corps des commandes et de surface des commandes |
    | `plugin-sdk/allow-from` | `formatAllowFromLowercase` |
    | `plugin-sdk/provider-auth-login-flow-runtime` | Utilitaires chargés à la demande pour le flux de connexion à l’authentification des fournisseurs, destinés à l’association par code d’appareil dans les canaux privés et l’interface Web |
    | `plugin-sdk/channel-secret-runtime` | Surface étendue et obsolète du contrat de secrets (`collectSimpleChannelFieldAssignments`, `getChannelSurface`, `pushAssignment`, types de cibles de secrets) ; privilégiez les sous-chemins spécialisés ci-dessous |
    | `plugin-sdk/channel-secret-basic-runtime` | Exportations restreintes du contrat de secrets et générateurs de registres de cibles pour les surfaces de secrets des canaux et plugins hors TTS |
    | `plugin-sdk/channel-secret-tts-runtime` | Utilitaires restreints d’affectation des secrets TTS imbriqués des canaux |
    | `plugin-sdk/secret-ref-runtime` | Typage et résolution restreints de SecretRef, et recherche du chemin des cibles de plan pour l’analyse du contrat de secrets et de la configuration |
    | `plugin-sdk/secret-provider-integration` | Contrats de manifeste d’intégration et de préréglages, limités aux types, pour les fournisseurs SecretRef destinés aux plugins qui publient des préréglages de fournisseurs de secrets externes |
    | `plugin-sdk/security-runtime` | Barillet étendu obsolète pour la confiance, le contrôle des messages privés, les utilitaires de fichiers et de chemins limités à la racine, notamment les écritures de création uniquement, le remplacement atomique synchrone/asynchrone des fichiers, les écritures temporaires voisines, la solution de repli pour les déplacements entre périphériques, les utilitaires de stockage de fichiers privés, les protections contre les parents symboliques, le contenu externe, la caviardisation du texte sensible, la comparaison de secrets en temps constant et les utilitaires de collecte de secrets ; privilégiez les sous-chemins spécialisés de sécurité, SSRF et de secrets |
    | `plugin-sdk/ssrf-policy` | Utilitaires de liste d’autorisation des hôtes et de politique SSRF pour les réseaux privés |
    | `plugin-sdk/ssrf-dispatcher` | Utilitaires restreints de répartiteur épinglé sans la vaste surface d’exécution de l’infrastructure |
    | `plugin-sdk/ssrf-runtime` | Utilitaires de répartiteur épinglé, de récupération protégée contre les SSRF, d’erreur SSRF et de politique SSRF |
    | `plugin-sdk/secret-input` | Utilitaires d’analyse des entrées de secrets |
    | `plugin-sdk/webhook-ingress` | Utilitaires de requêtes et de cibles Webhook, et coercition des WebSockets bruts et des corps |
    | `plugin-sdk/webhook-request-guards` | Utilitaires de taille et de délai d’expiration des corps de requête, et `runDetachedWebhookWork` pour le traitement suivi après accusé de réception |
  </Accordion>

  <Accordion title="Sous-chemins d’exécution et de stockage">
    | Sous-chemin | Principaux exports |
    | --- | --- |
    | `plugin-sdk/runtime` | Utilitaires d’exécution, de journalisation et de sauvegarde, avertissements sur les chemins d’installation des plugins et utilitaires de processus |
    | `plugin-sdk/runtime-env` | Utilitaires ciblés pour l’environnement d’exécution, le journaliseur, les délais d’expiration, les nouvelles tentatives et l’attente exponentielle |
    | `plugin-sdk/browser-config` | Façade de configuration de navigateur prise en charge pour les profils et valeurs par défaut normalisés, l’analyse des URL CDP et les utilitaires d’authentification du contrôle du navigateur |
    | `plugin-sdk/agent-harness-task-runtime` | Utilitaires génériques de cycle de vie des tâches et de livraison des résultats pour les agents adossés à un harnais utilisant une portée de tâche émise par l’hôte |
    | `plugin-sdk/codex-mcp-projection` | Utilitaire Codex intégré réservé servant à projeter la configuration des serveurs MCP de l’utilisateur dans la configuration des fils Codex ; non destiné aux plugins tiers |
    | `plugin-sdk/codex-native-task-runtime` | Utilitaire Codex intégré propre au dépôt pour le câblage natif du miroir de tâches et de l’exécution ; non exporté par le paquet |
    | `plugin-sdk/channel-runtime-context` | Utilitaires génériques d’enregistrement et de recherche du contexte d’exécution des canaux |
    | `plugin-sdk/matrix` | Façade de compatibilité Matrix obsolète pour les anciens paquets de canaux tiers ; les nouveaux plugins doivent importer directement `plugin-sdk/run-command` |
    | `plugin-sdk/mattermost` | Façade de compatibilité Mattermost obsolète pour les anciens paquets de canaux tiers ; les nouveaux plugins doivent importer directement les sous-chemins génériques du SDK |
    | `plugin-sdk/runtime-store` | `createPluginRuntimeStore` |
    | `plugin-sdk/plugin-runtime` | Export global général obsolète pour les utilitaires de commandes, de hooks, HTTP et interactifs des plugins ; privilégiez les sous-chemins ciblés d’exécution des plugins |
    | `plugin-sdk/hook-runtime` | Export global général obsolète pour les utilitaires de Webhook et de pipeline de hooks internes ; privilégiez les sous-chemins ciblés d’exécution des hooks et plugins |
    | `plugin-sdk/lazy-runtime` | Utilitaires d’importation et de liaison différées de l’exécution, tels que `createLazyRuntimeModule`, `createLazyRuntimeMethod` et `createLazyRuntimeSurface` |
    | `plugin-sdk/process-runtime` | Utilitaires d’exécution de processus |
    | `plugin-sdk/node-host` | Utilitaires de résolution des exécutables de l’hôte Node et de reprise PTY |
    | `plugin-sdk/cli-runtime` | Export global général obsolète pour le formatage de la CLI, l’attente, la version, l’invocation d’arguments et les utilitaires différés de groupes de commandes ; privilégiez les sous-chemins ciblés de la CLI et de l’exécution |
    | `plugin-sdk/qa-runner-runtime` | Façade prise en charge exposant les scénarios d’assurance qualité des plugins par l’intermédiaire de la surface de commandes de la CLI |
    | `plugin-sdk/tts-runtime` | Façade prise en charge pour les schémas de configuration de synthèse vocale et les utilitaires d’exécution |
    | `plugin-sdk/gateway-method-runtime` | Utilitaire réservé de répartition des méthodes du Gateway pour les routes HTTP de plugins qui déclarent `contracts.gatewayMethodDispatch: ["authenticated-request"]` |
    | `plugin-sdk/gateway-runtime` | Client Gateway, utilitaire de démarrage du client prêt pour la boucle d’événements, RPC de la CLI du Gateway, erreurs du protocole Gateway, résolution de l’hôte LAN annoncé et utilitaires de mise à jour de l’état des canaux |
    | `plugin-sdk/config-contracts` | Surface de configuration ciblée composée uniquement de types pour les formes de configuration des plugins telles que `OpenClawConfig` et les types de configuration des canaux et fournisseurs |
    | `plugin-sdk/plugin-config-runtime` | Utilitaires d’exécution pour la configuration des plugins, tels que `mergeDeep`, `requireRuntimeConfig`, `resolvePluginConfigObject` et `resolveLivePluginConfigObject` |
    | `plugin-sdk/config-mutation` | Utilitaires transactionnels de modification de la configuration, tels que `mutateConfigFile`, `replaceConfigFile` et `logConfigUpdated` |
    | `plugin-sdk/message-tool-delivery-hints` | Chaînes partagées d’indication des métadonnées de livraison des outils de messagerie |
    | `plugin-sdk/runtime-config-snapshot` | Utilitaires d’instantané de la configuration du processus actuel, tels que `getRuntimeConfig`, `getRuntimeConfigSnapshot` et les fonctions de définition d’instantanés de test |
    | `plugin-sdk/text-autolink-runtime` | Détection des liens automatiques de références de fichiers sans l’export global général de texte |
    | `plugin-sdk/reply-runtime` | Utilitaires d’exécution partagés pour les messages entrants et les réponses, segmentation, répartition, Heartbeat et planificateur de réponses |
    | `plugin-sdk/reply-dispatch-runtime` | Utilitaires ciblés de répartition et de finalisation des réponses, ainsi que d’étiquetage des conversations |
    | `plugin-sdk/reply-history` | Utilitaires partagés d’historique des réponses sur une courte fenêtre. Le nouveau code des tours de messages doit utiliser `createChannelHistoryWindow` ; les utilitaires de table de correspondance de plus bas niveau ne restent que comme exports de compatibilité obsolètes |
    | `plugin-sdk/reply-reference` | `createReplyReferencePlanner` |
    | `plugin-sdk/reply-chunking` | Utilitaires ciblés de segmentation du texte et du Markdown |
    | `plugin-sdk/session-store-runtime` | Utilitaires de flux de travail des sessions (`getSessionEntry`, `listSessionEntries`, `patchSessionEntry`, `upsertSessionEntry`), utilitaires de réparation et de cycle de vie (`deleteSessionEntry`, `cleanupSessionLifecycleArtifacts`, `resolveSessionStoreBackupPaths`), utilitaires de marqueurs pour les valeurs transitoires `sessionFile`, lectures bornées du texte récent des transcriptions utilisateur/assistant selon l’identité de la session, utilitaires de chemin du magasin de sessions et de clé de session, ainsi que lectures de la date de mise à jour, sans importations générales d’écriture ou de maintenance de la configuration |
    | `plugin-sdk/session-transcript-runtime` | Identité des transcriptions, utilitaires ciblés de destination, de lecture et d’écriture, projection des entrées de messages visibles, publication des mises à jour, verrous d’écriture et clés d’accès à la mémoire des transcriptions |
    | `plugin-sdk/sqlite-runtime` | Utilitaires SQLite ciblés pour le schéma, les chemins et les transactions des agents d’exécution internes, sans contrôles du cycle de vie de la base de données |
    | `plugin-sdk/cron-store-runtime` | Utilitaires de chemin, de chargement et d’enregistrement du magasin Cron |
    | `plugin-sdk/state-paths` | Utilitaires de chemin des répertoires d’état et OAuth |
    | `plugin-sdk/plugin-state-runtime` | Types d’état indexé SQLite des processus auxiliaires de plugins, ainsi que des utilitaires centralisés de pragma de connexion, de maintenance WAL vérifiée et de migration atomique de schémas STRICT pour les bases de données détenues par les plugins |
    | `plugin-sdk/routing` | Utilitaires de liaison des routes, des clés de session et des comptes, tels que `resolveAgentRoute`, `buildAgentSessionKey` et `resolveDefaultAgentBoundAccountId` |
    | `plugin-sdk/status-helpers` | Utilitaires partagés de synthèse de l’état des canaux et comptes, valeurs par défaut de l’état d’exécution et utilitaires de métadonnées des problèmes |
    | `plugin-sdk/target-resolver-runtime` | Utilitaires partagés de résolution des destinations |
    | `plugin-sdk/string-normalization-runtime` | Utilitaires de normalisation des slugs et chaînes |
    | `plugin-sdk/request-url` | Extraction des URL sous forme de chaînes depuis des entrées de type fetch/requête |
    | `plugin-sdk/run-command` | Exécuteur de commandes temporisées avec résultats stdout/stderr normalisés |
    | `plugin-sdk/param-readers` | Lecteurs communs de paramètres d’outils et de CLI |
    | `plugin-sdk/tool-plugin` | Définition d’un plugin d’outil d’agent simple et typé, et exposition de métadonnées statiques pour la génération du manifeste |
    | `plugin-sdk/tool-payload` | Extraction des charges utiles normalisées depuis les objets de résultat des outils |
    | `plugin-sdk/tool-send` | Extraction des champs canoniques de destination d’envoi depuis les arguments des outils |
    | `plugin-sdk/sandbox` | Types de backends de bac à sable et utilitaires de commandes SSH/OpenShell, y compris la vérification préalable avec échec immédiat des commandes d’exécution |
    | `plugin-sdk/temp-path` | Utilitaires partagés de chemins de téléchargement temporaires et espaces de travail temporaires privés et sécurisés |
    | `plugin-sdk/logging-core` | Journaliseur de sous-système et utilitaires de masquage |
    | `plugin-sdk/markdown-table-runtime` | Mode de tableau Markdown et utilitaires de conversion |
    | `plugin-sdk/model-session-runtime` | Utilitaires de remplacement de modèle et de session, tels que `applyModelOverrideToSessionEntry` et `resolveAgentMaxConcurrent` |
    | `plugin-sdk/talk-config-runtime` | Utilitaires de résolution de la configuration du fournisseur de conversation vocale |
    | `plugin-sdk/json-store` | Petits utilitaires de lecture et d’écriture d’état JSON |
    | `plugin-sdk/json-unsafe-integers` | Utilitaires d’analyse JSON qui conservent sous forme de chaînes les littéraux d’entiers non sûrs |
    | `plugin-sdk/file-lock` | Utilitaires de verrouillage de fichiers réentrants |
    | `plugin-sdk/persistent-dedupe` | Utilitaires de cache de déduplication adossé au disque |
    | `plugin-sdk/acp-runtime` | Utilitaires d’exécution et de session ACP, ainsi que de répartition des réponses |
    | `plugin-sdk/acp-runtime-backend` | Utilitaires légers d’enregistrement des backends ACP et de répartition des réponses pour les plugins chargés au démarrage |
    | `plugin-sdk/acp-binding-resolve-runtime` | Résolution en lecture seule des liaisons ACP sans importation du démarrage du cycle de vie |
    | `plugin-sdk/agent-config-primitives` | Primitives obsolètes de schéma de configuration de l’exécution des agents ; importez les primitives de schéma depuis une surface maintenue détenue par un plugin |
    | `plugin-sdk/boolean-param` | Lecteur permissif de paramètres booléens |
    | `plugin-sdk/dangerous-name-runtime` | Utilitaires de résolution de la correspondance des noms dangereux |
    | `plugin-sdk/device-bootstrap` | Utilitaires d’amorçage et de jetons d’appairage des appareils, y compris `BOOTSTRAP_HANDOFF_OPERATOR_SCOPES` |
    | `plugin-sdk/extension-shared` | Primitives utilitaires partagées pour les canaux passifs, l’état et les proxys ambiants |
    | `plugin-sdk/models-provider-runtime` | Utilitaires de réponse aux commandes et fournisseurs `/models` |
    | `plugin-sdk/skill-commands-runtime` | Utilitaires de listage des commandes de Skills |
    | `plugin-sdk/native-command-registry` | Utilitaires de registre, de construction et de sérialisation des commandes natives |
    | `plugin-sdk/agent-harness` | Surface expérimentale pour plugins de confiance destinée aux harnais d’agents de bas niveau : types de harnais, utilitaires d’orientation et d’abandon des exécutions actives, utilitaires de pont vers les outils OpenClaw, utilitaires de stratégie des outils du plan d’exécution, classification des résultats terminaux, utilitaires de formatage et de détail de la progression des outils, et utilitaires de résultats des tentatives |
    | `plugin-sdk/provider-zai-endpoint` | Façade obsolète de détection des points de terminaison détenue par le fournisseur Z.AI ; utilisez l’API publique du plugin Z.AI |
    | `plugin-sdk/async-lock-runtime` | Utilitaire de verrouillage asynchrone local au processus pour les petits fichiers d’état d’exécution |
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
    | `plugin-sdk/exec-approvals-runtime` | Utilitaires de fichiers de stratégie d’approbation des exécutions sans l’export global général de l’infrastructure d’exécution |
    | `plugin-sdk/infra-runtime` | Adaptateur de compatibilité obsolète ; utilisez les sous-chemins d’exécution ciblés ci-dessus |
    | `plugin-sdk/collection-runtime` | Petits utilitaires de cache borné |
    | `plugin-sdk/diagnostic-runtime` | Utilitaires d’indicateurs de diagnostic, d’événements et de contexte de traçage |
    | `plugin-sdk/error-runtime` | Graphe d’erreurs, formatage, utilitaires partagés de classification des erreurs, `PlatformMessageNotDispatchedError`, `isApprovalNotFoundError` |
    | `plugin-sdk/fetch-runtime` | Utilitaires de fetch encapsulé, de proxy, d’option EnvHttpProxyAgent et de recherche épinglée |
    | `plugin-sdk/runtime-fetch` | Fetch d’exécution tenant compte du répartiteur sans importation de proxy ni de fetch protégé |
    | `plugin-sdk/inline-image-data-url-runtime` | Utilitaires de nettoyage des URL de données d’images intégrées et de détection de signatures sans la surface générale d’exécution multimédia |
    | `plugin-sdk/response-limit-runtime` | Lecteurs de corps de réponse bornés par le nombre d’octets, l’inactivité et l’échéance, sans la surface générale d’exécution multimédia |
    | `plugin-sdk/session-binding-runtime` | État actuel de liaison de la conversation sans routage de liaison configuré ni magasins d’appairage |
    | `plugin-sdk/context-visibility-runtime` | Résolution de la visibilité du contexte et filtrage du contexte supplémentaire sans importations générales de configuration ou de sécurité |
    | `plugin-sdk/string-coerce-runtime` | Utilitaires ciblés et primitifs de coercition et de normalisation des enregistrements et chaînes, sans importations Markdown ou de journalisation |
    | `plugin-sdk/html-entity-runtime` | Décodage en un seul passage des entités HTML5 terminées par un point-virgule, sans les utilitaires généraux de texte |
    | `plugin-sdk/text-utility-runtime` | Utilitaires de bas niveau pour le texte et les chemins, y compris l’échappement des cinq entités HTML |
    | `plugin-sdk/widget-html` | Détection des documents complets, validation de la taille et erreurs d’entrée des outils pour les widgets HTML autonomes |
    | `plugin-sdk/host-runtime` | Utilitaires de normalisation des noms d’hôtes et des hôtes SCP |
    | `plugin-sdk/retry-runtime` | Utilitaires de configuration et d’exécution des nouvelles tentatives |
    | `plugin-sdk/agent-runtime` | Export global général obsolète pour les utilitaires de répertoire, d’identité et d’espace de travail des agents, y compris `resolveAgentDir`, `resolveDefaultAgentDir` et l’export de compatibilité obsolète `resolveOpenClawAgentDir` ; privilégiez les sous-chemins ciblés des agents et de l’exécution |
    | `plugin-sdk/directory-runtime` | Interrogation et déduplication de répertoires adossées à la configuration |
    | `plugin-sdk/keyed-async-queue` | `KeyedAsyncQueue` |
  </Accordion>

  <Accordion title="Sous-chemins de fonctionnalités et de test">
    | Sous-chemin | Principaux exports |
    | --- | --- |
    | `plugin-sdk/media-runtime` | Barrel multimédia général obsolète comprenant `saveRemoteMedia`, `saveResponseMedia`, `readRemoteMediaBuffer` et l’élément obsolète `fetchRemoteMedia` ; privilégiez `plugin-sdk/media-store`, `plugin-sdk/media-mime`, `plugin-sdk/outbound-media` et les sous-chemins d’exécution des fonctionnalités, et privilégiez les assistants de stockage avant la lecture des tampons lorsqu’une URL doit devenir un média OpenClaw |
    | `plugin-sdk/media-mime` | Normalisation MIME ciblée, mappage des extensions de fichier, détection MIME et assistants de type de média |
    | `plugin-sdk/media-store` | Assistants ciblés de stockage des médias tels que `saveMediaBuffer` et `saveMediaStream` |
    | `plugin-sdk/media-generation-runtime` | Assistants partagés de basculement pour la génération de médias, sélection des candidats et messages signalant l’absence de modèle |
    | `plugin-sdk/media-understanding` | Types de fournisseurs pour la compréhension des médias, ainsi que des exports d’assistants destinés aux fournisseurs pour les images, l’audio et l’extraction structurée |
    | `plugin-sdk/text-chunking` | Découpage du texte sortant et des plages avec conservation des décalages, découpage du Markdown et assistants de rendu, tokenisation des balises HTML tenant compte des guillemets, conversion des tableaux Markdown, suppression des balises de directive et utilitaires de texte sécurisé |
    | `plugin-sdk/speech` | Types de fournisseurs vocaux, ainsi que des exports destinés aux fournisseurs pour les directives, le registre, la validation, le générateur TTS compatible avec OpenAI et les assistants vocaux |
    | `plugin-sdk/speech-core` | Types partagés de fournisseurs vocaux, registre, directives, normalisation et exports d’assistants vocaux |
    | `plugin-sdk/realtime-transcription` | Types de fournisseurs de transcription en temps réel, assistants de registre et assistant partagé de session WebSocket |
    | `plugin-sdk/realtime-bootstrap-context` | Assistant d’amorçage des profils en temps réel pour l’injection contextuelle limitée de `IDENTITY.md`, `USER.md` et `SOUL.md` |
    | `plugin-sdk/realtime-voice` | Types de fournisseurs vocaux en temps réel, assistants de registre et assistants partagés de comportement vocal en temps réel, notamment le suivi de l’activité de sortie |
    | `plugin-sdk/image-generation` | Types de fournisseurs de génération d’images, assistants pour les ressources d’image et les URL de données, et générateur de fournisseur d’images compatible avec OpenAI |
    | `plugin-sdk/image-generation-core` | Types partagés, basculement, authentification et assistants de registre pour la génération d’images |
    | `plugin-sdk/music-generation` | Types de fournisseurs, de requêtes et de résultats pour la génération musicale |
    | `plugin-sdk/music-generation-core` | Types partagés obsolètes pour la génération musicale, assistants de basculement, recherche de fournisseur et analyse des références de modèles ; privilégiez les surfaces de fournisseurs musicaux appartenant aux plugins |
    | `plugin-sdk/video-generation` | Types de fournisseurs, de requêtes et de résultats pour la génération vidéo |
    | `plugin-sdk/video-generation-core` | Types partagés pour la génération vidéo, assistants de basculement, recherche de fournisseur et analyse des références de modèles |
    | `plugin-sdk/transcripts` | Types partagés de fournisseurs de sources de transcriptions, assistants de registre, descripteurs de session et métadonnées des énoncés |
    | `plugin-sdk/webhook-targets` | Registre des cibles Webhook et assistants d’installation des routes |
    | `plugin-sdk/webhook-path` | Alias de compatibilité obsolète ; utilisez `plugin-sdk/webhook-ingress` |
    | `plugin-sdk/web-media` | Assistants partagés de chargement de médias distants et locaux |
    | `plugin-sdk/zod` | Réexportation de compatibilité obsolète ; importez directement `zod` depuis `zod` |
    | `plugin-sdk/plugin-test-api` | Assistant minimal `createTestPluginApi` propre au dépôt pour les tests unitaires d’enregistrement direct de plugins, sans importer les passerelles vers les assistants de test du dépôt |
    | `plugin-sdk/agent-runtime-test-contracts` | Fixtures de contrats propres au dépôt pour les adaptateurs natifs d’exécution des agents, couvrant les tests d’authentification, de livraison, de repli, de hooks d’outils, de superposition des invites, de schémas et de projection des transcriptions |
    | `plugin-sdk/channel-test-helpers` | Assistants de test orientés canaux propres au dépôt pour les contrats génériques d’actions, de configuration et d’état, les assertions d’annuaire, le cycle de vie du démarrage des comptes, la propagation de la configuration d’envoi, les simulations d’exécution, les problèmes d’état, la livraison sortante et l’enregistrement des hooks |
    | `plugin-sdk/channel-target-testing` | Suite propre au dépôt de cas d’erreur partagés pour la résolution des cibles dans les tests de canaux |
    | `plugin-sdk/channel-contract-testing` | Assistants ciblés propres au dépôt pour les tests de contrats de canaux, sans le barrel de test général |
    | `plugin-sdk/plugin-test-contracts` | Assistants propres au dépôt pour les contrats de package de plugin, d’enregistrement, d’artefacts publics, d’importation directe, d’API d’exécution et d’effets secondaires des importations |
    | `plugin-sdk/plugin-state-test-runtime` | Assistants de test propres au dépôt pour le stockage de l’état des plugins, la file d’entrée et la base de données d’état |
    | `plugin-sdk/provider-test-contracts` | Assistants propres au dépôt pour les contrats d’exécution des fournisseurs, d’authentification, de découverte, d’intégration, de catalogue, d’assistant de configuration, de fonctionnalité multimédia, de politique de relecture, d’audio STT en direct et en temps réel, de recherche/récupération Web et de flux |
    | `plugin-sdk/provider-http-test-mocks` | Simulations HTTP/d’authentification Vitest facultatives et propres au dépôt pour les tests de fournisseurs qui exercent `plugin-sdk/provider-http` |
    | `plugin-sdk/reply-payload-testing` | Assistants propres au dépôt pour associer des métadonnées aux fixtures de charges utiles de réponse |
    | `plugin-sdk/sqlite-runtime-testing` | Assistants de cycle de vie SQLite propres au dépôt pour les tests internes |
    | `plugin-sdk/test-fixtures` | Fixtures propres au dépôt pour la capture générique de l’exécution CLI, le contexte de bac à sable, l’écriture de Skills, les messages d’agent, les événements système, le rechargement de modules, les chemins des plugins intégrés, le texte du terminal, le découpage, les jetons d’authentification et les cas typés |
    | `plugin-sdk/test-node-mocks` | Assistants ciblés propres au dépôt pour simuler les modules natifs de Node dans les fabriques Vitest `vi.mock("node:*")` |
  </Accordion>

  <Accordion title="Sous-chemins de mémoire">
    | Sous-chemin | Principaux exports |
    | --- | --- |
    | `plugin-sdk/memory-core` | Alias de compatibilité obsolète ; utilisez `plugin-sdk/memory-host-core` |
    | `plugin-sdk/memory-core-engine-runtime` | Façade d’exécution obsolète pour l’indexation et la recherche en mémoire ; privilégiez les sous-chemins d’hôte de mémoire indépendants du fournisseur |
    | `plugin-sdk/memory-core-host-embedding-registry` | Assistants légers de registre des fournisseurs d’incorporations mémoire |
    | `plugin-sdk/memory-core-host-engine-foundation` | Exports du moteur de fondation de l’hôte de mémoire |
    | `plugin-sdk/memory-core-host-engine-embeddings` | Contrats d’incorporation de l’hôte de mémoire, accès au registre, fournisseur local et assistants génériques pour les traitements par lots et distants. `registerMemoryEmbeddingProvider` est obsolète sur cette surface ; utilisez l’API générique des fournisseurs d’incorporations pour les nouveaux fournisseurs. |
    | `plugin-sdk/memory-core-host-engine-qmd` | Exports du moteur QMD de l’hôte de mémoire |
    | `plugin-sdk/memory-core-host-engine-storage` | Exports du moteur de stockage de l’hôte de mémoire |
    | `plugin-sdk/memory-core-host-multimodal` | Assistants multimodaux obsolètes de l’hôte de mémoire ; privilégiez les sous-chemins d’hôte de mémoire indépendants du fournisseur |
    | `plugin-sdk/memory-core-host-query` | Assistants de requête obsolètes de l’hôte de mémoire ; privilégiez les sous-chemins d’hôte de mémoire indépendants du fournisseur |
    | `plugin-sdk/memory-core-host-secret` | Assistants de secrets de l’hôte de mémoire |
    | `plugin-sdk/memory-core-host-events` | Alias de compatibilité obsolète ; utilisez `plugin-sdk/memory-host-events` |
    | `plugin-sdk/memory-core-host-status` | Assistants d’état de l’hôte de mémoire |
    | `plugin-sdk/memory-core-host-runtime-cli` | Assistants d’exécution CLI de l’hôte de mémoire |
    | `plugin-sdk/memory-core-host-runtime-core` | Assistants principaux d’exécution de l’hôte de mémoire |
    | `plugin-sdk/memory-core-host-runtime-files` | Assistants de fichiers et d’exécution de l’hôte de mémoire |
    | `plugin-sdk/memory-host-core` | Alias indépendant du fournisseur pour les assistants principaux d’exécution de l’hôte de mémoire |
    | `plugin-sdk/memory-host-events` | Alias indépendant du fournisseur pour les assistants de journal des événements de l’hôte de mémoire |
    | `plugin-sdk/memory-host-files` | Alias de compatibilité obsolète ; utilisez `plugin-sdk/memory-core-host-runtime-files` |
    | `plugin-sdk/memory-host-markdown` | Assistants partagés de Markdown géré pour les plugins liés à la mémoire |
    | `plugin-sdk/memory-host-search` | Façade d’exécution de la mémoire active pour l’accès au gestionnaire de recherche |
    | `plugin-sdk/memory-host-status` | Alias de compatibilité obsolète ; utilisez `plugin-sdk/memory-core-host-status` |
  </Accordion>

  <Accordion title="Sous-chemins réservés aux assistants intégrés">
    Les sous-chemins du SDK réservés aux assistants intégrés sont des surfaces
    ciblées et propres à leur propriétaire pour le code des plugins intégrés.
    Ils sont suivis dans l’inventaire du SDK afin que les builds de packages et
    la gestion des alias restent déterministes, mais ne constituent pas des API
    générales de création de plugins. Les nouveaux contrats hôtes réutilisables
    doivent utiliser des sous-chemins génériques du SDK tels que
    `plugin-sdk/gateway-runtime`, `plugin-sdk/ssrf-runtime` et
    `plugin-sdk/plugin-config-runtime`.

    | Sous-chemin | Propriétaire et objectif |
    | --- | --- |
    | `plugin-sdk/codex-mcp-projection` | Assistant du plugin Codex intégré pour projeter la configuration utilisateur des serveurs MCP dans la configuration des fils de discussion du serveur d’application Codex (export de package réservé) |
    | `plugin-sdk/codex-native-task-runtime` | Assistant du plugin Codex intégré pour refléter les sous-agents natifs du serveur d’application Codex dans l’état des tâches OpenClaw (propre au dépôt uniquement, sans export de package) |

  </Accordion>
</AccordionGroup>

## Voir aussi

- [Présentation du SDK de plugins](/fr/plugins/sdk-overview)
- [Configuration du SDK de plugins](/fr/plugins/sdk-setup)
- [Création de plugins](/fr/plugins/building-plugins)
