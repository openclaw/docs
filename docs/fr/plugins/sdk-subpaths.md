---
read_when:
    - Choisir le bon sous-chemin plugin-sdk pour un import de Plugin
    - Audit des sous-chemins des Plugins intégrés et des surfaces auxiliaires
summary: 'Catalogue des sous-chemins du SDK de Plugin : quelles importations se trouvent où, regroupées par domaine'
title: Sous-chemins du SDK Plugin
x-i18n:
    generated_at: "2026-04-30T07:41:42Z"
    model: gpt-5.5
    provider: openai
    source_hash: 6a8c431c1835fff6720a00984171e3f55886363654074d81859f50ca28a35104
    source_path: plugins/sdk-subpaths.md
    workflow: 16
---

  Le SDK de Plugin est exposé sous forme d’un ensemble de sous-chemins restreints sous `openclaw/plugin-sdk/`.
  Cette page répertorie les sous-chemins couramment utilisés, regroupés par objectif. La liste complète générée des 200+ sous-chemins se trouve dans `scripts/lib/plugin-sdk-entrypoints.json` ;
  les sous-chemins d’assistants réservés aux Plugins intégrés y apparaissent, mais relèvent d’un détail d’implémentation, sauf si une page de documentation les promeut explicitement. Les mainteneurs peuvent auditer les sous-chemins d’assistants réservés actifs avec `pnpm plugins:boundary-report:summary` ; les exports d’assistants réservés inutilisés font échouer le rapport CI au lieu de rester dans le SDK public comme dette de compatibilité dormante.

  Pour le guide de création de Plugins, consultez [Vue d’ensemble du SDK de Plugin](/fr/plugins/sdk-overview).

  ## Entrée de Plugin

  | Sous-chemin                               | Exports clés                                                                                                                                                                 |
  | ----------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
  | `plugin-sdk/plugin-entry`                 | `definePluginEntry`                                                                                                                                                          |
  | `plugin-sdk/core`                         | `defineChannelPluginEntry`, `createChatChannelPlugin`, `createChannelPluginBase`, `defineSetupPluginEntry`, `buildChannelConfigSchema`                                       |
  | `plugin-sdk/config-schema`                | `OpenClawSchema`                                                                                                                                                             |
  | `plugin-sdk/provider-entry`               | `defineSingleProviderPluginEntry`                                                                                                                                            |
  | `plugin-sdk/testing`                      | Barrel de compatibilité large pour les tests de Plugins hérités ; privilégiez les sous-chemins de test ciblés pour les nouveaux tests d’extension                            |
  | `plugin-sdk/plugin-test-api`              | Générateur de mock `OpenClawPluginApi` minimal pour les tests unitaires d’enregistrement direct de Plugin                                                                     |
  | `plugin-sdk/agent-runtime-test-contracts` | Fixtures de contrat d’adaptateur natif agent-runtime pour les profils d’authentification, la suppression de livraison, la classification de repli, les hooks d’outils, les superpositions de prompt, les schémas et la réparation de transcription |
  | `plugin-sdk/channel-test-helpers`         | Assistants de test de cycle de vie de compte de canal, d’annuaire, de configuration d’envoi, de mock d’exécution, de hook, d’entrée de canal intégré, d’horodatage d’enveloppe, de réponse d’appairage et de contrat de canal générique |
  | `plugin-sdk/channel-target-testing`       | Suite de tests partagée pour les cas d’erreur de résolution de cible de canal                                                                                                |
  | `plugin-sdk/plugin-test-contracts`        | Assistants de contrat pour l’enregistrement de Plugin, le manifeste de paquet, l’artefact public, l’API d’exécution, les effets de bord d’importation et l’importation directe |
  | `plugin-sdk/plugin-test-runtime`          | Fixtures de tests pour l’exécution de Plugin, le registre, l’enregistrement de fournisseur, l’assistant de configuration et le flux de tâches d’exécution                    |
  | `plugin-sdk/provider-test-contracts`      | Assistants de contrat pour l’exécution de fournisseur, l’authentification, la découverte, l’onboarding, le catalogue, les capacités média, la politique de relecture, l’audio en direct STT temps réel, la recherche/récupération web et l’assistant |
  | `plugin-sdk/provider-http-test-mocks`     | Mocks HTTP/auth Vitest opt-in pour les tests de fournisseurs qui exercent `plugin-sdk/provider-http`                                                                          |
  | `plugin-sdk/test-env`                     | Fixtures d’environnement de test, fetch/réseau, serveur HTTP jetable, requête entrante, test live, système de fichiers temporaire et contrôle du temps                       |
  | `plugin-sdk/test-fixtures`                | Fixtures de test génériques pour CLI, bac à sable, skill, message d’agent, événement système, rechargement de module, chemin de Plugin intégré, terminal, découpage, jeton d’authentification et cas typé |
  | `plugin-sdk/test-node-mocks`              | Assistants de mock ciblés pour les modules intégrés Node à utiliser dans les fabriques Vitest `vi.mock("node:*")`                                                           |
  | `plugin-sdk/migration`                    | Assistants d’éléments de fournisseur de migration tels que `createMigrationItem`, constantes de raison, marqueurs d’état d’élément, assistants de rédaction et `summarizeMigrationItems` |
  | `plugin-sdk/migration-runtime`            | Assistants de migration d’exécution tels que `copyMigrationFileItem`, `withCachedMigrationConfigRuntime` et `writeMigrationReport`                                          |

  <AccordionGroup>
  <Accordion title="Sous-chemins de canal">
    | Sous-chemin | Exports clés |
    | --- | --- |
    | `plugin-sdk/channel-core` | `defineChannelPluginEntry`, `defineSetupPluginEntry`, `createChatChannelPlugin`, `createChannelPluginBase` |
    | `plugin-sdk/config-schema` | Export du schéma Zod racine `openclaw.json` (`OpenClawSchema`) |
    | `plugin-sdk/channel-setup` | `createOptionalChannelSetupSurface`, `createOptionalChannelSetupAdapter`, `createOptionalChannelSetupWizard`, plus `DEFAULT_ACCOUNT_ID`, `createTopLevelChannelDmPolicy`, `setSetupChannelEnabled`, `splitSetupEntries` |
    | `plugin-sdk/setup` | Assistants partagés d’assistant de configuration, prompts de liste d’autorisation, générateurs d’état de configuration |
    | `plugin-sdk/setup-runtime` | `createPatchedAccountSetupAdapter`, `createEnvPatchedAccountSetupAdapter`, `createSetupInputPresenceValidator`, `noteChannelLookupFailure`, `noteChannelLookupSummary`, `promptResolvedAllowFrom`, `splitSetupEntries`, `createAllowlistSetupWizardProxy`, `createDelegatedSetupWizardProxy` |
    | `plugin-sdk/setup-adapter-runtime` | `createEnvPatchedAccountSetupAdapter` |
    | `plugin-sdk/setup-tools` | `formatCliCommand`, `detectBinary`, `extractArchive`, `resolveBrewExecutable`, `formatDocsLink`, `CONFIG_DIR` |
    | `plugin-sdk/account-core` | Assistants de configuration multi-compte et de garde d’action, assistants de repli sur le compte par défaut |
    | `plugin-sdk/account-id` | `DEFAULT_ACCOUNT_ID`, assistants de normalisation d’identifiant de compte |
    | `plugin-sdk/account-resolution` | Assistants de recherche de compte et de repli par défaut |
    | `plugin-sdk/account-helpers` | Assistants restreints de liste de comptes et d’action de compte |
    | `plugin-sdk/channel-pairing` | `createChannelPairingController` |
    | `plugin-sdk/channel-reply-pipeline` | `createChannelReplyPipeline`, `resolveChannelSourceReplyDeliveryMode` |
    | `plugin-sdk/channel-config-helpers` | `createHybridChannelConfigAdapter`, `resolveChannelDmAccess`, `resolveChannelDmAllowFrom`, `resolveChannelDmPolicy`, `normalizeChannelDmPolicy`, `normalizeLegacyDmAliases` |
    | `plugin-sdk/channel-config-schema` | Primitives de schéma de configuration de canal partagées et générateur générique |
    | `plugin-sdk/bundled-channel-config-schema` | Schémas de configuration des canaux OpenClaw intégrés pour les Plugins intégrés maintenus uniquement |
    | `plugin-sdk/channel-config-schema-legacy` | Alias de compatibilité obsolète pour les schémas de configuration de canal intégré |
    | `plugin-sdk/telegram-command-config` | Assistants de normalisation/validation de commandes personnalisées Telegram avec repli de contrat intégré |
    | `plugin-sdk/command-gating` | Assistants restreints de garde d’autorisation de commande |
    | `plugin-sdk/channel-policy` | `resolveChannelGroupRequireMention` |
    | `plugin-sdk/channel-lifecycle` | `createAccountStatusSink`, `createChannelRunQueue`, assistants de cycle de vie/finalisation de flux brouillon |
    | `plugin-sdk/inbound-envelope` | Assistants partagés de route entrante et de génération d’enveloppe |
    | `plugin-sdk/inbound-reply-dispatch` | Assistants partagés d’enregistrement et de distribution entrants |
    | `plugin-sdk/messaging-targets` | Assistants d’analyse/correspondance de cibles |
    | `plugin-sdk/outbound-media` | Assistants partagés de chargement de médias sortants |
    | `plugin-sdk/outbound-send-deps` | Recherche légère de dépendances d’envoi sortant pour les adaptateurs de canal |
    | `plugin-sdk/outbound-runtime` | Assistants de livraison sortante, d’identité, de délégué d’envoi, de session, de formatage et de planification de charge utile |
    | `plugin-sdk/poll-runtime` | Assistants restreints de normalisation de sondage |
    | `plugin-sdk/thread-bindings-runtime` | Assistants de cycle de vie de liaison de fil et d’adaptateur |
    | `plugin-sdk/agent-media-payload` | Générateur hérité de charge utile média d’agent |
    | `plugin-sdk/conversation-runtime` | Assistants de liaison de conversation/fil, d’appairage et de liaison configurée |
    | `plugin-sdk/runtime-config-snapshot` | Assistant d’instantané de configuration d’exécution |
    | `plugin-sdk/runtime-group-policy` | Assistants de résolution de politique de groupe d’exécution |
    | `plugin-sdk/channel-status` | Assistants partagés d’instantané/résumé d’état de canal |
    | `plugin-sdk/channel-config-primitives` | Primitives restreintes de schéma de configuration de canal |
    | `plugin-sdk/channel-config-writes` | Assistants d’autorisation d’écriture de configuration de canal |
    | `plugin-sdk/channel-plugin-common` | Exports partagés de préambule de Plugin de canal |
    | `plugin-sdk/allowlist-config-edit` | Assistants de modification/lecture de configuration de liste d’autorisation |
    | `plugin-sdk/group-access` | Assistants partagés de décision d’accès de groupe |
    | `plugin-sdk/direct-dm` | Assistants partagés d’authentification/garde de DM direct |
    | `plugin-sdk/discord` | Façade de compatibilité Discord obsolète pour `@openclaw/discord@2026.3.13` publié et la compatibilité propriétaire suivie ; les nouveaux Plugins doivent utiliser les sous-chemins génériques du SDK de canal |
    | `plugin-sdk/telegram-account` | Façade de compatibilité de résolution de compte Telegram obsolète pour la compatibilité propriétaire suivie ; les nouveaux Plugins doivent utiliser les assistants d’exécution injectés ou les sous-chemins génériques du SDK de canal |
    | `plugin-sdk/zalouser` | Façade de compatibilité Zalo Personal obsolète pour les paquets Lark/Zalo publiés qui importent encore l’autorisation de commande d’expéditeur ; les nouveaux Plugins doivent utiliser `plugin-sdk/command-auth` |
    | `plugin-sdk/interactive-runtime` | Assistants de présentation sémantique de message, de livraison et de réponse interactive héritée. Consultez [Présentation des messages](/fr/plugins/message-presentation) |
    | `plugin-sdk/channel-inbound` | Barrel de compatibilité pour l’anti-rebond entrant, la correspondance de mention, les assistants de politique de mention et les assistants d’enveloppe |
    | `plugin-sdk/channel-inbound-debounce` | Assistants restreints d’anti-rebond entrant |
    | `plugin-sdk/channel-mention-gating` | Assistants restreints de politique de mention, de marqueur de mention et de texte de mention, sans la surface d’exécution entrante plus large |
    | `plugin-sdk/channel-envelope` | Assistants restreints de formatage d’enveloppe entrante |
    | `plugin-sdk/channel-location` | Assistants de contexte de localisation de canal et de formatage |
    | `plugin-sdk/channel-logging` | Assistants de journalisation de canal pour les abandons entrants et les échecs de saisie/accusé de réception |
    | `plugin-sdk/channel-send-result` | Types de résultat de réponse |
    | `plugin-sdk/channel-actions` | Assistants d’action de message de canal, plus assistants de schéma natif obsolètes conservés pour la compatibilité des Plugins |
    | `plugin-sdk/channel-route` | Assistants partagés de normalisation de route, de résolution de cible pilotée par analyseur, de conversion d’identifiant de fil en chaîne, de déduplication/compactage des clés de route, types de cible analysée et comparaison route/cible |
    | `plugin-sdk/channel-targets` | Assistants d’analyse de cible ; les appelants de comparaison de route doivent utiliser `plugin-sdk/channel-route` |
    | `plugin-sdk/channel-contract` | Types de contrat de canal |
    | `plugin-sdk/channel-feedback` | Câblage des retours/réactions |
    | `plugin-sdk/channel-secret-runtime` | Assistants restreints de contrat de secret tels que `collectSimpleChannelFieldAssignments`, `getChannelSurface`, `pushAssignment` et types de cible de secret |
  </Accordion>

  <Accordion title="Sous-chemins des fournisseurs">
    | Sous-chemin | Exportations clés |
    | --- | --- |
    | `plugin-sdk/provider-entry` | `defineSingleProviderPluginEntry` |
    | `plugin-sdk/lmstudio` | Façade de fournisseur LM Studio prise en charge pour la configuration, la découverte du catalogue et la préparation des modèles à l’exécution |
    | `plugin-sdk/lmstudio-runtime` | Façade d’exécution LM Studio prise en charge pour les valeurs par défaut du serveur local, la découverte des modèles, les en-têtes de requête et les helpers de modèles chargés |
    | `plugin-sdk/provider-setup` | Helpers organisés de configuration des fournisseurs locaux/auto-hébergés |
    | `plugin-sdk/self-hosted-provider-setup` | Helpers ciblés de configuration des fournisseurs auto-hébergés compatibles OpenAI |
    | `plugin-sdk/cli-backend` | Valeurs par défaut du backend CLI + constantes du watchdog |
    | `plugin-sdk/provider-auth-runtime` | Helpers de résolution des clés API à l’exécution pour les Plugins de fournisseur |
    | `plugin-sdk/provider-auth-api-key` | Helpers d’intégration et d’écriture de profils de clés API tels que `upsertApiKeyProfile` |
    | `plugin-sdk/provider-auth-result` | Générateur standard de résultat d’authentification OAuth |
    | `plugin-sdk/provider-auth-login` | Helpers partagés de connexion interactive pour les Plugins de fournisseur |
    | `plugin-sdk/provider-env-vars` | Helpers de recherche de variables d’environnement d’authentification de fournisseur |
    | `plugin-sdk/provider-auth` | `createProviderApiKeyAuthMethod`, `ensureApiKeyFromOptionEnvOrPrompt`, `upsertAuthProfile`, `upsertApiKeyProfile`, `writeOAuthCredentials` |
    | `plugin-sdk/provider-model-shared` | `ProviderReplayFamily`, `buildProviderReplayFamilyHooks`, `normalizeModelCompat`, générateurs partagés de politiques de rejeu, helpers de points de terminaison de fournisseur et helpers de normalisation d’ID de modèle tels que `normalizeNativeXaiModelId` |
    | `plugin-sdk/provider-catalog-runtime` | Hook d’exécution d’augmentation du catalogue de fournisseur et coutures de registre de fournisseurs de Plugins pour les tests de contrat |
    | `plugin-sdk/provider-catalog-shared` | `findCatalogTemplate`, `buildSingleProviderApiKeyCatalog`, `buildManifestModelProviderConfig`, `supportsNativeStreamingUsageCompat`, `applyProviderNativeStreamingUsageCompat` |
    | `plugin-sdk/provider-http` | Helpers génériques de capacités HTTP/point de terminaison de fournisseur, erreurs HTTP de fournisseur et helpers de formulaires multipart pour la transcription audio |
    | `plugin-sdk/provider-web-fetch-contract` | Helpers de contrat étroits de configuration/sélection de récupération web tels que `enablePluginInConfig` et `WebFetchProviderPlugin` |
    | `plugin-sdk/provider-web-fetch` | Helpers d’enregistrement et de cache des fournisseurs de récupération web |
    | `plugin-sdk/provider-web-search-config-contract` | Helpers de configuration/identifiants étroits de recherche web pour les fournisseurs qui n’ont pas besoin de câblage d’activation de Plugin |
    | `plugin-sdk/provider-web-search-contract` | Helpers de contrat étroits de configuration/identifiants de recherche web tels que `createWebSearchProviderContractFields`, `enablePluginInConfig`, `resolveProviderWebSearchPluginConfig`, ainsi que des setters/getters d’identifiants à portée définie |
    | `plugin-sdk/provider-web-search` | Helpers d’enregistrement, de cache et d’exécution des fournisseurs de recherche web |
    | `plugin-sdk/provider-tools` | `ProviderToolCompatFamily`, `buildProviderToolCompatFamilyHooks`, nettoyage de schéma Gemini + diagnostics, et helpers de compatibilité xAI tels que `resolveXaiModelCompatPatch` / `applyXaiModelCompat` |
    | `plugin-sdk/provider-usage` | `fetchClaudeUsage` et similaires |
    | `plugin-sdk/provider-stream` | `ProviderStreamFamily`, `buildProviderStreamFamilyHooks`, `composeProviderStreamWrappers`, types de wrappers de flux, et helpers partagés de wrappers Anthropic/Bedrock/DeepSeek V4/Google/Kilocode/Moonshot/OpenAI/OpenRouter/Z.A.I/MiniMax/Copilot |
    | `plugin-sdk/provider-transport-runtime` | Helpers de transport natif de fournisseur tels que la récupération protégée, les transformations de messages de transport et les flux d’événements de transport inscriptibles |
    | `plugin-sdk/provider-onboard` | Helpers de correctifs de configuration d’intégration |
    | `plugin-sdk/global-singleton` | Helpers de singletons/maps/caches locaux au processus |
    | `plugin-sdk/group-activation` | Helpers étroits de mode d’activation de groupe et d’analyse de commandes |
  </Accordion>

  <Accordion title="Sous-chemins d’authentification et de sécurité">
    | Sous-chemin | Exportations clés |
    | --- | --- |
    | `plugin-sdk/command-auth` | `resolveControlCommandGate`, helpers de registre de commandes incluant la mise en forme dynamique du menu d’arguments, helpers d’autorisation d’expéditeur |
    | `plugin-sdk/command-status` | Générateurs de messages de commande/aide tels que `buildCommandsMessagePaginated` et `buildHelpMessage` |
    | `plugin-sdk/approval-auth-runtime` | Helpers de résolution d’approbateurs et d’authentification d’action dans la même discussion |
    | `plugin-sdk/approval-client-runtime` | Helpers natifs de profil/filtre d’approbation d’exécution |
    | `plugin-sdk/approval-delivery-runtime` | Adaptateurs natifs de capacité/livraison d’approbation |
    | `plugin-sdk/approval-gateway-runtime` | Helper partagé de résolution du Gateway d’approbation |
    | `plugin-sdk/approval-handler-adapter-runtime` | Helpers légers de chargement d’adaptateurs natifs d’approbation pour les points d’entrée de canaux sensibles aux performances |
    | `plugin-sdk/approval-handler-runtime` | Helpers d’exécution plus larges pour les gestionnaires d’approbation ; préférez les coutures d’adaptateur/Gateway plus étroites lorsqu’elles suffisent |
    | `plugin-sdk/approval-native-runtime` | Helpers natifs de cible d’approbation + liaison de compte |
    | `plugin-sdk/approval-reply-runtime` | Helpers de charges utiles de réponse d’approbation d’exécution/Plugin |
    | `plugin-sdk/approval-runtime` | Helpers de charges utiles d’approbation d’exécution/Plugin, helpers de routage/exécution d’approbation native et helpers d’affichage structuré des approbations tels que `formatApprovalDisplayPath` |
    | `plugin-sdk/reply-dedupe` | Helpers étroits de réinitialisation de déduplication des réponses entrantes |
    | `plugin-sdk/channel-contract-testing` | Helpers étroits de tests de contrat de canal sans le large barrel de test |
    | `plugin-sdk/command-auth-native` | Authentification native des commandes, mise en forme dynamique du menu d’arguments et helpers natifs de cible de session |
    | `plugin-sdk/command-detection` | Helpers partagés de détection de commandes |
    | `plugin-sdk/command-primitives-runtime` | Prédicats légers de texte de commande pour les chemins de canaux sensibles aux performances |
    | `plugin-sdk/command-surface` | Helpers de normalisation de corps de commande et de surface de commande |
    | `plugin-sdk/allow-from` | `formatAllowFromLowercase` |
    | `plugin-sdk/channel-secret-runtime` | Helpers étroits de collecte de contrats de secrets pour les surfaces de secrets de canal/Plugin |
    | `plugin-sdk/secret-ref-runtime` | Helpers étroits de typage `coerceSecretRef` et SecretRef pour l’analyse des contrats de secrets/configuration |
    | `plugin-sdk/security-runtime` | Helpers partagés de confiance, filtrage des DM, contenu externe, occultation de texte sensible, comparaison de secrets en temps constant et collecte de secrets |
    | `plugin-sdk/ssrf-policy` | Helpers de liste d’autorisation d’hôtes et de politique SSRF de réseau privé |
    | `plugin-sdk/ssrf-dispatcher` | Helpers étroits de dispatcher épinglé sans la large surface d’exécution d’infrastructure |
    | `plugin-sdk/ssrf-runtime` | Dispatcher épinglé, récupération protégée contre les SSRF, erreur SSRF et helpers de politique SSRF |
    | `plugin-sdk/secret-input` | Helpers d’analyse d’entrée de secret |
    | `plugin-sdk/webhook-ingress` | Helpers de requête/cible Webhook et coercition brute de websocket/corps |
    | `plugin-sdk/webhook-request-guards` | Helpers de taille de corps de requête/délai d’expiration |
  </Accordion>

  <Accordion title="Sous-chemins de runtime et de stockage">
    | Sous-chemin | Exports clés |
    | --- | --- |
    | `plugin-sdk/runtime` | Helpers généraux de runtime, journalisation, sauvegarde et installation de plugins |
    | `plugin-sdk/runtime-env` | Helpers ciblés pour l’environnement de runtime, le logger, les délais d’expiration, les nouvelles tentatives et le backoff |
    | `plugin-sdk/browser-config` | Façade de configuration de navigateur prise en charge pour les profils/valeurs par défaut normalisés, l’analyse d’URL CDP et les helpers d’authentification de contrôle du navigateur |
    | `plugin-sdk/channel-runtime-context` | Helpers génériques d’enregistrement et de recherche de contexte de runtime de canal |
    | `plugin-sdk/runtime-store` | `createPluginRuntimeStore` |
    | `plugin-sdk/plugin-runtime` | Helpers partagés pour les commandes, hooks, HTTP et interactions de plugins |
    | `plugin-sdk/hook-runtime` | Helpers partagés de pipeline de hooks internes/webhook |
    | `plugin-sdk/lazy-runtime` | Helpers d’import/de liaison paresseux de runtime tels que `createLazyRuntimeModule`, `createLazyRuntimeMethod` et `createLazyRuntimeSurface` |
    | `plugin-sdk/process-runtime` | Helpers d’exécution de processus |
    | `plugin-sdk/cli-runtime` | Helpers de formatage CLI, d’attente, de version, d’invocation d’arguments et de groupes de commandes paresseux |
    | `plugin-sdk/gateway-runtime` | Client Gateway, helper de démarrage de client prêt pour la boucle d’événements, RPC CLI Gateway, erreurs du protocole Gateway et helpers de correctifs d’état de canal |
    | `plugin-sdk/config-types` | Surface de configuration uniquement typée pour les formes de configuration de plugins telles que `OpenClawConfig` et les types de configuration de canal/fournisseur |
    | `plugin-sdk/plugin-config-runtime` | Helpers de recherche de configuration de plugin au runtime tels que `requireRuntimeConfig`, `resolvePluginConfigObject` et `resolveLivePluginConfigObject` |
    | `plugin-sdk/config-mutation` | Helpers de mutation transactionnelle de configuration tels que `mutateConfigFile`, `replaceConfigFile` et `logConfigUpdated` |
    | `plugin-sdk/runtime-config-snapshot` | Helpers d’instantané de configuration du processus courant tels que `getRuntimeConfig`, `getRuntimeConfigSnapshot` et les setters d’instantané de test |
    | `plugin-sdk/telegram-command-config` | Normalisation des noms/descriptions de commandes Telegram et vérifications de doublons/conflits, même lorsque la surface de contrat Telegram groupée est indisponible |
    | `plugin-sdk/text-autolink-runtime` | Détection d’autolien de références de fichiers sans le barrel large de runtime de texte |
    | `plugin-sdk/approval-runtime` | Helpers d’approbation d’exécution/plugin, constructeurs de capacités d’approbation, helpers d’authentification/profil, helpers de routage/runtime natifs et formatage structuré des chemins d’affichage d’approbation |
    | `plugin-sdk/reply-runtime` | Helpers partagés de runtime entrant/réponse, découpage, dispatch, heartbeat, planificateur de réponse |
    | `plugin-sdk/reply-dispatch-runtime` | Helpers ciblés de dispatch/finalisation de réponse et de libellés de conversation |
    | `plugin-sdk/reply-history` | Helpers et marqueurs partagés d’historique de réponse à fenêtre courte tels que `buildHistoryContext`, `HISTORY_CONTEXT_MARKER`, `recordPendingHistoryEntry` et `clearHistoryEntriesIfEnabled` |
    | `plugin-sdk/reply-reference` | `createReplyReferencePlanner` |
    | `plugin-sdk/reply-chunking` | Helpers ciblés de découpage texte/Markdown |
    | `plugin-sdk/session-store-runtime` | Helpers de chemin de magasin de sessions, clé de session, date de mise à jour et mutation de magasin |
    | `plugin-sdk/cron-store-runtime` | Helpers de chemin/chargement/enregistrement du magasin Cron |
    | `plugin-sdk/state-paths` | Helpers de chemins de répertoires d’état/OAuth |
    | `plugin-sdk/routing` | Helpers de route/clé de session/liaison de compte tels que `resolveAgentRoute`, `buildAgentSessionKey` et `resolveDefaultAgentBoundAccountId` |
    | `plugin-sdk/status-helpers` | Helpers partagés de synthèse d’état de canal/compte, valeurs par défaut d’état de runtime et helpers de métadonnées de problème |
    | `plugin-sdk/target-resolver-runtime` | Helpers partagés de résolution de cible |
    | `plugin-sdk/string-normalization-runtime` | Helpers de normalisation de slug/chaîne |
    | `plugin-sdk/request-url` | Extrait les URL sous forme de chaînes depuis des entrées de type fetch/request |
    | `plugin-sdk/run-command` | Exécuteur de commandes temporisé avec résultats stdout/stderr normalisés |
    | `plugin-sdk/param-readers` | Lecteurs courants de paramètres d’outil/CLI |
    | `plugin-sdk/tool-payload` | Extrait les charges utiles normalisées depuis les objets de résultat d’outil |
    | `plugin-sdk/tool-send` | Extrait les champs canoniques de cible d’envoi depuis les arguments d’outil |
    | `plugin-sdk/temp-path` | Helpers partagés de chemins de téléchargement temporaires |
    | `plugin-sdk/logging-core` | Helpers de logger de sous-système et de rédaction |
    | `plugin-sdk/markdown-table-runtime` | Helpers de mode de tableau Markdown et de conversion |
    | `plugin-sdk/model-session-runtime` | Helpers de surcharge de modèle/session tels que `applyModelOverrideToSessionEntry` et `resolveAgentMaxConcurrent` |
    | `plugin-sdk/talk-config-runtime` | Helpers de résolution de configuration de fournisseur de conversation |
    | `plugin-sdk/json-store` | Petits helpers de lecture/écriture d’état JSON |
    | `plugin-sdk/file-lock` | Helpers de verrouillage de fichier réentrants |
    | `plugin-sdk/persistent-dedupe` | Helpers de cache de déduplication adossé au disque |
    | `plugin-sdk/acp-runtime` | Helpers de runtime/session ACP et de dispatch de réponse |
    | `plugin-sdk/acp-runtime-backend` | Helpers légers d’enregistrement de backend ACP et de dispatch de réponse pour les plugins chargés au démarrage |
    | `plugin-sdk/acp-binding-resolve-runtime` | Résolution en lecture seule de liaison ACP sans imports de démarrage du cycle de vie |
    | `plugin-sdk/agent-config-primitives` | Primitives ciblées de schéma de configuration de runtime d’agent |
    | `plugin-sdk/boolean-param` | Lecteur souple de paramètres booléens |
    | `plugin-sdk/dangerous-name-runtime` | Helpers de résolution de correspondance de noms dangereux |
    | `plugin-sdk/device-bootstrap` | Helpers d’amorçage d’appareil et de jetons de jumelage |
    | `plugin-sdk/extension-shared` | Primitives partagées de helpers de canal passif, d’état et de proxy ambiant |
    | `plugin-sdk/models-provider-runtime` | Helpers de réponse de commande/fournisseur `/models` |
    | `plugin-sdk/skill-commands-runtime` | Helpers de liste de commandes Skill |
    | `plugin-sdk/native-command-registry` | Helpers de registre/construction/sérialisation de commandes natives |
    | `plugin-sdk/agent-harness` | Surface expérimentale de plugin de confiance pour les harnais d’agent de bas niveau : types de harnais, helpers de pilotage/abandon d’exécution active, helpers de passerelle d’outils OpenClaw, helpers de politique d’outils de plan de runtime, classification des résultats de terminal, helpers de formatage/détail de progression d’outil et utilitaires de résultat de tentative |
    | `plugin-sdk/provider-zai-endpoint` | Helpers de détection de point de terminaison Z.AI |
    | `plugin-sdk/async-lock-runtime` | Helper de verrou asynchrone local au processus pour les petits fichiers d’état de runtime |
    | `plugin-sdk/channel-activity-runtime` | Helper de télémétrie d’activité de canal |
    | `plugin-sdk/concurrency-runtime` | Helper de concurrence bornée pour tâches asynchrones |
    | `plugin-sdk/dedupe-runtime` | Helpers de cache de déduplication en mémoire |
    | `plugin-sdk/delivery-queue-runtime` | Helper de vidage des livraisons sortantes en attente |
    | `plugin-sdk/file-access-runtime` | Helpers de chemins sûrs de fichiers locaux et de sources média |
    | `plugin-sdk/heartbeat-runtime` | Helpers d’événements Heartbeat et de visibilité |
    | `plugin-sdk/number-runtime` | Helper de coercition numérique |
    | `plugin-sdk/secure-random-runtime` | Helpers de jetons/UUID sécurisés |
    | `plugin-sdk/system-event-runtime` | Helpers de file d’événements système |
    | `plugin-sdk/transport-ready-runtime` | Helper d’attente de disponibilité du transport |
    | `plugin-sdk/infra-runtime` | Shim de compatibilité obsolète ; utilisez les sous-chemins de runtime ciblés ci-dessus |
    | `plugin-sdk/collection-runtime` | Petits helpers de cache borné |
    | `plugin-sdk/diagnostic-runtime` | Helpers d’indicateurs de diagnostic, d’événements et de contexte de trace |
    | `plugin-sdk/error-runtime` | Graphe d’erreurs, formatage, helpers partagés de classification d’erreurs, `isApprovalNotFoundError` |
    | `plugin-sdk/fetch-runtime` | Fetch enveloppé, proxy, option `EnvHttpProxyAgent` et helpers de lookup épinglé |
    | `plugin-sdk/runtime-fetch` | Fetch de runtime compatible dispatcher sans imports de proxy/fetch protégé |
    | `plugin-sdk/response-limit-runtime` | Lecteur borné de corps de réponse sans la surface large de runtime média |
    | `plugin-sdk/session-binding-runtime` | État de liaison de conversation courante sans routage de liaison configuré ni magasins de jumelage |
    | `plugin-sdk/session-store-runtime` | Helpers de magasin de sessions sans écritures/maintenance larges de configuration |
    | `plugin-sdk/context-visibility-runtime` | Résolution de visibilité du contexte et filtrage du contexte supplémentaire sans imports larges de configuration/sécurité |
    | `plugin-sdk/string-coerce-runtime` | Helpers ciblés de coercition et normalisation de chaînes/enregistrements primitifs sans imports Markdown/journalisation |
    | `plugin-sdk/host-runtime` | Helpers de normalisation de nom d’hôte et d’hôte SCP |
    | `plugin-sdk/retry-runtime` | Helpers de configuration de nouvelle tentative et d’exécuteur de nouvelles tentatives |
    | `plugin-sdk/agent-runtime` | Helpers de répertoire/identité/espace de travail d’agent |
    | `plugin-sdk/directory-runtime` | Requête/déduplication de répertoire adossée à la configuration |
    | `plugin-sdk/keyed-async-queue` | `KeyedAsyncQueue` |
  </Accordion>

  <Accordion title="Sous-chemins de capacités et de test">
    | Sous-chemin | Exports clés |
    | --- | --- |
    | `plugin-sdk/media-runtime` | Assistants partagés de récupération/transformation/stockage de médias, sondage des dimensions vidéo adossé à ffprobe, et générateurs de charges utiles média |
    | `plugin-sdk/media-store` | Assistants restreints de stockage de médias tels que `saveMediaBuffer` |
    | `plugin-sdk/media-generation-runtime` | Assistants partagés de basculement pour la génération de médias, sélection de candidats et messages de modèle manquant |
    | `plugin-sdk/media-understanding` | Types de fournisseurs de compréhension des médias ainsi qu’exports d’assistants image/audio destinés aux fournisseurs |
    | `plugin-sdk/text-runtime` | Assistants partagés de texte/markdown/journalisation tels que la suppression du texte visible par l’assistant, les assistants de rendu/découpage/tableaux markdown, les assistants de caviardage, les assistants de balises de directive et les utilitaires de texte sûr |
    | `plugin-sdk/text-chunking` | Assistant de découpage du texte sortant |
    | `plugin-sdk/speech` | Types de fournisseurs vocaux ainsi qu’exports de directive, registre, validation, générateur TTS compatible OpenAI et assistants vocaux destinés aux fournisseurs |
    | `plugin-sdk/speech-core` | Types partagés de fournisseurs vocaux, registre, directive, normalisation et exports d’assistants vocaux |
    | `plugin-sdk/realtime-transcription` | Types de fournisseurs de transcription en temps réel, assistants de registre et assistant partagé de session WebSocket |
    | `plugin-sdk/realtime-voice` | Types de fournisseurs vocaux en temps réel et assistants de registre |
    | `plugin-sdk/image-generation` | Types de fournisseurs de génération d’images ainsi qu’assistants d’assets image/URL de données et générateur de fournisseur d’images compatible OpenAI |
    | `plugin-sdk/image-generation-core` | Types partagés de génération d’images, basculement, auth et assistants de registre |
    | `plugin-sdk/music-generation` | Types de fournisseurs/requêtes/résultats de génération musicale |
    | `plugin-sdk/music-generation-core` | Types partagés de génération musicale, assistants de basculement, recherche de fournisseur et analyse des références de modèle |
    | `plugin-sdk/video-generation` | Types de fournisseurs/requêtes/résultats de génération vidéo |
    | `plugin-sdk/video-generation-core` | Types partagés de génération vidéo, assistants de basculement, recherche de fournisseur et analyse des références de modèle |
    | `plugin-sdk/webhook-targets` | Registre de cibles Webhook et assistants d’installation de routes |
    | `plugin-sdk/webhook-path` | Assistants de normalisation des chemins Webhook |
    | `plugin-sdk/web-media` | Assistants partagés de chargement de médias distants/locaux |
    | `plugin-sdk/zod` | `zod` réexporté pour les consommateurs du SDK Plugin |
    | `plugin-sdk/testing` | Barrel de compatibilité large pour les anciens tests de Plugin. Les nouveaux tests d’extension doivent plutôt importer des sous-chemins SDK ciblés tels que `plugin-sdk/agent-runtime-test-contracts`, `plugin-sdk/plugin-test-runtime`, `plugin-sdk/channel-test-helpers`, `plugin-sdk/test-env` ou `plugin-sdk/test-fixtures` |
    | `plugin-sdk/plugin-test-api` | Assistant minimal `createTestPluginApi` pour les tests unitaires d’enregistrement direct de Plugin sans importer les passerelles d’assistants de test du dépôt |
    | `plugin-sdk/agent-runtime-test-contracts` | Fixtures natives de contrat d’adaptateur d’exécution d’agent pour les tests d’auth, livraison, repli, hook d’outil, superposition de prompt, schéma et projection de transcript |
    | `plugin-sdk/channel-test-helpers` | Assistants de test orientés canal pour les contrats génériques d’actions/configuration/statut, assertions de répertoire, cycle de vie au démarrage du compte, threading de config d’envoi, mocks d’exécution, problèmes de statut, livraison sortante et enregistrement de hooks |
    | `plugin-sdk/channel-target-testing` | Suite partagée de cas d’erreur de résolution de cible pour les tests de canal |
    | `plugin-sdk/plugin-test-contracts` | Assistants de contrat pour package Plugin, enregistrement, artefact public, import direct, API d’exécution et effets de bord d’importation |
    | `plugin-sdk/provider-test-contracts` | Assistants de contrat pour exécution de fournisseur, auth, découverte, intégration, catalogue, assistant de configuration, capacité média, politique de relecture, STT audio en direct temps réel, recherche/récupération web et flux |
    | `plugin-sdk/provider-http-test-mocks` | Mocks HTTP/auth Vitest activables pour les tests de fournisseur qui exercent `plugin-sdk/provider-http` |
    | `plugin-sdk/test-fixtures` | Fixtures génériques de capture d’exécution CLI, contexte sandbox, rédacteur de Skill, message d’agent, événement système, rechargement de module, chemin de Plugin groupé, texte de terminal, découpage, jeton d’auth et cas typés |
    | `plugin-sdk/test-node-mocks` | Assistants ciblés de mock des modules intégrés Node à utiliser dans les fabriques Vitest `vi.mock("node:*")` |
  </Accordion>

  <Accordion title="Sous-chemins de mémoire">
    | Sous-chemin | Exports clés |
    | --- | --- |
    | `plugin-sdk/memory-core` | Surface d’assistants memory-core groupés pour les assistants de gestionnaire/config/fichier/CLI |
    | `plugin-sdk/memory-core-engine-runtime` | Façade d’exécution d’indexation/recherche mémoire |
    | `plugin-sdk/memory-core-host-engine-foundation` | Exports du moteur de fondation de l’hôte mémoire |
    | `plugin-sdk/memory-core-host-engine-embeddings` | Contrats d’embeddings de l’hôte mémoire, accès au registre, fournisseur local et assistants génériques de traitement par lots/distant |
    | `plugin-sdk/memory-core-host-engine-qmd` | Exports du moteur QMD de l’hôte mémoire |
    | `plugin-sdk/memory-core-host-engine-storage` | Exports du moteur de stockage de l’hôte mémoire |
    | `plugin-sdk/memory-core-host-multimodal` | Assistants multimodaux de l’hôte mémoire |
    | `plugin-sdk/memory-core-host-query` | Assistants de requête de l’hôte mémoire |
    | `plugin-sdk/memory-core-host-secret` | Assistants de secrets de l’hôte mémoire |
    | `plugin-sdk/memory-core-host-events` | Assistants de journal d’événements de l’hôte mémoire |
    | `plugin-sdk/memory-core-host-status` | Assistants de statut de l’hôte mémoire |
    | `plugin-sdk/memory-core-host-runtime-cli` | Assistants d’exécution CLI de l’hôte mémoire |
    | `plugin-sdk/memory-core-host-runtime-core` | Assistants d’exécution cœur de l’hôte mémoire |
    | `plugin-sdk/memory-core-host-runtime-files` | Assistants fichier/exécution de l’hôte mémoire |
    | `plugin-sdk/memory-host-core` | Alias indépendant du fournisseur pour les assistants d’exécution cœur de l’hôte mémoire |
    | `plugin-sdk/memory-host-events` | Alias indépendant du fournisseur pour les assistants de journal d’événements de l’hôte mémoire |
    | `plugin-sdk/memory-host-files` | Alias indépendant du fournisseur pour les assistants fichier/exécution de l’hôte mémoire |
    | `plugin-sdk/memory-host-markdown` | Assistants partagés de markdown géré pour les Plugins adjacents à la mémoire |
    | `plugin-sdk/memory-host-search` | Façade d’exécution Active Memory pour l’accès au gestionnaire de recherche |
    | `plugin-sdk/memory-host-status` | Alias indépendant du fournisseur pour les assistants de statut de l’hôte mémoire |
  </Accordion>

  <Accordion title="Sous-chemins d’assistants groupés réservés">
    Il n’existe actuellement aucun sous-chemin SDK réservé pour les assistants groupés. Les assistants propres à un propriétaire
    résident dans le package Plugin propriétaire, tandis que les contrats d’hôte réutilisables
    utilisent des sous-chemins SDK génériques tels que `plugin-sdk/gateway-runtime`,
    `plugin-sdk/security-runtime` et `plugin-sdk/plugin-config-runtime`.
  </Accordion>
</AccordionGroup>

## Connexe

- [Vue d’ensemble du SDK Plugin](/fr/plugins/sdk-overview)
- [Configuration du SDK Plugin](/fr/plugins/sdk-setup)
- [Création de Plugins](/fr/plugins/building-plugins)
