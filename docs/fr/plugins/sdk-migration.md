---
read_when:
    - Vous voyez l'avertissement OPENCLAW_PLUGIN_SDK_COMPAT_DEPRECATED
    - Vous voyez l'avertissement OPENCLAW_EXTENSION_API_DEPRECATED
    - Vous mettez à jour un plugin vers l'architecture de plugin moderne
    - Vous maintenez un plugin OpenClaw externe
sidebarTitle: Migrate to SDK
summary: Migrez depuis la couche héritée de rétrocompatibilité vers le Plugin SDK moderne
title: Migration du Plugin SDK
x-i18n:
    generated_at: "2026-04-09T01:29:23Z"
    model: gpt-5.4
    provider: openai
    source_hash: 60cbb6c8be30d17770887d490c14e3a4538563339a5206fb419e51e0558bbc07
    source_path: plugins/sdk-migration.md
    workflow: 15
---

# Migration du Plugin SDK

OpenClaw est passé d'une large couche de rétrocompatibilité à une architecture de plugin
moderne avec des imports ciblés et documentés. Si votre plugin a été créé avant
la nouvelle architecture, ce guide vous aidera à migrer.

## Ce qui change

L'ancien système de plugins fournissait deux surfaces très ouvertes qui permettaient aux plugins d'importer
tout ce dont ils avaient besoin depuis un seul point d'entrée :

- **`openclaw/plugin-sdk/compat`** — un import unique qui réexportait des dizaines de
  helpers. Il a été introduit pour maintenir le fonctionnement des anciens plugins basés sur des hooks pendant que la
  nouvelle architecture de plugin était en cours de construction.
- **`openclaw/extension-api`** — un pont qui donnait aux plugins un accès direct à
  des helpers côté hôte comme l'exécuteur d'agent embarqué.

Ces deux surfaces sont maintenant **obsolètes**. Elles fonctionnent toujours à l'exécution, mais les nouveaux
plugins ne doivent pas les utiliser, et les plugins existants doivent migrer avant que la prochaine
version majeure ne les supprime.

<Warning>
  La couche de rétrocompatibilité sera supprimée dans une future version majeure.
  Les plugins qui importent encore depuis ces surfaces ne fonctionneront plus lorsque cela arrivera.
</Warning>

## Pourquoi cela a changé

L'ancienne approche causait des problèmes :

- **Démarrage lent** — importer un helper chargeait des dizaines de modules sans rapport
- **Dépendances circulaires** — les réexportations larges facilitaient la création de cycles d'import
- **Surface d'API floue** — il n'y avait aucun moyen de distinguer quels exports étaient stables et lesquels étaient internes

Le Plugin SDK moderne corrige cela : chaque chemin d'import (`openclaw/plugin-sdk/\<subpath\>`)
est un petit module autonome avec une finalité claire et un contrat documenté.

Les interfaces de commodité provider héritées pour les canaux intégrés ont également disparu. Les imports
tels que `openclaw/plugin-sdk/slack`, `openclaw/plugin-sdk/discord`,
`openclaw/plugin-sdk/signal`, `openclaw/plugin-sdk/whatsapp`,
les interfaces helpers de marque de canal, ainsi que
`openclaw/plugin-sdk/telegram-core` étaient des raccourcis privés du mono-repo, pas
des contrats de plugin stables. Utilisez plutôt des sous-chemins SDK génériques et étroits. À l'intérieur de l'
espace de travail du plugin intégré, conservez les helpers détenus par le provider dans l'
`api.ts` ou `runtime-api.ts` de ce plugin.

Exemples actuels de providers intégrés :

- Anthropic conserve les helpers de flux spécifiques à Claude dans sa propre interface `api.ts` /
  `contract-api.ts`
- OpenAI conserve les builders de provider, les helpers de modèle par défaut et les builders de provider temps réel
  dans son propre `api.ts`
- OpenRouter conserve le builder de provider ainsi que les helpers d'onboarding/configuration dans son propre
  `api.ts`

## Comment migrer

<Steps>
  <Step title="Migrer les gestionnaires approval-native vers les faits de capacité">
    Les plugins de canal capables d'approbation exposent désormais le comportement d'approbation natif via
    `approvalCapability.nativeRuntime` ainsi que le registre partagé de contexte d'exécution.

    Changements clés :

    - Remplacez `approvalCapability.handler.loadRuntime(...)` par
      `approvalCapability.nativeRuntime`
    - Déplacez l'authentification/la livraison spécifiques aux approbations hors du câblage hérité `plugin.auth` /
      `plugin.approvals` vers `approvalCapability`
    - `ChannelPlugin.approvals` a été supprimé du contrat public du plugin de canal ;
      déplacez les champs delivery/native/render vers `approvalCapability`
    - `plugin.auth` reste réservé aux flux de connexion/déconnexion du canal ; les hooks d'authentification
      d'approbation qui s'y trouvent ne sont plus lus par le cœur
    - Enregistrez les objets d'exécution détenus par le canal tels que clients, jetons ou applications Bolt
      via `openclaw/plugin-sdk/channel-runtime-context`
    - N'envoyez pas d'avis de reroutage détenus par le plugin depuis des gestionnaires d'approbation natifs ;
      le cœur gère désormais les avis « routé ailleurs » à partir des résultats de livraison réels
    - Lors du passage de `channelRuntime` à `createChannelManager(...)`, fournissez une
      vraie surface `createPluginRuntime().channel`. Les stubs partiels sont rejetés.

    Voir `/plugins/sdk-channel-plugins` pour la disposition actuelle de la
    capacité d'approbation.

  </Step>

  <Step title="Auditer le comportement de repli du wrapper Windows">
    Si votre plugin utilise `openclaw/plugin-sdk/windows-spawn`, les wrappers Windows
    `.cmd`/`.bat` non résolus échouent désormais de manière fermée sauf si vous passez explicitement
    `allowShellFallback: true`.

    ```typescript
    // Avant
    const program = applyWindowsSpawnProgramPolicy({ candidate });

    // Après
    const program = applyWindowsSpawnProgramPolicy({
      candidate,
      // Définissez ceci uniquement pour les appelants de compatibilité de confiance qui
      // acceptent intentionnellement le repli via le shell.
      allowShellFallback: true,
    });
    ```

    Si votre appelant ne repose pas intentionnellement sur un repli shell, ne définissez pas
    `allowShellFallback` et gérez plutôt l'erreur levée.

  </Step>

  <Step title="Trouver les imports obsolètes">
    Recherchez dans votre plugin les imports depuis l'une ou l'autre des surfaces obsolètes :

    ```bash
    grep -r "plugin-sdk/compat" my-plugin/
    grep -r "openclaw/extension-api" my-plugin/
    ```

  </Step>

  <Step title="Remplacer par des imports ciblés">
    Chaque export de l'ancienne surface correspond à un chemin d'import moderne spécifique :

    ```typescript
    // Avant (couche de rétrocompatibilité obsolète)
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

    Pour les helpers côté hôte, utilisez le runtime de plugin injecté au lieu d'importer
    directement :

    ```typescript
    // Avant (pont extension-api obsolète)
    import { runEmbeddedPiAgent } from "openclaw/extension-api";
    const result = await runEmbeddedPiAgent({ sessionId, prompt });

    // Après (runtime injecté)
    const result = await api.runtime.agent.runEmbeddedPiAgent({ sessionId, prompt });
    ```

    Le même modèle s'applique aux autres helpers de pont hérités :

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

## Référence des chemins d'import

<Accordion title="Tableau des chemins d'import courants">
  | Chemin d'import | Finalité | Exports clés |
  | --- | --- | --- |
  | `plugin-sdk/plugin-entry` | Helper canonique de point d'entrée de plugin | `definePluginEntry` |
  | `plugin-sdk/core` | Réexportation parapluie héritée pour les définitions/builders d'entrée de canal | `defineChannelPluginEntry`, `createChatChannelPlugin` |
  | `plugin-sdk/config-schema` | Export du schéma de configuration racine | `OpenClawSchema` |
  | `plugin-sdk/provider-entry` | Helper de point d'entrée de provider unique | `defineSingleProviderPluginEntry` |
  | `plugin-sdk/channel-core` | Définitions et builders ciblés de point d'entrée de canal | `defineChannelPluginEntry`, `defineSetupPluginEntry`, `createChatChannelPlugin`, `createChannelPluginBase` |
  | `plugin-sdk/setup` | Helpers partagés pour l'assistant de configuration | Prompts de liste d'autorisation, builders d'état de configuration |
  | `plugin-sdk/setup-runtime` | Helpers d'exécution au moment de la configuration | Adaptateurs de patch de configuration sûrs à importer, helpers de notes de recherche, `promptResolvedAllowFrom`, `splitSetupEntries`, proxys de configuration déléguée |
  | `plugin-sdk/setup-adapter-runtime` | Helpers d'adaptateur de configuration | `createEnvPatchedAccountSetupAdapter` |
  | `plugin-sdk/setup-tools` | Helpers d'outillage de configuration | `formatCliCommand`, `detectBinary`, `extractArchive`, `resolveBrewExecutable`, `formatDocsLink`, `CONFIG_DIR` |
  | `plugin-sdk/account-core` | Helpers multi-comptes | Helpers de liste/configuration/contrôle d'action de compte |
  | `plugin-sdk/account-id` | Helpers d'ID de compte | `DEFAULT_ACCOUNT_ID`, normalisation d'ID de compte |
  | `plugin-sdk/account-resolution` | Helpers de recherche de compte | Helpers de recherche de compte + repli par défaut |
  | `plugin-sdk/account-helpers` | Helpers de compte étroits | Helpers de liste de compte/action de compte |
  | `plugin-sdk/channel-setup` | Adaptateurs d'assistant de configuration | `createOptionalChannelSetupSurface`, `createOptionalChannelSetupAdapter`, `createOptionalChannelSetupWizard`, ainsi que `DEFAULT_ACCOUNT_ID`, `createTopLevelChannelDmPolicy`, `setSetupChannelEnabled`, `splitSetupEntries` |
  | `plugin-sdk/channel-pairing` | Primitives de pairage DM | `createChannelPairingController` |
  | `plugin-sdk/channel-reply-pipeline` | Câblage de préfixe de réponse + frappe | `createChannelReplyPipeline` |
  | `plugin-sdk/channel-config-helpers` | Fabriques d'adaptateurs de configuration | `createHybridChannelConfigAdapter` |
  | `plugin-sdk/channel-config-schema` | Builders de schéma de configuration | Types de schéma de configuration de canal |
  | `plugin-sdk/telegram-command-config` | Helpers de configuration de commande Telegram | Normalisation de nom de commande, réduction de description, validation des doublons/conflits |
  | `plugin-sdk/channel-policy` | Résolution de politique groupe/DM | `resolveChannelGroupRequireMention` |
  | `plugin-sdk/channel-lifecycle` | Suivi d'état de compte | `createAccountStatusSink` |
  | `plugin-sdk/inbound-envelope` | Helpers d'enveloppe entrante | Helpers partagés de route + construction d'enveloppe |
  | `plugin-sdk/inbound-reply-dispatch` | Helpers de réponse entrante | Helpers partagés d'enregistrement et de distribution |
  | `plugin-sdk/messaging-targets` | Analyse des cibles de messagerie | Helpers d'analyse/correspondance de cible |
  | `plugin-sdk/outbound-media` | Helpers de média sortant | Chargement partagé de média sortant |
  | `plugin-sdk/outbound-runtime` | Helpers d'exécution sortante | Helpers de délégation d'identité/d'envoi sortants |
  | `plugin-sdk/thread-bindings-runtime` | Helpers de liaison de thread | Helpers de cycle de vie de liaison de thread et d'adaptateur |
  | `plugin-sdk/agent-media-payload` | Helpers hérités de charge utile média | Builder de charge utile média d'agent pour des dispositions de champs héritées |
  | `plugin-sdk/channel-runtime` | Shim de compatibilité obsolète | Utilitaires d'exécution de canal hérités uniquement |
  | `plugin-sdk/channel-send-result` | Types de résultat d'envoi | Types de résultat de réponse |
  | `plugin-sdk/runtime-store` | Stockage persistant de plugin | `createPluginRuntimeStore` |
  | `plugin-sdk/runtime` | Helpers d'exécution étendus | Helpers d'exécution/journalisation/sauvegarde/installation de plugin |
  | `plugin-sdk/runtime-env` | Helpers d'environnement d'exécution étroits | Helpers de logger/environnement d'exécution, délai, retry et backoff |
  | `plugin-sdk/plugin-runtime` | Helpers partagés d'exécution de plugin | Helpers de commandes/hooks/http/interactifs de plugin |
  | `plugin-sdk/hook-runtime` | Helpers de pipeline de hook | Helpers partagés de pipeline de hooks webhook/internes |
  | `plugin-sdk/lazy-runtime` | Helpers d'exécution différée | `createLazyRuntimeModule`, `createLazyRuntimeMethod`, `createLazyRuntimeMethodBinder`, `createLazyRuntimeNamedExport`, `createLazyRuntimeSurface` |
  | `plugin-sdk/process-runtime` | Helpers de processus | Helpers partagés d'exécution de commande |
  | `plugin-sdk/cli-runtime` | Helpers d'exécution CLI | Formatage de commandes, attentes, helpers de version |
  | `plugin-sdk/gateway-runtime` | Helpers de passerelle | Client de passerelle et helpers de patch d'état de canal |
  | `plugin-sdk/config-runtime` | Helpers de configuration | Helpers de chargement/écriture de configuration |
  | `plugin-sdk/telegram-command-config` | Helpers de commande Telegram | Helpers de validation de commande Telegram stables en repli lorsque la surface de contrat Telegram intégrée n'est pas disponible |
  | `plugin-sdk/approval-runtime` | Helpers de prompt d'approbation | Charge utile d'approbation exec/plugin, helpers de capacité/profil d'approbation, helpers natifs de routage/runtime d'approbation |
  | `plugin-sdk/approval-auth-runtime` | Helpers d'authentification d'approbation | Résolution d'approbateur, authentification d'action dans le même chat |
  | `plugin-sdk/approval-client-runtime` | Helpers client d'approbation | Helpers natifs de profil/filtre d'approbation exec |
  | `plugin-sdk/approval-delivery-runtime` | Helpers de livraison d'approbation | Adaptateurs natifs de capacité/livraison d'approbation |
  | `plugin-sdk/approval-gateway-runtime` | Helpers de passerelle d'approbation | Helper partagé de résolution de passerelle d'approbation |
  | `plugin-sdk/approval-handler-adapter-runtime` | Helpers d'adaptateur d'approbation | Helpers légers de chargement d'adaptateur d'approbation natif pour points d'entrée de canal à chaud |
  | `plugin-sdk/approval-handler-runtime` | Helpers de gestionnaire d'approbation | Helpers d'exécution plus larges pour gestionnaire d'approbation ; préférez les interfaces plus étroites d'adaptateur/passerelle lorsqu'elles suffisent |
  | `plugin-sdk/approval-native-runtime` | Helpers de cible d'approbation | Helpers natifs de liaison cible/compte d'approbation |
  | `plugin-sdk/approval-reply-runtime` | Helpers de réponse d'approbation | Helpers de charge utile de réponse d'approbation exec/plugin |
  | `plugin-sdk/channel-runtime-context` | Helpers de contexte d'exécution de canal | Helpers génériques d'enregistrement/obtention/surveillance de contexte d'exécution de canal |
  | `plugin-sdk/security-runtime` | Helpers de sécurité | Helpers partagés de confiance, contrôle DM, contenu externe et collecte de secrets |
  | `plugin-sdk/ssrf-policy` | Helpers de politique SSRF | Helpers de liste d'autorisation d'hôte et de politique de réseau privé |
  | `plugin-sdk/ssrf-runtime` | Helpers d'exécution SSRF | Helpers de pinned-dispatcher, fetch protégé et politique SSRF |
  | `plugin-sdk/collection-runtime` | Helpers de cache borné | `pruneMapToMaxSize` |
  | `plugin-sdk/diagnostic-runtime` | Helpers de contrôle diagnostic | `isDiagnosticFlagEnabled`, `isDiagnosticsEnabled` |
  | `plugin-sdk/error-runtime` | Helpers de formatage d'erreur | `formatUncaughtError`, `isApprovalNotFoundError`, helpers de graphe d'erreur |
  | `plugin-sdk/fetch-runtime` | Helpers fetch/proxy encapsulés | `resolveFetch`, helpers de proxy |
  | `plugin-sdk/host-runtime` | Helpers de normalisation d'hôte | `normalizeHostname`, `normalizeScpRemoteHost` |
  | `plugin-sdk/retry-runtime` | Helpers de retry | `RetryConfig`, `retryAsync`, exécuteurs de politique |
  | `plugin-sdk/allow-from` | Formatage de liste d'autorisation | `formatAllowFromLowercase` |
  | `plugin-sdk/allowlist-resolution` | Mappage d'entrée de liste d'autorisation | `mapAllowlistResolutionInputs` |
  | `plugin-sdk/command-auth` | Contrôle de commande et helpers de surface de commande | `resolveControlCommandGate`, helpers d'autorisation d'expéditeur, helpers de registre de commandes |
  | `plugin-sdk/command-status` | Rendu d'état/d'aide des commandes | `buildCommandsMessage`, `buildCommandsMessagePaginated`, `buildHelpMessage` |
  | `plugin-sdk/secret-input` | Analyse d'entrée de secret | Helpers d'entrée de secret |
  | `plugin-sdk/webhook-ingress` | Helpers de requête webhook | Utilitaires de cible webhook |
  | `plugin-sdk/webhook-request-guards` | Helpers de protection du corps webhook | Helpers de lecture/limite de corps de requête |
  | `plugin-sdk/reply-runtime` | Runtime de réponse partagé | Distribution entrante, heartbeat, planificateur de réponse, découpage |
  | `plugin-sdk/reply-dispatch-runtime` | Helpers étroits de distribution de réponse | Helpers de finalisation + distribution provider |
  | `plugin-sdk/reply-history` | Helpers d'historique de réponse | `buildHistoryContext`, `buildPendingHistoryContextFromMap`, `recordPendingHistoryEntry`, `clearHistoryEntriesIfEnabled` |
  | `plugin-sdk/reply-reference` | Planification de référence de réponse | `createReplyReferencePlanner` |
  | `plugin-sdk/reply-chunking` | Helpers de découpage de réponse | Helpers de découpage texte/markdown |
  | `plugin-sdk/session-store-runtime` | Helpers de magasin de session | Helpers de chemin de magasin + updated-at |
  | `plugin-sdk/state-paths` | Helpers de chemins d'état | Helpers de répertoires d'état et OAuth |
  | `plugin-sdk/routing` | Helpers de routage/clé de session | `resolveAgentRoute`, `buildAgentSessionKey`, `resolveDefaultAgentBoundAccountId`, helpers de normalisation de clé de session |
  | `plugin-sdk/status-helpers` | Helpers d'état de canal | Builders de résumé d'état de canal/compte, valeurs par défaut d'état runtime, helpers de métadonnées de problème |
  | `plugin-sdk/target-resolver-runtime` | Helpers de résolution de cible | Helpers partagés de résolution de cible |
  | `plugin-sdk/string-normalization-runtime` | Helpers de normalisation de chaîne | Helpers de normalisation slug/chaîne |
  | `plugin-sdk/request-url` | Helpers d'URL de requête | Extraction d'URL chaîne depuis des entrées de type requête |
  | `plugin-sdk/run-command` | Helpers de commande temporisée | Exécuteur de commande temporisée avec stdout/stderr normalisés |
  | `plugin-sdk/param-readers` | Lecteurs de paramètres | Lecteurs communs de paramètres d'outil/CLI |
  | `plugin-sdk/tool-payload` | Extraction de charge utile d'outil | Extraction de charges utiles normalisées depuis des objets de résultat d'outil |
  | `plugin-sdk/tool-send` | Extraction d'envoi d'outil | Extraction des champs de cible d'envoi canoniques depuis les arguments d'outil |
  | `plugin-sdk/temp-path` | Helpers de chemins temporaires | Helpers partagés de chemin de téléchargement temporaire |
  | `plugin-sdk/logging-core` | Helpers de journalisation | Logger de sous-système et helpers de masquage |
  | `plugin-sdk/markdown-table-runtime` | Helpers de tableau Markdown | Helpers de mode tableau Markdown |
  | `plugin-sdk/reply-payload` | Types de réponse de message | Types de charge utile de réponse |
  | `plugin-sdk/provider-setup` | Helpers de configuration sélectionnés pour providers locaux/autohébergés | Helpers de découverte/configuration de provider autohébergé |
  | `plugin-sdk/self-hosted-provider-setup` | Helpers ciblés de configuration de provider autohébergé compatible OpenAI | Les mêmes helpers de découverte/configuration de provider autohébergé |
  | `plugin-sdk/provider-auth-runtime` | Helpers d'authentification runtime de provider | Helpers de résolution runtime de clé API |
  | `plugin-sdk/provider-auth-api-key` | Helpers de configuration de clé API provider | Helpers d'onboarding/écriture de profil de clé API |
  | `plugin-sdk/provider-auth-result` | Helpers de résultat d'authentification provider | Builder standard de résultat d'authentification OAuth |
  | `plugin-sdk/provider-auth-login` | Helpers de connexion interactive provider | Helpers partagés de connexion interactive |
  | `plugin-sdk/provider-env-vars` | Helpers de variables d'environnement provider | Helpers de recherche de variables d'environnement d'authentification provider |
  | `plugin-sdk/provider-model-shared` | Helpers partagés de modèle/relecture provider | `ProviderReplayFamily`, `buildProviderReplayFamilyHooks`, `normalizeModelCompat`, builders partagés de politique de relecture, helpers de point d'accès provider et helpers de normalisation d'ID de modèle |
  | `plugin-sdk/provider-catalog-shared` | Helpers partagés de catalogue provider | `findCatalogTemplate`, `buildSingleProviderApiKeyCatalog`, `supportsNativeStreamingUsageCompat`, `applyProviderNativeStreamingUsageCompat` |
  | `plugin-sdk/provider-onboard` | Patches d'onboarding provider | Helpers de configuration d'onboarding |
  | `plugin-sdk/provider-http` | Helpers HTTP provider | Helpers génériques HTTP/capacités de point d'accès provider |
  | `plugin-sdk/provider-web-fetch` | Helpers web-fetch provider | Helpers d'enregistrement/cache de provider web-fetch |
  | `plugin-sdk/provider-web-search-config-contract` | Helpers de configuration de recherche web provider | Helpers étroits de configuration/identifiants de recherche web pour les providers qui n'ont pas besoin de câblage d'activation de plugin |
  | `plugin-sdk/provider-web-search-contract` | Helpers de contrat de recherche web provider | Helpers étroits de contrat de configuration/identifiants de recherche web tels que `createWebSearchProviderContractFields`, `enablePluginInConfig`, `resolveProviderWebSearchPluginConfig`, et setters/getters d'identifiants à portée limitée |
  | `plugin-sdk/provider-web-search` | Helpers de recherche web provider | Helpers d'enregistrement/cache/runtime de provider de recherche web |
  | `plugin-sdk/provider-tools` | Helpers de compatibilité provider outil/schéma | `ProviderToolCompatFamily`, `buildProviderToolCompatFamilyHooks`, nettoyage de schéma Gemini + diagnostics, et helpers de compatibilité xAI tels que `resolveXaiModelCompatPatch` / `applyXaiModelCompat` |
  | `plugin-sdk/provider-usage` | Helpers d'usage provider | `fetchClaudeUsage`, `fetchGeminiUsage`, `fetchGithubCopilotUsage`, et autres helpers d'usage provider |
  | `plugin-sdk/provider-stream` | Helpers d'encapsulation de flux provider | `ProviderStreamFamily`, `buildProviderStreamFamilyHooks`, `composeProviderStreamWrappers`, types d'encapsulation de flux, et helpers partagés d'encapsulation Anthropic/Bedrock/Google/Kilocode/Moonshot/OpenAI/OpenRouter/Z.A.I/MiniMax/Copilot |
  | `plugin-sdk/keyed-async-queue` | File async ordonnée | `KeyedAsyncQueue` |
  | `plugin-sdk/media-runtime` | Helpers média partagés | Helpers de récupération/transformation/stockage de média ainsi que builders de charge utile média |
  | `plugin-sdk/media-generation-runtime` | Helpers partagés de génération média | Helpers partagés de basculement, sélection de candidat, et messages de modèle manquant pour la génération d'image/vidéo/musique |
  | `plugin-sdk/media-understanding` | Helpers de compréhension média | Types de provider de compréhension média ainsi que exports de helpers image/audio côté provider |
  | `plugin-sdk/text-runtime` | Helpers texte partagés | Suppression de texte visible par l'assistant, helpers de rendu/découpage/tableau markdown, helpers de masquage, helpers de balises de directive, utilitaires de texte sûr, et helpers associés de texte/journalisation |
  | `plugin-sdk/text-chunking` | Helpers de découpage de texte | Helper de découpage de texte sortant |
  | `plugin-sdk/speech` | Helpers de parole | Types de provider speech ainsi que helpers côté provider de directive, registre et validation |
  | `plugin-sdk/speech-core` | Cœur speech partagé | Types de provider speech, registre, directives, normalisation |
  | `plugin-sdk/realtime-transcription` | Helpers de transcription temps réel | Helpers de types provider et de registre |
  | `plugin-sdk/realtime-voice` | Helpers de voix temps réel | Helpers de types provider et de registre |
  | `plugin-sdk/image-generation-core` | Cœur partagé de génération d'image | Helpers de types, basculement, authentification et registre pour génération d'image |
  | `plugin-sdk/music-generation` | Helpers de génération musicale | Types de provider/requête/résultat pour génération musicale |
  | `plugin-sdk/music-generation-core` | Cœur partagé de génération musicale | Types de génération musicale, helpers de basculement, recherche de provider et analyse de référence de modèle |
  | `plugin-sdk/video-generation` | Helpers de génération vidéo | Types de provider/requête/résultat pour génération vidéo |
  | `plugin-sdk/video-generation-core` | Cœur partagé de génération vidéo | Types de génération vidéo, helpers de basculement, recherche de provider et analyse de référence de modèle |
  | `plugin-sdk/interactive-runtime` | Helpers de réponse interactive | Normalisation/réduction de charge utile de réponse interactive |
  | `plugin-sdk/channel-config-primitives` | Primitives de configuration de canal | Primitives étroites de schéma de configuration de canal |
  | `plugin-sdk/channel-config-writes` | Helpers d'écriture de configuration de canal | Helpers d'autorisation d'écriture de configuration de canal |
  | `plugin-sdk/channel-plugin-common` | Prélude de canal partagé | Exports partagés de prélude de plugin de canal |
  | `plugin-sdk/channel-status` | Helpers d'état de canal | Helpers partagés d'instantané/résumé d'état de canal |
  | `plugin-sdk/allowlist-config-edit` | Helpers de configuration de liste d'autorisation | Helpers de lecture/édition de configuration de liste d'autorisation |
  | `plugin-sdk/group-access` | Helpers d'accès de groupe | Helpers partagés de décision d'accès de groupe |
  | `plugin-sdk/direct-dm` | Helpers de DM direct | Helpers partagés d'authentification/protection de DM direct |
  | `plugin-sdk/extension-shared` | Helpers d'extension partagés | Primitives helpers de canal passif/état et proxy ambiant |
  | `plugin-sdk/webhook-targets` | Helpers de cibles webhook | Registre de cibles webhook et helpers d'installation de route |
  | `plugin-sdk/webhook-path` | Helpers de chemin webhook | Helpers de normalisation de chemin webhook |
  | `plugin-sdk/web-media` | Helpers média web partagés | Helpers de chargement de média distant/local |
  | `plugin-sdk/zod` | Réexportation Zod | `zod` réexporté pour les consommateurs du Plugin SDK |
  | `plugin-sdk/memory-core` | Helpers memory-core intégrés | Surface helper de gestionnaire/configuration/fichier/CLI mémoire |
  | `plugin-sdk/memory-core-engine-runtime` | Façade runtime du moteur mémoire | Façade runtime d'indexation/recherche mémoire |
  | `plugin-sdk/memory-core-host-engine-foundation` | Moteur foundation hôte mémoire | Exports du moteur foundation hôte mémoire |
  | `plugin-sdk/memory-core-host-engine-embeddings` | Moteur d'embeddings hôte mémoire | Exports du moteur d'embeddings hôte mémoire |
  | `plugin-sdk/memory-core-host-engine-qmd` | Moteur QMD hôte mémoire | Exports du moteur QMD hôte mémoire |
  | `plugin-sdk/memory-core-host-engine-storage` | Moteur de stockage hôte mémoire | Exports du moteur de stockage hôte mémoire |
  | `plugin-sdk/memory-core-host-multimodal` | Helpers multimodaux hôte mémoire | Helpers multimodaux hôte mémoire |
  | `plugin-sdk/memory-core-host-query` | Helpers de requête hôte mémoire | Helpers de requête hôte mémoire |
  | `plugin-sdk/memory-core-host-secret` | Helpers de secret hôte mémoire | Helpers de secret hôte mémoire |
  | `plugin-sdk/memory-core-host-events` | Helpers de journal d'événements hôte mémoire | Helpers de journal d'événements hôte mémoire |
  | `plugin-sdk/memory-core-host-status` | Helpers d'état hôte mémoire | Helpers d'état hôte mémoire |
  | `plugin-sdk/memory-core-host-runtime-cli` | Runtime CLI hôte mémoire | Helpers runtime CLI hôte mémoire |
  | `plugin-sdk/memory-core-host-runtime-core` | Runtime cœur hôte mémoire | Helpers runtime cœur hôte mémoire |
  | `plugin-sdk/memory-core-host-runtime-files` | Helpers fichier/runtime hôte mémoire | Helpers fichier/runtime hôte mémoire |
  | `plugin-sdk/memory-host-core` | Alias runtime cœur hôte mémoire | Alias neutre vis-à-vis du fournisseur pour les helpers runtime cœur hôte mémoire |
  | `plugin-sdk/memory-host-events` | Alias journal d'événements hôte mémoire | Alias neutre vis-à-vis du fournisseur pour les helpers de journal d'événements hôte mémoire |
  | `plugin-sdk/memory-host-files` | Alias fichier/runtime hôte mémoire | Alias neutre vis-à-vis du fournisseur pour les helpers fichier/runtime hôte mémoire |
  | `plugin-sdk/memory-host-markdown` | Helpers markdown géré | Helpers partagés de markdown géré pour les plugins adjacents à la mémoire |
  | `plugin-sdk/memory-host-search` | Façade de recherche de mémoire active | Façade runtime différée du gestionnaire de recherche de mémoire active |
  | `plugin-sdk/memory-host-status` | Alias d'état hôte mémoire | Alias neutre vis-à-vis du fournisseur pour les helpers d'état hôte mémoire |
  | `plugin-sdk/memory-lancedb` | Helpers memory-lancedb intégrés | Surface helper memory-lancedb |
  | `plugin-sdk/testing` | Utilitaires de test | Helpers et mocks de test |
</Accordion>

Ce tableau est volontairement le sous-ensemble courant de migration, et non la surface complète du SDK.
La liste complète des plus de 200 points d'entrée se trouve dans
`scripts/lib/plugin-sdk-entrypoints.json`.

Cette liste inclut encore certaines interfaces helpers de plugins intégrés telles que
`plugin-sdk/feishu`, `plugin-sdk/feishu-setup`, `plugin-sdk/zalo`,
`plugin-sdk/zalo-setup` et `plugin-sdk/matrix*`. Elles restent exportées pour
la maintenance et la compatibilité des plugins intégrés, mais elles sont intentionnellement
omises du tableau de migration courant et ne sont pas la cible recommandée pour
du nouveau code de plugin.

La même règle s'applique aux autres familles de helpers intégrés telles que :

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

`plugin-sdk/github-copilot-token` expose actuellement la surface étroite de helper de jeton
`DEFAULT_COPILOT_API_BASE_URL`,
`deriveCopilotApiBaseUrlFromToken` et `resolveCopilotApiToken`.

Utilisez l'import le plus étroit correspondant au besoin. Si vous ne trouvez pas un export,
consultez la source dans `src/plugin-sdk/` ou demandez sur Discord.

## Calendrier de suppression

| Quand | Ce qui se passe |
| ---------------------- | ----------------------------------------------------------------------- |
| **Maintenant** | Les surfaces obsolètes émettent des avertissements à l'exécution |
| **Prochaine version majeure** | Les surfaces obsolètes seront supprimées ; les plugins qui les utilisent encore échoueront |

Tous les plugins du cœur ont déjà été migrés. Les plugins externes doivent migrer
avant la prochaine version majeure.

## Supprimer temporairement les avertissements

Définissez ces variables d'environnement pendant que vous travaillez à la migration :

```bash
OPENCLAW_SUPPRESS_PLUGIN_SDK_COMPAT_WARNING=1 openclaw gateway run
OPENCLAW_SUPPRESS_EXTENSION_API_WARNING=1 openclaw gateway run
```

Il s'agit d'une échappatoire temporaire, pas d'une solution permanente.

## Liens associés

- [Premiers pas](/fr/plugins/building-plugins) — créez votre premier plugin
- [Vue d'ensemble du SDK](/fr/plugins/sdk-overview) — référence complète des imports par sous-chemin
- [Plugins de canal](/fr/plugins/sdk-channel-plugins) — création de plugins de canal
- [Plugins de provider](/fr/plugins/sdk-provider-plugins) — création de plugins de provider
- [Internes des plugins](/fr/plugins/architecture) — analyse détaillée de l'architecture
- [Manifeste de plugin](/fr/plugins/manifest) — référence du schéma de manifeste
