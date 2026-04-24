---
read_when:
    - Vous voyez l’avertissement `OPENCLAW_PLUGIN_SDK_COMPAT_DEPRECATED`
    - Vous voyez l’avertissement `OPENCLAW_EXTENSION_API_DEPRECATED`
    - Vous mettez à jour un plugin vers l’architecture de Plugin moderne
    - Vous maintenez un plugin OpenClaw externe
sidebarTitle: Migrate to SDK
summary: Migrez de la couche de rétrocompatibilité héritée vers le SDK de Plugin moderne
title: Migration du SDK de Plugin
x-i18n:
    generated_at: "2026-04-24T08:57:09Z"
    model: gpt-5.4
    provider: openai
    source_hash: d1461ae8a7de0a802c9deb59f843e7d93d9d73bea22c27d837ca2db8ae9d14b7
    source_path: plugins/sdk-migration.md
    workflow: 15
---

OpenClaw est passé d’une large couche de rétrocompatibilité à une architecture de Plugin moderne avec des imports ciblés et documentés. Si votre plugin a été conçu avant la nouvelle architecture, ce guide vous aide à effectuer la migration.

## Ce qui change

L’ancien système de plugin fournissait deux surfaces très ouvertes qui permettaient aux plugins d’importer tout ce dont ils avaient besoin depuis un point d’entrée unique :

- **`openclaw/plugin-sdk/compat`** — un import unique qui réexportait des dizaines de helpers. Il a été introduit pour permettre aux anciens plugins basés sur des hooks de continuer à fonctionner pendant la mise en place de la nouvelle architecture de plugin.
- **`openclaw/extension-api`** — un pont qui donnait aux plugins un accès direct à des helpers côté hôte comme l’exécuteur d’agent embarqué.

Ces deux surfaces sont désormais **obsolètes**. Elles fonctionnent encore à l’exécution, mais les nouveaux plugins ne doivent pas les utiliser, et les plugins existants doivent migrer avant que la prochaine version majeure ne les supprime.

OpenClaw ne supprime ni ne réinterprète un comportement de plugin documenté dans le même changement qui introduit un remplacement. Les changements cassants de contrat doivent d’abord passer par un adaptateur de compatibilité, des diagnostics, de la documentation et une période de dépréciation. Cela s’applique aux imports du SDK, aux champs de manifeste, aux API de configuration, aux hooks et au comportement d’enregistrement à l’exécution.

<Warning>
  La couche de rétrocompatibilité sera supprimée dans une future version majeure.
  Les plugins qui importent encore depuis ces surfaces cesseront de fonctionner à ce moment-là.
</Warning>

## Pourquoi cela a changé

L’ancienne approche posait des problèmes :

- **Démarrage lent** — importer un helper chargeait des dizaines de modules sans rapport
- **Dépendances circulaires** — les réexportations larges facilitaient la création de cycles d’import
- **Surface d’API peu claire** — aucun moyen de distinguer les exports stables des exports internes

Le SDK de Plugin moderne corrige cela : chaque chemin d’import (`openclaw/plugin-sdk/\<subpath\>`) est un module petit et autonome, avec un objectif clair et un contrat documenté.

Les points d’entrée de commodité hérités pour les fournisseurs des canaux intégrés ont également disparu. Les imports tels que `openclaw/plugin-sdk/slack`, `openclaw/plugin-sdk/discord`, `openclaw/plugin-sdk/signal`, `openclaw/plugin-sdk/whatsapp`, les points d’entrée de helpers associés à une marque de canal, et `openclaw/plugin-sdk/telegram-core` étaient des raccourcis privés du mono-repo, et non des contrats de plugin stables. Utilisez à la place des sous-chemins génériques et ciblés du SDK. À l’intérieur de l’espace de travail d’un plugin intégré, conservez les helpers appartenant au fournisseur dans le propre `api.ts` ou `runtime-api.ts` de ce plugin.

Exemples actuels de fournisseurs intégrés :

- Anthropic conserve les helpers de flux spécifiques à Claude dans son propre point d’entrée `api.ts` / `contract-api.ts`
- OpenAI conserve les constructeurs de fournisseur, les helpers de modèle par défaut et les constructeurs de fournisseur temps réel dans son propre `api.ts`
- OpenRouter conserve le constructeur de fournisseur et les helpers d’intégration/configuration dans son propre `api.ts`

## Politique de compatibilité

Pour les plugins externes, le travail de compatibilité suit cet ordre :

1. ajouter le nouveau contrat
2. conserver l’ancien comportement via un adaptateur de compatibilité
3. émettre un diagnostic ou un avertissement qui nomme l’ancien chemin et son remplacement
4. couvrir les deux chemins dans les tests
5. documenter la dépréciation et le chemin de migration
6. supprimer seulement après la fenêtre de migration annoncée, généralement dans une version majeure

Si un champ de manifeste est encore accepté, les auteurs de plugins peuvent continuer à l’utiliser jusqu’à ce que la documentation et les diagnostics indiquent le contraire. Le nouveau code doit privilégier le remplacement documenté, mais les plugins existants ne doivent pas cesser de fonctionner au cours de versions mineures ordinaires.

## Comment migrer

<Steps>
  <Step title="Migrer les handlers approval-native vers des faits de capacité">
    Les plugins de canal capables de gérer les approbations exposent désormais le comportement d’approbation natif via `approvalCapability.nativeRuntime` ainsi que le registre partagé de contexte d’exécution.

    Principaux changements :

    - Remplacez `approvalCapability.handler.loadRuntime(...)` par `approvalCapability.nativeRuntime`
    - Déplacez l’authentification/la livraison spécifiques aux approbations hors du câblage hérité `plugin.auth` / `plugin.approvals` vers `approvalCapability`
    - `ChannelPlugin.approvals` a été supprimé du contrat public de plugin de canal ; déplacez les champs delivery/native/render vers `approvalCapability`
    - `plugin.auth` reste utilisé uniquement pour les flux de connexion/déconnexion du canal ; les hooks d’authentification d’approbation à cet emplacement ne sont plus lus par le cœur
    - Enregistrez les objets d’exécution appartenant au canal, tels que les clients, les jetons ou les apps Bolt, via `openclaw/plugin-sdk/channel-runtime-context`
    - N’envoyez pas d’avis de redirection appartenant au plugin depuis les handlers d’approbation natifs ; le cœur gère désormais les avis routés ailleurs à partir des résultats réels de livraison
    - Lors du passage de `channelRuntime` à `createChannelManager(...)`, fournissez une véritable surface `createPluginRuntime().channel`. Les stubs partiels sont rejetés.

    Consultez `/plugins/sdk-channel-plugins` pour la structure actuelle de la capacité d’approbation.

  </Step>

  <Step title="Auditer le comportement de repli du wrapper Windows">
    Si votre plugin utilise `openclaw/plugin-sdk/windows-spawn`, les wrappers Windows `.cmd`/`.bat` non résolus échouent désormais par défaut, sauf si vous passez explicitement `allowShellFallback: true`.

    ```typescript
    // Before
    const program = applyWindowsSpawnProgramPolicy({ candidate });

    // After
    const program = applyWindowsSpawnProgramPolicy({
      candidate,
      // Only set this for trusted compatibility callers that intentionally
      // accept shell-mediated fallback.
      allowShellFallback: true,
    });
    ```

    Si votre appelant ne dépend pas intentionnellement du repli vers le shell, ne définissez pas `allowShellFallback` et gérez plutôt l’erreur levée.

  </Step>

  <Step title="Rechercher les imports obsolètes">
    Recherchez dans votre plugin les imports provenant de l’une ou l’autre surface obsolète :

    ```bash
    grep -r "plugin-sdk/compat" my-plugin/
    grep -r "openclaw/extension-api" my-plugin/
    ```

  </Step>

  <Step title="Remplacer par des imports ciblés">
    Chaque export de l’ancienne surface correspond à un chemin d’import moderne spécifique :

    ```typescript
    // Before (deprecated backwards-compatibility layer)
    import {
      createChannelReplyPipeline,
      createPluginRuntimeStore,
      resolveControlCommandGate,
    } from "openclaw/plugin-sdk/compat";

    // After (modern focused imports)
    import { createChannelReplyPipeline } from "openclaw/plugin-sdk/channel-reply-pipeline";
    import { createPluginRuntimeStore } from "openclaw/plugin-sdk/runtime-store";
    import { resolveControlCommandGate } from "openclaw/plugin-sdk/command-auth";
    ```

    Pour les helpers côté hôte, utilisez le runtime de plugin injecté au lieu d’importer directement :

    ```typescript
    // Before (deprecated extension-api bridge)
    import { runEmbeddedPiAgent } from "openclaw/extension-api";
    const result = await runEmbeddedPiAgent({ sessionId, prompt });

    // After (injected runtime)
    const result = await api.runtime.agent.runEmbeddedPiAgent({ sessionId, prompt });
    ```

    Le même modèle s’applique aux autres helpers de pont hérités :

    | Ancien import | Équivalent moderne |
    | --- | --- |
    | `resolveAgentDir` | `api.runtime.agent.resolveAgentDir` |
    | `resolveAgentWorkspaceDir` | `api.runtime.agent.resolveAgentWorkspaceDir` |
    | `resolveAgentIdentity` | `api.runtime.agent.resolveAgentIdentity` |
    | `resolveThinkingDefault` | `api.runtime.agent.resolveThinkingDefault` |
    | `resolveAgentTimeoutMs` | `api.runtime.agent.resolveAgentTimeoutMs` |
    | `ensureAgentWorkspace` | `api.runtime.agent.ensureAgentWorkspace` |
    | helpers de magasin de session | `api.runtime.agent.session.*` |

  </Step>

  <Step title="Compiler et tester">
    ```bash
    pnpm build
    pnpm test -- my-plugin/
    ```
  </Step>
</Steps>

## Référence des chemins d’import

  <Accordion title="Tableau des chemins d’import courants">
  | Import path | Objectif | Exports clés |
  | --- | --- | --- |
  | `plugin-sdk/plugin-entry` | Helper d’entrée de plugin canonique | `definePluginEntry` |
  | `plugin-sdk/core` | Réexportation parapluie héritée pour les définitions/builders d’entrée de canal | `defineChannelPluginEntry`, `createChatChannelPlugin` |
  | `plugin-sdk/config-schema` | Export du schéma de configuration racine | `OpenClawSchema` |
  | `plugin-sdk/provider-entry` | Helper d’entrée à fournisseur unique | `defineSingleProviderPluginEntry` |
  | `plugin-sdk/channel-core` | Définitions et builders ciblés pour les entrées de canal | `defineChannelPluginEntry`, `defineSetupPluginEntry`, `createChatChannelPlugin`, `createChannelPluginBase` |
  | `plugin-sdk/setup` | Helpers partagés d’assistant de configuration | Prompts de liste d’autorisation, builders d’état de configuration |
  | `plugin-sdk/setup-runtime` | Helpers d’exécution au moment de la configuration | Adaptateurs de patch de configuration sûrs à importer, helpers de notes de recherche, `promptResolvedAllowFrom`, `splitSetupEntries`, proxys de configuration déléguée |
  | `plugin-sdk/setup-adapter-runtime` | Helpers d’adaptateur de configuration | `createEnvPatchedAccountSetupAdapter` |
  | `plugin-sdk/setup-tools` | Helpers d’outillage de configuration | `formatCliCommand`, `detectBinary`, `extractArchive`, `resolveBrewExecutable`, `formatDocsLink`, `CONFIG_DIR` |
  | `plugin-sdk/account-core` | Helpers multi-comptes | Helpers de liste/configuration/action-gate de compte |
  | `plugin-sdk/account-id` | Helpers d’identifiant de compte | `DEFAULT_ACCOUNT_ID`, normalisation d’identifiant de compte |
  | `plugin-sdk/account-resolution` | Helpers de recherche de compte | Helpers de recherche de compte + repli par défaut |
  | `plugin-sdk/account-helpers` | Helpers de compte ciblés | Helpers de liste de comptes/action de compte |
  | `plugin-sdk/channel-setup` | Adaptateurs d’assistant de configuration | `createOptionalChannelSetupSurface`, `createOptionalChannelSetupAdapter`, `createOptionalChannelSetupWizard`, ainsi que `DEFAULT_ACCOUNT_ID`, `createTopLevelChannelDmPolicy`, `setSetupChannelEnabled`, `splitSetupEntries` |
  | `plugin-sdk/channel-pairing` | Primitives d’appairage DM | `createChannelPairingController` |
  | `plugin-sdk/channel-reply-pipeline` | Câblage du préfixe de réponse + saisie | `createChannelReplyPipeline` |
  | `plugin-sdk/channel-config-helpers` | Fabriques d’adaptateurs de configuration | `createHybridChannelConfigAdapter` |
  | `plugin-sdk/channel-config-schema` | Builders de schéma de configuration | Types de schéma de configuration de canal |
  | `plugin-sdk/telegram-command-config` | Helpers de configuration des commandes Telegram | Normalisation des noms de commande, raccourcissement des descriptions, validation des doublons/conflits |
  | `plugin-sdk/channel-policy` | Résolution de stratégie groupe/DM | `resolveChannelGroupRequireMention` |
  | `plugin-sdk/channel-lifecycle` | Helpers de cycle de vie du statut de compte et de flux de brouillon | `createAccountStatusSink`, helpers de finalisation d’aperçu de brouillon |
  | `plugin-sdk/inbound-envelope` | Helpers d’enveloppe entrante | Helpers partagés de route + construction d’enveloppe |
  | `plugin-sdk/inbound-reply-dispatch` | Helpers de réponse entrante | Helpers partagés d’enregistrement et d’envoi |
  | `plugin-sdk/messaging-targets` | Analyse des cibles de messagerie | Helpers d’analyse/correspondance des cibles |
  | `plugin-sdk/outbound-media` | Helpers de média sortant | Chargement partagé des médias sortants |
  | `plugin-sdk/outbound-runtime` | Helpers d’exécution sortante | Helpers d’identité sortante/délégué d’envoi et de planification de charge utile |
  | `plugin-sdk/thread-bindings-runtime` | Helpers de liaison de thread | Helpers de cycle de vie et d’adaptateur des liaisons de thread |
  | `plugin-sdk/agent-media-payload` | Helpers hérités de charge utile média | Builder de charge utile média d’agent pour des dispositions de champs héritées |
  | `plugin-sdk/channel-runtime` | Shim de compatibilité obsolète | Utilitaires hérités d’exécution de canal uniquement |
  | `plugin-sdk/channel-send-result` | Types de résultat d’envoi | Types de résultat de réponse |
  | `plugin-sdk/runtime-store` | Stockage persistant du plugin | `createPluginRuntimeStore` |
  | `plugin-sdk/runtime` | Helpers d’exécution étendus | Helpers d’exécution/journalisation/sauvegarde/installation de plugin |
  | `plugin-sdk/runtime-env` | Helpers ciblés d’environnement d’exécution | Helpers de logger/environnement d’exécution, délai d’expiration, retry et backoff |
  | `plugin-sdk/plugin-runtime` | Helpers partagés d’exécution de plugin | Helpers de commandes/hooks/http/interactif de plugin |
  | `plugin-sdk/hook-runtime` | Helpers de pipeline de hook | Helpers partagés de pipeline de Webhook/hook interne |
  | `plugin-sdk/lazy-runtime` | Helpers d’exécution paresseuse | `createLazyRuntimeModule`, `createLazyRuntimeMethod`, `createLazyRuntimeMethodBinder`, `createLazyRuntimeNamedExport`, `createLazyRuntimeSurface` |
  | `plugin-sdk/process-runtime` | Helpers de processus | Helpers partagés d’exécution |
  | `plugin-sdk/cli-runtime` | Helpers d’exécution CLI | Formatage de commande, attentes, helpers de version |
  | `plugin-sdk/gateway-runtime` | Helpers de Gateway | Helpers de client Gateway et de patch de statut de canal |
  | `plugin-sdk/config-runtime` | Helpers de configuration | Helpers de chargement/écriture de configuration |
  | `plugin-sdk/telegram-command-config` | Helpers de commandes Telegram | Helpers de validation de commandes Telegram à repli stable lorsque la surface de contrat Telegram intégrée n’est pas disponible |
  | `plugin-sdk/approval-runtime` | Helpers de prompt d’approbation | Charge utile d’approbation exec/plugin, helpers de capacité/profil d’approbation, helpers de routage/d’exécution d’approbation native |
  | `plugin-sdk/approval-auth-runtime` | Helpers d’authentification d’approbation | Résolution de l’approbateur, authentification d’action dans le même chat |
  | `plugin-sdk/approval-client-runtime` | Helpers de client d’approbation | Helpers de profil/filtre d’approbation exec native |
  | `plugin-sdk/approval-delivery-runtime` | Helpers de livraison d’approbation | Adaptateurs de capacité/livraison d’approbation native |
  | `plugin-sdk/approval-gateway-runtime` | Helpers Gateway d’approbation | Helper partagé de résolution Gateway d’approbation |
  | `plugin-sdk/approval-handler-adapter-runtime` | Helpers d’adaptateur d’approbation | Helpers légers de chargement d’adaptateur d’approbation native pour les points d’entrée de canal sensibles au temps de chargement |
  | `plugin-sdk/approval-handler-runtime` | Helpers de handler d’approbation | Helpers plus larges d’exécution de handler d’approbation ; préférez les points d’entrée plus ciblés adapter/gateway lorsqu’ils suffisent |
  | `plugin-sdk/approval-native-runtime` | Helpers de cible d’approbation | Helpers de liaison cible/compte d’approbation native |
  | `plugin-sdk/approval-reply-runtime` | Helpers de réponse d’approbation | Helpers de charge utile de réponse d’approbation exec/plugin |
  | `plugin-sdk/channel-runtime-context` | Helpers de contexte d’exécution de canal | Helpers génériques register/get/watch du contexte d’exécution de canal |
  | `plugin-sdk/security-runtime` | Helpers de sécurité | Helpers partagés de confiance, filtrage DM, contenu externe et collecte de secrets |
  | `plugin-sdk/ssrf-policy` | Helpers de stratégie SSRF | Helpers de liste d’autorisation d’hôtes et de stratégie de réseau privé |
  | `plugin-sdk/ssrf-runtime` | Helpers d’exécution SSRF | Helpers de répartiteur épinglé, fetch protégé, stratégie SSRF |
  | `plugin-sdk/collection-runtime` | Helpers de cache borné | `pruneMapToMaxSize` |
  | `plugin-sdk/diagnostic-runtime` | Helpers de filtrage des diagnostics | `isDiagnosticFlagEnabled`, `isDiagnosticsEnabled` |
  | `plugin-sdk/error-runtime` | Helpers de formatage des erreurs | `formatUncaughtError`, `isApprovalNotFoundError`, helpers de graphe d’erreurs |
  | `plugin-sdk/fetch-runtime` | Helpers de fetch/proxy encapsulés | `resolveFetch`, helpers de proxy |
  | `plugin-sdk/host-runtime` | Helpers de normalisation d’hôte | `normalizeHostname`, `normalizeScpRemoteHost` |
  | `plugin-sdk/retry-runtime` | Helpers de retry | `RetryConfig`, `retryAsync`, exécuteurs de stratégie |
  | `plugin-sdk/allow-from` | Formatage de liste d’autorisation | `formatAllowFromLowercase` |
  | `plugin-sdk/allowlist-resolution` | Mappage des entrées de liste d’autorisation | `mapAllowlistResolutionInputs` |
  | `plugin-sdk/command-auth` | Helpers de filtrage de commande et de surface de commande | `resolveControlCommandGate`, helpers d’autorisation d’expéditeur, helpers de registre de commandes |
  | `plugin-sdk/command-status` | Rendus de statut/aide des commandes | `buildCommandsMessage`, `buildCommandsMessagePaginated`, `buildHelpMessage` |
  | `plugin-sdk/secret-input` | Analyse des entrées de secret | Helpers d’entrée de secret |
  | `plugin-sdk/webhook-ingress` | Helpers de requête Webhook | Utilitaires de cible Webhook |
  | `plugin-sdk/webhook-request-guards` | Helpers de garde du corps de requête Webhook | Helpers de lecture/limitation du corps de requête |
  | `plugin-sdk/reply-runtime` | Exécution partagée des réponses | Envoi entrant, Heartbeat, planificateur de réponse, fragmentation |
  | `plugin-sdk/reply-dispatch-runtime` | Helpers ciblés d’envoi de réponse | Finalisation, envoi au fournisseur et helpers de libellé de conversation |
  | `plugin-sdk/reply-history` | Helpers d’historique des réponses | `buildHistoryContext`, `buildPendingHistoryContextFromMap`, `recordPendingHistoryEntry`, `clearHistoryEntriesIfEnabled` |
  | `plugin-sdk/reply-reference` | Planification des références de réponse | `createReplyReferencePlanner` |
  | `plugin-sdk/reply-chunking` | Helpers de fragmentation des réponses | Helpers de fragmentation texte/markdown |
  | `plugin-sdk/session-store-runtime` | Helpers de magasin de session | Helpers de chemin de magasin + date de mise à jour |
  | `plugin-sdk/state-paths` | Helpers de chemins d’état | Helpers de répertoire d’état et OAuth |
  | `plugin-sdk/routing` | Helpers de routage/clé de session | `resolveAgentRoute`, `buildAgentSessionKey`, `resolveDefaultAgentBoundAccountId`, helpers de normalisation de clé de session |
  | `plugin-sdk/status-helpers` | Helpers de statut de canal | Builders de résumé de statut de canal/compte, valeurs par défaut d’état d’exécution, helpers de métadonnées de problème |
  | `plugin-sdk/target-resolver-runtime` | Helpers de résolution de cible | Helpers partagés de résolution de cible |
  | `plugin-sdk/string-normalization-runtime` | Helpers de normalisation de chaîne | Helpers de normalisation de slug/chaîne |
  | `plugin-sdk/request-url` | Helpers d’URL de requête | Extraire des URL de chaîne depuis des entrées de type requête |
  | `plugin-sdk/run-command` | Helpers de commande temporisée | Exécuteur de commande temporisée avec `stdout`/`stderr` normalisés |
  | `plugin-sdk/param-readers` | Lecteurs de paramètres | Lecteurs de paramètres d’outil/CLI communs |
  | `plugin-sdk/tool-payload` | Extraction de charge utile d’outil | Extraire des charges utiles normalisées depuis des objets de résultat d’outil |
  | `plugin-sdk/tool-send` | Extraction d’envoi d’outil | Extraire des champs de cible d’envoi canoniques depuis les arguments d’outil |
  | `plugin-sdk/temp-path` | Helpers de chemin temporaire | Helpers partagés de chemin temporaire de téléchargement |
  | `plugin-sdk/logging-core` | Helpers de journalisation | Helpers de logger de sous-système et de masquage |
  | `plugin-sdk/markdown-table-runtime` | Helpers de tableau Markdown | Helpers de mode de tableau Markdown |
  | `plugin-sdk/reply-payload` | Types de réponse de message | Types de charge utile de réponse |
  | `plugin-sdk/provider-setup` | Helpers organisés de configuration de fournisseur local/autohébergé | Helpers de découverte/configuration de fournisseur autohébergé |
  | `plugin-sdk/self-hosted-provider-setup` | Helpers ciblés de configuration de fournisseur autohébergé compatible OpenAI | Les mêmes helpers de découverte/configuration de fournisseur autohébergé |
  | `plugin-sdk/provider-auth-runtime` | Helpers d’authentification d’exécution du fournisseur | Helpers de résolution de clé API à l’exécution |
  | `plugin-sdk/provider-auth-api-key` | Helpers de configuration de clé API du fournisseur | Helpers d’intégration/écriture de profil de clé API |
  | `plugin-sdk/provider-auth-result` | Helpers de résultat d’authentification du fournisseur | Builder standard de résultat d’authentification OAuth |
  | `plugin-sdk/provider-auth-login` | Helpers de connexion interactive du fournisseur | Helpers partagés de connexion interactive |
  | `plugin-sdk/provider-selection-runtime` | Helpers de sélection de fournisseur | Sélection du fournisseur configuré ou automatique et fusion de configuration brute de fournisseur |
  | `plugin-sdk/provider-env-vars` | Helpers de variables d’environnement du fournisseur | Helpers de recherche de variable d’environnement d’authentification du fournisseur |
  | `plugin-sdk/provider-model-shared` | Helpers partagés de modèle/relecture du fournisseur | `ProviderReplayFamily`, `buildProviderReplayFamilyHooks`, `normalizeModelCompat`, builders partagés de stratégie de relecture, helpers de point de terminaison du fournisseur et helpers de normalisation d’identifiant de modèle |
  | `plugin-sdk/provider-catalog-shared` | Helpers partagés de catalogue de fournisseur | `findCatalogTemplate`, `buildSingleProviderApiKeyCatalog`, `supportsNativeStreamingUsageCompat`, `applyProviderNativeStreamingUsageCompat` |
  | `plugin-sdk/provider-onboard` | Patches d’intégration du fournisseur | Helpers de configuration d’intégration |
  | `plugin-sdk/provider-http` | Helpers HTTP du fournisseur | Helpers génériques de capacité HTTP/point de terminaison du fournisseur, y compris les helpers de formulaire multipart pour la transcription audio |
  | `plugin-sdk/provider-web-fetch` | Helpers web-fetch du fournisseur | Helpers d’enregistrement/cache de fournisseur web-fetch |
  | `plugin-sdk/provider-web-search-config-contract` | Helpers de configuration de recherche web du fournisseur | Helpers ciblés de configuration/identifiants de recherche web pour les fournisseurs qui n’ont pas besoin du câblage d’activation du plugin |
  | `plugin-sdk/provider-web-search-contract` | Helpers de contrat de recherche web du fournisseur | Helpers ciblés de contrat de configuration/identifiants de recherche web tels que `createWebSearchProviderContractFields`, `enablePluginInConfig`, `resolveProviderWebSearchPluginConfig` et des setters/getters d’identifiants à portée limitée |
  | `plugin-sdk/provider-web-search` | Helpers de recherche web du fournisseur | Helpers d’enregistrement/cache/exécution de fournisseur de recherche web |
  | `plugin-sdk/provider-tools` | Helpers de compatibilité outil/schéma du fournisseur | `ProviderToolCompatFamily`, `buildProviderToolCompatFamilyHooks`, nettoyage de schéma Gemini + diagnostics, et helpers de compatibilité xAI tels que `resolveXaiModelCompatPatch` / `applyXaiModelCompat` |
  | `plugin-sdk/provider-usage` | Helpers d’utilisation du fournisseur | `fetchClaudeUsage`, `fetchGeminiUsage`, `fetchGithubCopilotUsage` et autres helpers d’utilisation du fournisseur |
  | `plugin-sdk/provider-stream` | Helpers d’enveloppe de flux du fournisseur | `ProviderStreamFamily`, `buildProviderStreamFamilyHooks`, `composeProviderStreamWrappers`, types d’enveloppe de flux, et helpers partagés d’enveloppe Anthropic/Bedrock/Google/Kilocode/Moonshot/OpenAI/OpenRouter/Z.A.I/MiniMax/Copilot |
  | `plugin-sdk/provider-transport-runtime` | Helpers de transport du fournisseur | Helpers de transport natif du fournisseur tels que fetch protégé, transformations de messages de transport et flux d’événements de transport inscriptibles |
  | `plugin-sdk/keyed-async-queue` | File asynchrone ordonnée | `KeyedAsyncQueue` |
  | `plugin-sdk/media-runtime` | Helpers média partagés | Helpers de récupération/transformation/stockage de média ainsi que builders de charge utile média |
  | `plugin-sdk/media-generation-runtime` | Helpers partagés de génération de média | Helpers partagés de basculement, sélection de candidats et messages de modèle manquant pour la génération d’image/vidéo/musique |
  | `plugin-sdk/media-understanding` | Helpers de compréhension des médias | Types de fournisseur de compréhension des médias ainsi qu’exports de helpers image/audio destinés aux fournisseurs |
  | `plugin-sdk/text-runtime` | Helpers texte partagés | Suppression du texte visible par l’assistant, helpers de rendu/fragmentation/tableau markdown, helpers de masquage, helpers de balise de directive, utilitaires de texte sûr et helpers associés de texte/journalisation |
  | `plugin-sdk/text-chunking` | Helpers de fragmentation du texte | Helper de fragmentation de texte sortant |
  | `plugin-sdk/speech` | Helpers de parole | Types de fournisseur de parole ainsi que helpers de directive, registre et validation destinés aux fournisseurs |
  | `plugin-sdk/speech-core` | Cœur partagé de la parole | Types de fournisseur de parole, registre, directives, normalisation |
  | `plugin-sdk/realtime-transcription` | Helpers de transcription temps réel | Types de fournisseur, helpers de registre et helper partagé de session WebSocket |
  | `plugin-sdk/realtime-voice` | Helpers de voix temps réel | Types de fournisseur, helpers de registre/résolution et helpers de session de pont |
  | `plugin-sdk/image-generation-core` | Cœur partagé de génération d’image | Types de génération d’image, helpers de basculement, d’authentification et de registre |
  | `plugin-sdk/music-generation` | Helpers de génération musicale | Types de fournisseur/requête/résultat de génération musicale |
  | `plugin-sdk/music-generation-core` | Cœur partagé de génération musicale | Types de génération musicale, helpers de basculement, recherche de fournisseur et analyse de model-ref |
  | `plugin-sdk/video-generation` | Helpers de génération vidéo | Types de fournisseur/requête/résultat de génération vidéo |
  | `plugin-sdk/video-generation-core` | Cœur partagé de génération vidéo | Types de génération vidéo, helpers de basculement, recherche de fournisseur et analyse de model-ref |
  | `plugin-sdk/interactive-runtime` | Helpers de réponse interactive | Normalisation/réduction de charge utile de réponse interactive |
  | `plugin-sdk/channel-config-primitives` | Primitives de configuration de canal | Primitives ciblées de config-schema de canal |
  | `plugin-sdk/channel-config-writes` | Helpers d’écriture de configuration de canal | Helpers d’autorisation d’écriture de configuration de canal |
  | `plugin-sdk/channel-plugin-common` | Prélude de canal partagé | Exports de prélude de plugin de canal partagé |
  | `plugin-sdk/channel-status` | Helpers de statut de canal | Helpers partagés d’instantané/résumé de statut de canal |
  | `plugin-sdk/allowlist-config-edit` | Helpers de configuration de liste d’autorisation | Helpers de lecture/édition de configuration de liste d’autorisation |
  | `plugin-sdk/group-access` | Helpers d’accès de groupe | Helpers partagés de décision d’accès de groupe |
  | `plugin-sdk/direct-dm` | Helpers de DM direct | Helpers partagés d’authentification/garde de DM direct |
  | `plugin-sdk/extension-shared` | Helpers partagés d’extension | Primitives de helpers de canal passif/statut et de proxy ambiant |
  | `plugin-sdk/webhook-targets` | Helpers de cible Webhook | Registre de cibles Webhook et helpers d’installation de route |
  | `plugin-sdk/webhook-path` | Helpers de chemin Webhook | Helpers de normalisation de chemin Webhook |
  | `plugin-sdk/web-media` | Helpers web media partagés | Helpers de chargement de média distant/local |
  | `plugin-sdk/zod` | Réexportation de Zod | `zod` réexporté pour les consommateurs du SDK de Plugin |
  | `plugin-sdk/memory-core` | Helpers intégrés memory-core | Surface de helpers du gestionnaire/configuration/fichier/CLI de mémoire |
  | `plugin-sdk/memory-core-engine-runtime` | Façade d’exécution du moteur mémoire | Façade d’exécution d’indexation/recherche mémoire |
  | `plugin-sdk/memory-core-host-engine-foundation` | Moteur de fondation de l’hôte mémoire | Exports du moteur de fondation de l’hôte mémoire |
  | `plugin-sdk/memory-core-host-engine-embeddings` | Moteur d’embeddings de l’hôte mémoire | Contrats d’embeddings mémoire, accès au registre, fournisseur local et helpers génériques de lot/distant ; les fournisseurs distants concrets vivent dans leurs plugins propriétaires |
  | `plugin-sdk/memory-core-host-engine-qmd` | Moteur QMD de l’hôte mémoire | Exports du moteur QMD de l’hôte mémoire |
  | `plugin-sdk/memory-core-host-engine-storage` | Moteur de stockage de l’hôte mémoire | Exports du moteur de stockage de l’hôte mémoire |
  | `plugin-sdk/memory-core-host-multimodal` | Helpers multimodaux de l’hôte mémoire | Helpers multimodaux de l’hôte mémoire |
  | `plugin-sdk/memory-core-host-query` | Helpers de requête de l’hôte mémoire | Helpers de requête de l’hôte mémoire |
  | `plugin-sdk/memory-core-host-secret` | Helpers de secret de l’hôte mémoire | Helpers de secret de l’hôte mémoire |
  | `plugin-sdk/memory-core-host-events` | Helpers de journal d’événements de l’hôte mémoire | Helpers de journal d’événements de l’hôte mémoire |
  | `plugin-sdk/memory-core-host-status` | Helpers de statut de l’hôte mémoire | Helpers de statut de l’hôte mémoire |
  | `plugin-sdk/memory-core-host-runtime-cli` | Exécution CLI de l’hôte mémoire | Helpers d’exécution CLI de l’hôte mémoire |
  | `plugin-sdk/memory-core-host-runtime-core` | Exécution cœur de l’hôte mémoire | Helpers d’exécution cœur de l’hôte mémoire |
  | `plugin-sdk/memory-core-host-runtime-files` | Helpers de fichier/exécution de l’hôte mémoire | Helpers de fichier/exécution de l’hôte mémoire |
  | `plugin-sdk/memory-host-core` | Alias d’exécution cœur de l’hôte mémoire | Alias neutre vis-à-vis du fournisseur pour les helpers d’exécution cœur de l’hôte mémoire |
  | `plugin-sdk/memory-host-events` | Alias de journal d’événements de l’hôte mémoire | Alias neutre vis-à-vis du fournisseur pour les helpers de journal d’événements de l’hôte mémoire |
  | `plugin-sdk/memory-host-files` | Alias de fichier/exécution de l’hôte mémoire | Alias neutre vis-à-vis du fournisseur pour les helpers de fichier/exécution de l’hôte mémoire |
  | `plugin-sdk/memory-host-markdown` | Helpers de markdown géré | Helpers partagés de markdown géré pour les plugins adjacents à la mémoire |
  | `plugin-sdk/memory-host-search` | Façade de recherche Active Memory | Façade d’exécution paresseuse du gestionnaire de recherche Active Memory |
  | `plugin-sdk/memory-host-status` | Alias de statut de l’hôte mémoire | Alias neutre vis-à-vis du fournisseur pour les helpers de statut de l’hôte mémoire |
  | `plugin-sdk/memory-lancedb` | Helpers intégrés memory-lancedb | Surface de helpers memory-lancedb |
  | `plugin-sdk/testing` | Utilitaires de test | Helpers de test et mocks |
</Accordion>

Ce tableau représente volontairement le sous-ensemble courant pour la migration, et non la surface complète du SDK. La liste complète des plus de 200 points d’entrée se trouve dans `scripts/lib/plugin-sdk-entrypoints.json`.

Cette liste inclut encore certains points d’entrée de helpers pour plugins intégrés tels que `plugin-sdk/feishu`, `plugin-sdk/feishu-setup`, `plugin-sdk/zalo`, `plugin-sdk/zalo-setup` et `plugin-sdk/matrix*`. Ils restent exportés pour la maintenance et la compatibilité des plugins intégrés, mais ils sont volontairement omis du tableau de migration courant et ne constituent pas la cible recommandée pour le nouveau code de plugin.

La même règle s’applique à d’autres familles de helpers intégrés telles que :

- helpers de prise en charge du navigateur : `plugin-sdk/browser-cdp`, `plugin-sdk/browser-config-runtime`, `plugin-sdk/browser-config-support`, `plugin-sdk/browser-control-auth`, `plugin-sdk/browser-node-runtime`, `plugin-sdk/browser-profiles`, `plugin-sdk/browser-security-runtime`, `plugin-sdk/browser-setup-tools`, `plugin-sdk/browser-support`
- Matrix : `plugin-sdk/matrix*`
- LINE : `plugin-sdk/line*`
- IRC : `plugin-sdk/irc*`
- surfaces de helper/plugin intégrées comme `plugin-sdk/googlechat`,
  `plugin-sdk/zalouser`, `plugin-sdk/bluebubbles*`,
  `plugin-sdk/mattermost*`, `plugin-sdk/msteams`,
  `plugin-sdk/nextcloud-talk`, `plugin-sdk/nostr`, `plugin-sdk/tlon`,
  `plugin-sdk/twitch`,
  `plugin-sdk/github-copilot-login`, `plugin-sdk/github-copilot-token`,
  `plugin-sdk/diagnostics-otel`, `plugin-sdk/diffs`, `plugin-sdk/llm-task`,
  `plugin-sdk/thread-ownership` et `plugin-sdk/voice-call`

`plugin-sdk/github-copilot-token` expose actuellement la surface ciblée de helper de jeton `DEFAULT_COPILOT_API_BASE_URL`, `deriveCopilotApiBaseUrlFromToken` et `resolveCopilotApiToken`.

Utilisez l’import le plus ciblé correspondant à la tâche. Si vous ne trouvez pas un export, consultez la source dans `src/plugin-sdk/` ou demandez dans Discord.

## Calendrier de suppression

| Quand | Ce qui se passe |
| ---------------------- | ----------------------------------------------------------------------- |
| **Maintenant** | Les surfaces obsolètes émettent des avertissements à l’exécution |
| **Prochaine version majeure** | Les surfaces obsolètes seront supprimées ; les plugins qui les utilisent encore échoueront |

Tous les plugins du cœur ont déjà été migrés. Les plugins externes doivent migrer avant la prochaine version majeure.

## Masquer temporairement les avertissements

Définissez ces variables d’environnement pendant que vous travaillez sur la migration :

```bash
OPENCLAW_SUPPRESS_PLUGIN_SDK_COMPAT_WARNING=1 openclaw gateway run
OPENCLAW_SUPPRESS_EXTENSION_API_WARNING=1 openclaw gateway run
```

Il s’agit d’une échappatoire temporaire, et non d’une solution permanente.

## Lié

- [Pour commencer](/fr/plugins/building-plugins) — créez votre premier plugin
- [Vue d’ensemble du SDK](/fr/plugins/sdk-overview) — référence complète des imports par sous-chemin
- [Plugins de canal](/fr/plugins/sdk-channel-plugins) — créer des plugins de canal
- [Plugins de fournisseur](/fr/plugins/sdk-provider-plugins) — créer des plugins de fournisseur
- [Internes des plugins](/fr/plugins/architecture) — analyse approfondie de l’architecture
- [Manifeste de plugin](/fr/plugins/manifest) — référence du schéma de manifeste
