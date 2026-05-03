---
read_when:
    - Choisir le bon sous-chemin plugin-sdk pour une importation de Plugin
    - Audit des sous-chemins des Plugins intégrés et des surfaces d’assistance
summary: 'Catalogue des sous-chemins du SDK de Plugin : quels imports se trouvent où, regroupés par domaine'
title: Sous-chemins du SDK de Plugin
x-i18n:
    generated_at: "2026-05-03T21:37:13Z"
    model: gpt-5.5
    provider: openai
    source_hash: b3c6d139523f060795a60bce79d124def6461c0bf6a03a7a06244604101f7eff
    source_path: plugins/sdk-subpaths.md
    workflow: 16
---

  Le SDK de plugin est exposé sous forme d’un ensemble de sous-chemins étroits sous `openclaw/plugin-sdk/`.
  Cette page répertorie les sous-chemins couramment utilisés, regroupés par objectif. La liste complète
  générée de plus de 200 sous-chemins se trouve dans `scripts/lib/plugin-sdk-entrypoints.json` ;
  les sous-chemins d’aide réservés aux plugins intégrés y apparaissent, mais relèvent du détail
  d’implémentation sauf si une page de documentation les promeut explicitement. Les maintainers peuvent auditer les sous-chemins
  d’aide réservés actifs avec `pnpm plugins:boundary-report:summary` ; les exports d’aide réservés
  inutilisés font échouer le rapport CI au lieu de rester dans le SDK public
  comme dette de compatibilité dormante.

  Pour le guide de création de plugins, consultez [Vue d’ensemble du SDK de Plugin](/fr/plugins/sdk-overview).

  ## Entrée de Plugin

  | Sous-chemin                                | Exports clés                                                                                                                                                                 |
  | ----------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
  | `plugin-sdk/plugin-entry`                 | `definePluginEntry`                                                                                                                                                          |
  | `plugin-sdk/core`                         | `defineChannelPluginEntry`, `createChatChannelPlugin`, `createChannelPluginBase`, `defineSetupPluginEntry`, `buildChannelConfigSchema`, `buildJsonChannelConfigSchema`       |
  | `plugin-sdk/config-schema`                | `OpenClawSchema`                                                                                                                                                             |
  | `plugin-sdk/provider-entry`               | `defineSingleProviderPluginEntry`                                                                                                                                            |
  | `plugin-sdk/testing`                      | Barrel de compatibilité large pour les anciens tests de plugin ; préférez les sous-chemins de test ciblés pour les nouveaux tests de plugins                                 |
  | `plugin-sdk/plugin-test-api`              | Générateur minimal de mock `OpenClawPluginApi` pour les tests unitaires d’enregistrement direct de plugin                                                                    |
  | `plugin-sdk/agent-runtime-test-contracts` | Fixtures de contrat d’adaptateur agent-runtime natif pour profils d’authentification, suppression de livraison, classification de repli, hooks d’outils, superpositions de prompt, schémas et réparation de transcript |
  | `plugin-sdk/channel-test-helpers`         | Aides de test pour cycle de vie de compte de canal, annuaire, configuration d’envoi, mock runtime, hook, entrée de canal intégré, horodatage d’enveloppe, réponse d’appairage et contrat de canal générique |
  | `plugin-sdk/channel-target-testing`       | Suite de tests partagée pour les cas d’erreur de résolution de cible de canal                                                                                                |
  | `plugin-sdk/plugin-test-contracts`        | Aides de contrat pour enregistrement de plugin, manifeste de package, artefact public, API runtime, effet de bord d’import et import direct                                  |
  | `plugin-sdk/plugin-test-runtime`          | Fixtures de test pour runtime de plugin, registre, enregistrement de fournisseur, assistant de configuration et flux de tâches runtime                                      |
  | `plugin-sdk/provider-test-contracts`      | Aides de contrat pour runtime de fournisseur, auth, découverte, onboarding, catalogue, capacité média, politique de rejeu, audio live STT temps réel, recherche/récupération web et assistant |
  | `plugin-sdk/provider-http-test-mocks`     | Mocks HTTP/auth Vitest opt-in pour les tests de fournisseur qui exercent `plugin-sdk/provider-http`                                                                          |
  | `plugin-sdk/test-env`                     | Fixtures d’environnement de test, fetch/réseau, serveur HTTP jetable, requête entrante, test live, système de fichiers temporaire et contrôle du temps                      |
  | `plugin-sdk/test-fixtures`                | Fixtures de test génériques pour CLI, bac à sable, skill, message d’agent, événement système, rechargement de module, chemin de plugin intégré, terminal, segmentation, jeton d’authentification et cas typés |
  | `plugin-sdk/test-node-mocks`              | Aides de mock ciblées pour les modules intégrés Node à utiliser dans les factories Vitest `vi.mock("node:*")`                                                               |
  | `plugin-sdk/migration`                    | Aides d’éléments de fournisseur de migration telles que `createMigrationItem`, constantes de raison, marqueurs d’état d’élément, aides de caviardage et `summarizeMigrationItems` |
  | `plugin-sdk/migration-runtime`            | Aides de migration runtime telles que `copyMigrationFileItem`, `withCachedMigrationConfigRuntime` et `writeMigrationReport`                                                  |

  <AccordionGroup>
  <Accordion title="Sous-chemins de canal">
    | Sous-chemin | Exports clés |
    | --- | --- |
    | `plugin-sdk/channel-core` | `defineChannelPluginEntry`, `defineSetupPluginEntry`, `createChatChannelPlugin`, `createChannelPluginBase` |
    | `plugin-sdk/config-schema` | Export du schéma Zod racine `openclaw.json` (`OpenClawSchema`) |
    | `plugin-sdk/channel-setup` | `createOptionalChannelSetupSurface`, `createOptionalChannelSetupAdapter`, `createOptionalChannelSetupWizard`, plus `DEFAULT_ACCOUNT_ID`, `createTopLevelChannelDmPolicy`, `setSetupChannelEnabled`, `splitSetupEntries` |
    | `plugin-sdk/setup` | Aides partagées pour l’assistant de configuration, prompts de liste d’autorisation, générateurs d’état de configuration |
    | `plugin-sdk/setup-runtime` | `createPatchedAccountSetupAdapter`, `createEnvPatchedAccountSetupAdapter`, `createSetupInputPresenceValidator`, `noteChannelLookupFailure`, `noteChannelLookupSummary`, `promptResolvedAllowFrom`, `splitSetupEntries`, `createAllowlistSetupWizardProxy`, `createDelegatedSetupWizardProxy` |
    | `plugin-sdk/setup-adapter-runtime` | `createEnvPatchedAccountSetupAdapter` |
    | `plugin-sdk/setup-tools` | `formatCliCommand`, `detectBinary`, `extractArchive`, `resolveBrewExecutable`, `formatDocsLink`, `CONFIG_DIR` |
    | `plugin-sdk/account-core` | Aides de configuration multi-compte et de barrière d’action, aides de repli vers le compte par défaut |
    | `plugin-sdk/account-id` | `DEFAULT_ACCOUNT_ID`, aides de normalisation d’ID de compte |
    | `plugin-sdk/account-resolution` | Aides de recherche de compte et de repli par défaut |
    | `plugin-sdk/account-helpers` | Aides étroites de liste de comptes et d’action de compte |
    | `plugin-sdk/channel-pairing` | `createChannelPairingController` |
    | `plugin-sdk/channel-reply-pipeline` | `createChannelReplyPipeline`, `resolveChannelSourceReplyDeliveryMode` |
    | `plugin-sdk/channel-config-helpers` | `createHybridChannelConfigAdapter`, `resolveChannelDmAccess`, `resolveChannelDmAllowFrom`, `resolveChannelDmPolicy`, `normalizeChannelDmPolicy`, `normalizeLegacyDmAliases` |
    | `plugin-sdk/channel-config-schema` | Primitives partagées de schéma de configuration de canal, plus générateurs Zod et JSON/TypeBox directs |
    | `plugin-sdk/bundled-channel-config-schema` | Schémas de configuration de canaux OpenClaw intégrés, uniquement pour les plugins intégrés maintenus |
    | `plugin-sdk/channel-config-schema-legacy` | Alias de compatibilité obsolète pour les schémas de configuration de canaux intégrés |
    | `plugin-sdk/telegram-command-config` | Aides de normalisation/validation des commandes personnalisées Telegram avec repli sur le contrat intégré |
    | `plugin-sdk/command-gating` | Aides étroites de barrière d’autorisation de commande |
    | `plugin-sdk/channel-policy` | `resolveChannelGroupRequireMention` |
    | `plugin-sdk/channel-lifecycle` | `createAccountStatusSink`, `createChannelRunQueue`, aides de cycle de vie/finalisation de flux brouillon |
    | `plugin-sdk/inbound-envelope` | Aides partagées de route entrante et de génération d’enveloppe |
    | `plugin-sdk/inbound-reply-dispatch` | Aides partagées d’enregistrement et de dispatch entrants |
    | `plugin-sdk/messaging-targets` | Aides d’analyse et de correspondance des cibles |
    | `plugin-sdk/outbound-media` | Aides partagées de chargement des médias sortants |
    | `plugin-sdk/outbound-send-deps` | Recherche légère des dépendances d’envoi sortant pour les adaptateurs de canal |
    | `plugin-sdk/outbound-runtime` | Aides de livraison sortante, identité, délégué d’envoi, session, formatage et planification de payload |
    | `plugin-sdk/poll-runtime` | Aides étroites de normalisation de sondage |
    | `plugin-sdk/thread-bindings-runtime` | Cycle de vie des liaisons de thread et aides d’adaptateur |
    | `plugin-sdk/agent-media-payload` | Ancien générateur de payload média d’agent |
    | `plugin-sdk/conversation-runtime` | Aides de conversation/liaison de thread, appairage et liaison configurée |
    | `plugin-sdk/runtime-config-snapshot` | Aide de snapshot de configuration runtime |
    | `plugin-sdk/runtime-group-policy` | Aides de résolution de politique de groupe runtime |
    | `plugin-sdk/channel-status` | Aides partagées de snapshot/résumé d’état de canal |
    | `plugin-sdk/channel-config-primitives` | Primitives étroites de schéma de configuration de canal |
    | `plugin-sdk/channel-config-writes` | Aides d’autorisation d’écriture de configuration de canal |
    | `plugin-sdk/channel-plugin-common` | Exports partagés de préambule de plugin de canal |
    | `plugin-sdk/allowlist-config-edit` | Aides de modification/lecture de configuration de liste d’autorisation |
    | `plugin-sdk/group-access` | Aides partagées de décision d’accès de groupe |
    | `plugin-sdk/direct-dm` | Aides partagées d’auth/guard de DM direct |
    | `plugin-sdk/discord` | Façade de compatibilité Discord obsolète pour `@openclaw/discord@2026.3.13` publié et la compatibilité propriétaire suivie ; les nouveaux plugins doivent utiliser les sous-chemins génériques du SDK de canal |
    | `plugin-sdk/telegram-account` | Façade de compatibilité de résolution de compte Telegram obsolète pour la compatibilité propriétaire suivie ; les nouveaux plugins doivent utiliser les aides runtime injectées ou les sous-chemins génériques du SDK de canal |
    | `plugin-sdk/zalouser` | Façade de compatibilité Zalo Personal obsolète pour les packages Lark/Zalo publiés qui importent encore l’autorisation des commandes d’expéditeur ; les nouveaux plugins doivent utiliser `plugin-sdk/command-auth` |
    | `plugin-sdk/interactive-runtime` | Aides de présentation sémantique des messages, de livraison et de réponse interactive héritée. Consultez [Présentation des messages](/fr/plugins/message-presentation) |
    | `plugin-sdk/channel-inbound` | Barrel de compatibilité pour debounce entrant, correspondance de mentions, aides de politique de mention et aides d’enveloppe |
    | `plugin-sdk/channel-inbound-debounce` | Aides étroites de debounce entrant |
    | `plugin-sdk/channel-mention-gating` | Aides étroites de politique de mention, marqueur de mention et texte de mention sans la surface plus large du runtime entrant |
    | `plugin-sdk/channel-envelope` | Aides étroites de formatage d’enveloppe entrante |
    | `plugin-sdk/channel-location` | Contexte d’emplacement de canal et aides de formatage |
    | `plugin-sdk/channel-logging` | Aides de journalisation de canal pour les rejets entrants et les échecs de saisie/ack |
    | `plugin-sdk/channel-send-result` | Types de résultat de réponse |
    | `plugin-sdk/channel-actions` | Aides d’action sur message de canal, plus aides de schéma natif obsolètes conservées pour la compatibilité des plugins |
    | `plugin-sdk/channel-route` | Aides partagées de normalisation de route, résolution de cible pilotée par parseur, conversion d’ID de thread en chaîne, clés de route de déduplication/compactage, types de cible analysée et aides de comparaison route/cible |
    | `plugin-sdk/channel-targets` | Aides d’analyse de cible ; les appelants de comparaison de route doivent utiliser `plugin-sdk/channel-route` |
    | `plugin-sdk/channel-contract` | Types de contrat de canal |
    | `plugin-sdk/channel-feedback` | Câblage des retours/réactions |
    | `plugin-sdk/channel-secret-runtime` | Aides étroites de contrat de secret telles que `collectSimpleChannelFieldAssignments`, `getChannelSurface`, `pushAssignment` et types de cible de secret |
  </Accordion>

  <Accordion title="Sous-chemins de fournisseurs">
    | Sous-chemin | Exports clés |
    | --- | --- |
    | `plugin-sdk/provider-entry` | `defineSingleProviderPluginEntry` |
    | `plugin-sdk/lmstudio` | Façade de fournisseur LM Studio prise en charge pour la configuration, la découverte du catalogue et la préparation des modèles à l’exécution |
    | `plugin-sdk/lmstudio-runtime` | Façade d’exécution LM Studio prise en charge pour les valeurs par défaut du serveur local, la découverte des modèles, les en-têtes de requête et les helpers de modèles chargés |
    | `plugin-sdk/provider-setup` | Helpers de configuration de fournisseurs locaux/auto-hébergés sélectionnés |
    | `plugin-sdk/self-hosted-provider-setup` | Helpers de configuration ciblés pour les fournisseurs auto-hébergés compatibles OpenAI |
    | `plugin-sdk/cli-backend` | Valeurs par défaut du backend CLI + constantes de surveillance |
    | `plugin-sdk/provider-auth-runtime` | Helpers de résolution de clés d’API à l’exécution pour les plugins de fournisseurs |
    | `plugin-sdk/provider-auth-api-key` | Helpers d’intégration/decriture de profils pour clés d’API, tels que `upsertApiKeyProfile` |
    | `plugin-sdk/provider-auth-result` | Générateur standard de résultat d’authentification OAuth |
    | `plugin-sdk/provider-auth-login` | Helpers de connexion interactive partagés pour les plugins de fournisseurs |
    | `plugin-sdk/provider-env-vars` | Helpers de recherche de variables d’environnement d’authentification de fournisseur |
    | `plugin-sdk/provider-auth` | `createProviderApiKeyAuthMethod`, `ensureApiKeyFromOptionEnvOrPrompt`, `upsertAuthProfile`, `upsertApiKeyProfile`, `writeOAuthCredentials` |
    | `plugin-sdk/provider-model-shared` | `ProviderReplayFamily`, `buildProviderReplayFamilyHooks`, `normalizeModelCompat`, générateurs partagés de politiques de relecture, helpers de points de terminaison de fournisseurs et helpers de normalisation d’identifiants de modèles tels que `normalizeNativeXaiModelId` |
    | `plugin-sdk/provider-catalog-runtime` | Hook d’exécution d’augmentation du catalogue des fournisseurs et raccords de registre plugin-fournisseur pour les tests de contrat |
    | `plugin-sdk/provider-catalog-shared` | `findCatalogTemplate`, `buildSingleProviderApiKeyCatalog`, `buildManifestModelProviderConfig`, `supportsNativeStreamingUsageCompat`, `applyProviderNativeStreamingUsageCompat` |
    | `plugin-sdk/provider-http` | Helpers génériques de capacités HTTP/points de terminaison de fournisseurs, erreurs HTTP de fournisseurs et helpers de formulaires multipart pour la transcription audio |
    | `plugin-sdk/provider-web-fetch-contract` | Helpers ciblés de contrat de configuration/sélection web-fetch tels que `enablePluginInConfig` et `WebFetchProviderPlugin` |
    | `plugin-sdk/provider-web-fetch` | Helpers d’enregistrement/cache de fournisseurs web-fetch |
    | `plugin-sdk/provider-web-search-config-contract` | Helpers ciblés de configuration/identifiants web-search pour les fournisseurs qui n’ont pas besoin du câblage d’activation de plugin |
    | `plugin-sdk/provider-web-search-contract` | Helpers ciblés de contrat de configuration/identifiants web-search tels que `createWebSearchProviderContractFields`, `enablePluginInConfig`, `resolveProviderWebSearchPluginConfig` et accesseurs/mutateurs d’identifiants à portée limitée |
    | `plugin-sdk/provider-web-search` | Helpers d’enregistrement/cache/exécution de fournisseurs web-search |
    | `plugin-sdk/provider-tools` | `ProviderToolCompatFamily`, `buildProviderToolCompatFamilyHooks`, nettoyage + diagnostics des schémas Gemini et helpers de compatibilité xAI tels que `resolveXaiModelCompatPatch` / `applyXaiModelCompat` |
    | `plugin-sdk/provider-usage` | `fetchClaudeUsage` et similaires |
    | `plugin-sdk/provider-stream` | `ProviderStreamFamily`, `buildProviderStreamFamilyHooks`, `composeProviderStreamWrappers`, types de wrappers de flux et helpers partagés de wrappers Anthropic/Bedrock/DeepSeek V4/Google/Kilocode/Moonshot/OpenAI/OpenRouter/Z.A.I/MiniMax/Copilot |
    | `plugin-sdk/provider-transport-runtime` | Helpers de transport de fournisseur natif, tels que récupération protégée, transformations de messages de transport et flux d’événements de transport inscriptibles |
    | `plugin-sdk/provider-onboard` | Helpers de correctifs de configuration d’intégration |
    | `plugin-sdk/global-singleton` | Helpers de singleton/map/cache locaux au processus |
    | `plugin-sdk/group-activation` | Helpers ciblés de mode d’activation de groupe et d’analyse des commandes |
  </Accordion>

  <Accordion title="Sous-chemins d’authentification et de sécurité">
    | Sous-chemin | Exports clés |
    | --- | --- |
    | `plugin-sdk/command-auth` | `resolveControlCommandGate`, helpers de registre de commandes incluant la mise en forme de menus d’arguments dynamiques, helpers d’autorisation d’expéditeur |
    | `plugin-sdk/command-status` | Générateurs de messages de commandes/aide tels que `buildCommandsMessagePaginated` et `buildHelpMessage` |
    | `plugin-sdk/approval-auth-runtime` | Résolution des approbateurs et helpers d’authentification d’action dans la même discussion |
    | `plugin-sdk/approval-client-runtime` | Helpers de profils/filtres d’approbation d’exécution native |
    | `plugin-sdk/approval-delivery-runtime` | Adaptateurs natifs de capacités/livraison d’approbation |
    | `plugin-sdk/approval-gateway-runtime` | Helper partagé de résolution de Gateway d’approbation |
    | `plugin-sdk/approval-handler-adapter-runtime` | Helpers légers de chargement d’adaptateurs d’approbation natifs pour les points d’entrée de canaux à chaud |
    | `plugin-sdk/approval-handler-runtime` | Helpers d’exécution plus larges pour les gestionnaires d’approbation ; préférez les raccords d’adaptateur/Gateway plus ciblés lorsqu’ils suffisent |
    | `plugin-sdk/approval-native-runtime` | Helpers de cible d’approbation native + liaison de compte |
    | `plugin-sdk/approval-reply-runtime` | Helpers de payload de réponse d’approbation exec/plugin |
    | `plugin-sdk/approval-runtime` | Helpers de payload d’approbation exec/plugin, helpers de routage/exécution d’approbation native et helpers d’affichage structuré des approbations tels que `formatApprovalDisplayPath` |
    | `plugin-sdk/reply-dedupe` | Helpers ciblés de réinitialisation de déduplication des réponses entrantes |
    | `plugin-sdk/channel-contract-testing` | Helpers ciblés de tests de contrat de canal sans le large barrel de test |
    | `plugin-sdk/command-auth-native` | Authentification native de commandes, mise en forme de menus d’arguments dynamiques et helpers natifs de cible de session |
    | `plugin-sdk/command-detection` | Helpers partagés de détection de commandes |
    | `plugin-sdk/command-primitives-runtime` | Prédicats légers de texte de commande pour les chemins de canaux à chaud |
    | `plugin-sdk/command-surface` | Normalisation du corps des commandes et helpers de surface de commandes |
    | `plugin-sdk/allow-from` | `formatAllowFromLowercase` |
    | `plugin-sdk/channel-secret-runtime` | Helpers ciblés de collecte de contrats de secrets pour les surfaces de secrets de canaux/plugins |
    | `plugin-sdk/secret-ref-runtime` | Helpers ciblés de typage `coerceSecretRef` et SecretRef pour l’analyse des contrats/configurations de secrets |
    | `plugin-sdk/security-runtime` | Helpers partagés de confiance, filtrage DM, contenu externe, occultation de texte sensible, comparaison de secrets en temps constant et collecte de secrets |
    | `plugin-sdk/ssrf-policy` | Helpers de liste d’autorisation d’hôtes et de politique SSRF de réseau privé |
    | `plugin-sdk/ssrf-dispatcher` | Helpers ciblés de répartiteur épinglé sans la large surface d’exécution d’infrastructure |
    | `plugin-sdk/ssrf-runtime` | Répartiteur épinglé, récupération protégée contre la SSRF, erreur SSRF et helpers de politique SSRF |
    | `plugin-sdk/secret-input` | Helpers d’analyse d’entrée de secret |
    | `plugin-sdk/webhook-ingress` | Helpers de requête/cible Webhook et coercition brute de websocket/corps |
    | `plugin-sdk/webhook-request-guards` | Helpers de taille maximale/délai d’expiration du corps de requête |
  </Accordion>

  <Accordion title="Sous-chemins d’exécution et de stockage">
    | Sous-chemin | Exports clés |
    | --- | --- |
    | `plugin-sdk/runtime` | Assistants généraux d’exécution, de journalisation, de sauvegarde et d’installation de plugin |
    | `plugin-sdk/runtime-env` | Assistants ciblés pour l’environnement d’exécution, le logger, les délais d’expiration, les nouvelles tentatives et le backoff |
    | `plugin-sdk/browser-config` | Façade de configuration de navigateur prise en charge pour les profils/valeurs par défaut normalisés, l’analyse des URL CDP et les assistants d’authentification du contrôle de navigateur |
    | `plugin-sdk/channel-runtime-context` | Assistants génériques d’enregistrement et de recherche de contexte d’exécution de canal |
    | `plugin-sdk/matrix` | Façade de compatibilité Matrix obsolète pour les anciens packages de canaux tiers ; les nouveaux plugins doivent importer `plugin-sdk/run-command` directement |
    | `plugin-sdk/mattermost` | Façade de compatibilité Mattermost obsolète pour les anciens packages de canaux tiers ; les nouveaux plugins doivent importer directement les sous-chemins génériques du SDK |
    | `plugin-sdk/runtime-store` | `createPluginRuntimeStore` |
    | `plugin-sdk/plugin-runtime` | Assistants partagés pour les commandes, hooks, HTTP et interactions de plugin |
    | `plugin-sdk/hook-runtime` | Assistants partagés de pipeline Webhook/hook interne |
    | `plugin-sdk/lazy-runtime` | Assistants d’importation et de liaison paresseuses d’exécution tels que `createLazyRuntimeModule`, `createLazyRuntimeMethod` et `createLazyRuntimeSurface` |
    | `plugin-sdk/process-runtime` | Assistants d’exécution de processus |
    | `plugin-sdk/cli-runtime` | Assistants de formatage CLI, d’attente, de version, d’invocation d’arguments et de groupes de commandes paresseux |
    | `plugin-sdk/gateway-runtime` | Client Gateway, assistant de démarrage de client prêt pour la boucle d’événements, RPC CLI de gateway, erreurs de protocole Gateway et assistants de patch d’état de canal |
    | `plugin-sdk/config-types` | Surface de configuration uniquement typée pour les formes de configuration de plugin telles que `OpenClawConfig` et les types de configuration de canal/fournisseur |
    | `plugin-sdk/plugin-config-runtime` | Assistants de recherche de configuration de plugin à l’exécution tels que `requireRuntimeConfig`, `resolvePluginConfigObject` et `resolveLivePluginConfigObject` |
    | `plugin-sdk/config-mutation` | Assistants de mutation transactionnelle de configuration tels que `mutateConfigFile`, `replaceConfigFile` et `logConfigUpdated` |
    | `plugin-sdk/runtime-config-snapshot` | Assistants d’instantané de configuration du processus courant tels que `getRuntimeConfig`, `getRuntimeConfigSnapshot` et les setters d’instantané de test |
    | `plugin-sdk/telegram-command-config` | Normalisation des noms/descriptions de commandes Telegram et vérifications de doublons/conflits, même lorsque la surface de contrat Telegram groupée est indisponible |
    | `plugin-sdk/text-autolink-runtime` | Détection d’autolien de références de fichiers sans le barrel général text-runtime |
    | `plugin-sdk/approval-runtime` | Assistants d’approbation exec/plugin, constructeurs de capacités d’approbation, assistants d’authentification/profil, assistants de routage/exécution natifs et formatage de chemin d’affichage d’approbation structurée |
    | `plugin-sdk/reply-runtime` | Assistants partagés d’exécution entrant/réponse, découpage, distribution, Heartbeat, planificateur de réponse |
    | `plugin-sdk/reply-dispatch-runtime` | Assistants ciblés de distribution/finalisation de réponse et d’étiquettes de conversation |
    | `plugin-sdk/reply-history` | Assistants et marqueurs partagés d’historique de réponse à fenêtre courte tels que `buildHistoryContext`, `HISTORY_CONTEXT_MARKER`, `recordPendingHistoryEntry` et `clearHistoryEntriesIfEnabled` |
    | `plugin-sdk/reply-reference` | `createReplyReferencePlanner` |
    | `plugin-sdk/reply-chunking` | Assistants ciblés de découpage de texte/markdown |
    | `plugin-sdk/session-store-runtime` | Assistants de chemin de stockage de session, de clé de session, de date de mise à jour et de mutation du stockage |
    | `plugin-sdk/cron-store-runtime` | Assistants de chemin/chargement/enregistrement du stockage Cron |
    | `plugin-sdk/state-paths` | Assistants de chemins de répertoire State/OAuth |
    | `plugin-sdk/routing` | Assistants de liaison route/clé de session/compte tels que `resolveAgentRoute`, `buildAgentSessionKey` et `resolveDefaultAgentBoundAccountId` |
    | `plugin-sdk/status-helpers` | Assistants partagés de synthèse d’état de canal/compte, valeurs par défaut d’état d’exécution et assistants de métadonnées de problème |
    | `plugin-sdk/target-resolver-runtime` | Assistants partagés de résolution de cible |
    | `plugin-sdk/string-normalization-runtime` | Assistants de normalisation de slug/chaîne |
    | `plugin-sdk/request-url` | Extraire des URL sous forme de chaînes depuis des entrées semblables à fetch/request |
    | `plugin-sdk/run-command` | Exécuteur de commandes temporisé avec résultats stdout/stderr normalisés |
    | `plugin-sdk/param-readers` | Lecteurs de paramètres courants pour outil/CLI |
    | `plugin-sdk/tool-payload` | Extraire des charges utiles normalisées depuis les objets de résultat d’outil |
    | `plugin-sdk/tool-send` | Extraire les champs de cible d’envoi canoniques depuis les arguments d’outil |
    | `plugin-sdk/temp-path` | Assistants partagés de chemins de téléchargement temporaires |
    | `plugin-sdk/logging-core` | Assistants de logger de sous-système et de caviardage |
    | `plugin-sdk/markdown-table-runtime` | Assistants de mode et de conversion de tableaux Markdown |
    | `plugin-sdk/model-session-runtime` | Assistants de remplacement de modèle/session tels que `applyModelOverrideToSessionEntry` et `resolveAgentMaxConcurrent` |
    | `plugin-sdk/talk-config-runtime` | Assistants de résolution de configuration de fournisseur Talk |
    | `plugin-sdk/json-store` | Petits assistants de lecture/écriture d’état JSON |
    | `plugin-sdk/file-lock` | Assistants de verrouillage de fichier réentrants |
    | `plugin-sdk/persistent-dedupe` | Assistants de cache de déduplication adossé au disque |
    | `plugin-sdk/acp-runtime` | Assistants d’exécution/session ACP et de distribution de réponse |
    | `plugin-sdk/acp-runtime-backend` | Assistants légers d’enregistrement de backend ACP et de distribution de réponse pour les plugins chargés au démarrage |
    | `plugin-sdk/acp-binding-resolve-runtime` | Résolution de liaison ACP en lecture seule sans importations de démarrage du cycle de vie |
    | `plugin-sdk/agent-config-primitives` | Primitives ciblées de schéma de configuration d’exécution d’agent |
    | `plugin-sdk/boolean-param` | Lecteur permissif de paramètre booléen |
    | `plugin-sdk/dangerous-name-runtime` | Assistants de résolution de correspondance de noms dangereux |
    | `plugin-sdk/device-bootstrap` | Assistants d’amorçage d’appareil et de jeton d’appairage |
    | `plugin-sdk/extension-shared` | Primitives partagées d’assistance pour canal passif, état et proxy ambiant |
    | `plugin-sdk/models-provider-runtime` | Assistants de réponse de commande/fournisseur `/models` |
    | `plugin-sdk/skill-commands-runtime` | Assistants de listage des commandes Skill |
    | `plugin-sdk/native-command-registry` | Assistants de registre/construction/sérialisation de commandes natives |
    | `plugin-sdk/agent-harness` | Surface expérimentale de plugin de confiance pour les harnais d’agent de bas niveau : types de harnais, assistants d’orientation/abandon d’exécution active, assistants de pont d’outils OpenClaw, assistants de politique d’outil runtime-plan, classification des résultats de terminal, assistants de formatage/détail de progression d’outil et utilitaires de résultat de tentative |
    | `plugin-sdk/provider-zai-endpoint` | Assistants de détection d’endpoint Z.AI |
    | `plugin-sdk/async-lock-runtime` | Assistant de verrouillage asynchrone local au processus pour les petits fichiers d’état d’exécution |
    | `plugin-sdk/channel-activity-runtime` | Assistant de télémétrie d’activité de canal |
    | `plugin-sdk/concurrency-runtime` | Assistant de concurrence bornée de tâches asynchrones |
    | `plugin-sdk/dedupe-runtime` | Assistants de cache de déduplication en mémoire |
    | `plugin-sdk/delivery-queue-runtime` | Assistant de vidage des livraisons sortantes en attente |
    | `plugin-sdk/file-access-runtime` | Assistants de chemins sûrs pour fichiers locaux et sources média |
    | `plugin-sdk/heartbeat-runtime` | Assistants d’événements Heartbeat et de visibilité |
    | `plugin-sdk/number-runtime` | Assistant de coercition numérique |
    | `plugin-sdk/secure-random-runtime` | Assistants de jetons/UUID sécurisés |
    | `plugin-sdk/system-event-runtime` | Assistants de file d’événements système |
    | `plugin-sdk/transport-ready-runtime` | Assistant d’attente de disponibilité du transport |
    | `plugin-sdk/infra-runtime` | Shim de compatibilité obsolète ; utilisez les sous-chemins d’exécution ciblés ci-dessus |
    | `plugin-sdk/collection-runtime` | Petits assistants de cache borné |
    | `plugin-sdk/diagnostic-runtime` | Assistants de drapeau de diagnostic, d’événement et de contexte de trace |
    | `plugin-sdk/error-runtime` | Assistants de graphe d’erreurs, de formatage et de classification d’erreurs partagés, `isApprovalNotFoundError` |
    | `plugin-sdk/fetch-runtime` | Fetch encapsulé, proxy, option EnvHttpProxyAgent et assistants de lookup épinglé |
    | `plugin-sdk/runtime-fetch` | Fetch d’exécution conscient du dispatcher sans importations proxy/guarded-fetch |
    | `plugin-sdk/response-limit-runtime` | Lecteur borné de corps de réponse sans la surface générale media runtime |
    | `plugin-sdk/session-binding-runtime` | État de liaison de la conversation courante sans routage de liaison configuré ni stockages d’appairage |
    | `plugin-sdk/session-store-runtime` | Assistants de stockage de session sans importations générales d’écritures/maintenance de configuration |
    | `plugin-sdk/context-visibility-runtime` | Résolution de visibilité du contexte et filtrage du contexte supplémentaire sans importations générales de configuration/sécurité |
    | `plugin-sdk/string-coerce-runtime` | Assistants ciblés de coercition et de normalisation de primitives enregistrement/chaîne sans importations markdown/journalisation |
    | `plugin-sdk/host-runtime` | Assistants de normalisation de nom d’hôte et d’hôte SCP |
    | `plugin-sdk/retry-runtime` | Assistants de configuration de nouvelle tentative et d’exécution de nouvelle tentative |
    | `plugin-sdk/agent-runtime` | Assistants de répertoire/identité/espace de travail d’agent |
    | `plugin-sdk/directory-runtime` | Requête/déduplication de répertoire adossée à la configuration |
    | `plugin-sdk/keyed-async-queue` | `KeyedAsyncQueue` |
  </Accordion>

  <Accordion title="Sous-chemins de capacités et de test">
    | Sous-chemin | Exportations clés |
    | --- | --- |
    | `plugin-sdk/media-runtime` | Helpers partagés de récupération/transformation/stockage de médias, détection des dimensions vidéo basée sur ffprobe et constructeurs de charges utiles média |
    | `plugin-sdk/media-store` | Helpers de stockage média ciblés, tels que `saveMediaBuffer` |
    | `plugin-sdk/media-generation-runtime` | Helpers partagés de bascule de génération média, sélection de candidats et messages de modèle manquant |
    | `plugin-sdk/media-understanding` | Types de fournisseurs de compréhension média, ainsi qu’exportations de helpers image/audio destinés aux fournisseurs |
    | `plugin-sdk/text-runtime` | Helpers partagés de texte/markdown/journalisation, tels que la suppression du texte visible par l’assistant, les helpers de rendu/découpage/tableaux markdown, les helpers de rédaction, les helpers de balises de directives et les utilitaires de texte sûr |
    | `plugin-sdk/text-chunking` | Helper de découpage du texte sortant |
    | `plugin-sdk/speech` | Types de fournisseurs de synthèse vocale, ainsi qu’exportations destinées aux fournisseurs pour les directives, le registre, la validation, le constructeur TTS compatible OpenAI et les helpers vocaux |
    | `plugin-sdk/speech-core` | Types partagés de fournisseurs vocaux, registre, directives, normalisation et exportations de helpers vocaux |
    | `plugin-sdk/realtime-transcription` | Types de fournisseurs de transcription en temps réel, helpers de registre et helper partagé de session WebSocket |
    | `plugin-sdk/realtime-voice` | Types de fournisseurs vocaux en temps réel et helpers de registre |
    | `plugin-sdk/image-generation` | Types de fournisseurs de génération d’images, ainsi que helpers d’assets image/d’URL de données et constructeur de fournisseur d’images compatible OpenAI |
    | `plugin-sdk/image-generation-core` | Types partagés de génération d’images, helpers de bascule, d’authentification et de registre |
    | `plugin-sdk/music-generation` | Types de fournisseurs/requêtes/résultats de génération musicale |
    | `plugin-sdk/music-generation-core` | Types partagés de génération musicale, helpers de bascule, recherche de fournisseur et analyse de références de modèle |
    | `plugin-sdk/video-generation` | Types de fournisseurs/requêtes/résultats de génération vidéo |
    | `plugin-sdk/video-generation-core` | Types partagés de génération vidéo, helpers de bascule, recherche de fournisseur et analyse de références de modèle |
    | `plugin-sdk/webhook-targets` | Registre de cibles Webhook et helpers d’installation de routes |
    | `plugin-sdk/webhook-path` | Helpers de normalisation de chemin Webhook |
    | `plugin-sdk/web-media` | Helpers partagés de chargement de médias distants/locaux |
    | `plugin-sdk/zod` | `zod` réexporté pour les consommateurs du SDK de plugin |
    | `plugin-sdk/testing` | Barrel de compatibilité large pour les anciens tests de plugins. Les nouveaux tests d’extension doivent plutôt importer des sous-chemins SDK ciblés, tels que `plugin-sdk/agent-runtime-test-contracts`, `plugin-sdk/plugin-test-runtime`, `plugin-sdk/channel-test-helpers`, `plugin-sdk/test-env` ou `plugin-sdk/test-fixtures` |
    | `plugin-sdk/plugin-test-api` | Helper minimal `createTestPluginApi` pour les tests unitaires d’enregistrement direct de plugin sans importer les passerelles de helpers de test du dépôt |
    | `plugin-sdk/agent-runtime-test-contracts` | Fixtures natives de contrat d’adaptateur d’exécution d’agent pour les tests d’authentification, de livraison, de repli, de hook d’outil, de superposition de prompt, de schéma et de projection de transcript |
    | `plugin-sdk/channel-test-helpers` | Helpers de test orientés canal pour les contrats génériques d’actions/configuration/statut, les assertions de répertoire, le cycle de vie de démarrage de compte, le threading de configuration d’envoi, les mocks d’exécution, les problèmes de statut, la livraison sortante et l’enregistrement de hooks |
    | `plugin-sdk/channel-target-testing` | Suite partagée de cas d’erreur de résolution de cible pour les tests de canal |
    | `plugin-sdk/plugin-test-contracts` | Helpers de contrats de package de plugin, d’enregistrement, d’artefact public, d’import direct, d’API d’exécution et d’effets de bord d’importation |
    | `plugin-sdk/provider-test-contracts` | Helpers de contrats pour l’exécution de fournisseur, l’authentification, la découverte, l’onboarding, le catalogue, l’assistant, les capacités média, la politique de rejeu, l’audio en direct STT temps réel, la recherche/récupération web et les flux |
    | `plugin-sdk/provider-http-test-mocks` | Mocks HTTP/auth Vitest optionnels pour les tests de fournisseurs qui exercent `plugin-sdk/provider-http` |
    | `plugin-sdk/test-fixtures` | Fixtures génériques de capture d’exécution CLI, contexte sandbox, rédacteur de Skills, message d’agent, événement système, rechargement de module, chemin de plugin groupé, texte de terminal, découpage, jeton d’authentification et cas typés |
    | `plugin-sdk/test-node-mocks` | Helpers ciblés de mocks intégrés Node à utiliser dans les fabriques Vitest `vi.mock("node:*")` |
  </Accordion>

  <Accordion title="Sous-chemins de mémoire">
    | Sous-chemin | Exportations clés |
    | --- | --- |
    | `plugin-sdk/memory-core` | Surface de helpers memory-core groupée pour les helpers de gestionnaire/configuration/fichier/CLI |
    | `plugin-sdk/memory-core-engine-runtime` | Façade d’exécution d’indexation/recherche mémoire |
    | `plugin-sdk/memory-core-host-engine-foundation` | Exportations du moteur fondation de l’hôte mémoire |
    | `plugin-sdk/memory-core-host-engine-embeddings` | Contrats d’embeddings de l’hôte mémoire, accès au registre, fournisseur local et helpers génériques par lot/distants |
    | `plugin-sdk/memory-core-host-engine-qmd` | Exportations du moteur QMD de l’hôte mémoire |
    | `plugin-sdk/memory-core-host-engine-storage` | Exportations du moteur de stockage de l’hôte mémoire |
    | `plugin-sdk/memory-core-host-multimodal` | Helpers multimodaux de l’hôte mémoire |
    | `plugin-sdk/memory-core-host-query` | Helpers de requête de l’hôte mémoire |
    | `plugin-sdk/memory-core-host-secret` | Helpers de secrets de l’hôte mémoire |
    | `plugin-sdk/memory-core-host-events` | Helpers de journal d’événements de l’hôte mémoire |
    | `plugin-sdk/memory-core-host-status` | Helpers de statut de l’hôte mémoire |
    | `plugin-sdk/memory-core-host-runtime-cli` | Helpers d’exécution CLI de l’hôte mémoire |
    | `plugin-sdk/memory-core-host-runtime-core` | Helpers d’exécution cœur de l’hôte mémoire |
    | `plugin-sdk/memory-core-host-runtime-files` | Helpers de fichier/d’exécution de l’hôte mémoire |
    | `plugin-sdk/memory-host-core` | Alias neutre vis-à-vis des fournisseurs pour les helpers d’exécution cœur de l’hôte mémoire |
    | `plugin-sdk/memory-host-events` | Alias neutre vis-à-vis des fournisseurs pour les helpers de journal d’événements de l’hôte mémoire |
    | `plugin-sdk/memory-host-files` | Alias neutre vis-à-vis des fournisseurs pour les helpers de fichier/d’exécution de l’hôte mémoire |
    | `plugin-sdk/memory-host-markdown` | Helpers partagés de markdown géré pour les plugins adjacents à la mémoire |
    | `plugin-sdk/memory-host-search` | Façade d’exécution Active Memory pour l’accès au gestionnaire de recherche |
    | `plugin-sdk/memory-host-status` | Alias neutre vis-à-vis des fournisseurs pour les helpers de statut de l’hôte mémoire |
  </Accordion>

  <Accordion title="Sous-chemins réservés de helpers groupés">
    Il n’existe actuellement aucun sous-chemin SDK réservé pour les helpers groupés. Les helpers propres à un propriétaire
    résident dans le package de plugin propriétaire, tandis que les contrats d’hôte réutilisables
    utilisent des sous-chemins SDK génériques, tels que `plugin-sdk/gateway-runtime`,
    `plugin-sdk/security-runtime` et `plugin-sdk/plugin-config-runtime`.
  </Accordion>
</AccordionGroup>

## Associés

- [Présentation du SDK de plugin](/fr/plugins/sdk-overview)
- [Configuration du SDK de plugin](/fr/plugins/sdk-setup)
- [Créer des plugins](/fr/plugins/building-plugins)
