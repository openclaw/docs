---
read_when:
    - Choisir le bon sous-chemin plugin-sdk pour un import de Plugin
    - Audit des sous-chemins de Plugins intégrés et des surfaces d’aide
summary: 'Catalogue des sous-chemins du SDK de Plugin : où se trouvent les importations, regroupées par domaine'
title: Sous-chemins du Plugin SDK
x-i18n:
    generated_at: "2026-05-02T21:01:07Z"
    model: gpt-5.5
    provider: openai
    source_hash: bc0d2dcf030796d2c73d4d679b9f8d7f6a8aaf71c6b5232b60afbbb50f42b348
    source_path: plugins/sdk-subpaths.md
    workflow: 16
---

  Le SDK de Plugin est exposé sous forme d’un ensemble de sous-chemins étroits sous `openclaw/plugin-sdk/`.
  Cette page répertorie les sous-chemins couramment utilisés, regroupés par objectif. La liste
  complète générée de plus de 200 sous-chemins se trouve dans `scripts/lib/plugin-sdk-entrypoints.json`;
  les sous-chemins d’assistance réservés aux plugins groupés y apparaissent, mais relèvent du détail
  d’implémentation sauf si une page de documentation les promeut explicitement. Les mainteneurs peuvent auditer les
  sous-chemins d’assistance réservés actifs avec `pnpm plugins:boundary-report:summary`; les exports
  d’assistance réservés inutilisés font échouer le rapport CI au lieu de rester dans le SDK public
  comme dette de compatibilité dormante.

  Pour le guide de création de plugins, consultez [Vue d’ensemble du SDK Plugin](/fr/plugins/sdk-overview).

  ## Entrée Plugin

  | Sous-chemin                               | Exports clés                                                                                                                                                                 |
  | ----------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
  | `plugin-sdk/plugin-entry`                 | `definePluginEntry`                                                                                                                                                          |
  | `plugin-sdk/core`                         | `defineChannelPluginEntry`, `createChatChannelPlugin`, `createChannelPluginBase`, `defineSetupPluginEntry`, `buildChannelConfigSchema`, `buildJsonChannelConfigSchema`       |
  | `plugin-sdk/config-schema`                | `OpenClawSchema`                                                                                                                                                             |
  | `plugin-sdk/provider-entry`               | `defineSingleProviderPluginEntry`                                                                                                                                            |
  | `plugin-sdk/testing`                      | Barrel de compatibilité large pour les anciens tests de plugins ; préférez les sous-chemins de test ciblés pour les nouveaux tests d’extensions                              |
  | `plugin-sdk/plugin-test-api`              | Générateur de mock `OpenClawPluginApi` minimal pour les tests unitaires d’enregistrement direct de plugins                                                                    |
  | `plugin-sdk/agent-runtime-test-contracts` | Fixtures de contrat d’adaptateur agent-runtime natif pour les profils d’authentification, la suppression de livraison, la classification de repli, les hooks d’outils, les superpositions de prompts, les schémas et la réparation de transcript |
  | `plugin-sdk/channel-test-helpers`         | Helpers de test pour le cycle de vie des comptes de canal, l’annuaire, la configuration d’envoi, le mock runtime, les hooks, l’entrée de canal groupé, l’horodatage d’enveloppe, la réponse d’appairage et les contrats de canal génériques |
  | `plugin-sdk/channel-target-testing`       | Suite de tests partagée des cas d’erreur de résolution de cible de canal                                                                                                      |
  | `plugin-sdk/plugin-test-contracts`        | Helpers de contrat pour l’enregistrement de plugins, le manifeste de package, l’artifact public, l’API runtime, les effets de bord d’import et l’import direct               |
  | `plugin-sdk/plugin-test-runtime`          | Fixtures de test pour le runtime de Plugin, le registre, l’enregistrement de fournisseurs, l’assistant de configuration et le flux de tâches runtime                          |
  | `plugin-sdk/provider-test-contracts`      | Helpers de contrat pour le runtime fournisseur, l’authentification, la découverte, l’intégration, le catalogue, les capacités médias, la politique de relecture, l’audio en direct STT temps réel, la recherche/récupération web et l’assistant |
  | `plugin-sdk/provider-http-test-mocks`     | Mocks HTTP/auth Vitest optionnels pour les tests de fournisseurs qui exercent `plugin-sdk/provider-http`                                                                      |
  | `plugin-sdk/test-env`                     | Fixtures d’environnement de test, fetch/réseau, serveur HTTP jetable, requête entrante, test en direct, système de fichiers temporaire et contrôle du temps                   |
  | `plugin-sdk/test-fixtures`                | Fixtures de test génériques pour CLI, bac à sable, skill, message d’agent, événement système, rechargement de module, chemin de plugin groupé, terminal, découpage en fragments, jeton d’authentification et cas typé |
  | `plugin-sdk/test-node-mocks`              | Helpers ciblés de mock des modules intégrés Node à utiliser dans les fabriques Vitest `vi.mock("node:*")`                                                                    |
  | `plugin-sdk/migration`                    | Helpers d’éléments de fournisseur de migration comme `createMigrationItem`, constantes de raison, marqueurs d’état d’élément, helpers de caviardage et `summarizeMigrationItems` |
  | `plugin-sdk/migration-runtime`            | Helpers de migration runtime comme `copyMigrationFileItem`, `withCachedMigrationConfigRuntime` et `writeMigrationReport`                                                     |

  <AccordionGroup>
  <Accordion title="Sous-chemins de canal">
    | Sous-chemin | Exports clés |
    | --- | --- |
    | `plugin-sdk/channel-core` | `defineChannelPluginEntry`, `defineSetupPluginEntry`, `createChatChannelPlugin`, `createChannelPluginBase` |
    | `plugin-sdk/config-schema` | Export du schéma Zod racine `openclaw.json` (`OpenClawSchema`) |
    | `plugin-sdk/channel-setup` | `createOptionalChannelSetupSurface`, `createOptionalChannelSetupAdapter`, `createOptionalChannelSetupWizard`, plus `DEFAULT_ACCOUNT_ID`, `createTopLevelChannelDmPolicy`, `setSetupChannelEnabled`, `splitSetupEntries` |
    | `plugin-sdk/setup` | Helpers partagés d’assistant de configuration, prompts de liste d’autorisation, générateurs d’état de configuration |
    | `plugin-sdk/setup-runtime` | `createPatchedAccountSetupAdapter`, `createEnvPatchedAccountSetupAdapter`, `createSetupInputPresenceValidator`, `noteChannelLookupFailure`, `noteChannelLookupSummary`, `promptResolvedAllowFrom`, `splitSetupEntries`, `createAllowlistSetupWizardProxy`, `createDelegatedSetupWizardProxy` |
    | `plugin-sdk/setup-adapter-runtime` | `createEnvPatchedAccountSetupAdapter` |
    | `plugin-sdk/setup-tools` | `formatCliCommand`, `detectBinary`, `extractArchive`, `resolveBrewExecutable`, `formatDocsLink`, `CONFIG_DIR` |
    | `plugin-sdk/account-core` | Helpers de configuration multi-comptes, de garde d’action et de repli vers le compte par défaut |
    | `plugin-sdk/account-id` | `DEFAULT_ACCOUNT_ID`, helpers de normalisation d’identifiants de compte |
    | `plugin-sdk/account-resolution` | Helpers de recherche de compte et de repli par défaut |
    | `plugin-sdk/account-helpers` | Helpers ciblés de liste de comptes et d’action de compte |
    | `plugin-sdk/channel-pairing` | `createChannelPairingController` |
    | `plugin-sdk/channel-reply-pipeline` | `createChannelReplyPipeline`, `resolveChannelSourceReplyDeliveryMode` |
    | `plugin-sdk/channel-config-helpers` | `createHybridChannelConfigAdapter`, `resolveChannelDmAccess`, `resolveChannelDmAllowFrom`, `resolveChannelDmPolicy`, `normalizeChannelDmPolicy`, `normalizeLegacyDmAliases` |
    | `plugin-sdk/channel-config-schema` | Primitives partagées de schéma de configuration de canal, plus générateurs Zod et JSON/TypeBox directs |
    | `plugin-sdk/bundled-channel-config-schema` | Schémas de configuration de canaux OpenClaw groupés, uniquement pour les plugins groupés maintenus |
    | `plugin-sdk/channel-config-schema-legacy` | Alias de compatibilité obsolète pour les schémas de configuration de canaux groupés |
    | `plugin-sdk/telegram-command-config` | Helpers de normalisation/validation des commandes personnalisées Telegram avec repli de contrat groupé |
    | `plugin-sdk/command-gating` | Helpers ciblés de garde d’autorisation de commandes |
    | `plugin-sdk/channel-policy` | `resolveChannelGroupRequireMention` |
    | `plugin-sdk/channel-lifecycle` | `createAccountStatusSink`, `createChannelRunQueue`, helpers de cycle de vie/finalisation des flux brouillons |
    | `plugin-sdk/inbound-envelope` | Helpers partagés de route entrante et de génération d’enveloppe |
    | `plugin-sdk/inbound-reply-dispatch` | Helpers partagés d’enregistrement et de dispatch entrants |
    | `plugin-sdk/messaging-targets` | Helpers d’analyse/correspondance de cibles |
    | `plugin-sdk/outbound-media` | Helpers partagés de chargement de médias sortants |
    | `plugin-sdk/outbound-send-deps` | Recherche légère de dépendances d’envoi sortant pour les adaptateurs de canal |
    | `plugin-sdk/outbound-runtime` | Helpers de livraison sortante, identité, délégué d’envoi, session, formatage et planification de payload |
    | `plugin-sdk/poll-runtime` | Helpers ciblés de normalisation de sondages |
    | `plugin-sdk/thread-bindings-runtime` | Helpers de cycle de vie et d’adaptateur pour les liaisons de threads |
    | `plugin-sdk/agent-media-payload` | Générateur hérité de payload média d’agent |
    | `plugin-sdk/conversation-runtime` | Helpers de conversation/liaison de thread, d’appairage et de liaison configurée |
    | `plugin-sdk/runtime-config-snapshot` | Helper d’instantané de configuration runtime |
    | `plugin-sdk/runtime-group-policy` | Helpers de résolution de politique de groupe runtime |
    | `plugin-sdk/channel-status` | Helpers partagés d’instantané/résumé d’état de canal |
    | `plugin-sdk/channel-config-primitives` | Primitives ciblées de schéma de configuration de canal |
    | `plugin-sdk/channel-config-writes` | Helpers d’autorisation d’écriture de configuration de canal |
    | `plugin-sdk/channel-plugin-common` | Exports partagés de préambule de Plugin de canal |
    | `plugin-sdk/allowlist-config-edit` | Helpers de modification/lecture de configuration de liste d’autorisation |
    | `plugin-sdk/group-access` | Helpers partagés de décision d’accès de groupe |
    | `plugin-sdk/direct-dm` | Helpers partagés d’authentification/garde pour DM direct |
    | `plugin-sdk/discord` | Façade de compatibilité Discord obsolète pour `@openclaw/discord@2026.3.13` publié et la compatibilité propriétaire suivie ; les nouveaux plugins doivent utiliser les sous-chemins génériques du SDK de canal |
    | `plugin-sdk/telegram-account` | Façade de compatibilité de résolution de compte Telegram obsolète pour la compatibilité propriétaire suivie ; les nouveaux plugins doivent utiliser les helpers runtime injectés ou les sous-chemins génériques du SDK de canal |
    | `plugin-sdk/zalouser` | Façade de compatibilité Zalo Personal obsolète pour les packages Lark/Zalo publiés qui importent encore l’autorisation des commandes d’expéditeur ; les nouveaux plugins doivent utiliser `plugin-sdk/command-auth` |
    | `plugin-sdk/interactive-runtime` | Helpers sémantiques de présentation et de livraison de messages, et de réponses interactives héritées. Consultez [Présentation des messages](/fr/plugins/message-presentation) |
    | `plugin-sdk/channel-inbound` | Barrel de compatibilité pour l’anti-rebond entrant, la correspondance des mentions, les helpers de politique de mention et les helpers d’enveloppe |
    | `plugin-sdk/channel-inbound-debounce` | Helpers ciblés d’anti-rebond entrant |
    | `plugin-sdk/channel-mention-gating` | Helpers ciblés de politique de mention, marqueur de mention et texte de mention, sans la surface runtime entrante plus large |
    | `plugin-sdk/channel-envelope` | Helpers ciblés de formatage d’enveloppe entrante |
    | `plugin-sdk/channel-location` | Helpers de contexte et de formatage de localisation de canal |
    | `plugin-sdk/channel-logging` | Helpers de journalisation de canal pour les abandons entrants et les échecs de saisie/accusé de réception |
    | `plugin-sdk/channel-send-result` | Types de résultat de réponse |
    | `plugin-sdk/channel-actions` | Helpers d’actions de message de canal, plus helpers de schéma natifs obsolètes conservés pour la compatibilité des plugins |
    | `plugin-sdk/channel-route` | Helpers partagés de normalisation de route, résolution de cible pilotée par analyseur, conversion d’identifiant de thread en chaîne, clés de route dédupliquées/compactes, types de cible analysée et comparaison route/cible |
    | `plugin-sdk/channel-targets` | Helpers d’analyse de cible ; les appelants de comparaison de routes doivent utiliser `plugin-sdk/channel-route` |
    | `plugin-sdk/channel-contract` | Types de contrat de canal |
    | `plugin-sdk/channel-feedback` | Câblage des retours/réactions |
    | `plugin-sdk/channel-secret-runtime` | Helpers ciblés de contrat de secret comme `collectSimpleChannelFieldAssignments`, `getChannelSurface`, `pushAssignment` et types de cibles de secret |
  </Accordion>

  <Accordion title="Sous-chemins de fournisseur">
    | Sous-chemin | Exportations clés |
    | --- | --- |
    | `plugin-sdk/provider-entry` | `defineSingleProviderPluginEntry` |
    | `plugin-sdk/lmstudio` | Façade de fournisseur LM Studio prise en charge pour la configuration, la découverte de catalogue et la préparation des modèles à l’exécution |
    | `plugin-sdk/lmstudio-runtime` | Façade d’exécution LM Studio prise en charge pour les valeurs par défaut du serveur local, la découverte des modèles, les en-têtes de requête et les assistants de modèles chargés |
    | `plugin-sdk/provider-setup` | Assistants organisés de configuration de fournisseurs locaux/auto-hébergés |
    | `plugin-sdk/self-hosted-provider-setup` | Assistants ciblés de configuration de fournisseurs auto-hébergés compatibles OpenAI |
    | `plugin-sdk/cli-backend` | Valeurs par défaut du backend CLI + constantes de surveillance |
    | `plugin-sdk/provider-auth-runtime` | Assistants de résolution des clés d’API à l’exécution pour les plugins de fournisseur |
    | `plugin-sdk/provider-auth-api-key` | Assistants d’intégration/d’écriture de profil pour clé d’API, tels que `upsertApiKeyProfile` |
    | `plugin-sdk/provider-auth-result` | Constructeur standard de résultat d’authentification OAuth |
    | `plugin-sdk/provider-auth-login` | Assistants de connexion interactive partagés pour les plugins de fournisseur |
    | `plugin-sdk/provider-env-vars` | Assistants de recherche de variables d’environnement d’authentification de fournisseur |
    | `plugin-sdk/provider-auth` | `createProviderApiKeyAuthMethod`, `ensureApiKeyFromOptionEnvOrPrompt`, `upsertAuthProfile`, `upsertApiKeyProfile`, `writeOAuthCredentials` |
    | `plugin-sdk/provider-model-shared` | `ProviderReplayFamily`, `buildProviderReplayFamilyHooks`, `normalizeModelCompat`, constructeurs partagés de politiques de relecture, assistants de points de terminaison de fournisseur et assistants de normalisation d’identifiants de modèle tels que `normalizeNativeXaiModelId` |
    | `plugin-sdk/provider-catalog-runtime` | Hook d’exécution d’augmentation du catalogue de fournisseur et jonctions de registre plugin-fournisseur pour les tests de contrat |
    | `plugin-sdk/provider-catalog-shared` | `findCatalogTemplate`, `buildSingleProviderApiKeyCatalog`, `buildManifestModelProviderConfig`, `supportsNativeStreamingUsageCompat`, `applyProviderNativeStreamingUsageCompat` |
    | `plugin-sdk/provider-http` | Assistants génériques de capacités HTTP/point de terminaison de fournisseur, erreurs HTTP de fournisseur et assistants de formulaire multipart pour transcription audio |
    | `plugin-sdk/provider-web-fetch-contract` | Assistants de contrat étroits pour la configuration/sélection de récupération web, tels que `enablePluginInConfig` et `WebFetchProviderPlugin` |
    | `plugin-sdk/provider-web-fetch` | Assistants d’enregistrement/de cache de fournisseur de récupération web |
    | `plugin-sdk/provider-web-search-config-contract` | Assistants de configuration/identifiants étroits pour la recherche web destinés aux fournisseurs qui n’ont pas besoin de câblage d’activation de plugin |
    | `plugin-sdk/provider-web-search-contract` | Assistants de contrat étroits pour la configuration/les identifiants de recherche web, tels que `createWebSearchProviderContractFields`, `enablePluginInConfig`, `resolveProviderWebSearchPluginConfig`, ainsi que les accesseurs et modificateurs d’identifiants à portée limitée |
    | `plugin-sdk/provider-web-search` | Assistants d’enregistrement/de cache/d’exécution de fournisseur de recherche web |
    | `plugin-sdk/provider-tools` | `ProviderToolCompatFamily`, `buildProviderToolCompatFamilyHooks`, nettoyage de schéma Gemini + diagnostics et assistants de compatibilité xAI tels que `resolveXaiModelCompatPatch` / `applyXaiModelCompat` |
    | `plugin-sdk/provider-usage` | `fetchClaudeUsage` et similaires |
    | `plugin-sdk/provider-stream` | `ProviderStreamFamily`, `buildProviderStreamFamilyHooks`, `composeProviderStreamWrappers`, types d’enveloppes de flux et assistants d’enveloppes partagés Anthropic/Bedrock/DeepSeek V4/Google/Kilocode/Moonshot/OpenAI/OpenRouter/Z.A.I/MiniMax/Copilot |
    | `plugin-sdk/provider-transport-runtime` | Assistants de transport de fournisseur natif, tels que la récupération protégée, les transformations de messages de transport et les flux d’événements de transport inscriptibles |
    | `plugin-sdk/provider-onboard` | Assistants de correctifs de configuration d’intégration |
    | `plugin-sdk/global-singleton` | Assistants de singleton/map/cache locaux au processus |
    | `plugin-sdk/group-activation` | Assistants étroits de mode d’activation de groupe et d’analyse de commandes |
  </Accordion>

  <Accordion title="Sous-chemins d’authentification et de sécurité">
    | Sous-chemin | Exportations clés |
    | --- | --- |
    | `plugin-sdk/command-auth` | `resolveControlCommandGate`, assistants de registre de commandes incluant le formatage dynamique de menus d’arguments, assistants d’autorisation d’expéditeur |
    | `plugin-sdk/command-status` | Constructeurs de messages de commande/d’aide tels que `buildCommandsMessagePaginated` et `buildHelpMessage` |
    | `plugin-sdk/approval-auth-runtime` | Assistants de résolution d’approbateur et d’authentification d’action dans la même discussion |
    | `plugin-sdk/approval-client-runtime` | Assistants natifs de profils/filtres d’approbation exec |
    | `plugin-sdk/approval-delivery-runtime` | Adaptateurs natifs de capacité/livraison d’approbation |
    | `plugin-sdk/approval-gateway-runtime` | Assistant partagé de résolution de Gateway d’approbation |
    | `plugin-sdk/approval-handler-adapter-runtime` | Assistants légers de chargement d’adaptateur d’approbation natif pour les points d’entrée de canal sensibles aux performances |
    | `plugin-sdk/approval-handler-runtime` | Assistants d’exécution plus larges pour les gestionnaires d’approbation ; préférez les jonctions d’adaptateur/Gateway plus étroites lorsqu’elles suffisent |
    | `plugin-sdk/approval-native-runtime` | Assistants natifs de cible d’approbation + liaison de compte |
    | `plugin-sdk/approval-reply-runtime` | Assistants de charges utiles de réponse d’approbation exec/plugin |
    | `plugin-sdk/approval-runtime` | Assistants de charges utiles d’approbation exec/plugin, assistants natifs de routage/exécution d’approbation et assistants d’affichage structuré d’approbation tels que `formatApprovalDisplayPath` |
    | `plugin-sdk/reply-dedupe` | Assistants étroits de réinitialisation de déduplication des réponses entrantes |
    | `plugin-sdk/channel-contract-testing` | Assistants étroits de tests de contrat de canal sans le large module de test |
    | `plugin-sdk/command-auth-native` | Authentification de commande native, formatage dynamique de menus d’arguments et assistants natifs de ciblage de session |
    | `plugin-sdk/command-detection` | Assistants partagés de détection de commandes |
    | `plugin-sdk/command-primitives-runtime` | Prédicats légers de texte de commande pour les chemins de canal sensibles aux performances |
    | `plugin-sdk/command-surface` | Assistants de normalisation du corps de commande et de surface de commande |
    | `plugin-sdk/allow-from` | `formatAllowFromLowercase` |
    | `plugin-sdk/channel-secret-runtime` | Assistants étroits de collecte de contrats de secrets pour les surfaces de secrets de canal/plugin |
    | `plugin-sdk/secret-ref-runtime` | Assistants étroits de typage `coerceSecretRef` et SecretRef pour l’analyse de contrats/configurations de secrets |
    | `plugin-sdk/security-runtime` | Assistants partagés de confiance, filtrage des messages privés, contenu externe, masquage de texte sensible, comparaison de secrets en temps constant et collecte de secrets |
    | `plugin-sdk/ssrf-policy` | Assistants de liste d’autorisation d’hôtes et de politique SSRF de réseau privé |
    | `plugin-sdk/ssrf-dispatcher` | Assistants étroits de répartiteur épinglé sans la large surface d’exécution d’infrastructure |
    | `plugin-sdk/ssrf-runtime` | Assistants de répartiteur épinglé, récupération protégée contre SSRF, erreur SSRF et politique SSRF |
    | `plugin-sdk/secret-input` | Assistants d’analyse de saisie de secrets |
    | `plugin-sdk/webhook-ingress` | Assistants de requêtes/cibles Webhook et coercition brute websocket/corps |
    | `plugin-sdk/webhook-request-guards` | Assistants de taille/délai d’expiration du corps de requête |
  </Accordion>

  <Accordion title="Sous-chemins du runtime et du stockage">
    | Sous-chemin | Exports clés |
    | --- | --- |
    | `plugin-sdk/runtime` | Helpers généraux de runtime, de journalisation, de sauvegarde et d’installation de Plugin |
    | `plugin-sdk/runtime-env` | Helpers ciblés d’environnement de runtime, de journalisation, de délai d’expiration, de nouvelle tentative et de temporisation progressive |
    | `plugin-sdk/browser-config` | Façade de configuration de navigateur prise en charge pour le profil et les valeurs par défaut normalisés, l’analyse d’URL CDP et les helpers d’authentification de contrôle du navigateur |
    | `plugin-sdk/channel-runtime-context` | Helpers génériques d’enregistrement et de recherche du contexte de runtime de canal |
    | `plugin-sdk/runtime-store` | `createPluginRuntimeStore` |
    | `plugin-sdk/plugin-runtime` | Helpers partagés de commande, hook, HTTP et interactifs de Plugin |
    | `plugin-sdk/hook-runtime` | Helpers partagés de pipeline Webhook/hook interne |
    | `plugin-sdk/lazy-runtime` | Helpers d’importation et de liaison différés du runtime, tels que `createLazyRuntimeModule`, `createLazyRuntimeMethod` et `createLazyRuntimeSurface` |
    | `plugin-sdk/process-runtime` | Helpers d’exécution de processus |
    | `plugin-sdk/cli-runtime` | Helpers de formatage CLI, d’attente, de version, d’invocation d’arguments et de groupe de commandes différé |
    | `plugin-sdk/gateway-runtime` | Client Gateway, helper de démarrage du client prêt pour la boucle d’événements, RPC CLI de Gateway, erreurs de protocole Gateway et helpers de correctif de statut de canal |
    | `plugin-sdk/config-types` | Surface de configuration uniquement typée pour les formes de configuration de Plugin, telles que `OpenClawConfig` et les types de configuration de canal/fournisseur |
    | `plugin-sdk/plugin-config-runtime` | Helpers de recherche de configuration de Plugin au runtime, tels que `requireRuntimeConfig`, `resolvePluginConfigObject` et `resolveLivePluginConfigObject` |
    | `plugin-sdk/config-mutation` | Helpers de mutation transactionnelle de configuration, tels que `mutateConfigFile`, `replaceConfigFile` et `logConfigUpdated` |
    | `plugin-sdk/runtime-config-snapshot` | Helpers d’instantané de configuration du processus courant, tels que `getRuntimeConfig`, `getRuntimeConfigSnapshot` et les setters d’instantané de test |
    | `plugin-sdk/telegram-command-config` | Normalisation des noms et descriptions de commandes Telegram et vérifications de doublons/conflits, même lorsque la surface de contrat Telegram intégrée n’est pas disponible |
    | `plugin-sdk/text-autolink-runtime` | Détection de liens automatiques de références de fichiers sans le barrel text-runtime général |
    | `plugin-sdk/approval-runtime` | Helpers d’approbation d’exécution/Plugin, constructeurs de capacités d’approbation, helpers d’authentification/profil, helpers de routage/runtime natif et formatage du chemin d’affichage d’approbation structuré |
    | `plugin-sdk/reply-runtime` | Helpers de runtime partagés d’entrée/réponse, découpage, distribution, Heartbeat, planificateur de réponse |
    | `plugin-sdk/reply-dispatch-runtime` | Helpers ciblés de distribution/finalisation de réponse et d’étiquette de conversation |
    | `plugin-sdk/reply-history` | Helpers et marqueurs partagés d’historique de réponse à fenêtre courte, tels que `buildHistoryContext`, `HISTORY_CONTEXT_MARKER`, `recordPendingHistoryEntry` et `clearHistoryEntriesIfEnabled` |
    | `plugin-sdk/reply-reference` | `createReplyReferencePlanner` |
    | `plugin-sdk/reply-chunking` | Helpers ciblés de découpage texte/Markdown |
    | `plugin-sdk/session-store-runtime` | Helpers de chemin de magasin de sessions, de clé de session, de date de mise à jour et de mutation de magasin |
    | `plugin-sdk/cron-store-runtime` | Helpers de chemin/chargement/enregistrement du magasin Cron |
    | `plugin-sdk/state-paths` | Helpers de chemins de répertoire d’état/OAuth |
    | `plugin-sdk/routing` | Helpers de route, clé de session et liaison de compte, tels que `resolveAgentRoute`, `buildAgentSessionKey` et `resolveDefaultAgentBoundAccountId` |
    | `plugin-sdk/status-helpers` | Helpers partagés de résumé de statut de canal/compte, valeurs par défaut d’état runtime et helpers de métadonnées de problème |
    | `plugin-sdk/target-resolver-runtime` | Helpers partagés de résolution de cible |
    | `plugin-sdk/string-normalization-runtime` | Helpers de normalisation de slug/chaîne |
    | `plugin-sdk/request-url` | Extraire les URL sous forme de chaînes depuis des entrées de type fetch/request |
    | `plugin-sdk/run-command` | Exécuteur de commandes temporisé avec résultats stdout/stderr normalisés |
    | `plugin-sdk/param-readers` | Lecteurs courants de paramètres d’outil/CLI |
    | `plugin-sdk/tool-payload` | Extraire des charges utiles normalisées depuis les objets de résultat d’outil |
    | `plugin-sdk/tool-send` | Extraire les champs cibles d’envoi canoniques depuis les arguments d’outil |
    | `plugin-sdk/temp-path` | Helpers partagés de chemins de téléchargement temporaire |
    | `plugin-sdk/logging-core` | Helpers de journalisation de sous-système et de caviardage |
    | `plugin-sdk/markdown-table-runtime` | Helpers de mode et de conversion de tableaux Markdown |
    | `plugin-sdk/model-session-runtime` | Helpers de remplacement de modèle/session, tels que `applyModelOverrideToSessionEntry` et `resolveAgentMaxConcurrent` |
    | `plugin-sdk/talk-config-runtime` | Helpers de résolution de configuration du fournisseur de discussion |
    | `plugin-sdk/json-store` | Petits helpers de lecture/écriture d’état JSON |
    | `plugin-sdk/file-lock` | Helpers de verrouillage de fichier réentrants |
    | `plugin-sdk/persistent-dedupe` | Helpers de cache de déduplication sauvegardé sur disque |
    | `plugin-sdk/acp-runtime` | Helpers de runtime/session ACP et de distribution de réponses |
    | `plugin-sdk/acp-runtime-backend` | Helpers légers d’enregistrement de backend ACP et de distribution de réponses pour les plugins chargés au démarrage |
    | `plugin-sdk/acp-binding-resolve-runtime` | Résolution en lecture seule des liaisons ACP sans imports de démarrage du cycle de vie |
    | `plugin-sdk/agent-config-primitives` | Primitives ciblées de schéma de configuration de runtime d’agent |
    | `plugin-sdk/boolean-param` | Lecteur souple de paramètre booléen |
    | `plugin-sdk/dangerous-name-runtime` | Helpers de résolution de correspondance de noms dangereux |
    | `plugin-sdk/device-bootstrap` | Helpers d’amorçage d’appareil et de jeton d’appairage |
    | `plugin-sdk/extension-shared` | Primitives partagées de canal passif, de statut et de helper de proxy ambiant |
    | `plugin-sdk/models-provider-runtime` | Helpers de réponse de commande/fournisseur `/models` |
    | `plugin-sdk/skill-commands-runtime` | Helpers de listage des commandes Skills |
    | `plugin-sdk/native-command-registry` | Helpers de registre, construction et sérialisation de commandes natives |
    | `plugin-sdk/agent-harness` | Surface expérimentale de Plugin de confiance pour harnais d’agent bas niveau : types de harnais, helpers de pilotage/abandon d’exécution active, helpers de pont d’outils OpenClaw, helpers de politique d’outils de plan runtime, classification des résultats de terminal, helpers de formatage/détail de progression d’outil et utilitaires de résultat de tentative |
    | `plugin-sdk/provider-zai-endpoint` | Helpers de détection de point de terminaison Z.AI |
    | `plugin-sdk/async-lock-runtime` | Helper de verrouillage asynchrone local au processus pour petits fichiers d’état runtime |
    | `plugin-sdk/channel-activity-runtime` | Helper de télémétrie d’activité de canal |
    | `plugin-sdk/concurrency-runtime` | Helper de concurrence bornée de tâches asynchrones |
    | `plugin-sdk/dedupe-runtime` | Helpers de cache de déduplication en mémoire |
    | `plugin-sdk/delivery-queue-runtime` | Helper de vidage des livraisons sortantes en attente |
    | `plugin-sdk/file-access-runtime` | Helpers sûrs de chemins de fichiers locaux et de sources média |
    | `plugin-sdk/heartbeat-runtime` | Helpers d’événements et de visibilité Heartbeat |
    | `plugin-sdk/number-runtime` | Helper de coercition numérique |
    | `plugin-sdk/secure-random-runtime` | Helpers de jetons/UUID sécurisés |
    | `plugin-sdk/system-event-runtime` | Helpers de file d’événements système |
    | `plugin-sdk/transport-ready-runtime` | Helper d’attente de disponibilité du transport |
    | `plugin-sdk/infra-runtime` | Shim de compatibilité obsolète ; utilisez les sous-chemins de runtime ciblés ci-dessus |
    | `plugin-sdk/collection-runtime` | Petits helpers de cache borné |
    | `plugin-sdk/diagnostic-runtime` | Helpers d’indicateur de diagnostic, d’événement et de contexte de trace |
    | `plugin-sdk/error-runtime` | Helpers de graphe d’erreurs, de formatage et de classification partagée des erreurs, `isApprovalNotFoundError` |
    | `plugin-sdk/fetch-runtime` | Helpers de fetch enveloppé, de proxy, d’option EnvHttpProxyAgent et de recherche épinglée |
    | `plugin-sdk/runtime-fetch` | Fetch runtime compatible avec les répartiteurs sans imports de proxy/fetch protégé |
    | `plugin-sdk/response-limit-runtime` | Lecteur borné de corps de réponse sans la surface media-runtime générale |
    | `plugin-sdk/session-binding-runtime` | État courant de liaison de conversation sans routage de liaison configuré ni magasins d’appairage |
    | `plugin-sdk/session-store-runtime` | Helpers de magasin de sessions sans imports généraux d’écritures/maintenance de configuration |
    | `plugin-sdk/context-visibility-runtime` | Résolution de visibilité du contexte et filtrage du contexte supplémentaire sans imports généraux de configuration/sécurité |
    | `plugin-sdk/string-coerce-runtime` | Helpers ciblés de coercition et de normalisation d’enregistrements primitifs/chaînes sans imports Markdown/journalisation |
    | `plugin-sdk/host-runtime` | Helpers de normalisation de noms d’hôte et d’hôtes SCP |
    | `plugin-sdk/retry-runtime` | Helpers de configuration des nouvelles tentatives et d’exécution des nouvelles tentatives |
    | `plugin-sdk/agent-runtime` | Helpers de répertoire, d’identité et d’espace de travail d’agent |
    | `plugin-sdk/directory-runtime` | Requête/déduplication de répertoire fondée sur la configuration |
    | `plugin-sdk/keyed-async-queue` | `KeyedAsyncQueue` |
  </Accordion>

  <Accordion title="Sous-chemins de capacités et de tests">
    | Sous-chemin | Exports principaux |
    | --- | --- |
    | `plugin-sdk/media-runtime` | Helpers partagés de récupération/transformation/stockage de médias, sondage des dimensions vidéo basé sur ffprobe et constructeurs de charges utiles multimédias |
    | `plugin-sdk/media-store` | Helpers ciblés de stockage multimédia comme `saveMediaBuffer` |
    | `plugin-sdk/media-generation-runtime` | Helpers partagés de basculement pour la génération multimédia, sélection de candidats et messages de modèle manquant |
    | `plugin-sdk/media-understanding` | Types de fournisseurs de compréhension multimédia, ainsi qu’exports de helpers image/audio destinés aux fournisseurs |
    | `plugin-sdk/text-runtime` | Helpers partagés de texte/markdown/journalisation, comme la suppression du texte visible par l’assistant, les helpers de rendu/découpage/tableaux Markdown, les helpers de caviardage, les helpers de balises de directive et les utilitaires de texte sûr |
    | `plugin-sdk/text-chunking` | Helper de découpage du texte sortant |
    | `plugin-sdk/speech` | Types de fournisseurs vocaux, ainsi qu’exports de directive, registre, validation, constructeur TTS compatible OpenAI et helpers vocaux destinés aux fournisseurs |
    | `plugin-sdk/speech-core` | Types partagés de fournisseurs vocaux, registre, directive, normalisation et exports de helpers vocaux |
    | `plugin-sdk/realtime-transcription` | Types de fournisseurs de transcription en temps réel, helpers de registre et helper partagé de session WebSocket |
    | `plugin-sdk/realtime-voice` | Types de fournisseurs vocaux en temps réel et helpers de registre |
    | `plugin-sdk/image-generation` | Types de fournisseurs de génération d’images, helpers d’URL de données/ressources image et constructeur de fournisseur d’images compatible OpenAI |
    | `plugin-sdk/image-generation-core` | Types partagés de génération d’images, helpers de basculement, d’authentification et de registre |
    | `plugin-sdk/music-generation` | Types de fournisseur/requête/résultat pour la génération musicale |
    | `plugin-sdk/music-generation-core` | Types partagés de génération musicale, helpers de basculement, recherche de fournisseur et analyse de référence de modèle |
    | `plugin-sdk/video-generation` | Types de fournisseur/requête/résultat pour la génération vidéo |
    | `plugin-sdk/video-generation-core` | Types partagés de génération vidéo, helpers de basculement, recherche de fournisseur et analyse de référence de modèle |
    | `plugin-sdk/webhook-targets` | Registre de cibles Webhook et helpers d’installation de routes |
    | `plugin-sdk/webhook-path` | Helpers de normalisation de chemins Webhook |
    | `plugin-sdk/web-media` | Helpers partagés de chargement de médias distants/locaux |
    | `plugin-sdk/zod` | `zod` réexporté pour les consommateurs du SDK de Plugin |
    | `plugin-sdk/testing` | Barrel de compatibilité large pour les anciens tests de Plugin. Les nouveaux tests d’extension doivent plutôt importer des sous-chemins SDK ciblés comme `plugin-sdk/agent-runtime-test-contracts`, `plugin-sdk/plugin-test-runtime`, `plugin-sdk/channel-test-helpers`, `plugin-sdk/test-env` ou `plugin-sdk/test-fixtures` |
    | `plugin-sdk/plugin-test-api` | Helper minimal `createTestPluginApi` pour les tests unitaires d’enregistrement direct de Plugin sans importer les passerelles de helpers de test du dépôt |
    | `plugin-sdk/agent-runtime-test-contracts` | Fixtures natives de contrat d’adaptateur d’exécution d’agent pour les tests d’authentification, de livraison, de repli, de hook d’outil, de superposition de prompt, de schéma et de projection de transcription |
    | `plugin-sdk/channel-test-helpers` | Helpers de test orientés canal pour les contrats génériques d’actions/configuration/état, les assertions de répertoire, le cycle de vie de démarrage de compte, le threading de configuration d’envoi, les mocks d’exécution, les problèmes d’état, la livraison sortante et l’enregistrement de hooks |
    | `plugin-sdk/channel-target-testing` | Suite partagée de cas d’erreur de résolution de cible pour les tests de canal |
    | `plugin-sdk/plugin-test-contracts` | Helpers de contrats pour le paquet Plugin, l’enregistrement, les artefacts publics, l’import direct, l’API d’exécution et les effets de bord d’import |
    | `plugin-sdk/provider-test-contracts` | Helpers de contrats pour l’exécution fournisseur, l’authentification, la découverte, l’intégration, le catalogue, l’assistant, les capacités multimédias, la politique de rejeu, l’audio en direct STT en temps réel, la recherche/récupération web et les flux |
    | `plugin-sdk/provider-http-test-mocks` | Mocks HTTP/auth Vitest optionnels pour les tests de fournisseur qui exercent `plugin-sdk/provider-http` |
    | `plugin-sdk/test-fixtures` | Fixtures génériques de capture d’exécution CLI, contexte de sandbox, rédacteur de Skill, message d’agent, événement système, rechargement de module, chemin de Plugin groupé, texte de terminal, découpage, jeton d’authentification et cas typés |
    | `plugin-sdk/test-node-mocks` | Helpers ciblés de mock des modules intégrés Node à utiliser dans les factories Vitest `vi.mock("node:*")` |
  </Accordion>

  <Accordion title="Sous-chemins de mémoire">
    | Sous-chemin | Exports principaux |
    | --- | --- |
    | `plugin-sdk/memory-core` | Surface groupée de helpers memory-core pour les helpers de gestionnaire/configuration/fichier/CLI |
    | `plugin-sdk/memory-core-engine-runtime` | Façade d’exécution d’indexation/recherche mémoire |
    | `plugin-sdk/memory-core-host-engine-foundation` | Exports du moteur de fondation de l’hôte mémoire |
    | `plugin-sdk/memory-core-host-engine-embeddings` | Contrats d’embeddings de l’hôte mémoire, accès au registre, fournisseur local et helpers génériques de traitement par lots/distant |
    | `plugin-sdk/memory-core-host-engine-qmd` | Exports du moteur QMD de l’hôte mémoire |
    | `plugin-sdk/memory-core-host-engine-storage` | Exports du moteur de stockage de l’hôte mémoire |
    | `plugin-sdk/memory-core-host-multimodal` | Helpers multimodaux de l’hôte mémoire |
    | `plugin-sdk/memory-core-host-query` | Helpers de requête de l’hôte mémoire |
    | `plugin-sdk/memory-core-host-secret` | Helpers de secrets de l’hôte mémoire |
    | `plugin-sdk/memory-core-host-events` | Helpers de journal d’événements de l’hôte mémoire |
    | `plugin-sdk/memory-core-host-status` | Helpers d’état de l’hôte mémoire |
    | `plugin-sdk/memory-core-host-runtime-cli` | Helpers d’exécution CLI de l’hôte mémoire |
    | `plugin-sdk/memory-core-host-runtime-core` | Helpers d’exécution cœur de l’hôte mémoire |
    | `plugin-sdk/memory-core-host-runtime-files` | Helpers de fichiers/d’exécution de l’hôte mémoire |
    | `plugin-sdk/memory-host-core` | Alias indépendant du fournisseur pour les helpers d’exécution cœur de l’hôte mémoire |
    | `plugin-sdk/memory-host-events` | Alias indépendant du fournisseur pour les helpers de journal d’événements de l’hôte mémoire |
    | `plugin-sdk/memory-host-files` | Alias indépendant du fournisseur pour les helpers de fichiers/d’exécution de l’hôte mémoire |
    | `plugin-sdk/memory-host-markdown` | Helpers partagés de Markdown géré pour les plugins proches de la mémoire |
    | `plugin-sdk/memory-host-search` | Façade d’exécution de mémoire active pour l’accès au gestionnaire de recherche |
    | `plugin-sdk/memory-host-status` | Alias indépendant du fournisseur pour les helpers d’état de l’hôte mémoire |
  </Accordion>

  <Accordion title="Sous-chemins réservés de helpers groupés">
    Il n’existe actuellement aucun sous-chemin SDK réservé de helpers groupés. Les helpers propres à un propriétaire résident dans le paquet Plugin propriétaire, tandis que les contrats d’hôte réutilisables utilisent des sous-chemins SDK génériques comme `plugin-sdk/gateway-runtime`,
    `plugin-sdk/security-runtime` et `plugin-sdk/plugin-config-runtime`.
  </Accordion>
</AccordionGroup>

## Articles connexes

- [Vue d’ensemble du SDK de Plugin](/fr/plugins/sdk-overview)
- [Configuration du SDK de Plugin](/fr/plugins/sdk-setup)
- [Créer des plugins](/fr/plugins/building-plugins)
