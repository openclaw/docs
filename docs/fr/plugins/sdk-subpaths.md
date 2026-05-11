---
read_when:
    - Choisir le bon sous-chemin plugin-sdk pour une importation de Plugin
    - Audit des sous-chemins des plugins groupés et des surfaces utilitaires
summary: 'Catalogue des sous-chemins du SDK Plugin : quels imports se trouvent où, regroupés par domaine'
title: Sous-chemins du SDK Plugin
x-i18n:
    generated_at: "2026-05-11T20:50:23Z"
    model: gpt-5.5
    provider: openai
    source_hash: c2ef3c37e00ca59a567e55b3b47962803e43514d6791d8fda75c7bfeffb1e142
    source_path: plugins/sdk-subpaths.md
    workflow: 16
---

Le SDK de plugin est exposé sous forme d’un ensemble de sous-chemins publics ciblés sous
`openclaw/plugin-sdk/`. Cette page recense les sous-chemins couramment utilisés, regroupés par
objectif. L’inventaire généré des points d’entrée du compilateur se trouve dans
`scripts/lib/plugin-sdk-entrypoints.json`; les exports de paquet constituent le sous-ensemble public
après soustraction des sous-chemins de test/internes propres au dépôt listés dans
`scripts/lib/plugin-sdk-private-local-only-subpaths.json`. Les mainteneurs peuvent auditer
le nombre d’exports publics avec `pnpm plugin-sdk:surface` et les sous-chemins d’assistants
réservés actifs avec `pnpm plugins:boundary-report:summary`; les exports d’assistants réservés
inutilisés font échouer le rapport CI au lieu de rester dans le SDK public comme
dette de compatibilité dormante.

Pour le guide de création de plugins, consultez [Vue d’ensemble du SDK de plugin](/fr/plugins/sdk-overview).

## Entrée de plugin

| Sous-chemin                    | Exports clés                                                                                                                                                           |
| ------------------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `plugin-sdk/plugin-entry`      | `definePluginEntry`                                                                                                                                                    |
| `plugin-sdk/core`              | `defineChannelPluginEntry`, `createChatChannelPlugin`, `createChannelPluginBase`, `defineSetupPluginEntry`, `buildChannelConfigSchema`, `buildJsonChannelConfigSchema` |
| `plugin-sdk/config-schema`     | `OpenClawSchema`                                                                                                                                                       |
| `plugin-sdk/provider-entry`    | `defineSingleProviderPluginEntry`                                                                                                                                      |
| `plugin-sdk/migration`         | Assistants d’éléments de fournisseur de migration tels que `createMigrationItem`, constantes de raison, marqueurs d’état d’élément, assistants de caviardage et `summarizeMigrationItems` |
| `plugin-sdk/migration-runtime` | Assistants de migration à l’exécution tels que `copyMigrationFileItem`, `withCachedMigrationConfigRuntime` et `writeMigrationReport`                                  |

### Assistants de compatibilité et de test obsolètes

Ces sous-chemins restent des exports de paquet pour les anciens plugins et les suites de test OpenClaw,
mais le nouveau code ne doit pas y ajouter d’imports : `agent-runtime-test-contracts`,
`channel-contract-testing`, `channel-target-testing`, `channel-test-helpers`,
`plugin-test-api`, `plugin-test-contracts`, `provider-http-test-mocks`,
`provider-test-contracts`, `test-env`, `test-fixtures`, `test-node-mocks`,
`testing`, `channel-runtime`, `compat`, `config-types`, `infra-runtime`,
`text-runtime` et `zod`. Importez `zod` directement depuis `zod` dans le nouveau code de plugin.
`plugin-test-runtime` reste un sous-chemin d’assistant de test ciblé actif.

### Sous-chemins publics inutilisés obsolètes

Ces sous-chemins publics existent depuis au moins un mois et ne comportent actuellement aucun
import de production d’extension groupée. Ils restent importables pour la compatibilité,
mais le nouveau code de plugin doit plutôt utiliser des sous-chemins SDK ciblés et activement consommés :
`agent-config-primitives`, `channel-config-schema-legacy`,
`channel-reply-pipeline`, `channel-runtime`, `channel-secret-runtime`,
`command-auth`, `compat`, `config-runtime`, `config-schema`, `discord`,
`group-access`, `infra-runtime`, `matrix`, `mattermost`,
`media-generation-runtime-shared`, `memory-core-engine-runtime`,
`memory-core-host-multimodal`, `memory-core-host-query`,
`music-generation-core`, `self-hosted-provider-setup`, `telegram-account`,
`telegram-command-config` et `zalouser`.

### Sous-chemins publics rares obsolètes

Les sous-chemins publics actuellement utilisés par seulement un ou deux propriétaires de plugins groupés sont également
obsolètes pour le nouveau code de plugin. Ils restent des exports de paquet pour la compatibilité,
mais le nouveau code doit privilégier les interfaces SDK activement partagées ou les API de paquet
appartenant au plugin. Les mainteneurs suivent l’ensemble exact dans
`scripts/lib/plugin-sdk-deprecated-public-subpaths.json` et le budget actuel
avec `pnpm plugin-sdk:surface`.

### Barrels larges obsolètes

Ces barrels larges de réexport restent compilables pour le code source OpenClaw et
les vérifications de compatibilité, mais le nouveau code doit privilégier les sous-chemins SDK ciblés :
`agent-runtime`, `channel-lifecycle`, `channel-runtime`, `cli-runtime`,
`compat`, `config-types`, `conversation-runtime`, `hook-runtime`,
`infra-runtime`, `media-runtime`, `plugin-runtime`, `security-runtime` et
`text-runtime`. `channel-runtime`, `compat`, `config-types`, `infra-runtime`
et `text-runtime` restent des exports de paquet uniquement pour la rétrocompatibilité ; utilisez
plutôt les sous-chemins channel/runtime ciblés, `config-contracts`, `string-coerce-runtime`,
`text-chunking`, `text-utility-runtime` et `logging-core`.

  <AccordionGroup>
  <Accordion title="Channel subpaths">
    | Sous-chemin | Exports clés |
    | --- | --- |
    | `plugin-sdk/channel-core` | `defineChannelPluginEntry`, `defineSetupPluginEntry`, `createChatChannelPlugin`, `createChannelPluginBase` |
    | `plugin-sdk/config-schema` | Export du schéma Zod racine `openclaw.json` (`OpenClawSchema`) |
    | `plugin-sdk/json-schema-runtime` | Assistant de validation JSON Schema mis en cache pour les schémas détenus par le plugin |
    | `plugin-sdk/channel-setup` | `createOptionalChannelSetupSurface`, `createOptionalChannelSetupAdapter`, `createOptionalChannelSetupWizard`, plus `DEFAULT_ACCOUNT_ID`, `createTopLevelChannelDmPolicy`, `setSetupChannelEnabled`, `splitSetupEntries` |
    | `plugin-sdk/setup` | Assistants partagés d’assistant de configuration, invites d’allowlist, constructeurs d’état de configuration |
    | `plugin-sdk/setup-runtime` | `createPatchedAccountSetupAdapter`, `createEnvPatchedAccountSetupAdapter`, `createSetupInputPresenceValidator`, `noteChannelLookupFailure`, `noteChannelLookupSummary`, `promptResolvedAllowFrom`, `splitSetupEntries`, `createAllowlistSetupWizardProxy`, `createDelegatedSetupWizardProxy` |
    | `plugin-sdk/setup-adapter-runtime` | Alias de compatibilité obsolète ; utilisez `plugin-sdk/setup-runtime` |
    | `plugin-sdk/setup-tools` | `formatCliCommand`, `detectBinary`, `extractArchive`, `resolveBrewExecutable`, `formatDocsLink`, `CONFIG_DIR` |
    | `plugin-sdk/account-core` | Assistants de configuration multi-compte et de verrou d’action, assistants de repli vers le compte par défaut |
    | `plugin-sdk/account-id` | `DEFAULT_ACCOUNT_ID`, assistants de normalisation d’identifiant de compte |
    | `plugin-sdk/account-resolution` | Assistants de recherche de compte et de repli par défaut |
    | `plugin-sdk/account-helpers` | Assistants ciblés de liste de comptes et d’action de compte |
    | `plugin-sdk/access-groups` | Assistants d’analyse d’allowlist de groupes d’accès et de diagnostics de groupes expurgés |
    | `plugin-sdk/channel-pairing` | `createChannelPairingController` |
    | `plugin-sdk/channel-reply-pipeline` | Assistants hérités de pipeline de réponse. Le nouveau code de pipeline de réponse de canal doit utiliser `createChannelMessageReplyPipeline` et `resolveChannelMessageSourceReplyDeliveryMode` depuis `plugin-sdk/channel-message`. |
    | `plugin-sdk/channel-config-helpers` | `createHybridChannelConfigAdapter`, `resolveChannelDmAccess`, `resolveChannelDmAllowFrom`, `resolveChannelDmPolicy`, `normalizeChannelDmPolicy`, `normalizeLegacyDmAliases` |
    | `plugin-sdk/channel-config-schema` | Primitives partagées de schéma de configuration de canal, plus constructeurs Zod et JSON/TypeBox directs |
    | `plugin-sdk/bundled-channel-config-schema` | Schémas de configuration de canal OpenClaw groupés pour les plugins groupés maintenus uniquement |
    | `plugin-sdk/channel-config-schema-legacy` | Alias de compatibilité obsolète pour les schémas de configuration de canal groupés |
    | `plugin-sdk/telegram-command-config` | Assistants de normalisation/validation de commandes personnalisées Telegram avec repli vers le contrat groupé |
    | `plugin-sdk/command-gating` | Assistants ciblés de verrou d’autorisation de commande |
    | `plugin-sdk/channel-policy` | `resolveChannelGroupRequireMention` |
    | `plugin-sdk/channel-ingress` | Façade de compatibilité obsolète de bas niveau pour l’entrée de canal. Les nouveaux chemins de réception doivent utiliser `plugin-sdk/channel-ingress-runtime`. |
    | `plugin-sdk/channel-ingress-runtime` | Résolveur expérimental de runtime d’entrée de canal de haut niveau et constructeurs de faits de route pour les chemins de réception de canal migrés. Préférez-le à l’assemblage des allowlists effectives, des allowlists de commandes et des projections héritées dans chaque plugin. Voir [API d’entrée de canal](/fr/plugins/sdk-channel-ingress). |
    | `plugin-sdk/channel-lifecycle` | `createAccountStatusSink`, `createChannelRunQueue`, et assistants hérités de cycle de vie de flux de brouillon. Le nouveau code de finalisation d’aperçu doit utiliser `plugin-sdk/channel-message`. |
    | `plugin-sdk/channel-message` | Assistants peu coûteux de contrat de cycle de vie des messages, tels que `defineChannelMessageAdapter`, `createChannelMessageAdapterFromOutbound`, `createChannelMessageReplyPipeline`, `createReplyPrefixContext`, `resolveChannelMessageSourceReplyDeliveryMode`, dérivation de capacité finale durable, assistants de preuve de capacité pour les capacités d’envoi/de reçu/d’effet de bord, `MessageReceiveContext`, preuves de politique d’accusé de réception, `defineFinalizableLivePreviewAdapter`, `deliverWithFinalizableLivePreviewAdapter`, preuves de capacité d’aperçu en direct et de finaliseur en direct, état de récupération durable, `RenderedMessageBatch`, types de reçu de message et assistants d’identifiant de reçu. Voir [API de message de canal](/fr/plugins/sdk-channel-message). Les façades héritées de distribution des réponses sont uniquement une compatibilité obsolète. |
    | `plugin-sdk/channel-message-runtime` | Assistants de livraison runtime pouvant charger la livraison sortante, notamment `deliverInboundReplyWithMessageSendContext`, `sendDurableMessageBatch` et `withDurableMessageSendContext`. Les ponts obsolètes de distribution des réponses restent importables uniquement pour les distributeurs de compatibilité. À utiliser depuis les modules runtime de surveillance/envoi, pas depuis les fichiers chauds d’amorçage de plugin. |
    | `plugin-sdk/inbound-envelope` | Assistants partagés de route entrante et de construction d’enveloppe |
    | `plugin-sdk/inbound-reply-dispatch` | Assistants hérités partagés d’enregistrement et de distribution entrants, prédicats de distribution visible/finale et compatibilité obsolète `deliverDurableInboundReplyPayload` pour les distributeurs de canal préparés. Le nouveau code de réception/distribution de canal doit importer les assistants runtime de cycle de vie depuis `plugin-sdk/channel-message-runtime`. |
    | `plugin-sdk/messaging-targets` | Assistants d’analyse/de correspondance de cibles |
    | `plugin-sdk/outbound-media` | Assistants partagés de chargement de médias sortants |
    | `plugin-sdk/outbound-send-deps` | Recherche légère de dépendances d’envoi sortant pour les adaptateurs de canal |
    | `plugin-sdk/outbound-runtime` | Assistants d’identité sortante, de délégué d’envoi, de session, de formatage et de planification de charge utile. Les assistants de livraison directe tels que `deliverOutboundPayloads` sont un substrat de compatibilité obsolète ; utilisez `plugin-sdk/channel-message-runtime` pour les nouveaux chemins d’envoi. |
    | `plugin-sdk/poll-runtime` | Assistants ciblés de normalisation de sondage |
    | `plugin-sdk/thread-bindings-runtime` | Assistants de cycle de vie et d’adaptateur de liaison de fils |
    | `plugin-sdk/agent-media-payload` | Constructeur hérité de charge utile de média d’agent |
    | `plugin-sdk/conversation-runtime` | Assistants de conversation/liaison de fil, d’appairage et de liaison configurée |
    | `plugin-sdk/runtime-config-snapshot` | Assistant d’instantané de configuration runtime |
    | `plugin-sdk/runtime-group-policy` | Assistants de résolution runtime de politique de groupe |
    | `plugin-sdk/channel-status` | Assistants partagés d’instantané/résumé d’état de canal |
    | `plugin-sdk/channel-config-primitives` | Primitives ciblées de schéma de configuration de canal |
    | `plugin-sdk/channel-config-writes` | Assistants d’autorisation d’écriture de configuration de canal |
    | `plugin-sdk/channel-plugin-common` | Exports partagés de préambule de plugin de canal |
    | `plugin-sdk/allowlist-config-edit` | Assistants de modification/lecture de configuration d’allowlist |
    | `plugin-sdk/group-access` | Assistants partagés de décision d’accès de groupe |
    | `plugin-sdk/direct-dm` | Assistants partagés d’authentification/de garde de message direct |
    | `plugin-sdk/discord` | Façade de compatibilité Discord obsolète pour le `@openclaw/discord@2026.3.13` publié et la compatibilité propriétaire suivie ; les nouveaux plugins doivent utiliser les sous-chemins génériques du SDK de canal |
    | `plugin-sdk/telegram-account` | Façade de compatibilité obsolète de résolution de compte Telegram pour la compatibilité propriétaire suivie ; les nouveaux plugins doivent utiliser les assistants runtime injectés ou les sous-chemins génériques du SDK de canal |
    | `plugin-sdk/zalouser` | Façade de compatibilité Zalo Personal obsolète pour les paquets Lark/Zalo publiés qui importent encore l’autorisation de commande d’expéditeur ; les nouveaux plugins doivent utiliser `plugin-sdk/command-auth` |
    | `plugin-sdk/interactive-runtime` | Présentation sémantique des messages, livraison et assistants hérités de réponse interactive. Voir [Présentation des messages](/fr/plugins/message-presentation) |
    | `plugin-sdk/channel-inbound` | Barrel de compatibilité pour l’anti-rebond entrant, la correspondance de mentions, les assistants de politique de mention et les assistants d’enveloppe |
    | `plugin-sdk/channel-inbound-debounce` | Assistants ciblés d’anti-rebond entrant |
    | `plugin-sdk/channel-mention-gating` | Assistants ciblés de politique de mention, de marqueur de mention et de texte de mention sans la surface runtime entrante plus large |
    | `plugin-sdk/channel-envelope` | Assistants ciblés de formatage d’enveloppe entrante |
    | `plugin-sdk/channel-location` | Assistants de contexte et de formatage d’emplacement de canal |
    | `plugin-sdk/channel-logging` | Assistants de journalisation de canal pour les abandons entrants et les échecs de saisie/accusé de réception |
    | `plugin-sdk/channel-send-result` | Types de résultat de réponse |
    | `plugin-sdk/channel-actions` | Assistants d’action de message de canal, plus assistants de schéma natif obsolètes conservés pour la compatibilité des plugins |
    | `plugin-sdk/channel-route` | Assistants partagés de normalisation de route, de résolution de cible pilotée par analyseur, de conversion d’identifiant de fil en chaîne, de clés de route de déduplication/compaction, de types de cible analysée et de comparaison route/cible |
    | `plugin-sdk/channel-targets` | Assistants d’analyse de cibles ; les appelants de comparaison de routes doivent utiliser `plugin-sdk/channel-route` |
    | `plugin-sdk/channel-contract` | Types de contrat de canal |
    | `plugin-sdk/channel-feedback` | Câblage de commentaires/réactions |
    | `plugin-sdk/channel-secret-runtime` | Assistants ciblés de contrat de secret, tels que `collectSimpleChannelFieldAssignments`, `getChannelSurface`, `pushAssignment`, et types de cible de secret |
  </Accordion>

  <Accordion title="Sous-chemins des fournisseurs">
    | Sous-chemin | Exports principaux |
    | --- | --- |
    | `plugin-sdk/provider-entry` | `defineSingleProviderPluginEntry` |
    | `plugin-sdk/lmstudio` | Façade de fournisseur LM Studio prise en charge pour la configuration, la découverte du catalogue et la préparation des modèles à l’exécution |
    | `plugin-sdk/lmstudio-runtime` | Façade d’exécution LM Studio prise en charge pour les valeurs par défaut du serveur local, la découverte des modèles, les en-têtes de requête et les assistants de modèles chargés |
    | `plugin-sdk/provider-setup` | Assistants sélectionnés de configuration de fournisseurs locaux/auto-hébergés |
    | `plugin-sdk/self-hosted-provider-setup` | Assistants ciblés de configuration de fournisseurs auto-hébergés compatibles OpenAI |
    | `plugin-sdk/cli-backend` | Valeurs par défaut du backend CLI + constantes de chien de garde |
    | `plugin-sdk/provider-auth-runtime` | Assistants de résolution des clés API à l’exécution pour les Plugins de fournisseur |
    | `plugin-sdk/provider-auth-api-key` | Assistants d’intégration/d’écriture de profil de clé API, tels que `upsertApiKeyProfile` |
    | `plugin-sdk/provider-auth-result` | Générateur standard de résultat d’authentification OAuth |
    | `plugin-sdk/provider-env-vars` | Assistants de recherche de variables d’environnement d’authentification de fournisseur |
    | `plugin-sdk/provider-auth` | `createProviderApiKeyAuthMethod`, `ensureApiKeyFromOptionEnvOrPrompt`, `upsertAuthProfile`, `upsertApiKeyProfile`, `writeOAuthCredentials`, export de compatibilité obsolète `resolveOpenClawAgentDir` |
    | `plugin-sdk/provider-model-shared` | `ProviderReplayFamily`, `buildProviderReplayFamilyHooks`, `normalizeModelCompat`, générateurs partagés de politiques de relecture, assistants de points de terminaison de fournisseur et assistants partagés de normalisation d’identifiants de modèle |
    | `plugin-sdk/provider-catalog-runtime` | Hook d’exécution d’augmentation du catalogue de fournisseurs et points de raccordement du registre Plugin-fournisseur pour les tests de contrat |
    | `plugin-sdk/provider-catalog-shared` | `findCatalogTemplate`, `buildSingleProviderApiKeyCatalog`, `buildManifestModelProviderConfig`, `supportsNativeStreamingUsageCompat`, `applyProviderNativeStreamingUsageCompat` |
    | `plugin-sdk/provider-http` | Assistants génériques de capacités HTTP/points de terminaison de fournisseur, erreurs HTTP de fournisseur et assistants de formulaire multipart de transcription audio |
    | `plugin-sdk/provider-web-fetch-contract` | Assistants ciblés de contrat de configuration/sélection web-fetch, tels que `enablePluginInConfig` et `WebFetchProviderPlugin` |
    | `plugin-sdk/provider-web-fetch` | Assistants d’enregistrement/de cache de fournisseur web-fetch |
    | `plugin-sdk/provider-web-search-config-contract` | Assistants ciblés de configuration/d’identifiants web-search pour les fournisseurs qui n’ont pas besoin du câblage d’activation de Plugin |
    | `plugin-sdk/provider-web-search-contract` | Assistants ciblés de contrat de configuration/d’identifiants web-search, tels que `createWebSearchProviderContractFields`, `enablePluginInConfig`, `resolveProviderWebSearchPluginConfig`, et accesseurs/mutateurs d’identifiants délimités |
    | `plugin-sdk/provider-web-search` | Assistants d’enregistrement/de cache/d’exécution de fournisseur web-search |
    | `plugin-sdk/provider-tools` | `ProviderToolCompatFamily`, `buildProviderToolCompatFamilyHooks`, et nettoyage + diagnostics de schéma Gemini |
    | `plugin-sdk/provider-usage` | `fetchClaudeUsage` et similaires |
    | `plugin-sdk/provider-stream` | `ProviderStreamFamily`, `buildProviderStreamFamilyHooks`, `composeProviderStreamWrappers`, types d’enveloppes de flux, et assistants partagés d’enveloppes Anthropic/Bedrock/DeepSeek V4/Google/Kilocode/Moonshot/OpenAI/OpenRouter/Z.A.I/MiniMax/Copilot |
    | `plugin-sdk/provider-transport-runtime` | Assistants de transport natifs de fournisseur, tels que fetch protégé, transformations de messages de transport et flux d’événements de transport inscriptibles |
    | `plugin-sdk/provider-onboard` | Assistants de correctif de configuration d’intégration |
    | `plugin-sdk/global-singleton` | Assistants de singleton/map/cache locaux au processus |
    | `plugin-sdk/group-activation` | Assistants ciblés de mode d’activation de groupe et d’analyse de commandes |
  </Accordion>

  <Accordion title="Sous-chemins d’authentification et de sécurité">
    | Sous-chemin | Exports principaux |
    | --- | --- |
    | `plugin-sdk/command-auth` | `resolveControlCommandGate`, assistants de registre de commandes incluant la mise en forme dynamique des menus d’arguments, assistants d’autorisation d’expéditeur |
    | `plugin-sdk/command-status` | Générateurs de messages de commande/d’aide, tels que `buildCommandsMessagePaginated` et `buildHelpMessage` |
    | `plugin-sdk/approval-auth-runtime` | Assistants de résolution d’approbateur et d’authentification d’action dans la même conversation |
    | `plugin-sdk/approval-client-runtime` | Assistants de profil/filtre d’approbation exec natifs |
    | `plugin-sdk/approval-delivery-runtime` | Adaptateurs natifs de capacité/livraison d’approbation |
    | `plugin-sdk/approval-gateway-runtime` | Assistant partagé de résolution du Gateway d’approbation |
    | `plugin-sdk/approval-handler-adapter-runtime` | Assistants légers de chargement d’adaptateurs d’approbation natifs pour les points d’entrée de canaux à chaud |
    | `plugin-sdk/approval-handler-runtime` | Assistants d’exécution plus larges de gestionnaire d’approbation ; préférez les points de raccordement adaptateur/Gateway plus ciblés lorsqu’ils suffisent |
    | `plugin-sdk/approval-native-runtime` | Assistants natifs de cible d’approbation + liaison de compte |
    | `plugin-sdk/approval-reply-runtime` | Assistants de charge utile de réponse d’approbation exec/Plugin |
    | `plugin-sdk/approval-runtime` | Assistants de charge utile d’approbation exec/Plugin, assistants natifs de routage/exécution d’approbation, et assistants structurés d’affichage d’approbation, tels que `formatApprovalDisplayPath` |
    | `plugin-sdk/reply-dedupe` | Assistants ciblés de réinitialisation de déduplication des réponses entrantes |
    | `plugin-sdk/channel-contract-testing` | Assistants ciblés de test de contrat de canal sans le barrel de test large |
    | `plugin-sdk/command-auth-native` | Authentification de commande native, mise en forme dynamique des menus d’arguments et assistants natifs de cible de session |
    | `plugin-sdk/command-detection` | Assistants partagés de détection de commandes |
    | `plugin-sdk/command-primitives-runtime` | Prédicats légers de texte de commande pour les chemins de canaux à chaud |
    | `plugin-sdk/command-surface` | Normalisation du corps de commande et assistants de surface de commande |
    | `plugin-sdk/allow-from` | `formatAllowFromLowercase` |
    | `plugin-sdk/channel-secret-runtime` | Assistants ciblés de collecte de contrats de secrets pour les surfaces de secrets de canal/Plugin |
    | `plugin-sdk/secret-ref-runtime` | Assistants ciblés de typage `coerceSecretRef` et SecretRef pour l’analyse de contrats/configurations de secrets |
    | `plugin-sdk/security-runtime` | Assistants partagés de confiance, de filtrage des messages privés, de fichiers/chemins bornés à la racine incluant les écritures uniquement en création, le remplacement atomique de fichiers synchrone/asynchrone, les écritures temporaires voisines, le repli de déplacement entre périphériques, les assistants de stockage privé de fichiers, les gardes de parents de liens symboliques, le contenu externe, la rédaction de texte sensible, la comparaison de secrets en temps constant et les assistants de collecte de secrets |
    | `plugin-sdk/ssrf-policy` | Assistants de liste d’hôtes autorisés et de politique SSRF de réseau privé |
    | `plugin-sdk/ssrf-dispatcher` | Assistants ciblés de dispatcher épinglé sans la large surface d’exécution d’infrastructure |
    | `plugin-sdk/ssrf-runtime` | Dispatcher épinglé, fetch protégé contre la SSRF, erreur SSRF et assistants de politique SSRF |
    | `plugin-sdk/secret-input` | Assistants d’analyse d’entrée de secret |
    | `plugin-sdk/webhook-ingress` | Assistants de requête/cible Webhook et coercition brute de websocket/corps |
    | `plugin-sdk/webhook-request-guards` | Assistants de taille/délai d’expiration du corps de requête |
  </Accordion>

  <Accordion title="Sous-chemins d’exécution et de stockage">
    | Sous-chemin | Exportations clés |
    | --- | --- |
    | `plugin-sdk/runtime` | Assistants généraux d’exécution, de journalisation, de sauvegarde et d’installation de plugins |
    | `plugin-sdk/runtime-env` | Assistants ciblés pour l’environnement d’exécution, le logger, les délais d’expiration, les nouvelles tentatives et le backoff |
    | `plugin-sdk/browser-config` | Façade de configuration de navigateur prise en charge pour les profils/valeurs par défaut normalisés, l’analyse d’URL CDP et les assistants d’authentification de contrôle du navigateur |
    | `plugin-sdk/channel-runtime-context` | Assistants génériques d’enregistrement et de recherche du contexte d’exécution des canaux |
    | `plugin-sdk/matrix` | Façade de compatibilité Matrix obsolète pour les anciens packages de canaux tiers ; les nouveaux plugins doivent importer directement `plugin-sdk/run-command` |
    | `plugin-sdk/mattermost` | Façade de compatibilité Mattermost obsolète pour les anciens packages de canaux tiers ; les nouveaux plugins doivent importer directement les sous-chemins génériques du SDK |
    | `plugin-sdk/runtime-store` | `createPluginRuntimeStore` |
    | `plugin-sdk/plugin-runtime` | Assistants partagés de commandes, hooks, HTTP et interactions de plugin |
    | `plugin-sdk/hook-runtime` | Assistants partagés de pipeline de Webhook/hook interne |
    | `plugin-sdk/lazy-runtime` | Assistants d’importation et de liaison paresseuses de runtime, tels que `createLazyRuntimeModule`, `createLazyRuntimeMethod` et `createLazyRuntimeSurface` |
    | `plugin-sdk/process-runtime` | Assistants d’exécution de processus |
    | `plugin-sdk/cli-runtime` | Assistants CLI de formatage, d’attente, de version, d’invocation d’arguments et de groupes de commandes paresseux |
    | `plugin-sdk/gateway-runtime` | Client Gateway, assistant de démarrage de client prêt pour la boucle d’événements, RPC CLI du Gateway, erreurs du protocole Gateway et assistants de correctifs d’état des canaux |
    | `plugin-sdk/config-contracts` | Surface de configuration ciblée, uniquement typée, pour les formes de configuration de plugin telles que `OpenClawConfig` et les types de configuration de canal/fournisseur |
    | `plugin-sdk/plugin-config-runtime` | Assistants d’exécution de recherche de configuration de plugin, tels que `requireRuntimeConfig`, `resolvePluginConfigObject` et `resolveLivePluginConfigObject` |
    | `plugin-sdk/config-mutation` | Assistants de mutation transactionnelle de configuration, tels que `mutateConfigFile`, `replaceConfigFile` et `logConfigUpdated` |
    | `plugin-sdk/runtime-config-snapshot` | Assistants d’instantané de configuration du processus courant, tels que `getRuntimeConfig`, `getRuntimeConfigSnapshot`, et mutateurs d’instantané de test |
    | `plugin-sdk/telegram-command-config` | Normalisation des noms/descriptions de commandes Telegram et vérifications de doublons/conflits, même lorsque la surface de contrat Telegram intégrée n’est pas disponible |
    | `plugin-sdk/text-autolink-runtime` | Détection d’autoliens de références de fichiers sans le barrel texte général |
    | `plugin-sdk/approval-runtime` | Assistants d’approbation d’exécution/de plugin, constructeurs de capacités d’approbation, assistants d’authentification/profil, assistants de routage/runtime natifs et formatage structuré du chemin d’affichage d’approbation |
    | `plugin-sdk/reply-runtime` | Assistants partagés d’exécution entrant/réponse, découpage, dispatch, Heartbeat, planificateur de réponses |
    | `plugin-sdk/reply-dispatch-runtime` | Assistants ciblés de dispatch/finalisation de réponse et de libellés de conversation |
    | `plugin-sdk/reply-history` | Assistants et marqueurs partagés d’historique de réponses à fenêtre courte, tels que `buildHistoryContext`, `HISTORY_CONTEXT_MARKER`, `recordPendingHistoryEntry` et `clearHistoryEntriesIfEnabled` |
    | `plugin-sdk/reply-reference` | `createReplyReferencePlanner` |
    | `plugin-sdk/reply-chunking` | Assistants ciblés de découpage de texte/Markdown |
    | `plugin-sdk/session-store-runtime` | Assistants de chemin de magasin de sessions, clé de session, date de mise à jour et mutation de magasin |
    | `plugin-sdk/cron-store-runtime` | Assistants de chemin/chargement/enregistrement du magasin Cron |
    | `plugin-sdk/state-paths` | Assistants de chemins de répertoires d’état/OAuth |
    | `plugin-sdk/routing` | Assistants de liaison route/clé de session/compte, tels que `resolveAgentRoute`, `buildAgentSessionKey` et `resolveDefaultAgentBoundAccountId` |
    | `plugin-sdk/status-helpers` | Assistants partagés de résumé d’état de canal/compte, valeurs par défaut d’état runtime et assistants de métadonnées de problème |
    | `plugin-sdk/target-resolver-runtime` | Assistants partagés de résolution de cible |
    | `plugin-sdk/string-normalization-runtime` | Assistants de normalisation de slugs/chaînes |
    | `plugin-sdk/request-url` | Extraire les URL sous forme de chaînes depuis des entrées de type fetch/request |
    | `plugin-sdk/run-command` | Exécuteur de commandes temporisé avec résultats stdout/stderr normalisés |
    | `plugin-sdk/param-readers` | Lecteurs de paramètres communs pour outils/CLI |
    | `plugin-sdk/tool-payload` | Extraire des charges utiles normalisées depuis des objets de résultats d’outils |
    | `plugin-sdk/tool-send` | Extraire les champs canoniques de cible d’envoi depuis les arguments d’outil |
    | `plugin-sdk/temp-path` | Assistants partagés de chemins de téléchargement temporaire et espaces de travail temporaires privés sécurisés |
    | `plugin-sdk/logging-core` | Assistants de logger de sous-système et de caviardage |
    | `plugin-sdk/markdown-table-runtime` | Assistants de mode et de conversion de tableaux Markdown |
    | `plugin-sdk/model-session-runtime` | Assistants de remplacement de modèle/session, tels que `applyModelOverrideToSessionEntry` et `resolveAgentMaxConcurrent` |
    | `plugin-sdk/talk-config-runtime` | Assistants de résolution de configuration de fournisseur Talk |
    | `plugin-sdk/json-store` | Petits assistants de lecture/écriture d’état JSON |
    | `plugin-sdk/file-lock` | Assistants de verrouillage de fichiers réentrant |
    | `plugin-sdk/persistent-dedupe` | Assistants de cache de déduplication adossé au disque |
    | `plugin-sdk/acp-runtime` | Assistants ACP de runtime/session et de dispatch de réponses |
    | `plugin-sdk/acp-runtime-backend` | Assistants légers d’enregistrement de backend ACP et de dispatch de réponses pour les plugins chargés au démarrage |
    | `plugin-sdk/acp-binding-resolve-runtime` | Résolution en lecture seule des liaisons ACP sans importations de démarrage du cycle de vie |
    | `plugin-sdk/agent-config-primitives` | Primitives ciblées de schéma de configuration runtime d’agent |
    | `plugin-sdk/boolean-param` | Lecteur souple de paramètre booléen |
    | `plugin-sdk/dangerous-name-runtime` | Assistants de résolution de correspondance de noms dangereux |
    | `plugin-sdk/device-bootstrap` | Assistants d’amorçage d’appareil et de jetons d’association |
    | `plugin-sdk/extension-shared` | Primitives partagées de canal passif, d’état et d’assistant de proxy ambiant |
    | `plugin-sdk/models-provider-runtime` | Assistants de réponse pour la commande/le fournisseur `/models` |
    | `plugin-sdk/skill-commands-runtime` | Assistants de liste de commandes de Skills |
    | `plugin-sdk/native-command-registry` | Assistants de registre/construction/sérialisation de commandes natives |
    | `plugin-sdk/agent-harness` | Surface expérimentale de plugin de confiance pour les harnais d’agents de bas niveau : types de harnais, assistants de pilotage/abandon d’exécution active, assistants de pont d’outils OpenClaw, assistants de politique d’outils de plan runtime, classification des résultats de terminal, assistants de formatage/détail de progression d’outils et utilitaires de résultat de tentative |
    | `plugin-sdk/provider-zai-endpoint` | Façade obsolète de détection de point de terminaison appartenant au fournisseur Z.AI ; utilisez l’API publique du plugin Z.AI |
    | `plugin-sdk/async-lock-runtime` | Assistant de verrou asynchrone local au processus pour les petits fichiers d’état runtime |
    | `plugin-sdk/channel-activity-runtime` | Assistant de télémétrie d’activité de canal |
    | `plugin-sdk/concurrency-runtime` | Assistant de concurrence bornée de tâches asynchrones |
    | `plugin-sdk/dedupe-runtime` | Assistants de cache de déduplication en mémoire |
    | `plugin-sdk/delivery-queue-runtime` | Assistant de drainage des livraisons sortantes en attente |
    | `plugin-sdk/file-access-runtime` | Assistants de chemins sécurisés pour fichiers locaux et sources multimédias |
    | `plugin-sdk/heartbeat-runtime` | Assistants de réveil, d’événement et de visibilité Heartbeat |
    | `plugin-sdk/number-runtime` | Assistant de coercition numérique |
    | `plugin-sdk/secure-random-runtime` | Assistants de jetons/UUID sécurisés |
    | `plugin-sdk/system-event-runtime` | Assistants de file d’événements système |
    | `plugin-sdk/transport-ready-runtime` | Assistant d’attente de disponibilité du transport |
    | `plugin-sdk/infra-runtime` | Shim de compatibilité obsolète ; utilisez les sous-chemins runtime ciblés ci-dessus |
    | `plugin-sdk/collection-runtime` | Petits assistants de cache borné |
    | `plugin-sdk/diagnostic-runtime` | Assistants d’indicateur de diagnostic, d’événement et de contexte de trace |
    | `plugin-sdk/error-runtime` | Assistants de graphe d’erreurs, de formatage et de classification d’erreurs partagée, `isApprovalNotFoundError` |
    | `plugin-sdk/fetch-runtime` | Fetch enveloppé, proxy, option EnvHttpProxyAgent et assistants de lookup épinglé |
    | `plugin-sdk/runtime-fetch` | Fetch runtime compatible dispatcher sans importations de proxy/guarded-fetch |
    | `plugin-sdk/response-limit-runtime` | Lecteur borné de corps de réponse sans la surface runtime multimédia générale |
    | `plugin-sdk/session-binding-runtime` | État de liaison de la conversation courante sans routage de liaison configuré ni magasins d’association |
    | `plugin-sdk/session-store-runtime` | Assistants de magasin de sessions sans importations générales d’écriture/maintenance de configuration |
    | `plugin-sdk/context-visibility-runtime` | Résolution de visibilité du contexte et filtrage de contexte supplémentaire sans importations générales de configuration/sécurité |
    | `plugin-sdk/string-coerce-runtime` | Assistants ciblés de coercition et de normalisation de chaînes/enregistrements primitifs sans importations Markdown/journalisation |
    | `plugin-sdk/host-runtime` | Assistants de normalisation de noms d’hôte et d’hôtes SCP |
    | `plugin-sdk/retry-runtime` | Assistants de configuration de nouvelles tentatives et d’exécuteur de nouvelles tentatives |
    | `plugin-sdk/agent-runtime` | Assistants de répertoire/identité/espace de travail d’agent, notamment `resolveAgentDir`, `resolveDefaultAgentDir` et l’export de compatibilité obsolète `resolveOpenClawAgentDir` |
    | `plugin-sdk/directory-runtime` | Requête/déduplication de répertoires adossée à la configuration |
    | `plugin-sdk/keyed-async-queue` | `KeyedAsyncQueue` |
  </Accordion>

  <Accordion title="Sous-chemins de capacités et de tests">
    | Sous-chemin | Exports clés |
    | --- | --- |
    | `plugin-sdk/media-runtime` | Assistants partagés de récupération/transformation/stockage de médias, détection des dimensions vidéo basée sur ffprobe, et générateurs de charges utiles média |
    | `plugin-sdk/media-mime` | Normalisation MIME ciblée, mappage des extensions de fichier, détection MIME, et assistants de type de média |
    | `plugin-sdk/media-store` | Assistants ciblés de magasin de médias tels que `saveMediaBuffer` |
    | `plugin-sdk/media-generation-runtime` | Assistants partagés de basculement de génération de médias, sélection de candidats, et messages de modèle manquant |
    | `plugin-sdk/media-understanding` | Types de fournisseurs de compréhension des médias, plus exports d’assistants image/audio/extraction structurée destinés aux fournisseurs |
    | `plugin-sdk/text-chunking` | Assistants de découpage/rendu de texte et de markdown, conversion de tableaux markdown, suppression de balises de directives, et utilitaires de texte sûr |
    | `plugin-sdk/text-chunking` | Assistant de découpage du texte sortant |
    | `plugin-sdk/speech` | Types de fournisseurs vocaux, plus exports de directives, registre, validation, générateur TTS compatible OpenAI, et assistants vocaux destinés aux fournisseurs |
    | `plugin-sdk/speech-core` | Types partagés de fournisseurs vocaux, registre, directive, normalisation, et exports d’assistants vocaux |
    | `plugin-sdk/realtime-transcription` | Types de fournisseurs de transcription en temps réel, assistants de registre, et assistant partagé de session WebSocket |
    | `plugin-sdk/realtime-voice` | Types de fournisseurs de voix en temps réel et assistants de registre |
    | `plugin-sdk/image-generation` | Types de fournisseurs de génération d’images, plus assistants d’assets d’image/d’URL de données et générateur de fournisseur d’images compatible OpenAI |
    | `plugin-sdk/image-generation-core` | Types partagés de génération d’images, basculement, authentification, et assistants de registre |
    | `plugin-sdk/music-generation` | Types de fournisseurs/requêtes/résultats de génération de musique |
    | `plugin-sdk/music-generation-core` | Types partagés de génération de musique, assistants de basculement, recherche de fournisseur, et analyse de références de modèle |
    | `plugin-sdk/video-generation` | Types de fournisseurs/requêtes/résultats de génération de vidéos |
    | `plugin-sdk/video-generation-core` | Types partagés de génération de vidéos, assistants de basculement, recherche de fournisseur, et analyse de références de modèle |
    | `plugin-sdk/webhook-targets` | Registre des cibles Webhook et assistants d’installation de routes |
    | `plugin-sdk/webhook-path` | Alias de compatibilité obsolète ; utilisez `plugin-sdk/webhook-ingress` |
    | `plugin-sdk/web-media` | Assistants partagés de chargement de médias distants/locaux |
    | `plugin-sdk/zod` | Réexport de compatibilité obsolète ; importez `zod` depuis `zod` directement |
    | `plugin-sdk/testing` | Barrel de compatibilité obsolète propre au dépôt pour les anciens tests OpenClaw. Les nouveaux tests du dépôt doivent plutôt importer des sous-chemins de test locaux ciblés tels que `plugin-sdk/agent-runtime-test-contracts`, `plugin-sdk/plugin-test-runtime`, `plugin-sdk/channel-test-helpers`, `plugin-sdk/test-env`, ou `plugin-sdk/test-fixtures` |
    | `plugin-sdk/plugin-test-api` | Assistant minimal `createTestPluginApi` propre au dépôt pour les tests unitaires d’enregistrement direct de plugins sans importer les passerelles d’assistants de test du dépôt |
    | `plugin-sdk/agent-runtime-test-contracts` | Fixtures de contrat d’adaptateur agent-runtime natif propres au dépôt pour les tests d’authentification, livraison, repli, hooks d’outils, superposition de prompt, schéma, et projection de transcription |
    | `plugin-sdk/channel-test-helpers` | Assistants de test orientés canal propres au dépôt pour les contrats génériques d’actions/configuration/état, assertions de répertoires, cycle de vie de démarrage de compte, threading de configuration d’envoi, mocks runtime, problèmes d’état, livraison sortante, et enregistrement de hooks |
    | `plugin-sdk/channel-target-testing` | Suite partagée propre au dépôt de cas d’erreur de résolution de cible pour les tests de canal |
    | `plugin-sdk/plugin-test-contracts` | Assistants de contrats propres au dépôt pour package de plugin, enregistrement, artefact public, import direct, API runtime, et effets de bord d’import |
    | `plugin-sdk/provider-test-contracts` | Assistants de contrats propres au dépôt pour runtime de fournisseur, authentification, découverte, onboarding, catalogue, assistant de configuration, capacité média, politique de replay, audio live STT en temps réel, recherche/récupération web, et flux |
    | `plugin-sdk/provider-http-test-mocks` | Mocks HTTP/auth Vitest opt-in propres au dépôt pour les tests de fournisseurs qui exercent `plugin-sdk/provider-http` |
    | `plugin-sdk/test-fixtures` | Fixtures génériques propres au dépôt pour capture de runtime CLI, contexte de sandbox, rédacteur de skill, message d’agent, événement système, rechargement de module, chemin de plugin groupé, texte de terminal, découpage, jeton d’authentification, et cas typé |
    | `plugin-sdk/test-node-mocks` | Assistants de mocks ciblés des builtins Node propres au dépôt à utiliser dans les fabriques Vitest `vi.mock("node:*")` |
  </Accordion>

  <Accordion title="Sous-chemins de mémoire">
    | Sous-chemin | Exports clés |
    | --- | --- |
    | `plugin-sdk/memory-core` | Surface d’assistants memory-core groupée pour les assistants de gestionnaire/configuration/fichier/CLI |
    | `plugin-sdk/memory-core-engine-runtime` | Façade runtime d’indexation/recherche mémoire |
    | `plugin-sdk/memory-core-host-engine-foundation` | Exports du moteur de fondation de l’hôte mémoire |
    | `plugin-sdk/memory-core-host-engine-embeddings` | Contrats d’embeddings de l’hôte mémoire, accès au registre, fournisseur local, et assistants génériques de lots/distants |
    | `plugin-sdk/memory-core-host-engine-qmd` | Exports du moteur QMD de l’hôte mémoire |
    | `plugin-sdk/memory-core-host-engine-storage` | Exports du moteur de stockage de l’hôte mémoire |
    | `plugin-sdk/memory-core-host-multimodal` | Assistants multimodaux de l’hôte mémoire |
    | `plugin-sdk/memory-core-host-query` | Assistants de requête de l’hôte mémoire |
    | `plugin-sdk/memory-core-host-secret` | Assistants de secrets de l’hôte mémoire |
    | `plugin-sdk/memory-core-host-events` | Alias de compatibilité obsolète ; utilisez `plugin-sdk/memory-host-events` |
    | `plugin-sdk/memory-core-host-status` | Assistants d’état de l’hôte mémoire |
    | `plugin-sdk/memory-core-host-runtime-cli` | Assistants runtime CLI de l’hôte mémoire |
    | `plugin-sdk/memory-core-host-runtime-core` | Assistants runtime de cœur de l’hôte mémoire |
    | `plugin-sdk/memory-core-host-runtime-files` | Assistants fichier/runtime de l’hôte mémoire |
    | `plugin-sdk/memory-host-core` | Alias neutre vis-à-vis des fournisseurs pour les assistants runtime de cœur de l’hôte mémoire |
    | `plugin-sdk/memory-host-events` | Alias neutre vis-à-vis des fournisseurs pour les assistants de journal d’événements de l’hôte mémoire |
    | `plugin-sdk/memory-host-files` | Alias de compatibilité obsolète ; utilisez `plugin-sdk/memory-core-host-runtime-files` |
    | `plugin-sdk/memory-host-markdown` | Assistants partagés de markdown géré pour les plugins adjacents à la mémoire |
    | `plugin-sdk/memory-host-search` | Façade runtime de mémoire active pour l’accès au gestionnaire de recherche |
    | `plugin-sdk/memory-host-status` | Alias de compatibilité obsolète ; utilisez `plugin-sdk/memory-core-host-status` |
  </Accordion>

  <Accordion title="Sous-chemins réservés aux assistants groupés">
    Il n’existe actuellement aucun sous-chemin SDK réservé aux assistants groupés. Les
    assistants propres à un propriétaire vivent dans le package de plugin propriétaire,
    tandis que les contrats d’hôte réutilisables utilisent des sous-chemins SDK génériques
    tels que `plugin-sdk/gateway-runtime`, `plugin-sdk/security-runtime`, et
    `plugin-sdk/plugin-config-runtime`.
  </Accordion>
</AccordionGroup>

## Associés

- [Vue d’ensemble du SDK de plugin](/fr/plugins/sdk-overview)
- [Configuration du SDK de plugin](/fr/plugins/sdk-setup)
- [Créer des plugins](/fr/plugins/building-plugins)
