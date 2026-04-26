---
read_when:
    - Vous voyez l’avertissement OPENCLAW_PLUGIN_SDK_COMPAT_DEPRECATED
    - Vous voyez l’avertissement OPENCLAW_EXTENSION_API_DEPRECATED
    - Vous avez utilisé `api.registerEmbeddedExtensionFactory` avant OpenClaw 2026.4.25
    - Vous mettez à jour un Plugin vers l’architecture moderne des Plugin
    - Vous maintenez un Plugin OpenClaw externe
sidebarTitle: Migrate to SDK
summary: Migrer de la couche héritée de rétrocompatibilité vers le SDK Plugin moderne
title: Migration du SDK Plugin
x-i18n:
    generated_at: "2026-04-26T11:35:32Z"
    model: gpt-5.4
    provider: openai
    source_hash: ecff17f6be8bcbc310eac24bf53348ec0f7dfc06cc94de5e3a38967031737ccb
    source_path: plugins/sdk-migration.md
    workflow: 15
---

OpenClaw est passé d’une large couche de rétrocompatibilité à une architecture moderne de Plugin
avec des imports ciblés et documentés. Si votre Plugin a été construit avant
la nouvelle architecture, ce guide vous aide à migrer.

## Ce qui change

L’ancien système de Plugin fournissait deux surfaces très ouvertes qui permettaient aux Plugin d’importer
tout ce dont ils avaient besoin depuis un point d’entrée unique :

- **`openclaw/plugin-sdk/compat`** — un import unique qui réexportait des dizaines de
  helpers. Il a été introduit pour maintenir le fonctionnement des anciens Plugin à hooks pendant que la
  nouvelle architecture de Plugin était en cours de construction.
- **`openclaw/extension-api`** — un pont qui donnait aux Plugin un accès direct à
  des helpers côté hôte comme le runner d’agent embarqué.
- **`api.registerEmbeddedExtensionFactory(...)`** — un hook d’extension intégré réservé à Pi et supprimé
  qui pouvait observer des événements du runner embarqué tels que
  `tool_result`.

Ces surfaces d’import larges sont maintenant **obsolètes**. Elles fonctionnent toujours au runtime,
mais les nouveaux Plugin ne doivent pas les utiliser, et les Plugin existants doivent migrer avant la prochaine release majeure qui les supprimera. L’API d’enregistrement de fabrique d’extension embarquée réservée à Pi a été supprimée ; utilisez à la place le middleware de résultat d’outil.

OpenClaw ne supprime ni ne réinterprète un comportement de Plugin documenté dans le même
changement qui introduit un remplaçant. Les changements de contrat cassants doivent d’abord
passer par un adaptateur de compatibilité, des diagnostics, de la documentation et une fenêtre de dépréciation.
Cela s’applique aux imports SDK, aux champs de manifeste, aux API de configuration, aux hooks et au comportement d’enregistrement runtime.

<Warning>
  La couche de rétrocompatibilité sera supprimée dans une future release majeure.
  Les Plugin qui importent encore depuis ces surfaces casseront lorsque cela arrivera.
  Les enregistrements de fabrique d’extension embarquée réservés à Pi ne se chargent déjà plus.
</Warning>

## Pourquoi cela a changé

L’ancienne approche posait des problèmes :

- **Démarrage lent** — importer un helper chargeait des dizaines de modules non liés
- **Dépendances circulaires** — les réexportations larges facilitaient la création de cycles d’import
- **Surface d’API peu claire** — aucun moyen de savoir quelles exportations étaient stables ou internes

Le SDK Plugin moderne corrige cela : chaque chemin d’import (`openclaw/plugin-sdk/\<subpath\>`)
est un petit module autonome avec un objectif clair et un contrat documenté.

Les interfaces de commodité héritées des fournisseurs pour les canaux intégrés ont également disparu. Les imports
comme `openclaw/plugin-sdk/slack`, `openclaw/plugin-sdk/discord`,
`openclaw/plugin-sdk/signal`, `openclaw/plugin-sdk/whatsapp`,
les interfaces helper marquées au nom du canal, et
`openclaw/plugin-sdk/telegram-core` étaient des raccourcis privés du mono-dépôt, et non
des contrats de Plugin stables. Utilisez plutôt des sous-chemins SDK génériques étroits. À l’intérieur de
l’espace de travail du Plugin intégré, gardez les helpers gérés par le fournisseur dans le propre
`api.ts` ou `runtime-api.ts` de ce Plugin.

Exemples actuels de fournisseurs intégrés :

- Anthropic conserve les helpers de flux spécifiques à Claude dans sa propre interface `api.ts` /
  `contract-api.ts`
- OpenAI conserve les builders de fournisseur, les helpers de modèle par défaut, et les builders de fournisseur realtime
  dans son propre `api.ts`
- OpenRouter conserve le builder de fournisseur et les helpers d’intégration/configuration dans son propre
  `api.ts`

## Politique de compatibilité

Pour les Plugin externes, le travail de compatibilité suit cet ordre :

1. ajouter le nouveau contrat
2. conserver l’ancien comportement branché via un adaptateur de compatibilité
3. émettre un diagnostic ou avertissement qui nomme l’ancien chemin et son remplaçant
4. couvrir les deux chemins dans les tests
5. documenter la dépréciation et le chemin de migration
6. supprimer seulement après la fenêtre de migration annoncée, généralement dans une release majeure

Si un champ de manifeste est toujours accepté, les auteurs de Plugin peuvent continuer à l’utiliser jusqu’à
ce que la documentation et les diagnostics indiquent le contraire. Le nouveau code doit préférer le remplaçant documenté, mais les Plugin existants ne doivent pas casser pendant des releases mineures ordinaires.

## Comment migrer

<Steps>
  <Step title="Migrer les extensions de résultat d’outil Pi vers le middleware">
    Les Plugin intégrés doivent remplacer les handlers de résultat d’outil réservés à Pi
    `api.registerEmbeddedExtensionFactory(...)` par un middleware
    neutre vis-à-vis du runtime.

    ```typescript
    // Outils dynamiques Pi et runtime Codex
    api.registerAgentToolResultMiddleware(async (event) => {
      return compactToolResult(event);
    }, {
      runtimes: ["pi", "codex"],
    });
    ```

    Mettez aussi à jour le manifeste du Plugin :

    ```json
    {
      "contracts": {
        "agentToolResultMiddleware": ["pi", "codex"]
      }
    }
    ```

    Les Plugin externes ne peuvent pas enregistrer de middleware de résultat d’outil car il peut
    réécrire une sortie d’outil de haute confiance avant que le modèle ne la voie.

  </Step>

  <Step title="Migrer les handlers natifs d’approbation vers les faits de capacité">
    Les Plugin de canal capables d’approbation exposent désormais le comportement d’approbation natif via
    `approvalCapability.nativeRuntime` ainsi que le registre partagé de contexte runtime.

    Changements clés :

    - Remplacer `approvalCapability.handler.loadRuntime(...)` par
      `approvalCapability.nativeRuntime`
    - Déplacer l’authentification/la distribution spécifiques aux approbations hors de l’ancien câblage `plugin.auth` /
      `plugin.approvals` vers `approvalCapability`
    - `ChannelPlugin.approvals` a été supprimé du contrat public du Plugin de canal ; déplacez les champs delivery/native/render vers `approvalCapability`
    - `plugin.auth` reste pour les flux login/logout du canal uniquement ; les hooks d’authentification d’approbation qui s’y trouvent ne sont plus lus par le cœur
    - Enregistrer les objets runtime gérés par le canal comme les clients, jetons ou applications Bolt via `openclaw/plugin-sdk/channel-runtime-context`
    - N’envoyez pas d’avis de reroutage gérés par le Plugin depuis les handlers d’approbation natifs ; le cœur gère maintenant les avis « envoyé ailleurs » à partir des résultats réels de distribution
    - Lors du passage de `channelRuntime` à `createChannelManager(...)`, fournissez une vraie surface `createPluginRuntime().channel`. Les stubs partiels sont rejetés.

    Voir `/plugins/sdk-channel-plugins` pour la disposition actuelle des capacités d’approbation.

  </Step>

  <Step title="Auditer le comportement de repli du wrapper Windows">
    Si votre Plugin utilise `openclaw/plugin-sdk/windows-spawn`, les wrappers Windows
    `.cmd`/`.bat` non résolus échouent désormais de manière fermée sauf si vous passez explicitement
    `allowShellFallback: true`.

    ```typescript
    // Avant
    const program = applyWindowsSpawnProgramPolicy({ candidate });

    // Après
    const program = applyWindowsSpawnProgramPolicy({
      candidate,
      // Ne définissez ceci que pour les appelants de compatibilité de confiance qui
      // acceptent intentionnellement le repli médié par shell.
      allowShellFallback: true,
    });
    ```

    Si votre appelant ne dépend pas intentionnellement du repli shell, ne définissez pas
    `allowShellFallback` et gérez plutôt l’erreur levée.

  </Step>

  <Step title="Trouver les imports obsolètes">
    Recherchez dans votre Plugin les imports depuis l’une ou l’autre des surfaces obsolètes :

    ```bash
    grep -r "plugin-sdk/compat" my-plugin/
    grep -r "openclaw/extension-api" my-plugin/
    ```

  </Step>

  <Step title="Remplacer par des imports ciblés">
    Chaque export de l’ancienne surface correspond à un chemin d’import moderne spécifique :

    ```typescript
    // Avant (couche de rétrocompatibilité obsolète)
    import {
      createChannelReplyPipeline,
      createPluginRuntimeStore,
      resolveControlCommandGate,
    } from "openclaw/plugin-sdk/compat";

    // Après (imports ciblés modernes)
    import { createChannelReplyPipeline } from "openclaw/plugin-sdk/channel-reply-pipeline";
    import { createPluginRuntimeStore } from "openclaw/plugin-sdk/runtime-store";
    import { resolveControlCommandGate } from "openclaw/plugin-sdk/command-auth";
    ```

    Pour les helpers côté hôte, utilisez le runtime Plugin injecté au lieu d’importer
    directement :

    ```typescript
    // Avant (pont extension-api obsolète)
    import { runEmbeddedPiAgent } from "openclaw/extension-api";
    const result = await runEmbeddedPiAgent({ sessionId, prompt });

    // Après (runtime injecté)
    const result = await api.runtime.agent.runEmbeddedPiAgent({ sessionId, prompt });
    ```

    Le même modèle s’applique aux autres helpers hérités du pont :

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

  <Step title="Construire et tester">
    ```bash
    pnpm build
    pnpm test -- my-plugin/
    ```
  </Step>
</Steps>

## Référence des chemins d’import

  <Accordion title="Table courante des chemins d’import">
  | Chemin d’import | Rôle | Exports clés |
  | --- | --- | --- |
  | `plugin-sdk/plugin-entry` | Helper canonique d’entrée de Plugin | `definePluginEntry` |
  | `plugin-sdk/core` | Réexportation englobante héritée pour les définitions/builders d’entrée de canal | `defineChannelPluginEntry`, `createChatChannelPlugin` |
  | `plugin-sdk/config-schema` | Export du schéma de configuration racine | `OpenClawSchema` |
  | `plugin-sdk/provider-entry` | Helper d’entrée à fournisseur unique | `defineSingleProviderPluginEntry` |
  | `plugin-sdk/channel-core` | Définitions et builders ciblés d’entrée de canal | `defineChannelPluginEntry`, `defineSetupPluginEntry`, `createChatChannelPlugin`, `createChannelPluginBase` |
  | `plugin-sdk/setup` | Helpers partagés d’assistant de configuration | Prompts de liste d’autorisations, builders d’état de configuration |
  | `plugin-sdk/setup-runtime` | Helpers runtime au moment de la configuration | Adaptateurs import-safe de patch de configuration, helpers de note de recherche, `promptResolvedAllowFrom`, `splitSetupEntries`, proxys de configuration déléguée |
  | `plugin-sdk/setup-adapter-runtime` | Helpers d’adaptateur de configuration | `createEnvPatchedAccountSetupAdapter` |
  | `plugin-sdk/setup-tools` | Helpers d’outillage de configuration | `formatCliCommand`, `detectBinary`, `extractArchive`, `resolveBrewExecutable`, `formatDocsLink`, `CONFIG_DIR` |
  | `plugin-sdk/account-core` | Helpers multi-comptes | Helpers de liste de comptes/configuration/barrière d’action |
  | `plugin-sdk/account-id` | Helpers d’identifiant de compte | `DEFAULT_ACCOUNT_ID`, normalisation d’identifiant de compte |
  | `plugin-sdk/account-resolution` | Helpers de recherche de compte | Helpers de recherche de compte + repli par défaut |
  | `plugin-sdk/account-helpers` | Helpers de compte étroits | Helpers de liste de comptes/action de compte |
  | `plugin-sdk/channel-setup` | Adaptateurs d’assistant de configuration | `createOptionalChannelSetupSurface`, `createOptionalChannelSetupAdapter`, `createOptionalChannelSetupWizard`, plus `DEFAULT_ACCOUNT_ID`, `createTopLevelChannelDmPolicy`, `setSetupChannelEnabled`, `splitSetupEntries` |
  | `plugin-sdk/channel-pairing` | Primitifs d’appairage de messages privés | `createChannelPairingController` |
  | `plugin-sdk/channel-reply-pipeline` | Câblage du préfixe de réponse + indicateur de saisie | `createChannelReplyPipeline` |
  | `plugin-sdk/channel-config-helpers` | Fabriques d’adaptateurs de configuration | `createHybridChannelConfigAdapter` |
  | `plugin-sdk/channel-config-schema` | Builders de schéma de configuration | Primitifs partagés de schéma de configuration de canal ; les exports de schéma nommés de canaux intégrés sont hérités et de compatibilité uniquement |
  | `plugin-sdk/telegram-command-config` | Helpers de configuration de commande Telegram | Normalisation des noms de commande, trimming des descriptions, validation des doublons/conflits |
  | `plugin-sdk/channel-policy` | Résolution de politique de groupe/messages privés | `resolveChannelGroupRequireMention` |
  | `plugin-sdk/channel-lifecycle` | Helpers de cycle de vie de statut de compte et de flux de brouillon | `createAccountStatusSink`, helpers de finalisation d’aperçu de brouillon |
  | `plugin-sdk/inbound-envelope` | Helpers d’enveloppe entrante | Helpers partagés de routage + construction d’enveloppe |
  | `plugin-sdk/inbound-reply-dispatch` | Helpers de réponse entrante | Helpers partagés d’enregistrement et de dispatch |
  | `plugin-sdk/messaging-targets` | Parsing des cibles de messagerie | Helpers de parsing/correspondance des cibles |
  | `plugin-sdk/outbound-media` | Helpers média sortants | Chargement partagé des médias sortants |
  | `plugin-sdk/outbound-send-deps` | Helpers de dépendances d’envoi sortant | Recherche légère `resolveOutboundSendDep` sans importer le runtime sortant complet |
  | `plugin-sdk/outbound-runtime` | Helpers runtime sortants | Helpers de distribution sortante, délégation identité/envoi, session, formatage et planification de charge utile |
  | `plugin-sdk/thread-bindings-runtime` | Helpers de liaison de fil | Helpers de cycle de vie et d’adaptateur de liaison de fil |
  | `plugin-sdk/agent-media-payload` | Helpers hérités de charge utile média | Builder de charge utile média d’agent pour dispositions de champs héritées |
  | `plugin-sdk/channel-runtime` | Shim de compatibilité obsolète | Utilitaires runtime de canal hérités uniquement |
  | `plugin-sdk/channel-send-result` | Types de résultat d’envoi | Types de résultat de réponse |
  | `plugin-sdk/runtime-store` | Stockage persistant du Plugin | `createPluginRuntimeStore` |
  | `plugin-sdk/runtime` | Helpers runtime larges | Helpers runtime/journalisation/sauvegarde/installation de Plugin |
  | `plugin-sdk/runtime-env` | Helpers étroits d’environnement runtime | Helpers logger/env runtime, délai maximal, retry et backoff |
  | `plugin-sdk/plugin-runtime` | Helpers runtime partagés du Plugin | Helpers Plugin commands/hooks/http/interactive |
  | `plugin-sdk/hook-runtime` | Helpers de pipeline de hook | Helpers partagés de pipeline de Webhook/hook interne |
  | `plugin-sdk/lazy-runtime` | Helpers runtime paresseux | `createLazyRuntimeModule`, `createLazyRuntimeMethod`, `createLazyRuntimeMethodBinder`, `createLazyRuntimeNamedExport`, `createLazyRuntimeSurface` |
  | `plugin-sdk/process-runtime` | Helpers de processus | Helpers exec partagés |
  | `plugin-sdk/cli-runtime` | Helpers runtime CLI | Helpers de formatage de commande, attentes, version |
  | `plugin-sdk/gateway-runtime` | Helpers Gateway | Helpers client Gateway et patch de statut de canal |
  | `plugin-sdk/config-runtime` | Helpers de configuration | Helpers de chargement/écriture de configuration |
  | `plugin-sdk/telegram-command-config` | Helpers de commande Telegram | Helpers de validation de commande Telegram stables en repli lorsque la surface de contrat Telegram intégrée n’est pas disponible |
  | `plugin-sdk/approval-runtime` | Helpers d’invite d’approbation | Helpers de charge utile d’approbation exec/Plugin, helpers de profil/capacité d’approbation, helpers runtime/routage d’approbation native, et formatage de chemin d’affichage d’approbation structuré |
  | `plugin-sdk/approval-auth-runtime` | Helpers d’authentification d’approbation | Résolution d’approbateur, auth d’action même chat |
  | `plugin-sdk/approval-client-runtime` | Helpers de client d’approbation | Helpers natifs de profil/filtre d’approbation exec |
  | `plugin-sdk/approval-delivery-runtime` | Helpers de distribution d’approbation | Adaptateurs de capacité/distribution d’approbation native |
  | `plugin-sdk/approval-gateway-runtime` | Helpers Gateway d’approbation | Helper partagé de résolution Gateway d’approbation |
  | `plugin-sdk/approval-handler-adapter-runtime` | Helpers d’adaptateur d’approbation | Helpers légers de chargement d’adaptateur d’approbation native pour les points d’entrée chauds de canal |
  | `plugin-sdk/approval-handler-runtime` | Helpers de handler d’approbation | Helpers runtime plus larges de handler d’approbation ; préférez les interfaces plus étroites adapter/gateway lorsqu’elles suffisent |
  | `plugin-sdk/approval-native-runtime` | Helpers de cible d’approbation | Helpers natifs de liaison cible/compte d’approbation |
  | `plugin-sdk/approval-reply-runtime` | Helpers de réponse d’approbation | Helpers de charge utile de réponse d’approbation exec/Plugin |
  | `plugin-sdk/channel-runtime-context` | Helpers de contexte runtime de canal | Helpers génériques register/get/watch de contexte runtime de canal |
  | `plugin-sdk/security-runtime` | Helpers de sécurité | Helpers partagés de confiance, barrière de message privé, contenu externe et collecte de secrets |
  | `plugin-sdk/ssrf-policy` | Helpers de politique SSRF | Helpers de liste d’autorisations d’hôte et de politique de réseau privé |
  | `plugin-sdk/ssrf-runtime` | Helpers runtime SSRF | Helpers pinned-dispatcher, fetch protégé, politique SSRF |
  | `plugin-sdk/collection-runtime` | Helpers de cache borné | `pruneMapToMaxSize` |
  | `plugin-sdk/diagnostic-runtime` | Helpers de barrière de diagnostic | `isDiagnosticFlagEnabled`, `isDiagnosticsEnabled` |
  | `plugin-sdk/error-runtime` | Helpers de formatage d’erreur | `formatUncaughtError`, `isApprovalNotFoundError`, helpers de graphe d’erreurs |
  | `plugin-sdk/fetch-runtime` | Helpers fetch/proxy encapsulés | `resolveFetch`, helpers de proxy |
  | `plugin-sdk/host-runtime` | Helpers de normalisation d’hôte | `normalizeHostname`, `normalizeScpRemoteHost` |
  | `plugin-sdk/retry-runtime` | Helpers de nouvelle tentative | `RetryConfig`, `retryAsync`, exécuteurs de politique |
  | `plugin-sdk/allow-from` | Formatage de liste d’autorisations | `formatAllowFromLowercase` |
  | `plugin-sdk/allowlist-resolution` | Mapping des entrées de liste d’autorisations | `mapAllowlistResolutionInputs` |
  | `plugin-sdk/command-auth` | Barrière de commande et helpers de surface de commande | `resolveControlCommandGate`, helpers d’autorisation d’expéditeur, helpers de registre de commande incluant le formatage dynamique de menu d’arguments |
  | `plugin-sdk/command-status` | Renderers de statut/aide de commande | `buildCommandsMessage`, `buildCommandsMessagePaginated`, `buildHelpMessage` |
  | `plugin-sdk/secret-input` | Parsing de SecretInput | Helpers d’entrée secrète |
  | `plugin-sdk/webhook-ingress` | Helpers de requête Webhook | Utilitaires de cible Webhook |
  | `plugin-sdk/webhook-request-guards` | Helpers de garde de requête Webhook | Helpers de lecture/limite du corps de requête |
  | `plugin-sdk/reply-runtime` | Runtime partagé de réponse | Dispatch entrant, Heartbeat, planificateur de réponse, découpage |
  | `plugin-sdk/reply-dispatch-runtime` | Helpers étroits de dispatch de réponse | Helpers de finalisation, dispatch fournisseur et libellé de conversation |
  | `plugin-sdk/reply-history` | Helpers d’historique de réponse | `buildHistoryContext`, `buildPendingHistoryContextFromMap`, `recordPendingHistoryEntry`, `clearHistoryEntriesIfEnabled` |
  | `plugin-sdk/reply-reference` | Planification de référence de réponse | `createReplyReferencePlanner` |
  | `plugin-sdk/reply-chunking` | Helpers de découpage de réponse | Helpers de découpage texte/markdown |
  | `plugin-sdk/session-store-runtime` | Helpers de magasin de session | Helpers de chemin de magasin + updated-at |
  | `plugin-sdk/state-paths` | Helpers de chemin d’état | Helpers de répertoire d’état et OAuth |
  | `plugin-sdk/routing` | Helpers de routage/clé de session | `resolveAgentRoute`, `buildAgentSessionKey`, `resolveDefaultAgentBoundAccountId`, helpers de normalisation de clé de session |
  | `plugin-sdk/status-helpers` | Helpers de statut de canal | Builders de résumé de statut de canal/compte, valeurs par défaut d’état runtime, helpers de métadonnées d’incident |
  | `plugin-sdk/target-resolver-runtime` | Helpers de résolution de cible | Helpers partagés de résolution de cible |
  | `plugin-sdk/string-normalization-runtime` | Helpers de normalisation de chaîne | Helpers de normalisation slug/chaîne |
  | `plugin-sdk/request-url` | Helpers d’URL de requête | Extraire des URL chaîne à partir d’entrées de type requête |
  | `plugin-sdk/run-command` | Helpers de commande temporisée | Exécuteur de commande temporisée avec stdout/stderr normalisés |
  | `plugin-sdk/param-readers` | Lecteurs de paramètres | Lecteurs communs de paramètres d’outil/CLI |
  | `plugin-sdk/tool-payload` | Extraction de charge utile d’outil | Extraire des charges utiles normalisées depuis des objets de résultat d’outil |
  | `plugin-sdk/tool-send` | Extraction d’envoi d’outil | Extraire les champs de cible d’envoi canoniques depuis les arguments d’outil |
  | `plugin-sdk/temp-path` | Helpers de chemin temporaire | Helpers partagés de chemin de téléchargement temporaire |
  | `plugin-sdk/logging-core` | Helpers de journalisation | Helpers de logger de sous-système et d’expurgation |
  | `plugin-sdk/markdown-table-runtime` | Helpers de tableau Markdown | Helpers de mode tableau Markdown |
  | `plugin-sdk/reply-payload` | Types de réponse de message | Types de charge utile de réponse |
  | `plugin-sdk/provider-setup` | Helpers sélectionnés de configuration de fournisseur local/autohébergé | Helpers de découverte/configuration de fournisseur autohébergé |
  | `plugin-sdk/self-hosted-provider-setup` | Helpers ciblés de configuration de fournisseur autohébergé compatible OpenAI | Les mêmes helpers de découverte/configuration de fournisseur autohébergé |
  | `plugin-sdk/provider-auth-runtime` | Helpers d’authentification runtime du fournisseur | Helpers runtime de résolution de clé API |
  | `plugin-sdk/provider-auth-api-key` | Helpers de configuration de clé API fournisseur | Helpers d’intégration/écriture de profil de clé API |
  | `plugin-sdk/provider-auth-result` | Helpers de résultat d’authentification fournisseur | Builder standard de résultat d’authentification OAuth |
  | `plugin-sdk/provider-auth-login` | Helpers de connexion interactive du fournisseur | Helpers partagés de connexion interactive |
  | `plugin-sdk/provider-selection-runtime` | Helpers de sélection de fournisseur | Sélection de fournisseur configuré-ou-auto et fusion de configuration brute de fournisseur |
  | `plugin-sdk/provider-env-vars` | Helpers de variables d'environnement du fournisseur | Helpers de recherche de variables d'environnement d'authentification du fournisseur |
  | `plugin-sdk/provider-model-shared` | Helpers partagés de modèle/relecture du fournisseur | `ProviderReplayFamily`, `buildProviderReplayFamilyHooks`, `normalizeModelCompat`, constructeurs partagés de politique de relecture, helpers de point de terminaison du fournisseur et helpers de normalisation d'identifiant de modèle |
  | `plugin-sdk/provider-catalog-shared` | Helpers partagés de catalogue du fournisseur | `findCatalogTemplate`, `buildSingleProviderApiKeyCatalog`, `supportsNativeStreamingUsageCompat`, `applyProviderNativeStreamingUsageCompat` |
  | `plugin-sdk/provider-onboard` | Correctifs d'intégration du fournisseur | Helpers de configuration d'intégration |
  | `plugin-sdk/provider-http` | Helpers HTTP du fournisseur | Helpers génériques de capacité HTTP/point de terminaison du fournisseur, y compris les helpers de formulaire multipart pour la transcription audio |
  | `plugin-sdk/provider-web-fetch` | Helpers web-fetch du fournisseur | Helpers d'enregistrement/de cache du fournisseur web-fetch |
  | `plugin-sdk/provider-web-search-config-contract` | Helpers de configuration de web-search du fournisseur | Helpers ciblés de configuration/d'identifiants web-search pour les fournisseurs qui n'ont pas besoin du câblage d'activation du Plugin |
  | `plugin-sdk/provider-web-search-contract` | Helpers de contrat de web-search du fournisseur | Helpers ciblés de contrat de configuration/d'identifiants web-search tels que `createWebSearchProviderContractFields`, `enablePluginInConfig`, `resolveProviderWebSearchPluginConfig` et setters/getters d'identifiants à portée limitée |
  | `plugin-sdk/provider-web-search` | Helpers de web-search du fournisseur | Helpers d'enregistrement/de cache/d'exécution du fournisseur web-search |
  | `plugin-sdk/provider-tools` | Helpers de compatibilité outil/schéma du fournisseur | `ProviderToolCompatFamily`, `buildProviderToolCompatFamilyHooks`, nettoyage de schéma Gemini + diagnostics, et helpers de compatibilité xAI tels que `resolveXaiModelCompatPatch` / `applyXaiModelCompat` |
  | `plugin-sdk/provider-usage` | Helpers d'utilisation du fournisseur | `fetchClaudeUsage`, `fetchGeminiUsage`, `fetchGithubCopilotUsage` et autres helpers d'utilisation du fournisseur |
  | `plugin-sdk/provider-stream` | Helpers d'enveloppe de flux du fournisseur | `ProviderStreamFamily`, `buildProviderStreamFamilyHooks`, `composeProviderStreamWrappers`, types d'enveloppe de flux et helpers partagés d'enveloppe Anthropic/Bedrock/DeepSeek V4/Google/Kilocode/Moonshot/OpenAI/OpenRouter/Z.A.I/MiniMax/Copilot |
  | `plugin-sdk/provider-transport-runtime` | Helpers de transport du fournisseur | Helpers de transport du fournisseur natif tels que récupération protégée, transformations de messages de transport et flux d'événements de transport inscriptibles |
  | `plugin-sdk/keyed-async-queue` | File asynchrone ordonnée | `KeyedAsyncQueue` |
  | `plugin-sdk/media-runtime` | Helpers multimédias partagés | Helpers de récupération/transformation/stockage des médias ainsi que constructeurs de charges utiles multimédias |
  | `plugin-sdk/media-generation-runtime` | Helpers partagés de génération de médias | Helpers partagés de basculement, sélection de candidats et messages de modèle manquant pour la génération d'images/vidéos/musique |
  | `plugin-sdk/media-understanding` | Helpers de compréhension des médias | Types de fournisseur de compréhension des médias ainsi qu'exports de helpers d'image/audio côté fournisseur |
  | `plugin-sdk/text-runtime` | Helpers de texte partagés | Suppression de texte visible par l'assistant, helpers de rendu/segmentation/tableaux Markdown, helpers de rédaction, helpers de balises de directive, utilitaires de texte sûr et autres helpers liés au texte/journalisation |
  | `plugin-sdk/text-chunking` | Helpers de segmentation de texte | Helper de segmentation de texte sortant |
  | `plugin-sdk/speech` | Helpers vocaux | Types de fournisseur vocaux ainsi que helpers de directive, registre et validation côté fournisseur |
  | `plugin-sdk/speech-core` | Noyau vocal partagé | Types de fournisseur vocaux, registre, directives, normalisation |
  | `plugin-sdk/realtime-transcription` | Helpers de transcription en temps réel | Types de fournisseur, helpers de registre et helper partagé de session WebSocket |
  | `plugin-sdk/realtime-voice` | Helpers vocaux en temps réel | Types de fournisseur, helpers de registre/résolution et helpers de session bridge |
  | `plugin-sdk/image-generation-core` | Noyau partagé de génération d'images | Types de génération d'images, basculement, authentification et helpers de registre |
  | `plugin-sdk/music-generation` | Helpers de génération musicale | Types de fournisseur/requête/résultat de génération musicale |
  | `plugin-sdk/music-generation-core` | Noyau partagé de génération musicale | Types de génération musicale, helpers de basculement, recherche de fournisseur et analyse de model-ref |
  | `plugin-sdk/video-generation` | Helpers de génération vidéo | Types de fournisseur/requête/résultat de génération vidéo |
  | `plugin-sdk/video-generation-core` | Noyau partagé de génération vidéo | Types de génération vidéo, helpers de basculement, recherche de fournisseur et analyse de model-ref |
  | `plugin-sdk/interactive-runtime` | Helpers de réponse interactive | Normalisation/réduction de charges utiles de réponse interactive |
  | `plugin-sdk/channel-config-primitives` | Primitifs de configuration de canal | Primitifs ciblés de schéma de configuration de canal |
  | `plugin-sdk/channel-config-writes` | Helpers d'écriture de configuration de canal | Helpers d'autorisation d'écriture de configuration de canal |
  | `plugin-sdk/channel-plugin-common` | Prélude de canal partagé | Exports de prélude partagés du Plugin de canal |
  | `plugin-sdk/channel-status` | Helpers d'état de canal | Helpers partagés d'instantané/résumé d'état de canal |
  | `plugin-sdk/allowlist-config-edit` | Helpers de configuration de liste d'autorisation | Helpers de lecture/édition de configuration de liste d'autorisation |
  | `plugin-sdk/group-access` | Helpers d'accès de groupe | Helpers partagés de décision d'accès de groupe |
  | `plugin-sdk/direct-dm` | Helpers de message privé direct | Helpers partagés d'authentification/de garde de message privé direct |
  | `plugin-sdk/extension-shared` | Helpers d'extension partagés | Primitifs helpers de canal passif/état et de proxy ambiant |
  | `plugin-sdk/webhook-targets` | Helpers de cibles Webhook | Registre de cibles Webhook et helpers d'installation de routes |
  | `plugin-sdk/webhook-path` | Helpers de chemin Webhook | Helpers de normalisation de chemin Webhook |
  | `plugin-sdk/web-media` | Helpers web multimédias partagés | Helpers de chargement de médias distants/locaux |
  | `plugin-sdk/zod` | Réexport Zod | `zod` réexporté pour les consommateurs du SDK de Plugin |
  | `plugin-sdk/memory-core` | Helpers groupés de memory-core | Surface d'helpers du gestionnaire/configuration/fichier/CLI de mémoire |
  | `plugin-sdk/memory-core-engine-runtime` | Façade d'exécution du moteur de mémoire | Façade d'exécution de l'index/de la recherche de mémoire |
  | `plugin-sdk/memory-core-host-engine-foundation` | Moteur de base de l'hôte mémoire | Exports du moteur de base de l'hôte mémoire |
  | `plugin-sdk/memory-core-host-engine-embeddings` | Moteur d'embeddings de l'hôte mémoire | Contrats d'embeddings de mémoire, accès au registre, fournisseur local et helpers génériques de lot/distant ; les fournisseurs distants concrets résident dans leurs Plugins propriétaires |
  | `plugin-sdk/memory-core-host-engine-qmd` | Moteur QMD de l'hôte mémoire | Exports du moteur QMD de l'hôte mémoire |
  | `plugin-sdk/memory-core-host-engine-storage` | Moteur de stockage de l'hôte mémoire | Exports du moteur de stockage de l'hôte mémoire |
  | `plugin-sdk/memory-core-host-multimodal` | Helpers multimodaux de l'hôte mémoire | Helpers multimodaux de l'hôte mémoire |
  | `plugin-sdk/memory-core-host-query` | Helpers de requête de l'hôte mémoire | Helpers de requête de l'hôte mémoire |
  | `plugin-sdk/memory-core-host-secret` | Helpers secrets de l'hôte mémoire | Helpers secrets de l'hôte mémoire |
  | `plugin-sdk/memory-core-host-events` | Helpers de journal d'événements de l'hôte mémoire | Helpers de journal d'événements de l'hôte mémoire |
  | `plugin-sdk/memory-core-host-status` | Helpers d'état de l'hôte mémoire | Helpers d'état de l'hôte mémoire |
  | `plugin-sdk/memory-core-host-runtime-cli` | Exécution CLI de l'hôte mémoire | Helpers d'exécution CLI de l'hôte mémoire |
  | `plugin-sdk/memory-core-host-runtime-core` | Exécution principale de l'hôte mémoire | Helpers d'exécution principale de l'hôte mémoire |
  | `plugin-sdk/memory-core-host-runtime-files` | Helpers de fichier/d'exécution de l'hôte mémoire | Helpers de fichier/d'exécution de l'hôte mémoire |
  | `plugin-sdk/memory-host-core` | Alias d'exécution principale de l'hôte mémoire | Alias neutre vis-à-vis du fournisseur pour les helpers d'exécution principale de l'hôte mémoire |
  | `plugin-sdk/memory-host-events` | Alias du journal d'événements de l'hôte mémoire | Alias neutre vis-à-vis du fournisseur pour les helpers du journal d'événements de l'hôte mémoire |
  | `plugin-sdk/memory-host-files` | Alias de fichier/d'exécution de l'hôte mémoire | Alias neutre vis-à-vis du fournisseur pour les helpers de fichier/d'exécution de l'hôte mémoire |
  | `plugin-sdk/memory-host-markdown` | Helpers Markdown gérés | Helpers partagés de Markdown géré pour les Plugins adjacents à la mémoire |
  | `plugin-sdk/memory-host-search` | Façade de recherche de Active Memory | Façade d'exécution paresseuse du gestionnaire de recherche de mémoire active |
  | `plugin-sdk/memory-host-status` | Alias d'état de l'hôte mémoire | Alias neutre vis-à-vis du fournisseur pour les helpers d'état de l'hôte mémoire |
  | `plugin-sdk/memory-lancedb` | Helpers groupés de memory-lancedb | Surface d'helpers de memory-lancedb |
  | `plugin-sdk/testing` | Utilitaires de test | Helpers et mocks de test |
</Accordion>

Ce tableau est intentionnellement le sous-ensemble de migration commun, et non la surface complète du SDK. La liste complète des plus de 200 points d'entrée se trouve dans
`scripts/lib/plugin-sdk-entrypoints.json`.

Cette liste inclut toujours certaines interfaces helpers de plugins groupés telles que
`plugin-sdk/feishu`, `plugin-sdk/feishu-setup`, `plugin-sdk/zalo`,
`plugin-sdk/zalo-setup` et `plugin-sdk/matrix*`. Elles restent exportées pour
la maintenance et la compatibilité des plugins groupés, mais elles sont
intentionnellement omises du tableau de migration commun et ne constituent pas
la cible recommandée pour le nouveau code de plugin.

La même règle s'applique à d'autres familles de helpers groupés telles que :

- helpers de prise en charge du navigateur : `plugin-sdk/browser-cdp`, `plugin-sdk/browser-config-runtime`, `plugin-sdk/browser-config-support`, `plugin-sdk/browser-control-auth`, `plugin-sdk/browser-node-runtime`, `plugin-sdk/browser-profiles`, `plugin-sdk/browser-security-runtime`, `plugin-sdk/browser-setup-tools`, `plugin-sdk/browser-support`
- Matrix : `plugin-sdk/matrix*`
- LINE : `plugin-sdk/line*`
- IRC : `plugin-sdk/irc*`
- surfaces de helper/plugin groupées comme `plugin-sdk/googlechat`,
  `plugin-sdk/zalouser`, `plugin-sdk/bluebubbles*`,
  `plugin-sdk/mattermost*`, `plugin-sdk/msteams`,
  `plugin-sdk/nextcloud-talk`, `plugin-sdk/nostr`, `plugin-sdk/tlon`,
  `plugin-sdk/twitch`,
  `plugin-sdk/github-copilot-login`, `plugin-sdk/github-copilot-token`,
  `plugin-sdk/diagnostics-otel`, `plugin-sdk/diagnostics-prometheus`,
  `plugin-sdk/diffs`, `plugin-sdk/llm-task`, `plugin-sdk/thread-ownership`,
  et `plugin-sdk/voice-call`

`plugin-sdk/github-copilot-token` expose actuellement la surface étroite de helper de jeton
`DEFAULT_COPILOT_API_BASE_URL`,
`deriveCopilotApiBaseUrlFromToken` et `resolveCopilotApiToken`.

Utilisez l'import le plus ciblé qui correspond à la tâche. Si vous ne trouvez pas un export,
vérifiez la source dans `src/plugin-sdk/` ou demandez dans Discord.

## Dépréciations actives

Dépréciations plus ciblées qui s'appliquent au SDK de plugin, au contrat de fournisseur,
à la surface d'exécution et au manifeste. Chacune fonctionne encore aujourd'hui,
mais sera supprimée dans une future version majeure. L'entrée sous chaque élément
mappe l'ancienne API à son remplacement canonique.

<AccordionGroup>
  <Accordion title="constructeurs d'aide command-auth → command-status">
    **Ancien (`openclaw/plugin-sdk/command-auth`)** : `buildCommandsMessage`,
    `buildCommandsMessagePaginated`, `buildHelpMessage`.

    **Nouveau (`openclaw/plugin-sdk/command-status`)** : mêmes signatures, mêmes
    exports — simplement importés depuis le sous-chemin plus ciblé. `command-auth`
    les réexporte comme stubs de compatibilité.

    ```typescript
    // Avant
    import { buildHelpMessage } from "openclaw/plugin-sdk/command-auth";

    // Après
    import { buildHelpMessage } from "openclaw/plugin-sdk/command-status";
    ```

  </Accordion>

  <Accordion title="helpers de filtrage des mentions → resolveInboundMentionDecision">
    **Ancien** : `resolveInboundMentionRequirement({ facts, policy })` et
    `shouldDropInboundForMention(...)` depuis
    `openclaw/plugin-sdk/channel-inbound` ou
    `openclaw/plugin-sdk/channel-mention-gating`.

    **Nouveau** : `resolveInboundMentionDecision({ facts, policy })` — renvoie un
    seul objet de décision au lieu de deux appels séparés.

    Les plugins de canal en aval (Slack, Discord, Matrix, MS Teams) ont déjà
    effectué la bascule.

  </Accordion>

  <Accordion title="shim d'exécution de canal et helpers d'actions de canal">
    `openclaw/plugin-sdk/channel-runtime` est un shim de compatibilité pour les anciens
    plugins de canal. Ne l'importez pas dans le nouveau code ; utilisez
    `openclaw/plugin-sdk/channel-runtime-context` pour enregistrer des objets
    d'exécution.

    Les helpers `channelActions*` dans `openclaw/plugin-sdk/channel-actions` sont
    dépréciés en même temps que les exports bruts de canal « actions ». Exposez
    plutôt les capacités via la surface sémantique `presentation` — les plugins
    de canal déclarent ce qu'ils affichent (cartes, boutons, sélecteurs) plutôt
    que les noms d'actions bruts qu'ils acceptent.

  </Accordion>

  <Accordion title="helper tool() de fournisseur de recherche web → createTool() sur le plugin">
    **Ancien** : fabrique `tool()` de `openclaw/plugin-sdk/provider-web-search`.

    **Nouveau** : implémenter `createTool(...)` directement sur le plugin fournisseur.
    OpenClaw n'a plus besoin du helper SDK pour enregistrer l'enveloppe de l'outil.

  </Accordion>

  <Accordion title="enveloppes de canal en texte brut → BodyForAgent">
    **Ancien** : `formatInboundEnvelope(...)` (et
    `ChannelMessageForAgent.channelEnvelope`) pour construire une enveloppe
    d'invite plate en texte brut à partir de messages de canal entrants.

    **Nouveau** : `BodyForAgent` plus des blocs structurés de contexte utilisateur.
    Les plugins de canal attachent les métadonnées de routage (fil, sujet, réponse-à,
    réactions) comme champs typés au lieu de les concaténer dans une chaîne
    d'invite. Le helper `formatAgentEnvelope(...)` reste pris en charge pour les
    enveloppes synthétiques destinées à l'assistant, mais les enveloppes entrantes
    en texte brut sont en voie de disparition.

    Zones affectées : `inbound_claim`, `message_received` et tout plugin de canal
    personnalisé qui post-traitait le texte `channelEnvelope`.

  </Accordion>

  <Accordion title="types de découverte de fournisseur → types de catalogue de fournisseur">
    Quatre alias de type de découverte sont désormais de fines enveloppes autour
    des types de l'ère du catalogue :

    | Ancien alias              | Nouveau type             |
    | ------------------------- | ------------------------ |
    | `ProviderDiscoveryOrder`  | `ProviderCatalogOrder`   |
    | `ProviderDiscoveryContext`| `ProviderCatalogContext` |
    | `ProviderDiscoveryResult` | `ProviderCatalogResult`  |
    | `ProviderPluginDiscovery` | `ProviderPluginCatalog`  |

    Plus l'ancien sac statique `ProviderCapabilities` — les plugins fournisseurs
    doivent attacher les faits de capacité via le contrat d'exécution du fournisseur
    plutôt qu'un objet statique.

  </Accordion>

  <Accordion title="hooks de politique de réflexion → resolveThinkingProfile">
    **Ancien** (trois hooks distincts sur `ProviderThinkingPolicy`) :
    `isBinaryThinking(ctx)`, `supportsXHighThinking(ctx)` et
    `resolveDefaultThinkingLevel(ctx)`.

    **Nouveau** : un unique `resolveThinkingProfile(ctx)` qui renvoie un
    `ProviderThinkingProfile` avec l'`id` canonique, un `label` facultatif et
    une liste ordonnée de niveaux. OpenClaw rétrograde automatiquement les valeurs
    stockées obsolètes selon le rang du profil.

    Implémentez un hook au lieu de trois. Les anciens hooks continuent de fonctionner
    pendant la fenêtre de dépréciation, mais ne sont pas composés avec le résultat
    du profil.

  </Accordion>

  <Accordion title="repli de fournisseur OAuth externe → contracts.externalAuthProviders">
    **Ancien** : implémenter `resolveExternalOAuthProfiles(...)` sans
    déclarer le fournisseur dans le manifeste du plugin.

    **Nouveau** : déclarer `contracts.externalAuthProviders` dans le manifeste
    du plugin **et** implémenter `resolveExternalAuthProfiles(...)`. L'ancien
    chemin de « repli d'authentification » émet un avertissement à l'exécution et
    sera supprimé.

    ```json
    {
      "contracts": {
        "externalAuthProviders": ["anthropic", "openai"]
      }
    }
    ```

  </Accordion>

  <Accordion title="recherche de variable d'environnement de fournisseur → setup.providers[].envVars">
    **Ancien** champ de manifeste : `providerAuthEnvVars: { anthropic: ["ANTHROPIC_API_KEY"] }`.

    **Nouveau** : recopiez la même recherche de variable d'environnement dans `setup.providers[].envVars`
    du manifeste. Cela consolide les métadonnées d'environnement de configuration/état
    en un seul endroit et évite de démarrer l'exécution du plugin uniquement pour
    répondre aux recherches de variables d'environnement.

    `providerAuthEnvVars` reste pris en charge via un adaptateur de compatibilité
    jusqu'à la fin de la fenêtre de dépréciation.

  </Accordion>

  <Accordion title="enregistrement de plugin mémoire → registerMemoryCapability">
    **Ancien** : trois appels distincts —
    `api.registerMemoryPromptSection(...)`,
    `api.registerMemoryFlushPlan(...)`,
    `api.registerMemoryRuntime(...)`.

    **Nouveau** : un appel sur l'API d'état mémoire —
    `registerMemoryCapability(pluginId, { promptBuilder, flushPlanResolver, runtime })`.

    Mêmes emplacements, appel d'enregistrement unique. Les helpers mémoire additifs
    (`registerMemoryPromptSupplement`, `registerMemoryCorpusSupplement`,
    `registerMemoryEmbeddingProvider`) ne sont pas affectés.

  </Accordion>

  <Accordion title="types de messages de session de sous-agent renommés">
    Deux alias de type hérités sont encore exportés depuis `src/plugins/runtime/types.ts` :

    | Ancien                      | Nouveau                        |
    | --------------------------- | ------------------------------ |
    | `SubagentReadSessionParams` | `SubagentGetSessionMessagesParams` |
    | `SubagentReadSessionResult` | `SubagentGetSessionMessagesResult` |

    La méthode d'exécution `readSession` est dépréciée au profit de
    `getSessionMessages`. Même signature ; l'ancienne méthode appelle simplement
    la nouvelle.

  </Accordion>

  <Accordion title="runtime.tasks.flow → runtime.tasks.flows">
    **Ancien** : `runtime.tasks.flow` (singulier) renvoyait un accesseur TaskFlow actif.

    **Nouveau** : `runtime.tasks.flows` (pluriel) renvoie un accès TaskFlow basé sur DTO,
    qui est sûr à l'import et ne nécessite pas le chargement de l'exécution complète
    des tâches.

    ```typescript
    // Avant
    const flow = api.runtime.tasks.flow(ctx);
    // Après
    const flows = api.runtime.tasks.flows(ctx);
    ```

  </Accordion>

  <Accordion title="fabriques d'extension embarquées → middleware de résultat d'outil d'agent">
    Couvert dans « Comment migrer → Migrer les extensions de résultat d'outil Pi vers le
    middleware » ci-dessus. Inclus ici pour exhaustivité : le chemin Pi uniquement
    supprimé `api.registerEmbeddedExtensionFactory(...)` est remplacé par
    `api.registerAgentToolResultMiddleware(...)` avec une liste d'exécution explicite dans
    `contracts.agentToolResultMiddleware`.
  </Accordion>

  <Accordion title="alias OpenClawSchemaType → OpenClawConfig">
    `OpenClawSchemaType` réexporté depuis `openclaw/plugin-sdk` est désormais un
    alias d'une ligne pour `OpenClawConfig`. Préférez le nom canonique.

    ```typescript
    // Avant
    import type { OpenClawSchemaType } from "openclaw/plugin-sdk";
    // Après
    import type { OpenClawConfig } from "openclaw/plugin-sdk/config-schema";
    ```

  </Accordion>
</AccordionGroup>

<Note>
Les dépréciations au niveau des extensions (à l'intérieur des plugins de canal/fournisseur groupés sous
`extensions/`) sont suivies dans leurs propres barrels `api.ts` et `runtime-api.ts`.
Elles n'affectent pas les contrats de plugins tiers et ne sont pas listées
ici. Si vous consommez directement le barrel local d'un plugin groupé, lisez
les commentaires de dépréciation dans ce barrel avant de mettre à niveau.
</Note>

## Calendrier de suppression

| Quand                  | Ce qui se passe                                                       |
| ---------------------- | --------------------------------------------------------------------- |
| **Maintenant**         | Les surfaces dépréciées émettent des avertissements à l'exécution     |
| **Prochaine version majeure** | Les surfaces dépréciées seront supprimées ; les plugins qui les utilisent encore échoueront |

Tous les plugins cœur ont déjà été migrés. Les plugins externes doivent migrer
avant la prochaine version majeure.

## Suppression temporaire des avertissements

Définissez ces variables d'environnement pendant que vous travaillez sur la migration :

```bash
OPENCLAW_SUPPRESS_PLUGIN_SDK_COMPAT_WARNING=1 openclaw gateway run
OPENCLAW_SUPPRESS_EXTENSION_API_WARNING=1 openclaw gateway run
```

Il s'agit d'une échappatoire temporaire, pas d'une solution permanente.

## Lié

- [Getting Started](/fr/plugins/building-plugins) — créer votre premier plugin
- [SDK Overview](/fr/plugins/sdk-overview) — référence complète des imports par sous-chemin
- [Channel Plugins](/fr/plugins/sdk-channel-plugins) — créer des plugins de canal
- [Provider Plugins](/fr/plugins/sdk-provider-plugins) — créer des plugins fournisseurs
- [Plugin Internals](/fr/plugins/architecture) — approfondissement de l'architecture
- [Plugin Manifest](/fr/plugins/manifest) — référence du schéma de manifeste
