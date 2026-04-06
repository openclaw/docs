---
read_when:
    - Vous voyez l’avertissement OPENCLAW_PLUGIN_SDK_COMPAT_DEPRECATED
    - Vous voyez l’avertissement OPENCLAW_EXTENSION_API_DEPRECATED
    - Vous mettez à jour un plugin vers l’architecture de plugin moderne
    - Vous maintenez un plugin OpenClaw externe
sidebarTitle: Migrate to SDK
summary: Migrer de la couche héritée de rétrocompatibilité vers le SDK plugin moderne
title: Migration du SDK plugin
x-i18n:
    generated_at: "2026-04-06T06:57:47Z"
    model: gpt-5.4
    provider: openai
    source_hash: 94f12d1376edd8184714cc4dbea4a88fa8ed652f65e9365ede6176f3bf441b33
    source_path: plugins/sdk-migration.md
    workflow: 15
---

# Migration du SDK plugin

OpenClaw est passé d’une large couche de rétrocompatibilité à une architecture
de plugin moderne avec des imports ciblés et documentés. Si votre plugin a été
créé avant la nouvelle architecture, ce guide vous aide à le migrer.

## Ce qui change

L’ancien système de plugin fournissait deux surfaces très ouvertes qui
permettaient aux plugins d’importer tout ce dont ils avaient besoin depuis un
point d’entrée unique :

- **`openclaw/plugin-sdk/compat`** — un import unique qui réexportait des dizaines de
  helpers. Il a été introduit pour maintenir le fonctionnement des anciens
  plugins basés sur des hooks pendant la construction de la nouvelle
  architecture de plugin.
- **`openclaw/extension-api`** — un pont qui donnait aux plugins un accès direct à
  des helpers côté hôte comme l’exécuteur d’agent embarqué.

Ces deux surfaces sont désormais **obsolètes**. Elles fonctionnent encore à
l’exécution, mais les nouveaux plugins ne doivent pas les utiliser, et les
plugins existants doivent migrer avant que la prochaine version majeure ne les
supprime.

<Warning>
  La couche de rétrocompatibilité sera supprimée dans une future version majeure.
  Les plugins qui importent encore depuis ces surfaces cesseront de fonctionner à ce moment-là.
</Warning>

## Pourquoi cela a changé

L’ancienne approche causait des problèmes :

- **Démarrage lent** — importer un helper chargeait des dizaines de modules sans rapport
- **Dépendances circulaires** — de larges réexportations facilitaient la création de cycles d’import
- **Surface d’API peu claire** — aucun moyen de savoir quelles exportations étaient stables ou internes

Le SDK plugin moderne corrige cela : chaque chemin d’import (`openclaw/plugin-sdk/\<subpath\>`)
est un module petit et autonome avec un objectif clair et un contrat documenté.

Les coutures de commodité héritées pour les fournisseurs des canaux intégrés
ont également disparu. Les imports comme
`openclaw/plugin-sdk/slack`, `openclaw/plugin-sdk/discord`,
`openclaw/plugin-sdk/signal`, `openclaw/plugin-sdk/whatsapp`,
les coutures de helpers marquées au nom du canal, et
`openclaw/plugin-sdk/telegram-core` étaient des raccourcis privés du mono-repo,
pas des contrats de plugin stables. Utilisez plutôt des sous-chemins SDK
génériques et étroits. Dans l’espace de travail des plugins intégrés, gardez
les helpers propres au fournisseur dans le `api.ts` ou `runtime-api.ts` du
plugin concerné.

Exemples actuels de fournisseurs intégrés :

- Anthropic conserve les helpers de flux spécifiques à Claude dans sa propre couture `api.ts` /
  `contract-api.ts`
- OpenAI conserve les constructeurs de fournisseurs, les helpers de modèle par défaut et les constructeurs de fournisseur temps réel
  dans son propre `api.ts`
- OpenRouter conserve le constructeur de fournisseur et les helpers d’onboarding/config dans son propre
  `api.ts`

## Comment migrer

<Steps>
  <Step title="Auditer le comportement de repli du wrapper Windows">
    Si votre plugin utilise `openclaw/plugin-sdk/windows-spawn`, les wrappers Windows
    `.cmd`/`.bat` non résolus échouent désormais en mode fermé sauf si vous passez explicitement
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
    Recherchez dans votre plugin les imports provenant de l’une ou l’autre surface obsolète :

    ```bash
    grep -r "plugin-sdk/compat" my-plugin/
    grep -r "openclaw/extension-api" my-plugin/
    ```

  </Step>

  <Step title="Remplacer par des imports ciblés">
    Chaque exportation de l’ancienne surface correspond à un chemin d’import moderne précis :

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

    Pour les helpers côté hôte, utilisez le runtime de plugin injecté au lieu d’importer
    directement :

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
    | helpers du magasin de session | `api.runtime.agent.session.*` |

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
  | `plugin-sdk/plugin-entry` | Helper canonique de point d’entrée de plugin | `definePluginEntry` |
  | `plugin-sdk/core` | Réexportation parapluie héritée pour les définitions/constructeurs d’entrées de canal | `defineChannelPluginEntry`, `createChatChannelPlugin` |
  | `plugin-sdk/config-schema` | Exportation du schéma de configuration racine | `OpenClawSchema` |
  | `plugin-sdk/provider-entry` | Helper de point d’entrée à fournisseur unique | `defineSingleProviderPluginEntry` |
  | `plugin-sdk/channel-core` | Définitions et constructeurs ciblés d’entrées de canal | `defineChannelPluginEntry`, `defineSetupPluginEntry`, `createChatChannelPlugin`, `createChannelPluginBase` |
  | `plugin-sdk/setup` | Helpers partagés pour l’assistant de configuration | Prompts d’allowlist, constructeurs d’état de configuration |
  | `plugin-sdk/setup-runtime` | Helpers runtime au moment de la configuration | Adaptateurs de patch de configuration sûrs à l’import, helpers de note de recherche, `promptResolvedAllowFrom`, `splitSetupEntries`, proxys de configuration déléguée |
  | `plugin-sdk/setup-adapter-runtime` | Helpers d’adaptateur de configuration | `createEnvPatchedAccountSetupAdapter` |
  | `plugin-sdk/setup-tools` | Helpers d’outillage de configuration | `formatCliCommand`, `detectBinary`, `extractArchive`, `resolveBrewExecutable`, `formatDocsLink`, `CONFIG_DIR` |
  | `plugin-sdk/account-core` | Helpers multi-comptes | Helpers de liste/configuration/action-gate de compte |
  | `plugin-sdk/account-id` | Helpers d’identifiant de compte | `DEFAULT_ACCOUNT_ID`, normalisation d’identifiant de compte |
  | `plugin-sdk/account-resolution` | Helpers de recherche de compte | Helpers de recherche de compte + repli par défaut |
  | `plugin-sdk/account-helpers` | Helpers de compte ciblés | Helpers de liste de comptes / action de compte |
  | `plugin-sdk/channel-setup` | Adaptateurs d’assistant de configuration | `createOptionalChannelSetupSurface`, `createOptionalChannelSetupAdapter`, `createOptionalChannelSetupWizard`, plus `DEFAULT_ACCOUNT_ID`, `createTopLevelChannelDmPolicy`, `setSetupChannelEnabled`, `splitSetupEntries` |
  | `plugin-sdk/channel-pairing` | Primitives d’appairage DM | `createChannelPairingController` |
  | `plugin-sdk/channel-reply-pipeline` | Préfixe de réponse + câblage de saisie | `createChannelReplyPipeline` |
  | `plugin-sdk/channel-config-helpers` | Fabriques d’adaptateurs de configuration | `createHybridChannelConfigAdapter` |
  | `plugin-sdk/channel-config-schema` | Constructeurs de schéma de configuration | Types de schéma de configuration de canal |
  | `plugin-sdk/telegram-command-config` | Helpers de configuration des commandes Telegram | Normalisation du nom de commande, troncature de description, validation des doublons/conflits |
  | `plugin-sdk/channel-policy` | Résolution de politique de groupe/DM | `resolveChannelGroupRequireMention` |
  | `plugin-sdk/channel-lifecycle` | Suivi d’état de compte | `createAccountStatusSink` |
  | `plugin-sdk/inbound-envelope` | Helpers d’enveloppe entrante | Helpers partagés de route + construction d’enveloppe |
  | `plugin-sdk/inbound-reply-dispatch` | Helpers de réponse entrante | Helpers partagés d’enregistrement et de distribution |
  | `plugin-sdk/messaging-targets` | Analyse des cibles de messagerie | Helpers d’analyse/correspondance de cible |
  | `plugin-sdk/outbound-media` | Helpers de média sortant | Chargement partagé de média sortant |
  | `plugin-sdk/outbound-runtime` | Helpers runtime sortants | Helpers de délégation d’identité/envoi sortants |
  | `plugin-sdk/thread-bindings-runtime` | Helpers de liaison de thread | Helpers de cycle de vie et d’adaptateur de liaison de thread |
  | `plugin-sdk/agent-media-payload` | Helpers hérités de payload média | Constructeur de payload média d’agent pour les anciennes dispositions de champs |
  | `plugin-sdk/channel-runtime` | Shim de compatibilité obsolète | Uniquement des utilitaires runtime de canal hérités |
  | `plugin-sdk/channel-send-result` | Types de résultat d’envoi | Types de résultat de réponse |
  | `plugin-sdk/runtime-store` | Stockage persistant de plugin | `createPluginRuntimeStore` |
  | `plugin-sdk/runtime` | Helpers runtime larges | Helpers de runtime/journalisation/sauvegarde/installation de plugin |
  | `plugin-sdk/runtime-env` | Helpers ciblés d’environnement runtime | Helpers de logger/env runtime, délai d’expiration, retry et backoff |
  | `plugin-sdk/plugin-runtime` | Helpers runtime partagés de plugin | Helpers de commandes/hooks/http/interactif de plugin |
  | `plugin-sdk/hook-runtime` | Helpers de pipeline de hook | Helpers partagés de pipeline de webhook/hook interne |
  | `plugin-sdk/lazy-runtime` | Helpers runtime paresseux | `createLazyRuntimeModule`, `createLazyRuntimeMethod`, `createLazyRuntimeMethodBinder`, `createLazyRuntimeNamedExport`, `createLazyRuntimeSurface` |
  | `plugin-sdk/process-runtime` | Helpers de processus | Helpers partagés d’exécution |
  | `plugin-sdk/cli-runtime` | Helpers runtime CLI | Formatage de commandes, attentes, helpers de version |
  | `plugin-sdk/gateway-runtime` | Helpers de gateway | Client gateway et helpers de patch d’état de canal |
  | `plugin-sdk/config-runtime` | Helpers de configuration | Helpers de chargement/écriture de configuration |
  | `plugin-sdk/telegram-command-config` | Helpers de commande Telegram | Helpers de validation de commandes Telegram stables en repli lorsque la surface de contrat Telegram intégrée n’est pas disponible |
  | `plugin-sdk/approval-runtime` | Helpers de prompt d’approbation | Payload d’approbation exec/plugin, helpers de capacité/profil d’approbation, routage/runtime natif d’approbation |
  | `plugin-sdk/approval-auth-runtime` | Helpers d’authentification d’approbation | Résolution d’approbateur, autorisation d’action dans le même chat |
  | `plugin-sdk/approval-client-runtime` | Helpers client d’approbation | Helpers natifs de profil/filtre d’approbation exec |
  | `plugin-sdk/approval-delivery-runtime` | Helpers de livraison d’approbation | Adaptateurs natifs de capacité/livraison d’approbation |
  | `plugin-sdk/approval-native-runtime` | Helpers de cible d’approbation | Helpers natifs de liaison cible/compte d’approbation |
  | `plugin-sdk/approval-reply-runtime` | Helpers de réponse d’approbation | Helpers de payload de réponse d’approbation exec/plugin |
  | `plugin-sdk/security-runtime` | Helpers de sécurité | Helpers partagés de confiance, de filtrage DM, de contenu externe et de collecte de secrets |
  | `plugin-sdk/ssrf-policy` | Helpers de politique SSRF | Helpers d’allowlist d’hôtes et de politique de réseau privé |
  | `plugin-sdk/ssrf-runtime` | Helpers runtime SSRF | Helpers de dispatcher épinglé, fetch protégé, politique SSRF |
  | `plugin-sdk/collection-runtime` | Helpers de cache borné | `pruneMapToMaxSize` |
  | `plugin-sdk/diagnostic-runtime` | Helpers de filtrage diagnostique | `isDiagnosticFlagEnabled`, `isDiagnosticsEnabled` |
  | `plugin-sdk/error-runtime` | Helpers de formatage d’erreur | `formatUncaughtError`, `isApprovalNotFoundError`, helpers de graphe d’erreur |
  | `plugin-sdk/fetch-runtime` | Helpers fetch/proxy encapsulés | `resolveFetch`, helpers de proxy |
  | `plugin-sdk/host-runtime` | Helpers de normalisation d’hôte | `normalizeHostname`, `normalizeScpRemoteHost` |
  | `plugin-sdk/retry-runtime` | Helpers de retry | `RetryConfig`, `retryAsync`, exécuteurs de politiques |
  | `plugin-sdk/allow-from` | Formatage d’allowlist | `formatAllowFromLowercase` |
  | `plugin-sdk/allowlist-resolution` | Mappage des entrées d’allowlist | `mapAllowlistResolutionInputs` |
  | `plugin-sdk/command-auth` | Helpers de filtrage des commandes et de surface de commande | `resolveControlCommandGate`, helpers d’autorisation d’expéditeur, helpers de registre de commandes |
  | `plugin-sdk/secret-input` | Analyse des entrées secrètes | Helpers d’entrée secrète |
  | `plugin-sdk/webhook-ingress` | Helpers de requête webhook | Utilitaires de cible webhook |
  | `plugin-sdk/webhook-request-guards` | Helpers de garde du corps de requête webhook | Helpers de lecture/limite du corps de requête |
  | `plugin-sdk/reply-runtime` | Runtime partagé de réponse | Distribution entrante, heartbeat, planificateur de réponse, découpage |
  | `plugin-sdk/reply-dispatch-runtime` | Helpers ciblés de distribution de réponse | Helpers de finalisation + distribution fournisseur |
  | `plugin-sdk/reply-history` | Helpers d’historique des réponses | `buildHistoryContext`, `buildPendingHistoryContextFromMap`, `recordPendingHistoryEntry`, `clearHistoryEntriesIfEnabled` |
  | `plugin-sdk/reply-reference` | Planification de référence de réponse | `createReplyReferencePlanner` |
  | `plugin-sdk/reply-chunking` | Helpers de segmentation de réponse | Helpers de segmentation texte/markdown |
  | `plugin-sdk/session-store-runtime` | Helpers de magasin de session | Helpers de chemin de stockage + updated-at |
  | `plugin-sdk/state-paths` | Helpers de chemins d’état | Helpers de répertoire d’état et OAuth |
  | `plugin-sdk/routing` | Helpers de routage/clé de session | `resolveAgentRoute`, `buildAgentSessionKey`, `resolveDefaultAgentBoundAccountId`, helpers de normalisation de clé de session |
  | `plugin-sdk/status-helpers` | Helpers d’état de canal | Constructeurs de résumé d’état de canal/compte, valeurs par défaut d’état runtime, helpers de métadonnées de problème |
  | `plugin-sdk/target-resolver-runtime` | Helpers de résolution de cible | Helpers partagés de résolution de cible |
  | `plugin-sdk/string-normalization-runtime` | Helpers de normalisation de chaîne | Helpers de normalisation de slug/chaîne |
  | `plugin-sdk/request-url` | Helpers d’URL de requête | Extraire des URL chaîne depuis des entrées de type requête |
  | `plugin-sdk/run-command` | Helpers de commande temporisée | Exécuteur de commande temporisée avec stdout/stderr normalisés |
  | `plugin-sdk/param-readers` | Lecteurs de paramètres | Lecteurs de paramètres d’outil/CLI communs |
  | `plugin-sdk/tool-send` | Extraction d’envoi d’outil | Extraire les champs canoniques de cible d’envoi depuis les arguments d’outil |
  | `plugin-sdk/temp-path` | Helpers de chemin temporaire | Helpers partagés de chemin temporaire de téléchargement |
  | `plugin-sdk/logging-core` | Helpers de journalisation | Logger de sous-système et helpers de rédaction |
  | `plugin-sdk/markdown-table-runtime` | Helpers de tableau Markdown | Helpers de mode de tableau Markdown |
  | `plugin-sdk/reply-payload` | Types de réponse de message | Types de payload de réponse |
  | `plugin-sdk/provider-setup` | Helpers sélectionnés de configuration de fournisseur local/autohébergé | Helpers de découverte/configuration de fournisseur autohébergé |
  | `plugin-sdk/self-hosted-provider-setup` | Helpers ciblés de configuration de fournisseur autohébergé compatible OpenAI | Les mêmes helpers de découverte/configuration de fournisseur autohébergé |
  | `plugin-sdk/provider-auth-runtime` | Helpers d’authentification runtime fournisseur | Helpers de résolution de clé API runtime |
  | `plugin-sdk/provider-auth-api-key` | Helpers de configuration de clé API fournisseur | Helpers d’onboarding/écriture de profil de clé API |
  | `plugin-sdk/provider-auth-result` | Helpers de résultat d’authentification fournisseur | Constructeur standard de résultat d’authentification OAuth |
  | `plugin-sdk/provider-auth-login` | Helpers de connexion interactive fournisseur | Helpers partagés de connexion interactive |
  | `plugin-sdk/provider-env-vars` | Helpers de variables d’environnement fournisseur | Helpers de recherche de variable d’environnement d’authentification fournisseur |
  | `plugin-sdk/provider-model-shared` | Helpers partagés de modèle/relecture fournisseur | `ProviderReplayFamily`, `buildProviderReplayFamilyHooks`, `normalizeModelCompat`, constructeurs partagés de politique de relecture, helpers d’endpoint fournisseur et helpers de normalisation d’identifiant de modèle |
  | `plugin-sdk/provider-catalog-shared` | Helpers partagés de catalogue fournisseur | `findCatalogTemplate`, `buildSingleProviderApiKeyCatalog`, `supportsNativeStreamingUsageCompat`, `applyProviderNativeStreamingUsageCompat` |
  | `plugin-sdk/provider-onboard` | Correctifs d’onboarding fournisseur | Helpers de configuration d’onboarding |
  | `plugin-sdk/provider-http` | Helpers HTTP fournisseur | Helpers génériques de capacité HTTP/endpoint fournisseur |
  | `plugin-sdk/provider-web-fetch` | Helpers web-fetch fournisseur | Helpers d’enregistrement/cache de fournisseur web-fetch |
  | `plugin-sdk/provider-web-search` | Helpers web-search fournisseur | Helpers d’enregistrement/cache/configuration de fournisseur web-search |
  | `plugin-sdk/provider-tools` | Helpers de compatibilité outil/schéma fournisseur | `ProviderToolCompatFamily`, `buildProviderToolCompatFamilyHooks`, nettoyage de schéma Gemini + diagnostics, et helpers de compatibilité xAI comme `resolveXaiModelCompatPatch` / `applyXaiModelCompat` |
  | `plugin-sdk/provider-usage` | Helpers d’usage fournisseur | `fetchClaudeUsage`, `fetchGeminiUsage`, `fetchGithubCopilotUsage`, et autres helpers d’usage fournisseur |
  | `plugin-sdk/provider-stream` | Helpers d’encapsulation de flux fournisseur | `ProviderStreamFamily`, `buildProviderStreamFamilyHooks`, `composeProviderStreamWrappers`, types d’encapsulation de flux, et helpers partagés d’encapsulation Anthropic/Bedrock/Google/Kilocode/Moonshot/OpenAI/OpenRouter/Z.A.I/MiniMax/Copilot |
  | `plugin-sdk/keyed-async-queue` | File asynchrone ordonnée | `KeyedAsyncQueue` |
  | `plugin-sdk/media-runtime` | Helpers média partagés | Helpers de récupération/transformation/stockage média plus constructeurs de payload média |
  | `plugin-sdk/media-generation-runtime` | Helpers partagés de génération de média | Helpers partagés de bascule, sélection de candidat et messages de modèle manquant pour la génération d’image/vidéo/musique |
  | `plugin-sdk/media-understanding` | Helpers de compréhension de média | Types de fournisseur de compréhension de média plus exportations de helpers image/audio côté fournisseur |
  | `plugin-sdk/text-runtime` | Helpers texte partagés | Suppression du texte visible par l’assistant, helpers de rendu/découpage/tableau markdown, helpers de rédaction, helpers de balise de directive, utilitaires de texte sûr, et helpers liés au texte/journalisation |
  | `plugin-sdk/text-chunking` | Helpers de segmentation de texte | Helper de segmentation de texte sortant |
  | `plugin-sdk/speech` | Helpers vocaux | Types de fournisseur vocal plus helpers côté fournisseur pour directives, registre et validation |
  | `plugin-sdk/speech-core` | Cœur vocal partagé | Types de fournisseur vocal, registre, directives, normalisation |
  | `plugin-sdk/realtime-transcription` | Helpers de transcription en temps réel | Types de fournisseur et helpers de registre |
  | `plugin-sdk/realtime-voice` | Helpers vocaux en temps réel | Types de fournisseur et helpers de registre |
  | `plugin-sdk/image-generation-core` | Cœur partagé de génération d’image | Helpers de types, bascule, authentification et registre de génération d’image |
  | `plugin-sdk/music-generation` | Helpers de génération musicale | Types de fournisseur/requête/résultat de génération musicale |
  | `plugin-sdk/music-generation-core` | Cœur partagé de génération musicale | Helpers de types, bascule, recherche de fournisseur et analyse model-ref de génération musicale |
  | `plugin-sdk/video-generation` | Helpers de génération vidéo | Types de fournisseur/requête/résultat de génération vidéo |
  | `plugin-sdk/video-generation-core` | Cœur partagé de génération vidéo | Helpers de types, bascule, recherche de fournisseur et analyse model-ref de génération vidéo |
  | `plugin-sdk/interactive-runtime` | Helpers de réponse interactive | Normalisation/réduction de payload de réponse interactive |
  | `plugin-sdk/channel-config-primitives` | Primitives de configuration de canal | Primitives ciblées de schéma de configuration de canal |
  | `plugin-sdk/channel-config-writes` | Helpers d’écriture de configuration de canal | Helpers d’autorisation d’écriture de configuration de canal |
  | `plugin-sdk/channel-plugin-common` | Prélude de canal partagé | Exportations de prélude de plugin de canal partagé |
  | `plugin-sdk/channel-status` | Helpers d’état de canal | Helpers partagés d’instantané/résumé d’état de canal |
  | `plugin-sdk/allowlist-config-edit` | Helpers de configuration d’allowlist | Helpers de lecture/édition de configuration d’allowlist |
  | `plugin-sdk/group-access` | Helpers d’accès de groupe | Helpers partagés de décision d’accès de groupe |
  | `plugin-sdk/direct-dm` | Helpers de DM direct | Helpers partagés d’authentification/garde de DM direct |
  | `plugin-sdk/extension-shared` | Helpers partagés d’extension | Primitives de helper de canal passif/état |
  | `plugin-sdk/webhook-targets` | Helpers de cible webhook | Registre de cibles webhook et helpers d’installation de route |
  | `plugin-sdk/webhook-path` | Helpers de chemin webhook | Helpers de normalisation de chemin webhook |
  | `plugin-sdk/web-media` | Helpers web média partagés | Helpers de chargement de média distant/local |
  | `plugin-sdk/zod` | Réexportation Zod | `zod` réexporté pour les consommateurs du SDK plugin |
  | `plugin-sdk/memory-core` | Helpers intégrés memory-core | Surface de helpers de gestionnaire mémoire/configuration/fichier/CLI |
  | `plugin-sdk/memory-core-engine-runtime` | Façade runtime du moteur mémoire | Façade runtime d’indexation/recherche mémoire |
  | `plugin-sdk/memory-core-host-engine-foundation` | Moteur foundation hôte mémoire | Exportations du moteur foundation hôte mémoire |
  | `plugin-sdk/memory-core-host-engine-embeddings` | Moteur d’embeddings hôte mémoire | Exportations du moteur d’embeddings hôte mémoire |
  | `plugin-sdk/memory-core-host-engine-qmd` | Moteur QMD hôte mémoire | Exportations du moteur QMD hôte mémoire |
  | `plugin-sdk/memory-core-host-engine-storage` | Moteur de stockage hôte mémoire | Exportations du moteur de stockage hôte mémoire |
  | `plugin-sdk/memory-core-host-multimodal` | Helpers multimodaux hôte mémoire | Helpers multimodaux hôte mémoire |
  | `plugin-sdk/memory-core-host-query` | Helpers de requête hôte mémoire | Helpers de requête hôte mémoire |
  | `plugin-sdk/memory-core-host-secret` | Helpers de secrets hôte mémoire | Helpers de secrets hôte mémoire |
  | `plugin-sdk/memory-core-host-events` | Helpers de journal d’événements hôte mémoire | Helpers de journal d’événements hôte mémoire |
  | `plugin-sdk/memory-core-host-status` | Helpers d’état hôte mémoire | Helpers d’état hôte mémoire |
  | `plugin-sdk/memory-core-host-runtime-cli` | Runtime CLI hôte mémoire | Helpers runtime CLI hôte mémoire |
  | `plugin-sdk/memory-core-host-runtime-core` | Runtime cœur hôte mémoire | Helpers runtime cœur hôte mémoire |
  | `plugin-sdk/memory-core-host-runtime-files` | Helpers de fichier/runtime hôte mémoire | Helpers de fichier/runtime hôte mémoire |
  | `plugin-sdk/memory-host-core` | Alias runtime cœur hôte mémoire | Alias neutre vis-à-vis du fournisseur pour les helpers runtime cœur hôte mémoire |
  | `plugin-sdk/memory-host-events` | Alias journal d’événements hôte mémoire | Alias neutre vis-à-vis du fournisseur pour les helpers de journal d’événements hôte mémoire |
  | `plugin-sdk/memory-host-files` | Alias fichier/runtime hôte mémoire | Alias neutre vis-à-vis du fournisseur pour les helpers fichier/runtime hôte mémoire |
  | `plugin-sdk/memory-host-markdown` | Helpers de markdown géré | Helpers partagés de markdown géré pour les plugins adjacents à la mémoire |
  | `plugin-sdk/memory-host-search` | Façade de recherche mémoire active | Façade runtime paresseuse du gestionnaire de recherche de mémoire active |
  | `plugin-sdk/memory-host-status` | Alias d’état hôte mémoire | Alias neutre vis-à-vis du fournisseur pour les helpers d’état hôte mémoire |
  | `plugin-sdk/memory-lancedb` | Helpers intégrés memory-lancedb | Surface de helpers memory-lancedb |
  | `plugin-sdk/testing` | Utilitaires de test | Helpers et mocks de test |
</Accordion>

Ce tableau est volontairement le sous-ensemble courant pour la migration, et
non la surface complète du SDK. La liste complète des plus de 200 points
d’entrée se trouve dans
`scripts/lib/plugin-sdk-entrypoints.json`.

Cette liste inclut encore certaines coutures de helpers de plugins intégrés comme
`plugin-sdk/feishu`, `plugin-sdk/feishu-setup`, `plugin-sdk/zalo`,
`plugin-sdk/zalo-setup`, et `plugin-sdk/matrix*`. Elles restent exportées pour
la maintenance et la compatibilité des plugins intégrés, mais elles sont
volontairement omises du tableau de migration courant et ne constituent pas la
cible recommandée pour le nouveau code de plugin.

La même règle s’applique aux autres familles de helpers intégrés comme :

- helpers de prise en charge du navigateur : `plugin-sdk/browser-cdp`, `plugin-sdk/browser-config-runtime`, `plugin-sdk/browser-config-support`, `plugin-sdk/browser-control-auth`, `plugin-sdk/browser-node-runtime`, `plugin-sdk/browser-profiles`, `plugin-sdk/browser-security-runtime`, `plugin-sdk/browser-setup-tools`, `plugin-sdk/browser-support`
- Matrix : `plugin-sdk/matrix*`
- LINE : `plugin-sdk/line*`
- IRC : `plugin-sdk/irc*`
- surfaces intégrées de helper/plugin comme `plugin-sdk/googlechat`,
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

Utilisez l’import le plus ciblé qui correspond au besoin. Si vous ne trouvez
pas une exportation, consultez la source dans `src/plugin-sdk/` ou demandez sur Discord.

## Calendrier de suppression

| Quand | Ce qui se passe |
| ---------------------- | ----------------------------------------------------------------------- |
| **Maintenant** | Les surfaces obsolètes émettent des avertissements à l’exécution |
| **Prochaine version majeure** | Les surfaces obsolètes seront supprimées ; les plugins qui les utilisent encore échoueront |

Tous les plugins du cœur ont déjà été migrés. Les plugins externes doivent
migrer avant la prochaine version majeure.

## Masquer temporairement les avertissements

Définissez ces variables d’environnement pendant que vous travaillez sur la migration :

```bash
OPENCLAW_SUPPRESS_PLUGIN_SDK_COMPAT_WARNING=1 openclaw gateway run
OPENCLAW_SUPPRESS_EXTENSION_API_WARNING=1 openclaw gateway run
```

Il s’agit d’une échappatoire temporaire, pas d’une solution permanente.

## Voir aussi

- [Prise en main](/fr/plugins/building-plugins) — créez votre premier plugin
- [Vue d’ensemble du SDK](/fr/plugins/sdk-overview) — référence complète des imports par sous-chemin
- [Plugins de canal](/fr/plugins/sdk-channel-plugins) — créer des plugins de canal
- [Plugins de fournisseur](/fr/plugins/sdk-provider-plugins) — créer des plugins de fournisseur
- [Internes des plugins](/fr/plugins/architecture) — analyse approfondie de l’architecture
- [Manifeste de plugin](/fr/plugins/manifest) — référence du schéma de manifeste
