---
read_when:
    - Vous voyez l’avertissement OPENCLAW_PLUGIN_SDK_COMPAT_DEPRECATED
    - Vous voyez l’avertissement OPENCLAW_EXTENSION_API_DEPRECATED
    - Vous mettez à jour un Plugin vers l’architecture de Plugin moderne
    - Vous maintenez un Plugin OpenClaw externe
sidebarTitle: Migrate to SDK
summary: Migrer de la couche héritée de rétrocompatibilité vers le SDK Plugin moderne
title: Migration du SDK Plugin
x-i18n:
    generated_at: "2026-04-23T07:07:01Z"
    model: gpt-5.4
    provider: openai
    source_hash: 8f21fc911a961bf88f6487dae0c1c2f54c0759911b2a992ae6285aa2f8704006
    source_path: plugins/sdk-migration.md
    workflow: 15
---

# Migration du SDK Plugin

OpenClaw est passé d’une large couche de rétrocompatibilité à une architecture de Plugin moderne
avec des imports ciblés et documentés. Si votre Plugin a été créé avant
la nouvelle architecture, ce guide vous aide à migrer.

## Ce qui change

L’ancien système de Plugins fournissait deux surfaces très larges qui permettaient aux Plugins d’importer
tout ce dont ils avaient besoin depuis un seul point d’entrée :

- **`openclaw/plugin-sdk/compat`** — un import unique qui réexportait des dizaines d’assistants.
  Il a été introduit pour maintenir le fonctionnement des anciens Plugins basés sur des hooks pendant que la
  nouvelle architecture de Plugin était en cours de construction.
- **`openclaw/extension-api`** — un pont qui donnait aux Plugins un accès direct à
  des assistants côté hôte comme le runner agent intégré.

Ces deux surfaces sont désormais **obsolètes**. Elles fonctionnent encore à l’exécution, mais les nouveaux
Plugins ne doivent plus les utiliser, et les Plugins existants doivent migrer avant la prochaine
release majeure qui les supprimera.

<Warning>
  La couche de rétrocompatibilité sera supprimée dans une future release majeure.
  Les Plugins qui importent encore depuis ces surfaces casseront lorsque cela arrivera.
</Warning>

## Pourquoi cela a changé

L’ancienne approche causait des problèmes :

- **Démarrage lent** — importer un assistant chargeait des dizaines de modules sans rapport
- **Dépendances circulaires** — de larges réexportations facilitaient la création de cycles d’import
- **Surface d’API peu claire** — aucun moyen de distinguer les exports stables des exports internes

Le SDK Plugin moderne corrige cela : chaque chemin d’import (`openclaw/plugin-sdk/\<subpath\>`)
est un petit module autonome avec un objectif clair et un contrat documenté.

Les interfaces pratiques héritées de fournisseur pour les canaux inclus ont aussi disparu. Les imports
tels que `openclaw/plugin-sdk/slack`, `openclaw/plugin-sdk/discord`,
`openclaw/plugin-sdk/signal`, `openclaw/plugin-sdk/whatsapp`,
les interfaces d’assistance marquées au nom du canal, et
`openclaw/plugin-sdk/telegram-core` étaient des raccourcis privés du mono-dépôt, et non
des contrats de Plugin stables. Utilisez à la place des sous-chemins SDK génériques étroits. À l’intérieur de
l’espace de travail des Plugins inclus, gardez les assistants détenus par le fournisseur dans les propres
`api.ts` ou `runtime-api.ts` de ce Plugin.

Exemples actuels de fournisseurs inclus :

- Anthropic conserve les assistants de flux spécifiques à Claude dans sa propre interface `api.ts` /
  `contract-api.ts`
- OpenAI conserve les constructeurs de fournisseurs, les assistants de modèle par défaut et les constructeurs
  de fournisseurs temps réel dans son propre `api.ts`
- OpenRouter conserve le constructeur de fournisseur et les assistants d’onboarding/configuration dans son propre
  `api.ts`

## Comment migrer

<Steps>
  <Step title="Migrer les gestionnaires natifs d’approbation vers les faits de capacité">
    Les Plugins de canal compatibles avec les approbations exposent désormais le comportement d’approbation natif via
    `approvalCapability.nativeRuntime` plus le registre partagé de contexte runtime.

    Changements clés :

    - Remplacez `approvalCapability.handler.loadRuntime(...)` par
      `approvalCapability.nativeRuntime`
    - Déplacez l’authentification/la livraison spécifiques aux approbations hors du câblage hérité `plugin.auth` /
      `plugin.approvals` vers `approvalCapability`
    - `ChannelPlugin.approvals` a été supprimé du contrat public des Plugins de canal ;
      déplacez les champs delivery/native/render vers `approvalCapability`
    - `plugin.auth` reste utilisé uniquement pour les flux de connexion/déconnexion de canal ; les hooks
      d’authentification d’approbation à cet endroit ne sont plus lus par le cœur
    - Enregistrez les objets runtime détenus par le canal tels que clients, jetons ou applications
      Bolt via `openclaw/plugin-sdk/channel-runtime-context`
    - N’envoyez pas d’avis de reroutage détenus par le Plugin depuis les gestionnaires natifs d’approbation ;
      le cœur possède désormais les avis routés ailleurs à partir des résultats de livraison réels
    - Lors du passage de `channelRuntime` à `createChannelManager(...)`, fournissez une
      vraie surface `createPluginRuntime().channel`. Les stubs partiels sont rejetés.

    Voir `/plugins/sdk-channel-plugins` pour la disposition actuelle des
    capacités d’approbation.

  </Step>

  <Step title="Auditer le comportement de repli des wrappers Windows">
    Si votre Plugin utilise `openclaw/plugin-sdk/windows-spawn`, les wrappers Windows
    `.cmd`/`.bat` non résolus échouent désormais de manière fermée sauf si vous passez explicitement
    `allowShellFallback: true`.

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

    Si votre appelant ne dépend pas intentionnellement d’un repli shell, ne définissez pas
    `allowShellFallback` et gérez plutôt l’erreur levée.

  </Step>

  <Step title="Trouver les imports obsolètes">
    Recherchez dans votre Plugin les imports depuis l’une ou l’autre surface obsolète :

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

    Pour les assistants côté hôte, utilisez le runtime Plugin injecté au lieu d’importer
    directement :

    ```typescript
    // Before (deprecated extension-api bridge)
    import { runEmbeddedPiAgent } from "openclaw/extension-api";
    const result = await runEmbeddedPiAgent({ sessionId, prompt });

    // After (injected runtime)
    const result = await api.runtime.agent.runEmbeddedPiAgent({ sessionId, prompt });
    ```

    Le même modèle s’applique aux autres assistants hérités du pont :

    | Ancien import | Équivalent moderne |
    | --- | --- |
    | `resolveAgentDir` | `api.runtime.agent.resolveAgentDir` |
    | `resolveAgentWorkspaceDir` | `api.runtime.agent.resolveAgentWorkspaceDir` |
    | `resolveAgentIdentity` | `api.runtime.agent.resolveAgentIdentity` |
    | `resolveThinkingDefault` | `api.runtime.agent.resolveThinkingDefault` |
    | `resolveAgentTimeoutMs` | `api.runtime.agent.resolveAgentTimeoutMs` |
    | `ensureAgentWorkspace` | `api.runtime.agent.ensureAgentWorkspace` |
    | assistants de stockage de session | `api.runtime.agent.session.*` |

  </Step>

  <Step title="Construire et tester">
    ```bash
    pnpm build
    pnpm test -- my-plugin/
    ```
  </Step>
</Steps>

## Référence des chemins d’import

  <Accordion title="Tableau courant des chemins d’import">
  | Chemin d’import | Objectif | Exports clés |
  | --- | --- | --- |
  | `plugin-sdk/plugin-entry` | Assistant canonique de point d’entrée de Plugin | `definePluginEntry` |
  | `plugin-sdk/core` | Réexportation umbrella héritée pour les définitions/constructeurs d’entrée de canal | `defineChannelPluginEntry`, `createChatChannelPlugin` |
  | `plugin-sdk/config-schema` | Export du schéma de configuration racine | `OpenClawSchema` |
  | `plugin-sdk/provider-entry` | Assistant de point d’entrée pour fournisseur unique | `defineSingleProviderPluginEntry` |
  | `plugin-sdk/channel-core` | Définitions/constructeurs ciblés pour l’entrée de canal | `defineChannelPluginEntry`, `defineSetupPluginEntry`, `createChatChannelPlugin`, `createChannelPluginBase` |
  | `plugin-sdk/setup` | Assistants partagés pour l’assistant de configuration | Prompts de liste d’autorisation, constructeurs d’état de configuration |
  | `plugin-sdk/setup-runtime` | Assistants runtime au moment de la configuration | Adaptateurs de patch de configuration sûrs à l’import, assistants de notes de recherche, `promptResolvedAllowFrom`, `splitSetupEntries`, proxys de configuration déléguée |
  | `plugin-sdk/setup-adapter-runtime` | Assistants d’adaptateur de configuration | `createEnvPatchedAccountSetupAdapter` |
  | `plugin-sdk/setup-tools` | Assistants d’outillage de configuration | `formatCliCommand`, `detectBinary`, `extractArchive`, `resolveBrewExecutable`, `formatDocsLink`, `CONFIG_DIR` |
  | `plugin-sdk/account-core` | Assistants multi-comptes | Assistants de liste/configuration/action-gate des comptes |
  | `plugin-sdk/account-id` | Assistants d’identifiant de compte | `DEFAULT_ACCOUNT_ID`, normalisation des identifiants de compte |
  | `plugin-sdk/account-resolution` | Assistants de recherche de compte | Assistants de recherche de compte + repli par défaut |
  | `plugin-sdk/account-helpers` | Assistants de compte étroits | Assistants de liste de comptes/action sur compte |
  | `plugin-sdk/channel-setup` | Adaptateurs de l’assistant de configuration | `createOptionalChannelSetupSurface`, `createOptionalChannelSetupAdapter`, `createOptionalChannelSetupWizard`, plus `DEFAULT_ACCOUNT_ID`, `createTopLevelChannelDmPolicy`, `setSetupChannelEnabled`, `splitSetupEntries` |
  | `plugin-sdk/channel-pairing` | Primitives d’appairage DM | `createChannelPairingController` |
  | `plugin-sdk/channel-reply-pipeline` | Préfixe de réponse + câblage de saisie | `createChannelReplyPipeline` |
  | `plugin-sdk/channel-config-helpers` | Fabriques d’adaptateurs de configuration | `createHybridChannelConfigAdapter` |
  | `plugin-sdk/channel-config-schema` | Constructeurs de schéma de configuration | Types de schéma de configuration de canal |
  | `plugin-sdk/telegram-command-config` | Assistants de configuration des commandes Telegram | Normalisation des noms de commande, troncature de description, validation des doublons/conflits |
  | `plugin-sdk/channel-policy` | Résolution des politiques de groupe/DM | `resolveChannelGroupRequireMention` |
  | `plugin-sdk/channel-lifecycle` | Assistants de cycle de vie pour l’état de compte et le flux de brouillon | `createAccountStatusSink`, assistants de finalisation d’aperçu de brouillon |
  | `plugin-sdk/inbound-envelope` | Assistants d’enveloppe entrante | Assistants partagés de route + construction d’enveloppe |
  | `plugin-sdk/inbound-reply-dispatch` | Assistants de réponse entrante | Assistants partagés d’enregistrement et de distribution |
  | `plugin-sdk/messaging-targets` | Analyse des cibles de messagerie | Assistants d’analyse/correspondance des cibles |
  | `plugin-sdk/outbound-media` | Assistants de média sortant | Chargement partagé des médias sortants |
  | `plugin-sdk/outbound-runtime` | Assistants runtime sortants | Assistants d’identité/envoi délégué sortants et de planification de charge utile |
  | `plugin-sdk/thread-bindings-runtime` | Assistants de liaison de fil | Assistants de cycle de vie et d’adaptateur de liaison de fil |
  | `plugin-sdk/agent-media-payload` | Assistants hérités de charge utile média | Constructeur de charge utile média agent pour les dispositions de champs héritées |
  | `plugin-sdk/channel-runtime` | Shim de compatibilité obsolète | Utilitaires runtime de canal hérités uniquement |
  | `plugin-sdk/channel-send-result` | Types de résultat d’envoi | Types de résultat de réponse |
  | `plugin-sdk/runtime-store` | Stockage persistant de Plugin | `createPluginRuntimeStore` |
  | `plugin-sdk/runtime` | Assistants runtime larges | Assistants de runtime/journalisation/sauvegarde/installation de Plugin |
  | `plugin-sdk/runtime-env` | Assistants étroits d’environnement runtime | Journaliseur/environnement runtime, délai d’expiration, retry et backoff |
  | `plugin-sdk/plugin-runtime` | Assistants runtime partagés de Plugin | Assistants de commandes/hooks/http/interactifs de Plugin |
  | `plugin-sdk/hook-runtime` | Assistants de pipeline de hook | Assistants partagés de pipeline Webhook/hook interne |
  | `plugin-sdk/lazy-runtime` | Assistants runtime lazy | `createLazyRuntimeModule`, `createLazyRuntimeMethod`, `createLazyRuntimeMethodBinder`, `createLazyRuntimeNamedExport`, `createLazyRuntimeSurface` |
  | `plugin-sdk/process-runtime` | Assistants de processus | Assistants partagés d’exécution |
  | `plugin-sdk/cli-runtime` | Assistants runtime CLI | Formatage de commandes, attentes, assistants de version |
  | `plugin-sdk/gateway-runtime` | Assistants Gateway | Client Gateway et assistants de patch d’état de canal |
  | `plugin-sdk/config-runtime` | Assistants de configuration | Assistants de chargement/écriture de configuration |
  | `plugin-sdk/telegram-command-config` | Assistants de commande Telegram | Validation de commande Telegram stable en repli lorsque la surface de contrat Telegram incluse n’est pas disponible |
  | `plugin-sdk/approval-runtime` | Assistants de prompts d’approbation | Charge utile d’approbation exec/Plugin, assistants de capacité/profil d’approbation, assistants de routage/runtime d’approbation native |
  | `plugin-sdk/approval-auth-runtime` | Assistants d’authentification d’approbation | Résolution de l’approbateur, authentification des actions dans la même discussion |
  | `plugin-sdk/approval-client-runtime` | Assistants client d’approbation | Assistants de profil/filtre d’approbation exec native |
  | `plugin-sdk/approval-delivery-runtime` | Assistants de livraison d’approbation | Adaptateurs de capacité/livraison d’approbation native |
  | `plugin-sdk/approval-gateway-runtime` | Assistants Gateway d’approbation | Assistant partagé de résolution Gateway d’approbation |
  | `plugin-sdk/approval-handler-adapter-runtime` | Assistants d’adaptateur d’approbation | Assistants légers de chargement d’adaptateur d’approbation native pour les points d’entrée de canal à chaud |
  | `plugin-sdk/approval-handler-runtime` | Assistants de gestionnaire d’approbation | Assistants runtime plus larges de gestionnaire d’approbation ; préférez les interfaces adaptateur/Gateway plus étroites lorsqu’elles suffisent |
  | `plugin-sdk/approval-native-runtime` | Assistants de cible d’approbation | Assistants de liaison cible/compte d’approbation native |
  | `plugin-sdk/approval-reply-runtime` | Assistants de réponse d’approbation | Assistants de charge utile de réponse d’approbation exec/Plugin |
  | `plugin-sdk/channel-runtime-context` | Assistants de contexte runtime de canal | Assistants génériques register/get/watch de contexte runtime de canal |
  | `plugin-sdk/security-runtime` | Assistants de sécurité | Assistants partagés de confiance, filtrage DM, contenu externe et collecte de secrets |
  | `plugin-sdk/ssrf-policy` | Assistants de politique SSRF | Assistants de liste d’autorisation d’hôte et de politique de réseau privé |
  | `plugin-sdk/ssrf-runtime` | Assistants runtime SSRF | Répartiteur épinglé, fetch protégé, assistants de politique SSRF |
  | `plugin-sdk/collection-runtime` | Assistants de cache borné | `pruneMapToMaxSize` |
  | `plugin-sdk/diagnostic-runtime` | Assistants de filtrage diagnostique | `isDiagnosticFlagEnabled`, `isDiagnosticsEnabled` |
  | `plugin-sdk/error-runtime` | Assistants de formatage d’erreur | `formatUncaughtError`, `isApprovalNotFoundError`, assistants de graphe d’erreurs |
  | `plugin-sdk/fetch-runtime` | Assistants fetch/proxy enveloppés | `resolveFetch`, assistants de proxy |
  | `plugin-sdk/host-runtime` | Assistants de normalisation d’hôte | `normalizeHostname`, `normalizeScpRemoteHost` |
  | `plugin-sdk/retry-runtime` | Assistants de retry | `RetryConfig`, `retryAsync`, exécutants de politique |
  | `plugin-sdk/allow-from` | Formatage de liste d’autorisation | `formatAllowFromLowercase` |
  | `plugin-sdk/allowlist-resolution` | Mappage d’entrée de liste d’autorisation | `mapAllowlistResolutionInputs` |
  | `plugin-sdk/command-auth` | Filtrage des commandes et assistants de surface de commande | `resolveControlCommandGate`, assistants d’autorisation d’expéditeur, assistants de registre de commandes |
  | `plugin-sdk/command-status` | Rendeurs d’état/d’aide de commande | `buildCommandsMessage`, `buildCommandsMessagePaginated`, `buildHelpMessage` |
  | `plugin-sdk/secret-input` | Analyse des entrées secrètes | Assistants d’entrée secrète |
  | `plugin-sdk/webhook-ingress` | Assistants de requête Webhook | Utilitaires de cible Webhook |
  | `plugin-sdk/webhook-request-guards` | Assistants de garde de corps de requête Webhook | Assistants de lecture/limitation du corps de requête |
  | `plugin-sdk/reply-runtime` | Runtime partagé de réponse | Distribution entrante, Heartbeat, planificateur de réponse, découpage |
  | `plugin-sdk/reply-dispatch-runtime` | Assistants étroits de distribution de réponse | Assistants de finalisation + distribution fournisseur |
  | `plugin-sdk/reply-history` | Assistants d’historique de réponse | `buildHistoryContext`, `buildPendingHistoryContextFromMap`, `recordPendingHistoryEntry`, `clearHistoryEntriesIfEnabled` |
  | `plugin-sdk/reply-reference` | Planification de référence de réponse | `createReplyReferencePlanner` |
  | `plugin-sdk/reply-chunking` | Assistants de découpage de réponse | Assistants de découpage texte/markdown |
  | `plugin-sdk/session-store-runtime` | Assistants de stockage de session | Assistants de chemin de stockage + updated-at |
  | `plugin-sdk/state-paths` | Assistants de chemins d’état | Assistants de répertoires d’état et OAuth |
  | `plugin-sdk/routing` | Assistants de routage/clé de session | `resolveAgentRoute`, `buildAgentSessionKey`, `resolveDefaultAgentBoundAccountId`, assistants de normalisation de clé de session |
  | `plugin-sdk/status-helpers` | Assistants d’état de canal | Constructeurs de résumé d’état canal/compte, valeurs par défaut d’état runtime, assistants de métadonnées de problème |
  | `plugin-sdk/target-resolver-runtime` | Assistants de résolution de cible | Assistants partagés de résolution de cible |
  | `plugin-sdk/string-normalization-runtime` | Assistants de normalisation de chaîne | Assistants de normalisation slug/chaîne |
  | `plugin-sdk/request-url` | Assistants d’URL de requête | Extraire des URL chaîne depuis des entrées de type requête |
  | `plugin-sdk/run-command` | Assistants de commande temporisée | Exécutant de commande temporisée avec stdout/stderr normalisés |
  | `plugin-sdk/param-readers` | Lecteurs de paramètres | Lecteurs de paramètres communs pour outil/CLI |
  | `plugin-sdk/tool-payload` | Extraction de charge utile d’outil | Extraire des charges utiles normalisées à partir d’objets de résultat d’outil |
  | `plugin-sdk/tool-send` | Extraction d’envoi d’outil | Extraire les champs canoniques de cible d’envoi à partir des arguments d’outil |
  | `plugin-sdk/temp-path` | Assistants de chemin temporaire | Assistants partagés de chemin temporaire de téléchargement |
  | `plugin-sdk/logging-core` | Assistants de journalisation | Journaliseur de sous-système et assistants de masquage |
  | `plugin-sdk/markdown-table-runtime` | Assistants de tableau Markdown | Assistants de mode de tableau Markdown |
  | `plugin-sdk/reply-payload` | Types de réponse de message | Types de charge utile de réponse |
  | `plugin-sdk/provider-setup` | Assistants sélectionnés de configuration de fournisseurs locaux/autohébergés | Assistants de découverte/configuration de fournisseurs autohébergés |
  | `plugin-sdk/self-hosted-provider-setup` | Assistants ciblés de configuration de fournisseurs autohébergés compatibles OpenAI | Mêmes assistants de découverte/configuration de fournisseurs autohébergés |
  | `plugin-sdk/provider-auth-runtime` | Assistants runtime d’authentification fournisseur | Assistants runtime de résolution de clé API |
  | `plugin-sdk/provider-auth-api-key` | Assistants de configuration de clé API fournisseur | Assistants d’onboarding/écriture de profil de clé API |
  | `plugin-sdk/provider-auth-result` | Assistants de résultat d’authentification fournisseur | Constructeur standard de résultat d’authentification OAuth |
  | `plugin-sdk/provider-auth-login` | Assistants de connexion interactive fournisseur | Assistants partagés de connexion interactive |
  | `plugin-sdk/provider-env-vars` | Assistants de variables d’environnement fournisseur | Assistants de recherche de variables d’environnement d’authentification fournisseur |
  | `plugin-sdk/provider-model-shared` | Assistants partagés de modèle/relecture de fournisseur | `ProviderReplayFamily`, `buildProviderReplayFamilyHooks`, `normalizeModelCompat`, constructeurs partagés de politique de relecture, assistants de point de terminaison fournisseur et assistants de normalisation d’identifiant de modèle |
  | `plugin-sdk/provider-catalog-shared` | Assistants partagés de catalogue de fournisseur | `findCatalogTemplate`, `buildSingleProviderApiKeyCatalog`, `supportsNativeStreamingUsageCompat`, `applyProviderNativeStreamingUsageCompat` |
  | `plugin-sdk/provider-onboard` | Patches d’onboarding de fournisseur | Assistants de configuration d’onboarding |
  | `plugin-sdk/provider-http` | Assistants HTTP de fournisseur | Assistants génériques HTTP/capacités de point de terminaison de fournisseur, y compris les assistants de formulaire multipart pour la transcription audio |
  | `plugin-sdk/provider-web-fetch` | Assistants de récupération web de fournisseur | Assistants d’enregistrement/cache de fournisseur de récupération web |
  | `plugin-sdk/provider-web-search-config-contract` | Assistants de configuration de recherche web de fournisseur | Assistants étroits de configuration/identifiants de recherche web pour les fournisseurs qui n’ont pas besoin du câblage d’activation de Plugin |
  | `plugin-sdk/provider-web-search-contract` | Assistants de contrat de recherche web de fournisseur | Assistants étroits de contrat de configuration/identifiants de recherche web tels que `createWebSearchProviderContractFields`, `enablePluginInConfig`, `resolveProviderWebSearchPluginConfig` et setters/getters d’identifiants à portée |
  | `plugin-sdk/provider-web-search` | Assistants de recherche web de fournisseur | Assistants d’enregistrement/cache/runtime de fournisseur de recherche web |
  | `plugin-sdk/provider-tools` | Assistants de compatibilité outil/schéma de fournisseur | `ProviderToolCompatFamily`, `buildProviderToolCompatFamilyHooks`, nettoyage de schéma Gemini + diagnostics, et assistants de compatibilité xAI tels que `resolveXaiModelCompatPatch` / `applyXaiModelCompat` |
  | `plugin-sdk/provider-usage` | Assistants d’usage de fournisseur | `fetchClaudeUsage`, `fetchGeminiUsage`, `fetchGithubCopilotUsage` et autres assistants d’usage de fournisseur |
  | `plugin-sdk/provider-stream` | Assistants d’enveloppe de flux de fournisseur | `ProviderStreamFamily`, `buildProviderStreamFamilyHooks`, `composeProviderStreamWrappers`, types d’enveloppe de flux, et assistants partagés d’enveloppe Anthropic/Bedrock/Google/Kilocode/Moonshot/OpenAI/OpenRouter/Z.A.I/MiniMax/Copilot |
  | `plugin-sdk/provider-transport-runtime` | Assistants de transport de fournisseur | Assistants natifs de transport de fournisseur tels que fetch protégé, transformations de messages de transport et flux d’événements de transport inscriptibles |
  | `plugin-sdk/keyed-async-queue` | File asynchrone ordonnée | `KeyedAsyncQueue` |
  | `plugin-sdk/media-runtime` | Assistants média partagés | Assistants de récupération/transformation/stockage de média plus constructeurs de charge utile média |
  | `plugin-sdk/media-generation-runtime` | Assistants partagés de génération média | Assistants partagés de basculement, sélection de candidats et messages de modèle manquant pour la génération d’image/vidéo/musique |
  | `plugin-sdk/media-understanding` | Assistants de compréhension média | Types de fournisseur de compréhension média plus exports d’assistants image/audio orientés fournisseur |
  | `plugin-sdk/text-runtime` | Assistants texte partagés | Suppression de texte visible par l’assistant, assistants de rendu/découpage/tableau markdown, assistants de masquage, assistants de balises de directive, utilitaires de texte sûr et assistants associés de texte/journalisation |
  | `plugin-sdk/text-chunking` | Assistants de découpage de texte | Assistant de découpage de texte sortant |
  | `plugin-sdk/speech` | Assistants de parole | Types de fournisseur de parole plus assistants orientés fournisseur de directive, registre et validation |
  | `plugin-sdk/speech-core` | Cœur partagé de parole | Types de fournisseur de parole, registre, directives, normalisation |
  | `plugin-sdk/realtime-transcription` | Assistants de transcription temps réel | Types de fournisseur, assistants de registre et assistant partagé de session WebSocket |
  | `plugin-sdk/realtime-voice` | Assistants de voix temps réel | Types de fournisseur et assistants de registre |
  | `plugin-sdk/image-generation-core` | Cœur partagé de génération d’image | Types de génération d’image, basculement, authentification et assistants de registre |
  | `plugin-sdk/music-generation` | Assistants de génération musicale | Types de fournisseur/requête/résultat de génération musicale |
  | `plugin-sdk/music-generation-core` | Cœur partagé de génération musicale | Types de génération musicale, assistants de basculement, recherche de fournisseur et analyse de référence de modèle |
  | `plugin-sdk/video-generation` | Assistants de génération vidéo | Types de fournisseur/requête/résultat de génération vidéo |
  | `plugin-sdk/video-generation-core` | Cœur partagé de génération vidéo | Types de génération vidéo, assistants de basculement, recherche de fournisseur et analyse de référence de modèle |
  | `plugin-sdk/interactive-runtime` | Assistants de réponse interactive | Normalisation/réduction de charge utile de réponse interactive |
  | `plugin-sdk/channel-config-primitives` | Primitives de configuration de canal | Primitives étroites de schéma de configuration de canal |
  | `plugin-sdk/channel-config-writes` | Assistants d’écriture de configuration de canal | Assistants d’autorisation d’écriture de configuration de canal |
  | `plugin-sdk/channel-plugin-common` | Prélude partagé de canal | Exports partagés de prélude de Plugin de canal |
  | `plugin-sdk/channel-status` | Assistants d’état de canal | Assistants partagés d’instantané/résumé d’état de canal |
  | `plugin-sdk/allowlist-config-edit` | Assistants de configuration de liste d’autorisation | Assistants de lecture/édition de configuration de liste d’autorisation |
  | `plugin-sdk/group-access` | Assistants d’accès de groupe | Assistants partagés de décision d’accès de groupe |
  | `plugin-sdk/direct-dm` | Assistants de DM direct | Assistants partagés d’authentification/garde DM direct |
  | `plugin-sdk/extension-shared` | Assistants partagés d’extension | Primitives de canal/statut passif et d’assistant proxy ambiant |
  | `plugin-sdk/webhook-targets` | Assistants de cible Webhook | Registre de cibles Webhook et assistants d’installation de route |
  | `plugin-sdk/webhook-path` | Assistants de chemin Webhook | Assistants de normalisation de chemin Webhook |
  | `plugin-sdk/web-media` | Assistants partagés de média web | Assistants de chargement de média distant/local |
  | `plugin-sdk/zod` | Réexportation Zod | `zod` réexporté pour les consommateurs du SDK Plugin |
  | `plugin-sdk/memory-core` | Assistants memory-core inclus | Surface d’assistants du gestionnaire/configuration/fichier/CLI de mémoire |
  | `plugin-sdk/memory-core-engine-runtime` | Façade runtime du moteur mémoire | Façade runtime d’indexation/recherche mémoire |
  | `plugin-sdk/memory-core-host-engine-foundation` | Moteur fondation de l’hôte mémoire | Exports du moteur fondation de l’hôte mémoire |
  | `plugin-sdk/memory-core-host-engine-embeddings` | Moteur d’embeddings de l’hôte mémoire | Contrats d’embeddings mémoire, accès au registre, fournisseur local et assistants génériques par lot/distants ; les fournisseurs distants concrets vivent dans leurs Plugins propriétaires |
  | `plugin-sdk/memory-core-host-engine-qmd` | Moteur QMD de l’hôte mémoire | Exports du moteur QMD de l’hôte mémoire |
  | `plugin-sdk/memory-core-host-engine-storage` | Moteur de stockage de l’hôte mémoire | Exports du moteur de stockage de l’hôte mémoire |
  | `plugin-sdk/memory-core-host-multimodal` | Assistants multimodaux de l’hôte mémoire | Assistants multimodaux de l’hôte mémoire |
  | `plugin-sdk/memory-core-host-query` | Assistants de requête de l’hôte mémoire | Assistants de requête de l’hôte mémoire |
  | `plugin-sdk/memory-core-host-secret` | Assistants de secret de l’hôte mémoire | Assistants de secret de l’hôte mémoire |
  | `plugin-sdk/memory-core-host-events` | Assistants de journal d’événements de l’hôte mémoire | Assistants de journal d’événements de l’hôte mémoire |
  | `plugin-sdk/memory-core-host-status` | Assistants d’état de l’hôte mémoire | Assistants d’état de l’hôte mémoire |
  | `plugin-sdk/memory-core-host-runtime-cli` | Runtime CLI de l’hôte mémoire | Assistants runtime CLI de l’hôte mémoire |
  | `plugin-sdk/memory-core-host-runtime-core` | Runtime cœur de l’hôte mémoire | Assistants runtime cœur de l’hôte mémoire |
  | `plugin-sdk/memory-core-host-runtime-files` | Assistants fichier/runtime de l’hôte mémoire | Assistants fichier/runtime de l’hôte mémoire |
  | `plugin-sdk/memory-host-core` | Alias runtime cœur de l’hôte mémoire | Alias indépendant du fournisseur pour les assistants runtime cœur de l’hôte mémoire |
  | `plugin-sdk/memory-host-events` | Alias de journal d’événements de l’hôte mémoire | Alias indépendant du fournisseur pour les assistants de journal d’événements de l’hôte mémoire |
  | `plugin-sdk/memory-host-files` | Alias fichier/runtime de l’hôte mémoire | Alias indépendant du fournisseur pour les assistants fichier/runtime de l’hôte mémoire |
  | `plugin-sdk/memory-host-markdown` | Assistants markdown géré | Assistants partagés de markdown géré pour les Plugins proches de la mémoire |
  | `plugin-sdk/memory-host-search` | Façade de recherche Active Memory | Façade runtime lazy du gestionnaire de recherche Active Memory |
  | `plugin-sdk/memory-host-status` | Alias d’état de l’hôte mémoire | Alias indépendant du fournisseur pour les assistants d’état de l’hôte mémoire |
  | `plugin-sdk/memory-lancedb` | Assistants memory-lancedb inclus | Surface d’assistants memory-lancedb |
  | `plugin-sdk/testing` | Utilitaires de test | Assistants et mocks de test |
</Accordion>

Ce tableau est volontairement le sous-ensemble courant de migration, et non la surface complète
du SDK. La liste complète de plus de 200 points d’entrée se trouve dans
`scripts/lib/plugin-sdk-entrypoints.json`.

Cette liste inclut encore certaines interfaces d’assistance de Plugins inclus comme
`plugin-sdk/feishu`, `plugin-sdk/feishu-setup`, `plugin-sdk/zalo`,
`plugin-sdk/zalo-setup` et `plugin-sdk/matrix*`. Elles restent exportées pour la
maintenance et la compatibilité des Plugins inclus, mais elles sont volontairement
omises du tableau courant de migration et ne sont pas la cible recommandée pour
le nouveau code de Plugin.

La même règle s’applique à d’autres familles d’assistants inclus telles que :

- assistants de prise en charge du navigateur : `plugin-sdk/browser-cdp`, `plugin-sdk/browser-config-runtime`, `plugin-sdk/browser-config-support`, `plugin-sdk/browser-control-auth`, `plugin-sdk/browser-node-runtime`, `plugin-sdk/browser-profiles`, `plugin-sdk/browser-security-runtime`, `plugin-sdk/browser-setup-tools`, `plugin-sdk/browser-support`
- Matrix : `plugin-sdk/matrix*`
- LINE : `plugin-sdk/line*`
- IRC : `plugin-sdk/irc*`
- surfaces d’assistant/Plugin incluses comme `plugin-sdk/googlechat`,
  `plugin-sdk/zalouser`, `plugin-sdk/bluebubbles*`,
  `plugin-sdk/mattermost*`, `plugin-sdk/msteams`,
  `plugin-sdk/nextcloud-talk`, `plugin-sdk/nostr`, `plugin-sdk/tlon`,
  `plugin-sdk/twitch`,
  `plugin-sdk/github-copilot-login`, `plugin-sdk/github-copilot-token`,
  `plugin-sdk/diagnostics-otel`, `plugin-sdk/diffs`, `plugin-sdk/llm-task`,
  `plugin-sdk/thread-ownership` et `plugin-sdk/voice-call`

`plugin-sdk/github-copilot-token` expose actuellement la surface étroite
d’assistant de jeton `DEFAULT_COPILOT_API_BASE_URL`,
`deriveCopilotApiBaseUrlFromToken` et `resolveCopilotApiToken`.

Utilisez l’import le plus étroit qui correspond à la tâche. Si vous ne trouvez pas un export,
consultez la source dans `src/plugin-sdk/` ou demandez sur Discord.

## Calendrier de suppression

| Quand                  | Ce qui se passe                                                        |
| ---------------------- | ---------------------------------------------------------------------- |
| **Maintenant**         | Les surfaces obsolètes émettent des avertissements à l’exécution       |
| **Prochaine release majeure** | Les surfaces obsolètes seront supprimées ; les Plugins qui les utilisent encore échoueront |

Tous les Plugins du cœur ont déjà migré. Les Plugins externes doivent migrer
avant la prochaine release majeure.

## Masquer temporairement les avertissements

Définissez ces variables d’environnement pendant que vous travaillez à la migration :

```bash
OPENCLAW_SUPPRESS_PLUGIN_SDK_COMPAT_WARNING=1 openclaw gateway run
OPENCLAW_SUPPRESS_EXTENSION_API_WARNING=1 openclaw gateway run
```

Il s’agit d’une échappatoire temporaire, pas d’une solution permanente.

## Voir aussi

- [Pour commencer](/fr/plugins/building-plugins) — créer votre premier Plugin
- [Vue d’ensemble du SDK](/fr/plugins/sdk-overview) — référence complète des imports par sous-chemin
- [Plugins de canal](/fr/plugins/sdk-channel-plugins) — création de Plugins de canal
- [Plugins de fournisseur](/fr/plugins/sdk-provider-plugins) — création de Plugins de fournisseur
- [Internals des Plugins](/fr/plugins/architecture) — analyse approfondie de l’architecture
- [Manifeste de Plugin](/fr/plugins/manifest) — référence du schéma de manifeste
