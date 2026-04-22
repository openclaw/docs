---
read_when:
    - Vous voyez l’avertissement OPENCLAW_PLUGIN_SDK_COMPAT_DEPRECATED
    - Vous voyez l’avertissement OPENCLAW_EXTENSION_API_DEPRECATED
    - Vous mettez à jour un plugin vers l’architecture moderne des plugins
    - Vous maintenez un plugin OpenClaw externe
sidebarTitle: Migrate to SDK
summary: Migrer de la couche héritée de rétrocompatibilité vers le Plugin SDK moderne
title: Migration du Plugin SDK
x-i18n:
    generated_at: "2026-04-22T04:25:21Z"
    model: gpt-5.4
    provider: openai
    source_hash: 72c9fc2d77f5feda336a1119fc42ebe088d5037f99c2b3843e9f06efed20386d
    source_path: plugins/sdk-migration.md
    workflow: 15
---

# Migration du Plugin SDK

OpenClaw est passé d’une large couche de rétrocompatibilité à une architecture de plugins moderne
avec des imports ciblés et documentés. Si votre plugin a été construit avant
la nouvelle architecture, ce guide vous aide à migrer.

## Ce qui change

L’ancien système de plugins fournissait deux surfaces très larges qui permettaient aux plugins d’importer
tout ce dont ils avaient besoin depuis un seul point d’entrée :

- **`openclaw/plugin-sdk/compat`** — un import unique qui réexportait des dizaines de
  helpers. Il a été introduit pour maintenir le fonctionnement des anciens plugins basés sur des hooks pendant la construction de la
  nouvelle architecture de plugins.
- **`openclaw/extension-api`** — un pont qui donnait aux plugins un accès direct à
  des helpers côté hôte comme le runner d’agent intégré.

Ces deux surfaces sont maintenant **dépréciées**. Elles fonctionnent encore à l’exécution, mais les nouveaux
plugins ne doivent pas les utiliser, et les plugins existants doivent migrer avant que la prochaine
version majeure ne les supprime.

<Warning>
  La couche de rétrocompatibilité sera supprimée dans une future version majeure.
  Les plugins qui importent encore depuis ces surfaces cesseront de fonctionner à ce moment-là.
</Warning>

## Pourquoi cela a changé

L’ancienne approche causait des problèmes :

- **Démarrage lent** — importer un helper chargeait des dizaines de modules sans rapport
- **Dépendances circulaires** — de larges réexportations facilitaient la création de cycles d’import
- **Surface d’API peu claire** — aucun moyen de distinguer quelles exportations étaient stables et lesquelles étaient internes

Le Plugin SDK moderne corrige cela : chaque chemin d’import (`openclaw/plugin-sdk/\<subpath\>`)
est un module petit, autonome, avec un objectif clair et un contrat documenté.

Les seams de commodité hérités spécifiques aux providers pour les canaux intégrés ont également disparu. Les imports
comme `openclaw/plugin-sdk/slack`, `openclaw/plugin-sdk/discord`,
`openclaw/plugin-sdk/signal`, `openclaw/plugin-sdk/whatsapp`,
les seams de helpers marqués par canal, et
`openclaw/plugin-sdk/telegram-core` étaient des raccourcis privés du mono-repo, pas
des contrats de plugin stables. Utilisez plutôt des sous-chemins SDK génériques et étroits. Dans l’espace de travail du plugin intégré,
conservez les helpers propres au provider dans le `api.ts` ou `runtime-api.ts`
de ce plugin.

Exemples actuels de providers intégrés :

- Anthropic conserve les helpers de flux spécifiques à Claude dans son propre seam `api.ts` /
  `contract-api.ts`
- OpenAI conserve les builders de provider, les helpers de modèle par défaut et les
  builders de provider temps réel dans son propre `api.ts`
- OpenRouter conserve les helpers de builder de provider et d’onboarding/configuration dans son propre
  `api.ts`

## Comment migrer

<Steps>
  <Step title="Migrer les gestionnaires natifs d’approbation vers les faits de capacité">
    Les plugins de canal capables d’approbation exposent désormais le comportement d’approbation natif via
    `approvalCapability.nativeRuntime` plus le registre partagé de contexte runtime.

    Changements principaux :

    - Remplacez `approvalCapability.handler.loadRuntime(...)` par
      `approvalCapability.nativeRuntime`
    - Déplacez l’authentification/la distribution spécifiques aux approbations hors de l’ancien câblage `plugin.auth` /
      `plugin.approvals` vers `approvalCapability`
    - `ChannelPlugin.approvals` a été supprimé du contrat public
      de plugin de canal ; déplacez les champs delivery/native/render vers `approvalCapability`
    - `plugin.auth` reste pour les flux de connexion/déconnexion de canal uniquement ; les hooks
      d’authentification d’approbation qui s’y trouvent ne sont plus lus par le core
    - Enregistrez les objets runtime possédés par le canal comme les clients, jetons ou applications
      Bolt via `openclaw/plugin-sdk/channel-runtime-context`
    - N’envoyez pas d’avis de redirection possédés par le plugin depuis les gestionnaires d’approbation natifs ;
      le core possède désormais les avis routed-elsewhere issus des résultats réels de distribution
    - Lors du passage de `channelRuntime` dans `createChannelManager(...)`, fournissez une
      vraie surface `createPluginRuntime().channel`. Les stubs partiels sont rejetés.

    Voir `/plugins/sdk-channel-plugins` pour la disposition actuelle des capacités d’approbation.

  </Step>

  <Step title="Auditer le comportement de repli du wrapper Windows">
    Si votre plugin utilise `openclaw/plugin-sdk/windows-spawn`, les wrappers Windows `.cmd`/`.bat`
    non résolus échouent désormais en mode fermé sauf si vous passez explicitement `allowShellFallback: true`.

    ```typescript
    // Avant
    const program = applyWindowsSpawnProgramPolicy({ candidate });

    // Après
    const program = applyWindowsSpawnProgramPolicy({
      candidate,
      // Ne définissez ceci que pour les appelants de compatibilité de confiance qui
      // acceptent intentionnellement le repli médié par le shell.
      allowShellFallback: true,
    });
    ```

    Si votre appelant ne dépend pas intentionnellement du repli shell, ne définissez pas
    `allowShellFallback` et gérez plutôt l’erreur levée.

  </Step>

  <Step title="Trouver les imports dépréciés">
    Recherchez dans votre plugin les imports depuis l’une ou l’autre surface dépréciée :

    ```bash
    grep -r "plugin-sdk/compat" my-plugin/
    grep -r "openclaw/extension-api" my-plugin/
    ```

  </Step>

  <Step title="Remplacer par des imports ciblés">
    Chaque exportation de l’ancienne surface correspond à un chemin d’import moderne spécifique :

    ```typescript
    // Avant (couche de rétrocompatibilité dépréciée)
    import {
      createChannelReplyPipeline,
      createPluginRuntimeStore,
      resolveControlCommandGate,
    } from "openclaw/plugin-sdk/compat";

    // Après (imports modernes ciblés)
    import { createChannelReplyPipeline } from "openclaw/plugin-sdk/channel-reply-pipeline";
    import { createPluginRuntimeStore } from "openclaw/plugin-sdk/runtime-store";
    import { resolveControlCommandGate } from "openclaw/plugin-sdk/command-auth";
    ```

    Pour les helpers côté hôte, utilisez le runtime de plugin injecté au lieu d’importer
    directement :

    ```typescript
    // Avant (pont extension-api déprécié)
    import { runEmbeddedPiAgent } from "openclaw/extension-api";
    const result = await runEmbeddedPiAgent({ sessionId, prompt });

    // Après (runtime injecté)
    const result = await api.runtime.agent.runEmbeddedPiAgent({ sessionId, prompt });
    ```

    Le même schéma s’applique aux autres helpers hérités du pont :

    | Ancien import | Équivalent moderne |
    | --- | --- |
    | `resolveAgentDir` | `api.runtime.agent.resolveAgentDir` |
    | `resolveAgentWorkspaceDir` | `api.runtime.agent.resolveAgentWorkspaceDir` |
    | `resolveAgentIdentity` | `api.runtime.agent.resolveAgentIdentity` |
    | `resolveThinkingDefault` | `api.runtime.agent.resolveThinkingDefault` |
    | `resolveAgentTimeoutMs` | `api.runtime.agent.resolveAgentTimeoutMs` |
    | `ensureAgentWorkspace` | `api.runtime.agent.ensureAgentWorkspace` |
    | helpers de store de session | `api.runtime.agent.session.*` |

  </Step>

  <Step title="Compiler et tester">
    ```bash
    pnpm build
    pnpm test -- my-plugin/
    ```
  </Step>
</Steps>

## Référence des chemins d’import

  <Accordion title="Table commune des chemins d’import">
  | Chemin d’import | Objectif | Exportations clés |
  | --- | --- | --- |
  | `plugin-sdk/plugin-entry` | Helper d’entrée de plugin canonique | `definePluginEntry` |
  | `plugin-sdk/core` | Réexportation globale héritée pour les définitions/builders d’entrée de canal | `defineChannelPluginEntry`, `createChatChannelPlugin` |
  | `plugin-sdk/config-schema` | Exportation du schéma de configuration racine | `OpenClawSchema` |
  | `plugin-sdk/provider-entry` | Helper d’entrée à provider unique | `defineSingleProviderPluginEntry` |
  | `plugin-sdk/channel-core` | Définitions/builders ciblés d’entrée de canal | `defineChannelPluginEntry`, `defineSetupPluginEntry`, `createChatChannelPlugin`, `createChannelPluginBase` |
  | `plugin-sdk/setup` | Helpers partagés d’assistant de configuration | Prompts d’allowlist, builders d’état de configuration |
  | `plugin-sdk/setup-runtime` | Helpers d’exécution au moment de la configuration | Adaptateurs de patch de configuration sûrs à l’import, helpers de notes de recherche, `promptResolvedAllowFrom`, `splitSetupEntries`, proxys de configuration déléguée |
  | `plugin-sdk/setup-adapter-runtime` | Helpers d’adaptateur de configuration | `createEnvPatchedAccountSetupAdapter` |
  | `plugin-sdk/setup-tools` | Helpers d’outillage de configuration | `formatCliCommand`, `detectBinary`, `extractArchive`, `resolveBrewExecutable`, `formatDocsLink`, `CONFIG_DIR` |
  | `plugin-sdk/account-core` | Helpers multi-comptes | Helpers de liste de comptes/configuration/garde-fous d’action de compte |
  | `plugin-sdk/account-id` | Helpers d’ID de compte | `DEFAULT_ACCOUNT_ID`, normalisation des ID de compte |
  | `plugin-sdk/account-resolution` | Helpers de recherche de compte | Helpers de recherche de compte + repli par défaut |
  | `plugin-sdk/account-helpers` | Helpers de compte ciblés | Helpers de liste de comptes/actions de compte |
  | `plugin-sdk/channel-setup` | Adaptateurs d’assistant de configuration | `createOptionalChannelSetupSurface`, `createOptionalChannelSetupAdapter`, `createOptionalChannelSetupWizard`, plus `DEFAULT_ACCOUNT_ID`, `createTopLevelChannelDmPolicy`, `setSetupChannelEnabled`, `splitSetupEntries` |
  | `plugin-sdk/channel-pairing` | Primitifs d’appairage MP | `createChannelPairingController` |
  | `plugin-sdk/channel-reply-pipeline` | Câblage de préfixe de réponse + indicateur de saisie | `createChannelReplyPipeline` |
  | `plugin-sdk/channel-config-helpers` | Fabriques d’adaptateurs de configuration | `createHybridChannelConfigAdapter` |
  | `plugin-sdk/channel-config-schema` | Builders de schéma de configuration | Types de schéma de configuration de canal |
  | `plugin-sdk/telegram-command-config` | Helpers de configuration des commandes Telegram | Normalisation des noms de commande, trim des descriptions, validation des doublons/conflits |
  | `plugin-sdk/channel-policy` | Résolution de politique de groupe/MP | `resolveChannelGroupRequireMention` |
  | `plugin-sdk/channel-lifecycle` | Helpers de cycle de vie de statut de compte et de flux de brouillon | `createAccountStatusSink`, helpers de finalisation d’aperçu brouillon |
  | `plugin-sdk/inbound-envelope` | Helpers d’enveloppe entrante | Helpers partagés de routage + construction d’enveloppe |
  | `plugin-sdk/inbound-reply-dispatch` | Helpers de réponse entrante | Helpers partagés d’enregistrement et de distribution |
  | `plugin-sdk/messaging-targets` | Analyse des cibles de messagerie | Helpers d’analyse/correspondance des cibles |
  | `plugin-sdk/outbound-media` | Helpers de média sortant | Chargement partagé des médias sortants |
  | `plugin-sdk/outbound-runtime` | Helpers d’exécution sortante | Helpers d’identité sortante/délégué d’envoi et planification de charge utile |
  | `plugin-sdk/thread-bindings-runtime` | Helpers de liaison de fil | Helpers de cycle de vie et d’adaptateur des liaisons de fil |
  | `plugin-sdk/agent-media-payload` | Helpers hérités de charge utile média | Builder de charge utile média d’agent pour dispositions de champs héritées |
  | `plugin-sdk/channel-runtime` | Shim de compatibilité déprécié | Uniquement utilitaires hérités d’exécution de canal |
  | `plugin-sdk/channel-send-result` | Types de résultat d’envoi | Types de résultat de réponse |
  | `plugin-sdk/runtime-store` | Stockage persistant de plugin | `createPluginRuntimeStore` |
  | `plugin-sdk/runtime` | Helpers d’exécution larges | Helpers d’exécution/journalisation/sauvegarde/installation de plugin |
  | `plugin-sdk/runtime-env` | Helpers ciblés d’environnement d’exécution | Helpers de logger/environnement d’exécution, délai d’expiration, nouvelle tentative et backoff |
  | `plugin-sdk/plugin-runtime` | Helpers partagés d’exécution de plugin | Helpers de commandes/hooks/http/interactive de plugin |
  | `plugin-sdk/hook-runtime` | Helpers de pipeline de hook | Helpers partagés de pipeline webhook/hook interne |
  | `plugin-sdk/lazy-runtime` | Helpers de runtime paresseux | `createLazyRuntimeModule`, `createLazyRuntimeMethod`, `createLazyRuntimeMethodBinder`, `createLazyRuntimeNamedExport`, `createLazyRuntimeSurface` |
  | `plugin-sdk/process-runtime` | Helpers de processus | Helpers partagés d’exécution |
  | `plugin-sdk/cli-runtime` | Helpers d’exécution CLI | Helpers de formatage de commandes, attentes, versions |
  | `plugin-sdk/gateway-runtime` | Helpers Gateway | Helpers de client Gateway et de patch de statut de canal |
  | `plugin-sdk/config-runtime` | Helpers de configuration | Helpers de chargement/écriture de configuration |
  | `plugin-sdk/telegram-command-config` | Helpers de commande Telegram | Helpers de validation de commandes Telegram stables en repli lorsque la surface de contrat Telegram intégrée n’est pas disponible |
  | `plugin-sdk/approval-runtime` | Helpers de prompt d’approbation | Helpers de charge utile d’approbation exec/plugin, de capacité/profil d’approbation, et de routage/exécution d’approbation native |
  | `plugin-sdk/approval-auth-runtime` | Helpers d’auth d’approbation | Résolution des approbateurs, auth d’action dans le même chat |
  | `plugin-sdk/approval-client-runtime` | Helpers de client d’approbation | Helpers natifs de profil/filtre d’approbation exec |
  | `plugin-sdk/approval-delivery-runtime` | Helpers de distribution d’approbation | Adaptateurs de capacité/distribution d’approbation native |
  | `plugin-sdk/approval-gateway-runtime` | Helpers Gateway d’approbation | Helper partagé de résolution Gateway d’approbation |
  | `plugin-sdk/approval-handler-adapter-runtime` | Helpers d’adaptateur d’approbation | Helpers légers de chargement d’adaptateur d’approbation native pour points d’entrée de canal à chaud |
  | `plugin-sdk/approval-handler-runtime` | Helpers de gestionnaire d’approbation | Helpers plus larges d’exécution de gestionnaire d’approbation ; préférez les seams plus ciblées adapter/gateway lorsqu’elles suffisent |
  | `plugin-sdk/approval-native-runtime` | Helpers de cible d’approbation | Helpers natifs de liaison cible/compte d’approbation |
  | `plugin-sdk/approval-reply-runtime` | Helpers de réponse d’approbation | Helpers de charge utile de réponse d’approbation exec/plugin |
  | `plugin-sdk/channel-runtime-context` | Helpers de contexte d’exécution de canal | Helpers génériques d’enregistrement/lecture/surveillance du contexte d’exécution de canal |
  | `plugin-sdk/security-runtime` | Helpers de sécurité | Helpers partagés de confiance, filtrage des MP, contenu externe et collecte de secrets |
  | `plugin-sdk/ssrf-policy` | Helpers de politique SSRF | Helpers de liste d’autorisation d’hôte et de politique de réseau privé |
  | `plugin-sdk/ssrf-runtime` | Helpers d’exécution SSRF | Helpers de dispatcher épinglé, fetch protégé, politique SSRF |
  | `plugin-sdk/collection-runtime` | Helpers de cache borné | `pruneMapToMaxSize` |
  | `plugin-sdk/diagnostic-runtime` | Helpers de filtrage de diagnostic | `isDiagnosticFlagEnabled`, `isDiagnosticsEnabled` |
  | `plugin-sdk/error-runtime` | Helpers de formatage d’erreur | `formatUncaughtError`, `isApprovalNotFoundError`, helpers de graphe d’erreur |
  | `plugin-sdk/fetch-runtime` | Helpers fetch/proxy encapsulés | `resolveFetch`, helpers de proxy |
  | `plugin-sdk/host-runtime` | Helpers de normalisation d’hôte | `normalizeHostname`, `normalizeScpRemoteHost` |
  | `plugin-sdk/retry-runtime` | Helpers de nouvelle tentative | `RetryConfig`, `retryAsync`, exécuteurs de politique |
  | `plugin-sdk/allow-from` | Formatage d’allowlist | `formatAllowFromLowercase` |
  | `plugin-sdk/allowlist-resolution` | Mapping des entrées d’allowlist | `mapAllowlistResolutionInputs` |
  | `plugin-sdk/command-auth` | Filtrage des commandes et helpers de surface de commande | `resolveControlCommandGate`, helpers d’autorisation de l’expéditeur, helpers de registre de commandes |
  | `plugin-sdk/command-status` | Moteurs de rendu d’état/aide des commandes | `buildCommandsMessage`, `buildCommandsMessagePaginated`, `buildHelpMessage` |
  | `plugin-sdk/secret-input` | Analyse des entrées secrètes | Helpers d’entrée secrète |
  | `plugin-sdk/webhook-ingress` | Helpers de requête webhook | Utilitaires de cible webhook |
  | `plugin-sdk/webhook-request-guards` | Helpers de garde du corps webhook | Helpers de lecture/limite du corps de requête |
  | `plugin-sdk/reply-runtime` | Runtime partagé de réponse | Distribution entrante, Heartbeat, planificateur de réponse, découpage en blocs |
  | `plugin-sdk/reply-dispatch-runtime` | Helpers ciblés de distribution de réponse | Helpers de finalisation + distribution provider |
  | `plugin-sdk/reply-history` | Helpers d’historique de réponse | `buildHistoryContext`, `buildPendingHistoryContextFromMap`, `recordPendingHistoryEntry`, `clearHistoryEntriesIfEnabled` |
  | `plugin-sdk/reply-reference` | Planification des références de réponse | `createReplyReferencePlanner` |
  | `plugin-sdk/reply-chunking` | Helpers de découpage de réponse | Helpers de découpage texte/Markdown |
  | `plugin-sdk/session-store-runtime` | Helpers de store de session | Helpers de chemin de store + updated-at |
  | `plugin-sdk/state-paths` | Helpers de chemins d’état | Helpers de répertoire d’état et OAuth |
  | `plugin-sdk/routing` | Helpers de routage/clé de session | `resolveAgentRoute`, `buildAgentSessionKey`, `resolveDefaultAgentBoundAccountId`, helpers de normalisation de clé de session |
  | `plugin-sdk/status-helpers` | Helpers de statut de canal | Builders de résumé de statut canal/compte, valeurs par défaut de l’état runtime, helpers de métadonnées de problème |
  | `plugin-sdk/target-resolver-runtime` | Helpers de résolution de cible | Helpers partagés de résolution de cible |
  | `plugin-sdk/string-normalization-runtime` | Helpers de normalisation de chaîne | Helpers de normalisation slug/chaîne |
  | `plugin-sdk/request-url` | Helpers d’URL de requête | Extraire des URL chaîne depuis des entrées de type requête |
  | `plugin-sdk/run-command` | Helpers de commande temporisée | Exécuteur de commande temporisée avec stdout/stderr normalisés |
  | `plugin-sdk/param-readers` | Lecteurs de paramètres | Lecteurs de paramètres communs d’outil/CLI |
  | `plugin-sdk/tool-payload` | Extraction de charge utile d’outil | Extraire des charges utiles normalisées depuis des objets de résultat d’outil |
  | `plugin-sdk/tool-send` | Extraction d’envoi d’outil | Extraire les champs de cible d’envoi canoniques depuis les args d’outil |
  | `plugin-sdk/temp-path` | Helpers de chemin temporaire | Helpers partagés de chemin de téléchargement temporaire |
  | `plugin-sdk/logging-core` | Helpers de journalisation | Helpers de logger de sous-système et de masquage |
  | `plugin-sdk/markdown-table-runtime` | Helpers de tableau Markdown | Helpers de mode de tableau Markdown |
  | `plugin-sdk/reply-payload` | Types de réponse de message | Types de charge utile de réponse |
  | `plugin-sdk/provider-setup` | Helpers sélectionnés de configuration de provider local/autohébergé | Helpers de découverte/configuration de provider autohébergé |
  | `plugin-sdk/self-hosted-provider-setup` | Helpers ciblés de configuration de provider autohébergé compatible OpenAI | Les mêmes helpers de découverte/configuration de provider autohébergé |
  | `plugin-sdk/provider-auth-runtime` | Helpers d’auth d’exécution provider | Helpers de résolution de clé API à l’exécution |
  | `plugin-sdk/provider-auth-api-key` | Helpers de configuration de clé API provider | Helpers d’onboarding/écriture de profil de clé API |
  | `plugin-sdk/provider-auth-result` | Helpers de résultat d’auth provider | Builder standard de résultat d’auth OAuth |
  | `plugin-sdk/provider-auth-login` | Helpers de connexion interactive provider | Helpers partagés de connexion interactive |
  | `plugin-sdk/provider-env-vars` | Helpers de variables d’environnement provider | Helpers de recherche de variables d’environnement d’auth provider |
  | `plugin-sdk/provider-model-shared` | Helpers partagés de modèle/relecture provider | `ProviderReplayFamily`, `buildProviderReplayFamilyHooks`, `normalizeModelCompat`, builders partagés de politique de relecture, helpers d’endpoint provider, et helpers de normalisation d’ID de modèle |
  | `plugin-sdk/provider-catalog-shared` | Helpers partagés de catalogue provider | `findCatalogTemplate`, `buildSingleProviderApiKeyCatalog`, `supportsNativeStreamingUsageCompat`, `applyProviderNativeStreamingUsageCompat` |
  | `plugin-sdk/provider-onboard` | Patches d’onboarding provider | Helpers de configuration d’onboarding |
  | `plugin-sdk/provider-http` | Helpers HTTP provider | Helpers génériques de capacité HTTP/endpoint provider |
  | `plugin-sdk/provider-web-fetch` | Helpers web-fetch provider | Helpers d’enregistrement/cache du provider web-fetch |
  | `plugin-sdk/provider-web-search-config-contract` | Helpers de configuration de recherche web provider | Helpers ciblés de configuration/identifiants de recherche web pour les providers qui n’ont pas besoin du câblage d’activation du plugin |
  | `plugin-sdk/provider-web-search-contract` | Helpers de contrat de recherche web provider | Helpers ciblés de contrat de configuration/identifiants de recherche web comme `createWebSearchProviderContractFields`, `enablePluginInConfig`, `resolveProviderWebSearchPluginConfig` et des setters/getters d’identifiants à portée limitée |
  | `plugin-sdk/provider-web-search` | Helpers de recherche web provider | Helpers d’enregistrement/cache/runtime du provider de recherche web |
  | `plugin-sdk/provider-tools` | Helpers de compatibilité outils/schéma provider | `ProviderToolCompatFamily`, `buildProviderToolCompatFamilyHooks`, nettoyage de schéma Gemini + diagnostics, et helpers de compatibilité xAI comme `resolveXaiModelCompatPatch` / `applyXaiModelCompat` |
  | `plugin-sdk/provider-usage` | Helpers d’usage provider | `fetchClaudeUsage`, `fetchGeminiUsage`, `fetchGithubCopilotUsage`, et autres helpers d’usage provider |
  | `plugin-sdk/provider-stream` | Helpers d’encapsulation de flux provider | `ProviderStreamFamily`, `buildProviderStreamFamilyHooks`, `composeProviderStreamWrappers`, types d’encapsulateur de flux, et helpers partagés d’encapsulateur Anthropic/Bedrock/Google/Kilocode/Moonshot/OpenAI/OpenRouter/Z.A.I/MiniMax/Copilot |
  | `plugin-sdk/provider-transport-runtime` | Helpers de transport provider | Helpers de transport provider natifs comme fetch protégé, transformations de messages de transport et flux d’événements de transport inscriptibles |
  | `plugin-sdk/keyed-async-queue` | File asynchrone ordonnée | `KeyedAsyncQueue` |
  | `plugin-sdk/media-runtime` | Helpers partagés de média | Helpers de récupération/transformation/stockage des médias plus builders de charge utile média |
  | `plugin-sdk/media-generation-runtime` | Helpers partagés de génération de média | Helpers partagés de basculement, sélection de candidats et messages de modèle manquant pour la génération d’image/vidéo/musique |
  | `plugin-sdk/media-understanding` | Helpers de compréhension des médias | Types provider de compréhension des médias plus exportations de helpers image/audio côté provider |
  | `plugin-sdk/text-runtime` | Helpers partagés de texte | Suppression du texte visible par l’assistant, helpers de rendu/découpage en blocs/tableaux Markdown, helpers de masquage, helpers de balises de directive, utilitaires de texte sûr, et helpers associés de texte/journalisation |
  | `plugin-sdk/text-chunking` | Helpers de découpage en blocs de texte | Helper de découpage en blocs du texte sortant |
  | `plugin-sdk/speech` | Helpers de parole | Types provider de parole plus helpers côté provider de directives, registre et validation |
  | `plugin-sdk/speech-core` | Noyau partagé de parole | Types provider de parole, registre, directives, normalisation |
  | `plugin-sdk/realtime-transcription` | Helpers de transcription temps réel | Types provider et helpers de registre |
  | `plugin-sdk/realtime-voice` | Helpers de voix temps réel | Types provider et helpers de registre |
  | `plugin-sdk/image-generation-core` | Noyau partagé de génération d’image | Types, basculement, authentification et helpers de registre de génération d’image |
  | `plugin-sdk/music-generation` | Helpers de génération musicale | Types provider/requête/résultat de génération musicale |
  | `plugin-sdk/music-generation-core` | Noyau partagé de génération musicale | Types de génération musicale, helpers de basculement, recherche de provider et analyse des model-ref |
  | `plugin-sdk/video-generation` | Helpers de génération vidéo | Types provider/requête/résultat de génération vidéo |
  | `plugin-sdk/video-generation-core` | Noyau partagé de génération vidéo | Types de génération vidéo, helpers de basculement, recherche de provider et analyse des model-ref |
  | `plugin-sdk/interactive-runtime` | Helpers de réponse interactive | Normalisation/réduction de charge utile de réponse interactive |
  | `plugin-sdk/channel-config-primitives` | Primitifs de configuration de canal | Primitifs ciblés de config-schema de canal |
  | `plugin-sdk/channel-config-writes` | Helpers d’écriture de configuration de canal | Helpers d’autorisation d’écriture de configuration de canal |
  | `plugin-sdk/channel-plugin-common` | Prélude partagé de canal | Exportations partagées du prélude de plugin de canal |
  | `plugin-sdk/channel-status` | Helpers de statut de canal | Helpers partagés de snapshot/résumé de statut de canal |
  | `plugin-sdk/allowlist-config-edit` | Helpers de configuration d’allowlist | Helpers de lecture/édition de configuration d’allowlist |
  | `plugin-sdk/group-access` | Helpers d’accès de groupe | Helpers partagés de décision d’accès de groupe |
  | `plugin-sdk/direct-dm` | Helpers de MP directs | Helpers partagés d’auth/garde pour MP directs |
  | `plugin-sdk/extension-shared` | Helpers partagés d’extension | Primitifs de canal/statut passifs et helpers de proxy ambiant |
  | `plugin-sdk/webhook-targets` | Helpers de cible webhook | Registre de cibles webhook et helpers d’installation de routes |
  | `plugin-sdk/webhook-path` | Helpers de chemin webhook | Helpers de normalisation de chemin webhook |
  | `plugin-sdk/web-media` | Helpers partagés de média web | Helpers de chargement de média distant/local |
  | `plugin-sdk/zod` | Réexportation Zod | `zod` réexporté pour les consommateurs du Plugin SDK |
  | `plugin-sdk/memory-core` | Helpers intégrés memory-core | Surface de helpers de gestionnaire/configuration/fichier/CLI de mémoire |
  | `plugin-sdk/memory-core-engine-runtime` | Façade runtime du moteur de mémoire | Façade runtime d’indexation/recherche mémoire |
  | `plugin-sdk/memory-core-host-engine-foundation` | Moteur foundation hôte de mémoire | Exportations du moteur foundation hôte de mémoire |
  | `plugin-sdk/memory-core-host-engine-embeddings` | Moteur d’embeddings hôte de mémoire | Contrats d’embeddings mémoire, accès au registre, provider local, et helpers génériques batch/distants ; les providers distants concrets vivent dans leurs plugins propriétaires |
  | `plugin-sdk/memory-core-host-engine-qmd` | Moteur QMD hôte de mémoire | Exportations du moteur QMD hôte de mémoire |
  | `plugin-sdk/memory-core-host-engine-storage` | Moteur de stockage hôte de mémoire | Exportations du moteur de stockage hôte de mémoire |
  | `plugin-sdk/memory-core-host-multimodal` | Helpers multimodaux hôte de mémoire | Helpers multimodaux hôte de mémoire |
  | `plugin-sdk/memory-core-host-query` | Helpers de requête hôte de mémoire | Helpers de requête hôte de mémoire |
  | `plugin-sdk/memory-core-host-secret` | Helpers de secret hôte de mémoire | Helpers de secret hôte de mémoire |
  | `plugin-sdk/memory-core-host-events` | Helpers de journal d’événements hôte de mémoire | Helpers de journal d’événements hôte de mémoire |
  | `plugin-sdk/memory-core-host-status` | Helpers de statut hôte de mémoire | Helpers de statut hôte de mémoire |
  | `plugin-sdk/memory-core-host-runtime-cli` | Runtime CLI hôte de mémoire | Helpers runtime CLI hôte de mémoire |
  | `plugin-sdk/memory-core-host-runtime-core` | Runtime core hôte de mémoire | Helpers runtime core hôte de mémoire |
  | `plugin-sdk/memory-core-host-runtime-files` | Helpers fichier/runtime hôte de mémoire | Helpers fichier/runtime hôte de mémoire |
  | `plugin-sdk/memory-host-core` | Alias runtime core hôte de mémoire | Alias neutre vis-à-vis du fournisseur pour les helpers runtime core hôte de mémoire |
  | `plugin-sdk/memory-host-events` | Alias de journal d’événements hôte de mémoire | Alias neutre vis-à-vis du fournisseur pour les helpers de journal d’événements hôte de mémoire |
  | `plugin-sdk/memory-host-files` | Alias fichier/runtime hôte de mémoire | Alias neutre vis-à-vis du fournisseur pour les helpers fichier/runtime hôte de mémoire |
  | `plugin-sdk/memory-host-markdown` | Helpers Markdown géré | Helpers partagés de Markdown géré pour les plugins adjacents à la mémoire |
  | `plugin-sdk/memory-host-search` | Façade de recherche Active Memory | Façade runtime paresseuse du gestionnaire de recherche de mémoire active |
  | `plugin-sdk/memory-host-status` | Alias de statut hôte de mémoire | Alias neutre vis-à-vis du fournisseur pour les helpers de statut hôte de mémoire |
  | `plugin-sdk/memory-lancedb` | Helpers intégrés memory-lancedb | Surface de helpers memory-lancedb |
  | `plugin-sdk/testing` | Utilitaires de test | Helpers et mocks de test |
</Accordion>

Ce tableau est volontairement le sous-ensemble de migration commun, et non toute la
surface du SDK. La liste complète des plus de 200 points d’entrée se trouve dans
`scripts/lib/plugin-sdk-entrypoints.json`.

Cette liste inclut encore certaines seams de helpers de plugins intégrés comme
`plugin-sdk/feishu`, `plugin-sdk/feishu-setup`, `plugin-sdk/zalo`,
`plugin-sdk/zalo-setup` et `plugin-sdk/matrix*`. Ils restent exportés pour la
maintenance et la compatibilité des plugins intégrés, mais ils sont volontairement
omis du tableau de migration commun et ne sont pas la cible recommandée pour le
nouveau code de plugin.

La même règle s’applique aux autres familles de helpers intégrés comme :

- helpers de prise en charge navigateur : `plugin-sdk/browser-cdp`, `plugin-sdk/browser-config-runtime`, `plugin-sdk/browser-config-support`, `plugin-sdk/browser-control-auth`, `plugin-sdk/browser-node-runtime`, `plugin-sdk/browser-profiles`, `plugin-sdk/browser-security-runtime`, `plugin-sdk/browser-setup-tools`, `plugin-sdk/browser-support`
- Matrix : `plugin-sdk/matrix*`
- LINE : `plugin-sdk/line*`
- IRC : `plugin-sdk/irc*`
- surfaces de helpers/plugins intégrés comme `plugin-sdk/googlechat`,
  `plugin-sdk/zalouser`, `plugin-sdk/bluebubbles*`,
  `plugin-sdk/mattermost*`, `plugin-sdk/msteams`,
  `plugin-sdk/nextcloud-talk`, `plugin-sdk/nostr`, `plugin-sdk/tlon`,
  `plugin-sdk/twitch`,
  `plugin-sdk/github-copilot-login`, `plugin-sdk/github-copilot-token`,
  `plugin-sdk/diagnostics-otel`, `plugin-sdk/diffs`, `plugin-sdk/llm-task`,
  `plugin-sdk/thread-ownership` et `plugin-sdk/voice-call`

`plugin-sdk/github-copilot-token` expose actuellement la surface ciblée d’aide pour jeton
`DEFAULT_COPILOT_API_BASE_URL`,
`deriveCopilotApiBaseUrlFromToken` et `resolveCopilotApiToken`.

Utilisez l’import le plus étroit correspondant au besoin. Si vous ne trouvez pas une exportation,
consultez la source dans `src/plugin-sdk/` ou demandez sur Discord.

## Calendrier de suppression

| Quand                  | Ce qui se passe                                                          |
| ---------------------- | ------------------------------------------------------------------------ |
| **Maintenant**         | Les surfaces dépréciées émettent des avertissements à l’exécution        |
| **Prochaine version majeure** | Les surfaces dépréciées seront supprimées ; les plugins qui les utilisent encore échoueront |

Tous les plugins core ont déjà migré. Les plugins externes doivent migrer
avant la prochaine version majeure.

## Supprimer temporairement les avertissements

Définissez ces variables d’environnement pendant que vous travaillez sur la migration :

```bash
OPENCLAW_SUPPRESS_PLUGIN_SDK_COMPAT_WARNING=1 openclaw gateway run
OPENCLAW_SUPPRESS_EXTENSION_API_WARNING=1 openclaw gateway run
```

Il s’agit d’une échappatoire temporaire, pas d’une solution permanente.

## Liens associés

- [Prise en main](/fr/plugins/building-plugins) — créer votre premier plugin
- [Vue d’ensemble du SDK](/fr/plugins/sdk-overview) — référence complète des imports par sous-chemin
- [Plugins de canal](/fr/plugins/sdk-channel-plugins) — créer des plugins de canal
- [Plugins de provider](/fr/plugins/sdk-provider-plugins) — créer des plugins de provider
- [Internals des plugins](/fr/plugins/architecture) — plongée approfondie dans l’architecture
- [Manifeste de plugin](/fr/plugins/manifest) — référence du schéma de manifeste
