---
read_when:
    - Choisir le bon sous-chemin plugin-sdk pour une importation de Plugin
    - Audit des sous-chemins des Plugins intégrés et des surfaces utilitaires
summary: 'Catalogue des sous-chemins du Plugin SDK : où se trouvent les imports, regroupés par domaine'
title: Sous-chemins du SDK de Plugin
x-i18n:
    generated_at: "2026-05-06T07:34:15Z"
    model: gpt-5.5
    provider: openai
    source_hash: 98b16cd3fcd6babc64df20ad4e679c35553fc21894617f30907bbf0e579a4d89
    source_path: plugins/sdk-subpaths.md
    workflow: 16
---

Le SDK de Plugin est exposé sous forme d’un ensemble de sous-chemins étroits sous `openclaw/plugin-sdk/`.
Cette page répertorie les sous-chemins couramment utilisés, regroupés par objectif. La liste complète générée de plus de 200 sous-chemins se trouve dans `scripts/lib/plugin-sdk-entrypoints.json` ;
les sous-chemins d’aide réservés aux Plugins groupés y apparaissent, mais relèvent d’un détail d’implémentation, sauf si une page de documentation les promeut explicitement. Les mainteneurs peuvent auditer les sous-chemins d’aide réservés actifs avec `pnpm plugins:boundary-report:summary` ; les exports d’aide réservés inutilisés font échouer le rapport CI au lieu de rester dans le SDK public
comme dette de compatibilité dormante.

Pour le guide de création de Plugin, consultez [Vue d’ensemble du SDK de Plugin](/fr/plugins/sdk-overview).

## Entrée de Plugin

| Sous-chemin                              | Exports clés                                                                                                                                                                  |
| --------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `plugin-sdk/plugin-entry`                 | `definePluginEntry`                                                                                                                                                          |
| `plugin-sdk/core`                         | `defineChannelPluginEntry`, `createChatChannelPlugin`, `createChannelPluginBase`, `defineSetupPluginEntry`, `buildChannelConfigSchema`, `buildJsonChannelConfigSchema`       |
| `plugin-sdk/config-schema`                | `OpenClawSchema`                                                                                                                                                             |
| `plugin-sdk/provider-entry`               | `defineSingleProviderPluginEntry`                                                                                                                                            |
| `plugin-sdk/testing`                      | Module global de compatibilité large pour les tests de Plugin hérités ; préférez les sous-chemins de test ciblés pour les nouveaux tests d’extension                         |
| `plugin-sdk/plugin-test-api`              | Générateur de mock `OpenClawPluginApi` minimal pour les tests unitaires d’enregistrement direct de Plugin                                                                     |
| `plugin-sdk/agent-runtime-test-contracts` | Fixtures de contrat d’adaptateur natif agent-runtime pour les profils d’authentification, la suppression de livraison, la classification de secours, les hooks d’outils, les superpositions de prompts, les schémas et la réparation de transcription |
| `plugin-sdk/channel-test-helpers`         | Helpers de test pour le cycle de vie des comptes de canal, l’annuaire, la configuration d’envoi, le mock d’exécution, les hooks, l’entrée de canal groupé, l’horodatage d’enveloppe, la réponse d’appairage et les contrats de canal génériques |
| `plugin-sdk/channel-target-testing`       | Suite de tests partagée pour les cas d’erreur de résolution de cible de canal                                                                                                |
| `plugin-sdk/plugin-test-contracts`        | Helpers de contrat pour l’enregistrement de Plugin, le manifeste de package, l’artefact public, l’API d’exécution, les effets de bord d’import et l’import direct             |
| `plugin-sdk/plugin-test-runtime`          | Fixtures de test pour l’exécution de Plugin, le registre, l’enregistrement de fournisseur, l’assistant de configuration et le flux de tâches d’exécution                      |
| `plugin-sdk/provider-test-contracts`      | Helpers de contrat pour l’exécution de fournisseur, l’authentification, la découverte, l’onboarding, le catalogue, les capacités média, la politique de relecture, l’audio en direct STT temps réel, la recherche/récupération web et l’assistant |
| `plugin-sdk/provider-http-test-mocks`     | Mocks HTTP/auth Vitest optionnels pour les tests de fournisseur qui exercent `plugin-sdk/provider-http`                                                                       |
| `plugin-sdk/test-env`                     | Fixtures d’environnement de test, fetch/réseau, serveur HTTP jetable, requête entrante, test live, système de fichiers temporaire et contrôle du temps                       |
| `plugin-sdk/test-fixtures`                | Fixtures de test génériques pour CLI, sandbox, skill, message d’agent, événement système, rechargement de module, chemin de Plugin groupé, terminal, segmentation, jeton d’authentification et cas typé |
| `plugin-sdk/test-node-mocks`              | Helpers ciblés de mock des modules intégrés Node à utiliser dans les fabriques Vitest `vi.mock("node:*")`                                                                    |
| `plugin-sdk/migration`                    | Helpers d’éléments de fournisseur de migration tels que `createMigrationItem`, constantes de raison, marqueurs de statut d’élément, helpers de rédaction et `summarizeMigrationItems` |
| `plugin-sdk/migration-runtime`            | Helpers de migration d’exécution tels que `copyMigrationFileItem`, `withCachedMigrationConfigRuntime` et `writeMigrationReport`                                              |

  <AccordionGroup>
  <Accordion title="Sous-chemins des canaux">
    | Sous-chemin | Exports clés |
    | --- | --- |
    | `plugin-sdk/channel-core` | `defineChannelPluginEntry`, `defineSetupPluginEntry`, `createChatChannelPlugin`, `createChannelPluginBase` |
    | `plugin-sdk/config-schema` | Export du schéma Zod racine `openclaw.json` (`OpenClawSchema`) |
    | `plugin-sdk/channel-setup` | `createOptionalChannelSetupSurface`, `createOptionalChannelSetupAdapter`, `createOptionalChannelSetupWizard`, plus `DEFAULT_ACCOUNT_ID`, `createTopLevelChannelDmPolicy`, `setSetupChannelEnabled`, `splitSetupEntries` |
    | `plugin-sdk/setup` | Helpers partagés pour l’assistant de configuration, invites de liste d’autorisation, générateurs d’état de configuration |
    | `plugin-sdk/setup-runtime` | `createPatchedAccountSetupAdapter`, `createEnvPatchedAccountSetupAdapter`, `createSetupInputPresenceValidator`, `noteChannelLookupFailure`, `noteChannelLookupSummary`, `promptResolvedAllowFrom`, `splitSetupEntries`, `createAllowlistSetupWizardProxy`, `createDelegatedSetupWizardProxy` |
    | `plugin-sdk/setup-adapter-runtime` | `createEnvPatchedAccountSetupAdapter` |
    | `plugin-sdk/setup-tools` | `formatCliCommand`, `detectBinary`, `extractArchive`, `resolveBrewExecutable`, `formatDocsLink`, `CONFIG_DIR` |
    | `plugin-sdk/account-core` | Helpers de configuration multi-comptes et de garde d’action, helpers de repli vers le compte par défaut |
    | `plugin-sdk/account-id` | `DEFAULT_ACCOUNT_ID`, helpers de normalisation d’identifiant de compte |
    | `plugin-sdk/account-resolution` | Helpers de recherche de compte et de repli par défaut |
    | `plugin-sdk/account-helpers` | Helpers ciblés de liste de comptes et d’action de compte |
    | `plugin-sdk/channel-pairing` | `createChannelPairingController` |
    | `plugin-sdk/channel-reply-pipeline` | Helpers hérités de pipeline de réponse. Le nouveau code de pipeline de réponse de canal doit utiliser `createChannelMessageReplyPipeline` et `resolveChannelMessageSourceReplyDeliveryMode` depuis `plugin-sdk/channel-message`. |
    | `plugin-sdk/channel-config-helpers` | `createHybridChannelConfigAdapter`, `resolveChannelDmAccess`, `resolveChannelDmAllowFrom`, `resolveChannelDmPolicy`, `normalizeChannelDmPolicy`, `normalizeLegacyDmAliases` |
    | `plugin-sdk/channel-config-schema` | Primitives partagées de schéma de configuration de canal, plus générateurs Zod et JSON/TypeBox directs |
    | `plugin-sdk/bundled-channel-config-schema` | Schémas de configuration de canaux OpenClaw groupés, uniquement pour les plugins groupés maintenus |
    | `plugin-sdk/channel-config-schema-legacy` | Alias de compatibilité obsolète pour les schémas de configuration de canaux groupés |
    | `plugin-sdk/telegram-command-config` | Helpers de normalisation/validation des commandes personnalisées Telegram avec repli sur le contrat groupé |
    | `plugin-sdk/command-gating` | Helpers ciblés de garde d’autorisation de commande |
    | `plugin-sdk/channel-policy` | `resolveChannelGroupRequireMention` |
    | `plugin-sdk/channel-lifecycle` | `createAccountStatusSink`, `createChannelRunQueue` et helpers hérités du cycle de vie du flux de brouillon. Le nouveau code de finalisation d’aperçu doit utiliser `plugin-sdk/channel-message`. |
    | `plugin-sdk/channel-message` | Helpers de contrat de cycle de vie de message peu coûteux, tels que `defineChannelMessageAdapter`, `createChannelMessageAdapterFromOutbound`, `createReplyPrefixContext`, `resolveChannelMessageSourceReplyDeliveryMode`, façades de compatibilité, dérivation de capacité finale durable, helpers de preuve de capacité pour les capacités d’envoi/réception/effet secondaire, `MessageReceiveContext`, preuves de politique d’accusé de réception, `defineFinalizableLivePreviewAdapter`, `deliverWithFinalizableLivePreviewAdapter`, preuves de capacité d’aperçu en direct et de finaliseur en direct, état de récupération durable, `RenderedMessageBatch`, types de réception de message et helpers d’identifiant de réception. Voir [API de message de canal](/fr/plugins/sdk-channel-message). L’ancien `createChannelTurnReplyPipeline` reste uniquement pour les répartiteurs de compatibilité. |
    | `plugin-sdk/channel-message-runtime` | Helpers de livraison d’exécution pouvant charger la livraison sortante, notamment `deliverInboundReplyWithMessageSendContext`, `sendDurableMessageBatch`, `withDurableMessageSendContext`, `dispatchChannelMessageReplyWithBase` et `recordChannelMessageReplyDispatch`. À utiliser depuis les modules d’exécution de surveillance/envoi, pas depuis les fichiers chauds d’amorçage de plugin. |
    | `plugin-sdk/inbound-envelope` | Helpers partagés de route entrante et de génération d’enveloppe |
    | `plugin-sdk/inbound-reply-dispatch` | Anciens helpers partagés d’enregistrement et de répartition entrants, prédicats de répartition visible/finale et compatibilité obsolète `deliverDurableInboundReplyPayload` pour les répartiteurs de canal préparés. Le nouveau code de réception/répartition de canal doit importer les helpers de cycle de vie d’exécution depuis `plugin-sdk/channel-message-runtime`. |
    | `plugin-sdk/messaging-targets` | Helpers d’analyse et de correspondance de cibles |
    | `plugin-sdk/outbound-media` | Helpers partagés de chargement de médias sortants |
    | `plugin-sdk/outbound-send-deps` | Recherche légère des dépendances d’envoi sortant pour les adaptateurs de canal |
    | `plugin-sdk/outbound-runtime` | Helpers de livraison sortante, d’identité, de délégué d’envoi, de session, de formatage et de planification de charge utile |
    | `plugin-sdk/poll-runtime` | Helpers ciblés de normalisation de sondage |
    | `plugin-sdk/thread-bindings-runtime` | Helpers de cycle de vie et d’adaptateur de liaison de fil |
    | `plugin-sdk/agent-media-payload` | Ancien générateur de charge utile multimédia d’agent |
    | `plugin-sdk/conversation-runtime` | Helpers de conversation/liaison de fil, d’appairage et de liaison configurée |
    | `plugin-sdk/runtime-config-snapshot` | Helper d’instantané de configuration d’exécution |
    | `plugin-sdk/runtime-group-policy` | Helpers de résolution de stratégie de groupe d’exécution |
    | `plugin-sdk/channel-status` | Helpers partagés d’instantané/résumé d’état de canal |
    | `plugin-sdk/channel-config-primitives` | Primitives ciblées de schéma de configuration de canal |
    | `plugin-sdk/channel-config-writes` | Helpers d’autorisation d’écriture de configuration de canal |
    | `plugin-sdk/channel-plugin-common` | Exports partagés de préambule de plugin de canal |
    | `plugin-sdk/allowlist-config-edit` | Helpers de modification/lecture de configuration de liste d’autorisation |
    | `plugin-sdk/group-access` | Helpers partagés de décision d’accès de groupe |
    | `plugin-sdk/direct-dm` | Helpers partagés d’authentification/de garde pour messages directs |
    | `plugin-sdk/discord` | Façade de compatibilité Discord obsolète pour `@openclaw/discord@2026.3.13` publié et la compatibilité propriétaire suivie ; les nouveaux plugins doivent utiliser les sous-chemins génériques du SDK de canal |
    | `plugin-sdk/telegram-account` | Façade de compatibilité de résolution de compte Telegram obsolète pour la compatibilité propriétaire suivie ; les nouveaux plugins doivent utiliser les helpers d’exécution injectés ou les sous-chemins génériques du SDK de canal |
    | `plugin-sdk/zalouser` | Façade de compatibilité Zalo Personal obsolète pour les packages Lark/Zalo publiés qui importent encore l’autorisation de commande d’expéditeur ; les nouveaux plugins doivent utiliser `plugin-sdk/command-auth` |
    | `plugin-sdk/interactive-runtime` | Présentation sémantique des messages, livraison et anciens helpers de réponse interactive. Voir [Présentation des messages](/fr/plugins/message-presentation) |
    | `plugin-sdk/channel-inbound` | Barrel de compatibilité pour l’anti-rebond entrant, la correspondance de mentions, les helpers de stratégie de mention et les helpers d’enveloppe |
    | `plugin-sdk/channel-inbound-debounce` | Helpers ciblés d’anti-rebond entrant |
    | `plugin-sdk/channel-mention-gating` | Helpers ciblés de stratégie de mention, de marqueur de mention et de texte de mention sans la surface d’exécution entrante plus large |
    | `plugin-sdk/channel-envelope` | Helpers ciblés de formatage d’enveloppe entrante |
    | `plugin-sdk/channel-location` | Helpers de contexte et de formatage d’emplacement de canal |
    | `plugin-sdk/channel-logging` | Helpers de journalisation de canal pour les abandons entrants et les échecs de saisie/accusé de réception |
    | `plugin-sdk/channel-send-result` | Types de résultat de réponse |
    | `plugin-sdk/channel-actions` | Helpers d’action de message de canal, plus helpers de schéma natif obsolètes conservés pour la compatibilité des plugins |
    | `plugin-sdk/channel-route` | Helpers partagés de normalisation de route, résolution de cible pilotée par analyseur, conversion d’identifiant de fil en chaîne, clés de route dédupliquées/compactes, types de cible analysée et helpers de comparaison de route/cible |
    | `plugin-sdk/channel-targets` | Helpers d’analyse de cibles ; les appelants de comparaison de routes doivent utiliser `plugin-sdk/channel-route` |
    | `plugin-sdk/channel-contract` | Types de contrat de canal |
    | `plugin-sdk/channel-feedback` | Câblage de commentaires/réactions |
    | `plugin-sdk/channel-secret-runtime` | Helpers ciblés de contrat secret, tels que `collectSimpleChannelFieldAssignments`, `getChannelSurface`, `pushAssignment` et types de cible secrète |
  </Accordion>

  <Accordion title="Sous-chemins des fournisseurs">
    | Sous-chemin | Exports clés |
    | --- | --- |
    | `plugin-sdk/provider-entry` | `defineSingleProviderPluginEntry` |
    | `plugin-sdk/lmstudio` | Façade de fournisseur LM Studio prise en charge pour la configuration, la découverte de catalogue et la préparation des modèles à l’exécution |
    | `plugin-sdk/lmstudio-runtime` | Façade d’exécution LM Studio prise en charge pour les valeurs par défaut du serveur local, la découverte de modèles, les en-têtes de requête et les helpers de modèles chargés |
    | `plugin-sdk/provider-setup` | Helpers sélectionnés de configuration de fournisseurs locaux/auto-hébergés |
    | `plugin-sdk/self-hosted-provider-setup` | Helpers ciblés de configuration de fournisseurs auto-hébergés compatibles OpenAI |
    | `plugin-sdk/cli-backend` | Valeurs par défaut du backend CLI + constantes de watchdog |
    | `plugin-sdk/provider-auth-runtime` | Helpers de résolution des clés d’API à l’exécution pour les Plugins de fournisseur |
    | `plugin-sdk/provider-auth-api-key` | Helpers d’onboarding/de profil d’écriture des clés d’API, tels que `upsertApiKeyProfile` |
    | `plugin-sdk/provider-auth-result` | Générateur standard de résultat d’authentification OAuth |
    | `plugin-sdk/provider-auth-login` | Helpers partagés de connexion interactive pour les Plugins de fournisseur |
    | `plugin-sdk/provider-env-vars` | Helpers de recherche des variables d’environnement d’authentification des fournisseurs |
    | `plugin-sdk/provider-auth` | `createProviderApiKeyAuthMethod`, `ensureApiKeyFromOptionEnvOrPrompt`, `upsertAuthProfile`, `upsertApiKeyProfile`, `writeOAuthCredentials`, export de compatibilité obsolète `resolveOpenClawAgentDir` |
    | `plugin-sdk/provider-model-shared` | `ProviderReplayFamily`, `buildProviderReplayFamilyHooks`, `normalizeModelCompat`, générateurs partagés de politiques de rejeu, helpers de points de terminaison de fournisseur et helpers de normalisation des ID de modèle, tels que `normalizeNativeXaiModelId` |
    | `plugin-sdk/provider-catalog-runtime` | Hook d’exécution d’augmentation du catalogue fournisseur et points d’intégration du registre plugin-fournisseur pour les tests de contrat |
    | `plugin-sdk/provider-catalog-shared` | `findCatalogTemplate`, `buildSingleProviderApiKeyCatalog`, `buildManifestModelProviderConfig`, `supportsNativeStreamingUsageCompat`, `applyProviderNativeStreamingUsageCompat` |
    | `plugin-sdk/provider-http` | Helpers génériques de capacités HTTP/points de terminaison des fournisseurs, erreurs HTTP des fournisseurs et helpers de formulaires multipart pour la transcription audio |
    | `plugin-sdk/provider-web-fetch-contract` | Helpers ciblés de contrat de configuration/sélection de récupération web, tels que `enablePluginInConfig` et `WebFetchProviderPlugin` |
    | `plugin-sdk/provider-web-fetch` | Helpers d’enregistrement/de cache des fournisseurs de récupération web |
    | `plugin-sdk/provider-web-search-config-contract` | Helpers ciblés de configuration/identifiants de recherche web pour les fournisseurs qui n’ont pas besoin de câblage d’activation de Plugin |
    | `plugin-sdk/provider-web-search-contract` | Helpers ciblés de contrat de configuration/identifiants de recherche web, tels que `createWebSearchProviderContractFields`, `enablePluginInConfig`, `resolveProviderWebSearchPluginConfig` et accesseurs/mutateurs d’identifiants limités à leur portée |
    | `plugin-sdk/provider-web-search` | Helpers d’enregistrement/de cache/d’exécution des fournisseurs de recherche web |
    | `plugin-sdk/provider-tools` | `ProviderToolCompatFamily`, `buildProviderToolCompatFamilyHooks`, nettoyage de schéma Gemini + diagnostics, et helpers de compatibilité xAI, tels que `resolveXaiModelCompatPatch` / `applyXaiModelCompat` |
    | `plugin-sdk/provider-usage` | `fetchClaudeUsage` et similaires |
    | `plugin-sdk/provider-stream` | `ProviderStreamFamily`, `buildProviderStreamFamilyHooks`, `composeProviderStreamWrappers`, types d’enveloppes de flux et helpers partagés d’enveloppes Anthropic/Bedrock/DeepSeek V4/Google/Kilocode/Moonshot/OpenAI/OpenRouter/Z.A.I/MiniMax/Copilot |
    | `plugin-sdk/provider-transport-runtime` | Helpers de transport natif des fournisseurs, tels que récupération protégée, transformations des messages de transport et flux d’événements de transport inscriptibles |
    | `plugin-sdk/provider-onboard` | Helpers de correctifs de configuration d’onboarding |
    | `plugin-sdk/global-singleton` | Helpers de singletons/maps/caches locaux au processus |
    | `plugin-sdk/group-activation` | Helpers ciblés de mode d’activation de groupe et d’analyse des commandes |
  </Accordion>

  <Accordion title="Sous-chemins d’authentification et de sécurité">
    | Sous-chemin | Exports clés |
    | --- | --- |
    | `plugin-sdk/command-auth` | `resolveControlCommandGate`, helpers de registre de commandes, notamment la mise en forme dynamique des menus d’arguments, helpers d’autorisation des expéditeurs |
    | `plugin-sdk/command-status` | Générateurs de messages de commande/d’aide, tels que `buildCommandsMessagePaginated` et `buildHelpMessage` |
    | `plugin-sdk/approval-auth-runtime` | Helpers de résolution des approbateurs et d’authentification des actions dans la même discussion |
    | `plugin-sdk/approval-client-runtime` | Helpers natifs de profils/filtres d’approbation exec |
    | `plugin-sdk/approval-delivery-runtime` | Adaptateurs natifs de capacités/livraison d’approbation |
    | `plugin-sdk/approval-gateway-runtime` | Helper partagé de résolution de Gateway d’approbation |
    | `plugin-sdk/approval-handler-adapter-runtime` | Helpers légers de chargement d’adaptateurs natifs d’approbation pour les points d’entrée de canaux à chaud |
    | `plugin-sdk/approval-handler-runtime` | Helpers d’exécution de gestionnaires d’approbation plus larges ; privilégiez les points d’intégration adaptateur/Gateway plus ciblés lorsqu’ils suffisent |
    | `plugin-sdk/approval-native-runtime` | Helpers natifs de cible d’approbation + liaison de compte |
    | `plugin-sdk/approval-reply-runtime` | Helpers de payloads de réponse d’approbation exec/plugin |
    | `plugin-sdk/approval-runtime` | Helpers de payloads d’approbation exec/plugin, helpers natifs de routage/d’exécution d’approbation et helpers d’affichage structuré des approbations, tels que `formatApprovalDisplayPath` |
    | `plugin-sdk/reply-dedupe` | Helpers ciblés de réinitialisation de déduplication des réponses entrantes |
    | `plugin-sdk/channel-contract-testing` | Helpers ciblés de tests de contrat de canal sans le vaste barrel de test |
    | `plugin-sdk/command-auth-native` | Authentification native des commandes, mise en forme dynamique des menus d’arguments et helpers natifs de ciblage de session |
    | `plugin-sdk/command-detection` | Helpers partagés de détection des commandes |
    | `plugin-sdk/command-primitives-runtime` | Prédicats légers de texte de commande pour les chemins de canaux à chaud |
    | `plugin-sdk/command-surface` | Helpers de normalisation du corps des commandes et de surface de commande |
    | `plugin-sdk/allow-from` | `formatAllowFromLowercase` |
    | `plugin-sdk/channel-secret-runtime` | Helpers ciblés de collecte de contrats de secrets pour les surfaces de secrets de canal/Plugin |
    | `plugin-sdk/secret-ref-runtime` | Helpers ciblés de typage `coerceSecretRef` et SecretRef pour l’analyse de contrats/configurations de secrets |
    | `plugin-sdk/security-runtime` | Helpers partagés de confiance, de verrouillage des messages privés, de fichiers/chemins limités à la racine, notamment écritures en création seule, remplacement atomique de fichier synchrone/asynchrone, écritures temporaires voisines, solution de repli pour déplacement entre appareils, helpers de stockage de fichiers privés, gardes des parents de liens symboliques, contenu externe, masquage de texte sensible, comparaison de secrets en temps constant et helpers de collecte de secrets |
    | `plugin-sdk/ssrf-policy` | Helpers de liste d’autorisation d’hôtes et de politique SSRF pour réseaux privés |
    | `plugin-sdk/ssrf-dispatcher` | Helpers ciblés de répartiteur épinglé sans la vaste surface d’exécution d’infrastructure |
    | `plugin-sdk/ssrf-runtime` | Répartiteur épinglé, récupération protégée contre la SSRF, erreur SSRF et helpers de politique SSRF |
    | `plugin-sdk/secret-input` | Helpers d’analyse d’entrée de secrets |
    | `plugin-sdk/webhook-ingress` | Helpers de requêtes/cibles Webhook et coercition brute de websocket/corps |
    | `plugin-sdk/webhook-request-guards` | Helpers de taille de corps de requête/délai d’expiration |
  </Accordion>

  <Accordion title="Sous-chemins d’exécution et de stockage">
    | Sous-chemin | Exports principaux |
    | --- | --- |
    | `plugin-sdk/runtime` | Helpers généraux d’exécution, de journalisation, de sauvegarde et d’installation de plugins |
    | `plugin-sdk/runtime-env` | Helpers ciblés pour l’environnement d’exécution, le journaliseur, les délais d’expiration, les nouvelles tentatives et le backoff |
    | `plugin-sdk/browser-config` | Façade de configuration de navigateur prise en charge pour les profils/valeurs par défaut normalisés, l’analyse des URL CDP et les helpers d’authentification de contrôle du navigateur |
    | `plugin-sdk/channel-runtime-context` | Helpers génériques d’enregistrement et de recherche du contexte d’exécution de canal |
    | `plugin-sdk/matrix` | Façade de compatibilité Matrix obsolète pour les anciens packages de canaux tiers ; les nouveaux plugins doivent importer `plugin-sdk/run-command` directement |
    | `plugin-sdk/mattermost` | Façade de compatibilité Mattermost obsolète pour les anciens packages de canaux tiers ; les nouveaux plugins doivent importer directement les sous-chemins génériques du SDK |
    | `plugin-sdk/runtime-store` | `createPluginRuntimeStore` |
    | `plugin-sdk/plugin-runtime` | Helpers partagés de commandes, hooks, HTTP et interactions de plugins |
    | `plugin-sdk/hook-runtime` | Helpers partagés de pipeline de Webhook/hook interne |
    | `plugin-sdk/lazy-runtime` | Helpers d’importation/de liaison paresseuses d’exécution, tels que `createLazyRuntimeModule`, `createLazyRuntimeMethod` et `createLazyRuntimeSurface` |
    | `plugin-sdk/process-runtime` | Helpers d’exécution de processus |
    | `plugin-sdk/cli-runtime` | Helpers CLI de formatage, d’attente, de version, d’invocation par arguments et de groupes de commandes paresseux |
    | `plugin-sdk/gateway-runtime` | Client Gateway, helper de démarrage de client prêt pour la boucle d’événements, RPC CLI du gateway, erreurs du protocole Gateway et helpers de patch d’état des canaux |
    | `plugin-sdk/config-types` | Surface de configuration uniquement typée pour les formes de configuration de plugins, telles que `OpenClawConfig` et les types de configuration de canaux/fournisseurs |
    | `plugin-sdk/plugin-config-runtime` | Helpers de recherche de configuration de plugin à l’exécution, tels que `requireRuntimeConfig`, `resolvePluginConfigObject` et `resolveLivePluginConfigObject` |
    | `plugin-sdk/config-mutation` | Helpers transactionnels de mutation de configuration, tels que `mutateConfigFile`, `replaceConfigFile` et `logConfigUpdated` |
    | `plugin-sdk/runtime-config-snapshot` | Helpers d’instantané de configuration du processus courant, tels que `getRuntimeConfig`, `getRuntimeConfigSnapshot` et les setters d’instantané de test |
    | `plugin-sdk/telegram-command-config` | Normalisation des noms/descriptions de commandes Telegram et contrôles de doublons/conflits, même lorsque la surface de contrat Telegram intégrée n’est pas disponible |
    | `plugin-sdk/text-autolink-runtime` | Détection de liens automatiques vers des références de fichiers sans le barrel général text-runtime |
    | `plugin-sdk/approval-runtime` | Helpers d’approbation d’exécution/de plugins, constructeurs de capacités d’approbation, helpers d’authentification/de profil, helpers de routage/d’exécution natifs et formatage du chemin d’affichage d’approbation structurée |
    | `plugin-sdk/reply-runtime` | Helpers partagés d’exécution d’entrée/de réponse, découpage en segments, répartition, Heartbeat, planificateur de réponse |
    | `plugin-sdk/reply-dispatch-runtime` | Helpers ciblés de répartition/finalisation des réponses et d’étiquettes de conversation |
    | `plugin-sdk/reply-history` | Helpers partagés d’historique de réponses sur fenêtre courte et marqueurs tels que `buildHistoryContext`, `HISTORY_CONTEXT_MARKER`, `recordPendingHistoryEntry` et `clearHistoryEntriesIfEnabled` |
    | `plugin-sdk/reply-reference` | `createReplyReferencePlanner` |
    | `plugin-sdk/reply-chunking` | Helpers ciblés de découpage de texte/Markdown |
    | `plugin-sdk/session-store-runtime` | Helpers de chemin de magasin de sessions, clé de session, mise à jour et mutation du magasin |
    | `plugin-sdk/cron-store-runtime` | Helpers de chemin/chargement/enregistrement du magasin Cron |
    | `plugin-sdk/state-paths` | Helpers de chemins de répertoires d’état/OAuth |
    | `plugin-sdk/routing` | Helpers de routage/clé de session/liaison de compte, tels que `resolveAgentRoute`, `buildAgentSessionKey` et `resolveDefaultAgentBoundAccountId` |
    | `plugin-sdk/status-helpers` | Helpers partagés de synthèse d’état de canal/compte, valeurs par défaut d’état d’exécution et helpers de métadonnées de problème |
    | `plugin-sdk/target-resolver-runtime` | Helpers partagés de résolution de cible |
    | `plugin-sdk/string-normalization-runtime` | Helpers de normalisation de slugs/chaînes |
    | `plugin-sdk/request-url` | Extraction d’URL sous forme de chaînes depuis des entrées de type fetch/request |
    | `plugin-sdk/run-command` | Exécuteur de commandes temporisé avec résultats stdout/stderr normalisés |
    | `plugin-sdk/param-readers` | Lecteurs de paramètres courants pour outils/CLI |
    | `plugin-sdk/tool-payload` | Extraction de charges utiles normalisées depuis des objets de résultat d’outil |
    | `plugin-sdk/tool-send` | Extraction des champs canoniques de cible d’envoi depuis les arguments d’outil |
    | `plugin-sdk/temp-path` | Helpers partagés de chemins de téléchargement temporaire et espaces de travail temporaires privés sécurisés |
    | `plugin-sdk/logging-core` | Journaliseur de sous-système et helpers de caviardage |
    | `plugin-sdk/markdown-table-runtime` | Helpers de mode et de conversion de tableaux Markdown |
    | `plugin-sdk/model-session-runtime` | Helpers de surcharge de modèle/session, tels que `applyModelOverrideToSessionEntry` et `resolveAgentMaxConcurrent` |
    | `plugin-sdk/talk-config-runtime` | Helpers de résolution de configuration de fournisseur Talk |
    | `plugin-sdk/json-store` | Petits helpers de lecture/écriture d’état JSON |
    | `plugin-sdk/file-lock` | Helpers de verrou de fichier réentrants |
    | `plugin-sdk/persistent-dedupe` | Helpers de cache de déduplication adossé au disque |
    | `plugin-sdk/acp-runtime` | Helpers d’exécution/session ACP et de répartition des réponses |
    | `plugin-sdk/acp-runtime-backend` | Helpers légers d’enregistrement de backend ACP et de répartition des réponses pour les plugins chargés au démarrage |
    | `plugin-sdk/acp-binding-resolve-runtime` | Résolution de liaison ACP en lecture seule sans importations de démarrage du cycle de vie |
    | `plugin-sdk/agent-config-primitives` | Primitives ciblées de schéma de configuration d’exécution d’agent |
    | `plugin-sdk/boolean-param` | Lecteur de paramètre booléen permissif |
    | `plugin-sdk/dangerous-name-runtime` | Helpers de résolution de correspondance de noms dangereux |
    | `plugin-sdk/device-bootstrap` | Helpers d’amorçage d’appareil et de jetons d’appairage |
    | `plugin-sdk/extension-shared` | Primitives partagées de helpers de canal passif, d’état et de proxy ambiant |
    | `plugin-sdk/models-provider-runtime` | Helpers de réponse à la commande/au fournisseur `/models` |
    | `plugin-sdk/skill-commands-runtime` | Helpers de liste de commandes de Skills |
    | `plugin-sdk/native-command-registry` | Helpers de registre/construction/sérialisation de commandes natives |
    | `plugin-sdk/agent-harness` | Surface expérimentale de plugin de confiance pour les harnais d’agent de bas niveau : types de harnais, helpers de pilotage/abandon d’exécution active, helpers de pont d’outils OpenClaw, helpers de politique d’outils de plan d’exécution, classification des résultats de terminal, helpers de formatage/détail de progression d’outil et utilitaires de résultat de tentative |
    | `plugin-sdk/provider-zai-endpoint` | Helpers de détection de point de terminaison Z.AI |
    | `plugin-sdk/async-lock-runtime` | Helper de verrou asynchrone local au processus pour petits fichiers d’état d’exécution |
    | `plugin-sdk/channel-activity-runtime` | Helper de télémétrie d’activité de canal |
    | `plugin-sdk/concurrency-runtime` | Helper de concurrence bornée de tâches asynchrones |
    | `plugin-sdk/dedupe-runtime` | Helpers de cache de déduplication en mémoire |
    | `plugin-sdk/delivery-queue-runtime` | Helper de vidage des livraisons sortantes en attente |
    | `plugin-sdk/file-access-runtime` | Helpers de chemins sécurisés de fichiers locaux et de sources multimédias |
    | `plugin-sdk/heartbeat-runtime` | Helpers d’événements Heartbeat et de visibilité |
    | `plugin-sdk/number-runtime` | Helper de coercition numérique |
    | `plugin-sdk/secure-random-runtime` | Helpers de jetons/UUID sécurisés |
    | `plugin-sdk/system-event-runtime` | Helpers de file d’événements système |
    | `plugin-sdk/transport-ready-runtime` | Helper d’attente de disponibilité du transport |
    | `plugin-sdk/infra-runtime` | Shim de compatibilité obsolète ; utilisez les sous-chemins d’exécution ciblés ci-dessus |
    | `plugin-sdk/collection-runtime` | Petits helpers de caches bornés |
    | `plugin-sdk/diagnostic-runtime` | Helpers d’indicateurs de diagnostic, d’événements et de contexte de trace |
    | `plugin-sdk/error-runtime` | Helpers de graphe d’erreurs, de formatage et de classification d’erreurs partagée, `isApprovalNotFoundError` |
    | `plugin-sdk/fetch-runtime` | Fetch enveloppé, proxy, option EnvHttpProxyAgent et helpers de recherche épinglée |
    | `plugin-sdk/runtime-fetch` | Fetch d’exécution conscient du répartiteur sans importations de proxy/fetch protégé |
    | `plugin-sdk/response-limit-runtime` | Lecteur borné de corps de réponse sans la surface générale d’exécution multimédia |
    | `plugin-sdk/session-binding-runtime` | État de liaison de conversation courant sans routage de liaison configuré ni magasins d’appairage |
    | `plugin-sdk/session-store-runtime` | Helpers de magasin de sessions sans importations générales d’écritures/maintenance de configuration |
    | `plugin-sdk/context-visibility-runtime` | Résolution de visibilité du contexte et filtrage de contexte supplémentaire sans importations générales de configuration/sécurité |
    | `plugin-sdk/string-coerce-runtime` | Helpers ciblés de coercition et de normalisation de primitives, d’enregistrements et de chaînes sans importations Markdown/journalisation |
    | `plugin-sdk/host-runtime` | Helpers de normalisation de noms d’hôtes et d’hôtes SCP |
    | `plugin-sdk/retry-runtime` | Helpers de configuration de nouvelles tentatives et d’exécution de nouvelles tentatives |
    | `plugin-sdk/agent-runtime` | Helpers de répertoire/identité/espace de travail d’agent, dont `resolveAgentDir`, `resolveDefaultAgentDir` et l’export de compatibilité obsolète `resolveOpenClawAgentDir` |
    | `plugin-sdk/directory-runtime` | Requête/déduplication de répertoire adossée à la configuration |
    | `plugin-sdk/keyed-async-queue` | `KeyedAsyncQueue` |
  </Accordion>

  <Accordion title="Sous-chemins de capacité et de test">
    | Sous-chemin | Exports clés |
    | --- | --- |
    | `plugin-sdk/media-runtime` | Helpers partagés de récupération/transformation/stockage de médias, sondage des dimensions vidéo basé sur ffprobe et constructeurs de charges utiles multimédias |
    | `plugin-sdk/media-store` | Helpers ciblés de magasin multimédia tels que `saveMediaBuffer` |
    | `plugin-sdk/media-generation-runtime` | Helpers partagés de basculement pour la génération de médias, sélection de candidats et messages de modèle manquant |
    | `plugin-sdk/media-understanding` | Types de fournisseurs de compréhension des médias ainsi qu’exports de helpers image/audio destinés aux fournisseurs |
    | `plugin-sdk/text-runtime` | Helpers partagés de texte/markdown/journalisation, tels que la suppression du texte visible par l’assistant, les helpers de rendu/découpage/tableaux Markdown, les helpers de caviardage, les helpers de balises directives et les utilitaires de texte sûr |
    | `plugin-sdk/text-chunking` | Helper de découpage du texte sortant |
    | `plugin-sdk/speech` | Types de fournisseurs de parole ainsi qu’exports destinés aux fournisseurs pour les directives, le registre, la validation, le constructeur TTS compatible OpenAI et les helpers de parole |
    | `plugin-sdk/speech-core` | Types partagés de fournisseurs de parole, registre, directives, normalisation et exports de helpers de parole |
    | `plugin-sdk/realtime-transcription` | Types de fournisseurs de transcription en temps réel, helpers de registre et helper partagé de session WebSocket |
    | `plugin-sdk/realtime-voice` | Types de fournisseurs de voix en temps réel et helpers de registre |
    | `plugin-sdk/image-generation` | Types de fournisseurs de génération d’images ainsi que helpers d’actifs image/d’URL de données et constructeur de fournisseur d’images compatible OpenAI |
    | `plugin-sdk/image-generation-core` | Types partagés de génération d’images, basculement, authentification et helpers de registre |
    | `plugin-sdk/music-generation` | Types de fournisseurs/requêtes/résultats de génération musicale |
    | `plugin-sdk/music-generation-core` | Types partagés de génération musicale, helpers de basculement, recherche de fournisseur et analyse de références de modèle |
    | `plugin-sdk/video-generation` | Types de fournisseurs/requêtes/résultats de génération vidéo |
    | `plugin-sdk/video-generation-core` | Types partagés de génération vidéo, helpers de basculement, recherche de fournisseur et analyse de références de modèle |
    | `plugin-sdk/webhook-targets` | Registre des cibles Webhook et helpers d’installation de routes |
    | `plugin-sdk/webhook-path` | Helpers de normalisation de chemins Webhook |
    | `plugin-sdk/web-media` | Helpers partagés de chargement de médias distants/locaux |
    | `plugin-sdk/zod` | `zod` réexporté pour les consommateurs du SDK Plugin |
    | `plugin-sdk/testing` | Barrel de compatibilité large pour les tests de plugins hérités. Les nouveaux tests d’extensions doivent plutôt importer des sous-chemins ciblés du SDK tels que `plugin-sdk/agent-runtime-test-contracts`, `plugin-sdk/plugin-test-runtime`, `plugin-sdk/channel-test-helpers`, `plugin-sdk/test-env` ou `plugin-sdk/test-fixtures` |
    | `plugin-sdk/plugin-test-api` | Helper minimal `createTestPluginApi` pour les tests unitaires d’enregistrement direct de plugin sans importer de ponts de helpers de test du dépôt |
    | `plugin-sdk/agent-runtime-test-contracts` | Fixtures natives de contrats d’adaptateur agent-runtime pour les tests d’authentification, de livraison, de repli, de hooks d’outils, de superposition d’invite, de schéma et de projection de transcription |
    | `plugin-sdk/channel-test-helpers` | Helpers de test orientés canal pour les contrats génériques d’actions/configuration/statut, les assertions de répertoire, le cycle de vie de démarrage des comptes, le threading de configuration d’envoi, les mocks d’exécution, les problèmes de statut, la livraison sortante et l’enregistrement de hooks |
    | `plugin-sdk/channel-target-testing` | Suite partagée de cas d’erreur de résolution de cible pour les tests de canaux |
    | `plugin-sdk/plugin-test-contracts` | Helpers de contrats pour paquet Plugin, enregistrement, artefact public, import direct, API d’exécution et effets de bord d’import |
    | `plugin-sdk/provider-test-contracts` | Helpers de contrats pour exécution fournisseur, authentification, découverte, intégration, catalogue, assistant, capacité média, politique de relecture, audio en direct STT temps réel, recherche/récupération web et flux |
    | `plugin-sdk/provider-http-test-mocks` | Mocks HTTP/auth Vitest optionnels pour les tests de fournisseurs qui exercent `plugin-sdk/provider-http` |
    | `plugin-sdk/test-fixtures` | Fixtures génériques de capture d’exécution CLI, contexte de bac à sable, rédacteur de skill, message d’agent, événement système, rechargement de module, chemin de plugin groupé, texte de terminal, découpage, jeton d’authentification et cas typés |
    | `plugin-sdk/test-node-mocks` | Helpers ciblés de mocks intégrés Node à utiliser dans les fabriques Vitest `vi.mock("node:*")` |
  </Accordion>

  <Accordion title="Sous-chemins de mémoire">
    | Sous-chemin | Exports clés |
    | --- | --- |
    | `plugin-sdk/memory-core` | Surface groupée de helpers memory-core pour les helpers de gestionnaire/configuration/fichiers/CLI |
    | `plugin-sdk/memory-core-engine-runtime` | Façade d’exécution d’index/recherche de mémoire |
    | `plugin-sdk/memory-core-host-engine-foundation` | Exports du moteur de fondation de l’hôte mémoire |
    | `plugin-sdk/memory-core-host-engine-embeddings` | Contrats d’embeddings de l’hôte mémoire, accès au registre, fournisseur local et helpers génériques de traitement par lots/distants |
    | `plugin-sdk/memory-core-host-engine-qmd` | Exports du moteur QMD de l’hôte mémoire |
    | `plugin-sdk/memory-core-host-engine-storage` | Exports du moteur de stockage de l’hôte mémoire |
    | `plugin-sdk/memory-core-host-multimodal` | Helpers multimodaux de l’hôte mémoire |
    | `plugin-sdk/memory-core-host-query` | Helpers de requête de l’hôte mémoire |
    | `plugin-sdk/memory-core-host-secret` | Helpers de secrets de l’hôte mémoire |
    | `plugin-sdk/memory-core-host-events` | Helpers de journal d’événements de l’hôte mémoire |
    | `plugin-sdk/memory-core-host-status` | Helpers de statut de l’hôte mémoire |
    | `plugin-sdk/memory-core-host-runtime-cli` | Helpers d’exécution CLI de l’hôte mémoire |
    | `plugin-sdk/memory-core-host-runtime-core` | Helpers d’exécution core de l’hôte mémoire |
    | `plugin-sdk/memory-core-host-runtime-files` | Helpers de fichiers/exécution de l’hôte mémoire |
    | `plugin-sdk/memory-host-core` | Alias indépendant du fournisseur pour les helpers d’exécution core de l’hôte mémoire |
    | `plugin-sdk/memory-host-events` | Alias indépendant du fournisseur pour les helpers de journal d’événements de l’hôte mémoire |
    | `plugin-sdk/memory-host-files` | Alias indépendant du fournisseur pour les helpers de fichiers/exécution de l’hôte mémoire |
    | `plugin-sdk/memory-host-markdown` | Helpers partagés de Markdown géré pour les plugins adjacents à la mémoire |
    | `plugin-sdk/memory-host-search` | Façade d’exécution Active Memory pour l’accès au gestionnaire de recherche |
    | `plugin-sdk/memory-host-status` | Alias indépendant du fournisseur pour les helpers de statut de l’hôte mémoire |
  </Accordion>

  <Accordion title="Sous-chemins réservés de helpers groupés">
    Il n’existe actuellement aucun sous-chemin SDK réservé pour les helpers groupés. Les helpers propres à un propriétaire
    résident dans le paquet Plugin propriétaire, tandis que les contrats d’hôte réutilisables
    utilisent des sous-chemins SDK génériques tels que `plugin-sdk/gateway-runtime`,
    `plugin-sdk/security-runtime` et `plugin-sdk/plugin-config-runtime`.
  </Accordion>
</AccordionGroup>

## Associé

- [Présentation du SDK Plugin](/fr/plugins/sdk-overview)
- [Configuration du SDK Plugin](/fr/plugins/sdk-setup)
- [Créer des plugins](/fr/plugins/building-plugins)
