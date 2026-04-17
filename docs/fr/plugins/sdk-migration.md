---
read_when:
    - Vous voyez l’avertissement `OPENCLAW_PLUGIN_SDK_COMPAT_DEPRECATED`
    - Vous voyez l’avertissement `OPENCLAW_EXTENSION_API_DEPRECATED`
    - Vous mettez à jour un Plugin vers l’architecture de Plugin moderne
    - Vous maintenez un Plugin OpenClaw externe
sidebarTitle: Migrate to SDK
summary: Migrez de la couche de compatibilité descendante héritée vers le Plugin SDK moderne
title: Migration du Plugin SDK
x-i18n:
    generated_at: "2026-04-17T06:57:32Z"
    model: gpt-5.4
    provider: openai
    source_hash: f0283f949eec358a12a0709db846cde2a1509f28e5c60db6e563cb8a540b979d
    source_path: plugins/sdk-migration.md
    workflow: 15
---

# Migration du Plugin SDK

OpenClaw est passé d’une large couche de compatibilité descendante à une architecture de Plugin moderne avec des imports ciblés et documentés. Si votre Plugin a été conçu avant la nouvelle architecture, ce guide vous aide à le migrer.

## Ce qui change

L’ancien système de Plugin fournissait deux surfaces très ouvertes qui permettaient aux Plugins d’importer tout ce dont ils avaient besoin depuis un seul point d’entrée :

- **`openclaw/plugin-sdk/compat`** — un import unique qui réexportait des dizaines de helpers. Il a été introduit pour permettre aux anciens Plugins basés sur des hooks de continuer à fonctionner pendant la construction de la nouvelle architecture de Plugin.
- **`openclaw/extension-api`** — un pont qui donnait aux Plugins un accès direct à des helpers côté hôte, comme l’exécuteur d’agent embarqué.

Ces deux surfaces sont désormais **dépréciées**. Elles fonctionnent toujours à l’exécution, mais les nouveaux Plugins ne doivent pas les utiliser, et les Plugins existants doivent migrer avant que la prochaine version majeure ne les supprime.

<Warning>
  La couche de compatibilité descendante sera supprimée dans une future version majeure.
  Les Plugins qui importent encore depuis ces surfaces cesseront de fonctionner à ce moment-là.
</Warning>

## Pourquoi cela a changé

L’ancienne approche causait des problèmes :

- **Démarrage lent** — l’import d’un helper chargeait des dizaines de modules sans lien
- **Dépendances circulaires** — de larges réexportations facilitaient la création de cycles d’import
- **Surface d’API peu claire** — il n’y avait aucun moyen de savoir quelles exportations étaient stables ou internes

Le Plugin SDK moderne corrige cela : chaque chemin d’import (`openclaw/plugin-sdk/\<subpath\>`)
est un petit module autonome avec un objectif clair et un contrat documenté.

Les couches de commodité héritées pour les providers des canaux groupés ont également disparu. Les imports
tels que `openclaw/plugin-sdk/slack`, `openclaw/plugin-sdk/discord`,
`openclaw/plugin-sdk/signal`, `openclaw/plugin-sdk/whatsapp`,
les couches de helpers associées à une marque de canal, et
`openclaw/plugin-sdk/telegram-core` étaient des raccourcis privés du mono-repo, et non
des contrats de Plugin stables. Utilisez à la place des sous-chemins génériques étroits du SDK. Dans l’espace de travail
des Plugins groupés, conservez les helpers appartenant au provider dans le
`api.ts` ou le `runtime-api.ts` propre à ce Plugin.

Exemples actuels de providers groupés :

- Anthropic conserve les helpers de flux spécifiques à Claude dans sa propre couche `api.ts` /
  `contract-api.ts`
- OpenAI conserve les builders de provider, les helpers de modèle par défaut et les builders de provider
  temps réel dans son propre `api.ts`
- OpenRouter conserve le builder de provider et les helpers d’onboarding/configuration dans son propre
  `api.ts`

## Comment migrer

<Steps>
  <Step title="Migrer les gestionnaires natifs d’approbation vers des faits de capacité">
    Les Plugins de canal capables de gérer les approbations exposent désormais le comportement d’approbation natif via
    `approvalCapability.nativeRuntime` ainsi que le registre partagé de contexte d’exécution.

    Principaux changements :

    - Remplacez `approvalCapability.handler.loadRuntime(...)` par
      `approvalCapability.nativeRuntime`
    - Déplacez l’authentification/la distribution spécifiques aux approbations hors de l’ancien câblage `plugin.auth` /
      `plugin.approvals` vers `approvalCapability`
    - `ChannelPlugin.approvals` a été supprimé du contrat public du Plugin de canal ;
      déplacez les champs delivery/native/render vers `approvalCapability`
    - `plugin.auth` reste utilisé uniquement pour les flux de connexion/déconnexion des canaux ; les hooks
      d’authentification des approbations qui s’y trouvent ne sont plus lus par le core
    - Enregistrez les objets d’exécution appartenant au canal, comme les clients, jetons ou applications
      Bolt, via `openclaw/plugin-sdk/channel-runtime-context`
    - N’envoyez pas d’avis de réacheminement appartenant au Plugin depuis les gestionnaires d’approbation natifs ;
      le core gère désormais les avis « acheminé ailleurs » à partir des résultats réels de distribution
    - Lors du passage de `channelRuntime` à `createChannelManager(...)`, fournissez une vraie
      surface `createPluginRuntime().channel`. Les stubs partiels sont rejetés.

    Voir `/plugins/sdk-channel-plugins` pour la disposition actuelle de la
    capacité d’approbation.

  </Step>

  <Step title="Auditer le comportement de repli du wrapper Windows">
    Si votre Plugin utilise `openclaw/plugin-sdk/windows-spawn`, les wrappers Windows
    `.cmd`/`.bat` non résolus échouent désormais de manière stricte, sauf si vous transmettez explicitement
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

    Si votre appelant ne dépend pas intentionnellement du repli via shell, ne définissez pas
    `allowShellFallback` et gérez plutôt l’erreur levée.

  </Step>

  <Step title="Trouver les imports dépréciés">
    Recherchez dans votre Plugin les imports provenant de l’une ou l’autre surface dépréciée :

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

    Pour les helpers côté hôte, utilisez le runtime de Plugin injecté au lieu d’importer
    directement :

    ```typescript
    // Before (deprecated extension-api bridge)
    import { runEmbeddedPiAgent } from "openclaw/extension-api";
    const result = await runEmbeddedPiAgent({ sessionId, prompt });

    // After (injected runtime)
    const result = await api.runtime.agent.runEmbeddedPiAgent({ sessionId, prompt });
    ```

    Le même modèle s’applique aux autres helpers hérités du pont :

    | Ancien import | Équivalent moderne |
    | --- | --- |
    | `resolveAgentDir` | `api.runtime.agent.resolveAgentDir` |
    | `resolveAgentWorkspaceDir` | `api.runtime.agent.resolveAgentWorkspaceDir` |
    | `resolveAgentIdentity` | `api.runtime.agent.resolveAgentIdentity` |
    | `resolveThinkingDefault` | `api.runtime.agent.resolveThinkingDefault` |
    | `resolveAgentTimeoutMs` | `api.runtime.agent.resolveAgentTimeoutMs` |
    | `ensureAgentWorkspace` | `api.runtime.agent.ensureAgentWorkspace` |
    | helpers du stockage de session | `api.runtime.agent.session.*` |

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
  | Chemin d’import | Objectif | Exportations clés |
  | --- | --- | --- |
  | `plugin-sdk/plugin-entry` | Helper d’entrée de Plugin canonique | `definePluginEntry` |
  | `plugin-sdk/core` | Réexportation parapluie héritée pour les définitions/builders d’entrée de canal | `defineChannelPluginEntry`, `createChatChannelPlugin` |
  | `plugin-sdk/config-schema` | Exportation du schéma de configuration racine | `OpenClawSchema` |
  | `plugin-sdk/provider-entry` | Helper d’entrée à provider unique | `defineSingleProviderPluginEntry` |
  | `plugin-sdk/channel-core` | Définitions et builders d’entrée de canal ciblés | `defineChannelPluginEntry`, `defineSetupPluginEntry`, `createChatChannelPlugin`, `createChannelPluginBase` |
  | `plugin-sdk/setup` | Helpers partagés de l’assistant de configuration | Prompts de liste d’autorisation, builders d’état de configuration |
  | `plugin-sdk/setup-runtime` | Helpers d’exécution au moment de la configuration | Adaptateurs de patch de configuration sûrs à l’import, helpers de notes de recherche, `promptResolvedAllowFrom`, `splitSetupEntries`, proxys de configuration déléguée |
  | `plugin-sdk/setup-adapter-runtime` | Helpers d’adaptateur de configuration | `createEnvPatchedAccountSetupAdapter` |
  | `plugin-sdk/setup-tools` | Helpers d’outillage de configuration | `formatCliCommand`, `detectBinary`, `extractArchive`, `resolveBrewExecutable`, `formatDocsLink`, `CONFIG_DIR` |
  | `plugin-sdk/account-core` | Helpers multi-comptes | Helpers de liste/configuration/action gate de compte |
  | `plugin-sdk/account-id` | Helpers d’identifiant de compte | `DEFAULT_ACCOUNT_ID`, normalisation de l’identifiant de compte |
  | `plugin-sdk/account-resolution` | Helpers de recherche de compte | Helpers de recherche de compte + repli par défaut |
  | `plugin-sdk/account-helpers` | Helpers de compte ciblés | Helpers de liste de comptes/action de compte |
  | `plugin-sdk/channel-setup` | Adaptateurs d’assistant de configuration | `createOptionalChannelSetupSurface`, `createOptionalChannelSetupAdapter`, `createOptionalChannelSetupWizard`, plus `DEFAULT_ACCOUNT_ID`, `createTopLevelChannelDmPolicy`, `setSetupChannelEnabled`, `splitSetupEntries` |
  | `plugin-sdk/channel-pairing` | Primitives d’appairage DM | `createChannelPairingController` |
  | `plugin-sdk/channel-reply-pipeline` | Câblage du préfixe de réponse + saisie | `createChannelReplyPipeline` |
  | `plugin-sdk/channel-config-helpers` | Fabriques d’adaptateurs de configuration | `createHybridChannelConfigAdapter` |
  | `plugin-sdk/channel-config-schema` | Builders de schéma de configuration | Types de schéma de configuration de canal |
  | `plugin-sdk/telegram-command-config` | Helpers de configuration des commandes Telegram | Normalisation des noms de commandes, réduction des descriptions, validation des doublons/conflits |
  | `plugin-sdk/channel-policy` | Résolution de politique groupe/DM | `resolveChannelGroupRequireMention` |
  | `plugin-sdk/channel-lifecycle` | Suivi de l’état du compte | `createAccountStatusSink` |
  | `plugin-sdk/inbound-envelope` | Helpers d’enveloppe entrante | Helpers partagés de route + construction d’enveloppe |
  | `plugin-sdk/inbound-reply-dispatch` | Helpers de réponse entrante | Helpers partagés d’enregistrement et de répartition |
  | `plugin-sdk/messaging-targets` | Analyse des cibles de messagerie | Helpers d’analyse/correspondance de cibles |
  | `plugin-sdk/outbound-media` | Helpers de médias sortants | Chargement partagé des médias sortants |
  | `plugin-sdk/outbound-runtime` | Helpers d’exécution sortante | Helpers de délégation d’identité/d’envoi sortants |
  | `plugin-sdk/thread-bindings-runtime` | Helpers de liaison de fil | Helpers de cycle de vie et d’adaptateur de liaison de fil |
  | `plugin-sdk/agent-media-payload` | Helpers hérités de payload média | Builder de payload média d’agent pour les dispositions de champs héritées |
  | `plugin-sdk/channel-runtime` | Shim de compatibilité déprécié | Utilitaires hérités d’exécution de canal uniquement |
  | `plugin-sdk/channel-send-result` | Types de résultat d’envoi | Types de résultat de réponse |
  | `plugin-sdk/runtime-store` | Stockage persistant de Plugin | `createPluginRuntimeStore` |
  | `plugin-sdk/runtime` | Helpers d’exécution étendus | Helpers d’exécution/journalisation/sauvegarde/installation de Plugin |
  | `plugin-sdk/runtime-env` | Helpers ciblés d’environnement d’exécution | Logger/runtime env, helpers de délai d’expiration, de retry et de backoff |
  | `plugin-sdk/plugin-runtime` | Helpers partagés d’exécution de Plugin | Helpers de commandes/hooks/http/interactifs de Plugin |
  | `plugin-sdk/hook-runtime` | Helpers de pipeline de hook | Helpers partagés de pipeline de Webhook/hook interne |
  | `plugin-sdk/lazy-runtime` | Helpers d’exécution paresseuse | `createLazyRuntimeModule`, `createLazyRuntimeMethod`, `createLazyRuntimeMethodBinder`, `createLazyRuntimeNamedExport`, `createLazyRuntimeSurface` |
  | `plugin-sdk/process-runtime` | Helpers de processus | Helpers partagés d’exécution |
  | `plugin-sdk/cli-runtime` | Helpers d’exécution CLI | Formatage des commandes, attentes, helpers de version |
  | `plugin-sdk/gateway-runtime` | Helpers Gateway | Client Gateway et helpers de patch d’état de canal |
  | `plugin-sdk/config-runtime` | Helpers de configuration | Helpers de chargement/écriture de configuration |
  | `plugin-sdk/telegram-command-config` | Helpers de commandes Telegram | Helpers de validation de commandes Telegram stables en repli lorsque la surface de contrat Telegram groupée n’est pas disponible |
  | `plugin-sdk/approval-runtime` | Helpers de prompt d’approbation | Helpers de payload d’approbation exec/Plugin, de capacité/profil d’approbation, de routage/exécution d’approbation native |
  | `plugin-sdk/approval-auth-runtime` | Helpers d’authentification d’approbation | Résolution de l’approbateur, autorisation d’action dans le même chat |
  | `plugin-sdk/approval-client-runtime` | Helpers de client d’approbation | Helpers de profil/filtre d’approbation exec native |
  | `plugin-sdk/approval-delivery-runtime` | Helpers de distribution d’approbation | Adaptateurs de capacité/distribution d’approbation native |
  | `plugin-sdk/approval-gateway-runtime` | Helpers Gateway d’approbation | Helper partagé de résolution de Gateway d’approbation |
  | `plugin-sdk/approval-handler-adapter-runtime` | Helpers d’adaptateur d’approbation | Helpers légers de chargement d’adaptateur d’approbation native pour les points d’entrée de canal à chaud |
  | `plugin-sdk/approval-handler-runtime` | Helpers de gestionnaire d’approbation | Helpers plus étendus d’exécution de gestionnaire d’approbation ; préférez les couches adaptateur/Gateway plus ciblées lorsqu’elles suffisent |
  | `plugin-sdk/approval-native-runtime` | Helpers de cible d’approbation | Helpers natifs de cible d’approbation/liaison de compte |
  | `plugin-sdk/approval-reply-runtime` | Helpers de réponse d’approbation | Helpers de payload de réponse d’approbation exec/Plugin |
  | `plugin-sdk/channel-runtime-context` | Helpers de contexte d’exécution de canal | Helpers génériques d’enregistrement/lecture/surveillance du contexte d’exécution de canal |
  | `plugin-sdk/security-runtime` | Helpers de sécurité | Helpers partagés de confiance, de filtrage DM, de contenu externe et de collecte de secrets |
  | `plugin-sdk/ssrf-policy` | Helpers de politique SSRF | Helpers de liste d’autorisation d’hôte et de politique réseau privé |
  | `plugin-sdk/ssrf-runtime` | Helpers d’exécution SSRF | Répartiteur épinglé, fetch protégé, helpers de politique SSRF |
  | `plugin-sdk/collection-runtime` | Helpers de cache borné | `pruneMapToMaxSize` |
  | `plugin-sdk/diagnostic-runtime` | Helpers de filtrage diagnostique | `isDiagnosticFlagEnabled`, `isDiagnosticsEnabled` |
  | `plugin-sdk/error-runtime` | Helpers de formatage des erreurs | `formatUncaughtError`, `isApprovalNotFoundError`, helpers de graphe d’erreurs |
  | `plugin-sdk/fetch-runtime` | Helpers de fetch/proxy encapsulés | `resolveFetch`, helpers de proxy |
  | `plugin-sdk/host-runtime` | Helpers de normalisation d’hôte | `normalizeHostname`, `normalizeScpRemoteHost` |
  | `plugin-sdk/retry-runtime` | Helpers de retry | `RetryConfig`, `retryAsync`, exécuteurs de politique |
  | `plugin-sdk/allow-from` | Formatage de liste d’autorisation | `formatAllowFromLowercase` |
  | `plugin-sdk/allowlist-resolution` | Mappage d’entrée de liste d’autorisation | `mapAllowlistResolutionInputs` |
  | `plugin-sdk/command-auth` | Filtrage des commandes et helpers de surface de commande | `resolveControlCommandGate`, helpers d’autorisation de l’expéditeur, helpers de registre de commandes |
  | `plugin-sdk/command-status` | Moteurs de rendu d’état/aide des commandes | `buildCommandsMessage`, `buildCommandsMessagePaginated`, `buildHelpMessage` |
  | `plugin-sdk/secret-input` | Analyse des entrées secrètes | Helpers d’entrée secrète |
  | `plugin-sdk/webhook-ingress` | Helpers de requête Webhook | Utilitaires de cible Webhook |
  | `plugin-sdk/webhook-request-guards` | Helpers de garde du corps de requête Webhook | Helpers de lecture/limitation du corps de requête |
  | `plugin-sdk/reply-runtime` | Exécution partagée des réponses | Répartition entrante, Heartbeat, planificateur de réponse, découpage |
  | `plugin-sdk/reply-dispatch-runtime` | Helpers ciblés de répartition des réponses | Helpers de finalisation + répartition provider |
  | `plugin-sdk/reply-history` | Helpers d’historique des réponses | `buildHistoryContext`, `buildPendingHistoryContextFromMap`, `recordPendingHistoryEntry`, `clearHistoryEntriesIfEnabled` |
  | `plugin-sdk/reply-reference` | Planification de référence de réponse | `createReplyReferencePlanner` |
  | `plugin-sdk/reply-chunking` | Helpers de découpage des réponses | Helpers de découpage texte/Markdown |
  | `plugin-sdk/session-store-runtime` | Helpers de stockage de session | Helpers de chemin de stockage + `updated-at` |
  | `plugin-sdk/state-paths` | Helpers de chemins d’état | Helpers de répertoire d’état et OAuth |
  | `plugin-sdk/routing` | Helpers de routage/clé de session | `resolveAgentRoute`, `buildAgentSessionKey`, `resolveDefaultAgentBoundAccountId`, helpers de normalisation de clé de session |
  | `plugin-sdk/status-helpers` | Helpers d’état de canal | Builders de résumé d’état de canal/compte, valeurs par défaut d’état d’exécution, helpers de métadonnées d’incident |
  | `plugin-sdk/target-resolver-runtime` | Helpers de résolution de cible | Helpers partagés de résolution de cible |
  | `plugin-sdk/string-normalization-runtime` | Helpers de normalisation de chaîne | Helpers de normalisation de slug/chaîne |
  | `plugin-sdk/request-url` | Helpers d’URL de requête | Extraire des URL sous forme de chaîne à partir d’entrées de type requête |
  | `plugin-sdk/run-command` | Helpers de commande chronométrée | Exécuteur de commande chronométrée avec stdout/stderr normalisés |
  | `plugin-sdk/param-readers` | Lecteurs de paramètres | Lecteurs courants de paramètres d’outil/CLI |
  | `plugin-sdk/tool-payload` | Extraction de payload d’outil | Extraire des payloads normalisés à partir d’objets de résultat d’outil |
  | `plugin-sdk/tool-send` | Extraction d’envoi d’outil | Extraire les champs canoniques de cible d’envoi à partir des arguments d’outil |
  | `plugin-sdk/temp-path` | Helpers de chemin temporaire | Helpers partagés de chemin de téléchargement temporaire |
  | `plugin-sdk/logging-core` | Helpers de journalisation | Logger de sous-système et helpers de rédaction |
  | `plugin-sdk/markdown-table-runtime` | Helpers de tableau Markdown | Helpers de mode de tableau Markdown |
  | `plugin-sdk/reply-payload` | Types de réponse de message | Types de payload de réponse |
  | `plugin-sdk/provider-setup` | Helpers de configuration local/self-hosted de provider organisés | Helpers de découverte/configuration de provider auto-hébergé |
  | `plugin-sdk/self-hosted-provider-setup` | Helpers ciblés de configuration de provider auto-hébergé compatible OpenAI | Les mêmes helpers de découverte/configuration de provider auto-hébergé |
  | `plugin-sdk/provider-auth-runtime` | Helpers d’authentification d’exécution du provider | Helpers de résolution de clé API à l’exécution |
  | `plugin-sdk/provider-auth-api-key` | Helpers de configuration de clé API du provider | Helpers d’onboarding/écriture de profil de clé API |
  | `plugin-sdk/provider-auth-result` | Helpers de résultat d’authentification du provider | Builder standard de résultat d’authentification OAuth |
  | `plugin-sdk/provider-auth-login` | Helpers de connexion interactive du provider | Helpers partagés de connexion interactive |
  | `plugin-sdk/provider-env-vars` | Helpers de variables d’environnement du provider | Helpers de recherche de variables d’environnement d’authentification du provider |
  | `plugin-sdk/provider-model-shared` | Helpers partagés de modèle/relecture du provider | `ProviderReplayFamily`, `buildProviderReplayFamilyHooks`, `normalizeModelCompat`, builders partagés de politique de relecture, helpers de point de terminaison du provider et helpers de normalisation d’identifiant de modèle |
  | `plugin-sdk/provider-catalog-shared` | Helpers partagés du catalogue de providers | `findCatalogTemplate`, `buildSingleProviderApiKeyCatalog`, `supportsNativeStreamingUsageCompat`, `applyProviderNativeStreamingUsageCompat` |
  | `plugin-sdk/provider-onboard` | Correctifs d’onboarding des providers | Helpers de configuration d’onboarding |
  | `plugin-sdk/provider-http` | Helpers HTTP des providers | Helpers génériques HTTP/capacités de point de terminaison des providers |
  | `plugin-sdk/provider-web-fetch` | Helpers de web-fetch des providers | Helpers d’enregistrement/de cache des providers de web-fetch |
  | `plugin-sdk/provider-web-search-config-contract` | Helpers de configuration de recherche web des providers | Helpers ciblés de configuration/d’identifiants de recherche web pour les providers qui n’ont pas besoin de câblage d’activation de Plugin |
  | `plugin-sdk/provider-web-search-contract` | Helpers de contrat de recherche web des providers | Helpers ciblés de contrat de configuration/d’identifiants de recherche web tels que `createWebSearchProviderContractFields`, `enablePluginInConfig`, `resolveProviderWebSearchPluginConfig` et setters/getters d’identifiants à portée limitée |
  | `plugin-sdk/provider-web-search` | Helpers de recherche web des providers | Helpers d’enregistrement/de cache/d’exécution des providers de recherche web |
  | `plugin-sdk/provider-tools` | Helpers de compatibilité outil/schéma des providers | `ProviderToolCompatFamily`, `buildProviderToolCompatFamilyHooks`, nettoyage de schéma Gemini + diagnostics, et helpers de compatibilité xAI tels que `resolveXaiModelCompatPatch` / `applyXaiModelCompat` |
  | `plugin-sdk/provider-usage` | Helpers d’usage des providers | `fetchClaudeUsage`, `fetchGeminiUsage`, `fetchGithubCopilotUsage` et autres helpers d’usage des providers |
  | `plugin-sdk/provider-stream` | Helpers d’encapsulation de flux des providers | `ProviderStreamFamily`, `buildProviderStreamFamilyHooks`, `composeProviderStreamWrappers`, types d’encapsulation de flux, et helpers partagés d’encapsulation Anthropic/Bedrock/Google/Kilocode/Moonshot/OpenAI/OpenRouter/Z.A.I/MiniMax/Copilot |
  | `plugin-sdk/keyed-async-queue` | File asynchrone ordonnée | `KeyedAsyncQueue` |
  | `plugin-sdk/media-runtime` | Helpers média partagés | Helpers de récupération/transformation/stockage de média ainsi que builders de payload média |
  | `plugin-sdk/media-generation-runtime` | Helpers partagés de génération de média | Helpers partagés de basculement, sélection de candidats et messages de modèle manquant pour la génération d’image/vidéo/musique |
  | `plugin-sdk/media-understanding` | Helpers de compréhension des médias | Types de providers de compréhension des médias ainsi qu’exports de helpers image/audio destinés aux providers |
  | `plugin-sdk/text-runtime` | Helpers texte partagés | Suppression du texte visible par l’assistant, helpers de rendu/découpage/tableau Markdown, helpers de rédaction, helpers de balises de directive, utilitaires de texte sûr et helpers associés de texte/journalisation |
  | `plugin-sdk/text-chunking` | Helpers de découpage de texte | Helper de découpage de texte sortant |
  | `plugin-sdk/speech` | Helpers Speech | Types de providers Speech ainsi qu’helpers de directive, de registre et de validation destinés aux providers |
  | `plugin-sdk/speech-core` | Noyau Speech partagé | Types de providers Speech, registre, directives, normalisation |
  | `plugin-sdk/realtime-transcription` | Helpers de transcription en temps réel | Types de providers et helpers de registre |
  | `plugin-sdk/realtime-voice` | Helpers de voix en temps réel | Types de providers et helpers de registre |
  | `plugin-sdk/image-generation-core` | Noyau partagé de génération d’images | Types, helpers de basculement, d’authentification et de registre pour la génération d’images |
  | `plugin-sdk/music-generation` | Helpers de génération de musique | Types de provider/requête/résultat pour la génération de musique |
  | `plugin-sdk/music-generation-core` | Noyau partagé de génération de musique | Types de génération de musique, helpers de basculement, recherche de provider et analyse de model-ref |
  | `plugin-sdk/video-generation` | Helpers de génération de vidéo | Types de provider/requête/résultat pour la génération de vidéo |
  | `plugin-sdk/video-generation-core` | Noyau partagé de génération de vidéo | Types de génération de vidéo, helpers de basculement, recherche de provider et analyse de model-ref |
  | `plugin-sdk/interactive-runtime` | Helpers de réponse interactive | Normalisation/réduction du payload de réponse interactive |
  | `plugin-sdk/channel-config-primitives` | Primitives de configuration de canal | Primitives ciblées de schéma de configuration de canal |
  | `plugin-sdk/channel-config-writes` | Helpers d’écriture de configuration de canal | Helpers d’autorisation d’écriture de configuration de canal |
  | `plugin-sdk/channel-plugin-common` | Prélude de canal partagé | Exports partagés du prélude de Plugin de canal |
  | `plugin-sdk/channel-status` | Helpers d’état de canal | Helpers partagés d’instantané/de résumé de l’état du canal |
  | `plugin-sdk/allowlist-config-edit` | Helpers de configuration de liste d’autorisation | Helpers d’édition/de lecture de configuration de liste d’autorisation |
  | `plugin-sdk/group-access` | Helpers d’accès de groupe | Helpers partagés de décision d’accès de groupe |
  | `plugin-sdk/direct-dm` | Helpers de DM direct | Helpers partagés d’authentification/de garde pour DM direct |
  | `plugin-sdk/extension-shared` | Helpers d’extension partagés | Primitives de helper pour canal passif/état et proxy ambiant |
  | `plugin-sdk/webhook-targets` | Helpers de cible Webhook | Helpers de registre de cible Webhook et d’installation de route |
  | `plugin-sdk/webhook-path` | Helpers de chemin Webhook | Helpers de normalisation de chemin Webhook |
  | `plugin-sdk/web-media` | Helpers média web partagés | Helpers de chargement de média distant/local |
  | `plugin-sdk/zod` | Réexportation de Zod | `zod` réexporté pour les consommateurs du Plugin SDK |
  | `plugin-sdk/memory-core` | Helpers groupés memory-core | Surface de helpers pour le gestionnaire/configuration/fichier/CLI de la mémoire |
  | `plugin-sdk/memory-core-engine-runtime` | Façade d’exécution du moteur mémoire | Façade d’exécution d’indexation/recherche mémoire |
  | `plugin-sdk/memory-core-host-engine-foundation` | Moteur de fondation hôte de la mémoire | Exports du moteur de fondation hôte de la mémoire |
  | `plugin-sdk/memory-core-host-engine-embeddings` | Moteur d’embeddings hôte de la mémoire | Contrats d’embeddings mémoire, accès au registre, provider local et helpers génériques de lot/distant ; les providers distants concrets résident dans leurs Plugins propriétaires |
  | `plugin-sdk/memory-core-host-engine-qmd` | Moteur QMD hôte de la mémoire | Exports du moteur QMD hôte de la mémoire |
  | `plugin-sdk/memory-core-host-engine-storage` | Moteur de stockage hôte de la mémoire | Exports du moteur de stockage hôte de la mémoire |
  | `plugin-sdk/memory-core-host-multimodal` | Helpers multimodaux hôte de la mémoire | Helpers multimodaux hôte de la mémoire |
  | `plugin-sdk/memory-core-host-query` | Helpers de requête hôte de la mémoire | Helpers de requête hôte de la mémoire |
  | `plugin-sdk/memory-core-host-secret` | Helpers de secret hôte de la mémoire | Helpers de secret hôte de la mémoire |
  | `plugin-sdk/memory-core-host-events` | Helpers de journal d’événements hôte de la mémoire | Helpers de journal d’événements hôte de la mémoire |
  | `plugin-sdk/memory-core-host-status` | Helpers d’état hôte de la mémoire | Helpers d’état hôte de la mémoire |
  | `plugin-sdk/memory-core-host-runtime-cli` | Exécution CLI hôte de la mémoire | Helpers d’exécution CLI hôte de la mémoire |
  | `plugin-sdk/memory-core-host-runtime-core` | Exécution core hôte de la mémoire | Helpers d’exécution core hôte de la mémoire |
  | `plugin-sdk/memory-core-host-runtime-files` | Helpers de fichier/d’exécution hôte de la mémoire | Helpers de fichier/d’exécution hôte de la mémoire |
  | `plugin-sdk/memory-host-core` | Alias d’exécution core hôte de la mémoire | Alias neutre vis-à-vis du fournisseur pour les helpers d’exécution core hôte de la mémoire |
  | `plugin-sdk/memory-host-events` | Alias de journal d’événements hôte de la mémoire | Alias neutre vis-à-vis du fournisseur pour les helpers de journal d’événements hôte de la mémoire |
  | `plugin-sdk/memory-host-files` | Alias de fichier/d’exécution hôte de la mémoire | Alias neutre vis-à-vis du fournisseur pour les helpers de fichier/d’exécution hôte de la mémoire |
  | `plugin-sdk/memory-host-markdown` | Helpers de Markdown géré | Helpers partagés de Markdown géré pour les Plugins adjacents à la mémoire |
  | `plugin-sdk/memory-host-search` | Façade de recherche Active Memory | Façade d’exécution paresseuse du gestionnaire de recherche Active Memory |
  | `plugin-sdk/memory-host-status` | Alias d’état hôte de la mémoire | Alias neutre vis-à-vis du fournisseur pour les helpers d’état hôte de la mémoire |
  | `plugin-sdk/memory-lancedb` | Helpers groupés memory-lancedb | Surface de helpers memory-lancedb |
  | `plugin-sdk/testing` | Utilitaires de test | Helpers de test et mocks |
</Accordion>

Ce tableau correspond intentionnellement au sous-ensemble commun de migration, et non à la surface complète
du SDK. La liste complète des plus de 200 points d’entrée se trouve dans
`scripts/lib/plugin-sdk-entrypoints.json`.

Cette liste inclut encore certaines couches de helpers de Plugins groupés telles que
`plugin-sdk/feishu`, `plugin-sdk/feishu-setup`, `plugin-sdk/zalo`,
`plugin-sdk/zalo-setup`, et `plugin-sdk/matrix*`. Elles restent exportées pour la
maintenance et la compatibilité des Plugins groupés, mais elles sont volontairement
omises du tableau de migration commun et ne constituent pas la cible recommandée pour
le nouveau code de Plugin.

La même règle s’applique aux autres familles de helpers groupés telles que :

- helpers de prise en charge du navigateur : `plugin-sdk/browser-cdp`, `plugin-sdk/browser-config-runtime`, `plugin-sdk/browser-config-support`, `plugin-sdk/browser-control-auth`, `plugin-sdk/browser-node-runtime`, `plugin-sdk/browser-profiles`, `plugin-sdk/browser-security-runtime`, `plugin-sdk/browser-setup-tools`, `plugin-sdk/browser-support`
- Matrix : `plugin-sdk/matrix*`
- LINE : `plugin-sdk/line*`
- IRC : `plugin-sdk/irc*`
- surfaces de helper/Plugin groupées comme `plugin-sdk/googlechat`,
  `plugin-sdk/zalouser`, `plugin-sdk/bluebubbles*`,
  `plugin-sdk/mattermost*`, `plugin-sdk/msteams`,
  `plugin-sdk/nextcloud-talk`, `plugin-sdk/nostr`, `plugin-sdk/tlon`,
  `plugin-sdk/twitch`,
  `plugin-sdk/github-copilot-login`, `plugin-sdk/github-copilot-token`,
  `plugin-sdk/diagnostics-otel`, `plugin-sdk/diffs`, `plugin-sdk/llm-task`,
  `plugin-sdk/thread-ownership`, et `plugin-sdk/voice-call`

`plugin-sdk/github-copilot-token` expose actuellement la surface ciblée de helper de jeton
`DEFAULT_COPILOT_API_BASE_URL`,
`deriveCopilotApiBaseUrlFromToken`, et `resolveCopilotApiToken`.

Utilisez l’import le plus ciblé qui correspond à la tâche. Si vous ne trouvez pas une exportation,
consultez la source dans `src/plugin-sdk/` ou demandez dans Discord.

## Calendrier de suppression

| Quand | Ce qui se passe |
| ---------------------- | ----------------------------------------------------------------------- |
| **Maintenant** | Les surfaces dépréciées émettent des avertissements à l’exécution |
| **Prochaine version majeure** | Les surfaces dépréciées seront supprimées ; les Plugins qui les utilisent encore échoueront |

Tous les Plugins du core ont déjà été migrés. Les Plugins externes doivent migrer
avant la prochaine version majeure.

## Supprimer temporairement les avertissements

Définissez ces variables d’environnement pendant que vous travaillez à la migration :

```bash
OPENCLAW_SUPPRESS_PLUGIN_SDK_COMPAT_WARNING=1 openclaw gateway run
OPENCLAW_SUPPRESS_EXTENSION_API_WARNING=1 openclaw gateway run
```

Il s’agit d’une échappatoire temporaire, et non d’une solution permanente.

## Liens associés

- [Bien démarrer](/fr/plugins/building-plugins) — créez votre premier Plugin
- [Vue d’ensemble du SDK](/fr/plugins/sdk-overview) — référence complète des imports par sous-chemin
- [Plugins de canal](/fr/plugins/sdk-channel-plugins) — créer des Plugins de canal
- [Plugins de provider](/fr/plugins/sdk-provider-plugins) — créer des Plugins de provider
- [Internes des Plugins](/fr/plugins/architecture) — analyse approfondie de l’architecture
- [Manifest de Plugin](/fr/plugins/manifest) — référence du schéma du manifest
